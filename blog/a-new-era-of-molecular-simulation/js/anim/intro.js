/* Intro animations: hero transport, micro->macro pipeline, trapped MCMC, MCMC vs neural sampler, data vs energy. */
(function () {
  'use strict';
  const { C, rgba, mix, E, atom, flatAtom, roundRect, arrow, text, richText, font, makeRng, wiggle, wrap01, minImage } = U;

  // ------------------------------------------------------------------
  // Periodic-box transport of a real 2D Kob-Andersen configuration:
  // wrapped bridge interpolant x_t = wrap(x0 + a(t) Δ + γ(t) z_t), forward (teal) then backward (blue, dashed).
  // Used for the title slide (opts.hero) and the ATLAS slide (forces at t=1).
  // ------------------------------------------------------------------
  function torusTransport(S, o) {
    const ctx = S.ctx, cfg = KA_DATA[o.config || 'n144_T0.3'];
    const N = cfg.N, L = cfg.L, rng = makeRng(o.seed || 7);
    const box = o.box || 600, bx = o.bx !== undefined ? o.bx : (S.w - box) / 2, by = o.by !== undefined ? o.by : (S.h - box) / 2 - (o.timebar ? 30 : 0);
    const sig = box / L, rA = 0.47 * sig, rB = 0.36 * sig;
    const types = cfg.t;
    let X1 = new Float64Array(2 * N), X0 = new Float64Array(2 * N), D = new Float64Array(2 * N), seeds = new Float64Array(N);
    const T_PRIOR = 0.9, T_FWD = 4.6, T_HOLD = o.hero ? 2.2 : 3.2, T_BWD = 3.2, P = T_PRIOR + T_FWD + T_HOLD + T_BWD;
    let clock = 0, cycle = -1, forces = null, step = 0;
    const gamma0 = 0.055, trailN = 26;
    const trail = []; // ring buffer of positions (unwrapped) for trails
    let layer = null;

    function newCycle() {
      cycle++;
      // random symmetry of the target so every loop looks different
      const rot = rng.int(4), flip = rng.u() < 0.5, sx = rng.u(), sy = rng.u();
      for (let i = 0; i < N; i++) {
        let x = cfg.x[2 * i], y = cfg.x[2 * i + 1];
        for (let r = 0; r < rot; r++) { const tx = x; x = 1 - y; y = tx; }
        if (flip) x = 1 - x;
        X1[2 * i] = wrap01(x + sx); X1[2 * i + 1] = wrap01(y + sy);
        X0[2 * i] = rng.u(); X0[2 * i + 1] = rng.u();
        seeds[i] = rng.u() * 100;
      }
      for (let j = 0; j < 2 * N; j++) D[j] = minImage(X1[j] - X0[j]);
      forces = null; trail.length = 0;
    }
    function alpha(t) { return E.smoother(t); }
    function pos(i, t, tt) { // unwrapped position of atom i at bridge time t
      const g = gamma0 * Math.sin(Math.PI * t);
      return [X0[2 * i] + alpha(t) * D[2 * i] + g * wiggle(seeds[i], tt * 2.2), X0[2 * i + 1] + alpha(t) * D[2 * i + 1] + g * wiggle(seeds[i] + 33, tt * 2.2)];
    }
    function phase() {
      const c = clock % P;
      if (c < T_PRIOR) return { name: 'prior', t: 0, u: c / T_PRIOR };
      if (c < T_PRIOR + T_FWD) return { name: 'fwd', t: E.inOut((c - T_PRIOR) / T_FWD), u: (c - T_PRIOR) / T_FWD };
      if (c < T_PRIOR + T_FWD + T_HOLD) return { name: 'hold', t: 1, u: (c - T_PRIOR - T_FWD) / T_HOLD };
      return { name: 'bwd', t: 1 - E.inOut((c - T_PRIOR - T_FWD - T_HOLD) / T_BWD), u: (c - T_PRIOR - T_FWD - T_HOLD) / T_BWD };
    }
    newCycle();

    function computeForces() {
      const xs = new Float64Array(2 * N);
      for (let j = 0; j < 2 * N; j++) xs[j] = wrap01(X1[j]);
      const F = U.kaForces(xs, types, L);
      forces = F;
    }

    function draw() {
      S.clear();
      const ph = phase();
      const tt = clock;
      // positions
      const P2 = new Float64Array(2 * N);
      for (let i = 0; i < N; i++) {
        let p;
        if (ph.name === 'hold') { // thermal jiggle around the sample
          const a = 0.012;
          p = [X1[2 * i] + a * wiggle(seeds[i], tt * 3.1), X1[2 * i + 1] + a * wiggle(seeds[i] + 9, tt * 3.1)];
        } else p = pos(i, ph.t, tt);
        P2[2 * i] = p[0]; P2[2 * i + 1] = p[1];
      }
      // trails
      if (ph.name === 'fwd' || ph.name === 'bwd') { trail.push({ p: P2.slice(), kind: ph.name }); if (trail.length > trailN) trail.shift(); }
      else if (trail.length) trail.shift();

      // periodic images (faint), faded out radially with a soft mask
      if (o.images !== false) {
        if (!layer) layer = document.createElement('canvas');
        if (layer.width !== S.canvas.width || layer.height !== S.canvas.height) { layer.width = S.canvas.width; layer.height = S.canvas.height; }
        const lc = layer.getContext('2d');
        lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, layer.width, layer.height); lc.setTransform(S.k, 0, 0, S.k, 0, 0);
        for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          if (!ox && !oy) continue;
          const gx = bx + ox * box, gy = by + oy * box;
          lc.save(); lc.setLineDash([6, 8]); lc.strokeStyle = rgba(C.inkSoft, 0.22); lc.lineWidth = 1.2; lc.strokeRect(gx, gy, box, box); lc.restore();
          for (let i = 0; i < N; i++) {
            const x = gx + wrap01(P2[2 * i]) * box, y = gy + wrap01(P2[2 * i + 1]) * box;
            if (x < -30 || y < -30 || x > S.w + 30 || y > S.h + 30) continue;
            flatAtom(lc, x, y, types[i] ? rB : rA, types[i] ? C.kaB : C.kaA, 0.2, 'rgba(255,255,255,0)');
          }
        }
        lc.globalCompositeOperation = 'destination-in';
        const cx = bx + box / 2, cy = by + box / 2, g = lc.createRadialGradient(cx, cy, box * 0.5, cx, cy, box * 0.92);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        lc.fillStyle = g; lc.fillRect(-10, -10, S.w + 20, S.h + 20);
        lc.globalCompositeOperation = 'source-over';
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(layer, 0, 0); ctx.restore();
      }
      // main cell
      roundRect(ctx, bx, by, box, box, 6, 'rgba(255,255,255,0.86)', rgba(C.inkSoft, 0.55), 2);
      ctx.save(); ctx.beginPath(); ctx.rect(bx, by, box, box); ctx.clip();
      // trails (drawn with the same wrap shift as the current position so they stay continuous)
      if (trail.length > 2) {
        const last = trail[trail.length - 1].p;
        for (let i = 0; i < N; i++) {
          const fx = Math.floor(last[2 * i]), fy = Math.floor(last[2 * i + 1]);
          ctx.beginPath();
          for (let k = 0; k < trail.length; k++) {
            const q = trail[k].p; const x = bx + (q[2 * i] - fx) * box, y = by + (q[2 * i + 1] - fy) * box;
            if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          const bw = trail[trail.length - 1].kind === 'bwd';
          ctx.strokeStyle = bw ? rgba(C.blue, 0.38) : rgba(C.teal, 0.42); ctx.lineWidth = bw ? 1.6 : 2.0;
          if (bw) ctx.setLineDash([5, 5]); else ctx.setLineDash([]);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      // atoms (+ copies across edges)
      const order = [];
      for (let i = 0; i < N; i++) order.push(i);
      order.sort((a, b) => types[a] - types[b]);
      const fade = ph.name === 'prior' ? 0.55 + 0.45 * ph.u : 1;
      for (const i of order) {
        const x = wrap01(P2[2 * i]), y = wrap01(P2[2 * i + 1]), r = types[i] ? rB : rA, col = types[i] ? C.kaB : C.kaA;
        for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          const X = bx + (x + ox) * box, Y = by + (y + oy) * box;
          if (X < bx - r || X > bx + box + r || Y < by - r || Y > by + box + r) continue;
          atom(ctx, X, Y, r, col, fade);
        }
      }
      // forces at t = 1 (labels used for training)
      if (o.forces && ph.name === 'hold') {
        if (!forces) computeForces();
        const a = E.smooth(ph.u * 3);
        for (let i = 0; i < N; i++) {
          const fx = forces[2 * i], fy = forces[2 * i + 1], m = Math.hypot(fx, fy);
          if (m < 1e-6) continue;
          const len = Math.min(78, 14 * Math.sqrt(m)) * a, x = bx + wrap01(P2[2 * i]) * box, y = by + wrap01(P2[2 * i + 1]) * box;
          if (len < 6) continue;
          arrow(ctx, x, y, x + fx / m * len, y + fy / m * len, 'rgba(255,255,255,0.85)', 6, 14);
          arrow(ctx, x, y, x + fx / m * len, y + fy / m * len, '#D9483B', 3.2, 12);
        }
      }
      ctx.restore();
      // time bar
      if (o.timebar) {
        const y0 = by + box + 52, x0 = bx + 10, x1 = bx + box - 10;
        ctx.save(); ctx.lineCap = 'round';
        ctx.strokeStyle = rgba(C.inkSoft, 0.25); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
        const grad = ctx.createLinearGradient(x0, 0, x1, 0); grad.addColorStop(0, C.muted); grad.addColorStop(1, C.teal);
        ctx.strokeStyle = grad; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * ph.t, y0); ctx.stroke();
        U.circle(ctx, x0 + (x1 - x0) * ph.t, y0, 11, '#fff', ph.name === 'bwd' ? C.blue : C.teal, 4);
        ctx.restore();
        text(ctx, o.hero ? 'prior' : 'uniform prior', x0, y0 + 40, { size: o.hero ? 22 : 24, color: C.inkSoft });
        text(ctx, 'Boltzmann ensemble', x1, y0 + 40, { size: o.hero ? 22 : 24, color: C.inkSoft, align: 'right' });
        const lab = ph.name === 'bwd' ? 'backward P← (noising)' : ph.name === 'fwd' ? 'forward P→ (generation)' : ph.name === 'hold' ? (o.forces ? 'label: forces βF(X_N)' : 't = N') : 't = 0';
        const col = ph.name === 'bwd' ? C.blue : ph.name === 'hold' && o.forces ? C.coral : C.teal;
        text(ctx, lab, (x0 + x1) / 2, y0 - 20, { size: o.hero ? 22 : 25, color: col, align: 'center', weight: 600 });
      }
    }
    return {
      frame(dt) { const before = Math.floor(clock / P); clock += dt; if (Math.floor(clock / P) !== before) newCycle(); draw(); },
      draw, enter() { }, step(k) { step = k; },
      ff: T_PRIOR + T_FWD + (o.forces ? 1.8 : 0.9)
    };
  }
  ANIMS.torusTransport = torusTransport;

  // ------------------------------------------------------------------
  // Microscopic interactions -> Boltzmann ensemble -> macroscopic observable
  // ------------------------------------------------------------------
  ANIMS.microMacro = function (S, o) {
    const ctx = S.ctx, rng = makeRng(11);
    let clock = 0;
    const H = S.h;
    // zone 1: a small cluster of atoms with pair interactions
    const cl = [];
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.3; const r = i === 0 ? 0 : 72; cl.push({ x: 210 + (i === 0 ? 0 : r * Math.cos(a)), y: 175 + (i === 0 ? 0 : r * Math.sin(a)), s: rng.u() * 50, t: i % 3 === 0 ? 1 : 0 }); }
    // zone 2: ensemble cards
    const cards = [];
    function makeCard() { const pts = []; const r2 = makeRng(rng.int(1e6)); for (let i = 0; i < 30; i++) pts.push({ x: r2.u(), y: r2.u(), t: r2.u() < 0.25 ? 1 : 0, s: r2.u() * 30 }); return { pts, born: clock }; }
    for (let i = 0; i < 4; i++) cards.push(makeCard());
    // zone 3: observable histogram
    const bins = new Float64Array(28); let nObs = 0, sum = 0; const runMean = [];
    const flying = [];
    let nextEmit = 1.2;
    function sampleObs() { // a bimodal observable distribution (schematic)
      return rng.u() < 0.65 ? 0.42 + 0.09 * rng.normal() : 0.68 + 0.06 * rng.normal();
    }
    const z1 = { x: 20, w: 400 }, z2 = { x: 610, w: 470 }, z3 = { x: 1250, w: 430 };
    function draw() {
      S.clear();
      // headers
      text(ctx, 'Interactions', z1.x + z1.w / 2, 30, { size: 27, weight: 650, color: C.navy, align: 'center' });
      text(ctx, 'Equilibrium ensemble', z2.x + z2.w / 2, 30, { size: 27, weight: 650, color: C.navy, align: 'center' });
      text(ctx, 'Macroscopic behavior', z3.x + z3.w / 2, 30, { size: 27, weight: 650, color: C.navy, align: 'center' });
      // zone 1
      const P = cl.map((a, i) => ({ x: a.x + 5 * wiggle(a.s, clock * 3), y: a.y + 5 * wiggle(a.s + 7, clock * 3), t: a.t }));
      for (let i = 1; i < P.length; i++) {
        const j = i === P.length - 1 ? 1 : i + 1;
        for (const [a, b] of [[0, i], [i, j]]) {
          const d = Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y);
          ctx.strokeStyle = rgba(C.blue, 0.22 + 0.25 * Math.max(0, 1 - Math.abs(d - 72) / 14)); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y); ctx.lineTo(P[b].x, P[b].y); ctx.stroke();
        }
      }
      P.forEach(p => atom(ctx, p.x, p.y, p.t ? 17 : 22, p.t ? C.kaB : C.kaA));
      // mini LJ curve
      const gx = 70, gy = 300, gw = 300, gh = 130;
      ctx.strokeStyle = rgba(C.inkSoft, 0.4); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, gy + gh * 0.55); ctx.lineTo(gx + gw, gy + gh * 0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.stroke();
      ctx.strokeStyle = C.navy; ctx.lineWidth = 3; ctx.beginPath(); let started = false;
      for (let k = 0; k <= 160; k++) { const r = 0.95 + k / 160 * 1.57; const u = 4 * (Math.pow(1 / r, 12) - Math.pow(1 / r, 6)); const y = gy + gh * 0.55 - u * 55; const x = gx + (r - 0.92) / 1.6 * gw; if (y < gy) continue; if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y); }
      ctx.stroke();
      const rr = 1.12 + 0.05 * Math.sin(clock * 3.3), uu = 4 * (Math.pow(1 / rr, 12) - Math.pow(1 / rr, 6));
      U.circle(ctx, gx + (rr - 0.92) / 1.6 * gw, gy + gh * 0.55 - uu * 55, 7, C.coral);
      richText(ctx, [['U', 'i'], ['(', 'n'], ['r', 'i'], [')', 'n']], gx + 8, gy + 18, { size: 22, color: C.inkSoft });
      text(ctx, 'potential energy from DFT or an MLIP', z1.x + z1.w / 2, 470, { size: 21, color: C.inkSoft, align: 'center' });

      // zone 2: stacked cards
      const cw = 250, ch = 250, cx0 = z2.x + 110, cy0 = 75;
      cards.forEach((c, k) => {
        const depth = cards.length - 1 - k; const x = cx0 + depth * 26, y = cy0 + depth * 22; const age = clock - c.born;
        const a = Math.min(1, age / 0.5) * (1 - depth * 0.18);
        roundRect(ctx, x, y, cw, ch, 10, rgba('#FFFFFF', a), rgba(C.inkSoft, 0.35 * a), 1.5);
        if (depth <= 1) c.pts.forEach(p => { const px = x + 15 + p.x * (cw - 30) + 3 * wiggle(p.s, clock * 3), py = y + 15 + p.y * (ch - 30) + 3 * wiggle(p.s + 3, clock * 3); flatAtom(ctx, px, py, p.t ? 9 : 12, p.t ? C.kaB : C.kaA, a); });
      });
      richText(ctx, [['π', 'i'], ['(', 'n'], ['x', 'i'], [') ∝ exp(−', 'n'], ['β', 'i'], ['U', 'i'], ['(', 'n'], ['x', 'i'], ['))', 'n']], z2.x + z2.w / 2 + 20, 400, { size: 27, color: C.ink, align: 'center' });
      text(ctx, 'every configuration, weighted by Boltzmann', z2.x + z2.w / 2 + 20, 440, { size: 21, color: C.inkSoft, align: 'center' });

      // arrows between zones
      arrow(ctx, z1.x + z1.w + 20, 200, z2.x + 70, 200, C.coral, 4, 16);
      text(ctx, 'sample', (z1.x + z1.w + z2.x + 90) / 2, 182, { size: 24, weight: 650, color: C.coral, align: 'center' });
      text(ctx, 'the bottleneck', (z1.x + z1.w + z2.x + 90) / 2, 235, { size: 19, color: C.coral, align: 'center', alpha: 0.85 });
      arrow(ctx, z2.x + z2.w + 50, 200, z3.x - 10, 200, C.teal, 4, 16);
      text(ctx, 'average', (z2.x + z2.w + 50 + z3.x) / 2, 182, { size: 24, weight: 650, color: C.teal, align: 'center' });

      // flying samples (cards -> histogram)
      flying.forEach(f => { const u = E.inOut(f.u); const x = (cx0 + 120) + (z3.x + 30 + f.v * (z3.w - 60) - cx0 - 120) * u, y = 160 + (300 - 160) * u - 90 * Math.sin(Math.PI * u); U.circle(ctx, x, y, 8, rgba(C.teal, 0.9)); });

      // zone 3: histogram + running mean
      const hx = z3.x + 20, hy = 330, hw = z3.w - 40, hh = 230;
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + hw, hy); ctx.stroke();
      const mx = Math.max(4, ...bins);
      for (let b = 0; b < bins.length; b++) { const h = (bins[b] / mx) * (hh - 60); roundRect(ctx, hx + b * hw / bins.length + 1, hy - h, hw / bins.length - 2, h, 2, rgba(C.teal, 0.75)); }
      if (nObs > 2) {
        const m = sum / nObs; const xm = hx + m * hw;
        ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = C.navy; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(xm, hy + 4); ctx.lineTo(xm, hy - hh + 40); ctx.stroke(); ctx.restore();
        richText(ctx, [['⟨', 'n'], ['O', 'i'], ['⟩', 'n']], xm + 8, hy - hh + 60, { size: 26, color: C.navy });
      }
      text(ctx, 'observable O(x)', hx + hw / 2, hy + 34, { size: 20, color: C.inkSoft, align: 'center' });
      text(ctx, 'free energy · phase diagrams · moduli', z3.x + z3.w / 2, 440, { size: 21, color: C.inkSoft, align: 'center' });
      text(ctx, `${nObs} samples`, hx + hw, hy - hh + 20, { size: 19, color: C.muted, align: 'right' });
    }
    return {
      frame(dt) {
        clock += dt;
        if (clock > nextEmit) { nextEmit = clock + 0.55; flying.push({ u: 0, v: Math.max(0.02, Math.min(0.98, sampleObs())) }); cards.shift(); cards.push(makeCard()); }
        for (const f of flying) f.u += dt / 0.9;
        while (flying.length && flying[0].u >= 1) { const f = flying.shift(); const b = Math.min(bins.length - 1, Math.floor(f.v * bins.length)); bins[b] += 1; nObs++; sum += f.v; if (nObs > 120) { bins.fill(0); nObs = 0; sum = 0; } }
        draw();
      }, draw, ff: 30
    };
  };

  // ------------------------------------------------------------------
  // MCMC trapped in a rugged landscape
  // ------------------------------------------------------------------
  ANIMS.mcmcTrap = function (S, o) {
    const ctx = S.ctx, rng = makeRng(5);
    const X0 = 60, X1 = S.w - 40, Y0 = 70, Y1 = 330;
    const cen = [0.75, 1.95, 3.15, 4.35, 5.5], dep = [1.62, 1.72, 1.58, 1.68, 1.64], wd = 0.33;
    const Uf = (x) => -cen.reduce((acc, c, k) => acc + dep[k] * Math.exp(-((x - c) ** 2) / (2 * wd * wd)), 0) + 0.1 * Math.sin(9 * x + 0.5) + 0.05 * Math.sin(17 * x) + 0.3 * Math.pow((x - 3.1) / 3.1, 4);
    const xmin = 0, xmax = 6.2;
    let umin = Infinity, umax = -Infinity; for (let k = 0; k <= 400; k++) { const v = Uf(xmin + (xmax - xmin) * k / 400); umin = Math.min(umin, v); umax = Math.max(umax, v); }
    const sx = (x) => X0 + (x - xmin) / (xmax - xmin) * (X1 - X0), sy = (u) => Y1 - (u - umin) / (umax - umin) * (Y1 - Y0);
    // start in the global basin
    let best = 0, bu = Infinity; for (let k = 0; k <= 600; k++) { const x = xmin + (xmax - xmin) * k / 600; if (Uf(x) < bu) { bu = Uf(x); best = x; } }
    let x = best, evals = 0, clock = 0, crossing = null, nextCross = 9;
    const beta = 12, trail = [], hist = new Float64Array(80);
    const truth = new Float64Array(80); let tsum = 0;
    for (let b = 0; b < 80; b++) { const xx = xmin + (b + 0.5) / 80 * (xmax - xmin); truth[b] = Math.exp(-beta * (Uf(xx) - bu)); tsum += truth[b]; }
    function draw() {
      S.clear();
      // landscape
      ctx.beginPath(); ctx.moveTo(sx(xmin), Y1 + 10);
      for (let k = 0; k <= 400; k++) { const xx = xmin + (xmax - xmin) * k / 400; ctx.lineTo(sx(xx), sy(Uf(xx))); }
      ctx.lineTo(sx(xmax), Y1 + 10); ctx.closePath(); ctx.fillStyle = rgba(C.blue, 0.08); ctx.fill();
      ctx.beginPath(); for (let k = 0; k <= 400; k++) { const xx = xmin + (xmax - xmin) * k / 400; if (k) ctx.lineTo(sx(xx), sy(Uf(xx))); else ctx.moveTo(sx(xx), sy(Uf(xx))); }
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3.5; ctx.stroke();
      text(ctx, 'rugged energy landscape U(x)', X0 + 4, Y0 - 34, { size: 22, color: C.inkSoft });
      // walker trail + walker
      for (let k = 0; k < trail.length; k++) { const a = k / trail.length; U.circle(ctx, sx(trail[k]), sy(Uf(trail[k])) - 12, 3, rgba(C.ink, 0.25 * a)); }
      let wx = x, wy = sy(Uf(x)) - 14;
      if (crossing) { const u = E.inOut(crossing.u); wx = crossing.from + (crossing.to - crossing.from) * u; const yy = sy(Uf(wx)) - 14 - Math.sin(Math.PI * u) * 40; wy = yy; ctx.save(); ctx.setLineDash([7, 7]); ctx.strokeStyle = C.coral; ctx.lineWidth = 2.5; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const uu = k / 40, xx = crossing.from + (crossing.to - crossing.from) * uu; const yy2 = sy(Uf(xx)) - 14 - Math.sin(Math.PI * uu) * 40; if (k) ctx.lineTo(sx(xx), yy2); else ctx.moveTo(sx(xx), yy2); } ctx.stroke(); ctx.restore(); text(ctx, 'rare barrier crossing', sx((crossing.from + crossing.to) / 2), Y0 + 6, { size: 22, color: C.coral, align: 'center', weight: 600 }); }
      U.circle(ctx, crossing ? sx(wx) : sx(wx), wy, 13, C.ink, '#fff', 3);
      // histogram vs truth
      const hy = S.h - 40, hh = 120; const mx = Math.max(...hist, 1);
      text(ctx, 'visited by the chain', X0 + 4, hy - hh - 14, { size: 20, color: C.ink });
      text(ctx, 'true Boltzmann π(x)', X0 + 240, hy - hh - 14, { size: 20, color: C.coral });
      for (let b = 0; b < 80; b++) { const h = hist[b] / mx * hh; ctx.fillStyle = rgba(C.ink, 0.7); ctx.fillRect(sx(xmin + b / 80 * (xmax - xmin)) + 1, hy - h, (X1 - X0) / 80 - 2, h); }
      const tm = Math.max(...truth); ctx.beginPath(); for (let b = 0; b < 80; b++) { const xx = sx(xmin + (b + 0.5) / 80 * (xmax - xmin)), yy = hy - truth[b] / tm * hh; if (b) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.strokeStyle = C.coral; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = rgba(C.inkSoft, 0.4); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X0, hy); ctx.lineTo(X1, hy); ctx.stroke();
      // counter
      const e = evals; const exp = Math.floor(Math.log10(Math.max(1, e))); const mant = (e / Math.pow(10, exp)).toFixed(1);
      text(ctx, 'energy evaluations', X1, Y0 - 34, { size: 20, color: C.inkSoft, align: 'right' });
      richText(ctx, [[mant + ' × 10', 'n'], [String(exp), 'sup']], X1, Y0 + 2, { size: 34, color: C.navy, weight: 700, align: 'right' });
    }
    return {
      frame(dt) {
        clock += dt;
        if (crossing) { crossing.u += dt / 1.6; if (crossing.u >= 1) { x = crossing.to; crossing = null; } }
        else {
          for (let k = 0; k < 6; k++) { const y = x + 0.035 * rng.normal(); if (y > xmin && y < xmax && Math.log(rng.u()) < -beta * (Uf(y) - Uf(x))) x = y; trail.push(x); if (trail.length > 60) trail.shift(); const b = Math.floor((x - xmin) / (xmax - xmin) * 80); if (b >= 0 && b < 80) hist[b]++; }
          if (clock > nextCross) {
            // jump to a neighbouring basin
            let target = null, cand = []; for (let k = 1; k < 600; k++) { const xx = xmin + (xmax - xmin) * k / 600; const l = Uf(xx - 0.01), m = Uf(xx), r = Uf(xx + 0.01); if (m < l && m < r && Math.abs(xx - x) > 0.4 && Math.abs(xx - x) < 1.6) cand.push(xx); }
            if (cand.length) { target = rng.pick(cand); crossing = { from: x, to: target, u: 0 }; }
            nextCross = clock + 10;
          }
        }
        evals += dt * 2.6e6 * (1 + clock / 6);
        draw();
      }, draw
    };
  };

  // ------------------------------------------------------------------
  // MCMC vs neural sampler on a 2D Gaussian mixture (exact interpolant drift)
  // ------------------------------------------------------------------
  function gmm2d() {
    const mu = [[-2.1, 1.35], [1.75, 1.95], [0.15, -0.25], [-1.7, -2.05], [2.25, -1.55]], w = [0.17, 0.22, 0.26, 0.15, 0.2], s2 = 0.16;
    function logp(x, y) { let m = -Infinity; const v = []; for (let k = 0; k < 5; k++) { const d = ((x - mu[k][0]) ** 2 + (y - mu[k][1]) ** 2); const l = Math.log(w[k]) - d / (2 * s2); v.push(l); m = Math.max(m, l); } let s = 0; for (const l of v) s += Math.exp(l - m); return m + Math.log(s); }
    function grad(x, y) { const ls = []; let m = -Infinity; for (let k = 0; k < 5; k++) { const l = Math.log(w[k]) - ((x - mu[k][0]) ** 2 + (y - mu[k][1]) ** 2) / (2 * s2); ls.push(l); m = Math.max(m, l); } let Z = 0; ls.forEach((l, k) => { ls[k] = Math.exp(l - m); Z += ls[k]; }); let gx = 0, gy = 0; for (let k = 0; k < 5; k++) { const r = ls[k] / Z; gx += r * (-(x - mu[k][0]) / s2); gy += r * (-(y - mu[k][1]) / s2); } return [gx, gy]; }
    // interpolant x_t = t x1 + (1-t) x0, x0 ~ N(0, I): exact velocity and score
    function fields(x, y, t) {
      const vk = [], lr = []; let m = -Infinity;
      for (let k = 0; k < 5; k++) { const v = t * t * s2 + (1 - t) * (1 - t); vk.push(v); const dx = x - t * mu[k][0], dy = y - t * mu[k][1]; const l = Math.log(w[k]) - (dx * dx + dy * dy) / (2 * v) - Math.log(v); lr.push(l); m = Math.max(m, l); }
      let Z = 0; lr.forEach((l, k) => { lr[k] = Math.exp(l - m); Z += lr[k]; });
      let vx = 0, vy = 0, sx = 0, sy = 0;
      for (let k = 0; k < 5; k++) { const r = lr[k] / Z, v = vk[k], dx = x - t * mu[k][0], dy = y - t * mu[k][1]; const c = (t * s2 - (1 - t)) / v; vx += r * (mu[k][0] + c * dx); vy += r * (mu[k][1] + c * dy); sx += r * (-dx / v); sy += r * (-dy / v); }
      return [vx, vy, sx, sy];
    }
    return { mu, w, s2, logp, grad, fields };
  }
  function densityImage(S, G, x0, y0, w, h, scale, tint) {
    const off = document.createElement('canvas'); const res = 2; off.width = Math.round(w / res); off.height = Math.round(h / res);
    const c = off.getContext('2d'), img = c.createImageData(off.width, off.height);
    const rgb = U.hexToRgb(tint); let mx = -Infinity; const vals = new Float64Array(off.width * off.height);
    for (let j = 0; j < off.height; j++) for (let i = 0; i < off.width; i++) { const X = (i * res - w / 2) / scale, Y = -(j * res - h / 2) / scale; const v = G.logp(X, Y); vals[j * off.width + i] = v; mx = Math.max(mx, v); }
    for (let p = 0; p < vals.length; p++) { const a = Math.exp(vals[p] - mx); const q = Math.pow(a, 0.5); img.data[4 * p] = rgb[0]; img.data[4 * p + 1] = rgb[1]; img.data[4 * p + 2] = rgb[2]; img.data[4 * p + 3] = Math.round(255 * 0.72 * q); }
    c.putImageData(img, 0, 0); return off;
  }
  ANIMS.samplerVsMcmc = function (S, o) {
    const ctx = S.ctx, G = gmm2d(), rng = makeRng(21);
    const pw = 760, ph = 560, gap = (S.w - 2 * pw), L = { x: 0, y: 0 }, R = { x: pw + gap, y: 0 }, sc = 92;
    let dimg = null;
    const toPx = (P, X, Y) => [P.x + pw / 2 + X * sc, P.y + ph / 2 - 10 - Y * sc];
    // MCMC
    let mx = G.mu[2][0] + 0.1, my = G.mu[2][1] + 0.1, steps = 0; const mtrail = [];
    // neural sampler batches
    let batch = null, done = [], nsamp = 0, clock = 0, modesHit = new Set();
    const K = 70, sigma = (t) => 0.75 * Math.sin(Math.PI * t) + 0.05;
    function newBatch() { const pts = []; for (let i = 0; i < 26; i++) { pts.push({ x: rng.normal(), y: rng.normal(), path: [] }); } batch = { pts, k: 0, acc: 0 }; }
    newBatch();
    function panel(P, title, sub, col) {
      roundRect(ctx, P.x, P.y, pw, ph, 18, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      if (!dimg) dimg = densityImage(S, G, 0, 0, pw, ph - 20, sc, '#7FA7C9');
      ctx.drawImage(dimg, P.x, P.y, pw, ph - 20);
      text(ctx, title, P.x + 26, P.y + 44, { size: 28, weight: 650, color: col });
      text(ctx, sub, P.x + 26, P.y + 76, { size: 20, color: C.inkSoft });
    }
    function draw() {
      S.clear();
      panel(L, 'MCMC / molecular dynamics', 'one long correlated chain, local moves', C.coral);
      panel(R, 'Neural sampler', 'learned transport, independent samples in one pass', C.teal);
      // MCMC trail
      ctx.save(); ctx.beginPath(); ctx.rect(L.x, L.y, pw, ph); ctx.clip();
      ctx.beginPath(); mtrail.forEach((p, i) => { const [x, y] = toPx(L, p[0], p[1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.strokeStyle = rgba(C.ink, 0.35); ctx.lineWidth = 1.2; ctx.stroke();
      const [wx, wy] = toPx(L, mx, my); U.circle(ctx, wx, wy, 9, C.coral, '#fff', 2.5);
      ctx.restore();
      text(ctx, `${steps.toLocaleString()} steps · modes visited: 1 / 5`, L.x + pw - 24, L.y + ph - 26, { size: 21, color: C.coral, align: 'right', weight: 600 });
      // neural sampler
      ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, pw, ph); ctx.clip();
      done.forEach(d => { const [x, y] = toPx(R, d.x, d.y); U.circle(ctx, x, y, 4.2, rgba(C.tealDark, Math.max(0.25, d.a))); });
      if (batch) batch.pts.forEach(p => {
        ctx.beginPath(); p.path.forEach((q, i) => { const [x, y] = toPx(R, q[0], q[1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.strokeStyle = rgba(C.teal, 0.35); ctx.lineWidth = 1.6; ctx.stroke();
        const [x, y] = toPx(R, p.x, p.y); U.circle(ctx, x, y, 6, C.teal, '#fff', 1.5);
      });
      // prior indicator
      const [cx, cy] = toPx(R, 0, 0); ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = rgba(C.inkSoft, 0.45); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, sc * 1.0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      text(ctx, 'prior', cx + sc * 0.72, cy - sc * 0.78, { size: 18, color: C.muted });
      ctx.restore();
      text(ctx, `${nsamp.toLocaleString()} independent samples · modes: ${modesHit.size} / 5`, R.x + pw - 24, R.y + ph - 26, { size: 21, color: C.tealDark, align: 'right', weight: 600 });
    }
    function nearestMode(x, y) { let b = 0, bd = Infinity; G.mu.forEach((m, k) => { const d = (x - m[0]) ** 2 + (y - m[1]) ** 2; if (d < bd) { bd = d; b = k; } }); return b; }
    return {
      frame(dt) {
        clock += dt;
        // MCMC: unadjusted Langevin
        for (let i = 0; i < 4; i++) { const eps = 0.0022; const [gx, gy] = G.grad(mx, my); mx += eps * gx + Math.sqrt(2 * eps) * rng.normal(); my += eps * gy + Math.sqrt(2 * eps) * rng.normal(); steps++; mtrail.push([mx, my]); if (mtrail.length > 700) mtrail.shift(); }
        // sampler
        if (batch) {
          batch.acc += dt; const stepT = 2.0 / K;
          while (batch.acc > stepT && batch.k < K) {
            batch.acc -= stepT; const t = batch.k / K, h = 1 / K;
            batch.pts.forEach(p => { const [vx, vy, sx, sy] = G.fields(p.x, p.y, t + 0.5 * h); const s = sigma(t); p.x += h * (vx + 0.5 * s * s * sx) + s * Math.sqrt(h) * rng.normal(); p.y += h * (vy + 0.5 * s * s * sy) + s * Math.sqrt(h) * rng.normal(); p.path.push([p.x, p.y]); });
            batch.k++;
          }
          if (batch.k >= K) { batch.pts.forEach(p => { done.push({ x: p.x, y: p.y, a: 1 }); modesHit.add(nearestMode(p.x, p.y)); }); nsamp += batch.pts.length; batch = null; this._wait = 0.35; }
        } else { this._wait -= dt; if (this._wait <= 0) newBatch(); }
        done.forEach(d => d.a *= 0.9985); if (done.length > 600) done.splice(0, done.length - 600);
        draw();
      }, draw, ff: 6.85
    };
  };

  // ------------------------------------------------------------------
  // Data-driven generative model vs data-free neural sampler
  // ------------------------------------------------------------------
  ANIMS.dataVsEnergy = function (S, o) {
    const ctx = S.ctx, G = gmm2d(), rng = makeRng(3);
    const pw = (S.w - 60) / 2, ph = S.h, sc = 58;
    const L = { x: 0, y: 0 }, R = { x: pw + 60, y: 0 };
    const data = []; for (let i = 0; i < 160; i++) { let k = 0, u = rng.u(), c = 0; for (k = 0; k < 5; k++) { c += G.w[k]; if (u < c) break; } k = Math.min(4, k); data.push([G.mu[k][0] + 0.4 * rng.normal(), G.mu[k][1] + 0.4 * rng.normal()]); }
    let clock = 0, dimg = null;
    const toPx = (P, X, Y) => [P.x + pw / 2 + X * sc, P.y + ph / 2 + 20 - Y * sc];
    function draw() {
      S.clear();
      for (const [P, title, sub, col] of [[L, 'Generative model', 'learns the score from data samples', C.inkSoft], [R, 'Neural sampler', 'learns from the energy: no data', C.teal]]) {
        roundRect(ctx, P.x, P.y, pw, ph, 18, '#fff', rgba(C.inkSoft, 0.15), 1.5);
        text(ctx, title, P.x + 24, P.y + 42, { size: 27, weight: 650, color: col === C.inkSoft ? C.ink : col });
        text(ctx, sub, P.x + 24, P.y + 72, { size: 20, color: C.inkSoft });
      }
      // left: data points
      const nShow = Math.min(data.length, Math.floor(clock * 60));
      for (let i = 0; i < nShow; i++) { const [x, y] = toPx(L, data[i][0], data[i][1]); U.circle(ctx, x, y, 4.5, rgba(C.ink, 0.6)); }
      text(ctx, 'x ~ data', L.x + pw - 24, L.y + ph - 22, { size: 20, color: C.inkSoft, align: 'right' });
      // right: force field quiver over the energy landscape
      if (!dimg) dimg = densityImage(S, G, 0, 0, pw, ph, sc, '#7FA7C9');
      ctx.save(); ctx.globalAlpha = 0.85; ctx.drawImage(dimg, R.x, R.y + 20, pw, ph); ctx.restore();
      const pulse = 0.85 + 0.15 * Math.sin(clock * 2.4);
      for (let gx = -3.4; gx <= 3.41; gx += 0.62) for (let gy = -2.5; gy <= 2.51; gy += 0.62) {
        const [fx, fy] = G.grad(gx, gy); const m = Math.hypot(fx, fy); if (m < 1e-3) continue;
        const len = Math.min(32, 7.5 * Math.log1p(m)) * pulse; const [x, y] = toPx(R, gx, gy);
        arrow(ctx, x, y, x + fx / m * len, y - fy / m * len, rgba(C.coral, 0.85), 2.4, 9);
      }
      text(ctx, 'U(x), F(x) = −∇U(x) on demand', R.x + pw - 24, R.y + ph - 22, { size: 20, color: C.coral, align: 'right' });
    }
    return { frame(dt) { clock += dt; draw(); }, draw };
  };
})();
