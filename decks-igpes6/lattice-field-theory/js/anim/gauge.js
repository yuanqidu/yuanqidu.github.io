/* Gauge animations: what a gauge transformation changes and what it cannot; 2D U(1) gauge theory
   with gradient flow; Wilson loops and the area law; topological freezing; non-commuting rotations;
   Z2 / U(1) / SU(2) / SU(3) in four dimensions; the Polyakov loop; fermion doubling. */
(function () {
  'use strict';
  const { C, rgba } = U;
  const TAU = 2 * Math.PI, rand = Math.random, randn = LFT.randn, wrap = LFT.wrap;
  const deg = (a) => { const d = Math.round(wrap(a) * 180 / Math.PI); return (d < 0 ? '−' : '') + Math.abs(d) + '°'; };

  // =====================================================================================
  // Gauge transformation on a 5×4 patch: matter phases on sites, link phases (dials), plaquettes.
  // Auto-plays a random transformation every few seconds; the read-out compares with the original.
  // =====================================================================================
  ANIMS.gaugeXform = function (S, o) {
    const ctx = S.ctx, NX = 5, NY = 4, sp = o.sp || 124, ox = 50, oy = 56;
    const P = (i, j) => [ox + i * sp, oy + j * sp], id = (i, j) => j * NX + i;
    const alpha = new Float64Array(NX * NY).map(() => TAU * rand());
    const hx = new Float64Array(NX * NY).map(() => 1.2 * randn()), vy = new Float64Array(NX * NY).map(() => 1.2 * randn());
    let lam = Float64Array.from({ length: NX * NY }, () => TAU * rand() - Math.PI), lam0 = lam.slice(), lam1 = lam.slice(), t = 1, auto = 1.6;
    const A = (k) => alpha[k] + lam[k];
    const TH = (i, j) => hx[id(i, j)] + lam[id(i, j)] - lam[id(i + 1, j)];
    const TV = (i, j) => vy[id(i, j)] + lam[id(i, j)] - lam[id(i, j + 1)];
    const plaq = (i, j) => TH(i, j) + TV(i + 1, j) - TH(i, j + 1) - TV(i, j);
    const k0 = id(1, 1);
    const base = { a: alpha[k0], th: hx[k0], naive: -alpha[k0] + alpha[id(2, 1)], hop: -alpha[k0] + hx[k0] + alpha[id(2, 1)], P: hx[k0] + vy[id(2, 1)] - hx[id(1, 2)] - vy[k0] };
    function draw() {
      S.clear();
      for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
        const [x, y] = P(i, j), p = wrap(plaq(i, j)), hl = i === 1 && j === 1;
        ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = K.divCss(p, Math.PI); ctx.fillRect(x + 22, y + 22, sp - 44, sp - 44); ctx.restore();
        K.label(ctx, deg(p), x + sp / 2, y + sp / 2 + 7, { size: 19, color: C.ink, weight: 650, align: 'center' });
        if (hl) { ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(x + 22, y + 22, sp - 44, sp - 44); ctx.restore(); }
      }
      ctx.save(); ctx.strokeStyle = '#D9D3C7'; ctx.lineWidth = 3;
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const [x, y] = P(i, j); if (i < NX - 1) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sp, y); ctx.stroke(); } if (j < NY - 1) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + sp); ctx.stroke(); } }
      ctx.restore();
      const dial = (x, y, a, hl) => { U.circle(ctx, x, y, 16, '#fff', hl ? C.ink : '#CFC9BE', hl ? 3 : 1.6); ctx.save(); ctx.strokeStyle = K.cycCss(a); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12 * Math.cos(a), y - 12 * Math.sin(a)); ctx.stroke(); ctx.restore(); U.circle(ctx, x + 12 * Math.cos(a), y - 12 * Math.sin(a), 3, K.cycCss(a)); };
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const [x, y] = P(i, j); if (i < NX - 1) dial(x + sp / 2, y, TH(i, j), i === 1 && j === 1); if (j < NY - 1) dial(x, y + sp / 2, TV(i, j), false); }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const [x, y] = P(i, j), k = id(i, j), hl = i === 1 && j === 1;
        U.circle(ctx, x, y, 24, hl ? '#EEF3FA' : '#fff', hl ? C.blue : '#B9B3A8', hl ? 3 : 1.6);
        K.arrowA(ctx, x, y, A(k), 36, C.blue, 3.8, 0.36);
      }
      // read-out
      const rx = ox + (NX - 1) * sp + 70, vals = { a: A(k0), th: TH(1, 1), naive: -A(k0) + A(id(2, 1)), hop: -A(k0) + TH(1, 1) + A(id(2, 1)), P: plaq(1, 1) };
      const rows = [['a', 'matter phase at a site'], ['th', 'one link angle'], ['naive', 'naive hop φ*_x φ_{x+μ}'], ['hop', 'covariant hop φ*_x U φ_{x+μ}'], ['P', 'plaquette angle θ_P']];
      let y = 70;
      K.label(ctx, `gauge angle at the highlighted site: Λ = ${deg(lam[k0])}`, rx, y - 20, { size: 18, color: C.inkSoft });
      y += 30;
      for (const [key, lab] of rows) {
        const same = Math.abs(wrap(vals[key] - base[key])) < 1e-6;
        K.label(ctx, lab, rx, y, { size: 20, color: C.ink, weight: 600 });
        K.label(ctx, deg(vals[key]), rx + 330, y, { size: 20, color: C.ink, align: 'right', weight: 650 });
        ctx.save(); U.roundRect(ctx, rx + 345, y - 24, 130, 34, 17, same ? rgba(C.teal, 0.14) : rgba(C.coral, 0.14)); ctx.restore();
        K.label(ctx, same ? 'unchanged' : 'changed', rx + 410, y, { size: 18, color: same ? C.tealDark : '#B4492F', weight: 700, align: 'center' });
        y += 66;
      }
    }
    function frame(dt) {
      auto += dt;
      if (auto > 3.4 && t >= 1) { auto = 0; lam0 = lam.slice(); lam1 = Float64Array.from(lam, () => TAU * rand() - Math.PI); t = 0; }
      if (t < 1) { t = Math.min(1, t + dt * 0.8); const s = K.smooth(t); for (let k = 0; k < lam.length; k++) lam[k] = lam0[k] + wrap(lam1[k] - lam0[k]) * s; }
      draw();
    }
    return { frame, draw, ff: 0.2 };
  };

  // =====================================================================================
  // 2D U(1) gauge theory, 32² at β = 3: plaquette angles, ⟨cos θ_P⟩ vs exact I1/I0, Q trace.
  // builds: 0 sampling (heat bath + overrelaxation), 1 gradient flow on a frozen copy (Q unchanged)
  // =====================================================================================
  ANIMS.u1Live = function (S, o) {
    const ctx = S.ctx, L = 32, u = new LFT.U1_2D(L), beta = o.beta || 3, box = o.box || 520, img = K.img(L);
    u.beta = beta; u.hot(); for (let k = 0; k < 40; k++) { u.heatbathSweep(); u.overrelaxSweep(); }
    const rx = box + 120, rw = S.w - rx - 10, wP = K.Ring(300), qR = K.Ring(400);
    const PP = K.plot(ctx, { x: rx, y: 50, w: rw, h: 200 }, { x: [0.5, 10], y: [0, 1], logx: true, xt: K.ticks([0.5, 1, 2, 5, 10], v => String(v)), yt: K.ticks([0, 0.5, 1], v => v === 0 ? '0' : v.toFixed(1)), xl: 'coupling β', fs: 17 });
    const PQ = K.plot(ctx, { x: rx, y: 370, w: rw - 24, h: 150 }, { x: [0, 400], y: [-9, 9], xt: K.ticks([0, 200, 400]), yt: K.ticks([-8, 0, 8], v => (v < 0 ? '−' : '') + Math.abs(v)), xl: 'sweeps ago', fs: 17, ylo: 40 });
    const exB = [], exP = []; for (let i = 0; i <= 120; i++) { const b = 0.5 * Math.pow(20, i / 120); exB.push(b); exP.push(LFT.besselRatio(1, 0, b)); }
    for (let k = 0; k < 60; k++) { u.heatbathSweep(); u.overrelaxSweep(); wP.push(u.avgPlaq()); qR.push(Math.round(u.topCharge())); }
    let mode = 0, saved = null, tflow = 0, q0 = 0;
    function draw() {
      S.clear();
      let vmax = Math.PI;
      if (mode) { vmax = 0.02; for (let i = 0; i < u.N; i++) vmax = Math.max(vmax, Math.abs(wrap(u.plaq(i)))); vmax *= 1.05; }
      for (let i = 0; i < u.N; i++) img.px[i] = K.DIV[K.divIdx(wrap(u.plaq(i)), vmax)];
      img.put(); ctx.save(); K.clipRound(ctx, 0, 0, box, box, 12); img.draw(ctx, 0, 0, box, box, mode && tflow > 1); ctx.restore();
      const Q = u.topCharge();
      K.label(ctx, mode ? `gradient flow, time t = ${tflow.toFixed(1)}:  Q = ${Q.toFixed(2)}` : `sampling at β = ${beta}:  Q = ${Q.toFixed(2)}`, 0, box + 40, { size: 22, color: mode ? C.violet : C.ink, weight: 700 });
      K.label(ctx, mode ? 'colour: θ_P, scale stretched to the smoothed field' : 'colour: plaquette angle θ_P from −π (blue) to +π (coral)', 0, box + 72, { size: 17, color: C.inkSoft });
      PP.axes(); PP.line(exB, exP, C.ink, 2.6); PP.dots([beta], [wP.mean()], C.coral, 8);
      K.label(ctx, `⟨cos θ_P⟩ = ${wP.mean().toFixed(4)}  (exact I₁/I₀ = ${LFT.besselRatio(1, 0, beta).toFixed(4)})`, PP.b.x, PP.b.y - 20, { size: 18, color: C.ink, weight: 650 });
      PQ.axes(); PQ.hline(0, C.faint, 1.2);
      const v = qR.values(), xs = Float64Array.from(v, (_, i) => v.length - 1 - i); ctx.save(); PQ.clip(); PQ.line(xs, v, C.violet, 2.4); ctx.restore();
      K.label(ctx, 'topological charge Q (an integer), last 400 sweeps', PQ.b.x, PQ.b.y - 18, { size: 18, color: C.ink, weight: 650 });
    }
    function frame() {
      if (mode) { if (tflow < 4) { for (let k = 0; k < 4; k++) u.flowStep(0.025); tflow += 0.1; } }
      else for (let k = 0; k < (qR.len < 400 ? 6 : 2); k++) { u.heatbathSweep(); u.overrelaxSweep(); wP.push(u.avgPlaq()); qR.push(Math.round(u.topCharge())); }
      draw();
    }
    return {
      frame, draw, ff: 1.2,
      step(s) {
        const nm = s >= 1 ? 1 : 0; if (nm === mode) return;
        if (nm) {
          // flow a configuration with a few instantons in it, so there is something to see
          for (let k = 0; k < 600 && Math.abs(Math.round(u.topCharge())) < 2; k++) { u.heatbathSweep(); u.overrelaxSweep(); qR.push(Math.round(u.topCharge())); }
          saved = Float64Array.from(u.th); tflow = 0; q0 = u.topCharge();
        } else if (saved) { u.th.set(saved); saved = null; }
        mode = nm;
      }
    };
  };

  // =====================================================================================
  // Wilson loops on a 32² U(1) lattice at β = 3. builds: 0 a 4×3 loop traced link by link (Stokes),
  // 1 + area law −ln⟨W⟩ vs area, 2 + static potential V(R) from W(R,4)/W(R,3)
  // =====================================================================================
  ANIMS.wilsonArea = function (S, o) {
    const ctx = S.ctx, L = 32, u = new LFT.U1_2D(L), R = 5, beta = o.beta || 3, win = 12, box = o.box || 420, cell = box / win;
    u.beta = beta; u.hot(); for (let i = 0; i < 40; i++) { u.heatbathSweep(); u.overrelaxSweep(); }
    const sig = -Math.log(LFT.besselRatio(1, 0, beta));
    const g1 = box + 110, gw = (S.w - g1 - 100) / 2;
    const PW = K.plot(ctx, { x: g1, y: 40, w: gw, h: box - 30 }, { x: [0, 26], y: [0, 6], xt: K.ticks([0, 10, 20]), yt: K.ticks([0, 2, 4, 6]), xl: 'area R × T', yl: '−ln⟨W⟩', fs: 17, ylo: 40 });
    const PV = K.plot(ctx, { x: g1 + gw + 100, y: 40, w: gw, h: box - 30 }, { x: [0, 5.5], y: [0, 1.4], xt: K.ticks([1, 2, 3, 4, 5]), yt: K.ticks([0, 0.5, 1], v => v === 0 ? '0' : v.toFixed(1)), xl: 'separation R', yl: 'V(R)', fs: 17, ylo: 44 });
    let blocks = [], cur = new Float64Array(R * R), nCur = 0, walk = 0, loopPos = 0, step = 0;
    function measure() {
      for (let a = 1; a <= R; a++) for (let b = 1; b <= R; b++) cur[(a - 1) * R + b - 1] += u.wilson(a, b);
      if (++nCur === 10) { blocks.push(Float64Array.from(cur, v => v / 10)); cur.fill(0); nCur = 0; if (blocks.length > 200) blocks.shift(); }
    }
    for (let k = 0; k < 30; k++) { u.heatbathSweep(); u.overrelaxSweep(); measure(); }
    function analyse() {
      const B = blocks.length; if (B < 3) return null;
      const mean = new Float64Array(R * R), err = new Float64Array(R * R);
      for (const b of blocks) for (let k = 0; k < R * R; k++) mean[k] += b[k] / B;
      for (const b of blocks) for (let k = 0; k < R * R; k++) err[k] += (b[k] - mean[k]) ** 2;
      for (let k = 0; k < R * R; k++) err[k] = Math.sqrt(err[k] / (B * (B - 1)));
      return { mean, err };
    }
    function loopPath() {
      const x0 = 3 + (loopPos % 3), y0 = 4 + ((loopPos / 3) | 0) % 3, path = [[x0, y0]];
      for (let k = 1; k <= 4; k++) path.push([x0 + k, y0]); for (let k = 1; k <= 3; k++) path.push([x0 + 4, y0 + k]);
      for (let k = 1; k <= 4; k++) path.push([x0 + 4 - k, y0 + 3]); for (let k = 1; k <= 3; k++) path.push([x0, y0 + 3 - k]);
      return path;
    }
    function linkAngle(a, b) {
      const ia = a[1] * L + a[0], ib = b[1] * L + b[0];
      if (b[0] === a[0] + 1) return u.th[2 * ia]; if (b[0] === a[0] - 1) return -u.th[2 * ib];
      if (b[1] === a[1] + 1) return u.th[2 * ia + 1]; return -u.th[2 * ib + 1];
    }
    function draw() {
      S.clear();
      ctx.save(); K.clipRound(ctx, 0, 0, box, box, 12); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, box, box);
      for (let y = 0; y < win; y++) for (let x = 0; x < win; x++) { ctx.globalAlpha = 0.55; ctx.fillStyle = K.divCss(wrap(u.plaq(y * L + x)), Math.PI); ctx.fillRect((x + 0.5) * cell, (y + 0.5) * cell, cell, cell); }
      ctx.globalAlpha = 1;
      for (let y = 0; y < win; y++) for (let x = 0; x < win; x++) U.circle(ctx, (x + 0.5) * cell, (y + 0.5) * cell, 2, '#8A96A3');
      const path = loopPath(), k = Math.min(path.length - 1, Math.floor(walk));
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4.5; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let j = 0; j <= k; j++) { const [x, y] = path[j], px = (x + 0.5) * cell, py = (y + 0.5) * cell; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
      let acc = 0; for (let j = 1; j <= k; j++) acc += linkAngle(path[j - 1], path[j]);
      const [hx, hy] = path[k]; U.circle(ctx, (hx + 0.5) * cell, (hy + 0.5) * cell, 9, C.coral, '#fff', 2.5);
      ctx.restore();
      const [x0, y0] = path[0]; let sp = 0; for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 4; x++) sp += u.plaq(y * L + x);
      K.label(ctx, `phase collected around the loop: ${deg(acc)}${k < path.length - 1 ? ' …' : ''}`, 0, box + 38, { size: 20, color: C.ink, weight: 650 });
      K.label(ctx, `sum of the 12 enclosed plaquette angles: ${deg(sp)}`, 0, box + 70, { size: 20, color: C.inkSoft });
      const r = analyse();
      if (step >= 1) {
        PW.setY(0, sig * 26 * 1.08); PW.o.yt = K.ticks([0, 2, 4, 6].filter(v => v <= sig * 26 * 1.08));
        PW.axes(); PW.fn((A) => sig * A, C.ink, 2.6, null, 50);
        if (r) {
          const xs = [], ys = [], es = [];
          for (let a = 1; a <= R; a++) for (let b = 1; b <= R; b++) { const m = r.mean[(a - 1) * R + b - 1], e = r.err[(a - 1) * R + b - 1]; if (m > 2 * e && m > 0) { xs.push(a * b); ys.push(-Math.log(m)); es.push(e / m); } }
          PW.err(xs, ys, es, C.blue); PW.dots(xs, ys, C.blue, 5.5);
        }
        K.label(ctx, 'area law: W ~ e^{−σ · area}', PW.b.x, PW.b.y - 14, { size: 19, color: C.ink, weight: 650 });
      }
      if (step >= 2) {
        PV.setY(0, Math.max(0.5, sig * 5.5 * 1.1)); PV.axes(); PV.fn((x) => sig * x, C.ink, 2.6, null, 50);
        if (r) {
          const xs = [], ys = [], es = [];
          for (let a = 1; a <= R; a++) { const w3 = r.mean[(a - 1) * R + 2], w4 = r.mean[(a - 1) * R + 3], e3 = r.err[(a - 1) * R + 2], e4 = r.err[(a - 1) * R + 3]; if (w3 > 2 * e3 && w4 > 2 * e4) { xs.push(a); ys.push(Math.log(w3 / w4)); es.push(Math.hypot(e3 / w3, e4 / w4)); } }
          PV.err(xs, ys, es, C.coral); PV.dots(xs, ys, C.coral, 6);
        }
        K.label(ctx, 'potential V(R) = σR: linear, confining', PV.b.x, PV.b.y - 14, { size: 19, color: C.ink, weight: 650 });
      }
      if (step >= 1) K.legend(ctx, PW.b.x + 18, PW.b.y + 30, [{ label: 'measured (32², β = 3)', color: C.blue, kind: 'dot' }, { label: `exact: σ = −ln(I₁/I₀) = ${sig.toFixed(3)}`, color: C.ink }], { size: 17, vertical: true });
    }
    function frame(dt) { const n = blocks.length < 60 ? 3 : 1; for (let k = 0; k < n; k++) { u.heatbathSweep(); u.overrelaxSweep(); measure(); } walk += dt * 5; if (walk > 16.5) { walk = 0; loopPos++; } draw(); }
    return { frame, draw, step(s) { step = s; }, ff: 4 };
  };

  // =====================================================================================
  // Topological freezing: four 16² U(1) chains at β = 2, 4, 6, 8 (heat bath + overrelaxation).
  // =====================================================================================
  ANIMS.topoFreeze = function (S, o) {
    const ctx = S.ctx, L = 16, betas = [2, 4, 6, 8], NS = 1500, rowH = (S.h - 60) / 4, sx = 1160 > S.w ? S.w - 380 : S.w - 400;
    const chains = betas.map(b => {
      const u = new LFT.U1_2D(L); u.beta = b; u.hot(); for (let i = 0; i < 100; i++) { u.heatbathSweep(); u.overrelaxSweep(); }
      return { u, b, q: K.Ring(NS), last: Math.round(u.topCharge()), changes: 0, n: 0, q2: 0, ex: L * L * LFT.u1chi(b) };
    });
    function one() { for (const ch of chains) { ch.u.heatbathSweep(); ch.u.overrelaxSweep(); const q = Math.round(ch.u.topCharge()); if (q !== ch.last) { ch.changes++; ch.last = q; } ch.q.push(q); ch.n++; ch.q2 += q * q; } }
    for (let k = 0; k < 150; k++) one();
    const plots = chains.map((ch, k) => K.plot(ctx, { x: 110, y: 20 + k * rowH, w: sx - 130, h: rowH - 44 }, { x: [0, NS], y: [-8, 8], xt: k === 3 ? K.ticks([0, 500, 1000, 1500]) : [], yt: K.ticks([-6, 0, 6], v => (v < 0 ? '−' : '') + Math.abs(v)), xl: k === 3 ? 'sweeps ago' : '', fs: 16, ylo: 40 }));
    function draw() {
      S.clear();
      chains.forEach((ch, k) => {
        const P = plots[k]; P.axes(); P.hline(0, C.faint, 1.2);
        const v = ch.q.values(), xs = Float64Array.from(v, (_, i) => v.length - 1 - i); ctx.save(); P.clip(); P.line(xs, v, C.violet, 2.2); ctx.restore();
        K.label(ctx, `β = ${ch.b}`, 0, P.b.y + P.b.h / 2 + 8, { size: 24, color: C.ink, weight: 700 });
        const rate = ch.changes / ch.n * 1000, q2 = ch.q2 / ch.n, bad = Math.abs(q2 - ch.ex) > 0.35 * ch.ex, frozen = rate < 1;
        K.label(ctx, `Q changes / 1000 sweeps: ${rate < 10 ? rate.toFixed(1) : Math.round(rate)}`, sx, P.b.y + 22, { size: 19, color: C.ink, weight: 650 });
        K.label(ctx, `⟨Q²⟩ measured ${q2.toFixed(2)} · exact ${ch.ex.toFixed(2)}`, sx, P.b.y + 52, { size: 19, color: bad ? '#B4492F' : C.inkSoft, weight: bad ? 700 : 500 });
        if (frozen) K.label(ctx, `frozen in the sector Q = ${ch.last}`, sx, P.b.y + 82, { size: 19, color: '#B4492F', weight: 700 });
      });
    }
    function frame() { if (chains[0].n < NS) K.budget(9, one, 400); else for (let k = 0; k < 8; k++) one(); draw(); }
    return { frame, draw, ff: 4 };
  };

  // =====================================================================================
  // Order matters: two quarter turns in opposite orders (SU(2) as rotations), and U(1) phases that commute.
  // =====================================================================================
  const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const qaxis = (ax, ang) => { const s = Math.sin(ang / 2); return [Math.cos(ang / 2), ax[0] * s, ax[1] * s, ax[2] * s]; };
  const qrot = (q, v) => { const p = qmul(qmul(q, [0, v[0], v[1], v[2]]), [q[0], -q[1], -q[2], -q[3]]); return [p[1], p[2], p[3]]; };
  function qslerp(a, b, t) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; if (d < 0) { b = b.map(v => -v); d = -d; }
    if (d > 0.9995) { const r = a.map((v, i) => v + t * (b[i] - v)), n = Math.hypot(...r); return r.map(v => v / n); }
    const th = Math.acos(d), s = Math.sin(th); return a.map((v, i) => (Math.sin((1 - t) * th) * v + Math.sin(t * th) * b[i]) / s);
  }
  function drawCube(ctx, q, cx, cy, size) {
    const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    const F = [[[0, 1, 2, 3], C.blue], [[4, 5, 6, 7], C.coral], [[0, 1, 5, 4], C.teal], [[3, 2, 6, 7], C.yellow], [[0, 3, 7, 4], C.violet], [[1, 2, 6, 5], C.navy]];
    const cam = qmul(qaxis([1, 0, 0], -0.45), qaxis([0, 1, 0], 0.6));
    const Pt = V.map(v => qrot(cam, qrot(q, [v[0], v[1], v[2] * 0.62])));
    const faces = F.map(([ix, col]) => ({ ix, col, z: ix.reduce((s, i) => s + Pt[i][2], 0) / 4 })).sort((a, b) => a.z - b.z);
    for (const f of faces) {
      ctx.beginPath(); f.ix.forEach((i, k) => { const x = cx + size * Pt[i][0], y = cy - size * Pt[i][1]; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
      ctx.save(); ctx.fillStyle = f.col; ctx.globalAlpha = 0.93; ctx.fill(); ctx.restore(); ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }
  }
  ANIMS.orderMatters = function (S, o) {
    const ctx = S.ctx, A = qaxis([1, 0, 0], Math.PI / 2), B = qaxis([0, 1, 0], Math.PI / 2), I = [1, 0, 0, 0];
    let t = 0;
    const at = (f, g, s) => s < 0.5 ? qslerp(I, f, Math.min(1, s / 0.4)) : qmul(qslerp(I, g, Math.min(1, (s - 0.5) / 0.4)), f);
    const W = S.w / 3;
    function draw() {
      S.clear();
      const s = Math.min(1, Math.max(0, (t % 7 - 0.5) / 5));
      [[A, B, 'first A, then B'], [B, A, 'first B, then A']].forEach(([f, g, lab], k) => {
        const cx = W * k + W / 2; drawCube(ctx, at(f, g, s), cx, S.h / 2 - 10, Math.min(W, S.h) * 0.3);
        K.label(ctx, lab, cx, S.h - 24, { size: 21, color: C.ink, weight: 650, align: 'center' });
      });
      if (s > 0.95) K.label(ctx, 'AB ≠ BA', W, 34, { size: 26, color: '#B4492F', weight: 750, align: 'center' });
      const a1 = 1.1, b1 = 1.9, cy = S.h / 2 - 20;
      [[a1, b1], [b1, a1]].forEach((ord, k) => {
        const cx = 2 * W + W * (0.28 + 0.44 * k), ang = s < 0.5 ? ord[0] * Math.min(1, s / 0.4) : ord[0] + ord[1] * Math.min(1, (s - 0.5) / 0.4);
        U.circle(ctx, cx, cy, W * 0.17, '#fff', '#CFC9BE', 2); K.arrowA(ctx, cx, cy, ang, W * 0.15, K.cycCss(ang), 4.5, 0.3, false);
        K.label(ctx, k ? 'b then a' : 'a then b', cx, cy + W * 0.17 + 34, { size: 19, color: C.inkSoft, align: 'center' });
      });
      K.label(ctx, 'U(1): e^{ia} e^{ib} = e^{ib} e^{ia}', 2.5 * W, S.h - 24, { size: 21, color: C.ink, weight: 650, align: 'center' });
      if (s > 0.95) K.label(ctx, 'same phase', 2.5 * W, 34, { size: 24, color: C.tealDark, weight: 700, align: 'center' });
    }
    return { frame(dt) { t += dt; draw(); }, draw, ff: 6.2 };
  };

  // =====================================================================================
  // Four gauge groups on a 4⁴ lattice: thermal cycles (β up, then down) of the average plaquette.
  // Dashed: leading strong- and weak-coupling predictions. All four run at once.
  // =====================================================================================
  ANIMS.gauge4d = function (S, o) {
    const ctx = S.ctx, groups = ['Z2', 'U1', 'SU2', 'SU3'];
    const R = { Z2: [0.1, 0.8], U1: [0.4, 1.6], SU2: [1.0, 3.6], SU3: [3.0, 8.0] };
    const strong = { Z2: b => Math.tanh(b), U1: b => LFT.besselRatio(1, 0, b), SU2: b => LFT.besselRatio(2, 1, b), SU3: b => b / 18 + b * b / 216 };
    const weak = { Z2: null, U1: b => 1 - 1 / (4 * b), SU2: b => 1 - 3 / (4 * b), SU3: b => 1 - 2 / b };
    const sMax = { SU3: 4.0, SU2: 1.8, U1: 0.9, Z2: 0.4 }, wMin = { SU3: 5.2, SU2: 2.0, U1: 1.0, Z2: 1 };
    const trans = { Z2: 0.4407, U1: 1.011, SU2: null, SU3: null };
    const names = { Z2: 'Z₂ (links ±1)', U1: 'U(1)', SU2: 'SU(2)', SU3: 'SU(3)' };
    const verdict = { Z2: 'first-order jump, hysteresis', U1: 'confined ↔ Coulomb phase', SU2: 'smooth: no transition', SU3: 'smooth: no transition' };
    const gw = (S.w - 3 * 70) / 4, nPts = 24;
    const st = groups.map((g, k) => {
      const [a, b] = R[g], G = new LFT.Gauge4D(g, 4, 4); G.hot();
      const list = []; for (let i = 0; i < nPts; i++) list.push([a + (b - a) * i / (nPts - 1), 0]); for (let i = nPts - 1; i >= 0; i--) list.push([a + (b - a) * i / (nPts - 1), 1]);
      const P = K.plot(ctx, { x: k * (gw + 70) + 60, y: 50, w: gw - 80, h: S.h - 150 }, { x: [a, b], y: [0, 1], xt: K.ticks([a, (a + b) / 2, b], v => +v.toFixed(2) + ''), yt: k === 0 ? K.ticks([0, 0.5, 1], v => v === 0 ? '0' : v.toFixed(1)) : K.ticks([0, 0.5, 1], () => ''), xl: 'β', yl: k === 0 ? '⟨P⟩' : '', fs: 17, ylo: 44 });
      const sx = [], sy = [], wx = [], wy = []; for (let i = 0; i <= 80; i++) { const x = a + (sMax[g] - a) * i / 80; sx.push(x); sy.push(strong[g](x)); }
      if (weak[g]) for (let i = 0; i <= 80; i++) { const x = wMin[g] + (b - wMin[g]) * i / 80; wx.push(x); wy.push(weak[g](x)); }
      return { g, G, list, k: 0, n: 0, s: 0, up: [], dn: [], P, sx, sy, wx, wy, done: false };
    });
    function sweep(r) {
      if (r.done) return;
      const beta = r.list[r.k][0]; r.G.update(beta, r.g === 'Z2' ? 0 : 1); const p = r.G.plaquette();
      r.n++; if (r.n > 4) r.s += p;
      if (r.n >= (r.g === 'SU3' ? 10 : 14)) { (r.list[r.k][1] ? r.dn : r.up).push([beta, r.s / (r.n - 4)]); r.k++; r.n = 0; r.s = 0; if (r.k >= r.list.length) r.done = true; }
    }
    function draw() {
      S.clear();
      for (const r of st) {
        const P = r.P; P.axes();
        if (trans[r.g]) P.vline(trans[r.g], rgba(C.inkSoft, 0.5), 1.4, [4, 4]);
        P.line(r.sx, r.sy, C.ink, 2, [7, 5]); if (r.wx.length) P.line(r.wx, r.wy, C.muted, 2, [7, 5]);
        P.dots(r.up.map(p => p[0]), r.up.map(p => p[1]), C.coral, 5.5); P.dots(r.dn.map(p => p[0]), r.dn.map(p => p[1]), C.blue, 5.5);
        K.label(ctx, names[r.g], P.b.x + P.b.w / 2, 26, { size: 23, color: C.ink, weight: 700, align: 'center' });
        K.label(ctx, r.done ? verdict[r.g] : `cycle ${Math.round(100 * r.k / r.list.length)}%`, P.b.x + P.b.w / 2, S.h - 12, { size: 19, color: r.done ? (r.g.startsWith('SU') ? C.tealDark : '#B4492F') : C.muted, weight: 650, align: 'center' });
      }
    }
    function frame() {
      const t0 = performance.now();
      let any = true;
      while (performance.now() - t0 < 14 && any) { any = false; for (const r of st) if (!r.done) { sweep(r); any = true; } }
      draw();
    }
    return { frame, draw, ff: 40 };
  };

  // =====================================================================================
  // Polyakov loop of SU(3) on 6³×2. builds: 0 β = 5.5 (deconfined), 1 centre transformation, 2 β = 4.8 (confined)
  // =====================================================================================
  ANIMS.polyakov = function (S, o) {
    const ctx = S.ctx, G = new LFT.Gauge4D('SU3', 6, 2), box = Math.min(S.h, o.box || 560);
    let beta = 5.5, pts = [], flipped = 0, step = 0;
    G.cold(); for (let i = 0; i < 6; i++) G.update(beta, 2);
    function sweep() { G.update(beta, 2); const p = G.polyakov(); pts.push(p); if (pts.length > 300) pts.shift(); }
    for (let i = 0; i < 6; i++) sweep();
    function draw() {
      S.clear();
      const ox = box / 2, oy = box / 2, Rr = box * 0.42, sc = Rr / 0.8;
      ctx.save(); K.card(ctx, 0, 0, box, box, 16); ctx.restore();
      for (const r of [0.2, 0.4, 0.6, 0.8]) U.circle(ctx, ox, oy, r * sc, null, C.grid, 1.2);
      ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(box - 20, oy); ctx.moveTo(ox, 20); ctx.lineTo(ox, box - 20); ctx.stroke(); ctx.restore();
      for (let k = 0; k < 3; k++) {
        const a = TAU * k / 3, x = ox + Rr * Math.cos(a), y = oy - Rr * Math.sin(a);
        ctx.save(); ctx.strokeStyle = rgba(C.coral, 0.5); ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
        U.circle(ctx, x, y, 7, C.coral, '#fff', 2);
        K.label(ctx, ['1', 'e^{2πi/3}', 'e^{−2πi/3}'][k], x + (k === 0 ? -12 : 14), y + (k === 0 ? -14 : 6), { size: 19, color: '#B4492F', align: k === 0 ? 'right' : 'left', weight: 650 });
      }
      pts.forEach(([re, im], k) => { ctx.save(); ctx.globalAlpha = 0.12 + 0.88 * k / pts.length; U.circle(ctx, ox + sc * re, oy - sc * im, 4, C.violet); ctx.restore(); });
      K.label(ctx, 'Re P', box - 24, oy + 26, { size: 18, color: C.inkSoft, align: 'right' }); K.label(ctx, 'Im P', ox + 10, 40, { size: 18, color: C.inkSoft });
      let a = 0; for (const [re, im] of pts.slice(-100)) a += Math.hypot(re, im); a /= Math.min(100, pts.length);
      const rx = box + 40;
      K.label(ctx, `β = ${beta}`, rx, 60, { size: 30, color: C.ink, weight: 750 });
      K.label(ctx, beta > 5.09 ? 'deconfined' : 'confined', rx, 102, { size: 24, color: beta > 5.09 ? C.violet : C.navy, weight: 700 });
      K.label(ctx, beta > 5.09 ? '(high temperature)' : '(low temperature)', rx, 132, { size: 19, color: C.inkSoft });
      K.label(ctx, `⟨|P|⟩ ≈ ${a.toFixed(2)}`, rx, 182, { size: 23, color: C.ink });
      K.label(ctx, 'transition near', rx, 232, { size: 18, color: C.inkSoft }); K.label(ctx, 'β ≈ 5.09 (N_t = 2)', rx, 258, { size: 18, color: C.inkSoft });
      if (step === 1) { K.label(ctx, 'centre transformation:', rx, 320, { size: 20, color: '#B4492F', weight: 700 }); K.label(ctx, 'P → e^{2πi/3} P', rx, 352, { size: 22, color: '#B4492F', weight: 700 }); }
    }
    function frame() { K.budget(5, () => sweep(), 2); draw(); }
    return {
      frame, draw, ff: 3,
      step(s) {
        step = s;
        if (s >= 1 && !flipped) { G.centerFlip(1); flipped = 1; }
        const nb = s >= 2 ? 4.8 : 5.5; if (nb !== beta) { beta = nb; }
      }
    };
  };

  // =====================================================================================
  // Fermion doubling: naive lattice dispersion has a second zero at p = π; Wilson's term lifts it.
  // builds: 0 naive, 1 Wilson term switched on (r animates 0 → 1)
  // =====================================================================================
  ANIMS.doubling = function (S, o) {
    const ctx = S.ctx, m = 0.15; let r = 0, target = 0;
    const PI = Math.PI, P = K.plot(ctx, { x: 80, y: 56, w: S.w - 110, h: S.h - 146 }, { x: [-PI, PI], y: [0, 2.6], xt: [{ v: -PI, l: '−π' }, { v: -PI / 2, l: '−π/2' }, { v: 0, l: '0' }, { v: PI / 2, l: 'π/2' }, { v: PI, l: 'π' }], yt: K.ticks([0, 1, 2]), xl: 'lattice momentum p (units of 1/a)', yl: 'energy E(p)', fs: 19, ylo: 50 });
    function draw() {
      S.clear(); P.axes();
      ctx.save(); P.clip();
      P.fn((p) => Math.sqrt(p * p + m * m), C.steel, 2.4, [8, 6]);
      P.fn((p) => Math.sqrt(Math.sin(p) ** 2 + m * m), C.coral, 3.2, null, 300);
      if (target > 0 || r > 0) P.fn((p) => Math.sqrt(Math.sin(p) ** 2 + (m + r * (1 - Math.cos(p))) ** 2), C.blue, 3.6, null, 300);
      ctx.restore();
      const ed = m + 2 * r;
      P.dots([0], [m], C.teal, 8); P.text(0, m, 'the real quark', { dx: 14, dy: -14, size: 19, color: C.tealDark, weight: 650 });
      P.dots([PI, -PI], [ed, ed], C.red, 8);
      P.text(-PI, ed, r < 0.05 ? 'doubler: a second light quark' : 'doubler, now heavy: E ≈ 2r/a', { dx: 16, dy: r < 0.05 ? -16 : 34, size: 19, color: '#B4492F', weight: 650, halo: C.bg }); 
      K.legend(ctx, P.b.x, 22, [{ label: 'continuum', color: C.steel, kind: 'dash' }, { label: 'naive: sin p', color: C.coral }].concat(target > 0 ? [{ label: `Wilson, r = ${r.toFixed(2)}`, color: C.blue }] : []), { size: 18 });
    }
    function frame(dt) { if (Math.abs(target - r) > 1e-3) { r += Math.sign(target - r) * Math.min(Math.abs(target - r), dt * 0.6); draw(); } }
    return { frame, draw, step(s) { target = s >= 1 ? 1 : 0; if (s < 1) r = 0; }, ff: 2 };
  };
})();
