import test from 'node:test';
import assert from 'node:assert/strict';
import {
  musicCue, waveCutoff, trackFor, TRACKS, SFX, SFX_MIN_GAP, UI,
  MUSIC_BED_GAIN, DUCK, PAUSE, LEVEL_CEILING,
  CUTOFF_DISTANT, CUTOFF_NEAR, CUTOFF_OPEN, CUTOFF_PAUSED, CUTOFF_HUB,
} from '../src/audio/mix.mjs';
import { AudioEngine } from '../src/audio/engine.mjs';
import { volumeRow } from '../src/audio/controls.mjs';

// The mix is decided by a pure function so the audio that ships is testable
// without a browser. What cannot be tested here — how it sounds — is what the
// dev screen and the ears are for.

const act = { id: 'act-01', boss: { wave: 6 } };
const runAt = (wave, phase = 'playing') => ({ wave, phase, act });

function fakeStorage(initial = []) {
  const store = new Map(initial);
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    dump: () => Object.fromEntries(store),
  };
}

test('every screen has a bed; only a game screen without a run is silent', () => {
  const hub = musicCue({ screen: 'home', run: null });
  assert.ok(hub, 'the menu is not silent');
  assert.equal(hub.cutoff, CUTOFF_HUB, 'the hub is held darker than any wave');
  assert.equal(hub.src, TRACKS['act-01'].src,
    'the hub and the act share one file, so entering a run opens the filter instead of restarting the loop');
  for (const screen of ['characters', 'story', 'worlds', 'enemies', 'narrative']) {
    assert.ok(musicCue({ screen, run: null }), `${screen} has a bed`);
  }
  assert.equal(musicCue({ screen: 'game', run: null }), null, 'a game screen with no run has nothing to score');
  assert.ok(musicCue({ screen: 'game', run: runAt(1) }), 'a live run has a bed');
});

test('the hub ignores run-only ducking', () => {
  const plain = musicCue({ screen: 'home', run: null });
  const noisy = musicCue({ screen: 'home', run: null, paused: true, blocked: true });
  assert.equal(noisy.gain, plain.gain, 'pause and ducking belong to a run, not to the menu');
  assert.equal(noisy.cutoff, plain.cutoff);
});

test('death and victory release the bed', () => {
  assert.equal(musicCue({ screen: 'game', run: runAt(1, 'dead') }), null);
  assert.equal(musicCue({ screen: 'game', run: runAt(6, 'won') }), null);
  assert.ok(musicCue({ screen: 'game', run: runAt(3, 'shop') }), 'the shop between waves keeps the bed');
});

test('the filter opens across the act instead of repeating one flat loop', () => {
  assert.equal(waveCutoff(1, 6), CUTOFF_DISTANT);
  assert.equal(waveCutoff(2, 6), CUTOFF_DISTANT);
  assert.equal(waveCutoff(3, 6), CUTOFF_NEAR);
  assert.equal(waveCutoff(4, 6), CUTOFF_NEAR);
  assert.equal(waveCutoff(5, 6), CUTOFF_OPEN);
  assert.equal(waveCutoff(6, 6), CUTOFF_OPEN);
  assert.equal(waveCutoff(1, 1), CUTOFF_OPEN, 'a one-wave act is already at the boss');
  assert.equal(waveCutoff(99, 6), CUTOFF_OPEN, 'out of range clamps, it does not wrap');
  assert.equal(waveCutoff(0, 6), CUTOFF_DISTANT);
});

test('pause lowers the bed and closes the filter without changing the track', () => {
  const live = musicCue({ screen: 'game', run: runAt(6) });
  const paused = musicCue({ screen: 'game', run: runAt(6), paused: true });
  assert.equal(paused.src, live.src);
  assert.ok(paused.gain < live.gain);
  assert.equal(paused.gain.toFixed(4), (live.gain * PAUSE).toFixed(4));
  assert.equal(paused.cutoff, CUTOFF_PAUSED);
});

