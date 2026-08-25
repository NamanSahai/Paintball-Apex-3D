// Procedural High-Fidelity Web Audio Engine for Paintball Apex 3D
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isInitialized = false;

    this.settings = {
      masterVol: 0.8,
      sfxVol: 1.0,
      musicVol: 0.5
    };

    this.musicOsc1 = null;
    this.musicOsc2 = null;
    this.musicInterval = null;
    this.isPlayingMusic = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.settings.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.settings.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.settings.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolumes(master, sfx, music) {
    this.settings.masterVol = master;
    this.settings.sfxVol = sfx;
    this.settings.musicVol = music;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(master, now, 0.05);
    this.sfxGain.gain.setTargetAtTime(sfx, now, 0.05);
    this.musicGain.gain.setTargetAtTime(music, now, 0.05);
  }

  // Realistic Compressed Air Marker Pop
  playMarkerFire(type = 'electro') {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Layer 1: High pressure air discharge (White noise burst)
    const bufferSize = this.ctx.sampleRate * 0.08;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';

    if (type === 'tactical') {
      noiseFilter.frequency.setValueAtTime(1400, now);
      noiseFilter.Q.setValueAtTime(3.0, now);
    } else if (type === 'shotgun') {
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.Q.setValueAtTime(1.5, now);
    } else if (type === 'plasma') {
      noiseFilter.frequency.setValueAtTime(2800, now);
      noiseFilter.Q.setValueAtTime(5.0, now);
    } else {
      // electro
      noiseFilter.frequency.setValueAtTime(1800, now);
      noiseFilter.Q.setValueAtTime(2.2, now);
    }

    const noiseGain = this.ctx.createGain();
    const noiseDuration = type === 'shotgun' ? 0.12 : 0.07;
    noiseGain.gain.setValueAtTime(type === 'shotgun' ? 0.9 : 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    whiteNoise.start(now);

    // Layer 2: Low-end pneumatic punch (Sine sweep)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = type === 'plasma' ? 'sawtooth' : 'sine';
    const startFreq = type === 'shotgun' ? 180 : (type === 'plasma' ? 440 : 260);
    const endFreq = type === 'plasma' ? 90 : 45;
    subOsc.frequency.setValueAtTime(startFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.06);

    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now);
    subOsc.stop(now + 0.07);

    // Layer 3: Mechanical solenoid click for electro marker
    if (type === 'electro') {
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(3200, now);
      clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.015);
      clickGain.gain.setValueAtTime(0.3, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.02);
    }
  }

  // Paintball Splatter Impact Sound (Wet glossy slap)
  playSplatImpact(isHeavy = false) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.12;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const splatNoise = this.ctx.createBufferSource();
    splatNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isHeavy ? 0.8 : 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    splatNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    splatNoise.start(now);
  }

  // Metallic Target Ding / Clang
  playTargetHit(isBullseye = false, comboCount = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const baseFreq = isBullseye ? 980 : 620;
    // Scale pitch slightly with combo count
    const pitchOffset = Math.min(comboCount * 30, 400);
    const freq = baseFreq + pitchOffset;

    // Harmonic 1 (Pure tone)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Harmonic 2 (Metallic upper partial)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.76, now);

    gain1.gain.setValueAtTime(isBullseye ? 0.6 : 0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + (isBullseye ? 0.45 : 0.25));

    gain2.gain.setValueAtTime(isBullseye ? 0.3 : 0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.sfxGain);
    gain2.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.2);
  }

  // Penalty / Wrong Target Buzzer
  playPenaltyBuzzer() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.setValueAtTime(110, now + 0.1);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Reload Hopper Pod Sound
  playReload() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 1. Pod Cap Pop
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(600, now);
    popOsc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
    popGain.gain.setValueAtTime(0.5, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    popOsc.connect(popGain);
    popGain.connect(this.sfxGain);
    popOsc.start(now);
    popOsc.stop(now + 0.07);

    // 2. Paintballs rattling in hopper
    for (let i = 0; i < 4; i++) {
      const t = now + 0.12 + i * 0.04;
      const rattleOsc = this.ctx.createOscillator();
      const rattleGain = this.ctx.createGain();
      rattleOsc.type = 'triangle';
      rattleOsc.frequency.setValueAtTime(450 + Math.random() * 200, t);
      rattleGain.gain.setValueAtTime(0.2, t);
      rattleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      rattleOsc.connect(rattleGain);
      rattleGain.connect(this.sfxGain);
      rattleOsc.start(t);
      rattleOsc.stop(t + 0.04);
    }
  }

  // Announcer / Stinger Chime
  playStinger(type = 'start') {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const notes = type === 'victory' ? [440, 554, 659, 880] : [523, 659, 784];
    notes.forEach((note, idx) => {
      const t = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // Dynamic Esports Synth Background Beat
  startMusic() {
    if (!this.ctx || this.isPlayingMusic) return;
    this.isPlayingMusic = true;

    let step = 0;
    const bassline = [110, 110, 130, 110, 146, 130, 110, 98];

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || !this.isPlayingMusic) return;
      const now = this.ctx.currentTime;

      // Synth Bass pulse
      const bassFreq = bassline[step % bassline.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + (step % 4 === 0 ? 300 : 0), now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.25);

      // Hi-hat pulse on off-beats
      if (step % 2 === 1) {
        const noise = this.ctx.createBufferSource();
        const bufferSize = this.ctx.sampleRate * 0.03;
        const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buf;

        const hFilter = this.ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(7000, now);

        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(0.08, now);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        noise.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.musicGain);

        noise.start(now);
      }

      step++;
    }, 150); // 200 BPM electronic rhythm
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sound = new AudioEngine();
