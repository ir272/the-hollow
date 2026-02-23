import * as THREE from 'three';
import { COLORS, CATHEDRAL, PLAYER } from '../utils/constants.js';
import { createEmissiveMaterial, distance2D } from '../utils/math.js';

export class ArtifactSystem {
  constructor(scene) {
    this.scene = scene;
    this.artifacts = [];
    this.collected = [false, false, false, false];
    this.totalCollected = 0;

    this.onCollect = null;   // callback(artifactIndex)
    this.onAllCollected = null;

    this.createArtifacts();
  }

  createArtifacts() {
    const artifactDefs = [
      {
        name: 'Crimson Chalice',
        position: new THREE.Vector3(-17, 1.2, -16), // Left chapel 1
        geometry: this.createChalice(),
        color: COLORS.CRIMSON,
        emissive: COLORS.CRIMSON_GLOW,
      },
      {
        name: 'Bone Key',
        position: new THREE.Vector3(5, 0.8, -30 - 5 - 22), // Crypt chamber
        geometry: this.createKey(),
        color: COLORS.BONE,
        emissive: COLORS.ARTIFACT_GLOW,
      },
      {
        name: 'Obsidian Eye',
        position: new THREE.Vector3(17, 1.2, -40), // Right chapel 2
        geometry: this.createEye(),
        color: 0x111122,
        emissive: COLORS.GREEN_GLOW,
      },
      {
        name: 'Warden\'s Bell',
        position: new THREE.Vector3(0, 1.5, -CATHEDRAL.NAVE_LENGTH - 4), // Behind altar
        geometry: this.createBell(),
        color: COLORS.IRON,
        emissive: COLORS.ARTIFACT_GLOW,
      },
    ];

    artifactDefs.forEach((def, index) => {
      const group = new THREE.Group();

      // Artifact mesh
      const mat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.emissive,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.4,
      });

      const mesh = new THREE.Mesh(def.geometry, mat);
      group.add(mesh);

      // Glow point light
      const glow = new THREE.PointLight(def.emissive, 0.6, 5, 2);
      glow.position.y = 0.3;
      group.add(glow);

      // Floating animation offset
      group.position.copy(def.position);
      group.userData = { type: 'artifact', index, name: def.name, interactable: true };

      this.scene.add(group);
      this.artifacts.push({
        group,
        mesh,
        glow,
        def,
        index,
        baseY: def.position.y,
        collected: false,
      });
    });
  }

  createChalice() {
    // Cup shape from lathe geometry
    const points = [];
    points.push(new THREE.Vector2(0.12, 0));
    points.push(new THREE.Vector2(0.12, 0.05));
    points.push(new THREE.Vector2(0.04, 0.1));
    points.push(new THREE.Vector2(0.04, 0.2));
    points.push(new THREE.Vector2(0.1, 0.25));
    points.push(new THREE.Vector2(0.12, 0.35));
    points.push(new THREE.Vector2(0.1, 0.4));
    points.push(new THREE.Vector2(0.08, 0.4));
    return new THREE.LatheGeometry(points, 8);
  }

  createKey() {
    // Simple key shape
    const group = new THREE.Group();
    const shaft = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6);
    const ring = new THREE.TorusGeometry(0.05, 0.01, 6, 8);
    const tooth1 = new THREE.BoxGeometry(0.04, 0.015, 0.015);
    const tooth2 = new THREE.BoxGeometry(0.03, 0.015, 0.015);

    // Merge into single geometry using position offsets
    // Simplified: return shaft geometry, visuals handled by group
    return shaft;
  }

  createEye() {
    // Sphere with iris detail
    const geo = new THREE.SphereGeometry(0.1, 12, 8);
    return geo;
  }

  createBell() {
    // Bell shape from lathe
    const points = [];
    points.push(new THREE.Vector2(0.02, 0.2));
    points.push(new THREE.Vector2(0.04, 0.18));
    points.push(new THREE.Vector2(0.06, 0.15));
    points.push(new THREE.Vector2(0.06, 0.08));
    points.push(new THREE.Vector2(0.1, 0.03));
    points.push(new THREE.Vector2(0.12, 0));
    return new THREE.LatheGeometry(points, 8);
  }

  update(dt, playerPosition) {
    const time = performance.now() * 0.001;

    this.artifacts.forEach(artifact => {
      if (artifact.collected) return;

      // Floating animation
      artifact.group.position.y = artifact.baseY + Math.sin(time * 2 + artifact.index) * 0.1;

      // Slow rotation
      artifact.mesh.rotation.y += dt * 0.5;

      // Glow pulse
      artifact.glow.intensity = 0.4 + Math.sin(time * 3 + artifact.index * 1.5) * 0.3;
    });
  }

  tryCollect(playerPosition) {
    for (const artifact of this.artifacts) {
      if (artifact.collected) continue;

      const dist = distance2D(
        playerPosition.x, playerPosition.z,
        artifact.def.position.x, artifact.def.position.z
      );

      if (dist < PLAYER.INTERACT_DISTANCE) {
        artifact.collected = true;
        this.collected[artifact.index] = true;
        this.totalCollected++;

        // Remove from scene
        this.scene.remove(artifact.group);

        if (this.onCollect) {
          this.onCollect(artifact.index, artifact.def.name);
        }

        if (this.totalCollected >= 4 && this.onAllCollected) {
          this.onAllCollected();
        }

        return artifact;
      }
    }
    return null;
  }

  getNearest(playerPosition) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const artifact of this.artifacts) {
      if (artifact.collected) continue;

      const dist = distance2D(
        playerPosition.x, playerPosition.z,
        artifact.def.position.x, artifact.def.position.z
      );

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { artifact, distance: dist };
      }
    }

    return nearest;
  }
}
