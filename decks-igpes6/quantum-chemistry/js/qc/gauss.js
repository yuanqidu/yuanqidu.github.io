/* gauss.js — a minimal molecular engine for two-electron molecules (H2, HeH+) in s-type Gaussian basis sets:
   analytic integrals (Szabo & Ostlund, Appendix A), restricted and unrestricted Hartree–Fock, and full CI.
   Small enough to read, exact enough to test against PySCF; it powers the H2 dissociation demos. Atomic units. */
(function (G) {
'use strict';
const QC = G.QC = G.QC || {};
const PI = Math.PI;

// contracted s functions: exponents and coefficients for unit Slater exponent, scaled by zeta^2 (STO-nG)
const STO3G_C = [0.15432897, 0.53532814, 0.44463454];
const BASIS = {
  'STO-3G': { H: [{ a: [3.42525091, 0.62391373, 0.16885540], c: STO3G_C }], He: [{ a: [6.36242139, 1.15892300, 0.31364979], c: STO3G_C }] },
  '6-31G': {
    H: [{ a: [18.731137, 2.8253937, 0.6401217], c: [0.0334946, 0.23472695, 0.81375733] }, { a: [0.1612778], c: [1] }],
    He: [{ a: [38.421634, 5.77803, 1.241774], c: [0.04013973935, 0.261246097, 0.7931846246] }, { a: [0.297964], c: [1] }]
  }
};
QC.sBasis = BASIS;

function boysF0(t) { return t < 1e-12 ? 1 - t / 3 : 0.5 * Math.sqrt(PI / t) * erf(Math.sqrt(t)); }
// erf with ~1e-15 relative accuracy (continued fraction / series)
function erf(x) {
  if (x < 0) return -erf(-x);
  if (x < 2.5) { let s = x, t = x, k = 0; const x2 = x * x; do { k++; t *= -x2 / k; s += t / (2 * k + 1); } while (Math.abs(t) > 1e-17 * Math.abs(s)); return 2 / Math.sqrt(PI) * s; }
  // erfc continued fraction (Lentz)
  let f = x, C = x, D = 0;
  for (let k = 1; k < 200; k++) { const a = k / 2; D = x + a * D; D = 1 / D; C = x + a / C; const d = C * D; f *= d; if (Math.abs(d - 1) < 1e-16) break; }
  return 1 - Math.exp(-x * x) / Math.sqrt(PI) / f;
}
QC.erf = erf;

// normalized primitive s Gaussian (2a/π)^(3/4) exp(-a r²); contracted functions keep the STO-nG coefficients
function buildBasis(atoms, name) {
  const fns = [];
  atoms.forEach((at, ia) => (BASIS[name][at.el] || []).forEach(sh => {
    const prims = sh.a.map((a, k) => ({ a, c: sh.c[k] * Math.pow(2 * a / PI, 0.75) }));
    // renormalize the contraction
    let s = 0; for (const p of prims) for (const q of prims) s += p.c * q.c * Math.pow(PI / (p.a + q.a), 1.5);
    prims.forEach(p => { p.c /= Math.sqrt(s); });
    fns.push({ center: at.pos, atom: ia, prims });
  }));
  return fns;
}
const d2 = (A, B) => (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2 + (A[2] - B[2]) ** 2;

function integrals(atoms, fns) {
  const n = fns.length, S = new Float64Array(n * n), T = new Float64Array(n * n), V = new Float64Array(n * n), ERI = new Float64Array(n * n * n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const A = fns[i].center, B = fns[j].center, AB2 = d2(A, B);
    let s = 0, t = 0, v = 0;
    for (const p of fns[i].prims) for (const q of fns[j].prims) {
      const g = p.a + q.a, mu = p.a * q.a / g, K = Math.exp(-mu * AB2), cc = p.c * q.c;
      const sp = Math.pow(PI / g, 1.5) * K;
      s += cc * sp; t += cc * mu * (3 - 2 * mu * AB2) * sp;
      const P = [0, 1, 2].map(k => (p.a * A[k] + q.a * B[k]) / g);
      for (const at of atoms) v -= cc * at.Z * 2 * PI / g * K * boysF0(g * d2(P, at.pos));
    }
    S[i * n + j] = s; T[i * n + j] = t; V[i * n + j] = v;
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) {
    let e = 0;
    for (const p of fns[i].prims) for (const q of fns[j].prims) {
      const g1 = p.a + q.a, P = [0, 1, 2].map(m => (p.a * fns[i].center[m] + q.a * fns[j].center[m]) / g1), K1 = Math.exp(-p.a * q.a / g1 * d2(fns[i].center, fns[j].center));
      for (const r of fns[k].prims) for (const s of fns[l].prims) {
        const g2 = r.a + s.a, Q = [0, 1, 2].map(m => (r.a * fns[k].center[m] + s.a * fns[l].center[m]) / g2), K2 = Math.exp(-r.a * s.a / g2 * d2(fns[k].center, fns[l].center));
        e += p.c * q.c * r.c * s.c * 2 * Math.pow(PI, 2.5) / (g1 * g2 * Math.sqrt(g1 + g2)) * K1 * K2 * boysF0(g1 * g2 / (g1 + g2) * d2(P, Q));
      }
    }
    ERI[((i * n + j) * n + k) * n + l] = e;
  }
  let Enuc = 0;
  for (let a = 0; a < atoms.length; a++) for (let b = a + 1; b < atoms.length; b++) Enuc += atoms[a].Z * atoms[b].Z / Math.sqrt(d2(atoms[a].pos, atoms[b].pos));
  return { n, S, T, V, ERI, Enuc };
}

// two-electron molecule along z: el1 at 0, el2 at R
function diatomic(el1, el2, R, basis = 'STO-3G') {
  const Zof = { H: 1, He: 2 };
  const atoms = [{ el: el1, Z: Zof[el1], pos: [0, 0, 0] }, { el: el2, Z: Zof[el2], pos: [0, 0, R] }];
  const fns = buildBasis(atoms, basis);
  return Object.assign(integrals(atoms, fns), { atoms, fns, R });
}

/* Hartree–Fock for 2 electrons. type 'RHF' or 'UHF'. UHF starts from a symmetry-broken guess
   (bonding and antibonding orbitals mixed by ±45°), so it can follow the lower, broken-symmetry solution. */
function hf(sys, type = 'RHF', opts = {}) {
  const { n, S, T, V, ERI, Enuc } = sys, H = Float64Array.from(T, (t, i) => t + V[i]), orth = QC.orthogonalizer(S, n);
  const eri = (i, j, k, l) => ERI[((i * n + j) * n + k) * n + l];
  let { C } = QC.genEig(H, orth), m = orth.m;
  const col = (C, k) => Float64Array.from({ length: n }, (_, i) => C[i * m + k]);
  let ca = col(C, 0), cb = col(C, 0);
  if (type === 'UHF' && m > 1) { const c1 = col(C, 1), th = opts.mix === undefined ? PI / 4 : opts.mix; ca = ca.map((v, i) => Math.cos(th) * v + Math.sin(th) * c1[i]); cb = cb.map((v, i) => Math.cos(th) * v - Math.sin(th) * c1[i]); }
  let E = 0, Eold = 1, it = 0;
  const fock = (Ds, Dt) => { const F = Float64Array.from(H); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) s += Dt[k * n + l] * eri(i, j, k, l) - Ds[k * n + l] * eri(i, k, j, l); F[i * n + j] += s; } return F; };
  const dens = (c) => { const D = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) D[i * n + j] = c[i] * c[j]; return D; };
  for (it = 1; it <= 200; it++) {
    const Da = dens(ca), Db = dens(cb), Dt = Da.map((v, i) => v + Db[i]);
    const Fa = fock(Da, Dt), Fb = type === 'RHF' ? Fa : fock(Db, Dt);
    E = Enuc; for (let i = 0; i < n * n; i++) E += 0.5 * (Dt[i] * H[i] + Da[i] * Fa[i] + Db[i] * Fb[i]);
    if (Math.abs(E - Eold) < 1e-12) break;
    Eold = E;
    const sa = QC.genEig(Fa, orth); ca = col(sa.C, 0);
    cb = type === 'RHF' ? ca : col(QC.genEig(Fb, orth).C, 0);
  }
  // <S^2> = 1 - |<a|b>|^2 for one alpha and one beta electron
  let ov = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) ov += ca[i] * S[i * n + j] * cb[j];
  return { E, ca, cb, S2: 1 - ov * ov, iterations: it };
}

