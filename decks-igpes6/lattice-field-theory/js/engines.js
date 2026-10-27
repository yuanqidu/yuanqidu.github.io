/* engines.js — physics engines for the lattice field theory notes.
   No DOM access: the same file runs in the browser and in Node tests.
   Every engine stores its fields in typed arrays and updates them in place. */
(function (G) {
"use strict";
const LFT = G.LFT = G.LFT || {};
const TAU = 2 * Math.PI;
const rand = Math.random;

let spare = null;
function randn() {
  if (spare !== null) { const s = spare; spare = null; return s; }
  let u = 0; while (u === 0) u = rand();
  const v = rand(), r = Math.sqrt(-2 * Math.log(u));
  spare = r * Math.sin(TAU * v);
  return r * Math.cos(TAU * v);
}
function wrap(a) { return a - TAU * Math.round(a / TAU); }   // to [-π, π]
LFT.randn = LFT.randn || randn;
LFT.wrap = wrap;
LFT.TAU = TAU;

/* ---------- samplers used by several engines ---------- */

// θ ∈ (-π, π] with density ∝ exp(κ cos θ)  (Best & Fisher 1979)
function vonMises(kappa) {
  if (kappa < 1e-6) return TAU * rand() - Math.PI;
  if (kappa > 500) { const t = randn() / Math.sqrt(kappa); return wrap(t); }
  const tau = 1 + Math.sqrt(1 + 4 * kappa * kappa);
  const rho = (tau - Math.sqrt(2 * tau)) / (2 * kappa);
  const r = (1 + rho * rho) / (2 * rho);
  for (;;) {
    const u1 = rand(), u2 = rand();
    const z = Math.cos(Math.PI * u1);
    const f = (1 + r * z) / (r + z);
    const c = kappa * (r - f);
    if (c * (2 - c) - u2 > 0 || Math.log(c / u2) + 1 - c >= 0) {
      const th = Math.acos(Math.max(-1, Math.min(1, f)));
      return rand() < 0.5 ? -th : th;
    }
  }
}
LFT.vonMises = vonMises;

// x0 ∈ [-1, 1] with density ∝ sqrt(1 - x0²) exp(α x0): the SU(2) heat bath.
// Kennedy & Pendleton (1985) for large α, Creutz (1980) for small α.
function su2x0(alpha) {
  if (alpha < 1e-6) {
    for (;;) { const x = 2 * rand() - 1, u = rand(); if (u * u <= 1 - x * x) return x; }
  }
  if (alpha > 2) {
    for (let n = 0; n < 1000; n++) {
      const r1 = 1 - rand(), r3 = 1 - rand(), c = Math.cos(TAU * rand());
      const l2 = -(Math.log(r1) + c * c * Math.log(r3)) / (2 * alpha);
      const r4 = rand();
      if (r4 * r4 <= 1 - l2) return 1 - 2 * l2;
    }
    return 1;
  }
  const e = Math.exp(-2 * alpha);
  for (let n = 0; n < 10000; n++) {
    const u = rand();
    const x = 1 + Math.log(e + u * (1 - e)) / alpha;
    if (rand() <= Math.sqrt(Math.max(0, 1 - x * x))) return x;
  }
  return 1;
}
LFT.su2x0 = su2x0;

/* ---------- periodic 2D neighbour table: +x, -x, +y, -y ---------- */
function nbr2(L) {
  const N = L * L, nb = new Int32Array(4 * N);
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const i = y * L + x;
    nb[4 * i]     = y * L + (x + 1) % L;
    nb[4 * i + 1] = y * L + (x + L - 1) % L;
    nb[4 * i + 2] = ((y + 1) % L) * L + x;
    nb[4 * i + 3] = ((y + L - 1) % L) * L + x;
  }
  return nb;
}
LFT.nbr2 = nbr2;

function makeUF(N) {
  const par = new Int32Array(N);
  function find(i) { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }
  return { par, find, reset() { for (let i = 0; i < N; i++) par[i] = i; },
    union(a, b) { a = find(a); b = find(b); if (a !== b) par[a] = b; } };
}

/* A Wolff "sweep" = a FIXED number of single-cluster moves, chosen so that about N spins flip on
   average.  The number is estimated during a short warm-up after each parameter change and then
   frozen.  The tempting rule "grow clusters until N spins have flipped" makes the moment of
   measurement depend on the state and biases averages: for the 2D Ising model at T = 3 it shifts
   the energy by ~1% (≈ 20 standard errors); see tests/check-engines.js. */
function wolffSweepFixed(model) {
  if (model.wAdapt > 0) {
    let tot = 0, n = 0; while (tot < model.N && n < 4 * model.N) { tot += model.wolffStep(); n++; }
    model.wSum += tot; model.wCnt += n;
    if (--model.wAdapt === 0) model.wSteps = Math.max(1, Math.round(model.N * model.wCnt / model.wSum));
    model.lastFlipped = tot; return n;
  }
  let tot = 0; for (let k = 0; k < model.wSteps; k++) tot += model.wolffStep();
  model.lastFlipped = tot; return model.wSteps;
}
function resetWolff(model) { model.wAdapt = 30; model.wSum = 0; model.wCnt = 0; if (!model.wSteps) model.wSteps = 1; }
LFT.wolffSweepFixed = wolffSweepFixed;

/* =====================================================================
   Ising model  H = -J Σ s_i s_j - h Σ s_i   (J = 1)
   ===================================================================== */
class Ising {
  constructor(L) { this.resize(L); }
  resize(L) {
    this.L = L; this.N = L * L; this.nb = nbr2(L);
    this.s = new Int8Array(this.N); this.cl = new Int32Array(this.N);
    this.mark = new Uint8Array(this.N); this.uf = makeUF(this.N);
    this.csize = new Int32Array(this.N); this.cnew = new Int8Array(this.N);
    this.randomize(); this.setBeta(this.beta || 0.44, this.h || 0);
    this.lastCluster = 0;
  }
  randomize() { const s = this.s; for (let i = 0; i < this.N; i++) s[i] = rand() < 0.5 ? 1 : -1; }
  fill(v) { this.s.fill(v); }
  setBeta(beta, h = 0) {
    this.beta = beta; this.h = h;
    this.acc = new Float64Array(10);            // Metropolis: index (s_i>0 ? 5 : 0) + (sum+4)/2
    for (const si of [-1, 1]) for (let sum = -4; sum <= 4; sum += 2)
      this.acc[(si > 0 ? 5 : 0) + (sum + 4) / 2] = Math.exp(-beta * 2 * si * (sum + h));
    this.pup = new Float64Array(5);             // heat bath: P(s_i = +1 | neighbours)
    for (let sum = -4; sum <= 4; sum += 2) this.pup[(sum + 4) / 2] = 1 / (1 + Math.exp(-2 * beta * (sum + h)));
    this.padd = 1 - Math.exp(-2 * beta);        // Wolff / Swendsen–Wang bond probability
    resetWolff(this);
  }
  metropolisSweep() {
    const s = this.s, nb = this.nb, N = this.N, acc = this.acc; let a = 0;
    for (let n = 0; n < N; n++) {
      const i = (rand() * N) | 0, j = 4 * i;
      const sum = s[nb[j]] + s[nb[j + 1]] + s[nb[j + 2]] + s[nb[j + 3]], si = s[i];
      const p = acc[(si > 0 ? 5 : 0) + ((sum + 4) >> 1)];
      if (p >= 1 || rand() < p) { s[i] = -si; a++; }
    }
    return a / N;
  }
  heatbathSweep() {
    const s = this.s, nb = this.nb, N = this.N, pup = this.pup;
    for (let n = 0; n < N; n++) {
      const i = (rand() * N) | 0, j = 4 * i;
      const sum = s[nb[j]] + s[nb[j + 1]] + s[nb[j + 2]] + s[nb[j + 3]];
      s[i] = rand() < pup[(sum + 4) >> 1] ? 1 : -1;
    }
  }
  // One Wolff cluster. Its sites are left in this.cl[0 .. size).
  wolffStep(seed) {
    const s = this.s, nb = this.nb, mark = this.mark, cl = this.cl, p = this.padd;
    if (seed === undefined) seed = (rand() * this.N) | 0;
    const sv = s[seed]; let head = 0, tail = 0;
    cl[tail++] = seed; mark[seed] = 1;
    while (head < tail) {
      const j4 = 4 * cl[head++];
      for (let k = 0; k < 4; k++) {
        const j = nb[j4 + k];
        if (!mark[j] && s[j] === sv && rand() < p) { mark[j] = 1; cl[tail++] = j; }
      }
    }
    let flip = true;
    if (this.h !== 0) { const dE = 2 * this.h * sv * tail; if (dE > 0 && rand() >= Math.exp(-this.beta * dE)) flip = false; }
    for (let k = 0; k < tail; k++) { const i = cl[k]; mark[i] = 0; if (flip) s[i] = -sv; }
    this.lastCluster = tail;
    return tail;
  }
  // one "sweep" of Wolff work (fixed number of clusters, see wolffSweepFixed)
  wolffSweep() { return wolffSweepFixed(this); }
  swSweep() {
    const N = this.N, s = this.s, nb = this.nb, uf = this.uf, p = this.padd, size = this.csize, nv = this.cnew;
    uf.reset();
    for (let i = 0; i < N; i++) {
      const si = s[i];
      let j = nb[4 * i]; if (s[j] === si && rand() < p) uf.union(i, j);
      j = nb[4 * i + 2]; if (s[j] === si && rand() < p) uf.union(i, j);
    }
    for (let i = 0; i < N; i++) { size[i] = 0; nv[i] = 0; }
    for (let i = 0; i < N; i++) size[uf.find(i)]++;
    const bh = this.beta * this.h;
    for (let i = 0; i < N; i++) {
      const r = uf.find(i);
      if (nv[r] === 0) { const w = Math.exp(2 * bh * size[r]); nv[r] = rand() < w / (1 + w) ? 1 : -1; }
      s[i] = nv[r];
    }
  }
  magnetization() { const s = this.s; let m = 0; for (let i = 0; i < this.N; i++) m += s[i]; return m / this.N; }
  energy() {   // per site, including the field term
    const s = this.s, nb = this.nb; let e = 0, m = 0;
    for (let i = 0; i < this.N; i++) { e -= s[i] * (s[nb[4 * i]] + s[nb[4 * i + 2]]); m += s[i]; }
    return (e - this.h * m) / this.N;
  }
}
LFT.Ising = Ising;

// Exact 2D Ising results (Onsager 1944, Yang 1952), J = k_B = 1
const ellipK = k => { let a = 1, b = Math.sqrt(Math.max(0, 1 - k * k)); for (let i = 0; i < 40; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; } return Math.PI / (2 * a); };
LFT.ellipK = ellipK;
LFT.onsager = {
  Tc: 2 / Math.log(1 + Math.SQRT2),
  m(T) { if (T >= this.Tc) return 0; const s = Math.sinh(2 / T); return Math.pow(1 - Math.pow(s, -4), 1 / 8); },
  e(T) {
    const b = 1 / T, t2 = Math.tanh(2 * b), k = 2 * Math.sinh(2 * b) / Math.pow(Math.cosh(2 * b), 2), f = 2 * t2 * t2 - 1;
    if (Math.abs(f) < 1e-12) return -1 / Math.tanh(2 * b);
    return -(1 / Math.tanh(2 * b)) * (1 + (2 / Math.PI) * f * ellipK(Math.min(k, 1 - 1e-16)));
  }
};

/* =====================================================================
   q-state Potts model  H = -J Σ δ(s_i, s_j)
   ===================================================================== */
class Potts {
  constructor(L, q) {
    this.L = L; this.N = L * L; this.nb = nbr2(L);
    this.s = new Uint8Array(this.N); this.uf = makeUF(this.N); this.ns = new Int16Array(this.N);
    this.cnt = new Int32Array(32); this.w = new Float64Array(32);
    this.setQ(q); this.randomize(); this.setBeta(1);
  }
  setQ(q) {
    this.q = q; this.cs = new Float64Array(q); this.sn = new Float64Array(q);
    for (let k = 0; k < q; k++) { this.cs[k] = Math.cos(TAU * k / q); this.sn[k] = Math.sin(TAU * k / q); }
    for (let i = 0; i < this.N; i++) if (this.s[i] >= q) this.s[i] = (rand() * q) | 0;
  }
  static betaC(q) { return Math.log(1 + Math.sqrt(q)); }
  setBeta(beta) {
    this.beta = beta; this.E = new Float64Array(5);
    for (let n = 0; n <= 4; n++) this.E[n] = Math.exp(beta * n);
    this.padd = 1 - Math.exp(-beta);
  }
  randomize() { const s = this.s, q = this.q; for (let i = 0; i < this.N; i++) s[i] = (rand() * q) | 0; }
  fill(k) { this.s.fill(k); }
  heatbathSweep() {
    const s = this.s, nb = this.nb, N = this.N, q = this.q, E = this.E, w = this.w, cnt = this.cnt;
    for (let n = 0; n < N; n++) {
      const i = (rand() * N) | 0, j = 4 * i;
      for (let k = 0; k < q; k++) cnt[k] = 0;
      cnt[s[nb[j]]]++; cnt[s[nb[j + 1]]]++; cnt[s[nb[j + 2]]]++; cnt[s[nb[j + 3]]]++;
      let tot = 0; for (let k = 0; k < q; k++) { tot += E[cnt[k]]; w[k] = tot; }
      const r = rand() * tot; let k = 0; while (k < q - 1 && r >= w[k]) k++;
      s[i] = k;
    }
  }
  swSweep() {
    const N = this.N, s = this.s, nb = this.nb, uf = this.uf, p = this.padd, q = this.q, ns = this.ns;
    uf.reset();
    for (let i = 0; i < N; i++) {
      const si = s[i];
      let j = nb[4 * i]; if (s[j] === si && rand() < p) uf.union(i, j);
      j = nb[4 * i + 2]; if (s[j] === si && rand() < p) uf.union(i, j);
    }
    ns.fill(-1);
    for (let i = 0; i < N; i++) { const r = uf.find(i); if (ns[r] < 0) ns[r] = (rand() * q) | 0; s[i] = ns[r]; }
  }
  energy() { const s = this.s, nb = this.nb; let e = 0; for (let i = 0; i < this.N; i++) e -= (s[i] === s[nb[4 * i]]) + (s[i] === s[nb[4 * i + 2]]); return e / this.N; }
  order() {   // complex order parameter (1/N) Σ exp(2πi s/q)
    const s = this.s, cs = this.cs, sn = this.sn; let re = 0, im = 0;
    for (let i = 0; i < this.N; i++) { re += cs[s[i]]; im += sn[s[i]]; }
    return [re / this.N, im / this.N];
  }
  counts() { const c = new Int32Array(this.q); for (let i = 0; i < this.N; i++) c[this.s[i]]++; return c; }
}
LFT.Potts = Potts;

/* =====================================================================
   XY model  H = -J Σ cos(θ_i - θ_j)
   ===================================================================== */
class XY {
  constructor(L) {
    this.L = L; this.N = L * L; this.nb = nbr2(L);
    this.th = new Float64Array(this.N); this.cl = new Int32Array(this.N);
    this.mark = new Uint8Array(this.N); this.proj = new Float64Array(this.N);
    this.delta = 1.5; this.beta = 1; this.adapt = 300; resetWolff(this); this.randomize();
  }
  randomize() { for (let i = 0; i < this.N; i++) this.th[i] = TAU * rand(); }
  fill(a) { this.th.fill(a); }
  setBeta(b) { this.beta = b; this.adapt = 300; resetWolff(this); }
  metropolisSweep() {
    const th = this.th, nb = this.nb, N = this.N, b = this.beta, d = this.delta; let acc = 0;
    for (let n = 0; n < N; n++) {
      const i = (rand() * N) | 0, j = 4 * i;
      let hx = 0, hy = 0;
      for (let k = 0; k < 4; k++) { const t = th[nb[j + k]]; hx += Math.cos(t); hy += Math.sin(t); }
      const t0 = th[i], t1 = t0 + d * (2 * rand() - 1);
      const dE = -(hx * Math.cos(t1) + hy * Math.sin(t1)) + (hx * Math.cos(t0) + hy * Math.sin(t0));
      if (dE <= 0 || rand() < Math.exp(-b * dE)) { th[i] = t1 - TAU * Math.floor(t1 / TAU); acc++; }
    }
    const r = acc / N;
    // tune the step towards 50% acceptance during warm-up only, so the chain stays exactly reversible afterwards
    if (this.adapt > 0) { this.adapt--; this.delta = Math.min(Math.PI, Math.max(0.05, this.delta * (r > 0.5 ? 1.04 : 0.96))); }
    return r;
  }
  overrelaxSweep() {
    const th = this.th, nb = this.nb, N = this.N;
    for (let i = 0; i < N; i++) {
      const j = 4 * i; let hx = 0, hy = 0;
      for (let k = 0; k < 4; k++) { const t = th[nb[j + k]]; hx += Math.cos(t); hy += Math.sin(t); }
      if (hx * hx + hy * hy < 1e-12) continue;
      const t1 = 2 * Math.atan2(hy, hx) - th[i];
      th[i] = t1 - TAU * Math.floor(t1 / TAU);
    }
  }
  // Wolff (1989) cluster update with a random reflection axis
  wolffStep() {
    const th = this.th, nb = this.nb, cl = this.cl, mark = this.mark, proj = this.proj, b = this.beta;
    const r = TAU * rand(), rx = Math.cos(r), ry = Math.sin(r), seed = (rand() * this.N) | 0;
    let head = 0, tail = 0;
    proj[seed] = Math.cos(th[seed]) * rx + Math.sin(th[seed]) * ry;
    th[seed] = Math.PI + 2 * r - th[seed]; mark[seed] = 1; cl[tail++] = seed;
    while (head < tail) {
      const i = cl[head++], pi = proj[i], j4 = 4 * i;
      for (let k = 0; k < 4; k++) {
        const j = nb[j4 + k]; if (mark[j]) continue;
        const pj = Math.cos(th[j]) * rx + Math.sin(th[j]) * ry, x = 2 * b * pi * pj;
        if (x > 0 && rand() < 1 - Math.exp(-x)) { mark[j] = 1; proj[j] = pj; th[j] = Math.PI + 2 * r - th[j]; cl[tail++] = j; }
      }
    }
    for (let k = 0; k < tail; k++) { const i = cl[k]; mark[i] = 0; th[i] -= TAU * Math.floor(th[i] / TAU); }
    return tail;
  }
  wolffSweep() { return wolffSweepFixed(this); }
  // winding number of each plaquette (lower-left corner i): +1 vortex, -1 antivortex
  vortices(out) {
    const th = this.th, nb = this.nb; let n = 0;
    for (let i = 0; i < this.N; i++) {
      const ix = nb[4 * i], ixy = nb[4 * ix + 2], iy = nb[4 * i + 2];
      const a = th[i], b = th[ix], c = th[ixy], d = th[iy];
      const w = Math.round((wrap(b - a) + wrap(c - b) + wrap(d - c) + wrap(a - d)) / TAU);
      out[i] = w; if (w !== 0) n++;
    }
    return n;
  }
  energy() { const th = this.th, nb = this.nb; let e = 0; for (let i = 0; i < this.N; i++) e -= Math.cos(th[i] - th[nb[4 * i]]) + Math.cos(th[i] - th[nb[4 * i + 2]]); return e / this.N; }
  magnetization() { let x = 0, y = 0; for (let i = 0; i < this.N; i++) { x += Math.cos(this.th[i]); y += Math.sin(this.th[i]); } return [x / this.N, y / this.N]; }
  // Spin stiffness (helicity modulus), one configuration's contribution:
  // Υ = (1/N) [ Σ_x-bonds cos Δθ − β (Σ_x-bonds sin Δθ)² ], averaged over x and y.
  stiffness() {
    const th = this.th, nb = this.nb, N = this.N; let cx = 0, sx = 0, cy = 0, sy = 0;
    for (let i = 0; i < N; i++) {
      const dx = th[i] - th[nb[4 * i]], dy = th[i] - th[nb[4 * i + 2]];
      cx += Math.cos(dx); sx += Math.sin(dx); cy += Math.cos(dy); sy += Math.sin(dy);
    }
    return ((cx - this.beta * sx * sx) + (cy - this.beta * sy * sy)) / (2 * N);
  }
}
LFT.XY = XY;

/* =====================================================================
   φ⁴ theory, hopping-parameter form (2D):
   S = Σ_x [ -2κ Σ_μ φ_x φ_{x+μ} + φ_x² + λ (φ_x² - 1)² ]
   λ = 0: free (Gaussian) field;  λ → ∞: Ising model with βJ = 2κ.
   ===================================================================== */
class Phi4 {
  constructor(L) {
    this.L = L; this.N = L * L; this.nb = nbr2(L);
    this.phi = new Float64Array(this.N); this.pi = new Float64Array(this.N);
    this.F = new Float64Array(this.N); this.old = new Float64Array(this.N);
    this.kappa = 0.25; this.lambda = 1; this.delta = 1; this.eps = 0.1; this.nmd = 10; this.adapt = 300; resetWolff(this);
    this.randomize();
  }
  randomize() { for (let i = 0; i < this.N; i++) this.phi[i] = randn() * 0.5; }
  fill(v) { this.phi.fill(v); }
  localS(x, n) { const x2 = x * x; return -2 * this.kappa * x * n + x2 + this.lambda * (x2 - 1) * (x2 - 1); }
  metropolisSweep() {
    const phi = this.phi, nb = this.nb, N = this.N, d = this.delta; let acc = 0;
    for (let k = 0; k < N; k++) {
      const i = (rand() * N) | 0, j = 4 * i;
      const n = phi[nb[j]] + phi[nb[j + 1]] + phi[nb[j + 2]] + phi[nb[j + 3]];
      const x0 = phi[i], x1 = x0 + d * (2 * rand() - 1);
      const dS = this.localS(x1, n) - this.localS(x0, n);
      if (dS <= 0 || rand() < Math.exp(-dS)) { phi[i] = x1; acc++; }
    }
    const r = acc / N;
    if (this.adapt > 0) { this.adapt--; this.delta = Math.min(4, Math.max(0.02, this.delta * (r > 0.5 ? 1.03 : 0.97))); }
    return r;
  }
  action(phi = this.phi) {
    const nb = this.nb, k = this.kappa, l = this.lambda; let S = 0;
    for (let i = 0; i < this.N; i++) { const x = phi[i], x2 = x * x; S += -2 * k * x * (phi[nb[4 * i]] + phi[nb[4 * i + 2]]) + x2 + l * (x2 - 1) * (x2 - 1); }
    return S;
  }
  force(phi, F) {   // F = -∂S/∂φ
    const nb = this.nb, k = this.kappa, l = this.lambda;
    for (let i = 0; i < this.N; i++) {
      const j = 4 * i, x = phi[i];
      F[i] = 2 * k * (phi[nb[j]] + phi[nb[j + 1]] + phi[nb[j + 2]] + phi[nb[j + 3]]) - 2 * x - 4 * l * x * (x * x - 1);
    }
  }
  hmcTrajectory() {
    // the step size is jittered by ±20% each trajectory: a fixed trajectory length can resonate
    // with a mode of the field and leave it nearly unchanged (Mackenzie 1989)
    const N = this.N, phi = this.phi, pi = this.pi, F = this.F, eps = this.eps * (0.8 + 0.4 * rand()), n = this.nmd;
    this.old.set(phi);
    let K0 = 0; for (let i = 0; i < N; i++) { pi[i] = randn(); K0 += pi[i] * pi[i]; }
    const H0 = 0.5 * K0 + this.action();
    this.force(phi, F); for (let i = 0; i < N; i++) pi[i] += 0.5 * eps * F[i];
    for (let s = 0; s < n; s++) {
      for (let i = 0; i < N; i++) phi[i] += eps * pi[i];
      this.force(phi, F);
      const h = s === n - 1 ? 0.5 * eps : eps;
      for (let i = 0; i < N; i++) pi[i] += h * F[i];
    }
    let K1 = 0; for (let i = 0; i < N; i++) K1 += pi[i] * pi[i];
    const dH = 0.5 * K1 + this.action() - H0;
    const ok = Number.isFinite(dH) && (dH <= 0 || rand() < Math.exp(-dH));
    if (!ok) phi.set(this.old);
    if (this.adapt > 0) { this.adapt--; this.eps = Math.min(0.5, Math.max(0.004, this.eps * (ok ? 1.02 : 0.95))); }
    return { ok, dH };
  }
  magnetization() { let m = 0; for (let i = 0; i < this.N; i++) m += this.phi[i]; return m / this.N; }
  // Embedded-Ising cluster move (Brower & Tamayo 1989): flip the sign of a cluster of
  // same-sign sites; a bond with φ_i φ_j > 0 is added with probability 1 − exp(−4κ φ_i φ_j).
  wolffStep() {
    const phi = this.phi, nb = this.nb, k4 = 4 * this.kappa;
    const cl = this.cl || (this.cl = new Int32Array(this.N)), mark = this.mark || (this.mark = new Uint8Array(this.N));
    const seed = (rand() * this.N) | 0; let head = 0, tail = 0;
    cl[tail++] = seed; mark[seed] = 1;
    while (head < tail) {
      const i = cl[head++], pi = phi[i];
      for (let k = 0; k < 4; k++) {
        const j = nb[4 * i + k]; if (mark[j]) continue;
        const x = k4 * pi * phi[j];
        if (x > 0 && rand() < 1 - Math.exp(-x)) { mark[j] = 1; cl[tail++] = j; }
      }
    }
    for (let k = 0; k < tail; k++) { const i = cl[k]; mark[i] = 0; phi[i] = -phi[i]; }
    return tail;
  }
  wolffSweep() { return wolffSweepFixed(this); }
  // call after changing κ or λ: re-tune the step size and the number of clusters per sweep
  retune() { this.adapt = 300; resetWolff(this); }
}
LFT.Phi4 = Phi4;

/* =====================================================================
   Quantum mechanics as a 1D lattice field theory (Creutz & Freedman 1981)
   S = Σ_n [ m/(2a) (x_{n+1} - x_n)² + a V(x_n) ],  periodic in Euclidean time
   ===================================================================== */
const POTENTIALS = {
  harmonic: { V: x => 0.5 * x * x, range: 3.6, label: "harmonic  V = x²/2" },
  double:   { V: x => (x * x - 1.4 * 1.4) * (x * x - 1.4 * 1.4) * 0.5, range: 3.0, label: "double well" }
};
LFT.POTENTIALS = POTENTIALS;
class QMChain {
  constructor(N, a, pot) { this.m = 1; this.set(N, a, pot); }
  set(N, a, pot) {
    this.N = N; this.a = a; this.pot = pot; this.V = POTENTIALS[pot].V;
    this.x = new Float64Array(N); this.delta = 2 * Math.sqrt(a); this.adapt = 300;
    if (pot === "double") for (let n = 0; n < N; n++) this.x[n] = 1.4;
  }
  sweep() {
    const x = this.x, N = this.N, a = this.a, c = this.m / (2 * a), V = this.V, d = this.delta; let acc = 0;
    for (let k = 0; k < N; k++) {
      const n = (rand() * N) | 0, xp = x[(n + 1) % N], xm = x[(n + N - 1) % N], x0 = x[n], x1 = x0 + d * (2 * rand() - 1);
      const dS = c * ((xp - x1) * (xp - x1) + (x1 - xm) * (x1 - xm) - (xp - x0) * (xp - x0) - (x0 - xm) * (x0 - xm)) + a * (V(x1) - V(x0));
      if (dS <= 0 || rand() < Math.exp(-dS)) { x[n] = x1; acc++; }
    }
    const r = acc / N;
    if (this.adapt > 0) { this.adapt--; this.delta = Math.min(4, Math.max(0.02, this.delta * (r > 0.5 ? 1.03 : 0.97))); }
    return r;
  }
}
LFT.QMChain = QMChain;

// Symmetric eigen-decomposition (cyclic Jacobi). Returns eigenvalues in descending order
// and eigenvectors as columns of vecs (vecs[i*n + k] = component i of vector k).
function jacobiEigen(Ain, n) {
  const a = Float64Array.from(Ain), v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0, diag = 0;
    for (let p = 0; p < n; p++) { diag += a[p * n + p] * a[p * n + p]; for (let q = p + 1; q < n; q++) off += a[p * n + q] * a[p * n + q]; }
    if (off <= 1e-26 * diag) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q]; if (Math.abs(apq) < 1e-300) continue;
      const theta = (a[q * n + q] - a[p * n + p]) / (2 * apq);
      const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k * n + p], akq = a[k * n + q]; a[k * n + p] = c * akp - s * akq; a[k * n + q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p * n + k], aqk = a[q * n + k]; a[p * n + k] = c * apk - s * aqk; a[q * n + k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = v[k * n + p], vkq = v[k * n + q]; v[k * n + p] = c * vkp - s * vkq; v[k * n + q] = s * vkp + c * vkq; }
    }
  }
  const idx = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[j * n + j] - a[i * n + i]);
  const vals = new Float64Array(n), vecs = new Float64Array(n * n);
  idx.forEach((k, kk) => { vals[kk] = a[k * n + k]; for (let i = 0; i < n; i++) vecs[i * n + kk] = v[i * n + k]; });
  return { vals, vecs };
}
LFT.jacobiEigen = jacobiEigen;

