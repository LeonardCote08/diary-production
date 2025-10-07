import { O as OpenSeadragon, i as isMobile, f as getDefaultExportFromCjs, h as commonjsGlobal } from "./main-D6HH81cu.js";
const GestureStates = {
  IDLE: "idle",
  UNDETERMINED: "undetermined",
  DOUBLE_TAP_WAIT: "double_tap_wait",
  HOLD: "hold",
  PAN: "pan",
  PINCH: "pinch",
  CANCELLED: "cancelled"
};
class GestureStateMachine {
  constructor(options = {}) {
    this.config = {
      quickTapThreshold: options.quickTapThreshold || 50,
      // ms - Reduced from 200ms for snappy response
      doubleTapThreshold: options.doubleTapThreshold || 300,
      // ms
      holdThreshold: options.holdThreshold || 400,
      // ms
      movementThreshold: options.movementThreshold || 10,
      // px
      mobileMovementThreshold: options.mobileMovementThreshold || 20,
      // px
      velocityThreshold: options.velocityThreshold || 5,
      // px/frame
      debug: options.debug || false
    };
    this.state = GestureStates.IDLE;
    this.previousState = null;
    this.gestureData = null;
    this.activePointers = /* @__PURE__ */ new Map();
    this.gestureStartTime = 0;
    this.lastTapTime = 0;
    this.lastTapPosition = null;
    this.quickTapTimer = null;
    this.holdTimer = null;
    this.doubleTapTimer = null;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.callbacks = {
      onQuickTap: options.onQuickTap || (() => {
      }),
      onDoubleTap: options.onDoubleTap || (() => {
      }),
      onHoldStart: options.onHoldStart || (() => {
      }),
      onHoldEnd: options.onHoldEnd || (() => {
      }),
      onPanStart: options.onPanStart || (() => {
      }),
      onPinchStart: options.onPinchStart || (() => {
      }),
      onGestureCancel: options.onGestureCancel || (() => {
      })
    };
    this.startGesture = this.startGesture.bind(this);
    this.updateGesture = this.updateGesture.bind(this);
    this.endGesture = this.endGesture.bind(this);
    this.cancelGesture = this.cancelGesture.bind(this);
  }
  /**
   * Start gesture detection
   * @param {Object} event - Pointer/touch event data
   */
  startGesture(event) {
    const pointerId = event.pointerId || 0;
    const timestamp = performance.now();
    this.activePointers.set(pointerId, {
      startX: event.x,
      startY: event.y,
      currentX: event.x,
      currentY: event.y,
      startTime: timestamp
    });
    if (this.activePointers.size >= 2) {
      this.transitionTo(GestureStates.PINCH);
      this.callbacks.onPinchStart(this.getGestureData());
      return;
    }
    this.gestureStartTime = timestamp;
    this.gestureData = {
      startX: event.x,
      startY: event.y,
      currentX: event.x,
      currentY: event.y,
      pointerId
    };
    this.transitionTo(GestureStates.UNDETERMINED);
    this.startDetectionTimers();
    this.log("Gesture started", this.gestureData);
  }
  /**
   * Update gesture with movement
   * @param {Object} event - Pointer/touch event data
   */
  updateGesture(event) {
    const pointerId = event.pointerId || 0;
    const pointer = this.activePointers.get(pointerId);
    if (!pointer || this.state === GestureStates.IDLE) return;
    pointer.currentX = event.x;
    pointer.currentY = event.y;
    if (this.gestureData && this.gestureData.pointerId === pointerId) {
      this.gestureData.currentX = event.x;
      this.gestureData.currentY = event.y;
    }
    const deltaX = event.x - pointer.startX;
    const deltaY = event.y - pointer.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const threshold = this.isMobile ? this.config.mobileMovementThreshold : this.config.movementThreshold;
    if (distance > threshold && this.state === GestureStates.UNDETERMINED) {
      this.clearDetectionTimers();
      this.transitionTo(GestureStates.PAN);
      this.callbacks.onPanStart(this.getGestureData());
    }
  }
  /**
   * End gesture
   * @param {Object} event - Pointer/touch event data
   */
  endGesture(event) {
    const pointerId = event.pointerId || 0;
    const pointer = this.activePointers.get(pointerId);
    if (!pointer) return;
    const duration = performance.now() - pointer.startTime;
    performance.now();
    this.activePointers.delete(pointerId);
    switch (this.state) {
      case GestureStates.UNDETERMINED:
        if (duration < this.config.quickTapThreshold) {
          this.handleQuickTap(event, duration);
        } else {
          this.cancelGesture("duration_exceeded");
        }
        break;
      case GestureStates.HOLD:
        this.callbacks.onHoldEnd({
          ...this.getGestureData(),
          duration
        });
        this.transitionTo(GestureStates.IDLE);
        break;
      case GestureStates.DOUBLE_TAP_WAIT:
        break;
      default:
        this.transitionTo(GestureStates.IDLE);
    }
    if (this.activePointers.size === 0 && this.state !== GestureStates.DOUBLE_TAP_WAIT) {
      this.resetGesture();
    }
  }
  /**
   * Cancel current gesture
   * @param {string} reason - Cancellation reason
   */
  cancelGesture(reason = "unknown") {
    this.clearDetectionTimers();
    const previousState = this.state;
    this.transitionTo(GestureStates.CANCELLED);
    this.callbacks.onGestureCancel({
      previousState,
      reason,
      gestureData: this.getGestureData()
    });
    this.reset();
  }
  /**
   * Handle quick tap detection
   * @private
   */
  handleQuickTap(event, duration) {
    const currentTime = performance.now();
    const position = { x: event.x, y: event.y };
    if (this.lastTapTime && this.lastTapPosition) {
      const timeSinceLast = currentTime - this.lastTapTime;
      const distance = this.calculateDistance(
        position.x,
        position.y,
        this.lastTapPosition.x,
        this.lastTapPosition.y
      );
      if (timeSinceLast < this.config.doubleTapThreshold && distance < 50) {
        this.clearDetectionTimers();
        this.callbacks.onDoubleTap({
          ...this.getGestureData(),
          duration,
          timeBetweenTaps: timeSinceLast
        });
        this.lastTapTime = 0;
        this.lastTapPosition = null;
        this.transitionTo(GestureStates.IDLE);
        return;
      }
    }
    this.callbacks.onQuickTap({
      ...this.getGestureData(),
      duration,
      originalEvent: event.originalEvent
    });
    this.lastTapTime = currentTime;
    this.lastTapPosition = position;
    this.transitionTo(GestureStates.DOUBLE_TAP_WAIT);
    this.doubleTapTimer = setTimeout(() => {
      this.transitionTo(GestureStates.IDLE);
      this.resetGesture();
    }, this.config.doubleTapThreshold);
  }
  /**
   * Start detection timers
   * @private
   */
  startDetectionTimers() {
    this.quickTapTimer = setTimeout(() => {
      if (this.state === GestureStates.UNDETERMINED) {
        this.startHoldDetection();
      }
    }, this.config.quickTapThreshold);
  }
  /**
   * Start hold detection
   * @private
   */
  startHoldDetection() {
    const remainingTime = this.config.holdThreshold - this.config.quickTapThreshold;
    this.holdTimer = setTimeout(() => {
      if (this.state === GestureStates.UNDETERMINED) {
        this.transitionTo(GestureStates.HOLD);
        this.callbacks.onHoldStart(this.getGestureData());
      }
    }, remainingTime);
  }
  /**
   * Clear all detection timers
   * @private
   */
  clearDetectionTimers() {
    if (this.quickTapTimer) {
      clearTimeout(this.quickTapTimer);
      this.quickTapTimer = null;
    }
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.doubleTapTimer) {
      clearTimeout(this.doubleTapTimer);
      this.doubleTapTimer = null;
    }
  }
  /**
   * Transition to new state
   * @private
   */
  transitionTo(newState) {
    if (this.state === newState) return;
    this.previousState = this.state;
    this.state = newState;
    this.log(`State transition: ${this.previousState} → ${newState}`);
  }
  /**
   * Get current gesture data
   * @private
   */
  getGestureData() {
    if (!this.gestureData) return null;
    return {
      ...this.gestureData,
      state: this.state,
      duration: performance.now() - this.gestureStartTime,
      distance: this.calculateDistance(
        this.gestureData.currentX,
        this.gestureData.currentY,
        this.gestureData.startX,
        this.gestureData.startY
      )
    };
  }
  /**
   * Calculate distance between two points
   * @private
   */
  calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  /**
   * Reset state machine
   * @private
   */
  reset() {
    this.state = GestureStates.IDLE;
    this.previousState = null;
    this.gestureData = null;
    this.gestureStartTime = 0;
    this.clearDetectionTimers();
  }
  /**
   * Reset gesture data while keeping tap history
   * @private
   */
  resetGesture() {
    this.gestureData = null;
    this.gestureStartTime = 0;
    this.activePointers.clear();
    this.clearDetectionTimers();
  }
  /**
   * Debug logging
   * @private
   */
  log(...args) {
    if (this.config.debug) {
      console.log("[GestureStateMachine]", ...args);
    }
  }
  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
  /**
   * Check if gesture is active
   */
  isActive() {
    return this.state !== GestureStates.IDLE && this.state !== GestureStates.CANCELLED;
  }
  /**
   * Destroy and cleanup
   */
  destroy() {
    this.clearDetectionTimers();
    this.activePointers.clear();
    this.reset();
  }
}
class TemporalEchoGestureAdapter {
  constructor(options = {}) {
    this.eventCoordinator = options.eventCoordinator;
    this.viewer = options.viewer;
    this.onQuickTap = options.onQuickTap || (() => {
    });
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.gestureStateMachine = new GestureStateMachine({
      quickTapThreshold: 200,
      movementThreshold: this.isMobile ? 20 : 10,
      debug: window.DEBUG_GESTURES || false,
      // Callbacks
      onQuickTap: this.handleQuickTap.bind(this),
      onDoubleTap: this.handleDoubleTap.bind(this),
      onHoldStart: this.handleHoldStart.bind(this),
      onHoldEnd: this.handleHoldEnd.bind(this),
      onPanStart: this.handlePanStart.bind(this),
      onPinchStart: this.handlePinchStart.bind(this)
    });
    this.isIntercepting = false;
    this.originalHandlers = {};
    this.lastEventTime = 0;
    this.eventThrottle = 16;
    this.enabled = false;
    this.setupEventListeners();
  }
  /**
   * Setup event listeners with EventCoordinator
   */
  setupEventListeners() {
    if (!this.eventCoordinator) {
      console.warn("[TemporalEchoAdapter] No EventCoordinator provided");
      return;
    }
    this.eventCoordinator.on(
      this.eventCoordinator.eventTypes.POINTER_DOWN,
      this.handlePointerDown.bind(this)
    );
    this.eventCoordinator.on(
      this.eventCoordinator.eventTypes.POINTER_MOVE,
      this.handlePointerMove.bind(this)
    );
    this.eventCoordinator.on(
      this.eventCoordinator.eventTypes.POINTER_UP,
      this.handlePointerUp.bind(this)
    );
  }
  /**
   * Handle pointer down from EventCoordinator
   */
  handlePointerDown(event) {
    if (event.activePointers > 1) {
      this.gestureStateMachine.cancelGesture("multi_touch");
      return;
    }
    if (!this.enabled) {
      return;
    }
    this.gestureStateMachine.startGesture({
      x: event.x,
      y: event.y,
      pointerId: event.pointerId,
      originalEvent: event.event
    });
    this.isIntercepting = false;
  }
  /**
   * Handle pointer move from EventCoordinator
   */
  handlePointerMove(event) {
    const now = performance.now();
    if (now - this.lastEventTime < this.eventThrottle) {
      return;
    }
    this.lastEventTime = now;
    this.gestureStateMachine.updateGesture({
      x: event.x,
      y: event.y,
      pointerId: event.pointerId
    });
    if (this.gestureStateMachine.getState() === "pan") {
      this.isIntercepting = false;
    }
  }
  /**
   * Handle pointer up from EventCoordinator
   */
  handlePointerUp(event) {
    this.gestureStateMachine.endGesture({
      x: event.x,
      y: event.y,
      pointerId: event.pointerId,
      originalEvent: event.event
    });
    this.isIntercepting = false;
  }
  /**
   * Handle quick tap detection - trigger echo revelation
   */
  handleQuickTap(gestureData) {
    const viewportPoint = this.viewer.viewport.pointFromPixel(
      new OpenSeadragon.Point(gestureData.startX, gestureData.startY)
    );
    const handled = this.onQuickTap({
      x: gestureData.startX,
      y: gestureData.startY,
      viewportX: viewportPoint.x,
      viewportY: viewportPoint.y,
      duration: gestureData.duration
    });
    if (handled) {
      this.isIntercepting = true;
      if (gestureData.originalEvent) {
        gestureData.originalEvent.preventDefault();
        gestureData.originalEvent.stopPropagation();
      }
      this.handledQuickTap = true;
      this.lastQuickTapTime = performance.now();
      setTimeout(() => {
        this.isIntercepting = false;
        this.handledQuickTap = false;
      }, 100);
    } else {
      this.isIntercepting = false;
      this.gestureStateMachine.cancelGesture("not_handled");
    }
    return handled;
  }
  /**
   * Handle double tap - pass to OpenSeadragon for zoom
   */
  handleDoubleTap(gestureData) {
  }
  /**
   * Handle hold start - let the normal system handle holds
   */
  handleHoldStart(gestureData) {
    this.isIntercepting = false;
    this.gestureStateMachine.cancelGesture("hold_detected");
  }
  /**
   * Handle hold end
   */
  handleHoldEnd(gestureData) {
  }
  /**
   * Handle pan start - delegate to OpenSeadragon
   */
  handlePanStart(gestureData) {
    this.isIntercepting = false;
  }
  /**
   * Handle pinch start - delegate to OpenSeadragon
   */
  handlePinchStart(gestureData) {
    this.isIntercepting = false;
  }
  /**
   * Check if we should intercept current event
   */
  shouldIntercept() {
    return this.isIntercepting && this.gestureStateMachine.isActive() && this.gestureStateMachine.getState() !== "pan" && this.gestureStateMachine.getState() !== "pinch";
  }
  /**
   * Enable echo mode
   */
  enable() {
    this.enabled = true;
  }
  /**
   * Disable echo mode
   */
  disable() {
    this.enabled = false;
    this.gestureStateMachine.cancelGesture("disabled");
    this.isIntercepting = false;
  }
  /**
   * Update configuration
   */
  updateConfig(config) {
    if (config.quickTapThreshold !== void 0) {
      this.gestureStateMachine.config.quickTapThreshold = config.quickTapThreshold;
    }
    if (config.movementThreshold !== void 0) {
      this.gestureStateMachine.config.movementThreshold = config.movementThreshold;
    }
  }
  /**
   * Cleanup
   */
  destroy() {
    this.gestureStateMachine.destroy();
    this.isIntercepting = false;
  }
}
class PerformanceMonitor {
  constructor(options = {}) {
    this.targetFPS = options.targetFPS || 30;
    this.sampleRate = options.sampleRate || 100;
    this.warningThreshold = options.warningThreshold || 25;
    this.criticalThreshold = options.criticalThreshold || 20;
    this.metrics = {
      fps: {
        current: 60,
        average: 60,
        min: 60,
        max: 60,
        samples: []
      },
      frameTime: {
        current: 16.67,
        average: 16.67,
        max: 16.67,
        samples: []
      },
      memory: {
        used: 0,
        limit: 0,
        percentage: 0
      },
      ripples: {
        active: 0,
        created: 0,
        completed: 0
      }
    };
    this.performanceState = "optimal";
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.isMonitoring = false;
    this.onPerformanceChange = options.onPerformanceChange || (() => {
    });
    this.onCriticalPerformance = options.onCriticalPerformance || (() => {
    });
    console.log("[PerformanceMonitor] Initialized with target FPS:", this.targetFPS);
  }
  /**
   * Start monitoring
   */
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.rafLoop();
    this.startSampling();
    console.log("[PerformanceMonitor] Started monitoring");
  }
  /**
   * RAF loop for FPS measurement
   */
  rafLoop() {
    if (!this.isMonitoring) return;
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.metrics.frameTime.current = delta;
    this.frameCount++;
    if (delta > 0) {
      this.metrics.fps.current = Math.round(1e3 / delta);
    }
    this.lastFrameTime = now;
    requestAnimationFrame(() => this.rafLoop());
  }
  /**
   * Start metrics sampling
   */
  startSampling() {
    this.samplingInterval = setInterval(() => {
      this.sampleMetrics();
      this.evaluatePerformance();
    }, this.sampleRate);
  }
  /**
   * Sample current metrics
   */
  sampleMetrics() {
    performance.now();
    const fpsSamples = this.metrics.fps.samples;
    fpsSamples.push(this.metrics.fps.current);
    if (fpsSamples.length > 10) {
      fpsSamples.shift();
    }
    this.metrics.fps.average = Math.round(
      fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length
    );
    this.metrics.fps.min = Math.min(...fpsSamples);
    this.metrics.fps.max = Math.max(...fpsSamples);
    const frameTimeSamples = this.metrics.frameTime.samples;
    frameTimeSamples.push(this.metrics.frameTime.current);
    if (frameTimeSamples.length > 10) {
      frameTimeSamples.shift();
    }
    this.metrics.frameTime.average = frameTimeSamples.reduce((a, b) => a + b, 0) / frameTimeSamples.length;
    this.metrics.frameTime.max = Math.max(...frameTimeSamples);
    if (performance.memory) {
      this.metrics.memory.used = Math.round(performance.memory.usedJSHeapSize / 1048576);
      this.metrics.memory.limit = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
      this.metrics.memory.percentage = Math.round(
        performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100
      );
    }
  }
  /**
   * Evaluate performance state
   */
  evaluatePerformance() {
    const avgFPS = this.metrics.fps.average;
    const previousState = this.performanceState;
    if (avgFPS >= this.targetFPS) {
      this.performanceState = "optimal";
    } else if (avgFPS >= this.warningThreshold) {
      this.performanceState = "degraded";
    } else {
      this.performanceState = "critical";
    }
    if (previousState !== this.performanceState) {
      console.log(
        `[PerformanceMonitor] State changed: ${previousState} → ${this.performanceState}`
      );
      this.onPerformanceChange(this.performanceState, this.metrics);
      if (this.performanceState === "critical") {
        this.onCriticalPerformance(this.metrics);
      }
    }
    if (this.performanceState !== "optimal" && this.frameCount % 60 === 0) {
      console.warn("[PerformanceMonitor] Performance below target:", {
        state: this.performanceState,
        avgFPS,
        targetFPS: this.targetFPS
      });
    }
  }
  /**
   * Track ripple created
   */
  rippleCreated() {
    this.metrics.ripples.created++;
    this.metrics.ripples.active++;
  }
  /**
   * Track ripple completed
   */
  rippleCompleted() {
    this.metrics.ripples.completed++;
    this.metrics.ripples.active = Math.max(0, this.metrics.ripples.active - 1);
  }
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      performanceState: this.performanceState,
      isTargetMet: this.metrics.fps.average >= this.targetFPS
    };
  }
  /**
   * Get performance recommendations
   */
  getRecommendations() {
    const recommendations = [];
    if (this.performanceState === "critical") {
      recommendations.push("Reduce animation complexity");
      recommendations.push("Disable visual effects");
      recommendations.push("Limit concurrent ripples to 1");
    } else if (this.performanceState === "degraded") {
      recommendations.push("Consider reducing ripple radius");
      recommendations.push("Simplify animation easing");
    }
    if (this.metrics.memory.percentage > 80) {
      recommendations.push("High memory usage detected");
      recommendations.push("Clear completed animations");
    }
    return recommendations;
  }
  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
      this.samplingInterval = null;
    }
    console.log("[PerformanceMonitor] Stopped monitoring");
  }
  /**
   * Reset metrics
   */
  reset() {
    this.metrics.fps.samples = [];
    this.metrics.frameTime.samples = [];
    this.metrics.ripples = {
      active: 0,
      created: 0,
      completed: 0
    };
    this.frameCount = 0;
  }
  /**
   * Destroy monitor
   */
  destroy() {
    this.stop();
    this.reset();
  }
}
class CSSRippleRenderer {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.radius = options.radius || 200;
    this.duration = options.duration || 800;
    this.maxRipples = options.maxRipples || 3;
    this.onRippleComplete = options.onRippleComplete || (() => {
    });
    this.safariOptimizations = {
      useWillChange: true,
      use3DTransform: true,
      useWebkitPrefix: true,
      compositeLayerHints: true,
      // New mobile-specific optimizations
      useContainment: true,
      usePassiveListeners: true,
      reduceCompositeLayersOnMobile: isMobile()
    };
    this.container = null;
    this.activeRipples = /* @__PURE__ */ new Map();
    this.rippleIdCounter = 0;
    this.performanceMonitor = new PerformanceMonitor({
      targetFPS: 30,
      warningThreshold: 25,
      criticalThreshold: 20,
      onPerformanceChange: this.handlePerformanceChange.bind(this),
      onCriticalPerformance: this.handleCriticalPerformance.bind(this)
    });
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    console.log("[CSSRippleRenderer] Initialized", {
      safari: this.isSafari,
      iOS: this.isIOS,
      mobile: isMobile()
    });
  }
  /**
   * Initialize the renderer
   */
  initialize() {
    this.createContainer();
    this.injectStyles();
    this.performanceMonitor.start();
    console.log("[CSSRippleRenderer] Initialized container and styles");
  }
  /**
   * Create container element for ripples
   */
  createContainer() {
    if (this.container) return;
    this.container = document.createElement("div");
    this.container.className = "css-ripple-container";
    this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
            ${this.safariOptimizations.use3DTransform ? "transform: translate3d(0, 0, 0);" : ""}
            ${this.safariOptimizations.useWillChange ? "will-change: transform;" : ""}
            ${this.safariOptimizations.compositeLayerHints ? "-webkit-transform: translateZ(0);" : ""}
            ${this.safariOptimizations.useContainment ? "contain: layout style paint;" : ""}
        `;
    document.body.appendChild(this.container);
  }
  /**
   * Inject optimized CSS styles
   */
  injectStyles() {
    if (document.getElementById("css-ripple-styles")) return;
    const style = document.createElement("style");
    style.id = "css-ripple-styles";
    const rippleKeyframes = `
            @keyframes ripple-expand {
                0% {
                    transform: translate3d(-50%, -50%, 0) scale(0);
                    opacity: 1;
                }
                50% {
                    opacity: 0.8;
                }
                100% {
                    transform: translate3d(-50%, -50%, 0) scale(1);
                    opacity: 0;
                }
            }
            
            /* Simplified mobile version for better performance */
            @media (max-width: 768px) {
                @keyframes ripple-expand {
                    0% {
                        transform: translate3d(-50%, -50%, 0) scale(0);
                        opacity: 0.6;
                    }
                    100% {
                        transform: translate3d(-50%, -50%, 0) scale(1);
                        opacity: 0;
                    }
                }
            }
            
            @-webkit-keyframes ripple-expand {
                0% {
                    -webkit-transform: translate3d(-50%, -50%, 0) scale(0);
                    opacity: 1;
                }
                50% {
                    opacity: 0.8;
                }
                100% {
                    -webkit-transform: translate3d(-50%, -50%, 0) scale(1);
                    opacity: 0;
                }
            }
        `;
    const multiLayerKeyframes = `
            @keyframes ripple-outer {
                0% {
                    transform: translate3d(-50%, -50%, 0) scale(0.5);
                    opacity: 0.25;
                }
                100% {
                    transform: translate3d(-50%, -50%, 0) scale(1.2);
                    opacity: 0;
                }
            }
            
            @keyframes ripple-inner {
                0% {
                    transform: translate3d(-50%, -50%, 0) scale(0);
                    opacity: 0.5;
                }
                100% {
                    transform: translate3d(-50%, -50%, 0) scale(1);
                    opacity: 0;
                }
            }
            
            @keyframes ripple-core {
                0% {
                    transform: translate3d(-50%, -50%, 0) scale(0);
                    opacity: 0.9;
                }
                50% {
                    opacity: 0.8;
                }
                100% {
                    transform: translate3d(-50%, -50%, 0) scale(0.8);
                    opacity: 0;
                }
            }
        `;
    const rippleStyles = `
            .css-ripple {
                position: absolute;
                border-radius: 50%;
                background: transparent;
                border: 2px solid rgba(255, 255, 255, 0.8);
                /* Simplified box-shadow for better mobile performance */
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                pointer-events: none;
                ${this.safariOptimizations.use3DTransform ? "transform: translate3d(-50%, -50%, 0) scale(0);" : "transform: translate(-50%, -50%) scale(0);"}
                ${this.safariOptimizations.useWillChange ? "will-change: transform, opacity;" : ""}
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-transform: translate3d(-50%, -50%, 0) scale(0);" : ""}
                ${this.safariOptimizations.useContainment ? "contain: layout;" : ""}
                /* GPU acceleration hints */
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                perspective: 1000px;
                -webkit-perspective: 1000px;
                animation: ripple-expand ${this.duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation: ripple-expand " + this.duration + "ms cubic-bezier(0.4, 0, 0.2, 1) forwards;" : ""}
            }
            
            .css-ripple.low-performance {
                box-shadow: none;
                background: rgba(255, 255, 255, 0.3);
                animation-duration: ${this.duration * 0.7}ms;
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-duration: " + this.duration * 0.7 + "ms;" : ""}
            }
            
            /* Multi-layer ripple structure */
            .css-ripple-multi {
                position: absolute;
                pointer-events: none;
                ${this.safariOptimizations.use3DTransform ? "transform: translate3d(-50%, -50%, 0);" : "transform: translate(-50%, -50%);"}
            }
            
            .ripple-layer {
                position: absolute;
                top: 50%;
                left: 50%;
                border-radius: 50%;
                pointer-events: none;
            }
            
            .ripple-layer-outer {
                border: 1px solid rgba(255, 255, 255, 0.15);
                background: radial-gradient(circle, transparent 60%, rgba(255, 255, 255, 0.1) 100%);
                animation: ripple-outer ${this.duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            
            .ripple-layer-inner {
                border: 2px solid rgba(255, 255, 255, 0.4);
                background: transparent;
                animation: ripple-inner ${this.duration * 0.85}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            
            .ripple-layer-core {
                border: 3px solid rgba(255, 255, 255, 0.8);
                background: rgba(255, 255, 255, 0.1);
                animation: ripple-core ${this.duration * 0.7}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
        `;
    const hotspotRevealStyles = `
            /* Override any LOD or visibility class during reveal */
            .hotspot-echo-reveal.hotspot-hidden,
            .hotspot-hidden.hotspot-echo-reveal,
            .hotspot-echo-reveal.hotspot-visible,
            .hotspot-visible.hotspot-echo-reveal {
                opacity: 0 !important;
                visibility: visible !important;
                pointer-events: none !important;
                display: block !important;
            }
            
            /* Default reveal style (white/visible) - optimized duration */
            .hotspot-echo-reveal {
                visibility: visible !important;
                display: block !important;
                z-index: 1000 !important;
                pointer-events: none !important;
                /* CRITICAL: Set transform-origin to prevent position shifting */
                transform-origin: center center !important;
                -webkit-transform-origin: center center !important;
                /* GPU acceleration for mobile - removed translateZ to avoid conflicts with scale */
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                perspective: 1000px;
                -webkit-perspective: 1000px;
                /* Optimized animation */
                animation-name: hotspot-simple-fade-in !important;
                animation-duration: 0.3s !important;
                animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
                animation-fill-mode: both !important;
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-name: hotspot-simple-fade-in !important;" : ""}
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-duration: 0.3s !important;" : ""}
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;" : ""}
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-fill-mode: both !important;" : ""}
                ${this.safariOptimizations.useContainment ? "contain: layout style;" : ""}
            }
            
            /* Black mode specific styling - optimized for mobile */
            .hotspot-echo-reveal.black-mode {
                visibility: visible !important;
            }
            
            .hotspot-echo-reveal.black-mode path,
            .hotspot-echo-reveal.black-mode polygon,
            .hotspot-echo-reveal.black-mode polyline {
                stroke: #000000 !important;
                fill: none !important;
                stroke-width: 6 !important;
                /* Reduced filter complexity for better mobile performance */
                filter: drop-shadow(0 0 15px rgba(0, 0, 0, 0.7));
                animation-name: hotspot-simple-fade-in !important;
                animation-duration: 0.4s !important;
                animation-timing-function: ease-out !important;
                animation-fill-mode: both !important;
                animation-delay: inherit !important;
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-name: hotspot-simple-fade-in !important;" : ""}
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-duration: 0.4s !important;" : ""}
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-timing-function: ease-out !important;" : ""}
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-fill-mode: both !important;" : ""}
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-delay: inherit !important;" : ""}
            }
            
            /* Removed multiple glow layers for better performance on mobile */
            
            /* Ensure g elements are visible and override LOD */
            g.hotspot-echo-reveal,
            g.hotspot-echo-reveal.hotspot-hidden,
            g.hotspot-echo-reveal.hotspot-visible {
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                z-index: 1000 !important;
            }
            
            /* Override any LOD hiding during reveal */
            .hotspot-echo-reveal.hotspot-visible,
            .hotspot-visible.hotspot-echo-reveal {
                opacity: 0 !important;
                animation-name: hotspot-simple-fade-in !important;
                animation-duration: 0.6s !important;
                animation-fill-mode: forwards !important;
            }
            
            /* Force visibility for all child elements */
            .hotspot-echo-reveal path,
            .hotspot-echo-reveal polygon,
            .hotspot-echo-reveal polyline {
                visibility: visible !important;
            }
            
            /* Simple fade for default mode - with forced start from 0 */
            @keyframes hotspot-simple-fade-in {
                0% { 
                    opacity: 0 !important;
                    visibility: visible;
                }
                1% {
                    opacity: 0 !important;
                    visibility: visible;
                }
                100% { 
                    opacity: 1;
                    visibility: visible;
                }
            }
            
            @-webkit-keyframes hotspot-simple-fade-in {
                0% { 
                    opacity: 0 !important;
                    visibility: visible;
                }
                1% {
                    opacity: 0 !important;
                    visibility: visible;
                }
                100% { 
                    opacity: 1;
                    visibility: visible;
                }
            }
            
            /* Removed complex black mode animation - using simple fade for performance */
            
            /* Fade-out animation - simplified */
            .hotspot-echo-fade-out {
                animation: hotspot-simple-fade-out 0.3s ease-out forwards !important;
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation: hotspot-simple-fade-out 0.3s ease-out forwards !important;" : ""}
            }
            
            .hotspot-echo-fade-out.black-mode path {
                animation: hotspot-simple-fade-out 0.3s ease-out forwards !important;
                ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation: hotspot-simple-fade-out 0.3s ease-out forwards !important;" : ""}
            }
            
            @keyframes hotspot-simple-fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @-webkit-keyframes hotspot-simple-fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
    const adaptiveContrastStyles = `
            /* Adaptive contrast styles based on background luminance */
            .hotspot-echo-reveal.contrast-adaptive-dark path {
                stroke: rgba(255, 255, 255, 0.95) !important;
                stroke-width: 2px !important;
                filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9)) !important;
            }
            
            .hotspot-echo-reveal.contrast-adaptive-light path {
                stroke: rgba(0, 0, 0, 0.95) !important;
                stroke-width: 2px !important;
                filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.9)) !important;
            }
            
            .hotspot-echo-reveal.contrast-adaptive-medium path {
                stroke: rgba(255, 255, 255, 1) !important;
                stroke-width: 2.5px !important;
                filter: 
                    drop-shadow(0 0 2px rgba(0, 0, 0, 1))
                    drop-shadow(0 0 6px rgba(255, 255, 255, 0.9)) !important;
            }
            
            .hotspot-echo-reveal.contrast-adaptive-complex path {
                stroke: rgba(255, 255, 255, 1) !important;
                stroke-width: 3px !important;
                filter: 
                    drop-shadow(1px 1px 1px rgba(0, 0, 0, 1))
                    drop-shadow(-1px -1px 1px rgba(0, 0, 0, 1))
                    drop-shadow(0 0 8px rgba(255, 255, 255, 1)) !important;
            }
            
            /* Mobile optimizations */
            @media (max-width: 768px) {
                .hotspot-echo-reveal.contrast-adaptive-complex path {
                    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 1)) !important;
                }
                
                /* Reduce animation complexity on mobile */
                .css-ripple {
                    animation-duration: ${this.duration * 0.8}ms !important;
                }
                
                .hotspot-echo-reveal {
                    animation-duration: 0.25s !important;
                    ${this.safariOptimizations.useWebkitPrefix ? "-webkit-animation-duration: 0.25s !important;" : ""}
                }
                
                /* Force layer creation for smoother animations */
                .css-ripple {
                    transform: translate3d(0, 0, 0);
                    -webkit-transform: translate3d(0, 0, 0);
                }
                
                /* Hotspots use will-change instead to avoid transform conflicts */
                .hotspot-echo-reveal {
                    will-change: transform, opacity;
                    transform-origin: center center !important;
                    -webkit-transform-origin: center center !important;
                }
            }
        `;
    style.textContent = rippleKeyframes + multiLayerKeyframes + rippleStyles + hotspotRevealStyles + adaptiveContrastStyles;
    document.head.appendChild(style);
  }
  /**
   * Create a ripple animation at the specified coordinates
   */
  createRipple(x, y, useMultiLayer = false) {
    if (useMultiLayer) {
      return this.createMultiLayerRipple(x, y);
    }
    if (this.activeRipples.size >= this.maxRipples) {
      const oldestRipple = this.activeRipples.values().next().value;
      if (oldestRipple) {
        this.removeRipple(oldestRipple.id);
      }
    }
    const rippleId = `ripple-${this.rippleIdCounter++}`;
    const ripple = document.createElement("div");
    ripple.className = "css-ripple";
    ripple.id = rippleId;
    const metrics = this.performanceMonitor.getMetrics();
    if (metrics.performanceState !== "optimal") {
      ripple.classList.add("low-performance");
    }
    const diameter = this.radius * 2;
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    this.container.appendChild(ripple);
    this.activeRipples.set(rippleId, {
      id: rippleId,
      element: ripple,
      startTime: performance.now()
    });
    setTimeout(() => {
      this.removeRipple(rippleId);
    }, this.duration);
    this.performanceMonitor.rippleCreated();
    console.log("[CSSRippleRenderer] Created ripple at", { x, y }, "id:", rippleId);
    return rippleId;
  }
  /**
   * Create a multi-layer ripple effect
   */
  createMultiLayerRipple(x, y) {
    if (this.activeRipples.size >= this.maxRipples) {
      const oldestRipple = this.activeRipples.values().next().value;
      if (oldestRipple) {
        this.removeRipple(oldestRipple.id);
      }
    }
    const rippleId = `ripple-multi-${this.rippleIdCounter++}`;
    const container = document.createElement("div");
    container.className = "css-ripple-multi";
    container.id = rippleId;
    const layers = [
      { class: "ripple-layer ripple-layer-outer", size: this.radius * 2.2 },
      { class: "ripple-layer ripple-layer-inner", size: this.radius * 2 },
      { class: "ripple-layer ripple-layer-core", size: this.radius * 1.5 }
    ];
    layers.forEach((layer) => {
      const layerEl = document.createElement("div");
      layerEl.className = layer.class;
      layerEl.style.width = `${layer.size}px`;
      layerEl.style.height = `${layer.size}px`;
      container.appendChild(layerEl);
    });
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    this.container.appendChild(container);
    this.activeRipples.set(rippleId, {
      id: rippleId,
      element: container,
      startTime: performance.now()
    });
    setTimeout(() => {
      this.removeRipple(rippleId);
    }, this.duration);
    this.performanceMonitor.rippleCreated();
    console.log("[CSSRippleRenderer] Created multi-layer ripple at", { x, y }, "id:", rippleId);
    return rippleId;
  }
  /**
   * Remove a ripple
   */
  removeRipple(rippleId) {
    const rippleData = this.activeRipples.get(rippleId);
    if (!rippleData) return;
    if (rippleData.element && rippleData.element.parentNode) {
      rippleData.element.remove();
    }
    this.activeRipples.delete(rippleId);
    this.performanceMonitor.rippleCompleted();
    this.onRippleComplete(rippleId);
  }
  /**
   * Handle performance state changes
   */
  handlePerformanceChange(state, metrics) {
    console.log(`[CSSRippleRenderer] Performance state: ${state}`, metrics.fps);
    if (state === "critical") {
      this.maxRipples = 1;
      this.duration = 600;
    } else if (state === "degraded") {
      this.maxRipples = 2;
      this.duration = 700;
    } else {
      this.maxRipples = 3;
      this.duration = 800;
    }
  }
  /**
   * Handle critical performance
   */
  handleCriticalPerformance(metrics) {
    console.warn("[CSSRippleRenderer] Critical performance detected!", metrics);
    if (this.activeRipples.size > 1) {
      const ripplesToRemove = Array.from(this.activeRipples.keys()).slice(0, -1);
      ripplesToRemove.forEach((id) => this.removeRipple(id));
    }
  }
  /**
   * Get current FPS
   */
  getFPS() {
    const metrics = this.performanceMonitor.getMetrics();
    return metrics.fps.current;
  }
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }
  /**
   * Cleanup resources
   */
  cleanup() {
    this.activeRipples.forEach((rippleData) => {
      if (rippleData.element && rippleData.element.parentNode) {
        rippleData.element.remove();
      }
    });
    this.activeRipples.clear();
    this.performanceMonitor.stop();
  }
  /**
   * Destroy the renderer
   */
  destroy() {
    this.cleanup();
    this.performanceMonitor.destroy();
    if (this.container && this.container.parentNode) {
      this.container.remove();
      this.container = null;
    }
    const styleElement = document.getElementById("css-ripple-styles");
    if (styleElement) {
      styleElement.remove();
    }
    console.log("[CSSRippleRenderer] Destroyed");
  }
}
class CanvasHotspotRenderer {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.container = options.container || this.viewer.container;
    this.config = {
      animationDuration: 600,
      // Total animation time
      rippleDuration: 400,
      // Ripple effect duration
      fadeInDuration: 300,
      // Hotspot fade in
      staggerDelay: 30,
      // Delay between hotspot reveals
      maxHotspots: 8,
      // Mobile limit
      dpr: Math.min(window.devicePixelRatio || 1, 2)
      // Cap DPR at 2 for mobile
    };
    this.canvas = null;
    this.ctx = null;
    this.isAnimating = false;
    this.animations = [];
    this.animationFrame = null;
    this.viewportHandler = null;
    this.initialize();
  }
  /**
   * Initialize Canvas with proper settings
   */
  initialize() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "temporal-echo-canvas";
    this.canvas.id = "temporal-echo-canvas";
    this.ctx = this.canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
      // Better performance on Chrome
      willReadFrequently: false
    });
    this.updateCanvasSize();
    Object.assign(this.canvas.style, {
      position: "fixed",
      // Use fixed to ensure visibility
      top: "0",
      left: "0",
      pointerEvents: "none",
      // Pass events through
      zIndex: "2147483647",
      // Maximum z-index
      opacity: "0",
      // Hidden initially
      display: "block",
      transform: "translateZ(0)",
      // Force GPU layer
      willChange: "opacity"
      // Remove transition for immediate visibility during debug
      // transition: 'opacity 200ms ease-out',
    });
    document.body.appendChild(this.canvas);
    this.setupViewportSync();
    this.resizeHandler = () => this.updateCanvasSize();
    window.addEventListener("resize", this.resizeHandler);
    const size = this.canvas.getBoundingClientRect();
    console.log(
      "[CanvasHotspotRenderer] Initialized with size:",
      size.width,
      "x",
      size.height,
      "DPR:",
      this.config.dpr
    );
    console.log(
      "[CanvasHotspotRenderer] Canvas attached to:",
      this.canvas.parentElement.tagName
    );
  }
  /**
   * Update canvas size to match window
   */
  updateCanvasSize() {
    const width = document.documentElement.clientWidth || window.innerWidth;
    const height = document.documentElement.clientHeight || window.innerHeight;
    this.canvas.width = width * this.config.dpr;
    this.canvas.height = height * this.config.dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    this.ctx.scale(this.config.dpr, this.config.dpr);
    console.log("[CanvasHotspotRenderer] Canvas resized to:", width, "x", height);
  }
  /**
   * Setup synchronization with OpenSeadragon viewport
   */
  setupViewportSync() {
    if (!this.viewer) return;
    this.viewportHandler = () => {
      if (this.isAnimating) {
        this.updateCanvasTransform();
      }
    };
    this.viewer.addHandler("update-viewport", this.viewportHandler);
  }
  /**
   * Update canvas position to match viewport
   */
  updateCanvasTransform() {
  }
  /**
   * Start reveal animation for hotspots
   * @param {Array} hotspots - Hotspots to reveal with image coordinates
   * @param {Object} tapPoint - Tap position in image coordinates
   */
  startRevealAnimation(hotspots, tapPoint) {
    var _a;
    if (this.isAnimating) {
      console.warn("[CanvasHotspotRenderer] Animation already in progress");
      return;
    }
    console.log("[CanvasHotspotRenderer] Starting reveal for", hotspots.length, "hotspots");
    console.log("[CanvasHotspotRenderer] Tap point:", tapPoint);
    console.log("[CanvasHotspotRenderer] Canvas visibility check:", {
      display: this.canvas.style.display,
      opacity: this.canvas.style.opacity,
      zIndex: this.canvas.style.zIndex,
      parentElement: (_a = this.canvas.parentElement) == null ? void 0 : _a.tagName,
      canvasRect: this.canvas.getBoundingClientRect(),
      computed: window.getComputedStyle(this.canvas)
    });
    this.isAnimating = true;
    this.animations = [];
    this.canvas.style.opacity = "1";
    this.canvas.style.display = "block";
    console.log(
      "[CanvasHotspotRenderer] Starting animation for",
      hotspots.length,
      "hotspots at tap point:",
      tapPoint
    );
    const startTime = performance.now();
    this.animations.push({
      type: "ripple",
      center: this.imageToCanvas(tapPoint),
      startTime,
      duration: this.config.rippleDuration,
      maxRadius: 200
      // pixels
    });
    hotspots.forEach((hotspot, index) => {
      const center = this.calculateCenter(hotspot);
      this.animations.push({
        type: "hotspot",
        center: this.imageToCanvas(center),
        startTime: startTime + index * this.config.staggerDelay,
        duration: this.config.fadeInDuration,
        hotspot,
        radius: 20
        // Base radius for hotspot indicator
      });
    });
    this.animate();
    setTimeout(() => {
      this.transitionToSVG(hotspots);
    }, this.config.animationDuration);
  }
  /**
   * Animation loop
   */
  animate() {
    const now = performance.now();
    this.ctx.clearRect(
      0,
      0,
      this.canvas.width / this.config.dpr,
      this.canvas.height / this.config.dpr
    );
    let hasActiveAnimations = false;
    this.animations.forEach((anim) => {
      const elapsed = now - anim.startTime;
      if (elapsed < 0) {
        hasActiveAnimations = true;
        return;
      }
      if (elapsed > anim.duration) {
        return;
      }
      hasActiveAnimations = true;
      const progress = elapsed / anim.duration;
      if (anim.type === "ripple") {
        this.drawRipple(anim, progress);
      } else if (anim.type === "hotspot") {
        this.drawHotspot(anim, progress);
      }
    });
    if (hasActiveAnimations) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }
  /**
   * Draw ripple effect
   */
  drawRipple(anim, progress) {
    const radius = anim.maxRadius * this.easeOutCubic(progress);
    const opacity = 0.3 * (1 - progress);
    this.ctx.save();
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(anim.center.x, anim.center.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }
  /**
   * Draw hotspot indicator
   */
  drawHotspot(anim, progress) {
    const scale = 0.8 + 0.2 * this.easeOutBack(progress);
    const opacity = this.easeInOutCubic(progress);
    this.ctx.save();
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    this.ctx.lineWidth = 2;
    const radius = anim.radius * scale;
    this.ctx.beginPath();
    this.ctx.arc(anim.center.x, anim.center.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    if (progress > 0.3) {
      const glowOpacity = opacity * 0.3;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${glowOpacity})`;
      this.ctx.beginPath();
      this.ctx.arc(anim.center.x, anim.center.y, radius * 0.7, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }
  /**
   * Transition from Canvas to SVG
   */
  transitionToSVG(hotspots) {
    console.log("[CanvasHotspotRenderer] Transitioning to SVG for interaction");
    setTimeout(() => {
      this.cleanup();
      this.canvas.style.opacity = "0";
    }, 2e3);
  }
  /**
   * Clean up after animation
   */
  cleanup() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    const width = this.canvas.width / this.config.dpr;
    const height = this.canvas.height / this.config.dpr;
    this.ctx.clearRect(0, 0, width, height);
    this.isAnimating = false;
    this.animations = [];
    console.log("[CanvasHotspotRenderer] Cleanup complete");
  }
  /**
   * Convert image coordinates to canvas coordinates
   */
  imageToCanvas(imagePoint) {
    if (!this.viewer || !imagePoint) {
      console.warn("[CanvasHotspotRenderer] Invalid viewer or imagePoint");
      return { x: 200, y: 200 };
    }
    try {
      const point = imagePoint.x !== void 0 ? imagePoint : { x: imagePoint, y: 0 };
      const viewportPoint = this.viewer.viewport.imageToViewportCoordinates(point.x, point.y);
      const pixelPoint = this.viewer.viewport.pixelFromPoint(viewportPoint);
      const viewerRect = this.viewer.container.getBoundingClientRect();
      const canvasX = pixelPoint.x + viewerRect.left;
      const canvasY = pixelPoint.y + viewerRect.top;
      console.log("[CanvasHotspotRenderer] Coordinate conversion:", {
        imagePoint: point,
        viewportPoint,
        pixelPoint,
        viewerRect: { left: viewerRect.left, top: viewerRect.top },
        canvasCoords: { x: canvasX, y: canvasY }
      });
      return {
        x: canvasX,
        y: canvasY
      };
    } catch (e) {
      console.error("[CanvasHotspotRenderer] Conversion error:", e);
      return { x: 200, y: 200 };
    }
  }
  /**
   * Calculate center point for hotspot
   */
  calculateCenter(hotspot) {
    const data = hotspot.hotspot || hotspot;
    if (data.center) return data.center;
    if (data.coordinates && Array.isArray(data.coordinates)) {
      let sumX = 0, sumY = 0;
      let count = 0;
      for (const coord of data.coordinates) {
        if (Array.isArray(coord) && coord.length >= 2) {
          sumX += coord[0];
          sumY += coord[1];
          count++;
        }
      }
      if (count > 0) {
        return {
          x: sumX / count,
          y: sumY / count
        };
      }
    }
    const bbox = data.bbox || data.bounds;
    if (bbox) {
      if (bbox.minX !== void 0) {
        return {
          x: (bbox.minX + bbox.maxX) / 2,
          y: (bbox.minY + bbox.maxY) / 2
        };
      } else if (bbox.x !== void 0) {
        return {
          x: bbox.x + (bbox.width || 0) / 2,
          y: bbox.y + (bbox.height || 0) / 2
        };
      }
    }
    if (data.x !== void 0 && data.y !== void 0) {
      return { x: data.x, y: data.y };
    }
    console.warn("[CanvasHotspotRenderer] Could not calculate center for hotspot:", hotspot);
    return { x: 200, y: 200 };
  }
  /**
   * Easing functions
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  /**
   * Destroy renderer
   */
  destroy() {
    if (this.viewer && this.viewportHandler) {
      this.viewer.removeHandler("update-viewport", this.viewportHandler);
    }
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
    this.cleanup();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    console.log("[CanvasHotspotRenderer] Destroyed");
  }
}
class CanvasHitDetector {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.spatialIndex = options.spatialIndex;
    this.config = {
      canvasSize: 512,
      // Off-screen canvas size (lower = faster, less accurate)
      updateThreshold: 100,
      // ms between canvas updates
      enabled: options.enabled !== false,
      dpr: 1
      // Use 1 for hit detection (don't need high DPR)
    };
    this.hitCanvas = null;
    this.hitCtx = null;
    this.colorMap = /* @__PURE__ */ new Map();
    this.lastUpdate = 0;
    this.isDirty = true;
    this.currentBounds = null;
    this.metrics = {
      lastHitTime: 0,
      averageHitTime: 0,
      hitCount: 0,
      lastRenderTime: 0
    };
    if (this.config.enabled) {
      this.initialize();
    }
  }
  /**
   * Initialize off-screen canvas
   */
  initialize() {
    this.hitCanvas = document.createElement("canvas");
    this.hitCanvas.width = this.config.canvasSize;
    this.hitCanvas.height = this.config.canvasSize;
    this.hitCtx = this.hitCanvas.getContext("2d", {
      alpha: false,
      // No alpha needed
      willReadFrequently: true,
      // Optimize for pixel reads
      desynchronized: false
      // We need sync reads
    });
    this.hitCtx.fillStyle = "#000000";
    this.hitCtx.fillRect(0, 0, this.config.canvasSize, this.config.canvasSize);
    if (this.viewer) {
      this.viewportHandler = () => {
        this.markDirty();
      };
      this.viewer.addHandler("viewport-change", this.viewportHandler);
    }
    console.log("[CanvasHitDetector] Initialized with", this.config.canvasSize, "px canvas");
  }
  /**
   * Mark canvas as needing update
   */
  markDirty() {
    this.isDirty = true;
  }
  /**
   * Update hit detection canvas if needed
   */
  updateHitCanvas(bounds) {
    const now = performance.now();
    if (!this.isDirty && this.currentBounds && this.boundsEqual(bounds, this.currentBounds) && now - this.lastUpdate < this.config.updateThreshold) {
      return;
    }
    const startTime = performance.now();
    this.hitCtx.fillStyle = "#000000";
    this.hitCtx.fillRect(0, 0, this.config.canvasSize, this.config.canvasSize);
    this.colorMap.clear();
    if (!this.spatialIndex) {
      console.warn("[CanvasHitDetector] No spatial index available");
      return;
    }
    const hotspots = this.spatialIndex.queryViewport(bounds);
    let colorIndex = 1;
    for (const hotspot of hotspots) {
      if (!hotspot.coordinates) continue;
      const color = this.indexToColor(colorIndex);
      this.colorMap.set(color, hotspot.id);
      this.drawHotspot(hotspot, color, bounds);
      colorIndex++;
      if (colorIndex > 16777215) break;
    }
    this.isDirty = false;
    this.currentBounds = { ...bounds };
    this.lastUpdate = now;
    const renderTime = performance.now() - startTime;
    this.metrics.lastRenderTime = renderTime;
    if (renderTime > 10) {
      console.warn(
        `[CanvasHitDetector] Slow render: ${renderTime.toFixed(2)}ms for ${hotspots.length} hotspots`
      );
    } else {
      console.log(
        `[CanvasHitDetector] Canvas updated in ${renderTime.toFixed(2)}ms for ${hotspots.length} hotspots`
      );
    }
  }
  /**
   * Draw hotspot on hit canvas
   */
  drawHotspot(hotspot, color, bounds) {
    const ctx = this.hitCtx;
    const size = this.config.canvasSize;
    ctx.fillStyle = color;
    ctx.beginPath();
    const coords = hotspot.coordinates;
    if (hotspot.shape === "polygon") {
      for (let i = 0; i < coords.length; i++) {
        const x = (coords[i][0] - bounds.minX) / (bounds.maxX - bounds.minX) * size;
        const y = (coords[i][1] - bounds.minY) / (bounds.maxY - bounds.minY) * size;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    } else if (hotspot.shape === "multipolygon") {
      const polygon = coords[0];
      for (let i = 0; i < polygon.length; i++) {
        const x = (polygon[i][0] - bounds.minX) / (bounds.maxX - bounds.minX) * size;
        const y = (polygon[i][1] - bounds.minY) / (bounds.maxY - bounds.minY) * size;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.closePath();
    ctx.fill();
  }
  /**
   * Fast hit detection at point
   * Target: < 2ms
   */
  detectHit(imageX, imageY, bounds) {
    const startTime = performance.now();
    this.updateHitCanvas(bounds);
    const size = this.config.canvasSize;
    const canvasX = Math.floor((imageX - bounds.minX) / (bounds.maxX - bounds.minX) * size);
    const canvasY = Math.floor((imageY - bounds.minY) / (bounds.maxY - bounds.minY) * size);
    if (canvasX < 0 || canvasX >= size || canvasY < 0 || canvasY >= size) {
      return null;
    }
    const pixelData = this.hitCtx.getImageData(canvasX, canvasY, 1, 1).data;
    const color = this.rgbToColor(pixelData[0], pixelData[1], pixelData[2]);
    const hotspotId = this.colorMap.get(color);
    const hitTime = performance.now() - startTime;
    this.metrics.lastHitTime = hitTime;
    this.metrics.hitCount++;
    this.metrics.averageHitTime = (this.metrics.averageHitTime * (this.metrics.hitCount - 1) + hitTime) / this.metrics.hitCount;
    if (hitTime > 2) {
      console.warn(`[CanvasHitDetector] Slow hit detection: ${hitTime.toFixed(2)}ms`);
    }
    return hotspotId || null;
  }
  /**
   * Find nearby hotspots using canvas sampling
   * More efficient than spatial index for dense areas
   */
  findNearbyHits(imageX, imageY, radius, bounds, maxResults = 10) {
    const startTime = performance.now();
    this.updateHitCanvas(bounds);
    const size = this.config.canvasSize;
    const centerX = (imageX - bounds.minX) / (bounds.maxX - bounds.minX) * size;
    const centerY = (imageY - bounds.minY) / (bounds.maxY - bounds.minY) * size;
    const radiusCanvas = radius / (bounds.maxX - bounds.minX) * size;
    const nearbyHotspots = /* @__PURE__ */ new Map();
    const samples = this.generateSpiralSamples(centerX, centerY, radiusCanvas, 32);
    for (const [x, y] of samples) {
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const pixelData = this.hitCtx.getImageData(x, y, 1, 1).data;
      const color = this.rgbToColor(pixelData[0], pixelData[1], pixelData[2]);
      const hotspotId = this.colorMap.get(color);
      if (hotspotId && !nearbyHotspots.has(hotspotId)) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        nearbyHotspots.set(hotspotId, distance);
      }
      if (nearbyHotspots.size >= maxResults) break;
    }
    const sorted = Array.from(nearbyHotspots.entries()).sort((a, b) => a[1] - b[1]).slice(0, maxResults).map((entry) => entry[0]);
    const searchTime = performance.now() - startTime;
    console.log(
      `[CanvasHitDetector] Found ${sorted.length} nearby hotspots in ${searchTime.toFixed(2)}ms`
    );
    return sorted;
  }
  /**
   * Generate spiral sampling pattern
   */
  generateSpiralSamples(centerX, centerY, radius, numSamples) {
    const samples = [];
    const angleStep = 2 * Math.PI / 8;
    const radiusStep = radius / 4;
    samples.push([Math.floor(centerX), Math.floor(centerY)]);
    for (let r = radiusStep; r <= radius; r += radiusStep) {
      for (let a = 0; a < 2 * Math.PI; a += angleStep) {
        const x = Math.floor(centerX + r * Math.cos(a));
        const y = Math.floor(centerY + r * Math.sin(a));
        samples.push([x, y]);
      }
    }
    return samples;
  }
  /**
   * Convert index to RGB color string
   */
  indexToColor(index) {
    const r = index >> 16 & 255;
    const g = index >> 8 & 255;
    const b = index & 255;
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  /**
   * Convert RGB to color string
   */
  rgbToColor(r, g, b) {
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  /**
   * Check if bounds are equal
   */
  boundsEqual(a, b) {
    return a.minX === b.minX && a.minY === b.minY && a.maxX === b.maxX && a.maxY === b.maxY;
  }
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      colorMapSize: this.colorMap.size,
      canvasSize: this.config.canvasSize
    };
  }
  /**
   * Debug: Get canvas as data URL
   */
  getDebugCanvas() {
    return this.hitCanvas.toDataURL();
  }
  /**
   * Enable/disable hit detector
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    if (enabled && !this.hitCanvas) {
      this.initialize();
    }
  }
  /**
   * Destroy detector
   */
  destroy() {
    if (this.viewer && this.viewportHandler) {
      this.viewer.removeHandler("viewport-change", this.viewportHandler);
    }
    if (this.hitCanvas) {
      this.hitCanvas.width = 0;
      this.hitCanvas.height = 0;
      this.hitCanvas = null;
      this.hitCtx = null;
    }
    this.colorMap.clear();
    console.log("[CanvasHitDetector] Destroyed");
  }
}
var fastdom$1 = { exports: {} };
(function(module) {
  !function(win) {
    var debug = function() {
    };
    var raf = win.requestAnimationFrame || win.webkitRequestAnimationFrame || win.mozRequestAnimationFrame || win.msRequestAnimationFrame || function(cb) {
      return setTimeout(cb, 16);
    };
    function FastDom() {
      var self = this;
      self.reads = [];
      self.writes = [];
      self.raf = raf.bind(win);
    }
    FastDom.prototype = {
      constructor: FastDom,
      /**
       * We run this inside a try catch
       * so that if any jobs error, we
       * are able to recover and continue
       * to flush the batch until it's empty.
       *
       * @param {Array} tasks
       */
      runTasks: function(tasks) {
        var task;
        while (task = tasks.shift()) task();
      },
      /**
       * Adds a job to the read batch and
       * schedules a new frame if need be.
       *
       * @param  {Function} fn
       * @param  {Object} ctx the context to be bound to `fn` (optional).
       * @public
       */
      measure: function(fn, ctx) {
        var task = !ctx ? fn : fn.bind(ctx);
        this.reads.push(task);
        scheduleFlush(this);
        return task;
      },
      /**
       * Adds a job to the
       * write batch and schedules
       * a new frame if need be.
       *
       * @param  {Function} fn
       * @param  {Object} ctx the context to be bound to `fn` (optional).
       * @public
       */
      mutate: function(fn, ctx) {
        var task = !ctx ? fn : fn.bind(ctx);
        this.writes.push(task);
        scheduleFlush(this);
        return task;
      },
      /**
       * Clears a scheduled 'read' or 'write' task.
       *
       * @param {Object} task
       * @return {Boolean} success
       * @public
       */
      clear: function(task) {
        return remove(this.reads, task) || remove(this.writes, task);
      },
      /**
       * Extend this FastDom with some
       * custom functionality.
       *
       * Because fastdom must *always* be a
       * singleton, we're actually extending
       * the fastdom instance. This means tasks
       * scheduled by an extension still enter
       * fastdom's global task queue.
       *
       * The 'super' instance can be accessed
       * from `this.fastdom`.
       *
       * @example
       *
       * var myFastdom = fastdom.extend({
       *   initialize: function() {
       *     // runs on creation
       *   },
       *
       *   // override a method
       *   measure: function(fn) {
       *     // do extra stuff ...
       *
       *     // then call the original
       *     return this.fastdom.measure(fn);
       *   },
       *
       *   ...
       * });
       *
       * @param  {Object} props  properties to mixin
       * @return {FastDom}
       */
      extend: function(props) {
        if (typeof props != "object") throw new Error("expected object");
        var child = Object.create(this);
        mixin(child, props);
        child.fastdom = this;
        if (child.initialize) child.initialize();
        return child;
      },
      // override this with a function
      // to prevent Errors in console
      // when tasks throw
      catch: null
    };
    function scheduleFlush(fastdom2) {
      if (!fastdom2.scheduled) {
        fastdom2.scheduled = true;
        fastdom2.raf(flush.bind(null, fastdom2));
      }
    }
    function flush(fastdom2) {
      var writes = fastdom2.writes;
      var reads = fastdom2.reads;
      var error;
      try {
        debug("flushing reads", reads.length);
        fastdom2.runTasks(reads);
        debug("flushing writes", writes.length);
        fastdom2.runTasks(writes);
      } catch (e) {
        error = e;
      }
      fastdom2.scheduled = false;
      if (reads.length || writes.length) scheduleFlush(fastdom2);
      if (error) {
        debug("task errored", error.message);
        if (fastdom2.catch) fastdom2.catch(error);
        else throw error;
      }
    }
    function remove(array, item) {
      var index = array.indexOf(item);
      return !!~index && !!array.splice(index, 1);
    }
    function mixin(target, source) {
      for (var key in source) {
        if (source.hasOwnProperty(key)) target[key] = source[key];
      }
    }
    var exports = win.fastdom = win.fastdom || new FastDom();
    module.exports = exports;
  }(typeof window !== "undefined" ? window : typeof commonjsGlobal != "undefined" ? commonjsGlobal : globalThis);
})(fastdom$1);
var fastdomExports = fastdom$1.exports;
const fastdom = /* @__PURE__ */ getDefaultExportFromCjs(fastdomExports);
class BatchDOMManager {
  constructor() {
    this.pendingReads = [];
    this.pendingWrites = [];
    this.activeOperations = /* @__PURE__ */ new Set();
    this.metrics = {
      lastBatchTime: 0,
      averageBatchTime: 0,
      batchCount: 0
    };
    console.log("[BatchDOMManager] Initialized for Phase 3 optimization");
  }
  /**
   * Batch reveal multiple hotspots efficiently
   * Single batch operation instead of individual updates
   */
  batchRevealHotspots(elements, options = {}) {
    const startTime = performance.now();
    const { staggerDelay = 30, revealDuration = 2e3, borderStyle = "default" } = options;
    console.log(`[BatchDOMManager] Batching reveal for ${elements.length} hotspots`);
    const measurements = new Array(elements.length);
    elements.forEach((element, index) => {
      fastdom.measure(() => {
        measurements[index] = {
          element,
          originalOpacity: element.style.opacity || "",
          originalVisibility: element.style.visibility || "",
          wasHidden: element.classList.contains("hotspot-hidden"),
          wasVisible: element.classList.contains("hotspot-visible"),
          currentTransform: window.getComputedStyle(element).transform,
          rect: element.getBoundingClientRect()
        };
      });
    });
    fastdom.mutate(() => {
      elements.forEach((element, index) => {
        const delay = index * staggerDelay;
        const cssText = `
                    opacity: 1;
                    visibility: visible;
                    display: block;
                    animation-delay: ${delay}ms;
                    transform-origin: center center;
                    will-change: transform, opacity;
                `;
        element.style.cssText += cssText;
        element.classList.remove("hotspot-hidden");
        element.classList.add("hotspot-visible", "hotspot-echo-reveal");
        if (borderStyle !== "default") {
          element.classList.add(`border-${borderStyle}`);
        }
        element.setAttribute("data-hotspot-revealed", "true");
        this.activeOperations.add({
          element,
          measurement: measurements[index],
          borderStyle
        });
      });
      const batchTime = performance.now() - startTime;
      this.updateMetrics(batchTime);
      console.log(`[BatchDOMManager] Batch reveal completed in ${batchTime.toFixed(2)}ms`);
      this.scheduleBatchHide(revealDuration);
    });
  }
  /**
   * Batch hide all revealed hotspots
   */
  scheduleBatchHide(duration) {
    setTimeout(() => {
      this.batchHideHotspots();
    }, duration);
  }
  /**
   * Efficiently hide all active hotspots
   */
  batchHideHotspots() {
    if (this.activeOperations.size === 0) return;
    const startTime = performance.now();
    const operations = Array.from(this.activeOperations);
    console.log(`[BatchDOMManager] Batching hide for ${operations.length} hotspots`);
    fastdom.mutate(() => {
      operations.forEach(({ element, measurement, borderStyle }) => {
        element.classList.remove(
          "hotspot-echo-reveal",
          "hotspot-echo-active",
          "hotspot-echo-fade-out"
        );
        if (borderStyle !== "default") {
          element.classList.remove(`border-${borderStyle}`);
        }
        element.style.opacity = measurement.originalOpacity;
        element.style.visibility = measurement.originalVisibility;
        element.style.display = "";
        element.style.animationDelay = "";
        element.style.willChange = "auto";
        if (measurement.wasHidden) {
          element.classList.add("hotspot-hidden");
        }
        if (!measurement.wasVisible) {
          element.classList.remove("hotspot-visible");
        }
        element.removeAttribute("data-hotspot-revealed");
      });
      this.activeOperations.clear();
      const batchTime = performance.now() - startTime;
      console.log(`[BatchDOMManager] Batch hide completed in ${batchTime.toFixed(2)}ms`);
    });
  }
  /**
   * Batch update visibility for multiple elements
   */
  batchUpdateVisibility(updates) {
    const startTime = performance.now();
    fastdom.mutate(() => {
      updates.forEach(({ element, visible }) => {
        if (visible) {
          element.style.opacity = "1";
          element.style.visibility = "visible";
          element.classList.remove("hotspot-hidden");
          element.classList.add("hotspot-visible");
        } else {
          element.style.opacity = "0";
          element.style.visibility = "hidden";
          element.classList.add("hotspot-hidden");
          element.classList.remove("hotspot-visible");
        }
      });
      const updateTime = performance.now() - startTime;
      console.log(
        `[BatchDOMManager] Visibility update for ${updates.length} elements in ${updateTime.toFixed(2)}ms`
      );
    });
  }
  /**
   * Batch apply transforms
   */
  batchApplyTransforms(transforms) {
    fastdom.mutate(() => {
      transforms.forEach(({ element, transform }) => {
        element.style.transform = transform;
        element.style.webkitTransform = transform;
      });
    });
  }
  /**
   * Batch measure elements
   */
  batchMeasure(elements, callback) {
    const measurements = new Array(elements.length);
    elements.forEach((element, index) => {
      fastdom.measure(() => {
        measurements[index] = {
          element,
          rect: element.getBoundingClientRect(),
          computed: window.getComputedStyle(element)
        };
      });
    });
    fastdom.mutate(() => {
      callback(measurements);
    });
  }
  /**
   * Update performance metrics
   */
  updateMetrics(batchTime) {
    this.metrics.lastBatchTime = batchTime;
    this.metrics.batchCount++;
    this.metrics.averageBatchTime = (this.metrics.averageBatchTime * (this.metrics.batchCount - 1) + batchTime) / this.metrics.batchCount;
    if (batchTime > 5) {
      console.warn(
        `[BatchDOMManager] Batch operation exceeded 5ms target: ${batchTime.toFixed(2)}ms`
      );
    }
  }
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeOperations: this.activeOperations.size
    };
  }
  /**
   * Clear all pending operations
   */
  clear() {
    fastdom.clear();
    if (this.activeOperations.size > 0) {
      this.batchHideHotspots();
    }
    this.pendingReads = [];
    this.pendingWrites = [];
  }
  /**
   * Destroy manager
   */
  destroy() {
    this.clear();
    this.activeOperations.clear();
    console.log("[BatchDOMManager] Destroyed");
  }
}
class ContrastDetection {
  constructor(viewer) {
    this.viewer = viewer;
    this.canvas = null;
    this.context = null;
    this.cache = /* @__PURE__ */ new Map();
    this.initializeCanvas();
  }
  /**
   * Initialize offscreen canvas for image sampling
   */
  initializeCanvas() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d", {
      willReadFrequently: true
      // Optimization hint for frequent getImageData
    });
  }
  /**
   * Calculate relative luminance using WCAG formula
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {number} Relative luminance (0-1)
   */
  calculateLuminance(r, g, b) {
    const [rNorm, gNorm, bNorm] = [r, g, b].map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return rNorm * 0.2126 + gNorm * 0.7152 + bNorm * 0.0722;
  }
  /**
   * Calculate contrast ratio between two luminance values
   * @param {number} l1 - First luminance
   * @param {number} l2 - Second luminance
   * @returns {number} Contrast ratio (1-21)
   */
  calculateContrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  /**
   * Sample background luminance around a point
   * @param {number} x - X coordinate in image space
   * @param {number} y - Y coordinate in image space
   * @param {number} radius - Sampling radius in pixels
   * @returns {Object} Luminance data and contrast info
   */
  async sampleBackgroundLuminance(x, y, radius = 50) {
    const cacheKey = `${Math.round(x)}_${Math.round(y)}_${radius}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    try {
      const image = await this.captureViewportArea(x, y, radius);
      if (!image) {
        return this.getDefaultLuminanceData();
      }
      const samples = this.getSamplePoints(radius);
      const luminanceValues = [];
      for (const sample of samples) {
        const sampleX = radius + sample.x;
        const sampleY = radius + sample.y;
        const pixel = this.context.getImageData(sampleX, sampleY, 1, 1).data;
        const luminance = this.calculateLuminance(pixel[0], pixel[1], pixel[2]);
        luminanceValues.push(luminance);
      }
      const avgLuminance = luminanceValues.reduce((a, b) => a + b, 0) / luminanceValues.length;
      const minLuminance = Math.min(...luminanceValues);
      const maxLuminance = Math.max(...luminanceValues);
      const variance = this.calculateVariance(luminanceValues, avgLuminance);
      const result = {
        averageLuminance: avgLuminance,
        minLuminance,
        maxLuminance,
        variance,
        isDark: avgLuminance < 0.5,
        isHighContrast: maxLuminance - minLuminance > 0.5,
        recommendedEffect: this.selectHotspotEffect(avgLuminance, variance)
      };
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error sampling background luminance:", error);
      return this.getDefaultLuminanceData();
    }
  }
  /**
   * Capture viewport area for analysis
   */
  async captureViewportArea(centerX, centerY, radius) {
    return null;
  }
  /**
   * Get sample points in a circular pattern
   */
  getSamplePoints(radius) {
    const points = [];
    const numRings = 3;
    const pointsPerRing = 8;
    points.push({ x: 0, y: 0 });
    for (let ring = 1; ring <= numRings; ring++) {
      const ringRadius = radius * ring / numRings;
      for (let i = 0; i < pointsPerRing; i++) {
        const angle = i / pointsPerRing * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * ringRadius,
          y: Math.sin(angle) * ringRadius
        });
      }
    }
    return points;
  }
  /**
   * Calculate variance of luminance values
   */
  calculateVariance(values, mean) {
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
  /**
   * Select appropriate hotspot effect based on background analysis
   * @param {number} avgLuminance - Average background luminance
   * @param {number} variance - Luminance variance
   * @returns {string} CSS class for the effect
   */
  selectHotspotEffect(avgLuminance, variance) {
    if (variance > 0.1) {
      return "contrast-adaptive-complex";
    }
    if (avgLuminance < 0.3) {
      return "contrast-adaptive-dark";
    }
    if (avgLuminance > 0.7) {
      return "contrast-adaptive-light";
    }
    return "contrast-adaptive-medium";
  }
  /**
   * Get default luminance data when sampling fails
   */
  getDefaultLuminanceData() {
    return {
      averageLuminance: 0.5,
      minLuminance: 0,
      maxLuminance: 1,
      variance: 0.1,
      isDark: false,
      isHighContrast: true,
      recommendedEffect: "contrast-adaptive-medium"
    };
  }
  /**
   * Clear the luminance cache
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Get cache size for performance monitoring
   */
  getCacheSize() {
    return this.cache.size;
  }
}
class ShadowSpriteManager {
  constructor() {
    this.shadowCache = /* @__PURE__ */ new Map();
    this.svgNamespace = "http://www.w3.org/2000/svg";
    this.initialized = false;
    this.shadowConfigs = {
      // Echo reveal shadow (replaces drop-shadow(0 0 4px rgba(255, 255, 255, 0.8)))
      echoReveal: {
        blur: 4,
        color: "rgba(255, 255, 255, 0.8)",
        id: "echo-reveal-shadow"
      },
      // Echo intense shadow (replaces drop-shadow(0 0 10px rgba(255, 255, 255, 0.8)))
      echoIntense: {
        blur: 10,
        color: "rgba(255, 255, 255, 0.8)",
        id: "echo-intense-shadow"
      },
      // Hover shadow (replaces drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)))
      hover: {
        blur: 8,
        color: "rgba(255, 255, 255, 0.6)",
        id: "hover-shadow"
      }
    };
  }
  /**
   * Initialize shadow sprites
   */
  initialize() {
    if (this.initialized) return;
    console.log("[ShadowSpriteManager] Initializing pre-rendered shadows");
    this.createShadowContainer();
    Object.entries(this.shadowConfigs).forEach(([key, config]) => {
      this.createShadowFilter(config);
      this.shadowCache.set(key, config.id);
    });
    this.initialized = true;
    console.log("[ShadowSpriteManager] Shadow sprites initialized");
  }
  /**
   * Create hidden SVG container for shadow definitions
   */
  createShadowContainer() {
    if (document.getElementById("shadow-sprite-defs")) return;
    const svg = document.createElementNS(this.svgNamespace, "svg");
    svg.id = "shadow-sprite-defs";
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.visibility = "hidden";
    svg.setAttribute("aria-hidden", "true");
    const defs = document.createElementNS(this.svgNamespace, "defs");
    svg.appendChild(defs);
    document.body.appendChild(svg);
    this.defsContainer = defs;
  }
  /**
   * Create a shadow filter definition
   */
  createShadowFilter(config) {
    const filter = document.createElementNS(this.svgNamespace, "filter");
    filter.id = config.id;
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    const gaussianBlur = document.createElementNS(this.svgNamespace, "feGaussianBlur");
    gaussianBlur.setAttribute("in", "SourceAlpha");
    gaussianBlur.setAttribute("stdDeviation", config.blur);
    gaussianBlur.setAttribute("result", "blur");
    const colorMatrix = document.createElementNS(this.svgNamespace, "feColorMatrix");
    colorMatrix.setAttribute("in", "blur");
    colorMatrix.setAttribute("type", "matrix");
    const rgba = this.parseRGBA(config.color);
    const matrix = `0 0 0 0 ${rgba.r} 
                       0 0 0 0 ${rgba.g} 
                       0 0 0 0 ${rgba.b} 
                       0 0 0 ${rgba.a} 0`;
    colorMatrix.setAttribute("values", matrix);
    colorMatrix.setAttribute("result", "coloredBlur");
    const merge = document.createElementNS(this.svgNamespace, "feMerge");
    const mergeNode1 = document.createElementNS(this.svgNamespace, "feMergeNode");
    mergeNode1.setAttribute("in", "coloredBlur");
    const mergeNode2 = document.createElementNS(this.svgNamespace, "feMergeNode");
    mergeNode2.setAttribute("in", "SourceGraphic");
    merge.appendChild(mergeNode1);
    merge.appendChild(mergeNode2);
    filter.appendChild(gaussianBlur);
    filter.appendChild(colorMatrix);
    filter.appendChild(merge);
    this.defsContainer.appendChild(filter);
  }
  /**
   * Parse RGBA color string
   */
  parseRGBA(colorStr) {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([0-9.]+)?\)/);
    if (match) {
      return {
        r: parseInt(match[1]) / 255,
        g: parseInt(match[2]) / 255,
        b: parseInt(match[3]) / 255,
        a: match[4] ? parseFloat(match[4]) : 1
      };
    }
    return { r: 1, g: 1, b: 1, a: 1 };
  }
  /**
   * Apply shadow to element using pre-rendered sprite
   */
  applyShadow(element, shadowType) {
    if (!this.initialized) {
      this.initialize();
    }
    const shadowId = this.shadowCache.get(shadowType);
    if (!shadowId) {
      console.warn(`[ShadowSpriteManager] Unknown shadow type: ${shadowType}`);
      return;
    }
    element.style.filter = `url(#${shadowId})`;
    if (!element.dataset.willChangeApplied) {
      element.style.willChange = "filter";
      element.dataset.willChangeApplied = "true";
    }
  }
  /**
   * Remove shadow from element
   */
  removeShadow(element) {
    element.style.filter = "";
    if (element.dataset.willChangeApplied) {
      setTimeout(() => {
        element.style.willChange = "auto";
        delete element.dataset.willChangeApplied;
      }, 100);
    }
  }
  /**
   * Apply shadow to multiple elements efficiently
   */
  applyShadowBatch(elements, shadowType) {
    if (!this.initialized) {
      this.initialize();
    }
    const shadowId = this.shadowCache.get(shadowType);
    if (!shadowId) return;
    requestAnimationFrame(() => {
      elements.forEach((element) => {
        element.style.filter = `url(#${shadowId})`;
      });
    });
  }
  /**
   * Clean up resources
   */
  destroy() {
    const container = document.getElementById("shadow-sprite-defs");
    if (container) {
      container.remove();
    }
    this.shadowCache.clear();
    this.initialized = false;
  }
}
const shadowSpriteManager = new ShadowSpriteManager();
function debugHotspotPosition(element, hotspotId) {
  if (!element) return;
  const bbox = element.getBoundingClientRect();
  const centerX = bbox.left + bbox.width / 2;
  const centerY = bbox.top + bbox.height / 2;
  const marker = document.createElement("div");
  marker.className = "hotspot-center-debug";
  marker.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: red;
        border: 2px solid white;
        border-radius: 50%;
        left: ${centerX - 7}px;
        top: ${centerY - 7}px;
        z-index: 99999;
        pointer-events: none;
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
    `;
  const label = document.createElement("div");
  label.style.cssText = `
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        white-space: nowrap;
        border-radius: 3px;
    `;
  label.textContent = hotspotId.substring(0, 8);
  marker.appendChild(label);
  document.body.appendChild(marker);
  let frameCount = 0;
  const checkPosition = () => {
    frameCount++;
    const newBbox = element.getBoundingClientRect();
    const newCenterX = newBbox.left + newBbox.width / 2;
    const newCenterY = newBbox.top + newBbox.height / 2;
    marker.style.left = `${newCenterX - 7}px`;
    marker.style.top = `${newCenterY - 7}px`;
    const deltaX = Math.abs(newCenterX - centerX);
    const deltaY = Math.abs(newCenterY - centerY);
    if (deltaX > 1 || deltaY > 1) {
      console.warn(`[HotspotDebug] Position shift detected for ${hotspotId}:`, {
        deltaX: deltaX.toFixed(2),
        deltaY: deltaY.toFixed(2),
        frame: frameCount,
        originalCenter: { x: centerX, y: centerY },
        newCenter: { x: newCenterX, y: newCenterY }
      });
      marker.style.background = "yellow";
      marker.style.boxShadow = "0 0 10px red";
    }
    if (frameCount < 60) {
      requestAnimationFrame(checkPosition);
    } else {
      setTimeout(() => {
        marker.remove();
      }, 1e3);
    }
  };
  requestAnimationFrame(checkPosition);
}
window.enableHotspotPositionDebug = () => {
  window.hotspotPositionDebugEnabled = true;
  console.log(
    "[HotspotDebug] Position debugging enabled. Red dots will show hotspot centers during reveal."
  );
};
window.disableHotspotPositionDebug = () => {
  window.hotspotPositionDebugEnabled = false;
  document.querySelectorAll(".hotspot-center-debug").forEach((el) => el.remove());
  console.log("[HotspotDebug] Position debugging disabled.");
};
class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  minus(point) {
    return new Point(this.x - point.x, this.y - point.y);
  }
  divide(factor) {
    return new Point(this.x / factor, this.y / factor);
  }
  plus(point) {
    return new Point(this.x + point.x, this.y + point.y);
  }
  times(factor) {
    return new Point(this.x * factor, this.y * factor);
  }
  distanceTo(point) {
    return Math.sqrt(this.squaredDistanceTo(point));
  }
  squaredDistanceTo(point) {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return dx * dx + dy * dy;
  }
  rotate(degrees, pivot = new Point(0, 0)) {
    const radians = degrees * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const x = this.x - pivot.x;
    const y = this.y - pivot.y;
    return new Point(x * cos - y * sin + pivot.x, x * sin + y * cos + pivot.y);
  }
  apply(func) {
    return new Point(func(this.x), func(this.y));
  }
  clone() {
    return new Point(this.x, this.y);
  }
  equals(point) {
    return this.x === point.x && this.y === point.y;
  }
  negate() {
    return new Point(-this.x, -this.y);
  }
  toString() {
    return `(${Math.round(this.x)},${Math.round(this.y)})`;
  }
}
class AnimationBatcher {
  constructor() {
    this.maxPerFrame = 50;
    this.frameBudget = 16;
  }
  processBatch(items, callback) {
    const startTime = performance.now();
    let processed = 0;
    for (const item of items) {
      if (performance.now() - startTime > this.frameBudget) break;
      if (processed >= this.maxPerFrame) break;
      callback(item);
      processed++;
    }
    return processed;
  }
}
class OpacityRadialWaveAnimator {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.config = {
      waveSpeed: options.waveSpeed || 300,
      // pixels per second
      waveDuration: options.waveDuration || 1500,
      // total animation duration
      revealDuration: options.revealDuration || 300,
      // individual hotspot reveal time
      borderWidth: options.borderWidth || 20,
      // visible border width in pixels
      maxConcurrent: options.maxConcurrent || 50,
      // max concurrent animations
      cleanupDelay: options.cleanupDelay || 2e3,
      ...options
    };
    this.activeAnimations = /* @__PURE__ */ new Set();
    this.currentAnimations = [];
    this.batcher = new AnimationBatcher();
    this.animationFrame = null;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.userAgent.includes("Macintosh") && "ontouchend" in document;
    this.isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
    this.injectStyles();
  }
  /**
   * Inject CSS styles for opacity-based animation
   */
  injectStyles() {
    if (document.getElementById("opacity-radial-wave-styles")) return;
    const style = document.createElement("style");
    style.id = "opacity-radial-wave-styles";
    style.textContent = `
            .hotspot-wave-ready {
                opacity: 0;
                transform: scale(0.95);
                transition: opacity ${this.config.revealDuration}ms ease-out, 
                            transform ${this.config.revealDuration}ms ease-out;
                will-change: transform, opacity;
                /* Force GPU acceleration on iOS */
                -webkit-transform: translateZ(0) scale(0.95);
                -webkit-backface-visibility: hidden;
                contain: layout style paint;
            }
            
            .hotspot-wave-revealing {
                opacity: 1 !important;
                transform: scale(1) !important;
                -webkit-transform: translateZ(0) scale(1) !important;
            }
            
            /* Optimized for borders only */
            .hotspot-wave-ready path,
            .hotspot-wave-ready polygon {
                stroke: rgba(0, 0, 0, 0.8);
                stroke-width: 2px;
                fill: none;
            }
            
            /* iOS Safari specific optimizations */
            @supports (-webkit-touch-callout: none) {
                .hotspot-wave-ready {
                    -webkit-transform: translate3d(0, 0, 0) scale(0.95);
                }
                .hotspot-wave-revealing {
                    -webkit-transform: translate3d(0, 0, 0) scale(1);
                }
            }
        `;
    document.head.appendChild(style);
  }
  /**
   * Convert pixel coordinates to viewport coordinates manually
   */
  pixelToViewport(pixelX, pixelY) {
    const bounds = this.viewer.viewport.getBounds();
    const containerSize = this.viewer.viewport.getContainerSize();
    return {
      x: pixelX / containerSize.x * bounds.width + bounds.x,
      y: pixelY / containerSize.y * bounds.height + bounds.y
    };
  }
  /**
   * Convert viewport coordinates to pixel coordinates
   */
  viewportToPixel(viewportX, viewportY) {
    const bounds = this.viewer.viewport.getBounds();
    const containerSize = this.viewer.viewport.getContainerSize();
    return {
      x: (viewportX - bounds.x) / bounds.width * containerSize.x,
      y: (viewportY - bounds.y) / bounds.height * containerSize.y
    };
  }
  /**
   * Alternative: Use Point polyfill for compatibility
   */
  convertCoordinatesWithPolyfill(tapPoint) {
    try {
      const pixelPoint = new Point(tapPoint.x, tapPoint.y);
      const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
      return {
        viewport: viewportPoint,
        pixel: tapPoint
      };
    } catch (error) {
      console.warn("[OpacityWave] Polyfill failed, using manual conversion:", error);
      const viewport = this.pixelToViewport(tapPoint.x, tapPoint.y);
      return {
        viewport,
        pixel: tapPoint
      };
    }
  }
  /**
   * Start radial wave animation
   */
  triggerWaveAnimation(tapPoint, hotspots) {
    console.log("[OpacityWave] Starting wave animation at", tapPoint);
    console.log("[OpacityWave] Animating", hotspots.length, "hotspots");
    if (this.animationFrame) {
      console.log("[OpacityWave] Canceling previous animation");
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.activeAnimations.size > 0) {
      console.log(
        "[OpacityWave] Cleaning up",
        this.activeAnimations.size,
        "active animations"
      );
      this.activeAnimations.forEach((anim) => {
        if (anim.element) {
          anim.element.classList.remove("hotspot-wave-ready", "hotspot-wave-revealing");
        }
      });
      this.activeAnimations.clear();
    }
    const coords = this.convertCoordinatesWithPolyfill(tapPoint);
    const origin = coords.pixel;
    const animations = hotspots.map((hotspotData) => {
      const hotspot = hotspotData.hotspot || hotspotData;
      const element = this.findHotspotElement(hotspot.id);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const elementX = rect.left + rect.width / 2;
      const elementY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(elementX - origin.x, 2) + Math.pow(elementY - origin.y, 2)
      );
      return {
        element,
        hotspot,
        distance,
        delay: distance / this.config.waveSpeed * 1e3,
        // Convert to ms
        started: false
      };
    }).filter((a) => a !== null);
    animations.sort((a, b) => a.distance - b.distance);
    console.log("[OpacityWave] Prepared", animations.length, "animations");
    console.log(
      "[OpacityWave] Delays range from 0ms to",
      Math.max(...animations.map((a) => a.delay)).toFixed(0),
      "ms"
    );
    this.currentAnimations = animations;
    this.animateWave(animations);
  }
  /**
   * Prepare hotspot for animation (keeps it hidden)
   */
  prepareHotspot(element) {
    element.classList.remove("hotspot-wave-revealing");
    element.classList.add("hotspot-wave-ready");
    const paths = element.querySelectorAll("path, polygon, polyline");
    paths.forEach((path) => {
      path.style.stroke = "rgba(0, 0, 0, 0.8)";
      path.style.strokeWidth = "2px";
      path.style.fill = "none";
    });
  }
  /**
   * Animate the wave using requestAnimationFrame
   */
  animateWave(animations) {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      let processed = 0;
      for (const anim of animations) {
        if (anim.started) continue;
        if (processed >= this.config.maxConcurrent) break;
        if (elapsed >= anim.delay) {
          this.prepareHotspot(anim.element);
          this.revealHotspot(anim.element);
          anim.started = true;
          processed++;
          this.activeAnimations.add(anim);
        }
      }
      if (animations.some((a) => !a.started) && elapsed < this.config.waveDuration) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        console.log("[OpacityWave] Animation complete");
        this.animationFrame = null;
      }
    };
    this.animationFrame = requestAnimationFrame(animate);
  }
  /**
   * Reveal a single hotspot with proper timing
   */
  revealHotspot(element) {
    element.classList.remove("hotspot-hidden");
    element.classList.add("hotspot-visible");
    requestAnimationFrame(() => {
      element.classList.add("hotspot-wave-revealing");
    });
    element.setAttribute("data-hotspot-revealed", "true");
    console.log("[OpacityWave] Revealing hotspot:", element.getAttribute("data-hotspot-id"));
  }
  /**
   * Find hotspot element by ID
   */
  findHotspotElement(hotspotId) {
    const selectors = [
      `[data-hotspot-id="${hotspotId}"]`,
      `#hotspot-${hotspotId}`,
      `g[data-hotspot-id="${hotspotId}"]`
    ];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }
  /**
   * Trigger reverse wave animation for hiding hotspots
   */
  triggerReverseWave(animations) {
    console.log("[OpacityWave] Starting reverse wave animation");
    if (!animations || animations.length === 0) {
      this.cleanup();
      return;
    }
    animations.sort((a, b) => a.distance - b.distance);
    const startTime = performance.now();
    const hideAnimate = (currentTime) => {
      const elapsed = currentTime - startTime;
      let processed = 0;
      for (const anim of animations) {
        if (!anim.element) continue;
        if (anim.hidden) continue;
        if (processed >= this.config.maxConcurrent) break;
        if (elapsed >= anim.delay) {
          this.hideHotspot(anim.element);
          anim.hidden = true;
          processed++;
        }
      }
      if (animations.some((a) => a.element && !a.hidden) && elapsed < this.config.waveDuration) {
        requestAnimationFrame(hideAnimate);
      } else {
        console.log("[OpacityWave] Reverse wave animation complete");
        setTimeout(() => {
          this.cleanup();
        }, 300);
      }
    };
    requestAnimationFrame(hideAnimate);
  }
  /**
   * Hide a single hotspot with fade animation
   */
  hideHotspot(element) {
    element.classList.remove("hotspot-wave-revealing");
    element.classList.remove("hotspot-wave-ready");
    console.log("[OpacityWave] Hiding hotspot:", element.getAttribute("data-hotspot-id"));
  }
  /**
   * Clean up animations
   */
  cleanup() {
    console.log("[OpacityWave] Cleaning up");
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.activeAnimations.forEach((anim) => {
      if (anim.element) {
        anim.element.classList.remove("hotspot-wave-ready", "hotspot-wave-revealing");
        anim.element.removeAttribute("data-hotspot-revealed");
      }
    });
    this.activeAnimations.clear();
  }
  /**
   * Destroy the animator
   */
  destroy() {
    this.cleanup();
    const styleElement = document.getElementById("opacity-radial-wave-styles");
    if (styleElement) {
      styleElement.remove();
    }
  }
}
class BorderPointCalculator {
  extractVertices(element) {
    const vertices = [];
    if (element.tagName === "polygon" || element.tagName === "polyline") {
      const points = element.getAttribute("points");
      if (points) {
        const pairs = points.trim().split(/\s+/).map((point) => {
          const coords = point.split(",").map(Number);
          return { x: coords[0] || 0, y: coords[1] || 0 };
        });
        return pairs;
      }
    } else if (element.tagName === "path") {
      const pathLength = element.getTotalLength();
      const numSamples = 20;
      for (let i = 0; i <= numSamples; i++) {
        const point = element.getPointAtLength(i / numSamples * pathLength);
        vertices.push({ x: point.x, y: point.y });
      }
    }
    return vertices;
  }
  findClosestPointOnBorder(polygonElement, externalPoint) {
    let minDistance = Infinity;
    let closestPoint = null;
    let closestSegmentIndex = 0;
    let segmentRatio = 0;
    const vertices = this.extractVertices(polygonElement);
    if (vertices.length < 2) return null;
    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % vertices.length];
      const segmentVector = { x: p2.x - p1.x, y: p2.y - p1.y };
      const pointVector = { x: externalPoint.x - p1.x, y: externalPoint.y - p1.y };
      const segmentLengthSq = segmentVector.x * segmentVector.x + segmentVector.y * segmentVector.y;
      if (segmentLengthSq === 0) {
        const dist2 = Math.sqrt(
          pointVector.x * pointVector.x + pointVector.y * pointVector.y
        );
        if (dist2 < minDistance) {
          minDistance = dist2;
          closestPoint = p1;
          closestSegmentIndex = i;
          segmentRatio = 0;
        }
        continue;
      }
      let t = (pointVector.x * segmentVector.x + pointVector.y * segmentVector.y) / segmentLengthSq;
      t = Math.max(0, Math.min(1, t));
      const projection = {
        x: p1.x + t * segmentVector.x,
        y: p1.y + t * segmentVector.y
      };
      const dist = Math.sqrt(
        Math.pow(externalPoint.x - projection.x, 2) + Math.pow(externalPoint.y - projection.y, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = projection;
        closestSegmentIndex = i;
        segmentRatio = t;
      }
    }
    return {
      point: closestPoint,
      distance: minDistance,
      segmentIndex: closestSegmentIndex,
      ratio: segmentRatio,
      pathLength: this.calculatePathLengthToPoint(
        polygonElement,
        closestSegmentIndex,
        segmentRatio
      )
    };
  }
  calculatePathLengthToPoint(element, segmentIndex, ratio) {
    if (element.tagName === "path") {
      const totalLength = element.getTotalLength();
      return segmentIndex / 20 * totalLength + ratio * totalLength / 20;
    }
    const vertices = this.extractVertices(element);
    let accumulatedLength = 0;
    for (let i = 0; i < segmentIndex; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % vertices.length];
      accumulatedLength += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    if (segmentIndex < vertices.length) {
      const p1 = vertices[segmentIndex];
      const p2 = vertices[(segmentIndex + 1) % vertices.length];
      const segmentLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      accumulatedLength += segmentLength * ratio;
    }
    return accumulatedLength;
  }
}
class BorderRadialAnimator {
  constructor(viewer, stateManager, temporalEchoController, options = {}) {
    this.viewer = viewer;
    this.stateManager = stateManager;
    this.temporalEchoController = temporalEchoController;
    this.pointCalculator = new BorderPointCalculator();
    this.waveAnimator = new OpacityRadialWaveAnimator(viewer, {
      waveSpeed: options.waveSpeed || 300,
      // pixels per second
      waveDuration: options.waveDuration || 1500,
      revealDuration: options.revealDuration || 300,
      borderWidth: options.borderWidth || 20,
      cleanupDelay: options.fadeOutDuration || 2e3
    });
    this.config = {
      waveSpeed: options.waveSpeed || 300,
      // pixels per second - slower wave
      principalRevealDuration: 0,
      // instant
      secondaryRevealDuration: options.secondaryRevealDuration || 1500,
      // ms - much slower to see the drawing effect
      maxConcurrentAnimations: options.maxConcurrentAnimations || 30,
      // iOS Safari limit
      distanceCacheSize: options.distanceCacheSize || 1e3,
      maxRadius: options.maxRadius || 800,
      // px max propagation
      borderColor: options.borderColor || "rgba(0, 0, 0, 0.8)",
      borderWidth: options.borderWidth || 2,
      revealDuration: options.revealDuration || 2e3,
      // How long borders stay visible
      fadeOutDuration: options.fadeOutDuration || 400,
      ...options
    };
    this.animations = /* @__PURE__ */ new Map();
    this.isAnimating = false;
    this.animationFrameId = null;
    this.cleanupTimeout = null;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.currentFPS = 60;
    this.qualityLevel = "high";
    this.distanceCache = /* @__PURE__ */ new Map();
    this.bboxCache = /* @__PURE__ */ new Map();
    this.transformCache = /* @__PURE__ */ new Map();
    this.revealedHotspots = /* @__PURE__ */ new Set();
    this.activeHotspots = /* @__PURE__ */ new Set();
    this.platform = this.detectPlatform();
    this.applyPlatformOptimizations();
    this.injectStyles();
  }
  // ========== PLATFORM DETECTION ==========
  detectPlatform() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || ua.includes("Macintosh") && "ontouchend" in document;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
    return {
      isIOS,
      isSafari,
      isIOSSafari: isIOS && isSafari,
      isMobile: /Mobi|Android/i.test(ua) || isIOS,
      deviceMemory: navigator.deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4
    };
  }
  applyPlatformOptimizations() {
    if (this.platform.isIOSSafari) {
      this.config.maxConcurrentAnimations = 20;
      this.config.secondaryRevealDuration = 200;
    }
    if (this.platform.deviceMemory < 4 || this.platform.isMobile) {
      this.setQualityLevel("medium");
    }
  }
  // ========== STYLES ==========
  injectStyles() {
    if (document.getElementById("border-radial-styles")) return;
    const style = document.createElement("style");
    style.id = "border-radial-styles";
    style.textContent = `
            /* Border radial animation styles */
            .border-radial-hotspot {
                pointer-events: auto !important;
                contain: layout style paint;
            }
            
            .border-radial-principal {
                /* Principal zone - instant reveal */
                stroke: rgba(0, 0, 0, 1) !important;
                stroke-width: 3px !important;
                fill: none !important;
                opacity: 1 !important;
                visibility: visible !important;
                filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.4));
            }
            
            .border-radial-principal path,
            .border-radial-principal polygon {
                stroke: rgba(0, 0, 0, 1) !important;
                stroke-width: 3px !important;
                fill: none !important;
            }
            
            .border-radial-secondary {
                /* Secondary zones - progressive reveal */
                stroke: rgba(0, 0, 0, 0.8) !important;
                stroke-width: 2px !important;
                fill: none !important;
                opacity: 0;
                transition: opacity var(--reveal-duration, 250ms) ease-out;
                transition-delay: var(--reveal-delay, 0ms);
            }
            
            .border-radial-secondary path,
            .border-radial-secondary polygon {
                stroke: rgba(0, 0, 0, 0.8) !important;
                stroke-width: 2px !important;
                fill: none !important;
            }
            
            .border-radial-revealing {
                opacity: 1 !important;
            }
            
            /* Directional reveal animations */
            @keyframes reveal-from-left {
                from { clip-path: inset(0 100% 0 0); }
                to { clip-path: inset(0 0 0 0); }
            }
            
            @keyframes reveal-from-right {
                from { clip-path: inset(0 0 0 100%); }
                to { clip-path: inset(0 0 0 0); }
            }
            
            @keyframes reveal-from-top {
                from { clip-path: inset(0 0 100% 0); }
                to { clip-path: inset(0 0 0 0); }
            }
            
            @keyframes reveal-from-bottom {
                from { clip-path: inset(100% 0 0 0); }
                to { clip-path: inset(0 0 0 0); }
            }
            
            .reveal-from-left {
                animation: reveal-from-left var(--reveal-duration, 250ms) ease-out forwards;
                animation-delay: var(--reveal-delay, 0ms);
            }
            
            .reveal-from-right {
                animation: reveal-from-right var(--reveal-duration, 250ms) ease-out forwards;
                animation-delay: var(--reveal-delay, 0ms);
            }
            
            .reveal-from-top {
                animation: reveal-from-top var(--reveal-duration, 250ms) ease-out forwards;
                animation-delay: var(--reveal-delay, 0ms);
            }
            
            .reveal-from-bottom {
                animation: reveal-from-bottom var(--reveal-duration, 250ms) ease-out forwards;
                animation-delay: var(--reveal-delay, 0ms);
            }
            
            /* iOS Safari optimizations */
            @supports (-webkit-appearance: none) {
                .border-radial-hotspot {
                    -webkit-transform: translateZ(0);
                    -webkit-backface-visibility: hidden;
                }
                
                .border-radial-secondary {
                    will-change: opacity;
                }
            }
            
            /* Performance optimizations */
            .border-radial-batch {
                will-change: auto !important;
            }
            
            /* Fade out animation */
            @keyframes border-radial-fadeout {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            .border-radial-fading {
                animation: border-radial-fadeout var(--fade-duration, 400ms) ease-out forwards;
            }
        `;
    document.head.appendChild(style);
  }
  // ========== MAIN ANIMATION TRIGGER ==========
  triggerBorderRadialAnimation(tapData, hotspots) {
    if (!hotspots) {
      console.log("[BorderRadial] Called without hotspots, skipping animation");
      return;
    }
    console.log("[BorderRadial] Starting animation with", hotspots.length, "hotspots");
    console.log("[BorderRadial] Tap point:", tapData);
    console.log("[BorderRadial] isAnimating:", this.isAnimating);
    if (this.isAnimating) {
      console.log("[BorderRadial] Animation in progress, doing light reset");
      if (this.cleanupTimeout) {
        clearTimeout(this.cleanupTimeout);
        this.cleanupTimeout = null;
      }
      this.isAnimating = false;
    }
    const principalZone = this.findPrincipalZone(tapData, hotspots);
    if (!principalZone) {
      console.warn("[BorderRadial] No principal zone found");
      this.isAnimating = false;
      return;
    }
    console.log("[BorderRadial] Principal zone:", principalZone.id);
    this.isAnimating = true;
    this.waveAnimator.triggerWaveAnimation(tapData, hotspots);
    const totalTime = this.config.revealDuration + this.config.fadeOutDuration;
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
    }
    this.cleanupTimeout = setTimeout(() => {
      this.fadeOutAndCleanup();
    }, totalTime);
  }
  findPrincipalZone(tapData, hotspots) {
    let closestHotspot = null;
    let minDistance = Infinity;
    hotspots.forEach((hotspotData) => {
      const hotspot = hotspotData.hotspot || hotspotData;
      const distance = hotspotData.distance || this.calculateDistanceToTap(tapData, hotspot);
      if (distance < minDistance) {
        minDistance = distance;
        closestHotspot = hotspot;
      }
    });
    return closestHotspot;
  }
  calculateDistanceToTap(tapData, hotspot) {
    const element = this.findHotspotElement(hotspot.id);
    if (!element) return Infinity;
    const bbox = element.getBoundingClientRect();
    const centerX = bbox.left + bbox.width / 2;
    const centerY = bbox.top + bbox.height / 2;
    return Math.hypot(centerX - tapData.x, centerY - tapData.y);
  }
  // ========== PRINCIPAL ZONE REVEAL ==========
  revealPrincipalZone(zone) {
    const element = this.findHotspotElement(zone.id);
    if (!element) {
      console.warn("[BorderRadial] Could not find element for principal zone:", zone.id);
      return;
    }
    element.classList.remove("hotspot-hidden");
    element.classList.add("hotspot-visible");
    element.classList.add("border-radial-hotspot", "border-radial-principal");
    element.style.opacity = "1";
    element.style.visibility = "visible";
    const paths = element.querySelectorAll("path, polygon, polyline");
    paths.forEach((path) => {
      path.style.stroke = "rgba(0, 0, 0, 1)";
      path.style.strokeWidth = `${this.config.borderWidth + 1}px`;
      path.style.fill = "none";
      path.style.opacity = "1";
      path.style.visibility = "visible";
      path.style.strokeDasharray = "0";
      path.style.strokeDashoffset = "0";
      path.style.filter = "drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))";
    });
    element.setAttribute("data-hotspot-revealed", "true");
    this.revealedHotspots.add(zone.id);
    this.activeHotspots.add(zone.id);
    if (this.temporalEchoController) {
      this.temporalEchoController.activeEchoes.add(zone.id);
    }
    console.log("[BorderRadial] Principal zone revealed instantly:", zone.id);
  }
  /**
   * Prepare hotspots for mask animation but keep them hidden initially
   */
  prepareHotspotsForMaskHidden(hotspots) {
    hotspots.forEach((hotspotData) => {
      const hotspot = hotspotData.hotspot || hotspotData;
      const element = this.findHotspotElement(hotspot.id);
      if (element) {
        element.classList.add("hotspot-hidden");
        element.classList.remove("hotspot-visible");
        const paths = element.querySelectorAll("path, polygon, polyline");
        paths.forEach((path) => {
          path.style.stroke = this.config.borderColor;
          path.style.strokeWidth = `${this.config.borderWidth}px`;
          path.style.fill = "none";
          path.style.opacity = "0";
          path.style.visibility = "hidden";
        });
        this.revealedHotspots.add(hotspot.id);
        this.activeHotspots.add(hotspot.id);
      }
    });
  }
  /**
   * Prepare hotspots for mask animation by setting their stroke properties
   */
  prepareHotspotsForMask(hotspots) {
    hotspots.forEach((hotspotData) => {
      const hotspot = hotspotData.hotspot || hotspotData;
      const element = this.findHotspotElement(hotspot.id);
      if (element) {
        element.classList.remove("hotspot-hidden");
        element.classList.add("hotspot-visible", "border-radial-hotspot");
        const paths = element.querySelectorAll("path, polygon, polyline");
        paths.forEach((path) => {
          path.style.stroke = this.config.borderColor;
          path.style.strokeWidth = `${this.config.borderWidth}px`;
          path.style.fill = "none";
          path.style.opacity = "1";
          path.style.visibility = "visible";
        });
        element.setAttribute("data-hotspot-revealed", "true");
        this.revealedHotspots.add(hotspot.id);
        this.activeHotspots.add(hotspot.id);
        if (this.temporalEchoController) {
          this.temporalEchoController.activeEchoes.add(hotspot.id);
        }
      }
    });
  }
  // ========== WAVE PROPAGATION (OLD - KEPT FOR REFERENCE) ==========
  startRadialWave(principalZone, tapData, allHotspots) {
    const waveAnimation = {
      id: `wave-${Date.now()}`,
      principalZone,
      tapPoint: { x: tapData.x, y: tapData.y },
      startTime: performance.now(),
      radius: 0,
      revealedZones: /* @__PURE__ */ new Set([principalZone.id]),
      pendingZones: /* @__PURE__ */ new Map()
    };
    this.precalculateWaveDistances(waveAnimation, allHotspots);
    this.animations.set(waveAnimation.id, waveAnimation);
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.requestFrame();
    }
    const totalTime = this.config.revealDuration + this.config.fadeOutDuration;
    setTimeout(() => {
      this.fadeOutAndCleanup();
    }, totalTime);
  }
  precalculateWaveDistances(waveAnimation, hotspots) {
    const principal = waveAnimation.principalZone;
    const principalElement = this.findHotspotElement(principal.id);
    if (!principalElement) return;
    const principalBbox = principalElement.getBoundingClientRect();
    hotspots.forEach((hotspotData) => {
      const hotspot = hotspotData.hotspot || hotspotData;
      if (hotspot.id === principal.id) return;
      const element = this.findHotspotElement(hotspot.id);
      if (!element) return;
      const bbox = element.getBoundingClientRect();
      const distance = this.calculateBorderToBorderDistance(principalBbox, bbox);
      const baseRevealTime = distance / this.config.waveSpeed * 1e3;
      const index = Array.from(hotspots).findIndex((h) => (h.hotspot || h).id === hotspot.id);
      const adjustedIndex = Math.max(0, index - 1);
      const staggerDelay = adjustedIndex * 100;
      const revealTime = Math.max(baseRevealTime, staggerDelay);
      waveAnimation.pendingZones.set(hotspot.id, {
        zone: hotspot,
        element,
        bbox,
        distance,
        revealTime
      });
      console.log(
        `[BorderRadial] Zone ${hotspot.id} will reveal at ${revealTime.toFixed(0)}ms (distance: ${distance.toFixed(0)}px)`
      );
    });
  }
  calculateBorderToBorderDistance(bbox1, bbox2) {
    const center1 = {
      x: bbox1.left + bbox1.width / 2,
      y: bbox1.top + bbox1.height / 2
    };
    const center2 = {
      x: bbox2.left + bbox2.width / 2,
      y: bbox2.top + bbox2.height / 2
    };
    const distance = Math.sqrt(
      Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
    );
    console.log(
      `[BorderRadial] Distance calculation: center1=(${center1.x.toFixed(0)},${center1.y.toFixed(0)}), center2=(${center2.x.toFixed(0)},${center2.y.toFixed(0)}), distance=${distance.toFixed(0)}px`
    );
    return distance;
  }
  // ========== ANIMATION LOOP ==========
  requestFrame() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame((timestamp) => {
      this.renderFrame(timestamp);
    });
  }
  renderFrame(timestamp) {
    this.updateFPS(timestamp);
    const completedAnimations = [];
    for (const [id, animation] of this.animations) {
      const elapsed = timestamp - animation.startTime;
      animation.radius = elapsed / 1e3 * this.config.waveSpeed;
      for (const [zoneId, zoneData] of animation.pendingZones) {
        if (elapsed >= zoneData.revealTime && !animation.revealedZones.has(zoneId)) {
          this.revealSecondaryZone(zoneData, animation);
          animation.revealedZones.add(zoneId);
        }
      }
      const maxRevealTime = Math.max(
        ...Array.from(animation.pendingZones.values()).map((z) => z.revealTime)
      );
      if (elapsed >= maxRevealTime + this.config.secondaryRevealDuration) {
        completedAnimations.push(id);
      }
    }
    for (const id of completedAnimations) {
      this.animations.delete(id);
    }
    if (this.animations.size > 0) {
      this.requestFrame();
    } else {
      this.isAnimating = false;
      console.log("[BorderRadial] Wave animation complete");
    }
  }
  // ========== SECONDARY ZONE REVEAL ==========
  revealSecondaryZone(zoneData, animation) {
    const element = zoneData.element;
    if (!element) return;
    console.log("[BorderRadial] Revealing secondary zone:", zoneData.zone.id);
    element.classList.remove("hotspot-hidden");
    element.classList.add("hotspot-visible");
    element.classList.add("border-radial-hotspot", "border-radial-secondary");
    const principalElement = this.findHotspotElement(animation.principalZone.id);
    let principalCenter = { x: 0, y: 0 };
    if (principalElement) {
      const principalPath = principalElement.querySelector("path, polygon, polyline");
      if (principalPath) {
        const principalBbox = principalPath.getBoundingClientRect();
        const currentPath = element.querySelector("path, polygon, polyline");
        const currentBbox = currentPath ? currentPath.getBoundingClientRect() : element.getBoundingClientRect();
        principalCenter = {
          x: principalBbox.left + principalBbox.width / 2 - currentBbox.left,
          y: principalBbox.top + principalBbox.height / 2 - currentBbox.top
        };
      } else {
        const principalBbox = principalElement.getBoundingClientRect();
        principalCenter = {
          x: principalBbox.left + principalBbox.width / 2,
          y: principalBbox.top + principalBbox.height / 2
        };
      }
    }
    const paths = element.querySelectorAll("path, polygon, polyline");
    paths.forEach((path) => {
      path.style.stroke = this.config.borderColor;
      path.style.strokeWidth = `${this.config.borderWidth}px`;
      path.style.fill = "none";
      path.style.opacity = "1";
      path.style.visibility = "visible";
      path.setAttribute("stroke", this.config.borderColor);
      path.setAttribute("stroke-width", this.config.borderWidth);
      path.setAttribute("fill", "none");
      path.getBoundingClientRect();
      console.log(
        "[BorderRadial] Applying bidirectional stroke reveal to path:",
        path.tagName
      );
      this.applyBidirectionalStrokeReveal(
        path,
        principalCenter,
        this.config.secondaryRevealDuration
      );
    });
    element.setAttribute("data-hotspot-revealed", "true");
    this.revealedHotspots.add(zoneData.zone.id);
    this.activeHotspots.add(zoneData.zone.id);
    if (this.temporalEchoController) {
      this.temporalEchoController.activeEchoes.add(zoneData.zone.id);
    }
  }
  calculateRevealDirection(principalZone, secondaryZone, secondaryBbox) {
    const principalElement = this.findHotspotElement(principalZone.id);
    if (!principalElement) return "right";
    const principalBbox = principalElement.getBoundingClientRect();
    const principalCenter = {
      x: principalBbox.left + principalBbox.width / 2,
      y: principalBbox.top + principalBbox.height / 2
    };
    const secondaryCenter = {
      x: secondaryBbox.left + secondaryBbox.width / 2,
      y: secondaryBbox.top + secondaryBbox.height / 2
    };
    const angle = Math.atan2(
      secondaryCenter.y - principalCenter.y,
      secondaryCenter.x - principalCenter.x
    ) * 180 / Math.PI;
    if (angle >= -45 && angle < 45) return "right";
    if (angle >= 45 && angle < 135) return "bottom";
    if (angle >= -135 && angle < -45) return "top";
    return "left";
  }
  /**
   * Apply bidirectional stroke reveal animation
   * Creates a radial brush effect where the border is drawn from the closest point
   * in two directions simultaneously until they meet at the opposite point
   */
  applyBidirectionalStrokeReveal(path, principalCenter, animationDuration) {
    console.log(
      "[BorderRadial] Starting bidirectional reveal for path, principal center:",
      principalCenter
    );
    this.applyProgressiveStrokeReveal(path, principalCenter, animationDuration);
  }
  /**
   * Apply progressive stroke reveal that actually draws the border
   */
  applyProgressiveStrokeReveal(path, principalCenter, animationDuration) {
    let totalLength = 100;
    try {
      if (path.getTotalLength) {
        totalLength = path.getTotalLength();
      } else if (path.tagName === "polygon" || path.tagName === "polyline") {
        totalLength = this.estimatePathLength(path);
      }
    } catch (e) {
      console.warn("[BorderRadial] Could not calculate path length:", e);
    }
    console.log("[BorderRadial] Path total length:", totalLength);
    path.style.strokeDasharray = `0 ${totalLength * 2}`;
    path.style.strokeDashoffset = "0";
    path.style.strokeLinecap = "round";
    path.style.strokeLinejoin = "round";
    path.getBoundingClientRect();
    path.style.transform = "translateZ(0)";
    path.style.willChange = "stroke-dasharray";
    setTimeout(() => {
      const startTime = performance.now();
      let lastLoggedProgress = -1;
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        const easedProgress = progress * progress * (3 - 2 * progress);
        const visibleLength = totalLength * easedProgress;
        const gapLength = totalLength * 2;
        path.style.strokeDasharray = `${visibleLength} ${gapLength}`;
        const currentProgressInt = Math.floor(progress * 10);
        if (currentProgressInt !== lastLoggedProgress && currentProgressInt !== Math.floor((progress - 0.1) * 10)) {
          lastLoggedProgress = currentProgressInt;
          console.log(
            `[BorderRadial] Drawing progress: ${(progress * 100).toFixed(0)}%, visible: ${visibleLength.toFixed(0)}/${totalLength.toFixed(0)}px`
          );
        }
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          path.style.strokeDasharray = "none";
          path.style.strokeDashoffset = "0";
          path.style.willChange = "auto";
          console.log("[BorderRadial] Progressive stroke reveal complete");
        }
      };
      requestAnimationFrame(animate);
    }, 100);
  }
  /**
   * Configure two paths for bidirectional animation from a split point
   */
  configureBidirectionalPaths(path1, path2, totalLength, splitPoint) {
    const isIOSSafari = this.platform.isIOSSafari;
    if (isIOSSafari) {
      path1.style.strokeDasharray = `0 ${totalLength}`;
      path1.style.strokeDashoffset = `${-splitPoint}`;
      path2.style.strokeDasharray = `0 ${totalLength}`;
      path2.style.strokeDashoffset = `${totalLength - splitPoint}`;
    } else {
      path1.style.strokeDasharray = `${totalLength}`;
      path1.style.strokeDashoffset = `${splitPoint}`;
      path2.style.strokeDasharray = `${totalLength}`;
      path2.style.strokeDashoffset = `${splitPoint - totalLength}`;
    }
    path1.style.stroke = "rgba(0, 0, 0, 0.8)";
    path1.style.strokeWidth = "2px";
    path1.style.fill = "none";
    path1.style.opacity = "1";
    path2.style.stroke = "rgba(0, 0, 0, 0.8)";
    path2.style.strokeWidth = "2px";
    path2.style.fill = "none";
    path2.style.opacity = "1";
    path1.style.transform = "translateZ(0)";
    path2.style.transform = "translateZ(0)";
    path1.style.willChange = "stroke-dasharray, stroke-dashoffset";
    path2.style.willChange = "stroke-dasharray, stroke-dashoffset";
    if (isIOSSafari) {
      path1.style.webkitTransform = "translate3d(0, 0, 0)";
      path2.style.webkitTransform = "translate3d(0, 0, 0)";
      path1.style.webkitBackfaceVisibility = "hidden";
      path2.style.webkitBackfaceVisibility = "hidden";
    }
  }
  /**
   * Animate two paths in opposite directions simultaneously
   */
  animateBidirectionalPaths(path1, path2, totalLength, duration, onComplete) {
    const startTime = performance.now();
    const isIOSSafari = this.platform.isIOSSafari;
    console.log("[BorderRadial] Starting animation, iOS Safari:", isIOSSafari);
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutCubic(progress);
      if (isIOSSafari) {
        const visibleLength = totalLength / 2 * easedProgress;
        const gapLength = totalLength - visibleLength;
        path1.style.strokeDasharray = `${visibleLength} ${gapLength}`;
        path2.style.strokeDasharray = `${visibleLength} ${gapLength}`;
        if (Math.floor(progress * 10) !== Math.floor((progress - 0.1) * 10)) {
          console.log(
            `[BorderRadial] Animation progress: ${(progress * 100).toFixed(0)}%, visible: ${visibleLength.toFixed(0)}px`
          );
        }
      } else {
        const offset = totalLength * (1 - easedProgress) / 2;
        path1.style.strokeDashoffset = offset;
        path2.style.strokeDashoffset = -offset;
      }
      if (progress >= 0.98) {
        this.handleJunctionPoint(path1, path2);
      }
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        path1.style.willChange = "auto";
        path2.style.willChange = "auto";
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(animate);
  }
  /**
   * Handle the junction point where two traces meet
   */
  handleJunctionPoint(path1, path2) {
    path1.style.strokeLinecap = "round";
    path2.style.strokeLinecap = "round";
    path1.style.strokeLinejoin = "round";
    path2.style.strokeLinejoin = "round";
    const overlapCompensation = 0.5;
    const currentArray1 = path1.style.strokeDasharray;
    const currentArray2 = path2.style.strokeDasharray;
    if (currentArray1 && currentArray2) {
      const values1 = currentArray1.split(" ").map((v) => parseFloat(v));
      const values2 = currentArray2.split(" ").map((v) => parseFloat(v));
      if (values1[0] && values2[0]) {
        values1[0] += overlapCompensation;
        values2[0] += overlapCompensation;
        path1.style.strokeDasharray = `${values1[0]} ${values1[1] || 0}`;
        path2.style.strokeDasharray = `${values2[0]} ${values2[1] || 0}`;
      }
    }
  }
  /**
   * Easing function for smooth animation
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  /**
   * Simple fallback stroke reveal for when bidirectional fails
   */
  applySimpleStrokeReveal(path, duration) {
    let pathLength = 100;
    try {
      if (path.getTotalLength) {
        pathLength = path.getTotalLength();
      } else if (path.tagName === "polygon" || path.tagName === "polyline") {
        pathLength = this.estimatePathLength(path);
      }
    } catch (e) {
      console.warn("[BorderRadial] Could not calculate path length:", e);
    }
    path.style.strokeDasharray = `0 ${pathLength}`;
    path.style.transform = "translateZ(0)";
    path.style.willChange = "stroke-dasharray";
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutCubic(progress);
      const visibleLength = pathLength * easedProgress;
      const hiddenLength = pathLength - visibleLength;
      path.style.strokeDasharray = `${visibleLength} ${hiddenLength}`;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        path.style.strokeDasharray = "none";
        path.style.willChange = "auto";
      }
    };
    requestAnimationFrame(animate);
  }
  /**
   * Estimate path length for polygons
   */
  estimatePathLength(element) {
    const points = element.getAttribute("points");
    if (!points) return 100;
    const pairs = points.trim().split(/\s+/).map((point) => {
      const coords = point.split(",").map(Number);
      return { x: coords[0] || 0, y: coords[1] || 0 };
    });
    if (pairs.length < 2) return 100;
    let length = 0;
    for (let i = 0; i < pairs.length; i++) {
      const next = (i + 1) % pairs.length;
      const dx = pairs[next].x - pairs[i].x;
      const dy = pairs[next].y - pairs[i].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length || 100;
  }
  // ========== PERFORMANCE MONITORING ==========
  updateFPS(timestamp) {
    this.frameCount++;
    if (this.frameCount % 30 === 0) {
      const timeDiff = timestamp - this.lastFrameTime;
      this.currentFPS = (3e4 / timeDiff).toFixed(1);
      this.lastFrameTime = timestamp;
      if (this.currentFPS < 20 && this.qualityLevel !== "low") {
        this.setQualityLevel("low");
      } else if (this.currentFPS < 40 && this.qualityLevel === "high") {
        this.setQualityLevel("medium");
      } else if (this.currentFPS > 50 && this.qualityLevel !== "high") {
        this.setQualityLevel("high");
      }
    }
  }
  setQualityLevel(level) {
    this.qualityLevel = level;
    console.log("[BorderRadial] Quality level set to:", level);
    switch (level) {
      case "high":
        this.config.maxConcurrentAnimations = 50;
        break;
      case "medium":
        this.config.maxConcurrentAnimations = 30;
        break;
      case "low":
        this.config.maxConcurrentAnimations = 15;
        break;
    }
  }
  // ========== UTILITIES ==========
  findHotspotElement(hotspotId) {
    if (this.stateManager) {
      const overlay = this.stateManager.getOverlay(hotspotId);
      if (overlay && overlay.element) {
        return overlay.element;
      }
    }
    const svgContainers = document.querySelectorAll(
      ".openseadragon-svg-overlay, .hotspot-overlay-svg, svg"
    );
    for (const container of svgContainers) {
      const element = container.querySelector(`[data-hotspot-id="${hotspotId}"]`);
      if (element) return element;
    }
    return document.getElementById(`hotspot-${hotspotId}`) || document.querySelector(`g[data-hotspot-id="${hotspotId}"]`);
  }
  // ========== CLEANUP ==========
  fadeOutAndCleanup() {
    if (!this.isAnimating && this.activeHotspots.size === 0) return;
    console.log("[BorderRadial] Starting fade out");
    this.activeHotspots.forEach((hotspotId) => {
      const element = this.findHotspotElement(hotspotId);
      if (element) {
        element.style.setProperty("--fade-duration", `${this.config.fadeOutDuration}ms`);
        element.classList.add("border-radial-fading");
      }
    });
    setTimeout(() => {
      this.cleanup();
    }, this.config.fadeOutDuration);
  }
  cleanup() {
    console.log("[BorderRadial] Cleaning up");
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }
    if (this.waveAnimator) {
      this.waveAnimator.cleanup();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.activeHotspots.forEach((hotspotId) => {
      const element = this.findHotspotElement(hotspotId);
      if (element) {
        element.classList.remove(
          "border-radial-hotspot",
          "border-radial-principal",
          "border-radial-secondary",
          "border-radial-revealing",
          "border-radial-fading",
          "reveal-from-left",
          "reveal-from-right",
          "reveal-from-top",
          "reveal-from-bottom"
        );
        element.style.removeProperty("--reveal-duration");
        element.style.removeProperty("--reveal-delay");
        element.style.removeProperty("--fade-duration");
        element.removeAttribute("data-hotspot-revealed");
      }
    });
    this.animations.clear();
    this.revealedHotspots.clear();
    this.activeHotspots.clear();
    this.isAnimating = false;
    if (this.distanceCache.size > 1e3) {
      this.distanceCache.clear();
    }
    if (this.bboxCache.size > 500) {
      this.bboxCache.clear();
    }
    if (this.transformCache.size > 500) {
      this.transformCache.clear();
    }
  }
  // ========== DESTROY ==========
  destroy() {
    this.cleanup();
    if (this.waveAnimator) {
      this.waveAnimator.destroy();
      this.waveAnimator = null;
    }
    const styleElement = document.getElementById("border-radial-styles");
    if (styleElement) {
      styleElement.remove();
    }
  }
}
class TemporalEchoController {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.eventCoordinator = options.eventCoordinator;
    this.hotspotRenderer = options.hotspotRenderer;
    this.stateManager = options.stateManager;
    this.spatialIndex = options.spatialIndex;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    const defaultRevealType = "focus";
    const validRevealTypes = ["focus", "ripple", "wave", "single", "border-radial"];
    const storedRevealType = localStorage.getItem("revealType");
    let revealType = defaultRevealType;
    if (storedRevealType && validRevealTypes.includes(storedRevealType)) {
      if (storedRevealType === "single") {
        revealType = "focus";
        localStorage.setItem("revealType", "focus");
      } else if (storedRevealType === "border-radial" || storedRevealType === "wave") {
        revealType = "ripple";
        localStorage.setItem("revealType", "ripple");
      } else {
        revealType = storedRevealType;
      }
    } else if (storedRevealType) {
      console.warn(
        `[TemporalEchoController] Invalid revealType in localStorage: "${storedRevealType}". Using default: ${defaultRevealType}`
      );
      localStorage.removeItem("revealType");
    }
    this.config = {
      echoRadius: options.echoRadius || 250,
      // Augmenté pour couvrir les zones denses
      echoDelay: options.echoDelay || 0,
      // Immediate feedback
      echoDuration: options.echoDuration || 800,
      // Animation duration ms
      maxSimultaneous: options.maxSimultaneous || 20,
      // Beaucoup plus pour les zones denses
      staggerDelay: options.staggerDelay || 12,
      // Reduced from 30ms for snappier response
      revealDuration: options.revealDuration || 2e3,
      // Shorter duration for performance
      enabled: options.enabled !== false,
      mobileMaxHotspots: options.mobileMaxHotspots || 15,
      // Augmenté pour meilleur effet visuel
      useAquaticEffect: false,
      // Disabled - no animation
      useCanvasAnimation: false,
      // DISABLED: Canvas draws circles instead of polygon shapes
      useAdjacentSelection: false,
      // DISABLED: Let reveal modes handle their own selection logic
      adjacencyThreshold: options.adjacencyThreshold || 50,
      // Pixels - how close hotspots need to be to be considered adjacent
      revealType,
      // Validated reveal type
      tapMode: options.tapMode || "direct",
      // 'direct' (new) or 'nearby' (old) - controls tap behavior
      tapTolerance: options.tapTolerance || (this.isMobile ? 20 : 10)
      // Tolerance zone in pixels
    };
    this.activeEchoes = /* @__PURE__ */ new Set();
    this.echoAnimations = /* @__PURE__ */ new Map();
    this.activeTimeouts = /* @__PURE__ */ new Set();
    this.hotspotCleanupTimeouts = /* @__PURE__ */ new Map();
    this.safetyCleanupInterval = null;
    this.startSafetyCleanup();
    this.fullResetInterval = null;
    this.startPeriodicReset();
    this.spatialIndexReady = false;
    this.canvasRenderer = null;
    this.isRevealing = false;
    this.batchDOMManager = null;
    this.useBatchDOM = options.useBatchDOM !== false;
    this.hitDetector = null;
    this.useCanvasHitDetection = options.useCanvasHitDetection !== false;
    this.initializeGestureAdapter();
    this.initializeRippleRenderer();
    this.initializeCanvasRenderer();
    this.initializeBatchDOMManager();
    this.initializeHitDetector();
    if (this.isMobile) {
      shadowSpriteManager.initialize();
    }
    this.initializeContrastDetection();
    this.borderRadialAnimator = new BorderRadialAnimator(this.viewer, this.stateManager, this);
    console.log("[TemporalEchoController] BorderRadialAnimator initialized for ripple mode");
    this.cleanupAllRevealStylesOnStartup();
    this.frameCount = 0;
    this.lastFPSCheck = performance.now();
    this.currentFPS = 60;
    console.log("[TemporalEchoController] Initialized", this.config);
    console.log(
      "[TemporalEchoController] Tap mode:",
      this.config.tapMode,
      "- Tolerance:",
      this.config.tapTolerance,
      "px"
    );
    window.temporalEchoController = this;
    this.viewer.addHandler("zoom", () => {
      requestAnimationFrame(() => {
        const currentZoom = this.viewer.viewport.getZoom();
        const lowZoomThreshold = 1.5;
        let zoomFactor;
        if (currentZoom >= lowZoomThreshold) {
          zoomFactor = 1;
        } else {
          zoomFactor = Math.min(3, lowZoomThreshold / currentZoom);
        }
        document.querySelectorAll(".hotspot-echo-reveal").forEach((el) => {
          el.style.setProperty("--zoom-factor", zoomFactor);
        });
      });
    });
    window.setTapMode = (mode) => {
      if (mode === "direct" || mode === "nearby") {
        this.config.tapMode = mode;
        console.log(`[TemporalEchoController] Tap mode changed to: ${mode}`);
        console.log(
          `  - direct: Reveal only the tapped hotspot with ${this.config.tapTolerance}px tolerance`
        );
        console.log(
          `  - nearby: Reveal multiple hotspots within ${this.config.echoRadius}px radius`
        );
        return `Tap mode set to: ${mode}`;
      }
      return 'Invalid mode. Use "direct" or "nearby"';
    };
    window.setTapTolerance = (pixels) => {
      if (pixels > 0 && pixels <= 100) {
        this.config.tapTolerance = pixels;
        console.log(`[TemporalEchoController] Tap tolerance changed to: ${pixels}px`);
        return `Tap tolerance set to: ${pixels}px`;
      }
      return "Tolerance must be between 1 and 100 pixels";
    };
    window.debugRevealHotspot = (hotspotId) => {
      const hotspot = { id: hotspotId };
      const hotspotData = {
        hotspot,
        centerX: 100,
        centerY: 100
      };
      this.revealSingleHotspot(hotspotData, {}, 0);
    };
    window.debugShowAllHotspots = () => {
      const elements = document.querySelectorAll("[data-hotspot-id]");
      console.log(`[Debug] Found ${elements.length} hotspot elements`);
      elements.forEach((el, i) => {
        if (i < 5) {
          console.log(`[Debug] Hotspot ${i}:`, {
            id: el.getAttribute("data-hotspot-id"),
            tagName: el.tagName,
            className: el.className,
            opacity: window.getComputedStyle(el).opacity,
            visibility: window.getComputedStyle(el).visibility,
            display: window.getComputedStyle(el).display
          });
        }
      });
    };
  }
  /**
   * Set reveal type (multiple or single)
   */
  setRevealType(type) {
    this.config.revealType = type;
    localStorage.setItem("revealType", type);
    console.log("[TemporalEchoController] Reveal type set to:", type);
  }
  /**
   * Schedule cleanup for a revealed hotspot
   * Centralized method to ensure ALL revealed hotspots get cleaned up
   */
  scheduleHotspotCleanup(hotspotId, duration = null) {
    const cleanupDuration = duration || this.config.revealDuration + 300;
    if (this.hotspotCleanupTimeouts.has(hotspotId)) {
      clearTimeout(this.hotspotCleanupTimeouts.get(hotspotId));
      console.log(`[TemporalEcho] Rescheduling cleanup for hotspot ${hotspotId}`);
    }
    const cleanupTimeout = setTimeout(() => {
      console.log(`[TemporalEcho] Cleaning up hotspot: ${hotspotId}`);
      const overlay = this.stateManager.getOverlay(hotspotId);
      if (overlay && overlay.element) {
        overlay.element.removeAttribute("data-hotspot-revealed");
        overlay.element.removeAttribute("data-reveal-time");
        overlay.element.classList.remove("hotspot-echo-active", "hotspot-echo-reveal");
        console.log(
          `[TemporalEcho] Cleaned revealed state from overlay element for ${hotspotId}`
        );
      }
      const elements = document.querySelectorAll(`[data-hotspot-id="${hotspotId}"]`);
      elements.forEach((element) => {
        if (element.getAttribute("data-hotspot-revealed") === "true") {
          element.removeAttribute("data-hotspot-revealed");
          element.removeAttribute("data-reveal-time");
          element.classList.remove("hotspot-echo-active", "hotspot-echo-reveal");
          console.log(
            `[TemporalEcho] Cleaned revealed state from DOM element for ${hotspotId}`
          );
        }
      });
      const gElements = document.querySelectorAll(`g[data-hotspot-id="${hotspotId}"]`);
      gElements.forEach((element) => {
        if (element.getAttribute("data-hotspot-revealed") === "true") {
          element.removeAttribute("data-hotspot-revealed");
          element.removeAttribute("data-reveal-time");
          element.classList.remove("hotspot-echo-active", "hotspot-echo-reveal");
          console.log(
            `[TemporalEcho] Cleaned revealed state from g element for ${hotspotId}`
          );
        }
      });
      this.activeEchoes.delete(hotspotId);
      this.echoAnimations.delete(hotspotId);
      const stored = this.echoAnimations.get(hotspotId);
      if (stored) {
        const selectedHotspot = this.stateManager.getSelectedHotspot();
        if (!selectedHotspot || selectedHotspot.id !== hotspotId) {
          if (stored.element) {
            if (stored.originalOpacity !== void 0) {
              stored.element.style.opacity = stored.originalOpacity;
            }
            if (stored.originalVisibility !== void 0) {
              stored.element.style.visibility = stored.originalVisibility;
            }
            if (stored.wasHidden) {
              stored.element.classList.add("hotspot-hidden");
            }
            if (!stored.wasVisible) {
              stored.element.classList.remove("hotspot-visible");
            }
          }
        }
        this.echoAnimations.delete(hotspotId);
      }
      this.hotspotCleanupTimeouts.delete(hotspotId);
    }, cleanupDuration);
    this.hotspotCleanupTimeouts.set(hotspotId, cleanupTimeout);
  }
  /**
   * Initialize gesture adapter
   */
  initializeGestureAdapter() {
    this.gestureAdapter = new TemporalEchoGestureAdapter({
      eventCoordinator: this.eventCoordinator,
      viewer: this.viewer,
      onQuickTap: this.handleQuickTap.bind(this)
    });
    if (this.config.enabled) {
      this.gestureAdapter.enable();
    }
  }
  /**
   * Initialize CSS ripple renderer
   */
  initializeRippleRenderer() {
    this.rippleRenderer = new CSSRippleRenderer({
      viewer: this.viewer,
      radius: this.config.echoRadius,
      duration: this.config.echoDuration,
      maxRipples: 3,
      // Limit for performance
      onRippleComplete: this.handleRippleComplete.bind(this)
    });
    if (this.config.enabled) {
      this.rippleRenderer.initialize();
    }
    window.cssRippleRenderer = this.rippleRenderer;
  }
  /**
   * Initialize Canvas renderer for hybrid animations (Phase 2)
   */
  initializeCanvasRenderer() {
    if (!this.config.useCanvasAnimation || !this.isMobile) {
      console.log("[TemporalEchoController] Canvas animation disabled or not mobile");
      return;
    }
    this.canvasRenderer = new CanvasHotspotRenderer({
      viewer: this.viewer,
      container: this.viewer.container
      // Use viewer.container for proper overlay positioning
    });
    window.temporalEchoController = this;
    console.log("[TemporalEchoController] Canvas renderer initialized for hybrid animations");
  }
  /**
   * Initialize contrast detection system
   */
  initializeContrastDetection() {
    this.contrastDetection = new ContrastDetection(this.viewer);
    window.contrastDetection = this.contrastDetection;
  }
  /**
   * Initialize Batch DOM Manager for Phase 3 optimization
   */
  initializeBatchDOMManager() {
    if (!this.useBatchDOM || !this.isMobile) {
      console.log("[TemporalEchoController] Batch DOM disabled or not mobile");
      return;
    }
    this.batchDOMManager = new BatchDOMManager();
    window.batchDOMManager = this.batchDOMManager;
    console.log(
      "[TemporalEchoController] BatchDOMManager initialized for Phase 3 optimization"
    );
  }
  /**
   * Initialize Canvas Hit Detector for Phase 4 optimization
   */
  initializeHitDetector() {
    if (!this.useCanvasHitDetection || !this.isMobile) {
      console.log("[TemporalEchoController] Canvas hit detection disabled or not mobile");
      return;
    }
    this.hitDetector = new CanvasHitDetector({
      viewer: this.viewer,
      spatialIndex: this.spatialIndex,
      enabled: true
    });
    window.hitDetector = this.hitDetector;
    console.log(
      "[TemporalEchoController] CanvasHitDetector initialized for Phase 4 optimization"
    );
  }
  // Removed animation system initialization methods
  /**
   * Handle quick tap - trigger echo revelation
   */
  handleQuickTap(tapData) {
    var _a, _b, _c;
    console.log(
      "[TemporalEchoController] handleQuickTap called, enabled:",
      this.config.enabled
    );
    if (!this.revealCount) this.revealCount = 0;
    this.revealCount++;
    console.log(`[TemporalEchoController] Reveal #${this.revealCount} starting`);
    if (!this.config.enabled) {
      console.log("[TemporalEchoController] Echo disabled, skipping");
      return false;
    }
    if (!this.isMobile) {
      console.log("[TemporalEchoController] Not on mobile, skipping echo");
      return false;
    }
    this.cleanupExpiredRevealedStates();
    const rect = this.viewer.element.getBoundingClientRect();
    const pixelPoint = new OpenSeadragon.Point(tapData.x - rect.left, tapData.y - rect.top);
    const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
    const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
    const hotspotAtPoint = window.nativeHotspotRenderer && window.nativeHotspotRenderer.engine.findSmallestHotspotAtPoint(imagePoint);
    let revealedHotspotNearby = null;
    if (!hotspotAtPoint && this.isMobile) {
      const nearbyHotspots2 = this.findHotspotsInRadius(tapData, 50);
      for (const nearby of nearbyHotspots2) {
        if (this.isHotspotRevealed(nearby.hotspot.id || nearby.id)) {
          revealedHotspotNearby = nearby.hotspot || nearby;
          console.log(
            "[TemporalEchoController] Found revealed hotspot nearby:",
            revealedHotspotNearby.id
          );
          break;
        }
      }
    }
    const targetHotspot = hotspotAtPoint || revealedHotspotNearby;
    if (targetHotspot) {
      const isRevealed = this.isHotspotRevealed(targetHotspot.id);
      console.log("[TemporalEchoController] Hotspot detection:", {
        hotspotId: targetHotspot.id,
        isRevealed,
        activeEchoes: Array.from(this.activeEchoes),
        animationExists: this.echoAnimations.has(targetHotspot.id),
        domRevealed: (_a = this.getHotspotElement(targetHotspot.id)) == null ? void 0 : _a.getAttribute(
          "data-hotspot-revealed"
        )
      });
      if (isRevealed) {
        console.log(
          "[TemporalEchoController] Tapped on/near revealed hotspot, triggering zoom (TEMPO 2):",
          targetHotspot.id
        );
        this.cleanupRevealStyles(targetHotspot.id);
        if (window.multimodalSyncEngine) {
          window.multimodalSyncEngine.triggerSynchronizedFeedback({
            ...tapData,
            type: "activate"
          }).then((results) => {
            console.log(
              "[TemporalEchoController] Tempo 2 feedback triggered:",
              results
            );
          });
        } else if ((_b = window.minimalistAudioEngine) == null ? void 0 : _b.isUnlocked) {
          const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
          if (!isMobile2) {
            window.minimalistAudioEngine.playActivate();
          } else {
            console.log(
              "[TemporalEchoController] Audio disabled on mobile for activation"
            );
          }
        }
        if (window.nativeHotspotRenderer) {
          console.log(
            "[TemporalEchoController] Directly activating revealed hotspot for zoom"
          );
          setTimeout(() => {
            window.nativeHotspotRenderer.activateHotspot(targetHotspot, true);
          }, 50);
        }
        return false;
      }
    }
    console.log(
      "[TemporalEchoController] Quick tap detected on mobile, triggering echo (TEMPO 1)",
      tapData
    );
    if (window.multimodalSyncEngine) {
      window.multimodalSyncEngine.triggerSynchronizedFeedback({
        ...tapData,
        type: "reveal"
      }).then((results) => {
        console.log(
          "[TemporalEchoController] Synchronized feedback triggered:",
          results
        );
      });
    } else {
      const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
      if (!isMobile2 && ((_c = window.minimalistAudioEngine) == null ? void 0 : _c.isUnlocked)) {
        window.minimalistAudioEngine.playReveal();
        console.log("[TemporalEchoController] Fallback: Played reveal sound immediately");
      } else if (isMobile2) {
        console.log("[TemporalEchoController] Audio disabled on mobile, haptics only");
      }
    }
    this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_TAP, {
      x: tapData.x,
      y: tapData.y,
      viewportX: tapData.viewportX,
      viewportY: tapData.viewportY
    });
    const tapImagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
    let nearbyHotspots = [];
    if (this.config.tapMode === "direct" && this.isMobile) {
      console.log("[TemporalEchoController] Direct tap mode active (mobile)");
      let directHotspot = this.spatialIndex.getHotspotAtPoint(
        tapImagePoint.x,
        tapImagePoint.y
      );
      if (!directHotspot) {
        console.log(
          "[TemporalEchoController] No direct hit, searching within tolerance zone:",
          this.config.tapTolerance
        );
        const toleranceCandidates = this.spatialIndex.findNearbyHotspots(
          tapImagePoint.x,
          tapImagePoint.y,
          this.config.tapTolerance,
          5
          // Max 5 candidates to check
        );
        if (toleranceCandidates.length > 0) {
          directHotspot = toleranceCandidates[0];
          console.log(
            "[TemporalEchoController] Found hotspot within tolerance zone:",
            directHotspot.id
          );
        }
      }
      if (directHotspot) {
        console.log("[TemporalEchoController] Direct tap on hotspot:", directHotspot.id);
        nearbyHotspots = [
          {
            id: directHotspot.id,
            distance: 0,
            hotspot: directHotspot
          }
        ];
      } else {
        console.log("[TemporalEchoController] No hotspot at tap location");
        this.showMissedTapFeedback(tapData);
        return true;
      }
    } else {
      console.log("[TemporalEchoController] Nearby tap mode active (original behavior)");
      nearbyHotspots = this.findHotspotsInRadius(tapData, this.config.echoRadius);
      if (this.config.revealType === "focus" && nearbyHotspots.length > 0) {
        nearbyHotspots.sort((a, b) => a.distance - b.distance);
        nearbyHotspots = [nearbyHotspots[0]];
        console.log("[TemporalEchoController] Focus mode: revealing only closest hotspot");
      } else if (this.config.revealType === "ripple" && nearbyHotspots.length > 0) {
        console.log(
          "[TemporalEchoController] Ripple mode: revealing",
          nearbyHotspots.length,
          "hotspots"
        );
      }
      if (nearbyHotspots.length === 0 && this.isMobile) {
        console.log("[TemporalEchoController] No hotspots found nearby");
        this.showMissedTapFeedback(tapData);
        return true;
      }
    }
    if (this.canvasRenderer && this.config.useCanvasAnimation && nearbyHotspots.length > 0) {
      console.log(
        `[TemporalEchoController] Using Canvas renderer for ${nearbyHotspots.length} hotspots`
      );
      this.isRevealing = true;
      const tapImagePoint2 = {
        x: imagePoint.x,
        y: imagePoint.y
      };
      this.canvasRenderer.startRevealAnimation(nearbyHotspots, tapImagePoint2);
      setTimeout(() => {
        this.revealHotspotsSVG(nearbyHotspots, tapData);
        setTimeout(() => {
          this.isRevealing = false;
          if (window.nativeHotspotRenderer) {
            window.nativeHotspotRenderer.updateVisibility();
          }
        }, 400);
      }, 600);
    } else {
      if (this.config.revealType === "ripple" && nearbyHotspots.length > 0) {
        console.log("[TemporalEchoController] Ripple mode: Using BorderRadialAnimator");
        this.revealHotspots(nearbyHotspots, tapData);
      } else {
        if (nearbyHotspots.length > 0) {
          console.log(
            `[TemporalEchoController] Found ${nearbyHotspots.length} hotspots in radius (focus mode)`
          );
          this.revealHotspots(nearbyHotspots, tapData);
        } else {
          console.log("[TemporalEchoController] No hotspots found in echo radius");
        }
      }
    }
    this.updateFPS();
    return true;
  }
  /**
   * Build spatial index for fast hotspot search
   * Phase 1: Now uses Flatbush-based SpatialIndex for 30% faster searches
   */
  buildSpatialIndex() {
    if (!this.spatialIndex) {
      console.warn("[TemporalEchoController] SpatialIndex not provided, skipping build");
      return;
    }
    console.log("[TemporalEchoController] Building Flatbush spatial index for hotspots");
    const startTime = performance.now();
    const allOverlays = this.stateManager.getAllOverlays();
    const hotspotData = [];
    allOverlays.forEach((overlayData, hotspotId) => {
      const hotspot = overlayData.hotspot;
      if (!hotspot || !hotspot.coordinates || hotspot.coordinates.length === 0) return;
      hotspotData.push({
        id: hotspotId,
        shape: hotspot.shape,
        coordinates: hotspot.coordinates,
        hotspot,
        overlayData
      });
    });
    this.spatialIndex.loadHotspots(hotspotData);
    this.spatialIndexReady = true;
    const buildTime = performance.now() - startTime;
    console.log(
      `[TemporalEchoController] Flatbush index built with ${hotspotData.length} hotspots in ${buildTime.toFixed(2)}ms`
    );
  }
  /**
   * Find hotspots within radius of tap point
   * Phase 1 Optimization: Now uses Flatbush for < 5ms searches
   * Phase 4 Optimization: Uses CanvasHitDetector for < 2ms searches
   * NEW: Supports adjacent selection for "côte à côte" hotspots
   */
  findHotspotsInRadius(tapData, radius) {
    const isSpecialMode = this.config.revealType === "ripple";
    if (this.hitDetector && this.useCanvasHitDetection && this.isMobile && !this.config.useAdjacentSelection && !isSpecialMode) {
      const canvasResults = this.canvasHitSearch(tapData, radius);
      if (canvasResults && canvasResults.length > 0) {
        console.log("[TemporalEchoController] Using Canvas hit detection (Phase 4)");
        return canvasResults;
      }
    }
    if (this.spatialIndexReady && this.spatialIndex) {
      return this.spatialIndexSearch(tapData, radius, this.config.useAdjacentSelection);
    }
    if (!this.spatialIndexReady && this.spatialIndex) {
      this.buildSpatialIndex();
      if (this.spatialIndexReady) {
        return this.spatialIndexSearch(tapData, radius, this.config.useAdjacentSelection);
      }
    }
    return this.linearHotspotSearch(tapData, radius);
  }
  /**
   * Canvas hit search using Phase 4 optimization
   * Target: < 2ms for hit detection
   */
  canvasHitSearch(tapData, radius) {
    const startTime = performance.now();
    const rect = this.viewer.element.getBoundingClientRect();
    const pixelPoint = new OpenSeadragon.Point(tapData.x - rect.left, tapData.y - rect.top);
    const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
    const tapImagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
    const viewportBounds = this.viewer.viewport.getBounds();
    const topLeft = this.viewer.viewport.viewportToImageCoordinates(
      viewportBounds.x,
      viewportBounds.y
    );
    const bottomRight = this.viewer.viewport.viewportToImageCoordinates(
      viewportBounds.x + viewportBounds.width,
      viewportBounds.y + viewportBounds.height
    );
    const bounds = {
      minX: topLeft.x,
      minY: topLeft.y,
      maxX: bottomRight.x,
      maxY: bottomRight.y
    };
    const currentZoom = this.viewer.viewport.getZoom();
    const containerWidth = this.viewer.viewport.getContainerSize().x;
    const imageWidth = this.viewer.world.getItemAt(0).getContentSize().x;
    const viewportToImageScale = imageWidth / containerWidth / currentZoom;
    const radiusInImageSpace = radius * viewportToImageScale;
    console.log("[TemporalEchoController] Canvas hit - Radius conversion:", {
      radiusInPixels: radius,
      radiusInImageSpace,
      tapImagePoint: { x: tapImagePoint.x, y: tapImagePoint.y }
    });
    const maxHotspots = this.isMobile ? this.config.mobileMaxHotspots : this.config.maxSimultaneous;
    const hotspotIds = this.hitDetector.findNearbyHits(
      tapImagePoint.x,
      tapImagePoint.y,
      radiusInImageSpace,
      bounds,
      maxHotspots
    );
    const hotspots = [];
    for (const id of hotspotIds) {
      const hotspot = this.spatialIndex.getHotspotById(id);
      if (hotspot) {
        const dx = hotspot.center.x - tapImagePoint.x;
        const dy = hotspot.center.y - tapImagePoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        hotspots.push({
          id: hotspot.id,
          distance,
          hotspot: hotspot.hotspot || hotspot
        });
      }
    }
    const searchTime = performance.now() - startTime;
    if (searchTime > 2) {
      console.warn(
        `[TemporalEchoController] Canvas hit search exceeded 2ms: ${searchTime.toFixed(2)}ms`
      );
    } else {
      console.log(
        `[TemporalEchoController] Ultra-fast Canvas hit: ${searchTime.toFixed(2)}ms for ${hotspots.length} hotspots`
      );
    }
    return hotspots;
  }
  /**
   * Fast spatial index search using Flatbush
   * Phase 1: Optimized to < 5ms using findNearbyHotspots
   * UPDATED: Now supports adjacent hotspot selection for "côte à côte" effect
   */
  spatialIndexSearch(tapData, radius, useAdjacent = true) {
    const startTime = performance.now();
    if (this.config.revealType === "ripple") {
      console.log(
        `[TemporalEchoController] Using contiguous clustering for ${this.config.revealType} mode`
      );
      return this.findContiguousClusters(tapData, radius);
    }
    const rect = this.viewer.element.getBoundingClientRect();
    const pixelPoint = new OpenSeadragon.Point(tapData.x - rect.left, tapData.y - rect.top);
    const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
    const tapImagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
    const maxHotspots = this.isMobile ? this.config.mobileMaxHotspots : this.config.maxSimultaneous;
    let nearbyHotspots;
    if (useAdjacent && this.spatialIndex.findAdjacentHotspots) {
      console.log(
        "[TemporalEchoController] Using adjacent hotspot selection for contiguous group"
      );
      const adjacencyPixels = 50;
      const edgePixel = new OpenSeadragon.Point(pixelPoint.x + adjacencyPixels, pixelPoint.y);
      const edgeViewport = this.viewer.viewport.pointFromPixel(edgePixel);
      const edgeImage = this.viewer.viewport.viewportToImageCoordinates(edgeViewport);
      const adjacencyThreshold = Math.abs(edgeImage.x - tapImagePoint.x);
      nearbyHotspots = this.spatialIndex.findAdjacentHotspots(
        tapImagePoint.x,
        tapImagePoint.y,
        maxHotspots,
        adjacencyThreshold
      );
    } else {
      console.log("[TemporalEchoController] Using distance-based hotspot selection");
      const centerPixel = pixelPoint;
      const edgePixel = new OpenSeadragon.Point(pixelPoint.x + radius, pixelPoint.y);
      const centerViewport = this.viewer.viewport.pointFromPixel(centerPixel);
      const edgeViewport = this.viewer.viewport.pointFromPixel(edgePixel);
      const centerImage = this.viewer.viewport.viewportToImageCoordinates(centerViewport);
      const edgeImage = this.viewer.viewport.viewportToImageCoordinates(edgeViewport);
      const radiusInImageSpace = Math.abs(edgeImage.x - centerImage.x);
      nearbyHotspots = this.spatialIndex.findNearbyHotspots(
        tapImagePoint.x,
        tapImagePoint.y,
        radiusInImageSpace,
        maxHotspots
      );
    }
    const hotspots = nearbyHotspots.map((hotspot) => ({
      id: hotspot.id,
      distance: Math.sqrt(
        Math.pow(hotspot.center.x - tapImagePoint.x, 2) + Math.pow(hotspot.center.y - tapImagePoint.y, 2)
      ),
      hotspot: hotspot.hotspot || hotspot
    }));
    const searchTime = performance.now() - startTime;
    const searchType = useAdjacent ? "adjacent" : "distance";
    if (searchTime > 5) {
      console.warn(
        `[TemporalEchoController] Slow ${searchType} search: ${searchTime.toFixed(2)}ms for ${hotspots.length} hotspots`
      );
    } else {
      console.log(
        `[TemporalEchoController] Fast ${searchType} search: ${searchTime.toFixed(2)}ms for ${hotspots.length} hotspots`
      );
    }
    return hotspots;
  }
  /**
   * Contiguous cluster selection using Hybrid BFS region growing
   * Achieves <40ms performance for 600+ hotspots
   */
  findContiguousClusters(tapData, radius) {
    const startTime = performance.now();
    const rect = this.viewer.element.getBoundingClientRect();
    const pixelPoint = new OpenSeadragon.Point(tapData.x - rect.left, tapData.y - rect.top);
    const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
    const tapImagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
    const seedHotspot = this.findSeedHotspot(tapImagePoint, radius);
    if (!seedHotspot) {
      console.log("[ContiguousCluster] No seed hotspot found");
      return [];
    }
    if (this.config.revealType === "ripple") {
      console.log(
        "[Ripple] Finding only direct neighbors of principal hotspot:",
        seedHotspot.id
      );
      const directNeighbors = this.findDirectNeighborsOnly(seedHotspot);
      const elapsed2 = performance.now() - startTime;
      console.log(
        `[Ripple] Found ${directNeighbors.length} direct neighbors in ${elapsed2.toFixed(2)}ms`
      );
      const cluster2 = [seedHotspot, ...directNeighbors];
      return cluster2.map((h) => ({
        id: h.id,
        distance: h.distance || 0,
        hotspot: h.hotspot || h
      }));
    }
    let maxClusterSize;
    if (this.config.revealType === "refined") {
      maxClusterSize = 5;
    } else if (this.config.revealType === "refined2") {
      maxClusterSize = this.isMobile ? 10 : 15;
    } else {
      maxClusterSize = this.isMobile ? 15 : 20;
    }
    const params = {
      maxClusterSize,
      adjacencyThreshold: 50,
      // Pixels - increased for better clustering
      coherenceThreshold: 0.4,
      // 40% fill ratio - more permissive for text
      timeLimit: 40,
      // 40ms max execution time
      expansionStrategy: "BFS"
      // Breadth-first for compact clusters
    };
    console.log("[ContiguousCluster] Starting BFS region growing from seed:", seedHotspot.id);
    const cluster = this.growContiguousRegion(seedHotspot, params, startTime);
    const elapsed = performance.now() - startTime;
    console.log(
      `[ContiguousCluster] Selected ${cluster.length} contiguous hotspots in ${elapsed.toFixed(2)}ms`
    );
    return cluster.map((h) => ({
      id: h.id,
      distance: h.distance || 0,
      hotspot: h.hotspot || h
    }));
  }
  /**
   * Find only direct neighbors of a hotspot (for ripple mode)
   * This returns ONLY the hotspots directly adjacent to the principal hotspot,
   * NOT the neighbors of neighbors
   */
  findDirectNeighborsOnly(principalHotspot) {
    const directNeighbors = [];
    const visited = /* @__PURE__ */ new Set();
    visited.add(principalHotspot.id);
    const adjacencyPixels = 40;
    const adjacencyInImageSpace = this.convertPixelsToImageSpace(adjacencyPixels);
    const neighbors = this.findAdjacentHotspots(
      principalHotspot,
      adjacencyInImageSpace,
      visited
    );
    const principalBounds = this.getHotspotBounds(principalHotspot);
    const principalCenter = {
      x: (principalBounds.minX + principalBounds.maxX) / 2,
      y: (principalBounds.minY + principalBounds.maxY) / 2
    };
    neighbors.forEach((neighbor) => {
      const neighborBounds = this.getHotspotBounds(neighbor);
      const neighborCenter = {
        x: (neighborBounds.minX + neighborBounds.maxX) / 2,
        y: (neighborBounds.minY + neighborBounds.maxY) / 2
      };
      neighbor.distance = Math.sqrt(
        Math.pow(neighborCenter.x - principalCenter.x, 2) + Math.pow(neighborCenter.y - principalCenter.y, 2)
      );
      directNeighbors.push(neighbor);
      visited.add(neighbor.id);
    });
    directNeighbors.sort((a, b) => a.distance - b.distance);
    console.log(
      `[Ripple] Found ${directNeighbors.length} direct neighbors within ${adjacencyPixels}px of principal hotspot`
    );
    if (directNeighbors.length > 0) {
      const neighborIds = directNeighbors.slice(0, 5).map((n) => n.id).join(", ");
      const moreText = directNeighbors.length > 5 ? ` and ${directNeighbors.length - 5} more` : "";
      console.log(`[Ripple] Direct neighbors: ${neighborIds}${moreText}`);
    }
    return directNeighbors;
  }
  /**
   * Find the closest hotspot to tap point as seed
   */
  findSeedHotspot(tapImagePoint, radius) {
    const edgePixel = new OpenSeadragon.Point(radius, 0);
    const edgeViewport = this.viewer.viewport.pointFromPixel(edgePixel);
    const edgeImage = this.viewer.viewport.viewportToImageCoordinates(edgeViewport);
    const radiusInImageSpace = Math.abs(edgeImage.x);
    if (this.spatialIndex && this.spatialIndex.findNearbyHotspots) {
      const candidates = this.spatialIndex.findNearbyHotspots(
        tapImagePoint.x,
        tapImagePoint.y,
        radiusInImageSpace,
        1
        // Just need the closest one
      );
      if (candidates.length > 0) {
        return candidates[0].hotspot || candidates[0];
      }
    }
    return null;
  }
  /**
   * Grow contiguous region using Hybrid BFS
   */
  growContiguousRegion(seedHotspot, params, startTime) {
    const cluster = [];
    const visited = /* @__PURE__ */ new Set();
    const queue = [seedHotspot];
    visited.add(seedHotspot.id);
    const adjacencyInImageSpace = this.convertPixelsToImageSpace(params.adjacencyThreshold);
    while (queue.length > 0 && cluster.length < params.maxClusterSize) {
      if (performance.now() - startTime > params.timeLimit) {
        console.log("[ContiguousCluster] Time limit reached, stopping expansion");
        break;
      }
      const current = queue.shift();
      cluster.push(current);
      const neighbors = this.findAdjacentHotspots(current, adjacencyInImageSpace, visited);
      if (cluster.length > 3) {
        const coherence = this.calculateClusterCoherence([...cluster, ...neighbors]);
        if (coherence < params.coherenceThreshold) {
          console.log(
            "[ContiguousCluster] Coherence threshold reached, stopping expansion"
          );
          break;
        }
      }
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push(neighbor);
        }
      }
    }
    return cluster;
  }
  /**
   * Find hotspots adjacent to the given hotspot
   */
  findAdjacentHotspots(hotspot, threshold, visited) {
    const adjacent = [];
    const bounds = this.getHotspotBounds(hotspot);
    ({
      minX: bounds.minX - threshold,
      minY: bounds.minY - threshold,
      maxX: bounds.maxX + threshold,
      maxY: bounds.maxY + threshold
    });
    if (this.spatialIndex && this.spatialIndex.findNearbyHotspots) {
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const searchRadius = Math.max((bounds.maxX - bounds.minX) / 2, (bounds.maxY - bounds.minY) / 2) + threshold;
      const candidates = this.spatialIndex.findNearbyHotspots(
        centerX,
        centerY,
        searchRadius,
        50
        // Get more candidates to test
      );
      for (const candidate of candidates) {
        const candidateHotspot = candidate.hotspot || candidate;
        if (visited.has(candidateHotspot.id) || candidateHotspot.id === hotspot.id) {
          continue;
        }
        if (this.testAdjacency(hotspot, candidateHotspot, threshold)) {
          adjacent.push(candidateHotspot);
        }
      }
    }
    return adjacent;
  }
  /**
   * Test if two hotspots are adjacent (2-phase approach)
   */
  testAdjacency(hotspot1, hotspot2, threshold) {
    const bounds1 = this.getHotspotBounds(hotspot1);
    const bounds2 = this.getHotspotBounds(hotspot2);
    const xOverlap = !(bounds1.maxX + threshold < bounds2.minX || bounds2.maxX + threshold < bounds1.minX);
    const yOverlap = !(bounds1.maxY + threshold < bounds2.minY || bounds2.maxY + threshold < bounds1.minY);
    if (!xOverlap || !yOverlap) {
      return false;
    }
    const distance = this.calculateMinDistance(hotspot1, hotspot2);
    return distance <= threshold;
  }
  /**
   * Calculate minimum distance between two hotspots
   */
  calculateMinDistance(hotspot1, hotspot2) {
    let minDist = Infinity;
    const coords1 = hotspot1.coordinates || [];
    const coords2 = hotspot2.coordinates || [];
    for (let i = 0; i < coords1.length; i++) {
      for (let j = 0; j < coords2.length; j++) {
        const dist = this.pointDistance(coords1[i], coords2[j]);
        minDist = Math.min(minDist, dist);
        if (minDist < 0.1) return 0;
      }
    }
    return minDist;
  }
  /**
   * Calculate distance between two points
   */
  pointDistance(p1, p2) {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  /**
   * Get bounding box of a hotspot
   */
  getHotspotBounds(hotspot) {
    const coords = hotspot.coordinates || [];
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const coord of coords) {
      minX = Math.min(minX, coord[0]);
      maxX = Math.max(maxX, coord[0]);
      minY = Math.min(minY, coord[1]);
      maxY = Math.max(maxY, coord[1]);
    }
    return { minX, maxX, minY, maxY };
  }
  /**
   * Calculate cluster coherence (compactness)
   */
  calculateClusterCoherence(hotspots) {
    if (hotspots.length === 0) return 0;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let totalArea = 0;
    for (const hotspot of hotspots) {
      const bounds = this.getHotspotBounds(hotspot);
      minX = Math.min(minX, bounds.minX);
      maxX = Math.max(maxX, bounds.maxX);
      minY = Math.min(minY, bounds.minY);
      maxY = Math.max(maxY, bounds.maxY);
      const area = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
      totalArea += area;
    }
    const boxArea = (maxX - minX) * (maxY - minY);
    return boxArea > 0 ? totalArea / boxArea : 0;
  }
  /**
   * Convert pixels to image space
   */
  convertPixelsToImageSpace(pixels) {
    const pixelPoint = new OpenSeadragon.Point(pixels, 0);
    const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
    const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
    return Math.abs(imagePoint.x);
  }
  /**
   * Intelligent hotspot selection for coherent text blocks and contour detection
   * [DEPRECATED - Replaced by findContiguousClusters]
   */
  findIntelligentHotspots(tapData, radius) {
    const startTime = performance.now();
    const rect = this.viewer.element.getBoundingClientRect();
    const pixelPoint = new OpenSeadragon.Point(tapData.x - rect.left, tapData.y - rect.top);
    const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
    const tapImagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
    const edgePixel = new OpenSeadragon.Point(pixelPoint.x + radius, pixelPoint.y);
    const edgeViewport = this.viewer.viewport.pointFromPixel(edgePixel);
    const edgeImage = this.viewer.viewport.viewportToImageCoordinates(edgeViewport);
    const radiusInImageSpace = Math.abs(edgeImage.x - tapImagePoint.x);
    const maxHotspots = this.isMobile ? this.config.mobileMaxHotspots : this.config.maxSimultaneous;
    let candidateHotspots = [];
    if (this.spatialIndex && this.spatialIndex.findNearbyHotspots) {
      candidateHotspots = this.spatialIndex.findNearbyHotspots(
        tapImagePoint.x,
        tapImagePoint.y,
        radiusInImageSpace,
        maxHotspots * 2
        // Get more candidates for intelligent selection
      );
    }
    if (candidateHotspots.length === 0) {
      console.log("[IntelligentSelection] No hotspots found in radius");
      return [];
    }
    console.log(
      `[IntelligentSelection] Found ${candidateHotspots.length} candidates, applying intelligence...`
    );
    const hotspotsWithMetrics = candidateHotspots.map((hotspot) => {
      var _a, _b;
      const h = hotspot.hotspot || hotspot;
      let centerX = 0, centerY = 0;
      if (h.coordinates && h.coordinates.length > 0) {
        const coords = h.shape === "multipolygon" ? h.coordinates[0] : h.coordinates;
        coords.forEach(([x, y]) => {
          centerX += x;
          centerY += y;
        });
        centerX /= coords.length;
        centerY /= coords.length;
      } else {
        centerX = ((_a = h.center) == null ? void 0 : _a.x) || 0;
        centerY = ((_b = h.center) == null ? void 0 : _b.y) || 0;
      }
      const distance = Math.sqrt(
        Math.pow(centerX - tapImagePoint.x, 2) + Math.pow(centerY - tapImagePoint.y, 2)
      );
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      if (h.coordinates) {
        const coords = h.shape === "multipolygon" ? h.coordinates[0] : h.coordinates;
        coords.forEach(([x, y]) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        });
      }
      const width = maxX - minX;
      const height = maxY - minY;
      const aspectRatio = width / (height || 1);
      return {
        hotspot: h,
        distance,
        centerX,
        centerY,
        minX,
        maxX,
        minY,
        maxY,
        width,
        height,
        aspectRatio,
        isHorizontal: aspectRatio > 2,
        // Text blocks are usually wider than tall
        isVertical: aspectRatio < 0.5,
        // Vertical edge of animals
        area: width * height
      };
    });
    let tapIsInEmptyArea = true;
    const tapRadius = 30;
    for (const h of hotspotsWithMetrics) {
      if (h.distance < tapRadius) {
        tapIsInEmptyArea = false;
        break;
      }
    }
    console.log(
      `[IntelligentSelection] Tap is in ${tapIsInEmptyArea ? "empty area (animal)" : "text area"}`
    );
    const scoredHotspots = hotspotsWithMetrics.map((h) => {
      let score = 0;
      const distanceScore = Math.max(0, 1 - h.distance / radiusInImageSpace);
      score += distanceScore * 0.3;
      if (tapIsInEmptyArea) {
        const isEdge = h.aspectRatio > 5 || h.aspectRatio < 0.2 || h.height < 100 || h.width < 100;
        if (isEdge) {
          score += 0.35;
        }
        if (h.isVertical) {
          score += 0.15;
        }
      }
      if (h.isHorizontal && !tapIsInEmptyArea) {
        score += 0.25;
      }
      const idealArea = tapIsInEmptyArea ? 2e4 : 5e4;
      const areaDiff = Math.abs(h.area - idealArea) / idealArea;
      const areaScore = Math.max(0, 1 - areaDiff);
      score += areaScore * 0.15;
      let nearbyCount = 0;
      const clusterRadius = tapIsInEmptyArea ? 150 : 100;
      hotspotsWithMetrics.forEach((other) => {
        if (other !== h) {
          const dist = Math.sqrt(
            Math.pow(h.centerX - other.centerX, 2) + Math.pow(h.centerY - other.centerY, 2)
          );
          if (dist < clusterRadius) {
            nearbyCount++;
          }
        }
      });
      const clusterScore = Math.min(1, nearbyCount / 5);
      score += clusterScore * 0.15;
      if (tapIsInEmptyArea) {
        Math.atan2(
          h.centerY - tapImagePoint.y,
          h.centerX - tapImagePoint.x
        );
        score += 0.1;
      }
      return {
        ...h,
        score,
        nearbyCount,
        isEdge: h.aspectRatio > 5 || h.aspectRatio < 0.2
      };
    });
    scoredHotspots.sort((a, b) => b.score - a.score);
    const selectedHotspots = [];
    const usedHotspots = /* @__PURE__ */ new Set();
    if (tapIsInEmptyArea) {
      const angleGroups = /* @__PURE__ */ new Map();
      scoredHotspots.forEach((h) => {
        const angle = Math.atan2(h.centerY - tapImagePoint.y, h.centerX - tapImagePoint.x);
        const sector = Math.floor((angle + Math.PI) / (Math.PI / 4));
        if (!angleGroups.has(sector)) {
          angleGroups.set(sector, []);
        }
        angleGroups.get(sector).push(h);
      });
      angleGroups.forEach((sectorHotspots, sector) => {
        if (selectedHotspots.length >= maxHotspots) return;
        sectorHotspots.sort((a, b) => b.score - a.score);
        const toTake = Math.min(2, Math.ceil(maxHotspots / 8));
        for (let i = 0; i < toTake && i < sectorHotspots.length; i++) {
          if (selectedHotspots.length >= maxHotspots) break;
          const h = sectorHotspots[i];
          if (!usedHotspots.has(h.hotspot.id)) {
            selectedHotspots.push(h);
            usedHotspots.add(h.hotspot.id);
          }
        }
      });
    } else {
      for (const scored of scoredHotspots) {
        if (selectedHotspots.length >= maxHotspots) break;
        if (usedHotspots.has(scored.hotspot.id)) continue;
        selectedHotspots.push(scored);
        usedHotspots.add(scored.hotspot.id);
        if (scored.nearbyCount > 0 && selectedHotspots.length < maxHotspots - 2) {
          const clusterRadius = 150;
          const lineNeighbors = scoredHotspots.filter((neighbor) => {
            if (usedHotspots.has(neighbor.hotspot.id)) return false;
            if (neighbor === scored) return false;
            const dist = Math.sqrt(
              Math.pow(scored.centerX - neighbor.centerX, 2) + Math.pow(scored.centerY - neighbor.centerY, 2)
            );
            if (dist > clusterRadius) return false;
            const verticalDist = Math.abs(scored.centerY - neighbor.centerY);
            const horizontalDist = Math.abs(scored.centerX - neighbor.centerX);
            if (verticalDist < 30 && horizontalDist < 300) return true;
            if (verticalDist < 100 && horizontalDist < 50) return true;
            return false;
          });
          lineNeighbors.sort((a, b) => {
            const distA = Math.sqrt(
              Math.pow(scored.centerX - a.centerX, 2) + Math.pow(scored.centerY - a.centerY, 2)
            );
            const distB = Math.sqrt(
              Math.pow(scored.centerX - b.centerX, 2) + Math.pow(scored.centerY - b.centerY, 2)
            );
            return distA - distB;
          });
          for (const neighbor of lineNeighbors) {
            if (selectedHotspots.length >= maxHotspots) break;
            selectedHotspots.push(neighbor);
            usedHotspots.add(neighbor.hotspot.id);
          }
        }
      }
    }
    const searchTime = performance.now() - startTime;
    console.log(
      `[IntelligentSelection] Selected ${selectedHotspots.length} hotspots in ${searchTime.toFixed(2)}ms`
    );
    return selectedHotspots.map((h) => ({
      id: h.hotspot.id,
      distance: h.distance,
      hotspot: h.hotspot,
      score: h.score
    }));
  }
  /**
   * Linear search fallback for hotspots
   */
  linearHotspotSearch(tapData, radius) {
    const hotspots = [];
    const rect = this.viewer.element.getBoundingClientRect();
    const pixelPoint = new OpenSeadragon.Point(tapData.x - rect.left, tapData.y - rect.top);
    const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
    const tapImagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
    console.log("[TemporalEchoController] Searching for hotspots at:", {
      pixelCoords: { x: tapData.x, y: tapData.y },
      viewportCoords: { x: viewportPoint.x, y: viewportPoint.y },
      imageCoords: { x: tapImagePoint.x, y: tapImagePoint.y }
    });
    const allOverlays = this.stateManager.getAllOverlays();
    console.log("[TemporalEchoController] Total overlays available:", allOverlays.size);
    let checkedCount = 0;
    let skippedRevealed = 0;
    allOverlays.forEach((overlayData, hotspotId) => {
      const hotspot = overlayData.hotspot;
      if (!hotspot) return;
      if (!hotspot.coordinates || hotspot.coordinates.length === 0) return;
      if (this.activeEchoes.has(hotspotId)) {
        skippedRevealed++;
        console.log(
          `[TemporalEchoController] Skipping already active hotspot: ${hotspotId}`
        );
        return;
      }
      const element = overlayData.element || this.getHotspotElement(hotspotId);
      if (element && element.getAttribute("data-hotspot-revealed") === "true") {
        const revealTime = parseInt(element.getAttribute("data-reveal-time") || "0");
        if (revealTime) {
          const now = Date.now();
          const expirationTime = 2500;
          if (now - revealTime <= expirationTime) {
            skippedRevealed++;
            console.log(
              `[TemporalEchoController] Skipping validly revealed hotspot: ${hotspotId}`
            );
            return;
          } else {
            console.log(
              `[TemporalEchoController] Cleaning expired state for: ${hotspotId}`
            );
            element.removeAttribute("data-hotspot-revealed");
            element.removeAttribute("data-reveal-time");
          }
        } else {
          console.log(`[TemporalEchoController] Cleaning stale state for: ${hotspotId}`);
          element.removeAttribute("data-hotspot-revealed");
        }
      }
      checkedCount++;
      let centerX = 0, centerY = 0;
      const coords = hotspot.shape === "multipolygon" ? hotspot.coordinates[0] : hotspot.coordinates;
      coords.forEach(([x, y]) => {
        centerX += x;
        centerY += y;
      });
      centerX /= coords.length;
      centerY /= coords.length;
      const dx = centerX - tapImagePoint.x;
      const dy = centerY - tapImagePoint.y;
      const distanceInImageSpace = Math.sqrt(dx * dx + dy * dy);
      const radiusViewportPoint = this.viewer.viewport.pointFromPixel(
        new OpenSeadragon.Point(radius, 0)
      );
      const radiusImagePoint = this.viewer.viewport.viewportToImageCoordinates(radiusViewportPoint);
      const radiusInImageSpace = Math.abs(radiusImagePoint.x);
      if (checkedCount <= 3) {
        console.log(`[TemporalEchoController] Hotspot ${hotspotId}:`, {
          hotspotCenter: { x: centerX, y: centerY },
          tapImagePoint: { x: tapImagePoint.x, y: tapImagePoint.y },
          distanceInImageSpace,
          radiusInImageSpace,
          inRadius: distanceInImageSpace <= radiusInImageSpace
        });
      }
      if (distanceInImageSpace <= radiusInImageSpace) {
        const hotspotViewportPoint = this.viewer.viewport.imageToViewportCoordinates(
          new OpenSeadragon.Point(centerX, centerY)
        );
        const hotspotPixelPoint = this.viewer.viewport.pixelFromPoint(hotspotViewportPoint);
        hotspots.push({
          hotspot,
          distance: distanceInImageSpace,
          centerX: hotspotPixelPoint.x + rect.left,
          centerY: hotspotPixelPoint.y + rect.top
        });
      }
    });
    console.log(
      `[TemporalEchoController] Checked ${checkedCount} hotspots, skipped ${skippedRevealed} already revealed, found ${hotspots.length} in radius`
    );
    hotspots.sort((a, b) => a.distance - b.distance);
    const maxHotspots = this.isMobile ? this.config.mobileMaxHotspots : this.config.maxSimultaneous;
    return hotspots.slice(0, maxHotspots);
  }
  /**
   * Reveal hotspots with staggered animation
   */
  revealHotspots(nearbyHotspots, tapData) {
    const validHotspots = nearbyHotspots.filter((h) => {
      var _a;
      const hotspotId = ((_a = h.hotspot) == null ? void 0 : _a.id) || h.id;
      if (this.hotspotCleanupTimeouts.has(hotspotId)) {
        console.log(`[TemporalEcho] Skipping hotspot ${hotspotId} - cleanup in progress`);
        return false;
      }
      return true;
    });
    if (validHotspots.length === 0) {
      console.log("[TemporalEcho] No valid hotspots to reveal after filtering");
      return;
    }
    this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_REVEAL_START, {
      count: validHotspots.length,
      origin: tapData
    });
    const hotspotsToReveal = validHotspots;
    const hotspotIds = hotspotsToReveal.map((h) => h.hotspot.id);
    if (window.nativeHotspotRenderer && window.nativeHotspotRenderer.activeHotspotManager) {
      console.log(
        "[TemporalEchoController] Preparing",
        hotspotIds.length,
        "hotspots for reveal animation"
      );
      window.nativeHotspotRenderer.activeHotspotManager.forceShowHotspots(hotspotIds, {
        maxForceShow: this.isMobile ? this.config.mobileMaxHotspots : this.config.maxSimultaneous
      });
    }
    if (this.config.revealType === "ripple" && this.borderRadialAnimator) {
      console.log("[TemporalEchoController] RIPPLE MODE: Using BorderRadialAnimator");
      hotspotsToReveal.forEach((hotspotData, index) => {
        const hotspot = hotspotData.hotspot || hotspotData;
        const element = this.getHotspotElement(hotspot.id);
        if (element) {
          const originalOpacity = element.style.opacity || "";
          const originalVisibility = element.style.visibility || "";
          const wasHidden = element.classList.contains("hotspot-hidden");
          const wasVisible = element.classList.contains("hotspot-visible");
          this.activeEchoes.add(hotspot.id);
          this.echoAnimations.set(hotspot.id, {
            element,
            originalOpacity,
            originalVisibility,
            wasHidden,
            wasVisible,
            isRevealed: true
          });
          element.setAttribute("data-hotspot-revealed", "true");
          element.setAttribute("data-reveal-time", Date.now().toString());
          console.log(
            `[RIPPLE] Marked hotspot ${hotspot.id} as revealed (${index + 1}/${hotspotsToReveal.length}`
          );
        }
      });
      this.borderRadialAnimator.triggerBorderRadialAnimation(tapData, hotspotsToReveal);
      const totalDuration2 = this.config.revealDuration + 300;
      hotspotsToReveal.forEach((hotspotData) => {
        const hotspot = hotspotData.hotspot || hotspotData;
        this.scheduleHotspotCleanup(hotspot.id, totalDuration2);
      });
      setTimeout(() => {
        const allRevealedElements = document.querySelectorAll(
          '[data-hotspot-revealed="true"]'
        );
        allRevealedElements.forEach((element) => {
          const hotspotId = element.getAttribute("data-hotspot-id");
          if (hotspotId && !this.hotspotCleanupTimeouts.has(hotspotId)) {
            console.log(
              `[RIPPLE] Found untracked revealed hotspot: ${hotspotId}, scheduling cleanup`
            );
            this.scheduleHotspotCleanup(hotspotId, totalDuration2);
          }
        });
      }, 100);
      if (this.cleanupTimeout) {
        clearTimeout(this.cleanupTimeout);
      }
      this.cleanupTimeout = setTimeout(() => {
        if (this.borderRadialAnimator) {
          this.borderRadialAnimator.cleanup();
        }
        this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_REVEAL_END, {
          count: hotspotsToReveal.length
        });
        this.cleanupTimeout = null;
      }, totalDuration2);
      return;
    }
    console.log("[TemporalEchoController] Using standard staggered animation");
    const staggerDelay = this.config.revealType === "focus" ? 0 : this.config.staggerDelay;
    hotspotsToReveal.forEach((hotspotData, index) => {
      setTimeout(() => {
        this.revealSingleHotspot(hotspotData, tapData, index);
      }, index * staggerDelay);
    });
    const totalDuration = this.config.revealDuration + 300 + // Include fade-out (reduced)
    hotspotsToReveal.length * this.config.staggerDelay;
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      console.log("[TemporalEchoController] Cancelled previous cleanup timeout");
    }
    this.cleanupTimeout = setTimeout(() => {
      this.cleanupRevealedHotspots();
      this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_REVEAL_END, {
        count: hotspotsToReveal.length
      });
      this.cleanupTimeout = null;
    }, totalDuration);
  }
  /**
   * Apply will-change for GPU acceleration just before animation
   */
  applyWillChange(element) {
    if (!element.dataset.willChangeApplied) {
      element.style.willChange = "transform, opacity";
      element.dataset.willChangeApplied = "true";
    }
  }
  /**
   * Remove will-change after animation to free GPU memory
   */
  removeWillChange(element, delay = 100) {
    if (element.dataset.willChangeApplied) {
      setTimeout(() => {
        element.style.willChange = "auto";
        delete element.dataset.willChangeApplied;
      }, delay);
    }
  }
  /**
   * Show visual feedback for missed tap (no hotspot at location)
   * Mobile-specific feedback to indicate the tap was registered but no hotspot found
   */
  showMissedTapFeedback(tapData) {
    var _a, _b, _c, _d, _e;
    if (!this.isMobile) return;
    console.log(
      "[TemporalEchoController] Showing missed tap feedback at:",
      tapData.x,
      tapData.y
    );
    const indicator = document.createElement("div");
    indicator.className = "missed-tap-indicator";
    indicator.style.cssText = `
            position: fixed;
            left: ${tapData.x}px;
            top: ${tapData.y}px;
            width: 40px;
            height: 40px;
            margin-left: -20px;
            margin-top: -20px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.5);
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            pointer-events: none;
            z-index: 10000;
            animation: missedTapPulse 0.4s ease-out;
        `;
    if (!document.querySelector("#missed-tap-styles")) {
      const style = document.createElement("style");
      style.id = "missed-tap-styles";
      style.textContent = `
                @keyframes missedTapPulse {
                    0% {
                        transform: scale(0.5);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
            `;
      document.head.appendChild(style);
    }
    document.body.appendChild(indicator);
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 400);
    if ((_b = (_a = window.webkit) == null ? void 0 : _a.messageHandlers) == null ? void 0 : _b.haptic) {
      try {
        window.webkit.messageHandlers.haptic.postMessage("light");
      } catch (e) {
      }
    }
    if (((_c = window.minimalistAudioEngine) == null ? void 0 : _c.isUnlocked) && !this.isMobile) {
      try {
        (_e = (_d = window.minimalistAudioEngine).playMiss) == null ? void 0 : _e.call(_d);
      } catch (e) {
      }
    }
  }
  /**
   * Find hotspot element by ID
   */
  findHotspotElement(hotspotId) {
    let element = null;
    const overlay = this.stateManager.getOverlay(hotspotId);
    if (overlay && overlay.element) {
      element = overlay.element;
    }
    if (!element) {
      const svgContainers = document.querySelectorAll(
        ".openseadragon-svg-overlay, .hotspot-overlay-svg, svg"
      );
      for (const container of svgContainers) {
        element = container.querySelector(`[data-hotspot-id="${hotspotId}"]`);
        if (element) break;
      }
    }
    if (!element) {
      element = document.getElementById(`hotspot-${hotspotId}`);
    }
    if (!element) {
      const gElements = document.querySelectorAll(`g[data-hotspot-id="${hotspotId}"]`);
      if (gElements.length > 0) {
        element = gElements[0];
      }
    }
    return element;
  }
  /**
   * Reveal a single hotspot
   */
  revealSingleHotspot(hotspotData, tapData, index) {
    var _a, _b;
    const hotspot = hotspotData.hotspot || hotspotData;
    console.log("[TemporalEchoController] revealSingleHotspot called for:", hotspot.id);
    let element = null;
    const overlay = this.stateManager.getOverlay(hotspot.id);
    if (overlay && overlay.element) {
      element = overlay.element;
      console.log("[TemporalEchoController] Found element via state manager");
    }
    if (!element) {
      const svgContainers = document.querySelectorAll(
        ".openseadragon-svg-overlay, .hotspot-overlay-svg, svg"
      );
      for (const container of svgContainers) {
        element = container.querySelector(`[data-hotspot-id="${hotspot.id}"]`);
        if (element) {
          console.log(
            "[TemporalEchoController] Found element in container:",
            container.className
          );
          break;
        }
      }
    }
    if (!element) {
      element = document.getElementById(`hotspot-${hotspot.id}`);
      if (element) {
        console.log("[TemporalEchoController] Found element by ID");
      }
    }
    if (!element) {
      const gElements = document.querySelectorAll(`g[data-hotspot-id="${hotspot.id}"]`);
      if (gElements.length > 0) {
        element = gElements[0];
        console.log("[TemporalEchoController] Found g element with hotspot id");
      }
    }
    if (!element) {
      console.warn("[TemporalEchoController] No element found for hotspot", hotspot.id);
      return;
    }
    const styleManager = (_a = window.nativeHotspotRenderer) == null ? void 0 : _a.styleManager;
    if (styleManager && styleManager.ensureHotspotVisibility) {
      styleManager.ensureHotspotVisibility(element);
    }
    const originalOpacity = element.style.opacity || "";
    const originalVisibility = element.style.visibility || "";
    const wasHidden = element.classList.contains("hotspot-hidden");
    const wasVisible = element.classList.contains("hotspot-visible");
    const darkPalettes = [
      "blackOnBlack",
      "pigmentLinerNeutral",
      "pigmentLinerWarm",
      "pigmentLinerCool"
    ];
    const currentPalette = (_b = window.nativeHotspotRenderer) == null ? void 0 : _b.currentPalette;
    const isBlackMode = darkPalettes.includes(currentPalette);
    console.log(
      "[TemporalEchoController] Current palette:",
      currentPalette,
      "isDarkMode:",
      isBlackMode
    );
    if (this.activeEchoes.has(hotspot.id)) {
      console.log(
        "[TemporalEchoController] Hotspot already animating, skipping:",
        hotspot.id
      );
      return;
    }
    element.classList.remove("hotspot-echo-reveal", "hotspot-echo-fade-out", "black-mode");
    element.style.animationDelay = "";
    if (element.tagName.toLowerCase() === "g") {
      const paths = element.querySelectorAll("path, polygon, polyline");
      paths.forEach((path) => {
        path.style.animationDelay = "";
      });
    }
    window.getComputedStyle(element).transform;
    const currentTop = element.style.top || window.getComputedStyle(element).top;
    const currentLeft = element.style.left || window.getComputedStyle(element).left;
    requestAnimationFrame(async () => {
      this.applyWillChange(element);
      element.style.setProperty("--hotspot-top", currentTop);
      element.style.setProperty("--hotspot-left", currentLeft);
      element.style.transformOrigin = "center center";
      element.style.webkitTransformOrigin = "center center";
      element.classList.add("hotspot-echo-reveal");
      if (isBlackMode) {
        element.classList.add("black-mode");
      }
      if (window.hotspotPositionDebugEnabled) {
        debugHotspotPosition(element, hotspot.id);
      }
      if (this.isMobile) {
        const pathElement = element.querySelector(".main-path") || element.querySelector("path");
        if (pathElement) {
          shadowSpriteManager.applyShadow(pathElement, "echoReveal");
        }
      }
      const currentZoom = this.viewer.viewport.getZoom();
      const lowZoomThreshold = 1.5;
      let zoomFactor;
      if (currentZoom >= lowZoomThreshold) {
        zoomFactor = 1;
      } else {
        zoomFactor = Math.min(3, lowZoomThreshold / currentZoom);
      }
      element.style.setProperty("--zoom-factor", zoomFactor);
      let borderStyle = localStorage.getItem("borderStyle") || "default";
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid && this.isMobile) {
        borderStyle = "pigment";
      } else if (this.isMobile && borderStyle === "default") {
        borderStyle = "emboss";
      }
      if (!isAndroid && isBlackMode && (borderStyle === "default" || borderStyle === "pigment")) {
        borderStyle = "emboss";
      }
      if (borderStyle !== "default") {
        element.classList.add(`border-${borderStyle}`);
        if (borderStyle === "gradient" && !document.getElementById("adaptive-gradient")) {
          this.injectGradientDef();
        }
        if (borderStyle === "double" && element.querySelector("path")) {
          this.createDoubleContour(element);
        }
        if (borderStyle === "pigment") {
          console.log("[TemporalEchoController] Applied pigment liner style");
        }
      } else {
        if (this.contrastDetection && hotspotData.centerX && hotspotData.centerY) {
          try {
            const luminanceData = await this.contrastDetection.sampleBackgroundLuminance(
              hotspotData.centerX,
              hotspotData.centerY,
              50
              // Sample radius
            );
            element.classList.add(luminanceData.recommendedEffect);
            console.log(
              "[TemporalEchoController] Applied contrast effect:",
              luminanceData.recommendedEffect
            );
          } catch (error) {
            console.warn(
              "[TemporalEchoController] Contrast detection failed, using default"
            );
            element.classList.add("contrast-adaptive-medium");
          }
        }
      }
      const delay = index * this.config.staggerDelay;
      element.style.animationDelay = `${delay}ms`;
      console.log(
        `[TemporalEchoController] Hotspot ${hotspot.id} animation delay: ${delay}ms (index: ${index})`
      );
      if (element.tagName.toLowerCase() === "g") {
        const paths = element.querySelectorAll("path, polygon, polyline");
        paths.forEach((path) => {
          path.style.animationDelay = `${delay}ms`;
        });
      }
      void element.offsetHeight;
      console.log("[TemporalEchoController] Classes added:", element.classList.toString());
      this.activeEchoes.add(hotspot.id);
      this.echoAnimations.set(hotspot.id, {
        element,
        originalOpacity,
        originalVisibility,
        wasHidden,
        wasVisible,
        isRevealed: true
        // New flag to track revealed state
      });
      element.setAttribute("data-hotspot-revealed", "true");
      element.setAttribute("data-reveal-time", Date.now().toString());
      const completeTimeout = setTimeout(() => {
        element.classList.add("reveal-complete");
        this.activeTimeouts.delete(completeTimeout);
      }, 800);
      this.activeTimeouts.add(completeTimeout);
    });
    const removeTimeout = setTimeout(() => {
      element.classList.remove("hotspot-echo-reveal", "reveal-complete");
      this.activeTimeouts.delete(removeTimeout);
      element.style.animationDelay = "";
      if (this.isMobile) {
        const pathElement = element.querySelector(".main-path") || element.querySelector("path");
        if (pathElement) {
          shadowSpriteManager.removeShadow(pathElement);
        }
      }
      element.classList.add("hotspot-echo-fade-out");
      setTimeout(() => {
        element.classList.remove("hotspot-echo-fade-out", "black-mode");
        element.classList.remove(
          "contrast-adaptive-dark",
          "contrast-adaptive-light",
          "contrast-adaptive-medium",
          "contrast-adaptive-complex"
        );
        element.classList.remove(
          "border-gradient",
          "border-double",
          "border-emboss",
          "border-pulse",
          "border-pigment"
        );
        if (element.getAnimations) {
          element.getAnimations().forEach((animation) => {
            animation.cancel();
          });
        }
        if (element.tagName.toLowerCase() === "g") {
          const children = element.querySelectorAll("*");
          children.forEach((child) => {
            if (child.getAnimations) {
              child.getAnimations().forEach((animation) => {
                animation.cancel();
              });
            }
          });
        }
        this.removeWillChange(element, 0);
        const selectedHotspot = this.stateManager.getSelectedHotspot();
        if (!selectedHotspot || selectedHotspot.id !== hotspot.id) {
          const stored = this.echoAnimations.get(hotspot.id);
          if (stored) {
            element.style.opacity = stored.originalOpacity;
            element.style.visibility = stored.originalVisibility;
            element.style.display = "";
            if (stored.wasHidden) {
              element.classList.add("hotspot-hidden");
            }
            if (stored.wasVisible) {
              element.classList.add("hotspot-visible");
            }
            if (element.tagName.toLowerCase() === "g") {
              const paths = element.querySelectorAll("path, polygon, polyline");
              paths.forEach((path) => {
                path.style.animationDelay = "";
                path.style.opacity = "";
                path.style.visibility = "";
              });
            }
          }
          if (window.nativeHotspotRenderer && window.nativeHotspotRenderer.updateVisibility) {
            setTimeout(() => {
              window.nativeHotspotRenderer.updateVisibility();
            }, 100);
          }
        }
        element.removeAttribute("data-hotspot-revealed");
        this.activeEchoes.delete(hotspot.id);
        this.echoAnimations.delete(hotspot.id);
      }, 300);
    }, this.config.revealDuration);
    this.activeTimeouts.add(removeTimeout);
  }
  /**
   * Get hotspot element by ID
   */
  getHotspotElement(hotspotId) {
    let element = null;
    const overlay = this.stateManager.getOverlay(hotspotId);
    if (overlay && overlay.element) {
      element = overlay.element;
    }
    if (!element) {
      const svgContainers = document.querySelectorAll(
        ".openseadragon-svg-overlay, .hotspot-overlay-svg, svg"
      );
      for (const container of svgContainers) {
        element = container.querySelector(`[data-hotspot-id="${hotspotId}"]`);
        if (element) break;
      }
    }
    if (!element) {
      element = document.getElementById(`hotspot-${hotspotId}`);
    }
    if (!element) {
      const gElements = document.querySelectorAll(`g[data-hotspot-id="${hotspotId}"]`);
      if (gElements.length > 0) {
        element = gElements[0];
      }
    }
    return element;
  }
  /**
   * Reveal hotspots in SVG after Canvas animation (Phase 2)
   * Phase 3: Now uses BatchDOMManager for efficient batch operations
   */
  revealHotspotsSVG(hotspots, tapData) {
    console.log(`[TemporalEchoController] Revealing ${hotspots.length} hotspots in SVG`);
    if (this.batchDOMManager && this.useBatchDOM) {
      console.log("[TemporalEchoController] Using BatchDOMManager for efficient reveal");
      const elements = [];
      hotspots.forEach((hotspot) => {
        const hotspotData = hotspot.hotspot || hotspot;
        const element = this.getHotspotElement(hotspotData.id || hotspot.id);
        if (element) {
          elements.push(element);
          this.activeEchoes.add(hotspotData.id || hotspot.id);
        }
      });
      if (elements.length > 0) {
        const borderStyle = localStorage.getItem("borderStyle") || "default";
        this.batchDOMManager.batchRevealHotspots(elements, {
          staggerDelay: this.config.staggerDelay,
          revealDuration: this.config.revealDuration,
          borderStyle
        });
      }
      return;
    }
    hotspots.forEach((hotspot, index) => {
      const hotspotData = hotspot.hotspot || hotspot;
      const element = this.getHotspotElement(hotspotData.id || hotspot.id);
      if (!element) return;
      const originalOpacity = element.style.opacity || "";
      const originalVisibility = element.style.visibility || "";
      const wasHidden = element.classList.contains("hotspot-hidden");
      const wasVisible = element.classList.contains("hotspot-visible");
      element.classList.remove("hotspot-hidden");
      element.classList.add("hotspot-visible", "hotspot-echo-active");
      element.style.opacity = "1";
      element.style.visibility = "visible";
      element.style.display = "block";
      this.activeEchoes.add(hotspot.id);
      this.echoAnimations.set(hotspot.id, {
        element,
        originalOpacity,
        originalVisibility,
        wasHidden,
        wasVisible,
        isRevealed: true
      });
      element.setAttribute("data-hotspot-revealed", "true");
      element.setAttribute("data-reveal-time", Date.now().toString());
    });
    setTimeout(() => {
      this.hideRevealedHotspots(hotspots);
    }, this.config.revealDuration);
  }
  /**
   * Hide revealed hotspots after duration
   */
  hideRevealedHotspots(hotspots) {
    hotspots.forEach((hotspot) => {
      const hotspotId = hotspot.id;
      const stored = this.echoAnimations.get(hotspotId);
      if (!stored) return;
      const element = stored.element;
      element.classList.remove("hotspot-echo-active");
      element.removeAttribute("data-hotspot-revealed");
      element.style.opacity = stored.originalOpacity;
      element.style.visibility = stored.originalVisibility;
      element.style.display = "";
      if (stored.wasHidden) {
        element.classList.add("hotspot-hidden");
      }
      if (!stored.wasVisible) {
        element.classList.remove("hotspot-visible");
      }
      this.activeEchoes.delete(hotspotId);
      this.echoAnimations.delete(hotspotId);
    });
    console.log("[TemporalEchoController] Hotspots hidden after reveal duration");
  }
  /**
   * Clean up expired revealed states (iOS fix)
   * Prevents false tempo 2 detections from stale states
   */
  cleanupExpiredRevealedStates() {
    const now = Date.now();
    const expirationTime = 2500;
    const revealedElements = document.querySelectorAll('[data-hotspot-revealed="true"]');
    let cleanedCount = 0;
    revealedElements.forEach((element) => {
      const revealTime = parseInt(element.getAttribute("data-reveal-time") || "0");
      if (revealTime && now - revealTime > expirationTime) {
        element.removeAttribute("data-hotspot-revealed");
        element.removeAttribute("data-reveal-time");
        cleanedCount++;
        const hotspotId = element.getAttribute("data-hotspot-id");
        if (hotspotId) {
          this.activeEchoes.delete(hotspotId);
          this.echoAnimations.delete(hotspotId);
        }
      }
    });
    if (cleanedCount > 0) {
      console.log(
        `[TemporalEchoController] Cleaned ${cleanedCount} expired revealed states (iOS fix)`
      );
    }
  }
  /**
   * Check if a hotspot is currently revealed
   */
  isHotspotRevealed(hotspotId) {
    const animation = this.echoAnimations.get(hotspotId);
    if (animation && animation.isRevealed === true) {
      return true;
    }
    if (this.activeEchoes.has(hotspotId)) {
      return true;
    }
    const element = this.getHotspotElement(hotspotId);
    if (element && element.getAttribute("data-hotspot-revealed") === "true") {
      const revealTime = parseInt(element.getAttribute("data-reveal-time") || "0");
      if (revealTime) {
        const now = Date.now();
        const expirationTime = 2500;
        if (now - revealTime <= expirationTime) {
          console.log(
            `[TemporalEcho] Hotspot ${hotspotId} is revealed in DOM (valid timestamp)`
          );
          return true;
        } else {
          console.log(
            `[TemporalEcho] Hotspot ${hotspotId} has expired reveal state, cleaning up`
          );
          element.removeAttribute("data-hotspot-revealed");
          element.removeAttribute("data-reveal-time");
          return false;
        }
      } else {
        console.log(
          `[TemporalEcho] Hotspot ${hotspotId} has no timestamp, cleaning up stale state`
        );
        element.removeAttribute("data-hotspot-revealed");
        return false;
      }
    }
    return false;
  }
  /**
   * Handle ripple animation completion
   */
  handleRippleComplete(rippleId) {
    console.log("[TemporalEchoController] Ripple completed:", rippleId);
  }
  /**
   * Update FPS counter
   */
  updateFPS() {
    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastFPSCheck;
    if (delta >= 1e3) {
      this.currentFPS = Math.round(this.frameCount * 1e3 / delta);
      this.frameCount = 0;
      this.lastFPSCheck = now;
      if (this.currentFPS < 30 && this.activeEchoes.size > 0) {
        console.warn("[TemporalEchoController] Low FPS detected:", this.currentFPS);
      }
    }
  }
  /**
   * Enable echo mode
   */
  enable() {
    this.config.enabled = true;
    this.gestureAdapter.enable();
    this.rippleRenderer.initialize();
    this.fastPathListener = (tapData) => {
      console.log("[TemporalEchoController] Fast-path ECHO_TAP received");
      const pixelPoint = new OpenSeadragon.Point(
        tapData.x - this.viewer.element.offsetLeft,
        tapData.y - this.viewer.element.offsetTop
      );
      const viewportPoint = this.viewer.viewport.pointFromPixel(pixelPoint);
      const extendedTapData = {
        ...tapData,
        viewportX: viewportPoint.x,
        viewportY: viewportPoint.y
      };
      const handled = this.handleQuickTap(extendedTapData);
      console.log("[TemporalEchoController] handleQuickTap returned:", handled);
      tapData.wasHandledAsEcho = handled === true;
      console.log(
        "[TemporalEchoController] Set tapData.wasHandledAsEcho to:",
        tapData.wasHandledAsEcho
      );
    };
    this.eventCoordinator.on(this.eventCoordinator.eventTypes.ECHO_TAP, this.fastPathListener);
    this.buildSpatialIndex();
    console.log("[TemporalEchoController] Enabled with fast-path support and spatial index");
  }
  /**
   * Disable echo mode
   */
  disable() {
    this.config.enabled = false;
    this.gestureAdapter.disable();
    this.rippleRenderer.cleanup();
    this.clearActiveEchoes();
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }
    if (this.fastPathListener) {
      this.eventCoordinator.off(
        this.eventCoordinator.eventTypes.ECHO_TAP,
        this.fastPathListener
      );
      this.fastPathListener = null;
    }
    this.invalidateSpatialIndex();
    console.log("[TemporalEchoController] Disabled");
  }
  /**
   * Invalidate spatial index (e.g., when hotspots change)
   */
  invalidateSpatialIndex() {
    this.spatialIndexReady = false;
    if (this.spatialIndex) {
      this.spatialIndex.clear();
    }
  }
  /**
   * Clean ALL reveal styles on startup (prevents desktop cache persistence)
   * Called during constructor to ensure clean state between sessions
   */
  cleanupAllRevealStylesOnStartup() {
    console.log("[TemporalEchoController] Cleaning all reveal styles on startup (cache fix)");
    requestAnimationFrame(() => {
      const allHotspots = document.querySelectorAll("[data-hotspot-id]");
      let cleanedCount = 0;
      allHotspots.forEach((element) => {
        const hadClasses = element.classList.contains("hotspot-echo-reveal") || element.classList.contains("border-emboss") || element.classList.contains("border-gradient") || element.classList.contains("border-double") || element.classList.contains("border-pulse") || element.classList.contains("border-pigment");
        if (hadClasses) {
          cleanedCount++;
          element.classList.remove(
            "hotspot-echo-reveal",
            "hotspot-echo-fade-out",
            "black-mode",
            "border-gradient",
            "border-double",
            "border-emboss",
            "border-pulse",
            "border-pigment",
            "contrast-adaptive-dark",
            "contrast-adaptive-light",
            "contrast-adaptive-medium",
            "contrast-adaptive-complex",
            "reveal-complete"
          );
          const paths = element.querySelectorAll("path, polygon, polyline");
          paths.forEach((path) => {
            path.style.stroke = "";
            path.style.strokeWidth = "";
            path.style.fill = "";
            path.style.fillOpacity = "";
            path.style.filter = "";
            path.style.animationDelay = "";
          });
          element.style.animationDelay = "";
          element.style.removeProperty("--zoom-factor");
        }
        element.removeAttribute("data-hotspot-revealed");
        element.removeAttribute("data-reveal-time");
      });
      if (cleanedCount > 0) {
        console.log(
          `[TemporalEchoController] Cleaned ${cleanedCount} hotspots with persisted reveal styles`
        );
      } else {
        console.log(
          "[TemporalEchoController] No persisted reveal styles found (clean startup)"
        );
      }
    });
  }
  /**
   * Clean reveal styles from a specific hotspot (for iOS TEMPO 2)
   * Called BEFORE activateHotspot() to prevent border persistence
   */
  cleanupRevealStyles(hotspotId) {
    const element = this.getHotspotElement(hotspotId);
    if (!element) {
      console.warn("[TemporalEchoController] No element found for cleanup:", hotspotId);
      return;
    }
    console.log("[TemporalEchoController] iOS: Cleaning reveal styles before zoom:", hotspotId);
    element.classList.remove(
      "hotspot-echo-reveal",
      "hotspot-echo-fade-out",
      "black-mode",
      "border-gradient",
      "border-double",
      "border-emboss",
      "border-pulse",
      "border-pigment",
      "contrast-adaptive-dark",
      "contrast-adaptive-light",
      "contrast-adaptive-medium",
      "contrast-adaptive-complex",
      "reveal-complete"
    );
    const paths = element.querySelectorAll("path, polygon, polyline");
    paths.forEach((path) => {
      path.style.stroke = "";
      path.style.strokeWidth = "";
      path.style.fill = "";
      path.style.fillOpacity = "";
      path.style.filter = "";
      path.style.animationDelay = "";
    });
    element.style.animationDelay = "";
    element.style.removeProperty("--zoom-factor");
    if (element.getAnimations) {
      element.getAnimations().forEach((animation) => {
        animation.cancel();
      });
    }
    requestAnimationFrame(() => {
      void element.offsetHeight;
      requestAnimationFrame(() => {
        console.log("[TemporalEchoController] iOS: Styles cleaned and reflow forced");
      });
    });
  }
  /**
   * Clean up revealed hotspots after animation - Critical for Safari iOS
   * Prevents black screen on subsequent reveals
   */
  cleanupRevealedHotspots() {
    var _a, _b;
    console.log(
      `[TemporalEchoController] Cleaning up revealed hotspots for Safari iOS (Reveal #${this.revealCount})`
    );
    this.activeTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.activeTimeouts.clear();
    const revealedElements = document.querySelectorAll(
      ".hotspot-echo-reveal, .hotspot-echo-fade-out"
    );
    revealedElements.forEach((el) => {
      el.classList.remove(
        "hotspot-echo-reveal",
        "hotspot-echo-fade-out",
        "black-mode",
        "border-gradient",
        "border-double",
        "border-emboss",
        "border-pulse",
        "border-pigment",
        "contrast-adaptive-dark",
        "contrast-adaptive-light",
        "contrast-adaptive-medium",
        "contrast-adaptive-complex",
        "reveal-complete"
      );
      el.style.removeProperty("visibility");
      el.style.removeProperty("display");
      el.style.removeProperty("z-index");
      el.style.removeProperty("pointer-events");
      el.style.removeProperty("animation-delay");
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
      el.style.removeProperty("-webkit-transform");
      el.style.removeProperty("--zoom-factor");
      const paths = el.querySelectorAll("path, polygon, polyline");
      paths.forEach((path) => {
        path.style.stroke = "";
        path.style.strokeWidth = "";
        path.style.fill = "";
        path.style.fillOpacity = "";
        path.style.filter = "";
        path.style.animationDelay = "";
      });
      if (el.getAnimations) {
        el.getAnimations().forEach((animation) => {
          animation.cancel();
        });
      }
    });
    if (window.safariOverlayManager) {
      if (window.safariOverlayManager.resetMask) {
        window.safariOverlayManager.resetMask();
      }
      if (window.safariOverlayManager.resetFocusTracking) {
        window.safariOverlayManager.resetFocusTracking();
      }
    }
    if (this.isSafari || this.isIOS) {
      if ((_a = window.nativeHotspotRenderer) == null ? void 0 : _a.safariCompat) {
        window.nativeHotspotRenderer.safariCompat.forceIOSRedraw();
      }
    }
    this.activeEchoes.clear();
    this.echoAnimations.clear();
    const remainingRevealElements = document.querySelectorAll(".hotspot-echo-reveal");
    if (remainingRevealElements.length > 0) {
      console.warn(
        `[TemporalEchoController] WARNING: ${remainingRevealElements.length} elements still have reveal class after cleanup!`
      );
    }
    if ((_b = window.safariOverlayManager) == null ? void 0 : _b.overlayElement) {
      const maskImage = window.getComputedStyle(
        window.safariOverlayManager.overlayElement
      ).webkitMaskImage;
      if (maskImage && maskImage !== "none") {
        console.warn(
          "[TemporalEchoController] WARNING: Safari overlay still has mask after cleanup:",
          maskImage
        );
      }
    }
    console.log(`[TemporalEchoController] Cleanup complete for Reveal #${this.revealCount}`);
  }
  /**
   * Clear all active echoes
   */
  clearActiveEchoes() {
    this.activeEchoes.forEach((hotspotId) => {
      const stored = this.echoAnimations.get(hotspotId);
      if (stored && stored.element) {
        stored.element.classList.remove(
          "hotspot-echo-reveal",
          "hotspot-echo-fade-out",
          "black-mode"
        );
        stored.element.style.animationDelay = "";
        stored.element.style.opacity = stored.originalOpacity;
        stored.element.style.visibility = stored.originalVisibility;
        stored.element.style.display = "";
        if (this.isMobile) {
          const pathElement = stored.element.querySelector(".main-path") || stored.element.querySelector("path");
          if (pathElement) {
            shadowSpriteManager.removeShadow(pathElement);
          }
        }
        if (stored.element.tagName.toLowerCase() === "g") {
          const paths = stored.element.querySelectorAll("path, polygon, polyline");
          paths.forEach((path) => {
            path.style.animationDelay = "";
            path.style.opacity = "";
            path.style.visibility = "";
          });
        }
      }
    });
    this.activeEchoes.clear();
    this.echoAnimations.clear();
  }
  /**
   * Update configuration
   */
  updateConfig(config) {
    Object.assign(this.config, config);
    if (config.quickTapThreshold !== void 0 || config.movementThreshold !== void 0) {
      this.gestureAdapter.updateConfig(config);
    }
  }
  /**
   * Get current FPS
   */
  getFPS() {
    return this.rippleRenderer ? this.rippleRenderer.getFPS() : 60;
  }
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.rippleRenderer ? this.rippleRenderer.getPerformanceMetrics() : null;
  }
  /**
   * Inject SVG gradient definition for gradient border style
   */
  injectGradientDef() {
    if (document.getElementById("adaptive-gradient")) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";
    const defs = document.createElementNS(svgNS, "defs");
    const gradient = document.createElementNS(svgNS, "linearGradient");
    gradient.id = "adaptive-gradient";
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "100%");
    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "white");
    stop1.setAttribute("stop-opacity", "1");
    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "50%");
    stop2.setAttribute("stop-color", "gray");
    stop2.setAttribute("stop-opacity", "0.8");
    const stop3 = document.createElementNS(svgNS, "stop");
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", "black");
    stop3.setAttribute("stop-opacity", "1");
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    document.body.appendChild(svg);
  }
  /**
   * Create double contour effect by cloning path
   */
  createDoubleContour(element) {
    const paths = element.querySelectorAll("path");
    paths.forEach((path) => {
      if (path.nextSibling && path.nextSibling.classList && path.nextSibling.classList.contains("outer-stroke")) {
        return;
      }
      const outerPath = path.cloneNode(true);
      outerPath.classList.add("outer-stroke");
      outerPath.style.zIndex = "-1";
      path.parentNode.insertBefore(outerPath, path);
    });
  }
  /**
   * Inject SVG filter for pigment liner texture
   */
  injectPigmentTextureFilter() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";
    svg.setAttribute("aria-hidden", "true");
    const defs = document.createElementNS(svgNS, "defs");
    const filter = document.createElementNS(svgNS, "filter");
    filter.id = "pigmentTexture";
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    const turbulence = document.createElementNS(svgNS, "feTurbulence");
    turbulence.setAttribute("type", "turbulence");
    turbulence.setAttribute("baseFrequency", "0.5 0.1");
    turbulence.setAttribute("numOctaves", "2");
    turbulence.setAttribute("seed", "5");
    turbulence.setAttribute("result", "turbulence");
    const displace = document.createElementNS(svgNS, "feDisplacementMap");
    displace.setAttribute("in", "SourceGraphic");
    displace.setAttribute("in2", "turbulence");
    displace.setAttribute("scale", "2");
    displace.setAttribute("xChannelSelector", "R");
    displace.setAttribute("yChannelSelector", "G");
    displace.setAttribute("result", "displaced");
    const dilate = document.createElementNS(svgNS, "feMorphology");
    dilate.setAttribute("in", "displaced");
    dilate.setAttribute("operator", "dilate");
    dilate.setAttribute("radius", "0.5");
    dilate.setAttribute("result", "dilated");
    const composite = document.createElementNS(svgNS, "feComposite");
    composite.setAttribute("in", "dilated");
    composite.setAttribute("in2", "displaced");
    composite.setAttribute("operator", "over");
    composite.setAttribute("result", "final");
    const transfer = document.createElementNS(svgNS, "feComponentTransfer");
    transfer.setAttribute("in", "final");
    const funcA = document.createElementNS(svgNS, "feFuncA");
    funcA.setAttribute("type", "discrete");
    funcA.setAttribute("tableValues", "0 1");
    transfer.appendChild(funcA);
    filter.appendChild(turbulence);
    filter.appendChild(displace);
    filter.appendChild(dilate);
    filter.appendChild(composite);
    filter.appendChild(transfer);
    defs.appendChild(filter);
    svg.appendChild(defs);
    document.body.appendChild(svg);
    console.log("[TemporalEchoController] Injected pigment texture filter");
  }
  /**
   * Start periodic safety cleanup to catch orphaned revealed hotspots
   */
  startSafetyCleanup() {
    this.safetyCleanupInterval = setInterval(() => {
      let orphanedCount = 0;
      if (this.stateManager && this.stateManager.getAllOverlays) {
        this.stateManager.getAllOverlays().forEach((overlay, hotspotId) => {
          if (overlay.element && overlay.element.getAttribute("data-hotspot-revealed") === "true") {
            if (!this.hotspotCleanupTimeouts.has(hotspotId) && !this.activeEchoes.has(hotspotId)) {
              overlay.element.removeAttribute("data-hotspot-revealed");
              orphanedCount++;
              console.log(`[Safety Cleanup] Cleaned orphaned overlay: ${hotspotId}`);
            }
          }
        });
      }
      const allRevealedElements = document.querySelectorAll('[data-hotspot-revealed="true"]');
      allRevealedElements.forEach((element) => {
        const hotspotId = element.getAttribute("data-hotspot-id");
        if (hotspotId && !this.hotspotCleanupTimeouts.has(hotspotId) && !this.activeEchoes.has(hotspotId)) {
          element.removeAttribute("data-hotspot-revealed");
          orphanedCount++;
          console.log(`[Safety Cleanup] Cleaned orphaned DOM element: ${hotspotId}`);
        }
      });
      if (orphanedCount > 0) {
        console.log(`[Safety Cleanup] Cleaned ${orphanedCount} orphaned revealed hotspots`);
      }
    }, 3e3);
  }
  /**
   * Start periodic full reset to prevent long-term degradation
   */
  startPeriodicReset() {
    this.fullResetInterval = setInterval(() => {
      const activeCount = this.activeEchoes.size;
      const animationCount = this.echoAnimations.size;
      const cleanupCount = this.hotspotCleanupTimeouts.size;
      if (activeCount > 0 || animationCount > 0 || cleanupCount > 0) {
        console.log(
          `[PeriodicReset] Performing full reset - Active: ${activeCount}, Animations: ${animationCount}, Cleanups: ${cleanupCount}`
        );
        this.forceCleanupAllRevealed();
        this.hotspotCleanupTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.hotspotCleanupTimeouts.clear();
        this.activeEchoes.clear();
        this.echoAnimations.clear();
        console.log("[PeriodicReset] Full reset completed");
      }
    }, 3e4);
  }
  /**
   * Force cleanup of ALL revealed hotspots immediately
   * Emergency cleanup method to ensure no hotspots stay revealed
   */
  forceCleanupAllRevealed() {
    console.log("[TemporalEcho] Force cleaning all revealed hotspots");
    if (this.stateManager && this.stateManager.getAllOverlays) {
      this.stateManager.getAllOverlays().forEach((overlay, hotspotId) => {
        if (overlay.element && overlay.element.getAttribute("data-hotspot-revealed") === "true") {
          overlay.element.removeAttribute("data-hotspot-revealed");
          console.log(`[TemporalEcho] Force cleaned overlay: ${hotspotId}`);
        }
      });
    }
    const allRevealedElements = document.querySelectorAll('[data-hotspot-revealed="true"]');
    allRevealedElements.forEach((element) => {
      element.removeAttribute("data-hotspot-revealed");
      const hotspotId = element.getAttribute("data-hotspot-id");
      console.log(`[TemporalEcho] Force cleaned DOM element: ${hotspotId || "unknown"}`);
    });
    this.activeEchoes.clear();
    this.echoAnimations.clear();
    this.hotspotCleanupTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.hotspotCleanupTimeouts.clear();
  }
  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.safetyCleanupInterval) {
      clearInterval(this.safetyCleanupInterval);
      this.safetyCleanupInterval = null;
    }
    if (this.fullResetInterval) {
      clearInterval(this.fullResetInterval);
      this.fullResetInterval = null;
    }
    this.forceCleanupAllRevealed();
    this.disable();
    this.gestureAdapter.destroy();
    this.rippleRenderer.destroy();
    this.clearActiveEchoes();
    this.hotspotCleanupTimeouts.forEach((timeout, hotspotId) => {
      clearTimeout(timeout);
      console.log(
        `[TemporalEchoController] Cleared cleanup timeout for hotspot ${hotspotId}`
      );
    });
    this.hotspotCleanupTimeouts.clear();
    if (this.canvasRenderer) {
      this.canvasRenderer.destroy();
      this.canvasRenderer = null;
    }
    if (this.batchDOMManager) {
      this.batchDOMManager.destroy();
      this.batchDOMManager = null;
    }
    if (this.hitDetector) {
      this.hitDetector.destroy();
      this.hitDetector = null;
    }
  }
}
window.updateBorderStyle = function(style) {
  console.log("[TemporalEchoController] Border style updated to:", style);
};
window.toggleAdjacentSelection = function(enable) {
  if (window.temporalEchoController) {
    const wasEnabled = window.temporalEchoController.config.useAdjacentSelection;
    window.temporalEchoController.config.useAdjacentSelection = enable !== void 0 ? enable : !wasEnabled;
    console.log(
      "[TemporalEchoController] Adjacent selection mode:",
      window.temporalEchoController.config.useAdjacentSelection ? "ENABLED (côte à côte)" : "DISABLED (distance-based)"
    );
    return window.temporalEchoController.config.useAdjacentSelection;
  }
  console.error("TemporalEchoController not initialized");
  return false;
};
window.setAdjacencyThreshold = function(pixels) {
  if (window.temporalEchoController) {
    window.temporalEchoController.config.adjacencyThreshold = pixels;
    console.log("[TemporalEchoController] Adjacency threshold set to:", pixels, "pixels");
  } else {
    console.error("TemporalEchoController not initialized");
  }
};
export {
  TemporalEchoController as default
};
