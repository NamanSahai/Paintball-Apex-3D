import * as THREE from 'three';

export class TextureGenerator {
  // 1. High-Detail Concrete / Warehouse Floor with Dirt & Expansion Seams
  static createConcreteTexture(colorBase = '#2b3340', isFloor = true) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base concrete tone
    ctx.fillStyle = colorBase;
    ctx.fillRect(0, 0, 512, 512);

    // Multi-frequency noise / speckle
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 32;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    // Concrete Slab Expansion Grid Joints
    ctx.strokeStyle = 'rgba(15, 20, 28, 0.65)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 504);
    ctx.beginPath();
    ctx.moveTo(256, 0); ctx.lineTo(256, 512);
    ctx.moveTo(0, 256); ctx.lineTo(512, 256);
    ctx.stroke();

    // Subtle surface blemishes & cracks
    ctx.strokeStyle = 'rgba(10, 15, 22, 0.4)';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 5; c++) {
      ctx.beginPath();
      let sx = Math.random() * 512;
      let sy = Math.random() * 512;
      ctx.moveTo(sx, sy);
      for (let s = 0; s < 4; s++) {
        sx += (Math.random() - 0.5) * 45;
        sy += (Math.random() - 0.5) * 45;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 2. Weathered Timber Wood Planks with Grain, Knots & Iron Nails
  static createWoodPlankTexture(baseWoodColor = '#5c4033') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base wood background
    ctx.fillStyle = baseWoodColor;
    ctx.fillRect(0, 0, 512, 512);

    const plankCount = 6;
    const plankHeight = 512 / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const y = p * plankHeight;
      // Slight plank shade variation
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.12})`;
      ctx.fillRect(0, y, 512, plankHeight);

      // Wood Grain Fibers
      for (let g = 0; g < 30; g++) {
        const gy = y + Math.random() * plankHeight;
        ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(40, 25, 15, 0.25)' : 'rgba(110, 80, 55, 0.2)';
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(170, gy + (Math.random() - 0.5) * 8, 340, gy + (Math.random() - 0.5) * 8, 512, gy);
        ctx.stroke();
      }

      // Plank Seams
      ctx.strokeStyle = '#1a1008';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      // Iron Nails / Bolts on ends
      ctx.fillStyle = '#1c1b18';
      ctx.beginPath(); ctx.arc(24, y + plankHeight * 0.5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(488, y + plankHeight * 0.5, 4, 0, Math.PI * 2); ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 3. Thick Regulation Speedball Turf with Fiber Strands
  static createSportsTurfTexture(tod = 'day') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const baseGreen = tod === 'night' ? '#0d2416' : (tod === 'sunset' ? '#183818' : '#144d22');
    ctx.fillStyle = baseGreen;
    ctx.fillRect(0, 0, 512, 512);

    // Alternating 2-yard mower stripes
    for (let s = 0; s < 512; s += 64) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, s, 512, 32);
    }

    // Grass blade speckle
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 28;
      data[i] = Math.min(255, Math.max(0, data[i] + n * 0.3));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.4));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 4. Desert Canyon Sand & Rock Strata
  static createCanyonSandTexture(tod = 'day') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const baseSand = tod === 'sunset' ? '#8a3c22' : (tod === 'night' ? '#222834' : '#78563c');
    ctx.fillStyle = baseSand;
    ctx.fillRect(0, 0, 512, 512);

    // Geological sediment bands
    for (let b = 0; b < 32; b++) {
      const y = b * 16;
      ctx.fillStyle = b % 2 === 0 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 210, 160, 0.1)';
      ctx.fillRect(0, y, 512, 16);
    }

    // Fine gravel, pebble noise and sand ripple texture
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 32;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n * 0.85));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.6));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 4B. High-Definition Unreal Engine Style Canyon Cliff Rock Face Texture
  static createCanyonCliffTexture(tod = 'day') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const baseRock = tod === 'sunset' ? '#6e2b18' : (tod === 'night' ? '#18202c' : '#5c3d28');
    ctx.fillStyle = baseRock;
    ctx.fillRect(0, 0, 1024, 1024);

    // Horizontal Terraced Strata Bands
    for (let i = 0; i < 48; i++) {
      const y = i * (1024 / 48);
      const h = 1024 / 48;
      const shade = (Math.sin(i * 0.8) * 0.5 + 0.5);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + shade * 0.25})`;
      ctx.fillRect(0, y, 1024, h);

      ctx.fillStyle = `rgba(255, 200, 140, ${0.05 + (1 - shade) * 0.12})`;
      ctx.fillRect(0, y + h * 0.5, 1024, h * 0.5);
    }

    // Vertical Fissures & Deep Weathering Cracks
    for (let f = 0; f < 35; f++) {
      let x = Math.random() * 1024;
      let y = 0;
      ctx.strokeStyle = 'rgba(15, 10, 6, 0.75)';
      ctx.lineWidth = 2 + Math.random() * 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      while (y < 1024) {
        y += 20 + Math.random() * 40;
        x += (Math.random() - 0.5) * 25;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Granular micro-surface noise
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 24;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n * 0.9));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.7));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 5. Realistic Inflatable Tournament Air Bunker Vinyl with Heat-Welded Seams
  static createBunkerVinylTexture(baseColorHex, labelText = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#' + new THREE.Color(baseColorHex).getHexString();
    ctx.fillRect(0, 0, 512, 512);

    // Subtle glossy highlight gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Welded PVC Seam lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 492);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(13, 13, 486, 486);

    // Tournament Brand Stencil
    if (labelText) {
      ctx.font = 'bold 36px "Orbitron", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, 256, 266);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 6. Realistic Burlap Military Sandbag Texture
  static createSandbagBurlapTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base khaki burlap color
    ctx.fillStyle = '#8c7653';
    ctx.fillRect(0, 0, 512, 512);

    // Cross-weave cloth fibers
    ctx.strokeStyle = 'rgba(70, 55, 35, 0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 512; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512);
      ctx.moveTo(0, i); ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Dirt and moisture grime speckles
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 35;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n * 0.9));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.6));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 7. Industrial Hazard / Caution Stripe Texture
  static createCautionStripeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f59e0b'; // High-vis yellow-orange
    ctx.fillRect(0, 0, 512, 512);

    // Diagonal Black Hazard Stripes
    ctx.fillStyle = '#111827';
    const stripeWidth = 64;
    for (let x = -512; x < 1024; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + 512, 512);
      ctx.lineTo(x + 512, 512);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 8. Cyberpunk 2077 / Blade Runner Cityscape Skyline Texture
  static createCyberSkylineTexture(tod = 'night') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Gradient Sky Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    if (tod === 'sunset') {
      bgGrad.addColorStop(0, '#3b0764');
      bgGrad.addColorStop(0.6, '#9333ea');
      bgGrad.addColorStop(1, '#f97316');
    } else if (tod === 'day') {
      bgGrad.addColorStop(0, '#0284c7');
      bgGrad.addColorStop(0.6, '#38bdf8');
      bgGrad.addColorStop(1, '#bae6fd');
    } else {
      bgGrad.addColorStop(0, '#030712');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#1e1b4b');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Multi-Layer Skyscraper Silhouettes
    const colors = tod === 'night' 
      ? ['#090d16', '#0f172a', '#1e293b'] 
      : (tod === 'sunset' ? ['#2e1065', '#4c1d95', '#581c87'] : ['#0f172a', '#1e293b', '#334155']);

    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = colors[layer];
      const yBase = 160 + layer * 70;
      let x = 0;
      while (x < 1024) {
        const bWidth = 35 + Math.random() * 65;
        const bHeight = 120 + Math.random() * (300 - layer * 50);
        ctx.fillRect(x, 512 - bHeight, bWidth, bHeight);

        // Lit Windows
        if (tod !== 'day' || layer > 1) {
          const winColor = Math.random() > 0.4 ? '#00f0ff' : (Math.random() > 0.5 ? '#ff007f' : '#facc15');
          ctx.fillStyle = winColor;
          for (let wy = 512 - bHeight + 15; wy < 500; wy += 14) {
            for (let wx = x + 6; wx < x + bWidth - 6; wx += 10) {
              if (Math.random() > 0.6) {
                ctx.fillRect(wx, wy, 4, 6);
              }
            }
          }
          ctx.fillStyle = colors[layer];
        }

        // Roof Antennas & Glowing Beacons
        if (Math.random() > 0.5) {
          ctx.fillRect(x + bWidth * 0.5 - 1, 512 - bHeight - 25, 2, 25);
          ctx.fillStyle = '#ff0033';
          ctx.beginPath();
          ctx.arc(x + bWidth * 0.5, 512 - bHeight - 25, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = colors[layer];
        }

        x += bWidth + (Math.random() * 8 - 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
  }

  // 9. NXL Tournament Stadium Bleachers & Spectator Grandstand Texture
  static createStadiumGrandstandTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 256);

    // Tiered Bleachers
    for (let r = 0; r < 8; r++) {
      const y = r * 32;
      ctx.fillStyle = r % 2 === 0 ? '#1e293b' : '#334155';
      ctx.fillRect(0, y, 1024, 32);

      // Spectator Crowd Dots
      for (let x = 8; x < 1024; x += 14) {
        const shirtColors = ['#00f0ff', '#ff0055', '#39ff14', '#e2e8f0', '#f59e0b', '#3b82f6'];
        ctx.fillStyle = shirtColors[Math.floor(Math.random() * shirtColors.length)];
        ctx.beginPath();
        ctx.arc(x + (Math.random() - 0.5) * 4, y + 16, 5, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(x + (Math.random() - 0.5) * 4, y + 8, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(3, 1);
    return texture;
  }

  // 10. Heavy Corrugated Shipping Freight Container Texture (PBR Metal)
  static createShippingContainerTexture(colorHex = '#1e3a8a', label = 'APX-CARGO') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base paint coat
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 512, 512);

    // Corrugated vertical steel ribs
    const ribCount = 16;
    const ribWidth = 512 / ribCount;
    for (let r = 0; r < ribCount; r++) {
      const x = r * ribWidth;
      // Highlight side
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(x, 0, ribWidth * 0.35, 512);
      // Shadow valley
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(x + ribWidth * 0.5, 0, ribWidth * 0.5, 512);
    }

    // Steel frame borders
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 500, 500);

    // Weathered edge rust and grime
    ctx.fillStyle = 'rgba(92, 53, 20, 0.35)';
    ctx.fillRect(0, 480, 512, 32);
    ctx.fillRect(0, 0, 512, 16);

    // Stenciled Freight Code
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px "Rajdhani", sans-serif';
    ctx.fillText(label, 32, 120);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('MAX GROSS 32,500 KG', 32, 160);
    ctx.fillText('PAYLOAD   28,600 KG', 32, 190);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
}
