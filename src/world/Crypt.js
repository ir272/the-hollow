import * as THREE from 'three';
import { CRYPT, COLORS } from '../utils/constants.js';
import { createStoneMaterial, createMetalMaterial, randomRange } from '../utils/math.js';

export class Crypt {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.colliders = [];
    this.interactables = [];

    // Position crypt below cathedral
    this.group.position.set(0, -CRYPT.HEIGHT - 1, -30);

    this.stoneMat = createStoneMaterial(COLORS.STONE_DARK);
    this.stoneMidMat = createStoneMaterial(COLORS.STONE_MID);
    this.floorMat = createStoneMaterial(0x2a2520, 0.98);
    this.ironMat = createMetalMaterial(COLORS.IRON_RUST);
    this.boneMat = createStoneMaterial(COLORS.BONE_DARK);

    this.build();
    scene.add(this.group);
  }

  addCollider(minX, minZ, maxX, maxZ) {
    // Offset by group position
    this.colliders.push({
      minX, minZ, maxX, maxZ,
      yMin: -CRYPT.HEIGHT - 1,
      yMax: 0,
    });
  }

  build() {
    this.buildMainCorridor();
    this.buildChambers();
    this.buildBoneWalls();
    this.buildSarcophagi();
    this.buildStairsUp();
  }

  buildMainCorridor() {
    const W = CRYPT.CORRIDOR_WIDTH;
    const L = CRYPT.LENGTH;
    const H = CRYPT.HEIGHT;
    const T = 1; // wall thickness

    // Floor
    const floorGeo = new THREE.PlaneGeometry(W + 2, L);
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -L / 2);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(W + 2, L);
    const ceil = new THREE.Mesh(ceilGeo, this.stoneMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, H, -L / 2);
    this.group.add(ceil);

    // Left wall
    const wallGeo = new THREE.BoxGeometry(T, H, L);
    const leftWall = new THREE.Mesh(wallGeo, this.stoneMat);
    leftWall.position.set(-W / 2 - T / 2, H / 2, -L / 2);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeo, this.stoneMat);
    rightWall.position.set(W / 2 + T / 2, H / 2, -L / 2);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // End wall
    const endGeo = new THREE.BoxGeometry(W + T * 2, H, T);
    const endWall = new THREE.Mesh(endGeo, this.stoneMat);
    endWall.position.set(0, H / 2, -L);
    endWall.castShadow = true;
    this.group.add(endWall);

    // Low arches along corridor
    const archMat = createStoneMaterial(COLORS.STONE_MID);
    for (let z = -4; z > -L + 2; z -= 6) {
      const archGeo = new THREE.BoxGeometry(W + 1, 0.3, 0.3);
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(0, H - 0.15, z);
      this.group.add(arch);
    }

    // Colliders
    this.addCollider(-W / 2 - T, -L, -W / 2, 0);
    this.addCollider(W / 2, -L, W / 2 + T, 0);
    this.addCollider(-W / 2 - T, -L - T, W / 2 + T, -L);
  }

  buildChambers() {
    const S = CRYPT.CHAMBER_SIZE;
    const H = CRYPT.HEIGHT;
    const T = 0.8;
    const halfCorr = CRYPT.CORRIDOR_WIDTH / 2;

    // 4 chambers branching off corridor
    const chambers = [
      { x: -1, z: -8 },
      { x: 1, z: -8 },
      { x: -1, z: -22 },
      { x: 1, z: -22 },
    ];

    chambers.forEach(({ x: side, z }, idx) => {
      const cx = side * (halfCorr + T + S / 2);

      // Chamber floor
      const floorGeo = new THREE.PlaneGeometry(S, S);
      const floor = new THREE.Mesh(floorGeo, this.floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(cx, 0.01, z);
      floor.receiveShadow = true;
      this.group.add(floor);

      // Chamber ceiling
      const ceil = new THREE.Mesh(floorGeo, this.stoneMat);
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(cx, H, z);
      this.group.add(ceil);

      // 3 walls (open side faces corridor)
      // Back wall
      const backGeo = new THREE.BoxGeometry(S, H, T);
      const backWall = new THREE.Mesh(backGeo, this.stoneMat);
      backWall.position.set(cx, H / 2, z - S / 2);
      backWall.castShadow = true;
      backWall.receiveShadow = true;
      this.group.add(backWall);

      // Front wall
      const frontWall = new THREE.Mesh(backGeo, this.stoneMat);
      frontWall.position.set(cx, H / 2, z + S / 2);
      frontWall.castShadow = true;
      this.group.add(frontWall);

      // Outer wall
      const outerGeo = new THREE.BoxGeometry(T, H, S + T * 2);
      const outerWall = new THREE.Mesh(outerGeo, this.stoneMat);
      outerWall.position.set(cx + side * (S / 2 + T / 2), H / 2, z);
      outerWall.castShadow = true;
      this.group.add(outerWall);

      // Niche alcoves in walls
      if (idx < 2) {
        this.createNiche(cx + side * S / 2 * 0.7, z, side);
      }
    });
  }

  createNiche(x, z, side) {
    const nicheGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    const nicheMat = new THREE.MeshStandardMaterial({
      color: 0x0a0808,
      roughness: 1,
    });
    const niche = new THREE.Mesh(nicheGeo, nicheMat);
    niche.position.set(x, 1.2, z);
    this.group.add(niche);
  }

  buildBoneWalls() {
    // Bone-lined alcoves (ossuary section)
    const startZ = -30;
    const halfCorr = CRYPT.CORRIDOR_WIDTH / 2;

    for (let z = startZ; z > startZ - 8; z -= 1) {
      for (const side of [-1, 1]) {
        const x = side * (halfCorr + 0.3);

        // Row of skull-like shapes
        for (let y = 0.3; y < CRYPT.HEIGHT - 0.3; y += 0.5) {
          const skull = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 6, 5),
            this.boneMat
          );
          skull.position.set(x, y, z);
          skull.scale.set(1, 1.1, 0.9);
          this.group.add(skull);

          // Eye sockets
          for (const eyeX of [-0.04, 0.04]) {
            const eye = new THREE.Mesh(
              new THREE.SphereGeometry(0.03, 4, 4),
              new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            eye.position.set(x - side * 0.08, y + 0.03, z + eyeX);
            this.group.add(eye);
          }
        }

        // Long bones between rows
        if (z > startZ - 7) {
          for (let y = 0.5; y < CRYPT.HEIGHT - 0.5; y += 1) {
            const bone = new THREE.Mesh(
              new THREE.CylinderGeometry(0.02, 0.025, 0.9, 4),
              this.boneMat
            );
            bone.position.set(x, y, z - 0.5);
            bone.rotation.z = Math.PI / 2;
            bone.rotation.x = randomRange(-0.1, 0.1);
            this.group.add(bone);
          }
        }
      }
    }
  }

  buildSarcophagi() {
    // Stone sarcophagi in chambers
    const positions = [
      { x: -5, z: -8 },
      { x: 5, z: -22 },
    ];

    positions.forEach(({ x, z }) => {
      const baseGeo = new THREE.BoxGeometry(2, 0.8, 1);
      const base = new THREE.Mesh(baseGeo, this.stoneMidMat);
      base.position.set(x, 0.4, z);
      base.castShadow = true;
      base.receiveShadow = true;
      this.group.add(base);

      // Lid (slightly offset to look disturbed)
      const lidGeo = new THREE.BoxGeometry(2.1, 0.2, 1.1);
      const lid = new THREE.Mesh(lidGeo, this.stoneMidMat);
      lid.position.set(x + 0.15, 0.9, z + 0.1);
      lid.rotation.y = 0.03;
      lid.castShadow = true;
      this.group.add(lid);

      // Cross carved into lid (raised)
      const crossV = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.05, 0.6),
        createStoneMaterial(COLORS.STONE_LIGHT)
      );
      crossV.position.set(x + 0.15, 1.02, z + 0.1);
      this.group.add(crossV);

      const crossH = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.05, 0.08),
        createStoneMaterial(COLORS.STONE_LIGHT)
      );
      crossH.position.set(x + 0.15, 1.02, z + 0.2);
      this.group.add(crossH);
    });
  }

  buildStairsUp() {
    // Stairs connecting back up to the cathedral trapdoor
    const steps = 8;
    const stepW = 1.8;
    const stepH = (CRYPT.HEIGHT + 1) / steps;
    const stepD = 0.6;

    for (let i = 0; i < steps; i++) {
      const stepGeo = new THREE.BoxGeometry(stepW, stepH, stepD);
      const step = new THREE.Mesh(stepGeo, this.stoneMidMat);
      step.position.set(0, i * stepH + stepH / 2, i * stepD);
      step.castShadow = true;
      step.receiveShadow = true;
      this.group.add(step);
    }
  }
}
