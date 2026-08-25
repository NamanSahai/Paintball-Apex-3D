import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class SniperRangeLevel {
  constructor(scene, obstacles, targets) {
    this.scene = scene;
    this.obstacles = obstacles;
    this.targets = targets;

    this.id = 'sniper';
    this.name = '3. SNIPER RIDGE CANYON';
    this.tag = 'LONG RANGE';
    this.parTime = 60.0;
    this.spawnPos = new THREE.Vector3(0, 0, 20);
    this.spawnYaw = 0.0;
    this.targetCount = 20;

    this.timeOfDay = 'day';
    this.wind = new THREE.Vector3(3.5, 0, 0);

    this.arenaMeshes = [];
    this.windFlags = [];
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
      ambientIntensity = 0.8;
      sunColor = 0xff6622;
      sunIntensity = 2.6;
      skyColor = 0xd45028;
      fogColor = 0x662211;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.004);
    } else if (tod === 'night') {
      ambientColor = 0x112244;
      ambientIntensity = 0.55;
      sunColor = 0x3366cc;
      sunIntensity = 0.9;
      skyColor = 0x050914;
      fogColor = 0x070d1a;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.01);
    } else {
      // Day (Vibrant Sunny Desert Canyon)
      ambientColor = 0xffffff;
      ambientIntensity = 1.15;
      sunColor = 0xfff6ea;
      sunIntensity = 2.4;
      skyColor = 0x4aa4f2;
      fogColor = 0x98c5f0;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.0025);
    }

    const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    this.scene.add(ambient);
    this.arenaMeshes.push(ambient);

    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.set(40, 30, -50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    this.scene.add(sun);
    this.arenaMeshes.push(sun);

    // If Night, add illuminated Target Spotlights
    if (tod === 'night') {
      const spot1 = new THREE.SpotLight(0x00f0ff, 3.0, 60, Math.PI / 6, 0.3);
      spot1.position.set(0, 15, 10);
      spot1.target.position.set(0, 0, -30);
      this.scene.add(spot1);
      this.scene.add(spot1.target);
      this.arenaMeshes.push(spot1, spot1.target);

      const spot2 = new THREE.SpotLight(0xff0055, 3.0, 90, Math.PI / 6, 0.3);
      spot2.position.set(0, 15, 10);
      spot2.target.position.set(0, 0, -65);
      this.scene.add(spot2);
      this.scene.add(spot2.target);
      this.arenaMeshes.push(spot2, spot2.target);
    }

    // 2. Expansive Desert Canyon Floor (No Visible Cutoffs)
    const sandTex = TextureGenerator.createCanyonSandTexture(tod);
    sandTex.repeat.set(16, 24);

    const groundMat = new THREE.MeshStandardMaterial({
      map: sandTex,
      roughness: 0.95,
      metalness: 0.02
    });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 240), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -30);
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.arenaMeshes.push(ground);

    // 3. Towering 3D Canyon Cliff Gorge Walls (Left, Right, Back Mountain Ridges)
    const cliffTex = TextureGenerator.createCanyonCliffTexture(tod);
    cliffTex.repeat.set(8, 3);

    const cliffMat = new THREE.MeshStandardMaterial({
      map: cliffTex,
      roughness: 0.9,
      metalness: 0.05
    });

    // Left Canyon Ridge Wall (Height 20m, Length 220m)
    const leftCliff = new THREE.Mesh(new THREE.BoxGeometry(16, 22, 220), cliffMat);
    leftCliff.position.set(-30, 10, -30);
    leftCliff.castShadow = true;
    leftCliff.receiveShadow = true;
    this.scene.add(leftCliff);
    this.arenaMeshes.push(leftCliff);

    // Right Canyon Ridge Wall (Height 20m, Length 220m)
    const rightCliff = new THREE.Mesh(new THREE.BoxGeometry(16, 22, 220), cliffMat);
    rightCliff.position.set(30, 10, -30);
    rightCliff.castShadow = true;
    rightCliff.receiveShadow = true;
    this.scene.add(rightCliff);
    this.arenaMeshes.push(rightCliff);

    // Back Mountain Gorge Wall (Height 28m, Width 80m)
    const backCliff = new THREE.Mesh(new THREE.BoxGeometry(80, 28, 20), cliffMat);
    backCliff.position.set(0, 13, -120);
    backCliff.castShadow = true;
    backCliff.receiveShadow = true;
    this.scene.add(backCliff);
    this.arenaMeshes.push(backCliff);

    // 4. Sniper Shooting Platform & Shaded Wooden Pavilion
    const woodTex = TextureGenerator.createWoodPlankTexture('#4a3525');
    woodTex.repeat.set(3, 2);

    const platformMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.8,
      metalness: 0.05
    });

    const platform = new THREE.Mesh(new THREE.BoxGeometry(22, 0.15, 14), platformMat);
    platform.position.set(0, 0.08, 20);
    platform.receiveShadow = true;
    this.scene.add(platform);
    this.arenaMeshes.push(platform);
    this.obstacles.obstacleMeshes.push(ground, platform, leftCliff, rightCliff, backCliff);

    // Heavy Sniper Shooting Benches on Firing Line (Firmly Grounded)
    this.obstacles.createSniperShootingBench(new THREE.Vector3(-4.5, 0, 18), 0);
    this.obstacles.createSniperShootingBench(new THREE.Vector3(0, 0, 18), 0);
    this.obstacles.createSniperShootingBench(new THREE.Vector3(4.5, 0, 18), 0);
    this.obstacles.createSandbagBunker(new THREE.Vector3(-8.5, 0, 16.5), 3.8, 0.15);
    this.obstacles.createSandbagBunker(new THREE.Vector3(8.5, 0, 16.5), 3.8, -0.15);

    // 5. Distance Marker Boards with High-Vis Flags (25m, 50m, 75m, 100m)
    const distMarkers = [
      { z: 10, text: '25 METERS', color: 0x39ff14 },
      { z: -15, text: '50 METERS', color: 0xffe600 },
      { z: -40, text: '75 METERS', color: 0xff7700 },
      { z: -65, text: '100 METERS', color: 0xff0055 }
    ];

    distMarkers.forEach(dm => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.5, 8), platformMat);
      pole.position.set(-18, 2.25, dm.z);
      this.scene.add(pole);
      this.arenaMeshes.push(pole);

      const flagMat = new THREE.MeshStandardMaterial({
        color: dm.color,
        emissive: dm.color,
        emissiveIntensity: 0.4,
        side: THREE.DoubleSide
      });
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), flagMat);
      flag.position.set(-17.2, 4.0, dm.z);
      this.scene.add(flag);
      this.arenaMeshes.push(flag);
      this.windFlags.push(flag);
    });

    // Sky Dome
    const skyMat = new THREE.MeshBasicMaterial({
      color: skyColor,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16), skyMat);
    this.scene.add(sky);
    this.arenaMeshes.push(sky);

    // 6. Natural Desert Canyon Rock Clusters (Firmly Grounded at Cliff Bases)
    this.obstacles.createCanyonBoulder(new THREE.Vector3(-18, 0, 10), 2.8, 0.4);
    this.obstacles.createCanyonBoulder(new THREE.Vector3(-19, 0, -5), 3.4, 1.2);
    this.obstacles.createCanyonBoulder(new THREE.Vector3(-17, 0, -30), 3.0, 0.8);
    this.obstacles.createCanyonBoulder(new THREE.Vector3(-18, 0, -60), 3.8, 2.0);

    this.obstacles.createCanyonBoulder(new THREE.Vector3(18, 0, 10), 2.8, -0.4);
    this.obstacles.createCanyonBoulder(new THREE.Vector3(19, 0, -5), 3.4, -1.2);
    this.obstacles.createCanyonBoulder(new THREE.Vector3(17, 0, -30), 3.0, -0.8);
    this.obstacles.createCanyonBoulder(new THREE.Vector3(18, 0, -60), 3.8, -2.0);

    // Mid-Range Tactical Concrete Barriers, Humvee Cover, Hedgehogs & Sandbags
    this.obstacles.createConcreteJerseyBarrier(new THREE.Vector3(-6, 0, -5), 0.1);
    this.obstacles.createConcreteJerseyBarrier(new THREE.Vector3(6, 0, -5), -0.1);
    this.obstacles.createTacticalHumvee(new THREE.Vector3(0, 0, -35), -0.35, 0x856a4b); // Desert Tan Humvee
    this.obstacles.createCzechHedgehog(new THREE.Vector3(-7, 0, -15), 1.8, 0.4);
    this.obstacles.createCzechHedgehog(new THREE.Vector3(7, 0, -15), 1.8, -0.4);
    this.obstacles.createExcavatorTireStack(new THREE.Vector3(-8, 0, -35), 0.2);
    this.obstacles.createExcavatorTireStack(new THREE.Vector3(8, 0, -35), -0.2);
    this.obstacles.createSandbagBunker(new THREE.Vector3(0, 0, -25), 4.5, 0);
    this.obstacles.createBarrelStack(new THREE.Vector3(-8, 0, -25));
    this.obstacles.createBarrelStack(new THREE.Vector3(8, 0, -25));

    // Targets at Varying Distances
    this.targets.createSteelPopper(new THREE.Vector3(-6, 0, 10), 0);
    this.targets.createSteelPopper(new THREE.Vector3(6, 0, 10), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 0, 8), 0);

    this.targets.createSteelPopper(new THREE.Vector3(-10, 0, -15), 0);
    this.targets.createSteelPopper(new THREE.Vector3(10, 0, -15), 0);
    this.targets.createMovingTarget(new THREE.Vector3(-8, 0, -18), new THREE.Vector3(8, 0, -18), 3.0);

    this.targets.createWindmillTarget(new THREE.Vector3(-8, 0, -40), 1.6);
    this.targets.createWindmillTarget(new THREE.Vector3(8, 0, -40), -1.6);
    this.targets.createSteelPopper(new THREE.Vector3(0, 0, -42), 0);

    this.targets.createSteelPopper(new THREE.Vector3(-12, 0, -65), 0);
    this.targets.createSteelPopper(new THREE.Vector3(12, 0, -65), 0);
    this.targets.createSteelPopper(new THREE.Vector3(-5, 0, -68), 0);
    this.targets.createSteelPopper(new THREE.Vector3(5, 0, -68), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 3.5, -70), 0);

    this.targets.createMovingTarget(new THREE.Vector3(-15, 2.5, -55), new THREE.Vector3(15, 2.5, -55), 4.5);

    this.targets.createExplosiveCan(new THREE.Vector3(-10, 0.5, -45), 0xffe600);
    this.targets.createExplosiveCan(new THREE.Vector3(10, 0.5, -45), 0x00f0ff);
  }

  update(delta, time) {
    for (let i = 0; i < this.windFlags.length; i++) {
      const f = this.windFlags[i];
      f.rotation.y = Math.sin(time * 8.0 + i) * 0.35 + 0.2;
    }
  }

  clear() {
    for (const m of this.arenaMeshes) this.scene.remove(m);
    this.arenaMeshes = [];
    this.windFlags = [];
  }
}
