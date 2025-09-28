const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/viewerEventHandlers-Dlbgqr9k.js","assets/main-Zk2OBNz3.js","assets/main-D2TKL3td.css"])))=>i.map(i=>d[i]);
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { O as OpenSeadragon, i as isMobile, g as getBrowserOptimalDrawer, a as applyTileCascadeFix, b as getTuningState, c as OverlayManagerFactory, d as applyTuningToViewer, _ as __vitePreload, r as removeTileCascadeFix } from "./main-Zk2OBNz3.js";
class ImageOverlayManager {
  constructor() {
    this.overlays = /* @__PURE__ */ new Map();
    this.activeOverlay = null;
    this.preloadQueue = [];
    this.isPreloading = false;
    this.maxPreloadCount = 3;
    this.preloadedImages = /* @__PURE__ */ new Map();
    this.onOverlayOpen = null;
    this.onOverlayClose = null;
    this.onImageLoaded = null;
    this.onImageError = null;
    console.log("ImageOverlayManager initialized");
  }
  /**
   * Load overlay data from hotspots
   */
  loadHotspots(hotspots) {
    hotspots.forEach((hotspot) => {
      if (hotspot.image_url_1) {
        this.overlays.set(hotspot.id, {
          hotspotId: hotspot.id,
          imageUrls: [hotspot.image_url_1],
          // Array for future multi-image support
          autoReveal: hotspot.overlay_auto_reveal || false,
          displayMode: hotspot.overlay_display_mode || "modal",
          showButton: hotspot.show_images_button !== false,
          access: hotspot.overlay_access || "free",
          isLoaded: false
        });
      }
    });
    console.log(`Loaded ${this.overlays.size} image overlays`);
  }
  /**
   * Preload images for visible hotspots
   */
  async preloadImages(visibleHotspotIds) {
    const imagesToPreload = [];
    visibleHotspotIds.forEach((id) => {
      const overlay = this.overlays.get(id);
      if (overlay && !overlay.isLoaded) {
        overlay.imageUrls.forEach((url) => {
          if (!this.preloadedImages.has(url)) {
            imagesToPreload.push({ url, hotspotId: id });
          }
        });
      }
    });
    this.preloadQueue.push(...imagesToPreload);
    if (!this.isPreloading && this.preloadQueue.length > 0) {
      this.processPreloadQueue();
    }
  }
  /**
   * Process preload queue
   */
  async processPreloadQueue() {
    this.isPreloading = true;
    while (this.preloadQueue.length > 0 && this.preloadedImages.size < this.maxPreloadCount) {
      const { url, hotspotId } = this.preloadQueue.shift();
      try {
        await this.loadImage(url, hotspotId);
      } catch (error) {
        console.error(`Failed to preload image: ${url}`, error);
      }
    }
    this.isPreloading = false;
  }
  /**
   * Load a single image
   */
  loadImage(url, hotspotId) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.set(url, img);
        const overlay = this.overlays.get(hotspotId);
        if (overlay) {
          overlay.isLoaded = true;
        }
        if (this.onImageLoaded) {
          this.onImageLoaded(url, hotspotId);
        }
        console.log(`Image loaded: ${url}`);
        resolve(img);
      };
      img.onerror = (error) => {
        if (this.onImageError) {
          this.onImageError(url, hotspotId, error);
        }
        console.error(`Failed to load image: ${url}`);
        reject(error);
      };
      img.crossOrigin = "anonymous";
      img.src = url;
    });
  }
  /**
   * Check if overlay should auto-reveal
   */
  shouldAutoReveal(hotspotId) {
    const overlay = this.overlays.get(hotspotId);
    return overlay ? overlay.autoReveal : false;
  }
  /**
   * Check if button should be shown
   */
  shouldShowButton(hotspotId) {
    const overlay = this.overlays.get(hotspotId);
    return overlay ? overlay.showButton : true;
  }
  /**
   * Get overlay data
   */
  getOverlay(hotspotId) {
    return this.overlays.get(hotspotId);
  }
  /**
   * Open overlay
   */
  openOverlay(hotspotId) {
    const overlay = this.overlays.get(hotspotId);
    if (!overlay) {
      console.warn(`No overlay found for hotspot: ${hotspotId}`);
      return null;
    }
    if (this.activeOverlay) {
      this.closeOverlay();
    }
    this.activeOverlay = hotspotId;
    if (!overlay.isLoaded) {
      const url = overlay.imageUrls[0];
      this.loadImage(url, hotspotId).catch(console.error);
    }
    if (this.onOverlayOpen) {
      this.onOverlayOpen(hotspotId, overlay);
    }
    return overlay;
  }
  /**
   * Close overlay
   */
  closeOverlay() {
    if (this.activeOverlay) {
      const hotspotId = this.activeOverlay;
      this.activeOverlay = null;
      if (this.onOverlayClose) {
        this.onOverlayClose(hotspotId);
      }
    }
  }
  /**
   * Get image for URL
   */
  getImage(url) {
    return this.preloadedImages.get(url);
  }
  /**
   * Check access level
   */
  hasAccess(hotspotId, userLevel = "free") {
    const overlay = this.overlays.get(hotspotId);
    if (!overlay) return false;
    const accessLevels = {
      "free": 0,
      "gated": 1,
      "supporter": 2
    };
    const requiredLevel = accessLevels[overlay.access] || 0;
    const currentLevel = accessLevels[userLevel] || 0;
    return currentLevel >= requiredLevel;
  }
  /**
   * Clean up specific images
   */
  unloadImages(hotspotIds) {
    hotspotIds.forEach((id) => {
      const overlay = this.overlays.get(id);
      if (overlay) {
        overlay.imageUrls.forEach((url) => {
          this.preloadedImages.delete(url);
        });
        overlay.isLoaded = false;
      }
    });
  }
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      totalOverlays: this.overlays.size,
      preloadedImages: this.preloadedImages.size,
      queueLength: this.preloadQueue.length,
      activeOverlay: this.activeOverlay
    };
  }
  /**
   * Destroy and clean up
   */
  destroy() {
    this.closeOverlay();
    this.overlays.clear();
    this.preloadedImages.clear();
    this.preloadQueue = [];
    console.log("ImageOverlayManager destroyed");
  }
}
class LowZoomOptimizer {
  constructor(viewer, isMobile2 = false) {
    this.viewer = viewer;
    this.isMobile = isMobile2;
    this.isActive = true;
    this.isZooming = false;
    this.lastZoomLevel = null;
    this.zoomStartTime = null;
    this.cinematicMode = false;
    this.LOW_ZOOM_THRESHOLD = 2;
    this.CRITICAL_ZOOM_THRESHOLD = 1;
    this.originalSettings = {};
    this.isOptimizing = false;
    this.setupEventHandlers();
  }
  setupEventHandlers() {
    if (!this.viewer) return;
    this.viewer.addHandler("zoom", (event) => {
      if (!this.isActive) return;
      this.handleZoomChange(event);
    });
    this.viewer.addHandler("pan", (event) => {
      if (!this.isActive) return;
      this.handlePanAtLowZoom(event);
    });
    this.viewer.addHandler("animation-start", () => {
      if (!this.isActive) return;
      this.handleAnimationStart();
    });
    this.viewer.addHandler("animation-finish", () => {
      if (!this.isActive) return;
      this.handleAnimationFinish();
    });
    const isWebGL = this.viewer.drawer && (this.viewer.drawer.constructor.name === "WebGLDrawer" || this.viewer.drawer.webgl || this.viewer.drawer.gl);
    if (this.viewer.drawer && !isWebGL) {
      this.setupTileDrawingOptimization();
    }
  }
  handleZoomChange(event) {
    const currentZoom = event.zoom || this.viewer.viewport.getZoom();
    this.lastZoomLevel = currentZoom;
    if (this.cinematicMode) {
      console.log("LowZoomOptimizer: Skipping zoom optimization - cinematic mode active");
      return;
    }
    if (currentZoom < this.CRITICAL_ZOOM_THRESHOLD) {
      this.applyCriticalZoomOptimization();
    } else if (currentZoom < this.LOW_ZOOM_THRESHOLD) {
      this.applyLowZoomOptimization();
    } else {
      this.restoreNormalOptimization();
    }
  }
  handlePanAtLowZoom(event) {
    const currentZoom = this.viewer.viewport.getZoom();
    if (currentZoom < this.LOW_ZOOM_THRESHOLD) {
      if (this.viewer.imageLoader) {
        const originalLimit = this.viewer.imageLoader.jobLimit;
        this.viewer.imageLoader.jobLimit = this.isMobile ? 1 : 2;
        setTimeout(() => {
          if (this.viewer.imageLoader) {
            this.viewer.imageLoader.jobLimit = originalLimit;
          }
        }, 50);
      }
    }
  }
  handleAnimationStart() {
    this.isZooming = true;
    this.zoomStartTime = performance.now();
    if (this.cinematicMode) {
      console.log("LowZoomOptimizer: Skipping animation optimization - cinematic mode active");
      return;
    }
    if (!this.isActive) {
      console.log("LowZoomOptimizer: Skipping optimization - disabled");
      return;
    }
    const currentZoom = this.viewer.viewport.getZoom();
    if (currentZoom < this.LOW_ZOOM_THRESHOLD) {
      if (!this.isMobile && this.viewer.imageLoader) {
        this.viewer.imageLoader.clear();
      }
      this.storeOriginalSpringSettings();
      this.optimizeSpringSettings();
    }
  }
  handleAnimationFinish() {
    this.isZooming = false;
    if (this.zoomStartTime) {
      performance.now() - this.zoomStartTime;
      this.zoomStartTime = null;
    }
    if (this.cinematicMode) {
      console.log("LowZoomOptimizer: Skipping spring restoration - cinematic mode active");
      return;
    }
    if (!this.isActive) {
      console.log("LowZoomOptimizer: Skipping spring restoration - disabled");
      return;
    }
    this.restoreOriginalSpringSettings();
  }
  applyCriticalZoomOptimization() {
    if (this.isOptimizing) return;
    this.isOptimizing = true;
    if (Object.keys(this.originalSettings).length === 0) {
      this.storeOriginalSettings();
    }
    if (this.viewer.imageLoader) {
      this.viewer.imageLoader.jobLimit = 1;
    }
    this.viewer.imageSmoothingEnabled = false;
    this.viewer.immediateRender = true;
    if (this.isMobile) {
      this.viewer.maxTilesPerFrame = 1;
      this.viewer.blendTime = 0;
      this.viewer.alwaysBlend = false;
    }
  }
  applyLowZoomOptimization() {
    if (this.isOptimizing) return;
    this.isOptimizing = true;
    if (Object.keys(this.originalSettings).length === 0) {
      this.storeOriginalSettings();
    }
    if (this.viewer.imageLoader) {
      this.viewer.imageLoader.jobLimit = this.isMobile ? 1 : 2;
    }
    if (this.isMobile) {
      this.viewer.maxTilesPerFrame = 1;
      this.viewer.blendTime = 0;
    } else {
      this.viewer.maxTilesPerFrame = 2;
      this.viewer.blendTime = 0;
    }
  }
  restoreNormalOptimization() {
    if (!this.isOptimizing) return;
    this.restoreOriginalSettings();
    this.isOptimizing = false;
  }
  // PERFORMANCE FIX: Removed all complex RAF scheduling that added latency
  setupTileDrawingOptimization() {
    let tileCounter = 0;
    this.viewer.addHandler("tile-drawing", (event) => {
      if (!this.isActive) return;
      const zoom = this.viewer.viewport.getZoom();
      event.tile;
      const level = event.tile.level;
      if (zoom < this.LOW_ZOOM_THRESHOLD) {
        tileCounter++;
        const skipRatio = zoom < this.CRITICAL_ZOOM_THRESHOLD ? 2 : 1;
        if (skipRatio > 0 && tileCounter % (skipRatio + 1) !== 0) {
          event.preventDefaultAction = true;
          return;
        }
        const screenSize = event.tile.size * zoom;
        if (screenSize < (this.isMobile ? 32 : 24)) {
          event.preventDefaultAction = true;
          return;
        }
      }
      if (this.isZooming) {
        const optimalLevel = Math.floor(Math.log2(zoom));
        if (Math.abs(level - optimalLevel) > 2) {
          event.preventDefaultAction = true;
          return;
        }
      }
    });
  }
  // PERFORMANCE FIX: Removed all batching and deferred operations that added latency
  storeOriginalSettings() {
    var _a;
    this.originalSettings = {
      imageLoaderLimit: (_a = this.viewer.imageLoader) == null ? void 0 : _a.jobLimit,
      maxTilesPerFrame: this.viewer.maxTilesPerFrame,
      blendTime: this.viewer.blendTime,
      alwaysBlend: this.viewer.alwaysBlend,
      imageSmoothingEnabled: this.viewer.imageSmoothingEnabled,
      immediateRender: this.viewer.immediateRender
    };
  }
  restoreOriginalSettings() {
    if (Object.keys(this.originalSettings).length === 0) return;
    Object.keys(this.originalSettings).forEach((key) => {
      const value = this.originalSettings[key];
      if (value !== void 0) {
        if (key === "imageLoaderLimit" && this.viewer.imageLoader) {
          this.viewer.imageLoader.jobLimit = value;
        } else if (this.viewer[key] !== void 0) {
          this.viewer[key] = value;
        }
      }
    });
  }
  storeOriginalSpringSettings() {
    if (!this.originalSpringSettings) {
      this.originalSpringSettings = {
        animationTime: this.viewer.animationTime,
        springStiffness: this.viewer.springStiffness,
        centerXAnimationTime: this.viewer.viewport.centerSpringX.animationTime,
        centerYAnimationTime: this.viewer.viewport.centerSpringY.animationTime,
        zoomAnimationTime: this.viewer.viewport.zoomSpring.animationTime,
        centerXStiffness: this.viewer.viewport.centerSpringX.springStiffness,
        centerYStiffness: this.viewer.viewport.centerSpringY.springStiffness,
        zoomStiffness: this.viewer.viewport.zoomSpring.springStiffness
      };
    }
  }
  optimizeSpringSettings() {
    if (this.cinematicMode) {
      console.log("LowZoomOptimizer: Preserving springs - cinematic mode active");
      return;
    }
    const animTime = this.isMobile ? 0.25 : 0.2;
    const stiffness = this.isMobile ? 15 : 18;
    this.viewer.animationTime = animTime;
    this.viewer.springStiffness = stiffness;
    this.viewer.viewport.centerSpringX.animationTime = animTime;
    this.viewer.viewport.centerSpringY.animationTime = animTime;
    this.viewer.viewport.zoomSpring.animationTime = animTime;
    this.viewer.viewport.centerSpringX.springStiffness = stiffness;
    this.viewer.viewport.centerSpringY.springStiffness = stiffness;
    this.viewer.viewport.zoomSpring.springStiffness = stiffness;
  }
  restoreOriginalSpringSettings() {
    if (!this.originalSpringSettings) return;
    const settings = this.originalSpringSettings;
    this.viewer.animationTime = settings.animationTime;
    this.viewer.springStiffness = settings.springStiffness;
    this.viewer.viewport.centerSpringX.animationTime = settings.centerXAnimationTime;
    this.viewer.viewport.centerSpringY.animationTime = settings.centerYAnimationTime;
    this.viewer.viewport.zoomSpring.animationTime = settings.zoomAnimationTime;
    this.viewer.viewport.centerSpringX.springStiffness = settings.centerXStiffness;
    this.viewer.viewport.centerSpringY.springStiffness = settings.centerYStiffness;
    this.viewer.viewport.zoomSpring.springStiffness = settings.zoomStiffness;
    this.originalSpringSettings = null;
  }
  // Research: Dynamic performance monitoring and adjustment
  monitorPerformance(fps) {
    if (!this._lastEmergencyTime) {
      this._lastEmergencyTime = 0;
    }
    const now = Date.now();
    const cooldownPeriod = 5e3;
    const isSafariDesktop = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/iPad|iPhone|iPod/.test(navigator.userAgent);
    const threshold = isSafariDesktop ? 10 : this.isMobile ? 15 : 25;
    if (fps < threshold && fps > 0 && now - this._lastEmergencyTime > cooldownPeriod) {
      console.warn(`LowZoomOptimizer: Low FPS detected (${fps}), applying emergency optimization`);
      this._lastEmergencyTime = now;
      this.applyEmergencyOptimization();
    }
  }
  applyEmergencyOptimization() {
    console.warn("LowZoomOptimizer: Applying EMERGENCY optimization");
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isSafariDesktop = isSafari && !/iPad|iPhone|iPod/.test(navigator.userAgent);
    if (this.viewer.imageLoader) {
      this.viewer.imageLoader.jobLimit = isSafariDesktop ? 2 : 1;
      if (!isSafari) {
        this.viewer.imageLoader.clear();
      }
    }
    this.viewer.maxTilesPerFrame = isSafariDesktop ? 2 : 1;
    this.viewer.blendTime = isSafari ? 0.1 : 0;
    this.viewer.alwaysBlend = false;
    this.viewer.immediateRender = true;
    if (!isSafari && !this.isMobile && this.viewer.world) {
      const tiledImages = this.viewer.world.getItemCount();
      for (let i = 0; i < tiledImages; i++) {
        const tiledImage = this.viewer.world.getItemAt(i);
        if (tiledImage && tiledImage._tileCache) {
          setTimeout(() => {
            tiledImage._tileCache.clearTilesFor(tiledImage);
          }, 0);
        }
      }
    }
  }
  // Public methods for external control
  enable() {
    this.isActive = true;
  }
  disable() {
    this.isActive = false;
    this.restoreNormalOptimization();
  }
  destroy() {
    this.disable();
    if (this.viewer) {
      this.viewer.removeAllHandlers("zoom");
      this.viewer.removeAllHandlers("pan");
      this.viewer.removeAllHandlers("animation-start");
      this.viewer.removeAllHandlers("animation-finish");
      this.viewer.removeAllHandlers("tile-drawing");
    }
    console.log("🚀 PERFORMANCE FIXED: LowZoomOptimizer destroyed");
  }
  // CINEMATIC FIX: Set cinematic mode to prevent interference with cinematic zooms
  setCinematicMode(enabled) {
    this.cinematicMode = enabled;
    console.log(`LowZoomOptimizer: Cinematic mode ${enabled ? "ENABLED" : "DISABLED"}`);
    if (enabled) {
      this.restoreNormalOptimization();
    }
  }
  // Simplified status method
  getStatus() {
    return {
      isActive: this.isActive,
      isOptimizing: this.isOptimizing,
      currentZoom: this.lastZoomLevel,
      isMobile: this.isMobile,
      cinematicMode: this.cinematicMode,
      optimizationLevel: this.isOptimizing ? this.lastZoomLevel < this.CRITICAL_ZOOM_THRESHOLD ? "critical" : "low" : "normal",
      fixed: "PERFORMANCE_OPTIMIZED"
    };
  }
}
class MemoryManager {
  constructor(viewer) {
    __publicField(this, "handleVisibilityChange", () => {
      if (document.hidden) {
        console.log("Page hidden - performing cleanup");
        this.performHighPressureCleanup();
      }
    });
    __publicField(this, "handleFreeze", () => {
      console.log("Page freezing - emergency cleanup");
      this.performEmergencyCleanup();
    });
    this.viewer = viewer;
    this.state = {
      isActive: false,
      lastCleanup: Date.now(),
      cleanupCount: 0,
      memoryPressure: "normal"
      // normal, high, critical
    };
    this.config = {
      // Memory thresholds (MB)
      warningThreshold: 100,
      highThreshold: 150,
      criticalThreshold: 200,
      // Cache limits by memory pressure
      cacheLimits: {
        normal: { tiles: 500, hotspots: 150 },
        high: { tiles: 200, hotspots: 100 },
        critical: { tiles: 50, hotspots: 50 }
      },
      // Intervals
      monitorInterval: 5e3,
      // Check every 5 seconds
      cleanupInterval: 3e4,
      // Cleanup every 30 seconds
      aggressiveCleanupDelay: 6e4,
      // Force cleanup every minute
      // Platform
      hasMemoryAPI: "memory" in performance,
      hasGC: typeof window.gc === "function",
      isMobile: /Android|iPhone|iPad/i.test(navigator.userAgent)
    };
    if (this.config.isMobile) {
      this.config.warningThreshold = 50;
      this.config.highThreshold = 75;
      this.config.criticalThreshold = 100;
      this.config.monitorInterval = 3e3;
    }
    this.intervals = {};
    this.metrics = {
      currentUsage: 0,
      peakUsage: 0,
      cleanups: 0,
      gcCalls: 0
    };
  }
  start() {
    if (this.state.isActive) return;
    this.state.isActive = true;
    this.intervals.monitor = setInterval(() => this.checkMemory(), this.config.monitorInterval);
    this.intervals.cleanup = setInterval(() => this.performScheduledCleanup(), this.config.cleanupInterval);
    this.intervals.aggressive = setInterval(() => this.performAggressiveCleanup(), this.config.aggressiveCleanupDelay);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    if ("onfreeze" in document) {
      document.addEventListener("freeze", this.handleFreeze);
    }
    console.log("MemoryManager started");
  }
  stop() {
    this.state.isActive = false;
    Object.values(this.intervals).forEach((interval) => clearInterval(interval));
    this.intervals = {};
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    document.removeEventListener("freeze", this.handleFreeze);
    console.log("MemoryManager stopped");
  }
  checkMemory() {
    if (!this.config.hasMemoryAPI) return;
    const usage = performance.memory.usedJSHeapSize / 1048576;
    const limit = performance.memory.jsHeapSizeLimit / 1048576;
    const percentage = usage / limit * 100;
    this.metrics.currentUsage = usage;
    this.metrics.peakUsage = Math.max(this.metrics.peakUsage, usage);
    const previousPressure = this.state.memoryPressure;
    if (usage > this.config.criticalThreshold || percentage > 80) {
      this.state.memoryPressure = "critical";
    } else if (usage > this.config.highThreshold || percentage > 60) {
      this.state.memoryPressure = "high";
    } else {
      this.state.memoryPressure = "normal";
    }
    if (this.state.memoryPressure !== previousPressure) {
      console.log(`Memory pressure changed: ${previousPressure} → ${this.state.memoryPressure} (${usage.toFixed(0)}MB, ${percentage.toFixed(0)}%)`);
      switch (this.state.memoryPressure) {
        case "critical":
          this.performEmergencyCleanup();
          break;
        case "high":
          this.performHighPressureCleanup();
          break;
      }
    }
    this.updateCacheLimits();
  }
  updateCacheLimits() {
    const limits = this.config.cacheLimits[this.state.memoryPressure];
    if (this.viewer.maxImageCacheCount !== limits.tiles) {
      this.viewer.maxImageCacheCount = limits.tiles;
      console.log(`Adjusted tile cache limit to ${limits.tiles}`);
    }
  }
  performScheduledCleanup() {
    if (this.state.memoryPressure === "normal") return;
    console.log("Performing scheduled cleanup");
    this.cleanupTileCache();
    this.metrics.cleanups++;
  }
  performHighPressureCleanup() {
    console.log("High memory pressure - performing cleanup");
    this.cleanupTileCache(true);
    if (window.audioEngine && typeof window.audioEngine.destroy === "function") ;
    this.suggestGC();
    this.metrics.cleanups++;
  }
  performEmergencyCleanup() {
    var _a;
    console.warn("CRITICAL: Emergency memory cleanup");
    const tiledImage = (_a = this.viewer.world) == null ? void 0 : _a.getItemAt(0);
    if (!tiledImage) return;
    if (tiledImage._tileCache) {
      tiledImage._tileCache.clearTilesFor(tiledImage);
    }
    this.viewer.maxImageCacheCount = 30;
    if (window.tileOptimizer) {
      window.tileOptimizer.clearOldTiles();
    }
    if (window.spatialIndex) {
      window.spatialIndex.queryCache.clear();
    }
    this.forceGC();
    this.clearUnusedImages();
    this.metrics.cleanups++;
    this.state.lastCleanup = Date.now();
  }
  performAggressiveCleanup() {
    if (!this.state.isActive) return;
    if (this.metrics.currentUsage > this.config.warningThreshold) {
      console.log("Performing aggressive cleanup");
      this.cleanupTileCache(true);
      this.clearUnusedImages();
      this.suggestGC();
    }
  }
  cleanupTileCache(aggressive = false) {
    var _a, _b;
    const tiledImage = (_a = this.viewer.world) == null ? void 0 : _a.getItemAt(0);
    if (!(tiledImage == null ? void 0 : tiledImage._tileCache)) return;
    const cache = tiledImage._tileCache;
    const cacheSize = ((_b = cache._tilesLoaded) == null ? void 0 : _b.length) || cache._imagesLoadedCount || 0;
    if (aggressive || cacheSize > this.config.cacheLimits[this.state.memoryPressure].tiles) {
      const targetSize = aggressive ? Math.floor(this.config.cacheLimits[this.state.memoryPressure].tiles * 0.5) : this.config.cacheLimits[this.state.memoryPressure].tiles;
      const tilesToRemove = cacheSize - targetSize;
      if (tilesToRemove > 0) {
        console.log(`Removing ${tilesToRemove} tiles from cache (current: ${cacheSize})`);
        cache.clearTilesFor(tiledImage);
      }
    }
  }
  clearUnusedImages() {
    const images = document.querySelectorAll("img");
    let cleared = 0;
    images.forEach((img) => {
      if (!this.isElementVisible(img) && img.src) {
        img.removeAttribute("src");
        cleared++;
      }
    });
    if (cleared > 0) {
      console.log(`Cleared ${cleared} unused images`);
    }
  }
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
  }
  suggestGC() {
    if (this.config.hasGC) {
      console.log("Suggesting garbage collection");
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          window.gc();
          this.metrics.gcCalls++;
        });
      } else {
        setTimeout(() => {
          window.gc();
          this.metrics.gcCalls++;
        }, 100);
      }
    }
  }
  forceGC() {
    if (this.config.hasGC) {
      console.log("Forcing immediate garbage collection");
      window.gc();
      this.metrics.gcCalls++;
    }
  }
  getMetrics() {
    const metrics = {
      ...this.metrics,
      memoryPressure: this.state.memoryPressure,
      cacheLimits: this.config.cacheLimits[this.state.memoryPressure]
    };
    if (this.config.hasMemoryAPI) {
      const limit = performance.memory.jsHeapSizeLimit / 1048576;
      metrics.usagePercentage = (this.metrics.currentUsage / limit * 100).toFixed(1) + "%";
      metrics.totalLimit = limit.toFixed(0) + "MB";
    }
    return metrics;
  }
  destroy() {
    this.stop();
    this.viewer = null;
  }
}
class MouseWheelSmoothing {
  constructor(viewer, config = {}) {
    this.viewer = viewer;
    this.config = {
      throttleMs: config.throttleMs || 16,
      // 60 FPS throttling
      zoomStep: config.zoomStep || 0.02,
      // Small steps for smooth zoom
      enabled: config.enabled !== false,
      // Default enabled
      ...config
    };
    this.lastEventTime = 0;
    this.pendingZoom = 0;
    this.throttleTimeout = null;
    this.isEnabled = this.config.enabled;
    this.init();
  }
  init() {
    if (!this.viewer || !this.isEnabled) return;
    this.viewer.addHandler("canvas-scroll", this.handleScroll.bind(this));
    console.log("Mouse wheel smoothing initialized:", {
      throttleMs: this.config.throttleMs,
      zoomStep: this.config.zoomStep
    });
  }
  handleScroll(event) {
    if (!this.isEnabled) return;
    event.preventDefault = true;
    const now = performance.now();
    const deltaY = this.normalizeWheelDelta(event.originalEvent);
    const zoomDirection = Math.sign(-deltaY);
    const zoomAmount = this.config.zoomStep * Math.abs(zoomDirection);
    this.pendingZoom += zoomAmount * zoomDirection;
    if (now - this.lastEventTime >= this.config.throttleMs) {
      this.applyPendingZoom();
      this.lastEventTime = now;
    } else {
      if (this.throttleTimeout) {
        clearTimeout(this.throttleTimeout);
      }
      this.throttleTimeout = setTimeout(() => {
        this.applyPendingZoom();
        this.lastEventTime = performance.now();
      }, this.config.throttleMs);
    }
  }
  normalizeWheelDelta(event) {
    const LINE_HEIGHT = 40;
    let deltaY = 0;
    if ("deltaY" in event) {
      deltaY = event.deltaY;
    } else if ("wheelDelta" in event) {
      deltaY = -event.wheelDelta / 120 * LINE_HEIGHT;
    }
    if (event.deltaMode === 1) {
      deltaY *= LINE_HEIGHT;
    }
    return deltaY;
  }
  applyPendingZoom() {
    if (Math.abs(this.pendingZoom) < 1e-3) {
      this.pendingZoom = 0;
      return;
    }
    const currentZoom = this.viewer.viewport.getZoom();
    const targetZoom = currentZoom * (1 + this.pendingZoom);
    const clampedZoom = Math.max(
      this.viewer.viewport.getMinZoom(),
      Math.min(this.viewer.viewport.getMaxZoom(), targetZoom)
    );
    this.viewer.viewport.zoomTo(clampedZoom);
    this.viewer.viewport.applyConstraints();
    this.pendingZoom = 0;
  }
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log("Mouse wheel smoothing config updated:", this.config);
  }
  enable() {
    this.isEnabled = true;
    console.log("Mouse wheel smoothing enabled");
  }
  disable() {
    this.isEnabled = false;
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }
    console.log("Mouse wheel smoothing disabled");
  }
  destroy() {
    this.disable();
  }
}
class OrganicVariations {
  constructor() {
    this.variationCache = /* @__PURE__ */ new Map();
    this.durationVariation = 0.1;
    this.easingVariation = 0.05;
    this.startPointVariation = 0.15;
    this.debugMode = false;
    this.enableDebugMode = () => {
      this.debugMode = true;
      this.durationVariation = 0.5;
      this.easingVariation = 0.25;
      this.startPointVariation = 0.5;
      this.clearAllVariations();
      console.log("[OrganicVariations] 🔥 EXTREME DEBUG MODE enabled - variations are now VERY obvious:");
      console.log("  - Duration: ±50% (1.1s to 3.3s instead of 2.2s)");
      console.log("  - Easing: ±25% control point variation");
      console.log("  - Start Point: 0-50% of path length");
      console.log("  - Hover over multiple hotspots to see the differences!");
    };
    this.disableDebugMode = () => {
      this.debugMode = false;
      this.durationVariation = 0.1;
      this.easingVariation = 0.05;
      this.startPointVariation = 0.15;
      this.clearAllVariations();
      console.log("[OrganicVariations] Debug mode disabled - variations are back to subtle");
    };
  }
  /**
   * Get or create variations for a specific hotspot
   * Cached to maintain consistency during hover/unhover cycles
   */
  getVariations(hotspotId) {
    if (!this.variationCache.has(hotspotId)) {
      this.variationCache.set(hotspotId, this.generateVariations());
    }
    return this.variationCache.get(hotspotId);
  }
  /**
   * Generate new random variations
   */
  generateVariations() {
    return {
      durationMultiplier: this.generateDurationMultiplier(),
      easingAdjustment: this.generateEasingAdjustment(),
      startPointOffset: this.generateStartPointOffset(),
      // Timestamp to allow refreshing variations after some time
      timestamp: Date.now()
    };
  }
  /**
   * Generate duration multiplier (0.9 to 1.1 for ±10%)
   */
  generateDurationMultiplier() {
    const min = 1 - this.durationVariation;
    const max = 1 + this.durationVariation;
    return min + Math.random() * (max - min);
  }
  /**
   * Generate easing curve adjustment
   * Slightly modifies the control points of the cubic-bezier
   */
  generateEasingAdjustment() {
    return {
      x1: (Math.random() - 0.5) * this.easingVariation * 2,
      y1: (Math.random() - 0.5) * this.easingVariation * 2,
      x2: (Math.random() - 0.5) * this.easingVariation * 2,
      y2: (Math.random() - 0.5) * this.easingVariation * 2
    };
  }
  /**
   * Generate start point offset (0 to 15% of path)
   */
  generateStartPointOffset() {
    return Math.random() * this.startPointVariation;
  }
  /**
   * Apply duration variation to base duration
   */
  applyDurationVariation(baseDuration, hotspotId) {
    const variations = this.getVariations(hotspotId);
    if (Date.now() - variations.timestamp > 3e4) {
      this.variationCache.delete(hotspotId);
      return this.applyDurationVariation(baseDuration, hotspotId);
    }
    return baseDuration * variations.durationMultiplier;
  }
  /**
   * Apply easing variation to base easing curve
   * Takes a cubic-bezier string and returns a modified one
   */
  applyEasingVariation(baseEasing, hotspotId) {
    const variations = this.getVariations(hotspotId);
    const match = baseEasing.match(/cubic-bezier\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
    if (!match) return baseEasing;
    const x1 = parseFloat(match[1]) + variations.easingAdjustment.x1;
    const y1 = parseFloat(match[2]) + variations.easingAdjustment.y1;
    const x2 = parseFloat(match[3]) + variations.easingAdjustment.x2;
    const y2 = parseFloat(match[4]) + variations.easingAdjustment.y2;
    const clamp = (val) => Math.max(0, Math.min(1, val));
    return `cubic-bezier(${clamp(x1)}, ${clamp(y1)}, ${clamp(x2)}, ${clamp(y2)})`;
  }
  /**
   * Calculate varied stroke dash values for different start points
   * This creates the effect of starting the stroke from different positions
   */
  getVariedStrokeDashValues(pathLength, hotspotId) {
    const variations = this.getVariations(hotspotId);
    pathLength * variations.startPointOffset;
    return {
      dashArray: pathLength,
      dashOffset: pathLength
    };
  }
  /**
   * Clear variations for a hotspot (useful when changing animation styles)
   */
  clearVariations(hotspotId) {
    this.variationCache.delete(hotspotId);
  }
  /**
   * Clear all cached variations
   */
  clearAllVariations() {
    this.variationCache.clear();
  }
}
const organicVariations = new OrganicVariations();
if (typeof window !== "undefined") {
  window.organicVariations = organicVariations;
  window.testVariations = {
    enableDebugMode: () => organicVariations.enableDebugMode(),
    disableDebugMode: () => organicVariations.disableDebugMode(),
    showCache: () => {
      const cache = [];
      organicVariations.variationCache.forEach((v, id) => {
        cache.push({
          hotspotId: id,
          duration: `×${v.durationMultiplier.toFixed(3)}`,
          startOffset: `${(v.startPointOffset * 100).toFixed(1)}%`,
          age: `${((Date.now() - v.timestamp) / 1e3).toFixed(1)}s`
        });
      });
      console.table(cache);
      return `${cache.length} variations cached`;
    },
    clear: () => {
      organicVariations.clearAllVariations();
      return "All variations cleared";
    }
  };
}
class CentralizedEventManager {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.container = null;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;
    this.onHotspotClick = options.onHotspotClick || (() => {
    });
    this.onHotspotHover = options.onHotspotHover || (() => {
    });
    this.activePointers = /* @__PURE__ */ new Map();
    this.isDragging = false;
    this.dragStartPoint = null;
    this.dragStartTime = 0;
    this.currentHoveredId = null;
    this.clickTimeThreshold = 300;
    this.clickDistThreshold = this.isMobile ? 15 : 8;
    this.lastMoveTime = 0;
    this.moveThrottle = this.isMobile ? 60 : 16;
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.eventCount = 0;
    this.savedListeners = 0;
  }
  /**
   * Initialize with container element
   */
  initialize(container) {
    if (this.container) {
      this.cleanup();
    }
    this.container = container;
    if (!this.container) {
      console.warn("CentralizedEventManager: No container provided");
      return;
    }
    this.container.addEventListener("pointerdown", this.handlePointerDown, { passive: true });
    this.container.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    this.container.addEventListener("pointerup", this.handlePointerUp, { passive: true });
    this.disableIndividualListeners();
    console.log(`[CentralizedEventManager] Initialized - Replaced ${this.savedListeners} individual listeners with 1 delegated listener`);
  }
  /**
   * Disable all individual hotspot listeners
   */
  disableIndividualListeners() {
    const hotspots = document.querySelectorAll("[data-hotspot-id]");
    let count = 0;
    hotspots.forEach((element) => {
      element.onclick = null;
      element.onmouseenter = null;
      element.onmouseleave = null;
      element.ontouchstart = null;
      element.ontouchend = null;
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);
      count++;
    });
    this.savedListeners = count * 5;
    return count;
  }
  /**
   * Handle pointer down - start of interaction
   */
  handlePointerDown(event) {
    this.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    });
    if (this.activePointers.size > 1) {
      this.isDragging = false;
      return;
    }
    this.dragStartPoint = { x: event.clientX, y: event.clientY };
    this.dragStartTime = Date.now();
    const hotspot = this.findHotspotElement(event.target);
    if (hotspot) {
      this.eventCount++;
      hotspot.getAttribute("data-hotspot-id");
      if (this.isMobile) {
        hotspot.classList.add("hotspot-touch-active");
      }
    }
  }
  /**
   * Handle pointer move - throttled for performance
   */
  handlePointerMove(event) {
    const now = Date.now();
    if (now - this.lastMoveTime < this.moveThrottle) {
      return;
    }
    this.lastMoveTime = now;
    if (this.activePointers.has(event.pointerId)) {
      this.activePointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        timestamp: now
      });
    }
    if (this.dragStartPoint && !this.isDragging) {
      const dx = event.clientX - this.dragStartPoint.x;
      const dy = event.clientY - this.dragStartPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > this.clickDistThreshold) {
        this.isDragging = true;
        this.clearHover();
        return;
      }
    }
    if (this.isMobile || this.isDragging) {
      return;
    }
    const hotspot = this.findHotspotElement(event.target);
    const hotspotId = hotspot ? hotspot.getAttribute("data-hotspot-id") : null;
    if (hotspotId !== this.currentHoveredId) {
      if (this.currentHoveredId) {
        const prevElement = document.querySelector(`[data-hotspot-id="${this.currentHoveredId}"]`);
        if (prevElement) {
          prevElement.classList.remove("hotspot-hover");
        }
      }
      if (hotspotId) {
        hotspot.classList.add("hotspot-hover");
        this.onHotspotHover({ id: hotspotId });
      }
      this.currentHoveredId = hotspotId;
      this.eventCount++;
    }
  }
  /**
   * Handle pointer up - end of interaction
   */
  handlePointerUp(event) {
    const pointer = this.activePointers.get(event.pointerId);
    if (!pointer) return;
    if (!this.isDragging && this.dragStartPoint) {
      const timeDiff = Date.now() - this.dragStartTime;
      const dx = event.clientX - this.dragStartPoint.x;
      const dy = event.clientY - this.dragStartPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (timeDiff < this.clickTimeThreshold && distance < this.clickDistThreshold) {
        const hotspot = this.findHotspotElement(event.target);
        if (hotspot) {
          const id = hotspot.getAttribute("data-hotspot-id");
          this.onHotspotClick({ id });
          this.eventCount++;
          if (this.isMobile) {
            hotspot.classList.remove("hotspot-touch-active");
          }
        }
      }
    }
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size === 0) {
      this.isDragging = false;
      this.dragStartPoint = null;
      this.dragStartTime = 0;
    }
  }
  /**
   * Find hotspot element from event target
   */
  findHotspotElement(target) {
    let element = target;
    let maxDepth = 10;
    while (element && maxDepth > 0) {
      if (element.hasAttribute && element.hasAttribute("data-hotspot-id")) {
        return element;
      }
      element = element.parentElement;
      maxDepth--;
    }
    return null;
  }
  /**
   * Clear hover state
   */
  clearHover() {
    if (this.currentHoveredId) {
      const element = document.querySelector(`[data-hotspot-id="${this.currentHoveredId}"]`);
      if (element) {
        element.classList.remove("hotspot-hover");
      }
      this.currentHoveredId = null;
    }
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      eventsHandled: this.eventCount,
      listenersReplaced: this.savedListeners,
      activePointers: this.activePointers.size,
      currentHovered: this.currentHoveredId,
      isDragging: this.isDragging
    };
  }
  /**
   * Clean up
   */
  cleanup() {
    if (this.container) {
      this.container.removeEventListener("pointerdown", this.handlePointerDown);
      this.container.removeEventListener("pointermove", this.handlePointerMove);
      this.container.removeEventListener("pointerup", this.handlePointerUp);
    }
    this.clearHover();
    this.activePointers.clear();
    console.log("[CentralizedEventManager] Cleaned up");
  }
  /**
   * Destroy
   */
  destroy() {
    this.cleanup();
    this.container = null;
    this.viewer = null;
  }
}
new CentralizedEventManager();
class NetworkAdaptiveManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.enabled = false;
    this.currentQuality = "high";
    this.networkType = "4g";
    this.saveDataMode = false;
    this.qualityLevels = {
      "slow-2g": {
        imageLoaderLimit: 1,
        maxImageCacheCount: 15,
        maxTilesPerFrame: 1,
        jpegQuality: 30,
        preload: false,
        animationTime: 0.5,
        springStiffness: 8
      },
      "2g": {
        imageLoaderLimit: 1,
        maxImageCacheCount: 20,
        maxTilesPerFrame: 1,
        jpegQuality: 50,
        preload: false,
        animationTime: 0.4,
        springStiffness: 10
      },
      "3g": {
        imageLoaderLimit: 2,
        // INCREASED from 1 to 2 for better performance
        maxImageCacheCount: 100,
        // INCREASED from 50 to 100
        maxTilesPerFrame: 3,
        // INCREASED from 2 to 3
        jpegQuality: 75,
        // INCREASED from 70
        preload: true,
        animationTime: 0.25,
        // DECREASED from 0.3 for snappier response
        springStiffness: 14
        // INCREASED from 12 for tighter control
      },
      "4g": {
        imageLoaderLimit: 4,
        // INCREASED from 2 to 4
        maxImageCacheCount: 200,
        // INCREASED from 100 to 200
        maxTilesPerFrame: 4,
        // INCREASED from 2 to 4
        jpegQuality: 85,
        preload: true,
        animationTime: 0.2,
        // DECREASED from 0.3
        springStiffness: 15
        // INCREASED from 12
      },
      "wifi": {
        imageLoaderLimit: 3,
        maxImageCacheCount: 150,
        maxTilesPerFrame: 3,
        jpegQuality: 90,
        preload: true,
        animationTime: 0.3,
        springStiffness: 12
      }
    };
    this.performanceMetrics = {
      lastCheck: 0,
      avgLoadTime: 0,
      samples: []
    };
    this.onNetworkChange = null;
  }
  /**
   * Initialize network detection and monitoring
   */
  initialize() {
    if (this.enabled) return;
    console.log("[NetworkAdaptive] Initializing network detection...");
    if ("connection" in navigator) {
      this.setupNetworkAPI();
    } else {
      console.log("[NetworkAdaptive] Network API not available, using Safari fallback");
      this.setupSafariFallback();
    }
    this.checkDataSaver();
    this.applyNetworkSettings();
    this.enabled = true;
  }
  /**
   * Setup Network Information API monitoring
   */
  setupNetworkAPI() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      this.networkType = connection.effectiveType || "4g";
      this.saveDataMode = connection.saveData || false;
      console.log("[NetworkAdaptive] Network detected:", this.networkType, "Save data:", this.saveDataMode);
      connection.addEventListener("change", () => {
        const newType = connection.effectiveType || "4g";
        const newSaveData = connection.saveData || false;
        if (newType !== this.networkType || newSaveData !== this.saveDataMode) {
          console.log("[NetworkAdaptive] Network changed from", this.networkType, "to", newType);
          this.networkType = newType;
          this.saveDataMode = newSaveData;
          this.applyNetworkSettings();
        }
      });
      if (connection.downlink) {
        console.log("[NetworkAdaptive] Downlink speed:", connection.downlink, "Mbps");
        if (connection.downlink < 0.5) {
          this.networkType = "slow-2g";
        } else if (connection.downlink < 1) {
          this.networkType = "2g";
        } else if (connection.downlink < 3) {
          this.networkType = "3g";
        }
      }
    }
  }
  /**
   * Safari fallback: Estimate network speed using resource timing
   */
  setupSafariFallback() {
    this.estimateNetworkSpeed();
    setInterval(() => {
      this.estimateNetworkSpeed();
    }, 3e4);
    if (this.viewer) {
      this.viewer.addHandler("tile-loaded", (event) => {
        this.trackTileLoadTime(event);
      });
    }
  }
  /**
   * Estimate network speed for Safari
   */
  async estimateNetworkSpeed() {
    try {
      const testUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      const startTime = performance.now();
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = testUrl;
      });
      const loadTime = performance.now() - startTime;
      this.performanceMetrics.samples.push(loadTime);
      if (this.performanceMetrics.samples.length > 10) {
        this.performanceMetrics.samples.shift();
      }
      const avgTime = this.performanceMetrics.samples.reduce((a, b) => a + b, 0) / this.performanceMetrics.samples.length;
      this.performanceMetrics.avgLoadTime = avgTime;
      let estimatedType = "4g";
      if (avgTime > 500) {
        estimatedType = "slow-2g";
      } else if (avgTime > 300) {
        estimatedType = "2g";
      } else if (avgTime > 150) {
        estimatedType = "3g";
      } else if (avgTime > 50) {
        estimatedType = "4g";
      } else {
        estimatedType = "wifi";
      }
      if (estimatedType !== this.networkType) {
        console.log("[NetworkAdaptive] Safari: Network estimated as", estimatedType, "(avg load time:", avgTime.toFixed(2), "ms)");
        this.networkType = estimatedType;
        this.applyNetworkSettings();
      }
    } catch (error) {
      console.warn("[NetworkAdaptive] Failed to estimate network speed:", error);
    }
  }
  /**
   * Track actual tile load times for better estimation
   */
  trackTileLoadTime(event) {
    if (!event.tiledImage || !event.tile) return;
    const loadTime = event.tile.loadTime || 0;
    if (loadTime > 0) {
      this.performanceMetrics.samples.push(loadTime);
      if (this.performanceMetrics.samples.length > 20) {
        this.performanceMetrics.samples.shift();
      }
      const avgTime = this.performanceMetrics.samples.reduce((a, b) => a + b, 0) / this.performanceMetrics.samples.length;
      let estimatedType = "wifi";
      if (avgTime > 2e3) {
        estimatedType = "slow-2g";
      } else if (avgTime > 1e3) {
        estimatedType = "2g";
      } else if (avgTime > 500) {
        estimatedType = "3g";
      } else if (avgTime > 200) {
        estimatedType = "4g";
      }
      if (estimatedType !== this.networkType) {
        console.log("[NetworkAdaptive] Adjusting based on tile load times:", estimatedType, "(avg:", avgTime.toFixed(2), "ms)");
        this.networkType = estimatedType;
        this.applyNetworkSettings();
      }
    }
  }
  /**
   * Check if data saver mode is enabled
   */
  checkDataSaver() {
    if ("connection" in navigator && navigator.connection) {
      this.saveDataMode = navigator.connection.saveData || false;
    }
    if (window.matchMedia) {
      const prefersReducedData = window.matchMedia("(prefers-reduced-data: reduce)");
      if (prefersReducedData.matches) {
        this.saveDataMode = true;
      }
    }
    if (this.saveDataMode) {
      console.log("[NetworkAdaptive] Data saver mode detected");
    }
  }
  /**
   * Apply network-optimized settings to viewer
   */
  applyNetworkSettings() {
    if (!this.viewer) return;
    const settings = this.qualityLevels[this.networkType] || this.qualityLevels["4g"];
    if (this.saveDataMode) {
      settings.jpegQuality = Math.min(40, settings.jpegQuality);
      settings.preload = false;
      settings.maxImageCacheCount = Math.min(20, settings.maxImageCacheCount);
      settings.imageLoaderLimit = 1;
      console.log("[NetworkAdaptive] Data saver mode active - reducing quality");
    }
    console.log("[NetworkAdaptive] Applying settings for", this.networkType, ":", settings);
    if (this.viewer.drawer) {
      this.viewer.imageLoaderLimit = settings.imageLoaderLimit;
      this.viewer.maxImageCacheCount = settings.maxImageCacheCount;
      if (this.viewer.viewport) {
        this.viewer.viewport.animationTime = settings.animationTime;
        this.viewer.viewport.springStiffness = settings.springStiffness;
      }
    }
    const oldQuality = this.currentQuality;
    if (this.networkType === "slow-2g" || this.networkType === "2g") {
      this.currentQuality = "low";
    } else if (this.networkType === "3g") {
      this.currentQuality = "medium";
    } else {
      this.currentQuality = "high";
    }
    if (this.onNetworkChange && oldQuality !== this.currentQuality) {
      this.onNetworkChange(this.networkType, this.currentQuality);
    }
    this.showNetworkNotification();
  }
  /**
   * Show network status notification to user
   */
  showNetworkNotification() {
    let notification = document.getElementById("network-notification");
    if (!notification) {
      notification = document.createElement("div");
      notification.id = "network-notification";
      notification.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            `;
      document.body.appendChild(notification);
    }
    let message = "";
    let icon = "";
    switch (this.networkType) {
      case "slow-2g":
        message = "Very slow connection - Quality reduced";
        icon = "🐌";
        break;
      case "2g":
        message = "Slow connection - Quality reduced";
        icon = "🐢";
        break;
      case "3g":
        message = "Moderate connection - Balanced quality";
        icon = "📶";
        break;
      case "4g":
        message = "Good connection";
        icon = "📶";
        break;
      case "wifi":
        message = "Excellent connection";
        icon = "📶";
        break;
    }
    if (this.saveDataMode) {
      message += " (Data saver on)";
      icon = "💾";
    }
    notification.textContent = `${icon} ${message}`;
    notification.style.opacity = "1";
    setTimeout(() => {
      notification.style.opacity = "0";
    }, 3e3);
  }
  /**
   * Get current network status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      networkType: this.networkType,
      quality: this.currentQuality,
      saveDataMode: this.saveDataMode,
      settings: this.qualityLevels[this.networkType]
    };
  }
  /**
   * Manually set network type (for testing)
   */
  setNetworkType(type) {
    if (this.qualityLevels[type]) {
      console.log("[NetworkAdaptive] Manually setting network type to:", type);
      this.networkType = type;
      this.applyNetworkSettings();
    }
  }
  /**
   * Cleanup
   */
  destroy() {
    this.enabled = false;
    const notification = document.getElementById("network-notification");
    if (notification) {
      notification.remove();
    }
    if ("connection" in navigator && navigator.connection) {
      navigator.connection.removeEventListener("change", this.applyNetworkSettings);
    }
  }
}
class PerformanceMonitor {
  constructor(viewer) {
    this.viewer = viewer;
    this.isMonitoring = false;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.frameTimes = [];
    const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.thresholds = {
      fps: {
        target: isMobile2 ? 45 : 60,
        // Target 45 FPS on mobile
        good: isMobile2 ? 35 : 50,
        // Good at 35 FPS
        acceptable: isMobile2 ? 25 : 35,
        // Acceptable at 25 FPS
        poor: isMobile2 ? 20 : 25,
        // Poor at 20 FPS
        critical: isMobile2 ? 15 : 15
        // Critical remains at 15
      },
      frameTime: { target: isMobile2 ? 22 : 16.67, warning: 40 },
      // 45 FPS target on mobile
      memory: { warning: isMobile2 ? 200 : 300, critical: isMobile2 ? 300 : 400 }
    };
    this.metrics = this.getDefaultMetrics();
    this.performanceHistory = [];
    this.loadTimes = [];
    this.config = {
      historySize: { fps: 60, performance: 300, frameTimes: 60, loadTimes: 50 },
      intervals: { monitoring: 250, debug: 100 },
      optimization: { cooldown: 1e3 }
    };
    this.lastOptimization = Date.now();
    this.intervals = {};
  }
  getDefaultMetrics() {
    return {
      currentFPS: 60,
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      frameTime: 16.67,
      maxFrameTime: 16.67,
      droppedFrames: 0,
      tileLoadTime: 0,
      visibleTiles: 0,
      cachedTiles: 0,
      tilesLoading: 0,
      memoryUsage: 0,
      memoryLimit: 0,
      gcCount: 0,
      renderMode: "static",
      drawCalls: 0,
      canvasSize: 0,
      zoomLevel: 1,
      viewportCoverage: 0,
      hotspotCount: 0,
      performanceScore: 100
    };
  }
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.measureFrame();
    this.intervals.monitoring = setInterval(() => {
      this.updateMetrics();
      this.analyzePerformance();
    }, this.config.intervals.monitoring);
    this.setupEventHandlers();
    console.log("Performance monitoring started - Target: 60 FPS");
  }
  stop() {
    this.isMonitoring = false;
    Object.values(this.intervals).forEach((interval) => clearInterval(interval));
    this.intervals = {};
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.removeEventHandlers();
    console.log("Performance monitoring stopped");
  }
  pauseMonitoring() {
    this.isPaused = true;
    console.log("Performance monitoring paused");
  }
  resumeMonitoring() {
    this.isPaused = false;
    console.log("Performance monitoring resumed");
  }
  setupEventHandlers() {
    const handlers = {
      "tile-loaded": this.onTileLoaded,
      "tile-load-failed": this.onTileLoadFailed,
      "animation-start": () => this.metrics.renderMode = "animating",
      "animation-finish": () => this.metrics.renderMode = "static"
    };
    Object.entries(handlers).forEach(
      ([event, handler]) => this.viewer.addHandler(event, handler.bind(this))
    );
  }
  removeEventHandlers() {
    ["tile-loaded", "tile-load-failed", "animation-start", "animation-finish"].forEach((event) => this.viewer.removeAllHandlers(event));
  }
  measureFrame() {
    if (!this.isMonitoring || this.isPaused) return;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.updateFrameMetrics(deltaTime);
    this.lastTime = currentTime;
    this.frameCount++;
    this.rafId = requestAnimationFrame(() => this.measureFrame());
  }
  updateFrameMetrics(deltaTime) {
    this.frameTimes.push(deltaTime);
    this.trimArray(this.frameTimes, this.config.historySize.frameTimes);
    if (deltaTime > 0) {
      const instantFPS = 1e3 / deltaTime;
      this.fpsHistory.push(instantFPS);
      this.trimArray(this.fpsHistory, this.config.historySize.fps);
      this.metrics.currentFPS = instantFPS;
      if (deltaTime > 20) this.metrics.droppedFrames++;
    }
  }
  updateMetrics() {
    this.updateFPSMetrics();
    this.updateFrameTimeMetrics();
    this.updateViewerMetrics();
    this.updateTileMetrics();
    this.updateMemoryMetrics();
    this.calculatePerformanceScore();
    this.trackPerformanceHistory();
  }
  updateFPSMetrics() {
    if (this.fpsHistory.length === 0) return;
    this.metrics.averageFPS = Math.round(this.average(this.fpsHistory));
    this.metrics.minFPS = Math.round(Math.min(...this.fpsHistory));
    this.metrics.maxFPS = Math.round(Math.max(...this.fpsHistory));
  }
  updateFrameTimeMetrics() {
    if (this.frameTimes.length === 0) return;
    this.metrics.frameTime = this.average(this.frameTimes).toFixed(2);
    this.metrics.maxFrameTime = Math.max(...this.frameTimes).toFixed(2);
  }
  updateViewerMetrics() {
    this.metrics.zoomLevel = this.viewer.viewport.getZoom(true).toFixed(2);
    const canvas = this.viewer.drawer.canvas;
    if (canvas) {
      this.metrics.canvasSize = `${canvas.width}×${canvas.height}`;
    }
    const viewport = this.viewer.viewport;
    const bounds = viewport.getBounds();
    const homeBounds = this.viewer.world.getHomeBounds();
    const coverage = bounds.width * bounds.height / (homeBounds.width * homeBounds.height);
    this.metrics.viewportCoverage = Math.min(100, coverage * 100).toFixed(1);
  }
  updateTileMetrics() {
    var _a, _b;
    const world = this.viewer.world;
    if (world.getItemCount() === 0) return;
    const tiledImage = world.getItemAt(0);
    if (!tiledImage) return;
    this.metrics.visibleTiles = ((_a = tiledImage._tilesToDraw) == null ? void 0 : _a.length) || 0;
    if (tiledImage._tileCache) {
      const cache = tiledImage._tileCache;
      this.metrics.cachedTiles = ((_b = cache._tilesLoaded) == null ? void 0 : _b.length) || cache._imagesLoadedCount || 0;
    }
    if (window.tileOptimizer) {
      this.metrics.tilesLoading = window.tileOptimizer.getStats().loadingCount;
    }
  }
  updateMemoryMetrics() {
    if (!performance.memory) return;
    this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
    this.metrics.memoryLimit = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
  }
  calculatePerformanceScore() {
    const { fps, frameTime, memory } = this.thresholds;
    const scores = {
      fps: Math.min(100, this.metrics.averageFPS / fps.target * 100) * 0.5,
      frameTime: Math.min(100, frameTime.target / parseFloat(this.metrics.frameTime) * 100) * 0.2,
      memory: this.metrics.memoryLimit > 0 ? Math.max(0, Math.min(100, (1 - this.metrics.memoryUsage / this.metrics.memoryLimit) * 100)) * 0.2 : 20,
      droppedFrames: Math.max(0, 100 - Math.min(100, this.metrics.droppedFrames * 2)) * 0.1
    };
    this.metrics.performanceScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0));
  }
  trackPerformanceHistory() {
    this.performanceHistory.push({
      timestamp: Date.now(),
      fps: this.metrics.averageFPS,
      memory: this.metrics.memoryUsage,
      tiles: this.metrics.visibleTiles,
      score: this.metrics.performanceScore
    });
    this.trimArray(this.performanceHistory, this.config.historySize.performance);
  }
  analyzePerformance() {
    const now = Date.now();
    if (now - this.lastOptimization < this.config.optimization.cooldown) return;
    const { fps } = this.thresholds;
    const avgFPS = this.metrics.averageFPS;
    const score = this.metrics.performanceScore;
    const trend = this.getPerformanceTrend();
    const optimizations = [
      { condition: avgFPS < fps.critical || score < 30, action: this.applyCriticalOptimizations, log: "CRITICAL" },
      { condition: avgFPS < fps.poor || score < 50, action: this.applyAggressiveOptimizations, log: "Poor" },
      { condition: avgFPS < fps.good || score < 80, action: this.applyModerateOptimizations, log: "Below target" },
      {
        condition: avgFPS > fps.target && score > 90 && (trend === "improving" || trend === "stable"),
        action: this.restoreQualitySettings,
        log: null
      }
    ];
    for (const opt of optimizations) {
      if (opt.condition) {
        if (opt.log) console[opt.log === "CRITICAL" ? "error" : "warn"](
          `${opt.log} performance: Score ${score}, FPS: ${avgFPS}`
        );
        opt.action.call(this);
        this.lastOptimization = now;
        break;
      }
    }
  }
  getPerformanceTrend() {
    if (this.performanceHistory.length < 20) return "stable";
    const recent = this.performanceHistory.slice(-10);
    const older = this.performanceHistory.slice(-20, -10);
    const recentAvg = this.average(recent.map((p) => p.score));
    const olderAvg = this.average(older.map((p) => p.score));
    const diff = recentAvg - olderAvg;
    return diff > 5 ? "improving" : diff < -5 ? "declining" : "stable";
  }
  applyCriticalOptimizations() {
    Object.assign(this.viewer, {
      imageLoaderLimit: 2,
      maxImageCacheCount: 100,
      smoothTileEdgesMinZoom: Infinity,
      alwaysBlend: false,
      immediateRender: true,
      animationTime: 0.5,
      springStiffness: 10
    });
    if (window.gc) window.gc();
    console.log("Applied critical performance optimizations");
  }
  applyAggressiveOptimizations() {
    this.viewer.imageLoaderLimit = Math.max(3, this.viewer.imageLoaderLimit - 1);
    this.viewer.maxImageCacheCount = Math.max(200, this.viewer.maxImageCacheCount - 50);
    this.viewer.animationTime = Math.max(0.8, this.viewer.animationTime - 0.1);
    console.log("Applied aggressive performance optimizations");
  }
  applyModerateOptimizations() {
    if (this.viewer.imageLoaderLimit > 4) {
      this.viewer.imageLoaderLimit--;
      console.log("Applied moderate performance optimizations");
    }
  }
  restoreQualitySettings() {
    var _a;
    const config = (_a = window.performanceConfig) == null ? void 0 : _a.viewer;
    if (!config) return;
    const settings = [
      { prop: "imageLoaderLimit", delta: 1, op: "increase" },
      { prop: "maxImageCacheCount", delta: 50, op: "increase" },
      { prop: "animationTime", delta: 0.1, op: "decrease" }
    ];
    settings.forEach(({ prop, delta, op }) => {
      const current = this.viewer[prop];
      const target = config[prop];
      if (op === "increase" && current < target) {
        this.viewer[prop] = Math.min(target, current + delta);
      } else if (op === "decrease" && current > target) {
        this.viewer[prop] = Math.max(target, current - delta);
      }
    });
  }
  onTileLoaded(event) {
    var _a;
    if ((_a = event.tile) == null ? void 0 : _a.loadTime) {
      this.metrics.tileLoadTime = this.metrics.tileLoadTime * 0.9 + event.tile.loadTime * 0.1;
    }
  }
  onTileLoadFailed(event) {
    console.warn("Tile load failed:", event.tile);
  }
  trackLoadTime(loadTime) {
    this.loadTimes.push(loadTime);
    this.trimArray(this.loadTimes, this.config.historySize.loadTimes);
    this.averageLoadTime = this.average(this.loadTimes);
  }
  getMetrics() {
    const level = this.getPerformanceLevel();
    return {
      ...this.metrics,
      instantFPS: this.metrics.currentFPS,
      // Add instantFPS for real-time monitoring
      performanceLevel: level,
      trend: this.getPerformanceTrend(),
      warnings: this.getWarnings(),
      recommendations: this.getRecommendations()
    };
  }
  getPerformanceLevel() {
    const { averageFPS: fps, performanceScore: score } = this.metrics;
    const { fps: thresholds } = this.thresholds;
    const levels = [
      { name: "excellent", condition: fps >= thresholds.target && score >= 90 },
      { name: "good", condition: fps >= thresholds.good && score >= 80 },
      { name: "acceptable", condition: fps >= thresholds.acceptable && score >= 60 },
      { name: "poor", condition: fps >= thresholds.poor && score >= 40 },
      { name: "critical", condition: true }
    ];
    return levels.find((l) => l.condition).name;
  }
  getWarnings() {
    const m = this.metrics;
    const t = this.thresholds;
    const checks = [
      { condition: m.averageFPS < t.fps.poor, message: `Low FPS: ${m.averageFPS} (target: ${t.fps.target})` },
      // Only warn below 25 FPS
      { condition: m.droppedFrames > 200, message: `Dropped frames: ${m.droppedFrames}` },
      // More tolerance
      { condition: parseFloat(m.frameTime) > t.frameTime.warning, message: `High frame time: ${m.frameTime}ms` },
      { condition: m.memoryUsage > t.memory.critical, message: `High memory: ${m.memoryUsage}MB` },
      { condition: m.cachedTiles > 3e3, message: `Large cache: ${m.cachedTiles} tiles` },
      // Higher threshold
      { condition: m.tileLoadTime > 500, message: `Slow tile loading: ${Math.round(m.tileLoadTime)}ms` }
      // More tolerance
    ];
    return checks.filter((c) => c.condition).map((c) => c.message);
  }
  getRecommendations() {
    const recs = [];
    const m = this.metrics;
    const t = this.thresholds;
    if (m.averageFPS < t.fps.acceptable) {
      if (m.renderMode === "animating") recs.push("Reduce animation time for smoother transitions");
      if (m.cachedTiles > 1e3) recs.push("Clear tile cache to free memory");
      if (m.visibleTiles > 50) recs.push("Zoom in to reduce visible tiles");
    }
    if (m.memoryUsage > t.memory.warning) recs.push("Consider reloading the page to clear memory");
    if (m.tileLoadTime > 200) recs.push("Check network connection or reduce concurrent tile loads");
    return recs;
  }
  enableDebugOverlay() {
    if (this.debugOverlay) return;
    this.debugOverlay = document.createElement("div");
    this.debugOverlay.style.cssText = `
            position: fixed; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.85);
            color: white; padding: 12px; font-family: 'SF Mono', Monaco, monospace;
            font-size: 11px; border-radius: 6px; z-index: 9999; min-width: 180px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
    document.body.appendChild(this.debugOverlay);
    this.intervals.debug = setInterval(() => this.updateDebugOverlay(), this.config.intervals.debug);
  }
  updateDebugOverlay() {
    if (!this.isMonitoring || !this.debugOverlay) return;
    const m = this.getMetrics();
    const levelColors = {
      excellent: "#4CAF50",
      good: "#8BC34A",
      acceptable: "#FFC107",
      poor: "#FF9800",
      critical: "#F44336"
    };
    const fpsColor = m.currentFPS < 55 ? "#FF9800" : "#4CAF50";
    const memoryColor = m.memoryUsage > 250 ? "#FF9800" : "#4CAF50";
    this.debugOverlay.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">
                Performance Monitor
                <span style="float: right; color: ${levelColors[m.performanceLevel]};">
                    ${m.performanceScore}%
                </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>FPS:</span>
                <span style="color: ${fpsColor};">
                    ${m.currentFPS.toFixed(0)} (avg: ${m.averageFPS})
                </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Zoom:</span>
                <span>${m.zoomLevel}x</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Memory:</span>
                <span style="color: ${memoryColor};">
                    ${m.memoryUsage}MB
                </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Status:</span>
                <span style="color: ${levelColors[m.performanceLevel]}; font-weight: 500;">
                    ${m.performanceLevel}
                </span>
            </div>
        `;
  }
  disableDebugOverlay() {
    if (this.debugOverlay) {
      this.debugOverlay.remove();
      this.debugOverlay = null;
    }
    if (this.intervals.debug) {
      clearInterval(this.intervals.debug);
      delete this.intervals.debug;
    }
  }
  // Utility methods
  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  trimArray(arr, maxLength) {
    while (arr.length > maxLength) arr.shift();
  }
}
class RenderOptimizer {
  constructor(viewer) {
    this.viewer = viewer;
    this.state = {
      isZoomingActive: false,
      lastBlendTime: null,
      lastStiffness: null,
      isAnimating: false,
      isZooming: false,
      isPanning: false,
      renderMode: "static",
      consecutiveStaticFrames: 0,
      canvasOptimized: false,
      lastFrameTime: performance.now(),
      isCinematicZoom: false,
      frameSkipCount: 0
    };
    this.lastInteraction = Date.now();
    this.lastZoomLevel = null;
    this.lastCenter = null;
    this.lastOptimizationTime = 0;
    this.zoomStartLevel = null;
    this.zoomVelocity = 0;
    this.config = {
      animationEndDelay: 80,
      // Slightly longer for stability
      pixelPerfectDelay: 50,
      zoomThreshold: 5e-3,
      // Less sensitive to avoid flickering
      panThreshold: 5e-3,
      smoothTransitionDuration: 150,
      staticFramesBeforeOptimize: 5,
      optimizationCooldown: 100,
      forceGPU: true,
      frameSkipThreshold: 33,
      // Only skip if > 33ms (30 FPS)
      zoomVelocityThreshold: 0.03
    };
    this.timers = {};
    this.setupEventHandlers();
    this.applyInitialOptimizations();
    this.setupAggressiveZoomOptimization();
    window.renderOptimizer = this;
  }
  setupEventHandlers() {
    const handlers = {
      "animation-start": () => this.handleAnimationStart(),
      "animation-finish": () => this.handleAnimationFinish(),
      "animation": () => this.handleAnimation(),
      "viewport-change": () => this.handleViewportChange(),
      "canvas-press": () => this.handleInteraction("press"),
      "canvas-drag": () => this.handleInteraction("drag"),
      "canvas-drag-end": () => this.handleInteraction("drag-end"),
      "canvas-scroll": () => this.handleInteraction("scroll"),
      "canvas-pinch": () => this.handleInteraction("pinch")
    };
    Object.entries(handlers).forEach(
      ([event, handler]) => this.viewer.addHandler(event, handler)
    );
  }
  applyInitialOptimizations() {
    const container = this.viewer.container;
    if (container) {
      Object.assign(container.style, {
        transform: "translateZ(0)",
        willChange: "transform",
        backfaceVisibility: "hidden",
        perspective: "1000px"
      });
    }
    setTimeout(() => this.applyCanvasOptimizations(), 100);
  }
  handleAnimationStart() {
    this.clearTimers();
    this.state.isAnimating = true;
    this.state.consecutiveStaticFrames = 0;
    this.setRenderMode("animation");
  }
  handleAnimationFinish() {
    this.state.isAnimating = false;
    this.timers.animationEnd = setTimeout(() => {
      if (!this.isCurrentlyAnimating()) {
        this.setRenderMode("static");
      }
    }, this.config.animationEndDelay);
  }
  handleAnimation() {
    const now = performance.now();
    const frameTime = now - this.state.lastFrameTime;
    this.state.lastFrameTime = now;
    const zoom = this.viewer.viewport.getZoom();
    if (zoom < 3 && frameTime > 20 && this.state.isZooming) {
      this.state.frameSkipCount++;
      if (this.state.frameSkipCount % 2 === 0) {
        return;
      }
    } else {
      this.state.frameSkipCount = 0;
    }
    const timeSinceInteraction = Date.now() - this.lastInteraction;
    if (timeSinceInteraction > 100 && !this.isCurrentlyAnimating()) {
      this.state.consecutiveStaticFrames++;
      if (this.state.consecutiveStaticFrames >= this.config.staticFramesBeforeOptimize) {
        this.setRenderMode("static");
      }
    } else {
      this.state.consecutiveStaticFrames = 0;
    }
  }
  setupAggressiveZoomOptimization() {
    let zoomDebounceTimer = null;
    let isActivelyZooming = false;
    this.viewer.addHandler("zoom", () => {
      if (!isActivelyZooming) {
        isActivelyZooming = true;
        if (this.viewer.drawer && this.viewer.drawer.context) {
          const ctx = this.viewer.drawer.context;
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = 1;
        }
        this.viewer.skipTileDrawing = true;
      }
      if (zoomDebounceTimer) {
        clearTimeout(zoomDebounceTimer);
      }
      zoomDebounceTimer = setTimeout(() => {
        isActivelyZooming = false;
        if (this.viewer.drawer && this.viewer.drawer.context) {
          const ctx = this.viewer.drawer.context;
          ctx.imageSmoothingEnabled = true;
          ctx.globalAlpha = 1;
        }
        this.viewer.skipTileDrawing = false;
        this.viewer.forceRedraw();
        zoomDebounceTimer = null;
      }, 150);
    });
  }
  handleViewportChange() {
    const currentZoom = this.viewer.viewport.getZoom(true);
    const currentCenter = this.viewer.viewport.getCenter(true);
    if (this.lastZoomLevel !== null) {
      const zoomDelta = Math.abs(currentZoom - this.lastZoomLevel);
      this.zoomVelocity = this.zoomVelocity * 0.7 + zoomDelta * 0.3;
      this.state.isZooming = zoomDelta > this.config.zoomThreshold || this.zoomVelocity > this.config.zoomVelocityThreshold;
      this.applyZoomOptimizations(this.state.isZooming);
      if (this.state.isZooming) {
        this.lastInteraction = Date.now();
        if (!this.zoomStartLevel) {
          this.zoomStartLevel = this.lastZoomLevel;
        }
      } else if (this.zoomStartLevel) {
        this.zoomStartLevel = null;
        this.scheduleStaticMode();
      }
    }
    if (this.lastCenter !== null) {
      const panDelta = Math.sqrt(
        Math.pow(currentCenter.x - this.lastCenter.x, 2) + Math.pow(currentCenter.y - this.lastCenter.y, 2)
      );
      this.state.isPanning = panDelta > this.config.panThreshold;
      if (this.state.isPanning) {
        this.lastInteraction = Date.now();
      }
    }
    this.lastZoomLevel = currentZoom;
    this.lastCenter = currentCenter;
  }
  applyZoomOptimizations(isZooming) {
    var _a, _b;
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return;
    }
    const config = (_b = (_a = window.performanceConfig) == null ? void 0 : _a.renderOptimization) == null ? void 0 : _b.zoomOptimizations;
    if (!config) return;
    if (isZooming && !this.state.isZoomingActive) {
      this.state.isZoomingActive = true;
      if (this.viewer.world.getItemCount() > 0) {
        const tiledImage = this.viewer.world.getItemAt(0);
        if (tiledImage) {
          this.state.lastBlendTime = 0;
          tiledImage.blendTime = 0;
        }
      }
      this.state.lastStiffness = this.viewer.viewport.zoomSpring.springStiffness;
      this.viewer.viewport.zoomSpring.springStiffness = 10;
      this.viewer.viewport.centerSpringX.springStiffness = 10;
      this.viewer.viewport.centerSpringY.springStiffness = 10;
      this.viewer.immediateRender = true;
      if (window.tileCleanupManager) {
        window.tileCleanupManager.pauseCleanup(2e3);
      }
    } else if (!isZooming && this.state.isZoomingActive) {
      this.state.isZoomingActive = false;
      if (this.viewer.world.getItemCount() > 0) {
        const tiledImage = this.viewer.world.getItemAt(0);
        if (tiledImage) {
          tiledImage.blendTime = 0;
        }
      }
      if (this.state.lastStiffness !== null) {
        this.viewer.viewport.zoomSpring.springStiffness = this.state.lastStiffness;
        this.viewer.viewport.centerSpringX.springStiffness = this.state.lastStiffness;
        this.viewer.viewport.centerSpringY.springStiffness = this.state.lastStiffness;
      }
      this.viewer.immediateRender = false;
    }
  }
  handleInteraction(type) {
    var _a;
    this.lastInteraction = Date.now();
    const actions = {
      "press": () => this.setRenderMode("animation"),
      "drag": () => {
        this.state.isPanning = true;
        this.setRenderMode("animation");
      },
      "drag-end": () => {
        this.state.isPanning = false;
        this.scheduleStaticMode();
      },
      "scroll": () => {
        this.state.isZooming = true;
        this.setRenderMode("animation");
      },
      "pinch": () => {
        this.state.isZooming = true;
        this.setRenderMode("animation");
      }
    };
    (_a = actions[type]) == null ? void 0 : _a.call(actions);
  }
  setRenderMode(mode) {
    var _a, _b;
    if (this.state.renderMode === mode) return;
    const previousMode = this.state.renderMode;
    this.state.renderMode = mode;
    if (mode === "animation") {
      this.removeCanvasOptimizations();
      this.disablePixelPerfect();
    } else if (mode === "static") {
      requestAnimationFrame(() => {
        this.applyCanvasOptimizations();
        this.enablePixelPerfect();
      });
    }
    if ((_b = (_a = window.performanceConfig) == null ? void 0 : _a.debug) == null ? void 0 : _b.logPerformance) {
      console.log(`Render mode: ${previousMode} → ${mode}`);
    }
  }
  scheduleStaticMode() {
    this.clearTimers();
    this.timers.interaction = setTimeout(() => {
      if (!this.isCurrentlyAnimating()) {
        this.setRenderMode("static");
      }
    }, this.config.animationEndDelay);
  }
  applyCanvasOptimizations() {
    var _a, _b;
    const now = Date.now();
    if (now - this.lastOptimizationTime < this.config.optimizationCooldown) return;
    const canvas = (_a = this.viewer.drawer) == null ? void 0 : _a.canvas;
    const context = (_b = this.viewer.drawer) == null ? void 0 : _b.context;
    if (!canvas || !context) return;
    Object.assign(canvas.style, {
      transform: "translateZ(0)",
      willChange: "transform",
      backfaceVisibility: "hidden"
    });
    this.setContextSmoothing(context, true);
    context.imageSmoothingQuality = "high";
    this.state.canvasOptimized = true;
    this.lastOptimizationTime = now;
  }
  removeCanvasOptimizations() {
    var _a;
    const context = (_a = this.viewer.drawer) == null ? void 0 : _a.context;
    if (!context) return;
    this.setContextSmoothing(context, true);
    context.imageSmoothingQuality = "medium";
    this.state.canvasOptimized = false;
  }
  setContextSmoothing(context, enabled) {
    const props = [
      "imageSmoothingEnabled",
      "msImageSmoothingEnabled",
      "webkitImageSmoothingEnabled",
      "mozImageSmoothingEnabled"
    ];
    props.forEach((prop) => {
      if (prop in context) context[prop] = enabled;
    });
  }
  clearTimers() {
    Object.entries(this.timers).forEach(([key, timer]) => {
      clearTimeout(timer);
      delete this.timers[key];
    });
  }
  disablePixelPerfect() {
    this.applyTileStyles({
      imageRendering: "auto",
      filter: "none",
      transform: "translateZ(0)"
    });
  }
  enablePixelPerfect() {
    if (this.state.renderMode !== "static") return;
    requestAnimationFrame(() => {
      this.applyTileStyles({
        imageRendering: "auto",
        // Let browser decide
        transform: "translateZ(0)",
        willChange: "auto",
        backfaceVisibility: "hidden"
      });
    });
  }
  applyTileStyles(styles) {
    const tiles = this.viewer.container.querySelectorAll(".openseadragon-tile");
    tiles.forEach((tile) => Object.assign(tile.style, styles));
  }
  isCurrentlyAnimating() {
    return this.state.isAnimating || this.state.isZooming || this.state.isPanning;
  }
  getRenderMode() {
    return this.state.renderMode;
  }
  getStatus() {
    return {
      ...this.state,
      timeSinceInteraction: Date.now() - this.lastInteraction,
      zoomVelocity: this.zoomVelocity.toFixed(4),
      isOptimized: this.state.canvasOptimized
    };
  }
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }
  startCinematicZoom() {
    const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile2) {
      console.log("Skipping ALL cinematic zoom optimizations on mobile");
      this.state.isCinematicZoom = false;
      return;
    }
    this.state.isCinematicZoom = true;
    this.cinematicBackup = {
      immediateRender: this.viewer.immediateRender,
      maxTilesPerFrame: this.viewer.maxTilesPerFrame,
      smoothTileEdges: this.viewer.smoothTileEdgesMinZoom,
      preserveViewport: this.viewer.preserveViewport
    };
    this.viewer.immediateRender = true;
    this.viewer.maxTilesPerFrame = 2;
    this.viewer.smoothTileEdgesMinZoom = Infinity;
    this.viewer.preserveViewport = true;
    if (this.viewer.imageLoader) {
      this.viewer.imageLoader.jobLimit = 1;
    }
    if (window.canvasOverlayManager) {
      window.canvasOverlayManager.prepareForZoom();
    }
    console.log("Cinematic zoom optimization started");
  }
  endCinematicZoom() {
    var _a, _b;
    if (!this.state.isCinematicZoom) return;
    this.state.isCinematicZoom = false;
    if (this.cinematicBackup) {
      this.viewer.immediateRender = this.cinematicBackup.immediateRender;
      this.viewer.maxTilesPerFrame = this.cinematicBackup.maxTilesPerFrame;
      this.viewer.smoothTileEdgesMinZoom = this.cinematicBackup.smoothTileEdges;
      if (this.viewer.imageLoader) {
        this.viewer.imageLoader.jobLimit = ((_b = (_a = window.performanceConfig) == null ? void 0 : _a.viewer) == null ? void 0 : _b.imageLoaderLimit) || 6;
      }
    }
    this.viewer.forceRedraw();
    if (window.canvasOverlayManager) {
      window.canvasOverlayManager.endZoom();
    }
    console.log("Cinematic zoom optimization ended");
  }
  destroy() {
    this.clearTimers();
    [
      "animation-start",
      "animation-finish",
      "animation",
      "viewport-change",
      "canvas-press",
      "canvas-drag",
      "canvas-drag-end",
      "canvas-scroll",
      "canvas-pinch"
    ].forEach((event) => this.viewer.removeAllHandlers(event));
    this.removeCanvasOptimizations();
    this.viewer = null;
  }
}
class SafariPerformanceOptimizer {
  constructor(viewer) {
    this.viewer = viewer;
    this.isInteracting = false;
    this.highQualityTimeout = null;
    this.basePixelRatio = window.devicePixelRatio || 1;
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    this.lastInteractionStart = 0;
    this.interactionCount = 0;
    this.averageFPS = 60;
    this.lastPosition = null;
    this.velocity = 0;
    this.velocityBuffer = [];
    this.velocityCheckInterval = null;
    this.scalingFactor = this.isIOS ? 0.5 : 0.35;
    this.restoreDelay = this.isIOS ? 300 : 300;
    console.log("SafariPerformanceOptimizer initialized:", {
      isSafari: this.isSafari,
      isIOS: this.isIOS,
      basePixelRatio: this.basePixelRatio,
      scalingFactor: this.scalingFactor
    });
    if (this.isSafari) {
      this.setupEventHandlers();
      this.applyInitialOptimizations();
    }
  }
  setupEventHandlers() {
    let interactionDebounce = null;
    const debouncedStart = () => {
      if (interactionDebounce) clearTimeout(interactionDebounce);
      interactionDebounce = setTimeout(() => {
        this.startInteraction();
      }, 16);
    };
    this.viewer.addHandler("animation-start", debouncedStart);
    this.viewer.addHandler("pan", debouncedStart);
    this.viewer.addHandler("zoom", debouncedStart);
    if (this.isIOS) {
      this.viewer.addHandler("canvas-pinch", debouncedStart);
    }
    this.viewer.addHandler("animation-finish", () => this.endInteraction());
    const canvas = this.viewer.canvas;
    if (canvas) {
      canvas.addEventListener("touchstart", debouncedStart, { passive: true });
      canvas.addEventListener("mousedown", debouncedStart, { passive: true });
    }
  }
  applyInitialOptimizations() {
    if (this.viewer.drawer && this.viewer.drawer.canvas) {
      const canvas = this.viewer.drawer.canvas;
      if (this.isIOS) {
        const viewportSize = this.viewer.viewport.getContainerSize();
        const pixelRatio = this.viewer.drawer.pixelRatio || this.basePixelRatio;
        canvas.width = Math.floor(viewportSize.x * pixelRatio);
        canvas.height = Math.floor(viewportSize.y * pixelRatio);
        console.log("iOS Canvas Fix: Initial dimensions floored to prevent oversizing", {
          width: canvas.width,
          height: canvas.height,
          pixelRatio,
          originalWidth: viewportSize.x * pixelRatio,
          originalHeight: viewportSize.y * pixelRatio
        });
      }
      canvas.style.transform = "translateZ(0)";
      canvas.style.willChange = "transform";
      canvas.style.backfaceVisibility = "hidden";
      canvas.style.webkitBackfaceVisibility = "hidden";
      canvas.style.outline = "none";
    }
    if (this.viewer.drawer && this.viewer.drawer.context) {
      const ctx = this.viewer.drawer.context;
      ctx.imageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
    }
  }
  startInteraction() {
    var _a;
    if (!this.isSafari || this.isInteracting) return;
    this.isInteracting = true;
    this.lastInteractionStart = performance.now();
    this.interactionCount++;
    this.velocityBuffer = [];
    this.lastPosition = null;
    if (this.velocityCheckInterval) {
      clearInterval(this.velocityCheckInterval);
    }
    this.velocityCheckInterval = setInterval(() => {
      this.updateVelocity();
    }, 16);
    clearTimeout(this.highQualityTimeout);
    if (!this.originalPixelRatio && this.viewer.drawer) {
      this.originalPixelRatio = this.viewer.drawer.pixelRatio || this.basePixelRatio;
    }
    const reducedRatio = this.originalPixelRatio * this.scalingFactor;
    console.log("Safari: Reducing render quality for interaction", {
      from: this.originalPixelRatio,
      to: reducedRatio,
      scalingFactor: this.scalingFactor
    });
    if (this.viewer.drawer) {
      this.viewer.drawer.pixelRatio = reducedRatio;
      if (this.viewer.drawer.canvas) {
        const viewportSize = this.viewer.viewport.getContainerSize();
        this.viewer.drawer.canvas.width = Math.floor(viewportSize.x * reducedRatio);
        this.viewer.drawer.canvas.height = Math.floor(viewportSize.y * reducedRatio);
      }
    }
    if (this.viewer.drawer) {
      if (this.viewer.drawer.context) {
        this.viewer.drawer.context.imageSmoothingEnabled = false;
        this.viewer.drawer.context.webkitImageSmoothingEnabled = false;
      }
      this.viewer.immediateRender = true;
      this.viewer.blendTime = 0;
      this.viewer.alwaysBlend = false;
      this.originalSettings = {
        immediateRender: this.viewer.immediateRender,
        blendTime: this.viewer.blendTime,
        alwaysBlend: this.viewer.alwaysBlend,
        imageLoaderLimit: (_a = this.viewer.imageLoader) == null ? void 0 : _a.jobLimit
      };
    }
    if (this.viewer.imageLoader) {
      this.viewer.imageLoader.jobLimit = 1;
    }
    if (this.viewer.world) {
      const tiledImage = this.viewer.world.getItemAt(0);
      if (tiledImage) {
        tiledImage.skipLevelIfLargerThan = 0.9;
      }
    }
    if (this.averageFPS < 15 && this.scalingFactor <= 0.2) {
      console.log("Safari: ULTRA PERFORMANCE MODE activated");
      this.viewer.minPixelRatio = 2;
      this.viewer.maxTilesPerFrame = 1;
      this.viewer.visibilityRatio = 1;
      if (window.nativeHotspotRenderer) {
        window.nativeHotspotRenderer.performanceMode = true;
      }
    }
    if (this.viewer.tileCache) {
      const cache = this.viewer.tileCache;
      this.originalCacheSize = cache._maxImageCacheCount;
      cache._maxImageCacheCount = Math.floor(this.originalCacheSize * 0.3);
    }
    this.viewer.forceRedraw();
  }
  endInteraction() {
    if (!this.isSafari || !this.isInteracting) return;
    this.isInteracting = false;
    if (this.velocityCheckInterval) {
      clearInterval(this.velocityCheckInterval);
      this.velocityCheckInterval = null;
    }
    const duration = performance.now() - this.lastInteractionStart;
    console.log(`Safari: Interaction ended (duration: ${duration.toFixed(0)}ms)`);
    this.highQualityTimeout = setTimeout(() => {
      const restoreRatio = this.originalPixelRatio || this.basePixelRatio;
      console.log("Safari: Restoring full render quality", {
        to: restoreRatio
      });
      if (this.viewer.drawer) {
        this.viewer.drawer.pixelRatio = restoreRatio;
        if (this.viewer.drawer.canvas) {
          const viewportSize = this.viewer.viewport.getContainerSize();
          this.viewer.drawer.canvas.width = Math.floor(viewportSize.x * restoreRatio);
          this.viewer.drawer.canvas.height = Math.floor(viewportSize.y * restoreRatio);
        }
      }
      if (this.originalSettings) {
        this.viewer.immediateRender = this.originalSettings.immediateRender !== void 0 ? this.originalSettings.immediateRender : false;
        this.viewer.blendTime = this.originalSettings.blendTime !== void 0 ? this.originalSettings.blendTime : 0.5;
        this.viewer.alwaysBlend = this.originalSettings.alwaysBlend !== void 0 ? this.originalSettings.alwaysBlend : false;
        if (this.viewer.imageLoader && this.originalSettings.imageLoaderLimit) {
          this.viewer.imageLoader.jobLimit = this.originalSettings.imageLoaderLimit;
        }
      }
      if (this.viewer.drawer && this.viewer.drawer.context) {
        this.viewer.drawer.context.imageSmoothingEnabled = true;
        this.viewer.drawer.context.webkitImageSmoothingEnabled = true;
      }
      if (this.viewer.world) {
        const tiledImage = this.viewer.world.getItemAt(0);
        if (tiledImage) {
          tiledImage.skipLevelIfLargerThan = Infinity;
        }
      }
      if (this.viewer.tileCache && this.originalCacheSize) {
        this.viewer.tileCache._maxImageCacheCount = this.originalCacheSize;
      }
      this.viewer.forceRedraw();
    }, this.restoreDelay);
  }
  /**
   * Calculate velocity and adjust quality based on movement speed
   */
  updateVelocity() {
    if (!this.viewer.viewport) return;
    const currentPosition = this.viewer.viewport.getCenter();
    if (this.lastPosition) {
      const deltaX = currentPosition.x - this.lastPosition.x;
      const deltaY = currentPosition.y - this.lastPosition.y;
      const frameVelocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 1e3;
      this.velocityBuffer.push(frameVelocity);
      if (this.velocityBuffer.length > 3) {
        this.velocityBuffer.shift();
      }
      this.velocity = this.velocityBuffer.reduce((a, b) => a + b, 0) / this.velocityBuffer.length;
      let targetScaling;
      if (this.velocity > 10) {
        targetScaling = 0.5;
      } else if (this.velocity > 5) {
        targetScaling = 0.65;
      } else if (this.velocity > 2) {
        targetScaling = 0.75;
      } else {
        targetScaling = 0.85;
      }
      this.scalingFactor = this.scalingFactor * 0.7 + targetScaling * 0.3;
      if (this.isInteracting && this.viewer.drawer) {
        const newPixelRatio = (this.originalPixelRatio || this.basePixelRatio) * this.scalingFactor;
        if (Math.abs(this.viewer.drawer.pixelRatio - newPixelRatio) > 0.05) {
          this.viewer.drawer.pixelRatio = newPixelRatio;
          if (this.viewer.drawer.canvas) {
            const viewportSize = this.viewer.viewport.getContainerSize();
            this.viewer.drawer.canvas.width = Math.floor(viewportSize.x * newPixelRatio);
            this.viewer.drawer.canvas.height = Math.floor(viewportSize.y * newPixelRatio);
          }
        }
      }
    }
    this.lastPosition = currentPosition;
  }
  /**
   * Dynamically adjust scaling factor based on performance
   */
  updatePerformanceMetrics(currentFPS, isInteracting = false) {
    this.averageFPS = this.averageFPS * 0.9 + currentFPS * 0.1;
    if (this.averageFPS < 20 && this.scalingFactor > 0.4) {
      this.scalingFactor = 0.4;
      if (isInteracting) {
        console.log(`Safari: EMERGENCY - Reduced scaling factor to ${this.scalingFactor} due to very low FPS`);
      }
    } else if (this.averageFPS < 30 && this.scalingFactor > 0.4) {
      this.scalingFactor = Math.max(0.4, this.scalingFactor - 0.1);
      if (isInteracting) {
        console.log(`Safari: Reduced scaling factor to ${this.scalingFactor} due to low FPS`);
      }
    } else if (this.averageFPS > 50 && this.scalingFactor < 0.75) {
      this.scalingFactor = Math.min(0.75, this.scalingFactor + 0.05);
      if (isInteracting) {
        console.log(`Safari: Increased scaling factor to ${this.scalingFactor} due to good FPS`);
      }
    }
  }
  /**
   * Force optimization (for testing)
   */
  forceOptimization(enable) {
    if (enable) {
      this.startInteraction();
      clearTimeout(this.highQualityTimeout);
    } else {
      this.isInteracting = false;
      this.endInteraction();
    }
  }
  /**
   * Get current optimization state
   */
  getState() {
    const currentPixelRatio = this.viewer.drawer ? this.viewer.drawer.pixelRatio : this.basePixelRatio;
    return {
      isActive: this.isSafari,
      isInteracting: this.isInteracting,
      currentPixelRatio,
      basePixelRatio: this.basePixelRatio,
      scalingFactor: this.scalingFactor,
      averageFPS: this.averageFPS.toFixed(1),
      platform: this.isIOS ? "iOS Safari" : "Desktop Safari"
    };
  }
  /**
   * Cleanup
   */
  destroy() {
    clearTimeout(this.highQualityTimeout);
    if (this.velocityCheckInterval) {
      clearInterval(this.velocityCheckInterval);
    }
  }
}
class FlatQueue {
  constructor() {
    this.ids = [];
    this.values = [];
    this.length = 0;
  }
  clear() {
    this.length = 0;
  }
  push(id, value) {
    let pos = this.length++;
    while (pos > 0) {
      const parent = pos - 1 >> 1;
      const parentValue = this.values[parent];
      if (value >= parentValue) break;
      this.ids[pos] = this.ids[parent];
      this.values[pos] = parentValue;
      pos = parent;
    }
    this.ids[pos] = id;
    this.values[pos] = value;
  }
  pop() {
    if (this.length === 0) return void 0;
    const top = this.ids[0];
    this.length--;
    if (this.length > 0) {
      const id = this.ids[0] = this.ids[this.length];
      const value = this.values[0] = this.values[this.length];
      const halfLength = this.length >> 1;
      let pos = 0;
      while (pos < halfLength) {
        let left = (pos << 1) + 1;
        const right = left + 1;
        let bestIndex = this.ids[left];
        let bestValue = this.values[left];
        const rightValue = this.values[right];
        if (right < this.length && rightValue < bestValue) {
          left = right;
          bestIndex = this.ids[right];
          bestValue = rightValue;
        }
        if (bestValue >= value) break;
        this.ids[pos] = bestIndex;
        this.values[pos] = bestValue;
        pos = left;
      }
      this.ids[pos] = id;
      this.values[pos] = value;
    }
    return top;
  }
  peek() {
    if (this.length === 0) return void 0;
    return this.ids[0];
  }
  peekValue() {
    if (this.length === 0) return void 0;
    return this.values[0];
  }
  shrink() {
    this.ids.length = this.values.length = this.length;
  }
}
const ARRAY_TYPES = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
const VERSION = 3;
class Flatbush {
  /**
   * Recreate a Flatbush index from raw `ArrayBuffer` or `SharedArrayBuffer` data.
   * @param {ArrayBufferLike} data
   * @param {number} [byteOffset=0] byte offset to the start of the Flatbush buffer in the referenced ArrayBuffer.
   * @returns {Flatbush} index
   */
  static from(data, byteOffset = 0) {
    if (byteOffset % 8 !== 0) {
      throw new Error("byteOffset must be 8-byte aligned.");
    }
    if (!data || data.byteLength === void 0 || data.buffer) {
      throw new Error("Data must be an instance of ArrayBuffer or SharedArrayBuffer.");
    }
    const [magic, versionAndType] = new Uint8Array(data, byteOffset + 0, 2);
    if (magic !== 251) {
      throw new Error("Data does not appear to be in a Flatbush format.");
    }
    const version = versionAndType >> 4;
    if (version !== VERSION) {
      throw new Error(`Got v${version} data when expected v${VERSION}.`);
    }
    const ArrayType = ARRAY_TYPES[versionAndType & 15];
    if (!ArrayType) {
      throw new Error("Unrecognized array type.");
    }
    const [nodeSize] = new Uint16Array(data, byteOffset + 2, 1);
    const [numItems] = new Uint32Array(data, byteOffset + 4, 1);
    return new Flatbush(numItems, nodeSize, ArrayType, void 0, data, byteOffset);
  }
  /**
   * Create a Flatbush index that will hold a given number of items.
   * @param {number} numItems
   * @param {number} [nodeSize=16] Size of the tree node (16 by default).
   * @param {TypedArrayConstructor} [ArrayType=Float64Array] The array type used for coordinates storage (`Float64Array` by default).
   * @param {ArrayBufferConstructor | SharedArrayBufferConstructor} [ArrayBufferType=ArrayBuffer] The array buffer type used to store data (`ArrayBuffer` by default).
   * @param {ArrayBufferLike} [data] (Only used internally)
   * @param {number} [byteOffset=0] (Only used internally)
   */
  constructor(numItems, nodeSize = 16, ArrayType = Float64Array, ArrayBufferType = ArrayBuffer, data, byteOffset = 0) {
    if (numItems === void 0) throw new Error("Missing required argument: numItems.");
    if (isNaN(numItems) || numItems <= 0) throw new Error(`Unexpected numItems value: ${numItems}.`);
    this.numItems = +numItems;
    this.nodeSize = Math.min(Math.max(+nodeSize, 2), 65535);
    this.byteOffset = byteOffset;
    let n = numItems;
    let numNodes = n;
    this._levelBounds = [n * 4];
    do {
      n = Math.ceil(n / this.nodeSize);
      numNodes += n;
      this._levelBounds.push(numNodes * 4);
    } while (n !== 1);
    this.ArrayType = ArrayType;
    this.IndexArrayType = numNodes < 16384 ? Uint16Array : Uint32Array;
    const arrayTypeIndex = ARRAY_TYPES.indexOf(ArrayType);
    const nodesByteSize = numNodes * 4 * ArrayType.BYTES_PER_ELEMENT;
    if (arrayTypeIndex < 0) {
      throw new Error(`Unexpected typed array class: ${ArrayType}.`);
    }
    if (data) {
      this.data = data;
      this._boxes = new ArrayType(data, byteOffset + 8, numNodes * 4);
      this._indices = new this.IndexArrayType(data, byteOffset + 8 + nodesByteSize, numNodes);
      this._pos = numNodes * 4;
      this.minX = this._boxes[this._pos - 4];
      this.minY = this._boxes[this._pos - 3];
      this.maxX = this._boxes[this._pos - 2];
      this.maxY = this._boxes[this._pos - 1];
    } else {
      const data2 = this.data = new ArrayBufferType(8 + nodesByteSize + numNodes * this.IndexArrayType.BYTES_PER_ELEMENT);
      this._boxes = new ArrayType(data2, 8, numNodes * 4);
      this._indices = new this.IndexArrayType(data2, 8 + nodesByteSize, numNodes);
      this._pos = 0;
      this.minX = Infinity;
      this.minY = Infinity;
      this.maxX = -Infinity;
      this.maxY = -Infinity;
      new Uint8Array(data2, 0, 2).set([251, (VERSION << 4) + arrayTypeIndex]);
      new Uint16Array(data2, 2, 1)[0] = nodeSize;
      new Uint32Array(data2, 4, 1)[0] = numItems;
    }
    this._queue = new FlatQueue();
  }
  /**
   * Add a given rectangle to the index.
   * @param {number} minX
   * @param {number} minY
   * @param {number} maxX
   * @param {number} maxY
   * @returns {number} A zero-based, incremental number that represents the newly added rectangle.
   */
  add(minX, minY, maxX = minX, maxY = minY) {
    const index = this._pos >> 2;
    const boxes = this._boxes;
    this._indices[index] = index;
    boxes[this._pos++] = minX;
    boxes[this._pos++] = minY;
    boxes[this._pos++] = maxX;
    boxes[this._pos++] = maxY;
    if (minX < this.minX) this.minX = minX;
    if (minY < this.minY) this.minY = minY;
    if (maxX > this.maxX) this.maxX = maxX;
    if (maxY > this.maxY) this.maxY = maxY;
    return index;
  }
  /** Perform indexing of the added rectangles. */
  finish() {
    if (this._pos >> 2 !== this.numItems) {
      throw new Error(`Added ${this._pos >> 2} items when expected ${this.numItems}.`);
    }
    const boxes = this._boxes;
    if (this.numItems <= this.nodeSize) {
      boxes[this._pos++] = this.minX;
      boxes[this._pos++] = this.minY;
      boxes[this._pos++] = this.maxX;
      boxes[this._pos++] = this.maxY;
      return;
    }
    const width = this.maxX - this.minX || 1;
    const height = this.maxY - this.minY || 1;
    const hilbertValues = new Uint32Array(this.numItems);
    const hilbertMax = (1 << 16) - 1;
    for (let i = 0, pos = 0; i < this.numItems; i++) {
      const minX = boxes[pos++];
      const minY = boxes[pos++];
      const maxX = boxes[pos++];
      const maxY = boxes[pos++];
      const x = Math.floor(hilbertMax * ((minX + maxX) / 2 - this.minX) / width);
      const y = Math.floor(hilbertMax * ((minY + maxY) / 2 - this.minY) / height);
      hilbertValues[i] = hilbert(x, y);
    }
    sort(hilbertValues, boxes, this._indices, 0, this.numItems - 1, this.nodeSize);
    for (let i = 0, pos = 0; i < this._levelBounds.length - 1; i++) {
      const end = this._levelBounds[i];
      while (pos < end) {
        const nodeIndex = pos;
        let nodeMinX = boxes[pos++];
        let nodeMinY = boxes[pos++];
        let nodeMaxX = boxes[pos++];
        let nodeMaxY = boxes[pos++];
        for (let j = 1; j < this.nodeSize && pos < end; j++) {
          nodeMinX = Math.min(nodeMinX, boxes[pos++]);
          nodeMinY = Math.min(nodeMinY, boxes[pos++]);
          nodeMaxX = Math.max(nodeMaxX, boxes[pos++]);
          nodeMaxY = Math.max(nodeMaxY, boxes[pos++]);
        }
        this._indices[this._pos >> 2] = nodeIndex;
        boxes[this._pos++] = nodeMinX;
        boxes[this._pos++] = nodeMinY;
        boxes[this._pos++] = nodeMaxX;
        boxes[this._pos++] = nodeMaxY;
      }
    }
  }
  /**
   * Search the index by a bounding box.
   * @param {number} minX
   * @param {number} minY
   * @param {number} maxX
   * @param {number} maxY
   * @param {(index: number) => boolean} [filterFn] An optional function for filtering the results.
   * @returns {number[]} An array of indices of items intersecting or touching the given bounding box.
   */
  search(minX, minY, maxX, maxY, filterFn) {
    if (this._pos !== this._boxes.length) {
      throw new Error("Data not yet indexed - call index.finish().");
    }
    let nodeIndex = this._boxes.length - 4;
    const queue = [];
    const results = [];
    while (nodeIndex !== void 0) {
      const end = Math.min(nodeIndex + this.nodeSize * 4, upperBound(nodeIndex, this._levelBounds));
      for (let pos = nodeIndex; pos < end; pos += 4) {
        if (maxX < this._boxes[pos]) continue;
        if (maxY < this._boxes[pos + 1]) continue;
        if (minX > this._boxes[pos + 2]) continue;
        if (minY > this._boxes[pos + 3]) continue;
        const index = this._indices[pos >> 2] | 0;
        if (nodeIndex >= this.numItems * 4) {
          queue.push(index);
        } else if (filterFn === void 0 || filterFn(index)) {
          results.push(index);
        }
      }
      nodeIndex = queue.pop();
    }
    return results;
  }
  /**
   * Search items in order of distance from the given point.
   * @param {number} x
   * @param {number} y
   * @param {number} [maxResults=Infinity]
   * @param {number} [maxDistance=Infinity]
   * @param {(index: number) => boolean} [filterFn] An optional function for filtering the results.
   * @returns {number[]} An array of indices of items found.
   */
  neighbors(x, y, maxResults = Infinity, maxDistance = Infinity, filterFn) {
    if (this._pos !== this._boxes.length) {
      throw new Error("Data not yet indexed - call index.finish().");
    }
    let nodeIndex = this._boxes.length - 4;
    const q = this._queue;
    const results = [];
    const maxDistSquared = maxDistance * maxDistance;
    outer: while (nodeIndex !== void 0) {
      const end = Math.min(nodeIndex + this.nodeSize * 4, upperBound(nodeIndex, this._levelBounds));
      for (let pos = nodeIndex; pos < end; pos += 4) {
        const index = this._indices[pos >> 2] | 0;
        const minX = this._boxes[pos];
        const minY = this._boxes[pos + 1];
        const maxX = this._boxes[pos + 2];
        const maxY = this._boxes[pos + 3];
        const dx = x < minX ? minX - x : x > maxX ? x - maxX : 0;
        const dy = y < minY ? minY - y : y > maxY ? y - maxY : 0;
        const dist = dx * dx + dy * dy;
        if (dist > maxDistSquared) continue;
        if (nodeIndex >= this.numItems * 4) {
          q.push(index << 1, dist);
        } else if (filterFn === void 0 || filterFn(index)) {
          q.push((index << 1) + 1, dist);
        }
      }
      while (q.length && q.peek() & 1) {
        const dist = q.peekValue();
        if (dist > maxDistSquared) break outer;
        results.push(q.pop() >> 1);
        if (results.length === maxResults) break outer;
      }
      nodeIndex = q.length ? q.pop() >> 1 : void 0;
    }
    q.clear();
    return results;
  }
}
function upperBound(value, arr) {
  let i = 0;
  let j = arr.length - 1;
  while (i < j) {
    const m = i + j >> 1;
    if (arr[m] > value) {
      j = m;
    } else {
      i = m + 1;
    }
  }
  return arr[i];
}
function sort(values, boxes, indices, left, right, nodeSize) {
  if (Math.floor(left / nodeSize) >= Math.floor(right / nodeSize)) return;
  const start = values[left];
  const mid = values[left + right >> 1];
  const end = values[right];
  let pivot = end;
  const x = Math.max(start, mid);
  if (end > x) {
    pivot = x;
  } else if (x === start) {
    pivot = Math.max(mid, end);
  } else if (x === mid) {
    pivot = Math.max(start, end);
  }
  let i = left - 1;
  let j = right + 1;
  while (true) {
    do
      i++;
    while (values[i] < pivot);
    do
      j--;
    while (values[j] > pivot);
    if (i >= j) break;
    swap(values, boxes, indices, i, j);
  }
  sort(values, boxes, indices, left, j, nodeSize);
  sort(values, boxes, indices, j + 1, right, nodeSize);
}
function swap(values, boxes, indices, i, j) {
  const temp = values[i];
  values[i] = values[j];
  values[j] = temp;
  const k = 4 * i;
  const m = 4 * j;
  const a = boxes[k];
  const b = boxes[k + 1];
  const c = boxes[k + 2];
  const d = boxes[k + 3];
  boxes[k] = boxes[m];
  boxes[k + 1] = boxes[m + 1];
  boxes[k + 2] = boxes[m + 2];
  boxes[k + 3] = boxes[m + 3];
  boxes[m] = a;
  boxes[m + 1] = b;
  boxes[m + 2] = c;
  boxes[m + 3] = d;
  const e = indices[i];
  indices[i] = indices[j];
  indices[j] = e;
}
function hilbert(x, y) {
  let a = x ^ y;
  let b = 65535 ^ a;
  let c = 65535 ^ (x | y);
  let d = x & (y ^ 65535);
  let A = a | b >> 1;
  let B = a >> 1 ^ a;
  let C = c >> 1 ^ b & d >> 1 ^ c;
  let D = a & c >> 1 ^ d >> 1 ^ d;
  a = A;
  b = B;
  c = C;
  d = D;
  A = a & a >> 2 ^ b & b >> 2;
  B = a & b >> 2 ^ b & (a ^ b) >> 2;
  C ^= a & c >> 2 ^ b & d >> 2;
  D ^= b & c >> 2 ^ (a ^ b) & d >> 2;
  a = A;
  b = B;
  c = C;
  d = D;
  A = a & a >> 4 ^ b & b >> 4;
  B = a & b >> 4 ^ b & (a ^ b) >> 4;
  C ^= a & c >> 4 ^ b & d >> 4;
  D ^= b & c >> 4 ^ (a ^ b) & d >> 4;
  a = A;
  b = B;
  c = C;
  d = D;
  C ^= a & c >> 8 ^ b & d >> 8;
  D ^= b & c >> 8 ^ (a ^ b) & d >> 8;
  a = C ^ C >> 1;
  b = D ^ D >> 1;
  let i0 = x ^ y;
  let i1 = b | 65535 ^ (i0 | a);
  i0 = (i0 | i0 << 8) & 16711935;
  i0 = (i0 | i0 << 4) & 252645135;
  i0 = (i0 | i0 << 2) & 858993459;
  i0 = (i0 | i0 << 1) & 1431655765;
  i1 = (i1 | i1 << 8) & 16711935;
  i1 = (i1 | i1 << 4) & 252645135;
  i1 = (i1 | i1 << 2) & 858993459;
  i1 = (i1 | i1 << 1) & 1431655765;
  return (i1 << 1 | i0) >>> 0;
}
class SpatialIndex {
  constructor() {
    this.index = null;
    this.hotspots = [];
    this.hotspotsMap = /* @__PURE__ */ new Map();
    this.centerPoints = [];
    this.queryCache = /* @__PURE__ */ new Map();
    this.cacheSize = 50;
    this.lastCacheClear = Date.now();
  }
  /**
   * Load hotspots with optimized Flatbush indexing
   */
  loadHotspots(hotspotData2) {
    const startTime = performance.now();
    this.hotspots = [];
    this.hotspotsMap.clear();
    this.centerPoints = [];
    this.queryCache.clear();
    const numItems = hotspotData2.length;
    this.index = new Flatbush(numItems);
    hotspotData2.forEach((hotspot, idx) => {
      const bbox = this.calculateBoundingBox(hotspot.coordinates);
      const centerX = (bbox.minX + bbox.maxX) / 2;
      const centerY = (bbox.minY + bbox.maxY) / 2;
      const hotspotWithBbox = {
        ...hotspot,
        bbox,
        center: { x: centerX, y: centerY },
        index: idx
      };
      this.hotspots.push(hotspotWithBbox);
      this.hotspotsMap.set(hotspot.id, hotspotWithBbox);
      this.centerPoints.push([centerX, centerY]);
      this.index.add(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY);
    });
    this.index.finish();
    const loadTime = performance.now() - startTime;
    console.log(`[Flatbush] Spatial index built in ${loadTime.toFixed(2)}ms for ${numItems} hotspots`);
  }
  /**
   * Query with caching for repeated viewport queries
   * Flatbush optimization: 30% faster than RBush for box queries
   */
  queryViewport(bounds, zoom = 1) {
    const key = `${bounds.minX.toFixed(2)},${bounds.minY.toFixed(2)},${bounds.maxX.toFixed(2)},${bounds.maxY.toFixed(2)},${zoom.toFixed(2)}`;
    if (this.queryCache.has(key)) {
      return this.queryCache.get(key);
    }
    if (Date.now() - this.lastCacheClear > 1e3) {
      this.queryCache.clear();
      this.lastCacheClear = Date.now();
    }
    const indices = this.index.search(
      bounds.minX,
      bounds.minY,
      bounds.maxX,
      bounds.maxY
    );
    const hotspots = indices.map((idx) => this.hotspots[idx]);
    if (this.queryCache.size < this.cacheSize) {
      this.queryCache.set(key, hotspots);
    }
    return hotspots;
  }
  /**
   * Optimized point-in-hotspot test
   * Flatbush optimization: Uses efficient point query
   */
  getHotspotAtPoint(x, y) {
    const indices = this.index.search(x, y, x, y);
    for (const idx of indices) {
      const hotspot = this.hotspots[idx];
      if (this.isPointInHotspot(x, y, hotspot)) {
        return hotspot;
      }
    }
    return null;
  }
  /**
   * Find nearby hotspots within radius (NEW METHOD)
   * Optimized for mobile tap-to-reveal using center points
   * Target: < 5ms for 647 hotspots
   */
  findNearbyHotspots(x, y, radius = 200, maxResults = 10) {
    const startTime = performance.now();
    const indices = this.index.search(
      x - radius,
      y - radius,
      x + radius,
      y + radius
    );
    const hotspotsWithDistance = [];
    for (const idx of indices) {
      const hotspot = this.hotspots[idx];
      const dx = hotspot.center.x - x;
      const dy = hotspot.center.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        hotspotsWithDistance.push({ hotspot, distance });
      }
    }
    hotspotsWithDistance.sort((a, b) => a.distance - b.distance);
    const results = hotspotsWithDistance.slice(0, maxResults).map((item) => item.hotspot);
    const searchTime = performance.now() - startTime;
    if (searchTime > 5) {
      console.warn(`[Flatbush] Slow nearby search: ${searchTime.toFixed(2)}ms for ${results.length} results`);
    }
    return results;
  }
  /**
   * Find adjacent/contiguous hotspots forming a group around tap point
   * This method selects hotspots that are "côte à côte" (side by side)
   * instead of just the nearest ones by distance
   */
  findAdjacentHotspots(x, y, maxResults = 10, adjacencyThreshold = 100) {
    const startTime = performance.now();
    const searchRadius = 500;
    const indices = this.index.search(
      x - searchRadius,
      y - searchRadius,
      x + searchRadius,
      y + searchRadius
    );
    let closestHotspot = null;
    let minDistance = Infinity;
    for (const idx of indices) {
      const hotspot = this.hotspots[idx];
      const dx = hotspot.center.x - x;
      const dy = hotspot.center.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        minDistance = distance;
        closestHotspot = hotspot;
      }
    }
    if (!closestHotspot) {
      console.log("[SpatialIndex] No hotspot found near tap point");
      return [];
    }
    const selected = /* @__PURE__ */ new Set([closestHotspot.id]);
    const toProcess = [closestHotspot];
    const result = [closestHotspot];
    while (toProcess.length > 0 && result.length < maxResults) {
      const current = toProcess.shift();
      const neighbors = this.findAdjacentNeighbors(current, adjacencyThreshold);
      for (const neighbor of neighbors) {
        if (!selected.has(neighbor.id) && result.length < maxResults) {
          selected.add(neighbor.id);
          result.push(neighbor);
          toProcess.push(neighbor);
        }
      }
    }
    const searchTime = performance.now() - startTime;
    console.log(`[SpatialIndex] Found ${result.length} adjacent hotspots in ${searchTime.toFixed(2)}ms`);
    return result;
  }
  /**
   * Find hotspots adjacent to a given hotspot
   * Two hotspots are considered adjacent if their bounding boxes are close
   */
  findAdjacentNeighbors(hotspot, threshold = 100) {
    const bbox = hotspot.bbox;
    const indices = this.index.search(
      bbox.minX - threshold,
      bbox.minY - threshold,
      bbox.maxX + threshold,
      bbox.maxY + threshold
    );
    const neighbors = [];
    for (const idx of indices) {
      const candidate = this.hotspots[idx];
      if (candidate.id === hotspot.id) continue;
      if (this.areBoundingBoxesAdjacent(bbox, candidate.bbox, threshold)) {
        neighbors.push(candidate);
      }
    }
    neighbors.sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.center.x - hotspot.center.x, 2) + Math.pow(a.center.y - hotspot.center.y, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.center.x - hotspot.center.x, 2) + Math.pow(b.center.y - hotspot.center.y, 2)
      );
      return distA - distB;
    });
    return neighbors;
  }
  /**
   * Check if two bounding boxes are adjacent or close enough
   */
  areBoundingBoxesAdjacent(bbox1, bbox2, threshold) {
    const xGap = Math.max(0, Math.max(bbox1.minX, bbox2.minX) - Math.min(bbox1.maxX, bbox2.maxX));
    const yGap = Math.max(0, Math.max(bbox1.minY, bbox2.minY) - Math.min(bbox1.maxY, bbox2.maxY));
    return xGap < threshold && yGap < threshold;
  }
  /**
   * Calculate bounding box
   */
  calculateBoundingBox(coordinates) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const processPoints = (points) => {
      for (const point of points) {
        minX = Math.min(minX, point[0]);
        minY = Math.min(minY, point[1]);
        maxX = Math.max(maxX, point[0]);
        maxY = Math.max(maxY, point[1]);
      }
    };
    if (coordinates.length > 0 && typeof coordinates[0][0] === "number") {
      processPoints(coordinates);
    } else {
      for (const polygon of coordinates) {
        processPoints(polygon);
      }
    }
    return { minX, minY, maxX, maxY };
  }
  /**
   * Point-in-polygon test
   */
  isPointInHotspot(x, y, hotspot) {
    if (hotspot.shape === "polygon") {
      return this.pointInPolygon(x, y, hotspot.coordinates);
    } else if (hotspot.shape === "multipolygon") {
      return hotspot.coordinates.some(
        (polygon) => this.pointInPolygon(x, y, polygon)
      );
    }
    return false;
  }
  /**
   * Optimized ray casting algorithm
   */
  pointInPolygon(x, y, polygon) {
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
  /**
   * Get all hotspots
   */
  getAllHotspots() {
    return this.hotspots;
  }
  /**
   * Get hotspot by ID
   */
  getHotspotById(id) {
    return this.hotspotsMap.get(id);
  }
  /**
   * Clear all data
   */
  clear() {
    this.index = null;
    this.hotspots = [];
    this.hotspotsMap.clear();
    this.centerPoints = [];
    this.queryCache.clear();
  }
}
class TileCleanupManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.state = {
      isActive: false,
      lastCleanup: Date.now(),
      lastDeepCleanup: Date.now(),
      cleanupCount: 0,
      tilesRemoved: 0,
      currentPressure: "normal"
      // normal, elevated, high, critical
    };
    this.config = {
      // Cleanup intervals
      normalCleanupInterval: 3e4,
      // 30 seconds
      elevatedCleanupInterval: 15e3,
      // 15 seconds
      highCleanupInterval: 5e3,
      // 5 seconds
      criticalCleanupInterval: 1e3,
      // 1 second
      deepCleanupInterval: 6e4,
      // 1 minute
      // Tile age thresholds (ms)
      maxTileAge: {
        normal: 6e4,
        // 1 minute
        elevated: 3e4,
        // 30 seconds
        high: 15e3,
        // 15 seconds
        critical: 5e3
        // 5 seconds
      },
      // Cache size thresholds
      cacheThresholds: {
        normal: 400,
        elevated: 200,
        high: 100,
        critical: 50
      },
      // Viewport distance for keeping tiles (in viewport units)
      keepDistance: {
        normal: 2,
        // Keep tiles within 2x viewport
        elevated: 1.5,
        high: 1.2,
        critical: 1
        // Only visible tiles
      },
      // Performance thresholds
      fpsThresholds: {
        good: 55,
        acceptable: 40,
        poor: 25,
        critical: 10
        // Much lower threshold for mobile to avoid aggressive cleanup
      }
    };
    this.intervals = {};
    this.tileAccessTimes = /* @__PURE__ */ new Map();
    this.metrics = {
      totalCleaned: 0,
      lastCleanupDuration: 0,
      averageCleanupTime: 0,
      cleanupRuns: 0
    };
    this.handleTileLoaded = this.handleTileLoaded.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);
  }
  start() {
    if (this.state.isActive) return;
    this.state.isActive = true;
    this.viewer.addHandler("tile-loaded", this.handleTileLoaded);
    this.viewer.addHandler("viewport-change", this.handleViewportChange);
    this.updateCleanupInterval();
    this.intervals.deepCleanup = setInterval(() => this.performDeepCleanup(), this.config.deepCleanupInterval);
    this.intervals.monitor = setInterval(() => this.monitorPerformance(), 2e3);
    console.log("TileCleanupManager started");
  }
  stop() {
    this.state.isActive = false;
    this.viewer.removeHandler("tile-loaded", this.handleTileLoaded);
    this.viewer.removeHandler("viewport-change", this.handleViewportChange);
    Object.values(this.intervals).forEach((interval) => clearInterval(interval));
    this.intervals = {};
    this.tileAccessTimes.clear();
    console.log("TileCleanupManager stopped");
  }
  handleTileLoaded(event) {
    if (!event.tile) return;
    const tileKey = this.getTileKey(event.tile);
    this.tileAccessTimes.set(tileKey, Date.now());
  }
  handleViewportChange() {
    var _a;
    const tiledImage = (_a = this.viewer.world) == null ? void 0 : _a.getItemAt(0);
    if (!tiledImage || !tiledImage._tilesToDraw) return;
    const now = Date.now();
    tiledImage._tilesToDraw.forEach((tile) => {
      const tileKey = this.getTileKey(tile);
      this.tileAccessTimes.set(tileKey, now);
    });
  }
  getTileKey(tile) {
    return `${tile.level}_${tile.x}_${tile.y}`;
  }
  monitorPerformance() {
    var _a, _b;
    const fps = ((_b = (_a = window.performanceMonitor) == null ? void 0 : _a.getMetrics()) == null ? void 0 : _b.averageFPS) || 60;
    const previousPressure = this.state.currentPressure;
    const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile2) {
      if (fps < 10) {
        this.state.currentPressure = "critical";
      } else if (fps < 15) {
        this.state.currentPressure = "high";
      } else if (fps < 25) {
        this.state.currentPressure = "elevated";
      } else {
        this.state.currentPressure = "normal";
      }
    } else {
      if (fps < this.config.fpsThresholds.critical) {
        this.state.currentPressure = "critical";
      } else if (fps < this.config.fpsThresholds.poor) {
        this.state.currentPressure = "high";
      } else if (fps < this.config.fpsThresholds.acceptable) {
        this.state.currentPressure = "elevated";
      } else {
        this.state.currentPressure = "normal";
      }
    }
    if (previousPressure !== this.state.currentPressure) {
      console.log(`Tile cleanup pressure changed: ${previousPressure} → ${this.state.currentPressure} (FPS: ${fps})`);
      this.updateCleanupInterval();
      if (this.state.currentPressure === "critical") {
        this.performCleanup();
      }
    }
  }
  updateCleanupInterval() {
    if (this.intervals.cleanup) {
      clearInterval(this.intervals.cleanup);
    }
    const intervalMap = {
      normal: this.config.normalCleanupInterval,
      elevated: this.config.elevatedCleanupInterval,
      high: this.config.highCleanupInterval,
      critical: this.config.criticalCleanupInterval
    };
    const interval = intervalMap[this.state.currentPressure];
    this.intervals.cleanup = setInterval(() => this.performCleanup(), interval);
  }
  performCleanup() {
    var _a;
    if (!this.state.isActive) return;
    const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile2) {
      const isStable = this.viewer.viewport.getZoom() === this.viewer.viewport.zoomSpring.target.value && this.viewer.viewport.getCenter().equals(this.viewer.viewport.centerSpringX.target.value);
      if (!isStable) {
        console.log("Skipping tile cleanup on mobile - viewport changing");
        return;
      }
    }
    const startTime = performance.now();
    const tiledImage = (_a = this.viewer.world) == null ? void 0 : _a.getItemAt(0);
    if (!tiledImage || !tiledImage._tileCache) return;
    const isAnimating = this.viewer.isAnimating || window.renderOptimizer && window.renderOptimizer.isCurrentlyAnimating() || this.viewer.viewport.zoomSpring.current.value !== this.viewer.viewport.zoomSpring.target.value;
    if (isAnimating) {
      return;
    }
    const pressure = this.state.currentPressure;
    const maxAge = this.config.maxTileAge[pressure];
    const cacheThreshold = this.config.cacheThresholds[pressure];
    const keepDistance = this.config.keepDistance[pressure];
    const now = Date.now();
    const viewport = this.viewer.viewport;
    const bounds = viewport.getBounds();
    const expandedBounds = {
      x: bounds.x - bounds.width * (keepDistance - 1) / 2,
      y: bounds.y - bounds.height * (keepDistance - 1) / 2,
      width: bounds.width * keepDistance,
      height: bounds.height * keepDistance
    };
    const cache = tiledImage._tileCache;
    const cachedTiles = cache._tilesLoaded || [];
    const currentCacheSize = cachedTiles.length;
    if (currentCacheSize === 0) return;
    const visibleTiles = /* @__PURE__ */ new Set();
    if (tiledImage._tilesToDraw) {
      tiledImage._tilesToDraw.forEach((tile) => {
        const tileKey = this.getTileKey(tile);
        visibleTiles.add(tileKey);
      });
    }
    const tilesToRemove = [];
    cachedTiles.forEach((tile) => {
      const tileKey = this.getTileKey(tile);
      if (visibleTiles.has(tileKey)) {
        return;
      }
      const lastAccess = this.tileAccessTimes.get(tileKey) || 0;
      const age = now - lastAccess;
      let shouldRemove = false;
      if (age > maxAge) {
        shouldRemove = true;
      }
      if (!shouldRemove && pressure !== "normal") {
        const tileBounds = tile.bounds;
        if (tileBounds) {
          const isInExpandedView = !(tileBounds.x + tileBounds.width < expandedBounds.x || tileBounds.x > expandedBounds.x + expandedBounds.width || tileBounds.y + tileBounds.height < expandedBounds.y || tileBounds.y > expandedBounds.y + expandedBounds.height);
          if (!isInExpandedView) {
            shouldRemove = true;
          }
        }
      }
      if (shouldRemove) {
        tilesToRemove.push(tile);
      }
    });
    if (currentCacheSize > cacheThreshold) {
      const remainingToRemove = currentCacheSize - cacheThreshold;
      if (remainingToRemove > tilesToRemove.length) {
        const remainingTiles = cachedTiles.filter((tile) => {
          const tileKey = this.getTileKey(tile);
          return !tilesToRemove.includes(tile) && !visibleTiles.has(tileKey);
        });
        remainingTiles.sort((a, b) => {
          const aKey = this.getTileKey(a);
          const bKey = this.getTileKey(b);
          const aTime = this.tileAccessTimes.get(aKey) || 0;
          const bTime = this.tileAccessTimes.get(bKey) || 0;
          return aTime - bTime;
        });
        const additionalToRemove = remainingToRemove - tilesToRemove.length;
        tilesToRemove.push(...remainingTiles.slice(0, additionalToRemove));
      }
    }
    if (tilesToRemove.length > 0) {
      tilesToRemove.forEach((tile) => {
        const tileKey = this.getTileKey(tile);
        this.tileAccessTimes.delete(tileKey);
        if (tile.unload) {
          tile.unload();
        }
      });
      this.state.tilesRemoved += tilesToRemove.length;
      this.metrics.totalCleaned += tilesToRemove.length;
      console.log(`Cleaned ${tilesToRemove.length} tiles (pressure: ${pressure}, cache was: ${currentCacheSize}, kept ${visibleTiles.size} visible)`);
    }
    const duration = performance.now() - startTime;
    this.metrics.lastCleanupDuration = duration;
    this.metrics.cleanupRuns++;
    this.metrics.averageCleanupTime = (this.metrics.averageCleanupTime * (this.metrics.cleanupRuns - 1) + duration) / this.metrics.cleanupRuns;
    this.state.lastCleanup = now;
    this.state.cleanupCount++;
  }
  performDeepCleanup() {
    if (!this.state.isActive) return;
    const isAnimating = this.viewer.isAnimating || window.renderOptimizer && window.renderOptimizer.isCurrentlyAnimating() || this.viewer.viewport.zoomSpring.current.value !== this.viewer.viewport.zoomSpring.target.value;
    if (isAnimating) {
      console.log("Skipping deep cleanup during animation");
      return;
    }
    console.log("Performing deep tile cleanup");
    const startTime = performance.now();
    const now = Date.now();
    const maxTrackingAge = 3e5;
    const keysToDelete = [];
    this.tileAccessTimes.forEach((time, key) => {
      if (now - time > maxTrackingAge) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.tileAccessTimes.delete(key));
    if (window.gc) {
      window.gc();
      console.log("Forced garbage collection after deep cleanup");
    }
    const duration = performance.now() - startTime;
    this.state.lastDeepCleanup = now;
    console.log(`Deep cleanup completed in ${duration.toFixed(2)}ms, cleared ${keysToDelete.length} old tracking entries`);
  }
  forceCleanup() {
    console.log("Forcing immediate tile cleanup");
    this.performCleanup();
  }
  getMetrics() {
    var _a, _b, _c;
    const tiledImage = (_a = this.viewer.world) == null ? void 0 : _a.getItemAt(0);
    const currentCacheSize = ((_c = (_b = tiledImage == null ? void 0 : tiledImage._tileCache) == null ? void 0 : _b._tilesLoaded) == null ? void 0 : _c.length) || 0;
    return {
      ...this.metrics,
      currentCacheSize,
      pressure: this.state.currentPressure,
      cleanupCount: this.state.cleanupCount,
      tilesRemoved: this.state.tilesRemoved,
      trackingSize: this.tileAccessTimes.size,
      cacheThreshold: this.config.cacheThresholds[this.state.currentPressure]
    };
  }
  setPressure(pressure) {
    if (["normal", "elevated", "high", "critical"].includes(pressure)) {
      this.state.currentPressure = pressure;
      this.updateCleanupInterval();
    }
  }
  pauseCleanup(duration = 1e3) {
    if (this.intervals.cleanup) {
      clearInterval(this.intervals.cleanup);
      setTimeout(() => {
        if (this.state.isActive) {
          this.updateCleanupInterval();
        }
      }, duration);
    }
  }
  destroy() {
    this.stop();
    this.viewer = null;
    this.tileAccessTimes.clear();
  }
}
class TileWorkerManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.worker = null;
    this.isInitialized = false;
    this.state = {
      pendingRequests: /* @__PURE__ */ new Map(),
      requestId: 0,
      workerReady: false,
      capabilities: null,
      lastError: null
    };
    this.config = {
      workerPath: "/tile-worker.js",
      maxRetries: 3,
      retryDelay: 1e3,
      requestTimeout: 1e4,
      maxCacheSize: 200,
      enableOffscreenCanvas: true
    };
    this.metrics = {
      requestsSent: 0,
      requestsCompleted: 0,
      requestsFailed: 0,
      cacheHits: 0,
      averageProcessTime: 0,
      totalProcessTime: 0
    };
    this.handleWorkerMessage = this.handleWorkerMessage.bind(this);
    this.handleWorkerError = this.handleWorkerError.bind(this);
  }
  async initialize() {
    if (this.isInitialized) return;
    try {
      if (typeof Worker === "undefined") {
        throw new Error("Web Workers not supported");
      }
      this.worker = new Worker(this.config.workerPath);
      this.worker.onmessage = this.handleWorkerMessage;
      this.worker.onerror = this.handleWorkerError;
      await this.waitForWorkerReady();
      await this.sendToWorker("init", {
        config: {
          maxCacheSize: this.config.maxCacheSize
        }
      });
      this.isInitialized = true;
      console.log("TileWorkerManager initialized with capabilities:", this.state.capabilities);
    } catch (error) {
      console.error("Failed to initialize TileWorkerManager:", error);
      this.state.lastError = error;
      throw error;
    }
  }
  async processTile(tile, priority = 2) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    const requestId = this.generateRequestId();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.state.pendingRequests.delete(requestId);
        this.metrics.requestsFailed++;
        reject(new Error("Tile processing timeout"));
      }, this.config.requestTimeout);
      this.state.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        startTime: performance.now(),
        tile
      });
      this.worker.postMessage({
        type: "process-tile",
        requestId,
        data: {
          tile: this.serializeTile(tile),
          priority
        }
      });
      this.metrics.requestsSent++;
    });
  }
  async processBatch(tiles, priorities = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    const requestId = this.generateRequestId();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.state.pendingRequests.delete(requestId);
        this.metrics.requestsFailed++;
        reject(new Error("Batch processing timeout"));
      }, this.config.requestTimeout * tiles.length);
      this.state.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        startTime: performance.now(),
        tiles
      });
      this.worker.postMessage({
        type: "batch-process",
        requestId,
        data: {
          tiles: tiles.map((t) => this.serializeTile(t)),
          priorities
        }
      });
      this.metrics.requestsSent++;
    });
  }
  async prioritizeTiles(tiles, viewport) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (tiles.length > 100) {
      console.log("TileWorkerManager: Too many tiles, using simple priority");
      const simplePriorities = tiles.map((tile) => {
        const centerX = (tile.bounds.minX + tile.bounds.maxX) / 2;
        const centerY = (tile.bounds.minY + tile.bounds.maxY) / 2;
        const viewportCenterX = (viewport.bounds.minX + viewport.bounds.maxX) / 2;
        const viewportCenterY = (viewport.bounds.minY + viewport.bounds.maxY) / 2;
        const distance = Math.sqrt(
          Math.pow(centerX - viewportCenterX, 2) + Math.pow(centerY - viewportCenterY, 2)
        );
        return distance < 0.5 ? 0 : distance < 1 ? 1 : 2;
      });
      return {
        tiles,
        priorities: simplePriorities
      };
    }
    const requestId = this.generateRequestId();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.state.pendingRequests.delete(requestId);
        resolve({
          tiles,
          priorities: tiles.map(() => 1)
        });
      }, 50);
      this.state.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout
      });
      this.worker.postMessage({
        type: "prioritize",
        requestId,
        data: {
          tiles: tiles.map((t) => this.serializeTile(t)),
          viewport: {
            bounds: viewport.bounds,
            zoom: viewport.zoom
          }
        }
      });
    });
  }
  clearCache(selective = false, maxAge = null) {
    if (!this.worker) return;
    this.worker.postMessage({
      type: "clear-cache",
      data: { selective, maxAge }
    });
  }
  async getStats() {
    if (!this.isInitialized) {
      return this.metrics;
    }
    const requestId = this.generateRequestId();
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.state.pendingRequests.delete(requestId);
        resolve(this.metrics);
      }, 1e3);
      this.state.pendingRequests.set(requestId, {
        resolve,
        reject: () => {
        },
        timeout
      });
      this.worker.postMessage({
        type: "get-stats",
        requestId
      });
    });
  }
  handleWorkerMessage(event) {
    const { type, requestId, data } = event.data;
    switch (type) {
      case "ready":
        this.state.workerReady = true;
        break;
      case "initialized":
        this.state.capabilities = data.capabilities;
        this.handleRequestComplete(requestId, data);
        break;
      case "tile-ready":
        this.handleTileReady(requestId, data);
        break;
      case "tile-error":
        this.handleTileError(requestId, data);
        break;
      case "batch-complete":
        this.handleRequestComplete(requestId, data);
        break;
      case "priorities-calculated":
        this.handleRequestComplete(requestId, data);
        break;
      case "stats":
        this.handleStatsReceived(requestId, data);
        break;
      case "cache-cleared":
        console.log("Worker cache cleared:", data);
        break;
      default:
        console.warn("Unknown worker message type:", type);
    }
  }
  handleWorkerError(error) {
    console.error("Worker error:", error);
    this.state.lastError = error;
    this.state.pendingRequests.forEach((request, id) => {
      clearTimeout(request.timeout);
      request.reject(error);
    });
    this.state.pendingRequests.clear();
    this.isInitialized = false;
    setTimeout(() => this.initialize(), this.config.retryDelay);
  }
  handleTileReady(requestId, data) {
    const request = this.state.pendingRequests.get(requestId);
    if (!request) return;
    clearTimeout(request.timeout);
    this.state.pendingRequests.delete(requestId);
    const processTime = performance.now() - request.startTime;
    this.updateMetrics(processTime, data.cached);
    request.resolve({
      ...data,
      processingTime: processTime
    });
  }
  handleTileError(requestId, data) {
    const request = this.state.pendingRequests.get(requestId);
    if (!request) return;
    clearTimeout(request.timeout);
    this.state.pendingRequests.delete(requestId);
    this.metrics.requestsFailed++;
    request.reject(new Error(data.error));
  }
  handleRequestComplete(requestId, data) {
    const request = this.state.pendingRequests.get(requestId);
    if (!request) return;
    clearTimeout(request.timeout);
    this.state.pendingRequests.delete(requestId);
    request.resolve(data);
  }
  handleStatsReceived(requestId, workerStats) {
    const request = this.state.pendingRequests.get(requestId);
    if (!request) return;
    clearTimeout(request.timeout);
    this.state.pendingRequests.delete(requestId);
    const combinedStats = {
      ...this.metrics,
      worker: workerStats
    };
    request.resolve(combinedStats);
  }
  updateMetrics(processTime, cached) {
    this.metrics.requestsCompleted++;
    if (cached) {
      this.metrics.cacheHits++;
    }
    this.metrics.totalProcessTime += processTime;
    this.metrics.averageProcessTime = this.metrics.totalProcessTime / this.metrics.requestsCompleted;
  }
  serializeTile(tile) {
    return {
      level: tile.level,
      x: tile.x,
      y: tile.y,
      bounds: tile.bounds ? {
        minX: tile.bounds.x || tile.bounds.minX,
        minY: tile.bounds.y || tile.bounds.minY,
        maxX: (tile.bounds.x || tile.bounds.minX) + (tile.bounds.width || 0),
        maxY: (tile.bounds.y || tile.bounds.minY) + (tile.bounds.height || 0)
      } : null,
      url: tile.url || null
    };
  }
  generateRequestId() {
    return ++this.state.requestId;
  }
  async waitForWorkerReady() {
    return new Promise((resolve) => {
      if (this.state.workerReady) {
        resolve();
        return;
      }
      const checkInterval = setInterval(() => {
        if (this.state.workerReady) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5e3);
    });
  }
  async sendToWorker(type, data) {
    const requestId = this.generateRequestId();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.state.pendingRequests.delete(requestId);
        reject(new Error(`Worker request timeout: ${type}`));
      }, 5e3);
      this.state.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout
      });
      this.worker.postMessage({
        type,
        requestId,
        data
      });
    });
  }
  destroy() {
    if (this.worker) {
      this.state.pendingRequests.forEach((request) => {
        clearTimeout(request.timeout);
        request.reject(new Error("Worker destroyed"));
      });
      this.state.pendingRequests.clear();
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
    this.viewer = null;
  }
}
class TileOptimizer {
  constructor(viewer) {
    this.viewer = viewer;
    this.state = {
      isActive: false,
      tileQueue: [],
      loadingTiles: /* @__PURE__ */ new Set(),
      tilePriorities: /* @__PURE__ */ new Map(),
      loadTimes: [],
      averageLoadTime: 0,
      lastCleanup: Date.now(),
      useWorker: true,
      // Enable Web Worker by default
      workerReady: false
    };
    this.config = {
      predictiveRadius: 1.5,
      priorityLevels: 5,
      maxConcurrentLoads: 6,
      cleanupInterval: 3e4,
      tileTimeout: 1e4,
      maxLoadTimeHistory: 50,
      adaptiveLoading: true,
      webpSupport: this.detectWebPSupport(),
      workerBatchSize: 10,
      // Process tiles in batches
      workerEnabled: true
    };
    this.intervals = {};
    this.workerManager = null;
    if (this.config.workerEnabled) {
      this.initializeWorker();
    }
    this.workerMetrics = {
      tilesProcessedByWorker: 0,
      workerProcessingTime: 0,
      workerErrors: 0
    };
    this.handleViewportChange = this.handleViewportChange.bind(this);
  }
  async initializeWorker() {
    try {
      this.workerManager = new TileWorkerManager(this.viewer);
      await this.workerManager.initialize();
      this.state.workerReady = true;
      console.log("TileOptimizer: Web Worker initialized successfully");
    } catch (error) {
      console.warn("TileOptimizer: Failed to initialize Web Worker, falling back to main thread", error);
      this.state.useWorker = false;
      this.state.workerReady = false;
    }
  }
  start() {
    if (this.state.isActive) return;
    this.state.isActive = true;
    setTimeout(() => {
      this.viewer.addHandler("viewport-change", this.handleViewportChange);
    }, 100);
    this.intervals.cleanup = setInterval(() => this.performCleanup(), this.config.cleanupInterval);
    this.intervals.queue = setInterval(() => this.processQueue(), 50);
    this.intervals.worker = setInterval(() => this.processWorkerBatch(), 100);
    console.log("TileOptimizer started with Web Worker support:", this.state.workerReady);
  }
  stop() {
    this.state.isActive = false;
    this.viewer.removeHandler("viewport-change", this.handleViewportChange);
    Object.values(this.intervals).forEach((interval) => clearInterval(interval));
    this.intervals = {};
    this.state.tileQueue = [];
    this.state.loadingTiles.clear();
    this.state.tilePriorities.clear();
    if (this.workerManager) {
      this.workerManager.destroy();
      this.workerManager = null;
    }
    console.log("TileOptimizer stopped");
  }
  handleViewportChange() {
    if (this.viewer.isAnimating() || window.renderOptimizer && window.renderOptimizer.state.isCinematicZoom) {
      return;
    }
    this.predictiveLoad();
    if (this.state.workerReady && this.state.tileQueue.length > 0) {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          if (!this.viewer.isAnimating()) {
            this.updateWorkerPriorities();
          }
        }, { timeout: 100 });
      } else {
        setTimeout(() => {
          if (!this.viewer.isAnimating()) {
            this.updateWorkerPriorities();
          }
        }, 50);
      }
    }
  }
  shouldSkipPredictiveLoad() {
    if (this.viewer.isAnimating()) return true;
    if (window.renderOptimizer && window.renderOptimizer.state.isCinematicZoom) return true;
    if (this.state.tileQueue.length > 100) return true;
    return false;
  }
  async updateWorkerPriorities() {
    try {
      const viewport = this.viewer.viewport;
      const bounds = viewport.getBounds();
      const viewportData = {
        bounds: {
          minX: bounds.x,
          minY: bounds.y,
          maxX: bounds.x + bounds.width,
          maxY: bounds.y + bounds.height
        },
        zoom: viewport.getZoom()
      };
      const tiles = this.state.tileQueue.slice(0, 50);
      const result = await this.workerManager.prioritizeTiles(tiles, viewportData);
      if (result.tiles && result.priorities) {
        result.tiles.forEach((tile, index) => {
          const priority = result.priorities[index];
          const queueItem = this.state.tileQueue.find(
            (item) => item.level === tile.level && item.x === tile.x && item.y === tile.y
          );
          if (queueItem) {
            queueItem.priority = priority;
          }
        });
        this.sortQueue();
      }
    } catch (error) {
      console.warn("Failed to update worker priorities:", error);
    }
  }
  calculateTilePriority(level, x, y) {
    const viewport = this.viewer.viewport;
    const bounds = viewport.getBounds();
    const center = viewport.getCenter();
    const zoom = viewport.getZoom();
    if (zoom < 2) {
      const tileWidth2 = this.viewer.source.getTileWidth(level);
      const pixelSize = tileWidth2 * zoom;
      if (pixelSize < 32) return 999;
    }
    const tileWidth = this.viewer.source.getTileWidth(level);
    const tileHeight = this.viewer.source.getTileHeight ? this.viewer.source.getTileHeight(level) : tileWidth;
    const tileCenterX = (x + 0.5) * tileWidth / this.viewer.source.width;
    const tileCenterY = (y + 0.5) * tileHeight / this.viewer.source.height;
    const distance = Math.sqrt(
      Math.pow(tileCenterX - center.x, 2) + Math.pow(tileCenterY - center.y, 2)
    );
    const tileRect = {
      left: x * tileWidth / this.viewer.source.width,
      top: y * tileHeight / this.viewer.source.height,
      right: (x + 1) * tileWidth / this.viewer.source.width,
      bottom: (y + 1) * tileHeight / this.viewer.source.height
    };
    const isVisible = !(tileRect.right < bounds.x || tileRect.left > bounds.x + bounds.width || tileRect.bottom < bounds.y || tileRect.top > bounds.y + bounds.height);
    if (isVisible) {
      if (zoom < 3) {
        const centerDistance = Math.abs(tileCenterX - center.x) + Math.abs(tileCenterY - center.y);
        return centerDistance < 0.2 ? 0 : 1;
      }
      return 0;
    }
    if (distance < bounds.width * this.config.predictiveRadius) return 1;
    return 2;
  }
  enqueueTile(level, x, y, priority) {
    const tileKey = `${level}_${x}_${y}`;
    if (this.state.loadingTiles.has(tileKey)) return;
    const existingIndex = this.state.tileQueue.findIndex((item) => item.key === tileKey);
    if (existingIndex >= 0) {
      if (priority < this.state.tileQueue[existingIndex].priority) {
        this.state.tileQueue[existingIndex].priority = priority;
        this.sortQueue();
      }
      return;
    }
    const tileItem = {
      level,
      x,
      y,
      key: tileKey,
      priority,
      timestamp: Date.now(),
      bounds: this.calculateTileBounds(level, x, y)
    };
    this.state.tileQueue.push(tileItem);
    this.sortQueue();
  }
  calculateTileBounds(level, x, y) {
    const tileWidth = this.viewer.source.getTileWidth(level);
    const tileHeight = this.viewer.source.getTileHeight ? this.viewer.source.getTileHeight(level) : tileWidth;
    const sourceWidth = this.viewer.source.width;
    const sourceHeight = this.viewer.source.height;
    return {
      minX: x * tileWidth / sourceWidth,
      minY: y * tileHeight / sourceHeight,
      maxX: (x + 1) * tileWidth / sourceWidth,
      maxY: (y + 1) * tileHeight / sourceHeight
    };
  }
  async processWorkerBatch() {
    if (!this.state.isActive || !this.state.workerReady || this.state.tileQueue.length === 0) return;
    const highPriorityTiles = this.state.tileQueue.filter((tile) => tile.priority <= 1).slice(0, this.config.workerBatchSize);
    if (highPriorityTiles.length === 0) return;
    try {
      const priorities = highPriorityTiles.map((t) => t.priority);
      const startTime = performance.now();
      await this.workerManager.processBatch(highPriorityTiles, priorities);
      const processingTime = performance.now() - startTime;
      this.workerMetrics.tilesProcessedByWorker += highPriorityTiles.length;
      this.workerMetrics.workerProcessingTime += processingTime;
      highPriorityTiles.forEach((tile) => {
        const index = this.state.tileQueue.findIndex((t) => t.key === tile.key);
        if (index >= 0) {
          this.state.tileQueue.splice(index, 1);
        }
      });
    } catch (error) {
      console.error("Worker batch processing failed:", error);
      this.workerMetrics.workerErrors++;
    }
  }
  processQueue() {
    var _a;
    if (!this.state.isActive || this.state.tileQueue.length === 0 || this.state.loadingTiles.size >= this.config.maxConcurrentLoads) return;
    const tiledImage = (_a = this.viewer.world) == null ? void 0 : _a.getItemAt(0);
    if (!tiledImage) return;
    while (this.state.loadingTiles.size < this.config.maxConcurrentLoads && this.state.tileQueue.length > 0) {
      const item = this.state.tileQueue.shift();
      if (Date.now() - item.timestamp > this.config.tileTimeout) continue;
      this.state.loadingTiles.add(item.key);
      this.viewer.forceRedraw();
    }
  }
  sortQueue() {
    this.state.tileQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.timestamp - b.timestamp;
    });
  }
  predictiveLoad() {
    var _a;
    if (this.shouldSkipPredictiveLoad()) {
      return;
    }
    const tiledImage = (_a = this.viewer.world) == null ? void 0 : _a.getItemAt(0);
    if (!tiledImage || !this.viewer.source) return;
    const viewport = this.viewer.viewport;
    const bounds = viewport.getBounds();
    const expandedBounds = {
      x: bounds.x - bounds.width * (this.config.predictiveRadius - 1) / 2,
      y: bounds.y - bounds.height * (this.config.predictiveRadius - 1) / 2,
      width: bounds.width * this.config.predictiveRadius,
      height: bounds.height * this.config.predictiveRadius
    };
    const zoom = viewport.getZoom();
    const level = Math.max(0, Math.min(
      Math.floor(Math.log2(zoom)),
      this.viewer.source.maxLevel || 14
    ));
    const tileWidth = this.viewer.source.getTileWidth(level);
    const tileHeight = this.viewer.source.getTileHeight ? this.viewer.source.getTileHeight(level) : tileWidth;
    const sourceWidth = this.viewer.source.width;
    const sourceHeight = this.viewer.source.height;
    const tileRange = {
      startX: Math.max(0, Math.floor(expandedBounds.x * sourceWidth / tileWidth)),
      endX: Math.min(
        Math.ceil(sourceWidth / tileWidth) - 1,
        Math.ceil((expandedBounds.x + expandedBounds.width) * sourceWidth / tileWidth)
      ),
      startY: Math.max(0, Math.floor(expandedBounds.y * sourceHeight / tileHeight)),
      endY: Math.min(
        Math.ceil(sourceHeight / tileHeight) - 1,
        Math.ceil((expandedBounds.y + expandedBounds.height) * sourceHeight / tileHeight)
      )
    };
    for (let x = tileRange.startX; x <= tileRange.endX; x++) {
      for (let y = tileRange.startY; y <= tileRange.endY; y++) {
        const priority = this.calculateTilePriority(level, x, y);
        this.enqueueTile(level, x, y, priority);
      }
    }
  }
  trackLoadTime(loadTime) {
    this.state.loadTimes.push(loadTime);
    if (this.state.loadTimes.length > this.config.maxLoadTimeHistory) {
      this.state.loadTimes.shift();
    }
    this.state.averageLoadTime = this.state.loadTimes.reduce((a, b) => a + b, 0) / this.state.loadTimes.length;
    this.adjustLoadingStrategy();
  }
  removeTileFromLoading(tileKey) {
    this.state.loadingTiles.delete(tileKey);
  }
  get loadingTiles() {
    return this.state.loadingTiles;
  }
  adjustLoadingStrategy() {
    const avgTime = this.state.averageLoadTime;
    const currentLoads = this.config.maxConcurrentLoads;
    const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const maxLoads = isMobile2 ? 4 : 8;
    if (avgTime > 500 && currentLoads > 2) {
      this.config.maxConcurrentLoads--;
      console.log(`Reduced concurrent loads to ${this.config.maxConcurrentLoads} (avg: ${avgTime.toFixed(0)}ms)`);
    } else if (avgTime < 200 && currentLoads < maxLoads) {
      this.config.maxConcurrentLoads++;
      console.log(`Increased concurrent loads to ${this.config.maxConcurrentLoads} (avg: ${avgTime.toFixed(0)}ms)`);
    }
  }
  performCleanup() {
    const now = Date.now();
    this.state.tileQueue = this.state.tileQueue.filter(
      (item) => now - item.timestamp < this.config.tileTimeout
    );
    this.state.loadingTiles.clear();
    this.state.lastCleanup = now;
    if (this.workerManager) {
      this.workerManager.clearCache(true, 6e4);
    }
  }
  clearOldTiles() {
    this.performCleanup();
    if (window.gc) window.gc();
  }
  detectWebPSupport() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, 1, 1);
    try {
      return canvas.toDataURL("image/webp").indexOf("image/webp") === 5;
    } catch (e) {
      return false;
    }
  }
  async getStats() {
    const workerStats = this.workerManager ? await this.workerManager.getStats() : null;
    return {
      queueLength: this.state.tileQueue.length,
      loadingCount: this.state.loadingTiles.size,
      averageLoadTime: this.state.averageLoadTime.toFixed(0) + "ms",
      maxConcurrentLoads: this.config.maxConcurrentLoads,
      webpSupported: this.config.webpSupport,
      workerEnabled: this.state.workerReady,
      workerMetrics: {
        ...this.workerMetrics,
        averageWorkerTime: this.workerMetrics.tilesProcessedByWorker > 0 ? (this.workerMetrics.workerProcessingTime / this.workerMetrics.tilesProcessedByWorker).toFixed(2) + "ms" : "0ms"
      },
      workerStats
    };
  }
}
function applyMobileSafariFix(viewer) {
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  if (!isIOSSafari) {
    console.log("MobileSafariFix: Not iOS Safari, skipping fix");
    return;
  }
  console.log("=== APPLYING MOBILE SAFARI FIX ===");
  viewer.addHandler("update-viewport", function() {
    const tiledImage = viewer.world.getItemAt(0);
    if (tiledImage) {
      if (tiledImage._tilesLoading) {
        tiledImage._tilesLoading = Math.min(tiledImage._tilesLoading, 2);
      }
      if (!tiledImage._resetPatched) {
        const originalReset = tiledImage.reset;
        tiledImage.reset = function(hard) {
          if (hard) {
            console.log("MobileSafariFix: Preventing hard reset of tiles");
            return;
          }
          return originalReset.call(this, hard);
        };
        tiledImage._resetPatched = true;
      }
    }
  });
  viewer.imageLoaderLimit = 2;
  viewer.maxTilesPerFrame = 2;
  viewer.immediateRender = true;
  viewer.blendTime = 0.2;
  viewer.alwaysBlend = false;
  viewer.smoothTileEdgesMinZoom = Infinity;
  viewer.minPixelRatio = 0.7;
  viewer.minZoomImageRatio = 0.7;
  viewer.addHandler("animation-finish", function(event) {
    const isBrowserStack = window.location.hostname.includes("browserstack") || navigator.userAgent.includes("BrowserStack");
    const isIPhone2 = /iPhone/.test(navigator.userAgent) && !/iPad/.test(navigator.userAgent);
    if (isIPhone2) {
      console.log("[iPhone] Skipping immediateRender toggle - using smooth tile loading");
      return;
    }
    if (!isBrowserStack) {
      if (viewer.immediateRender) {
        viewer.immediateRender = false;
        setTimeout(() => {
          viewer.immediateRender = true;
        }, 100);
      }
    }
  });
  let isInteracting = false;
  let interactionTimeout = null;
  viewer.addHandler("pan", () => {
    isInteracting = true;
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => {
      isInteracting = false;
    }, 500);
  });
  viewer.addHandler("zoom", () => {
    isInteracting = true;
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => {
      isInteracting = false;
    }, 500);
  });
  viewer.addHandler("tile-drawing", (event) => {
    if (isInteracting) {
      event.preventDefaultAction = false;
    }
  });
  if (viewer.imageLoader) {
    const originalClear = viewer.imageLoader.clear;
    viewer.imageLoader.clear = function() {
      if (isInteracting) {
        console.log("MobileSafariFix: Preventing image loader clear during interaction");
        return;
      }
      return originalClear.call(this);
    };
  }
  viewer.addHandler("animation", () => {
    if (viewer.isAnimating()) {
      viewer.imageLoaderLimit = 2;
      viewer.maxTilesPerFrame = 2;
      viewer.blendTime = 0.2;
    }
  });
  viewer.isIOSSafari = true;
  console.log("=== MOBILE SAFARI FIX APPLIED ===");
  console.log("- Tile clearing disabled during interactions");
  console.log("- Stable tile loading settings");
  console.log("- Interaction-aware rendering");
  console.log("- Image loader clearing prevented during interactions");
}
function applyIOSTileDisappearFix(viewer) {
  const isIOS2 = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isIPhone2 = /iPhone/.test(navigator.userAgent) && !/iPad/.test(navigator.userAgent);
  if (!isIOS2) {
    console.log("IOSTileDisappearFix: Not iOS, skipping fix");
    return;
  }
  if (isIPhone2) {
    console.log("IOSTileDisappearFix: iPhone detected - SKIPPING ALL FIXES (causes disappearance)");
    return;
  }
  console.log("=== APPLYING iOS TILE DISAPPEAR FIX (iPad only) ===");
  let isPanning = false;
  let panEndTimer = null;
  let forceRedrawTimer = null;
  viewer.addHandler("pan", (event) => {
    isPanning = true;
    clearTimeout(panEndTimer);
    clearTimeout(forceRedrawTimer);
  });
  viewer.addHandler("animation-finish", (event) => {
    if (isPanning) {
      isPanning = false;
      const isBrowserStack = window.location.hostname.includes("browserstack") || navigator.userAgent.includes("BrowserStack");
      if (isBrowserStack) {
        setTimeout(() => {
          forceRedraw();
        }, 50);
      } else {
        const isIPhone3 = /iPhone/.test(navigator.userAgent) && !/iPad/.test(navigator.userAgent);
        if (isIPhone3) {
          console.log("[iPhone] Skipping forced redraw to prevent flash");
          isPanning = false;
          return;
        } else {
          requestAnimationFrame(() => {
            forceRedraw();
          });
          panEndTimer = setTimeout(() => {
            forceRedraw();
          }, 100);
          forceRedrawTimer = setTimeout(() => {
            forceRedraw();
          }, 250);
        }
      }
    }
  });
  function forceRedraw() {
    const tiledImage = viewer.world.getItemAt(0);
    if (!tiledImage) return;
    const isBrowserStack = window.location.hostname.includes("browserstack") || navigator.userAgent.includes("BrowserStack");
    const isIPhone3 = /iPhone/.test(navigator.userAgent) && !/iPad/.test(navigator.userAgent);
    if (isBrowserStack) {
      viewer.forceRedraw();
    } else if (isIPhone3) {
      console.log("[iPhone] Using gentle redraw strategy");
      tiledImage.update();
      viewer.forceRedraw();
      viewer.viewport.applyConstraints();
    } else {
      tiledImage.update();
      viewer.forceRedraw();
      const currentZoom = viewer.viewport.getZoom();
      viewer.viewport.zoomTo(currentZoom * 1.0001, null, true);
      viewer.viewport.zoomTo(currentZoom, null, true);
    }
  }
  viewer.addHandler("canvas-drag", (event) => {
    const tiledImage = viewer.world.getItemAt(0);
    if (tiledImage && tiledImage._tileCache) {
      tiledImage._tileCache._maxImageCacheCount = 200;
    }
  });
  viewer.addHandler("canvas-drag-end", (event) => {
    setTimeout(() => {
      const tiledImage = viewer.world.getItemAt(0);
      if (tiledImage && tiledImage._tileCache) {
        tiledImage._tileCache._maxImageCacheCount = 100;
      }
    }, 500);
  });
  const originalUpdateViewport = viewer.updateViewport;
  viewer.updateViewport = function() {
    const result = originalUpdateViewport.call(this);
    if (!isPanning) {
      const tiledImage = viewer.world.getItemAt(0);
      if (tiledImage && tiledImage._tilesToDraw && tiledImage._tilesToDraw.length === 0) {
        console.warn("iOS: No tiles to draw detected, forcing refresh");
        forceRedraw();
      }
    }
    return result;
  };
  console.log("iOS Tile Disappear Fix applied successfully");
}
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
const isIPhone = () => /iPhone/.test(navigator.userAgent) && !/iPad/.test(navigator.userAgent);
const isIPad = () => /iPad/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
function createIOSHTMLConfig(baseConfig) {
  if (!isIOS()) {
    return baseConfig;
  }
  const device = isIPhone() ? "iPhone" : isIPad() ? "iPad" : "iOS";
  console.log(`[iOS HTML Config] Configuring HTML drawer for ${device} - bypassing canvas limitations`);
  return {
    ...baseConfig,
    // CRITICAL: Bypass canvas entirely on iOS
    useCanvas: false,
    drawer: "html",
    // Force HTML drawer explicitly
    // Performance optimizations for HTML rendering
    immediateRender: true,
    // CRITICAL: Immediate rendering to prevent black tiles
    alwaysBlend: false,
    // Better performance
    imageSmoothingEnabled: false,
    // Sharper tiles
    // Memory management - OPTIMIZED based on research
    maxImageCacheCount: isIPhone() ? 50 : isIPad() ? 100 : 75,
    // Increased cache for better performance
    imageLoaderLimit: isIPhone() ? 2 : 4,
    // iOS can handle more concurrent loads
    maxTilesPerFrame: isIPhone() ? 3 : 5,
    // Process more tiles per frame
    // Disable problematic features
    flickEnabled: false,
    gestureSettingsTouch: {
      scrollToZoom: false,
      clickToZoom: false,
      dblClickToZoom: true,
      pinchToZoom: true,
      zoomToRefPoint: true,
      flickEnabled: false,
      flickMomentum: 0,
      pinchRotate: false
    },
    // iOS-specific viewport settings
    constrainDuringPan: true,
    visibilityRatio: 1,
    minPixelRatio: 1,
    // Animation settings optimized for HTML rendering
    animationTime: 0.15,
    // Faster animations for responsive feel
    springStiffness: 10,
    // Tighter control
    blendTime: 0.2,
    // Small blend time for smoother transitions
    // Tile settings
    tileSize: 512,
    tileOverlap: 1,
    // CRITICAL: Prefetch adjacent tiles to prevent black tiles
    prefetchTiles: true,
    minLevel: 8,
    // Start loading from a reasonable zoom level
    preserveImageSizeOnResize: true,
    preload: true,
    // Preload adjacent levels
    // Debug info
    debugMode: false,
    showNavigator: false
  };
}
function applyIOSHTMLStyles() {
  if (!isIOS()) return;
  const styleId = "ios-html-critical-css";
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
        /* Critical performance fix - prevent focus outline */
        .openseadragon-canvas:focus,
        .openseadragon-container:focus {
            outline: 0 !important;
        }

        /* Prevent default iOS pan/zoom behavior */
        #viewer,
        .openseadragon-container {
            touch-action: none !important;
            -webkit-touch-callout: none !important;
            -webkit-tap-highlight-color: transparent !important;
        }

        /* Force hardware acceleration for tiles */
        .openseadragon-tile {
            transform: translateZ(0);
            will-change: transform, opacity;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }

        /* Optimize tile rendering */
        .openseadragon-container {
            -webkit-transform: translate3d(0, 0, 0);
            transform: translate3d(0, 0, 0);
        }

        /* Prevent text selection */
        .openseadragon-container * {
            -webkit-user-select: none;
            user-select: none;
        }

        /* Fix for iOS Safari rendering issues */
        .openseadragon-canvas {
            -webkit-transform-style: preserve-3d;
            transform-style: preserve-3d;
        }

        /* Ensure tiles are crisp */
        .openseadragon-tile img {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            loading: eager !important;  /* Force eager loading */
            decoding: sync !important;   /* CRITICAL: Sync decoding prevents black tiles */
        }

        /* Optimize tile container for HTML rendering */
        .openseadragon-tile {
            contain: layout style paint;  /* CSS containment for performance */
            will-change: auto;  /* Let browser optimize */
        }

        /* Force eager loading on all images */
        img[src] {
            loading: eager !important;
            decoding: sync !important;
        }
    `;
  document.head.appendChild(style);
  console.log("[iOS HTML Config] Critical CSS applied for iOS performance");
}
function verifyHTMLDrawer(viewer) {
  var _a, _b;
  if (!viewer || !isIOS()) return;
  const drawerType = ((_b = (_a = viewer.drawer) == null ? void 0 : _a.constructor) == null ? void 0 : _b.name) || typeof viewer.drawer;
  console.log("[iOS HTML Config] Drawer verification:", {
    type: drawerType,
    useCanvas: viewer.useCanvas,
    hasCanvas: !!viewer.canvas,
    hasContainer: !!viewer.container
  });
  if (drawerType === "CanvasDrawer" || viewer.useCanvas === true) {
    console.error("[iOS HTML Config] WARNING: Canvas drawer detected on iOS! This will cause crashes.");
    console.error("[iOS HTML Config] Attempting to force HTML drawer...");
    if (viewer.drawer && viewer.drawer.destroy) {
      viewer.drawer.destroy();
    }
    viewer.useCanvas = false;
  }
  return drawerType;
}
function setupIOSHTMLMonitoring(viewer) {
  if (!viewer || !isIOS()) return;
  let lastInteraction = Date.now();
  let tileCount = 0;
  viewer.addHandler("tile-loaded", () => {
    tileCount++;
    if (tileCount > 100 && isIPhone()) {
      console.warn("[iOS HTML Config] High tile count:", tileCount, "- may impact performance");
    }
  });
  viewer.addHandler("canvas-press", () => {
    lastInteraction = Date.now();
  });
  const cleanupInterval = setInterval(() => {
    if (!viewer || viewer.isDestroyed) {
      clearInterval(cleanupInterval);
      return;
    }
    const timeSinceInteraction = Date.now() - lastInteraction;
    if (timeSinceInteraction > 3e4 && tileCount > 50) {
      console.log("[iOS HTML Config] Cleaning tiles due to inactivity");
      const world = viewer.world;
      if (world && world.getItemAt(0)) {
        const tiledImage = world.getItemAt(0);
        if (tiledImage._tileCache) {
          tiledImage._tileCache.numTilesLoaded = Math.min(30, tiledImage._tileCache.numTilesLoaded);
        }
      }
      tileCount = 30;
    }
  }, 1e4);
  return cleanupInterval;
}
class CinematicZoomManager {
  constructor(viewer, components) {
    this.viewer = viewer;
    this.components = components;
    this.isAnimating = false;
    this.animationEndHandlers = [];
    this.debugMode = true;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.SPRING_CONFIG = {
      desktop: {
        springStiffness: this.reducedMotion ? 150 : 325
      },
      mobile: {
        springStiffness: this.reducedMotion ? 120 : 200
      }
    };
    this.setupAccessibility();
  }
  /**
   * Setup accessibility features
   */
  setupAccessibility() {
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
      this.reducedMotion = e.matches;
      this.updateSpringConfig();
    });
  }
  /**
   * Update spring configuration based on reduced motion preference
   */
  updateSpringConfig() {
    if (this.reducedMotion) {
      this.SPRING_CONFIG.desktop.springStiffness = 150;
      this.SPRING_CONFIG.mobile.springStiffness = 120;
    } else {
      this.SPRING_CONFIG.desktop.springStiffness = 325;
      this.SPRING_CONFIG.mobile.springStiffness = 200;
    }
  }
  /**
   * Simple zoom to target bounds using fitBounds
   */
  async performZoom(targetBounds, options = {}) {
    if (this.isAnimating) {
      console.log("Zoom already in progress");
      return;
    }
    this.isAnimating = true;
    const isMobile2 = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const config = isMobile2 ? this.SPRING_CONFIG.mobile : this.SPRING_CONFIG.desktop;
    const originalSettings = {
      centerXStiffness: this.viewer.viewport.centerSpringX.springStiffness,
      centerYStiffness: this.viewer.viewport.centerSpringY.springStiffness,
      zoomStiffness: this.viewer.viewport.zoomSpring.springStiffness
    };
    this.viewer.viewport.centerSpringX.springStiffness = config.springStiffness;
    this.viewer.viewport.centerSpringY.springStiffness = config.springStiffness;
    this.viewer.viewport.zoomSpring.springStiffness = config.springStiffness;
    if (this.debugMode) {
      console.log("🎯 Starting simple zoom:", {
        springStiffness: config.springStiffness,
        targetBounds
      });
    }
    this.viewer.viewport.fitBounds(targetBounds, false);
    const animationFinishHandler = () => {
      this.isAnimating = false;
      this.viewer.viewport.centerSpringX.springStiffness = originalSettings.centerXStiffness;
      this.viewer.viewport.centerSpringY.springStiffness = originalSettings.centerYStiffness;
      this.viewer.viewport.zoomSpring.springStiffness = originalSettings.zoomStiffness;
      if (options.onComplete) {
        options.onComplete();
      }
      this.animationEndHandlers.forEach((handler) => handler());
      this.animationEndHandlers = [];
      if (this.debugMode) {
        console.log("✅ Simple zoom completed");
      }
      this.viewer.removeHandler("animation-finish", animationFinishHandler);
    };
    this.viewer.addHandler("animation-finish", animationFinishHandler);
    return new Promise((resolve) => {
      this.animationEndHandlers.push(resolve);
    });
  }
  /**
   * Backward compatibility alias
   */
  async performCinematicZoom(targetBounds, options = {}) {
    return this.performZoom(targetBounds, options);
  }
  /**
   * Enable debug mode
   */
  enableDebug() {
    this.debugMode = true;
    console.log("🔍 CinematicZoomManager debug mode enabled");
  }
  /**
   * Get diagnostic info
   */
  getDiagnostics() {
    return {
      isAnimating: this.isAnimating,
      currentZoom: this.viewer.viewport.getZoom(),
      springStiffness: this.viewer.springStiffness
    };
  }
}
class PredictiveTileLoader {
  constructor(viewer) {
    this.viewer = viewer;
    this.enabled = false;
    this.prefetchRadius = 2;
    this.velocityHistory = [];
    this.maxVelocityHistory = 5;
    this.lastPosition = null;
    this.lastUpdateTime = 0;
    this.stats = {
      tilesPreloaded: 0,
      hitRate: 0,
      predictions: 0,
      correctPredictions: 0
    };
    this.updateInterval = 100;
    if (this.viewer) {
      this.initialize();
    }
  }
  initialize() {
    this.viewer.addHandler("viewport-change", (event) => {
      if (!this.enabled) return;
      const now = performance.now();
      if (now - this.lastUpdateTime < this.updateInterval) {
        return;
      }
      const viewport = event.eventSource.viewport;
      const currentPosition = viewport.getCenter(true);
      this.updatePosition(currentPosition);
      this.lastUpdateTime = now;
    });
    console.log("[PredictiveTileLoader] Initialized with prefetch radius:", this.prefetchRadius);
  }
  updatePosition(currentPosition) {
    if (this.lastPosition) {
      const velocity = {
        x: currentPosition.x - this.lastPosition.x,
        y: currentPosition.y - this.lastPosition.y,
        timestamp: performance.now()
      };
      this.velocityHistory.push(velocity);
      if (this.velocityHistory.length > this.maxVelocityHistory) {
        this.velocityHistory.shift();
      }
      const avgVelocity = this.getAverageVelocity();
      if (Math.abs(avgVelocity.x) > 1e-3 || Math.abs(avgVelocity.y) > 1e-3) {
        this.prefetchTiles(currentPosition, avgVelocity);
      }
    }
    this.lastPosition = currentPosition;
  }
  getAverageVelocity() {
    if (this.velocityHistory.length === 0) {
      return { x: 0, y: 0 };
    }
    const sum = this.velocityHistory.reduce((acc, vel) => ({
      x: acc.x + vel.x,
      y: acc.y + vel.y
    }), { x: 0, y: 0 });
    return {
      x: sum.x / this.velocityHistory.length,
      y: sum.y / this.velocityHistory.length
    };
  }
  prefetchTiles(position, velocity) {
    const futurePosition = {
      x: position.x + velocity.x * 3,
      y: position.y + velocity.y * 3
    };
    const zoom = this.viewer.viewport.getZoom();
    const tiledImage = this.viewer.world.getItemAt(0);
    if (!tiledImage) return;
    const bounds = this.viewer.viewport.getBounds();
    const futureBounds = {
      x: futurePosition.x - bounds.width / 2,
      y: futurePosition.y - bounds.height / 2,
      width: bounds.width,
      height: bounds.height
    };
    this.requestTilesInBounds(tiledImage, futureBounds, zoom);
    this.stats.predictions++;
  }
  requestTilesInBounds(tiledImage, bounds, zoom) {
    try {
      const currentBounds = this.viewer.viewport.getBounds();
      const currentZoom = this.viewer.viewport.getZoom();
      const futureCenter = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2
      };
      const viewport = this.viewer.viewport;
      requestAnimationFrame(() => {
        viewport.panTo(futureCenter, true);
        requestAnimationFrame(() => {
          viewport.panTo(viewport.getCenter(currentBounds), true);
        });
      });
      this.stats.tilesPreloaded++;
    } catch (e) {
      console.debug("[PredictiveTileLoader] Prefetch error:", e);
    }
  }
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.predictions > 0 ? (this.stats.correctPredictions / this.stats.predictions * 100).toFixed(1) + "%" : "N/A",
      velocityHistorySize: this.velocityHistory.length
    };
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.velocityHistory = [];
      this.lastPosition = null;
    }
    console.log(`[PredictiveTileLoader] ${enabled ? "Enabled" : "Disabled"}`);
  }
  reset() {
    this.velocityHistory = [];
    this.lastPosition = null;
    this.stats = {
      tilesPreloaded: 0,
      hitRate: 0,
      predictions: 0,
      correctPredictions: 0
    };
  }
  destroy() {
    this.enabled = false;
    this.reset();
  }
}
class VignetteOverlay {
  constructor(viewer) {
    this.viewer = viewer;
    this.vignetteElement = null;
    this.isEnabled = true;
    this.currentOpacity = 0;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile2 = /Android|iPhone|iPad/i.test(navigator.userAgent);
    this.isEnabled = !isMobile2 && !this.reducedMotion;
    if (this.isEnabled) {
      this.createVignetteElement();
      this.setupEventHandlers();
    }
  }
  /**
   * Create the vignette overlay element
   */
  createVignetteElement() {
    this.vignetteElement = document.createElement("div");
    this.vignetteElement.className = "vignette-overlay";
    this.vignetteElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            background: radial-gradient(
                ellipse at center,
                transparent 0%,
                transparent 45%,
                rgba(0,0,0,0.05) 70%,
                rgba(0,0,0,0.15) 100%
            );
            opacity: 0;
            transition: opacity 0.5s ease-out;
            z-index: 10;
            will-change: opacity;
        `;
    this.viewer.element.appendChild(this.vignetteElement);
  }
  /**
   * Setup event handlers for zoom tracking
   */
  setupEventHandlers() {
    this.viewer.addHandler("zoom", (event) => {
      this.updateVignette(event.zoom);
    });
    this.viewer.addHandler("animation-start", () => {
      if (this.vignetteElement) {
        this.vignetteElement.style.transition = "opacity 0.3s ease-out";
      }
    });
    this.viewer.addHandler("animation-finish", () => {
      if (this.vignetteElement) {
        this.vignetteElement.style.transition = "opacity 0.5s ease-out";
      }
    });
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
      if (e.matches) {
        this.disable();
      } else {
        const isMobile2 = /Android|iPhone|iPad/i.test(navigator.userAgent);
        if (!isMobile2) {
          this.enable();
        }
      }
    });
  }
  /**
   * Update vignette opacity based on zoom level
   */
  updateVignette(currentZoom) {
    if (!this.isEnabled || !this.vignetteElement) return;
    const baseZoom = this.viewer.viewport.getHomeZoom();
    const maxZoom = this.viewer.viewport.getMaxZoom();
    const zoomRatio = (currentZoom - baseZoom) / (maxZoom - baseZoom);
    let opacity = 0;
    if (zoomRatio > 0.1) {
      opacity = Math.pow(zoomRatio - 0.1, 1.5) * 0.6;
      opacity = Math.min(opacity, 0.4);
    }
    if (Math.abs(opacity - this.currentOpacity) > 0.01) {
      this.currentOpacity = opacity;
      requestAnimationFrame(() => {
        if (this.vignetteElement) {
          this.vignetteElement.style.opacity = opacity;
        }
      });
    }
  }
  /**
   * Enable vignette effect
   */
  enable() {
    this.isEnabled = true;
    if (!this.vignetteElement) {
      this.createVignetteElement();
      this.setupEventHandlers();
    }
    const currentZoom = this.viewer.viewport.getZoom();
    this.updateVignette(currentZoom);
  }
  /**
   * Disable vignette effect
   */
  disable() {
    this.isEnabled = false;
    if (this.vignetteElement) {
      this.vignetteElement.style.opacity = 0;
    }
  }
  /**
   * Toggle vignette effect
   */
  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.isEnabled;
  }
  /**
   * Destroy vignette overlay
   */
  destroy() {
    if (this.vignetteElement && this.vignetteElement.parentNode) {
      this.vignetteElement.parentNode.removeChild(this.vignetteElement);
      this.vignetteElement = null;
    }
  }
  /**
   * Get current state
   */
  getState() {
    return {
      enabled: this.isEnabled,
      opacity: this.currentOpacity,
      reducedMotion: this.reducedMotion
    };
  }
}
class ImmediateZoomHandler {
  constructor(viewer) {
    this.viewer = viewer;
    this.config = {
      // Base sensitivity at different zoom levels
      sensitivity: {
        low: 0.02,
        // 2% per wheel click at low zoom (<5x)
        medium: 0.015,
        // 1.5% per wheel click at medium zoom (5-20x)
        high: 0.01
        // 1% per wheel click at high zoom (>20x)
      },
      // Zoom level thresholds
      thresholds: {
        medium: 5,
        high: 20
      },
      // Mouse wheel produces discrete steps
      discreteSteps: {
        zoomIn: 1.12,
        // 12% zoom in per click
        zoomOut: 0.89
        // ~11% zoom out per click (1/1.12)
      }
    };
    this.setupWheelHandler();
  }
  /**
   * Normalize wheel delta across browsers
   * Based on normalize-wheel library approach
   */
  normalizeWheelDelta(event) {
    let deltaY = event.deltaY;
    if (event.deltaMode === 1) {
      deltaY *= 40;
    } else if (event.deltaMode === 2) {
      deltaY *= 800;
    }
    return deltaY;
  }
  /**
   * Detect if input is from trackpad or mouse
   */
  detectInputDevice(event) {
    if (!Number.isInteger(event.deltaY) || event.deltaX !== 0) {
      return "trackpad";
    }
    return Math.abs(event.deltaY) >= 50 ? "mouse" : "trackpad";
  }
  /**
   * Get adaptive sensitivity based on current zoom level
   */
  getAdaptiveSensitivity(currentZoom) {
    const { sensitivity, thresholds } = this.config;
    if (currentZoom < thresholds.medium) {
      return sensitivity.low;
    } else if (currentZoom < thresholds.high) {
      return sensitivity.medium;
    } else {
      return sensitivity.high;
    }
  }
  /**
   * Setup the wheel event handler
   */
  setupWheelHandler() {
    const canvas = this.viewer.canvas;
    this.viewer.removeAllHandlers("canvas-scroll");
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const device = this.detectInputDevice(event);
      const currentZoom = this.viewer.viewport.getZoom();
      const rect = canvas.getBoundingClientRect();
      const viewportPoint = this.viewer.viewport.pointFromPixel(
        new OpenSeadragon.Point(
          event.clientX - rect.left,
          event.clientY - rect.top
        )
      );
      let zoomFactor;
      if (device === "mouse") {
        const { discreteSteps } = this.config;
        let stepMultiplier = 1;
        if (currentZoom > 20) {
          stepMultiplier = 0.5;
        }
        if (event.deltaY < 0) {
          zoomFactor = Math.pow(discreteSteps.zoomIn, stepMultiplier);
        } else {
          zoomFactor = Math.pow(discreteSteps.zoomOut, stepMultiplier);
        }
      } else {
        const normalizedDelta = this.normalizeWheelDelta(event);
        const sensitivity = this.getAdaptiveSensitivity(currentZoom);
        zoomFactor = Math.exp(-normalizedDelta * sensitivity);
        zoomFactor = Math.max(0.9, Math.min(1.1, zoomFactor));
      }
      this.applyZoom(zoomFactor, viewportPoint);
    }, { passive: false });
  }
  /**
   * Apply zoom with constraints
   */
  applyZoom(zoomFactor, centerPoint) {
    const currentZoom = this.viewer.viewport.getZoom();
    const targetZoom = currentZoom * zoomFactor;
    const minZoom = this.viewer.viewport.getMinZoom();
    const maxZoom = this.viewer.viewport.getMaxZoom();
    const constrainedZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));
    if (Math.abs(constrainedZoom - currentZoom) > 1e-4) {
      this.viewer.viewport.zoomTo(constrainedZoom, centerPoint, true);
      this.viewer.viewport.applyConstraints(true);
      this.viewer.forceRedraw();
    }
  }
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Destroy handler and cleanup
   */
  destroy() {
    this.viewer = null;
  }
}
class ViewportManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.cacheEnabled = true;
    this.cacheTimeout = 50;
    this.lastUpdate = 0;
    this.cachedViewport = null;
    this.viewportPadding = 0.2;
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      lastUpdateDuration: 0,
      totalUpdates: 0,
      averageUpdateTime: 0
    };
    this.boundUpdate = this.update.bind(this);
  }
  /**
   * Get current viewport data with intelligent caching
   */
  getCurrentViewport() {
    const now = performance.now();
    if (this.cacheEnabled && this.cachedViewport && now - this.lastUpdate < this.cacheTimeout) {
      this.metrics.cacheHits++;
      return this.cachedViewport;
    }
    this.metrics.cacheMisses++;
    return this.update();
  }
  /**
   * Force update viewport data
   */
  update() {
    const startTime = performance.now();
    const viewport = this.viewer.viewport;
    const bounds = viewport.getBounds();
    const topLeft = viewport.viewportToImageCoordinates(bounds.getTopLeft());
    const bottomRight = viewport.viewportToImageCoordinates(bounds.getBottomRight());
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;
    const paddingX = width * this.viewportPadding;
    const paddingY = height * this.viewportPadding;
    const tiledImage = this.viewer.world.getItemAt(0);
    const imageSize = tiledImage ? tiledImage.getContentSize() : { x: 1, y: 1 };
    const paddedBounds = {
      minX: Math.max(0, topLeft.x - paddingX),
      minY: Math.max(0, topLeft.y - paddingY),
      maxX: Math.min(imageSize.x, bottomRight.x + paddingX),
      maxY: Math.min(imageSize.y, bottomRight.y + paddingY)
    };
    const viewportData = {
      bounds: paddedBounds,
      zoom: viewport.getZoom(true),
      center: viewport.getCenter(true),
      rotation: viewport.getRotation(),
      containerSize: viewport.getContainerSize(),
      imageBounds: {
        minX: topLeft.x,
        minY: topLeft.y,
        maxX: bottomRight.x,
        maxY: bottomRight.y
      },
      pixelRatio: this.calculatePixelRatio(),
      levelOfDetail: this.getLevelOfDetail()
    };
    this.cachedViewport = viewportData;
    this.lastUpdate = performance.now();
    const updateTime = this.lastUpdate - startTime;
    this.metrics.lastUpdateDuration = updateTime;
    this.metrics.totalUpdates++;
    this.metrics.averageUpdateTime = (this.metrics.averageUpdateTime * (this.metrics.totalUpdates - 1) + updateTime) / this.metrics.totalUpdates;
    return viewportData;
  }
  /**
   * Check if a point is within the current viewport
   */
  isPointInViewport(x, y, usePadding = false) {
    const viewport = this.getCurrentViewport();
    const bounds = usePadding ? viewport.bounds : viewport.imageBounds;
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
  }
  /**
   * Check if a bounding box intersects the viewport
   */
  isBoxInViewport(minX, minY, maxX, maxY, usePadding = true) {
    const viewport = this.getCurrentViewport();
    const bounds = usePadding ? viewport.bounds : viewport.imageBounds;
    return !(maxX < bounds.minX || minX > bounds.maxX || maxY < bounds.minY || minY > bounds.maxY);
  }
  /**
   * Convert image coordinates to viewport pixel coordinates
   */
  imageToPixel(imageX, imageY) {
    const viewportPoint = this.viewer.viewport.imageToViewportCoordinates(
      new OpenSeadragon.Point(imageX, imageY)
    );
    return this.viewer.viewport.pixelFromPoint(viewportPoint);
  }
  /**
   * Convert viewport pixel coordinates to image coordinates
   */
  pixelToImage(pixelX, pixelY) {
    const viewportPoint = this.viewer.viewport.pointFromPixel(
      new OpenSeadragon.Point(pixelX, pixelY)
    );
    return this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
  }
  /**
   * Calculate the current pixel ratio (pixels per image unit)
   */
  calculatePixelRatio() {
    const viewport = this.viewer.viewport;
    const containerSize = viewport.getContainerSize();
    const bounds = viewport.getBounds();
    const tiledImage = this.viewer.world.getItemAt(0);
    if (!tiledImage) return 1;
    const imageSize = tiledImage.getContentSize();
    const viewportWidthInImageUnits = bounds.width * imageSize.x;
    return containerSize.x / viewportWidthInImageUnits;
  }
  /**
   * Get level of detail based on current zoom
   */
  getLevelOfDetail() {
    const zoom = this.viewer.viewport.getZoom(true);
    const maxZoom = this.viewer.viewport.getMaxZoom();
    const normalized = zoom / maxZoom;
    if (normalized < 0.1) return 0;
    if (normalized < 0.3) return 1;
    if (normalized < 0.6) return 2;
    return 3;
  }
  /**
   * Check if we should render high quality based on zoom level
   */
  shouldRenderHighQuality() {
    return this.getLevelOfDetail() >= 2;
  }
  /**
   * Get viewport area as percentage of total image
   */
  getViewportCoverage() {
    const viewport = this.getCurrentViewport();
    const tiledImage = this.viewer.world.getItemAt(0);
    if (!tiledImage) return 1;
    const imageSize = tiledImage.getContentSize();
    const viewportArea = (viewport.imageBounds.maxX - viewport.imageBounds.minX) * (viewport.imageBounds.maxY - viewport.imageBounds.minY);
    const totalArea = imageSize.x * imageSize.y;
    return viewportArea / totalArea;
  }
  /**
   * Get viewport metrics for performance monitoring
   */
  getMetrics() {
    const cacheEfficiency = this.metrics.cacheHits + this.metrics.cacheMisses > 0 ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100 : 0;
    return {
      ...this.metrics,
      cacheEfficiency: cacheEfficiency.toFixed(1) + "%",
      currentZoom: this.viewer.viewport.getZoom(true).toFixed(2),
      viewportCoverage: (this.getViewportCoverage() * 100).toFixed(1) + "%"
    };
  }
  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      lastUpdateDuration: 0,
      totalUpdates: 0,
      averageUpdateTime: 0
    };
  }
  /**
   * Get visible area in image coordinates
   */
  getVisibleImageArea() {
    const viewport = this.getCurrentViewport();
    return {
      x: viewport.imageBounds.minX,
      y: viewport.imageBounds.minY,
      width: viewport.imageBounds.maxX - viewport.imageBounds.minX,
      height: viewport.imageBounds.maxY - viewport.imageBounds.minY
    };
  }
  /**
   * Enable or disable caching
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.cachedViewport = null;
    }
  }
  /**
   * Set cache timeout
   */
  setCacheTimeout(timeout) {
    this.cacheTimeout = Math.max(0, timeout);
  }
  /**
   * Set viewport padding for preloading
   */
  setViewportPadding(padding) {
    this.viewportPadding = Math.max(0, Math.min(1, padding));
  }
  /**
   * Clean up
   */
  destroy() {
    this.viewer = null;
    this.cachedViewport = null;
  }
}
class FrameSkipManager {
  constructor(viewer, isMobile2 = false) {
    this.viewer = viewer;
    this.isMobile = isMobile2;
    this.enabled = isMobile2;
    this.targetFPS = isMobile2 ? 45 : 60;
    this.frameInterval = 1e3 / this.targetFPS;
    this.lastFrameTime = 0;
    this.skipCount = 0;
    this.maxSkipCount = 2;
    this.frameTimes = [];
    this.maxFrameTimeSamples = 10;
    this.isInteracting = false;
    this.fastMotion = false;
    if (this.enabled) {
      this.setupInterceptor();
      console.log("FrameSkipManager: Enabled for mobile performance");
    }
  }
  setupInterceptor() {
    if (!this.viewer) return;
    this.originalForceRedraw = this.viewer.forceRedraw.bind(this.viewer);
    this.viewer.forceRedraw = () => {
      if (!this.enabled || this.isInteracting) {
        return this.originalForceRedraw();
      }
      const now = performance.now();
      const deltaTime = now - this.lastFrameTime;
      this.updateFrameStats(deltaTime);
      if (this.shouldSkipFrame(deltaTime)) {
        this.skipCount++;
        return;
      }
      this.skipCount = 0;
      this.lastFrameTime = now;
      return this.originalForceRedraw();
    };
    this.viewer.addHandler("animation-start", () => {
      this.isInteracting = true;
      this.skipCount = 0;
    });
    this.viewer.addHandler("animation-finish", () => {
      this.isInteracting = false;
      this.fastMotion = false;
      this.skipCount = 0;
      this.originalForceRedraw();
    });
    let lastCenter = null;
    let lastZoom = null;
    this.viewer.addHandler("viewport-change", () => {
      if (!this.isInteracting) return;
      const center = this.viewer.viewport.getCenter();
      const zoom = this.viewer.viewport.getZoom();
      if (lastCenter && lastZoom) {
        const centerDelta = Math.sqrt(
          Math.pow(center.x - lastCenter.x, 2) + Math.pow(center.y - lastCenter.y, 2)
        );
        const zoomDelta = Math.abs(zoom - lastZoom);
        this.fastMotion = centerDelta > 0.05 || zoomDelta > 0.1;
      }
      lastCenter = center;
      lastZoom = zoom;
    });
  }
  shouldSkipFrame(deltaTime) {
    if (this.skipCount >= this.maxSkipCount) {
      return false;
    }
    if (deltaTime < this.frameInterval * 0.8) {
      return true;
    }
    if (this.fastMotion && this.getAverageFrameTime() > this.frameInterval * 1.2) {
      return true;
    }
    if (this.getAverageFrameTime() > this.frameInterval * 1.5) {
      return true;
    }
    return false;
  }
  updateFrameStats(deltaTime) {
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxFrameTimeSamples) {
      this.frameTimes.shift();
    }
  }
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return this.frameInterval;
    const sum = this.frameTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.frameTimes.length;
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.skipCount = 0;
      this.isInteracting = false;
      this.fastMotion = false;
    }
    console.log(`FrameSkipManager: ${enabled ? "Enabled" : "Disabled"}`);
  }
  getStats() {
    const avgFrameTime = this.getAverageFrameTime();
    const estimatedFPS = avgFrameTime > 0 ? 1e3 / avgFrameTime : 0;
    return {
      enabled: this.enabled,
      isInteracting: this.isInteracting,
      fastMotion: this.fastMotion,
      currentSkipCount: this.skipCount,
      averageFrameTime: avgFrameTime.toFixed(2),
      estimatedFPS: estimatedFPS.toFixed(1),
      targetFPS: this.targetFPS
    };
  }
  destroy() {
    if (this.viewer && this.originalForceRedraw) {
      this.viewer.forceRedraw = this.originalForceRedraw;
    }
  }
}
const performanceConfig = {
  qualityPreservation: {
    minVisibleAreaDesktop: 600,
    minVisibleAreaMobile: 400,
    maxZoomForQuality: 15,
    adaptivePaddingEnabled: true
  },
  // OpenSeadragon viewer settings - OPTIMIZED BASED ON RESEARCH FOR 45-60 FPS
  viewer: {
    // CRITICAL: Tile loading optimization for mobile
    imageLoaderLimit: 1,
    // RESEARCH: Single concurrent tile request prevents saturation
    maxImageCacheCount: 100,
    // RESEARCH: Optimal for 4GB RAM devices (~480MB)
    // Tile loading strategy
    minPixelRatio: 1,
    // RESEARCH: Full quality at rest
    minZoomImageRatio: 0.8,
    // Conservative tile loading to reduce cascade
    smoothTileEdgesMinZoom: Infinity,
    // Complete disable for performance
    alwaysBlend: false,
    // CRITICAL: Disable blending for mobile performance
    // Rendering settings - BALANCED FOR SMOOTH INTERACTIONS
    immediateRender: true,
    // CRITICAL: Force immediate rendering
    preserveViewport: true,
    preserveImageSizeOnResize: true,
    visibilityRatio: 1,
    // RESEARCH: Prevent off-screen rendering
    subPixelRendering: false,
    // Disable for performance
    imageSmoothingEnabled: true,
    // Keep for clean rendering
    // Preload settings
    preload: true,
    placeholderFillStyle: "transparent",
    // MOBILE OPTIMIZATION: Reduce rendering overhead
    // Mobile optimizations from research
    subPixelRoundingEnabled: false,
    // MOBILE OPTIMIZATION: Reduce GPU load
    // RESEARCH-BASED ANIMATION SETTINGS FOR NATURAL FEEL
    animationTime: 0.3,
    // RESEARCH: Optimal balance of speed and smoothness
    springStiffness: 12,
    // MOBILE OPTIMIZATION: Increased from 10.0 for tighter control
    blendTime: 0.3,
    // RESEARCH: Match animationTime for consistency
    flickEnabled: true,
    flickMinSpeed: 120,
    flickMomentum: 0.25,
    // Zoom settings - OPTIMIZED FOR SMOOTH LOW ZOOM PERFORMANCE
    zoomPerScroll: 1.1,
    // Smaller steps reduce tile loading spikes
    zoomPerClick: 1.5,
    // Prevent excessive zoom jumps
    minZoomLevel: 0.8,
    // Prevent extreme zoom out performance issues
    maxZoomLevel: 40,
    defaultZoomLevel: 1.1,
    // PERFORMANCE-CRITICAL: Limit pixel density to prevent retina scaling issues
    maxZoomPixelRatio: 1.5,
    // Research shows 1.5 prevents retina performance issues
    // Network optimization
    loadTilesWithAjax: true,
    ajaxHeaders: {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    timeout: 6e4,
    // Shorter timeout
    // Tile quality settings - LOW ZOOM PERFORMANCE CRITICAL
    minZoomImageRatio: 0.8,
    // Conservative tile loading
    maxTilesPerFrame: 2,
    // CRITICAL: Limit to 2 for mobile performance
    tileRetryMax: 1,
    // Fewer retries
    tileRetryDelay: 50,
    // STEP 4: Reduced from 100ms
    minimumPixelsPerTile: 24,
    // Skip smaller tiles to reduce load
    // RESEARCH: Visual artifact elimination settings - fine-tunable via debug
    artifactElimination: {
      enableTileCascadePrevention: true,
      enableBlendingOptimization: true,
      enableMouseWheelSmoothing: true,
      enableProgressiveQuality: true
    },
    // Rendering
    compositeOperation: null,
    smoothImageZoom: false,
    // Disable for performance
    // Constraints
    constrainDuringPan: true,
    wrapHorizontal: false,
    wrapVertical: false,
    // Navigation
    navigatorAutoResize: true,
    showNavigator: false,
    // Drawer selection (will be overridden by browser detection)
    drawer: "canvas",
    debugMode: false,
    // WebGL options when used
    webglOptions: {
      antialias: false,
      // Disable for performance
      preserveDrawingBuffer: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance"
    }
  },
  // Tile settings - 1024px for performance
  tiles: {
    tileSize: 1024,
    overlap: 2,
    jpegQuality: 70,
    // OPTIMIZED: 2-3x smaller files with imperceptible quality difference
    format: "jpeg",
    enableWebP: false
    // TODO: Enable WebP for 30% additional savings
  },
  // STEP 4 OPTIMIZATION: Hotspot rendering optimized for animation performance
  hotspots: {
    batchSize: 20,
    // STEP 4: Reduced from 25 for faster processing
    visibilityCheckInterval: 150,
    // STEP 4: Faster updates (reduced from 200ms)
    renderDebounceTime: 16,
    // STEP 4: 60 FPS target (reduced from 32ms)
    fadeInDuration: 0,
    // Instant appearance
    preloadPadding: 0.1,
    // Minimal padding
    maxVisibleHotspots: 20,
    // STEP 4: Further reduced from 25
    minZoomForHotspots: 4,
    // Higher threshold - less hotspots at low zoom
    // STEP 4: New animation-specific settings
    animationBatchSize: 10,
    // Process animations in smaller batches
    animationFrameBudget: 12,
    // 12ms budget per frame for animations
    maxConcurrentAnimations: 8
    // STEP 4: Reduced concurrent animations
  },
  // Audio settings
  audio: {
    preloadCount: 5,
    crossfadeDuration: 150,
    // STEP 4: Reduced from 200ms
    bufferSize: 5,
    html5PoolSize: 5,
    autoUnlock: true
  },
  // STEP 4 OPTIMIZATION: Viewport management for faster updates
  viewport: {
    cacheEnabled: true,
    cacheTimeout: 8,
    // STEP 4: Reduced from 16ms for faster cache
    updateDebounce: 4,
    // STEP 4: Reduced from 8ms for quicker updates
    preloadPadding: 0.15
    // STEP 4: Reduced from 0.2 to load less
  },
  // Memory management
  memory: {
    maxCachedImages: 250,
    // STEP 4: Reduced from 300 for faster GC
    maxCachedAudio: 8,
    // STEP 4: Reduced from 10
    gcInterval: 2e4,
    // STEP 4: More frequent GC (reduced from 30000ms)
    lowMemoryThreshold: 80,
    // STEP 4: Lower threshold (reduced from 100MB)
    criticalMemoryThreshold: 150
    // STEP 4: Lower critical threshold (reduced from 200MB)
  },
  // Network
  network: {
    maxConcurrentRequests: 4,
    // STEP 4: Reduced from 6 to prevent congestion
    retryAttempts: 1,
    retryDelay: 50,
    // STEP 4: Reduced from 100ms
    timeout: 45e3,
    // STEP 4: Reduced from 60000ms
    useCDN: true
  },
  // MOBILE OPTIMIZATION: Critical research-based settings for 45 FPS target
  mobile: {
    reduceQuality: false,
    // Keep quality, optimize elsewhere
    maxZoomLevel: 20,
    touchSensitivity: 1,
    doubleTapDelay: 250,
    // STEP 4: Reduced from 300ms
    maxImageCacheCount: 25,
    // BALANCED: Small cache to prevent constant reloads
    imageLoaderLimit: 1,
    // RESEARCH: Single tile loader optimal
    animationTime: 0.3,
    // RESEARCH: 0.3s optimal for mobile
    springStiffness: 12,
    // MOBILE OPTIMIZATION: Increased for tighter control
    immediateRender: true,
    // CRITICAL: Force immediate rendering
    blendTime: 0.3,
    // RESEARCH: Match animationTime
    maxTilesPerFrame: 2,
    // RESEARCH: Limit simultaneous processing
    minPixelRatio: 1,
    // RESEARCH: Full quality at rest
    minZoomImageRatio: 0.8,
    // Keep conservative for low zoom
    visibilityRatio: 1,
    // RESEARCH: Only visible tiles
    smoothTileEdgesMinZoom: Infinity,
    // Complete disable
    alwaysBlend: false,
    // CRITICAL: Research shows this causes mobile issues
    debugMode: false,
    preserveImageSizeOnResize: true,
    // Prevent expensive recalculations
    maxZoomPixelRatio: 1,
    // EMERGENCY: No retina scaling
    // STEP 4: ULTRA-OPTIMIZED MOBILE GESTURE SETTINGS
    constrainDuringPan: true,
    // Prevent expensive constraint calculations
    gestureSettingsTouch: {
      scrollToZoom: false,
      clickToZoom: false,
      dblClickToZoom: false,
      flickEnabled: true,
      flickMinSpeed: 150,
      // STEP 4: Higher threshold (increased from 200)
      flickMomentum: 0.05,
      // STEP 4: Minimal momentum (reduced from 0.1)
      pinchToZoom: true,
      dragToPan: true,
      pinchRotate: false
    }
  },
  // STEP 4 OPTIMIZATION: Ultra-aggressive render optimization
  renderOptimization: {
    enableAdaptiveRendering: true,
    animationEndDelay: 25,
    // STEP 4: Ultra-fast transition (reduced from 50ms)
    pixelPerfectDelay: 15,
    // STEP 4: Faster pixel perfect (reduced from 30ms)
    zoomThreshold: 5e-3,
    // STEP 4: More sensitive to zoom changes
    panThreshold: 5e-3,
    // STEP 4: More sensitive to pan changes
    smoothTransitionDuration: 50,
    // STEP 4: Much faster transitions (reduced from 100ms)
    useWebGL: false,
    // Default to canvas
    forceIntegerPositions: true,
    // STEP 4: Ultra-aggressive zoom optimizations
    zoomOptimizations: {
      reduceBlendTime: true,
      targetBlendTime: 0,
      increaseStiffness: true,
      targetStiffness: 18,
      // STEP 4: Even higher stiffness (increased from 12.0)
      forceImmediateRender: true,
      disableSmoothing: true,
      reduceTilesPerFrame: true,
      targetTilesPerFrame: 2
      // STEP 4: Reduced from 3
    }
  },
  // Debug
  debug: {
    showFPS: false,
    // Off by default
    showMetrics: true,
    logPerformance: false,
    warnThreshold: {
      fps: 45,
      renderTime: 20,
      // STEP 4: Stricter threshold (reduced from 33ms)
      visibleHotspots: 100
      // STEP 4: Lower threshold (reduced from 150)
    }
  }
};
const detectPlatform = () => {
  var _a;
  const ua = navigator.userAgent.toLowerCase();
  const platform2 = navigator.platform.toLowerCase();
  return {
    // Browser detection
    isSafari: /^((?!chrome|android|crios|fxios).)*safari/i.test(ua),
    isChrome: /chrome|crios/i.test(ua) && !/edge|edg/i.test(ua),
    isFirefox: /firefox|fxios/i.test(ua),
    isEdge: /edge|edg/i.test(ua),
    // OS detection
    isIOS: /ipad|iphone|ipod/.test(ua) || platform2 === "macintel" && navigator.maxTouchPoints > 1,
    isAndroid: /android/.test(ua),
    isMac: /mac/.test(platform2),
    isWindows: /win/.test(platform2),
    // Device capabilities
    isMobile: /android|iphone|ipad|ipod/i.test(ua) || platform2 === "macintel" && navigator.maxTouchPoints > 1,
    isTablet: /ipad|android(?!.*mobile)/i.test(ua) || platform2 === "macintel" && navigator.maxTouchPoints > 1,
    hasTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    // Performance indicators
    isLowEndDevice: navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2,
    isHighEndDevice: navigator.hardwareConcurrency >= 8 && navigator.deviceMemory >= 8,
    deviceMemory: navigator.deviceMemory || 4,
    cpuCores: navigator.hardwareConcurrency || 4,
    connectionType: ((_a = navigator.connection) == null ? void 0 : _a.effectiveType) || "4g",
    // Display
    pixelRatio: window.devicePixelRatio || 1,
    isHighDPI: window.devicePixelRatio > 1.5
  };
};
const applyPlatformOptimizations = () => {
  const platform2 = detectPlatform();
  if (platform2.isSafari || platform2.isIOS) {
    performanceConfig.viewer.drawer = "canvas";
    if (platform2.isSafari && !platform2.isIOS) {
      performanceConfig.viewer.imageLoaderLimit = platform2.isHighEndDevice ? 4 : 2;
      performanceConfig.viewer.maxImageCacheCount = 100;
      performanceConfig.viewer.maxTilesPerFrame = 3;
      performanceConfig.viewer.animationTime = 1;
      performanceConfig.viewer.springStiffness = 7;
      performanceConfig.viewer.blendTime = 0;
      performanceConfig.viewer.minPixelRatio = 0.5;
      performanceConfig.viewer.immediateRender = true;
    }
    if (platform2.isIOS) {
      performanceConfig.viewer.imageLoaderLimit = 2;
      performanceConfig.viewer.maxImageCacheCount = 50;
      performanceConfig.viewer.maxTilesPerFrame = 2;
      performanceConfig.viewer.animationTime = 0.15;
      performanceConfig.viewer.springStiffness = 15;
      performanceConfig.viewer.blendTime = 0;
      performanceConfig.viewer.minPixelRatio = 1;
      performanceConfig.viewer.immediateRender = true;
      performanceConfig.viewer.alwaysBlend = false;
      performanceConfig.viewer.smoothTileEdgesMinZoom = Infinity;
      performanceConfig.viewer.gestureSettingsTouch = {
        flickEnabled: true,
        flickMinSpeed: 120,
        flickMomentum: 0.35,
        pinchRotate: false
        // Disable for performance
      };
    }
    performanceConfig.viewer.imageSmoothingEnabled = false;
    performanceConfig.viewer.smoothTileEdgesMinZoom = Infinity;
    performanceConfig.viewer.updatePixelDensityRatio = false;
    performanceConfig.viewer.placeholderFillStyle = null;
    performanceConfig.viewer.opacity = 1;
    performanceConfig.viewer.preload = false;
    performanceConfig.viewer.compositeOperation = null;
    performanceConfig.viewer.subPixelRoundingForTransparency = "NEVER";
    console.log("Safari detected - applied research-based 50-60 FPS optimizations", {
      platform: platform2.isIOS ? "iOS" : "Desktop",
      imageLoaderLimit: performanceConfig.viewer.imageLoaderLimit,
      blendTime: performanceConfig.viewer.blendTime
    });
  }
  if (platform2.isAndroid) {
    performanceConfig.viewer.drawer = "canvas";
    performanceConfig.viewer.imageSmoothingEnabled = false;
    console.log("Android detected - applying STEP 4 optimizations");
  }
  if (platform2.isMobile) {
    Object.assign(performanceConfig.viewer, {
      // RESEARCH CRITICAL: Force canvas on ALL mobile devices
      drawer: "canvas",
      // Research: WebGL causes 15 FPS drop on mobile
      imageLoaderLimit: 2,
      // Increased for better tile loading on mobile
      maxImageCacheCount: 80,
      // Reduced cache to prevent memory pressure
      // RESEARCH-BASED: Natural animation settings
      animationTime: 0.3,
      // RESEARCH: 0.3s provides natural feel
      springStiffness: 12,
      // MOBILE OPTIMIZATION: Increased for tighter control
      immediateRender: true,
      // CRITICAL: Eliminate render delays
      blendTime: 0.3,
      // RESEARCH: Match animationTime
      // RESEARCH: Balanced mobile optimizations
      smoothImageZoom: false,
      maxTilesPerFrame: 1,
      // Single tile per frame for stability
      visibilityRatio: 1.2,
      // Small prefetch for smoother scrolling
      minPixelRatio: 1,
      // RESEARCH: Full quality at rest
      minZoomImageRatio: 0.5,
      // OPTIMIZED: Load tiles earlier for smoothness
      smoothTileEdgesMinZoom: Infinity,
      // Research: Complete disable for performance
      alwaysBlend: false,
      // RESEARCH CRITICAL: Major mobile performance killer
      preserveImageSizeOnResize: true,
      maxZoomPixelRatio: 1,
      // STEP 4: No retina scaling for speed
      // RESEARCH: Additional mobile-specific optimizations
      imageSmoothingEnabled: false,
      // Research: Disable for better mobile performance
      updatePixelDensityRatio: false,
      // Research: Prevent expensive updates during zoom
      constrainDuringPan: true,
      // Research: Prevent expensive calculations
      subPixelRendering: false,
      // Research: Disable for better performance
      minimumPixelsPerTile: 40,
      // STEP 4: Higher threshold (increased from 32)
      // STEP 4: ULTRA-OPTIMIZED touch settings
      gestureSettingsTouch: {
        scrollToZoom: false,
        // Research: Prevent scroll conflicts
        clickToZoom: false,
        dblClickToZoom: false,
        flickEnabled: true,
        flickMinSpeed: 150,
        // STEP 4: Higher threshold for control
        flickMomentum: 0.05,
        // STEP 4: Minimal momentum for responsiveness
        pinchToZoom: true,
        dragToPan: true,
        pinchRotate: false
        // Research: Disable for performance
      }
    });
    performanceConfig.hotspots.batchSize = 15;
    performanceConfig.hotspots.maxVisibleHotspots = 15;
    performanceConfig.hotspots.renderDebounceTime = 8;
    performanceConfig.memory.maxCachedImages = 30;
    console.log("Mobile device detected - applied STEP 4 ultra-aggressive optimizations");
  }
  if (platform2.isLowEndDevice) {
    performanceConfig.viewer.animationTime = 0.15;
    performanceConfig.viewer.springStiffness = 18;
    performanceConfig.viewer.maxImageCacheCount = Math.min(100, performanceConfig.viewer.maxImageCacheCount);
    performanceConfig.viewer.imageLoaderLimit = 1;
    performanceConfig.viewer.maxTilesPerFrame = 1;
    performanceConfig.memory.maxCachedImages = 100;
    performanceConfig.network.maxConcurrentRequests = 2;
    performanceConfig.hotspots.maxVisibleHotspots = 30;
    performanceConfig.viewer.minPixelRatio = 0.8;
    console.log("Low-end device detected - applied STEP 4 ultra-conservative settings");
  }
  if (platform2.isHighEndDevice && !platform2.isMobile) {
    performanceConfig.viewer.maxImageCacheCount = 600;
    performanceConfig.viewer.imageLoaderLimit = 6;
    performanceConfig.viewer.maxTilesPerFrame = 4;
    performanceConfig.memory.maxCachedImages = 400;
    performanceConfig.network.maxConcurrentRequests = 6;
    performanceConfig.viewer.minPixelRatio = 0.4;
    performanceConfig.viewer.maxZoomPixelRatio = 8;
    console.log("High-end device detected - applied STEP 4 balanced performance/quality");
  }
  if (platform2.isHighDPI && !platform2.isMobile) {
    performanceConfig.viewer.minPixelRatio = Math.min(0.5, performanceConfig.viewer.minPixelRatio);
    performanceConfig.viewer.maxZoomPixelRatio = Math.max(4, platform2.pixelRatio * 2);
  }
  if (platform2.connectionType === "slow-2g" || platform2.connectionType === "2g") {
    performanceConfig.viewer.imageLoaderLimit = 1;
    performanceConfig.network.maxConcurrentRequests = 1;
    performanceConfig.viewer.timeout = 9e4;
    console.log("Slow connection detected - applied STEP 4 minimal network usage");
  }
  return platform2;
};
const platform = applyPlatformOptimizations();
function adjustSettingsForPerformance(currentFPS, memoryUsage) {
  const config = performanceConfig;
  const isMobile2 = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isSafariDesktop = isSafari && !isMobile2;
  let emergencyThreshold, poorThreshold;
  if (isSafariDesktop) {
    emergencyThreshold = 8;
    poorThreshold = 20;
  } else if (isMobile2) {
    emergencyThreshold = 15;
    poorThreshold = 30;
  } else {
    emergencyThreshold = 20;
    poorThreshold = 35;
  }
  if (currentFPS < emergencyThreshold && currentFPS > 0) {
    if (isSafari) {
      config.viewer.imageLoaderLimit = 1;
      config.viewer.maxTilesPerFrame = 1;
      config.viewer.blendTime = 0;
      config.viewer.maxImageCacheCount = 25;
      config.viewer.minPixelRatio = 1.2;
      config.viewer.immediateRender = true;
      config.viewer.animationTime = 0.5;
      config.viewer.springStiffness = 10;
    } else {
      config.viewer.imageLoaderLimit = 1;
      config.viewer.maxTilesPerFrame = 1;
      config.viewer.animationTime = 0.1;
      config.viewer.springStiffness = 20;
      config.viewer.immediateRender = true;
      config.viewer.blendTime = 0;
      config.viewer.maxImageCacheCount = 25;
      config.viewer.minPixelRatio = 1;
    }
    console.error("SAFARI FIX: Emergency performance mode activated");
    return "ultra-emergency";
  }
  if (currentFPS < poorThreshold && currentFPS > 0) {
    config.viewer.imageLoaderLimit = Math.max(1, config.viewer.imageLoaderLimit - 1);
    config.viewer.maxTilesPerFrame = Math.max(1, config.viewer.maxTilesPerFrame - 1);
    config.viewer.animationTime = 0.25;
    config.viewer.springStiffness = 12;
    return "reduced";
  }
  if (currentFPS > 55) {
    const targetConfig = platform.isHighEndDevice ? 6 : platform.isMobile ? 1 : 4;
    if (config.viewer.imageLoaderLimit < targetConfig) {
      config.viewer.imageLoaderLimit = Math.min(targetConfig, config.viewer.imageLoaderLimit + 1);
    }
    if (config.viewer.maxTilesPerFrame < 3) {
      config.viewer.maxTilesPerFrame = Math.min(3, config.viewer.maxTilesPerFrame + 1);
    }
    config.viewer.animationTime = platform.isMobile ? 0.2 : 0.3;
    config.viewer.springStiffness = platform.isMobile ? 15 : 12;
    config.viewer.minPixelRatio = platform.isMobile ? 0.8 : 0.5;
    return "normal";
  }
  if (memoryUsage > config.memory.criticalMemoryThreshold) {
    config.viewer.maxImageCacheCount = Math.max(25, Math.floor(config.viewer.maxImageCacheCount * 0.4));
    config.hotspots.maxVisibleHotspots = Math.max(10, Math.floor(config.hotspots.maxVisibleHotspots * 0.5));
    console.warn(`STEP 4: High memory usage: ${memoryUsage}MB - Applied aggressive reduction`);
    return "memory-limited";
  }
  return "normal";
}
const buildViewerConfig = (config, dziUrl, drawerType, isMobileDevice, tileSourceConfig = null) => {
  const isIOS2 = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (isIOS2 && isMobileDevice) {
    console.log("[CRITICAL] iOS detected: Forcing canvas drawer to prevent tile array corruption at indices 12/13");
  }
  if (isMobileDevice) {
    const isIPadPro = isIOS2 && window.screen.width >= 1024;
    const isIPadAir = isIOS2 && !isIPadPro && window.screen.width >= 820;
    const isStandardIPad = isIOS2 && !isIPadPro && !isIPadAir;
    config.animationTime = isIOS2 ? 0.2 : 0.3;
    config.springStiffness = isIOS2 ? 9 : 10;
    config.blendTime = isIOS2 ? 0.2 : 0.3;
    config.immediateRender = true;
    if (isIPadPro) {
      config.imageLoaderLimit = 4;
      config.maxImageCacheCount = 100;
      console.log("[iPad Pro Detected] Using optimized settings: 4 concurrent loads, 100 tile cache");
    } else if (isIPadAir) {
      config.imageLoaderLimit = 2;
      config.maxImageCacheCount = 75;
      console.log("[iPad Air Detected] Using balanced settings: 2 concurrent loads, 75 tile cache");
    } else if (isStandardIPad) {
      config.imageLoaderLimit = 1;
      config.maxImageCacheCount = 30;
      console.log("[Standard iPad Detected] Using conservative settings: 1 load, 30 tile cache");
    } else {
      config.imageLoaderLimit = 1;
      config.maxImageCacheCount = 100;
    }
    config.visibilityRatio = 1;
    config.maxTilesPerFrame = 2;
    config.alwaysBlend = false;
    config.constrainDuringPan = true;
    config.maxZoomPixelRatio = 1.5;
    config.imageSmoothingEnabled = false;
    config.updatePixelDensityRatio = false;
    config.subPixelRendering = false;
    config.minimumPixelsPerTile = 32;
    console.log("Applied research-based mobile optimizations for zoom performance");
  }
  const finalConfig = {
    tileSources: tileSourceConfig || dziUrl,
    prefixUrl: "https://cdn.jsdelivr.net/npm/openseadragon@4.1.0/build/openseadragon/images/",
    // OpenSeadragon 4.1.0 always uses canvas drawer (no drawer property)
    imageSmoothingEnabled: config.imageSmoothingEnabled,
    smoothTileEdgesMinZoom: isIOS2 ? Infinity : config.smoothTileEdgesMinZoom,
    // CRITICAL: Infinity on iOS prevents corruption
    alwaysBlend: config.alwaysBlend,
    placeholderFillStyle: config.placeholderFillStyle,
    opacity: 1,
    preload: config.preload,
    compositeOperation: config.compositeOperation,
    // Tile loading
    immediateRender: config.immediateRender,
    imageLoaderLimit: config.imageLoaderLimit,
    maxImageCacheCount: config.maxImageCacheCount,
    timeout: config.timeout,
    loadTilesWithAjax: config.loadTilesWithAjax,
    ajaxHeaders: config.ajaxHeaders,
    // Visibility
    visibilityRatio: config.visibilityRatio,
    minPixelRatio: config.minPixelRatio,
    defaultZoomLevel: config.defaultZoomLevel,
    minZoomLevel: config.minZoomLevel,
    maxZoomPixelRatio: config.maxZoomPixelRatio,
    // Navigation
    constrainDuringPan: config.constrainDuringPan,
    wrapHorizontal: config.wrapHorizontal,
    wrapVertical: config.wrapVertical,
    // Animation - use config values which are already optimized
    animationTime: config.animationTime,
    springStiffness: config.springStiffness,
    blendTime: config.blendTime,
    // RESEARCH: Zoom-specific optimizations for low zoom performance
    zoomPerScroll: isMobileDevice ? 1.2 : 1.1,
    // Research: Slightly larger steps on mobile for better control
    zoomPerClick: 1.5,
    // Research: Prevent excessive zoom jumps
    // Controls - all disabled for clean interface
    showNavigationControl: false,
    showZoomControl: false,
    showHomeControl: false,
    showFullPageControl: false,
    showRotationControl: false,
    // Input - DISABLED double-click zoom
    gestureSettingsMouse: {
      scrollToZoom: true,
      clickToZoom: false,
      dblClickToZoom: false,
      flickEnabled: true,
      // CRITICAL: Enables immediate stop
      flickMomentum: 0
      // No momentum for precise control
    },
    gestureSettingsTouch: {
      scrollToZoom: false,
      // Research: Prevent scroll conflicts
      clickToZoom: false,
      dblClickToZoom: false,
      flickEnabled: isIOS2 ? false : config.flickEnabled,
      // CRITICAL: Disable on iOS to prevent corruption triggers
      flickMinSpeed: config.flickMinSpeed,
      flickMomentum: isIOS2 ? 0 : config.flickMomentum,
      // CRITICAL: No momentum on iOS
      pinchToZoom: true,
      dragToPan: true,
      pinchRotate: false
      // Research: Disable for performance
    },
    // Touch handling configuration 
    dblClickDistThreshold: 20,
    clickDistThreshold: 10,
    clickTimeThreshold: 300,
    // Performance
    debugMode: config.debugMode,
    crossOriginPolicy: "Anonymous",
    ajaxWithCredentials: false,
    preserveViewport: true,
    // Prevent viewport recalculations
    preserveImageSizeOnResize: config.preserveImageSizeOnResize,
    maxTilesPerFrame: config.maxTilesPerFrame,
    smoothImageZoom: config.smoothImageZoom,
    // RESEARCH: Canvas synchronization optimizations for low zoom performance
    subPixelRendering: config.subPixelRendering !== void 0 ? config.subPixelRendering : false,
    minimumPixelsPerTile: config.minimumPixelsPerTile || (isMobileDevice ? 32 : 24),
    // Research: Higher threshold for mobile
    // RESEARCH: Additional low zoom optimizations
    updatePixelDensityRatio: config.updatePixelDensityRatio !== void 0 ? config.updatePixelDensityRatio : false,
    smoothTileEdgesMinZoom: isMobileDevice ? Infinity : config.smoothTileEdgesMinZoom,
    imageSmoothingEnabled: config.imageSmoothingEnabled !== void 0 ? config.imageSmoothingEnabled : !isMobileDevice,
    // CRITICAL iOS FIX: Prevent canvas focus outline issue
    useCanvas: isIOS2 ? false : void 0
    // Contournement limite canvas iOS (5MB)
  };
  return finalConfig;
};
const getMobileOptimizedConfig = (isMobile2, isIOS2) => {
  const baseConfig = {
    // Tiles optimization - CRITICAL
    tileSize: isMobile2 ? 512 : 256,
    // Larger tiles = fewer HTTP requests
    // Network optimization
    imageLoaderLimit: isMobile2 ? 2 : 6,
    // Reduce concurrent loads on mobile
    timeout: 3e4,
    // Memory management - CRITICAL for iOS
    maxImageCacheCount: isMobile2 ? 50 : 100,
    // iOS has 200MB limit
    // Animation optimization
    blendTime: 0,
    // CRITICAL: No blending for PNG with transparency
    springStiffness: isMobile2 ? 6.5 : 8,
    // Lower for mobile responsiveness
    animationTime: isMobile2 ? 0.8 : 1.2,
    // Faster animations on mobile
    immediateRender: true,
    // Skip animations when possible
    // iOS-specific fixes
    placeholderFillStyle: isIOS2 ? null : "#000000",
    // Fix iOS flickering
    smoothTileEdgesMinZoom: isIOS2 ? Infinity : 1.1,
    // Disable edge smoothing on iOS
    // Performance settings
    minZoomImageRatio: isMobile2 ? 0.8 : 0.9,
    // Load tiles slightly earlier
    maxZoomPixelRatio: isMobile2 ? 2 : 4,
    // Limit max zoom on mobile
    pixelsPerWheelLine: 40,
    // Disable features that impact performance
    showNavigator: false,
    showNavigationControl: false,
    debugMode: false,
    // Touch optimization
    gestureSettingsTouch: {
      scrollToZoom: false,
      // Prevent conflicts with page scroll
      clickToZoom: true,
      dblClickToZoom: true,
      pinchToZoom: true,
      flickEnabled: true,
      flickMinSpeed: isMobile2 ? 100 : 120,
      flickMomentum: isMobile2 ? 0.15 : 0.25
    },
    // Mouse settings (for desktop)
    gestureSettingsMouse: {
      scrollToZoom: !isMobile2,
      clickToZoom: false,
      dblClickToZoom: true,
      flickEnabled: false
    },
    // Viewport constraints
    visibilityRatio: isMobile2 ? 0.8 : 1,
    // Allow some image to be outside viewport
    constrainDuringPan: true,
    // CRITICAL: New in 4.1.0 - Tile drawing optimizations
    maxTilesPerFrame: isMobile2 ? 3 : void 0,
    // Limit tiles drawn per frame
    // OpenSeadragon 4.1.0 specific optimizations
    subPixelRoundingForTransparency: false
    // Avoid subpixel issues on mobile
  };
  if (isIOS2) {
    baseConfig.useCanvas = true;
    baseConfig.preserveImageSizeOnResize = true;
  }
  return baseConfig;
};
let cachedHotspots = null;
async function hotspotData() {
  if (cachedHotspots) {
    return cachedHotspots;
  }
  try {
    const response = await fetch(`/data/hotspots.json?t=${Date.now()}`);
    cachedHotspots = await response.json();
    console.log(`Loaded ${cachedHotspots.length} hotspots`);
    return cachedHotspots;
  } catch (error) {
    console.error("Failed to load hotspots:", error);
    cachedHotspots = [];
    return cachedHotspots;
  }
}
function forceResetViewerState(viewer) {
  if (!viewer) return;
  console.log("Forcing viewer state reset to fix flickering...");
  if (viewer.world) {
    const tiledImages = viewer.world.getItemCount();
    for (let i = 0; i < tiledImages; i++) {
      const tiledImage = viewer.world.getItemAt(i);
      if (tiledImage) {
        tiledImage.reset();
      }
    }
  }
  viewer.viewport.centerSpringX.resetTo(viewer.viewport.centerSpringX.target.value);
  viewer.viewport.centerSpringY.resetTo(viewer.viewport.centerSpringY.target.value);
  viewer.viewport.zoomSpring.resetTo(viewer.viewport.zoomSpring.target.value);
  viewer.viewport.applyConstraints(true);
  viewer.forceRedraw();
  setTimeout(() => viewer.forceRedraw(), 50);
  setTimeout(() => viewer.forceRedraw(), 100);
  console.log("Viewer state reset completed");
}
class AdaptiveQualityManager {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.targetFPS = options.targetFPS || 30;
    this.criticalFPS = options.criticalFPS || 20;
    this.qualityLevels = {
      HIGH: "high",
      MEDIUM: "medium",
      LOW: "low",
      ULTRA_LOW: "ultra-low"
    };
    this.currentQuality = this.qualityLevels.HIGH;
    this.qualityHistory = [];
    this.metrics = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      cpuUsage: [],
      temperature: "normal"
      // normal, warm, hot
    };
    this.qualityPresets = {
      [this.qualityLevels.HIGH]: {
        maxHotspots: 10,
        animationDuration: 800,
        staggerDelay: 12,
        shadowQuality: "high",
        rippleComplexity: "full",
        lodAggressiveness: 1,
        useGPUEffects: true,
        maxConcurrentAnimations: 3
      },
      [this.qualityLevels.MEDIUM]: {
        maxHotspots: 8,
        animationDuration: 600,
        staggerDelay: 8,
        shadowQuality: "medium",
        rippleComplexity: "simple",
        lodAggressiveness: 1.2,
        useGPUEffects: true,
        maxConcurrentAnimations: 2
      },
      [this.qualityLevels.LOW]: {
        maxHotspots: 6,
        animationDuration: 400,
        staggerDelay: 5,
        shadowQuality: "low",
        rippleComplexity: "minimal",
        lodAggressiveness: 1.5,
        useGPUEffects: false,
        maxConcurrentAnimations: 1
      },
      [this.qualityLevels.ULTRA_LOW]: {
        maxHotspots: 4,
        animationDuration: 300,
        staggerDelay: 0,
        shadowQuality: "none",
        rippleComplexity: "none",
        lodAggressiveness: 2,
        useGPUEffects: false,
        maxConcurrentAnimations: 1
      }
    };
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.fpsUpdateInterval = 1e3;
    this.lastFPSUpdate = performance.now();
    this.adjustmentThresholds = {
      upgradeThreshold: 1e4,
      // 10 seconds of good performance (was 5s)
      downgradeThreshold: 5e3,
      // 5 seconds of poor performance (was 2s)
      criticalThreshold: 3e3
      // 3 seconds of critical performance (was 0.5s)
    };
    this.isMonitoring = false;
    this.rafId = null;
    this.onQualityChange = options.onQualityChange || (() => {
    });
    console.log("[AdaptiveQualityManager] Initialized with device capabilities:", this.deviceCapabilities);
  }
  /**
   * Detect device capabilities
   */
  detectDeviceCapabilities() {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    const capabilities = {
      cores: navigator.hardwareConcurrency || 2,
      memory: navigator.deviceMemory || 2,
      // GB
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null,
      gpu: gl ? {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER)
      } : null,
      isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
      isLowEnd: false
    };
    if (capabilities.cores <= 2 || capabilities.memory <= 2) {
      capabilities.isLowEnd = true;
    }
    const userAgent = navigator.userAgent.toLowerCase();
    const lowEndDevices = ["samsung galaxy a", "samsung galaxy j", "xiaomi redmi", "oppo a", "vivo y"];
    capabilities.isLowEnd = capabilities.isLowEnd || lowEndDevices.some((device) => userAgent.includes(device));
    return capabilities;
  }
  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    if (this.deviceCapabilities.isLowEnd) {
      this.setQuality(this.qualityLevels.LOW);
    } else if (this.deviceCapabilities.isMobile) {
      this.setQuality(this.qualityLevels.MEDIUM);
    }
    this.monitor();
    console.log("[AdaptiveQualityManager] Started monitoring");
  }
  /**
   * Main monitoring loop
   */
  monitor() {
    if (!this.isMonitoring) return;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.frameCount++;
    if (currentTime - this.lastFPSUpdate >= this.fpsUpdateInterval) {
      const fps = this.frameCount * 1e3 / (currentTime - this.lastFPSUpdate);
      this.updateMetrics(fps, deltaTime);
      this.frameCount = 0;
      this.lastFPSUpdate = currentTime;
      this.evaluateQualityAdjustment();
    }
    this.rafId = requestAnimationFrame(() => this.monitor());
  }
  /**
   * Update performance metrics
   */
  updateMetrics(fps, frameTime) {
    this.metrics.fps.push(fps);
    if (this.metrics.fps.length > 10) {
      this.metrics.fps.shift();
    }
    this.metrics.frameTime.push(frameTime);
    if (this.metrics.frameTime.length > 10) {
      this.metrics.frameTime.shift();
    }
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      this.metrics.memoryUsage.push(memoryUsage);
      if (this.metrics.memoryUsage.length > 10) {
        this.metrics.memoryUsage.shift();
      }
    }
  }
  /**
   * Evaluate if quality adjustment is needed
   */
  evaluateQualityAdjustment() {
    const avgFPS = this.getAverageFPS();
    const currentTime = performance.now();
    const qualityPerformance = {
      quality: this.currentQuality,
      fps: avgFPS,
      timestamp: currentTime
    };
    this.qualityHistory.push(qualityPerformance);
    if (avgFPS < this.criticalFPS) {
      const recentHistory = this.qualityHistory.filter(
        (h) => currentTime - h.timestamp < this.adjustmentThresholds.criticalThreshold
      );
      if (recentHistory.every((h) => h.fps < this.criticalFPS)) {
        this.downgradeQuality("critical");
        return;
      }
    }
    if (avgFPS < this.targetFPS) {
      const recentHistory = this.qualityHistory.filter(
        (h) => currentTime - h.timestamp < this.adjustmentThresholds.downgradeThreshold
      );
      if (recentHistory.length > 5 && recentHistory.every((h) => h.fps < this.targetFPS)) {
        this.downgradeQuality("poor");
        return;
      }
    }
    if (avgFPS > this.targetFPS + 10) {
      const recentHistory = this.qualityHistory.filter(
        (h) => currentTime - h.timestamp < this.adjustmentThresholds.upgradeThreshold
      );
      if (recentHistory.length > 10 && recentHistory.every((h) => h.fps > this.targetFPS + 10)) {
        this.upgradeQuality();
      }
    }
    this.qualityHistory = this.qualityHistory.filter(
      (h) => currentTime - h.timestamp < 3e4
      // Keep 30 seconds
    );
  }
  /**
   * Get average FPS from recent samples
   */
  getAverageFPS() {
    if (this.metrics.fps.length === 0) return this.targetFPS;
    return this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length;
  }
  /**
   * Downgrade quality level
   */
  downgradeQuality(reason = "performance") {
    const levels = Object.values(this.qualityLevels);
    const currentIndex = levels.indexOf(this.currentQuality);
    if (currentIndex < levels.length - 1) {
      const newQuality = levels[currentIndex + 1];
      this.setQuality(newQuality);
      console.warn(`[AdaptiveQualityManager] Downgrading quality to ${newQuality} due to ${reason} performance`);
    }
  }
  /**
   * Upgrade quality level
   */
  upgradeQuality() {
    const levels = Object.values(this.qualityLevels);
    const currentIndex = levels.indexOf(this.currentQuality);
    if (currentIndex > 0) {
      const newQuality = levels[currentIndex - 1];
      this.setQuality(newQuality);
      console.log(`[AdaptiveQualityManager] Upgrading quality to ${newQuality} due to good performance`);
    }
  }
  /**
   * Set quality level and apply settings
   */
  setQuality(quality) {
    if (!this.qualityPresets[quality]) return;
    this.currentQuality = quality;
    const settings = this.qualityPresets[quality];
    this.applyQualitySettings(settings);
    this.onQualityChange(quality, settings);
  }
  /**
   * Apply quality settings to various systems
   */
  applyQualitySettings(settings) {
    var _a, _b;
    if (window.temporalEchoController) {
      window.temporalEchoController.config.mobileMaxHotspots = settings.maxHotspots;
      window.temporalEchoController.config.echoDuration = settings.animationDuration;
      window.temporalEchoController.config.staggerDelay = settings.staggerDelay;
    }
    if ((_a = window.temporalEchoController) == null ? void 0 : _a.rippleRenderer) {
      window.temporalEchoController.rippleRenderer.duration = settings.animationDuration;
      window.temporalEchoController.rippleRenderer.maxRipples = settings.maxConcurrentAnimations;
    }
    if ((_b = window.nativeHotspotRenderer) == null ? void 0 : _b.lodSystem) {
      window.nativeHotspotRenderer.lodSystem.aggressiveness = settings.lodAggressiveness;
    }
    this.updateShadowQuality(settings.shadowQuality);
    console.log("[AdaptiveQualityManager] Applied quality settings:", settings);
  }
  /**
   * Update shadow rendering quality
   */
  updateShadowQuality(quality) {
  }
  /**
   * Force quality level (for testing)
   */
  forceQuality(quality) {
    if (this.qualityPresets[quality]) {
      this.setQuality(quality);
      console.log(`[AdaptiveQualityManager] Forced quality to ${quality}`);
    }
  }
  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      currentQuality: this.currentQuality,
      averageFPS: this.getAverageFPS(),
      metrics: this.metrics,
      deviceCapabilities: this.deviceCapabilities
    };
  }
  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    console.log("[AdaptiveQualityManager] Stopped monitoring");
  }
  /**
   * Destroy the manager
   */
  destroy() {
    this.stop();
    this.metrics = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      cpuUsage: []
    };
    this.qualityHistory = [];
  }
}
const adaptiveQualityManager = new AdaptiveQualityManager();
class ThermalManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.thermalStates = {
      NORMAL: "normal",
      // No throttling
      WARM: "warm",
      // Light throttling
      HOT: "hot",
      // Moderate throttling
      CRITICAL: "critical"
      // Heavy throttling
    };
    this.currentState = this.thermalStates.NORMAL;
    this.throttleProfiles = {
      [this.thermalStates.NORMAL]: {
        cpuThrottle: 1,
        // 100% performance
        animationScale: 1,
        // Normal animations
        renderDelay: 0,
        // No delay
        maxConcurrent: 10
        // Max concurrent operations
      },
      [this.thermalStates.WARM]: {
        cpuThrottle: 0.8,
        // 80% performance
        animationScale: 0.8,
        // Slightly faster animations
        renderDelay: 50,
        // 50ms delay between operations
        maxConcurrent: 6
        // Reduced concurrent operations
      },
      [this.thermalStates.HOT]: {
        cpuThrottle: 0.6,
        // 60% performance
        animationScale: 0.5,
        // Much faster animations
        renderDelay: 100,
        // 100ms delay
        maxConcurrent: 3
        // Minimal concurrent operations
      },
      [this.thermalStates.CRITICAL]: {
        cpuThrottle: 0.3,
        // 30% performance
        animationScale: 0.3,
        // Minimal animations
        renderDelay: 200,
        // 200ms delay
        maxConcurrent: 1
        // One operation at a time
      }
    };
    this.performanceHistory = [];
    this.lastPerformanceCheck = performance.now();
    this.batteryLevel = 1;
    this.isCharging = true;
    this.batteryAPISupported = "getBattery" in navigator;
    this.thermalEstimation = {
      sustainedHighPerf: 0,
      // Time spent at high performance
      lastHighPerfStart: null,
      // When high performance started
      cooldownPeriod: 0
      // Time spent cooling down
    };
    this.onStateChange = options.onStateChange || (() => {
    });
    if (this.batteryAPISupported) {
      this.initBatteryMonitoring();
    }
    console.log("[ThermalManager] Initialized", {
      batteryAPISupported: this.batteryAPISupported
    });
  }
  /**
   * Initialize battery monitoring
   */
  async initBatteryMonitoring() {
    try {
      const battery = await navigator.getBattery();
      this.batteryLevel = battery.level;
      this.isCharging = battery.charging;
      battery.addEventListener("levelchange", () => {
        this.batteryLevel = battery.level;
        this.evaluateThermalState();
      });
      battery.addEventListener("chargingchange", () => {
        this.isCharging = battery.charging;
        this.evaluateThermalState();
      });
      console.log("[ThermalManager] Battery monitoring initialized", {
        level: this.batteryLevel,
        charging: this.isCharging
      });
    } catch (error) {
      console.warn("[ThermalManager] Battery API not available:", error);
      this.batteryAPISupported = false;
    }
  }
  /**
   * Update performance metrics
   */
  updatePerformance(metrics) {
    const currentTime = performance.now();
    this.performanceHistory.push({
      timestamp: currentTime,
      fps: metrics.fps,
      frameTime: metrics.frameTime,
      memoryUsage: metrics.memoryUsage
    });
    this.performanceHistory = this.performanceHistory.filter(
      (entry) => currentTime - entry.timestamp < 6e4
    );
    this.updateThermalEstimation(metrics);
    this.evaluateThermalState();
  }
  /**
   * Update thermal estimation based on performance patterns
   */
  updateThermalEstimation(metrics) {
    const currentTime = performance.now();
    const isHighPerformance = metrics.fps > 50 || metrics.frameTime < 20;
    if (isHighPerformance) {
      if (!this.thermalEstimation.lastHighPerfStart) {
        this.thermalEstimation.lastHighPerfStart = currentTime;
      }
      this.thermalEstimation.sustainedHighPerf = currentTime - this.thermalEstimation.lastHighPerfStart;
      this.thermalEstimation.cooldownPeriod = 0;
    } else {
      if (this.thermalEstimation.lastHighPerfStart) {
        this.thermalEstimation.cooldownPeriod += currentTime - this.lastPerformanceCheck;
      }
      if (this.thermalEstimation.cooldownPeriod > 1e4) {
        this.thermalEstimation.lastHighPerfStart = null;
        this.thermalEstimation.sustainedHighPerf = 0;
      }
    }
    this.lastPerformanceCheck = currentTime;
  }
  /**
   * Evaluate thermal state based on various factors
   */
  evaluateThermalState() {
    let newState = this.thermalStates.NORMAL;
    const sustainedTime = this.thermalEstimation.sustainedHighPerf;
    if (sustainedTime > 12e4) {
      newState = this.thermalStates.CRITICAL;
    } else if (sustainedTime > 6e4) {
      newState = this.thermalStates.HOT;
    } else if (sustainedTime > 3e4) {
      newState = this.thermalStates.WARM;
    }
    if (this.batteryAPISupported) {
      if (!this.isCharging && this.batteryLevel < 0.2) {
        newState = this.increaseThrottleState(newState);
      } else if (this.isCharging && this.batteryLevel > 0.8) {
        newState = this.decreaseThrottleState(newState);
      }
    }
    const recentPerf = this.getRecentPerformance(5e3);
    if (recentPerf.avgFPS < 20) {
      newState = this.increaseThrottleState(newState);
    }
    if (recentPerf.avgMemoryUsage > 0.8) {
      newState = this.increaseThrottleState(newState);
    }
    if (newState !== this.currentState) {
      this.setState(newState);
    }
  }
  /**
   * Get recent performance metrics
   */
  getRecentPerformance(duration) {
    const currentTime = performance.now();
    const recent = this.performanceHistory.filter(
      (entry) => currentTime - entry.timestamp < duration
    );
    if (recent.length === 0) {
      return { avgFPS: 30, avgFrameTime: 33, avgMemoryUsage: 0.5 };
    }
    const avgFPS = recent.reduce((sum, e) => sum + e.fps, 0) / recent.length;
    const avgFrameTime = recent.reduce((sum, e) => sum + e.frameTime, 0) / recent.length;
    const avgMemoryUsage = recent.reduce((sum, e) => sum + (e.memoryUsage || 0.5), 0) / recent.length;
    return { avgFPS, avgFrameTime, avgMemoryUsage };
  }
  /**
   * Increase throttle state (more throttling)
   */
  increaseThrottleState(state) {
    const states = Object.values(this.thermalStates);
    const currentIndex = states.indexOf(state);
    return states[Math.min(currentIndex + 1, states.length - 1)];
  }
  /**
   * Decrease throttle state (less throttling)
   */
  decreaseThrottleState(state) {
    const states = Object.values(this.thermalStates);
    const currentIndex = states.indexOf(state);
    return states[Math.max(currentIndex - 1, 0)];
  }
  /**
   * Set thermal state
   */
  setState(state) {
    const oldState = this.currentState;
    this.currentState = state;
    const profile = this.throttleProfiles[state];
    console.log(`[ThermalManager] State changed: ${oldState} -> ${state}`, profile);
    this.applyThrottling(profile);
    this.onStateChange(state, profile);
  }
  /**
   * Apply throttling profile
   */
  applyThrottling(profile) {
    if (window.temporalEchoController) {
      const baseAnimation = 800;
      window.temporalEchoController.config.echoDuration = baseAnimation * profile.animationScale;
    }
    if (window.nativeHotspotRenderer) {
      window.nativeHotspotRenderer.renderDelay = profile.renderDelay;
    }
    if (window.temporalEchoController) {
      window.temporalEchoController.config.maxSimultaneous = Math.min(profile.maxConcurrent, 10);
    }
  }
  /**
   * Force cooldown period
   */
  forceCooldown() {
    console.log("[ThermalManager] Forcing cooldown period");
    this.thermalEstimation = {
      sustainedHighPerf: 0,
      lastHighPerfStart: null,
      cooldownPeriod: 0
    };
    this.setState(this.thermalStates.WARM);
    setTimeout(() => {
      if (this.currentState === this.thermalStates.WARM) {
        this.evaluateThermalState();
      }
    }, 1e4);
  }
  /**
   * Get current thermal profile
   */
  getCurrentProfile() {
    return this.throttleProfiles[this.currentState];
  }
  /**
   * Get thermal status
   */
  getStatus() {
    return {
      state: this.currentState,
      profile: this.getCurrentProfile(),
      battery: {
        level: this.batteryLevel,
        charging: this.isCharging
      },
      thermalEstimation: this.thermalEstimation,
      recentPerformance: this.getRecentPerformance(1e4)
    };
  }
  /**
   * Destroy the manager
   */
  destroy() {
    this.performanceHistory = [];
    this.thermalEstimation = {
      sustainedHighPerf: 0,
      lastHighPerfStart: null,
      cooldownPeriod: 0
    };
  }
}
const thermalManager = new ThermalManager();
class PerformanceMonitoringSystem {
  constructor(options = {}) {
    this.viewer = options.viewer;
    this.enabled = options.enabled !== false;
    this.config = {
      sampleInterval: 100,
      // Sample every 100ms
      reportInterval: 1e3,
      // Report every second
      historySize: 60,
      // Keep 60 seconds of history
      enableLogging: options.enableLogging || false
    };
    this.metrics = {
      fps: {
        current: 0,
        average: 0,
        min: 60,
        max: 0,
        samples: []
      },
      frameTime: {
        current: 0,
        average: 0,
        max: 0,
        samples: []
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
        samples: []
      },
      interactions: {
        tapLatency: [],
        animationDroppedFrames: 0,
        totalInteractions: 0
      },
      rendering: {
        hotspotCount: 0,
        visibleHotspots: 0,
        activeAnimations: 0,
        renderCalls: 0
      }
    };
    this.performanceState = {
      overall: "optimal",
      // optimal, good, degraded, poor, critical
      fps: "optimal",
      memory: "optimal",
      thermal: "normal",
      quality: "high"
    };
    this.isMonitoring = false;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.lastReportTime = performance.now();
    this.rafId = null;
    this.performanceMarks = /* @__PURE__ */ new Map();
    this.adaptiveQuality = adaptiveQualityManager;
    this.thermal = thermalManager;
    this.onPerformanceReport = options.onPerformanceReport || (() => {
    });
    this.onPerformanceWarning = options.onPerformanceWarning || (() => {
    });
    console.log("[PerformanceMonitoringSystem] Initialized");
  }
  /**
   * Start monitoring
   */
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    console.log("[PerformanceMonitoringSystem] AdaptiveQualityManager DISABLED for testing");
    this.adaptiveQuality.onQualityChange = (quality, settings) => {
      this.performanceState.quality = quality;
      this.handleQualityChange(quality, settings);
    };
    this.thermal.onStateChange = (state, profile) => {
      this.performanceState.thermal = state;
      this.handleThermalChange(state, profile);
    };
    this.monitor();
    this.startReporting();
    console.log("[PerformanceMonitoringSystem] Started monitoring");
  }
  /**
   * Main monitoring loop
   */
  monitor() {
    if (!this.isMonitoring) return;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.frameCount++;
    this.updateFrameMetrics(deltaTime);
    this.updateMemoryMetrics();
    this.updateRenderingMetrics();
    this.lastFrameTime = currentTime;
    this.rafId = requestAnimationFrame(() => this.monitor());
  }
  /**
   * Update frame-based metrics
   */
  updateFrameMetrics(deltaTime) {
    if (this.frameCount === 1) return;
    this.metrics.frameTime.current = deltaTime;
    this.metrics.frameTime.samples.push(deltaTime);
    if (this.metrics.frameTime.samples.length > this.config.historySize) {
      this.metrics.frameTime.samples.shift();
    }
    if (deltaTime > this.metrics.frameTime.max) {
      this.metrics.frameTime.max = deltaTime;
    }
    if (deltaTime > 33) {
      this.metrics.interactions.animationDroppedFrames++;
    }
  }
  /**
   * Update memory metrics
   */
  updateMemoryMetrics() {
    if (!performance.memory) return;
    const used = performance.memory.usedJSHeapSize;
    const total = performance.memory.jsHeapSizeLimit;
    const percentage = used / total;
    this.metrics.memory.used = used;
    this.metrics.memory.total = total;
    this.metrics.memory.percentage = percentage;
    this.metrics.memory.samples.push(percentage);
    if (this.metrics.memory.samples.length > this.config.historySize) {
      this.metrics.memory.samples.shift();
    }
    if (percentage > 0.9) {
      this.performanceState.memory = "critical";
    } else if (percentage > 0.8) {
      this.performanceState.memory = "poor";
    } else if (percentage > 0.7) {
      this.performanceState.memory = "degraded";
    } else if (percentage > 0.5) {
      this.performanceState.memory = "good";
    } else {
      this.performanceState.memory = "optimal";
    }
  }
  /**
   * Update rendering metrics
   */
  updateRenderingMetrics() {
    if (window.nativeHotspotRenderer) {
      const activeManager = window.nativeHotspotRenderer.activeHotspotManager;
      if (activeManager) {
        const stats = activeManager.getStats();
        this.metrics.rendering.hotspotCount = stats.totalHotspots;
        this.metrics.rendering.visibleHotspots = stats.activeHotspots;
      }
    }
    if (window.temporalEchoController) {
      this.metrics.rendering.activeAnimations = window.temporalEchoController.activeEchoes.size;
    }
    this.metrics.rendering.renderCalls++;
  }
  /**
   * Start reporting interval
   */
  startReporting() {
    setInterval(() => {
      if (!this.isMonitoring) return;
      const currentTime = performance.now();
      const timeSinceLastReport = currentTime - this.lastReportTime;
      const fps = this.frameCount * 1e3 / timeSinceLastReport;
      this.metrics.fps.current = fps;
      this.metrics.fps.samples.push(fps);
      if (this.metrics.fps.samples.length > this.config.historySize) {
        this.metrics.fps.samples.shift();
      }
      if (fps < this.metrics.fps.min) this.metrics.fps.min = fps;
      if (fps > this.metrics.fps.max) this.metrics.fps.max = fps;
      this.calculateAverages();
      if (fps < 20) {
        this.performanceState.fps = "critical";
      } else if (fps < 25) {
        this.performanceState.fps = "poor";
      } else if (fps < 30) {
        this.performanceState.fps = "degraded";
      } else if (fps < 45) {
        this.performanceState.fps = "good";
      } else {
        this.performanceState.fps = "optimal";
      }
      this.updateOverallState();
      this.thermal.updatePerformance({
        fps,
        frameTime: this.metrics.frameTime.average,
        memoryUsage: this.metrics.memory.percentage
      });
      const report = this.generateReport();
      this.onPerformanceReport(report);
      this.checkPerformanceWarnings(report);
      this.frameCount = 0;
      this.lastReportTime = currentTime;
      this.metrics.rendering.renderCalls = 0;
    }, this.config.reportInterval);
  }
  /**
   * Calculate average metrics
   */
  calculateAverages() {
    if (this.metrics.fps.samples.length > 0) {
      this.metrics.fps.average = this.metrics.fps.samples.reduce((a, b) => a + b, 0) / this.metrics.fps.samples.length;
    }
    if (this.metrics.frameTime.samples.length > 0) {
      this.metrics.frameTime.average = this.metrics.frameTime.samples.reduce((a, b) => a + b, 0) / this.metrics.frameTime.samples.length;
    }
  }
  /**
   * Update overall performance state
   */
  updateOverallState() {
    const states = ["critical", "poor", "degraded", "good", "optimal"];
    const stateValues = {
      critical: 0,
      poor: 1,
      degraded: 2,
      good: 3,
      optimal: 4
    };
    const worstState = Math.min(
      stateValues[this.performanceState.fps],
      stateValues[this.performanceState.memory]
    );
    this.performanceState.overall = states[worstState];
  }
  /**
   * Generate performance report
   */
  generateReport() {
    return {
      timestamp: Date.now(),
      state: this.performanceState,
      metrics: {
        fps: {
          current: Math.round(this.metrics.fps.current),
          average: Math.round(this.metrics.fps.average),
          min: Math.round(this.metrics.fps.min),
          max: Math.round(this.metrics.fps.max)
        },
        frameTime: {
          current: Math.round(this.metrics.frameTime.current),
          average: Math.round(this.metrics.frameTime.average),
          max: Math.round(this.metrics.frameTime.max)
        },
        memory: {
          used: Math.round(this.metrics.memory.used / 1048576),
          // MB
          total: Math.round(this.metrics.memory.total / 1048576),
          // MB
          percentage: Math.round(this.metrics.memory.percentage * 100)
        },
        rendering: {
          ...this.metrics.rendering,
          droppedFrames: this.metrics.interactions.animationDroppedFrames
        }
      },
      quality: this.adaptiveQuality.getMetrics(),
      thermal: this.thermal.getStatus()
    };
  }
  /**
   * Check for performance warnings
   */
  checkPerformanceWarnings(report) {
    const warnings = [];
    if (report.state.fps === "critical") {
      warnings.push({
        type: "fps",
        severity: "critical",
        message: `FPS critically low: ${report.metrics.fps.current}`,
        suggestion: "Reducing quality settings"
      });
    }
    if (report.metrics.memory.percentage > 85) {
      warnings.push({
        type: "memory",
        severity: "high",
        message: `Memory usage high: ${report.metrics.memory.percentage}%`,
        suggestion: "Consider reloading the page"
      });
    }
    if (report.thermal.state === "hot" || report.thermal.state === "critical") {
      warnings.push({
        type: "thermal",
        severity: "high",
        message: `Device overheating: ${report.thermal.state}`,
        suggestion: "Performance throttled to prevent damage"
      });
    }
    if (warnings.length > 0) {
      this.onPerformanceWarning(warnings);
    }
  }
  /**
   * Handle quality changes
   */
  handleQualityChange(quality, settings) {
    if (this.config.enableLogging) {
      console.log("[PerformanceMonitoringSystem] Quality changed:", quality, settings);
    }
  }
  /**
   * Handle thermal changes
   */
  handleThermalChange(state, profile) {
    if (this.config.enableLogging) {
      console.log("[PerformanceMonitoringSystem] Thermal state changed:", state, profile);
    }
  }
  /**
   * Mark the start of a performance measurement
   */
  markStart(name) {
    this.performanceMarks.set(name, performance.now());
  }
  /**
   * Mark the end of a performance measurement
   */
  markEnd(name) {
    const startTime = this.performanceMarks.get(name);
    if (!startTime) return null;
    const duration = performance.now() - startTime;
    this.performanceMarks.delete(name);
    if (name.includes("tap") || name.includes("interaction")) {
      this.metrics.interactions.tapLatency.push(duration);
      if (this.metrics.interactions.tapLatency.length > 20) {
        this.metrics.interactions.tapLatency.shift();
      }
      this.metrics.interactions.totalInteractions++;
    }
    return duration;
  }
  /**
   * Force garbage collection if available (development only)
   */
  forceGC() {
    if (window.gc) {
      console.log("[PerformanceMonitoringSystem] Forcing garbage collection");
      window.gc();
    }
  }
  /**
   * Get current performance summary
   */
  getSummary() {
    return {
      fps: Math.round(this.metrics.fps.current),
      state: this.performanceState.overall,
      quality: this.performanceState.quality,
      thermal: this.performanceState.thermal
    };
  }
  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.adaptiveQuality.stop();
    console.log("[PerformanceMonitoringSystem] Stopped monitoring");
  }
  /**
   * Destroy the system
   */
  destroy() {
    this.stop();
    this.adaptiveQuality.destroy();
    this.thermal.destroy();
    this.performanceMarks.clear();
  }
}
const performanceMonitor = new PerformanceMonitoringSystem();
async function detectImageSupport() {
  const avifTest = "data:image/avif;base64,AAAAFGZ0eXBhdmlmAAAAAG1pZjEAAACgbWV0YQAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAC8AAAAGwAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAARWlwcnAAAAAoaXBjbwAAABRpc3BlAAAAAAAAAAQAAAAEAAAADGF2MUOBAAAAAAAAFWlwbWEAAAAAAAAAAQABAgECAAAAI21kYXRSAAoIP8R8hAQ0BUAyDWeeUy0JG+QAACANEkA=";
  const webpTest = "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJaQAA3AA/v3AgAA=";
  const avifSupported = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = avifTest;
  });
  const webpSupported = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width === 2 && img.height === 1);
    img.onerror = () => resolve(false);
    img.src = webpTest;
  });
  const result = {
    avif: avifSupported,
    webp: webpSupported
  };
  console.log("[ImageFormatDetection] Browser support:", result);
  return result;
}
class AdaptiveFormatTileSource {
  constructor(viewer, formatSupport) {
    this.viewer = viewer;
    this.formats = formatSupport || { webp: false, avif: false };
    this.baseFormat = "jpg";
    console.log("[AdaptiveFormatTileSource] Initialized with format support:", this.formats);
  }
  /**
   * Get tile URL with optimal format
   * @param {number} level - Zoom level
   * @param {number} x - Tile X coordinate
   * @param {number} y - Tile Y coordinate
   * @returns {string} Tile URL with optimal format
   */
  getTileUrl(level, x, y) {
    const format = this.selectOptimalFormat(level);
    return `/images/tiles/${level}/${x}_${y}.${format}`;
  }
  /**
   * Select optimal format based on zoom level
   * Higher zoom levels use better compression for bandwidth savings
   * @param {number} zoomLevel - Current zoom level
   * @returns {string} Optimal image format
   */
  selectOptimalFormat(zoomLevel) {
    if (zoomLevel >= 12 && this.formats.avif) {
      return "avif";
    }
    if (zoomLevel >= 8 && this.formats.webp) {
      return "webp";
    }
    return this.baseFormat;
  }
  /**
   * Update format support (e.g., after re-detection)
   * @param {Object} formatSupport - Updated format support
   */
  updateFormatSupport(formatSupport) {
    this.formats = formatSupport;
    console.log("[AdaptiveFormatTileSource] Updated format support:", this.formats);
  }
}
async function initializeAdaptiveFormats(viewer) {
  const formatSupport = await detectImageSupport();
  const adaptiveSource = new AdaptiveFormatTileSource(viewer, formatSupport);
  window.adaptiveFormatSource = adaptiveSource;
  return adaptiveSource;
}
class IndexedDBTileCache {
  constructor(maxSizeMB = 200) {
    this.dbName = "diary-tile-cache";
    this.version = 1;
    this.maxSize = maxSizeMB * 1024 * 1024;
    this.db = null;
    this.lruMap = /* @__PURE__ */ new Map();
    this.currentSize = 0;
    this.enabled = true;
    this.stats = {
      hits: 0,
      misses: 0,
      stores: 0,
      evictions: 0
    };
    this.initDB();
  }
  /**
   * Initialize IndexedDB database
   */
  async initDB() {
    if (!("indexedDB" in window)) {
      console.warn("[IndexedDBTileCache] IndexedDB not supported");
      this.enabled = false;
      return;
    }
    try {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("tiles")) {
          const store = db.createObjectStore("tiles", { keyPath: "id" });
          store.createIndex("timestamp", "timestamp");
          store.createIndex("size", "size");
          console.log("[IndexedDBTileCache] Created tiles object store");
        }
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "key" });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        console.log("[IndexedDBTileCache] Database initialized");
        this.loadMetadata();
        this.checkStorageQuota();
      };
      request.onerror = (event) => {
        console.error("[IndexedDBTileCache] Database error:", event.target.error);
        this.enabled = false;
      };
    } catch (error) {
      console.error("[IndexedDBTileCache] Failed to initialize:", error);
      this.enabled = false;
    }
  }
  /**
   * Store a tile in the cache
   * @param {string} key - Unique tile identifier (e.g., "12/345/678.jpg")
   * @param {Blob} blob - Tile image data
   */
  async storeTile(key, blob) {
    if (!this.enabled || !this.db) return;
    try {
      const tileData = {
        id: key,
        blob,
        timestamp: Date.now(),
        size: blob.size
      };
      if (this.currentSize + blob.size > this.maxSize) {
        await this.evictOldest(blob.size);
      }
      const transaction = this.db.transaction(["tiles"], "readwrite");
      const store = transaction.objectStore("tiles");
      const request = store.put(tileData);
      request.onsuccess = () => {
        this.lruMap.delete(key);
        this.lruMap.set(key, Date.now());
        this.currentSize += blob.size;
        this.stats.stores++;
        this.saveMetadata();
      };
      request.onerror = (event) => {
        console.error("[IndexedDBTileCache] Store error:", event.target.error);
      };
    } catch (error) {
      console.error("[IndexedDBTileCache] Failed to store tile:", error);
    }
  }
  /**
   * Retrieve a tile from the cache
   * @param {string} key - Tile identifier
   * @returns {Promise<Blob|null>} Tile blob or null if not found
   */
  async getTile(key) {
    if (!this.enabled || !this.db) return null;
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(["tiles"], "readonly");
        const store = transaction.objectStore("tiles");
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            this.lruMap.delete(key);
            this.lruMap.set(key, Date.now());
            this.stats.hits++;
            resolve(result.blob);
          } else {
            this.stats.misses++;
            resolve(null);
          }
        };
        request.onerror = () => {
          this.stats.misses++;
          resolve(null);
        };
      } catch (error) {
        console.error("[IndexedDBTileCache] Failed to get tile:", error);
        resolve(null);
      }
    });
  }
  /**
   * Evict oldest tiles to make room
   * @param {number} bytesNeeded - Space needed for new tile
   */
  async evictOldest(bytesNeeded) {
    const transaction = this.db.transaction(["tiles"], "readwrite");
    const store = transaction.objectStore("tiles");
    const index = store.index("timestamp");
    let bytesFreed = 0;
    const tilesToDelete = [];
    const request = index.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && bytesFreed < bytesNeeded) {
        const tile = cursor.value;
        tilesToDelete.push(tile.id);
        bytesFreed += tile.size;
        cursor.continue();
      } else {
        tilesToDelete.forEach((id) => {
          store.delete(id);
          this.lruMap.delete(id);
          this.stats.evictions++;
        });
        this.currentSize -= bytesFreed;
        console.log(`[IndexedDBTileCache] Evicted ${tilesToDelete.length} tiles, freed ${(bytesFreed / 1024).toFixed(2)}KB`);
      }
    };
  }
  /**
   * Check storage quota and warn if running low
   */
  async checkStorageQuota() {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const percentUsed = estimate.usage / estimate.quota * 100;
        if (percentUsed > 80) {
          console.warn(`[IndexedDBTileCache] Storage usage high: ${percentUsed.toFixed(2)}%`);
          await this.performCleanup();
        }
        console.log(`[IndexedDBTileCache] Storage: ${(estimate.usage / 1024 / 1024).toFixed(2)}MB / ${(estimate.quota / 1024 / 1024).toFixed(2)}MB (${percentUsed.toFixed(2)}%)`);
      } catch (error) {
        console.warn("[IndexedDBTileCache] Could not estimate storage:", error);
      }
    }
  }
  /**
   * Clean up old tiles (older than 7 days for Safari compatibility)
   */
  async performCleanup() {
    if (!this.db) return;
    const transaction = this.db.transaction(["tiles"], "readwrite");
    const store = transaction.objectStore("tiles");
    const index = store.index("timestamp");
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
    const range = IDBKeyRange.upperBound(sevenDaysAgo);
    const request = index.openCursor(range);
    let deletedCount = 0;
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        this.lruMap.delete(cursor.primaryKey);
        deletedCount++;
        cursor.continue();
      } else if (deletedCount > 0) {
        console.log(`[IndexedDBTileCache] Cleaned up ${deletedCount} old tiles`);
      }
    };
  }
  /**
   * Save metadata (current size, stats)
   */
  async saveMetadata() {
    if (!this.db) return;
    const transaction = this.db.transaction(["metadata"], "readwrite");
    const store = transaction.objectStore("metadata");
    store.put({
      key: "cacheStats",
      currentSize: this.currentSize,
      stats: this.stats,
      lastUpdated: Date.now()
    });
  }
  /**
   * Load metadata on initialization
   */
  async loadMetadata() {
    if (!this.db) return;
    const transaction = this.db.transaction(["metadata"], "readonly");
    const store = transaction.objectStore("metadata");
    const request = store.get("cacheStats");
    request.onsuccess = () => {
      const data = request.result;
      if (data) {
        this.currentSize = data.currentSize || 0;
        this.stats = data.stats || this.stats;
        console.log("[IndexedDBTileCache] Loaded metadata:", this.stats);
      }
    };
  }
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      sizeUsed: `${(this.currentSize / 1024 / 1024).toFixed(2)}MB`,
      sizeLimit: `${(this.maxSize / 1024 / 1024).toFixed(2)}MB`
    };
  }
  /**
   * Clear entire cache
   */
  async clearCache() {
    if (!this.db) return;
    const transaction = this.db.transaction(["tiles"], "readwrite");
    const store = transaction.objectStore("tiles");
    const request = store.clear();
    request.onsuccess = () => {
      this.lruMap.clear();
      this.currentSize = 0;
      this.stats = {
        hits: 0,
        misses: 0,
        stores: 0,
        evictions: 0
      };
      this.saveMetadata();
      console.log("[IndexedDBTileCache] Cache cleared");
    };
  }
  /**
   * Enable/disable cache
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[IndexedDBTileCache] Cache ${enabled ? "enabled" : "disabled"}`);
  }
}
const tileCache = new IndexedDBTileCache(200);
window.tileCache = tileCache;
async function initializeViewer(viewerRef, props, state, handleHotspotClick) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  console.log("initializeViewer called with:", { viewerRef, props, state: !!state, handleHotspotClick: !!handleHotspotClick });
  const intervals = {};
  let homeViewport = null;
  const isMobileDevice = isMobile();
  const isIOS2 = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isIPhone2 = /iPhone/.test(navigator.userAgent) && !/iPad/.test(navigator.userAgent);
  const isIPad2 = /iPad/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const baseConfig = isMobileDevice ? getMobileOptimizedConfig(isMobileDevice, isIOS2) : performanceConfig.viewer;
  console.log("[PERF] Using mobile-optimized config:", isMobileDevice);
  console.log("[PERF] Config details:", {
    tileSize: baseConfig.tileSize,
    imageLoaderLimit: baseConfig.imageLoaderLimit,
    maxImageCacheCount: baseConfig.maxImageCacheCount,
    blendTime: baseConfig.blendTime
  });
  const getOptimalTileSize = () => {
    if (isMobileDevice) {
      return baseConfig.tileSize.toString();
    }
    return "1024";
  };
  const tileSize = getOptimalTileSize();
  const dziUrl = `/images/tiles/${props.artworkId}_${tileSize}/${props.artworkId}.dzi`;
  console.log(`[Mobile Optimization] Using ${tileSize}px tiles for ${isMobileDevice ? "mobile" : "desktop"} device`);
  const numericTileSize = tileSize.includes("_") ? tileSize.split("_")[0] : tileSize;
  const isOptimizedTiles = tileSize.includes("_q");
  const tileSourceConfig = {
    Image: {
      xmlns: "http://schemas.microsoft.com/deepzoom/2008",
      Url: `/images/tiles/${props.artworkId}_${tileSize}/${props.artworkId}_files/`,
      Format: "jpg",
      Overlap: numericTileSize === "256" ? "1" : numericTileSize === "512" ? "1" : "2",
      // Minimal overlap for all mobile tiles
      TileSize: numericTileSize,
      Size: {
        Width: "11244",
        Height: "6543"
      }
    },
    minLevel: numericTileSize === "256" ? 10 : numericTileSize === "512" ? 9 : 8,
    // Adjust minLevel for different tile sizes
    maxLevel: numericTileSize === "256" ? 16 : numericTileSize === "512" ? 15 : 14
    // 256px tiles need more levels
  };
  if (isOptimizedTiles) {
    console.log("[PERFORMANCE] Using optimized tiles with aggressive compression");
  }
  const drawerType = getBrowserOptimalDrawer();
  let finalConfig = baseConfig;
  if (isIOS2) {
    console.log("[CRITICAL] Applying iOS HTML configuration - bypassing canvas entirely");
    finalConfig = createIOSHTMLConfig(baseConfig);
    applyIOSHTMLStyles();
  }
  const viewerConfigOptions = buildViewerConfig(
    finalConfig,
    tileSourceConfig,
    isIOS2 ? "html" : drawerType,
    // Force HTML drawer on iOS
    isMobileDevice,
    tileSourceConfig
  );
  if (isMobileDevice) {
    Object.assign(viewerConfigOptions, baseConfig);
    console.log("[PERF] Applied mobile-optimized settings to viewer");
  }
  console.log("[viewerSetup] Creating viewer WITHOUT tileSources to ensure handlers attach first");
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isIOS2) {
    viewerConfigOptions.useCanvas = false;
    viewerConfigOptions.drawer = "html";
    console.log("[iOS] Forcing HTML drawer - canvas disabled completely");
  }
  if (isIOS2) {
    console.log("[CRITICAL iOS CONFIG]", {
      drawer: viewerConfigOptions.drawer,
      smoothTileEdgesMinZoom: viewerConfigOptions.smoothTileEdgesMinZoom,
      maxImageCacheCount: viewerConfigOptions.maxImageCacheCount,
      flickEnabled: (_a = viewerConfigOptions.gestureSettingsTouch) == null ? void 0 : _a.flickEnabled,
      flickMomentum: (_b = viewerConfigOptions.gestureSettingsTouch) == null ? void 0 : _b.flickMomentum,
      useCanvas: viewerConfigOptions.useCanvas,
      tileSize
    });
  }
  if (!isIOS2) {
    viewerConfigOptions.drawer = "canvas";
    viewerConfigOptions.smoothTileEdgesMinZoom = Infinity;
    viewerConfigOptions.immediateRender = true;
    viewerConfigOptions.imageSmoothingEnabled = true;
    viewerConfigOptions.updatePixelDensityRatio = false;
    viewerConfigOptions.subPixelRendering = false;
    viewerConfigOptions.blendTime = 0.5;
    viewerConfigOptions.alwaysBlend = false;
    console.log("NON-iOS: Canvas drawer with optimized smoothing management");
  } else {
    console.log("iOS: Using HTML drawer configuration to bypass Canvas memory limits");
    viewerConfigOptions.useCanvas = false;
  }
  if (isMobileDevice) {
    if (numericTileSize === "256") {
      viewerConfigOptions.imageLoaderLimit = 2;
      viewerConfigOptions.maxImageCacheCount = 150;
      viewerConfigOptions.maxTilesPerFrame = 2;
    } else {
      viewerConfigOptions.imageLoaderLimit = 2;
      viewerConfigOptions.maxImageCacheCount = 100;
      viewerConfigOptions.maxTilesPerFrame = 2;
    }
    viewerConfigOptions.prefetchTiles = true;
    viewerConfigOptions.subPixelRoundingEnabled = false;
    viewerConfigOptions.constrainDuringPan = true;
    viewerConfigOptions.minPixelRatio = 1;
    viewerConfigOptions.smoothTileEdgesMinZoom = Infinity;
    console.log("MOBILE PERFORMANCE: Applied research-based optimizations (100 cache, 2 loaders, prefetch enabled)");
  }
  console.log("RESEARCH VERIFICATION: Creating viewer with settings:", {
    drawer: viewerConfigOptions.drawer,
    imageLoaderLimit: viewerConfigOptions.imageLoaderLimit,
    maxTilesPerFrame: viewerConfigOptions.maxTilesPerFrame,
    immediateRender: viewerConfigOptions.immediateRender,
    animationTime: viewerConfigOptions.animationTime,
    springStiffness: viewerConfigOptions.springStiffness,
    isMobile: isMobileDevice
  });
  console.log("Creating OpenSeadragon viewer with config:", viewerConfigOptions);
  const viewerOptions = {
    element: viewerRef,
    ...viewerConfigOptions,
    // RESEARCH: Final override to ensure critical settings
    updatePixelDensityRatio: false
    // Research: Prevent expensive updates during zoom
  };
  if (!isIOS2 && isMobile()) {
    viewerOptions.drawer = "canvas";
    viewerOptions.useCanvas = true;
    console.log("ANDROID FIX: Forcing Canvas drawer for performance");
  } else if (!isIOS2 && !isMobile()) {
    delete viewerOptions.drawer;
  }
  console.log("Creating OpenSeadragon 4.1.0 viewer with config:", {
    useCanvas: viewerOptions.useCanvas,
    drawer: viewerOptions.drawer,
    isIOS: isIOS2,
    isMobile: isMobile(),
    expectedDrawer: isIOS2 ? "HTML (via useCanvas: false)" : "Canvas"
  });
  const viewer = OpenSeadragon(viewerOptions);
  setTimeout(() => {
    var _a2, _b2, _c2, _d2, _e2, _f2, _g2;
    if (isIOS2) {
      const drawerInfo = {
        hasCanvas: !!viewer.canvas,
        hasDrawer: !!viewer.drawer,
        drawerType: ((_b2 = (_a2 = viewer.drawer) == null ? void 0 : _a2.constructor) == null ? void 0 : _b2.name) || "unknown",
        useCanvas: viewer.useCanvas,
        canvasElement: ((_c2 = viewer.canvas) == null ? void 0 : _c2.tagName) || "none",
        hasContext2D: !!(((_d2 = viewer.drawer) == null ? void 0 : _d2.context) || ((_e2 = viewer.drawer) == null ? void 0 : _e2.ctx)),
        hasWebGL: !!(((_f2 = viewer.drawer) == null ? void 0 : _f2.gl) || ((_g2 = viewer.drawer) == null ? void 0 : _g2.webgl))
      };
      console.log("=== iOS DRAWER VERIFICATION ===");
      console.log("Drawer Info:", drawerInfo);
      const tiles = document.querySelectorAll(".openseadragon-tile");
      const imgTiles = document.querySelectorAll(".openseadragon-tile img");
      console.log("HTML Tiles found:", tiles.length);
      console.log("IMG elements in tiles:", imgTiles.length);
      if (drawerInfo.hasContext2D || drawerInfo.canvasElement === "CANVAS") {
        console.error("❌ WARNING: iOS is using CANVAS drawer! This will cause memory issues!");
        console.error("Expected HTML drawer but got:", drawerInfo.drawerType);
      } else if (imgTiles.length > 0 || tiles.length > 0) {
        console.log("✅ SUCCESS: iOS is using HTML drawer with", imgTiles.length || tiles.length, "tile elements");
      } else {
        console.warn("⚠️ No tiles detected yet - viewer may still be loading");
      }
      viewer.addOnceHandler("tile-loaded", () => {
        const tilesAfterLoad = document.querySelectorAll(".openseadragon-tile img");
        console.log("✅ After first tile load - IMG tiles count:", tilesAfterLoad.length);
        if (tilesAfterLoad.length > 0) {
          console.log("✅ CONFIRMED: HTML drawer is working correctly on iOS");
        }
      });
      console.log("=================================");
    }
  }, 100);
  console.log("Applying TileCascadeFix for stable tile rendering...");
  applyTileCascadeFix(OpenSeadragon);
  if (isIOS2 && !isIPhone2) {
    console.log("Applying MobileSafariFix for iPad...");
    applyMobileSafariFix(viewer);
    applyIOSTileDisappearFix(viewer);
  } else if (isIPhone2) {
    console.log("iPhone detected - using new iPhoneCanvasFix instead of old fixes");
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
  const stateSetters = {
    setIsLoading: (value) => {
      console.log(`[viewerSetup] Calling setIsLoading(${value})`);
      state.setIsLoading(value);
    },
    setViewerReady: (value) => {
      console.log(`[viewerSetup] Calling setViewerReady(${value})`);
      state.setViewerReady(value);
    }
  };
  console.log("[viewerSetup] Current state before open handler:", {
    isLoading: state.isLoading(),
    viewerReady: state.viewerReady()
  });
  viewer.addHandler("open", () => {
    console.log("[viewerSetup] OpenSeadragon open event fired!");
    console.log("[viewerSetup] Current loading state in handler:", state.isLoading());
    try {
      const tiledImage = viewer.world.getItemAt(0);
      if (tiledImage) {
        const bounds = tiledImage.getBounds();
        homeViewport = viewer.viewport.getHomeBounds();
        console.log("[viewerSetup] Home viewport stored:", homeViewport);
        console.log("[viewerSetup] About to set isLoading to false");
        if (tiledImage.getFullyLoaded()) {
          console.log("[viewerSetup] Tiles fully loaded - hiding loading screen immediately");
          stateSetters.setIsLoading(false);
          stateSetters.setViewerReady(true);
        } else {
          console.log("[viewerSetup] Waiting for tiles to fully load...");
          tiledImage.addOnceHandler("fully-loaded-change", () => {
            console.log("[viewerSetup] Tiles now fully loaded - hiding loading screen");
            stateSetters.setIsLoading(false);
            stateSetters.setViewerReady(true);
          });
          setTimeout(() => {
            if (state.isLoading()) {
              console.warn("[viewerSetup] Forcing loading screen hide after 2s wait");
              stateSetters.setIsLoading(false);
              stateSetters.setViewerReady(true);
            }
          }, 2e3);
        }
        if (isIOS2) {
          console.log("[iOS] Tile protection will be handled by global patch");
          const canvas = viewer.canvas;
          if (canvas) {
            canvas.addEventListener("click", () => {
              canvas.blur();
              console.log("[iOS Performance] Canvas focus cleared to prevent performance degradation");
            });
            canvas.addEventListener("touchstart", () => {
              canvas.blur();
            });
          }
        }
      } else {
        console.error("[viewerSetup] No tiled image found!");
        stateSetters.setIsLoading(false);
        stateSetters.setViewerReady(true);
      }
    } catch (error) {
      console.error("[viewerSetup] Error in open handler:", error);
      stateSetters.setIsLoading(false);
      stateSetters.setViewerReady(true);
    }
  });
  viewer.addHandler("open-failed", (event) => {
    console.error("OpenSeadragon open-failed event:", event);
    state.setIsLoading(false);
  });
  viewer.addHandler("tile-load-failed", (event) => {
    console.error("Tile load failed:", event.tile, event.message);
  });
  if (viewer.drawer) {
    viewer.drawer.imageSmoothingEnabled = true;
    if (viewer.drawer.context) {
      viewer.drawer.context.imageSmoothingEnabled = true;
      viewer.drawer.context.webkitImageSmoothingEnabled = true;
      viewer.drawer.context.mozImageSmoothingEnabled = true;
      viewer.drawer.context.msImageSmoothingEnabled = true;
    }
  }
  if (viewer.canvas) {
    viewer.canvas.style.imageRendering = "pixelated";
    viewer.canvas.style.imageRendering = "crisp-edges";
    viewer.canvas.style.imageRendering = "-webkit-optimize-contrast";
    console.log("[Mobile Performance] Applied pixelated rendering for monochrome art");
  }
  const networkAdaptiveManager = new NetworkAdaptiveManager(viewer);
  if (numericTileSize !== "256") {
    networkAdaptiveManager.initialize();
    console.log("[Mobile Performance] NetworkAdaptiveManager initialized and enabled");
  } else {
    console.log("[Mobile Performance] NetworkAdaptiveManager DISABLED for 256px tiles - using optimized settings");
    if (isMobileDevice && numericTileSize === "256") {
      viewer.imageLoaderLimit = 6;
      viewer.maxImageCacheCount = 300;
      viewer.maxTilesPerFrame = 4;
      console.log("[Mobile Performance] Restored 256px tile optimization settings after NetworkAdaptiveManager bypass");
    }
  }
  const componentsObj = {
    networkAdaptiveManager,
    spatialIndex: new SpatialIndex(),
    viewportManager: new ViewportManager(viewer),
    performanceMonitor: new PerformanceMonitor(viewer),
    renderOptimizer: new RenderOptimizer(viewer),
    tileOptimizer: new TileOptimizer(viewer),
    memoryManager: new MemoryManager(viewer),
    tileCleanupManager: new TileCleanupManager(viewer),
    imageOverlayManager: new ImageOverlayManager(),
    overlayManager: OverlayManagerFactory.createWithOverride(viewer),
    lowZoomOptimizer: new LowZoomOptimizer(viewer, isMobileDevice),
    // RESEARCH: Critical for zoom performance
    safariPerformanceOptimizer: new SafariPerformanceOptimizer(viewer),
    // SAFARI FIX: Dynamic resolution scaling
    frameSkipManager: new FrameSkipManager(viewer, isMobileDevice),
    // MOBILE: Frame skipping for 45+ FPS
    // DELAYED INITIALIZATION TO PREVENT STARTUP FREEZE
    mouseWheelSmoothing: new MouseWheelSmoothing(viewer, ((_c = getTuningState().enableMouseWheelSmoothing) == null ? void 0 : _c.value) ? {
      throttleMs: ((_d = getTuningState().wheelEventThrottleMs) == null ? void 0 : _d.value) || 16,
      zoomStep: ((_e = getTuningState().wheelZoomStep) == null ? void 0 : _e.value) || 0.02,
      enabled: ((_f = getTuningState().enableMouseWheelSmoothing) == null ? void 0 : _f.value) !== false
    } : { enabled: false })
  };
  if (isMobileDevice) {
    performanceMonitor.viewer = viewer;
    performanceMonitor.onPerformanceReport = (report) => {
      if (state.setPerformanceStatus) {
        state.setPerformanceStatus({
          fps: report.metrics.fps.current,
          quality: report.quality.currentQuality,
          thermal: report.thermal.state
        });
      }
    };
    performanceMonitor.onPerformanceWarning = (warnings) => {
      console.warn("[Performance Warning]", warnings);
    };
    setTimeout(() => {
      performanceMonitor.start();
      console.log("[Mobile Performance] Unified monitoring system started");
    }, 2e3);
    componentsObj.unifiedPerformanceMonitor = performanceMonitor;
  }
  componentsObj.tileOptimizer.state.isActive = false;
  setTimeout(() => {
    componentsObj.tileOptimizer.state.isActive = true;
  }, 1e3);
  const cinematicZoomManager = new CinematicZoomManager(viewer, componentsObj);
  componentsObj.cinematicZoomManager = cinematicZoomManager;
  const predictiveTileLoader = new PredictiveTileLoader(viewer);
  componentsObj.predictiveTileLoader = predictiveTileLoader;
  const vignetteOverlay = new VignetteOverlay(viewer);
  componentsObj.vignetteOverlay = vignetteOverlay;
  const immediateZoomHandler = new ImmediateZoomHandler(viewer);
  componentsObj.immediateZoomHandler = immediateZoomHandler;
  initializeAdaptiveFormats(viewer).then((adaptiveSource) => {
    componentsObj.adaptiveFormatSource = adaptiveSource;
    console.log("[Mobile Performance] Adaptive image formats initialized");
  }).catch((err) => {
    console.warn("[Mobile Performance] Failed to initialize adaptive formats:", err);
  });
  componentsObj.tileCache = tileCache;
  console.log("[Mobile Performance] IndexedDB tile cache initialized (200MB limit)");
  window.cinematicZoomManager = cinematicZoomManager;
  window.predictiveTileLoader = predictiveTileLoader;
  window.vignetteOverlay = vignetteOverlay;
  window.immediateZoomHandler = immediateZoomHandler;
  if (state.debugLevel() >= 1) {
    cinematicZoomManager.enableDebug();
  }
  state.setComponents(componentsObj);
  window.performanceMetrics = state.performanceMetrics;
  console.log("About to initialize overlay manager...");
  console.log("Is overlay manager present?", !!componentsObj.overlayManager);
  console.log("Does it have initialize method?", typeof ((_g = componentsObj.overlayManager) == null ? void 0 : _g.initialize));
  componentsObj.overlayManager.initialize();
  window.overlayManager = componentsObj.overlayManager;
  if (componentsObj.overlayManager.constructor.name === "Canvas2DOverlayManager" && componentsObj.overlayManager.setAutoDeselectThreshold && state.autoDeselectThreshold) {
    const threshold = state.autoDeselectThreshold();
    componentsObj.overlayManager.setAutoDeselectThreshold(threshold);
    console.log("Set auto-deselect threshold on Canvas2D manager:", threshold);
  }
  if (isIOS2) {
    try {
      const deviceType = isIPhone2 ? "iPhone" : isIPad2 ? "iPad" : "iOS device";
      console.log(`[iOS HTML] Setting up HTML drawer for ${deviceType}`);
      const drawerType2 = verifyHTMLDrawer(viewer);
      console.log(`[iOS HTML] Drawer type verified: ${drawerType2}`);
      const cleanupInterval = setupIOSHTMLMonitoring(viewer);
      componentsObj.iosCleanupInterval = cleanupInterval;
      window.iosDrawerType = drawerType2;
      console.log("[iOS HTML] Initialization complete");
      console.log("Features enabled:");
      console.log("- HTML-based tile rendering (no canvas)");
      console.log("- CSS transforms for hardware acceleration");
      console.log("- Automatic memory management");
      console.log("- No canvas memory limitations");
    } catch (error) {
      console.error("Error initializing iPhoneCanvasFixComplete:", error);
    }
  }
  console.log("Overlay manager initialized");
  console.log("Is initialized flag:", (_h = componentsObj.overlayManager) == null ? void 0 : _h.isInitialized);
  console.log("Overlay element created?", !!((_i = componentsObj.overlayManager) == null ? void 0 : _i.overlayElement));
  const actualType = OverlayManagerFactory.getCurrentType();
  if (actualType && actualType !== state.currentOverlayType()) {
    console.log("Updating overlay type signal to match actual:", actualType);
    state.setCurrentOverlayType(actualType);
  }
  window.overlayManager = componentsObj.overlayManager;
  console.log("Overlay manager set on window:", (_j = window.overlayManager) == null ? void 0 : _j.constructor.name);
  window.verifyIOSDrawer = function() {
    var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2;
    if (!viewer) {
      console.error("Viewer not initialized");
      return;
    }
    console.group("🔍 iOS Drawer Verification");
    console.log("Platform:", navigator.userAgent);
    console.log("Is iOS:", isIOS2);
    const drawerInfo = {
      useCanvas: viewer.useCanvas,
      drawerType: ((_b2 = (_a2 = viewer.drawer) == null ? void 0 : _a2.constructor) == null ? void 0 : _b2.name) || "unknown",
      hasCanvasElement: !!viewer.canvas,
      canvasTagName: ((_c2 = viewer.canvas) == null ? void 0 : _c2.tagName) || "none",
      hasContext2D: !!(((_d2 = viewer.drawer) == null ? void 0 : _d2.context) || ((_e2 = viewer.drawer) == null ? void 0 : _e2.ctx)),
      hasWebGL: !!(((_f2 = viewer.drawer) == null ? void 0 : _f2.gl) || ((_g2 = viewer.drawer) == null ? void 0 : _g2.webgl)),
      container: ((_h2 = viewer.container) == null ? void 0 : _h2.tagName) || "none"
    };
    console.table(drawerInfo);
    const tiles = document.querySelectorAll(".openseadragon-tile");
    const imgElements = document.querySelectorAll(".openseadragon-tile img");
    const canvasElements = document.querySelectorAll(".openseadragon-canvas canvas");
    console.log("DOM Analysis:");
    console.log("- HTML tile divs:", tiles.length);
    console.log("- IMG elements:", imgElements.length);
    console.log("- Canvas elements:", canvasElements.length);
    if (drawerInfo.hasContext2D || drawerInfo.canvasTagName === "CANVAS") {
      console.error("❌ Using CANVAS drawer - NOT optimal for iOS!");
    } else if (imgElements.length > 0) {
      console.log("✅ Using HTML drawer - Optimal for iOS!");
      console.log("First few tile srcs:", Array.from(imgElements).slice(0, 3).map((img) => img.src));
    } else {
      console.warn("⚠️ No tiles loaded yet or drawer type unclear");
    }
    console.groupEnd();
    return drawerInfo;
  };
  console.log("💡 TIP: Run window.verifyIOSDrawer() at any time to check drawer status");
  const hotspots = await hotspotData();
  componentsObj.spatialIndex.loadHotspots(hotspots);
  componentsObj.imageOverlayManager.loadHotspots(hotspots);
  window.viewer = viewer;
  window.performanceMonitor = componentsObj.performanceMonitor;
  window.tileOptimizer = componentsObj.tileOptimizer;
  window.tileCleanupManager = componentsObj.tileCleanupManager;
  window.lowZoomOptimizer = componentsObj.lowZoomOptimizer;
  window.safariPerformanceOptimizer = componentsObj.safariPerformanceOptimizer;
  window.frameSkipManager = componentsObj.frameSkipManager;
  window.networkAdaptiveManager = componentsObj.networkAdaptiveManager;
  window.performanceConfig = performanceConfig;
  window.iosMemoryManager = componentsObj.iosMemoryManager;
  setupSmoothingUtilities(viewer);
  applyTuningToViewer(viewer, performanceConfig);
  const getDrawerType = (drawer) => {
    if (!drawer) return "unknown";
    if (drawer.getType) return drawer.getType();
    if (drawer.canvas || drawer.context || drawer.ctx) return "canvas";
    if (drawer.constructor && drawer.constructor.name) {
      const name = drawer.constructor.name.toLowerCase();
      if (name.includes("canvas")) return "canvas";
      if (name.includes("html")) return "html";
      if (name.includes("webgl")) return "webgl";
      return name.replace("drawer", "").toLowerCase();
    }
    return "canvas";
  };
  setTimeout(() => {
    var _a2, _b2, _c2, _d2, _e2;
    console.log("Drawer object properties:", {
      hasCanvas: !!((_a2 = viewer.drawer) == null ? void 0 : _a2.canvas),
      hasContext: !!((_b2 = viewer.drawer) == null ? void 0 : _b2.context),
      hasCtx: !!((_c2 = viewer.drawer) == null ? void 0 : _c2.ctx),
      constructorName: (_e2 = (_d2 = viewer.drawer) == null ? void 0 : _d2.constructor) == null ? void 0 : _e2.name,
      drawerType: typeof viewer.drawer
    });
    const actualDrawer = getDrawerType(viewer.drawer);
    console.log("RESEARCH VERIFICATION: Actual drawer in use:", actualDrawer);
    if ((isMobileDevice || isSafari || isIOS2) && actualDrawer !== "canvas" && !isIOS2) {
      console.error("CRITICAL: Canvas drawer not applied on non-iOS mobile! Performance will be poor.");
    } else if (isIOS2 && viewer.useCanvas !== false) {
      console.error("CRITICAL: HTML drawer not applied on iOS! Memory issues will occur.");
    } else {
      console.log("SUCCESS: Correct drawer applied for platform");
      console.log("- iOS devices using HTML drawer (useCanvas: false)");
      console.log("- Non-iOS devices using Canvas drawer");
    }
  }, 100);
  componentsObj.performanceMonitor.start();
  componentsObj.memoryManager.start();
  componentsObj.tileOptimizer.start();
  componentsObj.tileCleanupManager.start();
  componentsObj.lowZoomOptimizer.enable();
  if (isIOS2) {
    console.log("===== iOS CRITICAL CONFIGURATION =====");
    console.log("Drawer type:", getDrawerType(viewer.drawer));
    console.log("Max image cache count:", viewer.maxImageCacheCount);
    console.log("Smooth tile edges min zoom:", viewer.smoothTileEdgesMinZoom);
    console.log("=====================================");
    window.addEventListener("tilecorruption:reload", (event) => {
      console.error("Tile corruption reload requested", event.detail);
      if (window.confirm("The image viewer has encountered an error. Would you like to reload?")) {
        window.location.reload();
      }
    });
  }
  let isInteracting = false;
  let lastInteractionTime = 0;
  const INTERACTION_TIMEOUT = 2e3;
  viewer.addHandler("animation", () => {
    isInteracting = true;
    lastInteractionTime = Date.now();
  });
  viewer.addHandler("animation-finish", () => {
    setTimeout(() => {
      if (Date.now() - lastInteractionTime >= INTERACTION_TIMEOUT) {
        isInteracting = false;
      }
    }, INTERACTION_TIMEOUT);
  });
  const performanceUpdateInterval = setInterval(() => {
    var _a2;
    if (componentsObj.performanceMonitor && componentsObj.performanceMonitor.isMonitoring) {
      const metrics = componentsObj.performanceMonitor.getMetrics();
      state.setPerformanceMetrics(metrics);
      const currentZoom = viewer.viewport.getZoom();
      const shouldShowButton = currentZoom >= 1.8;
      if (shouldShowButton && !state.showExpandButton()) {
        state.setExpandButtonFading(false);
        state.setShowExpandButton(true);
      } else if (!shouldShowButton && state.showExpandButton() && !state.expandButtonFading()) {
        state.setExpandButtonFading(true);
        setTimeout(() => {
          state.setShowExpandButton(false);
          state.setExpandButtonFading(false);
        }, 300);
      }
      if (window.nativeHotspotRenderer && typeof window.nativeHotspotRenderer.getPerformanceMetrics === "function") {
        try {
          const webglMetrics = window.nativeHotspotRenderer.getPerformanceMetrics();
          if (webglMetrics && window.nativeHotspotRenderer.constructor.name === "WebGLHotspotRenderer") {
            if (isInteracting) {
            }
            state.setSafariHybridMetrics(webglMetrics);
          }
        } catch (error) {
          console.error("Error getting WebGL metrics:", error);
        }
      } else if (((_a2 = window.nativeHotspotRenderer) == null ? void 0 : _a2.constructor.name) !== "WebGLHotspotRenderer") {
        state.setSafariHybridMetrics(null);
      }
      if (componentsObj.lowZoomOptimizer && metrics.averageFPS > 0) {
        componentsObj.lowZoomOptimizer.monitorPerformance(metrics.averageFPS);
      }
      if (componentsObj.safariPerformanceOptimizer && metrics.averageFPS > 0) {
        componentsObj.safariPerformanceOptimizer.updatePerformanceMetrics(metrics.averageFPS, isInteracting);
      }
      if (isInteracting && metrics.averageFPS < 30 && isMobileDevice) ;
    }
  }, 500);
  intervals.performanceUpdate = performanceUpdateInterval;
  componentsObj.performanceMonitor.disableDebugOverlay();
  viewer.viewport.centerSpringX.animationTime = performanceConfig.viewer.animationTime;
  viewer.viewport.centerSpringY.animationTime = performanceConfig.viewer.animationTime;
  viewer.viewport.zoomSpring.animationTime = performanceConfig.viewer.animationTime;
  viewer.viewport.centerSpringX.springStiffness = performanceConfig.viewer.springStiffness;
  viewer.viewport.centerSpringY.springStiffness = performanceConfig.viewer.springStiffness;
  viewer.viewport.zoomSpring.springStiffness = performanceConfig.viewer.springStiffness;
  const eventHandlers = await __vitePreload(() => import("./viewerEventHandlers-Dlbgqr9k.js"), true ? __vite__mapDeps([0,1,2]) : void 0);
  eventHandlers.setupViewerEventHandlers(viewer, state, componentsObj, handleHotspotClick, hotspots);
  eventHandlers.setupAdaptiveSprings(viewer, performanceConfig);
  const keyHandler = eventHandlers.setupKeyboardHandler(viewer, state, componentsObj);
  intervals.handleKeyPress = keyHandler;
  eventHandlers.setupResizeObserver(viewerRef, viewer, state);
  console.log("[viewerSetup] All handlers attached, now opening viewer with tileSources:", dziUrl);
  viewer.open(dziUrl);
  setTimeout(() => {
    console.log("[viewerSetup] Forcing initial redraw to ensure clean state");
    viewer.forceRedraw();
    viewer.viewport.centerSpringX.resetTo(viewer.viewport.centerSpringX.target.value);
    viewer.viewport.centerSpringY.resetTo(viewer.viewport.centerSpringY.target.value);
    viewer.viewport.zoomSpring.resetTo(viewer.viewport.zoomSpring.target.value);
    viewer.forceRedraw();
  }, 500);
  console.log("Returning from initializeViewer:", { viewer: !!viewer, intervals: !!intervals, homeViewport: !!homeViewport });
  return {
    viewer,
    intervals,
    homeViewport
  };
}
function setupSmoothingUtilities(viewer) {
  window.forceSmoothingOn = function() {
    console.log("✅ FORCING SMOOTHING ON");
    if (viewer && viewer.drawer) {
      viewer.drawer.imageSmoothingEnabled = true;
      if (viewer.drawer.context) {
        const ctx = viewer.drawer.context;
        ctx.imageSmoothingEnabled = true;
        ctx.webkitImageSmoothingEnabled = true;
        ctx.mozImageSmoothingEnabled = true;
        ctx.msImageSmoothingEnabled = true;
        console.log("✅ Canvas context smoothing enabled");
      }
      if (viewer.canvas) {
        viewer.canvas.style.imageRendering = "auto";
        console.log("✅ CSS rendering set to auto");
      }
      viewer.forceRedraw();
      console.log("✅ Forced redraw with smoothing enabled");
      if (viewer.drawer.context) {
        console.log("Current imageSmoothingEnabled:", viewer.drawer.context.imageSmoothingEnabled);
      }
    } else {
      console.error("❌ Viewer or drawer not available");
    }
  };
  window.checkSmoothingState = function() {
    var _a, _b;
    console.group("🧪 SMOOTHING STATE DIAGNOSTIC");
    if (viewer && viewer.drawer) {
      console.log("Drawer type:", ((_b = (_a = viewer.drawer) == null ? void 0 : _a.constructor) == null ? void 0 : _b.name) || "canvas");
      console.log("Drawer imageSmoothingEnabled:", viewer.drawer.imageSmoothingEnabled);
      if (viewer.drawer.context) {
        console.log("Context imageSmoothingEnabled:", viewer.drawer.context.imageSmoothingEnabled);
        console.log("Context webkitImageSmoothingEnabled:", viewer.drawer.context.webkitImageSmoothingEnabled);
        console.log("Context mozImageSmoothingEnabled:", viewer.drawer.context.mozImageSmoothingEnabled);
        console.log("Context msImageSmoothingEnabled:", viewer.drawer.context.msImageSmoothingEnabled);
      } else {
        console.warn("No context available");
      }
      if (viewer.canvas) {
        console.log("Canvas style.imageRendering:", viewer.canvas.style.imageRendering);
      }
      console.log("\nConfiguration:");
      console.log("imageSmoothingEnabled config:", viewer.imageSmoothingEnabled);
      console.log("smoothTileEdgesMinZoom:", viewer.smoothTileEdgesMinZoom);
      console.log("blendTime:", viewer.blendTime);
      console.log("alwaysBlend:", viewer.alwaysBlend);
      console.log("immediateRender:", viewer.immediateRender);
    } else {
      console.error("Viewer or drawer not available");
    }
    console.groupEnd();
  };
  window.toggleTileCascadeFix = function(enable) {
    if (enable) {
      console.log("🔐 Enabling TileCascadeFix...");
      applyTileCascadeFix(OpenSeadragon);
      console.log("✅ TileCascadeFix enabled - single tile level (may cause zoom artifacts)");
    } else {
      console.log("🔓 Disabling TileCascadeFix...");
      removeTileCascadeFix(OpenSeadragon);
      console.log("✅ TileCascadeFix disabled - smooth blending enabled");
    }
    viewer.forceRedraw();
  };
  window.applyBalancedSmoothingConfig = function() {
    console.group("🎯 APPLYING BALANCED SMOOTHING CONFIG");
    console.log("1️⃣ Ensuring image smoothing is enabled...");
    window.forceSmoothingOn();
    console.log("2️⃣ Disabling TileCascadeFix for smooth zoom...");
    window.toggleTileCascadeFix(false);
    console.log("3️⃣ Checking blend time...");
    if (viewer) {
      console.log("Current blendTime:", viewer.blendTime || 0.5);
    }
    console.log("4️⃣ Verifying smoothing state...");
    window.checkSmoothingState();
    console.log("\n✅ BALANCED CONFIG APPLIED!");
    console.log("🖼️ Smooth rendering with tile blending enabled");
    console.log("🔍 Test by zooming in/out");
    console.log("📊 If artifacts persist, try toggleTileCascadeFix(true)");
    console.groupEnd();
  };
  window.getCinematicZoomDiagnostics = function() {
    if (window.cinematicZoomManager) {
      return window.cinematicZoomManager.getDiagnostics();
    }
    console.error("CinematicZoomManager not initialized");
    return null;
  };
  window.fixFlickering = function() {
    console.log("Applying manual flickering fix...");
    forceResetViewerState(viewer);
    removeTileCascadeFix(OpenSeadragon);
    setTimeout(() => {
      applyTileCascadeFix(OpenSeadragon);
      viewer.forceRedraw();
      console.log("Flickering fix applied");
    }, 100);
  };
  window.testSafariOptimizer = function() {
    if (!window.safariPerformanceOptimizer) {
      console.error("SafariPerformanceOptimizer not initialized");
      return;
    }
    const optimizer = window.safariPerformanceOptimizer;
    console.group("🎯 SAFARI PERFORMANCE OPTIMIZER TEST");
    const state = optimizer.getState();
    console.table(state);
    console.log("\n📊 Testing dynamic resolution scaling...");
    console.log("1️⃣ Forcing optimization ON");
    optimizer.forceOptimization(true);
    setTimeout(() => {
      console.log("Current pixel ratio:", viewer.viewport.getPixelRatio());
      console.log("Expected:", state.basePixelRatio * optimizer.scalingFactor);
      console.log("\n2️⃣ Forcing optimization OFF");
      optimizer.forceOptimization(false);
      setTimeout(() => {
        console.log("Current pixel ratio:", viewer.viewport.getPixelRatio());
        console.log("Expected:", state.basePixelRatio);
        console.log("\n✅ Test complete! Try zooming/panning to see dynamic scaling.");
        console.groupEnd();
      }, 500);
    }, 100);
  };
  window.getSafariOptimizerState = function() {
    if (!window.safariPerformanceOptimizer) {
      console.error("SafariPerformanceOptimizer not initialized");
      return null;
    }
    return window.safariPerformanceOptimizer.getState();
  };
}
const viewerSetup = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  initializeViewer
}, Symbol.toStringTag, { value: "Module" }));
export {
  CentralizedEventManager as C,
  adjustSettingsForPerformance as a,
  organicVariations as o,
  performanceConfig as p,
  viewerSetup as v
};
