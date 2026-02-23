export class HUD {
  constructor() {
    this.container = document.getElementById('game-ui');
    this.buildHUD();

    this.heartbeatPhase = 0;
    this.lastSanity = 100;
  }

  buildHUD() {
    this.container.innerHTML = `
      <div id="hud-sanity" style="
        position: fixed;
        bottom: 30px;
        left: 30px;
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.5s;
      ">
        <div id="heartbeat-icon" style="
          width: 20px;
          height: 20px;
          position: relative;
        ">
          <svg viewBox="0 0 24 24" fill="none" style="width: 100%; height: 100%;">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#8a2b2b" opacity="0.8"/>
          </svg>
        </div>
      </div>

      <div id="hud-artifacts" style="
        position: fixed;
        bottom: 30px;
        right: 30px;
        display: flex;
        gap: 12px;
      ">
        ${[0,1,2,3].map(i => `
          <div class="artifact-slot" id="artifact-slot-${i}" style="
            width: 24px;
            height: 24px;
            border: 1px solid rgba(200, 180, 150, 0.15);
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.3);
            transition: all 0.5s;
          "></div>
        `).join('')}
      </div>

      <div id="hud-note-prompt" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Cinzel', serif;
        font-size: 0.75rem;
        color: rgba(200, 180, 150, 0.4);
        letter-spacing: 0.15rem;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
      "></div>
    `;
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }

  update(dt, sanity) {
    // Heartbeat icon visibility + animation
    const heartEl = document.getElementById('hud-sanity');
    const iconEl = document.getElementById('heartbeat-icon');

    if (sanity < 90) {
      heartEl.style.opacity = String(Math.min(1, (90 - sanity) / 20));

      // Pulse animation tied to sanity
      const rate = 1 + (1 - sanity / 100) * 3; // faster as sanity drops
      this.heartbeatPhase += dt * rate * Math.PI * 2;
      const pulse = Math.sin(this.heartbeatPhase);
      const scale = 1 + Math.max(0, pulse) * 0.3 * (1 - sanity / 100);
      iconEl.style.transform = `scale(${scale})`;

      // Color shift at low sanity
      if (sanity < 30) {
        const svg = iconEl.querySelector('path');
        if (svg) {
          const r = Math.floor(138 + (1 - sanity / 30) * 60);
          const g = Math.floor(43 * (sanity / 30));
          const b = Math.floor(43 * (sanity / 30));
          svg.setAttribute('fill', `rgb(${r},${g},${b})`);
        }
      }
    } else {
      heartEl.style.opacity = '0';
    }

    this.lastSanity = sanity;
  }

  collectArtifact(index) {
    const slot = document.getElementById(`artifact-slot-${index}`);
    if (slot) {
      slot.style.background = 'rgba(138, 43, 43, 0.6)';
      slot.style.borderColor = 'rgba(204, 136, 68, 0.8)';
      slot.style.boxShadow = '0 0 10px rgba(204, 136, 68, 0.4)';

      // Flash animation
      slot.style.transform = 'scale(1.5)';
      setTimeout(() => {
        slot.style.transform = 'scale(1)';
      }, 300);
    }
  }

  showInteractPrompt(text) {
    const el = document.getElementById('interact-prompt');
    el.textContent = text;
    el.style.opacity = '1';
  }

  hideInteractPrompt() {
    const el = document.getElementById('interact-prompt');
    el.style.opacity = '0';
  }
}
