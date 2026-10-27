/* linalg.js — small dense linear algebra for the quantum-chemistry engines (browser and Node):
   symmetric eigensolver (Householder tridiagonalization + implicit QL, after JAMA/EISPACK tred2/tql2),
   generalized symmetric eigenproblems F C = S C e by canonical orthogonalization, and helpers.
   Matrices are row-major Float64Arrays of size n*n; eigenvectors are returned as columns: V[i*n + k]. */
(function (G) {
'use strict';
const QC = G.QC = G.QC || {};

// eigenvalues ascending; vectors V[i*n+k] = component i of eigenvector k
function symEig(A, n) {
  const V = new Array(n), d = new Float64Array(n), e = new Float64Array(n);
  for (let i = 0; i < n; i++) { V[i] = new Float64Array(n); for (let j = 0; j < n; j++) V[i][j] = A[i * n + j]; }
  // tred2: Householder reduction to tridiagonal form
  for (let j = 0; j < n; j++) d[j] = V[n - 1][j];
  for (let i = n - 1; i > 0; i--) {
    let scale = 0, h = 0;
    for (let k = 0; k < i; k++) scale += Math.abs(d[k]);
    if (scale === 0) {
      e[i] = d[i - 1];
      for (let j = 0; j < i; j++) { d[j] = V[i - 1][j]; V[i][j] = 0; V[j][i] = 0; }
    } else {
      for (let k = 0; k < i; k++) { d[k] /= scale; h += d[k] * d[k]; }
      let f = d[i - 1], g = Math.sqrt(h);
      if (f > 0) g = -g;
      e[i] = scale * g; h -= f * g; d[i - 1] = f - g;
      for (let j = 0; j < i; j++) e[j] = 0;
      for (let j = 0; j < i; j++) {
        f = d[j]; V[j][i] = f; g = e[j] + V[j][j] * f;
        for (let k = j + 1; k <= i - 1; k++) { g += V[k][j] * d[k]; e[k] += V[k][j] * f; }
        e[j] = g;
      }
      f = 0;
      for (let j = 0; j < i; j++) { e[j] /= h; f += e[j] * d[j]; }
      const hh = f / (h + h);
      for (let j = 0; j < i; j++) e[j] -= hh * d[j];
      for (let j = 0; j < i; j++) {
        f = d[j]; g = e[j];
        for (let k = j; k <= i - 1; k++) V[k][j] -= (f * e[k] + g * d[k]);
        d[j] = V[i - 1][j]; V[i][j] = 0;
      }
    }
    d[i] = h;
  }
  for (let i = 0; i < n - 1; i++) {
    V[n - 1][i] = V[i][i]; V[i][i] = 1;
    const h = d[i + 1];
    if (h !== 0) {
      for (let k = 0; k <= i; k++) d[k] = V[k][i + 1] / h;
      for (let j = 0; j <= i; j++) {
        let g = 0;
        for (let k = 0; k <= i; k++) g += V[k][i + 1] * V[k][j];
        for (let k = 0; k <= i; k++) V[k][j] -= g * d[k];
      }
    }
    for (let k = 0; k <= i; k++) V[k][i + 1] = 0;
  }
  for (let j = 0; j < n; j++) { d[j] = V[n - 1][j]; V[n - 1][j] = 0; }
  V[n - 1][n - 1] = 1; e[0] = 0;
  // tql2: implicit QL on the tridiagonal matrix
  for (let i = 1; i < n; i++) e[i - 1] = e[i];
  e[n - 1] = 0;
  let f = 0, tst1 = 0;
  const eps = Math.pow(2, -52);
  for (let l = 0; l < n; l++) {
    tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
    let m = l;
    while (m < n) { if (Math.abs(e[m]) <= eps * tst1) break; m++; }
    if (m > l) {
      let iter = 0;
      do {
        if (++iter > 200) throw new Error('symEig: no convergence');
        let g = d[l], p = (d[l + 1] - g) / (2 * e[l]), r = Math.hypot(p, 1);
        if (p < 0) r = -r;
        d[l] = e[l] / (p + r); d[l + 1] = e[l] * (p + r);
        const dl1 = d[l + 1];
        let h = g - d[l];
        for (let i = l + 2; i < n; i++) d[i] -= h;
        f += h;
        p = d[m];
        let c = 1, c2 = c, c3 = c, s = 0, s2 = 0;
        const el1 = e[l + 1];
        for (let i = m - 1; i >= l; i--) {
          c3 = c2; c2 = c; s2 = s;
          g = c * e[i]; h = c * p; r = Math.hypot(p, e[i]);
          e[i + 1] = s * r; s = e[i] / r; c = p / r;
          p = c * d[i] - s * g;
          d[i + 1] = h + s * (c * g + s * d[i]);
          for (let k = 0; k < n; k++) { h = V[k][i + 1]; V[k][i + 1] = s * V[k][i] + c * h; V[k][i] = c * V[k][i] - s * h; }
        }
        p = -s * s2 * c3 * el1 * e[l] / dl1;
        e[l] = s * p; d[l] = c * p;
      } while (Math.abs(e[l]) > eps * tst1);
    }
    d[l] += f; e[l] = 0;
  }
  // sort ascending
  for (let i = 0; i < n - 1; i++) {
    let k = i, p = d[i];
    for (let j = i + 1; j < n; j++) if (d[j] < p) { k = j; p = d[j]; }
    if (k !== i) { d[k] = d[i]; d[i] = p; for (let j = 0; j < n; j++) { const t = V[j][i]; V[j][i] = V[j][k]; V[j][k] = t; } }
  }
  const out = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) out[i * n + k] = V[i][k];
  return { values: d, vectors: out };
}
QC.symEig = symEig;

// canonical orthogonalizer X (n × m) with X^T S X = 1, dropping overlap eigenvalues below tol
function orthogonalizer(S, n, tol = 1e-10) {
  const { values, vectors } = symEig(S, n);
  const keep = [];
  for (let k = 0; k < n; k++) if (values[k] > tol * values[n - 1]) keep.push(k);
  const m = keep.length, X = new Float64Array(n * m);
  keep.forEach((k, c) => { const s = 1 / Math.sqrt(values[k]); for (let i = 0; i < n; i++) X[i * m + c] = vectors[i * n + k] * s; });
  return { X, n, m };
}
QC.orthogonalizer = orthogonalizer;

// solve F C = S C e given an orthogonalizer; C is n × m (columns), e ascending
function genEig(F, orth) {
  const { X, n, m } = orth, T = new Float64Array(n * m), Fp = new Float64Array(m * m);
  for (let i = 0; i < n; i++) for (let c = 0; c < m; c++) { let s = 0; for (let k = 0; k < n; k++) s += F[i * n + k] * X[k * m + c]; T[i * m + c] = s; }
  for (let a = 0; a < m; a++) for (let b = a; b < m; b++) { let s = 0; for (let i = 0; i < n; i++) s += X[i * m + a] * T[i * m + b]; Fp[a * m + b] = s; Fp[b * m + a] = s; }
  const { values, vectors } = symEig(Fp, m), C = new Float64Array(n * m);
  for (let i = 0; i < n; i++) for (let k = 0; k < m; k++) { let s = 0; for (let a = 0; a < m; a++) s += X[i * m + a] * vectors[a * m + k]; C[i * m + k] = s; }
  return { e: values, C, n, m };
}
QC.genEig = genEig;

// Pulay DIIS on a list of (vector, error) pairs; returns extrapolated vector
function makeDIIS(maxVec = 8) {
  const vecs = [], errs = [];
  return {
    push(v, e) { vecs.push(Float64Array.from(v)); errs.push(Float64Array.from(e)); if (vecs.length > maxVec) { vecs.shift(); errs.shift(); } },
    extrapolate() {
      const k = vecs.length; if (k < 2) return vecs[k - 1];
      const B = new Float64Array((k + 1) * (k + 1)), rhs = new Float64Array(k + 1);
      for (let i = 0; i < k; i++) for (let j = 0; j <= i; j++) { let s = 0; const a = errs[i], b = errs[j]; for (let t = 0; t < a.length; t++) s += a[t] * b[t]; B[i * (k + 1) + j] = B[j * (k + 1) + i] = s; }
      for (let i = 0; i < k; i++) { B[i * (k + 1) + k] = B[k * (k + 1) + i] = -1; }
      rhs[k] = -1;
      const c = solveLinear(B, rhs, k + 1);
      if (!c) return vecs[k - 1];
      const out = new Float64Array(vecs[0].length);
      for (let i = 0; i < k; i++) { const v = vecs[i], w = c[i]; for (let t = 0; t < out.length; t++) out[t] += w * v[t]; }
      return out;
    },
    reset() { vecs.length = 0; errs.length = 0; }
  };
}
QC.makeDIIS = makeDIIS;

// Gaussian elimination with partial pivoting; returns null if singular
function solveLinear(A, b, n) {
  const M = Float64Array.from(A), x = Float64Array.from(b);
  for (let c = 0; c < n; c++) {
    let p = c, mx = Math.abs(M[c * n + c]);
    for (let r = c + 1; r < n; r++) { const v = Math.abs(M[r * n + c]); if (v > mx) { mx = v; p = r; } }
    if (mx < 1e-300) return null;
    if (p !== c) { for (let k = 0; k < n; k++) { const t = M[c * n + k]; M[c * n + k] = M[p * n + k]; M[p * n + k] = t; } const t = x[c]; x[c] = x[p]; x[p] = t; }
    for (let r = c + 1; r < n; r++) { const f = M[r * n + c] / M[c * n + c]; if (f === 0) continue; for (let k = c; k < n; k++) M[r * n + k] -= f * M[c * n + k]; x[r] -= f * x[c]; }
  }
  for (let r = n - 1; r >= 0; r--) { let s = x[r]; for (let k = r + 1; k < n; k++) s -= M[r * n + k] * x[k]; x[r] = s / M[r * n + r]; }
  return x;
}
QC.solveLinear = solveLinear;
})(typeof window !== 'undefined' ? window : globalThis);
