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

export function drawBingoLines(keys) {
  const svg = document.getElementById('bingoLines');
  const grid = document.getElementById('bingoGrid');
  if (!svg || !grid) return;

  const cells = grid.querySelectorAll('.cell');
  if (cells.length === 0) return;

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
  for (let i = 0; i < 70; i++) {
    setTimeout(() => {
      const c = document.createElement('div');
      c.className = 'confetti-piece';
      c.style.cssText = `left:${Math.random() * 100}vw; width:${6 + Math.random() * 8}px; height:${6 + Math.random() * 8}px; background:${colors[Math.floor(Math.random() * colors.length)]}; animation-duration:${1.5 + Math.random() * 2.5}s;`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }, i * 15);
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