test('a scene ducks the bed instead of stopping it', () => {
  const live = musicCue({ screen: 'game', run: runAt(4) });
  const ducked = musicCue({ screen: 'game', run: runAt(4), blocked: true });
  assert.equal(ducked.src, live.src);
  assert.equal(ducked.cutoff, live.cutoff, 'ducking is a level change, not a filter change');
  assert.equal(ducked.gain.toFixed(4), (live.gain * DUCK).toFixed(4));
  assert.ok(ducked.gain > 0, 'ducking must never mute: the scene is not a track change');
});

test('the bed level is one number the whole mix scales from', () => {
  const cue = musicCue({ screen: 'game', run: runAt(1) });
  assert.equal(cue.gain, MUSIC_BED_GAIN);
  assert.ok(cue.gain > 0 && cue.gain < 1, 'the bed sits under the SFX, never at full scale');
});

test('an act without a track falls back to the provisional one', () => {
  assert.equal(trackFor({ id: 'act-01' }), TRACKS['act-01']);
  assert.equal(trackFor({ id: 'act-04' }), TRACKS['act-01']);
  assert.equal(trackFor(undefined), TRACKS['act-01']);
});

test('every gameplay SFX is a definition the engine can voice', () => {
  for (const [name, definition] of Object.entries(SFX)) {
    assert.ok(definition, `${name} exists`);
    assert.ok(definition.duration > 0, `${name} has a duration`);
    assert.ok(definition.gain > 0 && definition.gain < 1, `${name} sits below full scale`);
    assert.ok(definition.noise || definition.frequency > 0, `${name} is either noise or a tone`);
  }
});

test('the throw survives 133 repetitions a minute', () => {
  // El Negro throws every 0.45 s and the rate upgrades take him to 3.1/s. The
  // ear locks onto a fixed period, so an identical burst becomes a drill no
  // matter how quiet it is. Variation is the fix, not volume.
  assert.ok(SFX.throw.jitter?.rate > 0, 'each burst is resampled, so the period never repeats exactly');
  assert.ok(SFX.throw.jitter?.cutoff > 0, 'and its spectrum shifts with it');
  assert.ok(SFX.throw.duration <= 0.08, 'a short transient leaves room for the next throw');
  assert.ok(SFX_MIN_GAP.throw >= 0.1, 'a hard ceiling that rate upgrades cannot breach');
});

test('the thrown object sounds like an object, not a gunshot', () => {
  // El Negro hurls a remote, a joystick or a phone. A gunshot crack would be
  // the wrong weapon, so the voice is band-passed air rather than a low thud.
  assert.equal(SFX.throw.filter, 'bandpass', 'air moving, not a low-frequency thump');
  assert.ok(SFX.throw.cutoff >= 1500, 'and it sits above the music bed');
  assert.ok(SFX.throw.gain <= 0.12, 'a thrown object is texture; the kill is the event');
  assert.ok(SFX.throw.gain < SFX.kill.gain, 'impact carries the feedback, not the throw');
});

test('the engine imports, stores a cue and stays silent without a browser', () => {
  const engine = new AudioEngine({ storage: fakeStorage() });
  assert.equal(engine.ready, false);
  assert.equal(engine.unlock(), false, 'no AudioContext in node means no unlock, not a crash');
  const cue = musicCue({ screen: 'game', run: runAt(1) });
  engine.setCue(cue);
  assert.deepEqual(engine.wanted, cue);
  engine.tick();
  assert.equal(engine.playSound(SFX.throw, 'throw'), null, 'a silent engine returns no voice');
});

test('the cue signature ignores identical frames', () => {
  const engine = new AudioEngine({ storage: fakeStorage() });
  const cue = musicCue({ screen: 'game', run: runAt(2) });
  engine.setCue(cue);
  const first = engine.cueSignature;
  engine.setCue({ ...cue });
  assert.equal(engine.cueSignature, first);
  engine.setCue(musicCue({ screen: 'game', run: runAt(4) }));
  assert.notEqual(engine.cueSignature, first, 'a new wave is a new treatment');
});

