/* Owned by the pictures builder: the documentation images, the Iyuana held light and the Herencia Viva drift band.

   app.js calls these four hooks (search for "pictures hook" there):
     picturesHTML(p, i, vis)  in programHTML, between the story section (.p-story) and the text section (.p-text).
                          Returns the HTML of any section that sits there ('' for none). p is PROGRAMS[i], vis is VIS.
     picturesEnter(root, p, i, ctx)  right after a program's DOM is in place (root is the program view, .program).
                          ctx is the object picturesFrame gets; at this point only ctx.paper and the constant fields are
                          current.
     picturesFrame(ctx)   every frame while a program is entered, at the very end of programFrame.
                          ctx = { root, scrollY, vh, vw, reduced, coarse, i, p, vis, now, dt, paper, resetDocs } (one
                          object, reused every frame). resetDocs(stage) returns the documentation tool to its first frame.
                          paper is the way into the WebGL scene: see OWNERSHIP.md.
     picturesLeave()      when that program view is left or replaced (home, another page, the next program).
                          The old DOM is still on screen for about 0.4 s while it slides out, then it is emptied.
   Shared contract (see OWNERSHIP.md):
     data-tone="night|blood|cobalt|stone|paper|rose" on any element in the program view sets the page ground while it crosses the
     middle of the screen (followTone in app.js). data-sheets="park" on an element asks the poster to park
     while that element covers most of the viewport (built by the journey builder).

   Iyuana, the held light (lab held=on): a full-bleed photograph held for 120svh with nothing moving but a slow
   scale (1.00 to 1.04), then, as you keep scrolling, it shrinks and travels into the first frame of the
   documentation tool, the same photograph (Radian's hero handoff, cubic-bezier(.625,.05,0,1)). A night backdrop
   keeps the page dark around the light until the picture lands, then the paper page with the tool shows.
   The section (.pic-held) is only a spacer that sets the night ground; the picture itself is a fixed layer
   beside it (.pic-held__layer), outside the toned section, so the off-tone fade never hides it.

   Herencia Viva, the drift band (lab drift=on): MAGIC REALISM (from her poster's "Ecuadorian Magic Realism")
   rises out of its own masks, and four of the pictures drift past it at their own speeds (0.6, 0.85, 1.15 and
   1.4 times the page), two behind the line and two in front (Daddy Yankee's framed drift). */

import { wallHTML, wallEnter, wallFrame, wallLeave, wallKeyOff } from './wall.js';
import { longHTML, longEnter, longFrame } from './crossing.js';
import { chaptersHTML, chaptersEnter, chaptersFrame, chaptersLeave, chaptersReady } from './chapters.js';
import { chaptersFor } from './chapters-content.js';

export { chaptersReady }; // app.js: once true, the chapters are the default of the drift switch

// A CSS cubic-bezier() as a function (the same as bez in app.js)
const bez = (x1, y1, x2, y2) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
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

/* ---------- Iyuana: the held light ---------- */
// decoration: the same photograph is frame 01 of the documentation tool, which carries its alt text
const HELD = { src: 'img/iyuana/held-dscf4842.jpg' };
const HOLD = 1.2; // the hold, in viewport heights (about 120svh)
const TRAVEL = 1.0; // the match cut, in viewport heights of scroll
const SCALE = 0.04; // 1.00 to 1.04 over the hold
const E_CUT = bez(0.625, 0.05, 0, 1); // Radian's "uncommon" ease

function heldHTML() {
  return `
  <section class="pic-held" data-pictures="held" data-tone="night" data-sheets="park" aria-hidden="true"></section>
  <div class="pic-held__layer" data-pictures="held" aria-hidden="true" hidden>
    <i class="pic-held__dark"></i>
    <figure class="pic-held__shot"><img data-src="${HELD.src}" alt="" width="2600" height="1733" decoding="async"></figure>
    <i class="pic-held__park" data-sheets="park"></i>
  </div>`;
}

/* ---------- Herencia Viva: the drift band ---------- */
// x, y: the picture's left edge (vw) and its centre's offset from the band's centre (svh) at the moment the
// band's centre crosses the middle of the screen; w: width in vw. m: the same on phones.
// rate: its speed against the page (1 moves with the page and the type).
// Three are Luis Medina's paintings; the fish is her design, so the band's credit names them both.
const DRIFT = [
  { file: '04-andean-figures.jpg', w: 554, h: 666, alt: 'Painting', rate: 0.6, layer: 'back', at: { x: 5, y: -12, w: 22 }, m: { x: 5, y: -30, w: 46 } },
  { file: '06-fish-in-the-city.jpg', w: 550, h: 670, alt: 'The poster’s fish, in New York', rate: 1.4, layer: 'front', at: { x: 27, y: 30, w: 25 }, m: { x: 48, y: 38, w: 46 } },
  { file: '05-village-painting.jpg', w: 414, h: 444, alt: 'Painting', rate: 0.85, layer: 'back', at: { x: 57, y: -18, w: 18 }, m: { x: 60, y: -9, w: 34 } },
  { file: '03-meninas-detail.jpg', w: 550, h: 666, alt: 'Meninas Ancestrales · detail', rate: 1.15, layer: 'front', at: { x: 80, y: 16, w: 19 }, m: { x: 7, y: 19, w: 38 } },
];

