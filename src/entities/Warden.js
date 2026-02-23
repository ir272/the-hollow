import * as THREE from 'three';
import { WARDEN, COLORS } from '../utils/constants.js';
import { distance2D, isInCone, lerp, randomRange } from '../utils/math.js';

export class Warden {
  constructor(scene) {
    this.scene = scene;
    this.mesh = this.createGeometry();
    this.scene.add(this.mesh);

    // AI State
    this.state = 'patrol'; // patrol, alert, pursuit, lost
    this.patrolIndex = 0;
    this.alertTimer = 0;
    this.lostTimer = 0;
    this.facingAngle = 0;
    this.targetAngle = 0;

    // Start hidden
    this.active = false;
    this.mesh.visible = false;

    // Proximity tracking
    this.distanceToPlayer = Infinity;
    this.canSeePlayer = false;

    // Hallucination support
    this.isHallucination = false;
    this.hallucinationOpacity = 1;

    // Patrol waypoints (throughout cathedral)
    this.patrolPath = [
      new THREE.Vector3(0, 0, -10),
      new THREE.Vector3(-8, 0, -20),
      new THREE.Vector3(8, 0, -30),
      new THREE.Vector3(0, 0, -45),
      new THREE.Vector3(-8, 0, -55),
      new THREE.Vector3(8, 0, -40),
      new THREE.Vector3(0, 0, -25),
      new THREE.Vector3(-8, 0, -15),
    ];

    this.position = this.patrolPath[0].clone();
    this.position.y = 0;
  }

