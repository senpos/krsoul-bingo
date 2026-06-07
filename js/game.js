import { PARTICLE_THEME_OPTIONS } from './config.js';

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

let _lastDrawnKeys = [];

export function drawBingoLines(keys) {
  const svg = document.getElementById('bingoLines');
  const grid = document.getElementById('bingoGrid');
  if (!svg || !grid) return;

  const cells = grid.querySelectorAll('.cell');
  if (cells.length === 0) return;

  const sortedKeys = [...keys].sort();
  if (sortedKeys.length === _lastDrawnKeys.length && sortedKeys.every((k, i) => k === _lastDrawnKeys[i])) {
    return;
  }
  _lastDrawnKeys = sortedKeys;

  const wrapperRect = svg.getBoundingClientRect();
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const keySet = new Set(keys);
  keySet.forEach(k => {
    const indices = k.split(',').map(Number);
    const first = cells[indices[0]];
    const last = cells[indices[indices.length - 1]];
    if (!first || !last) return;

    const r1 = first.getBoundingClientRect();
    const r2 = last.getBoundingClientRect();

    const x1 = r1.left + r1.width / 2 - wrapperRect.left;
    const y1 = r1.top + r1.height / 2 - wrapperRect.top;
    const x2 = r2.left + r2.width / 2 - wrapperRect.left;
    const y2 = r2.top + r2.height / 2 - wrapperRect.top;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'bingo-line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);

    const length = Math.hypot(x2 - x1, y2 - y1);
    line.style.strokeDasharray = length;
    line.style.setProperty('--line-length', length);

    svg.appendChild(line);
  });
}

export function launchConfetti() {
  const colors = ['#ff007f', '#00ffff', '#ffee00', '#5500ff', '#ffffff', '#ff0055'];
  for (let i = 0; i < 140; i++) {
    setTimeout(() => {
      const c = document.createElement('div');
      c.className = 'confetti-piece';
      c.style.cssText = `left:${Math.random() * 100}vw; width:${6 + Math.random() * 8}px; height:${6 + Math.random() * 8}px; background:${colors[Math.floor(Math.random() * colors.length)]}; animation-duration:${1.5 + Math.random() * 2.5}s;`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }, i * 15);
  }
}

/**
 * Spawn a burst of particles at the center of each bingo cell.
 * Creates a temporary canvas overlay that is removed after animation.
 */
export function bingoCellBurst(indices) {
  const grid = document.getElementById('bingoGrid');
  if (!grid) return;

  const cells = grid.querySelectorAll('.cell');
  const origins = [];
  indices.forEach(i => {
    const cell = cells[i];
    if (!cell) return;
    const r = cell.getBoundingClientRect();
    origins.push({
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      size: Math.min(r.width, r.height)
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
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const particles = [];
  const PARTICLES_PER_CELL = 80;
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

  if (!window.pJSDom || !window.pJSDom.length) return;
  const pJS = window.pJSDom[0].pJS;
  if (!pJS) return;

  if (active) {
    // Boost particles
    pJS.particles.number.value = Math.min(pJS.particles.number.value * 2.5, 300);
    pJS.particles.move.speed = pJS.particles.move.speed * 1.8;
    pJS.particles.size.value = pJS.particles.size.value * 1.3;
    pJS.particles.opacity.value = Math.min(pJS.particles.opacity.value * 1.4, 0.9);
  } else {
    // Re-apply normal theme to restore defaults
    const theme = document.body.getAttribute('data-theme') || 'twice';
    applyParticleTheme(theme);
  }
}

export function applyParticleTheme(name) {
  const options = PARTICLE_THEME_OPTIONS[name] || PARTICLE_THEME_OPTIONS.twice;
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
