// The mix decisions: plain data in, plain objects out. The browser half — one
// AudioContext and two buses — lives in engine.mjs. Keeping them apart is what
// lets tests/audio.test.mjs run under `node --test` with no DOM and no WebAudio.
//
// Levels are set against the measured provisional track (RMS -21.6 dBFS, peaks
// -3.4 dBFS, an 18 dB crest). The bed is pulled down and the crest is squashed
// on the bus, so the music lands about 12 dB under the SFX transients instead
// of fighting them. These numbers are a starting point: they are the only place
// to move the whole mix from.

// The slider's 100% is the level the mix was judged good at, not an absolute
// gain. These are the real bus gains at 100%; the player can only go down from
// there. Bumping a ceiling raises what "full" sounds like for everyone.
export const LEVEL_CEILING = { music: 0.3, sfx: 0.15 };

// The sliders start full, because full is the judged-good level. A player who
// wants it quieter pulls them down.
export const DEFAULT_LEVELS = { music: 1, sfx: 1 };

// The user-level settings changed meaning when 100% became the ceiling, so a
// stored v1 number is discarded and only its mute flag is carried over.
export const SETTINGS_VERSION = 2;

// The bed's level before the track's own gain and any ducking. Measured: with
// the provisional track (RMS -21.7 dBFS) this lands the bed near -43.5 dBFS.
// 0.09 is the player's setting, two steps below the 0.9 that shipped first:
// -20 dB of amplitude in total. At this level the bed is a texture under the
// SFX, not a piece of music; the SFX peak about 33 dB above its body. Raising
// it by ear is one constant: 0.18 (-6 dB), 0.28 (-10 dB), 0.45 (-14 dB).
export const MUSIC_BED_GAIN = 0.09;

// The bed opens up wave by wave. One 32 s loop repeated for a six minute run
// reads as an alarm; heard through a filter that opens as the act escalates it
// reads as progress, and it costs one parameter instead of a second track.
// The filter barely changes the level (about 1 dB across the whole band set):
// it is colour, never volume.
export const CUTOFF_DISTANT = 1200;
export const CUTOFF_NEAR = 4000;
export const CUTOFF_OPEN = 18000;
export const CUTOFF_PAUSED = 500;

// The hub is every screen that is not a live run: menu, roster, story pages and
// the dev viewers. It plays the same file as the act, held darker, so walking
// from the menu into a run opens the filter instead of restarting the loop.
export const CUTOFF_HUB = 700;

// Relative multipliers applied on top of the bed. With a low bed these stay
// close to 1: ducking is there to let dialogue through, not to hide the music.
export const DUCK = 0.7;
export const PAUSE = 0.75;

export const TRACKS = {
  // The provisional demo. Replace `src` when the real score lands; nothing else
  // in the game needs to know.
  //
  // `trim` and `fade` describe how the file must be looped: it was rendered with
  // a ~0.2 s decay tail and a loud head, so joining head-to-tail jumps 30 dB.
  // Trim the dead tail and blend the last quarter second into the head, so the
  // seam is a crossfade between two loud passages instead of a fade-in out of
  // silence. A properly looped track sets `trim: 0`.
  'act-01': { src: 'assets/audio/act-01-zomboid.ogg', gain: 1, trim: 0.2, fade: 0.25 },
};

export const FALLBACK_TRACK = 'act-01';

