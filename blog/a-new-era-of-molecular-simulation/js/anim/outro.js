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
  // ------------------------------------------------------------------
  // A new era: the universal-MLIP timeline (2017 → today, element coverage on a periodic table),
  // then what it enables, revealed one build at a time: MLIP → sampler → thermodynamics → agent (→ new query)
  // ------------------------------------------------------------------
  ANIMS.mlipEra = function (S, o) {
    const ctx = S.ctx; let clock = 0, step = 0; const shown = [0, -1, -1, -1, -1];
    const SYM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
    function cellOf(Z) { // [row, col] in an 18-column table; f-block in rows 8-9
      if (Z === 1) return [0, 0]; if (Z === 2) return [0, 17];
      if (Z <= 10) return [1, Z <= 4 ? Z - 3 : Z + 7]; if (Z <= 18) return [2, Z <= 12 ? Z - 11 : Z - 1];
      if (Z <= 36) return [3, Z - 19]; if (Z <= 54) return [4, Z - 37];
      if (Z <= 56) return [5, Z - 55]; if (Z === 57) return [5, 2]; if (Z <= 71) return [7, Z - 55]; if (Z <= 86) return [5, Z - 69];
      if (Z <= 88) return [6, Z - 87]; if (Z === 89) return [6, 2]; if (Z <= 103) return [8, Z - 87]; return [6, Z - 101];
    }
    const Zs = (...syms) => syms.map(x => SYM.indexOf(x) + 1);
    const MP89 = []; for (let Z = 1; Z <= 83; Z++) MP89.push(Z); MP89.push(89, 90, 91, 92, 93, 94);
    // milestones: [year, name, tag, level (0/1 above, 2/3 below), elements added]
    const MS = [
      [2017.1, 'ANI-1', 'organic, H C N O', 1, Zs('H', 'C', 'N', 'O')],
      [2017.55, 'SchNet', 'message passing', 3, Zs('F')],
      [2018.3, 'DeePMD', 'deep potential MD', 0, []],
      [2020.3, 'ANI-2x', '+ S, F, Cl', 2, Zs('S', 'Cl')],
      [2021.3, 'NequIP', 'E(3)-equivariant', 1, []],
      [2022.45, 'MACE', 'higher-order equivariant', 0, []],
      [2022.85, 'M3GNet', '~89 elements', 2, MP89],
      [2023.5, 'CHGNet', 'charge-informed', 1, []],
      [2023.95, 'MACE-MP-0', 'foundation MLIP', 3, []],
      [2024.4, 'MatterSim', 'across T and P', 0, []],
      [2025.05, 'MACE-MPA-0', 'used in ATLAS', 2, []],
      [2025.45, 'UMA', 'molecules + materials', 1, []]];
    const TX0 = 95, TX1 = 1110, Y0 = 2017, Y1 = 2026.8, AX = 258, tx = (y) => TX0 + (y - Y0) / (Y1 - Y0) * (TX1 - TX0);
    const DT = 0.42, T0 = 0.5;
    // periodic table geometry
    const PX = 1190, PY = 66, CS = 28;
    // chain geometry
    const BW = 330, BH = 124, BY = 506, BX = (i) => i * 456;
    const NODES = [
      { t1: 'Universal MLIP', t2: ['energies and forces', 'for any chemistry'], col: C.blue, icon: 'mlip' },
      { t1: 'Foundation sampler', t2: ['ATLAS · JANUS: ensembles', 'on demand, no MD'], col: C.teal, icon: 'sampler' },
      { t1: 'Thermodynamics', t2: ['⟨O⟩, F, S, phase diagrams', 'from path weights'], col: C.navy, icon: 'thermo', refs: ['FEAT: Du*, He* et al., NeurIPS 2025', 'RNE: He, Hernández-Lobato, Du†, Vargas†, ICLR 2026'] },
      { t1: 'Agentic LLM', t2: ['proposes compositions', 'and conditions, reads results'], col: C.violet, icon: 'agent' }];
    const LINKS = ['forces as labels', 'samples + weights', 'properties'];
    function icon(n, x, y) {
      ctx.save(); ctx.translate(x, y);
      if (n.icon === 'mlip') { const pts = [[-14, -8], [14, -8], [0, 10], [-14, 18], [14, 18]]; pts.forEach(p => pts.forEach(q => { ctx.strokeStyle = rgba(n.col, 0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 4); ctx.lineTo(q[0], q[1] - 4); ctx.stroke(); })); pts.forEach(p => U.circle(ctx, p[0], p[1] - 4, 5, n.col)); }
      if (n.icon === 'sampler') { ctx.strokeStyle = n.col; ctx.lineWidth = 2.4; for (let e = 0; e < 3; e++) { ctx.beginPath(); ctx.ellipse(0, 0, 24, 9, e * Math.PI / 3 + clock * 0.8, 0, 2 * Math.PI); ctx.stroke(); } U.circle(ctx, 0, 0, 4, n.col); }
      if (n.icon === 'thermo') { ctx.strokeStyle = n.col; ctx.lineWidth = 2.6; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const u = k / 30; const xx = -24 + 48 * u, yy = 14 - 30 * Math.exp(-((u - 0.5) ** 2) / 0.05); if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); ctx.beginPath(); ctx.moveTo(-26, 16); ctx.lineTo(26, 16); ctx.stroke(); }
      if (n.icon === 'agent') { roundRect(ctx, -22, -16, 44, 34, 10, rgba(n.col, 0.15), n.col, 2.2); U.circle(ctx, -9, 0, 4.5, n.col); U.circle(ctx, 9, 0, 4.5, n.col); ctx.strokeStyle = n.col; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -24); ctx.stroke(); U.circle(ctx, 0, -26, 3.5, n.col); }
      ctx.restore();
    }
    function draw() {
      S.clear();
      // ---------------- timeline ----------------
      const nShow = Math.max(0, Math.min(MS.length, Math.floor((clock - T0) / DT) + 1));
      const prog = E.clamp((clock - T0) / (DT * MS.length));
      ctx.strokeStyle = rgba(C.inkSoft, 0.25); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(TX0 - 20, AX); ctx.lineTo(TX1 + 20, AX); ctx.stroke();
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(TX0 - 20, AX); ctx.lineTo(TX0 - 20 + (TX1 + 40 - TX0) * prog, AX); ctx.stroke();
      arrow(ctx, TX1 + 10, AX, TX1 + 34, AX, rgba(C.inkSoft, 0.5), 3, 12);
      for (let y = 2017; y <= 2026; y++) { const x = tx(y); ctx.strokeStyle = rgba(C.inkSoft, 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, AX - 6); ctx.lineTo(x, AX + 6); ctx.stroke(); if (y % 1 === 0 && (y - 2017) % 1 === 0) text(ctx, String(y), x, AX + 26, { size: 15, color: C.muted, align: 'center', weight: 600 }); }
      text(ctx, 'today', TX1 + 22, AX - 14, { size: 16, color: C.inkSoft, align: 'center', weight: 650 });
      const LV = [{ y: 212, up: true }, { y: 142, up: true }, { y: 330, up: false }, { y: 390, up: false }];
      MS.forEach((m, i) => {
        if (i >= nShow) return;
        const a = E.out(E.clamp((clock - T0 - i * DT) / 0.35)), x = tx(m[0]), L = LV[m[3]], newest = i === nShow - 1 && prog < 1;
        const stemEnd = L.up ? L.y + 8 : L.y - 34;
        ctx.save(); ctx.globalAlpha = a;
        ctx.strokeStyle = rgba(C.blue, 0.45); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, L.up ? AX : AX + 36); ctx.lineTo(x, stemEnd); ctx.stroke();
        U.circle(ctx, x, AX, newest ? 8 : 6, C.blue, '#fff', 2);
        const ny = L.up ? L.y - 22 : L.y - 12;
        text(ctx, m[1], x, ny, { size: 19, weight: 700, color: m[1] === 'MACE-MPA-0' ? C.teal : C.navy, align: 'center' });
        text(ctx, m[2], x, ny + 20, { size: 14, color: C.inkSoft, align: 'center' });
        ctx.restore();
      });
      text(ctx, 'Universal machine-learned interatomic potentials', 0, 24, { size: 22, weight: 700, color: C.blue });
      text(ctx, 'DFT-level energies and forces at a tiny fraction of the cost, now across most of the periodic table', 0, 52, { size: 17, color: C.inkSoft });
      // ---------------- periodic table: elements covered ----------------
      const cov = new Set(); MS.forEach((m, i) => { if (i < nShow) m[4].forEach(Z => cov.add(Z)); });
      const fresh = new Set(nShow ? MS[nShow - 1][4] : []), fa = nShow ? E.clamp((clock - T0 - (nShow - 1) * DT) / 0.6) : 1;
      for (let Z = 1; Z <= 118; Z++) {
        const [r, c] = cellOf(Z), x = PX + c * CS, y = PY + r * CS + (r >= 7 ? 10 : 0), on = cov.has(Z);
        const col = on ? (fresh.has(Z) ? mix('#FFFFFF', C.blue, 0.25 + 0.6 * fa) : rgba(C.blue, 0.85)) : rgba(C.inkSoft, 0.08);
        roundRect(ctx, x + 1, y + 1, CS - 2, CS - 2, 4, col);
        text(ctx, SYM[Z - 1], x + CS / 2, y + CS / 2 + 4.5, { size: 11, color: on ? '#fff' : rgba(C.inkSoft, 0.55), align: 'center', weight: 600 });
      }
      text(ctx, `elements covered: ${cov.size}`, PX + 9 * CS, PY + 9 * CS + 40, { size: 20, weight: 700, color: C.blue, align: 'center' });
      // ---------------- the chain, one build at a time ----------------
      text(ctx, 'What a universal MLIP now enables, one step at a time', 0, BY - 46, { size: 21, weight: 700, color: C.ink });
      NODES.forEach((n, i) => {
        if (shown[i] < 0) return;
        const a = E.out(E.clamp((clock - shown[i]) / 0.5)), x = BX(i), y = BY + (1 - a) * 16;
        ctx.save(); ctx.globalAlpha = a;
        roundRect(ctx, x, y, BW, BH, 18, '#fff', n.col, i === step || (step >= 4 && i === 1) ? 3.2 : 2);
        icon(n, x + 42, y + BH / 2);
        text(ctx, n.t1, x + 82, y + 44, { size: 23, weight: 700, color: n.col });
        text(ctx, n.t2[0], x + 82, y + 74, { size: 16, color: C.inkSoft }); text(ctx, n.t2[1], x + 82, y + 96, { size: 16, color: C.inkSoft });
        if (n.refs) n.refs.forEach((r, j) => text(ctx, r, x + 10, y + BH + 24 + 19 * j, { size: 14, color: C.muted }));
        ctx.restore();
        if (i > 0) { // link from the previous node, with flowing dots
          const x0 = BX(i - 1) + BW + 8, x1 = x - 8, yy = BY + BH / 2;
          ctx.save(); ctx.globalAlpha = a;
          arrow(ctx, x0, yy, x1, yy, rgba(NODES[i - 1].col, 0.85), 3.5, 14);
          text(ctx, LINKS[i - 1], (x0 + x1) / 2, yy - 16, { size: 14, color: C.inkSoft, align: 'center', weight: 600 });
          for (let d = 0; d < 3; d++) { const u = ((clock * 0.6 + d / 3) % 1); U.circle(ctx, x0 + (x1 - 14 - x0) * u, yy, 4, rgba(NODES[i - 1].col, 0.9)); }
          ctx.restore();
        }
      });
      if (shown[4] >= 0) { // the agent closes the loop: a new query to the same sampler, no retraining
        const a = E.out(E.clamp((clock - shown[4]) / 0.6)), xa = BX(3) + BW / 2, xs = BX(1) + BW / 2, yb = BY + BH + 8, yl = BY + BH + 74;
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = rgba(C.violet, 0.85); ctx.lineWidth = 3.5; ctx.setLineDash([9, 7]);
        ctx.beginPath(); ctx.moveTo(xa, yb); ctx.lineTo(xa, yl - 14); ctx.quadraticCurveTo(xa, yl, xa - 14, yl); ctx.lineTo(xs + 14, yl); ctx.quadraticCurveTo(xs, yl, xs, yl - 14); ctx.stroke(); ctx.setLineDash([]);
        arrow(ctx, xs, yl - 12, xs, yb, rgba(C.violet, 0.9), 3.5, 14);
        for (let d = 0; d < 4; d++) { const u = ((clock * 0.35 + d / 4) % 1), X = xa + (xs - xa) * u; U.circle(ctx, X, yl, 4, rgba(C.violet, 0.9)); }
        roundRect(ctx, (xa + xs) / 2 - 215, yl - 18, 430, 36, 18, '#fff');
        text(ctx, 'new query: composition, T, Δμ (no retraining)', (xa + xs) / 2, yl + 6, { size: 17, color: C.violet, align: 'center', weight: 650 });
        ctx.restore();
      }
    }
    return {
      enter() { clock = 0; shown.forEach((_, i) => { shown[i] = i === 0 ? 0 : (i <= step ? 0 : -1); }); },
      step(k) { for (let i = 1; i <= 4; i++) { if (i <= k && shown[i] < 0) shown[i] = clock; if (i > k) shown[i] = -1; } step = k; },
      frame(dt) { clock += dt; draw(); }, draw, ff: 8
    };
  };
})();
