import * as THREE from 'three';

export class GunModels {
  // Create OLED Display Canvas Texture with High Contrast Neon Graphics
  static createOledTexture(ammo = 160, maxAmmo = 160, bps = 0.0, weaponName = 'APEX PRO') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Dark cyber screen with gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#040914');
    grad.addColorStop(1, '#081426');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing Neon Border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

    // Header
    ctx.font = 'bold 16px "Orbitron", monospace';
    ctx.fillStyle = '#39ff14';
    ctx.fillText(weaponName, 16, 26);

    // Battery Bar
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(190, 12, 45, 14);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(188, 10, 49, 18);

    // Big Glowing Ammo Readout
    ctx.font = 'bold 44px "Orbitron", monospace';
    ctx.fillStyle = ammo < 30 ? '#ff0055' : '#00f0ff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillText(`${ammo}`, 16, 74);

    ctx.shadowBlur = 0;
    ctx.font = 'bold 22px "Orbitron", monospace';
    ctx.fillStyle = '#7f8fa4';
    ctx.fillText(`/${maxAmmo}`, 110, 74);

    // Live BPS Rate Meter
    ctx.font = 'bold 18px "Rajdhani", monospace';
    ctx.fillStyle = '#ffe600';
    ctx.fillText(`RATE: ${bps.toFixed(1)} BPS`, 16, 110);

