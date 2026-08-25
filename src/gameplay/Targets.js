import * as THREE from 'three';
import { sound } from '../engine/AudioEngine.js';

export class TargetManager {
  constructor(scene) {
    this.scene = scene;
    this.targets = [];
    this.targetMeshes = []; // List of interactive meshes for raycast

    // Shared Textures & High-Visibility Materials
    this.steelMat = new THREE.MeshStandardMaterial({
      color: 0x4d5b6e,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x111b29,
      emissiveIntensity: 0.2
    });

    this.postMat = new THREE.MeshStandardMaterial({
      color: 0x121620,
      metalness: 0.95,
      roughness: 0.25
    });

    this.bullseyeMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xffea00,
      emissiveIntensity: 0.9,
      metalness: 0.6,
      roughness: 0.15
    });

    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 0.45,
      metalness: 0.5,
      roughness: 0.2
    });

    this.penaltyMat = new THREE.MeshStandardMaterial({
      color: 0x282a33,
      metalness: 0.7,
      roughness: 0.35
    });

    this.penaltyCrossMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0033,
      emissiveIntensity: 1.5
    });

    this.droneMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.2,
      metalness: 0.8,
      roughness: 0.15
    });

    this.onTargetHit = null;
  }

  // 1. Steel Competition Popper Target
  createSteelPopper(position, rotationY = 0, isBullseyeOnly = false) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    // Steel Ground Stand / Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.4), this.postMat);
    base.position.set(0, 0.025, 0);
    group.add(base);

    // Support Post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 12), this.postMat);
    post.position.set(0, 0.55, 0);
    group.add(post);

    // Hinge Pivot for Target Plate
    const hingePivot = new THREE.Group();
    hingePivot.position.set(0, 1.1, 0);
    group.add(hingePivot);

    // Main Outer Plate (Circular Disc)
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 24), this.steelMat);
    plate.rotation.x = Math.PI / 2;
    plate.position.set(0, 0.32, 0);
    hingePivot.add(plate);

    // Outer Red Ring
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 24), this.ringMat);
    outerRing.position.set(0, 0.32, 0.016);
    hingePivot.add(outerRing);

    // Golden Bullseye Core
    const bullseye = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 20), this.bullseyeMat);
    bullseye.rotation.x = Math.PI / 2;
    bullseye.position.set(0, 0.32, 0.005);
    hingePivot.add(bullseye);

    this.scene.add(group);

    const targetObj = {
      type: 'popper',
      group: group,
      hinge: hingePivot,
      plateMesh: plate,
      bullseyeMesh: bullseye,
      isHit: false,
      hitAngle: 0.0,
      resetTimer: 0.0,
      autoReset: true,
      centerPos: new THREE.Vector3().setFromMatrixPosition(bullseye.matrixWorld)
    };

    plate.userData = { targetObj, isBullseye: false };
    outerRing.userData = { targetObj, isBullseye: false };
    bullseye.userData = { targetObj, isBullseye: true };

    this.targets.push(targetObj);
    this.targetMeshes.push(plate, outerRing, bullseye);
    return targetObj;
  }

  // 2. Moving Rail Track Target
  createMovingTarget(startPos, endPos, speed = 2.0) {
    const group = new THREE.Group();
    group.position.copy(startPos);

    // Track Rail
    const railLength = startPos.distanceTo(endPos);
    const railMat = this.postMat;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, railLength), railMat);
    rail.position.set(0, 0.1, railLength * 0.5);
    // Orient rail towards endPos
    const railGroup = new THREE.Group();
    railGroup.position.copy(startPos);
    railGroup.lookAt(endPos);
    railGroup.add(rail);
    this.scene.add(railGroup);

    // Target Trolley
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.2), this.steelMat);
    trolley.position.set(0, 0.15, 0);
    group.add(trolley);

    // Target Silhouette Plate
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 20), this.steelMat);
    plate.rotation.x = Math.PI / 2;
    plate.position.set(0, 1.2, 0);
    group.add(plate);

    const bullseye = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 16), this.bullseyeMat);
    bullseye.rotation.x = Math.PI / 2;
    bullseye.position.set(0, 1.2, 0.005);
    group.add(bullseye);

    this.scene.add(group);

    const targetObj = {
      type: 'moving',
      group: group,
      plateMesh: plate,
      bullseyeMesh: bullseye,
      startPos: startPos.clone(),
      endPos: endPos.clone(),
      speed: speed,
      progress: 0.0,
      direction: 1,
      isHit: false,
      hitCooldown: 0.0
    };

    plate.userData = { targetObj, isBullseye: false };
    bullseye.userData = { targetObj, isBullseye: true };

    this.targets.push(targetObj);
    this.targetMeshes.push(plate, bullseye);
    return targetObj;
  }

  // 3. Spinning Windmill / Pinwheel Target
  createWindmillTarget(position, rotationSpeed = 1.5) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Center Stand
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 12), this.postMat);
    stand.position.set(0, 1.1, 0);
    group.add(stand);

    // Spinning Hub
    const hub = new THREE.Group();
    hub.position.set(0, 2.0, 0);
    group.add(hub);

    const hubCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), this.postMat);
    hubCenter.rotation.x = Math.PI / 2;
    hub.add(hubCenter);

    // 4 Rotating Arms with Target Plates
    const blades = 4;
    for (let i = 0; i < blades; i++) {
      const armAngle = (i / blades) * Math.PI * 2;
      const armGroup = new THREE.Group();
      armGroup.rotation.z = armAngle;

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.02), this.postMat);
      arm.position.set(0, 0.45, 0);
      armGroup.add(arm);

      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.025, 16), this.steelMat);
      plate.rotation.x = Math.PI / 2;
      plate.position.set(0, 0.9, 0.015);
      armGroup.add(plate);

      const bullseye = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), this.bullseyeMat);
      bullseye.rotation.x = Math.PI / 2;
      bullseye.position.set(0, 0.9, 0.02);
      armGroup.add(bullseye);

      hub.add(armGroup);

      const targetObj = {
        type: 'windmill_blade',
        plateMesh: plate,
        bullseyeMesh: bullseye,
        isHit: false
      };
      plate.userData = { targetObj, isBullseye: false };
      bullseye.userData = { targetObj, isBullseye: true };
      this.targetMeshes.push(plate, bullseye);
    }

    this.scene.add(group);

    const windmillObj = {
      type: 'windmill',
      group: group,
      hub: hub,
      rotSpeed: rotationSpeed
    };

    this.targets.push(windmillObj);
    return windmillObj;
  }

  // 4. Hostage / Civilian "NO-SHOOT" Penalty Target
  createCivilianPenaltyTarget(position, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    // Stand
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 12), this.postMat);
    post.position.set(0, 0.6, 0);
    group.add(post);

    // Silhouette
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.03), this.penaltyMat);
    body.position.set(0, 1.4, 0);
    group.add(body);

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), this.penaltyMat);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 1.8, 0);
    group.add(head);

    // Big Glowing Red "X" Marker
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.04), this.penaltyCrossMat);
    cross1.position.set(0, 1.4, 0.01);
    cross1.rotation.z = 0.785;
    group.add(cross1);

    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.04), this.penaltyCrossMat);
    cross2.position.set(0, 1.4, 0.01);
    cross2.rotation.z = -0.785;
    group.add(cross2);

    this.scene.add(group);

    const targetObj = {
      type: 'civilian',
      group: group,
      bodyMesh: body,
      isHit: false,
      penaltyCooldown: 0.0
    };

    body.userData = { targetObj, isCivilian: true };
    head.userData = { targetObj, isCivilian: true };

    this.targets.push(targetObj);
    this.targetMeshes.push(body, head);
    return targetObj;
  }

  // 5. Flying Robotic Target Drone
  createDroneTarget(position) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Sphere Body
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), this.droneMat);
    group.add(core);

    // Outer Rotating Rings
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 8, 24), this.postMat);
    group.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.02, 8, 24), this.postMat);
    ring2.rotation.x = Math.PI / 2;
    group.add(ring2);

    // Center Bullseye Core
    const bullseye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), this.bullseyeMat);
    group.add(bullseye);

    this.scene.add(group);

    const targetObj = {
      type: 'drone',
      group: group,
      coreMesh: core,
      bullseyeMesh: bullseye,
      ring1: ring1,
      ring2: ring2,
      basePos: position.clone(),
      hoverTimer: Math.random() * 10.0,
      isHit: false
    };

    core.userData = { targetObj, isBullseye: false };
    bullseye.userData = { targetObj, isBullseye: true };

    this.targets.push(targetObj);
    this.targetMeshes.push(core, bullseye);
    return targetObj;
  }

  // 6. Explosive Paintball Balloon / Bonus Can
  createExplosiveCan(position, colorHex = 0xffe600) {
    const group = new THREE.Group();
    group.position.copy(position);

    const canMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1
    });

    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16), canMat);
    can.position.set(0, 0.25, 0);
    group.add(can);

    this.scene.add(group);

    const targetObj = {
      type: 'explosive_can',
      group: group,
      canMesh: can,
      colorHex: colorHex,
      isHit: false
    };

    can.userData = { targetObj, isExplosive: true };
    this.targets.push(targetObj);
    this.targetMeshes.push(can);
    return targetObj;
  }

  handleHit(hitData) {
    let mesh = hitData.object;
    while (mesh && (!mesh.userData || !mesh.userData.targetObj) && mesh.parent) {
      mesh = mesh.parent;
    }
    if (!mesh || !mesh.userData || !mesh.userData.targetObj) return null;

    const targetObj = mesh.userData.targetObj;
    const isBullseye = !!mesh.userData.isBullseye;
    const isCivilian = !!mesh.userData.isCivilian;
    const isExplosive = !!mesh.userData.isExplosive;

    if (isCivilian) {
      // Civilian Penalty Hit
      sound.playPenaltyBuzzer();
      this.onTargetHit?.({
        type: 'civilian',
        points: -200,
        isBullseye: false,
        isPenalty: true,
        point: hitData.point
      });
      return { penalty: true };
    }

    if (isExplosive) {
      // Trigger Big Area Splat
      this.scene.remove(targetObj.group);
      const idx = this.targets.indexOf(targetObj);
      if (idx > -1) this.targets.splice(idx, 1);

      this.onTargetHit?.({
        type: 'explosive',
        points: 500,
        isBullseye: true,
        point: hitData.point,
        colorHex: targetObj.colorHex
      });
      return { explosive: true };
    }

    // Steel Target Hit
    if (targetObj.type === 'popper') {
      if (!targetObj.isHit) {
        targetObj.isHit = true;
        targetObj.hitAngle = Math.PI / 2.2; // Flip backward
        targetObj.resetTimer = targetObj.autoReset ? 2.5 : 999;

        const points = isBullseye ? 250 : 100;
        this.onTargetHit?.({
          type: 'popper',
          points: points,
          isBullseye: isBullseye,
          point: hitData.point
        });
      }
    } else if (targetObj.type === 'moving' || targetObj.type === 'windmill_blade' || targetObj.type === 'drone') {
      const points = isBullseye ? 250 : 100;
      this.onTargetHit?.({
        type: targetObj.type,
        points: points,
        isBullseye: isBullseye,
        point: hitData.point
      });

      if (targetObj.type === 'drone') {
        this.scene.remove(targetObj.group);
        const idx = this.targets.indexOf(targetObj);
        if (idx > -1) this.targets.splice(idx, 1);
      }
    }

    return { hit: true, isBullseye };
  }

  update(delta, time) {
    for (let i = 0; i < this.targets.length; i++) {
      const t = this.targets[i];

      // 1. Popper Fall & Reset
      if (t.type === 'popper') {
        if (t.isHit) {
          t.hinge.rotation.x = THREE.MathUtils.lerp(t.hinge.rotation.x, t.hitAngle, delta * 15.0);
          if (t.autoReset) {
            t.resetTimer -= delta;
            if (t.resetTimer <= 0) {
              t.isHit = false;
            }
          }
        } else {
          t.hinge.rotation.x = THREE.MathUtils.lerp(t.hinge.rotation.x, 0.0, delta * 8.0);
        }
      }

      // 2. Moving Target Path
      else if (t.type === 'moving') {
        t.progress += (t.speed * delta * t.direction) / t.startPos.distanceTo(t.endPos);
        if (t.progress >= 1.0) {
          t.progress = 1.0;
          t.direction = -1;
        } else if (t.progress <= 0.0) {
          t.progress = 0.0;
          t.direction = 1;
        }
        t.group.position.lerpVectors(t.startPos, t.endPos, t.progress);
      }

      // 3. Windmill Rotation
      else if (t.type === 'windmill') {
        t.hub.rotation.z += t.rotSpeed * delta;
      }

      // 4. Drone Hovering & Ring Spin
      else if (t.type === 'drone') {
        t.hoverTimer += delta * 2.0;
        t.group.position.y = t.basePos.y + Math.sin(t.hoverTimer) * 0.35;
        t.group.position.x = t.basePos.x + Math.cos(t.hoverTimer * 0.7) * 0.4;
        t.ring1.rotation.y += delta * 3.0;
        t.ring2.rotation.z += delta * 2.5;
      }
    }
  }

  clear() {
    for (const t of this.targets) {
      if (t.group) this.scene.remove(t.group);
    }
    this.targets = [];
    this.targetMeshes = [];
  }
}
