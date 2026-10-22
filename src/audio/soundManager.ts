/**
 * Procedural Web Audio Sound Synthesizer
 * Zero external audio files or 404 risks.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundEnabled: boolean = true;
  private bgmEnabled: boolean = false;
  private bgmOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private bgmTimer: number | null = null;
  private rollGain: GainNode | null = null;
  private rollOsc: OscillatorNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled && this.rollGain && this.ctx) {
      this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (enabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
  }

  public isBgmEnabled(): boolean {
    return this.bgmEnabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Jump "Boing"
  public playJump() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Bounce "Plop / Squish"
  public playBounce(intensity: number = 0.5) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const vol = Math.min(0.4, 0.15 + intensity * 0.25);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180 + intensity * 60, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Trampoline / Jump Pad Super Bounce
  public playTrampoline() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.25);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Star / Coin Pickup Chime
  public playStarCollect() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      const noteTime = t + idx * 0.06;
      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.26);
    });
  }

  // Speed Booster Whoosh
  public playBooster() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Hazard impact "Bonk"
  public playHazardHit() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.2);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Checkpoint Reached
  public playCheckpoint() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    [440, 880].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0.3, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.32);
    });
  }

  // Victory Fanfare
  public playVictory() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.5, d: 0.35 }, // C6
      { f: 880.0, d: 0.15 },  // A5
      { f: 1046.5, d: 0.5 },  // C6
    ];

    let start = this.ctx.currentTime;
    melody.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, start);

      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.d);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + note.d + 0.05);

      start += note.d * 0.85;
    });
  }

  // Update roll rumble sound
  public updateRollSound(speed: number, isGrounded: boolean) {
    if (!this.soundEnabled || !isGrounded || speed < 0.5) {
      if (this.rollGain && this.ctx) {
        this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }

    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    if (!this.rollOsc) {
      this.rollOsc = this.ctx.createOscillator();
      this.rollGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.rollOsc.type = 'sawtooth';
      this.rollOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.rollOsc.connect(filter);
      filter.connect(this.rollGain);
      this.rollGain.connect(this.masterGain);

      this.rollOsc.start();
    }

    const t = this.ctx.currentTime;
    const targetFreq = Math.min(110, 45 + speed * 4);
    const targetGain = Math.min(0.12, (speed / 15) * 0.1);

    this.rollOsc.frequency.setTargetAtTime(targetFreq, t, 0.05);
    this.rollGain!.gain.setTargetAtTime(targetGain, t, 0.05);
  }

  // Background Music (cheerful 8-bit style loop)
  private startBgm() {
    this.stopBgm();
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    // A simple, warm, catchy countryball adventure melody (C Major pentatonic bouncy sequence)
    const melody = [
      261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 329.63,
      293.66, 349.23, 440.00, 587.33, 440.00, 349.23, 293.66, 392.00,
    ];
    let noteIdx = 0;
    const tempo = 160; // ms per note

    const playStep = () => {
      if (!this.bgmEnabled || !this.ctx || !this.masterGain) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(melody[noteIdx % melody.length], t);

      // Bass undertone
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(melody[noteIdx % melody.length] * 0.5, t);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      bassGain.gain.setValueAtTime(0.04, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.15);
      bassOsc.start(t);
      bassOsc.stop(t + 0.15);

      noteIdx++;
      this.bgmTimer = window.setTimeout(playStep, tempo);
    };

    playStep();
  }

  private stopBgm() {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public dispose() {
    this.stopBgm();
    if (this.rollOsc) {
      try {
        this.rollOsc.stop();
        this.rollOsc.disconnect();
      } catch (e) {}
      this.rollOsc = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundManager = new SoundManager();
