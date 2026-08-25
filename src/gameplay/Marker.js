import * as THREE from 'three';
import { GunModels } from './GunModels.js';
import { sound } from '../engine/AudioEngine.js';

export const WEAPON_TYPES = {
  electro: {
    id: 'electro',
    name: 'APEX ECLIPSE PRO',
    type: 'SPEEDBALL ELECTRO',
    fireMode: 'AUTO RAMP',
    maxAmmo: 160,
    pods: 4,
    fireRate: 15.0, // Shots per sec
    velocity: 92.0, // m/s
    spread: 0.007,
    recoilPitch: 0.025,
    pellets: 1,
    auto: true
  },
  tactical: {
    id: 'tactical',
    name: 'VIPER TACTICAL DMR',
    type: 'MILSIM SNIPER',
    fireMode: 'SEMI-AUTO',
    maxAmmo: 60,
    pods: 4,
    fireRate: 5.0,
    velocity: 125.0,
    spread: 0.0015,
    recoilPitch: 0.05,
    pellets: 1,
    auto: false
  },
  shotgun: {
    id: 'shotgun',
    name: 'SCATTER-BLAST 500',
    type: 'HEAVY CANNON',
    fireMode: 'PUMP BLAST',
    maxAmmo: 40,
    pods: 4,
    fireRate: 2.2,
    velocity: 78.0,
    spread: 0.032,
    recoilPitch: 0.08,
    pellets: 5,
    auto: false
  },
  plasma: {
    id: 'plasma',
    name: 'HYPERION PLASMA V2',
    type: 'EXPERIMENTAL',
    fireMode: 'HYPER AUTO',
    maxAmmo: 120,
    pods: 4,
    fireRate: 14.0,
    velocity: 145.0,
    spread: 0.004,
    recoilPitch: 0.03,
    pellets: 1,
    auto: true
  }
};

export class MarkerManager {
  constructor(camera) {
    this.camera = camera;
    this.gunPivot = new THREE.Group();
    this.camera.add(this.gunPivot);

    this.currentWeaponId = 'electro';
    this.currentWeaponData = WEAPON_TYPES.electro;

    this.paintColorHex = 0x00f0ff;
    this.paintColors = [
      { name: 'Neon Cyan', hex: 0x00f0ff, css: '#00f0ff' },
      { name: 'Electric Pink', hex: 0xff0055, css: '#ff0055' },
      { name: 'Slime Green', hex: 0x39ff14, css: '#39ff14' },
      { name: 'Solar Orange', hex: 0xff7700, css: '#ff7700' },
      { name: 'Toxic Purple', hex: 0xb800ff, css: '#b800ff' },
      { name: 'Golden Amber', hex: 0xffe600, css: '#ffe600' }
    ];
    this.colorIndex = 0;

    // Ammo & Pod State
    this.ammo = 160;
    this.maxAmmo = 160;
    this.pods = 4;
    this.isReloading = false;
    this.reloadTimer = 0.0;
    this.reloadDuration = 1.3;

    // Firing Timing & BPS
    this.lastShotTime = 0.0;
    this.shotCooldown = 1.0 / this.currentWeaponData.fireRate;
    this.recentShots = [];
    this.currentBps = 0.0;

    // Viewmodel Positioning
    this.viewmodel = null;
    this.muzzleLight = null;
    this.muzzleFlashTimer = 0.0;

    // Procedural Animation States
    this.recoilZ = 0.0;
    this.recoilRotX = 0.0;
    this.swayOffset = new THREE.Vector2();
    this.swayRoll = 0.0;
    this.walkCycle = 0.0;
    this.reloadDuration = 1.6;

    this.onFireCallback = null;
    this.onAmmoChange = null;

    this.buildWeapon('electro');
    this.setupMuzzleFlash();
  }

  setupMuzzleFlash() {
    this.muzzleLight = new THREE.PointLight(this.paintColorHex, 0, 8);
    this.gunPivot.add(this.muzzleLight);
  }

  setPaintColor(index) {
    this.colorIndex = (index + this.paintColors.length) % this.paintColors.length;
    this.paintColorHex = this.paintColors[this.colorIndex].hex;
    this.buildWeapon(this.currentWeaponId);
    if (this.muzzleLight) {
      this.muzzleLight.color.setHex(this.paintColorHex);
    }
  }

  cyclePaintColor() {
    this.setPaintColor(this.colorIndex + 1);
    return this.paintColors[this.colorIndex];
  }