// Exact results for the lattice chain from its transfer matrix
// T(x,y) = exp(-m(x-y)²/(2a) - a(V(x)+V(y))/2) dx on a grid.
function qmExact(pot, a, N, M = 121) {
  const P = POTENTIALS[pot], R = P.range, V = P.V, m = 1;
  const xs = new Float64Array(M), dx = 2 * R / (M - 1);
  for (let i = 0; i < M; i++) xs[i] = -R + i * dx;
  const T = new Float64Array(M * M);
  for (let i = 0; i < M; i++) for (let j = 0; j < M; j++)
    T[i * M + j] = Math.exp(-m * (xs[i] - xs[j]) ** 2 / (2 * a) - a * (V(xs[i]) + V(xs[j])) / 2) * dx;
  const { vals, vecs } = jacobiEigen(T, M);
  const K = Math.min(14, M), r = [];
  for (let k = 0; k < K; k++) r.push(Math.max(vals[k], 1e-300) / vals[0]);
  const wN = r.map(v => Math.pow(v, N)), Zn = wN.reduce((s, v) => s + v, 0);
  const p = new Float64Array(M);
  for (let i = 0; i < M; i++) { let s = 0; for (let k = 0; k < K; k++) s += wN[k] * vecs[i * M + k] ** 2; p[i] = s / (Zn * dx); }
  const X = [];   // matrix elements <j|x|k>
  for (let j = 0; j < K; j++) { X.push([]); for (let k = 0; k < K; k++) { let s = 0; for (let i = 0; i < M; i++) s += vecs[i * M + j] * xs[i] * vecs[i * M + k]; X[j].push(s); } }
  const C = new Float64Array(Math.floor(N / 2) + 1);
  for (let n = 0; n < C.length; n++) {
    let s = 0;
    for (let j = 0; j < K; j++) for (let k = 0; k < K; k++) s += Math.pow(r[j], N - n) * Math.pow(r[k], n) * X[j][k] * X[j][k];
    C[n] = s / Zn;
  }
  const gaps = r.slice(1, 5).map(v => -Math.log(v) / a);
  return { xs, p, C, gaps, x2: C[0] };
}
LFT.qmExact = qmExact;

