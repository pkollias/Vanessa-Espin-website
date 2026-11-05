/* Iyuana, the wall. Owned by the pictures builder.

   The evening at once, not in a slideshow. The page opens full-screen on one print (hands over the eyes); as you
   scroll the view pulls straight back and it turns out to be one print on a dark wall holding the whole evening.
   Click a print and it pushes in; the arrows walk the wall from there. Then the scroll walks the wall itself: a far print
   is reached by pulling back to the whole wall and pushing in, a print's neighbour by sliding along it, so the rhythm is
   out, in, out, in, along, out, in, along. The last stop, the cacao, holds, and the photograph leaves with the scroll: the
   next section's own paper (.pic-wall + .p-text in pictures.css) rises on a flat line directly under it. Nothing fades.
   Radian's film-to-postcard and Daddy Yankee's zoom-out for the pull, Lusion's card-to-page for the push in.

   Every print is laid out at its real size each frame, not scaled as a group, so the picture stays sharp at the
   start of the pull. The section only pins (sticky) and sets the ground: data-tone night, data-sheets park. */

// x, y, w, h: wall units (a 120 x 67.5 wall), read left to right as the evening: daylight to candles to everyone.
const WALL_W = 120, WALL_H = 67.5, MOUNT = 0.035;
const PRINTS = [
  { f: '4633', x: 3, y: 11.5, w: 20, h: 13.3, size: 'medium', cap: "A print, up close", src: 'img/iyuana/full/4633.jpg' },
  { f: '4619', x: 7.5, y: 27.0, w: 15, h: 10.0, size: 'small', cap: "Three portraits on the wall", src: 'img/iyuana/full/4619.jpg' },
  { f: '4629', x: 3, y: 38.7, w: 20, h: 13.3, size: 'medium', cap: "On the table" },
  { f: '4651', x: 24.5, y: 10.5, w: 13.3, h: 20.0, size: 'medium', cap: "In front of a print" },
  { f: '4666', x: 39.5, y: 12.5, w: 13.5, h: 9.0, size: 'small', cap: "At the table" },
  { f: '4768', x: 41.5, y: 24.0, w: 11, h: 7.3, size: 'small', cap: "A print, and the room behind it" },
  { f: '4762', x: 54.5, y: 42.3, w: 19, h: 12.7, size: 'medium', cap: "The Sápara Nation", src: 'img/iyuana/full/4762.jpg' },
  { f: '4777', x: 60, y: 8.0, w: 19, h: 12.7, size: 'medium', cap: "The room" },
  { f: '4787', x: 54.5, y: 22.1, w: 28, h: 18.7, size: 'large', cap: "Vanessa Espín", src: 'img/iyuana/full/4787.jpg' },
  { f: '4801', x: 24.5, y: 36.5, w: 28, h: 18.7, size: 'large', cap: "The prints in the room" },
  { f: '4810', x: 74.8, y: 42.3, w: 13, h: 8.7, size: 'small', cap: null },
  { f: '4769', x: 87, y: 10.0, w: 16.5, h: 11.0, size: 'medium', cap: "The audience" },
  { f: '4825', x: 105.5, y: 11.5, w: 13, h: 8.7, size: 'small', cap: "Cacao ceremony", src: 'img/iyuana/full/4825.jpg' },
  { f: '4620', x: 84, y: 22.4, w: 20, h: 13.3, size: 'medium', cap: "A print on the wall" },
  { f: '4842', x: 105.5, y: 23.6, w: 13, h: 8.7, size: 'small', cap: "Cacao", src: 'img/iyuana/held-dscf4842.jpg' },
  { f: '4848', x: 90, y: 37.9, w: 28, h: 18.7, size: 'large', cap: "Everyone" },
];
const src = (p) => p.src || `img/iyuana/wall/${p.f}.jpg`;
// On a phone a print that stays on the wall is at most 366 px wide, so it comes from img/iyuana/phone/ (1200 px on the long side).
// The prints the camera goes into keep their full files, and the lightbox always has them.
const wallSrc = (p, coarse, open) => (coarse && !p.src && p.f !== open ? `img/iyuana/phone/${p.f}.jpg` : src(p));
// Which print the page opens on (lab wallopen), and the stops after the wall. slide: go along the wall.
const OPEN = { hands: '4633', sky: '4620' };
const TOUR = [{ f: '4619' }, { f: '4787' }, { f: '4762', slide: true }, { f: '4825' }, { f: '4842', slide: true }];
const STOPS = { tour: TOUR, cacao: [{ f: '4842' }], candles: [{ f: '4825' }], off: [] };
// which part of a print stays in view when it fills the screen; a phone sees far less of a landscape picture
const FOCUS = { 4633: [0.5, 0.5], 4620: [0.42, 0.42], 4619: [0.5, 0.34], 4787: [0.5, 0.5], 4762: [0.5, 0.56], 4842: [0.43, 0.62], 4825: [0.5, 0.62] };
const FOCUS_PHONE = { 4619: [0.42, 0.3], 4787: [0.47, 0.5], 4762: [0.46, 0.56], 4825: [0.46, 0.62] };
// in screen heights of scroll: the opening, then for each stop a pull back (OUT), a breath, a push in (IN) or a slide (ALONG)
const HOLD = 0.35, PULL = 1.5, REST = 0.6, OUT = 0.9, BREATH = 0.2, IN = 1, ALONG = 0.9, STAY = 0.35, LEFT = 0.5;
const DIP = 0.55; // how far a slide steps back at its middle, as the log of the scale
const BLEED = 2; // px of the picture kept past the screen's edge, so its mount never shows as a lit column
const CREDIT = 'Photographs: <span class="ph" title="To come">[photographer credit]</span>';
const WHO = '<span class="ph" title="Who is speaking: to come from Vanessa">[who is speaking]</span>';
const capOf = (p) => p.cap || WHO;
const altOf = (p, k) => p.cap || `Iyuana, photograph ${k + 1}`;

