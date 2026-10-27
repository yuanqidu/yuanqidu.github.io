/* Minimal, dependency-free slide engine.
   Keys: → / Space / PageDown / click = next build · ← / PageUp = previous · Home / End
         S = presenter view (notes, timer, next slide) · O = overview · F = fullscreen · B = black screen
         P = pause animations · G = go to slide number · ? = help
   URL options: ?short (skip slides marked data-optional) · #/12 deep link · ?export (static capture mode) */
(function () {
  'use strict';
  const W = 1920, H = 1080;
  const params = new URLSearchParams(location.search);
  const MODE = params.has('presenter') ? 'presenter' : params.has('embed') ? 'embed' : 'main';
  const SHORT = params.has('short');
  const EXPORT = params.has('export');
  if (MODE === 'presenter') { document.addEventListener('DOMContentLoaded', buildPresenter); return; }

  let slides = [], order = [], pos = 0, frag = 0, scale = 1, paused = false;
  const instances = new Map(); // canvas -> {inst, surf}
  let viewport, stage, progressEl, numEl, overviewEl, helpEl, blackEl, gotoBuf = '', gotoTimer = null;
  let presenterWin = null;

  function init() {
    viewport = document.querySelector('.viewport');
    stage = document.querySelector('.stage');
    slides = Array.from(stage.querySelectorAll(':scope > section.slide'));
    slides.forEach((s, i) => {
      s.dataset.index = i;
      const frags = Array.from(s.querySelectorAll('[data-f]'));
      let max = 0; frags.forEach(f => { max = Math.max(max, +f.dataset.f, +(f.dataset.fOut || 0)); });
      s._nfrag = max;
    });
    order = slides.map((s, i) => i).filter(i => !(SHORT && slides[i].hasAttribute('data-optional')));
    numberSlides();
    progressEl = document.createElement('div'); progressEl.className = 'progress'; stage.appendChild(progressEl);
    buildOverview(); buildHelp();
    blackEl = document.createElement('div'); blackEl.className = 'blackout'; document.body.appendChild(blackEl);
    if (MODE === 'embed') document.body.classList.add('embed');
    if (EXPORT) document.body.classList.add('export');

    if (window.renderMathInElement) {
      renderMathInElement(stage, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '$', right: '$', display: false }], throwOnError: false, trust: true, strict: false, macros: { '\\Pf': '\\overrightarrow{P}', '\\Pb': '\\overleftarrow{P}', '\\Qf': '\\overrightarrow{Q}', '\\Qb': '\\overleftarrow{Q}', '\\dd': '\\mathrm{d}' } });
    }
    window.addEventListener('resize', layout);
    layout();
    const [s0, f0] = parseHash();
    go(s0, f0, true);
    window.addEventListener('hashchange', () => { const [s, f] = parseHash(); if (s !== pos || f !== frag) go(s, f, true); });
    document.addEventListener('keydown', onKey);
    if (MODE === 'main' && !EXPORT) {
      viewport.addEventListener('click', (e) => {
        if (e.target.closest('a, button, input, .overview, .help, [data-noclick]')) return;
        if (e.clientX < window.innerWidth * 0.18) prev(); else next();
      });
    }
    window.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', () => { last = performance.now(); });
    if (!EXPORT) requestAnimationFrame(loop);
    window.__deck = { count: () => order.length, slideCount: slides.length, go: (p, f) => go(p, f, true), nfrag: (p) => slides[order[p]]._nfrag, fastForward, advance, pos: () => pos, frag: () => frag, order: () => order.slice(), titleOf: (p) => slides[order[p]].dataset.title || '' };
  }

  function numberSlides() {
    let main = 0, backup = 0;
    const mainTotal = order.filter(i => !slides[i].hasAttribute('data-backup')).length;
    order.forEach(i => {
      const s = slides[i]; let n = s.querySelector(':scope > .slide-num');
      if (!n) { n = document.createElement('div'); n.className = 'slide-num'; s.appendChild(n); }
      if (s.hasAttribute('data-backup')) { backup++; n.textContent = 'B' + backup; }
      else { main++; n.textContent = s.classList.contains('title-slide') ? '' : `${main} / ${mainTotal}`; }
      s._label = n.textContent;
    });
  }

  function parseHash() {
    const m = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/);
    if (!m) return [0, 0];
    return [Math.max(0, Math.min(order.length - 1, (+m[1]) - 1)), +(m[2] || 0)];
  }

  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    scale = Math.min(vw / W, vh / H);
    stage.style.transform = `translate(${(vw - W * scale) / 2}px, ${(vh - H * scale) / 2}px) scale(${scale})`;
    instances.forEach(({ inst, surf }) => { surf.resize(scale); inst.resize && inst.resize(); inst.draw && inst.draw(); });
  }

  // ---------- navigation ----------
  function go(p, f, instant) {
    p = Math.max(0, Math.min(order.length - 1, p));
    const prevPos = pos, changed = p !== pos || !slides[order[p]].classList.contains('active');
    const sNew = slides[order[p]];
    if (changed) {
      const sOld = slides[order[prevPos]];
      if (sOld && sOld !== sNew) { sOld.classList.remove('active'); leaveAnims(sOld); }
      sNew.classList.add('active');
      pos = p;
    }
    frag = Math.max(0, Math.min(sNew._nfrag, f === undefined ? 0 : f));
    applyFrags(sNew);
    if (changed) enterAnims(sNew);
    stepAnims(sNew);
    const mainSlides = order.filter(i => !slides[i].hasAttribute('data-backup'));
    const mi = mainSlides.indexOf(order[pos]);
    progressEl.style.width = (mi < 0 ? 100 : (100 * mi / Math.max(1, mainSlides.length - 1))) + '%';
    const h = `#/${pos + 1}${frag ? '/' + frag : ''}`;
    if (location.hash !== h && MODE === 'main') history.replaceState(null, '', h);
    broadcast();
  }
  function next() { const s = slides[order[pos]]; if (frag < s._nfrag) go(pos, frag + 1); else if (pos < order.length - 1) go(pos + 1, 0); }
  function prev() { if (frag > 0) go(pos, frag - 1); else if (pos > 0) go(pos - 1, slides[order[pos - 1]]._nfrag); }

  function applyFrags(s) {
    s.querySelectorAll('[data-f]').forEach(el => {
      const a = +el.dataset.f, b = el.dataset.fOut !== undefined ? +el.dataset.fOut : Infinity;
      const vis = frag >= a && frag < b;
      el.classList.toggle('f-vis', vis);
      el.classList.toggle('f-past', frag >= b);
    });
    s.dataset.step = frag;
  }

  // ---------- animations ----------
  function ensureInst(c) {
    if (instances.has(c)) return instances.get(c);
    const name = c.dataset.anim, factory = window.ANIMS[name];
    if (!factory) { console.warn('missing anim', name); return null; }
    const surf = U.surface(c); surf.resize(scale);
    let opts = {}; try { opts = c.dataset.opts ? JSON.parse(c.dataset.opts) : {}; } catch (e) { console.warn(e); }
    const inst = factory(surf, opts) || {};
    const rec = { inst, surf, t: 0 };
    instances.set(c, rec); return rec;
  }
  function animsOf(s) { return Array.from(s.querySelectorAll('canvas[data-anim]')); }
  function enterAnims(s) { animsOf(s).forEach(c => { const r = ensureInst(c); if (r) { r.active = true; r.inst.enter && r.inst.enter(); r.inst.draw && r.inst.draw(); } }); }
  function leaveAnims(s) { animsOf(s).forEach(c => { const r = instances.get(c); if (r) { r.active = false; r.inst.leave && r.inst.leave(); } }); }
  // data-step-map='[0,0,1,…]' on a canvas maps slide build → animation step (when builds are re-staged around an animation)
  function animStep(c) { if (!c.dataset.stepMap) return frag; const m = JSON.parse(c.dataset.stepMap); return m[Math.min(frag, m.length - 1)]; }
  function stepAnims(s) { animsOf(s).forEach(c => { const r = instances.get(c); if (r && r.inst.step) { r.inst.step(animStep(c)); r.inst.draw && r.inst.draw(); } }); }

  let last = performance.now();
  function loop(now) {
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (paused || document.hidden) dt = 0;
    if (dt > 0) instances.forEach((r) => { if (r.active && r.inst.frame) { r.t += dt; r.inst.frame(dt, r.t); } });
    requestAnimationFrame(loop);
  }
  function advance(sec) { // advance active animations by exactly sec seconds (testing)
    const s = slides[order[pos]];
    animsOf(s).forEach(c => { const r = instances.get(c); if (!r || !r.inst.frame) return; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { r.t += 1 / 60; r.inst.frame(1 / 60, r.t); } if (r.inst.draw) r.inst.draw(); });
  }
  function fastForward(sec) {
    const s = slides[order[pos]];
    animsOf(s).forEach(c => { const r = instances.get(c); if (!r || !r.inst.frame) return; const n = Math.round((r.inst.ff !== undefined ? r.inst.ff : sec) * 60); for (let i = 0; i < n; i++) { r.t += 1 / 60; r.inst.frame(1 / 60, r.t); } if (r.inst.draw) r.inst.draw(); });
  }

  // ---------- keys ----------
  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (overviewEl.classList.contains('open')) { if (k === 'Escape' || k === 'o' || k === 'O') toggleOverview(false); return; }
    if (helpEl.classList.contains('open') && (k === 'Escape' || k === '?')) { helpEl.classList.remove('open'); return; }
    if (/^[0-9]$/.test(k)) { gotoBuf += k; clearTimeout(gotoTimer); gotoTimer = setTimeout(() => { gotoBuf = ''; }, 1500); return; }
    if (k === 'Enter' && gotoBuf) { go(+gotoBuf - 1, 0); gotoBuf = ''; e.preventDefault(); return; }
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'n': case 'N': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': case 'p': e.preventDefault(); prev(); break;
      case 'Home': go(0, 0); break;
      case 'End': go(order.length - 1, 0); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'o': case 'O': toggleOverview(true); break;
      case 's': case 'S': openPresenter(); break;
      case 'b': case 'B': case '.': blackEl.classList.toggle('on'); break;
      case 'P': paused = !paused; document.body.classList.toggle('paused', paused); break;
      case '?': case 'h': helpEl.classList.toggle('open'); break;
    }
  }
  function toggleFullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); }

  // ---------- overview ----------
  function buildOverview() {
    overviewEl = document.createElement('div'); overviewEl.className = 'overview';
    const grid = document.createElement('div'); grid.className = 'ov-grid'; overviewEl.appendChild(grid);
    order.forEach((i, p) => {
      const s = slides[i]; const card = document.createElement('button'); card.className = 'ov-card';
      if (s.hasAttribute('data-backup')) card.classList.add('ov-backup');
      if (s.hasAttribute('data-optional')) card.classList.add('ov-optional');
      card.innerHTML = `<span class="ov-num">${s._label || ''}</span><span class="ov-sec">${s.dataset.section || ''}</span><span class="ov-title">${s.dataset.title || ''}</span>`;
      card.addEventListener('click', (e) => { e.stopPropagation(); toggleOverview(false); go(p, 0); });
      grid.appendChild(card);
    });
    document.body.appendChild(overviewEl);
  }
  function toggleOverview(open) {
    overviewEl.classList.toggle('open', open);
    if (open) { overviewEl.querySelectorAll('.ov-card').forEach((c, p) => c.classList.toggle('ov-cur', p === pos)); }
  }
  function buildHelp() {
    helpEl = document.createElement('div'); helpEl.className = 'help';
    helpEl.innerHTML = `<div class="help-card"><h3>Keyboard</h3><table>
      <tr><td>→ Space PgDn click</td><td>next build / slide</td></tr><tr><td>← PgUp</td><td>previous</td></tr>
      <tr><td>S</td><td>presenter view: notes, timer, next slide</td></tr><tr><td>O</td><td>overview (Esc to close)</td></tr>
      <tr><td>F</td><td>fullscreen</td></tr><tr><td>B or .</td><td>black screen</td></tr><tr><td>Shift+P</td><td>pause animations</td></tr>
      <tr><td>12 Enter</td><td>jump to slide 12</td></tr><tr><td>?short in URL</td><td>skip optional slides (shorter talk)</td></tr></table></div>`;
    helpEl.addEventListener('click', () => helpEl.classList.remove('open'));
    document.body.appendChild(helpEl);
  }

  // ---------- presenter link ----------
  function openPresenter() {
    if (presenterWin && !presenterWin.closed) { presenterWin.focus(); broadcast(); return; }
    const url = location.href.split('#')[0].split('?')[0] + '?presenter' + (SHORT ? '&short' : '');
    presenterWin = window.open(url, 'deck-presenter', 'width=1400,height=860');
    setTimeout(broadcast, 800); setTimeout(broadcast, 2000);
  }
  function broadcast() {
    const msg = { type: 'deck-state', pos, frag, total: order.length };
    if (presenterWin && !presenterWin.closed) presenterWin.postMessage(msg, '*');
  }
  function onMessage(e) {
    const d = e.data || {};
    if (d.type === 'deck-nav') { if (d.dir === 'next') next(); else if (d.dir === 'prev') prev(); else if (d.dir === 'goto') go(d.pos, d.frag || 0); }
    if (d.type === 'deck-goto') go(d.pos, d.frag || 0, true);
    if (d.type === 'deck-hello' && e.source) { presenterWin = presenterWin || e.source; broadcast(); }
  }

  // ---------- presenter window (same file, ?presenter) ----------
  function buildPresenter() {
    const deckSlides = Array.from(document.querySelectorAll('.stage > section.slide'));
    const ord = deckSlides.map((s, i) => i).filter(i => !(SHORT && deckSlides[i].hasAttribute('data-optional')));
    const notes = ord.map(i => { const n = deckSlides[i].querySelector('aside.notes'); return n ? n.innerHTML : ''; });
    const titles = ord.map(i => deckSlides[i].dataset.title || '');
    const nfr = ord.map(i => { let m = 0; deckSlides[i].querySelectorAll('[data-f]').forEach(f => { m = Math.max(m, +f.dataset.f, +(f.dataset.fOut || 0)); }); return m; });
    document.body.innerHTML = '';
    document.body.className = 'presenter';
    const base = location.href.split('?')[0];
    const q = SHORT ? '&short' : '';
    document.body.innerHTML = `
      <div class="pv">
        <div class="pv-main"><div class="pv-label">Current</div><div class="pv-frame"><iframe id="pvCur" src="${base}?embed${q}"></iframe></div></div>
        <div class="pv-side">
          <div class="pv-label">Next</div><div class="pv-frame small"><iframe id="pvNext" src="${base}?embed${q}"></iframe></div>
          <div class="pv-timer"><span id="pvClock">00:00</span><button id="pvReset" title="reset timer">reset</button><button id="pvPause">pause</button><span id="pvNum"></span></div>
          <div class="pv-title" id="pvTitle"></div>
          <div class="pv-notes" id="pvNotes"></div>
        </div>
      </div>`;
    const cur = document.getElementById('pvCur'), nxt = document.getElementById('pvNext');
    let state = { pos: 0, frag: 0 }, t0 = Date.now(), pausedAt = null;
    function tick() {
      const el = (pausedAt || Date.now()) - t0; const m = Math.floor(el / 60000), s = Math.floor(el / 1000) % 60;
      document.getElementById('pvClock').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    setInterval(tick, 500);
    document.getElementById('pvReset').onclick = () => { t0 = Date.now(); if (pausedAt) pausedAt = t0; tick(); };
    document.getElementById('pvPause').onclick = (e) => { if (pausedAt) { t0 += Date.now() - pausedAt; pausedAt = null; e.target.textContent = 'pause'; } else { pausedAt = Date.now(); e.target.textContent = 'resume'; } };
    function render() {
      const p = state.pos;
      document.getElementById('pvNotes').innerHTML = notes[p] || '<em>(no notes)</em>';
      document.getElementById('pvTitle').textContent = titles[p] || '';
      document.getElementById('pvNum').textContent = `slide ${p + 1}/${ord.length} · build ${state.frag}/${nfr[p]}`;
      try { cur.contentWindow.postMessage({ type: 'deck-goto', pos: p, frag: state.frag }, '*'); } catch (e) {}
      let np = p, nf = state.frag + 1; if (nf > nfr[p]) { np = Math.min(ord.length - 1, p + 1); nf = np === p ? state.frag : 0; }
      try { nxt.contentWindow.postMessage({ type: 'deck-goto', pos: np, frag: nf }, '*'); } catch (e) {}
    }
    window.addEventListener('message', (e) => { const d = e.data || {}; if (d.type === 'deck-state') { state = d; render(); } });
    cur.addEventListener('load', render); nxt.addEventListener('load', render);
    document.addEventListener('keydown', (e) => {
      const k = e.key; if (!window.opener) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(k)) { e.preventDefault(); window.opener.postMessage({ type: 'deck-nav', dir: 'next' }, '*'); }
      if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); window.opener.postMessage({ type: 'deck-nav', dir: 'prev' }, '*'); }
    });
    if (window.opener) window.opener.postMessage({ type: 'deck-hello' }, '*');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
