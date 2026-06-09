import { PARTICLE_THEME_OPTIONS, PARTICLE_LIMITS, BINGO_EMOJIS } from './config.js';

function _isMobile() {
  return window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches;
}

function _isLiteMode() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  const hw = navigator.hardwareConcurrency || 99;
  const mem = navigator.deviceMemory || 99;
  return hw <= 4 && mem < 4;
}

function _calcMaxParticles() {
  const area = window.innerWidth * window.innerHeight;
  const byDensity = Math.floor(area / PARTICLE_LIMITS.densityArea);
  return Math.min(PARTICLE_LIMITS.maxParticles, byDensity);
}

function _clampParticleOptions(options) {
  const max = _calcMaxParticles();
  const cloned = JSON.parse(JSON.stringify(options));
  if (cloned.particles?.number) {
    cloned.particles.number.value = Math.min(cloned.particles.number.value, max);
  }
  // Disable interactivity on touch devices even when running on desktop-capable hardware
  if (_isMobile() && cloned.interactivity?.events) {
    cloned.interactivity.events.onhover = { enable: false, mode: 'none' };
    cloned.interactivity.events.onclick = { enable: false, mode: 'none' };
  }
  return cloned;
}

export function completedLineKeys(size, marks) {
  const s = size;
  const lines = [];
  for (let i = 0; i < s; i++) {
    lines.push(Array.from({ length: s }, (_, j) => i * s + j));
    lines.push(Array.from({ length: s }, (_, j) => j * s + i));
  }
  lines.push(Array.from({ length: s }, (_, i) => i * s + i));
  lines.push(Array.from({ length: s }, (_, i) => i * s + (s - 1 - i)));
  return new Set(lines.filter(l => l.every(idx => marks[idx])).map(l => l.join(',')));
}

const _lineMap = new Map();
let _cellCache = [];

function _rebuildCellCache() {
  const grid = document.getElementById('bingoGrid');
  if (!grid) return;
  const cells = grid.querySelectorAll('.cell');
  _cellCache = Array.from(cells).map(cell => {
    const r = cell.getBoundingClientRect();
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      size: Math.min(r.width, r.height)
    };
  });
}

function _cellCenter(index, svgRect) {
  const cached = _cellCache[index];
  if (!cached) return null;
  return { x: cached.x - svgRect.left, y: cached.y - svgRect.top };
}

function _createLineEl(indices, svg) {
  const svgRect = svg.getBoundingClientRect();
  const a = _cellCenter(indices[0], svgRect);
  const b = _cellCenter(indices[indices.length - 1], svgRect);
  if (!a || !b) return null;

  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('class', 'bingo-line');
  line.setAttribute('x1', a.x);
  line.setAttribute('y1', a.y);
  line.setAttribute('x2', b.x);
  line.setAttribute('y2', b.y);
  line.style.strokeDasharray = len;
  line.style.setProperty('--line-length', len);
  svg.appendChild(line);
  return line;
}

function _updateLineEl(el, indices, svg) {
  const svgRect = svg.getBoundingClientRect();
  const a = _cellCenter(indices[0], svgRect);
  const b = _cellCenter(indices[indices.length - 1], svgRect);
  if (!a || !b) return;

  const len = Math.hypot(b.x - a.x, b.y - a.y);
  el.setAttribute('x1', a.x);
  el.setAttribute('y1', a.y);
  el.setAttribute('x2', b.x);
  el.setAttribute('y2', b.y);
  el.style.strokeDasharray = len;
  el.style.strokeDashoffset = '0';
}

export function drawBingoLines(keys) {
  const svg = document.getElementById('bingoLines');
  const grid = document.getElementById('bingoGrid');
  if (!svg || !grid) return;

  _rebuildCellCache();

  const keySet = new Set(keys);

  for (const [key, data] of _lineMap) {
    if (!keySet.has(key)) {
      data.el.remove();
      _lineMap.delete(key);
    }
  }

  for (const key of keySet) {
    if (!_lineMap.has(key)) {
      const indices = key.split(',').map(Number);
      const el = _createLineEl(indices, svg);
      if (el) _lineMap.set(key, { el, indices });
    }
  }
}

export function updateLinePositions() {
  const svg = document.getElementById('bingoLines');
  const grid = document.getElementById('bingoGrid');
  if (!svg || !grid || _lineMap.size === 0) return;
  _rebuildCellCache();
  for (const data of _lineMap.values()) {
    _updateLineEl(data.el, data.indices, svg);
  }
}

export function clearBingoLines() {
  for (const data of _lineMap.values()) data.el.remove();
  _lineMap.clear();
  _cellCache = [];
}

export function launchConfetti() {
  if (_isLiteMode()) return;
  const isMobile = _isMobile();
  const count = isMobile ? 40 : 140;
  const colors = ['#ff007f', '#00ffff', '#ffee00', '#5500ff', '#ffffff', '#ff0055'];
  const stagger = isMobile ? 25 : 15;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const c = document.createElement('div');
      c.className = 'confetti-piece';
      c.style.cssText = `left:${Math.random() * 100}vw; width:${6 + Math.random() * 8}px; height:${6 + Math.random() * 8}px; background:${colors[Math.floor(Math.random() * colors.length)]}; animation-duration:${1.5 + Math.random() * 2.5}s;`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }, i * stagger);
  }
}

