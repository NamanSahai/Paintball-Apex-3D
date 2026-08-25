import * as THREE from 'three';
import { sound } from '../engine/AudioEngine.js';

export class BallisticsEngine {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];

    // Environmental Wind Vector (m/s)
    this.wind = new THREE.Vector3(0, 0, 0);

    // Gravity Constant for Fast-Paced Paintball Feel
    this.gravity = -12.5;
    this.dragCoeff = 0.008;

    // Shared Paintball Geometries and Materials Pool
    this.ballGeo = new THREE.SphereGeometry(0.038, 12, 10);
    this.matCache = new Map();

    // Raycaster for swept continuous collision detection
    this.raycaster = new THREE.Raycaster();

    // Hit Callbacks
    this.onHitCallback = null;
  }

  setWind(windVector) {
    this.wind.copy(windVector);
  }

  getMaterial(colorHex, isPlasma = false) {
    const key = `${colorHex}_${isPlasma}`;
    if (!this.matCache.has(key)) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: isPlasma ? 1.5 : 0.25,
        roughness: 0.1,
        metalness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.8
      });
      this.matCache.set(key, mat);
    }
    return this.matCache.get(key);
  }

  spawnProjectiles(bulletDataList) {
    for (const data of bulletDataList) {
      const mat = this.getMaterial(data.colorHex, data.isPlasma);
      const mesh = new THREE.Mesh(this.ballGeo, mat);
      mesh.position.copy(data.origin);
      this.scene.add(mesh);

      this.projectiles.push({
        mesh: mesh,
        position: data.origin.clone(),
        velocity: data.velocity.clone(),
        colorHex: data.colorHex,
        isPlasma: data.isPlasma,
        weaponId: data.weaponId,
        age: 0.0,
        maxLife: 3.5,
        prevPos: data.origin.clone()
      });
    }
  }

  update(delta, targetMeshes, obstacleMeshes) {
    const activeProjectiles = [];

    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      p.age += delta;

      if (p.age >= p.maxLife) {
        this.scene.remove(p.mesh);
        continue;
      }

      // Record Previous Position for Swept Raycast
      p.prevPos.copy(p.position);

      // Physics Integration: Gravity + Wind + Aerodynamic Drag
      const speed = p.velocity.length();
      const dragForce = p.velocity.clone().multiplyScalar(-this.dragCoeff * speed);

      p.velocity.y += this.gravity * delta;
      p.velocity.addScaledVector(this.wind, delta * 0.4);
      p.velocity.addScaledVector(dragForce, delta);

      p.position.addScaledVector(p.velocity, delta);
      p.mesh.position.copy(p.position);

      // Align Ball Capsule with Velocity Vector
      if (speed > 0.1) {
        p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.velocity.clone().normalize());
      }

      // Continuous Collision Detection (CCD) Raycast from PrevPos to CurrentPos
      const moveVec = p.position.clone().sub(p.prevPos);
      const moveDist = moveVec.length();

      if (moveDist > 0.001) {
        this.raycaster.set(p.prevPos, moveVec.normalize());
        this.raycaster.far = moveDist + 0.05;

        // 1. Check Target Meshes
        const targetHits = this.raycaster.intersectObjects(targetMeshes, true);
        if (targetHits.length > 0) {
          const hit = targetHits[0];
          this.handleHit(p, hit, true);
          this.scene.remove(p.mesh);
          continue;
        }

        // 2. Check Obstacle / Wall Meshes
        const envHits = this.raycaster.intersectObjects(obstacleMeshes, true);
        if (envHits.length > 0) {
          const hit = envHits[0];
          this.handleHit(p, hit, false);
          this.scene.remove(p.mesh);
          continue;
        }

        // 3. Floor Ground Collision (Y <= 0)
        if (p.position.y <= 0.02) {
          const floorHit = {
            point: new THREE.Vector3(p.position.x, 0.01, p.position.z),
            face: { normal: new THREE.Vector3(0, 1, 0) },
            object: null
          };
          this.handleHit(p, floorHit, false);
          this.scene.remove(p.mesh);
          continue;
        }
      }

      activeProjectiles.push(p);
    }

    this.projectiles = activeProjectiles;
  }

  handleHit(projectile, intersection, isTarget) {
    // Play Splat Audio
    sound.playSplatImpact(projectile.weaponId === 'shotgun' || projectile.isPlasma);

    // Compute accurate World Normal
    let worldNormal = new THREE.Vector3(0, 1, 0);
    if (intersection.face && intersection.object) {
      worldNormal = intersection.face.normal.clone().transformDirection(intersection.object.matrixWorld).normalize();
    } else if (intersection.face) {
      worldNormal = intersection.face.normal.clone().normalize();
    }

    // Notify Hit Listeners (Decals, Target Scoring, Particles)
    this.onHitCallback?.({
      projectile: projectile,
      point: intersection.point,
      normal: worldNormal,
      object: intersection.object,
      isTarget: isTarget,
      colorHex: projectile.colorHex,
      weaponId: projectile.weaponId,
      isPlasma: projectile.isPlasma
    });
  }

  clear() {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
  }
}
