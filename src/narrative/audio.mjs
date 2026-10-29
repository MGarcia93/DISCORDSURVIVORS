import { audio } from '../audio/index.mjs';

// Narrative sounds ride the gameplay SFX bus: they no longer cut each other
// across buses, and they duck the music instead of stopping the world. A scene
// stays monophonic — one line, one sound — by releasing only its own voices.
export class NarrativeAudio {
  constructor(engine = audio) {
    this.engine = engine;
    this.voices = new Set();
  }

  stop() {
    for (const voice of this.voices) this.engine?.releaseVoice(voice);
    this.voices.clear();
  }

  play(definition, report = () => {}) {
    this.stop();
    if (!definition) return;
    // Scenes ride the music level: a story beat is presentation, not gameplay
    // feedback, and the player balanced the story against the music.
    const voice = this.engine?.playSound(definition, null, report, 'scene');
    if (voice) this.voices.add(voice);
  }
}
