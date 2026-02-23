export class DeathScreen {
  constructor() {
    this.element = null;
    this.onRestart = null;
    this.messages = [
      'The darkness remembers your name.',
      'You were never meant to leave.',
      'The Hollow swallows all light.',
      'Even the stones forget you.',
      'It was always watching.',
      'There is no door. There never was.',
      'The candles mourn your passing.',
      'You have become part of the wall.',
    ];

    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'death-screen';
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
      transition: opacity 3s;
      cursor: default;
    `;

    this.element.innerHTML = `
      <div id="death-message" style="
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        color: #4a3525;
        letter-spacing: 0.2rem;
        text-align: center;
        max-width: 400px;
        line-height: 2;
        opacity: 0;
        transition: opacity 2s;
        transition-delay: 2s;
      "></div>

      <div id="death-restart" style="
        font-family: 'Cinzel', serif;
        font-size: 0.8rem;
        color: #2a2015;
        letter-spacing: 0.15rem;
        margin-top: 3rem;
        opacity: 0;
        transition: opacity 1s;
        transition-delay: 5s;
        cursor: pointer;
      ">descend again</div>
    `;

    document.body.appendChild(this.element);

    // Restart click handler
    this.element.querySelector('#death-restart').addEventListener('click', () => {
      if (this.onRestart) this.onRestart();
    });
  }

  show() {
    const msg = this.messages[Math.floor(Math.random() * this.messages.length)];
    document.getElementById('death-message').textContent = msg;

    // First: white flash
    this.element.style.background = '#fff';
    this.element.style.opacity = '1';
    this.element.style.pointerEvents = 'auto';

    // Then fade to black
    setTimeout(() => {
      this.element.style.transition = 'background 3s';
      this.element.style.background = '#000';
    }, 200);

    // Show message
    setTimeout(() => {
      document.getElementById('death-message').style.opacity = '1';
    }, 100);

    // Show restart
    setTimeout(() => {
      document.getElementById('death-restart').style.opacity = '1';
    }, 100);

    // Exit pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  hide() {
    this.element.style.opacity = '0';
    this.element.style.pointerEvents = 'none';
    this.element.style.transition = 'opacity 1s';
    document.getElementById('death-message').style.opacity = '0';
    document.getElementById('death-restart').style.opacity = '0';
  }
}
