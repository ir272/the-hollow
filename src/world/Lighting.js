import * as THREE from 'three';
import { LIGHTING, COLORS, CATHEDRAL } from '../utils/constants.js';
import { randomRange } from '../utils/math.js';

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.candles = [];
    this.stainedGlassLights = [];

    this.setupCandles();
    this.setupStainedGlassLights();
    this.setupPlayerLantern();
  }

  setupCandles() {
    // Candle positions throughout the cathedral
    const candlePositions = [
      // Altar candles
      { x: -1, y: 1.3, z: -CATHEDRAL.NAVE_LENGTH - 3, intensity: 1.2 },
      { x: 1, y: 1.3, z: -CATHEDRAL.NAVE_LENGTH - 3, intensity: 1.2 },
      { x: 0, y: 1.3, z: -CATHEDRAL.NAVE_LENGTH - 2.5, intensity: 1.0 },

      // Nave wall sconces
      ...this.generateWallSconces(),

      // Floor candelabras
      { x: -3, y: 1.5, z: -15, intensity: 0.9 },
      { x: 3, y: 1.5, z: -35, intensity: 0.9 },
      { x: 0, y: 1.5, z: -48, intensity: 0.8 },

      // Aisle candles
      { x: -10, y: 0.5, z: -12, intensity: 0.6 },
      { x: 10, y: 0.5, z: -28, intensity: 0.6 },
      { x: -10, y: 0.5, z: -40, intensity: 0.6 },

      // Chapel candles
      { x: -17, y: 0.8, z: -16, intensity: 0.7 },
      { x: 17, y: 0.8, z: -16, intensity: 0.7 },
      { x: -17, y: 0.8, z: -40, intensity: 0.7 },
      { x: 17, y: 0.8, z: -40, intensity: 0.7 },

      // Crypt candles (lower Y, positioned relative to crypt group)
      { x: 0, y: -4.5, z: -30 + -4, intensity: 0.5, isCrypt: true },
      { x: 0, y: -4.5, z: -30 + -15, intensity: 0.4, isCrypt: true },
      { x: 0, y: -4.5, z: -30 + -25, intensity: 0.3, isCrypt: true },
      { x: -5, y: -4.5, z: -30 + -8, intensity: 0.4, isCrypt: true },
      { x: 5, y: -4.5, z: -30 + -22, intensity: 0.4, isCrypt: true },
    ];

    candlePositions.forEach(pos => {
      this.createCandle(pos.x, pos.y, pos.z, pos.intensity);
    });
  }

  generateWallSconces() {
    const sconces = [];
    const halfW = CATHEDRAL.NAVE_WIDTH / 2 + CATHEDRAL.AISLE_WIDTH;
    const spacing = CATHEDRAL.PILLAR_SPACING;

    for (let z = -spacing; z > -CATHEDRAL.NAVE_LENGTH + 4; z -= spacing * 2) {
      sconces.push({ x: -halfW + 0.5, y: 3, z, intensity: 0.7 });
      sconces.push({ x: halfW - 0.5, y: 3, z, intensity: 0.7 });
    }

    return sconces;
  }

  createCandle(x, y, z, baseIntensity) {
    // Point light
    const light = new THREE.PointLight(
      COLORS.CANDLE_LIGHT,
      baseIntensity,
      LIGHTING.CANDLE_DISTANCE,
      2
    );
    light.position.set(x, y + 0.15, z);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = LIGHTING.CANDLE_DISTANCE;
    light.shadow.bias = -0.002;
    this.scene.add(light);

    // Candle geometry
    const candleGroup = new THREE.Group();

    // Wax body
    const waxGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.3, 6);
    const waxMat = new THREE.MeshStandardMaterial({
      color: COLORS.CANDLE_WAX,
      roughness: 0.7,
    });
    const wax = new THREE.Mesh(waxGeo, waxMat);
    wax.position.set(x, y - 0.15, z);
    wax.castShadow = true;
    this.scene.add(wax);

    // Flame (emissive sprite)
    const flameGeo = new THREE.SphereGeometry(0.03, 6, 6);
    flameGeo.scale(0.7, 1.5, 0.7);
    const flameMat = new THREE.MeshStandardMaterial({
      color: COLORS.CANDLE_FLAME,
      emissive: COLORS.CANDLE_FLAME,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y + 0.05, z);
    this.scene.add(flame);

    // Store candle data for flickering
    this.candles.push({
      light,
      flame,
      baseIntensity,
      flickerPhase: Math.random() * Math.PI * 2,
      flickerSpeed: randomRange(4, 12),
      flickerAmount: randomRange(0.2, 0.5),
      position: new THREE.Vector3(x, y, z),
    });
  }

  setupStainedGlassLights() {
    // Colored light shafts from stained glass windows
    const halfW = (CATHEDRAL.NAVE_WIDTH + CATHEDRAL.AISLE_WIDTH * 2) / 2 + CATHEDRAL.WALL_THICKNESS;
    const glassColors = [0x881111, 0x112255, 0x884411, 0x115522];

    let colorIdx = 0;
    for (let z = -4; z > -CATHEDRAL.NAVE_LENGTH + 4; z -= CATHEDRAL.PILLAR_SPACING) {
      for (const xSign of [-1, 1]) {
        const color = glassColors[colorIdx % glassColors.length];
        colorIdx++;

        // Spotlight simulating light shaft through window
        const shaft = new THREE.SpotLight(color, 0.3, 20, Math.PI / 6, 0.8, 2);
        shaft.position.set(xSign * halfW, CATHEDRAL.NAVE_HEIGHT * 0.55, z);
        shaft.target.position.set(xSign * (halfW - 4), 0, z);
        this.scene.add(shaft);
        this.scene.add(shaft.target);

        this.stainedGlassLights.push({
          light: shaft,
          baseIntensity: 0.3,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  setupPlayerLantern() {
    this.lanternLight = new THREE.PointLight(
      COLORS.LANTERN_LIGHT,
      LIGHTING.LANTERN_INTENSITY,
      LIGHTING.LANTERN_DISTANCE,
      2
    );
    this.lanternLight.castShadow = true;
    this.lanternLight.shadow.mapSize.width = LIGHTING.SHADOW_MAP_SIZE;
    this.lanternLight.shadow.mapSize.height = LIGHTING.SHADOW_MAP_SIZE;
    this.lanternLight.shadow.camera.near = 0.1;
    this.lanternLight.shadow.camera.far = LIGHTING.LANTERN_DISTANCE;
    this.lanternLight.shadow.bias = -0.002;
    this.scene.add(this.lanternLight);

    // Secondary fill light
    this.lanternFill = new THREE.PointLight(COLORS.LANTERN_LIGHT, 0.2, 6, 2);
    this.scene.add(this.lanternFill);

    this.lanternFlickerActive = false;
    this.lanternFlickerTimer = 0;
  }

  update(dt, camera, sanity) {
    const time = performance.now() * 0.001;

    // Update candle flickering
    this.candles.forEach(candle => {
      const flicker = Math.sin(time * candle.flickerSpeed + candle.flickerPhase)
        * candle.flickerAmount
        + Math.sin(time * candle.flickerSpeed * 2.7 + candle.flickerPhase * 1.3)
        * candle.flickerAmount * 0.3;

      candle.light.intensity = candle.baseIntensity * (1 + flicker);

      // Flame scale wobble
      candle.flame.scale.y = 1 + flicker * 0.3;
      candle.flame.scale.x = 1 - flicker * 0.1;
      candle.flame.position.x = candle.position.x + Math.sin(time * 8 + candle.flickerPhase) * 0.003;
    });

    // Update stained glass light variation
    this.stainedGlassLights.forEach(sg => {
      sg.light.intensity = sg.baseIntensity * (0.9 + Math.sin(time * 0.3 + sg.phase) * 0.1);
    });

    // Update player lantern
    this.updateLantern(dt, camera, sanity, time);
  }

  updateLantern(dt, camera, sanity, time) {
    // Position lantern at player's side
    const lanternOffset = new THREE.Vector3(0.3, -0.3, -0.5);
    lanternOffset.applyQuaternion(camera.quaternion);

    const targetPos = camera.position.clone().add(lanternOffset);

    // Smooth sway
    const swayX = Math.sin(time * LIGHTING.LANTERN_SWAY_SPEED) * LIGHTING.LANTERN_SWAY_AMOUNT;
    const swayY = Math.sin(time * LIGHTING.LANTERN_SWAY_SPEED * 1.3) * LIGHTING.LANTERN_SWAY_AMOUNT * 0.5;
    targetPos.x += swayX;
    targetPos.y += swayY;

    this.lanternLight.position.lerp(targetPos, 0.15);

    // Fill light follows camera
    this.lanternFill.position.copy(camera.position);

    // Lantern flicker based on sanity
    if (sanity < 50) {
      // Random flicker chance increases as sanity drops
      const flickerChance = (1 - sanity / 50) * 0.02;
      if (Math.random() < flickerChance && !this.lanternFlickerActive) {
        this.lanternFlickerActive = true;
        this.lanternFlickerTimer = randomRange(0.3, 1.5);
      }
    }

    if (this.lanternFlickerActive) {
      this.lanternFlickerTimer -= dt;
      const flickerValue = Math.random() * 0.5;
      this.lanternLight.intensity = LIGHTING.LANTERN_INTENSITY * flickerValue;
      this.lanternFill.intensity = 0.05;

      if (this.lanternFlickerTimer <= 0) {
        this.lanternFlickerActive = false;
        this.lanternLight.intensity = LIGHTING.LANTERN_INTENSITY;
        this.lanternFill.intensity = 0.2;
      }
    } else {
      // Normal subtle fluctuation
      const normalFlicker = 1 + Math.sin(time * 6) * 0.05 + Math.sin(time * 13) * 0.02;
      this.lanternLight.intensity = LIGHTING.LANTERN_INTENSITY * normalFlicker;
    }
  }

  // Check if a position is near any candle light source
  isNearLight(position, threshold = 8) {
    for (const candle of this.candles) {
      if (position.distanceTo(candle.position) < threshold) {
        return true;
      }
    }
    return false;
  }
}
