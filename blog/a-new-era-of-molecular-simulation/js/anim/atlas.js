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
  // Options: {"only": "ev"} the evaluation counts alone, at the left of the canvas (compact slides) · {"title": false} no chart titles
  //          · {"startStep": n} the bars grow on click n
  // ------------------------------------------------------------------
  ANIMS.evalBars = function (S, o) {
    const ctx = S.ctx; let clock = 0;
    const labels = ['PT-MCMC\n(coarse)', 'PT-MCMC\n(dense)', 'ATLAS'];
    const err = [3e-4, 1e-4, 2e-3], ev = [2e8, 3e8, 4e5];
    const cols = ['#A7AEB6', '#3B4249', C.teal];
    // Powers of ten (axis ticks, the value above each bar) are typeset by KaTeX (S.tex, a layer over the canvas), as on the slide ($2\times10^{-3}$).
    // The chip ">500× fewer" stays bold canvas text, like the bold ">500×" in the takeaway of the slide.
    const pow10 = (v) => { const e = Math.floor(Math.log10(v) + 1e-9), m = v / Math.pow(10, e); return '$' + (m === 1 ? '' : m.toFixed(0) + '\\times') + '10^{' + e + '}$'; };
    const errTex = err.map(pow10), evTex = ev.map(pow10);
    function chart(id, x, y, w, h, vals, valTex, lo, hi, title) {
      if (!(o && o.title === false)) text(ctx, title, x + w / 2, y - 22, { size: 22, weight: 650, color: C.ink, align: 'center' });
      const ly = (v) => y + h - (Math.log10(v) - lo) / (hi - lo) * h;
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
      for (let p = lo; p <= hi; p++) { const yy = ly(Math.pow(10, p)); ctx.strokeStyle = rgba(C.inkSoft, 0.12); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); S.tex(id + 'tick' + p, '$10^{' + p + '}$', x - 10, yy + 7, { size: 18, color: C.muted, align: 'right' }); }
      const bw = w / 3 * 0.56, tops = [];
      vals.forEach((v, i) => {
        const g = E.out(E.clamp((clock - 0.3 * i) / 1.2)); const top = ly(Math.pow(10, lo + (Math.log10(v) - lo) * g));
        const bx = x + (i + 0.5) * w / 3 - bw / 2; roundRect(ctx, bx, top, bw, y + h - top, 5, cols[i]); tops.push([bx + bw / 2, top]);
        if (g > 0.95) S.tex(id + 'val' + i, valTex[i], bx + bw / 2, top - 10, { size: 20, color: i === 2 ? C.tealDark : C.ink, align: 'center', weight: 650 });
        labels[i].split('\n').forEach((s2, li) => text(ctx, s2, bx + bw / 2, y + h + 28 + li * 22, { size: 18, color: i === 2 ? C.tealDark : C.inkSoft, align: 'center', weight: i === 2 ? 700 : 500 }));
      });
      return tops;
    }
    function draw() {
      S.clear();
      const evOnly = !!(o && o.only === 'ev'), X = evOnly ? 90 : 530;
      if (!evOnly) chart('err', 90, 60, 300, 290, err, errTex, -5, -2, 'rel. free-energy error');
      const tops = chart('ev', X, 60, 300, 290, ev, evTex, 5, 9, 'target-energy evaluations');
      const a = E.clamp((clock - 1.8) / 0.6);
      if (a > 0) {
        ctx.save(); ctx.globalAlpha = a;
        const [x1, y1] = tops[1], [x2, y2] = tops[2];
        ctx.strokeStyle = C.teal; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(x1 + 30, y1); ctx.lineTo(x2 + 44, y1); ctx.stroke(); ctx.setLineDash([]);
        arrow(ctx, x2 + 44, y1, x2 + 44, y2 - 34, C.teal, 2.5, 11);
        roundRect(ctx, X + 70, 410, 200, 46, 23, rgba(C.teal, 0.12), C.teal, 2);
        text(ctx, '>500× fewer', X + 170, 442, { size: 24, color: C.tealDark, align: 'center', weight: 750 });
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
    const dtW = 0.6, KX = X0 + 330;   // KX: where the key for the umbrellas sits (free space above the curve)
    // the umbrella of window k: its harmonic bias u_k(ξ) = κ(ξ − ξ_k)²/2, drawn on the curve at the window centre, up to UH kT
    const UH = 0.9, uy = (v) => Y1 - v / 5 * (Y1 - Y0);
    function cup(xc, f0, half, col, lw, fill) {
      ctx.save(); ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const x = xc - half + 2 * half * i / 40, y = uy(f0 + 0.5 * kap * (x - xc) ** 2); if (i) ctx.lineTo(fx(x), y); else ctx.moveTo(fx(x), y); }
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
    }
    // All notation is typeset by KaTeX (S.tex, a layer over the canvas), written as on the slide: F(ξ), u_k(ξ), q_k, ΔF‡.
    function label(word, key, src, x, y) {   // bold word on the canvas, then its symbol (and the plain rest) typeset
      ctx.save(); ctx.font = font(20, 650); const w = ctx.measureText(word).width; ctx.restore();
      text(ctx, word, x, y, { size: 20, weight: 650, color: C.ink });
      S.tex(key, src, x + w + 9, y, { size: 20, color: C.ink });
    }
    function draw() {
      S.clear();
      ctx.strokeStyle = rgba(C.inkSoft, 0.45); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.lineTo(X1, Y1); ctx.stroke();
      S.tex('F', '$F(\\xi)$', X0 - 14, Y0 + 14, { size: 24, color: C.ink, align: 'right' });
      // true landscape (faint, dashed): what we want to recover
      ctx.save(); ctx.setLineDash([7, 7]); ctx.strokeStyle = rgba(C.muted, 0.9); ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = lo + (hi - lo) * i / 200; if (i) ctx.lineTo(fx(x), fy(F(x))); else ctx.moveTo(fx(x), fy(F(x))); } ctx.stroke(); ctx.restore();
      const nOn = Math.min(nW, Math.floor(clock / dtW) + 1);
      // umbrellas on the curve, each in the colour of its window (it opens as the window comes on)
      for (let k = 0; k < nOn; k++) {
        const c = centers[k], open = E.out(E.clamp((clock - k * dtW) / dtW));
        cup(c, F(c), Math.sqrt(2 * UH / kap) * open, colors[k], 3.2, rgba(colors[k], 0.16));
        U.circle(ctx, fx(c), uy(F(c)), 4.5, colors[k]);
      }
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
        S.tex('dF', '$\\Delta F^\\ddagger$', fx(1.33) + 12, fy(2.1), { size: 28, color: C.coral });
      }
      S.tex('xi', '$\\xi$\u00a0 (collective variable) →', X1, Y1 - 12, { size: 20, color: C.inkSoft, align: 'right' });
      // key: the cups are the umbrellas u_k, the histograms below are their windows q_k
      ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i <= 16; i++) { const s = -1 + i / 8, x = KX + 14 * s, y = Y0 + 16 - 17 * s * s; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
      label('umbrella', 'uk', '$u_k(\\xi)$', KX + 26, Y0 + 14);
      label('window', 'qk', '$q_k$:\u00a0 a tilted target, sampled by SMC steering', X0, HB + 34);
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
    // o.build: make the agent's construction of the Pareto frontier explicit (earlier frontiers left behind as faded
    // dashed lines, newcomers to the frontier flash, dominated region shaded, labels)
    const BUILD = !!o.build, snaps = [], SNAP = 10;
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
      if (BUILD) {   // schematic: the reachable trade-off curve moves outward as the agent learns (more Co/Ni/Ti, more rounds)
        const fp = g('Co') + g('Ni') + g('Ti'), prog = Math.min(1, nEval / 70);
        const rho = Math.min(1, 0.42 + 0.18 * fp + 0.38 * Math.sqrt(prog) + 0.06 * rng.normal() - 0.12 * rng.u());
        const t = rng.u();
        return { x: E.clamp(rho * (0.12 + 0.84 * t), 0.03, 0.97), y: E.clamp(rho * (0.95 - 0.62 * t * t), 0.05, 0.95) };
      }
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
      text(ctx, BUILD ? 'reads the frontier,' : 'reasons over history,', AX, AY + 124, { size: 17, color: C.inkSoft, align: 'center' });
      text(ctx, BUILD ? 'proposes alloys to push it' : 'proposes compositions', AX, AY + 146, { size: 17, color: C.inkSoft, align: 'center' });
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
      // The symbols B, G, B/G are typeset by KaTeX (S.tex, a layer over the canvas), as on the slide; with {"build": true}
      // (the general-audience deck) the labels stay plain canvas text.
      if (BUILD) text(ctx, 'B, G, B/G', (610 + PX) / 2 - 4, AY - 12, { size: 16, color: C.tealDark, align: 'center', weight: 600 });
      else S.tex('obj', '$B,G,B/G$', (610 + PX) / 2 - 4, AY - 12, { size: 14, color: C.tealDark, align: 'center', weight: 600 });   // size 14: as wide as the canvas text was, it has to fit between the cards and the plot
      curvedArrow(ctx, [PX + PW / 2, PY + PH + 30, 420, S.h + 20, AX + 10, AY + 150 + 14], rgba(C.violet, 0.55), 2.5, 11, [7, 6]);
      text(ctx, BUILD ? 'Pareto frontier + history' : 'Pareto set + history', 420, S.h - 8, { size: 17, color: C.violet, align: 'center' });
      // flying chips
      fly.forEach(f => { const u = E.inOut(f.u); const x = f.x0 + (f.x1 - f.x0) * u, y = f.y0 + (f.y1 - f.y0) * u - Math.sin(Math.PI * u) * 30; U.circle(ctx, x, y, 7, f.col); });
      // Pareto plot
      roundRect(ctx, PX, PY, PW, PH, 14, '#fff', rgba(C.inkSoft, 0.2), 1.5);
      const gx = PX + 50, gy = PY + 24, gw = PW - 74, gh = PH - 70;
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
      if (BUILD) {
        text(ctx, 'stiffness  G →', gx + gw, gy + gh + 30, { size: 17, color: C.inkSoft, align: 'right' });
        ctx.save(); ctx.translate(gx - 18, gy + gh / 2); ctx.rotate(-Math.PI / 2); text(ctx, 'ductility proxy  B/G →', 0, 0, { size: 17, color: C.inkSoft, align: 'center' }); ctx.restore();
      } else {
        S.tex('axG', 'stiffness\u00a0 $G$ →', gx + gw, gy + gh + 30, { size: 17, color: C.inkSoft, align: 'right' });
        // a typeset label cannot be rotated: the words stay along the axis, the symbol B/G sits upright at the top of the axis
        ctx.save(); ctx.translate(gx - 18, gy + gh / 2); ctx.rotate(-Math.PI / 2); text(ctx, 'ductility proxy →', 0, 0, { size: 17, color: C.inkSoft, align: 'center' }); ctx.restore();
        S.tex('axBG', '$B/G$', gx - 6, gy + 14, { size: 17, color: C.inkSoft, align: 'right' });
      }
      const fr = front(), PXp = p => gx + p.x * gw, PYp = p => gy + (1 - p.y) * gh;
      if (BUILD && fr.length > 1) {
        // dominated region (everything below and left of the frontier)
        ctx.beginPath(); ctx.moveTo(gx, gy + gh); ctx.lineTo(gx, PYp(fr[0])); fr.forEach(p => ctx.lineTo(PXp(p), PYp(p))); ctx.lineTo(PXp(fr[fr.length - 1]), gy + gh); ctx.closePath();
        ctx.fillStyle = rgba(C.red, 0.06); ctx.fill();
        // earlier frontiers, older = fainter
        snaps.forEach((f, k) => {
          const a = 0.45 + 0.5 * (k + 1) / snaps.length;
          ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(C.red, a * 0.7); ctx.lineWidth = 2.2; ctx.beginPath();
          f.forEach((p, i) => { if (i) ctx.lineTo(PXp(p), PYp(p)); else ctx.moveTo(PXp(p), PYp(p)); }); ctx.stroke(); ctx.restore();
        });
      }
      pts.forEach(p => U.circle(ctx, PXp(p), PYp(p), 5.5, rgba(C.blue, 0.6)));
      if (fr.length > 1) { ctx.beginPath(); fr.forEach((p, i) => { const x = gx + p.x * gw, y = gy + (1 - p.y) * gh; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.stroke(); fr.forEach(p => U.circle(ctx, gx + p.x * gw, gy + (1 - p.y) * gh, 8, null, C.red, 2.2)); }
      if (BUILD) {
        pts.forEach(p => { if (p.flash > 0) { const r = 8 + 22 * (1 - p.flash); U.circle(ctx, PXp(p), PYp(p), r, null, rgba(C.red, p.flash), 3); } });
        if (fr.length > 1) {   // label just outside the middle of the frontier (the empty, not-yet-reached side)
          const q = fr[Math.floor((fr.length - 1) / 2)], lx = Math.min(PXp(q) + 16, gx + gw - 150), ly = PYp(q) - 16;
          ctx.save(); ctx.font = U.font(19, 750); ctx.textAlign = 'left'; ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round';
          ctx.strokeText('Pareto frontier', lx, ly); ctx.fillStyle = C.red; ctx.fillText('Pareto frontier', lx, ly); ctx.restore();
        }
        // key, in the empty dominated corner
        const kx = gx + 22, ky = gy + gh - 54;
        ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + 34, ky); ctx.stroke();
        ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(C.red, 0.6); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(kx, ky + 28); ctx.lineTo(kx + 34, ky + 28); ctx.stroke(); ctx.restore();
        text(ctx, 'frontier now', kx + 44, ky + 6, { size: 16, color: C.ink });
        text(ctx, 'earlier frontiers', kx + 44, ky + 34, { size: 16, color: C.inkSoft });
        text(ctx, `round ${Math.floor(nEval / 4) + 1} · ${nEval} evaluations`, PX + PW - 14, PY + 30, { size: 17, color: C.muted, align: 'right' });
      } else text(ctx, `${nEval} ATLAS evaluations`, PX + PW - 14, PY + 30, { size: 17, color: C.muted, align: 'right' });
    }
    return {
      frame(dt) {
        clock += dt;
        cards.forEach(c => {
          if (c.state === 'idle') { c.wait -= dt; if (c.wait <= 0) { c.comp = propose(); c.state = 'run'; c.prog = 0; c.dur = 1.4 + rng.u() * 2.2; fly.push({ x0: AX + 70, y0: AY, x1: c.x, y1: c.y + c.h / 2, u: 0, col: C.violet }); } }
          else { c.prog += dt / c.dur; if (c.prog >= 1) { const p = score(c.comp); fly.push({ x0: c.x + c.w, y0: c.y + c.h / 2, x1: PX + 50 + p.x * (PW - 74), y1: PY + 24 + (1 - p.y) * (PH - 70), u: 0, col: C.teal, pt: p }); c.state = 'idle'; c.wait = 0.25 + rng.u() * 0.4; } }
        });
        for (const f of fly) f.u += dt / 0.7;
        for (let i = fly.length - 1; i >= 0; i--) if (fly[i].u >= 1) {
          if (fly[i].pt) {
            const p = fly[i].pt; pts.push(p); nEval++;
            if (BUILD) { if (front().includes(p)) p.flash = 1; if (nEval % SNAP === 0) { snaps.push(front().map(q => ({ x: q.x, y: q.y }))); if (snaps.length > 4) snaps.shift(); } }
          }
          fly.splice(i, 1);
        }
        if (BUILD) pts.forEach(p => { if (p.flash > 0) p.flash = Math.max(0, p.flash - dt / 1.1); });
        if (nEval > 90) { pts.length = 0; nEval = 0; snaps.length = 0; }
        draw();
      }, draw, ff: 30
    };
  };
  // ------------------------------------------------------------------
  // Composition-amortized training (ATLAS SI, Alg. 1), one card per step of the loop and one click per card:
  // ① every sample draws its own composition c, ② is generated under c, ③ gets one force call, ④ is stored as (X_N, F, c),
  // ⑤ regression replays batches that mix compositions. step(k): build 0 shows ① only, builds 1 to 4 add ② to ⑤.
  // Until all five are on the slide the loop runs through the visible steps, pauses, and draws a new batch.
  // All notation is typeset by KaTeX (S.tex, a layer over the canvas) in the deck's notation: the generated sample is X_N
  // (the paper's x₁), the force is the bold F, the two heads are s_θ, b_θ(X_t, t, c).
  // ------------------------------------------------------------------
  ANIMS.atlasAmortized = function (S, o) {
    const ctx = S.ctx; let rng = makeRng(31);
    S.canvas.style.boxShadow = 'none'; S.canvas.style.borderRadius = '0';   // every step draws its own card
    const W0 = 1700, SC = S.w / W0;   // laid out for a 1700 x 580 canvas, drawn at any size
    let ga = 1;   // opacity of the card being drawn: a typeset label does not inherit ctx.globalAlpha
    const tex = (key, src, x, y, opt) => S.tex(key, src, x * SC, y * SC, Object.assign({}, opt, { size: opt.size * SC, alpha: ga }));   // layout units -> canvas units
    const EL = ['Fe', 'Mn', 'Ni', 'Ti', 'Cu', 'Cr', 'Co', 'Al'];
    const COL = [C.steel, C.pink, C.teal, C.blue, C.copper, C.yellow, C.violet, C.green];
    const NB = 4, NA = 16, NROW = 5, NSLOT = NB * NROW;
    const ORDER = ['draw', 'gen', 'label', 'push', 'regress'], T = { draw: 1.1, gen: 1.8, label: 1.1, push: 0.9, regress: 3.0 }, HOLD = 1.6;
    const STAGE = [
      { verb: 'Draw', col: C.navy, what: 'a composition $c$ per sample' },
      { verb: 'Generate', col: C.tealDark, what: '$X_N$ from the model, given $c$' },
      { verb: 'Label', col: C.coral, what: 'one force call each' },
      { verb: 'Store', col: C.violet, what: '$(X_N,\\mathbf F,c)$ in the replay buffer' },
      { verb: 'Regress', col: C.navy, what: 'replayed batches mix $c$' }
    ];
    const CG = 32, CW = (W0 - 2 - 4 * CG) / 5, CX = (i) => 1 + i * (CW + CG), CY = 2, CH = 494, PAD = 18, IW = CW - 2 * PAD, BY = CY + 112, CAP = CY + 470;
    const CELL = 126, GP = 166, cellXY = (i, b) => [CX(i) + PAD + (b % 2) * (IW - CELL), BY + 14 + Math.floor(b / 2) * GP];   // 2 x 2 structures in ② and ③
    const TW = 58, TH = 40, TP = 62, tileXY = (k) => [CX(3) + PAD + (k % NB) * (IW - TW) / (NB - 1), BY + 4 + Math.floor(k / NB) * TP];  // buffer: newest row on top
    const MBY = BY + 30, NY = BY + 146, NH = 62, mbX = (j) => CX(4) + PAD + j * (IW - TW) / (NB - 1);   // ⑤: the replayed mini-batch and the network
    let batch, buffer = [], phase = 'draw', pt = 0, hold = false, calls = 0, steps = 0, flashes = [], nextFlash = 0, mb = null;
    let nShown = 1, snap = true; const rev = [1, 0, 0, 0, 0], act = [1, 0, 0, 0, 0];
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
      phase = 'draw'; pt = 0; hold = false; flashes = []; nextFlash = 0;
    }
    function reset() { rng = makeRng(31); buffer = []; steps = 0; mb = null; for (let k = 0; k < 3 * NB; k++) buffer.push(drawComposition()); calls = buffer.length; newBatch(); }
    function compBar(c, x, y, w, h, r, alpha = 1) {   // a composition as a stacked bar
      if (w < 1 || alpha <= 0) return;
      ctx.save(); ctx.globalAlpha *= alpha; roundRect(ctx, x, y, w, h, Math.min(r, w / 2)); ctx.clip();
      let acc = 0; c.idx.forEach((e, i) => { ctx.fillStyle = COL[e]; ctx.fillRect(x + acc * w, y, c.fr[i] * w + 0.6, h); acc += c.fr[i]; });
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= alpha; roundRect(ctx, x, y, w, h, Math.min(r, w / 2), null, rgba(C.inkSoft, 0.4), 1); ctx.restore();
    }
    function frame0(x, y) { roundRect(ctx, x, y, CELL, CELL, 6, null, rgba(C.inkSoft, 0.32), 1.4, [5, 6]); }   // a structure not made yet
    function cell(B, x, y, size, gt, showF, alpha = 1) {
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
    function card(i) {
      const st = STAGE[i], x = CX(i);
      roundRect(ctx, x, CY, CW, CH, 18, '#fff', rgba(C.inkSoft, 0.22), 1.5);
      if (act[i] > 0.01) roundRect(ctx, x, CY, CW, CH, 18, null, rgba(st.col, 0.9 * act[i]), 2.6);
      U.circle(ctx, x + PAD + 17, CY + 40, 17, st.col);
      text(ctx, String(i + 1), x + PAD + 17, CY + 47.5, { size: 21, weight: 700, color: '#fff', align: 'center' });
      text(ctx, st.verb, x + PAD + 46, CY + 49.5, { size: 27, weight: 700, color: st.col });
      if (st.what.includes('$')) tex('what' + i, st.what, x + PAD, CY + 90, { size: 20, color: C.ink });
      else text(ctx, st.what, x + PAD, CY + 90, { size: 20, color: C.ink });
    }
    const STAGES = [
      function (pi, u) {   // ① one composition per sample
        const x = CX(0) + PAD;
        for (let b = 0; b < NB; b++) {
          const B = batch[b], top = BY + b * 80, ca = pi === 0 ? E.out(E.clamp(u * 1.5 - b * 0.16)) : 1;
          compBar(B.c, x, top + 24, IW * ca, 26, 5);
          if (ca >= 1) { let acc = 0; B.c.idx.forEach((e, i) => { const f = B.c.fr[i]; if (f > 0.12) text(ctx, EL[e], x + (acc + f / 2) * IW, top + 16, { size: 18, weight: 600, color: C.ink, align: 'center' }); acc += f; }); }
        }
        tex('unif', '$c\\sim\\mathrm{Unif}(\\text{simplex})$', CX(0) + CW / 2, CAP, { size: 21, color: C.ink, align: 'center' });
      },
      function (pi, u) {   // ② the structures, generated under their own c
        for (let b = 0; b < NB; b++) {
          const [x, y] = cellXY(1, b), B = batch[b];
          if (pi < 1) { frame0(x, y); continue; }
          compBar(B.c, x, y - 14, CELL, 8, 3); cell(B, x, y, CELL, pi === 1 ? u : 1, 0);
        }
      },
      function (pi, u) {   // ③ one force call per structure
        for (let b = 0; b < NB; b++) {
          const [x, y] = cellXY(2, b), B = batch[b];
          if (pi < 2) { frame0(x, y); continue; }
          compBar(B.c, x, y - 14, CELL, 8, 3); cell(B, x, y, CELL, 1, pi === 2 ? E.out(u) : 1);
          if (pi === 2 && u > 0.25) { roundRect(ctx, x + CELL / 2 - 42, y + CELL - 36, 84, 28, 14, 'rgba(255,255,255,0.94)', rgba(C.coral, 0.7), 1.5); text(ctx, '+1 call', x + CELL / 2, y + CELL - 16, { size: 18, color: C.coral, weight: 700, align: 'center' }); }
        }
        text(ctx, `force calls ${calls}`, CX(2) + CW / 2, CAP, { size: 22, weight: 700, color: C.coral, align: 'center' });
      },
      function (pi, u) {   // ④ the replay buffer; while a batch arrives the rows move down and the oldest fades
        const sh = pi === 3 && !hold ? E.inOut(u) : 0;
        buffer.forEach((c, k) => {
          const [x, y] = tileXY(k), row = Math.floor(k / NB), a = Math.min(1, NROW - row - sh);
          compBar(c, x, y + sh * TP, TW, TH, 6, a);
          const fl = flashes.find(f => f.k === k); if (fl) roundRect(ctx, x - 4, y - 4, TW + 8, TH + 8, 9, null, rgba(C.navy, fl.a), 3);
        });
      },
      function (pi) {      // ⑤ one network, regressed on batches that mix compositions
        const x = CX(4) + PAD, cx = CX(4) + CW / 2, on = pi === 4 && !hold, kick = mb && on ? E.clamp(1 - Math.abs(mb.age - 0.36) / 0.2) : 0;
        if (mb) arrow(ctx, cx, MBY + TH + 12, cx, NY - 8, rgba(C.navy, on ? 0.9 : 0.4), 2.8, 11);
        roundRect(ctx, x, NY, IW, NH, 14, rgba(C.navy, on ? 0.95 : 0.8));
        if (kick > 0) roundRect(ctx, x - 4, NY - 4, IW + 8, NH + 8, 17, null, rgba(C.teal, 0.8 * kick), 4);
        tex('net', '$s_\\theta,\\ b_\\theta(X_t,t,c)$', cx, NY + 40, { size: 24, color: '#fff', align: 'center' });
        tex('one', 'one network for every $c$', cx, NY + NH + 54, { size: 22, weight: 700, color: C.tealDark, align: 'center' });
        text(ctx, `gradient steps ${steps}`, cx, CAP, { size: 22, weight: 700, color: C.navy, align: 'center' });
      }
    ];
    function draw() {
      S.clear(); ctx.save(); ctx.scale(SC, SC);
      const pi = ORDER.indexOf(phase), u = hold ? 1 : E.clamp(pt / T[phase]);
      for (let i = 0; i < 5; i++) {
        if (rev[i] <= 0.01) continue;
        ctx.save(); ctx.globalAlpha = ga = rev[i]; card(i); STAGES[i](pi, u);
        if (i) arrow(ctx, CX(i) - CG + 5, CY + CH / 2, CX(i) - 5, CY + CH / 2, rgba(C.inkSoft, 0.8), 3, 10);
        ctx.restore();
      }
      // on top of the cards: the batch on its way into the buffer, the replayed mini-batch, the arrow that closes the loop
      if (pi === 3 && !hold && rev[3] > 0.01) {
        const e = E.inOut(u); ctx.save(); ctx.globalAlpha = rev[3];
        for (let b = 0; b < NB; b++) {
          const [x0, y0] = cellXY(2, b), [x1, y1] = tileXY(b), s = CELL + (TH - CELL) * e, w = s + (TW - TH) * e;
          const cx = x0 + CELL / 2 + (x1 + TW / 2 - x0 - CELL / 2) * e, cy = y0 + CELL / 2 + (y1 + TH / 2 - y0 - CELL / 2) * e - 24 * Math.sin(Math.PI * e);
          cell(batch[b], cx - s / 2, cy - s / 2, s, 1, 0, 1 - E.clamp((e - 0.5) / 0.35));
          compBar(batch[b].c, cx - w / 2, cy - s / 2, w, s, 6, E.clamp((e - 0.4) / 0.35));
        }
        ctx.restore();
      }
      if (rev[4] > 0.01) {
        ctx.save(); ctx.globalAlpha = rev[4];
        if (mb) { const e = E.out(E.clamp(mb.age / 0.3)); mb.cs.forEach((c, j) => { const [x0, y0] = tileXY(mb.ks[j]); compBar(c, x0 + (mbX(j) - x0) * e, y0 + (MBY - y0) * e, TW, TH, 6); }); }
        const xa = CX(4) + CW / 2, xb = CX(1) + CW / 2, y0 = CY + CH + 7, yb = y0 + 40, r = 14;
        ctx.strokeStyle = C.tealDark; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xa, yb - r); ctx.quadraticCurveTo(xa, yb, xa - r, yb); ctx.lineTo(xb + r, yb); ctx.quadraticCurveTo(xb, yb, xb, yb - r); ctx.lineTo(xb, y0 + 8); ctx.stroke();
        arrow(ctx, xb, y0 + 14, xb, y0, C.tealDark, 3, 12);
        ctx.font = font(20, 650); const tw = ctx.measureText('updated model').width;
        ctx.fillStyle = C.bg; ctx.fillRect((xa + xb) / 2 - tw / 2 - 14, yb - 14, tw + 28, 28);
        text(ctx, 'updated model', (xa + xb) / 2, yb + 7, { size: 20, weight: 650, color: C.tealDark, align: 'center' });
        ctx.restore();
      }
      ctx.restore();
    }
    function advance() {
      const i = ORDER.indexOf(phase);
      if (phase === 'label') calls += NB;
      if (phase === 'push') buffer = batch.map(B => B.c).concat(buffer).slice(0, NSLOT);
      if (phase === 'regress') { newBatch(); return; }
      if (i + 1 >= nShown) { hold = true; pt = 0; return; }   // the next step is not on the slide yet: pause, then draw a new batch
      phase = ORDER[i + 1]; pt = 0; flashes = []; nextFlash = 0;
    }
    reset();
    return {
      frame(dt) {
        pt += dt;
        const pi = ORDER.indexOf(phase);
        for (let i = 0; i < 5; i++) { rev[i] = i < nShown ? Math.min(1, rev[i] + dt / 0.35) : Math.max(0, rev[i] - dt / 0.2); act[i] += ((i === pi ? 1 : 0) - act[i]) * Math.min(1, dt / 0.12); }
        flashes.forEach(f => f.a -= dt * 2.2); flashes = flashes.filter(f => f.a > 0); if (mb) mb.age += dt;
        if (!hold && phase === 'regress' && buffer.length) {
          nextFlash -= dt;
          if (nextFlash <= 0) { const ks = rng.shuffle(buffer.map((_, k) => k)).slice(0, NB); flashes = ks.map(k => ({ k, a: 1 })); mb = { ks, cs: ks.map(k => buffer[k]), age: 0 }; steps += 25; nextFlash = 0.6; }
        }
        if (hold) { if (pt >= HOLD) newBatch(); } else if (pt >= T[phase]) advance();
        if (calls > 400) reset();
        draw();
      },
      draw,
      enter() { reset(); snap = true; },
      step(k) {   // build k shows steps ① to min(5, k + 1)
        const n = Math.max(1, Math.min(5, (k || 0) + 1)), was = nShown, pi = ORDER.indexOf(phase); nShown = n;
        if (snap) { for (let i = 0; i < 5; i++) { rev[i] = i < n ? 1 : 0; act[i] = i === pi ? 1 : 0; } snap = false; }
        if (n > was && hold) { hold = false; phase = ORDER[pi + 1]; pt = 0; flashes = []; nextFlash = 0; }   // carry the waiting batch on into the new step
        else if (n < was && pi >= n) newBatch();
      },
      get ff() {   // export: run on to a frame where every visible step is complete (all five: in the middle of the regression)
        const n = nShown, i = ORDER.indexOf(phase), sum = (a, b) => { let s = 0; for (let j = a; j < b; j++) s += T[ORDER[j]]; return s; };
        let t;
        if (n < 5) t = hold ? (pt <= 0.7 ? 0.7 - pt : HOLD - pt + sum(0, n) + 0.7) : T[phase] - pt + sum(i + 1, n) + 0.7;
        else t = i === 4 ? (pt <= 1.5 ? 1.5 - pt : T.regress - pt + sum(0, 4) + 1.5) : T[phase] - pt + sum(i + 1, 4) + 1.5;
        return Math.max(0.6, t);
      }
    };
  };
})();
