/* Closing animations: the discovery flywheel and the mode-weight limitation. */
(function () {
  'use strict';
  const { C, rgba, mix, E, atom, flatAtom, roundRect, arrow, curvedArrow, text, richText, font, makeRng, wiggle } = U;

  ANIMS.flywheel = function (S, o) {
    const ctx = S.ctx; let clock = 0;
    const cx = S.w / 2, cy = S.h / 2 + 6, R = Math.min(S.w, S.h) * 0.36;
    const nodes = [
      { a: -Math.PI / 2, t1: 'Universal MLIP', t2: 'energies and forces across chemistry', col: C.blue, icon: 'mlip' },
      { a: 0, t1: 'Foundation neural sampler', t2: 'ATLAS · JANUS: ensembles on demand', col: C.teal, icon: 'sampler' },
      { a: Math.PI / 2, t1: 'Thermodynamics', t2: '⟨O⟩, F, S, phase diagrams', col: C.navy, icon: 'thermo' },
      { a: Math.PI, t1: 'Agentic LLM', t2: 'hypotheses, proposals, design', col: C.violet, icon: 'agent' }];
    const parts = []; for (let k = 0; k < 28; k++) parts.push({ u: k / 28 });
    const RX = 1.15; function nodePos(n) { return [cx + R * RX * Math.cos(n.a), cy + R * Math.sin(n.a)]; }
    function icon(n, x, y, s) {
      ctx.save(); ctx.translate(x, y);
      if (n.icon === 'mlip') { const pts = [[-14, -8], [14, -8], [0, 10], [-14, 18], [14, 18]]; pts.forEach(p => pts.forEach(q => { ctx.strokeStyle = rgba(n.col, 0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 4); ctx.lineTo(q[0], q[1] - 4); ctx.stroke(); })); pts.forEach(p => U.circle(ctx, p[0], p[1] - 4, 5, n.col)); }
      if (n.icon === 'sampler') { ctx.strokeStyle = n.col; ctx.lineWidth = 2.4; for (let e = 0; e < 3; e++) { ctx.beginPath(); ctx.ellipse(0, 0, 24, 9, e * Math.PI / 3 + clock * 0.8, 0, 2 * Math.PI); ctx.stroke(); } U.circle(ctx, 0, 0, 4, n.col); }
      if (n.icon === 'thermo') { ctx.strokeStyle = n.col; ctx.lineWidth = 2.6; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const u = k / 30; const xx = -24 + 48 * u, yy = 14 - 30 * Math.exp(-((u - 0.5) ** 2) / 0.05); if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); ctx.beginPath(); ctx.moveTo(-26, 16); ctx.lineTo(26, 16); ctx.stroke(); }
      if (n.icon === 'agent') { roundRect(ctx, -22, -16, 44, 34, 10, rgba(n.col, 0.15), n.col, 2.2); U.circle(ctx, -9, 0, 4.5, n.col); U.circle(ctx, 9, 0, 4.5, n.col); ctx.strokeStyle = n.col; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -24); ctx.stroke(); U.circle(ctx, 0, -26, 3.5, n.col); }
      ctx.restore();
    }
    function draw() {
      S.clear();
      // ring
      ctx.save(); ctx.strokeStyle = rgba(C.inkSoft, 0.14); ctx.lineWidth = 26; ctx.beginPath(); ctx.ellipse(cx, cy, R * RX, R, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      // arrows between nodes (clockwise)
      for (let k = 0; k < 4; k++) {
        const a0 = nodes[k].a + 0.42, a1 = nodes[(k + 1) % 4].a - 0.42 + (k === 3 ? 2 * Math.PI : 0);
        ctx.strokeStyle = rgba(nodes[k].col, 0.65); ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * i / 40; const x = cx + R * RX * Math.cos(a), y = cy + R * Math.sin(a); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
        const ae = a1, xe = cx + R * RX * Math.cos(ae), ye = cy + R * Math.sin(ae), xd = -R * RX * Math.sin(ae), yd = R * Math.cos(ae), m = Math.hypot(xd, yd);
        arrow(ctx, xe - xd / m * 10, ye - yd / m * 10, xe + xd / m * 2, ye + yd / m * 2, rgba(nodes[k].col, 0.9), 4, 16);
      }
      // flowing particles
      parts.forEach(p => { const a = -Math.PI / 2 + p.u * 2 * Math.PI; const x = cx + R * RX * Math.cos(a), y = cy + R * Math.sin(a); const seg = Math.floor(((a + Math.PI / 2) / (Math.PI / 2)) % 4); U.circle(ctx, x, y, 4.5, rgba(nodes[seg].col, 0.85)); });
      // nodes
      const hl = Math.floor(clock / 1.6) % 4;
      nodes.forEach((n, k) => {
        const [x, y] = nodePos(n); const w = 390, h = 112; const on = k === hl;
        roundRect(ctx, x - w / 2, y - h / 2, w, h, 18, '#fff', on ? n.col : rgba(n.col, 0.45), on ? 3.5 : 2);
        icon(n, x - w / 2 + 44, y, 1);
        text(ctx, n.t1, x - w / 2 + 86, y - 6, { size: 24, weight: 700, color: n.col, maxWidth: w - 100 });
        text(ctx, n.t2, x - w / 2 + 86, y + 24, { size: 17, color: C.inkSoft, maxWidth: w - 100 });
      });
      text(ctx, 'train once', cx, cy - 10, { size: 38, weight: 750, color: C.navy, align: 'center' });
      text(ctx, 'query many', cx, cy + 36, { size: 38, weight: 750, color: C.teal, align: 'center' });
    }
    return { frame(dt) { clock += dt; parts.forEach(p => { p.u = (p.u + dt / 9) % 1; }); draw(); }, draw };
  };

  ANIMS.modeWeights = function (S, o) {
    const ctx = S.ctx; let clock = 0;
    const X0 = 30, X1 = S.w - 30, Y1 = S.h - 90, Y0 = 40;
    const g = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
    const tgt = (x) => 0.7 * g(x, 0.28, 0.06) + 0.3 * g(x, 0.73, 0.06);
    const mdl = (x) => 0.5 * g(x, 0.28, 0.06) + 0.5 * g(x, 0.73, 0.06);
    const sx = (x) => X0 + x * (X1 - X0), sy = (v) => Y1 - v / 0.75 * (Y1 - Y0);
    function draw() {
      S.clear();
      ctx.beginPath(); ctx.moveTo(sx(0), Y1); for (let i = 0; i <= 300; i++) ctx.lineTo(sx(i / 300), sy(tgt(i / 300))); ctx.lineTo(sx(1), Y1); ctx.closePath(); ctx.fillStyle = rgba(C.muted, 0.32); ctx.fill();
      ctx.beginPath(); for (let i = 0; i <= 300; i++) { const v = mdl(i / 300) * (1 + 0.02 * Math.sin(clock * 2)); if (i) ctx.lineTo(sx(i / 300), sy(v)); else ctx.moveTo(sx(i / 300), sy(v)); } ctx.strokeStyle = C.coral; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.strokeStyle = rgba(C.inkSoft, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, Y1); ctx.lineTo(X1, Y1); ctx.stroke();
      const pulse = 0.75 + 0.25 * Math.sin(clock * 3);
      [[0.15, 0.24], [0.41, 0.32], [0.6, 0.69], [0.86, 0.77]].forEach(([a, b]) => arrow(ctx, sx(a), Y1 - 22, sx(a + (b - a) * pulse), Y1 - 22, C.teal, 3, 11));
      text(ctx, 'target 0.7 / 0.3', sx(0.28), sy(0.7) - 14, { size: 21, color: C.inkSoft, align: 'center', weight: 600 });
      text(ctx, 'model 0.5 / 0.5', sx(0.73), sy(0.5) - 16, { size: 21, color: C.coral, align: 'center', weight: 600 });
      text(ctx, 'forces: identical inside each basin', (X0 + X1) / 2, Y1 + 36, { size: 20, color: C.tealDark, align: 'center', weight: 600 });
      text(ctx, 'blind to the relative mass of separated modes', (X0 + X1) / 2, Y1 + 64, { size: 19, color: C.inkSoft, align: 'center' });
    }
    return { frame(dt) { clock += dt; draw(); }, draw };
  };
})();
