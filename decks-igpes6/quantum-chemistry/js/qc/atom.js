/* atom.js — spherical atoms from first principles: Hartree, Hartree–Fock and Kohn–Sham DFT
   (LDA, GGA, hybrids) with spherically averaged, spin-resolved and possibly fractional shell occupations.
   Orbitals are expanded in even-tempered Gaussian radial functions χ(r) = N r^(l+1) exp(-α r²), so the
   one-electron integrals are analytic and each SCF step is a small generalized eigenproblem per (l, spin).
   Coulomb, exact exchange and exchange-correlation integrals are done on a logarithmic radial grid.
   Checked in tests/check-engines.js against Hartree–Fock limits, NIST LDA atoms and PySCF. Atomic units. */
(function (G) {
'use strict';
const QC = G.QC = G.QC || {};
const PI = Math.PI;

// Γ(x) for integers and half-integers
function gammaHalf(x) {
  if (Math.abs(x - Math.round(x)) < 1e-12) { let g = 1; for (let k = 2; k < Math.round(x); k++) g *= k; return g; }
  let g = Math.sqrt(PI), t = 0.5; while (t < x - 1e-12) { g *= t; t += 1; } return g;
}
// (l1 k l2; 0 0 0)^2
function threeJ0sq(l1, k, l2) {
  const J = l1 + k + l2; if (J % 2 || k < Math.abs(l1 - l2) || k > l1 + l2) return 0;
  const f = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }, g = J / 2;
  const v = f(J - 2 * l1) * f(J - 2 * k) * f(J - 2 * l2) / f(J + 1) * Math.pow(f(g) / (f(g - l1) * f(g - k) * f(g - l2)), 2);
  return v;
}
QC.threeJ0sq = threeJ0sq;

const SYMBOLS = ['', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
  'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn'];
QC.SYMBOLS = SYMBOLS;
// Madelung order; transition-metal exceptions beyond Cr and Cu are not modelled (closed shells and main-group atoms are exact)
const AUFBAU = [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1], [5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2], [6, 1]];
const LNAME = 'spdf';

// Ground-state shells [n, l, Nalpha, Nbeta] with Hund's rule inside each subshell (spherically averaged).
// opts.spin === false puts half the electrons of every shell in each spin channel.
function groundShells(Z, opts = {}) {
  const nel = Z - (opts.charge || 0), occ = new Map();
  let left = nel;
  for (const [n, l] of AUFBAU) { if (left <= 0) break; const c = Math.min(left, 2 * (2 * l + 1)); occ.set(n + ',' + l, c); left -= c; }
  if (nel === Z && (Z === 24 || Z === 29)) { occ.set('4,0', 1); occ.set('3,2', Z === 24 ? 5 : 10); }   // Cr 3d5 4s1, Cu 3d10 4s1
  const shells = [];
  for (const [key, c] of occ) {
    const [n, l] = key.split(',').map(Number), cap = 2 * l + 1;
    let a = Math.min(c, cap), b = c - a;
    if (opts.spin === false) { a = c / 2; b = c / 2; }
    shells.push({ n, l, a, b });
  }
  return shells;
}
QC.groundShells = groundShells;
QC.shellLabel = (s) => `${s.n}${LNAME[s.l]}`;

function makeGrid(N, rmin, rmax) {
  const x0 = Math.log(rmin), h = (Math.log(rmax) - x0) / (N - 1), r = new Float64Array(N), w = new Float64Array(N);
  for (let i = 0; i < N; i++) { r[i] = Math.exp(x0 + i * h); w[i] = h * r[i]; }
  return { N, h, r, w };
}
// ∫_{x_0}^{x_i} g dx, fourth order on a uniform grid
function cumInt(g, h, out) {
  const N = g.length; out[0] = 0;
  out[1] = h / 24 * (9 * g[0] + 19 * g[1] - 5 * g[2] + g[3]);
  for (let i = 1; i < N - 2; i++) out[i + 1] = out[i] + h / 24 * (-g[i - 1] + 13 * g[i] + 13 * g[i + 1] - g[i + 2]);
  out[N - 1] = out[N - 2] + h / 24 * (g[N - 4] - 5 * g[N - 3] + 19 * g[N - 2] + 9 * g[N - 1]);
  return out;
}