function driftPic(d) {
  const vars = `--x:${d.at.x};--y:${d.at.y};--w:${d.at.w};--xm:${d.m.x};--ym:${d.m.y};--wm:${d.m.w};--ar:${(d.w / d.h).toFixed(4)};--nw:${d.w}px`;
  return `<figure class="pic-drift__pic pic-drift__pic--${d.layer}" data-rate="${d.rate}" style="${vars}"><img src="img/herencia-viva/${d.file}" alt="${d.alt}" width="${d.w}" height="${d.h}" loading="lazy" decoding="async"></figure>`;
}
function driftHTML() {
  const back = DRIFT.filter((d) => d.layer === 'back').map(driftPic).join('');
  const front = DRIFT.filter((d) => d.layer === 'front').map(driftPic).join('');
  return `
  <section class="pic-drift" data-pictures="drift" data-tone="paper" data-sheets="park" aria-labelledby="pic-drift-type">
    <div class="pic-drift__field">
      ${back}
      <h2 class="pic-drift__type" id="pic-drift-type"><span class="ln"><span class="ln__i" style="--d:0s">Magic</span></span> <span class="ln"><span class="ln__i" style="--d:0.09s">realism</span></span></h2>
      ${front}
    </div>
    <p class="pic-drift__credit eyebrow">Paintings: Luis Medina · Design: Vanessa Espín</p>
  </section>`;
}

/* ---------- hooks ---------- */
export function picturesHTML(p, i, vis = {}) {
  // a program with an entry in chapters-content.js, and its lab switch set if it names one, gets the chapters
  const chap = chaptersFor(p.slug, vis);
  if (chap) return chaptersHTML(chap);
  if (p.slug === 'iyuana' && vis.held === 'wall') return wallHTML(matchMedia('(pointer: coarse)').matches);
  if (p.slug === 'iyuana' && vis.held === 'cut') return heldHTML();
  if (p.slug === 'herencia-viva' && vis.drift === 'long') return longHTML();
  if (p.slug === 'herencia-viva' && vis.drift === 'band') return driftHTML();
  return '';
}

// what is on screen now: { kind: 'chapters' | 'wall' | 'long' | 'held' | 'drift', ... }, or null
let cur = null;

export function picturesEnter(root, p, i, ctx) {
  cur = null;
  if (root.querySelector('.pic-chapters')) { cur = { kind: 'chapters', root, chapters: chaptersEnter(root, ctx, chaptersFor(p.slug, ctx.vis)) }; return; }
  if (root.querySelector('.pic-wall')) { cur = { kind: 'wall', root, wall: wallEnter(root) }; return; }
  if (root.querySelector('.pic-long')) { cur = { kind: 'long', root, long: longEnter(root) }; return; }
  const held = root.querySelector('.pic-held');
  if (held) {
    const layer = root.querySelector('.pic-held__layer');
    cur = { kind: 'held', root, sec: held, layer, dark: layer.querySelector('.pic-held__dark'), shot: layer.querySelector('.pic-held__shot'), img: layer.querySelector('img'), park: layer.querySelector('.pic-held__park'), h: 0, on: false };
    return;
  }
  const drift = root.querySelector('.pic-drift');
  if (drift) {
    cur = { kind: 'drift', root, sec: drift, type: drift.querySelector('.pic-drift__type'), pics: [...drift.querySelectorAll('.pic-drift__pic')].map((el) => ({ el, rate: +el.dataset.rate, dy: NaN })), shown: false };
  }
}

export function picturesFrame(ctx) {
  if (!cur || cur.root !== ctx.root) return;
  if (cur.kind === 'chapters') chaptersFrame(cur.chapters, ctx);
  else if (cur.kind === 'wall') wallFrame(cur.wall, ctx);
  else if (cur.kind === 'long') longFrame(cur.long, ctx);
  else if (cur.kind === 'held') heldFrame(ctx);
  else driftFrame(ctx);
}

export function picturesLeave() {
  if (cur && cur.kind === 'chapters') chaptersLeave(cur.chapters);
  if (cur && cur.kind === 'wall') { wallLeave(cur.wall); wallKeyOff(cur.wall); }
  // the old page stays on screen for about 0.4 s while it slides out: the fixed picture goes at once
  if (cur && cur.kind === 'held') {
    cur.layer.hidden = true;
    const stage = cur.root.querySelector('.p-docs__stage');
    if (stage) stage.classList.remove('is-held', 'is-cutting');
  }
  cur = null;
}

