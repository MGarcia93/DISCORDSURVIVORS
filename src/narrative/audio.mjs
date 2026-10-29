// One narrative sound at a time; gameplay audio can later use a separate bus.
export class NarrativeAudio {
  stop() {
    try { this.source?.stop?.(); } catch { /* An oscillator may already have ended. */ }
    if (this.element) { this.element.pause(); this.element.src = ''; }
    this.source = null; this.element = null;
  }
  play(definition, report) {
    this.stop();
    if (!definition) return;
    try {
      if (definition.src) {
        this.element = new Audio(definition.src);
        this.element.volume = 0.3;
        this.element.play().catch(() => report('Sound unavailable. Check the asset or browser audio permission.'));
        return;
      }
      const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!Context) return;
      this.context ??= new Context();
      this.context.resume().catch(() => report('Audio is suspended by the browser.'));
      const gain = this.context.createGain();
      gain.gain.value = definition.gain ?? (definition.noise ? 0.16 : 0.06);
      // A shot is a burst of noise, not a tone: a fast decaying buffer through a
      // low-pass reads as a crack instead of a beep.
      if (definition.noise) {
        const duration = definition.duration ?? 0.15;
        const frames = Math.max(1, Math.floor(this.context.sampleRate * duration));
        const buffer = this.context.createBuffer(1, frames, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 3;
        const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter();
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = definition.cutoff ?? 1600;
        source.connect(filter); filter.connect(gain); gain.connect(this.context.destination);
        source.start();
        source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
        this.source = source;
        return;
      }
      const source = this.context.createOscillator();
      source.frequency.value = definition.frequency ?? 440;
      source.connect(gain); gain.connect(this.context.destination);
      source.start(); source.stop(this.context.currentTime + (definition.duration ?? 0.15));
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      this.source = source;
    } catch { report('Sound unavailable. Check the asset or browser audio permission.'); }
  }
}