  buildWeapon(weaponId) {
    this.isReloading = false;
    this.reloadTimer = 0.0;
    this.currentWeaponId = weaponId;
    this.currentWeaponData = WEAPON_TYPES[weaponId] || WEAPON_TYPES.electro;
    this.maxAmmo = this.currentWeaponData.maxAmmo;
    this.ammo = this.maxAmmo;
    this.shotCooldown = 1.0 / this.currentWeaponData.fireRate;

    // Remove existing weapon model
    if (this.viewmodel && this.viewmodel.mesh) {
      this.gunPivot.remove(this.viewmodel.mesh);
    }

    if (weaponId === 'tactical') {
      this.viewmodel = GunModels.createTacticalMarker(this.paintColorHex);
    } else if (weaponId === 'shotgun') {
      this.viewmodel = GunModels.createShotgunMarker(this.paintColorHex);
    } else if (weaponId === 'plasma') {
      this.viewmodel = GunModels.createPlasmaMarker(this.paintColorHex);
    } else {
      this.viewmodel = GunModels.createElectroMarker(this.paintColorHex);
    }

    this.gunPivot.add(this.viewmodel.mesh);
    this.viewmodel.mesh.position.copy(this.viewmodel.normalOffset);

    // Initial hopper paintball count setup
    this.updatePaintballVisuals(1.0, false, 0.0);
    this.onAmmoChange?.(this.ammo, this.maxAmmo, this.pods);
  }

  reload() {
    if (this.isReloading || this.ammo >= this.maxAmmo) return;
    
    // Auto-replenish pods if empty so player is never locked
    if (this.pods <= 0) {
      this.pods = 4;
    }

    this.isReloading = true;
    this.reloadTimer = this.reloadDuration;
    if (this.viewmodel && this.viewmodel.hands && this.viewmodel.hands.reloadPod) {
      this.viewmodel.hands.reloadPod.group.visible = true;
      if (this.viewmodel.hands.reloadPod.podBalls) {
        this.viewmodel.hands.reloadPod.podBalls.forEach(b => b.visible = true);
      }
    }
    sound.playReload();
    this.onAmmoChange?.(this.ammo, this.maxAmmo, this.pods);
  }

  tryFire(input, playerCam, currentTime) {
    if (this.isReloading) return [];

    const wantsFire = this.currentWeaponData.auto ? input.mouse.fire : (input.mouse.fireDown || input.mouse.fire);
    if (!wantsFire) return [];

    if (currentTime - this.lastShotTime < this.shotCooldown) return [];

    // Consume single-click trigger
    input.mouse.fireDown = false;

    if (this.ammo <= 0) {
      this.reload();
      return [];
    }

    // Execute Fire
    this.ammo--;
    this.lastShotTime = currentTime;
    this.recentShots.push(currentTime);

    // Play marker sound
    sound.playMarkerFire(this.currentWeaponId);

    // Apply recoil animation
    this.recoilZ = 0.07;
    this.recoilRotX = 0.12;
    playerCam.applyRecoilKick(this.currentWeaponData.recoilPitch, this.currentWeaponData.recoilPitch * 0.4);

    // Trigger Muzzle Flash
    if (this.muzzleLight) {
      this.muzzleLight.intensity = 4.5;
      this.muzzleLight.position.copy(this.viewmodel.muzzleOffset);
      this.muzzleFlashTimer = 0.05;
    }

    // Trigger Animated Bolt/Pump
    if (this.viewmodel.bolt) {
      this.viewmodel.bolt.position.z = 0.12;
    }

    // Spawn Projectiles
    const projectiles = [];
    const cameraWorldPos = new THREE.Vector3();
    this.camera.getWorldPosition(cameraWorldPos);

    const cameraWorldDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraWorldDir);

    const pelletCount = this.currentWeaponData.pellets;
    for (let i = 0; i < pelletCount; i++) {
      const spread = this.currentWeaponData.spread * (playerCam.isADS ? 0.4 : 1.0);
      const spreadX = (Math.random() - 0.5) * spread;
      const spreadY = (Math.random() - 0.5) * spread;

      const fireDir = cameraWorldDir.clone();
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);

      fireDir.addScaledVector(right, spreadX);
      fireDir.addScaledVector(up, spreadY);
      fireDir.normalize();

