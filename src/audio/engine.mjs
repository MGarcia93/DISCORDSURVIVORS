import {
  CUTOFF_DISTANT, DEFAULT_LEVELS, LEVEL_CEILING, SETTINGS_VERSION,
  SFX_MIN_GAP, SFX_VOICES,
} from './mix.mjs';

// One AudioContext for the whole game, with two buses hanging off a master:
// music and SFX. Two contexts would mean two outputs and no way to duck the bed
// under a scene, which is exactly the thing a monophonic shot sound can't do.
//
// Nothing here touches WebAudio until unlock(), so importing it in node (the
// test suite boots the real app) is free and silent.

const SETTINGS_KEY = 'discord-survivors.audio.v1';
const CURVE_STEPS = 32;

function storageOrNull() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

const clamp01 = value => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 1;
};

export class AudioEngine {
  constructor({ storage = storageOrNull() } = {}) {
    this.storage = storage;
    this.buffers = new Map();
    this.laps = new Set();
    this.voices = new Set();
    this.lastPlayed = new Map();
    this.cueSignature = '';
    this.wanted = null;
    this.activeSrc = null;
    this.buffer = null;
    this.loopLength = 0;
    this.fade = 0;
    this.nextLapAt = Infinity;
    this.lapEnd = Infinity;
    this.generation = 0;
    this.reported = new Set();
    const settings = this._readSettings();
    this.muted = settings.muted;
    this.musicLevel = settings.music;
    this.sfxLevel = settings.sfx;
    // A scene is presentation, not gameplay feedback: it rides the music level,
    // because that is the level the player already balanced the story against.
    this.sceneLevel = settings.music;
  }

  // Diagnostics: one console line per distinct failure. Swallowing the reason
  // and leaving silence behind is the worst failure mode there is.
  report(error) {
    const message = String(error?.message ?? error);
    if (this.reported.has(message)) return;
    this.reported.add(message);
    globalThis.console?.warn?.(`[audio] ${message}`);
  }

  _readSettings() {
    const fallback = { muted: false, music: DEFAULT_LEVELS.music, sfx: DEFAULT_LEVELS.sfx };
    let raw = null;
    try { raw = this.storage?.getItem(SETTINGS_KEY); } catch { return fallback; }
    if (!raw) return fallback;
    // The first release stored a bare string; keep reading it.
    if (raw === 'muted' || raw === 'on') return { ...fallback, muted: raw === 'muted' };
    try {
      const parsed = JSON.parse(raw);
      // v1 stored absolute bus levels. 100% now means the judged-good level, so
      // an old number means something else entirely: keep the mute, reset the rest.
      if (parsed.v !== SETTINGS_VERSION) return { ...fallback, muted: Boolean(parsed.muted) };
      return {
        muted: Boolean(parsed.muted),
        music: clamp01(parsed.music ?? DEFAULT_LEVELS.music),
        sfx: clamp01(parsed.sfx ?? DEFAULT_LEVELS.sfx),
      };
    } catch { return fallback; }
  }

  _saveSettings() {
    try {
      this.storage?.setItem(SETTINGS_KEY, JSON.stringify({
        v: SETTINGS_VERSION, muted: this.muted, music: this.musicLevel, sfx: this.sfxLevel,
      }));
    } catch { /* private mode */ }
  }

  // A slider position is not a gain: the bus gain is the position times the
  // ceiling, so 100% is what the mix was judged good at.
  _gainFor(bus) {
    return bus === 'sfx'
      ? this.sfxLevel * LEVEL_CEILING.sfx
      : this.musicLevel * LEVEL_CEILING.music;
  }

  get ready() { return Boolean(this.context); }
  get volumes() { return { music: this.musicLevel, sfx: this.sfxLevel, muted: this.muted }; }

