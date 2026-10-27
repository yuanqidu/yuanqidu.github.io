/* Quantum-chemistry helpers on top of kit.js: one colour per method (by rung), data access, unit conversion,
   and generic data-driven charts (horizontal bars) used by several slides. */
(function () {
  'use strict';
  const { C, rgba } = U;
  const Q = window.Q = {};
  Q.KCAL = 627.509474; Q.EV = 27.211386;
  Q.D = () => window.QCDATA || {};
  // rung colours: 0 Hartree-Fock, 1 LDA, 2 GGA, 3 meta-GGA, 4 hybrid, 5 double hybrid, 6 wavefunction
  Q.RUNG = ['#8E9AA6', '#C8692E', '#E0A030', '#2A9D8F', '#4C72B0', '#6B5E9B', '#1D3A5F'];
  Q.RUNGNAME = ['Hartree–Fock', 'LDA', 'GGA', 'meta-GGA', 'hybrid', 'double hybrid', 'wavefunction'];
  const COL = {
    'HF': '#8E9AA6', 'UHF': '#8E9AA6', 'RHF': '#8E9AA6', 'LDA': '#C8692E', 'PBE': '#E0A030', 'BLYP': '#C98A12',
    'TPSS': '#7FBFB5', 'SCAN': '#2A9D8F', 'r2SCAN': '#1F7A6F', 'M06-L': '#5BA65B', 'B97M-V': '#3E8E6E',
    'B3LYP': '#4C72B0', 'PBE0': '#7B9CD0', 'M06-2X': '#2F5597', 'wB97X-V': '#1D3A5F', 'wB97M-V': '#3C5A8A', 'B2PLYP': '#6B5E9B',
    'MP2': '#D16BA5', 'CCSD': '#B4492F', 'CCSD(T)': '#1F2933', 'FCI': '#1F2933', 'exact': '#1F2933', 'CASSCF': '#5BA65B', 'NEVPT2': '#2A9D8F'
  };
  const RUNGOF = { 'HF': 0, 'LDA': 1, 'PBE': 2, 'BLYP': 2, 'TPSS': 3, 'SCAN': 3, 'r2SCAN': 3, 'M06-L': 3, 'B97M-V': 3, 'B3LYP': 4, 'PBE0': 4, 'M06-2X': 4, 'wB97X-V': 4, 'wB97M-V': 4, 'B2PLYP': 5, 'MP2': 6, 'CCSD': 6, 'CCSD(T)': 6 };
  Q.col = (m) => COL[m] || COL[m.replace(/^[RU]-/, '')] || C.steel;
  Q.rungOf = (m) => RUNGOF[m] !== undefined ? RUNGOF[m] : 6;
  Q.pretty = (m) => m.replace('wB97', 'ωB97').replace('r2SCAN', 'r²SCAN');
  Q.FUNCS = ['LDA', 'PBE', 'BLYP', 'TPSS', 'SCAN', 'r2SCAN', 'M06-L', 'B97M-V', 'B3LYP', 'PBE0', 'M06-2X', 'wB97X-V', 'wB97M-V', 'B2PLYP'];
  Q.ease = (x) => K.smooth(x);
  // "computing…" placeholder for figures whose data is still being generated
  Q.pending = function (S, what) {
    S.clear(); U.roundRect(S.ctx, 0, 0, S.w, S.h, 16, 'rgba(29,58,95,.04)', rgba(C.navy, 0.2), 1.5, [6, 6]);
    K.label(S.ctx, (what || 'data') + ' not computed yet: run compute/*.py', S.w / 2, S.h / 2, { size: 22, color: C.muted, align: 'center' });
  };

  // ---------- generic horizontal bar chart ----------
  // opts: {items:[{l, v, c, s, note}], log, min, max, unit, fmt, ticks:[..], refs:[{v, l, c}], lw (label width), fs, bar (height), gap}
  // builds: item k is shown when step >= (s || 0). Bars grow in on entry.
  ANIMS.bars = function (S, o) {
    const ctx = S.ctx, items = o.items, lw = o.lw || 300, fs = o.fs || 21, top = o.top || 34, bot = 68;
    const bh = o.bar || Math.min(46, (S.h - top - bot) / items.length * 0.68), gap = (S.h - top - bot) / items.length;
    const lo = o.min !== undefined ? o.min : (o.log ? 0.1 : 0), hi = o.max || Math.max(...items.map(i => i.v)) * 1.08;
    const P = K.plot(ctx, { x: lw, y: top, w: S.w - lw - (o.rpad || 120), h: S.h - top - bot }, { x: [lo, hi], y: [0, 1], logx: !!o.log, xt: (o.ticks || []).map(v => ({ v, l: o.tickfmt ? o.tickfmt(v) : K.sig(v, 2) })), yt: [], fs: 18, xl: o.xl });
    let step = 0, t = 0; const shown = items.map(() => 0);
    const fmt = (v) => (o.fmt === 'sig' ? K.sig(v, 3) : o.fmt === 'int' ? Math.round(v).toLocaleString('en-US') : K.fmt(v, o.dec === undefined ? 1 : o.dec)) + (o.unit ? ' ' + o.unit : '');
    function draw() {
      S.clear(); P.axes();
      (o.refs || []).forEach(r => { P.vline(r.v, r.c || C.coral, 2, [6, 5]); K.label(ctx, r.l, P.X(r.v) + 6, top - 10, { size: 17, color: r.c || C.coral, weight: 650 }); });
      items.forEach((it, k) => {
        const y = top + k * gap + (gap - bh) / 2, vis = (it.s || 0) <= step;
        const a = shown[k];
        K.label(ctx, it.l, lw - 16, y + bh / 2 + fs * 0.36, { size: fs, color: vis ? (it.lc || C.ink) : rgba(C.ink, 0.25), align: 'right', weight: it.b ? 700 : 520 });
        if (a <= 0) return;
        const x0 = P.X(o.log ? lo : 0), x1 = P.X(o.log ? Math.exp(Math.log(lo) + (Math.log(Math.max(it.v, lo)) - Math.log(lo)) * a) : it.v * a);
        U.roundRect(ctx, Math.min(x0, x1), y, Math.max(2, Math.abs(x1 - x0)), bh, Math.min(8, bh / 3), it.c || C.teal);
        ctx.save(); ctx.globalAlpha = a;
        K.label(ctx, fmt(it.v) + (it.note ? '  ' + it.note : ''), Math.max(x0, x1) + 10, y + bh / 2 + 7, { size: fs - 1, color: C.ink, weight: 650 });
        ctx.restore();
      });
    }
    return {
      draw, step(s) { step = s; draw(); }, enter() { shown.fill(0); t = 0; },
      frame(dt) { t += dt; let moving = false; items.forEach((it, k) => { const target = (it.s || 0) <= step ? 1 : 0; if (shown[k] !== target) { shown[k] = target ? Math.min(1, shown[k] + dt * 1.6) : 0; moving = true; } }); if (moving) draw(); },
      ff: 1.5
    };
  };
})();