  createGeometry() {
    const group = new THREE.Group();

    // Body - tall elongated form
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.95,
      metalness: 0.0,
    });

    // Core body (capsule-like)
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.4, WARDEN.HEIGHT, 8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = WARDEN.HEIGHT / 2;
    body.castShadow = true;
    group.add(body);

    // Hood/head
    const headGeo = new THREE.SphereGeometry(0.25, 8, 6);
    headGeo.scale(1, 1.3, 1);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = WARDEN.HEIGHT - 0.1;
    head.castShadow = true;
    group.add(head);

    // Face void (featureless black)
    const faceGeo = new THREE.PlaneGeometry(0.2, 0.25);
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x000000,
      roughness: 1,
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, WARDEN.HEIGHT - 0.15, 0.22);
    group.add(face);

    // Robe drape (wider at bottom)
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.98,
      side: THREE.DoubleSide,
    });

    // Robe layers
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const robeGeo = new THREE.PlaneGeometry(0.8, WARDEN.HEIGHT * 0.7);
      const robe = new THREE.Mesh(robeGeo, robeMat);
      robe.position.set(
        Math.cos(angle) * 0.35,
        WARDEN.HEIGHT * 0.35,
        Math.sin(angle) * 0.35
      );
      robe.rotation.y = angle;
      robe.castShadow = true;
      group.add(robe);
    }

    // Arms (long, thin, slightly extended)
    for (const side of [-1, 1]) {
      const armGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.2, 4);
      const arm = new THREE.Mesh(armGeo, bodyMat);
      arm.position.set(side * 0.35, WARDEN.HEIGHT * 0.6, 0);
      arm.rotation.z = side * 0.3;
      arm.castShadow = true;
      group.add(arm);

      // Fingers (skeletal)
      for (let f = 0; f < 3; f++) {
        const fingerGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.2, 3);
        const finger = new THREE.Mesh(fingerGeo, bodyMat);
        const fingerAngle = (f - 1) * 0.3;
        finger.position.set(
          side * 0.5 + Math.cos(fingerAngle) * 0.03,
          WARDEN.HEIGHT * 0.45,
          Math.sin(fingerAngle) * 0.03
        );
        finger.rotation.z = side * 0.6;
        group.add(finger);
      }
    }

    return group;
  }

  activate(position) {
    this.active = true;
    this.mesh.visible = true;
    if (position) {
      this.position.copy(position);
    }
    this.state = 'patrol';
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }

  // Create a hallucination clone
  createHallucination(position) {
    const hallucination = new Warden(this.scene);
    hallucination.isHallucination = true;
    hallucination.activate(position);
    hallucination.hallucinationOpacity = 0.5;
    hallucination.mesh.traverse(child => {
      if (child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.4;
      }
    });
    return hallucination;
  }

  update(dt, playerPosition, playerIsMoving, playerIsCrouching) {
    if (!this.active) return;

    const time = performance.now() * 0.001;

    // Distance to player
    this.distanceToPlayer = distance2D(
      this.position.x, this.position.z,
      playerPosition.x, playerPosition.z
    );

    // Detection check
    this.checkDetection(playerPosition, playerIsMoving, playerIsCrouching);

    // State machine
    switch (this.state) {
      case 'patrol':
        this.updatePatrol(dt);
        break;
      case 'alert':
        this.updateAlert(dt, playerPosition);
        break;
      case 'pursuit':
        this.updatePursuit(dt, playerPosition);
        break;
      case 'lost':
        this.updateLost(dt);
        break;
    }

    // Smooth rotation
    this.facingAngle = lerp(this.facingAngle, this.targetAngle, dt * 3);

    // Apply position + rotation
    this.mesh.position.set(this.position.x, 0, this.position.z);
    this.mesh.rotation.y = this.facingAngle;

    // Robe sway animation
    this.mesh.children.forEach((child, i) => {
      if (i > 3 && i < 8) { // Robe panels
        child.rotation.x = Math.sin(time * 2 + i) * 0.05;
        child.rotation.z += Math.sin(time * 1.5 + i * 0.7) * 0.001;
      }
    });

    // Hallucination fade
    if (this.isHallucination) {
      this.hallucinationOpacity -= dt * 0.1;
      if (this.hallucinationOpacity <= 0) {
        this.deactivate();
        this.scene.remove(this.mesh);
      } else {
        this.mesh.traverse(child => {
          if (child.material && child.material.transparent) {
            child.material.opacity = this.hallucinationOpacity * 0.4;
          }
        });
      }
    }
  }

  checkDetection(playerPos, isMoving, isCrouching) {
    if (this.isHallucination) return;

    // Line of sight check
    const canSee = isInCone(
      this.position.x, this.position.z,
      this.facingAngle,
      playerPos.x, playerPos.z,
      WARDEN.DETECTION_RANGE,
      WARDEN.DETECTION_ANGLE
    );

    // Sound detection
    const soundRange = isCrouching ? WARDEN.SOUND_RANGE_CROUCH : WARDEN.SOUND_RANGE_WALK;
    const canHear = isMoving && this.distanceToPlayer < soundRange;

    this.canSeePlayer = canSee;

    if (canSee || canHear) {
      if (this.state === 'patrol') {
        this.state = 'alert';
        this.alertTimer = 1.5;
      } else if (this.state === 'alert') {
        // Already alerted
      } else if (this.state === 'lost') {
        this.state = 'pursuit';
      }
    }
  }

  updatePatrol(dt) {
    const target = this.patrolPath[this.patrolIndex];
    const dist = distance2D(this.position.x, this.position.z, target.x, target.z);

    if (dist < 1) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
    }

    // Move toward target
    const angle = Math.atan2(target.x - this.position.x, target.z - this.position.z);
    this.targetAngle = angle;

    this.position.x += Math.sin(angle) * WARDEN.SPEED_PATROL * dt;
    this.position.z += Math.cos(angle) * WARDEN.SPEED_PATROL * dt;
  }

  updateAlert(dt, playerPos) {
    this.alertTimer -= dt;

    // Turn to face player
    this.targetAngle = Math.atan2(
      playerPos.x - this.position.x,
      playerPos.z - this.position.z
    );

    if (this.alertTimer <= 0) {
      if (this.canSeePlayer) {
        this.state = 'pursuit';
      } else {
        this.state = 'patrol';
      }
    }
  }

  updatePursuit(dt, playerPos) {
    // Glide toward player
    const angle = Math.atan2(
      playerPos.x - this.position.x,
      playerPos.z - this.position.z
    );
    this.targetAngle = angle;

    this.position.x += Math.sin(angle) * WARDEN.SPEED_PURSUIT * dt;
    this.position.z += Math.cos(angle) * WARDEN.SPEED_PURSUIT * dt;

    // Check if player escaped sight
    if (!this.canSeePlayer && this.distanceToPlayer > WARDEN.DETECTION_RANGE) {
      this.state = 'lost';
      this.lostTimer = WARDEN.LOSE_INTEREST_TIME;
    }
  }

  updateLost(dt) {
    this.lostTimer -= dt;

    // Wander near last known position
    const time = performance.now() * 0.001;
    this.position.x += Math.sin(time * 0.5) * WARDEN.SPEED_PATROL * 0.3 * dt;
    this.position.z += Math.cos(time * 0.7) * WARDEN.SPEED_PATROL * 0.3 * dt;

    this.targetAngle += Math.sin(time) * dt;

    if (this.lostTimer <= 0) {
      this.state = 'patrol';
      // Find nearest patrol point
      let nearestIdx = 0;
      let nearestDist = Infinity;
      this.patrolPath.forEach((p, i) => {
        const d = distance2D(this.position.x, this.position.z, p.x, p.z);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      });
      this.patrolIndex = nearestIdx;
    }
  }

  isNearPlayer() {
    return this.distanceToPlayer < WARDEN.KILL_RANGE;
  }

  getProximityFactor() {
    if (!this.active || this.isHallucination) return 0;
    if (this.distanceToPlayer > WARDEN.HUM_MAX_DISTANCE) return 0;
    return 1 - (this.distanceToPlayer / WARDEN.HUM_MAX_DISTANCE);
  }
}
