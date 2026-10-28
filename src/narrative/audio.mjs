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
      const source = this.context.createOscillator(), gain = this.context.createGain();
      source.frequency.value = definition.frequency ?? 440;
      gain.gain.value = 0.06;
      source.connect(gain); gain.connect(this.context.destination);
      source.start(); source.stop(this.context.currentTime + (definition.duration ?? 0.15));
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      this.source = source;
    } catch { report('Sound unavailable. Check the asset or browser audio permission.'); }
  }
}
