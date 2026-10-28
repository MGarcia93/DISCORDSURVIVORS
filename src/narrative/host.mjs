import { loadCatalog } from './catalog.mjs';
import { WaveDirector } from './director.mjs';
import { createPresenter } from './presenter.mjs';
import { NarrativeAudio } from './audio.mjs';

let sharedCatalog;
const defaultLoad = () => { sharedCatalog ??= loadCatalog(); return sharedCatalog; };

// Browser ownership and async loading stay here, not in the combat engine.
export class NarrativeHost {
  constructor({ load = defaultLoad, makeView = createPresenter, audio = new NarrativeAudio() } = {}) {
    this.load = load; this.makeView = makeView; this.audio = audio;
    this.generation = 0; this.director = null; this.loading = false; this.error = null;
  }
  get blocked() { return this.loading || Boolean(this.director?.blocked); }
  async attach(run, root, { preview = false } = {}) {
    this.detach();
    const generation = this.generation;
    this.root = root; this.previewMode = preview; this.loading = true;
    root.hidden = false; root.textContent = 'Loading narrative scenes…';
    try {
      const catalog = await this.load();
      if (this.generation !== generation) return;
      this.catalog = catalog;
      this.director = new WaveDirector(catalog, { onSound: id => this.audio.play(catalog.sounds[id], message => {
        if (this.generation === generation) this.error = message;
      }) });
      this.view = this.makeView(root, catalog, message => {
        if (this.generation === generation) this.fail(message);
      });
      this.director.attach(preview ? { phase: 'shop', wave: 0, time: 0 } : run);
    } catch (error) {
      if (this.generation !== generation) return;
      this.director?.detach(); this.director = null;
      this.view?.dispose(); this.view = null;
      this.error = error.message; root.textContent = `Narrative unavailable: ${error.message}`;
    } finally {
      if (this.generation === generation) { this.loading = false; this.render(); }
    }
  }
  detach() {
    this.generation++; this.director?.detach(); this.director = null;
    this.view?.dispose(); this.view = null; this.audio.stop();
    this.loading = false; this.error = null; this.catalog = null;
  }
  preview(id) {
    if (!this.previewMode || !this.director) return false;
    this.audio.stop(); this.error = null;
    this.director.attach({ phase: 'shop', wave: 0, time: 0 });
    const started = this.director.play(id);
    this.render(); return started;
  }
  tick(dt) {
    const wasBlocking = this.blocked;
    this.director?.tick(Math.min(0.1, dt));
    if (wasBlocking && !this.blocked) this.audio.stop();
  }
  observe() {
    if (this.director?.run?.phase !== 'playing') this.audio.stop();
    this.director?.observe();
  }
  nextWave(start) {
    if (this.loading) return false;
    if (!this.director) { start(); return true; }
    return this.director.nextWave(start);
  }
  advance() { this.director?.advance(); this.render(); }
  skip() { this.audio.stop(); this.director?.skip(); this.render(); }
  fail(message) { this.error = message; this.audio.stop(); this.director?.fail(message); this.render(); }
  enqueueBanter(line) { return this.director?.enqueueBanter(line) ?? false; }
  key(key, repeat = false) {
    if (!this.blocked) return false;
    if (!repeat && (key === 'enter' || key === ' ')) this.advance();
    if (!repeat && key === 'escape') this.skip();
    // Tab is handled by the shell's scene-only focus trap.
    return key !== 'tab';
  }
  render() {
    this.view?.render(this.director?.player, this.director?.banter.current,
      this.error ?? this.director?.error, { preview: this.previewMode });
  }
}