test('mute and both levels survive a reload through storage', () => {
  const storage = fakeStorage();
  const engine = new AudioEngine({ storage });
  assert.equal(engine.muted, false);
  assert.deepEqual(engine.volumes, { music: 1, sfx: 1, muted: false }, 'the sliders start full');
  engine.toggleMuted();
  engine.setVolume('music', 0.4);
  engine.setVolume('sfx', 0.25);
  assert.deepEqual(JSON.parse(storage.dump()['discord-survivors.audio.v1']),
    { v: 2, muted: true, music: 0.4, sfx: 0.25 });
  const reloaded = new AudioEngine({ storage });
  assert.equal(reloaded.muted, true);
  assert.equal(reloaded.volumes.music, 0.4);
  assert.equal(reloaded.volumes.sfx, 0.25);
});

test('a stored v1 level is discarded but its mute survives', () => {
  const storage = fakeStorage([['discord-survivors.audio.v1',
    JSON.stringify({ muted: true, music: 0.3, sfx: 0.2 })]]);
  const engine = new AudioEngine({ storage });
  assert.equal(engine.muted, true, 'the mute still means what it said');
  assert.equal(engine.volumes.music, 1, 'a v1 number was an absolute gain, not a slider position');
});

test('the slider at 100% is the level the mix was judged good at', () => {
  const previousContext = globalThis.AudioContext;
  const context = fakeAudioContext();
  globalThis.AudioContext = function Fake() { return context; };
  try {
    const engine = new AudioEngine({ storage: fakeStorage() });
    engine.setCue(null);
    engine.unlock();
    // Full sliders, and yet the buses are not at unity: the ceiling is the mix.
    assert.equal(engine.musicVolume.gain.value, LEVEL_CEILING.music);
    assert.equal(engine.sfxVolume.gain.value, LEVEL_CEILING.sfx);

    engine.setVolume('music', 0.5);
    const target = engine.musicVolume.gain.calls.filter(call => call[0] === 'target').at(-1);
    assert.equal(target[1], LEVEL_CEILING.music * 0.5, 'half a slider is half the judged level');
    assert.equal(engine.volumes.music, 0.5, 'and the slider reads 50%');
  } finally {
    globalThis.AudioContext = previousContext;
  }
});

test('the first release stored a bare mute string and still reads', () => {
  const engine = new AudioEngine({ storage: fakeStorage([['discord-survivors.audio.v1', 'muted']]) });
  assert.equal(engine.muted, true);
  assert.equal(engine.volumes.music, 1, 'an old setting gets the defaults, not silence');
});

test('a level outside 0..1 is clamped, not obeyed', () => {
  const engine = new AudioEngine({ storage: fakeStorage() });
  assert.equal(engine.setVolume('music', 2), 1);
  assert.equal(engine.setVolume('sfx', -3), 0);
  assert.equal(engine.setVolume('nope', 0.5), null);
});

test('a scene rides the music level, not the SFX one', () => {
  const previousContext = globalThis.AudioContext;
  const context = fakeAudioContext();
  globalThis.AudioContext = function Fake() { return context; };
  try {
    const engine = new AudioEngine({ storage: fakeStorage() });
    engine.setCue(null);
    engine.unlock();
    assert.equal(engine.sceneLevel, engine.musicLevel, 'the scene bus starts where the music is');
    assert.equal(engine.sceneVolume.gain.value, LEVEL_CEILING.music);

    engine.setVolume('music', 0.5);
    assert.equal(engine.sceneLevel, 0.5, 'moving music moves scenes with it');
    assert.ok(engine.sceneVolume.gain.calls.some(
      call => call[0] === 'target' && call[1] === LEVEL_CEILING.music * 0.5));

    engine.setVolume('sfx', 0.9);
    assert.equal(engine.sceneLevel, 0.5, 'and the SFX slider leaves scenes alone');

    // A story sound lands on the scene bus; a hit lands on the SFX bus.
    const scene = engine.playSound(SFX.kill, null, () => {}, 'scene');
    const hit = engine.playSound(SFX.kill, null, () => {});
    assert.equal(scene.gain.connected, engine.sceneVolume, 'a scene voice is not gameplay feedback');
    assert.equal(hit.gain.connected, engine.sfx, 'a hit is');
  } finally {
    globalThis.AudioContext = previousContext;
  }
});

