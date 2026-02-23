import * as THREE from 'three';
import { randomRange } from '../utils/math.js';

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.dustSystem = this.createDustMotes();
    this.ashSystem = this.createFallingAsh();
    this.wardenBreath = null; // Created on demand
  }

  createDustMotes() {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const phases = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = randomRange(-15, 15);
      positions[i * 3 + 1] = randomRange(0.5, 16);
      positions[i * 3 + 2] = randomRange(-60, 0);

      velocities.push({
        x: randomRange(-0.02, 0.02),
        y: randomRange(-0.005, 0.01),
        z: randomRange(-0.02, 0.02),
      });
      phases.push(randomRange(0, Math.PI * 2));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaa9977,
      size: 0.03,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    return { points, positions, velocities, phases, count };
  }

  createFallingAsh() {
    const count = 100;
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      this.resetAshParticle(positions, i);
      velocities.push({
        x: randomRange(-0.01, 0.01),
        y: randomRange(-0.05, -0.02),
        z: randomRange(-0.01, 0.01),
        rotPhase: randomRange(0, Math.PI * 2),
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x444444,
      size: 0.02,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    return { points, positions, velocities, count };
  }

  resetAshParticle(positions, i) {
    positions[i * 3] = randomRange(-12, 12);
    positions[i * 3 + 1] = randomRange(10, 18);
    positions[i * 3 + 2] = randomRange(-55, -5);
  }

  createWardenBreathEffect(wardenPosition) {
    if (this.wardenBreath) {
      this.scene.remove(this.wardenBreath.points);
    }

    const count = 30;
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = wardenPosition.x + randomRange(-0.2, 0.2);
      positions[i * 3 + 1] = wardenPosition.y + 2.2 + randomRange(-0.1, 0.1);
      positions[i * 3 + 2] = wardenPosition.z + randomRange(-0.2, 0.2);

      velocities.push({
        x: randomRange(-0.02, 0.02),
        y: randomRange(0.01, 0.03),
        z: randomRange(-0.02, 0.02),
        life: randomRange(0.5, 2),
        maxLife: randomRange(0.5, 2),
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x88aacc,
      size: 0.04,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.wardenBreath = { points, positions, velocities, count };
  }

  update(dt, playerPosition) {
    const time = performance.now() * 0.001;

    // Update dust motes
    const dustPos = this.dustSystem.positions;
    for (let i = 0; i < this.dustSystem.count; i++) {
      const v = this.dustSystem.velocities[i];
      const phase = this.dustSystem.phases[i];

      dustPos[i * 3] += v.x + Math.sin(time * 0.5 + phase) * 0.002;
      dustPos[i * 3 + 1] += v.y + Math.sin(time * 0.3 + phase * 1.5) * 0.003;
      dustPos[i * 3 + 2] += v.z + Math.cos(time * 0.4 + phase) * 0.002;

      // Fade particles near player (they scatter)
      const dx = dustPos[i * 3] - playerPosition.x;
      const dy = dustPos[i * 3 + 1] - playerPosition.y;
      const dz = dustPos[i * 3 + 2] - playerPosition.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.5) {
        dustPos[i * 3] += dx * 0.02;
        dustPos[i * 3 + 1] += dy * 0.02;
        dustPos[i * 3 + 2] += dz * 0.02;
      }

      // Wrap around
      if (dustPos[i * 3] > 15) dustPos[i * 3] = -15;
      if (dustPos[i * 3] < -15) dustPos[i * 3] = 15;
      if (dustPos[i * 3 + 1] > 16) dustPos[i * 3 + 1] = 0.5;
      if (dustPos[i * 3 + 1] < 0.5) dustPos[i * 3 + 1] = 16;
      if (dustPos[i * 3 + 2] > 0) dustPos[i * 3 + 2] = -60;
      if (dustPos[i * 3 + 2] < -60) dustPos[i * 3 + 2] = 0;
    }
    this.dustSystem.points.geometry.attributes.position.needsUpdate = true;

    // Update falling ash
    const ashPos = this.ashSystem.positions;
    for (let i = 0; i < this.ashSystem.count; i++) {
      const v = this.ashSystem.velocities[i];

      ashPos[i * 3] += v.x + Math.sin(time * 2 + v.rotPhase) * 0.005;
      ashPos[i * 3 + 1] += v.y;
      ashPos[i * 3 + 2] += v.z + Math.cos(time * 1.5 + v.rotPhase) * 0.005;

      // Reset if below floor
      if (ashPos[i * 3 + 1] < 0) {
        this.resetAshParticle(ashPos, i);
      }
    }
    this.ashSystem.points.geometry.attributes.position.needsUpdate = true;

    // Update warden breath
    if (this.wardenBreath) {
      const bPos = this.wardenBreath.positions;
      let allDead = true;

      for (let i = 0; i < this.wardenBreath.count; i++) {
        const v = this.wardenBreath.velocities[i];
        v.life -= dt;

        if (v.life > 0) {
          allDead = false;
          bPos[i * 3] += v.x;
          bPos[i * 3 + 1] += v.y;
          bPos[i * 3 + 2] += v.z;

          // Fade out
          v.x *= 0.99;
          v.z *= 0.99;
        }
      }

      this.wardenBreath.points.geometry.attributes.position.needsUpdate = true;
      this.wardenBreath.points.material.opacity = 0.15 * Math.max(0,
        this.wardenBreath.velocities.reduce((a, v) => Math.max(a, v.life / v.maxLife), 0)
      );

      if (allDead) {
        this.scene.remove(this.wardenBreath.points);
        this.wardenBreath = null;
      }
    }
  }
}