// Gameplay SFX.
//
// `throw` is what El Negro actually does: he hurls a TV remote, a joystick or a
// phone (engine.mjs picks the device). A thrown object does not crack like a
// gunshot — it moves air. So this is a very short band-passed hiss, not the
// narrative `gunshot` from assets/narrative/acts/act-01/manifest.json: that one
// belongs to Jhony's scene, where a gun is what fires.
//
// El Negro throws every 0.45 s (2.2/s, 133 a minute) and the rate upgrades take
// him to 3.1/s. An identical burst on a fixed period does not read as throwing,
// it reads as a drill: the ear locks onto the period. So every voice is
// resampled and re-filtered within `jitter`. Lowering the gain alone would only
// make the drill quiet.
// Defaults sit where the player asked: the bed and both SFX are quiet, and the
// sliders in CONTROLES are the real control. A number here is a starting point,
// not a verdict — the player's own level lives in the engine, not here.
export const SFX = {
  throw: {
    noise: true, duration: 0.055, filter: 'bandpass', cutoff: 2200, Q: 1.2, gain: 0.02,
    jitter: { rate: 0.14, cutoff: 0.2, gain: 0.2 },
  },
  kill: {
    noise: true, duration: 0.2, cutoff: 700, gain: 0.076,
    jitter: { rate: 0.12, cutoff: 0.2, gain: 0.15 },
  },
  down: { frequency: 90, duration: 0.7, gain: 0.052 },
};

// UI feedback: the clicks the player makes, not the world reacting. Same bus as
// the gameplay SFX, because "Efectos" is what a player expects to govern it, but
// its own registry so nobody confuses a menu tap with a hit.
//
// No `jitter` here: a UI sound should sound identical every time. It is the
// weapon that must vary, never the interface.
export const UI = {
  tap: { noise: true, duration: 0.028, filter: 'bandpass', cutoff: 2600, Q: 1.6, gain: 0.05 },
  select: { frequency: 520, duration: 0.07, gain: 0.06, release: true },
  confirm: { frequency: 780, duration: 0.1, gain: 0.08, release: true },
  deny: { frequency: 150, duration: 0.14, gain: 0.07, release: true },
  coin: { noise: true, duration: 0.04, filter: 'bandpass', cutoff: 3400, Q: 2, gain: 0.06 },
};

// A voice per sound, but never more than this many at once: a wave can kill
// faster than the ear separates events, and thirty noise bursts read as a
// hiss, not as throwing.
export const SFX_VOICES = 6;

// A hard ceiling that rate upgrades cannot breach. It sits well above the 3.1/s
// El Negro reaches, so in practice it only catches pathological stacking: the
// anti-fatigue work is the jitter, not this. `ui` only stops a held click from
// machine-gunning the interface.
export const SFX_MIN_GAP = { throw: 0.1, kill: 0.07, ui: 0.04 };

export function trackFor(act) {
  return TRACKS[act?.id] ?? TRACKS[FALLBACK_TRACK];
}

// Ratio across the act: 0 on wave 1, 1 on the boss wave.
export function waveCutoff(wave, bossWave) {
  // The boss wave comes from the act; never assume a default count here.
  const last = Math.max(1, bossWave ?? wave);
  const span = last - 1;
  const ratio = span === 0 ? 1 : Math.min(1, Math.max(0, (wave - 1) / span));
  if (ratio <= 1 / 3) return CUTOFF_DISTANT;
  if (ratio <= 2 / 3) return CUTOFF_NEAR;
  return CUTOFF_OPEN;
}

// The one question the shell asks every frame: what should the bed be doing.
// A null cue means silence — only a game screen with no run, death and victory.
export function musicCue({ screen, run = null, paused = false, blocked = false }) {
  const inRun = screen === 'game';
  if (inRun && !run) return null;
  if (inRun && (run.phase === 'dead' || run.phase === 'won')) return null;
  const track = trackFor(inRun ? run.act : null);
  const cutoff = inRun ? waveCutoff(run.wave, run.act?.boss?.wave) : CUTOFF_HUB;
  const gain = MUSIC_BED_GAIN * (track.gain ?? 1)
    * (inRun && paused ? PAUSE : 1)
    * (inRun && blocked ? DUCK : 1);
  return {
    src: track.src,
    gain,
    cutoff: inRun && paused ? Math.min(cutoff, CUTOFF_PAUSED) : cutoff,
    trim: track.trim ?? 0,
    fade: track.fade ?? 0.25,
  };
}
