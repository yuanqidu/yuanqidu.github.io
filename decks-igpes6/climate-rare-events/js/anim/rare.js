/* Rare-event animations: cloning (GKTL) trees, return-time curves, splitting (AMS) for tipping, extreme-value extrapolation,
   Lorenz ensembles. Every picture is a real simulation from js/engines.js; reference curves are exact. */
(function () {
  'use strict';
  const { C, rgba, mix, E, roundRect, text, circle } = U;
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = (n) => String(n).split('').map(ch => (ch === '-' ? '⁻' : SUP[+ch])).join('');
  const yearsLabel = (e) => (e <= 2 ? String(Math.round(Math.pow(10, e))) : e === 3 ? '1,000' : '10' + sup(e));

  // ---------- small plotting kit (stage pixels) ----------
  function plot(ctx, b, o) {
    const X = (v) => b.x + (v - o.x[0]) / (o.x[1] - o.x[0]) * b.w;
    const Y = (v) => b.y + b.h - (v - o.y[0]) / (o.y[1] - o.y[0]) * b.h;
    function axes() {
      ctx.save();
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      (o.xt || []).forEach(t => { ctx.beginPath(); ctx.moveTo(X(t.v), b.y); ctx.lineTo(X(t.v), b.y + b.h); ctx.stroke(); });
      (o.yt || []).forEach(t => { ctx.beginPath(); ctx.moveTo(b.x, Y(t.v)); ctx.lineTo(b.x + b.w, Y(t.v)); ctx.stroke(); });
      ctx.strokeStyle = rgba(C.inkSoft, 0.85); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.stroke();
      const fs = o.fs || 20;
      (o.xt || []).forEach(t => text(ctx, t.l, X(t.v), b.y + b.h + fs + 8, { size: fs, color: C.inkSoft, align: 'center' }));
      (o.yt || []).forEach(t => text(ctx, t.l, b.x - 12, Y(t.v) + fs * 0.35, { size: fs, color: C.inkSoft, align: 'right' }));
      if (o.xl) text(ctx, o.xl, b.x + b.w / 2, b.y + b.h + fs + 44, { size: o.fl || 21, color: C.inkSoft, align: 'center', weight: 600 });
      if (o.yl) { ctx.save(); ctx.translate(b.x - (o.ylo || 64), b.y + b.h / 2); ctx.rotate(-Math.PI / 2); text(ctx, o.yl, 0, 0, { size: o.fl || 21, color: C.inkSoft, align: 'center', weight: 600 }); ctx.restore(); }
      ctx.restore();
    }
    function line(xs, ys, col, lw, dash, alpha) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw || 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (dash) ctx.setLineDash(dash); if (alpha !== undefined) ctx.globalAlpha *= alpha;
      ctx.beginPath(); for (let i = 0; i < xs.length; i++) { const px = X(xs[i]), py = Y(ys[i]); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); ctx.restore();
    }
    function clip() { ctx.beginPath(); ctx.rect(b.x, b.y - 2, b.w + 2, b.h + 4); ctx.clip(); }
    return { X, Y, axes, line, clip, b };
  }
  const logTicks = (e0, e1, step = 1) => { const t = []; for (let e = e0; e <= e1; e += step) t.push({ v: e, l: yearsLabel(e) }); return t; };

  // =====================================================================================
  // Cloning tree (GKTL) on the toy summer: daily temperature anomalies over one season.
  // o.stepK = tilt per build, e.g. [0, 0.2] = brute force first, cloning after the click. o.hero = no axes.
  // =====================================================================================
  ANIMS.cloneTree = function (S, o) {
    const ctx = S.ctx, rho = Math.exp(-1 / 5), T = o.T || 30, tau = o.tau || 3, N = o.N || 40, sd = o.sd || 3; // daily anomaly sd in °C
    const ex = RE.seasonExact(rho, T), lv1000 = sd * ex.level(1e-3), lv100 = sd * ex.level(1e-2);
    const hero = !!o.hero, DPS = o.dps || 7, HOLD = o.hold || 3.2;
    const kOf = (s) => (o.stepK || [o.k || 0.2])[Math.min(s, (o.stepK || [0]).length - 1)];
    const pad = hero ? { l: 20, r: 20, t: 30, b: 30 } : { l: 92, r: 30, t: 62, b: 86 };
    const sideW = hero ? 0 : (o.side || 250);
    const P = plot(ctx, { x: pad.l, y: pad.t, w: S.w - pad.l - pad.r - sideW, h: S.h - pad.t - pad.b }, {
      x: [0, T], y: [-9, 12], xt: hero ? [] : [0, 10, 20, 30].filter(v => v <= T).map(v => ({ v, l: String(v) })),
      yt: hero ? [] : [-6, 0, 6, 12].map(v => ({ v, l: (v > 0 ? '+' : '') + v })), xl: hero ? '' : 'day of the season', yl: hero ? '' : 'daily temperature anomaly (°C)'
    });
    const Q = plot(ctx, { x: S.w - pad.r - sideW + 70, y: pad.t, w: sideW - 70, h: S.h - pad.t - pad.b }, { x: [0, 1], y: [-3, 6.5] });
    let run = null, ghosts = [], vt = 0, hold = 0, k = kOf(0), seed = o.seed || 11, step = 0, cycles = 0;
    function reset() {
      run = RE.seasonGKTL({ N, T, rho, k, tau, seed: seed++ }); ghosts = []; vt = 0; hold = 0; cycles++;
    }
    reset();
    const colOf = (m) => mix(C.blue, C.coral, E.clamp((m / sd + 0.9) / 2.4));
    function advance(dt) {
      if (run.done) { hold += dt; if (hold > HOLD) reset(); return; }
      vt += dt * DPS;
      while (run.day < Math.min(T, Math.ceil(vt)) && !run.done) {
        const resampleNow = (run.day + 1) % tau === 0 && run.day + 1 < T;
        const before = resampleNow ? run.paths.slice() : null;
        run.step();
        if (resampleNow && k > 0) {
          const ev = run.events[run.events.length - 1];
          ev.off.forEach((c, n) => { if (c === 0) ghosts.push({ p: before[n], day: run.day, t: 0 }); });
          ev.flash = 0;
        }
      }
      ghosts.forEach(g => { g.t += dt; }); ghosts = ghosts.filter(g => g.t < 1.1);
    }
    function pathMean(p, upto) { let s = 0; for (let j = 1; j <= upto; j++) s += p[j]; return upto ? s / upto : 0; }
    function drawPath(p, upto, col, lw, alpha) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.globalAlpha = alpha; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
      if (hero) {   // smooth curve through the daily values (midpoint quadratic splines)
        ctx.moveTo(P.X(0), P.Y(sd * p[0]));
        for (let j = 1; j < upto; j++) { const mx = (P.X(j) + P.X(j + 1)) / 2, my = (P.Y(sd * p[j]) + P.Y(sd * p[j + 1])) / 2; ctx.quadraticCurveTo(P.X(j), P.Y(sd * p[j]), mx, my); }
        if (upto >= 1) ctx.lineTo(P.X(upto), P.Y(sd * p[upto]));
      } else for (let j = 0; j <= upto; j++) { const x = P.X(j), y = P.Y(sd * p[j]); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
    }
    function draw() {
      S.clear();
      if (!hero) P.axes();
      const upto = run.day, front = Math.min(vt, T);
      ctx.save(); ctx.beginPath(); ctx.rect(P.b.x, P.b.y - 4, P.X(front) - P.b.x + 1, P.b.h + 8); ctx.clip();
      // resampling instants
      if (k > 0) for (const ev of run.events) {
        const x = P.X(ev.day); ctx.save(); ctx.strokeStyle = rgba(C.coral, hero ? 0.12 : 0.22); ctx.setLineDash([4, 6]); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x, P.b.y); ctx.lineTo(x, P.b.y + P.b.h); ctx.stroke(); ctx.restore();
      }
      ghosts.forEach(g => drawPath(g.p, g.day, C.steel, hero ? 1.6 : 1.8, 0.55 * (1 - g.t / 1.1)));
      const order = run.paths.map((p, i) => [pathMean(p, upto), i]).sort((a, b) => a[0] - b[0]);
      for (const [m, i] of order) drawPath(run.paths[i], upto, colOf(sd * m), hero ? 2.2 : 2.0, hero ? 0.62 : 0.72);
      ctx.restore();
      if (hero) return;
      // right panel: running season means vs return levels
      const qx0 = Q.b.x, qx1 = Q.b.x + Q.b.w;
      ctx.save(); ctx.strokeStyle = rgba(C.inkSoft, 0.8); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(qx0, Q.b.y); ctx.lineTo(qx0, Q.b.y + Q.b.h); ctx.stroke(); ctx.restore();
      [0, 3, 6].forEach(v => text(ctx, (v > 0 ? '+' : '') + v, qx0 - 10, Q.Y(v) + 7, { size: 18, color: C.inkSoft, align: 'right' }));
      text(ctx, 'season mean', (qx0 + qx1) / 2 + 8, Q.b.y + Q.b.h + 30, { size: 19, color: C.inkSoft, align: 'center', weight: 600 });
      text(ctx, 'so far (°C)', (qx0 + qx1) / 2 + 8, Q.b.y + Q.b.h + 54, { size: 19, color: C.inkSoft, align: 'center', weight: 600 });
      [[lv100, '1-in-100 yr'], [lv1000, '1-in-1,000 yr']].forEach(([v, l], j) => {
        ctx.save(); ctx.strokeStyle = rgba(j ? C.red : C.orange, 0.9); ctx.lineWidth = 2; ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.moveTo(qx0, Q.Y(v)); ctx.lineTo(qx1, Q.Y(v)); ctx.stroke(); ctx.restore();
        text(ctx, l, qx1 + 6, Q.Y(v) - 8, { size: 16, color: j ? C.red : C.orange, align: 'right', weight: 650 });
      });
      const rng = RE.rng(5); let above = 0;
      run.paths.forEach(p => {
        const m = sd * pathMean(p, upto); if (upto === T && m > lv1000) above++;
        circle(ctx, qx0 + 14 + rng.u() * (Q.b.w * 0.36), Q.Y(m), 5.5, rgba(colOf(m), 0.85), '#fff', 1.2);
      });
      const done = upto === T;
      const lab = k > 0 ? `cloning (k = ${k}): ${done ? above + ' of ' + N + ' summers past the 1-in-1,000-yr level' : 'resample every ' + tau + ' days'}`
        : `brute force: ${done ? above + ' of ' + N + ' summers past the 1-in-1,000-yr level' : N + ' independent summers'}`;
      text(ctx, lab, P.b.x, 26, { size: 22, color: k > 0 ? C.coral : C.blue, weight: 650 });
    }
    return {
      frame(dt) { advance(dt); draw(); }, draw,
      step(s) { if (s === step) return; step = s; const nk = kOf(s); if (nk !== k) { k = nk; reset(); } },
      ff: (T / DPS) + 0.5
    };
  };

  // =====================================================================================
  // Return-time curve: exact vs brute force vs cloning vs optimal control, at equal cost (N seasons each).
  // builds: 0 exact, 1 + brute force, 2 + cloning, 3 + control
  // =====================================================================================
  ANIMS.returnCurve = function (S, o) {
    const ctx = S.ctx, rho = Math.exp(-1 / 5), T = 30, N = o.N || 200, sd = o.sd || 3, k = o.k || 0.3, tau = o.tau || 2;
    const ex = RE.seasonExact(rho, T);
    const P = plot(ctx, { x: 104, y: 30, w: S.w - 140, h: S.h - 130 }, {
      x: [0, 8], y: [0, 9], xt: logTicks(0, 8), yt: [0, 3, 6, 9].map(v => ({ v, l: '+' + v })),
      xl: 'return time (years)', yl: 'season-mean anomaly (°C)'
    });
    // exact curve
    const ex_x = [], ex_y = []; for (let e = 0.02; e <= 8.001; e += 0.04) { ex_x.push(e); ex_y.push(sd * ex.level(Math.pow(10, -e))); }
    const toPts = (curve, xmin) => curve.filter(c => c.p > 0).map(c => ({ x: -Math.log10(c.p), y: sd * c.a })).filter(q => q.x >= (xmin || 0));
    const br = RE.seasonBrute({ N, T, rho, seed: o.seed || 21 }), brPts = toPts(RE.tailCurve(br.A, br.logw));
    const runs = []; for (let i = 0; i < (o.runs || 6); i++) { const r = RE.seasonGKTL({ N, T, rho, k, tau, seed: 400 + 17 * i }).run().result(); runs.push(toPts(RE.tailCurve(r.A, r.logw), 2)); }
    const ct = RE.seasonControl({ N, T, rho, k, seed: 77 }), ctPts = toPts(RE.tailCurve(ct.A, ct.logw), 2);
    let step = 0, shown = [0, -1, -1, -1], clock = 0;
    function dots(pts, col, r, a, frac) {
      const n = Math.floor(pts.length * frac);
      for (let i = 0; i < n; i++) { const p = pts[i]; if (p.x > 8.2) continue; circle(ctx, P.X(p.x), P.Y(p.y), r, rgba(col, a), '#fff', 0.8); }
    }
    function trace(pts, col, lw, a, frac) {
      const n = Math.floor(pts.length * frac); if (n < 2) return;
      P.line(pts.slice(0, n).map(p => p.x), pts.slice(0, n).map(p => p.y), col, lw, null, a);
    }
    function draw() {
      S.clear(); P.axes();
      ctx.save(); P.clip();
      const f = (i) => (shown[i] < 0 ? 0 : E.smooth((clock - shown[i]) / 1.2));
      P.line(ex_x, ex_y, C.ink, 2.6, [9, 7], 0.85);
      if (f(2) > 0) { runs.slice(1).forEach(r => trace(r, C.coral, 1.6, 0.28, f(2))); trace(runs[0], C.coral, 2.6, 0.9, f(2)); dots(runs[0].filter((_, i) => i % 3 === 0), C.coral, 4.5, 0.95, f(2)); }
      if (f(3) > 0) { trace(ctPts, C.teal, 2.6, 0.95, f(3)); dots(ctPts.filter((_, i) => i % 3 === 0), C.teal, 4.5, 0.95, f(3)); }
      if (f(1) > 0) dots(brPts, C.blue, 5, 0.9, f(1));
      ctx.restore();
      // legend
      const L = [[C.ink, 'exact', 0], [C.blue, `brute force: ${N} simulated summers`, 1], [C.coral, `cloning (GKTL), same cost · ${runs.length} runs`, 2], [C.teal, 'optimal control (Doob transform), same cost', 3]];
      let ly = P.b.y + 20;
      L.forEach(([c, l, i]) => { if (i > step) return; const a = i ? f(i) : 1; ctx.save(); ctx.globalAlpha = a; if (i === 0) { ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.setLineDash([9, 7]); ctx.beginPath(); ctx.moveTo(P.b.x + 24, ly - 7); ctx.lineTo(P.b.x + 60, ly - 7); ctx.stroke(); } else circle(ctx, P.b.x + 42, ly - 7, 6, c); text(ctx, l, P.b.x + 76, ly, { size: 21, color: C.ink, weight: 550 }); ctx.restore(); ly += 34; });
    }
    return {
      frame(dt) { clock += dt; draw(); }, draw,
      step(s) { step = s; for (let i = 1; i <= 3; i++) { if (i <= s && shown[i] < 0) shown[i] = clock; if (i > s) shown[i] = -1; } },
      ff: 2
    };
  };

  // =====================================================================================
  // Toy version of AI-boosted rare-event sampling: a 7-day heatwave at a fixed date in the "physics" model.
  // builds: 0 exact, 1 + direct sampling (physics, N runs), 2 + sampling the emulator itself, 3 + standard resampling,
  //         4 + AI-guided resampling (emulator forecasts steer the physics runs). N = 400 physics runs each.
  // =====================================================================================
  ANIMS.airesCurve = function (S, o) {
    const ctx = S.ctx, rho = Math.exp(-1 / 5), T = 40, W = 7, N = o.N || 400, tau = 4, CT = 4.5, sd = o.sd || 3;
    // the emulator's flaws (defaults: 3-day memory instead of 5, 25% too strong, 0.9 °C too warm); adjustable from the blog
    const emu = { rhoE: Math.exp(-1 / (o.memE || 3)), sE: o.gainE === undefined ? 1.25 : o.gainE, biasE: (o.biasE === undefined ? 0.9 : o.biasE) / sd }, hx = RE.heatExact(rho, T, W);
    const P = plot(ctx, { x: 104, y: 30, w: S.w - 140, h: S.h - 130 }, {
      x: [0, 6], y: [0, 14], xt: logTicks(0, 6), yt: [0, 4, 8, 12].map(v => ({ v, l: '+' + v })),
      xl: 'return period (years)', yl: '7-day mean anomaly (°C)'
    });
    const ex_x = [], ex_y = []; for (let e = 0.02; e <= 6.001; e += 0.04) { ex_x.push(e); ex_y.push(sd * hx.level(Math.pow(10, -e))); }
    const toPts = (r, xmin) => RE.tailCurve(r.A, r.logw).filter(c => c.p > 0).map(c => ({ x: -Math.log10(c.p), y: sd * c.a })).filter(q => q.x >= (xmin || 0));
    const ds = toPts(RE.seasonBrute({ N, T: W, rho, seed: 5 }));
    const em = toPts(RE.heatEmu({ N: 20000, T, W, ...emu, seed: 6 }));
    // rare-event estimators are skewed: show the median and the 10-90% range over R independent runs (each N physics runs)
    const R = o.R || 24, grid = []; for (let e = 1; e <= 5.6001; e += 0.1) grid.push(e);
    function band(mk) {
      const lv = grid.map(() => []);
      for (let i = 0; i < R; i++) {
        const r = mk(2000 + 37 * i), cur = RE.tailCurve(r.A, r.logw);
        grid.forEach((e, j) => { const p = Math.pow(10, -e); let a = NaN; for (const c of cur) { if (c.p >= p) { a = c.a; break; } } lv[j].push(isNaN(a) ? -Infinity : sd * a); });
      }
      const q = (arr, f) => { const v = arr.slice().sort((x, y) => x - y); return v[Math.min(v.length - 1, Math.floor(f * v.length))]; };
      return grid.map((e, j) => ({ x: e, lo: q(lv[j], 0.1), med: q(lv[j], 0.5), hi: q(lv[j], 0.9) })).filter(b => isFinite(b.lo));
    }
    const st = band((sd0) => RE.heatRES({ N, T, W, rho, tau, C: CT, guide: 'running', seed: sd0 }));
    const ai = band((sd0) => RE.heatRES({ N, T, W, rho, tau, C: CT, guide: 'forecast', ...emu, seed: sd0 }));
    const series = [null, [ds, C.ink, `direct sampling: ${N} physics runs`, 'dots'], [em, C.violet, 'sampling the emulator itself (20,000 runs)', 'line'],
      [st, C.orange, `standard rare-event sampling: ${N} physics runs`, 'band'], [ai, C.blue, `AI-guided rare-event sampling: ${N} physics runs`, 'band']];
    let step = 0, clock = 0; const shown = [0, -1, -1, -1, -1];
    function draw() {
      S.clear(); P.axes();
      const f = (i) => (shown[i] < 0 ? 0 : E.smooth((clock - shown[i]) / 1.0));
      ctx.save(); P.clip();
      P.line(ex_x, ex_y, C.inkSoft, 2.4, [9, 7], 0.8);
      for (let i = 1; i <= 4; i++) {
        if (f(i) <= 0) continue; const [pts, col, , kind] = series[i], n = Math.floor(pts.length * f(i));
        if (kind === 'dots') pts.slice(0, n).forEach(p => circle(ctx, P.X(p.x), P.Y(p.y), 4, rgba(col, 0.85)));
        else if (kind === 'band') {
          const b = pts.slice(0, Math.max(2, n));
          ctx.save(); ctx.fillStyle = rgba(col, 0.16); ctx.beginPath(); b.forEach((q, j) => { if (j) ctx.lineTo(P.X(q.x), P.Y(q.hi)); else ctx.moveTo(P.X(q.x), P.Y(q.hi)); });
          b.slice().reverse().forEach(q => ctx.lineTo(P.X(q.x), P.Y(q.lo))); ctx.closePath(); ctx.fill(); ctx.restore();
          P.line(b.map(q => q.x), b.map(q => q.med), col, 3.4, null, 0.95);
        } else P.line(pts.slice(0, n).map(p => p.x), pts.slice(0, n).map(p => p.y), col, 3.2, null, 0.95);
      }
      ctx.restore();
      let ly = P.b.y + 22;
      const leg = (col, l, kind, a) => { ctx.save(); ctx.globalAlpha = a; if (kind === 'dash') { ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.setLineDash([9, 7]); ctx.beginPath(); ctx.moveTo(P.b.x + 22, ly - 7); ctx.lineTo(P.b.x + 58, ly - 7); ctx.stroke(); } else if (kind === 'dots') circle(ctx, P.b.x + 40, ly - 7, 6, col); else { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(P.b.x + 22, ly - 7); ctx.lineTo(P.b.x + 58, ly - 7); ctx.stroke(); } text(ctx, l, P.b.x + 72, ly, { size: 20, color: C.ink, weight: 550 }); ctx.restore(); ly += 32; };
      leg(C.inkSoft, 'truth (exact for this toy)', 'dash', 1);
      for (let i = 1; i <= 4; i++) if (f(i) > 0) leg(series[i][1], series[i][2], series[i][3], f(i));
      if (f(3) > 0) text(ctx, `lines: median of ${R} independent runs · bands: 10–90% of runs`, P.b.x + P.b.w - 8, P.b.y + P.b.h - 14, { size: 18, color: C.inkSoft, align: 'right', alpha: f(3) });
    }
    return {
      frame(dt) { clock += dt; draw(); }, draw,
      step(s) { step = s; for (let i = 1; i <= 4; i++) { if (i <= s && shown[i] < 0) shown[i] = clock; if (i > s) shown[i] = -1; } },
      ff: 1.5
    };
  };

  // =====================================================================================
  // Splitting (AMS) on the double-well tipping model. The replica with the lowest maximum is killed and
  // replaced by a copy of a survivor, branched where that survivor first crossed the level.
  // =====================================================================================
  ANIMS.amsTipping = function (S, o) {
    const ctx = S.ctx, N = o.N || 16, eps = o.eps || 0.04, dt = 0.005, x0 = -0.9, a = -1.0, b = 0.9;
    const pex = RE.dwCommittor(x0, a, b, eps);
    const TMAX = o.tmax || 9, potW = 150;
    const P = plot(ctx, { x: 96 + potW, y: 34, w: S.w - 140 - potW, h: S.h - 130 }, {
      x: [0, TMAX], y: [-1.45, 1.45], xt: [0, 3, 6, 9].map(v => ({ v, l: String(v) })), yt: [], xl: 'time', yl: ''
    });
    let st, clock = 0, iterClock = 0, phase = 'init', hold = 0, dying = [], fresh = [], seed = o.seed || 28;
    const rate = (q) => (q < 6 ? 0.85 : q < 14 ? 3.5 : 14);  // iterations per second
    const dryIter = RE.dwAMS({ N, x0, a, b, eps, dt, seed }).run().iter;
    let ffT = 1.8; for (let q = 0; q < dryIter; q++) ffT += 1 / rate(q);
    function reset() { st = RE.dwAMS({ N, x0, a, b, eps, dt, seed: seed++ }); clock = 0; iterClock = 0; phase = 'init'; hold = 0; dying = []; fresh = []; }
    reset();
    function drawPot() {
      const x0p = 96, w = potW - 26;
      ctx.save(); ctx.strokeStyle = rgba(C.navy, 0.85); ctx.lineWidth = 2.4; ctx.beginPath();
      for (let i = 0; i <= 120; i++) { const y = -1.45 + 2.9 * i / 120, u = RE.dwU(y); const px = x0p + w - (u + 0.25) / 0.85 * w * 1.6; if (i) ctx.lineTo(px, P.Y(y)); else ctx.moveTo(px, P.Y(y)); }
      ctx.stroke(); ctx.restore();
      text(ctx, 'U(x)', x0p + w / 2, P.b.y + P.b.h + 34, { size: 19, color: C.navy, align: 'center', weight: 600 });
      text(ctx, 'today', x0p - 8, P.Y(-1) + 6, { size: 18, color: C.blue, align: 'right', weight: 650 });
      text(ctx, 'tipped', x0p - 8, P.Y(1) + 6, { size: 18, color: C.coral, align: 'right', weight: 650 });
    }
    function drawPath(p, col, lw, alpha, from) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.globalAlpha = alpha; ctx.lineJoin = 'round'; ctx.beginPath();
      const stride = 2; let started = false;
      for (let j = from || 0; j < p.length; j += stride) { const t = j * dt; if (t > TMAX) break; const px = P.X(t), py = P.Y(p[j]); if (started) ctx.lineTo(px, py); else { ctx.moveTo(px, py); started = true; } }
      ctx.stroke(); ctx.restore();
    }
    function draw() {
      S.clear(); P.axes(); drawPot();
      // regions A and B
      ctx.save(); ctx.fillStyle = rgba(C.blue, 0.07); ctx.fillRect(P.b.x, P.Y(a), P.b.w, P.Y(-1.45) - P.Y(a)); ctx.fillStyle = rgba(C.coral, 0.08); ctx.fillRect(P.b.x, P.Y(1.45), P.b.w, P.Y(b) - P.Y(1.45)); ctx.restore();
      text(ctx, 'A: back to the current state', P.b.x + P.b.w - 10, P.Y(-1.45) - 10, { size: 18, color: C.blue, align: 'right', weight: 600 });
      text(ctx, 'B: tipped', P.b.x + P.b.w - 10, P.Y(b) - 10, { size: 18, color: C.coral, align: 'right', weight: 600 });
      ctx.save(); P.clip();
      const vis = phase === 'init' ? E.smooth(clock / 1.5) : 1;
      st.reps.forEach((r, i) => { const isNew = fresh.find(f => f.i === i); drawPath(r.path, isNew ? C.teal : C.steel, isNew ? 2.6 : 1.7, isNew ? 0.95 : 0.55 * vis); });
      dying.forEach(d => drawPath(d.path, C.red, 2.2, 0.8 * (1 - d.t / 0.7)));
      if (st.level > -Infinity) {
        ctx.save(); ctx.strokeStyle = rgba(C.orange, 0.95); ctx.lineWidth = 2.2; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(P.b.x, P.Y(st.level)); ctx.lineTo(P.b.x + P.b.w, P.Y(st.level)); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
      // read-out
      const pq = Math.exp(st.logP), est = st.done ? st.estimate() : pq;
      roundRect(ctx, P.b.x + 14, P.b.y + 8, 520, 104, 12, 'rgba(255,255,255,0.92)', rgba(C.inkSoft, 0.25), 1);
      if (st.done) {
        text(ctx, `done: all ${N} replicas tipped after ${st.iter} iterations`, P.b.x + 32, P.b.y + 42, { size: 21, color: C.ink, weight: 600 });
        text(ctx, `P(tip before returning) ≈ ${est.toExponential(1)}`, P.b.x + 32, P.b.y + 74, { size: 21, color: C.orange, weight: 650 });
      } else {
        text(ctx, `iteration ${st.iter}  ·  level ${st.level > -Infinity ? st.level.toFixed(2) : '—'}`, P.b.x + 32, P.b.y + 42, { size: 21, color: C.ink, weight: 600 });
        text(ctx, `P(reach this level) ≈ ${est.toExponential(1)}`, P.b.x + 32, P.b.y + 74, { size: 21, color: C.orange, weight: 650 });
      }
      text(ctx, `exact ${pex.toExponential(1)} · brute force needs ~${Math.round(10 / pex).toLocaleString()} runs`, P.b.x + 32, P.b.y + 100, { size: 17, color: C.inkSoft });
    }
    function frame(dtt) {
      clock += dtt;
      dying.forEach(d => { d.t += dtt; }); dying = dying.filter(d => d.t < 0.7);
      fresh.forEach(f => { f.t += dtt; }); fresh = fresh.filter(f => f.t < 0.7);
      if (phase === 'init') { if (clock > 1.8) phase = 'run'; draw(); return; }
      if (st.done) { hold += dtt; if (hold > 4) reset(); draw(); return; }
      iterClock += dtt * rate(st.iter);
      while (iterClock >= 1 && !st.done) {
        iterClock -= 1;
        const old = st.reps.map(r => r);
        st.step();
        st.reps.forEach((r, i) => { if (r !== old[i]) { dying.push({ path: old[i].path, t: 0 }); fresh.push({ i, t: 0 }); } });
      }
      draw();
    }
    return { frame, draw, ff: ffT + 1 };
  };

  // =====================================================================================
  // Extreme-value extrapolation: fit a GEV to a 70-year record, extrapolate, compare with the truth.
  // builds: 0 record, 1 fit + band to 100 yr, 2 extrapolate to 10^4 yr + truth, 3 other records
  // =====================================================================================
  ANIMS.gevExtrap = function (S, o) {
    const ctx = S.ctx, mu = 34, sigma = 1.6, xi = -0.2, n = o.n || 70, Rs = [];
    for (let e = 0.05; e <= 4.0001; e += 0.05) Rs.push(Math.pow(10, e));
    const P = plot(ctx, { x: 100, y: 30, w: S.w - 140, h: S.h - 130 }, {
      x: [0, 4], y: [30, 46], xt: logTicks(0, 4), yt: [30, 34, 38, 42, 46].map(v => ({ v, l: v + '°' })),
      xl: 'return period (years)', yl: 'hottest day of the year (°C)'
    });
    const records = [];
    for (let i = 0; i < 6; i++) {
      const r = RE.rng(100 + 31 * i), x = RE.gevSample(r, n, mu, sigma, xi), f = RE.gevFitLmom(x);
      const band = RE.gevBootstrap(RE.rng(7 + i), x, Rs, 200);
      const sorted = x.slice().sort((p, q) => q - p);
      records.push({ x, f, band, pts: sorted.map((v, j) => ({ e: Math.log10((n + 1) / (j + 1)), v })) });
    }
    let step = 0, clock = 0, shown = [0, -1, -1, -1], cur = 0, swap = 0;
    const truthE = Rs.map(R => Math.log10(R)), truthV = Rs.map(R => RE.gevReturnLevel(R, mu, sigma, xi));
    function draw() {
      S.clear(); P.axes();
      const f = (i) => (shown[i] < 0 ? 0 : E.smooth((clock - shown[i]) / 1.0));
      const rec = records[cur];
      ctx.save(); P.clip();
      const reach = step >= 2 ? 4 : Math.log10(100);
      const idx = Rs.map((R, i) => i).filter(i => Math.log10(Rs[i]) <= reach + 1e-9);
      if (f(1) > 0) {
        ctx.save(); ctx.globalAlpha = f(1); ctx.fillStyle = rgba(C.coral, 0.16); ctx.beginPath();
        idx.forEach((i, j) => { const px = P.X(Math.log10(Rs[i])), py = P.Y(rec.band[i].hi); if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
        idx.slice().reverse().forEach(i => ctx.lineTo(P.X(Math.log10(Rs[i])), P.Y(rec.band[i].lo)));
        ctx.closePath(); ctx.fill(); ctx.restore();
        P.line(idx.map(i => Math.log10(Rs[i])), idx.map(i => RE.gevReturnLevel(Rs[i], rec.f.mu, rec.f.sigma, rec.f.xi)), C.coral, 3, null, f(1));
      }
      if (f(2) > 0) P.line(truthE, truthV, C.ink, 2.6, [9, 7], f(2));
      rec.pts.forEach(p => circle(ctx, P.X(p.e), P.Y(p.v), 6, rgba(C.blue, 0.9), '#fff', 1.2));
      ctx.restore();
      if (f(2) > 0) {
        const fit1000 = RE.gevReturnLevel(1000, rec.f.mu, rec.f.sigma, rec.f.xi), t1000 = RE.gevReturnLevel(1000, mu, sigma, xi), bd = rec.band[Rs.findIndex(R => Math.abs(Math.log10(R) - 3) < 1e-6)];
        ctx.save(); ctx.globalAlpha = f(2);
        roundRect(ctx, P.b.x + 20, P.b.y + 16, 560, 112, 12, 'rgba(255,255,255,0.94)', rgba(C.inkSoft, 0.25), 1);
        text(ctx, `1-in-1,000-yr level from ${n} years: ${fit1000.toFixed(1)}°C`, P.b.x + 40, P.b.y + 52, { size: 22, color: C.coral, weight: 650 });
        text(ctx, `90% range ${bd.lo.toFixed(1)}–${bd.hi.toFixed(1)}°C  ·  truth ${t1000.toFixed(1)}°C`, P.b.x + 40, P.b.y + 84, { size: 20, color: C.ink });
        if (rec.f.xi < 0) text(ctx, `fitted upper bound: ${(rec.f.mu - rec.f.sigma / rec.f.xi).toFixed(1)}°C (true bound ${(mu - sigma / xi).toFixed(1)}°C)`, P.b.x + 40, P.b.y + 112, { size: 18, color: C.inkSoft });
        ctx.restore();
      }
      text(ctx, step >= 3 ? `record ${cur + 1} of ${records.length}: same climate, different ${n} years` : `one ${n}-year record`, P.b.x + P.b.w - 8, P.b.y + P.b.h - 16, { size: 19, color: C.blue, align: 'right', weight: 600 });
    }
    return {
      frame(dt) { clock += dt; if (step >= 3) { swap += dt; if (swap > 2.6) { swap = 0; cur = (cur + 1) % records.length; } } draw(); }, draw,
      step(s) { step = s; for (let i = 1; i <= 3; i++) { if (i <= s && shown[i] < 0) shown[i] = clock; if (i > s) shown[i] = -1; } if (s < 3) cur = 0; },
      ff: 1.5
    };
  };

  // =====================================================================================
  // Lorenz 1963: one forecast, then an ensemble from a tiny cloud of initial conditions.
  // =====================================================================================
  ANIMS.lorenzEnsemble = function (S, o) {
    const ctx = S.ctx, M = o.M || 260, dt = 0.01, SPS = o.sps || 110, rng = RE.rng(o.seed || 4);
    let s = [1, 1, 1]; for (let i = 0; i < 1500; i++) s = RE.lorenzStep(s, dt);
    const att = []; let q = s.slice(); for (let i = 0; i < 9000; i++) { q = RE.lorenzStep(q, dt); att.push(q); }
    const cx = S.w * 0.5, cy = S.h * 0.94, sc = Math.min(S.w / 58, S.h / 54);
    const Pp = (v) => [cx + v[0] * sc, cy - v[2] * sc];
    let ens, ctrl, t, hold, step = 0, start = s.slice(), spread = [];
    function reset() {
      ens = []; for (let i = 0; i < M; i++) ens.push([start[0] + 0.02 * rng.normal(), start[1] + 0.02 * rng.normal(), start[2] + 0.02 * rng.normal()]);
      ctrl = start.slice(); t = 0; hold = 0; spread = []; trail = [];
    }
    let trail = [];
    reset();
    function draw() {
      S.clear();
      ctx.save(); ctx.strokeStyle = rgba(C.steel, 0.22); ctx.lineWidth = 1.1; ctx.beginPath();
      att.forEach((v, i) => { const [x, y] = Pp(v); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore();
      if (trail.length > 1) { ctx.save(); ctx.strokeStyle = rgba(C.navy, 0.9); ctx.lineWidth = 2.6; ctx.beginPath(); trail.forEach((v, i) => { const [x, y] = Pp(v); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore(); }
      if (step >= 1) ens.forEach(v => { const [x, y] = Pp(v); circle(ctx, x, y, 3.2, rgba(C.coral, 0.75)); });
      const [cx0, cy0] = Pp(ctrl); circle(ctx, cx0, cy0, 7, C.navy, '#fff', 2);
      text(ctx, `t = ${t.toFixed(1)}`, 18, 34, { size: 22, color: C.inkSoft, weight: 600 });
      if (step >= 1) text(ctx, `${M} forecasts from almost the same start`, 18, 64, { size: 20, color: C.coral, weight: 600 });
    }
    return {
      frame(dtt) {
        if (hold > 0) { hold += dtt; if (hold > 2.5) reset(); draw(); return; }
        const n = Math.round(dtt * SPS);
        for (let i = 0; i < n; i++) { ctrl = RE.lorenzStep(ctrl, dt); trail.push(ctrl); if (trail.length > 160) trail.shift(); if (step >= 1) ens = ens.map(v => RE.lorenzStep(v, dt)); t += dt; }
        if (t > (o.tmax || 14)) hold = 1e-6;
        draw();
      }, draw,
      step(k) { if (k !== step) { step = k; reset(); } },
      ff: 6
    };
  };
})();
