/* Spin-model animations: the 2D Ising model at three temperatures against Onsager's solution,
   critical slowing down (Metropolis vs Wolff), the anatomy of a cluster move, the Potts model
   (continuous vs first order), XY vortices, and three ways to update one angle. */
(function () {
  'use strict';
  const { C, rgba } = U;
  const TAU = 2 * Math.PI, rand = Math.random, Tc = LFT.onsager.Tc;
  const UP = K.packHex(K.UP), DN = K.packHex(K.DN);
  function paint(model, img, x, y, w, h, ctx, r = 10) {
    for (let i = 0; i < model.N; i++) img.px[i] = model.s[i] > 0 ? UP : DN;
    img.put(); ctx.save(); K.clipRound(ctx, x, y, w, h, r); img.draw(ctx, x, y, w, h); ctx.restore();
  }

  // =====================================================================================
  // Ising at T = 1.8, T_c, 3.0 (128², Wolff + Metropolis), and |m|(T) against Onsager–Yang.
  // builds: 0 lattices, 1 + magnetization curve with the three running averages
  // =====================================================================================
  ANIMS.isingTemps = function (S, o) {
    const ctx = S.ctx, L = 128, Ts = [1.8, Tc, 3.0], box = o.box || 330, gap = (S.w - 3 * box) / 2;
    const ms = Ts.map(T => { const m = new LFT.Ising(L); m.setBeta(1 / T); if (T < Tc) m.fill(1); for (let k = 0; k < 8; k++) m.wolffSweep(); return { m, img: K.img(L), r: K.Ring(400) }; });
    const P = K.plot(ctx, { x: 120, y: box + 120, w: S.w - 170, h: S.h - box - 210 }, {
      x: [1.4, 3.4], y: [0, 1.05], xt: K.ticks([1.5, 2, 2.5, 3], v => v.toFixed(1)), yt: K.ticks([0, 0.5, 1], v => v === 0 ? '0' : v.toFixed(1)), xl: 'temperature T', yl: '|m|', fs: 19, ylo: 50
    });
    const exT = [], exM = []; for (let t = 1.4; t <= 3.4001; t += 0.004) { exT.push(t); exM.push(LFT.onsager.m(t)); }
    const names = [['T = 1.8', 'ordered'], ['T = T_c ≈ 2.269', 'critical'], ['T = 3.0', 'disordered']];
    let step = 0;
    function draw() {
      S.clear();
      ms.forEach((s, k) => {
        const x = k * (box + gap);
        paint(s.m, s.img, x, 0, box, box, ctx, 12);
        K.label(ctx, names[k][0], x + box / 2, box + 36, { size: 22, color: C.ink, weight: 700, align: 'center' });
        K.label(ctx, names[k][1], x + box / 2, box + 64, { size: 19, color: k === 1 ? C.tealDark : C.inkSoft, align: 'center', weight: k === 1 ? 650 : 500 });
      });
      if (step >= 1) {
        P.axes(); P.vline(Tc, rgba(C.inkSoft, 0.5), 1.4, [5, 5]);
        P.line(exT, exM, C.ink, 2.6);
        P.dots(Ts, ms.map(s => s.r.mean()), [C.coral, C.coral, C.coral], 8);
        K.legend(ctx, P.b.x + P.b.w - 480, P.b.y + P.b.h * 0.42, [{ label: 'Onsager–Yang (exact, L = ∞)', color: C.ink }, { label: 'simulation', color: C.coral, kind: 'dot' }], { size: 18, vertical: true });
      }
    }
    function frame() { for (const s of ms) { s.m.metropolisSweep(); K.budget(2, () => { s.m.wolffStep(); }, 40); s.r.push(Math.abs(s.m.magnetization())); } draw(); }
    return { frame, draw, step(s) { step = s; }, ff: 3 };
  };

  // =====================================================================================
  // Critical slowing down: Metropolis vs Wolff at T_c, L = 32, same spin flips per sweep.
  // builds: 0 lattices + traces, 1 + autocorrelation ρ(t) and τ_int
  // =====================================================================================
  ANIMS.csdRace = function (S, o) {
    const ctx = S.ctx, L = o.L || 32, A = new LFT.Ising(L), B = new LFT.Ising(L), box = o.box || 300;
    A.setBeta(1 / Tc); B.setBeta(1 / Tc);
    for (let i = 0; i < 20; i++) { A.wolffSweep(); B.wolffSweep(); }
    const NR = 24000, rA = K.Ring(NR), rB = K.Ring(NR), hA = K.Ring(600), hB = K.Ring(600), imA = K.img(L), imB = K.img(L);
    function sweep() { A.metropolisSweep(); B.wolffSweep(); const a = A.magnetization(), b = B.magnetization(); rA.push(Math.abs(a)); rB.push(Math.abs(b)); hA.push(a); hB.push(b); }
    for (let k = 0; k < 1000; k++) sweep();
    let rhoA, rhoB, tA, tB, step = 0, frames = 0;
    function analyse() { const va = rA.values(), vb = rB.values(); rhoA = LFT.autocorr(va, Math.min(1000, va.length >> 2)); rhoB = LFT.autocorr(vb, 200); tA = LFT.tauInt(rhoA); tB = LFT.tauInt(rhoB); }
    analyse();
    const tx = box * 2 + 60, PT = K.plot(ctx, { x: 70, y: box + 100, w: 2 * box + 60 - 70, h: S.h - box - 180 }, { x: [0, 600], y: [-1, 1], xt: K.ticks([0, 200, 400, 600]), yt: K.ticks([-1, 0, 1], v => (v < 0 ? '−' : '') + Math.abs(v)), xl: 'sweeps ago', yl: 'm', fs: 18, ylo: 40 });
    const PR = K.plot(ctx, { x: tx + 90, y: 40, w: S.w - tx - 110, h: box + 40 }, { x: [0, 600], y: [-0.1, 1], xt: K.ticks([0, 300, 600]), yt: K.ticks([0, 0.5, 1], v => v === 0 ? '0' : v.toFixed(1)), xl: 'lag t (sweeps)', yl: 'ρ(t) of |m|', fs: 18, ylo: 52 });
    function draw() {
      S.clear();
      paint(A, imA, 0, 34, box, box, ctx); paint(B, imB, box + 60, 34, box, box, ctx);
      K.label(ctx, 'Metropolis: one spin at a time', box / 2, 22, { size: 20, color: C.blue, weight: 700, align: 'center' });
      K.label(ctx, 'Wolff: whole clusters', box * 1.5 + 60, 22, { size: 20, color: C.coral, weight: 700, align: 'center' });
      PT.axes(); PT.hline(0, C.faint, 1.2);
      const a = hA.values(), b = hB.values(), xs = Float64Array.from(a, (_, i) => a.length - 1 - i);
      PT.line(xs, b, C.coral, 1.8, null, 0.85); PT.line(xs, a, C.blue, 2.6);
      K.label(ctx, `magnetization m, last 600 sweeps, T = T_c, ${L}×${L}`, PT.b.x, PT.b.y - 14, { size: 19, color: C.ink, weight: 650 });
      if (step >= 1) {
        PR.axes(); PR.hline(0, C.faint, 1.2);
        const ra = rhoA.subarray(0, Math.min(rhoA.length, 601)), xr = Float64Array.from(ra, (_, i) => i), xb = Float64Array.from(rhoB, (_, i) => i);
        PR.line(xr, ra, C.blue, 3); PR.line(xb, rhoB, C.coral, 3);
        const fmtT = (t) => (t.ok ? '' : '> ') + t.tau.toFixed(t.tau < 10 ? 1 : 0);
        let y = PR.b.y + PR.b.h + 110;
        K.label(ctx, 'sweeps per independent sample, τ_int(|m|)', PR.b.x - 60, y, { size: 20, color: C.ink, weight: 650 }); y += 46;
        K.label(ctx, 'Metropolis', PR.b.x - 60, y, { size: 22, color: C.blue, weight: 650 }); K.label(ctx, fmtT(tA), PR.b.x + PR.b.w, y, { size: 30, color: C.blue, weight: 750, align: 'right' }); y += 46;
        K.label(ctx, 'Wolff', PR.b.x - 60, y, { size: 22, color: C.coral, weight: 650 }); K.label(ctx, fmtT(tB), PR.b.x + PR.b.w, y, { size: 30, color: C.coral, weight: 750, align: 'right' });
      }
    }
    // fill the 24,000-sweep history in the background (8 ms per frame), then 20 sweeps per frame
    function frame() { if (rA.len < NR) K.budget(8, sweep, 4000); else for (let k = 0; k < 20; k++) sweep(); if (step >= 1 && ++frames % 120 === 0) analyse(); draw(); }
    return { frame, draw, step(s) { step = s; if (s >= 1) analyse(); }, ff: 12 };
  };

  // =====================================================================================
  // Anatomy of a cluster move (40×40 at T_c). builds: 0 Wolff (grow one cluster, flip), 1 Swendsen–Wang.
  // =====================================================================================
  ANIMS.clusterAnatomy = function (S, o) {
    const ctx = S.ctx, L = 40, m = new LFT.Ising(L), nb = m.nb, T = Tc, box = Math.min(S.w, S.h - 70), cell = box / L;
    m.setBeta(1 / T); for (let i = 0; i < 100; i++) m.wolffSweep();
    const inC = new Uint8Array(m.N), queue = new Int32Array(m.N), p = 1 - Math.exp(-2 / T);
    let mode = 'wolff', state = 'start', head = 0, tail = 0, sv = 1, bonds = [], t = 0, accum = 0, label = null, colors = null, newSpin = null, ncl = 0, big = 0, flipped = false;
    const cx = (i) => (i % L + 0.5) * cell, cy = (i) => (((i / L) | 0) + 0.5) * cell;
    const near = (i, j) => Math.abs(i % L - j % L) <= 1 && Math.abs(((i / L) | 0) - ((j / L) | 0)) <= 1;
    function wolffStart() { inC.fill(0); bonds = []; head = tail = 0; const seed = (rand() * m.N) | 0; sv = m.s[seed]; inC[seed] = 1; queue[tail++] = seed; state = 'grow'; flipped = false; }
    function wolffGrow(k) {
      for (let n = 0; n < k && head < tail; n++) {
        const i = queue[head++];
        for (let d = 0; d < 4; d++) { const j = nb[4 * i + d]; if (inC[j] || m.s[j] !== sv) continue; const ok = rand() < p; bonds.push([i, j, ok]); if (ok) { inC[j] = 1; queue[tail++] = j; } }
      }
      if (head >= tail) { state = 'flip'; t = 0; }
    }
    function swStart() {
      const uf = new Int32Array(m.N).map((_, i) => i), find = (i) => { while (uf[i] !== i) { uf[i] = uf[uf[i]]; i = uf[i]; } return i; };
      bonds = [];
      for (let i = 0; i < m.N; i++) for (const d of [0, 2]) { const j = nb[4 * i + d]; if (m.s[j] === m.s[i] && rand() < p) { bonds.push([i, j, true]); const a = find(i), b = find(j); if (a !== b) uf[a] = b; } }
      label = new Int32Array(m.N); const ids = new Map(), sizes = [];
      for (let i = 0; i < m.N; i++) { const r = find(i); if (!ids.has(r)) { ids.set(r, ids.size); sizes.push(0); } label[i] = ids.get(r); sizes[label[i]]++; }
      ncl = ids.size; big = Math.max(...sizes); colors = []; newSpin = [];
      for (let k = 0; k < ncl; k++) { const c = K.hsl((k * 137.508) % 360, 0.5, 0.64); colors.push(`rgb(${c[0]},${c[1]},${c[2]})`); newSpin.push(rand() < 0.5 ? 1 : -1); }
      state = 'swshow'; t = 0;
    }
    function spins(over) { for (let i = 0; i < m.N; i++) { ctx.fillStyle = over ? over(i) : (m.s[i] > 0 ? K.UP : K.DN); ctx.fillRect((i % L) * cell, ((i / L) | 0) * cell, cell + 0.5, cell + 0.5); } }
    function drawBonds() {
      ctx.save(); ctx.lineCap = 'round';
      for (const [i, j, ok] of bonds) {
        if (!near(i, j)) continue;
        if (ok) { ctx.strokeStyle = mode === 'sw' ? 'rgba(31,41,51,.28)' : C.coral; ctx.lineWidth = mode === 'sw' ? 1.3 : 3.4; ctx.beginPath(); ctx.moveTo(cx(i), cy(i)); ctx.lineTo(cx(j), cy(j)); ctx.stroke(); }
        else { const mx = (cx(i) + cx(j)) / 2, my = (cy(i) + cy(j)) / 2; ctx.fillStyle = 'rgba(138,150,163,.9)'; ctx.fillRect(mx - 2, my - 2, 4, 4); }
      }
      ctx.restore();
    }
    function draw() {
      S.clear();
      ctx.save(); K.clipRound(ctx, 0, 0, box, box, 12);
      if (mode === 'wolff') {
        const pulse = state === 'flip' ? 0.5 + 0.5 * Math.sin(t * 18) : 1;
        spins((i) => inC[i] ? (state === 'flip' && t > 0.55 ? (m.s[i] > 0 ? K.UP : K.DN) : rgba(C.coral, 0.35 + 0.45 * pulse)) : (m.s[i] > 0 ? K.UP : K.DN));
        ctx.save(); ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5; for (let k = head; k < tail; k++) { const i = queue[k]; ctx.strokeRect((i % L) * cell + 1.5, ((i / L) | 0) * cell + 1.5, cell - 3, cell - 3); } ctx.restore();
        drawBonds();
        U.circle(ctx, cx(queue[0]), cy(queue[0]), cell * 0.36, C.ink, '#fff', 2);
      } else if (state === 'swshow') { spins((i) => colors[label[i]]); drawBonds(); }
      else if (state === 'swflip') spins((i) => (newSpin[label[i]] > 0 ? K.UP : K.DN));
      else spins();
      ctx.restore();
      let msg;
      if (mode === 'wolff') msg = state === 'grow' ? `Wolff: grow from the seed, bond probability p = ${p.toFixed(3)}` : `flip all ${tail} sites at once: always accepted`;
      else msg = state === 'swshow' ? `Swendsen–Wang: ${ncl} clusters (largest ${big}), each gets a random spin` : 'every cluster flipped independently';
      K.label(ctx, msg, 0, box + 44, { size: 21, color: C.ink, weight: 600 });
    }
    function frame(dt) {
      t += dt;
      if (mode === 'wolff') {
        if (state === 'start' || state.startsWith('sw')) wolffStart();
        else if (state === 'grow') { accum += dt * 70; const n = Math.floor(accum); accum -= n; if (n > 0) wolffGrow(n); }
        else if (state === 'flip' && t > 0.55 && !flipped) { for (let i = 0; i < tail; i++) m.s[queue[i]] = -sv; flipped = true; }
        if (state === 'flip' && t > 1.4) state = 'start';
      } else {
        if (!state.startsWith('sw')) swStart();
        else if (state === 'swshow' && t > 2.4) { for (let i = 0; i < m.N; i++) m.s[i] = newSpin[label[i]]; state = 'swflip'; t = 0; }
        else if (state === 'swflip' && t > 0.9) swStart();
      }
      draw();
    }
    wolffStart();
    return { frame, draw, step(s) { const nm = s >= 1 ? 'sw' : 'wolff'; if (nm !== mode) { mode = nm; state = 'start'; } }, ff: 1.2 };
  };

  // =====================================================================================
  // Potts model at β_c. builds: 0 q = 3 (continuous; order parameter cloud), 1 q = 8, L = 24 (first order).
  // =====================================================================================
  ANIMS.pottsFirstOrder = function (S, o) {
    const ctx = S.ctx, box = o.box || 380;
    let q = 0, L, p, img, hist, eR, pts, ex;
    const PH = K.plot(ctx, { x: box + 110, y: 300, w: S.w - box - 140, h: 170 }, { x: [-2, -0.6], y: [0, 1], xt: K.ticks([-2, -1.6, -1.2, -0.8], v => '−' + Math.abs(v).toFixed(1)), yt: [], xl: 'energy per site e', fs: 18 });
    const PT = K.plot(ctx, { x: box + 110, y: S.h - 130, w: S.w - box - 140, h: 110 }, { x: [0, 600], y: [-2, -0.6], xt: [], yt: K.ticks([-1.6, -1], v => '−' + Math.abs(v).toFixed(1)), fs: 16, ylo: 50 });
    function build(nq) {
      q = nq; L = q === 3 ? 48 : 24; p = new LFT.Potts(L, q); p.setBeta(LFT.Potts.betaC(q)); img = K.img(L);
      hist = K.Hist(70, -2, -0.6); eR = K.Ring(600); pts = []; ex = LFT.pottsCritical(q);
      for (let k = 0; k < 100; k++) p.swSweep();
      for (let k = 0; k < 500; k++) one();
    }
    const cols = K.CAT.map(K.packHex);
    function one() { p.swSweep(); const e = p.energy(); hist.add(e); eR.push(e); pts.push(p.order()); if (pts.length > 300) pts.shift(); }
    function draw() {
      S.clear();
      for (let i = 0; i < p.N; i++) img.px[i] = cols[p.s[i]];
      img.put(); ctx.save(); K.clipRound(ctx, 0, 0, box, box, 12); img.draw(ctx, 0, 0, box, box); ctx.restore();
      K.label(ctx, `q = ${q}, ${L}×${L}, at β_c = ln(1+√q)`, box / 2, box + 38, { size: 21, color: C.ink, weight: 650, align: 'center' });
      // order parameter cloud
      const ox = box + 60 + 120, oy = 158, R = 110;
      U.circle(ctx, ox, oy, R, null, C.grid, 1.5);
      for (let k = 0; k < q; k++) { const a = TAU * k / q, x = ox + R * Math.cos(a), y = oy - R * Math.sin(a); ctx.save(); ctx.strokeStyle = rgba(K.CAT[k], 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x, y); ctx.stroke(); ctx.restore(); U.circle(ctx, x, y, 6, K.CAT[k]); }
      pts.forEach(([re, im], k) => { ctx.save(); ctx.globalAlpha = 0.15 + 0.85 * k / pts.length; U.circle(ctx, ox + R * re, oy - R * im, 3.2, C.ink); ctx.restore(); });
      K.label(ctx, 'order parameter M = (1/N) Σ e^{2πi s/q}', box + 60, 22, { size: 19, color: C.ink, weight: 650 });
      K.label(ctx, q === 3 ? 'one cloud with a three-fold' : 'jumps between the centre', ox + R + 30, oy - 6, { size: 18, color: C.inkSoft });
      K.label(ctx, q === 3 ? 'shape: fluctuations on' : '(disordered) and the q', ox + R + 30, oy + 20, { size: 18, color: C.inkSoft });
      K.label(ctx, q === 3 ? 'every scale' : 'coloured corners (ordered)', ox + R + 30, oy + 46, { size: 18, color: C.inkSoft });
      // histogram
      const d = hist.density(); let mx = 0; for (const v of d) mx = Math.max(mx, v);
      PH.setY(0, Math.max(1, mx * 1.15)); PH.axes(); PH.bars(hist.edges(), d, rgba(C.teal, 0.75));
      if (q > 4) { PH.vline(ex.eOrd, C.ink, 2, [6, 5]); PH.vline(ex.eDis, C.ink, 2, [6, 5]); K.label(ctx, 'ordered', PH.X(ex.eOrd) - 8, PH.b.y + 18, { size: 17, align: 'right', color: C.ink }); K.label(ctx, 'disordered', PH.X(ex.eDis) + 8, PH.b.y + 18, { size: 17, color: C.ink }); }
      else { PH.vline(ex.ec, C.ink, 2, [6, 5]); K.label(ctx, 'exact at β_c', PH.X(ex.ec) + 8, PH.b.y + 18, { size: 17, color: C.ink }); }
      K.label(ctx, q > 4 ? 'energy histogram: two peaks, two coexisting phases' : 'energy histogram: one peak', PH.b.x, PH.b.y - 16, { size: 19, color: C.ink, weight: 650 });
      PT.axes(); if (q > 4) { PT.hline(ex.eOrd, C.muted, 1.4, [5, 4]); PT.hline(ex.eDis, C.muted, 1.4, [5, 4]); }
      const v = eR.values(), xs = Float64Array.from(v, (_, i) => v.length - 1 - i); PT.line(xs, v, C.teal, 2);
      K.label(ctx, 'e over the last 600 sweeps', PT.b.x, PT.b.y - 10, { size: 17, color: C.inkSoft });
    }
    function frame() { for (let k = 0; k < (q === 3 ? 2 : 4); k++) one(); draw(); }
    build(3);
    return { frame, draw, step(s) { const nq = s >= 1 ? 8 : 3; if (nq !== q) build(nq); }, ff: 2 };
  };

  // =====================================================================================
  // XY model (64²) coloured by angle with vortices (black) and antivortices (white).
  // builds: T = 0.5 → 0.9 → 1.3. Wolff + overrelaxation.
  // =====================================================================================
  ANIMS.xyVortices = function (S, o) {
    const ctx = S.ctx, L = 64, x = new LFT.XY(L), hero = !!o.hero, box = Math.min(S.w, hero ? S.h : S.h - 120), vb = new Int8Array(x.N), img = K.img(L);
    const Ts = o.Ts || [0.5, 0.9, 1.3]; let T = Ts[0], vr = K.Ring(60);
    x.setBeta(1 / T);
    if (hero) { x.randomize(); for (let k = 0; k < 40; k++) { x.metropolisSweep(); x.overrelaxSweep(); } }
    else { x.fill(0.4); for (let k = 0; k < 100; k++) { x.wolffSweep(); x.overrelaxSweep(); } }
    function draw() {
      S.clear();
      for (let i = 0; i < x.N; i++) img.px[i] = K.CYC[K.cycIdx(x.th[i])];
      img.put(); ctx.save(); K.clipRound(ctx, 0, 0, box, box, 12); img.draw(ctx, 0, 0, box, box);
      const n = x.vortices(vb), cell = box / L;
      for (let i = 0; i < x.N; i++) if (vb[i]) { const px = (i % L + 1) * cell, py = (((i / L) | 0) + 1) * cell; U.circle(ctx, px, py, 5, vb[i] > 0 ? C.ink : '#fff', vb[i] > 0 ? '#fff' : C.ink, 1.8); }
      ctx.restore();
      vr.push(n / x.N);
      if (hero) return;
      // colour key
      const ky = box + 22; for (let k = 0; k < 260; k++) { ctx.fillStyle = K.cycCss(TAU * k / 260); ctx.fillRect(k, ky, 1.5, 14); }
      K.label(ctx, 'angle θ: 0 → 2π', 274, ky + 13, { size: 17, color: C.inkSoft });
      U.circle(ctx, box - 250, ky + 7, 6, C.ink, '#fff', 1.8); K.label(ctx, 'vortex', box - 238, ky + 13, { size: 17, color: C.inkSoft });
      U.circle(ctx, box - 140, ky + 7, 6, '#fff', C.ink, 1.8); K.label(ctx, 'antivortex', box - 128, ky + 13, { size: 17, color: C.inkSoft });
      const phase = T < 0.85 ? 'bound pairs, quasi-long-range order' : T < 0.95 ? 'near T_BKT ≈ 0.893' : 'free vortices, disorder';
      K.label(ctx, `T = ${T.toFixed(1)}: ${phase}`, 0, box + 76, { size: 23, color: C.ink, weight: 700 });
      K.label(ctx, `${(vr.mean() * 100).toFixed(1)} vortices per 100 sites`, 0, box + 108, { size: 19, color: C.inkSoft });
    }
    function frame() { if (!hero) x.wolffSweep(); x.overrelaxSweep(); x.metropolisSweep(); draw(); }
    return { frame, draw, step(s) { const nT = Ts[Math.min(s, Ts.length - 1)]; if (nT !== T) { T = nT; x.setBeta(1 / T); vr.clear(); } }, ff: 2 };
  };

  // =====================================================================================
  // Three ways to update one XY spin with four fixed neighbours: Metropolis, heat bath, overrelaxation.
  // =====================================================================================
  ANIMS.angleUpdates = function (S, o) {
    const ctx = S.ctx, beta = 1.2; let nbr = [0.4, 1.1, 0.7, 2.2], th = 2.6, shown = 2.6, ghost = null, ghostT = 0, kind = '', outcome = '', okc = true;
    const P = K.plot(ctx, { x: 520, y: 70, w: S.w - 560, h: S.h - 200 }, { x: [-180, 180], y: [0, 1], xt: K.ticks([-180, -90, 0, 90, 180], v => (v < 0 ? '−' : '') + Math.abs(v) + '°'), yt: [], xl: 'spin angle θ', fs: 18 });
    const hvec = () => { let a = 0, b = 0; for (const t of nbr) { a += Math.cos(t); b += Math.sin(t); } return [a, b]; };
    const energy = (t) => { const [hx, hy] = hvec(); return -(hx * Math.cos(t) + hy * Math.sin(t)); };
    function step(k) {
      const [hx, hy] = hvec(), hm = Math.hypot(hx, hy), ph = Math.atan2(hy, hx), e0 = energy(th); kind = k;
      if (k === 'metro') {
        const prop = th + (2 * rand() - 1) * 1.6, e1 = energy(prop), pa = Math.min(1, Math.exp(-beta * (e1 - e0))), u = rand(); ghost = prop; ghostT = 1;
        okc = u < pa; if (okc) th = prop;
        outcome = `Metropolis: random kick, ΔE = ${(e1 - e0).toFixed(2)}, ${okc ? 'accepted' : 'rejected'}`;
      } else if (k === 'hb') { th = ph + LFT.vonMises(beta * hm); ghost = th; ghostT = 1; okc = true; outcome = 'Heat bath: fresh draw from p(θ | neighbours), always accepted'; }
      else { th = 2 * ph - th; ghost = th; ghostT = 1; okc = true; outcome = 'Overrelaxation: mirror image about h, ΔE = 0 exactly'; }
      th = LFT.wrap(th);
    }
    function draw() {
      S.clear();
      const ox = 220, oy = 250, d = 150, pos = [[d, 0], [0, -d], [-d, 0], [0, d]];
      ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 3; for (const [dx, dy] of pos) { ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + dx, oy + dy); ctx.stroke(); } ctx.restore();
      nbr.forEach((a, k) => { const [dx, dy] = pos[k]; U.circle(ctx, ox + dx, oy + dy, 38, '#FBFAF7', C.faint, 1.5); K.arrowA(ctx, ox + dx, oy + dy, a, 56, K.cycCss(a), 3.6, 0.35); });
      const [hx, hy] = hvec(), hm = Math.hypot(hx, hy), ph = Math.atan2(hy, hx);
      ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox - 120 * Math.cos(ph), oy + 120 * Math.sin(ph)); ctx.lineTo(ox + 120 * Math.cos(ph), oy - 120 * Math.sin(ph)); ctx.stroke(); ctx.restore();
      if (ghost !== null && ghostT > 0) { ctx.save(); ctx.globalAlpha = ghostT; K.arrowA(ctx, ox, oy, ghost, 86, C.coral, 5, 0.3); ctx.restore(); }
      U.circle(ctx, ox, oy, 50, '#fff', C.ink, 2);
      K.arrowA(ctx, ox, oy, shown, 86, C.blue, 5.5, 0.32);
      K.label(ctx, 'axis of the local field h', ox, oy + 230, { size: 18, color: C.muted, align: 'center' });
      const xs = [], ys = []; let mx = 0;
      for (let i = 0; i <= 360; i++) { const a = (i - 180) * Math.PI / 180; xs.push(i - 180); const v = Math.exp(beta * hm * (Math.cos(a - ph) - 1)); ys.push(v); mx = Math.max(mx, v); }
      P.setY(0, mx * 1.1); P.axes();
      P.vline(LFT.wrap(ph) * 180 / Math.PI, C.muted, 2, [7, 6]);
      P.line(xs, ys, C.ink, 3);
      P.vline(LFT.wrap(shown) * 180 / Math.PI, C.blue, 4);
      if (ghost !== null && ghostT > 0) P.vline(LFT.wrap(ghost) * 180 / Math.PI, rgba(C.coral, ghostT), 4);
      K.label(ctx, 'distribution of θ given its four neighbours', P.b.x, 40, { size: 20, color: C.ink, weight: 650 });
      K.label(ctx, outcome, 40, S.h - 20, { size: 21, color: okc ? C.tealDark : '#B4492F', weight: 650 });
    }
    let t = 0, cyc = 0;
    function frame(dt) {
      t += dt;
      if (t > 1.7) { t = 0; step(['metro', 'hb', 'or', 'metro', 'or', 'hb'][cyc++ % 6]); if (cyc % 9 === 0) nbr = nbr.map(a => a + 0.6 * LFT.randn()); }
      shown += LFT.wrap(th - shown) * Math.min(1, dt * 7); ghostT = Math.max(0, ghostT - dt * 0.8);
      draw();
    }
    step('hb');
    return { frame, draw, ff: 0.3 };
  };
})();
