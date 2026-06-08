import { THEMES } from './config.js';

const MAGIC = 0x4B;
const VER = 1;

function b64urlEncode(bytes) {
  const bin = Array.from(bytes, b => String.fromCodePoint(b)).join('');
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad === 2) b64 += '==';
  else if (pad === 3) b64 += '=';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function compress(bytes) {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const cs = new CompressionStream('gzip');
    const w = cs.writable.getWriter();
    w.write(bytes);
    w.close();
    return new Uint8Array(await new Response(cs.readable).arrayBuffer());
  } catch {
    return null;
  }
}

async function decompress(bytes) {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const ds = new DecompressionStream('gzip');
    const w = ds.writable.getWriter();
    w.write(bytes);
    w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  } catch {
    return null;
  }
}

function packBoard(board) {
  const enc = new TextEncoder();
  const size = board.size;
  const total = size * size;
  const themeIdx = Math.max(0, THEMES.indexOf(board.theme));
  const nameBytes = enc.encode(board.name || '');
  const idBytes = enc.encode(board.id || '');
  const userIdBytes = enc.encode(board.userId || '');

  const markBytes = Math.ceil(total / 8);
  const marks = new Uint8Array(markBytes);
  for (let i = 0; i < total; i++) {
    if (board.marks[i]) marks[i >> 3] |= 1 << (i & 7);
  }

  const cardParts = [];
  let cardLen = 0;
  for (let i = 0; i < total; i++) {
    let card = board.cards[i] || '';
    card = card.replace(/ \| /g, '\0');
    const cb = enc.encode(card);
    cardParts.push(cb);
    cardLen += 2 + cb.length;
  }

  const buf = new Uint8Array(6 + nameBytes.length + idBytes.length + userIdBytes.length + markBytes + cardLen);
  const v = new DataView(buf.buffer);
  let o = 0;

  buf[o++] = MAGIC;
  buf[o++] = VER;
  buf[o++] = ((size - 3) << 4) | themeIdx;
  buf[o++] = nameBytes.length;
  buf.set(nameBytes, o); o += nameBytes.length;
  buf[o++] = idBytes.length;
  buf.set(idBytes, o); o += idBytes.length;
  buf[o++] = userIdBytes.length;
  buf.set(userIdBytes, o); o += userIdBytes.length;
  buf.set(marks, o); o += markBytes;
  for (const cp of cardParts) {
    v.setUint16(o, cp.length, true); o += 2;
    buf.set(cp, o); o += cp.length;
  }

  return buf;
}

function unpackBoard(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let o = 0;

  if (bytes[o++] !== MAGIC) throw new Error('bad magic');
  const ver = bytes[o++];
  if (ver > VER) throw new Error(`unsupported version ${ver}`);

  const b2 = bytes[o++];
  const size = (b2 >> 4) + 3;
  const themeIdx = b2 & 0xF;
  const theme = THEMES[themeIdx] || 'twice';

  const nameLen = bytes[o++];
  const name = new TextDecoder().decode(bytes.slice(o, o + nameLen));
  o += nameLen;

  const idLen = bytes[o++];
  const id = new TextDecoder().decode(bytes.slice(o, o + idLen));
  o += idLen;

  let userId = '';
  if (ver >= 1) {
    const userIdLen = bytes[o++];
    userId = new TextDecoder().decode(bytes.slice(o, o + userIdLen));
    o += userIdLen;
  }

  const total = size * size;
  const markBytes = Math.ceil(total / 8);
  const marks = [];
  for (let i = 0; i < total; i++) {
    marks.push(Boolean(bytes[o + (i >> 3)] & (1 << (i & 7))));
  }
  o += markBytes;

  const dec = new TextDecoder();
  const cards = [];
  for (let i = 0; i < total; i++) {
    const len = v.getUint16(o, true); o += 2;
    let card = dec.decode(bytes.slice(o, o + len));
    card = card.replace(/\0/g, ' | ');
    cards.push(card);
    o += len;
  }

  return { id, userId, name, size, cards, marks, theme };
}

export async function shareBoard(board) {
  const packed = packBoard(board);
  const compressed = await compress(packed);
  if (compressed && compressed.length < packed.length) {
    return b64urlEncode(compressed);
  }
  return b64urlEncode(packed);
}

export async function unshareBoard(encoded) {
  let bytes;
  try {
    bytes = b64urlDecode(encoded);
  } catch {
    try {
      return JSON.parse(encoded);
    } catch {
      throw new Error('Invalid share link');
    }
  }

  const decompressed = await decompress(bytes);
  const data = decompressed || bytes;

  try {
    return unpackBoard(data);
  } catch {
    try {
      const json = new TextDecoder().decode(data);
      return JSON.parse(json);
    } catch {
      throw new Error('Cannot decode board');
    }
  }
}
