/* Rare-event engines shared by the talk and the blog. Pure simulation code, no DOM.
   Every engine has an exact (or independently computed) reference answer; tests/check-engines.js checks them.

   1. Toy "summer": daily AR(1) temperature anomalies. Season mean A = (1/T) sum_j X_j is exactly Gaussian.
      - brute force (independent seasons)
      - GKTL cloning (Giardina-Kurchan-Tailleur-Lecomte; Ragone, Wouters & Bouchet 2018)
      - optimal control / Doob transform (zero-variance tilt, known in closed form for this model)
   2. Double-well "tipping" model: adaptive multilevel splitting (AMS; Cerou & Guyader 2007), exact committor by quadrature.
   3. Statistics of extremes: GEV sampling, L-moment fit (Hosking 1985/1990), bootstrap return levels.
   4. Lorenz 1963 ensembles (RK4). */
(function (root) {
  'use strict';

  // ---------- seeded random numbers ----------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed) {
    const u = mulberry32(seed || 1);
    let spare = null;
    return {
      u,
      normal() {
        if (spare !== null) { const s = spare; spare = null; return s; }
        let x, y, s;
        do { x = 2 * u() - 1; y = 2 * u() - 1; s = x * x + y * y; } while (s >= 1 || s === 0);
        const m = Math.sqrt(-2 * Math.log(s) / s);
        spare = y * m; return x * m;
      },
      int(n) { return Math.floor(u() * n); }
    };
  }

  // ---------- special functions ----------
  // complementary error function (Numerical Recipes erfcc; fractional error < 1.2e-7 everywhere, so far tails stay accurate)
  function erfc(x) {
    const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
      t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  const normSf = (z) => 0.5 * erfc(z / Math.SQRT2);          // P(Z > z)
  function normIsf(p) {                                        // z with P(Z > z) = p (bisection on normSf; robust in far tails)
    let lo = -40, hi = 40;
    for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi); if (normSf(m) > p) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  }
  function lgamma(x) {                                         // Lanczos (g = 7, n = 9)
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1; let a = c[0]; const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  const gamma = (x) => (x < 0.5 ? Math.PI / (Math.sin(Math.PI * x) * Math.exp(lgamma(1 - x))) : Math.exp(lgamma(x)));

  // =====================================================================================
  // 1. Toy summer: X_{j+1} = rho X_j + sqrt(1 - rho^2) xi_j, X_0 ~ N(0,1) (stationary), season days j = 1..T.
  //    A = (1/T) sum_{j=1}^T X_j  ~  N(0, s^2) exactly.
  // =====================================================================================
  function seasonVar(rho, T) {
    let s = T;
    for (let m = 1; m < T; m++) s += 2 * (T - m) * Math.pow(rho, m);
    return s / (T * T);
  }
  function seasonExact(rho, T) {
    const s = Math.sqrt(seasonVar(rho, T));
    return {
      s,
      prob: (a) => normSf(a / s),                 // P(A > a)
      level: (p) => s * normIsf(p),               // a with P(A > a) = p
      returnTime: (a) => 1 / normSf(a / s)        // one season per year
    };
  }

  // Weighted tail estimates from final samples: p(a) = sum_{A_n >= a} w_n / N. Returns points sorted by A, descending.
  function tailCurve(A, logw) {
    const N = A.length, idx = A.map((_, i) => i).sort((i, j) => A[j] - A[i]);
    let m = -Infinity; for (const l of logw) m = Math.max(m, l);
    const out = []; let acc = 0;
    for (const i of idx) { acc += Math.exp(logw[i] - m); out.push({ a: A[i], p: acc * Math.exp(m) / N }); }
    return out;
  }
  function tailProb(A, logw, a) {
    let m = -Infinity; for (const l of logw) m = Math.max(m, l);
    let s = 0; for (let i = 0; i < A.length; i++) if (A[i] > a) s += Math.exp(logw[i] - m);
    return s * Math.exp(m) / A.length;
  }

  // Brute force: N independent seasons. Returns {paths, A, logw (all zero)}.
  function seasonBrute(o) {
    const { N, T, rho, seed } = o, r = rng(seed), q = Math.sqrt(1 - rho * rho);
    const paths = [], A = [];
    for (let n = 0; n < N; n++) {
      let x = r.normal(); const p = new Float64Array(T + 1); p[0] = x; let s = 0;
      for (let j = 1; j <= T; j++) { x = rho * x + q * r.normal(); p[j] = x; s += x; }
      paths.push(p); A.push(s / T);
    }
    return { paths, A, logw: new Array(N).fill(0) };
  }

  // GKTL cloning. Tilt exp(k sum_j X_j) = exp(k T A), applied piecewise: every tau days each trajectory gets
  // W_n = exp(k * sum of X over the last tau days), R_i = mean_n W_n, and the population is resampled (systematic).
  // Estimator (Feynman-Kac form of Ragone et al. 2018): E_0[O] = prod_i R_i * mean_n O(X_n) exp(-k T A_n), with the
  // population resampled after every segment. We skip the last resampling and keep its weights instead (same mean, less noise):
  // log w_n = sum_{i<m} log R_i + log W_n^(m) - k T A_n.  Steppable so a canvas can animate it: call step() once per day.
  function seasonGKTL(o) {
    const { N, T, rho, k, tau, seed } = o, r = rng(seed), q = Math.sqrt(1 - rho * rho);
    const paths = [];
    for (let n = 0; n < N; n++) { const p = new Float64Array(T + 1); p[0] = r.normal(); paths.push(p); }
    const st = { day: 0, logZ: 0, logZpre: 0, lastLogW: null, events: [], paths, done: false, nResample: 0 };
    let segSum = new Float64Array(N);
    st.step = function () {
      if (st.done) return;
      const d = ++st.day;
      for (let n = 0; n < N; n++) { const p = st.paths[n]; const x = rho * p[d - 1] + q * r.normal(); p[d] = x; segSum[n] += x; }
      if (d % tau === 0 || d === T) {
        // weights for the segment just finished
        let m = -Infinity; const lw = new Float64Array(N);
        for (let n = 0; n < N; n++) { lw[n] = k * segSum[n]; m = Math.max(m, lw[n]); }
        let tot = 0; const w = new Float64Array(N);
        for (let n = 0; n < N; n++) { w[n] = Math.exp(lw[n] - m); tot += w[n]; }
        st.logZpre = st.logZ;
        st.logZ += m + Math.log(tot / N);
        if (d === T) st.lastLogW = lw;
        if (d < T) {
          // systematic resampling: offspring counts are E[c_n] = N w_n / sum w
          const off = new Int32Array(N); const u0 = r.u() / N; let c = 0, acc = w[0] / tot;
          for (let i = 0; i < N; i++) { const ui = u0 + i / N; while (ui > acc && c < N - 1) { c++; acc += w[c] / tot; } off[c]++; }
          const np = [], anc = [];
          for (let n = 0; n < N; n++) for (let j = 0; j < off[n]; j++) { np.push(j === 0 ? st.paths[n] : Float64Array.from(st.paths[n])); anc.push(n); }
          st.events.push({ day: d, anc, off: Array.from(off) });
          st.paths = np; st.nResample++;
        }
        segSum = new Float64Array(N);
      }
      if (d === T) st.done = true;
    };
    st.run = function () { while (!st.done) st.step(); return st; };
    st.result = function () {
      const A = st.paths.map(p => { let s = 0; for (let j = 1; j <= T; j++) s += p[j]; return s / T; });
      const logw = A.map((a, n) => st.logZpre + st.lastLogW[n] - k * T * a);
      return { A, logw, logZ: st.logZ };
    };
    return st;
  }
  // log of the exact normalizer Z(k) = E_0[exp(k T A)] = exp(k^2 T^2 s^2 / 2)
  const seasonLogZ = (rho, T, k) => 0.5 * k * k * T * T * seasonVar(rho, T);

  // Optimal control (Doob transform). For this linear-Gaussian model the tilted path measure is again Gaussian:
  // phi_j(x) = E[exp(k sum_{i>j} X_i) | X_j = x] = exp(k c_j x + const), c_j = rho (1 - rho^(T-j)) / (1 - rho),
  // so the zero-variance dynamics is the same AR(1) plus a known drift: X_{j+1} = rho X_j + (1-rho^2) k (1 + c_{j+1}) + q xi,
  // and X_0 ~ N(k c_0, 1). Each path then has weight Z exp(-k T A) with the exact Z.
  function seasonControl(o) {
    const { N, T, rho, k, seed } = o, r = rng(seed), q = Math.sqrt(1 - rho * rho);
    const c = (j) => rho * (1 - Math.pow(rho, T - j)) / (1 - rho);
    const logZ = seasonLogZ(rho, T, k), paths = [], A = [];
    for (let n = 0; n < N; n++) {
      let x = k * c(0) + r.normal(); const p = new Float64Array(T + 1); p[0] = x; let s = 0;
      for (let j = 1; j <= T; j++) { x = rho * x + (1 - rho * rho) * k * (1 + c(j)) + q * r.normal(); p[j] = x; s += x; }
      paths.push(p); A.push(s / T);
    }
    return { paths, A, logw: A.map(a => logZ - k * T * a), logZ };
  }

  // =====================================================================================
  // 1b. A heatwave at a fixed date: the event is the mean of the last W days of a T-day run, A = (1/W) sum_{j>T-W} X_j.
  //     Resampling ensembles steered by a score theta_t (a "guide"); the weight at each resampling time is
  //     G = exp(C (theta_t - theta_prev)), theta_0 = 0, and the score at the final time is the event itself, so along every
  //     lineage the weights telescope to exp(C A): the estimator  E[O] = prod R * mean O(X) exp(-C A)  is unbiased for ANY guide.
  //     guide: 'running' = the W-day mean so far (standard rare-event sampling, steers by the heat seen so far);
  //            'forecast' = an emulator's forecast E_emu[A | path so far] (AI-boosted: steers by where the run is heading).
  //     The emulator is an AR(1) with its own persistence rhoE and amplitude sE (an imperfect model of the physics).
  //     heatEmu = direct sampling of the emulator itself (cheap, but its climate is not the physics' climate).
  // =====================================================================================
  function heatExact(rho, T, W) { const s = Math.sqrt(seasonVar(rho, W)); return { s, prob: (a) => normSf(a / s), level: (p) => s * normIsf(p) }; }
  function heatScoreFn(o) {
    const { T, W } = o, t0 = T - W;              // window days t0+1 .. T
    if (o.guide === 'running') return (p, t) => { let s = 0, n = 0; for (let j = Math.max(1, t - W + 1); j <= t; j++) { s += p[j]; n++; } return n ? s / W : 0; };
    const rE = o.rhoE === undefined ? o.rho : o.rhoE, sE = o.sE || 1;
    return (p, t) => {                             // emulator forecast of the event given the path up to day t
      let s = 0; for (let j = Math.max(t0 + 1, 1); j <= t; j++) s += p[j];
      let g = 0; for (let j = Math.max(t + 1, t0 + 1); j <= T; j++) g += Math.pow(rE, j - t);
      return (s + sE * p[t] * g) / W + (o.biasE || 0) * (T - t) / T;
    };
  }
  function heatRES(o) {
    const { N, T, rho, tau, C, seed } = o, r = rng(seed), q = Math.sqrt(1 - rho * rho), score = heatScoreFn(o);
    let paths = [], th = new Float64Array(N);
    for (let n = 0; n < N; n++) { const p = new Float64Array(T + 1); p[0] = r.normal(); paths.push(p); }
    let logZpre = 0, lastLogW = null;
    for (let d = 1; d <= T; d++) {
      for (let n = 0; n < N; n++) { const p = paths[n]; p[d] = rho * p[d - 1] + q * r.normal(); }
      if (d % tau !== 0 && d !== T) continue;
      const lw = new Float64Array(N), thNew = new Float64Array(N); let m = -Infinity;
      for (let n = 0; n < N; n++) { thNew[n] = score(paths[n], d); lw[n] = C * (thNew[n] - th[n]); m = Math.max(m, lw[n]); }
      if (d === T) { lastLogW = lw; break; }
      let tot = 0; const w = new Float64Array(N); for (let n = 0; n < N; n++) { w[n] = Math.exp(lw[n] - m); tot += w[n]; }
      logZpre += m + Math.log(tot / N);
      const off = new Int32Array(N); const u0 = r.u() / N; let c = 0, acc = w[0] / tot;
      for (let i = 0; i < N; i++) { const ui = u0 + i / N; while (ui > acc && c < N - 1) { c++; acc += w[c] / tot; } off[c]++; }
      const np = [], nth = new Float64Array(N); let idx = 0;
      for (let n = 0; n < N; n++) for (let j = 0; j < off[n]; j++) { np.push(j === 0 ? paths[n] : Float64Array.from(paths[n])); nth[idx++] = thNew[n]; }
      paths = np; th = nth;
    }
    const A = paths.map(p => { let s = 0; for (let j = T - o.W + 1; j <= T; j++) s += p[j]; return s / o.W; });
    return { A, logw: A.map((a, n) => logZpre + lastLogW[n] - C * a), paths };
  }
  function heatEmu(o) {                            // direct sampling of the emulator: AR(1) with rhoE, amplitude sE
    const { N, T, W, seed } = o, r = rng(seed), rE = o.rhoE, sE = o.sE || 1, q = Math.sqrt(1 - rE * rE), A = [];
    for (let n = 0; n < N; n++) { let x = r.normal(), s = 0; for (let j = 1; j <= T; j++) { x = rE * x + q * r.normal(); if (j > T - W) s += x; } A.push(sE * s / W + (o.biasE || 0)); }
    return { A, logw: new Array(N).fill(0) };
  }

  // =====================================================================================
  // 2. Double-well tipping model: dX = -U'(X) dt + sqrt(2 eps) dW, U(x) = x^4/4 - x^2/2.
  //    p = P_{x0}(reach b before a). Exact: int_a^x0 e^{U/eps} / int_a^b e^{U/eps}.
  // =====================================================================================
  const dwU = (x) => 0.25 * x * x * x * x - 0.5 * x * x;
  const dwF = (x) => x - x * x * x;                     // -U'(x)
  function dwCommittor(x0, a, b, eps) {
    const n = 20000, f = (y) => Math.exp((dwU(y) - dwU(0)) / eps);
    const simpson = (lo, hi) => { const h = (hi - lo) / n; let s = f(lo) + f(hi); for (let i = 1; i < n; i++) s += f(lo + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
    return simpson(a, x0) / simpson(a, b);
  }
  // simulate from x until x <= a or x >= b; returns array of positions (including start)
  function dwRun(r, x, a, b, eps, dt, maxSteps) {
    const out = [x], sd = Math.sqrt(2 * eps * dt);
    for (let i = 0; i < maxSteps; i++) {
      x = x + dwF(x) * dt + sd * r.normal(); out.push(x);
      if (x <= a || x >= b) break;
    }
    return out;
  }
  function dwBrute(o) {                                  // fraction of N independent runs that reach b first
    const { N, x0, a, b, eps, dt, seed } = o, r = rng(seed); let hit = 0;
    for (let n = 0; n < N; n++) { const p = dwRun(r, x0, a, b, eps, dt, 1e7); if (p[p.length - 1] >= b) hit++; }
    return hit / N;
  }
  // Adaptive multilevel splitting with reaction coordinate xi(x) = x (generalized estimator of Brehier et al. 2016:
  // at iteration q every replica whose maximum is <= the current minimum level is killed (K_q of them) and replaced by a
  // copy of a surviving replica, branched at its first crossing of that level; p_hat = prod_q (1 - K_q/N) * (#reached b)/N).
  function dwAMS(o) {
    const { N, x0, a, b, eps, dt, seed } = o, r = rng(seed), maxIter = o.maxIter || 100000;
    const reps = [];
    const mk = (path) => { let m = -Infinity; for (const x of path) m = Math.max(m, x); return { path, max: m }; };
    for (let n = 0; n < N; n++) reps.push(mk(dwRun(r, x0, a, b, eps, dt, 1e7)));
    const st = { reps, logP: 0, iter: 0, done: false, level: -Infinity, history: [] };
    st.step = function () {
      if (st.done) return;
      let z = Infinity; for (const p of st.reps) z = Math.min(z, p.max);
      if (z >= b || st.iter >= maxIter) { st.done = true; return; }
      const killed = [], alive = [];
      st.reps.forEach((p, i) => (p.max <= z ? killed : alive).push(i));
      if (alive.length === 0) { st.logP = -Infinity; st.done = true; return; }
      st.logP += Math.log(1 - killed.length / N);
      st.level = z; st.iter++;
      for (const i of killed) {
        const src = st.reps[alive[r.int(alive.length)]].path;
        let j = 0; while (src[j] <= z) j++;                // first index strictly above the level
        const head = Array.prototype.slice.call(src, 0, j + 1);
        const tail = dwRun(r, src[j], a, b, eps, dt, 1e7);
        const path = head.concat(tail.slice(1));
        if (src[j] >= b) path.length = j + 1;              // the branch point already lies in B
        st.reps[i] = mk(path); st.reps[i].branch = j; st.reps[i].from = z;
      }
      st.history.push({ level: z, K: killed.length, logP: st.logP });
    };
    st.estimate = function () {
      let hit = 0; for (const p of st.reps) if (p.path[p.path.length - 1] >= b) hit++;
      return Math.exp(st.logP) * hit / N;
    };
    st.run = function () { while (!st.done) st.step(); return st; };
    return st;
  }

  // =====================================================================================
  // 3. Statistics of extremes (GEV with shape xi: F(x) = exp(-(1 + xi (x - mu)/sigma)^(-1/xi)))
  // =====================================================================================
  function gevQuantile(F, mu, sigma, xi) { const y = -Math.log(F); return Math.abs(xi) < 1e-9 ? mu - sigma * Math.log(y) : mu + sigma * (Math.pow(y, -xi) - 1) / xi; }
  const gevReturnLevel = (R, mu, sigma, xi) => gevQuantile(1 - 1 / R, mu, sigma, xi);
  function gevSample(r, n, mu, sigma, xi) { const out = []; for (let i = 0; i < n; i++) out.push(gevQuantile(Math.max(1e-300, r.u()), mu, sigma, xi)); return out; }
  // L-moment fit (Hosking, Wallis & Wood 1985). Hosking's shape k = -xi.
  function gevFitLmom(x) {
    const s = Array.from(x).sort((p, q) => p - q), n = s.length;
    let b0 = 0, b1 = 0, b2 = 0;
    for (let j = 0; j < n; j++) { b0 += s[j]; b1 += s[j] * j / (n - 1); b2 += s[j] * j * (j - 1) / ((n - 1) * (n - 2)); }
    b0 /= n; b1 /= n; b2 /= n;
    const l1 = b0, l2 = 2 * b1 - b0, l3 = 6 * b2 - 6 * b1 + b0, t3 = l3 / l2;
    const c = 2 / (3 + t3) - Math.LN2 / Math.log(3);
    let kk = 7.8590 * c + 2.9554 * c * c;
    if (Math.abs(kk) < 1e-6) kk = 1e-6;
    const sigma = l2 * kk / ((1 - Math.pow(2, -kk)) * gamma(1 + kk));
    const mu = l1 - sigma * (1 - gamma(1 + kk)) / kk;
    return { mu, sigma, xi: -kk };
  }
  function gevBootstrap(r, x, Rs, B) {                  // percentile bootstrap of return levels
    const n = x.length, levels = Rs.map(() => []);
    for (let bI = 0; bI < B; bI++) {
      const y = []; for (let i = 0; i < n; i++) y.push(x[r.int(n)]);
      const f = gevFitLmom(y);
      Rs.forEach((R, i) => levels[i].push(gevReturnLevel(R, f.mu, f.sigma, f.xi)));
    }
    const qt = (arr, p) => { const s = arr.slice().sort((u, v) => u - v); const h = (s.length - 1) * p, l = Math.floor(h); return s[l] + (s[Math.min(l + 1, s.length - 1)] - s[l]) * (h - l); };
    return Rs.map((R, i) => ({ R, lo: qt(levels[i], 0.05), hi: qt(levels[i], 0.95), med: qt(levels[i], 0.5) }));
  }

  // =====================================================================================
  // 4. Lorenz 1963
  // =====================================================================================
  function lorenzStep(s, dt, sigma = 10, rr = 28, beta = 8 / 3) {
    const f = (x, y, z) => [sigma * (y - x), x * (rr - z) - y, x * y - beta * z];
    const [x, y, z] = s;
    const k1 = f(x, y, z), k2 = f(x + 0.5 * dt * k1[0], y + 0.5 * dt * k1[1], z + 0.5 * dt * k1[2]);
    const k3 = f(x + 0.5 * dt * k2[0], y + 0.5 * dt * k2[1], z + 0.5 * dt * k2[2]), k4 = f(x + dt * k3[0], y + dt * k3[1], z + dt * k3[2]);
    return [x + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), y + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), z + dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
  }

  const RE = { rng, erfc, normSf, normIsf, gamma, lgamma,
    seasonVar, seasonExact, seasonBrute, seasonGKTL, seasonControl, seasonLogZ, tailCurve, tailProb,
    heatExact, heatRES, heatEmu,
    dwU, dwF, dwCommittor, dwRun, dwBrute, dwAMS,
    gevQuantile, gevReturnLevel, gevSample, gevFitLmom, gevBootstrap, lorenzStep };
  if (typeof module !== 'undefined' && module.exports) module.exports = RE;
  root.RE = RE;
})(typeof window !== 'undefined' ? window : globalThis);
