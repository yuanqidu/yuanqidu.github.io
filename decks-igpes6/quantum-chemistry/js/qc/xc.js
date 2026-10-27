/* xc.js — exchange-correlation functionals for the atom engine, spin-resolved.
   Each component returns the energy density per volume e(na, nb, saa, sab, sbb), with
   saa = |∇na|², sab = ∇na·∇nb, sbb = |∇nb|². Potentials come from central finite differences
   of the summed energy density (relative step 1e-5), which is accurate to ~1e-10 and keeps the code
   short; every component is checked point by point against Libxc in tests/check-engines.js.
   Rungs: LDA (Slater + VWN5 / PW92 / VWN_RPA), GGA (B88, PBE exchange; LYP, PBE correlation),
   hybrids add a fraction of exact (Hartree–Fock) exchange in atom.js. */
(function (G) {
'use strict';
const QC = G.QC = G.QC || {};
const PI = Math.PI;
const CXS = 0.75 * Math.pow(6 / PI, 1 / 3);           // spin-resolved Slater: e = -CXS (na^4/3 + nb^4/3)
const KF0 = Math.pow(3 * PI * PI, 1 / 3);
const clampz = (z) => (z > 1 ? 1 : z < -1 ? -1 : z);
const fzeta = (z) => (Math.pow(1 + z, 4 / 3) + Math.pow(1 - z, 4 / 3) - 2) / (Math.pow(2, 4 / 3) - 2);
const FPP = 4 / (9 * (Math.cbrt(2) - 1));             // f''(0)

// ---------------- LDA exchange
function slater(na, nb) { return -CXS * (Math.pow(na, 4 / 3) + Math.pow(nb, 4 / 3)); }

// ---------------- PW92 correlation (Perdew & Wang 1992); 'mod' = the extra digits used inside PBE (Libxc LDA_C_PW_MOD)
const PW = {
  orig: { p: [0.031091, 0.21370, 7.5957, 3.5876, 1.6382, 0.49294], f: [0.015545, 0.20548, 14.1189, 6.1977, 3.3662, 0.62517], a: [0.016887, 0.11125, 10.357, 3.6231, 0.88026, 0.49671], fpp: 1.709921 },
  mod: { p: [0.0310907, 0.21370, 7.5957, 3.5876, 1.6382, 0.49294], f: [0.01554535, 0.20548, 14.1189, 6.1977, 3.3662, 0.62517], a: [0.0168869, 0.11125, 10.357, 3.6231, 0.88026, 0.49671], fpp: FPP }
};
function pwG(rs, P) {
  const s = Math.sqrt(rs), A = P[0];
  return -2 * A * (1 + P[1] * rs) * Math.log(1 + 1 / (2 * A * (P[2] * s + P[3] * rs + P[4] * rs * s + P[5] * rs * rs)));
}
function pw92eps(rs, z, V) {
  const ep = pwG(rs, V.p), ef = pwG(rs, V.f), ac = -pwG(rs, V.a), f = fzeta(z), z4 = z * z * z * z;
  return ep + ac * f / V.fpp * (1 - z4) + (ef - ep) * f * z4;
}
function rsOf(n) { return Math.cbrt(3 / (4 * PI * n)); }
function pw92(na, nb) { const n = na + nb; return n > 1e-30 ? n * pw92eps(rsOf(n), clampz((na - nb) / n), PW.orig) : 0; }
function pw92mod(na, nb) { const n = na + nb; return n > 1e-30 ? n * pw92eps(rsOf(n), clampz((na - nb) / n), PW.mod) : 0; }

// ---------------- VWN (Vosko, Wilk & Nusair 1980): form V, and the RPA fit used inside B3LYP (Libxc LDA_C_VWN_RPA)
function vwnF(x, A, x0, b, c) {
  const X = x * x + b * x + c, X0 = x0 * x0 + b * x0 + c, Q = Math.sqrt(4 * c - b * b), at = Math.atan(Q / (2 * x + b));
  return A * (Math.log(x * x / X) + 2 * b / Q * at - b * x0 / X0 * (Math.log((x - x0) * (x - x0) / X) + 2 * (b + 2 * x0) / Q * at));
}
const VWN5 = { p: [0.0310907, -0.10498, 3.72744, 12.9352], f: [0.01554535, -0.32500, 7.06042, 18.0578], a: [-1 / (6 * PI * PI), -0.0047584, 1.13107, 13.0045] };
const VWNRPA = { p: [0.0310907, -0.409286, 13.0720, 42.7198], f: [0.01554535, -0.743294, 20.1231, 101.578] };
function vwn5(na, nb) {
  const n = na + nb; if (n <= 1e-30) return 0;
  const x = Math.sqrt(rsOf(n)), z = clampz((na - nb) / n), f = fzeta(z), z4 = z * z * z * z;
  const ep = vwnF(x, ...VWN5.p), ef = vwnF(x, ...VWN5.f), ac = vwnF(x, ...VWN5.a);
  return n * (ep + ac * f / FPP * (1 - z4) + (ef - ep) * f * z4);
}
function vwnrpa(na, nb) {
  const n = na + nb; if (n <= 1e-30) return 0;
  const x = Math.sqrt(rsOf(n)), z = clampz((na - nb) / n);
  const ep = vwnF(x, ...VWNRPA.p), ef = vwnF(x, ...VWNRPA.f);
  return n * (ep + (ef - ep) * fzeta(z));
}

// ---------------- B88 exchange (Becke 1988): one parameter, beta = 0.0042, fitted to noble-gas exchange energies
function b88s(n, s, beta) {
  if (n <= 1e-30) return 0;
  const n43 = Math.pow(n, 4 / 3), x = Math.sqrt(Math.max(s, 0)) / n43;
  return -CXS * n43 - beta * n43 * x * x / (1 + 6 * beta * x * Math.asinh(x));
}
function b88(na, nb, saa, sab, sbb, beta = 0.0042) { return b88s(na, saa, beta) + b88s(nb, sbb, beta); }

// ---------------- PBE exchange (Perdew, Burke & Ernzerhof 1996), spin-scaled
const PBE_KAPPA = 0.804, PBE_MU = 0.2195149727645171, PBE_BETA = 0.06672455060314922, PBE_GAMMA = (1 - Math.log(2)) / (PI * PI);
function pbexs(n, s) {
  if (n <= 1e-30) return 0;
  const n2 = 2 * n, kf = KF0 * Math.cbrt(n2), ss2 = 4 * Math.max(s, 0) / (4 * kf * kf * n2 * n2);
  const Fx = 1 + PBE_KAPPA - PBE_KAPPA / (1 + PBE_MU * ss2 / PBE_KAPPA);
  return 0.5 * (-0.75 * Math.pow(3 / PI, 1 / 3) * Math.pow(n2, 4 / 3)) * Fx;
}
function pbex(na, nb, saa, sab, sbb) { return pbexs(na, saa) + pbexs(nb, sbb); }

// ---------------- PBE correlation
function pbec(na, nb, saa, sab, sbb) {
  const n = na + nb; if (n <= 1e-30) return 0;
  const z = clampz((na - nb) / n), rs = rsOf(n), ec = pw92eps(rs, z, PW.mod);
  const phi = (Math.pow(1 + z, 2 / 3) + Math.pow(1 - z, 2 / 3)) / 2, phi3 = phi * phi * phi;
  const kf = KF0 * Math.cbrt(n), ks2 = 4 * kf / PI;
  const t2 = Math.max(0, saa + 2 * sab + sbb) / (4 * phi * phi * ks2 * n * n);
  const A = PBE_BETA / PBE_GAMMA / (Math.exp(-ec / (PBE_GAMMA * phi3)) - 1), At2 = A * t2;
  const H = PBE_GAMMA * phi3 * Math.log(1 + PBE_BETA / PBE_GAMMA * t2 * (1 + At2) / (1 + At2 + At2 * At2));
  return n * (ec + H);
}

// ---------------- LYP correlation (Lee, Yang & Parr 1988, in the gradient-only form of Miehlich et al. 1989)
const LYP = { a: 0.04918, b: 0.132, c: 0.2533, d: 0.349 }, CF = 0.3 * Math.pow(3 * PI * PI, 2 / 3);
function lyp(na, nb, saa, sab, sbb) {
  const n = na + nb; if (n <= 1e-30) return 0;
  const { a, b, c, d } = LYP, nm13 = 1 / Math.cbrt(n), dn = 1 + d * nm13;
  const omega = Math.exp(-c * nm13) / dn * Math.pow(n, -11 / 3), delta = c * nm13 + d * nm13 / dn;
  const sig = saa + 2 * sab + sbb;
  const inner = na * nb * (Math.pow(2, 11 / 3) * CF * (Math.pow(na, 8 / 3) + Math.pow(nb, 8 / 3)) + (47 / 18 - 7 * delta / 18) * sig
      - (2.5 - delta / 18) * (saa + sbb) - (delta - 11) / 9 * (na / n * saa + nb / n * sbb))
    - 2 / 3 * n * n * sig + (2 / 3 * n * n - na * na) * sbb + (2 / 3 * n * n - nb * nb) * saa;
  return -a * 4 / dn * na * nb / n - a * b * omega * inner;
}

QC.xcComponents = { slater, pw92, pw92mod, vwn5, vwnrpa, b88, pbex, pbec, lyp };

// Functionals: [component, coefficient] lists, exact-exchange fraction ax, and whether gradients are needed.
const F = {
  hartree: { name: 'Hartree (no exchange or correlation)', parts: [], ax: 0, gga: false, rung: 0 },
  hf: { name: 'Hartree–Fock', parts: [], ax: 1, gga: false, rung: -1 },
  lda: { name: 'LDA (Slater + VWN5)', parts: [[slater, 1], [vwn5, 1]], ax: 0, gga: false, rung: 1 },
  spw92: { name: 'LDA (Slater + PW92)', parts: [[slater, 1], [pw92mod, 1]], ax: 0, gga: false, rung: 1 },
  ldax: { name: 'LDA exchange only', parts: [[slater, 1]], ax: 0, gga: false, rung: 1 },
  pbe: { name: 'PBE', parts: [[pbex, 1], [pbec, 1]], ax: 0, gga: true, rung: 2 },
  blyp: { name: 'BLYP', parts: [[b88, 1], [lyp, 1]], ax: 0, gga: true, rung: 2 },
  pbe0: { name: 'PBE0', parts: [[pbex, 0.75], [pbec, 1]], ax: 0.25, gga: true, rung: 4 },
  b3lyp: { name: 'B3LYP', parts: [[slater, 0.08], [b88, 0.72], [vwnrpa, 0.19], [lyp, 0.81]], ax: 0.2, gga: true, rung: 4 },
  b3lyp5: { name: 'B3LYP (VWN5)', parts: [[slater, 0.08], [b88, 0.72], [vwn5, 0.19], [lyp, 0.81]], ax: 0.2, gga: true, rung: 4 }
};
QC.functionals = F;

// Evaluate a functional on arrays. Inputs per point: na, nb, saa, sab, sbb (Float64Arrays, length N).
// Returns e (energy density), va, vb (∂e/∂n), and for GGAs gaa, gab, gbb (∂e/∂σ).
function evalXC(fun, na, nb, saa, sab, sbb, spinPolarized) {
  const N = na.length, parts = fun.parts, gga = fun.gga;
  const e = new Float64Array(N), va = new Float64Array(N), vb = new Float64Array(N);
  const gaa = gga ? new Float64Array(N) : null, gab = gga ? new Float64Array(N) : null, gbb = gga ? new Float64Array(N) : null;
  if (!parts.length) return { e, va, vb, gaa, gab, gbb };
  const E = (a, b, s1, s2, s3) => { let t = 0; for (let k = 0; k < parts.length; k++) t += parts[k][1] * parts[k][0](a, b, s1, s2, s3); return t; };
  for (let i = 0; i < N; i++) {
    const a = na[i], b = nb[i];
    if (a + b < 1e-16) continue;
    const s1 = gga ? saa[i] : 0, s2 = gga ? sab[i] : 0, s3 = gga ? sbb[i] : 0;
    e[i] = E(a, b, s1, s2, s3);
    if (!spinPolarized) {
      // closed shell: a = b, s1 = s2 = s3; derivatives by symmetric perturbation (∂e/∂na = ∂e/∂nb)
      const h = 1e-5 * a;
      va[i] = vb[i] = (E(a + h, b, s1, s2, s3) - E(a - h, b, s1, s2, s3)) / (2 * h);
      if (gga) {
        const hs = 1e-5 * s1 + 1e-300;
        gaa[i] = gbb[i] = (E(a, b, s1 + hs, s2, s3) - E(a, b, s1 - (s1 > 2 * hs ? hs : 0), s2, s3)) / (s1 > 2 * hs ? 2 * hs : hs);
        const h2 = 1e-5 * Math.abs(s2) + 1e-300;
        gab[i] = (E(a, b, s1, s2 + h2, s3) - E(a, b, s1, s2 - h2, s3)) / (2 * h2);
      }
      continue;
    }
    va[i] = dn(E, 0, a, b, s1, s2, s3);
    vb[i] = dn(E, 1, a, b, s1, s2, s3);
    if (gga) {
      gaa[i] = ds(E, 2, a, b, s1, s2, s3);
      gab[i] = ds(E, 3, a, b, s1, s2, s3);
      gbb[i] = ds(E, 4, a, b, s1, s2, s3);
    }
  }
  return { e, va, vb, gaa, gab, gbb };
}
function dn(E, which, a, b, s1, s2, s3) {
  const x = which === 0 ? a : b, other = which === 0 ? b : a, tot = a + b;
  let h = 1e-5 * (x > 1e-8 * tot ? x : tot);
  const f = (v) => (which === 0 ? E(v, b, s1, s2, s3) : E(a, v, s1, s2, s3));
  if (x > 2 * h) return (f(x + h) - f(x - h)) / (2 * h);
  return (f(x + h) - f(x)) / h;                     // one-sided at (nearly) empty spin channels
}
function ds(E, which, a, b, s1, s2, s3) {
  const v = [s1, s2, s3][which - 2], h = 1e-5 * Math.abs(v) + 1e-300;
  const g = (t) => (which === 2 ? E(a, b, t, s2, s3) : which === 3 ? E(a, b, s1, t, s3) : E(a, b, s1, s2, t));
  if (which === 3 || v > 2 * h) return (g(v + h) - g(v - h)) / (2 * h);
  return (g(v + h) - g(v)) / h;
}
QC.evalXC = evalXC;
})(typeof window !== 'undefined' ? window : globalThis);