test('every UI sound is a definition the engine can voice', () => {
  for (const [name, definition] of Object.entries(UI)) {
    assert.ok(definition.duration > 0, `${name} has a duration`);
    assert.ok(definition.gain > 0 && definition.gain < 0.1, `${name} stays under the gameplay hits`);
    assert.ok(definition.noise || definition.frequency > 0, `${name} is either noise or a tone`);
    assert.equal(definition.jitter, undefined, `${name} must sound identical every time`);
    if (definition.frequency) assert.ok(definition.release, `${name} is a tone and needs a release or it clicks`);
  }
});

test('a tonal UI sound decays instead of clicking off', () => {
  const previousContext = globalThis.AudioContext;
  const context = fakeAudioContext();
  globalThis.AudioContext = function Fake() { return context; };
  try {
    const engine = new AudioEngine({ storage: fakeStorage() });
    engine.setCue(null);
    engine.unlock();
    const voice = engine.playSound(UI.select, 'ui');
    assert.ok(voice, 'the tone is voiced');
    assert.equal(voice.gain.gain.calls.filter(call => call[0] === 'exp').length, 1,
      'the gain decays to silence instead of stopping at full level');
  } finally {
    globalThis.AudioContext = previousContext;
  }
});

test('a volume row carries the contract the shell listens for', () => {
  // The same row is rendered by the home dialog and the pause overlay, so the
  // contract with app.mjs's `input` listener has to be one shape.
  const row = volumeRow('music', 'Música', 'pause');
  assert.match(row, /type="range"/, 'it is a slider');
  assert.match(row, /data-volume="music"/, 'the shell reads the bus from here');
  assert.match(row, /data-volume-label="music"/, 'and writes the readout here');
  assert.match(row, /id="vol-pause-music"/, 'the id is scoped, so two rows never collide');
  assert.match(row, /aria-label="Música"/, 'a slider with no visible label still needs a name');
});

test('an unreadable storage does not break audio', () => {
  const hostile = {
    getItem() { throw Error('denied'); },
    setItem() { throw Error('denied'); },
  };
  const engine = new AudioEngine({ storage: hostile });
  assert.equal(engine.muted, false);
  assert.equal(engine.setMuted(true), true);
});

// The graph below only ever runs in a browser, and a typo there would surface
// as silence with the suite green. A recording fake context exercises the real
// build, the real lap scheduler and the real voice pool.
function fakeAudioContext() {
  const param = value => ({
    value,
    calls: [],
    setValueAtTime(v, t) { this.calls.push(['set', v, t]); this.value = v; return this; },
    linearRampToValueAtTime(v, t) { this.calls.push(['ramp', v, t]); this.value = v; return this; },
    exponentialRampToValueAtTime(v, t) { this.calls.push(['exp', v, t]); this.value = v; return this; },
    setValueCurveAtTime(curve, t, duration) {
      this.calls.push(['curve', Array.from(curve), t, duration]); return this;
    },
    setTargetAtTime(v, t, c) { this.calls.push(['target', v, t, c]); return this; },
    cancelScheduledValues() { return this; },
  });
  const node = extra => ({
    connect(target) { this.connected = target; return this; },
    disconnect() {},
    ...extra,
  });
  const laps = [];
  const context = {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination: node({}),
    resume: () => Promise.resolve(),
    createGain: () => node({ gain: param(1) }),
    createBiquadFilter: () => node({ type: 'lowpass', frequency: param(350), Q: param(1) }),
    createDynamicsCompressor: () => node({
      threshold: param(0), knee: param(0), ratio: param(1), attack: param(0), release: param(0),
    }),
    createBufferSource: () => {
      const source = node({
        buffer: null, onended: null, startedAt: null, stoppedAt: null,
        playbackRate: param(1),
        start(at) { this.startedAt = at; laps.push(this); },
        stop(at) { this.stoppedAt = at; },
      });
      return source;
    },
    createOscillator: () => node({
      frequency: param(440), onended: null,
      start() {}, stop() {},
    }),
    createBuffer: (channels, frames, rate) => ({
      duration: frames / rate,
      getChannelData: () => new Float32Array(frames),
    }),
    decodeAudioData: async () => ({ duration: 2 }),
    laps,
  };
  return context;
}

