const STORAGE_KEYS = {
  cards: 'krsoul-bingo-cards-v2',
  size: 'krsoul-bingo-size-v2',
  marks: 'krsoul-bingo-marks-v2',
  theme: 'krsoul-bingo-theme-v2',
  emoteSourceCache: 'krsoul-bingo-emote-source-cache-v1',
  twitchUserId: 'krsoul-bingo-twitch-user-id-v1'
};
const DEFAULT_TWITCH_USER_ID = '55947428';
const EMOTE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const EMOTE_CACHE_FAIL_TTL_MS = 10 * 60 * 1000;

const PARTICLE_THEME_OPTIONS = {
  twice: {
    // Pop, vibrant, bubbly.
    particles: {
      number: { value: 120, density: { enable: true, value_area: 800 } },
      color: { value: ['#ff7f00', '#ff007f', '#ffd3f0'] },
      shape: { type: ['circle', 'star'], stroke: { width: 0 } },
      opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1.5, opacity_min: 0.1, sync: false } },
      size: { value: 5, random: true, anim: { enable: true, speed: 4.0, size_min: 2, sync: false } },
      line_linked: { enable: false },
      move: { enable: true, speed: 2.5, direction: 'none', random: true, straight: false, out_mode: 'bounce', bounce: true }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'bubble' }, onclick: { enable: true, mode: 'repulse' }, resize: true },
      modes: { bubble: { distance: 150, size: 10, duration: 0.4, opacity: 0.8 }, repulse: { distance: 200, duration: 0.4 } }
    },
    retina_detect: true
  },
  aespa: {
    // Cyber/AI/Network theme. Less dense to avoid visually blocking the board.
    particles: {
      number: { value: 100, density: { enable: true, value_area: 900 } },
      color: { value: ['#00ffff', '#d900ff', '#5500ff'] },
      shape: { type: ['polygon', 'edge'], stroke: { width: 0 }, polygon: { nb_sides: 6 } },
      opacity: { value: 0.35, random: false, anim: { enable: false } },
      size: { value: 3, random: true, anim: { enable: false } },
      line_linked: { enable: true, distance: 130, color: '#00ffff', opacity: 0.25, width: 1 },
      move: { enable: true, speed: 1.5, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { grab: { distance: 220, line_linked: { opacity: 0.6 } }, push: { particles_nb: 5 } }
    },
    retina_detect: true
  },
  nmixx: {
    // Chaotic mix pop theme.
    particles: {
      number: { value: 130, density: { enable: true, value_area: 800 } },
      color: { value: ['#ff0055', '#0033ff', '#00ffcc', '#ffffff'] },
      shape: { type: ['polygon', 'circle', 'triangle', 'star'], stroke: { width: 0 }, polygon: { nb_sides: 5 } },
      opacity: { value: 0.4, random: true, anim: { enable: true, speed: 2.0, opacity_min: 0.1, sync: false } },
      size: { value: 4, random: true, anim: { enable: true, speed: 5.0, size_min: 1, sync: false } },
      line_linked: { enable: true, distance: 100, color: '#00ffcc', opacity: 0.15, width: 1 },
      move: { enable: true, speed: 4, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { repulse: { distance: 100, duration: 0.2 }, push: { particles_nb: 8 } }
    },
    retina_detect: true
  },
  newjeans: {
    // Y2K/Retro chill vibe. Slow large circles.
    particles: {
      number: { value: 70, density: { enable: true, value_area: 800 } },
      color: { value: ['#ffee00', '#0055ff', '#ffffff'] },
      shape: { type: 'circle', stroke: { width: 0 } },
      opacity: { value: 0.4, random: true, anim: { enable: true, speed: 0.5, opacity_min: 0.1, sync: false } },
      size: { value: 10, random: true, anim: { enable: true, speed: 1.0, size_min: 4, sync: false } },
      line_linked: { enable: false },
      move: { enable: true, speed: 0.8, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'bubble' }, onclick: { enable: true, mode: 'repulse' }, resize: true },
      modes: { bubble: { distance: 200, size: 15, duration: 1, opacity: 0.6 }, repulse: { distance: 150, duration: 0.8 } }
    },
    retina_detect: true
  },
  lesserafim: {
    // ANTIGRAVITY theme. Intense sparks floating upwards.
    particles: {
      number: { value: 180, density: { enable: true, value_area: 800 } },
      color: { value: ['#ff0000', '#ffb3b3', '#ffffff'] },
      shape: { type: 'circle', stroke: { width: 0 } },
      opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1.5, opacity_min: 0.1, sync: false } },
      size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.5, sync: false } },
      line_linked: { enable: false },
      move: { enable: true, speed: 3, direction: 'top', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { repulse: { distance: 120, duration: 0.3 }, push: { particles_nb: 8 } }
    },
    retina_detect: true
  }
};

