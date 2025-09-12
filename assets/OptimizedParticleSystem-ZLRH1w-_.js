class OptimizedParticleSystem {
  constructor(options) {
    this.maxParticles = options.maxParticles || 1e3;
    this.hasTrails = options.hasTrails || false;
    this.particleCount = 0;
    this.activeCount = 0;
    const particleFields = 7;
    this.particleData = new Float32Array(this.maxParticles * particleFields);
    this.freeIndices = new Uint16Array(this.maxParticles);
    this.activeIndices = new Uint16Array(this.maxParticles);
    for (let i = 0; i < this.maxParticles; i++) {
      this.freeIndices[i] = i;
    }
    this.freeCount = this.maxParticles;
    this.particleConfig = {
      baseSize: 2,
      sizeVariation: 1.5,
      baseLife: 1,
      lifeVariation: 0.3,
      baseSpeed: 2e-3,
      speedVariation: 1e-3,
      fadeInTime: 0.1,
      fadeOutTime: 0.3,
      color: "rgba(0, 0, 0, ",
      // Base color for black ink effect
      trailLength: this.hasTrails ? 5 : 0
    };
    this.emissionConfig = {
      rate: 50,
      // Particles per second
      spread: Math.PI / 6,
      // 30 degree spread
      burstSize: 10,
      lastEmissionTime: 0
    };
    this.particleSprites = null;
    if (this.maxParticles <= 1e3) {
      this.createParticleSprites();
    }
    if (this.hasTrails) {
      this.trailData = new Float32Array(this.maxParticles * this.particleConfig.trailLength * 2);
    }
  }
  /**
   * Create pre-rendered particle sprites
   */
  createParticleSprites() {
    const canvas = document.createElement("canvas");
    const spriteCount = 4;
    const spriteSize = 16;
    canvas.width = spriteSize * spriteCount;
    canvas.height = spriteSize;
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < spriteCount; i++) {
      const centerX = i * spriteSize + spriteSize / 2;
      const centerY = spriteSize / 2;
      const radius = spriteSize / 2 - 1;
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      const opacity = 0.2 + i / spriteCount * 0.3;
      gradient.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(0, 0, 0, ${opacity * 0.5})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(i * spriteSize, 0, spriteSize, spriteSize);
    }
    this.particleSprites = canvas;
  }
  /**
   * Emit particles at position
   */
  emitParticles(position, direction, intensity = 1) {
    const now = performance.now();
    const deltaTime = now - this.emissionConfig.lastEmissionTime;
    const particlesToEmit = Math.min(
      Math.floor(deltaTime * this.emissionConfig.rate * intensity / 1e3),
      this.emissionConfig.burstSize
    );
    for (let i = 0; i < particlesToEmit && this.freeCount > 0; i++) {
      this.emitParticle(position, direction);
    }
    this.emissionConfig.lastEmissionTime = now;
  }
  /**
   * Emit single particle
   */
  emitParticle(position, direction) {
    if (this.freeCount === 0) return;
    const particleIndex = this.freeIndices[--this.freeCount];
    this.activeIndices[this.activeCount++] = particleIndex;
    const offset = particleIndex * 7;
    this.particleData[offset] = position.center.x + (Math.random() - 0.5) * 0.01;
    this.particleData[offset + 1] = position.center.y + (Math.random() - 0.5) * 0.01;
    const angle = Math.atan2(direction.y, direction.x) + (Math.random() - 0.5) * this.emissionConfig.spread;
    const speed = this.particleConfig.baseSpeed + Math.random() * this.particleConfig.speedVariation;
    this.particleData[offset + 2] = Math.cos(angle) * speed;
    this.particleData[offset + 3] = Math.sin(angle) * speed;
    this.particleData[offset + 4] = this.particleConfig.baseLife + Math.random() * this.particleConfig.lifeVariation;
    this.particleData[offset + 5] = 0;
    this.particleData[offset + 6] = this.particleConfig.baseSize + Math.random() * this.particleConfig.sizeVariation;
  }
  /**
   * Update particles based on zoom progress
   */
  update(position, progress) {
    var _a, _b;
    const deltaTime = 16;
    if (progress > 0.1 && progress < 0.9) {
      const direction = {
        x: position.center.x - (((_a = this.lastPosition) == null ? void 0 : _a.x) || position.center.x),
        y: position.center.y - (((_b = this.lastPosition) == null ? void 0 : _b.y) || position.center.y)
      };
      const speed = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      if (speed > 1e-3) {
        this.emitParticles(position, direction, speed * 100);
      }
    }
    this.lastPosition = position.center;
    let newActiveCount = 0;
    for (let i = 0; i < this.activeCount; i++) {
      const particleIndex = this.activeIndices[i];
      const offset = particleIndex * 7;
      this.particleData[offset] += this.particleData[offset + 2] * deltaTime;
      this.particleData[offset + 1] += this.particleData[offset + 3] * deltaTime;
      this.particleData[offset + 4] -= deltaTime / 1e3;
      const life = this.particleData[offset + 4];
      if (life > this.particleConfig.baseLife - this.particleConfig.fadeInTime) {
        const fadeProgress = (this.particleConfig.baseLife - life) / this.particleConfig.fadeInTime;
        this.particleData[offset + 5] = fadeProgress;
      } else if (life < this.particleConfig.fadeOutTime) {
        this.particleData[offset + 5] = life / this.particleConfig.fadeOutTime;
      } else {
        this.particleData[offset + 5] = 1;
      }
      if (life > 0) {
        this.activeIndices[newActiveCount++] = particleIndex;
      } else {
        this.freeIndices[this.freeCount++] = particleIndex;
      }
    }
    this.activeCount = newActiveCount;
  }
  /**
   * Render particles using batch techniques
   */
  render(ctx) {
    if (this.activeCount === 0) return;
    ctx.save();
    if (this.particleSprites) {
      this.renderWithSprites(ctx);
    } else {
      this.renderDirect(ctx);
    }
    ctx.restore();
  }
  /**
   * Render using pre-rendered sprites
   */
  renderWithSprites(ctx) {
    const spriteSize = 16;
    const spriteCount = 4;
    for (let i = 0; i < this.activeCount; i++) {
      const particleIndex = this.activeIndices[i];
      const offset = particleIndex * 7;
      const x = this.particleData[offset];
      const y = this.particleData[offset + 1];
      const alpha = this.particleData[offset + 5];
      const size = this.particleData[offset + 6];
      if (alpha > 0.01) {
        const spriteIndex = particleIndex % spriteCount;
        ctx.globalAlpha = alpha * 0.6;
        ctx.drawImage(
          this.particleSprites,
          spriteIndex * spriteSize,
          0,
          spriteSize,
          spriteSize,
          x - size,
          y - size,
          size * 2,
          size * 2
        );
      }
    }
  }
  /**
   * Direct rendering for desktop
   */
  renderDirect(ctx) {
    const alphaBuckets = /* @__PURE__ */ new Map();
    for (let i = 0; i < this.activeCount; i++) {
      const particleIndex = this.activeIndices[i];
      const offset = particleIndex * 7;
      const alpha = Math.round(this.particleData[offset + 5] * 10) / 10;
      if (!alphaBuckets.has(alpha)) {
        alphaBuckets.set(alpha, []);
      }
      alphaBuckets.get(alpha).push(particleIndex);
    }
    alphaBuckets.forEach((particles, alpha) => {
      if (alpha < 0.01) return;
      ctx.fillStyle = this.particleConfig.color + alpha * 0.6 + ")";
      ctx.beginPath();
      particles.forEach((particleIndex) => {
        const offset = particleIndex * 7;
        const x = this.particleData[offset];
        const y = this.particleData[offset + 1];
        const size = this.particleData[offset + 6];
        ctx.moveTo(x + size, y);
        ctx.arc(x, y, size, 0, Math.PI * 2);
      });
      ctx.fill();
    });
  }
  /**
   * Get active particle count
   */
  getActiveCount() {
    return this.activeCount;
  }
  /**
   * Set max particles dynamically
   */
  setMaxParticles(count) {
    if (count === this.maxParticles) return;
    const newParticleData = new Float32Array(count * 7);
    const newFreeIndices = new Uint16Array(count);
    const newActiveIndices = new Uint16Array(count);
    const copyCount = Math.min(count, this.maxParticles);
    newParticleData.set(this.particleData.subarray(0, copyCount * 7));
    this.particleData = newParticleData;
    this.freeIndices = newFreeIndices;
    this.activeIndices = newActiveIndices;
    this.maxParticles = count;
    this.rebuildIndices();
  }
  /**
   * Rebuild particle indices after resize
   */
  rebuildIndices() {
    this.freeCount = 0;
    this.activeCount = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      const life = this.particleData[i * 7 + 4];
      if (life > 0) {
        this.activeIndices[this.activeCount++] = i;
      } else {
        this.freeIndices[this.freeCount++] = i;
      }
    }
  }
  /**
   * Clear all particles
   */
  clear() {
    this.activeCount = 0;
    this.freeCount = this.maxParticles;
    for (let i = 0; i < this.maxParticles; i++) {
      this.freeIndices[i] = i;
      this.particleData[i * 7 + 4] = 0;
    }
  }
  /**
   * Cleanup
   */
  destroy() {
    this.particleData = null;
    this.freeIndices = null;
    this.activeIndices = null;
    this.trailData = null;
    this.particleSprites = null;
  }
}
export {
  OptimizedParticleSystem as default
};