const bez = (x1, y1, x2, y2) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - (((ax * t + bx) * t + cx) * t - x) / d));
    }
    return ((ay * t + by) * t + cy) * t;
  };
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mix = (a, b, t) => a + (b - a) * t;
const E_MAIN = bez(0.625, 0.05, 0, 1);
const E_PULL = (t) => 0.5 * E_MAIN(t) + 0.5 * (0.5 - 0.5 * Math.cos(Math.PI * t)); // Daddy Yankee's zoom curve

export function wallHTML(coarse, wallOpen) {
  const open = OPEN[wallOpen] || OPEN.hands;
  const prints = PRINTS.map((p, k) => `<button class="pic-print" type="button" data-k="${k}" aria-label="Open: ${altOf(p, k)}" style="--mt:${(MOUNT * (p.w / p.h) * 100).toFixed(2)}%"><img data-src="${wallSrc(p, coarse, open)}" alt="${altOf(p, k)}" decoding="async"></button>`).join('');
  return `
  <section class="pic-wall" data-pictures="wall" data-tone="night" data-sheets="park" aria-label="The evening, in ${PRINTS.length} prints">
    <div class="pic-wall__pin">
      ${prints}
      <p class="pic-wall__cap"></p>
      <p class="pic-wall__foot"><span>${CREDIT}</span><span>${coarse ? 'Tap' : 'Click'} a print to open it</span></p>
    </div>
  </section>`;
}

