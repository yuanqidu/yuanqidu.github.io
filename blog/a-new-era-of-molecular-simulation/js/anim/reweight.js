/* Reweighting with flows (teaser before the path-weight slides).
   The same prior samples are transported to the same 1D two-mode target by
     1. a normalizing flow (a few invertible layers),
     2. a continuous-time flow (ODE),
     3. a diffusion (SDE),
   each with the running quantity its importance weight needs: the sum of log|det J| over layers,
   the integral of the divergence, and the log ratio of backward to forward kernels.
   Everything is computed from the exact transport of a Gaussian to a two-component Gaussian mixture:
   interpolant x_t = (1 - t) x_0 + t x_1 with independent endpoints, t in [0, 1]. */
(function () {
  'use strict';
  const { C, rgba, E, roundRect, text, makeRng } = U;

  // exact 1D toy: fields, ODE (flow maps), SDE paths and their running quantities
  function rwToy() {
    const W = [0.6, 0.4], M = [1.6, -1.7], SD = [0.36, 0.46];     // target: two Gaussian modes
    const SIG = 0.8;                                              // noise level of the diffusion
    const NT = 240, NS = 80, NL = 4, NP = 11;                     // ODE steps, SDE steps, flow layers, samples
    // exact fields of the marginal p_t = sum_k W_k N(t M_k, V_k), V_k = t^2 SD_k^2 + (1 - t)^2:
    // velocity v = E[x_1 - x_0 | x_t], its divergence dv/dx, and the score s = d/dx log p_t
    function fields(x, t) {
      const r = [0, 0], g = [0, 0], a = [0, 0], c = [0, 0]; let mx = -Infinity;
      for (let k = 0; k < 2; k++) {
        const V = t * t * SD[k] * SD[k] + (1 - t) * (1 - t), d = x - t * M[k];
        r[k] = Math.log(W[k]) - 0.5 * d * d / V - 0.5 * Math.log(V); mx = Math.max(mx, r[k]);
        g[k] = -d / V; c[k] = (t * SD[k] * SD[k] - (1 - t)) / V; a[k] = M[k] + c[k] * d;
      }
      let Z = 0; for (let k = 0; k < 2; k++) { r[k] = Math.exp(r[k] - mx); Z += r[k]; }
      let v = 0, s = 0, dv = 0;
      for (let k = 0; k < 2; k++) { r[k] /= Z; v += r[k] * a[k]; s += r[k] * g[k]; }
      for (let k = 0; k < 2; k++) dv += r[k] * (c[k] + (g[k] - s) * a[k]);
      return [v, dv, s];
    }
    const logPrior = (x) => -0.5 * x * x - 0.5 * Math.log(2 * Math.PI);
    const target = (x) => { let p = 0; for (let k = 0; k < 2; k++) p += W[k] * Math.exp(-0.5 * ((x - M[k]) / SD[k]) ** 2) / (SD[k] * Math.sqrt(2 * Math.PI)); return p; };
    // ODE dx/dt = v(x, t), integrated together with I(t) = int_0^t dv/dx ds (RK4);
    // then log q(x_1) = log p_0(x_0) - I(1)
    function ode(x0) {
      const x = new Float64Array(NT + 1), I = new Float64Array(NT + 1), h = 1 / NT; x[0] = x0;
      for (let j = 0; j < NT; j++) {
        const t = j * h, k1 = fields(x[j], t), k2 = fields(x[j] + 0.5 * h * k1[0], t + 0.5 * h), k3 = fields(x[j] + 0.5 * h * k2[0], t + 0.5 * h), k4 = fields(x[j] + h * k3[0], t + h);
        x[j + 1] = x[j] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        I[j + 1] = I[j] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      }
      return { x, I };
    }
    // forward SDE dX = (v + SIG^2/2 s) dt + SIG dW (Euler-Maruyama) with the same marginals p_t;
    // R_k = sum_{j<k} log P<-(x_j | x_{j+1}) / P->(x_{j+1} | x_j), backward kernel from the noising drift v - SIG^2/2 s
    function sde(x0, rng) {
      const x = new Float64Array(NS + 1), R = new Float64Array(NS + 1), h = 1 / NS, sd = SIG * Math.sqrt(h); x[0] = x0;
      let f = fields(x0, 0);
      for (let j = 0; j < NS; j++) {
        const mf = x[j] + (f[0] + 0.5 * SIG * SIG * f[2]) * h, xn = mf + sd * rng.normal();
        const fn = fields(xn, (j + 1) * h), mb = xn - (fn[0] - 0.5 * SIG * SIG * fn[2]) * h;
        R[j + 1] = R[j] + ((xn - mf) * (xn - mf) - (x[j] - mb) * (x[j] - mb)) / (2 * sd * sd);
        x[j + 1] = xn; f = fn;
      }
      return { x, R };
    }
    // one path of the noising (backward) process that ends at the sample xN
    function back(xN, rng) {
      const x = new Float64Array(NS + 1), h = 1 / NS, sd = SIG * Math.sqrt(h); x[NS] = xN;
      for (let j = NS - 1; j >= 0; j--) { const f = fields(x[j + 1], (j + 1) * h); x[j] = x[j + 1] - (f[0] - 0.5 * SIG * SIG * f[2]) * h + sd * rng.normal(); }
      return x;
    }
    // stratified prior samples (one per quantile bin), shared by the three panels
    const erf = (x) => { const s = x < 0 ? -1 : 1, z = Math.abs(x), t = 1 / (1 + 0.3275911 * z); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z)); };
    const qnorm = (u) => { let lo = -6, hi = 6; for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (0.5 * (1 + erf(m / Math.SQRT2)) < u) lo = m; else hi = m; } return 0.5 * (lo + hi); };
    const rng0 = makeRng(31), x0 = [];
    for (let i = 0; i < NP; i++) x0.push(qnorm((i + 0.2 + 0.6 * rng0.u()) / NP));
    return { NT, NS, NL, NP, x0, fields, logPrior, target, ode, sde, back };
  }

  ANIMS.reweightFlows = function (S, o) {
    const ctx = S.ctx, T = rwToy();
    const GAP = 28, PW = (S.w - 2 * GAP) / 3;
    const T_RUN = 4.4, T_HOLD = 2.8, P = T_RUN + T_HOLD, NSET = 3, NFAN = 6;
    const HL = [8, 9, 1];                          // highlighted sample of each cycle (index into the sorted prior draws)
    const RED = '#B4492F';
    const STRIP = !(o && o.strip === false); // {"strip": false}: transport only, without the running sums and their curves
    let clock = 0, step = 0, fresh = -1;

    // precompute: ODE solutions (the flow layers are its maps over [k/NL, (k+1)/NL]), SDE paths per cycle, backward fans
    const odes = T.x0.map(x => T.ode(x));
    const sets = [];
    for (let c = 0; c < NSET; c++) {
      const rng = makeRng(101 + 17 * c), paths = T.x0.map(x => T.sde(x, rng)), hl = HL[c % HL.length], fan = [];
      for (let k = 0; k < NFAN; k++) fan.push(T.back(paths[hl].x[T.NS], rng));
      sets.push({ paths, fan });
    }
    // scale of the running-quantity strip, per cycle: the highlighted sample's range in the three panels
    const maxAbs = (arr) => { let m = 0; arr.forEach(v => { m = Math.max(m, Math.abs(v)); }); return m; };
    const yms = sets.map((s, c) => Math.max(1, 1.12 * Math.max(maxAbs(odes[HL[c % HL.length]].I), maxAbs(s.paths[HL[c % HL.length]].R))));
    const XLIM = 3.0;
    const grid = []; for (let i = 0; i <= 160; i++) grid.push(-XLIM + 2 * XLIM * i / 160);
    const pri = grid.map(x => Math.exp(-0.5 * x * x)), tgt0 = grid.map(T.target), tmax = Math.max(...tgt0), tgt = tgt0.map(v => v / tmax);

    function geo(i) {
      const px = i * (PW + GAP);
      return { px, X0: px + 74, X1: px + PW - 104, Y0: 62, Y1: 242, C0: 284, C1: 350 };
    }
    const fmt = (v) => (v < -0.005 ? '−' : v > 0.005 ? '+' : '') + Math.abs(v).toFixed(2);
    // All notation is typeset by KaTeX (S.tex, a layer over the canvas), in the notation of the slides; words and numbers stay canvas text.
    // DEF: the model of each panel · TK: the keys of the time labels of the ODE and SDE panels · FL: the layers of the flow
    // RUN: the running sum under each panel (with the strip only); its changing value is drawn as canvas text right after the symbol
    //      (w: the width to assume while the label has not been measured; the kernel ratio is longer, hence smaller, to stay inside its panel)
    const DEF = [{ key: 'def0', src: '$x=f_\\theta(z)$' }, { key: 'def1', src: '$\\dd X_t/\\dd t=v_\\theta$' }, { key: 'def2', src: '$\\dd X_t=\\mu^+_t\\,\\dd t+\\sigma_t\\,\\dd W_t$' }];
    const TK = [null, ['t0a', 'tNa'], ['t0b', 'tNb']];
    const FL = []; for (let k = 0; k < T.NL; k++) FL.push({ key: 'f' + k, src: '$f_{' + (k + 1) + '}$' });
    const RUN = [{ key: 'run0', src: '$\\sum_k\\log\\big|\\det\\partial f_k\\big|=$', size: 22, w: 199 }, { key: 'run1', src: '$\\int\\nabla\\!\\cdot v_\\theta\\,\\dd t=$', size: 22, w: 129 },
      { key: 'run2', src: '$\\sum_t\\log\\big[\\Pb(X_t\\mid X_{t+1})\\,/\\,\\Pf(X_{t+1}\\mid X_t)\\big]=$', size: 19, w: 362 }];

    function density(g, vals, x0, scale, dir, fill, stroke) {
      const yOf = (x) => g.Y1 - (x + XLIM) / (2 * XLIM) * (g.Y1 - g.Y0);
      ctx.beginPath(); ctx.moveTo(x0, yOf(grid[0]));
      for (let i = 0; i < grid.length; i++) ctx.lineTo(x0 + dir * vals[i] * scale, yOf(grid[i]));
      ctx.lineTo(x0, yOf(grid[grid.length - 1])); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
    }
    function polyline(pts, n, color, lw, dash) { // pts: [[x, y], ...], first n + 1 points
      if (n < 1) return;
      ctx.save(); ctx.beginPath();
      for (let k = 0; k <= n; k++) { if (k) ctx.lineTo(pts[k][0], pts[k][1]); else ctx.moveTo(pts[k][0], pts[k][1]); }
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.restore();
    }

    // one panel: kind 0 = normalizing flow, 1 = ODE, 2 = SDE
    function panel(kind, u, hold, cyc) {
      const g = geo(kind), set = sets[cyc % NSET], hl = HL[cyc % HL.length], ym = yms[cyc % NSET];
      const a = kind === fresh ? E.clamp(clock / 0.45) : 1;
      const tx = (t) => g.X0 + t * (g.X1 - g.X0), ty = (x) => g.Y1 - (Math.max(-XLIM, Math.min(XLIM, x)) + XLIM) / (2 * XLIM) * (g.Y1 - g.Y0);
      const cy = (v) => (g.C0 + g.C1) / 2 - Math.max(-ym, Math.min(ym, v)) / ym * (g.C1 - g.C0) / 2;
      ctx.save(); ctx.globalAlpha = a;
      roundRect(ctx, g.px, 0, PW, S.h, 16, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      text(ctx, ['Normalizing flow', 'Continuous-time flow (ODE)', 'Diffusion (SDE)'][kind], g.px + 22, 38, { size: 23, weight: 650, color: C.ink });
      S.tex(DEF[kind].key, DEF[kind].src, g.px + PW - 22, 38, { size: 21, color: C.inkSoft, align: 'right', alpha: a });
      // prior (left) and target (right)
      ctx.strokeStyle = rgba(C.inkSoft, 0.3); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(g.X0, g.Y0); ctx.lineTo(g.X0, g.Y1); ctx.moveTo(g.X1, g.Y0); ctx.lineTo(g.X1, g.Y1); ctx.stroke();
      density(g, pri, g.X0, 40, -1, rgba(C.muted, 0.3), rgba(C.inkSoft, 0.6));
      density(g, tgt, g.X1, 74, 1, rgba(C.coral, 0.18), C.coral);
      const ly = g.Y1 + 25;
      if (kind === 0) {
        S.tex('z', '$z$', g.X0, ly, { size: 21, color: C.inkSoft, align: 'center', alpha: a });
        S.tex('x', '$x$', g.X1, ly, { size: 21, color: C.inkSoft, align: 'center', alpha: a });
        for (let k = 0; k < T.NL; k++) {
          S.tex(FL[k].key, FL[k].src, tx((k + 0.5) / T.NL), ly, { size: 20, color: C.muted, align: 'center', alpha: a });
          if (k) { ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = rgba(C.inkSoft, 0.28); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(tx(k / T.NL), g.Y0); ctx.lineTo(tx(k / T.NL), g.Y1); ctx.stroke(); ctx.restore(); }
        }
      } else {
        S.tex(TK[kind][0], '$t=0$', g.X0, ly, { size: 18, color: C.muted, align: 'center', alpha: a });
        S.tex(TK[kind][1], '$t=N$', g.X1, ly, { size: 18, color: C.muted, align: 'center', alpha: a });
      }
      // baseline of the running-quantity strip
      if (STRIP && (kind < 2 || step >= 4)) { ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = rgba(C.inkSoft, 0.35); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(g.X0, cy(0)); ctx.lineTo(g.X1, cy(0)); ctx.stroke(); ctx.restore(); }

      ctx.save(); ctx.beginPath(); ctx.rect(g.X0 - 8, g.Y0 - 6, g.X1 - g.X0 + 16, g.Y1 - g.Y0 + 12); ctx.clip();
      let val = 0, cur = null;
      if (kind === 0) {
        const lay = (i) => { const p = []; for (let k = 0; k <= T.NL; k++) p.push([tx(k / T.NL), ty(odes[i].x[Math.round(k * T.NT / T.NL)])]); return p; };
        for (let i = 0; i < T.NP; i++) { if (i === hl) continue; const p = lay(i); polyline(p, T.NL, rgba(C.teal, 0.34), 1.5); p.forEach(q => U.circle(ctx, q[0], q[1], 2.8, rgba(C.teal, 0.5))); }
        const p = lay(hl), l = Math.min(T.NL - 1, Math.floor(u * T.NL)), w = hold ? 1 : E.inOut(u * T.NL - l), done = hold ? T.NL : l;
        polyline(p, done, C.teal, 3);
        cur = hold ? p[T.NL] : [p[l][0] + (p[l + 1][0] - p[l][0]) * w, p[l][1] + (p[l + 1][1] - p[l][1]) * w];
        if (!hold) { ctx.strokeStyle = C.teal; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p[l][0], p[l][1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke(); }
        for (let k = 0; k <= done; k++) U.circle(ctx, p[k][0], p[k][1], k ? 5 : 6, k ? C.tealDark : C.muted);
        val = odes[hl].I[Math.round(done * T.NT / T.NL)];
        ctx.restore();
        // staircase: the running sum jumps at every layer
        const st = [[tx(0), cy(0)]];
        for (let k = 1; k <= done; k++) { st.push([tx(k / T.NL), st[st.length - 1][1]]); st.push([tx(k / T.NL), cy(odes[hl].I[Math.round(k * T.NT / T.NL)])]); }
        if (!hold) st.push([cur[0], st[st.length - 1][1]]);
        if (STRIP) { polyline(st, st.length - 1, C.navy, 2.6); U.circle(ctx, st[st.length - 1][0], st[st.length - 1][1], 4.5, C.navy); }
      } else if (kind === 1) {
        const n = hold ? T.NT : Math.floor(u * T.NT);
        const pts = (i) => { const p = []; for (let j = 0; j <= T.NT; j += 2) p.push([tx(j / T.NT), ty(odes[i].x[j])]); return p; };
        for (let i = 0; i < T.NP; i++) if (i !== hl) polyline(pts(i), T.NT / 2, rgba(C.teal, 0.34), 1.5);
        const p = pts(hl); polyline(p, Math.floor(n / 2), C.teal, 3);
        cur = [tx(n / T.NT), ty(odes[hl].x[n])]; val = odes[hl].I[n];
        U.circle(ctx, p[0][0], p[0][1], 6, C.muted);
        ctx.restore();
        const st = []; for (let j = 0; j <= n; j += 2) st.push([tx(j / T.NT), cy(odes[hl].I[j])]);
        if (STRIP) { polyline(st, st.length - 1, C.navy, 2.6); U.circle(ctx, tx(n / T.NT), cy(val), 4.5, C.navy); }
      } else {
        const n = hold ? T.NS : Math.floor(u * T.NS);
        const pts = (x) => { const p = []; for (let j = 0; j <= T.NS; j++) p.push([tx(j / T.NS), ty(x[j])]); return p; };
        for (let i = 0; i < T.NP; i++) if (i !== hl) polyline(pts(set.paths[i].x), T.NS, rgba(C.teal, 0.3), 1.3);
        if ((step === 3 || (!STRIP && step > 3)) && hold) { // other paths that end at the same sample (drawn backward from it)
          const fb = E.clamp((clock % P - T_RUN) / 1.2), m = Math.floor(fb * T.NS);
          set.fan.forEach(x => { const q = pts(x).slice(T.NS - m).reverse(); polyline(q, q.length - 1, rgba(C.blue, 0.6), 1.6, [5, 5]); });
        }
        const p = pts(set.paths[hl].x); polyline(p, n, C.teal, 3);
        cur = p[n]; val = set.paths[hl].R[n];
        U.circle(ctx, p[0][0], p[0][1], 6, C.muted);
        ctx.restore();
        if (STRIP && step >= 4) {
          const st = []; for (let j = 0; j <= n; j++) st.push([tx(j / T.NS), cy(set.paths[hl].R[j])]);
          polyline(st, st.length - 1, C.navy, 2.6);
          U.circle(ctx, tx(n / T.NS), cy(val), 4.5, C.navy);
        }
      }
      if (cur) U.circle(ctx, cur[0], Math.max(g.Y0, Math.min(g.Y1, cur[1])), 7, hold ? C.tealDark : C.teal, '#fff', 1.6);
      // readout
      const ry = S.h - 16;
      if (!STRIP) { if (kind === 2 && step >= 3 && hold) text(ctx, 'many paths end at the same sample', (g.X0 + g.X1) / 2, S.h - 14, { size: 20, weight: 600, color: RED, align: 'center', alpha: E.clamp((clock % P - T_RUN) / 0.8) }); }
      else if (kind < 2 || step >= 4) { // the running sum: its symbol is typeset once, the changing value is canvas text right after it
        const w = S.tex(RUN[kind].key, RUN[kind].src, g.X0, ry, { size: RUN[kind].size, weight: 700, color: C.navy, alpha: a }).w || RUN[kind].w;
        text(ctx, fmt(val), g.X0 + w + 9, ry, { size: 22, weight: 700, color: C.navy });
      } else {
        if (hold) text(ctx, 'many paths end at the same sample', (g.X0 + g.X1) / 2, (g.C0 + g.C1) / 2 + 2, { size: 20, weight: 600, color: RED, align: 'center', alpha: E.clamp((clock % P - T_RUN) / 0.8) });
        S.tex('ask', '$\\log p_\\theta(X_N)=\\ ?$', g.X0, ry, { size: 22, weight: 700, color: RED, alpha: a });
      }
      ctx.restore();
    }

    function draw() {
      S.clear();
      if (step < 1) return;
      const cyc = Math.floor(clock / P), c = clock % P, hold = c >= T_RUN, u = Math.min(1, c / T_RUN);
      for (let k = 0; k < Math.min(step, 3); k++) panel(k, u, hold, cyc);
    }
    return {
      frame(dt) { clock += dt; draw(); }, draw,
      enter() { clock = 0; fresh = -1; },
      // every click restarts the transport, so the newly revealed panel is seen from t = 0
      // {"map": [...]} translates the slide's click number into this animation's step (several clicks may share a step)
      step(k) { if (o && o.map) k = o.map[Math.min(k, o.map.length - 1)]; if (k === step) return; fresh = k > step && k <= 3 ? k - 1 : -1; step = k; clock = 0; },
      ff: T_RUN + 1.5
    };
  };
})();
