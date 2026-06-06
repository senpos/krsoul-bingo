import { STORAGE_KEYS, V2_KEYS, DEFAULT_TWITCH_USER_ID, DEFAULT_CARDS, generateBoardId } from './config.js';

export const state = {
  twitchUserId: DEFAULT_TWITCH_USER_ID,
  emotes: {
    loading: false,
    ready: false,
    error: '',
    lookup: new Map(),
    assetCache: new Map(),
    sourceRecords: new Map()
  },
  twitch: {
    token: null,
    user: null
  }
};

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function migrateV2ToV3() {
  if (localStorage.getItem(STORAGE_KEYS.boards)) return null;

  const hasV2 = localStorage.getItem(V2_KEYS.cards) || localStorage.getItem(V2_KEYS.marks);
  if (!hasV2) return null;

  const size = Number(localStorage.getItem(V2_KEYS.size)) || 5;
  const storedCards = loadJson(V2_KEYS.cards, null);
  const storedMarks = loadJson(V2_KEYS.marks, null);
  const theme = localStorage.getItem(V2_KEYS.theme) || 'twice';
  const twitchUserId = localStorage.getItem(V2_KEYS.twitchUserId) || DEFAULT_TWITCH_USER_ID;

  const total = size * size;
  const cards = Array.isArray(storedCards) && storedCards.length
    ? storedCards.map(v => String(v).trim())
    : [...DEFAULT_CARDS].slice(0, total);
  const marks = Array.isArray(storedMarks) ? storedMarks.map(Boolean) : Array(total).fill(false);

  while (cards.length < total) cards.push('');
  cards.length = total;
  while (marks.length < total) marks.push(false);
  marks.length = total;

  const board = {
    id: generateBoardId(),
    name: 'Board 1',
    size,
    cards,
    marks,
    theme
  };

  const boards = [board];
  localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards));
  localStorage.setItem(STORAGE_KEYS.activeBoard, board.id);
  localStorage.setItem(STORAGE_KEYS.twitchUserId, twitchUserId);

  Object.values(V2_KEYS).forEach(key => {
    try { localStorage.removeItem(key); } catch {}
  });

  return { boards, activeBoardId: board.id };
}

export function loadBoards() {
  const migrated = migrateV2ToV3();
  if (migrated) return migrated;

  const boardsJson = localStorage.getItem(STORAGE_KEYS.boards);
  let boards = [];
  try { boards = boardsJson ? JSON.parse(boardsJson) : []; } catch { boards = []; }

  if (!Array.isArray(boards) || boards.length === 0) {
    boards = [{
      id: generateBoardId(),
      name: 'Board 1',
      size: 5,
      cards: [...DEFAULT_CARDS],
      marks: Array(25).fill(false),
      theme: 'twice'
    }];
    saveBoards(boards);
  }

  let activeBoardId = localStorage.getItem(STORAGE_KEYS.activeBoard);
  if (!activeBoardId || !boards.some(b => b.id === activeBoardId)) {
    activeBoardId = boards[0].id;
    saveActiveBoardId(activeBoardId);
  }

  state.twitchUserId = String(localStorage.getItem(STORAGE_KEYS.twitchUserId) || DEFAULT_TWITCH_USER_ID)
    .replace(/\D/g, '').trim() || DEFAULT_TWITCH_USER_ID;

  return { boards, activeBoardId };
}

export function saveBoards(boards) {
  try { localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards)); } catch {}
}

export function saveActiveBoardId(id) {
  localStorage.setItem(STORAGE_KEYS.activeBoard, id);
}

export function saveState() {
  localStorage.setItem(STORAGE_KEYS.twitchUserId, state.twitchUserId);
}

export function loadEmoteSourceCache() {
  const cache = loadJson(STORAGE_KEYS.emoteSourceCache, null);
  return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {};
}

export function saveEmoteSourceCache(cache) {
  try {
    localStorage.setItem(STORAGE_KEYS.emoteSourceCache, JSON.stringify(cache));
  } catch {}
}