const DEF = { beta: 1.6, amin: [0.01, 0.015, 0.03, 0.06], amax: [2e4, 200, 30, 4], N: 1600, rmin: 1e-6, rmax: 80 };
function makeBasis(Z, l, grid, o) {
  const beta = o.beta || DEF.beta, amin = (o.amin || DEF.amin)[l] * (o.diffuse ? 0.25 : 1), amax = (o.amax || DEF.amax)[l] * Z * Z;
  const alpha = []; for (let a = amin; a <= amax * 1.0001; a *= beta) alpha.push(a);
  const nb = alpha.length, N = grid.N, r = grid.r, g32 = gammaHalf(l + 1.5);
  const norm = alpha.map(a => Math.sqrt(2 * Math.pow(2 * a, l + 1.5) / g32));
  const chi = [], dchi = [];
  for (let k = 0; k < nb; k++) {
    const c = new Float64Array(N), d = new Float64Array(N), a = alpha[k];
    for (let i = 0; i < N; i++) { const ri = r[i], v = norm[k] * Math.pow(ri, l + 1) * Math.exp(-a * ri * ri); c[i] = v; d[i] = ((l + 1) / ri - 2 * a * ri) * v; }
    chi.push(c); dchi.push(d);
  }
  const S = new Float64Array(nb * nb), T = new Float64Array(nb * nb), V = new Float64Array(nb * nb), gl1 = gammaHalf(l + 1);
  for (let m = 0; m < nb; m++) for (let n = 0; n < nb; n++) {
    const p = alpha[m] + alpha[n], NN = norm[m] * norm[n];
    S[m * nb + n] = NN * g32 / (2 * Math.pow(p, l + 1.5));
    T[m * nb + n] = NN * (2 * l + 3) * g32 * alpha[m] * alpha[n] / (2 * Math.pow(p, l + 2.5));
    V[m * nb + n] = -Z * NN * gl1 / (2 * Math.pow(p, l + 1));
  }
  return { l, nb, alpha, chi, dchi, S, T, V, orth: QC.orthogonalizer(S, nb, 1e-11) };
}

/* Run an SCF. opts: { Z, xc: key of QC.functionals (default 'lda'), shells, spin (default true),
   charge, basis options (beta, amin, amax, diffuse), grid (N, rmin, rmax), maxIter, tol, exactExchange (also
   evaluate E_x^HF on the final orbitals) }. */
