import { PIGEON_THEME, setPigeonSlopActive } from './config.js';
import { applyParticleTheme } from './game.js';
import { audioManager } from './audio.js';
import { sfxManager } from './sfx.js';

const SPAWN_MIN_MS = 60_000;
const SPAWN_MAX_MS = 180_000;
const DESPAWN_MS = 30_000;
const CORNERS = ['corner-tl', 'corner-tr', 'corner-bl', 'corner-br'];

let _app = null;
let _spawnTimer = null;
let _despawnTimer = null;
let _pigeonEl = null;
let _slopActive = false;
let _disabled = false;

function loadThemeFonts(theme) {
  const families = { pigeon: ['Rubik+Dirt'] };
  const fams = families[theme];
  if (!fams) return;
  const id = `theme-fonts-${theme}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  const query = fams.map(f => `family=${f}`).join('&');
  link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
  document.head.appendChild(link);
}

function _clearTimers() {
  if (_spawnTimer) { clearTimeout(_spawnTimer); _spawnTimer = null; }
  if (_despawnTimer) { clearTimeout(_despawnTimer); _despawnTimer = null; }
}

function _removePigeon() {
  if (_pigeonEl) {
    _pigeonEl.classList.add('leaving');
    const el = _pigeonEl;
    setTimeout(() => el.remove(), 500);
    _pigeonEl = null;
  }
  if (_despawnTimer) { clearTimeout(_despawnTimer); _despawnTimer = null; }
}

function _onPigeonClick() {
  if (!_app || _slopActive) return;
  if (_despawnTimer) { clearTimeout(_despawnTimer); _despawnTimer = null; }
  sfxManager.play('pigeon');
  _app.pigeonModalVisible = true;
}

function _spawnPigeon() {
  if (_slopActive || _pigeonEl || _disabled) return;

  const container = document.getElementById('pigeonContainer');
  if (!container) return;

  container.innerHTML = '';

  const corner = CORNERS[Math.floor(Math.random() * CORNERS.length)];

  const wrapper = document.createElement('div');
  wrapper.className = `pigeon-container ${corner}`;
  wrapper.setAttribute('role', 'button');
  wrapper.setAttribute('tabindex', '0');
  wrapper.setAttribute('aria-label', 'Pigeon');

  const imgWrap = document.createElement('div');
  imgWrap.className = 'pigeon-img-wrap';

  const img = document.createElement('img');
  img.src = 'images/pigeon.webp';
  img.alt = 'Pigeon';
  img.className = 'pigeon-img';
  img.draggable = false;

  const bubble = document.createElement('span');
  bubble.className = 'pigeon-bubble';
  bubble.textContent = 'slop slop';

  imgWrap.appendChild(img);
  wrapper.appendChild(bubble);
  wrapper.appendChild(imgWrap);
  container.appendChild(wrapper);

  _pigeonEl = wrapper;

  wrapper.addEventListener('click', _onPigeonClick);
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') _onPigeonClick();
  });

  sfxManager.play('pigeon');

  _despawnTimer = setTimeout(() => {
    _removePigeon();
    _scheduleSpawn();
  }, DESPAWN_MS);
}

function _scheduleSpawn() {
  if (_slopActive || _spawnTimer || _disabled) return;
  const delay = SPAWN_MIN_MS + Math.random() * (SPAWN_MAX_MS - SPAWN_MIN_MS);
  _spawnTimer = setTimeout(() => {
    _spawnTimer = null;
    _spawnPigeon();
  }, delay);
}

export function initPigeon(app, disabled) {
  _app = app;
  _disabled = !!disabled;
  _slopActive = !!app.pigeonSlopActive;
  if (!_slopActive && !_disabled) {
    _scheduleSpawn();
  }
}

export function setPigeonDisabled(disabled) {
  _disabled = !!disabled;
  if (_disabled) {
    _clearTimers();
    _removePigeon();
  } else if (!_slopActive) {
    _scheduleSpawn();
  }
}

export function stopPigeonSpawning() {
  _clearTimers();
  _removePigeon();
}

export function resumePigeonSpawning() {
  if (!_slopActive && !_disabled) {
    _scheduleSpawn();
  }
}

export function syncPigeonVideoAudio(muted, volume) {
  const video = document.getElementById('pigeonVideo');
  if (!video || !_slopActive) return;
  const norm = Math.max(0, Math.min(1, volume / 100));
  video.volume = muted ? 0 : norm;
}

export function activatePigeonSlopMode(app) {
  _slopActive = true;
  setPigeonSlopActive(true);
  _clearTimers();
  _removePigeon();

  app.pigeonSlopActive = true;
  document.body.setAttribute('data-theme', PIGEON_THEME);
  document.body.setAttribute('data-theme-mode', app.themeMode);
  loadThemeFonts(PIGEON_THEME);

  audioManager.pause();
  audioManager.stopProgressPolling();
  if (app._pollTimer) {
    clearInterval(app._pollTimer);
    app._pollTimer = null;
  }

  if (app.focusMode) {
    app.focusMode = false;
    audioManager.setFocusMode(false);
    audioManager.destroyFocusPlayer();
  }

  // Wait for Alpine to render the video element visible, then play
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const video = document.getElementById('pigeonVideo');
      if (video) {
        const norm = Math.max(0, Math.min(1, (app.audioVolume || 20) / 100));
        video.volume = app.audioMusicMuted ? 0 : norm;
        video.src = 'videos/pidulgi_4opt.mp4';
        video.addEventListener('canplay', function onCanPlay() {
          video.removeEventListener('canplay', onCanPlay);
          video.play().catch(() => {});
          app.pigeonVideoPlaying = true;
        });
        video.load();
      }
    });
  });
}

export function deactivatePigeonSlopMode(app) {
  _slopActive = false;
  setPigeonSlopActive(false);
  app.pigeonSlopActive = false;
  app.pigeonVideoPlaying = false;

  const restoreTheme = app.theme || 'nmixx';
  document.body.setAttribute('data-theme', restoreTheme);
  document.body.setAttribute('data-theme-mode', app.themeMode);
  applyParticleTheme(restoreTheme);
  loadThemeFonts(restoreTheme);

  const video = document.getElementById('pigeonVideo');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  audioManager.playTheme(restoreTheme);
  audioManager.startProgressPolling();
  if (!app._pollTimer) {
    app._pollTimer = setInterval(() => {
      app.audioProgress = audioManager.progress;
      app.audioCurrentTime = audioManager.currentTime;
      app.audioDuration = audioManager.duration;
      app.audioPlaying = audioManager.playing;
      app.audioHasNext = audioManager.hasNext;
      app.audioHasPrev = audioManager.hasPrev;
      app.audioSongs = audioManager.songs;
      app.audioSongIndex = audioManager.currentSongIndex;
      app.audioLoopMode = audioManager.loopMode;
      app.audioMounted = audioManager.mounted;
      app.audioFocusIndex = audioManager.focusIndex;
      app.audioFocusCount = audioManager.focusCount;
      app.audioFocusVideoUrl = audioManager.focusVideoUrl;
      app.audioFocusAutoSkip = audioManager.autoSkip;
    }, 1000);
  }

  _scheduleSpawn();
}
