import { state, loadEmoteSourceCache, saveEmoteSourceCache } from './state.js';
import { EMOTE_CACHE_TTL_MS, EMOTE_CACHE_FAIL_TTL_MS, TWITCH_CLIENT_ID } from './config.js';

const emoteRequestCache = new Map();

let _emoteStatusCb = null;
let _emoteRefreshCb = null;

export function onEmoteStatus(cb) { _emoteStatusCb = cb; }
export function onEmoteRefresh(cb) { _emoteRefreshCb = cb; }

export function setEmoteStatus(message, kind = '') {
  if (_emoteStatusCb) _emoteStatusCb(message, kind);
  const el = document.getElementById('emoteStatus');
  if (!el) return;
  el.textContent = message;
  el.dataset.state = kind;
}

export function looksLikeEmoji(ch) {
  return ch && (/[\u2600-\u27BF]/.test(ch) || /\p{Extended_Pictographic}/u.test(ch));
}

// ── Normalizers ──────────────────────────────────

function normalizeEmoteArray(entries, provider, scope, priority, channelId) {
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

    out.push({ provider, scope, priority, id, code, url, animated: Boolean(entry?.animated), channelId });
  }
  return out;
}

function normalizeFfzEmoteArray(emoticons, scope, priority, channelId) {
  const out = [];
  for (const entry of emoticons || []) {
    const id = String(entry?.id || '').trim();
    const code = String(entry?.name || '').trim();
    if (!id || !code) continue;
    const urls = entry?.urls || {};
    const url = urls['2'] || urls['4'] || urls['1'] || '';
    if (!url) continue;
    const resolvedUrl = url.startsWith('//') ? `https:${url}` : url;
    out.push({ provider: 'ffz', scope, priority, id, code, url: resolvedUrl, animated: false, channelId });
  }
  return out;
}

export function normalizeTwitchEmoteArray(entries, scope, priority, channelId) {
  const out = [];
  for (const entry of entries || []) {
    const id = String(entry?.id || '').trim();
    const code = String(entry?.name || '').trim();
    if (!id || !code) continue;

    const format = (entry.format || []).includes('animated') ? 'animated' : 'static';
    const themeMode = (entry.theme_mode || []).includes('dark') ? 'dark' : 'light';
    const scale = (entry.scale || []).includes('3.0') ? '3.0' : '2.0';
    const template = entry.template || 'https://static-cdn.jtvnw.net/emoticons/v2/{{id}}/{{format}}/{{theme_mode}}/{{scale}}';
    const url = template
      .replace('{{id}}', id)
      .replace('{{format}}', format)
      .replace('{{theme_mode}}', themeMode)
      .replace('{{scale}}', scale);

    out.push({ provider: 'twitch', scope, priority, id, code, url, animated: format === 'animated', channelId });
  }
  return out;
}

