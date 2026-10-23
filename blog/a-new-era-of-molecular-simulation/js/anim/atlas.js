/* ATLAS animations: crystal vs glass, size transfer, evaluation bars, umbrella windows, agentic design loop, composition-amortized training. */
(function () {
  'use strict';
  const { C, rgba, mix, E, atom, flatAtom, roundRect, arrow, curvedArrow, text, richText, font, makeRng, wiggle, wrap01, minImage } = U;

  function drawConfig(ctx, cfg, x, y, size, opts = {}) {
    const L = cfg.L, sig = size / L, rA = (opts.rA || 0.47) * sig, rB = (opts.rB || 0.36) * sig, N = cfg.N, t = opts.t === undefined ? 1 : opts.t;
    const idx = []; for (let i = 0; i < N; i++) idx.push(i); idx.sort((a, b) => cfg.t[a] - cfg.t[b]);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
    for (const i of idx) {
      let px = cfg.x[2 * i], py = cfg.x[2 * i + 1];
      if (opts.jig) { px += opts.jig * wiggle(i * 1.3, opts.clock * 3); py += opts.jig * wiggle(i * 2.1 + 5, opts.clock * 3); }
      if (opts.from) { const fx = opts.from[2 * i], fy = opts.from[2 * i + 1]; px = fx + minImage(px - fx) * t; py = fy + minImage(py - fy) * t; }
      px = wrap01(px); py = wrap01(py);
      const r = cfg.t[i] ? rB : rA, col = cfg.t[i] ? C.kaB : C.kaA;
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        const X = x + (px + ox) * size, Y = y + (py + oy) * size;
        if (X < x - r || X > x + size + r || Y < y - r || Y > y + size + r) continue;
        if (opts.flat) flatAtom(ctx, X, Y, r, col); else atom(ctx, X, Y, r, col);
      }
    }
    ctx.restore();
    roundRect(ctx, x, y, size, size, 4, null, rgba(C.inkSoft, 0.55), 1.8);
  }

  // ------------------------------------------------------------------
  ANIMS.glassVsCrystal = function (S, o) {
    const ctx = S.ctx; let clock = 0;
    const g = KA_DATA['n64_T0.2'];
    const box = 400, Lx = 30, Rx = S.w - box - 30, Y = 30;
    const tag = (() => { let b = 0, bd = 9; for (let i = 0; i < g.N; i++) { const d = (g.x[2 * i] - 0.5) ** 2 + (g.x[2 * i + 1] - 0.5) ** 2; if (g.t[i] === 1 && d < bd) { bd = d; b = i; } } return b; })();
    function draw() {
      S.clear();
      // crystal: ordered binary lattice
      roundRect(ctx, Lx, Y, box, box, 4, '#fff', rgba(C.inkSoft, 0.55), 1.8);
      const n = 8, a = box / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const isB = (i + j) % 2 === 1 && (i % 2 === 0);
        const x = Lx + (i + 0.5) * a + 2.2 * wiggle(i * 7 + j, clock * 3.4), y = Y + (j + 0.5) * a + 2.2 * wiggle(i * 3 + j * 11 + 4, clock * 3.4);
        atom(ctx, x, y, isB ? a * 0.36 : a * 0.45, isB ? C.kaB : C.kaA);
      }
      // glass: real 2D Kob-Andersen configuration (T = 0.2)
      ctx.save();
      drawConfig(ctx, g, Rx, Y, box, { jig: 0.006, clock });
      // rattling tagged particle in its cage
      const L = g.L, s = box / L; const px = Rx + wrap01(g.x[2 * tag]) * box, py = Y + wrap01(g.x[2 * tag + 1]) * box;
      ctx.setLineDash([5, 5]); ctx.strokeStyle = rgba(C.coral, 0.85); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(px, py, 1.25 * s, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      text(ctx, 'crystal', Lx + box / 2, Y + box + 44, { size: 27, weight: 650, color: C.ink, align: 'center' });
      text(ctx, 'one ordered ground state', Lx + box / 2, Y + box + 76, { size: 21, color: C.inkSoft, align: 'center' });
      text(ctx, 'amorphous (glass)', Rx + box / 2, Y + box + 44, { size: 27, weight: 650, color: C.ink, align: 'center' });
      text(ctx, 'an ensemble of caged, metastable structures', Rx + box / 2, Y + box + 76, { size: 21, color: C.inkSoft, align: 'center' });
      // landscape icons
      const iy = Y + box + 100, iw = 220, ih = 54;
      ctx.lineWidth = 3; ctx.strokeStyle = C.blue;
      ctx.beginPath(); for (let k = 0; k <= 60; k++) { const u = k / 60, x = Lx + box / 2 - iw / 2 + u * iw, y = iy + ih * (1 - Math.exp(-((u - 0.5) ** 2) / 0.03)); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
      ctx.beginPath(); for (let k = 0; k <= 120; k++) { const u = k / 120, x = Rx + box / 2 - iw / 2 + u * iw, y = iy + ih * (0.55 + 0.3 * Math.sin(u * 23) + 0.15 * Math.sin(u * 51 + 1)); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
    }
    return { frame(dt) { clock += dt; draw(); }, draw };
  };

  // ------------------------------------------------------------------
  ANIMS.sizeTransfer = function (S, o) {
    const ctx = S.ctx, rng = makeRng(2); let clock = 0;
    const small = KA_DATA['n64_T0.5'], bigs = ['n128_T0.5', 'n256_T0.5', 'n512_T0.5'].map(k => KA_DATA[k]);
    const SB = 160, BB = 430, sx = 10, sy = 170, bx = S.w - BB - 10, by = 40;
    let froms = bigs.map(b => { const a = new Float64Array(2 * b.N); for (let i = 0; i < a.length; i++) a[i] = rng.u(); return a; });
    const per = 3.6;
    function draw() {
      S.clear();
      drawConfig(ctx, small, sx, sy, SB, { jig: 0.004, clock, flat: true });
      text(ctx, 'trained', sx + SB / 2, sy - 44, { size: 22, color: C.inkSoft, align: 'center' });
      text(ctx, 'N = 64', sx + SB / 2, sy - 14, { size: 27, weight: 700, color: C.navy, align: 'center' });
      arrow(ctx, sx + SB + 14, sy + SB / 2, bx - 14, sy + SB / 2, C.teal, 3.5, 14);
      text(ctx, 'no', (sx + SB + bx) / 2, sy + SB / 2 - 38, { size: 20, color: C.tealDark, align: 'center', weight: 600 });
      text(ctx, 'retraining', (sx + SB + bx) / 2, sy + SB / 2 - 14, { size: 20, color: C.tealDark, align: 'center', weight: 600 });
      const i = Math.floor(clock / per) % bigs.length, u = (clock % per) / per, cfg = bigs[i];
      const t = E.inOut(E.clamp(u / 0.45));
      drawConfig(ctx, cfg, bx, by, BB, { from: froms[i], t, flat: true });
      text(ctx, `generated  N = ${cfg.N}`, bx + BB / 2, by + BB + 40, { size: 27, weight: 700, color: C.navy, align: 'center' });
      if (t > 0.98) {
        const sc = BB / cfg.L, cx = bx + BB * 0.5, cy = by + BB * 0.5;
        ctx.save(); ctx.fillStyle = rgba(C.teal, 0.12); ctx.strokeStyle = C.teal; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 2.5 * sc, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
        text(ctx, 'local cutoff', cx, cy - 2.5 * sc - 12, { size: 18, color: C.tealDark, align: 'center', weight: 650 });
      }
      text(ctx, 'local message passing: the same rules at any system size', sx, S.h - 24, { size: 19, color: C.inkSoft });
    }
    return { frame(dt) { const before = Math.floor(clock / per); clock += dt; if (Math.floor(clock / per) !== before) { const j = Math.floor(clock / per) % bigs.length; const a = froms[j]; for (let k = 0; k < a.length; k++) a[k] = rng.u(); } draw(); }, draw, ff: 2 * per + 0.8 * per };
  };

  // ------------------------------------------------------------------
  // Fig. 2e (ATLAS paper) redrawn: free-energy error and number of target-energy evaluations at T = 0.2
  // ------------------------------------------------------------------
  ANIMS.evalBars = function (S, o) {
    const ctx = S.ctx; let clock = 0;
    const labels = ['PT-MCMC\n(coarse)', 'PT-MCMC\n(dense)', 'ATLAS'];
    const err = [3e-4, 1e-4, 2e-3], ev = [2e8, 3e8, 4e5];
    const cols = ['#A7AEB6', '#3B4249', C.teal];
    function chart(x, y, w, h, vals, lo, hi, title) {
      text(ctx, title, x + w / 2, y - 22, { size: 22, weight: 650, color: C.ink, align: 'center' });
      const ly = (v) => y + h - (Math.log10(v) - lo) / (hi - lo) * h;
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
      for (let p = lo; p <= hi; p++) { const yy = ly(Math.pow(10, p)); ctx.strokeStyle = rgba(C.inkSoft, 0.12); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); richText(ctx, [['10', 'n'], [String(p), 'sup']], x - 10, yy + 7, { size: 18, color: C.muted, align: 'right' }); }
      const bw = w / 3 * 0.56, tops = [];
      vals.forEach((v, i) => {
        const g = E.out(E.clamp((clock - 0.3 * i) / 1.2)); const top = ly(Math.pow(10, lo + (Math.log10(v) - lo) * g));
        const bx = x + (i + 0.5) * w / 3 - bw / 2; roundRect(ctx, bx, top, bw, y + h - top, 5, cols[i]); tops.push([bx + bw / 2, top]);
        if (g > 0.95) { const e = Math.floor(Math.log10(v) + 1e-9), m = v / Math.pow(10, e); richText(ctx, [[(m === 1 ? '' : m.toFixed(0) + ' × ') + '10', 'n'], [String(e), 'sup']], bx + bw / 2, top - 10, { size: 20, color: i === 2 ? C.tealDark : C.ink, align: 'center', weight: 650 }); }
        labels[i].split('\n').forEach((s2, li) => text(ctx, s2, bx + bw / 2, y + h + 28 + li * 22, { size: 18, color: i === 2 ? C.tealDark : C.inkSoft, align: 'center', weight: i === 2 ? 700 : 500 }));
      });
      return tops;
    }
    function draw() {
      S.clear();
      chart(90, 60, 300, 290, err, -5, -2, 'rel. free-energy error');
      const tops = chart(530, 60, 300, 290, ev, 5, 9, 'target-energy evaluations');
      const a = E.clamp((clock - 1.8) / 0.6);
      if (a > 0) {
        ctx.save(); ctx.globalAlpha = a;
        const [x1, y1] = tops[1], [x2, y2] = tops[2];
        ctx.strokeStyle = C.teal; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(x1 + 30, y1); ctx.lineTo(x2 + 44, y1); ctx.stroke(); ctx.setLineDash([]);
        arrow(ctx, x2 + 44, y1, x2 + 44, y2 - 34, C.teal, 2.5, 11);
        roundRect(ctx, 600, 410, 200, 46, 23, rgba(C.teal, 0.12), C.teal, 2);
        text(ctx, '≥ 500× fewer', 700, 442, { size: 24, color: C.tealDark, align: 'center', weight: 750 });
        ctx.restore();
      }
    }
    let lastStep = -1;
    return {
      frame(dt) { clock += dt; draw(); }, draw, enter() { clock = 0; },
      step(k) { const st = o.startStep || 0; if (k >= st && lastStep < st) clock = 0; lastStep = k; }
    };
  };

  // ------------------------------------------------------------------
  // Umbrella windows as tilted ensembles -> stitched potential of mean force (schematic)
  // ------------------------------------------------------------------
  ANIMS.umbrella = function (S, o) {
    const ctx = S.ctx; let clock = 0;
    const X0 = 90, X1 = S.w - 30, Y0 = 40, Y1 = S.h - 170, HB = S.h - 70;
    const lo = 0.8, hi = 2.4;
    const F = (x) => 3.5 + 0.55 * Math.exp(-((x - 1.33) ** 2) / (2 * 0.13 ** 2)) - 3.5 * Math.exp(-((x - 0.92) ** 2) / (2 * 0.08 ** 2)) - 1.9 * Math.exp(-((x - 1.97) ** 2) / (2 * 0.15 ** 2)) - 0.7 * Math.exp(-((x - 1.62) ** 2) / (2 * 0.09 ** 2)) - 0.6 * Math.exp(-((x - 2.33) ** 2) / (2 * 0.07 ** 2)) + 60 * Math.max(0, 0.86 - x) ** 2;
    const fx = (x) => X0 + (x - lo) / (hi - lo) * (X1 - X0), fy = (v) => Y1 - Math.min(5, v) / 5 * (Y1 - Y0);
    const nW = 8, kap = 220, centers = []; for (let k = 0; k < nW; k++) centers.push(0.9 + k * (2.33 - 0.9) / (nW - 1));
    const colors = [C.teal, C.gold, C.coral, C.blue, C.violet, C.teal, C.gold, C.coral];
    const dtW = 0.6;
    function draw() {
      S.clear();
      ctx.strokeStyle = rgba(C.inkSoft, 0.45); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.lineTo(X1, Y1); ctx.stroke();
      richText(ctx, [['F', 'i'], ['(', 'n'], ['ξ', 'i'], [')', 'n']], X0 - 14, Y0 + 14, { size: 24, color: C.ink, align: 'right' });
      // true landscape (faint, dashed): what we want to recover
      ctx.save(); ctx.setLineDash([7, 7]); ctx.strokeStyle = rgba(C.muted, 0.9); ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = lo + (hi - lo) * i / 200; if (i) ctx.lineTo(fx(x), fy(F(x))); else ctx.moveTo(fx(x), fy(F(x))); } ctx.stroke(); ctx.restore();
      const nOn = Math.min(nW, Math.floor(clock / dtW) + 1);
      // window histograms (biased ensembles) in the strip below
      ctx.strokeStyle = rgba(C.inkSoft, 0.35); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X0, HB); ctx.lineTo(X1, HB); ctx.stroke();
      for (let k = 0; k < nOn; k++) {
        const c = centers[k], grow = E.out(E.clamp((clock - k * dtW) / dtW)); let mx = 0; const vals = [];
        for (let i = 0; i <= 160; i++) { const x = lo + (hi - lo) * i / 160; const v = Math.exp(-F(x) - 0.5 * kap * (x - c) ** 2); vals.push(v); mx = Math.max(mx, v); }
        ctx.beginPath(); ctx.moveTo(fx(lo), HB); vals.forEach((v, i) => ctx.lineTo(fx(lo + (hi - lo) * i / 160), HB - v / mx * 70 * grow)); ctx.lineTo(fx(hi), HB); ctx.closePath();
        ctx.fillStyle = rgba(colors[k], 0.3); ctx.fill(); ctx.strokeStyle = rgba(colors[k], 0.85); ctx.lineWidth = 1.5; ctx.stroke();
        // stitched estimate over the window's support, drawn as the window completes
        const a = E.clamp((clock - k * dtW - 0.25) / 0.4);
        if (a > 0) {
          ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.navy; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
          const a0 = k === 0 ? lo + 0.02 : (centers[k - 1] + c) / 2, a1 = k === nW - 1 ? hi : (centers[k + 1] + c) / 2;
          for (let i = 0; i <= 30; i++) { const x = a0 + (a1 - a0) * i / 30; if (i) ctx.lineTo(fx(x), fy(F(x))); else ctx.moveTo(fx(x), fy(F(x))); }
          ctx.stroke(); ctx.restore();
        }
      }
      if (clock > nW * dtW + 0.6) {
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = C.coral; ctx.lineWidth = 2; const xb = fx(1.33); ctx.beginPath(); ctx.moveTo(fx(0.92), fy(F(0.92))); ctx.lineTo(xb + 30, fy(F(0.92))); ctx.moveTo(xb, fy(F(0.92))); ctx.lineTo(xb, fy(F(1.33))); ctx.stroke(); ctx.restore();
        richText(ctx, [['Δ', 'n'], ['F', 'i'], ['‡', 'sup']], fx(1.33) + 12, fy(2.1), { size: 28, color: C.coral });
      }
      text(ctx, 'ξ  (collective variable) →', X1, Y1 - 12, { size: 20, color: C.inkSoft, align: 'right' });
      text(ctx, 'umbrella windows: tilted targets, each sampled by SMC steering', X0, HB + 34, { size: 19, color: C.inkSoft });
      text(ctx, '— stitched PMF', X1, Y0 + 14, { size: 20, color: C.navy, align: 'right', weight: 650 });
      text(ctx, '- - reference', X1, Y0 + 40, { size: 19, color: C.muted, align: 'right' });
    }
    return { frame(dt) { clock += dt; if (clock > nW * dtW + 4) clock = 0; draw(); }, draw, ff: nW * dtW + 1.5 };
  };

  // ------------------------------------------------------------------
  // Agentic design loop: LLM agent proposes compositions, ATLAS jobs run asynchronously, Pareto front grows (schematic)
  // ------------------------------------------------------------------
  ANIMS.agentLoop = function (S, o) {
    const ctx = S.ctx, rng = makeRng(31); let clock = 0;
    const pool = o.pool || ['Fe', 'Mn', 'Ni', 'Ti', 'Cu', 'Cr', 'Co', 'Al'];
    const elCol = { Fe: '#3E7CB1', Mn: '#2BA084', Ni: '#E3A13A', Ti: '#E6D44E', Cu: '#D2603A', Cr: '#6DB6E6', Co: '#D17BB0', Al: '#9AA5B1', Ag: '#A7AEB6', Au: '#E5B33C', Zr: '#8BC34A' };
    const AX = 110, AY = S.h / 2;
    const cards = [0, 1, 2, 3].map(i => ({ y: 40 + i * 122, x: 330, w: 270, h: 104, comp: null, prog: 0, dur: 2, state: 'idle', wait: 0.3 * i }));
    const pts = [], fly = [];
    const PX = 680, PY = 30, PW = S.w - PX - 20, PH = S.h - 110;
    let nEval = 0;
    function propose() {
      const progress = Math.min(1, nEval / 40);
      const k = 2 + rng.int(3); const chosen = [];
      const pref = ['Co', 'Ni', 'Ti'];
      while (chosen.length < k) { const e = rng.u() < 0.35 + 0.5 * progress ? rng.pick(pref) : rng.pick(pool); if (!chosen.includes(e)) chosen.push(e); }
      let f = chosen.map(() => 0.2 + rng.u()); const s = f.reduce((a, b) => a + b, 0); f = f.map(v => v / s);
      return chosen.map((e, i) => [e, f[i]]);
    }
    function score(comp) {
      const g = (e) => (comp.find(c => c[0] === e) || [0, 0])[1];
      const q = 0.9 * g('Co') + 0.8 * g('Ni') + 0.6 * g('Ti') + 0.3 * g('Fe') - 0.4 * g('Mn') - 0.3 * g('Al') + 0.1 * rng.normal();
      const G = 0.15 + 0.7 * E.clamp(q) + 0.05 * rng.normal();
      const BG = 0.92 - 0.55 * G * G + 0.12 * (rng.u() - 0.3) - 0.15 * (1 - E.clamp(q)) * rng.u();
      return { x: E.clamp(G, 0.03, 0.97), y: E.clamp(BG, 0.05, 0.95) };
    }
    function front() { // maximize both x and y
      const s = pts.slice().sort((a, b) => b.x - a.x); const f = []; let best = -1; s.forEach(p => { if (p.y > best) { f.push(p); best = p.y; } }); return f.sort((a, b) => a.x - b.x);
    }
    function compText(comp) { return comp.map(([e, v]) => e + (v * 100).toFixed(0)).join(' '); }
    function draw() {
      S.clear();
      // agent
      roundRect(ctx, AX - 70, AY - 58, 140, 116, 30, rgba(C.violet, 0.12), C.violet, 2.5);
      ctx.strokeStyle = C.violet; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(AX, AY - 58); ctx.lineTo(AX, AY - 80); ctx.stroke(); U.circle(ctx, AX, AY - 84, 7, C.violet);
      const blink = (Math.sin(clock * 2.3) > 0.97) ? 0.2 : 1;
      ctx.save(); ctx.translate(AX, AY); ctx.scale(1, blink); U.circle(ctx, -26, 0, 11, C.violet); U.circle(ctx, 26, 0, 11, C.violet); ctx.restore();
      text(ctx, 'LLM agent', AX, AY + 96, { size: 23, weight: 650, color: C.violet, align: 'center' });
      text(ctx, 'reasons over history,', AX, AY + 124, { size: 17, color: C.inkSoft, align: 'center' });
      text(ctx, 'proposes compositions', AX, AY + 146, { size: 17, color: C.inkSoft, align: 'center' });
      // cards
      cards.forEach(c => {
        const a = c.state === 'idle' ? 0.45 : 1;
        ctx.save(); ctx.globalAlpha = a;
        roundRect(ctx, c.x, c.y, c.w, c.h, 14, '#fff', c.state === 'run' ? C.teal : rgba(C.inkSoft, 0.3), c.state === 'run' ? 2.5 : 1.5);
        // atom icon
        const ix = c.x + 40, iy = c.y + c.h / 2;
        ctx.strokeStyle = C.teal; ctx.lineWidth = 2.2; for (let e = 0; e < 3; e++) { ctx.beginPath(); ctx.ellipse(ix, iy, 24, 9, e * Math.PI / 3 + clock * (c.state === 'run' ? 1.6 : 0), 0, 2 * Math.PI); ctx.stroke(); } U.circle(ctx, ix, iy, 4, C.teal);
        text(ctx, 'ATLAS sample + relax', c.x + 78, c.y + 34, { size: 17, color: C.inkSoft });
        if (c.comp) text(ctx, compText(c.comp), c.x + 78, c.y + 62, { size: 18, color: C.ink, weight: 650, maxWidth: c.w - 92 });
        // progress
        if (c.state === 'run') { ctx.strokeStyle = rgba(C.teal, 0.2); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(c.x + 78, c.y + 82); ctx.lineTo(c.x + c.w - 20, c.y + 82); ctx.stroke(); ctx.strokeStyle = C.teal; ctx.beginPath(); ctx.moveTo(c.x + 78, c.y + 82); ctx.lineTo(c.x + 78 + (c.w - 98) * c.prog, c.y + 82); ctx.stroke(); }
        ctx.restore();
      });
      // arrows
      curvedArrow(ctx, [AX + 72, AY - 20, 250, AY - 160, 322, 92], rgba(C.violet, 0.7), 2.5, 11);
      curvedArrow(ctx, [AX + 72, AY + 20, 250, AY + 160, 322, 470], rgba(C.violet, 0.7), 2.5, 11);
      arrow(ctx, 610, AY, PX - 12, AY, rgba(C.teal, 0.7), 2.5, 11);
      text(ctx, 'B, G, B/G', (610 + PX) / 2 - 4, AY - 12, { size: 16, color: C.tealDark, align: 'center', weight: 600 });
      curvedArrow(ctx, [PX + PW / 2, PY + PH + 30, 420, S.h + 20, AX + 10, AY + 150 + 14], rgba(C.violet, 0.55), 2.5, 11, [7, 6]);
      text(ctx, 'Pareto set + history', 420, S.h - 8, { size: 17, color: C.violet, align: 'center' });
      // flying chips
      fly.forEach(f => { const u = E.inOut(f.u); const x = f.x0 + (f.x1 - f.x0) * u, y = f.y0 + (f.y1 - f.y0) * u - Math.sin(Math.PI * u) * 30; U.circle(ctx, x, y, 7, f.col); });
      // Pareto plot
      roundRect(ctx, PX, PY, PW, PH, 14, '#fff', rgba(C.inkSoft, 0.2), 1.5);
      const gx = PX + 50, gy = PY + 24, gw = PW - 74, gh = PH - 70;
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
      text(ctx, 'stiffness  G →', gx + gw, gy + gh + 30, { size: 17, color: C.inkSoft, align: 'right' });
      ctx.save(); ctx.translate(gx - 18, gy + gh / 2); ctx.rotate(-Math.PI / 2); text(ctx, 'ductility proxy  B/G →', 0, 0, { size: 17, color: C.inkSoft, align: 'center' }); ctx.restore();
      pts.forEach(p => U.circle(ctx, gx + p.x * gw, gy + (1 - p.y) * gh, 5.5, rgba(C.blue, 0.6)));
      const fr = front();
      if (fr.length > 1) { ctx.beginPath(); fr.forEach((p, i) => { const x = gx + p.x * gw, y = gy + (1 - p.y) * gh; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.stroke(); fr.forEach(p => U.circle(ctx, gx + p.x * gw, gy + (1 - p.y) * gh, 8, null, C.red, 2.2)); }
      text(ctx, `${nEval} ATLAS evaluations`, PX + PW - 14, PY + 30, { size: 17, color: C.muted, align: 'right' });
    }
    return {
      frame(dt) {
        clock += dt;
        cards.forEach(c => {
          if (c.state === 'idle') { c.wait -= dt; if (c.wait <= 0) { c.comp = propose(); c.state = 'run'; c.prog = 0; c.dur = 1.4 + rng.u() * 2.2; fly.push({ x0: AX + 70, y0: AY, x1: c.x, y1: c.y + c.h / 2, u: 0, col: C.violet }); } }
          else { c.prog += dt / c.dur; if (c.prog >= 1) { const p = score(c.comp); fly.push({ x0: c.x + c.w, y0: c.y + c.h / 2, x1: PX + 50 + p.x * (PW - 74), y1: PY + 24 + (1 - p.y) * (PH - 70), u: 0, col: C.teal, pt: p }); c.state = 'idle'; c.wait = 0.25 + rng.u() * 0.4; } }
        });
        for (const f of fly) f.u += dt / 0.7;
        for (let i = fly.length - 1; i >= 0; i--) if (fly[i].u >= 1) { if (fly[i].pt) { pts.push(fly[i].pt); nEval++; } fly.splice(i, 1); }
        if (nEval > 90) { pts.length = 0; nEval = 0; }
        draw();
      }, draw, ff: 30
    };
  };
  // ------------------------------------------------------------------
  // Composition-amortized training (ATLAS SI, Alg. 1): every sample in the batch draws its own composition c,
  // is generated under c, labelled with F(x₁; c) and stored with c; regression replays mixed-composition batches.
  // ------------------------------------------------------------------
  ANIMS.atlasAmortized = function (S, o) {
    const ctx = S.ctx; let rng = makeRng(31);
    const W0 = 585, SC = S.w / W0, H0 = S.h / SC; // laid out at 585 px wide, drawn at any size
    const EL = ['Fe', 'Mn', 'Ni', 'Ti', 'Cu', 'Cr', 'Co', 'Al'];
    const COL = [C.steel, C.pink, C.teal, C.blue, C.copper, C.yellow, C.violet, C.green];
    const NB = 4, NA = 16, NSLOT = 20, CW = 112, CG = (W0 - 40 - NB * CW) / (NB - 1), CX = (b) => 20 + b * (CW + CG), CY = 92;
    const T = { draw: 1.1, gen: 1.8, label: 1.1, push: 0.9, regress: 3.0 }, ORDER = ['draw', 'gen', 'label', 'push', 'regress'];
    const BY = 250, SW = 18, SG = (W0 - 40 - NSLOT * SW) / (NSLOT - 1), SX = (k) => 20 + k * (SW + SG), SH = 46;
    let batch, buffer = [], phase, pt, clock = 0, calls = 0, steps = 0, flashes = [], nextFlash = 0, active = false;
    function dirichlet(k) { const g = []; for (let i = 0; i < k; i++) g.push(-Math.log(Math.max(1e-9, rng.u()))); const sg = g.reduce((a, b) => a + b, 0); return g.map(v => v / sg); }
    function drawComposition() {
      const k = 2 + rng.int(4), idx = rng.shuffle(EL.map((_, i) => i)).slice(0, k).sort((a, b) => a - b), fr = dirichlet(k);
      return { idx, fr };
    }
    function speciesFor(c) { // largest-remainder rounding of NA * c
      const raw = c.fr.map(f => f * NA), n = raw.map(Math.floor); let left = NA - n.reduce((a, b) => a + b, 0);
      raw.map((r, i) => [r - n[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { n[i]++; left--; } });
      const sp = []; n.forEach((m, i) => { for (let j = 0; j < m; j++) sp.push(c.idx[i]); }); return rng.shuffle(sp);
    }
    function amorphous() { // random close packing on the unit torus (rejection with a minimum image distance)
      const pts = []; let tries = 0;
      while (pts.length < NA && tries < 6000) { tries++; const p = [rng.u(), rng.u()]; if (pts.every(q => Math.hypot(minImage(p[0] - q[0]), minImage(p[1] - q[1])) > 0.19)) pts.push(p); }
      while (pts.length < NA) pts.push([rng.u(), rng.u()]);
      return pts;
    }
    function forces(x1) { // pair repulsion, for the force arrows only
      return x1.map((p, i) => { let fx = 0, fy = 0; x1.forEach((q, j) => { if (i === j) return; const dx = minImage(p[0] - q[0]), dy = minImage(p[1] - q[1]), r = Math.hypot(dx, dy); if (r < 0.3) { const m = (0.3 - r) / r; fx += m * dx; fy += m * dy; } }); return [fx + 0.03 * rng.normal(), fy + 0.03 * rng.normal()]; });
    }
    function newBatch() {
      batch = []; for (let b = 0; b < NB; b++) { const c = drawComposition(), x1 = amorphous(); batch.push({ c, sp: speciesFor(c), x0: x1.map(() => [rng.u(), rng.u()]), x1, F: forces(x1), z: x1.map(() => [rng.normal(), rng.normal()]) }); }
      phase = 'draw'; pt = 0;
    }
    function compBar(c, x, y, w, h, vertical, alpha = 1) {
      let acc = 0;
      c.idx.forEach((e, i) => { const f = c.fr[i]; ctx.fillStyle = rgba(COL[e], alpha); if (vertical) ctx.fillRect(x, y + h - (acc + f) * h, w, f * h); else ctx.fillRect(x + acc * w, y, f * w, h); acc += f; });
      roundRect(ctx, x, y, w, h, 3, null, rgba(C.inkSoft, 0.35 * alpha), 1);
    }
    function cell(b, x, y, size, gt, showF, alpha = 1) {
      const B = batch[b];
      ctx.save(); ctx.globalAlpha *= alpha;
      roundRect(ctx, x, y, size, size, 6, '#fff', rgba(C.inkSoft, 0.45), 1.6);
      ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
      const r = size * 0.075, tips = [];
      B.x1.forEach((p1, i) => {
        const p0 = B.x0[i], nz = 0.10 * (1 - gt);
        const px = wrap01(p0[0] + minImage(p1[0] - p0[0]) * E.inOut(gt) + nz * B.z[i][0]), py = wrap01(p0[1] + minImage(p1[1] - p0[1]) * E.inOut(gt) + nz * B.z[i][1]);
        for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          const X = x + (px + ox) * size, Y = y + (py + oy) * size;
          if (X < x - r || X > x + size + r || Y < y - r || Y > y + size + r) continue;
          atom(ctx, X, Y, r, COL[B.sp[i]]);
          if (showF > 0 && ox === 0 && oy === 0) tips.push([X, Y, B.F[i]]);
        }
      });
      tips.forEach(([X, Y, f]) => { const m = Math.hypot(f[0], f[1]) || 1, ux = f[0] / m, uy = f[1] / m, L = (10 + Math.min(10, 80 * m)) * showF; arrow(ctx, X + ux * r * 0.6, Y + uy * r * 0.6, X + ux * (r + L), Y + uy * (r + L), C.red, 2.4, 7); });
      ctx.restore();
    }
    function header(str, col) { text(ctx, str, 20, 30, { size: 19, weight: 650, color: col }); }
    function draw() {
      S.clear(); ctx.save(); ctx.scale(SC, SC); roundRect(ctx, 0, 0, W0, H0, 16, '#fff');
      const u = E.clamp(pt / T[phase]);
      // step header
      if (phase === 'draw') header('① each sample draws its own composition c ~ Unif(simplex)', C.navy);
      if (phase === 'gen') header('② generate x₁ with the current model, conditioned on c', C.tealDark);
      if (phase === 'label') header('③ label: forces F(x₁; c), one potential call each', C.coral);
      if (phase === 'push') header('④ push (x₁, F, c) into the replay buffer', C.violet);
      if (phase === 'regress') header('⑤ regress the network on replayed batches (many steps)', C.navy);
      // batch
      for (let b = 0; b < NB; b++) {
        const x = CX(b), B = batch[b];
        if (phase === 'push' || phase === 'regress') continue;
        const ca = phase === 'draw' ? E.clamp(u * 1.6 - b * 0.18) : 1;
        if (ca > 0) {
          compBar(B.c, x, 64, CW * ca, 16, false);
          if (ca >= 1) { // element tags of this composition
            let acc = 0; B.c.idx.forEach((e, i) => { const f = B.c.fr[i]; if (f > 0.16) text(ctx, EL[e], x + (acc + f / 2) * CW, 61, { size: 13, color: C.inkSoft, align: 'center', weight: 600 }); acc += f; });
          }
        }
        const gt = phase === 'draw' ? 0 : phase === 'gen' ? u : 1;
        if (phase !== 'draw' || u > 0.55) cell(b, x, CY, CW, gt, phase === 'label' ? E.out(u) : 0, phase === 'draw' ? E.clamp((u - 0.55) / 0.3) : 1);
        if (phase === 'label' && u > 0.25) { roundRect(ctx, x + CW / 2 - 34, CY + CW - 30, 68, 24, 12, 'rgba(255,255,255,0.92)', rgba(C.coral, 0.6), 1.5); text(ctx, '+1 call', x + CW / 2, CY + CW - 12, { size: 15, color: C.coral, weight: 700, align: 'center' }); }
      }
      if (phase === 'push') { // cells fly into the first buffer slots
        for (let b = 0; b < NB; b++) {
          const k = NB - 1 - b, e = E.inOut(u), x = CX(b) + (SX(k) - CX(b)) * e, y = CY + (BY - CY) * e, sz = CW + (SW - CW) * e;
          if (e < 0.85) cell(b, x, y, sz, 1, 0, 1 - e * 0.6); else compBar(batch[b].c, SX(k), BY, SW, SH, true);
        }
      }
      if (phase === 'regress') {
        text(ctx, 'every mini-batch mixes compositions;', W0 / 2, CY + 44, { size: 19, color: C.ink, align: 'center', weight: 600 });
        richText(ctx, [['each entry is regressed onto ', 'n'], ['β', 'i'], ['F', 'n'], ['(', 'n'], ['x', 'i'], ['1', 'sub'], ['; ', 'n'], ['c', 'i'], [') at its own ', 'n'], ['c', 'i']], W0 / 2, CY + 74, { size: 19, color: C.inkSoft, align: 'center' });
      }
      // buffer
      text(ctx, 'replay buffer  (x₁, F, c)', 20, BY - 12, { size: 16, color: C.muted, weight: 600 });
      const shift = phase === 'push' ? E.inOut(u) * NB : 0;
      buffer.forEach((c, k) => { const kk = k + shift; if (kk > NSLOT - 0.3) return; const x = 20 + kk * (SW + SG), fl = flashes.find(f => f.k === k);
        compBar(c, x, BY, SW, SH, true, kk > NSLOT - 1 ? NSLOT - kk : 1);
        if (fl) roundRect(ctx, x - 4, BY - 4, SW + 8, SH + 8, 5, null, rgba(C.navy, fl.a), 3);
      });
      // network + counters
      const NX = W0 / 2 - 120, NY = BY + SH + 24, NW = 240, NH = 44;
      roundRect(ctx, NX, NY, NW, NH, 12, phase === 'regress' ? rgba(C.navy, 0.92) : rgba(C.navy, 0.75));
      richText(ctx, [['s', 'i'], ['θ', 'sub'], [', ', 'n'], ['b', 'i'], ['θ', 'sub'], ['(', 'n'], ['x', 'i'], ['t', 'sub'], [', ', 'n'], ['t', 'i'], [', ', 'n'], ['c', 'i'], [')', 'n']], NX + NW / 2, NY + 29, { size: 21, color: '#fff', align: 'center' });
      flashes.forEach(f => { const x = SX(f.k) + SW / 2; ctx.save(); ctx.globalAlpha = f.a; curvedArrow(ctx, [x, BY + SH + 4, (x + NX + NW / 2) / 2, NY - 4, NX + NW / 2 + (x - W0 / 2) * 0.25, NY - 2], C.navy, 1.8, 8); ctx.restore(); });
      text(ctx, `force calls ${calls}`, 20, H0 - 18, { size: 17, color: C.coral, weight: 650 });
      text(ctx, `gradient steps ${steps}`, W0 - 20, H0 - 18, { size: 17, color: C.navy, weight: 650, align: 'right' });
      text(ctx, 'one network for every c', W0 / 2, H0 - 18, { size: 16, color: C.tealDark, weight: 650, align: 'center' });
      ctx.restore();
    }
    function advance() {
      const i = ORDER.indexOf(phase);
      if (phase === 'label') calls += NB;
      if (phase === 'push') { buffer = batch.map(B => B.c).reverse().concat(buffer).slice(0, NSLOT); }
      if (phase === 'regress') { newBatch(); return; }
      phase = ORDER[i + 1]; pt = 0; flashes = []; nextFlash = 0;
    }
    function reset() { rng = makeRng(31); buffer = []; calls = 0; steps = 0; flashes = []; newBatch(); for (let r = 0; r < 3; r++) buffer = buffer.concat([drawComposition(), drawComposition()]); calls = buffer.length; newBatch(); }
    reset();
    return {
      frame(dt) {
        clock += dt; pt += dt;
        flashes.forEach(f => f.a -= dt * 2.2); flashes = flashes.filter(f => f.a > 0);
        if (phase === 'regress' && buffer.length) { nextFlash -= dt; if (nextFlash <= 0) { const ks = rng.shuffle(buffer.map((_, k) => k)).slice(0, 4); ks.forEach(k => flashes.push({ k, a: 1 })); steps += 25; nextFlash = 0.42; } }
        if (pt >= T[phase]) advance();
        if (calls > 400) reset();
        draw();
      },
      draw, ff: 9.5
    };
  };
})();