/* =====================================================================
   FFT (radix 2) and a Gaussian free field with mass m (correlation length 1/m)
   ===================================================================== */
function fft1(re, im, n, inv) {
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}
function fft2(re, im, n, inv) {
  const r = new Float64Array(n), i2 = new Float64Array(n);
  for (let y = 0; y < n; y++) { const o = y * n; for (let x = 0; x < n; x++) { r[x] = re[o + x]; i2[x] = im[o + x]; } fft1(r, i2, n, inv); for (let x = 0; x < n; x++) { re[o + x] = r[x]; im[o + x] = i2[x]; } }
  for (let x = 0; x < n; x++) { for (let y = 0; y < n; y++) { r[y] = re[y * n + x]; i2[y] = im[y * n + x]; } fft1(r, i2, n, inv); for (let y = 0; y < n; y++) { re[y * n + x] = r[y]; im[y * n + x] = i2[y]; } }
}
LFT.fft1 = fft1; LFT.fft2 = fft2;

class GFF {
  constructor(n) {
    this.n = n; const N = n * n;
    this.nr = new Float64Array(N); this.ni = new Float64Array(N);
    this.re = new Float64Array(N); this.im = new Float64Array(N); this.field = new Float64Array(N);
    this.p2 = new Float64Array(N);
    for (let ky = 0; ky < n; ky++) for (let kx = 0; kx < n; kx++)
      this.p2[ky * n + kx] = 4 * Math.sin(Math.PI * kx / n) ** 2 + 4 * Math.sin(Math.PI * ky / n) ** 2;
    for (let i = 0; i < N; i++) { this.nr[i] = randn(); this.ni[i] = randn(); }
  }
  // Ornstein–Uhlenbeck drift of the white noise: the field changes smoothly in time
  evolve(rate) {
    const r = Math.exp(-rate), s = Math.sqrt(1 - r * r);
    for (let i = 0; i < this.nr.length; i++) { this.nr[i] = r * this.nr[i] + s * randn(); this.ni[i] = r * this.ni[i] + s * randn(); }
  }
  // field with propagator 1/(m² + p̂²)^power, normalised to unit variance (power 1 = free field)
  compute(m, power = 1) {
    const n = this.n, N = n * n, re = this.re, im = this.im, p2 = this.p2, m2 = m * m;
    for (let i = 0; i < N; i++) { const amp = Math.pow(m2 + p2[i], -power / 2); re[i] = this.nr[i] * amp; im[i] = this.ni[i] * amp; }
    fft2(re, im, n, true);
    let s2 = 0; for (let i = 0; i < N; i++) s2 += re[i] * re[i];
    const sd = Math.sqrt(s2 / N) || 1;
    for (let i = 0; i < N; i++) this.field[i] = re[i] / sd;
    return this.field;
  }
}
LFT.GFF = GFF;