// The wall's layout at this screen size. A phone gets rows, so it is taller than the screen and pans after the pull.
function place(c, vw, vh, vis) {
  const r = [], phone = vw < 760;
  if (!phone) {
    const k = Math.min((vw * 0.97) / WALL_W, (vh * 0.9) / WALL_H), ox = (vw - WALL_W * k) / 2, oy = (vh - WALL_H * k) / 2;
    for (const p of PRINTS) r.push({ x: ox + p.x * k, y: oy + p.y * k, w: p.w * k, h: p.h * k });
    c.wallH = vh;
  } else {
    const g = 10, W = vw - 24, ar = (p) => p.w / p.h;
    let y = 76;
    for (let i = 0; i < PRINTS.length;) {
      const a = PRINTS[i], b = PRINTS[i + 1];
      if (a.size === 'large' || !b || b.size === 'large') { const h = W / ar(a); r[i] = { x: 12, y, w: W, h }; y += h + g; i += 1; }
      else { const h = (W - g) / (ar(a) + ar(b)); r[i] = { x: 12, y, w: h * ar(a), h }; r[i + 1] = { x: 12 + h * ar(a) + g, y, w: h * ar(b), h }; y += h + g; i += 2; }
    }
    c.wallH = y + 110;
  }
  c.rects = r;
  // a camera that puts one print, without its mount, over the whole screen
  const cover = (k) => {
    const L = r[k], m = L.w * MOUNT, ix = L.x + m, iy = L.y + m, iw = L.w - 2 * m, ih = L.h - 2 * m;
    const f = PRINTS[k].f, s = Math.max(vw / iw, vh / ih) * 1.01, [fx, fy] = (phone && FOCUS_PHONE[f]) || FOCUS[f] || [0.5, 0.5];
    return { s, x: Math.min(-s * ix - BLEED, Math.max(vw + BLEED - s * (ix + iw), vw / 2 - s * (ix + iw * fx))), y: Math.min(-s * iy - BLEED, Math.max(vh + BLEED - s * (iy + ih), vh / 2 - s * (iy + ih * fy))) };
  };
  const at = (f) => PRINTS.findIndex((p) => p.f === f);
  c.pan = Math.max(0, c.wallH - vh);
  // the whole wall; on a phone, where it is taller than the screen, with this print in view
  const wall = (k) => ({ s: 1, x: 0, y: -Math.min(c.pan, Math.max(0, r[k].y + r[k].h / 2 - vh / 2)) });
  // the timeline: every stretch of scroll is a hold, a zoom or a slide between two cameras. from, to: the print it leaves or reaches
  const stops = STOPS[vis.wallExit] || TOUR, open = cover(at(OPEN[vis.wallOpen] || OPEN.hands));
  const walk = vis.walk || 'mixed'; // lab: mixed (far prints zoom, neighbours slide), zoom (always), jump (print to print, no pull back)
  const tl = [];
  let y = 0;
  const add = (a, b, len, kind, from = -1, to = -1, dip = 0) => { tl.push({ a, b, y, len, kind, from, to, dip }); y += len; };
  let here = stops.length ? wall(at(stops[0].f)) : { s: 1, x: 0, y: 0 }, was = -1;
  add(open, open, HOLD, 'hold');
  add(open, here, PULL, 'zoom');
  add(here, here, REST, 'hold');
  stops.forEach(({ f, slide }, i) => {
    const k = at(f), cam = cover(k);
    if (i && (walk === 'jump' || (walk === 'mixed' && slide))) add(here, cam, ALONG, 'slide', was, k, walk === 'jump' ? 0 : DIP);
    else {
      if (i) {
        const back = wall(k);
        add(here, back, OUT, 'zoom', was);
        add(back, back, BREATH, 'hold');
        here = back;
      }
      add(here, cam, IN, 'zoom', -1, k);
    }
    add(cam, cam, i === stops.length - 1 ? LEFT : STAY, 'hold', k, k);
    here = cam; was = k;
  });
  if (!stops.length && c.pan) { const end = { s: 1, x: 0, y: -c.pan }; add(here, end, c.pan / vh, 'zoom'); add(end, end, REST, 'hold'); }
  c.tl = tl; c.len = y;
  c.drawn = 0;
}

// The camera at u, 0 to 1, along one stretch. A zoom keeps one point of the wall still, so it is a true pull back. A slide
// carries the middle of the view along the wall and steps back a little on the way, so the wall between the two prints shows.
function aim(cam, g, u, vw, vh) {
  const { a, b } = g;
  if (g.kind === 'hold') { cam.s = a.s; cam.x = a.x; cam.y = a.y; return; }
  const e = E_PULL(u);
  if (g.kind === 'slide') {
    cam.s = Math.exp(mix(Math.log(a.s), Math.log(b.s), e) - g.dip * Math.sin(Math.PI * e));
    cam.x = vw / 2 - cam.s * mix((vw / 2 - a.x) / a.s, (vw / 2 - b.x) / b.s, e);
    cam.y = vh / 2 - cam.s * mix((vh / 2 - a.y) / a.s, (vh / 2 - b.y) / b.s, e);
    return;
  }
  cam.s = Math.pow(a.s, 1 - e) * Math.pow(b.s, e);
  const q = a.s === b.s ? e : (cam.s - a.s) / (b.s - a.s);
  cam.x = mix(a.x, b.x, q); cam.y = mix(a.y, b.y, q);
}

