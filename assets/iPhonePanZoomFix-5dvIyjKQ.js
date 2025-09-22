class iPhonePanZoomFix {
  constructor(viewer) {
    this.viewer = viewer;
    this.lastInteractionType = null;
    this.isPanning = false;
    this.isZooming = false;
    this.panEndTime = 0;
    this.zoomEndTime = 0;
    this.initialized = false;
    this.isIPhone = /iPhone/.test(navigator.userAgent) && !/iPad/.test(navigator.userAgent);
    if (!this.isIPhone) {
      console.log("iPhonePanZoomFix: Not iPhone, skipping initialization");
      return;
    }
    this.initialize();
  }
  initialize() {
    if (this.initialized) return;
    console.log("iPhonePanZoomFix: Initializing differential pan/zoom handler");
    this.setupInteractionTracking();
    this.setupDifferentialAnimationFinish();
    this.applyPreventiveCSS();
    this.initialized = true;
    console.log("iPhonePanZoomFix: Initialization complete");
  }
  setupInteractionTracking() {
    console.log("iPhonePanZoomFix: Setting up interaction tracking");
    this.viewer.addHandler("pan", () => {
      this.isPanning = true;
      this.isZooming = false;
      this.lastInteractionType = "pan";
      console.log("iPhonePanZoomFix: Pan started");
    });
    this.viewer.addHandler("pan-end", () => {
      this.panEndTime = Date.now();
      console.log("iPhonePanZoomFix: Pan ended");
    });
    this.viewer.addHandler("canvas-drag", () => {
      this.isPanning = true;
      this.isZooming = false;
      this.lastInteractionType = "drag";
    });
    this.viewer.addHandler("canvas-drag-end", () => {
      this.panEndTime = Date.now();
    });
    this.viewer.addHandler("zoom", () => {
      this.isZooming = true;
      this.isPanning = false;
      this.lastInteractionType = "zoom";
      console.log("iPhonePanZoomFix: Zoom detected");
    });
    this.viewer.addHandler("canvas-pinch", () => {
      this.isZooming = true;
      this.isPanning = false;
      this.lastInteractionType = "pinch";
    });
  }
  setupDifferentialAnimationFinish() {
    console.log("iPhonePanZoomFix: Setting up differential animation-finish handler");
    this.viewer.addHandler("animation-finish", () => {
      const timeSincePan = Date.now() - this.panEndTime;
      const wasRecentPan = timeSincePan < 500;
      console.log("iPhonePanZoomFix: animation-finish triggered", {
        lastInteraction: this.lastInteractionType,
        isPanning: this.isPanning,
        isZooming: this.isZooming,
        wasRecentPan,
        timeSincePan
      });
      if (this.isPanning || wasRecentPan) {
        console.log("iPhonePanZoomFix: Post-pan animation-finish - preserving without redraw");
        this.preserveCanvasAfterPan();
        this.isPanning = false;
      } else if (this.isZooming) {
        console.log("iPhonePanZoomFix: Post-zoom animation-finish - normal handling");
        this.handleZoomAnimationFinish();
        this.isZooming = false;
      } else {
        console.log("iPhonePanZoomFix: Unknown animation-finish source - conservative handling");
        this.preserveCanvasGentle();
      }
      setTimeout(() => {
        this.lastInteractionType = null;
      }, 100);
    });
  }
  preserveCanvasAfterPan() {
    var _a, _b;
    const canvas = (_a = this.viewer.drawer) == null ? void 0 : _a.canvas;
    const ctx = (_b = this.viewer.drawer) == null ? void 0 : _b.context;
    if (!canvas || !ctx) {
      console.error("iPhonePanZoomFix: Canvas or context missing");
      return;
    }
    requestAnimationFrame(() => {
      ctx.save();
      ctx.globalAlpha = 0.999;
      ctx.restore();
      const currentTransform = canvas.style.transform || "translateZ(0)";
      canvas.style.transform = "translateZ(0.001px)";
      requestAnimationFrame(() => {
        canvas.style.transform = currentTransform;
        canvas.style.willChange = "transform";
      });
    });
    setTimeout(() => {
      if (ctx && canvas) {
        ctx.save();
        ctx.restore();
      }
    }, 50);
  }
  handleZoomAnimationFinish() {
    var _a, _b;
    const canvas = (_a = this.viewer.drawer) == null ? void 0 : _a.canvas;
    const ctx = (_b = this.viewer.drawer) == null ? void 0 : _b.context;
    if (!canvas || !ctx) return;
    requestAnimationFrame(() => {
      if (this.viewer.forceRedraw) {
        this.viewer.forceRedraw();
      }
      canvas.style.opacity = "1";
      canvas.style.visibility = "visible";
    });
  }
  preserveCanvasGentle() {
    var _a, _b;
    const canvas = (_a = this.viewer.drawer) == null ? void 0 : _a.canvas;
    const ctx = (_b = this.viewer.drawer) == null ? void 0 : _b.context;
    if (!canvas || !ctx) return;
    requestAnimationFrame(() => {
      ctx.save();
      ctx.restore();
      canvas.style.willChange = "transform";
    });
  }
  applyPreventiveCSS() {
    const canvas = this.viewer.canvas;
    if (canvas) {
      canvas.style.transform = "translateZ(0)";
      canvas.style.willChange = "transform";
      canvas.style.webkitBackfaceVisibility = "hidden";
      canvas.style.backfaceVisibility = "hidden";
      canvas.style.opacity = "1";
      canvas.style.visibility = "visible";
      console.log("iPhonePanZoomFix: Preventive CSS applied");
    }
  }
  destroy() {
    this.viewer = null;
    console.log("iPhonePanZoomFix: Destroyed");
  }
}
export {
  iPhonePanZoomFix as default,
  iPhonePanZoomFix
};
