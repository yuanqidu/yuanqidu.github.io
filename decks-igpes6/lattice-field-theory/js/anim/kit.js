/* Shared kit for the lattice animations (stage pixels, 1920×1080 space): small plots with
   linear or log axes, pixel lattices drawn with sharp pixels, colour maps, rich labels,
   ring buffers and histograms. Physics comes from js/engines.js (window.LFT). */
(function () {
  'use strict';
  const { C, rgba } = U;
  const K = window.K = {};
  const TAU = 2 * Math.PI;
  K.TAU = TAU;

  // ---------- colours ----------
  K.UP = '#1D3A5F'; K.DN = '#E8E1D1';          // Ising up / down
  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function pack(r, g, b) { return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; }
  K.hex = hex; K.pack = pack; K.packHex = (h) => pack(...hex(h));
  K.lut = function (stops, n = 512) {
    const s = stops.map(hex), out = new Uint32Array(n), css = new Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) * (s.length - 1), k = Math.min(s.length - 2, Math.floor(t)), f = t - k;
      const c = [0, 1, 2].map(j => Math.round(s[k][j] + (s[k + 1][j] - s[k][j]) * f));
      out[i] = pack(c[0], c[1], c[2]); css[i] = `rgb(${c[0]},${c[1]},${c[2]})`;
    }
    out.css = css; return out;
  };
  // diverging: negative navy/blue, zero paper, positive coral
  K.DIV = K.lut(['#1D3A5F', '#4C72B0', '#A9C1E3', '#F7F4EE', '#F3BCA6', '#E76F51', '#A63D24']);
  K.divIdx = (v, vmax) => Math.min(511, Math.max(0, ((0.5 + 0.5 * v / vmax) * 511 + 0.5) | 0));
  K.divCss = (v, vmax) => K.DIV.css[K.divIdx(v, vmax)];
  // sequential: paper to navy
  K.SEQ = K.lut(['#F7F4EE', '#CFDDF0', '#8FB0DC', '#4C72B0', '#1D3A5F', '#0E1F36']);
  // cyclic wheel for angles (muted)
  function hsl(h, s, l) {
    const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }
  K.hsl = hsl;
  K.CYC = (function () { const n = 720, out = new Uint32Array(n), css = new Array(n); for (let i = 0; i < n; i++) { const c = hsl((360 * i / n + 200) % 360, 0.5, 0.6); out[i] = pack(...c); css[i] = `rgb(${c[0]},${c[1]},${c[2]})`; } out.css = css; return out; })();
  K.cycIdx = (th) => { let t = th / TAU; t -= Math.floor(t); return Math.min(719, (t * 720) | 0); };
  K.cycCss = (th) => K.CYC.css[K.cycIdx(th)];
  // categorical colours for Potts states
  K.CAT = ['#2A9D8F', '#E76F51', '#1D3A5F', '#E9C46A', '#6B5E9B', '#4C72B0', '#C8692E', '#8AB17D'];

  // ---------- pixel lattice ----------
  K.img = function (W, H) {
    H = H || W;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cx = cv.getContext('2d'), im = cx.createImageData(W, H), px = new Uint32Array(im.data.buffer);
    return {
      cv, px, W, H,
      put() { cx.putImageData(im, 0, 0); return this; },
      draw(ctx, x, y, w, h, smooth) { ctx.save(); ctx.imageSmoothingEnabled = !!smooth; if (smooth) ctx.imageSmoothingQuality = 'high'; ctx.drawImage(cv, x, y, w, h); ctx.restore(); }
    };
  };
  // rounded clip box with a soft shadow (white card behind a lattice)
  K.card = function (ctx, x, y, w, h, r = 14) {
    ctx.save(); ctx.shadowColor = 'rgba(31,41,51,0.10)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
    U.roundRect(ctx, x, y, w, h, r, '#fff'); ctx.restore();
  };
  K.clipRound = function (ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.clip();
  };

  // ---------- text with _sub and ^sup runs ----------
  function parts(s) {
    const out = []; let buf = '', i = 0;
    while (i < s.length) {
      const ch = s[i];
      if ((ch === '_' || ch === '^') && i + 1 < s.length && s[i + 1] !== ' ') {
        if (buf) { out.push({ t: buf }); buf = ''; }
        let t;
        if (s[i + 1] === '{') { const j = s.indexOf('}', i + 2); t = s.slice(i + 2, j < 0 ? s.length : j); i = j < 0 ? s.length : j + 1; }
        else { let j = i + 1; while (j < s.length && /[A-Za-z0-9α-ωΑ-Ω]/.test(s[j])) j++; t = s.slice(i + 1, j); i = j; }
        out.push({ t, k: ch }); continue;
      }
      buf += ch; i++;
    }
    if (buf) out.push({ t: buf });
    return out;
  }
  // K.label(ctx, 'T_c', x, y, {size, weight, color, align, halo, italic})
  K.label = function (ctx, s, x, y, o = {}) {
    const size = o.size || 20, w8 = o.weight || 500, it = o.italic ? 'italic ' : '';
    const big = `${it}${w8} ${size}px ${U.FONT}`, small = `${it}${w8} ${Math.round(size * 0.72)}px ${U.FONT}`;
    ctx.save();
    ctx.fillStyle = o.color || C.inkSoft; ctx.textBaseline = o.base || 'alphabetic';
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    if (o.halo) { ctx.lineWidth = o.haloW || 5; ctx.strokeStyle = o.halo; ctx.lineJoin = 'round'; }
    const ps = /[_^]/.test(s) ? parts(s) : [{ t: s }];
    let w = 0; for (const p of ps) { ctx.font = p.k ? small : big; p.w = ctx.measureText(p.t).width; w += p.w; }
    let cx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.textAlign = 'left';
    for (const p of ps) {
      ctx.font = p.k ? small : big;
      const dy = p.k === '_' ? size * 0.26 : p.k === '^' ? -size * 0.42 : 0;
      if (o.halo) ctx.strokeText(p.t, cx, y + dy);
      ctx.fillText(p.t, cx, y + dy); cx += p.w;
    }
    ctx.restore();
    return w;
  };

  // ---------- arrows by angle (y up), as in the notes ----------
  K.arrowA = function (ctx, x, y, ang, len, color, width = 2, head = 0.38, centred = true) {
    const dx = Math.cos(ang) * len, dy = -Math.sin(ang) * len;
    const x0 = centred ? x - dx / 2 : x, y0 = centred ? y - dy / 2 : y, x1 = x0 + dx, y1 = y0 + dy;
    const hl = len * head, a1 = Math.atan2(y0 - y1, x0 - x1);
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + Math.cos(a1) * hl * 0.3, y1 + Math.sin(a1) * hl * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(a1 + 0.45) * hl, y1 + Math.sin(a1 + 0.45) * hl);
    ctx.lineTo(x1 + Math.cos(a1 - 0.45) * hl, y1 + Math.sin(a1 - 0.45) * hl);
    ctx.closePath(); ctx.fill(); ctx.restore();
  };

  // ---------- plots ----------
  // K.plot(ctx, {x,y,w,h}, {x:[a,b], y:[a,b], logx, logy, xt:[{v,l}], yt:[{v,l}], xl, yl, fs})
  K.plot = function (ctx, b, o) {
    const lx = !!o.logx, ly = !!o.logy;
    const fx = lx ? Math.log10 : (v) => v, fy = ly ? Math.log10 : (v) => v;
    let x0, x1, y0, y1;
    function setX(a, c) { x0 = fx(a); x1 = fx(c); } function setY(a, c) { y0 = fy(a); y1 = fy(c); }
    setX(o.x[0], o.x[1]); setY(o.y[0], o.y[1]);
    const X = (v) => b.x + (fx(v) - x0) / (x1 - x0) * b.w;
    const Y = (v) => b.y + b.h - (fy(v) - y0) / (y1 - y0) * b.h;
    const fs = o.fs || 19;
    function axes() {
      ctx.save();
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      (o.xt || []).forEach(t => { if (o.gridx === false) return; ctx.beginPath(); ctx.moveTo(X(t.v), b.y); ctx.lineTo(X(t.v), b.y + b.h); ctx.stroke(); });
      (o.yt || []).forEach(t => { ctx.beginPath(); ctx.moveTo(b.x, Y(t.v)); ctx.lineTo(b.x + b.w, Y(t.v)); ctx.stroke(); });
      ctx.strokeStyle = rgba(C.inkSoft, 0.85); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.stroke();
      (o.xt || []).forEach(t => K.label(ctx, t.l, X(t.v), b.y + b.h + fs + 8, { size: fs, color: C.inkSoft, align: 'center' }));
      (o.yt || []).forEach(t => K.label(ctx, t.l, b.x - 10, Y(t.v) + fs * 0.35, { size: fs, color: C.inkSoft, align: 'right' }));
      if (o.xl) K.label(ctx, o.xl, b.x + b.w / 2, b.y + b.h + fs + 40, { size: o.fl || 20, color: C.inkSoft, align: 'center', weight: 600 });
      if (o.yl) { ctx.save(); ctx.translate(b.x - (o.ylo || 58), b.y + b.h / 2); ctx.rotate(-Math.PI / 2); K.label(ctx, o.yl, 0, 0, { size: o.fl || 20, color: C.inkSoft, align: 'center', weight: 600 }); ctx.restore(); }
      ctx.restore();
    }
    const ok = (x, y) => Number.isFinite(x) && Number.isFinite(y) && (!lx || x > 0) && (!ly || y > 0);
    function line(xs, ys, col, lw, dash, alpha) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw || 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (dash) ctx.setLineDash(dash); if (alpha !== undefined) ctx.globalAlpha *= alpha;
      ctx.beginPath(); let pen = false;
      for (let i = 0; i < xs.length; i++) {
        if (!ok(xs[i], ys[i])) { pen = false; continue; }
        const px = X(xs[i]), py = Y(ys[i]); if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; }
      }
      ctx.stroke(); ctx.restore();
    }
    function fn(f, col, lw, dash, n = 300, xa, xb) {
      const a = xa === undefined ? (lx ? Math.pow(10, x0) : x0) : xa, c = xb === undefined ? (lx ? Math.pow(10, x1) : x1) : xb;
      const xs = [], ys = [];
      for (let i = 0; i <= n; i++) { const t = i / n, x = lx ? a * Math.pow(c / a, t) : a + (c - a) * t; xs.push(x); ys.push(f(x)); }
      line(xs, ys, col, lw, dash);
    }
    function dots(xs, ys, col, r = 6, stroke = '#fff', alpha) {
      ctx.save(); if (alpha !== undefined) ctx.globalAlpha *= alpha;
      for (let i = 0; i < xs.length; i++) { if (!ok(xs[i], ys[i])) continue; const c = Array.isArray(col) ? col[i] : col; U.circle(ctx, X(xs[i]), Y(ys[i]), r, c, stroke, stroke ? 1.6 : 0); }
      ctx.restore();
    }
    function err(xs, ys, es, col, lw = 2) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw;
      for (let i = 0; i < xs.length; i++) {
        const lo = ys[i] - es[i], hi = ys[i] + es[i]; if (!Number.isFinite(lo + hi)) continue;
        const px = X(xs[i]); ctx.beginPath(); ctx.moveTo(px, Y(ly ? Math.max(lo, ys[i] * 0.05) : lo)); ctx.lineTo(px, Y(hi)); ctx.stroke();
      }
      ctx.restore();
    }
    function hline(v, col, lw = 1.6, dash) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(b.x, Y(v)); ctx.lineTo(b.x + b.w, Y(v)); ctx.stroke(); ctx.restore(); }
    function vline(v, col, lw = 1.6, dash) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(X(v), b.y); ctx.lineTo(X(v), b.y + b.h); ctx.stroke(); ctx.restore(); }
    function bars(edges, vals, col) {
      ctx.save(); ctx.fillStyle = col;
      for (let i = 0; i < vals.length; i++) { const xa = X(edges[i]), xb = X(edges[i + 1]), yv = Y(Math.max(vals[i], ly ? 1e-300 : 0)), y0p = b.y + b.h; if (vals[i] > 0) ctx.fillRect(xa + 0.5, yv, Math.max(0.5, xb - xa - 1), y0p - yv); }
      ctx.restore();
    }
    function clip() { ctx.beginPath(); ctx.rect(b.x, b.y - 2, b.w + 2, b.h + 4); ctx.clip(); }
    function text(x, y, s, opts = {}) { K.label(ctx, s, X(x) + (opts.dx || 0), Y(y) + (opts.dy || 0), opts); }
    return { X, Y, axes, line, fn, dots, err, hline, vline, bars, clip, text, b, o, setX, setY };
  };
  K.ticks = (vals, fmt) => vals.map(v => ({ v, l: fmt ? fmt(v) : String(v) }));

  // ---------- data helpers ----------
  K.Ring = function (n) {
    const buf = new Float64Array(n); let len = 0, head = 0;
    return {
      push(v) { buf[head] = v; head = (head + 1) % n; if (len < n) len++; },
      values() { const out = new Float64Array(len); for (let i = 0; i < len; i++) out[i] = buf[(head - len + i + n) % n]; return out; },
      mean() { if (!len) return NaN; let s = 0; for (let i = 0; i < len; i++) s += buf[i]; return s / len; },
      get len() { return len; }, get last() { return len ? buf[(head - 1 + n) % n] : NaN; },
      clear() { len = 0; head = 0; }
    };
  };
  K.Hist = function (nb, lo, hi) {
    const c = new Float64Array(nb); let tot = 0; const w = (hi - lo) / nb;
    return {
      c, add(v) { const k = Math.floor((v - lo) / w); if (k >= 0 && k < nb) { c[k]++; } tot++; },
      density() { return Float64Array.from(c, v => tot ? v / (tot * w) : 0); },
      edges() { return Float64Array.from({ length: nb + 1 }, (_, i) => lo + i * w); },
      get tot() { return tot; }, clear() { c.fill(0); tot = 0; }
    };
  };
  // do fn() repeatedly for about ms milliseconds (or until it returns false); in export mode, a fixed count
  K.budget = function (ms, fn, maxN = 1e9) {
    const t0 = performance.now(); let n = 0;
    do { if (fn() === false) break; n++; } while (performance.now() - t0 < ms && n < maxN);
    return n;
  };
  K.fmt = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d).replace(/^-(0\.0*)$/, '$1') : '–');
  K.sig = function (x, n = 2) {
    if (!Number.isFinite(x)) return '–';
    const a = Math.abs(x);
    if (a !== 0 && (a < 1e-2 || a >= 1e5)) { const e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e); return m.toFixed(n - 1) + '×10' + String(e).replace(/-/g, '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]); }
    return a >= 1000 ? Math.round(x).toLocaleString('en-US') : String(+x.toPrecision(n));
  };
  K.smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  K.erf = function (x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
  // small legend: items [{label, color, kind:'line'|'dash'|'dot'|'sq'}]
  K.legend = function (ctx, x, y, items, o = {}) {
    const fs = o.size || 18, gap = o.gap || 26; let cx = x;
    for (const it of items) {
      ctx.save();
      if (it.kind === 'dot') U.circle(ctx, cx + 9, y - fs * 0.32, 6, it.color, '#fff', 1.4);
      else if (it.kind === 'sq') { ctx.fillStyle = it.color; ctx.fillRect(cx + 2, y - fs * 0.32 - 7, 14, 14); }
      else { ctx.strokeStyle = it.color; ctx.lineWidth = 3; if (it.kind === 'dash') ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(cx, y - fs * 0.32); ctx.lineTo(cx + 22, y - fs * 0.32); ctx.stroke(); }
      ctx.restore();
      const w = K.label(ctx, it.label, cx + 30, y, { size: fs, color: C.inkSoft });
      if (o.vertical) { y += fs + 12; } else cx += 30 + w + gap;
    }
  };
})();
