import { _ as __vitePreload } from "./main-C6L26m2B.js";
class HapticManager {
  constructor(options = {}) {
    this.hasVibrationAPI = "vibrate" in navigator;
    this.isSecureContext = window.isSecureContext;
    this.userAgent = navigator.userAgent.toLowerCase();
    this.isIOS = /ipad|iphone|ipod/.test(this.userAgent);
    this.isAndroid = /android/.test(this.userAgent);
    this.isSafari = /safari/.test(this.userAgent) && !/chrome/.test(this.userAgent);
    this.iOSVersion = this.getIOSVersion();
    this.supportsIOSHaptics = this.isIOS && this.iOSVersion >= 17.4;
    this.enabled = options.enabled ?? true;
    this.patterns = {
      reveal: 50,
      // Subtle pulse for hotspot reveal (reduced from 100ms)
      activate: 70,
      // Gentle pulse for hotspot activation (reduced from 120ms)
      success: [30, 50, 30],
      error: [50, 30, 50, 30, 50],
      warning: [100, 50, 100]
    };
    this.lastVibration = 0;
    this.minInterval = 50;
    this.iosHaptics = null;
    this.lastUserInteraction = Date.now();
    this.setupUserInteractionTracking();
    if (this.supportsIOSHaptics) {
      this.initIOSHaptics();
    }
    this.log("HapticManager initialized", {
      iOS: this.isIOS,
      Android: this.isAndroid,
      hasVibrationAPI: this.hasVibrationAPI,
      supportsIOSHaptics: this.supportsIOSHaptics,
      iOSVersion: this.iOSVersion
    });
  }
  getIOSVersion() {
    if (!this.isIOS) return 0;
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10) || 0;
      return parseFloat(`${major}.${minor}`);
    }
    return 0;
  }
  setupUserInteractionTracking() {
    ["click", "touchstart", "touchend"].forEach((eventType) => {
      document.addEventListener(eventType, () => {
        this.lastUserInteraction = Date.now();
      }, { passive: true, capture: true });
    });
  }
  async initIOSHaptics() {
    try {
      const module = await __vitePreload(() => import("./index-wLqX8TQv.js"), true ? [] : void 0);
      this.iosHaptics = module.haptic;
      this.log("iOS haptics module loaded successfully");
    } catch (error) {
      this.log("iOS haptics module not available, falling back to standard API", error);
      this.supportsIOSHaptics = false;
    }
  }
  // Main vibration method with cross-platform support
  vibrate(pattern = this.patterns.reveal) {
    if (!this.enabled) {
      this.log("Haptics disabled");
      return false;
    }
    const now = Date.now();
    if (now - this.lastVibration < this.minInterval) {
      this.log(`Vibration throttled (${now - this.lastVibration}ms since last)`);
      return false;
    }
    if (this.isIOS && this.iOSVersion >= 18.4) {
      const timeSinceInteraction = now - this.lastUserInteraction;
      if (timeSinceInteraction > 1e3) {
        this.log(`iOS 18.4+ requires recent user interaction (${timeSinceInteraction}ms ago)`);
        return false;
      }
    }
    try {
      if (this.hasVibrationAPI) {
        if (!this.isSecureContext) {
          this.log("Vibration requires HTTPS");
          return false;
        }
        this.lastVibration = now;
        const result = navigator.vibrate(pattern);
        if (result) {
          this.log(`Native vibration triggered: ${JSON.stringify(pattern)}, platform: ${this.isIOS ? "iOS" : "Android"}`);
          return true;
        }
        if (this.isIOS) {
          this.log("Native vibration failed on iOS, trying ios-haptics fallback");
        }
      }
      if (this.isIOS && this.supportsIOSHaptics && this.iosHaptics) {
        this.lastVibration = now;
        if (Array.isArray(pattern)) {
          if (pattern.length === 3 && pattern[1] === 50) {
            return this.iosHaptics.confirm();
          } else if (pattern.length === 5) {
            return this.iosHaptics.error();
          }
        }
        const result = this.iosHaptics();
        this.log(`iOS haptics triggered via checkbox switch`);
        return result;
      }
      this.log("No haptic support available on this device");
      return false;
    } catch (error) {
      this.log("Vibration error:", error);
      return false;
    }
  }
  // Convenience methods for app-specific patterns
  reveal() {
    return this.vibrate(this.patterns.reveal);
  }
  activate() {
    return this.vibrate(this.patterns.activate);
  }
  success() {
    return this.vibrate(this.patterns.success);
  }
  error() {
    return this.vibrate(this.patterns.error);
  }
  warning() {
    return this.vibrate(this.patterns.warning);
  }
  stop() {
    if (this.hasVibrationAPI) {
      return navigator.vibrate(0);
    }
    return false;
  }
  // Visual fallback for devices without haptic support
  provideVisualFeedback(element) {
    if (!element) return;
    const caps = this.getCapabilities();
    if (caps.supported) {
      this.reveal();
    } else {
      const originalTransform = element.style.transform;
      element.style.transition = "transform 100ms ease-out";
      element.style.transform = "scale(0.95)";
      setTimeout(() => {
        element.style.transform = originalTransform || "";
        setTimeout(() => {
          element.style.transition = "";
        }, 100);
      }, 100);
    }
  }
  // Touch event integration helper
  createTouchHandler(pattern = this.patterns.reveal) {
    return (event) => {
      if (event.type === "touchstart" || event.type === "touchend") {
        this.vibrate(pattern);
      }
    };
  }
  // Feature detection helper
  getCapabilities() {
    return {
      supported: this.hasVibrationAPI || this.supportsIOSHaptics,
      platform: this.isIOS ? "ios" : this.isAndroid ? "android" : "other",
      method: this.hasVibrationAPI ? "vibration-api" : this.supportsIOSHaptics ? "ios-switch" : "none",
      iOSVersion: this.iOSVersion,
      requiresUserGesture: this.isIOS && this.iOSVersion >= 18.4,
      fallbackAvailable: true
      // We always have visual fallback
    };
  }
  // Enable/disable haptics
  setEnabled(enabled) {
    this.enabled = enabled;
    this.log(`Haptics ${enabled ? "enabled" : "disabled"}`);
  }
  // Update pattern durations
  setPattern(type, duration) {
    if (this.patterns[type] !== void 0) {
      this.patterns[type] = duration;
      this.log(`Updated ${type} pattern to ${duration}ms`);
    }
  }
  log(message, data) {
    if (window.debugHaptics) {
      console.log(`[HapticManager] ${message}`, data || "");
    }
  }
}
let hapticManagerInstance = null;
function getHapticManager() {
  if (!hapticManagerInstance) {
    hapticManagerInstance = new HapticManager();
  }
  return hapticManagerInstance;
}
export {
  getHapticManager as g
};
