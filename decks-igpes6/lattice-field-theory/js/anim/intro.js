/* Opening animations: critical Ising hero, the ladder of models, the running coupling, Wick rotation,
   a field seen through a grid, quantum mechanics by sampling paths, block-spin RG, Metropolis step by step.
   Every lattice is a live simulation from js/engines.js; reference curves are exact. */
(function () {
  'use strict';
  const { C, rgba } = U;
  const TAU = 2 * Math.PI, rand = Math.random, randn = LFT.randn, Tc = LFT.onsager.Tc;
  const UP = K.packHex(K.UP), DN = K.packHex(K.DN);

  // =====================================================================================
  // Title: a critical 2D Ising model (Wolff + Metropolis at T_c); the majority is always drawn navy.
  // =====================================================================================
  ANIMS.heroIsing = function (S, o) {
    const ctx = S.ctx, L = o.L || 192, m = new LFT.Ising(L);
    m.setBeta(1 / (o.T || Tc));
    for (let k = 0; k < 60; k++) m.wolffSweep();
    const img = K.img(L); let sign = 1;
    function draw() {
      S.clear();
      const mm = m.magnetization(); if (Math.abs(mm) > 0.12) sign = mm >= 0 ? 1 : -1;
      for (let i = 0; i < m.N; i++) img.px[i] = m.s[i] * sign > 0 ? UP : DN;
      img.put();
      ctx.save(); K.clipRound(ctx, 0, 0, S.w, S.h, o.r || 26); img.draw(ctx, 0, 0, S.w, S.h); ctx.restore();
    }
    function frame() { m.metropolisSweep(); for (let k = 0; k < 2; k++) m.wolffStep(); draw(); }
    draw();
    return { frame, draw, ff: 0.5 };
  };

  // =====================================================================================
  // The ladder of models: seven schematic tiles (ported from the notes, deck colours).
  // Ising · Potts · XY · φ⁴ on sites; U(1) · SU(2) · SU(3) on links (dials show eigenvalue phases).
  // =====================================================================================
  ANIMS.ladder = function (S, o) {
    const ctx = S.ctx, T = o.tile || 210, gap = (S.w - 7 * T) / 6, sc = T / 150;
    const n = 4, sp = 32, off = (150 - sp * (n - 1)) / 2, XY = (x, y) => [off + x * sp, off + y * sp], nb = LFT.nbr2(n);
    const nL = 3, spL = 46, offL = (150 - spL * (nL - 1)) / 2, R = 12.5, NL = 2 * nL * nL;
    const XYL = (x, y) => [offL + x * spL, offL + y * spL];
    const links = [];
    for (let y = 0; y < nL; y++) for (let x = 0; x < nL - 1; x++) links.push([x + 0.5, y, 2 * (y * nL + x)]);
    for (let y = 0; y < nL - 1; y++) for (let x = 0; x < nL; x++) links.push([x, y + 0.5, 2 * (y * nL + x) + 1]);
    function lattice() {
      ctx.strokeStyle = '#E6E1D6'; ctx.lineWidth = 1;
      for (let k = 0; k < n; k++) {
        const [x0, y0] = XY(-0.45, k), [x1] = XY(n - 0.55, k); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
        const [xa, ya] = XY(k, -0.45), [, yb] = XY(k, n - 0.55); ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xa, yb); ctx.stroke();
      }
    }
    function latticeL() {
      ctx.strokeStyle = '#D9D3C7'; ctx.lineWidth = 1.6;
      for (let k = 0; k < nL; k++) {
        const [x0, y0] = XYL(-0.5, k), [x1] = XYL(nL - 0.5, k); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
        const [xa, ya] = XYL(k, -0.5), [, yb] = XYL(k, nL - 0.5); ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xa, yb); ctx.stroke();
      }
      for (let y = 0; y < nL; y++) for (let x = 0; x < nL; x++) { const [px, py] = XYL(x, y); U.circle(ctx, px, py, 3, '#A9A39A'); }
    }
    const dial = (x, y) => U.circle(ctx, x, y, R, '#fff', '#CFC9BE', 1.2);
    const onDial = (x, y, a, r = R - 3.5) => [x + r * Math.cos(a), y - r * Math.sin(a)];
    const makers = [
      function ising() {
        const s = new Int8Array(16).map(() => rand() < 0.5 ? 1 : -1), ang = Float64Array.from(s, v => v * Math.PI / 2); let t = 0;
        return {
          step(dt) {
            t += dt;
            while (t > 0.11) { t -= 0.11; const i = (rand() * 16) | 0, h = s[nb[4 * i]] + s[nb[4 * i + 1]] + s[nb[4 * i + 2]] + s[nb[4 * i + 3]]; s[i] = rand() < 1 / (1 + Math.exp(-2 * 0.36 * h)) ? 1 : -1; }
            for (let i = 0; i < 16; i++) ang[i] += (s[i] * Math.PI / 2 - ang[i]) * Math.min(1, 12 * dt);
          },
          draw() { lattice(); for (let i = 0; i < 16; i++) { const [x, y] = XY(i % n, (i / n) | 0), up = Math.sin(ang[i]) > 0; K.arrowA(ctx, x, y, ang[i], 20, up ? C.navy : C.coral, 2.4, 0.42); } }
        };
      },
      function potts() {
        const cols = [K.CAT[0], K.CAT[1], K.CAT[2]], s = new Uint8Array(16).map(() => (rand() * 3) | 0), pop = new Float64Array(16); let t = 0;
        return {
          step(dt) {
            t += dt;
            while (t > 0.14) {
              t -= 0.14; const i = (rand() * 16) | 0, w = [0, 0, 0];
              for (let k = 0; k < 4; k++) w[s[nb[4 * i + k]]]++;
              const e = w.map(c => Math.exp(0.95 * c)), z = e[0] + e[1] + e[2], r = rand() * z, ns = r < e[0] ? 0 : r < e[0] + e[1] ? 1 : 2;
              if (ns !== s[i]) { s[i] = ns; pop[i] = 1; }
            }
            for (let i = 0; i < 16; i++) pop[i] = Math.max(0, pop[i] - 4 * dt);
          },
          draw() { lattice(); for (let i = 0; i < 16; i++) { const [x, y] = XY(i % n, (i / n) | 0); U.circle(ctx, x, y, 9 + 4 * pop[i], cols[s[i]], '#fff', 1.5); } }
        };
      },
      function xy() {
        const th = new Float64Array(16).map(() => TAU * rand());
        return {
          step(dt) {
            const eps = 0.7 * dt, f = new Float64Array(16);
            for (let i = 0; i < 16; i++) for (let k = 0; k < 4; k++) f[i] += Math.sin(th[nb[4 * i + k]] - th[i]);
            for (let i = 0; i < 16; i++) th[i] += eps * 1.1 * f[i] + Math.sqrt(2 * eps) * randn();
          },
          draw() { lattice(); for (let i = 0; i < 16; i++) { const [x, y] = XY(i % n, (i / n) | 0); K.arrowA(ctx, x, y, th[i], 21, K.cycCss(th[i]), 2.4, 0.42); } }
        };
      },
      function phi4() {
        const f = new LFT.Phi4(n); f.kappa = 0.3; f.lambda = 0.7; for (let i = 0; i < 16; i++) f.phi[i] = 0.9 + 0.3 * randn();
        const F = new Float64Array(16);
        return {
          step(dt) { const eps = 0.5 * dt; f.force(f.phi, F); for (let i = 0; i < 16; i++) f.phi[i] += eps * F[i] + Math.sqrt(2 * eps) * randn(); },
          draw() {
            lattice();
            for (let i = 0; i < 16; i++) {
              const [x, y] = XY(i % n, (i / n) | 0), v = Math.max(-1.7, Math.min(1.7, f.phi[i])), h = 9 * v;
              ctx.fillStyle = v > 0 ? C.coral : C.blue; ctx.fillRect(x - 4, Math.min(y, y - h), 8, Math.abs(h)); U.circle(ctx, x, y, 2.4, C.ink);
            }
          }
        };
      },
      function u1() {
        const u = new LFT.U1_2D(nL); u.hot();
        return {
          step(dt) { const eps = 0.45 * dt; u.flowStep(eps * 1.2); for (let l = 0; l < NL; l++) u.th[l] = LFT.wrap(u.th[l] + Math.sqrt(2 * eps) * randn()); },
          draw() {
            latticeL();
            for (const [lx, ly, l] of links) {
              const [x, y] = XYL(lx, ly), a = u.th[l], [px, py] = onDial(x, y, a); dial(x, y);
              ctx.strokeStyle = K.cycCss(a); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px, py); ctx.stroke(); U.circle(ctx, px, py, 2.8, K.cycCss(a));
            }
          }
        };
      },
      function su2() {
        const al = new Float64Array(NL).map(() => 0.3 + 2.5 * rand());
        return {
          step(dt) {
            const D = 0.3 * dt;
            for (let l = 0; l < NL; l++) {
              const a = al[l]; let na = a + D * (2 / Math.tan(a) - 2.2 * Math.sin(a)) + Math.sqrt(2 * D) * randn();
              if (na < 0.03) na = 0.06 - na; if (na > Math.PI - 0.03) na = 2 * Math.PI - 0.06 - na;
              al[l] = Math.max(0.03, Math.min(Math.PI - 0.03, na));
            }
          },
          draw() {
            latticeL();
            for (const [lx, ly, l] of links) {
              const [x, y] = XYL(lx, ly), a = al[l], [p1x, p1y] = onDial(x, y, a), [p2x, p2y] = onDial(x, y, -a); dial(x, y);
              ctx.strokeStyle = '#D9D3C7'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y); ctx.stroke();
              U.circle(ctx, p1x, p1y, 3, C.blue); U.circle(ctx, p2x, p2y, 3, C.coral);
            }
          }
        };
      },
      function su3() {
        const A = new Float64Array(2 * NL).map(() => 2 * rand() - 1);
        const logp = (a1, a2) => { const a3 = -a1 - a2, s = (u, v) => Math.log(Math.max(1e-9, Math.sin((u - v) / 2) ** 2)); return s(a1, a2) + s(a2, a3) + s(a1, a3) + 1.6 * (Math.cos(a1) + Math.cos(a2) + Math.cos(a3)); };
        return {
          step(dt) {
            const D = 0.25 * dt, h = 1e-4;
            for (let l = 0; l < NL; l++) {
              const a1 = A[2 * l], a2 = A[2 * l + 1], p = logp(a1, a2);
              const g1 = Math.max(-30, Math.min(30, (logp(a1 + h, a2) - p) / h)), g2 = Math.max(-30, Math.min(30, (logp(a1, a2 + h) - p) / h));
              A[2 * l] = LFT.wrap(a1 + D * g1 + Math.sqrt(2 * D) * randn()); A[2 * l + 1] = LFT.wrap(a2 + D * g2 + Math.sqrt(2 * D) * randn());
            }
          },
          draw() {
            latticeL(); const cols = [C.red, C.green, C.blue];
            for (const [lx, ly, l] of links) {
              const [x, y] = XYL(lx, ly), a = [A[2 * l], A[2 * l + 1], -A[2 * l] - A[2 * l + 1]]; dial(x, y);
              for (let k = 0; k < 3; k++) { const [px, py] = onDial(x, y, a[k]); U.circle(ctx, px, py, 2.8, cols[k]); }
            }
          }
        };
      }
    ];
    const tiles = makers.map(f => f());
    function draw() {
      S.clear();
      tiles.forEach((t, k) => {
        const x = k * (T + gap);
        ctx.save(); ctx.translate(x, 0);
        ctx.save(); ctx.shadowColor = 'rgba(31,41,51,0.08)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3; U.roundRect(ctx, 0, 0, T, T, 16, '#fff'); ctx.restore();
        if (k >= 4) { ctx.save(); U.roundRect(ctx, 0, 0, T, T, 16, null, rgba(C.violet, 0.35), 2); ctx.restore(); }
        ctx.scale(sc, sc); t.draw(); ctx.restore();
      });
    }
    function frame(dt) { for (const t of tiles) t.step(Math.min(dt, 0.05)); draw(); }
    for (let k = 0; k < 30; k++) tiles.forEach(t => t.step(0.033));
    draw();
    return { frame, draw, ff: 0.5 };
  };

  // =====================================================================================
  // The running strong coupling (one loop, five flavours, α_s(M_Z) = 0.118); drawn in from high Q.
  // =====================================================================================
  ANIMS.alphas = function (S, o) {
    const ctx = S.ctx, MZ = 91.1876, a0 = 0.118, b0 = 23 / (12 * Math.PI);
    const as = (Q) => { const d = 1 + a0 * b0 * Math.log(Q * Q / (MZ * MZ)); return d > 0 ? a0 / d : NaN; };
    const P = K.plot(ctx, { x: 96, y: 26, w: S.w - 130, h: S.h - 130 }, {
      x: [0.5, 1000], y: [0, 0.6], logx: true, xt: K.ticks([1, 10, 100, 1000], v => v >= 1000 ? '1000' : String(v)),
      yt: K.ticks([0, 0.2, 0.4, 0.6], v => v.toFixed(1)), xl: 'energy scale Q (GeV)', yl: 'coupling strength', fs: 20
    });
    let t = 0;
    function draw() {
      S.clear();
      ctx.save(); ctx.fillStyle = rgba(C.coral, 0.10); ctx.fillRect(P.X(0.5), P.b.y, P.X(2) - P.X(0.5), P.b.h); ctx.restore();
      P.axes();
      K.label(ctx, 'lattice territory', P.X(0.56), P.Y(0.565), { size: 21, color: '#B4492F', weight: 700 });
      K.label(ctx, 'no small parameter', P.X(0.56), P.Y(0.522), { size: 18, color: C.inkSoft });
      ctx.save(); ctx.strokeStyle = rgba(C.inkSoft, 0.6); ctx.lineWidth = 1.6; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(P.X(0.938), P.Y(0)); ctx.lineTo(P.X(0.938), P.Y(0.47)); ctx.stroke(); ctx.restore();
      K.label(ctx, 'proton mass', P.X(0.938) + 8, P.Y(0.03), { size: 18, color: C.inkSoft });
      P.hline(1 / 137.036, C.blue, 2.2, [8, 6]);
      K.label(ctx, 'electromagnetism: α ≈ 1/137', P.X(120), P.Y(1 / 137) - 12, { size: 19, color: C.blue, weight: 600, align: 'center' });
      const f = K.smooth(t / 1.6), qlo = Math.pow(10, Math.log10(1000) - f * (Math.log10(1000) - Math.log10(0.5)));
      ctx.save(); P.clip(); P.fn(as, C.coral, 4, null, 300, Math.max(0.5, qlo), 1000); ctx.restore();
      if (f > 0.15) { P.dots([MZ], [a0], C.coral, 7); K.label(ctx, 'α_s(M_Z) = 0.118', P.X(MZ), P.Y(a0) - 18, { size: 19, color: C.ink, align: 'center', weight: 600 }); }
      K.label(ctx, 'strong force α_s(Q)', P.X(4.6), P.Y(as(4.6)) - 18, { size: 20, color: '#B4492F', weight: 700, alpha: K.smooth((t - 1.2) / 0.5) });
      K.label(ctx, 'perturbation theory works', P.X(100), P.Y(0.30), { size: 20, color: C.inkSoft, align: 'center' });
    }
    return { frame(dt) { if (t < 2) { t += dt; draw(); } }, draw, enter() { t = 0; }, ff: 2.2 };
  };

  // =====================================================================================
  // Wick rotation: the weight e^{i e^{iϑ} S(x)} for S = x²/2 + x⁴/4, ϑ = 0 → 90° after the click.
  // =====================================================================================
  ANIMS.wick = function (S, o) {
    const ctx = S.ctx, Sx = (x) => x * x / 2 + x ** 4 / 4, N = 900;
    const xs = new Float64Array(N), re = new Float64Array(N), im = new Float64Array(N), mod = new Float64Array(N);
    for (let i = 0; i < N; i++) xs[i] = -3.2 + 6.4 * i / (N - 1);
    const P = K.plot(ctx, { x: 430, y: 40, w: S.w - 460, h: S.h - 140 }, {
      x: [-3.2, 3.2], y: [-1.1, 1.1], xt: K.ticks([-3, -2, -1, 0, 1, 2, 3], v => (v < 0 ? '−' : '') + Math.abs(v)), yt: K.ticks([-1, 0, 1], v => (v < 0 ? '−' : '') + Math.abs(v)),
      xl: 'field value x', yl: 'weight', fs: 19, ylo: 44
    });
    let th = 0, target = 0;
    function draw() {
      S.clear();
      const c = Math.cos(th), s = Math.sin(th);
      for (let i = 0; i < N; i++) { const v = Sx(xs[i]), m = Math.exp(-v * s); re[i] = m * Math.cos(v * c); im[i] = m * Math.sin(v * c); mod[i] = m; }
      P.axes(); P.hline(0, C.faint, 1.4);
      ctx.save(); P.clip();
      P.line(xs, mod, C.steel, 2, [7, 5]); P.line(xs, im, C.coral, 2.4, null, 1 - 0.85 * s); P.line(xs, re, C.blue, 3.2);
      ctx.restore();
      K.legend(ctx, P.b.x + 10, 28, [{ label: 'real part', color: C.blue }, { label: 'imaginary part', color: C.coral }, { label: 'modulus', color: C.steel, kind: 'dash' }], { size: 18 });
      // complex time plane
      const ox = 110, oy = 110, Rr = 250;
      ctx.save(); ctx.strokeStyle = rgba(C.inkSoft, 0.7); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(30, oy); ctx.lineTo(380, oy); ctx.moveTo(ox, 30); ctx.lineTo(ox, 400); ctx.stroke(); ctx.restore();
      K.label(ctx, 'real time t', 380, oy - 12, { size: 18, align: 'right', color: C.inkSoft });
      ctx.save(); ctx.strokeStyle = rgba(C.coral, 0.55); ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, oy, 80, 0, th, false); ctx.stroke(); ctx.restore();
      K.label(ctx, 'ϑ', ox + 96 * Math.cos(th / 2), oy + 96 * Math.sin(th / 2) + 8, { size: 22, color: '#B4492F', weight: 700, italic: true });
      K.arrowA(ctx, ox, oy, -th, Rr, C.coral, 3.4, 0.08, false);
      const tx = ox + Rr * Math.cos(th), ty = oy + Rr * Math.sin(th);
      K.label(ctx, th > 1.2 ? 'imaginary time τ' : 'time axis', tx + (th > 1.2 ? 14 : 0), ty + (th > 1.2 ? -4 : 30), { size: 19, color: '#B4492F', weight: 650, align: th > 1.2 ? 'left' : 'right' });
      U.circle(ctx, ox, oy, 4, C.ink);
      K.label(ctx, `ϑ = ${Math.round(th * 180 / Math.PI)}°`, 40, 470, { size: 26, color: C.ink, weight: 700 });
      K.label(ctx, th < 0.02 ? 'e^{iS}: modulus 1, oscillates' : th > 1.55 ? 'e^{−S}: real, positive, peaked' : 'rotating…', 40, 506, { size: 21, color: th > 1.55 ? C.tealDark : C.inkSoft, weight: 600 });
    }
    function frame(dt) { const d = target - th; if (Math.abs(d) > 1e-4) { th += Math.sign(d) * Math.min(Math.abs(d), dt * 0.75); draw(); } }
    return { frame, draw, step(s) { target = s >= 1 ? Math.PI / 2 : 0; }, ff: 3 };
  };

  // =====================================================================================
  // A smooth field seen through grids of spacing a = 32, 16, 8, 4 (cycles); the field drifts slowly.
  // =====================================================================================
  ANIMS.discretize = function (S, o) {
    const ctx = S.ctx, n = 128, g = new LFT.GFF(n), m = 0.09, A = [32, 16, 8, 4];
    const box = Math.min(S.h - 70, (S.w - 70) / 2), x2 = S.w - box, img = K.img(n);
    let t = 0, k = 0;
    function draw() {
      S.clear();
      const fld = g.compute(m, 2);
      for (let i = 0; i < n * n; i++) img.px[i] = K.DIV[K.divIdx(fld[i], 2.6)];
      img.put();
      ctx.save(); K.clipRound(ctx, 0, 0, box, box, 14); img.draw(ctx, 0, 0, box, box, true); ctx.restore();
      const a = A[k], M = n / a, q = box / n;
      ctx.save(); K.clipRound(ctx, x2, 0, box, box, 14);
      for (let J = 0; J < M; J++) for (let I = 0; I < M; I++) {
        const x = Math.min(n - 1, Math.floor(I * a + a / 2)), y = Math.min(n - 1, Math.floor(J * a + a / 2));
        ctx.fillStyle = K.divCss(fld[y * n + x], 2.6); ctx.fillRect(x2 + I * a * q, J * a * q, a * q + 0.6, a * q + 0.6);
      }
      if (a >= 8) {
        ctx.strokeStyle = 'rgba(31,41,51,.18)'; ctx.lineWidth = 1;
        for (let I = 1; I < M; I++) { ctx.beginPath(); ctx.moveTo(x2 + I * a * q, 0); ctx.lineTo(x2 + I * a * q, box); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x2, I * a * q); ctx.lineTo(x2 + box, I * a * q); ctx.stroke(); }
        for (let J = 0; J < M; J++) for (let I = 0; I < M; I++) U.circle(ctx, x2 + (I + 0.5) * a * q, (J + 0.5) * a * q, a >= 16 ? 4 : 2.6, 'rgba(31,41,51,.7)');
      }
      ctx.restore();
      K.label(ctx, 'smooth field φ(x)', box / 2, box + 40, { size: 22, color: C.ink, weight: 650, align: 'center' });
      K.label(ctx, `grid spacing a: ${M} × ${M} = ${M * M} variables`, x2 + box / 2, box + 40, { size: 22, color: C.ink, weight: 650, align: 'center' });
      K.arrowA(ctx, box + (x2 - box) / 2, box / 2, 0, (x2 - box) * 0.6, C.steel, 3, 0.3);
    }
    function frame(dt) { t += dt; if (t > 2.2) { t = 0; k = (k + 1) % A.length; } g.evolve(0.01); draw(); }
    draw();
    return { frame, draw, ff: 0.2 };
  };

  // =====================================================================================
  // Quantum mechanics by sampling paths (Creutz & Freedman 1981). Builds: 0 harmonic path + density,
  // 1 + effective mass, 2 double well (instantons). Grey curves are exact (transfer matrix).
  // =====================================================================================
  ANIMS.qmPaths = function (S, o) {
    const ctx = S.ctx, a = 0.5, N = Math.round(16 / a), nb = Math.floor(N / 2) + 1, cache = {};
    const PA = K.plot(ctx, { x: 90, y: 56, w: S.w - 530, h: 270 }, { x: [0, 16], y: [-3, 3], xt: K.ticks([0, 4, 8, 12, 16]), yt: K.ticks([-2, 0, 2], v => (v < 0 ? '−' : '') + Math.abs(v)), xl: 'Euclidean time τ', yl: 'position x', fs: 18, ylo: 48 });
    const PB = K.plot(ctx, { x: S.w - 310, y: 56, w: 300, h: 270 }, { x: [-3, 3], y: [0, 0.75], xt: K.ticks([-2, 0, 2], v => (v < 0 ? '−' : '') + Math.abs(v)), yt: [], xl: 'position x', fs: 18 });
    const PD = K.plot(ctx, { x: 90, y: 474, w: S.w - 100, h: 140 }, { x: [0, 8], y: [0, 2], xt: K.ticks([0, 2, 4, 6, 8]), yt: K.ticks([0, 1, 2]), xl: 'Euclidean time τ', yl: 'm_eff(τ)', fs: 18, ylo: 48 });
    let pot = null, ex, ch, hist, nmeas, block, blocks, ghosts, step = -1, sweeps, tg = 0;
    function reset(p) {
      pot = p; ex = cache[p] || (cache[p] = LFT.qmExact(p, a, N, 121));
      ch = new LFT.QMChain(N, a, p); if (p === 'harmonic') ch.x.fill(0);
      hist = K.Hist(60, -3, 3); nmeas = 0; block = new Float64Array(nb); blocks = []; ghosts = []; sweeps = 0;
      PB.setY(0, p === 'harmonic' ? 0.75 : 0.65); PD.setY(0, p === 'harmonic' ? 2 : 1);
      PD.o.yt = p === 'harmonic' ? K.ticks([0, 1, 2]) : K.ticks([0, 0.5, 1]);
      PA.o.yt = K.ticks(p === 'harmonic' ? [-2, 0, 2] : [-1.4, 0, 1.4], v => (v < 0 ? '−' : '') + Math.abs(v));
      for (let k = 0; k < (p === 'double' ? 3000 : 400); k++) { ch.sweep(); sweeps++; if (sweeps > 100) measure(); }
    }
    function measure() {
      const x = ch.x;
      for (let i = 0; i < N; i++) hist.add(x[i]);
      for (let t = 0; t < nb; t++) { let s = 0; for (let i = 0; i < N; i++) s += x[i] * x[(i + t) % N]; block[t] += s / N; }
      nmeas++;
      if (nmeas % 50 === 0) { blocks.push(Float64Array.from(block, v => v / 50)); block.fill(0); if (blocks.length > 120) blocks.shift(); }
    }
    function meffCosh(c0, c1, t) {
      const r = c0 / c1, h = N / 2; if (!(r > 1) || t + 1 > h) return NaN;
      const g = (mm) => Math.cosh(mm * (t - h)) / Math.cosh(mm * (t + 1 - h));
      let lo = 0, hi = 30; if (g(hi) < r) return NaN;
      for (let k = 0; k < 60; k++) { const mid = 0.5 * (lo + hi); if (g(mid) < r) lo = mid; else hi = mid; }
      return 0.5 * (lo + hi);
    }
    function analyse() {
      const B = blocks.length; if (B < 4) return null;
      const mean = new Float64Array(nb); for (const b of blocks) for (let t = 0; t < nb; t++) mean[t] += b[t] / B;
      const jk = blocks.map(b => Float64Array.from(mean, (mm, t) => (mm * B - b[t]) / (B - 1)));
      const meff = new Float64Array(nb - 1), merr = new Float64Array(nb - 1);
      for (let t = 0; t < nb - 1; t++) {
        meff[t] = meffCosh(mean[t], mean[t + 1], t) / a;
        let v = 0; for (const j of jk) { const mj = meffCosh(j[t], j[t + 1], t) / a; v += (mj - meff[t]) ** 2; }
        merr[t] = Math.sqrt(v * (B - 1) / B);
      }
      return { meff, merr };
    }
    function draw() {
      S.clear();
      // path
      PA.axes();
      if (pot === 'double') { PA.hline(1.4, C.faint, 1.6, [6, 6]); PA.hline(-1.4, C.faint, 1.6, [6, 6]); } else PA.hline(0, C.faint, 1.4);
      const ts = Float64Array.from({ length: N + 1 }, (_, i) => i * a), xs = Float64Array.from({ length: N + 1 }, (_, i) => ch.x[i % N]);
      ctx.save(); PA.clip();
      ghosts.forEach((gh, k) => PA.line(ts, gh, C.blue, 1.4, null, 0.10 + 0.04 * k));
      PA.line(ts, xs, C.blue, 3); PA.dots(ts, xs, C.blue, 4, '#fff');
      ctx.restore();
      K.label(ctx, pot === 'harmonic' ? 'a random path, V = x²/2' : 'a random path, double well', PA.b.x, 30, { size: 21, color: C.ink, weight: 650 });
      // density
      PB.axes();
      ctx.save(); PB.clip();
      if (hist.tot) PB.bars(hist.edges(), hist.density(), rgba(C.blue, 0.45));
      PB.line(ex.xs, ex.p, C.ink, 2.6);
      ctx.restore();
      K.label(ctx, 'where the particle is', PB.b.x, 22, { size: 21, color: C.ink, weight: 650 });
      K.label(ctx, 'bars: samples · line: exact |ψ₀|²', PB.b.x, 46, { size: 16, color: C.inkSoft });
      // effective mass
      if (step >= 1) {
        PD.axes();
        const r = analyse(), tt = Float64Array.from({ length: nb - 1 }, (_, t) => t * a);
        const exm = Float64Array.from(tt, (_, t) => meffCosh(ex.C[t], ex.C[t + 1], t) / a);
        if (pot === 'harmonic') PD.hline(1, rgba(C.inkSoft, 0.5), 1.4, [2, 4]);
        PD.hline(ex.gaps[0], C.ink, 2, [8, 6]); PD.line(tt, exm, C.steel, 1.8);
        if (r) {
          const X2 = [], Y2 = [], E2 = [];
          tt.forEach((t, k) => { if (r.merr[k] < 0.5 && Number.isFinite(r.meff[k])) { X2.push(t); Y2.push(r.meff[k]); E2.push(r.merr[k]); } });
          PD.err(X2, Y2, E2, C.coral, 2); PD.dots(X2, Y2, C.coral, 6);
        }
        K.label(ctx, `effective mass m_eff(τ) = ln C(τ)/C(τ+a): plateau = energy gap E₁ − E₀ (exact here ${ex.gaps[0].toFixed(3)})`, PD.b.x, PD.b.y - 26, { size: 20, color: C.ink, weight: 650 });
      }
    }
    function frame(dt) {
      for (let k = 0; k < (pot === 'double' ? 40 : 16); k++) { ch.sweep(); sweeps++; if (sweeps > 100) measure(); }
      tg += dt; if (tg > 0.25) { tg = 0; ghosts.push(Float64Array.from({ length: N + 1 }, (_, i) => ch.x[i % N])); if (ghosts.length > 6) ghosts.shift(); }
      draw();
    }
    reset('harmonic');
    return { frame, draw, step(s) { step = s; const p = s >= 2 ? 'double' : 'harmonic'; if (p !== pot) reset(p); }, ff: 4 };
  };

  // =====================================================================================
  // Block spins: three temperatures × four levels of 2×2 majority coarse-graining (L = 256).
  // =====================================================================================
  ANIMS.rgBlocks = function (S, o) {
    const ctx = S.ctx, L = 256, Ts = [0.95 * Tc, Tc, 1.05 * Tc], sizes = [256, 128, 64, 32];
    const P = o.panel || 150, gx = o.gapx || 26, gy = o.gapy || 26, x0 = S.w - (4 * P + 3 * gx) - 14, y0 = 44;
    const rows = Ts.map(T => {
      const m = new LFT.Ising(L); m.setBeta(1 / T);
      if (T < Tc) m.fill(1);
      for (let k = 0; k < 2; k++) m.wolffSweep();
      return { m, bufs: sizes.map(s => new Int8Array(s * s)), imgs: sizes.map(s => K.img(s)), sign: 1 };
    });
    const labels = [['T = 0.95 T_c', 'flows to order'], ['T = T_c', 'looks the same'], ['T = 1.05 T_c', 'flows to noise']];
    let hl = 0;
    function draw() {
      S.clear();
      ['original 256²', '2×2 blocks → 128²', '4×4 → 64²', '8×8 → 32²'].forEach((t, k) => K.label(ctx, t, x0 + k * (P + gx) + P / 2, 26, { size: 18, color: C.inkSoft, align: 'center', weight: 600 }));
      rows.forEach((r, j) => {
        const y = y0 + j * (P + gy);
        r.bufs[0].set(r.m.s);
        for (let k = 1; k < 4; k++) LFT.blockSpin(r.bufs[k - 1], sizes[k - 1], 2, r.bufs[k]);
        const mm = r.m.magnetization(); if (Math.abs(mm) > 0.1) r.sign = mm >= 0 ? 1 : -1;
        for (let k = 0; k < 4; k++) {
          const b = r.bufs[k], px = r.imgs[k].px; for (let i = 0; i < b.length; i++) px[i] = b[i] * r.sign > 0 ? UP : DN;
          r.imgs[k].put();
          const x = x0 + k * (P + gx);
          ctx.save(); K.clipRound(ctx, x, y, P, P, 8); r.imgs[k].draw(ctx, x, y, P, P); ctx.restore();
          if (k < 3) K.label(ctx, '→', x + P + gx / 2, y + P / 2 + 8, { size: 22, color: C.steel, align: 'center' });
        }
        const isC = j === 1;
        K.label(ctx, labels[j][0], x0 - 24, y + P / 2 - 6, { size: 22, color: isC ? C.navy : C.ink, weight: 700, align: 'right' });
        K.label(ctx, labels[j][1], x0 - 24, y + P / 2 + 22, { size: 18, color: isC ? C.tealDark : C.inkSoft, align: 'right', weight: isC ? 650 : 500 });
        if (isC && hl) { ctx.save(); U.roundRect(ctx, x0 - 10, y - 10, 4 * P + 3 * gx + 20, P + 20, 14, null, C.teal, 3.5); ctx.restore(); }
      });
    }
    let warm = 90;   // the first frames spend extra time on Wolff clusters, so the slide opens instantly and equilibrates in ~1.5 s
    // Wolff alone is ergodic here (h = 0); no Metropolis sweeps keeps three 256² lattices within the frame budget
    function frame() { const ms = warm-- > 0 ? 5 : 2; for (const r of rows) K.budget(ms, () => { r.m.wolffStep(); }, warm > 0 ? 400 : 6); draw(); }
    return { frame, draw, step(s) { hl = s >= 1 ? 1 : 0; }, ff: 2 };
  };

  // =====================================================================================
  // Metropolis, one spin at a time, on an 8×8 Ising model at T = 2 (ported from the notes).
  // =====================================================================================
  ANIMS.metroSteps = function (S, o) {
    const ctx = S.ctx, L = 8, m = new LFT.Ising(L), T = o.T || 2.0, box = Math.min(S.h - 20, o.box || 560), cell = box / L, nbI = m.nb;
    m.setBeta(1 / T);
    let cur = -1, phase = 0, st = null, nprop = 0, nacc = 0, flipAnim = 0, t = 0;
    function start() {
      const i = (rand() * m.N) | 0, j = 4 * i, s = m.s[i], h = m.s[nbI[j]] + m.s[nbI[j + 1]] + m.s[nbI[j + 2]] + m.s[nbI[j + 3]];
      const dE = 2 * s * h, p = Math.min(1, Math.exp(-dE / T)), u = rand();
      st = { i, s, h, dE, p, u, acc: u < p, done: false }; cur = i; phase = 0; flipAnim = 0;
    }
    function reveal() {
      if (phase >= 6 && st && !st.done) { st.done = true; nprop++; if (st.acc) { nacc++; m.s[st.i] = -m.s[st.i]; flipAnim = 1; } }
    }
    function draw() {
      S.clear();
      for (let i = 0; i < m.N; i++) {
        const x = (i % L) * cell, y = ((i / L) | 0) * cell, up = m.s[i] > 0;
        ctx.fillStyle = up ? '#DCE6F3' : '#F8E2D8'; ctx.fillRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        let ang = up ? Math.PI / 2 : -Math.PI / 2;
        if (i === cur && flipAnim > 0) ang += (up ? -1 : 1) * Math.PI * flipAnim;
        K.arrowA(ctx, x + cell / 2, y + cell / 2, ang, cell * 0.62, up ? C.navy : '#B4492F', 4, 0.36);
      }
      if (cur >= 0 && st) {
        const j = 4 * cur;
        for (let k = 0; k < 4; k++) { const n2 = nbI[j + k], x = (n2 % L) * cell, y = ((n2 / L) | 0) * cell; ctx.strokeStyle = phase >= 2 ? C.ink : 'rgba(31,41,51,.25)'; ctx.lineWidth = 4; ctx.strokeRect(x + 3, y + 3, cell - 6, cell - 6); }
        const x = (cur % L) * cell, y = ((cur / L) | 0) * cell; ctx.strokeStyle = C.gold; ctx.lineWidth = 6; ctx.strokeRect(x + 3, y + 3, cell - 6, cell - 6);
      }
      // read-out
      const rx = box + 50, rw = S.w - rx; let y = 40;
      K.label(ctx, 'one Metropolis step', rx, y, { size: 24, color: C.ink, weight: 700 }); y += 50;
      const rows = st ? [
        ['spin s_i', phase >= 1 ? (st.s > 0 ? '+1' : '−1') : '…'],
        ['neighbours Σ s_j', phase >= 2 ? (st.h > 0 ? '+' : st.h < 0 ? '−' : '') + Math.abs(st.h) : '…'],
        ['ΔE = 2 s_i Σ s_j', phase >= 3 ? (st.dE > 0 ? '+' : st.dE < 0 ? '−' : '') + Math.abs(st.dE) : '…'],
        ['p = min(1, e^{−ΔE/T})', phase >= 4 ? (st.p >= 1 ? '1' : st.p.toFixed(3)) : '…'],
        ['uniform u', phase >= 5 ? st.u.toFixed(3) : '…']
      ] : [];
      for (const [k, v] of rows) {
        K.label(ctx, k, rx, y, { size: 21, color: C.inkSoft });
        K.label(ctx, v, rx + rw - 10, y, { size: 23, color: C.ink, weight: 700, align: 'right' });
        ctx.save(); ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx, y + 14); ctx.lineTo(rx + rw - 10, y + 14); ctx.stroke(); ctx.restore();
        y += 52;
      }
      if (st && phase >= 6) {
        const ok = st.acc, col = ok ? C.tealDark : '#B4492F';
        ctx.save(); U.roundRect(ctx, rx, y - 8, rw - 10, 54, 12, ok ? rgba(C.teal, 0.12) : rgba(C.coral, 0.12)); ctx.restore();
        K.label(ctx, ok ? (st.p >= 1 ? 'downhill: accept, flip' : 'u < p: accept, flip') : 'u ≥ p: reject, keep', rx + 18, y + 27, { size: 23, color: col, weight: 700 });
      }
      y += 90;
      if (nprop) K.label(ctx, `${nprop} proposals · ${Math.round(100 * nacc / nprop)}% accepted · T = ${T}`, rx, y, { size: 19, color: C.muted });
    }
    function frame(dt) {
      if (!st || (st.done && phase >= 8)) start();
      t += dt * 3.0; while (t > 1) { t -= 1; phase += 1; reveal(); }
      if (flipAnim > 0) flipAnim = Math.max(0, flipAnim - dt * 2.5);
      draw();
    }
    for (let k = 0; k < 6; k++) m.metropolisSweep();
    for (let k = 0; k < 400; k++) { start(); phase = 6; reveal(); }
    start(); phase = 6; reveal();
    return { frame, draw, ff: 0.4 };
  };
})();
