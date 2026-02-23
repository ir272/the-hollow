import { SANITY } from '../utils/constants.js';
import { clamp, randomRange } from '../utils/math.js';

export class SanitySystem {
  constructor() {
    this.sanity = SANITY.MAX;
    this.targetSanity = SANITY.MAX;

    // Visual effect state
    this.shadowMovementTimer = 0;
    this.whisperTimer = randomRange(15, 30);
    this.fakeFootstepTimer = 0;
    this.hallucinationTimer = 0;

    // Events
    this.onWhisper = null;
    this.onFakeFootstep = null;
    this.onShadowMovement = null;
    this.onHallucination = null;
    this.onDeath = null;

    this.isDead = false;
  }

  update(dt, isInDarkness, isLookingAtWarden, isNearCandle, wardenProximity) {
    if (this.isDead) return;

    // Drain sources
    if (isInDarkness) {
      this.targetSanity -= SANITY.DARKNESS_DRAIN * dt;
    }
    if (isLookingAtWarden) {
      this.targetSanity -= SANITY.WARDEN_LOOK_DRAIN * dt;
    }

    // Restore sources
    if (isNearCandle) {
      this.targetSanity += SANITY.CANDLE_RESTORE * dt;
    }

    // Clamp
    this.targetSanity = clamp(this.targetSanity, 0, SANITY.MAX);

    // Smooth transition
    this.sanity += (this.targetSanity - this.sanity) * dt * 3;
    this.sanity = clamp(this.sanity, 0, SANITY.MAX);

    // Process sanity tier effects
    this.processTierEffects(dt);

    // Death check
    if (this.sanity <= 0.5) {
      this.isDead = true;
      if (this.onDeath) this.onDeath();
    }
  }

  processTierEffects(dt) {
    // Tier: Uneasy (50-75)
    if (this.sanity < SANITY.TIER_NORMAL) {
      this.whisperTimer -= dt;
      if (this.whisperTimer <= 0) {
        this.whisperTimer = randomRange(8, 20) * (this.sanity / 75);
        if (this.onWhisper) this.onWhisper();
        this.targetSanity -= SANITY.WHISPER_DRAIN;
      }

      // Occasional shadow movement
      this.shadowMovementTimer -= dt;
      if (this.shadowMovementTimer <= 0) {
        this.shadowMovementTimer = randomRange(10, 25);
        if (this.onShadowMovement) this.onShadowMovement();
      }
    }

    // Tier: Disturbed (25-50)
    if (this.sanity < SANITY.TIER_UNEASY) {
      // Fake footsteps
      this.fakeFootstepTimer -= dt;
      if (this.fakeFootstepTimer <= 0) {
        this.fakeFootstepTimer = randomRange(5, 15);
        if (this.onFakeFootstep) this.onFakeFootstep();
      }
    }

    // Tier: Madness (0-25)
    if (this.sanity < SANITY.TIER_DISTURBED) {
      this.hallucinationTimer -= dt;
      if (this.hallucinationTimer <= 0) {
        this.hallucinationTimer = randomRange(8, 20);
        if (this.onHallucination) this.onHallucination();
      }
    }
  }

  // Instant drain (artifact pickup, etc.)
  drain(amount) {
    this.targetSanity -= amount;
  }

  // Instant restore (note reading, etc.)
  restore(amount) {
    this.targetSanity += amount;
  }

  getTier() {
    if (this.sanity >= SANITY.TIER_NORMAL) return 'normal';
    if (this.sanity >= SANITY.TIER_UNEASY) return 'uneasy';
    if (this.sanity >= SANITY.TIER_DISTURBED) return 'disturbed';
    return 'madness';
  }

  getSanity() {
    return this.sanity;
  }

  reset() {
    this.sanity = SANITY.MAX;
    this.targetSanity = SANITY.MAX;
    this.isDead = false;
  }
}
