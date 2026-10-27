/* Density-functional figures: Kohn-Sham energy components, Jacob's ladder, LDA and GGA exchange, Becke's
   one-parameter fit (B88), the meta-GGA indicator alpha, how much exact exchange, and the argon dimer. */
(function () {
  'use strict';
  const { C, rgba } = U;

  // =====================================================================================
  // Kohn-Sham energy components of Ne (PBE, js/qc engine): signed bars, total, and E_xc in context
  // =====================================================================================
  ANIMS.ksParts = function (S, o) {
    const ctx = S.ctx, A = Q.D().atoms; if (!A) return { draw: () => Q.pending(S, 'atoms') };
    const d = A.parts[(o.atom || 'Ne') + '_pbe'];
    const items = [['kinetic T_s', d.T, C.blue], ['nucleus attraction', d.Vne, C.navy], ['Hartree J', d.J, '#7B9CD0'], ['exchange–correlation E_xc', d.Exc, C.coral], ['total E', d.E, C.ink]];
    const lo = Math.min(...items.map(i => i[1])) * 1.05, hi = Math.max(...items.map(i => i[1])) * 1.55;
    const P = K.plot(ctx, { x: 330, y: 20, w: S.w - 360, h: S.h - 90 }, { x: [lo, hi], y: [0, 1], xt: K.ticks([-300, -200, -100, 0, 100, 200].filter(v => v > lo && v < hi), v => (v < 0 ? '−' : '') + Math.abs(v)), yt: [], fs: 17, xl: 'hartree' });
    let t = 0;
    function draw() {
      S.clear(); P.axes(); P.vline(0, C.inkSoft, 1.6);
      const gap = (S.h - 90) / items.length, a = Math.min(1, t * 1.4);
      items.forEach(([l, v, c], k) => {
        const y = 20 + k * gap + gap * 0.2, h = gap * 0.6, x0 = P.X(0), x1 = P.X(v * a);
        K.label(ctx, l, 310, y + h / 2 + 7, { size: 20, color: k === 3 ? '#B4492F' : C.ink, weight: k >= 3 ? 750 : 550, align: 'right' });
        U.roundRect(ctx, Math.min(x0, x1), y, Math.abs(x1 - x0), h, 6, c);
        if (a >= 1) { const inside = v < 0 && x0 - x1 > 120; K.label(ctx, (v < 0 ? '−' : '+') + Math.abs(v).toFixed(2), inside ? x1 + 10 : v < 0 ? x0 + 10 : x1 + 10, y + h / 2 + 7, { size: 19, color: inside ? '#fff' : C.ink, weight: 700 }); }
      });
    }
    return { draw, enter() { t = 0; }, frame(dt) { if (t < 1) { t += dt; draw(); } }, ff: 1 };
  };

  // =====================================================================================
  // Jacob's ladder: five rungs from the Hartree world to the heaven of chemical accuracy. builds 0..5 add rungs.
  // =====================================================================================
  const RUNGS = [
    ['LDA', 'density n(r)', 'SVWN, SPW92', '1965–80'],
    ['GGA', '+ gradient ∇n', 'B88, LYP, PW91, PBE', '1986–96'],
    ['meta-GGA', '+ kinetic energy density τ', 'TPSS, M06-L, SCAN, r²SCAN', '1999–2020'],
    ['hybrid', '+ exact exchange (occupied orbitals)', 'B3LYP, PBE0, M06-2X, ωB97X-V', '1993–2016'],
    ['double hybrid, RPA', '+ unoccupied orbitals', 'B2PLYP, DSD-PBEP86, RPA', '2006–']];
  ANIMS.jacob = function (S, o) {
    const ctx = S.ctx, L = 160, R = 470, top = 110, bot = S.h - 90, n = RUNGS.length, gap = (bot - top) / (n + 0.4);
    let step = 0, t = 0; const vis = new Array(n).fill(0);
    function draw() {
      S.clear();
      const g = ctx.createLinearGradient(0, top - 70, 0, top + 20); g.addColorStop(0, 'rgba(233,196,106,.55)'); g.addColorStop(1, 'rgba(233,196,106,0)');
      ctx.fillStyle = g; ctx.fillRect(0, top - 90, S.w, 120);
      K.label(ctx, 'heaven of chemical accuracy', (L + R) / 2, top - 52, { size: 26, color: '#9A6B00', weight: 750, align: 'center' });
      K.label(ctx, 'Hartree world: no exchange, no correlation', (L + R) / 2, bot + 52, { size: 21, color: C.inkSoft, weight: 600, align: 'center' });
      ctx.save(); ctx.strokeStyle = C.navy; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(L, bot + 20); ctx.lineTo(L + 30, top - 20); ctx.moveTo(R, bot + 20); ctx.lineTo(R - 30, top - 20); ctx.stroke(); ctx.restore();
      for (let k = 0; k < n; k++) {
        const y = bot - (k + 0.7) * gap, a = vis[k], frac = (bot + 20 - y) / (bot + 20 - top + 20), xl = L + 30 * frac, xr = R - 30 * frac, col = Q.RUNG[k + 1];
        ctx.save(); ctx.globalAlpha = 0.15 + 0.85 * a; ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(xl, y); ctx.lineTo(xr, y); ctx.stroke(); ctx.restore();
        if (a <= 0) continue;
        ctx.save(); ctx.globalAlpha = a;
        K.label(ctx, String(k + 1), xl - 40, y + 10, { size: 30, color: col, weight: 800, align: 'center' });
        K.label(ctx, RUNGS[k][0], R + 60, y - 6, { size: 30, color: col, weight: 760 });
        K.label(ctx, RUNGS[k][1], R + 60, y + 26, { size: 21, color: C.ink, weight: 600 });
        K.label(ctx, RUNGS[k][2], S.w - 20, y - 6, { size: 20, color: C.inkSoft, align: 'right' });
        K.label(ctx, RUNGS[k][3], S.w - 20, y + 24, { size: 17, color: C.muted, align: 'right' });
        ctx.restore();
      }
      if (step >= n) {
        ctx.save(); U.arrow(ctx, S.w - 10, bot - 10, S.w - 10, top + 6, rgba(C.ink, 0), 0); ctx.restore();
      }
    }
    return { draw, step(s) { step = s; draw(); }, enter() { vis.fill(0); }, frame(dt) { let m = false; for (let k = 0; k < n; k++) { const tg = k < step ? 1 : 0; if (vis[k] !== tg) { vis[k] = tg ? Math.min(1, vis[k] + dt * 2.5) : 0; m = true; } } if (m) draw(); }, ff: 1 };
  };

  // =====================================================================================
  // Exchange energies of the noble gases: LDA and GGA relative errors vs exact (HF orbitals). B88 fit by sweeping beta.
  // builds: 0 LDA, 1 B88 beta sweep (lands on the least-squares beta), 2 PBE (no fitted parameter)
  // =====================================================================================
  ANIMS.b88fit = function (S, o) {
    const ctx = S.ctx, A = Q.D().atoms; if (!A) return { draw: () => Q.pending(S, 'atoms') };
    const X = A.exchange, at = X.atoms, B = X.betas;
    const sse = B.map((_, j) => at.reduce((s, a) => s + (a.b88[j] - a.exact) ** 2, 0));
    const jbest = sse.indexOf(Math.min(...sse));
    const W = o.only ? S.w + 80 : S.w * 0.55;
    const P = K.plot(ctx, { x: 80, y: 30, w: W - 110, h: S.h - 110 }, { x: [0, 1], y: [-15, 3], xt: [], yt: [-15, -10, -5, 0].map(v => ({ v, l: v + '%' })), fs: 17 });
    const R = K.plot(ctx, { x: W + 90, y: 30, w: S.w - W - 120, h: S.h - 110 }, { x: [B[0], B[B.length - 1]], y: [0, Math.max(...sse) * 1.05], xt: [0.003, 0.004, 0.005, 0.006].map(v => ({ v, l: v.toFixed(3) })), yt: [], xl: 'B88 parameter β', fs: 17 });
    let step = 0, t = 0;
    function draw() {
      S.clear(); P.axes(); P.hline(0, C.ink, 1.6);
      K.label(ctx, 'error in the exchange energy, % of exact', 86, 20, { size: 18, color: C.muted });
      const n = at.length, bw = 1 / n;
      let j = jbest;
      if (o.beta !== undefined) { j = B.reduce((bi, v, i) => Math.abs(v - o.beta) < Math.abs(B[bi] - o.beta) ? i : bi, 0); }
      else if (step >= 1) { const ph = Math.min(1, t / 5); j = Math.round(ph < 0.7 ? (B.length - 1) * (ph / 0.7) : (B.length - 1) + (jbest - (B.length - 1)) * K.smooth((ph - 0.7) / 0.3)); }
      at.forEach((a, k) => {
        const xc = P.X((k + 0.5) * bw), w = (P.X(bw) - P.X(0)) * 0.26;
        const lda = 100 * (a.lda - a.exact) / Math.abs(a.exact), b88 = 100 * (a.b88[j] - a.exact) / Math.abs(a.exact), pbe = 100 * (a.pbe - a.exact) / Math.abs(a.exact);
        const bar = (x, v, c) => { const y0 = P.Y(0), y1 = P.Y(v); U.roundRect(ctx, x - w / 2, Math.min(y0, y1), w, Math.max(2, Math.abs(y1 - y0)), 3, c); };
        // errors plotted as (approx − exact)/|exact|: positive = not negative enough = underestimate of |E_x|
        bar(xc - w * 1.1, -lda, Q.col('LDA'));
        if (step >= 1) bar(xc, -b88, Q.col('BLYP'));
        if (step >= 2) bar(xc + w * 1.1, -pbe, Q.col('PBE'));
        K.label(ctx, a.s, xc, P.Y(-15) + 26, { size: 20, color: C.ink, weight: 700, align: 'center' });
      });
      K.legend(ctx, P.X(0.04), P.Y(-12.4), [{ label: 'LDA', color: Q.col('LDA'), kind: 'sq' }].concat(step >= 1 ? [{ label: `B88, β = ${B[j].toFixed(4)}`, color: Q.col('BLYP'), kind: 'sq' }] : []).concat(step >= 2 ? [{ label: 'PBE (no fitted β)', color: Q.col('PBE'), kind: 'sq' }] : []), { size: 18 });
      if (step >= 1) {
        R.axes(); R.line(B, sse, C.navy, 2.6);
        K.label(ctx, 'sum of squared errors, six atoms', R.b.x + 6, 20, { size: 18, color: C.muted });
        U.circle(ctx, R.X(B[j]), R.Y(sse[j]), 8, Q.col('BLYP'), '#fff', 2);
        if (j === jbest) { R.vline(B[jbest], C.coral, 1.6, [5, 4]); K.label(ctx, `best β = ${B[jbest].toFixed(4)} (Becke 1988: 0.0042)`, R.X(B[jbest]) + 10, R.Y(Math.max(...sse) * 0.6), { size: 18, color: '#B4492F', weight: 700 }); }
      }
    }
    if (o.beta !== undefined) step = 2;
    return { draw, step(s) { if (o.beta !== undefined) return; step = s; if (s === 1) t = 0; draw(); }, enter() { t = 0; }, frame(dt) { if (o.beta === undefined && step >= 1 && t < 5.2) { t += dt; draw(); } }, ff: 6 };
  };

  // =====================================================================================
  // Exchange enhancement factors F_x(s): LDA = 1, B88 (fitted), PBE (constraints) and the Lieb-Oxford bound
  // =====================================================================================
  ANIMS.fx = function (S, o) {
    const ctx = S.ctx, cx = 1.5 * Math.pow(3 / (4 * Math.PI), 1 / 3), kap = 0.804, mu = 0.21951, beta = 0.0042;
    const b88 = (s) => { const x = Math.pow(2, 4 / 3) * Math.pow(3 * Math.PI * Math.PI, 1 / 3) * s; return 1 + beta * x * x / (1 + 6 * beta * x * Math.asinh(x)) / cx; };
    const pbe = (s) => 1 + kap - kap / (1 + mu * s * s / kap);
    const P = K.plot(ctx, { x: 90, y: 20, w: S.w - 130, h: S.h - 100 }, { x: [0, 3], y: [0.9, 2.0], xt: K.ticks([0, 0.5, 1, 1.5, 2, 2.5, 3]), yt: K.ticks([1, 1.2, 1.4, 1.6, 1.8, 2.0], v => v.toFixed(1)), xl: 'reduced density gradient s = |∇n| / (2 k_F n)', fs: 18 });
    let step = 0;
    function draw() {
      S.clear(); P.axes();
      ctx.save(); ctx.fillStyle = rgba(C.teal, 0.08); ctx.fillRect(P.X(0), P.Y(2.0), P.X(1.2) - P.X(0), P.Y(0.9) - P.Y(2.0)); ctx.restore();
      K.label(ctx, 'valence region of molecules', P.X(0.6), P.Y(1.97) + 16, { size: 16, color: C.tealDark, align: 'center' });
      P.fn(() => 1, Q.col('LDA'), 3); K.label(ctx, 'LDA', P.X(2.9), P.Y(1) - 10, { size: 20, color: Q.col('LDA'), weight: 700, align: 'right' });
      if (step >= 1) { P.fn(b88, Q.col('BLYP'), 3); K.label(ctx, 'B88 (one fitted β)', P.X(2.25), P.Y(b88(2.25)) - 14, { size: 20, color: '#9A6B00', weight: 700, align: 'right' }); }
      if (step >= 2) { P.hline(1.804, C.coral, 2, [7, 5]); K.label(ctx, 'Lieb–Oxford bound 1.804', P.X(0.1), P.Y(1.804) - 10, { size: 18, color: '#B4492F', weight: 700 }); P.fn(pbe, C.navy, 3); K.label(ctx, 'PBE (κ = 0.804, μ = 0.2195 from constraints)', P.X(2.95), P.Y(pbe(2.6)) + 30, { size: 20, color: C.navy, weight: 700, align: 'right' }); }
      K.label(ctx, 'exchange enhancement F_x(s)', 96, 14, { size: 18, color: C.muted });
    }
    return { draw, step(s) { step = s; draw(); } };
  };

  // =====================================================================================
  // meta-GGA ingredient: alpha(r) = (tau - tau_W)/tau_unif across the argon atom, with its radial density
  // =====================================================================================
  ANIMS.alphaAr = function (S, o) {
    const ctx = S.ctx, A = Q.D().atoms; if (!A) return { draw: () => Q.pending(S, 'atoms') };
    const a = A.alpha.a, rho = A.alpha.rho, rmax = Math.max(...rho.y);
    const P = K.plot(ctx, { x: 90, y: 30, w: S.w - 130, h: S.h - 110 }, { x: [0.01, 6], y: [0, 3], logx: true, xt: K.ticks([0.01, 0.1, 1], v => String(v)), yt: K.ticks([0, 1, 2, 3]), xl: 'distance from the Ar nucleus r (bohr, log scale)', fs: 18 });
    let t = 0;
    function draw() {
      S.clear(); P.axes();
      ctx.save(); ctx.beginPath(); ctx.moveTo(P.X(rho.r[0]), P.Y(0)); rho.r.forEach((r, i) => ctx.lineTo(P.X(r), P.Y(2.6 * rho.y[i] * r / Math.max(...rho.y.map((v, k) => v * rho.r[k]))))); ctx.lineTo(P.X(rho.r[rho.r.length - 1]), P.Y(0)); ctx.closePath(); ctx.fillStyle = rgba(C.navy, 0.10); ctx.fill(); ctx.restore();
      P.hline(1, C.inkSoft, 1.4, [5, 4]); K.label(ctx, 'α = 1: like the uniform electron gas', P.X(0.012), P.Y(1) - 10, { size: 17, color: C.inkSoft });
      P.hline(0, C.coral, 2); K.label(ctx, 'α = 0: one orbital (one electron pair) dominates', P.X(0.012), P.Y(0) - 10, { size: 17, color: '#B4492F' });
      const n = Math.min(a.r.length, Math.floor(t * 120));
      ctx.save(); P.clip(); P.line(a.r.slice(0, n), a.y.slice(0, n).map(v => Math.min(3.05, v)), C.teal, 3.2); ctx.restore();
    }
    return { draw, enter() { t = 0; }, frame(dt) { if (t * 120 < a.r.length + 5) { t += dt; draw(); } }, ff: 3 };
  };

  // =====================================================================================
  // How much exact exchange? PBE-based hybrids a·HF + (1−a)·PBE: atomization energies vs the H + H2 barrier
  // =====================================================================================
  ANIMS.hybridScan = function (S, o) {
    const ctx = S.ctx, D = Q.D().hybrid; if (!D) return { draw: () => Q.pending(S, 'hybrid scan') };
    const a = D.rows.map(r => r.a), tae = D.rows.map(r => r.tae_mae), bh = D.rows.map(r => Math.abs(r.barrier_err));
    const P = K.plot(ctx, { x: 100, y: 30, w: S.w - 160, h: S.h - 110 }, { x: [0, 1], y: [0, Math.min(30, Math.max(...tae, ...bh) * 1.05)], xt: K.ticks([0, 0.25, 0.5, 0.75, 1], v => Math.round(v * 100) + '%'), yt: K.ticks([0, 5, 10, 15, 20, 25, 30]), xl: 'fraction of exact (Hartree–Fock) exchange a', fs: 18 });
    let step = 0;
    function draw() {
      S.clear(); P.axes(); K.label(ctx, 'error (kcal/mol)', 106, 22, { size: 18, color: C.muted });
      ctx.save(); P.clip(); P.line(a, tae, C.navy, 3.2); P.dots(a, tae, C.navy, 5); ctx.restore();
      K.label(ctx, 'atomization energies (17 molecules, MAE)', P.X(0.46), P.Y(17), { size: 19, color: C.navy, weight: 700, align: 'right' });
      if (step >= 1) { ctx.save(); P.clip(); P.line(a, bh, C.coral, 3.2); P.dots(a, bh, C.coral, 5); ctx.restore(); K.label(ctx, 'H + H₂ barrier height, |error|', P.X(0.5), P.Y(bh[6]) - 24, { size: 19, color: '#B4492F', weight: 700 }); }
      if (step >= 2) {
        P.vline(0.25, C.violet, 1.6, [5, 4]); K.label(ctx, 'PBE0', P.X(0.25) + 6, P.Y(P.o.y[1]) + 22, { size: 18, color: C.violet, weight: 700 });
        const e = D.rows.map(r => r.barrier_err), i = e.findIndex((v, j) => j < e.length - 1 && v * e[j + 1] <= 0);
        if (i >= 0) { const ab = a[i] + (a[i + 1] - a[i]) * e[i] / (e[i] - e[i + 1]); P.vline(ab, '#B4492F', 1.6, [5, 4]); K.label(ctx, 'barrier exact', P.X(ab) + 6, P.Y(14), { size: 18, color: '#B4492F', weight: 700 }); K.label(ctx, `at ${Math.round(ab * 100)}%`, P.X(ab) + 6, P.Y(14) + 22, { size: 18, color: '#B4492F', weight: 700 }); }
      }
    }
    return { draw, step(s) { step = s; draw(); } };
  };

  // =====================================================================================
  // The argon dimer: counterpoise-corrected interaction energies (CCSD(T)/aug-cc-pVQZ, DFT/aug-cc-pVTZ)
  // builds: 0 CCSD(T), 1 LDA/PBE/B3LYP/HF, 2 dispersion-aware (VV10) functionals
  // =====================================================================================
  ANIMS.ar2 = function (S, o) {
    const ctx = S.ctx, D = Q.D().ar2; if (!D) return { draw: () => Q.pending(S, 'Ar₂') };
    const R = D.R, c = D.curves;
    const P = K.plot(ctx, { x: 100, y: 24, w: S.w - 330, h: S.h - 104 }, { x: [3.1, 6.5], y: [-0.8, 0.6], xt: K.ticks([3.5, 4, 4.5, 5, 5.5, 6, 6.5]), yt: K.ticks([-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6], v => v.toFixed(1)), xl: 'Ar–Ar distance (Å)', fs: 18 });
    const sets = [['CCSD(T)', 0, C.ink, 'CCSD(T)'], ['LDA', 1, Q.col('LDA'), 'LDA'], ['PBE', 1, Q.col('PBE'), 'PBE'], ['B3LYP', 1, Q.col('B3LYP'), 'B3LYP'], ['HF', 1, Q.col('HF'), 'Hartree–Fock'], ['wB97X-V', 2, C.violet, 'ωB97X-V'], ['B97M-V', 2, C.teal, 'B97M-V'], ['r2SCAN', 2, '#1F7A6F', 'r²SCAN']];
    let step = 0;
    function draw() {
      S.clear(); P.axes(); P.hline(0, rgba(C.ink, 0.35), 1.4);
      K.label(ctx, 'interaction energy (kcal/mol)', 106, 16, { size: 18, color: C.muted });
      U.circle(ctx, P.X(3.757), P.Y(-0.284), 7, null, C.coral, 2.4); K.label(ctx, 'experiment-quality well: −0.284 at 3.76 Å', P.X(3.85), P.Y(-0.284) + 30, { size: 17, color: '#B4492F', weight: 650 });
      ctx.save(); P.clip();
      sets.forEach(([k, s, col]) => { if (s > step || !c[k]) return; P.line(R, c[k], col, k === 'CCSD(T)' ? 3.6 : 2.6, s === 2 ? [8, 5] : null); });
      ctx.restore();
      let ly = 50; sets.forEach(([k, s, col, lab]) => { if (s > step || !c[k]) return; K.legend(ctx, S.w - 210, ly, [{ label: lab, color: col, kind: s === 2 ? 'dash' : 'line' }], { size: 19 }); ly += 32; });
    }
    return { draw, step(s) { step = s; draw(); } };
  };
})();