/* =====================================================================
   2D U(1) lattice gauge theory.  Link angles θ_{x,μ}; plaquette
   θ_P(x) = θ_{x,0} + θ_{x+0̂,1} - θ_{x+1̂,0} - θ_{x,1};  S = β Σ_P (1 - cos θ_P)
   Link (i, μ) is stored at th[2i + μ].
   ===================================================================== */
class U1_2D {
  constructor(L) {
    this.L = L; this.N = L * L; this.nb = nbr2(L);
    this.th = new Float64Array(2 * this.N); this.sinP = new Float64Array(this.N);
    this.beta = 2;
  }
  cold() { this.th.fill(0); }
  hot() { for (let i = 0; i < this.th.length; i++) this.th[i] = TAU * rand() - Math.PI; }
  plaq(i) {
    const th = this.th, nb = this.nb;
    return th[2 * i] + th[2 * nb[4 * i] + 1] - th[2 * nb[4 * i + 2]] - th[2 * i + 1];
  }
  // local action of link l is -β Re(exp(iθ_l) Σ_l); returns Σ_l as [re, im]
  staple(i, mu) {
    const th = this.th, nb = this.nb;
    if (mu === 0) {
      const ix = nb[4 * i], iy = nb[4 * i + 2], im = nb[4 * i + 3], imx = nb[4 * im];
      const R1 = th[2 * ix + 1] - th[2 * iy] - th[2 * i + 1];        // P(i):     +θ
      const R2 = th[2 * im] + th[2 * imx + 1] - th[2 * im + 1];       // P(i-ŷ):   -θ
      return [Math.cos(R1) + Math.cos(R2), Math.sin(R1) - Math.sin(R2)];
    } else {
      const ix = nb[4 * i], iy = nb[4 * i + 2], ixm = nb[4 * i + 1], ixmy = nb[4 * ixm + 2];
      const R1 = th[2 * i] + th[2 * ix + 1] - th[2 * iy];             // P(i):     -θ
      const R2 = th[2 * ixm] - th[2 * ixmy] - th[2 * ixm + 1];        // P(i-x̂):   +θ
      return [Math.cos(R1) + Math.cos(R2), -Math.sin(R1) + Math.sin(R2)];
    }
  }
  heatbathSweep() {
    const th = this.th, b = this.beta;
    for (let k = 0; k < 2 * this.N; k++) {
      const l = (rand() * 2 * this.N) | 0, i = l >> 1, mu = l & 1;
      const [sr, si] = this.staple(i, mu), kap = b * Math.hypot(sr, si);
      th[l] = wrap(-Math.atan2(si, sr) + vonMises(kap));
    }
  }
  overrelaxSweep() {
    const th = this.th;
    for (let l = 0; l < 2 * this.N; l++) {
      const [sr, si] = this.staple(l >> 1, l & 1);
      if (sr * sr + si * si < 1e-20) continue;
      th[l] = wrap(-2 * Math.atan2(si, sr) - th[l]);
    }
  }
  metropolisSweep(delta) {
    const th = this.th, b = this.beta; let acc = 0;
    for (let k = 0; k < 2 * this.N; k++) {
      const l = (rand() * 2 * this.N) | 0, [sr, si] = this.staple(l >> 1, l & 1);
      const t0 = th[l], t1 = t0 + delta * (2 * rand() - 1);
      const dS = -b * ((Math.cos(t1) - Math.cos(t0)) * sr - (Math.sin(t1) - Math.sin(t0)) * si);
      if (dS <= 0 || rand() < Math.exp(-dS)) { th[l] = wrap(t1); acc++; }
    }
    return acc / (2 * this.N);
  }
  avgPlaq() { let s = 0; for (let i = 0; i < this.N; i++) s += Math.cos(this.plaq(i)); return s / this.N; }
  topCharge() { let q = 0; for (let i = 0; i < this.N; i++) q += wrap(this.plaq(i)); return q / TAU; }
  // θ_{x,μ} → θ_{x,μ} + Λ_x − Λ_{x+μ}: every plaquette is unchanged
  randomGauge() {
    const th = this.th, nb = this.nb, lam = new Float64Array(this.N);
    for (let i = 0; i < this.N; i++) lam[i] = TAU * rand();
    for (let i = 0; i < this.N; i++) {
      th[2 * i] = wrap(th[2 * i] + lam[i] - lam[nb[4 * i]]);
      th[2 * i + 1] = wrap(th[2 * i + 1] + lam[i] - lam[nb[4 * i + 2]]);
    }
  }
  action() { let s = 0; for (let i = 0; i < this.N; i++) s += 1 - Math.cos(this.plaq(i)); return this.beta * s; }
  // ⟨W⟩ of R×T rectangles, averaged over position and both orientations
  wilson(R, T) {
    const th = this.th, nb = this.nb, L = this.L; let s = 0, cnt = 0;
    for (let o = 0; o < 2; o++) {
      const A = o === 0 ? R : T, B = o === 0 ? T : R;   // A steps in x, B steps in y
      for (let i = 0; i < this.N; i++) {
        let ang = 0, j = i;
        for (let k = 0; k < A; k++) { ang += th[2 * j]; j = nb[4 * j]; }
        for (let k = 0; k < B; k++) { ang += th[2 * j + 1]; j = nb[4 * j + 2]; }
        for (let k = 0; k < A; k++) { j = nb[4 * j + 1]; ang -= th[2 * j]; }
        for (let k = 0; k < B; k++) { j = nb[4 * j + 3]; ang -= th[2 * j + 1]; }
        s += Math.cos(ang); cnt++;
      }
      if (R === T) break;
    }
    return s / cnt;
  }
  // Wilson (gradient) flow with β = 1: dθ/dt = -∂S/∂θ, Euler steps
  flowStep(eps) {
    const th = this.th, nb = this.nb, sp = this.sinP, N = this.N;
    for (let i = 0; i < N; i++) sp[i] = Math.sin(this.plaq(i));
    for (let i = 0; i < N; i++) {
      th[2 * i]     -= eps * (sp[i] - sp[nb[4 * i + 3]]);
      th[2 * i + 1] -= eps * (sp[nb[4 * i + 1]] - sp[i]);
    }
  }
}
LFT.U1_2D = U1_2D;