function collectEmoteArrays(payload) {
  const arrays = [];
  const push = value => { if (Array.isArray(value) && value.length) arrays.push(value); };
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

function flattenEmotes(payload, provider, scope, priority, channelId) {
  const emotes = [];
  for (const arr of collectEmoteArrays(payload)) {
    emotes.push(...normalizeEmoteArray(arr, provider, scope, priority, channelId));
  }
  return emotes;
}

// ── Fetching ─────────────────────────────────────

async function fetchJson(url, timeoutMs = 6000, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { cache: 'no-store', signal: controller.signal, headers: Object.keys(extraHeaders).length ? extraHeaders : undefined });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchCachedEmoteRecords(cacheKey, url, mapper, timeoutMs = 6000, extraHeaders = {}) {
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
      const data = await fetchJson(url, timeoutMs, extraHeaders);
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

// ── Twitch Auth Headers ──────────────────────────

function twitchHeaders() {
  const token = state.twitch?.token;
  if (!token) return {};
  return {
    'Authorization': `Bearer ${token}`,
    'Client-ID': TWITCH_CLIENT_ID
  };
}

// ── Provider Loaders ─────────────────────────────

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
    ...flattenEmotes(data?.sharedEmotes, 'bttv', 'channel', 30, twitchUserId),
    ...flattenEmotes(data?.channelEmotes, 'bttv', 'channel', 30, twitchUserId)
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
  return fetchCachedEmoteRecords(cacheKey, url, data => flattenEmotes(data, '7tv', 'channel', 40, twitchUserId));
}

async function loadFfzGlobal() {
  return fetchCachedEmoteRecords(
    'ffz-global',
    'https://api.frankerfacez.com/v1/set/global',
    data => {
      const records = [];
      for (const set of Object.values(data?.sets || {})) {
        records.push(...normalizeFfzEmoteArray(set?.emoticons, 'global', 15));
      }
      return records;
    }
  );
}

async function loadFfzChannel(twitchUserId) {
  const cacheKey = `ffz-channel:${twitchUserId}`;
  const url = `https://api.frankerfacez.com/v1/room/id/${encodeURIComponent(twitchUserId)}`;
  return fetchCachedEmoteRecords(cacheKey, url, data => {
    const records = [];
    for (const set of Object.values(data?.sets || {})) {
      records.push(...normalizeFfzEmoteArray(set?.emoticons, 'channel', 35, twitchUserId));
    }
    return records;
  });
}

async function loadTwitchGlobal() {
  const headers = twitchHeaders();
  if (!headers.Authorization) return [];
  return fetchCachedEmoteRecords(
    'twitch-global',
    'https://api.twitch.tv/helix/chat/emotes/global',
    data => normalizeTwitchEmoteArray(data?.data, 'global', 5),
    6000,
    headers
  );
}

async function loadTwitchChannel(twitchUserId) {
  const headers = twitchHeaders();
  if (!headers.Authorization) return [];
  const cacheKey = `twitch-channel:${twitchUserId}`;
  const url = `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${encodeURIComponent(twitchUserId)}`;
  return fetchCachedEmoteRecords(cacheKey, url, data => normalizeTwitchEmoteArray(data?.data, 'channel', 25, twitchUserId), 6000, headers);
}

// ── Refresh ──────────────────────────────────────

let emoteRefreshToken = 0;
let emoteRefreshTimer = null;

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

export function refreshEmotes() {
  const token = ++emoteRefreshToken;
  const channelIds = state.twitchUserIds.filter(Boolean);
  const sources = [
    ['Twitch global', loadTwitchGlobal],
    ['BTTV global', loadBttvGlobal],
    ['FFZ global', loadFfzGlobal],
    ['7TV global', load7tvGlobal]
  ];

  for (const channelId of channelIds) {
    sources.push([`Twitch channel (${channelId})`, () => loadTwitchChannel(channelId)]);
    sources.push([`BTTV channel (${channelId})`, () => loadBttvChannel(channelId)]);
    sources.push([`7TV channel (${channelId})`, () => load7tvChannel(channelId)]);
    sources.push([`FFZ channel (${channelId})`, () => loadFfzChannel(channelId)]);
  }

  state.emotes.loading = true;
  state.emotes.ready = false;
  state.emotes.error = '';
  state.emotes.sourceRecords = new Map();
  state.emotes.lookup = new Map();
  setEmoteStatus(channelIds.length
    ? `Завантаження емоцій для ${channelIds.length} каналів...`
    : 'Завантаження глобальних емоцій...');

  state.emotes.sourceStatus = new Map(sources.map(([label]) => [label, 'pending']));

  const syncStatus = () => {
    const loaded = [];
    const pending = [];
    const failed = [];

    for (const [label, status] of state.emotes.sourceStatus.entries()) {
      if (status === 'loaded') loaded.push(label);
      else if (status === 'failed') failed.push(label);
      else pending.push(label);
    }

    state.emotes.loading = pending.length > 0;
    state.emotes.ready = pending.length === 0;
    state.emotes.error = failed.join(', ');

    if (_emoteRefreshCb) _emoteRefreshCb();

    if (!loaded.length && pending.length) {
      setEmoteStatus(`Завантаження ${pending.join(', ')}...`);
    } else if (loaded.length && pending.length) {
      setEmoteStatus(`Завантажено ${loaded.join(', ')}; завантаження ${pending.join(', ')}...`, 'partial');
    } else if (loaded.length && failed.length) {
      setEmoteStatus(`Завантажено ${loaded.join(', ')}; помилка ${failed.join(', ')}`, 'partial');
    } else if (loaded.length) {
      setEmoteStatus(`Завантажено ${loaded.join(', ')}`, 'ready');
    } else if (failed.length) {
      setEmoteStatus('Помилка завантаження емоцій. Текст залишиться без змін.', 'error');
    }
  };

  const applySource = (label, records) => {
    if (token !== emoteRefreshToken) return;
    state.emotes.sourceStatus.set(label, 'loaded');
    state.emotes.sourceRecords.set(label, records);
    rebuildEmoteLookup();
    syncStatus();
  };

  const failSource = (label) => {
    if (token !== emoteRefreshToken) return;
    state.emotes.sourceStatus.set(label, 'failed');
    syncStatus();
  };

  for (const [label, loader] of sources) {
    Promise.resolve()
      .then(() => loader())
      .then(records => applySource(label, records))
      .catch(() => failSource(label));
  }
}

export function scheduleEmoteRefresh() {
  clearTimeout(emoteRefreshTimer);
  emoteRefreshTimer = setTimeout(() => {
    refreshEmotes();
  }, 300);
}

export function queueInitialEmoteRefresh() {
  setTimeout(() => refreshEmotes(), 0);
}

// ── Emote Images ─────────────────────────────────

function getEmoteAssetStatus(url) {
  return state.emotes.assetCache.get(url)?.status || 'idle';
}

function markEmoteAssetStatus(url, status) {
  const cached = state.emotes.assetCache.get(url);
  if (cached && cached.status === 'loaded' && status !== 'loaded') return;
  state.emotes.assetCache.set(url, { status });
}

export function getEmoteEntry(token) {
  return state.emotes.lookup.get(String(token || '').trim()) || null;
}

export function createEmoteImage(emote) {
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

export function appendRichText(target, text) {
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

export function splitCard(line) {
  const text = String(line || '').trim();
  if (!text) return { icon: '\u2726', label: '', iconIsEmote: false };

  const pipeIdx = text.indexOf('|');
  if (pipeIdx !== -1) {
    const rawIcon = text.slice(0, pipeIdx).trim();
    const label = text.slice(pipeIdx + 1).trim();
    const iconWords = rawIcon.split(/\s+/).filter(Boolean);
    const hasEmote = iconWords.some(w => getEmoteEntry(w) || looksLikeEmoji(w));
    return { icon: rawIcon, label, iconIsEmote: hasEmote };
  }

  const clean = text.replace(/\s+/g, ' ').trim();
  const parts = clean.split(' ');
  const first = parts[0];
  const rest = parts.slice(1).join(' ').trim();
  const firstIsEmote = Boolean(getEmoteEntry(first));
  if (looksLikeEmoji(first) || firstIsEmote) {
    return { icon: first, label: rest, iconIsEmote: firstIsEmote || looksLikeEmoji(first) };
  }
  return { icon: '\u2726', label: text, iconIsEmote: false };
}

export function getAllEmotes() {
  const emotes = [];
  for (const [code, entry] of state.emotes.lookup) {
    emotes.push(entry);
  }
  emotes.sort((a, b) => a.code.localeCompare(b.code));
  return emotes;
}

export function getEmotesBySource() {
  const groups = new Map();
  for (const [label, records] of state.emotes.sourceRecords) {
    groups.set(label, [...records].sort((a, b) => a.code.localeCompare(b.code)));
  }
  return groups;
}
