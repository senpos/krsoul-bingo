import { PARTICLE_THEME_OPTIONS, BINGO_EMOJIS, DEFAULT_THEME } from './config.js';
import { getEmoteEntry } from './emotes.js';
import { ParticleRenderer } from './particles-gl.js';

const _reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Bingo line utilities ──

const _lineCache = new Map();
function _getLines(size) {
  if (!_lineCache.has(size)) {
    const lines = [];
    for (let i = 0; i < size; i++) {
      lines.push(Array.from({ length: size }, (_, j) => i * size + j));
      lines.push(Array.from({ length: size }, (_, j) => j * size + i));
    }
    lines.push(Array.from({ length: size }, (_, i) => i * size + i));
    lines.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
    _lineCache.set(size, lines);
  }
  return _lineCache.get(size);
}

export function completedLineKeys(size, marks) {
  const lines = _getLines(size);
  return new Set(lines.filter(l => l.every(idx => marks[idx])).map(l => l.join(',')));
}

export function getLineInfo(size, marks) {
  const lines = _getLines(size);
  const cellLines = new Map();
  for (const indices of lines) {
    if (!indices.every(idx => marks[idx])) continue;
    const dir = indices[1] - indices[0];
    let type;
    if (dir === 1) type = 'h';
    else if (dir === size) type = 'v';
    else if (dir === size + 1) type = 'd1';
    else type = 'd2';
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      if (!cellLines.has(idx)) cellLines.set(idx, new Set());
      cellLines.get(idx).add(type);
    }
  }
  return cellLines;
}

export function getLineDirection(indices, size) {
  if (indices.length < 2) return 'h';
  const d = indices[1] - indices[0];
  if (d === 1) return 'h';
  if (d === size) return 'v';
  if (d === size + 1) return 'd1';
  return 'd2';
}

export function groupsFromKeys(keys, size) {
  const groups = [];
  for (const key of keys) {
    const indices = key.split(',').map(Number);
    groups.push({ indices, dir: getLineDirection(indices, size) });
  }
  return groups;
}

// ── Color utilities ──

function hexToRGB(hex) {
  const v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(c => c / 255);
}

function getThemeBingoRGB() {
  const raw = getComputedStyle(document.body).getPropertyValue('--bingo').trim() || '#ffee00';
  return hexToRGB(raw);
}

function getBurstColors(bingoRGB) {
  return [bingoRGB, [1, 1, 1], [1, 0, 0.5], [0, 1, 1], [0.63, 0, 1]];
}

// ── Effect Manager ──

class EffectManager {
  constructor() {
    this.renderer = null;
    this._ro = null;
    this._lastEffectTime = 0;
    this._lineEls = new Set();
    this._lineElmByKey = new Map();
    this._activeLineKeys = new Set();
  }

  init() {
    if (_reducedMotion) return;
    try {
      this.renderer = new ParticleRenderer();
      if (!this.renderer.init()) this.renderer = null;
    } catch {
      this.renderer = null;
    }

    this._ro = new ResizeObserver(() => {
      this.renderer?.resize();
      this._updateLinePositions();
    });
    const grid = document.getElementById('bingoGrid');
    if (grid) this._ro.observe(grid);

    window.addEventListener('resize', () => {
      this.renderer?.resize();
      this._updateLinePositions();
    });
  }

  // ── Public API ──

  onBingo(indices, lines, theme) {
    if (_reducedMotion) return;

    const now = performance.now();
    if (now - this._lastEffectTime < 400) return;
    this._lastEffectTime = now;

    const rectsMap = this._getCellRects(indices);
    if (rectsMap.size === 0) return;

    const linePaths = this._buildLinePaths(lines);
    if (linePaths.length === 0) return;

    if (this.renderer) {
      this._cellBurst(rectsMap, linePaths, lines);
      this._sparkleBurst(linePaths);
      this._bannerBurst();
    }
    launchBingoEmojis(theme, linePaths);
    launchConfetti();
  }

  // ── Line path builder ──

