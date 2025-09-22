import { g as getHapticManager } from "./HapticManager-CtSRhkAh.js";
import "./main-DsITKk88.js";
class MultimodalSyncEngine {
  constructor(audioEngine, visualController) {
    this.audioEngine = audioEngine;
    this.visualController = visualController;
    this.hapticManager = getHapticManager();
    this.audioContext = (audioEngine == null ? void 0 : audioEngine.audioContext) || new (window.AudioContext || window.webkitAudioContext)();
    this.platform = this.detectPlatform();
    this.latencyCompensation = this.getBaseLatencyCompensation();
    this.scheduleLookahead = 0.025;
    this.frameScheduler = /* @__PURE__ */ new Map();
    this.performanceData = [];
    this.maxPerformanceHistory = 50;
    this.adaptiveCompensation = {
      audio: 0,
      visual: 0,
      haptic: 0
    };
    console.log("[MultimodalSyncEngine] Initialized with platform:", this.platform);
    console.log("[MultimodalSyncEngine] Base latency compensation:", this.latencyCompensation);
  }
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent) && !window.MSStream;
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    return {
      isIOS,
      isAndroid,
      isSafari,
      // Don't block iOS from vibration - HapticManager will handle it properly
      hasVibration: "vibrate" in navigator,
      audioLatency: isIOS ? 110 : isAndroid ? 300 : 150,
      name: isIOS ? "iOS" : isAndroid ? "Android" : "Desktop"
    };
  }
  getBaseLatencyCompensation() {
    return {
      haptic: this.platform.isIOS ? 0 : -10,
      // Lead by 10ms on Android
      audio: 0,
      // Reference point (anchor)
      visual: 20
      // Lag by 20ms (brain expects this)
    };
  }
  /**
   * Main trigger method - orchestrates all three modalities
   * @param {Object} tapData - Contains x, y, intensity, etc.
   */
  async triggerSynchronizedFeedback(tapData) {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    const currentTime = this.audioContext.currentTime;
    const targetTime = currentTime + this.scheduleLookahead;
    const timings = this.calculateModalityTimings(targetTime);
    console.log("[MultimodalSyncEngine] Scheduling feedback:", {
      current: currentTime,
      target: targetTime,
      timings: {
        haptic: (timings.haptic - currentTime) * 1e3 + "ms",
        audio: (timings.audio - currentTime) * 1e3 + "ms",
        visual: (timings.visual - currentTime) * 1e3 + "ms"
      }
    });
    const results = await Promise.allSettled([
      this.scheduleHaptic(timings.haptic, tapData),
      this.scheduleAudio(timings.audio, tapData),
      this.scheduleVisual(timings.visual, tapData)
    ]);
    this.recordPerformanceMetrics(tapData, timings, results);
    return results;
  }
  calculateModalityTimings(targetTime) {
    const totalCompensation = {
      haptic: this.latencyCompensation.haptic + this.adaptiveCompensation.haptic,
      audio: this.latencyCompensation.audio + this.adaptiveCompensation.audio,
      visual: this.latencyCompensation.visual + this.adaptiveCompensation.visual
    };
    return {
      haptic: targetTime + totalCompensation.haptic / 1e3,
      audio: targetTime + totalCompensation.audio / 1e3,
      visual: targetTime + totalCompensation.visual / 1e3
    };
  }
  /**
   * Schedule haptic feedback with precise timing
   */
  async scheduleHaptic(targetTime, tapData) {
    if (!this.hapticManager) {
      console.log("[MultimodalSyncEngine] No haptic manager available");
      return { status: "no-haptic-manager" };
    }
    const delay = Math.max(0, (targetTime - this.audioContext.currentTime) * 1e3);
    return new Promise((resolve) => {
      const startMark = `haptic-start-${Date.now()}`;
      setTimeout(() => {
        performance.mark(startMark);
        if (tapData.type === "reveal") {
          this.hapticManager.reveal();
        } else {
          this.hapticManager.activate();
        }
        resolve({
          status: "success",
          actualTime: this.audioContext.currentTime,
          scheduledTime: targetTime
        });
      }, delay);
    });
  }
  /**
   * Schedule audio feedback using Web Audio's sample-accurate timing
   */
  async scheduleAudio(targetTime, tapData) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    if (isMobile) {
      console.log("[MultimodalSyncEngine] Audio disabled on mobile device");
      return { status: "audio-disabled-mobile" };
    }
    if (!this.audioEngine) {
      return { status: "no-audio-engine" };
    }
    return new Promise((resolve) => {
      const startMark = `audio-start-${Date.now()}`;
      if (this.audioEngine.scheduleRevealAt) {
        this.audioEngine.scheduleRevealAt(targetTime);
      } else {
        const delay = Math.max(0, (targetTime - this.audioContext.currentTime) * 1e3);
        setTimeout(() => {
          performance.mark(startMark);
          if (tapData.type === "reveal") {
            this.audioEngine.playReveal();
          } else {
            this.audioEngine.playActivate();
          }
        }, delay);
      }
      resolve({
        status: "success",
        actualTime: this.audioContext.currentTime,
        scheduledTime: targetTime
      });
    });
  }
  /**
   * Schedule visual feedback with frame-accurate timing
   */
  async scheduleVisual(targetTime, tapData) {
    if (!this.visualController) {
      return { status: "no-visual-controller" };
    }
    const delay = Math.max(0, (targetTime - this.audioContext.currentTime) * 1e3);
    return new Promise((resolve) => {
      const startMark = `visual-start-${Date.now()}`;
      if (delay < 16) {
        requestAnimationFrame(() => {
          performance.mark(startMark);
          this.visualController.triggerBorderRadialAnimation(tapData);
          resolve({
            status: "success",
            actualTime: this.audioContext.currentTime,
            scheduledTime: targetTime
          });
        });
      } else {
        setTimeout(() => {
          requestAnimationFrame(() => {
            performance.mark(startMark);
            this.visualController.triggerBorderRadialAnimation(tapData);
            resolve({
              status: "success",
              actualTime: this.audioContext.currentTime,
              scheduledTime: targetTime
            });
          });
        }, delay - 16);
      }
    });
  }
  /**
   * Record performance metrics for adaptive compensation
   */
  recordPerformanceMetrics(tapData, timings, results) {
    const metrics = {
      timestamp: performance.now(),
      tapData,
      scheduledTimings: timings,
      results,
      actualWindow: this.calculateSynchronizationWindow(results)
    };
    this.performanceData.push(metrics);
    if (this.performanceData.length > this.maxPerformanceHistory) {
      this.performanceData.shift();
    }
    this.updateAdaptiveCompensation();
  }
  calculateSynchronizationWindow(results) {
    const actualTimes = results.filter((r) => r.status === "fulfilled" && r.value.actualTime).map((r) => r.value.actualTime);
    if (actualTimes.length < 2) return 0;
    const min = Math.min(...actualTimes);
    const max = Math.max(...actualTimes);
    return (max - min) * 1e3;
  }
  /**
   * Update adaptive compensation based on performance history
   */
  updateAdaptiveCompensation() {
    if (this.performanceData.length < 5) return;
    const recentWindows = this.performanceData.slice(-10).map((m) => m.actualWindow).filter((w) => w > 0);
    if (recentWindows.length === 0) return;
    const avgWindow = recentWindows.reduce((a, b) => a + b, 0) / recentWindows.length;
    if (avgWindow > 33) {
      console.log("[MultimodalSyncEngine] Sync window too wide:", avgWindow, "ms - adjusting");
      this.adaptiveCompensation.visual -= 2;
      this.adaptiveCompensation.haptic += 2;
    } else if (avgWindow < 16 && avgWindow > 0) {
      console.log("[MultimodalSyncEngine] Sync window too tight:", avgWindow, "ms - adjusting");
      this.adaptiveCompensation.visual += 1;
      this.adaptiveCompensation.haptic -= 1;
    }
  }
  /**
   * Get synchronization statistics
   */
  getStatistics() {
    if (this.performanceData.length === 0) {
      return { noData: true };
    }
    const windows = this.performanceData.map((m) => m.actualWindow).filter((w) => w > 0);
    const successfulSyncs = windows.filter((w) => w >= 16 && w <= 33).length;
    return {
      totalEvents: this.performanceData.length,
      averageWindow: windows.reduce((a, b) => a + b, 0) / windows.length,
      minWindow: Math.min(...windows),
      maxWindow: Math.max(...windows),
      successRate: successfulSyncs / windows.length * 100,
      targetWindow: "16-33ms",
      currentCompensation: this.adaptiveCompensation
    };
  }
  /**
   * Manual compensation adjustment for testing
   */
  setManualCompensation(modality, value) {
    if (this.adaptiveCompensation[modality] !== void 0) {
      this.adaptiveCompensation[modality] = value;
      console.log("[MultimodalSyncEngine] Manual compensation set:", modality, value, "ms");
    }
  }
  /**
   * Reset adaptive compensation
   */
  resetCompensation() {
    this.adaptiveCompensation = {
      audio: 0,
      visual: 0,
      haptic: 0
    };
    this.performanceData = [];
    console.log("[MultimodalSyncEngine] Compensation reset");
  }
}
let syncEngineInstance = null;
function getMultimodalSyncEngine(audioEngine, visualController) {
  if (!syncEngineInstance) {
    syncEngineInstance = new MultimodalSyncEngine(audioEngine, visualController);
  }
  return syncEngineInstance;
}
export {
  MultimodalSyncEngine,
  MultimodalSyncEngine as default,
  getMultimodalSyncEngine
};
