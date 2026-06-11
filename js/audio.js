const STORAGE_KEY = 'krsoul-bingo-audio-state';

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&#]+)/);
  return m ? m[1] : null;
}

const PLAYLISTS = {
  twice: {
    songs: [
      { id: 'twice-0', title: 'Dance The Night Away (8-bit)', url: 'https://www.youtube.com/watch?v=KV90cA4szrw', artist: 'JHN STUDIO' },
      { id: 'twice-1', title: 'YES or YES (8-bit)', url: 'https://www.youtube.com/watch?v=qGwKlV6dKNQ', artist: 'JHN STUDIO' },
      { id: 'twice-2', title: 'FANCY (8-bit)', url: 'https://www.youtube.com/watch?v=JhJokQKntLA', artist: 'JHN STUDIO' },
      { id: 'twice-3', title: 'Feel Special (8-bit)', url: 'https://www.youtube.com/watch?v=MGjbBVBx6Os', artist: 'JHN STUDIO' },
      { id: 'twice-4', title: 'MORE & MORE (8-bit)', url: 'https://www.youtube.com/watch?v=6f0ho-u2Q_A', artist: 'JHN STUDIO' },
      { id: 'twice-5', title: "I Can't Stop Me (Pixel)", url: 'https://www.youtube.com/watch?v=i-eEky-O6aQ', artist: 'JHN STUDIO' },
      { id: 'twice-6', title: 'SCIENTIST (Pixel MV)', url: 'https://www.youtube.com/watch?v=B247MHbhah4', artist: 'JHN STUDIO' },
      { id: 'twice-7', title: "NAYEON — POP! (8-bit)", url: 'https://www.youtube.com/watch?v=k2Zbr7w5xd0', artist: 'JHN STUDIO' },
      { id: 'twice-8', title: 'MOONLIGHT SUNRISE (Chiptune)', url: 'https://www.youtube.com/watch?v=2Ac90emJVqo', artist: 'JHN STUDIO' },
    ],
  },
  aespa: {
    songs: [
      { id: 'aespa-0', title: 'DIRTY WORK', url: 'https://www.youtube.com/watch?v=iMW9tHn17R4', artist: 'Darnu-Pop' },
      { id: 'aespa-1', title: 'WHIPLASH', url: 'https://www.youtube.com/watch?v=nZ-CW15cECo', artist: 'Darnu-Pop' },
      { id: 'aespa-2', title: 'BETTER THINGS', url: 'https://www.youtube.com/watch?v=xIPcFu1kLFw', artist: 'Darnu-Pop' },
      { id: 'aespa-3', title: 'SPICY', url: 'https://www.youtube.com/watch?v=jAZK2IUBQeU', artist: 'Darnu-Pop' },
      { id: 'aespa-5', title: "LIFE'S TOO SHORT", url: 'https://www.youtube.com/watch?v=EvtVAs39tBw', artist: 'Darnu-Pop' },
      { id: 'aespa-6', title: 'SAVAGE', url: 'https://www.youtube.com/watch?v=t1r2HTnqxos', artist: 'Darnu-Pop' },
      { id: 'aespa-7', title: 'BLACK MAMBA', url: 'https://www.youtube.com/watch?v=gIKd3Ai-o7E', artist: 'Darnu-Pop' },
    ],
  },
  nmixx: {
    songs: [
      { id: 'nmixx-blue-valentine', title: 'Blue Valentine (Videogame)', url: 'https://www.youtube.com/watch?v=SXknBQeYTEw', artist: 'Darnu-Pop' },
      { id: 'nmixx-0', title: 'DICE (Chiptune)', url: 'https://www.youtube.com/watch?v=XHow_8Np_zg', artist: 'JHN STUDIO' },
      { id: 'nmixx-1', title: 'DASH (8-bit)', url: 'https://www.youtube.com/watch?v=rB9aOprwJZE', artist: 'JHN STUDIO' },
      { id: 'nmixx-o-o', title: 'O.O (8-bit)', url: 'https://www.youtube.com/watch?v=ggur0dTX7Hs', artist: '8-Bit Nmixx Emulation' },
      { id: 'nmixx-know-about-me', title: 'Know About Me (8-bit)', url: 'https://www.youtube.com/watch?v=iSAYFXeIabk', artist: 'PiXL 라디오' },
    ],
  },
  newjeans: {
    songs: [
      { id: 'newjeans-0', title: 'Attention (8-bit)', url: 'https://www.youtube.com/watch?v=UV2e5-59uJQ', artist: 'JHN STUDIO' },
      { id: 'newjeans-1', title: 'Ditto (8-bit)', url: 'https://www.youtube.com/watch?v=zvOJ8V-1pKo', artist: 'JHN STUDIO' },
      { id: 'newjeans-2', title: 'OMG (8-bit)', url: 'https://www.youtube.com/watch?v=xuIKzeX7jEI', artist: 'JHN STUDIO' },
      { id: 'newjeans-3', title: 'Hype Boy (8-bit)', url: 'https://www.youtube.com/watch?v=QXr_FFtgvkA', artist: 'JHN STUDIO' },
      { id: 'newjeans-4', title: 'Super Shy (8-bit)', url: 'https://www.youtube.com/watch?v=PTyCUg3C7_k', artist: 'JHN STUDIO' },
      { id: 'newjeans-5', title: 'New Jeans (8-bit)', url: 'https://www.youtube.com/watch?v=En2ePEI39M4', artist: 'JHN STUDIO' },
      { id: 'newjeans-6', title: 'Bubble Gum (8-bit)', url: 'https://www.youtube.com/watch?v=EkPJAu_xqpw', artist: 'JHN STUDIO' },
      { id: 'newjeans-7', title: 'Supernatural (8-bit)', url: 'https://www.youtube.com/watch?v=tT8N45qr6CQ', artist: 'JHN STUDIO' },
    ],
  },
  lesserafim: {
    songs: [
      { id: 'lesserafim-0', title: 'ANTIFRAGILE (8-bit)', url: 'https://www.youtube.com/watch?v=w4sdgqdAoG4', artist: 'JHN STUDIO' },
      { id: 'lesserafim-1', title: 'UNFORGIVEN (8-bit)', url: 'https://www.youtube.com/watch?v=mBs85HdL54g', artist: 'JHN STUDIO' },
      { id: 'lesserafim-2', title: 'Perfect Night (8-bit)', url: 'https://www.youtube.com/watch?v=KRnuauIX5jQ', artist: 'JHN STUDIO' },
      { id: 'lesserafim-3', title: 'CRAZY (8-bit)', url: 'https://www.youtube.com/watch?v=2Ll8u55_Hi8', artist: 'JHN STUDIO' },
      { id: 'lesserafim-4', title: 'SPAGHETTI feat. j-hope (8-bit)', url: 'https://www.youtube.com/watch?v=nkO75_c7rFs', artist: 'JHN STUDIO' },
    ],
  },
};

