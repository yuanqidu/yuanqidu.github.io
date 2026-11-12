/* "Forces find the modes; path weights fix their weights": one figure, two panels.
   Left: a schematic three-well energy landscape. Samples start anywhere and relax under the forces, so each mode fills
   in proportion to the width of its basin of attraction, not to its Boltzmann weight.
   Right: the mass in each mode: forces only (grey) against the Boltzmann weight (dashed), then with path weights (teal).
   Click 1: every sample keeps its place; its weight (target mass / model mass of its mode) rescales it.
   {"compact": true} (the "Open problems" slide): the landscape alone, filling the canvas, with the share of the samples in each mode
   against its Boltzmann weight written under the mode; no second panel, and clicks change nothing. */
(function () {
  'use strict';
  const { C, rgba, mix, E, roundRect, text } = U;

  ANIMS.modeWeightFig = function (S, o) {
    const ctx = S.ctx; let clock = 0, step = 0, tStep = 1e9;
    // ---- landscape (same wells as the earlier ball-drop sketch) and its basins ----
    const WELLS = [[0.2, 0.10, 2.4], [0.53, 0.035, 3.6], [0.8, 0.06, 3.1]], BETA = 1.5, XA = 0.04, XB = 0.96;
    const Uf = (x) => -WELLS.reduce((s, [c, sd, a]) => s + a * Math.exp(-((x - c) ** 2) / (2 * sd * sd)), 0) + 40 * (x - 0.5) ** 4;
    const G = 2400, xs = [], us = []; for (let i = 0; i <= G; i++) { const x = XA + (XB - XA) * i / G; xs.push(x); us.push(Uf(x)); }
    const cuts = [XA]; for (let i = 1; i < G; i++) if (us[i] > us[i - 1] && us[i] > us[i + 1]) cuts.push(xs[i]); cuts.push(XB);
    const NB = cuts.length - 1, mins = [], boltz = [];
    let Zb = 0, umin = Infinity, umax = -Infinity;
    for (let k = 0; k < NB; k++) {
      let best = Infinity, bx = 0, z = 0;
      for (let i = 0; i <= G; i++) if (xs[i] >= cuts[k] && xs[i] < cuts[k + 1]) { z += Math.exp(-BETA * us[i]); if (us[i] < best) { best = us[i]; bx = xs[i]; } }
      mins.push(bx); boltz.push(z); Zb += z;
    }
    for (let k = 0; k < NB; k++) boltz[k] /= Zb;
    for (let i = 0; i <= G; i++) { umin = Math.min(umin, us[i]); umax = Math.max(umax, us[i]); }
    const basinOf = (x) => { for (let k = 0; k < NB; k++) if (x < cuts[k + 1]) return k; return NB - 1; };

    // ---- geometry ----
    // {"compact": true}: the landscape panel alone, in the same internal coordinates as in the full figure and scaled to the width of
    // the canvas (K), so the mounds come out the same; FS undoes the scale for the text, which keeps its nominal size
    const COMPACT = !!(o && o.compact), K = COMPACT ? S.w / 1052 : 1, FS = 1 / K;
    const LW = 1052, RX = LW + 30, RW = S.w - RX, CH = S.h / K;   // CH: height of the left card in internal coordinates
    const PX0 = 64, PX1 = LW - 56, PYT = 150, PYB = 478;
    const px = (x) => PX0 + (x - XA) / (XB - XA) * (PX1 - PX0), py = (u) => PYB - (u - umin) / (umax - umin) * (PYB - PYT);
    const curveY = (X) => py(Uf(XA + (X - PX0) / (PX1 - PX0) * (XB - XA)));

    // ---- samples: evenly spread starting points, each relaxes into the minimum of its own basin ----
    const NS = 54, R0 = 7.5, samples = [], count = new Array(NB).fill(0);
    for (let j = 0; j < NS; j++) { const x0 = XA + (j + 0.5) / NS * (XB - XA), b = basinOf(x0); samples.push({ x0, b, slot: count[b]++ }); }
    const relax = count.map(n => n / NS), wMode = boltz.map((v, k) => v / relax[k]);
    // the weight of each mode's samples: notation is typeset by KaTeX (S.tex, a layer over the canvas); words and percentages stay canvas text
    const WTEX = wMode.map((w, k) => ({ key: 'w' + k, src: '$w\\approx' + (w >= 1.95 ? w.toFixed(1) : w.toFixed(2)) + '$' }));
    // a neat mound of n markers of radius r in the well around X: a pyramid of rows (m, m - 1, ..., 1) sitting on the curve;
    // the base row is limited by the width of the well, and a pile that does not fit repeats its rows (m, m, m - 1, m - 1, ...)
    function mound(k, r) {
      const n = count[k], d = 2 * r + 2.5, X = px(mins[k]), out = [], ub = Uf(mins[k]);
      let hw = 0; while (hw < 0.2 && Uf(mins[k] + hw) - ub < 1.0 && Uf(mins[k] - hw) - ub < 1.0) hw += 0.002;
      const wide = Math.max(2, Math.floor(2 * hw / (XB - XA) * (PX1 - PX0) / d) + 1);
      let m = 2; while (m < wide && m * (m + 1) / 2 < n) m++;
      let sizes = [], rep = 1;
      for (;;) { sizes = []; for (let q = m; q >= 1; q--) for (let t = 0; t < rep; t++) sizes.push(q); if (sizes.reduce((a2, b2) => a2 + b2, 0) >= n) break; rep++; }
      for (let row = 0; out.length < n; row++) {
        const take = Math.min(sizes[row], n - out.length);
        for (let i = 0; i < take; i++) { const x = X + (i - (take - 1) / 2) * d; out.push([x, curveY(x) - r - 1.5 - row * d * 0.88]); }
      }
      return out;
    }
    const R1 = wMode.map(w => R0 * Math.pow(Math.max(0.3, Math.min(3.2, w)), 0.4)); // larger weight, larger marker (schematic)
    const pos0 = [], pos1 = []; for (let k = 0; k < NB; k++) { pos0.push(mound(k, R0)); pos1.push(mound(k, R1[k])); }
    // fill each mound from the centre outwards, in the order the samples arrive
    const order = [...Array(NS).keys()].sort((a, b) => ((a * 23) % NS) - ((b * 23) % NS));
    const slotOf = new Array(NS), used = new Array(NB).fill(0);
    order.forEach((j, n) => { const s = samples[j]; s.t0 = 0.5 + n * 0.055; slotOf[j] = used[s.b]++; });
    const T_FALL = 0.4, T_SLIDE = 0.85, T_ALL = 0.5 + NS * 0.055 + T_FALL + T_SLIDE;

    function draw() {
      S.clear();
      const e = step >= 1 ? E.inOut(E.clamp((clock - tStep) / 1.3)) : 0;
      ctx.save(); ctx.scale(K, K);
      // ================= left: landscape and samples =================
      roundRect(ctx, 0, 0, LW, CH, 16, '#fff', rgba(C.inkSoft, 0.15), 1.5 * FS);
      text(ctx, step >= 1 ? 'With path weights: each mode gets its Boltzmann mass' : COMPACT ? 'Forces only: every mode is found, with the wrong mass' : 'Forces only: every mode is found', 28, 46, { size: (COMPACT ? 23 : 25) * FS, weight: 680, color: step >= 1 ? C.tealDark : C.ink });
      // basins of attraction: alternate tint, boundary at each barrier top
      for (let k = 0; k < NB; k++) {
        if (k % 2 === 1) { ctx.fillStyle = rgba(C.navy, 0.04); ctx.fillRect(px(cuts[k]), 84, px(cuts[k + 1]) - px(cuts[k]), PYB + 30 - 84); }
        if (k) { ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = rgba(C.inkSoft, 0.35); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px(cuts[k]), 84); ctx.lineTo(px(cuts[k]), PYB + 30); ctx.stroke(); ctx.restore(); }
        const cx = (px(cuts[k]) + px(cuts[k + 1])) / 2;
        // bracket: the width of the basin of attraction
        ctx.strokeStyle = rgba(C.inkSoft, 0.55); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px(cuts[k]) + 8, 104); ctx.lineTo(px(cuts[k]) + 8, 96); ctx.lineTo(px(cuts[k + 1]) - 8, 96); ctx.lineTo(px(cuts[k + 1]) - 8, 104); ctx.stroke();
        text(ctx, 'basin ' + 'ABC'[k], cx, 86, { size: 19 * FS, weight: 650, color: C.inkSoft, align: 'center' });
        text(ctx, 'mode ' + 'ABC'[k], px(mins[k]), PYB + 64 + (COMPACT ? 4 : 0), { size: (COMPACT ? 21 : 22) * FS, weight: 700, color: C.ink, align: 'center' });
        if (step >= 1) S.tex(WTEX[k].key, WTEX[k].src, px(mins[k]), PYB + 94, { size: 21, weight: 700, color: C.tealDark, align: 'center', alpha: e });
      }
      // landscape
      const g = ctx.createLinearGradient(0, PYT, 0, PYB + 30); g.addColorStop(0, rgba(C.blue, 0.03)); g.addColorStop(1, rgba(C.blue, 0.15));
      ctx.beginPath(); for (let i = 0; i <= 480; i++) { const X = PX0 + (PX1 - PX0) * i / 480; if (i) ctx.lineTo(X, curveY(X)); else ctx.moveTo(X, curveY(X)); }
      ctx.lineTo(PX1, PYB + 30); ctx.lineTo(PX0, PYB + 30); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); for (let i = 0; i <= 480; i++) { const X = PX0 + (PX1 - PX0) * i / 480; if (i) ctx.lineTo(X, curveY(X)); else ctx.moveTo(X, curveY(X)); }
      ctx.strokeStyle = C.navy; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.strokeStyle = rgba(C.inkSoft, 0.45); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(PX0, PYB + 30); ctx.lineTo(PX1, PYB + 30); ctx.stroke();
      if (COMPACT) S.tex('U', 'energy $U(x)$', (PX0 + 6) * K, 152 * K, { size: 19, color: C.inkSoft });   // top left, where the curve is low (S.tex takes canvas pixels)
      else S.tex('U', 'energy $U(x)$', PX1, 132, { size: 19, color: C.inkSoft, align: 'right' });
      // samples
      const settled = new Array(NB).fill(0);
      samples.forEach((s, j) => {
        const t = clock - s.t0; if (t < 0) return;
        const X0 = px(s.x0), sl = slotOf[j], a = pos0[s.b][sl], b = pos1[s.b][sl];
        let X, Y, r = R0, col = C.steel;
        if (t < T_FALL) { const u = t / T_FALL; X = X0; Y = 112 + (curveY(X0) - R0 - 1.5 - 112) * u * u; }
        else {
          const u = E.inOut(E.clamp((t - T_FALL) / T_SLIDE)); if (u >= 1) settled[s.b]++;
          X = X0 + (a[0] - X0) * u; Y = (curveY(X) - R0 - 1.5) * (1 - u) + a[1] * u;
          if (u >= 1) { X = a[0] + (b[0] - a[0]) * e; Y = a[1] + (b[1] - a[1]) * e; r = R0 + (R1[s.b] - R0) * e; col = mix(C.steel, C.teal, e); }
        }
        ctx.beginPath(); ctx.arc(X, Y, r, 0, 2 * Math.PI); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#fff'; ctx.stroke();
      });
      if (COMPACT) { // under each mode: the share of the samples that relaxed into it, against its Boltzmann weight
        for (let k = 0; k < NB; k++) {
          const X = px(mins[k]);
          text(ctx, Math.round(settled[k] / NS * 100) + '% of samples', X, PYB + 68 + 29 * FS, { size: 19 * FS, weight: 600, color: C.inkSoft, align: 'center' });
          text(ctx, 'Boltzmann ' + Math.round(boltz[k] * 100) + '%', X, PYB + 68 + 56 * FS, { size: 19 * FS, weight: 700, color: '#B4492F', align: 'center' });
        }
        ctx.restore(); return;
      }
      // ================= right: the mass in each mode =================
      roundRect(ctx, RX, 0, RW, S.h, 16, '#fff', rgba(C.inkSoft, 0.15), 1.5);
      text(ctx, 'Mass in each mode', RX + 28, 46, { size: 25, weight: 680, color: C.ink });
      // legend
      let lx = RX + 28; const ly = 92;
      ctx.fillStyle = C.steel; roundRect(ctx, lx, ly - 15, 18, 18, 4, C.steel); text(ctx, 'forces only', lx + 26, ly, { size: 19, color: C.inkSoft, weight: 600 }); lx += 152;
      ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = C.coral; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(lx, ly - 6); ctx.lineTo(lx + 30, ly - 6); ctx.stroke(); ctx.restore();
      text(ctx, 'Boltzmann', lx + 38, ly, { size: 19, color: '#B4492F', weight: 600 }); lx += 158;
      if (step >= 1) { ctx.globalAlpha = e; roundRect(ctx, lx, ly - 15, 18, 18, 4, C.teal); ctx.globalAlpha = 1; text(ctx, 'with path weights', lx + 26, ly, { size: 19, color: C.tealDark, weight: 650, alpha: e }); }
      const CX0 = RX + 84, CX1 = RX + RW - 36, CYB = 520, CYT = 150, VMAX = 0.6, cy = (v) => CYB - v / VMAX * (CYB - CYT);
      for (let v = 0; v <= VMAX + 1e-9; v += 0.2) {
        ctx.strokeStyle = rgba(C.inkSoft, v ? 0.14 : 0.5); ctx.lineWidth = v ? 1.2 : 1.6; ctx.beginPath(); ctx.moveTo(CX0, cy(v)); ctx.lineTo(CX1, cy(v)); ctx.stroke();
        text(ctx, Math.round(v * 100) + '%', CX0 - 12, cy(v) + 6, { size: 18, color: C.muted, align: 'right' });
      }
      const BW = 48, GAP = 8, gw = (CX1 - CX0) / NB;
      for (let k = 0; k < NB; k++) { // each group: two bars, the Boltzmann level across them, its value to the right
        const gx = CX0 + k * gw + 10, v0 = settled[k] / NS, v1 = v0 + (boltz[k] - v0) * e;
        roundRect(ctx, gx, cy(v0), BW, CYB - cy(v0), 5, rgba(C.steel, 0.9));
        if (v0 > 0.004) text(ctx, Math.round(v0 * 100) + '%', gx + BW / 2, cy(v0) - 10, { size: 20, weight: 700, color: C.inkSoft, align: 'center' });
        if (step >= 1) { roundRect(ctx, gx + BW + GAP, cy(v1), BW, CYB - cy(v1), 5, rgba(C.teal, 0.92)); text(ctx, Math.round(v1 * 100) + '%', gx + BW + GAP + BW / 2, cy(v1) - 10, { size: 20, weight: 700, color: C.tealDark, align: 'center', alpha: Math.min(1, e * 3) }); }
        text(ctx, 'mode ' + 'ABC'[k], gx + BW + GAP / 2, CYB + 40, { size: 22, weight: 700, color: C.ink, align: 'center' });
      }
      for (let k = 0; k < NB; k++) {
        const gx = CX0 + k * gw + 10, y = cy(boltz[k]);
        ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = C.coral; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(gx - 8, y); ctx.lineTo(gx + 2 * BW + GAP + 8, y); ctx.stroke(); ctx.restore();
        text(ctx, Math.round(boltz[k] * 100) + '%', gx + 2 * BW + GAP + 13, y + 7, { size: 19, weight: 700, color: '#B4492F' });
      }
      ctx.restore();
    }
    return {
      enter() { clock = 0; tStep = step >= 1 ? T_ALL + 0.2 : 1e9; },
      step(k) { if (COMPACT) return; if (k >= 1 && step < 1) tStep = Math.max(clock, T_ALL + 0.2); if (k < 1) tStep = 1e9; step = k; },
      frame(dt) { clock += dt; draw(); }, draw, ff: T_ALL + 2.0
    };
  };
})();
