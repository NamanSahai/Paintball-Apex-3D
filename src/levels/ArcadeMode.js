import * as THREE from 'three';

export class ArcadeModeLevel {
  constructor(scene, obstacles, targets) {
    this.scene = scene;
    this.obstacles = obstacles;
    this.targets = targets;

    this.id = 'arcade';
    this.name = '4. NEON CYBER FRENZY';
    this.tag = 'SURVIVAL REFLEX';
    this.parTime = 120.0;
    this.spawnPos = new THREE.Vector3(0, 0, 18);
    this.spawnYaw = 0.0;
    this.targetCount = 35;
    this.wind = new THREE.Vector3(0, 0, 0);

    this.timeOfDay = 'day';
    this.spawnTimer = 0.0;
    this.spawnInterval = 1.2;
    this.arenaMeshes = [];
    this.activeDrones = [];
  }

  setTimeOfDay(tod) {
    this.timeOfDay = tod;
  }

  build() {
    this.clear();

    const tod = this.timeOfDay || 'day';

    let ambientColor, ambientIntensity, sunColor, sunIntensity, skyColor, fogColor;

    if (tod === 'sunset') {
      // Outrun / Synthwave Golden Magenta Sunset
      ambientColor = 0x86198f;
      ambientIntensity = 0.85;
      sunColor = 0xf97316;
      sunIntensity = 2.4;
      skyColor = 0x701a75;
      fogColor = 0x3b0764;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.003);
    } else if (tod === 'night') {
      // Cyberpunk Neon Night with Laser Lights
      ambientColor = 0x2e1065;
      ambientIntensity = 0.75;
      sunColor = 0x00f0ff;
      sunIntensity = 1.6;
      skyColor = 0x070514;
      fogColor = 0x0c0a1a;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.005);
    } else {
      // High-Tech Cyber Arena in Bright Daylight
      ambientColor = 0xffffff;
      ambientIntensity = 1.1;
      sunColor = 0xfffaee;
      sunIntensity = 2.2;
      skyColor = 0x38bdf8;
      fogColor = 0x93c5fd;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.002);
    }

    // 1. Ambient & Directional Lighting
    const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    this.scene.add(ambient);
    this.arenaMeshes.push(ambient);

    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.set(25, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    this.scene.add(sun);
    this.arenaMeshes.push(sun);

    // 2. Sky Dome & Futuristic Cyber Cityscape Perimeter Backdrop
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(140, 24, 16),
      new THREE.MeshBasicMaterial({ color: skyColor, side: THREE.BackSide })
    );
    this.scene.add(sky);
    this.arenaMeshes.push(sky);

    // Towering 3D Cyber City Skyline Backdrop
    const skylineTex = TextureGenerator.createCyberSkylineTexture(tod);
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTex,
      transparent: true,
      opacity: 0.95
    });

    const cityBackdrop = new THREE.Mesh(new THREE.CylinderGeometry(85, 85, 60, 32, 1, true), skylineMat);
    cityBackdrop.position.set(0, 20, 0);
    this.scene.add(cityBackdrop);
    this.arenaMeshes.push(cityBackdrop);

    // 3. Neon Cyber Floor Grid
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 512;
    gridCanvas.height = 512;
    const ctx = gridCanvas.getContext('2d');
    ctx.fillStyle = tod === 'day' ? '#141c2b' : '#06040d';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#b800ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512);
      ctx.moveTo(0, i); ctx.lineTo(512, i);
      ctx.stroke();
    }

    const gridTex = new THREE.CanvasTexture(gridCanvas);
    gridTex.wrapS = THREE.RepeatWrapping;
    gridTex.wrapT = THREE.RepeatWrapping;
    gridTex.repeat.set(8, 8);

    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.2,
      metalness: 0.8
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.arenaMeshes.push(floor);
    this.obstacles.obstacleMeshes.push(floor);

    // 4. Glowing Neon Cyber Columns around perimeter
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1
    });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 12, 12), colMat);
      col.position.set(Math.cos(angle) * 24, 6, Math.sin(angle) * 24);
      this.scene.add(col);
      this.arenaMeshes.push(col);

      const pLight = new THREE.PointLight(i % 2 === 0 ? 0x00f0ff : 0xff0055, 1.2, 20);
      pLight.position.copy(col.position);
      this.scene.add(pLight);
      this.arenaMeshes.push(pLight);
    }

    // 5. Tactical Cyber Combat Obstacles & Holographic Forcefields
    this.obstacles.createCyberHexPillar(new THREE.Vector3(-8, 0, -6), 4.2, 0x00f0ff);
    this.obstacles.createCyberHexPillar(new THREE.Vector3(8, 0, -6), 4.2, 0xff0055);
    this.obstacles.createCyberHexPillar(new THREE.Vector3(-8, 0, 8), 4.2, 0x39ff14);
    this.obstacles.createCyberHexPillar(new THREE.Vector3(8, 0, 8), 4.2, 0xffe600);

    this.obstacles.createHoloBarrier(new THREE.Vector3(0, 0, 6), 4.0, 2.2, 0, 0x00f0ff);
    this.obstacles.createHoloBarrier(new THREE.Vector3(0, 0, -6), 4.0, 2.2, 0, 0xff0055);
    this.obstacles.createHoloBarrier(new THREE.Vector3(-12, 0, 0), 4.0, 2.2, Math.PI / 2, 0x00f0ff);
    this.obstacles.createHoloBarrier(new THREE.Vector3(12, 0, 0), 4.0, 2.2, Math.PI / 2, 0xff0055);

    // 6. Stationary & Dynamic Cyber Arena Targets
    this.targets.createSteelPopper(new THREE.Vector3(-5, 0, 2), 0);
    this.targets.createSteelPopper(new THREE.Vector3(5, 0, 2), 0);
    this.targets.createSteelPopper(new THREE.Vector3(-9, 0, -8), 0);
    this.targets.createSteelPopper(new THREE.Vector3(9, 0, -8), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 0, -14), 0);

    // Moving Laser Rail Target
    this.targets.createMovingTarget(new THREE.Vector3(-8, 1.2, -10), new THREE.Vector3(8, 1.2, -10), 3.5);

    // Spinning Cyber Windmill
    this.targets.createWindmillTarget(new THREE.Vector3(0, 0, -18), 1.8);

    // Initial Flying Drone Swarm
    for (let k = 0; k < 6; k++) {
      this.spawnRandomDrone();
    }
  }

  spawnRandomDrone() {
    const angle = (Math.random() - 0.5) * Math.PI * 1.4 - Math.PI / 2; // In front of player
    const dist = 7 + Math.random() * 14;
    const height = 1.2 + Math.random() * 2.8;
    const pos = new THREE.Vector3(Math.cos(angle) * dist, height, Math.sin(angle) * dist);

    if (Math.random() > 0.35) {
      this.targets.createDroneTarget(pos);
    } else {
      this.targets.createExplosiveCan(pos, Math.random() > 0.5 ? 0xff0055 : 0xffe600);
    }
  }

  update(delta, time) {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0.0;
      if (this.targets.targets.length < 16) {
        this.spawnRandomDrone();
      }
    }
  }

  clear() {
    for (const m of this.arenaMeshes) this.scene.remove(m);
    this.arenaMeshes = [];
  }
}
