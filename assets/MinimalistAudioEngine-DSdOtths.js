import { g as getHapticManager } from "./HapticManager-TrnQVFBm.js";
import "./main-DeDfi9Uz.js";
class DopamineAudioEngine {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.isUnlocked = false;
    this.platform = this.detectPlatform();
    this.lastInteractionTime = 0;
    this.minTimeBetweenSounds = 30;
    this.useAbsorbedImpactForBoth = false;
    this.variations = {
      revelation: [
        { baseFreq: 146.83, sparkleGain: 0.15, attackTime: 0.01 },
        // Original D3
        { baseFreq: 130.81, sparkleGain: 0.2, attackTime: 5e-3 },
        // Lower C3, brighter
        { baseFreq: 164.81, sparkleGain: 0.1, attackTime: 0.015 }
        // Higher E3, subtler
      ],
      activation: [
        { progression: "major", reverbMix: 0.15, sparkleDelay: 0.35 },
        // C-E-G-C
        { progression: "pentatonic", reverbMix: 0.2, sparkleDelay: 0.3 },
        // C-D-E-G-A
        { progression: "fifths", reverbMix: 0.1, sparkleDelay: 0.4 },
        // C-G-C-G
        { progression: "absorbed", reverbMix: 0.05, sparkleDelay: 0 }
        // Absorbed Impact (ancien son)
      ]
    };
    const isMobileDevice = this.platform === "ios" || this.platform === "android";
    this.currentVariation = {
      revelation: 0,
      // Keep revelation as is (we'll use Absorbed Impact for both)
      activation: isMobileDevice ? 3 : 0
      // Absorbed Impact on mobile, C-E-G-C on desktop
    };
    this.useAbsorbedImpactForBoth = isMobileDevice;
    if (isMobileDevice) {
      console.log('[DopamineAudioEngine] Mobile device detected - Using "Absorbed Impact ★" for both TEMPO 1 & TEMPO 2');
    }
    this.metrics = {
      interactions: [],
      sessionStart: Date.now()
    };
  }
  detectPlatform() {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    if (/Android/.test(ua)) return "android";
    return "desktop";
  }
  async initialize() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const config = {
        ios: { sampleRate: 44100, latencyHint: "interactive" },
        android: { sampleRate: 48e3, latencyHint: "balanced" },
        desktop: { sampleRate: 48e3, latencyHint: "interactive" }
      };
      this.audioContext = new AudioContextClass(config[this.platform]);
      if (this.platform === "ios") {
        await this.handleIOSUnlock();
      }
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      this.isInitialized = true;
      this.isUnlocked = true;
      console.log(`[DopamineAudioEngine] Initialized: ${this.audioContext.sampleRate}Hz, platform: ${this.platform}`);
      console.log("[DopamineAudioEngine] Using psychoacoustic optimization for maximum dopamine response");
    } catch (error) {
      console.error("[DopamineAudioEngine] Initialization failed:", error);
      throw error;
    }
  }
  async handleIOSUnlock() {
    const buffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
    console.log("[DopamineAudioEngine] iOS audio unlocked");
  }
  async unlock() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    this.isUnlocked = true;
  }
  // REVELATION SOUND: Dopamine-optimized crystalline ping (200ms)
  playReveal(x = 0, y = 0) {
    if (!this.isInitialized || !this.audioContext) {
      console.warn("[DopamineAudioEngine] Not initialized");
      return;
    }
    const now = Date.now();
    if (now - this.lastInteractionTime < this.minTimeBetweenSounds) {
      console.log("[DopamineAudioEngine] Debounced reveal sound (too fast)");
      return;
    }
    this.lastInteractionTime = now;
    if (this.useAbsorbedImpactForBoth) {
      console.log("[DopamineAudioEngine] Playing Absorbed Impact ★ for REVEAL (mobile default)");
      const startTime2 = this.audioContext.currentTime;
      this.createAbsorbedImpact(startTime2);
      this.recordInteraction("revelation");
      return;
    }
    const variation = this.variations.revelation[this.currentVariation.revelation];
    const baseFreq = variation.baseFreq;
    const randomVariation = 0.8 + Math.random() * 0.4;
    const positionModulation = 1 + (x + y) % 10 * 0.01;
    const freq = baseFreq * randomVariation * positionModulation;
    const startTime = this.audioContext.currentTime;
    const fundamental = this.createFundamental(freq, startTime);
    const fifth = this.createHarmonic(freq * 1.5, 0.4, startTime);
    const sparkle = this.createSparkle(variation.sparkleGain, startTime);
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 3e-3;
    compressor.release.value = 0.25;
    compressor.connect(this.audioContext.destination);
    [fundamental, fifth, sparkle].forEach((layer) => {
      if (layer) layer.connect(compressor);
    });
    this.recordInteraction("revelation");
  }
  createFundamental(freq, startTime) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.35, startTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(1e-3, startTime + 0.2);
    osc.connect(filter);
    filter.connect(gain);
    osc.start(startTime);
    osc.stop(startTime + 0.25);
    return gain;
  }
  createHarmonic(freq, level, startTime) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(level, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(1e-3, startTime + 0.18);
    osc.connect(gain);
    osc.start(startTime);
    osc.stop(startTime + 0.2);
    return gain;
  }
  createSparkle(sparkleGain, startTime) {
    const gain = this.audioContext.createGain();
    gain.gain.value = sparkleGain;
    const sparkleBase = 1500 + Math.random() * 1e3;
    for (let i = 0; i < 3; i++) {
      const osc = this.audioContext.createOscillator();
      const env = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      osc.type = "sine";
      osc.frequency.value = sparkleBase + i * 500 + Math.random() * 200;
      osc.detune.value = (Math.random() - 0.5) * 30;
      filter.type = "highpass";
      filter.frequency.value = 1500;
      filter.Q.value = 0.5;
      const delay = i * 0.01;
      env.gain.setValueAtTime(0, startTime + delay);
      env.gain.linearRampToValueAtTime(0.3, startTime + delay + 5e-3);
      env.gain.exponentialRampToValueAtTime(1e-3, startTime + 0.15);
      osc.connect(filter);
      filter.connect(env);
      env.connect(gain);
      osc.start(startTime + delay);
      osc.stop(startTime + 0.2);
    }
    return gain;
  }
  // ACTIVATION SOUND: RuneScape-inspired C-E-G-C progression (400ms)
  playActivate() {
    if (!this.isInitialized || !this.audioContext) {
      console.warn("[DopamineAudioEngine] Not initialized");
      return;
    }
    const now = Date.now();
    if (now - this.lastInteractionTime < this.minTimeBetweenSounds) {
      return;
    }
    this.lastInteractionTime = now;
    const variation = this.variations.activation[this.currentVariation.activation];
    this.createProgression(variation);
    if (variation.progression !== "absorbed" && variation.sparkleDelay > 0) {
      this.scheduleSparkle(variation.sparkleDelay);
    }
    this.recordInteraction("activation");
  }
  createProgression(variation) {
    const startTime = this.audioContext.currentTime;
    if (variation.progression === "absorbed") {
      this.createAbsorbedImpact(startTime);
      return;
    }
    const semitoneShift = Math.floor(Math.random() * 7) - 3;
    const transposition = Math.pow(2, semitoneShift / 12);
    let baseNotes;
    switch (variation.progression) {
      case "pentatonic":
        baseNotes = [
          { freq: 261.63, time: 0, gain: 0.5 },
          // C4
          { freq: 293.66, time: 0.08, gain: 0.45 },
          // D4
          { freq: 329.63, time: 0.16, gain: 0.4 },
          // E4
          { freq: 392, time: 0.24, gain: 0.45 },
          // G4
          { freq: 440, time: 0.32, gain: 0.6 }
          // A4
        ];
        break;
      case "fifths":
        baseNotes = [
          { freq: 261.63, time: 0, gain: 0.5 },
          // C4
          { freq: 392, time: 0.1, gain: 0.45 },
          // G4
          { freq: 523.25, time: 0.2, gain: 0.5 },
          // C5
          { freq: 392, time: 0.3, gain: 0.6 }
          // G4
        ];
        break;
      default:
        baseNotes = [
          { freq: 261.63, time: 0, gain: 0.5 },
          // C4
          { freq: 329.63, time: 0.1, gain: 0.45 },
          // E4
          { freq: 392, time: 0.2, gain: 0.4 },
          // G4
          { freq: 523.25, time: 0.3, gain: 0.6 }
          // C5 (octave)
        ];
    }
    const notes = baseNotes.map((note) => ({
      ...note,
      freq: note.freq * transposition
    }));
    const masterGain = this.audioContext.createGain();
    masterGain.gain.value = 0.4;
    const convolver = this.audioContext.createConvolver();
    convolver.buffer = this.createReverbImpulse();
    const reverbGain = this.audioContext.createGain();
    reverbGain.gain.value = variation.reverbMix;
    masterGain.connect(this.audioContext.destination);
    masterGain.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(this.audioContext.destination);
    notes.forEach((note, index) => {
      this.createNote(note, masterGain, index === notes.length - 1, startTime);
    });
  }
  createNote(config, destination, isLast, baseTime) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    osc.type = isLast ? "sine" : "square";
    osc.frequency.value = config.freq;
    filter.type = "lowpass";
    const noteStartTime = baseTime + config.time;
    filter.frequency.setValueAtTime(800, noteStartTime);
    filter.frequency.linearRampToValueAtTime(
      isLast ? 4e3 : 2e3,
      noteStartTime + 0.05
    );
    filter.Q.value = 2;
    const attackTime = 5e-3;
    const decayTime = isLast ? 0.15 : 0.08;
    const sustainLevel = config.gain * (isLast ? 0.8 : 0.6);
    const releaseTime = isLast ? 0.2 : 0.1;
    gain.gain.setValueAtTime(0, noteStartTime);
    gain.gain.linearRampToValueAtTime(config.gain, noteStartTime + attackTime);
    gain.gain.linearRampToValueAtTime(sustainLevel, noteStartTime + attackTime + decayTime);
    gain.gain.exponentialRampToValueAtTime(1e-3, noteStartTime + attackTime + decayTime + releaseTime);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc.start(noteStartTime);
    osc.stop(noteStartTime + 0.5);
  }
  scheduleSparkle(delay) {
    const sparkleTime = this.audioContext.currentTime + delay;
    const sparkleBase = 1800 + Math.random() * 400;
    for (let i = 0; i < 5; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const pan = this.audioContext.createStereoPanner();
      osc.type = "sine";
      osc.frequency.value = sparkleBase + i * 617;
      osc.detune.value = (Math.random() - 0.5) * 40;
      pan.pan.value = (Math.random() - 0.5) * 0.3;
      const startTime = sparkleTime + i * 8e-3;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 3e-3);
      gain.gain.exponentialRampToValueAtTime(1e-3, startTime + 0.05);
      osc.connect(gain);
      gain.connect(pan);
      pan.connect(this.audioContext.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.06);
    }
  }
  createReverbImpulse() {
    const length = this.audioContext.sampleRate * 0.1;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    return impulse;
  }
  // Helper: Create noise buffer for texture (from original MobileAudioEngine)
  createNoiseBuffer(duration) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    return buffer;
  }
  // Recreation of the ORIGINAL "Absorbed Impact" sound from commit 780bf05
  createAbsorbedImpact(startTime) {
    const ctx = this.audioContext;
    const duration = 0.4;
    const pitchVariation = 0.9 + Math.random() * 0.2;
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(80 * pitchVariation, startTime);
    osc1.frequency.exponentialRampToValueAtTime(200 * pitchVariation, startTime + 0.1);
    osc1.frequency.exponentialRampToValueAtTime(120 * pitchVariation, startTime + 0.4);
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(160 * pitchVariation, startTime);
    osc2.frequency.exponentialRampToValueAtTime(240 * pitchVariation, startTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(180 * pitchVariation, startTime + 0.4);
    const noiseBuffer = this.createNoiseBuffer(duration);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseLowpass = ctx.createBiquadFilter();
    noiseLowpass.type = "lowpass";
    noiseLowpass.frequency.setValueAtTime(150, startTime);
    noiseLowpass.Q.setValueAtTime(1, startTime);
    const osc1Gain = ctx.createGain();
    const osc2Gain = ctx.createGain();
    const noiseGain = ctx.createGain();
    osc1Gain.gain.setValueAtTime(0, startTime);
    osc1Gain.gain.linearRampToValueAtTime(0.8, startTime + 0.02);
    osc1Gain.gain.linearRampToValueAtTime(0.6, startTime + 0.15);
    osc1Gain.gain.exponentialRampToValueAtTime(1e-3, startTime + 0.4);
    osc2Gain.gain.setValueAtTime(0, startTime);
    osc2Gain.gain.linearRampToValueAtTime(0.5, startTime + 0.03);
    osc2Gain.gain.exponentialRampToValueAtTime(1e-3, startTime + 0.35);
    noiseGain.gain.setValueAtTime(0, startTime);
    noiseGain.gain.linearRampToValueAtTime(0.2, startTime + 5e-3);
    noiseGain.gain.exponentialRampToValueAtTime(1e-3, startTime + 0.1);
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, startTime);
    masterGain.gain.linearRampToValueAtTime(0.8, startTime + 0.01);
    masterGain.gain.linearRampToValueAtTime(0.7, startTime + 0.12);
    masterGain.gain.exponentialRampToValueAtTime(1e-3, startTime + 0.4);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(800, startTime);
    lowpass.frequency.linearRampToValueAtTime(400, startTime + 0.4);
    lowpass.Q.setValueAtTime(1.5, startTime);
    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    noise.connect(noiseLowpass);
    noiseLowpass.connect(noiseGain);
    osc1Gain.connect(masterGain);
    osc2Gain.connect(masterGain);
    noiseGain.connect(masterGain);
    masterGain.connect(lowpass);
    lowpass.connect(ctx.destination);
    osc1.start(startTime);
    osc2.start(startTime);
    noise.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }
  // A/B Testing System
  recordInteraction(type) {
    this.metrics.interactions.push({
      type,
      timestamp: Date.now(),
      variation: type === "revelation" ? this.currentVariation.revelation : this.currentVariation.activation
    });
    const isMobileDevice = this.platform === "ios" || this.platform === "android";
    if (!isMobileDevice) {
      if (this.metrics.interactions.length % 20 === 0) {
        this.rotateVariations();
        this.analyzeMetrics();
      }
    }
  }
  rotateVariations() {
    this.currentVariation.revelation = (this.currentVariation.revelation + 1) % this.variations.revelation.length;
    this.currentVariation.activation = (this.currentVariation.activation + 1) % this.variations.activation.length;
    console.log(
      "[DopamineAudioEngine] Rotated to variations:",
      `Revelation ${this.currentVariation.revelation}`,
      `Activation ${this.currentVariation.activation}`
    );
  }
  analyzeMetrics() {
    const engagementByVariation = {};
    this.metrics.interactions.forEach((interaction, index) => {
      if (index > 0) {
        const timeSinceLastInteraction = interaction.timestamp - this.metrics.interactions[index - 1].timestamp;
        const key = `${interaction.type}_${interaction.variation}`;
        if (!engagementByVariation[key]) {
          engagementByVariation[key] = [];
        }
        engagementByVariation[key].push(timeSinceLastInteraction);
      }
    });
    console.log("[DopamineAudioEngine] Engagement Analysis:", engagementByVariation);
  }
  // Manual variation control for debug panel
  setRevealVariation(index) {
    const isMobileDevice = this.platform === "ios" || this.platform === "android";
    if (isMobileDevice) {
      console.log("[DopamineAudioEngine] Mobile device - keeping Absorbed Impact ★ for reveal");
      return;
    }
    if (index >= 0 && index < this.variations.revelation.length) {
      this.currentVariation.revelation = index;
      console.log(`[DopamineAudioEngine] Set reveal variation to ${index}`);
    }
  }
  setActivationVariation(index) {
    const isMobileDevice = this.platform === "ios" || this.platform === "android";
    if (isMobileDevice) {
      this.currentVariation.activation = 3;
      this.useAbsorbedImpactForBoth = true;
      console.log("[DopamineAudioEngine] Mobile device - forcing Absorbed Impact ★ for both tempos");
      return;
    }
    if (index >= 0 && index < this.variations.activation.length) {
      this.currentVariation.activation = index;
      console.log(`[DopamineAudioEngine] Set activation variation to ${index}`);
      if (index === 3) {
        this.setAbsorbedImpactForBoth(true);
      } else {
        this.setAbsorbedImpactForBoth(false);
      }
    }
  }
  // Enable/disable Absorbed Impact for BOTH reveal and activate
  setAbsorbedImpactForBoth(enabled) {
    const isMobileDevice = this.platform === "ios" || this.platform === "android";
    if (isMobileDevice) {
      this.useAbsorbedImpactForBoth = true;
      this.currentVariation.activation = 3;
      console.log("[DopamineAudioEngine] Mobile device - Absorbed Impact ★ locked as default");
      return;
    }
    this.useAbsorbedImpactForBoth = enabled;
    if (enabled) {
      console.log("[DopamineAudioEngine] Absorbed Impact enabled for BOTH reveal and activate sounds");
    } else {
      console.log("[DopamineAudioEngine] Absorbed Impact disabled for reveal, using normal variations");
    }
  }
  // Get current variation info for debug panel
  getVariationInfo() {
    const activationDescriptions = ["Major C-E-G-C", "Pentatonic", "Fifths", "Absorbed Impact"];
    return {
      revelation: {
        current: this.currentVariation.revelation,
        total: this.variations.revelation.length,
        description: ["Original D3", "Lower C3 Bright", "Higher E3 Subtle"][this.currentVariation.revelation]
      },
      activation: {
        current: this.currentVariation.activation,
        total: this.variations.activation.length,
        description: activationDescriptions[this.currentVariation.activation] || "Unknown"
      },
      metrics: {
        totalInteractions: this.metrics.interactions.length,
        sessionDuration: Math.floor((Date.now() - this.metrics.sessionStart) / 1e3)
      }
    };
  }
  // Test method for development
  async testSounds() {
    console.log("[DopamineAudioEngine] Testing dopamine-optimized sounds...");
    console.log("Current variations:", this.getVariationInfo());
    this.playReveal(100, 100);
    setTimeout(() => {
      this.playActivate();
    }, 1e3);
  }
  // Cleanup
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isInitialized = false;
    this.isUnlocked = false;
    console.log("[DopamineAudioEngine] Engine destroyed");
  }
}
window.dopamineAudioEngine = new DopamineAudioEngine();
class MinimalistAudioEngine extends DopamineAudioEngine {
  constructor() {
    super();
    this.haptics = getHapticManager();
    this.hapticsEnabled = true;
    this.pendingSounds = [];
    this.activeSources = /* @__PURE__ */ new Set();
    this.currentReveal = "dopamineReveal";
    this.currentActivate = "dopamineActivate";
    this.globalVolume = 2.5;
    console.log("[MinimalistAudioEngine] Using DopamineAudioEngine for psychoacoustic optimization");
  }
  async init() {
    await this.initialize();
    return this.isInitialized;
  }
  // Override playReveal to add haptic feedback
  playReveal(x, y) {
    super.playReveal(x, y);
    if (this.hapticsEnabled) {
      this.haptics.reveal();
      console.log("[MinimalistAudio] Triggered reveal haptic (100ms)");
    }
  }
  // Override playActivate to add haptic feedback
  playActivate() {
    super.playActivate();
    if (this.hapticsEnabled) {
      this.haptics.activate();
      console.log("[MinimalistAudio] Triggered activate haptic (200ms)");
    }
  }
  // Compatibility methods that delegate to dopamine engine
  scheduleRevealAt(targetTime) {
    if (!this.audioContext) {
      console.warn("[MinimalistAudio] Cannot schedule - no audio context");
      return;
    }
    const delay = Math.max(0, targetTime - this.audioContext.currentTime);
    setTimeout(() => {
      this.playReveal();
    }, delay * 1e3);
    console.log("[MinimalistAudio] Scheduled reveal at:", targetTime, "delay:", delay * 1e3, "ms");
  }
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
  // Volume control - compatibility
  setGlobalVolume(volume) {
    this.globalVolume = Math.max(0.1, Math.min(5, volume));
    console.log(`[MinimalistAudio] Global volume set to ${this.globalVolume}`);
  }
  // Sound selection - these now control dopamine variations
  setRevealSound(sound) {
    this.currentReveal = sound;
    if (sound.includes("sand") || sound.includes("Shift")) {
      this.setRevealVariation(0);
    } else if (sound.includes("Crystal")) {
      this.setRevealVariation(1);
    } else {
      this.setRevealVariation(2);
    }
  }
  setActivateSound(sound) {
    this.currentActivate = sound;
    if (sound.includes("impact") || sound.includes("Impact")) {
      this.setActivationVariation(0);
    } else if (sound.includes("wave") || sound.includes("Wave")) {
      this.setActivationVariation(1);
    } else {
      this.setActivationVariation(2);
    }
  }
}
if (window.dopamineAudioEngine) {
  window.minimalistAudioEngine = window.dopamineAudioEngine;
}
export {
  MinimalistAudioEngine as default
};