// full CI for two electrons (singlet) in the RHF molecular orbitals; returns energies and the CI vector
function fci(sys) {
  const { n, S, T, V, ERI, Enuc } = sys, H = Float64Array.from(T, (t, i) => t + V[i]), orth = QC.orthogonalizer(S, n);
  // canonical RHF orbitals define the CI basis (any orthonormal basis gives the same FCI energy)
  const r = hf(sys, 'RHF'), F = (() => { const D = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) D[i * n + j] = r.ca[i] * r.ca[j]; const Fm = Float64Array.from(H); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) s += D[k * n + l] * (2 * ERI[((i * n + j) * n + k) * n + l] - ERI[((i * n + k) * n + j) * n + l]); Fm[i * n + j] += s; } return Fm; })();
  const { C, m } = QC.genEig(F, orth);
  const h1 = new Float64Array(m * m), g = new Float64Array(m * m * m * m);
  for (let p = 0; p < m; p++) for (let q = 0; q < m; q++) { let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += C[i * m + p] * H[i * n + j] * C[j * m + q]; h1[p * m + q] = s; }
  // transform (pq|rs) with four quarter transformations
  let X = Float64Array.from(ERI), dims = [n, n, n, n];
  for (let ax = 0; ax < 4; ax++) {
    const d = dims.slice(); d[ax] = m; const Y = new Float64Array(d[0] * d[1] * d[2] * d[3]);
    for (let a = 0; a < d[0]; a++) for (let b = 0; b < d[1]; b++) for (let c = 0; c < d[2]; c++) for (let e = 0; e < d[3]; e++) {
      const idx = [a, b, c, e]; let s = 0;
      for (let t = 0; t < n; t++) { const src = idx.slice(); src[ax] = t; s += C[t * m + idx[ax]] * X[((src[0] * dims[1] + src[1]) * dims[2] + src[2]) * dims[3] + src[3]]; }
      Y[((a * d[1] + b) * d[2] + c) * d[3] + e] = s;
    }
    X = Y; dims = d;
  }
  const gg = (p, q, r2, s) => X[((p * m + q) * m + r2) * m + s];
  // singlet spatial configurations (p<=q): |pq> symmetric spatial part
  const cfg = []; for (let p = 0; p < m; p++) for (let q = p; q < m; q++) cfg.push([p, q]);
  const D = cfg.length, Hm = new Float64Array(D * D);
  const norm = (p, q) => (p === q ? 0.5 : Math.SQRT1_2);     // normalization of N(φp φq + φq φp)
  for (let I = 0; I < D; I++) for (let J = I; J < D; J++) {
    const [p, q] = cfg[I], [r2, s] = cfg[J];
    // <pq|H|rs> for symmetric spatial functions ψ = N (φp(1)φq(2) + φq(1)φp(2)) with N = 1/2 (p=q) or 1/√2
    const pairs = (a, b, c, d) => (a === c ? h1[b * m + d] : 0) + (b === d ? h1[a * m + c] : 0) + gg(a, c, b, d);
    let v = pairs(p, q, r2, s) + pairs(p, q, s, r2) + pairs(q, p, r2, s) + pairs(q, p, s, r2);
    v *= norm(p, q) * norm(r2, s);
    Hm[I * D + J] = Hm[J * D + I] = v;
  }
  const { values, vectors } = QC.symEig(Hm, D);
  const vec = Float64Array.from({ length: D }, (_, i) => vectors[i * D]);
  return { E: values[0] + Enuc, EHF: r.E, c: vec, configs: cfg, mo: C, m };
}

QC.h2like = { diatomic, hf, fci, erf, boysF0 };
})(typeof window !== 'undefined' ? window : globalThis);
