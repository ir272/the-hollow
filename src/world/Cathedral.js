import * as THREE from 'three';
import { CATHEDRAL, COLORS } from '../utils/constants.js';
import { createStoneMaterial, createWoodMaterial, createMetalMaterial, randomRange } from '../utils/math.js';
import { createStoneTexture, createFloorTexture, createWoodTexture } from '../utils/textures.js';

export class Cathedral {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.colliders = []; // AABB boxes for collision
    this.interactables = []; // Things player can interact with

    // Procedural textures for richer visuals
    const stoneTexDark = createStoneTexture(74, 64, 56);
    const stoneTexMid = createStoneTexture(90, 80, 72);
    const stoneTexLight = createStoneTexture(106, 96, 88);
    const floorTex = createFloorTexture(58, 53, 48);
    const woodTex = createWoodTexture(74, 56, 32);

    this.stoneMat = new THREE.MeshStandardMaterial({ color: COLORS.STONE_DARK, map: stoneTexDark, roughness: 0.95 });
    this.stoneMidMat = new THREE.MeshStandardMaterial({ color: COLORS.STONE_MID, map: stoneTexMid, roughness: 0.92 });
    this.stoneLightMat = new THREE.MeshStandardMaterial({ color: COLORS.STONE_LIGHT, map: stoneTexLight, roughness: 0.9 });
    this.floorMat = new THREE.MeshStandardMaterial({ color: COLORS.STONE_FLOOR, map: floorTex, roughness: 0.98 });
    this.woodMat = new THREE.MeshStandardMaterial({ color: COLORS.WOOD_PEW, map: woodTex, roughness: 0.85 });
    this.ironMat = createMetalMaterial(COLORS.IRON);
    this.ironRustMat = createMetalMaterial(COLORS.IRON_RUST);