      projectiles.push({
        origin: cameraWorldPos.clone().addScaledVector(cameraWorldDir, 0.2),
        velocity: fireDir.multiplyScalar(this.currentWeaponData.velocity),
        colorHex: this.paintColorHex,
        isPlasma: this.currentWeaponId === 'plasma',
        weaponId: this.currentWeaponId
      });
    }

    this.onAmmoChange?.(this.ammo, this.maxAmmo, this.pods);
    return projectiles;
  }

  updatePaintballVisuals(ammoRatio, isReloading, reloadProgress) {
    if (!this.viewmodel || !this.viewmodel.hopperBalls) return;

    const pod = this.viewmodel.hands ? this.viewmodel.hands.reloadPod : null;

    if (isReloading) {
      if (reloadProgress < 0.28) {
        // Phase 1: Pod is drawn full from harness
        if (pod && pod.podBalls) pod.podBalls.forEach(b => b.visible = true);
        if (pod && pod.pourBalls) pod.pourBalls.forEach(b => b.visible = false);

        // Hopper has current remaining ammo level
        const count = Math.ceil(ammoRatio * this.viewmodel.hopperBalls.length);
        this.viewmodel.hopperBalls.forEach((b, i) => b.visible = (i < count));
      } else if (reloadProgress <= 0.80) {
        // Phase 2 & 3: Pouring into hopper
        const pourRatio = (reloadProgress - 0.28) / 0.52;

        // Pod empties from top to bottom
        if (pod && pod.podBalls) {
          const podVis = Math.floor((1.0 - pourRatio) * pod.podBalls.length);
          pod.podBalls.forEach((b, i) => b.visible = (i < podVis));
        }

        // Animated pouring stream cascading into hopper
        if (pod && pod.pourBalls) {
          pod.pourBalls.forEach((ball, idx) => {
            const streamCycle = (pourRatio * 4.5 + idx * 0.18) % 1.0;
            ball.visible = true;
            ball.position.set(
              (Math.random() - 0.5) * 0.008,
              0.09 - streamCycle * 0.12,
              (Math.random() - 0.5) * 0.008
            );
          });
        }

        // Hopper visibly stacks and fills from bottom to top!
        const baseCount = Math.ceil(ammoRatio * this.viewmodel.hopperBalls.length);
        const fillCount = Math.min(this.viewmodel.hopperBalls.length, Math.floor(baseCount + pourRatio * (this.viewmodel.hopperBalls.length - baseCount)));
        this.viewmodel.hopperBalls.forEach((b, i) => b.visible = (i < fillCount));
      } else {
        // Phase 4: Pod is empty, stream finishes, hopper is 100% full
        if (pod && pod.podBalls) pod.podBalls.forEach(b => b.visible = false);
        if (pod && pod.pourBalls) pod.pourBalls.forEach(b => b.visible = false);
        this.viewmodel.hopperBalls.forEach(b => b.visible = true);
      }
    } else {
      // Normal gameplay / shooting - Balls drain as you shoot!
      const count = Math.ceil(ammoRatio * this.viewmodel.hopperBalls.length);
      this.viewmodel.hopperBalls.forEach((b, i) => {
        b.visible = (i < count);
      });
    }
  }

  update(input, playerCam, delta, time) {
    // 1. Calculate Real-time BPS (Balls Per Second)
    this.recentShots = this.recentShots.filter(t => time - t < 1.0);
    this.currentBps = this.recentShots.length;

    // 2. Muzzle Flash Decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0 && this.muzzleLight) {
        this.muzzleLight.intensity = 0;
      }
    }

    // 3. Double-Trigger Walking Fingers Animation
    if (this.viewmodel && this.viewmodel.hands) {
      const isFiring = input.mouse.fire || this.currentBps > 0;
      if (isFiring) {
        const fingerCycle = Math.sin(time * 36.0);
        this.viewmodel.hands.triggerFinger1.rotation.x = 0.4 + fingerCycle * 0.25;
        this.viewmodel.hands.triggerFinger2.rotation.x = 0.4 - fingerCycle * 0.25;
      } else {
        this.viewmodel.hands.triggerFinger1.rotation.x = THREE.MathUtils.lerp(this.viewmodel.hands.triggerFinger1.rotation.x, 0.4, delta * 12.0);
        this.viewmodel.hands.triggerFinger2.rotation.x = THREE.MathUtils.lerp(this.viewmodel.hands.triggerFinger2.rotation.x, 0.4, delta * 12.0);
      }
    }

    // 4. Smooth Walking Harmonic Bobbing & Inertial Sway
    const isMoving = (input.keys.forward || input.keys.backward || input.keys.left || input.keys.right) && playerCam.isGrounded;
    if (isMoving) {
      const walkSpeed = input.keys.sprint ? 14.0 : 8.5;
      this.walkCycle += delta * walkSpeed;
    }

    const bobIntensity = playerCam.isADS ? 0.15 : (input.keys.sprint ? 1.4 : 1.0);
    const walkBobY = isMoving ? Math.sin(this.walkCycle * 2.0) * 0.007 * bobIntensity : 0.0;
    const walkBobX = isMoving ? Math.cos(this.walkCycle) * 0.005 * bobIntensity : 0.0;
    const walkTiltZ = isMoving ? -Math.cos(this.walkCycle) * 0.02 * bobIntensity : 0.0;

    const mouseLagX = input.mouse.deltaX * (playerCam.isADS ? 0.015 : 0.05);
    const mouseLagY = input.mouse.deltaY * (playerCam.isADS ? 0.015 : 0.04);
    this.swayOffset.x = THREE.MathUtils.lerp(this.swayOffset.x, mouseLagX, delta * 12.0);
    this.swayOffset.y = THREE.MathUtils.lerp(this.swayOffset.y, mouseLagY, delta * 12.0);
    this.swayRoll = THREE.MathUtils.lerp(this.swayRoll, input.mouse.deltaX * 0.03, delta * 12.0);

    // 5. Weapon Recoil & Bolt Recovery
    this.recoilZ = THREE.MathUtils.lerp(this.recoilZ, 0.0, delta * 18.0);
    this.recoilRotX = THREE.MathUtils.lerp(this.recoilRotX, 0.0, delta * 18.0);
    if (this.viewmodel && this.viewmodel.bolt) {
      this.viewmodel.bolt.position.z = THREE.MathUtils.lerp(this.viewmodel.bolt.position.z, 0.08, delta * 20.0);
    }

    // 6. Viewmodel & Left Arm Hand-Held Reload Animation
    if (this.viewmodel && this.viewmodel.mesh) {
      let targetPos = playerCam.isADS ? this.viewmodel.adsOffset.clone() : this.viewmodel.normalOffset.clone();
      let targetRot = playerCam.isADS 
        ? (this.viewmodel.adsRotation ? this.viewmodel.adsRotation.clone() : new THREE.Euler(0, 0, 0))
        : new THREE.Euler(0.04, -0.06, 0.03);

      // Idle Breathing Motion
      const breathScale = playerCam.isADS ? 0.15 : 1.0;
      const breathY = Math.sin(time * 2.2) * 0.004 * breathScale;
      const breathX = Math.cos(time * 1.1) * 0.003 * breathScale;
      targetPos.y += breathY + walkBobY;
      targetPos.x += breathX + walkBobX;
      targetRot.z += walkTiltZ;

      // Left Arm & Pod Animation Poses
      let targetLeftArmPos = new THREE.Vector3(-0.06, -0.06, -0.18);
      let targetLeftArmRot = new THREE.Euler(-0.25, 0.4, -0.35);

      if (this.isReloading) {
        this.reloadTimer -= delta;
        const progress = Math.min(1.0, Math.max(0.0, 1.0 - (this.reloadTimer / this.reloadDuration)));
        const pod = this.viewmodel.hands ? this.viewmodel.hands.reloadPod : null;

        if (pod) {
          pod.group.visible = true;

          if (progress < 0.25) {
            // Phase 1: Reaching down to harness and drawing full pod up
            const p1 = progress / 0.25;
            targetLeftArmPos.set(-0.16 + p1 * 0.12, -0.32 + p1 * 0.26, 0.05 - p1 * 0.12);
            targetLeftArmRot.set(-0.6 + p1 * 1.0, 0.35 - p1 * 0.1, 0.4 - p1 * 0.2);
            pod.lidPivot.rotation.x = 0.0;
          } else if (progress < 0.45) {
            // Phase 2: Align pod over hopper opening and snap lid open
            const p2 = (progress - 0.25) / 0.20;
            targetLeftArmPos.set(-0.04 + p2 * 0.06, -0.06 + p2 * 0.18, -0.07 + p2 * 0.04);
            targetLeftArmRot.set(0.4 + p2 * 1.2, 0.25 - p2 * 0.15, 0.2 + p2 * 0.6);
            pod.lidPivot.rotation.x = THREE.MathUtils.lerp(0.0, -2.5, p2);
          } else if (progress < 0.80) {
            // Phase 3: Inverted pod pouring paintballs directly into the hopper
            const shake = Math.sin(progress * 40.0) * 0.002;
            targetLeftArmPos.set(0.02 + shake, 0.12 + shake, -0.03);
            targetLeftArmRot.set(2.2, 0.05, 1.1 + shake * 1.5);
            pod.lidPivot.rotation.x = -2.5;
          } else {
            // Phase 4: Empty pod discarded downwards, hand returning to foregrip
            const p4 = (progress - 0.80) / 0.20;
            targetLeftArmPos.set(0.02 - p4 * 0.08, 0.12 - p4 * 0.18, -0.03 - p4 * 0.15);
            targetLeftArmRot.set(2.2 - p4 * 2.45, 0.05 + p4 * 0.35, 1.1 - p4 * 1.45);
            pod.lidPivot.rotation.x = 0.0;
          }
        }

        // Marker posture: tilted back naturally to receive paint
        targetPos.set(0.14, -0.19, -0.36);
        targetRot.set(0.32, -0.10, -0.15);

        this.updatePaintballVisuals(this.ammo / this.maxAmmo, true, progress);

        if (this.reloadTimer <= 0) {
          this.isReloading = false;
          if (pod) {
            pod.group.visible = false;
            if (pod.pourBalls) pod.pourBalls.forEach(b => b.visible = false);
          }
          this.ammo = this.maxAmmo;
          this.pods = Math.max(0, this.pods - 1);
          if (this.pods === 0) {
            this.pods = 4;
          }
          this.onAmmoChange?.(this.ammo, this.maxAmmo, this.pods);
          this.updatePaintballVisuals(1.0, false, 0.0);
        }
      } else {
        if (this.viewmodel.hands && this.viewmodel.hands.reloadPod) {
          this.viewmodel.hands.reloadPod.group.visible = false;
          if (this.viewmodel.hands.reloadPod.pourBalls) {
            this.viewmodel.hands.reloadPod.pourBalls.forEach(b => b.visible = false);
          }
        }

        if (playerCam.isSprinting && playerCam.isGrounded) {
          targetPos.y -= 0.08;
          targetPos.x += 0.03;
          targetRot.x = -0.32;
          targetRot.y = 0.28;
          targetRot.z = -0.18;
        }

        this.updatePaintballVisuals(this.ammo / this.maxAmmo, false, 0.0);
      }

      // Smooth Left Arm Movement
      if (this.viewmodel.hands && this.viewmodel.hands.leftArmGroup) {
        this.viewmodel.hands.leftArmGroup.position.lerp(targetLeftArmPos, delta * 20.0);
        this.viewmodel.hands.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.viewmodel.hands.leftArmGroup.rotation.x, targetLeftArmRot.x, delta * 20.0);
        this.viewmodel.hands.leftArmGroup.rotation.y = THREE.MathUtils.lerp(this.viewmodel.hands.leftArmGroup.rotation.y, targetLeftArmRot.y, delta * 20.0);
        this.viewmodel.hands.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.viewmodel.hands.leftArmGroup.rotation.z, targetLeftArmRot.z, delta * 20.0);
      }

      // Add recoil offset & inertial mouse sway
      targetPos.z += this.recoilZ;
      targetPos.x -= this.swayOffset.x;
      targetPos.y += this.swayOffset.y;
      targetRot.z -= this.swayRoll;

      this.viewmodel.mesh.position.lerp(targetPos, delta * 20.0);
      this.viewmodel.mesh.rotation.x = THREE.MathUtils.lerp(this.viewmodel.mesh.rotation.x, targetRot.x + this.recoilRotX, delta * 20.0);
      this.viewmodel.mesh.rotation.y = THREE.MathUtils.lerp(this.viewmodel.mesh.rotation.y, targetRot.y, delta * 20.0);
      this.viewmodel.mesh.rotation.z = THREE.MathUtils.lerp(this.viewmodel.mesh.rotation.z, targetRot.z, delta * 20.0);
    }

      // 7. Update OLED Display if available
      if (this.viewmodel && this.viewmodel.oled) {
        const { ctx, texture, canvas } = this.viewmodel.oled;
        const grad = ctx.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, '#040914');
        grad.addColorStop(1, '#081426');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#39ff14';
        ctx.fillText(this.currentWeaponData.name, 16, 26);

        // Battery Bar
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(190, 12, 45, 14);

        ctx.font = 'bold 44px monospace';
        ctx.fillStyle = this.ammo < 30 ? '#ff0055' : '#00f0ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillText(`${this.ammo}`, 16, 74);

        ctx.shadowBlur = 0;
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#7f8fa4';
        ctx.fillText(`/${this.maxAmmo}`, 110, 74);

        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#ffe600';
        ctx.fillText(`RATE: ${this.currentBps.toFixed(1)} BPS`, 16, 110);

        ctx.fillStyle = '#00f0ff';
        ctx.fillText(`• ${this.currentWeaponData.fireMode}`, 140, 110);

        texture.needsUpdate = true;
      }
  }
}
