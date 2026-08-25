import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class KillhouseLevel {
  constructor(scene, obstacles, targets) {
    this.scene = scene;
    this.obstacles = obstacles;
    this.targets = targets;

    this.id = 'killhouse';
    this.name = '2. URBAN CQB KILLHOUSE';
    this.tag = 'TACTICAL CQB';
    this.parTime = 48.0;
    this.spawnPos = new THREE.Vector3(0, 0, 20);
    this.spawnYaw = 0.0;
    this.targetCount = 28;
    this.wind = new THREE.Vector3(0, 0, 0);

    this.timeOfDay = 'day';
    this.arenaMeshes = [];
    this.pendulums = [];
  }

  setTimeOfDay(tod) {
    this.timeOfDay = tod;
  }

  build() {
    this.clear();

    const tod = this.timeOfDay || 'day';

    // 1. Dynamic Atmosphere & Skylight Lighting
    let ambientColor, ambientIntensity, sunColor, sunIntensity, fogColor;

    if (tod === 'sunset') {
      ambientColor = 0x553344;
      ambientIntensity = 0.5;
      sunColor = 0xff6622;
      sunIntensity = 1.8;
      fogColor = 0x221118;
    } else if (tod === 'night') {
      ambientColor = 0x111c2e;
      ambientIntensity = 0.35;
      sunColor = 0x2255aa;
      sunIntensity = 0.6;
      fogColor = 0x070b14;
    } else {
      // Day
      ambientColor = 0x99aabb;
      ambientIntensity = 0.65;
      sunColor = 0xfffaed;
      sunIntensity = 1.6;
      fogColor = 0x161d28;
    }

    this.scene.fog = new THREE.FogExp2(fogColor, 0.012);

    const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    this.scene.add(ambient);
    this.arenaMeshes.push(ambient);

    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.set(15, 35, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    this.scene.add(sun);
    this.arenaMeshes.push(sun);

    // Warm Industrial Pendant Lights with Glowing Cones
    const lightsPos = [
      [-10, 8, 10, 0xff9933], [10, 8, 10, 0x00f0ff],
      [-10, 8, -5, 0x39ff14], [10, 8, -5, 0xff0055],
      [0, 8, -20, 0xffe600]
    ];

    lightsPos.forEach(([x, y, z, col]) => {
      const light = new THREE.PointLight(col, tod === 'night' ? 2.0 : 1.2, 28);
      light.position.set(x, y, z);
      this.scene.add(light);
      this.arenaMeshes.push(light);

      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.45, 12, 1, true), new THREE.MeshStandardMaterial({
        color: 0x111620,
        side: THREE.DoubleSide
      }));
      shade.position.set(x, y + 0.25, z);
      this.scene.add(shade);
      this.arenaMeshes.push(shade);

      // Glowing Lamp Bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
      bulb.position.set(x, y, z);
      this.scene.add(bulb);
      this.arenaMeshes.push(bulb);
    });

    // 2. High-Realism Concrete Warehouse Floor with Expansion Joints
    const concreteTex = TextureGenerator.createConcreteTexture('#28303d', true);
    concreteTex.repeat.set(4, 6);

    const floorMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.65,
      metalness: 0.15
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(38, 58), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.arenaMeshes.push(floor);

    // Hazard Striped Floor Markings
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
    const stripeL = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 50), stripeMat);
    stripeL.rotation.x = -Math.PI / 2;
    stripeL.position.set(-6, 0.005, 0);
    this.scene.add(stripeL);
    this.arenaMeshes.push(stripeL);

    const stripeR = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 50), stripeMat);
    stripeR.rotation.x = -Math.PI / 2;
    stripeR.position.set(6, 0.005, 0);
    this.scene.add(stripeR);
    this.arenaMeshes.push(stripeR);

    // 3. Perimeter Reinforced Concrete Warehouse Walls
    const wallTex = TextureGenerator.createConcreteTexture('#151b24', false);
    wallTex.repeat.set(4, 2);

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.75,
      metalness: 0.2
    });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(38, 10, 0.5), wallMat);
    backWall.position.set(0, 5, -29);
    this.scene.add(backWall);
    this.arenaMeshes.push(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10, 58), wallMat);
    leftWall.position.set(-19, 5, 0);
    this.scene.add(leftWall);
    this.arenaMeshes.push(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10, 58), wallMat);
    rightWall.position.set(19, 5, 0);
    this.scene.add(rightWall);
    this.arenaMeshes.push(rightWall);

    // Overhead Steel Rafter Girders & Industrial High-Bay Lamps
    const steelBeamMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
    const lampGlowMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffeedd, emissiveIntensity: 2.2 });

    for (let z = -20; z <= 20; z += 10) {
      // Cross Beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(38, 0.6, 0.4), steelBeamMat);
      beam.position.set(0, 9.7, z);
      this.scene.add(beam);
      this.arenaMeshes.push(beam);

      // Hanging Industrial Lamp
      const lampCable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5, 8), steelBeamMat);
      lampCable.position.set(0, 8.4, z);
      this.scene.add(lampCable);
      this.arenaMeshes.push(lampCable);

      const lampFixture = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 0.4, 12), steelBeamMat);
      lampFixture.position.set(0, 7.1, z);
      this.scene.add(lampFixture);
      this.arenaMeshes.push(lampFixture);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), lampGlowMat);
      bulb.position.set(0, 6.9, z);
      this.scene.add(bulb);
      this.arenaMeshes.push(bulb);

      const pLight = new THREE.PointLight(0xfff4e0, 1.4, 18);
      pLight.position.set(0, 6.8, z);
      this.scene.add(pLight);
      this.arenaMeshes.push(pLight);
    }

    this.obstacles.obstacleMeshes.push(floor, backWall, leftWall, rightWall);

    // 4. Tactical Modular Rooms & CQB Obstacles
    // Entry Breach & Corridor Setup
    this.obstacles.createTacticalDoorway(new THREE.Vector3(0, 0, 16), 0);
    this.obstacles.createTacticalDoorway(new THREE.Vector3(-6, 0, 8), Math.PI / 2);
    this.obstacles.createTacticalDoorway(new THREE.Vector3(6, 0, 8), -Math.PI / 2);

    // Left Sector (Room Alpha)
    this.obstacles.createWoodBarricade(new THREE.Vector3(-9, 0, 12), 6.0, 2.5, 0);
    this.obstacles.createWoodBarricade(new THREE.Vector3(-12, 0, 6), 6.0, 2.5, Math.PI / 2);
    this.obstacles.createPalletStack(new THREE.Vector3(-13, 0, 10), 4, 0.2);
    this.obstacles.createSandbagBunker(new THREE.Vector3(-8, 0, 1), 3.5, 0);

    // Right Sector (Room Bravo)
    this.obstacles.createWoodBarricade(new THREE.Vector3(9, 0, 12), 6.0, 2.5, 0);
    this.obstacles.createWoodBarricade(new THREE.Vector3(12, 0, 6), 6.0, 2.5, -Math.PI / 2);
    this.obstacles.createPalletStack(new THREE.Vector3(13, 0, 10), 4, -0.2);
    this.obstacles.createSandbagBunker(new THREE.Vector3(8, 0, 1), 3.5, 0);

    // Midfield CQB Hallway with Heavy Concrete Barriers, Humvee Cover & Tires
    this.obstacles.createConcreteJerseyBarrier(new THREE.Vector3(-3.5, 0, 8), 0.1);
    this.obstacles.createConcreteJerseyBarrier(new THREE.Vector3(3.5, 0, 8), -0.1);
    this.obstacles.createTacticalHumvee(new THREE.Vector3(0, 0, -4), 0.35, 0x3f4e38);
    this.obstacles.createHeavyCableSpool(new THREE.Vector3(-6, 0, -3), 1.8, 0.4);
    this.obstacles.createExcavatorTireStack(new THREE.Vector3(6, 0, -3), -0.2);
    this.obstacles.createBarrelStack(new THREE.Vector3(-5, 0, -9));
    this.obstacles.createBarrelStack(new THREE.Vector3(5, 0, -9));

    // Deep Warehouse Clearing Partition
    this.obstacles.createWoodBarricade(new THREE.Vector3(-7, 0, -14), 7.0, 2.5, 0);
    this.obstacles.createWoodBarricade(new THREE.Vector3(7, 0, -14), 7.0, 2.5, 0);
    this.obstacles.createTacticalDoorway(new THREE.Vector3(0, 0, -14), 0);
    this.obstacles.createCzechHedgehog(new THREE.Vector3(-6, 0, -20), 1.7, 0.3);
    this.obstacles.createCzechHedgehog(new THREE.Vector3(6, 0, -20), 1.7, -0.3);

    // 5. Hazards: Swinging Pendulums
    const p1 = this.obstacles.createSwingingPendulum(new THREE.Vector3(-4, 0, 4), 3.5, 1.2);
    const p2 = this.obstacles.createSwingingPendulum(new THREE.Vector3(4, 0, 4), 3.5, 1.2);
    this.pendulums.push(p1, p2);

    // 6. Targets & Penalty Hostages Layout
    this.targets.createSteelPopper(new THREE.Vector3(-10, 0, 10), 0);
    this.targets.createSteelPopper(new THREE.Vector3(-14, 0, 8), 0.4);
    this.targets.createCivilianPenaltyTarget(new THREE.Vector3(-6, 0, 9), 0);

    this.targets.createSteelPopper(new THREE.Vector3(10, 0, 10), 0);
    this.targets.createSteelPopper(new THREE.Vector3(14, 0, 8), -0.4);
    this.targets.createCivilianPenaltyTarget(new THREE.Vector3(6, 0, 9), 0);

    this.targets.createSteelPopper(new THREE.Vector3(-2, 0, 4), 0);
    this.targets.createSteelPopper(new THREE.Vector3(2, 0, 4), 0);
    this.targets.createMovingTarget(new THREE.Vector3(-6, 0, -1), new THREE.Vector3(6, 0, -1), 3.5);

    this.targets.createSteelPopper(new THREE.Vector3(-12, 0, -6), 0.2);
    this.targets.createCivilianPenaltyTarget(new THREE.Vector3(-14, 0, -6), 0.2);
    this.targets.createSteelPopper(new THREE.Vector3(12, 0, -6), -0.2);
    this.targets.createCivilianPenaltyTarget(new THREE.Vector3(14, 0, -6), -0.2);

    this.targets.createSteelPopper(new THREE.Vector3(-8, 0, -18), 0);
    this.targets.createSteelPopper(new THREE.Vector3(8, 0, -18), 0);
    this.targets.createSteelPopper(new THREE.Vector3(-3, 0, -22), 0);
    this.targets.createSteelPopper(new THREE.Vector3(3, 0, -22), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 0, -25), 0);

    this.targets.createMovingTarget(new THREE.Vector3(-12, 2.0, -26), new THREE.Vector3(12, 2.0, -26), 4.2);

    this.targets.createExplosiveCan(new THREE.Vector3(-10, 0, -14), 0xff0055);
    this.targets.createExplosiveCan(new THREE.Vector3(10, 0, -14), 0x00f0ff);
  }

  update(delta) {
    for (const p of this.pendulums) {
      if (p && p.pivot) {
        p.time += delta * 3.5;
        p.pivot.rotation.z = Math.sin(p.time) * 0.7;
      }
    }
  }

  clear() {
    for (const m of this.arenaMeshes) this.scene.remove(m);
    this.arenaMeshes = [];
    this.pendulums = [];
  }
}
