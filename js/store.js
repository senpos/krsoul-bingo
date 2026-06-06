import { STORAGE_KEYS, DEFAULT_TWITCH_USER_ID, DEFAULT_CARDS, TWITCH_CLIENT_ID, generateBoardId, toBase64, fromBase64, compress, decompress } from './config.js';
import { state, loadBoards, saveBoards, saveActiveBoardId } from './state.js';
import { getEmoteEntry, splitCard, getAllEmotes, getEmotesBySource, scheduleEmoteRefresh, queueInitialEmoteRefresh, onEmoteRefresh, onEmoteStatus } from './emotes.js';
import { loginWithTwitch, logout as authLogout, initAuth } from './auth.js';
import { completedLineKeys, drawBingoLines, launchConfetti, applyParticleTheme } from './game.js';

export function createApp() {
  return {
    boards: [],
    activeBoardId: '',

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

    // ── Global state ──
    get twitchUserId() { return state.twitchUserId; },
    set twitchUserId(val) {
      state.twitchUserId = val;
      try { localStorage.setItem(STORAGE_KEYS.twitchUserId, val); } catch {}
    },

    // ── Auth ──
    twitchToken: null,
    twitchUser: null,
    get isLoggedIn() { return !!this.twitchToken; },

    // ── UI State ──
    allowCelebrate: true,
    lastCompletedKeys: new Set(),
    toastVisible: false,
    toastLabel: '',
    toastCount: 0,

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
    emoteStatusMsg: 'Loading emotes...',
    emoteStatusKind: '',
    _cardsMigrated: false,

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

    // ── BINGO Headers ──
    get bingoHeaders() {
      const emojis = ['\uD83C\uDFB5', '\uD83C\uDFB6', '\uD83C\uDFB8', '\uD83C\uDFB9', '\uD83E\uDD41'];
      const letters = ['B', 'I', 'N', 'G', 'O'];
      const colorClasses = ['bl-b', 'bl-i', 'bl-n', 'bl-g', 'bl-o'];
      const headers = [];
      for (let i = 0; i < this.size; i++) {
        headers.push({
          text: i < 5 ? letters[i] : emojis[(i - 5) % emojis.length],
          cls: i < 5 ? colorClasses[i] : ''
        });
      }
      return headers;
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
      return `${this.markedCount} marked \u00B7 ${n} BINGO${n !== 1 ? 's' : ''}`;
    },

    get cardsCountText() {
      const total = this.cards.filter(Boolean).length;
      const inGrid = Math.min(total, this.cellCount);
      return `${total} lines total${total !== inGrid ? ` (${inGrid} in grid)` : ''}`;
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
        id: 'all', label: 'All sources',
        count: this.allEmotes.length, iconText: '\u2605', color: '#666', scope: ''
      });

      const defs = [
        { id: 'Twitch global', iconText: 'T', color: '#9146ff', scope: 'global' },
        { id: 'Twitch channel', iconText: 'T', color: '#9146ff', scope: 'channel' },
        { id: 'BTTV global', iconText: 'B', color: '#3bf', scope: 'global' },
        { id: 'BTTV channel', iconText: 'B', color: '#3bf', scope: 'channel' },
        { id: '7TV global', iconText: '7', color: '#ff6b35', scope: 'global' },
        { id: '7TV channel', iconText: '7', color: '#ff6b35', scope: 'channel' },
        { id: 'FFZ global', iconText: 'F', color: '#ffd700', scope: 'global' },
        { id: 'FFZ channel', iconText: 'F', color: '#ffd700', scope: 'channel' },
      ];

      for (const def of defs) {
        if (groups.has(def.id)) {
          sources.push({ ...def, label: def.id, count: groups.get(def.id).length });
        }
      }
      return sources;
    },

    get pickerCategoryLabel() {
      return this.pickerCategory === 'all' ? 'All sources' : this.pickerCategory;
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
        return {
          icon, label, iconIsEmote, iconParts,
          emoteUrl: firstEmote?.url || '',
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

      initAuth(this);
      queueInitialEmoteRefresh();

      this.checkImportUrl();
    },

    persist() {
      saveBoards(this.boards);
      saveActiveBoardId(this.activeBoardId);
    },

    // ── Board Management ──
    editingBoardId: null,
    deletingBoardId: null,

    startRename(id) {
      this.editingBoardId = id;
      requestAnimationFrame(() => {
        const el = document.querySelector(`.tab-name-input[data-board-id="${id}"]`);
        if (el) { el.focus(); el.select(); }
      });
    },

    addBoard() {
      const name = `Board ${this.boards.length + 1}`;
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
      });
    },

    switchBoard(id) {
      if (id === this.activeBoardId) return;
      this.editingBoardId = null;
      this.deletingBoardId = null;
      clearTimeout(this._deletingTimer);
      this.activeBoardId = id;
      this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
      this.history = [];
      this.redoHistory = [];
      this.persist();
      document.body.setAttribute('data-theme', this.theme);
      applyParticleTheme(this.theme);
    },

    deleteBoard(id) {
      if (this.boards.length <= 1) return;
      const idx = this.boards.findIndex(b => b.id === id);
      if (idx === -1) return;
      this.boards.splice(idx, 1);
      if (this.activeBoardId === id) {
        this.activeBoardId = this.boards[0].id;
      }
      this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
      this.history = [];
      this.redoHistory = [];
      this.persist();
      document.body.setAttribute('data-theme', this.theme);
      applyParticleTheme(this.theme);
    },

    confirmDeleteBoard(id) {
      clearTimeout(this._deletingTimer);
      this.editingBoardId = null;
      this.deletingBoardId = id;
      this._deletingTimer = setTimeout(() => {
        this.deletingBoardId = null;
      }, 5000);
    },

    cancelDeleteBoard() {
      clearTimeout(this._deletingTimer);
      this.deletingBoardId = null;
    },

    executeDeleteBoard(id) {
      clearTimeout(this._deletingTimer);
      this.deletingBoardId = null;
      const el = document.querySelector(`.board-tab[data-board-id="${id}"]`);
      if (el) el.classList.add('removing');
      setTimeout(() => { this.deleteBoard(id); }, 250);
    },

    renameBoard(id, newName) {
      const board = this.boards.find(b => b.id === id);
      if (board && newName.trim()) {
        board.name = newName.trim().slice(0, 50);
        this.persist();
      }
    },

    setSize(newSize) {
      if (newSize < 2 || newSize > 10) return;
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
        cards: board.cards, marks: board.marks, theme: board.theme
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
    },

    async importBoardFromText() {
      const text = prompt('Paste board data (base64 or JSON):');
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
      if (!Number.isFinite(sz) || sz < 2 || sz > 10) return false;
      return true;
    },

    _importBoardPayload(payload) {
      const name = String(payload.name || 'Imported').slice(0, 50);
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
      if (newKeys.length > 0) {
        this.toastCount = currentKeys.size;
        this.toastLabel = this.toastCount === 1 ? 'New line matched!' : `${this.toastCount} lines matched!`;
        this.toastVisible = true;
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { this.toastVisible = false; }, 1200);
        launchConfetti();
      }
    },

    hideToast() {
      this.toastVisible = false;
      this.toastCount = 0;
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
    },

    redo() {
      if (!this.canRedo) return;
      this.history.push({ cards: [...this.cards], marks: [...this.marks] });
      const next = this.redoHistory.pop();
      this.cards = next.cards;
      this.marks = next.marks;
      this.lastCompletedKeys = new Set(completedLineKeys(this.size, this.marks));
      this.persist();
    },

    setTheme(name) {
      this.theme = name;
      document.body.setAttribute('data-theme', name);
      this.persist();
      applyParticleTheme(name);
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
        const result = prompt('Edit card:', hasIcon && label ? label : this.cards[i]);
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

    // ── Twitch ID Input ──
    onTwitchIdInput(e) {
      clearTimeout(this._resolveTimer);
      const raw = (e?.target?.value || '').trim();
      if (!raw) { this.twitchUserId = DEFAULT_TWITCH_USER_ID; scheduleEmoteRefresh(); return; }
      if (/^\d+$/.test(raw)) { this.twitchUserId = raw; scheduleEmoteRefresh(); return; }
      if (!this.twitchToken) {
        this.emoteStatusMsg = 'Login to Twitch to use username lookup';
        this.emoteStatusKind = 'error';
        return;
      }
      this._resolveTimer = setTimeout(async () => {
        try {
          this.emoteStatusMsg = `Looking up "${raw}"...`;
          this.emoteStatusKind = '';
          const res = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(raw)}`, {
            headers: { 'Authorization': `Bearer ${this.twitchToken}`, 'Client-ID': TWITCH_CLIENT_ID }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = await res.json();
          const users = body?.data;
          if (!users?.length) { this.emoteStatusMsg = `Twitch user "${raw}" not found`; this.emoteStatusKind = 'error'; return; }
          this.twitchUserId = users[0].id;
          if (!this.twitchUser) this.twitchUser = users[0];
          scheduleEmoteRefresh();
        } catch (err) {
          this.emoteStatusMsg = `Lookup failed: ${err.message}`;
          this.emoteStatusKind = 'error';
        }
      }, 600);
    },
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
    logout() { authLogout(this); },
  };
}
