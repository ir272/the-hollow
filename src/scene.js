import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, VignetteEffect,
  ChromaticAberrationEffect, NoiseEffect, BlendFunction,
  BrightnessContrastEffect, HueSaturationEffect,
  ToneMappingEffect, ToneMappingMode } from 'postprocessing';
import { COLORS } from './utils/constants.js';

export class Scene {
  constructor() {
    // Renderer — disable tone mapping here, let postprocessing handle it
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050404);
    this.scene.fog = new THREE.FogExp2(COLORS.FOG, 0.018);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.1, 100
    );

    // Ambient light — enough to see the space
    this.ambientLight = new THREE.AmbientLight(0x444055, 0.6);
    this.scene.add(this.ambientLight);

    // Hemisphere light for top-down gradient
    this.hemiLight = new THREE.HemisphereLight(0x222240, 0x0a0808, 0.4);
    this.scene.add(this.hemiLight);

    // Post-processing
    this.setupPostProcessing();

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Effect parameters
    this.breathScale = 0;
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    });

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Vignette (subtle at start)
    this.vignetteEffect = new VignetteEffect({
      offset: 0.45,
      darkness: 0.35,
    });

    // Chromatic aberration
    this.chromaticEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0, 0),
      radialModulation: true,
      modulationOffset: 0.3,
    });

    // Film grain
    this.noiseEffect = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
    });

    // Brightness/contrast for sanity effects
    this.brightnessEffect = new BrightnessContrastEffect({
      brightness: 0,
      contrast: 0.05,
    });

    // Saturation control
    this.saturationEffect = new HueSaturationEffect({
      saturation: 0,
    });

    // Tone mapping — handles exposure in postprocessing pipeline
    this.toneEffect = new ToneMappingEffect({
      mode: ToneMappingMode.AGX,
    });

    // Pass 1: Tone mapping + vignette
    const effectPass1 = new EffectPass(
      this.camera,
      this.toneEffect,
      this.vignetteEffect,
    );

    // Pass 2: Chromatic aberration + grain + brightness
    const effectPass2 = new EffectPass(
      this.camera,
      this.chromaticEffect,
      this.noiseEffect,
      this.brightnessEffect,
      this.saturationEffect,
    );

    this.composer.addPass(effectPass1);
    this.composer.addPass(effectPass2);
  }

  // Called by sanity system to update visual effects
  updateEffects(sanity, wardenProximity, dt) {
    const t = performance.now() * 0.001;

    const sanityFactor = 1 - (sanity / 100);

    // Vignette: intensifies as sanity drops
    this.vignetteEffect.offset = 0.45 - sanityFactor * 0.25;
    this.vignetteEffect.darkness = 0.35 + sanityFactor * 0.55;

    // Chromatic aberration: warps with warden proximity + low sanity
    const chromaBase = wardenProximity * 0.003;
    const chromaSanity = sanityFactor * 0.002;
    const chromaPulse = Math.sin(t * 3) * 0.0005 * sanityFactor;
    const chromaTotal = chromaBase + chromaSanity + chromaPulse;
    this.chromaticEffect.offset.set(chromaTotal, chromaTotal * 0.7);

    // Desaturation as sanity drops
    this.saturationEffect.saturation = -sanityFactor * 0.6;

    // Brightness flickers at low sanity
    if (sanity < 25) {
      this.brightnessEffect.brightness = Math.sin(t * 7) * 0.05 - 0.05;
    } else {
      this.brightnessEffect.brightness = 0;
    }

    // Fog density increases with low sanity
    this.scene.fog.density = 0.018 + sanityFactor * 0.015;

    // Screen breathing (barely perceptible scale pulse)
    this.breathScale = Math.sin(t * 0.8) * 0.002 * (1 + sanityFactor);
  }

  render() {
    // Apply screen breathing via FOV
    const baseFov = 70;
    this.camera.fov = baseFov + this.breathScale * 5;
    this.camera.updateProjectionMatrix();

    this.composer.render();
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }
}
