/* Wavefunction-ladder figures: SCF convergence, Gaussian fits to a Slater orbital, H2 in a minimal basis (live),
   size consistency of truncated CI (live), the Pople diagram for water, atomization energies up the ladder, N2. */
(function () {
  'use strict';
  const { C, rgba } = U;
  // W4-11 total atomization energies (kcal/mol; non-relativistic, vibrationless, all-electron; GMTKN55 reference)
  const W4 = { H2: 109.493, CH4: 420.420, NH3: 298.018, H2O: 232.974, HF: 141.640, C2H2: 405.525, C2H4: 564.095, HCN: 313.418, CO: 259.727,
    N2: 228.485, NO: 152.745, O2: 120.824, F2: 39.042, CO2: 390.141, OH: 107.208, CH2O: 374.658, O3: 147.428 };
  Q.W4 = W4;
  const NAME = { CH2O: 'H₂CO', H2: 'H₂', CH4: 'CH₄', NH3: 'NH₃', H2O: 'H₂O', C2H2: 'C₂H₂', C2H4: 'C₂H₄', N2: 'N₂', O2: 'O₂', F2: 'F₂', CO2: 'CO₂', O3: 'O₃' };
  Q.mol = (m) => NAME[m] || m;
  // mean absolute error (kcal/mol) of a method over the molecules with data
  Q.taeErrors = function (key) {
    const L = Q.D().ladder; if (!L) return null;
    const out = {}; for (const m in W4) { const v = L.tae[m] && L.tae[m][key]; if (v !== null && v !== undefined) out[m] = v - W4[m]; }
    return out;
  };
  Q.mae = (errs) => { const v = Object.values(errs || {}); return v.length ? v.reduce((s, x) => s + Math.abs(x), 0) / v.length : NaN; };

  // =====================================================================================
  // SCF convergence: |E_k − E_final| per iteration for four atoms/methods, drawn iteration by iteration
  // =====================================================================================
  ANIMS.scfConv = function (S, o) {
    const ctx = S.ctx, A = Q.D().atoms; if (!A) return { draw: () => Q.pending(S, 'atoms') };
    const runs = [['Ne_hf', 'Ne, Hartree–Fock', C.navy], ['Ar_hf', 'Ar, Hartree–Fock', C.blue], ['Ne_pbe', 'Ne, PBE', C.teal], ['Kr_b3lyp', 'Kr, B3LYP', C.violet]];
    const P = K.plot(ctx, { x: 100, y: 20, w: S.w - 130, h: S.h - 120 }, { x: [1, 22], y: [1e-10, 1e3], logy: true, xt: K.ticks([1, 5, 10, 15, 20]), yt: [1e3, 1, 1e-3, 1e-6, 1e-9].map(v => ({ v, l: K.sig(v, 1) })), xl: 'iteration', fs: 18 });
    let t = 0;
    function draw() {
      S.clear(); P.axes();
      K.label(ctx, '|E − E_converged|  (hartree)', 106, 14, { size: 18, color: C.muted });
      runs.forEach(([k, lab, col], j) => {
        const d = A.scf[k]; if (!d) return; const n = Math.min(d.hist.length, Math.floor(t * 4));
        const xs = [], ys = []; for (let i = 0; i < n; i++) { xs.push(i + 1); ys.push(Math.max(1e-10, Math.abs(d.hist[i] - d.E))); }
        P.line(xs, ys, col, 2.6); P.dots(xs, ys, col, 4.5);
        K.legend(ctx, P.X(12), 40 + 30 * j, [{ label: `${lab}: ${d.hist.length} iterations`, color: col }], { size: 18 });
      });
      P.hline(1.6e-3, C.coral, 1.6, [6, 5]); K.label(ctx, '1 kcal/mol', P.X(21.6), P.Y(1.6e-3) - 8, { size: 17, color: C.coral, align: 'right' });
    }
    return { frame(dt) { if (t < 12) { t += dt; draw(); } }, draw, enter() { t = 0; }, ff: 12 };
  };

  // =====================================================================================
  // Gaussians vs a Slater 1s orbital: radial functions r·φ(r) for e^{-r}/√π and its best STO-nG fits
  // builds: 0 Slater only, 1 STO-1G, 2 STO-3G, 3 STO-6G (cusp inset)
  // =====================================================================================
  ANIMS.stoFit = function (S, o) {
    const ctx = S.ctx, A = Q.D().atoms; if (!A) return { draw: () => Q.pending(S, 'atoms') };
    const slater = (r) => Math.exp(-r) / Math.sqrt(Math.PI);
    const fit = (k) => { const f = A.sto.find(s => s.n === k); return (r) => f.alpha.reduce((s, a, i) => s + f.c[i] * Math.pow(2 * a / Math.PI, 0.75) * Math.exp(-a * r * r), 0); };
    const fits = [[1, '#E0A030'], [3, C.teal], [6, C.violet]].map(([k, c]) => ({ k, c, f: fit(k), ov: A.sto.find(s => s.n === k).overlap }));
    const P = K.plot(ctx, { x: 90, y: 20, w: S.w - 120, h: S.h - 110 }, { x: [0, 4], y: [0, 0.6], xt: K.ticks([0, 1, 2, 3, 4]), yt: K.ticks([0, 0.2, 0.4, 0.6]), xl: 'r (bohr)', fs: 18 });
    const I = K.plot(ctx, { x: S.w - 330, y: 40, w: 280, h: 200 }, { x: [0, 0.4], y: [0.38, 0.58], xt: K.ticks([0, 0.2, 0.4]), yt: [], fs: 15 });
    let step = 0;
    function draw() {
      S.clear(); P.axes();
      P.fn(slater, C.ink, 3.2);
      K.label(ctx, 'Slater: e^{−r}', P.X(0.5), P.Y(slater(0.5)) - 14, { size: 20, color: C.ink, weight: 700 });
      fits.forEach((F, j) => { if (step > j) { P.fn(F.f, F.c, 2.6, [8, 5]); K.legend(ctx, P.X(1.9), P.Y(0.29) + 30 * j, [{ label: `STO-${F.k}G (overlap ${(F.ov * 100).toFixed(3)}%)`, color: F.c, kind: 'dash' }], { size: 19 }); } });
      if (step >= 1) {
        ctx.save(); U.roundRect(ctx, I.b.x - 16, I.b.y - 26, I.b.w + 36, I.b.h + 60, 12, '#fff', C.faint, 1.2); ctx.restore();
        I.axes(); ctx.save(); I.clip(); I.fn(slater, C.ink, 3); fits.forEach((F, j) => { if (step > j) I.fn(F.f, F.c, 2.4, [6, 4]); }); ctx.restore();
        K.label(ctx, 'the cusp at the nucleus', I.b.x + 4, I.b.y - 8, { size: 16, color: C.inkSoft, weight: 650 });
      }
    }
    return { draw, step(s) { step = s; draw(); } };
  };

  // =====================================================================================
  // H2 in a minimal basis (STO-3G), computed live: RHF, UHF and full CI; weights of the configurations.
  // A marker sweeps the bond length; builds: 0 RHF, 1 FCI, 2 UHF + weights
  // =====================================================================================
  ANIMS.h2min = function (S, o) {
    const ctx = S.ctx, H = QC.h2like;
    const Rs = []; for (let R = 0.6; R <= 6.001; R += 0.1) Rs.push(+R.toFixed(2));
    const rows = Rs.map(R => { const sys = H.diatomic('H', 'H', R, 'STO-3G'), f = H.fci(sys), u = H.hf(sys, 'UHF'); return { R, rhf: f.EHF, fci: f.E, uhf: Math.min(u.E, f.EHF), c0: f.c[0], cd: f.c[2] }; });
    const W = S.w * 0.58;
    const P = K.plot(ctx, { x: 100, y: 30, w: W - 120, h: S.h - 120 }, { x: [0.5, 6], y: [-1.15, -0.5], xt: K.ticks([1, 2, 3, 4, 5, 6]), yt: [-1.1, -1.0, -0.9, -0.8, -0.7, -0.6].map(v => ({ v, l: v.toFixed(1) })), xl: 'H–H distance R (bohr)', fs: 18 });
    let step = 0, t = 0;
    function draw() {
      S.clear(); P.axes(); P.hline(-0.9332, rgba(C.ink, 0.5), 1.4, [4, 4]); K.label(ctx, '2 H atoms (STO-3G)', P.X(5.95), P.Y(-0.9332) - 8, { size: 16, color: C.muted, align: 'right' });
      P.line(Rs, rows.map(r => r.rhf), Q.col('RHF'), 3); K.label(ctx, 'RHF', P.X(5.5), P.Y(rows[rows.length - 6].rhf) - 10, { size: 20, color: '#6B7785', weight: 700 });
      if (step >= 1) { P.line(Rs, rows.map(r => r.fci), C.ink, 3); K.label(ctx, 'full CI (exact here)', P.X(3.4), P.Y(-1.02) + 30, { size: 20, color: C.ink, weight: 700 }); }
      if (step >= 2) { P.line(Rs, rows.map(r => r.uhf), C.coral, 2.6, [8, 5]); K.label(ctx, 'UHF', P.X(4.2), P.Y(rows[36].uhf) + 26, { size: 20, color: C.coral, weight: 700 }); }
      // sweep marker
      const R = 0.7 + (5.5 - 0.7) * (0.5 - 0.5 * Math.cos(t * 0.5)), k = Math.min(rows.length - 1, Math.round((R - 0.6) / 0.1)), row = rows[k];
      P.vline(row.R, rgba(C.navy, 0.35), 1.5, [3, 4]);
      U.circle(ctx, P.X(row.R), P.Y(row.rhf), 6, Q.col('RHF'), '#fff', 2);
      if (step >= 1) U.circle(ctx, P.X(row.R), P.Y(row.fci), 6, C.ink, '#fff', 2);
      // configuration weights
      const bx = W + 30, bw = S.w - bx - 20; let y = 60;
      K.label(ctx, `R = ${row.R.toFixed(1)} bohr`, bx, y, { size: 24, color: C.navy, weight: 750 }); y += 50;
      // σ_g² and σ_u² each hold ionic (aa + bb) and covalent (ab + ba) terms; with c₁/c₀ < 0 the ionic part cancels
      // (weights neglect the small atomic-orbital overlap)
      const ionicRHF = 0.5, ionicFCI = 0.5 * (row.c0 + row.cd) ** 2 / (row.c0 * row.c0 + row.cd * row.cd);
      const bar = (lab, v, col, sub) => { K.label(ctx, lab, bx, y, { size: 20, color: C.ink, weight: 650 }); y += 12; U.roundRect(ctx, bx, y, bw, 26, 6, '#EEF0F2'); U.roundRect(ctx, bx, y, Math.max(3, bw * v), 26, 6, col); K.label(ctx, (v * 100).toFixed(0) + '%', bx + bw - 6, y + 20, { size: 18, color: C.ink, weight: 700, align: 'right' }); y += 50; if (sub) { K.label(ctx, sub, bx, y, { size: 16, color: C.muted }); y += 40; } };
      K.label(ctx, 'chance both electrons sit on the same atom', bx, y, { size: 18, color: C.inkSoft }); y += 34;
      bar('Hartree–Fock (one determinant)', ionicRHF, Q.col('RHF'), 'H⁺H⁻ + H⁻H⁺ half the time, at every distance');
      if (step >= 1) bar('full CI', ionicFCI, C.ink, 'falls to zero as the bond breaks');
      if (step >= 1) {
        y += 6; K.label(ctx, 'full CI = c₀ |σ_g²⟩ + c₁ |σ_u²⟩', bx, y, { size: 20, color: C.ink }); y += 34;
        K.label(ctx, `c₀ = ${row.c0 >= 0 ? ' ' : '−'}${Math.abs(row.c0).toFixed(3)}    c₁ = ${row.cd >= 0 ? ' ' : '−'}${Math.abs(row.cd).toFixed(3)}`, bx, y, { size: 21, color: C.navy, weight: 700 });
      }
    }
    return { frame(dt) { t += dt; draw(); }, draw, step(s) { step = s; draw(); }, ff: 3 };
  };

  // =====================================================================================
  // Size consistency: N far-apart H2 molecules. CISD (doubles of the whole system) vs CC / full CI (exact here).
  // From the 2×2 full-CI problem of one H2/STO-3G at R = 1.4 bohr: K = coupling, 2Δ = gap.
  //   per molecule: E_c^FCI = Δ − √(Δ² + K²);   E_c^CISD(N)/N = [Δ − √(Δ² + N K²)] / N
  // =====================================================================================
  ANIMS.sizeCons = function (S, o) {
    const ctx = S.ctx, H = QC.h2like, f = H.fci(H.diatomic('H', 'H', 1.4, 'STO-3G'));
    const E0 = f.EHF, E = f.E, c0 = f.c[0], cd = f.c[2], Kc = (E - E0) * c0 / cd, Ed = E - Kc * c0 / cd, Dl = (Ed - E0) / 2;
    const ecFCI = (Dl - Math.sqrt(Dl * Dl + Kc * Kc)) * 1000, ecCISD = (N) => (Dl - Math.sqrt(Dl * Dl + N * Kc * Kc)) / N * 1000;
    const P = K.plot(ctx, { x: 110, y: 30, w: S.w - 150, h: S.h - 120 }, { x: [1, 1000], y: [0, 105], logx: true, xt: K.ticks([1, 10, 100, 1000]), yt: [0, 25, 50, 75, 100].map(v => ({ v, l: v + '%' })), xl: 'number of separated H₂ molecules N', fs: 18 });
    let step = 0, t = 0;
    function draw() {
      S.clear(); P.axes();
      K.label(ctx, 'correlation energy per molecule, % of exact', 116, 22, { size: 18, color: C.muted });
      P.hline(100, C.ink, 3); K.label(ctx, 'coupled cluster (CCD) = full CI: exact for every N', P.X(1000), P.Y(100) - 12, { size: 20, color: C.ink, weight: 700, align: 'right' });
      if (step >= 1) {
        const nmax = Math.pow(10, Math.min(3, t * 1.2)), xs = [], ys = [];
        for (let i = 0; i <= 200; i++) { const N = Math.pow(10, 3 * i / 200); if (N > nmax) break; xs.push(N); ys.push(100 * ecCISD(N) / ecFCI); }
        P.line(xs, ys, C.coral, 3.2);
        [8, 100].forEach(N => { if (N <= nmax) { const v = 100 * ecCISD(N) / ecFCI; P.dots([N], [v], C.coral, 6); K.label(ctx, `N = ${N}: ${v.toFixed(1)}%`, P.X(N) + 12, P.Y(v) + 26, { size: 19, color: '#B4492F', weight: 700 }); } });
        K.label(ctx, 'CISD: all double excitations of the whole system', P.X(1.3), P.Y(30), { size: 20, color: '#B4492F', weight: 700 });
      }
      K.label(ctx, `one H₂ (STO-3G, R = 1.4 bohr): E_c = ${ecFCI.toFixed(2)} mE_h`, P.X(1.3), P.Y(8), { size: 17, color: C.muted });
    }
    return { draw, step(s) { step = s; if (s >= 1) t = Math.max(t, 0); draw(); }, frame(dt) { if (step >= 1 && t < 3) { t += dt; draw(); } }, enter() { t = 0; }, ff: 3 };
  };

  // =====================================================================================
  // The Pople diagram for water: rows = basis sets, columns = methods; colour = error vs the CCSD(T)/CBS estimate
  // builds: 0 HF column, 1 all methods, 2 the exact corner
  // =====================================================================================
  ANIMS.pople = function (S, o) {
    const ctx = S.ctx, D = Q.D().pople; if (!D) return { draw: () => Q.pending(S, 'Pople-diagram') };
    const cols = ['HF', 'MP2', 'CISD', 'CCSD', 'CCSD(T)', 'FCI'], tk = { HF: 't_HF', MP2: 't_MP2', CISD: 't_CISD', CCSD: 't_CCSD', 'CCSD(T)': 't_(T)', FCI: 't_FCI' };
    const BN = { 'sto-3g': 'STO-3G', '6-31g': '6-31G', '6-31g*': '6-31G*', 'cc-pvdz': 'cc-pVDZ', 'cc-pvtz': 'cc-pVTZ', 'cc-pvqz': 'cc-pVQZ', 'cc-pv5z': 'cc-pV5Z' };
    const ref = D.cbs['CCSD(T)'], rows = D.rows;
    const x0 = 250, y0 = 66, cw = (S.w - x0 - 20) / cols.length, rh = (S.h - y0 - 20) / (rows.length + 1);
    const colr = (err) => { const v = Math.log10(Math.max(1e-4, Math.abs(err) * 1000)); const tt = Math.min(1, Math.max(0, (v + 0.5) / 3.3)); return U.mix('#2A9D8F', '#E76F51', tt); };
    let step = 0;
    function cell(i, j, E, tsec, show) {
      const x = x0 + j * cw, y = y0 + i * rh;
      if (E === undefined || E === null) { U.roundRect(ctx, x + 4, y + 4, cw - 8, rh - 8, 8, '#F2F0EA'); K.label(ctx, '—', x + cw / 2, y + rh / 2 + 7, { size: 18, color: C.muted, align: 'center' }); return; }
      if (!show) { U.roundRect(ctx, x + 4, y + 4, cw - 8, rh - 8, 8, '#F2F0EA'); return; }
      const err = E - ref; U.roundRect(ctx, x + 4, y + 4, cw - 8, rh - 8, 8, colr(err));
      K.label(ctx, E.toFixed(4), x + cw / 2, y + rh / 2 + 1, { size: 19, color: '#fff', weight: 700, align: 'center' });
      if (tsec !== undefined) K.label(ctx, tsec < 1 ? '< 1 s' : tsec < 100 ? tsec.toFixed(0) + ' s' : (tsec / 60).toFixed(0) + ' min', x + cw / 2, y + rh / 2 + 22, { size: 14, color: 'rgba(255,255,255,.9)', align: 'center' });
    }
    function draw() {
      S.clear();
      cols.forEach((c, j) => K.label(ctx, c, x0 + j * cw + cw / 2, y0 - 16, { size: 21, color: C.navy, weight: 750, align: 'center' }));
      rows.forEach((r, i) => { K.label(ctx, `${BN[r.basis] || r.basis}`, x0 - 18, y0 + i * rh + rh / 2 + 2, { size: 20, color: C.ink, weight: 650, align: 'right' }); K.label(ctx, `${r.nbf} functions`, x0 - 18, y0 + i * rh + rh / 2 + 22, { size: 14, color: C.muted, align: 'right' }); cols.forEach((c, j) => cell(i, j, r[c], r[tk[c]], j === 0 || step >= 1)); });
      const i = rows.length; K.label(ctx, 'basis-set limit', x0 - 18, y0 + i * rh + rh / 2 + 8, { size: 20, color: C.ink, weight: 650, align: 'right' });
      cols.forEach((c, j) => cell(i, j, D.cbs[c], undefined, (j === 0 || step >= 1) && D.cbs[c] !== undefined));
      if (step >= 2) { const x = x0 + 5 * cw, y = y0 + i * rh; U.roundRect(ctx, x + 4, y + 4, cw - 8, rh - 8, 8, null, C.navy, 3, [6, 4]); K.label(ctx, '"exact"', x + cw / 2, y + rh / 2 + 8, { size: 20, color: C.navy, weight: 800, align: 'center' }); }
      K.label(ctx, 'energies in hartree · colour: distance from the CCSD(T)/CBS estimate (teal ≈ 0.3 mE_h, coral ≥ 0.5 E_h) · times on this laptop, one core', x0, S.h - 2, { size: 15, color: C.muted });
    }
    return { draw, step(s) { step = s; draw(); } };
  };

  // =====================================================================================
  // Atomization energies: mean absolute error vs W4-11 for a list of methods (bars), from ladder.json.
  // opts.methods: [[key, label, color?, step?]]
  // =====================================================================================
  ANIMS.taeMAE = function (S, o) {
    const L = Q.D().ladder; if (!L) return { draw: () => Q.pending(S, 'ladder') };
    const items = o.methods.map(([k, l, c, s]) => ({ l, v: Q.mae(Q.taeErrors(k)), c: c || Q.col(k.split('/')[0]), s: s || 0, b: !!o.bold && o.bold.includes(k) }));
    return ANIMS.bars(S, Object.assign({ items, log: !!o.log, min: o.min, max: o.max, ticks: o.ticks, unit: 'kcal/mol', dec: 1, refs: [{ v: 1, l: '1 kcal/mol', c: C.coral }], xl: o.xl || 'mean absolute error of 17 atomization energies vs W4-11 (kcal/mol)' }, o.bars || {}));
  };

  // =====================================================================================
  // Per-molecule atomization energy: W4-11 vs Hartree-Fock (from ladder.json): HF recovers only part of each bond
  // =====================================================================================
  ANIMS.hfBonds = function (S, o) {
    const ctx = S.ctx, L = Q.D().ladder; if (!L) return { draw: () => Q.pending(S, 'ladder') };
    const mols = Object.keys(W4).filter(m => L.tae[m] && L.tae[m].HF !== null).sort((a, b) => W4[b] - W4[a]);
    const P = K.plot(ctx, { x: 120, y: 20, w: S.w - 160, h: S.h - 90 }, { x: [-60, 600], y: [0, 1], xt: K.ticks([0, 100, 200, 300, 400, 500, 600]), yt: [], fs: 17, xl: 'total atomization energy (kcal/mol)' });
    const gap = (S.h - 90) / mols.length, bh = gap * 0.36;
    let step = 0, t = 0;
    function draw() {
      S.clear(); P.axes(); P.vline(0, C.inkSoft, 1.6);
      mols.forEach((m, k) => {
        const y = 20 + k * gap + gap / 2, hf = L.tae[m].HF, a = Math.min(1, t * 1.5);
        K.label(ctx, Q.mol(m), 106, y + 6, { size: 18, color: C.ink, weight: 650, align: 'right' });
        U.roundRect(ctx, P.X(0), y - bh - 1, (P.X(W4[m]) - P.X(0)) * a, bh, 4, rgba(C.navy, 0.85));
        if (step >= 1) { const x1 = P.X(hf * a); U.roundRect(ctx, Math.min(P.X(0), x1), y + 1, Math.abs(x1 - P.X(0)), bh, 4, hf < 0 ? C.coral : Q.col('HF')); if (a >= 1) K.label(ctx, `${Math.round(100 * hf / W4[m])}%`, Math.max(P.X(W4[m]), x1) + 8, y + 6, { size: 16, color: hf < 0 ? '#B4492F' : C.inkSoft, weight: 650 }); }
      });
      K.legend(ctx, P.X(380), S.h - 170, [{ label: 'exact (W4-11)', color: rgba(C.navy, 0.85), kind: 'sq' }].concat(step >= 1 ? [{ label: 'Hartree–Fock', color: Q.col('HF'), kind: 'sq' }] : []), { size: 18, vertical: true });
    }
    return { draw, step(s) { step = s; if (s >= 1) t = 0; draw(); }, enter() { t = 0; }, frame(dt) { if (t < 1) { t += dt; draw(); } }, ff: 1 };
  };

  // =====================================================================================
  // N2 dissociation in 6-31G (frozen 1s): single-reference methods vs CASSCF, NEVPT2 and full CI
  // builds: 0 RHF + FCI, 1 MP2/CCSD/CCSD(T), 2 CASSCF/NEVPT2
  // =====================================================================================
  ANIMS.n2 = function (S, o) {
    const ctx = S.ctx, D = Q.D().curves; if (!D || !D.N2) return { draw: () => Q.pending(S, 'N₂ curve') };
    const rows = D.N2.rows, R = rows.map(r => r.R * 0.529177), e0 = Math.min(...rows.map(r => r.FCI));
    const P = K.plot(ctx, { x: 100, y: 24, w: S.w - 300, h: S.h - 110 }, { x: [0.8, 3.5], y: [-0.25, 0.75], xt: K.ticks([1, 1.5, 2, 2.5, 3, 3.5]), yt: [-0.2, 0, 0.2, 0.4, 0.6].map(v => ({ v, l: v.toFixed(1) })), xl: 'N–N distance (Å)', fs: 18 });
    const sets = [['RHF', 0, Q.col('RHF')], ['FCI', 0, C.ink], ['MP2', 1, Q.col('MP2')], ['CCSD', 1, Q.col('CCSD')], ['CCSD(T)', 1, '#E0A030'], ['CASSCF', 2, Q.col('CASSCF')], ['NEVPT2', 2, '#2A9D8F']];
    let step = 0;
    function draw() {
      S.clear(); P.axes(); P.hline(0, rgba(C.ink, 0.3), 1.2, [4, 4]);
      K.label(ctx, 'energy relative to the full-CI minimum (hartree)', 106, 16, { size: 18, color: C.muted });
      ctx.save(); P.clip();
      sets.forEach(([k, s, c]) => { if (s > step) return; const xs = [], ys = []; rows.forEach((r, i) => { if (r[k] !== null && r[k] !== undefined) { xs.push(R[i]); ys.push(r[k] - e0); } }); P.line(xs, ys, c, k === 'FCI' ? 3.6 : 2.6, k === 'FCI' ? null : (s === 2 ? [8, 5] : null)); });
      ctx.restore();
      let ly = 60; sets.forEach(([k, s, c]) => { if (s > step) return; K.legend(ctx, S.w - 180, ly, [{ label: k === 'FCI' ? 'full CI' : k, color: c, kind: s === 2 ? 'dash' : 'line' }], { size: 19 }); ly += 32; });
    }
    return { draw, step(s) { step = s; draw(); } };
  };
})();