  _buildLinePaths(lines) {
    const grid = document.getElementById('bingoGrid');
    if (!grid) return [];
    const allCells = grid.querySelectorAll('.cell');

    return lines.map(line => {
      const cells = line.indices.map(i => allCells[i]).filter(Boolean);
      if (cells.length < 2) return null;

      const rects = cells.map(c => c.getBoundingClientRect());
      let sorted;
      if (line.dir === 'h' || line.dir === 'd1') {
        sorted = [...rects].sort((a, b) => a.left - b.left);
      } else if (line.dir === 'v') {
        sorted = [...rects].sort((a, b) => a.top - b.top);
      } else {
        sorted = [...rects].sort((a, b) => b.left - a.left);
      }

      const s = sorted[0], e = sorted[sorted.length - 1];
      const ax = s.left + s.width / 2, ay = s.top + s.height / 2;
      const bx = e.left + e.width / 2, by = e.top + e.height / 2;
      const dx = bx - ax, dy = by - ay;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / len, ny = dy / len;
      const thick = Math.min(s.width, s.height) * 0.7;

      return { ax, ay, bx, by, dx, dy, nx, ny, thick, len };
    }).filter(Boolean);
  }

  // ── Scatter helper ──

  _scatterAlongPaths(paths, total, genFn) {
    const per = Math.ceil(total / paths.length);
    const result = [];
    for (const p of paths) {
      for (let i = 0; i < per; i++) {
        const t = Math.random();
        const px = p.ax + p.dx * t;
        const py = p.ay + p.dy * t;
        const j = (Math.random() - 0.5) * p.thick;
        const fx = px - p.ny * j;
        const fy = py + p.nx * j;
        result.push(genFn(fx, fy, p));
      }
    }
    return result;
  }

  // ── Cell burst ──

