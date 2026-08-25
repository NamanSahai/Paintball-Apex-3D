import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.obstacleMeshes = []; // For bullet raycasts
    this.colliders = [];      // For player movement bounding boxes

    // High Gloss Vinyl Inflatable Materials
    this.vinylBlue = new THREE.MeshStandardMaterial({
      color: 0x0066cc,
      metalness: 0.15,
      roughness: 0.12,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    });

    this.vinylOrange = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.15,
      roughness: 0.12,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    });

    this.vinylYellow = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.15,
      roughness: 0.12,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    });

    this.vinylBlack = new THREE.MeshStandardMaterial({
      color: 0x111620,
      metalness: 0.2,
      roughness: 0.2,
      clearcoat: 0.6
    });

    // Realistic Weathered Timber Wood Plank Material
    const woodTex = TextureGenerator.createWoodPlankTexture('#63452f');
    woodTex.repeat.set(2, 2);

    this.woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.85,
      metalness: 0.05
    });

    this.metalBarrelMat = new THREE.MeshStandardMaterial({
      color: 0x3d4856,
      roughness: 0.35,
      metalness: 0.8
    });

    const sandbagTex = TextureGenerator.createSandbagBurlapTexture();
    sandbagTex.repeat.set(2, 2);
    this.sandbagMat = new THREE.MeshStandardMaterial({
      map: sandbagTex,
      roughness: 0.92,
      metalness: 0.02
    });

    const concreteTex = TextureGenerator.createConcreteTexture('#475569', false);
    concreteTex.repeat.set(2, 1);
    this.concreteMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.85,
      metalness: 0.1
    });

    const cautionTex = TextureGenerator.createCautionStripeTexture();
    cautionTex.repeat.set(4, 1);
    this.cautionMat = new THREE.MeshStandardMaterial({
      map: cautionTex,
      roughness: 0.4,
      metalness: 0.3
    });

    const rockTex = TextureGenerator.createCanyonSandTexture('day');
    rockTex.repeat.set(3, 3);
    this.rockMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      roughness: 0.95,
      metalness: 0.05
    });

    this.cyberMetalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.9
    });

    this.laserMat = new THREE.MeshBasicMaterial({
      color: 0xff0033,
      transparent: true,
      opacity: 0.85
    });
  }

  // 1. Inflatable Dorito Bunker (Triangular Pyramid / Prism)
  createDorito(position, height = 2.4, width = 1.8, rotationY = 0, color = 'blue') {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    const mat = color === 'orange' ? this.vinylOrange : this.vinylBlue;

    // Triangular Prism Geometry (Cylinder with 3 radial segments)
    const doritoGeo = new THREE.CylinderGeometry(0.1, width * 0.7, height, 3);
    const mesh = new THREE.Mesh(doritoGeo, mat);
    mesh.position.y = height * 0.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Seam Welds / Trim
    const seam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, width * 0.72, 0.08, 3), this.vinylBlack);
    seam.position.y = height * 0.25;
    group.add(seam);

    this.scene.add(group);
    this.obstacles.push(group);
    this.obstacleMeshes.push(mesh);

    // Collider Box
    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 2. Inflatable Cylinder / Can Bunker
  createCan(position, height = 2.0, radius = 0.6, color = 'orange') {
    const group = new THREE.Group();
    group.position.copy(position);

    const mat = color === 'blue' ? this.vinylBlue : (color === 'yellow' ? this.vinylYellow : this.vinylOrange);

    const canGeo = new THREE.CylinderGeometry(radius, radius, height, 20);
    const mesh = new THREE.Mesh(canGeo, mat);
    mesh.position.y = height * 0.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Top and Bottom Reinforcement Rings
    const ringGeo = new THREE.TorusGeometry(radius, 0.04, 8, 20);
    const topRing = new THREE.Mesh(ringGeo, this.vinylBlack);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = height - 0.05;
    group.add(topRing);

    const botRing = new THREE.Mesh(ringGeo, this.vinylBlack);
    botRing.rotation.x = Math.PI / 2;
    botRing.position.y = 0.05;
    group.add(botRing);

    this.scene.add(group);
    this.obstacles.push(group);
    this.obstacleMeshes.push(mesh);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 3. Snake Inflatable Crawl Beam (Low Long Bunker)
  createSnakeBeam(position, length = 6.0, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    // Horizontal inflatable tube (0.7m high)
    const tubeGeo = new THREE.CylinderGeometry(0.38, 0.38, length, 16);
    const mesh = new THREE.Mesh(tubeGeo, this.vinylBlue);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.y = 0.38;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Snake Knuckle / Elbow High Cover Peak
    const knuckleGeo = new THREE.CylinderGeometry(0.2, 0.55, 1.2, 16);
    const knuckle = new THREE.Mesh(knuckleGeo, this.vinylYellow);
    knuckle.position.set(0, 0.6, 0);
    knuckle.castShadow = true;
    group.add(knuckle);

    this.scene.add(group);
    this.obstacles.push(group);
    this.obstacleMeshes.push(mesh, knuckle);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 4. Temple / Giant Maya Bunker (Stepped Pyramid Centerpiece)
  createTemple(position, size = 3.0, height = 2.4) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Bottom Tier
    const bGeo = new THREE.BoxGeometry(size, height * 0.5, size);
    const bMesh = new THREE.Mesh(bGeo, this.vinylBlack);
    bMesh.position.y = height * 0.25;
    bMesh.castShadow = true;
    group.add(bMesh);

    // Top Tier
    const tGeo = new THREE.BoxGeometry(size * 0.65, height * 0.5, size * 0.65);
    const tMesh = new THREE.Mesh(tGeo, this.vinylOrange);
    tMesh.position.y = height * 0.75;
    tMesh.castShadow = true;
    group.add(tMesh);

    this.scene.add(group);
    this.obstacles.push(group);
    this.obstacleMeshes.push(bMesh, tMesh);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 5. Wooden CQB Barricade Wall
  createWoodBarricade(position, width = 3.0, height = 2.2, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    // Planks
    const planks = 6;
    const plankH = height / planks;
    for (let i = 0; i < planks; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(width, plankH * 0.92, 0.08), this.woodMat);
      plank.position.set(0, (i + 0.5) * plankH, 0);
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);
      this.obstacleMeshes.push(plank);
    }

    // Support Posts
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, 0.12), this.woodMat);
    postL.position.set(-width * 0.45, height * 0.5, 0);
    group.add(postL);

    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, 0.12), this.woodMat);
    postR.position.set(width * 0.45, height * 0.5, 0);
    group.add(postR);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 6. Metal Barrels Cluster
  createBarrelStack(position) {
    const group = new THREE.Group();
    group.position.copy(position);

    const positions = [
      [-0.35, 0, -0.3],
      [0.35, 0, -0.3],
      [0, 0, 0.35],
      [0, 0.95, 0] // Top barrel
    ];

    const barrelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.95, 16);

    for (const [x, y, z] of positions) {
      const b = new THREE.Mesh(barrelGeo, this.metalBarrelMat);
      b.position.set(x, y + 0.475, z);
      b.castShadow = true;
      b.receiveShadow = true;
      group.add(b);
      this.obstacleMeshes.push(b);
    }

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 7. Swinging Hazard Pendulum
  createSwingingPendulum(position, length = 4.0, width = 1.0) {
    const group = new THREE.Group();
    group.position.copy(position);

    const pivot = new THREE.Group();
    pivot.position.set(0, length, 0);
    group.add(pivot);

    // Rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, length, 8), this.metalBarrelMat);
    rod.position.set(0, -length * 0.5, 0);
    pivot.add(rod);

    // Heavy Block / Blade
    const block = new THREE.Mesh(new THREE.BoxGeometry(width, 1.2, 0.4), this.vinylOrange);
    block.position.set(0, -length, 0);
    block.castShadow = true;
    pivot.add(block);

    this.scene.add(group);
    this.obstacles.push(group);
    this.obstacleMeshes.push(block);

    const pendulumObj = {
      type: 'pendulum',
      group: group,
      pivot: pivot,
      block: block,
      time: Math.random() * 10
    };

    return pendulumObj;
  }

  // 8. Laser Grid Tripwire
  createLaserTripwire(startPos, endPos) {
    const group = new THREE.Group();
    const dist = startPos.distanceTo(endPos);

    const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, dist, 8);
    const beam = new THREE.Mesh(beamGeo, this.laserMat);
    beam.position.copy(startPos).lerp(endPos, 0.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endPos.clone().sub(startPos).normalize());

    group.add(beam);
    this.scene.add(group);
    this.obstacles.push(group);

    return {
      type: 'laser',
      beam: beam,
      timer: 0.0
    };
  }

  // 9. Staggered Military Sandbag Bunker Wall
  createSandbagBunker(position, length = 3.2, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    const bagGeo = new THREE.BoxGeometry(0.65, 0.22, 0.35);
    const rows = 4;
    const bagsPerRow = Math.floor(length / 0.6);

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2 === 0) ? 0 : 0.3;
      const count = bagsPerRow - (r % 2);
      for (let i = 0; i < count; i++) {
        const bag = new THREE.Mesh(bagGeo, this.sandbagMat);
        const x = -length * 0.5 + 0.35 + i * 0.62 + offsetX;
        const y = 0.11 + r * 0.21;
        bag.position.set(x, y, (Math.random() - 0.5) * 0.04);
        bag.rotation.y = (Math.random() - 0.5) * 0.1;
        bag.castShadow = true;
        bag.receiveShadow = true;
        group.add(bag);
        this.obstacleMeshes.push(bag);
      }
    }

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 10. Concrete Jersey Safety Barrier with Caution Stripes
  createConcreteJerseyBarrier(position, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    // Heavy concrete barrier body with angled flare base
    const baseGeo = new THREE.BoxGeometry(2.8, 0.45, 0.75);
    const base = new THREE.Mesh(baseGeo, this.concreteMat);
    base.position.y = 0.225;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    this.obstacleMeshes.push(base);

    const stemGeo = new THREE.BoxGeometry(2.8, 0.65, 0.35);
    const stem = new THREE.Mesh(stemGeo, this.concreteMat);
    stem.position.y = 0.775;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);
    this.obstacleMeshes.push(stem);

    // Diagonal Yellow/Black Caution Stripe Band
    const cautionBand = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.22, 0.37), this.cautionMat);
    cautionBand.position.y = 0.85;
    group.add(cautionBand);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 11. Stack of Heavy Duty Wooden Shipping Pallets
  createPalletStack(position, count = 4, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    for (let p = 0; p < count; p++) {
      const pallet = new THREE.Group();
      pallet.position.y = p * 0.16;

      // Top Deck Slats
      for (let s = 0; s < 5; s++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.025, 0.16), this.woodMat);
        slat.position.set(0, 0.14, -0.48 + s * 0.24);
        slat.castShadow = true;
        pallet.add(slat);
        this.obstacleMeshes.push(slat);
      }

      // 3 Runner Blocks
      for (let b = 0; b < 3; b++) {
        const runner = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.10, 0.12), this.woodMat);
        runner.position.set(0, 0.06, -0.45 + b * 0.45);
        runner.castShadow = true;
        pallet.add(runner);
      }

      group.add(pallet);
    }

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 12. Tactical CQB Doorway Breach Frame
  createTacticalDoorway(position, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    const frameMat = this.woodMat;

    // Left Post
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.22), frameMat);
    leftPost.position.set(-0.75, 1.2, 0);
    leftPost.castShadow = true;
    group.add(leftPost);
    this.obstacleMeshes.push(leftPost);

    // Right Post
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.22), frameMat);
    rightPost.position.set(0.75, 1.2, 0);
    rightPost.castShadow = true;
    group.add(rightPost);
    this.obstacleMeshes.push(rightPost);

    // Top Header Beam
    const header = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.22), frameMat);
    header.position.set(0, 2.3, 0);
    header.castShadow = true;
    group.add(header);
    this.obstacleMeshes.push(header);

    // Hazard Caution Threshold
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.3), this.cautionMat);
    threshold.position.set(0, 0.02, 0);
    group.add(threshold);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 13. Weathered Desert Canyon Boulder / Rock Formation (Deeply Ground-Anchored)
  createCanyonBoulder(position, scale = 1.8, rotationY = 0) {
    const group = new THREE.Group();
    group.position.set(position.x, 0, position.z);
    group.rotation.y = rotationY;

    // Multi-faceted craggy rock geometry
    const rockGeo = new THREE.DodecahedronGeometry(scale, 1);
    const posAttr = rockGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const noise = (Math.sin(vx * 2.5) * Math.cos(vy * 2.5) * Math.sin(vz * 2.5)) * (scale * 0.25);
      posAttr.setXYZ(i, vx + noise, vy + noise * 0.7, vz + noise);
    }
    rockGeo.computeVertexNormals();

    const rock = new THREE.Mesh(rockGeo, this.rockMat);
    // Anchor lower 30% of rock directly into the ground terrain
    rock.position.y = scale * 0.45;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
    this.obstacleMeshes.push(rock);

    // Dirt contact shadow skirt at base
    const dirtSkirtGeo = new THREE.RingGeometry(0.1, scale * 1.1, 16);
    const dirtSkirtMat = new THREE.MeshBasicMaterial({
      color: 0x24140b,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const skirt = new THREE.Mesh(dirtSkirtGeo, dirtSkirtMat);
    skirt.rotation.x = -Math.PI / 2;
    skirt.position.y = 0.01;
    group.add(skirt);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 14. Heavy Wooden Sniper Bench with Front Sandbag Rest
  createSniperShootingBench(position, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    // Heavy Tabletop
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.1), this.woodMat);
    tableTop.position.set(0, 0.9, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);
    this.obstacleMeshes.push(tableTop);

    // 4 Heavy Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.9, 0.12);
    const legCoords = [[-0.65, -0.42], [0.65, -0.42], [-0.65, 0.42], [0.65, 0.42]];
    for (const [lx, lz] of legCoords) {
      const leg = new THREE.Mesh(legGeo, this.woodMat);
      leg.position.set(lx, 0.45, lz);
      leg.castShadow = true;
      group.add(leg);
    }

    // Rifle Sandbag Rest on Tabletop
    const rifleRest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.28), this.sandbagMat);
    rifleRest.position.set(0, 1.02, -0.32);
    rifleRest.castShadow = true;
    group.add(rifleRest);
    this.obstacleMeshes.push(rifleRest);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 15. NXL Regulation Giant Center "W" Bunker
  createGiantCenterW(position, width = 3.6, height = 2.4, color = 'blue') {
    const group = new THREE.Group();
    group.position.copy(position);

    const mat = color === 'orange' ? this.vinylOrange : this.vinylBlue;

    // Center tall tower spine
    const spine = new THREE.Mesh(new THREE.BoxGeometry(1.2, height, 1.2), mat);
    spine.position.y = height * 0.5;
    spine.castShadow = true;
    group.add(spine);
    this.obstacleMeshes.push(spine);

    // Angled Wing Left
    const wingL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.8, height * 0.85, 3), mat);
    wingL.position.set(-1.3, height * 0.425, 0.4);
    wingL.rotation.y = 0.5;
    wingL.castShadow = true;
    group.add(wingL);
    this.obstacleMeshes.push(wingL);

    // Angled Wing Right
    const wingR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.8, height * 0.85, 3), mat);
    wingR.position.set(1.3, height * 0.425, 0.4);
    wingR.rotation.y = -0.5;
    wingR.castShadow = true;
    group.add(wingR);
    this.obstacleMeshes.push(wingR);

    // Yellow Accent Seams
    const seam = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.1, 1.26), this.vinylYellow);
    seam.position.y = height * 0.7;
    group.add(seam);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 16. Tall Inflatable Cake / Standup Pillar Bunker
  createTallCake(position, height = 2.5, radius = 0.55, color = 'orange') {
    const group = new THREE.Group();
    group.position.copy(position);

    const mat = color === 'blue' ? this.vinylBlue : this.vinylOrange;

    const cakeGeo = new THREE.CylinderGeometry(radius * 0.9, radius, height, 20);
    const mesh = new THREE.Mesh(cakeGeo, mat);
    mesh.position.y = height * 0.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    this.obstacleMeshes.push(mesh);

    // Mid-section welded reinforcement collar
    const collar = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.95, 0.04, 8, 20), this.vinylBlack);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = height * 0.5;
    group.add(collar);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 17. Sci-Fi Cyber Hexagon Energy Pillar with Pulsing Conduit
  createCyberHexPillar(position, height = 4.2, colorHex = 0x00f0ff) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Hexagonal Outer Armor Column
    const hexGeo = new THREE.CylinderGeometry(0.45, 0.55, height, 6);
    const mesh = new THREE.Mesh(hexGeo, this.cyberMetalMat);
    mesh.position.y = height * 0.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    this.obstacleMeshes.push(mesh);

    // Glowing Neon Vertical Core Slots
    const coreMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 1.2
    });

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, height * 0.8, 8), coreMat);
    core.position.y = height * 0.5;
    group.add(core);

    const pLight = new THREE.PointLight(colorHex, 1.2, 8);
    pLight.position.y = height * 0.5;
    group.add(pLight);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 18. Holographic Combat Barrier
  createHoloBarrier(position, width = 3.5, height = 2.2, rotationY = 0, colorHex = 0x00f0ff) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    // Left and right magnetic emitter posts
    const postGeo = new THREE.BoxGeometry(0.2, height, 0.2);
    const postL = new THREE.Mesh(postGeo, this.cyberMetalMat);
    postL.position.set(-width * 0.5, height * 0.5, 0);
    group.add(postL);
    this.obstacleMeshes.push(postL);

    const postR = new THREE.Mesh(postGeo, this.cyberMetalMat);
    postR.position.set(width * 0.5, height * 0.5, 0);
    group.add(postR);
    this.obstacleMeshes.push(postR);

    // Translucent Glowing Forcefield Panel
    const holoMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.8
    });

    const panel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.95, height * 0.9, 0.04), holoMat);
    panel.position.set(0, height * 0.5, 0);
    group.add(panel);
    this.obstacleMeshes.push(panel);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 19. Heavy Freight Shipping Container (40ft / 20ft Cargo Box)
  createShippingContainer(position, length = 6.0, rotationY = 0, colorHex = '#1e3a8a', label = 'APX-CARGO') {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    const width = 2.4;
    const height = 2.6;

    const tex = TextureGenerator.createShippingContainerTexture(colorHex, label);
    tex.repeat.set(length > 4 ? 2 : 1, 1);

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.65,
      metalness: 0.4
    });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), mat);
    mesh.position.set(0, height * 0.5, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    this.obstacleMeshes.push(mesh);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 20. Tactical Armored Combat Vehicle / Humvee Cover Wreck
  createTacticalHumvee(position, rotationY = 0, colorHex = 0x47553b) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.7, metalness: 0.3 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.8 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.85, metalness: 0.05 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });

    // Main Chassis Body Box
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 4.2), bodyMat);
    body.position.set(0, 0.75, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    this.obstacleMeshes.push(body);

    // Armored Cabin Top
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.65, 2.2), bodyMat);
    cabin.position.set(0, 1.45, -0.2);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);
    this.obstacleMeshes.push(cabin);

    // Sloped Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 0.1), glassMat);
    windshield.position.set(0, 1.4, 0.92);
    windshield.rotation.x = -0.35;
    group.add(windshield);

    // Front Heavy Steel Bull-Bar Grille
    const bullBar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 0.2), darkMetalMat);
    bullBar.position.set(0, 0.75, 2.15);
    group.add(bullBar);
    this.obstacleMeshes.push(bullBar);

    // 4 Heavy Knobby Off-Road Tires
    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16);
    const tirePositions = [
      [-1.05, 0.42, 1.3],
      [1.05, 0.42, 1.3],
      [-1.05, 0.42, -1.3],
      [1.05, 0.42, -1.3]
    ];

    for (const [tx, ty, tz] of tirePositions) {
      const tire = new THREE.Mesh(tireGeo, rubberMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(tx, ty, tz);
      tire.castShadow = true;
      tire.receiveShadow = true;
      group.add(tire);
      this.obstacleMeshes.push(tire);
    }

    // Roof Turret Ring & Sandbag Rest
    const turretRing = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 16), darkMetalMat);
    turretRing.position.set(0, 1.88, -0.2);
    group.add(turretRing);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 21. Heavy Industrial Wooden Cable Spool / Wire Reel
  createHeavyCableSpool(position, diameter = 1.8, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    const radius = diameter * 0.5;
    const width = 1.2;

    // Wooden Outer Flanges
    const flangeGeo = new THREE.CylinderGeometry(radius, radius, 0.08, 20);
    const flangeL = new THREE.Mesh(flangeGeo, this.woodMat);
    flangeL.rotation.z = Math.PI / 2;
    flangeL.position.set(-width * 0.5, radius, 0);
    flangeL.castShadow = true;
    flangeL.receiveShadow = true;
    group.add(flangeL);
    this.obstacleMeshes.push(flangeL);

    const flangeR = new THREE.Mesh(flangeGeo, this.woodMat);
    flangeR.rotation.z = Math.PI / 2;
    flangeR.position.set(width * 0.5, radius, 0);
    flangeR.castShadow = true;
    flangeR.receiveShadow = true;
    group.add(flangeR);
    this.obstacleMeshes.push(flangeR);

    // Wound Cable Core
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x785338, roughness: 0.5, metalness: 0.65 });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width * 0.92, 16), wireMat);
    core.rotation.z = Math.PI / 2;
    core.position.set(0, radius, 0);
    core.castShadow = true;
    core.receiveShadow = true;
    group.add(core);
    this.obstacleMeshes.push(core);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 22. Stacked Heavy Excavator / Tractor Tires
  createExcavatorTireStack(position, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9, metalness: 0.05 });
    const tireGeo = new THREE.TorusGeometry(0.65, 0.28, 12, 20);

    // Stack of 3 heavy tires
    for (let i = 0; i < 3; i++) {
      const tire = new THREE.Mesh(tireGeo, rubberMat);
      tire.rotation.x = Math.PI / 2;
      tire.position.set((Math.random() - 0.5) * 0.08, 0.28 + i * 0.52, (Math.random() - 0.5) * 0.08);
      tire.castShadow = true;
      tire.receiveShadow = true;
      group.add(tire);
      this.obstacleMeshes.push(tire);
    }

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 23. Welded Steel Czech Hedgehog (Anti-Tank Dragon Trap)
  createCzechHedgehog(position, size = 1.6, rotationY = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.85 });
    const beamGeo = new THREE.BoxGeometry(0.14, size, 0.14);

    // 3 Intersecting diagonal beams
    const b1 = new THREE.Mesh(beamGeo, steelMat);
    b1.position.y = size * 0.45;
    b1.rotation.x = 0.65;
    group.add(b1);

    const b2 = new THREE.Mesh(beamGeo, steelMat);
    b2.position.y = size * 0.45;
    b2.rotation.x = -0.65;
    b2.rotation.z = 0.65;
    group.add(b2);

    const b3 = new THREE.Mesh(beamGeo, steelMat);
    b3.position.y = size * 0.45;
    b3.rotation.z = -0.65;
    b3.rotation.y = 0.65;
    group.add(b3);

    b1.castShadow = true; b1.receiveShadow = true;
    b2.castShadow = true; b2.receiveShadow = true;
    b3.castShadow = true; b3.receiveShadow = true;
    this.obstacleMeshes.push(b1, b2, b3);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  // 24. Pressurized Chemical / Fuel Storage Silo Tank
  createChemicalStorageTank(position, height = 4.2, diameter = 2.2, colorHex = '#e2e8f0') {
    const group = new THREE.Group();
    group.position.copy(position);

    const radius = diameter * 0.5;
    const tankMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.8 });

    // Main Cylinder
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20), tankMat);
    cylinder.position.y = height * 0.5;
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    group.add(cylinder);
    this.obstacleMeshes.push(cylinder);

    // Domed Top
    const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), tankMat);
    dome.position.y = height;
    dome.castShadow = true;
    group.add(dome);
    this.obstacleMeshes.push(dome);

    // Safety Ladder on side
    const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.4, height * 0.95, 0.08), darkMat);
    ladder.position.set(0, height * 0.5, radius + 0.04);
    group.add(ladder);

    // Hazard Placard Sign
    const placardMat = new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 0.4 });
    const diamond = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), placardMat);
    diamond.rotation.z = 0.785;
    diamond.position.set(0, height * 0.7, radius + 0.02);
    group.add(diamond);

    this.scene.add(group);
    this.obstacles.push(group);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push({ box, group });
    return group;
  }

  clear() {
    for (const obs of this.obstacles) {
      this.scene.remove(obs);
    }
    this.obstacles = [];
    this.obstacleMeshes = [];
    this.colliders = [];
  }
}
