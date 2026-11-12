/* Bonus slide "Autoregressive models are non-equilibrium processes too" (from the blog, Part 7, and its talk).
   A toy next-token tree: the forward kernel appends a token with its conditional probability; the backward kernel
   deletes the last token with probability 1, so one path leads back and the path weight is the exact likelihood. */
(function () {
  'use strict';
  const { C, rgba, roundRect, text, makeRng } = U;

  ANIMS.arTree = function (S, o) {
    const ctx = S.ctx, rng = makeRng(17);
    const LEV = [[['The', .55], ['A', .35], ['Every', .10]], [['cat', .5], ['dog', .3], ['model', .2]], [['sat', .6], ['ran', .3], ['slept', .1]], [['down', .5], ['away', .3], ['there', .2]]];
    const L = LEV.length, dx = (S.w - 220) / (L + 0.6), X0 = 70 + 0.6 * dx, Yc = S.h * 0.40, dy = 92;
    let path, phase, prog, hold;
    function sample() { path = LEV.map(opts => { let r = rng.u(), acc = 0; for (let j = 0; j < opts.length; j++) { acc += opts[j][1]; if (r < acc) return j; } return opts.length - 1; }); phase = 0; prog = 0; hold = 0; }
    sample();
    const colX = i => X0 + i * dx;
    const nodeY = (j) => Yc + (j - 1) * dy;
    function box(x, y, txt, style) {
      ctx.save(); ctx.font = U.font(26, 650); const w = Math.max(96, ctx.measureText(txt).width + 34); ctx.restore();
      roundRect(ctx, x - w / 2, y - 26, w, 52, 12, style.fill, style.stroke, style.lw || 1.5);
      text(ctx, txt, x, y + 9, { size: 26, weight: 650, color: style.color, align: 'center' });
      return w;
    }
    function draw() {
      S.clear();
      // phases: 0..L-1 forward choice at level i (prog 0..1); L..2L-1 backward step; then hold
      const fwdDone = Math.min(phase, L), back = Math.max(0, phase - L);
      let py = Yc, prod = 1;
      box(colX(0) - dx * 0.6, Yc, '⟨s⟩', { fill: '#fff', stroke: C.navy, color: C.navy, lw: 2 });
      for (let i = 0; i < L; i++) {
        if (i > fwdDone) break;
        const showing = i === fwdDone ? prog : 1, opts = LEV[i];
        const chosen = path[i], px = i === 0 ? colX(0) - dx * 0.6 : colX(i - 1);
        opts.forEach(([tok, p], j) => {
          const y = nodeY(j), isC = j === chosen, decided = i < fwdDone || prog > 0.55;
          const a = Math.min(1, showing * 2);
          ctx.save(); ctx.globalAlpha = a * (decided && !isC ? 0.25 : 1);
          ctx.strokeStyle = decided && isC ? C.teal : C.faint; ctx.lineWidth = decided && isC ? 5 : 2;
          ctx.beginPath(); ctx.moveTo(px + 50, py); ctx.bezierCurveTo(px + dx * 0.45, py, colX(i) - dx * 0.45, y, colX(i) - 52, y); ctx.stroke();
          text(ctx, p.toFixed(2), (px + colX(i)) / 2, (py + y) / 2 - 10, { size: 19, weight: 650, color: decided && isC ? C.tealDark : C.muted, align: 'center' });
          box(colX(i), y, tok, decided && isC ? { fill: rgba(C.teal, 0.12), stroke: C.teal, color: C.ink, lw: 2.5 } : { fill: '#fff', stroke: C.faint, color: C.inkSoft });
          ctx.restore();
        });
        if (i < fwdDone || prog > 0.55) prod *= opts[chosen][1];
        py = nodeY(chosen);
      }
      // backward arrows: delete the last token, probability 1
      for (let b = 0; b < back && b < L; b++) {
        const i = L - 1 - b, y1 = nodeY(path[i]), y0 = i === 0 ? Yc : nodeY(path[i - 1]), x1 = colX(i), x0 = i === 0 ? colX(0) - dx * 0.6 : colX(i - 1);
        U.curvedArrow(ctx, [x1 - 10, y1 + 34, (x0 + x1) / 2, Math.max(y0, y1) + 90, x0 + 10, y0 + 34], C.coral, 3.5, 14);
        S.tex('x' + b, '$\\times\\,1$', (x0 + x1) / 2, Math.max(y0, y1) + 92, { size: 22, weight: 700, color: '#B4492F', align: 'center' });
      }
      // readouts. The products are typeset by KaTeX (S.tex, a layer over the canvas): one label per prefix of the path, typeset once
      const done = path.slice(0, fwdDone + (prog > 0.55 && phase < L ? 1 : 0));
      const sent = done.map((j, i) => LEV[i][j][0]).join(' ');
      text(ctx, '“' + sent + '”', 20, S.h - 92, { size: 30, weight: 650, color: C.navy });
      const terms = done.map((j, i) => LEV[i][j][1].toFixed(2));
      S.tex('fwd' + done.join(''), 'forward:\u00a0\u00a0$p(x)=' + (terms.length ? terms.join('\\times ') + '=' + prod.toFixed(3) : '\\dots') + '$', 20, S.h - 46, { size: 24, color: C.tealDark, weight: 600 });
      if (back > 0) {
        const nb = Math.min(back, L);
        S.tex('bwd' + nb, 'backward:\u00a0\u00a0$' + Array(nb).fill('1').join('\\times ') + '$' + (nb === L ? '\u00a0\u00a0$\\to$\u00a0\u00a0one path back, so the path weight is $p(x)$ exactly' : ''), S.w - 20, S.h - 46, { size: 24, color: '#B4492F', weight: 600, align: 'right' });
      }
    }
    return {
      frame(dt) {
        if (phase >= 2 * L) { hold += dt; if (hold > 2.5) sample(); draw(); return; }
        prog += dt / (phase < L ? 1.1 : 0.55);
        if (prog >= 1) { prog = 0; phase++; }
        draw();
      }, draw, enter: sample,
      ff: 7.2 // export frame: the whole sentence generated and every backward step drawn
    };
  };
})();