  _cellBurst(rectsMap, linePaths, lines) {
    const bingoRGB = getThemeBingoRGB();
    const colors = getBurstColors(bingoRGB);
    const particles = [];

    // Particles at each cell center
    for (const [idx, r] of rectsMap) {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const cellSize = Math.min(r.width, r.height);
      for (let i = 0; i < 22; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 280;
        const c = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x: cx + (Math.random() - 0.5) * cellSize * 0.4,
          y: cy + (Math.random() - 0.5) * cellSize * 0.4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 80,
          r: c[0], g: c[1], b: c[2],
          alpha: 0.8 + Math.random() * 0.2,
          size: 3 + Math.random() * 5,
          decay: 0.4 + Math.random() * 0.6,
          age: 0, delay: 0,
        });
      }
    }

    // Fill particles scattered along line paths
    const fillParts = this._scatterAlongPaths(linePaths, 50, (fx, fy, p) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      const c = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: fx, y: fy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        r: c[0], g: c[1], b: c[2],
        alpha: 0.7 + Math.random() * 0.3,
        size: 2 + Math.random() * 4,
        decay: 0.5 + Math.random() * 0.7,
        age: 0, delay: 0,
      };
    });
    for (const p of fillParts) particles.push(p);

    // Sweep particles
    for (const line of lines) {
      const sp = this._createSweep(line, bingoRGB);
      for (const p of sp) particles.push(p);
    }

    this.renderer.emit(particles);
  }

  // ── Sparkle burst ──

  _sparkleBurst(linePaths) {
    const bingoRGB = getThemeBingoRGB();
    const colors = [bingoRGB, [1, 1, 1], [1, 0.9, 0.5], [0.8, 0.9, 1]];

    const particles = this._scatterAlongPaths(linePaths, 60, (fx, fy, p) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 350;
      const c = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: fx, y: fy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        r: c[0], g: c[1], b: c[2],
        alpha: 1,
        size: 2 + Math.random() * 3,
        decay: 0.8 + Math.random() * 0.8,
        age: 0,
        delay: Math.random() * 0.3,
      };
    });

    this.renderer.emit(particles);
  }

  // ── Banner burst ──

  _bannerBurst() {
    const bingoRGB = getThemeBingoRGB();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const colors = [bingoRGB, [1, 1, 1], [1, 0.95, 0.6]];
    const particles = [];

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 250;
      const c = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        r: c[0], g: c[1], b: c[2],
        alpha: 1,
        size: 4 + Math.random() * 6,
        decay: 0.6 + Math.random() * 0.5,
        age: 0, delay: 0.15 + Math.random() * 0.4,
      });
    }
    // Ring burst
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16;
      const speed = 180;
      const c = bingoRGB;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: c[0], g: c[1], b: c[2],
        alpha: 0.8,
        size: 3,
        decay: 0.3,
        age: 0, delay: 0.1,
      });
    }

    this.renderer.emit(particles);
  }

  // ── Sweep wave ──

  _createSweep(line, bingoRGB) {
    const grid = document.getElementById('bingoGrid');
    if (!grid) return [];
    const allCells = grid.querySelectorAll('.cell');
    const cells = line.indices.map(i => allCells[i]).filter(Boolean);
    if (cells.length < 2) return [];

    const rects = cells.map(c => c.getBoundingClientRect());
    const dir = line.dir;

    let sorted;
    if (dir === 'h') {
      sorted = rects.sort((a, b) => a.left - b.left);
    } else if (dir === 'v') {
      sorted = rects.sort((a, b) => a.top - b.top);
    } else if (dir === 'd1') {
      sorted = rects.sort((a, b) => a.left - b.left);
    } else {
      sorted = rects.sort((a, b) => b.left - a.left);
    }

    const s = sorted[0], e = sorted[sorted.length - 1];
    const sx = s.left + s.width / 2, sy = s.top + s.height / 2;
    const ex = e.left + e.width / 2, ey = e.top + e.height / 2;
    const dx = ex - sx, dy = ey - sy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len, ny = dy / len;

    const COUNT = 24;
    const PERP = 20;
    const particles = [];

    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT;
      const delay = t * 0.7;
      const px = sx + dx * t;
      const py = sy + dy * t;
      const jitter = (Math.random() - 0.5) * PERP;
      const jx = -ny * jitter;
      const jy = nx * jitter;
      const spread = (Math.random() - 0.5) * Math.PI * 0.6;
      const spd = 60 + Math.random() * 120;
      const a = Math.atan2(ny, nx) + spread;

      particles.push({
        x: px + jx, y: py + jy,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 40,
        r: bingoRGB[0], g: bingoRGB[1], b: bingoRGB[2],
        alpha: 0.9 + Math.random() * 0.1,
        size: 4 + Math.random() * 5,
        decay: 0.5 + Math.random() * 0.3,
        age: 0, delay,
      });
    }
    return particles;
  }

  // ── Cell rects ──

  _getCellRects(indices) {
    const grid = document.getElementById('bingoGrid');
    if (!grid) return new Map();
    const allCells = grid.querySelectorAll('.cell');
    const map = new Map();
    for (const i of indices) {
      const cell = allCells[i];
      if (!cell) continue;
      map.set(i, cell.getBoundingClientRect());
    }
    return map;
  }

  // ── Bingo line overlays ──

  _clearLineOverlays() {
    for (const el of this._lineEls) {
      el._lineAnim?.cancel();
      el.remove();
    }
    this._lineEls.clear();
    this._lineElmByKey.clear();
  }

  _lineKey(line) {
    return line.indices.slice().sort((a, b) => a - b).join(',');
  }

  drawBingoLines(lines) {
    const newKeys = new Set((lines || []).map(l => this._lineKey(l)));

    if (newKeys.size === this._activeLineKeys.size &&
        [...newKeys].every(k => this._activeLineKeys.has(k))) {
      return;
    }

    // Remove lines no longer active
    for (const key of this._activeLineKeys) {
      if (!newKeys.has(key)) {
        const el = this._lineElmByKey.get(key);
        if (el) {
          el._lineAnim?.cancel();
          el.remove();
          this._lineEls.delete(el);
          this._lineElmByKey.delete(key);
        }
      }
    }

    this._activeLineKeys = newKeys;
    if (!lines || lines.length === 0) return;

    const grid = document.getElementById('bingoGrid');
    if (!grid) return;
    const allCells = grid.querySelectorAll('.cell');

    for (const line of lines) {
      const key = this._lineKey(line);
      if (this._lineElmByKey.has(key)) continue;

      const cells = line.indices.map(i => allCells[i]).filter(Boolean);
      if (cells.length < 2) continue;

      const rects = cells.map(c => c.getBoundingClientRect());
      const gridRect = grid.getBoundingClientRect();

      let sorted;
      if (line.dir === 'h' || line.dir === 'd1') {
        sorted = [...rects].sort((a, b) => a.left - b.left);
      } else if (line.dir === 'v') {
        sorted = [...rects].sort((a, b) => a.top - b.top);
      } else {
        sorted = [...rects].sort((a, b) => b.left - a.left);
      }

      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      const x1 = first.left + first.width / 2;
      const y1 = first.top + first.height / 2;
      const x2 = last.left + last.width / 2;
      const y2 = last.top + last.height / 2;

      const rx1 = x1 - gridRect.left;
      const ry1 = y1 - gridRect.top;
      const rx2 = x2 - gridRect.left;
      const ry2 = y2 - gridRect.top;

      const dx = rx2 - rx1;
      const dy = ry2 - ry1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      const el = document.createElement('div');
      el.className = 'bingo-line';
      el.style.cssText = `left:${rx1}px;top:${ry1}px;width:${len}px;`;
      el.dataset.lineDir = line.dir;
      el.dataset.lineIndices = line.indices.join(',');
      el.dataset.lineKey = key;
      grid.appendChild(el);

      el._lineAnim = el.animate([
        { transform: `translateY(-50%) rotate(${angle}deg) scaleX(0)`, opacity: 0 },
        { transform: `translateY(-50%) rotate(${angle}deg) scaleX(1.05)`, opacity: 0.8 },
        { transform: `translateY(-50%) rotate(${angle}deg) scaleX(1)`, opacity: 1 },
      ], { duration: 500, easing: 'ease-out', fill: 'forwards' });

      this._lineEls.add(el);
      this._lineElmByKey.set(key, el);
    }
  }

  _updateLinePositions() {
    if (this._lineEls.size === 0) return;
    const grid = document.getElementById('bingoGrid');
    if (!grid) return;
    const allCells = grid.querySelectorAll('.cell');

    for (const el of this._lineEls) {
      el._lineAnim?.cancel();
      const indices = el.dataset.lineIndices.split(',').map(Number);
      const dir = el.dataset.lineDir;
      const cells = indices.map(i => allCells[i]).filter(Boolean);
      if (cells.length < 2) continue;

      const rects = cells.map(c => c.getBoundingClientRect());
      const gridRect = grid.getBoundingClientRect();

      let sorted;
      if (dir === 'h' || dir === 'd1') {
        sorted = [...rects].sort((a, b) => a.left - b.left);
      } else if (dir === 'v') {
        sorted = [...rects].sort((a, b) => a.top - b.top);
      } else {
        sorted = [...rects].sort((a, b) => b.left - a.left);
      }

      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const x1 = first.left + first.width / 2;
      const y1 = first.top + first.height / 2;
      const x2 = last.left + last.width / 2;
      const y2 = last.top + last.height / 2;
      const rx1 = x1 - gridRect.left;
      const ry1 = y1 - gridRect.top;
      const rx2 = x2 - gridRect.left;
      const ry2 = y2 - gridRect.top;
      const dx = rx2 - rx1;
      const dy = ry2 - ry1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      el.style.left = rx1 + 'px';
      el.style.top = ry1 + 'px';
      el.style.width = len + 'px';
      el.style.transform = `translateY(-50%) rotate(${angle}deg) scaleX(1)`;
    }
  }
}

