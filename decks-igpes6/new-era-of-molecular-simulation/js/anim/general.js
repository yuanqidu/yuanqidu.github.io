/* Animations for the general-audience deck (general.html): plain language, no equations.
   impactHub · mpemba · neqGlow (from the "Out of Equilibrium" talk) · pixelDenoise · whoSitsWhere
   OMNIA future work: omniaMelt · omniaSurface · omniaBattery · kinetics: kinIons · kinAdenine · kinHost · kinMisfold */
(function () {
  'use strict';
  const { C, rgba, mix, E, atom, roundRect, text, makeRng, wiggle } = U;

  // ------------------------------------------------------------------
  // Why it matters: molecular simulation at the hub of many problems; pulses run out along the spokes
  // ------------------------------------------------------------------
  ANIMS.impactHub = function (S, o) {
    const ctx = S.ctx, cfg = KA_DATA[o.config || 'n144_T0.3'];
    const ITEMS = [
      ['Batteries', 'how fast Li⁺ moves through', 'a solid electrolyte', 'battery', C.teal],
      ['Medicines', 'how tightly a drug binds', 'its protein target', 'pill', C.coral],
      ['Climate', 'catalysts for clean fuels;', 'materials that capture CO₂', 'co2', C.green],
      ['Earth and planets', 'Fe and rock at the pressures', "of Earth's core", 'planet', C.gold],
      ['Semiconductors', 'dopants and defects', 'in Si chips', 'chip', C.blue],
      ['Quantum technology', 'single defects in diamond', 'as qubits and sensors', 'gem', C.violet],
      ['Alloys', 'strength at 1,000 °C in', 'jet engines and reactors', 'fan', C.copper],
      ['Glass', 'phone screens, optical fibres,', 'metallic glasses', 'phone', C.navy]
    ];
    // o.next: the same problems at the end of the talk, with what the samplers let us explore
    const NEXT = [
      ['how many Na⁺ or Li⁺ ions an anode', 'stores at each voltage'],
      ['how tightly a candidate drug binds,', 'with water free to come and go'],
      ['catalysts at real gas pressure;', 'how much CO₂ a sorbent captures'],
      ['where Fe melts at the pressures', "of Earth's core"],
      ['which dopants and defects form', 'at the growth temperature'],
      ['a shortlist of new defect qubits', 'before any experiment'],
      ['phase diagrams down from the melt:', 'how to cast and heat-treat them'],
      ['which melts freeze into a glass;', 'glasses designed by an AI agent']
    ];
    const HX = S.w / 2, HY = S.h / 2 - 22, R = 128, IR = 38;
    const ROWS = [0, 1, 2, 3].map(r => 62 + r * (S.h - 124) / 3);
    const nodes = ITEMS.map((it, k) => { const left = k < 4; return { t: it[0], d: o.next ? NEXT[k] : [it[1], it[2]], icon: it[3], c: it[4], left, x: left ? HX - 300 : HX + 300, y: ROWS[k % 4] }; });
    let clock = 0;
    function icon(kind, x, y, c) {
      ctx.save(); ctx.translate(x, y); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (kind === 'battery') {
        roundRect(ctx, -19, -11, 34, 22, 5, null, c, 3); roundRect(ctx, 15, -5, 5, 10, 2, c);
        const n = 1 + Math.floor(clock * 1.4) % 3; for (let i = 0; i < n; i++) roundRect(ctx, -14 + i * 9.5, -6, 7, 12, 1.5, c);
      } else if (kind === 'pill') {
        ctx.rotate(-0.7);
        ctx.save(); ctx.beginPath(); ctx.rect(-22, -10, 22, 20); ctx.clip(); roundRect(ctx, -21, -9, 42, 18, 9, rgba(c, 0.85)); ctx.restore();
        roundRect(ctx, -21, -9, 42, 18, 9, null, c, 3);
      } else if (kind === 'co2') {
        ctx.lineWidth = 2.4;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 7, -3.5); ctx.lineTo(sx * 14, -3.5); ctx.moveTo(sx * 7, 3.5); ctx.lineTo(sx * 14, 3.5); ctx.stroke(); }
        U.circle(ctx, -20, 0, 7, c); U.circle(ctx, 20, 0, 7, c); U.circle(ctx, 0, 0, 7.5, C.navy);
      } else if (kind === 'planet') {
        U.circle(ctx, 0, 0, 19, rgba(c, 0.12), c, 3);
        ctx.save(); ctx.setLineDash([3, 4]); U.circle(ctx, 0, 0, 12.5, null, c, 2); ctx.restore();
        U.circle(ctx, 0, 0, 6.5, c);
      } else if (kind === 'chip') {
        ctx.lineWidth = 2.5;
        for (const p of [-7, 0, 7]) { ctx.beginPath(); ctx.moveTo(p, -13); ctx.lineTo(p, -19); ctx.moveTo(p, 13); ctx.lineTo(p, 19); ctx.moveTo(-13, p); ctx.lineTo(-19, p); ctx.moveTo(13, p); ctx.lineTo(19, p); ctx.stroke(); }
        roundRect(ctx, -13, -13, 26, 26, 3, '#fff', c, 3); roundRect(ctx, -6, -6, 12, 12, 2, rgba(c, 0.85));
      } else if (kind === 'gem') {
        ctx.beginPath(); ctx.moveTo(-17, -5); ctx.lineTo(-9, -14); ctx.lineTo(9, -14); ctx.lineTo(17, -5); ctx.lineTo(0, 17); ctx.closePath();
        ctx.fillStyle = rgba(c, 0.14); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-17, -5); ctx.lineTo(17, -5); ctx.moveTo(-9, -14); ctx.lineTo(-4, -5); ctx.lineTo(0, 17); ctx.moveTo(9, -14); ctx.lineTo(4, -5); ctx.lineTo(0, 17); ctx.stroke();
        ctx.globalAlpha *= 0.5 + 0.5 * Math.sin(clock * 3);
        ctx.beginPath(); ctx.moveTo(21, -24); ctx.lineTo(21, -14); ctx.moveTo(16, -19); ctx.lineTo(26, -19); ctx.stroke();
      } else if (kind === 'fan') {
        U.circle(ctx, 0, 0, 19, null, c, 3);
        for (let b = 0; b < 5; b++) {
          const a = clock * 1.8 + b * 2 * Math.PI / 5;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a + 0.7) * 13, Math.sin(a + 0.7) * 13, Math.cos(a) * 15, Math.sin(a) * 15);
          ctx.quadraticCurveTo(Math.cos(a - 0.15) * 8, Math.sin(a - 0.15) * 8, 0, 0); ctx.fillStyle = rgba(c, 0.85); ctx.fill();
        }
        U.circle(ctx, 0, 0, 3.5, '#fff', c, 2);
      } else if (kind === 'phone') {
        roundRect(ctx, -12, -19, 24, 38, 5, null, c, 3);
        [[-5, -11], [4, -9], [-1, -4], [6, 0], [-6, 3], [2, 7], [-3, 12], [5, 12]].forEach(([px, py], i) => U.circle(ctx, px, py, 2.3, i % 3 === 2 ? C.orange : c));
      }
      ctx.restore();
    }
    function draw() {
      S.clear();
      // spokes and pulses
      nodes.forEach((n, k) => {
        const a = E.smooth((clock - 0.15 - 0.1 * k) / 0.45); if (a <= 0) return;
        const dx = n.x - HX, dy = n.y - HY, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        const ax = HX + ux * (R + 8), ay = HY + uy * (R + 8), bx = n.x - ux * (IR + 6), by = n.y - uy * (IR + 6);
        ctx.strokeStyle = rgba(n.c, 0.32); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * a, ay + (by - ay) * a); ctx.stroke();
        if (a >= 1) for (let j = 0; j < 2; j++) { const s = (clock * 0.42 + j * 0.5 + k * 0.137) % 1; U.circle(ctx, ax + (bx - ax) * s, ay + (by - ay) * s, 5, rgba(n.c, 0.9 * Math.sin(Math.PI * s))); }
      });
      // hub: a real 2D Kob-Andersen configuration, jiggling
      U.circle(ctx, HX, HY, R + 10, rgba(C.teal, 0.12)); U.circle(ctx, HX, HY, R, '#fff');
      ctx.save(); ctx.beginPath(); ctx.arc(HX, HY, R - 2, 0, 2 * Math.PI); ctx.clip();
      const side = 2 * R * 1.08, x0 = HX - side / 2, y0 = HY - side / 2, sig = side / cfg.L;
      for (const pass of [0, 1]) for (let i = 0; i < cfg.N; i++) {
        if (cfg.t[i] !== pass) continue;
        const fx = cfg.x[2 * i] + 0.006 * wiggle(i * 1.7, clock * 3), fy = cfg.x[2 * i + 1] + 0.006 * wiggle(i * 1.7 + 5, clock * 3);
        atom(ctx, x0 + fx * side, y0 + fy * side, (pass ? 0.36 : 0.47) * sig, pass ? C.kaB : C.kaA);
      }
      ctx.restore();
      U.circle(ctx, HX, HY, R, null, C.teal, 4);
      if (o.next) {
        text(ctx, 'Neural samplers', HX, HY + R + 48, { size: 30, weight: 750, color: C.navy, align: 'center' });
        const parts = [['ATLAS', C.tealDark], ['  ·  ', C.muted], ['JANUS', C.violet], ['  ·  ', C.muted], ['OMNIA', C.coral]];
        ctx.save(); ctx.font = U.font(21, 750); const ws = parts.map(p => ctx.measureText(p[0]).width); ctx.restore();
        let px = HX - ws.reduce((s, w) => s + w, 0) / 2;
        parts.forEach((p, i) => { text(ctx, p[0], px, HY + R + 80, { size: 21, weight: 750, color: p[1] }); px += ws[i]; });
      } else {
        text(ctx, 'Molecular simulation', HX, HY + R + 48, { size: 30, weight: 750, color: C.navy, align: 'center' });
        text(ctx, 'atoms in motion at finite temperature', HX, HY + R + 78, { size: 19, color: C.inkSoft, align: 'center' });
      }
      // nodes
      nodes.forEach((n, k) => {
        const a = E.smooth((clock - 0.35 - 0.1 * k) / 0.45); if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = a;
        U.circle(ctx, n.x, n.y, IR, '#fff', rgba(n.c, 0.55), 2.5); U.circle(ctx, n.x, n.y, IR - 6, rgba(n.c, 0.07));
        icon(n.icon, n.x, n.y, n.c);
        const tx = n.left ? n.x - IR - 18 : n.x + IR + 18, al = n.left ? 'right' : 'left';
        text(ctx, n.t, tx, n.y - 6, { size: 25, weight: 700, color: n.c === C.gold ? '#A87A0E' : n.c, align: al });
        text(ctx, n.d[0], tx, n.y + 20, { size: 19, color: C.inkSoft, align: al });
        text(ctx, n.d[1], tx, n.y + 43, { size: 19, color: C.inkSoft, align: al });
        ctx.restore();
      });
    }
    return { frame(dt) { clock += dt; draw(); }, draw, enter() { clock = 0; } };
  };

  // ------------------------------------------------------------------
  // The time of a non-equilibrium vs. a quasi-static process (same as the title figure of the
  // "Pushing Probabilistic ML Out of Equilibrium" talk): two transports from the same Gaussian to the same target.
  //   coral: out-of-equilibrium diffusion (probability-flow ODE with the exact score, 100 steps)
  //   blue:  quasi-static annealing, pi_beta ∝ N(0,I)^(1-beta) pi^beta with MALA at each level (1,000 steps)
  // ------------------------------------------------------------------
  ANIMS.neqGlow = function (S, o) {
    const ctx = S.ctx, rng = makeRng(o.seed || 5), K = 7, R0 = 2.5, SD = 0.17, NP = 220, NS = 100, ANN = 1000, RATE = 100, beta = 8, TR = 10;
    const W = [0.30, 0.04, 0.20, 0.05, 0.24, 0.04, 0.13];
    const MU = []; for (let k = 0; k < K; k++) { const a = 2 * Math.PI * k / K + 0.5; MU.push([R0 * Math.cos(a), R0 * Math.sin(a)]); }
    function score(x, y, al) {
      const v = al * al * SD * SD + 1 - al * al; let m = -Infinity; const ls = [];
      for (let k = 0; k < K; k++) { const dx = x - al * MU[k][0], dy = y - al * MU[k][1]; const l = Math.log(W[k]) - (dx * dx + dy * dy) / (2 * v); ls.push(l); m = Math.max(m, l); }
      let Z = 0; ls.forEach((l, k) => { ls[k] = Math.exp(l - m); Z += ls[k]; });
      let gx = 0, gy = 0; for (let k = 0; k < K; k++) { const r = ls[k] / Z; gx -= r * (x - al * MU[k][0]) / v; gy -= r * (y - al * MU[k][1]) / v; }
      return [gx, gy];
    }
    const logp = (x, y) => { const ls = MU.map((mu, k) => Math.log(W[k]) - ((x - mu[0]) ** 2 + (y - mu[1]) ** 2) / (2 * SD * SD)); const m = Math.max(...ls); return m + Math.log(ls.reduce((a, l) => a + Math.exp(l - m), 0)); };
    const logpt = (x, y, al) => { const v = al * al * SD * SD + 1 - al * al; const ls = MU.map((mu, k) => Math.log(W[k]) - ((x - al * mu[0]) ** 2 + (y - al * mu[1]) ** 2) / (2 * v) - Math.log(v)); const m = Math.max(...ls); return m + Math.log(ls.reduce((a, l) => a + Math.exp(l - m), 0)); };
    const lpb = (x, y, b) => (1 - b) * -(x * x + y * y) / 2 + b * logp(x, y);
    const gb = (x, y, b) => { const g = score(x, y, 1); return [(1 - b) * -x + b * g[0], (1 - b) * -y + b * g[1]]; };
    const alphaOf = st => Math.exp(-0.5 * beta * (1 - st / NS));
    const ext = 3.7, cx = S.w / 2, cy = S.h * 0.43, sc = Math.min(S.w, S.h * 0.84) / (2 * ext);
    const P = (x, y) => [cx + x * sc, cy - y * sc];
    let df, an, step, anSteps, clock, hold;
    function reset() { df = []; an = []; for (let i = 0; i < NP; i++) { df.push({ x: rng.normal(), y: rng.normal(), tr: [] }); an.push({ x: rng.normal(), y: rng.normal(), tr: [] }); } step = 0; anSteps = 0; clock = 0; hold = 0; }
    reset();
    // instantaneous densities as a two-colour glow on a small offscreen grid
    const G = 120, glow = document.createElement('canvas'); glow.width = G; glow.height = G; const gctx = glow.getContext('2d'), img = gctx.createImageData(G, G);
    const cA = U.hexToRgb(C.coral), cB = U.hexToRgb(C.blue);
    let lastGlow = -1;
    function renderGlow() {
      const al = alphaOf(step), b = Math.pow(Math.min(1, anSteps / ANN), 2), A = new Float32Array(G * G), Bv = new Float32Array(G * G); let mA = -Infinity, mB = -Infinity;
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const x = -ext + (i + 0.5) / G * 2 * ext, y = ext - (j + 0.5) / G * 2 * ext, q = j * G + i; A[q] = logpt(x, y, al); Bv[q] = lpb(x, y, b); mA = Math.max(mA, A[q]); mB = Math.max(mB, Bv[q]); }
      for (let q = 0; q < G * G; q++) {
        const a = 0.62 * Math.exp(A[q] - mA), bb = 0.62 * Math.exp(Bv[q] - mB), tot = a + bb + 1e-9, alpha = 1 - (1 - a) * (1 - bb);
        img.data[4 * q] = (cA[0] * a + cB[0] * bb) / tot; img.data[4 * q + 1] = (cA[1] * a + cB[1] * bb) / tot; img.data[4 * q + 2] = (cA[2] * a + cB[2] * bb) / tot; img.data[4 * q + 3] = 255 * Math.min(0.8, alpha);
      }
      gctx.putImageData(img, 0, 0);
    }
    function trail(p, col) {
      for (let i = 1; i < p.tr.length; i++) { const a = i / p.tr.length; const [x0, y0] = P(p.tr[i - 1][0], p.tr[i - 1][1]), [x1, y1] = P(p.tr[i][0], p.tr[i][1]); ctx.strokeStyle = rgba(col, 0.5 * a); ctx.lineWidth = 2.4 * a; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      const [x, y] = P(p.x, p.y); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 2 * Math.PI); ctx.fill();
    }
    function bar(y, frac, col, label, count) {
      U.circle(ctx, 40, y - 8, 8, col); text(ctx, label, 58, y, { size: 23, weight: 700, color: col });
      const bx = S.w - 330, bw = 170; roundRect(ctx, bx, y - 14, bw, 10, 5, rgba(col, 0.15)); roundRect(ctx, bx, y - 14, Math.max(10, bw * frac), 10, 5, col);
      text(ctx, count, S.w - 30, y, { size: 21, weight: 600, color: col, align: 'right' });
    }
    function draw() {
      if (lastGlow !== step * 100000 + anSteps) { renderGlow(); lastGlow = step * 100000 + anSteps; }
      S.clear();
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; const [x0, y0] = P(-ext, ext); ctx.drawImage(glow, x0, y0, 2 * ext * sc, 2 * ext * sc); ctx.restore();
      ctx.lineCap = 'round';
      an.forEach(p => { const [x, y] = P(p.x, p.y); ctx.fillStyle = rgba(C.blue, 0.85); ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 2 * Math.PI); ctx.fill(); }); df.forEach(p => trail(p, C.coral));
      const ly = S.h - 72;
      bar(ly, step / NS, C.coral, 'out-of-equilibrium', step + ' steps');
      bar(ly + 42, Math.min(1, anSteps / ANN), C.blue, 'quasi-static process', anSteps.toLocaleString() + ' steps');
    }
    return {
      frame(dt) {
        clock += dt;
        if (hold > 0) { hold += dt; df.forEach(p => { if (p.tr.length) p.tr.shift(); }); an.forEach(p => { if (p.tr.length) p.tr.shift(); }); if (hold > 3) reset(); draw(); return; }
        // one shared step clock (RATE steps per second) for both processes
        const target = Math.floor(clock * RATE);
        while (step < NS && step < target) {
          const t0 = 1 - step / NS, dtau = 1 / NS, al = Math.exp(-0.5 * beta * t0);
          df.forEach(p => { const g = score(p.x, p.y, al); p.x += (0.5 * beta * p.x + 0.5 * beta * g[0]) * dtau; p.y += (0.5 * beta * p.y + 0.5 * beta * g[1]) * dtau; p.tr.push([p.x, p.y]); if (p.tr.length > TR) p.tr.shift(); });
          step++;
        }
        if (step >= NS) df.forEach(p => { if (p.tr.length) p.tr.shift(); });
        // annealed Langevin: MALA at each level, beta rises over ANN steps
        if (anSteps < ANN) {
          const h = 0.02, sq = Math.sqrt(2 * h);
          while (anSteps < ANN && anSteps < target) { const b = Math.pow(Math.min(1, anSteps / ANN), 2); for (const p of an) { const g = gb(p.x, p.y, b); const zx = p.x + h * g[0] + sq * rng.normal(), zy = p.y + h * g[1] + sq * rng.normal(); const g2 = gb(zx, zy, b); const la = lpb(zx, zy, b) - lpb(p.x, p.y, b) - (((p.x - zx - h * g2[0]) ** 2 + (p.y - zy - h * g2[1]) ** 2) - ((zx - p.x - h * g[0]) ** 2 + (zy - p.y - h * g[1]) ** 2)) / (4 * h); if (Math.log(rng.u()) < la) { p.x = zx; p.y = zy; } } anSteps++; }
        } else an.forEach(p => { if (p.tr.length) p.tr.shift(); });
        if (anSteps >= ANN && step >= NS) hold = 1e-6;
        draw();
      }, draw, enter: reset
    };
  };

  // ------------------------------------------------------------------
  // The Mpemba effect (opening of the non-equilibrium slide): a cup of hot water and a cup of warm water in a freezer.
  // The hot one cools faster, overtakes the warm one and freezes first. Molecules move faster the hotter the water and
  // lock into an ice network as each cup freezes, from the walls inwards; the chart traces both temperatures.
  // Schematic: Newton cooling with a shorter time constant for the hot cup, the same time at 0 °C to freeze, then the
  // ice cools towards the freezer.
  // ------------------------------------------------------------------
  ANIMS.mpemba = function (S, o) {
    const ctx = S.ctx, rng = makeRng(o.seed || 7);
    const ENV = -20, LAT = 0.3, TICE = 0.35, TEND = 1.5;    // freezer (°C); time to freeze at 0 °C; ice cooling time; chart end
    const LEAD = 1.5, RATE = 0.19, HOLD = 3.2, FADE = 0.4;  // s before cooling starts; model time per second; final hold
    const PER = LEAD + TEND / RATE + HOLD;
    const CUPS = [{ name: 'hot water', T0: 70, tau: 0.45, col: C.coral, cx: 205 }, { name: 'warm water', T0: 30, tau: 1, col: C.blue, cx: 595 }];
    CUPS.forEach(c => { c.tf = c.tau * Math.log((c.T0 - ENV) / -ENV); c.tz = c.tf + LAT; }); // at 0 °C from tf, frozen at tz
    const temp = (c, t) => t < c.tf ? ENV + (c.T0 - ENV) * Math.exp(-t / c.tau) : t < c.tz ? 0 : ENV * (1 - Math.exp(-(t - c.tz) / TICE));
    const fmt = T => (Math.round(T) < 0 ? '−' : '') + Math.abs(Math.round(T)) + ' °C';
    const model = () => E.clamp((clock - LEAD) * RATE, 0, TEND);
    const angTo = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
    // glass from GT to GB with half width GW, water from WT; molecules keep R0 from the walls and DMIN from each other
    const GT = 160, GB = 402, GW = 112, WT = 196, R0 = 15, DMIN = 27, MS = 1.3;
    // ice: a honeycomb of sites (hydrogen bonds 34 px long), shifted to fit the most sites; the outer ones freeze first
    function iceSites(cx) {
      const b = 34, h = Math.sqrt(3) * b, xl = cx - GW + 6 + R0, xr = cx + GW - 6 - R0, yt = WT + R0, yb = GB - 6 - R0;
      let best = [];
      for (let ox = 0; ox < h; ox += h / 8) for (let oy = 0; oy < 3 * b; oy += 3 * b / 8) {
        const st = [];
        for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) for (const dy of [0, b]) {
          const x = cx + ox + h * (i + j / 2), y = 300 + oy + 1.5 * b * j + dy;
          if (x >= xl && x <= xr && y >= yt && y <= yb) st.push({ x, y });
        }
        if (st.length > best.length) best = st;
      }
      best.forEach((st, i) => {
        st.nb = []; best.forEach((q, j) => { if (j !== i && Math.abs(Math.hypot(q.x - st.x, q.y - st.y) - b) < 2) st.nb.push(j); });
        st.rank = E.clamp(Math.min(st.x - xl, xr - st.x, st.y - yt, yb - st.y) / 70 + 0.12 * rng.u(), 0, 0.98);
        const dirs = st.nb.map(j => Math.atan2(best[j].y - st.y, best[j].x - st.x)); // H atoms point along two hydrogen bonds
        st.a = dirs.length >= 2 ? dirs[0] + angTo(dirs[0], dirs[1]) / 2 : rng.u() * 6.283;
      });
      return best;
    }
    CUPS.forEach(c => { c.sites = iceSites(c.cx); c.box = [c.cx - GW + 6 + R0, c.cx + GW - 6 - R0, WT + R0, GB - 6 - R0]; });
    let clock = 0, lastStep = -1;
    function reset() {
      clock = 0;
      CUPS.forEach(c => {
        const [xl, xr, yt, yb] = c.box; c.mols = []; c.assigned = false;
        for (let k = 0; c.mols.length < c.sites.length && k < 5000; k++) {
          const x = xl + rng.u() * (xr - xl), y = yt + rng.u() * (yb - yt);
          if (c.mols.every(m => Math.hypot(m.x - x, m.y - y) >= DMIN)) c.mols.push({ x, y, a: rng.u() * 6.283, vx: 0, vy: 0, w: 0, site: null, lock: -1 });
        }
      });
    }
    reset();
    function assign(c) { // when a cup reaches 0 °C: each ice site, outer ones first, takes the nearest free molecule
      const free = c.mols.slice();
      c.sites.slice().sort((p, q) => p.rank - q.rank).forEach(st => {
        if (!free.length) return;
        let bi = 0, bd = Infinity; free.forEach((m, i) => { const d = Math.hypot(m.x - st.x, m.y - st.y); if (d < bd) { bd = d; bi = i; } });
        free.splice(bi, 1)[0].site = st;
      });
      c.assigned = true;
    }
    function update(dt) {
      clock += dt; if (clock >= PER) reset();
      const t = model();
      CUPS.forEach(c => {
        const heat = E.clamp(temp(c, t) / 70), [xl, xr, yt, yb] = c.box;
        if (t >= c.tf && !c.assigned) assign(c);
        const p = c.assigned ? E.clamp((t - c.tf) / (0.85 * LAT)) : 0;
        const sp = 18 + 120 * heat, damp = Math.exp(-3 * dt), kick = Math.sqrt(1 - damp * damp);
        c.mols.forEach(m => {
          if (m.site && p >= m.site.rank) { // frozen: settle onto its ice site
            if (m.lock < 0) m.lock = clock;
            const k = 1 - Math.exp(-8 * dt); m.x += (m.site.x - m.x) * k; m.y += (m.site.y - m.y) * k; m.a += angTo(m.a, m.site.a) * k;
            return;
          }
          m.vx = m.vx * damp + sp * kick * rng.normal(); m.vy = m.vy * damp + sp * kick * rng.normal(); m.w = m.w * damp + (0.8 + 4 * heat) * kick * rng.normal();
          m.x += m.vx * dt; m.y += m.vy * dt; m.a += m.w * dt;
        });
        // liquid molecules keep their distance from each other and from the ice, and stay in the water
        for (let i = 0; i < c.mols.length; i++) for (let j = i + 1; j < c.mols.length; j++) {
          const a = c.mols[i], b = c.mols[j], la = a.lock >= 0, lb = b.lock >= 0; if (la && lb) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); if (d >= DMIN || d < 1e-6) continue;
          const f = (DMIN - d) / d, wa = la ? 0 : lb ? 1 : 0.5, wb = lb ? 0 : la ? 1 : 0.5;
          a.x -= dx * f * wa; a.y -= dy * f * wa; b.x += dx * f * wb; b.y += dy * f * wb;
        }
        c.mols.forEach(m => { if (m.lock >= 0) return; if (m.x < xl || m.x > xr) m.vx *= -1; if (m.y < yt || m.y > yb) m.vy *= -1; m.x = E.clamp(m.x, xl, xr); m.y = E.clamp(m.y, yt, yb); });
      });
    }
    function snowflake(x, y, r, col, lw) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3 - Math.PI / 2, bx = x + 0.55 * r * Math.cos(a), by = y + 0.55 * r * Math.sin(a);
        ctx.moveTo(x, y); ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
        for (const sg of [-1, 1]) { ctx.moveTo(bx, by); ctx.lineTo(bx + 0.38 * r * Math.cos(a + sg * 0.8), by + 0.38 * r * Math.sin(a + sg * 0.8)); }
      }
      ctx.stroke(); ctx.restore();
    }
    function cupPath(cx) {
      const l = cx - GW, r = cx + GW, rr = 22;
      ctx.beginPath(); ctx.moveTo(l, GT); ctx.lineTo(l, GB - rr); ctx.quadraticCurveTo(l, GB, l + rr, GB);
      ctx.lineTo(r - rr, GB); ctx.quadraticCurveTo(r, GB, r, GB - rr); ctx.lineTo(r, GT);
    }
    function drawCup(c, t) {
      const T = temp(c, t), cx = c.cx, f = E.clamp((t - c.tf) / LAT);
      text(ctx, c.name, cx, 54, { size: 21, weight: 700, color: c.col, align: 'center' });
      text(ctx, fmt(T), cx, 102, { size: 38, weight: 800, color: C.ink, align: 'center' });
      if (t >= c.tz) { // frozen badge
        const a = E.clamp((t - c.tz) / 0.05);
        ctx.save(); ctx.globalAlpha *= a;
        roundRect(ctx, cx - 54, 114, 108, 30, 15, 'rgba(255,255,255,0.95)', rgba(C.blue, 0.4), 1.2);
        snowflake(cx - 31, 129, 8, C.blue, 1.8); text(ctx, 'frozen', cx - 16, 135, { size: 17, weight: 700, color: C.blue });
        ctx.restore();
      }
      // glass and water; the water tint follows the temperature, then turns to ice
      ctx.save(); cupPath(cx); ctx.closePath(); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(cx - GW, GT, 2 * GW, GB - GT);
      ctx.fillStyle = T < 35 ? mix('#D3E5F3', '#FBE6D9', E.clamp(T / 35)) : mix('#FBE6D9', '#F6C1AE', (T - 35) / 35); ctx.fillRect(cx - GW, WT, 2 * GW, GB - WT);
      if (f > 0) { ctx.fillStyle = rgba('#F3F9FD', 0.8 * f); ctx.fillRect(cx - GW, WT, 2 * GW, GB - WT); }
      ctx.strokeStyle = rgba(C.navy, 0.18); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - GW, WT); ctx.lineTo(cx + GW, WT); ctx.stroke();
      // hydrogen bonds between frozen neighbours, then the molecules
      const at = new Map(); c.mols.forEach(m => { if (m.lock >= 0) at.set(m.site, m); });
      ctx.save(); ctx.setLineDash([4, 5]); ctx.lineWidth = 2;
      c.sites.forEach((st, i) => {
        const a = at.get(st); if (!a) return;
        st.nb.forEach(j => {
          const b = j > i && at.get(c.sites[j]); if (!b) return;
          ctx.strokeStyle = rgba(C.blue, 0.55 * E.clamp(Math.min(clock - a.lock, clock - b.lock) / 0.4));
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        });
      });
      ctx.restore();
      c.mols.forEach(m => drawWater(ctx, m.x, m.y, m.a, 1, MS));
      ctx.restore();
      ctx.save(); cupPath(cx); ctx.strokeStyle = rgba(C.navy, 0.42); ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - GW + 13, GT + 26); ctx.lineTo(cx - GW + 13, GB - 44); ctx.stroke();
      ctx.restore();
      // steam while the water is hot
      const sa = 0.45 * E.clamp((T - 35) / 25);
      if (sa > 0) {
        ctx.save(); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        for (let k = -1; k <= 1; k++) {
          const x0 = cx + 42 * k, ph = clock * 2.2 + k * 1.9, g = ctx.createLinearGradient(0, WT - 10, 0, WT - 76);
          g.addColorStop(0, rgba(C.inkSoft, 0)); g.addColorStop(0.35, rgba(C.inkSoft, sa)); g.addColorStop(1, rgba(C.inkSoft, 0));
          ctx.strokeStyle = g; ctx.beginPath();
          for (let i = 0; i <= 20; i++) { const u = i / 20, x = x0 + 7 * Math.sin(ph + 6 * u) * u, y = WT - 10 - 66 * u; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    // the chart: both temperatures against time, drawn up to now
    const X0 = 104, X1 = 770, YT = 472, YB = 752, TMIN = -22, TMAX = 74;
    const px = t => X0 + t / TEND * (X1 - X0), py = T => YB - (T - TMIN) / (TMAX - TMIN) * (YB - YT);
    function drawChart(t) {
      U.arrow(ctx, X0, YB + 6, X0, YT - 16, rgba(C.inkSoft, 0.7), 2, 9);
      U.arrow(ctx, X0 - 6, YB, X1 + 16, YB, rgba(C.inkSoft, 0.7), 2, 9);
      text(ctx, 'time in the freezer', X1 + 16, YB + 30, { size: 16, weight: 600, color: C.muted, align: 'right' });
      ctx.save(); ctx.translate(24, (YT + YB) / 2); ctx.rotate(-Math.PI / 2); text(ctx, 'temperature', 0, 0, { size: 16, weight: 600, color: C.muted, align: 'center' }); ctx.restore();
      ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X0, py(0)); ctx.lineTo(X1, py(0)); ctx.stroke(); ctx.restore();
      text(ctx, '0 °C', X0 - 10, py(0) + 6, { size: 16, weight: 700, color: C.inkSoft, align: 'right' });
      CUPS.forEach(c => text(ctx, c.T0 + ' °C', X0 - 10, py(c.T0) + 6, { size: 16, weight: 700, color: c.col, align: 'right' }));
      CUPS.forEach(c => {
        const n = Math.max(2, Math.ceil(240 * t / TEND));
        ctx.save(); ctx.strokeStyle = c.col; ctx.lineWidth = 4.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
        for (let i = 0; i <= n; i++) { const u = t * i / n; i ? ctx.lineTo(px(u), py(temp(c, u))) : ctx.moveTo(px(u), py(temp(c, u))); }
        ctx.stroke(); ctx.restore();
      });
      CUPS.forEach((c, i) => { // where each cup is frozen through
        if (t < c.tz) return;
        const a = E.clamp((t - c.tz) / 0.05), x = px(c.tz), y = py(0);
        ctx.save(); ctx.globalAlpha *= a; U.circle(ctx, x, y, 14, '#fff', rgba(c.col, 0.6), 2); snowflake(x, y, 9, c.col, 2.2);
        text(ctx, i ? 'frozen' : 'frozen first', x, y - 24, { size: 17, weight: 750, color: c.col, align: 'center' }); ctx.restore();
      });
      CUPS.forEach(c => U.circle(ctx, px(t), py(temp(c, t)), 7.5, c.col, '#fff', 2.5));
    }
    function draw() {
      S.clear();
      const t = model();
      ctx.save(); ctx.globalAlpha = E.clamp(clock / FADE) * E.clamp((PER - clock) / FADE);
      const g = ctx.createLinearGradient(0, 8, 0, 420); g.addColorStop(0, '#EEF5FB'); g.addColorStop(1, '#DCE9F4');
      roundRect(ctx, 8, 8, S.w - 16, 412, 18, g, rgba(C.blueSoft, 0.5), 1.5);
      const lab = 'freezer, −20 °C'; ctx.save(); ctx.font = U.font(16, 650); const w = ctx.measureText(lab).width + 48; ctx.restore();
      roundRect(ctx, S.w / 2 - w / 2, 22, w, 30, 15, 'rgba(255,255,255,0.9)', rgba(C.blue, 0.3), 1.2);
      snowflake(S.w / 2 - w / 2 + 19, 37, 8, C.blue, 1.8); text(ctx, lab, S.w / 2 - w / 2 + 34, 43, { size: 16, weight: 650, color: C.navy });
      CUPS.forEach(c => drawCup(c, t));
      drawChart(t);
      ctx.restore();
    }
    return {
      frame(dt) { update(dt); draw(); },
      draw, enter() { reset(); lastStep = -1; },
      step(k) { if (k === (o.at || 0) && k !== lastStep) reset(); lastStep = k; }, // restart when its build comes up
      ff: LEAD + TEND / RATE + 0.6 // static captures: both cups frozen, the whole chart
    };
  };

  // ------------------------------------------------------------------
  // An image generator in one panel: pixel noise -> a small landscape picture (for the analogy slide)
  // ------------------------------------------------------------------
  ANIMS.pixelDenoise = function (S, o) {
    const ctx = S.ctx, rng = makeRng(31), R = 40;
    const img = [];
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      const x = (i + 0.5) / R, y = (j + 0.5) / R;
      let c = U.hexToRgb(mix('#7FB7E6', '#F6E3C4', y / 0.62));
      if (Math.hypot(x - 0.72, y - 0.26) < 0.1) c = U.hexToRgb('#F2B134');
      const m1 = 0.62 - 0.36 * Math.max(0, 1 - Math.abs(x - 0.3) / 0.3), m2 = 0.62 - 0.26 * Math.max(0, 1 - Math.abs(x - 0.68) / 0.26);
      const top = Math.min(m1, m2);
      if (y > top) c = U.hexToRgb(m1 <= m2 ? '#5D6F8C' : '#7A89A3');
      if (y > top && y < 0.34) c = U.hexToRgb('#FFFFFF'); // snow on the tall peak
      if (y > 0.62) c = U.hexToRgb(mix('#6BAA5C', '#3F7F45', (y - 0.62) / 0.38));
      if (y > 0.74 && y < 0.88 && Math.abs(x - 0.55) < 0.24 - (y - 0.81) * (y - 0.81) * 8) c = U.hexToRgb('#4C8CC9');
      img.push(c);
    }
    let noise = [];
    function newNoise() { noise = img.map(() => [rng.normal(), rng.normal(), rng.normal()]); }
    newNoise();
    const T_N = 0.8, T_F = 4.4, T_H = 2.4, P = T_N + T_F + T_H;
    let clock = 0;
    const PS = Math.min(S.w - 40, S.h - 130), PX = (S.w - PS) / 2, PY = 20, cs = PS / R;
    function draw() {
      S.clear();
      const c = clock % P, t = c < T_N ? 0 : c < T_N + T_F ? E.inOut((c - T_N) / T_F) : 1;
      const a = E.smoother(t), s = 1 - a;
      for (let k = 0; k < R * R; k++) {
        const i = k % R, j = Math.floor(k / R), b = img[k], n = noise[k];
        const v = [0, 1, 2].map(ch => Math.max(0, Math.min(255, a * b[ch] + s * (128 + 70 * n[ch]))));
        ctx.fillStyle = `rgb(${v[0] | 0},${v[1] | 0},${v[2] | 0})`;
        ctx.fillRect(PX + i * cs, PY + j * cs, cs + 0.6, cs + 0.6);
      }
      roundRect(ctx, PX, PY, PS, PS, 4, null, rgba(C.ink, 0.25), 2);
      const y0 = PY + PS + 46, x0 = PX + 10, x1 = PX + PS - 10;
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = rgba(C.inkSoft, 0.25); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * t, y0); ctx.stroke(); ctx.restore();
      U.circle(ctx, x0 + (x1 - x0) * t, y0, 11, '#fff', C.orange, 4);
      text(ctx, 'random noise', x0, y0 + 40, { size: 22, color: C.inkSoft });
      text(ctx, 'a new picture', x1, y0 + 40, { size: 22, color: C.inkSoft, align: 'right' });
    }
    return { frame(dt) { const b = Math.floor(clock / P); clock += dt; if (Math.floor(clock / P) !== b) newNoise(); draw(); }, draw, enter() { } };
  };

  // ------------------------------------------------------------------
  // Chemical disorder on a lattice: atoms swap identities, shift off their sites, and appear/disappear.
  // ------------------------------------------------------------------
  ANIMS.whoSitsWhere = function (S, o) {
    const ctx = S.ctx, rng = makeRng(13), n = 8, CELL = 58, OX = 30, OY = 60;
    const COLS = [C.copper, C.steel, C.gold], NAMES = ['element 1', 'element 2', 'element 3'];
    const sites = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) sites.push({ i, j, s: rng.int(3), from: -1, tSwap: -9, seed: rng.u() * 100, vac: false, tVac: -9 });
    let clock = 0, nextSwap = 0.6, nextVac = 2.5;
    function draw() {
      S.clear();
      // lattice lines
      ctx.strokeStyle = rgba(C.inkSoft, 0.15); ctx.lineWidth = 1;
      for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.moveTo(OX + CELL / 2, OY + CELL / 2 + k * CELL); ctx.lineTo(OX + CELL * (n - 0.5), OY + CELL / 2 + k * CELL); ctx.stroke(); ctx.beginPath(); ctx.moveTo(OX + CELL / 2 + k * CELL, OY + CELL / 2); ctx.lineTo(OX + CELL / 2 + k * CELL, OY + CELL * (n - 0.5)); ctx.stroke(); }
      sites.forEach(st => {
        const cx = OX + CELL / 2 + st.j * CELL, cy = OY + CELL / 2 + st.i * CELL;
        const x = cx + 6 * wiggle(st.seed, clock * 2.5), y = cy + 6 * wiggle(st.seed + 5, clock * 2.5);
        const vu = E.clamp((clock - st.tVac) / 0.6);
        const alpha = st.vac ? 1 - vu : vu < 1 && st.tVac > 0 ? vu : 1;
        if (st.vac && vu >= 1) { ctx.save(); ctx.setLineDash([4, 4]); U.circle(ctx, cx, cy, 20, null, rgba(C.inkSoft, 0.6), 2); ctx.restore(); return; }
        const su = E.clamp((clock - st.tSwap) / 0.7), col = st.from >= 0 && su < 1 ? mix(COLS[st.from], COLS[st.s], E.smooth(su)) : COLS[st.s];
        atom(ctx, x, y, 22, col, alpha);
        if (su < 1) U.circle(ctx, cx, cy, 30, null, rgba(C.violet, 0.7 * (1 - su)), 3);
      });
      // legend
      const LX = OX + n * CELL + 36;
      text(ctx, 'Three things happen at once', LX, OY + 10, { size: 23, weight: 700, color: C.ink });
      const items = [['swap', 'which element sits on a site', C.violet], ['shift', 'atoms move off their ideal spots', C.teal], ['appear / vanish', 'vacancies and dopants come and go', C.coral]];
      items.forEach(([h, d, c], k) => {
        const y = OY + 70 + k * 92;
        roundRect(ctx, LX, y - 30, 8, 60, 4, c);
        text(ctx, h, LX + 24, y - 4, { size: 23, weight: 700, color: c });
        text(ctx, d, LX + 24, y + 24, { size: 18, color: C.inkSoft });
      });
      COLS.forEach((c, k) => { atom(ctx, LX + 14 + k * 112, OY + 380, 13, c); text(ctx, NAMES[k], LX + 32 + k * 112, OY + 386, { size: 16, color: C.inkSoft }); });
    }
    return {
      frame(dt) {
        clock += dt;
        if (clock > nextSwap) { const st = rng.pick(sites.filter(s => !s.vac)); st.from = st.s; st.s = (st.s + 1 + rng.int(2)) % 3; st.tSwap = clock; nextSwap = clock + 0.35; }
        if (clock > nextVac) {
          const cand = sites.filter(s => s.vac); if (cand.length && rng.u() < 0.5) { const st = rng.pick(cand); st.vac = false; st.tVac = clock; st.s = rng.int(3); }
          else { const st = rng.pick(sites.filter(s => !s.vac)); st.vac = true; st.tVac = clock; }
          nextVac = clock + 1.6;
        }
        draw();
      }, draw, enter() { }
    };
  };

  // ------------------------------------------------------------------
  // OMNIA (future work) 1/3: a melt of A and B cools through a simple eutectic phase diagram.
  // A crystals grow first (their share follows the lever rule), the B-rich rest freezes at once at the eutectic.
  // Schematic: reduced units; the liquid is soft disks in Brownian motion.
  // ------------------------------------------------------------------
  ANIMS.omniaMelt = function (S, o) {
    const ctx = S.ctx, rng = makeRng(o.seed || 7), SPA = C.copper, SPB = C.steel, Z = o.zoom || 1;
    // phase diagram: A melts at TA, B at TB, eutectic at (XE, TE); the melt has composition X0
    const TA = 1, TB = 0.8, XE = 0.62, TE = 0.42, X0 = 0.28, TMIN = 0.22, TMAX = 1.12, EX = 1.4;
    const liqA = x => TE + (TA - TE) * (1 - Math.pow(x / XE, EX));
    const liqB = x => TE + (TB - TE) * (1 - Math.pow((1 - x) / (1 - XE), EX));
    const xLiq = T => XE * Math.pow(E.clamp(1 - (T - TE) / (TA - TE)), 1 / EX); // liquid composition on the A side
    const TL = liqA(X0), FP = (XE - X0) / XE; // where the melt starts to crystallise; share of A crystals at TE
    const PD = { x: 84, y: 14, w: 430, h: 226 };
    const gx = x => PD.x + x * PD.w, gy = T => PD.y + PD.h - (T - TMIN) / (TMAX - TMIN) * PD.h;
    // the box: hexagonal sites ordered by distance from a nucleus in the lower-left corner
    const NC = 10, NR = 8, A0 = 29, RAD = 10.5, BX = 16, BY = 300, BW = 32 + 9.5 * A0, BH = 32 + (NR - 1) * A0 * 0.866;
    const sites = [];
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) sites.push({ i, x: BX + 16 + i * A0 + (j % 2) * A0 / 2, y: BY + BH - 16 - j * A0 * 0.866 });
    sites.sort((a, b) => Math.hypot(a.x - BX, a.y - BY - BH) - Math.hypot(b.x - BX, b.y - BY - BH));
    const NP = Math.round(FP * sites.length);
    sites.forEach((s, k) => { s.sp = k < NP ? 0 : (s.i % 3 === 0 ? 0 : 1); }); // A crystals first, then A/B lamellae
    const nbr = []; sites.forEach((s, a) => sites.forEach((q, b) => { if (b > a && Math.hypot(s.x - q.x, s.y - q.y) < A0 * 1.1) nbr.push([a, b]); }));
    const atoms = sites.map(s => ({ sp: s.sp, x: 0, y: 0, site: -1, seed: rng.u() * 100 }));
    const bound = new Array(sites.length).fill(-1);
    const P = 13.2;
    let clock = 0, T = 1.05, nP = 0, nE = 0, fade = 1, lastStep = -1;
    function relax(sig) {
      const n = atoms.length, dmin = 2 * RAD + 1.5;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = atoms[i], b = atoms[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 >= dmin * dmin || d2 < 1e-6) continue;
        const ov = (dmin - Math.sqrt(d2)) / Math.sqrt(d2), fa = a.site < 0 ? (b.site < 0 ? 0.25 : 0.5) : 0, fb = b.site < 0 ? (a.site < 0 ? 0.25 : 0.5) : 0;
        a.x += dx * ov * fa; a.y += dy * ov * fa; b.x -= dx * ov * fb; b.y -= dy * ov * fb;
      }
      const anyBound = bound.some(v => v >= 0);
      atoms.forEach(a => {
        if (a.site >= 0) { const s = sites[a.site]; a.x += (s.x - a.x) * 0.12; a.y += (s.y - a.y) * 0.12; return; }
        if (anyBound) { // the growing crystal sweeps free atoms ahead of it, out into the melt
          let dn = Infinity; sites.forEach((s, k) => { if (bound[k] >= 0) dn = Math.min(dn, Math.hypot(a.x - s.x, a.y - s.y)); });
          if (dn < 0.8 * A0) { const ux = a.x - BX, uy = a.y - BY - BH, L = Math.hypot(ux, uy) || 1; a.x += ux / L * 2.4; a.y += uy / L * 2.4; }
        }
        a.x = E.clamp(a.x + sig * rng.normal(), BX + RAD + 1, BX + BW - RAD - 1); a.y = E.clamp(a.y + sig * rng.normal(), BY + RAD + 1, BY + BH - RAD - 1);
      });
    }
    function settle(sig) { relax(sig); relax(0); relax(0); }
    function scatter() {
      atoms.forEach(a => { a.x = BX + RAD + rng.u() * (BW - 2 * RAD); a.y = BY + RAD + rng.u() * (BH - 2 * RAD); a.site = -1; });
      bound.fill(-1); nP = 0; nE = 0;
      for (let k = 0; k < 160; k++) settle(0.5);
    }
    function bind(k) { // the nearest free atom of the right kind joins the crystal at site k
      let best = -1, bd = Infinity; const s = sites[k];
      atoms.forEach((a, ai) => { if (a.site < 0 && a.sp === s.sp) { const d = Math.hypot(a.x - s.x, a.y - s.y); if (d < bd) { bd = d; best = ai; } } });
      if (best >= 0) { atoms[best].site = k; bound[k] = best; }
    }
    function tempAt(c) {
      if (c < 1.4) return 1.05;
      if (c < 2.6) return 1.05 + (TL - 1.05) * E.inOut((c - 1.4) / 1.2);
      if (c < 7.4) return TL + (TE - TL) * (c - 2.6) / 4.8;
      if (c < 8.9) return TE;
      if (c < 9.9) return TE + (0.3 - TE) * E.inOut((c - 8.9) / 1);
      if (c < 11.9) return 0.3;
      return 0.3 + 0.75 * E.inOut((c - 11.9) / 1.3);
    }
    function restart() { clock = 0; T = 1.05; scatter(); }
    scatter();
    function paint() {
      const c = clock % P, heat = E.clamp((T - TE) / (TA - TE));
      // ---------- phase diagram ----------
      const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(([x, t], k) => k ? ctx.lineTo(gx(x), gy(t)) : ctx.moveTo(gx(x), gy(t))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
      const cA = [], cB = [];
      for (let k = 0; k <= 40; k++) { const x = XE * k / 40; cA.push([x, liqA(x)]); }
      for (let k = 0; k <= 40; k++) { const x = XE + (1 - XE) * k / 40; cB.push([x, liqB(x)]); }
      poly([[0, TMAX], ...cA, ...cB, [1, TMAX]], rgba(C.coral, 0.2));
      poly([[0, TE], ...cA], rgba(C.yellow, 0.16));
      poly([...cB, [1, TE]], rgba(SPB, 0.16));
      poly([[0, TE], [1, TE], [1, TMIN], [0, TMIN]], rgba(C.navy, 0.1));
      ctx.strokeStyle = rgba(C.ink, 0.75); ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
      ctx.beginPath(); [...cA, ...cB].forEach(([x, t], k) => k ? ctx.lineTo(gx(x), gy(t)) : ctx.moveTo(gx(x), gy(t))); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(gx(0), gy(TE)); ctx.lineTo(gx(1), gy(TE)); ctx.stroke();
      ctx.strokeStyle = rgba(C.inkSoft, 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(PD.x, PD.y); ctx.lineTo(PD.x, PD.y + PD.h); ctx.lineTo(PD.x + PD.w, PD.y + PD.h); ctx.stroke();
      text(ctx, 'liquid', gx(0.64), gy(0.98), { size: 19, weight: 700, color: '#B4492F', align: 'center' });
      text(ctx, 'A crystals', gx(0.12), gy(0.66), { size: 15, weight: 600, color: SPA, align: 'center' });
      text(ctx, '+ liquid', gx(0.12), gy(0.66) + 18, { size: 15, weight: 600, color: SPA, align: 'center' });
      text(ctx, 'B crystals', gx(0.88), gy(0.55), { size: 15, weight: 600, color: '#5F6B77', align: 'center' });
      text(ctx, '+ liquid', gx(0.88), gy(0.55) + 16, { size: 15, weight: 600, color: '#5F6B77', align: 'center' });
      text(ctx, 'solid A + B', gx(0.8), gy(0.3) + 5, { size: 15, weight: 600, color: C.navy, align: 'center' });
      ctx.save(); ctx.translate(PD.x - 16, PD.y + PD.h / 2); ctx.rotate(-Math.PI / 2); text(ctx, 'temperature', 0, 0, { size: 17, color: C.inkSoft, align: 'center' }); ctx.restore();
      text(ctx, 'A', gx(0), PD.y + PD.h + 22, { size: 17, weight: 700, color: SPA, align: 'center' });
      text(ctx, 'B', gx(1), PD.y + PD.h + 22, { size: 17, weight: 700, color: '#5F6B77', align: 'center' });
      text(ctx, 'composition', gx(0.5), PD.y + PD.h + 22, { size: 17, color: C.inkSoft, align: 'center' });
      // the cooling path of this melt
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = rgba(C.navy, 0.45); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(gx(X0), gy(TMAX)); ctx.lineTo(gx(X0), gy(TMIN)); ctx.stroke(); ctx.restore();
      const live = c >= 2.6 && c < 11.9;
      if (live) { U.circle(ctx, gx(X0), gy(TL), 5, SPA); text(ctx, 'A crystals start', gx(X0) + 12, gy(TL) - 12, { size: 15, weight: 650, color: SPA }); }
      if (c >= 7.4 && c < 11.9) text(ctx, 'the rest freezes', gx(X0) + 14, gy(TE) + 19, { size: 15, weight: 650, color: C.navy });
      U.circle(ctx, gx(X0), gy(T), 9, '#fff', C.navy, 3.5);
      // ---------- the box ----------
      roundRect(ctx, BX, BY, BW, BH, 10, mix('#FFFFFF', '#FBE0CE', heat), rgba(C.inkSoft, 0.35), 1.5);
      ctx.strokeStyle = rgba(C.ink, 0.18); ctx.lineWidth = 2;
      nbr.forEach(([p, q]) => {
        const a = bound[p], b = bound[q]; if (a < 0 || b < 0) return;
        const A = atoms[a], B = atoms[b]; if (Math.hypot(A.x - sites[p].x, A.y - sites[p].y) > 3 || Math.hypot(B.x - sites[q].x, B.y - sites[q].y) > 3) return;
        ctx.globalAlpha = fade; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.globalAlpha = 1;
      });
      atoms.forEach(a => { const j = a.site >= 0 ? 1.2 : 0; atom(ctx, a.x + j * wiggle(a.seed, clock * 4), a.y + j * wiggle(a.seed + 3, clock * 4), RAD, a.sp ? SPB : SPA, fade); });
      atom(ctx, BX + 12, BY + BH + 26, 8, SPA); text(ctx, 'A', BX + 26, BY + BH + 32, { size: 16, color: C.inkSoft });
      atom(ctx, BX + 62, BY + BH + 26, 8, SPB); text(ctx, 'B', BX + 76, BY + BH + 32, { size: 16, color: C.inkSoft });
      // ---------- what happens, step by step ----------
      const stage = c < 2.6 ? 0 : c < 7.4 ? 1 : c < 11.9 ? 2 : -1;
      const ST = [['melt', 'atoms flow freely', '#B4492F'], ['A crystals grow', 'melt left richer in B', SPA], ['the rest freezes', 'A and B crystals', C.navy]];
      const LX = BX + BW + 26;
      ST.forEach(([h, d, col], k) => {
        const y = BY + 34 + k * 70, on = k === stage;
        U.circle(ctx, LX + 8, y - 6, 8, on ? col : '#fff', on ? col : rgba(C.inkSoft, 0.4), 2.5);
        text(ctx, h, LX + 26, y, { size: 19, weight: 700, color: on ? col : C.muted });
        text(ctx, d, LX + 26, y + 23, { size: 15, color: on ? C.inkSoft : rgba(C.inkSoft, 0.55) });
      });
    }
    function draw() { S.clear(); ctx.save(); ctx.scale(Z, Z); paint(); ctx.restore(); }
    return {
      frame(dt) {
        const before = Math.floor(clock / P); clock += dt;
        if (Math.floor(clock / P) !== before) scatter();
        const c = clock % P; T = tempAt(c);
        fade = c < 0.4 ? E.smooth(c / 0.4) : c > P - 0.45 ? E.smooth((P - c) / 0.45) : 1;
        if (c >= 2.6 && c < 7.4) { const xl = xLiq(T), target = Math.round(NP * E.clamp((xl - X0) / xl / FP)); while (nP < target) bind(nP++); }
        if (c >= 7.4 && c < 11.9) { while (nP < NP) bind(nP++); const target = Math.round((sites.length - NP) * E.clamp((c - 7.4) / 1.3)); while (nE < target) bind(NP + nE++); }
        if (c >= 11.9 && T > TE && nP + nE > 0) { atoms.forEach(a => { a.site = -1; }); bound.fill(-1); nP = 0; nE = 0; }
        settle(1.7 * Math.sqrt(Math.max(0.3, T)));
        draw();
      },
      draw, enter() { restart(); lastStep = -1; },
      step(k) { if (k === (o.at || 0) && k !== lastStep) restart(); lastStep = k; } // restart when its build comes up
    };
  };

  // ------------------------------------------------------------------
  // OMNIA 2/3: H atoms on and under a Pd surface, exchanged with H₂ gas; the gas pressure sets how many. Schematic.
  // ------------------------------------------------------------------
  ANIMS.omniaSurface = function (S, o) {
    const ctx = S.ctx, rng = makeRng(o.seed || 9), PDC = C.steel, HC = C.blue, Z = o.zoom || 1;
    const NL = 5, NA = 10, DX = 40, DY = 36, SX = 24, SY = 292, RPD = 16.5, RH = 6.5, GX0 = 6, GX1 = 420, GY0 = 38, GY1 = 236;
    const pd = []; for (let l = 0; l < NL; l++) for (let i = 0; i < NA; i++) pd.push({ x: SX + i * DX + (l % 2) * DX / 2, y: SY + l * DY, l, seed: rng.u() * 100 });
    // sites: in the grooves of the surface (0), just under it (1), deeper (2)
    const sites = [];
    for (let i = 0; i < NA - 1; i++) sites.push({ x: SX + (i + 0.5) * DX, y: SY - 16, kind: 0 });
    for (let l = 0; l < 3; l++) for (let i = 0; i < NA - 1; i++) sites.push({ x: SX + i * DX + DX / 2 + (l % 2) * DX / 2, y: SY + l * DY + 12, kind: l ? 2 : 1 });
    sites.forEach(s => { s.on = false; s.busy = false; s.seed = rng.u() * 100; });
    const P = 14, pOf = c => 0.06 + 0.94 * (0.5 - 0.5 * Math.cos(2 * Math.PI * c / P));
    let gas = [], movers = [], clock = 0, nextEv = 0, p = 0.06, lastStep = -1;
    const mol = (x, y, top) => ({ x, y, vx: (rng.u() - 0.5) * 160, vy: top ? 50 + rng.u() * 60 : (rng.u() - 0.5) * 160, a: rng.u() * 6.28, va: (rng.u() - 0.5) * 4, al: 0, out: false });
    function reset() {
      sites.forEach(s => { s.on = false; s.busy = false; }); movers = []; clock = 0; nextEv = 0;
      gas = []; for (let k = 0; k < 3; k++) { const m = mol(GX0 + 40 + rng.u() * (GX1 - GX0 - 80), GY0 + 40 + rng.u() * (GY1 - GY0 - 80)); m.al = 1; gas.push(m); }
      sites.filter(s => s.kind === 0).slice(3, 5).forEach(s => { s.on = true; });
    }
    reset();
    const of = (k, f) => sites.filter(s => s.kind === k && f(s));
    const near = (from, list) => list.reduce((b, s) => (!b || Math.hypot(s.x - from.x, s.y - from.y) < Math.hypot(b.x - from.x, b.y - from.y)) ? s : b, null);
    function hop(a, b, dur) { a.on = false; b.busy = true; movers.push({ kind: 'hop', a, b, t0: clock, dur }); }
    function event() {
      const occ = k => of(k, s => s.on), fre = k => of(k, s => !s.on && !s.busy), cnt = k => of(k, s => s.on || s.busy).length;
      const t0 = Math.round(9 * Math.min(1, 1.02 * Math.sqrt(p))), t1 = Math.round(9 * E.smooth((p - 0.2) / 0.5)), t2 = Math.round(15 * E.smooth((p - 0.45) / 0.45));
      const n0 = cnt(0), n1 = cnt(1), n2 = cnt(2), need = [];
      if (n0 < t0 && fre(0).length >= 2 && gas.some(m => !m.out)) need.push('ads');
      if (n0 > t0 + 1 && occ(0).length >= 2) need.push('des');
      if (n1 < t1 && occ(0).length && fre(1).length) need.push('in1');
      if (n1 > t1 && occ(1).length && fre(0).length) need.push('out1');
      if (n2 < t2 && occ(1).length && fre(2).length) need.push('in2');
      if (n2 > t2 && occ(2).length && fre(1).length) need.push('out2');
      if (!need.length) { const a = rng.pick(occ(0) || []), f = fre(0).filter(s => a && Math.abs(s.x - a.x) < DX * 1.1); if (a && f.length) hop(a, rng.pick(f), 0.35); return; }
      const act = rng.pick(need);
      if (act === 'ads') { // an H₂ molecule lands and splits onto two neighbouring free grooves
        const F = fre(0), A = rng.pick(F), B = near(A, F.filter(s => s !== A)), mx = (A.x + B.x) / 2;
        const m = near({ x: mx, y: GY1 }, gas.filter(q => !q.out)); gas.splice(gas.indexOf(m), 1);
        A.busy = B.busy = true; movers.push({ kind: 'ads', A, B, x: m.x, y: m.y, a: m.a, t0: clock, dur: 0.85 });
      } else if (act === 'des') { // two H atoms meet and leave as H₂
        const O = occ(0), A = rng.pick(O), B = near(A, O.filter(s => s !== A));
        A.on = B.on = false; movers.push({ kind: 'des', A, B, t0: clock, dur: 0.8 });
      } else if (act === 'in1') { const a = rng.pick(occ(0)); hop(a, near(a, fre(1)), 0.45); }
      else if (act === 'out1') { const a = rng.pick(occ(1)); hop(a, near(a, fre(0)), 0.45); }
      else if (act === 'in2') { const a = rng.pick(occ(1)); hop(a, near(a, fre(2)), 0.45); }
      else if (act === 'out2') { const a = rng.pick(occ(2)); hop(a, near(a, fre(1)), 0.45); }
    }
    function h2(x, y, a, al) {
      const dx = 7 * Math.cos(a), dy = 7 * Math.sin(a);
      ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = rgba(HC, 0.7); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke(); ctx.restore();
      atom(ctx, x - dx, y - dy, RH, HC, al); atom(ctx, x + dx, y + dy, RH, HC, al);
    }
    function paint() {
      roundRect(ctx, GX0, GY0, GX1 - GX0, GY1 - GY0, 14, rgba(HC, 0.06));
      text(ctx, 'H₂ gas', GX0 + 4, 24, { size: 16, weight: 650, color: HC });
      gas.forEach(m => h2(m.x, m.y, m.a, m.al));
      pd.forEach(q => { const j = q.l === 0 ? 2 : 1.3; atom(ctx, q.x + j * wiggle(q.seed, clock * 3), q.y + j * wiggle(q.seed + 5, clock * 3), RPD, PDC); });
      sites.forEach(s => { if (s.on) atom(ctx, s.x + 1.4 * wiggle(s.seed, clock * 4), s.y + 1.4 * wiggle(s.seed + 2, clock * 4), RH, HC); });
      movers.forEach(m => {
        const u = E.clamp((clock - m.t0) / m.dur);
        if (m.kind === 'hop') { const e = E.inOut(u); atom(ctx, m.a.x + (m.b.x - m.a.x) * e, m.a.y + (m.b.y - m.a.y) * e, RH, HC); }
        else if (m.kind === 'ads') {
          const mx = (m.A.x + m.B.x) / 2, my = SY - 44;
          if (u < 0.6) { const e = E.inOut(u / 0.6); h2(m.x + (mx - m.x) * e, m.y + (my - m.y) * e, m.a + e * 2, 1); }
          else { const e = E.out((u - 0.6) / 0.4); [m.A, m.B].forEach((s, k) => { const sx = mx + (k ? 7 : -7); atom(ctx, sx + (s.x - sx) * e, my + (s.y - my) * e, RH, HC); }); }
        } else if (m.kind === 'des') {
          const mx = (m.A.x + m.B.x) / 2, my = SY - 44;
          if (u < 0.4) { const e = E.inOut(u / 0.4); [m.A, m.B].forEach((s, k) => { const sx = mx + (k ? 7 : -7); atom(ctx, s.x + (sx - s.x) * e, s.y + (my - s.y) * e, RH, HC); }); }
          else { const e = E.out((u - 0.4) / 0.6); h2(mx, my - 70 * e, 0, 1); }
        }
      });
      // pressure gauge
      const gX = 466, g0 = 40, g1 = 452, fill = (g1 - g0) * p;
      text(ctx, 'H₂ pressure', gX + 13, 24, { size: 16, weight: 650, color: C.ink, align: 'center' });
      roundRect(ctx, gX, g0, 26, g1 - g0, 13, rgba(HC, 0.08), rgba(HC, 0.45), 2);
      roundRect(ctx, gX + 3, g1 - 3 - Math.max(20, fill - 6), 20, Math.max(20, fill - 6), 10, rgba(HC, 0.8));
      text(ctx, 'high', gX + 34, g0 + 16, { size: 14, color: C.muted }); text(ctx, 'low', gX + 34, g1 - 4, { size: 14, color: C.muted });
      // labels and counts
      roundRect(ctx, SX - 10, SY + 4 * DY + 26, 52, 28, 14, rgba(PDC, 0.18));
      text(ctx, 'Pd', SX + 16, SY + 4 * DY + 46, { size: 18, weight: 750, color: '#5F6B77', align: 'center' });
      const cnt = k => sites.filter(s => s.kind === k && s.on).length;
      [['on the surface', cnt(0), HC], ['just under it', cnt(1), C.navy], ['deeper inside', cnt(2), C.inkSoft]].forEach(([l, n, col], k) => {
        const x = 150 + k * 128;
        text(ctx, l, x, 506, { size: 15, color: C.muted, align: 'center' });
        text(ctx, n + ' H', x, 536, { size: 24, weight: 750, color: col, align: 'center' });
      });
    }
    function draw() { S.clear(); ctx.save(); ctx.scale(Z, Z); paint(); ctx.restore(); }
    return {
      frame(dt) {
        clock += dt; p = pOf(clock % P);
        // gas: as many molecules as the pressure asks for
        const want = Math.round(2 + 9 * p), live = gas.filter(m => !m.out);
        if (live.length < want && rng.u() < 0.12) gas.push(mol(GX0 + 40 + rng.u() * (GX1 - GX0 - 80), GY0 + 22, true));
        if (live.length > want + 1) live[0].out = true;
        gas.forEach(m => {
          m.x += m.vx * dt; m.y += m.vy * dt; m.a += m.va * dt;
          if (m.out) { m.vy = -140; m.al = Math.max(0, m.al - dt * 2); return; }
          m.al = Math.min(1, m.al + dt * 3);
          if (m.x < GX0 + 16 || m.x > GX1 - 16) { m.vx *= -1; m.x = E.clamp(m.x, GX0 + 16, GX1 - 16); }
          if (m.y < GY0 + 16 || m.y > GY1 - 14) { m.vy *= -1; m.y = E.clamp(m.y, GY0 + 16, GY1 - 14); }
        });
        gas = gas.filter(m => !(m.out && m.al <= 0));
        movers = movers.filter(m => {
          if (clock - m.t0 < m.dur) return true;
          if (m.kind === 'hop') { m.b.busy = false; m.b.on = true; }
          if (m.kind === 'ads') { m.A.busy = m.B.busy = false; m.A.on = m.B.on = true; }
          if (m.kind === 'des') { const g = mol((m.A.x + m.B.x) / 2, GY1 - 20, false); g.vy = -60 - rng.u() * 60; g.al = 1; gas.push(g); }
          return false;
        });
        if (clock >= nextEv) { event(); nextEv = clock + 0.13; }
        draw();
      },
      draw, enter() { reset(); lastStep = -1; },
      step(k) { if (k === (o.at || 0) && k !== lastStep) reset(); lastStep = k; } // restart when its build comes up
    };
  };

  // ------------------------------------------------------------------
  // OMNIA 3/3: three pieces of amorphous carbon in 3D, carbon webs of different density, each with the Na⁺ it holds
  // inside; shown in turn and slowly turning; the bars below compare the counts. Equilibrium snapshots (states, not a
  // charging process). Schematic: carbon webs from tools/gen_acarbon.py (js/data/acarbon.js, units of about one bond
  // length, z up); thin bonds and small atoms so the web reads.
  // ------------------------------------------------------------------
  ANIMS.omniaBattery = function (S, o) {
    const ctx = S.ctx, CC = '#56616D', NAC = C.gold, NAD = '#A87A0E', Z = o.zoom || 1;
    const NAMES = ['carbon 1', 'carbon 2', 'carbon 3'], carbons = window.ACARBON;
    const BX = 6, BY = 8, BW = 528, BH = 346, CX = BX + BW / 2, CY = BY + BH / 2;
    const SC = 24, CAM = 34, TILT = 0.35, SPIN = 0.3; // px per unit at the centre, camera distance, look-down angle, turn rate
    const NMAX = Math.max(...carbons.map(q => q.n.length));
    // each carbon is shown for SHOW s (the last one through the final hold too), and its bar appears with it
    const SHOW = 4.2, HOLD = 3.4, FADE = 0.35, PER = carbons.length * SHOW + HOLD;
    let clock = 0, lastStep = -1;
    function paint() {
      const c = clock % PER, k = Math.min(carbons.length - 1, Math.floor(c / SHOW)), cb = carbons[k];
      const end = k === carbons.length - 1 ? PER : (k + 1) * SHOW, al = E.clamp((c - k * SHOW) / FADE) * E.clamp((end - c) / FADE);
      roundRect(ctx, BX, BY, BW, BH, 12, '#fff', rgba(C.inkSoft, 0.25), 1.5);
      // turn about the vertical axis, look down at TILT, perspective; far atoms fade towards white
      const th = 0.6 + SPIN * (c - k * SHOW), cs = Math.cos(th), sn = Math.sin(th), ct = Math.cos(TILT), st = Math.sin(TILT);
      const proj = ([x, y, z]) => { const x1 = x * cs - y * sn, y1 = x * sn + y * cs, d = CAM + y1 * ct - z * st, s = SC * CAM / d; return [CX + x1 * s, CY - (y1 * st + z * ct) * s, d, s]; };
      const A = cb.a.map(proj), N = cb.n.map(proj);
      let dn = Infinity, df = -Infinity; A.forEach(p => { dn = Math.min(dn, p[2]); df = Math.max(df, p[2]); });
      const fog = d => 0.55 * E.clamp((d - dn) / (df - dn));
      const items = [];
      A.forEach((p, i) => items.push({ d: p[2], kind: 0, i }));
      cb.b.forEach(([i, j], m) => items.push({ d: (A[i][2] + A[j][2]) / 2 + 0.05, kind: 1, i: m }));
      N.forEach((p, i) => items.push({ d: p[2], kind: 2, i }));
      items.sort((a, b) => b.d - a.d); // far first
      ctx.save(); ctx.globalAlpha = al; ctx.beginPath(); ctx.rect(BX, BY, BW, BH); ctx.clip(); ctx.lineCap = 'round';
      for (const it of items) {
        if (it.kind === 1) {
          const [i, j] = cb.b[it.i], p = A[i], q = A[j];
          ctx.strokeStyle = mix(CC, '#FFFFFF', 0.08 + fog(it.d)); ctx.lineWidth = 0.075 * (p[3] + q[3]);
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        } else if (it.kind === 0) { const p = A[it.i]; atom(ctx, p[0], p[1], 0.18 * p[3], mix(CC, '#FFFFFF', fog(it.d)), 1, false); }
        else { const p = N[it.i]; atom(ctx, p[0], p[1], 0.78 * p[3], mix(NAC, '#FFFFFF', 0.6 * fog(it.d))); }
      }
      // which carbon this is
      ctx.font = U.font(18, 700); const w = ctx.measureText(NAMES[k]).width;
      roundRect(ctx, BX + 12, BY + 12, w + 30, 34, 17, 'rgba(255,255,255,0.95)', rgba(C.navy, 0.2), 1.2);
      text(ctx, NAMES[k], BX + 27, BY + 35, { size: 18, weight: 700, color: C.navy });
      ctx.restore();
      atom(ctx, BX + 12, BY + BH + 19, 5, CC, 1, false); text(ctx, 'carbon', BX + 24, BY + BH + 24, { size: 15, color: C.inkSoft });
      atom(ctx, BX + 98, BY + BH + 19, 7.5, NAC); text(ctx, 'Na⁺', BX + 111, BY + BH + 24, { size: 15, color: C.inkSoft });
      // Na⁺ captured by each carbon; the one on show is highlighted
      const GX = 150, GW = 330, GY = BY + BH + 60;
      text(ctx, 'Na⁺ captured', BX + 6, GY, { size: 17, weight: 700, color: C.ink });
      carbons.forEach((q, j) => {
        const y = GY + 34 + j * 38, on = j === k, g = E.inOut(E.clamp((c - j * SHOW - 0.3) / 0.6)), n = q.n.length;
        text(ctx, NAMES[j], BX + 6, y, { size: 16, weight: on ? 750 : 600, color: on ? NAD : C.inkSoft });
        roundRect(ctx, GX, y - 15, GW, 20, 10, rgba(C.inkSoft, 0.1));
        if (g > 0) {
          roundRect(ctx, GX, y - 15, Math.max(20, GW * n / NMAX * g), 20, 10, on ? NAC : rgba(NAC, 0.5));
          text(ctx, String(n), BX + BW, y + 1, { size: 20, weight: 750, color: NAD, align: 'right', alpha: g });
        }
      });
    }
    function draw() { S.clear(); ctx.save(); ctx.scale(Z, Z); paint(); ctx.restore(); }
    return {
      frame(dt) { clock += dt; draw(); },
      draw, enter() { clock = 0; lastStep = -1; },
      step(k) { if (k === (o.at || 0) && k !== lastStep) clock = 0; lastStep = k; }, // restart when its build comes up
      ff: 2 * SHOW + 1.4 // static captures: the last carbon, with all three bars
    };
  };

  // ------------------------------------------------------------------
  // Kinetics (future work): shared pieces. Water molecules, a numbered caption for each stage, and a small energy
  // landscape specific to each process: the ball rattles in a valley, then crosses the barrier. The percentage is the
  // committor (the chance to finish from here); it also colours the ball.
  // ------------------------------------------------------------------
  const WO = '#8FA9C4', WH = '#D5DEE7';
  const angDiff = (t, a) => Math.atan2(Math.sin(t - a), Math.cos(t - a));
  function drawWater(ctx, x, y, a, al, s = 1) {
    const L = 9 * s, h1x = x + L * Math.cos(a - 0.91), h1y = y + L * Math.sin(a - 0.91), h2x = x + L * Math.cos(a + 0.91), h2y = y + L * Math.sin(a + 0.91);
    ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = WO; ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.moveTo(h1x, h1y); ctx.lineTo(x, y); ctx.lineTo(h2x, h2y); ctx.stroke(); ctx.restore();
    atom(ctx, h1x, h1y, 3.6 * s, WH, al); atom(ctx, h2x, h2y, 3.6 * s, WH, al); atom(ctx, x, y, 6.2 * s, WO, al);
  }
  function waterBath(rng, B, n) {
    const W = [];
    for (let k = 0; k < n; k++) W.push({ x: B.x + 14 + rng.u() * (B.w - 28), y: B.y + 14 + rng.u() * (B.h - 28), a: rng.u() * 6.283 });
    function step(discs) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const p = W[i], q = W[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
        if (d2 > 324 || d2 < 1e-6) continue;
        const f = (18 - Math.sqrt(d2)) / Math.sqrt(d2) * 0.25; p.x += dx * f; p.y += dy * f; q.x -= dx * f; q.y -= dy * f;
      }
      W.forEach(w => {
        w.x += 0.7 * rng.normal(); w.y += 0.7 * rng.normal(); w.a += 0.05 * rng.normal();
        discs.forEach(s => { const dx = w.x - s.x, dy = w.y - s.y, d = Math.hypot(dx, dy), m = s.r + 11; if (d < m && d > 1e-6) { w.x += dx / d * (m - d) * 0.5; w.y += dy / d * (m - d) * 0.5; } });
        w.x = E.clamp(w.x, B.x + 9, B.x + B.w - 9); w.y = E.clamp(w.y, B.y + 9, B.y + B.h - 9);
      });
    }
    return { W, step, draw(ctx, al) { W.forEach(w => drawWater(ctx, w.x, w.y, w.a, al)); } };
  }
  function stageCaption(ctx, stages, c, al) { // numbered caption of the current stage, top left of the scene
    let k = -1; stages.forEach((s, i) => { if (c >= s[0]) k = i; }); if (k < 0) return;
    const str = stages[k][1], a = E.clamp((c - stages[k][0]) / 0.35) * al;
    ctx.save(); ctx.font = U.font(18, 700); const w = ctx.measureText(str).width; ctx.restore();
    roundRect(ctx, 18, 16, w + 60, 36, 18, rgba('#FFFFFF', 0.95 * al), rgba(C.navy, 0.2 * al), 1.2);
    U.circle(ctx, 37, 34, 12, rgba(C.navy, a)); text(ctx, String(k + 1), 37, 39, { size: 15, weight: 800, color: '#fff', align: 'center', alpha: a });
    text(ctx, str, 57, 40, { size: 18, weight: 700, color: C.navy, alpha: a });
  }
  function energyStrip(ctx, spec, c, al) {
    const L = spec.land(c), [emin, emax] = spec.eRange, x0 = 44, x1 = 496;
    const curve = pts => x => { for (let i = 0; i + 1 < pts.length; i++) { const [xa, ea] = pts[i], [xb, eb] = pts[i + 1]; if (x <= xb || i + 2 === pts.length) { const t = E.clamp((x - xa) / (xb - xa)); return ea + (eb - ea) * (1 - Math.cos(Math.PI * t)) / 2; } } return 0; };
    const En = curve(L.pts);
    const X = x => x0 + x * (x1 - x0), Y = e => 532 - (e - emin) / (emax - emin) * 116;
    const q = E.clamp(spec.q(c)), bxr = E.clamp(spec.ball(c), 0.01, 0.99), [cL, cR] = spec.colors || ['#7B9CD0', C.coral];
    const lab = spec.readout + ': ', pc = Math.round(q * 100) + '%';
    ctx.save(); ctx.font = U.font(16, 800); const w2 = ctx.measureText(pc).width; ctx.font = U.font(16, 650); const w1 = ctx.measureText(lab).width;
    let ts = 17; ctx.font = U.font(ts, 700); while (ts > 13 && ctx.measureText(L.title).width > (x1 - x0) - w1 - w2 - 24) { ts--; ctx.font = U.font(ts, 700); } ctx.restore();
    text(ctx, L.title, x0, 372, { size: ts, weight: 700, color: L.titleColor || C.ink });
    text(ctx, lab, x1 - w2, 372, { size: 16, weight: 650, color: C.ink, align: 'right' });
    text(ctx, pc, x1, 372, { size: 16, weight: 800, color: mix(mix(cL, '#1F2933', 0.25), mix(cR, '#1F2933', 0.15), q), align: 'right' });
    // energy axis, and a light fill under the curve so the hills read as terrain
    U.arrow(ctx, 24, 548, 24, 414, rgba(C.inkSoft, 0.7), 2, 9);
    ctx.save(); ctx.translate(14, 481); ctx.rotate(-Math.PI / 2); text(ctx, 'energy', 0, 0, { size: 13, weight: 650, color: C.muted, align: 'center' }); ctx.restore();
    { ctx.save(); ctx.beginPath(); ctx.moveTo(X(0), 548); for (let k = 0; k <= 160; k++) { const x = k / 160; ctx.lineTo(X(x), Y(En(x))); } ctx.lineTo(X(1), 548); ctx.closePath();
      const gf = ctx.createLinearGradient(0, 414, 0, 548); gf.addColorStop(0, rgba(C.navy, 0.11)); gf.addColorStop(1, rgba(C.navy, 0.02)); ctx.fillStyle = gf; ctx.globalAlpha *= al; ctx.fill(); ctx.restore(); }
    if (L.ghost) { // the landscape before the change, dashed, under the new one
      const Eg = curve(L.ghost.pts);
      ctx.save(); ctx.globalAlpha *= L.ghost.alpha; ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(C.inkSoft, 0.7); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let k = 0; k <= 160; k++) { const x = k / 160; k ? ctx.lineTo(X(x), Y(Eg(x))) : ctx.moveTo(X(x), Y(Eg(x))); } ctx.stroke(); ctx.restore();
      if (L.ghost.label) text(ctx, L.ghost.label, X(L.ghost.at), Y(Eg(L.ghost.at)) + 38, { size: 13, weight: 600, color: C.muted, align: 'center', alpha: L.ghost.alpha });
    }
    const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0.2, cL); g.addColorStop(0.8, cR);
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
    for (let k = 0; k <= 160; k++) { const x = k / 160; k ? ctx.lineTo(X(x), Y(En(x))) : ctx.moveTo(X(x), Y(En(x))); } ctx.stroke(); ctx.restore();
    L.labels.forEach(([x, str, where]) => {
      if (where === 'below') { text(ctx, str, X(x), Y(En(x)) + 22, { size: 15, weight: 600, color: C.inkSoft, align: 'center' }); return; }
      const hot = Math.abs(bxr - x) < 0.07;
      text(ctx, str, X(x), Y(En(x)) - 26, { size: 15, weight: hot ? 800 : 700, color: hot ? C.coral : C.ink, align: 'center' });
    });
    const sl = (Y(En(bxr + 0.002)) - Y(En(bxr - 0.002))) / (X(bxr + 0.002) - X(bxr - 0.002)), n = Math.hypot(1, sl);
    atom(ctx, X(bxr) + 10 * sl / n, Y(En(bxr)) - 10 / n, 9.5, mix(cL, cR, q), al);
  }
  // a kinetics panel: the scene on top, the energy landscape below; one cycle of the process, then it restarts
  function kinPanel(S, o, spec) {
    const ctx = S.ctx, Z = o.zoom || 1, B = { x: 10, y: 10, w: 520, h: 332 };
    let st, clock = 0, lastStep = -1;
    function restart() { clock = 0; st = spec.init(makeRng(o.seed || spec.seed), B); }
    restart();
    function draw() {
      S.clear(); ctx.save(); ctx.scale(Z, Z);
      const c = clock % spec.P, al = c < 0.4 ? E.smooth(c / 0.4) : c > spec.P - 0.5 ? E.smooth((spec.P - c) / 0.5) : 1;
      roundRect(ctx, B.x, B.y, B.w, B.h, 14, '#fff', rgba(C.inkSoft, 0.25), 1.5);
      ctx.save(); ctx.beginPath(); ctx.rect(B.x, B.y, B.w, B.h); ctx.clip(); spec.paint(ctx, st, c, al); stageCaption(ctx, spec.stages, c, al); ctx.restore();
      energyStrip(ctx, spec, c, al);
      ctx.restore();
    }
    return {
      frame(dt) { const before = Math.floor(clock / spec.P); clock += dt; if (Math.floor(clock / spec.P) !== before) { const t = clock; restart(); clock = t; } spec.update(st, clock % spec.P, dt); draw(); },
      draw, enter() { restart(); lastStep = -1; },
      step(k) { if (k === (o.at || 0) && k !== lastStep) restart(); lastStep = k; } // restart when its build comes up
    };
  }
  const rattle = (c, seed) => 0.025 * wiggle(seed, c * 4.5);

  // ------------------------------------------------------------------
  // Kinetics 1/4: Na⁺ and Cl⁻ pairing in water. Each ion wears a shell of water; one water ends up between them, and its
  // leaving is the barrier (ion distance alone is not enough; Geissler, Dellago & Chandler 1999). Schematic.
  // The landscape follows the classic shape along the ion distance: apart, water between, barrier, touching.
  // ------------------------------------------------------------------
  ANIMS.kinIons = function (S, o) {
    const RNA = 16, RCL = 22, CY = 200, CLX = 372, FAR = 236, SSIP = 64, CIP = 40, T1 = 2.5, T2 = 5.5, T3 = 7.2;
    const BACK = [80, 130, 180, 230, 280].map(d => d * Math.PI / 180);
    const dist = c => c < T1 ? FAR : c < T2 ? FAR + (SSIP - FAR) * E.inOut(E.clamp((c - T1) / 2.4)) : c < T3 ? SSIP + (CIP - SSIP) * E.inOut((c - T2) / (T3 - T2)) : CIP;
    function scene(st, c) {
      const d = dist(c), na = { x: CLX - d + 2 * wiggle(1, st.t * 2), y: CY + 2 * wiggle(2, st.t * 2) }, cl = { x: CLX + 1.5 * wiggle(3, st.t * 2), y: CY + 1.5 * wiggle(4, st.t * 2) };
      const shell = [];
      BACK.forEach((th, k) => shell.push({ x: na.x + (RNA + 15) * Math.cos(th) + 1.4 * wiggle(k + 5, st.t * 3), y: na.y + (RNA + 15) * Math.sin(th) + 1.4 * wiggle(k + 9, st.t * 3), a: th }));
      BACK.forEach((th, k) => { const A = Math.PI + th; shell.push({ x: cl.x + (RCL + 15) * Math.cos(A) + 1.4 * wiggle(k + 15, st.t * 3), y: cl.y + (RCL + 15) * Math.sin(A) + 1.4 * wiggle(k + 19, st.t * 3), a: A + Math.PI }); });
      const u = E.smooth(E.clamp((c - T2) / (T3 - T2))), front = na.x + RNA + 15, mid = (na.x + RNA + cl.x - RCL) / 2;
      const bw = { x: (c < T2 ? Math.min(front, mid) : mid) - 12 * u, y: CY - 60 * u - (c > T3 ? 12 * Math.min(2, c - T3) : 0), a: 0 };
      return { na, cl, shell, bw, u };
    }
    return kinPanel(S, o, {
      P: 13, seed: 21,
      stages: [[0, 'Na⁺ and Cl⁻ apart, each wrapped in water'], [T1, 'they meet, but one water sits between them'], [T2, 'that water slips away'], [T3, 'paired: the ions touch']],
      eRange: [-0.6, 1.15], readout: 'chance to pair',
      land: () => ({ title: 'energy as the ions approach', pts: [[0, 0.15], [0.1, 0], [0.24, 0.25], [0.4, -0.3], [0.62, 0.95], [0.84, -0.5], [1, 1.1]],
        labels: [[0.1, 'apart', 'below'], [0.4, 'water between', 'below'], [0.62, 'the water leaves', 'above'], [0.84, 'touching', 'below']] }),
      ball: c => c < T1 ? 0.1 + rattle(c, 7) : c < T2 ? 0.1 + 0.3 * E.inOut(E.clamp((c - T1) / 2.4)) + (c > T1 + 2.4 ? rattle(c, 7) : 0) : c < T3 ? 0.4 + 0.44 * E.smooth((c - T2) / (T3 - T2)) : 0.84 + rattle(c, 7),
      q: c => c < T2 ? 0.02 + 0.13 * E.smooth((c - T1) / 2.4) : c < T3 ? 0.15 + 0.85 * E.smooth((c - T2) / (T3 - T2)) : 1,
      init(rng, B) { const st = { bath: waterBath(rng, B, 34), t: 0 }; for (let k = 0; k < 60; k++) this.update(st, 0, 0); return st; },
      update(st, c, dt) { st.t += dt; const sc = scene(st, c); st.bath.step([{ x: sc.na.x, y: sc.na.y, r: RNA + 22 }, { x: sc.cl.x, y: sc.cl.y, r: RCL + 22 }, { x: sc.bw.x, y: sc.bw.y, r: 12 }]); },
      paint(ctx, st, c, al) {
        const sc = scene(st, c);
        st.bath.draw(ctx, 0.35 * al);
        sc.shell.forEach(w => drawWater(ctx, w.x, w.y, w.a, al, 1.15));
        const hot = c > T1 + 1.6 && c < T3 + 0.6, ha = hot ? E.clamp(Math.min((c - T1 - 1.6) / 0.4, (T3 + 0.6 - c) / 0.4)) : 0;
        drawWater(ctx, sc.bw.x, sc.bw.y, sc.bw.a, al * (c > T3 ? Math.max(0.35, 1 - (c - T3) / 1.2) : 1), 1.15);
        if (ha > 0) { ctx.save(); ctx.globalAlpha *= ha * al; ctx.setLineDash([4, 4]); U.circle(ctx, sc.bw.x + 3, sc.bw.y, 18, null, C.coral, 2.5); ctx.restore(); text(ctx, 'this water', sc.bw.x + 3, sc.bw.y - 25, { size: 15, weight: 700, color: C.coral, align: 'center', alpha: ha * al }); }
        atom(ctx, sc.na.x, sc.na.y, RNA, C.violet, al); text(ctx, '+', sc.na.x, sc.na.y + 6, { size: 18, weight: 800, color: '#fff', align: 'center', alpha: al });
        atom(ctx, sc.cl.x, sc.cl.y, RCL, C.green, al); text(ctx, '−', sc.cl.x, sc.cl.y + 7, { size: 22, weight: 800, color: '#fff', align: 'center', alpha: al });
        text(ctx, 'Na⁺', sc.na.x, sc.na.y + RNA + 44, { size: 16, weight: 750, color: C.violet, align: 'center', alpha: al });
        text(ctx, 'Cl⁻', sc.cl.x, sc.cl.y + RCL + 46, { size: 16, weight: 750, color: '#3E8A3E', align: 'center', alpha: al });
        roundRect(ctx, 262, 314, 262, 22, 11, rgba('#FFFFFF', 0.9)); text(ctx, 'a few of the 256 water molecules shown', 516, 330, { size: 14, color: C.muted, align: 'right' });
      }
    });
  };

  // ------------------------------------------------------------------
  // Kinetics 2/4: five HCN molecules in water become adenine (C5H5N5, = 5 HCN; Oró 1960). Four join first (as in the HCN
  // tetramer route), then the fifth joins and the rings close: two barriers. Each HCN becomes one C–N bond. Schematic.
  // ------------------------------------------------------------------
  ANIMS.kinAdenine = function (S, o) {
    const CC = '#56616D', NC = C.blue, HC = '#CDD4DC', SC = 40, AX = 262, AY = 196, T1 = 2.4, T2 = 5.6, T3 = 8.6, EXP = 1.24;
    const AD = { N1: [-0.866, -0.5], C2: [-0.866, 0.5], N3: [0, 1], C4: [0.866, 0.5], C5: [0.866, -0.5], C6: [0, -1], N7: [1.817, -0.809], C8: [2.405, 0], N9: [1.817, 0.809], N6: [0, -2], H2: [-1.516, 0.875], H8: [3.155, 0], H9: [2.049, 1.522], H6a: [-0.65, -2.375], H6b: [0.65, -2.375] };
    const P = {}; Object.keys(AD).forEach(k => { P[k] = [AX + (AD[k][0] - 0.82) * SC, AY + (AD[k][1] + 0.43) * SC]; });
    const BONDS = [['N1', 'C2', 1], ['C2', 'N3', 2], ['N3', 'C4', 1], ['C4', 'C5', 2], ['C5', 'C6', 1], ['C6', 'N1', 2], ['C5', 'N7', 1], ['N7', 'C8', 2], ['C8', 'N9', 1], ['N9', 'C4', 1], ['C6', 'N6', 1], ['C2', 'H2', 1], ['C8', 'H8', 1], ['N9', 'H9', 1], ['N6', 'H6a', 1], ['N6', 'H6b', 1]];
    const UNITS = [['C2', 'N1', 'H2'], ['C4', 'N3', 'H9'], ['C5', 'N7', 'H6b'], ['C6', 'N6', 'H6a'], ['C8', 'N9', 'H8']]; // C, N, H of each HCN; the last one joins second
    const unitOf = {}; UNITS.forEach((u, k) => u.forEach(a => { unitOf[a] = k; }));
    const START = [[92, 112], [252, 92], [98, 282], [300, 292], [466, 196]];
    const ctr = Object.values(P).reduce((s2, p) => [s2[0] + p[0] / 15, s2[1] + p[1] / 15], [0, 0]);
    const prog = (k, c) => k < 4 ? E.inOut(E.clamp((c - T1) / (T2 - T1 - 0.5))) : E.inOut(E.clamp((c - T2) / (T3 - T2)));
    function atoms(st, c) {
      const pos = {}, w = E.inOut(E.clamp((c - T2) / (T3 - T2)));
      UNITS.forEach(([cK, nK, hK], k) => {
        const fx = START[k][0] + 18 * wiggle(k * 3.1, st.t * 0.9), fy = START[k][1] + 14 * wiggle(k * 3.1 + 7, st.t * 0.9), fa = st.a0[k] + 0.4 * wiggle(k + 11, st.t * 0.7);
        const ux = Math.cos(fa), uy = Math.sin(fa), hcn = { [hK]: [fx - 34 * ux, fy - 34 * uy], [cK]: [fx - 9 * ux, fy - 9 * uy], [nK]: [fx + 17 * ux, fy + 17 * uy] };
        const v = prog(k, c);
        [cK, nK, hK].forEach(a => {
          const fin = P[a], loose = [ctr[0] + (fin[0] - ctr[0]) * EXP, ctr[1] + (fin[1] - ctr[1]) * EXP];
          const tgt = k < 4 ? [loose[0] + (fin[0] - loose[0]) * w, loose[1] + (fin[1] - loose[1]) * w] : fin;
          pos[a] = [hcn[a][0] + (tgt[0] - hcn[a][0]) * v, hcn[a][1] + (tgt[1] - hcn[a][1]) * v];
        });
      });
      return pos;
    }
    return kinPanel(S, o, {
      P: 13.5, seed: 33,
      stages: [[0, 'five HCN molecules in water'], [T1, 'four of them join up first'], [T2, 'the fifth joins, and the rings close'], [T3, 'adenine: the A in DNA and RNA']],
      eRange: [-0.9, 1.15], readout: 'chance to finish',
      land: () => ({ title: 'energy along the reaction', pts: [[0, 0.3], [0.14, -0.1], [0.33, 0.95], [0.5, -0.25], [0.68, 1.1], [0.86, -0.8], [1, 0.2]],
        labels: [[0.14, '5 HCN', 'below'], [0.33, 'joining', 'above'], [0.5, '4 joined', 'below'], [0.68, 'rings close', 'above'], [0.86, 'adenine', 'below']] }),
      ball: c => c < T1 ? 0.14 + rattle(c, 5) : c < T2 ? 0.14 + 0.36 * E.smooth(E.clamp((c - T1) / (T2 - T1 - 0.6))) + (c > T2 - 0.6 ? rattle(c, 5) : 0) : c < T3 ? 0.5 + 0.36 * E.smooth((c - T2) / (T3 - T2)) : 0.86 + rattle(c, 5),
      q: c => c < T1 ? 0.02 : c < T2 ? 0.02 + 0.28 * E.smooth(E.clamp((c - T1) / (T2 - T1 - 0.6))) : c < T3 ? 0.3 + 0.7 * E.smooth((c - T2) / (T3 - T2)) : 1,
      init(rng, B) { const st = { bath: waterBath(rng, B, 26), a0: [0, 1, 2, 3, 4].map(() => rng.u() * 6.283), t: 0 }; for (let k = 0; k < 60; k++) this.update(st, 0, 0); return st; },
      update(st, c, dt) { st.t += dt; const pos = atoms(st, c); st.bath.step(Object.keys(pos).map(a => ({ x: pos[a][0], y: pos[a][1], r: a[0] === 'H' ? 8 : 12 }))); },
      paint(ctx, st, c, al) {
        st.bath.draw(ctx, 0.35 * al);
        const pos = atoms(st, c), jig = (a, p) => c >= T3 ? [p[0] + 1.2 * wiggle(a.length + a.charCodeAt(0), st.t * 3), p[1] + 1.2 * wiggle(a.charCodeAt(1) || 3, st.t * 3)] : p;
        ctx.save(); ctx.lineCap = 'round';
        UNITS.forEach(([cK, nK, hK], k) => { // HCN's own bonds fade as the unit joins: H–C single, C≡N triple
          const fade = 1 - prog(k, c); if (fade <= 0) return;
          const H = pos[hK], Cc = pos[cK], N = pos[nK];
          ctx.globalAlpha = al * fade; ctx.strokeStyle = rgba(CC, 0.75); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(H[0], H[1]); ctx.lineTo(Cc[0], Cc[1]); ctx.stroke();
          const dx = N[0] - Cc[0], dy = N[1] - Cc[1], L = Math.hypot(dx, dy) || 1, px = -dy / L * 4.5, py = dx / L * 4.5;
          for (const sg of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(Cc[0] + sg * px, Cc[1] + sg * py); ctx.lineTo(N[0] + sg * px, N[1] + sg * py); ctx.stroke(); }
        });
        BONDS.forEach(([a, b, order]) => { // adenine's bonds appear as the units join
          const vis = Math.min(prog(unitOf[a], c), prog(unitOf[b], c)); if (vis <= 0) return;
          const p = jig(a, pos[a]), q2 = jig(b, pos[b]); ctx.globalAlpha = al * vis; ctx.strokeStyle = rgba(CC, 0.85); ctx.lineWidth = 3.2;
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke();
          if (order === 2) { const dx = q2[0] - p[0], dy = q2[1] - p[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, ix = ctr[0] - (p[0] + q2[0]) / 2, iy = ctr[1] - (p[1] + q2[1]) / 2, sgn = (-uy * ix + ux * iy) > 0 ? 1 : -1; ctx.beginPath(); ctx.moveTo(p[0] - uy * 7 * sgn + ux * 6, p[1] + ux * 7 * sgn + uy * 6); ctx.lineTo(q2[0] - uy * 7 * sgn - ux * 6, q2[1] + ux * 7 * sgn - uy * 6); ctx.stroke(); }
        });
        ctx.restore();
        Object.keys(pos).forEach(a => { const p = jig(a, pos[a]); atom(ctx, p[0], p[1], a[0] === 'H' ? 7 : 11.5, a[0] === 'C' ? CC : a[0] === 'N' ? NC : HC, al); });
        if (c < T1 + 0.4) UNITS.forEach(u => { const ys = u.map(a => pos[a][1]), xs = u.map(a => pos[a][0]); text(ctx, 'HCN', (Math.min(...xs) + Math.max(...xs)) / 2, Math.min(...ys) - 16, { size: 14, weight: 700, color: C.inkSoft, align: 'center', alpha: al * E.clamp((T1 + 0.4 - c) / 0.4) }); });
        atom(ctx, 30, 320, 8, CC); text(ctx, 'C', 44, 326, { size: 15, color: C.inkSoft });
        atom(ctx, 74, 320, 8, NC); text(ctx, 'N', 88, 326, { size: 15, color: C.inkSoft });
        atom(ctx, 118, 320, 6, HC); text(ctx, 'H', 130, 326, { size: 15, color: C.inkSoft });
      }
    });
  };

  // ------------------------------------------------------------------
  // Kinetics 3/4: a guest enters a host's cavity in water, pushing the cavity water out (the barrier), stays, then leaves.
  // ------------------------------------------------------------------
  ANIMS.kinHost = function (S, o) {
    const HX = 268, HY = 196, HW = 44, HH = 60, HOST = C.navy, OC = C.red;
    const walls = [-1, 1].map(sd => { const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([HX + sd * (HW + 12 * Math.sin(Math.PI * t)), HY - HH + 2 * HH * t]); } return pts; });
    const ports = [[HX - HW + 10, HY - HH - 12], [HX + HW - 10, HY - HH - 12], [HX - HW + 10, HY + HH + 12], [HX + HW - 10, HY + HH + 12]];
    const wallDiscs = []; walls.forEach(w => { for (let k = 0; k < w.length - 1; k++) for (let s2 = 0; s2 < 3; s2++) { const t = s2 / 3; wallDiscs.push({ x: w[k][0] + (w[k + 1][0] - w[k][0]) * t, y: w[k][1] + (w[k + 1][1] - w[k][1]) * t, r: 8 }); } });
    ports.forEach(p => wallDiscs.push({ x: p[0], y: p[1], r: 8 }));
    const CAV = [[HX, HY - 34], [HX, HY], [HX, HY + 34]], OUT = [[HX - 74, HY + HH + 38], [HX + 6, HY + HH + 50], [HX + 80, HY + HH + 34]], GATE = [HX, HY + HH + 18];
    const T1 = 2.5, T2 = 4.8, T3 = 6.8, T4 = 9.4, T5 = 10.8;
    function guest(st, c) {
      const free = [118 + 22 * wiggle(5, st.t * 0.8), 96 + 12 * wiggle(9, st.t * 0.8)], top = [HX, HY - HH - 44], inn = [HX, HY - 8];
      let x, y, a;
      if (c < T1) { [x, y] = free; a = 0.4 * wiggle(2, st.t); }
      else if (c < T2) { const u = E.inOut((c - T1) / (T2 - T1)); x = free[0] + (top[0] - free[0]) * u; y = free[1] + (top[1] - free[1]) * u; a = (1 - u) * 0.4 * wiggle(2, st.t) + u * Math.PI / 2; }
      else if (c < T3) { const u = E.inOut((c - T2) / (T3 - T2)); x = top[0]; y = top[1] + (inn[1] - top[1]) * u; a = Math.PI / 2; }
      else if (c < T4) { x = inn[0] + 1.5 * wiggle(4, st.t * 3); y = inn[1] + 2 * wiggle(6, st.t * 3); a = Math.PI / 2; }
      else if (c < T5) { const u = E.inOut((c - T4) / (T5 - T4)); x = inn[0]; y = inn[1] + (top[1] - inn[1]) * u; a = Math.PI / 2; }
      else { const u = E.inOut(E.clamp((c - T5) / 1.6)); x = top[0] + (420 - top[0]) * u; y = top[1] + (96 - top[1]) * u; a = Math.PI / 2 * (1 - u); }
      const ux = Math.cos(a), uy = Math.sin(a);
      return [{ x: x - 20 * ux, y: y - 20 * uy, r: 10, col: C.blue, plus: true }, { x, y, r: 10, col: '#56616D' }, { x: x + 20 * ux, y: y + 20 * uy, r: 10, col: '#56616D' }];
    }
    function cavWater(k, c) { // cavity water: leaves through the lower opening as the guest comes in, returns after it leaves
      const tOut = 5.0 + 0.4 * (2 - k), tIn = 10.0 + 0.45 * k, lerp = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
      if (c < tOut) return CAV[k];
      if (c < tOut + 0.6) return lerp(CAV[k], GATE, E.inOut((c - tOut) / 0.6));
      if (c < tOut + 1.4) return lerp(GATE, OUT[k], E.inOut((c - tOut - 0.6) / 0.8));
      if (c < tIn) return OUT[k];
      if (c < tIn + 0.6) return lerp(OUT[k], GATE, E.inOut((c - tIn) / 0.6));
      return lerp(GATE, CAV[k], E.inOut(E.clamp((c - tIn - 0.6) / 0.6)));
    }
    return kinPanel(S, o, {
      P: 13.5, seed: 45,
      stages: [[0, 'the guest floats outside; the host holds water'], [T1, 'it reaches the opening'], [T2, 'it squeezes in and pushes the water out'], [T3, 'inside: how long will it stay?'], [T4, 'it leaves again']],
      eRange: [-0.65, 1.05], readout: 'chance to bind',
      land: () => ({ title: 'energy as the guest goes in', pts: [[0, 0.3], [0.2, -0.2], [0.52, 1.0], [0.82, -0.55], [1, 0.7]],
        labels: [[0.2, 'outside', 'below'], [0.52, 'water pushed out', 'above'], [0.82, 'inside', 'below']] }),
      ball: c => c < T2 ? 0.2 + rattle(c, 9) : c < T3 ? 0.2 + 0.62 * E.smooth((c - T2) / (T3 - T2)) : c < T4 ? 0.82 + rattle(c, 9) : c < T5 ? 0.82 - 0.62 * E.smooth((c - T4) / (T5 - T4)) : 0.2 + rattle(c, 9),
      q: c => c < T2 ? 0.03 : c < T3 ? 0.03 + 0.97 * E.smooth((c - T2) / (T3 - T2)) : c < T4 ? 1 : c < T5 ? 1 - E.smooth((c - T4) / (T5 - T4)) : 0.03,
      init(rng, B) { const st = { bath: waterBath(rng, B, 34), t: 0 }; for (let k = 0; k < 60; k++) this.update(st, 0, 0); return st; },
      update(st, c, dt) {
        st.t += dt;
        const cav = [0, 1, 2].map(k => { const p = cavWater(k, c); return { x: p[0], y: p[1], r: 10 }; });
        st.bath.step([...wallDiscs, ...guest(st, c), ...cav]);
        st.bath.W.forEach(w => { if (Math.abs(w.x - HX) < HW - 2 && Math.abs(w.y - HY) < HH + 4) w.y += (w.y < HY ? -1 : 1) * 3; });
      },
      paint(ctx, st, c, al) {
        st.bath.draw(ctx, 0.35 * al);
        ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = rgba(HOST, 0.55); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        walls.forEach(w => { ctx.beginPath(); w.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); });
        ctx.lineWidth = 3; ports.forEach((p, k) => { const w = walls[k % 2], e = k < 2 ? w[0] : w[w.length - 1]; ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); });
        ctx.restore();
        walls.forEach(w => w.forEach(([x, y]) => atom(ctx, x, y, 7.5, HOST, al)));
        ports.forEach(([x, y]) => atom(ctx, x, y, 7, OC, al));
        [0, 1, 2].forEach(k => { const [x, y] = cavWater(k, c), moving = (c > 4.9 && c < 7.6) || (c > 9.9 && c < 12.2); drawWater(ctx, x, y, Math.PI / 2 + 0.3 * wiggle(k, st.t), al, 1.15); if (moving) { ctx.save(); ctx.globalAlpha *= 0.8 * al; ctx.setLineDash([4, 4]); U.circle(ctx, x + 2, y + 3, 17, null, C.coral, 2.2); ctx.restore(); } });
        guest(st, c).forEach(a => { atom(ctx, a.x, a.y, a.r, a.col, al); if (a.plus) text(ctx, '+', a.x, a.y + 5, { size: 14, weight: 800, color: '#fff', align: 'center', alpha: al }); });
        text(ctx, 'host', HX - HW - 48, HY + 6, { size: 17, weight: 750, color: HOST, align: 'right', alpha: al });
        const g = guest(st, c)[1]; if (c < T2 || c > T5 + 0.4) text(ctx, 'guest', g.x, g.y - 28, { size: 17, weight: 750, color: C.blue, align: 'center', alpha: al });
      }
    });
  };

  // ------------------------------------------------------------------
  // Kinetics 4/4: disease from a wrong turn in folding. A protein's working shape is usually its most stable one. Normally
  // the chain folds right; with the cystic fibrosis mutation (one amino acid missing, F508del) the barrier to the working
  // shape is higher, so the chain takes the other path, gets stuck misfolded, and the cell destroys it. Schematic.
  // F508del as a kinetic folding defect: Qu, Strickland & Thomas, J. Biol. Chem. 1997; retained and degraded: Cheng et al., Cell 1990.
  // ------------------------------------------------------------------
  ANIMS.kinMisfold = function (S, o) {
    const N = 22, MISS = 11, R = 7.5, GOOD = C.teal, BAD = '#C8553B', SOFT = '#8FA3BF';
    const T1 = 1.5, T2 = 4.0, T3 = 6.0, T4 = 6.6, T5 = 8.0, T6 = 10.6;
    const FOLD = []; // the working shape: three strands side by side (a small β-sheet) with two turns
    for (let k = 0; k < 7; k++) FOLD.push([212, 116 + 22 * k]);
    FOLD.push([234, 266]);
    for (let j = 0; j < 7; j++) FOLD.push([256, 248 - 22 * j]);
    FOLD.push([278, 98]);
    for (let k = 0; k < 6; k++) FOLD.push([300, 116 + 22 * k]);
    const HB = []; for (let k = 0; k < 7; k++) HB.push([k, 14 - k]); for (let j = 1; j < 7; j++) HB.push([8 + j, 22 - j]); // strand pairs
    const MIS = [[250, 190]]; // misfolded: a compact tangle (seeded walk, each step to the roomiest of several tries)
    { const rng = makeRng(77); while (MIS.length < N) { const [x, y] = MIS[MIS.length - 1]; let best = null, bd = -1; for (let t = 0; t < 80; t++) { const a = rng.u() * 6.283, nx = x + 19 * Math.cos(a), ny = y + 19 * Math.sin(a); if (Math.hypot(nx - 250, ny - 190) > 64) continue; const d = Math.min(...MIS.map(p => Math.hypot(p[0] - nx, p[1] - ny))); if (d > bd) { bd = d; best = [nx, ny]; } } MIS.push(best || [x + 10, y + 10]); } }
    const unf = (k, st) => [72 + k * (380 / (N - 1)), 196 + 26 * Math.sin(k * 0.75 + st.t * 1.3)];
    function chain(st, c) {
      const mut = c >= T3 + 0.3, u = mut ? E.inOut(E.clamp((c - T5) / (T6 - T5))) : E.inOut(E.clamp((c - T1) / (T2 - T1))), tgt = mut ? MIS : FOLD;
      const flop = 9 * (1 - u) + 1.2, brk = mut ? E.smooth(E.clamp((c - T6 - 0.9) / 1.6)) : 0;
      const pos = []; for (let k = 0; k < N; k++) { const a = unf(k, st), b = tgt[k], jx = flop * wiggle(k * 1.7, st.t * 2.6), jy = flop * wiggle(k * 1.7 + 4, st.t * 2.6); const x = a[0] + (b[0] - a[0]) * u + jx, y = a[1] + (b[1] - a[1]) * u + jy; pos.push([x + (x - 250) * 0.5 * brk, y + (y - 190) * 0.5 * brk]); }
      return { pos, mut, u, brk, col: mix(SOFT, mut ? BAD : GOOD, u) };
    }
    const fork = hr => [[0, 0.6], [0.16, -0.35], [0.34, 1.0], [0.5, 0.15], [0.66, hr], [0.84, -0.95], [1, 0.5]];
    return kinPanel(S, o, {
      P: 15, seed: 61, colors: [BAD, GOOD], // left: misfolded, right: the working shape
      stages: [[0, 'a new protein chain, still unfolded'], [T1, 'it folds into its working, most stable shape'], [T4, 'cystic fibrosis: one amino acid is missing'], [T5, 'the barrier is higher, so it goes wrong'], [T6, 'stuck misfolded, the cell destroys it']],
      eRange: [-1.05, 1.45], readout: 'chance to fold right',
      land: c => {
        const mut = c >= T4, hr = mut ? 0.7 + 0.65 * E.smooth((c - T4) / 1.0) : 0.7;
        return { title: mut ? 'the mutation raises the barrier' : 'energy as the protein folds', titleColor: mut ? '#B4492F' : C.ink, pts: fork(hr),
          ghost: mut ? { pts: fork(0.7), at: 0.66, label: '', alpha: E.clamp((c - T4) / 0.6) * (c > 14.5 ? 0 : 1) } : null,
          labels: [[0.16, 'misfolded', 'below'], [0.5, 'unfolded', 'below'], [0.66, 'barrier', 'above'], [0.84, 'working shape, most stable', 'below']] };
      },
      ball: c => c < T1 ? 0.5 + rattle(c, 2) : c < T2 ? 0.5 + 0.34 * E.smooth((c - T1) / (T2 - T1)) : c < T3 ? 0.84 + rattle(c, 2) : c < T4 ? 0.84 - 0.34 * E.inOut((c - T3) / (T4 - T3)) : c < T5 ? 0.5 + rattle(c, 2) : c < T6 ? 0.5 - 0.34 * E.smooth((c - T5) / (T6 - T5)) : 0.16 + rattle(c, 2),
      q: c => c < T1 ? 0.85 : c < T2 ? 0.85 + 0.15 * E.smooth((c - T1) / (T2 - T1)) : c < T3 ? 1 : c < T4 ? 1 - 0.15 * E.inOut((c - T3) / (T4 - T3)) : c < T5 ? 0.85 - 0.73 * E.smooth((c - T4) / 1.0) : c < T6 ? 0.12 * (1 - E.smooth((c - T5) / (T6 - T5))) : 0,
      init() { return { t: 0 }; },
      update(st, c, dt) { st.t += dt; },
      paint(ctx, st, c, al0) {
        const al = c > T3 && c < T4 ? Math.max(E.smooth((T3 + 0.3 - c) / 0.3), E.smooth((c - T3 - 0.3) / 0.3)) * al0 : al0;
        const ch = chain(st, c), P = ch.pos, ba = al * (1 - ch.brk);
        // backbone: the chain's bonds (for the mutant, the gap at the missing piece is bridged by a thin dashed line)
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(ch.col, 0.75); ctx.lineWidth = 5; ctx.globalAlpha = ba;
        for (let k = 0; k + 1 < N; k++) { if (ch.mut && (k === MISS - 1 || k === MISS)) continue; ctx.beginPath(); ctx.moveTo(P[k][0], P[k][1]); ctx.lineTo(P[k + 1][0], P[k + 1][1]); ctx.stroke(); }
        if (ch.mut) { ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.strokeStyle = rgba(BAD, 0.8); ctx.beginPath(); ctx.moveTo(P[MISS - 1][0], P[MISS - 1][1]); ctx.lineTo(P[MISS + 1][0], P[MISS + 1][1]); ctx.stroke(); }
        ctx.restore();
        if (!ch.mut && ch.u > 0.8) { ctx.save(); ctx.globalAlpha = al * (ch.u - 0.8) / 0.2; ctx.setLineDash([3, 4]); ctx.strokeStyle = rgba(GOOD, 0.7); ctx.lineWidth = 1.8; HB.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke(); }); ctx.restore(); }
        P.forEach(([x, y], k) => {
          if (ch.mut && k === MISS) { ctx.save(); ctx.globalAlpha *= ba; ctx.setLineDash([3, 3]); U.circle(ctx, x, y, R, null, C.red, 2.2); ctx.restore(); return; }
          atom(ctx, x, y, R, ch.col, al * (ch.mut ? 1 - 0.85 * ch.brk : 1));
        });
        if (ch.mut && c < T5 + 0.6) { const [x, y] = P[MISS]; text(ctx, 'missing', x, y - 18, { size: 15, weight: 750, color: C.red, align: 'center', alpha: al * E.clamp((T5 + 0.6 - c) / 0.4) }); }
        if (!ch.mut && c > T2 - 0.3) text(ctx, 'working shape', 256, 306, { size: 16, weight: 750, color: C.tealDark, align: 'center', alpha: al * E.clamp((c - T2 + 0.3) / 0.4) });
        if (ch.mut && c > T6 - 0.3) text(ctx, c < T6 + 0.9 ? 'misfolded' : 'destroyed by the cell', 250, 300, { size: 16, weight: 750, color: BAD, align: 'center', alpha: al * E.clamp((c - T6 + 0.3) / 0.4) });
      }
    });
  };
})();
