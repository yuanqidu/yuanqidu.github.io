/* Animations for "Pushing Probabilistic Machine Learning Out of Equilibrium" (talk).
   Notation follows the blog: t = 0 prior … t = N target; forward P→ = generation, backward P← = noising. */
(function () {
  'use strict';
  const { C, rgba, mix, E, roundRect, arrow, text, richText, makeRng } = U;
  const lnN = (x, m, s) => -0.5 * ((x - m) / s) * ((x - m) / s) - Math.log(s) - 0.9189385332;

  // ------------------------------------------------------------------
  // shared double well (same problem in all three demos): U = h (x^2-1)^2 - c x, h = 10
  // ------------------------------------------------------------------
  const DW = { h: 10, c: 0.5, s0: 1.5, M: 300, dt: 0.002 };
  DW.U1 = x => DW.h * (x * x - 1) * (x * x - 1) - DW.c * x;
  DW.dU1 = x => 4 * DW.h * x * (x * x - 1) - DW.c;
  DW.U0 = x => x * x / (2 * DW.s0 * DW.s0);
  DW.dU0 = x => x / (DW.s0 * DW.s0);
  DW.Ub = (x, b) => (1 - b) * DW.U0(x) + b * DW.U1(x);
  DW.dUb = (x, b) => (1 - b) * DW.dU0(x) + b * DW.dU1(x);
  DW.mala = (x, b, rng) => {
    const dt = DW.dt, sd = Math.sqrt(2 * dt), mx = x - DW.dUb(x, b) * dt, y = mx + sd * rng.normal(), my = y - DW.dUb(y, b) * dt;
    return Math.log(rng.u()) < -DW.Ub(y, b) + DW.Ub(x, b) + lnN(x, my, sd) - lnN(y, mx, sd) ? y : x;
  };
  DW.dens = (b) => { const xs = [], ys = []; let Z = 0; for (let x = -3; x <= 3; x += 0.004) Z += Math.exp(-DW.Ub(x, b)) * 0.004; for (let x = -2; x <= 2.0001; x += 0.02) { xs.push(x); ys.push(Math.exp(-DW.Ub(x, b)) / Z); } return [xs, ys]; };
  DW.eq = (b) => { let Z = 0, R = 0; for (let x = -3; x < 3; x += 0.002) { const e = Math.exp(-DW.Ub(x, b)); Z += e; if (x > 0) R += e; } return R / Z; };

  // a two-panel layout: histogram (top) and right-well mass curve (bottom)
  function dwPanels(S, o) {
    const ctx = S.ctx, L = 70, R = S.w - 26;
    const H1 = { y0: 64, y1: Math.round(S.h * 0.46) }, H2 = { y0: Math.round(S.h * 0.58), y1: S.h - 52 };
    const sx = (x) => L + (x + 2) / 4 * (R - L);
    function hist(xs, b, color, title) {
      text(ctx, title, L, 30, { size: 24, weight: 650, color: C.navy });
      const [gx, gy] = DW.dens(b), ymax = 3.1, sy = v => H1.y1 - Math.min(v, ymax) / ymax * (H1.y1 - H1.y0);
      const B = 44, bw = 4 / B, c = new Float64Array(B);
      xs.forEach(x => { const k = Math.floor((x + 2) / bw); if (k >= 0 && k < B) c[k] += 1 / (xs.length * bw); });
      for (let k = 0; k < B; k++) { const y = sy(c[k]); if (H1.y1 - y > 0.5) roundRect(ctx, sx(-2 + k * bw) + 1.5, y, (R - L) / B - 3, H1.y1 - y, 2.5, color); }
      ctx.save(); ctx.setLineDash([9, 6]); ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 2.6; ctx.beginPath(); gx.forEach((x, i) => { const p = [sx(x), sy(gy[i])]; if (i) ctx.lineTo(...p); else ctx.moveTo(...p); }); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L, H1.y1); ctx.lineTo(R, H1.y1); ctx.stroke();
      text(ctx, 'left well', sx(-1), H1.y1 + 26, { size: 19, color: C.muted, align: 'center' });
      text(ctx, 'right well', sx(1), H1.y1 + 26, { size: 19, color: C.muted, align: 'center' });
    }
    function curve(xmax, xlab, ticks, ref, lines, ylabel) {
      const sxc = v => L + v / xmax * (R - L), sy = v => H2.y1 - Math.max(0, Math.min(1, v)) * (H2.y1 - H2.y0);
      text(ctx, ylabel || 'mass in the right well', L, H2.y0 - 18, { size: 20, color: C.inkSoft });
      [0, 0.25, 0.5, 0.75, 1].forEach(v => { ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); text(ctx, v.toFixed(2), L - 10, sy(v) + 6, { size: 17, color: C.muted, align: 'right' }); });
      ticks.forEach(v => text(ctx, (v === 0 ? xlab + ' = ' : '') + v, sxc(v), H2.y1 + 26, { size: 17, color: C.muted, align: 'center' }));
      ctx.save(); ctx.setLineDash([9, 6]); ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 2.4; ctx.beginPath();
      if (Array.isArray(ref)) ref.forEach((p, i) => { if (i) ctx.lineTo(sxc(p[0]), sy(p[1])); else ctx.moveTo(sxc(p[0]), sy(p[1])); });
      else { ctx.moveTo(L, sy(ref)); ctx.lineTo(R, sy(ref)); }
      ctx.stroke(); ctx.restore();
      lines.forEach(l => {
        if (!l.pts.length) return;
        ctx.save(); ctx.globalAlpha = l.alpha === undefined ? 1 : l.alpha; ctx.strokeStyle = l.color; ctx.lineWidth = l.lw || 3; ctx.beginPath();
        l.pts.forEach((p, i) => { if (i) ctx.lineTo(sxc(p[0]), sy(p[1])); else ctx.moveTo(sxc(p[0]), sy(p[1])); }); ctx.stroke();
        const q = l.pts[l.pts.length - 1]; U.circle(ctx, sxc(q[0]), sy(q[1]), l.dot || 6, l.color, '#fff', 2);
        if (l.label) text(ctx, l.label, sxc(q[0]) - 12, sy(q[1]) - 12, { size: 18, weight: 650, color: l.color, align: 'right' });
        ctx.restore();
      });
    }
    return { hist, curve };
  }

  // 1 · equilibrium MCMC on the double well (chains start in the left well)
  ANIMS.dwMcmc = function (S, o) {
    const rng = makeRng(11), P = dwPanels(S, o), truth = DW.eq(1), Tmax = 60;
    let xs, t, curve;
    function reset() { xs = new Float64Array(DW.M).fill(-1); t = 0; curve = [[0, 0]]; }
    reset();
    function draw() {
      S.clear();
      P.hist(Array.from(xs), 1, C.blue, 'Equilibrium MCMC on the target');
      P.curve(Tmax, 't', [0, 20, 40, 60], truth, [{ pts: curve, color: C.blue }]);
      text(S.ctx, 'truth ' + truth.toFixed(2), S.w - 30, Math.round(S.h * 0.58) + (1 - truth) * (S.h - 52 - Math.round(S.h * 0.58)) - 12, { size: 18, color: C.inkSoft, align: 'right' });
    }
    return {
      frame(dt) {
        if (t >= Tmax) { t += dt; if (t > Tmax + 3) reset(); draw(); return; }
        for (let k = 0; k < 6; k++) { for (let i = 0; i < DW.M; i++) xs[i] = DW.mala(xs[i], 1, rng); t += DW.dt * 6; }
        let r = 0; for (const x of xs) if (x > 0) r++; curve.push([Math.min(t, Tmax), r / DW.M]); draw();
      }, draw, enter: reset
    };
  };

  // 2 · annealing: live chains (N = 5000) + precomputed runs for N = 500 … 10^6 revealed by builds
  ANIMS.dwAnneal = function (S, o) {
    // o.N: steps of the live run; o.ghosts: precomputed runs, drawn one after another once the live run ends
    const LAB = { 500: '500', 5000: '5,000', 50000: '5×10⁴', 1000000: '10⁶' };
    const rng = makeRng(12), P = dwPanels(S, o), A = window.ANNEAL, N = o.N || 5000, perFrame = o.perFrame || 40;
    const GAP = 0.5, DRAW = 1.2, HOLD = 6;
    let xs, k, live, t;
    function reset() { xs = new Float64Array(DW.M); for (let i = 0; i < DW.M; i++) xs[i] = DW.s0 * rng.normal(); k = 0; live = [[0, 0.5]]; t = 0; }
    reset();
    const ghost = (o.ghosts || [500, 50000, 1000000]).map(n => [n, LAB[n]]);
    const prog = j => Math.max(0, Math.min(1, (t - GAP - j * (GAP + DRAW)) / DRAW)); // t: seconds since the live run ended
    function draw() {
      S.clear();
      P.hist(Array.from(xs), k / N, C.blue, 'Annealing, N = ' + LAB[N] + ' steps');
      const lines = [];
      ghost.forEach(([n], j) => { const f = prog(j); if (f > 0) { const pts = A.runs[n].slice(0, Math.max(2, Math.ceil(f * A.runs[n].length))); lines.push({ pts, color: n === 1000000 ? C.teal : C.steel, lw: n === 1000000 ? 3.5 : 2.4, dot: 5, alpha: n === 1000000 ? 1 : 0.85 }); } });
      lines.push({ pts: live, color: C.blue });
      P.curve(1, 'β', [0, 0.25, 0.5, 0.75, 1], A.eq, lines);
      const ctx = S.ctx, lx = 70 + 270, ly0 = S.h - 52 - 16;
      const leg = [['N = ' + LAB[N] + ' (live)', C.blue]]; ghost.forEach(([n, lab], j) => { if (prog(j) >= 1) leg.push(['N = ' + lab + ' → ' + A.runs[n][A.runs[n].length - 1][1].toFixed(2), n === 1000000 ? C.teal : C.steel]); });
      leg.forEach(([tx, c], i) => { const y = ly0 - (leg.length - 1 - i) * 24; ctx.fillStyle = c; ctx.fillRect(lx - 250, y - 7, 22, 4); text(ctx, tx, lx - 220, y, { size: 18, weight: 600, color: c }); });
    }
    const END = GAP + ghost.length * (GAP + DRAW);
    return {
      frame(dt) {
        if (k >= N) { t += dt; if (t > END + HOLD) reset(); draw(); return; }
        for (let j = 0; j < perFrame && k < N; j++) { k++; const b = k / N; for (let i = 0; i < DW.M; i++) xs[i] = DW.mala(xs[i], b, rng); }
        let r = 0; for (const x of xs) if (x > 0) r++; live.push([k / N, r / DW.M]); draw();
      }, draw, enter: reset, ff: N / perFrame / 60 + END + 0.2
    };
  };

  // 3 · the analytically optimal transport (exact CDF map between consecutive pi_beta), N = 20 steps
  ANIMS.dwTransport = function (S, o) {
    const rng = makeRng(13), P = dwPanels(S, o), N = o.N || 20, A = window.ANNEAL;
    const G = 4001, xg = new Float64Array(G); for (let g = 0; g < G; g++) xg[g] = -4 + 8 * g / (G - 1);
    const cdf = (b) => { const F = new Float64Array(G); let acc = 0; for (let g = 0; g < G; g++) { acc += Math.exp(-DW.Ub(xg[g], b)); F[g] = acc; } for (let g = 0; g < G; g++) F[g] /= acc; return F; };
    const evalF = (F, x) => { if (x <= xg[0]) return 0; if (x >= xg[G - 1]) return 1; const u = (x + 4) / 8 * (G - 1), g = Math.floor(u), a = u - g; return F[g] * (1 - a) + F[g + 1] * a; };
    const invF = (F, q) => { let lo = 0, hi = G - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (F[m] < q) lo = m; else hi = m; } const a = (q - F[lo]) / Math.max(F[hi] - F[lo], 1e-300); return xg[lo] + (xg[hi] - xg[lo]) * Math.min(1, Math.max(0, a)); };
    let xs, k, Fprev, curve, clock = 0, hold = 0;
    function reset() { xs = new Float64Array(DW.M); for (let i = 0; i < DW.M; i++) xs[i] = DW.s0 * rng.normal(); k = 0; Fprev = cdf(0); let r = 0; for (const x of xs) if (x > 0) r++; curve = [[0, r / DW.M]]; clock = 0; hold = 0; }
    reset();
    function draw() {
      S.clear();
      P.hist(Array.from(xs), k / N, C.coral, 'Optimal transport, N = ' + N + ' steps');
      P.curve(1, 'β', [0, 0.25, 0.5, 0.75, 1], A.eq, [{ pts: curve, color: C.coral, label: k >= N ? 'N = ' + N : '' }]);
    }
    return {
      frame(dt) {
        if (k >= N) { hold += dt; if (hold > 4) reset(); draw(); return; }
        clock += dt; if (clock < 0.28) return; clock = 0;
        k++; const b = k / N, F = cdf(b);
        for (let i = 0; i < DW.M; i++) { xs[i] = invF(F, Math.min(1 - 1e-12, Math.max(1e-12, evalF(Fprev, xs[i])))); xs[i] = DW.mala(xs[i], b, rng); }
        Fprev = F; let r = 0; for (const x of xs) if (x > 0) r++; curve.push([b, r / DW.M]); draw();
      }, draw, enter: reset
    };
  };

  // ------------------------------------------------------------------
  // title hero: paths from a Gaussian prior (left) to a multimodal target (right)
  // ------------------------------------------------------------------
  ANIMS.heroPaths = function (S, o) {
    const ctx = S.ctx, rng = makeRng(o.seed || 4), NP = 150, T = 60;
    const X0 = 90, X1 = S.w - 90, Yc = S.h / 2, sc = S.h * 0.17;
    const modes = [[-1.7, 0.22, 0.3], [0.1, 0.26, 0.42], [1.8, 0.2, 0.28]];
    const tgt = (y) => modes.reduce((a, [m, s, w]) => a + w * Math.exp(-0.5 * ((y - m) / s) ** 2) / s, 0) / Math.sqrt(2 * Math.PI);
    const pri = (y) => Math.exp(-0.5 * y * y) / Math.sqrt(2 * Math.PI);
    // quantile coupling + Brownian-bridge wiggle
    const zs = [], ys = [];
    for (let i = 0; i < NP; i++) zs.push(rng.normal());
    zs.sort((a, b) => a - b);
    const draws = []; for (let i = 0; i < NP; i++) { const r = rng.u(); let acc = 0, m = modes[2]; for (const md of modes) { acc += md[2]; if (r < acc) { m = md; break; } } draws.push(m[0] + m[1] * rng.normal()); }
    draws.sort((a, b) => a - b);
    const paths = zs.map((z, i) => { const y1 = draws[i], pts = []; let bb = 0; const noise = []; for (let k = 0; k <= T; k++) { noise.push(bb); bb += rng.normal() * 0.16; } const end = noise[T]; for (let k = 0; k <= T; k++) { const s = k / T; const br = noise[k] - s * end; pts.push((1 - s) * z + s * y1 + br * Math.sqrt(1)); } return pts; });
    let clock = 0;
    const px = (k) => X0 + (X1 - X0) * k / T, py = (y) => Yc - y * sc;
    function ridge(x, f, color, dir) {
      ctx.beginPath(); ctx.moveTo(x, py(3.2));
      for (let y = 3.2; y >= -3.2; y -= 0.04) ctx.lineTo(x + dir * f(y) * 130, py(y));
      ctx.lineTo(x, py(-3.2)); ctx.closePath(); ctx.fillStyle = rgba(color, 0.18); ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
    }
    function draw() {
      S.clear();
      const cyc = 9, ph = ((clock + 4) % cyc) / cyc, head = Math.min(T, Math.floor(E.inOut(Math.min(1, ph / 0.6)) * T));
      ridge(X0, pri, C.blue, -1); ridge(X1, tgt, C.coral, 1);
      paths.forEach((p, i) => {
        ctx.beginPath(); for (let k = 0; k <= head; k++) { if (k) ctx.lineTo(px(k), py(p[k])); else ctx.moveTo(px(k), py(p[k])); }
        ctx.strokeStyle = rgba(mix(C.blue, C.coral, i / NP), 0.28); ctx.lineWidth = 1.6; ctx.stroke();
        U.circle(ctx, px(head), py(p[head]), 3.6, mix(C.blue, C.coral, head / T));
      });
      text(ctx, 'prior', X0 - 20, py(3.35), { size: 24, weight: 650, color: C.blue, align: 'center' });
      text(ctx, 'target', X1 + 20, py(3.35), { size: 24, weight: 650, color: C.coral, align: 'center' });
      arrow(ctx, X0 + 120, py(-3.55), X1 - 120, py(-3.55), C.teal, 3, 14);
      text(ctx, 'out of equilibrium, in finite time', (X0 + X1) / 2, py(-3.55) + 34, { size: 22, color: C.tealDark, align: 'center', weight: 600 });
    }
    return { frame(dt) { clock += dt; draw(); }, draw };
  };

  // ------------------------------------------------------------------
  // Crooks: forward and reverse work distributions cross at ΔF
  // pi_0 = N(0,1), pi_1 ∝ exp(-(x-2)^2 / (2 s1^2)),  ΔF = -log(s1)
  // ------------------------------------------------------------------
  ANIMS.crooks = function (S, o) {
    const ctx = S.ctx, rng = makeRng(31), s1 = 0.6, dF = -Math.log(s1), N = 30, Mmax = 8000;
    const Ut = (x, b) => (1 - b) * x * x / 2 + b * (x - 2) * (x - 2) / (2 * s1 * s1);
    const dUt = (x, b) => (1 - b) * x + b * (x - 2) / (s1 * s1);
    function mh(x, b) { const y = x + 0.5 * rng.normal(); return Math.log(rng.u()) < Ut(x, b) - Ut(y, b) ? y : x; }
    function path(fwd) { // returns work
      let x = fwd ? rng.normal() : 2 + s1 * rng.normal(), W = 0;
      for (let k = 0; k < N; k++) { const b0 = fwd ? k / N : 1 - k / N, b1 = fwd ? (k + 1) / N : 1 - (k + 1) / N; W += Ut(x, b1) - Ut(x, b0); for (let j = 0; j < 3; j++) x = mh(x, b1); }
      return W;
    }
    let WF = [], WR = [], step = 0;
    const L = 80, R = S.w - 40, Y0 = 70, Y1 = S.h - 90, wlo = -2.5, whi = 5.5, B = 64, bw = (whi - wlo) / B;
    const sx = w => L + (w - wlo) / (whi - wlo) * (R - L);
    function hist(arr, sign) { const c = new Float64Array(B); arr.forEach(w => { const k = Math.floor((sign * w - wlo) / bw); if (k >= 0 && k < B) c[k] += 1; }); const n = Math.max(1, arr.length); for (let k = 0; k < B; k++) c[k] /= n * bw; return c; }
    function draw() {
      S.clear();
      const hf = hist(WF, 1), hr = hist(WR, -1), ymax = 0.62, sy = v => Y1 - Math.min(v, ymax) / ymax * (Y1 - Y0);
      const bar = (c, col, off) => { for (let k = 0; k < B; k++) { const y = sy(c[k]); if (Y1 - y > 0.5) { ctx.fillStyle = rgba(col, 0.55); ctx.fillRect(sx(wlo + k * bw) + 1, y, (R - L) / B - 2, Y1 - y); } } };
      bar(hf, C.teal); if (step >= 1) bar(hr, C.coral);
      ctx.save(); ctx.setLineDash([10, 7]); ctx.strokeStyle = C.navy; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx(dF), Y0 - 10); ctx.lineTo(sx(dF), Y1); ctx.stroke(); ctx.restore();
      text(ctx, 'ΔF', sx(dF) + 10, Y0 + 8, { size: 26, weight: 700, color: C.navy });
      ctx.strokeStyle = rgba(C.inkSoft, 0.6); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, Y1); ctx.lineTo(R, Y1); ctx.stroke();
      for (let w = -2; w <= 5; w++) text(ctx, String(w), sx(w), Y1 + 30, { size: 19, color: C.muted, align: 'center' });
      text(ctx, 'work W', R, Y1 + 30, { size: 20, color: C.inkSoft, align: 'right' });
      richText(ctx, [['forward ', 'n'], ['P', 'n'], ['F', 'sub'], ['(W)', 'n']], L + 6, Y0 - 30, { size: 24, color: C.tealDark, weight: 650 });
      if (step >= 1) richText(ctx, [['reverse ', 'n'], ['P', 'n'], ['R', 'sub'], ['(−W)', 'n']], L + 260, Y0 - 30, { size: 24, color: '#B4492F', weight: 650 });
      if (WF.length > 50) {
        let m = -Infinity; WF.forEach(w => { m = Math.max(m, -w); }); let s = 0; WF.forEach(w => { s += Math.exp(-w - m); });
        const jar = -(m + Math.log(s / WF.length)), mean = WF.reduce((a, b) => a + b, 0) / WF.length;
        text(ctx, 'Jarzynski  −log⟨exp(−W)⟩ = ' + jar.toFixed(2) + '   ·   exact ΔF = ' + dF.toFixed(2) + '   ·   ⟨W⟩ = ' + mean.toFixed(2) + ' ≥ ΔF', L, Y1 + 62, { size: 21, color: C.ink });
      }
    }
    return {
      frame(dt) { if (WF.length < Mmax) { for (let i = 0; i < 80; i++) { WF.push(path(true)); WR.push(path(false)); } } draw(); },
      step(f) { step = f; }, draw, enter() { WF = []; WR = []; }
    };
  };

  // ------------------------------------------------------------------
  // SMC vs replica exchange on the same path of targets (blog Sec. 5.5)
  // ------------------------------------------------------------------
  ANIMS.smcVsRe = function (S, o) {
    const ctx = S.ctx, rng = makeRng(21);
    const N = 8, Wt = [0.25, 0.75], K = 1.5, tau = 0.3;
    const m = t => 2.2 * t / N, s = t => Math.sqrt(1 - (t / N) * (t / N) * (1 - 0.35 * 0.35));
    const lq = (x, t) => { const a = Math.log(Wt[0]) + lnN(x, -m(t), s(t)), b = Math.log(Wt[1]) + lnN(x, m(t), s(t)); const M = Math.max(a, b); return M + Math.log(Math.exp(a - M) + Math.exp(b - M)); };
    const sp = t => Math.sqrt(Math.max(s(t) * s(t) - tau * tau, 0.01));
    const f = (x, t) => m(t + 1) * Math.tanh(K * x) + (sp(t + 1) / s(t)) * (x - m(t) * Math.tanh(K * x));
    const g = (y, t) => m(t) * Math.tanh(K * y) + (sp(t) / s(t + 1)) * (y - m(t + 1) * Math.tanh(K * y));
    const lF = (y, x, t) => lnN(y, f(x, t), tau), lB = (x, y, t) => lnN(x, g(y, t), tau);
    const lG = (xt, xt1, t) => lq(xt1, t + 1) + lB(xt, xt1, t) - lq(xt, t) - lF(xt1, xt, t);
    const rowH = S.h / 2, X0 = 90, X1 = S.w - 330, HX0 = S.w - 280, HX1 = S.w - 30;
    const LX = t => X0 + t * (X1 - X0) / N;
    const HB = 32, HLO = -3.4, HHI = 3.4, hbw = (HHI - HLO) / HB, hk = v => Math.floor((v - HLO) / hbw);
    let qmax = 0; for (let v = -3.4; v <= 3.4; v += 0.05) qmax = Math.max(qmax, Math.exp(lq(v, N)));
    const Yr = (row) => (v) => row * rowH + rowH * 0.52 - v * rowH * 0.12;
    function background(row, title, stat, stat2) {
      const Y = Yr(row);
      text(ctx, title, X0 - 50, row * rowH + 34, { size: 26, weight: 700, color: row ? C.violet : C.blue });
      text(ctx, stat, HX0 - 24, row * rowH + 34, { size: 20, color: C.inkSoft, align: 'right' });
      if (stat2) text(ctx, stat2, HX0 - 24, row * rowH + 60, { size: 20, color: C.inkSoft, align: 'right' });
      for (let t = 0; t <= N; t++) {
        ctx.beginPath(); ctx.moveTo(LX(t), Y(3.3));
        for (let v = 3.3; v >= -3.3; v -= 0.08) ctx.lineTo(LX(t) + 30 * Math.exp(lq(v, t)) * s(t), Y(v));
        ctx.lineTo(LX(t), Y(-3.3)); ctx.closePath(); ctx.fillStyle = rgba(C.steel, 0.14); ctx.fill();
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(LX(t), Y(3.3)); ctx.lineTo(LX(t), Y(-3.3)); ctx.stroke();
        text(ctx, t === 0 ? 't = 0' : t === N ? 't = N' : String(t), LX(t), Y(-3.3) + 24, { size: 17, color: C.muted, align: 'center' });
      }
      ctx.strokeStyle = C.faint; ctx.beginPath(); ctx.moveTo(HX0, Y(3.3)); ctx.lineTo(HX0, Y(-3.3)); ctx.stroke();
    }
    function histogram(row, counts) {
      const Y = Yr(row), tot = counts.reduce((a, b) => a + b, 0), scl = (HX1 - HX0 - 10) / (qmax * 1.15);
      if (tot > 0) counts.forEach((c, k) => { const w = c / (tot * hbw) * scl; if (w > 0.4) roundRect(ctx, HX0 + 1, Y(HLO + (k + 1) * hbw) + 1, Math.min(w, HX1 - HX0), Math.max(Y(HLO + k * hbw) - Y(HLO + (k + 1) * hbw) - 2, 1), 2, rgba(row ? C.violet : C.blue, 0.8)); });
      ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 2; ctx.beginPath();
      for (let v = -3.4; v <= 3.4001; v += 0.05) { const p = [HX0 + Math.exp(lq(v, N)) * scl, Y(v)]; if (v > -3.39) ctx.lineTo(...p); else ctx.moveTo(...p); }
      ctx.stroke(); ctx.restore();
      text(ctx, 'output', (HX0 + HX1) / 2, Y(3.3) - 10, { size: 17, color: C.muted, align: 'center' });
    }
    // SMC state
    const Mp = 40; let Sm;
    function smcInit(keep) { const x = []; for (let i = 0; i < Mp; i++) x.push(rng.normal() * s(0)); Sm = { t: 0, x, lw: new Array(Mp).fill(0), paths: x.map(v => [[0, v]]), phase: 'move', prog: 0, from: null, to: null, ess: Mp, hist: keep ? Sm.hist : new Array(HB).fill(0), wR: keep ? Sm.wR : 0, wT: keep ? Sm.wT : 0 }; smcAdvance(); }
    const smcW = () => { const mx = Math.max(...Sm.lw); const w = Sm.lw.map(l => Math.exp(l - mx)); const sw = w.reduce((a, b) => a + b); return w.map(v => v / sw); };
    function smcAdvance() { const t = Sm.t; Sm.from = Sm.x.slice(); const nx = Sm.x.map(v => f(v, t) + tau * rng.normal()); for (let i = 0; i < Mp; i++) Sm.lw[i] += lG(Sm.x[i], nx[i], t); Sm.to = nx; Sm.phase = 'move'; Sm.prog = 0; }
    function smcAfter() {
      Sm.t++; Sm.x = Sm.to; Sm.x.forEach((v, i) => Sm.paths[i].push([Sm.t, v]));
      const w = smcW(); Sm.ess = 1 / w.reduce((a, b) => a + b * b, 0);
      if (Sm.t === N) { Sm.phase = 'emit'; Sm.prog = 0; w.forEach((wi, i) => { const k = hk(Sm.x[i]); if (k >= 0 && k < HB) Sm.hist[k] += wi; Sm.wT += wi; if (Sm.x[i] > 0) Sm.wR += wi; }); return; }
      if (Sm.ess < 0.7 * Mp) { const idx = []; const u0 = rng.u() / Mp; let c = w[0], j = 0; for (let i = 0; i < Mp; i++) { const u = u0 + i / Mp; while (u > c && j < Mp - 1) { j++; c += w[j]; } idx.push(j); } const ox = Sm.x.slice(), op = Sm.paths, keep = new Set(idx); Sm.killed = ox.filter((v, i) => !keep.has(i)); Sm.x = idx.map(p => ox[p]); Sm.paths = idx.map(p => op[p].slice()); Sm.lw = new Array(Mp).fill(0); Sm.phase = 'resample'; Sm.prog = 0; }
      else smcAdvance();
    }
    // RE state
    let Re;
    function mhLocal(x, t) { let y = x; for (let j = 0; j < 3; j++) { const z = y + 0.45 * rng.normal(); if (Math.log(rng.u()) < lq(z, t) - lq(y, t)) y = z; } return y; }
    function reRelax() { Re.x[0] = rng.normal() * s(0); Re.rel = Re.x.map((v, t) => t === 0 ? v : mhLocal(v, t)); Re.phase = 'relax'; Re.prog = 0; Re.moves = []; }
    function reInit() { const x = []; for (let t = 0; t <= N; t++) x.push(m(t) * (rng.u() < 0.75 ? 1 : -1) + s(t) * rng.normal()); Re = { x, round: 0, acc: 0, tries: 0, hist: new Array(HB).fill(0), nR: 0, nT: 0, prog: 0, moves: [], phase: 'relax' }; reRelax(); }
    function rePropose() {
      const par = Re.round % 2, moves = [];
      for (let t = par; t < N; t += 2) { const yu = f(Re.x[t], t) + tau * rng.normal(), yd = g(Re.x[t + 1], t) + tau * rng.normal(); const la = lG(Re.x[t], yu, t) - lG(yd, Re.x[t + 1], t); const ok = Math.log(rng.u()) < la; Re.tries++; if (ok) Re.acc++; moves.push({ t, ok, xa: Re.x[t], xb: Re.x[t + 1], yu, yd }); }
      Re.moves = moves; Re.prog = 0; Re.phase = 'swap';
    }
    function reAfter() { if (Re.phase === 'relax') { Re.x = Re.rel; rePropose(); return; } for (const mv of Re.moves) if (mv.ok) { Re.x[mv.t + 1] = mv.yu; Re.x[mv.t] = mv.yd; } Re.round++; const v = Re.x[N], k = hk(v); if (k >= 0 && k < HB) Re.hist[k]++; Re.nT++; if (v > 0) Re.nR++; reRelax(); }
    function draw() {
      S.clear();
      // SMC row
      const w = smcW(), essNow = 1 / w.reduce((a, b) => a + b * b, 0);
      background(0, 'Sequential Monte Carlo · the work is used to resample',
        'effective sample size ' + Math.round(essNow) + ' of ' + Mp, '');
      const Y0 = Yr(0);
      Sm.paths.forEach(p => { ctx.beginPath(); p.forEach((q, i) => { if (i) ctx.lineTo(LX(q[0]), Y0(q[1])); else ctx.moveTo(LX(q[0]), Y0(q[1])); }); ctx.strokeStyle = rgba(C.blue, 0.16); ctx.lineWidth = 1.2; ctx.stroke(); });
      if (Sm.phase === 'resample') {
        const a = 1 - 0.6 * Sm.prog;
        (Sm.killed || []).forEach(v => { const x = LX(Sm.t) + 26, y = Y0(v); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9); ctx.stroke(); ctx.restore(); });
        text(ctx, 'resample: ✕ low-weight particles killed, heavy ones copied', X0 - 50, rowH * 0 + 64, { size: 20, weight: 700, color: C.red });
      }
      for (let i = 0; i < Mp; i++) { let xv = Sm.x[i], px = LX(Sm.t); if (Sm.phase === 'move' && Sm.to) { xv = Sm.from[i] + (Sm.to[i] - Sm.from[i]) * Sm.prog; px = LX(Sm.t + Sm.prog); } U.circle(ctx, px, Y0(xv), Math.min(3 + 6 * Math.sqrt(w[i] * Mp), 13), rgba(C.blue, 0.9), '#fff', 1.2); }
      histogram(0, Sm.hist);
      // RE row
      background(1, 'Replica exchange · the work is used to swap',
        '', '');
      const Y1 = Yr(1), p = Math.min(Re.prog * 1.25, 1), moving = new Set();
      if (Re.phase === 'relax') {
        for (let t = 0; t <= N; t++) { const a = Re.x[t], b = Re.rel[t], y = a + (b - a) * E.inOut(p); if (t > 0 && Math.abs(b - a) > 1e-9) { ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = rgba(C.gold, 0.9); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(LX(t) - 16, Y1(a)); ctx.lineTo(LX(t) - 16, Y1(b)); ctx.stroke(); ctx.restore(); } U.circle(ctx, LX(t), Y1(y), 16, null, rgba(C.gold, 0.9), 3); U.circle(ctx, LX(t), Y1(y), 9, C.violet, '#fff', 2); }
        text(ctx, 'step 1: local MCMC at each level', X0 - 50, rowH + 64, { size: 20, weight: 700, color: C.gold });
        histogram(1, Re.hist); return;
      }
      text(ctx, 'step 2: swap neighbours, accepted with the work', X0 - 50, rowH + 64, { size: 20, weight: 700, color: C.tealDark });
      for (const mv of Re.moves) {
        moving.add(mv.t); moving.add(mv.t + 1);
        if (mv.ok) {
          ctx.strokeStyle = rgba(C.teal, 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(LX(mv.t), Y1(mv.xa)); ctx.lineTo(LX(mv.t + 1), Y1(mv.yu)); ctx.moveTo(LX(mv.t + 1), Y1(mv.xb)); ctx.lineTo(LX(mv.t), Y1(mv.yd)); ctx.stroke();
          U.circle(ctx, LX(mv.t) + (LX(mv.t + 1) - LX(mv.t)) * p, Y1(mv.xa + (mv.yu - mv.xa) * p), 9, C.violet, '#fff', 2);
          U.circle(ctx, LX(mv.t + 1) + (LX(mv.t) - LX(mv.t + 1)) * p, Y1(mv.xb + (mv.yd - mv.xb) * p), 9, C.violet, '#fff', 2);
        } else {
          ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(LX(mv.t), Y1(mv.xa)); ctx.lineTo(LX(mv.t + 1), Y1(mv.xb)); ctx.stroke(); ctx.restore();
          U.circle(ctx, LX(mv.t), Y1(mv.xa), 9, C.violet, '#fff', 2); U.circle(ctx, LX(mv.t + 1), Y1(mv.xb), 9, C.violet, '#fff', 2);
        }
      }
      for (let t = 0; t <= N; t++) if (!moving.has(t)) U.circle(ctx, LX(t), Y1(Re.x[t]), 9, C.violet, '#fff', 2);
      histogram(1, Re.hist);
    }
    smcInit(false); reInit();
    return {
      frame(dt) {
        const dp = dt * 1.6;
        Sm.prog += dp; if (Sm.prog >= 1) { if (Sm.phase === 'move') smcAfter(); else if (Sm.phase === 'resample') smcAdvance(); else smcInit(true); }
        Re.prog += dp * 0.9; if (Re.prog >= 1) reAfter();
        draw();
      }, draw
    };
  };

  // ------------------------------------------------------------------
  // path tilting: unbiased walkers stay in A; the Doob h-transform (committor q) drives A -> B
  // dX = (-U'(x) + 2 (log q)'(x)) dt + sqrt(2) dW,  q(x) = int_A^x e^{U} / int_A^B e^{U}
  // ------------------------------------------------------------------
  ANIMS.pathTilt = function (S, o) {
    const ctx = S.ctx, rng = makeRng(41), xa = -1, xb = 1;
    const Uf = x => 18 * (x * x - 1) * (x * x - 1) + 0.6 * Math.sin(10 * x) - 0.3 * x;
    const dU = x => (Uf(x + 1e-4) - Uf(x - 1e-4)) / 2e-4;
    const G = 2001, g0 = xa, g1 = xb, h = (g1 - g0) / (G - 1), Q = new Float64Array(G);
    let acc = 0; for (let i = 0; i < G; i++) { acc += Math.exp(Uf(g0 + i * h)) * h; Q[i] = acc; } for (let i = 0; i < G; i++) Q[i] /= acc;
    const dlogq = x => { const u = (x - g0) / h; const i = Math.max(1, Math.min(G - 2, Math.round(u))); return (Math.log(Math.max(Q[i + 1], 1e-300)) - Math.log(Math.max(Q[i - 1], 1e-300))) / (2 * h); };
    const L = 50, R = S.w - 30, Y0 = 70, Y1 = S.h - 120, xmin = -1.42, xmax = 1.42;
    let umin = Infinity, umax = -Infinity; for (let x = xmin; x <= xmax; x += 0.01) { umin = Math.min(umin, Uf(x)); umax = Math.max(umax, Uf(x)); }
    const sx = x => L + (x - xmin) / (xmax - xmin) * (R - L), sy = u => Y1 - (u - umin) / (umax - umin) * (Y1 - Y0);
    const NF = 14, NC = 6, dt = 0.0015;
    let free, ctl, nCross = 0, nFree = 0, clock = 0;
    function reset() { free = []; ctl = []; for (let i = 0; i < NF; i++) free.push(xa + 0.05 * rng.normal()); for (let i = 0; i < NC; i++) ctl.push({ x: xa + 0.03 + 0.02 * rng.u(), trail: [], born: i * 0.6 }); nCross = 0; nFree = 0; clock = 0; }
    reset();
    function draw() {
      S.clear();
      ctx.beginPath(); ctx.moveTo(sx(xmin), Y1 + 20); for (let x = xmin; x <= xmax + 1e-9; x += 0.005) ctx.lineTo(sx(x), sy(Uf(x))); ctx.lineTo(sx(xmax), Y1 + 20); ctx.closePath(); ctx.fillStyle = rgba(C.steel, 0.1); ctx.fill();
      ctx.beginPath(); for (let x = xmin; x <= xmax + 1e-9; x += 0.005) { if (x > xmin) ctx.lineTo(sx(x), sy(Uf(x))); else ctx.moveTo(sx(x), sy(Uf(x))); } ctx.strokeStyle = C.navy; ctx.lineWidth = 3.5; ctx.stroke();
      text(ctx, 'A', sx(xa), Y1 + 50, { size: 30, weight: 700, color: C.blue, align: 'center' });
      text(ctx, 'B', sx(xb), Y1 + 50, { size: 30, weight: 700, color: C.coral, align: 'center' });
      ctl.forEach(c => { if (c.trail.length > 1) { ctx.beginPath(); c.trail.forEach((x, i) => { const p = [sx(x), sy(Uf(x)) - 14]; if (i) ctx.lineTo(...p); else ctx.moveTo(...p); }); ctx.strokeStyle = rgba(C.coral, 0.45); ctx.lineWidth = 3; ctx.stroke(); } });
      free.forEach(x => U.circle(ctx, sx(x), sy(Uf(x)) - 14, 8, rgba(C.blue, 0.75), '#fff', 1.5));
      ctl.forEach(c => { if (clock >= c.born) U.circle(ctx, sx(c.x), sy(Uf(c.x)) - 14, 10, C.coral, '#fff', 2); });
      text(ctx, 'unbiased walkers', L, 30, { size: 22, weight: 650, color: C.blue });
      text(ctx, 'tilted by the committor (Doob h-transform)', L + 230, 30, { size: 22, weight: 650, color: '#B4492F' });
      text(ctx, 'transitions A → B:  unbiased ' + nFree + '  ·  tilted ' + nCross, R, Y1 + 90, { size: 21, color: C.ink, align: 'right' });
    }
    return {
      frame(fdt) {
        clock += fdt;
        for (let k = 0; k < 2; k++) {
          for (let i = 0; i < NF; i++) { const x = free[i]; free[i] = x - dU(x) * dt + Math.sqrt(2 * dt) * rng.normal(); if (free[i] >= xb) { nFree++; free[i] = xa; } }
          ctl.forEach(c => { if (clock < c.born) return; const x = c.x; let nx = x + (-dU(x) + 2 * dlogq(x)) * dt + Math.sqrt(2 * dt) * rng.normal(); nx = Math.max(xa + 1e-3, nx); c.x = nx; if (k === 0) { c.trail.push(nx); if (c.trail.length > 120) c.trail.shift(); } if (nx >= xb) { nCross++; c.x = xa + 0.03; c.trail = []; } });
        }
        draw();
      }, draw, enter: reset
    };
  };

  // ------------------------------------------------------------------
  // title: equilibrium MCMC (slow, wrong mode weights) vs out-of-equilibrium diffusion (60 steps, right weights)
  // ------------------------------------------------------------------
  ANIMS.heroCompare = function (S, o) {
    const ctx = S.ctx, rng = makeRng(o.seed || 7), K = 8, R0 = 2.1, sd = 0.2, NP = 360;
    const W = [0.42, 0.02, 0.16, 0.02, 0.22, 0.02, 0.12, 0.02];
    const MU = []; for (let k = 0; k < K; k++) { const a = 2 * Math.PI * k / K + 0.2; MU.push([R0 * Math.cos(a), R0 * Math.sin(a)]); }
    function score(x, y, al) {
      const v = al * al * sd * sd + 1 - al * al; let m = -Infinity; const ls = [];
      for (let k = 0; k < K; k++) { const dx = x - al * MU[k][0], dy = y - al * MU[k][1]; const l = Math.log(W[k]) - (dx * dx + dy * dy) / (2 * v); ls.push(l); m = Math.max(m, l); }
      let Z = 0; ls.forEach((l, k) => { ls[k] = Math.exp(l - m); Z += ls[k]; });
      let gx = 0, gy = 0; for (let k = 0; k < K; k++) { const r = ls[k] / Z; gx -= r * (x - al * MU[k][0]) / v; gy -= r * (y - al * MU[k][1]) / v; }
      return [gx, gy];
    }
    const logp = (x, y) => { let m = -Infinity; const ls = MU.map((mu, k) => Math.log(W[k]) - ((x - mu[0]) ** 2 + (y - mu[1]) ** 2) / (2 * sd * sd)); ls.forEach(l => { m = Math.max(m, l); }); return m + Math.log(ls.reduce((a, l) => a + Math.exp(l - m), 0)); };
    const beta = 8, NS = 100, h = 0.008;
    let mc, df, mcSteps, dfStep, hold;
    function reset() { mc = []; df = []; for (let i = 0; i < NP; i++) { mc.push([rng.normal(), rng.normal()]); df.push([rng.normal(), rng.normal()]); } mcSteps = 0; dfStep = 0; hold = 0; }
    reset();
    const pw = Math.min((S.w - 70) / 2, S.h * 0.55), gap = S.w - 2 * pw - 20, top = 56;
    const pan = [{ x: 10, title: 'Equilibrium · Langevin MCMC', col: C.blue }, { x: 10 + pw + gap, title: 'Out of equilibrium · diffusion', col: C.coral }];
    const toPx = (p, P) => [P.x + pw / 2 + p[0] / 3.1 * pw / 2, top + pw / 2 - p[1] / 3.1 * pw / 2];
    function pops(arr) { const c = new Array(K).fill(0); arr.forEach(p => { let a = Math.atan2(p[1], p[0]) - 0.2; let k = Math.round(a / (2 * Math.PI / K)); k = ((k % K) + K) % K; c[k]++; }); return c.map(v => v / arr.length); }
    function panel(P, pts, label) {
      roundRect(ctx, P.x, top, pw, pw, 18, '#fff', rgba(C.ink, 0.06), 1);
      MU.forEach((mu, k) => { const [x, y] = toPx(mu, P); const r = 12 + 70 * W[k]; ctx.fillStyle = rgba(C.steel, 0.12); ctx.beginPath(); ctx.arc(x, y, r * pw / 400, 0, 2 * Math.PI); ctx.fill(); });
      pts.forEach(p => { const [x, y] = toPx(p, P); if (x > P.x && x < P.x + pw && y > top && y < top + pw) { ctx.fillStyle = rgba(P.col, 0.75); ctx.fillRect(x - 2, y - 2, 4, 4); } });
      text(ctx, P.title, P.x + 4, top - 18, { size: 22, weight: 700, color: P.col });
      text(ctx, label, P.x + pw - 12, top + pw - 14, { size: 18, color: C.inkSoft, align: 'right', weight: 600 });
      // mode populations vs target
      const by = top + pw + 26, bh = S.h - by - 46, bw = (pw - 20) / K, c = pops(pts);
      for (let k = 0; k < K; k++) {
        const x = P.x + 10 + k * bw, ht = W[k] / 0.46 * bh, hc = Math.min(c[k], 0.46) / 0.46 * bh;
        roundRect(ctx, x + 4, by + bh - hc, bw - 8, hc, 3, rgba(P.col, 0.8));
        roundRect(ctx, x + 4, by + bh - ht, bw - 8, ht, 3, null, C.ink, 1.6, [5, 4]);
      }
      text(ctx, 'mode weights vs. target (dashed)', P.x + 10, S.h - 14, { size: 17, color: C.muted });
    }
    function draw() {
      S.clear();
      panel(pan[0], mc, mcSteps.toLocaleString() + ' steps');
      panel(pan[1], df, Math.min(dfStep, NS) + ' steps');
    }
    return {
      frame(dt) {
        if (hold > 0) { hold += dt; if (hold > 3.5) reset(); draw(); return; }
        // MCMC: many MALA steps per frame
        const sq = Math.sqrt(2 * h);
        for (let r = 0; r < 25; r++) { for (const p of mc) { const g = score(p[0], p[1], 1); const yx = p[0] + h * g[0] + sq * rng.normal(), yy = p[1] + h * g[1] + sq * rng.normal(); const g2 = score(yx, yy, 1); const lq = (ax, ay, bx, by, gb) => -((ax - bx - h * gb[0]) ** 2 + (ay - by - h * gb[1]) ** 2) / (4 * h); const la = logp(yx, yy) - logp(p[0], p[1]) + lq(p[0], p[1], yx, yy, g2) - lq(yx, yy, p[0], p[1], g); if (Math.log(rng.u()) < la) { p[0] = yx; p[1] = yy; } } mcSteps++; }
        // diffusion: one reverse step every few frames, exact score
        if (dfStep < NS) {
          const t0 = 1 - dfStep / NS, dtau = 1 / NS, al = Math.exp(-0.5 * beta * t0);
          for (const p of df) { const g = score(p[0], p[1], al); p[0] += (0.5 * beta * p[0] + beta * g[0]) * dtau + Math.sqrt(beta * dtau) * rng.normal(); p[1] += (0.5 * beta * p[1] + beta * g[1]) * dtau + Math.sqrt(beta * dtau) * rng.normal(); }
          dfStep++;
        }
        if (mcSteps >= 6000) hold = 1e-6;
        draw();
      }, draw, enter: reset
    };
  };

  // ------------------------------------------------------------------
  // autoregressive LM as a non-equilibrium process: forward = sample a branch; backward = delete, prob 1
  // ------------------------------------------------------------------
  ANIMS.arTree = function (S, o) {
    const ctx = S.ctx, rng = makeRng(17);
    const LEV = [[['The', .55], ['A', .35], ['Every', .10]], [['cat', .5], ['dog', .3], ['model', .2]], [['sat', .6], ['ran', .3], ['slept', .1]], [['down', .5], ['away', .3], ['there', .2]]];
    const L = LEV.length, dx = (S.w - 220) / (L + 0.6), X0 = 70 + 0.6 * dx, Yc = S.h * 0.40, dy = 92;
    let path, phase, prog, hold;
    function sample() { path = LEV.map(opts => { let r = rng.u(), acc = 0; for (let j = 0; j < opts.length; j++) { acc += opts[j][1]; if (r < acc) return j; } return opts.length - 1; }); phase = 0; prog = 0; hold = 0; }
    sample();
    const colX = i => X0 + i * dx;
    const nodeY = (j) => Yc + (j - 1) * dy;
    function box(x, y, txt, style) {
      ctx.save(); ctx.font = U.font(26, 650); const w = Math.max(96, ctx.measureText(txt).width + 34); ctx.restore();
      roundRect(ctx, x - w / 2, y - 26, w, 52, 12, style.fill, style.stroke, style.lw || 1.5);
      text(ctx, txt, x, y + 9, { size: 26, weight: 650, color: style.color, align: 'center' });
      return w;
    }
    function draw() {
      S.clear();
      // phases: 0..L-1 forward choice at level i (prog 0..1); L..2L-1 backward step; then hold
      const fwdDone = Math.min(phase, L), back = Math.max(0, phase - L);
      let py = Yc, prod = 1;
      box(colX(0) - dx * 0.6, Yc, '⟨s⟩', { fill: '#fff', stroke: C.navy, color: C.navy, lw: 2 });
      for (let i = 0; i < L; i++) {
        if (i > fwdDone) break;
        const showing = i === fwdDone ? prog : 1, opts = LEV[i];
        const chosen = path[i], px = i === 0 ? colX(0) - dx * 0.6 : colX(i - 1);
        opts.forEach(([tok, p], j) => {
          const y = nodeY(j), isC = j === chosen, decided = i < fwdDone || prog > 0.55;
          const a = Math.min(1, showing * 2);
          ctx.save(); ctx.globalAlpha = a * (decided && !isC ? 0.25 : 1);
          ctx.strokeStyle = decided && isC ? C.teal : C.faint; ctx.lineWidth = decided && isC ? 5 : 2;
          ctx.beginPath(); ctx.moveTo(px + 50, py); ctx.bezierCurveTo(px + dx * 0.45, py, colX(i) - dx * 0.45, y, colX(i) - 52, y); ctx.stroke();
          text(ctx, p.toFixed(2), (px + colX(i)) / 2, (py + y) / 2 - 10, { size: 19, weight: 650, color: decided && isC ? C.tealDark : C.muted, align: 'center' });
          box(colX(i), y, tok, decided && isC ? { fill: rgba(C.teal, 0.12), stroke: C.teal, color: C.ink, lw: 2.5 } : { fill: '#fff', stroke: C.faint, color: C.inkSoft });
          ctx.restore();
        });
        if (i < fwdDone || prog > 0.55) prod *= opts[chosen][1];
        py = nodeY(chosen);
      }
      // backward arrows: delete the last token, probability 1
      for (let b = 0; b < back && b < L; b++) {
        const i = L - 1 - b, y1 = nodeY(path[i]), y0 = i === 0 ? Yc : nodeY(path[i - 1]), x1 = colX(i), x0 = i === 0 ? colX(0) - dx * 0.6 : colX(i - 1);
        U.curvedArrow(ctx, [x1 - 10, y1 + 34, (x0 + x1) / 2, Math.max(y0, y1) + 90, x0 + 10, y0 + 34], C.coral, 3.5, 14);
        text(ctx, '× 1', (x0 + x1) / 2, Math.max(y0, y1) + 92, { size: 22, weight: 700, color: '#B4492F', align: 'center' });
      }
      // readouts
      const sent = path.slice(0, fwdDone + (prog > 0.55 && phase < L ? 1 : 0)).map((j, i) => LEV[i][j][0]).join(' ');
      text(ctx, '“' + sent + '”', 20, S.h - 92, { size: 30, weight: 650, color: C.navy });
      const terms = path.slice(0, fwdDone + (prog > 0.55 && phase < L ? 1 : 0)).map((j, i) => LEV[i][j][1].toFixed(2));
      text(ctx, 'forward:  p(x) = ' + (terms.length ? terms.join(' × ') + ' = ' + prod.toFixed(3) : '…'), 20, S.h - 46, { size: 24, color: C.tealDark, weight: 600 });
      if (back > 0) text(ctx, 'backward:  ' + Array(Math.min(back, L)).fill('1').join(' × ') + (back >= L ? '  →  one path back, so the path weight is p(x) exactly' : ''), S.w - 20, S.h - 46, { size: 24, color: '#B4492F', weight: 600, align: 'right' });
    }
    return {
      frame(dt) {
        if (phase >= 2 * L) { hold += dt; if (hold > 2.5) sample(); draw(); return; }
        prog += dt / (phase < L ? 1.1 : 0.55);
        if (prog >= 1) { prog = 0; phase++; }
        draw();
      }, draw, enter: sample
    };
  };

  // ------------------------------------------------------------------
  // title (single figure): the same prior, two processes, on a log-time axis
  // out-of-equilibrium diffusion is done (right weights) in 100 steps; MCMC is still wrong at 10^4
  // ------------------------------------------------------------------
  ANIMS.heroOne = function (S, o) {
    const ctx = S.ctx, rng = makeRng(o.seed || 3), NP = 26, KMAX = 10000, NS = 100, beta = 8;
    const MU = [-2.2, 0, 2.2], SD = 0.3, W = [0.55, 0.1, 0.35];
    const score = (x, al) => { const v = al * al * SD * SD + 1 - al * al; let m = -Infinity; const ls = MU.map((mu, k) => Math.log(W[k]) - (x - al * mu) ** 2 / (2 * v)); ls.forEach(l => { m = Math.max(m, l); }); let Z = 0, g = 0; ls.forEach((l, k) => { const e = Math.exp(l - m); Z += e; g += e * (-(x - al * MU[k]) / v); }); return g / Z; };
    const logp = x => { const ls = MU.map((mu, k) => Math.log(W[k]) - (x - mu) ** 2 / (2 * SD * SD)); const m = Math.max(...ls); return m + Math.log(ls.reduce((a, l) => a + Math.exp(l - m), 0)); };
    const dens = x => MU.reduce((a, mu, k) => a + W[k] * Math.exp(-((x - mu) ** 2) / (2 * SD * SD)) / (SD * Math.sqrt(2 * Math.PI)), 0);
    // checkpoints on a log axis
    const CK = []; for (let i = 0; i <= 140; i++) CK.push(Math.round(Math.pow(10, 4 * i / 140)));
    const x0 = []; for (let i = 0; i < NP; i++) x0.push(rng.normal());
    const mcT = x0.map(x => { const tr = []; let y = x, ci = 0; const h = 0.01, sq = Math.sqrt(2 * h); for (let k = 1; k <= KMAX; k++) { const g = score(y, 1), z = y + h * g + sq * rng.normal(), g2 = score(z, 1); const la = logp(z) - logp(y) - ((y - z - h * g2) ** 2 - (z - y - h * g) ** 2) / (4 * h); if (Math.log(rng.u()) < la) y = z; while (ci < CK.length && CK[ci] === k) { tr.push(y); ci++; } } return tr; });
    const dfT = x0.map(x => { const tr = [x]; let y = x; for (let st = 0; st < NS; st++) { const t0 = 1 - st / NS, dt = 1 / NS, al = Math.exp(-0.5 * beta * t0); y += (0.5 * beta * y + beta * score(y, al)) * dt + Math.sqrt(beta * dt) * rng.normal(); tr.push(y); } return tr; });
    const PX0 = 40, PX1 = S.w - 240, PY0 = 130, PY1 = S.h - 110, HX0 = S.w - 225, HX1 = S.w - 20;
    const sx = k => PX0 + Math.log10(Math.max(1, k)) / 4 * (PX1 - PX0), sy = x => (PY0 + PY1) / 2 - x / 3.4 * (PY1 - PY0) / 2;
    let clock = 0;
    const dfAt = (tr, k) => tr[Math.min(NS, Math.max(0, k - 1))];
    function weights(xs) { const c = [0, 0, 0]; xs.forEach(x => { c[x < -1.1 ? 0 : x > 1.1 ? 2 : 1]++; }); return c.map(v => v / xs.length); }
    function draw() {
      S.clear();
      const T = 7.5, u = Math.min(1, (clock % (T + 3)) / T), kNow = Math.pow(10, 4 * u);
      // axes
      [1, 10, 100, 1000, 10000].forEach(k => { ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx(k), PY0 - 10); ctx.lineTo(sx(k), PY1 + 6); ctx.stroke(); text(ctx, k === 10000 ? '10⁴' : k === 1000 ? '10³' : String(k), sx(k), PY1 + 32, { size: 19, color: C.muted, align: 'center' }); });
      text(ctx, 'steps (log scale)', (PX0 + PX1) / 2, PY1 + 62, { size: 19, color: C.inkSoft, align: 'center' });
      MU.forEach(mu => { ctx.fillStyle = rgba(C.steel, 0.07); ctx.fillRect(PX0, sy(mu) - 22, PX1 - PX0, 44); });
      // MCMC trajectories (blue) and diffusion trajectories (coral)
      const ci = CK.findIndex(k => k > kNow); const cEnd = ci < 0 ? CK.length - 1 : Math.max(0, ci - 1);
      mcT.forEach(tr => { ctx.beginPath(); for (let i = 0; i <= cEnd; i++) { const p = [sx(CK[i]), sy(tr[i])]; if (i) ctx.lineTo(...p); else ctx.moveTo(...p); } ctx.strokeStyle = rgba(C.blue, 0.3); ctx.lineWidth = 1.4; ctx.stroke(); });
      const kd = Math.min(NS + 1, Math.floor(kNow));
      dfT.forEach(tr => { ctx.beginPath(); for (let k = 1; k <= kd; k++) { const p = [sx(k), sy(dfAt(tr, k))]; if (k > 1) ctx.lineTo(...p); else ctx.moveTo(...p); } ctx.strokeStyle = rgba(C.coral, 0.45); ctx.lineWidth = 1.6; ctx.stroke(); });
      mcT.forEach(tr => U.circle(ctx, sx(CK[cEnd]), sy(tr[cEnd]), 3.5, C.blue));
      dfT.forEach(tr => U.circle(ctx, sx(Math.max(1, kd)), sy(dfAt(tr, kd)), 3.5, C.coral));
      if (kNow >= NS) { ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = C.coral; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(NS + 1), PY0 - 10); ctx.lineTo(sx(NS + 1), PY1); ctx.stroke(); ctx.restore(); text(ctx, 'diffusion done', sx(NS + 1) + 8, PY1 - 8, { size: 20, weight: 700, color: C.coral }); }
      // right: final densities vs target
      const sw = (HX1 - HX0) / 1.25;
      ctx.beginPath(); for (let x = -3.4; x <= 3.4; x += 0.04) { const p = [HX0 + dens(x) * sw, sy(x)]; if (x > -3.39) ctx.lineTo(...p); else ctx.moveTo(...p); } ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      const wM = weights(mcT.map(tr => tr[cEnd])), wD = weights(dfT.map(tr => dfAt(tr, kd)));
      MU.forEach((mu, k) => {
        const y = sy(mu);
        roundRect(ctx, HX0, y - 16, W[k] * (HX1 - HX0), 9, 3, null, C.ink, 1.5, [4, 3]);
        roundRect(ctx, HX0, y - 4, wD[k] * (HX1 - HX0), 9, 3, C.coral);
        roundRect(ctx, HX0, y + 8, wM[k] * (HX1 - HX0), 9, 3, C.blue);
      });
      text(ctx, 'mode weights', HX0, PY0 - 34, { size: 18, color: C.inkSoft, weight: 600 });
      text(ctx, 'target dashed', HX0, PY0 - 12, { size: 16, color: C.muted });
      // legend
      text(ctx, '● out of equilibrium: diffusion', PX0, 34, { size: 23, weight: 700, color: C.coral });
      text(ctx, '● equilibrium: MCMC', PX0 + 380, 34, { size: 23, weight: 700, color: C.blue });
      text(ctx, 'same prior, same target: right weights in 100 steps vs. still wrong at 10⁴', PX0, 66, { size: 19, color: C.inkSoft });
    }
    return { frame(dt) { clock += dt; draw(); }, draw, enter() { clock = 0; } };
  };

  // ------------------------------------------------------------------
  // title: two transports from the same Gaussian to the same target, at different speeds.
  // background glow = each process's instantaneous distribution:
  //   coral: diffusion marginal p_t (probability-flow ODE, 100 steps)
  //   blue:  annealing target pi_beta ∝ N(0,I)^(1-beta) pi^beta (annealed Langevin, 5,000 steps)
  // ------------------------------------------------------------------
  ANIMS.heroGlow = function (S, o) {
    const ctx = S.ctx, rng = makeRng(o.seed || 5), K = 7, R0 = 2.5, SD = 0.17, NP = 220, NS = 100, ANN = 1000, RATE = 100, beta = 8, TR = 10;
    const W = [0.30, 0.04, 0.20, 0.05, 0.24, 0.04, 0.13];
    const MU = []; for (let k = 0; k < K; k++) { const a = 2 * Math.PI * k / K + 0.5; MU.push([R0 * Math.cos(a), R0 * Math.sin(a)]); }
    function score(x, y, al) {
      const v = al * al * SD * SD + 1 - al * al; let m = -Infinity; const ls = [];
      for (let k = 0; k < K; k++) { const dx = x - al * MU[k][0], dy = y - al * MU[k][1]; const l = Math.log(W[k]) - (dx * dx + dy * dy) / (2 * v); ls.push(l); m = Math.max(m, l); }
      let Z = 0; ls.forEach((l, k) => { ls[k] = Math.exp(l - m); Z += ls[k]; });
      let gx = 0, gy = 0; for (let k = 0; k < K; k++) { const r = ls[k] / Z; gx -= r * (x - al * MU[k][0]) / v; gy -= r * (y - al * MU[k][1]) / v; }
      return [gx, gy];
    }
    const logp = (x, y) => { const ls = MU.map((mu, k) => Math.log(W[k]) - ((x - mu[0]) ** 2 + (y - mu[1]) ** 2) / (2 * SD * SD)); const m = Math.max(...ls); return m + Math.log(ls.reduce((a, l) => a + Math.exp(l - m), 0)); };
    const logpt = (x, y, al) => { const v = al * al * SD * SD + 1 - al * al; const ls = MU.map((mu, k) => Math.log(W[k]) - ((x - al * mu[0]) ** 2 + (y - al * mu[1]) ** 2) / (2 * v) - Math.log(v)); const m = Math.max(...ls); return m + Math.log(ls.reduce((a, l) => a + Math.exp(l - m), 0)); };
    const lpb = (x, y, b) => (1 - b) * -(x * x + y * y) / 2 + b * logp(x, y);
    const gb = (x, y, b) => { const g = score(x, y, 1); return [(1 - b) * -x + b * g[0], (1 - b) * -y + b * g[1]]; };
    const alphaOf = st => Math.exp(-0.5 * beta * (1 - st / NS));
    const ext = 3.7, cx = S.w / 2, cy = S.h * 0.43, sc = Math.min(S.w, S.h * 0.84) / (2 * ext);
    const P = (x, y) => [cx + x * sc, cy - y * sc];
    let df, an, step, anSteps, clock, hold;
    function reset() { df = []; an = []; for (let i = 0; i < NP; i++) { df.push({ x: rng.normal(), y: rng.normal(), tr: [] }); an.push({ x: rng.normal(), y: rng.normal(), tr: [] }); } step = 0; anSteps = 0; clock = 0; hold = 0; }
    reset();
    // instantaneous densities as a two-colour glow on a small offscreen grid
    const G = 120, glow = document.createElement('canvas'); glow.width = G; glow.height = G; const gctx = glow.getContext('2d'), img = gctx.createImageData(G, G);
    const cA = U.hexToRgb(C.coral), cB = U.hexToRgb(C.blue);
    let lastGlow = -1;
    function renderGlow() {
      const al = alphaOf(step), b = Math.pow(Math.min(1, anSteps / ANN), 2), A = new Float32Array(G * G), Bv = new Float32Array(G * G); let mA = -Infinity, mB = -Infinity;
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const x = -ext + (i + 0.5) / G * 2 * ext, y = ext - (j + 0.5) / G * 2 * ext, q = j * G + i; A[q] = logpt(x, y, al); Bv[q] = lpb(x, y, b); mA = Math.max(mA, A[q]); mB = Math.max(mB, Bv[q]); }
      for (let q = 0; q < G * G; q++) {
        const a = 0.62 * Math.exp(A[q] - mA), bb = 0.62 * Math.exp(Bv[q] - mB), tot = a + bb + 1e-9, alpha = 1 - (1 - a) * (1 - bb);
        img.data[4 * q] = (cA[0] * a + cB[0] * bb) / tot; img.data[4 * q + 1] = (cA[1] * a + cB[1] * bb) / tot; img.data[4 * q + 2] = (cA[2] * a + cB[2] * bb) / tot; img.data[4 * q + 3] = 255 * Math.min(0.8, alpha);
      }
      gctx.putImageData(img, 0, 0);
    }
    function trail(p, col) {
      for (let i = 1; i < p.tr.length; i++) { const a = i / p.tr.length; const [x0, y0] = P(p.tr[i - 1][0], p.tr[i - 1][1]), [x1, y1] = P(p.tr[i][0], p.tr[i][1]); ctx.strokeStyle = rgba(col, 0.5 * a); ctx.lineWidth = 2.4 * a; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      const [x, y] = P(p.x, p.y); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 2 * Math.PI); ctx.fill();
    }
    function bar(y, frac, col, label, count) {
      U.circle(ctx, 40, y - 8, 8, col); text(ctx, label, 58, y, { size: 23, weight: 700, color: col });
      const bx = S.w - 330, bw = 170; roundRect(ctx, bx, y - 14, bw, 10, 5, rgba(col, 0.15)); roundRect(ctx, bx, y - 14, Math.max(10, bw * frac), 10, 5, col);
      text(ctx, count, S.w - 30, y, { size: 21, weight: 600, color: col, align: 'right' });
    }
    function draw() {
      if (lastGlow !== step * 100000 + anSteps) { renderGlow(); lastGlow = step * 100000 + anSteps; }
      S.clear();
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; const [x0, y0] = P(-ext, ext); ctx.drawImage(glow, x0, y0, 2 * ext * sc, 2 * ext * sc); ctx.restore();
      ctx.lineCap = 'round';
      an.forEach(p => { const [x, y] = P(p.x, p.y); ctx.fillStyle = rgba(C.blue, 0.85); ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 2 * Math.PI); ctx.fill(); }); df.forEach(p => trail(p, C.coral));
      const ly = S.h - 72;
      bar(ly, step / NS, C.coral, 'out-of-equilibrium', step + ' steps');
      bar(ly + 42, Math.min(1, anSteps / ANN), C.blue, 'quasi-static process', anSteps.toLocaleString() + ' steps');
    }
    return {
      frame(dt) {
        clock += dt;
        if (hold > 0) { hold += dt; df.forEach(p => { if (p.tr.length) p.tr.shift(); }); an.forEach(p => { if (p.tr.length) p.tr.shift(); }); if (hold > 3) reset(); draw(); return; }
        // one shared step clock (RATE steps per second) for both processes
        const target = Math.floor(clock * RATE);
        while (step < NS && step < target) {
          const t0 = 1 - step / NS, dtau = 1 / NS, al = Math.exp(-0.5 * beta * t0);
          df.forEach(p => { const g = score(p.x, p.y, al); p.x += (0.5 * beta * p.x + 0.5 * beta * g[0]) * dtau; p.y += (0.5 * beta * p.y + 0.5 * beta * g[1]) * dtau; p.tr.push([p.x, p.y]); if (p.tr.length > TR) p.tr.shift(); });
          step++;
        }
        if (step >= NS) df.forEach(p => { if (p.tr.length) p.tr.shift(); });
        // annealed Langevin: MALA at each level, beta rises over ANN steps
        if (anSteps < ANN) {
          const h = 0.02, sq = Math.sqrt(2 * h);
          while (anSteps < ANN && anSteps < target) { const b = Math.pow(Math.min(1, anSteps / ANN), 2); for (const p of an) { const g = gb(p.x, p.y, b); const zx = p.x + h * g[0] + sq * rng.normal(), zy = p.y + h * g[1] + sq * rng.normal(); const g2 = gb(zx, zy, b); const la = lpb(zx, zy, b) - lpb(p.x, p.y, b) - (((p.x - zx - h * g2[0]) ** 2 + (p.y - zy - h * g2[1]) ** 2) - ((zx - p.x - h * g[0]) ** 2 + (zy - p.y - h * g[1]) ** 2)) / (4 * h); if (Math.log(rng.u()) < la) { p.x = zx; p.y = zy; } } anSteps++; }
        } else an.forEach(p => { if (p.tr.length) p.tr.shift(); });
        if (anSteps >= ANN && step >= NS) hold = 1e-6;
        draw();
      }, draw, enter: reset
    };
  };

  // ------------------------------------------------------------------
  // FEAT in 1D: a transport between p_0 = N(0,1) and an unnormalised bimodal target pi, used in both directions.
  // Endpoint weights -> two-sided (BAR) estimate of ΔF. Learned (near-optimal) vs crude transport: both consistent.
  // ------------------------------------------------------------------
  ANIMS.featDemo = function (S, o) {
    const ctx = S.ctx, rng = makeRng(41);
    const MIX = [[0.3, -1.8, 0.35], [0.7, 1.6, 0.45]], cZ = 0.25;          // gamma_1 = cZ * mixture  =>  Z1 = cZ
    const lg0 = x => -0.5 * x * x, lZ0 = 0.5 * Math.log(2 * Math.PI);    // gamma_0 unnormalised
    const dF = lZ0 - Math.log(cZ);                                        // ΔF = -log Z1/Z0
    const lg1 = x => Math.log(cZ * MIX.reduce((a, [w, m, s]) => a + w * Math.exp(lnN(x, m, s)), 0));
    const G = 3001, LO = -5, HI = 5, xg = new Float64Array(G); for (let g = 0; g < G; g++) xg[g] = LO + (HI - LO) * g / (G - 1);
    const F0 = new Float64Array(G), F1 = new Float64Array(G); let a0 = 0, a1 = 0;
    for (let g = 0; g < G; g++) { a0 += Math.exp(lg0(xg[g])); a1 += Math.exp(lg1(xg[g])); F0[g] = a0; F1[g] = a1; }
    for (let g = 0; g < G; g++) { F0[g] /= a0; F1[g] /= a1; }
    const interp = (X, Y, v) => { if (v <= X[0]) return Y[0]; if (v >= X[X.length - 1]) return Y[Y.length - 1]; let lo = 0, hi = X.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (X[m] < v) lo = m; else hi = m; } const t = (v - X[lo]) / Math.max(X[hi] - X[lo], 1e-300); return Y[lo] + t * (Y[hi] - Y[lo]); };
    const Tstar = x => interp(F1, xg, Math.min(1 - 1e-12, Math.max(1e-12, interp(xg, F0, x))));
    function makeT(lam) {                                                // monotone map: lam * optimal + (1 - lam) * shift
      const T = new Float64Array(G); for (let g = 0; g < G; g++) T[g] = lam * Tstar(xg[g]) + (1 - lam) * (xg[g] + 0.4);
      const f = x => interp(xg, T, x), inv = y => interp(T, xg, y);
      const ljac = x => Math.log(Math.max((f(x + 1e-3) - f(x - 1e-3)) / 2e-3, 1e-12));
      return { f, inv, ljac };
    }
    const TL = makeT(0.92), TC = makeT(0.15);
    const samp1 = () => { const [w, m, s] = rng.u() < MIX[0][0] ? MIX[0] : MIX[1]; return m + s * rng.normal(); };
    // log weights: forward  w_F = gamma_1(T x0) |T'(x0)| / gamma_0(x0) (mean Z1/Z0); reverse w_R = gamma_0(x0) / (gamma_1(x1) |T'(x0)|)
    function pair(T) {
      const x0 = rng.normal(), x1 = T.f(x0), lF = lg1(x1) + T.ljac(x0) - lg0(x0);
      const y1 = samp1(), y0 = T.inv(y1), lR = lg0(y0) - lg1(y1) - T.ljac(y0);
      return { x0, x1, lF, y0, y1, lR };
    }
    function bar(LF, LR) {                                                // solve sum_F sig(lF - f) = sum_R sig(lR + f) for f = log Z1/Z0
      const sig = z => 1 / (1 + Math.exp(-z)); let lo = -10, hi = 10;
      for (let it = 0; it < 40; it++) { const f = (lo + hi) / 2; let a = 0, b = 0; for (const l of LF) a += sig(l - f); for (const l of LR) b += sig(l + f); if (a > b) lo = f; else hi = f; }
      return -(lo + hi) / 2;
    }
    const NMAX = 600, PATH_T = 1.4;
    let est, step = 0, paths, clock, hold;
    function reset() { est = { L: { F: [], R: [], tr: [] }, C: { F: [], R: [], tr: [] } }; paths = []; clock = 0; hold = 0; }
    reset();
    // layout: paths panel (left), estimate panel (right)
    const PX0 = 70, PX1 = 560, PY = y => S.h * 0.47 - y * 54;
    const EX0 = 650, EX1 = S.w - 20, EY0 = 70, EY1 = S.h - 70, elo = dF - 0.6, ehi = dF + 0.6;
    const ex = n => EX0 + n / NMAX * (EX1 - EX0), ey = v => EY1 - (Math.min(ehi, Math.max(elo, v)) - elo) / (ehi - elo) * (EY1 - EY0);
    function ridge(x, lp, lZ, color, dir, label) {
      ctx.beginPath(); ctx.moveTo(x, PY(3.6));
      for (let y = 3.6; y >= -3.6; y -= 0.03) ctx.lineTo(x + dir * Math.exp(lp(y) - lZ) * 95, PY(y));
      ctx.lineTo(x, PY(-3.6)); ctx.closePath(); ctx.fillStyle = rgba(color, 0.16); ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
      text(ctx, label, x, 30, { size: 24, weight: 700, color, align: 'center' });
    }
    function draw() {
      S.clear();
      ridge(PX0, lg0, lZ0, C.blue, -1, 'p₀'); ridge(PX1, lg1, Math.log(cZ), C.coral, 1, 'π');
      const px = t => PX0 + (PX1 - PX0) * t;
      paths.forEach(p => {
        const age = clock - p.t0, head = Math.min(1, age / PATH_T), fade = Math.max(0, 1 - Math.max(0, age - PATH_T) / 1.2);
        if (fade <= 0) return;
        const col = p.fwd ? C.teal : C.violet, K = 40, kh = Math.round(head * K);
        ctx.beginPath();
        for (let k = 0; k <= kh; k++) { const s = k / K, t = p.fwd ? s : 1 - s, y = (1 - t) * p.a + t * p.b + p.bb[k]; if (k) ctx.lineTo(px(t), PY(y)); else ctx.moveTo(px(t), PY(y)); }
        ctx.strokeStyle = rgba(col, 0.45 * fade); ctx.lineWidth = 1.8; ctx.stroke();
        if (head >= 1) { const t = p.fwd ? 1 : 0, y = p.fwd ? p.b : p.a; U.circle(ctx, px(t), PY(y), Math.min(14, 3 + 5 * Math.exp(p.lw)), rgba(col, 0.75 * fade)); }
      });
      text(ctx, 'forward', PX0 + 30, S.h - 12, { size: 19, weight: 650, color: C.teal });
      text(ctx, 'reverse', PX1 - 30, S.h - 12, { size: 19, weight: 650, color: C.violet, align: 'right' });
      text(ctx, 'dot size = path weight', (PX0 + PX1) / 2, S.h - 12, { size: 17, color: C.muted, align: 'center' });
      // estimate panel (build 1), crude transport (build 2)
      if (step < 1) return;
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(EX0, EY0 - 10); ctx.lineTo(EX0, EY1); ctx.lineTo(EX1, EY1); ctx.stroke();
      text(ctx, 'free energy estimate', EX0, 30, { size: 22, weight: 700, color: C.ink });
      ctx.save(); ctx.setLineDash([9, 7]); ctx.strokeStyle = C.navy; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(EX0, ey(dF)); ctx.lineTo(EX1, ey(dF)); ctx.stroke(); ctx.restore();
      text(ctx, 'exact ΔF', EX1, ey(dF) - 12, { size: 18, weight: 650, color: C.navy, align: 'right' });
      text(ctx, 'paths', (EX0 + EX1) / 2, EY1 + 30, { size: 18, color: C.muted, align: 'center' });
      const trace = (tr, col, lw) => { if (tr.length < 2) return; ctx.beginPath(); tr.forEach(([n, v], i) => { if (i) ctx.lineTo(ex(n), ey(v)); else ctx.moveTo(ex(n), ey(v)); }); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); };
      if (step >= 2) trace(est.C.tr, rgba(C.steel, 0.9), 2.2);
      trace(est.L.tr, C.teal, 3.2);
      const leg = [['learned transport', C.teal]]; if (step >= 2) leg.push(['crude transport', C.steel]);
      leg.forEach(([t, c], i) => { const y = EY1 - 20 - (leg.length - 1 - i) * 26; ctx.fillStyle = c; ctx.fillRect(EX0 + 20, y - 7, 22, 4); text(ctx, t, EX0 + 50, y, { size: 18, weight: 600, color: c }); });
    }
    function addPath(fwd, p) {
      const K = 40, bb = [], noise = []; let w = 0; for (let k = 0; k <= K; k++) { noise.push(w); w += rng.normal() * 0.12; }
      const end = noise[K]; for (let k = 0; k <= K; k++) bb.push(noise[k] - (k / K) * end);
      const a = fwd ? p.x0 : p.y0, b = fwd ? p.x1 : p.y1, lw = fwd ? p.lF + dF : p.lR - dF;   // weight relative to its mean
      if (!fwd) bb.reverse();
      paths.push({ fwd, a, b, bb, lw, t0: clock });
    }
    let spawn = 0;
    return {
      frame(dt) {
        const n = est.L.F.length;
        if (n >= NMAX) { hold += dt; if (hold > 4) reset(); draw(); return; }   // paths freeze while holding
        clock += dt; paths = paths.filter(p => clock - p.t0 < PATH_T + 1.2);
        spawn += dt;
        for (const [key, T] of [['L', TL], ['C', TC]]) {
          const e = est[key];
          for (let j = 0; j < 2; j++) { const p = pair(T); e.F.push(p.lF); e.R.push(p.lR); if (key === 'L' && spawn > 0.09 && j === 0) { spawn = 0; addPath(rng.u() < 0.5, p); } }
          if (e.F.length % 4 === 0) e.tr.push([e.F.length, bar(e.F, e.R)]);
        }
        draw();
      }, step(f) { if (f >= 1 && step < 1) { est = { L: { F: [], R: [], tr: [] }, C: { F: [], R: [], tr: [] } }; hold = 0; } step = f; }, draw, enter: reset, ff: NMAX / 120 + 1
    };
  };
  // ------------------------------------------------------------------
  // Which path? Annealing q_λ ∝ p0^{1-λ} π^λ (densities known, but mass must hop the barrier late)
  // vs. transport q_λ = law((1-λ) X_0 + λ X_N) (each sample keeps its mode, but q_λ is unknown)
  // ------------------------------------------------------------------
  ANIMS.pathChoice = function (S, o) {
    const ctx = S.ctx, T = { m0: -0.5, s0: 0.8, w: [0.3, 0.7], m: [-1, 1.6], s: [0.5, 0.02] }, XB = 0.6, X0 = -2.6, X1 = 2.6, NG = 1300;
    const xs = Array.from({ length: NG }, (_, i) => X0 + (X1 - X0) * i / (NG - 1)), dx = (X1 - X0) / (NG - 1);
    const lse = (a, b) => Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b)));
    const lpi = (x) => lse(Math.log(T.w[0]) + lnN(x, T.m[0], T.s[0]), Math.log(T.w[1]) + lnN(x, T.m[1], T.s[1]));
    function anneal(l) { const lq = xs.map(x => (1 - l) * lnN(x, T.m0, T.s0) + l * lpi(x)), mx = Math.max(...lq); let q = lq.map(v => Math.exp(v - mx)); const Z = q.reduce((a, b) => a + b, 0) * dx; return q.map(v => v / Z); }
    function transport(l, k) { const m = l * T.m[k] + (1 - l) * T.m0, sd = Math.sqrt(l * l * T.s[k] * T.s[k] + (1 - l) * (1 - l) * T.s0 * T.s0); return xs.map(x => T.w[k] * Math.exp(lnN(x, m, sd))); }
    const rightMass = (q) => q.reduce((a, v, i) => a + (xs[i] > XB ? v * dx : 0), 0);
    const curveA = Array.from({ length: 61 }, (_, i) => [i / 60, rightMass(anneal(i / 60))]);
    const PW = (S.w - 60) / 2, DY0 = 92, DY1 = 270, MY0 = 330, MY1 = S.h - 46, YMAX = 1.6;
    const CL = C.violet, CR = C.teal, CA = C.steel, CT = C.coral;
    let clock = 0;
    const lam = () => { const c = clock % 7.5; return E.inOut(E.clamp(c / 5.5)); };
    function panel(ox, title, sub, col, kind, l) {
      const sx = (x) => ox + 20 + (x - X0) / (X1 - X0) * (PW - 40), sy = (v) => DY1 - Math.min(v, YMAX) / YMAX * (DY1 - DY0);
      text(ctx, title, ox, 30, { size: 26, weight: 700, color: col });
      text(ctx, sub, ox, 60, { size: 18, color: C.inkSoft });
      const fillUnder = (ys, base, color, keep) => {
        ctx.beginPath(); let on = false;
        xs.forEach((x, i) => { if (!keep(x)) return; const X = sx(x), Y = sy(base[i] + ys[i]); if (!on) { ctx.moveTo(X, sy(base[i])); on = true; } ctx.lineTo(X, Y); });
        for (let i = xs.length - 1; i >= 0; i--) if (keep(xs[i])) ctx.lineTo(sx(xs[i]), sy(base[i]));
        ctx.closePath(); ctx.fillStyle = rgba(color, 0.55); ctx.fill();
      };
      const zero = xs.map(() => 0);
      let mR, top;
      if (kind === 'anneal') {
        const q = anneal(l); top = q; mR = rightMass(q);
        fillUnder(q, zero, CL, x => x <= XB); fillUnder(q, zero, CR, x => x >= XB);
        ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = rgba(C.ink, 0.45); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sx(XB), DY0 - 6); ctx.lineTo(sx(XB), DY1); ctx.stroke(); ctx.restore();
        text(ctx, 'barrier', sx(XB), DY0 - 12, { size: 15, color: C.muted, align: 'center' });
      } else {
        const a = transport(l, 0), b = transport(l, 1); top = a.map((v, i) => v + b[i]); mR = T.w[1];
        fillUnder(a, zero, CL, () => true); fillUnder(b, a, CR, () => true);
      }
      ctx.strokeStyle = C.navy; ctx.lineWidth = 2.4; ctx.beginPath(); xs.forEach((x, i) => { const p = [sx(x), sy(top[i])]; if (i) ctx.lineTo(...p); else ctx.moveTo(...p); }); ctx.stroke();
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx(X0), DY1); ctx.lineTo(sx(X1), DY1); ctx.stroke();
      text(ctx, 'λ = ' + l.toFixed(2), ox + PW - 20, DY0 + 4, { size: 18, weight: 650, color: C.ink, align: 'right' });
      // mass in the right mode along the path
      const mx = (v) => ox + 60 + v * (PW - 90), my = (v) => MY1 - v * (MY1 - MY0);
      text(ctx, 'mass in the right mode', ox + 60, MY0 - 14, { size: 17, color: C.inkSoft });
      [0, 0.5, 1].forEach(v => { ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx(0), my(v)); ctx.lineTo(mx(1), my(v)); ctx.stroke(); text(ctx, v.toFixed(1), mx(0) - 10, my(v) + 6, { size: 15, color: C.muted, align: 'right' }); });
      text(ctx, 'λ = 0', mx(0), MY1 + 24, { size: 15, color: C.muted, align: 'center' }); text(ctx, '1', mx(1), MY1 + 24, { size: 15, color: C.muted, align: 'center' });
      ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(mx(0), my(T.w[1])); ctx.lineTo(mx(1), my(T.w[1])); ctx.stroke(); ctx.restore();
      const pts = kind === 'anneal' ? curveA : [[0, T.w[1]], [1, T.w[1]]];
      ctx.strokeStyle = col; ctx.lineWidth = 3.4; ctx.beginPath(); pts.forEach((p, i) => { if (i) ctx.lineTo(mx(p[0]), my(p[1])); else ctx.moveTo(mx(p[0]), my(p[1])); }); ctx.stroke();
      U.circle(ctx, mx(l), my(mR), 8, col, '#fff', 2.4);
      text(ctx, Math.round(100 * mR) + '%', mx(l) + (l > 0.8 ? -14 : 14), my(mR) - 12, { size: 18, weight: 700, color: col, align: l > 0.8 ? 'right' : 'left' });
    }
    function draw() {
      S.clear(); const l = lam();
      panel(0, 'Annealing', 'densities known, but mass hops the barrier late', CA, 'anneal', l);
      panel(PW + 60, 'Transport', 'mass moves smoothly, but densities unknown', CT, 'transport', l);
    }
    return { frame(dt) { clock += dt; draw(); }, draw, enter() { clock = 0; }, ff: 4.6 };
  };
})();
