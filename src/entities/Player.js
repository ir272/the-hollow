import * as THREE from 'three';
import { PLAYER, GAME_STATE } from '../utils/constants.js';
import { clamp, lerp } from '../utils/math.js';

export class Player {
  constructor(camera, colliders) {
    this.camera = camera;
    this.colliders = colliders; // Array of AABB colliders

    // Position
    this.position = new THREE.Vector3(0, PLAYER.HEIGHT, -5);
    this.velocity = new THREE.Vector3();
    this.camera.position.copy(this.position);

    // Look
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.yaw = 0;
    this.pitch = 0;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isCrouching = false;
    this.isMoving = false;

    // Head bob
    this.headBobPhase = 0;
    this.headBobAmount = 0;
    this.cameraSway = 0;

    // Pointer lock
    this.isLocked = false;

    this.setupControls();
  }

  setupControls() {
    // Pointer lock
    document.addEventListener('click', () => {
      if (!this.isLocked && window.gameState === GAME_STATE.PLAYING) {
        document.body.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = !!document.pointerLockElement;
      document.getElementById('crosshair').style.display = this.isLocked ? 'block' : 'none';
    });

    // Mouse look
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      this.yaw -= e.movementX * PLAYER.MOUSE_SENSITIVITY;
      this.pitch -= e.movementY * PLAYER.MOUSE_SENSITIVITY;
      this.pitch = clamp(this.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (window.gameState !== GAME_STATE.PLAYING) return;
      switch (e.code) {
        case 'KeyW': this.moveForward = true; break;
        case 'KeyS': this.moveBackward = true; break;
        case 'KeyA': this.moveLeft = true; break;
        case 'KeyD': this.moveRight = true; break;
        case 'ControlLeft':
        case 'ControlRight':
          this.isCrouching = true;
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.moveForward = false; break;
        case 'KeyS': this.moveBackward = false; break;
        case 'KeyA': this.moveLeft = false; break;
        case 'KeyD': this.moveRight = false; break;
        case 'ControlLeft':
        case 'ControlRight':
          this.isCrouching = false;
          break;
      }
    });
  }

  update(dt) {
    if (!this.isLocked) return;
    if (window.gameState !== GAME_STATE.PLAYING) return;

    // Calculate movement direction
    const speed = this.isCrouching ? PLAYER.CROUCH_SPEED : PLAYER.SPEED;
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const moveDir = new THREE.Vector3();
    if (this.moveForward) moveDir.add(forward);
    if (this.moveBackward) moveDir.sub(forward);
    if (this.moveLeft) moveDir.sub(right);
    if (this.moveRight) moveDir.add(right);

    this.isMoving = moveDir.lengthSq() > 0;

    if (this.isMoving) {
      moveDir.normalize().multiplyScalar(speed * dt);

      // Check collision X
      const newX = this.position.x + moveDir.x;
      if (!this.checkCollision(newX, this.position.z)) {
        this.position.x = newX;
      }

      // Check collision Z
      const newZ = this.position.z + moveDir.z;
      if (!this.checkCollision(this.position.x, newZ)) {
        this.position.z = newZ;
      }
    }

    // Head height (crouch smoothing)
    const targetHeight = this.isCrouching ? PLAYER.CROUCH_HEIGHT : PLAYER.HEIGHT;
    this.position.y = lerp(this.position.y, targetHeight, dt * 8);

    // Head bob
    if (this.isMoving) {
      this.headBobPhase += dt * PLAYER.HEAD_BOB_SPEED;
      this.headBobAmount = lerp(this.headBobAmount, PLAYER.HEAD_BOB_AMOUNT, dt * 5);
    } else {
      this.headBobAmount = lerp(this.headBobAmount, 0, dt * 5);
    }
    const headBobY = Math.sin(this.headBobPhase) * this.headBobAmount;
    const headBobX = Math.sin(this.headBobPhase * 0.5) * this.headBobAmount * 0.5;

    // Camera sway (always, even when still)
    const time = performance.now() * 0.001;
    this.cameraSway = Math.sin(time * PLAYER.SWAY_SPEED) * PLAYER.SWAY_AMOUNT;

    // Apply to camera
    this.camera.position.set(
      this.position.x + headBobX,
      this.position.y + headBobY,
      this.position.z
    );

    this.euler.set(this.pitch + this.cameraSway, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);
  }

  checkCollision(x, z) {
    const r = PLAYER.COLLISION_RADIUS;
    for (const box of this.colliders) {
      if (x + r > box.minX && x - r < box.maxX &&
          z + r > box.minZ && z - r < box.maxZ) {
        return true;
      }
    }
    return false;
  }

  // Get look direction for raycasting
  getLookDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.quaternion);
    return dir;
  }

  getPosition() {
    return this.position.clone();
  }
}
