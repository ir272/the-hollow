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
    // Key candle positions — only a few cast shadows
    const candlePositions = [
      // Altar candles (shadow on center one only)
      { x: -1, y: 1.3, z: -CATHEDRAL.NAVE_LENGTH - 3, intensity: 2.0, shadow: false },
      { x: 1, y: 1.3, z: -CATHEDRAL.NAVE_LENGTH - 3, intensity: 2.0, shadow: false },
      { x: 0, y: 1.3, z: -CATHEDRAL.NAVE_LENGTH - 2.5, intensity: 2.5, shadow: true },

      // Nave candelabras — key shadow casters
      { x: -3, y: 1.5, z: -10, intensity: 2.0, shadow: true },
      { x: 3, y: 1.5, z: -25, intensity: 2.0, shadow: true },
      { x: -3, y: 1.5, z: -40, intensity: 2.0, shadow: true },
      { x: 3, y: 1.5, z: -52, intensity: 1.8, shadow: true },

      // Wall sconces — no shadows (too many)
      ...this.generateWallSconces(),

      // Aisle candles
      { x: -10, y: 0.8, z: -12, intensity: 1.5, shadow: false },
      { x: 10, y: 0.8, z: -20, intensity: 1.5, shadow: false },
      { x: -10, y: 0.8, z: -32, intensity: 1.5, shadow: false },
      { x: 10, y: 0.8, z: -44, intensity: 1.5, shadow: false },

      // Chapel candles
      { x: -17, y: 0.8, z: -16, intensity: 1.5, shadow: false },
      { x: 17, y: 0.8, z: -16, intensity: 1.5, shadow: false },
      { x: -17, y: 0.8, z: -40, intensity: 1.5, shadow: false },
      { x: 17, y: 0.8, z: -40, intensity: 1.5, shadow: false },

      // Crypt candles
      { x: 0, y: -4.5, z: -34, intensity: 1.2, shadow: true },
      { x: 0, y: -4.5, z: -45, intensity: 1.0, shadow: false },
      { x: 0, y: -4.5, z: -55, intensity: 0.8, shadow: false },
      { x: -5, y: -4.5, z: -38, intensity: 1.0, shadow: false },
      { x: 5, y: -4.5, z: -52, intensity: 1.0, shadow: false },
    ];

    candlePositions.forEach(pos => {
      this.createCandle(pos.x, pos.y, pos.z, pos.intensity, pos.shadow || false);
    });
  }

  generateWallSconces() {
    const sconces = [];
    const halfW = CATHEDRAL.NAVE_WIDTH / 2 + CATHEDRAL.AISLE_WIDTH;
    const spacing = CATHEDRAL.PILLAR_SPACING;

    for (let z = -spacing; z > -CATHEDRAL.NAVE_LENGTH + 4; z -= spacing * 2) {
      sconces.push({ x: -halfW + 0.5, y: 3, z, intensity: 1.5, shadow: false });
      sconces.push({ x: halfW - 0.5, y: 3, z, intensity: 1.5, shadow: false });
    }

    return sconces;
  }

  createCandle(x, y, z, baseIntensity, castShadow) {
    // Point light
    const light = new THREE.PointLight(
      COLORS.CANDLE_LIGHT,
      baseIntensity,
      LIGHTING.CANDLE_DISTANCE,
      1.5
    );
    light.position.set(x, y + 0.15, z);

    // Only select candles cast shadows (max ~5 total)
    if (castShadow) {
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = LIGHTING.CANDLE_DISTANCE;
      light.shadow.bias = -0.003;
    }

    this.scene.add(light);

    // Wax body
    const waxGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.3, 6);
    const waxMat = new THREE.MeshStandardMaterial({
      color: COLORS.CANDLE_WAX,
      roughness: 0.7,
    });
    const wax = new THREE.Mesh(waxGeo, waxMat);
    wax.position.set(x, y - 0.15, z);
    this.scene.add(wax);

    // Flame (emissive)
    const flameGeo = new THREE.SphereGeometry(0.04, 6, 6);
    flameGeo.scale(0.7, 1.5, 0.7);
    const flameMat = new THREE.MeshStandardMaterial({
      color: COLORS.CANDLE_FLAME,
      emissive: COLORS.CANDLE_FLAME,
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.9,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y + 0.05, z);
    this.scene.add(flame);

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
    // Colored light shafts from stained glass — NO shadows
    const innerWall = (CATHEDRAL.NAVE_WIDTH + CATHEDRAL.AISLE_WIDTH * 2) / 2;
    const glassColors = [0x881111, 0x112255, 0x884411, 0x115522];

    let colorIdx = 0;
    for (let z = -4; z > -CATHEDRAL.NAVE_LENGTH + 4; z -= CATHEDRAL.PILLAR_SPACING) {
      for (const xSign of [-1, 1]) {
        const color = glassColors[colorIdx % glassColors.length];
        colorIdx++;

        const shaft = new THREE.SpotLight(color, 1.2, 25, Math.PI / 5, 0.7, 1.5);
        shaft.position.set(xSign * innerWall, CATHEDRAL.NAVE_HEIGHT * 0.55, z);
        shaft.target.position.set(xSign * (innerWall - xSign * 5), 0, z);
        // NO shadow casting on these
        this.scene.add(shaft);
        this.scene.add(shaft.target);

        this.stainedGlassLights.push({
          light: shaft,
          baseIntensity: 1.0,
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
      1.5
    );
    this.lanternLight.castShadow = true;
    this.lanternLight.shadow.mapSize.width = LIGHTING.SHADOW_MAP_SIZE;
    this.lanternLight.shadow.mapSize.height = LIGHTING.SHADOW_MAP_SIZE;
    this.lanternLight.shadow.camera.near = 0.1;
    this.lanternLight.shadow.camera.far = LIGHTING.LANTERN_DISTANCE;
    this.lanternLight.shadow.bias = -0.003;
    this.scene.add(this.lanternLight);

    // Secondary fill light (no shadow)
    this.lanternFill = new THREE.PointLight(COLORS.LANTERN_LIGHT, 0.6, 12, 1.5);
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
      this.lanternFill.intensity = 0.1;

      if (this.lanternFlickerTimer <= 0) {
        this.lanternFlickerActive = false;
        this.lanternLight.intensity = LIGHTING.LANTERN_INTENSITY;
        this.lanternFill.intensity = 0.4;
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
