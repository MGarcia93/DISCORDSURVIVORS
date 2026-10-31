# Audio

Three buses, one `AudioContext`. Read this before adding a sound: the rules here
are what keep a 32-second loop from turning into an alarm.

## Where things live

| Path | What it owns |
| --- | --- |
| `src/audio/mix.mjs` | the decisions: bed levels, wave filter, track registry, SFX definitions |
| `src/audio/engine.mjs` | the browser half: one context, three buses, the lapped loop, the voice pool |
| `src/audio/index.mjs` | the shared engine both the shell and the narrative host import |
| `src/audio/controls.mjs` | one slider row, rendered by the home dialog and the pause overlay |
| `assets/audio/` | the tracks |

`mix.mjs` has no DOM and no WebAudio, so `tests/audio.test.mjs` runs it under
`node --test`. `engine.mjs` builds nothing until `unlock()` — importing it in
node is free.

## The three buses

```
music -> highpass 25 Hz -> lowpass (wave) -> compressor -> musicVolume -> master -> out
sfx   ->                                  compressor -> sfxVolume   -> master -> out
scene ->                                               sceneVolume -> master -> out
```

- The high-pass kills the file's DC offset and rumble.
- The music compressor squashes an 18 dB crest so quiet passages don't vanish
  under the SFX and loud ones don't fight them.
- The SFX compressor is a soft limiter: six stacked voices meet the ceiling as
  pressure, not as clipping.
- **`scene` is presentation, not gameplay feedback.** A story beat rides the
  music level, because that is the level the player balanced the story against.
  It does not go through the music chain: the wave low-pass would turn a gunshot
  into a muffled thud.

Both compressors live on the bus, so a new track inherits the treatment.

## The bed is a function of state

The shell asks `musicCue({ screen, run, paused, blocked })` once per frame. It
returns `{ src, gain, cutoff }` or `null` for silence, and the engine no-ops on
an unchanged signature.

| State | Bed |
| --- | --- |
| the hub: menu, roster, story pages, dev viewers | the act's file, held at `CUTOFF_HUB` (700 Hz) |
| `phase` `playing` | the wave's filter band |
| `phase` `shop` | continues, same wave treatment |
| `phase` `dead` or `won` | silence |
| `paused` | `PAUSE` level, filter closed to 500 Hz |
| a scene owns the screen (`blocked`) | `DUCK` level, same filter |

The hub and the run share one file on purpose: walking from the menu into a run
opens the filter instead of restarting the loop. Only a game screen with no run
has no bed at all.

Ducking is a level change, never a stop. Cutting the music for a dialogue line
is what makes a game feel cheap.

## The wave filter

One loop repeated for a six-minute run reads as an alarm. The bed opens in three
bands instead, so the ear hears escalation:

| Wave (of an act whose boss is wave 6) | Cutoff |
| --- | --- |
| 1–2 | 1200 Hz |
| 3–4 | 4000 Hz |
| 5–boss | 18 kHz |

`waveCutoff(wave, bossWave)` derives the band from the act descriptor, so it
follows the campaign without hard-coding counts. The filter is colour, not
volume: measured across all three bands it changes the track's level by about
1 dB. Never use it to duck.

## Why the loop laps instead of `loop = true`

The provisional Act 1 track was measured: its last 200 ms decays to −46 dB and
its first 10 ms starts at −16 dB. Looping it sample-for-sample turns that 30 dB
cliff into a click every 32 seconds.

Two things make the seam inaudible:

1. **Trim the dead tail.** `TRACKS['act-01'].trim` is 0.2 s, so the lap ends
   where the decay begins instead of where the silence does. Blending two loud
   passages is smooth; fading in out of nothing is not.
2. **Crossfade with an equal-power curve.** `scheduleLap` starts each lap
   `fade` seconds before the previous one ends, with `sin`/`cos` curves
   (`sin² + cos² = 1`). Two linear ramps would dip 3 dB in the middle of every
   seam.

A properly looped track sets `trim: 0` and a shorter `fade`.

**A hidden tab must not stack laps.** `requestAnimationFrame` stops when the tab
is hidden, `context.currentTime` keeps running, and the next frame sees a lap
boundary far in the past. Scheduling on top of a lap that is still playing
doubles the track — heard as a second loop entering over the first and never
cutting. `tick()` retires whatever is left before starting a fresh lap when the
boundary is more than 0.5 s late.

## SFX

`engine.playSound(definition, key)` is polyphonic: one voice per event, capped at
`SFX_VOICES`, with a per-key minimum gap. The narrative host shares the bus, so a
scene sound no longer cuts a kill — it only releases its own voices.

`SFX.throw` is what El Negro actually does: he hurls a TV remote, a joystick or a
phone (`engine.mjs` picks the device). A thrown object does not crack like a
gunshot — it moves air — so the voice is a very short **band-passed** hiss, not
the narrative `gunshot` from `assets/narrative/acts/act-01/manifest.json`. That
one belongs to Jhony's scene, where a gun is what fires.

The engine event is still called `shot`, because a projectile left the player.
The sound is a throw.

### Repetition, not volume, is what fatigues

El Negro's attack is automatic and fires every 0.45 s — 2.22 throws a second,
133 a minute, about 800 in a six-minute run. The rate upgrades take him to 3.1/s
and Solago's Modo Otaku to 2.5/s.

A burst that is identical and exactly on period stops reading as throwing and
starts reading as a drill: the ear locks onto the period. **Lowering the gain
does not fix that** — it only makes the drill quiet.

So every noise voice is nudged inside its own `jitter`:

