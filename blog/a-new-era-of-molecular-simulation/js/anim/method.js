/* Method animations: target score identity, fixed-point loop (real 1D torus run), path weights, SMC steering. */
(function () {
  'use strict';
  const { C, rgba, mix, E, atom, flatAtom, roundRect, arrow, curvedArrow, text, richText, font, makeRng, wiggle, wrap01, minImage } = U;
  const FP = window.FP_DATA;

  // von Mises mixture target used in the 1D torus demo
  function vmTarget() {
    const { w, mu, kap } = FP.gmm;
    const i0 = (k) => { let s = 1, t = 1; for (let n = 1; n < 60; n++) { t *= (k / 2) * (k / 2) / (n * n); s += t; } return s; };
    const norms = kap.map(i0);
    function p(x) { let s = 0; for (let m = 0; m < w.length; m++) s += w[m] * Math.exp(kap[m] * Math.cos(2 * Math.PI * (x - mu[m]))) / norms[m]; return s; }
    function score(x) { let num = 0, den = 0; for (let m = 0; m < w.length; m++) { const v = w[m] * Math.exp(kap[m] * Math.cos(2 * Math.PI * (x - mu[m]))) / norms[m]; den += v; num += v * (-2 * Math.PI * kap[m] * Math.sin(2 * Math.PI * (x - mu[m]))); } return num / den; }
    return { p, score };
  }

  // draw a density along a vertical axis (x in [0,1) mapped to y), bulging to the right (dir=1) or left (dir=-1)
  function vDensity(ctx, xs, vals, x0, y0, y1, scale, dir, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(x0, y1);
    for (let i = 0; i < xs.length; i++) { const y = y1 - xs[i] * (y1 - y0); ctx.lineTo(x0 + dir * vals[i] * scale, y); }
    ctx.lineTo(x0, y0); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }

  // ------------------------------------------------------------------
  // Target score identity: the force at the endpoint labels the whole bridge
  // ------------------------------------------------------------------
  ANIMS.tsiDemo = function (S, o) {
    const ctx = S.ctx, T = vmTarget(), rng = makeRng(17);
    const X0 = 150, X1 = S.w - 170, Y0 = 70, Y1 = S.h - 80;
    const grid = []; for (let i = 0; i <= 200; i++) grid.push(i / 200);
    const tv = grid.map(T.p), tmax = Math.max(...tv);
    let clock = 0, step = 0, bridges = [];
    const pick = [0.18, 0.2, 0.49, 0.53, 0.47, 0.8, 0.79, 0.84, 0.15, 0.51];
    function makeBridges() {
      bridges = [];
      for (let b = 0; b < 9; b++) {
        const x1 = wrap01(pick[b] + 0.03 * rng.normal()), x0 = rng.u(), d = minImage(x1 - x0), seed = rng.u() * 100;
        bridges.push({ x0, x1, d, seed, hl: b < 6 });
      }
    }
    makeBridges();
    const tStar = 0.58;
    const ty = (x) => Y1 - x * (Y1 - Y0), tx = (t) => X0 + t * (X1 - X0);
    function bpos(b, t) { return b.x0 + E.smoother(t) * b.d + 0.06 * Math.sin(Math.PI * t) * wiggle(b.seed, t * 6); }
    function draw() {
      S.clear();
      // axes / densities
      ctx.strokeStyle = rgba(C.inkSoft, 0.3); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.moveTo(X1, Y0); ctx.lineTo(X1, Y1); ctx.stroke();
      ctx.fillStyle = rgba(C.muted, 0.25); ctx.fillRect(X0 - 46, Y0, 46, Y1 - Y0);
      vDensity(ctx, grid, tv.map(v => v / tmax), X1, Y0, Y1, 120, 1, rgba(C.coral, 0.18), C.coral);
      text(ctx, 'uniform prior', X0 - 23, Y1 + 34, { size: 20, color: C.inkSoft, align: 'center' });
      text(ctx, 'target', X1 + 60, Y1 + 34, { size: 20, color: C.coral, align: 'center' });
      text(ctx, 't = 0', X0, Y0 - 18, { size: 20, color: C.muted, align: 'center' });
      text(ctx, 't = N', X1, Y0 - 18, { size: 20, color: C.muted, align: 'center' });
      // bridges
      const show = E.clamp(clock / 2.4);
      bridges.forEach((b, bi) => {
        ctx.beginPath(); let prev = null;
        const nT = Math.floor(80 * show);
        for (let k = 0; k <= nT; k++) { const t = k / 80, y = bpos(b, t), w = wrap01(y); const X = tx(t), Y = ty(w); if (prev !== null && Math.abs(w - prev) > 0.5) ctx.moveTo(X, Y); else if (k === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); prev = w; }
        ctx.strokeStyle = b.hl ? rgba(C.blue, 0.75) : rgba(C.muted, 0.5); ctx.lineWidth = b.hl ? 2.4 : 1.4; ctx.stroke();
        U.circle(ctx, tx(0), ty(wrap01(b.x0)), 5, C.muted);
        if (show >= 1) U.circle(ctx, tx(1), ty(b.x1), 6, b.hl ? C.blue : C.muted);
      });
      // forces at the endpoints
      const fa = E.clamp((clock - 2.6) / 0.8);
      if (fa > 0) bridges.forEach(b => { if (!b.hl) return; const s = T.score(b.x1); const len = Math.sign(s) * Math.min(64, 7 * Math.sqrt(Math.abs(s))) * fa; arrow(ctx, tx(1), ty(b.x1), tx(1), ty(b.x1) - len, C.coral, 3.2, 11); });
      if (fa > 0) richText(ctx, [['β', 'i'], ['F', 'i'], ['(', 'n'], ['X', 'i'], ['N', 'sub'], [')', 'n']], X1 - 14, Y0 + 26, { size: 25, color: C.coral, align: 'right', alpha: fa });
      // transport labels back to x_t at t*
      const ca = E.clamp((clock - 3.8) / 1.0);
      if (step >= 1 && ca > 0) {
        const xs = tx(1 - (1 - tStar) * E.inOut(ca));
        ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(C.navy, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xs, Y0 - 4); ctx.lineTo(xs, Y1 + 4); ctx.stroke(); ctx.restore();
        text(ctx, 't', xs, Y1 + 30, { size: 22, color: C.navy, align: 'center', italic: true });
        const tt = 1 - (1 - tStar) * E.inOut(ca);
        bridges.forEach(b => { if (!b.hl) return; const y = wrap01(bpos(b, tt)); const s = T.score(b.x1); const len = Math.sign(s) * Math.min(64, 7 * Math.sqrt(Math.abs(s))); U.circle(ctx, xs, ty(y), 6, C.blue); arrow(ctx, xs, ty(y), xs, ty(y) - len, rgba(C.coral, 0.85), 3, 10); });
      }
      if (step >= 2) {
        const a = E.clamp((clock - 5.2) / 0.8);
        richText(ctx, [['∇log ', 'n'], ['p', 'i'], ['t', 'sub'], ['(', 'n'], ['x', 'i'], [') = 𝔼[ ', 'n'], ['β', 'i'], ['F', 'i'], ['(', 'n'], ['X', 'i'], ['N', 'sub'], [') | ', 'n'], ['X', 'i'], ['t', 'sub'], [' = ', 'n'], ['x', 'i'], [' ]', 'n']], (X0 + X1) / 2, Y1 + 62, { size: 27, color: C.navy, align: 'center', alpha: a });
      }
    }
    return {
      frame(dt) { clock += dt; if (clock > 12) { clock = 0; makeBridges(); } draw(); },
      step(k) { step = k; if (k >= 1 && clock < 3.8) clock = 3.8; }, draw
    };
  };

  // ------------------------------------------------------------------
  // The fixed-point loop + real 1D torus training run (FP_DATA)
  // ------------------------------------------------------------------
  ANIMS.fpLoop = function (S, o) {
    const ctx = S.ctx, rng = makeRng(4);
    const R = FP.rounds, nR = R.length, PH = 0.95, ROUND = 4 * PH;
    let clock = 0;
    const pw = 430, ph = 260;
    const panels = [
      { x: 0, y: 0, name: 'Generate', k: 1 }, { x: 520, y: 0, name: 'Label', k: 2 },
      { x: 520, y: 360, name: 'Interpolate', k: 3 }, { x: 0, y: 360, name: 'Regress', k: 4 }];
    const HX = 1040, HW = S.w - HX, HY = 40, HH = S.h - 70;
    const prior = []; for (let i = 0; i < 16; i++) prior.push([rng.u(), rng.u()]);
    const cent = [[0.28, 0.32], [0.7, 0.3], [0.5, 0.72]]; const samp = [];
    for (let i = 0; i < 16; i++) { const c = cent[i % 3]; samp.push([c[0] + 0.09 * rng.normal(), c[1] + 0.09 * rng.normal(), i % 3]); }
    function miniBox(x, y, s, pts, dashed, alpha = 1, arrows = 0) {
      roundRect(ctx, x, y, s, s, 6, '#fff', rgba(C.inkSoft, 0.5), 1.6, dashed ? [6, 5] : null);
      pts.forEach((p, i) => {
        const px = x + 8 + p[0] * (s - 16), py = y + 8 + p[1] * (s - 16);
        flatAtom(ctx, px, py, 7, i % 4 === 0 ? C.orange : C.teal, alpha);
        if (arrows > 0 && p.length > 2) { const c = cent[p[2]]; const dx = c[0] - p[0], dy = c[1] - p[1]; const m = Math.hypot(dx, dy) + 1e-6; const L = Math.min(30, 120 * m) * arrows; arrow(ctx, px, py, px + dx / m * L, py + dy / m * L, C.coral, 2.2, 8); }
      });
    }
    function drawPanel(P, active, u) {
      const a = active ? 1 : 0.55;
      ctx.save(); ctx.globalAlpha = a;
      roundRect(ctx, P.x, P.y, pw, ph, 16, '#fff', active ? C.teal : rgba(C.inkSoft, 0.25), active ? 3 : 1.5);
      U.circle(ctx, P.x + 30, P.y + 32, 16, active ? C.teal : C.muted);
      text(ctx, String(P.k), P.x + 30, P.y + 40, { size: 20, weight: 700, color: '#fff', align: 'center' });
      text(ctx, P.name, P.x + 56, P.y + 41, { size: 26, weight: 650, color: C.ink });
      const bx = P.x + 26, by = P.y + 70;
      if (P.k === 1) {
        miniBox(bx, by + 10, 120, prior, true);
        ctx.strokeStyle = C.teal; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i <= 60; i++) { const xx = bx + 140 + i * 1.6, yy = by + 70 + 9 * Math.sin(i * 0.55 + (active ? u * 20 : 0)); if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke();
        arrow(ctx, bx + 230, by + 70, bx + 250, by + 70, C.teal, 3, 12);
        miniBox(bx + 258, by + 10, 120, samp.map(p => [p[0], p[1]]), false);
        richText(ctx, [['X', 'i'], ['N', 'sub'], [' ~ ', 'n'], ['p', 'i'], ['θ', 'sub'], ['  (forward process P→, no gradients)', 'n']], bx, by + 170, { size: 19, color: C.inkSoft });
      } else if (P.k === 2) {
        miniBox(bx, by + 10, 120, samp, false, 1, active ? E.out(u * 1.6) : 1);
        arrow(ctx, bx + 150, by + 70, bx + 210, by + 70, C.muted, 2.5, 10);
        for (let s = 2; s >= 0; s--) roundRect(ctx, bx + 226 + s * 7, by + 40 - s * 7, 140, 64, 10, s ? '#F1F3F5' : '#fff', rgba(C.inkSoft, 0.45), 1.4);
        text(ctx, 'replay buffer', bx + 296, by + 79, { size: 19, color: C.ink, align: 'center', weight: 600 });
        richText(ctx, [['forces ', 'n'], ['β', 'i'], ['F', 'i'], ['(', 'n'], ['X', 'i'], ['N', 'sub'], [')', 'n'], ['  — the only oracle calls', 'n']], bx, by + 170, { size: 19, color: C.inkSoft });
      } else if (P.k === 3) {
        const uu = active ? 0.5 + 0.35 * Math.sin(u * Math.PI * 2) : 0.5;
        miniBox(bx, by + 18, 100, prior.slice(0, 12), true);
        const mid = prior.slice(0, 12).map((p, i) => { const q = samp[i]; return [p[0] + (q[0] - p[0]) * uu, p[1] + (q[1] - p[1]) * uu]; });
        miniBox(bx + 140, by + 18, 100, mid, false);
        miniBox(bx + 280, by + 18, 100, samp.slice(0, 12), false);
        arrow(ctx, bx + 104, by + 68, bx + 136, by + 68, C.muted, 2, 9); arrow(ctx, bx + 276, by + 68, bx + 244, by + 68, C.muted, 2, 9);
        richText(ctx, [['X', 'i'], ['0', 'sub']], bx + 50, by + 14, { size: 19, color: C.inkSoft, align: 'center' });
        richText(ctx, [['X', 'i'], ['t', 'sub']], bx + 190, by + 14, { size: 19, color: C.inkSoft, align: 'center' });
        richText(ctx, [['X', 'i'], ['N', 'sub']], bx + 330, by + 14, { size: 19, color: C.inkSoft, align: 'center' });
        richText(ctx, [['fresh noise ', 'n'], ['X', 'i'], ['0', 'sub'], [', ', 'n'], ['t', 'i'], ['; buffered ', 'n'], ['X', 'i'], ['N', 'sub'], ['  (free: no oracle)', 'n']], bx, by + 170, { size: 19, color: C.inkSoft });
      } else {
        const L = [[0, 3], [1, 4], [2, 3]]; const nodes = [];
        L.forEach(([li, n], j) => { for (let i = 0; i < n; i++) nodes.push({ x: bx + 40 + j * 95, y: by + 28 + (i + 0.5) * (110 / n), l: j }); });
        nodes.forEach(p => nodes.forEach(q => { if (q.l === p.l + 1) { ctx.strokeStyle = rgba(C.gold, active ? 0.35 + 0.35 * Math.abs(Math.sin(u * 9 + p.y)) : 0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); } }));
        nodes.forEach(p => U.circle(ctx, p.x, p.y, 8, C.gold, '#fff', 1.5));
        roundRect(ctx, bx + 255, by + 30, 96, 40, 9, rgba(C.teal, 0.12), C.teal, 1.6); richText(ctx, [['b', 'i'], ['θ', 'sub']], bx + 303, by + 58, { size: 22, color: C.tealDark, align: 'center' });
        roundRect(ctx, bx + 255, by + 82, 96, 40, 9, rgba(C.blue, 0.12), C.blue, 1.6); richText(ctx, [['s', 'i'], ['θ', 'sub']], bx + 303, by + 110, { size: 22, color: C.blue, align: 'center' });
        richText(ctx, [['min ‖', 'n'], ['s', 'i'], ['θ', 'sub'], ['(', 'n'], ['X', 'i'], ['t', 'sub'], [', ', 'n'], ['t', 'i'], [') − ', 'n'], ['β', 'i'], ['F', 'i'], ['(', 'n'], ['X', 'i'], ['N', 'sub'], [')‖² + ‖', 'n'], ['b', 'i'], ['θ', 'sub'], [' − ', 'n'], ['b̂', 'i'], ['‖²', 'n']], bx, by + 170, { size: 19, color: C.inkSoft });
      }
      ctx.restore();
    }
    function draw() {
      S.clear();
      const r = Math.floor(clock / ROUND) % (nR + 2), phase = Math.floor((clock % ROUND) / PH), u = ((clock % ROUND) % PH) / PH;
      const rr = Math.min(r, nR - 1);
      panels.forEach((P, i) => drawPanel(P, i === phase, u));
      // loop arrows
      const ac = C.teal;
      curvedArrow(ctx, [pw + 4, 120, 475, 90, 516, 120], ac, 3, 13);
      curvedArrow(ctx, [520 + pw / 2 + 120, ph + 6, 520 + pw / 2 + 150, 310, 520 + pw / 2 + 120, 356], ac, 3, 13);
      curvedArrow(ctx, [516, 360 + 140, 475, 360 + 170, pw + 4, 360 + 140], ac, 3, 13);
      curvedArrow(ctx, [pw / 2 - 120, 356, pw / 2 - 150, 310, pw / 2 - 120, ph + 6], ac, 3, 13);
      text(ctx, 'Boltzmann is', 476, 300, { size: 21, color: C.navy, align: 'center', weight: 650 });
      text(ctx, 'a fixed point', 476, 326, { size: 21, color: C.navy, align: 'center', weight: 650 });
      // histogram of model samples for the current round
      roundRect(ctx, HX, 0, HW, S.h, 18, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      text(ctx, 'Live: model samples after each round', HX + 28, 44, { size: 24, weight: 650, color: C.ink });
      text(ctx, '1D torus toy, ATLAS training rule (forces only)', HX + 28, 74, { size: 18, color: C.muted });
      const gx = HX + 40, gw = HW - 80, gy1 = S.h - 120, gy0 = 150;
      const prevH = R[Math.max(0, rr - 1)].h, curH = R[rr].h, mix_ = phase === 0 && r > 0 && r < nR ? E.inOut(u) : 1;
      const H = curH.map((v, i) => prevH[i] + (v - prevH[i]) * mix_);
      const ymax = Math.max(...FP.target) * 1.12, nb = H.length;
      ctx.strokeStyle = rgba(C.inkSoft, 0.4); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, gy1); ctx.lineTo(gx + gw, gy1); ctx.stroke();
      for (let i = 0; i < nb; i++) { const h = Math.min(1, H[i] / ymax) * (gy1 - gy0); ctx.fillStyle = rgba(C.teal, 0.8); ctx.fillRect(gx + i * gw / nb + 0.5, gy1 - h, gw / nb - 1, h); }
      ctx.beginPath(); FP.target.forEach((v, i) => { const x = gx + (i + 0.5) * gw / nb, y = gy1 - v / ymax * (gy1 - gy0); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.strokeStyle = C.coral; ctx.lineWidth = 3; ctx.stroke();
      text(ctx, 'target', gx + gw - 8, gy0 + 6, { size: 20, color: C.coral, align: 'right', weight: 600 });
      text(ctx, 'model', gx + gw - 8, gy0 + 32, { size: 20, color: C.tealDark, align: 'right', weight: 600 });
      text(ctx, `round ${rr}`, gx, gy0 - 22, { size: 30, color: C.navy, weight: 700 });
      text(ctx, rr === 0 ? 'initial model = prior' : '', gx + 150, gy0 - 22, { size: 20, color: C.muted });
      text(ctx, `force evaluations: ${(rr * 10000).toLocaleString()}`, gx, gy1 + 44, { size: 20, color: C.inkSoft });
      text(ctx, 'x on the circle', gx + gw, gy1 + 44, { size: 19, color: C.muted, align: 'right' });
    }
    return { frame(dt) { clock += dt; draw(); }, draw, ff: 3 * ROUND + 1.4 * PH };
  };

  // ------------------------------------------------------------------
  // Path weights: forward/backward paths, raw vs reweighted histogram, running log Z
  // ------------------------------------------------------------------
  ANIMS.pathWeights = function (S, o) {
    const ctx = S.ctx, T = vmTarget();
    const LW = 800, RX = 880, RW = S.w - RX;
    let clock = 0, step = 0;
    // builds at which the reweighted histogram and the log Z inset appear (zFirst: log Z first);
    // startStep: the paths start drawing only once the canvas is revealed
    const STEP_RW = o && o.rwStep !== undefined ? o.rwStep : o && o.zFirst ? 2 : 1;
    const STEP_Z = o && o.zStep !== undefined ? o.zStep : o && o.zFirst ? 1 : 2;
    const START = (o && o.startStep) || 0;
    const last = FP.rounds[FP.rounds.length - 1];
    const paths = FP.paths; // 60 x 51 (wrapped)
    const nb = last.h.length;
    const hAt = (x) => last.h[Math.min(nb - 1, Math.floor(x * nb))];
    const W = paths.map(p => { const x1 = p[p.length - 1]; return T.p(x1) / Math.max(0.05, hAt(x1)); });
    const wmax = Math.max(...W);
    function draw() {
      S.clear();
      // left: paths
      roundRect(ctx, 0, 0, LW, S.h, 18, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      text(ctx, 'Forward paths, each with a weight', 28, 44, { size: 24, weight: 650, color: C.ink });
      const X0 = 90, X1 = LW - 150, Y0 = 90, Y1 = S.h - 70;
      const tx = (t) => X0 + t * (X1 - X0), ty = (x) => Y1 - x * (Y1 - Y0);
      ctx.fillStyle = rgba(C.muted, 0.22); ctx.fillRect(X0 - 40, Y0, 40, Y1 - Y0);
      const grid = []; for (let i = 0; i <= 200; i++) grid.push(i / 200); const tv = grid.map(T.p), tm = Math.max(...tv);
      vDensity(ctx, grid, tv.map(v => v / tm), X1, Y0, Y1, 90, 1, rgba(C.coral, 0.16), C.coral);
      const nShow = Math.min(paths.length, 4 + Math.floor(clock * 14));
      for (let i = 0; i < nShow; i++) {
        const p = paths[i]; ctx.beginPath(); let prev = null;
        for (let k = 0; k < p.length; k++) { const t = k / (p.length - 1), X = tx(t), Y = ty(p[k]); if (prev !== null && Math.abs(p[k] - prev) > 0.5) ctx.moveTo(X, Y); else if (k === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); prev = p[k]; }
        ctx.strokeStyle = i === 7 ? C.teal : rgba(C.teal, 0.28); ctx.lineWidth = i === 7 ? 3 : 1.3; ctx.stroke();
        const wr = Math.sqrt(W[i] / wmax);
        U.circle(ctx, tx(1) + 16, ty(p[p.length - 1]), 2.5 + 7 * wr, rgba(C.navy, 0.45));
      }
      // backward dashed version of highlighted path
      if (nShow > 7) {
        const p = paths[7]; ctx.save(); ctx.setLineDash([7, 6]); ctx.beginPath(); let prev = null;
        for (let k = 0; k < p.length; k++) { const t = k / (p.length - 1), X = tx(t), Y = ty(p[k]) + 9; if (prev !== null && Math.abs(p[k] - prev) > 0.5) ctx.moveTo(X, Y); else if (k === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); prev = p[k]; }
        ctx.strokeStyle = C.blue; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore();
      }
      text(ctx, 'forward P→', 28, S.h - 26, { size: 19, color: C.teal, weight: 600 });
      text(ctx, '- - backward P←', 150, S.h - 26, { size: 19, color: C.blue, weight: 600 });
      text(ctx, '● path weight w', 330, S.h - 26, { size: 19, color: C.navy, weight: 600 });
      // right: histogram raw vs reweighted
      roundRect(ctx, RX, 0, RW, S.h, 18, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      const gx = RX + 40, gw = RW - 80, gy1 = S.h - 70, gy0 = 120; const ymax = Math.max(...FP.target) * 1.15;
      text(ctx, step >= STEP_RW ? 'Reweighted by path weights' : 'Raw samples of an imperfect model', RX + 28, 44, { size: 24, weight: 650, color: step >= STEP_RW ? C.navy : C.tealDark });
      const raw = last.h, rw = last.hw, a = step >= STEP_RW ? E.clamp(clock - this._t1 || 0) : 0;
      for (let i = 0; i < nb; i++) {
        const v = raw[i] + (rw[i] - raw[i]) * E.inOut(a); const h = Math.min(1, v / ymax) * (gy1 - gy0);
        ctx.fillStyle = step >= STEP_RW ? mix(C.teal, C.navy, E.inOut(a)) : rgba(C.teal, 0.82); ctx.fillRect(gx + i * gw / nb + 0.5, gy1 - h, gw / nb - 1, h);
      }
      ctx.beginPath(); FP.target.forEach((v, i) => { const x = gx + (i + 0.5) * gw / nb, y = gy1 - v / ymax * (gy1 - gy0); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.strokeStyle = C.coral; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = rgba(C.inkSoft, 0.4); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, gy1); ctx.lineTo(gx + gw, gy1); ctx.stroke();
      const tv1 = 0.5 * raw.reduce((s, v, i) => s + Math.abs(v - FP.target[i]), 0) / nb, tv2 = 0.5 * rw.reduce((s, v, i) => s + Math.abs(v - FP.target[i]), 0) / nb;
      text(ctx, `error (TV): ${(step >= STEP_RW ? tv1 + (tv2 - tv1) * E.inOut(a) : tv1).toFixed(3)}`, RX + RW - 30, 44, { size: 21, color: C.inkSoft, align: 'right' });
      text(ctx, 'target', gx + gw - 8, gy0 - 30, { size: 20, color: C.coral, align: 'right', weight: 600 });
      // running log Z
      if (step >= STEP_Z) {
        const ix = RX + 46, iy = 128, iw = 250, ih = 120; const b = E.clamp((clock - (this._t2 || 0)) / 2.0);
        roundRect(ctx, ix - 10, iy - 40, iw + 30, ih + 70, 12, 'rgba(255,255,255,0.92)', rgba(C.inkSoft, 0.25), 1.2);
        text(ctx, 'log Z estimate vs # samples', ix, iy - 14, { size: 17, color: C.ink, weight: 600 });
        const run = FP.runLogZ, n = Math.max(2, Math.floor(run.length * b));
        const yv = (v) => iy + ih / 2 - v / 0.5 * (ih / 2);
        ctx.strokeStyle = rgba(C.coral, 0.9); ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ix, yv(0)); ctx.lineTo(ix + iw, yv(0)); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); for (let i = 0; i < n; i++) { const x = ix + i / (run.length - 1) * iw, y = yv(Math.max(-0.5, Math.min(0.5, run[i]))); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.strokeStyle = C.navy; ctx.lineWidth = 2.5; ctx.stroke();
        text(ctx, 'true log Z', ix + iw, yv(0) - 8, { size: 16, color: C.coral, align: 'right' });
      }
    }
    return {
      frame(dt) { if (step >= START) clock += dt; draw.call(this); }, draw() { draw.call(this); },
      step(k) { if (k >= START && step < START) clock = 0; if (k >= STEP_RW && step < STEP_RW) this._t1 = clock; if (k >= STEP_Z && step < STEP_Z) this._t2 = clock; step = k; }
    };
  };

  // ------------------------------------------------------------------
  // Sequential Monte Carlo steering toward a reward (training-free)
  // ------------------------------------------------------------------
  ANIMS.smcSteer = function (S, o) {
    const ctx = S.ctx; let rng = makeRng(9);
    const X0 = 60, X1 = S.w - 230, Y0 = 50, Y1 = S.h - 60, K = 48, N = 20;
    const tx = (t) => X0 + t * (X1 - X0), ty = (x) => Y1 - x * (Y1 - Y0);
    const goal = 0.8, eta = 9;
    const r = (x) => -((x - goal) ** 2) / 0.02;
    let parts, dead, k, clock, acc;
    function reset() {
      parts = []; dead = []; k = 0; clock = 0; acc = 0;
      for (let i = 0; i < N; i++) { const x = 0.5 + 0.08 * rng.normal(); parts.push({ hist: [x], logw: 0 }); }
    }
    reset();
    function stepSMC() {
      const t = k / K, t1 = (k + 1) / K, h = 1 / K;
      parts.forEach(p => { const x = p.hist[p.hist.length - 1]; const xn = x + h * 2.2 * (0.42 - x) + 0.27 * Math.sqrt(h) * rng.normal(); p.hist.push(xn); p.logw += eta * (t1 * r(xn) - t * r(x)) * 0.05; });
      k++;
      if (k % 8 === 0 && k < K) { // resample
        const m = Math.max(...parts.map(p => p.logw)); const w = parts.map(p => Math.exp(p.logw - m)); const sw = w.reduce((a, b) => a + b, 0);
        const ess = sw * sw / w.reduce((a, b) => a + b * b, 0);
        const cum = []; let c = 0; w.forEach(v => { c += v / sw; cum.push(c); });
        const counts = new Array(N).fill(0); for (let i = 0; i < N; i++) { const u = (i + rng.u()) / N; let j = 0; while (j < N - 1 && cum[j] < u) j++; counts[j]++; }
        const np = [];
        parts.forEach((p, i) => { if (counts[i] === 0) dead.push({ hist: p.hist.slice(), at: k }); for (let c2 = 0; c2 < counts[i]; c2++) np.push({ hist: p.hist.slice(), logw: 0 }); });
        parts = np;
      }
    }
    function draw() {
      S.clear();
      ctx.fillStyle = rgba(C.yellow, 0.25); ctx.fillRect(X0, ty(goal + 0.07), X1 - X0, ty(goal - 0.07) - ty(goal + 0.07));
      text(ctx, 'reward r(x) high', X0 + 8, ty(goal + 0.07) - 10, { size: 19, color: C.gold, weight: 600 });
      for (let j = 0; j <= 6; j++) { const x = tx(j / 6); ctx.strokeStyle = rgba(C.inkSoft, 0.18); ctx.setLineDash([4, 6]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, Y1); ctx.stroke(); ctx.setLineDash([]); }
      dead.forEach(d => { ctx.beginPath(); d.hist.forEach((x, i) => { const X = tx(i / K), Y = ty(x); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.strokeStyle = rgba(C.muted, 0.55); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]); const lx = tx((d.hist.length - 1) / K), ly = ty(d.hist[d.hist.length - 1]); ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx - 7, ly - 7); ctx.lineTo(lx + 7, ly + 7); ctx.moveTo(lx + 7, ly - 7); ctx.lineTo(lx - 7, ly + 7); ctx.stroke(); });
      parts.forEach(p => { ctx.beginPath(); p.hist.forEach((x, i) => { const X = tx(i / K), Y = ty(x); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.strokeStyle = rgba(C.teal, 0.7); ctx.lineWidth = 2; ctx.stroke(); const x = p.hist[p.hist.length - 1]; U.circle(ctx, tx((p.hist.length - 1) / K), ty(x), 6, C.teal, '#fff', 1.5); });
      text(ctx, 't = 0', X0, Y1 + 32, { size: 19, color: C.muted, align: 'center' });
      text(ctx, 't = N', X1, Y1 + 32, { size: 19, color: C.muted, align: 'center' });
      text(ctx, 'resample: drop low weight ✕, copy high weight', (X0 + X1) / 2, Y1 + 32, { size: 19, color: C.inkSoft, align: 'center' });
      // terminal densities: base vs tilted
      const DX = X1 + 40;
      const base = (x) => Math.exp(-((x - 0.42) ** 2) / (2 * 0.085 ** 2)), tilt = (x) => base(x) * Math.exp(eta * 0.05 * r(x));
      let mt = 0; for (let i = 0; i <= 100; i++) mt = Math.max(mt, tilt(i / 100));
      ctx.beginPath(); ctx.moveTo(DX, Y1); for (let i = 0; i <= 100; i++) ctx.lineTo(DX + base(i / 100) * 120, ty(i / 100)); ctx.lineTo(DX, Y0); ctx.closePath(); ctx.fillStyle = rgba(C.muted, 0.3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(DX, Y1); for (let i = 0; i <= 100; i++) ctx.lineTo(DX + tilt(i / 100) / mt * 120, ty(i / 100)); ctx.lineTo(DX, Y0); ctx.closePath(); ctx.fillStyle = rgba(C.teal, 0.3); ctx.fill(); ctx.strokeStyle = C.teal; ctx.lineWidth = 2; ctx.stroke();
      text(ctx, 'base π', DX + 70, ty(0.32), { size: 19, color: C.inkSoft });
      text(ctx, 'tilted', DX + 70, ty(goal) + 5, { size: 19, color: C.tealDark, weight: 600 });
      richText(ctx, [['q', 'i'], ['N', 'sub'], [' ∝ ', 'n'], ['π', 'i'], [' e', 'n'], ['ηr', 'sup']], DX + 64, Y0 + 14, { size: 22, color: C.tealDark, align: 'center' });
    }
    return {
      frame(dt) { clock += dt; acc += dt; const st = 4.6 / K; while (acc > st && k < K) { acc -= st; stepSMC(); } if (k >= K && clock > 7.5) { rng = makeRng(Math.floor(clock * 1000) % 9973); reset(); } draw(); }, draw, ff: 6
    };
  };
})();