// Restored Original Cards
const DEFAULT_CARDS = [
  '💀 DeS on PC', '🩸 Bloodborne', '⚡ GoW 3', '🔥 New Fromsoft Game', '🗡️ DS2/3 Remaster',
  '⚔️ FFVII Part 3', '🚗 GTA 6', '🎭 Persona 6', '🏹 Warhorse New Game', '🎲 Divinity',
  '🪄 Hogwarts?', '🌸 Stellar Blade 2', '🗑️ 1st Party Live Service SLOP', '🌊 Horizon 3', '👫 Friend Slop Game',
  '📈 Incremental Game', '🗣️ Japanese Speaking Person', '🚀 Intergalactic Gameplay?', '🐉 Dragon\'s Dogma 2 DLC', '✨ New JRPG',
  '🤖 Astrobot 2', '🧱 Lego Slop', '🏎️ GT8', '😈 DMC', '🦕 Dino Crisis'
];

const state = {
  size: 5,
  cards: [...DEFAULT_CARDS],
  marks: Array(25).fill(false),
  theme: 'twice',
  twitchUserId: DEFAULT_TWITCH_USER_ID,
  lastCompletedKeys: new Set(),
  history: [],
  redoHistory: [],
  emotes: {
    loading: false,
    ready: false,
    error: '',
    lookup: new Map(),
    assetCache: new Map(),
    sourceRecords: new Map()
  }
};

function destroyParticles() {
  if (!window.pJSDom || !window.pJSDom.length) return;
  for (const item of window.pJSDom) {
    if (item?.pJS?.fn?.vendors?.destroypJS) {
      item.pJS.fn.vendors.destroypJS();
    }
  }
  window.pJSDom = [];
}

function themeParticleOptions(name) {
  return PARTICLE_THEME_OPTIONS[name] || PARTICLE_THEME_OPTIONS.twice;
}

function applyParticleTheme(name) {
  destroyParticles();
  if (window.particlesJS) {
    window.particlesJS('tsparticles', themeParticleOptions(name));
  }
}

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function loadEmoteSourceCache() {
  const cache = loadJson(STORAGE_KEYS.emoteSourceCache, null);
  return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {};
}

function saveEmoteSourceCache(cache) {
  try {
    localStorage.setItem(STORAGE_KEYS.emoteSourceCache, JSON.stringify(cache));
  } catch {}
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.size, state.size);
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(state.cards));
  localStorage.setItem(STORAGE_KEYS.marks, JSON.stringify(state.marks));
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  localStorage.setItem(STORAGE_KEYS.twitchUserId, state.twitchUserId);
}

function loadState() {
  const storedSize = Number(localStorage.getItem(STORAGE_KEYS.size));
  if (storedSize === 3 || storedSize === 5) state.size = storedSize;

  const storedCards = loadJson(STORAGE_KEYS.cards, null);
  if (Array.isArray(storedCards) && storedCards.length) state.cards = storedCards.map(v => String(v).trim());

  const storedMarks = loadJson(STORAGE_KEYS.marks, null);
  if (Array.isArray(storedMarks)) state.marks = storedMarks.map(Boolean);

  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (storedTheme) state.theme = storedTheme;

  state.twitchUserId = String(localStorage.getItem(STORAGE_KEYS.twitchUserId) || DEFAULT_TWITCH_USER_ID).replace(/\D/g, '').trim() || DEFAULT_TWITCH_USER_ID;

  while(state.cards.length < 25) state.cards.push('');
  state.cards = state.cards.slice(0, 25);
  while(state.marks.length < 25) state.marks.push(false);
  state.marks = state.marks.slice(0, 25);
}

function setTheme(name) {
  state.theme = name;
  document.body.setAttribute('data-theme', name);
  
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === name);
  });
  saveState();
  applyParticleTheme(name);
}

