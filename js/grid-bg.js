(function () {
  'use strict';

  if (window.__gridBg) return;            // never run twice on one page
  window.__gridBg = true;

  // Site root, worked out from this script's own URL (works from /, /lessons/unit1/, etc.)
  const BASE = (document.currentScript ? document.currentScript.src : '').replace(/js\/grid-bg\.js.*$/, '');

  // Reuse the markup if it is already in the page (index.html), otherwise create it
  let canvas = document.getElementById('gridCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'gridCanvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
  }
  let box = document.getElementById('gridMascot');
  if (!box) {
    box = document.createElement('div');
    box.id = 'gridMascot';
    box.setAttribute('aria-hidden', 'true');
    ['lex', 'merkie'].forEach((name) => {
      const img = new Image();
      img.src = BASE + 'assets/photo/' + name + '.png';
      img.alt = '';
      img.onerror = () => { img.style.visibility = 'hidden'; };
      box.appendChild(img);
    });
    document.body.prepend(box);
  }
  const mascots = box.querySelectorAll('img');
  const ctx = canvas.getContext('2d');

  /* ---------- Settings ---------- */
  const CELL = 28;                 // grid square size (px)
  const GRAVITY = 0.5;
  const BOUNCE = 0.3;
  const BLOCK_LIFE = 360;          // frames a landed block stays before fading (~6s)
  const FADE = 60;                 // frames to fade out
  const MAX_BLOCKS = 250;
  const TRAIL_FADE = 0.035;        // lower = longer trail
  const COLORS = [
    { fill: '#2ea043', edge: '#3fb950' }, // green
    { fill: '#14abe3', edge: '#6fd3f7' }, // cyan (matches your --cy)
    { fill: '#f59e0b', edge: '#fbbf24' }, // orange
    { fill: '#a855f7', edge: '#c084fc' }, // purple
    { fill: '#ff5a6e', edge: '#ff8a98' }  // red (matches your --rd)
  ];
  // Don't spawn blocks when clicking these (so links/buttons feel normal)
  const IGNORE = 'a, button, input, textarea, select, summary, label';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- State ---------- */
  let W = 0, H = 0, cols = 0, rows = 0, dpr = 1;
  let stackCount = [];             // how many settled blocks per column
  const blocks = [];
  const trail = new Map();         // "col,row" -> intensity 0..1
  let hover = { c: -1, r: -1 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / CELL);
    rows = Math.ceil(H / CELL);
    stackCount = new Array(cols).fill(0);
    blocks.length = 0;
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- Falling blocks ---------- */
  function spawnBlock(x, y) {
    if (reduceMotion) return;
    const col = Math.floor(x / CELL);
    if (col < 0 || col >= cols) return;
    if (blocks.length >= MAX_BLOCKS) blocks.shift();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    blocks.push({
      col,
      y: Math.floor(y / CELL) * CELL,
      vy: -2 - Math.random() * 2,     // small upward pop, then it falls
      color,
      settled: false,
      age: 0
    });
  }

  function updateBlocks() {
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      if (b.settled) {
        b.age++;
        if (b.age > BLOCK_LIFE + FADE) {
          stackCount[b.col] = Math.max(0, stackCount[b.col] - 1);
          blocks.splice(i, 1);
        }
        continue;
      }
      b.vy += GRAVITY;
      b.y += b.vy;
      const floorY = H - (stackCount[b.col] + 1) * CELL;   // top of the pile in this column
      if (b.y >= floorY) {
        b.y = floorY;
        b.vy = -b.vy * BOUNCE;
        if (Math.abs(b.vy) < 1) {
          b.vy = 0;
          b.settled = true;
          stackCount[b.col]++;
        }
      }
    }
  }

  function drawBlock(b) {
    let alpha = 1;
    if (b.settled && b.age > BLOCK_LIFE) alpha = 1 - (b.age - BLOCK_LIFE) / FADE;
    ctx.globalAlpha = Math.max(alpha, 0);
    ctx.fillStyle = b.color.fill;
    ctx.strokeStyle = b.color.edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(b.col * CELL + 1, b.y + 1, CELL - 2, CELL - 2, 4);
    else ctx.rect(b.col * CELL + 1, b.y + 1, CELL - 2, CELL - 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* ---------- Render loop ---------- */
  function drawGrid() {
    ctx.strokeStyle = 'rgba(120, 190, 240, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += CELL) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
    for (let y = 0; y <= H; y += CELL) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();
  }

  function drawTrail() {
    trail.forEach((v, key) => {
      const [c, r] = key.split(',').map(Number);
      ctx.fillStyle = 'rgba(20, 171, 227,' + (v * 0.28) + ')';
      ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      v -= TRAIL_FADE;
      if (v <= 0) trail.delete(key); else trail.set(key, v);
    });
    if (hover.c >= 0) {
      ctx.strokeStyle = 'rgba(111, 211, 247, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hover.c * CELL + 1, hover.r * CELL + 1, CELL - 2, CELL - 2);
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);       // transparent: your page background shows through
    drawGrid();
    drawTrail();
    updateBlocks();
    blocks.forEach(drawBlock);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Mouse interactions (listen on window, canvas ignores pointer) ---------- */
  window.addEventListener('pointermove', (e) => {
    const c = Math.floor(e.clientX / CELL);
    const r = Math.floor(e.clientY / CELL);
    if (c !== hover.c || r !== hover.r) {
      hover = { c, r };
      trail.set(c + ',' + r, 1);
    }
    trackMascot(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest(IGNORE)) return;
    spawnBlock(e.clientX, e.clientY);
  }, { passive: true });

  /* ---------- Mascot tracks the cursor (Math.atan2) ---------- */
  function trackMascot(mx, my) {
    mascots.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mx - cx;
      const dy = my - cy;

      const angle = Math.atan2(dy, dx);                       // direction to the cursor
      const maxDist = Math.max(window.innerWidth, window.innerHeight) / 2;
      const strength = Math.min(Math.hypot(dx, dy), maxDist) / maxDist; // 0..1

      const tx = Math.cos(angle) * 8 * strength;              // slide toward cursor
      const ty = Math.sin(angle) * 5 * strength;
      const rot = Math.cos(angle) * 16 * strength;            // tilt toward cursor

      img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) rotate(' + rot + 'deg)';
    });
  }
})();
