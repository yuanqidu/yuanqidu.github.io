/* Where approximate functionals fail: one electron (H2+), fractional electron numbers, orbital energies and the
   potential's tail, stretched H2 (static correlation), and the H + H2 barrier. */
(function () {
  'use strict';
  const { C, rgba } = U;
  const KC = 627.509474;

  // =====================================================================================
  // H2+ (one electron: Hartree-Fock is exact) vs approximate functionals, aug-cc-pVTZ (PySCF)
  // =====================================================================================
  ANIMS.h2plus = function (S, o) {
    const ctx = S.ctx, D = Q.D().curves; if (!D || !D['H2+']) return { draw: () => Q.pending(S, 'H₂⁺') };
    const rows = D['H2+'].rows, R = rows.map(r => r.R);
    const P = K.plot(ctx, { x: 110, y: 24, w: S.w - 330, h: S.h - 104 }, { x: [0.8, 12], y: [-70, 30], xt: K.ticks([2, 4, 6, 8, 10, 12]), yt: K.ticks([-60, -40, -20, 0, 20], v => (v < 0 ? '−' : '') + Math.abs(v)), xl: 'H–H distance (bohr)', fs: 18 });
    const sets = [['exact', 0, C.ink, 'exact'], ['LDA', 1, Q.col('LDA'), 'LDA'], ['PBE', 1, Q.col('PBE'), 'PBE'], ['r2SCAN', 1, Q.col('r2SCAN'), 'r²SCAN'], ['B3LYP', 2, Q.col('B3LYP'), 'B3LYP'], ['PBE0', 2, Q.col('PBE0'), 'PBE0'], ['wB97X-V', 2, Q.col('wB97X-V'), 'ωB97X-V']];
    let step = 0;
    function draw() {
      S.clear(); P.axes(); P.hline(0, rgba(C.ink, 0.35), 1.4, [4, 4]);
      K.label(ctx, 'energy relative to H + H⁺ (kcal/mol)', 116, 16, { size: 18, color: C.muted });
      ctx.save(); P.clip();
      sets.forEach(([k, s, col]) => { if (s > step) return; const xs = [], ys = []; rows.forEach((r, i) => { if (r[k] !== null && r[k] !== undefined) { xs.push(R[i]); ys.push((r[k] + 0.5) * KC); } }); P.line(xs, ys, col, k === 'exact' ? 3.6 : 2.6); });
      ctx.restore();
      let ly = 50; sets.forEach(([k, s, col, lab]) => { if (s > step) return; K.legend(ctx, S.w - 210, ly, [{ label: lab, color: col }], { size: 19 }); ly += 32; });
      if (step >= 1) K.label(ctx, 'the electron spreads over both protons: too low by tens of kcal/mol', P.X(4.6), P.Y(-66), { size: 19, color: '#B4492F', weight: 650 });
    }
    return { draw, step(s) { step = s; draw(); } };
  };

  // =====================================================================================
  // Energy vs fractional electron number for carbon (C+ -> C -> C-), deviation from straight lines (js/qc engine)
  // =====================================================================================
  ANIMS.fracN = function (S, o) {
    const ctx = S.ctx, A = Q.D().atoms; if (!A) return { draw: () => Q.pending(S, 'atoms') };
    const F = A.fracN, N = F.N;
    const dev = (E) => N.map((n, i) => { const lo = i < 10 ? 0 : 10, hi = lo + 10, f = (n - N[lo]) / (N[hi] - N[lo]); return (E[i] - (E[lo] + f * (E[hi] - E[lo]))) * KC; });
    const sets = [['hf', 'Hartree–Fock', Q.col('HF'), 1], ['lda', 'LDA', Q.col('LDA'), 2], ['pbe', 'PBE', Q.col('PBE'), 2], ['b3lyp', 'B3LYP', Q.col('B3LYP'), 3]];
    const all = sets.flatMap(s => dev(F.E[s[0]])), ymax = Math.max(...all.map(Math.abs)) * 1.15;
    const P = K.plot(ctx, { x: 100, y: 24, w: S.w - 140, h: S.h - 104 }, { x: [2, 4], y: [-ymax, ymax], xt: [{ v: 2, l: '2  (Be²⁺)' }, { v: 3, l: '3  (Be⁺)' }, { v: 4, l: '4  (Be)' }], yt: K.ticks([-30, -20, -10, 0, 10, 20, 30].filter(v => Math.abs(v) < ymax), v => (v < 0 ? '−' : v > 0 ? '+' : '') + Math.abs(v)), xl: 'number of electrons N', fs: 18 });
    let step = 0;
    function draw() {
      S.clear(); P.axes();
      K.label(ctx, 'E(N) minus the straight line between integers (kcal/mol)', 106, 16, { size: 18, color: C.muted });
      P.hline(0, C.ink, 3.4); K.label(ctx, 'exact: straight lines (Perdew, Parr, Levy & Balduz 1982)', P.X(2.03), P.Y(0) - 12, { size: 19, color: C.ink, weight: 700 });
      let ly = 0; sets.forEach(([k, lab, col, s]) => { if (s > step) return; const d = dev(F.E[k]); P.line(N, d, col, 3.2); K.legend(ctx, P.X(3.62), P.Y(ymax) + 26 + 28 * ly, [{ label: lab, color: col }], { size: 19 }); ly++; });
      if (step >= 1) K.label(ctx, 'above the line (concave): localization error', P.X(3.5), P.Y(ymax * 0.55), { size: 19, color: C.inkSoft, align: 'center' });
      if (step >= 2) K.label(ctx, 'below the line (convex): delocalization error', P.X(3.0), P.Y(-ymax * 0.93), { size: 19, color: '#B4492F', align: 'center', weight: 650 });
    }
    return { draw, step(s) { step = s; draw(); } };
  };

  // =====================================================================================
  // Highest occupied orbital energy vs the measured first ionization energy, H to Kr (js/qc engine)
  // builds: 0 experiment, 1 Hartree-Fock (Koopmans), 2 LDA & PBE, 3 B3LYP
  // =====================================================================================
  ANIMS.homoIP = function (S, o) {
    const ctx = S.ctx, A = Q.D().atoms; if (!A) return { draw: () => Q.pending(S, 'atoms') };
    const H0 = A.homo, nZ = 18, H = { Z: H0.Z.slice(0, nZ), sym: H0.sym, IP: H0.IP.slice(0, nZ), eps: Object.fromEntries(Object.entries(H0.eps).map(([k, v]) => [k, v.slice(0, nZ)])) }, Z = H.Z;
    const P = K.plot(ctx, { x: 90, y: 24, w: S.w - 120, h: S.h - 104 }, { x: [0.5, 18.5], y: [0, 26], xt: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(z => ({ v: z, l: H.sym[z - 1] })), yt: K.ticks([0, 5, 10, 15, 20, 25]), xl: 'element', fs: 18 });
    const sets = [['hf', 1, Q.col('HF'), 'Hartree–Fock −ε_HOMO'], ['lda', 2, Q.col('LDA'), 'LDA −ε_HOMO'], ['pbe', 2, Q.col('PBE'), 'PBE −ε_HOMO'], ['b3lyp', 3, Q.col('B3LYP'), 'B3LYP −ε_HOMO']];
    let step = 0;
    function draw() {
      S.clear(); P.axes(); K.label(ctx, 'eV', 96, 16, { size: 18, color: C.muted });
      P.line(Z, H.IP, C.ink, 3.4); P.dots(Z, H.IP, C.ink, 4.5);
      sets.forEach(([k, s, col]) => { if (s > step) return; const y = H.eps[k].map(v => -v); P.line(Z, y, col, 2.4, [7, 4]); P.dots(Z, y, col, 4); });
      let ly = 46; K.legend(ctx, P.X(11.2), ly, [{ label: 'measured ionization energy', color: C.ink }], { size: 19 });
      sets.forEach(([k, s, col, lab]) => { if (s > step) return; ly += 30; K.legend(ctx, P.X(11.2), ly, [{ label: lab, color: col, kind: 'dash' }], { size: 19 }); });
    }
    return { draw, step(s) { step = s; draw(); } };
  };

  // =====================================================================================
  // The tail of the exchange-correlation potential of Ne: approximations decay exponentially, exact is -1/r
  // =====================================================================================
  ANIMS.vxcTail = function (S, o) {
    const ctx = S.ctx, A = Q.D().atoms; if (!A) return { draw: () => Q.pending(S, 'atoms') };
    const V = A.vxc;
    const P = K.plot(ctx, { x: 100, y: 24, w: S.w - 140, h: S.h - 104 }, { x: [0, 9], y: [1e-4, 10], logy: true, xt: K.ticks([0, 2, 4, 6, 8]), yt: [10, 1, 0.1, 0.01, 1e-3, 1e-4].map(v => ({ v, l: K.sig(v, 1) })), xl: 'distance from the Ne nucleus (bohr)', fs: 18 });
    function draw() {
      S.clear(); P.axes(); K.label(ctx, '−v_xc(r)  (hartree, log scale)', 106, 16, { size: 18, color: C.muted });
      P.fn(r => 1 / r, C.ink, 3.4, null, 300, 0.1, 9); K.label(ctx, 'exact tail: −1/r', P.X(8.8), P.Y(1 / 8.8) - 12, { size: 20, color: C.ink, weight: 700, align: 'right' });
      [['lda', 'LDA'], ['pbe', 'PBE'], ['blyp', 'BLYP']].forEach(([k, l], j) => { P.line(V[k].r.filter(r => r <= 9), V[k].y.filter((_, i) => V[k].r[i] <= 9).map(v => -v), Q.col(l), 2.8, [7, 4]); K.legend(ctx, P.X(5.6), 60 + 30 * j, [{ label: l, color: Q.col(l), kind: 'dash' }], { size: 19 }); });
      K.label(ctx, 'an electron far away should feel its own hole: −1/r', P.X(0.4), P.Y(2e-4), { size: 18, color: C.inkSoft });
    }
    return { draw };
  };

  // =====================================================================================
  // Stretching H2: restricted vs unrestricted Kohn-Sham against full CI (aug-cc-pVTZ, PySCF). Each curve relative to
  // two H atoms computed with the same method.
  // =====================================================================================
  ANIMS.h2dft = function (S, o) {
    const ctx = S.ctx, D = Q.D().curves; if (!D || !D.H2) return { draw: () => Q.pending(S, 'H₂') };
    const rows = D.H2.rows, at = D.H2.atom, R = rows.map(r => r.R);
    const P = K.plot(ctx, { x: 110, y: 24, w: S.w - 330, h: S.h - 104 }, { x: [0.6, 8], y: [-120, 80], xt: K.ticks([1, 2, 3, 4, 5, 6, 7, 8]), yt: K.ticks([-100, -50, 0, 50], v => (v < 0 ? '−' : '') + Math.abs(v)), xl: 'H–H distance (bohr)', fs: 18 });
    const sets = [['FCI', 'HF', 0, C.ink, 'full CI', null], ['RHF', 'HF', 0, Q.col('RHF'), 'RHF', null], ['R-PBE', 'PBE', 1, Q.col('PBE'), 'restricted PBE', null], ['U-PBE', 'PBE', 2, Q.col('PBE'), 'unrestricted PBE', [8, 5]], ['R-B3LYP', 'B3LYP', 1, Q.col('B3LYP'), 'restricted B3LYP', null], ['U-B3LYP', 'B3LYP', 2, Q.col('B3LYP'), 'unrestricted B3LYP', [8, 5]]];
    let step = 0;
    function draw() {
      S.clear(); P.axes(); P.hline(0, rgba(C.ink, 0.35), 1.4, [4, 4]);
      K.label(ctx, 'energy relative to two H atoms, same method (kcal/mol)', 116, 16, { size: 18, color: C.muted });
      ctx.save(); P.clip();
      sets.forEach(([k, a, s, col, , dash]) => { if (s > step) return; const xs = [], ys = []; rows.forEach((r, i) => { if (r[k] !== null && r[k] !== undefined) { xs.push(R[i]); ys.push((r[k] - 2 * at[a]) * KC); } }); P.line(xs, ys, col, k === 'FCI' ? 3.6 : 2.6, dash); });
      ctx.restore();
      let ly = 50; sets.forEach(([k, , s, col, lab, dash]) => { if (s > step) return; K.legend(ctx, S.w - 210, ly, [{ label: lab, color: col, kind: dash ? 'dash' : 'line' }], { size: 18 }); ly += 30; });
    }
    return { draw, step(s) { step = s; draw(); } };
  };

  // =====================================================================================
  // H + H2 -> H2 + H barrier height by method (PySCF; FCI is exact in the basis)
  // =====================================================================================
  ANIMS.barrierBars = function (S, o) {
    const D = Q.D().barrier; if (!D) return { draw: () => Q.pending(S, 'barrier') };
    const B = D.barrier, keys = ['HF', 'LDA', 'PBE', 'BLYP', 'TPSS', 'SCAN', 'r2SCAN', 'B3LYP', 'PBE0', 'M06-2X', 'wB97X-V', 'B2PLYP', 'CCSD(T)'];
    const items = keys.filter(k => B[k] !== null && B[k] !== undefined).map(k => ({ l: k === 'HF' ? 'Hartree–Fock' : Q.pretty(k), v: B[k], c: k === 'CCSD(T)' ? C.ink : Q.RUNG[Q.rungOf(k)], s: k === 'CCSD(T)' || k === 'HF' ? 0 : Q.rungOf(k) <= 3 ? 1 : 2 }));
    return ANIMS.bars(S, { items, min: -5, max: 20, ticks: [-5, 0, 5, 10, 15, 20], unit: 'kcal/mol', dec: 1, lw: 220, fs: 19, refs: [{ v: B.FCI, l: `exact (full CI): ${B.FCI.toFixed(2)}`, c: C.coral }], xl: 'classical barrier height, kcal/mol' });
  };
})();
