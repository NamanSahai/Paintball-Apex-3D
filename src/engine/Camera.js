import * as THREE from 'three';

export class PlayerCamera {
  constructor(domElement) {
    this.domElement = domElement;

    // Three.js Camera (0.01 near plane so weapon viewmodel is never clipped)
    this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 1000);

    // Player Movement Physics State
    this.position = new THREE.Vector3(0, 1.7, 18);
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.isCrouching = false;
    this.isSliding = false;
    this.slideTimer = 0.0;
    this.stamina = 1.0; // 0.0 to 1.0
    this.isSprinting = false;
    this.isExhausted = false;

    // Stance Heights
    this.standHeight = 1.7;
    this.crouchHeight = 0.95;
    this.currentEyeHeight = 1.7;

    // Movement Constants (Realistic, Controllable Speeds)
    this.walkSpeed = 5.2;
    this.sprintSpeed = 8.4;
    this.crouchSpeed = 3.2;
    this.slideSpeed = 10.5;
    this.jumpForce = 7.5;
    this.gravity = 24.0;

    // Look Angles (Radians)
    this.yaw = 0.0;
    this.pitch = 0.0;

    // ADS & FOV
    this.baseFov = 90;
    this.targetFov = 90;
    this.currentFov = 90;
    this.isADS = false;

    // Head Bobbing & Sway
    this.bobTimer = 0.0;
    this.bobOffset = new THREE.Vector3();

    // Recoil Spring
    this.recoilPitch = 0.0;
    this.recoilYaw = 0.0;
    this.recoilRoll = 0.0;