test('the real graph builds, laps the track and voices gameplay SFX', async () => {
  const previousContext = globalThis.AudioContext;
  const previousFetch = globalThis.fetch;
  const context = fakeAudioContext();
  globalThis.AudioContext = function Fake() { return context; };
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  try {
    const engine = new AudioEngine({ storage: fakeStorage() });
    const cue = musicCue({ screen: 'game', run: runAt(1) });

    // Before a gesture: cue stored, nothing built.
    engine.setCue(cue);
    assert.equal(engine.ready, false);

    assert.equal(engine.unlock(), true);
    assert.equal(engine.ready, true);
    assert.ok(engine.musicCompressor && engine.musicHighpass, 'one music chain: highpass, filter, compressor');

    // The lap loads asynchronously, then starts.
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(engine.buffer.duration, 2);
    assert.equal(engine.laps.size, 1, 'the bed starts as a scheduled lap');

    // The next lap begins before the current one ends: that overlap is the
    // crossfade that hides the file's decay cliff.
    const firstStart = context.laps[0].startedAt;
    assert.ok(engine.nextLapAt < firstStart + engine.buffer.duration,
      'laps overlap instead of butting head to tail');
    assert.ok(engine.nextLapAt > firstStart, 'the next lap is in the future');

    // Idle frames schedule nothing new.
    engine.tick();
    assert.equal(engine.laps.size, 1);
    // A lap boundary schedules the next one.
    context.currentTime = engine.nextLapAt;
    engine.tick();
    assert.equal(engine.laps.size, 2, 'a reached boundary launches the next lap');

    // Polyphony plus the rate limit.
    const voice = engine.playSound(SFX.throw, 'throw');
    assert.ok(voice, 'a shot is voiced');
    assert.equal(engine.playSound(SFX.throw, 'throw'), null, 'a second throw inside the gap is dropped');
    for (let i = 0; i < 10; i++) engine.playSound(SFX.kill, `kill${i}`);
    assert.ok(engine.voices.size <= 6, 'the voice pool stays bounded');

    engine.releaseVoice(voice);
    assert.equal(engine.voices.has(voice), false);

    // Leaving the run releases the bed.
    engine.setCue(null);
    assert.equal(engine.laps.size, 0, 'no track means no scheduled laps');
    assert.equal(engine.activeSrc, null);

    // Mute reaches the master.
    engine.setMuted(true);
    assert.equal(engine.muted, true);
  } finally {
    globalThis.AudioContext = previousContext;
    globalThis.fetch = previousFetch;
  }
});

test('two throws are never the same burst', () => {
  const previousContext = globalThis.AudioContext;
  const context = fakeAudioContext();
  globalThis.AudioContext = function Fake() { return context; };
  try {
    const engine = new AudioEngine({ storage: fakeStorage() });
    engine.setCue(null);
    engine.unlock();
    const rates = [];
    for (let i = 0; i < 8; i++) {
      context.currentTime += 0.2;
      const voice = engine.playSound(SFX.throw, 'throw');
      if (voice) rates.push(voice.source.playbackRate.value);
    }
    assert.ok(rates.length >= 6, 'the shots are voiced');
    assert.ok(new Set(rates).size > 1, 'the burst is resampled per shot, so the period never repeats');
    assert.ok(rates.every(rate => rate > 0.85 && rate < 1.15), 'and it stays inside the declared jitter');
  } finally {
    globalThis.AudioContext = previousContext;
  }
});

test('a cue that arrives before the gesture starts once the context exists', async () => {
  const previousContext = globalThis.AudioContext;
  const previousFetch = globalThis.fetch;
  globalThis.AudioContext = function Fake() { return fakeAudioContext(); };
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  try {
    const engine = new AudioEngine({ storage: fakeStorage() });
    engine.setCue(musicCue({ screen: 'game', run: runAt(6) }));
    assert.equal(engine.ready, false);
    engine.unlock();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(engine.activeSrc, TRACKS['act-01'].src);
    assert.equal(engine.laps.size, 1);
  } finally {
    globalThis.AudioContext = previousContext;
    globalThis.fetch = previousFetch;
  }
});

