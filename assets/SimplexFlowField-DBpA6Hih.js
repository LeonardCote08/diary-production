const SQRT3 = /* @__PURE__ */ Math.sqrt(3);
const F2 = 0.5 * (SQRT3 - 1);
const G2 = (3 - SQRT3) / 6;
const fastFloor = (x) => Math.floor(x) | 0;
const grad2 = /* @__PURE__ */ new Float64Array([
  1,
  1,
  -1,
  1,
  1,
  -1,
  -1,
  -1,
  1,
  0,
  -1,
  0,
  1,
  0,
  -1,
  0,
  0,
  1,
  0,
  -1,
  0,
  1,
  0,
  -1
]);
function createNoise2D(random = Math.random) {
  const perm = buildPermutationTable(random);
  const permGrad2x = new Float64Array(perm).map((v) => grad2[v % 12 * 2]);
  const permGrad2y = new Float64Array(perm).map((v) => grad2[v % 12 * 2 + 1]);
  return function noise2D(x, y) {
    let n0 = 0;
    let n1 = 0;
    let n2 = 0;
    const s = (x + y) * F2;
    const i = fastFloor(x + s);
    const j = fastFloor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    let i1, j1;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = ii + perm[jj];
      const g0x = permGrad2x[gi0];
      const g0y = permGrad2y[gi0];
      t0 *= t0;
      n0 = t0 * t0 * (g0x * x0 + g0y * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = ii + i1 + perm[jj + j1];
      const g1x = permGrad2x[gi1];
      const g1y = permGrad2y[gi1];
      t1 *= t1;
      n1 = t1 * t1 * (g1x * x1 + g1y * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = ii + 1 + perm[jj + 1];
      const g2x = permGrad2x[gi2];
      const g2y = permGrad2y[gi2];
      t2 *= t2;
      n2 = t2 * t2 * (g2x * x2 + g2y * y2);
    }
    return 70 * (n0 + n1 + n2);
  };
}
function buildPermutationTable(random) {
  const tableSize = 512;
  const p = new Uint8Array(tableSize);
  for (let i = 0; i < tableSize / 2; i++) {
    p[i] = i;
  }
  for (let i = 0; i < tableSize / 2 - 1; i++) {
    const r = i + ~~(random() * (256 - i));
    const aux = p[i];
    p[i] = p[r];
    p[r] = aux;
  }
  for (let i = 256; i < tableSize; i++) {
    p[i] = p[i - 256];
  }
  return p;
}
class SimplexFlowField {
  constructor(options) {
    this.resolution = options.resolution || 20;
    this.viewer = options.viewer;
    this.noise2D = createNoise2D();
    this.scale = 7e-3;
    this.timeOffset = 0;
    this.timeIncrement = 0.015;
    this.fieldCache = /* @__PURE__ */ new Map();
    this.lastFieldUpdate = 0;
    this.fieldUpdateInterval = 100;
    this.preCalculatedFields = [];
    this.currentFieldIndex = 0;
    if (this.resolution >= 40) {
      this.generatePreCalculatedFields();
    }
  }
  /**
   * Generate pre-calculated flow fields for mobile performance
   */
  generatePreCalculatedFields() {
    const fieldCount = 10;
    for (let i = 0; i < fieldCount; i++) {
      const field = {
        vectors: /* @__PURE__ */ new Map(),
        seed: i * 1e3
      };
      const gridSize = Math.ceil(1 / this.resolution);
      for (let x = 0; x <= gridSize; x++) {
        for (let y = 0; y <= gridSize; y++) {
          const worldX = x * this.resolution;
          const worldY = y * this.resolution;
          const angle = this.noise2D(
            worldX * this.scale + field.seed,
            worldY * this.scale
          ) * Math.PI * 2;
          const vector = {
            x: Math.cos(angle),
            y: Math.sin(angle),
            magnitude: 0.5 + this.noise2D(
              worldX * this.scale * 2 + field.seed,
              worldY * this.scale * 2
            ) * 0.5
          };
          field.vectors.set(`${x},${y}`, vector);
        }
      }
      this.preCalculatedFields.push(field);
    }
  }
  /**
   * Calculate flow path between two bounds
   */
  calculatePath(startBounds, targetBounds) {
    const startCenter = startBounds.getCenter();
    const targetCenter = targetBounds.getCenter();
    if (this.resolution >= 40 && this.preCalculatedFields.length > 0) {
      return this.calculatePreCalculatedPath(startCenter, targetCenter);
    }
    return this.calculateDynamicPath(startCenter, targetCenter);
  }
  /**
   * Calculate path using pre-calculated fields (mobile)
   */
  calculatePreCalculatedPath(startCenter, targetCenter) {
    const pathHash = Math.abs(startCenter.x + startCenter.y + targetCenter.x + targetCenter.y);
    const fieldIndex = Math.floor(pathHash * 10) % this.preCalculatedFields.length;
    const field = this.preCalculatedFields[fieldIndex];
    return {
      getInfluence: (progress) => {
        const currentX = startCenter.x + (targetCenter.x - startCenter.x) * progress;
        const currentY = startCenter.y + (targetCenter.y - startCenter.y) * progress;
        const gridX = Math.floor(currentX / this.resolution);
        const gridY = Math.floor(currentY / this.resolution);
        const vector = field.vectors.get(`${gridX},${gridY}`);
        if (vector) {
          const influence = 1 - progress;
          return {
            x: vector.x * vector.magnitude * influence * 0.02,
            y: vector.y * vector.magnitude * influence * 0.02
          };
        }
        return { x: 0, y: 0 };
      }
    };
  }
  /**
   * Calculate dynamic path with real-time noise (desktop)
   */
  calculateDynamicPath(startCenter, targetCenter) {
    const pathLength = Math.sqrt(
      Math.pow(targetCenter.x - startCenter.x, 2) + Math.pow(targetCenter.y - startCenter.y, 2)
    );
    const now = performance.now();
    if (now - this.lastFieldUpdate > this.fieldUpdateInterval) {
      this.timeOffset += this.timeIncrement;
      this.lastFieldUpdate = now;
    }
    return {
      pathLength,
      getInfluence: (progress) => {
        const currentX = startCenter.x + (targetCenter.x - startCenter.x) * progress;
        const currentY = startCenter.y + (targetCenter.y - startCenter.y) * progress;
        const flowVector = this.sampleFlowField(currentX, currentY);
        const pathDirX = targetCenter.x - startCenter.x;
        const pathDirY = targetCenter.y - startCenter.y;
        const pathNorm = Math.sqrt(pathDirX * pathDirX + pathDirY * pathDirY);
        if (pathNorm > 0) {
          const perpX = -pathDirY / pathNorm;
          const perpY = pathDirX / pathNorm;
          const influence = Math.sin(progress * Math.PI);
          const smoothedDeviation = Math.sin(progress * Math.PI * 2 + flowVector.x * 0.5);
          const distanceScale = Math.min(pathLength * 0.5, 0.3);
          const strength = 0.2 * distanceScale;
          return {
            x: perpX * smoothedDeviation * influence * strength,
            y: perpY * smoothedDeviation * influence * strength
          };
        }
        return { x: 0, y: 0 };
      }
    };
  }
  /**
   * Sample flow field at a specific position
   */
  sampleFlowField(x, y) {
    const cacheKey = `${Math.round(x * 1e3)},${Math.round(y * 1e3)}`;
    if (this.fieldCache.has(cacheKey)) {
      return this.fieldCache.get(cacheKey);
    }
    const angle = this.noise2D(
      x * this.scale * 0.5 + this.timeOffset,
      // Reduced frequency
      y * this.scale * 0.5
    ) * Math.PI;
    const magnitude = 0.3 + this.noise2D(
      // Reduced base magnitude
      x * this.scale + this.timeOffset,
      y * this.scale
    ) * 0.2;
    const vector = {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude
    };
    this.fieldCache.set(cacheKey, vector);
    if (this.fieldCache.size > 1e3) {
      const firstKey = this.fieldCache.keys().next().value;
      this.fieldCache.delete(firstKey);
    }
    return vector;
  }
  /**
   * Update resolution
   */
  setResolution(newResolution) {
    this.resolution = newResolution;
    this.fieldCache.clear();
    if (newResolution >= 40) {
      this.generatePreCalculatedFields();
    }
  }
  /**
   * Set noise scale for different effects
   */
  setScale(newScale) {
    this.scale = newScale;
    this.fieldCache.clear();
  }
  /**
   * Cleanup
   */
  destroy() {
    this.fieldCache.clear();
    this.preCalculatedFields = [];
  }
}
export {
  SimplexFlowField as default
};
