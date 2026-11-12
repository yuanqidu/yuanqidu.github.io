/* Crystal lattices for the JANUS phase-diagram slide: the two conventional cubic unit cells, fcc and bcc, side by side,
   turning slowly about the vertical axis with a fixed tilt. Colours follow the paper's Ni–Cr panel (assets/figs/janus_f3b.webp):
   fcc orange, bcc blue. Corner atoms are light; the atoms that tell the two lattices apart (six face centres, one body centre)
   carry the full colour and are tied to the corners of their face / of the cube by thin guide lines.
   The turn starts from the opening view on the click that reveals the canvas (its data-f); a quarter turn maps both cells onto
   themselves, so ff = a quarter turn and the export frame is the opening view again.
   Options (data-opts): {"period": 24} seconds per turn · {"angle": 10, "tilt": 20} opening view in degrees (seen from the right and from above)
   · {"guides": false} no guide lines · {"spin": false} a still picture · {"size": 160} cube edge in px. */
(function () {
  'use strict';
  const { C, rgba, mix, E, atom, text } = U;
  const FCC = '#D55E00', BCC = '#0072B2';   // the figure's orange and blue

  // atoms (cube units, cube centred at the origin) and lines (cube edges; guide lines from each distinguishing atom to its corners)
  function unitCell(kind) {
    const atoms = [], lines = [], h = [-0.5, 0.5];
    h.forEach(x => h.forEach(y => h.forEach(z => atoms.push({ p: [x, y, z], key: false }))));
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {   // 12 edges: corners that differ in one coordinate
      const a = atoms[i].p, b = atoms[j].p;
      if ((a[0] !== b[0]) + (a[1] !== b[1]) + (a[2] !== b[2]) === 1) lines.push({ a: i, b: j, guide: false });
    }
    if (kind === 'fcc') {
      for (let ax = 0; ax < 3; ax++) h.forEach(s => {               // one atom at the centre of each face
        const p = [0, 0, 0]; p[ax] = s; const k = atoms.length; atoms.push({ p, key: true });
        for (let i = 0; i < 8; i++) if (atoms[i].p[ax] === s) lines.push({ a: i, b: k, guide: true });
      });
    } else {                                                          // one atom at the centre of the cube
      const k = atoms.length; atoms.push({ p: [0, 0, 0], key: true });
      for (let i = 0; i < 8; i++) lines.push({ a: i, b: k, guide: true });
    }
    return { atoms, lines };
  }

  ANIMS.latticeCells = function (S, o) {
    o = o || {};
    const ctx = S.ctx; let clock = 0, step = 0;
    const showAt = +(S.canvas.dataset.f || 0);   // the click on which the slide reveals this canvas: the turn starts there
    const PERIOD = o.period || 24, SPIN = o.spin !== false, GUIDES = o.guides !== false;
    // opening view: at 10° / 20° no atom of either cell hides another (the clearest view of the fcc cell)
    const TH0 = (o.angle !== undefined ? o.angle : 10) * Math.PI / 180, TILT = (o.tilt !== undefined ? o.tilt : 20) * Math.PI / 180;
    const A = o.size || Math.min(S.w * 0.255, (S.h - 92) * 0.575);   // cube edge in px: the turning cell stays inside its half of the canvas
    const R = 0.125, D = 7;                                           // atom radius and camera distance, in cube edges
    const CY = 14 + A * 0.80, LY = S.h - 44;                          // cell centre; baseline of the names
    const cells = [{ g: unitCell('fcc'), col: FCC, name: 'fcc', desc: 'face-centred cubic', cx: S.w * 0.25 },
      { g: unitCell('bcc'), col: BCC, name: 'bcc', desc: 'body-centred cubic', cx: S.w * 0.75 }];
    cells.forEach(c => { c.light = mix(c.col, '#FFFFFF', 0.6); });

    function drawCell(c, th) {
      const ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(TILT), sp = Math.sin(TILT), cx = c.cx;
      // view space: x to the right, y up, z towards the viewer
      const V = c.g.atoms.map(a => { const x = a.p[0] * ct - a.p[2] * st, z = a.p[0] * st + a.p[2] * ct; return [x, a.p[1] * cp - z * sp, a.p[1] * sp + z * cp]; });
      const items = [];
      V.forEach((v, i) => { const s = D / (D - v[2]); items.push({ z: v[2], atom: true, x: cx + A * s * v[0], y: CY - A * s * v[1], r: A * s * R, key: c.g.atoms[i].key }); });
      c.g.lines.forEach(l => {
        if (l.guide && !GUIDES) return;
        const a = V[l.a], d = [V[l.b][0] - a[0], V[l.b][1] - a[1], V[l.b][2] - a[2]], len = Math.hypot(d[0], d[1], d[2]);
        const P = (t) => { const s = D / (D - (a[2] + d[2] * t)); return [cx + A * s * (a[0] + d[0] * t), CY - A * s * (a[1] + d[1] * t)]; };
        let t0 = R / len, t1 = 1 - R / len;                          // a cube edge is a stick: from sphere surface to sphere surface
        if (l.guide) {                                               // a guide line stops at the outlines of its two atoms
          const A0 = items[l.a], B0 = items[l.b], L2 = Math.hypot(B0.x - A0.x, B0.y - A0.y);
          if (L2 < A0.r + B0.r + 4) return;
          const tOf = (w) => w * B0.r / ((1 - w) * A0.r + w * B0.r);   // 2D fraction of the line -> 3D fraction (perspective)
          t0 = tOf((A0.r + 0.8) / L2); t1 = tOf(1 - (B0.r + 0.8) / L2);
        }
        const K = l.guide ? 2 : 4;                                   // drawn in K pieces, each sorted by its own depth
        for (let k = 0; k < K; k++) {
          const ta = t0 + (t1 - t0) * k / K, tb = t0 + (t1 - t0) * (k + 1) / K;
          items.push({ z: a[2] + d[2] * (ta + tb) / 2, p: P(ta), q: P(tb), guide: l.guide });
        }
      });
      items.sort((u, v) => u.z - v.z);   // far to near
      items.forEach(it => {
        const far = E.clamp((0.87 - it.z) / 1.74);   // 0 at the nearest corner, 1 at the farthest: depth cue
        if (it.atom) { atom(ctx, it.x, it.y, it.r, mix(it.key ? c.col : c.light, C.bg, 0.2 * far)); return; }
        // guide lines are translucent in the cell's own colour, so one that passes in front of an atom leaves no mark on it
        ctx.strokeStyle = it.guide ? rgba(c.col, 0.38 - 0.2 * far) : mix(C.inkSoft, C.bg, 0.1 + 0.5 * far);
        ctx.lineWidth = it.guide ? 1.5 - 0.3 * far : 2.6 - 1.0 * far; ctx.lineCap = it.guide ? 'butt' : 'round';
        ctx.beginPath(); ctx.moveTo(it.p[0], it.p[1]); ctx.lineTo(it.q[0], it.q[1]); ctx.stroke();
      });
      text(ctx, c.name, cx, LY, { size: 32, weight: 700, color: c.col, align: 'center' });
      text(ctx, c.desc, cx, LY + 30, { size: 21, weight: 520, color: C.inkSoft, align: 'center' });
    }
    function draw() {
      S.clear();
      const th = TH0 + (SPIN ? 2 * Math.PI * clock / PERIOD : 0);
      cells.forEach(c => drawCell(c, th));
    }
    return {
      enter() { clock = 0; },
      step(k) { if (k >= showAt && step < showAt) clock = 0; step = k; },
      frame(dt) { clock += dt; if (step >= showAt) draw(); },
      draw, ff: PERIOD / 4   // a quarter turn maps both cells onto themselves: the export frame is the opening view
    };
  };
})();