// Exact infinite-volume 2D U(1) results: ⟨cos θ_P⟩ = I1(β)/I0(β); W(A) = (I1/I0)^A
LFT.besselRatio = function (n, m, x) {
  const K = 4000; let a = 0, b = 0;
  for (let k = 0; k <= K; k++) {
    const t = Math.PI * k / K, w = (k === 0 || k === K) ? 0.5 : 1, e = w * Math.exp(x * (Math.cos(t) - 1));
    a += e * Math.cos(n * t); b += e * Math.cos(m * t);
  }
  return a / b;
};
// ⟨(θ_P/2π)²⟩ for independent plaquettes: the topological susceptibility per plaquette
LFT.u1chi = function (beta) {
  const K = 4000; let a = 0, b = 0;
  for (let k = 0; k <= K; k++) { const t = -Math.PI + TAU * k / K, w = (k === 0 || k === K) ? 0.5 : 1, e = w * Math.exp(beta * (Math.cos(t) - 1)); a += e * (t / TAU) ** 2; b += e; }
  return a / b;
};

/* =====================================================================
   4D lattice gauge theory: Z2, U(1), SU(2), SU(3) with the Wilson action
   S = β Σ_P (1 - Re Tr U_P / N).  Sites x + Ls (y + Ls (z + Ls t)); μ = 3 is time.
   Storage per link: Z2 ±1; U(1) angle; SU(2) quaternion (a0,a1,a2,a3) with
   U = a0 + i a·σ; SU(3) 3×3 complex, row-major, (re, im) interleaved.
   ===================================================================== */
function m3mul(A, a, B, b, C, c) {          // C = A B
  for (let i = 0; i < 3; i++) {
    const r = a + 6 * i, x0 = A[r], y0 = A[r + 1], x1 = A[r + 2], y1 = A[r + 3], x2 = A[r + 4], y2 = A[r + 5];
    for (let j = 0; j < 3; j++) {
      const u0 = B[b + 2 * j], v0 = B[b + 2 * j + 1], u1 = B[b + 6 + 2 * j], v1 = B[b + 7 + 2 * j], u2 = B[b + 12 + 2 * j], v2 = B[b + 13 + 2 * j];
      C[c + 6 * i + 2 * j]     = x0 * u0 - y0 * v0 + x1 * u1 - y1 * v1 + x2 * u2 - y2 * v2;
      C[c + 6 * i + 2 * j + 1] = x0 * v0 + y0 * u0 + x1 * v1 + y1 * u1 + x2 * v2 + y2 * u2;
    }
  }
}
function m3mulD(A, a, B, b, C, c) {         // C = A B†
  for (let i = 0; i < 3; i++) {
    const r = a + 6 * i, x0 = A[r], y0 = A[r + 1], x1 = A[r + 2], y1 = A[r + 3], x2 = A[r + 4], y2 = A[r + 5];
    for (let j = 0; j < 3; j++) {
      const s = b + 6 * j, u0 = B[s], v0 = B[s + 1], u1 = B[s + 2], v1 = B[s + 3], u2 = B[s + 4], v2 = B[s + 5];
      C[c + 6 * i + 2 * j]     = x0 * u0 + y0 * v0 + x1 * u1 + y1 * v1 + x2 * u2 + y2 * v2;
      C[c + 6 * i + 2 * j + 1] = y0 * u0 - x0 * v0 + y1 * u1 - x1 * v1 + y2 * u2 - x2 * v2;
    }
  }
}
function m3Dmul(A, a, B, b, C, c) {         // C = A† B
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    let re = 0, im = 0;
    for (let k = 0; k < 3; k++) {
      const ar = A[a + 6 * k + 2 * i], ai = A[a + 6 * k + 2 * i + 1], br = B[b + 6 * k + 2 * j], bi = B[b + 6 * k + 2 * j + 1];
      re += ar * br + ai * bi; im += ar * bi - ai * br;
    }
    C[c + 6 * i + 2 * j] = re; C[c + 6 * i + 2 * j + 1] = im;
  }
}
function su3Reunit(U, o) {                  // Gram–Schmidt rows 0,1; row 2 = conj(row0 × row1)
  let n = 0; for (let k = 0; k < 6; k++) n += U[o + k] * U[o + k];
  n = 1 / Math.sqrt(n); for (let k = 0; k < 6; k++) U[o + k] *= n;
  let pr = 0, pi = 0;                       // <row0, row1> = Σ conj(u0k) u1k
  for (let k = 0; k < 3; k++) { const ar = U[o + 2 * k], ai = U[o + 2 * k + 1], br = U[o + 6 + 2 * k], bi = U[o + 7 + 2 * k]; pr += ar * br + ai * bi; pi += ar * bi - ai * br; }
  for (let k = 0; k < 3; k++) { const ar = U[o + 2 * k], ai = U[o + 2 * k + 1]; U[o + 6 + 2 * k] -= pr * ar - pi * ai; U[o + 7 + 2 * k] -= pr * ai + pi * ar; }
  n = 0; for (let k = 6; k < 12; k++) n += U[o + k] * U[o + k];
  n = 1 / Math.sqrt(n); for (let k = 6; k < 12; k++) U[o + k] *= n;
  const a = o, b = o + 6;
  // c_k = conj(a_{k+1} b_{k+2} - a_{k+2} b_{k+1})
  for (let k = 0; k < 3; k++) {
    const k1 = (k + 1) % 3, k2 = (k + 2) % 3;
    const xr = U[a + 2 * k1] * U[b + 2 * k2] - U[a + 2 * k1 + 1] * U[b + 2 * k2 + 1] - (U[a + 2 * k2] * U[b + 2 * k1] - U[a + 2 * k2 + 1] * U[b + 2 * k1 + 1]);
    const xi = U[a + 2 * k1] * U[b + 2 * k2 + 1] + U[a + 2 * k1 + 1] * U[b + 2 * k2] - (U[a + 2 * k2] * U[b + 2 * k1 + 1] + U[a + 2 * k2 + 1] * U[b + 2 * k1]);
    U[o + 12 + 2 * k] = xr; U[o + 13 + 2 * k] = -xi;
  }
}
LFT.su3 = { m3mul, m3mulD, m3Dmul, su3Reunit };

