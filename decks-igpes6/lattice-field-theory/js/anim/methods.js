/* Methods animations: seventy years of lattice algorithms (timeline), a normalizing flow layer by
   layer, independent proposals versus topological freezing, and the sign problem. */
(function () {
  'use strict';
  const { C, rgba } = U;
  const TAU = 2 * Math.PI, rand = Math.random, randn = LFT.randn;

  // ---------- timeline data (from the notes) ----------
  const BR = [
    { k: 'local', name: 'Local Markov chains', col: '#4C72B0' },
    { k: 'cluster', name: 'Cluster & worm', col: '#2A9D8F' },
    { k: 'md', name: 'Molecular dynamics', col: '#E76F51' },
    { k: 'ens', name: 'Extended ensembles', col: '#6B5E9B' },
    { k: 'det', name: 'Beyond Monte Carlo', col: '#1D3A5F' },
    { k: 'ml', name: 'Machine learning', col: '#D1495B' }
  ];
  const EV = [
    ['local', 1953, 'Metropolis', 'Metropolis, Rosenbluth, Rosenbluth, Teller & Teller: the first MCMC algorithm.'],
    ['local', 1974, "Wilson's lattice", 'Wilson puts gauge theory on a lattice with exact gauge invariance.'],
    ['local', 1980, 'Heat bath (SU(2))', 'Creutz: first Monte Carlo of SU(2) gauge theory; confinement + asymptotic freedom.'],
    ['local', 1982, 'Cabibbo–Marinari', 'SU(3) updated through its SU(2) subgroups.'],
    ['local', 1987, 'Overrelaxation', 'Adler 1981, Creutz 1987, Brown & Woch 1987: energy-conserving reflections.'],
    ['cluster', 1986, 'Multigrid MC', 'Goodman & Sokal: updates on all length scales.'],
    ['cluster', 1987, 'Swendsen–Wang', 'Fortuin–Kasteleyn clusters: critical slowing down nearly removed.'],
    ['cluster', 1989, 'Wolff', 'Single-cluster algorithm; embedding for O(N) models.'],
    ['cluster', 2001, 'Worm', "Prokof'ev & Svistunov: sample the graph (high-temperature) expansion."],
    ['md', 1981, 'Langevin', 'Parisi & Wu: stochastic quantization.'],
    ['md', 1987, 'Hybrid Monte Carlo', 'Duane, Kennedy, Pendleton & Roweth: the workhorse of lattice QCD.'],
    ['md', 2001, 'Mass precond.', 'Hasenbusch: split the fermion determinant to tame its forces.'],
    ['md', 2007, 'RHMC', 'Clark & Kennedy: rational HMC for single flavours (strange quark).'],
    ['md', 2010, 'Multigrid solvers', 'Babich et al.: adaptive multigrid for the Wilson–Dirac operator.'],
    ['ens', 1988, 'Reweighting', 'Ferrenberg & Swendsen: one run gives results at nearby couplings.'],
    ['ens', 1991, 'Multicanonical', 'Berg & Neuhaus: flat energy histograms across first-order transitions.'],
    ['ens', 1996, 'Parallel tempering', 'Hukushima & Nemoto: replicas at several temperatures swap.'],
    ['ens', 2001, 'Wang–Landau', 'Estimate the density of states directly.'],
    ['ens', 2011, 'Open boundaries', 'Lüscher & Schaefer: let topology flow in and out of the box.'],
    ['ens', 2016, 'Metadynamics', 'Laio, Martinelli & Sanfilippo: bias potential in the topological charge.'],
    ['det', 1975, 'Hamiltonian lattice', 'Kogut & Susskind: lattice gauge theory in real time, quantum-ready.'],
    ['det', 1983, 'Complex Langevin', 'Parisi; Klauder: Langevin with complex actions (sign problem).'],
    ['det', 2007, 'Tensor RG', 'Levin & Nave: coarse-grain tensor networks; no sign problem.'],
    ['det', 2012, 'Lefschetz thimbles', 'Cristoforetti et al.: deform the integration contour.'],
    ['det', 2016, 'Quantum simulation', 'Martinez et al.: Schwinger model on a trapped-ion quantum computer.'],
    ['ml', 2019, 'Normalizing flows', 'Albergo, Kanwar & Shanahan: flow proposals + Metropolis, exact.'],
    ['ml', 2020, 'Gauge-equiv. flows', 'Kanwar et al.: U(1) flows that respect gauge symmetry.'],
    ['ml', 2021, 'SU(N) & fermion flows', 'Boyda et al.; Albergo et al.: non-abelian and fermionic flows.'],
    ['ml', 2022, 'Stoch. NF / CRAFT', 'Caselle et al.; Matthews et al.: flows mixed with non-equilibrium MCMC.'],
    ['ml', 2023, 'Diffusion models', 'Wang, Aarts & Zhou: diffusion as stochastic quantization.'],
    ['ml', 2024, 'Trivializing flows', 'Bacchio et al. 2023, and others: learned gradient flows, scaling studies.']
  ];

  // =====================================================================================
  // Seventy years of lattice algorithms: six lanes; a cursor runs from 1950 to 2026 (≈ 10 s).
  // =====================================================================================
  ANIMS.timeline = function (S, o) {
    const ctx = S.ctx, x0 = 290, x1 = S.w - 30, Y0 = 1950, Y1 = 2026, top = 46, lane = (S.h - top - 120) / BR.length;
    const X = (y) => y < 1970 ? x0 + (y - Y0) / 20 * 0.1 * (x1 - x0) : x0 + (0.1 + 0.9 * (y - 1970) / (Y1 - 1970)) * (x1 - x0);
    const pos = EV.map(([b, y, n, d]) => { const li = BR.findIndex(r => r.k === b); return { b, y, n, d, x: X(y), yy: top + li * lane + lane / 2, col: BR[li].col }; }).sort((a, b) => a.y - b.y);
    (function place() {
      ctx.save(); ctx.font = `600 16px ${U.FONT}`; const used = {};
      for (const p of pos) {
        const w = ctx.measureText(p.n).width, a = p.x - w / 2 - 4, b = p.x + w / 2 + 4; p.lab = null;
        for (const lvl of ['up', 'dn', 'up2']) { const key = p.b + lvl, list = used[key] || (used[key] = []); if (a < x0 - 30 || b > S.w) continue; if (list.every(([u, v]) => b < u || a > v)) { list.push([a, b]); p.lab = lvl; break; } }
      }
      ctx.restore();
    })();
    let cur = Y0;
    function draw() {
      S.clear();
      for (const d of [1950, 1970, 1980, 1990, 2000, 2010, 2020]) {
        const x = X(d); ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, top - 10); ctx.lineTo(x, S.h - 92); ctx.stroke(); ctx.restore();
        K.label(ctx, String(d), x, S.h - 66, { size: 18, color: C.inkSoft, align: 'center' });
      }
      BR.forEach((b, i) => {
        const y = top + i * lane + lane / 2;
        K.label(ctx, b.name, x0 - 26, y + 7, { size: 20, color: b.col, weight: 700, align: 'right' });
        ctx.save(); ctx.strokeStyle = rgba(b.col, 0.25); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(Math.min(x1, X(Math.min(cur, Y1))), y); ctx.stroke(); ctx.restore();
      });
      let latest = null;
      for (const p of pos) {
        if (p.y > cur) continue; latest = p;
        const age = Math.min(1, (cur - p.y) / 1.2), r = 7 + 5 * (1 - age);
        U.circle(ctx, p.x, p.yy, r + 2.5, '#fff'); U.circle(ctx, p.x, p.yy, r, p.col);
        if (p.lab) K.label(ctx, p.n, p.x, p.yy + (p.lab === 'up' ? -16 : p.lab === 'up2' ? -36 : 30), { size: 16, color: C.ink, align: 'center', weight: 600, halo: C.bg, haloW: 5 });
      }
      if (cur < Y1) { const xc = X(cur); ctx.save(); ctx.strokeStyle = rgba(C.ink, 0.45); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xc, top - 14); ctx.lineTo(xc, S.h - 92); ctx.stroke(); ctx.restore(); K.label(ctx, String(Math.floor(cur)), xc, top - 20, { size: 18, color: C.ink, weight: 700, align: 'center' }); }
      if (latest) {
        const w = K.label(ctx, `${latest.y} · ${latest.n}`, x0 - 260, S.h - 14, { size: 21, color: latest.col, weight: 750 });
        K.label(ctx, '— ' + latest.d, x0 - 260 + w + 12, S.h - 14, { size: 21, color: C.ink });
      }
    }
    function frame(dt) { if (cur < Y1) { cur = Math.min(Y1, cur + dt * (cur < 1970 ? 14 : 7.5)); draw(); } }
    return { frame, draw, enter() { cur = Y0; }, ff: 14 };
  };

  // =====================================================================================
  // A flow, layer by layer: 900 Gaussian samples carried to a two-site φ⁴ distribution by two exact
  // coupling layers (Knothe–Rosenblatt: φ1 = T1(z1), then φ2 = T2(z2 | φ1)).
  // =====================================================================================
  ANIMS.flowMorph = function (S, o) {
    const ctx = S.ctx, lam = 1, kap = o.kappa || 0.35, G = 260, lo = -2.6, hi = 2.6, dx = (hi - lo) / (G - 1), NP = 900, box = Math.min(S.w, S.h - 60);
    const Z = Array.from({ length: NP }, () => [randn(), randn()]), img = K.img(G);
    const Phi = (z) => 0.5 * (1 + K.erf(z / Math.SQRT2)), V = (p) => p * p + lam * (p * p - 1) ** 2;
    function invCdf(cdf, u) { let a = 0, b = G - 1; while (b - a > 1) { const m = (a + b) >> 1; if (cdf[m] < u) a = m; else b = m; } const f = (u - cdf[a]) / Math.max(1e-12, cdf[b] - cdf[a]); return lo + (a + Math.min(1, Math.max(0, f))) * dx; }
    const dens = new Float64Array(G * G); let mx = 0;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const a = lo + i * dx, b = lo + j * dx, v = Math.exp(-(V(a) + V(b) - 2 * kap * a * b)); dens[j * G + i] = v; mx = Math.max(mx, v); }
    const m1 = new Float64Array(G); for (let i = 0; i < G; i++) { let s = 0; for (let j = 0; j < G; j++) s += dens[j * G + i]; m1[i] = s; }
    const F1 = new Float64Array(G); { let s = 0; for (let i = 0; i < G; i++) { s += m1[i]; F1[i] = s; } for (let i = 0; i < G; i++) F1[i] /= s; }
    const F2 = []; for (let i = 0; i < G; i++) { const f = new Float64Array(G); let t = 0; for (let j = 0; j < G; j++) { t += dens[j * G + i]; f[j] = t; } for (let j = 0; j < G; j++) f[j] /= t; F2.push(f); }
    const T1 = Z.map(([z1]) => invCdf(F1, Phi(z1)));
    const T2 = Z.map(([, z2], k) => { const i = Math.max(0, Math.min(G - 1, Math.round((T1[k] - lo) / dx))); return invCdf(F2[i], Phi(z2)); });
    for (let i = 0; i < G * G; i++) { const v = Math.pow(dens[i] / mx, 0.6); img.px[i] = K.SEQ[Math.min(511, (v * 290) | 0)]; }
    img.put();
    const sc = box / (hi - lo), Pp = (a, b) => [(a - lo) * sc, box - (b - lo) * sc];
    let t = 0;
    function draw() {
      S.clear();
      ctx.save(); K.clipRound(ctx, 0, 0, box, box, 14); ctx.translate(0, box); ctx.scale(1, -1); img.draw(ctx, 0, 0, box, box, true); ctx.restore();
      const [ax, ay] = Pp(0, 0); ctx.save(); ctx.strokeStyle = 'rgba(31,41,51,.18)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(box, ay); ctx.moveTo(ax, 0); ctx.lineTo(ax, box); ctx.stroke(); ctx.restore();
      const ph = t % 6.5, s1 = K.smooth((ph - 1) / 1.5), s2 = K.smooth((ph - 3) / 1.5);
      ctx.save(); K.clipRound(ctx, 0, 0, box, box, 14);
      for (let k = 0; k < NP; k++) { const [z1, z2] = Z[k], a = z1 + (T1[k] - z1) * s1, b = z2 + (T2[k] - z2) * s2, [x, y] = Pp(a, b); U.circle(ctx, x, y, 3.2, s2 > 0.99 ? C.coral : C.blue); }
      ctx.restore();
      K.label(ctx, 'φ₁ →', box - 12, ay - 12, { size: 19, color: C.ink, align: 'right', halo: '#fff' }); K.label(ctx, 'φ₂ ↑', ax + 12, 28, { size: 19, color: C.ink, halo: '#fff' });
      const lab = ph < 1 ? 'Gaussian noise z ~ N(0, 1)' : ph < 2.5 ? 'layer 1: move φ₁ alone (horizontal)' : ph < 3 ? 'after layer 1' : ph < 4.5 ? 'layer 2: move φ₂ given φ₁ (vertical)' : 'samples from the target';
      K.label(ctx, lab, box / 2, box + 42, { size: 23, color: s2 > 0.99 ? '#B4492F' : C.ink, weight: 700, align: 'center' });
    }
    return { frame(dt) { t += dt; draw(); }, draw, ff: 5.6 };
  };

  // =====================================================================================
  // Independent proposals vs a local chain on a toy landscape with sectors at the integers.
  // builds: 0 a good model (quality 0.7), 1 a worse model (quality 0.25): still exact, less efficient
  // =====================================================================================
  ANIMS.flowToy = function (S, o) {
    const ctx = S.ctx, T = LFT.ToyTopo, beta = o.beta || 8;
    let quality = -1, q, xl, xf, hl, hf, hist, chL, chF, n, acc, ws;
    const PD = K.plot(ctx, { x: 60, y: 50, w: S.w - 80, h: 220 }, { x: [-4.5, 4.5], y: [0, 1], xt: K.ticks([-4, -3, -2, -1, 0, 1, 2, 3, 4], v => (v < 0 ? '−' : '') + Math.abs(v)), yt: [], fs: 17 });
    const PT = K.plot(ctx, { x: 60, y: 360, w: S.w - 80, h: S.h - 450 }, { x: [0, 400], y: [-4.5, 4.5], xt: K.ticks([0, 100, 200, 300, 400]), yt: K.ticks([-4, -2, 0, 2, 4], v => (v < 0 ? '−' : '') + Math.abs(v)), xl: 'steps ago', fs: 17, ylo: 40 });
    function reset(qq) {
      quality = qq; q = T.q(beta, quality); xl = 0.02; xf = 0.02; hl = K.Ring(400); hf = K.Ring(400); hist = K.Hist(180, -4.5, 4.5); chL = chF = n = acc = 0; ws = K.Ring(2000);
      for (let k = 0; k < 3000; k++) one();
    }
    const sector = (x) => Math.round(x);
    function one() {
      const yl = xl + 0.15 * (2 * rand() - 1);
      if (rand() < Math.exp(T.logp(yl, beta) - T.logp(xl, beta))) { if (sector(yl) !== sector(xl)) chL++; xl = yl; }
      const yf = q.sample(), la = (T.logp(yf, beta) - q.logq(yf)) - (T.logp(xf, beta) - q.logq(xf));
      ws.push(Math.exp(T.logp(yf, beta) - q.logq(yf)));
      if (Math.log(rand()) < la) { if (sector(yf) !== sector(xf)) chF++; xf = yf; acc++; }
      n++; hl.push(xl); hf.push(xf); hist.add(xf);
    }
    function draw() {
      S.clear();
      const xs = [], ps = [], qs = []; let z = 0;
      for (let i = 0; i <= 900; i++) { const x = -4.5 + 9 * i / 900; xs.push(x); const p = Math.exp(T.logp(x, beta)); ps.push(p); qs.push(Math.exp(q.logq(x))); z += p * 0.01; }
      for (let i = 0; i < ps.length; i++) ps[i] /= z;
      let mx = 0; for (const v of ps) mx = Math.max(mx, v); for (const v of qs) mx = Math.max(mx, v);
      PD.setY(0, mx * 1.1); PD.axes(); PD.bars(hist.edges(), hist.density(), rgba(C.blue, 0.35));
      PD.line(xs, qs, C.coral, 2.6, [8, 5]); PD.line(xs, ps, C.ink, 2.8);
      K.legend(ctx, PD.b.x, 28, [{ label: 'target p(x): sectors at the integers', color: C.ink }, { label: `model q(x), quality ${quality}`, color: C.coral, kind: 'dash' }, { label: 'histogram of the flow + Metropolis chain', color: rgba(C.blue, 0.45), kind: 'sq' }], { size: 18 });
      PT.axes();
      for (let k = -4; k <= 4; k++) PT.hline(k + 0.5, C.grid, 1);
      const a = hl.values(), b = hf.values(), tx = Float64Array.from(a, (_, i) => a.length - 1 - i);
      PT.line(tx, b, C.blue, 2); PT.line(tx, a, C.violet, 3.2);
      K.legend(ctx, PT.b.x, PT.b.y - 18, [{ label: `local Metropolis: ${(chL / n * 1000).toFixed(1)} sector changes / 1000 steps`, color: C.violet }, { label: `independent proposals from q: ${Math.round(chF / n * 1000)} / 1000, acceptance ${(acc / n).toFixed(2)}`, color: C.blue }], { size: 18 });
    }
    function frame() { for (let k = 0; k < 4; k++) one(); draw(); }
    reset(0.7);
    return { frame, draw, step(s) { const qq = s >= 1 ? 0.25 : 0.7; if (qq !== quality) reset(qq); }, ff: 1 };
  };

  // =====================================================================================
  // The sign problem: V Gaussian variables with weight e^{−x²/2 + iμx}; phases e^{iθ}, θ = μ Σ x.
  // builds: V shown on the circle = 2 → 8 → 32. Right: |⟨e^{iθ}⟩| vs V, exact e^{−Vμ²/2}, noise ~ 1/√N.
  // =====================================================================================
  ANIMS.signPhases = function (S, o) {
    const ctx = S.ctx, mu = o.mu || 0.5, Vs = [1, 2, 4, 8, 16, 32, 64], VSHOW = o.vshow || [2, 8, 32], box = Math.min(S.h - 30, 470);
    let Vshow = VSHOW[0], pts = [];
    const accs = Vs.map(() => ({ c: 0, s: 0, n: 0 }));
    const px0 = box + 150, P = K.plot(ctx, { x: px0, y: 30, w: S.w - px0 - 20, h: S.h - 130 }, { x: [1, 64], y: [1e-4, 1.5], logx: true, logy: true, xt: K.ticks([1, 2, 4, 8, 16, 32, 64]), yt: [{ v: 1, l: '1' }, { v: 1e-2, l: '10⁻²' }, { v: 1e-4, l: '10⁻⁴' }], xl: 'volume V (number of sites)', yl: 'average sign |⟨e^{iθ}⟩|', fs: 18, ylo: 60 });
    function batch(k = 300) {
      for (let i = 0; i < Vs.length; i++) {
        const V = Vs[i], r = accs[i];
        for (let j = 0; j < k; j++) { let s = 0; for (let v = 0; v < V; v++) s += randn(); const th = mu * s, c = Math.cos(th), sn = Math.sin(th); r.c += c; r.s += sn; r.n++; if (V === Vshow && j % 10 === 0) { pts.push([c, sn]); if (pts.length > 400) pts.shift(); } }
      }
    }
    batch(3000);
    function draw() {
      S.clear();
      const oc = box / 2, R = box * 0.42;
      ctx.save(); K.card(ctx, 0, 0, box, box, 16); ctx.restore();
      U.circle(ctx, oc, oc, R, null, C.faint, 2);
      pts.forEach(([c, s], k) => { ctx.save(); ctx.globalAlpha = 0.2 + 0.6 * k / pts.length; U.circle(ctx, oc + R * c, oc - R * s, 4, C.blue); ctx.restore(); });
      const a = accs[Vs.indexOf(Vshow)], mc = a.n ? a.c / a.n : 0, ms = a.n ? a.s / a.n : 0;
      K.arrowA(ctx, oc, oc, Math.atan2(ms, mc), Math.max(4, R * Math.hypot(mc, ms)), C.coral, 5, 0.14, false);
      K.label(ctx, `V = ${Vshow}: average ${K.sig(Math.abs(mc), 2)} (exact ${K.sig(Math.exp(-Vshow * mu * mu / 2), 2)})`, box / 2, box + 36, { size: 21, color: C.ink, weight: 650, align: 'center' });
      P.axes();
      const nn = accs[0].n || 1;
      P.fn((V) => Math.exp(-V * mu * mu / 2), C.ink, 2.8, null, 200);
      P.hline(1 / Math.sqrt(nn), C.coral, 2, [7, 5]);
      P.text(1.1, 1 / Math.sqrt(nn), `noise floor 1/√N, N = ${K.sig(nn, 2)}`, { dy: -12, size: 17, color: '#B4492F' });
      const xs = [], ys = []; Vs.forEach((V, i) => { const r = accs[i]; if (r.n) { xs.push(V); ys.push(Math.abs(r.c / r.n)); } });
      P.dots(xs, ys, C.blue, 7);
      P.text(2, Math.exp(-2 * mu * mu / 2), 'exact e^{−Vμ²/2}', { dx: 16, dy: -10, size: 18, color: C.ink, weight: 650 });
    }
    function frame() { batch(300); draw(); }
    return { frame, draw, step(s) { const v = VSHOW[Math.min(s, VSHOW.length - 1)]; if (v !== Vshow) { Vshow = v; pts = []; } }, ff: 1 };
  };
})();