/* The held light, every frame. y is how far the section's top has scrolled above the top of the screen:
     y < 0             the picture scrolls in with the section (it fills the screen from the section's top down);
     0 .. hold         held full-bleed, scaling 1.00 to 1.04;
     hold .. hold+cut  the match cut: from the screen to the first documentation frame, wherever it is now;
     past that         the layer hides and the frame's own picture shows.
   The section is sized so the cut lands with the documentation frame centred on the screen. */
function heldFrame(ctx) {
  const c = cur, { vh, vw, reduced } = ctx;
  const r = c.sec.getBoundingClientRect();
  // load the big picture a little before it is needed
  if (c.img.dataset.src && r.top < vh * 3) { c.img.src = c.img.dataset.src; delete c.img.dataset.src; }
  const stage = c.root.querySelector('.p-docs__stage');
  const fr = stage ? stage.getBoundingClientRect() : null;
  // on a touch screen the height changes as the address bar slides away: the page's length must not follow it
  const base = ctx.coarse && c.baseW === vw ? c.base : vh;
  c.base = base; c.baseW = vw;
  const hold = HOLD * base;
  const travel = reduced || !fr ? 0 : TRAVEL * base;
  // the section's height: under reduced motion (or without a frame to land in) a plain hold, then it scrolls away
  let H = hold + base, land = 0;
  if (travel) {
    const D = fr.top - r.bottom; // from the section's foot to the frame's top: fixed by the layout below
    land = Math.max(base * 0.08, (base - fr.height) / 2);
    H = Math.max(base * 0.5, hold + travel + land - D);
  }
  if (Math.abs(H - c.h) > 0.5) { c.h = H; c.sec.style.height = `${H.toFixed(1)}px`; }
  const y = -r.top;
  const done = travel ? y >= hold + travel : y >= hold + base;
  const show = r.top < vh && !done;
  if (show !== c.on) { c.on = show; c.layer.hidden = !show; }
  // the picture only ever matches frame 01: a tool left on another frame goes back to it, under the layer
  if (stage && show && travel > 0 && stage.dataset.i !== '0') ctx.resetDocs(stage);
  // the first frame's own picture waits under the travelling one until it lands, and the tool takes no wheel
  // or click until then: the wheel over it still has to scroll the page to the landing
  if (stage) {
    stage.classList.toggle('is-held', show && travel > 0 && stage.dataset.i === '0');
    stage.classList.toggle('is-cutting', show && travel > 0);
  }
  if (!show) return;
  let x = 0, top = 0, w = vw, h = vh, s = 1, dark = 0;
  if (y < 0) top = -y; // scrolling in
  else if (y <= hold) { s = reduced ? 1 : 1 + SCALE * (y / hold); dark = 1; } // the hold
  else if (!travel) top = -(y - hold); // reduced motion: it scrolls away
  else {
    const t = clamp01((y - hold) / travel), e = E_CUT(t);
    // it aims for where the frame lands and the page rises to meet it, so it never dips towards a frame that is
    // still below the screen. The section is sized so that place is land; if H sits at its minimum, the frame
    // lands elsewhere and the last 5% makes up the difference, so the handover stays exact
    const landed = fr.top - (hold + travel - y), u = clamp01((t - 0.95) / 0.05);
    x = mix(0, fr.left, e); top = mix(0, mix(land, landed, u * u * (3 - 2 * u)), e); w = mix(vw, fr.width, e); h = mix(vh, fr.height, e);
    s = 1 + SCALE * (1 - e);
    dark = 1 - clamp01((t - 0.75) / 0.25); // the night lets go as it lands
  }
  c.shot.style.transform = `translate3d(${x.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
  c.shot.style.width = `${w.toFixed(1)}px`;
  c.shot.style.height = `${h.toFixed(1)}px`;
  c.img.style.transform = s === 1 ? '' : `scale(${s.toFixed(4)})`;
  c.dark.style.opacity = dark.toFixed(3);
  // the park sentinel covers what the picture (and the night around it) covers
  c.park.style.transform = `translate3d(0, ${y < 0 ? top.toFixed(1) : 0}px, 0)`;
}

/* The drift band, every frame. A picture of rate r sits at its place when the band's centre crosses the middle
   of the screen and is offset by (r - 1) x (that distance) otherwise, so it moves at r times the page. */
function driftFrame(ctx) {
  const c = cur, { vh, reduced } = ctx;
  const r = c.sec.getBoundingClientRect();
  if (r.bottom < -vh || r.top > vh * 2) return;
  const d = reduced ? 0 : r.top + r.height / 2 - vh / 2;
  for (const p of c.pics) {
    const dy = Math.round((p.rate - 1) * d * 10) / 10;
    if (dy !== p.dy) { p.dy = dy; p.el.style.transform = dy ? `translate3d(0, ${dy}px, 0)` : ''; }
  }
  // the line rises once the band is on its own ground (its off-tone fade is over) and in view
  if (!c.shown && !c.sec.classList.contains('is-offtone') && c.type.getBoundingClientRect().top < vh * 0.85) {
    c.shown = true;
    c.type.classList.remove('is-out');
    void c.type.offsetWidth;
    c.type.classList.add('is-in');
  }
}
