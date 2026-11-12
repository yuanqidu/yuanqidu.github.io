/* Materials intro: three condensed-phase systems (glass, alloy, catalytic surface in a gas), and local-move
   Monte Carlo in a liquid vs. a glass with the energy-landscape picture of barrier crossing underneath. */
(function () {
  'use strict';
  const { C, rgba, E, atom, roundRect, text, makeRng, wiggle, wrap01 } = U;
  const HID = -1e9; // "not revealed yet" time stamp

  function byType(cfg) { const idx = []; for (let i = 0; i < cfg.N; i++) idx.push(i); idx.sort((a, b) => cfg.t[a] - cfg.t[b]); return idx; }
  // one particle of a periodic cell, with the copies that cross the edges of the box
  function cellAtom(ctx, bx, by, B, fx, fy, r, col) {
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const X = bx + (fx + ox) * B, Y = by + (fy + oy) * B;
      if (X < bx - r || X > bx + B + r || Y < by - r || Y > by + B + r) continue;
      atom(ctx, X, Y, r, col);
    }
  }

  // ------------------------------------------------------------------
  // A metal surface in contact with a gas (schematic), in a box of size B (coordinates from its top-left corner).
  // Side view of a close-packed slab; diatomic molecules move in the gas above it. A molecule that arrives over two
  // free neighbouring hollow sites adsorbs as two atoms; two neighbouring adatoms recombine and leave; adatoms hop.
  // The number of atoms is conserved, so gas and surface settle into a dynamic equilibrium.
  // ------------------------------------------------------------------
  function surfaceGas(B, seed) {
    const NS = 8, A = B / NS, RM = 0.47 * A, RH = 0.235 * A, DY = 0.87 * A, NLAY = 4;
    const yTop = B - (NLAY - 1) * DY - 0.62 * RM;                  // centres of the top metal layer
    const RR = RM + RH, PHI0 = Math.asin(0.5 * A / RR), ySite = yTop - RR * Math.cos(PHI0); // an adatom rests in a hollow
    const DB = 1.7 * RH, V0 = 0.22 * B, yHit = ySite - 0.5 * A, PAD = RH + DB / 2 + 3;
    const TA = 0.42, TD = 0.45, TH = 0.36, KD = 0.14, KH = 0.08, PSTICK = 0.8;
    const siteX = (i) => (i + 0.5) * A;                             // hollows; the top-layer atoms sit at i * A
    let rng, mols, occ, trans;                                      // occ: 0 free, 1 adatom at rest, 2 atom arriving, 3 atom leaving
    function newMol(x, y, up) {
      const a = up ? -(0.25 + 0.5 * rng.u()) * Math.PI : 2 * Math.PI * rng.u();
      return { x, y, vx: V0 * Math.cos(a), vy: V0 * Math.sin(a), th: up ? 0 : Math.PI * rng.u(), om: (rng.u() < 0.5 ? -1 : 1) * (0.8 + 1.4 * rng.u()) };
    }
    function reset() {
      rng = makeRng(seed); occ = new Uint8Array(NS); trans = []; mols = [];
      [1, 2, 5, 6].forEach(i => { occ[i] = 1; });
      [[0.16, 0.12], [0.62, 0.05], [0.86, 0.5], [0.38, 0.62], [0.12, 0.85], [0.66, 0.9]].forEach(([fx, fy]) => mols.push(newMol(PAD + fx * (B - 2 * PAD), PAD + fy * (yHit - PAD), false)));
    }
    reset();
    function step(dt) {
      for (const m of mols) {
        m.x += m.vx * dt; m.y += m.vy * dt; m.th += m.om * dt;
        if (m.x < PAD) { m.x = PAD; m.vx = Math.abs(m.vx); } else if (m.x > B - PAD) { m.x = B - PAD; m.vx = -Math.abs(m.vx); }
        if (m.y < PAD) { m.y = PAD; m.vy = Math.abs(m.vy); }
      }
      for (let i = 0; i < mols.length; i++) for (let j = i + 1; j < mols.length; j++) { // elastic encounters in the gas
        const a = mols[i], b = mols[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, dmin = 2 * RH + DB;
        if (d2 < dmin * dmin && d2 > 1e-6) {
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) { a.vx += rel * nx; a.vy += rel * ny; b.vx -= rel * nx; b.vy -= rel * ny; }
        }
      }
      for (let k = mols.length - 1; k >= 0; k--) { // arrival at the surface: adsorb on two free neighbouring sites, or bounce
        const m = mols[k]; if (m.y < yHit || m.vy <= 0) continue;
        let best = -1, bd = 1.2 * A;
        for (let i = 0; i + 1 < NS; i++) if (!occ[i] && !occ[i + 1]) { const d = Math.abs(m.x - (i + 1) * A); if (d < bd) { bd = d; best = i; } }
        if (best >= 0 && rng.u() < PSTICK) {
          const c = Math.cos(m.th), s = Math.sin(m.th); let p1 = [m.x - DB / 2 * c, m.y - DB / 2 * s], p2 = [m.x + DB / 2 * c, m.y + DB / 2 * s];
          if (p1[0] > p2[0]) { const t = p1; p1 = p2; p2 = t; }     // the left atom takes the left site
          occ[best] = occ[best + 1] = 2; trans.push({ kind: 0, t: 0, a: p1, b: p2, i: best }); mols.splice(k, 1);
        } else { m.vy = -Math.abs(m.vy); m.y = yHit; }
      }
      for (let i = 0; i + 1 < NS; i++) if (occ[i] === 1 && occ[i + 1] === 1 && rng.u() < KD * dt) { occ[i] = occ[i + 1] = 3; trans.push({ kind: 1, t: 0, i }); }
      for (let i = 0; i < NS; i++) if (occ[i] === 1 && rng.u() < KH * dt) {
        const free = []; if (i > 0 && !occ[i - 1]) free.push(i - 1); if (i < NS - 1 && !occ[i + 1]) free.push(i + 1);
        if (free.length) { const j = free[rng.int(free.length)]; occ[i] = 3; occ[j] = 2; trans.push({ kind: 2, t: 0, i, j }); }
      }
      for (const tr of trans) tr.t += dt;
      trans = trans.filter(tr => {
        if (tr.t < (tr.kind === 0 ? TA : tr.kind === 1 ? TD : TH)) return true;
        if (tr.kind === 0) occ[tr.i] = occ[tr.i + 1] = 1;
        else if (tr.kind === 1) { occ[tr.i] = occ[tr.i + 1] = 0; mols.push(newMol((tr.i + 1) * A, ySite - 0.75 * A, true)); }
        else { occ[tr.i] = 0; occ[tr.j] = 1; }
        return false;
      });
    }
    function moving() { // positions of the atoms that are arriving, leaving or hopping
      const out = [];
      for (const tr of trans) {
        if (tr.kind === 0) {
          const u = E.inOut(tr.t / TA);
          out.push([tr.a[0] + (siteX(tr.i) - tr.a[0]) * u, tr.a[1] + (ySite - tr.a[1]) * u], [tr.b[0] + (siteX(tr.i + 1) - tr.b[0]) * u, tr.b[1] + (ySite - tr.b[1]) * u]);
        } else if (tr.kind === 1) {
          const u = E.inOut(tr.t / TD), xm = (tr.i + 1) * A, ym = ySite - 0.75 * A;
          out.push([siteX(tr.i) + (xm - DB / 2 - siteX(tr.i)) * u, ySite + (ym - ySite) * u], [siteX(tr.i + 1) + (xm + DB / 2 - siteX(tr.i + 1)) * u, ySite + (ym - ySite) * u]);
        } else { // over the surface atom between the two hollows
          const phi = (tr.j > tr.i ? 1 : -1) * (2 * E.inOut(tr.t / TH) - 1) * PHI0, xa = Math.max(tr.i, tr.j) * A;
          out.push([xa + RR * Math.sin(phi), yTop - RR * Math.cos(phi)]);
        }
      }
      return out;
    }
    return { step, reset, moving, mols: () => mols, occ: () => occ, NS, A, RM, RH, DY, NLAY, yTop, ySite, DB, siteX };
  }

  // ------------------------------------------------------------------
  // Three condensed-phase systems, one per build:
  // glass (real 2D Kob-Andersen snapshot), alloy (lattice Monte Carlo, neighbour swaps), catalytic surface in a gas (schematic).
  // No words under the boxes; {"labels": true} adds the one-word names.
  // ------------------------------------------------------------------
  ANIMS.condensedTrio = function (S, o) {
    const ctx = S.ctx; let clock = 0, step = 0;
    const LAB = !!o.labels, B = o.box || (LAB ? 356 : 412), PW = 520, GAP = (S.w - 3 * PW) / 2, Y0 = LAB ? 6 : 9;
    const PX = [0, 1, 2].map(k => k * (PW + GAP) + (PW - B) / 2); // left edge of each box
    const OFF = o.offset || 0;                                     // {"offset": n}: the first system appears on click n
    const shown = [OFF ? HID : -1, HID, HID];                      // time each panel appeared (HID: not yet)
    const names = ['glass', 'alloy', 'surface'];

    // ---- glass: real 2D Kob-Andersen configuration at T = 0.2 ----
    const g = KA_DATA['n64_T0.2'], gIdx = byType(g), sig = B / g.L;
    function drawGlass(bx) {
      ctx.save(); ctx.beginPath(); ctx.rect(bx, Y0, B, B); ctx.clip();
      for (const i of gIdx) {
        const fx = wrap01(g.x[2 * i] + 0.006 * wiggle(i * 1.3, clock * 3)), fy = wrap01(g.x[2 * i + 1] + 0.006 * wiggle(i * 2.1 + 5, clock * 3));
        cellAtom(ctx, bx, Y0, B, fx, fy, (g.t[i] ? 0.36 : 0.47) * sig, g.t[i] ? C.kaB : C.kaA);
      }
      ctx.restore();
    }

    // ---- alloy: square lattice, like neighbours attract (E = -J sum s_i s_j), Metropolis swaps of unlike neighbours ----
    const rngA = makeRng(o.seed || 31), n = 9, a = B / n, kT = o.kT || 2.6, RA = 26, DSW = 0.6; // kT in units of J (T_c = 2.27 J)
    const sp = new Int8Array(n * n), busy = new Uint8Array(n * n), bonds = [], nbA = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const s = j * n + i, nb = [];
      if (i > 0) nb.push(s - 1); if (i < n - 1) { nb.push(s + 1); bonds.push([s, s + 1]); }
      if (j > 0) nb.push(s - n); if (j < n - 1) { nb.push(s + n); bonds.push([s, s + n]); }
      nbA.push(nb);
    }
    { const order = rngA.shuffle([...Array(n * n).keys()]); order.forEach((s, k) => { sp[s] = k < (n * n) / 2 ? 1 : 0; }); }
    const spin = (s) => sp[s] ? 1 : -1;
    const field = (p, q) => { let h = 0; for (const s of nbA[p]) if (s !== q) h += spin(s); return h; };
    let swaps = [], accA = 0, nAtt = 0, nAcc = 0;
    function attempt(animate) {
      const [p, q] = bonds[rngA.int(bonds.length)]; nAtt++;
      if (sp[p] === sp[q] || busy[p] || busy[q]) return;
      const dE = -(spin(q) - spin(p)) * (field(p, q) - field(q, p));
      if (dE > 0 && rngA.u() >= Math.exp(-dE / kT)) return;
      const t = sp[p]; sp[p] = sp[q]; sp[q] = t; nAcc++;
      if (animate) { busy[p] = busy[q] = 1; swaps.push({ p, q, t: 0 }); }
    }
    for (let k = 0; k < 40000; k++) attempt(false); // start from an equilibrated configuration
    nAtt = 0; nAcc = 0;
    const sx = (s) => (s % n + 0.5) * a, sy = (s) => (Math.floor(s / n) + 0.5) * a;
    function drawAlloy(bx) {
      const r = 0.36 * a, moving = new Map();
      for (const w of swaps) {
        const th = Math.PI * E.inOut(w.t / DSW), c = Math.cos(th), sn = Math.sin(th);
        const mx = (sx(w.p) + sx(w.q)) / 2, my = (sy(w.p) + sy(w.q)) / 2;
        for (const [me, other] of [[w.p, w.q], [w.q, w.p]]) { // the atom now on `me` came from `other`: half a turn around the bond centre
          const dx = sx(other) - mx, dy = sy(other) - my;
          moving.set(me, [mx + c * dx - sn * dy, my + sn * dx + c * dy]);
        }
      }
      const draw1 = (s, x, y) => atom(ctx, bx + x + 2 * wiggle(s * 1.7, clock * 3.1), Y0 + y + 2 * wiggle(s * 2.3 + 4, clock * 3.1), r, sp[s] ? C.steel : C.copper);
      for (let s = 0; s < n * n; s++) if (!moving.has(s)) draw1(s, sx(s), sy(s));
      moving.forEach((p, s) => draw1(s, p[0], p[1]));
    }

    // ---- surface: metal slab in side view, gas molecules above it that adsorb and leave again (schematic) ----
    // colours as on the OMNIA slides: grey metal, orange adsorbate
    const surf = surfaceGas(B, (o.seed || 31) + 7), METAL = '#9AA5B1', ADS = C.orange;
    function drawSurface(bx) {
      const jig = (s, k) => 1.3 * wiggle(s * 1.37 + k, clock * 3.3), occ = surf.occ();
      ctx.save(); ctx.beginPath(); ctx.rect(bx, Y0, B, B); ctx.clip();
      for (let l = surf.NLAY - 1; l >= 0; l--) for (let i = -1; i <= surf.NS + 1; i++) { // slab, bottom layer first
        const s = 20 * l + i + 2;
        atom(ctx, bx + (i + (l % 3) / 3) * surf.A + jig(s, 0), Y0 + surf.yTop + l * surf.DY + jig(s, 5), surf.RM, METAL);
      }
      for (let i = 0; i < surf.NS; i++) if (occ[i] === 1) atom(ctx, bx + surf.siteX(i) + jig(100 + i, 0), Y0 + surf.ySite + jig(100 + i, 5), surf.RH, ADS);
      for (const [x, y] of surf.moving()) atom(ctx, bx + x, Y0 + y, surf.RH, ADS);
      for (const m of surf.mols()) {
        const c = Math.cos(m.th) * surf.DB / 2, s = Math.sin(m.th) * surf.DB / 2;
        atom(ctx, bx + m.x - c, Y0 + m.y - s, surf.RH, ADS); atom(ctx, bx + m.x + c, Y0 + m.y + s, surf.RH, ADS);
      }
      ctx.restore();
    }

    function alphaOf(k) { return shown[k] === HID ? 0 : E.smooth((clock - shown[k]) / 0.5); }
    function draw() {
      S.clear();
      for (let k = 0; k < 3; k++) {
        const al = alphaOf(k); if (al <= 0) continue;
        const bx = PX[k];
        ctx.save(); ctx.globalAlpha = al;
        roundRect(ctx, bx, Y0, B, B, 6, '#fff');
        if (k === 0) drawGlass(bx); else if (k === 1) drawAlloy(bx); else drawSurface(bx);
        roundRect(ctx, bx, Y0, B, B, 6, null, rgba(C.inkSoft, 0.55), 1.8);
        if (LAB) text(ctx, names[k], bx + B / 2, Y0 + B + 46, { size: 31, weight: 700, color: C.navy, align: 'center' });
        ctx.restore();
      }
    }
    return {
      frame(dt) {
        clock += dt;
        if (shown[1] !== HID) {
          accA += dt * RA; while (accA >= 1) { accA -= 1; attempt(true); }
          for (const w of swaps) w.t += dt;
          swaps = swaps.filter(w => { if (w.t < DSW) return true; busy[w.p] = busy[w.q] = 0; return false; });
        }
        if (shown[2] !== HID) surf.step(Math.min(dt, 0.05));
        draw();
      },
      draw,
      enter() { clock = 0; surf.reset(); swaps.forEach(w => { busy[w.p] = busy[w.q] = 0; }); swaps = []; shown[0] = OFF ? HID : -1; shown[1] = shown[2] = HID; },
      // a panel revealed by a click fades in; panels already revealed when the slide is entered are simply there
      step(k) { const kk = k - OFF; for (let i = OFF ? 0 : 1; i < 3; i++) { if (i <= kk && shown[i] === HID) shown[i] = clock < 0.05 ? clock - 1 : clock; if (i > kk) shown[i] = HID; } step = k; },
      ff: 3.2,
      _alloy: { attempt, rate: () => nAcc / Math.max(1, nAtt), sp, n }, _surf: surf
    };
  };

  // ------------------------------------------------------------------
  // Metropolis Monte Carlo of the 2D Kob-Andersen mixture (single-particle moves, cut-and-shifted Lennard-Jones,
  // same parameters and 2.5 sigma cutoff as U.kaForces). Positions are fractional; displacements are kept unwrapped, in sigma.
  // ------------------------------------------------------------------
  const KA_EPS = [[1.0, 1.5], [1.5, 0.5]], KA_SIG = [[1.0, 0.8], [0.8, 0.88]];
  function kaMC(cfg, T, delta, seed) {
    const N = cfg.N, L = cfg.L, types = cfg.t, rng = makeRng(seed);
    const x0 = new Float64Array(2 * N), x = new Float64Array(2 * N), d = new Float64Array(2 * N);
    for (let j = 0; j < 2 * N; j++) x0[j] = x[j] = wrap01(cfg.x[j]);
    const E4 = [[0, 0], [0, 0]], S2 = [[0, 0], [0, 0]], SH = [[0, 0], [0, 0]], c3 = Math.pow(1 / 6.25, 3);
    for (let p = 0; p < 2; p++) for (let q = 0; q < 2; q++) { E4[p][q] = 4 * KA_EPS[p][q]; S2[p][q] = KA_SIG[p][q] * KA_SIG[p][q]; SH[p][q] = 4 * KA_EPS[p][q] * (c3 * c3 - c3); }
    let att = 0, acc = 0;
    function eOne(i, xi, yi) { // energy of particle i placed at (xi, yi) with all the others
      const ti = types[i], e4 = E4[ti], s2 = S2[ti], sh = SH[ti]; let e = 0;
      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        let dx = xi - x[2 * j]; if (dx > 0.5) dx -= 1; else if (dx < -0.5) dx += 1;
        let dy = yi - x[2 * j + 1]; if (dy > 0.5) dy -= 1; else if (dy < -0.5) dy += 1;
        dx *= L; dy *= L; const r2 = dx * dx + dy * dy, tj = types[j], q = s2[tj];
        if (r2 > 6.25 * q) continue;
        const inv = q / r2, i3 = inv * inv * inv; e += e4[tj] * (i3 * i3 - i3) - sh[tj];
      }
      return e;
    }
    function move() {
      const i = rng.int(N), dx = delta * (2 * rng.u() - 1) / L, dy = delta * (2 * rng.u() - 1) / L;
      const xo = x[2 * i], yo = x[2 * i + 1], xn = wrap01(xo + dx), yn = wrap01(yo + dy);
      const dE = eOne(i, xn, yn) - eOne(i, xo, yo); att++;
      if (dE <= 0 || rng.u() < Math.exp(-dE / T)) { x[2 * i] = xn; x[2 * i + 1] = yn; d[2 * i] += dx * L; d[2 * i + 1] += dy * L; acc++; }
    }
    function com() { let cx = 0, cy = 0; for (let i = 0; i < N; i++) { cx += d[2 * i]; cy += d[2 * i + 1]; } return [cx / N, cy / N]; }
    return {
      N, L, types, x0, x, d, com,
      sweep() { for (let k = 0; k < N; k++) move(); },
      energy() { let e = 0; for (let i = 0; i < N; i++) e += eOne(i, x[2 * i], x[2 * i + 1]); return e / 2 / N; },
      msd() { const [cx, cy] = com(); let s = 0; for (let i = 0; i < N; i++) { const p = d[2 * i] - cx, q = d[2 * i + 1] - cy; s += p * p + q * q; } return s / N; },
      acceptance: () => acc / Math.max(1, att), sweeps: () => att / N
    };
  }

  // ------------------------------------------------------------------
  // The picture behind "trapped": two rugged 1D energy landscapes on [0, 1], in units of k_B T and drawn on one scale,
  // each with a Metropolis walker. Liquid: many shallow wells; glass: fewer, much deeper wells.
  // U(x) = (A / 2) cos(2 pi n x) + slow modulation: n wells with barrier tops at k / n and barriers of about A.
  // ------------------------------------------------------------------
  function landscape(n, A, mod, STEP, seed, start) {
    const Uf = (x) => 0.5 * A * Math.cos(2 * Math.PI * n * x) + mod(x);
    const w = new Float64Array(n), bot = new Float64Array(n).fill(Infinity), xb = new Float64Array(n); let Z = 0, umin = Infinity, umax = -Infinity;
    for (let i = 0; i < 4000; i++) { // Boltzmann weight and bottom of every well
      const x = (i + 0.5) / 4000, u = Uf(x), k = Math.min(n - 1, Math.floor(x * n));
      w[k] += Math.exp(-u); if (u < bot[k]) { bot[k] = u; xb[k] = x; } umin = Math.min(umin, u); umax = Math.max(umax, u);
    }
    for (let k = 0; k < n; k++) Z += w[k]; for (let k = 0; k < n; k++) w[k] /= Z;
    let wmax = 0; for (let k = 0; k < n; k++) wmax = Math.max(wmax, w[k]);
    function walker() {
      const rng = makeRng(seed), vis = new Float64Array(n); let x = xb[start], core = start, crossings = 0, steps = 0;
      return {
        step() { // one Metropolis move; a crossing is counted when the walker reaches the bottom of another well
          const y = x + STEP * rng.normal();
          if (y > 0 && y < 1 && Math.log(rng.u()) < -(Uf(y) - Uf(x))) x = y;
          const b = Math.min(n - 1, Math.floor(x * n)); vis[b]++; steps++;
          if (b !== core && Math.abs(x * n - b - 0.5) < 0.2) { core = b; crossings++; }
        },
        x: () => x, core: () => core, crossings: () => crossings, steps: () => steps, vis
      };
    }
    return { n, A, Uf, w, wmax, bot, xb, umin, umax, walker };
  }
  const LANDS = [
    landscape(12, 3.2, (x) => 0.5 * Math.sin(2 * Math.PI * 1.3 * x + 0.7) + 0.35 * Math.sin(2 * Math.PI * 2.9 * x + 2.0), 0.022, 121, 5),
    landscape(8, 13, (x) => 0.7 * Math.sin(2 * Math.PI * 0.9 * x + 1.1) + 0.45 * Math.sin(2 * Math.PI * 2.3 * x + 0.3), 0.014, 120, 3)];

  // ------------------------------------------------------------------
  // Local moves in a hot liquid (T = 2.0) and in the glass (T = 0.2): the same Monte Carlo, started from equilibrium snapshots.
  // step 0: liquid only; step >= 1: the glass beside it. Both chains run from the moment the slide is entered, so the
  // comparison is at equal numbers of sweeps. Displayed positions are low-pass filtered (the chains themselves are not).
  // Under each cell: the landscape walker (one move per sweep). The four bullets of the slide light up, one per click:
  //   step >= 2  slow mixing          the barrier Delta beside the glass walker's well
  //   step >= 3  correlated samples   the recent samples of each walker as a row of dots
  //   step >= 4  no amortization      what is set for a run: T, P, N, each a scale with a marker where this run sits
  //   step >= 5  no free energy       time spent in each well against its Boltzmann weight (dashed)
  // ------------------------------------------------------------------
  ANIMS.glassTrap = function (S, o) {
    const ctx = S.ctx; let clock = 0, step = 0, shownG = HID, owed = 0, sims = [];
    const tOn = [HID, HID, HID, HID, HID, HID];                    // time each highlight (index = click number) appeared
    const B = 380, Y = 40, LX = 30, RX = S.w - B - 30, RATE = o.rate || 480, MAXSW = 14, TAU = 0.3, RMAX = 4, PDT = 0.125, PMAX = 240;
    const SY0 = Y + B + 94, SY1 = SY0 + 84, RY = SY1 + 13, HY0 = SY1 + 26, HY1 = S.h - 5;        // landscape, sample row, histogram
    const TAUW = 0.06, WDT = 0.04, WMAX = 22, DTS = 0.25, NSAMP = 40;
    const PXK = (SY1 - SY0 - 10) / Math.max(LANDS[0].umax - LANDS[0].umin, LANDS[1].umax - LANDS[1].umin); // pixels per k_B T, same for both
    const ANCH = [[0.22, 0.27], [0.76, 0.72], [0.75, 0.25]]; // follow the large (A) particles nearest these points
    const defs = [ // name: S.tex source ($...$ is LaTeX); all notation in this animation is typeset by KaTeX, words and numbers stay canvas text
      { key: 'n64_T2.0', T: 2.0, delta: 0.17, seed: 11, x: LX, name: 'liquid, $T=2.0$', sub: 'atoms wander', col: C.tealDark, txt: C.tealDark },
      { key: 'n64_T0.2', T: 0.2, delta: 0.07, seed: 12, x: RX, name: 'glass, $T=0.2$', sub: 'every atom caged', col: C.coral, txt: '#C8553B' }];
    function mk(df, k) {
      const cfg = KA_DATA[df.key], mc = kaMC(cfg, df.T, df.delta, df.seed), N = cfg.N;
      const tags = ANCH.map(([ax, ay]) => { let b = 0, bd = 9; for (let i = 0; i < N; i++) { const q = (mc.x0[2 * i] - ax) ** 2 + (mc.x0[2 * i + 1] - ay) ** 2; if (cfg.t[i] === 0 && q < bd) { bd = q; b = i; } } return b; });
      const wk = LANDS[k].walker();
      return { df, cfg, mc, idx: byType(cfg), tags, disp: Float64Array.from(mc.x0), paths: tags.map(i => [mc.x0[2 * i], mc.x0[2 * i + 1]]), pathAcc: 0, rms: 0,
        land: LANDS[k], wk, wd: wk.x(), wtr: [], wacc: 0, samp: [], sacc: 0, tSamp: -9 };
    }
    function reset() { sims = defs.map(mk); owed = 0; clock = 0; }
    reset();

    function advance(dt) {
      owed += dt * RATE; const whole = Math.floor(owed); owed -= whole; const nSw = Math.min(whole, MAXSW), k = 1 - Math.exp(-dt / TAU), kw = 1 - Math.exp(-dt / TAUW);
      for (const s of sims) {
        const mc = s.mc, N = mc.N, L = mc.L;
        for (let q = 0; q < nSw; q++) { mc.sweep(); s.wk.step(); }
        const [cx, cy] = mc.com(); // shown in the centre-of-mass frame
        for (let i = 0; i < N; i++) {
          s.disp[2 * i] += (mc.x0[2 * i] + (mc.d[2 * i] - cx) / L - s.disp[2 * i]) * k;
          s.disp[2 * i + 1] += (mc.x0[2 * i + 1] + (mc.d[2 * i + 1] - cy) / L - s.disp[2 * i + 1]) * k;
        }
        s.rms = Math.sqrt(mc.msd());
        s.pathAcc += dt;
        while (s.pathAcc >= PDT) { // recent path of each tagged atom: the last PMAX * PDT = 30 s
          s.pathAcc -= PDT;
          s.tags.forEach((i, t) => { const p = s.paths[t]; p.push(s.disp[2 * i], s.disp[2 * i + 1]); if (p.length > 2 * PMAX) p.splice(0, 2); });
        }
        s.wd += (s.wk.x() - s.wd) * kw; s.wacc += dt; s.sacc += dt;
        while (s.wacc >= WDT) { s.wacc -= WDT; s.wtr.push(s.wd); if (s.wtr.length > WMAX) s.wtr.shift(); }
        while (s.sacc >= DTS) { s.sacc -= DTS; s.samp.push(s.wk.x()); s.tSamp = clock; if (s.samp.length > NSAMP) s.samp.shift(); } // the chain's samples
      }
    }

    function drawSim(s, al) {
      const bx = s.df.x, cfg = s.cfg, sig = B / cfg.L, rA = 0.47 * sig, rB = 0.36 * sig, col = s.df.col;
      ctx.save(); ctx.globalAlpha = al;
      roundRect(ctx, bx, Y, B, B, 6, '#fff');
      ctx.save(); ctx.beginPath(); ctx.rect(bx, Y, B, B); ctx.clip();
      for (const i of s.idx) cellAtom(ctx, bx, Y, B, wrap01(s.disp[2 * i]), wrap01(s.disp[2 * i + 1]), cfg.t[i] ? rB : rA, cfg.t[i] ? C.kaB : C.kaA);
      // recent paths of the tagged atoms: every periodic copy that crosses the cell
      const path = new Path2D();
      s.tags.forEach((i, t) => {
        const p = s.paths[t], np = p.length / 2; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (let q = 0; q < np; q++) { x0 = Math.min(x0, p[2 * q]); x1 = Math.max(x1, p[2 * q]); y0 = Math.min(y0, p[2 * q + 1]); y1 = Math.max(y1, p[2 * q + 1]); }
        for (let ox = Math.floor(x0); ox <= Math.floor(x1); ox++) for (let oy = Math.floor(y0); oy <= Math.floor(y1); oy++) {
          for (let q = 0; q < np; q++) { const X = bx + (p[2 * q] - ox) * B, YY = Y + (p[2 * q + 1] - oy) * B; if (q) path.lineTo(X, YY); else path.moveTo(X, YY); }
          path.lineTo(bx + (s.disp[2 * i] - ox) * B, Y + (s.disp[2 * i + 1] - oy) * B);
        }
      });
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 7; ctx.stroke(path);
      ctx.strokeStyle = col; ctx.lineWidth = 3.4; ctx.stroke(path);
      for (const i of s.tags) { // ring around each tagged atom (and its copies across the edges)
        const fx = wrap01(s.disp[2 * i]), fy = wrap01(s.disp[2 * i + 1]), rr = rA + 2;
        for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          const X = bx + (fx + ox) * B, YY = Y + (fy + oy) * B;
          if (X > bx - rr && X < bx + B + rr && YY > Y - rr && YY < Y + B + rr) U.circle(ctx, X, YY, rr, null, C.ink, 3);
        }
      }
      ctx.restore();
      roundRect(ctx, bx, Y, B, B, 6, null, rgba(C.inkSoft, 0.55), 1.8);
      // size 25 (the canvas text was 26): KaTeX sets "T = 0.2" wider than Inter did, and at 25 the label ends where it used to, clear of the words on the right
      S.tex('name:' + s.df.key, s.df.name, bx, Y + B + 32, { size: 25, weight: 680, color: C.ink, alpha: al });
      text(ctx, s.df.sub, bx + B, Y + B + 32, { size: 22, weight: 650, color: s.df.txt, align: 'right' });
      // how far the atoms have moved, in plain words (root-mean-square displacement; one diameter = sigma of the large atoms)
      const by = Y + B + 68;
      text(ctx, 'average distance moved (atom diameters)', bx, by - 12, { size: 18, color: C.inkSoft });
      roundRect(ctx, bx, by, B - 66, 12, 6, rgba(C.inkSoft, 0.14));
      roundRect(ctx, bx, by, Math.max(12, (B - 66) * Math.min(1, s.rms / RMAX)), 12, 6, col);
      text(ctx, s.rms.toFixed(1), bx + B, by + 14, { size: 26, weight: 700, color: C.navy, align: 'right' });
      ctx.restore();
    }

    // ---- landscape strip under a cell: curve, walker, and the highlights of clicks 2, 3 and 5 ----
    const geo = defs.map((df, k) => {
      const L = LANDS[k], x0 = df.x + 3, x1 = df.x + B - 3, line = new Path2D(), fill = new Path2D();
      const sx = (x) => x0 + x * (x1 - x0), sy = (u) => SY1 - 4 - (u - L.umin) * PXK; // well floors at the bottom of the strip
      fill.moveTo(x0, SY1);
      for (let i = 0; i <= 480; i++) { const x = i / 480, X = sx(x), YY = sy(L.Uf(x)); if (i) line.lineTo(X, YY); else line.moveTo(X, YY); fill.lineTo(X, YY); }
      fill.lineTo(x1, SY1); fill.closePath();
      return { line, fill, sx, sy, x0, x1 };
    });
    const hiAlpha = (j) => tOn[j] === HID ? 0 : E.smooth((clock - tOn[j]) / 0.4);
    function drawStrip(k, al) {
      const s = sims[k], g = geo[k], L = s.land, col = s.df.col;
      ctx.save(); ctx.globalAlpha = al;
      ctx.fillStyle = rgba(C.blue, 0.08); ctx.fill(g.fill);
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke(g.line);
      s.wtr.forEach((x, i) => U.circle(ctx, g.sx(x), g.sy(L.Uf(x)) - 9, 3, rgba(C.ink, 0.28 * (i + 1) / s.wtr.length)));
      // click 2, slow mixing: the barrier beside the glass walker's well
      const a2 = hiAlpha(2);
      if (k === 1 && a2 > 0) {
        const c = s.wk.core(), right = c < L.n - 1, xt = right ? (c + 1) / L.n : c / L.n, X = g.sx(xt), yb = g.sy(L.bot[c]), yt = g.sy(L.Uf(xt)), RED = '#C8553B';
        ctx.save(); ctx.globalAlpha = al * a2; ctx.strokeStyle = RED; ctx.fillStyle = RED; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(g.sx(L.xb[c]), yb); ctx.lineTo(X, yb); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(X, yb - 2); ctx.lineTo(X, yt + 2); ctx.stroke();
        for (const [yy, d] of [[yt + 1, 1], [yb - 1, -1]]) { ctx.beginPath(); ctx.moveTo(X, yy); ctx.lineTo(X - 5.5, yy + 9 * d); ctx.lineTo(X + 5.5, yy + 9 * d); ctx.closePath(); ctx.fill(); }
        S.tex('delta', '$\\Delta$', X + (right ? 9 : -9), (yb + yt) / 2 + 9, { size: 25, weight: 700, color: RED, align: right ? 'left' : 'right', alpha: al * a2 });
        ctx.restore();
      }
      U.circle(ctx, g.sx(s.wd), g.sy(L.Uf(s.wd)) - 10, 8.5, C.ink, '#fff', 2.5);
      // click 3, correlated samples: the chain's recent samples
      const a3 = hiAlpha(3);
      if (a3 > 0) {
        ctx.save(); ctx.globalAlpha = al * a3;
        ctx.strokeStyle = rgba(C.inkSoft, 0.3); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(g.x0, RY); ctx.lineTo(g.x1, RY); ctx.stroke();
        const ns = s.samp.length, pop = E.clamp((clock - s.tSamp) / 0.2);
        s.samp.forEach((x, i) => U.circle(ctx, g.sx(x), RY + ((i * 37) % 7 - 3) * 1.4, i === ns - 1 ? 3.6 + 3 * (1 - pop) : 3.6, rgba(col, i === ns - 1 ? 0.95 : 0.55)));
        ctx.restore();
      }
      // click 5, no free energy: time spent in each well against its Boltzmann weight (dashed)
      const a5 = hiAlpha(5);
      if (a5 > 0) {
        const HH = HY1 - HY0, bw = 0.6 * (g.x1 - g.x0) / L.n, tot = Math.max(1, s.wk.steps());
        ctx.save(); ctx.globalAlpha = al * a5;
        ctx.strokeStyle = rgba(C.inkSoft, 0.35); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(g.x0, HY1); ctx.lineTo(g.x1, HY1); ctx.stroke();
        for (let q = 0; q < L.n; q++) {
          const X = g.sx((q + 0.5) / L.n) - bw / 2, hv = HH * Math.min(1, 0.8 * s.wk.vis[q] / tot / L.wmax), ht = HH * 0.8 * L.w[q] / L.wmax;
          if (hv > 0.5) { ctx.fillStyle = rgba(col, 0.75); ctx.fillRect(X, HY1 - hv, bw, hv); }
          ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = rgba(C.ink, 0.8); ctx.lineWidth = 1.5; ctx.strokeRect(X, HY1 - ht, bw, ht); ctx.restore();
        }
        ctx.restore();
      }
      ctx.restore();
    }
    // click 4, no amortization: other conditions, each a run of its own that has not started
    function drawTags(al) {
      const a4 = hiAlpha(4); if (a4 <= 0) return;
      const TW = 150, TH = 70, tx = (LX + B + RX) / 2 - TW / 2, sym = ['T', 'P', 'N'];
      // where the runs sit on each scale: the two boxes differ in T only (liquid 2.0 in teal, glass 0.2 in coral)
      const at = [[[0.80, C.teal], [0.10, C.coral]], [[0.55, C.blue]], [[0.36, C.blue]]];
      for (let q = 0; q < 3; q++) {
        const a = al * E.smooth((clock - tOn[4] - 0.14 * q) / 0.4), ty = Y + B / 2 - TH / 2 + (q - 1) * (TH + 22);
        if (a <= 0) continue;
        ctx.save(); ctx.globalAlpha = a;
        // coloured, not grey: blue is the deck's colour for the thermodynamic conditions that are set.
        // Each is a scale; the marker shows where this run is. Any other position is a new run.
        roundRect(ctx, tx, ty, TW, TH, 12, rgba(C.blue, 0.10), C.blue, 2.2);
        // size 28.5: S.tex sets math at 1.12 em, so this is the 32 px letter of the canvas version, which keeps N clear of the marker that slides in beside it
        S.tex('cond' + q, '$' + sym[q] + '$', tx + 26, ty + 45, { size: 28.5, color: C.blue, align: 'center', alpha: a });
        const sx0 = tx + 50, sx1 = tx + TW - 16, sy = ty + TH / 2 + 1, g = E.out(E.clamp((clock - tOn[4] - 0.14 * q - 0.15) / 0.7));
        ctx.lineCap = 'round'; ctx.strokeStyle = rgba(C.blue, 0.35); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sx0, sy); ctx.lineTo(sx1, sy); ctx.stroke();
        if (at[q].length === 1) { ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(sx0, sy); ctx.lineTo(sx0 + (sx1 - sx0) * at[q][0][0] * g, sy); ctx.stroke(); }
        ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(C.blue, 0.6);
        for (let m = 0; m <= 4; m++) { const X = sx0 + (sx1 - sx0) * m / 4; ctx.beginPath(); ctx.moveTo(X, sy + 9); ctx.lineTo(X, sy + 15); ctx.stroke(); }
        at[q].forEach(([f, col]) => U.circle(ctx, sx0 + (sx1 - sx0) * f * g, sy, 8.5, col, '#fff', 2.4));
        ctx.restore();
      }
    }

    function draw() {
      S.clear();
      const lead = 'Metropolis Monte Carlo, single-particle moves  ·  ';
      ctx.save(); ctx.font = U.font(21, 500); const lw = ctx.measureText(lead).width; ctx.restore();
      text(ctx, lead, LX, 28, { size: 21, color: C.inkSoft });
      text(ctx, `${Math.floor(sims[0].mc.sweeps()).toLocaleString('en-US')} sweeps`, LX + lw, 28, { size: 24, weight: 700, color: C.navy });
      drawSim(sims[0], 1); drawStrip(0, 1);
      const ag = shownG === HID ? 0 : E.smooth((clock - shownG) / 0.5);
      if (ag > 0) { drawSim(sims[1], ag); drawStrip(1, ag); drawTags(ag); }
    }
    return {
      frame(dt) { clock += dt; advance(dt); draw(); },
      draw,
      enter() { reset(); shownG = HID; tOn.fill(HID); },
      step(k) {
        const now = clock < 0.05 ? clock - 1 : clock; // already revealed when the slide is entered: simply there
        if (k >= 1 && shownG === HID) shownG = now; if (k < 1) shownG = HID;
        for (let j = 2; j <= 5; j++) { if (k >= j && tOn[j] === HID) tOn[j] = now; if (k < j) tOn[j] = HID; }
        step = k;
      },
      ff: 10,
      _sims: () => sims, _lands: LANDS
    };
  };
})();
