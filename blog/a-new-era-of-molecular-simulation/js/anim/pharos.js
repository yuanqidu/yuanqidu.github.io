/* Pharos teaser animations (rare events by stochastic optimal control).
   pharosControl: plain vs controlled overdamped Langevin dynamics on a 2D two-basin toy landscape. The committor q is
                  solved from the backward Kolmogorov equation on a grid; the control is u* = sigma^T grad log q.
                  Steps: 0 plain dynamics · 1 committor · 2 controlled paths · 3 replay buffer, and -1 = an intro view with
                  the reference process of the samplers (sampled stochastic bridges between noise and samples).
                  data-opts {"map": [-1, 0, 2, 2]} translates the slide's click number into these steps.
   pharosHCN:     schematic of the first step of HCN chemistry in water, CN- + HCN -> NC-CH=N- (states by C-C distance). */
(function () {
  'use strict';
  const { C, rgba, mix, E, atom, roundRect, arrow, text, makeRng, wiggle } = U;

  // ------------------------------------------------------------------
  // The toy: dX = -grad U dt + sqrt(2 kT) dW on a curved double well, barrier 7.5 kT.
  // Committor: L q = 0 outside A and B, q = 0 on A, q = 1 on B, discretized as a reversible jump process on the grid
  // (sum_j w_ij (q_j - q_i) = 0 with w_ij = exp(-beta (U_i + U_j) / 2)) and solved coarse-to-fine by SOR.
  // ------------------------------------------------------------------
  function makeToy() {
    const H = 1, beta = 7.5, kT = 1 / beta, AS = 0.42;
    const XMIN = -1.9, XMAX = 1.9, YMIN = -1.3, YMAX = 1.3;
    const Kf = (x) => 4.5 + 1.75 * (1 + Math.tanh(2 * x)), dKf = (x) => 3.5 / Math.cosh(2 * x) ** 2;
    const sf = (x) => AS * Math.sin(Math.PI * x), dsf = (x) => AS * Math.PI * Math.cos(Math.PI * x);
    function Uf(x, y) { const d = y - sf(x); return H * (x * x - 1) ** 2 + 0.5 * Kf(x) * d * d; }
    function grad(x, y) { const d = y - sf(x), K = Kf(x); return [4 * H * x * (x * x - 1) + 0.5 * dKf(x) * d * d - K * d * dsf(x), K * d]; }
    const A = { x: -1, y: 0, rx: 0.30, ry: 0.36 }, B = { x: 1, y: 0, rx: 0.26, ry: 0.30 };
    const inA = (x, y) => ((x - A.x) / A.rx) ** 2 + ((y - A.y) / A.ry) ** 2 < 1, inB = (x, y) => ((x - B.x) / B.rx) ** 2 + ((y - B.y) / B.ry) ** 2 < 1;
    function solve(nx, ny, init, sweeps) {
      const hx = (XMAX - XMIN) / (nx - 1), hy = (YMAX - YMIN) / (ny - 1), q = new Float64Array(nx * ny), e = new Float64Array(nx * ny), fix = new Uint8Array(nx * ny), u = new Float64Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = XMIN + i * hx, y = YMIN + j * hy, k = j * nx + i; u[k] = Uf(x, y); e[k] = Math.exp(-0.5 * beta * Math.min(u[k], 40 * kT));
        if (inA(x, y)) { fix[k] = 1; q[k] = 0; } else if (inB(x, y)) { fix[k] = 1; q[k] = 1; } else q[k] = init(x, y);
      }
      for (let s = 0; s < sweeps; s++) {
        let res = 0;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const k = j * nx + i; if (fix[k]) continue;
          let num = 0, den = 0;
          if (i > 0) { num += e[k - 1] * q[k - 1]; den += e[k - 1]; } if (i < nx - 1) { num += e[k + 1] * q[k + 1]; den += e[k + 1]; }
          if (j > 0) { num += e[k - nx] * q[k - nx]; den += e[k - nx]; } if (j < ny - 1) { num += e[k + nx] * q[k + nx]; den += e[k + nx]; }
          const d = num / den - q[k]; q[k] += 1.92 * d; if (Math.abs(d) > res) res = Math.abs(d);
        }
        if (res < 1e-9) break;
      }
      return { nx, ny, hx, hy, q, u };
    }
    const bil = (g) => (x, y) => {
      const fx = Math.max(0, Math.min(g.nx - 1.001, (x - XMIN) / g.hx)), fy = Math.max(0, Math.min(g.ny - 1.001, (y - YMIN) / g.hy)), i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j, k = j * g.nx + i;
      return (1 - a) * (1 - b) * g.q[k] + a * (1 - b) * g.q[k + 1] + (1 - a) * b * g.q[k + g.nx] + a * b * g.q[k + g.nx + 1];
    };
    let g = solve(39, 27, (x) => 0.5 + 0.5 * Math.tanh(3 * x), 400);
    g = solve(77, 53, bil(g), 400);
    g = solve(153, 105, bil(g), 500);
    const qAt = bil(g);
    function qGrad(x, y) { // q and its gradient (bilinear on the grid)
      const fx = Math.max(0, Math.min(g.nx - 1.001, (x - XMIN) / g.hx)), fy = Math.max(0, Math.min(g.ny - 1.001, (y - YMIN) / g.hy)), i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j, k = j * g.nx + i;
      const q00 = g.q[k], q10 = g.q[k + 1], q01 = g.q[k + g.nx], q11 = g.q[k + g.nx + 1];
      return [(1 - a) * (1 - b) * q00 + a * (1 - b) * q10 + (1 - a) * b * q01 + a * b * q11, ((1 - b) * (q10 - q00) + b * (q11 - q01)) / g.hx, ((1 - a) * (q01 - q00) + a * (q11 - q10)) / g.hy];
    }
    const clampBox = (p) => { p[0] = Math.max(XMIN, Math.min(XMAX, p[0])); p[1] = Math.max(YMIN, Math.min(YMAX, p[1])); };
    // plain dynamics, one Euler–Maruyama step
    function stepPlain(p, dt, rng) { const [gx, gy] = grad(p[0], p[1]), s = Math.sqrt(2 * kT * dt); p[0] += -gx * dt + s * rng.normal(); p[1] += -gy * dt + s * rng.normal(); clampBox(p); }
    // controlled dynamics, drift -grad U + 2 kT grad log q; the local step keeps the noise small against the distance to q = 0.
    // Returns 0 while running, 1 on reaching B, -1 if it falls back to q = 0 (A).
    function stepCtrl(p, dtTot, rng) {
      let left = dtTot, n = 0;
      while (left > 1e-12 && n < 400) {
        const [gx, gy] = grad(p[0], p[1]), [q, qx, qy] = qGrad(p[0], p[1]);
        const d = Math.max(q, 1e-9) / (Math.hypot(qx, qy) + 1e-300), h = Math.min(left, Math.max(2e-6, (d / 4) ** 2 / (2 * kT)));
        const s = Math.sqrt(2 * kT * h), c = 2 * kT / Math.max(q, 1e-9);
        p[0] += (-gx + c * qx) * h + s * rng.normal(); p[1] += (-gy + c * qy) * h + s * rng.normal(); clampBox(p);
        left -= h; n++;
        if (inB(p[0], p[1])) return 1;
        if (qAt(p[0], p[1]) <= 1e-10) return -1;
      }
      return 0;
    }
    // where controlled paths start: a ring just outside A, weighted by exp(-beta U) q (the flux of paths that will reach B)
    const ring = (() => { const pts = [], w = []; let s = 0; for (let m = 0; m < 240; m++) { const th = 2 * Math.PI * m / 240, x = A.x + (A.rx + 0.05) * Math.cos(th), y = A.y + (A.ry + 0.05) * Math.sin(th), v = Math.exp(-beta * Uf(x, y)) * qAt(x, y); pts.push([x, y]); w.push(v); s += v; } return { pts, w: w.map(v => v / s) }; })();
    function startPoint(rng) { let u = rng.u(), k = 0; while (k < ring.w.length - 1 && u > ring.w[k]) { u -= ring.w[k]; k++; } return ring.pts[k].slice(); }
    return { beta, kT, XMIN, XMAX, YMIN, YMAX, Uf, grad, A, B, inA, inB, g, qAt, qGrad, stepPlain, stepCtrl, startPoint };
  }

  // marching squares: line segments [x1, y1, x2, y2, ...] of the level set f = level, in grid-index coordinates
  function contourSegs(f, nx, ny, level) {
    const out = [];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const k = j * nx + i, a = f[k] - level, b = f[k + 1] - level, c = f[k + nx + 1] - level, d = f[k + nx] - level;
      const idx = (a > 0 ? 1 : 0) | (b > 0 ? 2 : 0) | (c > 0 ? 4 : 0) | (d > 0 ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const AB = () => [i + a / (a - b), j], BC = () => [i + 1, j + b / (b - c)], DC = () => [i + d / (d - c), j + 1], AD = () => [i, j + a / (a - d)];
      const add = (p, q) => out.push(p[0], p[1], q[0], q[1]);
      switch (idx) {
        case 1: case 14: add(AB(), AD()); break;
        case 2: case 13: add(AB(), BC()); break;
        case 3: case 12: add(AD(), BC()); break;
        case 4: case 11: add(BC(), DC()); break;
        case 6: case 9: add(AB(), DC()); break;
        case 7: case 8: add(AD(), DC()); break;
        case 5: add(AB(), AD()); add(BC(), DC()); break;
        case 10: add(AB(), BC()); add(AD(), DC()); break;
      }
    }
    return out;
  }
  // join segments that share end points into polylines (for dashed drawing)
  function chain(segs) {
    const key = (x, y) => Math.round(x * 1e4) + ':' + Math.round(y * 1e4), n = segs.length / 4, used = new Uint8Array(n), ends = new Map();
    for (let s = 0; s < n; s++) for (const e of [0, 1]) { const k = key(segs[4 * s + 2 * e], segs[4 * s + 2 * e + 1]); if (!ends.has(k)) ends.set(k, []); ends.get(k).push(s); }
    const lines = [];
    for (let s0 = 0; s0 < n; s0++) {
      if (used[s0]) continue; used[s0] = 1;
      const line = [[segs[4 * s0], segs[4 * s0 + 1]], [segs[4 * s0 + 2], segs[4 * s0 + 3]]];
      for (const tail of [true, false]) for (;;) {
        const p = tail ? line[line.length - 1] : line[0], cand = (ends.get(key(p[0], p[1])) || []).find(s => !used[s]);
        if (cand === undefined) break; used[cand] = 1;
        const a = [segs[4 * cand], segs[4 * cand + 1]], b = [segs[4 * cand + 2], segs[4 * cand + 3]], nxt = key(a[0], a[1]) === key(p[0], p[1]) ? b : a;
        if (tail) line.push(nxt); else line.unshift(nxt);
      }
      lines.push(line);
    }
    return lines;
  }

  const QLO = '#3F61AB', QMID = '#F3EFE9', QHI = '#C5485A';
  const qColor = (q) => q < 0.5 ? mix(QLO, QMID, q * 2) : mix(QMID, QHI, q * 2 - 1);

  ANIMS.pharosControl = function (S, o) {
    const ctx = S.ctx, T = makeToy(), rngP = makeRng(o.seed || 12), rngC = makeRng((o.seed || 12) + 101);
    const PX = 14, PY = 50, PW = S.w - 28, PH = Math.round(PW * (T.YMAX - T.YMIN) / (T.XMAX - T.XMIN));
    const sx = (x) => PX + (x - T.XMIN) / (T.XMAX - T.XMIN) * PW, sy = (y) => PY + (T.YMAX - y) / (T.YMAX - T.YMIN) * PH;
    const DT = 0.002, SPEED = 0.55, EVERY_P = 3, EVERY_C = 4, SPAWN = 2.5; // drawn paths keep every 3rd / 4th step
    const stepOf = (k) => (o && o.map ? o.map[Math.max(0, Math.min(k, o.map.length - 1))] : k);
    let clock = 0, step = stepOf(0), acc = 0, tQ = -1, tI = 0, nextSpawn = 0, launched = 0, reachedB = 0, backA = 0, plainCross = 0;
    // intro view (step -1): stochastic bridges pinned at a noise draw (t = 0) and at a sample (t = N):
    // the straight interpolant between the two ends plus a sampled Brownian bridge, B_t = W_t - t W_1 with W from NB Gaussian increments
    const BR = (() => {
      const r = makeRng(77), rb = makeRng(78), K = 13, NB = 120, SIG = 0.8, paths = [], tgt = [[1.45, 0.42, 0.6], [-1.5, 0.48, 0.4]]; // mean, sd, weight of the two modes of the samples
      for (let k = 0; k < K; k++) {
        const x0 = 1.05 * r.normal(), m = r.u() < tgt[0][2] ? tgt[0] : tgt[1], xN = m[0] + m[1] * r.normal(), y = new Float64Array(NB + 1), w = new Float64Array(NB + 1);
        r.normal(); r.normal(); r.normal(); r.normal(); // keeps the stream, and so the end points, of the earlier smooth version
        for (let i = 1; i <= NB; i++) w[i] = w[i - 1] + rb.normal() / Math.sqrt(NB);
        for (let i = 0; i <= NB; i++) { const t = i / NB; y[i] = (1 - t) * x0 + t * xN + SIG * (w[i] - t * w[NB]); }
        paths.push(y);
      }
      return { K, NB, paths, tgt };
    })();
    function drawIntro() {
      const c = (clock - tI) % 13, X0 = PX + 150, X1 = PX + PW - 170, YA = PY + 64, YB = PY + PH - 104, lim = 3.1;
      const ty = (v) => YB - (Math.max(-lim, Math.min(lim, v)) + lim) / (2 * lim) * (YB - YA), tx = (i) => X0 + i / BR.NB * (X1 - X0);
      text(ctx, 'Neural samplers: a reference process we choose', PX + 2, 32, { size: 25, weight: 680, color: C.navy });
      roundRect(ctx, PX, PY, PW, PH, 12, '#fff', rgba(C.inkSoft, 0.5), 1.6);
      const dens = (f, x0, dir, scale, fill, stroke) => { ctx.beginPath(); ctx.moveTo(x0, ty(-lim)); for (let i = 0; i <= 120; i++) { const v = -lim + 2 * lim * i / 120; ctx.lineTo(x0 + dir * scale * f(v), ty(v)); } ctx.lineTo(x0, ty(lim)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2.2; ctx.stroke(); };
      const gs = (v, m, s) => Math.exp(-0.5 * ((v - m) / s) ** 2) / s;
      ctx.strokeStyle = rgba(C.inkSoft, 0.3); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, YA); ctx.lineTo(X0, YB); ctx.moveTo(X1, YA); ctx.lineTo(X1, YB); ctx.stroke();
      dens(v => gs(v, 0, 1.05), X0, -1, 92, rgba(C.muted, 0.3), rgba(C.inkSoft, 0.6));
      dens(v => BR.tgt[0][2] * gs(v, BR.tgt[0][0], BR.tgt[0][1]) + BR.tgt[1][2] * gs(v, BR.tgt[1][0], BR.tgt[1][1]), X1, 1, 80, rgba(C.coral, 0.16), C.coral);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      BR.paths.forEach((y, k) => { // each bridge is drawn from its sample back to its noise draw, then stays
        const u = E.clamp((c - 0.5 - 0.3 * k) / 0.9); if (u <= 0) return;
        const n = Math.max(1, Math.round(u * BR.NB));
        ctx.beginPath(); for (let i = BR.NB; i >= BR.NB - n; i--) { const X = tx(i), Y = ty(y[i]); if (i === BR.NB) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
        ctx.strokeStyle = rgba(C.blue, 0.78); ctx.lineWidth = 1.9; ctx.stroke();
        U.circle(ctx, tx(BR.NB), ty(y[BR.NB]), 6, C.tealDark, '#fff', 1.6);
        if (u >= 1) U.circle(ctx, tx(0), ty(y[0]), 5.5, C.muted, '#fff', 1.4); else U.circle(ctx, tx(BR.NB - n), ty(y[BR.NB - n]), 5, C.blue);
      });
      S.tex('t0', '$t=0$ · noise', X0, YB + 34, { size: 20, color: C.inkSoft, align: 'center' });
      S.tex('tN', '$t=N$ · samples', X1, YB + 34, { size: 20, color: C.inkSoft, align: 'center' });
      text(ctx, 'bridges between noise and samples', (X0 + X1) / 2, YB + 72, { size: 22, color: C.blue, weight: 650, align: 'center' });
      text(ctx, 'simple, known in closed form: nothing to simulate', PX + 2, PY + PH + 36, { size: 22, color: C.ink, weight: 600 });
    }
    const plain = [[-1.02, 0.06], [-0.94, -0.08], [-1.05, -0.05]].map(p => ({ p, trail: [], inB: false }));
    let ctrl = [], buffer = [];
    // level sets, once
    const g = T.g, uClamp = Float64Array.from(g.u, v => Math.min(v, 6));
    const uLevels = [0.12, 0.32, 0.56, 0.8, 1.0, 1.3, 1.75, 2.35, 3.1, 4.1].map(l => contourSegs(uClamp, g.nx, g.ny, l));
    const qHalf = chain(contourSegs(g.q, g.nx, g.ny, 0.5)).sort((a, b) => b.length - a.length)[0];
    const gx2s = (gi) => sx(T.XMIN + gi * g.hx), gy2s = (gj) => sy(T.YMIN + gj * g.hy);
    let layers = null, layerK = 0;
    function fieldImage(colorOf) { // one pixel per grid node, row 0 at the top
      const c = document.createElement('canvas'); c.width = g.nx; c.height = g.ny;
      const cc = c.getContext('2d'), img = cc.createImageData(g.nx, g.ny);
      for (let j = 0; j < g.ny; j++) for (let i = 0; i < g.nx; i++) { const k = (g.ny - 1 - j) * g.nx + i, rgb = U.hexToRgb(colorOf(k)), p = 4 * (j * g.nx + i); img.data[p] = rgb[0]; img.data[p + 1] = rgb[1]; img.data[p + 2] = rgb[2]; img.data[p + 3] = 255; }
      cc.putImageData(img, 0, 0); return c;
    }
    const imgE = fieldImage(k => mix('#8FA4BF', '#F6F4EF', Math.pow(E.clamp(g.u[k] / 2.6), 0.5)));
    const imgQ = fieldImage(k => qColor(g.q[k]));
    function buildLayers() {
      layerK = S.k; layers = [imgE, imgQ].map((img, which) => {
        const c = document.createElement('canvas'); c.width = Math.round(PW * S.k); c.height = Math.round(PH * S.k);
        const cc = c.getContext('2d'); cc.setTransform(S.k, 0, 0, S.k, 0, 0); cc.imageSmoothingEnabled = true; cc.imageSmoothingQuality = 'high';
        const cw = PW / (g.nx - 1), ch = PH / (g.ny - 1); cc.drawImage(img, -cw / 2, -ch / 2, PW + cw, PH + ch); // pixel centres on the grid nodes
        cc.strokeStyle = which ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)'; cc.lineWidth = 1.4; cc.beginPath();
        uLevels.forEach(segs => { for (let s = 0; s < segs.length; s += 4) { cc.moveTo(gx2s(segs[s]) - PX, gy2s(segs[s + 1]) - PY); cc.lineTo(gx2s(segs[s + 2]) - PX, gy2s(segs[s + 3]) - PY); } });
        cc.stroke(); return c;
      });
    }
    function spawn() { const p = T.startPoint(rngC); ctrl.push({ p, path: [p.slice()], state: 0, tEnd: 0, n: 0 }); launched++; }
    function simStep() {
      plain.forEach(w => { T.stepPlain(w.p, DT, rngP); w.n = (w.n || 0) + 1; if (w.n % EVERY_P === 0) { w.trail.push(w.p[0], w.p[1]); if (w.trail.length > 520) w.trail.splice(0, 2); } const b = T.inB(w.p[0], w.p[1]); if (b && !w.inB) plainCross++; if (b || T.inA(w.p[0], w.p[1])) w.inB = b; });
      ctrl.forEach(w => { if (w.state) return; const r = T.stepCtrl(w.p, DT, rngC); w.n++; if (r || w.n % EVERY_C === 0) w.path.push(w.p.slice()); if (r) { w.state = r; w.tEnd = clock; if (r > 0) reachedB++; else backA++; } });
    }
    function poly(pts, flat) { ctx.beginPath(); if (flat) for (let k = 0; k < pts.length; k += 2) { const X = sx(pts[k]), Y = sy(pts[k + 1]); if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } else pts.forEach((p, k) => { const X = sx(p[0]), Y = sy(p[1]); if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); }
    // Notation is typeset by KaTeX (S.tex, a layer over the canvas). The basin names are white with an outline in the basin's colour
    // (the canvas version stroked the letter): a ring of text shadows, 3 px wide, set with \htmlStyle (KaTeX runs with trust: true in U)
    const outline = (col) => Array.from({ length: 16 }, (_, k) => `${(3 * Math.cos(k * Math.PI / 8)).toFixed(1)}px ${(3 * Math.sin(k * Math.PI / 8)).toFixed(1)}px 0 ${col}`).join(',');
    const BASIN = { A: `$\\htmlStyle{text-shadow:${outline(C.navy)}}{A}$`, B: `$\\htmlStyle{text-shadow:${outline('#A8323F')}}{B}$` };
    function vecArrow(x, y, vx, vy, color) { const m = Math.hypot(vx, vy); if (m < 0.25) return; const len = 66 * (1 - Math.exp(-m / 2.5)), ux = vx / m, uy = -vy / m, a = E.clamp((m - 0.25) / 0.5); ctx.save(); ctx.globalAlpha *= a; arrow(ctx, x, y, x + ux * len, y + uy * len, 'rgba(255,255,255,0.9)', 7.5, 17); arrow(ctx, x, y, x + ux * len, y + uy * len, color, 3.6, 13); ctx.restore(); }
    function draw() {
      S.clear();
      if (step < 0) { drawIntro(); return; }
      if (!layers || layerK !== S.k) buildLayers();
      const aQ = step >= 1 ? E.smooth((clock - tQ) / 0.8) : 0, aC = step >= 2 ? 1 : 0;
      // caption above the panel
      const cap = step >= 3 ? 'Controlled paths fill the replay buffer' : step === 2 ? 'Controlled dynamics: steered across the barrier' : step === 1 ? 'The committor of this landscape' : null;
      if (cap) text(ctx, cap, PX + 2, 32, { size: 25, weight: 680, color: step >= 2 ? C.tealDark : C.navy });
      else S.tex('cap0', 'Physical dynamics: trapped in $A$', PX + 2, 32, { size: 25, weight: 680, color: C.navy });
      S.tex('bar', 'barrier $7.5\\,k_{\\mathrm B}T$', PX + PW - 2, 32, { size: 21, color: C.inkSoft, align: 'right' });
      // landscape, then the committor on top
      ctx.save(); roundRect(ctx, PX, PY, PW, PH, 12); ctx.clip();
      ctx.drawImage(layers[0], PX, PY, PW, PH);
      if (aQ > 0) { ctx.globalAlpha = aQ; ctx.drawImage(layers[1], PX, PY, PW, PH); ctx.globalAlpha = 1; }
      if (aQ > 0 && qHalf) { // q = 1/2
        ctx.save(); ctx.globalAlpha = aQ; ctx.lineCap = 'butt';
        ctx.beginPath(); qHalf.forEach((p, k) => { const X = gx2s(p[0]), Y = gy2s(p[1]); if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 5; ctx.stroke(); ctx.setLineDash([10, 8]); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.stroke(); ctx.restore();
      }
      // stored paths (replay buffer): the last six are drawn, the counter below has them all
      if (step >= 3) buffer.forEach(b => { poly(b); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = rgba(C.tealDark, 0.55); ctx.lineWidth = 1.3; ctx.stroke(); });
      // basins
      for (const [bs, col, name] of [[T.A, C.navy, 'A'], [T.B, '#A8323F', 'B']]) {
        ctx.beginPath(); ctx.ellipse(sx(bs.x), sy(bs.y), bs.rx * PW / (T.XMAX - T.XMIN), bs.ry * PH / (T.YMAX - T.YMIN), 0, 0, 2 * Math.PI);
        ctx.lineWidth = 4; ctx.strokeStyle = mix(col, '#FFFFFF', aQ); ctx.stroke();
        const sg = name === 'A' ? -1 : 1; // labels on the outer side of each basin, clear of the paths
        S.tex('basin' + name, BASIN[name], sx(bs.x + sg * bs.rx) + sg * 24, sy(bs.y) + 11, { size: 32, weight: 800, color: '#FFFFFF', align: 'center' });
      }
      // plain walkers
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      plain.forEach(w => { poly(w.trail, true); ctx.strokeStyle = 'rgba(255,255,255,0.72)'; ctx.lineWidth = 3.8; ctx.stroke(); ctx.strokeStyle = rgba(C.ink, 0.9); ctx.lineWidth = 1.7; ctx.stroke(); });
      plain.forEach(w => U.circle(ctx, sx(w.p[0]), sy(w.p[1]), 7.5, C.ink, '#fff', 2.5));
      // controlled walkers
      let lead = null;
      ctrl.forEach(w => {
        const a = w.state ? 1 - E.smooth((clock - w.tEnd - 1.6) / 1.2) : 1; if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = a; poly(w.path); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5.6; ctx.stroke(); ctx.strokeStyle = C.tealDark; ctx.lineWidth = 2.9; ctx.stroke();
        const s0 = w.path[0]; U.circle(ctx, sx(s0[0]), sy(s0[1]), 5, '#fff', C.tealDark, 2.5);
        U.circle(ctx, sx(w.p[0]), sy(w.p[1]), 8, C.teal, '#fff', 2.5); ctx.restore();
        if (!w.state) lead = w;
      });
      if (lead) { // physical force and control at the newest running path
        const [gx, gy] = T.grad(lead.p[0], lead.p[1]), [q, qx, qy] = T.qGrad(lead.p[0], lead.p[1]), c = 2 * T.kT / Math.max(q, 1e-9), X = sx(lead.p[0]), Y = sy(lead.p[1]);
        vecArrow(X, Y, -gx, -gy, C.ink); vecArrow(X, Y, c * qx, c * qy, C.teal);
        U.circle(ctx, X, Y, 8, C.teal, '#fff', 2.5);
      }
      ctx.restore();
      roundRect(ctx, PX, PY, PW, PH, 12, null, rgba(C.inkSoft, 0.5), 1.6);
      // q = 1/2 tag and colour bar
      if (aQ > 0 && qHalf) {
        const top = qHalf.reduce((b, p) => (Math.abs(gy2s(p[1]) - (PY + 62)) < Math.abs(gy2s(b[1]) - (PY + 62)) ? p : b), qHalf[0]);
        ctx.save(); ctx.globalAlpha = aQ; roundRect(ctx, gx2s(top[0]) + 12, PY + 42, 92, 38, 9, 'rgba(255,255,255,0.93)'); // room for the stacked fraction
        S.tex('qHalf', '$q=\\tfrac12$', gx2s(top[0]) + 58, PY + 67, { size: 22, color: C.ink, align: 'center', alpha: aQ });
        const bx = PX + PW - 306, by = PY + PH - 62; roundRect(ctx, bx, by, 290, 46, 10, 'rgba(255,255,255,0.93)');
        const gr = ctx.createLinearGradient(bx + 36, 0, bx + 150, 0); gr.addColorStop(0, QLO); gr.addColorStop(0.5, QMID); gr.addColorStop(1, QHI);
        ctx.fillStyle = gr; ctx.fillRect(bx + 36, by + 15, 114, 16); ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1; ctx.strokeRect(bx + 36, by + 15, 114, 16);
        text(ctx, '0', bx + 28, by + 30, { size: 19, color: C.inkSoft, align: 'right' }); text(ctx, '1', bx + 158, by + 30, { size: 19, color: C.inkSoft });
        text(ctx, 'committor', bx + 178, by + 30, { size: 19, color: C.ink, weight: 600 }); ctx.restore();
      }
      // legend
      const rows = aC ? 4 : 1, lx = PX + 16, lh = 30, ly = PY + PH - 16 - rows * lh - 10;
      roundRect(ctx, lx, ly, aC ? 232 : 206, rows * lh + 12, 10, 'rgba(255,255,255,0.93)');
      const line = (r, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lx + 14, ly + 21 + r * lh); ctx.lineTo(lx + 48, ly + 21 + r * lh); ctx.stroke(); };
      line(0, C.ink, 2.4); text(ctx, 'uncontrolled', lx + 60, ly + 28, { size: 19, color: C.ink });
      if (aC) {
        line(1, C.tealDark, 3.4); text(ctx, 'controlled', lx + 60, ly + 28 + lh, { size: 19, color: C.ink });
        arrow(ctx, lx + 12, ly + 21 + 2 * lh, lx + 50, ly + 21 + 2 * lh, C.ink, 3.2, 12); text(ctx, 'physical force', lx + 60, ly + 28 + 2 * lh, { size: 19, color: C.ink });
        arrow(ctx, lx + 12, ly + 21 + 3 * lh, lx + 50, ly + 21 + 3 * lh, C.teal, 3.2, 12); text(ctx, 'control', lx + 60, ly + 28 + 3 * lh, { size: 19, color: C.ink });
      }
      // counters below the panel
      const yb = PY + PH + 36;
      text(ctx, `uncontrolled: ${plain.length} paths · ${plainCross} crossing${plainCross === 1 ? '' : 's'}`, PX + 2, yb, { size: 22, color: C.ink, weight: 600 });
      if (aC) { // the counts change, so they stay canvas text; the basin's name is typeset once, to their right
        const bw = S.tex('cntB', '$B$', PX + PW - 2, yb, { size: 22, color: C.tealDark, weight: 650, align: 'right' }).w || 19;
        text(ctx, step >= 3 ? `replay buffer: ${reachedB + backA} controlled paths · ${reachedB} reached` : `controlled: ${launched} launched · ${reachedB} reached`, PX + PW - 2 - bw - 6, yb, { size: 22, color: C.tealDark, weight: 650, align: 'right' });
      }
    }
    return {
      frame(dt) {
        clock += dt;
        if (step >= 2 && clock >= nextSpawn && ctrl.filter(w => !w.state).length < 2) { spawn(); nextSpawn = clock + SPAWN; }
        acc += dt * SPEED; let n = 0; while (acc >= DT && n < 40) { simStep(); acc -= DT; n++; }
        // finished paths fade out; from the learning build on they are kept, thin, as the replay buffer
        ctrl = ctrl.filter(w => { if (w.state && clock - w.tEnd > 2.8) { buffer.push(w.path.filter((_, k) => k % 2 === 0 || k === w.path.length - 1)); if (buffer.length > 6) buffer.shift(); return false; } return true; });
        draw();
      },
      draw,
      enter() { tI = clock; },
      step(k) {
        k = stepOf(k);
        if (k < 0 && step >= 0) tI = clock;
        if (k >= 1 && step < 1) tQ = clock; if (k < 1) tQ = -1;
        if (k >= 2 && step < 2) nextSpawn = clock + 0.25;
        if (k < 2) { ctrl = []; buffer = []; launched = 0; reachedB = 0; backA = 0; }
        step = k;
      },
      ff: 9.6
    };
  };
  ANIMS.pharosControl.toy = makeToy; // for tests

  // ------------------------------------------------------------------
  // Schematic: cyanide adds to HCN in water, CN- + HCN -> NC-CH=N- (the HCN dimer anion). The states are those of the
  // paper's aqueous system: reactant C-C >= 3.00 A, product C-C <= 1.60 A. Not a simulation.
  // ------------------------------------------------------------------
  ANIMS.pharosHCN = function (S, o) {
    const ctx = S.ctx, rng = makeRng(o.seed || 4); let clock = 0;
    const CC = '#56616D', NC = C.blue, HC = '#CBD3DB', OC = '#D98A8A';
    const SC = 72, CY = 172, BH = 312, MID = S.w / 2 + 24, P = 9.5, T1 = 1.6, T2 = 4.6, T3 = 5.9; // px per angstrom; box height; cycle times
    const prog = (c) => c < T1 ? 0 : c < T2 ? 0.72 * E.inOut((c - T1) / (T2 - T1)) : c < T3 ? 0.72 + 0.28 * E.smooth((c - T2) / (T3 - T2)) : 1;
    const dist = (s) => 3.6 - 2.1 * s; // C–C distance in angstrom along the schematic path, 3.6 to 1.5
    // waters, kept clear of the reacting atoms, their path and the labels
    const segDist = (x, y, x0, x1, yy) => Math.hypot(x - Math.max(x0, Math.min(x1, x)), y - yy);
    const blocked = (x, y) => segDist(x, y, MID - 0.5 * 3.6 * SC - 1.16 * SC, MID + 0.5 * 3.6 * SC, CY - 8) < 78 || segDist(x, y, MID + 0.5 * 1.5 * SC, MID + 0.5 * 3.6 * SC + 20, CY - 6) < 132
      || (Math.abs(x - MID) < 260 && y > BH - 62) || (y < 58 && (x < 170 || x > S.w - 350));
    const waters = [];
    for (let k = 0; k < 900 && waters.length < 30; k++) {
      const x = 36 + rng.u() * (S.w - 72), y = 36 + rng.u() * (BH - 64);
      if (blocked(x, y) || waters.some(w => Math.hypot(w.x - x, w.y - y) < 54)) continue;
      waters.push({ x, y, a: rng.u() * 6.283, s: rng.u() * 40 });
    }
    function bond(a, b, order, alpha) {
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, px = -dy / L * 7, py = dx / L * 7;
      ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = rgba(CC, 0.85); ctx.lineWidth = 4.5; ctx.lineCap = 'round';
      for (const f of order >= 2.5 ? [-1, 0, 1] : order >= 1.5 ? [-0.55, 0.55] : [0]) { ctx.beginPath(); ctx.moveTo(a[0] + f * px, a[1] + f * py); ctx.lineTo(b[0] + f * px, b[1] + f * py); ctx.stroke(); }
      ctx.restore();
    }
    function water(w, t) {
      const x = w.x + 3 * wiggle(w.s, t * 1.3), y = w.y + 3 * wiggle(w.s + 9, t * 1.3), a = w.a + 0.3 * wiggle(w.s + 4, t * 0.8);
      ctx.save(); ctx.globalAlpha = 0.36;
      for (const sg of [-1, 1]) { const hx = x + 16 * Math.cos(a + sg * 0.91), hy = y + 16 * Math.sin(a + sg * 0.91); ctx.strokeStyle = rgba(CC, 0.6); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx, hy); ctx.stroke(); atom(ctx, hx, hy, 6, HC); }
      atom(ctx, x, y, 10.5, OC); ctx.restore();
    }
    function draw() {
      S.clear();
      const c = clock % P, s = prog(c), al = c > P - 0.6 ? E.smooth((P - c) / 0.6) : c < 0.5 ? E.smooth(c / 0.5) : 1;
      roundRect(ctx, 4, 4, S.w - 8, BH, 16, '#fff', rgba(C.inkSoft, 0.22), 1.5);
      waters.forEach(w => water(w, clock));
      text(ctx, 'schematic', 26, 38, { size: 19, color: C.muted });
      text(ctx, '64 explicit waters, a few shown', S.w - 26, 38, { size: 19, color: C.muted, align: 'right' });
      ctx.save(); ctx.globalAlpha = al;
      const d = dist(s) * SC, c1 = [MID - d / 2 + 2 * wiggle(1, clock * 2), CY + 2 * wiggle(2, clock * 2)], c2 = [MID + d / 2 + 2 * wiggle(3, clock * 2), CY + 2 * wiggle(4, clock * 2)];
      const n1 = [c1[0] - 1.16 * SC, c1[1]], thN = (73 - 13 * s) * Math.PI / 180, thH = (253 + 47 * s) * Math.PI / 180, form = E.smooth((s - 0.6) / 0.4);
      const rN = (1.16 + 0.12 * form) * SC, n2 = [c2[0] + rN * Math.cos(thN), c2[1] - rN * Math.sin(thN)], h = [c2[0] + 1.07 * SC * Math.cos(thH), c2[1] - 1.07 * SC * Math.sin(thH)];
      if (form > 0) bond(c1, c2, 1, form);
      if (form < 1) { ctx.save(); ctx.globalAlpha *= 1 - form; ctx.setLineDash([5, 8]); ctx.strokeStyle = rgba(C.coral, 0.8); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(c1[0] + 24, c1[1]); ctx.lineTo(c2[0] - 24, c2[1]); ctx.stroke(); ctx.restore(); }
      bond(n1, c1, 3, 1); bond(c2, n2, form > 0.5 ? 2 : 3, 1); bond(c2, h, 1, 1);
      atom(ctx, n1[0], n1[1], 21, NC); atom(ctx, c1[0], c1[1], 21, CC); atom(ctx, c2[0], c2[1], 21, CC); atom(ctx, n2[0], n2[1], 21, NC); atom(ctx, h[0], h[1], 12, HC);
      for (const [q, t] of [[n1, 'N'], [c1, 'C'], [c2, 'C'], [n2, 'N']]) text(ctx, t, q[0], q[1] + 7, { size: 20, weight: 750, color: '#fff', align: 'center' });
      // the negative charge moves from the cyanide carbon to the imine nitrogen
      const qx = c1[0] + (n2[0] + 30 - c1[0]) * form, qy = c1[1] - 38 + (n2[1] - 26 - c1[1] + 38) * form;
      U.circle(ctx, qx, qy, 13, '#fff', C.coral, 2.5); text(ctx, '−', qx, qy + 7.5, { size: 23, weight: 800, color: C.coral, align: 'center' });
      text(ctx, form >= 0.5 ? 'NC–CH=N⁻, the HCN dimer anion' : 'CN⁻ + HCN', MID, BH - 22, { size: 23, weight: 680, color: C.navy, align: 'center' });
      ctx.restore();
      // progress along the C–C distance
      const ax0 = 200, ax1 = S.w - 200, ay = BH + 56, X = (dd) => ax0 + (3.6 - dd) / 2.1 * (ax1 - ax0);
      ctx.strokeStyle = rgba(C.inkSoft, 0.28); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1, ay); ctx.stroke();
      const gr = ctx.createLinearGradient(X(3.0), 0, X(1.6), 0); gr.addColorStop(0, QLO); gr.addColorStop(0.5, QMID); gr.addColorStop(1, QHI);
      ctx.strokeStyle = gr; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(X(3.0), ay); ctx.lineTo(X(1.6), ay); ctx.stroke();
      for (const [dd, t1, t2, col] of [[3.0, 'reactant', 'C–C ≥ 3.00 Å', QLO], [1.6, 'product', 'C–C ≤ 1.60 Å', QHI]]) {
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(dd), ay - 16); ctx.lineTo(X(dd), ay + 16); ctx.stroke();
        text(ctx, t1, X(dd), ay + 42, { size: 21, weight: 700, color: col, align: 'center' }); text(ctx, t2, X(dd), ay + 68, { size: 19, color: C.inkSoft, align: 'center' });
      }
      text(ctx, 'in between: the learned committor, 0 to 1', (X(3.0) + X(1.6)) / 2, ay + 42, { size: 20, color: C.inkSoft, align: 'center' });
      U.circle(ctx, X(dist(s)), ay, 12, '#fff', C.ink, 3.5);
    }
    let last = -1;
    return { frame(dt) { clock += dt; draw(); }, draw, ff: T2 + 0.5,
      step(k) { if (o.at !== undefined && k === o.at && last !== k) clock = 0; last = k; } }; // restart when its build comes up
  };
})();
