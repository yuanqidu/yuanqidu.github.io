/* Theory animations (blog notation: t = 0 prior … t = N target; forward P→ = generation, backward P← = noising):
   diffusion primer, denoising score matching, path weight along a path. */
(function () {
  'use strict';
  const { C, rgba, mix, E, roundRect, arrow, text, richText, makeRng } = U;

  // ring of Gaussian modes used as the "data" distribution
  function ringGMM() {
    const K = 7, R0 = 2.0, sd = 0.17, mu = [];
    for (let k = 0; k < K; k++) { const a = 2 * Math.PI * k / K + 0.35; mu.push([R0 * Math.cos(a), R0 * Math.sin(a)]); }
    const w = new Array(K).fill(1 / K);
    // variance-preserving noising: X_t = alpha X_N + s eps, alpha^2 + s^2 = 1
    function score(x, y, alpha, s2opt) {
      const s2 = s2opt === undefined ? 1 - alpha * alpha : s2opt, ls = [], vs = []; let m = -Infinity;
      for (let k = 0; k < K; k++) { const v = alpha * alpha * sd * sd + s2; const dx = x - alpha * mu[k][0], dy = y - alpha * mu[k][1]; const l = Math.log(w[k]) - (dx * dx + dy * dy) / (2 * v) - Math.log(v); ls.push(l); vs.push(v); m = Math.max(m, l); }
      let Z = 0; ls.forEach((l, k) => { ls[k] = Math.exp(l - m); Z += ls[k]; });
      let gx = 0, gy = 0; for (let k = 0; k < K; k++) { const r = ls[k] / Z; gx += r * (-(x - alpha * mu[k][0]) / vs[k]); gy += r * (-(y - alpha * mu[k][1]) / vs[k]); }
      return [gx, gy];
    }
    function sample(rng) { const k = rng.int(K); return [mu[k][0] + sd * rng.normal(), mu[k][1] + sd * rng.normal()]; }
    return { mu, sd, K, score, sample };
  }

  // ------------------------------------------------------------------
  // Diffusion primer: noise the data (backward process), then generate with the exact score (forward process)
  // ------------------------------------------------------------------
  ANIMS.diffusionPrimer = function (S, o) {
    const ctx = S.ctx, G = ringGMM(); let rng = makeRng(5), clock = 0;
    const NP = 360, beta = 8;
    const box = Math.min(S.w - 40, S.h - 120), bx = (S.w - box) / 2, by = 16, sc = box / 7.2;
    const toPx = (x, y) => [bx + box / 2 + x * sc, by + box / 2 - y * sc];
    const T0 = 1.3, T1 = 3.6, T2 = 0.9, T3 = 3.8, T4 = 2.2, P = T0 + T1 + T2 + T3 + T4;
    let pts = [], gen = [];
    function reset() { pts = []; for (let i = 0; i < NP; i++) pts.push(G.sample(rng)); gen = []; }
    reset();
    const alphaOf = (tau) => Math.exp(-0.5 * beta * tau);
    function phase() {
      const c = clock % P;
      if (c < T0) return { n: 'data', tau: 0 };
      if (c < T0 + T1) return { n: 'noise', tau: (c - T0) / T1 };
      if (c < T0 + T1 + T2) return { n: 'prior', tau: 1 };
      if (c < T0 + T1 + T2 + T3) return { n: 'gen', tau: 1 - (c - T0 - T1 - T2) / T3 };
      return { n: 'done', tau: 0 };
    }
    let lastTau = 0, lastPhase = 'data';
    function stepDynamics(ph) {
      const dtau = Math.abs(ph.tau - lastTau);
      if (ph.n === 'noise' && dtau > 0) {
        const a = Math.exp(-0.5 * beta * dtau), sd = Math.sqrt(1 - a * a);
        pts.forEach(p => { p[0] = a * p[0] + sd * rng.normal(); p[1] = a * p[1] + sd * rng.normal(); });
      }
      if (ph.n === 'gen' && lastPhase !== 'gen') gen = pts.map(p => [p[0], p[1]]);
      if (ph.n === 'gen' && dtau > 0) {
        const nsub = Math.max(1, Math.ceil(dtau / 0.004)), h = dtau / nsub;
        for (let s = 0; s < nsub; s++) {
          const tau = lastTau - s * h, al = alphaOf(tau);
          gen.forEach(p => { const [gx, gy] = G.score(p[0], p[1], al); p[0] += (0.5 * beta * p[0] + beta * gx) * h + Math.sqrt(beta * h) * rng.normal(); p[1] += (0.5 * beta * p[1] + beta * gy) * h + Math.sqrt(beta * h) * rng.normal(); });
        }
      }
      if (ph.n === 'data' && lastPhase === 'done') { rng = makeRng(Math.floor(clock * 100) % 9973); reset(); }
      lastTau = ph.tau; lastPhase = ph.n;
    }
    function draw() {
      S.clear();
      const ph = phase();
      roundRect(ctx, bx, by, box, box, 14, '#fff', rgba(C.inkSoft, 0.18), 1.5);
      // score field during generation
      if (ph.n === 'gen' || ph.n === 'prior') {
        const al = alphaOf(ph.tau);
        for (let gx = -3.2; gx <= 3.21; gx += 0.53) for (let gy = -3.2; gy <= 3.21; gy += 0.53) {
          const [sx, sy] = G.score(gx, gy, al); const m = Math.hypot(sx, sy); if (m < 1e-6) continue;
          const len = Math.min(22, 9 * Math.log1p(m)); const [x, y] = toPx(gx, gy);
          arrow(ctx, x, y, x + sx / m * len, y - sy / m * len, rgba(C.teal, 0.55), 1.8, 7);
        }
      }
      const showGen = ph.n === 'gen' || ph.n === 'done';
      const fade = ph.n === 'noise' ? ph.tau : ph.n === 'prior' ? 1 : 0;
      if (!showGen) pts.forEach(p => { const [x, y] = toPx(p[0], p[1]); U.circle(ctx, x, y, 3.4, mix(C.ink, C.muted, fade)); });
      else gen.forEach(p => { const [x, y] = toPx(p[0], p[1]); U.circle(ctx, x, y, 3.6, C.tealDark); });
      // labels
      const lab = { data: 'data  (t = N)', noise: 'noising: backward process P←', prior: 'noise  p₀ = 𝒩(0, I)  (t = 0)', gen: 'generation: forward process P→, guided by the score', done: 'new samples  (t = N)' }[ph.n];
      const col = ph.n === 'gen' || ph.n === 'done' ? C.tealDark : ph.n === 'noise' ? C.blue : C.ink;
      text(ctx, lab, bx + 18, by + 34, { size: 21, weight: 650, color: col });
      // time bar (prior on the left, data on the right, as in the blog)
      const ty = by + box + 46, x0 = bx + 20, x1 = bx + box - 20, u = 1 - ph.tau;
      ctx.strokeStyle = rgba(C.inkSoft, 0.25); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, ty); ctx.lineTo(x1, ty); ctx.stroke();
      ctx.strokeStyle = ph.n === 'noise' ? C.blue : C.teal; ctx.beginPath(); ctx.moveTo(x0, ty); ctx.lineTo(x0 + (x1 - x0) * u, ty); ctx.stroke();
      U.circle(ctx, x0 + (x1 - x0) * u, ty, 10, '#fff', ph.n === 'noise' ? C.blue : C.teal, 4);
      text(ctx, 't = 0  prior', x0, ty + 36, { size: 19, color: C.inkSoft });
      text(ctx, 'data  t = N', x1, ty + 36, { size: 19, color: C.inkSoft, align: 'right' });
    }
    return { frame(dt) { clock += dt; stepDynamics(phase()); draw(); }, draw, ff: T0 + T1 + T2 + T3 + 0.6 };
  };

  // ------------------------------------------------------------------
  // Denoising score matching: noisy samples labelled by their clean source; labels average to the score
  // ------------------------------------------------------------------
  ANIMS.dsmDemo = function (S, o) {
    const ctx = S.ctx, G = ringGMM(), rng = makeRng(8); let clock = 0, step = 0, acc = 0;
    const alpha = 1, s = 0.62;
    const box = Math.min(S.w - 30, S.h - 40), bx = (S.w - box) / 2, by = 10, sc = box / 7.0;
    const toPx = (x, y) => [bx + box / 2 + x * sc, by + box / 2 - y * sc];
    const data = []; for (let i = 0; i < 180; i++) data.push(G.sample(rng));
    const pairs = [];
    function addPair() {
      const xN = data[rng.int(data.length)], e = [rng.normal(), rng.normal()];
      const xt = [alpha * xN[0] + s * e[0], alpha * xN[1] + s * e[1]];
      pairs.push({ xN, xt, born: clock }); if (pairs.length > 22) pairs.shift();
    }
    for (let i = 0; i < 12; i++) addPair();
    function draw() {
      S.clear();
      roundRect(ctx, bx, by, box, box, 14, '#fff', rgba(C.inkSoft, 0.18), 1.5);
      data.forEach(p => { const [x, y] = toPx(p[0], p[1]); U.circle(ctx, x, y, 3, rgba(C.ink, 0.55)); });
      if (step >= 1) {
        for (let gx = -3.1; gx <= 3.11; gx += 0.48) for (let gy = -3.1; gy <= 3.11; gy += 0.48) {
          const [sx, sy] = G.score(gx, gy, alpha, s * s); const m = Math.hypot(sx, sy); if (m < 1e-6) continue;
          const len = Math.min(24, 8 * Math.log1p(m)); const [x, y] = toPx(gx, gy);
          arrow(ctx, x, y, x + sx / m * len, y - sy / m * len, rgba(C.teal, 0.7), 2, 7);
        }
      }
      pairs.forEach(pr => {
        const age = clock - pr.born, a = Math.max(0.15, 1 - age / 7);
        const [x, y] = toPx(pr.xt[0], pr.xt[1]); const [cx, cy] = toPx(alpha * pr.xN[0], alpha * pr.xN[1]);
        ctx.save(); ctx.globalAlpha = a;
        ctx.setLineDash([3, 4]); ctx.strokeStyle = rgba(C.inkSoft, 0.6); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
        const dx = cx - x, dy = cy - y, m = Math.hypot(dx, dy) + 1e-9, L = Math.min(46, m);
        arrow(ctx, x, y, x + dx / m * L, y + dy / m * L, C.coral, 2.4, 9);
        U.circle(ctx, x, y, 5, C.orange, '#fff', 1.2);
        ctx.restore();
      });
      roundRect(ctx, bx + 8, by + 8, 380, step >= 1 ? 108 : 84, 10, 'rgba(255,255,255,0.93)', rgba(C.inkSoft, 0.2), 1);
      text(ctx, '● data  X_N ~ π', bx + 20, by + 32, { size: 18, color: C.ink, weight: 600 });
      text(ctx, '● noised  X_t = X_N + s_t ε', bx + 20, by + 56, { size: 18, color: C.orange, weight: 600 });
      text(ctx, '→ label: points back to its clean source', bx + 20, by + 80, { size: 18, color: C.coral, weight: 600 });
      if (step >= 1) text(ctx, '→ average of labels = the score ∇log p_t', bx + 20, by + 104, { size: 18, color: C.tealDark, weight: 650 });
    }
    return { frame(dt) { clock += dt; acc += dt; while (acc > 0.32) { acc -= 0.32; addPair(); } draw(); }, step(k) { step = k; }, draw };
  };

  // ------------------------------------------------------------------
  // Path weight along a real trajectory of the toy sampler: forward vs backward kernels, accumulating log w
  // ------------------------------------------------------------------
  ANIMS.pathKernel = function (S, o) {
    const ctx = S.ctx, D = FP_DATA.detail; let clock = 0;
    const nP = D.x.length, K = D.inc[0].length, per = 0.13, hold = 3.2, P = K * per + hold;
    const MX0 = 70, MX1 = Math.round(S.w * 0.6), MY0 = 40, MY1 = S.h - 70;
    const tx = (k) => MX0 + k / K * (MX1 - MX0), ty = (x) => MY1 - x * (MY1 - MY0);
    const logw = D.x.map((_, i) => D.inc[i].reduce((a, b) => a + b, 0) + D.end[i]);
    const lmax = Math.max(...logw);
    // cycle through paths that stay inside the plotted range (no wrap across the periodic boundary)
    const inside = (p) => { let u = p[0], lo = u, hi = u; for (let k = 1; k < p.length; k++) { u += U.minImage(p[k] - p[k - 1]); lo = Math.min(lo, u); hi = Math.max(hi, u); } return lo > 0.04 && hi < 0.96; };
    const SHOW = D.x.map((_, j) => j).filter(j => inside(D.x[j]));
    if (SHOW.length < 3) SHOW.splice(0, SHOW.length, ...D.x.map((_, j) => j));
    function drawPath(i, upto, color, lw) { U.torusPath(ctx, D.x[i], upto, tx, ty, [tx(0) - 2, MY0, tx(K) + 2, MY1], color, lw); }
    function gauss(cx, cy, mean, sd, dir, color, dashed, scale) { // vertical bell over state axis at time position cx
      ctx.save(); ctx.beginPath();
      for (let j = -40; j <= 40; j++) { const v = mean + j / 40 * 3.2 * sd; const d = Math.exp(-0.5 * (j / 40 * 3.2) ** 2); const X = cx + dir * d * scale, Y = cy(v); if (j === -40) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
      ctx.strokeStyle = color; ctx.lineWidth = 2.4; if (dashed) ctx.setLineDash([6, 5]); ctx.stroke(); ctx.restore();
    }
    function draw() {
      S.clear();
      const cyc = Math.floor(clock / P), i = SHOW[cyc % SHOW.length], c = clock % P, k = Math.min(K - 1, Math.floor(c / per)), done = c >= K * per;
      // main panel
      roundRect(ctx, MX0 - 50, MY0 - 30, MX1 - MX0 + 102, MY1 - MY0 + 60, 14, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      for (let j = 0; j < nP; j++) if (j !== i) drawPath(j, K, rgba(C.teal, 0.14), 1.2);
      drawPath(i, done ? K : k + 1, C.teal, 3);
      const xs = D.x[i];
      U.circle(ctx, tx(0), ty(xs[0]), 6, C.muted);
      if (!done) { U.circle(ctx, tx(k), ty(xs[k]), 6, C.tealDark); U.circle(ctx, tx(k + 1), ty(xs[k + 1]), 6, C.teal, '#fff', 1.5); }
      else U.circle(ctx, tx(K), ty(xs[K]), 7, C.tealDark);
      if (done) D.x.forEach((p, j) => { const r = 3 + 11 * Math.sqrt(Math.exp(logw[j] - lmax)); U.circle(ctx, tx(K) + 22, ty(p[K]), r, rgba(C.navy, j === i ? 0.85 : 0.4)); });
      text(ctx, 't = 0', tx(0), MY1 + 24, { size: 18, color: C.muted, align: 'center' });
      text(ctx, 't = N', tx(K), MY1 + 24, { size: 18, color: C.muted, align: 'center' });
      text(ctx, 'one generated path X₀:N', MX0 - 34, MY0 - 8, { size: 18, color: C.tealDark, weight: 650 });
      // zoom on one step: forward kernel over X_{t+1}, backward kernel over X_t
      const ZX = MX1 + 86, ZW = S.w - ZX - 10, ZY = 20, ZH = 290;
      roundRect(ctx, ZX, ZY, ZW, ZH, 14, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      const kk = done ? K - 1 : k, xa = xs[kk], xb = xs[kk + 1], sd = Math.sqrt(D.var[kk]);
      const dab = U.minImage(xb - xa), center = xa + dab / 2, span = Math.max(8 * sd, Math.abs(dab) * 3, 0.02);
      const zy = (v) => ZY + ZH / 2 + 12 - U.minImage(v - center) / span * (ZH - 120);
      const zxa = ZX + ZW * 0.3, zxb = ZX + ZW * 0.7;
      gauss(zxb, zy, D.mf[i][kk], sd, 1, C.teal, false, 70);
      gauss(zxa, zy, D.mb[i][kk], sd, -1, C.blue, true, 70);
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(zxa, zy(xa)); ctx.lineTo(zxb, zy(xb)); ctx.stroke();
      U.circle(ctx, zxa, zy(xa), 7, C.tealDark); U.circle(ctx, zxb, zy(xb), 7, C.teal, '#fff', 1.5);
      richText(ctx, [['X', 'i'], ['t', 'sub']], zxa + 14, zy(xa) - 14, { size: 19, color: C.ink });
      richText(ctx, [['X', 'i'], ['t+1', 'sub']], zxb - 14, zy(xb) - 14, { size: 19, color: C.ink, align: 'right' });
      richText(ctx, [['P', 'i'], ['→', 'sup'], ['(X', 'n'], ['t+1', 'sub'], [' | X', 'n'], ['t', 'sub'], [')', 'n']], zxb + 10, ZY + 34, { size: 19, color: C.tealDark });
      richText(ctx, [['P', 'i'], ['←', 'sup'], ['(X', 'n'], ['t', 'sub'], [' | X', 'n'], ['t+1', 'sub'], [')', 'n']], ZX + 14, ZY + 34, { size: 19, color: C.blue });
      const incv = D.inc[i][kk];
      text(ctx, `log P← / P→ = ${incv >= 0 ? '+' : ''}${incv.toFixed(2)}`, ZX + ZW / 2, ZY + ZH - 18, { size: 19, color: C.navy, align: 'center', weight: 650 });
      // accumulated log weight
      const BY = ZY + ZH + 30, BH = S.h - BY - 10;
      roundRect(ctx, ZX, BY, ZW, BH, 14, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      let cum = 0; const upto = done ? K : k + 1; for (let j = 0; j < upto; j++) cum += D.inc[i][j];
      const total = cum + (done ? D.end[i] : 0);
      text(ctx, 'log w  =  log π̃(X_N) − log p₀(X₀)  +  Σ log P← / P→', ZX + 16, BY + 32, { size: 17, color: C.inkSoft });
      text(ctx, done ? `log w = ${total.toFixed(2)}` : `Σ so far = ${cum.toFixed(2)}`, ZX + 16, BY + 76, { size: 28, color: C.navy, weight: 750 });
      text(ctx, done ? 'every path carries its own weight' : `step ${upto} / ${K}`, ZX + 16, BY + 108, { size: 18, color: done ? C.tealDark : C.muted, weight: done ? 650 : 500 });
    }
    return { frame(dt) { clock += dt; draw(); }, draw, ff: P * 0 + K * per + 1.2 };
  };
})();
