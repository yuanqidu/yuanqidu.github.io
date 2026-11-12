/* Path weights, one idea per click (slide "Path weights: time reversal is Bayes' rule in time").
   Exact 1D toy in which the model has the right modes but the wrong mode weights:
     target  pi  = 0.7 N(+1.5, 0.4^2) + 0.3 N(-1.5, 0.4^2)
     model   p_N = 0.5 N(+1.5, 0.4^2) + 0.5 N(-1.5, 0.4^2)
   The model is the exact diffusion sampler of p_N (interpolant x_t = (1 - t) x_0 + t x_1 with x_0 ~ N(0, 1)),
   so its forward and backward kernels satisfy Bayes' rule in time up to the size of the time step.
   The picture is the same on every click: generated paths, and one step of the highlighted path shown as Bayes' rule
   (posterior = likelihood x prior / evidence). The path is drawn once and the card assembles once; later clicks only add slide text. */
(function () {
  'use strict';
  const { C, rgba, E, roundRect, arrow, text, makeRng } = U;

  function pwToy(nSteps) {
    const WM = [0.5, 0.5], WT = [0.7, 0.3], M = [1.5, -1.5], SD = [0.4, 0.4], SIG = 0.8, NS = nSteps || 240;
    // marginal of the model at interpolant time t: sum_k WM_k N(t M_k, V_k), V_k = t^2 SD_k^2 + (1 - t)^2;
    // velocity v = E[x_1 - x_0 | x_t] and score s = d/dx log p_t
    function fields(x, t) {
      const r = [0, 0], g = [0, 0], a = [0, 0]; let mx = -Infinity;
      for (let k = 0; k < 2; k++) {
        const V = t * t * SD[k] * SD[k] + (1 - t) * (1 - t), d = x - t * M[k];
        r[k] = Math.log(WM[k]) - 0.5 * d * d / V - 0.5 * Math.log(V); mx = Math.max(mx, r[k]);
        g[k] = -d / V; a[k] = M[k] + (t * SD[k] * SD[k] - (1 - t)) / V * d;
      }
      let Z = 0; for (let k = 0; k < 2; k++) { r[k] = Math.exp(r[k] - mx); Z += r[k]; }
      let v = 0, s = 0; for (let k = 0; k < 2; k++) { v += r[k] / Z * a[k]; s += r[k] / Z * g[k]; }
      return [v, s];
    }
    const dens = (x, t, W) => { let p = 0; for (let k = 0; k < 2; k++) { const V = t * t * SD[k] * SD[k] + (1 - t) * (1 - t); p += W[k] * Math.exp(-0.5 * (x - t * M[k]) ** 2 / V) / Math.sqrt(2 * Math.PI * V); } return p; };
    // one generated path: forward kernel N(x + (v + SIG^2/2 s) h, SIG^2 h); backward kernel N(x' - (v' - SIG^2/2 s') h, SIG^2 h)
    //   D_j = sum_{i<j} log P->(x_{i+1} | x_i) / P<-(x_i | x_{i+1})   (kernels only)
    //   L_j = log p_j(x_j) - log p_0(x_0)                              (exact marginal of the toy)
    function path(x0, rng) {
      const x = new Float64Array(NS + 1), D = new Float64Array(NS + 1), L = new Float64Array(NS + 1), mf = new Float64Array(NS), mb = new Float64Array(NS);
      const h = 1 / NS, sd = SIG * Math.sqrt(h), l0 = Math.log(dens(x0, 0, WM)); x[0] = x0;
      let f = fields(x0, 0);
      for (let j = 0; j < NS; j++) {
        mf[j] = x[j] + (f[0] + 0.5 * SIG * SIG * f[1]) * h;
        const xn = mf[j] + sd * rng.normal(), fn = fields(xn, (j + 1) * h);
        mb[j] = xn - (fn[0] - 0.5 * SIG * SIG * fn[1]) * h;
        D[j + 1] = D[j] + (-(xn - mf[j]) * (xn - mf[j]) + (x[j] - mb[j]) * (x[j] - mb[j])) / (2 * sd * sd);
        L[j + 1] = Math.log(dens(xn, (j + 1) * h, WM)) - l0;
        x[j + 1] = xn; f = fn;
      }
      const p0 = Math.exp(l0), pModel = p0 * Math.exp(D[NS]), pExact = dens(x[NS], 1, WM), pTarget = dens(x[NS], 1, WT);
      return { x, D, L, mf, mb, sd, p0, pModel, pExact, pTarget, w: pTarget / pModel, up: x[NS] > 0 };
    }
    // Bayes' rule over a coarse step of the model, from index ka to kb = ka + m: its m Gaussian steps chained on a grid
    // (grid spacing = the standard deviation of one step, which integrates the Gaussian kernels to about 1e-5).
    //   lik(x)  = P->(X_kb = y | X_ka = x)   the forward kernels, as a function of the earlier state   (likelihood)
    //   back(x) = P<-(X_ka = x | X_kb = y)   the backward (noising) kernels                             (posterior)
    //   pr(x) = p_ka(x), ev = p_kb(y)        exact marginals of the toy;   post = pr * lik / ev          (Bayes)
    // The grid contains x_ka, so the four numbers of the realised pair are grid values.
    function bayes(p, ka, m) {
      const kb = ka + m, h = 1 / NS, sd = SIG * Math.sqrt(h), dx = sd, HW = 5, c0 = 1 / (Math.sqrt(2 * Math.PI) * sd), xa = p.x[ka], y = p.x[kb];
      const L = 5 * SIG * Math.sqrt(m * h) + 0.7, i0 = Math.ceil((xa - Math.min(xa, y) + L) / dx), lo = xa - i0 * dx, G = i0 + Math.ceil((Math.max(xa, y) + L - xa) / dx) + 1;
      const xg = new Float64Array(G); for (let i = 0; i < G; i++) xg[i] = lo + i * dx;
      let u = new Float64Array(G), q = new Float64Array(G);
      for (let i = 0; i < G; i++) { const f = fields(xg[i], (kb - 1) * h), z = (y - xg[i] - (f[0] + 0.5 * SIG * SIG * f[1]) * h) / sd; u[i] = c0 * Math.exp(-0.5 * z * z); }
      for (let j = kb - 2; j >= ka; j--) { // u_j(x) = sum_x' P->(x' | x) u_{j+1}(x')
        const un = new Float64Array(G);
        for (let i = 0; i < G; i++) {
          const f = fields(xg[i], j * h), mu = xg[i] + (f[0] + 0.5 * SIG * SIG * f[1]) * h, c = (mu - lo) / dx, i1 = Math.max(0, Math.ceil(c - HW)), i2 = Math.min(G - 1, Math.floor(c + HW)); let s = 0;
          for (let r = i1; r <= i2; r++) { const z = (xg[r] - mu) / sd; s += Math.exp(-0.5 * z * z) * u[r]; }
          un[i] = s * c0 * dx;
        }
        u = un;
      }
      { const f = fields(y, kb * h), mu = y - (f[0] - 0.5 * SIG * SIG * f[1]) * h; for (let i = 0; i < G; i++) { const z = (xg[i] - mu) / sd; q[i] = c0 * Math.exp(-0.5 * z * z); } }
      for (let j = kb - 1; j > ka; j--) { // q_{j-1}(x) = sum_x' P<-(x | x') q_j(x')
        const qn = new Float64Array(G);
        for (let i = 0; i < G; i++) {
          if (q[i] < 1e-13) continue;
          const f = fields(xg[i], j * h), mu = xg[i] - (f[0] - 0.5 * SIG * SIG * f[1]) * h, c = (mu - lo) / dx, i1 = Math.max(0, Math.ceil(c - HW)), i2 = Math.min(G - 1, Math.floor(c + HW)), wq = q[i] * c0 * dx;
          for (let r = i1; r <= i2; r++) { const z = (xg[r] - mu) / sd; qn[r] += wq * Math.exp(-0.5 * z * z); }
        }
        q = qn;
      }
      const pr = new Float64Array(G), post = new Float64Array(G), ev = dens(y, kb * h, WM);
      let iL = 0, nP = 0, mP = 0, vP = 0;
      for (let i = 0; i < G; i++) { pr[i] = dens(xg[i], ka * h, WM); post[i] = pr[i] * u[i] / ev; if (u[i] > u[iL]) iL = i; nP += post[i]; mP += post[i] * xg[i]; }
      mP /= nP; for (let i = 0; i < G; i++) vP += post[i] * (xg[i] - mP) * (xg[i] - mP); const sdP = Math.sqrt(vP / nP);
      // the local path weight of this step, from the kernels (lw) and from the marginals (lwm); same: equal to the two decimals shown
      const lw = u[i0] / q[i0], lwm = ev / pr[i0];
      return { ka, kb, ta: ka * h, xa, y, G, xg, pr, lik: u, back: q, post, ev, prior: pr[i0], likA: u[i0], backA: q[i0], lw, lwm, same: lw.toFixed(2) === lwm.toFixed(2),
        xL: xg[iL], mP, sdP, sep: (mP - xg[iL]) / sdP, za: (xa - mP) / sdP };
    }
    // a cheap stand-in used to rank candidate steps: the noise-free backward map (centre of the posterior) and the inverse of the
    // noise-free forward map (peak of the likelihood), both started at x_kb
    function proxy(p, ka, m) {
      const h = 1 / NS, w = SIG * Math.sqrt(m * h); let xb = p.x[ka + m], xf = xb;
      for (let j = ka + m; j > ka; j--) { const fb = fields(xb, j * h), ff = fields(xf, j * h); xb -= (fb[0] - 0.5 * SIG * SIG * fb[1]) * h; xf -= (ff[0] + 0.5 * SIG * SIG * ff[1]) * h; }
      return { sep: (xb - xf) / w, za: (p.x[ka] - xb) / w };
    }
    // one backward (noising) path from x_N towards the prior. Its ratio r = p_0(x_0) prod P->(x_{j+1} | x_j) / prod P<-(x_j | x_{j+1})
    // (kernels and the prior density only) averages, over backward draws, to the model's likelihood p_theta(x_N).
    function backPath(xN, rng) {
      const x = new Float64Array(NS + 1), h = 1 / NS, sd = SIG * Math.sqrt(h); x[NS] = xN; let lr = 0;
      for (let j = NS; j > 0; j--) {
        const fb = fields(x[j], j * h), mb = x[j] - (fb[0] - 0.5 * SIG * SIG * fb[1]) * h;
        const xp = mb + sd * rng.normal(), ff = fields(xp, (j - 1) * h), mf = xp + (ff[0] + 0.5 * SIG * SIG * ff[1]) * h;
        lr += (-(x[j] - mf) * (x[j] - mf) + (xp - mb) * (xp - mb)) / (2 * sd * sd);
        x[j - 1] = xp;
      }
      return { x, r: dens(x[0], 0, WM) * Math.exp(lr) };
    }
    // exact likelihood of the discrete sampler: the prior pushed through its NS Gaussian steps on a grid (spacing = one step's sd).
    // This is what the average of the ratios converges to; it differs from the continuous-time density by the time-step error.
    function marginal() {
      const h = 1 / NS, sd = SIG * Math.sqrt(h), dx = sd, n = Math.round(5.4 / dx), G = 2 * n + 1, c0 = 1 / (Math.sqrt(2 * Math.PI) * sd), xg = new Float64Array(G);
      for (let i = 0; i < G; i++) xg[i] = (i - n) * dx;
      let d = new Float64Array(G); for (let i = 0; i < G; i++) d[i] = dens(xg[i], 0, WM);
      for (let j = 0; j < NS; j++) {
        const dn = new Float64Array(G);
        for (let i = 0; i < G; i++) {
          if (d[i] < 1e-15) continue;
          const f = fields(xg[i], j * h), mu = xg[i] + (f[0] + 0.5 * SIG * SIG * f[1]) * h, c = mu / dx + n, i1 = Math.max(0, Math.ceil(c - 5)), i2 = Math.min(G - 1, Math.floor(c + 5)), wq = d[i] * c0 * dx;
          for (let r = i1; r <= i2; r++) { const z = (xg[r] - mu) / sd; dn[r] += wq * Math.exp(-0.5 * z * z); }
        }
        d = dn;
      }
      return { xg, d, dx, n };
    }
    return { NS, M, WM, WT, dens, path, bayes, proxy, backPath, marginal };
  }

  ANIMS.pathWeightStory = function (S, o) {
    const ctx = S.ctx, T = pwToy(), NS = T.NS;
    const T_RUN = 4.4, T_HOLD = 3.6, P = T_RUN + T_HOLD, XLIM = 3.0, DS = 200;
    const RED = '#B4492F';
    // tv: time since the slide was entered (the Bayes picture assembles once); tSw: time since the highlighted path changed
    let clock = 0, cyc = 0, tv = 0, tSw = 99;

    // ---- precompute: an ensemble of generated paths and four clean highlighted ones (two per mode) ----
    const rng = makeRng(2026), ens = [];
    for (let i = 0; i < 18; i++) ens.push(T.path(-1.9 + 3.8 * (i + 0.5) / 18 + 0.08 * rng.normal(), rng));
    const absMax = (a) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i])); return m; };
    function pick(up, n) {
      const out = [], r2 = makeRng(up ? 11 : 12), nom = up ? T.WT[0] / T.WM[0] : T.WT[1] / T.WM[1];
      for (let tries = 0; tries < 4000 && out.length < n; tries++) {
        const p = T.path(0.9 * r2.normal(), r2);
        if (p.up !== up || absMax(p.x) > 2.75 || absMax(p.L) > 3.0 || absMax(p.L) < 1.0) continue;
        if (Math.abs(p.x[NS] - T.M[up ? 0 : 1]) > 0.3) continue;
        if (Math.abs(p.D[NS] - p.L[NS]) > 0.05 || Math.abs(p.w - nom) > 0.05) continue;
        let dev = 0; for (let j = 0; j <= NS; j++) dev = Math.max(dev, Math.abs(p.D[j] - p.L[j])); if (dev > 0.22) continue;
        p.ym = Math.max(1.2, 1.18 * Math.max(absMax(p.L), absMax(p.D))); out.push(p);
      }
      return out;
    }
    const ups = pick(true, 2), lows = pick(false, 2), HL = [ups[0], lows[0], ups[1], lows[1]].filter(Boolean);
    // The step shown as Bayes' rule is a coarse one, a quarter of the path, so that the prior matters against the kernels.
    // Candidates are ranked by a cheap proxy and checked on the exact chained kernels: a clear shift of the posterior against the
    // likelihood, X_t well inside the posterior, and the local path weight equal, to the two decimals shown, whether it is taken
    // from the kernels or from the marginals.
    const MB = Math.round(NS / 4);
    function bayesOf(p) {
      if (p.bz) return p.bz;
      const cand = [];
      for (let ka = Math.round(0.3 * NS); ka + MB <= Math.round(0.95 * NS); ka += 6) { const q = T.proxy(p, ka, MB); if (Math.abs(q.za) <= 1) cand.push([Math.abs(q.sep), ka]); }
      cand.sort((a, b) => b[0] - a[0]);
      let best = null;
      for (let i = 0; i < Math.min(10, cand.length); i++) {
        const B = T.bayes(p, cand[i][1], MB);
        if (B.same && Math.abs(B.za) <= 1.15 && Math.abs(B.sep) >= 0.6) { best = B; break; }
        if (!best || (B.same && !best.same)) best = B;
      }
      return (p.bz = best || T.bayes(p, Math.round(0.45 * NS), MB));
    }

    // ---- geometry ----  ({"bayes": false}: no Bayes-rule card on the right; the paths card then takes the whole canvas)
    const BAYES_ON = !(o && o.bayes === false);
    const MW = BAYES_ON ? 1000 : S.w, X0 = BAYES_ON ? 128 : 200, X1 = BAYES_ON ? 770 : S.w - 330, Y0 = 76, Y1 = 486;
    const RX = MW + 28, RW = S.w - RX;
    const tx = (j) => X0 + j / NS * (X1 - X0), ty = (x) => Y1 - (Math.max(-XLIM, Math.min(XLIM, x)) + XLIM) / (2 * XLIM) * (Y1 - Y0);
    const grid = []; for (let i = 0; i <= 200; i++) grid.push(-XLIM + 2 * XLIM * i / 200);
    const gPrior = grid.map(x => T.dens(x, 0, T.WM)), gModel = grid.map(x => T.dens(x, 1, T.WM)), gTarget = grid.map(x => T.dens(x, 1, T.WT));

    function density(vals, x0, dir, fill, stroke, lw) {
      ctx.beginPath(); ctx.moveTo(x0, ty(grid[0]));
      for (let i = 0; i < grid.length; i++) ctx.lineTo(x0 + dir * vals[i] * DS, ty(grid[i]));
      ctx.lineTo(x0, ty(grid[grid.length - 1])); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
    }
    function line(xs, n, fy, color, lw, j0) {
      j0 = j0 || 0; if (n <= j0) return;
      ctx.beginPath(); for (let j = j0; j <= n; j++) { const X = tx(j), Y = fy(xs[j]); if (j > j0) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
    }
    // All notation is typeset by KaTeX (S.tex, a layer over the canvas); words and numbers stay canvas text.
    const PF = '\\Pf(X_{t+1}\\mid X_t)', PB = '\\Pb(X_t\\mid X_{t+1})';

    // ---- left card: the paths, the model's and the target's density, and the marked step ----
    function mainCard(p, n, hold, hu) {
      roundRect(ctx, 0, 0, MW, S.h, 16, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      text(ctx, 'The model generates paths: prior → samples', 26, 42, { size: 24, weight: 650, color: C.ink });
      // legend of the two densities on the right
      ctx.fillStyle = C.teal; ctx.fillRect(X1 + 14, 25, 22, 4); text(ctx, 'model', X1 + 44, 33, { size: 19, color: C.tealDark, weight: 650 });
      ctx.fillStyle = C.coral; ctx.fillRect(X1 + 122, 25, 22, 4); text(ctx, 'target', X1 + 152, 33, { size: 19, color: RED, weight: 650 });
      // axes, prior, target, model
      ctx.strokeStyle = rgba(C.inkSoft, 0.3); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.moveTo(X1, Y0); ctx.lineTo(X1, Y1); ctx.stroke();
      density(gPrior, X0, -1, rgba(C.muted, 0.3), rgba(C.inkSoft, 0.6), 2);
      density(gTarget, X1, 1, rgba(C.coral, 0.16), C.coral, 2.2);
      density(gModel, X1, 1, rgba(C.teal, 0.10), C.teal, 2.6);
      S.tex('t0', '$t=0$ · prior', X0, Y1 + 27, { size: 18, color: C.muted, align: 'center' });
      S.tex('tN', '$t=N$', X1, Y1 + 27, { size: 18, color: C.muted, align: 'center' });
      // paths
      ctx.save(); ctx.beginPath(); ctx.rect(X0 - 6, Y0 - 4, X1 - X0 + 12, Y1 - Y0 + 8); ctx.clip();
      ens.forEach(q => line(q.x, NS, ty, rgba(C.teal, 0.2), 1.3));
      line(p.x, n, ty, C.teal, 3.2);
      ctx.restore();
      U.circle(ctx, tx(0), ty(p.x[0]), 6, C.muted);
      // the step shown as Bayes' rule on the right: X_t, X_t+1 and the stretch of path between them
      const B = bayesOf(p);
      if (B && n >= B.ka) {
        const mark = (key, j, src) => {
          const X = tx(j), Y = ty(p.x[j]), ly = Y - 38 > Y0 ? Y - 18 : Y + 36;
          U.circle(ctx, X, Y, 8.5, '#fff', C.navy, 2.6);
          const tw = S.tex(key, src, X, ly, { size: 21, color: C.navy, align: 'center' }).w || 30;
          roundRect(ctx, X - tw / 2 - 6, ly - 23, tw + 12, 33, 8, 'rgba(255,255,255,0.88)');
        };
        line(p.x, Math.min(n, B.kb), ty, C.navy, 3.6, B.ka);
        mark('mXa', B.ka, '$X_t$');
        if (n >= B.kb) mark('mXb', B.kb, '$X_{t+1}$');
      }
      U.circle(ctx, tx(n), ty(p.x[n]), 7, hold ? C.tealDark : C.teal, '#fff', 1.6);
    }

    // ---- right card: the marked step as Bayes' rule. Given the next state X_t+1, where was the path at time t?
    //      prior = marginal p_t, likelihood = forward kernel as a function of X_t, posterior = backward kernel (filled),
    //      against prior x likelihood / evidence (dashed), all on one density scale. Below: Bayes' rule with the four factors named.
    const BAYES = [['posterior', C.blue, '$' + PB + '$'], ['likelihood', C.tealDark, '$' + PF + '$'], ['prior', C.inkSoft, '$p_t(X_t)$'], ['evidence', C.inkSoft, '$p_{t+1}(X_{t+1})$']];
    function bayesCard(p) {
      const B = bayesOf(p);
      roundRect(ctx, RX, 0, RW, S.h, 16, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      text(ctx, 'One step of this path is Bayes\' rule', RX + 26, 42, { size: 24, weight: 650, color: C.ink });
      // the picture assembles once (prior, likelihood, posterior, their product), afterwards it only cross-fades from path to path
      const sw = tv > 5.4 ? E.clamp(tSw / 0.35) : 1, st = (t0, d) => E.clamp((tv - t0) / d);
      const bPr = st(0.3, 0.6), bLk = st(1.2, 0.6), bPo = st(2.1, 0.6), bBy = st(3.0, 0.6), bSc = st(3.7, 0.5);
      // ---- plot: state at time t on the axis, a window on the side of the prior's bulk
      const PX0 = RX + 30, PX1 = RX + RW - 30, YB = 384, HP = 256, WW = 4.4, LW = 236, LH = 108;
      if (!B.pl) {
        const dir = B.mP >= B.xL ? 1 : -1, mid = Math.max(-XLIM + WW / 2, Math.min(XLIM - WW / 2, B.mP + 0.25 * dir)), xw0 = mid - WW / 2;
        const px = (x) => PX0 + (x - xw0) / WW * (PX1 - PX0), lx = dir > 0 ? PX1 - LW : PX0;
        const pg = [], pv = []; for (let i = 0; i <= 160; i++) { const x = xw0 + WW * i / 160; pg.push(x); pv.push(T.dens(x, B.ta, T.WM)); }
        let vmax = 0, vleg = 0, iP = 0; // the curves stay below the legend
        for (let i = 0; i < B.G; i++) { const X = px(B.xg[i]); if (B.back[i] > B.back[iP]) iP = i; if (X < PX0 || X > PX1) continue; const v = Math.max(B.lik[i], B.post[i], B.back[i]); vmax = Math.max(vmax, v); if (X > lx - 12 && X < lx + LW + 12) vleg = Math.max(vleg, v); }
        pg.forEach((x, i) => { vmax = Math.max(vmax, pv[i]); const X = px(x); if (X > lx - 12 && X < lx + LW + 12) vleg = Math.max(vleg, pv[i]); });
        B.pl = { dir, xw0, px, lx, pg, pv, xP: B.xg[iP], ymax: Math.max(vmax, vleg * HP / (HP - LH - 12)) };
      }
      const { px, lx, pg, pv, xP, ymax } = B.pl, py = (v) => YB - v / ymax * HP;
      const trace = (xs, vs, n) => { let on = false; for (let i = 0; i < n; i++) { const X = px(xs[i]); if (X < PX0 - 10 || X > PX1 + 10) continue; if (on) ctx.lineTo(X, py(vs[i])); else { ctx.moveTo(X, py(vs[i])); on = true; } } };
      const area = (xs, vs, n, fill) => { let x0 = null, x1 = null; for (let i = 0; i < n; i++) { const X = px(xs[i]); if (X < PX0 - 10 || X > PX1 + 10) continue; if (x0 === null) x0 = X; x1 = X; } ctx.beginPath(); trace(xs, vs, n); ctx.lineTo(x1, YB); ctx.lineTo(x0, YB); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
      ctx.save(); ctx.beginPath(); ctx.rect(PX0, YB - HP - 70, PX1 - PX0, HP + 71.5); ctx.clip(); ctx.lineJoin = 'round';
      ctx.globalAlpha = bPr * sw; area(pg, pv, pg.length, rgba(C.muted, 0.30)); ctx.beginPath(); trace(pg, pv, pg.length); ctx.strokeStyle = rgba(C.inkSoft, 0.6); ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = bPo * sw; area(B.xg, B.back, B.G, rgba(C.blue, 0.26));
      ctx.globalAlpha = bLk * sw; ctx.beginPath(); trace(B.xg, B.lik, B.G); ctx.strokeStyle = C.teal; ctx.lineWidth = 2.8; ctx.stroke();
      ctx.globalAlpha = bBy * sw; ctx.beginPath(); trace(B.xg, B.post, B.G); ctx.setLineDash([7, 5]); ctx.strokeStyle = C.navy; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = rgba(C.inkSoft, 0.45); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(PX0, YB); ctx.lineTo(PX1, YB); ctx.stroke();
      // ---- the realised X_t, with a dot on each curve
      const XA = px(B.xa), top = Math.max(bPr > 0 ? B.prior : 0, bLk > 0 ? B.likA : 0, bPo > 0 ? B.backA : 0);
      ctx.save(); ctx.globalAlpha = bPr * sw; ctx.setLineDash([3, 5]); ctx.strokeStyle = rgba(C.ink, 0.55); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(XA, YB); ctx.lineTo(XA, py(top)); ctx.stroke(); ctx.restore();
      [[B.prior, C.inkSoft, bPr], [B.likA, C.teal, bLk], [B.backA, C.blue, bPo]].forEach(([v, col, a]) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a * sw; U.circle(ctx, XA, py(v), 6, col, '#fff', 1.8); ctx.restore(); });
      S.tex('xa', '$X_t$', XA, YB + 28, { size: 21, color: C.ink, align: 'center', alpha: bPr });
      const axR = XA < PX1 - 190;
      S.tex('axs', 'state at time $t$', axR ? PX1 : PX0, YB + 27, { size: 18, color: C.inkSoft, align: axR ? 'right' : 'left' });
      // ---- the prior pulls the likelihood into the posterior: for a small step the shift is the score term of the time reversal
      if (bSc > 0) {
        let vL = 0, vP = 0; for (let i = 0; i < B.G; i++) { vL = Math.max(vL, B.lik[i]); vP = Math.max(vP, B.back[i]); }
        const xs0 = px(B.xL), xs1 = px(xP), ya = Math.min(py(vL), py(vP)) - 16;
        if (Math.abs(xs1 - xs0) > 24) {
          ctx.save(); ctx.globalAlpha = bSc * sw; arrow(ctx, xs0, ya, xs1, ya, C.navy, 2.6, 11); ctx.restore();
          S.tex('score', 'score $\\nabla\\log p_t$', (xs0 + xs1) / 2, ya - 13, { size: 19, color: C.navy, weight: 650, align: 'center', alpha: bSc * sw });
        }
      }
      // ---- legend, read downwards: posterior ∝ prior × likelihood
      const ly = YB - HP + 16, lt = lx + 34;
      ctx.save(); ctx.globalAlpha = bPr; roundRect(ctx, lx + 2, ly - 13, 24, 14, 3, rgba(C.muted, 0.42), rgba(C.inkSoft, 0.6), 1.5); ctx.restore();
      text(ctx, 'prior', lt, ly, { size: 19, weight: 650, color: C.inkSoft, alpha: bPr });
      ctx.save(); ctx.globalAlpha = bLk; ctx.strokeStyle = C.teal; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx + 2, ly + 19); ctx.lineTo(lx + 26, ly + 19); ctx.stroke(); ctx.restore();
      text(ctx, 'likelihood', lt, ly + 25, { size: 19, weight: 650, color: C.tealDark, alpha: bLk });
      ctx.save(); ctx.globalAlpha = bPo; roundRect(ctx, lx + 2, ly + 37, 24, 14, 3, rgba(C.blue, 0.34)); ctx.restore();
      text(ctx, 'posterior', lt, ly + 50, { size: 19, weight: 650, color: C.blue, alpha: bPo });
      ctx.save(); ctx.globalAlpha = bBy; ctx.setLineDash([7, 5]); ctx.strokeStyle = C.navy; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(lx + 2, ly + 69); ctx.lineTo(lx + 26, ly + 69); ctx.stroke(); ctx.restore();
      S.tex('lg4', '$\\propto$ prior $\\times$ likelihood', lt, ly + 75, { size: 19, weight: 650, color: C.navy, alpha: bBy });
      // ---- Bayes' rule in its usual form, the four factors named
      const cx = [RX + 112, RX + 304, RX + 450, RX + 577], ox = [RX + 208, RX + 395, RX + 504];
      BAYES.forEach(([name, col, src], k) => {
        text(ctx, name, cx[k], 458, { size: 22, weight: 700, color: col, align: 'center' });
        S.tex('b' + k, src, cx[k], 506, { size: 22, color: k < 2 ? col : C.ink, align: 'center' });
      });
      ['$=$', '$\\times$', '$/$'].forEach((s, k) => S.tex('o' + k, s, ox[k], 506, { size: 22, color: C.ink, align: 'center' }));
    }

    function draw() {
      S.clear();
      if (!HL.length) return;
      const p = HL[cyc % HL.length], hold = clock >= T_RUN, n = hold ? NS : Math.min(NS, Math.floor(clock / T_RUN * NS)), hu = hold ? (clock - T_RUN) / T_HOLD : 0;
      mainCard(p, n, hold, hu);
      if (BAYES_ON) bayesCard(p);
    }
    return {
      // one round only: the highlighted path is drawn once and then holds (no second path, no replay)
      frame(dt) { clock = Math.min(P, clock + dt); tv += dt; tSw += dt; draw(); }, draw,
      enter() { clock = 0; cyc = 0; tv = 0; tSw = 99; },
      ff: T_RUN + 0.6 * T_HOLD
    };
  };
  // ------------------------------------------------------------------
  // The same toy on the "One derivation, every estimator" slide, one scene per click (options: startStep, zStep). The title and the
  // formula of the likelihood scene are an HTML overlay on the slide (top left of the left card, shown at startStep only):
  //   startStep  likelihood of the model at a point X_N: backward draws from X_N towards the prior, the ratio
  //              p_0(X_0) prod P-> / prod P<- of each, and their running average against the exact likelihood
  //   zStep      free energy: generated paths, each with its work W = -log w; the distribution of W over paths, the mean work <W>
  //              and the Jarzynski estimate -log <e^-W>, which settles on the exact Delta F = -log Z (0 here: the target is normalised).
  //              This scene stays for all later clicks.
  // ------------------------------------------------------------------
  ANIMS.pathWeightEstimators = function (S, o) {
    const ctx = S.ctx, T = pwToy(120), NS = T.NS, XLIM = 3.0, DS = 150, RED = '#B4492F';
    const START = (o && o.startStep) || 0, STEP_Z = o && o.zStep !== undefined ? o.zStep : 1;
    const sceneOf = (k) => (k >= STEP_Z ? 1 : 0);
    // sc: seconds in the current scene; late: its start-up delay (on the first click the slide's derivation shrinks out of the way first)
    let step = 0, scene = 0, sc = 0, late = 0;
    // ---- a population of generated paths (the first ones are drawn), with weights w and works W = -log w ----
    const rng = makeRng(77), NP = 1200, NDRAW = 36, drawn = [], xN = new Float64Array(NP), w = new Float64Array(NP), Wk = new Float64Array(NP);
    for (let i = 0; i < NP; i++) { const p = T.path(rng.normal(), rng); xN[i] = p.x[NS]; w[i] = p.w; Wk[i] = -Math.log(p.w); if (i < NDRAW) drawn.push(p); }
    // works: running sums (mean work and Jarzynski estimate after n paths), histogram bins, mean work of the paths into each mode
    const cW = new Float64Array(NP + 1), cw = new Float64Array(NP + 1), WLO = -1.0, WHI = 1.4, NWB = 48, wbin = new Int16Array(NP), wfin = new Float64Array(NWB);
    for (let i = 0; i < NP; i++) { cW[i + 1] = cW[i] + Wk[i]; cw[i + 1] = cw[i] + w[i]; const b = Math.floor((Wk[i] - WLO) / (WHI - WLO) * NWB); wbin[i] = b >= 0 && b < NWB ? b : -1; if (wbin[i] >= 0) wfin[wbin[i]]++; }
    const wMax = Math.max.apply(null, wfin), wMean = cW[NP] / NP;
    const MODEW = [0, 1].map(k => { let s = 0, n = 0; for (let i = 0; i < NP; i++) if ((xN[i] > 0) === (k === 0)) { s += Wk[i]; n++; } s /= Math.max(1, n); return '$W\\approx' + (s < 0 ? '-' : '+') + Math.abs(s).toFixed(2) + '$'; });
    // ---- likelihood at three points X_N (grid nodes of the exact marginal): KB backward draws each, with their ratios ----
    const MG = T.marginal(), KB = 60, T_DRAW = 5.0, T_ONE = 0.45, P_LIK = 8.0;
    const PTS = [1.53, -1.02, 1.9].map((x, a) => {
      const i = Math.round(x / MG.dx) + MG.n, r = makeRng(41 + a), paths = [], cum = new Float64Array(KB + 1);
      for (let k = 0; k < KB; k++) { const b = T.backPath(MG.xg[i], r); paths.push(b); cum[k + 1] = cum[k] + b.r; }
      return { x: MG.xg[i], exact: MG.d[i], paths, cum };
    });
    // ---- geometry (canvas drawn at its own size, no CSS scaling) ----
    const LW = 656, RX = LW + 30, RW = S.w - RX, X0 = 88, X1 = 486, Y0 = 122, Y1 = S.h - 78;
    const tx = (j) => X0 + j / NS * (X1 - X0), ty = (x) => Y1 - (Math.max(-XLIM, Math.min(XLIM, x)) + XLIM) / (2 * XLIM) * (Y1 - Y0);
    const grid = []; for (let i = 0; i <= 160; i++) grid.push(-XLIM + 2 * XLIM * i / 160);
    const gPrior = grid.map(x => T.dens(x, 0, T.WM)), gModel = grid.map(x => T.dens(x, 1, T.WM)), gTarget = grid.map(x => T.dens(x, 1, T.WT));
    const num = (v, d) => (Math.abs(v) < 0.5 * Math.pow(10, -d) ? (0).toFixed(d) : (v < 0 ? '−' : '') + Math.abs(v).toFixed(d));
    const textW = (str, size, weight) => { ctx.save(); ctx.font = U.font(size, weight); const m = ctx.measureText(str).width; ctx.restore(); return m; };
    function density(vals, x0, dir, fill, stroke, lw) {
      ctx.beginPath(); ctx.moveTo(x0, ty(grid[0]));
      for (let i = 0; i < grid.length; i++) ctx.lineTo(x0 + dir * vals[i] * DS, ty(grid[i]));
      ctx.lineTo(x0, ty(grid[grid.length - 1])); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
    }
    // prior on the left axis, target and model on the right axis; the legend is a list of [kind, colour, label, text colour]
    function axes(a, tag, legend) {
      ctx.strokeStyle = rgba(C.inkSoft, 0.3); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.moveTo(X1, Y0); ctx.lineTo(X1, Y1); ctx.stroke();
      density(gPrior, X0, -1, rgba(C.muted, 0.3), rgba(C.inkSoft, 0.6), 2);
      density(gTarget, X1, 1, rgba(C.coral, 0.16), C.coral, 2.2);
      density(gModel, X1, 1, rgba(C.teal, 0.10), C.teal, 2.6);
      const ly = S.h - 26; let lx = 28;
      legend.forEach(([kind, col, src, tcol], i) => {
        if (kind === 'dot') U.circle(ctx, lx + 9, ly - 7, 8, col); else { ctx.fillStyle = col; ctx.fillRect(lx, ly - (kind === 'bar' ? 11 : 9), 22, kind === 'bar' ? 7 : 4); }
        lx += 30 + (S.tex(tag + i, src, lx + 30, ly, { size: 19, color: tcol || col, weight: 650, alpha: a }).w || 90) + 26;
      });
      S.tex('t0', '$t=0$ · prior', X0, Y1 + 24, { size: 18, color: C.muted, align: 'center', alpha: a });
    }
    // ================= scene 0: the model's likelihood at X_N from backward draws =================
    function likScene(a, t) {
      const cyc = Math.floor(t / P_LIK), tc = t - cyc * P_LIK, ip = cyc % PTS.length, B = PTS[ip], yN = ty(B.x), af = a * E.clamp(tc / 0.3), dt = T_DRAW / KB;
      const nDone = Math.max(0, Math.min(KB, Math.floor((tc - T_ONE) / dt) + 1)), avg = nDone ? B.cum[nDone] / nDone : 0;
      ctx.save(); ctx.globalAlpha = a;
      roundRect(ctx, 0, 0, LW, S.h, 16, '#fff', rgba(C.inkSoft, 0.15), 1.5); roundRect(ctx, RX, 0, RW, S.h, 16, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      axes(a, 'la', [['line', C.teal, 'model', C.tealDark], ['line', C.coral, 'target', RED], ['line', C.blue, 'backward paths'], ['bar', C.navy, 'their average']]);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = af; ctx.beginPath(); ctx.rect(X0 - 4, Y0 - 4, X1 - X0 + 8, Y1 - Y0 + 8); ctx.clip(); ctx.lineJoin = 'round';
      for (let k = 0; k < KB; k++) {
        const u = E.clamp((tc - k * dt) / T_ONE); if (u <= 0) break;
        const p = B.paths[k], j0 = Math.round((1 - u) * NS); ctx.beginPath();
        for (let j = NS; j >= j0; j--) { const X = tx(j), Y = ty(p.x[j]); if (j < NS) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.strokeStyle = u < 1 ? C.blue : rgba(C.blue, 0.26); ctx.lineWidth = u < 1 ? 2.2 : 1.3; ctx.stroke();
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = af;
      for (let k = 0; k < nDone; k++) U.circle(ctx, X0, ty(B.paths[k].x[0]), 3.6, rgba(C.blue, 0.55));
      // the running average, on the scale of the densities: it reaches out to the model's density at X_N
      if (nDone) { ctx.strokeStyle = C.navy; ctx.lineWidth = 7; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(X1, yN); ctx.lineTo(X1 + avg * DS, yN); ctx.stroke(); U.circle(ctx, X1 + avg * DS, yN, 5.5, C.navy, '#fff', 1.6); }
      U.circle(ctx, X1, yN, 8, C.navy, '#fff', 2);
      const xr = X1 + Math.max(T.dens(B.x, 1, T.WT), T.dens(B.x, 1, T.WM)) * DS, xl = X1 + 122; // label clear of both densities
      if (xl - xr > 26) { ctx.setLineDash([3, 5]); ctx.strokeStyle = rgba(C.navy, 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xr + 8, yN); ctx.lineTo(xl - 6, yN); ctx.stroke(); }
      ctx.restore();
      S.tex('xN', '$X_N$', xl, yN + 7, { size: 23, color: C.navy, alpha: af });
      // ---- right: the ratio of every backward path and the running average, against the exact likelihood
      text(ctx, 'Average over backward paths', RX + 26, 42, { size: 23, weight: 680, color: C.navy, alpha: a });
      text(ctx, nDone ? avg.toFixed(3) : '', RX + RW - 26, 43, { size: 27, weight: 760, color: C.navy, align: 'right', alpha: af });
      text(ctx, 'average', RX + RW - 26 - 92, 42, { size: 19, weight: 600, color: C.navy, align: 'right', alpha: a });
      const ey = 76, exs = B.exact.toFixed(3), exn = textW(exs, 19, 700);
      ctx.save(); ctx.globalAlpha = a; U.circle(ctx, RX + 35, ey - 7, 5, rgba(C.blue, 0.8)); ctx.restore();
      text(ctx, 'ratio of one path', RX + 50, ey, { size: 19, weight: 600, color: C.blue, alpha: a });
      text(ctx, exs, RX + RW - 26, ey, { size: 19, weight: 700, color: C.tealDark, align: 'right', alpha: af });
      const exw = S.tex('exact', 'exact $p_\\theta(X_N)=$', RX + RW - 26 - exn - 7, ey, { size: 19, weight: 650, color: C.tealDark, align: 'right', alpha: a }).w || 150;
      const gx = RX + 74, gx1 = RX + RW - 30, gy0 = 104, gy1 = S.h - 62, LO = 0.4, HI = 1.6;
      const yv = (v) => gy1 - (Math.max(LO, Math.min(HI, v / B.exact)) - LO) / (HI - LO) * (gy1 - gy0), xk = (k) => gx + (k + 0.5) / KB * (gx1 - gx);
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = rgba(C.muted, 0.6); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(RX + RW - 26 - exn - 7 - exw - 36, ey - 7); ctx.lineTo(RX + RW - 26 - exn - 7 - exw - 10, ey - 7); ctx.stroke();
      ctx.strokeStyle = rgba(C.inkSoft, 0.4); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, gy0); ctx.lineTo(gx, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalAlpha = af;
      ctx.strokeStyle = rgba(C.muted, 0.5); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(gx, yv(B.exact)); ctx.lineTo(gx1, yv(B.exact)); ctx.stroke();
      for (let k = 0; k < nDone; k++) U.circle(ctx, xk(k), yv(B.paths[k].r), 4.6, rgba(C.blue, 0.7));
      if (nDone) { ctx.beginPath(); for (let k = 0; k < nDone; k++) { const X = xk(k), Y = yv(B.cum[k + 1] / (k + 1)); if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.strokeStyle = C.navy; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke(); U.circle(ctx, xk(nDone - 1), yv(avg), 5.5, C.navy, '#fff', 1.6); }
      [0.5, 1, 1.5].forEach(f => { ctx.strokeStyle = rgba(C.inkSoft, 0.4); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx - 5, yv(f * B.exact)); ctx.lineTo(gx, yv(f * B.exact)); ctx.stroke(); });
      ctx.restore();
      [0.5, 1, 1.5].forEach(f => text(ctx, (f * B.exact).toFixed(2), gx - 10, yv(f * B.exact) + 6, { size: 18, color: f === 1 ? C.tealDark : C.muted, weight: f === 1 ? 700 : 500, align: 'right', alpha: af }));
      [1, 20, 40].forEach(k => text(ctx, String(k), xk(k - 1), gy1 + 25, { size: 18, color: C.muted, align: 'center', alpha: a }));
      text(ctx, KB + ' backward paths', gx1, gy1 + 25, { size: 18, color: C.inkSoft, align: 'right', alpha: a });
    }
    // ================= scene 1: free energy. Generated paths with their works; Jarzynski's exponential average against the mean work =================
    function workScene(a, t) {
      const u = E.clamp(t / 4.6), n = Math.max(1, Math.round(Math.pow(NP, u))), mW = cW[n] / n, jar = -Math.log(cw[n] / n), aV = a * E.clamp((u - 0.8) / 0.15);
      const aT = a * E.clamp((t - 0.4) / 0.3); // the title waits until the slide's overlay of the likelihood scene has faded out
      ctx.save(); ctx.globalAlpha = a;
      roundRect(ctx, 0, 0, LW, S.h, 16, '#fff', rgba(C.inkSoft, 0.15), 1.5); roundRect(ctx, RX, 0, RW, S.h, 16, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      axes(a, 'lb', [['line', C.teal, 'model', C.tealDark], ['line', C.coral, 'target', RED], ['dot', rgba(C.navy, 0.6), 'path weight $w$', C.navy]]);
      // ---- left: generated paths, each with its weight (circle) and so its work
      const nShow = Math.min(NDRAW, n);
      ctx.save(); ctx.beginPath(); ctx.rect(X0 - 4, Y0 - 4, X1 - X0 + 8, Y1 - Y0 + 8); ctx.clip();
      for (let i = 0; i < nShow; i++) {
        const p = drawn[i]; ctx.beginPath();
        for (let j = 0; j <= NS; j += 2) { const X = tx(j), Y = ty(p.x[j]); if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.strokeStyle = rgba(C.teal, 0.3); ctx.lineWidth = 1.3; ctx.stroke();
      }
      ctx.restore();
      for (let i = 0; i < nShow; i++) U.circle(ctx, X1, ty(drawn[i].x[NS]), 7 * Math.pow(drawn[i].w, 0.85), rgba(C.navy, 0.42));
      ctx.restore();
      S.tex('ttl', 'Each generated path carries its work $W=-\\log w$', 26, 42, { size: 23, weight: 680, color: C.navy, alpha: aT });
      [0, 1].forEach(k => { // the work of a path into each mode
        const X = X1 - 26, Y = ty(T.M[k]) + (k ? 54 : -40), tw = S.tex('mw' + k, MODEW[k], X, Y, { size: 21, color: C.navy, align: 'right', alpha: a }).w || 110;
        ctx.save(); ctx.globalAlpha = a; roundRect(ctx, X - tw - 8, Y - 23, tw + 16, 33, 9, 'rgba(255,255,255,0.9)'); ctx.restore();
      });
      // ---- right: Jarzynski. Works of the generated paths, mean work, exponential average
      S.tex('jt', 'Jarzynski equality: $Z=\\langle w\\rangle=\\langle e^{-W}\\rangle$', RX + 26, 42, { size: 23, weight: 680, color: C.navy, alpha: a });
      text(ctx, n.toLocaleString() + (n === 1 ? ' path' : ' paths'), RX + RW - 26, 42, { size: 19, weight: 600, color: C.inkSoft, align: 'right', alpha: a });
      const gx = RX + 40, gw = RW - 80, YB = S.h - 62, YT = 156, xw = (v) => gx + (Math.max(WLO, Math.min(WHI, v)) - WLO) / (WHI - WLO) * gw, bwd = gw / NWB;
      const cnt = new Float64Array(NWB); for (let i = 0; i < n; i++) if (wbin[i] >= 0) cnt[wbin[i]]++;
      ctx.save(); ctx.globalAlpha = a;
      for (let b = 0; b < NWB; b++) { if (!cnt[b]) continue; const h = cnt[b] / wMax * (YB - YT); ctx.fillStyle = rgba(C.teal, 0.85); ctx.fillRect(gx + b * bwd + 0.5, YB - h, bwd - 1, h); }
      // exact Delta F (band), Jarzynski estimate (settles on it), mean work (stays to its right: second law)
      ctx.lineCap = 'butt'; ctx.strokeStyle = rgba(C.muted, 0.55); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(xw(0), YB); ctx.lineTo(xw(0), YT - 20); ctx.stroke();
      ctx.strokeStyle = C.navy; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(xw(mW), YB); ctx.lineTo(xw(mW), YT - 20); ctx.stroke();
      ctx.strokeStyle = RED; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(xw(jar), YB); ctx.lineTo(xw(jar), YT - 20); ctx.stroke();
      ctx.strokeStyle = rgba(C.inkSoft, 0.4); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, YB); ctx.lineTo(gx + gw, YB); ctx.stroke();
      ctx.restore();
      // the two averages: formulas in LaTeX, their running values as numbers in a slot of fixed width
      const xJ = xw(0) - 14, xM = xw(wMean) + 14, slot = textW('−0.00', 22, 700);
      text(ctx, num(jar, 2), xJ - slot, 88, { size: 22, weight: 700, color: RED, alpha: a });
      S.tex('jl', '$-\\log\\langle w\\rangle=$', xJ - slot - 8, 88, { size: 21, color: RED, align: 'right', alpha: a });   // the log of the average weight: exact
      S.tex('jv', '$=\\Delta F$\u00a0\u00a0exact · Jarzynski', xJ, 118, { size: 20, weight: 650, color: RED, align: 'right', alpha: aV });
      const mw = S.tex('ml', '$\\langle-\\log w\\rangle=\\langle W\\rangle=$', xM, 88, { size: 21, color: C.navy, alpha: a }).w || 200;   // the average of the log-weight: a bound
      text(ctx, num(mW, 2), xM + mw + 8, 88, { size: 22, weight: 700, color: C.navy, alpha: a });
      S.tex('mv', '$\\ge\\Delta F$\u00a0\u00a0Jensen · second law', xM, 118, { size: 20, weight: 650, color: C.navy, alpha: aV });
      [-0.5, 0.5, 1].forEach(v => text(ctx, num(v, 1), xw(v), YB + 25, { size: 18, color: C.muted, align: 'center', alpha: a }));
      S.tex('axF', 'exact $\\Delta F=0$', xw(0), YB + 25, { size: 18, weight: 650, color: C.ink, align: 'center', alpha: a });
      S.tex('axW', 'work $W$', gx + gw, YB + 25, { size: 18, weight: 600, color: C.inkSoft, align: 'right', alpha: a });
    }
    function draw() {
      S.clear();
      const t = Math.max(0, sc - late), a = E.clamp(t / 0.35); // a new scene fades in (after its start-up delay)
      if (a <= 0) return;
      if (scene === 0) likScene(a, t); else workScene(a, t);
    }
    return {
      frame(dt) { if (step >= START) sc += dt; draw(); }, draw,
      enter() { sc = 0; late = 0; },
      step(k) { const s = sceneOf(k); if (k >= START && (step < START || s !== scene)) { sc = 0; late = step < START ? 0.5 : 0; } scene = s; step = k; },
      ff: 6.5
    };
  };
})();
