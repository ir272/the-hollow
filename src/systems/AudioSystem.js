import { clamp, randomRange } from '../utils/math.js';

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;

    // Persistent audio nodes
    this.ambientDrone = null;
    this.heartbeat = null;
    this.wardenHum = null;
    this.windNode = null;

    // State
    this.heartbeatRate = 60;
    this.heartbeatIntensity = 0;
    this.wardenHumGain = null;

    // Scheduled events
    this.nextFootstepTime = 0;
    this.footstepPhase = false;
  }

  async init() {
    if (this.initialized) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);

    this.startAmbientDrone();
    this.startWind();
    this.setupHeartbeat();
    this.setupWardenHum();

    this.initialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // === AMBIENT DRONE ===
  startAmbientDrone() {
    // Low evolving bass tone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 40;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 41.5; // Slight detune for beating

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sawtooth';
    osc3.frequency.value = 80;

    // Filter to darken sawtooth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;
    filter.Q.value = 2;

    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.08;

    osc1.connect(droneGain);
    osc2.connect(droneGain);
    osc3.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc3.start();

    // Slow LFO on filter
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.ambientDrone = { osc1, osc2, osc3, droneGain };
  }

  // === WIND ===
  startWind() {
    // Filtered noise for wind
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 300;
    windFilter.Q.value = 0.5;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.015;

    // LFO for wind gusts
    const windLfo = this.ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.15;
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.value = 0.01;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windGain.gain);
    windLfo.start();

    noise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    noise.start();

    this.windNode = { noise, windGain, windFilter };
  }

  // === HEARTBEAT ===
  setupHeartbeat() {
    this.heartbeatGain = this.ctx.createGain();
    this.heartbeatGain.gain.value = 0;
    this.heartbeatGain.connect(this.masterGain);
    this.lastHeartbeatTime = 0;
  }

  playHeartbeat() {
    const now = this.ctx.currentTime;

    // Double thump
    for (const offset of [0, 0.12]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, now + offset);
      osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.15);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.heartbeatIntensity, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);

      osc.connect(gain);
      gain.connect(this.heartbeatGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.25);
    }
  }

  // === WARDEN HUM ===
  setupWardenHum() {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 82.5; // Fifth above

    this.wardenHumGain = this.ctx.createGain();
    this.wardenHumGain.gain.value = 0;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(this.wardenHumGain);
    this.wardenHumGain.connect(this.masterGain);

    osc.start();
    osc2.start();

    // Tremolo
    const tremolo = this.ctx.createOscillator();
    tremolo.type = 'sine';
    tremolo.frequency.value = 4;
    const tremoloGain = this.ctx.createGain();
    tremoloGain.gain.value = 0.02;
    tremolo.connect(tremoloGain);
    tremoloGain.connect(this.wardenHumGain.gain);
    tremolo.start();
  }

  // === FOOTSTEPS ===
  playFootstep() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    // Stone impact sound
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = randomRange(600, 1200);
    filter.Q.value = 1;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Pitch variation
    source.playbackRate.value = randomRange(0.8, 1.2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  // === WHISPER ===
  playWhisper() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const duration = randomRange(1, 3);

    // Bandpass-filtered noise shaped to sound voice-like
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate shaped noise
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Amplitude envelope: fade in, sustain, fade out
      const env = Math.sin(t * Math.PI) * 0.7 + 0.3;
      // Add periodicity to make it sound speech-like
      const periodicity = Math.sin(i / 80) * 0.5 + 0.5;
      data[i] = (Math.random() * 2 - 1) * env * periodicity;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Formant-like filters
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = randomRange(200, 500);
    f1.Q.value = 4;

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = randomRange(1500, 3000);
    f2.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.04, now + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    // Pan randomly
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = randomRange(-0.8, 0.8);

    source.connect(f1);
    source.connect(f2);
    f1.connect(gain);
    f2.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    source.start(now);
    source.stop(now + duration);
  }

  // === JUMP SCARE STING ===
  playJumpScare() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    // Sharp high frequency burst
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 200;

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.8);
    osc2.start(now);
    osc2.stop(now + 0.6);
  }

  // === PICKUP SOUND ===
  playPickup() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    // Ethereal chime
    for (const freq of [440, 660, 880]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + (freq - 440) * 0.0005);
      osc.stop(now + 1.5);
    }
  }

  // === NOTE READING AMBIENCE ===
  playNoteAmbience() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 220;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);

    return { osc, gain }; // Caller stops when done
  }

  // === UPDATE LOOP ===
  update(dt, sanity, wardenProximity, playerIsMoving) {
    if (!this.initialized) return;

    const now = this.ctx.currentTime;

    // Heartbeat based on sanity
    if (sanity < 75) {
      this.heartbeatIntensity = (1 - sanity / 75) * 0.3;
      this.heartbeatGain.gain.value = 1;

      // Rate increases as sanity drops
      this.heartbeatRate = 60 + (1 - sanity / 75) * 80; // 60-140 BPM
      const interval = 60 / this.heartbeatRate;

      if (now - this.lastHeartbeatTime > interval) {
        this.playHeartbeat();
        this.lastHeartbeatTime = now;
      }
    } else {
      this.heartbeatGain.gain.value = 0;
    }

    // Warden hum based on proximity
    if (this.wardenHumGain) {
      const targetGain = wardenProximity * 0.15;
      this.wardenHumGain.gain.linearRampToValueAtTime(targetGain, now + 0.1);
    }

    // Footstep sounds
    if (playerIsMoving) {
      if (now > this.nextFootstepTime) {
        this.playFootstep();
        this.nextFootstepTime = now + randomRange(0.45, 0.55);
      }
    }
  }
}