test('the dead tail is trimmed and the seam is an equal-power crossfade', async () => {
  const previousContext = globalThis.AudioContext;
  const previousFetch = globalThis.fetch;
  const context = fakeAudioContext();
  globalThis.AudioContext = function Fake() { return context; };
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  try {
    const engine = new AudioEngine({ storage: fakeStorage() });
    engine.setCue(musicCue({ screen: 'game', run: runAt(1) }));
    engine.unlock();
    await new Promise(resolve => setImmediate(resolve));

    // The fake decodes a 2 s buffer; the track trims 0.2 s of dead tail.
    assert.equal(engine.loopLength, 1.8);
    assert.equal(engine.fade, 0.25);

    const lap = [...engine.laps][0];
    const curves = lap.gain.gain.calls.filter(call => call[0] === 'curve');
    assert.equal(curves.length, 2, 'one rise and one fall per lap');
    assert.equal(curves[0][1][0], 0, 'the head comes up from silence');
    assert.equal(curves[0][1].at(-1), 1);
    assert.equal(curves[1][1][0], 1, 'the tail goes down to silence');
    assert.ok(Math.abs(curves[1][1].at(-1)) < 1e-9, 'the tail ends at silence');
    // Equal power: sin and cos of the same ramp, so the blend keeps its level.
    const rise = curves[0][1];
    const fall = curves[1][1];
    for (let i = 0; i < rise.length; i++) {
      assert.ok(Math.abs(rise[i] ** 2 + fall[i] ** 2 - 1) < 1e-6, 'sin² + cos² = 1');
    }
    assert.equal(curves[1][2] - lap.source.startedAt, engine.loopLength - engine.fade,
      'the fall starts where the trim ends, not at the raw buffer end');
  } finally {
    globalThis.AudioContext = previousContext;
    globalThis.fetch = previousFetch;
  }
});

test('a wave change or a screen change never restarts or cuts the loop', async () => {
  const previousContext = globalThis.AudioContext;
  const previousFetch = globalThis.fetch;
  const context = fakeAudioContext();
  globalThis.AudioContext = function Fake() { return context; };
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  try {
    const engine = new AudioEngine({ storage: fakeStorage() });
    engine.setCue(musicCue({ screen: 'game', run: runAt(1) }));
    engine.unlock();
    await flush();
    const lap = [...engine.laps][0];
    const scheduled = context.laps.length;
    assert.equal(engine.laps.size, 1);

    // Wave 1 -> wave 4: the filter band changes, the loop does not.
    engine.setCue(musicCue({ screen: 'game', run: runAt(4) }));
    await flush();
    assert.equal(engine.laps.size, 1, 'the same lap keeps playing');
    assert.ok(engine.laps.has(lap), 'it is not retired for a wave change');
    assert.equal(context.laps.length, scheduled, 'no new lap is created');
    assert.equal(engine.activeSrc, TRACKS['act-01'].src, 'the track never changed');

    // Leaving the run for the hub: same file, so still no restart.
    engine.setCue(musicCue({ screen: 'home', run: null }));
    await flush();
    assert.equal(engine.laps.size, 1, 'the hub reuses the same lap');
    assert.ok(engine.laps.has(lap), 'and it is still the same one');
    assert.equal(context.laps.length, scheduled, 'no second lap on the way out');
  } finally {
    globalThis.AudioContext = previousContext;
    globalThis.fetch = previousFetch;
  }
});

test('a hidden tab does not stack a second loop over the first', async () => {
  const previousContext = globalThis.AudioContext;
  const previousFetch = globalThis.fetch;
  const context = fakeAudioContext();
  globalThis.AudioContext = function Fake() { return context; };
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  try {
    const engine = new AudioEngine({ storage: fakeStorage() });
    engine.setCue(musicCue({ screen: 'game', run: runAt(1) }));
    engine.unlock();
    await new Promise(resolve => setImmediate(resolve));

    const firstLap = [...engine.laps][0];
    // requestAnimationFrame stops in a hidden tab; the audio clock does not.
    context.currentTime = engine.nextLapAt + 5;
    engine.tick();

    assert.equal(engine.laps.size, 1, 'the stale lap is retired before the new one starts');
    assert.ok(!engine.laps.has(firstLap), 'and it is no longer tracked');
    assert.ok(firstLap.source.stoppedAt <= context.currentTime + 0.25, 'it is told to stop now');
  } finally {
    globalThis.AudioContext = previousContext;
    globalThis.fetch = previousFetch;
  }
});