const FOCUS_VIDEOS = [
  { videoId: 'QPW3XwBoQlw', label: 'Subway Surfers' },
  { videoId: 'nqxmOqfMt28', label: 'Minecraft Parkour' },
  { videoId: 'bEQTUMAPFZQ', label: 'GTA 5 Mega Ramp' },
  { videoId: 'tXIusNFU_Ww', label: 'Hydraulic Press' },
];

for (const playlist of Object.values(PLAYLISTS)) {
  for (const song of playlist.songs) {
    song.videoId = extractYouTubeId(song.url) || '';
  }
}

let _ytApiPromise = null;
function loadYTApi() {
  if (_ytApiPromise) return _ytApiPromise;
  _ytApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) { resolve(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };
  });
  return _ytApiPromise;
}

class AudioManager {
  constructor() {
    this._ytPlayer = null;
    this._ytReady = false;
    this._playerContainer = null;

    this._currentSongIndex = 0;
    this._currentTheme = null;
    this._themeStates = {};

    this._volume = 20;
    this._fxVolume = 0.80;
    this._sfxMuted = false;
    this._isPaused = false;
    this._muted = false;
    this._mounted = false;
    this._pendingSeek = null;

    this._loopMode = 'playlist';
    this._onUpdate = null;

    this._progressTimer = null;

    this._focusIndex = 0;
    this._focusPositions = {};
    this._focusContainer = null;
    this._focusTimer = null;
    this._focusMode = false;
    this._autoSkip = true;
  }

