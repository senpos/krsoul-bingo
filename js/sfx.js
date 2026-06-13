const EFFECTS = {
  bingo: ['papapupipupupupu.opus'],
  logout: ['skatina.opus'],
  login: ['ah.opus'],
  skoka: ['skoka.opus'],
  videoChange: ['nashotiktok.opus', 'swipeup.opus'],
  pigeon: ['pigeon.opus'],
};

const FADE_DURATION = 0.15;

class SfxManager {
  constructor() {
    this._ctx = null;
    this._gain = null;
    this._buffers = new Map();
    this._volume = 1;
    this._muted = false;
    this._currentSource = null;
    this._blockingSource = null;
    this._loaded = false;
  }

  async init(audioManager) {
    this._audioManager = audioManager;
    await this._loadBuffers();
  }

  async _loadBuffers() {
    if (this._loaded) return;
    for (const [action, files] of Object.entries(EFFECTS)) {
      const buffers = [];
      for (const f of files) {
        try {
          const resp = await fetch(`effects/${f}`);
          const arr = await resp.arrayBuffer();
          const ctx = this._ensureCtx();
          const buf = await ctx.decodeAudioData(arr);
          buffers.push(buf);
        } catch {}
      }
      this._buffers.set(action, buffers);
    }
    this._loaded = true;
  }

  _ensureCtx() {
    if (this._ctx) return this._ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this._ctx = new AC();
    this._gain = this._ctx.createGain();
    this._gain.gain.value = this._muted ? 0 : this._volume;
    this._gain.connect(this._ctx.destination);
    return this._ctx;
  }

  _resumeCtx() {
    if (this._ctx && this._ctx.state === 'suspended') {
      return this._ctx.resume();
    }
    return Promise.resolve();
  }

  async play(action) {
    const buffers = this._buffers.get(action);
    if (!buffers?.length || this._muted) return;

    const ctx = this._ensureCtx();
    if (!ctx) return;
    await this._resumeCtx();

    if (this._currentSource) {
      this._fadeOut(this._currentSource);
      this._currentSource = null;
    }
    if (this._blockingSource) {
      this._fadeOut(this._blockingSource);
      this._blockingSource = null;
    }

    const buf = buffers[Math.floor(Math.random() * buffers.length)];
    const source = ctx.createBufferSource();
    source.buffer = buf;

    const srcGain = ctx.createGain();
    srcGain.gain.value = 0;
    source.connect(srcGain);
    srcGain.connect(this._gain);

    this._currentSource = { source, gain: srcGain };
    source.start(0);

    const now = ctx.currentTime;
    srcGain.gain.linearRampToValueAtTime(this._volume, now + FADE_DURATION);

    source.onended = () => {
      if (this._currentSource?.source === source) {
        this._currentSource = null;
      }
    };
  }

  async playBlocking(action) {
    console.log('[SFX] playBlocking start:', action);
    const buffers = this._buffers.get(action);
    if (!buffers?.length || this._muted) {
      console.log('[SFX] playBlocking aborted — muted or no buffers');
      return;
    }

    const ctx = this._ensureCtx();
    if (!ctx) return;
    await this._resumeCtx();

    if (this._currentSource) {
      console.log('[SFX] Stopping currentSource (non-blocking)');
      this._fadeOut(this._currentSource);
      this._currentSource = null;
    }
    if (this._blockingSource) {
      console.log('[SFX] Stopping _blockingSource');
      this._fadeOut(this._blockingSource);
      this._blockingSource = null;
    }

    const buf = buffers[Math.floor(Math.random() * buffers.length)];
    const source = ctx.createBufferSource();
    source.buffer = buf;

    const srcGain = ctx.createGain();
    srcGain.gain.value = 0;
    source.connect(srcGain);
    srcGain.connect(this._gain);
    source.start(0);

    const now = ctx.currentTime;
    srcGain.gain.linearRampToValueAtTime(this._volume, now + FADE_DURATION);

    console.log('[SFX] playBlocking playing, duration:', buf.duration);

    return new Promise((resolve) => {
      let _resolved = false;
      const cleanup = () => {
        if (_resolved) return;
        _resolved = true;
        console.log('[SFX] playBlocking ended');
        if (this._blockingSource?.source === source) {
          this._blockingSource = null;
        }
        resolve();
      };
      source.addEventListener('ended', cleanup, { once: true });
      this._blockingSource = { source, gain: srcGain, resolve: cleanup };
    });
  }

  _fadeOut(entry) {
    if (!entry?.source || !this._ctx) return;
    console.log('[SFX] _fadeOut called');
    const now = this._ctx.currentTime;
    try {
      entry.gain.gain.linearRampToValueAtTime(0, now + FADE_DURATION);
      entry.source.stop(now + FADE_DURATION + 0.01);
    } catch {}
    if (entry.resolve) {
      console.log('[SFX] _fadeOut calling resolve()');
      entry.resolve();
    }
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._gain && !this._muted) {
      this._gain.gain.value = this._volume;
    }
  }

  setMuted(m) {
    this._muted = !!m;
    if (this._gain) {
      this._gain.gain.value = m ? 0 : this._volume;
    }
    if (m && this._currentSource) {
      this._fadeOut(this._currentSource);
      this._currentSource = null;
    }
  }
}

export const sfxManager = new SfxManager();
