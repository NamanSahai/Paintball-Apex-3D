import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class ShipyardDocksLevel {
  constructor(scene, obstacles, targets) {
    this.scene = scene;
    this.obstacles = obstacles;
    this.targets = targets;

    this.id = 'shipyard';
    this.name = '4. CARGO SHIPYARD TERMINAL';
    this.tag = 'TACTICAL CQB & FREIGHT';
    this.parTime = 65.0;
    this.spawnPos = new THREE.Vector3(0, 0, 22);
    this.spawnYaw = 0.0;
    this.targetCount = 28;
    this.wind = new THREE.Vector3(1.2, 0, 0.4);

    this.timeOfDay = 'day';
    this.arenaMeshes = [];
  }

  setTimeOfDay(tod) {
    this.timeOfDay = tod;
  }

  build() {
    this.clear();

    const tod = this.timeOfDay || 'day';

    let ambientColor, ambientIntensity, sunColor, sunIntensity, skyColor, fogColor;

    if (tod === 'sunset') {
      // Golden Ocean Harbor Sunset
      ambientColor = 0xff8844;
      ambientIntensity = 0.65;
      sunColor = 0xf97316;
      sunIntensity = 2.4;
      skyColor = 0x831843;
      fogColor = 0x4c0519;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.0035);
    } else if (tod === 'night') {
      // Midnight Harbor with High-Bay Spotlights & Ocean Mist
      ambientColor = 0x1e293b;
      ambientIntensity = 0.45;
      sunColor = 0x64748b;
      sunIntensity = 0.9;
      skyColor = 0x050b14;
      fogColor = 0x07111e;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.005);
    } else {
      // Crisp Coastal Daylight
      ambientColor = 0xffffff;
      ambientIntensity = 1.15;
      sunColor = 0xfffaee;
      sunIntensity = 2.3;
      skyColor = 0x38bdf8;
      fogColor = 0xa5f3fc;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.002);
    }

    // 1. Lighting Setup
    const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    this.scene.add(ambient);
    this.arenaMeshes.push(ambient);

    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.set(30, 45, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 160;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.bias = -0.0003;
    this.scene.add(sun);
    this.arenaMeshes.push(sun);

    // 2. Sky Dome
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(140, 24, 16),
      new THREE.MeshBasicMaterial({ color: skyColor, side: THREE.BackSide })
    );
    this.scene.add(sky);
    this.arenaMeshes.push(sky);

    // 3. Wet Asphalt & Concrete Freight Dock Floor
    const asphaltTex = TextureGenerator.createConcreteTexture('#1a212d', true);
    asphaltTex.repeat.set(12, 14);

    const floorMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.65,
      metalness: 0.25
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 140), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -10);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.arenaMeshes.push(floor);

    // Harbor Perimeter Security Walls
    const wallTex = TextureGenerator.createConcreteTexture('#111827', false);
    wallTex.repeat.set(8, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0.15 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(120, 10, 1.2), wallMat);
    backWall.position.set(0, 5, -80);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.scene.add(backWall);
    this.arenaMeshes.push(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 140), wallMat);
    leftWall.position.set(-60, 5, -10);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
    this.arenaMeshes.push(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 140), wallMat);
    rightWall.position.set(60, 5, -10);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
    this.arenaMeshes.push(rightWall);

    this.obstacles.obstacleMeshes.push(floor, backWall, leftWall, rightWall);

    // 4. Harbor Floodlight Towers
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffeedd, emissiveIntensity: 2.5 });
    const lightPosts = [[-25, 20], [25, 20], [-35, -25], [35, -25], [-20, -60], [20, -60]];

    for (const [lx, lz] of lightPosts) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 16, 12), steelMat);
      pole.position.set(lx, 8, lz);
      this.scene.add(pole);
      this.arenaMeshes.push(pole);

      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.0), lampMat);
      lampHead.position.set(lx, 16, lz);
      lampHead.lookAt(0, 0, lz);
      this.scene.add(lampHead);
      this.arenaMeshes.push(lampHead);

      if (tod === 'night' || tod === 'sunset') {
        const spot = new THREE.SpotLight(0xfff3d6, 2.2, 45, Math.PI / 3.5, 0.4);
        spot.position.set(lx, 16, lz);
        spot.target.position.set(0, 0, lz);
        this.scene.add(spot);
        this.scene.add(spot.target);
        this.arenaMeshes.push(spot, spot.target);
      }
    }

    // 5. Heavy Multi-Color Shipping Freight Container Stacks (CQB Mazes & High-Grounds)
    // Left Sector Container Fortress (2-Tier & 3-Tier)
    this.obstacles.createShippingContainer(new THREE.Vector3(-14, 0, 8), 6.0, 0, '#1e3a8a', 'MAERSK-01');
    this.obstacles.createShippingContainer(new THREE.Vector3(-14, 2.6, 8), 6.0, 0, '#991b1b', 'HAPAG-02');
    this.obstacles.createShippingContainer(new THREE.Vector3(-18, 0, 2), 6.0, Math.PI / 2, '#d97706', 'COSCO-03');
    this.obstacles.createShippingContainer(new THREE.Vector3(-14, 0, -10), 6.0, 0, '#166534', 'EVERGREEN-04');
    this.obstacles.createShippingContainer(new THREE.Vector3(-14, 2.6, -10), 6.0, 0, '#1e3a8a', 'APEX-CARGO');

    // Right Sector Container Fortress (2-Tier & 3-Tier)
    this.obstacles.createShippingContainer(new THREE.Vector3(14, 0, 8), 6.0, 0, '#991b1b', 'PACIFIC-01');
    this.obstacles.createShippingContainer(new THREE.Vector3(14, 2.6, 8), 6.0, 0, '#1e3a8a', 'NXL-LOGISTICS');
    this.obstacles.createShippingContainer(new THREE.Vector3(18, 0, 2), 6.0, -Math.PI / 2, '#166534', 'EVERGREEN-05');
    this.obstacles.createShippingContainer(new THREE.Vector3(14, 0, -10), 6.0, 0, '#d97706', 'MAERSK-06');
    this.obstacles.createShippingContainer(new THREE.Vector3(14, 2.6, -10), 6.0, 0, '#581c87', 'VIPER-CARGO');

    // Center Tactical CQB Chokepoints & Alleyways
    this.obstacles.createShippingContainer(new THREE.Vector3(-5, 0, -22), 6.0, 0.3, '#1e3a8a', 'ATLANTIC-08');
    this.obstacles.createShippingContainer(new THREE.Vector3(5, 0, -22), 6.0, -0.3, '#991b1b', 'PACIFIC-09');
    this.obstacles.createShippingContainer(new THREE.Vector3(0, 0, -42), 6.0, Math.PI / 2, '#d97706', 'GLOBAL-10');
    this.obstacles.createShippingContainer(new THREE.Vector3(0, 2.6, -42), 6.0, Math.PI / 2, '#166534', 'FREIGHT-11');

    // Industrial Fuel & Chemical Storage Silos
    this.obstacles.createChemicalStorageTank(new THREE.Vector3(-22, 0, -20), 5.0, 2.6, '#f8fafc');
    this.obstacles.createChemicalStorageTank(new THREE.Vector3(22, 0, -20), 5.0, 2.6, '#cbd5e1');

    // Tactical Armored Humvee Wreck & Heavy Cable Spools
    this.obstacles.createTacticalHumvee(new THREE.Vector3(0, 0, -4), -0.2, 0x1e293b);
    this.obstacles.createHeavyCableSpool(new THREE.Vector3(-7, 0, 4), 2.0, 0.4);
    this.obstacles.createHeavyCableSpool(new THREE.Vector3(7, 0, 4), 2.0, -0.4);
    this.obstacles.createExcavatorTireStack(new THREE.Vector3(-6, 0, -14), 0.3);
    this.obstacles.createExcavatorTireStack(new THREE.Vector3(6, 0, -14), -0.3);

    // Tactical Pallets, Concrete Barriers, Czech Hedgehogs and Barrel Stacks
    this.obstacles.createConcreteJerseyBarrier(new THREE.Vector3(-4, 0, 14), 0.1);
    this.obstacles.createConcreteJerseyBarrier(new THREE.Vector3(4, 0, 14), -0.1);
    this.obstacles.createCzechHedgehog(new THREE.Vector3(-9, 0, 10), 1.8, 0.2);
    this.obstacles.createCzechHedgehog(new THREE.Vector3(9, 0, 10), 1.8, -0.2);
    this.obstacles.createPalletStack(new THREE.Vector3(-10, 0, 13), 4, 0.2);
    this.obstacles.createPalletStack(new THREE.Vector3(10, 0, 13), 4, -0.2);
    this.obstacles.createSandbagBunker(new THREE.Vector3(0, 0, 16), 4.2, 0);
    this.obstacles.createBarrelStack(new THREE.Vector3(-7, 0, -4));
    this.obstacles.createBarrelStack(new THREE.Vector3(7, 0, -4));
    this.obstacles.createBarrelStack(new THREE.Vector3(-9, 0, -32));
    this.obstacles.createBarrelStack(new THREE.Vector3(9, 0, -32));

    // 6. Comprehensive Target Suite (28 Total Targets)
    // Close Range Targets (10m - 15m)
    this.targets.createSteelPopper(new THREE.Vector3(-4, 0, 6), 0);
    this.targets.createSteelPopper(new THREE.Vector3(4, 0, 6), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 0, 2), 0);
    this.targets.createCivilianPenaltyTarget(new THREE.Vector3(-9, 0, 4), 0.2);
    this.targets.createCivilianPenaltyTarget(new THREE.Vector3(9, 0, 4), -0.2);

    // Mid-Range Targets (20m - 35m)
    this.targets.createSteelPopper(new THREE.Vector3(-14, 2.7, 8), 0); // Elevated atop container
    this.targets.createSteelPopper(new THREE.Vector3(14, 2.7, 8), 0);  // Elevated atop container
    this.targets.createSteelPopper(new THREE.Vector3(-8, 0, -12), 0);
    this.targets.createSteelPopper(new THREE.Vector3(8, 0, -12), 0);
    this.targets.createSteelPopper(new THREE.Vector3(-3, 0, -18), 0);
    this.targets.createSteelPopper(new THREE.Vector3(3, 0, -18), 0);

    // Moving Rail Targets Traversing Alleys
    this.targets.createMovingTarget(new THREE.Vector3(-10, 0, -6), new THREE.Vector3(10, 0, -6), 3.2);
    this.targets.createMovingTarget(new THREE.Vector3(-12, 2.7, -10), new THREE.Vector3(12, 2.7, -10), 4.0);

    // Long-Range Targets (40m - 60m)
    this.targets.createSteelPopper(new THREE.Vector3(-12, 0, -35), 0);
    this.targets.createSteelPopper(new THREE.Vector3(12, 0, -35), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 2.7, -42), 0); // Elevated container roof
    this.targets.createSteelPopper(new THREE.Vector3(-6, 0, -48), 0);
    this.targets.createSteelPopper(new THREE.Vector3(6, 0, -48), 0);
    this.targets.createCivilianPenaltyTarget(new THREE.Vector3(0, 0, -28), 0);

    // Spinning Heavy Windmill Target
    this.targets.createWindmillTarget(new THREE.Vector3(-10, 0, -55), 1.6);
    this.targets.createWindmillTarget(new THREE.Vector3(10, 0, -55), -1.6);

    // Explosive Paintball Bonus Cans
    this.targets.createExplosiveCan(new THREE.Vector3(-14, 0.8, 1), 0xffe600);
    this.targets.createExplosiveCan(new THREE.Vector3(14, 0.8, 1), 0x00f0ff);
    this.targets.createExplosiveCan(new THREE.Vector3(-5, 0.8, -30), 0xff0055);
    this.targets.createExplosiveCan(new THREE.Vector3(5, 0.8, -30), 0x39ff14);
  }

  update(delta, time) {
    // Level animation hooks
  }

  clear() {
    for (const m of this.arenaMeshes) this.scene.remove(m);
    this.arenaMeshes = [];
  }
}
