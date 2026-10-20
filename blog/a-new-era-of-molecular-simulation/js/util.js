/* Shared helpers for slide animations: seeded RNG, colours, easing, canvas surface, drawing primitives. */
(function () {
  'use strict';

  // ---------- seeded random numbers ----------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) {
    const u = mulberry32(seed || 1);
    let spare = null;
    const r = {
      u: u,
      uniform: (a, b) => a + (b - a) * u(),
      int: (n) => Math.floor(u() * n),
      normal: () => {
        if (spare !== null) { const s = spare; spare = null; return s; }
        let x, y, s;
        do { x = 2 * u() - 1; y = 2 * u() - 1; s = x * x + y * y; } while (s >= 1 || s === 0);
        const m = Math.sqrt(-2 * Math.log(s) / s);
        spare = y * m; return x * m;
      },
      pick: (arr) => arr[Math.floor(u() * arr.length)],
      shuffle: (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
    };
    return r;
  }

  // ---------- palette (matched to ATLAS / JANUS paper figures) ----------
  const C = {
    bg: '#FAF8F3', card: '#FFFFFF', ink: '#1F2933', inkSoft: '#52606D', muted: '#9AA5B1', faint: '#D9DEE3', grid: '#ECEFF2',
    navy: '#1D3A5F', teal: '#2A9D8F', tealDark: '#1F7A6F', blue: '#4C72B0', blueSoft: '#7B9CD0', kaA: '#4F74B3', kaB: '#F0A23A',
    orange: '#F0A23A', coral: '#E76F51', red: '#D1495B', yellow: '#E9C46A', violet: '#6B5E9B', mask: '#A99BD6', maskDark: '#8A7CC0',
    copper: '#C8692E', steel: '#8E9AA6', green: '#5BA65B', pink: '#D16BA5', gold: '#D9A21B'
  };
  function hexToRgb(hex) {
    if (hex.startsWith('rgb')) { const m = hex.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2]]; }
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }
  function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function mix(h1, h2, t) {
    const a = hexToRgb(h1), b = hexToRgb(h2);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  // ---------- easing ----------
  const E = {
    clamp: (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)),
    lin: (t) => t,
    smooth: (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); },
    smoother: (t) => { t = Math.max(0, Math.min(1, t)); return t * t * t * (t * (6 * t - 15) + 10); },
    inOut: (t) => { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    out: (t) => { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3); },
    seg: (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)))
  };

  // ---------- canvas surface ----------
  // Logical size comes from the canvas width/height attributes (stage pixels, 1920x1080 space).
  function surface(canvas) {
    const w = +canvas.getAttribute('width'), h = +canvas.getAttribute('height');
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    const s = { canvas, ctx, w, h, k: 1 };
    s.resize = function (stageScale) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const k = Math.max(0.5, stageScale * dpr);
      s.k = k;
      canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
    };
    s.clear = function (color) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (color) { ctx.fillStyle = color; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(s.k, 0, 0, s.k, 0, 0);
    };
    return s;
  }

  // ---------- drawing primitives ----------
  const FONT = '"Inter Variable", "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';
  const SERIF = '"Source Serif 4 Variable", "Source Serif 4", Georgia, serif';
  function font(px, weight = 500, italic = false, family = FONT) { return `${italic ? 'italic ' : ''}${weight} ${px}px ${family}`; }
  function circle(ctx, x, y, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }
  // shaded "atom" sphere look (soft highlight)
  function atom(ctx, x, y, r, color, alpha = 1, rim = true) {
    ctx.save(); ctx.globalAlpha *= alpha;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, mix(color, '#FFFFFF', 0.45)); g.addColorStop(0.55, color); g.addColorStop(1, mix(color, '#000000', 0.18));
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    if (rim) { ctx.lineWidth = Math.max(0.6, r * 0.08); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke(); }
    ctx.restore();
  }
  function flatAtom(ctx, x, y, r, color, alpha = 1, rimColor = 'rgba(255,255,255,0.9)') {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = Math.max(0.8, r * 0.1); ctx.strokeStyle = rimColor; ctx.stroke();
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r, fill, stroke, lw, dash) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.restore(); }
  }
  function arrow(ctx, x1, y1, x2, y2, color, lw = 2, head = 10, dash) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42));
    ctx.lineTo(x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42));
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function curvedArrow(ctx, pts, color, lw = 2.5, head = 12, dash) {
    // pts: [x0,y0, cx,cy, x1,y1] quadratic
    const [x0, y0, cx, cy, x1, y1] = pts;
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    const a = Math.atan2(y1 - cy, x1 - cx);
    const ex = x1 - Math.cos(a) * head * 0.6, ey = y1 - Math.sin(a) * head * 0.6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - head * Math.cos(a - 0.42), y1 - head * Math.sin(a - 0.42));
    ctx.lineTo(x1 - head * Math.cos(a + 0.42), y1 - head * Math.sin(a + 0.42));
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function text(ctx, str, x, y, opts = {}) {
    ctx.save();
    ctx.font = opts.font || font(opts.size || 22, opts.weight || 500, opts.italic, opts.family || FONT);
    ctx.fillStyle = opts.color || C.ink; ctx.textAlign = opts.align || 'left'; ctx.textBaseline = opts.baseline || 'alphabetic';
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    if (opts.maxWidth) ctx.fillText(str, x, y, opts.maxWidth); else ctx.fillText(str, x, y);
    ctx.restore();
  }
  // render "x_t"-style labels with simple subscript support: parts = [[str, 'n'|'sub'|'sup'|'i'], ...]
  function richText(ctx, parts, x, y, opts = {}) {
    const size = opts.size || 22, color = opts.color || C.ink, weight = opts.weight || 500;
    ctx.save(); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
    let total = 0;
    const meas = parts.map(([s, kind]) => {
      const sz = (kind === 'sub' || kind === 'sup') ? size * 0.68 : size;
      ctx.font = font(sz, weight, kind === 'i' || kind === 'sub' || kind === 'sup' ? !!opts.italicSub || kind === 'i' : false, kind === 'i' ? SERIF : FONT);
      if (kind === 'i') ctx.font = font(sz, 500, true, SERIF);
      const w = ctx.measureText(s).width; total += w; return { s, kind, sz, w, f: ctx.font };
    });
    let cx = opts.align === 'center' ? x - total / 2 : opts.align === 'right' ? x - total : x;
    for (const m of meas) {
      ctx.font = m.f; ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
      const dy = m.kind === 'sub' ? size * 0.28 : m.kind === 'sup' ? -size * 0.42 : 0;
      ctx.fillText(m.s, cx, y + dy); cx += m.w;
    }
    ctx.restore();
    return total;
  }
  function wiggle(seed, t, amp = 1) { // smooth pseudo-random signal
    return amp * (Math.sin(2.1 * t + seed * 1.7) * 0.5 + Math.sin(3.7 * t + seed * 4.1) * 0.3 + Math.sin(6.3 * t + seed * 2.3) * 0.2);
  }
  function wrap01(x) { return x - Math.floor(x); }
  function minImage(d) { return d - Math.round(d); }

  // Lennard-Jones forces for 2D Kob-Andersen configurations (fractional coords in [0,1), box L)
  const KA_EPS = [[1.0, 1.5], [1.5, 0.5]], KA_SIG = [[1.0, 0.8], [0.8, 0.88]];
  function kaForces(xs, types, L) {
    const n = types.length, F = new Float64Array(2 * n);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let dx = minImage(xs[2 * i] - xs[2 * j]) * L, dy = minImage(xs[2 * i + 1] - xs[2 * j + 1]) * L;
      const r2 = dx * dx + dy * dy, s = KA_SIG[types[i]][types[j]], e = KA_EPS[types[i]][types[j]];
      if (r2 > 6.25 * s * s) continue;
      const inv = s * s / r2, inv3 = inv * inv * inv, inv6 = inv3 * inv3;
      const f = 24 * e * (2 * inv6 - inv3) / r2;
      F[2 * i] += f * dx; F[2 * i + 1] += f * dy; F[2 * j] -= f * dx; F[2 * j + 1] -= f * dy;
    }
    return F;
  }

  window.U = { makeRng, C, rgba, mix, hexToRgb, E, surface, font, FONT, SERIF, circle, atom, flatAtom, roundRect, arrow, curvedArrow, text, richText, wiggle, wrap01, minImage, kaForces };
  window.ANIMS = window.ANIMS || {};
})();
