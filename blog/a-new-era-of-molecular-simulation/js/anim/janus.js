/* JANUS animations: ensembles, masked discrete + continuous generation, soft labels, common tangent, defect discovery. */
(function () {
  'use strict';
  const { C, rgba, mix, E, atom, flatAtom, roundRect, arrow, curvedArrow, text, richText, font, makeRng, wiggle } = U;
  const SPA = C.copper, SPB = C.steel;

  function vacancy(ctx, x, y, r, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.setLineDash([4, 4]); ctx.strokeStyle = rgba(C.inkSoft, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
  }
  function masked(ctx, x, y, r, alpha = 1) { flatAtom(ctx, x, y, r, C.mask, alpha); }

  // ------------------------------------------------------------------
  // Four ensembles: NVT, NPT, ΔμNPT (semi-grand canonical), μVT (grand canonical)
  // ------------------------------------------------------------------
  ANIMS.ensembles4 = function (S, o) {
    const ctx = S.ctx, rng = makeRng(8); let clock = 0;
    let shown = o && o.reveal ? 1 : 4; const born = [0, -1, -1, -1]; // with {"reveal": true}, one more ensemble per click
    const n = 5, box = 270, pw = S.w / 4;
    // The ensemble names and the fixed variables are typeset by KaTeX (S.tex, a layer over the canvas), as the slides write them: $NVT$, $\Delta\mu NPT$ …
    const panels = [
      { key: '$NVT$', name: 'canonical', fixed: 'fixed: $N$, $V$, $T$', fl: 'positions', tag: 'ATLAS', vol: false, swap: false, gc: false },
      { key: '$NPT$', name: 'isothermal–isobaric', fixed: 'fixed: $N$, $P$, $T$', fl: '+ volume', tag: 'JANUS', vol: true, swap: false, gc: false },
      { key: '$\\Delta\\mu NPT$', name: 'semi-grand canonical', fixed: 'fixed: $\\Delta\\mu$, $N$, $P$, $T$', fl: '+ composition', tag: 'JANUS', vol: true, swap: true, gc: false },
      { key: '$\\mu VT$', name: 'grand canonical', fixed: 'fixed: $\\mu$, $V$, $T$', fl: '+ particle number', tag: 'JANUS', vol: false, swap: false, gc: true }];
    panels.forEach((P, pi) => {
      P.sites = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) P.sites.push({ i, j, sp: rng.u() < 0.55 ? 0 : 1, prev: 0, tr: 1, occ: 1, occT: 1, seed: rng.u() * 100 });
      P.sites.forEach(s => s.prev = s.sp); P.next = 0.3;
    });
    function draw() {
      S.clear();
      panels.forEach((P, pi) => {
        if (pi >= shown) return;
        const al = o && o.reveal && born[pi] > 0 ? E.smooth((clock - born[pi]) / 0.45) : 1;   // the panel fades in on its click
        ctx.save(); ctx.globalAlpha = al;
        const cx = pi * pw + pw / 2, cy = 40 + box / 2 + 10;
        const sc = P.vol ? 1 + 0.06 * Math.sin(clock * 1.25 + pi) + 0.02 * Math.sin(clock * 3.3 + pi * 2) : 1;
        const b = box * sc, a = b / n;
        roundRect(ctx, cx - b / 2, cy - b / 2, b, b, 6, '#fff', P.vol ? C.blue : rgba(C.inkSoft, 0.55), P.vol ? 2.6 : 1.8);
        if (P.vol) { // breathing arrows
          const d = 18; arrow(ctx, cx + b / 2 + 6, cy, cx + b / 2 + 6 + d * (0.6 + 0.4 * Math.sin(clock * 1.25 + pi)), cy, rgba(C.blue, 0.8), 2.2, 8);
          arrow(ctx, cx - b / 2 - 6, cy, cx - b / 2 - 6 - d * (0.6 + 0.4 * Math.sin(clock * 1.25 + pi)), cy, rgba(C.blue, 0.8), 2.2, 8);
        }
        P.sites.forEach(s => {
          const x = cx - b / 2 + (s.i + 0.5) * a + 3.2 * wiggle(s.seed, clock * 3.2), y = cy - b / 2 + (s.j + 0.5) * a + 3.2 * wiggle(s.seed + 5, clock * 3.2);
          const r = 0.36 * box / n;
          if (P.gc) { if (s.occ === 0 && s.occT >= 1) { vacancy(ctx, x, y, r); return; } const sc2 = s.occ ? E.out(s.occT) : 1 - E.out(s.occT); if (s.occ === 0) vacancy(ctx, x, y, r, 1 - sc2); atom(ctx, x, y, r * Math.max(0.01, sc2), s.sp ? SPB : SPA, Math.min(1, sc2 * 1.3)); return; }
          const col = s.tr < 1 ? mix(s.prev ? SPB : SPA, s.sp ? SPB : SPA, E.smooth(s.tr)) : (s.sp ? SPB : SPA);
          atom(ctx, x, y, r, col);
          if (P.swap && s.tr < 1) { ctx.save(); ctx.strokeStyle = rgba(C.violet, 1 - s.tr); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + 7, 0, 2 * Math.PI); ctx.stroke(); ctx.restore(); }
        });
        const ty = cy + box / 2 + 62;
        S.tex('key' + pi, P.key, cx, ty, { size: 34, weight: 700, color: P.tag === 'ATLAS' ? C.tealDark : C.violet, align: 'center', alpha: al });
        text(ctx, P.name, cx, ty + 32, { size: 21, color: C.ink, align: 'center', weight: 560 });
        S.tex('fixed' + pi, P.fixed, cx, ty + 62, { size: 19, color: C.inkSoft, align: 'center', alpha: al });
        text(ctx, 'samples: ' + P.fl, cx, ty + 88, { size: 19, color: C.inkSoft, align: 'center' });
        roundRect(ctx, cx - 46, ty + 104, 92, 30, 15, P.tag === 'ATLAS' ? rgba(C.teal, 0.14) : rgba(C.violet, 0.14));
        text(ctx, P.tag, cx, ty + 126, { size: 17, color: P.tag === 'ATLAS' ? C.tealDark : C.violet, align: 'center', weight: 700 });
        ctx.restore();
      });
    }
    return {
      frame(dt) {
        clock += dt;
        panels.forEach(P => {
          P.sites.forEach(s => { if (s.tr < 1) s.tr += dt / 0.5; if (s.occT < 1) s.occT += dt / 0.45; });
          P.next -= dt;
          if (P.next <= 0) {
            if (P.swap) { const s = rng.pick(P.sites); s.prev = s.sp; s.sp = 1 - s.sp; s.tr = 0; P.next = 0.28 + rng.u() * 0.3; }
            else if (P.gc) { const s = rng.pick(P.sites); const nv = P.sites.filter(q => q.occ === 0).length; if (s.occ && nv < 5) { s.occ = 0; s.occT = 0; } else if (!s.occ) { s.occ = 1; s.occT = 0; s.sp = rng.u() < 0.5 ? 0 : 1; } P.next = 0.35 + rng.u() * 0.35; }
            else P.next = 1e9;
          }
        });
        draw();
      },
      step(k) { if (!(o && o.reveal)) return; const n2 = Math.min(4, k + 1); for (let i = 0; i < 4; i++) { if (i < n2 && i >= shown) born[i] = clock + 1e-6; } shown = n2; },
      draw
    };
  };

  // ------------------------------------------------------------------
  // JANUS generation: masked species revealed in random order + continuous displacements & volume
  // ------------------------------------------------------------------
  ANIMS.janusGen = function (S, o) {
    const ctx = S.ctx; let rng = makeRng(13), clock = 0, cyc = -1;
    const n = 8, B0 = 470, LX = 40, LY = 40;
    const T_PRI = 0.9, T_GEN = 5.6, T_HOLD = 2.4, P = T_PRI + T_GEN + T_HOLD;
    let sites = [], last = null, dmu = 0, v0 = 1.06, v1 = 1;
    const dmus = [0.0, 0.9, -0.9];
    // All notation is typeset by KaTeX (S.tex, a layer over the canvas), in the notation of the slides: species a and positions x in bold,
    // log-volume v. One constant string per condition, so nothing is typeset again while the animation runs.
    const COND = dmus.map(d => 'condition: $T=900\\,\\mathrm{K}$,\u00a0 $\\Delta\\mu=' + (d > 0 ? '+' : '') + d.toFixed(1) + '$');
    function newCycle() {
      cyc++; rng = makeRng(100 + cyc); dmu = dmus[cyc % 3];
      sites = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) sites.push({ i, j, tau: rng.u() * 0.92 + 0.04, sp: -1, u0: [rng.normal() * 0.22, rng.normal() * 0.22], u1: [rng.normal() * 0.05, rng.normal() * 0.05], post: null, seed: rng.u() * 100 });
      last = null; v0 = 1.07;
    }
    function neighbors(s) { return sites.filter(q => (Math.abs(q.i - s.i) + Math.abs(q.j - s.j) === 1) || (Math.abs(q.i - s.i) === n - 1 && q.j === s.j) || (Math.abs(q.j - s.j) === n - 1 && q.i === s.i)); }
    function reveal(s) {
      const nb = neighbors(s).filter(q => q.sp >= 0); let nA = 0, nB = 0; nb.forEach(q => { if (q.sp === 0) nA++; else if (q.sp === 1) nB++; });
      const J = 0.45, lA = dmu + J * (nA - nB), lB = -dmu + J * (nB - nA), lV = -3.0;
      const m = Math.max(lA, lB, lV), pA = Math.exp(lA - m), pB = Math.exp(lB - m), pV = Math.exp(lV - m), Z = pA + pB + pV;
      s.post = [pA / Z, pB / Z, pV / Z];
      const u = rng.u(); s.sp = u < s.post[0] ? 0 : u < s.post[0] + s.post[1] ? 1 : 2;
      last = s;
    }
    newCycle();
    function phase() { const c = clock % P; if (c < T_PRI) return { t: 0, name: 'prior' }; if (c < T_PRI + T_GEN) return { t: (c - T_PRI) / T_GEN, name: 'gen' }; return { t: 1, name: 'hold', u: (c - T_PRI - T_GEN) / T_HOLD }; }
    function draw() {
      S.clear();
      const ph = phase(), t = ph.t;
      sites.forEach(s => { if (s.sp < 0 && t >= s.tau) reveal(s); });
      const nA = sites.filter(s => s.sp === 0).length, nRev = sites.filter(s => s.sp >= 0).length;
      v1 = 0.95 + 0.1 * (nRev ? nA / nRev : 0.5);
      const vs = (1 - t) * v0 + t * v1 + 0.006 * Math.sin(clock * 4) * (1 - t);
      const b = B0 * vs, a = b / n, cx = LX + B0 / 2, cy = LY + B0 / 2;
      roundRect(ctx, cx - b / 2, cy - b / 2, b, b, 6, '#fff', rgba(C.violet, 0.75), 2.4, ph.name === 'gen' ? [8, 6] : null);
      sites.forEach(s => {
        const ux = (1 - t) * s.u0[0] + t * s.u1[0] + 0.02 * wiggle(s.seed, clock * 3), uy = (1 - t) * s.u0[1] + t * s.u1[1] + 0.02 * wiggle(s.seed + 3, clock * 3);
        const x = cx - b / 2 + (s.i + 0.5 + ux) * a, y = cy - b / 2 + (s.j + 0.5 + uy) * a, r = 0.34 * B0 / n;
        ctx.save(); ctx.fillStyle = rgba(C.inkSoft, 0.25); ctx.beginPath(); ctx.arc(cx - b / 2 + (s.i + 0.5) * a, cy - b / 2 + (s.j + 0.5) * a, 2.4, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
        if (s.sp < 0) masked(ctx, x, y, r * 0.9);
        else if (s.sp === 2) vacancy(ctx, x, y, r);
        else { const age = E.clamp((t - s.tau) / 0.05); atom(ctx, x, y, r * (0.8 + 0.2 * E.out(age)), s.sp ? SPB : SPA); }
        if (s === last && ph.name === 'gen') { ctx.strokeStyle = C.coral; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + 7, 0, 2 * Math.PI); ctx.stroke(); }
      });
      // time bar
      const ty = LY + B0 + 60, tx0 = LX, tx1 = LX + B0;
      ctx.strokeStyle = rgba(C.inkSoft, 0.25); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx0, ty); ctx.lineTo(tx1, ty); ctx.stroke();
      ctx.strokeStyle = C.violet; ctx.beginPath(); ctx.moveTo(tx0, ty); ctx.lineTo(tx0 + (tx1 - tx0) * t, ty); ctx.stroke();
      U.circle(ctx, tx0 + (tx1 - tx0) * t, ty, 10, '#fff', C.violet, 4);
      text(ctx, 'all masked', tx0, ty + 36, { size: 20, color: C.inkSoft });
      text(ctx, 'target ensemble', tx1, ty + 36, { size: 20, color: C.inkSoft, align: 'right' });
      // right panel: channels + posterior
      const RX = LX + B0 + 80;
      S.tex('cond' + (cyc % 3), COND[cyc % 3], RX, 60, { size: 22, color: C.ink, weight: 600 });
      const rows = [
        ['species\u00a0 $\\mathbf a$', 'discrete · masked diffusion', nRev / sites.length, C.violet],
        ['displacements\u00a0 $\\mathbf u$', 'continuous · Gaussian prior', t, C.teal],
        ['log-volume\u00a0 $v$', 'continuous · Gaussian prior', t, C.blue]];
      rows.forEach((r, k) => {
        const y = 120 + k * 92;
        S.tex('row' + k, r[0], RX, y, { size: 24, weight: 650, color: r[3] });
        text(ctx, r[1], RX, y + 28, { size: 18, color: C.inkSoft });
        ctx.strokeStyle = rgba(r[3], 0.18); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(RX + 290, y - 8); ctx.lineTo(RX + 450, y - 8); ctx.stroke();
        ctx.strokeStyle = r[3]; ctx.beginPath(); ctx.moveTo(RX + 290, y - 8); ctx.lineTo(RX + 290 + 160 * r[2], y - 8); ctx.stroke();
      });
      // posterior bars of the last revealed site
      const py = 420;
      S.tex('post', 'denoising posterior\u00a0 $q_{\\theta,i}(b\\mid\\mathbf a_t,\\mathbf x_t)$', RX, py, { size: 22, color: C.ink });
      const names = ['A', 'B', 'vac'], cols = [SPA, SPB, C.muted];
      for (let k = 0; k < 3; k++) {
        const v = last && last.post ? last.post[k] : 0; const y = py + 30 + k * 40;
        text(ctx, names[k], RX + 10, y + 22, { size: 20, color: C.inkSoft });
        roundRect(ctx, RX + 70, y + 4, 330 * Math.max(0.005, v), 24, 6, cols[k]);
        text(ctx, v.toFixed(2), RX + 80 + 330 * v, y + 23, { size: 18, color: C.inkSoft });
      }
    }
    return { frame(dt) { const before = Math.floor(clock / P); clock += dt; if (Math.floor(clock / P) !== before) newCycle(); draw(); }, draw, ff: T_PRI + 0.62 * T_GEN };
  };

  // ------------------------------------------------------------------
  // Discrete "score": the one-hot label against the soft label (the single-site conditional of the target).
  // The discrete training signal, in the order of the slide's clicks:
  //   0  the one-hot label: a delta on the symbol the sample has at site i (right when the sample is data)
  //   1  crossed out: once the sample is the model's own, that label carries no signal
  //   2  the soft label: every other site stays fixed, site i runs through the K species, the K weights are renormalized
  //      (the bar of the species on trial is the solid one)
  //   3  the picture stays
  // {"softStep": 3}: the soft label comes on click 3 instead (one click in between that changes nothing in the picture)
  // ------------------------------------------------------------------
  ANIMS.softLabel = function (S, o) {
    const ctx = S.ctx; let clock = 0, step = 0;
    const n = 5, box = 380, LX = 30, LY = 70, a = box / n;
    const grid = [[0, 0, 1, 0, 1], [1, 0, 0, 1, 0], [0, 1, -1, 0, 0], [0, 0, 1, 1, 0], [1, 0, 0, 0, 1]]; // -1 = site i (current symbol B)
    const cur = 1;
    const nbs = [[1, 2], [3, 2], [2, 1], [2, 3]].map(([i, j]) => grid[j][i]);
    // toy energy: like-neighbour attraction, vacancy penalty; values in units of k_B T
    const J = 0.55, mu = [0, 0.15, -1.4];
    const dU = [0, 1, 2].map(b => b === 2 ? 1.6 : -J * nbs.filter(v => v === b).length + J * nbs.filter(v => v !== b).length * 0.5);
    const logits = dU.map((u, b) => mu[b] - u); const m = Math.max(...logits); const ex = logits.map(l => Math.exp(l - m)); const Z = ex.reduce((s, v) => s + v, 0); const rho = ex.map(v => v / Z);
    const names = ['A', 'B', 'vacancy'], cols = [SPA, SPB, C.muted];
    const BW = 260, ROW = 46;   // bar length of probability 1; row pitch
    const SOFT = (o && o.softStep) || 2;   // the click on which the soft label appears
    function draw() {
      S.clear();
      roundRect(ctx, LX, LY, box, box, 6, '#fff', rgba(C.inkSoft, 0.55), 1.8);
      text(ctx, step >= 1 ? "the model's own sample" : 'a sample from data', LX, LY - 22, { size: 21, color: C.inkSoft });
      const trial = step === SOFT;   // site i runs through the K species while the soft label is introduced
      const cand = trial ? Math.floor(clock * 1.1) % 3 : cur;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const x = LX + (i + 0.5) * a, y = LY + (j + 0.5) * a, v = grid[j][i];
        if (v === -1) {
          if (cand === 2) vacancy(ctx, x, y, a * 0.38); else atom(ctx, x, y, a * 0.36, cand ? SPB : SPA);
          ctx.strokeStyle = C.coral; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(x, y, a * 0.47, 0, 2 * Math.PI); ctx.stroke();
          S.tex('site', '$i$', x + a / 2, y - a / 2, { size: 25, weight: 700, color: C.coral, align: 'center', valign: 'middle' });   // in the gap between four atoms, where nothing covers it
        } else atom(ctx, x, y, a * 0.36, v ? SPB : SPA);
      }
      const RX = LX + box + 70, BX = RX + 110;
      // the one-hot label
      S.tex('hot', 'one-hot label $\\delta_{b,\\,a_i}$', RX, LY - 22, { size: 22, color: C.ink });
      for (let b = 0; b < 3; b++) {
        const y = LY + 4 + b * ROW, w = b === cur ? BW : 3;
        text(ctx, names[b], RX, y + 22, { size: 20, color: C.inkSoft });
        roundRect(ctx, BX, y + 4, w, 26, b === cur ? 6 : 1.5, b === cur ? cols[b] : rgba(C.muted, 0.7));
        text(ctx, b === cur ? '1' : '0', BX + w + 10, y + 24, { size: 18, color: C.inkSoft });
      }
      if (step >= 1) { // crossed out, one stroke after the other
        const k = step === 1 ? E.clamp(clock / 0.5) : 1, k1 = E.out(E.clamp(k * 2)), k2 = E.out(E.clamp(k * 2 - 1));
        const x0 = RX + 92, x1 = BX + BW + 34, y0 = LY, y1 = LY + 4 + 2 * ROW + 36;
        ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * k1, y0 + (y1 - y0) * k1);
        if (k2 > 0) { ctx.moveTo(x0, y1); ctx.lineTo(x0 + (x1 - x0) * k2, y1 - (y1 - y0) * k2); }
        ctx.stroke(); ctx.restore();
      }
      if (step >= SOFT) { // the soft label
        const y0 = LY + 250, g = trial ? E.out(E.clamp(clock * 2)) : 1;
        S.tex('soft', 'soft label $\\rho_i(b\\mid\\mathbf a_{-i},\\mathbf x)$', RX, y0, { size: 22, color: C.tealDark });
        for (let b = 0; b < 3; b++) {
          const y = y0 + 22 + b * ROW, on = !trial || cand === b, w = Math.max(3, BW * rho[b] * g);
          text(ctx, names[b], RX, y + 22, { size: 20, color: on && trial ? C.ink : C.inkSoft, weight: on && trial ? 650 : 500 });
          ctx.save(); ctx.globalAlpha = on ? 1 : 0.35; roundRect(ctx, BX, y + 4, w, 26, w > 12 ? 6 : 1.5, cols[b]); ctx.restore();
          text(ctx, rho[b].toFixed(2), BX + w + 10, y + 24, { size: 18, color: C.inkSoft });
        }
      }
    }
    return { frame(dt) { clock += dt; draw(); }, step(k) { step = k; clock = 0; }, draw };
  };

  // ------------------------------------------------------------------
  // Common-tangent construction -> binodal (illustration with a regular-solution model)
  // ------------------------------------------------------------------
  ANIMS.commonTangent = function (S, o) {
    const ctx = S.ctx; let clock = 0;
    const Om = 2.0; // regular solution, T_c = Om / 2 = 1
    const G = (x, T) => Om * x * (1 - x) + T * (x * Math.log(x) + (1 - x) * Math.log(1 - x));
    function binodal(T) { if (T >= 0.999) return 0.5; let lo = 1e-9, hi = 0.5 - 1e-6; const f = (x) => Math.log(x / (1 - x)) + Om * (1 - 2 * x) / T; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; } return (lo + hi) / 2; }
    const pts = []; let lastT = 2; const ghosts = [];
    const L = { x: 80, y: 40, w: 420, h: 400 }, R = { x: 590, y: 40, w: 340, h: 400 };
    const Tof = (c) => 1.02 - 0.5 * E.clamp(c / 6.5);
    const gmin = -0.2, gmax = 0.17;
    const gx = (x) => L.x + x * L.w, gy = (g) => L.y + L.h - (g - gmin) / (gmax - gmin) * L.h;
    function curve(T, color, lw) { ctx.beginPath(); for (let i = 1; i < 200; i++) { const x = i / 200; const y = gy(G(x, T)); if (i > 1) ctx.lineTo(gx(x), y); else ctx.moveTo(gx(x), y); } ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(); }
    function draw() {
      S.clear();
      const T = Tof(clock);
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(L.x, L.y + L.h); ctx.lineTo(L.x + L.w, L.y + L.h); ctx.stroke();
      ctx.save(); ctx.setLineDash([3, 5]); ctx.strokeStyle = rgba(C.inkSoft, 0.35); ctx.beginPath(); ctx.moveTo(L.x, gy(0)); ctx.lineTo(L.x + L.w, gy(0)); ctx.stroke(); ctx.restore();
      ghosts.forEach((gT, i) => curve(gT, rgba(C.violet, 0.12 + 0.05 * i), 1.5));
      curve(T, C.violet, 3.5);
      const xb = binodal(T);
      if (xb < 0.47) {
        const x2 = 1 - xb, g1 = G(xb, T);
        ctx.save(); ctx.setLineDash([8, 6]); ctx.strokeStyle = C.coral; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(gx(0.03), gy(g1)); ctx.lineTo(gx(0.97), gy(g1)); ctx.stroke(); ctx.restore();
        U.circle(ctx, gx(xb), gy(g1), 8, C.coral, '#fff', 2); U.circle(ctx, gx(x2), gy(g1), 8, C.coral, '#fff', 2);
        text(ctx, 'common tangent', gx(0.5), gy(g1) + 30, { size: 19, color: C.coral, align: 'center', weight: 600 });
        ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = rgba(C.coral, 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx(xb), gy(g1)); ctx.lineTo(gx(xb), L.y + L.h); ctx.moveTo(gx(x2), gy(g1)); ctx.lineTo(gx(x2), L.y + L.h); ctx.stroke(); ctx.restore();
      }
      // All notation is typeset by KaTeX (S.tex, a layer over the canvas). The temperature readout has one label per displayed value
      // (two decimals), each typeset once and only shown or hidden afterwards.
      S.tex('G', '$G_{\\mathrm{mix}}(x)$', L.x + 12, L.y + 16, { size: 22, color: C.ink });
      S.tex('xL', 'composition $x$', L.x + L.w, L.y + L.h + 32, { size: 19, color: C.inkSoft, align: 'right' });
      const Ts = Math.min(1, T).toFixed(2);
      S.tex('T' + Ts, '$T=' + Ts + '\\,T_c$', L.x + L.w - 10, L.y + 22, { size: 22, color: C.navy, align: 'right', weight: 650 });
      // phase diagram
      if (T < lastT - 0.012 && xb < 0.49) { pts.push([xb, T]); lastT = T; if (pts.length % 6 === 0) { ghosts.push(T); if (ghosts.length > 5) ghosts.shift(); } }
      const px = (x) => R.x + x * R.w, py = (t) => R.y + R.h - (t - 0.45) / (1.05 - 0.45) * R.h;
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(R.x, R.y); ctx.lineTo(R.x, R.y + R.h); ctx.lineTo(R.x + R.w, R.y + R.h); ctx.stroke();
      if (pts.length > 1) {
        ctx.beginPath(); ctx.moveTo(px(0.5), py(1)); pts.forEach(p => ctx.lineTo(px(p[0]), py(p[1]))); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(px(1 - pts[i][0]), py(pts[i][1])); ctx.closePath(); ctx.fillStyle = rgba(C.muted, 0.2); ctx.fill();
      }
      pts.forEach(p => { U.circle(ctx, px(p[0]), py(p[1]), 4.5, C.coral); U.circle(ctx, px(1 - p[0]), py(p[1]), 4.5, C.coral); });
      ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = rgba(C.navy, 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(R.x, py(Math.min(1.04, T))); ctx.lineTo(R.x + R.w, py(Math.min(1.04, T))); ctx.stroke(); ctx.restore();
      if (pts.length > 10) text(ctx, 'two phases', px(0.5), py(0.66), { size: 20, color: C.inkSoft, align: 'center' });
      S.tex('Tax', '$T$', R.x - 14, R.y + 12, { size: 22, color: C.ink, align: 'right' });
      S.tex('xR', 'composition $x$', R.x + R.w, R.y + R.h + 32, { size: 19, color: C.inkSoft, align: 'right' });
      text(ctx, 'phase diagram', R.x + R.w / 2, R.y - 14, { size: 21, color: C.ink, align: 'center', weight: 650 });
      text(ctx, 'illustration: regular-solution model', (L.x + R.x + R.w) / 2, S.h - 10, { size: 17, color: C.muted, align: 'center' });
    }
    return { frame(dt) { clock += dt; if (clock > 9.5) { clock = 0; pts.length = 0; ghosts.length = 0; lastT = 2; } draw(); }, draw, ff: 5.6 };
  };

  // ------------------------------------------------------------------
  // Grand-canonical sampling -> motif statistics -> DFT shortlist (schematic)
  // ------------------------------------------------------------------
  ANIMS.defectDiscovery = function (S, o) {
    const ctx = S.ctx, rng = makeRng(77); let clock = 0;
    const nx = 11, ny = 9, ax = 42, ay = 46, X0 = 50, Y0 = 84;
    const sites = []; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) sites.push({ i, j, x: X0 + i * ax + (j % 2) * ax / 2, y: Y0 + j * ay });
    const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < ax * 1.05;
    const species = [{ c: C.pink }, { c: C.blue }, { c: C.orange }, { c: C.green }, { c: C.gold }, { c: '#7E57C2' }];
    const favored = [[0, 'V'], [3, 4], [1, 'V']]; // motifs enriched in this toy ensemble
    const counts = {}; let nCfg = 0, cfg = [], links = [];
    function key(a, b) { const s2 = [String(a), String(b)].sort(); return s2.join('-'); }
    const motifs = [key(0, 'V'), key(3, 4), key(1, 'V'), key(2, 5), key(1, 3), key(0, 2)];
    function sample() {
      cfg = []; links = []; const used = new Set();
      while (cfg.length < 9) {
        const s0 = rng.int(sites.length); if (used.has(s0)) continue;
        if (rng.u() < 0.5) {
          const f = rng.pick(favored); const nb = sites.map((q, k) => k).filter(k => k !== s0 && near(sites[k], sites[s0]) && !used.has(k));
          if (nb.length) { const t = rng.pick(nb); used.add(s0); used.add(t); cfg.push({ s: s0, sp: f[0] }); cfg.push({ s: t, sp: f[1] }); continue; }
        }
        used.add(s0); cfg.push({ s: s0, sp: rng.u() < 0.2 ? 'V' : rng.int(species.length) });
      }
      for (let a = 0; a < cfg.length; a++) for (let b = a + 1; b < cfg.length; b++) if (near(sites[cfg[a].s], sites[cfg[b].s])) { links.push([a, b]); const k = key(cfg[a].sp, cfg[b].sp); counts[k] = (counts[k] || 0) + 1; }
      // background pairs at random-mixing frequency for the non-favoured motifs
      motifs.slice(3).forEach(m => { if (rng.u() < 0.3) counts[m] = (counts[m] || 0) + 1; });
      nCfg++;
    }
    for (let k = 0; k < 6; k++) sample();
    function draw() {
      S.clear();
      roundRect(ctx, X0 - 34, Y0 - 40, nx * ax + 50, ny * ay + 40, 14, '#fff', rgba(C.inkSoft, 0.2), 1.5);
      sites.forEach((s0, k) => { sites.forEach((q, kk) => { if (kk > k && near(s0, q)) { ctx.strokeStyle = rgba(C.inkSoft, 0.14); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(q.x, q.y); ctx.stroke(); } }); });
      const map = new Map(cfg.map((d, i) => [d.s, i]));
      sites.forEach((s0, k) => { if (!map.has(k)) U.circle(ctx, s0.x, s0.y, 8, rgba(C.steel, 0.55)); });
      const pulse = 0.5 + 0.5 * Math.sin(clock * 5);
      links.forEach(([a, b]) => { const p = sites[cfg[a].s], q = sites[cfg[b].s]; ctx.strokeStyle = rgba(C.coral, 0.45 + 0.4 * pulse); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); });
      cfg.forEach(d => { const s0 = sites[d.s]; if (d.sp === 'V') vacancy(ctx, s0.x, s0.y, 14); else atom(ctx, s0.x, s0.y, 14, species[d.sp].c); });
      text(ctx, `grand-canonical sample #${nCfg}`, X0 - 22, Y0 - 52, { size: 19, color: C.inkSoft, weight: 600 });
      // enrichment bars: share of each motif relative to a uniform share (schematic)
      const BX = X0 + nx * ax + 70, BW = S.w - BX - 10, BY = 22;
      text(ctx, 'motif enrichment', BX, BY + 6, { size: 21, color: C.ink, weight: 650 });
      text(ctx, 'observed / random mixing', BX, BY + 32, { size: 17, color: C.inkSoft });
      const tot = motifs.reduce((acc, m) => acc + (counts[m] || 0), 0) || 1;
      const scaleMax = 3.2, x1 = BX + 64 + (BW - 80) / scaleMax;
      motifs.forEach((m, k) => {
        const y = BY + 58 + k * 56, ratio = Math.min(scaleMax, ((counts[m] || 0) / tot) * motifs.length);
        const [a, b] = m.split('-');
        const dot = (v, x) => { if (v === 'V') vacancy(ctx, x, y + 15, 11); else atom(ctx, x, y + 15, 11, species[+v].c); };
        dot(a, BX + 12); dot(b, BX + 40);
        const w = (BW - 80) * ratio / scaleMax; roundRect(ctx, BX + 64, y + 4, Math.max(2, w), 24, 6, ratio > 1 ? rgba(C.coral, 0.8) : rgba(C.steel, 0.6));
      });
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x1, BY + 50); ctx.lineTo(x1, BY + 58 + motifs.length * 56); ctx.stroke(); ctx.restore();
      text(ctx, 'random', x1 - 4, BY + 80 + motifs.length * 56, { size: 16, color: C.inkSoft, align: 'center' });
      text(ctx, 'enriched motifs → DFT', BX, S.h - 14, { size: 19, color: C.coral, weight: 650 });
    }
    return { frame(dt) { clock += dt; if (clock > 1.1) { clock = 0; sample(); } draw(); }, draw, ff: 12 };
  };
})();