    // Fire Mode Tag
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`• RAMP READY`, 140, 110);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return { texture, canvas, ctx };
  }

  // Tactical Hands & High-Detail Tournament Gloves
  static createHands(accentHex = 0x00f0ff) {
    const handsGroup = new THREE.Group();

    // High Quality Glove & Armor Materials
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x151b26,
      roughness: 0.65,
      metalness: 0.25
    });

    const knuckleArmorMat = new THREE.MeshStandardMaterial({
      color: 0x222a38,
      roughness: 0.3,
      metalness: 0.8
    });

    const neonStripeMat = new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5
    });

    // 1. Right Arm & Hand (Firing Trigger Grip)
    const rightArmGroup = new THREE.Group();
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.45, 16), gloveMat);
    rightArm.position.set(0.24, -0.28, 0.25);
    rightArm.rotation.set(-0.7, 0.2, -0.35);
    rightArmGroup.add(rightArm);

    // Right Arm Sleeve Stripe
    const rightSleeveRing = new THREE.Mesh(new THREE.CylinderGeometry(0.063, 0.065, 0.04, 16), neonStripeMat);
    rightSleeveRing.position.set(0.24, -0.25, 0.25);
    rightSleeveRing.rotation.set(-0.7, 0.2, -0.35);
    rightArmGroup.add(rightSleeveRing);

    // Right Palm & Knuckles
    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.1, 0.09), gloveMat);
    rightHand.position.set(0.12, -0.12, 0.08);
    rightHand.rotation.set(0.25, -0.35, 0.15);
    rightArmGroup.add(rightHand);

    // Knuckle Armor Plate
    const rightKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.045, 0.094), knuckleArmorMat);
    rightKnuckle.position.set(0.12, -0.11, 0.08);
    rightKnuckle.rotation.set(0.25, -0.35, 0.15);
    rightArmGroup.add(rightKnuckle);

    // Neon Accent on Knuckles
    const rightKnuckleGlow = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.096), neonStripeMat);
    rightKnuckleGlow.position.set(0.12, -0.10, 0.08);
    rightKnuckleGlow.rotation.set(0.25, -0.35, 0.15);
    rightArmGroup.add(rightKnuckleGlow);

    // Animated Walking Trigger Fingers (Double Trigger)
    const triggerFinger1 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.07, 10), gloveMat);
    triggerFinger1.position.set(0.04, -0.06, 0.02);
    triggerFinger1.rotation.set(0.4, 0.1, 0.8);
    rightArmGroup.add(triggerFinger1);

    const triggerFinger2 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.07, 10), gloveMat);
    triggerFinger2.position.set(0.04, -0.08, 0.015);
    triggerFinger2.rotation.set(0.4, 0.1, 0.8);
    rightArmGroup.add(triggerFinger2);

    handsGroup.add(rightArmGroup);

    // 2. Left Arm & Hand (Forward Grip Support / Pod Reloader)
    const leftArmGroup = new THREE.Group();
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.45, 16), gloveMat);
    leftArm.position.set(-0.16, -0.22, 0.1);
    leftArm.rotation.set(0.65, 0.35, 0.55);
    leftArmGroup.add(leftArm);

    const leftSleeveRing = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.062, 0.04, 16), neonStripeMat);
    leftSleeveRing.position.set(-0.16, -0.19, 0.1);
    leftSleeveRing.rotation.set(0.65, 0.35, 0.55);
    leftArmGroup.add(leftSleeveRing);

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.085, 0.085), gloveMat);
    leftHand.position.set(0, 0, 0);
    leftArmGroup.add(leftHand);

    const leftKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.04, 0.09), knuckleArmorMat);
    leftKnuckle.position.set(0, 0.01, 0);
    leftArmGroup.add(leftKnuckle);

    const leftKnuckleGlow = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.01, 0.092), neonStripeMat);
    leftKnuckleGlow.position.set(0, 0.02, 0);
    leftArmGroup.add(leftKnuckleGlow);

    // 4 Articulated Gloved Fingers wrapped around pod/grip
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.065, 8), gloveMat);
      finger.position.set(-0.03 + f * 0.02, 0.02, 0.045);
      finger.rotation.set(1.4, 0.1, -0.2);
      leftArmGroup.add(finger);
    }

    // 3D Paintball Reload Pod held firmly in the left hand!
    const reloadPod = GunModels.createReloadPod(accentHex);
    reloadPod.group.position.set(0.01, 0.05, 0.02);
    reloadPod.group.rotation.set(1.57, 0, 0);
    reloadPod.group.visible = false;
    leftArmGroup.add(reloadPod.group);

    handsGroup.add(leftArmGroup);

    return {
      group: handsGroup,
      leftArmGroup: leftArmGroup,
      rightArmGroup: rightArmGroup,
      triggerFinger1: triggerFinger1,
      triggerFinger2: triggerFinger2,
      reloadPod: reloadPod
    };
  }

  // 3D Paintball Pod with Opening Spring Lid & Dynamic Pouring Balls
  static createReloadPod(paintColorHex = 0x00f0ff) {
    const podGroup = new THREE.Group();

    const podSmokeMat = new THREE.MeshPhysicalMaterial({
      color: 0x18202c,
      transmission: 0.88,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      metalness: 0.15
    });

    const podCapMat = new THREE.MeshStandardMaterial({
      color: paintColorHex,
      emissive: paintColorHex,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });

    const ballMat = new THREE.MeshStandardMaterial({
      color: paintColorHex,
      roughness: 0.12,
      metalness: 0.45,
      emissive: paintColorHex,
      emissiveIntensity: 0.35
    });

    // 140-Round Smoke Pod Tube Body
    const podTube = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.22, 16), podSmokeMat);
    podGroup.add(podTube);

    // Locking Collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 16), podCapMat);
    collar.position.set(0, 0.10, 0);
    podGroup.add(collar);

    // Spring Lid on Hinge Pivot
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.11, 0.032);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.015, 16), podCapMat);
    lid.position.set(0, 0.008, -0.032);
    lidPivot.add(lid);
    podGroup.add(lidPivot);

    // Dynamic Paintballs inside Pod (Stacking from bottom to top)
    const podBalls = [];
    for (let i = 0; i < 10; i++) {
      const pBall = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), ballMat);
      pBall.position.set((Math.random() - 0.5) * 0.022, -0.08 + i * 0.018, (Math.random() - 0.5) * 0.022);
      podGroup.add(pBall);
      podBalls.push(pBall);
    }

    // Animated Pouring Stream Balls (Falling into hopper during pour)
    const pourBalls = [];
    for (let j = 0; j < 8; j++) {
      const dropBall = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), ballMat);
      dropBall.visible = false;
      podGroup.add(dropBall);
      pourBalls.push(dropBall);
    }

    return {
      group: podGroup,
      lidPivot: lidPivot,
      pourBalls: pourBalls,
      podBalls: podBalls
    };
  }

  // 1. Electronic Speedball Marker (Apex Eclipse Pro)
  static createElectroMarker(paintColorHex = 0x00f0ff) {
    const gunGroup = new THREE.Group();
    gunGroup.scale.set(1.0, 1.0, 1.0);

    // Premium Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1c2433,
      metalness: 0.92,
      roughness: 0.15,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: paintColorHex,
      metalness: 0.85,
      roughness: 0.18,
      emissive: paintColorHex,
      emissiveIntensity: 0.45,
      clearcoat: 1.0
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d12,
      metalness: 0.95,
      roughness: 0.25
    });

    const hopperSmokeMat = new THREE.MeshPhysicalMaterial({
      color: 0x151b24,
      transmission: 0.88,
      opacity: 0.85,
      transparent: true,
      roughness: 0.12,
      metalness: 0.2
    });

    const carbonTankMat = new THREE.MeshStandardMaterial({
      color: 0x161a22,
      metalness: 0.75,
      roughness: 0.35
    });

    // Receiver Body
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.32), bodyMat);
    receiver.position.set(0, 0, 0);
    gunGroup.add(receiver);

    // Vibrant Top Milling Stripe
    const topStripe = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.02, 0.3), accentMat);
    topStripe.position.set(0, 0.045, 0);
    gunGroup.add(topStripe);

    // Side Anodized Accent Inlays
    const leftInlay = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.035, 0.22), accentMat);
    leftInlay.position.set(-0.029, 0.01, 0);
    gunGroup.add(leftInlay);

    const rightInlay = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.035, 0.22), accentMat);
    rightInlay.position.set(0.029, 0.01, 0);
    gunGroup.add(rightInlay);

    // Top Picatinny Rail & Front Sight Post (as seen in authentic paintball markers)
    const picatinnyRail = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.012, 0.32), darkMetalMat);
    picatinnyRail.position.set(0, 0.045, -0.02);
    gunGroup.add(picatinnyRail);

    // Front Iron Sight Post & Rear Peep
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.015), darkMetalMat);
    frontSight.position.set(0, 0.055, -0.16);
    gunGroup.add(frontSight);

    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.018, 0.012), darkMetalMat);
    rearSight.position.set(0, 0.054, 0.12);
    gunGroup.add(rearSight);

    // 14" Tournament Two-Piece Barrel with Porting
    const barrelBack = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.18, 16), darkMetalMat);
    barrelBack.rotation.x = Math.PI / 2;
    barrelBack.position.set(0, 0.02, -0.22);
    gunGroup.add(barrelBack);

    const barrelFront = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.26, 16), accentMat);
    barrelFront.rotation.x = Math.PI / 2;
    barrelFront.position.set(0, 0.02, -0.42);
    gunGroup.add(barrelFront);

    // Barrel Tip with Spiral Porting Ring
    const barrelTip = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.05, 16), darkMetalMat);
    barrelTip.rotation.x = Math.PI / 2;
    barrelTip.position.set(0, 0.02, -0.57);
    gunGroup.add(barrelTip);

    // Vertical Ribbed Foregrip / Inline High-Pressure Regulator
    const foregrip = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.021, 0.13, 16), darkMetalMat);
    foregrip.position.set(0, -0.09, -0.16);
    gunGroup.add(foregrip);

    for (let r = 0; r < 4; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.003, 6, 16), darkMetalMat);
      ring.position.set(0, -0.05 - r * 0.022, -0.16);
      ring.rotation.x = Math.PI / 2;
      gunGroup.add(ring);
    }

    // Grip Frame
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.16, 0.07), darkMetalMat);
    grip.position.set(0, -0.1, 0.07);
    grip.rotation.x = 0.24;
    gunGroup.add(grip);

    // Rubberized Ergonomic Grip Wraps with Accent Trim
    const gripPanel = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.13, 0.065), accentMat);
    gripPanel.position.set(0, -0.1, 0.07);
    gripPanel.rotation.x = 0.24;
    gunGroup.add(gripPanel);

    // Double Trigger Guard & Blade
    const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.005, 8, 16, Math.PI), darkMetalMat);
    triggerGuard.rotation.y = Math.PI / 2;
    triggerGuard.position.set(0, -0.07, 0.01);
    gunGroup.add(triggerGuard);

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.05, 0.01), accentMat);
    trigger.position.set(0, -0.07, 0.02);
    trigger.rotation.x = 0.2;
    gunGroup.add(trigger);

    // Low-Profile Angled Feedneck with Heavy-Duty Clamping Collar
    const feedneck = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.045, 12), darkMetalMat);
    feedneck.position.set(0.022, 0.05, -0.06);
    feedneck.rotation.z = -0.18;
    gunGroup.add(feedneck);

    const feedClamp = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.014, 0.02), accentMat);
    feedClamp.position.set(0.032, 0.055, -0.06);
    gunGroup.add(feedClamp);

    // Sleek Ergonomic Tournament Hopper (Virtue Spire Style - Fully encasing paintballs!)
    const hopperShell = new THREE.Mesh(new THREE.SphereGeometry(0.052, 18, 14), hopperSmokeMat);
    hopperShell.scale.set(0.85, 0.78, 1.25);
    hopperShell.position.set(0.038, 0.078, -0.06);
    gunGroup.add(hopperShell);

    // Dynamic Stacked Paintballs comfortably encased inside the Hopper
    const ballMat = new THREE.MeshStandardMaterial({
      color: paintColorHex,
      roughness: 0.12,
      metalness: 0.45,
      emissive: paintColorHex,
      emissiveIntensity: 0.35
    });

    const hopperBalls = [];
    const ballOffsets = [
      // Bottom layer (feedneck & base)
      { x: 0.032, y: 0.048, z: -0.06 },
      { x: 0.044, y: 0.050, z: -0.05 },
      { x: 0.038, y: 0.054, z: -0.07 },
      // Mid layer
      { x: 0.028, y: 0.065, z: -0.07 },
      { x: 0.048, y: 0.066, z: -0.06 },
      { x: 0.036, y: 0.068, z: -0.04 },
      { x: 0.042, y: 0.070, z: -0.08 },
      // Upper mid layer
      { x: 0.032, y: 0.080, z: -0.06 },
      { x: 0.044, y: 0.082, z: -0.05 },
      { x: 0.038, y: 0.084, z: -0.07 },
      // Top dome layer
      { x: 0.032, y: 0.094, z: -0.06 },
      { x: 0.044, y: 0.095, z: -0.05 },
      { x: 0.038, y: 0.098, z: -0.04 },
      { x: 0.039, y: 0.102, z: -0.06 }
    ];

    ballOffsets.forEach(pos => {
      const pBall = new THREE.Mesh(new THREE.SphereGeometry(0.0082, 8, 8), ballMat);
      pBall.position.set(pos.x, pos.y, pos.z);
      pBall.userData = { baseY: pos.y, baseX: pos.x, baseZ: pos.z };
      gunGroup.add(pBall);
      hopperBalls.push(pBall);
    });

    // High-Vis Speed Feed Lid resting flush on top
    const speedFeed = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.010, 16), accentMat);
    speedFeed.position.set(0.038, 0.118, -0.02);
    speedFeed.rotation.x = 0.25;
    gunGroup.add(speedFeed);

    // 68ci/4500psi Carbon Fiber HPA Air Tank
    const asaMount = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.07), darkMetalMat);
    asaMount.position.set(0, -0.18, 0.09);
    gunGroup.add(asaMount);

    const airReg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 12), darkMetalMat);
    airReg.rotation.x = Math.PI / 2;
    airReg.position.set(0, -0.18, 0.15);
    gunGroup.add(airReg);

    // Mini Brass Pressure Gauge with White Dial Face (Reference Photo Feature)
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12), new THREE.MeshStandardMaterial({ color: 0xc89632, metalness: 0.9, roughness: 0.2 }));
    gauge.position.set(0.032, -0.18, 0.15);
    gauge.rotation.z = Math.PI / 2;
    gunGroup.add(gauge);

    const gaugeFace = new THREE.Mesh(new THREE.CircleGeometry(0.011, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    gaugeFace.position.set(0.039, -0.18, 0.15);
    gaugeFace.rotation.y = Math.PI / 2;
    gunGroup.add(gaugeFace);

    const airTank = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.24, 16), carbonTankMat);
    airTank.rotation.x = Math.PI / 2;
    airTank.position.set(0, -0.18, 0.28);
    gunGroup.add(airTank);

    // Stainless Steel Braided Macroline Gas Hose (Authentic Photo Feature)
    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.14, -0.16),
      new THREE.Vector3(-0.032, -0.22, -0.06),
      new THREE.Vector3(-0.032, -0.24, 0.04),
      new THREE.Vector3(0, -0.19, 0.10)
    ]);
    const hoseGeo = new THREE.TubeGeometry(hoseCurve, 16, 0.005, 8, false);
    const hoseMat = new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.95, roughness: 0.15 });
    const macroline = new THREE.Mesh(hoseGeo, hoseMat);
    gunGroup.add(macroline);

    // Carbon Fiber Tank Cover with Neon Accent Band
    const tankBand = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.057, 0.05, 16), accentMat);
    tankBand.rotation.x = Math.PI / 2;
    tankBand.position.set(0, -0.18, 0.28);
    gunGroup.add(tankBand);

    // OLED Telemetry Screen on Back of Grip
    const oledData = GunModels.createOledTexture(160, 160, 0.0, 'ECLIPSE PRO');
    const oledMat = new THREE.MeshBasicMaterial({ map: oledData.texture });
    const oledMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.042, 0.025), oledMat);
    oledMesh.position.set(0, -0.05, 0.11);
    oledMesh.rotation.x = 0.24;
    gunGroup.add(oledMesh);

    // High Speed Internal Bolt
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.09, 12), accentMat);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(0, 0.02, 0.09);
    gunGroup.add(bolt);

    // Glowing Laser Sight Emitter
    const laserBox = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.05), darkMetalMat);
    laserBox.position.set(0.04, 0.015, -0.18);
    gunGroup.add(laserBox);

    const laserDot = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
    laserDot.position.set(0.04, 0.015, -0.21);
    gunGroup.add(laserDot);

    // Tactical Hands & Gloves
    const hands = GunModels.createHands(paintColorHex);
    gunGroup.add(hands.group);

    return {
      mesh: gunGroup,
      bolt: bolt,
      trigger: trigger,
      oled: oledData,
      hands: hands,
      hopperBalls: hopperBalls,
      muzzleOffset: new THREE.Vector3(0, 0.02, -0.65),
      adsOffset: new THREE.Vector3(0.0, -0.09, -0.28), // 100% Unobstructed sightline straight down barrel
      adsRotation: new THREE.Euler(0.0, 0.0, 0.0),
      normalOffset: new THREE.Vector3(0.20, -0.16, -0.38)
    };
  }

  // 2. Tactical MilSim Sniper Marker (Viper Tactical DMR)
  static createTacticalMarker(paintColorHex = 0x39ff14) {
    const gunGroup = new THREE.Group();
    gunGroup.scale.set(1.0, 1.0, 1.0);

    const tacticalMat = new THREE.MeshStandardMaterial({
      color: 0x1f2723,
      metalness: 0.85,
      roughness: 0.35
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f0d,
      metalness: 0.95,
      roughness: 0.2
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: paintColorHex,
      metalness: 0.7,
      roughness: 0.2,
      emissive: paintColorHex,
      emissiveIntensity: 0.5
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x66ddff,
      transmission: 0.95,
      opacity: 0.85,
      transparent: true,
      roughness: 0.05
    });

    // MilSim Heavy Receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.42), tacticalMat);
    gunGroup.add(receiver);

    // Full Length Top Picatinny Rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.015, 0.45), darkMetalMat);
    rail.position.set(0, 0.055, 0);
    gunGroup.add(rail);

    // 18" Long Rifled Barrel with Carbon Shroud
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.52, 16), darkMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.45);
    gunGroup.add(barrel);

    // Fluted Muzzle Brake
    const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.18, 16), accentMat);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.set(0, 0.02, -0.76);
    gunGroup.add(muzzleBrake);

    // Holographic Reflex Optic Sight
    const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.1), darkMetalMat);
    opticBase.position.set(0, 0.08, -0.06);
    gunGroup.add(opticBase);

    const opticHood = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.055, 0.08), tacticalMat);
    opticHood.position.set(0, 0.11, -0.06);
    gunGroup.add(opticHood);

    const opticLens = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), glassMat);
    opticLens.position.set(0, 0.11, -0.09);
    gunGroup.add(opticLens);

    // Glowing Holographic Green Reticle Ring & Dot
    const reticleDot = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), new THREE.MeshBasicMaterial({ color: 0x39ff14 }));
    reticleDot.position.set(0, 0.11, -0.088);
    gunGroup.add(reticleDot);

    const reticleRing = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.002, 6, 16), new THREE.MeshBasicMaterial({ color: 0x39ff14 }));
    reticleRing.position.set(0, 0.11, -0.088);
    gunGroup.add(reticleRing);

    // Vertical Tactical Foregrip with Accent Ring
    const foregrip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.13, 12), darkMetalMat);
    foregrip.position.set(0, -0.09, -0.25);
    gunGroup.add(foregrip);

    const foregripRing = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12), accentMat);
    foregripRing.position.set(0, -0.06, -0.25);
    gunGroup.add(foregripRing);

    // Main Pistol Grip & Trigger
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.15, 0.07), tacticalMat);
    grip.position.set(0, -0.1, 0.09);
    grip.rotation.x = 0.22;
    gunGroup.add(grip);

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.04, 0.01), accentMat);
    trigger.position.set(0, -0.07, 0.035);
    gunGroup.add(trigger);

    // Tactical Offset Feed Hopper (Compact Right Offset with Sight Glass)
    const magLoader = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.11), tacticalMat);
    magLoader.position.set(0.055, 0.07, -0.03);
    magLoader.rotation.z = -0.2;
    gunGroup.add(magLoader);

    // Dynamic Paintballs inside Tactical Hopper
    const tacBallMat = new THREE.MeshStandardMaterial({ color: paintColorHex, roughness: 0.15, metalness: 0.5, emissive: paintColorHex, emissiveIntensity: 0.35 });
    const hopperBalls = [];
    for (let b = 0; b < 12; b++) {
      const pBall = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), tacBallMat);
      const by = 0.055 + (b % 4) * 0.012;
      pBall.position.set(0.05 + ((b % 3) - 1) * 0.01, by, -0.06 + Math.floor(b / 4) * 0.02);
      pBall.userData = { baseY: by };
      gunGroup.add(pBall);
      hopperBalls.push(pBall);
    }

    // Adjustable Skeleton Sniper Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.1, 0.26), tacticalMat);
    stock.position.set(0, -0.02, 0.32);
    gunGroup.add(stock);

    // Hands
    const hands = GunModels.createHands(paintColorHex);
    gunGroup.add(hands.group);

    return {
      mesh: gunGroup,
      bolt: null,
      trigger: trigger,
      oled: null,
      hands: hands,
      hopperBalls: hopperBalls,
      muzzleOffset: new THREE.Vector3(0, 0.02, -0.88),
      adsOffset: new THREE.Vector3(0.0, -0.11, -0.28), // Looking straight through reflex lens
      adsRotation: new THREE.Euler(0.0, 0.0, 0.0),
      normalOffset: new THREE.Vector3(0.20, -0.18, -0.40)
    };
  }

  // 3. Scatter-Blast 500 Paint Cannon (Shotgun)
  static createShotgunMarker(paintColorHex = 0xff0055) {
    const gunGroup = new THREE.Group();
    gunGroup.scale.set(1.0, 1.0, 1.0);

    const heavyMetalMat = new THREE.MeshStandardMaterial({
      color: 0x282f3a,
      metalness: 0.92,
      roughness: 0.25
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x101318,
      metalness: 0.88,
      roughness: 0.35
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: paintColorHex,
      metalness: 0.8,
      roughness: 0.18,
      emissive: paintColorHex,
      emissiveIntensity: 0.5
    });

    // Massive Receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.36), heavyMetalMat);
    gunGroup.add(receiver);

    // Twin Heavy Shotgun Barrels
    const barrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 16), darkMat);
    barrelL.rotation.x = Math.PI / 2;
    barrelL.position.set(-0.024, 0.025, -0.36);
    gunGroup.add(barrelL);

    const barrelR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 16), darkMat);
    barrelR.rotation.x = Math.PI / 2;
    barrelR.position.set(0.024, 0.025, -0.36);
    gunGroup.add(barrelR);

    // Glowing Neon Muzzle Shroud
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.065, 0.14), accentMat);
    shroud.position.set(0, 0.025, -0.54);
    gunGroup.add(shroud);

    // Pump Slide Action Handle
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 16), darkMat);
    pump.rotation.x = Math.PI / 2;
    pump.position.set(0, -0.025, -0.24);
    gunGroup.add(pump);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.08), darkMat);
    grip.position.set(0, -0.1, 0.09);
    grip.rotation.x = 0.2;
    gunGroup.add(grip);

    // Compact Box Hopper with Paint Sight Window (Right Offset)
    const boxHopper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.12), heavyMetalMat);
    boxHopper.position.set(0.045, 0.07, -0.04);
    gunGroup.add(boxHopper);

    const hopperWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.03), accentMat);
    hopperWindow.position.set(0.076, 0.07, -0.04);
    hopperWindow.rotation.y = Math.PI / 2;
    gunGroup.add(hopperWindow);

    // Dynamic Paintballs inside Shotgun Box Hopper
    const shotBallMat = new THREE.MeshStandardMaterial({ color: paintColorHex, roughness: 0.15, metalness: 0.5, emissive: paintColorHex, emissiveIntensity: 0.35 });
    const hopperBalls = [];
    for (let b = 0; b < 12; b++) {
      const pBall = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), shotBallMat);
      const by = 0.055 + (b % 3) * 0.014;
      pBall.position.set(0.045 + ((b % 2) - 0.5) * 0.015, by, -0.07 + Math.floor(b / 3) * 0.02);
      pBall.userData = { baseY: by };
      gunGroup.add(pBall);
      hopperBalls.push(pBall);
    }

    // Hands
    const hands = GunModels.createHands(paintColorHex);
    gunGroup.add(hands.group);

    return {
      mesh: gunGroup,
      bolt: pump,
      trigger: null,
      oled: null,
      hands: hands,
      hopperBalls: hopperBalls,
      muzzleOffset: new THREE.Vector3(0, 0.025, -0.64),
      adsOffset: new THREE.Vector3(0.0, -0.10, -0.28),
      adsRotation: new THREE.Euler(0.0, 0.0, 0.0),
      normalOffset: new THREE.Vector3(0.20, -0.16, -0.38)
    };
  }

  // 4. Hyperion Plasma V2 (Sci-Fi Neon Blaster)
  static createPlasmaMarker(paintColorHex = 0xffe600) {
    const gunGroup = new THREE.Group();
    gunGroup.scale.set(1.0, 1.0, 1.0);

    const whiteChassisMat = new THREE.MeshStandardMaterial({
      color: 0xf2f4f8,
      metalness: 0.35,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    });

    const darkCarbonMat = new THREE.MeshStandardMaterial({
      color: 0x0e1116,
      metalness: 0.92,
      roughness: 0.25
    });

    const plasmaCoilMat = new THREE.MeshStandardMaterial({
      color: paintColorHex,
      emissive: paintColorHex,
      emissiveIntensity: 1.8,
      roughness: 0.08
    });

    // Sleek Streamlined Futuristic Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.085, 0.38), whiteChassisMat);
    gunGroup.add(body);

    // Magnetic Accelerator Coils (4 Glowing Plasma Rings)
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.007, 8, 24), plasmaCoilMat);
      ring.position.set(0, 0.02, -0.2 - i * 0.09);
      gunGroup.add(ring);
    }

    // Central Plasma Energy Emitter Tube
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.42, 16), darkCarbonMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.34);
    gunGroup.add(barrel);

    // Futuristic Grip with Plasma Inlay
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.15, 0.07), whiteChassisMat);
    grip.position.set(0, -0.1, 0.07);
    grip.rotation.x = 0.28;
    gunGroup.add(grip);

    const gripGlow = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.1, 0.03), plasmaCoilMat);
    gripGlow.position.set(0, -0.1, 0.09);
    gripGlow.rotation.x = 0.28;
    gunGroup.add(gripGlow);

    // Energy Core Power Cell
    const powerCell = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 16), plasmaCoilMat);
    powerCell.rotation.x = Math.PI / 2;
    powerCell.position.set(0, -0.16, 0.2);
    gunGroup.add(powerCell);

    // Dynamic Plasma Spheres in Accelerator Chamber
    const plasmaBalls = [];
    for (let b = 0; b < 8; b++) {
      const pBall = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), plasmaCoilMat);
      const bz = -0.18 - b * 0.045;
      pBall.position.set(0, 0.02, bz);
      pBall.userData = { baseY: 0.02, baseZ: bz };
      gunGroup.add(pBall);
      plasmaBalls.push(pBall);
    }

    // Hands
    const hands = GunModels.createHands(paintColorHex);
    gunGroup.add(hands.group);

    return {
      mesh: gunGroup,
      bolt: null,
      trigger: null,
      oled: null,
      hands: hands,
      hopperBalls: plasmaBalls,
      muzzleOffset: new THREE.Vector3(0, 0.02, -0.6),
      adsOffset: new THREE.Vector3(0.0, -0.10, -0.28),
      adsRotation: new THREE.Euler(0.0, 0.0, 0.0),
      normalOffset: new THREE.Vector3(0.20, -0.16, -0.38)
    };
  }
}