export function wallEnter(root) {
  const sec = root.querySelector('.pic-wall');
  const c = { sec, root, pin: sec.querySelector('.pic-wall__pin'), els: [...sec.querySelectorAll('.pic-print')], kw: 0, kh: 0, p: 0, first: true, t: 0, loaded: false, box: null, open: -1, cam: { s: 1, x: 0, y: 0 }, capOn: -1, cap: sec.querySelector('.pic-wall__cap') };
  c.onClick = (ev) => { const b = ev.target.closest('.pic-print'); if (b) boxOpen(c, +b.dataset.k); };
  sec.addEventListener('click', c.onClick);
  // the page stays on night until the paper has all but reached the top, so the nav stays right over the photograph
  c.tone = document.createElement('i');
  c.tone.className = 'pic-wall__tone';
  c.tone.dataset.tone = 'night';
  sec.nextElementSibling?.prepend(c.tone);
  c.ground = document.querySelector('.page-bg');
  return c;
}

export function wallFrame(c, ctx) {
  const { vw, reduced } = ctx;
  c.sec.classList.toggle('is-still', reduced);
  const vh = reduced ? ctx.vh : c.pin.clientHeight || ctx.vh;
  if (c.kw !== vw || c.kh !== vh) {
    c.kw = vw; c.kh = vh;
    place(c, vw, vh, ctx.vis);
    c.sec.style.height = `${(reduced ? c.wallH : (c.len + 1) * vh).toFixed(1)}px`;
    if (reduced) c.pin.style.height = `${c.wallH.toFixed(1)}px`;
  }
  const r = c.sec.getBoundingClientRect();
  // while the photograph leaves, it and the paper hide the page's ground: the ground turns at once, not on its slow fade,
  // so a fast scroll that reaches the paper's foot finds paper there and not a ground still on its way from night
  const hidden = r.bottom > 0 && r.bottom <= vh;
  if (hidden !== c.hidden) { c.hidden = hidden; c.ground.style.transition = hidden ? 'none' : ''; }
  if (!c.loaded && r.top < vh * 2.5) {
    c.loaded = true;
    // the opening print on its own first: it fills the screen, and the other fifteen would only compete with it
    const show = (im) => { if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } };
    const rest = () => c.els.forEach((el) => show(el.firstElementChild));
    const first = c.els[PRINTS.findIndex((p) => p.f === (OPEN[ctx.vis.wallOpen] || OPEN.hands))].firstElementChild;
    first.addEventListener('load', rest, { once: true });
    first.addEventListener('error', rest, { once: true });
    show(first);
  }
  if (r.bottom < -vh || r.top > vh * 1.5) return;
  const y = -r.top / vh, now = performance.now(), dt = Math.min(0.1, (now - c.t) / 1000);
  c.t = now;
  c.p = c.first ? y : c.p + (y - c.p) * (1 - Math.exp(-dt / 0.16));
  if (Math.abs(y - c.p) < 0.0004) c.p = y;
  c.first = false;
  let g = c.tl[c.tl.length - 1];
  for (const q of c.tl) if (c.p < q.y + q.len) { g = q; break; }
  const u = clamp01((c.p - g.y) / g.len), cam = c.cam;
  if (reduced) { cam.s = 1; cam.x = 0; cam.y = 0; } else aim(cam, g, u, vw, vh);
  const { s, x: tx, y: ty } = cam;
  c.sec.classList.toggle('is-rest', reduced || (g.kind === 'hold' && s < 1.02));
  // a stop's caption shows while the camera is on it
  const on = reduced ? -1 : g.kind === 'hold' || u > 0.9 ? g.to : u < 0.1 ? g.from : -1;
  if (on !== c.capOn) {
    c.capOn = on;
    if (on >= 0) c.cap.innerHTML = capOf(PRINTS[on]);
    c.sec.classList.toggle('is-out', on >= 0);
  }
  if (c.drawn && s === c.ds && tx === c.dx && ty === c.dy) return;
  c.drawn = 1; c.ds = s; c.dx = tx; c.dy = ty;
  for (let k = 0; k < c.els.length; k++) {
    const el = c.els[k], b = c.rects[k], x = s * b.x + tx, yy = s * b.y + ty, w = s * b.w, h = s * b.h;
    const seen = x < vw && x + w > 0 && yy < vh && yy + h > 0;
    el.style.visibility = seen ? '' : 'hidden';
    if (!seen) continue;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${yy.toFixed(1)}px, 0)`;
    el.style.width = `${w.toFixed(1)}px`;
    el.style.height = `${h.toFixed(1)}px`;
  }
}

export function wallLeave(c) {
  c.sec.removeEventListener('click', c.onClick);
  c.tone.remove();
  c.ground.style.transition = '';
  boxClose(c, true);
  if (c.box) { c.box.el.remove(); c.box = null; }
}

/* Pushing in: the print grows from its place on the wall to fill the screen. Arrows walk the wall, Esc goes back. */
function boxBuild(c) {
  const el = document.createElement('div');
  el.className = 'pic-box';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Photograph');
  el.innerHTML = `<img class="pic-box__img" alt="">
    <div class="pic-box__bar">
      <p class="pic-box__cap"></p>
      <span class="pic-box__count"></span>
      <button class="pic-box__btn" type="button" data-go="-1" aria-label="Previous photograph">←</button>
      <button class="pic-box__btn" type="button" data-go="1" aria-label="Next photograph">→</button>
      <button class="pic-box__btn pic-box__close" type="button">Close <span aria-hidden="true">×</span></button>
    </div>`;
  document.body.append(el);
  const b = { el, img: el.querySelector('.pic-box__img'), cap: el.querySelector('.pic-box__cap'), count: el.querySelector('.pic-box__count'), close: el.querySelector('.pic-box__close') };
  el.addEventListener('click', (ev) => {
    const go = ev.target.closest('[data-go]');
    if (go) boxStep(c, +go.dataset.go);
    else if (ev.target === el || ev.target.closest('.pic-box__close')) boxClose(c);
  });
  el.addEventListener('wheel', (ev) => ev.preventDefault(), { passive: false });
  el.addEventListener('touchmove', (ev) => ev.preventDefault(), { passive: false });
  c.onKey = (ev) => {
    if (c.open < 0) return;
    if (ev.key === 'Escape') { ev.stopImmediatePropagation(); ev.preventDefault(); boxClose(c); }
    else if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.stopImmediatePropagation(); ev.preventDefault(); boxStep(c, 1); }
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.stopImmediatePropagation(); ev.preventDefault(); boxStep(c, -1); }
  };
  addEventListener('keydown', c.onKey, true);
  c.box = b;
  return b;
}
function boxShow(c, k) {
  const b = c.box, p = PRINTS[k];
  c.open = k;
  b.img.src = src(p);
  b.img.alt = altOf(p, k);
  b.cap.innerHTML = `${capOf(p)}<span>${CREDIT}</span>`;
  b.count.textContent = `${String(k + 1).padStart(2, '0')} / ${PRINTS.length}`;
}
const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const flipFrom = (from, to) => `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${from.width / to.width})`;
async function boxOpen(c, k) {
  const b = c.box || boxBuild(c);
  c.back = c.els[k];
  boxShow(c, k);
  b.el.hidden = false;
  try { await b.img.decode(); } catch { /* it still shows */ }
  if (c.open !== k) return;
  b.el.classList.add('is-open');
  b.close.focus({ preventScroll: true });
  if (!quiet()) b.img.animate([{ transform: flipFrom(c.els[k].firstElementChild.getBoundingClientRect(), b.img.getBoundingClientRect()) }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.65,0,.35,1)' });
}
function boxStep(c, d) {
  const n = PRINTS.length;
  boxShow(c, (c.open + d + n) % n);
}
function boxClose(c, now = false) {
  if (!c.box || c.open < 0) return;
  const b = c.box, el = c.els[c.open], k = c.open;
  c.open = -1;
  const done = () => { b.el.hidden = true; b.img.removeAttribute('src'); };
  b.el.classList.remove('is-open');
  if (c.back) c.back.focus({ preventScroll: true });
  if (now || quiet() || el.style.visibility === 'hidden') { done(); return; }
  const a = b.img.animate([{ transform: 'none' }, { transform: flipFrom(el.firstElementChild.getBoundingClientRect(), b.img.getBoundingClientRect()) }], { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
  a.onfinish = () => { a.cancel(); if (c.open !== k) done(); };
}
export function wallKeyOff(c) { if (c.onKey) removeEventListener('keydown', c.onKey, true); }