function parseCardsText() {
  const lines = document.getElementById('cardsInput').value.replace(/\r/g, '').split('\n');
  while (lines.length < 25) lines.push('');
  state.cards = lines.slice(0, 25).map(l => l.trimEnd());
  saveState();
}

function looksLikeEmoji(ch) {
  return ch && ( /[\u2600-\u27BF]/.test(ch) || /\p{Extended_Pictographic}/u.test(ch) );
}



function splitCard(line) {
  const text = String(line || '').replace(/\s+/g, ' ').trim();
  if (!text) return { icon: '\u2726', label: 'Empty', iconIsEmote: false };
  const parts = text.split(' ');
  const first = parts[0];
  const rest = parts.slice(1).join(' ').trim();
  const firstIsEmote = Boolean(getEmoteEntry(first));
  if (looksLikeEmoji(first) || firstIsEmote) return { icon: first, label: rest, iconIsEmote: firstIsEmote };
  return { icon: '\u2726', label: text, iconIsEmote: false };
}

function getEmoteEntry(token) {
  return state.emotes.lookup.get(String(token || '').trim()) || null;
}

function getEmoteAssetStatus(url) {
  return state.emotes.assetCache.get(url)?.status || 'idle';
}

function markEmoteAssetStatus(url, status) {
  const cached = state.emotes.assetCache.get(url);
  if (cached && cached.status === 'loaded' && status !== 'loaded') return;
  state.emotes.assetCache.set(url, { status });
}

function createEmoteImage(emote) {
  const slot = document.createElement('span');
  slot.className = 'emote-slot';

  const placeholder = document.createElement('span');
  placeholder.className = 'emote-placeholder';
  placeholder.textContent = '\u231B';

  const img = document.createElement('img');
  img.className = 'emote';
  img.alt = emote.code;
  img.title = `${emote.code}${emote.provider ? ` (${emote.provider.toUpperCase()})` : ''}`;
  img.decoding = 'async';
  img.loading = 'eager';
  img.referrerPolicy = 'no-referrer';
  img.dataset.src = emote.url;

  img.addEventListener('load', () => {
    markEmoteAssetStatus(emote.url, 'loaded');
    slot.classList.add('emote-ready');
  }, { once: true });

  img.addEventListener('error', () => {
    markEmoteAssetStatus(emote.url, 'error');
    slot.classList.remove('emote-ready');
  }, { once: true });

  slot.appendChild(placeholder);
  slot.appendChild(img);
  if (getEmoteAssetStatus(emote.url) === 'loaded') {
    img.src = emote.url;
    slot.classList.add('emote-ready');
  } else {
    scheduleEmoteImageLoad(img, emote.url);
  }
  return slot;
}

const emoteObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const img = entry.target;
        const url = img.dataset.src;
        if (!url || img.src) {
          emoteObserver.unobserve(img);
          continue;
        }
        if (getEmoteAssetStatus(url) !== 'error') img.src = url;
        emoteObserver.unobserve(img);
      }
    }, { rootMargin: '120px' })
  : null;

function scheduleEmoteImageLoad(img, url) {
  const start = () => {
    if (!img.isConnected || img.src || !url || getEmoteAssetStatus(url) === 'error') return;
    img.src = url;
  };

  if (emoteObserver) {
    emoteObserver.observe(img);
    return;
  }

  requestAnimationFrame(start);
}
function appendRichText(target, text) {
  const parts = String(text || '').split(/(\s+)/);
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      target.appendChild(document.createTextNode(part));
      continue;
    }
    const emote = getEmoteEntry(part);
    target.appendChild(emote ? createEmoteImage(emote) : document.createTextNode(part));
  }
}

function normalizeEmoteArray(entries, provider, scope, priority) {
  const out = [];
  for (const entry of entries || []) {
    const id = String(entry?.id || '').trim();
    const code = String(entry?.code || entry?.name || '').trim();
    if (!id || !code) continue;

    const imageType = String(entry?.imageType || '').toLowerCase();
    let url = '';

    if (provider === 'bttv') {
      const ext = imageType === 'gif' ? 'gif' : imageType === 'png' ? 'png' : 'webp';
      url = `https://cdn.betterttv.net/emote/${id}/2x.${ext}`;
    } else if (provider === '7tv') {
      url = `https://cdn.7tv.app/emote/${id}/2x.webp`;
    }

    if (!url) continue;

    out.push({
      provider,
      scope,
      priority,
      id,
      code,
      url,
      animated: Boolean(entry?.animated)
    });
  }
  return out;
}

