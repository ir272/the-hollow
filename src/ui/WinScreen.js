export class WinScreen {
  constructor() {
    this.element = null;
    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'win-screen';
    this.element.style.cssText = `
      position: fixed;
      inset: 0;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 200;
      opacity: 0;
      pointer-events: none;
      cursor: default;
    `;

    this.element.innerHTML = `
      <div style="
        text-align: center;
        opacity: 0;
        transition: opacity 3s;
        transition-delay: 3s;
      " id="win-content">
        <div style="
          width: 4px;
          height: 200px;
          background: linear-gradient(to bottom, rgba(255, 220, 150, 0.8), rgba(255, 220, 150, 0));
          margin: 0 auto 3rem;
        "></div>

        <h2 style="
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          color: #8a6b3a;
          letter-spacing: 0.3rem;
          margin-bottom: 1rem;
        ">YOU ESCAPED THE HOLLOW</h2>

        <p style="
          font-family: 'Crimson Text', serif;
          font-size: 0.85rem;
          color: #5a4a30;
          font-style: italic;
          margin-bottom: 3rem;
        ">...but something followed you out.</p>

        <div style="
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          color: #3a3020;
          letter-spacing: 0.2rem;
          line-height: 2.5;
        ">
          <div>THE HOLLOW</div>
          <div style="margin-top: 1rem; font-size: 0.6rem; color: #2a2015;">
            Built with Three.js<br>
            All audio synthesized — no samples used<br>
            All geometry hand-built — no models loaded
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  show() {
    // Bright light grows
    this.element.style.background = 'rgba(255, 240, 200, 0.02)';
    this.element.style.opacity = '1';
    this.element.style.pointerEvents = 'auto';

    // Slow fade to bright
    let brightness = 0;
    const fadeInterval = setInterval(() => {
      brightness += 0.005;
      if (brightness >= 1) {
        clearInterval(fadeInterval);
        this.element.style.background = '#000';
      } else {
        const r = Math.floor(255 * brightness);
        const g = Math.floor(240 * brightness);
        const b = Math.floor(200 * brightness);
        this.element.style.background = `rgb(${r},${g},${b})`;
      }
    }, 50);

    // Show credits
    setTimeout(() => {
      document.getElementById('win-content').style.opacity = '1';
    }, 100);

    // Exit pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }
}