    // Obstacle Colliders
    this.colliders = [];
    this.playerRadius = 0.45;
  }

  setColliders(colliders) {
    this.colliders = colliders;
  }

  setBaseFov(fov) {
    this.baseFov = fov;
    if (!this.isADS) {
      this.targetFov = fov;
    }
  }

  applyRecoilKick(pitchAmount = 0.04, yawAmount = 0.015) {
    this.recoilPitch += pitchAmount;
    this.recoilYaw += (Math.random() - 0.5) * yawAmount;
    this.recoilRoll += (Math.random() - 0.5) * (yawAmount * 0.5);
  }

  update(input, delta) {
    if (!input.isLocked) return;

    // 1. Process Mouse Look
    this.yaw -= input.mouse.deltaX;
    this.pitch -= input.mouse.deltaY;

    // Clamp pitch between -89 deg and +89 deg
    const maxPitch = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    // Reset mouse deltas after applying
    input.resetDeltas();

    // 2. Smooth ADS (Aim Down Sights) FOV
    this.isADS = input.mouse.ads;
    this.targetFov = this.isADS ? (this.baseFov * 0.6) : this.baseFov;
    this.currentFov = THREE.MathUtils.lerp(this.currentFov, this.targetFov, delta * 15.0);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    // 3. Stamina & Exhaustion Management (No Oscillation/Glitches)
    const wantsSprint = input.keys.sprint && input.keys.forward && !this.isADS;

    if (this.stamina <= 0.0) {
      this.isExhausted = true;
    } else if (this.isExhausted && this.stamina >= 0.35) {
      this.isExhausted = false;
    }

    this.isSprinting = wantsSprint && !this.isExhausted && this.stamina > 0.0;

    // 4. Stance Logic (Crouch / Slide)
    const wantsCrouch = input.keys.crouch;

    if (wantsCrouch && !this.isCrouching) {
      if (this.isSprinting && this.isGrounded && this.velocity.length() > 4.5) {
        // Trigger Slide
        this.isSliding = true;
        this.slideTimer = 0.8;
      }
      this.isCrouching = true;
    } else if (!wantsCrouch && this.isCrouching) {
      this.isCrouching = false;
      this.isSliding = false;
    }

    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Smooth Eye Height Transition
    const targetHeight = this.isCrouching ? this.crouchHeight : this.standHeight;
    this.currentEyeHeight = THREE.MathUtils.lerp(this.currentEyeHeight, targetHeight, delta * 14.0);

    // 5. Movement Speed Calculation
    let moveSpeed = this.walkSpeed;
    if (this.isSliding) {
      moveSpeed = this.slideSpeed;
    } else if (this.isCrouching) {
      moveSpeed = this.crouchSpeed;
    } else if (this.isSprinting) {
      moveSpeed = this.sprintSpeed;
      this.stamina = Math.max(0.0, this.stamina - delta * 0.22);
    } else {
      this.stamina = Math.min(1.0, this.stamina + delta * 0.30);
    }

    // Desired Move Direction (Relative to player yaw)
    const moveDir = new THREE.Vector3();
    if (input.keys.forward) moveDir.z -= 1;
    if (input.keys.backward) moveDir.z += 1;
    if (input.keys.left) moveDir.x -= 1;
    if (input.keys.right) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    }

    // Apply Acceleration / Damping
    const targetVelX = moveDir.x * moveSpeed;
    const targetVelZ = moveDir.z * moveSpeed;
    const accelRate = this.isGrounded ? 18.0 : 4.0;

    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, delta * accelRate);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, delta * accelRate);

    // Jump & Gravity
    if (input.keys.jump && this.isGrounded && !this.isCrouching) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    this.velocity.y -= this.gravity * delta;

    // Compute Next Position with Collision Detection
    const nextPos = this.position.clone();
    nextPos.x += this.velocity.x * delta;
    nextPos.z += this.velocity.z * delta;
    nextPos.y += this.velocity.y * delta;

    // Floor Collision
    if (nextPos.y <= 0) {
      nextPos.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Obstacle Box & Cylinder Collisions
    for (const collider of this.colliders) {
      if (!collider || !collider.box) continue;
      const box = collider.box;

      // Expand box by player radius
      if (
        nextPos.x >= box.min.x - this.playerRadius &&
        nextPos.x <= box.max.x + this.playerRadius &&
        nextPos.z >= box.min.z - this.playerRadius &&
        nextPos.z <= box.max.z + this.playerRadius &&
        nextPos.y < box.max.y && nextPos.y + this.currentEyeHeight > box.min.y
      ) {
        // Determine closest push-out edge
        const dx1 = Math.abs(nextPos.x - (box.min.x - this.playerRadius));
        const dx2 = Math.abs(nextPos.x - (box.max.x + this.playerRadius));
        const dz1 = Math.abs(nextPos.z - (box.min.z - this.playerRadius));
        const dz2 = Math.abs(nextPos.z - (box.max.z + this.playerRadius));

        const minD = Math.min(dx1, dx2, dz1, dz2);
        if (minD === dx1) nextPos.x = box.min.x - this.playerRadius;
        else if (minD === dx2) nextPos.x = box.max.x + this.playerRadius;
        else if (minD === dz1) nextPos.z = box.min.z - this.playerRadius;
        else if (minD === dz2) nextPos.z = box.max.z + this.playerRadius;
      }
    }

    this.position.copy(nextPos);

    // 5. Head Bobbing Animation
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (this.isGrounded && horizontalSpeed > 0.5) {
      const bobFreq = this.isSprinting ? 14.0 : 9.0;
      this.bobTimer += delta * bobFreq;
      const bobMagnitude = this.isSprinting ? 0.045 : 0.025;
      this.bobOffset.y = Math.sin(this.bobTimer) * bobMagnitude;
      this.bobOffset.x = Math.cos(this.bobTimer * 0.5) * (bobMagnitude * 0.6);
    } else {
      this.bobOffset.lerp(new THREE.Vector3(0, 0, 0), delta * 10.0);
    }

    // 6. Recoil Recovery Spring
    this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0.0, delta * 16.0);
    this.recoilYaw = THREE.MathUtils.lerp(this.recoilYaw, 0.0, delta * 16.0);
    this.recoilRoll = THREE.MathUtils.lerp(this.recoilRoll, 0.0, delta * 16.0);

    // 7. Update Camera Transform
    this.camera.position.set(
      this.position.x + this.bobOffset.x,
      this.position.y + this.currentEyeHeight + this.bobOffset.y,
      this.position.z
    );

    // Apply Yaw, Pitch + Recoil
    const finalPitch = this.pitch + this.recoilPitch;
    const finalYaw = this.yaw + this.recoilYaw;

    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = finalPitch;
    euler.y = finalYaw;
    euler.z = this.recoilRoll;

    this.camera.quaternion.setFromEuler(euler);
  }

  getStance() {
    if (this.isSliding) return 'SLIDE';
    if (this.isCrouching) return 'CROUCH';
    return 'STAND';
  }

  getSpeedKmh() {
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    return (horizontalSpeed * 3.6).toFixed(1);
  }
}
