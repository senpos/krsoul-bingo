import { STORAGE_KEYS, DEFAULT_TWITCH_USER_IDS, DEFAULT_CARDS, TWITCH_CLIENT_ID, generateBoardId, fromBase64, compress, decompress, DEFAULT_CHAT_HIDDEN_BOTS } from './config.js';
import { state, loadBoards, saveBoards, saveActiveBoardId, saveState } from './state.js';
import { getEmoteEntry, splitCard, getAllEmotes, getEmotesBySource, scheduleEmoteRefresh, queueInitialEmoteRefresh, onEmoteRefresh, onEmoteStatus } from './emotes.js';
import { loginWithTwitch, logout as authLogout, initAuth } from './auth.js';
import { completedLineKeys, drawBingoLines, launchConfetti, applyParticleTheme, bingoCellBurst, setBingoMode } from './game.js';
import { audioManager } from './audio.js';
import { chatManager, isKnownBot, renderMessageFromFragments, formatChatTime, refreshBadgesCache, resolveBadgeUrls } from './chat.js';

export function createApp() {
  return {
    boards: [],
    activeBoardId: '',
    pendingDeleteBoardId: null,

    get activeBoard() {
      return this.boards.find(b => b.id === this.activeBoardId) || this.boards[0];
    },

    // ── Board state (proxied through active board) ──
    get size() { return this.activeBoard?.size ?? 5; },
    set size(val) {
      const b = this.activeBoard;
      if (b) b.size = val;
    },

    get theme() { return this.activeBoard?.theme ?? 'twice'; },
    set theme(val) {
      const b = this.activeBoard;
      if (b) b.theme = val;
    },

    get cards() { return this.activeBoard?.cards ?? []; },
    set cards(val) {
      const b = this.activeBoard;
      if (b) b.cards = val;
    },

    get marks() { return this.activeBoard?.marks ?? []; },
    set marks(val) {
      const b = this.activeBoard;
      if (b) b.marks = val;
    },

    // ── Channel management ──
    channelInput: '',

    get twitchUserIds() { return state.twitchUserIds; },
    set twitchUserIds(val) {
      state.twitchUserIds = val;
      try { localStorage.setItem(STORAGE_KEYS.twitchUserIds, JSON.stringify(val)); } catch {}
    },

    get defaultTwitchUserIds() { return DEFAULT_TWITCH_USER_IDS; },

    isDefaultChannel(id) { return DEFAULT_TWITCH_USER_IDS.includes(id); },

    removeChannel(id) {
      if (DEFAULT_TWITCH_USER_IDS.includes(id)) return;
      if (!state.twitchUserIds.includes(id)) return;
      this.twitchUserIds = state.twitchUserIds.filter(i => i !== id);
      scheduleEmoteRefresh();
    },

    async _lookupAndStoreName(id) {
      if (!this.twitchToken || state.twitchChannelNames[id]) return;
      try {
        const res = await fetch(`https://api.twitch.tv/helix/users?id=${encodeURIComponent(id)}`, {
          headers: { 'Authorization': `Bearer ${this.twitchToken}`, 'Client-ID': TWITCH_CLIENT_ID }
        });
        if (!res.ok) return;
        const body = await res.json();
        const user = body?.data?.[0];
        if (user?.login) {
          state.twitchChannelNames[id] = user.login;
          try { localStorage.setItem(STORAGE_KEYS.twitchChannelNames, JSON.stringify(state.twitchChannelNames)); } catch {}
        }
      } catch {}
    },

    addChannel(raw) {
      const val = String(raw || '').trim();
      if (!val) return;
      if (/^\d+$/.test(val)) {
        if (state.twitchUserIds.includes(val)) {
          this.emoteStatusMsg = `Канал ${val} вже додано`;
          this.emoteStatusKind = 'error';
          return;
        }
        this.twitchUserIds = [...state.twitchUserIds, val];
        this._lookupAndStoreName(val);
        scheduleEmoteRefresh();
        return;
      }
      if (!this.twitchToken) {
        this.emoteStatusMsg = 'Увійдіть в Twitch, щоб шукати за іменем';
        this.emoteStatusKind = 'error';
        return;
      }
      clearTimeout(this._resolveTimer);
      this._resolveTimer = setTimeout(async () => {
        try {
          this.emoteStatusMsg = `Пошук "${val}"...`;
          this.emoteStatusKind = '';
          const res = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(val)}`, {
            headers: { 'Authorization': `Bearer ${this.twitchToken}`, 'Client-ID': TWITCH_CLIENT_ID }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = await res.json();
          const users = body?.data;
          if (!users?.length) { this.emoteStatusMsg = `Користувач Twitch "${val}" не знайдений`; this.emoteStatusKind = 'error'; return; }
          const id = users[0].id;
          const login = users[0].login;
          if (state.twitchUserIds.includes(id)) {
            this.emoteStatusMsg = `Канал ${id} (${val}) вже додано`;
            this.emoteStatusKind = 'error';
            return;
          }
          state.twitchChannelNames[id] = login;
          try { localStorage.setItem(STORAGE_KEYS.twitchChannelNames, JSON.stringify(state.twitchChannelNames)); } catch {}
          this.twitchUserIds = [...state.twitchUserIds, id];
          if (!this.twitchUser) this.twitchUser = users[0];
          scheduleEmoteRefresh();
        } catch (err) {
          this.emoteStatusMsg = `Помилка пошуку: ${err.message}`;
          this.emoteStatusKind = 'error';
        }
      }, 600);
    },

    markEmoteError(url) {
      if (!url) return;
      state.emotes.assetCache.set(url, { status: 'error' });
      this.emoteVersion++;
    },

    channelNameForId(id) {
      return state.twitchChannelNames[id] || id;
    },

    async resolveChannelNames() {
      const ids = state.twitchUserIds.filter(id => !state.twitchChannelNames[id]);
      if (!ids.length || !this.twitchToken) return;
      const chunks = [];
      for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
      for (const chunk of chunks) {
        try {
          const q = chunk.map(id => `id=${encodeURIComponent(id)}`).join('&');
          const res = await fetch(`https://api.twitch.tv/helix/users?${q}`, {
            headers: { 'Authorization': `Bearer ${this.twitchToken}`, 'Client-ID': TWITCH_CLIENT_ID }
          });
          if (!res.ok) continue;
          const body = await res.json();
          for (const user of body?.data || []) {
            state.twitchChannelNames[user.id] = user.login;
          }
        } catch {}
      }
      try { localStorage.setItem(STORAGE_KEYS.twitchChannelNames, JSON.stringify(state.twitchChannelNames)); } catch {}
    },

    // ── Auth ──
    twitchToken: null,
    twitchUser: null,
    get isLoggedIn() { return !!this.twitchToken; },

    // ── UI State ──
    allowCelebrate: true,
    lastCompletedKeys: new Set(),
    toastVisible: false,
    chatPanelOpen: false,
    editorOpen: false,
    audioMounted: false,

    // ── Context Menu ──
    ctxMenu: { show: false, x: 0, y: 0, cellIndex: -1 },

    // ── Emote Picker ──
    pickerOpen: false,
    pickerSearch: '',
    pickerCategory: 'all',
    pickerVisibleCount: 40,
    pickerChunkSize: 40,
    pickerCallback: null,

    // ── Emote Status ──
    emoteVersion: 0,
    emoteStatusMsg: 'Завантаження емоцій...',
    emoteStatusKind: '',
    shareCopied: false,
    _cardsMigrated: false,

    // ── Chat ──
    chatMessages: [],
    chatConnected: false,
    chatStatusMsg: '',
    chatChannelName: '',
    chatFontSize: Number(localStorage.getItem(STORAGE_KEYS.chatFontSize)) || 12,
    chatShowBots: localStorage.getItem(STORAGE_KEYS.chatShowBots) === 'true',
    chatShowBadges: localStorage.getItem(STORAGE_KEYS.chatShowBadges) !== 'false',
    chatHiddenBotsExtra: JSON.parse(localStorage.getItem(STORAGE_KEYS.chatHiddenBots) || '[]'),
    chatHiddenBotInput: '',
    chatTargetChannel: '',
    chatTargetChannelInput: '',
    chatTargetChannelId: null,
    chatTargetChannelError: '',
    chatReconnectStatus: { attempts: 0, nextReconnectAt: null, stopped: false, reason: null },
    chatReconnectCountdown: '',
    _chatMessageIds: new Set(),

    get chatHiddenBots() {
      return DEFAULT_CHAT_HIDDEN_BOTS.concat(this.chatHiddenBotsExtra.map(b => String(b || '').toLowerCase().trim()).filter(Boolean));
    },

    get visibleChatMessages() {
      if (this.chatShowBots) return this.chatMessages;
      return this.chatMessages.filter(m => !isKnownBot(m.username, this.chatHiddenBotsExtra));
    },

    // ── Audio / Music ──
    audioVolume: 40,
    audioMusicMuted: false,
    audioPlaying: false,
    audioFxVolume: 0.75,
    audioSfxEnabled: true,
    audioCurrentTrack: null,
    audioReady: false,
    audioProgress: null,
    audioCurrentTime: null,
    audioDuration: null,
    audioHasNext: false,
    audioHasPrev: false,
    audioSongs: [],
    audioSongIndex: 0,
    audioPlaylistOpen: localStorage.getItem(STORAGE_KEYS.audioPlaylistOpen) !== 'false',
    audioLoopMode: 'playlist',

    // ── Undo/Redo (session only — not persisted) ──
    history: [],
    redoHistory: [],
    get canUndo() { return this.history.length > 0; },
    get canRedo() { return this.redoHistory.length > 0; },

    // ── Theme buttons ──
    get themes() {
      return [
        { id: 'twice', icon: 'TW', name: 'Twice' },
        { id: 'aespa', icon: '\u00E6', name: 'aespa' },
        { id: 'nmixx', icon: 'NM', name: 'NMIXX' },
        { id: 'newjeans', icon: 'NJ', name: 'NewJeans' },
        { id: 'lesserafim', icon: 'LS', name: 'Le Sserafim' },
      ];
    },

    // ── Computed ──
    get cellCount() { return this.size * this.size; },

    get cardsText() {
      return this.cards.map(c => (c || '').replace(/\n/g, ' ')).join('\n');
    },
    set cardsText(val) {
      this.cards = (val || '').replace(/\r/g, '').split('\n');
      this.persist();
      this.emoteVersion++;
    },

    get markedCount() {
      return this.marks.slice(0, this.cellCount).filter(Boolean).length;
    },

    get bingoKeys() {
      return completedLineKeys(this.size, this.marks);
    },

    get bingoCount() {
      return this.bingoKeys.size;
    },

    get scoreText() {
      const n = this.bingoCount;
      return `${this.markedCount} відмічено \u00B7 ${n} бінго`;
    },

    // ── Collapsible emote log ──
    emoteLogOpen: false,

    get emoteSourceStatusList() {
      this.emoteVersion;
      const list = [];
      for (const [label, status] of state.emotes.sourceStatus.entries()) {
        const channelMatch = label.match(/\((\d+)\)/);
        const channelId = channelMatch ? channelMatch[1] : null;
        const displayLabel = channelId
          ? label.replace(channelId, this.channelNameForId(channelId))
          : label;
        const icons = { pending: '\u23F3', loaded: '\u2705', failed: '\u274C' };
        list.push({
          label: displayLabel,
          status,
          icon: icons[status] || '\u23F3',
          statusText: status === 'loaded'
            ? `${state.emotes.sourceRecords.get(label)?.length || 0} емоцій`
            : status === 'failed' ? 'помилка' : 'завантаження...'
        });
      }
      return list;
    },

    get emoteSourcesSummary() {
      this.emoteVersion;
      let loaded = 0, failed = 0, pending = 0;
      for (const st of state.emotes.sourceStatus.values()) {
        if (st === 'loaded') loaded++;
        else if (st === 'failed') failed++;
        else pending++;
      }
      const parts = [];
      if (loaded) parts.push(`${loaded} \u2705`);
      if (failed) parts.push(`${failed} \u274C`);
      if (pending) parts.push(`${pending} \u23F3`);
      return parts.join(' \u00B7 ') || 'немає джерел';
    },

    // ── Emotes for picker ──
    get allEmotes() {
      this.emoteVersion;
      return getAllEmotes();
    },

    get pickerSources() {
      this.emoteVersion;
      const sources = [];
      const groups = getEmotesBySource();

      sources.push({
        id: 'all', label: '\u2605 Всі джерела',
        count: this.allEmotes.length, iconText: '\u2605', color: '#666', scope: ''
      });

      const providerMeta = {
        'Twitch': { iconText: 'T', color: '#9146ff' },
        'BTTV': { iconText: 'B', color: '#3bf' },
        '7TV': { iconText: '7', color: '#ff6b35' },
        'FFZ': { iconText: 'F', color: '#ffd700' },
      };

      for (const [label, records] of groups) {
        const providerName = label.split(' ')[0];
        const meta = providerMeta[providerName] || { iconText: '?', color: '#888' };
        const channelMatch = label.match(/\((\d+)\)/);
        let shortLabel;
        if (channelMatch) {
          const cid = channelMatch[1];
          const name = this.channelNameForId(cid);
          shortLabel = `${providerName} (${name})`;
        } else if (label.endsWith(' global')) {
          shortLabel = `${providerName} (Global)`;
        } else {
          shortLabel = label;
        }
        sources.push({
          id: label,
          label: shortLabel,
          count: records.length,
          iconText: meta.iconText,
          color: meta.color,
          scope: channelMatch ? 'channel' : 'global'
        });
      }
      return sources;
    },

    get pickerCategoryLabel() {
      if (this.pickerCategory === 'all') return 'Всі джерела';
      const src = this.pickerSources.find(s => s.id === this.pickerCategory);
      return src?.label || this.pickerCategory;
    },

    get filteredCategoryEmotes() {
      this.emoteVersion;
      const q = this.pickerSearch.toLowerCase().trim();

      if (this.pickerCategory === 'all') {
        const emotes = this.allEmotes;
        if (!q) return emotes;
        return emotes.filter(e => e.code.toLowerCase().includes(q));
      }

      const groups = getEmotesBySource();
      const records = groups.get(this.pickerCategory) || [];
      if (!q) return records;
      return records.filter(e => e.code.toLowerCase().includes(q));
    },

    get visibleEmotes() {
      return this.filteredCategoryEmotes.slice(0, this.pickerVisibleCount);
    },

    get hasMoreEmotes() {
      return this.pickerVisibleCount < this.filteredCategoryEmotes.length;
    },

    // ── Cells for grid ──
    get cells() {
      this.emoteVersion;
      const total = this.cellCount;
      const displayed = this.cards.slice(0, total)
        .concat(Array(total).fill(''))
        .slice(0, total);

      const activeSet = new Set();
      const newSet = new Set();

      if (this.allowCelebrate && this.lastCompletedKeys) {
        const currentKeys = this.bingoKeys;
        currentKeys.forEach(k => k.split(',').forEach(n => activeSet.add(Number(n))));
        [...currentKeys].filter(k => !this.lastCompletedKeys.has(k))
          .forEach(k => k.split(',').forEach(n => newSet.add(Number(n))));
      }

      return displayed.map((entry, i) => {
        const { icon, label, iconIsEmote } = splitCard(entry);
        const iconWords = (icon || '').split(/\s+/).filter(Boolean);
        const iconParts = [];
        if (iconWords.length) {
          for (const word of iconWords) {
            const emote = getEmoteEntry(word);
            iconParts.push({ text: word, isEmote: !!emote, url: emote?.url || '' });
          }
        } else {
          iconParts.push({ text: '\u2726', isEmote: false, url: '' });
        }
        const firstEmote = iconParts.find(p => p.isEmote);
        const firstUrl = firstEmote?.url || '';
        const isErrored = firstUrl ? state.emotes.assetCache.get(firstUrl)?.status === 'error' : false;
        return {
          icon, label, iconIsEmote, iconParts,
          emoteUrl: isErrored ? '' : firstUrl,
          marked: this.marks[i],
          bingoActive: activeSet.has(i),
          bingoNew: newSet.has(i),
          index: i,
        };
      });
    },

    // ═══════════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════════
    init() {
      const { boards, activeBoardId } = loadBoards();
      this.boards = boards;
      this.activeBoardId = activeBoardId;
      for (const b of this.boards) if (b.size < 3) b.size = 3;

      const board = this.activeBoard;
      if (board) {
        const total = board.size * board.size;
        while (board.cards.length < total) board.cards.push('');
        board.cards = board.cards.slice(0, total);
        while (board.marks.length < total) board.marks.push(false);
        board.marks = board.marks.slice(0, total);
      }

      this.allowCelebrate = false;
      this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
      this.history = [];
      this.redoHistory = [];
      this.allowCelebrate = true;

      document.body.setAttribute('data-theme', this.theme);
      applyParticleTheme(this.theme);

      onEmoteRefresh(() => { this.migrateCards(); this.emoteVersion++; });
      onEmoteStatus((msg, kind) => {
        this.emoteStatusMsg = msg;
        this.emoteStatusKind = kind;
      });

      const drawLines = () => requestAnimationFrame(() => drawBingoLines([...this.bingoKeys]));

      this.$watch('marks', () => this.$nextTick(drawLines));
      this.$watch('cards', () => this.$nextTick(drawLines));
      this.$watch('size', () => this.$nextTick(drawLines));
      this.$watch('pickerOpen', val => { document.body.style.overflow = val ? 'hidden' : ''; });
      window.addEventListener('resize', () => requestAnimationFrame(() => drawBingoLines([...this.bingoKeys])));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.cancelDelete(); });
      document.addEventListener('click', (e) => { if (this.pendingDeleteBoardId && !e.target.closest('.board-tabs')) this.cancelDelete(); });

      this.$watch('chatFontSize', val => {
        try { localStorage.setItem(STORAGE_KEYS.chatFontSize, String(val)); } catch {}
      });
      this.$watch('audioPlaylistOpen', val => {
        try { localStorage.setItem(STORAGE_KEYS.audioPlaylistOpen, val ? 'true' : 'false'); } catch {}
      });
      this.resolveChannelNames();
      queueInitialEmoteRefresh();

      chatManager.onMessage = (msg) => {
        if (msg.messageId && this._chatMessageIds.has(msg.messageId)) return;
        this.chatMessages.push(msg);
        if (msg.messageId) this._chatMessageIds.add(msg.messageId);
        if (this.chatMessages.length > 200) {
          const removed = this.chatMessages.shift();
          if (removed.messageId) this._chatMessageIds.delete(removed.messageId);
        }
        this._persistChatHistory();
        this.$nextTick(() => {
          const el = this.$refs?.chatMessages;
          if (el) el.scrollTop = el.scrollHeight;
        });
      };
      chatManager.onMessageDelete = (messageId) => {
        const idx = this.chatMessages.findIndex(m => m.messageId === messageId);
        if (idx !== -1) {
          const removed = this.chatMessages.splice(idx, 1)[0];
          if (removed.messageId) this._chatMessageIds.delete(removed.messageId);
          this._persistChatHistory();
        }
      };
      chatManager.onStatusChange = (connected, msg) => {
        this.chatConnected = connected;
        this.chatStatusMsg = msg || '';
        if (connected) this.chatChannelName = chatManager.getTargetChannel();
      };
      chatManager.onReconnectStatusChange = (status) => {
        this.chatReconnectStatus = status;
        this._updateReconnectCountdown();
      };

      this._reconnectCountdownInterval = setInterval(() => {
        this._updateReconnectCountdown();
      }, 1000);

      initAuth(this).then(async () => {
        if (this.isLoggedIn) {
          try {
            const saved = JSON.parse(localStorage.getItem('krsoul-bingo-chat-target-channel-v1'));
            if (saved?.login && saved?.id) {
              this.chatTargetChannel = saved.login;
              this.chatTargetChannelId = saved.id;
              chatManager.setTargetChannel(saved.login, saved.id);
            }
          } catch {}
        }
        this.chatTargetChannelInput = this.chatTargetChannel || state.twitch.user?.login || '';
        this.chatChannelName = chatManager.getTargetChannel();
        if (this.isLoggedIn) {
          const badgeChannelId = chatManager.targetChannelId || state.twitch.user?.id;
          await refreshBadgesCache(badgeChannelId);
          this.loadChatHistory();
          try { chatManager.connect(); } catch (e) { console.warn(e); }
        }
      });

      audioManager.init(this.theme, (state) => {
        this.audioVolume = state.volume;
        this.audioMusicMuted = state.musicMuted;
        this.audioPlaying = state.playing;
        this.audioFxVolume = state.fxVolume;
        this.audioSfxEnabled = state.sfxEnabled;
        this.audioCurrentTrack = state.currentTrack;
        this.audioReady = state.ready;
        this.audioHasNext = state.hasNext;
        this.audioHasPrev = state.hasPrev;
        this.audioSongs = state.songs;
        this.audioSongIndex = state.currentSongIndex;
        this.audioLoopMode = state.loopMode;
        this.audioMounted = state.mounted;
      });

      const pollProgress = () => {
        this.audioProgress = audioManager.progress;
        this.audioCurrentTime = audioManager.currentTime;
        this.audioDuration = audioManager.duration;
        this.audioPlaying = audioManager.playing;
        this.audioHasNext = audioManager.hasNext;
        this.audioHasPrev = audioManager.hasPrev;
        this.audioSongs = audioManager.songs;
        this.audioSongIndex = audioManager.currentSongIndex;
        this.audioLoopMode = audioManager.loopMode;
        this.audioMounted = audioManager.mounted;
        this._raf = requestAnimationFrame(pollProgress);
      };
      this._raf = requestAnimationFrame(pollProgress);

      this.checkImportUrl();
    },

    persist() {
      saveBoards(this.boards);
      saveActiveBoardId(this.activeBoardId);
    },

    cancelDelete() {
      this.pendingDeleteBoardId = null;
    },

    // ── Board Management ──

    ensureActiveTabVisible() {
      this.$nextTick(() => {
        const el = this.$refs?.boardScroll;
        if (!el) return;
        const activeTab = el.querySelector('.board-tab.active');
        if (activeTab) activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    },

    editBoardName(id) {
      const board = this.boards.find(b => b.id === id);
      if (!board) return;
      const result = prompt('Перейменувати дошку:', board.name);
      if (result && result.trim()) {
        board.name = result.trim().slice(0, 50);
        this.persist();
      }
    },

    addBoard() {
      this.cancelDelete();
      const existingNumbers = new Set(
        this.boards
          .map(b => {
            const match = b.name.match(/^Дошка (\d+)$/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter(n => n !== null)
      );
      let num = 1;
      while (existingNumbers.has(num)) num++;
      const name = `Дошка ${num}`;
      const newBoard = {
        id: generateBoardId(),
        name,
        size: 5,
        cards: [...DEFAULT_CARDS],
        marks: Array(25).fill(false),
        theme: this.theme || 'twice'
      };
      this.boards.push(newBoard);
      this.activeBoardId = newBoard.id;
      this.lastCompletedKeys = new Set();
      this.history = [];
      this.redoHistory = [];
      this.persist();
      this.$nextTick(() => {
        document.body.setAttribute('data-theme', this.theme);
        this.ensureActiveTabVisible();
      });
    },

    switchBoard(id) {
      if (id === this.activeBoardId) return;
      this.cancelDelete();
      this.activeBoardId = id;
      this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
      this.history = [];
      this.redoHistory = [];
      this.persist();
      this.$nextTick(() => this.ensureActiveTabVisible());
      document.body.setAttribute('data-theme', this.theme);
      applyParticleTheme(this.theme);
      audioManager.playTheme(this.theme);
    },

    deleteBoard(id) {
      if (this.boards.length <= 1) return;
      if (this.pendingDeleteBoardId !== id) {
        this.pendingDeleteBoardId = id;
        return;
      }
      this.pendingDeleteBoardId = null;
      const idx = this.boards.findIndex(b => b.id === id);
      if (idx === -1) return;
      const wasActive = this.activeBoardId === id;
      this.boards.splice(idx, 1);
      if (wasActive) {
        this.activeBoardId = this.boards[0].id;
        this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
        this.history = [];
        this.redoHistory = [];
        document.body.setAttribute('data-theme', this.theme);
        applyParticleTheme(this.theme);
        audioManager.playTheme(this.theme);
      }
      this.persist();
      this.$nextTick(() => this.ensureActiveTabVisible());
    },

    setSize(newSize) {
      if (newSize < 3 || newSize > 10) return;
      const board = this.activeBoard;
      if (!board) return;
      board.size = newSize;
      const total = newSize * newSize;
      while (board.cards.length < total) board.cards.push('');
      board.cards = board.cards.slice(0, total);
      while (board.marks.length < total) board.marks.push(false);
      board.marks = board.marks.slice(0, total);
      this.lastCompletedKeys = new Set(completedLineKeys(newSize, board.marks));
      this.history = [];
      this.redoHistory = [];
      this.persist();
    },

    // ── Export / Import ──
    async exportBoardUrl() {
      const board = this.activeBoard;
      if (!board) return '';
      const payload = {
        id: board.id, name: board.name, size: board.size,
        cards: board.cards, marks: board.marks, theme: board.theme,
        twitchUserIds: state.twitchUserIds
      };
      const encoded = await compress(JSON.stringify(payload));
      const url = new URL(window.location.href.split('?')[0].split('#')[0]);
      url.searchParams.set('b', encoded);
      return url.toString();
    },

    async copyShareUrl() {
      const url = await this.exportBoardUrl();
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.shareCopied = true;
      setTimeout(() => { this.shareCopied = false; }, 2000);
    },

    async importBoardFromText() {
      const text = prompt('Вставте дані дошки (base64 або JSON):');
      if (!text || text.length > 50000) return;
      let payload;
      try { payload = JSON.parse(await decompress(text)); } catch {
        try { payload = JSON.parse(fromBase64(text)); } catch {
          try { payload = JSON.parse(text); } catch { return; }
        }
      }
      if (this._validateImportPayload(payload)) {
        this._importBoardPayload(payload);
      }
    },

    async checkImportUrl() {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('b');
      if (!encoded || encoded.length > 50000) return;

      try {
        const dec = await decompress(encoded);
        if (dec.length > 100000) return;
        const payload = JSON.parse(dec);
        if (this._validateImportPayload(payload)) {
          this._importBoardPayload(payload);
          if (Array.isArray(payload.twitchUserIds)) {
            const merged = new Set([...state.twitchUserIds, ...payload.twitchUserIds]);
            this.twitchUserIds = [...merged];
            saveState();
            scheduleEmoteRefresh();
          }
        }
      } catch {}

      const url = new URL(window.location.href);
      url.searchParams.delete('b');
      window.history.replaceState({}, '', url.toString());
    },

    _validateImportPayload(p) {
      if (!p || typeof p.id !== 'string' || p.id.length > 40) return false;
      if (!Array.isArray(p.cards) || p.cards.length > 200) return false;
      const sz = Number(p.size);
      if (!Number.isFinite(sz) || sz < 3 || sz > 10) return false;
      return true;
    },

    _importBoardPayload(payload) {
      const name = String(payload.name || 'Імпортовано').slice(0, 50);
      const size = Number(payload.size) || 5;
      const theme = (payload.theme && /^[a-z]+$/.test(payload.theme)) ? payload.theme : 'twice';
      const total = size * size;
      const cards = payload.cards.slice(0, total).map(c => String(c || ''));
      while (cards.length < total) cards.push('');
      const marks = Array.isArray(payload.marks)
        ? payload.marks.slice(0, total).map(Boolean)
        : Array(total).fill(false);
      while (marks.length < total) marks.push(false);

      const existing = this.boards.find(b => b.id === payload.id);
      if (existing) {
        this.activeBoardId = existing.id;
      } else {
        this.boards.push({ id: payload.id, name, size, cards, marks, theme });
        this.activeBoardId = payload.id;
      }
      this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
      this.history = [];
      this.redoHistory = [];
      this.persist();
      document.body.setAttribute('data-theme', this.theme);
      applyParticleTheme(this.theme);
      audioManager.playTheme(this.theme);
    },

    // ── Actions ──
    toggleMark(i) {
      this.marks[i] = !this.marks[i];
      this.persist();
      this.checkBingo();
    },

    checkBingo() {
      const currentKeys = this.bingoKeys;
      const newKeys = [...currentKeys].filter(k => !this.lastCompletedKeys.has(k));
      this.lastCompletedKeys = currentKeys;

      // Collect all cell indices in new bingo lines
      const newIndices = new Set();
      newKeys.forEach(k => k.split(',').forEach(n => newIndices.add(Number(n))));

      if (newKeys.length > 0) {
        this.toastVisible = true;
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { this.toastVisible = false; }, 1200);
        launchConfetti();
        bingoCellBurst([...newIndices]);
        audioManager.playBingo();
      }

      // Toggle background particle intensity
      setBingoMode(currentKeys.size > 0);
    },

    hideToast() {
      this.toastVisible = false;
    },

    saveToHistory() {
      this.history.push({ cards: [...this.cards], marks: [...this.marks] });
      if (this.history.length > 50) this.history.shift();
      this.redoHistory = [];
    },

    reset() {
      this.saveToHistory();
      this.marks = Array(this.cellCount).fill(false);
      this.lastCompletedKeys = new Set();
      this.persist();
      setBingoMode(false);
    },

    shuffle() {
      this.saveToHistory();
      const len = this.cellCount;
      const pairs = [];
      for (let i = 0; i < len; i++) pairs.push({ card: this.cards[i] || '', mark: this.marks[i] });
      for (let i = len - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
      }
      this.cards = pairs.map(p => p.card);
      this.marks = pairs.map(p => p.mark);
      this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
      this.persist();
    },

    undo() {
      if (!this.canUndo) return;
      this.redoHistory.push({ cards: [...this.cards], marks: [...this.marks] });
      const prev = this.history.pop();
      this.cards = prev.cards;
      this.marks = prev.marks;
      this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
      this.persist();
      setBingoMode(this.lastCompletedKeys.size > 0);
    },

    redo() {
      if (!this.canRedo) return;
      this.history.push({ cards: [...this.cards], marks: [...this.marks] });
      const next = this.redoHistory.pop();
      this.cards = next.cards;
      this.marks = next.marks;
      this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
      this.persist();
      setBingoMode(this.lastCompletedKeys.size > 0);
    },

    setTheme(name) {
      this.theme = name;
      document.body.setAttribute('data-theme', name);
      this.persist();
      applyParticleTheme(name);
      audioManager.playTheme(name);
    },

    // ── Audio Controls ──
    mountPlayer() {
      this.audioMounted = true;
      this.$nextTick(() => {
        const el = document.getElementById('ytPlayerContainer');
        if (!el) return;
        audioManager.mountPlayer(el);
      });
    },

    setVolume(v) {
      this.audioVolume = v;
      audioManager.setVolume(v);
    },

    toggleMusicMute() {
      audioManager.toggleMusicMute();
    },

    togglePlay() {
      if (!this.audioMounted) {
        this.mountPlayer();
        return;
      }
      audioManager.togglePlay();
    },

    setFxVolume(v) {
      this.audioFxVolume = v;
      audioManager.setFxVolume(v);
    },

    toggleSfx() {
      const enabled = !this.audioSfxEnabled;
      this.audioSfxEnabled = enabled;
      audioManager.setSfxEnabled(enabled);
    },

    seek(frac) {
      audioManager.seek(frac);
    },

    nextTrack() {
      audioManager.nextTrack();
    },

    prevTrack() {
      audioManager.prevTrack();
    },

    formatTime(seconds) {
      if (seconds === null || seconds === undefined || isNaN(seconds)) return '--:--';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    togglePlaylist() {
      this.audioPlaylistOpen = !this.audioPlaylistOpen;
    },

    selectSong(index) {
      audioManager.selectSong(index);
    },

    toggleLoopMode() {
      audioManager.toggleLoopMode();
    },

    // ── Context Menu ──
    ctxOpen(e, i) {
      this.ctxMenu = { show: true, x: e.clientX, y: e.clientY, cellIndex: i };
    },

    editCellText() {
      const i = this.ctxMenu.cellIndex;
      this.ctxMenu.show = false;
      if (i < 0 || i >= this.cards.length) return;
      setTimeout(() => {
        const { icon, label, iconIsEmote } = splitCard(this.cards[i]);
        const hasIcon = iconIsEmote || icon !== '\u2726';
        const result = prompt('Редагувати картку:', hasIcon && label ? label : this.cards[i]);
        if (result !== null) {
          const v = hasIcon ? `${icon || ''} | ${result}` : (result || '');
          const nc = this.cards.slice();
          nc[i] = v;
          this.cards = nc;
          this.emoteVersion++;
          this.persist();
        }
      }, 60);
    },

    insertEmote() {
      this.ctxMenu.show = false;
      this.pickerSearch = '';
      this.pickerCategory = 'all';
      this.pickerVisibleCount = this.pickerChunkSize;
      this.pickerCallback = (emote) => {
        const i = this.ctxMenu.cellIndex;
        if (i < 0 || i >= this.cards.length) return;
        const { label } = splitCard(this.cards[i]);
        const nc = this.cards.slice();
        nc[i] = `${emote.code} | ${label || ''}`;
        this.cards = nc;
        this.emoteVersion++;
        this.persist();
      };
      this.pickerOpen = true;
      this.$nextTick(() => {
        const input = document.querySelector('.picker-search');
        if (input) input.focus();
      });
    },

    // ── Emote Picker ──
    pickEmote(emote) {
      this.pickerOpen = false;
      if (this.pickerCallback) { this.pickerCallback(emote); this.pickerCallback = null; }
    },

    setPickerCategory(id) {
      this.pickerCategory = id;
      this.pickerVisibleCount = this.pickerChunkSize;
    },

    onPickerScroll(e) {
      const el = e.target;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        if (this.hasMoreEmotes) this.pickerVisibleCount += this.pickerChunkSize;
      }
    },

    loadMore() {
      if (this.hasMoreEmotes) this.pickerVisibleCount += this.pickerChunkSize;
    },

    closePicker() { this.pickerOpen = false; this.pickerCallback = null; },

    // ── Twitch ID Input (replaced by addChannel/removeChannel) ──
    migrateCards() {
      if (this._cardsMigrated) return;
      this._cardsMigrated = true;
      for (const b of this.boards) {
        b.cards = b.cards.map(c => {
          const raw = String(c || '');
          if (!raw || raw.includes('|')) return raw;
          const { icon, label, iconIsEmote } = splitCard(raw);
          return iconIsEmote ? `${icon} | ${label}` : raw;
        });
      }
      this.persist();
    },
    login() { loginWithTwitch(); },
    logout() {
      authLogout(this);
      this.chatMessages = [];
      this._chatMessageIds.clear();
      this.chatTargetChannel = '';
      this.chatTargetChannelInput = '';
      this.chatTargetChannelId = null;
      this.chatTargetChannelError = '';
      chatManager.setTargetChannel(null, null);
      try { localStorage.removeItem('krsoul-bingo-chat-target-channel-v1'); } catch {}
      this.chatChannelName = chatManager.getTargetChannel();
      try { localStorage.removeItem(this._chatHistoryKey()); } catch {}
      try { chatManager.reconnect(); } catch (e) { console.warn(e); }
    },

    // ── Chat Bot Management ──
    addChatHiddenBot() {
      const name = String(this.chatHiddenBotInput || '').trim().toLowerCase();
      if (!name) return;
      if (this.chatHiddenBots.includes(name)) {
        this.chatHiddenBotInput = '';
        return;
      }
      this.chatHiddenBotsExtra.push(name);
      this.chatHiddenBotInput = '';
      try { localStorage.setItem(STORAGE_KEYS.chatHiddenBots, JSON.stringify(this.chatHiddenBotsExtra)); } catch {}
    },
    removeChatHiddenBot(name) {
      const idx = this.chatHiddenBotsExtra.findIndex(b => String(b || '').toLowerCase().trim() === name);
      if (idx !== -1) this.chatHiddenBotsExtra.splice(idx, 1);
      try { localStorage.setItem(STORAGE_KEYS.chatHiddenBots, JSON.stringify(this.chatHiddenBotsExtra)); } catch {}
    },
    toggleChatBots() {
      this.chatShowBots = !this.chatShowBots;
      try { localStorage.setItem(STORAGE_KEYS.chatShowBots, String(this.chatShowBots)); } catch {}
    },
    toggleChatBadges() {
      this.chatShowBadges = !this.chatShowBadges;
      try { localStorage.setItem(STORAGE_KEYS.chatShowBadges, String(this.chatShowBadges)); } catch {}
    },
    scrollToLogin() {
      this.editorOpen = true;
      this.$nextTick(() => {
        const el = document.getElementById('twitchLoginSection');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },

    _chatHistoryKey() {
      const channel = this.chatTargetChannel || state.twitch.user?.login || 'default';
      return `krsoul-bingo-chat-history-v1-${channel}`;
    },

    _persistChatHistory() {
      if (!this.isLoggedIn) return;
      const seen = new Set();
      const toSave = [];
      for (let i = this.chatMessages.length - 1; i >= 0 && toSave.length < 100; i--) {
        const m = this.chatMessages[i];
        if (isKnownBot(m.username, this.chatHiddenBotsExtra)) continue;
        if (!m.messageId || seen.has(m.messageId)) continue;
        seen.add(m.messageId);
        toSave.unshift({
          messageId: m.messageId,
          displayName: m.displayName,
          username: m.username,
          color: m.color,
          rawColor: m.rawColor,
          text: m.text,
          fragments: m.fragments || [],
          badges: m.badges || [],
          timestamp: m.timestamp,
        });
      }
      try {
        localStorage.setItem(this._chatHistoryKey(), JSON.stringify(toSave));
      } catch {}
    },

    loadChatHistory() {
      if (!this.isLoggedIn) return;
      let raw;
      try { raw = localStorage.getItem(this._chatHistoryKey()); } catch { return; }
      if (!raw) return;
      let parsed;
      try { parsed = JSON.parse(raw); } catch { return; }
      if (!Array.isArray(parsed)) return;
      for (const m of parsed) {
        if (!m || !m.text) continue;
        if (m.messageId && this._chatMessageIds.has(m.messageId)) continue;
        const renderedText = m.fragments?.length
          ? renderMessageFromFragments(m.fragments, m.text)
          : m.text;
        this.chatMessages.push({
          id: ++chatManager._msgId,
          messageId: m.messageId || '',
          displayName: m.displayName || m.username || 'unknown',
          username: m.username || 'unknown',
          color: m.color || null,
          rawColor: m.rawColor || null,
          text: m.text,
          fragments: m.fragments || [],
          badges: resolveBadgeUrls(m.badges || []),
          renderedText,
          timeStr: m.timestamp ? formatChatTime(m.timestamp) : '',
          timestamp: m.timestamp || '',
          isRestored: true,
        });
        if (m.messageId) this._chatMessageIds.add(m.messageId);
      }
      this.$nextTick(() => {
        const el = this.$refs?.chatMessages;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },

    manualReconnect() {
      try { chatManager.reconnect(); } catch (e) { console.warn(e); }
    },

    async changeChatChannel() {
      this.chatTargetChannelError = '';
      const val = this.chatTargetChannelInput.trim();
      if (!val || val === state.twitch.user?.login) {
        this.chatTargetChannel = '';
        this.chatTargetChannelId = null;
        chatManager.setTargetChannel(null, null);
        this.chatTargetChannelInput = state.twitch.user?.login || '';
        try { localStorage.removeItem('krsoul-bingo-chat-target-channel-v1'); } catch {}
      } else {
        try {
          const res = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(val)}`, {
            headers: { 'Authorization': `Bearer ${this.twitchToken}`, 'Client-ID': TWITCH_CLIENT_ID }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = await res.json();
          const users = body?.data;
          if (!users?.length) {
            this.chatTargetChannelError = `Канал "${val}" не знайдено`;
            return;
          }
          this.chatTargetChannel = users[0].login;
          this.chatTargetChannelId = users[0].id;
          chatManager.setTargetChannel(users[0].login, users[0].id);
        } catch (err) {
          this.chatTargetChannelError = `Помилка: ${err.message}`;
          return;
        }
        try {
          localStorage.setItem('krsoul-bingo-chat-target-channel-v1', JSON.stringify({
            login: this.chatTargetChannel,
            id: this.chatTargetChannelId,
          }));
        } catch {}
      }
      this._persistChatHistory();
      this.chatMessages = [];
      this._chatMessageIds.clear();
      chatManager.reconnect();
      this.loadChatHistory();
    },

    _updateReconnectCountdown() {
      const s = this.chatReconnectStatus;
      if (!s || s.stopped || !s.nextReconnectAt) {
        this.chatReconnectCountdown = '';
        return;
      }
      const remaining = Math.max(0, Math.ceil((s.nextReconnectAt - Date.now()) / 1000));
      this.chatReconnectCountdown = remaining > 0 ? `${remaining}с` : '';
    },
  };
}
