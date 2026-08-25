import * as THREE from 'three';

// Visor Lens Dynamic Paint Splatter & Drip Simulation
export class VisorOverlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.splatters = [];
    this.enabled = true;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  addSplatter(colorCss = '#00f0ff') {
    if (!this.enabled) return;

    const x = Math.random() * this.canvas.width;
    const y = Math.random() * (this.canvas.height * 0.7);
    const radius = 25 + Math.random() * 45;

    this.splatters.push({
      x: x,
      y: y,
      radius: radius,
      color: colorCss,
      opacity: 0.85,
      dripY: 0,
      dripSpeed: 0.4 + Math.random() * 1.2,
      dripLength: 40 + Math.random() * 80,
      life: 0.0,
      maxLife: 4.5 + Math.random() * 2.0
    });
  }

  update(delta) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.enabled || this.splatters.length === 0) return;

    const active = [];

    for (let i = 0; i < this.splatters.length; i++) {
      const s = this.splatters[i];
      s.life += delta;

      if (s.life >= s.maxLife) continue;

      // Slowly drip downward
      if (s.dripY < s.dripLength) {
        s.dripY += s.dripSpeed;
      }

      // Fade out over second half of life
      if (s.life > s.maxLife * 0.6) {
        s.opacity = THREE.MathUtils.lerp(s.opacity, 0.0, delta * 2.5);
      }

      this.ctx.save();
      this.ctx.globalAlpha = s.opacity;

      // Draw Main Splat
      this.ctx.fillStyle = s.color;
      this.ctx.shadowColor = s.color;
      this.ctx.shadowBlur = 12;

      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw Glossy Wet Specular Highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(s.x - s.radius * 0.3, s.y - s.radius * 0.3, s.radius * 0.25, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw Viscous Paint Drip Trail
      if (s.dripY > 0) {
        this.ctx.fillStyle = s.color;
        this.ctx.beginPath();
        this.ctx.moveTo(s.x - s.radius * 0.3, s.y + s.radius * 0.5);
        this.ctx.lineTo(s.x + s.radius * 0.3, s.y + s.radius * 0.5);
        this.ctx.lineTo(s.x + 4, s.y + s.radius * 0.5 + s.dripY);
        this.ctx.arc(s.x, s.y + s.radius * 0.5 + s.dripY, 6, 0, Math.PI);
        this.ctx.lineTo(s.x - s.radius * 0.3, s.y + s.radius * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
      }

      this.ctx.restore();
      active.push(s);
    }

    this.splatters = active;
  }

  clear() {
    this.splatters = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
