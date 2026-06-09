const EFFECTS = {
  bingo: ['papapupipupupupu.opus'],
  logout: ['skatina.opus'],
};

const FADE_DURATION = 150;

class SfxManager {
  constructor() {
    this._pool = new Map();
    this._volume = 1;
    this._muted = false;
    this._currentSfx = null;
    this._fadeTimer = null;
  }

  init(audioManager) {
    this._audioManager = audioManager;
    for (const [action, files] of Object.entries(EFFECTS)) {
      const audios = files.map(f => {
        const a = new Audio(`effects/${f}`);
        a.preload = 'auto';
        return a;
      });
      this._pool.set(action, audios);
    }
  }

  play(action) {
    const audios = this._pool.get(action);
    if (!audios?.length) return;
    if (this._muted) return;

    if (this._currentSfx) {
      this._fadeOut(this._currentSfx);
      this._currentSfx = null;
    }

    const src = audios[Math.floor(Math.random() * audios.length)];
    const clone = src.cloneNode();
    clone.volume = 0;
    this._currentSfx = clone;
    this._fadeIn(clone, this._volume);
    clone.play().catch(() => {});
  }

  _fadeOut(audio) {
    const startVol = audio.volume;
    const steps = FADE_DURATION / 16;
    const stepVol = startVol / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const newVol = Math.max(0, startVol - stepVol * current);
      audio.volume = newVol;
      if (current >= steps) {
        clearInterval(timer);
        audio.pause();
      }
    }, 16);
  }

  _fadeIn(audio, targetVol) {
    if (this._fadeTimer) {
      clearInterval(this._fadeTimer);
      this._fadeTimer = null;
    }

    const steps = FADE_DURATION / 16;
    const stepVol = targetVol / steps;
    let current = 0;

    this._fadeTimer = setInterval(() => {
      current++;
      const newVol = Math.min(targetVol, stepVol * current);
      audio.volume = newVol;
      if (current >= steps) {
        clearInterval(this._fadeTimer);
        this._fadeTimer = null;
      }
    }, 16);
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._currentSfx) {
      this._currentSfx.volume = this._volume;
    }
  }

  setMuted(m) {
    this._muted = !!m;
    if (m && this._currentSfx) {
      if (this._fadeTimer) {
        clearInterval(this._fadeTimer);
        this._fadeTimer = null;
      }
      this._currentSfx.pause();
      this._currentSfx = null;
    }
  }
}

export const sfxManager = new SfxManager();
