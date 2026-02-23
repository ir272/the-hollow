import * as THREE from 'three';
import { Scene } from './scene.js';
import { Cathedral } from './world/Cathedral.js';
import { Crypt } from './world/Crypt.js';
import { Lighting } from './world/Lighting.js';
import { Particles } from './world/Particles.js';
import { Player } from './entities/Player.js';
import { Warden } from './entities/Warden.js';
import { SanitySystem } from './systems/SanitySystem.js';
import { AudioSystem } from './systems/AudioSystem.js';
import { ArtifactSystem } from './systems/ArtifactSystem.js';
import { LoreSystem } from './systems/LoreSystem.js';
import { HUD } from './ui/HUD.js';
import { NoteReader } from './ui/NoteReader.js';
import { DeathScreen } from './ui/DeathScreen.js';
import { WinScreen } from './ui/WinScreen.js';
import { GAME_STATE, SANITY, PLAYER as PLAYER_CONST } from './utils/constants.js';
import { distance2D } from './utils/math.js';

// ============================================================
// GAME STATE
// ============================================================
window.gameState = GAME_STATE.LOADING;

let scene, cathedral, crypt, lighting, particles;
let player, warden;
let sanitySystem, audioSystem, artifactSystem, loreSystem;
let hud, noteReader, deathScreen, winScreen;
let clock;
let wardenActivated = false;
let allArtifactsCollected = false;
let hallucinationWardens = [];
let gameLoopRunning = false;

// ============================================================
// INIT
// ============================================================
async function init() {
  updateLoadBar(10);

  // Scene + renderer + post-processing
  scene = new Scene();
  clock = new THREE.Clock();
  updateLoadBar(20);

  // World geometry
  cathedral = new Cathedral(scene.scene);
  updateLoadBar(40);

  crypt = new Crypt(scene.scene);
  updateLoadBar(50);

  // Merge colliders
  const allColliders = [...cathedral.colliders, ...crypt.colliders];

  // Lighting
  lighting = new Lighting(scene.scene);
  updateLoadBar(60);

  // Particles
  particles = new Particles(scene.scene);
  updateLoadBar(65);

  // Player
  player = new Player(scene.camera, allColliders);
  updateLoadBar(70);

  // Warden
  warden = new Warden(scene.scene);
  updateLoadBar(75);

  // Systems
  sanitySystem = new SanitySystem();
  audioSystem = new AudioSystem();
  artifactSystem = new ArtifactSystem(scene.scene);
  loreSystem = new LoreSystem(scene.scene);
  updateLoadBar(85);

  // UI
  hud = new HUD();
  noteReader = new NoteReader();
  deathScreen = new DeathScreen();
  winScreen = new WinScreen();
  updateLoadBar(90);

  // Wire up callbacks
  wireCallbacks();
  updateLoadBar(95);

  // Setup interact key
  setupInteraction();

  updateLoadBar(100);

  // Start the render loop immediately (renders behind loading/menu screens)
  gameLoopRunning = true;
  gameLoop();

  // Fade out loading screen
  await delay(500);
  const loadingEl = document.getElementById('loading');
  loadingEl.style.opacity = '0';
  await delay(1000);
  loadingEl.style.display = 'none';

  // Show title screen
  window.gameState = GAME_STATE.MENU;
  const blockerEl = document.getElementById('blocker');
  blockerEl.addEventListener('click', startGame);

  // Expose for debugging
  window.startGame = startGame;
}

function startGame() {
  if (window.gameState === GAME_STATE.PLAYING) return;

  const blockerEl = document.getElementById('blocker');
  blockerEl.removeEventListener('click', startGame);

  // Init audio on user gesture (must happen in click handler)
  audioSystem.init();

  // Request pointer lock
  try {
    document.body.requestPointerLock();
  } catch (e) {
    // Will be acquired on next click
  }

  // Slow fade out of title
  blockerEl.style.transition = 'opacity 3s';
  blockerEl.style.opacity = '0';

  // Create wake-up overlay for cinematic fade-in
  const wakeUp = document.createElement('div');
  wakeUp.id = 'wake-up';
  wakeUp.style.cssText = `
    position: fixed;
    inset: 0;
    background: #000;
    z-index: 90;
    pointer-events: none;
    transition: opacity 4s ease-out;
  `;
  document.body.appendChild(wakeUp);

  // Start playing (game loop already running)
  window.gameState = GAME_STATE.PLAYING;
  hud.show();

  // Slow fade from black — "you wake up"
  setTimeout(() => {
    wakeUp.style.opacity = '0';
  }, 500);

  setTimeout(() => {
    blockerEl.style.display = 'none';
    wakeUp.remove();
  }, 5000);
}

