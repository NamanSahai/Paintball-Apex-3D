import * as THREE from 'three';
import { sound } from '../engine/AudioEngine.js';

export class HUDManager {
  constructor() {
    // HUD Elements
    this.stageNameEl = document.getElementById('hud-stage-name');
    this.targetsHitEl = document.getElementById('hud-targets-hit');
    this.targetsTotalEl = document.getElementById('hud-targets-total');
    this.targetsProgressEl = document.getElementById('hud-targets-progress');
    this.timerEl = document.getElementById('hud-timer');
    this.scoreEl = document.getElementById('hud-score');
    this.accuracyEl = document.getElementById('hud-accuracy');
    this.windCardEl = document.getElementById('hud-wind-card');
    this.windArrowEl = document.getElementById('hud-wind-arrow');
    this.windSpeedEl = document.getElementById('hud-wind-speed');

    // Crosshair & ADS Reticle
    this.crosshairContainer = document.getElementById('crosshair-container');
    this.crosshairEl = document.getElementById('crosshair');
    this.adsReticleEl = document.getElementById('ads-reticle');
    this.hitMarkerEl = document.getElementById('hit-marker');
    this.hitFeedbackTextEl = document.getElementById('hit-feedback-text');

    // Combo & Float Scores
    this.comboWidgetEl = document.getElementById('combo-widget');
    this.comboMultiplierEl = document.getElementById('combo-multiplier');
    this.comboBarFillEl = document.getElementById('combo-bar-fill');
    this.floatingScoresContainer = document.getElementById('floating-scores');

    // Bottom Left Telemetry
    this.stanceTagEl = document.getElementById('hud-stance-tag');
    this.speedValEl = document.getElementById('hud-speed-val');
    this.staminaFillEl = document.getElementById('hud-stamina-fill');
    this.paintSwatchesEl = document.getElementById('hud-paint-swatches');

    // Bottom Right Telemetry
    this.markerNameEl = document.getElementById('hud-marker-name');
    this.fireModeEl = document.getElementById('hud-fire-mode');
    this.ammoCurrentEl = document.getElementById('hud-ammo-current');
    this.ammoMaxEl = document.getElementById('hud-ammo-max');
    this.ammoBarEl = document.getElementById('hud-ammo-bar');
    this.podsDisplayEl = document.getElementById('hud-pods-display');
    this.bpsValEl = document.getElementById('hud-bps-val');
    this.todPillsContainer = document.getElementById('hud-tod-pills');
    this.fpsNumEl = document.getElementById('hud-fps-num');
    this.fpsMsEl = document.getElementById('hud-fps-ms');

    // Hit Marker Timers
    this.hitMarkerTimeout = null;
    this.crosshairSpread = 0.0;
  }

