import { state } from './state.js';
import { TWITCH_CLIENT_ID, DEFAULT_CHAT_HIDDEN_BOTS } from './config.js';
import { emoteImageHtml } from './emotes.js';

const EVENTSUB_URL = 'wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30';
const KEEPALIVE_BUFFER_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 60000;

let globalBadgesCache = null;
let channelBadgesCache = null;
let badgesCacheTimestamp = 0;
const BADGES_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchGlobalBadges() {
  if (!state.twitch.token) return null;
  try {
    const res = await fetch('https://api.twitch.tv/helix/chat/badges/global', {
      headers: {
        'Authorization': `Bearer ${state.twitch.token}`,
        'Client-ID': TWITCH_CLIENT_ID,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const badges = {};
    for (const set of data.data || []) {
      for (const version of set.versions || []) {
        badges[`${set.set_id}/${version.id}`] = version.image_url_1x;
      }
    }
    return badges;
  } catch {
    return null;
  }
}

async function fetchChannelBadges(channelId) {
  if (!state.twitch.token || !channelId) return null;
  try {
    const res = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channelId}`, {
      headers: {
        'Authorization': `Bearer ${state.twitch.token}`,
        'Client-ID': TWITCH_CLIENT_ID,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const badges = {};
    for (const set of data.data || []) {
      for (const version of set.versions || []) {
        badges[`${set.set_id}/${version.id}`] = version.image_url_1x;
      }
    }
    return badges;
  } catch {
    return null;
  }
}

export async function refreshBadgesCache(channelId) {
  const now = Date.now();
  if (now - badgesCacheTimestamp < BADGES_CACHE_TTL && globalBadgesCache) return;
  
  const [global, channel] = await Promise.all([
    fetchGlobalBadges(),
    fetchChannelBadges(channelId),
  ]);
  
  globalBadgesCache = global || {};
  channelBadgesCache = channel || {};
  badgesCacheTimestamp = now;
}

function getBadgeUrl(setId, versionId) {
  const key = `${setId}/${versionId}`;
  return channelBadgesCache?.[key] || globalBadgesCache?.[key] || null;
}

export function resolveBadgeUrls(badges) {
  if (!badges || !Array.isArray(badges)) return [];
  return badges.map(b => {
    const url = getBadgeUrl(b.setId, b.id);
    return url ? { setId: b.setId, id: b.id, url } : null;
  }).filter(Boolean);
}

function pad2(n) { return String(n).padStart(2, '0'); }

export function formatChatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

export function formatChatTimeFull(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function emoteImgUrl(emoteId, format) {
  const fmts = format || ['static'];
  const f = fmts.includes('animated') ? 'animated' : 'static';
  return `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/${f}/dark/2.0`;
}

function renderTextWithEmotes(text) {
  const lookup = state.emotes?.lookup;
  if (!lookup || !lookup.size) return escapeHtml(text || '');

  return (text || '').split(/(\s+)/).map(token => {
    if (/^\s+$/.test(token)) return token;

    let entry = lookup.get(token);
    if (entry) return emoteImageHtml(entry);

    const stripped = token.replace(/[,.\!?;:]+$/, '');
    if (stripped !== token) {
      entry = lookup.get(stripped);
      if (entry) return emoteImageHtml(entry) + escapeHtml(token.slice(stripped.length));
    }

    return escapeHtml(token);
  }).join('');
}

function renderFragment(frag) {
  if (frag.type === 'emote' && frag.emote) {
    const url = emoteImgUrl(frag.emote.id, frag.emote.format);
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(frag.text)}" class="emote chat-emote" title="${escapeHtml(frag.text)}" loading="lazy">`;
  }
  if (frag.type === 'cheermote' && frag.cheermote) {
    return `<span class="chat-cheermote">${escapeHtml(frag.text)}</span>`;
  }
  if (frag.type === 'mention' && frag.mention) {
    return `<span class="chat-mention">@${escapeHtml(frag.mention.user_name || frag.text.replace(/^@/, ''))}</span>`;
  }
  return renderTextWithEmotes(frag.text);
}

function renderChatMessage(event) {
  const message = event.message || {};
  const fragments = message.fragments || [];
  if (!fragments.length) return escapeHtml(message.text || '');
  return fragments.map(renderFragment).join('');
}

export function renderMessageFromFragments(fragments, fallbackText) {
  if (!fragments || !fragments.length) return escapeHtml(fallbackText || '');
  return fragments.map(renderFragment).join('');
}

function normalizeColor(color) {
  if (!color || color === '#888' || color === '') return null;
  let hex = color.replace(/^#/, '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  let nr = r, ng = g, nb = b;
  if (luminance < 0.18) {
    const boost = 1.6;
    nr = Math.min(255, Math.round(r * boost));
    ng = Math.min(255, Math.round(g * boost));
    nb = Math.min(255, Math.round(b * boost));
  }
  if (luminance > 0.8) {
    const dim = 0.65;
    nr = Math.round(r * dim);
    ng = Math.round(g * dim);
    nb = Math.round(b * dim);
  }
  return `rgb(${nr}, ${ng}, ${nb})`;
}

export function isKnownBot(username, extraBots = []) {
  const name = String(username || '').toLowerCase().trim();
  if (!name) return false;
  if (DEFAULT_CHAT_HIDDEN_BOTS.includes(name)) return true;
  return extraBots.some(b => String(b || '').toLowerCase().trim() === name);
}

class ChatManager {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.onMessage = null;
    this.onMessageDelete = null;
    this.onStatusChange = null;
    this.onReconnectStatusChange = null;
    this._msgId = 0;
    this._sessionId = null;
    this._reconnectTimer = null;
    this._keepaliveTimer = null;
    this._keepaliveTimeout = 30;
    this._reconnectAttempts = 0;
    this._shouldReconnect = false;
    this._reconnectStopped = false;
    this._nextReconnectAt = null;
    this._reconnectStopReason = null;
    this.targetChannelLogin = null;
    this.targetChannelId = null;
  }

  setTargetChannel(login, id) {
    this.targetChannelLogin = login || null;
    this.targetChannelId = id || null;
  }

  getTargetChannel() {
    return this.targetChannelLogin || (state.twitch.user?.login ?? null);
  }

  connect() {
    this.disconnect();
    this._reconnectStopped = false;
    this._reconnectStopReason = null;
    const login = this.getTargetChannel();
    if (!login || !state.twitch.token || !state.twitch.user?.id) {
      this._status(false, '');
      return;
    }
    this._shouldReconnect = true;
    this._status(false, 'З\'єднання з чатом...');
    this._doConnect(EVENTSUB_URL);
  }

  _doConnect(url) {
    if (!this._shouldReconnect) return;

    this._closeSocket();

    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.warn('[chat] WebSocket creation failed:', e);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {};

    this.ws.onclose = (ev) => {
      this._stopKeepalive();
      console.warn('[chat] WebSocket closed', ev.code, ev.reason);
      if (this.connected) {
        this._status(false, 'Відключено');
      }
      if (this._shouldReconnect) this._scheduleReconnect();
    };

    this.ws.onerror = (ev) => {
      console.warn('[chat] WebSocket error', ev);
    };

    this.ws.onmessage = (ev) => {
      let data;
      try { data = JSON.parse(ev.data); } catch { return; }
      this._handleMessage(data);
    };
  }

  _handleMessage(data) {
    this._startKeepalive();

    const type = data?.metadata?.message_type;
    const payload = data?.payload || {};

    switch (type) {
      case 'session_welcome': {
        this._sessionId = payload.session?.id;
        this._reconnectAttempts = 0;
        const timeout = payload.session?.keepalive_timeout_seconds;
        if (typeof timeout === 'number' && timeout > 0) {
          this._keepaliveTimeout = timeout;
        }
        this._status(false, 'Отримання підписки на чат...');
        this._createSubscription();
        break;
      }

      case 'session_keepalive': {
        break;
      }

      case 'session_reconnect': {
        const newUrl = payload.session?.reconnect_url;
        if (newUrl) {
          console.info('[chat] Twitch requested reconnect to', newUrl);
          this._doConnect(newUrl);
        }
        break;
      }

      case 'notification': {
        const subType = data.metadata?.subscription_type;
        const ts = data.metadata?.message_timestamp;
        if (subType === 'channel.chat.message') {
          this._handleChatMessage(payload, ts);
        } else if (subType === 'channel.chat.message_delete') {
          this._handleMessageDelete(payload);
        }
        break;
      }

      case 'revocation': {
        console.warn('[chat] EventSub subscription revoked:', payload.subscription?.status);
        this._shouldReconnect = false;
        this.disconnect();
        this._status(false, 'Підписку відкликано');
        break;
      }
    }
  }

  _createSubscription() {
    const sessionAtCall = this._sessionId;
    if (!sessionAtCall || !state.twitch.token || !state.twitch.user?.id) return;

    const broadcasterId = this.targetChannelId || state.twitch.user.id;
    const types = [
      { type: 'channel.chat.message', version: '1' },
      { type: 'channel.chat.message_delete', version: '1' },
    ];

    let pending = types.length;
    let anyError = false;

    for (const { type, version } of types) {
      const body = {
        type,
        version,
        condition: {
          broadcaster_user_id: broadcasterId,
          user_id: state.twitch.user.id,
        },
        transport: { method: 'websocket', session_id: sessionAtCall },
      };

      fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.twitch.token}`,
          'Client-ID': TWITCH_CLIENT_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
        .then(async res => {
          if (this._sessionId !== sessionAtCall) return;

          if (res.status === 409) {
            pending--;
            if (pending === 0 && !anyError) {
              this._status(true, 'Підключено');
            }
            return;
          }

          if (res.status === 401) {
            anyError = true;
            this._shouldReconnect = false;
            this._reconnectStopped = true;
            this._reconnectStopReason = 'token_expired';
            this._status(false, 'Токен протерміновано');
            this._notifyReconnectStatus();
            return;
          }

          if (!res.ok) {
            anyError = true;
            const err = await res.json().catch(() => ({}));
            this._status(false, err?.message || `Помилка підписки (${res.status})`);
            return;
          }

          pending--;
          if (pending === 0 && !anyError) {
            this._status(true, 'Онлайн');
          }
        })
        .catch(err => {
          if (this._sessionId !== sessionAtCall) return;
          console.warn('[chat] Subscription fetch failed:', err);
          this._status(false, 'Помилка з\'єднання');
        });
    }
  }

  _handleChatMessage(payload, timestamp) {
    const event = payload?.event;
    if (!event) return;
    const message = event.message || {};
    const fragments = message.fragments || [];
    const badges = (event.badges || []).map(b => {
      const url = getBadgeUrl(b.set_id, b.id);
      return url ? { setId: b.set_id, id: b.id, url } : null;
    }).filter(Boolean);
    this.onMessage?.({
      id: ++this._msgId,
      messageId: event.message_id,
      displayName: event.chatter_user_name || event.chatter_user_login || 'unknown',
      username: event.chatter_user_login || 'unknown',
      color: normalizeColor(event.color),
      rawColor: event.color || null,
      text: message.text || '',
      fragments: fragments,
      badges: badges,
      renderedText: renderChatMessage(event),
      timeStr: formatChatTime(timestamp),
      timeFull: formatChatTimeFull(timestamp),
      timestamp: timestamp || '',
    });
  }

  _handleMessageDelete(payload) {
    const mid = payload?.event?.message_id;
    if (mid) this.onMessageDelete?.(mid);
  }

  _startKeepalive() {
    this._stopKeepalive();
    const deadline = this._keepaliveTimeout * 1000 + KEEPALIVE_BUFFER_MS;
    this._keepaliveTimer = setTimeout(() => {
      if (this._shouldReconnect) {
        console.warn('[chat] Keepalive timeout — reconnecting');
        this._closeSocket();
        this._scheduleReconnect();
      }
    }, deadline);
  }

  _stopKeepalive() {
    clearTimeout(this._keepaliveTimer);
    this._keepaliveTimer = null;
  }

  _scheduleReconnect() {
    if (!this._shouldReconnect) return;
    this._reconnectAttempts++;
    clearTimeout(this._reconnectTimer);

    if (this._reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      this._shouldReconnect = false;
      this._reconnectStopped = true;
      this._reconnectStopReason = 'max_attempts';
      this._nextReconnectAt = null;
      this._status(false, 'Не вдалося підключитися');
      this._notifyReconnectStatus();
      return;
    }

    const expDelay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this._reconnectAttempts - 1);
    const capped = Math.min(expDelay, MAX_RECONNECT_DELAY_MS);
    const jitter = Math.random() * capped * 0.3;
    const delay = Math.round(capped + jitter);
    this._nextReconnectAt = Date.now() + delay;
    this._status(false, `Перепідключення через ${Math.ceil(delay / 1000)}с...`);
    this._notifyReconnectStatus();

    this._reconnectTimer = setTimeout(() => {
      this._nextReconnectAt = null;
      this._notifyReconnectStatus();
      this._doConnect(EVENTSUB_URL);
    }, delay);
  }

  _notifyReconnectStatus() {
    this.onReconnectStatusChange?.({
      attempts: this._reconnectAttempts,
      nextReconnectAt: this._nextReconnectAt,
      stopped: this._reconnectStopped,
      reason: this._reconnectStopReason,
    });
  }

  _closeSocket() {
    this._stopKeepalive();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }

  _status(connected, msg) {
    this.connected = connected;
    this.onStatusChange?.(connected, msg);
  }

  disconnect() {
    this._shouldReconnect = false;
    this._sessionId = null;
    this._reconnectAttempts = 0;
    this._reconnectStopped = false;
    this._reconnectStopReason = null;
    this._nextReconnectAt = null;
    clearTimeout(this._reconnectTimer);
    this._closeSocket();
    if (this.connected) {
      this._status(false, 'Відключено');
    } else {
      this.connected = false;
    }
    this._notifyReconnectStatus();
  }

  reconnect() {
    this._reconnectStopped = false;
    this._reconnectStopReason = null;
    this.disconnect();
    this.connect();
  }
}

export const chatManager = new ChatManager();
