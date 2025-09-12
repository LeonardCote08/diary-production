class SplineRenderer {
  constructor(options) {
    this.quality = options.quality || "high";
    this.tension = 0.5;
    this.segmentResolution = this.quality === "high" ? 20 : 10;
    this.splineCache = /* @__PURE__ */ new Map();
    this.cacheSize = 100;
  }
  /**
   * Create Catmull-Rom spline through control points
   */
  createSpline(points) {
    if (points.length < 4) {
      return this.createLinearPath(points);
    }
    const cacheKey = this.getCacheKey(points);
    if (this.splineCache.has(cacheKey)) {
      return this.splineCache.get(cacheKey);
    }
    const spline = [];
    for (let i = 1; i < points.length - 2; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2];
      for (let t = 0; t < 1; t += 1 / this.segmentResolution) {
        const point = this.catmullRomPoint(p0, p1, p2, p3, t);
        spline.push(point);
      }
    }
    spline.push(points[points.length - 2]);
    this.cacheSpline(cacheKey, spline);
    return spline;
  }
  /**
   * Calculate point on Catmull-Rom spline
   */
  catmullRomPoint(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    const v0 = (p2.x - p0.x) * this.tension;
    const v1 = (p3.x - p1.x) * this.tension;
    const x = p1.x + v0 * t + (3 * (p2.x - p1.x) - 2 * v0 - v1) * t2 + (2 * (p1.x - p2.x) + v0 + v1) * t3;
    const v0y = (p2.y - p0.y) * this.tension;
    const v1y = (p3.y - p1.y) * this.tension;
    const y = p1.y + v0y * t + (3 * (p2.y - p1.y) - 2 * v0y - v1y) * t2 + (2 * (p1.y - p2.y) + v0y + v1y) * t3;
    return { x, y };
  }
  /**
   * Create linear path for insufficient control points
   */
  createLinearPath(points) {
    const path = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      for (let t = 0; t < 1; t += 1 / this.segmentResolution) {
        path.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t
        });
      }
    }
    path.push(points[points.length - 1]);
    return path;
  }
  /**
   * Get position along spline at normalized t (0-1)
   */
  getPositionAt(spline, t) {
    const index = Math.floor(t * (spline.length - 1));
    const localT = t * (spline.length - 1) - index;
    if (index >= spline.length - 1) {
      return spline[spline.length - 1];
    }
    const p1 = spline[index];
    const p2 = spline[index + 1];
    return {
      x: p1.x + (p2.x - p1.x) * localT,
      y: p1.y + (p2.y - p1.y) * localT
    };
  }
  /**
   * Generate cache key for points
   */
  getCacheKey(points) {
    return points.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`).join("|");
  }
  /**
   * Cache spline with size limit
   */
  cacheSpline(key, spline) {
    this.splineCache.set(key, spline);
    if (this.splineCache.size > this.cacheSize) {
      const firstKey = this.splineCache.keys().next().value;
      this.splineCache.delete(firstKey);
    }
  }
  /**
   * Set spline quality
   */
  setQuality(quality) {
    this.quality = quality;
    this.segmentResolution = quality === "high" ? 20 : 10;
    this.splineCache.clear();
  }
  /**
   * Cleanup
   */
  destroy() {
    this.splineCache.clear();
  }
}
export {
  SplineRenderer as default
};
