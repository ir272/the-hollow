export class NoteReader {
  constructor() {
    this.element = null;
    this.isOpen = false;
    this.onClose = null;

    this.createElement();
    this.setupControls();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'note-reader';
    this.element.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.85);
      z-index: 50;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.5s;
    `;

    this.element.innerHTML = `
      <div style="
        max-width: 500px;
        padding: 40px 50px;
        background: linear-gradient(135deg, #2a2418 0%, #1e1a14 50%, #2a2418 100%);
        border: 1px solid rgba(196, 168, 112, 0.2);
        box-shadow: 0 0 60px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(0, 0, 0, 0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(138, 43, 43, 0.3), transparent);
        "></div>

        <h2 id="note-title" style="
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 700;
          color: #8a6b3a;
          letter-spacing: 0.1rem;
          margin-bottom: 1.5rem;
          text-align: center;
        "></h2>

        <p id="note-text" style="
          font-family: 'Crimson Text', serif;
          font-size: 0.95rem;
          line-height: 1.8;
          color: #b8a880;
          white-space: pre-wrap;
        "></p>

        <div style="
          margin-top: 2rem;
          text-align: center;
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          color: rgba(138, 107, 58, 0.4);
          letter-spacing: 0.15rem;
        ">[ESC or E to close]</div>

        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(138, 43, 43, 0.3), transparent);
        "></div>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.code === 'Escape' || e.code === 'KeyE') {
        this.close();
      }
    });
  }

  open(noteData) {
    this.isOpen = true;
    document.getElementById('note-title').textContent = noteData.title;
    document.getElementById('note-text').textContent = noteData.text;

    this.element.style.pointerEvents = 'auto';
    this.element.style.opacity = '1';
  }

  close() {
    this.isOpen = false;
    this.element.style.opacity = '0';
    this.element.style.pointerEvents = 'none';

    if (this.onClose) this.onClose();
  }
}
