import confetti from 'canvas-confetti';
import { sound } from '../engine/AudioEngine.js';

export class MenuManager {
  constructor(engineRenderer, markerMgr, playerCam, visorOverlay, onStartGame, onStageSelect, onTimeOfDaySelect, onVsyncChange, onFpsLimitChange) {
    this.engineRenderer = engineRenderer;
    this.markerMgr = markerMgr;
    this.playerCam = playerCam;
    this.visorOverlay = visorOverlay;
    this.onStartGame = onStartGame;
    this.onStageSelect = onStageSelect;
    this.onTimeOfDaySelect = onTimeOfDaySelect;
    this.onVsyncChange = onVsyncChange;
    this.onFpsLimitChange = onFpsLimitChange;

    this.menuOverlay = document.getElementById('menu-overlay');
    this.victoryModal = document.getElementById('victory-modal');
    this.toastBanner = document.getElementById('toast-banner');

    this.selectedStageId = 'speedball';
    this.selectedTod = 'day';

    this.initTabs();
    this.initStageCards();
    this.initTimeOfDay();
    this.initArmory();
    this.initSettings();
    this.initVictoryButtons();
    this.initMultiplayer();
  }

  showMenu() {
    this.menuOverlay.classList.remove('hidden');
    sound.stopMusic();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  hideMenu() {
    this.menuOverlay.classList.add('hidden');
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }

  showToast(message) {
    this.toastBanner.textContent = message;
    this.toastBanner.classList.remove('hidden');
    setTimeout(() => {
      this.toastBanner.classList.add('hidden');
    }, 2500);
  }

  initTabs() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.menu-tab-pane');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        const pane = document.getElementById(targetTab);
        if (pane) pane.classList.add('active');
        btn.blur();
      });
    });

    const startBtn = document.getElementById('btn-start-game');
    startBtn.addEventListener('click', () => {
      startBtn.blur();
      this.onStartGame(this.selectedStageId);
    });
  }

  initStageCards() {
    const stageCards = document.querySelectorAll('.stage-card');
    stageCards.forEach(card => {
      card.addEventListener('click', () => {
        const stageId = card.getAttribute('data-stage');
        stageCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedStageId = stageId;
        this.onStageSelect(stageId);
      });
    });
  }

  initTimeOfDay() {
    const todButtons = document.querySelectorAll('.menu-tod-btn');
    todButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        todButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tod = btn.getAttribute('data-tod');
        this.selectedTod = tod;
        this.onTimeOfDaySelect?.(tod);
      });
    });
  }

  updateTimeOfDay(tod) {
    this.selectedTod = tod;
    const todButtons = document.querySelectorAll('.menu-tod-btn');
    todButtons.forEach(btn => {
      if (btn.getAttribute('data-tod') === tod) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  initArmory() {
    // Weapon Cards
    const weaponCards = document.querySelectorAll('.weapon-card');
    const statRof = document.getElementById('stat-rof');
    const statVel = document.getElementById('stat-vel');
    const statAcc = document.getElementById('stat-acc');
    const statCap = document.getElementById('stat-cap');

    const statsMap = {
      electro: { rof: '90%', vel: '80%', acc: '80%', cap: '85%' },
      tactical: { rof: '35%', vel: '95%', acc: '98%', cap: '40%' },
      shotgun: { rof: '25%', vel: '65%', acc: '45%', cap: '30%' },
      plasma: { rof: '85%', vel: '100%', acc: '90%', cap: '75%' }
    };

    weaponCards.forEach(card => {
      card.addEventListener('click', () => {
        weaponCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const weaponId = card.getAttribute('data-weapon');
        this.markerMgr.buildWeapon(weaponId);

        const stats = statsMap[weaponId] || statsMap.electro;
        statRof.style.width = stats.rof;
        statVel.style.width = stats.vel;
        statAcc.style.width = stats.acc;
        statCap.style.width = stats.cap;
      });
    });

    // Custom Paint Color Palette
    const paletteGrid = document.getElementById('menu-color-palette');
    paletteGrid.innerHTML = '';

    this.markerMgr.paintColors.forEach((col, idx) => {
      const btn = document.createElement('div');
      btn.className = `menu-color-btn ${idx === this.markerMgr.colorIndex ? 'active' : ''}`;
      btn.style.backgroundColor = col.css;
      btn.style.color = col.css;
      btn.title = col.name;

      btn.addEventListener('click', () => {
        paletteGrid.querySelectorAll('.menu-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.markerMgr.setPaintColor(idx);
      });

      paletteGrid.appendChild(btn);
    });
  }

  initSettings() {
    // Quality Presets
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = btn.getAttribute('data-preset');
        this.engineRenderer.setQualityPreset(preset);
      });
    });

    // Shaders & Toggles
    const bloomCheck = document.getElementById('setting-bloom');
    bloomCheck.addEventListener('change', (e) => {
      this.engineRenderer.setBloom(e.target.checked);
    });

    const chromaCheck = document.getElementById('setting-chroma');
    chromaCheck.addEventListener('change', (e) => {
      this.engineRenderer.settings.chromaEnabled = e.target.checked;
    });

    const visorSplatCheck = document.getElementById('setting-visor-splat');
    visorSplatCheck.addEventListener('change', (e) => {
      this.visorOverlay.enabled = e.target.checked;
    });

    const shadowsCheck = document.getElementById('setting-shadows');
    shadowsCheck.addEventListener('change', (e) => {
      this.engineRenderer.setShadows(e.target.checked);
    });

    // V-Sync & Framerate Limit Controls
    const vsyncCheck = document.getElementById('setting-vsync');
    if (vsyncCheck) {
      vsyncCheck.addEventListener('change', (e) => {
        this.onVsyncChange?.(e.target.checked);
        this.showToast(`V-SYNC: ${e.target.checked ? 'ENABLED (LOCKED TO DISPLAY)' : 'DISABLED (UNCAPPED)'}`);
      });
    }

    const fpsButtons = document.querySelectorAll('.fps-btn');
    fpsButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        fpsButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const limit = btn.getAttribute('data-fps');
        this.onFpsLimitChange?.(limit);
        this.showToast(`FRAMERATE TARGET: ${limit.toUpperCase()}`);
      });
    });

    // FOV & Sensitivity Sliders
    const fovSlider = document.getElementById('setting-fov');
    const fovVal = document.getElementById('val-fov');
    fovSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      fovVal.textContent = `${val}°`;
      this.playerCam.setBaseFov(val);
    });

    const sensSlider = document.getElementById('setting-sens');
    const sensVal = document.getElementById('val-sens');
    sensSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      sensVal.textContent = `${val.toFixed(1)}x`;
      window.__gameInput.sensitivity = val;
    });

    // Audio Sliders
    const volMaster = document.getElementById('setting-vol-master');
    const valVolMaster = document.getElementById('val-vol-master');
    const volSfx = document.getElementById('setting-vol-sfx');
    const valVolSfx = document.getElementById('val-vol-sfx');
    const volMusic = document.getElementById('setting-vol-music');
    const valVolMusic = document.getElementById('val-vol-music');

    const updateAudio = () => {
      const m = parseInt(volMaster.value) / 100;
      const s = parseInt(volSfx.value) / 100;
      const mu = parseInt(volMusic.value) / 100;
      valVolMaster.textContent = `${volMaster.value}%`;
      valVolSfx.textContent = `${volSfx.value}%`;
      valVolMusic.textContent = `${volMusic.value}%`;
      sound.setVolumes(m, s, mu);
    };

    volMaster.addEventListener('input', updateAudio);
    volSfx.addEventListener('input', updateAudio);
    volMusic.addEventListener('input', updateAudio);
  }

  showVictoryModal(stats) {
    this.victoryModal.classList.remove('hidden');
    sound.playStinger('victory');

    // Trigger Confetti Blast
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Rank Calculation
    let rank = 'A';
    let rankClass = 'rank-a';
    if (stats.score > 35000 && stats.accuracy > 90) {
      rank = 'S+';
      rankClass = 'rank-s';
    } else if (stats.score > 25000) {
      rank = 'S';
      rankClass = 'rank-s';
    } else if (stats.score > 15000) {
      rank = 'A';
      rankClass = 'rank-a';
    } else if (stats.score > 8000) {
      rank = 'B';
      rankClass = 'rank-b';
    } else {
      rank = 'C';
      rankClass = 'rank-c';
    }

    const badge = document.getElementById('victory-rank-badge');
    badge.textContent = rank;
    badge.className = `rank-badge ${rankClass}`;

    document.getElementById('v-score').textContent = stats.score.toLocaleString();
    const mins = Math.floor(stats.elapsedTime / 60).toString().padStart(2, '0');
    const secs = Math.floor(stats.elapsedTime % 60).toString().padStart(2, '0');
    const ms = Math.floor((stats.elapsedTime * 100) % 100).toString().padStart(2, '0');
    document.getElementById('v-time').textContent = `${mins}:${secs}.${ms}`;
    document.getElementById('v-accuracy').textContent = `${stats.accuracy.toFixed(1)}%`;
    document.getElementById('v-bullseyes').textContent = stats.bullseyes;
    document.getElementById('v-combo').textContent = `x${stats.maxCombo}`;
    document.getElementById('v-penalties').textContent = stats.penalties;
  }

  initVictoryButtons() {
    document.getElementById('btn-replay').addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.onStartGame(this.selectedStageId);
    });

    document.getElementById('btn-next-stage').addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      const stageOrder = ['speedball', 'killhouse', 'sniper', 'arcade', 'sandbox'];
      const currentIdx = stageOrder.indexOf(this.selectedStageId);
      const nextStage = stageOrder[(currentIdx + 1) % stageOrder.length];
      this.selectedStageId = nextStage;
      this.onStageSelect(nextStage);
      this.onStartGame(nextStage);
    });

    document.getElementById('btn-return-menu').addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.showMenu();
    });
  }

  setNetworkManager(networkMgr, onLaunchMultiplayer) {
    this.networkMgr = networkMgr;
    this.onLaunchMultiplayer = onLaunchMultiplayer;

    this.networkMgr.onRoomReady = (roomCode) => {
      this.showLobbyView(roomCode);
      this.showToast(`ROOM CREATED: ${roomCode}`);
    };

    this.networkMgr.onLobbyUpdate = (players, config) => {
      this.updateLobbyRoster(players, config);
    };

    this.networkMgr.onError = (err) => {
      this.showToast(`MULTIPLAYER: ${err}`);
      this.resetLobbyView();
    };

    this.networkMgr.onMatchStart = (config) => {
      this.hideMenu();
      this.onLaunchMultiplayer?.(config.mapId, config);
    };
  }

  initMultiplayer() {
    const btnCreate = document.getElementById('btn-create-room');
    const btnJoin = document.getElementById('btn-join-room');
    const btnCopy = document.getElementById('btn-copy-invite');
    const btnLeave = document.getElementById('btn-leave-lobby');
    const btnStartMatch = document.getElementById('btn-start-match');

    btnCreate?.addEventListener('click', () => {
      const name = document.getElementById('mp-host-name')?.value || 'ApexHost';
      const mapId = document.getElementById('mp-map-select')?.value || 'shipyard';
      const mode = document.getElementById('mp-mode-select')?.value || 'ffa';

      this.networkMgr?.createRoom(name, mapId, mode);
    });

    btnJoin?.addEventListener('click', () => {
      const name = document.getElementById('mp-join-name')?.value || 'Player';
      const code = document.getElementById('mp-room-code-input')?.value || '';

      if (!code.trim()) {
        this.showToast('PLEASE ENTER A 6-CHARACTER ROOM CODE');
        return;
      }

      this.networkMgr?.joinRoom(code, name);
      this.showLobbyView(code.toUpperCase());
    });

    btnCopy?.addEventListener('click', () => {
      const roomCode = document.getElementById('mp-display-room-code')?.textContent || '';
      const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('📋 INVITE LINK COPIED TO CLIPBOARD!');
      }).catch(() => {
        this.showToast(`ROOM CODE: ${roomCode}`);
      });
    });

    btnLeave?.addEventListener('click', () => {
      this.networkMgr?.leaveRoom();
      this.resetLobbyView();
    });

    btnStartMatch?.addEventListener('click', () => {
      if (this.networkMgr?.isHost) {
        this.networkMgr.startMatch();
      } else {
        this.showToast('WAITING FOR HOST TO LAUNCH MATCH...');
      }
    });

    // Check URL parameters for ?room=CODE
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      const codeField = document.getElementById('mp-room-code-input');
      if (codeField) codeField.value = roomParam;
      // Switch to multiplayer tab automatically
      const mpTabBtn = document.querySelector('.nav-btn[data-tab="tab-multiplayer"]');
      mpTabBtn?.click();
    }
  }

  showLobbyView(roomCode) {
    document.querySelector('.mp-action-grid')?.classList.add('hidden');
    document.getElementById('mp-lobby-view')?.classList.remove('hidden');
    const codeElem = document.getElementById('mp-display-room-code');
    if (codeElem) codeElem.textContent = roomCode;
  }

  resetLobbyView() {
    document.querySelector('.mp-action-grid')?.classList.remove('hidden');
    document.getElementById('mp-lobby-view')?.classList.add('hidden');
  }

  updateLobbyRoster(players, config) {
    const rosterList = document.getElementById('mp-player-roster');
    const countElem = document.getElementById('mp-player-count');
    const mapElem = document.getElementById('mp-display-map');
    const modeElem = document.getElementById('mp-display-mode');
    const startBtn = document.getElementById('btn-start-match');

    if (countElem) countElem.textContent = players.length;
    if (mapElem) mapElem.textContent = `MAP: ${config.mapId.toUpperCase()}`;
    if (modeElem) modeElem.textContent = `MODE: ${config.mode === 'ffa' ? 'FREE FOR ALL' : 'TEAM BATTLE'}`;

    if (!this.networkMgr?.isHost && startBtn) {
      startBtn.style.opacity = '0.5';
      startBtn.querySelector('span').textContent = 'WAITING FOR HOST...';
    } else if (startBtn) {
      startBtn.style.opacity = '1.0';
      startBtn.querySelector('span').textContent = 'START MATCH NOW';
    }

    if (rosterList) {
      rosterList.innerHTML = '';
      players.forEach(p => {
        const item = document.createElement('div');
        item.className = 'roster-player-item';
        item.innerHTML = `
          <div class="roster-dot" style="background: ${p.color || '#00f0ff'}; box-shadow: 0 0 8px ${p.color || '#00f0ff'}"></div>
          <span class="roster-name">${p.name}</span>
          ${p.isHost ? '<span class="roster-badge host">HOST</span>' : `<span class="roster-badge" style="color:${p.color}">${p.team?.toUpperCase() || 'PLAYER'}</span>`}
        `;
        rosterList.appendChild(item);
      });
    }
  }
}

