import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class SpeedballArenaLevel {
  constructor(scene, obstacles, targets) {
    this.scene = scene;
    this.obstacles = obstacles;
    this.targets = targets;

    this.id = 'speedball';
    this.name = '1. SPEEDBALL PRO ARENA';
    this.tag = 'TOURNAMENT NXL';
    this.parTime = 50.0;
    this.spawnPos = new THREE.Vector3(0, 0, 18);
    this.spawnYaw = 0.0;
    this.targetCount = 25;
    this.wind = new THREE.Vector3(0, 0, 0);

    this.timeOfDay = 'day'; // 'day', 'sunset', 'night'
    this.arenaMeshes = [];
    this.lights = [];
  }

  setTimeOfDay(tod) {
    this.timeOfDay = tod;
  }

  build() {
    this.clear();

    const tod = this.timeOfDay || 'day';

    // 1. Dynamic Lighting & Sky based on Time-of-Day
    let ambientColor, ambientIntensity, sunColor, sunIntensity, sunPos, skyColor, fogColor;

    if (tod === 'sunset') {
      ambientColor = 0xff8855;
      ambientIntensity = 0.75;
      sunColor = 0xff6622;
      sunIntensity = 2.4;
      sunPos = new THREE.Vector3(35, 18, -40);
      skyColor = 0xdd5533;
      fogColor = 0x772211;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.005);
    } else if (tod === 'night') {
      ambientColor = 0x112244;
      ambientIntensity = 0.55;
      sunColor = 0x3366cc;
      sunIntensity = 0.9;
      sunPos = new THREE.Vector3(10, 30, 10);
      skyColor = 0x050914;
      fogColor = 0x060c18;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.01);
    } else {
      // Day (Vibrant High Noon Sunny Stadium)
      ambientColor = 0xffffff;
      ambientIntensity = 1.15;
      sunColor = 0xfffaee;
      sunIntensity = 2.5;
      sunPos = new THREE.Vector3(25, 45, 20);
      skyColor = 0x4299e1;
      fogColor = 0x88c0ee;
      this.scene.fog = new THREE.FogExp2(fogColor, 0.003);
    }

    const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    this.scene.add(ambient);
    this.arenaMeshes.push(ambient);

    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.copy(sunPos);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 130;
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);
    this.arenaMeshes.push(sun);

    // 4 High-Intensity Stadium Floodlight Towers
    const floodlightColors = tod === 'night' 
      ? [0x00f0ff, 0xff0077, 0x39ff14, 0xffe600] 
      : [0xffffff, 0xffeedd, 0xffffff, 0xffeedd];

    const towerPositions = [
      [-22, 14, -28],
      [22, 14, -28],
      [-22, 14, 22],
      [22, 14, 22]
    ];

    towerPositions.forEach((pos, idx) => {
      const pLight = new THREE.PointLight(floodlightColors[idx], tod === 'night' ? 2.2 : 1.2, 45);
      pLight.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(pLight);
      this.arenaMeshes.push(pLight);

      // Floodlight Tower Rig
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 14, 8), new THREE.MeshStandardMaterial({ color: 0x1a2130, metalness: 0.9 }));
      pole.position.set(pos[0], 7, pos[2]);
      this.scene.add(pole);
      this.arenaMeshes.push(pole);

      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.6), new THREE.MeshStandardMaterial({
        color: floodlightColors[idx],
        emissive: floodlightColors[idx],
        emissiveIntensity: tod === 'night' ? 2.0 : 0.8
      }));
      lampHead.position.set(pos[0], 14, pos[2]);
      this.scene.add(lampHead);
      this.arenaMeshes.push(lampHead);
    });

    // 2. High-Realism Professional Tournament Sports Turf Floor
    const turfTex = TextureGenerator.createSportsTurfTexture(tod);
    turfTex.repeat.set(4, 6);

    const floorMat = new THREE.MeshStandardMaterial({
      map: turfTex,
      roughness: 0.75,
      metalness: 0.05
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(48, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.arenaMeshes.push(floor);
    this.obstacles.obstacleMeshes.push(floor);

    // Outer Expansive Stadium Grounds (No cutoff edges)
    const outerGrassMat = new THREE.MeshStandardMaterial({
      color: tod === 'night' ? 0x0a1c12 : (tod === 'sunset' ? 0x142e18 : 0x184220),
      roughness: 0.9,
      metalness: 0.05
    });
    const outerGround = new THREE.Mesh(new THREE.PlaneGeometry(140, 160), outerGrassMat);
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.set(0, -0.05, 0);
    outerGround.receiveShadow = true;
    this.scene.add(outerGround);
    this.arenaMeshes.push(outerGround);

    // 3. Colorful Stadium Perimeter Boards & Mesh Netting
    const sponsorColors = ['#00f0ff', '#ff0055', '#39ff14', '#ffe600', '#b800ff'];
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d');
    bCtx.fillStyle = '#0a101d';
    bCtx.fillRect(0, 0, 1024, 128);

    const sponsors = ['APEX PRO PAINTBALL', 'ECLIPSE FORCE', 'VALKEN TOURNAMENT', 'PLANET SPEED', 'DYE MATRIX', 'NXL CHAMPIONSHIP'];
    sponsors.forEach((s, idx) => {
      bCtx.fillStyle = sponsorColors[idx % sponsorColors.length];
      bCtx.font = 'bold 26px "Orbitron", sans-serif';
      bCtx.fillText(s, 20 + idx * 170, 75);
    });

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    bannerTex.wrapS = THREE.RepeatWrapping;
    bannerTex.repeat.set(4, 1);

    const boardMat = new THREE.MeshStandardMaterial({
      map: bannerTex,
      roughness: 0.3,
      metalness: 0.5,
      emissive: tod === 'night' ? 0x223355 : 0x000000,
      emissiveIntensity: 0.4
    });

    // Perimeter Boards
    const backBoard = new THREE.Mesh(new THREE.BoxGeometry(48, 2.0, 0.4), boardMat);
    backBoard.position.set(0, 1.0, -32);
    this.scene.add(backBoard);
    this.arenaMeshes.push(backBoard);

    const leftBoard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.0, 64), boardMat);
    leftBoard.position.set(-24, 1.0, 0);
    leftBoard.scene?.add(leftBoard);
    this.scene.add(leftBoard);
    this.arenaMeshes.push(leftBoard);

    const rightBoard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.0, 64), boardMat);
    rightBoard.position.set(24, 1.0, 0);
    this.scene.add(rightBoard);
    this.arenaMeshes.push(rightBoard);

    // High Stadium Mesh Netting Walls
    const netMat = new THREE.MeshStandardMaterial({
      color: 0x080e18,
      roughness: 0.9,
      transparent: true,
      opacity: 0.65
    });

    const backNet = new THREE.Mesh(new THREE.BoxGeometry(48, 12, 0.2), netMat);
    backNet.position.set(0, 7.0, -32);
    this.scene.add(backNet);
    this.arenaMeshes.push(backNet);

    const leftNet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 12, 64), netMat);
    leftNet.position.set(-24, 7.0, 0);
    this.scene.add(leftNet);
    this.arenaMeshes.push(leftNet);

    const rightNet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 12, 64), netMat);
    rightNet.position.set(24, 7.0, 0);
    this.scene.add(rightNet);
    this.arenaMeshes.push(rightNet);

    // 4. Spectator Grandstand Bleachers Surrounding Field
    const grandstandTex = TextureGenerator.createStadiumGrandstandTexture();
    const grandstandMat = new THREE.MeshStandardMaterial({
      map: grandstandTex,
      roughness: 0.8,
      metalness: 0.2
    });

    // Left Grandstand
    const leftBleachers = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 64), grandstandMat);
    leftBleachers.position.set(-32, 4, 0);
    this.scene.add(leftBleachers);
    this.arenaMeshes.push(leftBleachers);

    // Right Grandstand
    const rightBleachers = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 64), grandstandMat);
    rightBleachers.position.set(32, 4, 0);
    this.scene.add(rightBleachers);
    this.arenaMeshes.push(rightBleachers);

    // Back Grandstand
    const backBleachers = new THREE.Mesh(new THREE.BoxGeometry(48, 8, 12), grandstandMat);
    backBleachers.position.set(0, 4, -40);
    this.scene.add(backBleachers);
    this.arenaMeshes.push(backBleachers);

    // 5. Four Giant Steel Stadium Floodlight Truss Towers
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0 });
    const corners = [[-26, 32], [26, 32], [-26, -32], [26, -32]];

    for (const [cx, cz] of corners) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.65, 16, 8), towerMat);
      tower.position.set(cx, 8, cz);
      this.scene.add(tower);
      this.arenaMeshes.push(tower);

      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 0.8), lampMat);
      lampHead.position.set(cx, 16, cz);
      lampHead.lookAt(0, 0, 0);
      this.scene.add(lampHead);
      this.arenaMeshes.push(lampHead);

      if (tod === 'night' || tod === 'sunset') {
        const spot = new THREE.SpotLight(0xfffaee, 2.5, 50, Math.PI / 4, 0.4);
        spot.position.set(cx, 16, cz);
        spot.target.position.set(0, 0, 0);
        this.scene.add(spot);
        this.scene.add(spot.target);
        this.arenaMeshes.push(spot, spot.target);
      }
    }

    // Sky Dome
    const skyMat = new THREE.MeshBasicMaterial({
      color: skyColor,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16), skyMat);
    this.scene.add(sky);
    this.arenaMeshes.push(sky);

    // 4. Inflatable Bunkers with High-Contrast Color Schemes & Regulation Layout
    // Center Giant NXL "W" Bunker Centerpiece (The 50)
    this.obstacles.createGiantCenterW(new THREE.Vector3(0, 0, -5), 3.6, 2.4, 'blue');

    // Flanking Tall Standup Cakes
    this.obstacles.createTallCake(new THREE.Vector3(-4, 0, 0), 2.5, 0.55, 'orange');
    this.obstacles.createTallCake(new THREE.Vector3(4, 0, 0), 2.5, 0.55, 'blue');
    this.obstacles.createTallCake(new THREE.Vector3(-5, 0, -18), 2.6, 0.58, 'blue');
    this.obstacles.createTallCake(new THREE.Vector3(5, 0, -18), 2.6, 0.58, 'orange');

    // Snake Side (Left Corridor with vivid Cyan & Yellow crawl bunkers)
    this.obstacles.createSnakeBeam(new THREE.Vector3(-13, 0, 3), 7.5, 0);
    this.obstacles.createSnakeBeam(new THREE.Vector3(-13, 0, -9), 7.5, 0);
    this.obstacles.createDorito(new THREE.Vector3(-13, 0, -20), 2.8, 2.2, Math.PI / 4, 'orange');
    this.obstacles.createDorito(new THREE.Vector3(-8, 0, -10), 2.4, 1.9, Math.PI / 6, 'yellow');

    // Dorito Side (Right Corridor with vibrant Blue & Orange pyramids)
    this.obstacles.createDorito(new THREE.Vector3(13, 0, 8), 2.5, 2.0, -Math.PI / 4, 'blue');
    this.obstacles.createDorito(new THREE.Vector3(13, 0, -4), 2.7, 2.2, -Math.PI / 4, 'blue');
    this.obstacles.createDorito(new THREE.Vector3(13, 0, -16), 2.9, 2.4, -Math.PI / 4, 'orange');
    this.obstacles.createDorito(new THREE.Vector3(8, 0, -10), 2.4, 1.9, -Math.PI / 6, 'yellow');

    // Midfield Tactical Cylinders & Can Bunkers
    this.obstacles.createCan(new THREE.Vector3(-5, 0, 8), 2.1, 0.65, 'orange');
    this.obstacles.createCan(new THREE.Vector3(5, 0, 8), 2.1, 0.65, 'blue');
    this.obstacles.createCan(new THREE.Vector3(-8, 0, 1), 2.2, 0.68, 'yellow');
    this.obstacles.createCan(new THREE.Vector3(8, 0, 1), 2.2, 0.68, 'orange');
    this.obstacles.createCan(new THREE.Vector3(-6, 0, -15), 2.3, 0.7, 'yellow');
    this.obstacles.createCan(new THREE.Vector3(6, 0, -15), 2.3, 0.7, 'orange');
    this.obstacles.createBarrelStack(new THREE.Vector3(0, 0, 10));

    // Staging Perimeter Sandbag Revetments & Gear Staging Pallet Tables
    this.obstacles.createSandbagBunker(new THREE.Vector3(-17, 0, 16), 3.8, 0.1);
    this.obstacles.createSandbagBunker(new THREE.Vector3(17, 0, 16), 3.8, -0.1);
    this.obstacles.createPalletStack(new THREE.Vector3(-8, 0, 14), 3, 0.15);
    this.obstacles.createPalletStack(new THREE.Vector3(8, 0, 14), 3, -0.15);

    // 5. Target Placements (25 Targets with High-Visibility Colors)
    // Close Range Poppers (behind starting cover)
    this.targets.createSteelPopper(new THREE.Vector3(-5, 0, 5), 0);
    this.targets.createSteelPopper(new THREE.Vector3(5, 0, 5), 0);
    this.targets.createSteelPopper(new THREE.Vector3(-2, 0, 3), 0);
    this.targets.createSteelPopper(new THREE.Vector3(2, 0, 3), 0);

    // Mid Range Poppers
    this.targets.createSteelPopper(new THREE.Vector3(-9, 0, -2), 0.3);
    this.targets.createSteelPopper(new THREE.Vector3(9, 0, -2), -0.3);
    this.targets.createSteelPopper(new THREE.Vector3(-2, 0, -6), 0);
    this.targets.createSteelPopper(new THREE.Vector3(2, 0, -6), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 1.25, -5), 0); // Elevated on temple

    // Far Range Poppers & Moving Tracks
    this.targets.createSteelPopper(new THREE.Vector3(-14, 0, -15), 0.5);
    this.targets.createSteelPopper(new THREE.Vector3(14, 0, -15), -0.5);
    this.targets.createSteelPopper(new THREE.Vector3(-8, 0, -22), 0);
    this.targets.createSteelPopper(new THREE.Vector3(8, 0, -22), 0);
    this.targets.createSteelPopper(new THREE.Vector3(0, 0, -25), 0);

    // Dynamic Moving Track Targets Across the Back Netting
    this.targets.createMovingTarget(new THREE.Vector3(-10, 0, -28), new THREE.Vector3(10, 0, -28), 3.2);
    this.targets.createMovingTarget(new THREE.Vector3(-16, 1.2, -18), new THREE.Vector3(-16, 1.2, -8), 2.8);
    this.targets.createMovingTarget(new THREE.Vector3(16, 1.2, -18), new THREE.Vector3(16, 1.2, -8), 2.8);

    // High-Vis Explosive Paint Cans
    this.targets.createExplosiveCan(new THREE.Vector3(-6, 2.3, -15), 0xffe600);
    this.targets.createExplosiveCan(new THREE.Vector3(6, 2.3, -15), 0x00f0ff);
    this.targets.createExplosiveCan(new THREE.Vector3(0, 2.7, -5), 0xff0055);

    // Elevated Back Targets
    this.targets.createSteelPopper(new THREE.Vector3(-4, 2.5, -28), 0);
    this.targets.createSteelPopper(new THREE.Vector3(4, 2.5, -28), 0);
    this.targets.createSteelPopper(new THREE.Vector3(-18, 0, 0), Math.PI / 2);
    this.targets.createSteelPopper(new THREE.Vector3(18, 0, 0), -Math.PI / 2);
    this.targets.createSteelPopper(new THREE.Vector3(0, 0, -18), 0);
  }

  clear() {
    for (const m of this.arenaMeshes) {
      this.scene.remove(m);
    }
    this.arenaMeshes = [];
  }
}
