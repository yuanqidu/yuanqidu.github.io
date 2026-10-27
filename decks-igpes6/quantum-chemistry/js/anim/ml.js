/* Machine-learning era figures: accuracy vs cost on GMTKN55 (rungs and Skala), the FeMoco resource-estimate
   history, and the data-flow picture of the "new ladder". Numbers are from the literature (see slide citations). */
(function () {
  'use strict';
  const { C, rgba } = U;

  // =====================================================================================
  // GMTKN55 WTMAD-2 against cost: rung averages (Goerigk et al. 2017 SI), selected functionals, and Skala.
  // Cost axis is schematic: relative cost of one energy for a medium molecule (Skala: within 30% of r2SCAN on GPU;
  // hybrids 3-6x; double hybrids add an N^5 step).
  // builds: 0 rung averages, 1 best functionals per rung, 2 Skala
  // =====================================================================================
  ANIMS.skala = function (S, o) {
    const ctx = S.ctx;
    const P = K.plot(ctx, { x: 110, y: 30, w: S.w - 160, h: S.h - 120 }, { x: [0.6, 60], y: [0, 12], logx: true, xt: [{ v: 1, l: 'GGA' }, { v: 1.3, l: '' }, { v: 4.5, l: 'hybrid' }, { v: 25, l: 'double hybrid' }], yt: K.ticks([0, 2, 4, 6, 8, 10, 12]), xl: 'typical cost per energy (schematic, relative to a GGA)', fs: 18 });
    const rung = [[1, 10.47, 'GGA average', Q.RUNG[2]], [1.3, 9.96, 'meta-GGA average', Q.RUNG[3]], [4.5, 6.82, 'hybrid average', Q.RUNG[4]], [25, 3.57, 'double-hybrid average', Q.RUNG[5]]];
    const best = [[1.3, 7.86, 'SCAN-D3(BJ)', Q.RUNG[3], 'r'], [4.5, 3.98, 'ωB97X-V', Q.RUNG[4], 'l'], [5, 3.23, 'ωB97M-V', Q.RUNG[4], 'r'], [25, 3.08, 'DSD-BLYP-D3(BJ)', Q.RUNG[5], 'r'], [4.5, 16.38, 'B3LYP (no dispersion)', '#B4492F', 'r']];
    let step = 0, t = 0;
    function draw() {
      S.clear(); P.axes(); K.label(ctx, 'GMTKN55 WTMAD-2 (kcal/mol, lower is better)', 116, 22, { size: 18, color: C.muted });
      P.line(rung.map(r => r[0]), rung.map(r => r[1]), rgba(C.ink, 0.25), 2, [5, 5]);
      rung.forEach(([x, y, l, c]) => { U.circle(ctx, P.X(x), P.Y(y), 13, c, '#fff', 2.5); K.label(ctx, l, P.X(x) + 18, P.Y(y) - 12, { size: 18, color: c, weight: 700 }); });
      if (step >= 1) best.forEach(([x, y, l, c, side]) => { if (y > 12) { K.label(ctx, `${l}: ${y}  ↑`, P.X(x) + 14, P.Y(11.6), { size: 17, color: c, weight: 650 }); return; } U.circle(ctx, P.X(x), P.Y(y), 7, '#fff', c, 2.5); K.label(ctx, `${l} ${y}`, P.X(x) + (side === 'l' ? -12 : 12), P.Y(y) + 6, { size: 16, color: c, weight: 650, align: side === 'l' ? 'right' : 'left' }); });
      if (step >= 2) {
        const a = Math.min(1, t * 1.5), x = 1.3 * 1.3, y = 2.80;
        ctx.save(); ctx.globalAlpha = a;
        ctx.beginPath(); for (let k = 0; k < 5; k++) { const ang = -Math.PI / 2 + k * 4 * Math.PI / 5; const px = P.X(x) + 17 * Math.cos(ang), py = P.Y(y) + 17 * Math.sin(ang); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); ctx.fillStyle = C.coral; ctx.fill();
        K.label(ctx, 'Skala-1.1 (2026): 2.80 at meta-GGA-like cost', P.X(0.75), P.Y(y) + 46, { size: 20, color: '#B4492F', weight: 750 });
        ctx.restore();
      }
    }
    return { draw, step(s) { step = s; if (s >= 2) t = 0; draw(); }, frame(dt) { if (step >= 2 && t < 1) { t += dt; draw(); } }, ff: 1 };
  };

  // =====================================================================================
  // FeMoco on a fault-tolerant quantum computer: Toffoli-gate estimates by year (Low et al. 2025, Table I)
  // =====================================================================================
  ANIMS.femoco = function (S, o) {
    const ctx = S.ctx;
    const pts = [[2017, 5.0e13, 'Trotter', 14, -12, 'left'], [2019, 9.5e10, 'single factorization', -14, 4, 'right'], [2020, 2.3e10, 'double factorization', 14, -14, 'left'], [2020.6, 5.3e9, 'tensor hypercontraction', 14, 28, 'left'], [2024, 2.6e9, 'symmetry-compressed DF', -14, -34, 'right'], [2025, 3.41e8, 'spectrum amplification + DF-THC', -14, 32, 'right']];
    const P = K.plot(ctx, { x: 120, y: 30, w: S.w - 170, h: S.h - 110 }, { x: [2016.5, 2025.8], y: [1e8, 1e14], logy: true, xt: K.ticks([2017, 2019, 2021, 2023, 2025]), yt: [1e8, 1e10, 1e12, 1e14].map(v => ({ v, l: K.sig(v, 1) })), xl: 'year of the estimate', fs: 18 });
    let t = 0;
    function draw() {
      S.clear(); P.axes(); K.label(ctx, 'Toffoli gates to estimate the FeMoco ground-state energy (54-orbital model)', 126, 22, { size: 18, color: C.muted });
      const n = Math.min(pts.length, 1 + Math.floor(t * 1.5));
      P.line(pts.slice(0, n).map(p => p[0]), pts.slice(0, n).map(p => p[1]), C.violet, 3);
      pts.slice(0, n).forEach(([x, y, l, dx, dy, al]) => { P.dots([x], [y], C.violet, 8); K.label(ctx, l, P.X(x) + dx, P.Y(y) + dy, { size: 17, color: C.ink, weight: 600, align: al, halo: C.bg }); });
      if (n === pts.length) K.label(ctx, '≈ 150,000× fewer gates in eight years', P.X(2025.6), P.Y(4e12), { size: 22, color: C.violet, weight: 750, align: 'right' });
    }
    return { draw, enter() { t = 0; }, frame(dt) { if (t < 5) { t += dt; draw(); } }, ff: 5 };
  };
})();
