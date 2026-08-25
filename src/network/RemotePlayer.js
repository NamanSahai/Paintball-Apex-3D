import * as THREE from 'three';

export class RemotePlayer {
  constructor(scene, id, name, team = 'blue', colorHex = '#0284c7') {
    this.scene = scene;
    this.id = id;
    this.name = name || `Player_${id.substring(0, 4)}`;
    this.team = team;
    this.colorHex = colorHex;

    this.group = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, 0);
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.yaw = 0.0;
    this.targetYaw = 0.0;
    this.pitch = 0.0;
    this.targetPitch = 0.0;

    this.health = 100;
    this.maxHealth = 100;
    this.isEliminated = false;
    this.stance = 'STAND';
    this.hitFlashTimer = 0.0;

    this.hitboxes = []; // Meshes for bullet raycasting

    this.buildCharacterModel();
    this.buildNameTag();

    this.scene.add(this.group);
  }

  buildCharacterModel() {
    const jerseyMat = new THREE.MeshStandardMaterial({
      color: this.colorHex,
      roughness: 0.7,
      metalness: 0.1
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.1
    });

    const maskMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8
    });

    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff8800,
      emissiveIntensity: 0.35,
      metalness: 0.95,
      roughness: 0.05,
      clearcoat: 1.0
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.6
    });

    // 1. Lower Body (Legs & Boots)
    this.legsGroup = new THREE.Group();

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.24), pantsMat);
    legL.position.set(-0.16, 0.375, 0);
    legL.castShadow = true;
    this.legsGroup.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.24), pantsMat);
    legR.position.set(0.16, 0.375, 0);
    legR.castShadow = true;
    this.legsGroup.add(legR);

    // Boots
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.34), maskMat);
    bootL.position.set(-0.16, 0.075, 0.04);
    bootL.castShadow = true;
    this.legsGroup.add(bootL);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.34), maskMat);
    bootR.position.set(0.16, 0.075, 0.04);
    bootR.castShadow = true;
    this.legsGroup.add(bootR);

    this.group.add(this.legsGroup);

    // 2. Upper Body (Torso, Pod Harness & Arms)
    this.upperBody = new THREE.Group();
    this.upperBody.position.set(0, 0.75, 0);

    // Torso Jersey
    this.torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.32), jerseyMat);
    this.torsoMesh.position.set(0, 0.325, 0);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.upperBody.add(this.torsoMesh);

    // Waist Paintball Pod Pack (4 pods on back)
    const podMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 });
    for (let p = 0; p < 4; p++) {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 12), podMat);
      pod.position.set(-0.15 + p * 0.1, 0.1, -0.19);
      this.upperBody.add(pod);
    }

    // 3. Head & Full Paintball Mask
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.72, 0);

    const headBase = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), maskMat);
    headBase.position.set(0, 0.12, 0);
    headBase.castShadow = true;
    this.headGroup.add(headBase);

    // Mask Chin Guard & Visor Peak
    const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.22), maskMat);
    chinGuard.position.set(0, 0.06, 0.06);
    this.headGroup.add(chinGuard);

    const visorPeak = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.14), maskMat);
    visorPeak.position.set(0, 0.24, 0.12);
    this.headGroup.add(visorPeak);

    // Thermal Goggle Lens
    const goggleLens = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.08), lensMat);
    goggleLens.position.set(0, 0.14, 0.14);
    this.headGroup.add(goggleLens);

    this.upperBody.add(this.headGroup);

    // 4. Arms & Paintball Marker Gun
    this.armsGroup = new THREE.Group();
    this.armsGroup.position.set(0, 0.55, 0);

    // Right Arm
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), jerseyMat);
    armR.position.set(0.32, -0.15, 0.15);
    armR.rotation.x = -Math.PI / 4;
    this.armsGroup.add(armR);

    // Left Arm
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), jerseyMat);
    armL.position.set(-0.25, -0.12, 0.25);
    armL.rotation.x = -Math.PI / 3;
    armL.rotation.y = Math.PI / 6;
    this.armsGroup.add(armL);

    // Paintball Marker
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.55), maskMat);
    gunBody.position.set(0.12, -0.05, 0.35);

    // Hopper Loader
    const hopper = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), jerseyMat);
    hopper.scale.set(1.0, 0.8, 1.4);
    hopper.position.set(0.12, 0.12, 0.28);

    // Air Tank
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.28, 12), maskMat);
    tank.rotation.x = Math.PI / 2;
    tank.position.set(0.12, -0.18, 0.15);

    this.armsGroup.add(gunBody, hopper, tank);
    this.upperBody.add(this.armsGroup);

    this.group.add(this.upperBody);

    // Register Raycast Hitboxes
    this.torsoMesh.userData = { remotePlayer: this, isHeadshot: false };
    headBase.userData = { remotePlayer: this, isHeadshot: true };
    chinGuard.userData = { remotePlayer: this, isHeadshot: true };
    goggleLens.userData = { remotePlayer: this, isHeadshot: true };

    this.hitboxes = [this.torsoMesh, headBase, chinGuard, goggleLens];
  }

  buildNameTag() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    this.nameCtx = canvas.getContext('2d');
    this.nameTexture = new THREE.CanvasTexture(canvas);

    const spriteMat = new THREE.SpriteMaterial({ map: this.nameTexture, transparent: true });
    this.nameSprite = new THREE.Sprite(spriteMat);
    this.nameSprite.position.set(0, 2.1, 0);
    this.nameSprite.scale.set(1.5, 0.38, 1.0);
    this.group.add(this.nameSprite);

    this.updateNameTag();
  }

  updateNameTag() {
    if (!this.nameCtx) return;
    const ctx = this.nameCtx;
    ctx.clearRect(0, 0, 256, 64);

    // Background Pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(10, 8, 236, 48, 12);
    ctx.fill();

    // Border
    ctx.strokeStyle = this.colorHex;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Name Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 128, 30);

    // Health Bar
    const hpWidth = Math.max(0, (this.health / this.maxHealth) * 190);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(33, 38, 190, 8);

    ctx.fillStyle = this.health > 40 ? '#39ff14' : (this.health > 20 ? '#ffe600' : '#ff0055');
    ctx.fillRect(33, 38, hpWidth, 8);

    this.nameTexture.needsUpdate = true;
  }

  setTransform(pos, yaw, pitch, stance = 'STAND') {
    this.targetPosition.set(pos.x, pos.y, pos.z);
    this.targetYaw = yaw;
    this.targetPitch = pitch;
    this.stance = stance;
  }

  applyDamage(amount, isHeadshot = false) {
    if (this.isEliminated) return false;

    this.health = Math.max(0, this.health - amount);
    this.hitFlashTimer = 0.25;
    this.updateNameTag();

    if (this.health <= 0) {
      this.isEliminated = true;
      this.group.visible = false;
      return true; // Was eliminated!
    }
    return false;
  }

  respawn(position) {
    this.health = this.maxHealth;
    this.isEliminated = false;
    this.group.visible = true;
    this.position.copy(position);
    this.targetPosition.copy(position);
    this.updateNameTag();
  }

  update(delta) {
    if (this.isEliminated) return;

    // Smooth position & rotation interpolation
    this.position.lerp(this.targetPosition, delta * 18.0);
    this.group.position.copy(this.position);

    // Smooth Yaw
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, delta * 18.0);
    this.group.rotation.y = this.yaw;

    // Smooth Pitch on Head & Arms
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, delta * 18.0);
    this.headGroup.rotation.x = this.pitch;
    this.armsGroup.rotation.x = this.pitch;

    // Stance Height Transition
    const targetY = this.stance === 'CROUCH' ? -0.4 : (this.stance === 'SLIDE' ? -0.55 : 0.0);
    this.upperBody.position.y = THREE.MathUtils.lerp(this.upperBody.position.y, 0.75 + targetY, delta * 12.0);

    // Hit Flash Decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      this.torsoMesh.material.emissive.setHex(0xff0055);
      this.torsoMesh.material.emissiveIntensity = 1.0;
    } else {
      this.torsoMesh.material.emissive.setHex(0x000000);
      this.torsoMesh.material.emissiveIntensity = 0.0;
    }
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