// ============================================================
// CALLBACKS
// ============================================================
function wireCallbacks() {
  // Sanity events
  sanitySystem.onWhisper = () => {
    audioSystem.playWhisper();
  };

  sanitySystem.onFakeFootstep = () => {
    audioSystem.playFootstep();
  };

  sanitySystem.onShadowMovement = () => {
    // Brief light flicker
    if (lighting.candles.length > 0) {
      const randomCandle = lighting.candles[Math.floor(Math.random() * lighting.candles.length)];
      const origIntensity = randomCandle.baseIntensity;
      randomCandle.baseIntensity = 0.05;
      setTimeout(() => { randomCandle.baseIntensity = origIntensity; }, 500);
    }
  };

  sanitySystem.onHallucination = () => {
    // Spawn hallucination warden near player
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 5;
    const pos = new THREE.Vector3(
      player.position.x + Math.cos(angle) * dist,
      0,
      player.position.z + Math.sin(angle) * dist
    );
    const hallucination = warden.createHallucination(pos);
    hallucinationWardens.push(hallucination);
  };

  sanitySystem.onDeath = () => {
    window.gameState = GAME_STATE.DEATH;
    deathScreen.show();
    hud.hide();
  };

  // Artifact events
  artifactSystem.onCollect = (index, name) => {
    hud.collectArtifact(index);
    audioSystem.playPickup();
    sanitySystem.drain(SANITY.ARTIFACT_DRAIN);

    // Scripted horror: lights flicker, warden appears nearby
    triggerScriptedHorror();

    // Activate warden after first artifact
    if (!wardenActivated) {
      wardenActivated = true;
      const spawnDist = 15;
      const angle = Math.random() * Math.PI * 2;
      warden.activate(new THREE.Vector3(
        player.position.x + Math.cos(angle) * spawnDist,
        0,
        player.position.z + Math.sin(angle) * spawnDist
      ));
    }
  };

  artifactSystem.onAllCollected = () => {
    allArtifactsCollected = true;
  };

  // Lore events
  loreSystem.onNoteRead = (noteData) => {
    window.gameState = GAME_STATE.NOTE_READING;
    noteReader.open(noteData);
    sanitySystem.restore(SANITY.NOTE_RESTORE);
    audioSystem.playPickup();
  };

  noteReader.onClose = () => {
    window.gameState = GAME_STATE.PLAYING;
    loreSystem.closeNote();
    document.body.requestPointerLock();
  };

  // Death restart
  deathScreen.onRestart = () => {
    restartGame();
  };
}

function triggerScriptedHorror() {
  // Kill all candles briefly
  const savedIntensities = lighting.candles.map(c => c.baseIntensity);
  lighting.candles.forEach(c => { c.baseIntensity = 0; });

  // Jump scare audio
  audioSystem.playJumpScare();

  // Whisper after delay
  setTimeout(() => {
    audioSystem.playWhisper();
  }, 800);

  // Restore candles slowly
  setTimeout(() => {
    lighting.candles.forEach((c, i) => {
      c.baseIntensity = savedIntensities[i];
    });
  }, 2500);
}

function restartGame() {
  deathScreen.hide();
  sanitySystem.reset();
  warden.deactivate();
  wardenActivated = false;
  allArtifactsCollected = false;

  // Reset player position
  player.position.set(0, PLAYER_CONST.HEIGHT, -5);
  player.yaw = 0;
  player.pitch = 0;

  // Clean up hallucinations
  hallucinationWardens.forEach(h => {
    h.deactivate();
    scene.scene.remove(h.mesh);
  });
  hallucinationWardens = [];

  window.gameState = GAME_STATE.PLAYING;
  hud.show();

  setTimeout(() => {
    document.body.requestPointerLock();
  }, 500);
}

