const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/TemporalEchoController-CxUXlabU.js","assets/main-nUf9gQDL.js","assets/main-iSp7nxPb.css"])))=>i.map(i=>d[i]);
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { O as OpenSeadragon, e as createLogger, i as isMobile, _ as __vitePreload } from "./main-nUf9gQDL.js";
import { o as organicVariations, C as CentralizedEventManager, p as performanceConfig, a as adjustSettingsForPerformance } from "./viewerSetup-Cz9KFN8o.js";
class TemporalModeHandler {
  constructor(options = {}) {
    this.audioEngine = options.audioEngine || window.audioEngine;
    this.onPhaseChange = options.onPhaseChange || (() => {
    });
    this.modeStateManager = options.modeStateManager;
    this.thresholds = {
      explore: 300,
      preview: 500,
      activate: 800
    };
    this.state = {
      isHolding: false,
      holdStartTime: 0,
      holdTimer: null,
      currentPhase: null,
      targetHotspot: null,
      feedbackGiven: /* @__PURE__ */ new Set()
    };
    this.currentPointerX = null;
    this.currentPointerY = null;
    this.progressElement = null;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
  }
  startHold(hotspot, pointerX, pointerY) {
    if (!hotspot) return;
    if (this.modeStateManager && (this.modeStateManager.modeStates.temporal.active || this.modeStateManager.modeStates.temporal.phase)) {
      console.warn("[TEMPORAL_DEBUG] Cleaning stale temporal state before startHold");
      this.modeStateManager.setTemporalState(false, null);
      this.modeStateManager.modeStates.temporal.active = false;
      this.modeStateManager.modeStates.temporal.phase = null;
    }
    this.state.isHolding = true;
    this.state.holdStartTime = Date.now();
    this.state.targetHotspot = hotspot;
    this.state.feedbackGiven.clear();
    this.state.currentPhase = null;
    if (this.onPhaseChange) {
      this.onPhaseChange("initial", hotspot);
    }
    if (this.isMobile) {
      this.createTouchRipple(pointerX, pointerY);
    }
    if (this.state.holdTimer) {
      clearTimeout(this.state.holdTimer);
    }
    this.scheduleFeedback();
    this.showProgressIndicator(pointerX, pointerY);
    this.currentPointerX = pointerX;
    this.currentPointerY = pointerY;
    this.animateProgress();
  }
  endHold() {
    const duration = this.state.isHolding ? Date.now() - this.state.holdStartTime : 0;
    const hotspot = this.state.targetHotspot;
    const finalPhase = this.state.currentPhase;
    if (this.state.holdTimer) {
      clearTimeout(this.state.holdTimer);
      this.state.holdTimer = null;
    }
    this.hideProgressIndicator();
    this.state.isHolding = false;
    this.state.holdStartTime = 0;
    this.state.currentPhase = null;
    this.state.targetHotspot = null;
    this.state.feedbackGiven.clear();
    this.cleanupTemporalVisuals();
    if (this.modeStateManager) {
      this.modeStateManager.setTemporalState(false, null);
    }
    return { duration, hotspot, finalPhase };
  }
  cleanupTemporalVisuals() {
    console.log("[TemporalModeHandler] Cleaning up temporal visuals");
    const temporalClasses = [
      "hotspot-temporal-touchDown",
      "hotspot-temporal-explore",
      "hotspot-temporal-preview",
      "hotspot-temporal-activate"
    ];
    document.querySelectorAll("[data-hotspot-id]").forEach((element) => {
      temporalClasses.forEach((className) => {
        element.classList.remove(className);
      });
      element.style.removeProperty("opacity");
      element.style.removeProperty("visibility");
      element.style.removeProperty("transition");
    });
    if (this.modeStateManager) {
      this.modeStateManager.setTemporalState(false, null);
    }
  }
  scheduleFeedback() {
    this.giveFeedback("touchDown");
    this.state.holdTimer = setTimeout(() => {
      if (!this.state.isHolding) return;
      this.state.currentPhase = "explore";
      this.giveFeedback("explore");
      this.state.holdTimer = setTimeout(() => {
        if (!this.state.isHolding) return;
        this.state.currentPhase = "preview";
        this.giveFeedback("preview");
        this.state.holdTimer = setTimeout(() => {
          if (!this.state.isHolding) return;
          this.state.currentPhase = "activate";
          this.giveFeedback("activate");
        }, this.thresholds.activate - this.thresholds.preview);
      }, this.thresholds.preview - this.thresholds.explore);
    }, this.thresholds.explore);
  }
  giveFeedback(phase) {
    if (!this.state.isHolding) {
      console.log("[TEMPORAL_DEBUG] Ignoring feedback - not holding");
      return;
    }
    if (this.state.feedbackGiven.has(phase)) return;
    this.state.feedbackGiven.add(phase);
    if (phase === "touchDown" && this.isMobile) {
      this.playHaptic("touchDown");
    }
    this.onPhaseChange(phase, this.state.targetHotspot);
    this.playAudio(phase);
    this.playHaptic(phase);
  }
  playAudio(phase) {
    if (!this.audioEngine) return;
    const hotspotSize = this.calculateHotspotSize(this.state.targetHotspot);
    switch (phase) {
      case "touchDown":
        this.audioEngine.playTemporalSound("touch", 2e3, 20);
        break;
      case "explore":
        this.audioEngine.playTemporalTick(hotspotSize);
        break;
      case "preview":
        this.audioEngine.playTemporalBoop();
        break;
      case "activate":
        this.audioEngine.playTemporalThunk(hotspotSize);
        break;
    }
  }
  playHaptic(phase) {
    if (!navigator.vibrate || !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
    const patterns = {
      touchDown: [20, 10, 20],
      // au lieu de touchDown: 10
      explore: 20,
      preview: [30, 10, 30],
      activate: 100
    };
    if (patterns[phase]) {
      try {
        navigator.vibrate(patterns[phase]);
      } catch (e) {
      }
    }
  }
  calculateHotspotSize(hotspot) {
    if (!hotspot || !hotspot.coordinates) return 0.5;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    const coords = hotspot.shape === "multipolygon" ? hotspot.coordinates[0] : hotspot.coordinates;
    coords.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    const area = (maxX - minX) * (maxY - minY);
    return Math.min(1, Math.max(0, area / 1e4));
  }
  createProgressIndicator() {
    if (this.progressElement) return;
    this.progressElement = document.createElement("div");
    this.progressElement.className = "temporal-progress-indicator";
    this.progressElement.innerHTML = `
            <svg width="64" height="64" style="position: absolute; top: -2px; left: -2px; transform: rotate(-90deg);">
                <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>
                <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="4"
                        stroke-dasharray="188.5" stroke-dashoffset="188.5" class="progress-ring"/>
            </svg>
        `;
    document.body.appendChild(this.progressElement);
  }
  createTouchRipple(x, y) {
    const ripple = document.createElement("div");
    ripple.className = "temporal-touch-ripple";
    ripple.style.left = x - 20 + "px";
    ripple.style.top = y - 20 + "px";
    document.body.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
  showProgressIndicator(x, y) {
    if (!this.progressElement) {
      this.createProgressIndicator();
    }
    this.progressElement.style.display = "block";
    this.progressElement.style.left = x + "px";
    this.progressElement.style.top = y + "px";
  }
  hideProgressIndicator() {
    if (this.progressElement) {
      this.progressElement.style.display = "none";
    }
  }
  updateProgress(x, y, progress) {
    if (!this.progressElement) return;
    this.currentPointerX = x;
    this.currentPointerY = y;
    this.progressElement.style.left = x + "px";
    this.progressElement.style.top = y + "px";
  }
  animateProgress() {
    if (!this.state.isHolding) {
      this.hideProgressIndicator();
      return;
    }
    const elapsed = Date.now() - this.state.holdStartTime;
    const maxDuration = this.thresholds.activate + 200;
    const progress = Math.min(1, elapsed / maxDuration);
    if (this.progressElement) {
      const ring = this.progressElement.querySelector(".progress-ring");
      if (ring) {
        const offset = 188.5 - 188.5 * progress;
        ring.style.strokeDashoffset = offset;
      }
      if (this.currentPointerX !== void 0 && this.currentPointerY !== void 0) {
        this.progressElement.style.left = this.currentPointerX + "px";
        this.progressElement.style.top = this.currentPointerY + "px";
      }
    }
    if (this.state.isHolding && progress < 1) {
      requestAnimationFrame(() => this.animateProgress());
    } else {
      this.hideProgressIndicator();
    }
  }
  getCurrentProgress() {
    if (!this.state.isHolding) return 0;
    const elapsed = Date.now() - this.state.holdStartTime;
    const maxDuration = this.thresholds.activate + 200;
    return Math.min(1, elapsed / maxDuration);
  }
  updateThreshold(type, value) {
    if (this.thresholds[type] !== void 0) {
      this.thresholds[type] = value;
    }
  }
  reset() {
    this.endHold();
    if (this.progressElement) {
      this.progressElement.remove();
      this.progressElement = null;
    }
  }
  destroy() {
    this.reset();
  }
}
class TemporalHoldDetectionEngine {
  constructor(options = {}) {
    this.audioEngine = options.audioEngine || window.audioEngine;
    this.onStateChange = options.onStateChange || (() => {
    });
    this.onDiscovery = options.onDiscovery || (() => {
    });
    this.onActivation = options.onActivation || (() => {
    });
    this.thresholds = {
      intentionDelay: 100,
      // NEW: 100ms delay before starting temporal detection
      navigation: 150,
      // 0-150ms: immediate navigation response
      discovery: 400,
      // 400ms: discovery mode with haptic pulse
      activation: 800,
      // 800ms: full activation
      earlyVelocityCheck: 150,
      // Monitor velocity for 150ms after intention delay
      distanceCheck: 200
      // Monitor distance for 200ms total
    };
    this.velocityThreshold = this.isMobile ? 5 : 15;
    this.frameTime = 16.67;
    this.distanceThresholds = {
      panDetection: this.isMobile ? 25 : 8,
      // pixels - much larger for mobile touch (was 12)
      maxHoldDistance: this.isMobile ? 35 : 15
      // maximum allowed drift during hold (was 20)
    };
    this.state = {
      isHolding: false,
      holdStartTime: 0,
      currentPhase: null,
      targetHotspot: null,
      initialPosition: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 },
      velocityHistory: [],
      feedbackGiven: /* @__PURE__ */ new Set(),
      timer: null,
      // NEW: Intention delay and pan detection
      intentionTimer: null,
      temporalStarted: false,
      // True after intention delay passes
      earlyVelocityTimer: null,
      // Timer for early velocity monitoring
      distanceTimer: null
      // Timer for distance monitoring
    };
    this.hapticIntensities = {
      discovery: 0.3,
      // 30% intensity at 400ms
      activation: 1
      // 100% intensity at 800ms
    };
    this.lastFrameTime = 0;
    this.velocityBufferSize = 5;
    this.updateThrottle = this.isMobile ? 33 : 16;
    this.lastUpdateTime = 0;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.update = this.update.bind(this);
    this.calculateVelocity = this.calculateVelocity.bind(this);
    this.schedulePhases = this.schedulePhases.bind(this);
    this.startEarlyVelocityMonitoring = this.startEarlyVelocityMonitoring.bind(this);
    this.startDistanceMonitoring = this.startDistanceMonitoring.bind(this);
    this.checkPanDetection = this.checkPanDetection.bind(this);
  }
  /**
   * Start temporal hold detection
   * @param {Object} hotspot - Target hotspot
   * @param {number} x - Initial touch X coordinate
   * @param {number} y - Initial touch Y coordinate
   */
  startHold(hotspot, x, y) {
    if (!hotspot) return;
    console.log("[TemporalHoldEngine] Starting hold detection with intention delay", {
      hotspotId: hotspot.id,
      position: { x, y },
      intentionDelay: this.thresholds.intentionDelay,
      timestamp: Date.now()
    });
    this.reset();
    this.state.isHolding = true;
    this.state.holdStartTime = performance.now();
    this.state.targetHotspot = hotspot;
    this.state.initialPosition = { x, y };
    this.state.lastPosition = { x, y };
    this.state.velocityHistory = [];
    this.state.feedbackGiven.clear();
    this.state.currentPhase = "intention_delay";
    this.state.temporalStarted = false;
    this.lastFrameTime = performance.now();
    this.update();
    this.state.intentionTimer = setTimeout(() => {
      if (!this.state.isHolding) return;
      console.log(
        "[TemporalHoldEngine] Intention delay passed - starting temporal detection"
      );
      this.state.temporalStarted = true;
      this.state.currentPhase = "initiated";
      this.startEarlyVelocityMonitoring();
      this.startDistanceMonitoring();
      this.schedulePhases();
      this.onStateChange("initiated", hotspot, {
        duration: this.getHoldDuration(),
        velocity: this.getAverageVelocity(),
        phase: "initiated"
      });
    }, this.thresholds.intentionDelay);
    this.onStateChange("intention_delay", hotspot, {
      duration: 0,
      velocity: 0,
      phase: "intention_delay"
    });
  }
  /**
   * Update position and calculate velocity (called on every touch move)
   * @param {number} x - Current touch X coordinate
   * @param {number} y - Current touch Y coordinate
   */
  updatePosition(x, y) {
    if (!this.state.isHolding) return;
    const now = performance.now();
    if (this.isMobile && now - this.lastUpdateTime < this.updateThrottle) {
      return;
    }
    this.lastUpdateTime = now;
    const deltaTime = now - this.lastFrameTime;
    if (deltaTime > 0) {
      const velocity = this.calculateVelocity(x, y, deltaTime);
      this.state.velocityHistory.push(velocity);
      if (this.state.velocityHistory.length > this.velocityBufferSize) {
        this.state.velocityHistory.shift();
      }
      if (this.checkPanDetection(x, y)) {
        console.log("[TemporalHoldEngine] Pan movement detected, ending hold");
        this.endHold("pan_detected");
        return;
      }
      if (this.state.temporalStarted) {
        const avgVelocity = this.getAverageVelocity();
        if (avgVelocity > this.velocityThreshold) {
          console.log("[TemporalHoldEngine] Fast movement detected, ending hold", {
            velocity: avgVelocity,
            threshold: this.velocityThreshold
          });
          this.endHold("navigation_detected");
          return;
        }
      }
      this.state.lastPosition = { x, y };
      this.lastFrameTime = now;
    }
  }
  /**
   * Calculate instantaneous velocity
   * @param {number} x - Current X position
   * @param {number} y - Current Y position
   * @param {number} deltaTime - Time since last update (ms)
   * @returns {number} Velocity in pixels per frame
   */
  calculateVelocity(x, y, deltaTime) {
    const deltaX = x - this.state.lastPosition.x;
    const deltaY = y - this.state.lastPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const pixelsPerMs = distance / deltaTime;
    const pixelsPerFrame = pixelsPerMs * this.frameTime;
    return pixelsPerFrame;
  }
  /**
   * Get smoothed average velocity from history
   * @returns {number} Average velocity in pixels per frame
   */
  getAverageVelocity() {
    if (this.state.velocityHistory.length === 0) return 0;
    const sum = this.state.velocityHistory.reduce((acc, vel) => acc + vel, 0);
    return sum / this.state.velocityHistory.length;
  }
  /**
   * Start early velocity monitoring (150ms after intention delay)
   */
  startEarlyVelocityMonitoring() {
    this.state.earlyVelocityTimer = setTimeout(() => {
      if (!this.state.isHolding) return;
      console.log("[TemporalHoldEngine] Early velocity monitoring period ended");
    }, this.thresholds.earlyVelocityCheck);
  }
  /**
   * Start distance monitoring (200ms after intention delay)
   */
  startDistanceMonitoring() {
    this.state.distanceTimer = setTimeout(() => {
      if (!this.state.isHolding) return;
      console.log("[TemporalHoldEngine] Distance monitoring period ended");
    }, this.thresholds.distanceCheck);
  }
  /**
   * Check if current movement indicates panning intention
   * @param {number} x - Current X position
   * @param {number} y - Current Y position
   * @returns {boolean} True if pan detected
   */
  checkPanDetection(x, y) {
    if (!this.state.isHolding) return false;
    const totalDistance = Math.sqrt(
      Math.pow(x - this.state.initialPosition.x, 2) + Math.pow(y - this.state.initialPosition.y, 2)
    );
    const elapsed = this.getHoldDuration();
    if (elapsed < this.thresholds.intentionDelay + this.thresholds.distanceCheck) {
      if (totalDistance > this.distanceThresholds.panDetection) {
        console.log("[TemporalHoldEngine] Pan detected - distance exceeded", {
          distance: totalDistance,
          threshold: this.distanceThresholds.panDetection,
          elapsed
        });
        return true;
      }
    }
    if (this.state.temporalStarted && totalDistance > this.distanceThresholds.maxHoldDistance) {
      console.log("[TemporalHoldEngine] Hold drift exceeded", {
        distance: totalDistance,
        threshold: this.distanceThresholds.maxHoldDistance
      });
      return true;
    }
    return false;
  }
  /**
   * Schedule progressive feedback phases based on research thresholds
   */
  schedulePhases() {
    if (!this.state.temporalStarted) {
      console.log(
        "[TemporalHoldEngine] Cannot schedule phases - temporal detection not started"
      );
      return;
    }
    if (this.state.timer) {
      clearTimeout(this.state.timer);
    }
    const discoveryDelay = this.thresholds.discovery - this.thresholds.intentionDelay;
    this.state.timer = setTimeout(() => {
      if (!this.state.isHolding || !this.state.temporalStarted) return;
      this.enterDiscoveryPhase();
      const activationDelay = this.thresholds.activation - this.thresholds.discovery;
      this.state.timer = setTimeout(() => {
        if (!this.state.isHolding || !this.state.temporalStarted) return;
        this.enterActivationPhase();
      }, activationDelay);
    }, discoveryDelay);
  }
  /**
   * Enter discovery phase (400ms)
   */
  enterDiscoveryPhase() {
    if (!this.state.isHolding || this.state.feedbackGiven.has("discovery")) {
      return;
    }
    console.log("[TemporalHoldEngine] Entering discovery phase");
    this.state.currentPhase = "discovery";
    this.state.feedbackGiven.add("discovery");
    this.playHaptic("discovery", this.hapticIntensities.discovery);
    this.playDiscoveryAudio();
    this.onDiscovery(this.state.targetHotspot, {
      duration: this.getHoldDuration(),
      phase: "discovery",
      intensity: this.hapticIntensities.discovery
    });
    this.onStateChange("discovery", this.state.targetHotspot, {
      duration: this.getHoldDuration(),
      velocity: this.getAverageVelocity(),
      phase: "discovery"
    });
  }
  /**
   * Enter activation phase (800ms)
   */
  enterActivationPhase() {
    if (!this.state.isHolding || this.state.feedbackGiven.has("activation")) {
      return;
    }
    console.log("[TemporalHoldEngine] Entering activation phase");
    this.state.currentPhase = "activation";
    this.state.feedbackGiven.add("activation");
    this.playHaptic("activation", this.hapticIntensities.activation);
    this.playActivationAudio();
    this.onActivation(this.state.targetHotspot, {
      duration: this.getHoldDuration(),
      phase: "activation",
      finalPosition: this.state.lastPosition
    });
    this.onStateChange("activation", this.state.targetHotspot, {
      duration: this.getHoldDuration(),
      velocity: this.getAverageVelocity(),
      phase: "activation"
    });
    this.endHold("activated");
  }
  /**
   * End temporal hold detection
   * @param {string} reason - Reason for ending ('activated', 'released', 'navigation_detected')
   * @returns {Object} Final state information
   */
  endHold(reason = "released") {
    if (!this.state.isHolding) return null;
    const duration = this.getHoldDuration();
    const finalPhase = this.state.currentPhase;
    const hotspot = this.state.targetHotspot;
    console.log("[TemporalHoldEngine] Ending hold", {
      reason,
      duration,
      finalPhase,
      hotspotId: hotspot == null ? void 0 : hotspot.id
    });
    if (this.state.timer) {
      clearTimeout(this.state.timer);
      this.state.timer = null;
    }
    this.reset();
    this.onStateChange("ended", hotspot, {
      duration,
      reason,
      finalPhase
    });
    return {
      duration,
      hotspot,
      finalPhase,
      reason
    };
  }
  /**
   * Update loop for continuous velocity tracking
   */
  update() {
    if (!this.state.isHolding) return;
    requestAnimationFrame(this.update);
  }
  /**
   * Get current hold duration in milliseconds
   * @returns {number} Duration since hold started
   */
  getHoldDuration() {
    if (!this.state.isHolding) return 0;
    return performance.now() - this.state.holdStartTime;
  }
  /**
   * Play haptic feedback with specified intensity
   * @param {string} phase - Current phase ('discovery', 'activation')
   * @param {number} intensity - Haptic intensity (0.0 - 1.0)
   */
  playHaptic(phase, intensity) {
    if (!this.isMobile || !navigator.vibrate) return;
    try {
      const patterns = {
        discovery: [Math.round(30 * intensity), 10, Math.round(20 * intensity)],
        activation: [Math.round(100 * intensity)]
      };
      if (patterns[phase]) {
        navigator.vibrate(patterns[phase]);
      }
    } catch (error) {
      console.debug("[TemporalHoldEngine] Haptic feedback not available:", error.message);
    }
  }
  /**
   * Play spatial audio cues for discovery phase
   */
  playDiscoveryAudio() {
    if (!this.audioEngine) return;
    try {
      this.audioEngine.playTemporalSound("discovery", 1e3, 15);
    } catch (error) {
      console.debug("[TemporalHoldEngine] Discovery audio not available:", error.message);
    }
  }
  /**
   * Play activation audio
   */
  playActivationAudio() {
    if (!this.audioEngine) return;
    try {
      const hotspotSize = this.calculateHotspotSize(this.state.targetHotspot);
      this.audioEngine.playTemporalThunk(hotspotSize);
    } catch (error) {
      console.debug("[TemporalHoldEngine] Activation audio not available:", error.message);
    }
  }
  /**
   * Calculate hotspot size for audio feedback variation
   * @param {Object} hotspot - Hotspot object
   * @returns {number} Normalized size (0.0 - 1.0)
   */
  calculateHotspotSize(hotspot) {
    if (!hotspot || !hotspot.coordinates) return 0.5;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    const coords = hotspot.shape === "multipolygon" ? hotspot.coordinates[0] : hotspot.coordinates;
    coords.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    const area = (maxX - minX) * (maxY - minY);
    return Math.min(1, Math.max(0, area / 1e4));
  }
  /**
   * Check if currently in holding state
   * @returns {boolean} True if holding
   */
  isHolding() {
    return this.state.isHolding;
  }
  /**
   * Get current phase information
   * @returns {Object} Current phase data
   */
  getCurrentPhase() {
    return {
      phase: this.state.currentPhase,
      duration: this.getHoldDuration(),
      velocity: this.getAverageVelocity(),
      hotspot: this.state.targetHotspot
    };
  }
  /**
   * Update threshold values (for fine-tuning)
   * @param {string} type - Threshold type ('navigation', 'discovery', 'activation')
   * @param {number} value - New threshold value in milliseconds
   */
  updateThreshold(type, value) {
    if (this.thresholds.hasOwnProperty(type)) {
      this.thresholds[type] = value;
      console.log(`[TemporalHoldEngine] Updated ${type} threshold to ${value}ms`);
    }
  }
  /**
   * Reset all state
   */
  reset() {
    if (this.state.timer) {
      clearTimeout(this.state.timer);
      this.state.timer = null;
    }
    if (this.state.intentionTimer) {
      clearTimeout(this.state.intentionTimer);
      this.state.intentionTimer = null;
    }
    if (this.state.earlyVelocityTimer) {
      clearTimeout(this.state.earlyVelocityTimer);
      this.state.earlyVelocityTimer = null;
    }
    if (this.state.distanceTimer) {
      clearTimeout(this.state.distanceTimer);
      this.state.distanceTimer = null;
    }
    this.state = {
      isHolding: false,
      holdStartTime: 0,
      currentPhase: null,
      targetHotspot: null,
      initialPosition: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 },
      velocityHistory: [],
      feedbackGiven: /* @__PURE__ */ new Set(),
      timer: null,
      // NEW: Reset new state properties
      intentionTimer: null,
      temporalStarted: false,
      earlyVelocityTimer: null,
      distanceTimer: null
    };
  }
  /**
   * Cleanup and destroy
   */
  destroy() {
    this.reset();
    this.onStateChange = null;
    this.onDiscovery = null;
    this.onActivation = null;
    this.audioEngine = null;
  }
}
class ModeStateManager {
  constructor() {
    this.modes = {
      direct: {
        name: "Direct (Classic)",
        description: "Tap to select and zoom immediately",
        mobile: true,
        desktop: true
      },
      temporal: {
        name: "Temporal (Hold)",
        description: "Hold duration determines action",
        mobile: true,
        desktop: true
      }
    };
    const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.currentMode = this.loadStateWithValidation(
      "interactionMode",
      isMobile2 ? "temporal" : "direct",
      ["direct", "temporal"]
    );
    this.modeStates = {
      temporal: {
        active: false,
        phase: null
      },
      reveal: {
        active: false,
        timer: null,
        style: this.loadStateWithValidation("revealStyle", "invert", [
          "invert",
          "glow",
          "outline",
          "shadow"
        ])
      }
    };
    this.listeners = {
      modeChange: [],
      stateChange: []
    };
  }
  /**
   * Load state from localStorage with validation
   * @param {string} key - localStorage key
   * @param {*} defaultValue - Default value if invalid or missing
   * @param {Array} validValues - Array of valid values (optional)
   * @returns {*} Valid state value
   */
  loadStateWithValidation(key, defaultValue, validValues = null) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log(
          `[ModeStateManager] No stored value for ${key}, using default: ${defaultValue}`
        );
        return defaultValue;
      }
      if (validValues && !validValues.includes(stored)) {
        console.warn(
          `[ModeStateManager] Invalid stored value for ${key}: "${stored}". Valid values: ${validValues.join(", ")}. Using default: ${defaultValue}`
        );
        localStorage.removeItem(key);
        return defaultValue;
      }
      console.log(`[ModeStateManager] Loaded valid state for ${key}: ${stored}`);
      return stored;
    } catch (e) {
      console.error(`[ModeStateManager] Error loading state for ${key}:`, e);
      return defaultValue;
    }
  }
  getCurrentMode() {
    return this.currentMode;
  }
  setMode(mode) {
    if (!this.modes[mode]) return false;
    const previousMode = this.currentMode;
    this.currentMode = mode;
    localStorage.setItem("interactionMode", mode);
    this.notifyListeners("modeChange", { from: previousMode, to: mode });
    return true;
  }
  getModeConfig(mode = this.currentMode) {
    return this.modes[mode];
  }
  // Temporal mode state
  setTemporalState(active, phase = null) {
    const previousActive = this.modeStates.temporal.active;
    this.modeStates.temporal.active = active;
    this.modeStates.temporal.phase = phase;
    console.log("[ModeStateManager] Temporal state changed:", {
      from: { active: previousActive, phase: this.modeStates.temporal.phase },
      to: { active, phase },
      timestamp: Date.now()
    });
    this.notifyListeners("stateChange", { mode: "temporal", state: this.modeStates.temporal });
  }
  isTemporalActive() {
    return this.currentMode === "temporal" && this.modeStates.temporal.active;
  }
  // Reveal mode state
  setRevealActive(active) {
    this.modeStates.reveal.active = active;
    if (!active && this.modeStates.reveal.timer) {
      clearTimeout(this.modeStates.reveal.timer);
      this.modeStates.reveal.timer = null;
    }
    this.notifyListeners("stateChange", { mode: "reveal", state: this.modeStates.reveal });
  }
  isRevealActive() {
    return this.modeStates.reveal.active;
  }
  setRevealTimer(timer) {
    this.modeStates.reveal.timer = timer;
  }
  setRevealStyle(style) {
    this.modeStates.reveal.style = style;
    localStorage.setItem("revealStyle", style);
  }
  getRevealStyle() {
    return this.modeStates.reveal.style;
  }
  // Check if any special mode blocks normal interactions
  shouldBlockNormalInteractions() {
    return this.isTemporalActive() || this.isRevealActive();
  }
  // Listener management
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }
  off(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }
  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
    }
  }
  reset() {
    this.modeStates.temporal.active = false;
    this.modeStates.temporal.phase = null;
    this.setRevealActive(false);
  }
  forceTemporalCleanup() {
    console.log("[ModeStateManager] Force temporal cleanup");
    this.modeStates.temporal.active = false;
    this.modeStates.temporal.phase = null;
    this.notifyListeners("stateChange", { mode: "temporal", state: this.modeStates.temporal });
  }
}
class HitDetectionCanvas {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.spatialIndex = options.spatialIndex;
    this.debug = options.debug || false;
    this.hitCanvas = null;
    this.hitContext = null;
    this.debugCanvas = null;
    this.colorToHotspot = /* @__PURE__ */ new Map();
    this.hotspotToColor = /* @__PURE__ */ new Map();
    this.nextColorIndex = 1;
    this.stats = {
      totalHotspots: 0,
      renderedHotspots: 0,
      lastRenderTime: 0,
      hitTestCount: 0,
      cacheHits: 0
    };
    this.isInitialized = false;
    this.needsRedraw = true;
    this.currentViewport = null;
    this.hitCache = /* @__PURE__ */ new Map();
    this.hitCacheSize = 50;
    this.lastCacheClear = Date.now();
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    console.log("[HIT_DETECTION] Initializing for platform:", {
      isMobile: this.isMobile,
      isSafari: this.isSafari,
      debug: this.debug
    });
  }
  /**
   * Initialize the hit detection canvas system
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn("[HIT_DETECTION] Already initialized");
      return;
    }
    if (!this.viewer || !this.spatialIndex) {
      throw new Error("HitDetectionCanvas requires viewer and spatialIndex");
    }
    const startTime = performance.now();
    try {
      await this.waitForViewer();
      this.createCanvasElements();
      this.generateColorMapping();
      this.setupEventHandlers();
      this.scheduleRedraw();
      this.isInitialized = true;
      const initTime = performance.now() - startTime;
      console.log(`[HIT_DETECTION] Initialized in ${initTime.toFixed(2)}ms`, {
        totalHotspots: this.stats.totalHotspots,
        canvasSize: `${this.hitCanvas.width}x${this.hitCanvas.height}`,
        isMobile: this.isMobile
      });
    } catch (error) {
      console.error("[HIT_DETECTION] Initialization failed:", error);
      throw error;
    }
  }
  /**
   * Wait for OpenSeadragon viewer to be ready
   */
  waitForViewer() {
    return new Promise((resolve) => {
      if (this.viewer.isOpen() && this.viewer.world.getItemCount() > 0) {
        resolve();
      } else {
        this.viewer.addOnceHandler("open", () => {
          setTimeout(resolve, 100);
        });
      }
    });
  }
  /**
   * Create canvas elements and add to viewer
   */
  createCanvasElements() {
    const tiledImage = this.viewer.world.getItemAt(0);
    const imageSize = tiledImage.getContentSize();
    let canvasWidth, canvasHeight;
    if (this.isMobile) {
      const maxSize = 1024;
      const aspectRatio = imageSize.x / imageSize.y;
      if (imageSize.x > imageSize.y) {
        canvasWidth = Math.min(maxSize, imageSize.x);
        canvasHeight = Math.floor(canvasWidth / aspectRatio);
        if (canvasHeight > 512) {
          canvasHeight = 512;
          canvasWidth = Math.floor(canvasHeight * aspectRatio);
        }
      } else {
        canvasHeight = Math.min(maxSize, imageSize.y);
        canvasWidth = Math.floor(canvasHeight * aspectRatio);
        if (canvasWidth > 512) {
          canvasWidth = 512;
          canvasHeight = Math.floor(canvasWidth / aspectRatio);
        }
      }
      console.log(
        `[MOBILE_OPTIMIZATION] Canvas reduced for performance: ${canvasWidth}x${canvasHeight}`
      );
    } else {
      const maxSize = 4096;
      canvasWidth = Math.min(maxSize, imageSize.x);
      canvasHeight = Math.min(maxSize, imageSize.y);
    }
    this.hitCanvas = document.createElement("canvas");
    this.hitCanvas.width = canvasWidth;
    this.hitCanvas.height = canvasHeight;
    this.hitCanvas.style.position = "absolute";
    this.hitCanvas.style.top = "0";
    this.hitCanvas.style.left = "0";
    this.hitCanvas.style.width = "100%";
    this.hitCanvas.style.height = "100%";
    this.hitCanvas.style.pointerEvents = "none";
    this.hitCanvas.style.visibility = "hidden";
    this.hitCanvas.style.zIndex = "-1000";
    this.hitContext = this.hitCanvas.getContext("2d", {
      alpha: false,
      // No transparency needed
      willReadFrequently: true
      // Optimize for pixel reading
    });
    this.hitContext.imageSmoothingEnabled = false;
    this.hitContext.webkitImageSmoothingEnabled = false;
    this.hitContext.mozImageSmoothingEnabled = false;
    this.hitContext.msImageSmoothingEnabled = false;
    if (this.debug) {
      this.debugCanvas = document.createElement("canvas");
      this.debugCanvas.width = canvasWidth;
      this.debugCanvas.height = canvasHeight;
      this.debugCanvas.style.position = "absolute";
      this.debugCanvas.style.top = "0";
      this.debugCanvas.style.left = "0";
      this.debugCanvas.style.width = "100%";
      this.debugCanvas.style.height = "100%";
      this.debugCanvas.style.pointerEvents = "none";
      this.debugCanvas.style.opacity = "0.3";
      this.debugCanvas.style.zIndex = "1000";
      this.debugCanvas.style.mixBlendMode = "multiply";
      this.debugContext = this.debugCanvas.getContext("2d");
    }
    this.viewer.addOverlay({
      element: this.hitCanvas,
      location: new OpenSeadragon.Rect(0, 0, 1, imageSize.y / imageSize.x),
      placement: OpenSeadragon.Placement.TOP_LEFT
    });
    if (this.debug && this.debugCanvas) {
      this.viewer.addOverlay({
        element: this.debugCanvas,
        location: new OpenSeadragon.Rect(0, 0, 1, imageSize.y / imageSize.x),
        placement: OpenSeadragon.Placement.TOP_LEFT
      });
    }
    console.log(`[HIT_DETECTION] Canvas created: ${canvasWidth}x${canvasHeight}`, {
      originalSize: `${imageSize.x}x${imageSize.y}`,
      mobile: this.isMobile,
      debug: this.debug
    });
  }
  /**
   * Generate unique colors for all hotspots
   */
  generateColorMapping() {
    const hotspots = this.spatialIndex.getAllHotspots();
    const startTime = performance.now();
    this.colorToHotspot.clear();
    this.hotspotToColor.clear();
    this.nextColorIndex = 1;
    const backgroundColor = this.indexToColor(0);
    this.colorToHotspot.set(backgroundColor, null);
    hotspots.forEach((hotspot, index) => {
      const colorIndex = this.nextColorIndex++;
      const color = this.indexToColor(colorIndex);
      this.colorToHotspot.set(color, hotspot);
      this.hotspotToColor.set(hotspot.id, color);
      if (this.debug && index < 10) {
        console.log(
          `[HIT_DETECTION] Hotspot ${hotspot.id} → ${color} (index: ${colorIndex})`
        );
      }
    });
    this.stats.totalHotspots = hotspots.length;
    const mappingTime = performance.now() - startTime;
    console.log(
      `[HIT_DETECTION] Generated ${hotspots.length} unique colors in ${mappingTime.toFixed(2)}ms`
    );
    const uniqueColors = new Set(this.hotspotToColor.values()).size;
    if (uniqueColors !== hotspots.length) {
      console.error(
        `[HIT_DETECTION] Color collision detected! Expected ${hotspots.length}, got ${uniqueColors}`
      );
    }
  }
  /**
   * Convert index to unique RGB color
   * Supports up to 16.7M unique colors (24-bit RGB)
   */
  indexToColor(index) {
    const r = (index & 16711680) >> 16;
    const g = (index & 65280) >> 8;
    const b = index & 255;
    return `rgb(${r},${g},${b})`;
  }
  /**
   * Convert RGB values back to index
   */
  colorToIndex(r, g, b) {
    return r << 16 | g << 8 | b;
  }
  /**
   * Setup event handlers for viewport changes
   */
  setupEventHandlers() {
    this.viewer.addHandler("animation-finish", () => {
      this.scheduleRedraw();
    });
    let redrawTimer = null;
    this.viewer.addHandler("viewport-change", () => {
      if (redrawTimer) clearTimeout(redrawTimer);
      redrawTimer = setTimeout(
        () => {
          this.scheduleRedraw();
        },
        this.isMobile ? 100 : 50
      );
    });
    setInterval(() => {
      this.clearHitCache();
    }, 5e3);
  }
  /**
   * Schedule a canvas redraw (throttled)
   */
  scheduleRedraw() {
    if (!this.needsRedraw) {
      this.needsRedraw = true;
      requestAnimationFrame(() => {
        if (this.needsRedraw) {
          this.renderHitCanvas();
        }
      });
    }
  }
  /**
   * Render all hotspots to hit detection canvas
   */
  renderHitCanvas() {
    if (!this.isInitialized || !this.hitContext) return;
    const startTime = performance.now();
    this.hitContext.fillStyle = this.indexToColor(0);
    this.hitContext.fillRect(0, 0, this.hitCanvas.width, this.hitCanvas.height);
    const viewport = this.viewer.viewport.getBounds();
    const visibleHotspots = this.spatialIndex.queryViewport({
      minX: viewport.x,
      minY: viewport.y,
      maxX: viewport.x + viewport.width,
      maxY: viewport.y + viewport.height
    });
    const tiledImage = this.viewer.world.getItemAt(0);
    const imageSize = tiledImage.getContentSize();
    const scaleX = this.hitCanvas.width / imageSize.x;
    const scaleY = this.hitCanvas.height / imageSize.y;
    let renderedCount = 0;
    visibleHotspots.forEach((hotspot) => {
      const color = this.hotspotToColor.get(hotspot.id);
      if (!color) return;
      this.hitContext.fillStyle = color;
      this.renderHotspotToCanvas(hotspot, scaleX, scaleY);
      renderedCount++;
    });
    if (this.debug && this.debugContext) {
      this.renderDebugCanvas(visibleHotspots, scaleX, scaleY);
    }
    this.stats.renderedHotspots = renderedCount;
    this.stats.lastRenderTime = performance.now() - startTime;
    this.needsRedraw = false;
    console.log(
      `[HIT_DETECTION] Rendered ${renderedCount} hotspots in ${this.stats.lastRenderTime.toFixed(2)}ms`
    );
  }
  /**
   * Render a single hotspot to canvas
   */
  renderHotspotToCanvas(hotspot, scaleX, scaleY) {
    if (hotspot.shape === "polygon") {
      this.renderPolygon(hotspot.coordinates, scaleX, scaleY);
    } else if (hotspot.shape === "multipolygon") {
      hotspot.coordinates.forEach((polygon) => {
        this.renderPolygon(polygon, scaleX, scaleY);
      });
    }
  }
  /**
   * Render polygon to canvas
   */
  renderPolygon(coordinates, scaleX, scaleY) {
    if (coordinates.length === 0) return;
    this.hitContext.beginPath();
    coordinates.forEach((point, index) => {
      const x = point[0] * scaleX;
      const y = point[1] * scaleY;
      if (index === 0) {
        this.hitContext.moveTo(x, y);
      } else {
        this.hitContext.lineTo(x, y);
      }
    });
    this.hitContext.closePath();
    this.hitContext.fill();
  }
  /**
   * Render debug visualization
   */
  renderDebugCanvas(visibleHotspots, scaleX, scaleY) {
    this.debugContext.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
    visibleHotspots.forEach((hotspot, index) => {
      const hue = index * 137.508 % 360;
      this.debugContext.fillStyle = `hsla(${hue}, 70%, 50%, 0.6)`;
      this.renderHotspotToCanvas(hotspot, scaleX, scaleY);
    });
  }
  /**
   * Perform hit test at screen coordinates
   * MAIN API METHOD - Returns hotspot at given pixel position
   */
  hitTest(screenX, screenY) {
    if (!this.isInitialized || !this.hitContext) {
      console.warn("[HIT_DETECTION] Hit test called before initialization");
      return null;
    }
    if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) {
      console.warn("[HIT_DETECTION] Invalid coordinates:", screenX, screenY);
      return null;
    }
    this.stats.hitTestCount++;
    const cacheKey = `${Math.floor(screenX)},${Math.floor(screenY)}`;
    if (this.hitCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.hitCache.get(cacheKey);
    }
    try {
      const rect = this.hitCanvas.getBoundingClientRect();
      const canvasX = (screenX - rect.left) / rect.width * this.hitCanvas.width;
      const canvasY = (screenY - rect.top) / rect.height * this.hitCanvas.height;
      if (!Number.isFinite(canvasX) || !Number.isFinite(canvasY)) {
        return null;
      }
      const x = Math.max(0, Math.min(this.hitCanvas.width - 1, Math.floor(canvasX)));
      const y = Math.max(0, Math.min(this.hitCanvas.height - 1, Math.floor(canvasY)));
      if (x < 0 || y < 0 || x >= this.hitCanvas.width || y >= this.hitCanvas.height) {
        return null;
      }
      const imageData = this.hitContext.getImageData(x, y, 1, 1);
      const [r, g, b] = imageData.data;
      const color = `rgb(${r},${g},${b})`;
      const hotspot = this.colorToHotspot.get(color);
      if (this.hitCache.size < this.hitCacheSize) {
        this.hitCache.set(cacheKey, hotspot || null);
      }
      if (this.debug && hotspot) {
        console.log(`[HIT_DETECTION] Hit test: (${screenX},${screenY}) → ${hotspot.id}`, {
          canvasCoords: [x, y],
          color,
          pixel: [r, g, b]
        });
      }
      return hotspot || null;
    } catch (error) {
      console.error("[HIT_DETECTION] Hit test error:", error);
      return null;
    }
  }
  /**
   * Clear hit test cache
   */
  clearHitCache() {
    if (Date.now() - this.lastCacheClear > 5e3) {
      this.hitCache.clear();
      this.lastCacheClear = Date.now();
    }
  }
  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.hitCache.size,
      cacheHitRatio: this.stats.cacheHits / Math.max(1, this.stats.hitTestCount),
      isInitialized: this.isInitialized,
      canvasSize: this.hitCanvas ? `${this.hitCanvas.width}x${this.hitCanvas.height}` : "Not created"
    };
  }
  /**
   * Toggle debug visualization
   */
  setDebugMode(enabled) {
    this.debug = enabled;
    if (this.debugCanvas) {
      this.debugCanvas.style.display = enabled ? "block" : "none";
    }
    if (enabled) {
      this.scheduleRedraw();
    }
    console.log(`[HIT_DETECTION] Debug mode: ${enabled ? "ON" : "OFF"}`);
  }
  /**
   * Force redraw (useful for debugging)
   */
  forceRedraw() {
    this.needsRedraw = true;
    this.renderHitCanvas();
  }
  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.hitCanvas) {
      this.viewer.removeOverlay(this.hitCanvas);
    }
    if (this.debugCanvas) {
      this.viewer.removeOverlay(this.debugCanvas);
    }
    this.colorToHotspot.clear();
    this.hotspotToColor.clear();
    this.hitCache.clear();
    this.isInitialized = false;
    console.log("[HIT_DETECTION] Destroyed");
  }
}
class LevelOfDetailManager {
  constructor(options = {}) {
    const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.config = {
      // MOBILE PERFORMANCE: Aggressive limits for 45+ FPS
      maxVisibleHotspots: isMobile2 ? {
        low: 0,
        // zoom < 2.0 - hide all hotspots at low zoom on mobile
        medium: 5,
        // zoom 2.0-5.0 - very limited hotspots
        high: 10,
        // zoom > 5.0 - slightly more hotspots
        critical: 15
        // zoom > 10.0 - maximum for detailed view
      } : {
        low: 50,
        // zoom < 2.0
        medium: 100,
        // zoom 2.0-5.0
        high: 150,
        // zoom > 5.0
        critical: 200
        // zoom > 10.0 (detail mode)
      },
      // Zoom thresholds
      zoomThresholds: {
        low: 2,
        medium: 5,
        high: 10
      },
      // Spatial clustering settings
      clustering: {
        enabled: true,
        minDistance: 50,
        // pixels - hotspots closer than this get clustered
        maxClusterSize: 8,
        // maximum hotspots per cluster
        zoomThreshold: 3
        // disable clustering above this zoom
      },
      // Importance scoring weights
      scoring: {
        typeWeights: {
          audio_only: 1,
          audio_image: 0.9,
          image_only: 0.7,
          link_only: 0.5,
          mixed: 0.8
        },
        sizeWeight: 0.3,
        // larger hotspots get higher priority
        distanceWeight: 0.4,
        // closer to viewport center gets priority
        interactionWeight: 0.3,
        // recently interacted hotspots get priority
        selectedBonus: 2,
        // selected hotspot always visible
        hoveredBonus: 1.5
        // hovered hotspot always visible
      },
      // MOBILE PERFORMANCE FIX: Adjusted thresholds for mobile
      performance: {
        adaptiveThresholds: true,
        fpsThreshold: isMobile2 ? 35 : 45,
        // Target 35 FPS on mobile (more realistic)
        memoryThreshold: isMobile2 ? 150 : 200,
        // Lower memory threshold on mobile
        emergencyReduction: 0.5
        // reduce by 50% in emergency mode
      }
    };
    this.lastZoom = 0;
    this.lastViewportCenter = null;
    this.interactionHistory = /* @__PURE__ */ new Map();
    this.clusterCache = /* @__PURE__ */ new Map();
    this.lastVisibleSet = /* @__PURE__ */ new Set();
    this.performanceMode = "normal";
    this.boundsCache = /* @__PURE__ */ new Map();
    this.centerCache = /* @__PURE__ */ new Map();
    this.lastViewportBounds = null;
    this.cachedVisibleHotspots = null;
    this.lastUpdateTime = 0;
    this.MIN_UPDATE_INTERVAL = 32;
    this.stats = {
      totalHotspots: 0,
      visibleHotspots: 0,
      clusteredHotspots: 0,
      lastUpdateTime: 0,
      averageScore: 0
    };
    this.isMobile = isMobile2;
  }
  /**
   * Main LOD processing method - converts 469 hotspots to intelligent ~150 selection
   * PHASE 1 OPTIMIZATION: Added early exit cache to reduce 43ms → 15-20ms average
   */
  selectVisibleHotspots(allHotspots, viewport, currentZoom, selectedHotspot, hoveredHotspot) {
    const startTime = performance.now();
    const now = performance.now();
    if (now - this.lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
      if (this.cachedVisibleHotspots) {
        return this.cachedVisibleHotspots;
      }
    }
    const bounds = viewport.getBounds();
    const center = bounds.getCenter();
    if (this.lastViewportBounds && this.cachedVisibleHotspots) {
      const lastBounds = this.lastViewportBounds;
      const deltaX = Math.abs(bounds.x - lastBounds.x);
      const deltaY = Math.abs(bounds.y - lastBounds.y);
      const deltaZoom = Math.abs(currentZoom - this.lastZoom);
      const viewportWidth = bounds.width;
      const viewportHeight = bounds.height;
      const movementThreshold = 0.1;
      const movedX = deltaX / viewportWidth;
      const movedY = deltaY / viewportHeight;
      const zoomThreshold = 0.1;
      if (movedX < movementThreshold && movedY < movementThreshold && deltaZoom < zoomThreshold) {
        return this.cachedVisibleHotspots;
      }
    }
    const lodLevel = this.getLODLevel(currentZoom);
    const maxVisible = this.getMaxVisibleCount(lodLevel, currentZoom);
    const candidateHotspots = this.filterViewportCandidates(allHotspots, viewport);
    const clusteredHotspots = this.applySpatialClustering(
      candidateHotspots,
      currentZoom,
      viewport
    );
    const scoredHotspots = this.scoreHotspots(
      clusteredHotspots,
      center,
      selectedHotspot,
      hoveredHotspot
    );
    const visibleHotspots = this.selectTopHotspots(
      scoredHotspots,
      maxVisible,
      selectedHotspot,
      hoveredHotspot
    );
    this.updateStats(candidateHotspots.length, visibleHotspots.length, startTime);
    this.lastViewportBounds = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    };
    this.lastZoom = currentZoom;
    this.cachedVisibleHotspots = visibleHotspots;
    this.lastUpdateTime = now;
    if (candidateHotspots.length > maxVisible && (visibleHotspots.length < candidateHotspots.length * 0.3 || this.stats.lastUpdateTime > 20)) {
      console.log(
        `[LOD] Reduced ${candidateHotspots.length} → ${visibleHotspots.length} hotspots (zoom: ${currentZoom.toFixed(2)})`
      );
    }
    return visibleHotspots;
  }
  /**
   * Determine LOD level based on zoom
   */
  getLODLevel(zoom) {
    if (zoom < this.config.zoomThresholds.low) return "low";
    if (zoom < this.config.zoomThresholds.medium) return "medium";
    if (zoom < this.config.zoomThresholds.high) return "high";
    return "critical";
  }
  /**
   * Get maximum visible count based on LOD level and performance mode
   */
  getMaxVisibleCount(lodLevel, zoom) {
    let maxVisible = this.config.maxVisibleHotspots[lodLevel];
    if (this.performanceMode === "reduced") {
      maxVisible = Math.floor(maxVisible * 0.75);
    } else if (this.performanceMode === "emergency") {
      maxVisible = Math.floor(maxVisible * this.config.performance.emergencyReduction);
    }
    if (lodLevel === "medium") {
      const progress = Math.min(
        1,
        (zoom - this.config.zoomThresholds.low) / (this.config.zoomThresholds.medium - this.config.zoomThresholds.low)
      );
      maxVisible = Math.floor(
        this.config.maxVisibleHotspots.low + (this.config.maxVisibleHotspots.medium - this.config.maxVisibleHotspots.low) * progress
      );
    }
    const minHotspots = this.isMobile ? 15 : 25;
    return Math.max(minHotspots, maxVisible);
  }
  /**
   * Filter hotspots within viewport bounds (existing logic from updateVisibility)
   */
  filterViewportCandidates(allHotspots, viewport) {
    const bounds = viewport.getBounds();
    const topLeft = viewport.viewportToImageCoordinates(bounds.getTopLeft());
    const bottomRight = viewport.viewportToImageCoordinates(bounds.getBottomRight());
    const viewBounds = {
      minX: topLeft.x,
      minY: topLeft.y,
      maxX: bottomRight.x,
      maxY: bottomRight.y
    };
    const zoom = viewport.getZoom();
    const paddingFactor = zoom < 2 ? 0.3 : zoom < 5 ? 0.2 : 0.1;
    const padding = (viewBounds.maxX - viewBounds.minX) * paddingFactor;
    viewBounds.minX -= padding;
    viewBounds.minY -= padding;
    viewBounds.maxX += padding;
    viewBounds.maxY += padding;
    return allHotspots.filter((hotspot) => {
      const overlay = hotspot.overlay;
      if (!overlay || !overlay.bounds) {
        const bounds2 = this.calculateHotspotBounds(hotspot);
        return !(bounds2.maxX < viewBounds.minX || bounds2.minX > viewBounds.maxX || bounds2.maxY < viewBounds.minY || bounds2.minY > viewBounds.maxY);
      }
      return !(overlay.bounds.maxX < viewBounds.minX || overlay.bounds.minX > viewBounds.maxX || overlay.bounds.maxY < viewBounds.minY || overlay.bounds.minY > viewBounds.maxY);
    });
  }
  /**
   * Apply spatial clustering to reduce density in crowded areas
   */
  applySpatialClustering(hotspots, zoom, viewport) {
    if (!this.config.clustering.enabled || zoom > this.config.clustering.zoomThreshold) {
      return hotspots;
    }
    const cacheKey = `${zoom.toFixed(1)}_${hotspots.length}`;
    if (this.clusterCache.has(cacheKey)) {
      return this.clusterCache.get(cacheKey);
    }
    const clusters = [];
    const processed = /* @__PURE__ */ new Set();
    const minDistance = this.config.clustering.minDistance / viewport.getZoom();
    const minDistanceSquared = minDistance * minDistance;
    for (const hotspot of hotspots) {
      if (processed.has(hotspot.id)) continue;
      const cluster = [hotspot];
      processed.add(hotspot.id);
      for (const other of hotspots) {
        if (processed.has(other.id) || cluster.length >= this.config.clustering.maxClusterSize)
          continue;
        if (this.calculateDistanceSquared(hotspot, other) < minDistanceSquared) {
          cluster.push(other);
          processed.add(other.id);
        }
      }
      if (cluster.length > 1) {
        cluster.sort((a, b) => {
          const scoreA = this.config.scoring.typeWeights[a.type] || 0.5;
          const scoreB = this.config.scoring.typeWeights[b.type] || 0.5;
          return scoreB - scoreA;
        });
        clusters.push(...cluster.slice(0, Math.min(2, cluster.length)));
      } else {
        clusters.push(hotspot);
      }
    }
    if (this.clusterCache.size > 10) {
      this.clusterCache.clear();
    }
    this.clusterCache.set(cacheKey, clusters);
    return clusters;
  }
  /**
   * Score hotspots for importance ranking
   */
  scoreHotspots(hotspots, viewportCenter, selectedHotspot, hoveredHotspot) {
    var _a;
    const now = Date.now();
    const maxDistance = Math.max(viewportCenter.x, viewportCenter.y);
    const selectedId = selectedHotspot == null ? void 0 : selectedHotspot.id;
    const hoveredId = hoveredHotspot == null ? void 0 : hoveredHotspot.id;
    const scored = [];
    for (let i = 0; i < hotspots.length; i++) {
      const hotspot = hotspots[i];
      let score = 0;
      score += (this.config.scoring.typeWeights[hotspot.type] || 0.5) * 0.3;
      if ((_a = hotspot.overlay) == null ? void 0 : _a.area) {
        score += Math.min(1, hotspot.overlay.area / 1e4) * this.config.scoring.sizeWeight;
      }
      const center = this.getHotspotCenter(hotspot);
      const dx = viewportCenter.x - center.x;
      const dy = viewportCenter.y - center.y;
      const distanceSquared = dx * dx + dy * dy;
      const maxDistanceSquared = maxDistance * maxDistance;
      const distanceRatio = Math.min(1, distanceSquared / maxDistanceSquared);
      score += Math.max(0, 1 - distanceRatio) * this.config.scoring.distanceWeight;
      const lastInteraction = this.interactionHistory.get(hotspot.id);
      if (lastInteraction && now - lastInteraction < 3e4) {
        score += Math.max(0, 1 - (now - lastInteraction) / 3e4) * this.config.scoring.interactionWeight;
      }
      if (hotspot.id === selectedId) {
        score *= this.config.scoring.selectedBonus;
      } else if (hotspot.id === hoveredId) {
        score *= this.config.scoring.hoveredBonus;
      }
      scored.push({
        hotspot,
        score: Math.min(5, score)
      });
    }
    return scored;
  }
  /**
   * Select top N hotspots based on importance score
   */
  selectTopHotspots(scoredHotspots, maxCount, selectedHotspot, hoveredHotspot) {
    const guaranteed = /* @__PURE__ */ new Set();
    if (selectedHotspot) guaranteed.add(selectedHotspot.id);
    if (hoveredHotspot) guaranteed.add(hoveredHotspot.id);
    scoredHotspots.sort((a, b) => b.score - a.score);
    const selected = [];
    const guaranteedCount = guaranteed.size;
    for (const scored of scoredHotspots) {
      if (guaranteed.has(scored.hotspot.id)) {
        selected.push(scored.hotspot);
        if (selected.length >= guaranteedCount) break;
      }
    }
    maxCount - selected.length;
    for (const scored of scoredHotspots) {
      if (selected.length >= maxCount) break;
      if (!guaranteed.has(scored.hotspot.id)) {
        selected.push(scored.hotspot);
      }
    }
    return selected;
  }
  /**
   * Record interaction for priority scoring
   */
  recordInteraction(hotspotId) {
    this.interactionHistory.set(hotspotId, Date.now());
    if (this.interactionHistory.size > 50) {
      const cutoff = Date.now() - 6e4;
      for (const [id, time] of this.interactionHistory.entries()) {
        if (time < cutoff) {
          this.interactionHistory.delete(id);
        }
      }
    }
  }
  /**
   * Update performance mode based on system metrics
   */
  updatePerformanceMode(currentFPS, memoryUsage) {
    const prevMode = this.performanceMode;
    if (currentFPS > 0 && currentFPS < 30) {
      this.performanceMode = "emergency";
    } else if (currentFPS > 0 && currentFPS < this.config.performance.fpsThreshold) {
      this.performanceMode = "reduced";
    } else if (memoryUsage > this.config.performance.memoryThreshold) {
      this.performanceMode = "reduced";
    } else {
      this.performanceMode = "normal";
    }
    if (prevMode !== this.performanceMode) ;
  }
  /**
   * Utility: Calculate squared distance between two points
   * OPTIMIZATION: Avoid Math.sqrt() - use squared distance for comparisons (5-10x faster)
   * Only use sqrt for display values, not for comparisons
   */
  calculateDistanceSquared(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return dx * dx + dy * dy;
  }
  /**
   * Utility: Calculate actual distance (only when needed for display)
   * @deprecated Use calculateDistanceSquared() for comparisons
   */
  calculateDistance(point1, point2) {
    return Math.sqrt(this.calculateDistanceSquared(point1, point2));
  }
  /**
   * Utility: Calculate bounding box for hotspot coordinates (with caching)
   */
  calculateHotspotBounds(hotspot) {
    const cached = this.boundsCache.get(hotspot.id);
    if (cached) return cached;
    const coordinates = hotspot.coordinates;
    if (!coordinates || coordinates.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    let bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    const processPoints = (points) => {
      points.forEach(([x, y]) => {
        bounds.minX = Math.min(bounds.minX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.maxY = Math.max(bounds.maxY, y);
      });
    };
    if (Array.isArray(coordinates[0]) && typeof coordinates[0][0] === "number") {
      processPoints(coordinates);
    } else {
      coordinates.forEach(processPoints);
    }
    this.boundsCache.set(hotspot.id, bounds);
    return bounds;
  }
  /**
   * Utility: Get center point of hotspot (with caching)
   */
  getHotspotCenter(hotspot) {
    const cached = this.centerCache.get(hotspot.id);
    if (cached) return cached;
    let center;
    if (hotspot.overlay && hotspot.overlay.bounds) {
      const bounds = hotspot.overlay.bounds;
      center = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
      };
    } else {
      const coords = hotspot.coordinates;
      if (coords && coords.length > 0) {
        let sumX = 0, sumY = 0, count = 0;
        const processPoints = (points) => {
          for (const [x, y] of points) {
            sumX += x;
            sumY += y;
            count++;
          }
        };
        if (typeof coords[0][0] === "number") {
          processPoints(coords);
        } else {
          coords.forEach(processPoints);
        }
        center = {
          x: sumX / count,
          y: sumY / count
        };
      } else {
        center = { x: 0, y: 0 };
      }
    }
    this.centerCache.set(hotspot.id, center);
    return center;
  }
  /**
   * Update performance statistics
   */
  updateStats(totalCandidates, visibleCount, startTime) {
    this.stats.totalHotspots = totalCandidates;
    this.stats.visibleHotspots = visibleCount;
    this.stats.lastUpdateTime = performance.now() - startTime;
    const reductionPercent = totalCandidates > 0 ? ((totalCandidates - visibleCount) / totalCandidates * 100).toFixed(1) : 0;
    if (totalCandidates > visibleCount) {
      if (this.stats.lastUpdateTime > 20) {
        console.log(
          `[LOD] Slow processing: ${this.stats.lastUpdateTime.toFixed(2)}ms | Reduction: ${reductionPercent}% | Mode: ${this.performanceMode}`
        );
      }
    }
  }
  /**
   * Get current LOD statistics for debugging
   */
  getStats() {
    return {
      ...this.stats,
      performanceMode: this.performanceMode,
      cacheSize: this.clusterCache.size,
      interactionHistorySize: this.interactionHistory.size
    };
  }
  /**
   * Clear all caches and reset state
   */
  reset() {
    this.clusterCache.clear();
    this.interactionHistory.clear();
    this.lastVisibleSet.clear();
    this.boundsCache.clear();
    this.centerCache.clear();
    this.performanceMode = "normal";
    this.lastViewportBounds = null;
    this.cachedVisibleHotspots = null;
    this.lastUpdateTime = 0;
  }
}
function normalizePath(coordinates, isMultiPolygon) {
  const coords = isMultiPolygon ? coordinates[0] : coordinates;
  let pathData = "";
  coords.forEach(([x, y], index) => {
    if (index === 0) {
      pathData += `M ${Math.round(x)} ${Math.round(y)} `;
    } else {
      pathData += `L ${Math.round(x)} ${Math.round(y)} `;
    }
  });
  pathData += "Z";
  return pathData;
}
function calculateBounds(coordinates) {
  let bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const processPoints = (points) => {
    points.forEach(([x, y]) => {
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    });
  };
  if (Array.isArray(coordinates[0]) && typeof coordinates[0][0] === "number") {
    processPoints(coordinates);
  } else {
    coordinates.forEach(processPoints);
  }
  return bounds;
}
function calculateArea(bounds) {
  return (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
}
function pointInPolygon(x, y, polygon) {
  let inside = false;
  const n = polygon.length;
  let p1x = polygon[0][0];
  let p1y = polygon[0][1];
  for (let i = 1; i <= n; i++) {
    const p2x = polygon[i % n][0];
    const p2y = polygon[i % n][1];
    if (y > Math.min(p1y, p2y)) {
      if (y <= Math.max(p1y, p2y)) {
        if (x <= Math.max(p1x, p2x)) {
          if (p1y !== p2y) {
            const xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x;
            if (p1x === p2x || x <= xinters) {
              inside = !inside;
            }
          }
        }
      }
    }
    p1x = p2x;
    p1y = p2y;
  }
  return inside;
}
class SafariCompatibility {
  constructor({ colorScheme, isMobile: isMobile2 }) {
    this.colorScheme = colorScheme;
    this.isMobile = isMobile2;
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    this.isWebKit = "WebkitAppearance" in document.documentElement.style && !window.chrome;
    this.isSafariOrWebKit = this.isSafari || this.isWebKit;
    this.config = {
      hoverThrottleDelay: 50,
      maxGlowLayers: 3,
      iosClickDelay: 300,
      gpuAccelerationHints: true
    };
  }
  // Browser detection getters
  get isSafariEnvironment() {
    return this.isSafari || this.isWebKit;
  }
  /**
   * Apply unique translateZ to prevent layer merging on Safari
   * This prevents Safari from merging layers which can cause performance issues
   */
  optimizeLayers(overlays) {
    if (!this.isSafari) return;
    let zIndex = 1e-4;
    overlays.forEach((overlay) => {
      const glowLayers = overlay.element.querySelectorAll(
        ".glow-layer-1, .glow-layer-2, .glow-layer-3"
      );
      glowLayers.forEach((layer) => {
        layer.style.transform = `translateZ(${zIndex}px)`;
        zIndex += 1e-4;
      });
    });
  }
  /**
   * Force iOS to redraw/repaint
   * Workaround for iOS rendering bugs
   */
  forceIOSRedraw() {
    if (!this.isMobile || !this.isSafariEnvironment) return;
    const body = document.body;
    const originalTransform = body.style.transform;
    body.style.transform = "translateZ(0)";
    void body.offsetHeight;
    body.style.transform = originalTransform;
  }
  /**
   * Create Safari-specific glow layers for a hotspot
   * Safari needs multiple layers for the glow effect due to filter limitations
   */
  createGlowLayers(group, normalizedPath, colorScheme) {
    if (!this.isSafari) return;
    if (group.querySelector(".glow-layer-1")) {
      console.log("Glow layers already exist for this group, skipping creation");
      return;
    }
    colorScheme.main === "#000000";
    const glowPath5 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    glowPath5.setAttribute("d", normalizedPath);
    glowPath5.setAttribute("fill", "none");
    glowPath5.setAttribute("stroke", "rgba(255, 255, 255, 0.2)");
    glowPath5.setAttribute("stroke-width", "30");
    glowPath5.setAttribute("opacity", "0");
    glowPath5.setAttribute("pathLength", "100");
    glowPath5.setAttribute("data-animated", "true");
    glowPath5.style.pointerEvents = "none";
    glowPath5.style.filter = "blur(4px)";
    glowPath5.classList.add("glow-layer-5");
    group.appendChild(glowPath5);
    const glowPath4 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    glowPath4.setAttribute("d", normalizedPath);
    glowPath4.setAttribute("fill", "none");
    glowPath4.setAttribute("stroke", "rgba(11, 18, 21, 0.4)");
    glowPath4.setAttribute("stroke-width", "25");
    glowPath4.setAttribute("opacity", "0");
    glowPath4.setAttribute("pathLength", "100");
    glowPath4.setAttribute("data-animated", "true");
    glowPath4.style.pointerEvents = "none";
    glowPath4.style.filter = "blur(3px)";
    glowPath4.style.transform = "translate(2px, 3px)";
    glowPath4.classList.add("glow-layer-4");
    group.appendChild(glowPath4);
    const glowPath3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    glowPath3.setAttribute("d", normalizedPath);
    glowPath3.setAttribute("fill", "none");
    glowPath3.setAttribute("stroke", "rgba(11, 18, 21, 0.5)");
    glowPath3.setAttribute("stroke-width", "15");
    glowPath3.setAttribute("opacity", "0");
    glowPath3.setAttribute("pathLength", "100");
    glowPath3.setAttribute("data-animated", "true");
    glowPath3.style.pointerEvents = "none";
    glowPath3.style.filter = "blur(2px)";
    glowPath3.classList.add("glow-layer-3");
    group.appendChild(glowPath3);
    const glowPath2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    glowPath2.setAttribute("d", normalizedPath);
    glowPath2.setAttribute("fill", "none");
    glowPath2.setAttribute("stroke", "rgba(11, 18, 21, 0.7)");
    glowPath2.setAttribute("stroke-width", "8");
    glowPath2.setAttribute("opacity", "0");
    glowPath2.setAttribute("pathLength", "100");
    glowPath2.setAttribute("data-animated", "true");
    glowPath2.style.pointerEvents = "none";
    glowPath2.style.filter = "blur(1px)";
    glowPath2.classList.add("glow-layer-2");
    group.appendChild(glowPath2);
    const glowPath1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    glowPath1.setAttribute("d", normalizedPath);
    glowPath1.setAttribute("fill", "none");
    glowPath1.setAttribute("stroke", "#000000");
    glowPath1.setAttribute("stroke-width", "4");
    glowPath1.setAttribute("opacity", "0");
    glowPath1.setAttribute("pathLength", "100");
    glowPath1.setAttribute("data-animated", "true");
    glowPath1.style.pointerEvents = "none";
    glowPath1.style.filter = "contrast(1.5)";
    glowPath1.classList.add("glow-layer-1");
    group.appendChild(glowPath1);
    return { glowPath1, glowPath2, glowPath3, glowPath4, glowPath5 };
  }
  /**
   * Store real path length on glow layers for synchronized animation
   */
  setGlowLayerLengths(group, realLength) {
    const glowLayer1 = group.querySelector(".glow-layer-1");
    const glowLayer2 = group.querySelector(".glow-layer-2");
    const glowLayer3 = group.querySelector(".glow-layer-3");
    const glowLayer4 = group.querySelector(".glow-layer-4");
    const glowLayer5 = group.querySelector(".glow-layer-5");
    [glowLayer1, glowLayer2, glowLayer3, glowLayer4, glowLayer5].forEach((layer) => {
      if (layer) {
        layer.setAttribute("data-real-length", realLength);
        layer.setAttribute("data-animated", "true");
      }
    });
  }
  /**
   * Setup iOS/Safari click handler for better touch detection
   */
  setupIOSClickHandler(svg, findHotspotCallback, activateHotspotCallback) {
    if (!this.isMobile && !this.isSafariOrWebKit) return;
    svg.addEventListener(
      "click",
      (event) => {
        var _a, _b, _c;
        if (event.target.tagName === "path" || event.target.tagName === "g" || event.target.closest("g[data-hotspot-id]")) {
          return;
        }
        const modeStateManager = (_a = window.nativeHotspotRenderer) == null ? void 0 : _a.modeStateManager;
        const echoController = (_b = window.nativeHotspotRenderer) == null ? void 0 : _b.echoController;
        if (modeStateManager && echoController && modeStateManager.getCurrentMode() === "direct" && ((_c = echoController.config) == null ? void 0 : _c.enabled)) {
          console.log("iOS/Safari: Skipping click - echo mode active");
          return;
        }
        const clickedHotspot = findHotspotCallback(event);
        if (clickedHotspot) {
          console.log(
            "iOS/Safari: Found hotspot at SVG click position:",
            clickedHotspot.id
          );
          event.stopPropagation();
          event.preventDefault();
          activateHotspotCallback(clickedHotspot);
        }
      },
      true
    );
  }
  /**
   * Create hover throttle for Safari performance
   */
  createHoverThrottle() {
    let throttleTimer = null;
    return (callback) => {
      if (!this.isSafari) {
        callback();
        return;
      }
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, this.config.hoverThrottleDelay);
      callback();
    };
  }
  /**
   * Optimize paths for Safari GPU acceleration
   */
  optimizePathsForGPU(overlay) {
    if (!this.isSafari) return;
    const paths = overlay.element.getElementsByTagName("path");
    for (let path of paths) {
      path.style.transform = "translateZ(0)";
      path.style.webkitBackfaceVisibility = "hidden";
    }
  }
  /**
   * Stop all Safari glow layer animations immediately
   */
  stopSafariGlowAnimations(group) {
    const allPaths = group.querySelectorAll("path");
    allPaths.forEach((path) => {
      if (path.currentAnimation) {
        path.currentAnimation.cancel();
        path.currentAnimation = null;
      }
      if (path.getAnimations) {
        path.getAnimations().forEach((animation) => animation.cancel());
      }
      path.style.strokeDasharray = "0 100";
      path.style.opacity = "0";
    });
  }
  /**
   * Animate Safari glow layers using Web Animations API
   */
  animateSafariGlowLayers(group, state, animationDuration, colorScheme, timingEasing) {
    const glowLayer1 = group.querySelector(".glow-layer-1");
    const glowLayer2 = group.querySelector(".glow-layer-2");
    const glowLayer3 = group.querySelector(".glow-layer-3");
    const glowLayer4 = group.querySelector(".glow-layer-4");
    const mainPath = group.querySelector(".main-path");
    const hotspotId = group.getAttribute("data-hotspot-id");
    const pathLength = 100;
    const randomStart = Math.random() * pathLength;
    console.log(
      `[Safari Random Start] Rotating dash animation for ${hotspotId}: offset ${randomStart.toFixed(1)}% of path`
    );
    const isBlackOnBlack = colorScheme.main === "#000000";
    const glowLayers = [
      { element: mainPath, delay: 0, opacity: "1" },
      // Always full opacity
      {
        element: glowLayer1,
        delay: 0,
        opacity: state === "selected" ? isBlackOnBlack ? "0.9" : "1" : isBlackOnBlack ? "0.85" : "0.95"
      },
      {
        element: glowLayer2,
        delay: 0,
        opacity: state === "selected" ? isBlackOnBlack ? "0.8" : "0.9" : isBlackOnBlack ? "0.7" : "0.85"
      },
      {
        element: glowLayer3,
        delay: 0,
        opacity: state === "selected" ? isBlackOnBlack ? "0.6" : "0.8" : isBlackOnBlack ? "0.5" : "0.7"
      },
      { element: glowLayer4, delay: 0, opacity: state === "selected" ? "0.35" : "0.3" }
      // Strong white contrast layer
    ];
    glowLayers.forEach(({ element, delay, opacity: finalOpacity }) => {
      if (element && element.animate) {
        element.style.removeProperty("opacity");
        Object.assign(element.style, {
          strokeDasharray: "0 100",
          // Start with no visible stroke
          strokeDashoffset: `-${randomStart}`,
          opacity: "0",
          visibility: "visible",
          // Ensure layer is visible when animating
          transition: "none",
          animation: "none",
          // Removed vectorEffect to fix stroke-dashoffset animation during zoom
          paintOrder: "stroke",
          transform: `translateZ(${delay * 1e-3}px)`,
          willChange: "stroke-dasharray, stroke-dashoffset, opacity"
        });
        const animation = element.animate(
          [
            {
              // Start: completely invisible
              strokeDasharray: "0 100",
              strokeDashoffset: `-${randomStart}`,
              opacity: "0",
              offset: 0
            },
            {
              // Early: small dash appears
              strokeDasharray: "10 90",
              strokeDashoffset: `-${randomStart}`,
              opacity: "0.1",
              offset: 0.1
            },
            {
              // Middle: half of the path is drawn
              strokeDasharray: "50 50",
              strokeDashoffset: `-${randomStart}`,
              opacity: "0.3",
              offset: 0.5
            },
            {
              // Near end: almost complete
              strokeDasharray: "95 5",
              strokeDashoffset: `-${randomStart}`,
              opacity: finalOpacity,
              offset: 0.95
            },
            {
              // End: complete path visible - keep the same offset to avoid jump
              strokeDasharray: "100 0",
              strokeDashoffset: `-${randomStart}`,
              opacity: finalOpacity,
              offset: 1
            }
          ],
          {
            duration: animationDuration * 1e3,
            delay,
            easing: timingEasing,
            fill: "forwards"
          }
        );
        if (element.currentAnimation) {
          element.currentAnimation.cancel();
          element.currentAnimation = null;
        }
        element.currentAnimation = animation;
        animation.finished.then(() => {
          group.setAttribute("data-animation-completed", "true");
          group.setAttribute("data-animation-active", "false");
        }).catch(() => {
        });
        if (state === "selected") {
          if (delay === 150) element.style.filter = "blur(1px)";
          if (delay === 100) element.style.filter = "blur(2px)";
          if (delay === 50) element.style.filter = "blur(3px)";
        } else {
          if (delay === 150) element.style.filter = "none";
          if (delay === 100) element.style.filter = "blur(1px)";
          if (delay === 50) element.style.filter = "blur(2px)";
        }
      }
    });
  }
  /**
   * Reset Safari glow layers to normal state
   */
  resetSafariGlowLayers(group) {
    const glowLayers = group.querySelectorAll(
      ".glow-layer-1, .glow-layer-2, .glow-layer-3, .glow-layer-4"
    );
    const mainPath = group.querySelector(".main-path");
    const allLayers = mainPath ? [mainPath, ...glowLayers] : [...glowLayers];
    allLayers.forEach((layer) => {
      var _a, _b;
      (_b = (_a = layer.getAnimations) == null ? void 0 : _a.call(layer)) == null ? void 0 : _b.forEach((animation) => animation.cancel());
      if (layer.currentAnimation) {
        layer.currentAnimation.cancel();
        layer.currentAnimation = null;
      }
      layer.style.animation = "none";
      void layer.offsetWidth;
      Object.assign(layer.style, {
        strokeDasharray: "none",
        strokeDashoffset: "0",
        transition: "opacity 0.2s ease-out",
        filter: "none",
        visibility: "visible"
        // Keep visible, rely on opacity
      });
      layer.style.setProperty("opacity", "0", "important");
    });
  }
}
class HotspotStateManager {
  constructor() {
    this.overlays = /* @__PURE__ */ new Map();
    this.visibleOverlays = /* @__PURE__ */ new Set();
    this.hoveredHotspot = null;
    this.selectedHotspot = null;
    this.selectionTimestamp = null;
    this.hotspotAreas = /* @__PURE__ */ new Map();
    this.callbacks = {
      onHoverChange: null,
      onSelectionChange: null,
      onVisibilityChange: null
    };
  }
  /**
   * Register callbacks for state changes
   */
  setCallbacks({ onHoverChange, onSelectionChange, onVisibilityChange }) {
    if (onHoverChange) this.callbacks.onHoverChange = onHoverChange;
    if (onSelectionChange) this.callbacks.onSelectionChange = onSelectionChange;
    if (onVisibilityChange) this.callbacks.onVisibilityChange = onVisibilityChange;
  }
  /**
   * Add or update an overlay
   */
  addOverlay(id, overlayData) {
    this.overlays.set(id, overlayData);
    if (overlayData.area !== void 0) {
      this.hotspotAreas.set(id, overlayData.area);
    }
  }
  /**
   * Get overlay by ID
   */
  getOverlay(id) {
    return this.overlays.get(id);
  }
  /**
   * Get all overlays
   */
  getAllOverlays() {
    return this.overlays;
  }
  /**
   * Remove overlay
   */
  removeOverlay(id) {
    var _a, _b;
    this.overlays.delete(id);
    this.hotspotAreas.delete(id);
    this.visibleOverlays.delete(id);
    if (((_a = this.hoveredHotspot) == null ? void 0 : _a.id) === id) {
      this.setHoveredHotspot(null);
    }
    if (((_b = this.selectedHotspot) == null ? void 0 : _b.id) === id) {
      this.setSelectedHotspot(null);
    }
  }
  /**
   * Update overlay visibility
   */
  setOverlayVisibility(id, isVisible) {
    const overlay = this.overlays.get(id);
    if (!overlay) return;
    overlay.isVisible = isVisible;
    if (isVisible) {
      this.visibleOverlays.add(id);
    } else {
      this.visibleOverlays.delete(id);
    }
    if (this.callbacks.onVisibilityChange) {
      this.callbacks.onVisibilityChange(id, isVisible);
    }
  }
  /**
   * Batch update visibility for multiple overlays
   */
  batchUpdateVisibility(updates) {
    updates.forEach(({ id, isVisible }) => {
      const overlay = this.overlays.get(id);
      if (overlay) {
        overlay.isVisible = isVisible;
        if (isVisible) {
          this.visibleOverlays.add(id);
        } else {
          this.visibleOverlays.delete(id);
        }
      }
    });
    if (this.callbacks.onVisibilityChange) {
      this.callbacks.onVisibilityChange(null, null, updates);
    }
  }
  /**
   * Get visible overlay count
   */
  getVisibleCount() {
    return this.visibleOverlays.size;
  }
  /**
   * Check if overlay is visible
   */
  isOverlayVisible(id) {
    const overlay = this.overlays.get(id);
    return overlay ? overlay.isVisible : false;
  }
  /**
   * Set hovered hotspot
   */
  setHoveredHotspot(hotspot) {
    const previousHovered = this.hoveredHotspot;
    this.hoveredHotspot = hotspot;
    if (this.callbacks.onHoverChange) {
      this.callbacks.onHoverChange(hotspot, previousHovered);
    }
  }
  /**
   * Set selected hotspot
   */
  setSelectedHotspot(hotspot) {
    const previousSelected = this.selectedHotspot;
    this.selectedHotspot = hotspot;
    this.selectionTimestamp = hotspot ? Date.now() : null;
    if (this.callbacks.onSelectionChange) {
      this.callbacks.onSelectionChange(hotspot, previousSelected);
    }
  }
  /**
   * Get current hovered hotspot
   */
  getHoveredHotspot() {
    return this.hoveredHotspot;
  }
  /**
   * Get current selected hotspot
   */
  getSelectedHotspot() {
    return this.selectedHotspot;
  }
  /**
   * Get hotspot area from cache
   */
  getHotspotArea(id) {
    return this.hotspotAreas.get(id);
  }
  /**
   * Find overlays within bounds
   */
  findOverlaysInBounds(bounds) {
    const results = [];
    this.overlays.forEach((overlay, id) => {
      if (!overlay.bounds) return;
      if (overlay.bounds.minX <= bounds.maxX && overlay.bounds.maxX >= bounds.minX && overlay.bounds.minY <= bounds.maxY && overlay.bounds.maxY >= bounds.minY) {
        results.push(overlay);
      }
    });
    return results;
  }
  /**
   * Clear all state
   */
  clear() {
    this.overlays.clear();
    this.visibleOverlays.clear();
    this.hotspotAreas.clear();
    this.hoveredHotspot = null;
    this.selectedHotspot = null;
    this.selectionTimestamp = null;
  }
  /**
   * Get state summary for debugging
   */
  getStateSummary() {
    var _a, _b;
    return {
      totalOverlays: this.overlays.size,
      visibleOverlays: this.visibleOverlays.size,
      hoveredId: ((_a = this.hoveredHotspot) == null ? void 0 : _a.id) || null,
      selectedId: ((_b = this.selectedHotspot) == null ? void 0 : _b.id) || null,
      selectionAge: this.selectionTimestamp ? Date.now() - this.selectionTimestamp : null
    };
  }
}
class EventEmitter {
  constructor() {
    this.events = /* @__PURE__ */ new Map();
  }
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, /* @__PURE__ */ new Set());
    }
    this.events.get(event).add(handler);
    return () => this.off(event, handler);
  }
  off(event, handler) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }
  emit(event, data) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  once(event, handler) {
    const wrappedHandler = (data) => {
      this.off(event, wrappedHandler);
      handler(data);
    };
    return this.on(event, wrappedHandler);
  }
  clear() {
    this.events.clear();
  }
}
class HoverIntentDetector {
  constructor(options = {}) {
    this.velocityThreshold = options.velocityThreshold || 150;
    this.dwellThreshold = options.dwellThreshold || 100;
    this.historySize = options.historySize || 10;
    this.history = [];
    this.lastPosition = null;
    this.lastTime = null;
  }
  updatePosition(x, y) {
    const now = performance.now();
    if (this.lastPosition && this.lastTime) {
      const deltaX = x - this.lastPosition.x;
      const deltaY = y - this.lastPosition.y;
      const deltaTime = now - this.lastTime;
      if (deltaTime > 0) {
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / deltaTime * 1e3;
        this.history.push({
          velocity,
          time: now,
          position: { x, y }
        });
        if (this.history.length > this.historySize) {
          this.history.shift();
        }
      }
    }
    this.lastPosition = { x, y };
    this.lastTime = now;
  }
  calculateVelocity() {
    if (this.history.length === 0) return 0;
    const recentHistory = this.history.slice(-5);
    const avgVelocity = recentHistory.reduce((sum, entry) => sum + entry.velocity, 0) / recentHistory.length;
    return avgVelocity;
  }
  calculateDwellTime() {
    if (this.history.length === 0) return 0;
    const now = performance.now();
    const lastMove = this.history[this.history.length - 1];
    return now - lastMove.time;
  }
  shouldTriggerHover() {
    const velocity = this.calculateVelocity();
    const dwellTime = this.calculateDwellTime();
    if (window.DEBUG_ANIMATIONS) {
      console.log(
        `[HoverIntent] Velocity: ${velocity.toFixed(0)} px/s, Dwell: ${dwellTime.toFixed(0)}ms, VelThreshold: ${this.velocityThreshold}, DwellThreshold: ${this.dwellThreshold}`
      );
    }
    if (velocity > this.velocityThreshold) {
      return false;
    }
    return dwellTime > this.dwellThreshold;
  }
  getInteractionMode() {
    const velocity = this.calculateVelocity();
    if (velocity > 200) return "exploration";
    if (velocity > 100) return "navigation";
    return "detail";
  }
  reset() {
    this.history = [];
    this.lastPosition = null;
    this.lastTime = null;
  }
}
class EventCoordinator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.isMobile = options.isMobile || false;
    this.isSafari = options.isSafari || false;
    this.clickTimeThreshold = options.clickTimeThreshold || 300;
    this.clickDistThreshold = options.clickDistThreshold || (this.isMobile ? 12 : 8);
    this.mobileDragThreshold = options.mobileDragThreshold || 15;
    this.activePointers = /* @__PURE__ */ new Map();
    this.primaryPointerId = null;
    this.isDragging = false;
    this.isPinching = false;
    this.dragStartTime = 0;
    this.dragStartPoint = null;
    this.lastEchoTapTime = 0;
    this.hoverThrottleTimer = null;
    this.baseHoverDelay = {
      exploration: 50,
      // 50-100ms for rapid scanning
      navigation: 100,
      // 100-150ms for balanced interaction
      detail: 150
      // 150-200ms for precise examination
    };
    this.hoverThrottleDelay = this.isSafari ? 50 : 0;
    this.hoverIntentDetector = new HoverIntentDetector({
      velocityThreshold: 300,
      // Increased from 150 to allow normal hover speed
      dwellThreshold: 50
      // Reduced from 100 for quicker response
    });
    this.currentMode = "direct";
    this.temporalState = {
      active: false,
      phase: null,
      hotspot: null
    };
    this.eventProcessingPaused = false;
    this.frameAlignedEnabled = options.frameAlignedEnabled !== false && this.isMobile;
    this.pendingPointerEvents = [];
    this.frameScheduled = false;
    this.lastFrameTime = 0;
    this.eventTypes = {
      // Pointer events
      POINTER_DOWN: "pointer:down",
      POINTER_MOVE: "pointer:move",
      POINTER_UP: "pointer:up",
      POINTER_CANCEL: "pointer:cancel",
      // Mouse events
      MOUSE_MOVE: "mouse:move",
      CLICK: "click",
      // Touch events
      TOUCH_START: "touch:start",
      TOUCH_MOVE: "touch:move",
      TOUCH_END: "touch:end",
      // Drag events
      DRAG_START: "drag:start",
      DRAG_MOVE: "drag:move",
      DRAG_END: "drag:end",
      // Hotspot events
      HOTSPOT_HOVER: "hotspot:hover",
      HOTSPOT_SELECT: "hotspot:select",
      HOTSPOT_DESELECT: "hotspot:deselect",
      HOTSPOT_ACTIVATE: "hotspot:activate",
      // Mode events
      MODE_CHANGE: "mode:change",
      TEMPORAL_PHASE: "temporal:phase",
      TEMPORAL_START: "temporal:start",
      TEMPORAL_END: "temporal:end",
      REVEAL_TOGGLE: "reveal:toggle",
      // Temporal Echo events
      ECHO_TAP: "echo:tap",
      ECHO_REVEAL_START: "echo:reveal:start",
      ECHO_REVEAL_END: "echo:reveal:end",
      // Visibility events
      VISIBILITY_CHANGE: "visibility:change",
      VISIBILITY_UPDATE: "visibility:update",
      // Animation events
      ANIMATION_START: "animation:start",
      ANIMATION_END: "animation:end",
      ZOOM_START: "zoom:start",
      ZOOM_END: "zoom:end"
    };
    this.fastPathEnabled = options.fastPathEnabled !== false;
    this.fastPathThreshold = options.fastPathThreshold || 150;
    this.fastPathDistanceThreshold = options.fastPathDistanceThreshold || 20;
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }
  /**
   * Fast-path detection for simple taps
   * Bypasses GestureStateMachine for 90% of tap interactions
   */
  isSimpleFastTap(duration, distance, activePointers) {
    if (!this.fastPathEnabled || !this.isMobile) return false;
    return duration < this.fastPathThreshold && distance < this.fastPathDistanceThreshold && activePointers === 1 && !this.isPinching && !this.isDragging;
  }
  /**
   * Update hover delay based on zoom level (research-based)
   */
  updateHoverDelayForZoom(zoom) {
    const maxZoom = 10;
    const zoomPercent = zoom / maxZoom * 100;
    let mode;
    let baseDelay;
    if (zoomPercent < 50) {
      mode = "exploration";
      baseDelay = this.baseHoverDelay.exploration;
    } else if (zoomPercent < 200) {
      mode = "navigation";
      baseDelay = this.baseHoverDelay.navigation;
    } else {
      mode = "detail";
      baseDelay = this.baseHoverDelay.detail;
    }
    if (this.isSafari) {
      baseDelay = Math.min(baseDelay * 1.2, 200);
    }
    this.hoverThrottleDelay = baseDelay;
    if (window.DEBUG_ANIMATIONS) {
      console.log(
        `[EventCoordinator] Hover delay updated: mode=${mode}, delay=${this.hoverThrottleDelay}ms`
      );
    }
  }
  /**
   * Initialize event listeners on container
   */
  initialize(container, svg) {
    this.container = container;
    this.svg = svg;
    container.addEventListener("pointerdown", this.handlePointerDown);
    container.addEventListener("pointermove", this.handlePointerMove);
    container.addEventListener("pointerup", this.handlePointerUp);
    container.addEventListener("pointercancel", this.handlePointerCancel);
    svg.addEventListener("mousemove", this.handleMouseMove);
    if (this.isMobile) {
      svg.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false });
    }
    this.on(this.eventTypes.ECHO_TAP, (tapData) => {
      if (tapData.wasHandledAsEcho) {
        this.lastEchoTapTime = performance.now();
      }
    });
  }
  /**
   * Handle pointer down events
   */
  handlePointerDown(event) {
    this.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      startTime: Date.now()
    });
    if (this.activePointers.size === 1) {
      this.primaryPointerId = event.pointerId;
      this.dragStartTime = Date.now();
      this.dragStartPoint = { x: event.clientX, y: event.clientY };
    }
    if (this.activePointers.size >= 2) {
      this.isPinching = true;
    }
    this.emit(this.eventTypes.POINTER_DOWN, {
      pointerId: event.pointerId,
      isPrimary: event.pointerId === this.primaryPointerId,
      x: event.clientX,
      y: event.clientY,
      activePointers: this.activePointers.size,
      event
    });
    if (this.isMobile) {
      event.preventDefault();
    }
  }
  /**
   * Handle pointer move events
   */
  handlePointerMove(event) {
    if (!this.activePointers.has(event.pointerId)) return;
    const pointer = this.activePointers.get(event.pointerId);
    const prevX = pointer.x;
    const prevY = pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    const distance = Math.sqrt(
      Math.pow(event.clientX - pointer.startX, 2) + Math.pow(event.clientY - pointer.startY, 2)
    );
    const dragThreshold = this.isMobile ? this.mobileDragThreshold : this.clickDistThreshold;
    if (!this.isDragging && distance > dragThreshold) {
      this.isDragging = true;
      this.emit(this.eventTypes.DRAG_START, {
        pointerId: event.pointerId,
        startX: pointer.startX,
        startY: pointer.startY,
        currentX: event.clientX,
        currentY: event.clientY
      });
    }
    this.emit(this.eventTypes.POINTER_MOVE, {
      pointerId: event.pointerId,
      isPrimary: event.pointerId === this.primaryPointerId,
      x: event.clientX,
      y: event.clientY,
      deltaX: event.clientX - prevX,
      deltaY: event.clientY - prevY,
      distance,
      isDragging: this.isDragging,
      isPinching: this.isPinching,
      event
    });
    if (this.isDragging) {
      this.emit(this.eventTypes.DRAG_MOVE, {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        deltaX: event.clientX - prevX,
        deltaY: event.clientY - prevY
      });
    }
  }
  /**
   * Process pending pointer events in frame-aligned manner
   */
  processPendingPointerEvents() {
    if (this.pendingPointerEvents.length === 0) {
      this.frameScheduled = false;
      return;
    }
    const startTime = performance.now();
    const frameBudget = 16;
    while (this.pendingPointerEvents.length > 0 && performance.now() - startTime < frameBudget) {
      const pendingEvent = this.pendingPointerEvents.shift();
      this.processPointerEventImmediate(pendingEvent);
    }
    if (this.pendingPointerEvents.length > 0) {
      requestAnimationFrame(() => this.processPendingPointerEvents());
    } else {
      this.frameScheduled = false;
    }
    this.lastFrameTime = performance.now();
  }
  /**
   * Handle pointer up events
   */
  handlePointerUp(event) {
    if (this.frameAlignedEnabled && this.isMobile) {
      this.pendingPointerEvents.push({
        type: "pointerup",
        event,
        timestamp: performance.now()
      });
      if (!this.frameScheduled) {
        this.frameScheduled = true;
        requestAnimationFrame(() => this.processPendingPointerEvents());
      }
      return;
    }
    this.processPointerEventImmediate({ type: "pointerup", event });
  }
  /**
   * Process pointer up event immediately
   */
  processPointerEventImmediate(pendingEvent) {
    const event = pendingEvent.event;
    console.log("[EventCoordinator] processPointerEventImmediate - checking pointer:", {
      pointerId: event.pointerId,
      hasPointer: this.activePointers.has(event.pointerId),
      activePointers: Array.from(this.activePointers.keys())
    });
    if (!this.activePointers.has(event.pointerId)) {
      console.log("[EventCoordinator] Pointer not found in activePointers, returning");
      return;
    }
    const pointer = this.activePointers.get(event.pointerId);
    const duration = Date.now() - pointer.startTime;
    const distance = Math.sqrt(
      Math.pow(event.clientX - pointer.startX, 2) + Math.pow(event.clientY - pointer.startY, 2)
    );
    const dragEndThreshold = this.isMobile ? 100 : 200;
    const wasRecentlyDragging = this.isDragging || this.lastDragEndTime && Date.now() - this.lastDragEndTime < dragEndThreshold;
    const isFastTap = this.isSimpleFastTap(duration, distance, this.activePointers.size);
    if (isFastTap && !wasRecentlyDragging) {
      console.log("[EventCoordinator] Fast-path tap detected - bypassing gesture chain");
      const tapData = {
        x: event.clientX,
        y: event.clientY,
        timestamp: performance.now(),
        wasHandledAsEcho: false
        // Default to false, will be set to true if handled as tempo 1
      };
      this.emit(this.eventTypes.ECHO_TAP, tapData);
      console.log(
        "[EventCoordinator] After ECHO_TAP, wasHandledAsEcho:",
        tapData.wasHandledAsEcho
      );
      if (tapData.wasHandledAsEcho) {
        console.log("[EventCoordinator] Fast tap handled as echo (tempo 1), exiting");
        this.activePointers.delete(event.pointerId);
        if (this.activePointers.size === 0) {
          this.primaryPointerId = null;
          this.isPinching = false;
          this.isDragging = false;
          this.dragStartTime = 0;
          this.dragStartPoint = null;
        }
        return;
      } else {
        console.log(
          "[EventCoordinator] Fast tap was on revealed hotspot (tempo 2), continuing to click handler"
        );
      }
    }
    const pointerIdValid = this.primaryPointerId === null && this.activePointers.size === 1 || event.pointerId === this.primaryPointerId;
    const wasClick = pointerIdValid && this.activePointers.size === 1 && !this.isPinching && !this.isDragging && !wasRecentlyDragging && // Prevent clicks after pan
    distance < this.clickDistThreshold && duration < this.clickTimeThreshold;
    console.log("[EventCoordinator] Click detection:", {
      wasClick,
      primaryPointerId: this.primaryPointerId,
      eventPointerId: event.pointerId,
      pointerIdValid,
      activePointers: this.activePointers.size,
      isPinching: this.isPinching,
      isDragging: this.isDragging,
      wasRecentlyDragging,
      distance,
      duration,
      clickDistThreshold: this.clickDistThreshold,
      clickTimeThreshold: this.clickTimeThreshold,
      conditions: {
        pointerIdValid,
        singlePointer: this.activePointers.size === 1,
        notPinching: !this.isPinching,
        notDragging: !this.isDragging,
        notRecentlyDragging: !wasRecentlyDragging,
        distanceOK: distance < this.clickDistThreshold,
        durationOK: duration < this.clickTimeThreshold
      }
    });
    this.emit(this.eventTypes.POINTER_UP, {
      pointerId: event.pointerId,
      isPrimary: event.pointerId === this.primaryPointerId,
      x: event.clientX,
      y: event.clientY,
      duration,
      distance,
      wasClick,
      wasDrag: this.isDragging,
      event
    });
    if (wasClick) {
      const now = performance.now();
      let shouldSuppressClick = false;
      const recentEchoTap = this.lastEchoTapTime && now - this.lastEchoTapTime < 100;
      if (recentEchoTap) {
        shouldSuppressClick = true;
        console.log("[EventCoordinator] Suppressing click after quick tap");
      }
      if (wasRecentlyDragging) {
        shouldSuppressClick = true;
        console.log("[EventCoordinator] Suppressing click after recent drag/pan");
      }
      if (!shouldSuppressClick) {
        if (this.isMobile && wasClick) {
          console.log(
            "[EventCoordinator] Mobile tap detected in normal path, checking for tempo handling"
          );
          const tapData = {
            x: event.clientX,
            y: event.clientY,
            timestamp: performance.now(),
            wasHandledAsEcho: false
          };
          this.emit(this.eventTypes.ECHO_TAP, tapData);
          console.log(
            "[EventCoordinator] After ECHO_TAP (normal path), wasHandledAsEcho:",
            tapData.wasHandledAsEcho
          );
          if (tapData.wasHandledAsEcho) {
            console.log(
              "[EventCoordinator] Normal path tap handled as tempo 1, suppressing CLICK"
            );
            shouldSuppressClick = true;
          }
        }
        if (!shouldSuppressClick) {
          console.log(
            "[EventCoordinator] Emitting CLICK event at",
            event.clientX,
            event.clientY
          );
          this.emit(this.eventTypes.CLICK, {
            x: event.clientX,
            y: event.clientY,
            duration,
            event
          });
        }
      } else {
        console.log(
          "[EventCoordinator] Click suppressed - recentEchoTap:",
          recentEchoTap,
          "wasRecentlyDragging:",
          wasRecentlyDragging
        );
      }
      setTimeout(() => {
        if (this.isDragging) {
          console.log("[EventCoordinator] Force resetting stuck drag state after click");
          this.isDragging = false;
          if (window.lastKnownMouseX !== void 0 && window.lastKnownMouseY !== void 0) {
            this.emit(this.eventTypes.MOUSE_MOVE, {
              x: window.lastKnownMouseX,
              y: window.lastKnownMouseY,
              skipAnimation: false,
              forceHover: true
            });
          }
        }
      }, 50);
    }
    if (this.isDragging && event.pointerId === this.primaryPointerId) {
      this.emit(this.eventTypes.DRAG_END, {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        duration,
        distance
      });
    }
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size === 0) {
      this.primaryPointerId = null;
      this.isPinching = false;
      this.isDragging = false;
      this.dragStartTime = 0;
      this.dragStartPoint = null;
    } else if (wasClick) {
      console.log(
        "[EventCoordinator] Resetting drag state after click even with active pointers"
      );
      this.isDragging = false;
    }
  }
  /**
   * Handle pointer cancel events
   */
  handlePointerCancel(event) {
    this.handlePointerUp(event);
    this.emit(this.eventTypes.POINTER_CANCEL, {
      pointerId: event.pointerId
    });
  }
  /**
   * Handle mouse move events with adaptive throttling and velocity detection
   */
  handleMouseMove(event) {
    if (this.isDragging && this.activePointers.size === 0) {
      console.warn(
        "[EventCoordinator] Detected stuck drag state with no active pointers, resetting"
      );
      this.isDragging = false;
      this.dragStartTime = 0;
      this.dragStartPoint = null;
    }
    if (this.isDragging || this.currentMode === "temporal") {
      return;
    }
    this.hoverIntentDetector.updatePosition(event.clientX, event.clientY);
    this.hoverIntentDetector.shouldTriggerHover();
    if (this.hoverThrottleTimer) {
      return;
    }
    const interactionMode = this.hoverIntentDetector.getInteractionMode();
    this.hoverThrottleTimer = setTimeout(() => {
      this.hoverThrottleTimer = null;
    }, this.hoverThrottleDelay);
    if (this.eventProcessingPaused) {
      return;
    }
    this.emit(this.eventTypes.MOUSE_MOVE, {
      x: event.clientX,
      y: event.clientY,
      target: event.target,
      event,
      interactionMode,
      skipHover: false
    });
  }
  /**
   * Handle touch move for mobile hover
   */
  handleTouchMove(event) {
    if (this.isDragging || this.currentMode === "temporal") {
      return;
    }
    event.preventDefault();
    const touch = event.touches[0];
    this.emit(this.eventTypes.TOUCH_MOVE, {
      x: touch.clientX,
      y: touch.clientY,
      touches: event.touches.length,
      event
    });
  }
  /**
   * Handle click events
   */
  handleClick(event) {
    if (event.target.closest(".openseadragon-controls")) {
      return;
    }
  }
  /**
   * Update current mode
   */
  setMode(mode) {
    const previousMode = this.currentMode;
    this.currentMode = mode;
    this.emit(this.eventTypes.MODE_CHANGE, {
      from: previousMode,
      to: mode
    });
  }
  /**
   * Set current interaction mode
   */
  setMode(mode) {
    const previousMode = this.currentMode;
    this.currentMode = mode;
    this.emit(this.eventTypes.MODE_CHANGE, {
      from: previousMode,
      to: mode
    });
    if (mode !== "temporal") {
      this.setTemporalState(false, null, null);
    }
  }
  /**
   * Get current interaction mode
   */
  getMode() {
    return this.currentMode;
  }
  /**
   * Update temporal state
   */
  setTemporalState(active, phase, hotspot) {
    this.temporalState = { active, phase, hotspot };
    if (phase !== null) {
      this.emit(this.eventTypes.TEMPORAL_PHASE, {
        phase,
        hotspot
      });
    }
    if (active && !this.temporalState.active) {
      this.emit(this.eventTypes.TEMPORAL_START, { hotspot });
    } else if (!active && this.temporalState.active) {
      this.emit(this.eventTypes.TEMPORAL_END, { hotspot });
    }
  }
  /**
   * Emit hotspot hover event
   */
  emitHotspotHover(hotspot, previousHotspot) {
    this.emit(this.eventTypes.HOTSPOT_HOVER, {
      hotspot,
      previousHotspot
    });
  }
  /**
   * Emit hotspot selection event
   */
  emitHotspotSelect(hotspot, previousHotspot) {
    this.emit(this.eventTypes.HOTSPOT_SELECT, {
      hotspot,
      previousHotspot
    });
    if (!hotspot && previousHotspot) {
      this.emit(this.eventTypes.HOTSPOT_DESELECT, {
        hotspot: previousHotspot
      });
    }
  }
  /**
   * Emit hotspot activation event
   */
  emitHotspotActivate(hotspot) {
    this.emit(this.eventTypes.HOTSPOT_ACTIVATE, {
      hotspot
    });
  }
  /**
   * Pause event processing (for performance)
   */
  pauseEventProcessing() {
    this.eventProcessingPaused = true;
  }
  /**
   * Resume event processing
   */
  resumeEventProcessing() {
    this.eventProcessingPaused = false;
  }
  /**
   * Force re-activation of mouse tracking (used after cinematic zoom)
   */
  forceReactivateMouseTracking() {
    console.log("[EventCoordinator] Force reactivating mouse tracking");
    this.eventProcessingPaused = false;
    this.isDragging = false;
    if (window.lastKnownMouseX !== void 0 && window.lastKnownMouseY !== void 0) {
      console.log("[EventCoordinator] Emitting last known mouse position");
      this.emit(this.eventTypes.MOUSE_MOVE, {
        x: window.lastKnownMouseX,
        y: window.lastKnownMouseY,
        skipAnimation: false,
        forceHover: true,
        skipHover: false
      });
    }
  }
  /**
   * Get current pointer state
   */
  getPointerState() {
    return {
      activePointers: this.activePointers.size,
      primaryPointerId: this.primaryPointerId,
      isDragging: this.isDragging,
      isPinching: this.isPinching
    };
  }
  /**
   * Check if currently dragging
   */
  isCurrentlyDragging() {
    return this.isDragging;
  }
  /**
   * Force reset drag state
   */
  resetDragState() {
    console.log("[EventCoordinator] Resetting drag state");
    this.isDragging = false;
    this.lastDragEndTime = Date.now();
    this.dragStartTime = 0;
    this.dragStartPoint = null;
  }
  /**
   * Cleanup event listeners
   */
  destroy() {
    if (this.container) {
      this.container.removeEventListener("pointerdown", this.handlePointerDown);
      this.container.removeEventListener("pointermove", this.handlePointerMove);
      this.container.removeEventListener("pointerup", this.handlePointerUp);
      this.container.removeEventListener("pointercancel", this.handlePointerCancel);
    }
    if (this.svg) {
      this.svg.removeEventListener("mousemove", this.handleMouseMove);
      if (this.isMobile) {
        this.svg.removeEventListener("touchmove", this.handleTouchMove);
      }
    }
    this.clear();
    if (this.hoverThrottleTimer) {
      clearTimeout(this.hoverThrottleTimer);
      this.hoverThrottleTimer = null;
    }
  }
}
class StaticRenderer {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.colorScheme = options.colorScheme;
    this.isSafari = options.isSafari;
    this.isMobile = options.isMobile;
    this.config = {
      zoomThreshold: 8,
      transitionDuration: "0.15s",
      strokeWidthHover: "3px",
      strokeWidthSelected: "4px",
      opacityHover: "1.0",
      opacitySelected: "1.0"
    };
  }
  /**
   * Check if static mode should be active based on zoom level
   */
  shouldActivate(currentZoom) {
    return currentZoom > this.config.zoomThreshold;
  }
  /**
   * Apply static mode styling to a hotspot element
   */
  applyStaticStyle(group, type, state, colorScheme) {
    var _a, _b;
    const hotspotId = group.getAttribute("data-hotspot-id");
    console.log(`[StaticRenderer] applyStaticStyle called for ${hotspotId}, state=${state}`);
    group.setAttribute("class", `hotspot-${type} hotspot-${state}`);
    group.setAttribute("data-current-state", state);
    group.setAttribute("data-animation-active", "false");
    const mainPath = group.querySelector(".main-path");
    if (mainPath) {
      const overlayManager = window.overlayManager || ((_a = this.viewer) == null ? void 0 : _a.overlayManager);
      const isCanvas2D = overlayManager && overlayManager.constructor.name === "Canvas2DOverlayManager";
      mainPath.style.transition = `all ${this.config.transitionDuration} ease-out`;
      mainPath.style.fill = "none";
      mainPath.style.stroke = isCanvas2D ? "transparent" : colorScheme.main;
      mainPath.style.strokeWidth = isCanvas2D ? "0" : state === "selected" ? this.config.strokeWidthSelected : this.config.strokeWidthHover;
      mainPath.style.opacity = isCanvas2D ? "0" : state === "selected" ? this.config.opacitySelected : this.config.opacityHover;
      console.log(`[StaticRenderer] Applied styles for ${hotspotId}:`, {
        state,
        stroke: mainPath.style.stroke,
        strokeWidth: mainPath.style.strokeWidth,
        opacity: mainPath.style.opacity,
        isCanvas2D,
        overlayManagerType: ((_b = overlayManager == null ? void 0 : overlayManager.constructor) == null ? void 0 : _b.name) || "none"
      });
      mainPath.style.strokeDasharray = "none";
      mainPath.style.strokeDashoffset = "0";
      group.setAttribute("data-animation-completed", "true");
      if (!this.isSafari && !isCanvas2D) {
        mainPath.style.filter = `
                    blur(0px) 
                    contrast(1.4) 
                    drop-shadow(0 0 4px rgba(11, 18, 21, 0.7))
                    drop-shadow(0 0 10px rgba(11, 18, 21, 0.5))
                    drop-shadow(0 0 18px rgba(255, 255, 255, 0.3))
                    drop-shadow(0 0 30px rgba(255, 255, 255, 0.2))
                    drop-shadow(1px 1px 4px rgba(11, 18, 21, 0.4))
                `;
        const haloIntensity = state === "selected" ? 0.5 : 0.4;
        const haloSize = state === "selected" ? "20px" : "15px";
        mainPath.style.boxShadow = `
                    0 0 ${haloSize} rgba(11, 18, 21, ${haloIntensity * 2}),
                    0 0 ${haloSize * 2} rgba(255, 255, 255, 0.25),
                    0 0 ${haloSize * 3} rgba(255, 255, 255, 0.2),
                    0 0 ${haloSize * 1.5} rgba(11, 18, 21, ${haloIntensity * 1.5}),
                    inset 0 0 3px rgba(11, 18, 21, 0.15)
                `;
      } else if (isCanvas2D) {
        mainPath.style.filter = "none";
        mainPath.style.boxShadow = "none";
      }
    }
    if (this.isSafari) {
      this.applySafariStaticStyle(group, state);
    }
    group.style.opacity = "1";
  }
  /**
   * Apply static styling to Safari glow layers
   */
  applySafariStaticStyle(group, state) {
    const glowLayers = group.querySelectorAll(
      ".glow-layer-1, .glow-layer-2, .glow-layer-3, .glow-layer-4, .glow-layer-5"
    );
    glowLayers.forEach((layer, index) => {
      layer.style.transition = `opacity ${this.config.transitionDuration} ease-out`;
      layer.style.strokeDasharray = "none";
      layer.style.strokeDashoffset = "0";
      const opacities = state === "selected" ? ["1.0", "0.8", "0.7", "0.6", "0.3"] : ["1.0", "0.7", "0.6", "0.5", "0.25"];
      layer.style.opacity = opacities[index] || "0";
    });
  }
  /**
   * Reset transitions when exiting static mode
   */
  resetTransitions(group) {
    const paths = group.getElementsByTagName("path");
    for (let path of paths) {
      path.style.transition = "none";
      void path.offsetWidth;
    }
  }
  /**
   * Check if we're transitioning out of static mode
   */
  isExitingStaticMode(group, currentZoom) {
    const lastZoom = parseFloat(group.getAttribute("data-last-zoom") || "0");
    return lastZoom > this.config.zoomThreshold && currentZoom <= this.config.zoomThreshold;
  }
  /**
   * Update zoom tracking on group element
   */
  updateZoomTracking(group, currentZoom) {
    group.setAttribute("data-last-zoom", currentZoom.toString());
  }
}
class RevealRenderer {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.svg = options.svg;
    this.isMobile = options.isMobile;
    this.debugMode = options.debugMode;
    this.state = {
      active: false,
      timer: null,
      duration: 6e3,
      animations: /* @__PURE__ */ new Map()
    };
    this.config = {
      breathingDuration: 6e3,
      // 6 seconds per breathing cycle
      minOpacity: 0.3,
      maxOpacity: 1,
      pulseScale: 1.05,
      activationKeys: ["h", "H"],
      tripleTapThreshold: 500
      // ms between taps
    };
    this.tapCount = 0;
    this.lastTapTime = 0;
  }
  /**
   * Setup reveal mode triggers
   */
  setupTriggers() {
    document.addEventListener("keydown", (e) => {
      if (this.config.activationKeys.includes(e.key)) {
        e.preventDefault();
        this.toggle();
      }
    });
    this.svg.addEventListener("pointerdown", (e) => {
      if (this.isMobile) {
        this.handleTripleTap(e);
      }
    });
  }
  /**
   * Handle triple tap detection for mobile
   */
  handleTripleTap(event) {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - this.lastTapTime;
    if (timeSinceLastTap < this.config.tripleTapThreshold) {
      this.tapCount++;
      if (this.tapCount >= 3) {
        event.preventDefault();
        this.toggle();
        this.tapCount = 0;
      }
    } else {
      this.tapCount = 1;
    }
    this.lastTapTime = currentTime;
  }
  /**
   * Toggle reveal mode
   */
  toggle() {
    if (this.state.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }
  /**
   * Activate reveal mode
   */
  activate() {
    if (this.state.active) return;
    console.log("Activating reveal mode");
    this.state.active = true;
    this.svg.classList.add("reveal-mode-active");
    if (window.nativeHotspotRenderer && window.nativeHotspotRenderer.stateManager) {
      window.nativeHotspotRenderer.stateManager.getAllOverlays().forEach((overlay) => {
        if (overlay.isVisible) {
          this.startBreathingAnimation(overlay);
        }
      });
    }
    this.state.timer = setTimeout(() => {
      this.deactivate();
    }, this.state.duration);
  }
  /**
   * Deactivate reveal mode
   */
  deactivate() {
    if (!this.state.active) return;
    console.log("Deactivating reveal mode");
    this.state.active = false;
    this.svg.classList.remove("reveal-mode-active");
    if (this.state.timer) {
      clearTimeout(this.state.timer);
      this.state.timer = null;
    }
    this.state.animations.forEach((animationData, hotspotId) => {
      this.stopBreathingAnimation({ hotspot: { id: hotspotId } });
    });
  }
  /**
   * Start breathing animation for a hotspot
   */
  startBreathingAnimation(overlay) {
    if (this.state.animations.has(overlay.hotspot.id)) return;
    const element = overlay.element;
    const mainPath = element.querySelector(".main-path");
    if (!mainPath) return;
    const breathingAnimation = {
      element,
      mainPath,
      startTime: Date.now(),
      animationFrame: null
    };
    const animate = () => {
      if (!this.state.active || !this.state.animations.has(overlay.hotspot.id)) {
        return;
      }
      const elapsed = Date.now() - breathingAnimation.startTime;
      const phase = elapsed % this.config.breathingDuration / this.config.breathingDuration;
      const opacity = this.config.minOpacity + (this.config.maxOpacity - this.config.minOpacity) * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
      element.style.opacity = opacity;
      const scale = 1 + (this.config.pulseScale - 1) * Math.sin(phase * Math.PI * 2);
      element.style.transform = `scale(${scale})`;
      breathingAnimation.animationFrame = requestAnimationFrame(animate);
    };
    this.state.animations.set(overlay.hotspot.id, breathingAnimation);
    animate();
  }
  /**
   * Stop breathing animation for a hotspot
   */
  stopBreathingAnimation(overlay) {
    const animationData = this.state.animations.get(overlay.hotspot.id);
    if (!animationData) return;
    if (animationData.animationFrame) {
      cancelAnimationFrame(animationData.animationFrame);
    }
    animationData.element.style.opacity = "";
    animationData.element.style.transform = "";
    this.state.animations.delete(overlay.hotspot.id);
  }
  /**
   * Check if reveal mode is active
   */
  isActive() {
    return this.state.active;
  }
  /**
   * Update visibility - called when hotspots visibility changes
   */
  updateVisibility(overlays) {
    if (!this.state.active) return;
    overlays.forEach((overlay) => {
      if (overlay.isVisible && !this.state.animations.has(overlay.hotspot.id)) {
        this.startBreathingAnimation(overlay);
      } else if (!overlay.isVisible && this.state.animations.has(overlay.hotspot.id)) {
        this.stopBreathingAnimation(overlay);
      }
    });
  }
  /**
   * Cleanup on destroy
   */
  destroy() {
    this.deactivate();
    if (this.state.timer) {
      clearTimeout(this.state.timer);
    }
    this.state.animations.clear();
  }
}
class TemporalRenderer {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.modeStateManager = options.modeStateManager;
    this.stateManager = options.stateManager;
    this.temporalHandler = options.temporalHandler;
    if (this.temporalHandler) {
      this.temporalHandler.onPhaseChange = (phase, hotspot) => {
        this.handlePhaseChange(phase, hotspot);
      };
    }
  }
  /**
   * Handle temporal phase changes (ENHANCED for new Detection Engine)
   */
  handlePhaseChange(phase, hotspot) {
    const isHolding = this.detectionEngine ? this.detectionEngine.isHolding() : this.temporalHandler.state.isHolding;
    if (!isHolding) {
      console.log("[TEMPORAL_DEBUG] Ignoring phase change - not holding");
      return;
    }
    console.log(`[TemporalRenderer] Phase: ${phase} for hotspot ${hotspot == null ? void 0 : hotspot.id}`);
    if (phase !== null) {
      this.modeStateManager.setTemporalState(true, phase);
    }
    const overlay = this.stateManager.getOverlay(hotspot.id);
    if (!overlay) return;
    const element = overlay.element;
    element.style.opacity = "1";
    element.style.visibility = "visible";
    element.classList.remove(
      "hotspot-temporal-touchDown",
      "hotspot-temporal-explore",
      "hotspot-temporal-preview",
      "hotspot-temporal-activate"
    );
    if (phase === "initial" || phase === "initiated") {
      element.style.opacity = "1";
      element.style.visibility = "visible";
      const mainPath = element.querySelector(".main-path");
      if (mainPath) {
        mainPath.style.stroke = "rgba(255, 255, 255, 0.5)";
        mainPath.style.strokeWidth = "1.5px";
        mainPath.style.opacity = "1";
        mainPath.style.transition = "all 150ms ease-out";
      }
      return;
    }
    if (phase === "discovery") {
      element.classList.add("hotspot-temporal-explore");
      return;
    }
    if (phase === "touchDown") {
      element.classList.add("hotspot-temporal-touchDown");
    } else if (phase === "explore") {
      element.classList.add("hotspot-temporal-explore");
    } else if (phase === "preview") {
      element.classList.add("hotspot-temporal-preview");
      this.stateManager.setSelectedHotspot(hotspot);
    } else if (phase === "activate") {
      element.classList.add("hotspot-temporal-activate");
    } else if (phase === "activation") {
      element.classList.add("hotspot-temporal-activate");
      this.stateManager.setSelectedHotspot(hotspot);
    }
  }
  /**
   * Handle temporal release
   */
  handleRelease(duration, hotspot, activateCallback) {
    const thresholds = this.temporalHandler.thresholds;
    console.log("Temporal mode release:", {
      duration,
      thresholds,
      hotspotId: hotspot.id
    });
    this.cleanupVisuals();
    this.modeStateManager.setTemporalState(false, null);
    this.modeStateManager.modeStates.temporal.active = false;
    this.modeStateManager.modeStates.temporal.phase = null;
    if (duration < thresholds.explore) {
      console.log("Temporal: Exploration phase completed");
    } else if (duration >= thresholds.explore && duration < thresholds.activate) {
      console.log("Temporal: Preview/Selection phase completed");
    } else {
      console.log("Temporal: Activation phase completed");
      if (activateCallback) {
        activateCallback(hotspot);
      }
    }
    setTimeout(() => {
      this.modeStateManager.setTemporalState(false, null);
      console.log("[TEMPORAL_FIX] Final temporal state cleanup");
    }, 150);
  }
  /**
   * Clean up temporal visuals - synchronized cleanup to prevent race conditions
   */
  cleanupVisuals() {
    console.log("[TemporalRenderer] Starting synchronized cleanup");
    if (this.modeStateManager) {
      this.modeStateManager.setTemporalState(false, null);
      this.modeStateManager.modeStates.temporal.active = false;
      this.modeStateManager.modeStates.temporal.phase = null;
    }
    if (this.stateManager) {
      this.stateManager.getAllOverlays().forEach((overlay) => {
        if (overlay && overlay.element) {
          overlay.element.classList.remove(
            "hotspot-temporal-touchDown",
            "hotspot-temporal-explore",
            "hotspot-temporal-preview",
            "hotspot-temporal-activate"
          );
          overlay.element.style.removeProperty("opacity");
          overlay.element.style.removeProperty("visibility");
          overlay.element.style.removeProperty("transition");
          const mainPath = overlay.element.querySelector(".main-path");
          if (mainPath) {
            mainPath.style.removeProperty("stroke");
            mainPath.style.removeProperty("stroke-width");
            mainPath.style.removeProperty("opacity");
            mainPath.style.removeProperty("filter");
            mainPath.style.removeProperty("transition");
          }
        }
      });
    }
    if (this.temporalHandler) {
      this.temporalHandler.cleanupTemporalVisuals();
    }
    console.log("[TemporalRenderer] Synchronized cleanup completed");
  }
  /**
   * Check if temporal mode is active
   */
  isActive() {
    return this.modeStateManager.getCurrentMode() === "temporal";
  }
  /**
   * Check if stroke animation should be disabled
   */
  shouldDisableStrokeAnimation() {
    return this.isActive();
  }
  /**
   * Clean up on destroy
   */
  destroy() {
    this.cleanupVisuals();
    if (this.temporalHandler) {
      this.temporalHandler.onPhaseChange = null;
    }
  }
}
class AnimationQueue {
  constructor(maxConcurrent = 25) {
    this.queue = [];
    this.running = /* @__PURE__ */ new Set();
    const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.maxConcurrent = isMobile2 ? 3 : maxConcurrent;
    this.isProcessing = false;
    this.immediateExecutionThreshold = isMobile2 ? 3 : 25;
    if (isMobile2) {
      console.log(
        `[MOBILE_OPTIMIZATION] Animation queue limited to ${this.maxConcurrent} concurrent animations`
      );
    }
  }
  add(element, animationCallback) {
    const hotspotId = element.getAttribute("data-hotspot-id");
    if (this.running.size < this.immediateExecutionThreshold) {
      console.log(`QUICK WIN #4: Immediate animation execution for hotspot ${hotspotId}`);
      this.executeImmediately(hotspotId, animationCallback);
      return;
    }
    this.queue.push({ element, animationCallback });
    this.scheduleProcess();
  }
  // QUICK WIN #4: Direct execution bypass for better performance
  executeImmediately(hotspotId, animationCallback) {
    this.running.add(hotspotId);
    try {
      const result = animationCallback();
      if (result && result.then) {
        result.finally(() => {
          this.running.delete(hotspotId);
        });
      } else {
        this.running.delete(hotspotId);
      }
    } catch (error) {
      this.running.delete(hotspotId);
      console.warn("QUICK WIN #4: Animation callback error:", error);
    }
  }
  // STEP 4 OPTIMIZATION: RAF-based processing for high hotspot counts only
  scheduleProcess() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    requestAnimationFrame(() => {
      this.processImmediate();
      this.isProcessing = false;
    });
  }
  processImmediate() {
    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const { element, animationCallback } = this.queue.shift();
      const animationId = element.getAttribute("data-hotspot-id");
      this.running.add(animationId);
      try {
        const result = animationCallback();
        if (result && result.then) {
          result.then(() => {
            this.running.delete(animationId);
            this.scheduleProcess();
          }).catch(() => {
            this.running.delete(animationId);
            this.scheduleProcess();
          });
        } else {
          setTimeout(() => {
            this.running.delete(animationId);
            this.scheduleProcess();
          }, 0);
        }
      } catch (error) {
        this.running.delete(animationId);
        console.warn("Animation callback error:", error);
      }
    }
  }
  clear() {
    this.queue = [];
    this.running.clear();
  }
  clearFinished() {
    const toRemove = [];
    this.running.forEach((animationId) => {
      const element = document.querySelector(`[data-hotspot-id="${animationId}"]`);
      if (!element) {
        toRemove.push(animationId);
        return;
      }
      const paths = element.getElementsByTagName("path");
      for (let path of paths) {
        if (path.currentAnimation && path.currentAnimation.playState === "finished") {
          path.currentAnimation = null;
          toRemove.push(animationId);
          break;
        }
      }
    });
    toRemove.forEach((id) => this.running.delete(id));
  }
}
class MemoryManager {
  constructor(options = {}) {
    this.isMobile = options.isMobile || false;
    this.isSafari = options.isSafari || false;
    this.animationRegistry = /* @__PURE__ */ new Set();
    this.cleanupInterval = null;
    this.cleanupIntervalTime = options.cleanupIntervalTime || 2e3;
    this.maxRegistrySize = options.maxRegistrySize || 1e3;
  }
  /**
   * Start automatic cleanup cycle
   */
  startCleanupCycle(animationQueue, overlaysGetter) {
    this.cleanupInterval = setInterval(() => {
      if (animationQueue) {
        animationQueue.clearFinished();
      }
      const overlays = overlaysGetter();
      overlays.forEach((overlay) => {
        const paths = overlay.element.getElementsByTagName("path");
        for (let path of paths) {
          if (path.currentAnimation && path.currentAnimation.playState === "finished") {
            path.currentAnimation = null;
          }
        }
      });
      if (this.animationRegistry.size > this.maxRegistrySize) {
        this.pruneRegistry();
      }
    }, this.cleanupIntervalTime);
  }
  /**
   * Stop cleanup cycle
   */
  stopCleanupCycle() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  /**
   * Check if animation was already shown
   */
  hasAnimationBeenShown(stateKey) {
    return this.animationRegistry.has(stateKey);
  }
  /**
   * Register that an animation has been shown
   */
  registerAnimation(stateKey) {
    this.animationRegistry.add(stateKey);
  }
  /**
   * Clear specific animation entries
   */
  clearAnimationEntries(hotspotId) {
    this.animationRegistry.delete(`${hotspotId}-hover`);
    this.animationRegistry.delete(`${hotspotId}-selected`);
  }
  /**
   * Clear single animation entry
   */
  clearAnimationEntry(stateKey) {
    this.animationRegistry.delete(stateKey);
  }
  /**
   * Clear all animation registry entries
   */
  clearAllAnimations() {
    this.animationRegistry.clear();
  }
  /**
   * Clear registry entries except for specified states
   */
  clearRegistryExcept(preserveStates) {
    const entriesToDelete = [];
    this.animationRegistry.forEach((key) => {
      if (!preserveStates.has(key)) {
        entriesToDelete.push(key);
      }
    });
    entriesToDelete.forEach((key) => this.animationRegistry.delete(key));
  }
  /**
   * Prune oldest entries when registry gets too large
   */
  pruneRegistry() {
    const entries = Array.from(this.animationRegistry);
    const keepCount = Math.floor(this.maxRegistrySize / 2);
    const toKeep = entries.slice(-keepCount);
    this.animationRegistry.clear();
    toKeep.forEach((entry) => this.animationRegistry.add(entry));
  }
  /**
   * Get memory statistics
   */
  getStats() {
    return {
      registrySize: this.animationRegistry.size,
      maxRegistrySize: this.maxRegistrySize,
      cleanupActive: this.cleanupInterval !== null
    };
  }
  /**
   * Destroy and cleanup
   */
  destroy() {
    this.stopCleanupCycle();
    this.clearAllAnimations();
  }
}
class ObjectPool {
  /**
   * Create a new object pool
   * @param {Function} createFn - Function that creates a new object
   * @param {Function} resetFn - Function that resets an object to initial state
   * @param {number} initialSize - Number of objects to pre-populate
   * @param {number} maxSize - Maximum pool size (prevents memory leaks)
   */
  constructor(createFn, resetFn, initialSize = 50, maxSize = 200) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this.pool = [];
    this.inUse = /* @__PURE__ */ new Set();
    this.stats = {
      created: 0,
      reused: 0,
      released: 0
    };
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
      this.stats.created++;
    }
  }
  /**
   * Acquire an object from the pool
   * @returns {Object} A reset object ready for use
   */
  acquire() {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createFn();
      this.stats.created++;
    } else {
      this.stats.reused++;
    }
    this.inUse.add(obj);
    return obj;
  }
  /**
   * Release an object back to the pool
   * @param {Object} obj - Object to release
   */
  release(obj) {
    if (!this.inUse.has(obj)) {
      console.warn("ObjectPool: Attempting to release object not from this pool");
      return;
    }
    this.inUse.delete(obj);
    this.resetFn(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
      this.stats.released++;
    } else {
      console.debug("ObjectPool: Max size reached, allowing GC");
    }
  }
  /**
   * Release all objects currently in use
   * Useful for bulk cleanup operations
   */
  releaseAll() {
    const toRelease = Array.from(this.inUse);
    toRelease.forEach((obj) => this.release(obj));
  }
  /**
   * Clear the pool completely
   * Use when switching contexts or cleaning up
   */
  clear() {
    this.pool = [];
    this.inUse.clear();
  }
  /**
   * Get pool statistics for performance monitoring
   * @returns {Object} Pool usage statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      inUseSize: this.inUse.size,
      totalSize: this.pool.length + this.inUse.size,
      reuseRate: this.stats.created > 0 ? (this.stats.reused / (this.stats.created + this.stats.reused) * 100).toFixed(1) + "%" : "0%"
    };
  }
}
const createUpdatePool = () => new ObjectPool(
  () => ({ element: null, opacity: "" }),
  (obj) => {
    obj.element = null;
    obj.opacity = "";
  },
  100,
  // Pre-create 100 objects
  500
  // Max 500 objects
);
const createRectPool = () => new ObjectPool(
  () => ({ x: 0, y: 0, width: 0, height: 0 }),
  (rect) => {
    rect.x = 0;
    rect.y = 0;
    rect.width = 0;
    rect.height = 0;
  },
  50,
  200
);
const createPointPool = () => new ObjectPool(
  () => ({ x: 0, y: 0 }),
  (point) => {
    point.x = 0;
    point.y = 0;
  },
  100,
  300
);
class RenderOptimizer {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.isMobile = options.isMobile || false;
    this.batchSize = options.batchSize || 50;
    this.renderDebounceTime = options.renderDebounceTime || 16;
    this.visibilityCheckInterval = options.visibilityCheckInterval || 100;
    this.significantChangeThreshold = options.significantChangeThreshold || 0.1;
    this.performanceMode = false;
    this.highHotspotCountThreshold = options.highHotspotCountThreshold || 100;
    this.lastViewportBounds = null;
    this.lastViewportZoom = null;
    this.updateTimer = null;
    this.lastUpdateTime = 0;
    this.pendingVisibilityUpdate = false;
    this.updatesPaused = false;
    this.isAnimationInProgress = false;
    this.rectPool = createRectPool();
  }
  /**
   * Load hotspots in batches for better performance
   */
  async loadHotspotsInBatches(hotspots, createOverlayCallback) {
    const totalBatches = Math.ceil(hotspots.length / this.batchSize);
    for (let i = 0; i < totalBatches; i++) {
      const batch = hotspots.slice(i * this.batchSize, (i + 1) * this.batchSize);
      batch.forEach((hotspot) => createOverlayCallback(hotspot));
      if (i < totalBatches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    console.log(`Loaded ${hotspots.length} hotspots in ${totalBatches} batches`);
  }
  /**
   * Check if viewport changed significantly
   */
  hasViewportChangedSignificantly(bounds, currentZoom) {
    if (!this.lastViewportBounds || !this.lastViewportZoom) {
      return true;
    }
    const boundsChanged = Math.abs(bounds.x - this.lastViewportBounds.x) > this.significantChangeThreshold || Math.abs(bounds.y - this.lastViewportBounds.y) > this.significantChangeThreshold || Math.abs(bounds.width - this.lastViewportBounds.width) > this.significantChangeThreshold || Math.abs(bounds.height - this.lastViewportBounds.height) > this.significantChangeThreshold;
    const zoomChanged = Math.abs(currentZoom - this.lastViewportZoom) > 0.1;
    return boundsChanged || zoomChanged;
  }
  /**
   * Update viewport tracking
   */
  updateViewportTracking(bounds, zoom) {
    if (this.lastViewportBounds && this.lastViewportBounds._pooled) {
      this.rectPool.release(this.lastViewportBounds);
    }
    const pooledBounds = this.rectPool.acquire();
    pooledBounds.x = bounds.x;
    pooledBounds.y = bounds.y;
    pooledBounds.width = bounds.width;
    pooledBounds.height = bounds.height;
    pooledBounds._pooled = true;
    this.lastViewportBounds = pooledBounds;
    this.lastViewportZoom = zoom;
  }
  /**
   * Set animation in progress state
   */
  setAnimationInProgress(inProgress) {
    this.isAnimationInProgress = inProgress;
  }
  /**
   * Check if animation is in progress
   */
  isAnimationInProgress() {
    return this.isAnimationInProgress;
  }
  /**
   * Schedule visibility update with debouncing
   */
  scheduleVisibilityUpdate(updateCallback) {
    if (this.updateTimer) clearTimeout(this.updateTimer);
    if (this.updatesPaused || this.viewer.isAnimating()) {
      this.pendingVisibilityUpdate = true;
      return;
    }
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    const minInterval = this.viewer.viewport.getZoom() < 5 ? 100 : 50;
    if (timeSinceLastUpdate < minInterval) {
      this.updateTimer = setTimeout(() => {
        this.scheduleVisibilityUpdate(updateCallback);
      }, minInterval - timeSinceLastUpdate);
      return;
    }
    this.updateTimer = setTimeout(() => {
      this.lastUpdateTime = Date.now();
      updateCallback();
    }, this.renderDebounceTime);
  }
  /**
   * Check if should enter/exit performance mode
   */
  checkPerformanceMode(visibleCount, svgElement) {
    const shouldEnablePerformance = visibleCount > this.highHotspotCountThreshold;
    const shouldDisablePerformance = visibleCount < this.highHotspotCountThreshold * 0.8;
    if (shouldEnablePerformance && !this.performanceMode) {
      this.performanceMode = true;
      if (svgElement) {
        svgElement.classList.add("performance-mode");
      }
      console.log("Performance mode enabled - simplifying animations");
    } else if (shouldDisablePerformance && this.performanceMode) {
      this.performanceMode = false;
      if (svgElement) {
        svgElement.classList.remove("performance-mode");
      }
      console.log("Performance mode disabled");
    }
    return this.performanceMode;
  }
  /**
   * Check if animations should be queued based on performance
   */
  shouldQueueAnimations(zoom, visibleCount) {
    return zoom > 2 && visibleCount > 20;
  }
  /**
   * Pause updates (for cinematic zoom)
   */
  pauseUpdates() {
    this.updatesPaused = true;
    console.log("🔧 RenderOptimizer: Updates paused");
  }
  /**
   * Resume updates
   */
  resumeUpdates() {
    this.updatesPaused = false;
    console.log("🔧 RenderOptimizer: Updates resumed");
    if (this.pendingVisibilityUpdate) {
      this.pendingVisibilityUpdate = false;
      return true;
    }
    return false;
  }
  /**
   * Check if updates are paused
   */
  areUpdatesPaused() {
    return this.updatesPaused;
  }
  /**
   * Set pending update flag
   */
  setPendingUpdate() {
    this.pendingVisibilityUpdate = true;
  }
  /**
   * Get performance stats
   */
  getStats() {
    return {
      performanceMode: this.performanceMode,
      updatesPaused: this.updatesPaused,
      pendingUpdate: this.pendingVisibilityUpdate,
      lastUpdateTime: this.lastUpdateTime
    };
  }
  /**
   * Setup visibility tracking handlers
   */
  setupVisibilityTracking(updateCallback) {
    this.isMobile ? 100 : 50;
    const scheduleUpdate = () => {
      this.scheduleVisibilityUpdate(updateCallback);
    };
    this.viewer.addHandler("animation", scheduleUpdate);
    this.viewer.addHandler("animation-finish", () => {
      if (!this.updatesPaused) {
        updateCallback();
      }
    });
    if (!this.isMobile) {
      this.viewer.addHandler("viewport-change", scheduleUpdate);
    }
    updateCallback();
  }
  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.lastViewportBounds && this.lastViewportBounds._pooled) {
      this.rectPool.release(this.lastViewportBounds);
      this.lastViewportBounds = null;
    }
    if (this.rectPool) {
      this.rectPool.clear();
    }
  }
}
class RendererEngine {
  constructor(options) {
    this.viewer = options.viewer;
    this.spatialIndex = options.spatialIndex;
    this.stateManager = options.stateManager;
    this.eventCoordinator = options.eventCoordinator;
    this.renderOptimizer = options.renderOptimizer;
    this.memoryManager = options.memoryManager;
    this.safariCompat = options.safariCompat;
    this.modeRenderers = {
      static: options.staticRenderer,
      reveal: options.revealRenderer,
      temporal: options.temporalRenderer
    };
    this.currentMode = "normal";
    this.svg = null;
    this.defs = null;
    this.pathDefs = null;
    this.clipDefs = null;
    this.maskCounter = 0;
    this.hitDetectionCanvas = null;
    this.useHitDetectionCanvas = true;
    this.lodManager = null;
    this.debugMode = options.debugMode || false;
    this.colorScheme = options.colorScheme;
    this.isMobile = options.isMobile || false;
    this.isSafari = options.isSafari || false;
    this.onHotspotClick = options.onHotspotClick || (() => {
    });
    this.onHotspotHover = options.onHotspotHover || (() => {
    });
    console.log(
      "[RendererEngine] Initialized with mode renderers:",
      Object.keys(this.modeRenderers)
    );
  }
  // === INITIALIZATION ===
  /**
   * Initialize the rendering engine
   * Simplified version of the original init() method
   */
  async initialize() {
    console.log("[RendererEngine] Starting initialization...");
    if (!this.viewer.world.getItemCount()) {
      return new Promise((resolve) => {
        this.viewer.addOnceHandler("open", async () => {
          await this.initialize();
          resolve();
        });
      });
    }
    await this.createSVGStructure();
    if (this.modeRenderers.reveal) {
      this.modeRenderers.reveal.svg = this.svg;
    }
    if (this.useHitDetectionCanvas) {
      await this.initializeHitDetectionCanvas();
    }
    this.initializeLODManager();
    console.log("[RendererEngine] Initialization complete");
  }
  /**
   * Create the complete SVG structure
   * Orchestrates all SVG creation methods in the correct order
   */
  async createSVGStructure() {
    const tiledImage = this.viewer.world.getItemAt(0);
    const imageSize = tiledImage.getContentSize();
    this.svg = this.createSVG(imageSize);
    this.viewer.addOverlay({
      element: this.svg,
      location: new OpenSeadragon.Rect(0, 0, 1, imageSize.y / imageSize.x),
      placement: OpenSeadragon.Placement.TOP_LEFT
    });
    this.createMaskDefs();
    this.pathDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    this.pathDefs.id = "path-definitions";
    this.svg.insertBefore(this.pathDefs, this.svg.firstChild);
    this.createClipPathDefs();
    this.createSVGFilters();
    console.log("[RendererEngine] SVG structure created successfully");
  }
  /**
   * Create the main SVG element
   * @param {Object} imageSize - Object with x and y dimensions
   * @returns {SVGElement} The created SVG element
   */
  createSVG(imageSize) {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" 
           width="${imageSize.x}" height="${imageSize.y}" 
           viewBox="0 0 ${imageSize.x} ${imageSize.y}"
           style="position: absolute; width: 100%; height: 100%; pointer-events: auto;">
    </svg>`;
    const svg = new DOMParser().parseFromString(svgString, "image/svg+xml").documentElement;
    return svg;
  }
  /**
   * Create mask definitions for multipolygon support
   * Initializes the defs element and mask counter
   */
  createMaskDefs() {
    if (this.defs) return;
    this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    this.svg.insertBefore(this.defs, this.svg.firstChild);
    this.maskCounter = 0;
  }
  /**
   * Create clip path definitions
   * Creates a dedicated defs element for clip paths
   */
  createClipPathDefs() {
    if (!this.defs) {
      this.createMaskDefs();
    }
    const clipDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    clipDefs.id = "clip-path-defs";
    this.svg.insertBefore(clipDefs, this.svg.firstChild);
    this.clipDefs = clipDefs;
  }
  /**
   * Create SVG filter definitions for glow effects
   * Creates optimized multi-layer filters for hover and selected states
   */
  createSVGFilters() {
    const filterDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const selectedFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    selectedFilter.setAttribute("id", "hotspot-glow-selected");
    selectedFilter.setAttribute("x", "-100%");
    selectedFilter.setAttribute("y", "-100%");
    selectedFilter.setAttribute("width", "300%");
    selectedFilter.setAttribute("height", "300%");
    selectedFilter.setAttribute("filterUnits", "objectBoundingBox");
    selectedFilter.setAttribute("primitiveUnits", "userSpaceOnUse");
    selectedFilter.setAttribute("color-interpolation-filters", "sRGB");
    const selectedMorph = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMorphology"
    );
    selectedMorph.setAttribute("operator", "dilate");
    selectedMorph.setAttribute("radius", "2");
    selectedMorph.setAttribute("in", "SourceAlpha");
    selectedMorph.setAttribute("result", "expanded");
    const selectedBlur1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feGaussianBlur"
    );
    selectedBlur1.setAttribute("in", "expanded");
    selectedBlur1.setAttribute("stdDeviation", "3");
    selectedBlur1.setAttribute("result", "blur1");
    const selectedBlur2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feGaussianBlur"
    );
    selectedBlur2.setAttribute("in", "expanded");
    selectedBlur2.setAttribute("stdDeviation", "8");
    selectedBlur2.setAttribute("result", "blur2");
    const selectedBlur3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feGaussianBlur"
    );
    selectedBlur3.setAttribute("in", "expanded");
    selectedBlur3.setAttribute("stdDeviation", "15");
    selectedBlur3.setAttribute("result", "blur3");
    const selectedTransfer1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feComponentTransfer"
    );
    selectedTransfer1.setAttribute("in", "blur1");
    selectedTransfer1.setAttribute("result", "glow1");
    const selectedAlpha1 = document.createElementNS("http://www.w3.org/2000/svg", "feFuncA");
    selectedAlpha1.setAttribute("type", "linear");
    selectedAlpha1.setAttribute("slope", "0.8");
    selectedAlpha1.setAttribute("intercept", "0");
    selectedTransfer1.appendChild(selectedAlpha1);
    const selectedTransfer2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feComponentTransfer"
    );
    selectedTransfer2.setAttribute("in", "blur2");
    selectedTransfer2.setAttribute("result", "glow2");
    const selectedAlpha2 = document.createElementNS("http://www.w3.org/2000/svg", "feFuncA");
    selectedAlpha2.setAttribute("type", "linear");
    selectedAlpha2.setAttribute("slope", "0.5");
    selectedAlpha2.setAttribute("intercept", "0");
    selectedTransfer2.appendChild(selectedAlpha2);
    const selectedTransfer3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feComponentTransfer"
    );
    selectedTransfer3.setAttribute("in", "blur3");
    selectedTransfer3.setAttribute("result", "glow3");
    const selectedAlpha3 = document.createElementNS("http://www.w3.org/2000/svg", "feFuncA");
    selectedAlpha3.setAttribute("type", "linear");
    selectedAlpha3.setAttribute("slope", "0.3");
    selectedAlpha3.setAttribute("intercept", "0");
    selectedTransfer3.appendChild(selectedAlpha3);
    const selectedInnerColor = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feFlood"
    );
    selectedInnerColor.setAttribute("flood-color", this.colorScheme.glow || "#87CEEB");
    selectedInnerColor.setAttribute("result", "innerColor");
    const selectedOuterColor = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feFlood"
    );
    selectedOuterColor.setAttribute("flood-color", this.colorScheme.glow2 || "#4682B4");
    selectedOuterColor.setAttribute("result", "outerColor");
    const selectedComposite1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feComposite"
    );
    selectedComposite1.setAttribute("in", "innerColor");
    selectedComposite1.setAttribute("in2", "glow1");
    selectedComposite1.setAttribute("operator", "in");
    selectedComposite1.setAttribute("result", "innerGlow");
    const selectedComposite2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feComposite"
    );
    selectedComposite2.setAttribute("in", "outerColor");
    selectedComposite2.setAttribute("in2", "glow3");
    selectedComposite2.setAttribute("operator", "in");
    selectedComposite2.setAttribute("result", "outerGlow");
    const selectedMidColor = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
    selectedMidColor.setAttribute("flood-color", this.colorScheme.main || "#4682B4");
    selectedMidColor.setAttribute("result", "midColor");
    const selectedComposite3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feComposite"
    );
    selectedComposite3.setAttribute("in", "midColor");
    selectedComposite3.setAttribute("in2", "glow2");
    selectedComposite3.setAttribute("operator", "in");
    selectedComposite3.setAttribute("result", "midGlow");
    const selectedMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const selectedMergeNode1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    selectedMergeNode1.setAttribute("in", "outerGlow");
    const selectedMergeNode2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    selectedMergeNode2.setAttribute("in", "midGlow");
    const selectedMergeNode3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    selectedMergeNode3.setAttribute("in", "innerGlow");
    const selectedMergeNode4 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    selectedMergeNode4.setAttribute("in", "SourceGraphic");
    selectedMerge.appendChild(selectedMergeNode1);
    selectedMerge.appendChild(selectedMergeNode2);
    selectedMerge.appendChild(selectedMergeNode3);
    selectedMerge.appendChild(selectedMergeNode4);
    selectedFilter.appendChild(selectedMorph);
    selectedFilter.appendChild(selectedBlur1);
    selectedFilter.appendChild(selectedBlur2);
    selectedFilter.appendChild(selectedBlur3);
    selectedFilter.appendChild(selectedTransfer1);
    selectedFilter.appendChild(selectedTransfer2);
    selectedFilter.appendChild(selectedTransfer3);
    selectedFilter.appendChild(selectedInnerColor);
    selectedFilter.appendChild(selectedOuterColor);
    selectedFilter.appendChild(selectedMidColor);
    selectedFilter.appendChild(selectedComposite1);
    selectedFilter.appendChild(selectedComposite2);
    selectedFilter.appendChild(selectedComposite3);
    selectedFilter.appendChild(selectedMerge);
    const hoverFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    hoverFilter.setAttribute("id", "hotspot-glow-hover");
    hoverFilter.setAttribute("x", "-50%");
    hoverFilter.setAttribute("y", "-50%");
    hoverFilter.setAttribute("width", "200%");
    hoverFilter.setAttribute("height", "200%");
    hoverFilter.setAttribute("filterUnits", "objectBoundingBox");
    hoverFilter.setAttribute("primitiveUnits", "userSpaceOnUse");
    hoverFilter.setAttribute("color-interpolation-filters", "sRGB");
    const hoverBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    hoverBlur.setAttribute("in", "SourceAlpha");
    hoverBlur.setAttribute("stdDeviation", "6");
    hoverBlur.setAttribute("result", "blur");
    const hoverInnerColor = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
    hoverInnerColor.setAttribute("flood-color", this.colorScheme.glow || "#87CEEB");
    hoverInnerColor.setAttribute("result", "innerColor");
    const hoverOuterColor = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
    hoverOuterColor.setAttribute("flood-color", this.colorScheme.main || "#4682B4");
    hoverOuterColor.setAttribute("result", "outerColor");
    const hoverComposite = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feComposite"
    );
    hoverComposite.setAttribute("in", "innerColor");
    hoverComposite.setAttribute("in2", "blur");
    hoverComposite.setAttribute("operator", "in");
    hoverComposite.setAttribute("result", "coloredBlur");
    const hoverMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const hoverMergeNode1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    hoverMergeNode1.setAttribute("in", "coloredBlur");
    const hoverMergeNode2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    hoverMergeNode2.setAttribute("in", "SourceGraphic");
    hoverMerge.appendChild(hoverMergeNode1);
    hoverMerge.appendChild(hoverMergeNode2);
    hoverFilter.appendChild(hoverBlur);
    hoverFilter.appendChild(hoverInnerColor);
    hoverFilter.appendChild(hoverOuterColor);
    hoverFilter.appendChild(hoverComposite);
    hoverFilter.appendChild(hoverMerge);
    filterDefs.appendChild(selectedFilter);
    filterDefs.appendChild(hoverFilter);
    this.svg.insertBefore(filterDefs, this.svg.firstChild);
  }
  /**
   * Setup the SVG as an OpenSeadragon overlay
   */
  setupOverlay(imageSize) {
  }
  // === HOTSPOT MANAGEMENT ===
  /**
   * Create a hotspot overlay element
   * Creates the complete SVG structure for a hotspot including paths, masks, and styles
   * Returns the created element without adding it to the DOM
   */
  createHotspotOverlay(hotspot, applyStyleCallback) {
    const g = this.createGroup(hotspot);
    const isMultiPolygon = hotspot.shape === "multipolygon";
    const normalizedPath = normalizePath(hotspot.coordinates, isMultiPolygon);
    if (this.isSafari) {
      this.safariCompat.createGlowLayers(g, normalizedPath, this.colorScheme);
    }
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", normalizedPath);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "transparent");
    path.setAttribute("pathLength", "100");
    path.style.pointerEvents = "fill";
    path.classList.add("main-path");
    g.appendChild(path);
    const realLength = path.getTotalLength();
    g.removeChild(path);
    path.setAttribute("data-real-length", realLength);
    path.setAttribute("data-animated", "true");
    if (this.isSafari) {
      this.safariCompat.setGlowLayerLengths(g, realLength);
    }
    if (isMultiPolygon && hotspot.coordinates.length > 1) {
      const maskId = `mask-${hotspot.id}-${this.maskCounter++}`;
      const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
      mask.setAttribute("id", maskId);
      const maskRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      maskRect.setAttribute("x", "0");
      maskRect.setAttribute("y", "0");
      maskRect.setAttribute("width", "100%");
      maskRect.setAttribute("height", "100%");
      maskRect.setAttribute("fill", "white");
      mask.appendChild(maskRect);
      hotspot.coordinates.forEach((polygon, index) => {
        if (index > 0) {
          const maskPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          const d = polygon.reduce(
            (acc, [x, y], i) => acc + (i === 0 ? "M" : "L") + `${Math.round(x)},${Math.round(y)}`,
            ""
          ) + "Z";
          maskPath.setAttribute("d", d);
          maskPath.setAttribute("fill", "black");
          maskPath.setAttribute("stroke", "black");
          maskPath.setAttribute("stroke-width", "10");
          mask.appendChild(maskPath);
        }
      });
      this.defs.appendChild(mask);
      path.setAttribute("mask", `url(#${maskId})`);
    }
    if (applyStyleCallback) {
      applyStyleCallback(g, hotspot.type, "normal");
    }
    g.appendChild(path);
    const bounds = calculateBounds(hotspot.coordinates);
    const area = calculateArea(bounds);
    return {
      element: g,
      bounds,
      area
    };
  }
  /**
   * Create SVG group for a hotspot
   * Creates the main <g> element with proper styling and attributes
   */
  createGroup(hotspot) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    Object.assign(g.style, {
      cursor: "pointer",
      pointerEvents: "fill",
      opacity: this.debugMode ? "1" : "0",
      transition: "opacity 0.2s ease-out",
      "-webkit-tap-highlight-color": "transparent",
      // Add GPU acceleration hints
      transform: "translateZ(0)",
      "-webkit-transform": "translateZ(0)",
      "will-change": "transform, opacity"
    });
    g.setAttribute("data-hotspot-id", hotspot.id);
    if (this.colorScheme && this.colorScheme.main === "#FFFFFF") {
      g.style.mixBlendMode = "screen";
    }
    return g;
  }
  /**
   * Create HTML wrapper for Safari optimization
   * Creates a div wrapper with Safari-specific performance optimizations
   */
  createHotspotWrapper(hotspotId) {
    const wrapper = document.createElement("div");
    wrapper.className = "hotspot-wrapper";
    wrapper.setAttribute("data-hotspot-wrapper-id", hotspotId);
    if (this.isSafari) {
      wrapper.style.position = "absolute";
      wrapper.style.transform = "translateZ(0)";
      wrapper.style.webkitTransform = "translateZ(0)";
      wrapper.style.willChange = "filter";
      wrapper.style.contain = "layout style paint";
      if (this.isMobile) {
        wrapper.classList.add("hotspot-wrapper-ios");
      } else {
        wrapper.classList.add("hotspot-wrapper-desktop");
      }
    }
    return wrapper;
  }
  // === HIT DETECTION ===
  /**
   * Initialize the hit detection canvas system
   * Creates optimized canvas for fast hotspot detection
   */
  async initializeHitDetectionCanvas() {
    try {
      console.log("[HIT_DETECTION] Initializing canvas-based hit detection...");
      this.hitDetectionCanvas = new HitDetectionCanvas({
        viewer: this.viewer,
        spatialIndex: this.spatialIndex,
        debug: this.debugMode
      });
      await this.hitDetectionCanvas.initialize();
      window.hitDetectionCanvas = this.hitDetectionCanvas;
      console.log("[HIT_DETECTION] Canvas-based hit detection initialized successfully");
    } catch (error) {
      console.error("[HIT_DETECTION] Failed to initialize hit detection canvas:", error);
      console.warn("[HIT_DETECTION] Falling back to SVG-based detection");
      this.useHitDetectionCanvas = false;
    }
  }
  /**
   * Initialize Level of Detail manager
   */
  initializeLODManager() {
    this.lodManager = new LevelOfDetailManager({
      maxVisibleHotspots: {
        low: this.isMobile ? 30 : 50,
        medium: this.isMobile ? 75 : 100,
        high: this.isMobile ? 100 : 150,
        critical: this.isMobile ? 150 : 200
      }
    });
    console.log("[RendererEngine] LOD Manager initialized");
  }
  /**
   * Find the smallest hotspot at a given point
   * Uses optimized canvas-based detection when available
   * LOD FIX - Hotspots remain clickable even if not visually rendered
   * This ensures smaller hotspots take priority over larger ones
   * ENHANCED: Better handling for large hotspots with nested smaller ones
   */
  findSmallestHotspotAtPoint(point) {
    if (this.useHitDetectionCanvas && this.hitDetectionCanvas) {
      const hotspot = this.findHotspotUsingCanvas(point);
      if (hotspot) {
        console.log(`[HIT_DETECTION] Canvas hit: ${hotspot.id}`);
        return hotspot;
      }
    }
    const candidates = [];
    let checkedCount = 0;
    this.stateManager.getAllOverlays().forEach((overlay, id) => {
      checkedCount++;
      if (this.isPointInHotspot(point, overlay)) {
        candidates.push({
          hotspot: overlay.hotspot,
          area: overlay.area,
          // Calculate distance from point to hotspot center for better selection
          centerDistance: this.getDistanceToCenter(point, overlay)
        });
      }
    });
    if (candidates.length === 0 && checkedCount > 0) {
      console.log(
        `[HIT_DETECTION] No hotspots found at point (${point.x.toFixed(0)}, ${point.y.toFixed(0)}) - checked ${checkedCount} hotspots`
      );
    }
    if (candidates.length === 0) {
      return null;
    }
    const largeHotspotThreshold = 3e4;
    const largeHotspots = candidates.filter((c) => c.area > largeHotspotThreshold);
    const smallHotspots = candidates.filter((c) => c.area <= largeHotspotThreshold);
    if (largeHotspots.length > 0) {
      const hasSmallHotspots = smallHotspots.length > 0;
      if (hasSmallHotspots) {
        const veryCloseSmall = smallHotspots.find((s) => {
          return s.centerDistance < 20;
        });
        if (veryCloseSmall) {
          console.log(
            `[HIT_DETECTION] Selected small hotspot very close to tap: ${veryCloseSmall.hotspot.id}`
          );
          return veryCloseSmall.hotspot;
        }
      }
      largeHotspots.sort((a, b) => a.centerDistance - b.centerDistance);
      console.log(
        `[HIT_DETECTION] Selected large hotspot (tap on surface): ${largeHotspots[0].hotspot.id} (area: ${largeHotspots[0].area})`
      );
      return largeHotspots[0].hotspot;
    }
    candidates.sort((a, b) => a.area - b.area);
    return candidates[0].hotspot;
  }
  /**
   * Calculate distance from point to hotspot center
   * For irregular shapes, uses the centroid of the polygon
   */
  getDistanceToCenter(point, overlay) {
    const hotspot = overlay.hotspot;
    let centerX, centerY;
    if (hotspot.shape === "polygon" && hotspot.coordinates) {
      const coords = hotspot.coordinates;
      centerX = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
      centerY = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
    } else if (hotspot.shape === "multipolygon" && hotspot.coordinates && hotspot.coordinates[0]) {
      const coords = hotspot.coordinates[0];
      centerX = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
      centerY = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
    } else {
      const bounds = overlay.bounds;
      centerX = (bounds.minX + bounds.maxX) / 2;
      centerY = (bounds.minY + bounds.maxY) / 2;
    }
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  /**
   * Find hotspot using optimized canvas-based hit detection
   * LOD FIX - Don't check visibility, allow clicks on all hotspots
   * Converts image coordinates to screen coordinates and uses hit detection canvas
   */
  findHotspotUsingCanvas(imagePoint) {
    try {
      const viewportPoint = this.viewer.viewport.imageToViewportCoordinates(
        imagePoint.x,
        imagePoint.y
      );
      const screenPoint = this.viewer.viewport.viewportToWindowCoordinates(viewportPoint);
      const rect = this.viewer.container.getBoundingClientRect();
      const screenX = screenPoint.x - rect.left;
      const screenY = screenPoint.y - rect.top;
      const hotspot = this.hitDetectionCanvas.hitTest(screenX, screenY);
      if (hotspot) {
        const overlay = this.stateManager.getOverlay(hotspot.id);
        if (overlay) {
          return hotspot;
        }
      }
      return null;
    } catch (error) {
      console.warn("[HIT_DETECTION] Canvas hit test failed:", error);
      return null;
    }
  }
  /**
   * Check if point is inside hotspot using precise polygon detection
   */
  isPointInHotspot(point, overlay) {
    const hotspot = overlay.hotspot;
    const bounds = overlay.bounds;
    if (point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY) {
      return false;
    }
    if (hotspot.shape === "polygon") {
      return pointInPolygon(point.x, point.y, hotspot.coordinates);
    } else if (hotspot.shape === "multipolygon") {
      return hotspot.coordinates.some((polygon) => pointInPolygon(point.x, point.y, polygon));
    }
    return false;
  }
  // === RENDERING COORDINATION ===
  /**
   * Main render method - coordinates all rendering operations
   */
  render() {
    if (this.renderOptimizer.areUpdatesPaused()) {
      return;
    }
    this.updateVisibility();
  }
  /**
   * Update visibility of hotspots based on viewport
   */
  updateVisibility() {
  }
  /**
   * Set the current render mode
   */
  setRenderMode(mode) {
    if (this.modeRenderers[mode]) {
      console.log(`[RendererEngine] Switching render mode: ${this.currentMode} → ${mode}`);
      this.currentMode = mode;
    }
  }
  /**
   * Apply a color scheme to all renderers
   */
  applyColorScheme(scheme) {
    this.colorScheme = scheme;
    Object.values(this.modeRenderers).forEach((renderer) => {
      if (renderer && renderer.setColorScheme) {
        renderer.setColorScheme(scheme);
      }
    });
  }
  // === LIFECYCLE ===
  /**
   * Pause rendering operations
   */
  pause() {
    this.renderOptimizer.pauseUpdates();
    console.log("[RendererEngine] Rendering paused");
  }
  /**
   * Resume rendering operations
   */
  resume() {
    const needsUpdate = this.renderOptimizer.resumeUpdates();
    console.log("[RendererEngine] Rendering resumed");
    if (needsUpdate) {
      setTimeout(() => this.render(), 50);
    }
  }
  /**
   * Destroy the renderer and clean up resources
   */
  destroy() {
    console.log("[RendererEngine] Destroying...");
    if (this.hitDetectionCanvas) {
      if (typeof this.hitDetectionCanvas.destroy === "function") {
        this.hitDetectionCanvas.destroy();
      }
    }
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
    this.svg = null;
    this.defs = null;
    this.pathDefs = null;
    this.clipDefs = null;
    this.lodManager = null;
    console.log("[RendererEngine] Destroyed");
  }
}
const logger$1 = createLogger("StyleManager");
class StyleManager {
  constructor(options) {
    this.viewer = options.viewer;
    this.memoryManager = options.memoryManager;
    this.staticRenderer = options.staticRenderer;
    this.safariCompat = options.safariCompat;
    this.renderOptimizer = options.renderOptimizer;
    this.stateManager = options.stateManager;
    this.animationQueue = options.animationQueue;
    this.revealRenderer = options.revealRenderer;
    this.temporalRenderer = options.temporalRenderer;
    this.isSafari = options.isSafari || false;
    this.colorScheme = options.colorScheme;
    this.timingEasing = options.timingEasing;
    this.currentEasingName = options.currentEasingName;
    this.getAnimationDuration = options.getAnimationDuration;
    this.animationsPaused = false;
    this.allowHoverDuringSpotlight = true;
    this.resetQueue = /* @__PURE__ */ new Set();
    this.resetScheduled = false;
    this.resetDebounceTimer = null;
    logger$1.debug("Initialized");
  }
  /**
   * Check if animations are paused
   */
  areAnimationsPaused() {
    return this.animationsPaused === true;
  }
  /**
   * Pause all animations (for cinematic zoom)
   */
  pauseAllAnimations() {
    logger$1.debug("⏸️ pauseAllAnimations called, was:", this.animationsPaused);
    this.animationsPaused = true;
  }
  /**
   * Resume all animations
   */
  resumeAllAnimations() {
    logger$1.debug("🎬 resumeAllAnimations called, was:", this.animationsPaused);
    this.animationsPaused;
    this.animationsPaused = false;
    logger$1.debug("🎬 After setting to false, animationsPaused is now:", this.animationsPaused);
    if (this.animationsPaused === true) {
      logger$1.error("❌ CRITICAL: animationsPaused is still true after setting to false!");
      this.animationsPaused = false;
    }
    const allHotspotGroups = document.querySelectorAll('g[data-animation-active="true"]');
    logger$1.debug(`Clearing ${allHotspotGroups.length} stuck animation-active flags`);
    allHotspotGroups.forEach((group) => {
      const mainPath = group.querySelector(".main-path");
      if (!mainPath || !mainPath.currentAnimation) {
        group.setAttribute("data-animation-active", "false");
      }
    });
    setTimeout(() => {
      if (this.animationsPaused === true) {
        logger$1.error("❌ animationsPaused reverted to true after resumeAllAnimations!");
      } else {
        logger$1.debug("✅ Animations successfully resumed (confirmed after delay)");
      }
    }, 100);
  }
  /**
   * Reset hotspot to normal state - complete visual cleanup
   * OPTIMIZED: Batched DOM operations to prevent layout thrashing
   * FIX #3: Queue-based batching - prevents 15 individual RAF calls
   */
  resetToNormalState(group) {
    if (!group) return;
    this.resetQueue.add(group);
    if (this.resetDebounceTimer) {
      clearTimeout(this.resetDebounceTimer);
    }
    this.resetDebounceTimer = setTimeout(() => {
      if (!this.resetScheduled) {
        this.resetScheduled = true;
        requestAnimationFrame(() => {
          this._processBatchedResets();
        });
      }
    }, 16);
  }
  /**
   * Process all queued resets in a single RAF
   * CRITICAL: This prevents 15 individual RAF calls (15 × 26ms = 390ms overhead!)
   */
  _processBatchedResets() {
    var _a;
    const startTime = performance.now();
    const count = this.resetQueue.size;
    this.resetQueue.forEach((group) => {
      const hotspotId = group.getAttribute("data-hotspot-id");
      const allPaths = group.querySelectorAll("path");
      allPaths.forEach((path) => {
        if (path.currentAnimation) {
          path.currentAnimation.cancel();
          path.currentAnimation = null;
        }
        if (path.getAnimations) {
          path.getAnimations().forEach((anim) => anim.cancel());
        }
      });
      const hotspotType = group.getAttribute("data-hotspot-type") || "area";
      group.setAttribute("class", `hotspot-${hotspotType} hotspot-normal`);
      group.setAttribute("data-current-state", "normal");
      group.setAttribute("data-animation-active", "false");
      group.setAttribute("data-animation-completed", "false");
      const attrsToRemove = [
        "data-maintain-visual",
        "data-hover-maintained",
        "data-hover-preserved",
        "data-was-selected"
      ];
      attrsToRemove.forEach((attr) => group.removeAttribute(attr));
      if (this.memoryManager && hotspotId) {
        this.memoryManager.clearAnimationEntry(`${hotspotId}_hover`);
        this.memoryManager.clearAnimationEntry(`${hotspotId}_selected`);
      }
    });
    this.resetQueue.clear();
    this.resetScheduled = false;
    this.resetDebounceTimer = null;
    const batchTime = performance.now() - startTime;
    if (count > 5) {
      const caller = ((_a = new Error().stack.split("\n")[3]) == null ? void 0 : _a.trim()) || "unknown";
      console.log(
        `[StyleManager] Batched ${count} resets in ${batchTime.toFixed(2)}ms (${(batchTime / count).toFixed(2)}ms avg per hotspot)`,
        `
  Called from: ${caller}`
      );
    }
  }
  /**
   * Ensure hotspot visibility after Canvas2D spotlight
   * Called by TemporalEchoController to fix border visibility
   */
  ensureHotspotVisibility(group) {
    if (!group) return;
    const hotspotId = group.getAttribute("data-hotspot-id");
    group.removeAttribute("data-canvas2d-selected");
    if (group.style.display === "none") {
      group.style.display = "";
      logger$1.debug(`ensureHotspotVisibility - restored display for hotspot ${hotspotId}`);
    }
    if (group.style.opacity === "0" || !group.style.opacity) {
      group.style.opacity = "";
    }
    const mainPath = group.querySelector(".main-path");
    if (mainPath) {
      if (mainPath.style.stroke === "transparent") {
        mainPath.style.stroke = "";
      }
      if (mainPath.style.strokeWidth === "0" || mainPath.style.strokeWidth === "0px") {
        mainPath.style.strokeWidth = "";
      }
      if (mainPath.style.opacity === "0") {
        mainPath.style.opacity = "";
      }
    }
    void group.offsetWidth;
  }
  /**
   * Update color scheme
   */
  setColorScheme(colorScheme) {
    this.colorScheme = colorScheme;
  }
  /**
   * Apply style to a hotspot group element
   * Manages all animations and visual states
   */
  applyStyle(group, type, state, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const hotspotId = group.getAttribute("data-hotspot-id");
    if (state === "normal") {
      this.resetToNormalState(group);
      return;
    }
    const currentState = group.getAttribute("data-current-state");
    const animationCompleted = group.getAttribute("data-animation-completed") === "true";
    const animationActive = group.getAttribute("data-animation-active") === "true";
    logger$1.debug(`applyStyle called:`, {
      hotspotId,
      state,
      currentState,
      animationCompleted,
      animationActive,
      isAutoDeselecting: (_a = window.nativeHotspotRenderer) == null ? void 0 : _a.isAutoDeselecting,
      caller: ((_b = new Error().stack.split("\n")[2]) == null ? void 0 : _b.trim()) || "unknown"
    });
    if (window.nativeHotspotRenderer && window.nativeHotspotRenderer.isAutoDeselecting) {
      if (state === "hover") {
        logger$1.debug("Skipping hover animation during auto-deselect");
        return;
      }
    }
    if (this.revealRenderer.isActive() && state !== "normal") {
      return;
    }
    if (state === "hover" && group.getAttribute("data-hover-maintained") === "true") {
      if (currentState === "hover") {
        logger$1.debug(`Skipping hover re-animation for maintained hotspot ${hotspotId}`);
        return;
      }
    }
    group.getElementsByTagName("path");
    const mainPath = group.querySelector(".main-path");
    const stateKey = `${hotspotId}-${state}`;
    const hasBeenAnimated = this.memoryManager.hasAnimationBeenShown(stateKey);
    const currentZoom = this.viewer.viewport.getZoom();
    const isInSpotlight = this.areAnimationsPaused() && state === "hover" && this.allowHoverDuringSpotlight;
    const useStaticStyle = currentZoom > 8 && !isInSpotlight;
    if (isInSpotlight && currentZoom > 8) {
      logger$1.debug(
        "🎯 Spotlight hover detected - bypassing static mode to allow animation at zoom:",
        currentZoom.toFixed(2)
      );
    }
    const stateChanged = currentState !== state;
    const isUserInteraction = state !== "normal" && stateChanged;
    if (currentState === "selected" && state === "hover") {
      logger$1.debug(`Transition selected → hover, preserving animation state`);
      group.setAttribute("data-was-selected", "true");
    }
    const disableStrokeAnimation = this.temporalRenderer.shouldDisableStrokeAnimation();
    const exitedStaticMode = this.staticRenderer.isExitingStaticMode(group, currentZoom);
    this.staticRenderer.updateZoomTracking(group, currentZoom);
    if (exitedStaticMode || stateChanged) {
      this.memoryManager.clearAnimationEntry(stateKey);
    }
    if (!stateChanged && hasBeenAnimated && !exitedStaticMode && !isUserInteraction) {
      return;
    }
    if ((state === "hover" || state === "selected") && useStaticStyle && !this.temporalRenderer.isActive()) {
      logger$1.debug(
        "Using static mode at zoom:",
        currentZoom.toFixed(2),
        "for state:",
        state,
        "(spotlight check:",
        isInSpotlight,
        ")"
      );
      this.staticRenderer.applyStaticStyle(group, type, state, this.colorScheme);
      return;
    }
    if (state === "hover" || state === "selected") {
      const isAnimationActive = group.getAttribute("data-animation-active");
      const animationCompleted2 = group.getAttribute("data-animation-completed") === "true";
      if (state === "selected" && currentState === "hover") {
        logger$1.debug(
          `Transition hover → selected for ${hotspotId}, animationActive=${isAnimationActive}, animationCompleted=${animationCompleted2}`
        );
        group.setAttribute("data-current-state", "selected");
        group.setAttribute("data-animation-active", "false");
        group.setAttribute("data-animation-completed", "true");
        if (!this.isSafari && mainPath) {
          if (mainPath.currentAnimation) {
            mainPath.currentAnimation.cancel();
            mainPath.currentAnimation = null;
          }
          mainPath.style.strokeWidth = "4px";
          if (mainPath.style.strokeDasharray !== "none") {
            mainPath.style.strokeDasharray = "none";
            mainPath.style.strokeDashoffset = "0";
          }
          return;
        }
      } else if (state === "selected") {
        const wasSelected = group.getAttribute("data-was-selected") === "true";
        logger$1.debug(
          `Direct to selected for ${hotspotId}, wasSelected=${wasSelected}, animationCompleted=${animationCompleted2}`
        );
        if (wasSelected || animationCompleted2) {
          logger$1.debug(
            `Preventing animation for selected state (wasSelected=${wasSelected}, completed=${animationCompleted2}`
          );
          group.setAttribute("data-current-state", "selected");
          group.removeAttribute("data-was-selected");
        }
      } else if (isAnimationActive === "true" && state === currentState) {
        return;
      }
      if (state === "hover" && group.getAttribute("data-hover-preserved") === "true") {
        group.removeAttribute("data-hover-preserved");
        return;
      }
      if (state === "hover" && group.getAttribute("data-hover-maintained") === "true") {
        group.removeAttribute("data-hover-maintained");
        return;
      }
    }
    group.setAttribute("class", `hotspot-${type} hotspot-${state}`);
    group.setAttribute("data-current-state", state);
    if (state === "hover" || state === "selected") {
      const overlayManager = window.overlayManager || ((_c = this.viewer) == null ? void 0 : _c.overlayManager);
      const isCanvas2D = overlayManager && overlayManager.constructor.name === "Canvas2DOverlayManager";
      if (state === "hover" && (isCanvas2D || group.getAttribute("data-canvas2d-selected") === "true")) {
        if (group.style.display === "none") {
          group.style.display = "";
        }
        group.removeAttribute("data-canvas2d-selected");
        logger$1.debug(`Canvas2D detected - ensuring visibility for hotspot in hover state`);
      }
      if (this.isSafari && !disableStrokeAnimation) {
        if (state === "selected") {
          const mainPath2 = group.querySelector(".main-path");
          const glowLayer1 = group.querySelector(".glow-layer-1");
          const glowLayer2 = group.querySelector(".glow-layer-2");
          const glowLayer3 = group.querySelector(".glow-layer-3");
          const glowLayer4 = group.querySelector(".glow-layer-4");
          const glowLayer5 = group.querySelector(".glow-layer-5");
          const isBlackOnBlack = this.colorScheme.main === "#000000";
          const layers = [
            { element: mainPath2, opacity: "1" },
            { element: glowLayer1, opacity: isBlackOnBlack ? "0.9" : "1" },
            { element: glowLayer2, opacity: isBlackOnBlack ? "0.8" : "0.9" },
            { element: glowLayer3, opacity: isBlackOnBlack ? "0.6" : "0.8" },
            { element: glowLayer4, opacity: "0.35" },
            { element: glowLayer5, opacity: "0.2" }
          ];
          layers.forEach(({ element, opacity }) => {
            if (element) {
              element.style.strokeDasharray = "none";
              element.style.strokeDashoffset = "0";
              element.style.opacity = opacity;
            }
          });
          group.setAttribute("data-animation-completed", "true");
          group.setAttribute("data-animation-active", "false");
        } else {
          const animationCompleted2 = group.getAttribute("data-animation-completed") === "true";
          if (!animationCompleted2) {
            const animationDuration = this.getAnimationDuration(hotspotId);
            this.safariCompat.animateSafariGlowLayers(
              group,
              state,
              animationDuration,
              this.colorScheme,
              this.timingEasing
            );
            group.setAttribute("data-animation-active", "true");
          }
        }
        this.memoryManager.registerAnimation(stateKey);
      } else if (this.isSafari && disableStrokeAnimation) {
        const glowLayers = group.querySelectorAll(
          ".glow-layer-1, .glow-layer-2, .glow-layer-3"
        );
        const mainPath2 = group.querySelector(".main-path");
        const opacities = {
          mainPath: "1",
          layer1: state === "selected" ? "0.7" : "0.6",
          layer2: state === "selected" ? "0.5" : "0.4",
          layer3: state === "selected" ? "0.3" : "0.2"
        };
        if (mainPath2) mainPath2.style.opacity = opacities.mainPath;
        glowLayers.forEach((layer, index) => {
          const opacity = [opacities.layer1, opacities.layer2, opacities.layer3][index];
          if (layer && opacity) {
            layer.style.strokeDasharray = "none";
            layer.style.strokeDashoffset = "0";
            layer.style.opacity = opacity;
          }
        });
      }
      if (mainPath && !this.isSafari) {
        if (mainPath.currentAnimation) {
          mainPath.currentAnimation.cancel();
          mainPath.currentAnimation = null;
        }
        const overlayManager2 = window.overlayManager || ((_d = this.viewer) == null ? void 0 : _d.overlayManager);
        const isCanvas2D2 = overlayManager2 && overlayManager2.constructor.name === "Canvas2DOverlayManager";
        const isHoverState = state === "hover";
        const strokeConfig = {
          animation: "none",
          strokeDasharray: isHoverState ? "0 100" : "none",
          strokeDashoffset: "0",
          fill: "none",
          stroke: isCanvas2D2 ? "transparent" : this.colorScheme.main,
          strokeWidth: isCanvas2D2 ? "0" : state === "selected" ? "4px" : "3px",
          opacity: isCanvas2D2 ? "0" : "1.0"
          // Keep opacity at 1.0, hide via strokeDasharray
        };
        if (isCanvas2D2 && state === "selected") {
          group.setAttribute("data-canvas2d-selected", "true");
          strokeConfig.stroke = "transparent";
          strokeConfig.strokeWidth = "0";
          strokeConfig.opacity = "0";
          logger$1.debug(
            `Canvas2D detected - making borders transparent for hotspot ${hotspotId}`
          );
        }
        if (state === "selected") {
          logger$1.debug(`Initial style config for selected:`, strokeConfig);
        }
        Object.assign(mainPath.style, strokeConfig);
        if (!isCanvas2D2) {
          const haloIntensity = state === "selected" ? 0.5 : 0.4;
          const haloSize = state === "selected" ? "20px" : "15px";
          mainPath.style.boxShadow = `
                        0 0 ${haloSize} rgba(11, 18, 21, ${haloIntensity * 2}),
                        0 0 ${haloSize * 2} rgba(255, 255, 255, 0.25),
                        0 0 ${haloSize * 3} rgba(255, 255, 255, 0.2),
                        0 0 ${haloSize * 1.5} rgba(11, 18, 21, ${haloIntensity * 1.5}),
                        inset 0 0 3px rgba(11, 18, 21, 0.15)
                    `;
        } else {
          mainPath.style.boxShadow = "none";
        }
        if (!isCanvas2D2) {
          const maxZoom = 10;
          const zoomPercent = currentZoom / maxZoom * 100;
          if (zoomPercent < 50) {
            mainPath.style.filter = `
                            blur(0.1px) 
                            contrast(1.5) 
                            drop-shadow(0 0 6px rgba(11, 18, 21, 0.8))
                            drop-shadow(0 0 15px rgba(11, 18, 21, 0.6))
                            drop-shadow(0 0 25px rgba(255, 255, 255, 0.4))
                            drop-shadow(0 0 40px rgba(255, 255, 255, 0.3))
                            drop-shadow(2px 3px 8px rgba(11, 18, 21, 0.5))
                        `;
          } else if (zoomPercent < 200) {
            mainPath.style.filter = `
                            blur(0.05px) 
                            contrast(1.45) 
                            drop-shadow(0 0 5px rgba(11, 18, 21, 0.75))
                            drop-shadow(0 0 12px rgba(11, 18, 21, 0.55))
                            drop-shadow(0 0 20px rgba(255, 255, 255, 0.35))
                            drop-shadow(0 0 35px rgba(255, 255, 255, 0.25))
                            drop-shadow(1px 2px 6px rgba(11, 18, 21, 0.45))
                        `;
          } else {
            mainPath.style.filter = `
                            blur(0px) 
                            contrast(1.4) 
                            drop-shadow(0 0 4px rgba(11, 18, 21, 0.7))
                            drop-shadow(0 0 10px rgba(11, 18, 21, 0.5))
                            drop-shadow(0 0 18px rgba(255, 255, 255, 0.3))
                            drop-shadow(0 0 30px rgba(255, 255, 255, 0.2))
                            drop-shadow(1px 1px 4px rgba(11, 18, 21, 0.4))
                        `;
          }
        } else {
          mainPath.style.filter = "none";
        }
        const realLength = parseFloat(mainPath.getAttribute("data-real-length")) || 100;
        if (mainPath.animate && !disableStrokeAnimation && !options.skipAnimation) {
          const selectedHotspot = (_e = this.stateManager) == null ? void 0 : _e.getSelectedHotspot();
          const isCurrentlySelected = selectedHotspot && selectedHotspot.id === hotspotId;
          const animationCompleted2 = group.getAttribute("data-animation-completed") === "true";
          logger$1.debug(`Animation check for ${hotspotId}:`, {
            state,
            isCurrentlySelected,
            animationCompleted: animationCompleted2,
            currentState,
            skipAnimation: options.skipAnimation,
            disableStrokeAnimation
          });
          let shouldExecuteAnimation = false;
          if (state === "selected") {
            logger$1.debug(
              `Selected state - showing stroke immediately for ${hotspotId}`
            );
            logger$1.debug(`BLOCKING animation for selected state`);
            mainPath.style.strokeDasharray = "none";
            mainPath.style.strokeDashoffset = "0";
            mainPath.style.opacity = "1.0";
            mainPath.style.strokeWidth = "4px";
            group.setAttribute("data-animation-completed", "true");
            group.setAttribute("data-animation-active", "false");
            group.removeAttribute("data-was-selected");
            options.skipAnimation = true;
          } else if (state === "hover" && !isCurrentlySelected) {
            logger$1.debug(
              `Starting hover animation for ${hotspotId} (not in spotlight)`
            );
            shouldExecuteAnimation = true;
            group.setAttribute("data-animation-active", "true");
            const isOrganicAnimation2 = this.currentEasingName && this.currentEasingName.toLowerCase().includes("organic") || this.timingEasing && this.timingEasing.includes("organic");
            if (window.DEBUG_ANIMATIONS) {
              logger$1.perf(`[Micro-Variations] Animation setup check:`, {
                hotspotId,
                isOrganicAnimation: isOrganicAnimation2,
                currentEasingName: this.currentEasingName,
                timingEasing: this.timingEasing,
                pathLength: realLength
              });
            }
            mainPath.style.strokeDasharray = "0 100";
            mainPath.style.strokeDashoffset = "0";
            group.removeAttribute("data-animation-completed");
            if (isOrganicAnimation2 && hotspotId) {
              if (window.DEBUG_ANIMATIONS) {
                logger$1.perf(
                  `[Random Start] Organic animation will use random starting point`
                );
              }
            }
          } else {
            logger$1.debug(
              `Skipping animation for ${hotspotId} - isCurrentlySelected=${isCurrentlySelected}, state=${state}`
            );
            mainPath.style.strokeDasharray = "none";
            mainPath.style.strokeDashoffset = "0";
            mainPath.style.opacity = isCanvas2D2 ? "0" : "1.0";
            mainPath.style.strokeWidth = state === "selected" ? "4px" : "3px";
          }
          let animationDuration = this.getAnimationDuration(hotspotId);
          if (window.DEBUG_ANIMATIONS) {
            logger$1.perf("[DEBUG] Checking for organic animation:", {
              currentEasingName: this.currentEasingName,
              timingEasing: this.timingEasing,
              hotspotId,
              hasOrganic: this.currentEasingName && this.currentEasingName.toLowerCase().includes("organic") || this.timingEasing && this.timingEasing.includes("organic")
            });
          }
          const isOrganicAnimation = this.currentEasingName && this.currentEasingName.toLowerCase().includes("organic") || this.timingEasing && this.timingEasing.includes("organic");
          if (isOrganicAnimation && hotspotId) {
            const originalDuration = animationDuration;
            animationDuration = organicVariations.applyDurationVariation(
              animationDuration,
              hotspotId
            );
            const percentChange = ((animationDuration - originalDuration) / originalDuration * 100).toFixed(1);
            if (window.DEBUG_ANIMATIONS) {
              logger$1.perf(
                `[Micro-Variations] ⏱️ Duration variation for ${hotspotId}: ${originalDuration.toFixed(3)}s → ${animationDuration.toFixed(3)}s (${percentChange}%)`
              );
            }
          }
          const currentZoom2 = ((_g = (_f = this.viewer) == null ? void 0 : _f.viewport) == null ? void 0 : _g.getZoom()) || 1;
          const useQueue = this.renderOptimizer.shouldQueueAnimations(
            currentZoom2,
            this.stateManager.getVisibleCount()
          );
          const animateFunction = () => {
            var _a2;
            if (state === "selected") {
              logger$1.debug(
                `ANIMATION FUNCTION: Blocking animation for selected state`
              );
              return;
            }
            logger$1.debug(
              `ANIMATION FUNCTION: Starting animation for ${hotspotId} in ${state} state`
            );
            const overlayManager3 = window.overlayManager || ((_a2 = this.viewer) == null ? void 0 : _a2.overlayManager);
            const isCanvas2DInner = overlayManager3 && overlayManager3.constructor.name === "Canvas2DOverlayManager";
            const maxZoom = 10;
            const zoomPercent = currentZoom2 / maxZoom * 100;
            let finalOpacity;
            if (isCanvas2DInner) {
              finalOpacity = "0";
            } else if (zoomPercent < 50) {
              finalOpacity = state === "selected" ? "1.0" : "0.95";
            } else if (zoomPercent < 200) {
              finalOpacity = state === "selected" ? "1.0" : "0.98";
            } else {
              finalOpacity = "1.0";
            }
            let animationEasing = this.timingEasing;
            const isOrganicAnimation2 = this.currentEasingName && this.currentEasingName.toLowerCase().includes("organic") || this.timingEasing && this.timingEasing.includes("organic");
            if (isOrganicAnimation2 && hotspotId) {
              const originalEasing = this.timingEasing;
              animationEasing = organicVariations.applyEasingVariation(
                this.timingEasing,
                hotspotId
              );
              if (window.DEBUG_ANIMATIONS) {
                logger$1.perf(
                  `[Micro-Variations] 🎨 Easing variation for ${hotspotId}:`,
                  {
                    original: originalEasing,
                    varied: animationEasing
                  }
                );
              }
            }
            const pathLength = 100;
            const randomStart = Math.random() * pathLength;
            if (window.DEBUG_ANIMATIONS) {
              logger$1.perf(
                `[Random Start] Rotating dash animation for ${hotspotId}: starting at ${randomStart.toFixed(1)}% of path`
              );
            }
            mainPath.style.strokeDasharray = `0 ${pathLength}`;
            mainPath.style.strokeDashoffset = "0";
            mainPath.style.opacity = finalOpacity;
            mainPath.currentAnimation = mainPath.animate(
              [
                {
                  // Start: completely hidden stroke (via dasharray, not opacity)
                  strokeDasharray: `0 ${pathLength}`,
                  strokeDashoffset: `${-randomStart}`,
                  opacity: finalOpacity,
                  // Keep constant opacity
                  offset: 0
                },
                {
                  // Early: ink flow begins to appear
                  strokeDasharray: `${pathLength * 0.1} ${pathLength * 0.9}`,
                  strokeDashoffset: `${-randomStart}`,
                  opacity: finalOpacity,
                  // Keep constant opacity
                  offset: 0.1
                },
                {
                  // Middle: confident ink flow
                  strokeDasharray: `${pathLength * 0.5} ${pathLength * 0.5}`,
                  strokeDashoffset: `${-randomStart}`,
                  opacity: finalOpacity,
                  // Keep constant opacity
                  offset: 0.5
                },
                {
                  // Near end: almost complete
                  strokeDasharray: `${pathLength * 0.95} ${pathLength * 0.05}`,
                  strokeDashoffset: `${-randomStart}`,
                  opacity: finalOpacity,
                  offset: 0.95
                },
                {
                  // End: complete path visible - keep the same offset to avoid jump
                  strokeDasharray: `${pathLength} 0`,
                  strokeDashoffset: `${-randomStart}`,
                  opacity: finalOpacity,
                  offset: 1
                }
              ],
              {
                duration: animationDuration * 1e3,
                easing: animationEasing,
                fill: "forwards"
              }
            );
            const animationStartTime = performance.now();
            if (window.DEBUG_ANIMATIONS) {
              logger$1.perf(
                `[Animation] Stroke animation STARTED for ${group.getAttribute("data-hotspot-id")} at ${animationStartTime.toFixed(0)}ms`
              );
            }
            mainPath.currentAnimation.onfinish = () => {
              const animationEndTime = performance.now();
              const actualDuration = animationEndTime - animationStartTime;
              if (window.DEBUG_ANIMATIONS) {
                logger$1.perf(
                  `[Animation] Stroke animation FINISHED for ${group.getAttribute("data-hotspot-id")} at ${animationEndTime.toFixed(0)}ms (actual duration: ${actualDuration.toFixed(0)}ms, expected: ${(animationDuration * 1e3).toFixed(0)}ms`
                );
              }
              mainPath.currentAnimation = null;
              group.setAttribute("data-animation-active", "false");
              const currentState2 = group.getAttribute("data-current-state");
              if (currentState2 === "hover") {
                group.setAttribute("data-animation-completed", "true");
                mainPath.style.strokeDasharray = "none";
                mainPath.style.strokeDashoffset = "0";
                mainPath.style.opacity = finalOpacity;
              } else {
                logger$1.debug(
                  `Animation finished but state is now '${currentState2}' - hiding stroke`
                );
                mainPath.style.strokeDasharray = "none";
                mainPath.style.strokeDashoffset = "0";
                mainPath.style.opacity = "0";
                mainPath.style.stroke = "transparent";
                mainPath.style.strokeWidth = "0";
                group.removeAttribute("data-animation-completed");
              }
            };
            return mainPath.currentAnimation.finished;
          };
          if (shouldExecuteAnimation) {
            logger$1.debug(`Animation should be executed for ${hotspotId}`);
            if (useQueue) {
              logger$1.debug(
                `🎭 Adding animation to queue for hotspot ${hotspotId}`
              );
              this.animationQueue.add(group, animateFunction);
            } else {
              logger$1.debug(
                `⚡ QUICK WIN #4: Immediate animation execution for hotspot ${hotspotId}`
              );
              animateFunction();
            }
            group.setAttribute("data-animation-active", "true");
            this.memoryManager.registerAnimation(stateKey);
          } else {
            logger$1.debug(
              `Animation execution SKIPPED for ${hotspotId} - shouldExecuteAnimation=${shouldExecuteAnimation}`
            );
          }
        } else {
          mainPath.style.strokeDasharray = "none";
          mainPath.style.strokeDashoffset = "0";
          mainPath.style.opacity = isCanvas2D2 ? "0" : "1.0";
          mainPath.style.strokeWidth = isCanvas2D2 ? "0" : state === "selected" ? "4px" : "3px";
        }
      }
    } else {
      this.memoryManager.clearAnimationEntries(hotspotId);
      group.setAttribute("data-animation-active", "false");
      group.removeAttribute("data-animation-completed");
      const overlayManager = window.overlayManager || ((_h = this.viewer) == null ? void 0 : _h.overlayManager);
      const isCanvas2D = overlayManager && overlayManager.constructor.name === "Canvas2DOverlayManager";
      if (isCanvas2D || group.getAttribute("data-canvas2d-selected") === "true") {
        group.removeAttribute("data-canvas2d-selected");
        if (group.style.display === "none") {
          group.style.display = "";
        }
        logger$1.debug(`Canvas2D cleanup - restoring normal state for hotspot`);
      }
      if (this.isSafari) {
        this.safariCompat.resetSafariGlowLayers(group);
      }
      if (mainPath) {
        if (mainPath.currentAnimation) {
          mainPath.currentAnimation.cancel();
          mainPath.currentAnimation = null;
        }
        mainPath.getAnimations().forEach((animation) => animation.cancel());
        Object.assign(mainPath.style, {
          animation: "none",
          strokeDasharray: "none",
          strokeDashoffset: "0",
          transition: "opacity 0.1s ease-out",
          // Faster transition
          fill: "none",
          stroke: "transparent",
          strokeWidth: "0",
          filter: "none",
          opacity: "0",
          boxShadow: "none"
          // Clear halo effects
        });
      }
    }
    const targetOpacity = state === "hover" || state === "selected" ? "1" : "0";
    if (state === "selected") {
      logger$1.debug(`END OF applyStyle for selected:`, {
        strokeWidth: mainPath == null ? void 0 : mainPath.style.strokeWidth,
        stroke: mainPath == null ? void 0 : mainPath.style.stroke,
        opacity: mainPath == null ? void 0 : mainPath.style.opacity,
        strokeDasharray: mainPath == null ? void 0 : mainPath.style.strokeDasharray,
        groupOpacity: targetOpacity
      });
    }
    group.style.opacity = targetOpacity;
  }
  /**
   * Destroy the style manager and clean up
   */
  destroy() {
    this.viewer = null;
    this.memoryManager = null;
    this.staticRenderer = null;
    this.safariCompat = null;
    this.renderOptimizer = null;
    this.stateManager = null;
    this.animationQueue = null;
    this.revealRenderer = null;
    this.temporalRenderer = null;
  }
}
class ActiveHotspotManager {
  constructor() {
    this.activeHotspots = /* @__PURE__ */ new Map();
    this.visibleIds = /* @__PURE__ */ new Set();
    this.allHotspots = /* @__PURE__ */ new Map();
    this.stats = {
      totalHotspots: 0,
      activeHotspots: 0,
      domOperations: 0,
      lastUpdateTime: 0
    };
  }
  /**
   * Initialize with all hotspots (stores reference only)
   */
  initialize(allOverlays) {
    this.allHotspots.clear();
    allOverlays.forEach((overlay, id) => {
      this.allHotspots.set(id, {
        id,
        hotspot: overlay.hotspot,
        element: overlay.element,
        bounds: overlay.bounds
      });
      overlay.element.classList.add("hotspot-hidden");
      if (!overlay.element.style.willChange) {
        overlay.element.style.willChange = "transform, opacity, visibility";
      }
    });
    this.stats.totalHotspots = this.allHotspots.size;
  }
  /**
   * Update which hotspots should be active based on LOD selection
   * PHASE 2 OPTIMIZATION: Batched single-class toggle (86ms → <10ms)
   * Instead of 2 classList operations per hotspot (remove + add), use 1 operation
   */
  updateActiveSet(selectedHotspotIds) {
    if (window.temporalEchoController && window.temporalEchoController.isRevealing) {
      console.log("[ActiveHotspotManager] Skipped - temporal echo active");
      return;
    }
    const startTime = performance.now();
    const newVisibleIds = new Set(selectedHotspotIds);
    const toShow = [];
    const toHide = [];
    this.allHotspots.forEach((data, id) => {
      const shouldBeVisible = newVisibleIds.has(id);
      const isCurrentlyVisible = this.activeHotspots.has(id);
      if (shouldBeVisible && !isCurrentlyVisible) {
        toShow.push(data);
      } else if (!shouldBeVisible && isCurrentlyVisible) {
        toHide.push(data);
      }
    });
    if (toShow.length > 0 || toHide.length > 0) {
      requestAnimationFrame(() => {
        const batchStart = performance.now();
        toHide.forEach((data) => {
          if (data.element) {
            const classes = data.element.className.baseVal || data.element.className;
            data.element.className.baseVal = classes.replace(
              "hotspot-visible",
              "hotspot-hidden"
            );
          }
        });
        toShow.forEach((data) => {
          if (data.element) {
            const classes = data.element.className.baseVal || data.element.className;
            data.element.className.baseVal = classes.replace(
              "hotspot-hidden",
              "hotspot-visible"
            );
          }
        });
        toHide.forEach((data) => this.activeHotspots.delete(data.id));
        toShow.forEach((data) => this.activeHotspots.set(data.id, data));
        this.visibleIds = newVisibleIds;
        this.stats.activeHotspots = this.activeHotspots.size;
        this.stats.domOperations = toShow.length + toHide.length;
        this.stats.lastUpdateTime = performance.now() - startTime;
        const batchTime = performance.now() - batchStart;
        if (this.stats.lastUpdateTime > 10) {
          console.log(
            `[ActiveHotspotManager] Update: ${this.stats.activeHotspots} active, ${this.stats.domOperations} ops in ${this.stats.lastUpdateTime.toFixed(2)}ms (batch: ${batchTime.toFixed(2)}ms)`
          );
        }
      });
    } else {
      this.stats.lastUpdateTime = performance.now() - startTime;
    }
  }
  /**
   * Legacy update method using individual classList operations
   * Kept as fallback if SVG container is not found
   * This is the OLD slow method (86ms for 15 hotspots)
   */
  _updateActiveSetLegacy(selectedHotspotIds) {
    const startTime = performance.now();
    const newVisibleIds = new Set(selectedHotspotIds);
    const toShow = [];
    const toHide = [];
    this.allHotspots.forEach((data, id) => {
      const shouldBeVisible = newVisibleIds.has(id);
      const isCurrentlyVisible = this.activeHotspots.has(id);
      if (shouldBeVisible && !isCurrentlyVisible) {
        toShow.push(data);
      } else if (!shouldBeVisible && isCurrentlyVisible) {
        toHide.push(data);
      }
    });
    if (toShow.length > 0 || toHide.length > 0) {
      requestAnimationFrame(() => {
        toHide.forEach((data) => {
          if (data.element) {
            data.element.classList.remove("hotspot-visible");
            data.element.classList.add("hotspot-hidden");
          }
        });
        toShow.forEach((data) => {
          if (data.element) {
            data.element.classList.remove("hotspot-hidden");
            data.element.classList.add("hotspot-visible");
          }
        });
        toHide.forEach((data) => this.activeHotspots.delete(data.id));
        toShow.forEach((data) => this.activeHotspots.set(data.id, data));
        this.visibleIds = newVisibleIds;
        this.stats.activeHotspots = this.activeHotspots.size;
        this.stats.domOperations = toShow.length + toHide.length;
        this.stats.lastUpdateTime = performance.now() - startTime;
        if (this.stats.lastUpdateTime > 50) {
          console.log(
            `[ActiveHotspotManager] LEGACY Slow update: ${this.stats.activeHotspots} active, ${this.stats.domOperations} DOM ops in ${this.stats.lastUpdateTime.toFixed(2)}ms`
          );
        }
      });
    } else {
      this.stats.lastUpdateTime = performance.now() - startTime;
    }
  }
  /**
   * Get only active hotspots for operations
   */
  getActiveHotspots() {
    return this.activeHotspots;
  }
  /**
   * Check if a hotspot is currently active
   */
  isActive(hotspotId) {
    return this.activeHotspots.has(hotspotId);
  }
  /**
   * Force show specific hotspots (e.g., hovered/selected)
   * Used by temporal echo - respects mobile performance limits
   */
  forceShowHotspots(hotspotIds, options = {}) {
    const updates = [];
    const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    const maxForceShow = options.maxForceShow || (isMobile2 ? 15 : 50);
    const prioritizedIds = hotspotIds.slice(0, maxForceShow);
    prioritizedIds.forEach((id) => {
      if (!this.activeHotspots.has(id)) {
        const data = this.allHotspots.get(id);
        if (data) {
          updates.push(data);
        }
      }
    });
    if (updates.length > 0) {
      requestAnimationFrame(() => {
        updates.forEach((data) => {
          data.element.classList.remove("hotspot-hidden");
          data.element.classList.add("hotspot-visible");
          this.activeHotspots.set(data.id, data);
        });
      });
    }
    if (hotspotIds.length > maxForceShow) {
      console.log(
        `[ActiveHotspotManager] Limited forced hotspots from ${hotspotIds.length} to ${maxForceShow} for performance`
      );
    }
  }
  /**
   * Clear all active hotspots (e.g., for mode changes)
   */
  clearActive() {
    requestAnimationFrame(() => {
      this.activeHotspots.forEach((data) => {
        data.element.classList.add("hotspot-hidden");
        data.element.classList.remove("hotspot-visible");
      });
      this.activeHotspots.clear();
      this.visibleIds.clear();
      this.stats.activeHotspots = 0;
    });
  }
  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      reductionPercent: ((1 - this.stats.activeHotspots / this.stats.totalHotspots) * 100).toFixed(1)
    };
  }
}
class AsyncHitDetector {
  constructor(options = {}) {
    this.spatialIndex = options.spatialIndex;
    this.viewer = options.viewer;
    this.isMobile = options.isMobile || false;
    this.lastHitTestResult = null;
    this.pendingHitTest = null;
    this.hitTestInProgress = false;
    this.hitTestThrottle = this.isMobile ? 50 : 16;
    this.lastHitTestTime = 0;
    this.viewportCache = {
      bounds: null,
      zoom: null,
      timestamp: 0
    };
    this.visibleHotspots = /* @__PURE__ */ new Map();
    this.stats = {
      hitTests: 0,
      avgTime: 0,
      cacheHits: 0
    };
  }
  /**
   * Update the set of visible hotspots from LOD
   * This dramatically reduces hit test candidates
   */
  updateVisibleHotspots(activeHotspots) {
    this.visibleHotspots.clear();
    activeHotspots.forEach((data, id) => {
      this.visibleHotspots.set(id, {
        id,
        bounds: data.bounds,
        hotspot: data.hotspot
      });
    });
  }
  /**
   * Perform asynchronous hit test
   * Returns a promise with the hit hotspot or null
   */
  async performHitTest(point, useCache = true) {
    const now = performance.now();
    if (now - this.lastHitTestTime < this.hitTestThrottle) {
      return this.lastHitTestResult;
    }
    if (useCache && this.lastHitTestResult && this.pendingHitTest) {
      const lastPoint = this.pendingHitTest.point;
      const distance = Math.sqrt(
        Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2)
      );
      if (distance < 5) {
        this.stats.cacheHits++;
        return this.lastHitTestResult;
      }
    }
    if (this.hitTestInProgress) {
      return this.lastHitTestResult;
    }
    this.hitTestInProgress = true;
    this.pendingHitTest = { point, timestamp: now };
    return new Promise((resolve) => {
      const performTest = () => {
        const startTime = performance.now();
        const imagePoint = this.viewer.viewport.viewerElementToImageCoordinates(point);
        let hitHotspot = null;
        let closestDistance = Infinity;
        this.visibleHotspots.forEach((data) => {
          if (!data.bounds) return;
          if (imagePoint.x >= data.bounds.minX && imagePoint.x <= data.bounds.maxX && imagePoint.y >= data.bounds.minY && imagePoint.y <= data.bounds.maxY) {
            if (this.isMobile) {
              hitHotspot = data.hotspot;
            } else {
              const distance = this.getDistanceToHotspot(imagePoint, data);
              if (distance < closestDistance) {
                closestDistance = distance;
                hitHotspot = data.hotspot;
              }
            }
          }
        });
        const testTime = performance.now() - startTime;
        this.stats.hitTests++;
        this.stats.avgTime = (this.stats.avgTime * (this.stats.hitTests - 1) + testTime) / this.stats.hitTests;
        this.lastHitTestResult = hitHotspot;
        this.lastHitTestTime = now;
        this.hitTestInProgress = false;
        resolve(hitHotspot);
      };
      if ("requestIdleCallback" in window && !this.isMobile) {
        requestIdleCallback(performTest, { timeout: 50 });
      } else {
        setTimeout(performTest, 0);
      }
    });
  }
  /**
   * Get distance from point to hotspot center
   */
  getDistanceToHotspot(point, hotspotData) {
    const bounds = hotspotData.bounds;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    return Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
  }
  /**
   * Pre-calculate viewport bounds for hit testing
   */
  updateViewportCache() {
    const now = Date.now();
    if (now - this.viewportCache.timestamp < 100) {
      return this.viewportCache;
    }
    const viewport = this.viewer.viewport;
    this.viewportCache = {
      bounds: viewport.getBounds(),
      zoom: viewport.getZoom(),
      timestamp: now
    };
    return this.viewportCache;
  }
  /**
   * Clear hit test cache
   */
  clearCache() {
    this.lastHitTestResult = null;
    this.pendingHitTest = null;
    this.viewportCache.timestamp = 0;
  }
  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      visibleHotspots: this.visibleHotspots.size,
      cacheHitRate: (this.stats.cacheHits / Math.max(1, this.stats.hitTests) * 100).toFixed(1) + "%"
    };
  }
}
class InteractionThrottler {
  constructor(viewer) {
    this.viewer = viewer;
    this.isInteracting = false;
    this.lastInteractionTime = 0;
    this.frameSkipCount = 0;
    this.maxFrameSkip = 2;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (this.isMobile) {
      this.maxFrameSkip = 3;
    }
    this.setupEventListeners();
  }
  setupEventListeners() {
    this.viewer.addHandler("canvas-press", () => {
      this.isInteracting = true;
      this.lastInteractionTime = performance.now();
    });
    this.viewer.addHandler("canvas-drag", () => {
      this.isInteracting = true;
      this.lastInteractionTime = performance.now();
    });
    this.viewer.addHandler("canvas-pinch", () => {
      this.isInteracting = true;
      this.lastInteractionTime = performance.now();
    });
    this.viewer.addHandler("canvas-release", () => {
      this.isInteracting = false;
      this.frameSkipCount = 0;
    });
    this.viewer.addHandler("canvas-drag-end", () => {
      this.isInteracting = false;
      this.frameSkipCount = 0;
    });
    setInterval(() => {
      if (this.isInteracting && performance.now() - this.lastInteractionTime > 200) {
        this.isInteracting = false;
        this.frameSkipCount = 0;
      }
    }, 100);
  }
  shouldSkipFrame() {
    if (!this.isInteracting) {
      this.frameSkipCount = 0;
      return false;
    }
    if (this.frameSkipCount < this.maxFrameSkip) {
      this.frameSkipCount++;
      return true;
    }
    this.frameSkipCount = 0;
    return false;
  }
  isUserInteracting() {
    return this.isInteracting;
  }
  getStats() {
    return {
      isInteracting: this.isInteracting,
      frameSkipCount: this.frameSkipCount,
      maxFrameSkip: this.maxFrameSkip
    };
  }
}
const _NativeHotspotRenderer = class _NativeHotspotRenderer {
  constructor(options = {}) {
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    this.isWebKit = "WebkitAppearance" in document.documentElement.style && !window.chrome;
    this.isSafariOrWebKit = this.isSafari || this.isWebKit;
    Object.assign(this, {
      viewer: options.viewer,
      spatialIndex: options.spatialIndex,
      onHotspotHover: options.onHotspotHover || (() => {
      }),
      onHotspotClick: options.onHotspotClick || (() => {
      }),
      visibilityCheckInterval: options.visibilityCheckInterval || 100,
      batchSize: options.batchSize || 50,
      renderDebounceTime: options.renderDebounceTime || 16,
      debugMode: options.debugMode || false
    });
    this.updatePool = createUpdatePool();
    this.pointPool = createPointPool();
    this.enabled = true;
    this.activeTimeouts = /* @__PURE__ */ new Set();
    this.stateManager = new HotspotStateManager();
    this.stateManager.setCallbacks({
      onHoverChange: (newHotspot, previousHotspot) => {
        if (this.eventCoordinator) {
          this.eventCoordinator.emitHotspotHover(newHotspot, previousHotspot);
        }
        if (this.onHotspotHover) {
          this.onHotspotHover(newHotspot);
        }
      },
      onSelectionChange: (newSelection, previousSelection) => {
        if (this.eventCoordinator) {
          this.eventCoordinator.emitHotspotSelect(newSelection, previousSelection);
        }
      }
    });
    this.animationQueue = new AnimationQueue(
      this.isMobile ? _NativeHotspotRenderer.MAX_CONCURRENT_ANIMATIONS_MOBILE : _NativeHotspotRenderer.MAX_CONCURRENT_ANIMATIONS
    );
    this.activeHotspotManager = new ActiveHotspotManager();
    window.activeHotspotManager = this.activeHotspotManager;
    this.asyncHitDetector = new AsyncHitDetector({
      spatialIndex: this.spatialIndex,
      viewer: this.viewer,
      isMobile: this.isMobile
    });
    this.interactionThrottler = new InteractionThrottler(this.viewer);
    this.centralEventManager = new CentralizedEventManager({
      viewer: this.viewer,
      onHotspotClick: this.handleClick.bind(this),
      onHotspotHover: (hotspot) => {
        if (this.onHotspotHover) {
          this.onHotspotHover(hotspot);
        }
      }
    });
    this.memoryManager = new MemoryManager({
      isMobile: this.isMobile,
      isSafari: this.isSafari,
      cleanupIntervalTime: 2e3
    });
    this.renderOptimizer = new RenderOptimizer({
      viewer: this.viewer,
      isMobile: this.isMobile,
      batchSize: this.batchSize,
      renderDebounceTime: this.renderDebounceTime,
      visibilityCheckInterval: this.visibilityCheckInterval,
      significantChangeThreshold: 0.1,
      highHotspotCountThreshold: _NativeHotspotRenderer.HIGH_HOTSPOT_COUNT_THRESHOLD
    });
    this.modeStateManager = new ModeStateManager();
    this.modeStateManager.on("modeChange", (data) => {
      if (data.from === "temporal" && data.to !== "temporal") {
        if (this.temporalHandler) {
          this.temporalHandler.endHold();
        }
        if (this.temporalRenderer) {
          this.temporalRenderer.cleanupVisuals();
        }
      }
      if (this.eventCoordinator) {
        this.eventCoordinator.setMode(data.to);
      }
    });
    window.modeStateManager = this.modeStateManager;
    this.temporalRenderer = new TemporalRenderer({
      viewer: this.viewer,
      modeStateManager: this.modeStateManager,
      stateManager: this.stateManager,
      temporalHandler: null
      // Will be set after TemporalModeHandler creation
    });
    this.temporalDetectionEngine = new TemporalHoldDetectionEngine({
      audioEngine: window.audioEngine,
      onStateChange: (state, hotspot, data) => {
        if (this.modeStateManager) {
          this.modeStateManager.setTemporalState(
            state === "discovery" || state === "activation",
            state === "ended" ? null : state
          );
        }
      },
      onDiscovery: (hotspot, data) => {
        this.temporalRenderer.handlePhaseChange("discovery", hotspot);
      },
      onActivation: (hotspot, data) => {
        this.temporalRenderer.handlePhaseChange("activation", hotspot);
        setTimeout(() => {
          if (this.onHotspotClick) {
            this.onHotspotClick(hotspot);
          }
        }, 50);
      }
    });
    this.temporalHandler = new TemporalModeHandler({
      audioEngine: window.audioEngine,
      modeStateManager: this.modeStateManager,
      onPhaseChange: (phase, hotspot) => {
        this.temporalRenderer.handlePhaseChange(phase, hotspot);
      }
    });
    this.temporalRenderer.temporalHandler = this.temporalHandler;
    this.temporalRenderer.detectionEngine = this.temporalDetectionEngine;
    this.colorPalettes = {
      // Original palettes
      tech: {
        shadow: "rgba(0, 0, 0, 0.3)",
        glow: "#00cccc",
        contrast: "rgba(0, 0, 0, 1)",
        main: "#ffffff"
      },
      enchantedJournal: {
        shadow: "rgba(47, 79, 79, 0.4)",
        glow: "#FFD700",
        glow2: "#DDA0DD",
        contrast: "rgba(160, 82, 45, 0.8)",
        main: "#A0522D"
      },
      moonlitManuscript: {
        shadow: "rgba(47, 79, 79, 0.5)",
        glow: "#87CEEB",
        glow2: "#4682B4",
        contrast: "rgba(70, 130, 180, 0.9)",
        main: "#4682B4"
      },
      // New palettes based on research document
      pureWhiteHigh: {
        shadow: "rgba(0, 0, 0, 0.4)",
        glow: "rgba(255, 255, 255, 0.9)",
        // 90% opacity
        glow2: "rgba(255, 255, 255, 0.7)",
        // 70% for hover
        contrast: "rgba(255, 255, 255, 1)",
        // 100% for active
        main: "#FFFFFF"
      },
      pureWhiteBalanced: {
        shadow: "rgba(0, 0, 0, 0.3)",
        glow: "rgba(255, 255, 255, 0.8)",
        // 80% primary
        glow2: "rgba(255, 255, 255, 0.6)",
        // 60% secondary
        contrast: "rgba(255, 255, 255, 0.3)",
        // 30% ambient
        main: "#FFFFFF"
      },
      blackOnBlack: {
        shadow: "rgba(255, 255, 255, 0.1)",
        // Subtle white shadow
        glow: "rgba(0, 0, 0, 0.8)",
        // 80% black - original value
        glow2: "rgba(0, 0, 0, 0.6)",
        // 60% black - original value
        contrast: "rgba(255, 255, 255, 0.2)",
        // 20% white for subtle contrast
        main: "#000000"
      },
      // New authentic pigment liner palette based on research
      pigmentLinerNeutral: {
        shadow: "rgba(11, 18, 21, 0.15)",
        // Soft shadow using pigment color
        glow: "rgba(11, 18, 21, 0.85)",
        // Primary pigment liner black
        glow2: "rgba(11, 18, 21, 0.92)",
        // Darker for depth
        contrast: "rgba(255, 255, 255, 0.1)",
        // Minimal white contrast
        main: "#0B1215"
        // Authentic Sakura Pigma Micron equivalent
      },
      pigmentLinerWarm: {
        shadow: "rgba(26, 22, 20, 0.15)",
        // Warm shadow
        glow: "rgba(26, 22, 20, 0.85)",
        // Warm pigment black (Faber-Castell PITT)
        glow2: "rgba(26, 22, 20, 0.92)",
        // Darker warm tone
        contrast: "rgba(255, 255, 255, 0.1)",
        // Minimal contrast
        main: "#1A1614"
        // Warm pigment liner equivalent
      },
      pigmentLinerCool: {
        shadow: "rgba(16, 21, 32, 0.15)",
        // Cool shadow
        glow: "rgba(16, 21, 32, 0.85)",
        // Cool pigment black (Staedtler)
        glow2: "rgba(16, 21, 32, 0.92)",
        // Darker cool tone
        contrast: "rgba(255, 255, 255, 0.1)",
        // Minimal contrast
        main: "#101520"
        // Cool pigment liner equivalent
      }
    };
    this.currentEasingName = "standard";
    this.timingEasing = "cubic-bezier(0.25, 0.1, 0.25, 1)";
    this.easingOptions = {
      organic: "cubic-bezier(0.15, 0.40, 0.32, 0.88)",
      // Organic Main
      organicMeditative: "cubic-bezier(0.18, 0.35, 0.35, 0.90)",
      // #1
      organicDynamic: "cubic-bezier(0.22, 0.25, 0.38, 0.85)",
      // #2
      standard: "cubic-bezier(0.25, 0.1, 0.25, 1)"
      // Standard smooth
    };
    window.hotspotEasing = {
      current: this.currentEasingName,
      options: Object.keys(this.easingOptions),
      set: (easingName) => {
        if (this.easingOptions[easingName]) {
          this.currentEasingName = easingName;
          this.timingEasing = this.easingOptions[easingName];
          console.log(`[Easing] Switched to ${easingName}: ${this.timingEasing}`);
          if (this.styleManager) {
            this.styleManager.timingEasing = this.timingEasing;
            this.styleManager.currentEasingName = this.currentEasingName;
          }
          if (this.memoryManager) {
            this.memoryManager.clearAllAnimations();
          }
          const allHotspots = document.querySelectorAll(
            '[data-animation-completed="true"], [data-animation-active="true"]'
          );
          allHotspots.forEach((hotspot) => {
            hotspot.removeAttribute("data-animation-completed");
            hotspot.removeAttribute("data-animation-active");
          });
          if (window.organicVariations) {
            window.organicVariations.clearAllVariations();
          }
          return `Now using ${easingName} easing`;
        }
        return `Unknown easing: ${easingName}. Options: ${Object.keys(this.easingOptions).join(", ")}`;
      },
      test: () => {
        console.log("Testing all easing curves. Hover over different hotspots to compare.");
        return Object.keys(this.easingOptions);
      }
    };
    this.currentPalette = "pigmentLinerNeutral";
    this.colorScheme = this.colorPalettes[this.currentPalette];
    console.log(
      "[PigmentLiner] Using authentic pigment liner palette:",
      this.currentPalette,
      this.colorScheme
    );
    window.hotspotColorScheme = this.colorScheme;
    window.setPigmentLinerVariant = (variant) => {
      const validVariants = ["pigmentLinerNeutral", "pigmentLinerWarm", "pigmentLinerCool"];
      if (validVariants.includes(variant)) {
        console.log(`[PigmentLiner] Switching to variant: ${variant}`);
        this.currentPalette = variant;
        this.colorScheme = this.colorPalettes[variant];
        window.hotspotColorScheme = this.colorScheme;
        if (this.styleManager) {
          this.styleManager.setColorScheme(this.colorScheme);
        }
        this.refreshAllHotspotStyles();
      } else {
        console.log("[PigmentLiner] Available variants:", validVariants);
      }
    };
    console.log("[PigmentLiner] Available variants: neutral (default), warm, cool");
    console.log(
      '[PigmentLiner] Switch with: window.setPigmentLinerVariant("pigmentLinerWarm") or "pigmentLinerCool"'
    );
    if (this.staticRenderer) {
      this.staticRenderer.colorScheme = this.colorScheme;
    }
    this.safariCompat = new SafariCompatibility({
      colorScheme: this.colorScheme,
      isMobile: this.isMobile
    });
    this.staticRenderer = new StaticRenderer({
      viewer: this.viewer,
      colorScheme: this.colorScheme,
      isSafari: this.isSafari,
      isMobile: this.isMobile
    });
    window.hotspotPalettes = this.colorPalettes;
    window.setHotspotPalette = (paletteName) => {
      if (this.colorPalettes[paletteName]) {
        this.currentPalette = paletteName;
        this.colorScheme = this.colorPalettes[paletteName];
        window.hotspotColorScheme = this.colorScheme;
        this.styleManager.setColorScheme(this.colorScheme);
        this.refreshAllHotspotStyles();
      }
    };
    this.eventCoordinator = new EventCoordinator({
      isMobile: this.isMobile,
      isSafari: this.isSafari,
      clickTimeThreshold: this.clickTimeThreshold,
      clickDistThreshold: this.clickDistThreshold,
      mobileDragThreshold: this.mobileDragThreshold
    });
    window.eventCoordinator = this.eventCoordinator;
    this.eventCoordinator.setMode(this.modeStateManager.getCurrentMode());
    this.isDragging = false;
    this.dragStartTime = 0;
    this.dragStartPoint = null;
    this.mobileDragThreshold = this.isMobile ? 15 : 8;
    this.clickTimeThreshold = 300;
    this.clickDistThreshold = this.isMobile ? 12 : 8;
    this.activePointers = /* @__PURE__ */ new Map();
    this.primaryPointerId = null;
    this.lastPointerDownTime = 0;
    this.lastPointerDownPoint = null;
    this.isPinching = false;
    this.revealRenderer = new RevealRenderer({
      viewer: this.viewer,
      svg: null,
      // Will be set in init()
      isMobile: this.isMobile,
      debugMode: this.debugMode
    });
    this.engine = new RendererEngine({
      viewer: this.viewer,
      spatialIndex: this.spatialIndex,
      stateManager: this.stateManager,
      eventCoordinator: this.eventCoordinator,
      renderOptimizer: this.renderOptimizer,
      memoryManager: this.memoryManager,
      safariCompat: this.safariCompat,
      staticRenderer: this.staticRenderer,
      revealRenderer: this.revealRenderer,
      temporalRenderer: this.temporalRenderer,
      debugMode: this.debugMode,
      colorScheme: this.colorScheme,
      isMobile: this.isMobile,
      isSafari: this.isSafari,
      onHotspotClick: this.onHotspotClick,
      onHotspotHover: this.onHotspotHover
    });
    this.styleManager = new StyleManager({
      viewer: this.viewer,
      memoryManager: this.memoryManager,
      staticRenderer: this.staticRenderer,
      safariCompat: this.safariCompat,
      renderOptimizer: this.renderOptimizer,
      stateManager: this.stateManager,
      animationQueue: this.animationQueue,
      revealRenderer: this.revealRenderer,
      temporalRenderer: this.temporalRenderer,
      isSafari: this.isSafari,
      colorScheme: this.colorScheme,
      timingEasing: this.timingEasing,
      currentEasingName: this.currentEasingName,
      getAnimationDuration: (hotspotId) => this.getAnimationDuration(hotspotId)
    });
    this.initStyles();
    if (!options.skipInit) {
      this.init();
    }
  }
  initStyles() {
  }
  async init() {
    if (!this.viewer.world.getItemCount()) {
      this.viewer.addOnceHandler("open", () => this.init());
      return;
    }
    if (!document.getElementById("hotspot-animations-fix")) {
      const style = document.createElement("style");
      style.id = "hotspot-animations-fix";
      style.textContent = `
        .hotspot-hover path,
        .hotspot-selected path {
            animation-play-state: running !important;
        }
    `;
      document.head.appendChild(style);
    }
    if (!document.getElementById("reveal-mode-styles")) {
      const revealStyle = document.createElement("style");
      revealStyle.id = "reveal-mode-styles";
      revealStyle.textContent = `
        .reveal-mode-active .hotspot-wrapper {
            will-change: opacity, transform;
        }
        
        @keyframes revealPulse {
            0% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 0.3; transform: scale(1); }
        }
    `;
      document.head.appendChild(revealStyle);
    }
    if (!document.getElementById("pigment-liner-animations")) {
      const pigmentStyle = document.createElement("style");
      pigmentStyle.id = "pigment-liner-animations";
      pigmentStyle.textContent = `
        @keyframes organicBreathing {
            0% { 
                opacity: 0.98;
            }
            50% { 
                opacity: 1.0;
            }
            100% { 
                opacity: 0.98;
            }
        }
        
        /* Enhanced organic scintillation for selected states */
        @keyframes inkScintillation {
            0%, 90%, 100% { 
                opacity: 1.0;
            }
            95% { 
                opacity: 1.0;
            }
        }
    `;
      document.head.appendChild(pigmentStyle);
    }
    await this.engine.initialize();
    this.svg = this.engine.svg;
    this.defs = this.engine.defs;
    this.pathDefs = this.engine.pathDefs;
    this.maskCounter = this.engine.maskCounter;
    if (this.centralEventManager && this.svg) {
      this.centralEventManager.initialize(this.svg);
      console.log(
        "[PERF] CentralizedEventManager initialized - replaced 2400+ listeners with 1"
      );
      const stats = this.centralEventManager.getStats();
      console.log("[PERF] Event delegation stats:", stats);
    }
    const savedStyle = localStorage.getItem("revealStyle") || "invert";
    this.svg.classList.add(`reveal-style-${savedStyle}`);
    const existingStyles = document.querySelectorAll('style[data-animation-styles="reveal"]');
    existingStyles.forEach((style) => style.remove());
    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-animation-styles", "reveal");
    styleElement.textContent = `
    @keyframes revealWidth {
        from { width: 0%; }
        to { width: 110%; }
    }
`;
    document.head.appendChild(styleElement);
    await this.renderOptimizer.loadHotspotsInBatches(
      this.spatialIndex.getAllHotspots(),
      (hotspot) => this.createHotspotOverlay(hotspot)
    );
    this.activeHotspotManager.initialize(this.stateManager.getAllOverlays());
    if (this.engine.useHitDetectionCanvas) {
      await this.engine.initializeHitDetectionCanvas();
    }
    this.stateManager.getAllOverlays().forEach((overlay) => {
      this.safariCompat.optimizePathsForGPU(overlay);
    });
    this.safariCompat.optimizeLayers(this.stateManager.getAllOverlays());
    this.memoryManager.startCleanupCycle(
      this.animationQueue,
      () => this.stateManager.getAllOverlays()
    );
    this.setupMouseTracking();
    this.setupDragDetection();
    this.setupRevealMode();
    this.viewer.addHandler("zoom", () => {
      this.currentZoom = this.viewer.viewport.getZoom();
      const previousZoom = this.renderOptimizer.lastViewportZoom || 0;
      if (previousZoom <= 8 && this.currentZoom > 8 || previousZoom > 8 && this.currentZoom <= 8) {
        this.clearAnimationRegistryForZoomChange();
        if (previousZoom > 8 && this.currentZoom <= 8) {
          this.stateManager.getAllOverlays().forEach((overlay) => {
            this.resetStaticTransitions(overlay.element);
          });
        }
      }
      const currentHovered = this.stateManager.getHoveredHotspot();
      const currentSelected = this.stateManager.getSelectedHotspot();
      const crossingThreshold = previousZoom <= 8 && this.currentZoom > 8 || previousZoom > 8 && this.currentZoom <= 8;
      if (currentHovered) {
        const overlay = this.stateManager.getOverlay(currentHovered.id);
        if (overlay) {
          const currentState = overlay.element.getAttribute("data-current-state");
          const animationCompleted = overlay.element.getAttribute("data-animation-completed") === "true";
          if (currentState !== "hover" || crossingThreshold) {
            console.log(`[Zoom] Reapplying hover style:`, {
              hotspotId: currentHovered.id,
              currentState,
              animationCompleted,
              crossingThreshold,
              previousZoom: previousZoom.toFixed(2),
              currentZoom: this.currentZoom.toFixed(2)
            });
            this.applyStyle(overlay.element, currentHovered.type, "hover", {
              skipAnimation: animationCompleted
            });
          }
        }
      }
      if (currentSelected && currentSelected !== currentHovered) {
        const overlay = this.stateManager.getOverlay(currentSelected.id);
        if (overlay) {
          const currentState = overlay.element.getAttribute("data-current-state");
          overlay.element.getAttribute("data-animation-completed") === "true";
          if (currentState !== "selected" && crossingThreshold) {
            this.applyStyle(overlay.element, currentSelected.type, "selected", {
              skipAnimation: true
            });
          }
        }
      }
    });
    this.startVisibilityTracking();
    if (window.nativeHotspotRenderer && window.nativeHotspotRenderer.cleanup) {
      window.nativeHotspotRenderer.cleanup();
    }
    window.nativeHotspotRenderer = this;
    window.temporalDetectionEngine = this.temporalDetectionEngine;
  }
  // Expose resetAnimationState for CinematicZoomManager
  getResetAnimationState() {
    return () => this.resetAnimationState();
  }
  createHotspotOverlay(hotspot) {
    const result = this.engine.createHotspotOverlay(
      hotspot,
      (g, type, state) => this.applyStyle(g, type, state)
    );
    this.svg.appendChild(result.element);
    this.stateManager.addOverlay(hotspot.id, {
      element: result.element,
      hotspot,
      bounds: result.bounds,
      area: result.area,
      isVisible: false
    });
  }
  setupDragDetection() {
    this.viewer.addHandler("canvas-drag", () => {
      this.eventCoordinator.isDragging = true;
    });
    this.viewer.addHandler("canvas-drag-end", () => {
      this.eventCoordinator.resetDragState();
    });
    this.viewer.addHandler("pan", () => {
      this.eventCoordinator.isDragging = true;
    });
  }
  setupMouseTracking() {
    this.eventCoordinator.initialize(this.viewer.container, this.svg);
    this.eventCoordinator.on(this.eventCoordinator.eventTypes.MOUSE_MOVE, (data) => {
      window.lastKnownMouseX = data.x;
      window.lastKnownMouseY = data.y;
      if (this.eventCoordinator.isCurrentlyDragging() || this.temporalRenderer.isActive()) {
        this.svg.style.cursor = "default";
        return;
      }
      const rect = this.viewer.element.getBoundingClientRect();
      const pixelPoint = new OpenSeadragon.Point(data.x - rect.left, data.y - rect.top);
      const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
      const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
      const foundHotspot = this.engine.findSmallestHotspotAtPoint(imagePoint);
      const currentHovered = this.stateManager.getHoveredHotspot();
      if (this.isAutoDeselecting) {
        return;
      }
      if (data.forceHover && foundHotspot && foundHotspot === currentHovered) {
        const overlay = this.stateManager.getOverlay(foundHotspot.id);
        if (overlay) {
          const group = overlay.element;
          group.setAttribute("data-animation-active", "false");
          group.removeAttribute("data-animation-completed");
          group.removeAttribute("data-hover-preserved");
          const hoverId = `${foundHotspot.id}-hover`;
          this.memoryManager.clearAnimationEntry(hoverId);
          const currentState = group.getAttribute("data-current-state");
          if (currentState !== "hover") {
            this.applyStyle(overlay.element, foundHotspot.type, "hover");
          }
        }
      } else if (foundHotspot !== currentHovered) {
        if (currentHovered) {
          const prevOverlay = this.stateManager.getOverlay(currentHovered.id);
          if (prevOverlay) {
            const allPaths = prevOverlay.element.querySelectorAll("path");
            allPaths.forEach((path) => {
              if (path.currentAnimation) {
                path.currentAnimation.cancel();
                path.currentAnimation = null;
              }
              if (path.getAnimations) {
                path.getAnimations().forEach((animation) => animation.cancel());
              }
            });
            prevOverlay.element.removeAttribute("data-hover-preserved");
            prevOverlay.element.removeAttribute("data-hover-maintained");
            this.isLeavingHover = true;
            this.applyStyle(
              prevOverlay.element,
              currentHovered.type,
              currentHovered === this.stateManager.getSelectedHotspot() ? "selected" : "normal"
            );
            this.isLeavingHover = false;
          }
        }
        this.stateManager.setHoveredHotspot(foundHotspot);
        if (foundHotspot) {
          const overlay = this.stateManager.getOverlay(foundHotspot.id);
          if (overlay) {
            this.applyStyle(overlay.element, foundHotspot.type, "hover");
          }
        }
      }
      this.svg.style.cursor = foundHotspot ? "pointer" : "default";
    });
    this.safariCompat.setupIOSClickHandler(
      this.svg,
      (event) => {
        const rect = this.viewer.element.getBoundingClientRect();
        const pixelPoint = new OpenSeadragon.Point(
          event.clientX - rect.left,
          event.clientY - rect.top
        );
        const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
        const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
        return this.engine.findSmallestHotspotAtPoint(imagePoint);
      },
      (hotspot) => this.activateHotspot(hotspot)
    );
    this.setupPointerEvents();
  }
  setupPointerEvents() {
    this.eventCoordinator.on(this.eventCoordinator.eventTypes.CLICK, (data) => {
      console.log("EventCoordinator CLICK detected", data);
      if (data.event.target.closest(".openseadragon-controls")) {
        return;
      }
      const rect = this.viewer.element.getBoundingClientRect();
      const pixelPoint = new OpenSeadragon.Point(data.x - rect.left, data.y - rect.top);
      const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
      const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
      const clickedHotspot = this.engine.findSmallestHotspotAtPoint(imagePoint);
      if (clickedHotspot) {
        data.event.stopPropagation();
        data.event.preventDefault();
        const isMobileWithCanvas = this.isMobile && window.overlayManager && window.overlayManager.constructor.name === "Canvas2DOverlayManager";
        if (isMobileWithCanvas) {
          const overlay = this.stateManager.getOverlay(clickedHotspot.id);
          const isRevealed = overlay && overlay.element && overlay.element.getAttribute("data-hotspot-revealed") === "true";
          if (isRevealed) {
            console.log(
              "Revealed hotspot clicked, triggering cinematic zoom:",
              clickedHotspot.id
            );
            this.activateHotspot(clickedHotspot);
          } else {
            console.log(
              "Non-revealed hotspot clicked, triggering echo reveal:",
              clickedHotspot.id
            );
            this.viewer.element.getBoundingClientRect();
            const tapData = {
              x: data.event.clientX,
              y: data.event.clientY,
              viewportX: data.x,
              viewportY: data.y
            };
            if (window.temporalEchoController && window.temporalEchoController.handleQuickTap) {
              window.temporalEchoController.handleQuickTap(tapData);
            }
          }
        } else {
          this.activateHotspot(clickedHotspot);
        }
      } else if (this.stateManager.getSelectedHotspot()) {
        this.deselectHotspot();
        if (this.onHotspotClick) {
          this.onHotspotClick(null);
        }
      }
    });
    this.eventCoordinator.on(this.eventCoordinator.eventTypes.DRAG_START, () => {
      const currentHovered = this.stateManager.getHoveredHotspot();
      if (currentHovered) {
        const overlay = this.stateManager.getOverlay(currentHovered.id);
        if (overlay) {
          this.applyStyle(
            overlay.element,
            currentHovered.type,
            currentHovered === this.stateManager.getSelectedHotspot() ? "selected" : "normal"
          );
        }
        this.stateManager.setHoveredHotspot(null);
      }
    });
  }
  handleClick(event) {
    var _a, _b, _c, _d, _e, _f, _g;
    const timeSinceDrag = ((_a = this.eventCoordinator) == null ? void 0 : _a.lastDragEndTime) ? Date.now() - this.eventCoordinator.lastDragEndTime : Infinity;
    console.log("handleClick called", {
      isDragging: this.isDragging,
      isPinching: this.isPinching,
      activePointers: this.activePointers.size,
      timeSinceDrag,
      targetTag: ((_b = event.target) == null ? void 0 : _b.tagName) || "unknown",
      targetClass: ((_d = (_c = event.target) == null ? void 0 : _c.className) == null ? void 0 : _d.baseVal) || ((_e = event.target) == null ? void 0 : _e.className) || "unknown",
      timestamp: Date.now()
    });
    if ((_g = (_f = event.target) == null ? void 0 : _f.closest) == null ? void 0 : _g.call(_f, ".openseadragon-controls")) {
      return;
    }
    if (timeSinceDrag < 500) {
      console.log(`⚠️ Blocking click - only ${timeSinceDrag}ms since drag ended`);
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }
      return;
    }
    const hasValidCoords = event && typeof event.clientX === "number" && typeof event.clientY === "number";
    const currentHovered = this.stateManager.getHoveredHotspot();
    if ((this.isMobile || !hasValidCoords) && currentHovered) {
      console.log("[NativeHotspotRenderer] Using cached hover hotspot", {
        reason: !hasValidCoords ? "invalid_coords" : "mobile_optimization",
        hotspotId: currentHovered
      });
      if (event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      this.activateHotspot(currentHovered);
      return;
    }
    if (!hasValidCoords) {
      console.warn("[NativeHotspotRenderer] Invalid coords and no cached hotspot", {
        hasEvent: !!event,
        clientX: event == null ? void 0 : event.clientX,
        clientY: event == null ? void 0 : event.clientY,
        eventType: event == null ? void 0 : event.type,
        cachedHovered: currentHovered
      });
      return;
    }
    const rect = this.viewer.element.getBoundingClientRect();
    const pixelPoint = new OpenSeadragon.Point(
      event.clientX - rect.left,
      event.clientY - rect.top
    );
    if (!Number.isFinite(pixelPoint.x) || !Number.isFinite(pixelPoint.y)) {
      console.warn("[NativeHotspotRenderer] Invalid pixel point calculated", {
        pixelPoint,
        clientX: event.clientX,
        clientY: event.clientY,
        rectLeft: rect.left,
        rectTop: rect.top
      });
      return;
    }
    const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
    const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
    if (!Number.isFinite(imagePoint.x) || !Number.isFinite(imagePoint.y)) {
      console.warn("[NativeHotspotRenderer] Invalid image point calculated", {
        imagePoint,
        viewportPoint,
        pixelPoint
      });
      return;
    }
    const clickedHotspot = this.engine.findSmallestHotspotAtPoint(imagePoint);
    if (clickedHotspot) {
      event.stopPropagation();
      event.preventDefault();
      this.activateHotspot(clickedHotspot);
    } else {
      if (this.stateManager.getSelectedHotspot()) {
        this.deselectHotspot();
        if (this.onHotspotClick) {
          this.onHotspotClick(null);
        }
      }
    }
  }
  /**
   * Activate a hotspot (common method for touch and click)
   */
  activateHotspot(hotspot, forceActivation = false) {
    if (!forceActivation) {
      if (this.eventCoordinator && this.eventCoordinator.isDragging) {
        console.log("⚠️ Blocking hotspot activation during drag");
        return;
      }
      if (this.eventCoordinator && this.eventCoordinator.lastDragEndTime) {
        const timeSinceDrag = Date.now() - this.eventCoordinator.lastDragEndTime;
        const dragBlockThreshold = this.isMobile ? 100 : 300;
        if (timeSinceDrag < dragBlockThreshold) {
          console.log(
            `⚠️ Blocking hotspot activation - only ${timeSinceDrag}ms since drag ended (threshold: ${dragBlockThreshold}ms)`
          );
          return;
        }
      }
    } else {
      console.log("🎯 Force activation enabled - bypassing drag checks");
    }
    console.log("🎯 iOS DEBUG: activateHotspot called:", {
      hotspotId: hotspot.id,
      timestamp: Date.now(),
      isSafari: this.isSafari,
      isMobile: this.isMobile
    });
    if (this.eventCoordinator) {
      console.log("🔄 Resetting drag state when activating hotspot");
      this.eventCoordinator.resetDragState();
      this.eventCoordinator.forceReactivateMouseTracking();
    }
    const previouslySelected = this.stateManager.getSelectedHotspot();
    if (previouslySelected && previouslySelected.id !== hotspot.id) {
      console.log("🔄 Clearing previous selection:", previouslySelected.id);
      const previousOverlay = this.stateManager.getOverlay(previouslySelected.id);
      if (previousOverlay) {
        this.applyStyle(previousOverlay.element, previouslySelected.type, "normal");
      }
    }
    this.stateManager.setSelectedHotspot(hotspot);
    if (this.engine.lodManager) {
      this.engine.lodManager.recordInteraction(hotspot.id);
    }
    const selectedOverlay = this.stateManager.getOverlay(hotspot.id);
    if (selectedOverlay) {
      console.log("🎯 Applying selected state BEFORE onHotspotClick for:", hotspot.id);
      this.applyStyle(selectedOverlay.element, hotspot.type, "selected");
    }
    this.onHotspotClick(hotspot);
    this.stateManager.getAllOverlays().forEach((overlay, id) => {
      var _a;
      if (id === hotspot.id) return;
      const state = id === ((_a = this.stateManager.getHoveredHotspot()) == null ? void 0 : _a.id) ? "hover" : "normal";
      if (id === hotspot.id) {
        const currentZoom = this.viewer.viewport.getZoom();
        console.log("🎯 iOS DEBUG: Applying selected style to:", id);
        console.log("🎯 Current zoom level:", currentZoom.toFixed(2));
        console.log("🎯 Is in static mode (>8.0)?", currentZoom > 8);
        const currentState = overlay.element.getAttribute("data-current-state");
        const animationCompleted = overlay.element.getAttribute("data-animation-completed") === "true";
        console.log("🎯 Transition to selected:", { currentState, animationCompleted });
      }
      this.applyStyle(overlay.element, overlay.hotspot.type, state);
    });
  }
  /**
   * Deselect current hotspot
   */
  deselectHotspot() {
    var _a, _b;
    const previousSelected = this.stateManager.getSelectedHotspot();
    console.log("🎯 [DESELECT] deselectHotspot called", {
      previousSelected: (previousSelected == null ? void 0 : previousSelected.id) || "none"
    });
    this.stateManager.setSelectedHotspot(null);
    const allHotspotGroups = document.querySelectorAll(
      'g[data-canvas2d-selected="true"], g[style*="display: none"]'
    );
    allHotspotGroups.forEach((group) => {
      if (this.styleManager && this.styleManager.ensureHotspotVisibility) {
        this.styleManager.ensureHotspotVisibility(group);
      } else {
        group.removeAttribute("data-canvas2d-selected");
        if (group.style.display === "none") {
          group.style.display = "";
        }
      }
    });
    this.stateManager.getAllOverlays().forEach((overlay, id) => {
      var _a2;
      const state = id === ((_a2 = this.stateManager.getHoveredHotspot()) == null ? void 0 : _a2.id) ? "hover" : "normal";
      this.applyStyle(overlay.element, overlay.hotspot.type, state);
    });
    console.log("✅ [DESELECT] deselectHotspot complete", {
      selectedAfter: ((_a = this.stateManager.getSelectedHotspot()) == null ? void 0 : _a.id) || "none",
      hoveredAfter: ((_b = this.stateManager.getHoveredHotspot()) == null ? void 0 : _b.id) || "none"
    });
  }
  /**
   * Force complete reset of all hotspots to normal state
   * Used to ensure complete cleanup when deselecting
   */
  forceCompleteReset() {
    var _a;
    const selectedBefore = this.stateManager.getSelectedHotspot();
    console.log("🔧 [DESELECT] Forcing complete reset", {
      previousSelected: (selectedBefore == null ? void 0 : selectedBefore.id) || "none",
      totalHotspots: this.stateManager.getAllOverlays().size
    });
    this.stateManager.setSelectedHotspot(null);
    let resetCount = 0;
    let visibleCount = 0;
    this.stateManager.getAllOverlays().forEach((overlay, id) => {
      const element = overlay.element;
      if (!element) return;
      const mainPath = element.querySelector(".main-path");
      const currentOpacity = mainPath ? window.getComputedStyle(mainPath).opacity : "0";
      if (currentOpacity !== "0" && currentOpacity !== 0) {
        visibleCount++;
      }
      if (this.styleManager) {
        this.styleManager.resetToNormalState(element);
      } else {
        this.applyStyle(element, overlay.hotspot.type, "normal");
      }
      element.removeAttribute("data-maintain-visual");
      element.removeAttribute("data-hover-maintained");
      element.removeAttribute("data-hover-preserved");
      element.removeAttribute("data-was-selected");
      element.setAttribute("data-animation-active", "false");
      element.setAttribute("data-animation-completed", "false");
      element.setAttribute("data-current-state", "normal");
      resetCount++;
    });
    if (this.memoryManager) {
      this.stateManager.getAllOverlays().forEach((overlay, id) => {
        this.memoryManager.clearAnimationEntry(`${id}_hover`);
        this.memoryManager.clearAnimationEntry(`${id}_selected`);
      });
    }
    this.isAutoDeselecting = false;
    console.log(`✅ [DESELECT] Reset complete`, {
      resetCount,
      visibleBeforeReset: visibleCount,
      selectedAfter: ((_a = this.stateManager.getSelectedHotspot()) == null ? void 0 : _a.id) || "none"
    });
  }
  /**
   * Reset animation state after cinematic zoom
   * Clears animation registry to allow hover animations to replay
   */
  resetAnimationState() {
    console.log("🔄 Resetting animation state after cinematic zoom");
    this.memoryManager.clearAllAnimations();
    this.stateManager.getAllOverlays().forEach((overlay) => {
      var _a;
      const group = overlay.element;
      if (group) {
        group.setAttribute("data-animation-active", "false");
        group.removeAttribute("data-current-state");
        group.removeAttribute("data-animation-completed");
        const paths = group.getElementsByTagName("path");
        for (let path of paths) {
          if (path.currentAnimation) {
            path.currentAnimation.cancel();
            path.currentAnimation = null;
          }
          (_a = path.getAnimations) == null ? void 0 : _a.call(path).forEach((animation) => animation.cancel());
        }
      }
    });
    this.stateManager.getHoveredHotspot();
    this.stateManager.setHoveredHotspot(null);
    setTimeout(() => {
      if (window.lastKnownMouseX !== void 0 && window.lastKnownMouseY !== void 0) {
        console.log("🔄 Re-evaluating mouse position after zoom");
        const rect = this.viewer.element.getBoundingClientRect();
        const pixelPoint = new OpenSeadragon.Point(
          window.lastKnownMouseX - rect.left,
          window.lastKnownMouseY - rect.top
        );
        const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
        const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
        const foundHotspot = this.engine.findSmallestHotspotAtPoint(imagePoint);
        if (foundHotspot) {
          console.log("🎯 Found hotspot under cursor:", foundHotspot.id);
          this.stateManager.setHoveredHotspot(foundHotspot);
          const overlay = this.stateManager.getOverlay(foundHotspot.id);
          if (overlay) {
            console.log("🎨 Applying hover animation to:", foundHotspot.id);
            this.applyStyle(overlay.element, foundHotspot.type, "hover");
          }
        }
      }
    }, 100);
    console.log("✅ Animation state reset complete");
  }
  /**
   * Instantly deselect without transitions (for synchronized auto-deselect)
   */
  /**
   * Instantly deselect without transitions (for synchronized auto-deselect)
   * @param {boolean} isFromHoverExit - True if called from leaving hover, false for real deselection
   */
  instantDeselect(isFromHoverExit = false) {
    const currentSelected = this.stateManager.getSelectedHotspot();
    if (!currentSelected) {
      return;
    }
    console.log("🎯 [DESELECT] instantDeselect called", {
      isFromHoverExit,
      isMobile: this.isMobile,
      currentSelected: (currentSelected == null ? void 0 : currentSelected.id) || "none"
    });
    if (this.isMobile) {
      console.log("📱 [DESELECT] Mobile detected - resetting selected hotspot");
      const selectedOverlay = this.stateManager.getOverlay(currentSelected.id);
      if (selectedOverlay && selectedOverlay.element) {
        const mainPathBefore = selectedOverlay.element.querySelector(".main-path");
        const opacityBefore = mainPathBefore ? window.getComputedStyle(mainPathBefore).opacity : "N/A";
        if (this.styleManager) {
          this.styleManager.resetToNormalState(selectedOverlay.element);
        } else {
          this.applyStyle(selectedOverlay.element, currentSelected.type, "normal");
        }
        const opacityAfter = mainPathBefore ? window.getComputedStyle(mainPathBefore).opacity : "N/A";
        console.log("📊 [DESELECT] Mobile hotspot reset result", {
          hotspotId: currentSelected.id,
          opacityBefore,
          opacityAfter,
          stateAfter: selectedOverlay.element.getAttribute("data-current-state")
        });
      }
      this.stateManager.setSelectedHotspot(null);
      this.isAutoDeselecting = false;
      console.log("✅ [DESELECT] Mobile deselect complete");
      return;
    }
    this.isAutoDeselecting = true;
    const currentHovered = this.stateManager.getHoveredHotspot();
    if (this.svg) {
      const allHotspots = this.svg.querySelectorAll("g[data-hotspot-id]");
      allHotspots.forEach((hotspotGroup) => {
        const hotspotId = hotspotGroup.getAttribute("data-hotspot-id");
        const currentState = hotspotGroup.getAttribute("data-current-state");
        if (currentSelected && hotspotId === currentSelected.id) {
          return;
        }
        if (currentHovered && hotspotId === currentHovered.id) {
          return;
        }
        const mainPath = hotspotGroup.querySelector(".main-path");
        const hasVisibleBorder = mainPath && (mainPath.style.opacity !== "0" && mainPath.style.opacity !== "" || mainPath.style.strokeDasharray === "none" || mainPath.style.strokeDasharray === "100 0" || // Improved Safari detection: check animation-completed attribute and glow layers presence
        this.isSafari && (hotspotGroup.getAttribute("data-animation-completed") === "true" || hotspotGroup.querySelector(
          ".glow-layer-1, .glow-layer-2, .glow-layer-3"
        ) !== null));
        let shouldReset = false;
        if (this.isSafari) {
          if (this.isLeavingHover) {
            shouldReset = currentState === "hover" && hotspotId !== this.recentlyAutoDeselected;
          } else {
            shouldReset = currentState === "hover" || currentState === "selected";
          }
        } else {
          shouldReset = hasVisibleBorder || currentState === "hover" || currentState === "selected";
        }
        if (shouldReset) {
          console.log(
            `Resetting hotspot ${hotspotId} to normal state (visible=${hasVisibleBorder}, state=${currentState})`
          );
          const overlayData = this.stateManager.getOverlay(hotspotId);
          if (overlayData && overlayData.hotspot) {
            this.applyStyle(hotspotGroup, overlayData.hotspot.type, "normal");
            if (this.isSafari && !this.isLeavingHover) {
              hotspotGroup.removeAttribute("data-animation-completed");
              hotspotGroup.setAttribute("data-animation-active", "false");
            }
          }
        }
      });
    }
    if (currentSelected) {
      const overlay = this.stateManager.getOverlay(currentSelected.id);
      if (overlay && overlay.element) {
        console.log("🔄 Auto-deselecting current hotspot, transitioning to normal state");
        this.applyStyle(overlay.element, currentSelected.type, "normal");
        overlay.element.setAttribute("data-animation-active", "false");
        const selectedId = currentSelected.id;
        this.memoryManager.clearAnimationEntry(`${selectedId}-selected`);
        this.memoryManager.clearAnimationEntry(`${selectedId}-hover`);
      }
    }
    this.stateManager.setSelectedHotspot(null);
    this.isAutoDeselecting = false;
    if (this.eventCoordinator) {
      console.log("🔄 Resetting drag state after auto-deselect");
      this.eventCoordinator.resetDragState();
    }
    setTimeout(() => {
      var _a;
      console.log("🔓 Auto-deselect timeout reached, clearing flags");
      console.log("  - recentlyAutoDeselected:", this.recentlyAutoDeselected);
      console.log("  - currentHovered:", (_a = this.stateManager.getHoveredHotspot()) == null ? void 0 : _a.id);
      if (this.recentlyAutoDeselected) {
        const overlay = this.stateManager.getOverlay(this.recentlyAutoDeselected);
        if (overlay && overlay.element) {
          overlay.element.removeAttribute("data-maintain-visual");
        }
      }
      console.log("Auto-deselect completed, animations can resume");
    }, 500);
  }
  /**
   * Ray casting algorithm for precise point-in-polygon detection
   */
  // STEP 4 OPTIMIZATION: Completely rewritten applyStyle for faster animations
  applyStyle(group, type, state, options = {}) {
    const hotspotId = group.getAttribute("data-hotspot-id");
    if (state === "hover" && hotspotId !== this.recentlyAutoDeselected && this.recentlyAutoDeselected) {
      this.recentlyAutoDeselected = null;
      if (this._recentlyAutoDeselectedClearTimeout) {
        clearTimeout(this._recentlyAutoDeselectedClearTimeout);
        this._recentlyAutoDeselectedClearTimeout = null;
      }
    }
    if (state === "hover" && hotspotId === this.recentlyAutoDeselected && !this.isAutoDeselecting) {
      console.log(
        "⛔ Blocking hover animation on recently auto-deselected hotspot:",
        hotspotId
      );
      if (!this._recentlyAutoDeselectedClearTimeout) {
        this._recentlyAutoDeselectedClearTimeout = setTimeout(() => {
          console.log(
            "🗳️ Clearing recentlyAutoDeselected flag for:",
            this.recentlyAutoDeselected
          );
          this.recentlyAutoDeselected = null;
          this._recentlyAutoDeselectedClearTimeout = null;
        }, 1e3);
      }
      return;
    }
    this.styleManager.applyStyle(group, type, state, options);
  }
  /**
   * Maintain hover visual state without animation
   * Used after auto-deselect to keep hover visible
   */
  maintainHoverVisual(hotspot) {
    var _a;
    const overlay = this.stateManager.getOverlay(hotspot.id);
    if (overlay && overlay.element) {
      const group = overlay.element;
      const mainPath = group.querySelector(".main-path");
      console.log("🎨 Maintaining hover visual for hotspot:", hotspot.id);
      if (mainPath) {
        mainPath.style.strokeDasharray = "none";
        mainPath.style.strokeDashoffset = "0";
        mainPath.style.opacity = "1.0";
        mainPath.style.stroke = this.styleManager.colorScheme.main;
        mainPath.style.strokeWidth = "3px";
        const overlayManager = window.overlayManager || ((_a = this.viewer) == null ? void 0 : _a.overlayManager);
        const isCanvas2D = overlayManager && overlayManager.constructor.name === "Canvas2DOverlayManager";
        if (!isCanvas2D) {
          mainPath.style.filter = `
                        blur(0.05px) 
                        contrast(1.45) 
                        drop-shadow(0 0 5px rgba(11, 18, 21, 0.75))
                        drop-shadow(0 0 12px rgba(11, 18, 21, 0.55))
                        drop-shadow(0 0 20px rgba(255, 255, 255, 0.35))
                        drop-shadow(0 0 35px rgba(255, 255, 255, 0.25))
                        drop-shadow(1px 2px 6px rgba(11, 18, 21, 0.45))
                    `;
        }
        group.setAttribute("data-current-state", "hover");
        group.setAttribute("data-hover-maintained", "true");
        group.setAttribute("data-hover-preserved", "true");
        group.setAttribute("data-animation-completed", "true");
        group.setAttribute("data-animation-active", "false");
        group.style.opacity = "1";
        if (!isCanvas2D) {
          mainPath.style.boxShadow = `
                        0 0 15px rgba(11, 18, 21, 0.8),
                        0 0 30px rgba(255, 255, 255, 0.25),
                        0 0 45px rgba(255, 255, 255, 0.2),
                        0 0 22.5px rgba(11, 18, 21, 0.6),
                        inset 0 0 3px rgba(11, 18, 21, 0.15)
                    `;
        }
        this.memoryManager.registerAnimation(`${hotspot.id}-hover`);
        console.log(
          "🏁 Added hover maintenance flags and registered animation as completed for hotspot:",
          hotspot.id
        );
      }
    }
  }
  /**
   * Reset transition styles when exiting static mode
   * Ensures animations can play again properly
   */
  resetStaticTransitions(group) {
    this.staticRenderer.resetTransitions(group);
  }
  /**
   * Clear all animation registry entries when crossing zoom threshold
   * This prevents stale entries from blocking future animations
   */
  clearAnimationRegistryForZoomChange() {
    const preserveStates = /* @__PURE__ */ new Set();
    const currentHovered = this.stateManager.getHoveredHotspot();
    const currentSelected = this.stateManager.getSelectedHotspot();
    if (currentHovered) {
      preserveStates.add(`${currentHovered.id}-hover`);
    }
    if (currentSelected) {
      preserveStates.add(`${currentSelected.id}-selected`);
    }
    this.memoryManager.clearRegistryExcept(preserveStates);
  }
  /**
   * 🔧 MOBILE OPTIMIZATION: Hide overlay during cinematic zoom for performance
   */
  hideOverlay() {
    if (this.svg) {
      this.svg.style.opacity = "0";
      this.svg.style.visibility = "hidden";
      this.svg.style.pointerEvents = "none";
    }
  }
  /**
   * 🔧 MOBILE OPTIMIZATION: Show overlay after cinematic zoom
   */
  showOverlay() {
    if (this.svg) {
      this.svg.style.opacity = "1";
      this.svg.style.visibility = "visible";
      this.svg.style.pointerEvents = "auto";
    }
  }
  /**
   * 🔧 CINEMATIC ZOOM: Pause hotspot updates during animations
   */
  pauseUpdates() {
    console.log("🔧 NativeHotspotRenderer: pauseUpdates called");
    this.renderOptimizer.pauseUpdates();
  }
  /**
   * 🔧 CINEMATIC ZOOM: Resume hotspot updates after animations
   */
  resumeUpdates() {
    console.log("🔧 NativeHotspotRenderer: resumeUpdates called");
    const needsUpdate = this.renderOptimizer.resumeUpdates();
    console.log("🔧 NativeHotspotRenderer: Updates resumed after cinematic zoom");
    if (needsUpdate) {
      setTimeout(() => this.updateVisibility(), 50);
    }
    setTimeout(() => {
      if (this.viewer && this.viewer.tracking) {
        console.log("🔄 Re-enabling viewer mouse tracking");
        this.viewer.setMouseNavEnabled(true);
        if (this.eventCoordinator && this.eventCoordinator.forceReactivateMouseTracking) {
          this.eventCoordinator.forceReactivateMouseTracking();
        }
        if (this.svg && window.lastKnownMouseX !== void 0) {
          const mouseEvent = new MouseEvent("mousemove", {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: window.lastKnownMouseX,
            clientY: window.lastKnownMouseY
          });
          console.log("🔄 Dispatching synthetic mousemove to SVG");
          this.svg.dispatchEvent(mouseEvent);
        }
      }
    }, 200);
  }
  refreshAllHotspotStyles() {
    console.log("Refreshing all hotspot styles with palette:", this.currentPalette);
    this.stateManager.getAllOverlays().forEach((overlay, id) => {
      if (overlay.isVisible) {
        const currentSelected = this.stateManager.getSelectedHotspot();
        const currentHovered = this.stateManager.getHoveredHotspot();
        const state = id === (currentSelected == null ? void 0 : currentSelected.id) ? "selected" : id === (currentHovered == null ? void 0 : currentHovered.id) ? "hover" : "normal";
        if (state !== "normal") {
          this.applyStyle(overlay.element, overlay.hotspot.type, "normal");
          setTimeout(() => {
            this.applyStyle(overlay.element, overlay.hotspot.type, state);
          }, 50);
        }
      }
    });
    this.updateFilterColors();
    this.updateWrapperStyles();
  }
  updateWrapperStyles() {
    if (!this.isSafari) return;
  }
  updateFilterColors() {
    const selectedInnerColor = this.svg.querySelector(
      '#hotspot-glow-selected feFlood[result="innerColor"]'
    );
    const selectedOuterColor = this.svg.querySelector(
      '#hotspot-glow-selected feFlood[result="outerColor"]'
    );
    const selectedMidColor = this.svg.querySelector(
      '#hotspot-glow-selected feFlood[result="midColor"]'
    );
    const hoverInnerColor = this.svg.querySelector(
      '#hotspot-glow-hover feFlood[result="innerColor"]'
    );
    const hoverOuterColor = this.svg.querySelector(
      '#hotspot-glow-hover feFlood[result="outerColor"]'
    );
    if (selectedInnerColor) {
      selectedInnerColor.setAttribute("flood-color", this.colorScheme.glow || "#87CEEB");
    }
    if (selectedOuterColor) {
      selectedOuterColor.setAttribute("flood-color", this.colorScheme.glow2 || "#4682B4");
    }
    if (selectedMidColor) {
      selectedMidColor.setAttribute("flood-color", this.colorScheme.main || "#4682B4");
    }
    if (hoverInnerColor) {
      hoverInnerColor.setAttribute("flood-color", this.colorScheme.glow || "#87CEEB");
    }
    if (hoverOuterColor) {
      hoverOuterColor.setAttribute("flood-color", this.colorScheme.main || "#4682B4");
    }
  }
  /**
   * Get hotspot bounds for a specific hotspot
   */
  getHotspotBounds(hotspot) {
    const overlay = this.stateManager.getOverlay(hotspot.id);
    if (overlay && overlay.bounds) {
      return overlay.bounds;
    }
    return calculateBounds(hotspot.coordinates);
  }
  /**
   * Calculate approximate area of hotspot using bounding box
   * For performance, we use bounding box area instead of exact polygon area
   */
  // STEP 4 OPTIMIZATION: Adaptive animation duration with inverse zoom relationship
  getAnimationDuration(hotspotId) {
    var _a, _b, _c;
    console.log("[NativeHotspotRenderer] getAnimationDuration called for:", hotspotId);
    const isOrganicEasing = this.currentEasingName && this.currentEasingName.toLowerCase().includes("organic");
    let pathComplexityMultiplier = 1;
    if (hotspotId && this.stateManager) {
      const overlay = this.stateManager.getOverlay(hotspotId);
      if (overlay && overlay.element) {
        const path = overlay.element.querySelector("path");
        if (path) {
          try {
            const pathLength = path.getTotalLength();
            pathComplexityMultiplier = Math.min(Math.max(pathLength / 400, 0.8), 1.5);
          } catch (e) {
          }
        }
      }
    }
    const currentZoom = ((_b = (_a = this.viewer) == null ? void 0 : _a.viewport) == null ? void 0 : _b.getZoom()) || 1;
    const maxZoom = 10;
    const zoomPercent = currentZoom / maxZoom * 100;
    let baseDuration;
    let mode;
    if (zoomPercent < 50) {
      baseDuration = isOrganicEasing ? 0.8 : 0.6;
      mode = "exploration";
    } else if (zoomPercent < 200) {
      baseDuration = isOrganicEasing ? 1.2 : 0.9;
      mode = "navigation";
    } else {
      baseDuration = isOrganicEasing ? 1.8 : 1.2;
      mode = "detail";
    }
    const smoothstep = (edge0, edge1, x) => {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };
    let transitionMultiplier = 1;
    if (zoomPercent >= 40 && zoomPercent <= 60) {
      transitionMultiplier = 1 + smoothstep(40, 60, zoomPercent) * 0.2;
    } else if (zoomPercent >= 180 && zoomPercent <= 220) {
      transitionMultiplier = 1 + smoothstep(180, 220, zoomPercent) * 0.2;
    }
    const visibleHotspots = ((_c = this.stateManager) == null ? void 0 : _c.getVisibleCount()) || 0;
    const densityFactor = Math.max(0.7, 1 - visibleHotspots / 200 * 0.3);
    const speedMultiplier = window.animationSpeedMultiplier || 1;
    const finalDuration = baseDuration * transitionMultiplier * pathComplexityMultiplier * densityFactor * speedMultiplier;
    const clampedDuration = Math.max(0.4, Math.min(5, finalDuration));
    {
      console.log(
        `[Animation Duration] Mode: ${mode}, Zoom: ${zoomPercent.toFixed(0)}%, Duration: ${(clampedDuration * 1e3).toFixed(0)}ms, Base: ${(baseDuration * 1e3).toFixed(0)}ms`
      );
    }
    return clampedDuration;
  }
  /**
   * Calculate glow intensity based on zoom level
   * Returns opacity value between 0.3 and 1 (never fully transparent)
   */
  calculateGlowIntensity() {
    return 1;
  }
  /**
   * Optimize stroke animations for Safari/iOS
   */
  optimizeForSafari() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      this.stateManager.getAllOverlays().forEach((overlay) => {
        const paths = overlay.element.getElementsByTagName("path");
        for (let path of paths) {
          path.style.transform = "translateZ(0)";
          path.style.webkitBackfaceVisibility = "hidden";
        }
      });
    }
  }
  startVisibilityTracking() {
    this.renderOptimizer.setupVisibilityTracking(() => this.updateVisibility());
  }
  /**
   * ÉTAPE 3: Updated updateVisibility() with Level of Detail (LOD) system
   * Reduces visible hotspots from 469 to ~150 intelligently
   */
  updateVisibility() {
    if (this.renderOptimizer.areUpdatesPaused()) {
      this.renderOptimizer.setPendingUpdate();
      return;
    }
    if (this.interactionThrottler && this.interactionThrottler.shouldSkipFrame()) {
      this.renderOptimizer.setPendingUpdate();
      return;
    }
    const currentZoom = this.viewer.viewport.getZoom();
    const targetZoom = this.viewer.viewport.zoomSpring.target.value;
    const isZooming = Math.abs(currentZoom - targetZoom) > 1e-3;
    if (isZooming) {
      this.renderOptimizer.setPendingUpdate();
      return;
    }
    if (this.viewer.isAnimating()) {
      this.renderOptimizer.setPendingUpdate();
      return;
    }
    const bounds = this.viewer.viewport.getBounds();
    if (!this.renderOptimizer.hasViewportChangedSignificantly(bounds, currentZoom)) {
      return;
    }
    this.renderOptimizer.updateViewportTracking(bounds, currentZoom);
    if (this.engine.eventCoordinator) {
      this.engine.eventCoordinator.updateHoverDelayForZoom(currentZoom);
    }
    const viewport = this.viewer.viewport;
    const currentZoomLevel = viewport.getZoom();
    if (this.engine.lodManager && window.performanceMonitor) {
      const currentFPS = window.performanceMonitor.currentFPS;
      const memoryUsage = window.performanceMonitor.memoryUsage || 0;
      this.engine.lodManager.updatePerformanceMode(currentFPS, memoryUsage);
    }
    if (currentZoomLevel < 1.5) {
      const currentSelected2 = this.stateManager.getSelectedHotspot();
      const currentHovered2 = this.stateManager.getHoveredHotspot();
      const selectedId = currentSelected2 == null ? void 0 : currentSelected2.id;
      const hoveredId = currentHovered2 == null ? void 0 : currentHovered2.id;
      const activeIds = [];
      if (selectedId) activeIds.push(selectedId);
      if (hoveredId && hoveredId !== selectedId) activeIds.push(hoveredId);
      this.activeHotspotManager.updateActiveSet(activeIds);
      const visibilityUpdates2 = activeIds.map((id) => ({
        id,
        isVisible: true
      }));
      if (visibilityUpdates2.length > 0) {
        this.stateManager.batchUpdateVisibility(visibilityUpdates2);
      }
      return;
    }
    const allHotspots = Array.from(this.stateManager.getAllOverlays().values()).map(
      (overlay) => ({
        ...overlay.hotspot,
        overlay
      })
    );
    const selectedHotspot = this.stateManager.getSelectedHotspot();
    const isSpotlightMode = !!selectedHotspot;
    let selectedHotspots;
    if (isSpotlightMode) {
      console.log("🎯 Spotlight mode active - overriding LOD to show nearby hotspots");
      const selectedOverlay = this.stateManager.getOverlay(selectedHotspot.id);
      if (selectedOverlay) {
        const selectedBounds = selectedOverlay.bounds;
        const selectedCenterX = (selectedBounds.left + selectedBounds.right) / 2;
        const selectedCenterY = (selectedBounds.top + selectedBounds.bottom) / 2;
        const nearbyHotspots = allHotspots.filter((h) => {
          if (h.id === selectedHotspot.id) return true;
          const bounds2 = h.overlay.bounds;
          const centerX = (bounds2.left + bounds2.right) / 2;
          const centerY = (bounds2.top + bounds2.bottom) / 2;
          const dx = centerX - selectedCenterX;
          const dy = centerY - selectedCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const zoomFactor = Math.max(1, currentZoomLevel);
          const maxDistance = 2e3 / zoomFactor;
          return distance < maxDistance;
        }).slice(0, 50);
        selectedHotspots = nearbyHotspots;
        console.log(
          `🎯 Spotlight mode: showing ${nearbyHotspots.length} nearby hotspots for hover interaction`
        );
      } else {
        selectedHotspots = this.engine.lodManager.selectVisibleHotspots(
          allHotspots,
          viewport,
          currentZoomLevel,
          selectedHotspot,
          this.stateManager.getHoveredHotspot()
        );
      }
    } else {
      selectedHotspots = this.engine.lodManager.selectVisibleHotspots(
        allHotspots,
        viewport,
        currentZoomLevel,
        this.stateManager.getSelectedHotspot(),
        this.stateManager.getHoveredHotspot()
      );
    }
    console.log(
      `[NativeHotspotRenderer] Active: ${selectedHotspots.length} | Total: ${allHotspots.length} | Zoom: ${currentZoomLevel.toFixed(2)} | Spotlight: ${isSpotlightMode}`
    );
    const selectedIds = selectedHotspots.map((h) => h.id);
    this.activeHotspotManager.updateActiveSet(selectedIds);
    const activeHotspots = this.activeHotspotManager.getActiveHotspots();
    const visibilityUpdates = [];
    activeHotspots.forEach((data, id) => {
      visibilityUpdates.push({
        id,
        isVisible: true
      });
    });
    if (visibilityUpdates.length > 0) {
      this.stateManager.batchUpdateVisibility(visibilityUpdates);
    }
    this.asyncHitDetector.updateVisibleHotspots(activeHotspots);
    if (this.revealRenderer.isActive()) {
      this.revealRenderer.updateVisibility(activeHotspots);
    }
    const visibleCount = activeHotspots.size;
    if (Math.abs(currentZoom - this.renderOptimizer.lastViewportZoom) > 0.5) {
      requestAnimationFrame(() => {
        if (this.viewer.world.getItemCount() > 0) {
          this.viewer.updateOverlay(this.svg);
        }
      });
    }
    const currentSelected = this.stateManager.getSelectedHotspot();
    const currentHovered = this.stateManager.getHoveredHotspot();
    const forceVisible = [];
    if (currentSelected == null ? void 0 : currentSelected.id) forceVisible.push(currentSelected.id);
    if ((currentHovered == null ? void 0 : currentHovered.id) && currentHovered.id !== (currentSelected == null ? void 0 : currentSelected.id)) {
      forceVisible.push(currentHovered.id);
    }
    if (forceVisible.length > 0) {
      this.activeHotspotManager.forceShowHotspots(forceVisible);
    }
    const now = Date.now();
    if (!this._lastStatsLog || now - this._lastStatsLog > 2e3) {
      this._lastStatsLog = now;
      const stats = this.activeHotspotManager.getStats();
      console.log(
        `[LOD+Active] Active: ${stats.activeHotspots} | Total: ${stats.totalHotspots} | Zoom: ${currentZoom.toFixed(2)} | Visible: ${visibleCount}`
      );
    }
    if (visibleCount > _NativeHotspotRenderer.HIGH_HOTSPOT_COUNT_THRESHOLD && this.animationQueue) {
      this.animationQueue.clearFinished();
      if (this.animationQueue.running.size > _NativeHotspotRenderer.MAX_CONCURRENT_ANIMATIONS) {
        this.animationQueue.clear();
        console.log("Animation queue cleared due to high hotspot count");
      }
    }
    this.checkPerformanceMode();
  }
  forceIOSRedraw() {
    if (!this.isMobile) return;
    if (this.viewer && this.svg) {
      this.svg.style.display = "none";
      void this.svg.offsetHeight;
      this.svg.style.display = "";
      this.viewer.updateOverlay(this.svg);
    }
  }
  /**
   * Enable performance mode when too many hotspots are visible
   */
  checkPerformanceMode() {
    const visibleCount = this.stateManager.getVisibleCount();
    this.renderOptimizer.checkPerformanceMode(visibleCount, this.svg);
  }
  updateVisibilityLazy() {
    if (this.renderOptimizer.areUpdatesPaused()) {
      return;
    }
    const viewport = this.viewer.viewport;
    viewport.getZoom();
    if (this.viewer.isAnimating()) {
      setTimeout(() => this.updateVisibilityLazy(), 100);
      return;
    }
    const bounds = viewport.getBounds();
    const topLeft = viewport.viewportToImageCoordinates(bounds.getTopLeft());
    const bottomRight = viewport.viewportToImageCoordinates(bounds.getBottomRight());
    const viewBounds = {
      minX: topLeft.x,
      minY: topLeft.y,
      maxX: bottomRight.x,
      maxY: bottomRight.y
    };
    const padding = (viewBounds.maxX - viewBounds.minX) * 0.2;
    Object.keys(viewBounds).forEach((key) => {
      viewBounds[key] += key.startsWith("min") ? -padding : padding;
    });
    const hotspots = Array.from(this.stateManager.getAllOverlays().entries());
    let index = 0;
    let processedInFrame = 0;
    const maxPerFrame = 30;
    const visibilityUpdates = [];
    const processChunk = () => {
      const startTime = performance.now();
      processedInFrame = 0;
      while (index < hotspots.length && processedInFrame < maxPerFrame && performance.now() - startTime < 8) {
        const [id, overlay] = hotspots[index];
        const isVisible = this.boundsIntersect(overlay.bounds, viewBounds);
        if (isVisible !== overlay.isVisible) {
          overlay.element.style.opacity = isVisible ? "1" : "0";
          visibilityUpdates.push({
            id,
            isVisible
          });
        }
        index++;
        processedInFrame++;
      }
      if (index < hotspots.length) {
        if ("requestIdleCallback" in window) {
          requestIdleCallback(() => processChunk(), { timeout: 50 });
        } else {
          requestAnimationFrame(processChunk);
        }
      } else {
        if (visibilityUpdates.length > 0) {
          this.stateManager.batchUpdateVisibility(visibilityUpdates);
        }
        if (this.viewer.world.getItemCount() > 0) {
          requestAnimationFrame(() => {
            this.viewer.updateOverlay(this.svg);
          });
        }
      }
    };
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => processChunk(), { timeout: 100 });
    } else {
      setTimeout(() => requestAnimationFrame(processChunk), 50);
    }
  }
  boundsIntersect(a, b) {
    return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
  }
  setupRevealMode() {
    this.revealRenderer.setupTriggers();
  }
  toggleRevealMode() {
    if (this.revealRenderer.isActive()) {
      this.revealRenderer.deactivate();
    } else {
      this.revealRenderer.activate();
    }
  }
  /**
   * Enable the renderer
   */
  enable() {
    this.enabled = true;
    console.log("NativeHotspotRenderer enabled");
    this.stateManager.getAllOverlays().forEach((overlay) => {
      if (overlay.element) {
        overlay.element.style.display = "";
      }
    });
    if (this.renderOptimizer) {
      this.renderOptimizer.resumeUpdates();
    }
  }
  /**
   * Disable the renderer
   */
  disable() {
    this.enabled = false;
    console.log("NativeHotspotRenderer disabled");
    this.stateManager.getAllOverlays().forEach((overlay) => {
      if (overlay.element) {
        overlay.element.style.display = "none";
      }
    });
    if (this.renderOptimizer) {
      this.renderOptimizer.pauseUpdates();
    }
  }
  cleanup() {
    if (this.styleManager && this.styleManager.activeAnimations) {
      this.styleManager.activeAnimations.forEach((animation, hotspotId) => {
        if (animation) {
          animation.pause();
        }
      });
      this.styleManager.activeAnimations.clear();
    }
    if (this.eventCoordinator) {
      if (this.svg) {
        this.svg.removeEventListener(
          "pointermove",
          this.eventCoordinator.handlePointerMove
        );
        this.svg.removeEventListener(
          "pointerdown",
          this.eventCoordinator.handlePointerDown
        );
        this.svg.removeEventListener("pointerup", this.eventCoordinator.handlePointerUp);
      }
    }
    if (this.activeTimeouts) {
      this.activeTimeouts.forEach((timeout) => clearTimeout(timeout));
      this.activeTimeouts.clear();
    }
    if (window.nativeHotspotRenderer === this) {
      window.nativeHotspotRenderer = null;
    }
    if (window.eventCoordinator === this.eventCoordinator) {
      window.eventCoordinator = null;
    }
    if (window.temporalDetectionEngine === this.temporalDetectionEngine) {
      window.temporalDetectionEngine = null;
    }
    console.log("[NativeHotspotRenderer] Cleaned up previous instance");
  }
  /**
   * Set visual selected state without triggering callbacks
   * Used when we need to show selected state without activating the hotspot
   */
  setVisualSelectedState(hotspot) {
    if (!hotspot) return;
    console.log("🎨 Setting visual selected state for:", hotspot.id);
    const overlay = this.stateManager.getOverlay(hotspot.id);
    if (!overlay || !overlay.element) {
      console.warn("🚨 Cannot set visual state - overlay not found for:", hotspot.id);
      return;
    }
    if (this.styleManager) {
      this.styleManager.applyStyle(overlay.element, hotspot.type, "selected");
    }
    this.stateManager.setSelectedHotspot(hotspot);
    console.log("✅ Visual selected state applied for:", hotspot.id);
  }
  destroy() {
    console.log("Destroying NativeHotspotRenderer");
    if (this.animationQueue) {
      this.animationQueue.clear();
    }
    if (this.revealRenderer) {
      this.revealRenderer.destroy();
    }
    if (this.temporalRenderer) {
      this.temporalRenderer.destroy();
    }
    if (this.memoryManager) {
      this.memoryManager.destroy();
    }
    if (this.renderOptimizer) {
      this.renderOptimizer.destroy();
    }
    this.stateManager.getAllOverlays().forEach((overlay) => {
      const paths = overlay.element.getElementsByTagName("path");
      for (let path of paths) {
        if (path.currentAnimation) {
          path.currentAnimation.cancel();
        }
        path.getAnimations().forEach((animation) => animation.cancel());
      }
    });
    if (this.hitDetectionCanvas) {
      if (typeof this.hitDetectionCanvas.destroy === "function") {
        this.hitDetectionCanvas.destroy();
      }
    }
    if (this.engine) {
      this.engine.destroy();
    }
    if (this.styleManager) {
      this.styleManager.destroy();
    }
    if (this.modeStateManager) {
      this.modeStateManager.destroy();
    }
    if (this.eventCoordinator) {
      this.eventCoordinator.destroy();
    }
    if (this.stateManager) {
      this.stateManager.clear();
    }
    if (window.debugNativeRenderer) {
      delete window.debugNativeRenderer;
    }
    if (window.nativeHotspotRenderer === this) {
      delete window.nativeHotspotRenderer;
    }
  }
};
// STEP 4 OPTIMIZATION: Reduced animation limits for faster processing
__publicField(_NativeHotspotRenderer, "MAX_CONCURRENT_ANIMATIONS", 15);
// Reduced from 25
__publicField(_NativeHotspotRenderer, "MAX_CONCURRENT_ANIMATIONS_MOBILE", 8);
// Reduced from 15
__publicField(_NativeHotspotRenderer, "HIGH_HOTSPOT_COUNT_THRESHOLD", 100);
let NativeHotspotRenderer = _NativeHotspotRenderer;
function quickselect(arr, k, left = 0, right = arr.length - 1, compare = defaultCompare) {
  while (right > left) {
    if (right - left > 600) {
      const n = right - left + 1;
      const m = k - left + 1;
      const z = Math.log(n);
      const s = 0.5 * Math.exp(2 * z / 3);
      const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
      const newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
      const newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
      quickselect(arr, k, newLeft, newRight, compare);
    }
    const t = arr[k];
    let i = left;
    let j = right;
    swap(arr, left, k);
    if (compare(arr[right], t) > 0) swap(arr, left, right);
    while (i < j) {
      swap(arr, i, j);
      i++;
      j--;
      while (compare(arr[i], t) < 0) i++;
      while (compare(arr[j], t) > 0) j--;
    }
    if (compare(arr[left], t) === 0) swap(arr, left, j);
    else {
      j++;
      swap(arr, j, right);
    }
    if (j <= k) left = j + 1;
    if (k <= j) right = j - 1;
  }
}
function swap(arr, i, j) {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
}
function defaultCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
class RBush {
  constructor(maxEntries = 9) {
    this._maxEntries = Math.max(4, maxEntries);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));
    this.clear();
  }
  all() {
    return this._all(this.data, []);
  }
  search(bbox) {
    let node = this.data;
    const result = [];
    if (!intersects(bbox, node)) return result;
    const toBBox = this.toBBox;
    const nodesToSearch = [];
    while (node) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childBBox = node.leaf ? toBBox(child) : child;
        if (intersects(bbox, childBBox)) {
          if (node.leaf) result.push(child);
          else if (contains(bbox, childBBox)) this._all(child, result);
          else nodesToSearch.push(child);
        }
      }
      node = nodesToSearch.pop();
    }
    return result;
  }
  collides(bbox) {
    let node = this.data;
    if (!intersects(bbox, node)) return false;
    const nodesToSearch = [];
    while (node) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childBBox = node.leaf ? this.toBBox(child) : child;
        if (intersects(bbox, childBBox)) {
          if (node.leaf || contains(bbox, childBBox)) return true;
          nodesToSearch.push(child);
        }
      }
      node = nodesToSearch.pop();
    }
    return false;
  }
  load(data) {
    if (!(data && data.length)) return this;
    if (data.length < this._minEntries) {
      for (let i = 0; i < data.length; i++) {
        this.insert(data[i]);
      }
      return this;
    }
    let node = this._build(data.slice(), 0, data.length - 1, 0);
    if (!this.data.children.length) {
      this.data = node;
    } else if (this.data.height === node.height) {
      this._splitRoot(this.data, node);
    } else {
      if (this.data.height < node.height) {
        const tmpNode = this.data;
        this.data = node;
        node = tmpNode;
      }
      this._insert(node, this.data.height - node.height - 1, true);
    }
    return this;
  }
  insert(item) {
    if (item) this._insert(item, this.data.height - 1);
    return this;
  }
  clear() {
    this.data = createNode([]);
    return this;
  }
  remove(item, equalsFn) {
    if (!item) return this;
    let node = this.data;
    const bbox = this.toBBox(item);
    const path = [];
    const indexes = [];
    let i, parent, goingUp;
    while (node || path.length) {
      if (!node) {
        node = path.pop();
        parent = path[path.length - 1];
        i = indexes.pop();
        goingUp = true;
      }
      if (node.leaf) {
        const index = findItem(item, node.children, equalsFn);
        if (index !== -1) {
          node.children.splice(index, 1);
          path.push(node);
          this._condense(path);
          return this;
        }
      }
      if (!goingUp && !node.leaf && contains(node, bbox)) {
        path.push(node);
        indexes.push(i);
        i = 0;
        parent = node;
        node = node.children[0];
      } else if (parent) {
        i++;
        node = parent.children[i];
        goingUp = false;
      } else node = null;
    }
    return this;
  }
  toBBox(item) {
    return item;
  }
  compareMinX(a, b) {
    return a.minX - b.minX;
  }
  compareMinY(a, b) {
    return a.minY - b.minY;
  }
  toJSON() {
    return this.data;
  }
  fromJSON(data) {
    this.data = data;
    return this;
  }
  _all(node, result) {
    const nodesToSearch = [];
    while (node) {
      if (node.leaf) result.push(...node.children);
      else nodesToSearch.push(...node.children);
      node = nodesToSearch.pop();
    }
    return result;
  }
  _build(items, left, right, height) {
    const N = right - left + 1;
    let M = this._maxEntries;
    let node;
    if (N <= M) {
      node = createNode(items.slice(left, right + 1));
      calcBBox(node, this.toBBox);
      return node;
    }
    if (!height) {
      height = Math.ceil(Math.log(N) / Math.log(M));
      M = Math.ceil(N / Math.pow(M, height - 1));
    }
    node = createNode([]);
    node.leaf = false;
    node.height = height;
    const N2 = Math.ceil(N / M);
    const N1 = N2 * Math.ceil(Math.sqrt(M));
    multiSelect(items, left, right, N1, this.compareMinX);
    for (let i = left; i <= right; i += N1) {
      const right2 = Math.min(i + N1 - 1, right);
      multiSelect(items, i, right2, N2, this.compareMinY);
      for (let j = i; j <= right2; j += N2) {
        const right3 = Math.min(j + N2 - 1, right2);
        node.children.push(this._build(items, j, right3, height - 1));
      }
    }
    calcBBox(node, this.toBBox);
    return node;
  }
  _chooseSubtree(bbox, node, level, path) {
    while (true) {
      path.push(node);
      if (node.leaf || path.length - 1 === level) break;
      let minArea = Infinity;
      let minEnlargement = Infinity;
      let targetNode;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const area = bboxArea(child);
        const enlargement = enlargedArea(bbox, child) - area;
        if (enlargement < minEnlargement) {
          minEnlargement = enlargement;
          minArea = area < minArea ? area : minArea;
          targetNode = child;
        } else if (enlargement === minEnlargement) {
          if (area < minArea) {
            minArea = area;
            targetNode = child;
          }
        }
      }
      node = targetNode || node.children[0];
    }
    return node;
  }
  _insert(item, level, isNode) {
    const bbox = isNode ? item : this.toBBox(item);
    const insertPath = [];
    const node = this._chooseSubtree(bbox, this.data, level, insertPath);
    node.children.push(item);
    extend(node, bbox);
    while (level >= 0) {
      if (insertPath[level].children.length > this._maxEntries) {
        this._split(insertPath, level);
        level--;
      } else break;
    }
    this._adjustParentBBoxes(bbox, insertPath, level);
  }
  // split overflowed node into two
  _split(insertPath, level) {
    const node = insertPath[level];
    const M = node.children.length;
    const m = this._minEntries;
    this._chooseSplitAxis(node, m, M);
    const splitIndex = this._chooseSplitIndex(node, m, M);
    const newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
    newNode.height = node.height;
    newNode.leaf = node.leaf;
    calcBBox(node, this.toBBox);
    calcBBox(newNode, this.toBBox);
    if (level) insertPath[level - 1].children.push(newNode);
    else this._splitRoot(node, newNode);
  }
  _splitRoot(node, newNode) {
    this.data = createNode([node, newNode]);
    this.data.height = node.height + 1;
    this.data.leaf = false;
    calcBBox(this.data, this.toBBox);
  }
  _chooseSplitIndex(node, m, M) {
    let index;
    let minOverlap = Infinity;
    let minArea = Infinity;
    for (let i = m; i <= M - m; i++) {
      const bbox1 = distBBox(node, 0, i, this.toBBox);
      const bbox2 = distBBox(node, i, M, this.toBBox);
      const overlap = intersectionArea(bbox1, bbox2);
      const area = bboxArea(bbox1) + bboxArea(bbox2);
      if (overlap < minOverlap) {
        minOverlap = overlap;
        index = i;
        minArea = area < minArea ? area : minArea;
      } else if (overlap === minOverlap) {
        if (area < minArea) {
          minArea = area;
          index = i;
        }
      }
    }
    return index || M - m;
  }
  // sorts node children by the best axis for split
  _chooseSplitAxis(node, m, M) {
    const compareMinX = node.leaf ? this.compareMinX : compareNodeMinX;
    const compareMinY = node.leaf ? this.compareMinY : compareNodeMinY;
    const xMargin = this._allDistMargin(node, m, M, compareMinX);
    const yMargin = this._allDistMargin(node, m, M, compareMinY);
    if (xMargin < yMargin) node.children.sort(compareMinX);
  }
  // total margin of all possible split distributions where each node is at least m full
  _allDistMargin(node, m, M, compare) {
    node.children.sort(compare);
    const toBBox = this.toBBox;
    const leftBBox = distBBox(node, 0, m, toBBox);
    const rightBBox = distBBox(node, M - m, M, toBBox);
    let margin = bboxMargin(leftBBox) + bboxMargin(rightBBox);
    for (let i = m; i < M - m; i++) {
      const child = node.children[i];
      extend(leftBBox, node.leaf ? toBBox(child) : child);
      margin += bboxMargin(leftBBox);
    }
    for (let i = M - m - 1; i >= m; i--) {
      const child = node.children[i];
      extend(rightBBox, node.leaf ? toBBox(child) : child);
      margin += bboxMargin(rightBBox);
    }
    return margin;
  }
  _adjustParentBBoxes(bbox, path, level) {
    for (let i = level; i >= 0; i--) {
      extend(path[i], bbox);
    }
  }
  _condense(path) {
    for (let i = path.length - 1, siblings; i >= 0; i--) {
      if (path[i].children.length === 0) {
        if (i > 0) {
          siblings = path[i - 1].children;
          siblings.splice(siblings.indexOf(path[i]), 1);
        } else this.clear();
      } else calcBBox(path[i], this.toBBox);
    }
  }
}
function findItem(item, items, equalsFn) {
  if (!equalsFn) return items.indexOf(item);
  for (let i = 0; i < items.length; i++) {
    if (equalsFn(item, items[i])) return i;
  }
  return -1;
}
function calcBBox(node, toBBox) {
  distBBox(node, 0, node.children.length, toBBox, node);
}
function distBBox(node, k, p, toBBox, destNode) {
  if (!destNode) destNode = createNode(null);
  destNode.minX = Infinity;
  destNode.minY = Infinity;
  destNode.maxX = -Infinity;
  destNode.maxY = -Infinity;
  for (let i = k; i < p; i++) {
    const child = node.children[i];
    extend(destNode, node.leaf ? toBBox(child) : child);
  }
  return destNode;
}
function extend(a, b) {
  a.minX = Math.min(a.minX, b.minX);
  a.minY = Math.min(a.minY, b.minY);
  a.maxX = Math.max(a.maxX, b.maxX);
  a.maxY = Math.max(a.maxY, b.maxY);
  return a;
}
function compareNodeMinX(a, b) {
  return a.minX - b.minX;
}
function compareNodeMinY(a, b) {
  return a.minY - b.minY;
}
function bboxArea(a) {
  return (a.maxX - a.minX) * (a.maxY - a.minY);
}
function bboxMargin(a) {
  return a.maxX - a.minX + (a.maxY - a.minY);
}
function enlargedArea(a, b) {
  return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) * (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
}
function intersectionArea(a, b) {
  const minX = Math.max(a.minX, b.minX);
  const minY = Math.max(a.minY, b.minY);
  const maxX = Math.min(a.maxX, b.maxX);
  const maxY = Math.min(a.maxY, b.maxY);
  return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
}
function contains(a, b) {
  return a.minX <= b.minX && a.minY <= b.minY && b.maxX <= a.maxX && b.maxY <= a.maxY;
}
function intersects(a, b) {
  return b.minX <= a.maxX && b.minY <= a.maxY && b.maxX >= a.minX && b.maxY >= a.minY;
}
function createNode(children) {
  return {
    children,
    height: 1,
    leaf: true,
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };
}
function multiSelect(arr, left, right, n, compare) {
  const stack = [left, right];
  while (stack.length) {
    right = stack.pop();
    left = stack.pop();
    if (right - left <= n) continue;
    const mid = left + Math.ceil((right - left) / n / 2) * n;
    quickselect(arr, mid, left, right, compare);
    stack.push(left, mid, mid, right);
  }
}
const logger = createLogger("Canvas2DRenderer");
class Canvas2DRenderer {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = options;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    this.canvas = null;
    this.context = null;
    this.overlayCanvas = null;
    this.spatialIndex = RBush();
    this.hotspots = /* @__PURE__ */ new Map();
    this.visibleHotspots = /* @__PURE__ */ new Set();
    this.path2DCache = /* @__PURE__ */ new WeakMap();
    this.batchesByStyle = /* @__PURE__ */ new Map();
    this.state = {
      hoveredHotspot: null,
      selectedHotspots: /* @__PURE__ */ new Set(),
      animatingHotspots: /* @__PURE__ */ new Map(),
      currentMode: "default",
      zoom: 1,
      bounds: null
    };
    this.config = {
      maxVerticesMobile: 50,
      simplificationTolerance: {
        low: 5,
        // < 0.1x zoom
        medium: 2,
        // < 0.5x zoom
        high: 1,
        // < 1.0x zoom
        ultra: 0.1
        // >= 1.0x zoom
      },
      maxConcurrentAnimations: this.isMobile ? 8 : 15,
      updateThrottle: 16,
      // 60 FPS
      enableBatching: true,
      enableSimplification: true,
      enablePath2DCache: true,
      debugMode: options.debugMode || false
    };
    this.canvasLimit = this.detectCanvasLimit();
    this.animationFrame = null;
    this.lastUpdateTime = 0;
    this.handleRedraw = this.handleRedraw.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.initialize();
  }
  /**
   * Initialize the Canvas2D renderer
   */
  initialize() {
    logger.info("Initializing Canvas2DRenderer");
    this.createCanvas();
    this.setupOverlay();
    this.setupEventHandlers();
    logger.info("Canvas2DRenderer initialized");
  }
  /**
   * Create the main canvas element
   */
  createCanvas() {
    const container = this.viewer.container;
    const size = this.viewer.viewport.getContainerSize();
    const { canvas, ctx } = this.createIOSSafeCanvas(size.x, size.y);
    this.canvas = canvas;
    this.context = ctx;
    Object.assign(this.canvas.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "auto",
      // Enable interaction
      zIndex: "1000",
      transform: "translateZ(0)",
      // Force GPU acceleration
      willChange: "transform"
    });
    container.appendChild(this.canvas);
    logger.info("Canvas created and added to container");
  }
  /**
   * Create iOS-safe canvas with size limits
   */
  createIOSSafeCanvas(width, height) {
    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, this.config.maxDevicePixelRatio || 2);
    const totalPixels = width * dpr * height * dpr;
    if (totalPixels > this.canvasLimit) {
      const scale = Math.sqrt(this.canvasLimit / totalPixels);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
      logger.warn(`Canvas size limited for iOS: ${width}x${height}`);
    }
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
      // Reduce latency
      willReadFrequently: false
    });
    ctx.scale(dpr, dpr);
    return { canvas, ctx };
  }
  /**
   * Detect iOS canvas size limit
   */
  detectCanvasLimit() {
    if (this.isIOS) {
      return 16777216;
    }
    return 268435456;
  }
  /**
   * Setup OpenSeadragon overlay for viewport synchronization
   */
  setupOverlay() {
    this.viewer.addHandler("update-viewport", this.handleViewportChange);
    this.viewer.addHandler("canvas-click", this.handleClick);
    this.viewer.addHandler("canvas-drag", this.handleMouseMove);
    logger.info("OpenSeadragon overlay handlers setup");
  }
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    window.addEventListener("resize", this.handleResize.bind(this));
    if (this.isMobile) {
      this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), {
        passive: false
      });
      this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), {
        passive: false
      });
      this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this), {
        passive: false
      });
    }
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("click", this.handleClick.bind(this));
    logger.info("Event handlers setup");
  }
  /**
   * Handle viewport change for redrawing
   */
  handleViewportChange() {
    const zoom = this.viewer.viewport.getZoom();
    const bounds = this.viewer.viewport.getBounds();
    this.state.zoom = zoom;
    this.state.bounds = bounds;
    const now = performance.now();
    if (now - this.lastUpdateTime < this.config.updateThrottle) {
      if (!this.animationFrame) {
        this.animationFrame = requestAnimationFrame(() => {
          this.redraw();
          this.animationFrame = null;
        });
      }
      return;
    }
    this.lastUpdateTime = now;
    this.redraw();
  }
  /**
   * Main redraw function
   */
  redraw() {
    if (!this.context || !this.state.bounds) return;
    const startTime = performance.now();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const visibleHotspots = this.getVisibleHotspots(this.state.bounds);
    this.visibleHotspots.clear();
    visibleHotspots.forEach((h) => this.visibleHotspots.add(h.id));
    this.renderHotspots(visibleHotspots, this.state.zoom);
    if (this.config.debugMode) {
      const renderTime = performance.now() - startTime;
      this.renderDebugInfo(visibleHotspots.length, renderTime);
    }
  }
  /**
   * Get visible hotspots using spatial index
   */
  getVisibleHotspots(bounds) {
    if (!bounds) return [];
    const results = this.spatialIndex.search({
      minX: bounds.x,
      minY: bounds.y,
      maxX: bounds.x + bounds.width,
      maxY: bounds.y + bounds.height
    });
    return results.map((r) => this.hotspots.get(r.id)).filter(Boolean);
  }
  /**
   * Render hotspots with batching and optimization
   */
  renderHotspots(hotspots, zoom) {
    if (hotspots.length === 0) return;
    this.batchesByStyle.clear();
    const tolerance = this.getSimplificationTolerance(zoom);
    hotspots.forEach((hotspot) => {
      const styleKey = this.getStyleKey(hotspot);
      if (!this.batchesByStyle.has(styleKey)) {
        this.batchesByStyle.set(styleKey, []);
      }
      this.batchesByStyle.get(styleKey).push(hotspot);
    });
    this.batchesByStyle.forEach((batch, styleKey) => {
      this.renderBatch(batch, styleKey, tolerance);
    });
  }
  /**
   * Get style key for batching
   */
  getStyleKey(hotspot) {
    const state = this.getHotspotState(hotspot);
    const opacity = state.opacity || 1;
    const strokeWidth = state.strokeWidth || 2;
    const strokeColor = state.strokeColor || "white";
    const fillColor = state.fillColor || "transparent";
    return `${fillColor}_${strokeColor}_${strokeWidth}_${opacity}`;
  }
  /**
   * Get hotspot rendering state
   */
  getHotspotState(hotspot) {
    const isHovered = this.state.hoveredHotspot === hotspot.id;
    const isSelected = this.state.selectedHotspots.has(hotspot.id);
    const isAnimating = this.state.animatingHotspots.has(hotspot.id);
    let state = {
      opacity: 1,
      strokeWidth: 2,
      strokeColor: "white",
      fillColor: "transparent"
    };
    if (isSelected) {
      state.strokeWidth = 3;
      state.strokeColor = "#00ff00";
      state.opacity = 1;
    } else if (isHovered) {
      state.strokeWidth = 2.5;
      state.opacity = 0.9;
    } else if (isAnimating) {
      const animation = this.state.animatingHotspots.get(hotspot.id);
      state.opacity = animation.opacity || 1;
      state.strokeWidth = animation.strokeWidth || 2;
    }
    if (this.state.currentMode === "reveal") {
      state.opacity = Math.min(state.opacity, 0.7);
    } else if (this.state.currentMode === "static" && this.state.zoom > 8) {
      state.opacity = 1;
      state.strokeWidth = 1;
    }
    return state;
  }
  /**
   * Render a batch of hotspots with the same style
   */
  renderBatch(hotspots, styleKey, tolerance) {
    const [fill, stroke, width, opacity] = styleKey.split("_");
    this.context.save();
    this.context.fillStyle = fill;
    this.context.strokeStyle = stroke;
    this.context.lineWidth = parseFloat(width);
    this.context.globalAlpha = parseFloat(opacity);
    this.context.beginPath();
    hotspots.forEach((hotspot) => {
      const path = this.getOrCreatePath2D(hotspot, tolerance);
      if (path) {
        this.addPathToContext(path, hotspot);
      }
    });
    if (fill !== "transparent") {
      this.context.fill();
    }
    this.context.stroke();
    this.context.restore();
  }
  /**
   * Get or create Path2D for hotspot with caching
   */
  getOrCreatePath2D(hotspot, tolerance) {
    let cachedPath = this.path2DCache.get(hotspot);
    if (cachedPath && cachedPath.tolerance === tolerance) {
      return cachedPath.path;
    }
    const path = new Path2D();
    const vertices = this.simplifyPolygon(hotspot.vertices, tolerance);
    if (vertices.length < 3) return null;
    path.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      path.lineTo(vertices[i].x, vertices[i].y);
    }
    path.closePath();
    this.path2DCache.set(hotspot, { path, tolerance });
    return path;
  }
  /**
   * Add Path2D to current context with proper transformation
   */
  addPathToContext(path, hotspot) {
    const viewport = this.viewer.viewport;
    const containerSize = viewport.getContainerSize();
    const bounds = viewport.getBounds();
    const scale = containerSize.x / bounds.width;
    const offsetX = -bounds.x * scale;
    const offsetY = -bounds.y * scale;
    this.context.save();
    this.context.translate(offsetX, offsetY);
    this.context.scale(scale, scale);
    this.context.addPath ? this.context.addPath(path) : this.drawPath(path, hotspot.vertices);
    this.context.restore();
  }
  /**
   * Fallback path drawing if addPath not supported
   */
  drawPath(path, vertices) {
    if (vertices.length < 3) return;
    this.context.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      this.context.lineTo(vertices[i].x, vertices[i].y);
    }
    this.context.closePath();
  }
  /**
   * Simplify polygon based on zoom level
   */
  simplifyPolygon(vertices, tolerance) {
    if (!this.config.enableSimplification) return vertices;
    if (vertices.length <= 3 || tolerance === 0) return vertices;
    if (this.isMobile && vertices.length > this.config.maxVerticesMobile) {
      const step = Math.ceil(vertices.length / this.config.maxVerticesMobile);
      return vertices.filter((_, i) => i % step === 0);
    }
    return vertices;
  }
  /**
   * Get simplification tolerance based on zoom
   */
  getSimplificationTolerance(zoom) {
    if (zoom < 0.1) return this.config.simplificationTolerance.low;
    if (zoom < 0.5) return this.config.simplificationTolerance.medium;
    if (zoom < 1) return this.config.simplificationTolerance.high;
    return this.config.simplificationTolerance.ultra;
  }
  /**
   * Add hotspot to renderer
   */
  addHotspot(hotspotData) {
    const { id, vertices, bounds } = hotspotData;
    this.hotspots.set(id, hotspotData);
    this.spatialIndex.insert({
      minX: bounds.minX,
      minY: bounds.minY,
      maxX: bounds.maxX,
      maxY: bounds.maxY,
      id
    });
    logger.debug(`Added hotspot ${id}`);
  }
  /**
   * Remove hotspot from renderer
   */
  removeHotspot(id) {
    const hotspot = this.hotspots.get(id);
    if (!hotspot) return;
    this.hotspots.delete(id);
    const bounds = hotspot.bounds;
    this.spatialIndex.remove(
      {
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
        id
      },
      (a, b) => a.id === b.id
    );
    logger.debug(`Removed hotspot ${id}`);
  }
  /**
   * Batch add hotspots for performance
   */
  addHotspotsBatch(hotspotsData) {
    const items = [];
    hotspotsData.forEach((data) => {
      const { id, vertices, bounds } = data;
      this.hotspots.set(id, data);
      items.push({
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
        id
      });
    });
    this.spatialIndex.load(items);
    logger.info(`Added ${hotspotsData.length} hotspots in batch`);
  }
  /**
   * Handle mouse move for hover detection
   */
  handleMouseMove(event) {
    const point = this.getEventPoint(event);
    const hitHotspot = this.hitTest(point);
    if (hitHotspot !== this.state.hoveredHotspot) {
      this.state.hoveredHotspot = hitHotspot;
      this.redraw();
      if (this.options.onHotspotHover) {
        this.options.onHotspotHover(hitHotspot);
      }
    }
  }
  /**
   * Handle click for selection
   */
  handleClick(event) {
    const point = this.getEventPoint(event);
    const hitHotspot = this.hitTest(point);
    if (hitHotspot) {
      if (this.state.selectedHotspots.has(hitHotspot)) {
        this.state.selectedHotspots.delete(hitHotspot);
      } else {
        this.state.selectedHotspots.add(hitHotspot);
      }
      this.redraw();
      if (this.options.onHotspotClick) {
        this.options.onHotspotClick(hitHotspot);
      }
    }
  }
  /**
   * Hit test at point
   */
  hitTest(point) {
    const imagePoint = this.viewer.viewport.viewerElementToImageCoordinates(point);
    const candidates = this.spatialIndex.search({
      minX: imagePoint.x - 1,
      minY: imagePoint.y - 1,
      maxX: imagePoint.x + 1,
      maxY: imagePoint.y + 1
    });
    for (const candidate of candidates) {
      const hotspot = this.hotspots.get(candidate.id);
      if (hotspot && this.pointInPolygon(imagePoint, hotspot.vertices)) {
        return candidate.id;
      }
    }
    return null;
  }
  /**
   * Point in polygon test
   */
  pointInPolygon(point, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      const intersect = yi > point.y !== yj > point.y && point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
  /**
   * Get event point in viewer coordinates
   */
  getEventPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    let x, y;
    if (event.touches && event.touches.length > 0) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    return new OpenSeadragon.Point(x, y);
  }
  /**
   * Handle touch start
   */
  handleTouchStart(event) {
    this.handleMouseMove(event);
  }
  /**
   * Handle touch move
   */
  handleTouchMove(event) {
    this.handleMouseMove(event);
  }
  /**
   * Handle touch end
   */
  handleTouchEnd(event) {
    if (event.changedTouches.length === 1) {
      this.handleClick(event);
    }
  }
  /**
   * Handle window resize
   */
  handleResize() {
    const size = this.viewer.viewport.getContainerSize();
    const { canvas, ctx } = this.createIOSSafeCanvas(size.x, size.y);
    canvas.style.cssText = this.canvas.style.cssText;
    this.canvas.parentNode.replaceChild(canvas, this.canvas);
    this.canvas = canvas;
    this.context = ctx;
    this.redraw();
  }
  /**
   * Render debug information
   */
  renderDebugInfo(visibleCount, renderTime) {
    this.context.save();
    this.context.fillStyle = "white";
    this.context.font = "12px monospace";
    this.context.fillText(`Visible: ${visibleCount}`, 10, 20);
    this.context.fillText(`Render: ${renderTime.toFixed(1)}ms`, 10, 35);
    this.context.fillText(`FPS: ${(1e3 / renderTime).toFixed(0)}`, 10, 50);
    this.context.fillText(`Zoom: ${this.state.zoom.toFixed(2)}`, 10, 65);
    this.context.restore();
  }
  /**
   * Set rendering mode
   */
  setMode(mode) {
    this.state.currentMode = mode;
    this.redraw();
  }
  /**
   * Start animation for hotspot
   */
  animateHotspot(id, animation) {
    this.state.animatingHotspots.set(id, animation);
    if (!this.animationFrame) {
      this.animate();
    }
  }
  /**
   * Animation loop
   */
  animate() {
    const now = performance.now();
    let hasActiveAnimations = false;
    this.state.animatingHotspots.forEach((animation, id) => {
      if (animation.update) {
        animation.update(now);
      }
      if (!animation.completed) {
        hasActiveAnimations = true;
      } else {
        this.state.animatingHotspots.delete(id);
      }
    });
    if (hasActiveAnimations) {
      this.redraw();
      this.animationFrame = requestAnimationFrame(() => this.animate());
    } else {
      this.animationFrame = null;
    }
  }
  /**
   * Destroy renderer and cleanup
   */
  destroy() {
    logger.info("Destroying Canvas2DRenderer");
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.viewer.removeHandler("update-viewport", this.handleViewportChange);
    this.viewer.removeHandler("canvas-click", this.handleClick);
    this.viewer.removeHandler("canvas-drag", this.handleMouseMove);
    window.removeEventListener("resize", this.handleResize.bind(this));
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.hotspots.clear();
    this.spatialIndex.clear();
    this.batchesByStyle.clear();
    this.path2DCache = /* @__PURE__ */ new WeakMap();
    logger.info("Canvas2DRenderer destroyed");
  }
}
function setupViewerEventHandlers(viewer, state, componentsObj, handleHotspotClick, hotspotData) {
  const isWebGL = viewer.drawer && (viewer.drawer.constructor.name === "WebGLDrawer" || viewer.drawer.webgl || viewer.drawer.gl);
  if (viewer.drawer && !isWebGL) {
    viewer.addHandler("tile-drawing", (event) => {
      if (viewer.drawer && viewer.drawer.context) {
        viewer.drawer.context.imageSmoothingEnabled = true;
      }
      const zoom = viewer.viewport.getZoom();
      event.tile;
      const size = event.tile.size;
      event.tile.level;
      if (zoom < 1) {
        const screenSize = size * zoom;
        if (screenSize < 16) {
          event.preventDefaultAction = true;
          return;
        }
      }
    });
  }
  viewer.addHandler("open", () => {
    var _a, _b;
    if (isMobile()) {
      let lastAnimationFrame = 0;
      const frameThrottle = 33;
      viewer.addHandler("update-viewport", (event) => {
        const now = performance.now();
        if (viewer.isAnimating() && now - lastAnimationFrame < frameThrottle) {
          event.preventDefaultAction = true;
          return;
        }
        lastAnimationFrame = now;
      });
    }
    viewer.viewport.minZoomLevel = 0.8;
    viewer.viewport.minZoomImageRatio = 0.5;
    if (isMobile()) {
      viewer.viewport.minZoomLevel = 0.5;
      viewer.viewport.minZoomImageRatio = 0.3;
    }
    implementProgressiveZoomQuality(viewer);
    optimizeZoomPerformance(viewer, performanceConfig);
    viewer.viewport.minZoomLevel = 0.8;
    viewer.viewport.minZoomImageRatio = 0.5;
    console.log("Viewer ready - initializing systems");
    console.log("Using drawer:", ((_b = (_a = viewer.drawer) == null ? void 0 : _a.constructor) == null ? void 0 : _b.name) || "canvas");
    const tiledImage = viewer.world.getItemAt(0);
    const bounds = tiledImage.getBounds();
    viewer.viewport.fitBounds(bounds, true);
    viewer.viewport.applyConstraints(true);
    if (isMobile()) {
      setTimeout(() => {
        const tiledImage2 = viewer.world.getItemAt(0);
        if (tiledImage2) {
          const imageBounds = tiledImage2.getBounds();
          viewer.viewport.fitBoundsWithConstraints(imageBounds, false);
        }
      }, 100);
    }
    setTimeout(
      () => initializeHotspotSystem(
        viewer,
        state,
        componentsObj,
        handleHotspotClick,
        hotspotData
      ),
      100
    );
  });
  viewer.addHandler("zoom", () => {
    if (componentsObj.tileCleanupManager) {
      componentsObj.tileCleanupManager.setPressure("normal");
    }
    if (state.isZoomingToHotspot() && viewer.imageLoader) {
      viewer.imageLoader.clear();
    }
  });
  let isPanning = false;
  let lastPanEndTime = 0;
  viewer.addHandler("pan", () => {
    isPanning = true;
    if (componentsObj.tileCleanupManager) {
      componentsObj.tileCleanupManager.setPressure("normal");
    }
  });
  viewer.addHandler("pan-end", () => {
    isPanning = false;
    lastPanEndTime = Date.now();
    console.log("[ViewerEventHandlers] Pan ended at:", lastPanEndTime);
  });
  viewer.addHandler("canvas-click", (event) => {
    const timeSincePan = Date.now() - lastPanEndTime;
    const panBlockThreshold = isMobile() ? 250 : 300;
    if (isPanning || timeSincePan < panBlockThreshold) {
      console.log(
        `[ViewerEventHandlers] Blocking canvas-click during/after pan (${timeSincePan}ms since pan, threshold: ${panBlockThreshold}ms)`
      );
      event.preventDefaultAction = true;
    }
  });
  viewer.addHandler("tile-loaded", (event) => {
    var _a;
    if (event.tile && componentsObj.tileOptimizer) {
      const loadTime = event.tile.loadTime || ((_a = event.tiledImage) == null ? void 0 : _a.lastResetTime) || 100;
      componentsObj.tileOptimizer.trackLoadTime(loadTime);
      const tileKey = `${event.tile.level || 0}_${event.tile.x || 0}_${event.tile.y || 0}`;
      componentsObj.tileOptimizer.loadingTiles.delete(tileKey);
    }
  });
  viewer.addHandler("animation", () => {
    if (componentsObj.performanceMonitor) {
      const metrics = componentsObj.performanceMonitor.getMetrics();
      if (metrics.averageFPS < performanceConfig.debug.warnThreshold.fps) {
        const performanceMode = adjustSettingsForPerformance(
          metrics.averageFPS,
          metrics.memoryUsage
        );
        if (componentsObj.tileCleanupManager) {
          const pressureMap = {
            emergency: "critical",
            critical: "critical",
            reduced: "high",
            "memory-limited": "high",
            normal: "normal"
          };
          componentsObj.tileCleanupManager.setPressure(
            pressureMap[performanceMode] || "normal"
          );
        }
      }
    }
  });
  viewer.addHandler("animation-finish", () => {
    console.log("animation-finish fired", {
      isZoomingToHotspot: state.isZoomingToHotspot(),
      isExpandingToFullView: state.isExpandingToFullView()
    });
    if (state.isZoomingToHotspot()) {
      console.log("animation-finish: Setting isZoomingToHotspot to false");
      state.setIsZoomingToHotspot(false);
      if (componentsObj.renderer) {
        console.log("animation-finish: Calling resumeUpdates");
        componentsObj.renderer.resumeUpdates();
        componentsObj.renderer.updateVisibility();
      }
      if (componentsObj.renderOptimizer) {
        componentsObj.renderOptimizer.endCinematicZoom();
      }
      setTimeout(() => {
        if (window.lastKnownMouseX !== void 0 && componentsObj.renderer) {
          console.log("Forcing hover re-evaluation after zoom animation");
          if (componentsObj.renderer.eventCoordinator && componentsObj.renderer.eventCoordinator.forceReactivateMouseTracking) {
            componentsObj.renderer.eventCoordinator.forceReactivateMouseTracking();
          }
        }
      }, 300);
    }
  });
  viewer.addHandler("animation-start", (event) => {
    if (state.isZoomingToHotspot() && componentsObj.tileCleanupManager) {
      componentsObj.tileCleanupManager.pauseCleanup(3e3);
    }
  });
  const updateVisibleContent = () => {
    let updateTimer;
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      scheduleIdleTask(() => {
        const { viewportManager, spatialIndex } = componentsObj;
        if (!viewportManager || !spatialIndex) return;
        const viewport = viewportManager.getCurrentViewport();
        spatialIndex.queryViewport(viewport.bounds, viewport.zoom);
      });
    }, performanceConfig.viewport.updateDebounce);
  };
  viewer.addHandler("viewport-change", updateVisibleContent);
  let viewportUpdatesPaused = false;
  viewer.addHandler("animation-start", () => {
    if (isMobile() && (state.isZoomingToHotspot() || state.isExpandingToFullView())) {
      viewportUpdatesPaused = true;
      viewer.removeHandler("viewport-change", updateVisibleContent);
    }
  });
  viewer.addHandler("animation-finish", () => {
    if (viewportUpdatesPaused) {
      viewportUpdatesPaused = false;
      viewer.addHandler("viewport-change", updateVisibleContent);
      setTimeout(updateVisibleContent, 100);
    }
  });
  viewer.addHandler("canvas-click", (event) => {
    var _a;
    const eventCoordinator = (_a = componentsObj.renderer) == null ? void 0 : _a.eventCoordinator;
    if (eventCoordinator) {
      const now = Date.now();
      const recentDrag = eventCoordinator.lastDragEndTime && now - eventCoordinator.lastDragEndTime < 300;
      if (recentDrag) {
        console.log("[ViewerEventHandlers] Ignoring canvas-click after recent drag");
        return;
      }
    }
    if (!event.preventDefaultAction && componentsObj.renderer && event.quick) {
      if (componentsObj.renderer && componentsObj.renderer.stateManager) {
        componentsObj.renderer.stateManager.getAllOverlays().forEach((overlay) => {
          if (overlay.element) {
            overlay.element.removeAttribute("data-hover-preserved");
            overlay.element.removeAttribute("data-hover-maintained");
            const currentState = overlay.element.getAttribute("data-current-state");
            const hoveredHotspot = componentsObj.renderer.stateManager.getHoveredHotspot();
            const hotspotId = overlay.element.getAttribute("data-hotspot-id");
            if (currentState === "hover" && (!hoveredHotspot || hoveredHotspot.id !== hotspotId)) {
              if (componentsObj.renderer.styleManager) {
                componentsObj.renderer.styleManager.applyStyle(
                  overlay.element,
                  "standard",
                  "normal"
                );
              }
            }
          }
        });
        if (componentsObj.renderer.isAutoDeselecting) {
          componentsObj.renderer.isAutoDeselecting = false;
        }
        if (componentsObj.renderer.recentlyAutoDeselected) {
          console.log(
            "🗑️ Clearing recentlyAutoDeselected on canvas click:",
            componentsObj.renderer.recentlyAutoDeselected
          );
          componentsObj.renderer.recentlyAutoDeselected = null;
          if (componentsObj.renderer._recentlyAutoDeselectedClearTimeout) {
            clearTimeout(componentsObj.renderer._recentlyAutoDeselectedClearTimeout);
            componentsObj.renderer._recentlyAutoDeselectedClearTimeout = null;
          }
        }
      }
      if (componentsObj.renderer.selectedHotspot) {
        componentsObj.renderer.selectedHotspot = null;
        state.setSelectedHotspot(null);
        if (componentsObj.overlayManager) {
          componentsObj.overlayManager.selectHotspot(null);
        }
      }
    }
  });
  if (isMobile()) {
    viewer.addHandler("canvas-click", (event) => {
      var _a;
      const eventCoordinator = (_a = componentsObj.renderer) == null ? void 0 : _a.eventCoordinator;
      if (eventCoordinator) {
        const now = Date.now();
        const recentDrag = eventCoordinator.lastDragEndTime && now - eventCoordinator.lastDragEndTime < 300;
        if (recentDrag) {
          return;
        }
      }
      const viewerWidth = viewer.container.clientWidth;
      const viewerHeight = viewer.container.clientHeight;
      const cornerSize = 100;
      const inTopLeft = event.position.x < cornerSize && event.position.y < cornerSize;
      const inTopRight = event.position.x > viewerWidth - cornerSize && event.position.y < cornerSize;
      const inBottomLeft = event.position.x < cornerSize && event.position.y > viewerHeight - cornerSize;
      const inBottomRight = event.position.x > viewerWidth - cornerSize && event.position.y > viewerHeight - cornerSize;
      if (inTopLeft || inTopRight || inBottomLeft || inBottomRight) {
        const currentTaps = state.tapCount() + 1;
        state.setTapCount(currentTaps);
        if (state.tapTimeout()) {
          clearTimeout(state.tapTimeout());
        }
        if (currentTaps >= 3) {
          const currentLevel = state.debugLevel();
          const newLevel = currentLevel === 0 ? 1 : 0;
          state.setDebugLevel(newLevel);
          localStorage.setItem("debugLevel", newLevel.toString());
          if (componentsObj.performanceMonitor) {
            componentsObj.performanceMonitor.disableDebugOverlay();
          }
          console.log(`Debug mode: ${newLevel === 1 ? "ON" : "OFF"}`);
          state.setTapCount(0);
        } else {
          state.setTapTimeout(
            setTimeout(() => {
              state.setTapCount(0);
            }, 1e3)
          );
        }
      }
    });
  }
}
function setupAdaptiveSprings(viewer, performanceConfig2) {
  const originalSprings = {
    centerX: viewer.viewport.centerSpringX.springStiffness,
    centerY: viewer.viewport.centerSpringY.springStiffness,
    zoom: viewer.viewport.zoomSpring.springStiffness
  };
  viewer.addHandler("zoom-click", (event) => {
    if (event.quick) return;
    const currentZoom = viewer.viewport.getZoom();
    const targetZoom = event.zoom;
    const zoomDistance = Math.abs(Math.log2(targetZoom) - Math.log2(currentZoom));
    const duration = Math.min(0.8, 0.3 + zoomDistance * 0.15);
    viewer.viewport.zoomSpring.animationTime = duration;
    const stiffness = Math.max(4, 8 - zoomDistance);
    viewer.viewport.zoomSpring.springStiffness = stiffness;
    setTimeout(
      () => {
        viewer.viewport.zoomSpring.animationTime = performanceConfig2.viewer.animationTime;
        viewer.viewport.zoomSpring.springStiffness = originalSprings.zoom;
      },
      duration * 1e3 + 100
    );
  });
}
function setupKeyboardHandler(viewer, state, componentsObj) {
  const keyActions = {
    "+": () => viewer.viewport.zoomBy(performanceConfig.viewer.zoomPerScroll),
    "=": () => viewer.viewport.zoomBy(performanceConfig.viewer.zoomPerScroll),
    "-": () => viewer.viewport.zoomBy(1 / performanceConfig.viewer.zoomPerScroll),
    _: () => viewer.viewport.zoomBy(1 / performanceConfig.viewer.zoomPerScroll),
    0: () => {
      var _a;
      if ((_a = window.animations) == null ? void 0 : _a.expandToFullView) {
        window.animations.expandToFullView();
      }
    },
    f: () => viewer.viewport.fitBounds(viewer.world.getHomeBounds()),
    F: () => viewer.viewport.fitBounds(viewer.world.getHomeBounds()),
    c: () => {
      if (isMobile()) return;
      const currentLevel = state.debugLevel();
      const newLevel = currentLevel === 0 ? 1 : 0;
      state.setDebugLevel(newLevel);
      localStorage.setItem("debugLevel", newLevel.toString());
      if (componentsObj.performanceMonitor) {
        componentsObj.performanceMonitor.disableDebugOverlay();
      }
      if (componentsObj.renderer) {
        componentsObj.renderer.setDebugMode(newLevel === 1);
      }
      console.log(`Debug mode: ${newLevel === 1 ? "ON" : "OFF"}`);
    },
    h: () => {
      if (componentsObj.renderer) {
        componentsObj.renderer.toggleRevealMode();
      }
    },
    H: () => {
      if (componentsObj.renderer) {
        componentsObj.renderer.toggleRevealMode();
      }
    },
    e: () => {
      if (componentsObj.echoController) {
        if (componentsObj.echoController.config.enabled) {
          componentsObj.echoController.disable();
          console.log("Temporal Echo mode: OFF");
        } else {
          componentsObj.echoController.enable();
          console.log("Temporal Echo mode: ON");
        }
      }
    },
    E: () => {
      if (componentsObj.echoController) {
        if (componentsObj.echoController.config.enabled) {
          componentsObj.echoController.disable();
          console.log("Temporal Echo mode: OFF");
        } else {
          componentsObj.echoController.enable();
          console.log("Temporal Echo mode: ON");
        }
      }
    }
  };
  const handleKeyPress = (event) => {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.contentEditable === "true")) {
      return;
    }
    const action = keyActions[event.key];
    if (action && viewer) {
      event.preventDefault();
      action();
      viewer.viewport.applyConstraints();
    }
  };
  window.addEventListener("keydown", handleKeyPress);
  return handleKeyPress;
}
function setupResizeObserver(viewerRef, viewer, state) {
  const resizeObserver = new ResizeObserver((entries) => {
    if (!(viewer == null ? void 0 : viewer.viewport) || !viewer.isOpen()) return;
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        requestAnimationFrame(() => {
          try {
            if (viewer && viewer.viewport && viewer.isOpen()) {
              viewer.viewport.resize();
              viewer.viewport.applyConstraints();
              viewer.forceRedraw();
            }
          } catch (error) {
            if (error.message && !error.message.includes("undefined")) {
              console.warn("Resize error:", error);
            }
          }
        });
      }
    }
  });
  resizeObserver.observe(viewerRef);
  state.setComponents((prev) => ({ ...prev, resizeObserver }));
}
function scheduleIdleTask(callback) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(callback, { timeout: 200 });
  } else {
    setTimeout(callback, 50);
  }
}
function implementProgressiveZoomQuality(viewer) {
  viewer.addHandler("zoom", (event) => {
    if (viewer.drawer && viewer.drawer.context) {
      viewer.drawer.context.imageSmoothingEnabled = true;
      viewer.drawer.imageSmoothingEnabled = true;
    }
  });
  viewer.addHandler("pan", () => {
    if (viewer.drawer && viewer.drawer.context) {
      viewer.drawer.context.imageSmoothingEnabled = true;
      viewer.drawer.imageSmoothingEnabled = true;
    }
  });
  viewer.addHandler("viewport-change", () => {
    if (viewer.drawer && viewer.drawer.context) {
      viewer.drawer.context.imageSmoothingEnabled = true;
      viewer.drawer.imageSmoothingEnabled = true;
    }
  });
}
function optimizeZoomPerformance(viewer, performanceConfig2, componentsObj) {
  let zoomStartTime = null;
  let lastZoomLevel = null;
  let zoomPhase = "idle";
  let consecutiveZoomEvents = 0;
  let phaseTimeout = null;
  viewer.addHandler("zoom", (event) => {
    const currentZoom = viewer.viewport.getZoom();
    consecutiveZoomEvents++;
    if (phaseTimeout) clearTimeout(phaseTimeout);
    if (!lastZoomLevel || Math.abs(currentZoom - lastZoomLevel) > 0.01) {
      if (zoomPhase === "idle") {
        zoomPhase = "accelerating";
        zoomStartTime = performance.now();
        viewer.viewport.centerSpringX.animationTime = 0.4;
        viewer.viewport.centerSpringY.animationTime = 0.4;
        viewer.viewport.zoomSpring.animationTime = 0.4;
        if (viewer.imageLoader && consecutiveZoomEvents > 3) {
          viewer.imageLoader.jobLimit = Math.max(2, viewer.imageLoader.jobLimit - 1);
        }
      } else if (zoomPhase === "accelerating" && consecutiveZoomEvents > 5) {
        zoomPhase = "cruising";
        viewer.viewport.zoomSpring.animationTime = 0.2;
        if (viewer.imageLoader) {
          viewer.imageLoader.jobLimit = 2;
        }
      }
      lastZoomLevel = currentZoom;
    }
    phaseTimeout = setTimeout(() => {
      if (zoomPhase !== "idle") {
        zoomPhase = "decelerating";
        viewer.viewport.centerSpringX.animationTime = 0.3;
        viewer.viewport.centerSpringY.animationTime = 0.3;
        viewer.viewport.zoomSpring.animationTime = 0.3;
        if (viewer.imageLoader) {
          viewer.imageLoader.jobLimit = 3;
        }
        setTimeout(() => {
          zoomPhase = "idle";
          consecutiveZoomEvents = 0;
          if (viewer.imageLoader) {
            viewer.imageLoader.jobLimit = performanceConfig2.viewer.imageLoaderLimit;
          }
          viewer.forceRedraw();
          if (zoomStartTime) {
            performance.now() - zoomStartTime;
            zoomStartTime = null;
          }
        }, 200);
      }
    }, 100);
  });
}
async function initializeHotspotSystem(viewer, state, componentsObj, handleHotspotClick, hotspotData) {
  if (!viewer) return;
  const useCanvas2DRenderer = localStorage.getItem("useCanvas2DRenderer") === "true" || new URLSearchParams(window.location.search).get("canvas2d") === "true";
  const rendererOptions = {
    viewer,
    OpenSeadragon,
    spatialIndex: componentsObj.spatialIndex,
    onHotspotHover: state.setHoveredHotspot,
    onHotspotClick: handleHotspotClick,
    visibilityCheckInterval: performanceConfig.hotspots.visibilityCheckInterval,
    batchSize: performanceConfig.hotspots.batchSize,
    renderDebounceTime: performanceConfig.hotspots.renderDebounceTime,
    maxVisibleHotspots: performanceConfig.hotspots.maxVisibleHotspots,
    minZoomForHotspots: performanceConfig.hotspots.minZoomForHotspots,
    debugMode: state.debugLevel() === 2
  };
  let renderer;
  if (useCanvas2DRenderer) {
    console.log("Using Canvas2DRenderer for hotspot rendering (60 FPS target)");
    renderer = new Canvas2DRenderer(viewer, rendererOptions);
    if (hotspotData && hotspotData.length > 0) {
      const processedHotspots = hotspotData.map((h) => ({
        id: h.id,
        vertices: h.coordinates.map((coord) => ({ x: coord[0], y: coord[1] })),
        bounds: calculateBounds2(h.coordinates),
        metadata: h
      }));
      renderer.addHotspotsBatch(processedHotspots);
      console.log(`Added ${processedHotspots.length} hotspots to Canvas2DRenderer`);
    }
    window.canvas2DRenderer = renderer;
  } else {
    console.log("Using NativeHotspotRenderer (SVG) for hotspot rendering");
    renderer = new NativeHotspotRenderer(rendererOptions);
    window.nativeHotspotRenderer = renderer;
  }
  function calculateBounds2(coordinates) {
    if (!coordinates || coordinates.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    coordinates.forEach((coord) => {
      minX = Math.min(minX, coord[0]);
      minY = Math.min(minY, coord[1]);
      maxX = Math.max(maxX, coord[0]);
      maxY = Math.max(maxY, coord[1]);
    });
    return { minX, minY, maxX, maxY };
  }
  if (renderer.modeStateManager) {
    state.setModeStateManager(renderer.modeStateManager);
  }
  if (renderer.eventCoordinator) {
    const TemporalEchoController = (await __vitePreload(async () => {
      const { default: __vite_default__ } = await import("./TemporalEchoController-CxUXlabU.js");
      return { default: __vite_default__ };
    }, true ? __vite__mapDeps([0,1,2]) : void 0)).default;
    const echoController = new TemporalEchoController({
      viewer,
      eventCoordinator: renderer.eventCoordinator,
      hotspotRenderer: renderer,
      stateManager: renderer.stateManager,
      spatialIndex: componentsObj.spatialIndex,
      // Pass centralized Flatbush-based index
      enabled: true
      // Always enabled, but internally checks for mobile
    });
    componentsObj.echoController = echoController;
    renderer.echoController = echoController;
    window.temporalEchoController = echoController;
    const storedRevealType = localStorage.getItem("revealType");
    if (storedRevealType && storedRevealType !== echoController.config.revealType) {
      console.log(
        `[ViewerEventHandlers] Syncing reveal type from localStorage: ${storedRevealType}`
      );
      echoController.setRevealType(storedRevealType);
    }
    console.log(
      "[ViewerEventHandlers] Temporal Echo Controller initialized with reveal type:",
      echoController.config.revealType
    );
  }
  const overlayManager = window.overlayManager || (components == null ? void 0 : components.overlayManager);
  if (!overlayManager) {
    console.error(
      "[ViewerEventHandlers] No overlay manager found! This should have been created in viewerSetup.js"
    );
    return;
  }
  if (overlayManager.constructor.name === "Canvas2DOverlayManager") {
    console.log("[ViewerEventHandlers] Setting up Canvas2D spotlight callback");
    overlayManager.onSpotlightCleared = () => {
      console.log("📱 [DESELECT] Canvas2D spotlight cleared - triggering deselection");
      if (renderer && renderer.instantDeselect) {
        renderer.instantDeselect();
      }
    };
  }
  if (renderer.onHotspotClick) {
    const originalClickHandler = renderer.onHotspotClick;
    renderer.onHotspotClick = (hotspot) => {
      originalClickHandler(hotspot);
    };
  }
  state.setComponents((prev) => ({ ...prev, renderer, overlayManager }));
  console.log(`Using ${overlayManager.constructor.name} for overlay effects`);
}
export {
  setupAdaptiveSprings,
  setupKeyboardHandler,
  setupResizeObserver,
  setupViewerEventHandlers
};