class Gauge4D {
  constructor(group, Ls, Lt) {
    this.group = group; this.Ls = Ls; this.Lt = Lt;
    this.N = group === "SU3" ? 3 : group === "SU2" ? 2 : 1;
    this.nc = { Z2: 1, U1: 1, SU2: 4, SU3: 18 }[group];
    const V = this.V = Ls * Ls * Ls * Lt;
    this.U = new Float64Array(V * 4 * this.nc);
    this.up = new Int32Array(V * 4); this.dn = new Int32Array(V * 4);
    const L = [Ls, Ls, Ls, Lt];
    for (let t = 0; t < Lt; t++) for (let z = 0; z < Ls; z++) for (let y = 0; y < Ls; y++) for (let x = 0; x < Ls; x++) {
      const c = [x, y, z, t], s = x + Ls * (y + Ls * (z + Ls * t));
      for (let mu = 0; mu < 4; mu++) {
        const cu = c.slice(), cd = c.slice();
        cu[mu] = (cu[mu] + 1) % L[mu]; cd[mu] = (cd[mu] + L[mu] - 1) % L[mu];
        this.up[4 * s + mu] = cu[0] + Ls * (cu[1] + Ls * (cu[2] + Ls * cu[3]));
        this.dn[4 * s + mu] = cd[0] + Ls * (cd[1] + Ls * (cd[2] + Ls * cd[3]));
      }
    }
    this.A = new Float64Array(18); this.T1 = new Float64Array(18); this.T2 = new Float64Array(18);
    this.cold();
  }
  off(s, mu) { return (4 * s + mu) * this.nc; }
  cold() {
    const U = this.U, nc = this.nc, n = this.V * 4;
    U.fill(0);
    for (let l = 0; l < n; l++) {
      const o = l * nc;
      if (this.group === "Z2") U[o] = 1;
      else if (this.group === "U1") U[o] = 0;
      else if (this.group === "SU2") U[o] = 1;
      else { U[o] = 1; U[o + 8] = 1; U[o + 16] = 1; }
    }
  }
  hot() {
    const U = this.U, nc = this.nc, n = this.V * 4;
    for (let l = 0; l < n; l++) {
      const o = l * nc;
      if (this.group === "Z2") U[o] = rand() < 0.5 ? 1 : -1;
      else if (this.group === "U1") U[o] = TAU * rand() - Math.PI;
      else if (this.group === "SU2") { let q = [randn(), randn(), randn(), randn()], r = Math.hypot(...q); for (let k = 0; k < 4; k++) U[o + k] = q[k] / r; }
      else { for (let k = 0; k < 12; k++) U[o + k] = randn(); su3Reunit(U, o); }
    }
  }
  /* ---- staples: sum over the 6 plaquettes containing link (s, μ) ---- */
  stapleZ2(s, mu) {
    const U = this.U, up = this.up, dn = this.dn; let A = 0;
    const smu = up[4 * s + mu];
    for (let nu = 0; nu < 4; nu++) {
      if (nu === mu) continue;
      const snu = up[4 * s + nu], sn = dn[4 * s + nu], smn = dn[4 * smu + nu];
      A += U[4 * smu + nu] * U[4 * snu + mu] * U[4 * s + nu];
      A += U[4 * smn + nu] * U[4 * sn + mu] * U[4 * sn + nu];
    }
    return A;
  }
  stapleU1(s, mu) {
    const U = this.U, up = this.up, dn = this.dn; let ar = 0, ai = 0;
    const smu = up[4 * s + mu];
    for (let nu = 0; nu < 4; nu++) {
      if (nu === mu) continue;
      const snu = up[4 * s + nu], sn = dn[4 * s + nu], smn = dn[4 * smu + nu];
      const a1 = U[4 * smu + nu] - U[4 * snu + mu] - U[4 * s + nu];
      const a2 = -U[4 * smn + nu] - U[4 * sn + mu] + U[4 * sn + nu];
      ar += Math.cos(a1) + Math.cos(a2); ai += Math.sin(a1) + Math.sin(a2);
    }
    this.A[0] = ar; this.A[1] = ai;
  }
  stapleSU2(s, mu) {
    const U = this.U, up = this.up, dn = this.dn, A = this.A;
    let A0 = 0, A1 = 0, A2 = 0, A3 = 0;
    const smu = up[4 * s + mu];
    for (let nu = 0; nu < 4; nu++) {
      if (nu === mu) continue;
      const snu = up[4 * s + nu], sn = dn[4 * s + nu], smn = dn[4 * smu + nu];
      // upper: U_ν(s+μ) U_μ(s+ν)† U_ν(s)†
      let o = 4 * (4 * smu + nu); const a0 = U[o], a1 = U[o + 1], a2 = U[o + 2], a3 = U[o + 3];
      o = 4 * (4 * snu + mu); const b0 = U[o], b1 = -U[o + 1], b2 = -U[o + 2], b3 = -U[o + 3];
      o = 4 * (4 * s + nu); const c0 = U[o], c1 = -U[o + 1], c2 = -U[o + 2], c3 = -U[o + 3];
      let d0 = a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3;
      let d1 = a0 * b1 + b0 * a1 - (a2 * b3 - a3 * b2);
      let d2 = a0 * b2 + b0 * a2 - (a3 * b1 - a1 * b3);
      let d3 = a0 * b3 + b0 * a3 - (a1 * b2 - a2 * b1);
      A0 += d0 * c0 - d1 * c1 - d2 * c2 - d3 * c3;
      A1 += d0 * c1 + c0 * d1 - (d2 * c3 - d3 * c2);
      A2 += d0 * c2 + c0 * d2 - (d3 * c1 - d1 * c3);
      A3 += d0 * c3 + c0 * d3 - (d1 * c2 - d2 * c1);
      // lower: U_ν(s+μ-ν)† U_μ(s-ν)† U_ν(s-ν)
      o = 4 * (4 * smn + nu); const e0 = U[o], e1 = -U[o + 1], e2 = -U[o + 2], e3 = -U[o + 3];
      o = 4 * (4 * sn + mu); const f0 = U[o], f1 = -U[o + 1], f2 = -U[o + 2], f3 = -U[o + 3];
      o = 4 * (4 * sn + nu); const g0 = U[o], g1 = U[o + 1], g2 = U[o + 2], g3 = U[o + 3];
      d0 = e0 * f0 - e1 * f1 - e2 * f2 - e3 * f3;
      d1 = e0 * f1 + f0 * e1 - (e2 * f3 - e3 * f2);
      d2 = e0 * f2 + f0 * e2 - (e3 * f1 - e1 * f3);
      d3 = e0 * f3 + f0 * e3 - (e1 * f2 - e2 * f1);
      A0 += d0 * g0 - d1 * g1 - d2 * g2 - d3 * g3;
      A1 += d0 * g1 + g0 * d1 - (d2 * g3 - d3 * g2);
      A2 += d0 * g2 + g0 * d2 - (d3 * g1 - d1 * g3);
      A3 += d0 * g3 + g0 * d3 - (d1 * g2 - d2 * g1);
    }
    A[0] = A0; A[1] = A1; A[2] = A2; A[3] = A3;
  }
  stapleSU3(s, mu) {
    const U = this.U, up = this.up, dn = this.dn, A = this.A, T1 = this.T1, T2 = this.T2;
    A.fill(0);
    const smu = up[4 * s + mu];
    for (let nu = 0; nu < 4; nu++) {
      if (nu === mu) continue;
      const snu = up[4 * s + nu], sn = dn[4 * s + nu], smn = dn[4 * smu + nu];
      m3mulD(U, 18 * (4 * smu + nu), U, 18 * (4 * snu + mu), T1, 0);
      m3mulD(T1, 0, U, 18 * (4 * s + nu), T2, 0);
      for (let k = 0; k < 18; k++) A[k] += T2[k];
      m3mul(U, 18 * (4 * sn + mu), U, 18 * (4 * smn + nu), T1, 0);
      m3Dmul(T1, 0, U, 18 * (4 * sn + nu), T2, 0);
      for (let k = 0; k < 18; k++) A[k] += T2[k];
    }
  }
  /* ---- updates ---- */
  heatbath(beta) {
    const U = this.U, n = this.V * 4, g = this.group, A = this.A;
    for (let l = 0; l < n; l++) {
      const s = l >> 2, mu = l & 3;
      if (g === "Z2") { const a = this.stapleZ2(s, mu); U[l] = rand() < 1 / (1 + Math.exp(-2 * beta * a)) ? 1 : -1; }
      else if (g === "U1") { this.stapleU1(s, mu); U[l] = wrap(-Math.atan2(A[1], A[0]) + vonMises(beta * Math.hypot(A[0], A[1]))); }
      else if (g === "SU2") {
        this.stapleSU2(s, mu);
        const k = Math.hypot(A[0], A[1], A[2], A[3]), o = 4 * l;
        if (k < 1e-12) continue;
        const v0 = A[0] / k, v1 = A[1] / k, v2 = A[2] / k, v3 = A[3] / k;
        const x0 = su2x0(beta * k), r = Math.sqrt(Math.max(0, 1 - x0 * x0));
        const ct = 2 * rand() - 1, st = Math.sqrt(1 - ct * ct), ph = TAU * rand();
        const x1 = r * st * Math.cos(ph), x2 = r * st * Math.sin(ph), x3 = r * ct;
        // U = X V†
        const b1 = -v1, b2 = -v2, b3 = -v3;
        U[o]     = x0 * v0 - x1 * b1 - x2 * b2 - x3 * b3;
        U[o + 1] = x0 * b1 + v0 * x1 - (x2 * b3 - x3 * b2);
        U[o + 2] = x0 * b2 + v0 * x2 - (x3 * b1 - x1 * b3);
        U[o + 3] = x0 * b3 + v0 * x3 - (x1 * b2 - x2 * b1);
      } else { this.stapleSU3(s, mu); this.su3Sub(18 * l, beta, false); }
    }
    if (g === "SU3") this.reunit();
  }
  overrelax() {
    const U = this.U, n = this.V * 4, g = this.group, A = this.A;
    if (g === "Z2") return;
    for (let l = 0; l < n; l++) {
      const s = l >> 2, mu = l & 3;
      if (g === "U1") { this.stapleU1(s, mu); if (A[0] * A[0] + A[1] * A[1] > 1e-20) U[l] = wrap(-2 * Math.atan2(A[1], A[0]) - U[l]); }
      else if (g === "SU2") {
        this.stapleSU2(s, mu);
        const k = Math.hypot(A[0], A[1], A[2], A[3]), o = 4 * l; if (k < 1e-12) continue;
        // U' = V† U† V†
        const v0 = A[0] / k, v1 = -A[1] / k, v2 = -A[2] / k, v3 = -A[3] / k;
        const u0 = U[o], u1 = -U[o + 1], u2 = -U[o + 2], u3 = -U[o + 3];
        const d0 = v0 * u0 - v1 * u1 - v2 * u2 - v3 * u3;
        const d1 = v0 * u1 + u0 * v1 - (v2 * u3 - v3 * u2);
        const d2 = v0 * u2 + u0 * v2 - (v3 * u1 - v1 * u3);
        const d3 = v0 * u3 + u0 * v3 - (v1 * u2 - v2 * u1);
        U[o]     = d0 * v0 - d1 * v1 - d2 * v2 - d3 * v3;
        U[o + 1] = d0 * v1 + v0 * d1 - (d2 * v3 - d3 * v2);
        U[o + 2] = d0 * v2 + v0 * d2 - (d3 * v1 - d1 * v3);
        U[o + 3] = d0 * v3 + v0 * d3 - (d1 * v2 - d2 * v1);
      } else { this.stapleSU3(s, mu); this.su3Sub(18 * l, 0, true); }
    }
    if (g === "SU3") this.reunit();
  }
  // Cabibbo–Marinari: heat bath (or overrelaxation) in the three SU(2) subgroups of SU(3)
  su3Sub(o, beta, over) {
    const U = this.U, A = this.A;
    for (let sg = 0; sg < 3; sg++) {
      const i = sg === 2 ? 0 : sg, j = sg === 0 ? 1 : 2;
      // 2×2 block of W = U A at rows/cols (i, j)
      let w = [0, 0, 0, 0, 0, 0, 0, 0];   // (ii, ij, ji, jj) as (re, im)
      const rows = [i, j], cols = [i, j];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        let re = 0, im = 0;
        for (let k = 0; k < 3; k++) {
          const ur = U[o + 6 * rows[a] + 2 * k], ui = U[o + 6 * rows[a] + 2 * k + 1];
          const ar = A[6 * k + 2 * cols[b]], ai = A[6 * k + 2 * cols[b] + 1];
          re += ur * ar - ui * ai; im += ur * ai + ui * ar;
        }
        w[4 * a + 2 * b] = re; w[4 * a + 2 * b + 1] = im;
      }
      // SU(2)-proportional part: a0 + i a·σ
      let a0 = (w[0] + w[6]) / 2, a3 = (w[1] - w[7]) / 2, a1 = (w[3] + w[5]) / 2, a2 = (w[2] - w[4]) / 2;
      const k = Math.hypot(a0, a1, a2, a3); if (k < 1e-12) continue;
      a0 /= k; a1 /= k; a2 /= k; a3 /= k;
      let r0, r1, r2, r3;
      if (over) {            // R = (V†)²
        r0 = a0 * a0 - a1 * a1 - a2 * a2 - a3 * a3; r1 = -2 * a0 * a1; r2 = -2 * a0 * a2; r3 = -2 * a0 * a3;
      } else {               // R = X V†, X ∝ sqrt(1-x0²) exp((2β/3) k x0)
        const x0 = su2x0(2 * beta * k / 3), rr = Math.sqrt(Math.max(0, 1 - x0 * x0));
        const ct = 2 * rand() - 1, st = Math.sqrt(1 - ct * ct), ph = TAU * rand();
        const x1 = rr * st * Math.cos(ph), x2 = rr * st * Math.sin(ph), x3 = rr * ct;
        const b1 = -a1, b2 = -a2, b3 = -a3;
        r0 = x0 * a0 - x1 * b1 - x2 * b2 - x3 * b3;
        r1 = x0 * b1 + a0 * x1 - (x2 * b3 - x3 * b2);
        r2 = x0 * b2 + a0 * x2 - (x3 * b1 - x1 * b3);
        r3 = x0 * b3 + a0 * x3 - (x1 * b2 - x2 * b1);
      }
      // R as 2×2: [[r0 + i r3, r2 + i r1], [-r2 + i r1, r0 - i r3]];  U ← R U on rows i, j
      for (let c = 0; c < 3; c++) {
        const pr = U[o + 6 * i + 2 * c], pi = U[o + 6 * i + 2 * c + 1], qr = U[o + 6 * j + 2 * c], qi = U[o + 6 * j + 2 * c + 1];
        U[o + 6 * i + 2 * c]     = r0 * pr - r3 * pi + r2 * qr - r1 * qi;
        U[o + 6 * i + 2 * c + 1] = r0 * pi + r3 * pr + r2 * qi + r1 * qr;
        U[o + 6 * j + 2 * c]     = -r2 * pr - r1 * pi + r0 * qr + r3 * qi;
        U[o + 6 * j + 2 * c + 1] = -r2 * pi + r1 * pr + r0 * qi - r3 * qr;
      }
    }
  }
  reunit() { if (this.group === "SU3") for (let l = 0; l < this.V * 4; l++) su3Reunit(this.U, 18 * l); }
  update(beta, nor = 2) { this.heatbath(beta); for (let k = 0; k < nor; k++) this.overrelax(); }
  /* ---- observables ---- */
  plaqAt(s, mu, nu) {    // (1/N) Re Tr U_μν(s)
    const U = this.U, up = this.up, g = this.group;
    const smu = up[4 * s + mu], snu = up[4 * s + nu];
    if (g === "Z2") return U[4 * s + mu] * U[4 * smu + nu] * U[4 * snu + mu] * U[4 * s + nu];
    if (g === "U1") return Math.cos(U[4 * s + mu] + U[4 * smu + nu] - U[4 * snu + mu] - U[4 * s + nu]);
    if (g === "SU2") {
      let o = 4 * (4 * s + mu); const a0 = U[o], a1 = U[o + 1], a2 = U[o + 2], a3 = U[o + 3];
      o = 4 * (4 * smu + nu); const b0 = U[o], b1 = U[o + 1], b2 = U[o + 2], b3 = U[o + 3];
      o = 4 * (4 * s + nu); const c0 = U[o], c1 = U[o + 1], c2 = U[o + 2], c3 = U[o + 3];
      o = 4 * (4 * snu + mu); const d0 = U[o], d1 = U[o + 1], d2 = U[o + 2], d3 = U[o + 3];
      // ½Tr[(U_μ(s) U_ν(s+μ)) (U_ν(s) U_μ(s+ν))†] = (p · q) for quaternions p, q
      const p0 = a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3, p1 = a0 * b1 + b0 * a1 - (a2 * b3 - a3 * b2),
            p2 = a0 * b2 + b0 * a2 - (a3 * b1 - a1 * b3), p3 = a0 * b3 + b0 * a3 - (a1 * b2 - a2 * b1);
      const q0 = c0 * d0 - c1 * d1 - c2 * d2 - c3 * d3, q1 = c0 * d1 + d0 * c1 - (c2 * d3 - c3 * d2),
            q2 = c0 * d2 + d0 * c2 - (c3 * d1 - c1 * d3), q3 = c0 * d3 + d0 * c3 - (c1 * d2 - c2 * d1);
      return p0 * q0 + p1 * q1 + p2 * q2 + p3 * q3;
    }
    const T1 = this.T1, T2 = this.T2;
    m3mul(U, 18 * (4 * s + mu), U, 18 * (4 * smu + nu), T1, 0);
    m3mul(U, 18 * (4 * s + nu), U, 18 * (4 * snu + mu), T2, 0);
    let re = 0; for (let k = 0; k < 18; k += 2) re += T1[k] * T2[k] + T1[k + 1] * T2[k + 1];
    return re / 3;
  }
  plaquette() {
    let sum = 0;
    for (let s = 0; s < this.V; s++) for (let mu = 0; mu < 3; mu++) for (let nu = mu + 1; nu < 4; nu++) sum += this.plaqAt(s, mu, nu);
    return sum / (6 * this.V);
  }
  // Action density 1 − (1/6) Σ_{μ<ν} P_μν(s) on every site, laid out as a mosaic of
  // x–y slices: tile column z, tile row t.  out has (Ls·Ls) × (Ls·Lt) entries.
  mosaic(out) {
    const Ls = this.Ls, W = Ls * Ls;
    for (let t = 0; t < this.Lt; t++) for (let z = 0; z < Ls; z++) for (let y = 0; y < Ls; y++) for (let x = 0; x < Ls; x++) {
      const s = x + Ls * (y + Ls * (z + Ls * t)); let p = 0;
      for (let mu = 0; mu < 3; mu++) for (let nu = mu + 1; nu < 4; nu++) p += this.plaqAt(s, mu, nu);
      out[(t * Ls + y) * W + z * Ls + x] = 1 - p / 6;
    }
    return out;
  }
  // Random gauge transformation U_μ(s) → g(s) U_μ(s) g(s+μ)†.  Leaves every plaquette unchanged.
  randomGauge() {
    const U = this.U, V = this.V, g = this.group, nc = this.nc;
    if (g === "Z2" || g === "U1") {
      const G = new Float64Array(V);
      for (let s = 0; s < V; s++) G[s] = g === "Z2" ? (rand() < 0.5 ? 1 : -1) : TAU * rand();
      for (let s = 0; s < V; s++) for (let mu = 0; mu < 4; mu++) {
        const l = 4 * s + mu, t = this.up[l];
        U[l] = g === "Z2" ? G[s] * U[l] * G[t] : wrap(U[l] + G[s] - G[t]);
      }
      return;
    }
    const G = new Float64Array(V * nc), T = new Float64Array(nc);
    for (let s = 0; s < V; s++) {
      const o = s * nc;
      if (g === "SU2") { const q = [randn(), randn(), randn(), randn()], r = Math.hypot(...q); for (let k = 0; k < 4; k++) G[o + k] = q[k] / r; }
      else { for (let k = 0; k < 12; k++) G[o + k] = randn(); su3Reunit(G, o); }
    }
    const qmul = (a0, a1, a2, a3, b0, b1, b2, b3, out) => {
      out[0] = a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3;
      out[1] = a0 * b1 + b0 * a1 - (a2 * b3 - a3 * b2);
      out[2] = a0 * b2 + b0 * a2 - (a3 * b1 - a1 * b3);
      out[3] = a0 * b3 + b0 * a3 - (a1 * b2 - a2 * b1);
    };
    const tmp = new Float64Array(4);
    for (let s = 0; s < V; s++) for (let mu = 0; mu < 4; mu++) {
      const l = 4 * s + mu, t = this.up[l], o = l * nc;
      if (g === "SU2") {
        qmul(G[4 * s], G[4 * s + 1], G[4 * s + 2], G[4 * s + 3], U[o], U[o + 1], U[o + 2], U[o + 3], tmp);
        qmul(tmp[0], tmp[1], tmp[2], tmp[3], G[4 * t], -G[4 * t + 1], -G[4 * t + 2], -G[4 * t + 3], tmp);
        for (let k = 0; k < 4; k++) U[o + k] = tmp[k];
      } else {
        m3mul(G, 18 * s, U, o, T, 0);
        m3mulD(T, 0, G, 18 * t, U, o);
      }
    }
  }
  // spatially averaged Polyakov loop (1/N) Tr Π_t U_t(x, t), as [re, im]
  polyakov() {
    const U = this.U, Ls = this.Ls, Vs = Ls * Ls * Ls, g = this.group; let re = 0, im = 0;
    const P = new Float64Array(18), Q = new Float64Array(18);
    for (let xs = 0; xs < Vs; xs++) {
      if (g === "Z2") { let p = 1; for (let t = 0; t < this.Lt; t++) p *= U[4 * (xs + Vs * t) + 3]; re += p; }
      else if (g === "U1") { let a = 0; for (let t = 0; t < this.Lt; t++) a += U[4 * (xs + Vs * t) + 3]; re += Math.cos(a); im += Math.sin(a); }
      else if (g === "SU2") {
        let p0 = 1, p1 = 0, p2 = 0, p3 = 0;
        for (let t = 0; t < this.Lt; t++) {
          const o = 4 * (4 * (xs + Vs * t) + 3), b0 = U[o], b1 = U[o + 1], b2 = U[o + 2], b3 = U[o + 3];
          const n0 = p0 * b0 - p1 * b1 - p2 * b2 - p3 * b3, n1 = p0 * b1 + b0 * p1 - (p2 * b3 - p3 * b2),
                n2 = p0 * b2 + b0 * p2 - (p3 * b1 - p1 * b3), n3 = p0 * b3 + b0 * p3 - (p1 * b2 - p2 * b1);
          p0 = n0; p1 = n1; p2 = n2; p3 = n3;
        }
        re += p0;
      } else {
        for (let k = 0; k < 18; k++) P[k] = U[18 * (4 * xs + 3) + k];
        for (let t = 1; t < this.Lt; t++) { m3mul(P, 0, U, 18 * (4 * (xs + Vs * t) + 3), Q, 0); P.set(Q); }
        re += (P[0] + P[8] + P[16]) / 3; im += (P[1] + P[9] + P[17]) / 3;
      }
    }
    return [re / Vs, im / Vs];
  }
  // centre transformation: multiply every time link on one time slice by z = exp(2πik/N)
  centerFlip(k) {
    const U = this.U, Vs = this.Ls ** 3, g = this.group;
    for (let xs = 0; xs < Vs; xs++) {
      const l = 4 * xs + 3;
      if (g === "Z2") U[l] *= -1;
      else if (g === "SU2") for (let c = 0; c < 4; c++) U[4 * l + c] *= -1;
      else if (g === "SU3") {
        const zr = Math.cos(TAU * k / 3), zi = Math.sin(TAU * k / 3);
        for (let c = 0; c < 9; c++) { const o = 18 * l + 2 * c, r = U[o], i = U[o + 1]; U[o] = zr * r - zi * i; U[o + 1] = zr * i + zi * r; }
      }
    }
  }
}
LFT.Gauge4D = Gauge4D;

