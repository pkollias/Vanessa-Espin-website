// Event media: a narrow sampling strip where every item counter-pans, and an in-place viewer mode
// where the clicked item unfolds whole at centre while left and right neighbours stay visible as diminishing wings.
//
//   import { mountEventMedia } from '/Vanessa-Espin-website/event-media/event-media.js';
//   mountEventMedia({ manifest: '/Vanessa-Espin-website/event-media/manifests/iyuana.json' });

const CSS_URL = new URL('./event-media.css' + new URL(import.meta.url).search, import.meta.url).href;
const FONTS_URL = 'https://api.fontshare.com/v2/css?f[]=gambetta@300,400,401&f[]=switzer@400,500,600&display=swap';
const raf = window.requestAnimationFrame.bind(window);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const pad2 = (n) => String(n).padStart(2, '0');
const el = (tag, cls, attrs = {}) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
};

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
const played = new Set();
const nativePlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function () {
  if (!(this.closest && this.closest('.evm'))) played.add(this);
  return nativePlay.apply(this, arguments);
};

let heldMedia = [];
function holdFilm(on) {
  if (on) {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    heldMedia = [...played].filter((m) => !m.paused && !m.ended);
    heldMedia.forEach((m) => m.pause());
  } else {
    delete document.hidden;
    delete document.visibilityState;
    heldMedia.forEach((m) => {
      const p = nativePlay.call(m);
      if (p && p.catch) p.catch(() => {});
    });
    heldMedia = [];
  }
  document.dispatchEvent(new Event('visibilitychange'));
}