// ============================================================
// INTERACTION
// ============================================================
function setupInteraction() {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE') {
      if (window.gameState === GAME_STATE.NOTE_READING) {
        noteReader.close();
        return;
      }

      if (window.gameState !== GAME_STATE.PLAYING) return;

      const pos = player.getPosition();

      // Try artifact pickup
      const artifact = artifactSystem.tryCollect(pos);
      if (artifact) return;

      // Try note reading
      const note = loreSystem.tryRead(pos);
      if (note) return;

      // Try exit (if all artifacts collected, near back wall)
      if (allArtifactsCollected) {
        if (pos.z > -2 && Math.abs(pos.x) < 3) {
          window.gameState = GAME_STATE.WIN;
          winScreen.show();
          hud.hide();
        }
      }
    }
  });
}

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop() {
  if (!gameLoopRunning) return;
  requestAnimationFrame(gameLoop);

  const dt = Math.min(clock.getDelta(), 0.1); // Cap delta time

  if (window.gameState === GAME_STATE.PLAYING) {
    // Player update
    player.update(dt);
    const playerPos = player.getPosition();

    // Check if player is in darkness
    const isInDarkness = !lighting.isNearLight(playerPos, 8);

    // Check if looking at warden
    let isLookingAtWarden = false;
    if (warden.active && !warden.isHallucination) {
      const lookDir = player.getLookDirection();
      const toWarden = new THREE.Vector3(
        warden.position.x - playerPos.x,
        0,
        warden.position.z - playerPos.z
      ).normalize();
      const dot = lookDir.dot(toWarden);
      isLookingAtWarden = dot > 0.7 && warden.distanceToPlayer < 20;
    }

    // Is near candle
    const isNearCandle = lighting.isNearLight(playerPos, 6);

    // Warden proximity
    const wardenProximity = warden.getProximityFactor();

    // Update systems
    sanitySystem.update(dt, isInDarkness, isLookingAtWarden, isNearCandle, wardenProximity);
    const sanity = sanitySystem.getSanity();

    // Update warden
    warden.update(dt, playerPos, player.isMoving, player.isCrouching);

    // Warden kill check
    if (warden.active && warden.isNearPlayer()) {
      sanitySystem.drain(100);
    }

    // Update world systems
    lighting.update(dt, scene.camera, sanity);
    particles.update(dt, playerPos);
    artifactSystem.update(dt, playerPos);

    // Update hallucination wardens
    hallucinationWardens = hallucinationWardens.filter(h => {
      h.update(dt, playerPos, false, false);
      return h.active;
    });

    // Audio update
    audioSystem.resume();
    audioSystem.update(dt, sanity, wardenProximity, player.isMoving);

    // Post-processing effects
    scene.updateEffects(sanity, wardenProximity, dt);

    // HUD
    hud.update(dt, sanity);

    // Interact prompts
    updateInteractPrompts(playerPos);

    // Warden breath particles
    if (warden.active && warden.distanceToPlayer < 15) {
      if (!particles.wardenBreath || Math.random() < dt * 0.5) {
        particles.createWardenBreathEffect(warden.position);
      }
    }
  }

  // Always render (even during menu — shows scene behind blocker)
  scene.render();
}

function updateInteractPrompts(playerPos) {
  const nearestArtifact = artifactSystem.getNearest(playerPos);
  const nearestNote = loreSystem.getNearest(playerPos);

  let showPrompt = false;

  if (nearestArtifact && nearestArtifact.distance < PLAYER_CONST.INTERACT_DISTANCE) {
    hud.showInteractPrompt(`[E] Take ${nearestArtifact.artifact.def.name}`);
    showPrompt = true;
  } else if (nearestNote && nearestNote.distance < PLAYER_CONST.INTERACT_DISTANCE) {
    hud.showInteractPrompt('[E] Read Note');
    showPrompt = true;
  } else if (allArtifactsCollected && playerPos.z > -2 && Math.abs(playerPos.x) < 3) {
    hud.showInteractPrompt('[E] Open the Door');
    showPrompt = true;
  }

  if (!showPrompt) {
    hud.hideInteractPrompt();
  }
}

// ============================================================
// HELPERS
// ============================================================
function updateLoadBar(percent) {
  const bar = document.getElementById('load-bar');
  if (bar) bar.style.width = percent + '%';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// START
// ============================================================
init();