function atom(opts) {
  const Z = opts.Z, fun = typeof opts.xc === 'object' ? opts.xc : QC.functionals[opts.xc || 'lda'];
  if (!fun) throw new Error('unknown functional ' + opts.xc);
  const shells = (opts.shells || groundShells(Z, opts)).map(s => ({ n: s.n, l: s.l, a: s.a, b: s.b }));
  const restricted = shells.every(s => Math.abs(s.a - s.b) < 1e-14);
  const spins = restricted ? 1 : 2;
  const grid = makeGrid(opts.N || DEF.N, opts.rmin || DEF.rmin, opts.rmax || DEF.rmax), N = grid.N, r = grid.r, w = grid.w, h = grid.h;
  const lmax = Math.max(...shells.map(s => s.l));
  const B = [];
  for (let l = 0; l <= lmax; l++) B.push(makeBasis(Z, l, grid, opts));
  const byL = B.map(() => []);
  shells.forEach(s => byL[s.l].push(s));
  byL.forEach(arr => arr.sort((p, q) => p.n - q.n));
  byL.forEach((arr, l) => arr.forEach((s, k) => { if (s.n !== l + 1 + k) throw new Error('shells must be filled from the lowest n for each l'); }));
  const ax = fun.ax, gga = fun.gga;
  const nelA = shells.reduce((t, s) => t + s.a, 0), nelB = shells.reduce((t, s) => t + s.b, 0);

  // state
  const F = [], C = [], eps = [];
  for (let s = 0; s < spins; s++) { F.push(B.map(b => Float64Array.from(b.T).map((v, i) => v + b.V[i]))); C.push([]); eps.push([]); }
  const P = [], dP = [];           // radial orbitals per spin per shell
  const rhoS = [new Float64Array(N), new Float64Array(N)], drhoS = [new Float64Array(N), new Float64Array(N)];
  const VH = new Float64Array(N), tmp1 = new Float64Array(N), tmp2 = new Float64Array(N), cum1 = new Float64Array(N), cum2 = new Float64Array(N);
  const RP = [], RM = [];            // r^k and r^-k, k = 0 .. 2 lmax + 1
  for (let k = 0; k <= 2 * lmax + 2; k++) { RP.push(Float64Array.from(r, v => Math.pow(v, k))); RM.push(Float64Array.from(r, v => Math.pow(v, -k))); }
  const diis = QC.makeDIIS(8);
  let E = 0, Eold = 0, comps = null, conv = false, it = 0, errMax = 0, xcOut = null;
  const occ = (s, sp) => (spins === 1 ? (s.a + s.b) / 2 : sp === 0 ? s.a : s.b);   // electrons of this spin in shell s

  function orbitals() {
    for (let sp = 0; sp < spins; sp++) {
      P[sp] = []; dP[sp] = [];
      for (let l = 0; l <= lmax; l++) {
        const sol = QC.genEig(F[sp][l], B[l].orth); C[sp][l] = sol; eps[sp][l] = sol.e;
        const nb = B[l].nb, m = sol.m;
        byL[l].forEach((s, k) => {
          const p = new Float64Array(N), d = new Float64Array(N);
          for (let mu = 0; mu < nb; mu++) { const c = sol.C[mu * m + k]; if (c === 0) continue; const ch = B[l].chi[mu], dch = B[l].dchi[mu]; for (let i = 0; i < N; i++) { p[i] += c * ch[i]; d[i] += c * dch[i]; } }
          // sign convention: positive near the nucleus
          let sgn = 0; for (let i = 0; i < N && !sgn; i++) if (Math.abs(p[i]) > 1e-12) sgn = Math.sign(p[i]);
          if (sgn < 0) { for (let i = 0; i < N; i++) { p[i] = -p[i]; d[i] = -d[i]; } for (let mu = 0; mu < nb; mu++) sol.C[mu * m + k] *= -1; }
          s['P' + sp] = p; s['dP' + sp] = d; s['C' + sp] = sol; s['k'] = k;
        });
      }
    }
  }
  function densities() {
    for (let sp = 0; sp < 2; sp++) { rhoS[sp].fill(0); drhoS[sp].fill(0); }
    for (const s of shells) for (let sp = 0; sp < 2; sp++) {
      const nocc = sp === 0 ? s.a : s.b; if (!nocc) continue;
      const q = spins === 1 ? 0 : sp, p = s['P' + q], d = s['dP' + q], rr = rhoS[sp], dr = drhoS[sp];
      for (let i = 0; i < N; i++) { rr[i] += nocc * p[i] * p[i]; dr[i] += 2 * nocc * p[i] * d[i]; }
    }
  }
  function hartree() {
    for (let i = 0; i < N; i++) { const t = rhoS[0][i] + rhoS[1][i]; tmp1[i] = t * r[i]; tmp2[i] = t; }
    cumInt(tmp1, h, cum1); cumInt(tmp2, h, cum2);
    const tot2 = cum2[N - 1];
    for (let i = 0; i < N; i++) VH[i] = cum1[i] / r[i] + (tot2 - cum2[i]);
  }
  // exchange-correlation on the grid: returns energy and fills per-spin local potential pieces
  function xcTerms() {
    const na = new Float64Array(N), nb = new Float64Array(N), saa = new Float64Array(N), sab = new Float64Array(N), sbb = new Float64Array(N), da = new Float64Array(N), db = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const f = 1 / (4 * PI * r[i] * r[i]);
      na[i] = Math.max(0, rhoS[0][i] * f); nb[i] = Math.max(0, rhoS[1][i] * f);
      da[i] = (drhoS[0][i] - 2 * rhoS[0][i] / r[i]) * f; db[i] = (drhoS[1][i] - 2 * rhoS[1][i] / r[i]) * f;
      saa[i] = da[i] * da[i]; sab[i] = da[i] * db[i]; sbb[i] = db[i] * db[i];
    }
    const out = QC.evalXC(fun, na, nb, saa, sab, sbb, spins === 2);
    let Exc = 0; for (let i = 0; i < N; i++) Exc += w[i] * 4 * PI * r[i] * r[i] * out.e[i];
    out.Exc = Exc; out.na = na; out.nb = nb; out.da = da; out.db = db;
    return out;
  }
  function localMatrix(l, U, g) {        // ∫ [U χμχν + g(χμ'χν + χμχν' − 2χμχν/r)] dr
    const b = B[l], nb = b.nb, M = new Float64Array(nb * nb), A = new Float64Array(N), Bg = g ? new Float64Array(N) : null;
    for (let i = 0; i < N; i++) { A[i] = w[i] * (U[i] - (g ? 2 * g[i] / r[i] : 0)); if (g) Bg[i] = w[i] * g[i]; }
    const t1 = new Float64Array(N), t2 = new Float64Array(N);
    for (let m = 0; m < nb; m++) {
      const cm = b.chi[m], dm = b.dchi[m];
      for (let i = 0; i < N; i++) { t1[i] = A[i] * cm[i] + (g ? Bg[i] * dm[i] : 0); if (g) t2[i] = Bg[i] * cm[i]; }
      for (let n = m; n < nb; n++) {
        const cn = b.chi[n], dn = b.dchi[n]; let s = 0;
        if (g) for (let i = 0; i < N; i++) s += cn[i] * t1[i] + dn[i] * t2[i];
        else for (let i = 0; i < N; i++) s += cn[i] * t1[i];
        M[m * nb + n] = M[n * nb + m] = s;
      }
    }
    return M;
  }
  // exact (Hartree–Fock) exchange matrix for angular momentum l and spin sp
  function exchangeMatrix(l, sp) {
    const b = B[l], nb = b.nb, K = new Float64Array(nb * nb), Zf = new Float64Array(N), g1 = new Float64Array(N), g2 = new Float64Array(N), c1 = new Float64Array(N), c2 = new Float64Array(N), T = new Float64Array(N);
    for (const s of shells) {
      const nocc = spins === 1 ? (s.a + s.b) / 2 : (sp === 0 ? s.a : s.b); if (!nocc) continue;
      const Pb = s['P' + (spins === 1 ? 0 : sp)];
      for (let k = Math.abs(l - s.l); k <= l + s.l; k += 2) {
        const coef = threeJ0sq(l, k, s.l); if (!coef) continue;
        for (let nu = 0; nu < nb; nu++) {
          const cv = b.chi[nu];
          const pk1 = RP[k + 1], mk = RM[k], mk1 = RM[k + 1], pk = RP[k];
          for (let i = 0; i < N; i++) { const f = cv[i] * Pb[i]; g1[i] = pk1[i] * f; g2[i] = f * mk[i]; }
          cumInt(g1, h, c1); cumInt(g2, h, c2);
          const t2 = c2[N - 1];
          for (let i = 0; i < N; i++) { Zf[i] = c1[i] * mk1[i] + (t2 - c2[i]) * pk[i]; T[i] = w[i] * Pb[i] * Zf[i]; }
          const fac = nocc * coef;
          for (let mu = 0; mu < nb; mu++) { const cm = b.chi[mu]; let sum = 0; for (let i = 0; i < N; i++) sum += cm[i] * T[i]; K[mu * nb + nu] += fac * sum; }
        }
      }
    }
    for (let m = 0; m < nb; m++) for (let n = 0; n < m; n++) { const v = 0.5 * (K[m * nb + n] + K[n * nb + m]); K[m * nb + n] = K[n * nb + m] = v; }
    return K;
  }
  const quad = (M, sol, k, nb) => { const m = sol.m; let s = 0; for (let i = 0; i < nb; i++) { const ci = sol.C[i * m + k]; if (!ci) continue; let t = 0; for (let j = 0; j < nb; j++) t += M[i * nb + j] * sol.C[j * m + k]; s += ci * t; } return s; };

  function build() {
    densities(); hartree();
    xcOut = xcTerms();
    let Ekin = 0, Enuc = 0, ExHF = 0;
    const Kmats = [];
    for (let sp = 0; sp < spins; sp++) { Kmats.push([]); for (let l = 0; l <= lmax; l++) Kmats[sp].push(ax ? exchangeMatrix(l, sp) : null); }
    for (const s of shells) for (let sp = 0; sp < spins; sp++) {
      const nocc = spins === 1 ? s.a + s.b : (sp === 0 ? s.a : s.b); if (!nocc) continue;
      const sol = s['C' + sp], b = B[s.l];
      Ekin += nocc * quad(b.T, sol, s.k, b.nb); Enuc += nocc * quad(b.V, sol, s.k, b.nb);
      if (ax) ExHF += -0.5 * nocc * quad(Kmats[sp][s.l], sol, s.k, b.nb) * (spins === 1 ? 1 : 1);
    }
    let EH = 0; for (let i = 0; i < N; i++) EH += 0.5 * w[i] * (rhoS[0][i] + rhoS[1][i]) * VH[i];
    const Etot = Ekin + Enuc + EH + xcOut.Exc + ax * ExHF;
    // new Fock matrices
    const newF = [], errs = [];
    for (let sp = 0; sp < spins; sp++) {
      const U = new Float64Array(N), g = gga ? new Float64Array(N) : null, v = sp === 0 ? xcOut.va : xcOut.vb;
      for (let i = 0; i < N; i++) {
        U[i] = VH[i] + v[i];
        if (gga) g[i] = sp === 0 ? 2 * xcOut.gaa[i] * xcOut.da[i] + xcOut.gab[i] * xcOut.db[i] : 2 * xcOut.gbb[i] * xcOut.db[i] + xcOut.gab[i] * xcOut.da[i];
      }
      newF.push([]);
      for (let l = 0; l <= lmax; l++) {
        const b = B[l], nb = b.nb, M = localMatrix(l, U, g), Fl = new Float64Array(nb * nb), K = Kmats[sp][l];
        for (let i = 0; i < nb * nb; i++) Fl[i] = b.T[i] + b.V[i] + M[i] - (K ? ax * K[i] : 0);
        newF[sp].push(Fl);
        // DIIS error FDS − SDF with D from the current orbitals of this (l, spin)
        const D = new Float64Array(nb * nb), sol = C[sp][l], m = sol.m;
        byL[l].forEach((s) => { const nocc = occ(s, sp) || 1e-3; for (let i = 0; i < nb; i++) { const ci = sol.C[i * m + s.k]; for (let j = 0; j < nb; j++) D[i * nb + j] += nocc * ci * sol.C[j * m + s.k]; } });
        const FD = mul(Fl, D, nb), FDS = mul(FD, b.S, nb), err = new Float64Array(nb * nb);
        for (let i = 0; i < nb; i++) for (let j = 0; j < nb; j++) err[i * nb + j] = FDS[i * nb + j] - FDS[j * nb + i];
        errs.push(err);
      }
    }
    comps = { Ekin, Enuc, EH, Exc: xcOut.Exc, ExHF, ax };
    return { Etot, newF, errs };
  }
  function mul(A, Bm, n) { const R = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i * n + k]; if (!a) continue; for (let j = 0; j < n; j++) R[i * n + j] += a * Bm[k * n + j]; } return R; }
  const flat = (Fs) => { let len = 0; Fs.forEach(a => a.forEach(m => { len += m.length; })); const v = new Float64Array(len); let o = 0; Fs.forEach(a => a.forEach(m => { v.set(m, o); o += m.length; })); return v; };
  const flatE = (es) => { let len = 0; es.forEach(m => { len += m.length; }); const v = new Float64Array(len); let o = 0; es.forEach(m => { v.set(m, o); o += m.length; }); return v; };
  function unflat(v) { let o = 0; for (let sp = 0; sp < spins; sp++) for (let l = 0; l <= lmax; l++) { const n = B[l].nb * B[l].nb; F[sp][l] = v.slice(o, o + n); o += n; } }

  const maxIter = opts.maxIter || 120, tol = opts.tol || 1e-9;
  for (it = 1; it <= maxIter; it++) {
    orbitals();
    const { Etot, newF, errs } = build();
    E = Etot;
    errMax = 0; errs.forEach(e => { for (let i = 0; i < e.length; i++) errMax = Math.max(errMax, Math.abs(e[i])); });
    if (opts.onIter) opts.onIter(it, E, errMax);
    if (it > 1 && Math.abs(E - Eold) < tol && errMax < Math.max(1e-6, Math.sqrt(tol))) { conv = true; break; }
    Eold = E;
    const vF = flat(newF);
    if (it < 3) { const old = flat(F); for (let i = 0; i < vF.length; i++) vF[i] = 0.5 * vF[i] + 0.5 * old[i]; unflat(vF); }
    else { diis.push(vF, flatE(errs)); unflat(diis.extrapolate()); }
  }
  // results
  const res = { Z, symbol: SYMBOLS[Z] || 'Z' + Z, xc: opts.xc || 'lda', functional: fun.name, E, converged: conv, iterations: it, error: errMax, ...comps, nelA, nelB };
  res.virial = -(res.E - res.Ekin) / res.Ekin;
  res.shells = shells.map(s => {
    const e = [];
    for (let sp = 0; sp < spins; sp++) e.push(s['C' + sp].e[s.k]);
    return { label: QC.shellLabel(s), n: s.n, l: s.l, a: s.a, b: s.b, epsA: e[0], epsB: spins === 2 ? e[1] : e[0] };
  });
  // HOMO: highest occupied orbital energy (over spins)
  let homo = -Infinity; res.shells.forEach(s => { if (s.a > 1e-9) homo = Math.max(homo, s.epsA); if (s.b > 1e-9) homo = Math.max(homo, s.epsB); });
  res.homo = homo;
  res.r = grid.r; res.w = grid.w;
  res.rho = Float64Array.from(rhoS[0], (v, i) => v + rhoS[1][i]);          // radial charge density 4πr² n(r)
  res.rhoA = Float64Array.from(rhoS[0]); res.rhoB = Float64Array.from(rhoS[1]);
  res.vxcA = xcOut.va; res.vxcB = xcOut.vb; res.VH = Float64Array.from(VH);
  res.orbitals = shells.map(s => ({ label: QC.shellLabel(s), P: s.P0 }));
  // evaluate other functionals (or exact exchange) on this density without iterating
  res.evalFunctional = (key) => {
    const f2 = typeof key === 'object' ? key : QC.functionals[key];
    const na = xcOut.na, nb2 = xcOut.nb, out = QC.evalXC(f2, na, nb2, xcOut.da.map(v => v * v), Float64Array.from(xcOut.da, (v, i) => v * xcOut.db[i]), xcOut.db.map(v => v * v), true);
    let e = 0; for (let i = 0; i < N; i++) e += w[i] * 4 * PI * r[i] * r[i] * out.e[i];
    return e;
  };
  res.exactExchange = () => {
    let Ex = 0;
    for (let sp = 0; sp < spins; sp++) for (let l = 0; l <= lmax; l++) {
      const K = exchangeMatrix(l, sp), b = B[l];
      byL[l].forEach(s => { const nocc = spins === 1 ? s.a + s.b : (sp === 0 ? s.a : s.b); if (nocc) Ex += -0.5 * nocc * quad(K, s['C' + sp], s.k, b.nb); });
    }
    return Ex;
  };
  return res;
}
QC.atom = atom;
})(typeof window !== 'undefined' ? window : globalThis);