function collectEmoteArrays(payload) {
  const arrays = [];
  const push = value => {
    if (Array.isArray(value) && value.length) arrays.push(value);
  };

  if (!payload) return arrays;
  if (Array.isArray(payload)) return [payload];

  push(payload.emotes);
  push(payload.channelEmotes);
  push(payload.sharedEmotes);
  push(payload.data?.emotes);
  push(payload.emote_set?.emotes);
  push(payload.emoteSet?.emotes);
  if (Array.isArray(payload.emote_sets)) {
    for (const set of payload.emote_sets) push(set?.emotes);
  }

  return arrays;
}

function flattenEmotes(payload, provider, scope, priority) {
  const emotes = [];
  for (const arr of collectEmoteArrays(payload)) {
    emotes.push(...normalizeEmoteArray(arr, provider, scope, priority));
  }
  return emotes;
}

function setEmoteStatus(message, kind = '') {
  const el = document.getElementById('emoteStatus');
  if (!el) return;
  el.textContent = message;
  el.dataset.state = kind;
}

function mergeEmoteMaps(records) {
  const lookup = new Map();
  for (const emote of records) {
    const existing = lookup.get(emote.code);
    if (!existing || emote.priority >= existing.priority) lookup.set(emote.code, emote);
  }
  return lookup;
}

function rebuildEmoteLookup() {
  const allRecords = [];
  for (const records of state.emotes.sourceRecords.values()) {
    allRecords.push(...records);
  }
  state.emotes.lookup = mergeEmoteMaps(allRecords);
}

const emoteRequestCache = new Map();