  setMuted(muted) {
    this.muted = Boolean(muted);
    this._saveSettings();
    if (this.context) this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.context.currentTime, 0.03);
    return this.muted;
  }

  toggleMuted() { return this.setMuted(!this.muted); }

  // The player's lever, in slider units: 1 is the judged-good level, not unity
  // gain. The scene bus follows the music slider instead of the SFX one.
  setVolume(bus, value) {
    const level = clamp01(value);
    if (bus === 'music') {
      this.musicLevel = level;
      this.sceneLevel = level;
      if (this.sceneVolume) {
        this.sceneVolume.gain.setTargetAtTime(this._gainFor('music'), this.context.currentTime, 0.03);
      }
    } else if (bus === 'sfx') this.sfxLevel = level;
    else return null;
    this._saveSettings();
    const node = bus === 'music' ? this.musicVolume : this.sfxVolume;
    if (node) node.gain.setTargetAtTime(this._gainFor(bus), this.context.currentTime, 0.03);
    return level;
  }

  // Browsers keep the context suspended until a real gesture. The shell calls
  // this from its click and key handlers; without one there is no music, which
  // is why the bed starts on the first interaction and not on load.
  unlock() {
    const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!Context) return false;
    if (!this.context) this._build(new Context());
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    if (this.wanted && this.wanted.src !== this.activeSrc) this._begin(this.wanted);
    return true;
  }

  _build(context) {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(context.destination);

    // Music: rumble and DC out, crest squashed, then the wave filter. All three
    // live on the bus, so a new track inherits the treatment untouched.
    this.music = context.createGain();
    this.music.gain.value = 0;
    this.musicHighpass = context.createBiquadFilter();
    this.musicHighpass.type = 'highpass';
    this.musicHighpass.frequency.value = 25;
    this.musicFilter = context.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = CUTOFF_DISTANT;
    this.musicFilter.Q.value = 0.4;
    // A peak tamer, not a squash: the provisional track arrives with an 18 dB
    // crest, so the body stays where it is and only the peaks come down under
    // the SFX transients.
    this.musicCompressor = context.createDynamicsCompressor();
    this.musicCompressor.threshold.value = -18;
    this.musicCompressor.knee.value = 10;
    this.musicCompressor.ratio.value = 3.5;
    this.musicCompressor.attack.value = 0.01;
    this.musicCompressor.release.value = 0.3;
    this.musicVolume = context.createGain();
    this.musicVolume.gain.value = this._gainFor('music');
    this.music.connect(this.musicHighpass);
    this.musicHighpass.connect(this.musicFilter);
    this.musicFilter.connect(this.musicCompressor);
    this.musicCompressor.connect(this.musicVolume);
    this.musicVolume.connect(this.master);

    // SFX: a soft limiter, so six stacked voices meet the ceiling as pressure
    // instead of as clipping.
    this.sfx = context.createGain();
    this.sfx.gain.value = 1;
    this.sfxCompressor = context.createDynamicsCompressor();
    this.sfxCompressor.threshold.value = -10;
    this.sfxCompressor.knee.value = 6;
    this.sfxCompressor.ratio.value = 8;
    this.sfxCompressor.attack.value = 0.003;
    this.sfxCompressor.release.value = 0.2;
    this.sfxVolume = context.createGain();
    this.sfxVolume.gain.value = this._gainFor('sfx');
    this.sfx.connect(this.sfxCompressor);
    this.sfxCompressor.connect(this.sfxVolume);
    this.sfxVolume.connect(this.master);

    // Scenes get their own level node, mirrored to the music level. They must
    // not go through the music chain: its low-pass would turn a gunshot into a
    // muffled thud.
    this.sceneVolume = context.createGain();
    this.sceneVolume.gain.value = this._gainFor('music');
    this.sceneVolume.connect(this.master);
  }

  setCue(cue) {
    this.wanted = cue;
    const signature = cue
      ? `${cue.src}|${cue.gain.toFixed(3)}|${Math.round(cue.cutoff)}`
      : 'silence';
    if (signature === this.cueSignature) return;
    this.cueSignature = signature;
    if (!this.context) return;
    const src = cue?.src ?? null;
    if (src !== this.activeSrc) { this._begin(cue); return; }
    if (!cue) return;
    const now = this.context.currentTime;
    this.music.gain.setTargetAtTime(cue.gain, now, 0.3);
    this.musicFilter.frequency.setTargetAtTime(cue.cutoff, now, 0.6);
  }

  _begin(cue) {
    this.activeSrc = cue?.src ?? null;
    this._stopLaps(0.6);
    const now = this.context.currentTime;
    // Come down before going up, so a track switch never overlaps two beds.
    this.music.gain.setTargetAtTime(0, now, 0.08);
    if (!cue) return;
    this.musicFilter.frequency.setValueAtTime(cue.cutoff, now);
    this._start(cue);
  }

  async _start(cue) {
    const token = ++this.generation;
    let buffer;
    try { buffer = await this._load(cue.src); } catch (error) {
      // Silence with no explanation is the worst failure mode there is: say
      // once, in the console, what could not be loaded and why.
      this.error = error;
      this.report(error);
      return;
    }
    if (token !== this.generation || this.wanted?.src !== cue.src) return;
    this.error = null;
    this.buffer = buffer;
    // A track rendered with a decay tail is not loopable as-is: its last 200 ms
    // is silence and its head is loud. Trimming the dead part lets the crossfade
    // blend two loud passages instead of fading in out of nothing.
    this.loopLength = Math.max(0.5, buffer.duration - (cue.trim ?? 0));
    this.fade = Math.min(cue.fade ?? 0.25, this.loopLength / 4);
    const now = this.context.currentTime;
    this.music.gain.setTargetAtTime(cue.gain, now, 0.3);
    this.scheduleLap(now + 0.05);
  }

  async _load(src) {
    if (this.buffers.has(src)) return this.buffers.get(src);
    const response = await fetch(src);
    if (!response.ok) throw Error(`${src}: HTTP ${response.status}`);
    const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
    this.buffers.set(src, buffer);
    return buffer;
  }

  // Stop what is playing without forgetting which track it was.
  _retireLaps(fade) {
    const now = this.context?.currentTime ?? 0;
    for (const lap of this.laps) {
      try {
        lap.gain.gain.cancelScheduledValues(now);
        lap.gain.gain.setTargetAtTime(0, now, Math.max(0.01, fade / 3));
        lap.source.stop(now + fade);
      } catch { /* A lap that already ended owns nothing. */ }
    }
    this.laps.clear();
  }

  _stopLaps(fade) {
    this._retireLaps(fade);
    this.buffer = null;
    this.loopLength = 0;
    this.nextLapAt = Infinity;
    this.lapEnd = Infinity;
  }

  // Two laps overlap across `fade`: the incoming head rises while the outgoing
  // tail falls. Equal-power curves, so the blend keeps a constant loudness
  // instead of dipping in the middle the way two linear ramps would.
  scheduleLap(at) {
    const context = this.context;
    if (!context || !this.buffer) return;
    const length = this.loopLength;
    const fade = this.fade;
    const source = context.createBufferSource();
    source.buffer = this.buffer;
    const gain = context.createGain();
    const rise = new Float32Array(CURVE_STEPS);
    const fall = new Float32Array(CURVE_STEPS);
    for (let i = 0; i < CURVE_STEPS; i++) {
      const t = i / (CURVE_STEPS - 1);
      rise[i] = Math.sin(t * Math.PI / 2);
      fall[i] = Math.cos(t * Math.PI / 2);
    }
    gain.gain.setValueCurveAtTime(rise, at, fade);
    gain.gain.setValueAtTime(1, at + fade);
    gain.gain.setValueCurveAtTime(fall, at + length - fade, fade);
    source.connect(gain);
    gain.connect(this.music);
    source.start(at);
    source.stop(at + length + 0.05);
    const lap = { source, gain };
    source.onended = () => {
      this.laps.delete(lap);
      try { source.disconnect(); gain.disconnect(); } catch { /* already gone */ }
    };
    this.laps.add(lap);
    this.nextLapAt = at + length - fade;
    this.lapEnd = at + length;
  }

  // Called once per frame by the shell.
  tick() {
    if (!this.context || !this.buffer) return;
    const now = this.context.currentTime;
    if (this.nextLapAt - now > this.fade) return;
    // A hidden tab stops requestAnimationFrame while the audio clock keeps
    // running. Scheduling on top of a lap that is still playing doubles the
    // track, which is heard as a second loop entering over the first and never
    // cutting. Retire what is left before starting a fresh lap.
    if (now - this.nextLapAt > 0.5) this._retireLaps(0.2);
    this.scheduleLap(Math.max(this.nextLapAt, now + 0.02));
  }

  // One voice per event, polyphonic on purpose: the narrative path used to stop
  // the previous sound, which in gameplay leaves one shot per burst. `bus` picks
  // which level governs the voice: gameplay feedback, or a scene's presentation.
  playSound(definition, key = null, onError = () => {}, bus = 'sfx') {
    if (!definition || !this.context) return null;
    const now = this.context.currentTime;
    if (key) {
      const gap = SFX_MIN_GAP[key] ?? 0.04;
      if (now - (this.lastPlayed.get(key) ?? -99) < gap) return null;
      this.lastPlayed.set(key, now);
    }
    if (this.voices.size >= SFX_VOICES) return null;
    try {
      return definition.src
        ? this._elementVoice(definition, bus)
        : this._bufferVoice(definition, now, bus);
    } catch (error) {
      this.report(error);
      onError('Sound unavailable. Check the asset or browser audio permission.');
      return null;
    }
  }

  _elementVoice(definition, bus) {
    const element = new Audio(definition.src);
    element.volume = Math.min(1, (definition.gain ?? 0.3) * this._gainFor(bus));
    element.play().catch(() => {});
    const voice = { source: element, gain: null };
    this.voices.add(voice);
    element.onended = () => this.voices.delete(voice);
    return voice;
  }

  _bufferVoice(definition, now, bus = 'sfx') {
    const context = this.context;
    const jitter = definition.jitter ?? {};
    // Every voice is nudged inside its own tolerance, so two identical events
    // never produce two identical bursts. This is what stops a 2.2/s attack
    // from becoming a metronome.
    const spread = amount => (amount ? 1 + (Math.random() * 2 - 1) * amount : 1);
    const gain = context.createGain();
    gain.gain.value = (definition.gain ?? (definition.noise ? 0.16 : 0.06)) * spread(jitter.gain);
    gain.connect(bus === 'scene' ? this.sceneVolume : this.sfx);
    const duration = definition.duration ?? 0.15;
    let source;
    if (definition.noise) {
      // A thrown object is a burst of air, not a tone: a fast decaying buffer
      // through a filter reads as a whoosh instead of a beep.
      const frames = Math.max(1, Math.floor(context.sampleRate * duration));
      const buffer = context.createBuffer(1, frames, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 3;
      const filter = context.createBiquadFilter();
      filter.type = definition.filter ?? 'lowpass';
      filter.frequency.value = (definition.cutoff ?? 1600) * spread(jitter.cutoff);
      filter.Q.value = definition.Q ?? (definition.filter === 'bandpass' ? 1.2 : 0.7);
      source = context.createBufferSource();
      source.buffer = buffer;
      // Resampling noise tilts its whole spectrum: a cheaper, more honest
      // variation than randomising a pitch the noise does not have.
      source.playbackRate.value = spread(jitter.rate);
      source.connect(filter);
      filter.connect(gain);
      source.start(now);
      source.onended = () => {
        this.voices.delete(voice);
        try { source.disconnect(); filter.disconnect(); gain.disconnect(); } catch { /* gone */ }
      };
    } else {
      source = context.createOscillator();
      source.frequency.value = definition.frequency ?? 440;
      source.connect(gain);
      // A tone that just stops clicks. With `release`, it decays instead, which
      // is the difference between a blip and a beep.
      if (definition.release) {
        const peak = gain.gain.value;
        gain.gain.setValueAtTime(peak, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.01), now + duration);
      }
      source.start(now);
      source.stop(now + duration);
      source.onended = () => {
        this.voices.delete(voice);
        try { source.disconnect(); gain.disconnect(); } catch { /* gone */ }
      };
    }
    const voice = { source, gain };
    this.voices.add(voice);
    return voice;
  }

  releaseVoice(voice) {
    if (!voice) return;
    this.voices.delete(voice);
    try {
      if (typeof voice.source?.stop === 'function') voice.source.stop();
      else voice.source?.pause?.();
    } catch { /* already ended */ }
  }
}
