/* Field animations: φ⁴ theory on a 64² lattice with its phase diagram, the free field as an exact
   linear flow from white noise (with its propagator), and one HMC trajectory step by step. */
(function () {
  'use strict';
  const { C, rgba } = U;
  const randn = LFT.randn;

  // κ_c(λ) of 2D lattice φ⁴, measured for the notes from Binder-cumulant crossings of 16² and 32² lattices
  // (uncertainty ≈ 0.003). λ = 0: Gaussian stability bound 1/4; λ → ∞: Ising point ln(1+√2)/4.
  const KC = [[0, 0.25], [0.01, 0.2601], [0.03, 0.2789], [0.1, 0.3028], [0.3, 0.335], [0.6, 0.3458], [1, 0.3396],
              [2, 0.3116], [5, 0.2564], [20, 0.2278], [100, 0.2228], [1e9, Math.log(1 + Math.SQRT2) / 4]];
  function kappaC(lam) {
    if (lam <= KC[0][0]) return KC[0][1];
    for (let k = 1; k < KC.length; k++) if (lam <= KC[k][0]) {
      const [l0, k0] = KC[k - 1], [l1, k1] = KC[k];
      const t = l0 <= 0 ? lam / l1 : Math.log(lam / l0) / Math.log(l1 / l0);
      return k0 + (k1 - k0) * Math.max(0, Math.min(1, t));
    }
    return KC[KC.length - 1][1];
  }

  // =====================================================================================
  // φ⁴ on 64² (Metropolis + Brower–Tamayo cluster). builds: (λ, κ) = (1, 0.20) → (1, 0.40) → (5, 0.256 ≈ κ_c, a measured point)
  // =====================================================================================
  ANIMS.phi4Live = function (S, o) {
    const ctx = S.ctx, L = 64, f = new LFT.Phi4(L), box = o.box || 520, img = K.img(L);
    const PARS = o.pars || [[1, 0.2], [1, 0.4], [5, 0.256]];
    for (let i = 0; i < f.N; i++) f.phi[i] = (Math.random() < 0.5 ? -1 : 1) * (0.8 + 0.3 * Math.random());
    const rx = box + 110, rw = S.w - rx - 20;
    const PH = K.plot(ctx, { x: rx, y: 46, w: rw, h: 210 }, { x: [-2.6, 2.6], y: [0, 1.2], xt: K.ticks([-2, -1, 0, 1, 2], v => (v < 0 ? '−' : '') + Math.abs(v)), yt: [], xl: 'field value φ', fs: 18 });
    const PD = K.plot(ctx, { x: rx, y: 392, w: rw, h: 210 }, { x: [0.01, 10], y: [0.15, 0.4], logx: true, xt: K.ticks([0.01, 0.1, 1, 10], v => String(v)), yt: K.ticks([0.2, 0.3, 0.4], v => v.toFixed(1)), xl: 'quartic coupling λ', yl: 'κ', fs: 18, ylo: 52 });
    let k = -1, hq = [];
    function set(s) {
      const [lam, kap] = PARS[Math.min(s, PARS.length - 1)];
      if (k >= 0 && f.lambda === lam && f.kappa === kap) return;
      f.lambda = lam; f.kappa = kap; f.retune(); hq = [];
      for (let n = 0; n < 60; n++) sweep();
    }
    function sweep() {
      f.metropolisSweep(); f.wolffSweep();
      const h = K.Hist(70, -2.6, 2.6); for (let i = 0; i < f.N; i += 3) h.add(f.phi[i]);
      hq.push(h); if (hq.length > 40) hq.shift();
    }
    const lx = [], ky = []; for (let i = 0; i <= 200; i++) { const l = 0.01 * Math.pow(1000, i / 200); lx.push(l); ky.push(kappaC(l)); }
    function draw() {
      S.clear();
      for (let i = 0; i < f.N; i++) img.px[i] = K.DIV[K.divIdx(f.phi[i], 2)];
      img.put(); ctx.save(); K.clipRound(ctx, 0, 0, box, box, 12); img.draw(ctx, 0, 0, box, box); ctx.restore();
      let m = 0; for (let i = 0; i < f.N; i++) m += f.phi[i]; m /= f.N;
      K.label(ctx, `λ = ${f.lambda}, κ = ${f.kappa}   ·   m = ⟨φ⟩ = ${m >= 0 ? '+' : '−'}${Math.abs(m).toFixed(2)}`, 0, box + 40, { size: 22, color: C.ink, weight: 650 });
      // histogram + single-site weight
      const c = new Float64Array(70); let tot = 0; for (const h of hq) { for (let j = 0; j < 70; j++) c[j] += h.c[j]; tot += h.tot; }
      const w = 5.2 / 70, d = Float64Array.from(c, v => tot ? v / (tot * w) : 0), edges = Float64Array.from({ length: 71 }, (_, j) => -2.6 + j * w);
      const xs = [], ys = []; let z = 0;
      for (let i = 0; i <= 260; i++) { const x = -2.6 + 5.2 * i / 260, v = x * x + f.lambda * (x * x - 1) ** 2; xs.push(x); ys.push(Math.exp(-v)); z += Math.exp(-v) * 5.2 / 260; }
      for (let i = 0; i < ys.length; i++) ys[i] /= z;
      let mx = 0; for (const v of ys) mx = Math.max(mx, v); for (const v of d) mx = Math.max(mx, v);
      PH.setY(0, mx * 1.1); PH.axes(); PH.bars(edges, d, rgba(C.blue, 0.5)); PH.line(xs, ys, C.ink, 2.4, [7, 5]);
      K.label(ctx, 'histogram of φ_x', PH.b.x, PH.b.y - 18, { size: 19, color: C.ink, weight: 650 });
      K.legend(ctx, PH.b.x + PH.b.w - 250, PH.b.y + 24, [{ label: 'one site alone: e^{−V(φ)}', color: C.ink, kind: 'dash' }], { size: 16 });
      // phase diagram
      PD.axes();
      ctx.save(); ctx.beginPath(); ctx.moveTo(PD.X(lx[0]), PD.Y(0.4)); lx.forEach((l, i) => ctx.lineTo(PD.X(l), PD.Y(ky[i]))); ctx.lineTo(PD.X(10), PD.Y(0.4)); ctx.closePath(); ctx.fillStyle = rgba(C.coral, 0.10); ctx.fill(); ctx.restore();
      PD.hline(0.25, rgba(C.inkSoft, 0.5), 1.4, [3, 4]); PD.hline(Math.log(1 + Math.SQRT2) / 4, rgba(C.inkSoft, 0.5), 1.4, [3, 4]);
      PD.line(lx, ky, C.ink, 2.6);
      PD.text(0.012, 0.375, 'broken: ⟨φ⟩ ≠ 0', { size: 17, color: '#B4492F', weight: 650 });
      PD.text(0.012, 0.165, 'symmetric: ⟨φ⟩ = 0', { size: 17, color: C.blue, weight: 650 });
      PD.text(9.5, 0.2203, 'Ising limit', { size: 15, color: C.inkSoft, align: 'right', dy: 18 });
      PD.dots([f.lambda], [f.kappa], C.coral, 9);
      K.label(ctx, 'phase diagram κ_c(λ)', PD.b.x, PD.b.y - 18, { size: 19, color: C.ink, weight: 650 });
    }
    function frame() { sweep(); draw(); }
    set(0); k = 0;
    return { frame, draw, step(s) { set(s); k = s; }, ff: 1.5 };
  };

  // =====================================================================================
  // The free field as an exact linear flow: white noise → ×(p̂² + m²)^{-1/2} in Fourier space → field.
  // builds: 0 noise and field, 1 + propagator (measured over fresh samples vs exact lattice propagator)
  // =====================================================================================
  ANIMS.gffFlow = function (S, o) {
    const ctx = S.ctx, n = 128, m = o.m || 0.08, g = new LFT.GFF(n), g2 = new LFT.GFF(n), box = o.box || 330;
    const imN = K.img(n), imF = K.img(n), re = new Float64Array(n * n), im = new Float64Array(n * n), R = 40;
    const px0 = 2 * box + 310, PP = K.plot(ctx, { x: px0, y: 40, w: S.w - px0 - 10, h: box - 20 }, { x: [0, 40], y: [1e-3, 1.2], logy: true, xt: K.ticks([0, 10, 20, 30, 40]), yt: [{ v: 1, l: '1' }, { v: 0.1, l: '0.1' }, { v: 0.01, l: '0.01' }, { v: 0.001, l: '0.001' }], xl: 'distance r (lattice units)', yl: 'correlation (normalized)', fs: 17, ylo: 62 });
    const cosT = []; for (let r = 0; r <= R; r++) { cosT.push(new Float64Array(n)); for (let k = 0; k < n; k++) cosT[r][k] = Math.cos(2 * Math.PI * k * r / n); }
    const ah = new Float64Array(n); for (let k = 0; k < n; k++) ah[k] = 4 * Math.sin(Math.PI * k / n) ** 2;
    const G = (function () {
      const Sa = new Float64Array(n); for (let a = 0; a < n; a++) { let s = 0; for (let b = 0; b < n; b++) s += 1 / (m * m + ah[a] + ah[b]); Sa[a] = s; }
      const out = new Float64Array(R + 1); for (let r = 0; r <= R; r++) { let s = 0; for (let a = 0; a < n; a++) s += cosT[r][a] * Sa[a]; out[r] = s; }
      const c0 = out[0]; for (let r = 0; r <= R; r++) out[r] /= c0; return out;
    })();
    let avg = null, nAvg = 0, step = 0;
    function measure(fld) {
      const c = new Float64Array(R + 1);
      for (let r = 0; r <= R; r++) { let s = 0; for (let y = 0; y < n; y++) { const o1 = y * n, o2 = ((y + r) % n) * n; for (let x = 0; x < n; x++) s += fld[o1 + x] * (fld[o1 + (x + r) % n] + fld[o2 + x]); } c[r] = s / (2 * n * n); }
      const c0 = c[0]; for (let r = 0; r <= R; r++) c[r] /= c0; return c;
    }
    function sample() {
      for (let i = 0; i < n * n; i++) { g2.nr[i] = randn(); g2.ni[i] = randn(); }
      const c = measure(g2.compute(m));
      if (!avg) { avg = c; nAvg = 1; } else { nAvg++; for (let r = 0; r <= R; r++) avg[r] += (c[r] - avg[r]) / nAvg; }
    }
    for (let k = 0; k < 40; k++) sample();
    function draw() {
      S.clear();
      // white noise in real space = inverse FFT of the (unfiltered) Fourier noise
      re.set(g.nr); im.set(g.ni); LFT.fft2(re, im, n, true);
      let s2 = 0; for (let i = 0; i < n * n; i++) s2 += re[i] * re[i]; const sd = Math.sqrt(s2 / (n * n)) || 1;
      for (let i = 0; i < n * n; i++) imN.px[i] = K.DIV[K.divIdx(re[i] / sd, 2.6)];
      const fld = g.compute(m); for (let i = 0; i < n * n; i++) imF.px[i] = K.DIV[K.divIdx(fld[i], 2.6)];
      imN.put(); imF.put();
      const y0 = 40, x2 = box + 200;
      ctx.save(); K.clipRound(ctx, 0, y0, box, box, 12); imN.draw(ctx, 0, y0, box, box); ctx.restore();
      ctx.save(); K.clipRound(ctx, x2, y0, box, box, 12); imF.draw(ctx, x2, y0, box, box); ctx.restore();
      K.label(ctx, 'white noise z_x', box / 2, 24, { size: 20, color: C.ink, weight: 650, align: 'center' });
      K.label(ctx, `free field φ_x, mass m = ${m}`, x2 + box / 2, 24, { size: 20, color: C.ink, weight: 650, align: 'center' });
      K.arrowA(ctx, box + 20, y0 + box / 2, 0, 160, C.steel, 4, 0.16, false);
      K.label(ctx, 'FFT, multiply by', box + 100, y0 + box / 2 - 44, { size: 17, color: C.inkSoft, align: 'center' });
      K.label(ctx, '(p̂² + m²)^{−1/2},', box + 100, y0 + box / 2 - 20, { size: 19, color: C.ink, align: 'center', weight: 650 });
      K.label(ctx, 'FFT back', box + 100, y0 + box / 2 + 34, { size: 17, color: C.inkSoft, align: 'center' });
      // ξ ruler
      const xi = 1 / m, k = box / n; ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(x2 + 10, y0 + box - 34, xi * k + 24, 26); ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x2 + 22, y0 + box - 21); ctx.lineTo(x2 + 22 + xi * k, y0 + box - 21); ctx.stroke(); ctx.restore();
      K.label(ctx, 'ξ = 1/m', x2 + 36 + xi * k, y0 + box - 14, { size: 17, color: C.ink, weight: 650, halo: 'rgba(255,255,255,.9)' });
      if (step >= 1) {
        PP.axes();
        PP.fn((r) => Math.exp(-m * r), C.coral, 2.4, [7, 5], 200);
        PP.line(Float64Array.from(G, (_, i) => i), G, C.ink, 2.6);
        if (avg) PP.dots(Float64Array.from(avg, (_, i) => i).filter((_, i) => i % 2 === 0), avg.filter((_, i) => i % 2 === 0), C.blue, 5.5);
        K.legend(ctx, PP.b.x + 20, PP.b.y + PP.b.h - 18, [{ label: 'measured', color: C.blue, kind: 'dot' }, { label: 'exact lattice propagator', color: C.ink }, { label: 'e^{−m r}', color: C.coral, kind: 'dash' }], { size: 17, gap: 18 });
      }
    }
    // average more fresh samples per frame until the long-distance tail has settled
    function frame() { g.evolve(0.04); if (nAvg < 400) K.budget(8, sample, 4); else sample(); draw(); }
    return { frame, draw, step(s) { step = s; }, ff: 3 };
  };

  // =====================================================================================
  // One HMC trajectory, one leapfrog step at a time (φ⁴ chain of 48 sites; ported from the notes).
  // =====================================================================================
  ANIMS.hmcTraj = function (S, o) {
    const ctx = S.ctx, N = 48, c = new LFT.Phi4Chain(N);
    c.kappa = 0.55; c.lambda = 1.5; c.eps = 0.1; c.nmd = 20;
    for (let i = 0; i < N; i++) c.phi[i] = i < N / 2 ? 1 : -1;
    for (let k = 0; k < 40; k++) c.trajectory();
    const fh = Math.round(0.38 * S.h), ey = 52 + fh + 116, eh = S.h - ey - 72;
    const PF = K.plot(ctx, { x: 70, y: 52, w: S.w - 90, h: fh }, { x: [-0.5, N - 0.5], y: [-2.2, 2.2], xt: K.ticks([0, 12, 24, 36, 47]), yt: K.ticks([-2, -1, 0, 1, 2], v => (v < 0 ? '−' : '') + Math.abs(v)), xl: 'site x', yl: 'φ_x', fs: 17, ylo: 46 });
    const PE = K.plot(ctx, { x: 70, y: ey, w: (S.w - 90) * 0.56, h: eh }, { x: [0, 2], y: [-20, 20], xt: K.ticks([0, 0.5, 1, 1.5, 2]), yt: [], xl: 'molecular-dynamics time', fs: 17 });
    const ax0 = 70 + (S.w - 90) * 0.56 + 110, PA = K.plot(ctx, { x: ax0, y: ey, w: S.w - ax0 - 20, h: eh }, { x: [0, 40], y: [-3, 3], xt: [], yt: K.ticks([-2, 0, 2], v => (v < 0 ? '−' : '') + Math.abs(v)), xl: 'last 40 trajectories', yl: 'ΔH', fs: 17, ylo: 42 });
    let trace = [], hist = [], phase = 'md', pause = 0, flash = 0, lastOk = null, accum = 0;
    function begin() { c.begin(); trace = [{ t: 0, H: c.H0, K: c.kinetic(), S: c.action() }]; phase = 'md'; flash = 1; }
    function finish() { const r = c.end(); lastOk = r.ok; hist.push([r.dH, r.ok]); if (hist.length > 40) hist.shift(); phase = 'pause'; pause = 0; }
    for (let k = 0; k < 30; k++) { c.begin(); while (c.k < c.nmd) c.step(); finish(); }
    function draw() {
      S.clear();
      PF.axes(); PF.hline(1, C.grid, 1.4, [5, 5]); PF.hline(-1, C.grid, 1.4, [5, 5]); PF.hline(0, C.faint, 1.4);
      if (c.k >= 0) { ctx.save(); ctx.fillStyle = rgba(C.coral, 0.5 + 0.4 * flash); for (let i = 0; i < N; i++) { const x = PF.X(i), y0 = PF.Y(c.phi[i]), y1 = PF.Y(c.phi[i] + 0.35 * c.pi[i]); ctx.fillRect(x - 4, Math.min(y0, y1), 8, Math.abs(y1 - y0)); } ctx.restore(); }
      const xs = Float64Array.from({ length: N }, (_, i) => i);
      PF.line(xs, c.phi, C.blue, 3); PF.dots(xs, c.phi, C.blue, 5.5);
      const msg = phase === 'pause' ? (lastOk ? 'Metropolis test on ΔH: accepted' : 'Metropolis test on ΔH: rejected, back to the start') : c.k === 0 ? 'fresh random momenta π ~ N(0, 1)' : `leapfrog step ${c.k} of ${c.nmd}`;
      K.label(ctx, msg, PF.b.x + PF.b.w, 30, { size: 21, color: phase === 'pause' ? (lastOk ? C.tealDark : '#B4492F') : C.ink, weight: 700, align: 'right' });
      K.legend(ctx, PF.b.x, 30, [{ label: 'field φ_x', color: C.blue }, { label: 'momentum π_x', color: rgba(C.coral, 0.8), kind: 'sq' }], { size: 18 });
      // energies along the trajectory
      const T = c.nmd * c.eps; PE.setX(0, T);
      const H0 = trace.length ? trace[0].H : 0, S0 = trace.length ? trace[0].S : 0;
      const K0 = trace.length ? trace[0].K : 0, tt = trace.map(p => p.t), hH = trace.map(p => p.H - H0), hK = trace.map(p => p.K - K0), hS = trace.map(p => p.S - S0);
      let lo = -1, hi = 1; for (const arr of [hH, hK, hS]) for (const v of arr) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      const pad = 0.1 * (hi - lo); PE.setY(lo - pad, hi + pad); PE.axes(); PE.hline(0, C.faint, 1.4);
      PE.line(tt, hK, C.coral, 2.4); PE.line(tt, hS, C.blue, 2.4); PE.line(tt, hH, C.ink, 3.6);
      K.label(ctx, 'energy along this trajectory', PE.b.x, PE.b.y - 20, { size: 19, color: C.ink, weight: 650 });
      K.legend(ctx, PE.b.x + 300, PE.b.y - 20, [{ label: 'H − H₀', color: C.ink }, { label: 'K − K₀', color: C.coral }, { label: 'S − S₀', color: C.blue }], { size: 17, gap: 16 });
      PA.axes(); PA.hline(0, C.faint, 1.4);
      PA.dots(hist.map((_, i) => 40 - hist.length + i + 0.5), hist.map(h => Math.max(-3, Math.min(3, h[0]))), hist.map(h => h[1] ? C.teal : C.coral), 6);
      const na = hist.filter(h => h[1]).length;
      K.label(ctx, `acceptance ${Math.round(100 * na / Math.max(1, hist.length))}%`, PA.b.x, PA.b.y - 20, { size: 19, color: C.ink, weight: 650 });
    }
    function frame(dt) {
      flash = Math.max(0, flash - dt * 2);
      if (phase === 'pause') { pause += dt; if (pause > 0.9) begin(); draw(); return; }
      if (c.k < 0) begin();
      accum += dt * 30;
      while (accum >= 1 && c.k < c.nmd) { accum -= 1; const H = c.step(); trace.push({ t: c.k * c.eps, H, K: c.kinetic(), S: c.action() }); }
      if (c.k >= c.nmd) finish();
      draw();
    }
    begin();
    return { frame, draw, ff: 0.5 };
  };
})();