async function fetchJson(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchCachedEmoteRecords(cacheKey, url, mapper, timeoutMs = 6000) {
  const now = Date.now();
  const cache = loadEmoteSourceCache();
  const cachedEntry = cache[cacheKey];
  if (cachedEntry && cachedEntry.ok && now - cachedEntry.at < EMOTE_CACHE_TTL_MS && Array.isArray(cachedEntry.records)) {
    return cachedEntry.records;
  }
  if (cachedEntry && !cachedEntry.ok && now - cachedEntry.at < EMOTE_CACHE_FAIL_TTL_MS) {
    throw new Error(cachedEntry.error || 'cached failure');
  }

  if (emoteRequestCache.has(cacheKey)) return emoteRequestCache.get(cacheKey);

  const request = (async () => {
    try {
      const data = await fetchJson(url, timeoutMs);
      const records = mapper(data);
      cache[cacheKey] = { ok: true, at: Date.now(), records };
      saveEmoteSourceCache(cache);
      return records;
    } catch (err) {
      cache[cacheKey] = { ok: false, at: Date.now(), error: String(err?.message || err) };
      saveEmoteSourceCache(cache);
      throw err;
    } finally {
      emoteRequestCache.delete(cacheKey);
    }
  })();

  emoteRequestCache.set(cacheKey, request);
  return request;
}

async function loadBttvGlobal() {
  return fetchCachedEmoteRecords(
    'bttv-global',
    'https://api.betterttv.net/3/cached/emotes/global',
    data => flattenEmotes(data, 'bttv', 'global', 10)
  );
}

async function loadBttvChannel(twitchUserId) {
  const cacheKey = `bttv-channel:${twitchUserId}`;
  const url = `https://api.betterttv.net/3/cached/users/twitch/${encodeURIComponent(twitchUserId)}`;
  return fetchCachedEmoteRecords(cacheKey, url, data => [
    ...flattenEmotes(data?.sharedEmotes, 'bttv', 'channel', 30),
    ...flattenEmotes(data?.channelEmotes, 'bttv', 'channel', 30)
  ]);
}

async function load7tvGlobal() {
  return fetchCachedEmoteRecords(
    '7tv-global',
    'https://api.7tv.app/v3/emote-sets/global',
    data => flattenEmotes(data, '7tv', 'global', 20)
  );
}

async function load7tvChannel(twitchUserId) {
  const cacheKey = `7tv-channel:${twitchUserId}`;
  const url = `https://api.7tv.app/v3/users/twitch/${encodeURIComponent(twitchUserId)}`;
  return fetchCachedEmoteRecords(cacheKey, url, data => flattenEmotes(data, '7tv', 'channel', 40));
}

let emoteRefreshToken = 0;
let emoteRefreshTimer = null;

function refreshEmotes() {
  const token = ++emoteRefreshToken;
  const twitchUserId = state.twitchUserId.trim();
  const sources = [
    ['BTTV global', loadBttvGlobal],
    ['7TV global', load7tvGlobal]
  ];

  if (twitchUserId) {
    sources.push(['BTTV channel', () => loadBttvChannel(twitchUserId)]);
    sources.push(['7TV channel', () => load7tvChannel(twitchUserId)]);
  }

  state.emotes.loading = true;
  state.emotes.ready = false;
  state.emotes.error = '';
  state.emotes.sourceRecords = new Map();
  state.emotes.lookup = new Map();
  setEmoteStatus(twitchUserId ? 'Loading emotes...' : 'Loading global emotes...');
  renderBoard(false);

  const sourceState = new Map(sources.map(([label]) => [label, 'pending']));

  const syncStatus = () => {
    const loaded = [];
    const pending = [];
    const failed = [];

    for (const [label, status] of sourceState.entries()) {
      if (status === 'loaded') loaded.push(label);
      else if (status === 'failed') failed.push(label);
      else pending.push(label);
    }

    state.emotes.loading = pending.length > 0;
    state.emotes.ready = pending.length === 0;
    state.emotes.error = failed.join(', ');

    if (!loaded.length && pending.length) {
      setEmoteStatus(`Loading ${pending.join(', ')}...`);
    } else if (loaded.length && pending.length) {
      setEmoteStatus(`Loaded ${loaded.join(', ')}; loading ${pending.join(', ')}...`, 'partial');
    } else if (loaded.length && failed.length) {
      setEmoteStatus(`Loaded ${loaded.join(', ')}; failed ${failed.join(', ')}`, 'partial');
    } else if (loaded.length) {
      setEmoteStatus(`Loaded ${loaded.join(', ')}`, 'ready');
    } else if (failed.length) {
      setEmoteStatus('Emote loading failed. Board text will stay plain.', 'error');
    }
  };

  const applySource = (label, records) => {
    if (token !== emoteRefreshToken) return;
    sourceState.set(label, 'loaded');
    state.emotes.sourceRecords.set(label, records);
    rebuildEmoteLookup();
    syncStatus();
    renderBoard(false);
  };

  const failSource = (label) => {
    if (token !== emoteRefreshToken) return;
    sourceState.set(label, 'failed');
    syncStatus();
  };

  for (const [label, loader] of sources) {
    Promise.resolve()
      .then(() => loader())
      .then(records => applySource(label, records))
      .catch(() => failSource(label));
  }
}

function scheduleEmoteRefresh() {
  clearTimeout(emoteRefreshTimer);
  emoteRefreshTimer = setTimeout(() => {
    refreshEmotes();
  }, 300);
}

function queueInitialEmoteRefresh() {
  setTimeout(() => refreshEmotes(), 0);
}

function gridSize() { return state.size * state.size; }
function currentCards() { return state.cards.slice(0, gridSize()).concat(Array(gridSize()).fill('')); }

function completedLineKeys() {
  const s = state.size, m = state.marks;
  const lines = [];
  for(let i=0; i<s; i++) {
    lines.push(Array.from({length: s}, (_, j) => i*s + j)); // Rows
    lines.push(Array.from({length: s}, (_, j) => j*s + i)); // Cols
  }
  lines.push(Array.from({length: s}, (_, i) => i*s + i)); // Diag 1
  lines.push(Array.from({length: s}, (_, i) => i*s + (s-1-i))); // Diag 2
  
  return new Set(lines.filter(l => l.every(idx => m[idx])).map(l => l.join(',')));
}

function updateScore() {
  const marked = state.marks.slice(0, gridSize()).filter(Boolean).length;
  const bingos = completedLineKeys().size;
  document.getElementById('score').textContent = `${marked} marked · ${bingos} BINGO${bingos !== 1 ? 's' : ''}`;
  document.getElementById('cardsCount').textContent = `${Math.min(state.cards.filter(Boolean).length, 25)} lines total`;
}

function launchConfetti() {
  const colors = ['#ff007f', '#00ffff', '#ffee00', '#5500ff', '#ffffff', '#ff0055'];
  for (let i = 0; i < 70; i++) {
    setTimeout(() => {
      const c = document.createElement('div');
      c.className = 'confetti-piece';
      c.style.cssText = `left:${Math.random()*100}vw; width:${6+Math.random()*8}px; height:${6+Math.random()*8}px; background:${colors[Math.floor(Math.random()*colors.length)]}; animation-duration:${1.5+Math.random()*2.5}s;`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }, i * 15);
  }
}

let toastTimeout = null;
let recentBingosCount = 0;

function hideToast() {
  document.getElementById('toast').classList.remove('show');
  recentBingosCount = 0;
  clearTimeout(toastTimeout);
}

document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.cell')) hideToast();
});