  get currentTrack() {
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs) return null;
    const song = songs[this._currentSongIndex];
    if (!song) return null;
    return { title: song.title, url: song.url, artist: song.artist, videoId: song.videoId };
  }

  get volume() { return this._volume; }
  get fxVolume() { return this._fxVolume; }
  get playing() { return this._mounted && !this._isPaused && !!this._ytPlayer; }
  get sfxEnabled() { return !this._sfxMuted; }
  get ready() { return this._mounted; }

  get progress() {
    if (!this._ytPlayer?.getDuration) return null;
    const dur = this._ytPlayer.getDuration();
    if (!dur) return null;
    return this._ytPlayer.getCurrentTime() / dur;
  }

  get currentTime() {
    if (!this._ytPlayer?.getCurrentTime) return null;
    return this._ytPlayer.getCurrentTime();
  }

  get duration() {
    if (!this._ytPlayer?.getDuration) return null;
    return this._ytPlayer.getDuration();
  }

  get hasNext() {
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs) return false;
    if (this._loopMode === 'random') return songs.length > 1;
    if (this._loopMode === 'playlist') return songs.length > 0;
    return this._currentSongIndex < songs.length - 1;
  }

  get hasPrev() {
    return this._currentSongIndex > 0;
  }

  get songs() {
    const s = PLAYLISTS[this._currentTheme]?.songs;
    return s ? s.map((song, i) => ({ ...song, current: i === this._currentSongIndex })) : [];
  }

  get currentSongIndex() { return this._currentSongIndex; }
  get audioTheme() { return this._currentTheme; }
  get loopMode() { return this._loopMode; }
  get mounted() { return this._mounted; }
  get focusIndex() { return this._focusIndex; }
  get focusCount() { return FOCUS_VIDEOS.length; }
  get focusMode() { return this._focusMode; }
  get autoSkip() { return this._autoSkip; }
  get focusVideoUrl() {
    const v = FOCUS_VIDEOS[this._focusIndex];
    return v ? `https://www.youtube.com/watch?v=${v.videoId}` : '';
  }

  _saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        paused: this._isPaused,
        muted: this._muted,
        theme: this._currentTheme,
        themeStates: this._themeStates,
        volume: this._volume,
        fxVolume: this._fxVolume,
        sfxMuted: this._sfxMuted,
        loopMode: this._loopMode,
        focusIndex: this._focusIndex,
        focusMode: this._focusMode,
        autoSkip: this._autoSkip,
        focusPositions: this._focusPositions,
      }));
    } catch {}
  }

  _loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.paused !== undefined) this._isPaused = !!s.paused;
      if (s.muted !== undefined) this._muted = !!s.muted;
      if (s.theme) this._currentTheme = s.theme;
      if (s.themeStates) this._themeStates = s.themeStates;
      if (s.volume !== undefined) this._volume = s.volume;
      if (s.fxVolume !== undefined) this._fxVolume = s.fxVolume;
      if (s.sfxMuted !== undefined) this._sfxMuted = !!s.sfxMuted;
      if (s.loopMode === 'playlist' || s.loopMode === 'song' || s.loopMode === 'random') this._loopMode = s.loopMode;
      if (s.focusIndex !== undefined && s.focusIndex >= 0 && s.focusIndex < FOCUS_VIDEOS.length) {
        this._focusIndex = s.focusIndex;
      }
      if (s.focusMode !== undefined) this._focusMode = !!s.focusMode;
      if (s.autoSkip !== undefined) this._autoSkip = !!s.autoSkip;
      if (s.focusPositions && typeof s.focusPositions === 'object') this._focusPositions = s.focusPositions;
    } catch {}
  }

  _saveThemeState() {
    if (!this._currentTheme) return;
    if (!this._themeStates[this._currentTheme]) {
      this._themeStates[this._currentTheme] = {};
    }
    this._themeStates[this._currentTheme].songIndex = this._currentSongIndex;
    this._themeStates[this._currentTheme].position = this.currentTime || 0;
    this._saveState();
  }

  init(initialThemeId, onUpdate) {
    this._onUpdate = onUpdate;
    this._loadState();
    if (!this._currentTheme && initialThemeId) {
      this._currentTheme = initialThemeId;
    }
    if (this._currentTheme) {
      const saved = this._themeStates[this._currentTheme];
      if (saved?.songIndex != null) {
        this._currentSongIndex = saved.songIndex;
      }
    }
    this._notify();
  }

  async mountPlayer(containerEl) {
    if (this._mounted) return;
    this._playerContainer = containerEl;
    this._mounted = true;

    await loadYTApi();

    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs?.length) { this._notify(); return; }

    const idx = Math.min(this._currentSongIndex, songs.length - 1);
    this._currentSongIndex = idx;
    const song = songs[idx];

    this._createPlayer(song.videoId);
    this._notify();
  }

  _createPlayer(videoId) {
    if (this._ytPlayer) {
      try { this._ytPlayer.destroy(); } catch {}
      this._ytPlayer = null;
    }
    if (!this._playerContainer) return;

    this._ytPlayer = new window.YT.Player(this._playerContainer, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: (e) => {
          this._ytReady = true;
          e.target.setVolume(this._volume);
          const savedPos = this._themeStates[this._currentTheme]?.position || 0;
          this._pendingSeek = savedPos;
          if (!this._isPaused) {
            e.target.mute();
            this._muted = true;
            e.target.playVideo();
          } else if (this._muted) {
            e.target.mute();
          }
          this._startProgressPolling();
          this._notify();
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            this._onTrackEnded();
          } else if (e.data === window.YT.PlayerState.PLAYING) {
            this._isPaused = false;
            if (this._pendingSeek !== null && this._pendingSeek > 0) {
              e.target.seekTo(this._pendingSeek, true);
              this._pendingSeek = null;
            }
            this._notify();
          } else if (e.data === window.YT.PlayerState.PAUSED) {
            this._isPaused = true;
            this._notify();
          }
        },
      },
    });
  }

  _onTrackEnded() {
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs?.length) return;

    if (this._loopMode === 'song') {
      this._ytPlayer?.seekTo(0);
      this._ytPlayer?.playVideo();
      return;
    }

    if (this._loopMode === 'random') {
      let newIdx;
      do { newIdx = Math.floor(Math.random() * songs.length); }
      while (newIdx === this._currentSongIndex && songs.length > 1);
      this._currentSongIndex = newIdx;
    } else {
      this._currentSongIndex = (this._currentSongIndex + 1) % songs.length;
    }

    const song = songs[this._currentSongIndex];
    if (song) {
      this._pendingSeek = 0;
      this._ytPlayer?.loadVideoById(song.videoId, 0);
      if (this._themeStates[this._currentTheme]) {
        this._themeStates[this._currentTheme].position = 0;
      }
      this._saveThemeState();
    }
    this._notify();
  }

  async playTheme(themeId) {
    const songs = PLAYLISTS[themeId]?.songs;
    if (!songs?.length) return;

    const prevTheme = this._currentTheme;

    if (prevTheme === themeId) {
      this._saveThemeState();
      return;
    }

    this._saveThemeState();
    this._currentTheme = themeId;

    const saved = this._themeStates[themeId];
    let idx = saved?.songIndex ?? 0;
    if (idx < 0 || idx >= songs.length) idx = 0;
    this._currentSongIndex = idx;

    if (!this._mounted) {
      this._saveState();
      this._notify();
      return;
    }

    const song = songs[idx];
    if (song && this._ytPlayer) {
      const savedPos = this._themeStates[themeId]?.position || 0;
      this._pendingSeek = savedPos;
      this._ytPlayer.loadVideoById(song.videoId, savedPos);
      if (this._isPaused) {
        this._ytPlayer.pauseVideo();
      }
    } else if (song && this._playerContainer) {
      this._createPlayer(song.videoId);
    }

    this._saveState();
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

    const song = songs[this._currentSongIndex];
    if (song && this._ytPlayer) {
      this._pendingSeek = 0;
      this._ytPlayer.loadVideoById(song.videoId, 0);
      this._isPaused = false;
      if (this._themeStates[this._currentTheme]) {
        this._themeStates[this._currentTheme].position = 0;
      }
    }
    this._saveThemeState();
    this._notify();
  }

  async prevTrack() {
    if (!this.hasPrev) return;
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs) return;
    this._currentSongIndex--;
    const song = songs[this._currentSongIndex];
    if (song && this._ytPlayer) {
      this._pendingSeek = 0;
      this._ytPlayer.loadVideoById(song.videoId, 0);
      this._isPaused = false;
      if (this._themeStates[this._currentTheme]) {
        this._themeStates[this._currentTheme].position = 0;
      }
    }
    this._saveThemeState();
    this._notify();
  }

  async selectSong(index) {
    const songs = PLAYLISTS[this._currentTheme]?.songs;
    if (!songs || index < 0 || index >= songs.length || index === this._currentSongIndex) return;
    this._currentSongIndex = index;
    const song = songs[index];
    if (song && this._ytPlayer) {
      this._pendingSeek = 0;
      this._ytPlayer.loadVideoById(song.videoId, 0);
      this._isPaused = false;
      if (this._themeStates[this._currentTheme]) {
        this._themeStates[this._currentTheme].position = 0;
      }
    }
    this._saveThemeState();
    this._notify();
  }

  seek(frac) {
    if (!this._ytPlayer?.getDuration) return;
    const dur = this._ytPlayer.getDuration();
    if (!dur) return;
    this._ytPlayer.seekTo(Math.max(0, Math.min(1, frac)) * dur, true);
    this._saveThemeState();
  }

  toggleLoopMode() {
    const modes = ['playlist', 'song', 'random'];
    const idx = modes.indexOf(this._loopMode);
    this._loopMode = modes[(idx + 1) % modes.length];
    this._saveState();
    this._notify();
  }

  setLoopMode(mode) {
    if (mode === 'playlist' || mode === 'song' || mode === 'random') {
      this._loopMode = mode;
      this._saveState();
      this._notify();
    }
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(100, Math.round(v)));
    if (this._ytPlayer?.setVolume) {
      this._ytPlayer.setVolume(this._volume);
    }
    this._saveState();
    this._notify();
  }

  _setMuted(muted) {
    this._muted = muted;
    if (this._ytPlayer) {
      muted ? this._ytPlayer.mute() : this._ytPlayer.unMute();
    }
    this._saveState();
    this._notify();
  }

  toggleMusicMute() {
    this._setMuted(!this._muted);
  }

  setMusicMuted(muted) {
    this._setMuted(Boolean(muted));
  }

  setFxVolume(v) {
    this._fxVolume = Math.max(0, Math.min(1, v));
    this._saveState();
    this._notify();
  }

  setSfxEnabled(enabled) {
    this._sfxMuted = !enabled;
    this._notify();
  }

  pause() {
    if (this._isPaused || !this._ytPlayer?.pauseVideo) return;
    this._ytPlayer.pauseVideo();
    this._isPaused = true;
    this._saveThemeState();
    this._saveState();
    this._notify();
  }

  resume() {
    if (!this._mounted) {
      this._mounted = true;
      this._isPaused = false;
      this._notify();
      return;
    }
    if (!this._ytPlayer?.playVideo) return;
    this._ytPlayer.playVideo();
    this._isPaused = false;
    this._saveState();
  }

  togglePlay() {
    if (this._isPaused && this._mounted) {
      this.resume();
    } else if (this.playing) {
      this.pause();
    } else if (this._currentTheme) {
      this.playTheme(this._currentTheme);
    }
  }

  _startProgressPolling() {
    this._stopProgressPolling();
    this._positionSaveCounter = 0;
    this._progressTimer = setInterval(() => {
      this._notify();
      this._positionSaveCounter++;
      if (this._positionSaveCounter >= 5) {
        this._positionSaveCounter = 0;
        this._saveThemeState();
      }
    }, 1000);
  }

  _stopProgressPolling() {
    if (this._progressTimer) {
      clearInterval(this._progressTimer);
      this._progressTimer = null;
    }
  }

  _notify() {
    if (this._onUpdate) {
      this._onUpdate({
        volume: this._volume,
        musicMuted: this._ytPlayer?.isMuted?.() ?? false,
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
        mounted: this._mounted,
        autoSkip: this._autoSkip,
      });
    }
  }

  // ── Focus Mode Player ──
  async mountFocusPlayer(containerEl, startTimer = true) {
    console.log('[AUDIO] mountFocusPlayer start, startTimer:', startTimer);
    await loadYTApi();
    if (this._focusPlayer) {
      try { this._focusPlayer.destroy(); } catch {}
      this._focusPlayer = null;
    }
    this._focusContainer = containerEl;
    const video = FOCUS_VIDEOS[this._focusIndex];
    console.log('[AUDIO] Loading video:', video.videoId, video.label);

    this._focusPlayer = new window.YT.Player(containerEl, {
      videoId: video.videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1, mute: 1, loop: 1, playlist: video.videoId,
        controls: 0, disablekb: 1, fs: 0, modestbranding: 1,
        rel: 0, playsinline: 1, showinfo: 0, iv_load_policy: 3,
        cc_load_policy: 0, color: 'white',
      },
      events: {
        onReady: (e) => {
          console.log('[AUDIO] YT Player onReady — video loaded');
          e.target.mute();
          const savedPos = this._focusPositions[video.videoId] || 0;
          if (savedPos > 0) {
            e.target.seekTo(savedPos, true);
          }
          e.target.playVideo();
          if (startTimer) {
            this._startFocusTimer();
          }
        },
      },
    });
  }

  destroyFocusPlayer() {
    this._stopFocusTimer();
    if (this._focusPlayer) {
      if (this._focusPlayer.getCurrentTime) {
        const video = FOCUS_VIDEOS[this._focusIndex];
        this._focusPositions[video.videoId] = this._focusPlayer.getCurrentTime();
        this._saveState();
      }
      try { this._focusPlayer.destroy(); } catch {}
      this._focusPlayer = null;
    }
  }

  focusNext() {
    console.log('[AUDIO] focusNext() called');
    if (this._focusPlayer?.getCurrentTime) {
      const video = FOCUS_VIDEOS[this._focusIndex];
      this._focusPositions[video.videoId] = this._focusPlayer.getCurrentTime();
    }
    this._focusIndex = (this._focusIndex + 1) % FOCUS_VIDEOS.length;
    console.log('[AUDIO] New focusIndex:', this._focusIndex);
    this._saveState();
    if (this._focusContainer) this.mountFocusPlayer(this._focusContainer, false);
  }

  focusPrev() {
    if (this._focusPlayer?.getCurrentTime) {
      const video = FOCUS_VIDEOS[this._focusIndex];
      this._focusPositions[video.videoId] = this._focusPlayer.getCurrentTime();
    }
    this._focusIndex = (this._focusIndex - 1 + FOCUS_VIDEOS.length) % FOCUS_VIDEOS.length;
    this._saveState();
    if (this._focusContainer) this.mountFocusPlayer(this._focusContainer, false);
  }

  toggleAutoSkip() {
    this._autoSkip = !this._autoSkip;
    this._saveState();
    console.log('[AUDIO] autoSkip toggled:', this._autoSkip);
    return this._autoSkip;
  }

  setFocusMode(enabled) {
    this._focusMode = enabled;
    this._saveState();
  }

  _startFocusTimer() {
    this._stopFocusTimer();
    if (!this._autoSkip) {
      console.log('[AUDIO] _startFocusTimer — autoSkip off, skipping timer');
      return;
    }
    console.log('[AUDIO] _startFocusTimer — setTimeout 10min');
    this._focusTimer = setTimeout(() => {
      console.log('[AUDIO] Timer fired — dispatching focus-video-change');
      this._focusTimer = null;
      window.dispatchEvent(new CustomEvent('focus-video-change'));
    }, 10 * 60 * 1000);
  }

  _stopFocusTimer() {
    if (this._focusTimer) {
      console.log('[AUDIO] _stopFocusTimer — clearing timer');
      clearTimeout(this._focusTimer);
      this._focusTimer = null;
    }
  }

  startFocusTimer() {
    console.log('[AUDIO] startFocusTimer() called');
    this._startFocusTimer();
  }
}

export const audioManager = new AudioManager();
