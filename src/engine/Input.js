// Unified Input Manager for Keyboard, Mouse, and Pointer Lock
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.isLocked = false;

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
      crouch: false,
      reload: false,
      changeColor: false,
      slot1: false,
      slot2: false,
      slot3: false,
      slot4: false,
      pause: false
    };

    this.mouse = {
      fire: false,
      fireDown: false,
      ads: false,
      deltaX: 0,
      deltaY: 0
    };

    this.sensitivity = 1.0;
    this.invertY = false;

    this.onLockChange = null;
    this.onFirePress = null;
    this.onReloadPress = null;
    this.onColorChangePress = null;
    this.onWeaponSlotPress = null;
    this.onTimeOfDayPress = null;
    this.onPausePress = null;

    this.init();
  }

  init() {
    // Keyboard Events
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Mouse Movement
    window.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;
      const sens = this.sensitivity * 0.0022;
      this.mouse.deltaX += e.movementX * sens;
      this.mouse.deltaY += (this.invertY ? -e.movementY : e.movementY) * sens;
    });

    // Mouse Buttons
    window.addEventListener('mousedown', (e) => {
      // If menu overlay is open, never lock pointer or fire
      const menu = document.getElementById('menu-overlay');
      if (menu && !menu.classList.contains('hidden')) {
        return;
      }

      // If clicking directly on 3D game canvas
      if (e.target === this.canvas) {
        if (e.button === 0) {
          this.mouse.fire = true;
          this.mouse.fireDown = true;
          this.onFirePress?.();
          if (!this.isLocked) {
            this.requestLock();
          }
        } else if (e.button === 2) {
          this.mouse.ads = true;
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.fire = false;
        this.mouse.fireDown = false;
      } else if (e.button === 2) {
        this.mouse.ads = false;
      }
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Pointer Lock Listener
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.canvas;
      this.onLockChange?.(this.isLocked);
    });
  }

  requestLock() {
    this.canvas.requestPointerLock();
  }

  exitLock() {
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
  }

  handleKeyDown(e) {
    const code = e.code;
    if (code === 'Space' || code === 'Tab') {
      e.preventDefault();
    }
    if (e.repeat) return;

    if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = true;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = true;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sprint = true;
    if (code === 'Space') {
      this.keys.jump = true;
    }
    if (code === 'KeyC' || code === 'ControlLeft') this.keys.crouch = true;

    if (code === 'KeyR') {
      this.keys.reload = true;
      this.onReloadPress?.();
    }

    if (code === 'KeyE') {
      this.keys.changeColor = true;
      this.onColorChangePress?.();
    }

    if (code === 'KeyT') {
      this.onTimeOfDayPress?.();
    }

    if (code === 'Digit1') this.onWeaponSlotPress?.(0);
    if (code === 'Digit2') this.onWeaponSlotPress?.(1);
    if (code === 'Digit3') this.onWeaponSlotPress?.(2);
    if (code === 'Digit4') this.onWeaponSlotPress?.(3);

    if (code === 'Escape' || code === 'KeyP') {
      this.onPausePress?.();
    }
  }

  handleKeyUp(e) {
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sprint = false;
    if (code === 'Space') this.keys.jump = false;
    if (code === 'KeyC' || code === 'ControlLeft') this.keys.crouch = false;
    if (code === 'KeyR') this.keys.reload = false;
    if (code === 'KeyE') this.keys.changeColor = false;
  }

  resetDeltas() {
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
  }
}
