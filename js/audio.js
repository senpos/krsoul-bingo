const STORAGE_KEY = 'krsoul-bingo-audio-state';

const PLAYLISTS = {
  twice: {
    songs: [
      { id: 'twice-0', title: 'Dance The Night Away "8비트" -  TWICE(트와이스) / JHN Studio(정스)', url: 'https://www.youtube.com/watch?v=KV90cA4szrw', file: 'audio/twice/twice-0.opus', artist: '정훈남JHN STUDIO' },
      { id: 'twice-1', title: 'TWICE(트와이스) - "YES or YES" 8BIT (예스 오어 예스 8비트) / JHN STUDIO(정스)', url: 'https://www.youtube.com/watch?v=qGwKlV6dKNQ', file: 'audio/twice/twice-1.opus', artist: '정훈남JHN STUDIO' },
      { id: 'twice-2', title: 'TWICE - FANCY 8BIT Cover (트와이스 - 팬시 8비트 커버)', url: 'https://www.youtube.com/watch?v=JhJokQKntLA', file: 'audio/twice/twice-2.opus', artist: '정훈남JHN STUDIO' },
      { id: 'twice-3', title: 'TWICE - Feel Special 8 bit Cover(8비트 커버)', url: 'https://www.youtube.com/watch?v=MGjbBVBx6Os', file: 'audio/twice/twice-3.opus', artist: '정훈남JHN STUDIO' },
      { id: 'twice-4', title: 'MORE & MORE 8 BIT COVER – TWICE(트와이스)', url: 'https://www.youtube.com/watch?v=6f0ho-u2Q_A', file: 'audio/twice/twice-4.opus', artist: '정훈남JHN STUDIO' },
      { id: 'twice-5', title: '게임 속으로 들어간 TWICE - I can\'t stop me', url: 'https://www.youtube.com/watch?v=i-eEky-O6aQ', file: 'audio/twice/twice-5.opus', artist: '정훈남JHN STUDIO' },
      { id: 'twice-6', title: 'TWICE(트와이스) - SCIENTIST(사이언티스트) / Pixel MV(픽셀뮤비)', url: 'https://www.youtube.com/watch?v=B247MHbhah4', file: 'audio/twice/twice-6.opus', artist: '정훈남JHN STUDIO' },
      { id: 'twice-7', title: 'NAYEON 나연 \'POP!\' / [8 Bit Cover]', url: 'https://www.youtube.com/watch?v=k2Zbr7w5xd0', file: 'audio/twice/twice-7.opus', artist: '정훈남JHN STUDIO' },
      { id: 'twice-8', title: 'TWICE (트와이스) ‘MOONLIGHT SUNRISE’ / 8 bit (Chiptune) cover', url: 'https://www.youtube.com/watch?v=2Ac90emJVqo', file: 'audio/twice/twice-8.opus', artist: '정훈남JHN STUDIO' },
    ],
  },
  aespa: {
    songs: [
      { id: 'aespa-0', title: 'aespa 에스파 \'DIRTY WORK\' Videogame Ver.', url: 'https://www.youtube.com/watch?v=iMW9tHn17R4', file: 'audio/aespa/aespa-0.opus', artist: 'Darnu-Pop' },
      { id: 'aespa-1', title: 'WHIPLASH, aespa 에스파 - Videogame Ver.', url: 'https://www.youtube.com/watch?v=nZ-CW15cECo', file: 'audio/aespa/aespa-1.opus', artist: 'Darnu-Pop' },
      { id: 'aespa-2', title: 'BETTER THINGS, aespa - Videogame Ver.', url: 'https://www.youtube.com/watch?v=xIPcFu1kLFw', file: 'audio/aespa/aespa-2.opus', artist: 'Darnu-Pop' },
      { id: 'aespa-3', title: 'SPICY, aespa - Videogame Ver.', url: 'https://www.youtube.com/watch?v=jAZK2IUBQeU', file: 'audio/aespa/aespa-3.opus', artist: 'Darnu-Pop' },
      { id: 'aespa-4', title: 'HOLD ON TIGHT, aespa - Videogame Ver.', url: 'https://www.youtube.com/watch?v=w-JOF8ZjlC8', file: 'audio/aespa/aespa-4.opus', artist: 'Darnu-Pop' },
      { id: 'aespa-5', title: 'LIFE\'S TOO SHORT, aespa - Videogame Ver.', url: 'https://www.youtube.com/watch?v=EvtVAs39tBw', file: 'audio/aespa/aespa-5.opus', artist: 'Darnu-Pop' },
      { id: 'aespa-6', title: 'SAVAGE, aespa - Videogame Style', url: 'https://www.youtube.com/watch?v=t1r2HTnqxos', file: 'audio/aespa/aespa-6.opus', artist: 'Darnu-Pop' },
      { id: 'aespa-7', title: 'BLACK MAMBA, aespa - Videogame Style', url: 'https://www.youtube.com/watch?v=gIKd3Ai-o7E', file: 'audio/aespa/aespa-7.opus', artist: 'Darnu-Pop' },
    ],
  },
  nmixx: {
    songs: [
      { id: 'nmixx-blue-valentine', title: 'NMIXX (엔믹스) "Blue Valentine" (Videogame Ver.)', url: 'https://www.youtube.com/watch?v=SXknBQeYTEw', file: 'audio/nmixx/nmixx-blue-valentine.opus', artist: 'Darnu-Pop' },
      { id: 'nmixx-0', title: 'NMIXX (엔믹스) ‘DICE’ / 8 bit (Chiptune) cover', url: 'https://www.youtube.com/watch?v=XHow_8Np_zg', file: 'audio/nmixx/nmixx-0.opus', artist: '정훈남JHN STUDIO' },
      { id: 'nmixx-1', title: 'NMIXX 엔믹스 ‘DASH’ / 8 Bit Cover', url: 'https://www.youtube.com/watch?v=rB9aOprwJZE', file: 'audio/nmixx/nmixx-1.opus', artist: '정훈남JHN STUDIO' },
    ],
  },
  newjeans: {
    songs: [
      { id: 'newjeans-0', title: 'NewJeans 뉴진스 ‘Attention’ / [8 Bit Cover]', url: 'https://www.youtube.com/watch?v=UV2e5-59uJQ', file: 'audio/newjeans/newjeans-0.opus', artist: '정훈남JHN STUDIO' },
      { id: 'newjeans-1', title: 'NewJeans (뉴진스) \'Ditto\' / 8 Bit Cover', url: 'https://www.youtube.com/watch?v=zvOJ8V-1pKo', file: 'audio/newjeans/newjeans-1.opus', artist: '정훈남JHN STUDIO' },
      { id: 'newjeans-2', title: 'NewJeans (뉴진스) \'OMG\' / 8 Bit Cover', url: 'https://www.youtube.com/watch?v=xuIKzeX7jEI', file: 'audio/newjeans/newjeans-2.opus', artist: '정훈남JHN STUDIO' },
      { id: 'newjeans-3', title: 'NewJeans (뉴진스) \'Hype Boy\' / 8 bit (Chiptune) cover', url: 'https://www.youtube.com/watch?v=QXr_FFtgvkA', file: 'audio/newjeans/newjeans-3.opus', artist: '정훈남JHN STUDIO' },
      { id: 'newjeans-4', title: 'NewJeans (뉴진스) \'Super Shy\' / 8 Bit Cover', url: 'https://www.youtube.com/watch?v=PTyCUg3C7_k', file: 'audio/newjeans/newjeans-4.opus', artist: '정훈남JHN STUDIO' },
      { id: 'newjeans-5', title: 'NewJeans (뉴진스) \'New Jeans\' / 8 Bit Cover', url: 'https://www.youtube.com/watch?v=En2ePEI39M4', file: 'audio/newjeans/newjeans-5.opus', artist: '정훈남JHN STUDIO' },
      { id: 'newjeans-6', title: 'NewJeans (뉴진스) \'Bubble Gum\' / 8 bit cover', url: 'https://www.youtube.com/watch?v=EkPJAu_xqpw', file: 'audio/newjeans/newjeans-6.opus', artist: '정훈남JHN STUDIO' },
      { id: 'newjeans-7', title: 'NewJeans (뉴진스) ‘Supernatural’ / Chiptune cover (8 Bit Style)', url: 'https://www.youtube.com/watch?v=tT8N45qr6CQ', file: 'audio/newjeans/newjeans-7.opus', artist: '정훈남JHN STUDIO' },
    ],
  },
  lesserafim: {
    songs: [
      { id: 'lesserafim-0', title: '르세라핌 ANTIFRAGILE / 8 Bit Cover', url: 'https://www.youtube.com/watch?v=w4sdgqdAoG4', file: 'audio/lesserafim/lesserafim-0.opus', artist: '정훈남JHN STUDIO' },
      { id: 'lesserafim-1', title: 'LE SSERAFIM (르세라핌) \'UNFORGIVEN\' / 8 Bit Cover', url: 'https://www.youtube.com/watch?v=mBs85HdL54g', file: 'audio/lesserafim/lesserafim-1.opus', artist: '정훈남JHN STUDIO' },
      { id: 'lesserafim-2', title: 'LE SSERAFIM (르세라핌) \'Perfect Night\' / 8 Bit Cover', url: 'https://www.youtube.com/watch?v=KRnuauIX5jQ', file: 'audio/lesserafim/lesserafim-2.opus', artist: '정훈남JHN STUDIO' },
      { id: 'lesserafim-3', title: 'LE SSERAFIM 르세라핌 \'CRAZY\' / 8 Bit Style', url: 'https://www.youtube.com/watch?v=2Ll8u55_Hi8', file: 'audio/lesserafim/lesserafim-3.opus', artist: '정훈남JHN STUDIO' },
      { id: 'lesserafim-4', title: 'LE SSERAFIM \'SPAGHETTI (feat. j-hope of BTS)\' / 8 Bit Style', url: 'https://www.youtube.com/watch?v=nkO75_c7rFs', file: 'audio/lesserafim/lesserafim-4.opus', artist: '정훈남JHN STUDIO' },
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
    this._unlocked = false;
    this._ctxPromise = null;

    this._themeStates = {};
    this._playThemeVersion = 0;
    this._positionSaveTimer = null;

    this._loopMode = 'playlist';
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
    if (!songs) return false;
    if (this._loopMode === 'random') return songs.length > 1;
    if (this._loopMode === 'playlist') return songs.length > 0;
    return this._currentSongIndex < songs.length - 1;
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
  get loopMode() { return this._loopMode; }

  _shouldLoop() {
    return this._loopMode === 'song';
  }

  _findSongById(id) {
    for (const playlist of Object.values(PLAYLISTS)) {
      for (const song of playlist.songs) {
        if (song.id === id) return song;
      }
    }
    return null;
  }

  _saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        paused: this._isPaused,
        theme: this._currentTheme,
        themeStates: this._themeStates,
        volume: this._volume,
        musicMuted: this._musicMuted,
        fxVolume: this._fxVolume,
        sfxMuted: this._sfxMuted,
        loopMode: this._loopMode,
      }));
    } catch {}
  }

  _loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.paused !== undefined) this._isPaused = !!state.paused;
      if (state.theme) this._currentTheme = state.theme;
      if (state.themeStates) this._themeStates = state.themeStates;
      if (state.volume !== undefined) this._volume = state.volume;
      if (state.musicMuted !== undefined) this._musicMuted = !!state.musicMuted;
      if (state.fxVolume !== undefined) this._fxVolume = state.fxVolume;
      if (state.sfxMuted !== undefined) this._sfxMuted = !!state.sfxMuted;
      if (state.loopMode === 'playlist' || state.loopMode === 'song' || state.loopMode === 'random') this._loopMode = state.loopMode;
    } catch {}
  }

  _saveCurrentThemeState() {
    if (!this._currentTheme) return;
    const themeSongIds = new Set((PLAYLISTS[this._currentTheme]?.songs || []).map(s => s.id));
    if (this._currentSource && this._currentBuffer && this._ctx && this._currentSongId) {
      const elapsed = this._ctx.currentTime - this._startTime;
      this._trackPositions[this._currentSongId] = elapsed % this._currentBuffer.duration;
    }
    const positions = {};
    for (const [id, pos] of Object.entries(this._trackPositions)) {
      if (themeSongIds.has(id)) positions[id] = pos;
    }
    this._themeStates[this._currentTheme] = {
      songIndex: this._currentSongIndex,
      positions,
    };
  }

  _getThemeState(themeId) {
    return this._themeStates[themeId] || null;
  }

  _savePosition() {
    if (this._currentSource && this._currentBuffer && this._ctx && this._currentSongId) {
      const elapsed = this._ctx.currentTime - this._startTime;
      this._trackPositions[this._currentSongId] = elapsed % this._currentBuffer.duration;
    }
    this._saveCurrentThemeState();
    this._saveState();
  }

  _startPositionSaving() {
    this._stopPositionSaving();
    this._positionSaveTimer = setInterval(() => {
      this._savePosition();
    }, 5000);
  }

  _stopPositionSaving() {
    if (this._positionSaveTimer) {
      clearInterval(this._positionSaveTimer);
      this._positionSaveTimer = null;
    }
  }

  async _predecodeAdjacent(songs, idx) {
    for (let i = 1; i <= 2; i++) {
      const next = songs[idx + i];
      if (next && !this._buffers[next.id] && this._rawBuffers[next.id]) {
        try {
          this._buffers[next.id] = await this._ctx.decodeAudioData(this._rawBuffers[next.id]);
        } catch (e) {
          console.warn('Pre-decode failed for', next.id, e);
        }
      }
    }
  }

  init(initialThemeId, onUpdate) {
    this._initialTheme = initialThemeId;
    this._onUpdate = onUpdate;
    this._loadState();
    if (!this._currentTheme && initialThemeId) {
      this._currentTheme = initialThemeId;
    }
    if (this._currentTheme) {
      const saved = this._getThemeState(this._currentTheme);
      if (saved) {
        this._currentSongIndex = saved.songIndex;
        this._trackPositions = { ...saved.positions };
      }
      const songs = PLAYLISTS[this._currentTheme]?.songs;
      if (songs?.length && !this._currentSongId) {
        const idx = Math.min(this._currentSongIndex, songs.length - 1);
        this._currentSongId = songs[idx].id;
        this._currentSongIndex = idx;
      }
    }
    for (const themeId of Object.keys(PLAYLISTS)) {
      this._preload(themeId);
    }
    this._notify();
  }

  async unlock() {
    if (this._unlocked) return;
    this._unlocked = true;
    await this._ensureCtx();
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
    if (this._ctxPromise) return this._ctxPromise;

    this._ctxPromise = (async () => {
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
    })();

    try {
      await this._ctxPromise;
    } finally {
      this._ctxPromise = null;
    }
  }

  async _decode(song) {
    if (this._buffers[song.id]) return;
    if (!this._ctx) return;
    try {
      const raw = this._rawBuffers[song.id];
      const buf = raw || await (await fetch(song.file)).arrayBuffer();
      this._buffers[song.id] = await this._ctx.decodeAudioData(buf);
      delete this._rawBuffers[song.id];
    } catch (e) {
      console.warn('Audio decode failed for', song.id, e);
    }
  }

  _playNow(themeId, songId) {
    if (!this._ctx || !this._musicGain) return;
    const song = this._findSongById(songId);
    if (!song) return;
    const buffer = this._buffers[songId];
    if (!buffer) return;

    const source = this._ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this._ctx.createGain();
    gain.gain.value = 1;
    source.connect(gain);
    gain.connect(this._musicGain);

    if (this._shouldLoop()) {
      source.loop = true;
    } else {
      source.loop = false;
      this._attachEndedHandler(source);
    }

    const pos = this._trackPositions[songId] || 0;
    source.start(0, pos);

    this._currentSource = source;
    this._currentGain = gain;
    this._currentSongId = songId;
    this._currentTheme = themeId;
    this._currentBuffer = buffer;
    this._startTime = this._ctx.currentTime - pos;
    this._isPaused = false;

    this._startPositionSaving();
    this._notify();
  }

  async playTheme(themeId) {
    this._playThemeVersion++;
    const version = this._playThemeVersion;

    await this._ensureCtx();
    if (!this._ctx || version !== this._playThemeVersion) return;

    const songs = PLAYLISTS[themeId]?.songs;
    if (!songs?.length) return;

    if (version !== this._playThemeVersion) return;

    // Save current theme state when switching to a different one
    if (this._currentTheme && this._currentTheme !== themeId) {
      this._saveCurrentThemeState();
    }

    // Determine song index: use saved state or continue current
    let idx;
    if (this._currentTheme === themeId) {
      idx = this._currentSongIndex;
    } else {
      const saved = this._getThemeState(themeId);
      idx = saved ? saved.songIndex : 0;
      if (saved) {
        // Merge saved positions without wiping other themes
        for (const [id, pos] of Object.entries(saved.positions)) {
          this._trackPositions[id] = pos;
        }
      }
    }

    if (idx < 0 || idx >= songs.length) idx = 0;

    const song = songs[idx];
    if (!song) return;
    if (this._currentSongId === song.id && this._currentSource && !this._crossfading) return;

    if (version !== this._playThemeVersion) return;

    this._currentSongIndex = idx;

    await this._decode(song);
    if (version !== this._playThemeVersion) return;

    this._predecodeAdjacent(songs, idx);
    if (version !== this._playThemeVersion) return;

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

      const newGain = ctx.createGain();
      newGain.gain.value = 0;
      newSource.connect(newGain);
      newGain.connect(this._musicGain);

      const now = ctx.currentTime;
      newGain.gain.setValueAtTime(0, now);
      newGain.gain.linearRampToValueAtTime(1, now + 1);
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0, now + 1);

      if (this._shouldLoop()) {
        newSource.loop = true;
      } else {
        newSource.loop = false;
        this._attachEndedHandler(newSource);
      }

      newSource.start(0, pos);

      this._currentSource = newSource;
      this._currentGain = newGain;
      this._currentSongId = song.id;
      this._currentTheme = themeId;
      this._currentBuffer = buffer;
      this._startTime = ctx.currentTime - pos;
      this._isPaused = false;

      this._startPositionSaving();

      setTimeout(() => {
        try { oldSource.stop(); } catch {}
        try { oldSource.disconnect(); } catch {}
        try { oldGain.disconnect(); } catch {}
        this._crossfading = false;
      }, 1500);
    } else {
      this._playNow(themeId, song.id);
    }

    this._notify();
  }

  async nextTrack() {
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs) return;
    if (this._loopMode === 'random') {
      if (songs.length <= 1) return;
      let newIdx;
      do { newIdx = Math.floor(Math.random() * songs.length); }
      while (newIdx === this._currentSongIndex);
      this._currentSongIndex = newIdx;
    } else if (this._loopMode === 'playlist') {
      this._currentSongIndex = (this._currentSongIndex + 1) % songs.length;
    } else {
      if (!this.hasNext) return;
      this._currentSongIndex++;
    }
    this._currentSongId = null;
    const song = songs[this._currentSongIndex];
    if (song) {
      this._trackPositions[song.id] = 0;
    }
    await this.playTheme(this._currentTheme);
    this._saveCurrentThemeState();
    this._saveState();
  }

  async prevTrack() {
    if (!this.hasPrev) return;
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs) return;
    this._currentSongIndex--;
    this._currentSongId = null;
    const song = songs[this._currentSongIndex];
    if (song) {
      this._trackPositions[song.id] = 0;
    }
    await this.playTheme(this._currentTheme);
    this._saveCurrentThemeState();
    this._saveState();
  }

  async selectSong(index) {
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs || index < 0 || index >= songs.length || index === this._currentSongIndex) return;
    this._currentSongIndex = index;
    this._currentSongId = null;
    const song = songs[index];
    if (song) {
      this._trackPositions[song.id] = 0;
    }
    await this.playTheme(this._currentTheme);
    this._saveCurrentThemeState();
    this._saveState();
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
    this._saveCurrentThemeState();
    this._saveState();
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
    this._stopPositionSaving();
  }

  _attachEndedHandler(source) {
    if (source._loopHandler) return;
    const handler = () => {
      if (this._currentSource === source) this.nextTrack();
    };
    source._loopHandler = handler;
    source.addEventListener('ended', handler);
  }

  toggleLoopMode() {
    const modes = ['playlist', 'song', 'random'];
    const idx = modes.indexOf(this._loopMode);
    this._loopMode = modes[(idx + 1) % modes.length];
    if (this._currentSource && this._currentBuffer) {
      if (this._shouldLoop()) {
        this._currentSource.loop = true;
      } else {
        this._currentSource.loop = false;
        this._attachEndedHandler(this._currentSource);
      }
    }
    this._saveState();
    this._notify();
  }

  _gainFromVolume(v) {
    return Math.pow(v, 3);
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._masterGain) {
      this._masterGain.gain.value = this._musicMuted ? 0 : this._gainFromVolume(this._volume);
    }
    this._saveState();
    this._notify();
  }

  toggleMusicMute() {
    this._musicMuted = !this._musicMuted;
    if (this._masterGain) {
      this._masterGain.gain.value = this._musicMuted ? 0 : this._gainFromVolume(this._volume);
    }
    this._saveState();
    this._notify();
  }

  setFxVolume(v) {
    this._fxVolume = Math.max(0, Math.min(1, v));
    if (this._sfxGain) {
      this._sfxGain.gain.value = this._sfxMuted ? 0 : this._gainFromVolume(this._fxVolume);
    }
    this._saveState();
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
    this._saveState();
    this.playTheme(this._currentTheme);
  }

  togglePlay() {
    if (this._isPaused) {
      this.resume();
    } else if (this._currentSource && this._currentSongId) {
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
        loopMode: this._loopMode,
        audioTheme: this._currentTheme,
        songs: this.songs,
        currentSongIndex: this._currentSongIndex,
      });
    }
  }
}

export const audioManager = new AudioManager();
