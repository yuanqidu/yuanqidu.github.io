/* OMNIA teaser (technical deck): grand-canonical (μVT) sampling, where atoms come and go.
   omniaGcSurface: hydrogen on and beneath Pd(111) in a reservoir at μ_H, with the adsorption isotherm.
   omniaGcBattery: sodium bound to amorphous (hard) carbon in a sodium reservoir, across carbon densities.
   Both show equilibrium samples (states, not a process): between samples atoms fade in and out, nothing travels.
   The curves are results of the OMNIA manuscript, read from the vector graphics of its Fig. 4b and of its
   hard-carbon figure, panel b (draft of November 2026): update the arrays below if those figures change.
   The atoms are schematic: their numbers follow the curves, their positions are illustrative. */
(function () {
  'use strict';
  const { C, rgba, mix, E, atom, roundRect, text, richText, makeRng, wiggle } = U;
  const OM = C.teal;
  // static captures (?export) fast-forward each build by `ff`: start every build from the beginning of the cycle
  const STATIC = () => document.body.classList.contains('export');
  const num = (v, d) => (v < -0.5 * Math.pow(10, -d) ? '−' : '') + Math.abs(v).toFixed(d); // typographic minus
  function seg(ctx, x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  function width(ctx, str, size, weight) { ctx.save(); ctx.font = U.font(size, weight || 500); const w = ctx.measureText(str).width; ctx.restore(); return w; }
  // a new equilibrium sample with n occupied sites: switch as few sites as needed, and let one atom sit elsewhere
  function retarget(rng, list, n) {
    const on = list.filter(s => s.on), off = list.filter(s => !s.on);
    const pick = (arr) => { let tot = 0; arr.forEach(s => { tot += s.w || 1; }); let u = rng.u() * tot; for (const s of arr) { u -= s.w || 1; if (u <= 0) return s; } return arr[arr.length - 1]; };
    while (on.length < n && off.length) { const s = pick(off); s.on = true; off.splice(off.indexOf(s), 1); on.push(s); }
    while (on.length > n) { const s = on[rng.int(on.length)]; s.on = false; on.splice(on.indexOf(s), 1); off.push(s); }
    if (on.length && off.length && rng.u() < 0.7) { on[rng.int(on.length)].on = false; pick(off).on = true; }
  }
  function fade(list, dt) { const k = dt / 0.22; list.forEach(s => { s.a = s.on ? Math.min(1, s.a + k) : Math.max(0, s.a - k); }); }

  // ------------------------------------------------------------------
  // H on Pd(111) at 600 K. OMNIA isotherm [Δμ_H in eV, measured from ½ H₂; ⟨θ_H⟩ in monolayers] and the reference
  // grand-canonical Monte Carlo points (manuscript Fig. 4b). One monolayer = 16 H on the 4×4 surface cell.
  // ------------------------------------------------------------------
  const ISO = [[-0.7, 0.009], [-0.6579, 0.0183], [-0.6228, 0.031], [-0.59, 0.0478], [-0.5619, 0.0673], [-0.5408, 0.0869], [-0.5244, 0.1071], [-0.5104, 0.1294], [-0.4963, 0.1578], [-0.4846, 0.187], [-0.4729, 0.2219], [-0.4589, 0.2705], [-0.4238, 0.3969], [-0.4097, 0.4381], [-0.3933, 0.4794], [-0.3723, 0.5262], [-0.3395, 0.5919], [-0.2856, 0.6952], [-0.2646, 0.7284], [-0.2365, 0.7663], [-0.206, 0.8081], [-0.1897, 0.8353], [-0.1733, 0.8686], [-0.1545, 0.9136], [-0.1288, 0.9759], [-0.1124, 1.0095], [-0.0913, 1.0464], [-0.0515, 1.1138], [-0.0445, 1.1314], [-0.0398, 1.1474], [-0.0351, 1.1693], [-0.0305, 1.2002], [-0.0258, 1.2432], [-0.0211, 1.2996], [-0.007, 1.4912], [-0.0024, 1.5358], [0, 1.5528]];
  const ISO_REF = [[-0.533, 0.114], [-0.4, 0.459], [-0.267, 0.728], [-0.2, 0.863], [-0.133, 1.002], [-0.067, 1.239], [0, 1.676]];
  function thetaAt(mu) {
    if (mu <= ISO[0][0]) return ISO[0][1];
    for (let i = 1; i < ISO.length; i++) if (mu <= ISO[i][0]) { const [x0, y0] = ISO[i - 1], [x1, y1] = ISO[i]; return y0 + (y1 - y0) * (mu - x0) / (x1 - x0); }
    return ISO[ISO.length - 1][1];
  }

  ANIMS.omniaGcSurface = function (S, o) {
    const ctx = S.ctx, PLOT = o.plotStep === undefined ? 3 : o.plotStep;
    const HS = C.orange, HSD = '#B26A12', HB = C.blue, PD = '#9AA5B1';
    const NS = 16, A = 52, R = 23.5, RH = 10.5, DY = 46, NLAY = 4, SLAB_H = (NLAY - 1) * DY + 2 * R + 4;
    const X0 = (S.w - NS * A) / 2, XW = NS * A;
    const MU0 = -0.7, MU1 = 0, AX0 = -0.74, AX1 = 0.03;            // range of the sweep and of the axis
    const PXL = 118, PXR = S.w - 34, px = (mu) => PXL + (mu - AX0) / (AX1 - AX0) * (PXR - PXL);
    const SCENE_H = 350, TOP0 = Math.round((S.h - SCENE_H - 100) / 2), AXY1 = S.h - 62, PTOP = SCENE_H + 30, TH_MAX = 1.9;
    const py = (th) => AXY1 - th / TH_MAX * (AXY1 - PTOP);
    const T_LOW = 0.8, T_UP = 7.5, T_HOLD = 3.0, T_DOWN = 2.7, P = T_LOW + T_UP + T_HOLD + T_DOWN, DTS = 0.4;
    let rng, clock = 0, step = 0, tr = 0, fresh = true, traced = MU0, nextS = 0, mu = MU0, surf = [], sub = [];
    let slab = null, slabK = 0;
    function reset() {
      rng = makeRng(o.seed || 5); clock = 0; nextS = 0; mu = MU0; surf = []; sub = [];
      for (let i = 0; i < NS; i++) surf.push({ x: X0 + (i + 0.5) * A, on: false, a: 0, seed: rng.u() * 100 });            // hollows of the top layer
      for (let i = 0; i < NS; i++) sub.push({ x: X0 + (i + 2 / 3) * A, g: 0, on: false, a: 0, seed: rng.u() * 100, w: 1 }); // first interlayer gap
      for (let i = 1; i < NS; i++) sub.push({ x: X0 + i * A, g: 1, on: false, a: 0, seed: rng.u() * 100, w: 0.4 });         // second gap
    }
    reset();
    function muOf(c) {
      c = c % P;
      if (c < T_LOW) return MU0;
      if (c < T_LOW + T_UP) return MU0 + (MU1 - MU0) * (c - T_LOW) / T_UP;
      if (c < T_LOW + T_UP + T_HOLD) return MU1;
      return MU1 + (MU0 - MU1) * E.inOut((c - T_LOW - T_UP - T_HOLD) / T_DOWN);
    }
    function sample() { // the number of H atoms fluctuates about the isotherm; the surface fills first, then the sites beneath it
      const m = NS * thetaAt(mu), sd = Math.min(1.3, 0.35 + 0.45 * Math.sqrt(m));
      const n = Math.max(0, Math.min(NS + 14, Math.round(m + sd * rng.normal()))), ns = Math.min(n, NS);
      retarget(rng, surf, ns); retarget(rng, sub, n - ns);
    }
    function slabLayer() { // the Pd atoms are held fixed: drawn once per canvas resolution
      if (slab && slabK === S.k) return slab;
      slab = document.createElement('canvas'); slabK = S.k; slab.width = Math.ceil(XW * S.k); slab.height = Math.ceil(SLAB_H * S.k);
      const c = slab.getContext('2d'); c.setTransform(S.k, 0, 0, S.k, 0, 0);
      for (let l = NLAY - 1; l >= 0; l--) for (let i = -1; i <= NS; i++) atom(c, (i + (l % 3) / 3) * A, R + 2 + l * DY, R, PD);
      return slab;
    }
    function draw() {
      S.clear();
      const m = E.inOut(E.clamp(tr / 0.6)), e = E.smooth(E.clamp((tr - 0.55) / 0.45)); // the scene moves up, then the plot fades in
      const sy = TOP0 * (1 - m), axY = (TOP0 + SCENE_H + 44) * (1 - m) + AXY1 * m, y0 = sy + 139;
      // ---- the surface in its reservoir ----
      text(ctx, 'Pd(111) in a hydrogen reservoir', X0, sy + 24, { size: 23, weight: 650, color: C.navy });
      text(ctx, '600 K', X0 + XW, sy + 24, { size: 20, color: C.inkSoft, align: 'right' });
      roundRect(ctx, X0, sy + 38, XW, 56, 12, rgba(HB, 0.07));
      richText(ctx, [['reservoir at fixed ', 'n'], ['μ', 'i'], ['H', 'sub']], X0 + 18, sy + 73, { size: 20, color: C.inkSoft });
      richText(ctx, [['Δ', 'n'], ['μ', 'i'], ['H', 'sub'], [' = ' + num(mu, 2) + ' eV', 'n']], X0 + XW - 18, sy + 74, { size: 22, weight: 700, color: C.navy, align: 'right' });
      ctx.drawImage(slabLayer(), X0, y0 - R - 2, XW, SLAB_H);
      const jig = (s, k) => 1.2 * wiggle(s.seed + k, clock * 4);
      sub.forEach(s => { if (s.a > 0.01) atom(ctx, s.x + jig(s, 0), y0 + (s.g + 0.5) * DY + jig(s, 3), RH * (0.55 + 0.45 * s.a), HB, s.a); });
      surf.forEach(s => { if (s.a > 0.01) atom(ctx, s.x + jig(s, 0), y0 - 21 + jig(s, 3), RH * (0.55 + 0.45 * s.a), HS, s.a); });
      // counts of the current sample
      const ns = surf.filter(s => s.on).length, nb = sub.filter(s => s.on).length, ry = sy + 336;
      let x = X0 + 10; atom(ctx, x, ry - 7, 8, HS); x += 16;
      text(ctx, 'on the surface', x, ry, { size: 20, color: C.inkSoft }); x += width(ctx, 'on the surface', 20) + 10;
      text(ctx, String(ns), x, ry, { size: 23, weight: 750, color: HSD }); x = X0 + 270;
      atom(ctx, x, ry - 7, 8, HB); x += 16;
      text(ctx, 'beneath it', x, ry, { size: 20, color: C.inkSoft }); x += width(ctx, 'beneath it', 20) + 10;
      text(ctx, String(nb), x, ry, { size: 23, weight: 750, color: C.navy });
      richText(ctx, [['N', 'i'], ['H', 'sub'], [' = ' + (ns + nb), 'n']], X0 + XW, ry, { size: 23, weight: 700, color: C.ink, align: 'right' });

      // ---- Δμ axis: a slider at first, then the x axis of the isotherm ----
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(C.inkSoft, 0.55); ctx.lineWidth = 2; seg(ctx, PXL, axY, PXR, axY);
      [-0.6, -0.4, -0.2, 0].forEach(v => { seg(ctx, px(v), axY, px(v), axY + 7); text(ctx, num(v, 1), px(v), axY + 30, { size: 19, color: C.inkSoft, align: 'center' }); });
      if (e < 0.99) { ctx.globalAlpha = 1 - e; ctx.strokeStyle = C.navy; ctx.lineWidth = 5; seg(ctx, PXL, axY, px(mu), axY); ctx.globalAlpha = 1; }
      ctx.restore();
      richText(ctx, [['Δ', 'n'], ['μ', 'i'], ['H', 'sub'], [' (eV), measured from ½ H₂', 'n']], (PXL + PXR) / 2, axY + 56, { size: 19, color: C.inkSoft, align: 'center' });

      // ---- the isotherm ----
      if (e > 0.01) {
        ctx.save(); ctx.globalAlpha = e; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.fillStyle = rgba(HB, 0.08); ctx.fillRect(PXL, py(TH_MAX), PXR - PXL, py(1) - py(TH_MAX));
        ctx.save(); ctx.setLineDash([3, 6]); ctx.strokeStyle = rgba(C.inkSoft, 0.7); ctx.lineWidth = 1.6; seg(ctx, PXL, py(1), PXR, py(1)); ctx.restore();
        ctx.strokeStyle = rgba(C.inkSoft, 0.55); ctx.lineWidth = 2; seg(ctx, PXL, py(TH_MAX), PXL, axY);
        [0, 0.5, 1, 1.5].forEach(v => { seg(ctx, PXL - 7, py(v), PXL, py(v)); text(ctx, v.toFixed(1), PXL - 14, py(v) + 7, { size: 19, color: C.inkSoft, align: 'right' }); });
        ctx.save(); ctx.translate(PXL - 76, (py(TH_MAX) + axY) / 2); ctx.rotate(-Math.PI / 2);
        richText(ctx, [['⟨', 'n'], ['θ', 'i'], ['H', 'sub'], ['⟩  (monolayers)', 'n']], 0, 0, { size: 19, color: C.inkSoft, align: 'center', alpha: e }); ctx.restore();
        text(ctx, 'surface full: H beneath it', PXL + 16, py(TH_MAX) + 28, { size: 19, weight: 650, color: C.navy });
        text(ctx, 'H on the surface', px(-0.05), py(0) - 16, { size: 19, weight: 650, color: HSD, align: 'right' });
        // legend
        const lx = PXL + 18, ly = py(0.78);
        ctx.strokeStyle = OM; ctx.lineWidth = 4.5; seg(ctx, lx, ly - 6, lx + 34, ly - 6);
        text(ctx, 'OMNIA', lx + 46, ly, { size: 19, weight: 650, color: C.tealDark });
        U.circle(ctx, lx + 17, ly + 24, 6.5, '#fff', C.ink, 2.4);
        text(ctx, 'reference GCMC', lx + 46, ly + 31, { size: 19, color: C.ink });
        // OMNIA isotherm, traced up to the largest chemical potential reached so far
        ctx.beginPath(); ctx.moveTo(px(ISO[0][0]), py(ISO[0][1]));
        for (let i = 1; i < ISO.length && ISO[i][0] <= traced; i++) ctx.lineTo(px(ISO[i][0]), py(ISO[i][1]));
        ctx.lineTo(px(traced), py(thetaAt(traced)));
        ctx.strokeStyle = OM; ctx.lineWidth = 4.5; ctx.stroke();
        ISO_REF.forEach(([m, th]) => { if (m <= traced + 1e-6) U.circle(ctx, px(m), py(th), 6.5, '#fff', C.ink, 2.4); });
        // where the sample on show sits
        const cy = py(thetaAt(mu));
        ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = rgba(C.navy, 0.55); ctx.lineWidth = 2; seg(ctx, px(mu), axY, px(mu), cy); ctx.restore();
        U.circle(ctx, px(mu), cy, 8, OM, '#fff', 3);
        ctx.restore();
      }
      U.circle(ctx, px(mu), axY, 10, '#fff', C.navy, 4);
    }
    return {
      frame(dt) {
        clock += dt; mu = muOf(clock);
        if (clock >= nextS) { sample(); nextS = clock + DTS; }
        fade(surf, dt); fade(sub, dt);
        tr = step >= PLOT ? Math.min(1, tr + dt / 0.9) : Math.max(0, tr - dt / 0.9);
        if (step >= PLOT) traced = Math.max(traced, mu);
        draw();
      },
      draw, enter() { reset(); fresh = true; },
      step(k) {
        if (fresh) { tr = k >= PLOT ? 1 : 0; traced = k >= PLOT ? MU1 : MU0; fresh = false; }
        else if (k >= PLOT && step < PLOT) { clock = 0; nextS = 0; traced = MU0; } // trace the isotherm from its low end
        else if (k !== step && STATIC()) { clock = 0; nextS = 0; }
        step = k;
      },
      ff: T_LOW + T_UP + 1.0 // static captures: the largest chemical potential
    };
  };

  // ------------------------------------------------------------------
  // Na bound to amorphous carbon at μ = −1.24 eV (equilibrium with metallic sodium) and 300 K, against the carbon density:
  // mean number of bound Na per 17.08 Å cell and its standard error over frameworks, OMNIA and reference GCMC
  // (manuscript, hard-carbon figure, panel b). Carbon webs: js/data/acarbon.js (schematic pieces, about half a cell each).
  // ------------------------------------------------------------------
  const NA_RHO = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
  const NA_OMNIA = [[39.0, 1.0], [40.6, 1.04], [42.0, 0.98], [44.7, 0.92], [40.1, 1.52], [32.8, 0.72]];
  const NA_GCMC = [[40.9, 0.65], [42.2, 0.58], [42.0, 0.6], [44.0, 0.83], [39.5, 1.32], [33.2, 0.76]];

  ANIMS.omniaGcBattery = function (S, o) {
    const ctx = S.ctx, PLOT = o.plotStep === undefined ? 3 : o.plotStep, webs = window.ACARBON || [];
    const CC = '#56616D', NAC = C.gold, NAD = '#A87A0E';
    if (webs.length < 3) { const d = () => { S.clear(); text(ctx, 'js/data/acarbon.js is not loaded', 20, 40, { size: 20, color: C.coral }); }; return { draw: d, frame: d }; }
    // the three webs, from the most open to the densest, with the carbon density each one stands for (index into NA_RHO)
    const SHOWN = [{ web: webs[2], k: 0 }, { web: webs[1], k: 2 }, { web: webs[0], k: 5 }];
    const CARD = 430, CY0 = 92, CX_MID = (S.w - CARD) / 2, CX_LEFT = 20;
    const SC = 27, CAM = 34, TILT = 0.35, SPIN = 0.3, RS = 5.4, DMIN = 1.4, DMAX = 2.2, GAP = 2.0, HALF = 0.45;
    const SHOW = 4.6, FADE = 0.35, PER = SHOWN.length * SHOW, DTS = 0.55;
    const PL = 548, PR = S.w - 22, PT = 128, PB = 486, N0 = 30, N1 = 50, R0 = 0.93, R1 = 2.07;
    const qx = (r) => PL + (r - R0) / (R1 - R0) * (PR - PL), qy = (n) => PB - (n - N0) / (N1 - N0) * (PB - PT);
    const FOG = []; for (let i = 0; i < 12; i++) FOG.push([mix(CC, '#FFFFFF', 0.55 * i / 11), mix(CC, '#FFFFFF', 0.08 + 0.55 * i / 11), mix(NAC, '#FFFFFF', 0.33 * i / 11)]);
    // places where a Na atom is bound: 1.4 to 2.2 bond lengths (about 2 to 3 Å) from the nearest carbon, at least 2 apart
    function naSites(web, seed) {
      const r = makeRng(seed), G = 2.3, grid = [], cell = (v) => Math.floor(v / G) + 8;
      web.a.forEach(p => { const k = cell(p[0]) + 16 * cell(p[1]) + 256 * cell(p[2]); (grid[k] || (grid[k] = [])).push(p); });
      const near = (x, y, z) => {
        let d2 = 1e9; const i0 = cell(x), j0 = cell(y), k0 = cell(z);
        for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) for (let k = k0 - 1; k <= k0 + 1; k++) {
          const c = grid[i + 16 * j + 256 * k]; if (!c) continue;
          for (const q of c) { const v = (q[0] - x) ** 2 + (q[1] - y) ** 2 + (q[2] - z) ** 2; if (v < d2) d2 = v; }
        }
        return Math.sqrt(d2);
      };
      const cand = [];
      for (let x = -RS; x <= RS; x += 0.4) for (let y = -RS; y <= RS; y += 0.4) for (let z = -RS; z <= RS; z += 0.4) {
        if (x * x + y * y + z * z > RS * RS) continue;
        const d = near(x, y, z); if (d >= DMIN && d <= DMAX) cand.push([x, y, z]);
      }
      r.shuffle(cand);
      const sites = [];
      for (const p of cand) {
        if (sites.length >= 40) break;
        if (!sites.some(s => Math.hypot(s.p[0] - p[0], s.p[1] - p[1], s.p[2] - p[2]) < GAP)) sites.push({ p, on: false, a: 0 });
      }
      return sites;
    }
    SHOWN.forEach((q, i) => {
      q.sites = naSites(q.web, 31 + i);
      q.mean = Math.min(q.sites.length - 2, HALF * NA_OMNIA[q.k][0]); // the piece is about half a cell
      const nA = q.web.a.length, nB = q.web.b.length, nS = q.sites.length;
      q.pa = new Float32Array(4 * nA); q.pn = new Float32Array(4 * nS); q.db = new Float32Array(nB);
      q.order = []; for (let j = 0; j < nA; j++) q.order.push(j); for (let j = 0; j < nB; j++) q.order.push(10000 + j); for (let j = 0; j < nS; j++) q.order.push(20000 + j);
    });
    let rng, clock = 0, step = 0, tr = 0, tPlot = 0, fresh = true, nextS = 0;
    function reset() {
      rng = makeRng(o.seed || 17); clock = 0; nextS = DTS;
      SHOWN.forEach(q => { q.sites.forEach(s => { s.on = false; s.a = 0; }); retarget(rng, q.sites, Math.round(q.mean)); q.sites.forEach(s => { s.a = s.on ? 1 : 0; }); });
    }
    reset();
    function drawWeb(q, tw, cx, cy, al) { // turn about the vertical axis, look down at TILT, perspective; far atoms fade towards white
      const th = 0.6 + SPIN * tw, cs = Math.cos(th), sn = Math.sin(th), ct = Math.cos(TILT), st = Math.sin(TILT);
      const put = (p, out, j) => { const x1 = p[0] * cs - p[1] * sn, y1 = p[0] * sn + p[1] * cs, d = CAM + y1 * ct - p[2] * st, s = SC * CAM / d; out[4 * j] = cx + x1 * s; out[4 * j + 1] = cy - (y1 * st + p[2] * ct) * s; out[4 * j + 2] = d; out[4 * j + 3] = s; };
      const A = q.web.a, B = q.web.b, pa = q.pa, pn = q.pn, db = q.db;
      let dn = Infinity, df = -Infinity;
      for (let j = 0; j < A.length; j++) { put(A[j], pa, j); const d = pa[4 * j + 2]; if (d < dn) dn = d; if (d > df) df = d; }
      for (let j = 0; j < B.length; j++) db[j] = (pa[4 * B[j][0] + 2] + pa[4 * B[j][1] + 2]) / 2 + 0.05;
      for (let j = 0; j < q.sites.length; j++) put(q.sites[j].p, pn, j);
      const depth = (id) => id < 10000 ? pa[4 * id + 2] : id < 20000 ? db[id - 10000] : pn[4 * (id - 20000) + 2];
      q.order.sort((a, b) => depth(b) - depth(a)); // far first; nearly sorted from the last frame
      const fog = (d) => Math.max(0, Math.min(11, Math.round(11 * (d - dn) / (df - dn))));
      ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'round';
      for (const id of q.order) {
        if (id < 10000) { ctx.beginPath(); ctx.arc(pa[4 * id], pa[4 * id + 1], 0.18 * pa[4 * id + 3], 0, 6.2832); ctx.fillStyle = FOG[fog(pa[4 * id + 2])][0]; ctx.fill(); }
        else if (id < 20000) {
          const i = B[id - 10000][0], j = B[id - 10000][1];
          ctx.strokeStyle = FOG[fog(db[id - 10000])][1]; ctx.lineWidth = 0.075 * (pa[4 * i + 3] + pa[4 * j + 3]);
          ctx.beginPath(); ctx.moveTo(pa[4 * i], pa[4 * i + 1]); ctx.lineTo(pa[4 * j], pa[4 * j + 1]); ctx.stroke();
        } else { const j = id - 20000, s = q.sites[j]; if (s.a > 0.01) atom(ctx, pn[4 * j], pn[4 * j + 1], 0.68 * pn[4 * j + 3] * (0.55 + 0.45 * s.a), FOG[fog(pn[4 * j + 2])][2], s.a); }
      }
      ctx.restore();
    }
    function series(data, nShow, col, solid) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); for (let i = 0; i < nShow; i++) { const x = qx(NA_RHO[i]), y = qy(data[i][0]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.strokeStyle = col; ctx.lineWidth = solid ? 4 : 2.2; if (!solid) ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < nShow; i++) {
        const x = qx(NA_RHO[i]), y = qy(data[i][0]), h = qy(data[i][0] - data[i][1]) - y;
        ctx.strokeStyle = col; ctx.lineWidth = solid ? 2.4 : 1.8; seg(ctx, x, y - h, x, y + h); seg(ctx, x - 5, y - h, x + 5, y - h); seg(ctx, x - 5, y + h, x + 5, y + h);
        if (solid) U.circle(ctx, x, y, 7.5, col, '#fff', 2); else U.circle(ctx, x, y, 6.5, '#fff', col, 2.4);
      }
      ctx.restore();
    }
    function draw() {
      S.clear();
      const m = E.inOut(E.clamp(tr / 0.6)), e = E.smooth(E.clamp((tr - 0.55) / 0.45)); // the card moves aside, then the plot fades in
      const cx = CX_MID + (CX_LEFT - CX_MID) * m, mid = cx + CARD / 2;
      const c = clock % PER, cur = Math.min(SHOWN.length - 1, Math.floor(c / SHOW)), q = SHOWN[cur];
      const al = E.clamp((c - cur * SHOW) / FADE) * E.clamp(((cur + 1) * SHOW - c) / FADE);
      // ---- the carbon on show, with the Na bound to it ----
      text(ctx, 'Hard carbon in a sodium reservoir', mid, 26, { size: 23, weight: 650, color: C.navy, align: 'center' });
      richText(ctx, [['fixed ', 'n'], ['μ', 'i'], ['Na', 'sub'], [' = −1.24 eV (metallic sodium), 300 K', 'n']], mid, 60, { size: 20, color: C.inkSoft, align: 'center' });
      roundRect(ctx, cx, CY0, CARD, CARD, 14, '#fff', rgba(C.inkSoft, 0.25), 1.5);
      ctx.save(); ctx.beginPath(); ctx.rect(cx, CY0, CARD, CARD); ctx.clip();
      drawWeb(q, c - cur * SHOW, mid, CY0 + CARD / 2 + 8, al);
      ctx.restore();
      atom(ctx, cx + 10, CY0 + CARD + 26, 5.5, CC, 1, false); text(ctx, 'carbon', cx + 24, CY0 + CARD + 33, { size: 19, color: C.inkSoft });
      atom(ctx, cx + 118, CY0 + CARD + 26, 9, NAC); text(ctx, 'Na bound to the carbon', cx + 134, CY0 + CARD + 33, { size: 19, color: C.inkSoft });
      // which carbon: three densities in turn
      const ty = CY0 + CARD + 58, tw = 96, tg = 10, t0 = mid - (3 * tw + 2 * tg) / 2 - 38;
      SHOWN.forEach((s, i) => {
        const on = i === cur, x = t0 + i * (tw + tg);
        roundRect(ctx, x, ty, tw, 38, 19, on ? NAC : '#ECEEF1');
        text(ctx, NA_RHO[s.k].toFixed(1), x + tw / 2, ty + 26, { size: 20, weight: on ? 750 : 600, color: on ? '#fff' : C.inkSoft, align: 'center' });
      });
      text(ctx, 'g/cm³', t0 + 3 * tw + 2 * tg + 12, ty + 26, { size: 19, color: C.inkSoft });

      // ---- bound Na against the carbon density ----
      if (e > 0.01) {
        ctx.save(); ctx.globalAlpha = e;
        text(ctx, 'Na bound to the carbon, per cell', (PL + PR) / 2, PT - 26, { size: 20, weight: 650, color: C.ink, align: 'center' });
        const nShow = Math.max(0, Math.min(NA_RHO.length, Math.floor(tPlot / 0.22)));
        const hx = qx(NA_RHO[q.k]);
        if (nShow > q.k) { ctx.fillStyle = rgba(NAC, 0.16 * al); ctx.fillRect(hx - 17, PT, 34, PB - PT); }
        ctx.strokeStyle = rgba(C.inkSoft, 0.55); ctx.lineWidth = 2; ctx.lineCap = 'round';
        seg(ctx, PL, PT, PL, PB); seg(ctx, PL, PB, PR, PB);
        [30, 35, 40, 45, 50].forEach(v => { seg(ctx, PL - 7, qy(v), PL, qy(v)); text(ctx, String(v), PL - 14, qy(v) + 7, { size: 19, color: C.inkSoft, align: 'right' }); });
        NA_RHO.forEach(r => seg(ctx, qx(r), PB, qx(r), PB + 4));
        [1.0, 1.5, 2.0].forEach(r => { seg(ctx, qx(r), PB, qx(r), PB + 7); text(ctx, r.toFixed(1), qx(r), PB + 30, { size: 19, color: C.inkSoft, align: 'center' }); });
        text(ctx, 'carbon density (g/cm³)', (PL + PR) / 2, PB + 60, { size: 19, color: C.inkSoft, align: 'center' });
        series(NA_GCMC, nShow, rgba(C.ink, 0.75), false);
        series(NA_OMNIA, nShow, OM, true);
        if (nShow > q.k) {
          const y = qy(NA_OMNIA[q.k][0]);
          ctx.save(); ctx.globalAlpha = e * al; U.circle(ctx, hx, y, 14, null, NAD, 3);
          text(ctx, NA_OMNIA[q.k][0].toFixed(1), hx + (q.k === 5 ? -20 : 20), y + 32, { size: 21, weight: 750, color: NAD, align: q.k === 5 ? 'right' : 'left' }); ctx.restore();
        }
        const lx = PL + 18, ly = PT + 24;
        U.circle(ctx, lx + 8, ly - 7, 7.5, OM, '#fff', 2); text(ctx, 'OMNIA', lx + 26, ly, { size: 19, weight: 650, color: C.tealDark });
        U.circle(ctx, lx + 8, ly + 21, 6.5, '#fff', rgba(C.ink, 0.75), 2.4); text(ctx, 'reference GCMC', lx + 26, ly + 28, { size: 19, color: C.ink });
        ctx.restore();
      }
    }
    return {
      frame(dt) {
        clock += dt;
        const q = SHOWN[Math.min(SHOWN.length - 1, Math.floor((clock % PER) / SHOW))];
        if (clock >= nextS) { // a new equilibrium sample of the carbon on show: the number of Na fluctuates
          retarget(rng, q.sites, Math.max(2, Math.min(q.sites.length, Math.round(q.mean + 1.3 * rng.normal())))); nextS = clock + DTS;
        }
        fade(q.sites, dt);
        tr = step >= PLOT ? Math.min(1, tr + dt / 0.9) : Math.max(0, tr - dt / 0.9);
        if (step >= PLOT && tr > 0.6) tPlot += dt;
        draw();
      },
      draw, enter() { reset(); fresh = true; },
      step(k) {
        if (fresh) { tr = k >= PLOT ? 1 : 0; tPlot = k >= PLOT ? 99 : 0; fresh = false; }
        else if (k >= PLOT && step < PLOT) tPlot = 0; // the points appear from low to high density
        if (k !== step && STATIC()) { clock = 0; nextS = DTS; }
        step = k;
      },
      ff: SHOW + 2.2 // static captures: the second carbon, 1.4 g/cm³
    };
  };

  // ------------------------------------------------------------------
  // Future-work slide: a catalytic surface in equilibrium with hydrogen gas above it (schematic, no data).
  // The gas is drawn as H2 molecules; molecules reach the surface and their atoms adsorb, adsorbed atoms pair up and leave
  // again, so the number of atoms on the surface fluctuates. A higher chemical potential means a denser gas and more
  // adsorbed atoms. Nothing here is a result: the numbers of molecules and atoms are chosen for the picture.
  // ------------------------------------------------------------------
  ANIMS.omniaGasSurface = function (S, o) {
    const ctx = S.ctx, HS = C.orange, HSD = '#B26A12', PD = '#9AA5B1';
    const NS = 16, A = 52, R = 23.5, RH = 10.5, DY = 46, NLAY = 4, RG = 8.5, BOND = 8;
    const BX = 24, BW = S.w - 48, BY = 50, BH = S.h - 174;                 // the cell: gas above, metal slab below
    const X0 = BX + (BW - NS * A) / 2;                                      // first hollow site sits at X0 + A / 2
    const Y0 = BY + BH - 8 - (NLAY - 1) * DY - R, YS = Y0 - 21;             // centre of the top metal layer; height of adsorbed H
    const GT = BY + 16, GB = Y0 - R - 20, GL = BX + 16, GR = BX + BW - 16;  // region of the molecule centres
    const T_LOW = 1.6, T_UP = 9, T_HIGH = 3.4, T_DOWN = 7, P = T_LOW + T_UP + T_HIGH + T_DOWN;
    let rng, clock = 0, mols = [], occ = [], fly = [], nextSpawn = 0, nextDes = 0, nextHop = 0, slab = null, slabK = 0;
    const siteX = (i) => X0 + (i + 0.5) * A;
    const level = (c) => { // chemical potential, as a fraction between its lowest and highest value on show
      c = c % P;
      if (c < T_LOW) return 0;
      if (c < T_LOW + T_UP) return (c - T_LOW) / T_UP;
      if (c < T_LOW + T_UP + T_HIGH) return 1;
      return 1 - E.inOut((c - T_LOW - T_UP - T_HIGH) / T_DOWN);
    };
    const gasTarget = (f) => Math.round(3 + 19 * Math.pow(f, 1.15)), adsTarget = (f) => Math.round(1 + 14 * Math.pow(f, 0.8));
    function newMol(x, y, down) {
      const sp = 70 + 50 * rng.u(), an = down ? (0.2 + 0.6 * rng.u()) * Math.PI : rng.u() * 2 * Math.PI;
      return { x, y, vx: sp * Math.cos(an), vy: sp * Math.abs(Math.sin(an)) * (down ? 1 : (rng.u() < 0.5 ? 1 : -1)), th: rng.u() * Math.PI, om: (rng.u() < 0.5 ? -1 : 1) * (1.2 + 2.2 * rng.u()), a: down ? 0 : 1, out: false };
    }
    function reset() {
      rng = makeRng(o.seed || 9); clock = 0; mols = []; fly = []; occ = new Array(NS).fill(0); // 0 free, 1 adsorbed, 2 reserved by an atom in transit
      for (let k = 0; k < gasTarget(0); k++) mols.push(newMol(GL + (GR - GL) * rng.u(), GT + (GB - GT) * (0.1 + 0.7 * rng.u()), false));
      occ[5] = 1; nextSpawn = 0.3; nextDes = 1.2; nextHop = 0.8;
    }
    reset();
    const nAds = () => occ.reduce((s, v) => s + (v ? 1 : 0), 0);
    function tryAdsorb(m, f) { // both atoms of the molecule take two neighbouring free sites
      if (nAds() + 2 > adsTarget(f) + 1 || rng.u() > 0.9) return false;
      const i0 = Math.round((m.x - X0) / A) - 1;
      for (const i of [i0, i0 - 1, i0 + 1]) {
        if (i < 0 || i > NS - 2 || occ[i] || occ[i + 1]) continue;
        const c = Math.cos(m.th), s = Math.sin(m.th), l = c >= 0 ? -1 : 1; // the atom on the left goes to the left site
        fly.push({ x0: m.x + l * BOND * c, y0: m.y + l * BOND * s, x1: siteX(i), y1: YS, u: 0, dur: 0.34, land: i });
        fly.push({ x0: m.x - l * BOND * c, y0: m.y - l * BOND * s, x1: siteX(i + 1), y1: YS, u: 0, dur: 0.34, land: i + 1 });
        occ[i] = 2; occ[i + 1] = 2; return true;
      }
      return false;
    }
    function desorb(f) { // two neighbouring adsorbed atoms pair up and leave as a molecule
      const n = nAds(), t = adsTarget(f);
      if (n < 2 || !(n > t || (n >= t && rng.u() < 0.5))) return;
      const pairs = []; for (let i = 0; i < NS - 1; i++) if (occ[i] === 1 && occ[i + 1] === 1) pairs.push(i);
      if (!pairs.length) { if (n > t) hop(); return; } // no two neighbours yet: let one atom move next to another
      const i = pairs[rng.int(pairs.length)], xm = 0.5 * (siteX(i) + siteX(i + 1)), mol = { n: 0, x: xm, y: YS - 40 };
      occ[i] = 0; occ[i + 1] = 0;
      fly.push({ x0: siteX(i), y0: YS, x1: xm - BOND, y1: YS - 40, u: 0, dur: 0.32, lift: mol });
      fly.push({ x0: siteX(i + 1), y0: YS, x1: xm + BOND, y1: YS - 40, u: 0, dur: 0.32, lift: mol });
    }
    function hop() { // an adsorbed atom moves to a free neighbouring site
      const c = []; for (let i = 0; i < NS; i++) if (occ[i] === 1) { if (i > 0 && !occ[i - 1]) c.push([i, i - 1]); if (i < NS - 1 && !occ[i + 1]) c.push([i, i + 1]); }
      if (!c.length) return;
      const [i, j] = c[rng.int(c.length)]; occ[i] = 0; occ[j] = 2;
      fly.push({ x0: siteX(i), y0: YS, x1: siteX(j), y1: YS, u: 0, dur: 0.26, land: j, arc: 9 });
    }
    function advance(dt) {
      const f = level(clock), gt = gasTarget(f);
      let live = 0; mols.forEach(m => { if (!m.out) live++; });
      if (live < gt && clock >= nextSpawn) { mols.push(newMol(GL + (GR - GL) * rng.u(), GT - 4, true)); nextSpawn = clock + 0.16; live++; }
      if (live > gt) { // more molecules than the reservoir sets: the highest ones head back out through the open top
        mols.filter(m => !m.out).sort((a, b) => a.y - b.y).slice(0, live - gt).forEach(m => { m.vy = -Math.abs(m.vy); });
      }
      for (const m of mols) {
        m.x += m.vx * dt; m.y += m.vy * dt; m.th += m.om * dt;
        if (m.out) { m.a -= dt / 0.28; continue; }
        m.a = Math.min(1, m.a + dt / 0.3);
        if (m.x < GL) { m.x = GL; m.vx = Math.abs(m.vx); } else if (m.x > GR) { m.x = GR; m.vx = -Math.abs(m.vx); }
        if (m.y < GT && m.vy < 0) { if (live > gt) { m.out = true; live--; } else m.vy = Math.abs(m.vy); }  // the top is open to the reservoir
        if (m.y > GB && m.vy > 0) { if (tryAdsorb(m, f)) { m.a = -1; live--; } else { m.vy = -Math.abs(m.vy); m.vx += 30 * (rng.u() - 0.5); } }
      }
      mols = mols.filter(m => m.a > 0 || (!m.out && m.a >= 0));
      for (const a of fly) {
        a.u += dt / a.dur; if (a.u < 1) continue;
        if (a.land !== undefined) occ[a.land] = 1;
        else if (++a.lift.n === 2) { const m = newMol(a.lift.x, a.lift.y, false); m.vy = -Math.abs(m.vy) - 30; m.th = 0; mols.push(m); }
      }
      fly = fly.filter(a => a.u < 1);
      if (clock >= nextDes) { desorb(f); nextDes = clock + (nAds() > adsTarget(f) + 1 ? 0.2 + 0.2 * rng.u() : 0.45 + 0.7 * rng.u()); }
      if (clock >= nextHop) { hop(); nextHop = clock + 0.5 + 0.8 * rng.u(); }
    }
    function slabLayer() { // the metal atoms are held fixed: drawn once per canvas resolution
      if (slab && slabK === S.k) return slab;
      const w = BW - 4, h = (NLAY - 1) * DY + 2 * R + 4, off = X0 - (BX + 2);
      slab = document.createElement('canvas'); slabK = S.k; slab.width = Math.ceil(w * S.k); slab.height = Math.ceil(h * S.k); slab._w = w; slab._h = h;
      const c = slab.getContext('2d'); c.setTransform(S.k, 0, 0, S.k, 0, 0);
      for (let l = NLAY - 1; l >= 0; l--) for (let i = -2; i <= NS + 1; i++) atom(c, off + (i + (l % 3) / 3) * A, R + 2 + l * DY, R, PD);
      return slab;
    }
    function h2(x, y, th, a) {
      const c = BOND * Math.cos(th), s = BOND * Math.sin(th);
      atom(ctx, x - c, y - s, RG, HS, a); atom(ctx, x + c, y + s, RG, HS, a);
    }
    function draw() {
      S.clear();
      const f = level(clock);
      text(ctx, 'Pd(111) in hydrogen gas', BX, 32, { size: 23, weight: 650, color: C.navy });
      text(ctx, 'schematic', BX + BW, 32, { size: 18, color: C.muted, align: 'right' });
      roundRect(ctx, BX, BY, BW, BH, 12, '#fff', rgba(C.inkSoft, 0.5), 1.8);
      ctx.save(); roundRect(ctx, BX + 1, BY + 1, BW - 2, BH - 2, 11); ctx.clip();
      const sl = slabLayer(); ctx.drawImage(sl, BX + 2, Y0 - R - 2, sl._w, sl._h);
      mols.forEach(m => { if (m.a > 0.02) h2(m.x, m.y, m.th, Math.min(1, m.a)); });
      for (let i = 0; i < NS; i++) if (occ[i] === 1) atom(ctx, siteX(i) + 1.1 * wiggle(i * 3.1, clock * 4), YS + 1.1 * wiggle(i * 5.7 + 2, clock * 4), RH, HS);
      fly.forEach(a => { const u = E.inOut(E.clamp(a.u)); atom(ctx, a.x0 + (a.x1 - a.x0) * u, a.y0 + (a.y1 - a.y0) * u - (a.arc || 0) * Math.sin(Math.PI * u), RH + (RG - RH) * (a.lift ? u : a.land !== undefined && !a.arc ? 1 - u : 0), HS); });
      ctx.restore();
      text(ctx, 'gas', BX + 18, BY + 34, { size: 20, weight: 650, color: C.inkSoft });
      // what is in the picture now. Notation is typeset by KaTeX (S.tex, a layer over the canvas); the running count stays canvas text
      const ry = BY + BH + 40; let x = BX + 6;
      h2(x + 14, ry - 7, 0, 1); x += 36; S.tex('h2', '$\\mathrm{H}_2$ in the gas', x, ry, { size: 20, color: C.inkSoft });
      x = BX + 250; atom(ctx, x + 8, ry - 7, RH, HS); x += 28; S.tex('h', '$\\mathrm{H}$ on the surface', x, ry, { size: 20, color: C.inkSoft });
      const nStr = String(nAds()); // the symbol is typeset once and sits to the left of the number, which changes
      text(ctx, nStr, BX + BW, ry, { size: 24, weight: 700, color: HSD, align: 'right' });
      S.tex('nH', '$N_{\\mathrm H}=$', BX + BW - width(ctx, nStr, 24, 700) - 7, ry, { size: 24, weight: 700, color: HSD, align: 'right' });
      // chemical potential: low to high, no numbers
      const sy = ry + 52, sx0 = BX + 338, sx1 = BX + BW - 86;
      S.tex('muH', 'chemical potential $\\mu_{\\mathrm H}$', BX + 6, sy + 7, { size: 20, color: C.inkSoft });
      text(ctx, 'low', sx0 - 22, sy + 7, { size: 19, color: C.inkSoft, align: 'right' }); text(ctx, 'high', sx1 + 22, sy + 7, { size: 19, color: C.inkSoft });
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = rgba(C.inkSoft, 0.25); ctx.lineWidth = 6; seg(ctx, sx0, sy, sx1, sy);
      ctx.strokeStyle = C.navy; seg(ctx, sx0, sy, sx0 + (sx1 - sx0) * f, sy); ctx.restore();
      U.circle(ctx, sx0 + (sx1 - sx0) * f, sy, 10, '#fff', C.navy, 4);
    }
    return {
      frame(dt) { clock += dt; advance(Math.min(dt, 0.05)); draw(); },
      draw, enter() { reset(); },
      stats() { return { level: level(clock), gas: mols.filter(m => !m.out).length, gasTarget: gasTarget(level(clock)), adsorbed: nAds(), adsTarget: adsTarget(level(clock)) }; }, // for tests
      ff: T_LOW + 0.72 * T_UP // static captures: a well-filled surface under a dense gas
    };
  };
})();
