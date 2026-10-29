import { ScenePlayer, validateLine } from './runtime.mjs';

export class BanterQueue {
  constructor(characters, { sounds = {}, onSound = () => {} } = {}) {
    this.characters = characters; this.sounds = sounds; this.onSound = onSound; this.clear();
  }
  clear() { this.current = null; this.queue = []; this.time = 0; this.serial = 0; }
  enqueue(line) {
    validateLine(line, this.characters);
    if (line.sound && !Object.hasOwn(this.sounds, line.sound)) throw Error(`Unknown sound: ${line.sound}`);
    const duration = line.duration ?? Math.max(2.5, line.text.length / 16);
    const ttl = line.ttl ?? 12, priority = line.priority ?? 0;
    if (![duration, ttl, priority].every(Number.isFinite) || duration <= 0 || ttl <= 0) throw Error('Invalid banter timing/priority');
    this.queue.push({ expression: 'neutral', ...line, duration, priority, expires: this.time + ttl, serial: this.serial++ });
    // Keep overload bounded. Higher-priority story lines displace optional ones.
    this.queue.sort((a, b) => b.priority - a.priority || a.serial - b.serial);
    this.queue = this.queue.slice(0, 20);
    this.tick(0);
  }
  tick(dt) {
    if (!Number.isFinite(dt) || dt < 0) throw Error('Invalid banter delta');
    this.time += dt;
    if (this.current && this.time >= this.until) this.current = null;
    this.queue = this.queue.filter(line => line.expires > this.time);
    if (!this.current && this.queue.length) {
      this.current = this.queue.shift(); this.until = this.time + this.current.duration;
      if (this.current.sound) this.onSound(this.current.sound);
    }
  }
}

// The shell calls boundaries; the director never advances or mutates combat.
export class WaveDirector {
  constructor(catalog, { onSound = () => {} } = {}) {
    this.catalog = catalog; this.onSound = onSound;
    this.banter = new BanterQueue(catalog.characters, { sounds: catalog.sounds, onSound });
    this.schedule = catalog.banter ?? [];
    this.detach();
  }
  get blocked() { return Boolean(this.player?.active || this.pending); }
  attach(run) {
    this.detach(); this.run = run;
    if (run.phase === 'playing' && run.time === 0) this._boundary('before_wave', run.wave);
  }
  detach() {
    try { this.player?.cancel(); } catch { /* Disposal must always release ownership. */ }
    this.run = null; this.player = null; this.pending = null;
    this.seen = new Set(); this.handled = new Set(); this.flags = Object.create(null);
    this.due = new Set();
    this.error = null; this.banter.clear();
  }
  _allowed() { return this.run && (['shop', 'won'].includes(this.run.phase) || (this.run.phase === 'playing' && this.run.time === 0)); }
  play(id) {
    if (!this._allowed() || this.player?.active) return false;
    const entry = this.catalog.entries.find(item => item.id === id);
    if (!entry || entry.error) { this.error = entry?.error ?? `Unknown scene: ${id}`; return false; }
    if (entry.scene.repeat === 'once' && this.seen.has(id)) return false;
    this.error = null;
    try {
      this.player = new ScenePlayer(entry.scene, {
        characters: this.catalog.characters, sounds: this.catalog.sounds, actions: entry.actions,
        backgrounds: this.catalog.backgrounds, enemies: this.catalog.enemies,
        onSound: this.onSound, onEffect: effect => { this.flags[effect.key] = effect.value; },
      });
      this._record();
      return true;
    } catch (error) { this.player = null; this.error = `${id}: ${error.message}`; return false; }
  }
  _record() {
    if (!this.player || this.player.active) return;
    if (['completed', 'skipped'].includes(this.player.status)) this.seen.add(this.player.scene.id);
    if (this.player.status === 'failed') this.error = `${this.player.scene.id}: ${this.player.error}`;
  }
  _boundary(when, wave, done = () => {}) {
    if (!this._allowed() || this.blocked) return false;
    const key = `${when}:${wave}`;
    if (this.handled.has(key)) { done(); return true; }
    this.handled.add(key);
    this.pending = { ids: this.catalog.bindings.filter(item => item.when === when && item.wave === wave).map(item => item.scene), done };
    this._drain();
    return true;
  }
  _drain() {
    this._record();
    while (this.pending && !this.player?.active) {
      if (this.pending.ids.length) this.play(this.pending.ids.shift());
      else {
        const done = this.pending.done; this.pending = null;
        done();
      }
    }
  }
  observe() {
    if (!this.run || this.blocked) return;
    if (this.run.phase !== 'playing') {
      this.banter.clear();
      if (['shop', 'won'].includes(this.run.phase)) this._boundary('after_wave', this.run.wave);
    }
  }
  nextWave(start) {
    if (!this.run || this.run.phase !== 'shop' || this.run.pendingLevels?.length || this.blocked) return false;
    return this._boundary('before_wave', this.run.wave + 1, start);
  }
  tick(dt) {
    if (this.player?.active) this.player.tick(dt);
    this._drain();
    if (this.run?.phase === 'playing' && !this.blocked) { this._scheduleBanter(); this.banter.tick(dt); }
  }
  // Lines an act schedules during a wave: each one fires once per run, at its
  // own second of its own wave, and never while a scene owns the screen.
  _scheduleBanter() {
    for (const [index, line] of this.schedule.entries()) {
      if (this.due.has(index) || line.wave !== this.run.wave || this.run.time < line.at) continue;
      this.due.add(index);
      this.banter.enqueue({ speaker: line.speaker, expression: line.expression, text: line.text });
    }
  }
  advance() { this.player?.advance(); this._drain(); }
  skip() { this.player?.skip(); this._drain(); }
  fail(message) { this.player?.fail(message); this._drain(); }
  enqueueBanter(line) {
    if (this.run?.phase !== 'playing' || this.blocked) return false;
    this.banter.enqueue(line); return true;
  }
}
