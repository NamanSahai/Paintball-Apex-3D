import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class SandboxRangeLevel {
  constructor(scene, obstacles, targets) {
    this.scene = scene;
    this.obstacles = obstacles;
    this.targets = targets;

    this.id = 'sandbox';
    this.name = '5. FIRING RANGE & SANDBOX';
    this.tag = 'PRACTICE RANGE';
    this.parTime = 999.0;
    this.spawnPos = new THREE.Vector3(0, 0, 15);
    this.spawnYaw = 0.0;
    this.targetCount = 999;
    this.wind = new THREE.Vector3(0, 0, 0);

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
      ambientColor = 0xff8855;
      ambientIntensity = 0.65;
      sunColor = 0xff6622;
      sunIntensity = 2.0;
      skyColor = 0xdd5533;
      fogColor = 0x772211;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.005);
    } else if (tod === 'night') {
      ambientColor = 0x112244;
      ambientIntensity = 0.45;
      sunColor = 0x3366cc;
      sunIntensity = 0.8;
      skyColor = 0x050914;
      fogColor = 0x060c18;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.01);
    } else {
      // Day (Clear Sunny Open Range)
      ambientColor = 0xffffff;
      ambientIntensity = 0.9;
      sunColor = 0xfffaee;
      sunIntensity = 1.9;
      skyColor = 0x4299e1;
      fogColor = 0x88c0ee;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.003);
    }

    const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    this.scene.add(ambient);
    this.arenaMeshes.push(ambient);

    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.set(20, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    this.scene.add(sun);
    this.arenaMeshes.push(sun);

    // Sky Dome
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(140, 24, 16),
      new THREE.MeshBasicMaterial({ color: skyColor, side: THREE.BackSide })
    );
    this.scene.add(sky);
    this.arenaMeshes.push(sky);

    // Expansive Outdoor Military Proving Grounds Floor
    const concreteTex = TextureGenerator.createConcreteTexture('#202834', true);
    concreteTex.repeat.set(12, 16);

    const floorMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.75,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 150), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -10);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.arenaMeshes.push(floor);

    // Surrounding Tactical Concrete Perimeter Walls
    const wallTex = TextureGenerator.createConcreteTexture('#18202c', false);
    wallTex.repeat.set(8, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8, metalness: 0.1 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(120, 8, 1.0), wallMat);
    backWall.position.set(0, 4, -80);
    this.scene.add(backWall);
    this.arenaMeshes.push(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1.0, 8, 150), wallMat);
    leftWall.position.set(-60, 4, -10);
    this.scene.add(leftWall);
    this.arenaMeshes.push(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1.0, 8, 150), wallMat);
    rightWall.position.set(60, 4, -10);
    this.scene.add(rightWall);
    this.arenaMeshes.push(rightWall);

    // Covered Firing Line Pavilion Canopy Structure
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(32, 0.3, 14), steelMat);
    roof.position.set(0, 5.2, 14);
    this.scene.add(roof);
    this.arenaMeshes.push(roof);

    const pillarCoords = [[-15, 8], [15, 8], [-15, 20], [15, 20]];
    for (const [px, pz] of pillarCoords) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5.2, 12), steelMat);
      pillar.position.set(px, 2.6, pz);
      this.scene.add(pillar);
      this.arenaMeshes.push(pillar);
    }

    this.obstacles.obstacleMeshes.push(floor, backWall, leftWall, rightWall, roof);

    // Comprehensive Test Bunkers & Obstacles
    this.obstacles.createGiantCenterW(new THREE.Vector3(0, 0, -2), 3.4, 2.3, 'blue');
    this.obstacles.createDorito(new THREE.Vector3(-7, 0, 6), 2.4, 1.9, 0, 'blue');
    this.obstacles.createCan(new THREE.Vector3(7, 0, 6), 2.2, 0.65, 'orange');
    this.obstacles.createTallCake(new THREE.Vector3(4, 0, 0), 2.4, 0.55, 'yellow');
    this.obstacles.createSnakeBeam(new THREE.Vector3(-10, 0, -6), 6.5, 0);
    this.obstacles.createBarrelStack(new THREE.Vector3(10, 0, -6));
    this.obstacles.createConcreteJerseyBarrier(new THREE.Vector3(-5, 0, 11), 0.1);
    this.obstacles.createConcreteJerseyBarrier(new THREE.Vector3(5, 0, 11), -0.1);
    this.obstacles.createSandbagBunker(new THREE.Vector3(-11, 0, 10), 3.5, 0.2);
    this.obstacles.createPalletStack(new THREE.Vector3(11, 0, 10), 4, -0.2);
    this.obstacles.createSniperShootingBench(new THREE.Vector3(0, 0, 14), 0);
    this.obstacles.createTacticalDoorway(new THREE.Vector3(0, 0, 8), 0);

    // Creative Heavy Obstacles for Sandbox
    this.obstacles.createTacticalHumvee(new THREE.Vector3(-16, 0, 0), 0.5, 0x47553b);
    this.obstacles.createShippingContainer(new THREE.Vector3(16, 0, 0), 6.0, 0, '#1e3a8a', 'TEST-01');
    this.obstacles.createChemicalStorageTank(new THREE.Vector3(-20, 0, -18), 4.5, 2.4, '#f8fafc');
    this.obstacles.createHeavyCableSpool(new THREE.Vector3(-14, 0, 8), 1.8, 0.2);
    this.obstacles.createExcavatorTireStack(new THREE.Vector3(14, 0, 8), -0.2);
    this.obstacles.createCzechHedgehog(new THREE.Vector3(-10, 0, -14), 1.7, 0.3);
    this.obstacles.createCzechHedgehog(new THREE.Vector3(10, 0, -14), 1.7, -0.3);

    // Multi-Distance Test Targets
    // 10m
    this.targets.createSteelPopper(new THREE.Vector3(-4, 0, 5), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 0, 5), 0);
    this.targets.createSteelPopper(new THREE.Vector3(4, 0, 5), 0);

    // 25m
    this.targets.createSteelPopper(new THREE.Vector3(-6, 0, -10), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 0, -10), 0);
    this.targets.createSteelPopper(new THREE.Vector3(6, 0, -10), 0);

    // Moving target at 30m
    this.targets.createMovingTarget(new THREE.Vector3(-10, 0, -15), new THREE.Vector3(10, 0, -15), 3.0);

    // Windmill at 40m
    this.targets.createWindmillTarget(new THREE.Vector3(0, 0, -25), 1.5);

    // Penalty test target
    this.targets.createCivilianPenaltyTarget(new THREE.Vector3(-12, 0, 0), 0.5);

    // Explosive Can
    this.targets.createExplosiveCan(new THREE.Vector3(12, 0, 0), 0xffe600);
  }

  clear() {
    for (const m of this.arenaMeshes) this.scene.remove(m);
    this.arenaMeshes = [];
  }
}