function celebrate(newKeys) {
  if (!newKeys.length) return;
  recentBingosCount += newKeys.length;
  const toast = document.getElementById('toast');
  document.getElementById('toastCount').textContent = recentBingosCount === 1 ? 'New line matched!' : `${recentBingosCount} lines matched!`;
  toast.classList.add('show');
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(hideToast, 1200);
  launchConfetti();
}

function renderBoard(allowCelebrate = true) {
  const grid = document.getElementById('bingoGrid');
  const cards = currentCards();
  const currentKeys = completedLineKeys();
  const previousKeys = state.lastCompletedKeys || new Set();
  const newKeys = allowCelebrate ? [...currentKeys].filter(k => !previousKeys.has(k)) : [];
  
  const activeCells = new Set();
  const newCells = new Set();
  currentKeys.forEach(k => k.split(',').forEach(n => activeCells.add(Number(n))));
  newKeys.forEach(k => k.split(',').forEach(n => newCells.add(Number(n))));

  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${state.size}, 1fr)`;
  document.querySelector('.bingo-headers').style.gridTemplateColumns = `repeat(${state.size}, 1fr)`;

  cards.slice(0, gridSize()).forEach((entry, i) => {
    const { icon, label, iconIsEmote } = splitCard(entry);
    const marked = state.marks[i];
    
    const cell = document.createElement('div');
    cell.className = `cell ${marked?'marked':''} ${activeCells.has(i)?'bingo-active':''} ${newCells.has(i)?'bingo-new':''}`;
    const iconEl = document.createElement('span');
    iconEl.className = 'cell-icon';
    if (iconIsEmote) {
      const emote = getEmoteEntry(icon);
      iconEl.appendChild(emote ? createEmoteImage(emote) : document.createTextNode(icon));
    } else {
      iconEl.textContent = icon;
    }

    const textEl = document.createElement('span');
    textEl.className = 'cell-text';
    appendRichText(textEl, label || '');

    cell.appendChild(iconEl);
    cell.appendChild(textEl);
    
    cell.addEventListener('click', () => { state.marks[i] = !state.marks[i]; saveState(); renderBoard(true); });
    grid.appendChild(cell);
  });

  state.lastCompletedKeys = currentKeys;
  if (allowCelebrate) {
    if (newKeys.length > 0) celebrate(newKeys);
    else hideToast();
  }
  updateScore();
  requestAnimationFrame(drawBingoLines);
}

function drawBingoLines() {
  const svg = document.getElementById('bingoLines');
  const grid = document.getElementById('bingoGrid');
  if (!svg || !grid) return;
  
  const keys = completedLineKeys();
  const cells = grid.querySelectorAll('.cell');
  if (cells.length === 0) return;

  const wrapperRect = svg.getBoundingClientRect();
  
  // Remove lines that are no longer valid
  Array.from(svg.children).forEach(line => {
    if (!keys.has(line.dataset.key)) line.remove();
  });
  
  keys.forEach(k => {
    const indices = k.split(',').map(Number);
    const firstCell = cells[indices[0]];
    const lastCell = cells[indices[indices.length - 1]];
    if (!firstCell || !lastCell) return;
    
    const r1 = firstCell.getBoundingClientRect();
    const r2 = lastCell.getBoundingClientRect();
    
    const x1 = r1.left + r1.width / 2 - wrapperRect.left;
    const y1 = r1.top + r1.height / 2 - wrapperRect.top;
    const x2 = r2.left + r2.width / 2 - wrapperRect.left;
    const y2 = r2.top + r2.height / 2 - wrapperRect.top;
    
    let line = svg.querySelector(`[data-key="${k}"]`);
    if (!line) {
      line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.dataset.key = k;
      line.setAttribute('class', 'bingo-line');
      svg.appendChild(line);
      
      const length = Math.hypot(x2 - x1, y2 - y1);
      line.style.strokeDasharray = length;
      line.style.setProperty('--line-length', length);
      line.style.animation = 'none'; 
      void line.offsetWidth;
      line.style.animation = 'drawLine 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    }
    
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
  });
}

window.addEventListener('resize', () => requestAnimationFrame(drawBingoLines));

document.getElementById('resetBtn').onclick = () => {
  saveToHistory();
  state.marks.fill(false); saveState(); state.lastCompletedKeys = new Set(); renderBoard(false);
};

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (undoBtn) undoBtn.disabled = state.history.length === 0;
  if (redoBtn) redoBtn.disabled = (!state.redoHistory || state.redoHistory.length === 0);
}

function saveToHistory() {
  state.history.push({
    cards: [...state.cards],
    marks: [...state.marks]
  });
  if (state.history.length > 50) state.history.shift();
  state.redoHistory = [];
  updateUndoRedoButtons();
}

document.getElementById('shuffleBtn').onclick = () => {
  saveToHistory();
  const len = gridSize();
  const pairs = [];
  for (let i = 0; i < len; i++) {
    pairs.push({ card: state.cards[i] || '', mark: state.marks[i] });
  }
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  for (let i = 0; i < len; i++) {
    state.cards[i] = pairs[i].card;
    state.marks[i] = pairs[i].mark;
  }
  document.getElementById('cardsInput').value = state.cards.join('\n');
  saveState();
  state.lastCompletedKeys = completedLineKeys();
  renderBoard(false);
};

document.getElementById('undoBtn').onclick = () => {
  if (state.history.length === 0) return;
  if (!state.redoHistory) state.redoHistory = [];
  state.redoHistory.push({
    cards: [...state.cards],
    marks: [...state.marks]
  });
  const previous = state.history.pop();
  state.cards = previous.cards;
  state.marks = previous.marks;
  
  document.getElementById('cardsInput').value = state.cards.join('\n');
  saveState();
  state.lastCompletedKeys = completedLineKeys();
  renderBoard(false);
  updateUndoRedoButtons();
};

document.getElementById('redoBtn').onclick = () => {
  if (!state.redoHistory || state.redoHistory.length === 0) return;
  state.history.push({
    cards: [...state.cards],
    marks: [...state.marks]
  });
  const next = state.redoHistory.pop();
  state.cards = next.cards;
  state.marks = next.marks;
  
  document.getElementById('cardsInput').value = state.cards.join('\n');
  saveState();
  state.lastCompletedKeys = completedLineKeys();
  renderBoard(false);
  updateUndoRedoButtons();
};

const channelUserIdInput = document.getElementById('channelUserId');

channelUserIdInput.oninput = () => {
  const nextId = channelUserIdInput.value.replace(/\D/g, '').trim();
  if (channelUserIdInput.value !== nextId) channelUserIdInput.value = nextId;
  state.twitchUserId = nextId || DEFAULT_TWITCH_USER_ID;
  saveState();
  scheduleEmoteRefresh();
};

document.getElementById('cardsInput').oninput = () => { parseCardsText(); state.lastCompletedKeys = completedLineKeys(); renderBoard(false); };
document.getElementById('boardSize').onchange = (e) => { state.size = Number(e.target.value); saveState(); renderBoard(false); };

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.onclick = () => setTheme(btn.dataset.theme);
});

// Init
loadState();
document.getElementById('cardsInput').value = state.cards.join('\n');
document.getElementById('boardSize').value = state.size;
channelUserIdInput.value = state.twitchUserId || DEFAULT_TWITCH_USER_ID;
setTheme(state.theme);
state.lastCompletedKeys = completedLineKeys();
state.history = [];
state.redoHistory = [];
updateUndoRedoButtons();
renderBoard(false);
queueInitialEmoteRefresh();
