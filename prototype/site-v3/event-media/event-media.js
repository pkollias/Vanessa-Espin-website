// Event media: a horizontal strip of everything an event's film does not show, and a pop-up that opens one item whole.
// One module for every event; each event supplies a manifest (see manifests/ and README.md).
//
//   import { mountEventMedia } from '/Vanessa-Espin-website/event-media/event-media.js';
//   mountEventMedia({ manifest: '/Vanessa-Espin-website/event-media/manifests/iyuana.json' });

const CSS_URL = new URL('./event-media.css' + new URL(import.meta.url).search, import.meta.url).href;   // the script's ?v= stamp carries over to the stylesheet
const FONTS_URL = 'https://api.fontshare.com/v2/css?f[]=gambetta@300,400,401&f[]=switzer@400,500,600&display=swap';
const raf = window.requestAnimationFrame.bind(window);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // in-out cubic: no overshoot
const pad2 = (n) => String(n).padStart(2, '0');
const el = (tag, cls, attrs = {}) => { const e = document.createElement(tag); if (cls) e.className = cls; for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

const KIND_PLACARD = {
  painting: 'Painting · Luis Medina',
  design: 'Print & Identity',
  poster: 'Exhibition Poster',
  print: 'Archival Print',
  video: 'Event Film Clip',
  photo: 'Photograph',
};

function fmtDur(sec) {
  if (!sec || !Number.isFinite(sec)) return 'Clip';
  const s = Math.max(1, Math.round(sec));
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
}

// ── Pausing the film underneath ──────────────────────────────────────────────────────────────────────────
// Films often play a <video> that is never attached to the page (it feeds a texture). Record every media element
// the page plays, so the viewer can pause them while it is open. This is why the module is loaded before the film's script.
const played = new Set();
const nativePlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function () {
  if (!(this.closest && this.closest('.evm'))) played.add(this);
  return nativePlay.apply(this, arguments);
};
// Every film already stops cleanly when its tab is hidden and restarts its clock when the tab returns.
// The viewer uses that same path: while it is open the page reports itself hidden.
let heldMedia = [];
function holdFilm(on) {
  if (on) {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    heldMedia = [...played].filter((m) => !m.paused && !m.ended);
    heldMedia.forEach((m) => m.pause());
  } else {
    delete document.hidden; delete document.visibilityState;
    heldMedia.forEach((m) => { const p = nativePlay.call(m); if (p && p.catch) p.catch(() => {}); });
    heldMedia = [];
  }
  document.dispatchEvent(new Event('visibilitychange'));
}

export async function mountEventMedia(options = {}) {
  const opt = { endRatio: 0.94, quiet: true, button: null, pauseFilm: true, ...options };
  const embedded = window.self !== window.top;
  const manifest = typeof opt.manifest === 'string' ? await (await fetch(opt.manifest, { cache: 'no-cache' })).json() : opt.manifest;
  const items = manifest.items, N = items.length;

  // Ensure Gambetta (incl. 401 italic) + Switzer are available even on film pages that didn't link Fontshare
  if (![...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.href.includes('gambetta') && l.href.includes('401'))) {
    document.head.appendChild(el('link', '', { rel: 'stylesheet', href: FONTS_URL }));
  }

  if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
    const link = el('link', '', { rel: 'stylesheet', href: CSS_URL });
    document.head.appendChild(link);
    await new Promise((r) => { link.addEventListener('load', r, { once: true }); link.addEventListener('error', r, { once: true }); setTimeout(r, 1500); });
  }

  // ── Markup ────────────────────────────────────────────────────────────────────────────────────────────
  const root = el('div', 'evm', { role: 'dialog', 'aria-modal': 'true', 'aria-label': `Media: ${manifest.title}`, 'data-event': manifest.event });
  root.hidden = true;
  const atmo = el('div', 'evm__atmo', { 'aria-hidden': 'true' });
  const grain = el('div', 'evm__grain', { 'aria-hidden': 'true' });
  const chrome = el('div', 'evm__chrome');
  const backBtn = el('button', 'evm__back', { type: 'button' }); backBtn.textContent = '← Back to Event';
  const titleEl = el('span', 'evm__title'); titleEl.textContent = manifest.title;
  const countEl = el('span', 'evm__count', { 'aria-live': 'polite' });
  chrome.append(backBtn, titleEl, countEl);
  const viewport = el('div', 'evm__viewport');
  const track = el('div', 'evm__track');
  viewport.appendChild(track);
  const map = el('div', 'evm__map', { role: 'group', 'aria-label': 'All items' });
  const pop = el('div', 'evm-pop'); pop.hidden = true;
  const scrim = el('div', 'evm-pop__scrim');
  const edgePrev = el('button', 'evm-pop__edge evm-pop__edge--prev', { type: 'button', 'aria-label': 'Previous item' });
  const edgeNext = el('button', 'evm-pop__edge evm-pop__edge--next', { type: 'button', 'aria-label': 'Next item' });
  pop.append(scrim, edgePrev, edgeNext);

  // Two-voice museum placard shown underneath popped-open works
  const placard = el('div', 'evm-placard', { 'aria-hidden': 'true' });
  const placardKind = el('span', 'evm-placard__kind');
  const placardTitle = el('span', 'evm-placard__title');
  placard.append(placardKind, placardTitle);

  // Hover thumbnail loupe above the architectural tick-ruler
  const loupe = el('div', 'evm-loupe', { 'aria-hidden': 'true' });
  const loupeImg = el('img', '', { alt: '', decoding: 'async' });
  const loupeCap = el('div', 'evm-loupe__cap');
  loupe.append(loupeImg, loupeCap);

  root.append(atmo, viewport, pop, chrome, map, placard, loupe, grain);

  const label = (it, i) => `${{ photo: 'Photograph', painting: 'Painting', poster: 'Poster', print: 'Print', design: 'Design', video: 'Video' }[it.kind] || 'Item'} ${i + 1} of ${N}${it.title ? ': ' + it.title : ''}`;
  const syncPlacard = (i) => {
    const it = items[i];
    if (!it) return;
    placardKind.textContent = KIND_PLACARD[it.kind] || 'Archive';
    const t = it.title ? it.title.charAt(0).toUpperCase() + it.title.slice(1) : `${KIND_PLACARD[it.kind] || 'Item'} ${pad2(i + 1)}`;
    placardTitle.textContent = t;
  };

  const node = items.map((it, i) => {
    const fig = el('figure', 'evm-item', { 'data-i': i, 'data-kind': it.kind, 'data-type': it.type });
    const frame = el('button', 'evm-item__frame', { type: 'button', 'aria-label': 'Open ' + label(it, i) });
    let media, video = null, snap = null;
    if (it.type === 'video') {
      // A video frame is three layers in one panning box: a still (its poster), a canvas that holds the last frame shown, and the video itself.
      // The video element is only on screen while it plays; a moving strip shows stills, which cost nothing to slide.
      media = el('div', 'evm-item__media evm-item__media--video');
      const still = el('img', '', { alt: '', draggable: 'false', decoding: 'async' }); still.src = it.poster || it.thumb;
      snap = el('canvas', '', { 'aria-hidden': 'true' }); snap.hidden = true;
      video = el('video', '', { preload: 'none', playsinline: '', loop: '', 'aria-hidden': 'true' }); video.muted = true; video.defaultMuted = true; video.hidden = true;
      media.append(still, snap, video);
    } else {
      media = el('img', 'evm-item__media', { alt: '', decoding: 'async', draggable: 'false' });
      media.src = it.thumb || it.src;
    }
    frame.append(media, el('span', 'evm-item__veil', { 'aria-hidden': 'true' }));
    if (it.type === 'video') {
      const vp = el('span', 'evm-item__vid-pill', { 'aria-hidden': 'true' });
      vp.textContent = `▶ ${fmtDur(it.duration)}`;
      frame.appendChild(vp);
    }
    fig.appendChild(frame); track.appendChild(fig);

    const thumb = el('button', 'evm-map__thumb', { type: 'button', 'aria-label': 'Go to ' + label(it, i), 'data-i': i, 'data-kind': it.kind || 'photo' });
    thumb.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = thumb.getBoundingClientRect();
      const src = it.thumb || it.poster || it.src;
      if (loupeImg.dataset.src !== src) { loupeImg.dataset.src = src; loupeImg.src = src; }
      loupeCap.textContent = `${pad2(i + 1)} · ${it.title || KIND_PLACARD[it.kind] || it.kind}`;
      const lx = clamp(rect.left + rect.width / 2, 70, window.innerWidth - 70);
      loupe.style.left = `${lx}px`;
      loupe.style.top = `${Math.max(12, rect.top - 98)}px`;
      loupe.classList.add('is-shown');
    });
    thumb.addEventListener('pointerleave', () => loupe.classList.remove('is-shown'));
    map.appendChild(thumb);
    return { fig, frame, media, video, snap, thumb, full: it.type === 'video' };
  });
  map.addEventListener('pointerleave', () => loupe.classList.remove('is-shown'));
  document.body.appendChild(root);

  // ── State ─────────────────────────────────────────────────────────────────────────────────────────────
  const L = new Array(N), W = new Array(N), MW = new Array(N), MH = new Array(N);   // slot left, slot width at rest, picture width and height (px)
  const WO = new Array(N), EX = new Float32Array(N), SH = new Float32Array(N);        // slot width when selected; the extra width it has right now; how far its neighbours have pushed it
  const Lx = (i) => L[i] + SH[i], Wx = (i) => W[i] + EX[i];                            // where a slot is and how wide it is at this instant
  let vw = 0, vh = 0, H = 0, top = 0, maxX = 0, focus0 = 0, focus1 = 0, panK = 0.85, wheelK = 1, tau = 0.13, inertia = 320, popMs = 520, insetX = 0, insetY = 0, upscale = 1;
  let x = 0, tx = 0, cur = -1, isOpen = false, running = false, last = 0, dirty = true;
  let px = -1, py = -1, hoverI = -1, focusI = -1, sel = -1, openTau = 0.1;             // pointer position; the frame under it; the frame with keyboard focus; the selected (widened) frame
  const coarse = window.matchMedia('(hover: none)');
  let drag = null, popI = -1, popE = 0, popTo = 0, popBox = null, popMedia = null, popT0 = 0, popFromE = 0, lastFocus = null, closeTimer = 0, dealTimer = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // The "current" frame is the one nearest a focus point that travels with the scroll: at rest on the first frame,
  // at the far end on the last. (When the strip rests at the centre, the focus point simply stays at the centre.)
  const focusAt = (atX = x) => (maxX > 0 ? lerp(focus0, focus1, clamp(atX / maxX, 0, 1)) : vw / 2);
  const restFor = (i) => { const c = L[i] + W[i] / 2; return maxX > 0 ? clamp((c - focus0) / (1 + (focus1 - focus0) / maxX), 0, maxX) : 0; };   // the scroll at which frame i is current
  const panX = (i, atX = x) => {              // the counter-pan: as a slot travels left, its picture drifts right inside it
    const w = Wx(i), range = MW[i] - w; if (range <= 0.5) return 0;
    const p = clamp((Lx(i) + w / 2 - atX - vw / 2) / (vw / 2 + w / 2), -1, 1);
    return -range / 2 - p * (range / 2) * panK;
  };

  function layout() {
    const cs = getComputedStyle(root), num = (name, d) => { const v = parseFloat(cs.getPropertyValue(name)); return Number.isFinite(v) ? v : d; };
    vw = root.clientWidth; vh = root.clientHeight;
    H = Math.round(vh * num('--evm-strip-h', 0.58)); top = Math.round((vh - H) / 2 + vh * num('--evm-strip-y', 0));
    const gap = num('--evm-gap', 16), aperture = num('--evm-aperture', 0.38), apertureOpen = num('--evm-aperture-open', 0.62);
    openTau = num('--evm-open-ms', 300) / 3000;
    panK = num('--evm-pan', 1); wheelK = num('--evm-wheel', 1); tau = num('--evm-glide', 0.13); inertia = num('--evm-inertia', 320);
    popMs = num('--evm-pop-ms', 520); insetX = num('--evm-pop-inset-x', 0.05) * vw; insetY = num('--evm-pop-inset-y', 0.095) * vh; upscale = num('--evm-pop-upscale', 1);
    const edge = num('--evm-edge', 0.1) * vw, restCentre = num('--evm-rest-centre', 0) >= 0.5;
    // Every frame is the same narrow window at rest and widens when selected (hovered, focused, or current on a touch screen).
    // Every picture is at least panMin wider than the widened frame, so it has a long way to pan at rest and still moves when selected.
    const panMin = num('--evm-pan-min', 0.35), keepWhole = num('--evm-whole-in-strip', 0) >= 0.5;
    items.forEach((it, i) => {
      const asp = it.w / it.h, own = keepWhole && it.whole;
      W[i] = Math.round(H * (own ? asp : aperture)); WO[i] = own ? W[i] : Math.max(W[i], Math.round(H * apertureOpen));
      MW[i] = own ? W[i] : Math.max(Math.round(H * asp), Math.round(WO[i] * (1 + panMin))); MH[i] = own ? H : Math.max(H, Math.round(MW[i] / asp));
      node[i].fig.classList.toggle('is-whole', own); node[i].fig.classList.toggle('is-aperture', !own);
    });
    const total = W.reduce((a, b) => a + b, 0) + gap * (N - 1);
    // At rest the first frame sits one margin in from the left (or at the centre); the last frame ends the same way. A strip shorter than the screen is centred.
    let at = total + 2 * edge <= vw ? (vw - total) / 2 : restCentre ? Math.max(0, (vw - W[0]) / 2) : edge;
    items.forEach((it, i) => {
      L[i] = Math.round(at); at += W[i] + gap;
      const n = node[i];
      n.fig.style.cssText = `left:${L[i]}px;top:${top}px;width:${W[i]}px;height:${H}px`; n.w = n.s = undefined;
      n.media.style.width = MW[i] + 'px'; n.media.style.height = MH[i] + 'px'; n.media.style.top = Math.round((H - MH[i]) / 2) + 'px';
    });
    const lastC = L[N - 1] + W[N - 1] / 2;
    maxX = total + 2 * edge <= vw ? 0 : Math.max(0, Math.round(restCentre ? lastC - vw / 2 : L[N - 1] + W[N - 1] + edge - vw));
    focus0 = L[0] + W[0] / 2; focus1 = lastC - maxX;
    x = clamp(x, 0, maxX); tx = clamp(tx, 0, maxX); dirty = true;
  }

  // ── Loading and playing only what is near the screen ──────────────────────────────────────────────────
  function loadFull(i) {
    const n = node[i], it = items[i]; if (n.full) return; n.full = true;
    // The strip shows a smaller whole copy (it.strip); the full file is fetched only when a picture is opened.
    const im = new Image(); im.decoding = 'async'; im.alt = ''; im.draggable = false; im.src = it.strip || it.src;
    (im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; })).then(() => {
      if (!n.full) return;                      // it scrolled far away while loading
      if (!n.small) n.small = n.media;          // keep the thumbnail element to return to
      im.className = n.media.className; im.style.cssText = n.media.style.cssText;
      n.media.replaceWith(im); n.media = im; n.fig.classList.add('is-loaded'); dirty = true; kick();
    }, () => { n.full = false; });
  }
  // Memory: only what is near the screen stays loaded. A frame far behind or ahead goes back to its thumbnail,
  // and a far video gives up its buffer. Closing the viewer releases everything.
  function unload(i) {
    const n = node[i];
    if (n.video) { const v = n.video; if (v.getAttribute('src')) { v.pause(); v.removeAttribute('src'); v.load(); } v.hidden = true; n.fig.classList.remove('is-playing'); n.snap.width = n.snap.height = 0; n.snap.hidden = true; return; }
    if (!n.small || n.media === n.small) { if (!n.fig.classList.contains('is-loaded')) n.full = false; return; }   // still a thumbnail: just drop any load in flight
    n.small.style.cssText = n.media.style.cssText; n.media.replaceWith(n.small); n.media.removeAttribute('src'); n.media = n.small; n.full = false; n.fig.classList.remove('is-loaded');
  }
  function rest(i) {                            // take the video off screen, leaving its last frame on the canvas
    const n = node[i], v = n.video; n.fig.classList.remove('is-playing'); if (v.hidden) return;
    if (v.readyState >= 2 && v.videoWidth) { n.snap.width = v.videoWidth; n.snap.height = v.videoHeight; try { n.snap.getContext('2d').drawImage(v, 0, 0); n.snap.hidden = false; } catch {} }
    v.pause(); v.hidden = true;
  }
  // At most two videos play, only while at least half on screen. They never start or stop inside the scroll loop:
  // every video rests once when motion begins, and the visible ones start once the strip has been still for a moment.
  let anyLive = false, settleTimer = 0;
  function restAll() { if (!anyLive) return; anyLive = false; for (let i = 0; i < N; i++) if (node[i].video) rest(i); }
  function playVisible() {
    if (!isOpen || popI >= 0 || drag || x !== tx) return;
    const live = [];
    for (let i = 0; i < N; i++) {
      if (!node[i].video) continue;
      const l = L[i] - x, r = l + W[i], seen = Math.max(0, Math.min(r, vw) - Math.max(l, 0)) / W[i];
      if (seen >= 0.5) live.push([Math.abs(l + W[i] / 2 - vw / 2), i]);
    }
    live.sort((a, b) => a[0] - b[0]).slice(0, 2).forEach(([, i]) => {
      const v = node[i].video; anyLive = true; node[i].fig.classList.add('is-playing');
      if (v.hidden) { v.hidden = false; if (!v.src) v.src = items[i].src; }
      if (v.paused) { const p = nativePlay.call(v); if (p && p.catch) p.catch(() => {}); }
    });
  }
  const settleSoon = () => { clearTimeout(settleTimer); settleTimer = setTimeout(playVisible, 280); };

  // ── One loop: glide, counter-pan, counter, pop-up ─────────────────────────────────────────────────────
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (!drag) {
      const k = reduce.matches ? 1 : 1 - Math.exp(-dt / tau);
      x += (tx - x) * k; if (Math.abs(tx - x) < 0.15) x = tx;
    }
    if (popI >= 0 && popE !== popTo) {
      const span = reduce.matches ? 1 : clamp((now - popT0) / popMs, 0, 1);
      popE = lerp(popFromE, popTo, ease(span)); if (span >= 1) popE = popTo;
      if (popE === 0 && popTo === 0) endPop();
    }
    // Which frame is selected: the one under the pointer, else the one with keyboard focus, else (touch screens) the current one.
    if (!drag) {
      hoverI = -1;
      if (px >= 0 && popI < 0 && !coarse.matches && py >= top && py <= top + H) for (let i = 0; i < N; i++) { const l = Lx(i) - x; if (px >= l && px <= l + Wx(i)) { hoverI = i; break; } }
    }
    const want = popI >= 0 ? -1 : hoverI >= 0 ? hoverI : focusI >= 0 ? focusI : coarse.matches ? cur : -1;
    if (want !== sel) { if (sel >= 0) node[sel].fig.classList.remove('is-selected'); sel = want; if (sel >= 0) node[sel].fig.classList.add('is-selected'); }
    // The selected frame widens about its own centre and its neighbours step aside by half of that on each side.
    let widening = false, total = 0; const ko = reduce.matches ? 1 : 1 - Math.exp(-dt / openTau);
    for (let i = 0; i < N; i++) { const goal = i === sel ? WO[i] - W[i] : 0; if (EX[i] !== goal) { EX[i] += (goal - EX[i]) * ko; if (Math.abs(goal - EX[i]) < 0.4) EX[i] = goal; else widening = true; } total += EX[i]; }
    for (let i = 0, before = 0; i < N; i++) { SH[i] = before - total / 2; before += EX[i]; }
    if (drag || x !== tx || popI >= 0) restAll();
    render();
    running = isOpen && (drag || x !== tx || widening || (popI >= 0 && popE !== popTo) || dirty);
    dirty = false;
    if (running) raf(frame); else settleSoon();
  }
  const kick = () => { if (!running && isOpen) { running = true; last = performance.now(); raf(frame); } };

  function render() {
    track.style.transform = `translate3d(${-x}px,0,0)`;
    let best = 0, bestD = Infinity; const fx = focusAt();
    for (let i = 0; i < N; i++) {
      const n = node[i], w = Wx(i), l = Lx(i) - x, d = Math.abs(l + w / 2 - fx);
      if (d < bestD) { bestD = d; best = i; }
      if (n.w !== w) { n.w = w; n.fig.style.width = w.toFixed(2) + 'px'; }
      if (n.s !== SH[i]) { n.s = SH[i]; n.fig.style.setProperty('--evm-shift', SH[i].toFixed(2) + 'px'); }
      const near = l < vw * 2.2 && l + w > -vw * 1.2, seen = l < vw && l + w > 0;
      if (near) loadFull(i); else if (l > vw * 3.6 || l + w < -vw * 2.6) unload(i);
      if (near && MW[i] - w > 0.5) n.media.style.transform = `translate3d(${panX(i).toFixed(2)}px,0,0)`;
      n.thumb.classList.toggle('is-in-view', seen);
    }
    if (best !== cur) {
      if (cur >= 0) { node[cur].fig.classList.remove('is-current'); node[cur].thumb.classList.remove('is-current'); }
      cur = best; node[cur].fig.classList.add('is-current'); node[cur].thumb.classList.add('is-current');
    }
    const shown = popI >= 0 ? popI : cur;
    const text = `${pad2(shown + 1)} — ${pad2(N)}`; if (countEl.textContent !== text) countEl.textContent = text;
    if (popI >= 0) renderPop();
  }

  const goTo = (i, snap = false) => { tx = restFor(clamp(i, 0, N - 1)); if (snap) x = tx; dirty = true; kick(); };

  // ── The pop-up: a slot opens into the whole picture, and folds back into the same slot ────────────────
  function fitted(i) {                         // the whole picture at its natural shape, never larger than its file
    const it = items[i], s = Math.min((vw - 2 * insetX) / it.w, (vh - 2 * insetY) / it.h, upscale);
    const w = it.w * s, h = it.h * s;
    return { l: (vw - w) / 2, t: (vh - h) / 2, w, h };
  }
  function buildPopMedia(i) {
    const it = items[i], box = el('div', 'evm-pop__box', { 'data-kind': it.kind });
    let m;
    if (it.type === 'video') {
      m = el('video', 'evm-pop__media', { playsinline: '', loop: '', controls: '' }); m.muted = true; if (it.poster) m.poster = it.poster; m.src = it.src;
      const from = node[i].video; m.addEventListener('loadedmetadata', () => { try { m.currentTime = from.currentTime || 0; } catch {} const p = nativePlay.call(m); if (p && p.catch) p.catch(() => {}); }, { once: true });
    } else {
      // Open with what the strip already shows, then swap in the full file once it has decoded
      m = el('img', 'evm-pop__media', { alt: label(it, i), draggable: 'false' }); m.src = node[i].media.currentSrc || node[i].media.src;
      const im = new Image(); im.decoding = 'async'; im.src = it.src;
      (im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; })).then(() => { if (m.isConnected) m.src = it.src; }, () => {});
    }
    box.appendChild(m); pop.appendChild(box);
    return [box, m];
  }
  function markSides() {
    node.forEach((n, i) => { n.fig.classList.toggle('is-before', popI >= 0 && i < popI); n.fig.classList.toggle('is-after', popI >= 0 && i > popI); n.fig.classList.toggle('is-open', i === popI); n.thumb.classList.toggle('is-open', i === popI); });
  }
  function openPop(i) {
    if (popI >= 0 || !isOpen) return;
    popI = i; pop.hidden = false; root.classList.add('is-popped'); loupe.classList.remove('is-shown');
    syncPlacard(i);
    [popBox, popMedia] = buildPopMedia(i);
    markSides(); goTo(i);
    popFromE = popE = 0; popTo = 1; popT0 = performance.now(); kick();
    edgePrev.disabled = i === 0; edgeNext.disabled = i === N - 1;
  }
  function closePop(instant = false) {
    if (popI < 0) return;
    popFromE = popE; popTo = 0; popT0 = performance.now();
    if (instant) { popE = 0; endPop(); render(); } else kick();
  }
  function endPop() {
    if (popBox) popBox.remove(); popBox = popMedia = null;
    const i = popI; popI = -1; popE = popTo = 0; pop.hidden = true; root.classList.remove('is-popped');
    root.style.removeProperty('--evm-e');
    markSides();
    if (i >= 0 && root.contains(document.activeElement)) node[i].frame.focus({ preventScroll: true });
  }
  function renderPop() {
    const i = popI, e = popE, to = fitted(i);
    const l = lerp(Lx(i) - x, to.l, e), t = lerp(top, to.t, e), w = lerp(Wx(i), to.w, e), h = lerp(H, to.h, e);
    popBox.style.cssText = `left:${l.toFixed(2)}px;top:${t.toFixed(2)}px;width:${w.toFixed(2)}px;height:${h.toFixed(2)}px`;
    popMedia.style.cssText = `left:${lerp(panX(i), 0, e).toFixed(2)}px;top:${lerp((H - MH[i]) / 2, 0, e).toFixed(2)}px;width:${lerp(MW[i], to.w, e).toFixed(2)}px;height:${lerp(MH[i], to.h, e).toFixed(2)}px`;
    root.style.setProperty('--evm-e', e.toFixed(4));   // 0 in the strip, 1 fully open: the stylesheet parts the neighbours, dims the ground, and fades in the placard
  }
  function step(dir, to = null) {               // while open: the neighbour takes the stage, the strip follows underneath
    const j = clamp(to === null ? popI + dir : to, 0, N - 1); if (j === popI || popI < 0) return;
    const d = Math.sign(j - popI) || 1, old = popBox;
    popI = j; syncPlacard(j); [popBox, popMedia] = buildPopMedia(j); popE = popTo = 1; markSides(); goTo(j); renderPop();
    const ms = reduce.matches ? 1 : 260, off = `${d * 42}px`;
    old.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(-${off})` }], { duration: ms * 0.7, easing: 'ease-in', fill: 'forwards' }).finished.then(() => old.remove(), () => old.remove());
    popBox.animate([{ opacity: 0, transform: `translateX(${off})` }, { opacity: 1, transform: 'translateX(0)' }], { duration: ms, easing: 'cubic-bezier(.2,.7,.2,1)' });
    edgePrev.disabled = j === 0; edgeNext.disabled = j === N - 1; kick();
  }

  // ── Input ─────────────────────────────────────────────────────────────────────────────────────────────
  root.addEventListener('wheel', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (popI >= 0) { closePop(); return; }      // scrolling folds the open item back
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vw : 1;
    const d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
    tx = clamp(tx + d * wheelK, 0, maxX); kick();
  }, { passive: false });

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || popI >= 0) return;
    const hit = e.target.closest('.evm-item');
    drag = { id: e.pointerId, x0: e.clientX, sx: x, moved: false, lx: e.clientX, lt: performance.now(), v: 0, hit: hit ? +hit.dataset.i : -1 };
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; root.classList.add('is-dragging'); }
    if (!drag.moved) return;
    let nx = drag.sx - dx; if (nx < 0) nx *= 0.35; else if (nx > maxX) nx = maxX + (nx - maxX) * 0.35;   // a soft stop at both ends
    const now = performance.now(), dtm = Math.max(1, now - drag.lt);
    drag.v = lerp(drag.v, (e.clientX - drag.lx) / dtm, 0.35); drag.lx = e.clientX; drag.lt = now;
    x = tx = nx; kick();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; root.classList.remove('is-dragging');
    try { viewport.releasePointerCapture(e.pointerId); } catch {}
    if (d.moved) { tx = clamp(x - (performance.now() - d.lt > 90 ? 0 : d.v) * inertia, 0, maxX); kick(); }
    else if (e.type === 'pointerup' && d.hit >= 0) openPop(d.hit);
  };
  viewport.addEventListener('pointerup', endDrag); viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('click', (e) => {   // keyboard activation only; pointer clicks are decided in pointerup
    if (e.detail !== 0) return; const f = e.target.closest('.evm-item'); if (f) openPop(+f.dataset.i);
  });
  viewport.addEventListener('focusin', (e) => { const f = e.target.closest('.evm-item'); if (f && popI < 0 && !drag) { goTo(+f.dataset.i); focusI = e.target.matches(':focus-visible') ? +f.dataset.i : -1; kick(); } });
  viewport.addEventListener('focusout', () => { focusI = -1; kick(); });
  root.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; if (!drag) kick(); }, { passive: true });
  root.addEventListener('pointerleave', () => { px = py = -1; loupe.classList.remove('is-shown'); kick(); });
  map.addEventListener('click', (e) => { const t = e.target.closest('.evm-map__thumb'); if (!t) return; const i = +t.dataset.i; if (popI >= 0) step(0, i); else goTo(i); });
  scrim.addEventListener('click', () => closePop());
  pop.addEventListener('click', (e) => { if (e.target === pop) closePop(); });
  edgePrev.addEventListener('click', () => step(-1)); edgeNext.addEventListener('click', () => step(1));
  backBtn.addEventListener('click', () => close());

  const onKey = (e) => {
    if (!isOpen || e.metaKey || e.ctrlKey || e.altKey) return;
    e.stopImmediatePropagation();               // the film's own shortcuts stay asleep while the viewer is open
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); popI >= 0 ? closePop() : close(); }
    else if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); const d = k === 'ArrowRight' ? 1 : -1; popI >= 0 ? step(d) : goTo((cur < 0 ? 0 : cur) + d); }
    else if (k === 'Home' || k === 'End') { e.preventDefault(); const j = k === 'Home' ? 0 : N - 1; popI >= 0 ? step(0, j) : goTo(j); }
    else if ((k === 'Enter' || k === ' ') && popI < 0 && !e.target.closest('button')) { e.preventDefault(); openPop(cur); }
    else if (k === 'Tab' && !root.contains(e.target)) { e.preventDefault(); backBtn.focus(); }
  };
  const onResize = () => { if (!isOpen) return; const keep = popI >= 0 ? popI : cur; layout(); if (keep >= 0) goTo(keep, true); kick(); };

  // ── Open and close ────────────────────────────────────────────────────────────────────────────────────
  const tell = (type) => {
    const detail = { source: 'event-media', type, event: manifest.event, title: manifest.title, count: N };
    window.dispatchEvent(new CustomEvent('eventmedia:' + type, { detail }));
    if (embedded) { try { window.parent.postMessage(detail, location.origin); } catch {} }
  };
  function triggerDeal(centerIdx = 0) {
    if (reduce.matches) return;
    clearTimeout(dealTimer);
    node.forEach((n, idx) => n.frame.style.setProperty('--evm-dist', Math.min(8, Math.abs(idx - centerIdx))));
    root.classList.remove('is-dealing');
    void root.offsetWidth;
    root.classList.add('is-dealing');
    dealTimer = setTimeout(() => root.classList.remove('is-dealing'), 820);
  }
  function open(startAt = 0) {
    if (isOpen) return; isOpen = true; clearTimeout(closeTimer);
    lastFocus = document.activeElement;
    root.hidden = false; document.documentElement.classList.add('evm-lock');
    layout(); goTo(startAt, true); render();
    void root.offsetWidth; root.classList.add('is-open');
    triggerDeal(clamp(startAt, 0, N - 1));
    if (opt.pauseFilm) holdFilm(true);
    if (typeof opt.onOpen === 'function') opt.onOpen();
    window.addEventListener('keydown', onKey, true); window.addEventListener('resize', onResize);
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    backBtn.focus({ preventScroll: true }); tell('open'); kick();
  }
  function close() {
    if (!isOpen) return;
    closePop(true); isOpen = false; drag = null; loupe.classList.remove('is-shown');
    root.classList.remove('is-open', 'is-dragging', 'is-dealing');
    clearTimeout(settleTimer); clearTimeout(dealTimer); anyLive = true; restAll();
    window.removeEventListener('keydown', onKey, true); window.removeEventListener('resize', onResize);
    const ms = reduce.matches ? 0 : parseFloat(getComputedStyle(root).getPropertyValue('--evm-fade-ms')) || 320;
    closeTimer = setTimeout(() => { root.hidden = true; document.documentElement.classList.remove('evm-lock'); for (let i = 0; i < N; i++) unload(i); }, ms);
    if (opt.pauseFilm) holdFilm(false);
    if (typeof opt.onClose === 'function') opt.onClose();
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    tell('close');
  }

  // ── The "Media" link: quiet in the corner during the film, prominent once the film reaches its end ────
  let openBtn = null;
  const wantButton = opt.button === null ? !embedded : opt.button;     // inside the landing shell, the shell's own nav carries the link
  if (wantButton) {
    openBtn = el('button', 'evm-open', { type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'data-state': opt.quiet ? 'quiet' : 'waiting' });
    openBtn.innerHTML = `Media <span class="evm-open__n">(${N})</span>`;
    openBtn.addEventListener('click', () => open());
    document.body.appendChild(openBtn);
  }
  // The film's progress, read the way the landing shell reads it: a "12.0s / 24.0s" label, or a scrub slider.
  const filmRatio = () => {
    const tl = document.getElementById('time-lbl'), sc = document.getElementById('scrub');
    if (tl) { const m = tl.textContent.match(/([\d.]+)\s*s?\s*\/\s*([\d.]+)/); if (m && +m[2] > 0) return +m[1] / +m[2]; }
    if (sc && +sc.max > 0) return +sc.value / +sc.max;
    return -1;
  };
  let ended = false;
  setInterval(() => {
    if (isOpen) return;
    const r = filmRatio(); if (r < 0) return;
    const now = r >= opt.endRatio;
    if (now !== ended) { ended = now; if (openBtn) openBtn.dataset.state = now ? 'ended' : (opt.quiet ? 'quiet' : 'waiting'); tell(now ? 'ended' : 'playing'); }
  }, 350);

  // Inside the landing shell the keyboard is often in the film's frame; Escape there asks the shell to leave the event.
  if (embedded) window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !isOpen && !e.defaultPrevented) tell('escape'); });

  const api = { open, close, openItem: (i) => { open(i); openPop(i); }, isOpen: () => isOpen, isPopped: () => popI >= 0, count: N, title: manifest.title, event: manifest.event, root, relayout: onResize };
  window.EventMedia = api;
  tell('ready');
  if (new URLSearchParams(location.search).get('media') === '1') open();
  return api;
}
