// Embedded-to-Fullscreen Event Media Carousel Engine
// Preserves 100% of the standalone Media Carousel decisions from /event-media/wings-lab/:
// - Direct-to-Viewer on Item 01 (zero Strip Mode)
// - V4 Rack-Focus Blur + Silver-Gelatin Wing Wash + 0.22 Ultra-Narrow Slivers + 0.72 Harmonic Taper
// - Wing-height bug fixed: refWingH = min(baseWingH, activeHeroH) so wings NEVER exceed 66% of the main image height
// - Fixed-edge ← / → buttons, passive 01 — N counter, centered KIND_PLACARD + Title pill, uniform tick-ruler
// - Hybrid Fix 1×4 High-Contrast Scrubber Tray (hover-sweep + 60fps drag-scrub + clickable indexed cards) + dragShuttle
// - Starts inline in the right column; clicking the center Hero image expands smoothly to 100vw × 100vh Full-Screen!

const CSS_URL = new URL('./fold-carousel.css', import.meta.url).href;
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

function capFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export async function mountFoldCarousel(options = {}) {
  const opt = {
    mountTarget: document.body,
    event: 'iyuana',
    title: 'Exhibition Media',
    items: [],
    wings: 'focus',
    popStyle: 'pewter', // 'pewter' | 'paper'
    surfaceTone: 'dark',
    features: {
      scrubRuler: true,
      dragShuttle: true,
      ...(options.features || {}),
    },
    onFullscreenChange: null,
    ...options,
  };

  const items = opt.items || [];
  const N = items.length;

  if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
    const link = el('link', '', { rel: 'stylesheet', href: CSS_URL });
    document.head.appendChild(link);
    await new Promise((r) => {
      link.addEventListener('load', r, { once: true });
      link.addEventListener('error', r, { once: true });
      setTimeout(r, 1200);
    });
  }

  const root = el('div', 'evm is-inline', {
    role: 'region',
    'aria-label': `Media: ${opt.title}`,
    'data-event': opt.event,
    'data-wings': opt.wings,
    'data-pop-style': opt.popStyle,
    'data-surface-tone': opt.surfaceTone,
  });

  // Placeholder preserves exact right-column height when root portals to document.body in Full-Screen!
  const placeholder = el('div', 'evm-fs-placeholder', { 'aria-hidden': 'true' });
  placeholder.style.display = 'none';

  const fsCanvas = el('canvas', 'evm__fs-canvas', { 'aria-hidden': 'true' });

  const chrome = el('div', 'evm__chrome');
  const backBtn = el('button', 'evm__back', { type: 'button' });
  backBtn.textContent = '← About & Media';
  const fsBtn = el('button', 'evm__fs-btn', { type: 'button', 'aria-label': 'Expand carousel full screen' });
  fsBtn.textContent = 'Full screen ⤢';
  const titleEl = el('span', 'evm__title');
  titleEl.textContent = opt.title;
  chrome.append(backBtn, titleEl);

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

  // Hybrid Fix 1×4 High-Contrast Scrubber Tray
  const ribbon = el('div', 'evm-ribbon', { role: 'region', 'aria-label': 'Visual scrubber' });
  const ribbonWin = el('div', 'evm-ribbon__window');
  const ribbonTrack = el('div', 'evm-ribbon__track');
  ribbonWin.appendChild(ribbonTrack);

  const ribbonMeta = el('div', 'evm-ribbon__meta');
  const ribbonLeft = el('div', 'evm-ribbon__left');
  const ribbonNum = el('span', 'evm-ribbon__num');
  const ribbonCap = el('span', 'evm-ribbon__cap');
  ribbonLeft.append(ribbonNum, ribbonCap);
  const ribbonHint = el('span', 'evm-ribbon__hint');
  ribbonHint.textContent = 'Drag bar or click card';
  ribbonMeta.append(ribbonLeft, ribbonHint);
  ribbon.append(ribbonWin, ribbonMeta);

  root.append(fsCanvas, viewport, stepPrev, stepNext, fsBtn, chrome, placard, map, ribbon);

  let feat = { ...opt.features };
  let isFullscreen = false;
  let destroyed = false;

  const ribbonCells = [];
  const cellCenters = new Float64Array(N);
  let cellCursor = 0;

  const label = (it, i) => `${{ photo: 'Photograph', painting: 'Painting', poster: 'Poster', print: 'Print', design: 'Design', video: 'Video' }[it.kind] || 'Item'} ${i + 1} of ${N}${it.title ? ': ' + it.title : ''}`;

  function syncPlacard(i) {
    const it = items[i];
    if (!it) return;
    placardKind.textContent = KIND_PLACARD[it.kind] || 'Archive';
    placardTitle.textContent = it.title
      ? capFirst(it.title)
      : `${KIND_PLACARD[it.kind] || 'Item'} ${pad2(i + 1)}`;
  }

  const node = items.map((it, i) => {
    const fig = el('figure', 'evm-item', { 'data-i': i, 'data-kind': it.kind || 'photo', 'data-type': it.type || 'image' });
    const frameBtn = el('button', 'evm-item__frame', { type: 'button', 'aria-label': label(it, i) });
    const media = el('img', 'evm-item__media', { alt: label(it, i), decoding: 'async', draggable: 'false' });
    media.src = (it.type === 'video' ? (it.poster || it.thumb) : (it.thumb || it.src));
    const fsBadge = el('span', 'evm-item__fs-badge', { 'aria-hidden': 'true' });
    fsBadge.textContent = '⤢ Full screen';
    frameBtn.append(media, el('span', 'evm-item__veil', { 'aria-hidden': 'true' }), fsBadge);

    if (it.type === 'video') {
      const vp = el('span', 'evm-item__vid-pill', { 'aria-hidden': 'true' });
      vp.textContent = `▶ ${fmtDur(it.duration)}`;
      frameBtn.appendChild(vp);
    }
    fig.appendChild(frameBtn);
    track.appendChild(fig);

    const thumb = el('button', 'evm-map__thumb', {
      type: 'button',
      'aria-label': 'Go to ' + label(it, i),
      'data-i': i,
      'data-kind': it.kind || 'photo',
    });
    map.appendChild(thumb);

    // Uniform 64px + 9px spacing inside .evm-ribbon__track (zero cluster gaps)
    if (i > 0) cellCursor += 9;
    cellCenters[i] = cellCursor + 32;
    cellCursor += 64;

    const rCell = el('button', 'evm-ribbon__cell', {
      type: 'button',
      'data-i': i,
      'aria-label': 'Jump to ' + label(it, i),
    });
    const rImg = el('img', '', { src: it.thumb || it.poster || it.src, alt: '', loading: 'lazy', decoding: 'async' });
    const rIdx = el('span', 'evm-ribbon__idx');
    rIdx.textContent = pad2(i + 1);
    rCell.append(rImg, rIdx);
    if (it.type === 'video') {
      const rVid = el('span', 'evm-ribbon__vid');
      rVid.textContent = '▶';
      rCell.appendChild(rVid);
    }
    rCell.addEventListener('pointerenter', () => {
      if (isScrubbing || ribbonDrag) return;
      syncRibbonMeta(i);
    });
    ribbonTrack.appendChild(rCell);
    ribbonCells.push(rCell);

    return {
      fig,
      frame: frameBtn,
      media,
      thumb,
      stripLoaded: it.type === 'video',
      hiResLoaded: false,
      heroVideo: null,
      _w: -1, _h: -1, _mw: -1, _mh: -1, _parked: false, _op: -1, _z: -1,
    };
  });

  opt.mountTarget.append(placeholder, root);

  const HW = new Array(N), HH = new Array(N);
  const VW_ARR = new Float64Array(N), VH_ARR = new Float64Array(N), VC_ARR = new Float64Array(N);
  const tickCenters = new Float64Array(N);

  let vw = 0, vh = 0, baseWingH = 0, viewerCenterY = 0, stepMs = 410, upscale = 1;
  let heroGap = 20, wingGap = 9, wingH1 = 0.66, wingDecay = 0.72, wingAperture = 0.22;

  let running = false, last = 0, dirty = true;
  let popI = 0, cur = -1;
  let vFocus = 0, vFromFocus = 0, vToFocus = 0, vFocusT0 = 0;
  let activeVideoIdx = -1, dealTimer = 0;

  let isScrubbing = false, scrubTargetFloat = 0, ribbonFloat = 0;
  let overMap = false, overRibbon = false, hideRibbonTimer = 0;
  let ribbonDrag = null;
  let shuttleDrag = null;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function syncFeatureClasses() {
    root.classList.toggle('has-scrub-ruler', !!feat.scrubRuler);
    root.classList.toggle('is-shuttle-enabled', !!feat.dragShuttle);
    if (!feat.scrubRuler) hideRibbon(true);
    measureTicks();
    dirty = true;
    kick();
  }

  function measureTicks() {
    for (let i = 0; i < N; i++) {
      const b = node[i].thumb.getBoundingClientRect();
      tickCenters[i] = b.left + b.width / 2;
    }
  }

  function pointerToFloatIndex(clientX) {
    measureTicks();
    if (!N) return 0;
    if (clientX <= tickCenters[0]) return 0;
    if (clientX >= tickCenters[N - 1]) return N - 1;
    for (let i = 0; i < N - 1; i++) {
      const a = tickCenters[i], b = tickCenters[i + 1];
      if (clientX >= a && clientX <= b) {
        return b > a ? i + (clientX - a) / (b - a) : i;
      }
    }
    return N - 1;
  }

  function floatToCellX(f) {
    if (!N) return 0;
    const cf = clamp(f, 0, N - 1);
    const i0 = Math.floor(cf);
    const i1 = Math.min(N - 1, i0 + 1);
    return lerp(cellCenters[i0], cellCenters[i1], cf - i0);
  }

  function cellXToFloat(cx) {
    if (!N) return 0;
    if (cx <= cellCenters[0]) return 0;
    if (cx >= cellCenters[N - 1]) return N - 1;
    for (let i = 0; i < N - 1; i++) {
      const a = cellCenters[i], b = cellCenters[i + 1];
      if (cx >= a && cx <= b) return b > a ? i + (cx - a) / (b - a) : i;
    }
    return N - 1;
  }

  function layout() {
    if (destroyed || !N) return;
    const cs = getComputedStyle(root);
    const num = (name, d) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v : d;
    };
    vw = Math.max(220, root.clientWidth || 560);
    vh = Math.max(240, root.clientHeight || 480);
    baseWingH = Math.round(vh * num('--evm-base-h', 0.56));
    stepMs = num('--evm-step-ms', 410);
    upscale = num('--evm-pop-upscale', 1);
    heroGap = num('--evm-hero-gap', isFullscreen ? 24 : 18);
    wingGap = num('--evm-wing-gap', isFullscreen ? 11 : 8);
    wingH1 = num('--evm-wing-h1', 0.66);
    wingDecay = num('--evm-wing-decay', 0.72);
    wingAperture = num('--evm-wing-aperture', 0.22);

    const safeTop = isFullscreen ? 64 : 56;
    const safeBot = isFullscreen ? 92 : 76;
    const availH = Math.max(140, vh - safeTop - safeBot);
    const heroMaxW = Math.min(vw * num('--evm-hero-max-w', 0.56), Math.max(130, vw - (vw < 480 ? 96 : 148)));
    const heroMaxH = Math.min(vh * num('--evm-hero-max-h', 0.68), availH);

    viewerCenterY = Math.round(safeTop + availH / 2);
    stepPrev.style.top = `${viewerCenterY}px`;
    stepNext.style.top = `${viewerCenterY}px`;

    items.forEach((it, i) => {
      const iw = it.w || 1080, ih = it.h || 1350;
      const sc = Math.min(heroMaxW / iw, heroMaxH / ih, upscale);
      HW[i] = Math.max(48, Math.round(iw * sc));
      HH[i] = Math.max(48, Math.round(ih * sc));
      node[i]._w = node[i]._h = node[i]._mw = node[i]._mh = -1;
    });

    dirty = true;
    raf(measureTicks);
  }

  function loadStripImg(i) {
    if (i < 0 || i >= N) return;
    const n = node[i], it = items[i];
    if (n.stripLoaded || it.type === 'video') return;
    n.stripLoaded = true;
    const src = it.strip || it.src;
    if (n.media.src.endsWith(src)) return;
    const im = new Image();
    im.decoding = 'async';
    im.src = src;
    (im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; })).then(() => {
      if (destroyed || !n.stripLoaded || n.hiResLoaded) return;
      n.media.src = src;
      n.fig.classList.add('is-loaded');
    }, () => { n.stripLoaded = false; });
  }

  function loadHeroHiRes(i) {
    if (i < 0 || i >= N) return;
    const n = node[i], it = items[i];
    if (it.type === 'video' || n.hiResLoaded) return;
    n.hiResLoaded = true;
    const im = new Image();
    im.decoding = 'async';
    im.src = it.src;
    (im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; })).then(() => {
      if (destroyed || !n.hiResLoaded) return;
      n.media.src = it.src;
    }, () => { n.hiResLoaded = false; });
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
    if (isFullscreen) {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    }
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

  function frame(now) {
    if (destroyed) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;

    let focusMoving = false;
    const activeScrub = isScrubbing || !!(ribbonDrag && ribbonDrag.moved);

    if (activeScrub) {
      const k = reduce.matches ? 1 : 1 - Math.exp(-dt / 0.042);
      vFocus += (scrubTargetFloat - vFocus) * k;
      if (Math.abs(scrubTargetFloat - vFocus) < 0.004) vFocus = scrubTargetFloat;
      else focusMoving = true;
      const nearest = clamp(Math.round(vFocus), 0, N - 1);
      if (nearest !== popI) {
        detachHeroVideo();
        popI = nearest;
        syncPlacard(popI);
        updateStepButtons();
      }
    } else if (shuttleDrag && shuttleDrag.moved) {
      const k = reduce.matches ? 1 : 1 - Math.exp(-dt / 0.038);
      vFocus += (shuttleDrag.targetFocus - vFocus) * k;
      if (Math.abs(shuttleDrag.targetFocus - vFocus) > 0.004) focusMoving = true;
      const nearest = clamp(Math.round(vFocus), 0, N - 1);
      if (nearest !== popI) {
        detachHeroVideo();
        popI = nearest;
        syncPlacard(popI);
        updateStepButtons();
      }
    } else if (vFocus !== vToFocus) {
      const span = reduce.matches ? 1 : clamp((now - vFocusT0) / stepMs, 0, 1);
      vFocus = lerp(vFromFocus, vToFocus, easeOut(span));
      if (span >= 1) vFocus = vToFocus;
      else focusMoving = true;
    }

    render();

    const settledHero = !activeScrub && !(shuttleDrag && shuttleDrag.moved) && Math.abs(vFocus - popI) < 0.06;
    if (settledHero && N > 0) {
      loadHeroHiRes(popI);
      if (items[popI].type === 'video') mountHeroVideo(popI);
    } else if (activeVideoIdx >= 0 && activeVideoIdx !== popI) {
      detachHeroVideo();
    }

    running = !destroyed && (focusMoving || activeScrub || !!(shuttleDrag && shuttleDrag.moved) || dirty);
    dirty = false;
    if (running) raf(frame);
  }

  const kick = () => {
    if (!running && !destroyed) {
      running = true;
      last = performance.now();
      raf(frame);
    }
  };

  function render() {
    if (!N) return;
    const wingsMode = root.dataset.wings || 'focus';

    const i0 = clamp(Math.floor(vFocus), 0, N - 1);
    const i1 = clamp(i0 + 1, 0, N - 1);
    // CRITICAL WING-HEIGHT FIX: Anchor wing reference height to the active Hero's actual rendered height!
    // Guarantees wing1 <= 0.66 × activeHeroH and wing2 <= 0.475 × activeHeroH at ANY screen width/height or aspect ratio!
    const activeHeroH = lerp(HH[i0], HH[i1], clamp(vFocus - i0, 0, 1));
    const refWingH = Math.min(baseWingH, activeHeroH);
    if (!isFullscreen) {
      const heroTop = viewerCenterY - activeHeroH / 2;
      const fsTop = Math.max(2, Math.round(heroTop - 44));
      if (fsBtn._top !== fsTop) {
        fsBtn._top = fsTop;
        fsBtn.style.top = `${fsTop}px`;
      }
    }

    for (let i = 0; i < N; i++) {
      const ad = Math.abs(i - vFocus);
      const uHero = ad < 1 ? ease(1 - ad) : 0;
      const effD = Math.max(1, ad);
      const wH = Math.max(26, refWingH * wingH1 * Math.pow(wingDecay, effD - 1));
      const wW = Math.max(14, wH * wingAperture);
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

    const focalC = lerp(VC_ARR[i0], VC_ARR[i1], clamp(vFocus - i0, 0, 1));

    for (let i = 0; i < N; i++) {
      const n = node[i], it = items[i];
      const ad = Math.abs(i - vFocus);

      if (ad > 6.2) {
        if (!n._parked) {
          n.fig.style.transform = 'translate3d(-9999px,0,0)';
          n.fig.classList.remove('is-hero', 'is-open', 'is-wing');
          n._parked = true;
        }
        n.thumb.classList.remove('is-in-view');
        continue;
      }
      n._parked = false;
      loadStripImg(i);

      const vW = VW_ARR[i], vH = VH_ARR[i];
      const boxL = vw / 2 + (VC_ARR[i] - focalC) - vW / 2;
      const boxT = viewerCenterY - vH / 2;

      const asp = (it.w || 1080) / (it.h || 1350);
      const uHero = ad < 1 ? ease(1 - ad) : 0;
      const wCovH = Math.max(vH, vW / asp);
      const wCovW = wCovH * asp;
      const mW = lerp(wCovW, vW, uHero);
      const mH = lerp(wCovH, vH, uHero);
      const mL = (vW - mW) / 2;
      const mT = (vH - mH) / 2;

      const baseWingOp = ad >= 4.7 ? 0 : clamp(0.68 * Math.pow(0.65, Math.max(0, ad - 1)), 0, 1);
      const op = lerp(baseWingOp, 1, uHero);
      const zIdx = Math.round(24 - Math.min(20, ad * 3));

      const isHeroNow = ad < 0.48;
      n.fig.classList.toggle('is-hero', isHeroNow);
      n.fig.classList.toggle('is-open', isHeroNow);
      n.fig.classList.toggle('is-wing', !isHeroNow);
      n.thumb.classList.toggle('is-in-view', boxL < vw && boxL + vW > 0 && op > 0.08);

      const wgt = 1 - uHero;
      const extraBlur = (wingsMode === 'focus' && wgt > 0.01)
        ? `blur(${(wgt * Math.min(4.2, ad * 1.4)).toFixed(2)}px)`
        : '';

      const rw = Math.round(vW * 10) / 10, rh = Math.round(vH * 10) / 10;
      if (n._w !== rw || n._h !== rh) {
        n._w = rw; n._h = rh;
        n.fig.style.width = `${rw}px`;
        n.fig.style.height = `${rh}px`;
      }
      n.fig.style.transform = `translate3d(${boxL.toFixed(2)}px,${boxT.toFixed(2)}px,0)`;

      const rop = Math.round(op * 1000) / 1000;
      if (n._op !== rop) {
        n._op = rop;
        n.fig.style.opacity = rop >= 0.999 ? '' : String(rop);
        n.fig.style.pointerEvents = rop < 0.06 ? 'none' : '';
      }
      if (n._z !== zIdx) {
        n._z = zIdx;
        n.fig.style.zIndex = String(zIdx);
      }
      n.fig.style.filter = extraBlur;

      const rmw = Math.round(mW * 10) / 10, rmh = Math.round(mH * 10) / 10;
      if (n._mw !== rmw || n._mh !== rmh) {
        n._mw = rmw; n._mh = rmh;
        n.media.style.width = `${rmw}px`;
        n.media.style.height = `${rmh}px`;
      }
      n.media.style.transform = `translate3d(${mL.toFixed(2)}px,${mT.toFixed(2)}px,0)`;
    }

    if (popI !== cur && popI >= 0) {
      if (cur >= 0) {
        node[cur].fig.classList.remove('is-current');
        node[cur].thumb.classList.remove('is-current');
      }
      cur = popI;
      node[cur].fig.classList.add('is-current');
      node[cur].thumb.classList.add('is-current');
    }
  }

  function updateStepButtons() {
    stepPrev.disabled = popI <= 0;
    stepNext.disabled = popI >= N - 1;
  }

  function stepTo(i, instant = false) {
    if (!N) return;
    const target = clamp(i, 0, N - 1);
    if (target !== popI) detachHeroVideo();
    popI = target;
    vFromFocus = vFocus;
    vToFocus = target;
    vFocusT0 = performance.now();
    if (instant) vFocus = target;
    syncPlacard(target);
    loadHeroHiRes(target);
    for (let k = Math.max(0, target - 5); k <= Math.min(N - 1, target + 5); k++) loadStripImg(k);
    updateStepButtons();
    dirty = true;
    kick();
  }

  stepPrev.addEventListener('click', () => { if (popI > 0) stepTo(popI - 1); });
  stepNext.addEventListener('click', () => { if (popI < N - 1) stepTo(popI + 1); });

  // ── Full-Screen Expansion & Fold-Back (Preserves Zero Scroll Jump!) ───────────────────────────────────
  function enterFullscreen() {
    if (isFullscreen || destroyed) return;
    const h = root.offsetHeight || 520;
    placeholder.style.height = `${h}px`;
    placeholder.style.display = 'block';

    isFullscreen = true;
    overMap = overRibbon = false;
    hideRibbon(true);

    root.classList.remove('is-inline');
    root.classList.add('is-fullscreen');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    document.body.classList.add('fs-open');
    document.body.appendChild(root);

    layout();
    render();
    kick();
    opt.onFullscreenChange?.(true, fsCanvas);
  }

  function exitFullscreen() {
    if (!isFullscreen || destroyed) return;
    isFullscreen = false;
    overMap = overRibbon = false;
    hideRibbon(true);

    root.classList.remove('is-fullscreen');
    root.classList.add('is-inline');
    root.setAttribute('role', 'region');
    root.removeAttribute('aria-modal');
    document.body.classList.remove('fs-open');
    opt.mountTarget.appendChild(root);
    placeholder.style.display = 'none';

    layout();
    render();
    kick();
    opt.onFullscreenChange?.(false, fsCanvas);
  }

  fsBtn.addEventListener('click', () => enterFullscreen());
  backBtn.addEventListener('click', () => exitFullscreen());

  // ── Hybrid Fix 1×4: High-Contrast Scrubber Tray ───────────────────────────────────────────────────────
  function syncRibbonMeta(idx) {
    if (!N) return;
    const safeIdx = clamp(idx, 0, N - 1);
    const it = items[safeIdx];
    ribbonNum.textContent = `${pad2(safeIdx + 1)} — ${pad2(N)}`;
    ribbonCap.textContent = capFirst(it.title || KIND_PLACARD[it.kind] || it.kind);
    ribbonHint.textContent = (isScrubbing || (ribbonDrag && ribbonDrag.moved))
      ? 'Scrubbing live'
      : 'Drag bar or click card';

    for (let k = 0; k < N; k++) {
      const d = Math.abs(k - safeIdx);
      ribbonCells[k].classList.toggle('is-focus', k === safeIdx);
      ribbonCells[k].classList.toggle('is-near', d === 1 || d === 2);
      node[k].thumb.classList.toggle('is-scrub-target', k === safeIdx);
      node[k].thumb.classList.toggle('is-scrub-near', d === 1);
    }
  }

  function showRibbonAtFloat(f) {
    clearTimeout(hideRibbonTimer);
    ribbonFloat = clamp(f, 0, Math.max(0, N - 1));
    const idx = clamp(Math.round(ribbonFloat), 0, Math.max(0, N - 1));
    ribbon.style.left = '50%';
    root.classList.add('is-ribbon-open');
    ribbon.classList.add('is-shown');

    const winW = ribbonWin.clientWidth || Math.min(vw - 44, 634);
    const tx = winW / 2 - floatToCellX(ribbonFloat);
    ribbonTrack.style.transform = `translate3d(${tx.toFixed(2)}px,0,0)`;

    syncRibbonMeta(idx);
    return ribbonFloat;
  }

  function scheduleHideRibbon() {
    clearTimeout(hideRibbonTimer);
    hideRibbonTimer = setTimeout(() => {
      if (!overMap && !overRibbon && !isScrubbing && !ribbonDrag) hideRibbon(true);
    }, 90);
  }

  function hideRibbon(immediate = false) {
    clearTimeout(hideRibbonTimer);
    if (!immediate && (overMap || overRibbon || isScrubbing || ribbonDrag)) return;
    root.classList.remove('is-ribbon-open');
    ribbon.classList.remove('is-shown');
    for (let k = 0; k < N; k++) node[k].thumb.classList.remove('is-scrub-target', 'is-scrub-near');
  }

  map.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch' || !feat.scrubRuler) return;
    overMap = true;
    showRibbonAtFloat(pointerToFloatIndex(e.clientX));
  });
  map.addEventListener('pointermove', (e) => {
    if (!feat.scrubRuler) return;
    if (e.pointerType === 'touch' && !isScrubbing) return;
    overMap = true;
    const f = showRibbonAtFloat(pointerToFloatIndex(e.clientX));
    if (isScrubbing) {
      scrubTargetFloat = f;
      for (let k = Math.max(0, Math.floor(f) - 4); k <= Math.min(N - 1, Math.ceil(f) + 4); k++) loadStripImg(k);
      kick();
    }
  });
  map.addEventListener('pointerleave', () => {
    overMap = false;
    scheduleHideRibbon();
  });
  map.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !feat.scrubRuler) return;
    e.preventDefault();
    isScrubbing = true;
    root.classList.add('is-scrubbing-ruler');
    map.setPointerCapture(e.pointerId);
    scrubTargetFloat = showRibbonAtFloat(pointerToFloatIndex(e.clientX));
    kick();
  });

  const endMapScrub = (e) => {
    if (!isScrubbing) return;
    isScrubbing = false;
    root.classList.remove('is-scrubbing-ruler');
    try { map.releasePointerCapture(e.pointerId); } catch {}
    const target = clamp(Math.round(scrubTargetFloat), 0, Math.max(0, N - 1));
    stepTo(target);
    const mapB = map.getBoundingClientRect();
    overMap = e.clientX >= mapB.left && e.clientX <= mapB.right && e.clientY >= mapB.top && e.clientY <= mapB.bottom;
    if (e.pointerType === 'touch') hideRibbon(true);
    else if (overMap) showRibbonAtFloat(target);
    else scheduleHideRibbon();
  };
  map.addEventListener('pointerup', endMapScrub);
  map.addEventListener('pointercancel', endMapScrub);

  map.addEventListener('click', (e) => {
    if (feat.scrubRuler && e.detail !== 0) return;
    const t = e.target.closest('.evm-map__thumb');
    if (t) stepTo(+t.dataset.i);
  });

  ribbon.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch' || !feat.scrubRuler) return;
    overRibbon = true;
    clearTimeout(hideRibbonTimer);
  });
  ribbon.addEventListener('pointerleave', () => {
    overRibbon = false;
    syncRibbonMeta(Math.round(ribbonFloat));
    scheduleHideRibbon();
  });

  ribbonWin.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !feat.scrubRuler) return;
    const hitCell = e.target.closest('.evm-ribbon__cell');
    ribbonDrag = {
      id: e.pointerId,
      x0: e.clientX,
      startCellX: floatToCellX(ribbonFloat),
      moved: false,
      hitIdx: hitCell ? +hitCell.dataset.i : -1,
    };
    ribbonWin.setPointerCapture(e.pointerId);
  });
  ribbonWin.addEventListener('pointermove', (e) => {
    if (!ribbonDrag || e.pointerId !== ribbonDrag.id) return;
    const dx = e.clientX - ribbonDrag.x0;
    if (!ribbonDrag.moved && Math.abs(dx) > 5) ribbonDrag.moved = true;
    if (!ribbonDrag.moved) return;
    const f = cellXToFloat(ribbonDrag.startCellX - dx);
    scrubTargetFloat = showRibbonAtFloat(f);
    for (let k = Math.max(0, Math.floor(f) - 4); k <= Math.min(N - 1, Math.ceil(f) + 4); k++) loadStripImg(k);
    kick();
  });
  const endRibbonDrag = (e) => {
    if (!ribbonDrag || e.pointerId !== ribbonDrag.id) return;
    const d = ribbonDrag;
    ribbonDrag = null;
    try { ribbonWin.releasePointerCapture(e.pointerId); } catch {}
    if (d.moved) {
      const target = clamp(Math.round(scrubTargetFloat), 0, Math.max(0, N - 1));
      stepTo(target);
      showRibbonAtFloat(target);
    } else if (e.type === 'pointerup' && d.hitIdx >= 0) {
      stepTo(d.hitIdx);
      showRibbonAtFloat(d.hitIdx);
    }
  };
  ribbonWin.addEventListener('pointerup', endRibbonDrag);
  ribbonWin.addEventListener('pointercancel', endRibbonDrag);

  // Wheel: Lock 100% in Full-Screen; allow normal vertical page scroll when Inline in right column!
  root.addEventListener('wheel', (e) => {
    if (isFullscreen) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false });

  let lastTapHandledAt = 0;

  // Stage Click (Hero -> Expand Fullscreen; Wing -> Step; Outer FS Margin -> Exit) & Horizontal Drag Shuttle
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('video')) return;
    if (ribbon.classList.contains('is-shown')) {
      overMap = overRibbon = false;
      hideRibbon(true);
    }
    const hit = e.target.closest('.evm-item') || document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.evm-item');
    shuttleDrag = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      startFocus: vFocus,
      targetFocus: vFocus,
      moved: false,
      lx: e.clientX,
      lt: performance.now(),
      vx: 0,
      hit: hit ? +hit.dataset.i : -1,
    };
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!shuttleDrag || e.pointerId !== shuttleDrag.id || !feat.dragShuttle) return;
    const dx = e.clientX - shuttleDrag.x0;
    const dy = e.clientY - shuttleDrag.y0;
    if (!shuttleDrag.moved) {
      if (!isFullscreen && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        shuttleDrag = null;
        return;
      }
      if (Math.abs(dx) > 7) {
        shuttleDrag.moved = true;
        root.classList.add('is-shuttle-dragging');
        try { viewport.setPointerCapture(e.pointerId); } catch {}
      }
    }
    if (!shuttleDrag.moved) return;
    const now = performance.now(), dtm = Math.max(1, now - shuttleDrag.lt);
    shuttleDrag.vx = lerp(shuttleDrag.vx, (e.clientX - shuttleDrag.lx) / dtm, 0.35);
    shuttleDrag.lx = e.clientX;
    shuttleDrag.lt = now;
    const raw = shuttleDrag.startFocus - dx / 128;
    shuttleDrag.targetFocus = raw < 0
      ? raw * 0.22
      : raw > N - 1
        ? (N - 1) + (raw - (N - 1)) * 0.22
        : raw;
    for (let k = Math.max(0, Math.floor(shuttleDrag.targetFocus) - 4); k <= Math.min(N - 1, Math.ceil(shuttleDrag.targetFocus) + 4); k++) loadStripImg(k);
    kick();
  });

  const endShuttle = (e) => {
    if (!shuttleDrag || e.pointerId !== shuttleDrag.id) return;
    const d = shuttleDrag;
    shuttleDrag = null;
    root.classList.remove('is-shuttle-dragging');
    try { viewport.releasePointerCapture(e.pointerId); } catch {}

    if (d.moved && feat.dragShuttle) {
      lastTapHandledAt = performance.now();
      const aliveV = performance.now() - d.lt > 90 ? 0 : d.vx;
      const throwItems = clamp(-aliveV * 1.45, -3.5, 3.5);
      stepTo(clamp(Math.round(vFocus + throwItems), 0, Math.max(0, N - 1)));
    } else if (e.type === 'pointerup' && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 10) {
      lastTapHandledAt = performance.now();
      if (d.hit >= 0 && d.hit !== popI) {
        stepTo(d.hit);
      } else if (d.hit === popI && !isFullscreen && items[popI]?.type !== 'video') {
        // Clicking the main center image in the right column brings the Carousel Viewer Full-Screen!
        enterFullscreen();
      } else if (d.hit < 0 && isFullscreen) {
        // Clicking empty outer backdrop margin in Full-Screen folds smoothly back to 2-column Salon!
        exitFullscreen();
      }
    }
  };
  viewport.addEventListener('pointerup', endShuttle);
  viewport.addEventListener('pointercancel', endShuttle);

  viewport.addEventListener('click', (e) => {
    if (performance.now() - lastTapHandledAt < 320) return;
    if (e.target.closest('video')) return;
    const f = e.target.closest('.evm-item');
    if (!f) return;
    const idx = +f.dataset.i;
    if (idx !== popI) stepTo(idx);
    else if (!isFullscreen && items[popI]?.type !== 'video') enterFullscreen();
  });

  const onKeyDown = (e) => {
    if (destroyed || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target?.closest?.('input, textarea')) return;
    const k = e.key;
    if (k === 'Escape') {
      if (ribbon.classList.contains('is-shown')) {
        e.preventDefault();
        overMap = overRibbon = false;
        hideRibbon(true);
      } else if (isFullscreen) {
        e.preventDefault();
        exitFullscreen();
      }
    } else if (isFullscreen || document.body.classList.contains('below-active')) {
      if (k === 'ArrowRight' || k === 'ArrowLeft') {
        e.preventDefault();
        stepTo(popI + (k === 'ArrowRight' ? 1 : -1));
      } else if (k === 'Home' || k === 'End') {
        e.preventDefault();
        stepTo(k === 'Home' ? 0 : N - 1);
      }
    }
  };
  window.addEventListener('keydown', onKeyDown, true);

  const ro = new ResizeObserver(() => {
    if (destroyed) return;
    layout();
    render();
    kick();
  });
  ro.observe(root);

  function triggerDeal(centerIdx = 0) {
    if (reduce.matches) return;
    clearTimeout(dealTimer);
    node.forEach((n, idx) => n.frame.style.setProperty('--evm-dist', Math.min(6, Math.abs(idx - centerIdx))));
    root.classList.remove('is-dealing');
    void root.offsetWidth;
    root.classList.add('is-dealing');
    dealTimer = setTimeout(() => root.classList.remove('is-dealing'), 720);
  }

  // Boot opened on Item 01 immediately!
  layout();
  syncFeatureClasses();
  stepTo(clamp(opt.startAt || 0, 0, Math.max(0, N - 1)), true);
  render();
  triggerDeal(popI);
  kick();

  return {
    root,
    fsCanvas,
    stepTo,
    enterFullscreen,
    exitFullscreen,
    isFullscreen: () => isFullscreen,
    currentIndex: () => popI,
    count: N,
    setSurfaceTone: (tone) => { root.dataset.surfaceTone = tone; },
    setPopStyle: (style) => {
      root.dataset.popStyle = style;
      if (ribbon.classList.contains('is-shown')) showRibbonAtFloat(ribbonFloat);
    },
    setFeatures: (nextFeat) => {
      feat = { ...feat, ...nextFeat };
      syncFeatureClasses();
    },
    previewRibbon: (show = true) => {
      if (!feat.scrubRuler) return;
      if (show) showRibbonAtFloat(popI);
      else { overMap = overRibbon = false; hideRibbon(true); }
    },
    relayout: () => { layout(); render(); kick(); },
    destroy: () => {
      destroyed = true;
      detachHeroVideo();
      clearTimeout(dealTimer);
      clearTimeout(hideRibbonTimer);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown, true);
      document.body.classList.remove('fs-open');
      placeholder.remove();
      root.remove();
    },
  };
}
