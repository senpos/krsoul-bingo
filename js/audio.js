const STORAGE_KEY = 'krsoul-bingo-audio-state';

const PLAYLISTS = {
  twice: {
    songs: [
      {
        id: 'twice-0',
        title: '[8BIT] Twice - Heart Shaker',
        url: 'https://youtu.be/WD9mkSYz5-4',
        file: 'audio/twice.opus',
        artist: 'MasterJonald',
      },
    ],
  },
  aespa: {
    songs: [
      {
        id: 'aespa-0',
        title: 'WHIPLASH, aespa 에스파 - Videogame Ver.',
        url: 'https://youtu.be/nZ-CW15cECo',
        file: 'audio/aespa.opus',
        artist: 'Darnu-Pop',
      },
    ],
  },
  nmixx: {
    songs: [
      {
        id: 'nmixx-0',
        title: 'NMIXX (엔믹스) "Blue Valentine" (Videogame Ver.)',
        url: 'https://www.youtube.com/watch?v=SXknBQeYTEw',
        file: 'audio/nmixx.opus',
        artist: 'Darnu-Pop',
      },
    ],
  },
  newjeans: {
    songs: [
      {
        id: 'newjeans-0',
        title: "NewJeans (뉴진스) 'Ditto' / 8 Bit Cover",
        url: 'https://www.youtube.com/watch?v=zvOJ8V-1pKo',
        file: 'audio/newjeans.opus',
        artist: '정훈남JHN STUDIO',
      },
    ],
  },
  lesserafim: {
    songs: [
      {
        id: 'lesserafim-0',
        title: '르세라핌 ANTIFRAGILE / 8 Bit Cover',
        url: 'https://www.youtube.com/watch?v=w4sdgqdAoG4',
        file: 'audio/lesserafim.opus',
        artist: '정훈남JHN STUDIO',
      },
    ],
  },
};

class AudioManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._musicGain = null;
    this._sfxGain = null;

    this._currentSource = null;
    this._currentGain = null;
    this._currentSongId = null;
    this._currentTheme = null;
    this._currentBuffer = null;
    this._startTime = 0;
    this._currentSongIndex = 0;

    this._buffers = {};
    this._rawBuffers = {};
    this._trackPositions = {};

    this._crossfading = false;
    this._volume = 0.25;
    this._musicMuted = false;
    this._fxVolume = 0.75;
    this._sfxMuted = false;
    this._isPaused = false;

    this._onUpdate = null;
    this._initialTheme = null;
    this._unlocked = false;
  }

  get currentTrack() {
    if (!this._currentSongId) return null;
    const song = this._findSongById(this._currentSongId);
    if (!song) return null;
    return {
      title: song.title,
      url: song.url,
      artist: song.artist,
    };
  }

  get volume() { return this._volume; }
  get musicMuted() { return this._musicMuted; }
  get fxVolume() { return this._fxVolume; }
  get playing() { return !this._isPaused && !!this._currentSource && !!this._currentSongId; }
  get sfxEnabled() { return !this._sfxMuted; }
  get ready() { return this._ctx !== null && this._ctx.state !== 'closed'; }

  get progress() {
    if (!this._currentSource || !this._currentBuffer || !this._ctx) return null;
    if (this._isPaused) return null;
    const elapsed = this._ctx.currentTime - this._startTime;
    return (elapsed % this._currentBuffer.duration) / this._currentBuffer.duration;
  }

  get currentTime() {
    if (!this._currentSource || !this._currentBuffer || !this._ctx) return null;
    const elapsed = this._ctx.currentTime - this._startTime;
    if (elapsed < 0) return 0;
    return elapsed % this._currentBuffer.duration;
  }

  get duration() {
    return this._currentBuffer?.duration ?? null;
  }

  get hasNext() {
    if (!this._currentTheme) return false;
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    return songs ? this._currentSongIndex < songs.length - 1 : false;
  }

  get hasPrev() {
    if (!this._currentTheme) return false;
    return this._currentSongIndex > 0;
  }

  get songs() {
    if (!this._currentTheme) return [];
    const s = PLAYLISTS[this._currentTheme]?.songs;
    return s ? s.map((song, i) => ({
      ...song,
      current: i === this._currentSongIndex,
    })) : [];
  }

  get currentSongIndex() { return this._currentSongIndex; }
  get audioTheme() { return this._currentTheme; }

  setAudioTheme(themeId) {
    if (!PLAYLISTS[themeId] || themeId === this._currentTheme) return;
    this._currentTheme = themeId;
    this._currentSongId = null;
    this._currentSongIndex = 0;
    this._saveState();
    this.playTheme(themeId);
  }

  _findSongById(id) {
    for (const playlist of Object.values(PLAYLISTS)) {
      for (const song of playlist.songs) {
        if (song.id === id) return song;
      }
    }
    return null;
  }

  _getSongForTheme(themeId) {
    const playlist = PLAYLISTS[themeId];
    if (!playlist || !playlist.songs.length) return null;
    return playlist.songs[0];
  }

  _saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        paused: this._isPaused,
        theme: this._currentTheme,
      }));
    } catch {}
  }

  _loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.paused) this._isPaused = true;
      if (state.theme) this._currentTheme = state.theme;
    } catch {}
  }

  init(initialThemeId, onUpdate) {
    this._initialTheme = initialThemeId;
    this._onUpdate = onUpdate;
    this._loadState();
    if (!this._currentTheme && initialThemeId) {
      this._currentTheme = initialThemeId;
    }
    if (!this._currentSongId && this._currentTheme) {
      const songs = PLAYLISTS[this._currentTheme]?.songs;
      if (songs?.length) {
        this._currentSongId = songs[0].id;
        this._currentSongIndex = 0;
      }
    }
    for (const themeId of Object.keys(PLAYLISTS)) {
      this._preload(themeId);
    }
    this._notify();
  }

  unlock() {
    if (this._unlocked) return;
    this._unlocked = true;
    this._ensureCtx();
  }

  async _preload(themeId) {
    const playlist = PLAYLISTS[themeId];
    if (!playlist) return;
    for (const song of playlist.songs) {
      if (this._buffers[song.id] || this._rawBuffers[song.id]) continue;
      try {
        const res = await fetch(song.file);
        if (!res.ok) continue;
        this._rawBuffers[song.id] = await res.arrayBuffer();
      } catch {}
    }
  }

  async _ensureCtx() {
    if (this._ctx && this._ctx.state !== 'closed') {
      if (this._ctx.state === 'suspended') await this._ctx.resume();
      return;
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._ctx = ctx;

    this._masterGain = ctx.createGain();
    this._masterGain.gain.value = this._musicMuted ? 0 : this._gainFromVolume(this._volume);
    this._masterGain.connect(ctx.destination);

    this._musicGain = ctx.createGain();
    this._musicGain.gain.value = 1;
    this._musicGain.connect(this._masterGain);

    this._sfxGain = ctx.createGain();
    this._sfxGain.gain.value = this._sfxMuted ? 0 : this._gainFromVolume(this._fxVolume);
    this._sfxGain.connect(ctx.destination);

    this._notify();
  }

  async _decode(song) {
    if (this._buffers[song.id]) return;
    if (!this._ctx) return;
    try {
      const raw = this._rawBuffers[song.id];
      const buf = raw || await (await fetch(song.file)).arrayBuffer();
      this._buffers[song.id] = await this._ctx.decodeAudioData(buf);
      delete this._rawBuffers[song.id];
    } catch {}
  }

  _playNow(themeId, songId) {
    if (!this._ctx || !this._musicGain) return;
    const song = this._findSongById(songId);
    if (!song) return;
    const buffer = this._buffers[songId];
    if (!buffer) return;

    const source = this._ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = this._ctx.createGain();
    gain.gain.value = 1;
    source.connect(gain);
    gain.connect(this._musicGain);

    const pos = this._trackPositions[songId] || 0;
    source.start(0, pos);

    this._currentSource = source;
    this._currentGain = gain;
    this._currentSongId = songId;
    this._currentTheme = themeId;
    this._currentBuffer = buffer;
    this._startTime = this._ctx.currentTime - pos;
    this._isPaused = false;

    this._notify();
  }

  async playTheme(themeId) {
    await this._ensureCtx();
    if (!this._ctx) return;

    const songs = PLAYLISTS[themeId]?.songs;
    if (!songs?.length) return;

    const idx = this._currentTheme === themeId ? this._currentSongIndex : 0;
    const song = songs[idx];
    if (!song) return;
    if (this._currentSongId === song.id && this._currentSource && !this._crossfading) return;

    this._currentSongIndex = idx;

    await this._decode(song);
    const buffer = this._buffers[song.id];
    if (!buffer) return;

    if (this._isPaused) {
      if (this._currentSource && this._currentBuffer) {
        const elapsed = this._ctx.currentTime - this._startTime;
        this._trackPositions[this._currentSongId] = elapsed % this._currentBuffer.duration;
      }
      this._stopCurrent();
      this._currentTheme = themeId;
      this._currentSongId = song.id;
      this._currentBuffer = buffer;
      this._startTime = this._ctx.currentTime;
      this._saveState();
      this._notify();
      return;
    }

    const ctx = this._ctx;
    const pos = this._trackPositions[song.id] || 0;

    if (this._currentSource && this._currentGain && this._currentBuffer) {
      this._crossfading = true;

      const elapsed = ctx.currentTime - this._startTime;
      this._trackPositions[this._currentSongId] = elapsed % this._currentBuffer.duration;

      const oldSource = this._currentSource;
      const oldGain = this._currentGain;

      const newSource = ctx.createBufferSource();
      newSource.buffer = buffer;
      newSource.loop = true;

      const newGain = ctx.createGain();
      newGain.gain.value = 0;
      newSource.connect(newGain);
      newGain.connect(this._musicGain);

      const now = ctx.currentTime;
      newGain.gain.setValueAtTime(0, now);
      newGain.gain.linearRampToValueAtTime(1, now + 2);
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0, now + 2);

      newSource.start(0, pos);

      this._currentSource = newSource;
      this._currentGain = newGain;
      this._currentSongId = song.id;
      this._currentTheme = themeId;
      this._currentBuffer = buffer;
      this._startTime = ctx.currentTime - pos;
      this._isPaused = false;

      setTimeout(() => {
        try { oldSource.stop(); } catch {}
        try { oldSource.disconnect(); } catch {}
        try { oldGain.disconnect(); } catch {}
        this._crossfading = false;
      }, 2500);
    } else {
      this._playNow(themeId, song.id);
    }

    this._notify();
  }

  nextTrack() {
    if (!this.hasNext) return;
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs) return;
    this._currentSongIndex++;
    this._currentSongId = null;
    const song = songs[this._currentSongIndex];
    if (song) {
      this._trackPositions[song.id] = 0;
    }
    this.playTheme(this._currentTheme);
  }

  prevTrack() {
    if (!this.hasPrev) return;
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs) return;
    this._currentSongIndex--;
    this._currentSongId = null;
    const song = songs[this._currentSongIndex];
    if (song) {
      this._trackPositions[song.id] = 0;
    }
    this.playTheme(this._currentTheme);
  }

  selectSong(index) {
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs || index < 0 || index >= songs.length || index === this._currentSongIndex) return;
    this._currentSongIndex = index;
    this._currentSongId = null;
    const song = songs[index];
    if (song) {
      this._trackPositions[song.id] = 0;
    }
    this.playTheme(this._currentTheme);
  }

  seek(frac) {
    if (!this._currentBuffer || !this._ctx) return;
    const pos = Math.max(0, Math.min(1, frac)) * this._currentBuffer.duration;
    this._trackPositions[this._currentSongId] = pos;
    if (this._currentSource) {
      const themeId = this._currentTheme;
      this._stopCurrent();
      this._playNow(themeId, this._currentSongId);
    }
  }

  _stopCurrent() {
    if (this._currentSource) {
      try { this._currentSource.stop(); } catch {}
      try { this._currentSource.disconnect(); } catch {}
    }
    if (this._currentGain) {
      try { this._currentGain.disconnect(); } catch {}
    }
    this._currentSource = null;
    this._currentGain = null;
    this._crossfading = false;
  }

  _gainFromVolume(v) {
    return Math.pow(v, 3);
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._masterGain) {
      this._masterGain.gain.value = this._musicMuted ? 0 : this._gainFromVolume(this._volume);
    }
    this._notify();
  }

  toggleMusicMute() {
    this._musicMuted = !this._musicMuted;
    if (this._masterGain) {
      this._masterGain.gain.value = this._musicMuted ? 0 : this._gainFromVolume(this._volume);
    }
    this._notify();
  }

  setFxVolume(v) {
    this._fxVolume = Math.max(0, Math.min(1, v));
    if (this._sfxGain) {
      this._sfxGain.gain.value = this._sfxMuted ? 0 : this._gainFromVolume(this._fxVolume);
    }
    this._notify();
  }

  setSfxEnabled(enabled) {
    this._sfxMuted = !enabled;
    if (this._sfxGain) {
      this._sfxGain.gain.value = this._sfxMuted ? 0 : this._gainFromVolume(this._fxVolume);
    }
    this._notify();
  }

  pause() {
    if (this._isPaused || !this._currentSource || !this._ctx) return;
    const elapsed = this._ctx.currentTime - this._startTime;
    if (this._currentBuffer) {
      this._trackPositions[this._currentSongId] = elapsed % this._currentBuffer.duration;
    }
    this._stopCurrent();
    this._isPaused = true;
    this._saveState();
    this._notify();
  }

  resume() {
    if (!this._isPaused || !this._currentTheme) return;
    this._isPaused = false;
    this._currentSongId = null;
    this._saveState();
    this.playTheme(this._currentTheme);
  }

  togglePlay() {
    if (this._isPaused) {
      this.resume();
    } else if (this._currentSongId) {
      this.pause();
    } else if (this._currentTheme) {
      this.playTheme(this._currentTheme);
    }
  }

  playBingo() {
    if (!this._ctx || !this._sfxGain) return;
    if (this._sfxMuted) return;

    const ctx = this._ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    const noteLen = 0.15;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * noteLen);
      env.gain.setValueAtTime(0, now + i * noteLen);
      env.gain.linearRampToValueAtTime(0.8, now + i * noteLen + 0.02);
      env.gain.linearRampToValueAtTime(0, now + i * noteLen + noteLen);
      osc.connect(env);
      env.connect(this._sfxGain);
      osc.start(now + i * noteLen);
      osc.stop(now + i * noteLen + noteLen + 0.05);
    });
  }

  _notify() {
    if (this._onUpdate) {
      this._onUpdate({
        volume: this._volume,
        musicMuted: this._musicMuted,
        fxVolume: this._fxVolume,
        playing: this.playing,
        sfxEnabled: !this._sfxMuted,
        currentTrack: this.currentTrack,
        ready: this.ready,
        progress: this.progress,
        currentTime: this.currentTime,
        duration: this.duration,
        hasNext: this.hasNext,
        hasPrev: this.hasPrev,
        audioTheme: this._currentTheme,
        songs: this.songs,
        currentSongIndex: this._currentSongIndex,
      });
    }
  }
}

export const audioManager = new AudioManager();
