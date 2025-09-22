class iPhoneCanvasRestoreFix {
  constructor(viewer) {
    this.viewer = viewer;
    this.isIPhone = /iPhone/.test(navigator.userAgent) && !/iPad/.test(navigator.userAgent);
    if (!this.isIPhone) {
      console.log("iPhoneCanvasRestoreFix: Not iPhone, skipping");
      return;
    }
    this.isPanning = false;
    this.lastPanTime = 0;
    this.restorationInProgress = false;
    this.initialize();
  }
  initialize() {
    console.log("iPhoneCanvasRestoreFix: Initializing complete restoration system");
    this.viewer.addHandler("pan", () => {
      this.isPanning = true;
    });
    this.viewer.addHandler("pan-end", () => {
      this.lastPanTime = Date.now();
    });
    this.viewer.addHandler("animation-finish", () => {
      const timeSincePan = Date.now() - this.lastPanTime;
      const wasRecentPan = timeSincePan < 500;
      if (this.isPanning || wasRecentPan) {
        this.isPanning = false;
        console.log("iPhoneCanvasRestoreFix: Restoring canvas after pan");
        this.restoreCanvasCompletely();
      }
    });
    this.applyPreventiveMeasures();
  }
  restoreCanvasCompletely() {
    var _a, _b;
    if (this.restorationInProgress) return;
    this.restorationInProgress = true;
    const canvas = (_a = this.viewer.drawer) == null ? void 0 : _a.canvas;
    const ctx = (_b = this.viewer.drawer) == null ? void 0 : _b.context;
    if (!canvas || !ctx) {
      this.restorationInProgress = false;
      return;
    }
    const currentTransform = ctx.getTransform();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 1, 1);
    ctx.restore();
    canvas.style.display = "none";
    canvas.offsetHeight;
    canvas.style.display = "block";
    ctx.setTransform(currentTransform);
    requestAnimationFrame(() => {
      const world = this.viewer.world;
      if (world && world.getItemAt(0)) {
        const tiledImage = world.getItemAt(0);
        if (tiledImage._updateViewport) {
          tiledImage._updateViewport();
        }
        if (this.viewer.drawer && this.viewer.drawer.update) {
          this.viewer.drawer.update();
        }
      }
      this.restorationInProgress = false;
      console.log("iPhoneCanvasRestoreFix: Canvas restored");
    });
  }
  applyPreventiveMeasures() {
    const canvas = this.viewer.canvas;
    if (!canvas) return;
    canvas.style.willChange = "transform";
    canvas.style.transform = "translateZ(0)";
    canvas.style.webkitBackfaceVisibility = "hidden";
    canvas.style.webkitTouchCallout = "none";
    canvas.style.touchAction = "none";
    console.log("iPhoneCanvasRestoreFix: Preventive measures applied");
  }
  destroy() {
    this.viewer = null;
  }
}
export {
  iPhoneCanvasRestoreFix as default,
  iPhoneCanvasRestoreFix
};
