/* Opening figures: the shell structure of the noble gases (hero), the exponential wall, and a century of
   approximations (timeline). */
(function () {
  'use strict';
  const { C, rgba } = U;

  // =====================================================================================
  // Hero: radial electron density of He, Ne, Ar, Kr, Xe from Hartree-Fock (js/qc engine), drawn as electrons per
  // unit ln r, so every shell shows up as a peak. Cycles through the atoms, morphing between them.
  // =====================================================================================
  ANIMS.heroShells = function (S, o) {
    const ctx = S.ctx, A = Q.D().atoms;
    if (!A) return { draw: () => Q.pending(S, 'atoms') };
    const names = ['He', 'Ne', 'Ar', 'Kr', 'Xe'], SHELL = ['K', 'L', 'M', 'N', 'O'];
    const curves = names.map(s => { const d = A.noble[s]; const y = d.y.map((v, i) => v * d.r[i]); const m = Math.max(...y); return { s, Z: d.Z, E: d.E, r: d.r, y: y.map(v => v / m) }; });
    const ymax = 1;
    const P = K.plot(ctx, { x: 70, y: 40, w: S.w - 100, h: S.h - 150 }, { x: [0.005, 8], y: [0, ymax * 1.08], logx: true, xt: K.ticks([0.01, 0.1, 1, 10].filter(v => v <= 8), v => String(v)), yt: [], fs: 18, xl: 'distance from the nucleus  r  (bohr, log scale)' });
    let t = 0;
    function peaks(c) { const out = []; for (let i = 2; i < c.y.length - 2; i++) if (c.y[i] > c.y[i - 1] && c.y[i] >= c.y[i + 1] && c.y[i] > 0.06) out.push(i); return out; }
    function draw() {
      S.clear(); P.axes();
      const per = 3.2, k = Math.floor(t / per) % names.length, f = K.smooth(((t % per) - 2.4) / 0.8), k2 = (k + 1) % names.length;
      const a = curves[k], b = curves[k2], mixc = (i) => a.y[i] + (b.y[i] - a.y[i]) * (k2 === 0 ? 0 : f);
      const n = a.r.length;
      ctx.save(); ctx.beginPath(); ctx.moveTo(P.X(a.r[0]), P.Y(0));
      for (let i = 0; i < n; i++) ctx.lineTo(P.X(a.r[i]), P.Y(mixc(i)));
      ctx.lineTo(P.X(a.r[n - 1]), P.Y(0)); ctx.closePath();
      const g = ctx.createLinearGradient(P.X(0.005), 0, P.X(8), 0); g.addColorStop(0, rgba(C.navy, 0.75)); g.addColorStop(0.55, rgba(C.teal, 0.6)); g.addColorStop(1, rgba(C.violet, 0.45));
      ctx.fillStyle = g; ctx.fill(); ctx.restore();
      P.line(a.r, a.r.map((_, i) => mixc(i)), C.navy, 2.6);
      const cur = f < 0.5 || k2 === 0 ? a : b;
      if (f < 0.05 || f > 0.95) peaks(cur).forEach((i, j) => K.label(ctx, SHELL[j] || '', P.X(cur.r[i]), P.Y(cur.y[i]) - 14, { size: 20, color: C.navy, weight: 750, align: 'center', halo: C.bg }));
      K.label(ctx, cur.s, S.w - 40, 96, { size: 64, color: C.navy, weight: 760, align: 'right' });
      K.label(ctx, `Z = ${cur.Z}  ·  Hartree–Fock energy ${cur.E.toFixed(3)} E_h`, S.w - 40, 132, { size: 19, color: C.inkSoft, align: 'right' });
      K.label(ctx, 'electrons per unit ln r (scaled to the largest peak)', 76, 26, { size: 18, color: C.muted });
    }
    return { frame(dt) { t += dt; draw(); }, draw, ff: 0.5 };
  };

  // =====================================================================================
  // The exponential wall: how many numbers a many-electron wavefunction needs.
  //   grid: 3^(3N) to 10^(3N) values (Kohn 1999: about 10^150 for N = 100 at p = 3)
  //   full CI in a small basis: binom(5N/2 ... ) determinants (M = 5 orbitals per electron pair... see notes)
  // builds: 0 grid band, 1 full CI, 2 reference lines and records
  // =====================================================================================
  ANIMS.wall = function (S, o) {
    const ctx = S.ctx;
    const P = K.plot(ctx, { x: 120, y: 30, w: S.w - 170, h: S.h - 110 }, { x: [0, 100], y: [0, 160], xt: K.ticks([0, 20, 40, 60, 80, 100]), yt: [0, 20, 40, 60, 80, 100, 120, 140, 160].map(v => ({ v, l: '10^' + v })), xl: 'number of electrons N', fs: 18 });
    const lgC = (n, k) => { let s = 0; for (let i = 0; i < k; i++) s += Math.log10((n - i) / (i + 1)); return s; };
    const Ns = Array.from({ length: 101 }, (_, i) => i);
    const fci = Ns.map(N => { const M = 5 * Math.max(1, N) / 2 | 0, na = Math.ceil(N / 2), nb = Math.floor(N / 2); return N < 2 ? 0 : lgC(Math.max(M, na), na) + lgC(Math.max(M, nb), nb); });
    let step = 0, t = 0;
    const marks = [['H₂', 2], ['H₂O', 10], ['benzene', 42], ['caffeine (102)', 100]];
    function draw() {
      S.clear(); P.axes();
      const reveal = Math.min(100, t * 60);
      // grid band p = 3 .. 10 points per coordinate
      ctx.save(); ctx.beginPath();
      for (let N = 0; N <= reveal; N++) ctx.lineTo(P.X(N), P.Y(Math.min(160, 3 * N)));
      for (let N = Math.floor(reveal); N >= 0; N--) ctx.lineTo(P.X(N), P.Y(Math.min(160, 3 * N * Math.log10(3))));
      ctx.closePath(); ctx.fillStyle = rgba(C.coral, 0.16); ctx.fill(); ctx.restore();
      P.line(Ns.filter(N => N <= reveal), Ns.filter(N => N <= reveal).map(N => Math.min(160, 3 * N * Math.log10(3))), C.coral, 2.6);
      K.label(ctx, 'values on a grid, 3–10 points per coordinate', P.X(44), P.Y(120), { size: 19, color: '#B4492F', weight: 650, halo: '#F8E1D8' });
      if (step >= 1) {
        const xs = Ns.filter(N => N >= 2 && N <= reveal); P.line(xs, xs.map(N => fci[N]), C.navy, 3);
        K.label(ctx, 'full CI, 5 orbitals per electron pair: determinants', P.X(46), P.Y(fci[60]) + 30, { size: 19, color: C.navy, weight: 650 });
      }
      if (step >= 2) {
        P.hline(80, C.violet, 2, [7, 5]); K.label(ctx, 'atoms in the observable universe ≈ 10^80', P.X(64), P.Y(80) - 10, { size: 18, color: C.violet, weight: 650 });
        P.hline(Math.log10(1.31e12), C.teal, 2, [7, 5]); K.label(ctx, 'largest full CI (2024): 1.3 × 10^12 determinants', P.X(43), P.Y(12) - 10, { size: 18, color: C.tealDark, weight: 650 });
        marks.forEach(([n, N]) => { const x = P.X(N); ctx.save(); ctx.strokeStyle = rgba(C.ink, 0.25); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, P.Y(0)); ctx.lineTo(x, P.Y(160)); ctx.stroke(); ctx.restore(); K.label(ctx, n, N > 90 ? x - 6 : x + 6, P.Y(150), { size: 18, color: C.ink, weight: 650, align: N > 90 ? 'right' : 'left' }); });
      }
    }
    return { draw, step(s) { step = s; draw(); }, enter() { t = 0; }, frame(dt) { if (t * 60 < 100) { t += dt; draw(); } }, ff: 2 };
  };

  // =====================================================================================
  // A century of approximations: four lanes, a cursor from 1926 to 2026 (about 12 s).
  // =====================================================================================
  const LANES = [
    { k: 'wf', name: 'Wavefunctions', col: '#1D3A5F' }, { k: 'dft', name: 'Density functionals', col: '#2A9D8F' },
    { k: 'tool', name: 'Basis sets & codes', col: '#C8692E' }, { k: 'ml', name: 'Machine learning', col: '#6B5E9B' }];
  const EV = [
    ['wf', 1926, 'Schrödinger', 'Schrödinger\'s equation: exact for hydrogen, unsolvable for almost everything else.'],
    ['wf', 1927, 'Heitler–London', 'Heitler & London explain the H₂ bond (Sugiura: 3.2 eV vs 4.4 eV observed).'],
    ['wf', 1928, 'Hartree SCF', 'Hartree\'s self-consistent field, found "by successive approximation".'],
    ['wf', 1929, 'Hylleraas He', 'Hylleraas puts r₁₂ into the wavefunction: helium to 0.09 per mille.'],
    ['wf', 1930, 'Hartree–Fock', 'Fock and Slater antisymmetrize Hartree\'s method.'],
    ['wf', 1934, 'Møller–Plesset', 'Perturbation theory for the correlation energy.'],
    ['wf', 1959, 'Correlation energy', 'Löwdin defines the correlation energy: exact minus Hartree–Fock.'],
    ['wf', 1966, 'Coupled clusters', 'Čížek brings the exponential ansatz into chemistry.'],
    ['wf', 1982, 'CCSD', 'Purvis & Bartlett: coupled cluster with singles and doubles.'],
    ['wf', 1989, 'CCSD(T)', 'Raghavachari, Trucks, Pople & Head-Gordon: the "gold standard".'],
    ['wf', 1998, 'Nobel prize', 'Kohn (density functionals) and Pople (computational methods).'],
    ['wf', 2013, 'Local CCSD(T)', 'DLPNO-CCSD(T) on a 644-atom protein (crambin).'],
    ['dft', 1927, 'Thomas–Fermi', 'The first "density only" model of the atom.'],
    ['dft', 1930, 'Dirac exchange', 'Exchange of the uniform electron gas, n^{4/3}.'],
    ['dft', 1951, 'Slater Xα', 'A local stand-in for Hartree–Fock exchange.'],
    ['dft', 1964, 'Hohenberg–Kohn', 'The ground-state density determines everything.'],
    ['dft', 1965, 'Kohn–Sham', 'Non-interacting orbitals with the true density; only E_xc is unknown.'],
    ['dft', 1980, 'Ceperley–Alder', 'Quantum Monte Carlo for the electron gas: LDA correlation.'],
    ['dft', 1988, 'B88 + LYP', 'Gradient corrections that work for molecules.'],
    ['dft', 1993, 'Hybrids', 'Becke mixes in exact exchange; B3LYP follows (1994).'],
    ['dft', 1996, 'PBE', 'A GGA built from exact constraints, no fitted parameters.'],
    ['dft', 2001, 'Jacob\'s ladder', 'Perdew & Schmidt organize functionals by their ingredients.'],
    ['dft', 2006, 'DFT-D, B2PLYP', 'Grimme: dispersion corrections and double hybrids.'],
    ['dft', 2015, 'SCAN', 'A meta-GGA obeying all 17 known constraints.'],
    ['tool', 1950, 'Gaussians', 'Boys: Gaussian basis functions make integrals analytic.'],
    ['tool', 1951, 'Roothaan–Hall', 'SCF becomes matrix algebra, FC = SCε.'],
    ['tool', 1969, 'STO-3G', 'Hehre, Stewart & Pople: minimal Gaussian basis.'],
    ['tool', 1970, 'Gaussian 70', 'Pople\'s program makes calculations routine.'],
    ['tool', 1989, 'cc-pVXZ', 'Dunning\'s correlation-consistent basis sets: extrapolate to the limit.'],
    ['tool', 2018, 'PySCF', 'Python-based simulations of chemistry; open source.'],
    ['ml', 2007, 'Behler–Parrinello', 'Neural-network potentials, orders of magnitude faster than DFT.'],
    ['ml', 2012, 'ML functionals', 'Snyder et al.: machine-learned density functionals.'],
    ['ml', 2017, 'SchNet, ANI', 'Deep potentials for molecules.'],
    ['ml', 2020, 'FermiNet', 'Neural-network wavefunctions beat coupled clusters on bond breaking.'],
    ['ml', 2021, 'DM21', 'DeepMind\'s functional trained with fractional charge and spin.'],
    ['ml', 2025, 'OMol25, Skala', '100M+ ωB97M-V calculations; Skala, a deep-learned functional.']
  ];
  ANIMS.timeline = function (S, o) {
    const ctx = S.ctx, x0 = 300, x1 = S.w - 40, Y0 = 1924, Y1 = 2027, top = 40, lane = (S.h - top - 110) / LANES.length;
    const X = (y) => x0 + (y - Y0) / (Y1 - Y0) * (x1 - x0);
    const pos = EV.map(([b, y, n, d]) => { const li = LANES.findIndex(r => r.k === b); return { b, y, n, d, x: X(y), yy: top + li * lane + lane / 2, col: LANES[li].col }; }).sort((a, b) => a.y - b.y);
    (function place() {
      ctx.save(); ctx.font = `600 16px ${U.FONT}`; const used = {};
      for (const p of pos) {
        const w = ctx.measureText(p.n).width, a = p.x - w / 2 - 4, b = p.x + w / 2 + 4; p.lab = null;
        for (const lvl of ['up', 'dn', 'up2', 'dn2']) { const key = p.b + lvl, list = used[key] || (used[key] = []); if (list.every(([u, v]) => b < u || a > v)) { list.push([a, b]); p.lab = lvl; break; } }
      }
      ctx.restore();
    })();
    let cur = Y0;
    function draw() {
      S.clear();
      for (let d = 1930; d <= 2020; d += 10) {
        const x = X(d); ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, top - 10); ctx.lineTo(x, S.h - 92); ctx.stroke(); ctx.restore();
        K.label(ctx, String(d), x, S.h - 66, { size: 18, color: C.inkSoft, align: 'center' });
      }
      LANES.forEach((b, i) => {
        const y = top + i * lane + lane / 2;
        K.label(ctx, b.name, x0 - 26, y + 7, { size: 21, color: b.col, weight: 700, align: 'right' });
        ctx.save(); ctx.strokeStyle = rgba(b.col, 0.25); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(Math.min(x1, X(Math.min(cur, Y1))), y); ctx.stroke(); ctx.restore();
      });
      let latest = null;
      for (const p of pos) {
        if (p.y > cur) continue; latest = p;
        const age = Math.min(1, (cur - p.y) / 1.5), r = 7 + 5 * (1 - age);
        U.circle(ctx, p.x, p.yy, r + 2.5, '#fff'); U.circle(ctx, p.x, p.yy, r, p.col);
        const dy = { up: -16, dn: 30, up2: -38, dn2: 52 }[p.lab];
        if (p.lab) K.label(ctx, p.n, p.x, p.yy + dy, { size: 16, color: C.ink, align: 'center', weight: 600, halo: C.bg, haloW: 5 });
      }
      if (cur < Y1) { const xc = X(cur); ctx.save(); ctx.strokeStyle = rgba(C.ink, 0.45); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xc, top - 14); ctx.lineTo(xc, S.h - 92); ctx.stroke(); ctx.restore(); K.label(ctx, String(Math.floor(cur)), xc, top - 18, { size: 18, color: C.ink, weight: 700, align: 'center' }); }
      if (latest) {
        const w = K.label(ctx, `${latest.y} · ${latest.n}`, 20, S.h - 14, { size: 21, color: latest.col, weight: 750 });
        K.label(ctx, '— ' + latest.d, 20 + w + 12, S.h - 14, { size: 21, color: C.ink });
      }
    }
    function frame(dt) { if (cur < Y1) { cur = Math.min(Y1, cur + dt * 8.5); draw(); } }
    return { frame, draw, enter() { cur = Y0; }, ff: 13 };
  };
})();