| Knob | Effect |
| --- | --- |
| `rate` | resamples the burst, tilting its whole spectrum — noise has no pitch to shift, so this is the honest variation |
| `cutoff` | moves the filter, changing how bright the burst is |
| `gain` | ±15%, so the voices breathe instead of matching |

One throw every 0.45 s is fine when no two of them are the same. `SFX_MIN_GAP` is
a hard ceiling for pathological stacking, not the anti-fatigue mechanism.

The throw is deliberately quieter than the kill (`0.10` against `0.38`): a
thrown object is texture, an impact is an event. If the attack still reads as
too much, the honest options are, in order: lower `SFX.throw.gain`, make the
transient shorter, or drop the throw sound entirely and let `kill` carry the
feedback — impacts vary with the wave, a muzzle sound never does.

## UI sounds

`UI` in `mix.mjs` is the interface answering the finger: a tap on any button, a
select on a roster card or an ability, a confirm on an upgrade or the next wave,
a coin on a purchase, a deny for a locked thing. `app.mjs` maps one sound per
kind of click, so every button has a voice instead of silence.

They ride the **SFX** bus, because that is what a player expects "Efectos" to
govern.

Two rules:

1. **No `jitter`.** A weapon must vary; the interface must not. A UI sound that
   changes every press reads as a glitch.
2. **A tone needs `release`.** `down` and the UI blips are oscillators, and an
   oscillator that just stops at full level clicks. `release` decays it to
   silence over its duration.

UI gains stay under the gameplay hits (`0.05`–`0.08` against `kill`'s `0.076`),
so a menu never shouts louder than the arena.



1. Drop the file in `assets/audio/`.
2. Add an entry to `TRACKS` in `src/audio/mix.mjs`, keyed by campaign act id.
3. Nothing else changes. `FALLBACK_TRACK` covers acts that have no track yet.

## The player's own level

Sound has its own menu, not a button: **SONIDO** on the home screen opens a
dialog with both sliders and the mute switch, and the **pause overlay** (`ESC`
during a run) carries the same three controls. Same `volumeRow`/`muteRow` from
`src/audio/controls.mjs`, so a control cannot exist in one place and not the
other. CONTROLES is the key manual and nothing else.

A mute button on its own is a shortcut, not a setting — that is why the switch
lives with the levels.

| Slider | Governs |
| --- | --- |
| `Música` | the bed **and** every scene sound |
| `Efectos` | gameplay feedback: the throw, the kill, the death |

They set `musicVolume`, `sfxVolume` and `sceneVolume` — gain nodes after the
compressors, so they are a listening level, not a re-mix. Turning the bed down
never changes how it is shaped.

**100% is the judged-good level, not unity gain.** `LEVEL_CEILING` is
`{ music: 0.6, sfx: 0.4 }`: the bus gains at a full slider. A slider position is
multiplied by its ceiling, so 100% sounds exactly like where the mix was judged,
and a player who wants less only has to pull down. Bumping a ceiling raises what
"full" means for everyone; the sliders themselves stay 0–100.

`DEFAULT_LEVELS` is therefore `{ music: 1, sfx: 1 }` — full, which is the judged
level.

Settings carry `v: 2`. A v1 payload stored *absolute* bus levels, so its numbers
mean something else now: the reader keeps the mute flag and resets the levels to
full rather than silently making the game quieter.

A focused slider owns its keys — the shell ignores non-`escape` keys while an
`INPUT` has focus, or the arrows would move the player instead of the level.

Both levels and the mute flag are one JSON object under
`discord-survivors.audio.v1`. The first release stored a bare `'muted'` string;
the reader still accepts it, and an old setting gets full levels rather than
silence.

**This is the control that matters.** The constants below are defaults; when the
player says it is too loud, the answer is the slider, not another guess.

## Changing the mix

`MUSIC_BED_GAIN` moves the whole bed. `DUCK` and `PAUSE` are relative to it.

Measured with the provisional track (`lowpass`, before the bus compressor):

| State | RMS | Peak |
| --- | --- | --- |
| hub: menu, roster, story, dev (0.09) | −44.0 dBFS | −28.1 dBFS |
| wave 1–2, fighting (0.09) | −43.5 dBFS | −27.7 dBFS |
| wave 1–2, scene open (0.09 × 0.7) | −46.6 dBFS | −30.8 dBFS |
| wave 5–boss (0.09) | −42.7 dBFS | −25.3 dBFS |
| paused (0.09 × 0.75, 500 Hz) | −46.9 dBFS | −31.1 dBFS |

The SFX voices peak at −34.0 (`throw`, gain 0.02) and −22.4 (`kill`, gain 0.076)
dBFS — an 80% cut on both, as the player asked. With the bed at −43.5 dBFS RMS
the kill still lands about 21 dB above its body, which is the "music under, SFX
on top" the mix is for. If it is not, the sliders are the answer.

At this bed level the music compressor (threshold −18) never engages: its peaks
arrive below the threshold. That is fine — it is protection for a louder final
master, not a tone control.

**The first shipped pass used `MUSIC_BED_GAIN = 0.5` and `DUCK = 0.3`.** Stacked,
that put wave 1 at −39 dBFS — the noise floor, which reads as "there is no
music". Two attenuations multiply; check the product, not each factor. The
second pass used 0.9 and read as too loud; 0.18 was −14 dB below it and 0.09 is
−20 dB below it.

These numbers are a starting point, not a master: the final pass needs ears.

## Not done yet

- One track per act, no stems and no adaptive layers.
- The sliders are levels, not a re-mix: there is no per-bus EQ or ducking
  amount exposed to the player.
