import * as THREE from 'three';

export class PaintDecalManager {
  constructor(scene) {
    this.scene = scene;
    this.decals = [];
    this.particles = [];
    this.maxDecals = 200;

    // Generate Procedural Splatter Textures
    this.splatTextures = [
      this.generateSplatterTexture(0),
      this.generateSplatterTexture(1),
      this.generateSplatterTexture(2)
    ];

    // Shared particle geometry
    this.particleGeo = new THREE.SphereGeometry(0.018, 6, 6);
  }

  setMaxDecals(limit) {
    this.maxDecals = limit;
    while (this.decals.length > this.maxDecals) {
      const old = this.decals.shift();
      this.scene.remove(old);
    }
  }

  generateSplatterTexture(seed = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const cx = 128;
    const cy = 128;

    ctx.clearRect(0, 0, 256, 256);

    // Central Glossy Paint Blob
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const mainRadius = 42 + seed * 6;
    const points = 16;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = mainRadius + (Math.sin(angle * 5 + seed) * 12) + (Math.cos(angle * 3) * 8);
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Radiating Splash Tendrils & Satellites
    const dropletCount = 14 + seed * 6;
    for (let j = 0; j < dropletCount; j++) {
      const dropAngle = (j / dropletCount) * Math.PI * 2 + (Math.sin(j * 3) * 0.4);
      const dropDist = 55 + Math.random() * 55;
      const dropR = 3 + Math.random() * 8;
      const dx = cx + Math.cos(dropAngle) * dropDist;
      const dy = cy + Math.sin(dropAngle) * dropDist;

      ctx.beginPath();
      ctx.arc(dx, dy, dropR, 0, Math.PI * 2);
      ctx.fill();

      // Tendril bridge
      if (Math.random() > 0.4) {
        ctx.beginPath();
        ctx.lineWidth = 2 + Math.random() * 3;
        ctx.strokeStyle = '#ffffff';
        ctx.moveTo(cx + Math.cos(dropAngle) * (mainRadius * 0.7), cy + Math.sin(dropAngle) * (mainRadius * 0.7));
        ctx.lineTo(dx, dy);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  spawnSplatter(hitPoint, hitNormal, colorHex, isPlasma = false, hitObject = null) {
    // 1. Create 3D Splatter Mesh
    const texIndex = Math.floor(Math.random() * this.splatTextures.length);
    const splatMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      map: this.splatTextures[texIndex],
      transparent: true,
      opacity: 0.95,
      roughness: 0.08,
      metalness: 0.15,
      emissive: colorHex,
      emissiveIntensity: isPlasma ? 0.8 : 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4
    });

    const splatScale = (isPlasma ? 0.55 : 0.32) + Math.random() * 0.10;
    const splatGeo = new THREE.PlaneGeometry(splatScale, splatScale);
    const splatMesh = new THREE.Mesh(splatGeo, splatMat);

    if (hitObject && hitObject.parent) {
      // Attach to Hit Object so the paint sticks to moving/falling targets & obstacles
      hitObject.updateMatrixWorld(true);

      // Convert world hit point and normal into hitObject local space
      const localHitPoint = hitObject.worldToLocal(hitPoint.clone());
      const invMat = new THREE.Matrix4().copy(hitObject.matrixWorld).invert();
      const localNormal = hitNormal.clone().transformDirection(invMat).normalize();

      splatMesh.position.copy(localHitPoint).addScaledVector(localNormal, 0.004);

      const lookTarget = localHitPoint.clone().add(localNormal);
      splatMesh.lookAt(lookTarget);
      splatMesh.rotateZ(Math.random() * Math.PI * 2);

      hitObject.add(splatMesh);
      this.decals.push({ mesh: splatMesh, parent: hitObject });
    } else {
      // Static World Placement (Floor, Ground, Static World Mesh)
      splatMesh.position.copy(hitPoint).addScaledVector(hitNormal, 0.004);

      const lookTarget = hitPoint.clone().add(hitNormal);
      splatMesh.lookAt(lookTarget);
      splatMesh.rotateZ(Math.random() * Math.PI * 2);

      this.scene.add(splatMesh);
      this.decals.push({ mesh: splatMesh, parent: this.scene });
    }

    // Limit Max Decals
    if (this.decals.length > this.maxDecals) {
      const oldest = this.decals.shift();
      if (oldest.parent) {
        oldest.parent.remove(oldest.mesh);
      } else {
        this.scene.remove(oldest.mesh);
      }
    }

    // 2. Spawn 3D Flying Fluid Particle Bursts
    const particleCount = isPlasma ? 16 : 8;
    const pMat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let k = 0; k < particleCount; k++) {
      const pMesh = new THREE.Mesh(this.particleGeo, pMat);
      pMesh.position.copy(hitPoint).addScaledVector(hitNormal, 0.02);

      // Random cone velocity along surface normal
      const spreadDir = hitNormal.clone();
      spreadDir.x += (Math.random() - 0.5) * 1.2;
      spreadDir.y += (Math.random() - 0.5) * 1.2;
      spreadDir.z += (Math.random() - 0.5) * 1.2;
      spreadDir.normalize();

      const speed = 2.5 + Math.random() * 4.5;
      const velocity = spreadDir.multiplyScalar(speed);

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        velocity: velocity,
        life: 0.0,
        maxLife: 0.5 + Math.random() * 0.3
      });
    }
  }

  update(delta) {
    const activeParticles = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        continue;
      }

      // Gravity & Velocity
      p.velocity.y -= 12.0 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Bounce on Floor
      if (p.mesh.position.y <= 0.02) {
        p.mesh.position.y = 0.02;
        p.velocity.y *= -0.3;
        p.velocity.x *= 0.7;
        p.velocity.z *= 0.7;
      }

      // Shrink scale as it dries
      const scale = Math.max(0.01, 1.0 - (p.life / p.maxLife));
      p.mesh.scale.set(scale, scale, scale);

      activeParticles.push(p);
    }

    this.particles = activeParticles;
  }

  clear() {
    for (const d of this.decals) {
      if (d.parent) d.parent.remove(d.mesh);
      else if (d.mesh) this.scene.remove(d.mesh);
      else this.scene.remove(d);
    }
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.decals = [];
    this.particles = [];
  }
}
