import * as THREE from 'three';
import { EngineRenderer } from './engine/Renderer.js';
import { PlayerCamera } from './engine/Camera.js';
import { InputManager } from './engine/Input.js';
import { sound } from './engine/AudioEngine.js';
import { MarkerManager } from './gameplay/Marker.js';
import { BallisticsEngine } from './gameplay/Ballistics.js';
import { PaintDecalManager } from './gameplay/PaintDecals.js';
import { TargetManager } from './gameplay/Targets.js';
import { ObstacleManager } from './gameplay/Obstacles.js';
import { SpeedballArenaLevel } from './levels/SpeedballArena.js';
import { KillhouseLevel } from './levels/Killhouse.js';
import { SniperRangeLevel } from './levels/SniperRange.js';
import { ShipyardDocksLevel } from './levels/ShipyardDocks.js';
import { SandboxRangeLevel } from './levels/SandboxRange.js';
import { NetworkManager } from './network/NetworkManager.js';
import { VisorOverlay } from './ui/VisorOverlay.js';
import { HUDManager } from './ui/HUD.js';
import { MenuManager } from './ui/Menu.js';

class PaintballApexGame {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.visorCanvas = document.getElementById('visor-canvas');

    // Core Three.js Scene with Atmospheric Haze
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a101d, 0.012);

    // Systems
    this.renderer = new EngineRenderer(this.canvas);
    this.playerCam = new PlayerCamera(this.canvas);
    this.scene.add(this.playerCam.camera); // Essential for camera children (weapon viewmodel & hands) to render!
    this.input = new InputManager(this.canvas);
    window.__gameInput = this.input; // Global reference for sensitivity

    this.renderer.setupPostProcessing(this.scene, this.playerCam.camera);

    this.markerMgr = new MarkerManager(this.playerCam.camera);
    this.ballistics = new BallisticsEngine(this.scene);
    this.decals = new PaintDecalManager(this.scene);
    this.targets = new TargetManager(this.scene);
    this.obstacles = new ObstacleManager(this.scene);
    this.visorOverlay = new VisorOverlay(this.visorCanvas);
    this.hud = new HUDManager();

    // Multiplayer System
    this.networkMgr = new NetworkManager(this.scene);
    this.isMultiplayer = false;
    this.localHealth = 100;
    this.isEliminated = false;
    this.respawnTimer = 0.0;

    // Game Progression & Stats State
    this.gameState = {
      isPlaying: false,
      isPaused: false,
      stageId: 'speedball',
      timeOfDay: 'day', // 'day', 'sunset', 'night'
      currentLevel: null,
      elapsedTime: 0.0,
      score: 0,
      targetsHit: 0,
      totalTargets: 25,
      shotsFired: 0,
      shotsHit: 0,
      bullseyes: 0,
      penalties: 0,
      combo: 1,
      maxCombo: 1,
      comboTimer: 0.0
    };

    // Level Factories
    const shipyard = new ShipyardDocksLevel(this.scene, this.obstacles, this.targets);
    this.levels = {
      speedball: new SpeedballArenaLevel(this.scene, this.obstacles, this.targets),
      killhouse: new KillhouseLevel(this.scene, this.obstacles, this.targets),
      sniper: new SniperRangeLevel(this.scene, this.obstacles, this.targets),
      shipyard: shipyard,
      arcade: shipyard, // Fallback alias
      sandbox: new SandboxRangeLevel(this.scene, this.obstacles, this.targets)
    };

    // Menu Manager
    this.menu = new MenuManager(
      this.renderer,
      this.markerMgr,
      this.playerCam,
      this.visorOverlay,
      (stageId) => this.startGame(stageId),
      (stageId) => this.loadStage(stageId),
      (tod) => this.setTimeOfDay(tod),
      (vsync) => this.setVsync(vsync),
      (fpsLimit) => this.setFpsLimit(fpsLimit)
    );

    this.menu.setNetworkManager(this.networkMgr, (mapId, config) => {
      this.startMultiplayerGame(mapId, config);
    });

    // Clock
    this.clock = new THREE.Clock();

    // Audio Stinger Timing
    this.lastBpsSoundTime = 0.0;

    // Real-Time FPS & Performance Monitor
    this.frameCount = 0;
    this.lastFpsUpdate = 0.0;
    this.currentFps = 60.0;

    // V-Sync & Framerate Control
    this.vsync = false; // Off by default for maximum unlocked FPS!
    this.fpsLimit = 'uncapped';
    this.lastFrameTime = performance.now();
    this.rafId = null;
    this.timeoutId = null;

    this.initEvents();
    this.loadStage('speedball');

    // Bind Animate Loop
    this.animate = this.animate.bind(this);
    this.scheduleNextFrame();
  }

  setVsync(enabled) {
    this.vsync = enabled;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.scheduleNextFrame();
  }

  setFpsLimit(limit) {
    this.fpsLimit = limit;
    if (limit === '75') {
      this.vsync = true;
    } else {
      this.vsync = false;
    }
    const vsyncCheck = document.getElementById('setting-vsync');
    if (vsyncCheck) vsyncCheck.checked = this.vsync;

    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.scheduleNextFrame();
  }

  scheduleNextFrame() {
    if (this.vsync) {
      this.rafId = requestAnimationFrame(this.animate);
    } else if (this.fpsLimit === 'uncapped') {
      this.timeoutId = setTimeout(this.animate, 0);
    } else {
      const targetFps = parseInt(this.fpsLimit) || 144;
      const targetInterval = 1000 / targetFps;
      const now = performance.now();
      const elapsed = now - this.lastFrameTime;
      const delay = Math.max(0, targetInterval - elapsed);
      this.timeoutId = setTimeout(this.animate, delay);
    }
  }

  initEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.playerCam.camera.aspect = w / h;
      this.playerCam.camera.updateProjectionMatrix();
      this.renderer.resize(w, h);
    });

    // Input Lock Callbacks
    this.input.onLockChange = (isLocked) => {
      if (!isLocked && this.gameState.isPlaying && this.gameState.isPaused) {
        this.menu.showMenu();
      } else if (isLocked && this.gameState.isPlaying) {
        this.gameState.isPaused = false;
        this.menu.hideMenu();
        sound.resume();
      }
    };

    // Canvas click resumes lock
    this.canvas.addEventListener('click', () => {
      if (this.gameState.isPlaying && !this.gameState.isPaused) {
        sound.resume();
        if (!this.input.isLocked) {
          this.input.requestLock();
        }
      }
    });

    // Input Hotkeys
    this.input.onReloadPress = () => this.markerMgr.reload();

    this.input.onColorChangePress = () => {
      const color = this.markerMgr.cyclePaintColor();
      this.hud.updatePaintSwatches(this.markerMgr.colorIndex);
      this.menu.showToast(`PAINT COLOR: ${color.name.toUpperCase()}`);
    };

    this.input.onWeaponSlotPress = (slotIdx) => {
      const weaponKeys = ['electro', 'tactical', 'shotgun', 'plasma'];
      const wId = weaponKeys[slotIdx];
      if (wId) {
        this.markerMgr.buildWeapon(wId);
        this.menu.showToast(`MARKER: ${this.markerMgr.currentWeaponData.name}`);
      }
    };

    this.input.onTimeOfDayPress = () => {
      const tods = ['day', 'sunset', 'night'];
      const nextTod = tods[(tods.indexOf(this.gameState.timeOfDay) + 1) % tods.length];
      this.setTimeOfDay(nextTod);
    };

    this.input.onPausePress = () => {
      if (this.gameState.isPlaying) {
        this.gameState.isPaused = !this.gameState.isPaused;
        if (this.gameState.isPaused) {
          this.input.exitLock();
          this.menu.showMenu();
        } else {
          this.menu.hideMenu();
          this.input.requestLock();
        }
      }
    };

    // Initialize HUD Paint Color Swatches
    this.hud.initPaintSwatches(this.markerMgr.paintColors, this.markerMgr.colorIndex, (idx) => {
      this.markerMgr.setPaintColor(idx);
      this.hud.updatePaintSwatches(idx);
    });

    // Initialize HUD Time of Day Buttons
    this.hud.initTimeOfDay(this.gameState.timeOfDay, (tod) => {
      this.setTimeOfDay(tod);
    });

    // Multiplayer Network Callbacks
    this.initNetworkEvents();

    // Keybindings for Tab Scoreboard and Chat
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab' && this.isMultiplayer) {
        e.preventDefault();
        this.hud.updateScoreboard(
          this.networkMgr.lobbyPlayers,
          this.gameState.stageId,
          this.networkMgr.lobbyConfig.mode,
          this.networkMgr.localPlayerId
        );
        this.hud.toggleScoreboard(true);
      }
      if (e.code === 'Enter' && this.isMultiplayer) {
        this.hud.toggleChatInput(true, (msg) => {
          this.networkMgr.sendChat(msg);
        });
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Tab' && this.isMultiplayer) {
        e.preventDefault();
        this.hud.toggleScoreboard(false);
      }
    });

    // Ballistics Hit Handler
    this.ballistics.onHitCallback = (hitData) => {
      // 1. Spawn 3D Paint Splatter Decal
      this.decals.spawnSplatter(hitData.point, hitData.normal, hitData.colorHex, hitData.isPlasma, hitData.object);

      // 2. Check if impact is close to player camera for Visor Splatter
      const distToPlayer = hitData.point.distanceTo(this.playerCam.camera.position);
      if (distToPlayer < 4.5 && Math.random() > 0.4) {
        const colCss = this.markerMgr.paintColors[this.markerMgr.colorIndex].css;
        this.visorOverlay.addSplatter(colCss);
      }

      // 3. Remote Multiplayer Player Hit Resolution (PvP)
      if (hitData.object && hitData.object.userData && hitData.object.userData.remotePlayer) {
        const rp = hitData.object.userData.remotePlayer;
        const isHeadshot = !!hitData.object.userData.isHeadshot;
        const dmg = isHeadshot ? 50 : 25;

        this.gameState.shotsHit++;
        sound.playHitMarker(isHeadshot);
        this.hud.showHitMarker(isHeadshot, false, this.gameState.combo);

        const wasKilled = rp.applyDamage(dmg, isHeadshot);
        this.networkMgr.sendPlayerHit(rp.id, dmg, isHeadshot);

        if (wasKilled) {
          this.networkMgr.sendPlayerEliminated(rp.id, rp.name, this.markerMgr.currentWeaponData.name);
          this.gameState.score += 500;
          this.hud.spawnFloatingScore('+500 ELIMINATED ENEMY!', 'bullseye');
          sound.playStinger('victory');
        } else {
          this.hud.spawnFloatingScore(`+${dmg} PVP HIT`, isHeadshot ? 'bullseye' : 'normal');
        }
      }

      // 4. Target Hit Resolution
      if (hitData.isTarget) {
        this.gameState.shotsHit++;
        const res = this.targets.handleHit(hitData);

        if (res && res.penalty) {
          this.gameState.penalties++;
          this.gameState.score = Math.max(0, this.gameState.score - 200);
          this.gameState.combo = 1;
          this.hud.showHitMarker(false, true, 1);
          this.hud.spawnFloatingScore('-200 PENALTY', 'penalty');
          this.renderer.triggerAberrationKick(1.5);
        } else if (res) {
          const isBullseye = res.isBullseye;
          if (isBullseye) this.gameState.bullseyes++;

          // Combo Calculation
          this.gameState.combo++;
          this.gameState.comboTimer = 3.0; // 3 sec combo window
          this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);

          const basePoints = isBullseye ? 250 : 100;
          const totalPoints = basePoints * this.gameState.combo;
          this.gameState.score += totalPoints;
          this.gameState.targetsHit++;

          this.hud.showHitMarker(isBullseye, false, this.gameState.combo);
          this.hud.spawnFloatingScore(`+${totalPoints} ${isBullseye ? 'BULLSEYE!' : 'HIT'}`, isBullseye ? 'bullseye' : 'normal');

          this.renderer.triggerAberrationKick(isBullseye ? 0.8 : 0.4);

          // Check Stage Victory Condition (Single Player)
          if (!this.isMultiplayer && this.gameState.targetsHit >= this.gameState.totalTargets && this.gameState.totalTargets < 999) {
            this.handleStageVictory();
          }
        }
      }
    };
  }

  initNetworkEvents() {
    this.networkMgr.onRemoteFire = (data) => {
      const origin = new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z);
      const vel = new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z);
      this.ballistics.spawnProjectiles([{
        origin,
        velocity: vel,
        colorHex: data.colorHex,
        isPlasma: data.weaponType === 'plasma',
        damage: 35
      }]);
      sound.playMarkerFire(data.weaponType, 0.7);
    };

    this.networkMgr.onKillfeed = (data) => {
      this.hud.addKillfeed(data.killerName, data.victimName, data.weaponType);
    };

    this.networkMgr.onChatMessage = (data) => {
      this.hud.addChatMessage(data.sender, data.text);
    };

    this.networkMgr.onPlayerHitLocal = (data) => {
      if (this.isEliminated) return;
      this.localHealth = Math.max(0, this.localHealth - data.damage);
      this.renderer.triggerAberrationKick(1.2);
      sound.playMarkerHit(this.playerCam.camera.position, '#ff0055');
      this.visorOverlay.addSplatter('#ff0055');

      if (this.localHealth <= 0) {
        this.handleLocalElimination(data.shooterName, data.weaponType);
      }
    };
  }

  handleLocalElimination(killerName, weaponType) {
    this.isEliminated = true;
    this.respawnTimer = 3.0;
    this.hud.showRespawnScreen(killerName, 3);
    sound.playStinger('defeat');

    const countdownInterval = setInterval(() => {
      this.respawnTimer -= 1;
      const countText = document.getElementById('respawn-countdown');
      if (countText) countText.textContent = Math.ceil(this.respawnTimer);

      if (this.respawnTimer <= 0) {
        clearInterval(countdownInterval);
        this.localHealth = 100;
        this.isEliminated = false;
        this.hud.hideRespawnScreen();
        // Respawn player
        if (this.gameState.currentLevel) {
          this.playerCam.position.copy(this.gameState.currentLevel.spawnPos);
        }
      }
    }, 1000);
  }

  startMultiplayerGame(mapId, config) {
    this.isMultiplayer = true;
    this.localHealth = 100;
    this.isEliminated = false;
    this.startGame(mapId);
  }

  setTimeOfDay(tod) {
    this.gameState.timeOfDay = tod;
    if (this.gameState.currentLevel) {
      this.targets.clear();
      this.obstacles.clear();
      this.gameState.currentLevel.setTimeOfDay?.(tod);
      this.gameState.currentLevel.build();
      this.playerCam.setColliders(this.obstacles.colliders);
    }
    this.hud.updateTimeOfDay(tod);
    this.menu.updateTimeOfDay(tod);

    const labels = {
      day: '☀️ LIGHTING: DAYLIGHT',
      sunset: '🌅 LIGHTING: GOLDEN SUNSET',
      night: '🌙 LIGHTING: CYBER NEON NIGHT'
    };
    this.menu.showToast(labels[tod] || '☀️ LIGHTING CHANGED');
  }

  loadStage(stageId) {
    this.gameState.stageId = stageId;

    // Clear Previous Scene Objects
    this.ballistics.clear();
    this.decals.clear();
    this.targets.clear();
    this.obstacles.clear();
    this.visorOverlay.clear();

    if (this.gameState.currentLevel) {
      this.gameState.currentLevel.clear();
    }

    const level = this.levels[stageId] || this.levels.speedball;
    this.gameState.currentLevel = level;
    level.setTimeOfDay?.(this.gameState.timeOfDay);
    level.build();

    // Set Wind & Player Spawn
    this.ballistics.setWind(level.wind || new THREE.Vector3(0, 0, 0));
    this.playerCam.position.copy(level.spawnPos);
    this.playerCam.yaw = level.spawnYaw || 0.0;
    this.playerCam.pitch = 0.0;
    this.playerCam.setColliders(this.obstacles.colliders);

    this.gameState.totalTargets = level.targetCount;
    this.hud.setStageInfo(level.name, level.targetCount, level.wind);
  }

  startGame(stageId) {
    sound.init();
    sound.resume();
    sound.startMusic();
    sound.playStinger('start');

    this.loadStage(stageId);

    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.gameState.elapsedTime = 0.0;
    this.gameState.score = 0;
    this.gameState.targetsHit = 0;
    this.gameState.shotsFired = 0;
    this.gameState.shotsHit = 0;
    this.gameState.bullseyes = 0;
    this.gameState.penalties = 0;
    this.gameState.combo = 1;
    this.gameState.maxCombo = 1;
    this.gameState.comboTimer = 0.0;

    this.menu.hideMenu();
    this.input.requestLock();
  }

  handleStageVictory() {
    this.gameState.isPlaying = false;
    this.input.exitLock();

    // Time Bonus
    const parTime = this.gameState.currentLevel.parTime;
    const timeDiff = Math.max(0, parTime - this.gameState.elapsedTime);
    const timeBonus = Math.floor(timeDiff * 150);
    this.gameState.score += timeBonus;

    const acc = this.gameState.shotsFired > 0 ? (this.gameState.shotsHit / this.gameState.shotsFired) * 100 : 100;

    // Save Best to LocalStorage
    const key = `paintball_best_${this.gameState.stageId}`;
    const prevBest = parseInt(localStorage.getItem(key) || '0');
    if (this.gameState.score > prevBest) {
      localStorage.setItem(key, this.gameState.score.toString());
      const bestEl = document.getElementById(`best-${this.gameState.stageId}`);
      if (bestEl) bestEl.textContent = this.gameState.score.toLocaleString();
    }

    this.menu.showVictoryModal({
      score: this.gameState.score,
      elapsedTime: this.gameState.elapsedTime,
      accuracy: acc,
      bullseyes: this.gameState.bullseyes,
      maxCombo: this.gameState.maxCombo,
      penalties: this.gameState.penalties
    });
  }

  animate() {
    this.scheduleNextFrame();
    this.lastFrameTime = performance.now();

    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.1); // Clamp delta to avoid physics tunneling
    const time = this.clock.getElapsedTime();

    if (this.gameState.isPlaying && !this.gameState.isPaused) {
      this.gameState.elapsedTime += delta;

      // Combo Timer Countdown
      if (this.gameState.combo > 1) {
        this.gameState.comboTimer -= delta;
        if (this.gameState.comboTimer <= 0) {
          this.gameState.combo = 1;
        }
      }

      // 1. Update Player Movement & Camera
      if (!this.isEliminated) {
        this.playerCam.update(this.input, delta);
      }

      // 2. Try Firing Weapon
      if (!this.isEliminated) {
        const projectiles = this.markerMgr.tryFire(this.input, this.playerCam, time);
        if (projectiles.length > 0) {
          this.gameState.shotsFired += projectiles.length;
          this.ballistics.spawnProjectiles(projectiles);
          this.hud.updateCrosshair(this.playerCam.isADS, true);

          // Broadcast projectile to multiplayer peers
          if (this.isMultiplayer) {
            for (const p of projectiles) {
              this.networkMgr.sendFireProjectile(
                p.origin,
                p.velocity,
                p.colorHex,
                this.markerMgr.currentWeaponData.id
              );
            }
          }
        } else {
          this.hud.updateCrosshair(this.playerCam.isADS, false);
        }
      }

      // 3. Update Viewmodel & Weapon
      this.markerMgr.update(this.input, this.playerCam, delta, time);

      // 4. Update Ballistics (Target Meshes + Remote Player Hitboxes) & Decals
      const remoteHitboxes = this.isMultiplayer ? this.networkMgr.getRemoteHitboxes() : [];
      const collidableTargets = [...this.targets.targetMeshes, ...remoteHitboxes];
      this.ballistics.update(delta, collidableTargets, this.obstacles.obstacleMeshes);
      this.decals.update(delta);

      // 5. Update Targets & Obstacles
      this.targets.update(delta, time);
      if (this.gameState.currentLevel && this.gameState.currentLevel.update) {
        this.gameState.currentLevel.update(delta, time);
      }

      // 6. Update Multiplayer Remote Players & Broadcast State
      if (this.isMultiplayer) {
        this.networkMgr.update(delta);
        this.networkMgr.sendPlayerState(
          this.playerCam.camera.position,
          this.playerCam.yaw,
          this.playerCam.pitch,
          this.playerCam.getStance(),
          this.localHealth
        );
      }

      // 7. Update Visor Screen Splatters
      this.visorOverlay.update(delta);

      // 8. Update HUD Telemetry
      this.hud.updateTelemetry(this.gameState, this.playerCam, this.markerMgr);
    } else {
      // Menu Camera Slow Cinematic Pan
      this.playerCam.yaw += delta * 0.1;
      this.playerCam.camera.rotation.set(0, this.playerCam.yaw, 0);
    }

    // 8. Render Post-Processing Scene
    this.renderer.render(this.scene, this.playerCam.camera, delta, time);

    // 9. Real-Time FPS & Performance Telemetry
    this.frameCount++;
    if (time - this.lastFpsUpdate >= 0.25) {
      this.currentFps = this.frameCount / (time - this.lastFpsUpdate);
      this.frameCount = 0;
      this.lastFpsUpdate = time;
      this.hud.updateFps(this.currentFps, rawDelta * 1000.0);
    }
  }
}

// Boot Game
window.addEventListener('DOMContentLoaded', () => {
  new PaintballApexGame();
});