export function launchBingoEmojis(themeName) {
  if (_isLiteMode()) return;
  const container = document.getElementById('bingoEmojis');
  if (!container) return;

  const emojis = BINGO_EMOJIS[themeName] || BINGO_EMOJIS.twice || ['🎉', '✨', '🎊'];
  const count = 24;

  for (let i = 0; i < count; i++) {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const el = document.createElement('span');
    el.className = 'bingo-emoji';
    el.textContent = emoji;

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 120 + Math.random() * 280;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const rot = (Math.random() - 0.5) * 720;
    const size = 22 + Math.random() * 20;
    const delay = Math.random() * 1.2;

    el.style.cssText = `--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;--size:${size}px;--delay:${delay}s;`;
    container.appendChild(el);
  }

  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

/**
 * Spawn a burst of particles at the center of each bingo cell.
 * Creates a temporary canvas overlay that is removed after animation.
 */
export function bingoCellBurst(indices) {
  if (_isLiteMode()) return;
  const grid = document.getElementById('bingoGrid');
  if (!grid) return;

  _rebuildCellCache();
  if (_cellCache.length === 0) return;

  const origins = [];
  indices.forEach(i => {
    const cached = _cellCache[i];
    if (!cached) return;
    origins.push({
      x: cached.x,
      y: cached.y,
      size: cached.size
    });
  });

  if (origins.length === 0) return;

  // Get theme bingo color from computed style
  const bingoColor = getComputedStyle(document.body).getPropertyValue('--bingo').trim() || '#ffee00';
  const colors = [bingoColor, '#ffffff', '#ff007f', '#00ffff', '#a020ff'];

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const particles = [];
  const PARTICLES_PER_CELL = _isMobile() ? 20 : 80;
  const GRAVITY = 0.25;
  const FRICTION = 0.96;

  origins.forEach(o => {
    for (let i = 0; i < PARTICLES_PER_CELL; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: o.x + (Math.random() - 0.5) * o.size * 0.5,
        y: o.y + (Math.random() - 0.5) * o.size * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.8 + Math.random() * 0.2,
        decay: 0.008 + Math.random() * 0.012,
        shape: Math.random() > 0.5 ? 'circle' : 'square'
      });
    }
  });

  let running = true;
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    let alive = false;
    for (const p of particles) {
      if (p.alpha <= 0) continue;
      alive = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += GRAVITY;
      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.alpha -= p.decay;
      p.size *= 0.995;

      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }

    ctx.globalAlpha = 1;

    if (alive) {
      requestAnimationFrame(draw);
    } else {
      running = false;
      canvas.remove();
    }
  }

  requestAnimationFrame(draw);

  // Safety cleanup
  setTimeout(() => {
    if (running) {
      running = false;
      canvas.remove();
    }
  }, 4000);
}

let _bingoMode = false;

/**
 * Toggle background particles.js intensity for bingo mode.
 * When active, increases particle count and speed.
 */
export function setBingoMode(active) {
  if (_bingoMode === active) return;
  _bingoMode = active;

  // Skip dynamic particle mutations on mobile/lite since we use CSS particles there
  if (_isMobile() || _isLiteMode()) return;

  if (!window.pJSDom || !window.pJSDom.length) return;
  const pJS = window.pJSDom[0].pJS;
  if (!pJS) return;

  if (active) {
    const maxBingo = Math.min(PARTICLE_LIMITS.maxParticlesBingo, _calcMaxParticles() * 2);
    pJS.particles.number.value = Math.min(pJS.particles.number.value * 2.5, maxBingo);
    pJS.particles.move.speed = pJS.particles.move.speed * 1.8;
    pJS.particles.size.value = pJS.particles.size.value * 1.3;
    pJS.particles.opacity.value = Math.min(pJS.particles.opacity.value * 1.4, 0.9);
  } else {
    // Re-apply normal theme to restore defaults
    const theme = document.body.getAttribute('data-theme') || 'twice';
    applyParticleTheme(theme);
  }
}

function _clearCssParticles(container) {
  if (!container) return;
  container.querySelectorAll('.css-particle').forEach(el => el.remove());
}

function _injectCssParticles(container, themeName) {
  if (!container) return;
  _clearCssParticles(container);
  const options = PARTICLE_THEME_OPTIONS[themeName] || PARTICLE_THEME_OPTIONS.twice;
  const colors = options?.particles?.color?.value || ['#ffffff'];
  const count = 15;
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
    container.appendChild(el);
  }
}

export function applyParticleTheme(name) {
  const container = document.getElementById('tsparticles');
  const base = PARTICLE_THEME_OPTIONS[name] || PARTICLE_THEME_OPTIONS.twice;

  if (_isMobile() || _isLiteMode()) {
    if (window.pJSDom && window.pJSDom.length) {
      for (const item of window.pJSDom) {
        if (item?.pJS?.fn?.vendors?.destroypJS) {
          item.pJS.fn.vendors.destroypJS();
        }
      }
      window.pJSDom = [];
    }
    _injectCssParticles(container, name);
    return;
  }

  _clearCssParticles(container);

  const options = _clampParticleOptions(base);
  if (window.particlesJS) {
    if (window.pJSDom && window.pJSDom.length) {
      for (const item of window.pJSDom) {
        if (item?.pJS?.fn?.vendors?.destroypJS) {
          item.pJS.fn.vendors.destroypJS();
        }
      }
      window.pJSDom = [];
    }
    window.particlesJS('tsparticles', options);
  }
}

let _resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    const theme = document.body.getAttribute('data-theme') || 'twice';
    applyParticleTheme(theme);
    _rebuildCellCache();
    updateLinePositions();
    if (_bingoMode) {
      setBingoMode(true);
    }
  }, 300);
});