/* =====================================================================
   1D φ⁴ chain with an HMC trajectory that can be advanced one leapfrog
   step at a time (for animation).  Same action as Phi4, one dimension:
   S = Σ_x [ -2κ φ_x φ_{x+1} + φ_x² + λ(φ_x² - 1)² ]
   ===================================================================== */
class Phi4Chain {
  constructor(N) {
    this.N = N; this.phi = new Float64Array(N); this.pi = new Float64Array(N);
    this.F = new Float64Array(N); this.old = new Float64Array(N);
    this.kappa = 0.45; this.lambda = 1; this.eps = 0.1; this.nmd = 20;
    this.k = -1; this.H0 = 0; this.nacc = 0; this.ntraj = 0;
    for (let i = 0; i < N; i++) this.phi[i] = 1 + 0.2 * randn();
  }
  action() {
    const p = this.phi, N = this.N, k = this.kappa, l = this.lambda; let S = 0;
    for (let i = 0; i < N; i++) { const x = p[i], x2 = x * x; S += -2 * k * x * p[(i + 1) % N] + x2 + l * (x2 - 1) * (x2 - 1); }
    return S;
  }
  kinetic() { let K = 0; for (let i = 0; i < this.N; i++) K += this.pi[i] * this.pi[i]; return 0.5 * K; }
  force() {
    const p = this.phi, F = this.F, N = this.N, k = this.kappa, l = this.lambda;
    for (let i = 0; i < N; i++) { const x = p[i]; F[i] = 2 * k * (p[(i + 1) % N] + p[(i + N - 1) % N]) - 2 * x - 4 * l * x * (x * x - 1); }
  }
  begin() {                                   // momentum refresh
    this.old.set(this.phi);
    for (let i = 0; i < this.N; i++) this.pi[i] = randn();
    this.force(); this.H0 = this.kinetic() + this.action(); this.k = 0;
  }
  step() {                                    // one kick–drift–kick leapfrog step
    const N = this.N, p = this.phi, pi = this.pi, F = this.F, h = 0.5 * this.eps;
    for (let i = 0; i < N; i++) pi[i] += h * F[i];
    for (let i = 0; i < N; i++) p[i] += this.eps * pi[i];
    this.force();
    for (let i = 0; i < N; i++) pi[i] += h * F[i];
    this.k++;
    return this.kinetic() + this.action();
  }
  end() {                                     // Metropolis test on ΔH
    const dH = this.kinetic() + this.action() - this.H0;
    const ok = Number.isFinite(dH) && (dH <= 0 || rand() < Math.exp(-dH));
    if (!ok) this.phi.set(this.old);
    this.ntraj++; if (ok) this.nacc++;
    this.k = -1;
    return { ok, dH };
  }
  trajectory() { this.begin(); while (this.k < this.nmd) this.step(); return this.end(); }
}
LFT.Phi4Chain = Phi4Chain;