    this.build();
    scene.add(this.group);
  }

  build() {
    this.buildFloor();
    this.buildWalls();
    this.buildPillars();
    this.buildArches();
    this.buildCeiling();
    this.buildApse();
    this.buildPews();
    this.buildAltar();
    this.buildSideChapels();
    this.buildStainedGlassWindows();
    this.buildDecorations();
    this.buildTowerStaircase();
    this.buildTrapdoor();
  }

  addCollider(minX, minZ, maxX, maxZ) {
    this.colliders.push({ minX, minZ, maxX, maxZ });
  }

  buildFloor() {
    // Main nave floor
    const floorGeo = new THREE.PlaneGeometry(
      CATHEDRAL.NAVE_WIDTH + CATHEDRAL.AISLE_WIDTH * 2 + CATHEDRAL.WALL_THICKNESS * 2,
      CATHEDRAL.NAVE_LENGTH + CATHEDRAL.APSE_DEPTH
    );
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -CATHEDRAL.NAVE_LENGTH / 2 + CATHEDRAL.APSE_DEPTH / 2);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Floor tile pattern — subtle grid lines
    const tileSize = 2;
    const lineMat = new THREE.LineBasicMaterial({ color: 0x151210, transparent: true, opacity: 0.4 });
    const totalW = CATHEDRAL.NAVE_WIDTH + CATHEDRAL.AISLE_WIDTH * 2;
    const totalL = CATHEDRAL.NAVE_LENGTH + CATHEDRAL.APSE_DEPTH;

    for (let x = -totalW / 2; x <= totalW / 2; x += tileSize) {
      const points = [
        new THREE.Vector3(x, 0.005, 0),
        new THREE.Vector3(x, 0.005, -totalL),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(lineGeo, lineMat));
    }
    for (let z = 0; z > -totalL; z -= tileSize) {
      const points = [
        new THREE.Vector3(-totalW / 2, 0.005, z),
        new THREE.Vector3(totalW / 2, 0.005, z),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(lineGeo, lineMat));
    }
  }

  buildWalls() {
    const H = CATHEDRAL.NAVE_HEIGHT;
    const W = CATHEDRAL.WALL_THICKNESS;
    const halfW = (CATHEDRAL.NAVE_WIDTH + CATHEDRAL.AISLE_WIDTH * 2) / 2 + W / 2;
    const L = CATHEDRAL.NAVE_LENGTH;

    // Left wall
    const wallGeo = new THREE.BoxGeometry(W, H, L);
    const leftWall = new THREE.Mesh(wallGeo, this.stoneMat);
    leftWall.position.set(-halfW, H / 2, -L / 2);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.group.add(leftWall);
    this.addCollider(-halfW - W / 2, -L, -halfW + W / 2, 0);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeo, this.stoneMat);
    rightWall.position.set(halfW, H / 2, -L / 2);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.group.add(rightWall);
    this.addCollider(halfW - W / 2, -L, halfW + W / 2, 0);

    // Back wall (entrance)
    const backGeo = new THREE.BoxGeometry(halfW * 2 + W, H, W);
    const backWall = new THREE.Mesh(backGeo, this.stoneMat);
    backWall.position.set(0, H / 2, W / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.group.add(backWall);
    this.addCollider(-halfW - W / 2, 0, halfW + W / 2, W);

    // Add wall surface detail — protruding stone blocks
    this.addWallDetail(-halfW + W / 2, L, 'left');
    this.addWallDetail(halfW - W / 2, L, 'right');
  }

  addWallDetail(x, length, side) {
    const blockMat = createStoneMaterial(COLORS.STONE_MID);
    for (let z = -2; z > -length; z -= randomRange(3, 6)) {
      const h = randomRange(0.3, 1.0);
      const w = randomRange(0.5, 1.5);
      const d = randomRange(0.1, 0.2);
      const geo = new THREE.BoxGeometry(d, h, w);
      const block = new THREE.Mesh(geo, blockMat);
      const xOff = side === 'left' ? d / 2 : -d / 2;
      block.position.set(x + xOff, randomRange(1, CATHEDRAL.NAVE_HEIGHT - 2), z);
      block.receiveShadow = true;
      this.group.add(block);
    }
  }

  buildPillars() {
    const spacing = CATHEDRAL.PILLAR_SPACING;
    const R = CATHEDRAL.PILLAR_RADIUS;
    const H = CATHEDRAL.NAVE_HEIGHT;
    const halfNave = CATHEDRAL.NAVE_WIDTH / 2;

    const pillarGeo = new THREE.CylinderGeometry(R, R * 1.1, H, 8);
    const baseCap = new THREE.CylinderGeometry(R * 1.4, R * 1.5, 0.5, 8);
    const topCap = new THREE.CylinderGeometry(R * 1.3, R * 1.4, 0.4, 8);

    for (let z = -spacing; z > -CATHEDRAL.NAVE_LENGTH + 2; z -= spacing) {
      for (const xSign of [-1, 1]) {
        const x = xSign * halfNave;

        // Main column
        const pillar = new THREE.Mesh(pillarGeo, this.stoneLightMat);
        pillar.position.set(x, H / 2, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        this.group.add(pillar);

        // Base
        const base = new THREE.Mesh(baseCap, this.stoneMidMat);
        base.position.set(x, 0.25, z);
        this.group.add(base);

        // Capital
        const cap = new THREE.Mesh(topCap, this.stoneMidMat);
        cap.position.set(x, H - 0.2, z);
        this.group.add(cap);

        // Collision for pillar
        this.addCollider(x - R * 1.2, z - R * 1.2, x + R * 1.2, z + R * 1.2);
      }
    }
  }

  buildArches() {
    const spacing = CATHEDRAL.PILLAR_SPACING;
    const halfNave = CATHEDRAL.NAVE_WIDTH / 2;
    const archMat = createStoneMaterial(COLORS.STONE_MID);

    for (let z = -spacing; z > -CATHEDRAL.NAVE_LENGTH + spacing; z -= spacing) {
      // Pointed arch between pillars across the nave
      this.createPointedArch(
        -halfNave, CATHEDRAL.NAVE_HEIGHT - 0.5, z,
        halfNave, CATHEDRAL.NAVE_HEIGHT - 0.5, z,
        CATHEDRAL.ARCH_HEIGHT, archMat
      );

      // Side arches along aisles
      for (const xSign of [-1, 1]) {
        const x = xSign * halfNave;
        const xOuter = xSign * (halfNave + CATHEDRAL.AISLE_WIDTH);
        this.createPointedArch(
          x, CATHEDRAL.NAVE_HEIGHT * 0.6, z,
          xOuter, CATHEDRAL.NAVE_HEIGHT * 0.6, z,
          CATHEDRAL.NAVE_HEIGHT * 0.55, archMat
        );
      }
    }
  }

  createPointedArch(x1, y1, z, x2, y2, peakY, material) {
    const segments = 12;
    const midX = (x1 + x2) / 2;
    const halfSpan = Math.abs(x2 - x1) / 2;
    const archThickness = 0.3;

    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI;
      // Pointed arch shape
      let x, y;
      if (t <= 0.5) {
        const localT = t * 2;
        x = x1 + localT * halfSpan;
        y = y1 + Math.sin(localT * Math.PI) * (peakY - y1) * 1.3;
      } else {
        const localT = (t - 0.5) * 2;
        x = midX + localT * halfSpan;
        y = y1 + Math.sin((1 - localT) * Math.PI) * (peakY - y1) * 1.3;
      }
      points.push(new THREE.Vector3(x, Math.min(y, peakY), z));
    }

    // Draw arch as line for subtlety, plus thin box segments
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const len = p1.distanceTo(p2);
      const geo = new THREE.BoxGeometry(len, archThickness, archThickness);
      const mesh = new THREE.Mesh(geo, material);

      mesh.position.copy(p1).lerp(p2, 0.5);
      mesh.lookAt(p2);
      mesh.rotateY(Math.PI / 2);
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  buildCeiling() {
    // Vaulted ceiling - simplified with angled planes
    const H = CATHEDRAL.CEILING_HEIGHT;
    const halfW = CATHEDRAL.NAVE_WIDTH / 2;
    const L = CATHEDRAL.NAVE_LENGTH;

    // Central ridge
    const ridgeGeo = new THREE.BoxGeometry(0.3, 0.3, L);
    const ridge = new THREE.Mesh(ridgeGeo, this.stoneMidMat);
    ridge.position.set(0, H, -L / 2);
    this.group.add(ridge);

    // Vault panels (left and right slopes)
    const vaultW = halfW + 1;
    const vaultGeo = new THREE.PlaneGeometry(vaultW, L);

    const leftVault = new THREE.Mesh(vaultGeo, this.stoneMat);
    leftVault.position.set(-vaultW / 2 + 0.5, H - 1, -L / 2);
    leftVault.rotation.z = -0.3;
    leftVault.receiveShadow = true;
    this.group.add(leftVault);

    const rightVault = new THREE.Mesh(vaultGeo, this.stoneMat);
    rightVault.position.set(vaultW / 2 - 0.5, H - 1, -L / 2);
    rightVault.rotation.z = 0.3;
    rightVault.receiveShadow = true;
    this.group.add(rightVault);

    // Aisle ceilings (lower, flat)
    for (const xSign of [-1, 1]) {
      const aisleX = xSign * (halfW + CATHEDRAL.AISLE_WIDTH / 2);
      const aisleCeil = new THREE.Mesh(
        new THREE.PlaneGeometry(CATHEDRAL.AISLE_WIDTH, L),
        this.stoneMat
      );
      aisleCeil.position.set(aisleX, CATHEDRAL.NAVE_HEIGHT * 0.6, -L / 2);
      aisleCeil.rotation.x = Math.PI / 2;
      this.group.add(aisleCeil);
    }
  }

  buildApse() {
    const D = CATHEDRAL.APSE_DEPTH;
    const W = CATHEDRAL.APSE_WIDTH;
    const H = CATHEDRAL.NAVE_HEIGHT;
    const startZ = -CATHEDRAL.NAVE_LENGTH;

    // Apse back wall (curved approximation with segments)
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI;
      const nextAngle = ((i + 1) / segments) * Math.PI;

      const x1 = Math.cos(angle) * W / 2;
      const z1 = startZ - Math.sin(angle) * D;
      const x2 = Math.cos(nextAngle) * W / 2;
      const z2 = startZ - Math.sin(nextAngle) * D;

      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const wallGeo = new THREE.BoxGeometry(len, H, CATHEDRAL.WALL_THICKNESS);
      const wall = new THREE.Mesh(wallGeo, this.stoneMat);

      wall.position.set((x1 + x2) / 2, H / 2, (z1 + z2) / 2);
      wall.rotation.y = Math.atan2(x2 - x1, z2 - z1);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);
    }

    // Apse floor (circular)
    const apseFGeo = new THREE.CircleGeometry(W / 2, 16);
    const apseFloor = new THREE.Mesh(apseFGeo, this.floorMat);
    apseFloor.rotation.x = -Math.PI / 2;
    apseFloor.position.set(0, 0.01, startZ);
    apseFloor.receiveShadow = true;
    this.group.add(apseFloor);

    // Raised platform for altar area
    const platformGeo = new THREE.BoxGeometry(6, 0.4, 4);
    const platform = new THREE.Mesh(platformGeo, this.stoneMidMat);
    platform.position.set(0, 0.2, startZ - 2);
    platform.receiveShadow = true;
    platform.castShadow = true;
    this.group.add(platform);
    this.addCollider(-3, startZ - 4, 3, startZ);
  }

  buildPews() {
    const pewRows = 8;
    const pewSpacing = 3;
    const pewWidth = 5;
    const startZ = -6;

    for (let row = 0; row < pewRows; row++) {
      const z = startZ - row * pewSpacing;

      for (const xSign of [-1, 1]) {
        const x = xSign * (pewWidth / 2 + 1);
        const pew = this.createPew();
        pew.position.set(x, 0, z);
        this.group.add(pew);

        // Pew collision
        this.addCollider(x - pewWidth / 2, z - 0.3, x + pewWidth / 2, z + 0.3);
      }
    }
  }

  createPew() {
    const group = new THREE.Group();
    const seatGeo = new THREE.BoxGeometry(5, 0.1, 0.5);
    const backGeo = new THREE.BoxGeometry(5, 0.8, 0.08);
    const legGeo = new THREE.BoxGeometry(0.08, 0.5, 0.5);

    // Seat
    const seat = new THREE.Mesh(seatGeo, this.woodMat);
    seat.position.y = 0.5;
    seat.castShadow = true;
    seat.receiveShadow = true;
    group.add(seat);

    // Back
    const back = new THREE.Mesh(backGeo, this.woodMat);
    back.position.set(0, 0.95, -0.2);
    back.castShadow = true;
    group.add(back);

    // Legs
    for (const xOff of [-2.3, -0.8, 0.8, 2.3]) {
      const leg = new THREE.Mesh(legGeo, this.woodMat);
      leg.position.set(xOff, 0.25, 0);
      leg.castShadow = true;
      group.add(leg);
    }

    return group;
  }

  buildAltar() {
    // Main altar table
    const altarGeo = new THREE.BoxGeometry(3, 1.2, 1.5);
    const altar = new THREE.Mesh(altarGeo, this.stoneLightMat);
    altar.position.set(0, 0.6, -CATHEDRAL.NAVE_LENGTH - 3);
    altar.castShadow = true;
    altar.receiveShadow = true;
    this.group.add(altar);
    this.addCollider(-1.5, -CATHEDRAL.NAVE_LENGTH - 3.75, 1.5, -CATHEDRAL.NAVE_LENGTH - 2.25);

    // Altar cloth (draped plane)
    const clothGeo = new THREE.PlaneGeometry(3.2, 1.3);
    const clothMat = new THREE.MeshStandardMaterial({
      color: COLORS.CRIMSON_DARK,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.position.set(0, 0.65, -CATHEDRAL.NAVE_LENGTH - 2.24);
    this.group.add(cloth);

    // Altar cross
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), this.ironMat);
    crossV.position.set(0, 1.8, -CATHEDRAL.NAVE_LENGTH - 3);
    crossV.castShadow = true;
    this.group.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), this.ironMat);
    crossH.position.set(0, 2.1, -CATHEDRAL.NAVE_LENGTH - 3);
    this.group.add(crossH);
  }

  buildSideChapels() {
    const chapelW = CATHEDRAL.CHAPEL_WIDTH;
    const chapelD = CATHEDRAL.CHAPEL_DEPTH;
    const halfW = (CATHEDRAL.NAVE_WIDTH + CATHEDRAL.AISLE_WIDTH * 2) / 2 + CATHEDRAL.WALL_THICKNESS;
    const H = CATHEDRAL.NAVE_HEIGHT * 0.6;

    // Two chapels on each side
    const chapelPositions = [-16, -40];

    for (const z of chapelPositions) {
      for (const xSign of [-1, 1]) {
        const cx = xSign * (halfW + chapelD / 2);

        // Chapel floor
        const floorGeo = new THREE.PlaneGeometry(chapelD, chapelW);
        const floor = new THREE.Mesh(floorGeo, this.floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(cx, 0.01, z);
        floor.receiveShadow = true;
        this.group.add(floor);

        // Chapel walls (3 sides)
        const backW = new THREE.Mesh(
          new THREE.BoxGeometry(CATHEDRAL.WALL_THICKNESS, H, chapelW),
          this.stoneMat
        );
        backW.position.set(cx + xSign * chapelD / 2, H / 2, z);
        backW.castShadow = true;
        backW.receiveShadow = true;
        this.group.add(backW);

        for (const zSign of [-1, 1]) {
          const sideW = new THREE.Mesh(
            new THREE.BoxGeometry(chapelD, H, CATHEDRAL.WALL_THICKNESS),
            this.stoneMat
          );
          sideW.position.set(cx, H / 2, z + zSign * chapelW / 2);
          sideW.castShadow = true;
          sideW.receiveShadow = true;
          this.group.add(sideW);
        }

        // Chapel ceiling
        const ceilGeo = new THREE.PlaneGeometry(chapelD, chapelW);
        const ceil = new THREE.Mesh(ceilGeo, this.stoneMat);
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(cx, H, z);
        this.group.add(ceil);

        // Small altar in each chapel
        const smallAltar = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.8, 0.8),
          this.stoneLightMat
        );
        smallAltar.position.set(cx + xSign * (chapelD / 2 - 0.8), 0.4, z);
        smallAltar.castShadow = true;
        this.group.add(smallAltar);

        // Colliders for chapel walls
        const outerX = cx + xSign * chapelD / 2;
        const innerX = cx - xSign * chapelD / 2;
        this.addCollider(
          Math.min(outerX, innerX) - 0.5, z - chapelW / 2 - 0.5,
          Math.max(outerX, innerX) + 0.5, z + chapelW / 2 + 0.5
        );
      }
    }
  }

  buildStainedGlassWindows() {
    const halfW = (CATHEDRAL.NAVE_WIDTH + CATHEDRAL.AISLE_WIDTH * 2) / 2 + CATHEDRAL.WALL_THICKNESS;
    const windowH = 5;
    const windowW = 2;
    const windowY = CATHEDRAL.NAVE_HEIGHT * 0.55;

    const glassColors = [COLORS.GLASS_RED, COLORS.GLASS_BLUE, COLORS.GLASS_AMBER, COLORS.GLASS_GREEN];

    let colorIdx = 0;
    for (let z = -4; z > -CATHEDRAL.NAVE_LENGTH + 4; z -= CATHEDRAL.PILLAR_SPACING) {
      for (const xSign of [-1, 1]) {
        const color = glassColors[colorIdx % glassColors.length];
        colorIdx++;

        const glassMat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.15,
          transparent: true,
          opacity: 0.4,
          roughness: 0.3,
          side: THREE.DoubleSide,
        });

        // Window frame
        const frameGeo = new THREE.BoxGeometry(0.15, windowH + 0.4, windowW + 0.4);
        const frame = new THREE.Mesh(frameGeo, this.stoneMidMat);
        frame.position.set(xSign * halfW, windowY, z);
        this.group.add(frame);

        // Glass pane
        const glassGeo = new THREE.PlaneGeometry(windowW, windowH);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(xSign * (halfW - 0.1), windowY, z);
        glass.rotation.y = Math.PI / 2;
        this.group.add(glass);

        // Mullion (cross divider)
        const mullionV = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, windowH, 0.08),
          this.ironMat
        );
        mullionV.position.set(xSign * (halfW - 0.05), windowY, z);
        this.group.add(mullionV);

        const mullionH = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.08, windowW),
          this.ironMat
        );
        mullionH.position.set(xSign * (halfW - 0.05), windowY, z);
        this.group.add(mullionH);
      }
    }
  }

  buildDecorations() {
    // Hanging chains along ceiling
    const chainMat = this.ironRustMat;
    for (let z = -10; z > -CATHEDRAL.NAVE_LENGTH + 10; z -= 15) {
      for (const xOff of [-3, 0, 3]) {
        this.createHangingChain(xOff, CATHEDRAL.CEILING_HEIGHT, z, 3 + Math.random() * 2, chainMat);
      }
    }

    // Rubble piles
    this.createRubblePile(-6, -25);
    this.createRubblePile(7, -45);
    this.createRubblePile(-3, -52);

    // Cobwebs (simple line geometry in corners)
    this.createCobweb(-CATHEDRAL.NAVE_WIDTH / 2 - CATHEDRAL.AISLE_WIDTH, 8, -8);
    this.createCobweb(CATHEDRAL.NAVE_WIDTH / 2 + CATHEDRAL.AISLE_WIDTH, 8, -30);
    this.createCobweb(-CATHEDRAL.NAVE_WIDTH / 2, CATHEDRAL.NAVE_HEIGHT - 1, -50);
  }

  createHangingChain(x, startY, z, length, material) {
    const links = Math.floor(length / 0.3);
    for (let i = 0; i < links; i++) {
      const linkGeo = new THREE.TorusGeometry(0.06, 0.015, 4, 6);
      const link = new THREE.Mesh(linkGeo, material);
      link.position.set(x, startY - i * 0.3, z);
      link.rotation.x = i % 2 === 0 ? 0 : Math.PI / 2;
      this.group.add(link);
    }
  }

  createRubblePile(x, z) {
    const rubbleMat = createStoneMaterial(COLORS.STONE_MID);
    for (let i = 0; i < 8; i++) {
      const size = randomRange(0.1, 0.4);
      const geo = new THREE.DodecahedronGeometry(size, 0);
      const rock = new THREE.Mesh(geo, rubbleMat);
      rock.position.set(
        x + randomRange(-1, 1),
        size / 2,
        z + randomRange(-1, 1)
      );
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rock.castShadow = true;
      this.group.add(rock);
    }
  }

  createCobweb(x, y, z) {
    const webMat = new THREE.LineBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.15,
    });

    const center = new THREE.Vector3(x, y, z);
    const spokes = 6;
    const radius = 1.2;

    for (let i = 0; i < spokes; i++) {
      const angle = (i / spokes) * Math.PI * 0.7;
      const end = new THREE.Vector3(
        x + Math.cos(angle) * radius * (0.5 + Math.random() * 0.5),
        y - Math.sin(angle) * radius * 0.3,
        z + Math.sin(angle) * radius * (0.5 + Math.random() * 0.5)
      );
      const points = [center, end];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(geo, webMat));
    }
  }

  buildTowerStaircase() {
    const towerX = -(CATHEDRAL.NAVE_WIDTH / 2 + CATHEDRAL.AISLE_WIDTH + CATHEDRAL.WALL_THICKNESS + CATHEDRAL.TOWER_SIZE / 2);
    const towerZ = -CATHEDRAL.NAVE_LENGTH + 5;
    const H = CATHEDRAL.TOWER_HEIGHT;

    // Tower walls
    const wallGeo = new THREE.BoxGeometry(CATHEDRAL.TOWER_SIZE, H, CATHEDRAL.WALL_THICKNESS);
    const sideGeo = new THREE.BoxGeometry(CATHEDRAL.WALL_THICKNESS, H, CATHEDRAL.TOWER_SIZE);

    for (const [geo, x, z] of [
      [wallGeo, towerX, towerZ - CATHEDRAL.TOWER_SIZE / 2],
      [wallGeo, towerX, towerZ + CATHEDRAL.TOWER_SIZE / 2],
      [sideGeo, towerX - CATHEDRAL.TOWER_SIZE / 2, towerZ],
    ]) {
      const wall = new THREE.Mesh(geo, this.stoneMat);
      wall.position.set(x, H / 2, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);
    }

    // Spiral staircase (simplified as ramp sections)
    const steps = 20;
    const stepGeo = new THREE.BoxGeometry(2, 0.2, 0.8);
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 4;
      const r = 1.5;
      const step = new THREE.Mesh(stepGeo, this.stoneMidMat);
      step.position.set(
        towerX + Math.cos(angle) * r * 0.5,
        i * 0.8 + 0.1,
        towerZ + Math.sin(angle) * r * 0.5
      );
      step.rotation.y = angle;
      step.castShadow = true;
      step.receiveShadow = true;
      this.group.add(step);
    }
  }

  buildTrapdoor() {
    // Trapdoor in the nave floor leading to crypt
    const tdX = 0;
    const tdZ = -30;

    // Trapdoor frame
    const frameGeo = new THREE.BoxGeometry(2.2, 0.15, 2.2);
    const frame = new THREE.Mesh(frameGeo, this.ironRustMat);
    frame.position.set(tdX, 0.08, tdZ);
    this.group.add(frame);

    // Trapdoor lid (interactive)
    const lidGeo = new THREE.BoxGeometry(1.8, 0.1, 1.8);
    const lid = new THREE.Mesh(lidGeo, this.woodMat);
    lid.position.set(tdX, 0.1, tdZ);
    lid.castShadow = true;
    lid.userData = { type: 'trapdoor', interactable: true };
    this.group.add(lid);

    // Iron ring handle
    const ringGeo = new THREE.TorusGeometry(0.12, 0.02, 6, 8);
    const ring = new THREE.Mesh(ringGeo, this.ironMat);
    ring.position.set(tdX, 0.2, tdZ);
    ring.rotation.x = Math.PI / 2;
    this.group.add(ring);

    this.interactables.push({
      mesh: lid,
      type: 'trapdoor',
      position: new THREE.Vector3(tdX, 0, tdZ),
    });
  }
}
