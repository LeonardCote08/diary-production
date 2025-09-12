import { g as getHapticManager } from "./HapticManager-BbDSbiBA.js";
import "./main-C9PBdCor.js";
class MinimalistAudioEngine {
  constructor() {
    this.audioContext = null;
    this.isUnlocked = false;
    this.pendingSounds = [];
    this.activeSources = /* @__PURE__ */ new Set();
    this.currentReveal = "inkDiffusion";
    this.currentActivate = "absorbedImpact";
    this.haptics = getHapticManager();
    this.hapticsEnabled = true;
    this.globalVolume = 2.5;
  }
  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: "interactive",
        sampleRate: 44100
      });
      if (this.audioContext.state === "suspended") {
        const unlock = async () => {
          await this.audioContext.resume();
          this.isUnlocked = true;
          document.removeEventListener("touchstart", unlock);
          document.removeEventListener("click", unlock);
        };
        document.addEventListener("touchstart", unlock);
        document.addEventListener("click", unlock);
      } else {
        this.isUnlocked = true;
      }
      console.log("[MinimalistAudio] Initialized");
      return true;
    } catch (error) {
      console.error("[MinimalistAudio] Init failed:", error);
      return false;
    }
  }
  // Utility: Create pink noise using Paul Kellett's algorithm
  createPinkNoise(duration) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] = pink * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }
  // Utility: Subtle bit crusher for vintage texture
  createSoftBitCrusher(bitDepth = 10) {
    const bufferSize = 256;
    const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    const step = Math.pow(1 / 2, bitDepth);
    let phaser = 0;
    let lastSample = 0;
    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        phaser += 0.9;
        if (phaser >= 1) {
          phaser -= 1;
          lastSample = step * Math.floor(input[i] / step + 0.5);
        }
        output[i] = lastSample;
      }
    };
    return processor;
  }
  // REVELATION SOUNDS (200ms) - Sand variations in OSRS style
  playSandShift() {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const duration = 0.2;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(100, startTime + duration);
    const noiseBuffer = this.createPinkNoise(duration);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 1500;
    const bitCrusher = this.createSoftBitCrusher(8);
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.12;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.08;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
    envelope.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
    envelope.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
    osc.connect(oscGain);
    noise.connect(noiseGain);
    oscGain.connect(filter);
    noiseGain.connect(filter);
    filter.connect(lowpass);
    lowpass.connect(bitCrusher);
    bitCrusher.connect(envelope);
    envelope.connect(ctx.destination);
    osc.start(startTime);
    noise.start(startTime);
    osc.stop(startTime + duration);
    noise.stop(startTime + duration);
  }
  playSandCrystal() {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const duration = 0.18;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 400;
    const modulator = ctx.createOscillator();
    modulator.type = "sine";
    modulator.frequency.value = 400 * 3.5;
    const modGain = ctx.createGain();
    modGain.gain.value = 200;
    modulator.connect(modGain);
    modGain.connect(osc.frequency);
    const square = ctx.createOscillator();
    square.type = "square";
    square.frequency.value = 200;
    const squareGain = ctx.createGain();
    squareGain.gain.value = 0.04;
    const delay = ctx.createDelay(0.01);
    delay.delayTime.value = 3e-3;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.2;
    const bitCrusher = this.createSoftBitCrusher(9);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(0.25, startTime + 8e-3);
    envelope.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
    osc.connect(delay);
    square.connect(squareGain);
    squareGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(bitCrusher);
    bitCrusher.connect(envelope);
    envelope.connect(ctx.destination);
    osc.start(startTime);
    modulator.start(startTime);
    square.start(startTime);
    osc.stop(startTime + duration);
    modulator.stop(startTime + duration);
    square.stop(startTime + duration);
  }
  playSandWhisper() {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const duration = 0.22;
    const bufferSize = ctx.sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const square = ctx.createOscillator();
    square.type = "square";
    square.frequency.value = 250;
    const squareGain = ctx.createGain();
    squareGain.gain.value = 0.02;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1500, startTime);
    filter.frequency.exponentialRampToValueAtTime(3e3, startTime + duration);
    filter.Q.value = 0.3;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2e3;
    const bitCrusher = this.createSoftBitCrusher(10);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
    envelope.gain.linearRampToValueAtTime(0.12, startTime + 0.15);
    envelope.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
    noise.connect(filter);
    square.connect(squareGain);
    squareGain.connect(filter);
    filter.connect(lowpass);
    lowpass.connect(bitCrusher);
    bitCrusher.connect(envelope);
    envelope.connect(ctx.destination);
    noise.start(startTime);
    square.start(startTime);
    noise.stop(startTime + duration);
    square.stop(startTime + duration);
  }
  playSandTrickle() {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const duration = 0.22;
    const grainCount = 12;
    const grainDuration = 0.03;
    for (let i = 0; i < grainCount; i++) {
      const grainStart = startTime + i * 0.015 + Math.random() * 5e-3;
      const bufferSize = ctx.sampleRate * grainDuration;
      const grainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = grainBuffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        const envelope = Math.sin(j / bufferSize * Math.PI);
        data[j] = (Math.random() * 2 - 1) * envelope * 0.3;
      }
      const source = ctx.createBufferSource();
      source.buffer = grainBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2e3 + Math.random() * 3e3;
      filter.Q.value = 0.5 + Math.random() * 0.5;
      const grainGain = ctx.createGain();
      const grainAmp = 0.15 * Math.pow(0.85, i);
      grainGain.gain.setValueAtTime(grainAmp, grainStart);
      grainGain.gain.exponentialRampToValueAtTime(1e-3, grainStart + grainDuration);
      source.connect(filter);
      filter.connect(grainGain);
      grainGain.connect(ctx.destination);
      source.start(grainStart);
      source.stop(grainStart + grainDuration);
    }
    const hissBuffer = this.createPinkNoise(duration);
    const hissSource = ctx.createBufferSource();
    hissSource.buffer = hissBuffer;
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = "highpass";
    hissFilter.frequency.value = 4e3;
    hissFilter.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 7;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0, startTime);
    hissGain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
    hissGain.gain.linearRampToValueAtTime(0.06, startTime + 0.15);
    hissGain.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
    lfo.connect(lfoGain);
    lfoGain.connect(hissGain.gain);
    hissSource.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(ctx.destination);
    hissSource.start(startTime);
    lfo.start(startTime);
    hissSource.stop(startTime + duration);
    lfo.stop(startTime + duration);
  }
  playSandMagic() {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const duration = 0.25;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, startTime);
    osc.frequency.exponentialRampToValueAtTime(1800, startTime + 0.2);
    const modulator = ctx.createOscillator();
    modulator.type = "sine";
    modulator.frequency.value = 250;
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(500, startTime);
    modGain.gain.exponentialRampToValueAtTime(100, startTime + 0.2);
    modulator.connect(modGain);
    modGain.connect(osc.frequency);
    const noiseBuffer = this.createPinkNoise(duration);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.08;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.exponentialRampToValueAtTime(2e3, startTime + 0.2);
    filter.Q.value = 3;
    const bitCrusher = this.createSoftBitCrusher(9);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(0.35, startTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
    osc.connect(filter);
    noiseSource.connect(noiseGain);
    noiseGain.connect(filter);
    filter.connect(bitCrusher);
    bitCrusher.connect(envelope);
    envelope.connect(ctx.destination);
    osc.start(startTime);
    modulator.start(startTime);
    noiseSource.start(startTime);
    osc.stop(startTime + duration);
    modulator.stop(startTime + duration);
    noiseSource.stop(startTime + duration);
  }
  // ACTIVATION SOUNDS (400ms) - When hotspot is clicked
  playAbsorbedImpact() {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const duration = 0.4;
    const impactLength = ctx.sampleRate * 8e-3;
    const impactBuffer = ctx.createBuffer(1, impactLength, ctx.sampleRate);
    const impactData = impactBuffer.getChannelData(0);
    for (let i = 0; i < impactLength; i++) {
      impactData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (impactLength * 0.2)) * 0.7;
    }
    const impactSource = ctx.createBufferSource();
    impactSource.buffer = impactBuffer;
    const impactFilter = ctx.createBiquadFilter();
    impactFilter.type = "lowpass";
    impactFilter.frequency.value = 1e3;
    const bodyOsc1 = ctx.createOscillator();
    const bodyOsc2 = ctx.createOscillator();
    bodyOsc1.type = "sine";
    bodyOsc2.type = "triangle";
    const baseFreq = 180 + Math.random() * 80;
    bodyOsc1.frequency.value = baseFreq;
    bodyOsc2.frequency.value = baseFreq * 0.5;
    const bodyGain1 = ctx.createGain();
    const bodyGain2 = ctx.createGain();
    bodyGain1.gain.setValueAtTime(0, startTime);
    bodyGain1.gain.linearRampToValueAtTime(0.3 * this.globalVolume, startTime + 0.02);
    bodyGain1.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
    bodyGain2.gain.setValueAtTime(0, startTime);
    bodyGain2.gain.linearRampToValueAtTime(0.15 * this.globalVolume, startTime + 0.03);
    bodyGain2.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
    const delay = ctx.createDelay(0.02);
    delay.delayTime.value = 0.012;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.4 * this.globalVolume;
    impactSource.connect(impactFilter);
    impactFilter.connect(masterGain);
    bodyOsc1.connect(bodyGain1);
    bodyOsc2.connect(bodyGain2);
    bodyGain1.connect(delay);
    bodyGain2.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(masterGain);
    masterGain.connect(ctx.destination);
    impactSource.start(startTime);
    bodyOsc1.start(startTime);
    bodyOsc2.start(startTime);
    impactSource.stop(startTime + 8e-3);
    bodyOsc1.stop(startTime + duration);
    bodyOsc2.stop(startTime + duration);
  }
  playPaperWave() {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const duration = 0.4;
    const waveOsc = ctx.createOscillator();
    const detuneOsc = ctx.createOscillator();
    waveOsc.type = "triangle";
    detuneOsc.type = "sine";
    waveOsc.frequency.setValueAtTime(320, startTime);
    waveOsc.frequency.exponentialRampToValueAtTime(160, startTime + duration);
    detuneOsc.frequency.setValueAtTime(325, startTime);
    detuneOsc.frequency.exponentialRampToValueAtTime(155, startTime + duration);
    const modOsc = ctx.createOscillator();
    modOsc.frequency.value = 12;
    const modGain = ctx.createGain();
    modGain.gain.value = 0.3;
    modOsc.connect(modGain);
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(-0.7, startTime);
    panner.pan.linearRampToValueAtTime(0.7, startTime + duration);
    const square = ctx.createOscillator();
    square.type = "square";
    square.frequency.value = 80;
    const squareGain = ctx.createGain();
    squareGain.gain.value = 0.03;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(0.25, startTime + 0.1);
    envelope.gain.linearRampToValueAtTime(0.2, startTime + 0.25);
    envelope.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
    modGain.connect(envelope.gain);
    waveOsc.connect(envelope);
    detuneOsc.connect(envelope);
    square.connect(squareGain);
    squareGain.connect(envelope);
    envelope.connect(panner);
    panner.connect(ctx.destination);
    waveOsc.start(startTime);
    detuneOsc.start(startTime);
    modOsc.start(startTime);
    square.start(startTime);
    waveOsc.stop(startTime + duration);
    detuneOsc.stop(startTime + duration);
    modOsc.stop(startTime + duration);
    square.stop(startTime + duration);
  }
  playInkSaturation() {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const duration = 0.4;
    const fundamental = 120;
    const harmonics = [1, 2, 3, 4, 5, 6];
    const masterGain = ctx.createGain();
    const bitCrusher = this.createSoftBitCrusher(10);
    harmonics.forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = index % 2 === 0 ? "sawtooth" : "square";
      osc.frequency.value = fundamental * harmonic;
      const delayStart = index * 0.05;
      const amplitude = 0.3 / harmonic;
      gain.gain.setValueAtTime(0, startTime + delayStart);
      gain.gain.linearRampToValueAtTime(amplitude, startTime + delayStart + 0.08);
      gain.gain.linearRampToValueAtTime(amplitude * 0.8, startTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, startTime);
    filter.frequency.exponentialRampToValueAtTime(800, startTime + duration);
    filter.Q.setValueAtTime(0.5, startTime);
    filter.Q.linearRampToValueAtTime(3, startTime + duration);
    const waveshaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = i / 128 - 1;
      curve[i] = Math.tanh(x * 1.5);
    }
    waveshaper.curve = curve;
    masterGain.gain.value = 0.35;
    masterGain.connect(bitCrusher);
    bitCrusher.connect(waveshaper);
    waveshaper.connect(filter);
    filter.connect(ctx.destination);
  }
  playSurfaceEcho() {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const duration = 0.4;
    const sourceLength = ctx.sampleRate * 0.15;
    const sourceBuffer = ctx.createBuffer(1, sourceLength, ctx.sampleRate);
    const sourceData = sourceBuffer.getChannelData(0);
    for (let i = 0; i < sourceLength; i++) {
      sourceData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sourceLength * 0.6)) * 0.6;
    }
    const source = ctx.createBufferSource();
    source.buffer = sourceBuffer;
    const square = ctx.createOscillator();
    square.type = "square";
    square.frequency.value = 200;
    const squareGain = ctx.createGain();
    squareGain.gain.value = 0.05;
    const sourceFilter = ctx.createBiquadFilter();
    sourceFilter.type = "bandpass";
    sourceFilter.frequency.value = 800;
    sourceFilter.Q.value = 1.2;
    const delay = ctx.createDelay(0.02);
    delay.delayTime.value = 0.01 + Math.random() * 5e-3;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.45;
    const dampingFilter = ctx.createBiquadFilter();
    dampingFilter.type = "lowpass";
    dampingFilter.frequency.value = 2500;
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const masterGain = ctx.createGain();
    dryGain.gain.value = 0.6;
    wetGain.gain.value = 0.4;
    masterGain.gain.setValueAtTime(0, startTime);
    masterGain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
    source.connect(sourceFilter);
    square.connect(squareGain);
    squareGain.connect(sourceFilter);
    sourceFilter.connect(dryGain);
    sourceFilter.connect(delay);
    delay.connect(wetGain);
    delay.connect(feedback);
    feedback.connect(dampingFilter);
    dampingFilter.connect(delay);
    dryGain.connect(masterGain);
    wetGain.connect(masterGain);
    masterGain.connect(ctx.destination);
    source.start(startTime);
    square.start(startTime);
    source.stop(startTime + 0.15);
    square.stop(startTime + duration);
  }
  // Main play methods
  playReveal() {
    this.playAbsorbedImpact();
    if (this.hapticsEnabled) {
      this.haptics.reveal();
      console.log("[MinimalistAudio] Triggered reveal haptic (100ms)");
    }
  }
  /**
   * Schedule reveal sound at precise audio context time
   * Used by MultimodalSyncEngine for perfect synchronization
   */
  scheduleRevealAt(targetTime) {
    if (!this.audioContext) {
      console.warn("[MinimalistAudio] Cannot schedule - no audio context");
      return;
    }
    const delay = Math.max(0, targetTime - this.audioContext.currentTime);
    setTimeout(() => {
      this.playAbsorbedImpact();
    }, delay * 1e3);
    console.log("[MinimalistAudio] Scheduled reveal at:", targetTime, "delay:", delay * 1e3, "ms");
  }
  playActivate() {
    switch (this.currentActivate) {
      case "absorbedImpact":
        this.playAbsorbedImpact();
        break;
      case "paperWave":
        this.playPaperWave();
        break;
      case "inkSaturation":
        this.playInkSaturation();
        break;
      case "surfaceEcho":
        this.playSurfaceEcho();
        break;
    }
    if (this.hapticsEnabled) {
      this.haptics.activate();
      console.log("[MinimalistAudio] Triggered activate haptic (200ms)");
    }
  }
  /**
   * Schedule activate sound at precise audio context time
   * Used by MultimodalSyncEngine for perfect synchronization
   */
  scheduleActivateAt(targetTime) {
    if (!this.audioContext) {
      console.warn("[MinimalistAudio] Cannot schedule - no audio context");
      return;
    }
    const delay = Math.max(0, targetTime - this.audioContext.currentTime);
    setTimeout(() => {
      this.playActivate();
    }, delay * 1e3);
    console.log("[MinimalistAudio] Scheduled activate at:", targetTime, "delay:", delay * 1e3, "ms");
  }
  // Set current variations
  setRevealSound(sound) {
    this.currentReveal = sound;
  }
  setActivateSound(sound) {
    this.currentActivate = sound;
  }
  // Volume control
  setGlobalVolume(volume) {
    this.globalVolume = Math.max(0.1, Math.min(5, volume));
    console.log(`[MinimalistAudio] Global volume set to ${this.globalVolume}`);
  }
  // Haptic control methods
  setHapticsEnabled(enabled) {
    this.hapticsEnabled = enabled;
    this.haptics.setEnabled(enabled);
    console.log(`[MinimalistAudio] Haptics ${enabled ? "enabled" : "disabled"}`);
  }
  getHapticCapabilities() {
    return this.haptics.getCapabilities();
  }
  testHaptics(type = "reveal") {
    if (type === "reveal") {
      this.haptics.reveal();
    } else if (type === "activate") {
      this.haptics.activate();
    }
  }
}
export {
  MinimalistAudioEngine as default
};