export async function mountEventMedia(options = {}) {
  const qs = new URLSearchParams(location.search);
  const opt = {
    endRatio: 0.94,
    quiet: true,
    button: null,
    pauseFilm: true,
    wings: qs.get('wings') || 'stepped', // 'stepped' | 'arc' | 'hinged' | 'focus'
    ...options,
  };
  const embedded = window.self !== window.top;
  const manifest = typeof opt.manifest === 'string'
    ? await (await fetch(opt.manifest, { cache: 'no-cache' })).json()
    : opt.manifest;
  const items = manifest.items, N = items.length;

  if (![...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.href.includes('gambetta') && l.href.includes('401'))) {
    document.head.appendChild(el('link', '', { rel: 'stylesheet', href: FONTS_URL }));
  }

  if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
    const link = el('link', '', { rel: 'stylesheet', href: CSS_URL });
    document.head.appendChild(link);
    await new Promise((r) => {
      link.addEventListener('load', r, { once: true });
      link.addEventListener('error', r, { once: true });
      setTimeout(r, 1500);
    });
  }

  // ── Markup ────────────────────────────────────────────────────────────────────────────────────────────
  const root = el('div', 'evm', {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': `Media: ${manifest.title}`,
    'data-event': manifest.event,
    'data-wings': opt.wings,
  });
  root.hidden = true;

  const atmo = el('div', 'evm__atmo', { 'aria-hidden': 'true' });
  const grain = el('div', 'evm__grain', { 'aria-hidden': 'true' });

  const chrome = el('div', 'evm__chrome');
  const backBtn = el('button', 'evm__back', { type: 'button' });
  backBtn.textContent = '← Back to Event';
  const titleEl = el('span', 'evm__title');
  titleEl.textContent = manifest.title;
  const rightBox = el('div', 'evm__right');
  const foldBtn = el('button', 'evm__fold', { type: 'button', 'aria-label': 'Return to strip' });
  foldBtn.textContent = '× Strip';
  const countEl = el('span', 'evm__count', { 'aria-live': 'polite' });
  rightBox.append(foldBtn, countEl);
  chrome.append(backBtn, titleEl, rightBox);

  const viewport = el('div', 'evm__viewport');
  const track = el('div', 'evm__track');
  viewport.appendChild(track);

  const stepPrev = el('button', 'evm__step evm__step--prev', { type: 'button', 'aria-label': 'Previous item' });
  stepPrev.textContent = '←';
  const stepNext = el('button', 'evm__step evm__step--next', { type: 'button', 'aria-label': 'Next item' });
  stepNext.textContent = '→';

  const placard = el('div', 'evm-placard', { 'aria-hidden': 'true' });
  const placardKind = el('span', 'evm-placard__kind');
  const placardTitle = el('span', 'evm-placard__title');
  placard.append(placardKind, placardTitle);

  const map = el('div', 'evm__map', { role: 'group', 'aria-label': 'All items' });

  const loupe = el('div', 'evm-loupe', { 'aria-hidden': 'true' });
  const loupeImg = el('img', '', { alt: '', decoding: 'async' });
  const loupeCap = el('div', 'evm-loupe__cap');
  loupe.append(loupeImg, loupeCap);

  root.append(atmo, viewport, stepPrev, stepNext, chrome, placard, map, loupe, grain);

  const label = (it, i) => `${{ photo: 'Photograph', painting: 'Painting', poster: 'Poster', print: 'Print', design: 'Design', video: 'Video' }[it.kind] || 'Item'} ${i + 1} of ${N}${it.title ? ': ' + it.title : ''}`;

  const syncPlacard = (i) => {
    const it = items[i];
    if (!it) return;
    placardKind.textContent = KIND_PLACARD[it.kind] || 'Archive';
    placardTitle.textContent = it.title
      ? it.title.charAt(0).toUpperCase() + it.title.slice(1)
      : `${KIND_PLACARD[it.kind] || 'Item'} ${pad2(i + 1)}`;
  };

  // Every item in the strip uses a still image (it.thumb -> it.strip); videos never auto-play in the strip
  // and mount a live <video> element ONLY while opened as the centre hero in Viewer Mode.
  const node = items.map((it, i) => {
    const fig = el('figure', 'evm-item', { 'data-i': i, 'data-kind': it.kind, 'data-type': it.type });
    const frame = el('button', 'evm-item__frame', { type: 'button', 'aria-label': 'Open ' + label(it, i) });
    const media = el('img', 'evm-item__media', { alt: label(it, i), decoding: 'async', draggable: 'false' });
    media.src = (it.type === 'video' ? (it.poster || it.thumb) : (it.thumb || it.src));
    frame.append(media, el('span', 'evm-item__veil', { 'aria-hidden': 'true' }));

    if (it.type === 'video') {
      const vp = el('span', 'evm-item__vid-pill', { 'aria-hidden': 'true' });
      vp.textContent = `▶ ${fmtDur(it.duration)}`;
      frame.appendChild(vp);
    }
    fig.appendChild(frame);
    track.appendChild(fig);

    const thumb = el('button', 'evm-map__thumb', {
      type: 'button',
      'aria-label': 'Go to ' + label(it, i),
      'data-i': i,
      'data-kind': it.kind || 'photo',
    });
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

    return {
      fig,
      frame,
      media,
      thumb,
      stripLoaded: it.type === 'video',
      hiResLoaded: false,
      heroVideo: null,
      _w: -1, _h: -1, _mw: -1, _mh: -1, _parked: false, _op: -1, _z: -1,
    };
  });
  map.addEventListener('pointerleave', () => loupe.classList.remove('is-shown'));
  document.body.appendChild(root);

  // ── Geometry & Animation State ────────────────────────────────────────────────────────────────────────
  const L = new Array(N), MW = new Array(N), MH = new Array(N), HW = new Array(N), HH = new Array(N);
  const VW_ARR = new Float64Array(N), VH_ARR = new Float64Array(N), VC_ARR = new Float64Array(N);
  let vw = 0, vh = 0, stripW = 0, stripH = 0, stripTop = 0, viewerCenterY = 0, maxX = 0, focus0 = 0, focus1 = 0;
  let panK = 1, wheelK = 1, tau = 0.13, inertia = 320, popMs = 500, stepMs = 430, upscale = 1;
  let heroGap = 26, wingGap = 13, wingH1 = 0.66, wingDecay = 0.72, wingAperture = 0.26;

  let x = 0, tx = 0, cur = -1, isOpen = false, running = false, last = 0, dirty = true;
  let drag = null, lastFocus = null, closeTimer = 0, dealTimer = 0;

  // Viewer Mode state:
  // popI >= 0 when in Viewer Mode; vOpen animates 0 (Strip) <-> 1 (Viewer); vFocus animates continuously across item indices!
  let popI = -1, vOpen = 0, vFromOpen = 0, vToOpen = 0, vOpenT0 = 0;
  let vFocus = 0, vFromFocus = 0, vToFocus = 0, vFocusT0 = 0;
  let activeVideoIdx = -1;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const focusAt = (atX = x) => (maxX > 0 ? lerp(focus0, focus1, clamp(atX / maxX, 0, 1)) : vw / 2);
  const restFor = (i) => {
    const c = L[i] + stripW / 2;
    return maxX > 0 ? clamp((c - focus0) / (1 + (focus1 - focus0) / maxX), 0, maxX) : 0;
  };
  const panX = (i, atX = x) => {
    const range = MW[i] - stripW;
    if (range <= 0.5) return 0;
    const p = clamp((L[i] + stripW / 2 - atX - vw / 2) / (vw / 2 + stripW / 2), -1, 1);
    return -range / 2 - p * (range / 2) * panK;
  };

  function layout() {
    const cs = getComputedStyle(root);
    const num = (name, d) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v : d;
    };
    vw = root.clientWidth;
    vh = root.clientHeight;
    stripH = Math.round(vh * num('--evm-strip-h', 0.56));
    stripTop = Math.round((vh - stripH) / 2 + vh * num('--evm-strip-y', 0));
    const gap = num('--evm-gap', 14);
    const aperture = num('--evm-aperture', 0.27);
    stripW = Math.max(64, Math.round(stripH * aperture));

    panK = num('--evm-pan', 1);
    wheelK = num('--evm-wheel', 1);
    tau = num('--evm-glide', 0.13);
    inertia = num('--evm-inertia', 320);
    popMs = num('--evm-pop-ms', 500);
    stepMs = num('--evm-step-ms', 430);
    upscale = num('--evm-pop-upscale', 1);
    heroGap = num('--evm-hero-gap', 26);
    wingGap = num('--evm-wing-gap', 13);
    wingH1 = num('--evm-wing-h1', 0.66);
    wingDecay = num('--evm-wing-decay', 0.72);
    wingAperture = num('--evm-wing-aperture', 0.26);

    const heroMaxW = vw * num('--evm-hero-max-w', 0.56);
    const heroMaxH = vh * num('--evm-hero-max-h', 0.69);
    // Keep the opened hero centered comfortably between top chrome (~64px) and bottom placard+index (~92px)
    const safeTop = 64, safeBot = 92;
    viewerCenterY = Math.round((safeTop + (vh - safeBot)) / 2);

    const panMin = num('--evm-pan-min', 0.65);
    const minPanW = stripW * (1 + panMin);
    const edge = num('--evm-edge', 0.08) * vw;
    const restCentre = num('--evm-rest-centre', 0) >= 0.5;

    items.forEach((it, i) => {
      const asp = it.w / it.h;
      // Strip inner image: exact aspect ratio, always at least minPanW wide so every sliver counter-pans smoothly
      MH[i] = Math.max(stripH, Math.round(minPanW / asp));
      MW[i] = Math.round(MH[i] * asp);

      // Viewer Hero target dimensions: 100% whole and uncropped at true natural aspect ratio
      const sc = Math.min(heroMaxW / it.w, heroMaxH / it.h, upscale);
      HW[i] = Math.round(it.w * sc);
      HH[i] = Math.round(it.h * sc);

      node[i]._w = node[i]._h = node[i]._mw = node[i]._mh = -1;
    });

    const total = stripW * N + gap * Math.max(0, N - 1);
    let at = total + 2 * edge <= vw ? (vw - total) / 2 : restCentre ? Math.max(0, (vw - stripW) / 2) : edge;
    for (let i = 0; i < N; i++) {
      L[i] = Math.round(at);
      at += stripW + gap;
    }
    const lastC = L[N - 1] + stripW / 2;
    maxX = total + 2 * edge <= vw ? 0 : Math.max(0, Math.round(restCentre ? lastC - vw / 2 : L[N - 1] + stripW + edge - vw));
    focus0 = L[0] + stripW / 2;
    focus1 = lastC - maxX;
    x = clamp(x, 0, maxX);
    tx = clamp(tx, 0, maxX);
    dirty = true;
  }

  // ── Progressive Strip Image & Hero High-Res / Video Management ────────────────────────────────────────
  function loadStripImg(i) {
    const n = node[i], it = items[i];
    if (n.stripLoaded || it.type === 'video') return;
    n.stripLoaded = true;
    const src = it.strip || it.src;
    if (n.media.src.endsWith(src)) return;
    const im = new Image();
    im.decoding = 'async';
    im.src = src;
    (im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; })).then(() => {
      if (!n.stripLoaded || n.hiResLoaded) return;
      n.media.src = src;
      n.fig.classList.add('is-loaded');
    }, () => { n.stripLoaded = false; });
  }

  function loadHeroHiRes(i) {
    const n = node[i], it = items[i];
    if (it.type === 'video' || n.hiResLoaded) return;
    n.hiResLoaded = true;
    const im = new Image();
    im.decoding = 'async';
    im.src = it.src;
    (im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; })).then(() => {
      if (!n.hiResLoaded) return;
      n.media.src = it.src;
    }, () => { n.hiResLoaded = false; });
  }

  function unloadFar(i) {
    const n = node[i], it = items[i];
    if (i === activeVideoIdx) detachHeroVideo();
    if (it.type === 'video') return;
    if (!n.stripLoaded && !n.hiResLoaded) return;
    n.stripLoaded = false;
    n.hiResLoaded = false;
    n.fig.classList.remove('is-loaded');
    const thumbSrc = it.thumb || it.src;
    if (n.media.getAttribute('src') !== thumbSrc) n.media.src = thumbSrc;
  }

  function mountHeroVideo(i) {
    if (activeVideoIdx === i) return;
    detachHeroVideo();
    const it = items[i], n = node[i];
    if (!it || it.type !== 'video') return;
    activeVideoIdx = i;
    const v = el('video', 'evm-item__hero-video', { playsinline: '', loop: '', controls: '' });
    v.muted = true;
    if (it.poster || it.thumb) v.poster = it.poster || it.thumb;
    v.src = it.src;
    n.heroVideo = v;
    n.frame.appendChild(v);
    const p = nativePlay.call(v);
    if (p && p.catch) p.catch(() => {});
  }

  function detachHeroVideo() {
    if (activeVideoIdx < 0) return;
    const n = node[activeVideoIdx];
    activeVideoIdx = -1;
    if (n && n.heroVideo) {
      try { n.heroVideo.pause(); n.heroVideo.removeAttribute('src'); n.heroVideo.load(); } catch {}
      n.heroVideo.remove();
      n.heroVideo = null;
    }
  }

  // ── Main 60fps Render Loop (Unified Strip Mode <-> Diminishing-Wing Viewer Mode) ──────────────────────
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;

    if (!drag && popI < 0 && vOpen === 0) {
      const k = reduce.matches ? 1 : 1 - Math.exp(-dt / tau);
      x += (tx - x) * k;
      if (Math.abs(tx - x) < 0.15) x = tx;
    }

    let openMoving = false;
    if (vOpen !== vToOpen) {
      const span = reduce.matches ? 1 : clamp((now - vOpenT0) / popMs, 0, 1);
      vOpen = lerp(vFromOpen, vToOpen, ease(span));
      if (span >= 1) {
        vOpen = vToOpen;
        if (vOpen === 0 && vToOpen === 0) finishClosePop();
      } else {
        openMoving = true;
      }
    }

    let focusMoving = false;
    if (vFocus !== vToFocus) {
      const span = reduce.matches ? 1 : clamp((now - vFocusT0) / stepMs, 0, 1);
      vFocus = lerp(vFromFocus, vToFocus, easeOut(span));
      if (span >= 1) vFocus = vToFocus;
      else focusMoving = true;
    }

    // Keep underlying strip scroll synced smoothly to the active viewer focus so folding back lands seamlessly
    if (vOpen > 0) {
      const targetRest = restFor(Math.round(vFocus));
      x = tx = lerp(x, targetRest, clamp(dt * 12, 0, 1));
    }

    render();

    // Mount hero video ONLY once settled as the open centre hero
    if (popI >= 0 && vToOpen === 1 && vOpen > 0.86 && Math.abs(vFocus - popI) < 0.08 && items[popI].type === 'video') {
      mountHeroVideo(popI);
    } else if (activeVideoIdx >= 0 && (popI !== activeVideoIdx || vToOpen === 0)) {
      detachHeroVideo();
    }

    running = isOpen && (drag || (vOpen === 0 && x !== tx) || openMoving || focusMoving || dirty);
    dirty = false;
    if (running) raf(frame);
  }

  const kick = () => {
    if (!running && isOpen) {
      running = true;
      last = performance.now();
      raf(frame);
    }
  };

  function render() {
    const e = vOpen;
    const wingsMode = root.dataset.wings || 'stepped';

    // Precompute continuous Viewer-Mode boxes & cumulative centres when e > 0
    let focalC = 0;
    if (e > 0) {
      const baseWingH = Math.min(stripH, vh * 0.62);
      for (let i = 0; i < N; i++) {
        const ad = Math.abs(i - vFocus);
        const uHero = ad < 1 ? ease(1 - ad) : 0;
        const effD = Math.max(1, ad);
        const wH = Math.max(44, baseWingH * wingH1 * Math.pow(wingDecay, effD - 1));
        const wW = Math.max(18, wH * wingAperture);
        VW_ARR[i] = lerp(wW, HW[i], uHero);
        VH_ARR[i] = lerp(wH, HH[i], uHero);
      }
      VC_ARR[0] = 0;
      for (let i = 0; i < N - 1; i++) {
        const u0 = Math.abs(i - vFocus) < 1 ? 1 - Math.abs(i - vFocus) : 0;
        const u1 = Math.abs(i + 1 - vFocus) < 1 ? 1 - Math.abs(i + 1 - vFocus) : 0;
        const g = lerp(wingGap, heroGap, Math.max(u0, u1));
        VC_ARR[i + 1] = VC_ARR[i] + VW_ARR[i] / 2 + g + VW_ARR[i + 1] / 2;
      }
      const i0 = clamp(Math.floor(vFocus), 0, N - 1);
      const i1 = clamp(i0 + 1, 0, N - 1);
      focalC = lerp(VC_ARR[i0], VC_ARR[i1], vFocus - i0);
    }

    let best = 0, bestD = Infinity;
    const fx = focusAt();

    for (let i = 0; i < N; i++) {
      const n = node[i], it = items[i];
      const sLeft = L[i] - x;

      if (e === 0) {
        const d = Math.abs(sLeft + stripW / 2 - fx);
        if (d < bestD) { bestD = d; best = i; }
      }

      const ad = Math.abs(i - vFocus);
      const nearStrip = sLeft < vw * 2.0 && sLeft + stripW > -vw * 1.0;
      const nearViewer = e > 0 && ad <= 5.5;
      const seenStrip = sLeft < vw && sLeft + stripW > 0;

      if (!nearStrip && !nearViewer) {
        if (!n._parked) {
          n.fig.style.transform = 'translate3d(-9999px,0,0)';
          n.fig.classList.remove('is-hero', 'is-open', 'is-wing');
          n._parked = true;
        }
        if (sLeft > vw * 3.4 || sLeft + stripW < -vw * 2.4) unloadFar(i);
        n.thumb.classList.remove('is-in-view');
        continue;
      }
      n._parked = false;
      loadStripImg(i);

      let boxL, boxT, boxW, boxH, mL, mT, mW, mH, op = 1, zIdx = 2, extra3d = '', extraBlur = '';

      if (e === 0) {
        boxL = sLeft;
        boxT = stripTop;
        boxW = stripW;
        boxH = stripH;
        mL = panX(i);
        mT = (stripH - MH[i]) / 2;
        mW = MW[i];
        mH = MH[i];
        n.thumb.classList.toggle('is-in-view', seenStrip);
        n.fig.classList.remove('is-hero', 'is-wing', 'is-open');
      } else {
        const vW = VW_ARR[i], vH = VH_ARR[i];
        const vL = vw / 2 + (VC_ARR[i] - focalC) - vW / 2;
        const vT = viewerCenterY - vH / 2;

        const asp = it.w / it.h;
        const uHero = ad < 1 ? ease(1 - ad) : 0;
        // Wing cover-fit vs Hero 100% whole uncropped fit
        const wCovH = Math.max(vH, vW / asp);
        const wCovW = wCovH * asp;
        const vmW = lerp(wCovW, vW, uHero);
        const vmH = lerp(wCovH, vH, uHero);
        const vmL = (vW - vmW) / 2;
        const vmT = (vH - vmH) / 2;

        boxL = lerp(sLeft, vL, e);
        boxT = lerp(stripTop, vT, e);
        boxW = lerp(stripW, vW, e);
        boxH = lerp(stripH, vH, e);

        mL = lerp(panX(i), vmL, e);
        mT = lerp((stripH - MH[i]) / 2, vmT, e);
        mW = lerp(MW[i], vmW, e);
        mH = lerp(MH[i], vmH, e);

        // Progressive wing opacity taper: hero = 1.0, ±1 = 0.66, ±2 = 0.42, ±3 = 0.24, ±4 = 0.11, >=5 = 0
        const wingOp = ad >= 4.8 ? 0 : clamp(0.66 * Math.pow(0.64, Math.max(0, ad - 1)), 0, 1);
        const targetOp = lerp(wingOp, 1, uHero);
        op = lerp(1, targetOp, e);
        zIdx = Math.round(20 - Math.min(18, ad * 3));

        const heroIdx = popI >= 0 ? popI : Math.round(vFocus);
        const isHeroNow = popI >= 0 && i === heroIdx && e > 0.02;
        n.fig.classList.toggle('is-hero', isHeroNow);
        n.fig.classList.toggle('is-open', isHeroNow);
        n.fig.classList.toggle('is-wing', !isHeroNow && e > 0.02);
        n.thumb.classList.toggle('is-in-view', vL < vw && vL + vW > 0 && op > 0.08);

        if (isHeroNow && e > 0.5) loadHeroHiRes(i);

        const dSigned = i - vFocus;
        const wgt = e * (1 - uHero);
        if (wgt > 0.01) {
          if (wingsMode === 'arc') {
            extra3d = ` translateZ(${(-58 * wgt * Math.min(3, ad)).toFixed(1)}px) rotateY(${(-Math.sign(dSigned) * 7.5 * wgt * Math.min(2.2, ad)).toFixed(2)}deg)`;
          } else if (wingsMode === 'hinged') {
            extra3d = ` translateZ(${(-24 * wgt * Math.min(3, ad)).toFixed(1)}px) rotateY(${(-Math.sign(dSigned) * 14 * wgt).toFixed(2)}deg)`;
          } else if (wingsMode === 'focus') {
            extraBlur = `blur(${(wgt * Math.min(4.0, ad * 1.35)).toFixed(2)}px)`;
          }
        }
      }

      const rw = Math.round(boxW * 10) / 10, rh = Math.round(boxH * 10) / 10;
      if (n._w !== rw || n._h !== rh) {
        n._w = rw; n._h = rh;
        n.fig.style.width = `${rw}px`;
        n.fig.style.height = `${rh}px`;
      }
      n.fig.style.transform = `translate3d(${boxL.toFixed(2)}px,${boxT.toFixed(2)}px,0)${extra3d}`;

      const rop = Math.round(op * 1000) / 1000;
      if (n._op !== rop) {
        n._op = rop;
        n.fig.style.opacity = rop >= 0.999 ? '' : String(rop);
        n.fig.style.pointerEvents = rop < 0.05 ? 'none' : '';
      }
      if (n._z !== zIdx) {
        n._z = zIdx;
        n.fig.style.zIndex = String(zIdx);
      }
      if (wingsMode === 'focus') {
        n.fig.style.filter = extraBlur || '';
      } else if (n.fig.style.filter) {
        n.fig.style.filter = '';
      }

      const rmw = Math.round(mW * 10) / 10, rmh = Math.round(mH * 10) / 10;
      if (n._mw !== rmw || n._mh !== rmh) {
        n._mw = rmw; n._mh = rmh;
        n.media.style.width = `${rmw}px`;
        n.media.style.height = `${rmh}px`;
      }
      n.media.style.transform = `translate3d(${mL.toFixed(2)}px,${mT.toFixed(2)}px,0)`;
    }

    const activeIdx = popI >= 0 ? popI : best;
    if (activeIdx !== cur && activeIdx >= 0) {
      if (cur >= 0) {
        node[cur].fig.classList.remove('is-current');
        node[cur].thumb.classList.remove('is-current', 'is-open');
      }
      cur = activeIdx;
      node[cur].fig.classList.add('is-current');
      node[cur].thumb.classList.add('is-current');
    }
    if (cur >= 0) node[cur].thumb.classList.toggle('is-open', popI >= 0);

    const shown = popI >= 0 ? popI : Math.max(0, cur);
    const text = `${pad2(shown + 1)} — ${pad2(N)}`;
    if (countEl.textContent !== text) countEl.textContent = text;
  }

  const goTo = (i, snap = false) => {
    tx = restFor(clamp(i, 0, N - 1));
    if (snap) x = tx;
    dirty = true;
    kick();
  };

  // ── Viewer Mode Actions (Open, Step Across Diminishing Wings, Fold Back to Strip) ─────────────────────
  function updateStepButtons() {
    stepPrev.disabled = popI <= 0;
    stepNext.disabled = popI < 0 || popI >= N - 1;
  }

  function openPop(i) {
    if (!isOpen) return;
    const target = clamp(i, 0, N - 1);
    loupe.classList.remove('is-shown');
    if (popI >= 0) {
      stepTo(target);
      return;
    }
    popI = target;
    vFocus = vFromFocus = vToFocus = target;
    vFromOpen = vOpen;
    vToOpen = 1;
    vOpenT0 = performance.now();
    root.classList.add('is-popped');
    syncPlacard(target);
    loadHeroHiRes(target);
    updateStepButtons();
    dirty = true;
    kick();
  }

  function stepTo(i) {
    if (popI < 0) { goTo(i); return; }
    const target = clamp(i, 0, N - 1);
    if (target === popI) return;
    detachHeroVideo();
    popI = target;
    vFromFocus = vFocus;
    vToFocus = target;
    vFocusT0 = performance.now();
    syncPlacard(target);
    loadHeroHiRes(target);
    updateStepButtons();
    dirty = true;
    kick();
  }

  function closePop(instant = false) {
    if (popI < 0 && vOpen === 0) return;
    detachHeroVideo();
    const returnIdx = popI >= 0 ? popI : Math.round(vFocus);
    popI = -1;
    x = tx = restFor(clamp(returnIdx, 0, N - 1));
    vFromOpen = vOpen;
    vToOpen = 0;
    vOpenT0 = performance.now();
    root.classList.remove('is-popped');
    updateStepButtons();
    if (instant) {
      vOpen = 0;
      finishClosePop(returnIdx);
      render();
    } else {
      dirty = true;
      kick();
    }
  }

  function finishClosePop(focusIdx = popI) {
    const idx = focusIdx >= 0 ? focusIdx : cur;
    popI = -1;
    vOpen = vToOpen = 0;
    node.forEach((n) => {
      n.fig.classList.remove('is-hero', 'is-wing', 'is-open');
      n.thumb.classList.remove('is-open');
    });
    updateStepButtons();
    if (idx >= 0 && root.contains(document.activeElement)) {
      node[idx].frame.focus({ preventScroll: true });
    }
  }

  // ── Input (Wheel Locked in Viewer Mode; Flanking Wings, Arrows, Fold & Ticks Active) ──────────────────
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (popI >= 0 || vOpen > 0.02) return; // Wheel intentionally does nothing in Viewer Mode
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vw : 1;
    const d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
    tx = clamp(tx + d * wheelK, 0, maxX);
    kick();
  }, { passive: false });

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('video')) return;
    const hit = e.target.closest('.evm-item');
    if (popI >= 0) {
      // In Viewer Mode: clicking a flanking wing steps to it; clicking open dark space folds back to Strip Mode
      drag = { id: e.pointerId, viewerClick: true, x0: e.clientX, y0: e.clientY, hit: hit ? +hit.dataset.i : -1 };
      return;
    }
    drag = {
      id: e.pointerId,
      viewerClick: false,
      x0: e.clientX,
      sx: x,
      moved: false,
      lx: e.clientX,
      lt: performance.now(),
      v: 0,
      hit: hit ? +hit.dataset.i : -1,
    };
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id || drag.viewerClick) return;
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      root.classList.add('is-dragging');
    }
    if (!drag.moved) return;
    let nx = drag.sx - dx;
    if (nx < 0) nx *= 0.35;
    else if (nx > maxX) nx = maxX + (nx - maxX) * 0.35;
    const now = performance.now(), dtm = Math.max(1, now - drag.lt);
    drag.v = lerp(drag.v, (e.clientX - drag.lx) / dtm, 0.35);
    drag.lx = e.clientX;
    drag.lt = now;
    x = tx = nx;
    kick();
  });

  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    root.classList.remove('is-dragging');
    if (d.viewerClick) {
      if (e.type === 'pointerup' && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 10) {
        if (d.hit >= 0 && d.hit !== popI) stepTo(d.hit);
        else if (d.hit < 0) closePop();
      }
      return;
    }
    try { viewport.releasePointerCapture(e.pointerId); } catch {}
    if (d.moved) {
      tx = clamp(x - (performance.now() - d.lt > 90 ? 0 : d.v) * inertia, 0, maxX);
      kick();
    } else if (e.type === 'pointerup' && d.hit >= 0) {
      openPop(d.hit);
    }
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  viewport.addEventListener('click', (e) => {
    if (e.detail !== 0) return; // keyboard activation only
    const f = e.target.closest('.evm-item');
    if (!f) return;
    const idx = +f.dataset.i;
    if (popI >= 0) { if (idx !== popI) stepTo(idx); }
    else openPop(idx);
  });

  viewport.addEventListener('focusin', (e) => {
    const f = e.target.closest('.evm-item');
    if (f && popI < 0 && !drag) goTo(+f.dataset.i);
  });

  map.addEventListener('click', (e) => {
    const t = e.target.closest('.evm-map__thumb');
    if (!t) return;
    const i = +t.dataset.i;
    if (popI >= 0) stepTo(i);
    else goTo(i);
  });

  stepPrev.addEventListener('click', () => { if (popI > 0) stepTo(popI - 1); });
  stepNext.addEventListener('click', () => { if (popI >= 0 && popI < N - 1) stepTo(popI + 1); });
  foldBtn.addEventListener('click', () => closePop());
  backBtn.addEventListener('click', () => close());

  const onKey = (e) => {
    if (!isOpen || e.metaKey || e.ctrlKey || e.altKey) return;
    e.stopImmediatePropagation();
    const k = e.key;
    if (k === 'Escape') {
      e.preventDefault();
      popI >= 0 ? closePop() : close();
    } else if (k === 'ArrowRight' || k === 'ArrowLeft') {
      e.preventDefault();
      const d = k === 'ArrowRight' ? 1 : -1;
      if (popI >= 0) stepTo(popI + d);
      else goTo((cur < 0 ? 0 : cur) + d);
    } else if (k === 'Home' || k === 'End') {
      e.preventDefault();
      const j = k === 'Home' ? 0 : N - 1;
      if (popI >= 0) stepTo(j);
      else goTo(j);
    } else if ((k === 'Enter' || k === ' ') && popI < 0 && !e.target.closest('button')) {
      e.preventDefault();
      openPop(Math.max(0, cur));
    } else if (k === 'Tab' && !root.contains(e.target)) {
      e.preventDefault();
      backBtn.focus();
    }
  };

  const onResize = () => {
    if (!isOpen) return;
    const keep = popI >= 0 ? popI : cur;
    layout();
    if (popI < 0 && keep >= 0) goTo(keep, true);
    render();
    kick();
  };

  // ── Open & Close Media Viewer ─────────────────────────────────────────────────────────────────────────
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
    if (isOpen) return;
    isOpen = true;
    clearTimeout(closeTimer);
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add('evm-lock');
    layout();
    goTo(startAt, true);
    render();
    void root.offsetWidth;
    root.classList.add('is-open');
    triggerDeal(clamp(startAt, 0, N - 1));
    if (opt.pauseFilm) holdFilm(true);
    if (typeof opt.onOpen === 'function') opt.onOpen();
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    backBtn.focus({ preventScroll: true });
    tell('open');
    kick();
  }

  function close() {
    if (!isOpen) return;
    closePop(true);
    isOpen = false;
    drag = null;
    loupe.classList.remove('is-shown');
    root.classList.remove('is-open', 'is-dragging', 'is-dealing');
    clearTimeout(dealTimer);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onResize);
    const ms = reduce.matches ? 0 : parseFloat(getComputedStyle(root).getPropertyValue('--evm-fade-ms')) || 320;
    closeTimer = setTimeout(() => {
      root.hidden = true;
      document.documentElement.classList.remove('evm-lock');
      for (let i = 0; i < N; i++) unloadFar(i);
    }, ms);
    if (opt.pauseFilm) holdFilm(false);
    if (typeof opt.onClose === 'function') opt.onClose();
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    tell('close');
  }

  // ── Standalone Film "Media (N)" Pill ──────────────────────────────────────────────────────────────────
  let openBtn = null;
  const wantButton = opt.button === null ? !embedded : opt.button;
  if (wantButton) {
    openBtn = el('button', 'evm-open', {
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': 'false',
      'data-state': opt.quiet ? 'quiet' : 'waiting',
    });
    openBtn.innerHTML = `Media <span class="evm-open__n">(${N})</span>`;
    openBtn.addEventListener('click', () => open());
    document.body.appendChild(openBtn);
  }

  const filmRatio = () => {
    const tl = document.getElementById('time-lbl'), sc = document.getElementById('scrub');
    if (tl) {
      const m = tl.textContent.match(/([\d.]+)\s*s?\s*\/\s*([\d.]+)/);
      if (m && +m[2] > 0) return +m[1] / +m[2];
    }
    if (sc && +sc.max > 0) return +sc.value / +sc.max;
    return -1;
  };
  let ended = false;
  setInterval(() => {
    if (isOpen) return;
    const r = filmRatio();
    if (r < 0) return;
    const now = r >= opt.endRatio;
    if (now !== ended) {
      ended = now;
      if (openBtn) openBtn.dataset.state = now ? 'ended' : (opt.quiet ? 'quiet' : 'waiting');
      tell(now ? 'ended' : 'playing');
    }
  }, 350);

  if (embedded) {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !isOpen && !e.defaultPrevented) tell('escape');
    });
  }

  const api = {
    open,
    close,
    openItem: (i) => { open(i); openPop(i); },
    closeItem: () => closePop(),
    stepTo,
    setWings: (mode) => { root.dataset.wings = mode; dirty = true; kick(); },
    isOpen: () => isOpen,
    isPopped: () => popI >= 0,
    isSettled: () => !running,
    count: N,
    title: manifest.title,
    event: manifest.event,
    root,
    relayout: onResize,
  };
  window.EventMedia = api;
  tell('ready');
  if (qs.get('media') === '1') open();
  return api;
}