/* ---------- block spins (majority rule, random tie-break) ---------- */
LFT.blockSpin = function (s, L, b, out) {
  const M = L / b;
  for (let Y = 0; Y < M; Y++) for (let X = 0; X < M; X++) {
    let sum = 0;
    for (let dy = 0; dy < b; dy++) for (let dx = 0; dx < b; dx++) sum += s[(Y * b + dy) * L + X * b + dx];
    out[Y * M + X] = sum > 0 ? 1 : sum < 0 ? -1 : (rand() < 0.5 ? 1 : -1);
  }
  return out;
};

/* ---------- autocorrelation and integrated autocorrelation time ---------- */
LFT.autocorr = function (x, maxLag) {
  const n = x.length; let mu = 0; for (let i = 0; i < n; i++) mu += x[i]; mu /= n;
  let v = 0; for (let i = 0; i < n; i++) v += (x[i] - mu) * (x[i] - mu); v /= n;
  const T = Math.min(maxLag, n - 1), rho = new Float64Array(T + 1);
  if (v <= 0) { rho[0] = 1; return rho; }
  for (let t = 0; t <= T; t++) { let s = 0; for (let i = 0; i + t < n; i++) s += (x[i] - mu) * (x[i + t] - mu); rho[t] = s / ((n - t) * v); }
  return rho;
};
// τ_int = 1/2 + Σ_{t=1}^{W} ρ(t), with the automatic window W ≥ c·τ_int(W) (Madras & Sokal 1988)
LFT.tauInt = function (rho, c = 6) {
  let tau = 0.5;
  for (let W = 1; W < rho.length; W++) { tau += rho[W]; if (W >= c * tau) return { tau, W, ok: true }; }
  return { tau, W: rho.length - 1, ok: false };
};

/* ---------- exact facts about the 2D q-state Potts model at β_c ---------- */
// mean critical energy per site −(1 + 1/√q); for q > 4 the transition is first order with
// latent heat 2(1 + 1/√q) tanh(Θ/2) Π_n tanh²(nΘ), 2 cosh Θ = √q  (Baxter 1973)
LFT.pottsCritical = function (q) {
  const ec = -(1 + 1 / Math.sqrt(q));
  if (q <= 4) return { ec, latent: 0, eOrd: ec, eDis: ec };
  const th = Math.acosh(Math.sqrt(q) / 2); let prod = 1;
  for (let n = 1; n < 200; n++) prod *= Math.tanh(n * th) ** 2;
  const latent = 2 * (1 + 1 / Math.sqrt(q)) * Math.tanh(th / 2) * prod;
  return { ec, latent, eOrd: ec - latent / 2, eDis: ec + latent / 2 };
};

/* =====================================================================
   Toy "topological freezing" landscape: sectors centred at integers with
   barriers between them that grow with β.  Used to compare a local chain
   with an independence sampler built from a learned approximation q(x).
   ===================================================================== */
LFT.ToyTopo = {
  U(x, beta) { return x * x / (2 * 1.6 * 1.6) + beta * (1 - Math.cos(TAU * x)) / 2; },
  logp(x, beta) { return -this.U(x, beta); },
  // q(x): mixture of Gaussians at the integers; quality ∈ [0,1] controls the width match
  q(beta, quality) {
    const w = 1 / (TAU * Math.sqrt(Math.max(beta, 0.3)));            // true well width
    const sd = w * (1 + 2.5 * (1 - quality)), cs = [], ws = [];
    for (let k = -4; k <= 4; k++) { cs.push(k); ws.push(Math.exp(-k * k / (2 * 1.6 * 1.6 * (0.6 + 0.4 * quality)))); }
    const Z = ws.reduce((a, b) => a + b, 0);
    return {
      sample() { let r = rand() * Z, i = 0; while (i < ws.length - 1 && r >= ws[i]) { r -= ws[i]; i++; } return cs[i] + sd * randn(); },
      logq(x) { let s = 0; for (let i = 0; i < cs.length; i++) s += ws[i] / Z * Math.exp(-0.5 * ((x - cs[i]) / sd) ** 2) / (sd * Math.sqrt(TAU)); return Math.log(s + 1e-300); }
    };
  }
};
})(typeof window !== "undefined" ? window : globalThis);