// ── Singleton instance ──

let _effectManager = null;
export function getEffectManager() {
  if (!_effectManager) {
    _effectManager = new EffectManager();
    _effectManager.init();
  }
  return _effectManager;
}

// ── Confetti ──

export function launchConfetti() {
  if (_reducedMotion) return;
  const count = 80;
  const colors = ['#ff007f', '#00ffff', '#ffee00', '#5500ff', '#ffffff', '#ff0055'];
  const stagger = 15;
  const fragment = document.createDocumentFragment();
  const pieces = [];
  const maxDuration = 4000;
  const maxDelay = (count - 1) * stagger;

  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    const delay = i * stagger;
    c.style.cssText = `left:${Math.random() * 100}vw;width:${6 + Math.random() * 8}px;height:${6 + Math.random() * 8}px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-duration:${1.5 + Math.random() * 2.5}s;animation-delay:${delay}ms;`;
    fragment.appendChild(c);
    pieces.push(c);
  }
  document.body.appendChild(fragment);
  setTimeout(() => {
    for (const p of pieces) p.remove();
  }, maxDelay + maxDuration + 500);
}

// ── Emoji burst ──

export function launchBingoEmojis(themeName, linePaths) {
  if (_reducedMotion) return;
  const container = document.getElementById('bingoEmojis');
  if (!container) return;
  container.innerHTML = '';
  clearTimeout(container._emojiTimer);

  const emojis = BINGO_EMOJIS[themeName] || BINGO_EMOJIS[DEFAULT_THEME] || ['🎉', '✨', '🎊'];
  const count = 64;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const entry = getEmoteEntry(emoji);
    const el = entry
      ? Object.assign(document.createElement('img'), { className: 'bingo-emoji', src: entry.url, alt: entry.code })
      : Object.assign(document.createElement('span'), { className: 'bingo-emoji', textContent: emoji });

    // Scatter along all winning line paths
    const path = linePaths[Math.floor(Math.random() * linePaths.length)];
    const t = Math.random();
    const ox = path.ax + path.dx * t;
    const oy = path.ay + path.dy * t;
    const j = (Math.random() - 0.5) * path.thick;
    const fx = ox - path.ny * j;
    const fy = oy + path.nx * j;

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const distance = 80 + Math.random() * 160;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const rot = (Math.random() - 0.5) * 1080;
    const size = 24 + Math.random() * 20;
    const delay = Math.random() * 0.5;

    el.style.cssText =
      `left:${fx}px;top:${fy}px;` +
      `--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;--size:${size}px;--delay:${delay}s;` +
      (entry ? `height:${size}px;width:auto;` : '');
    fragment.appendChild(el);
  }

  // CSS sparkle rings along line paths
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('div');
    s.className = 'emoji-sparkle';
    const path = linePaths[Math.floor(Math.random() * linePaths.length)];
    const t = Math.random();
    const sx = path.ax + path.dx * t;
    const sy = path.ay + path.dy * t;
    const sj = (Math.random() - 0.5) * path.thick;
    const sfx = sx - path.ny * sj;
    const sfy = sy + path.nx * sj;
    const ss = 4 + Math.random() * 12;
    const sd = Math.random() * 0.6;
    s.style.cssText = `left:${sfx}px;top:${sfy}px;width:${ss}px;height:${ss}px;--sd:${sd}s;`;
    fragment.appendChild(s);
  }

  container.appendChild(fragment);
  container._emojiTimer = setTimeout(() => { container.innerHTML = ''; }, 3500);
}

// ── CSS background particles ──

export function setBingoMode(active) {}

function _clearCssParticles(container) {
  if (!container) return;
  container.querySelectorAll('.css-particle').forEach(el => el.remove());
}

function _injectCssParticles(container, themeName) {
  if (!container) return;
  _clearCssParticles(container);
  const options = PARTICLE_THEME_OPTIONS[themeName] || PARTICLE_THEME_OPTIONS[DEFAULT_THEME];
  const colors = options?.particles?.color?.value || ['#ffffff'];
  const count = 15;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'css-particle';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 4 + Math.random() * 8;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const duration = 8 + Math.random() * 12;
    const delay = Math.random() * 10;
    el.style.cssText = `background:${color};width:${size}px;height:${size}px;left:${left}%;top:${top}%;animation-duration:${duration}s;animation-delay:${delay}s;`;
    fragment.appendChild(el);
  }
  container.appendChild(fragment);
}

export function applyParticleTheme(name) {
  const container = document.getElementById('tsparticles');
  _injectCssParticles(container, name);
}

let _resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    const theme = document.body.getAttribute('data-theme') || DEFAULT_THEME;
    applyParticleTheme(theme);
  }, 300);
});