  initTimeOfDay(activeTod, onSelect) {
    if (!this.todPillsContainer) return;
    const buttons = this.todPillsContainer.querySelectorAll('.tod-btn');
    buttons.forEach(btn => {
      const tod = btn.getAttribute('data-tod');
      if (tod === activeTod) btn.classList.add('active');
      else btn.classList.remove('active');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect(tod);
      });
    });
  }

  updateTimeOfDay(activeTod) {
    if (!this.todPillsContainer) return;
    const buttons = this.todPillsContainer.querySelectorAll('.tod-btn');
    buttons.forEach(btn => {
      const tod = btn.getAttribute('data-tod');
      if (tod === activeTod) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  initPaintSwatches(paintColors, activeIndex, onSelect) {
    this.paintSwatchesEl.innerHTML = '';
    paintColors.forEach((color, idx) => {
      const dot = document.createElement('div');
      dot.className = `swatch-dot ${idx === activeIndex ? 'active' : ''}`;
      dot.style.backgroundColor = color.css;
      dot.style.color = color.css;
      dot.title = color.name;
      dot.addEventListener('click', () => onSelect(idx));
      this.paintSwatchesEl.appendChild(dot);
    });
  }

  updatePaintSwatches(activeIndex) {
    const dots = this.paintSwatchesEl.querySelectorAll('.swatch-dot');
    dots.forEach((d, idx) => {
      if (idx === activeIndex) d.classList.add('active');
      else d.classList.remove('active');
    });
  }

  setStageInfo(name, totalTargets, windVec) {
    this.stageNameEl.textContent = name;
    this.targetsTotalEl.textContent = totalTargets >= 999 ? '∞' : totalTargets;

    if (windVec && windVec.lengthSq() > 0.1) {
      this.windCardEl.style.display = 'block';
      const speed = windVec.length().toFixed(1);
      this.windSpeedEl.textContent = `${speed} m/s`;
      const angle = Math.atan2(windVec.z, windVec.x) * (180 / Math.PI);
      this.windArrowEl.style.transform = `rotate(${angle}deg)`;
    } else {
      this.windCardEl.style.display = 'none';
    }
  }

  updateCrosshair(isADS, isFiring) {
    if (isADS) {
      this.crosshairEl.classList.add('hidden');
      this.adsReticleEl.classList.remove('hidden');
    } else {
      this.crosshairEl.classList.remove('hidden');
      this.adsReticleEl.classList.add('hidden');

      if (isFiring) {
        this.crosshairSpread = 1.4;
      }
      this.crosshairSpread = THREE.MathUtils.lerp(this.crosshairSpread, 1.0, 0.15);
      this.crosshairEl.style.transform = `scale(${this.crosshairSpread})`;
    }
  }

  showHitMarker(isBullseye = false, isPenalty = false, comboCount = 1) {
    // Play Target Ring Audio
    if (!isPenalty) {
      sound.playTargetHit(isBullseye, comboCount);
    }

    this.hitMarkerEl.className = 'hit-marker active';
    if (isBullseye) this.hitMarkerEl.classList.add('bullseye');
    if (isPenalty) this.hitMarkerEl.classList.add('penalty');

    this.hitFeedbackTextEl.className = 'hit-feedback-text active';
    if (isPenalty) {
      this.hitFeedbackTextEl.textContent = 'PENALTY! -200';
      this.hitFeedbackTextEl.style.color = '#ff0055';
    } else if (isBullseye) {
      this.hitFeedbackTextEl.textContent = 'BULLSEYE! +250';
      this.hitFeedbackTextEl.style.color = '#ffe600';
    } else {
      this.hitFeedbackTextEl.textContent = 'HIT +100';
      this.hitFeedbackTextEl.style.color = '#00f0ff';
    }

    if (this.hitMarkerTimeout) clearTimeout(this.hitMarkerTimeout);
    this.hitMarkerTimeout = setTimeout(() => {
      this.hitMarkerEl.className = 'hit-marker';
      this.hitFeedbackTextEl.className = 'hit-feedback-text';
    }, 180);
  }

  spawnFloatingScore(text, type = 'normal') {
    const el = document.createElement('div');
    el.className = `float-score ${type}`;
    el.textContent = text;
    el.style.left = `${window.innerWidth * 0.5 + (Math.random() - 0.5) * 80}px`;
    el.style.top = `${window.innerHeight * 0.45 + (Math.random() - 0.5) * 40}px`;

    this.floatingScoresContainer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 850);
  }

  updateTelemetry(gameState, playerCam, markerMgr) {
    // Targets & Progress
    this.targetsHitEl.textContent = gameState.targetsHit;
    if (gameState.totalTargets < 999) {
      const pct = (gameState.targetsHit / gameState.totalTargets) * 100;
      this.targetsProgressEl.style.width = `${pct}%`;
    } else {
      this.targetsProgressEl.style.width = '100%';
    }

    // Timer (MM:SS.ms)
    const mins = Math.floor(gameState.elapsedTime / 60).toString().padStart(2, '0');
    const secs = Math.floor(gameState.elapsedTime % 60).toString().padStart(2, '0');
    const ms = Math.floor((gameState.elapsedTime * 100) % 100).toString().padStart(2, '0');
    this.timerEl.textContent = `${mins}:${secs}.${ms}`;

    // Score & Accuracy
    this.scoreEl.textContent = gameState.score.toLocaleString();
    const acc = gameState.shotsFired > 0 ? ((gameState.shotsHit / gameState.shotsFired) * 100).toFixed(1) : '100.0';
    this.accuracyEl.textContent = `${acc}%`;

    // Combo Streak
    if (gameState.combo > 1) {
      this.comboWidgetEl.classList.remove('hidden');
      this.comboMultiplierEl.textContent = `x${gameState.combo}`;
      const comboPct = Math.max(0, (gameState.comboTimer / 3.0) * 100);
      this.comboBarFillEl.style.width = `${comboPct}%`;
    } else {
      this.comboWidgetEl.classList.add('hidden');
    }

    // Player Movement
    this.stanceTagEl.textContent = playerCam.getStance();
    this.speedValEl.textContent = `${playerCam.getSpeedKmh()} KM/H`;
    this.staminaFillEl.style.width = `${playerCam.stamina * 100}%`;

    // Marker & Ammo Telemetry
    this.markerNameEl.textContent = markerMgr.currentWeaponData.name;
    this.fireModeEl.textContent = markerMgr.currentWeaponData.fireMode;
    this.ammoCurrentEl.textContent = markerMgr.ammo;
    this.ammoMaxEl.textContent = markerMgr.maxAmmo;
    this.ammoBarEl.style.width = `${(markerMgr.ammo / markerMgr.maxAmmo) * 100}%`;

    // Pods Indicator
    const podDots = this.podsDisplayEl.querySelectorAll('.pod-dot');
    podDots.forEach((dot, idx) => {
      if (idx < markerMgr.pods) dot.classList.add('active');
      else dot.classList.remove('active');
    });

    this.bpsValEl.textContent = markerMgr.currentBps.toFixed(1);
  }

  updateFps(fps, deltaMs) {
    if (this.fpsNumEl) {
      this.fpsNumEl.textContent = Math.round(fps);
      if (fps >= 55) {
        this.fpsNumEl.style.color = '#39ff14';
      } else if (fps >= 35) {
        this.fpsNumEl.style.color = '#ffe600';
      } else {
        this.fpsNumEl.style.color = '#ff0055';
      }
    }
    if (this.fpsMsEl) {
      this.fpsMsEl.textContent = `(${deltaMs.toFixed(1)}ms)`;
    }
  }

  /* ==========================================================================
     MULTIPLAYER HUD METHODS
     ========================================================================== */
  addKillfeed(killerName, victimName, weaponType) {
    const feed = document.getElementById('mp-killfeed');
    if (!feed) return;

    const item = document.createElement('div');
    item.className = 'killfeed-item';
    item.innerHTML = `
      <span class="killfeed-killer">${killerName}</span>
      <span class="killfeed-weapon">💥 [${weaponType.toUpperCase()}] ➔</span>
      <span class="killfeed-victim">${victimName}</span>
    `;

    feed.appendChild(item);

    setTimeout(() => {
      item.style.opacity = '0';
      item.style.transition = 'opacity 0.5s';
      setTimeout(() => item.remove(), 500);
    }, 4500);
  }

  toggleScoreboard(show) {
    const sb = document.getElementById('mp-scoreboard');
    if (!sb) return;
    if (show) sb.classList.remove('hidden');
    else sb.classList.add('hidden');
  }

  updateScoreboard(players, mapName = 'ARENA', mode = 'FFA', localPlayerId = '') {
    const tbody = document.getElementById('sb-player-rows');
    const mapEl = document.getElementById('sb-map-name');
    const modeEl = document.getElementById('sb-match-mode');

    if (mapEl) mapEl.textContent = mapName.toUpperCase();
    if (modeEl) modeEl.textContent = mode.toUpperCase();

    if (tbody) {
      tbody.innerHTML = '';
      // Sort by kills descending
      const sorted = [...players].sort((a, b) => (b.kills || 0) - (a.kills || 0));
      sorted.forEach(p => {
        const tr = document.createElement('tr');
        if (p.id === localPlayerId) tr.className = 'me';
        const acc = p.shotsFired > 0 ? `${Math.round((p.shotsHit / p.shotsFired) * 100)}%` : '--';
        tr.innerHTML = `
          <td style="color:${p.color || '#fff'}; font-weight:bold;">${p.name} ${p.isHost ? '👑' : ''}</td>
          <td><span class="roster-badge" style="color:${p.color || '#fff'}">${p.team?.toUpperCase() || 'SOLO'}</span></td>
          <td style="color:#00f0ff; font-weight:bold;">${p.kills || 0}</td>
          <td style="color:#ff0055;">${p.deaths || 0}</td>
          <td>${acc}</td>
          <td style="color:#ffe600; font-weight:bold;">${(p.kills || 0) * 100}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  showRespawnScreen(killerName, seconds = 3) {
    const screen = document.getElementById('mp-respawn-screen');
    const byText = document.getElementById('elim-by-text');
    const countText = document.getElementById('respawn-countdown');

    if (byText) byText.textContent = `ELIMINATED BY ${killerName.toUpperCase()}`;
    if (countText) countText.textContent = seconds;
    if (screen) screen.classList.remove('hidden');
  }

  hideRespawnScreen() {
    const screen = document.getElementById('mp-respawn-screen');
    if (screen) screen.classList.add('hidden');
  }

  addChatMessage(sender, text) {
    const container = document.getElementById('mp-chat-messages');
    if (!container) return;

    const line = document.createElement('div');
    line.className = 'chat-msg-line';
    line.innerHTML = `<span class="chat-msg-sender">${sender}:</span>${text}`;
    container.appendChild(line);

    if (container.children.length > 5) {
      container.removeChild(container.children[0]);
    }

    setTimeout(() => {
      line.style.opacity = '0';
      line.style.transition = 'opacity 1s';
      setTimeout(() => line.remove(), 1000);
    }, 6000);
  }

  toggleChatInput(show, onSend) {
    const form = document.getElementById('mp-chat-form');
    const input = document.getElementById('mp-chat-input');
    if (!form || !input) return;

    if (show) {
      form.classList.remove('hidden');
      input.focus();
      form.onsubmit = (e) => {
        e.preventDefault();
        const msg = input.value.trim();
        if (msg) onSend(msg);
        input.value = '';
        form.classList.add('hidden');
        input.blur();
      };
    } else {
      form.classList.add('hidden');
      input.blur();
    }
  }
}

