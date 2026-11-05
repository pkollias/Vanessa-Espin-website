/* The chapters: a run of full-screen scenes between the story and the text, on Daddy Yankee's logic, where each kind of
   thing gets its own treatment and every screen has one loud thing on it. This file is the engine and holds no content:
   the words, pictures and grounds come in as data from chapters-content.js, one entry per program.

   How it is built. The page keeps one tall, transparent spacer (.pic-chapters), one .ch per chapter, which gives the
   scroll its length and holds what a screen reader gets. What you see lives in two layers:
     - .ch-stage, in paper.under, below the WebGL canvas: the grounds, the type, and the pictures that are clipped or fill
       the screen, which are plain flush images;
     - sheets of the posters' paper in the WebGL scene, above it: every object that floats over the type.
   So a sheet always passes in front of the type. Everything is flat: no tilt, no rotation, no curl or bend on any picture.
   A sheet's paper shows in its grain and its soft cast shadow, as on the home posters. Each scene behaves as a sticky pin:
   it comes up with the page, holds for its pin in screens, and leaves with the page, or, with stay, holds on while the
   next ground comes up over it. A recipe's frame() is a pure function of t, the scroll past the pin's start, in screens, so
   when the scroll stops the move stops. Only the words in masks have a tail: dy-headlines' scrub lag of 0.8 s.

   Grounds arrive through edge.js (lab switch edge: bubble, flat or fade). A full-bleed picture always leaves on a flat line.

   Numbers from study/evidence: dy-pushin (s = 0.07^((1-p)^2.4) over 1280 px at 900, centre 0.94 to 0.5 of the height),
   dy-zoomout (the shutters: a rect between the full screen and the card, the name scaled with it, here played in reverse),
   dy-headlines (one line-height of travel inside a mask, power3.out, cascade by position, lag 0.8 s), dy-drift (object
   speeds 1.23 and 1.88 times the page); obys-collapse (the AIM row, its slide right, the column that changes from below).

   Hooks (pictures.js): chaptersHTML(cfg), chaptersEnter(root, ctx, cfg), chaptersFrame(c, ctx), chaptersLeave(c).
   With reduced motion a recipe's still() replaces all of this: plain still compositions in the page's flow, no sheets. */

import { edgeHTML, edgeEnter, edgeDraw, edgeLeave } from './edge.js';

/* ---------- curves ---------- */
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
const seg = (v, a, b) => clamp01((v - a) / (b - a));
const MAIN = bez(0.625, 0.05, 0, 1), PUNCHY = bez(0.32, 0.72, 0, 1);
const sine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const iy = (t) => 0.5 * MAIN(t) + 0.5 * sine(t); // Daddy Yankee's scrubbed ease: half bezier, half sine
const p3 = (t) => 1 - (1 - t) ** 3; // power3.out
const LAG = 6; // the words' tail: 1 - exp(-6 dt) is about 0.8 s to settle, like scrub 0.8
const push = (p) => (0.07 ** ((1 - p) ** 2.4) - 0.07) / 0.93; // dy-pushin, 0 to 1
const PUSH = 1.42; // its length in screens: 1280 px at 900

/* ---------- small DOM parts ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// one word in its own mask: .ch-m clips it, .ch-m__i is what moves
const mask = (text, cls = '') => `<span class="ch-m ${cls}"><span class="ch-m__i">${esc(text)}</span></span>`;
const src = (cfg, p) => cfg.base + p.f;
// a picture on the stage: it loads when the page nears it (see the engine's todo)
const stageImg = (cfg, p, cls) => `<img class="${cls}" data-src="${src(cfg, p)}" alt="" width="${p.w}" height="${p.h}" decoding="async">`;
const groundHTML = (ch, cfg) => `<i class="ch-ground">${ch.edge ? edgeHTML(cfg.edge || 'flat', `var(--${ch.tone})`, ch.edge) : ''}</i>`;
// a caption that isn't known yet: the visible text and what it needs travel together
const capHTML = (p) => (p.ph ? `<span class="ph" title="${esc(p.ph)}">${esc(p.cap)}</span>` : esc(p.cap));
const stillImg = (cfg, p, cls = '') => `<img class="${cls}" src="${src(cfg, p)}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}" style="max-width:${Math.round(p.w * 1.2)}px">`;
const posStyle = (p) => (p.pos ? `object-position:${p.pos[0] * 100}% ${p.pos[1] * 100}%` : '');
const stillFig = (cfg, p) => `<figure>${stillImg(cfg, p)}<figcaption>${capHTML(p)}<span>${esc(p.by)}</span></figcaption></figure>`;

/* ---------- measuring ---------- */
// the width of a nowrap element per px of font size
function emOf(el) {
  const keep = el.style.fontSize;
  el.style.fontSize = '200px';
  const w = el.offsetWidth / 200;
  el.style.fontSize = keep;
  return w || 1;
}
const px = (v) => `${v.toFixed(2)}px`;
// A phone's screen is the desktop's turned on its side, so a word stack turns with it and reads up the screen: fitted across a
// narrow screen the same words would be a third of the size. Returns the box the stack fills, in its own axes.
function turnStack(el, vw, vh, phone, topGap, footGap) {
  if (!phone) { el.style.width = ''; el.style.height = ''; el.style.transform = ''; return null; }
  const W = vh - topGap - footGap;
  el.style.width = px(W); el.style.height = px(vw);
  el.style.transformOrigin = '0 0';
  el.style.transform = `translate3d(0, ${(vh - footGap).toFixed(1)}px, 0) rotate(-90deg)`;
  return { W, H: vw };
}
const moved = (el, x, y, s = 1) => { el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)${s === 1 ? '' : ` scale(${s.toFixed(4)})`}`; };
// a word's rise: e 0 is below its mask, 1 in place, 2 gone above it. The mask is a little taller than the line, for the
// glyphs' overhang, so the travel is 118% of a line. The tail lives in m.cur.
function maskTo(m, e, ctx, lag = true) {
  m.cur = lag && Number.isFinite(m.cur) ? m.cur + (e - m.cur) * (1 - Math.exp(-LAG * ctx.dt)) : e;
  if (Math.abs(m.cur - e) < 0.0015) m.cur = e;
  const y = Math.round((1 - m.cur) * 1180) / 10;
  if (y !== m.y) { m.y = y; m.i.style.transform = `translate3d(0, ${y}%, 0)`; }
}
const masks = (root) => [...root.querySelectorAll('.ch-m__i')].map((i) => ({ i, m: i.parentElement, cur: NaN, y: NaN }));
// the most of a picture that fits a box, never above 1.2 times its own size
const fitIn = (p, w, h) => { const k = Math.min(w / p.w, h / p.h, 1.2); return { w: p.w * k, h: p.h * k }; };

/* ---------- paper ---------- */
// The front of a sheet: the picture in the file's own shape (or p.crop, [x, y, w, h] as fractions of the file), on a mount if
// asked, with its label printed on the foot. mount and foot are fractions of the picture's width; rule is a frame in that
// colour, ruleF of the width thick; res is canvas px per picture px.
const sized = (p, { mount = 0, foot = 0 }) => ({ w: p.w * (1 + 2 * mount), h: p.h + p.w * (2 * mount + foot) });
function printCanvas(paper, img, p, { mount = 0, foot = 0, rule = '', ruleF = 0.014, ground = '#f6f3ec', res = 1 }) {
  const iw = p.w * res, ih = p.h * res, m = Math.round(iw * mount), f = Math.round(iw * foot);
  const W = iw + 2 * m, H = ih + 2 * m + f;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = ground; g.fillRect(0, 0, W, H);
  if (m || f) paper.paperFibres(g, W, H, 6);
  g.imageSmoothingQuality = 'high';
  if (p.crop) {
    const [x, y, w, h] = p.crop, nw = img.naturalWidth, nh = img.naturalHeight;
    g.save();
    if (p.turn) { g.translate(W, m * 2 + ih); g.rotate(Math.PI); }
    g.drawImage(img, x * nw, y * nh, w * nw, h * nh, m, m, iw, ih);
    g.restore();
  } else g.drawImage(img, m, m, iw, ih);
  if (rule) { const r = Math.round(W * ruleF); g.strokeStyle = rule; g.lineWidth = r; g.strokeRect(r / 2, r / 2, W - r, H - r); }
  if (f) {
    const size = f * 0.34, y = m + ih + f * 0.2 + size;
    g.fillStyle = '#1d1a17'; g.textBaseline = 'alphabetic';
    g.font = `500 ${size}px Switzer, 'Helvetica Neue', Arial, sans-serif`;
    g.fillText(p.cap, m, y);
    g.textAlign = 'right'; g.fillStyle = 'rgb(29 26 23 / 0.62)';
    g.fillText(p.by, W - m, y);
  }
  return cv;
}
// a sheet that fills in when its picture has loaded; until then s.sheet is null and pose() does nothing
const SHADE = { o: 0.46, x: 0.012, y: -0.018, z: -0.02, blur: 0.06 };
function makePrint(c, picture, opts = {}) {
  const z = sized(picture, opts), s = { sheet: null, aspect: z.w / z.h, max: z.h * 1.2 };
  // built only as the page nears them, one per frame: drawing a sheet's fibres takes a frame's worth of time
  c.todo.push(() => Promise.all([c.paper.loadImage(src(c.cfg, picture)), document.fonts?.load('500 24px Switzer').catch(() => {})]).then(([img]) => {
    if (c.dead) return;
    const cv = printCanvas(c.paper, img, picture, opts);
    s.sheet = c.paper.makeSheet({ front: c.paper.texFromCanvas(cv), aspect: cv.width / cv.height, seg: [2, 2] });
    s.sheet.shade(opts.shade || SHADE);
    c.sheets.push(s.sheet);
  }).catch(() => {}));
  return s;
}
const pose = (s, ctx, p) => {
  if (!s.sheet) return;
  s.sheet.place(p);
  s.sheet.flex({ bend: 0, curl: 0, wave: 0, lift: 0, t: ctx.now * 0.001 });
};
const hide = (s) => { if (s.sheet) s.sheet.group.visible = false; };

/* ---------- the recipes ---------- */
/* A recipe: pin(ch) in screens; stay, screens more that the scene holds while the next ground comes up over it (ch.stay wins:
   nothing on a sheet may be left on screen by then, since sheets sit above every ground); sr(ch) what a screen reader
   gets; scene(ch, cfg) the stage's DOM; setup(s, c) after the DOM is in place; layout(s, ctx) on a new size; frame(s, t, off,
   ctx), t in screens past the pin's start, off the scene's offset in px; idle(s) when it is off screen; marks(ch) later
   changes of the page's tone, as [t, tone]; still(ch, cfg) the reduced-motion version. */

/* A picture fills the screen and holds, with no type and only a slow push, until the next ground comes up over it. */
const bleed = {
  pin: (ch) => ch.hold ?? 0.35,
  stay: 1,
  sr: (ch) => `<p class="vh">${esc(ch.pic.alt)}, ${esc(ch.pic.by)}</p>`,
  scene: (ch, cfg) => `<i class="ch-ground"></i>${stageImg(cfg, ch.pic, 'ch-bleed')}`,
  setup(s) { s.img = s.el.querySelector('.ch-bleed'); },
  layout(s, { vw }) {
    const [x, y] = (vw < 760 && s.ch.pic.posM) || s.ch.pic.pos || [0.5, 0.5];
    s.img.style.objectPosition = `${x * 100}% ${y * 100}%`;
    s.img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
  },
  frame(s, t) {
    const end = s.rec.pin(s.ch) + (s.ch.stay ?? s.rec.stay);
    s.img.style.transform = `scale(${((s.ch.pic.zoom ?? 1) * (1 + 0.07 * seg(t, -1, end))).toFixed(4)})`;
  },
  idle() {},
  still: (ch, cfg) => `<img class="ch-still__bleed" src="${src(cfg, ch.pic)}" alt="${esc(ch.pic.alt)}" width="${ch.pic.w}" height="${ch.pic.h}" style="${posStyle(ch.pic)}">`,
};

/* Words travel (dy-user tiles 2 to 8): each giant word comes up the middle of the screen with the ground and then, at its own
   moment, slides to one side, while framed pictures with a thick rule drift past off the text grid, at their own speeds. On a
   phone the stack turns, as a tall screen is a wide one on its side, and the words cross it inside their masks. */
const travel = {
  pin: (ch) => ch.hold ?? 1.05,
  stay: 1,
  sr: (ch) => `<h2 class="vh">${ch.words.map((w) => esc(w.text)).join(' ')}</h2><p class="vh">${ch.frames.map((f) => esc(f.pic.alt)).join('; ')}. ${esc(ch.credit)}</p>`,
  scene: (ch, cfg) => `${groundHTML(ch, cfg)}<div class="ch-stack">${ch.words.map((w) => mask(w.text)).join('')}</div>`,
  setup(s, c) {
    s.stack = s.el.querySelector('.ch-stack');
    s.words = masks(s.stack);
    s.frames = s.ch.frames.map((f) => ({ f, s: makePrint(c, f.pic, { rule: s.ch.rule, ruleF: f.ruleF ?? 0.016 }) }));
  },
  layout(s, { vw, vh }) {
    const phone = vw < 760;
    s.phone = phone;
    const turned = turnStack(s.stack, vw, vh, phone, 24, 76);
    if (phone) {
      const W = turned.W, fits = s.words.map((w) => W / emOf(w.i)), lh = 0.8;
      const sum = fits.reduce((a, f) => a + f * lh, 0), room = vw - 20, k = Math.min(1, room / sum);
      const lead = Math.max(0, (room - sum * k) / (s.words.length - 1 || 1));
      let y = 10;
      s.words.forEach((w, i) => {
        w.m.style.fontSize = px(fits[i] * k); w.m.style.top = px(y); w.m.style.left = '0'; w.m.style.transform = '';
        w.shown = false; // the phone moves the masks, so the desktop has to set them again
        y += fits[i] * k * lh + Math.min(lead, 18);
      });
      return;
    }
    let y = vh * s.ch.first;
    s.words.forEach((w, i) => {
      const word = s.ch.words[i], f = (vw * word.fit) / emOf(w.i), wide = f * emOf(w.i);
      w.m.style.fontSize = px(f); w.m.style.top = '0'; w.m.style.left = '0';
      w.y0 = y; w.w = wide; w.h = f * 0.82;
      w.x0 = (vw - wide) / 2;
      // where it ends up: flush to its side, a little past the edge
      w.x1 = word.go > 0 ? vw - wide + vw * 0.012 : word.go < 0 ? -vw * 0.012 : w.x0;
      y += w.h + vh * s.ch.lead;
    });
  },
  frame(s, t, off, ctx) {
    const { vw, vh } = ctx;
    if (s.phone) {
      s.words.forEach((w, i) => {
        const inn = p3(seg(t, -0.7 + i * 0.2, 0.05 + i * 0.2)), out = iy(seg(t, 1.3 + i * 0.16, 1.9 + i * 0.16));
        maskTo(w, inn + out, ctx);
      });
    } else {
      const rate = s.ch.rate ?? 0.85, up = Math.max(0, t) * rate * vh;
      s.words.forEach((w) => {
        const y = w.y0 - up;
        // it slides as it crosses the screen, at its own moment: from when its centre passes 66% of the height to 24%
        const e = iy(seg(vh * 0.66 - (y + w.h / 2), 0, vh * 0.42));
        moved(w.m, mix(w.x0, w.x1, e), y);
        if (!w.shown) { w.shown = true; maskTo(w, 1, ctx, false); }
      });
    }
    s.frames.forEach(({ f, s: sh }) => {
      const m = s.phone ? f.m : f, H = Math.min(vh * m.h, sh.max);
      const y = vh * m.y - Math.max(0, t) * f.rate * vh + off;
      if (y < -H || y > vh + H) { hide(sh); return; }
      pose(sh, ctx, { x: vw * m.x, y, h: H, z: 0.03 });
    });
  },
  idle(s) { s.frames.forEach(({ s: sh }) => hide(sh)); },
  still: (ch, cfg) => `<div class="ch-still__stack">${ch.words.map((w) => `<span data-fit="96">${esc(w.text)}</span>`).join('')}</div><div class="ch-still__row">${ch.frames.map((f) => `<figure class="ch-still__crop" style="--ar:${(f.pic.w / f.pic.h).toFixed(4)};--rule:${ch.rule}"><img src="${src(cfg, f.pic)}" alt="${esc(f.pic.alt)}" style="${f.pic.crop ? cropStyle(f.pic) : ''}"></figure>`).join('')}</div>`,
};
// a CSS crop for the still version: the file drawn large inside a frame that shows only p.crop
const cropStyle = (p) => { const [x, y, w, h] = p.crop; return `position:absolute;left:${(-x / w * 100).toFixed(2)}%;top:${(-y / h * 100).toFixed(2)}%;width:${(100 / w).toFixed(2)}%;height:${(100 / h).toFixed(2)}%;max-width:none`; };

/* His paintings, then her. Three paintings rise edge to edge, each a small step lower than the last (AIM's opening). The row
   slides off to the right and, like a panel pulled away, uncovers a light ground: a line of words in masks on the left and
   one photograph standing at the right edge, unframed. */
const AIM = { rise: [-0.86, 0.16], slide: [0.62, 1.55], words: 1.15, hold: 2.3 };
const aim = {
  pin: () => AIM.hold,
  stay: 1,
  marks: (ch) => [[AIM.slide[0] + 0.5, ch.light]],
  sr: (ch) => `<p class="vh">${ch.pics.map((p) => esc(p.alt)).join('; ')}. ${esc(ch.credit)}</p><h2 class="vh">${ch.words.map(esc).join(' ')}</h2><p class="vh">${esc(ch.by)}. ${esc(ch.side.alt)}</p>`,
  scene: (ch, cfg) => `${groundHTML(ch, cfg)}<i class="ch-light" style="background:var(--${ch.light})"></i>
    <div class="ch-aim" style="color:${ch.lightInk}">
      <div class="ch-aim__words">${ch.words.map((w) => mask(w)).join('')}</div>
      <div class="ch-aim__meta">${mask(ch.by)}${mask(ch.side.cap)}</div>
    </div>
    <div class="ch-col">${stageImg(cfg, ch.side, 'ch-side')}</div>
    ${ch.pics.map((p) => `<figure class="ch-tile">${stageImg(cfg, p, 'ch-tile__img')}</figure>`).join('')}
    <p class="ch-rowcap" style="color:${ch.ink}">${esc(ch.credit)}</p>`,
  setup(s) {
    s.tiles = [...s.el.querySelectorAll('.ch-tile')].map((el) => ({ el, img: el.querySelector('img') }));
    s.col = s.el.querySelector('.ch-col');
    s.sideImg = s.el.querySelector('.ch-side');
    s.light = s.el.querySelector('.ch-light');
    s.box = s.el.querySelector('.ch-aim');
    s.type = masks(s.el.querySelector('.ch-aim__words'));
    s.meta = masks(s.el.querySelector('.ch-aim__meta'));
    s.rowcap = s.el.querySelector('.ch-rowcap');
  },
  layout(s, { vw, vh }) {
    const phone = vw < 760, mg = Math.max(16, vw * 0.018), P = s.ch.pics;
    // the row: every picture a little larger or smaller by its .row, standing on the foot, so the tops step down.
    // On a phone the first two share a row above the last, which keeps them large
    const place = (idx, foot) => {
      const sum = idx.reduce((a, i) => a + (P[i].w / P[i].h) * P[i].row, 0);
      const H = Math.min(vw / sum, (vh - 64) / Math.max(...idx.map((i) => P[i].row)));
      let x = (vw - sum * H) / 2;
      return idx.map((i) => {
        const h = H * P[i].row, w = (P[i].w / P[i].h) * h, r = { i, x, y: foot - h, w, h };
        x += w;
        return r;
      });
    };
    const rects = [];
    if (phone) {
      const low = place([P.length - 1], vh), top = Math.min(...low.map((r) => r.y));
      rects.push(...place(P.slice(0, -1).map((_, i) => i), top), ...low);
    } else rects.push(...place(P.map((_, i) => i), vh));
    const col = phone ? { x: 0, y: Math.round(vh * 0.47), w: vw, h: vh - Math.round(vh * 0.47) } : { x: Math.round(vw * 0.57), y: 0, w: vw - Math.round(vw * 0.57), h: vh };
    s.rects = rects; s.colR = col;
    s.shift = vw + 8 - Math.min(...rects.map((r) => r.x));
    s.tiles.forEach((tl, i) => {
      const r = rects[i];
      tl.el.style.width = px(r.w + 1); tl.el.style.height = px(r.h);
      tl.img.style.width = '100%'; tl.img.style.height = '100%';
    });
    moved(s.col, col.x, col.y);
    s.col.style.width = px(col.w); s.col.style.height = px(col.h);
    const [fx, fy] = (phone && s.ch.side.posM) || s.ch.side.pos || [0.5, 0.5];
    s.sideImg.style.objectPosition = `${fx * 100}% ${fy * 100}%`;
    // the type: each line as wide as the free side, the block centred in what the caption leaves
    const L = phone ? vw - 2 * mg : col.x - 2 * mg, top = phone ? 66 : 62;
    const fits = s.type.map((w) => L / emOf(w.i));
    const lead = phone ? 4 : vh * 0.012, sum = fits.reduce((a, f) => a + f * 0.82, 0) + lead * (fits.length - 1);
    const room = phone ? col.y - top - 56 : vh * 0.78, k = Math.min(1, room / sum);
    let y = phone ? top : Math.max(top, (vh * 0.92 - sum * k) / 2);
    s.type.forEach((w, i) => {
      const f = fits[i] * k;
      w.m.style.fontSize = px(f); w.m.style.left = px(mg); w.m.style.top = px(y);
      y += f * 0.82 + lead;
    });
    const meta = s.el.querySelector('.ch-aim__meta');
    meta.style.left = px(mg); meta.style.width = px(L);
    meta.style.top = phone ? px(y + 4) : ''; meta.style.bottom = phone ? '' : px(Math.max(18, vh * 0.03));
    s.mg = mg;
    s.phone = phone;
  },
  frame(s, t, off, ctx) {
    const { vw, vh } = ctx, col = s.colR;
    const slide = iy(seg(t, AIM.slide[0], AIM.slide[1]));
    let lift = 0;
    s.tiles.forEach((tl, i) => {
      const r = s.rects[i];
      // the rise: unevenly, the first ones ahead, each stopping at its own place; off keeps it on the screen's own axis
      const e = seg(t, AIM.rise[0] + (s.phone ? 0.1 : 0.05) * i, AIM.rise[1] + 0.09 * i), up = 1 - (1 - e) ** 1.7;
      const dy = (1 - up) * (vh - r.y + 24);
      if (!i) lift = dy;
      moved(tl.el, r.x + slide * s.shift, r.y + dy - off);
      tl.el.hidden = slide >= 1;
    });
    // the row's credit rides on the first picture
    const first = s.rects[0];
    moved(s.rowcap, first.x + slide * s.shift + s.mg, first.y + lift - off - 30);
    s.rowcap.hidden = slide >= 1;
    // the light follows the row's left edge, and the photograph shows only where the light has reached
    const edge = slide * (vw + 8);
    moved(s.light, Math.min(0, edge - vw), 0);
    const shown = clamp01((edge - col.x) / col.w);
    s.col.style.clipPath = `inset(0 ${((1 - shown) * 100).toFixed(2)}% 0 0)`;
    s.sideImg.style.transform = `scale(${(1.07 - 0.07 * slide).toFixed(4)})`;
    s.box.hidden = t < AIM.words - 0.3;
    if (!s.box.hidden) {
      s.type.forEach((w, i) => maskTo(w, p3(seg(t, AIM.words + i * 0.1, AIM.words + 0.55 + i * 0.1)), ctx));
      s.meta.forEach((w, i) => maskTo(w, p3(seg(t, AIM.words + 0.3 + i * 0.05, AIM.words + 0.7 + i * 0.05)), ctx));
    }
  },
  idle() {},
  still: (ch, cfg) => `<div class="ch-still__row">${ch.pics.map((p) => stillFig(cfg, p)).join('')}</div><div class="ch-still__stack">${ch.words.map((w) => `<span data-fit="96">${esc(w)}</span>`).join('')}</div><div class="ch-still__row">${stillFig(cfg, { ...ch.side, by: ch.by })}</div>`,
};

/* A speck near the foot of the screen grows through the words until it fills the height (dy-pushin), lifts off them, and the
   printed objects pop in over the type, each pausing at the middle of its crossing (dy-drift's speeds). */
const pushin = {
  pin: (ch) => ch.hold ?? 4.75,
  stay: 1,
  sr: (ch) => `<h2 class="vh">${ch.lines.flat().map(esc).join(' ')}</h2><p class="vh">${[ch.hero, ...ch.objects.map((o) => o.pic)].map((p) => esc(p.alt)).join('; ')}. ${esc(ch.credit)}</p>`,
  scene: (ch, cfg) => `${groundHTML(ch, cfg)}<div class="ch-big">${ch.lines.map((l) => `<div class="ch-big__l">${l.map((w) => mask(w)).join(' ')}</div>`).join('')}</div><p class="ch-credit">${mask(ch.credit)}</p>`,
  setup(s, c) {
    s.big = s.el.querySelector('.ch-big');
    s.ls = [...s.el.querySelectorAll('.ch-big__l')];
    s.words = masks(s.big);
    s.credit = masks(s.el.querySelector('.ch-credit'))[0];
    s.hero = makePrint(c, s.ch.hero, { shade: { o: 0.5, x: 0.01, y: -0.016, z: -0.02, blur: 0.05 } });
    s.objs = s.ch.objects.map((o) => ({ o, s: makePrint(c, o.pic, { res: o.res ?? 2, mount: 0.02, foot: 0.062, ground: '#f8f6f1' }) }));
  },
  layout(s, { vw, vh }) {
    const phone = vw < 760, mg = Math.max(16, vw * 0.018), W = vw - 2 * mg;
    s.big.classList.toggle('is-phone', phone);
    // on a phone every word is its own line; on a screen the lines as written, each fitted to the width
    const rows = phone ? s.words.map((w) => [w.m]) : s.ls.map((l) => [...l.querySelectorAll('.ch-m')]);
    const fitted = rows.map((row) => {
      for (const m of row) m.style.fontSize = '200px';
      const space = 0.24 * (row.length - 1);
      const em = row.reduce((a, m) => a + m.offsetWidth / 200, 0) + space;
      return { row, f: W / em };
    });
    const lh = 0.8, sum = fitted.reduce((a, r) => a + r.f * lh, 0), room = vh - (phone ? 170 : 110);
    const k = Math.min(1, room / sum);
    const gapY = Math.max(0, (room - sum * k) / (fitted.length + 1));
    let y = (phone ? 84 : 60) + gapY;
    for (const r of fitted) {
      const f = r.f * k, line = r.row.reduce((a, m) => a + m.offsetWidth / 200 * f, 0) + 0.24 * f * (r.row.length - 1);
      let x = (vw - line) / 2;
      for (const m of r.row) {
        m.style.fontSize = px(f);
        m.style.left = px(x); m.style.top = px(y);
        x += m.offsetWidth + 0.24 * f;
      }
      y += f * lh + gapY;
    }
    s.phone = phone;
    s.heroMax = Math.min(vh, (vw * 0.96) / s.hero.aspect); // a phone's screen is narrower than the sheet is at full height
  },
  frame(s, t, off, ctx) {
    const { vw, vh } = ctx, pin = s.rec.pin(s.ch);
    // the words are up before the speck starts, so it pushes through them, never through an empty field
    s.words.forEach((w, i) => maskTo(w, p3(seg(t, -0.72 + i * 0.1, -0.16 + i * 0.1)), ctx));
    // the push-in, over 1280 px at 900: scale is exponential in scroll, a camera rather than a resize
    const p = seg(t, 0, PUSH), sc = 0.07 ** ((1 - p) ** 2.4), g = (sc - 0.07) / 0.93;
    const lift = iy(seg(t, PUSH + 0.22, PUSH + 1));
    pose(s.hero, ctx, { x: vw / 2, y: mix(vh * 0.94, vh * 0.5, g) - lift * vh * 1.25 + off, h: s.heroMax * sc, z: 0.04 });
    if (lift >= 1 || t < -0.02) hide(s.hero);
    s.objs.forEach(({ o, s: sh }, i) => {
      const m = s.phone ? o.m : o, H = Math.min(vh * m.h, sh.max), a = o.at, x = t - a;
      // a window of `pause` screens around the middle of the crossing in which it comes to rest, then goes on
      const u = seg(x, o.wait, o.wait + o.pause), travelled = x - 0.5 * o.pause * (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI));
      const y = vh + H * 0.6 - travelled * o.rate * vh;
      if (x < 0 || y < -H * 0.7) { hide(sh); return; }
      const pop = PUNCHY(seg(x, 0, 0.42));
      pose(sh, ctx, { x: vw * m.x, y: y + off, h: H * mix(0.74, 1, pop), z: 0.08 + i * 0.02 });
    });
    maskTo(s.credit, p3(seg(t, pin - 0.75, pin - 0.35)), ctx);
  },
  idle(s) { hide(s.hero); s.objs.forEach(({ s: sh }) => hide(sh)); },
  still: (ch, cfg) => `<div class="ch-still__hero"><img src="${src(cfg, ch.hero)}" alt="${esc(ch.hero.alt)}" width="${ch.hero.w}" height="${ch.hero.h}"></div><div class="ch-still__stack">${ch.lines.map((l) => `<span data-fit="96">${l.map(esc).join(' ')}</span>`).join('')}</div><div class="ch-still__row">${ch.objects.map((o) => stillFig(cfg, o.pic)).join('')}</div>`,
};

/* The event. No pin: spreads go by at the page's own speed, each a picture flush to the screen's edge beside giant lines, one
   filling its half of the screen. A framed insert drifts over the seam between them. One line gathers its letters from a wide
   spread (the Worldwide squeeze). */
const rooms = {
  pin: () => 0,
  flow: (ch) => ch.spreads.length + 0.2,
  sr: (ch) => `<h2 class="vh">${ch.spreads.map((s) => s.lines.map(esc).join(' ')).join(', ')}</h2><p class="vh">${ch.spaced ? `${esc(ch.spaced)}. ` : ''}${[...ch.spreads.map((s) => s.room), ...(ch.insert ? [ch.insert.pic] : [])].map((p) => esc(p.alt)).join('; ')}.</p>`,
  scene: (ch, cfg) => `${groundHTML(ch, cfg)}${ch.spreads.map((sp) => `<div class="ch-spread">${stageImg(cfg, sp.room, 'ch-room')}${sp.room.cap ? `<p class="ch-tag">${esc(sp.room.cap)}</p>` : ''}${sp.lines.map((l) => mask(l)).join('')}</div>`).join('')}${ch.spaced ? `<p class="ch-spaced">${[...ch.spaced].map((c) => `<span>${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('')}</p>` : ''}`,
  setup(s, c) {
    s.spreads = [...s.el.querySelectorAll('.ch-spread')].map((el, i) => ({ el, room: el.querySelector('.ch-room'), tag: el.querySelector('.ch-tag'), sp: s.ch.spreads[i], words: masks(el) }));
    s.spaced = s.el.querySelector('.ch-spaced');
    s.letters = s.spaced ? [...s.spaced.querySelectorAll('span')].map((el) => ({ el, x: 0, from: 0 })) : [];
    if (s.ch.insert) s.insert = makePrint(c, s.ch.insert.pic, { rule: s.ch.insert.rule, ruleF: 0.016, foot: 0.07, ground: '#f8f6f1' });
  },
  layout(s, { vw, vh }) {
    const phone = vw < 760, mg = Math.max(16, vw * 0.018);
    s.tops = [];
    s.phone = phone;
    s.spreads.forEach((p, i) => {
      const y0 = i * vh * (phone ? 1 : 1.04) + (p.sp.fill ? 0 : vh * 0.06);
      const nat = p.sp.room, a = nat.w / nat.h, fill = p.sp.fill && !phone;
      const w = fill ? vw * 0.5 : Math.min(nat.w * 1.2, vw * (phone ? 0.92 : 0.47)), h = fill ? vh : w / a;
      const right = p.sp.side === 'r';
      const colL = phone ? mg : right ? mg : w + mg * 1.6, colW = phone ? vw - 2 * mg : vw - w - mg * 2.6;
      p.room.style.width = px(w); p.room.style.height = px(h);
      p.room.style.left = right ? px(vw - w) : '0';
      p.room.style.objectPosition = nat.pos ? `${nat.pos[0] * 100}% ${nat.pos[1] * 100}%` : '';
      const sizes = p.words.map((m) => colW / emOf(m.i));
      const lh = 0.82, sum = sizes.reduce((a2, f) => a2 + f * lh, 0);
      const room = phone ? vh - h - 130 : vh * 0.74, k = Math.min(1, room / sum);
      const textH = sum * k;
      const textY = phone ? y0 + (i ? h + 16 : 0) + 30 : y0 + Math.max(0, (vh * 0.88 - textH) / 2);
      const roomTop = fill ? y0 : phone ? (i ? y0 + 30 : y0 + 30 + textH + 46) : y0 + (vh * 0.88 - h) / 2;
      p.room.style.top = px(roomTop);
      if (p.tag) { p.tag.style.left = right ? px(vw - w + 12) : '12px'; p.tag.style.top = px(roomTop + h - 12); }
      let y = textY;
      p.words.forEach((m, j) => {
        const f = sizes[j] * k;
        m.m.style.fontSize = px(f); m.m.style.top = px(y);
        m.m.style.left = px(right && !phone ? colL : phone ? mg : colL);
        m.top = y; y += f * lh;
      });
      s.tops.push(textY + textH);
    });
    if (s.spaced) {
      // the address sits under the first spread's lines, as a real line across their column. Its letters gather inside that
      // column, so none ever crosses a picture
      const p0 = s.spreads[0], colL = parseFloat(p0.words[0].m.style.left), colW = vw - mg - colL;
      const f = phone ? 15 : Math.max(18, vw * 0.0185);
      s.spaced.style.fontSize = px(f);
      s.spaced.style.left = px(colL); s.spaced.style.width = px(colW); s.spaced.style.height = px(f * 1.3);
      s.spaced.style.top = px(s.tops[0] + (phone ? 12 : 22));
      const widths = s.letters.map((l) => l.el.offsetWidth), sum = widths.reduce((a, b) => a + b, 0);
      const track = (colW - sum) / Math.max(1, s.letters.length - 1);
      let x = 0;
      s.letters.forEach((l, i) => {
        l.x = x; x += widths[i] + track;
        // it starts far wider than the column and gathers to the column's width
        l.from = colW / 2 + ((i + 0.5) / s.letters.length - 0.5) * colW * 2.4 - widths[i] / 2;
      });
      s.spacedTop = s.tops[0];
    }
  },
  frame(s, t, off, ctx) {
    const { vw, vh } = ctx;
    s.spreads.forEach((p) => p.words.forEach((m) => {
      // dy-headlines: the word starts up its mask when its line is at 92% of the screen, done by 62%
      maskTo(m, p3(seg(vh * 0.94 - (m.top + off), 0, vh * 0.34)), ctx);
    }));
    if (s.letters.length) {
      const e = iy(seg(vh * 1.02 - (s.spacedTop + off), 0, vh * 0.42));
      s.letters.forEach((l) => { l.el.style.transform = `translate3d(${mix(l.from, l.x, e).toFixed(1)}px, 0, 0)`; });
    }
    if (s.insert) {
      // at its place when the scene has risen by `at` screens, moving at its own rate against the page
      const o = s.ch.insert, m = s.phone ? o.m : o, H = Math.min(vh * m.h, s.insert.max);
      const y = vh * m.y + off + (o.rate - 1) * (off + vh * o.at);
      if (y < -H || y > vh + H) hide(s.insert);
      else pose(s.insert, ctx, { x: vw * m.x, y, h: H, z: 0.05 });
    }
  },
  idle(s) { if (s.insert) hide(s.insert); },
  still: (ch, cfg) => ch.spreads.map((sp) => `<div class="ch-still__spread ch-still__spread--${sp.side}"><img src="${src(cfg, sp.room)}" alt="${esc(sp.room.alt)}" width="${sp.room.w}" height="${sp.room.h}"><div class="ch-still__col">${sp.lines.map((l) => `<span data-fit="46">${esc(l)}</span>`).join('')}</div></div>`).join('') + `${ch.spaced ? `<p class="ch-still__spaced">${esc(ch.spaced)}</p>` : ''}${ch.insert ? `<div class="ch-still__row">${stillFig(cfg, ch.insert.pic)}</div>` : ''}`,
};

/* The close, Daddy Yankee's opening in reverse (dy-zoomout's shutters on dy-pushin's curve). Two words with a card between
   them: the card is a window onto a photograph that already fills the screen behind it. The window opens until it is the
   screen, the words scale up and go off past the edges, and it holds, full-bleed, with a small caption, until the page's
   next section covers it on a flat line. */
const closer = {
  pin: (ch) => ch.hold ?? 2.55,
  stay: 1,
  sr: (ch) => `<h2 class="vh">${ch.lines.map(esc).join(' ')}</h2><p class="vh">${esc(ch.pic.alt)}, ${esc(ch.pic.by)}</p>`,
  scene: (ch, cfg) => `${groundHTML(ch, cfg)}<div class="ch-cw">${mask(ch.lines[0])}</div><div class="ch-cw">${mask(ch.lines[1])}</div>
    <div class="ch-card">${stageImg(cfg, ch.pic, 'ch-card__img')}</div><p class="ch-cap">${`<span class="ch-m"><span class="ch-m__i">${capHTML(ch.pic)}<span>${esc(ch.pic.by)}</span></span></span>`}</p>`,
  setup(s) {
    s.cw = [...s.el.querySelectorAll('.ch-cw')];
    s.words = s.cw.map((el) => masks(el)[0]);
    s.card = s.el.querySelector('.ch-card');
    s.img = s.card.querySelector('img');
    s.cap = masks(s.el.querySelector('.ch-cap'))[0];
  },
  layout(s, { vw, vh }) {
    const phone = vw < 760, mg = Math.max(16, vw * 0.018), W = vw - 2 * mg, top = phone ? 72 : 60, foot = phone ? 92 : 20;
    const gap = phone ? 10 : vh * 0.022, ems = s.words.map((w) => emOf(w.i)), lh = 0.82;
    // on a phone each word is as wide as the screen; on a screen both are one size, the longer as wide as the screen
    const fw = phone ? ems.map((e) => W / e) : ems.map(() => W / Math.max(...ems));
    const cardMin = vh * (phone ? 0.34 : 0.3), k = Math.min(1, (vh - top - foot - cardMin - 2 * gap) / (lh * (fw[0] + fw[1])));
    const f = fw.map((v) => v * k), h = f.map((v) => v * lh);
    const cardH = vh - top - foot - h[0] - h[1] - 2 * gap, cardW = phone ? W : Math.min(W, Math.max(cardH * 1.9, ems[0] * f[0]));
    s.gap = gap; s.hW = h;
    s.rest = { x: (vw - cardW) / 2, y: top + h[0] + gap, w: cardW, h: cardH };
    s.cw.forEach((el, i) => {
      el.style.fontSize = px(f[i]); el.style.width = px(ems[i] * f[i]); el.style.height = px(h[i]);
      el.style.transformOrigin = i ? '50% 0' : '50% 100%';
      s.words[i].m.style.position = 'relative';
    });
    s.wW = f.map((v, i) => ems[i] * v);
    // the photograph, as it will fill the screen, and as the card shows it
    const p = s.ch.pic, [fx, fy] = (phone && p.posM) || p.pos || [0.5, 0.5], sc = Math.max(vw / p.w, vh / p.h) * (p.zoom ?? 1);
    const Wf = p.w * sc, Hf = p.h * sc, s0 = Math.max(cardW / Wf, cardH / Hf);
    s.pic = { Wf, Hf, s0, fx, fy };
    s.img.style.width = px(Wf); s.img.style.height = px(Hf);
  },
  frame(s, t, off, ctx) {
    const { vw, vh } = ctx, R = s.rest, P = s.pic, pin = s.rec.pin(s.ch);
    s.words.forEach((w, i) => maskTo(w, p3(seg(t, -0.78 + i * 0.14, -0.2 + i * 0.14)), ctx));
    const open = iy(seg(t, -0.4, 0.22)); // the card opens in the gap between the words
    const g = push(seg(t, 0.62, 0.62 + PUSH)), ch = R.h * open;
    const x = mix(R.x, 0, g), w = mix(R.w, vw, g), h = mix(ch, vh, g), y = mix(R.y + (R.h - ch) / 2, 0, g);
    moved(s.card, x, y);
    s.card.style.width = px(w); s.card.style.height = px(h);
    s.card.style.visibility = h > 0.5 ? 'visible' : 'hidden';
    const sc = mix(P.s0, 1, g), ix = (w - P.Wf * sc) * P.fx, iyy = (h - P.Hf * sc) * P.fy;
    moved(s.img, ix, iyy, sc * (1 + 0.04 * seg(t, 0.62 + PUSH, pin + 1)));
    // the words stay on the card's edges and scale up with it, past the edges of the screen
    const z = 1 + 3.6 * g, a = mix(R.y, 0, g), b = mix(R.y + R.h, vh, g);
    moved(s.cw[0], (vw - s.wW[0]) / 2, a - s.gap * z - s.hW[0], z);
    moved(s.cw[1], (vw - s.wW[1]) / 2, b + s.gap * z, z);
    // once past the edges they go: scaled up, they reach far below the scene, which then leaves with the page
    s.cw.forEach((el) => { el.style.visibility = g < 1 ? 'visible' : 'hidden'; });
    maskTo(s.cap, p3(seg(t, 0.62 + PUSH + 0.05, 0.62 + PUSH + 0.4)), ctx);
  },
  idle() {},
  still: (ch, cfg) => `<div class="ch-still__stack"><span data-fit="96">${esc(ch.lines[0])}</span></div><figure class="ch-still__close"><img src="${src(cfg, ch.pic)}" alt="${esc(ch.pic.alt)}" width="${ch.pic.w}" height="${ch.pic.h}" style="${posStyle(ch.pic)}"><figcaption>${capHTML(ch.pic)}<span>${esc(ch.pic.by)}</span></figcaption></figure><div class="ch-still__stack"><span data-fit="96">${esc(ch.lines[1])}</span></div>`,
};

const RECIPES = { bleed, travel, aim, pushin, rooms, closer };

/* ---------- the engine ---------- */
const lengthOf = (r, ch) => (r.flow ? r.flow(ch) : r.pin(ch) + 1);
const stayOf = (r, ch) => ch.stay ?? r.stay ?? 0;
// the page's tone turns when the new ground has all but reached the top of the screen, not at the middle
const TONE_AT = 38;

export function chaptersHTML(cfg) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = cfg.chapters.map((ch) => {
    const r = RECIPES[ch.recipe];
    if (reduced) return `<div class="ch-still ch-still--${ch.recipe}" data-tone="${ch.tone}" style="--ch-ground:var(--${ch.tone});--ch-ink:${ch.ink}">${r.still(ch, cfg)}</div>`;
    // a tone marker crosses the middle of the screen at t = its top - 0.5
    const marks = (r.marks?.(ch) ?? []).map(([t, tone]) => `<i class="ch-tone" data-tone="${tone}" style="top:${((t + 0.5) * 100).toFixed(1)}svh;height:auto;bottom:-${TONE_AT}svh"></i>`).join('');
    return `<div class="ch" style="height:${lengthOf(r, ch) * 100}svh">${r.sr(ch)}<i class="ch-tone" data-tone="${ch.tone}" style="top:${TONE_AT}svh"></i>${marks}</div>`;
  }).join('');
  return `<section class="pic-chapters" data-pictures="chapters" data-sheets="park" aria-label="${esc(cfg.label)}">${body}</section>`;
}

export function chaptersEnter(root, ctx, cfg) {
  const sec = root.querySelector('.pic-chapters');
  const c = { root, sec, cfg, paper: ctx.paper, sheets: [], todo: [], scenes: [], w: 0, h: 0, dead: false, still: !!sec.querySelector('.ch-still'), dirty: true, y: 0 };
  // the type is fitted by measuring it, so it is measured again whenever a font arrives
  c.refit = () => { c.dirty = true; };
  document.fonts?.addEventListener('loadingdone', c.refit);
  if (c.still) return c;
  // the page stays on the closing ground until the paper has all but reached the top, as it does under Iyuana's wall
  c.tone = document.createElement('i');
  c.tone.className = 'pic-wall__tone';
  c.tone.dataset.tone = cfg.chapters[cfg.chapters.length - 1].tone;
  sec.nextElementSibling?.prepend(c.tone);
  const stage = document.createElement('div');
  stage.className = 'ch-stage';
  stage.hidden = true;
  c.stage = stage;
  const spacers = [...sec.querySelectorAll('.ch')];
  cfg.chapters.forEach((ch, i) => {
    const r = RECIPES[ch.recipe];
    const el = document.createElement('div');
    el.className = `ch-scene ch-scene--${ch.recipe}`;
    el.hidden = true;
    el.style.setProperty('--ch-ground', `var(--${ch.tone})`);
    el.style.setProperty('--ch-ink', ch.ink);
    el.innerHTML = r.scene(ch, cfg);
    stage.append(el);
    const s = { ch, rec: r, el, spacer: spacers[i], on: false, top: 0, h: 0 };
    const line = el.querySelector('.ch-edge');
    if (line) s.edge = edgeEnter(line);
    // the stage's pictures load in the order they are met, between the sheets
    el.querySelectorAll('img[data-src]').forEach((img) => c.todo.push(() => { img.src = img.dataset.src; img.decode?.().catch(() => {}); }));
    r.setup(s, c);
    c.scenes.push(s);
  });
  ctx.paper.under.append(stage);
  return c;
}

function fitStills(c, vw) {
  for (const el of c.sec.querySelectorAll('[data-fit]')) {
    el.style.fontSize = px((vw * +el.dataset.fit) / 100 / emOf(el));
  }
}

function layoutAll(c, ctx) {
  c.dirty = false; c.w = ctx.vw; c.h = ctx.vh;
  if (c.still) { fitStills(c, ctx.vw); return; }
  c.stage.hidden = false;
  for (const s of c.scenes) {
    const was = s.el.hidden;
    s.el.hidden = false;
    s.top = s.spacer.offsetTop; s.h = s.spacer.offsetHeight;
    s.unit = s.h / lengthOf(s.rec, s.ch);
    if (s.rec.flow) s.el.style.height = px(s.h);
    s.rec.layout(s, ctx);
    s.el.hidden = was;
  }
}

export function chaptersFrame(c, ctx) {
  const { vh, vw } = ctx;
  // a phone's address bar only changes the height: the composition stays until the width changes
  if (c.dirty || c.w !== vw || (!ctx.coarse && c.h !== vh)) layoutAll(c, ctx);
  if (c.still) return;
  const top0 = c.sec.getBoundingClientRect().top;
  if (c.todo.length && top0 < vh * 4) c.todo.shift()();
  const speed = ctx.dt > 0 ? (ctx.scrollY - c.y) / ctx.dt : 0;
  c.y = ctx.scrollY;
  let any = false;
  for (const s of c.scenes) {
    const top = top0 + s.top, stay = stayOf(s.rec, s.ch) * s.unit, end = top + s.h + stay;
    const on = top < vh * 1.02 && end > -2;
    if (on !== s.on) { s.on = on; s.el.hidden = !on; if (!on) s.rec.idle(s); }
    if (!on) continue;
    any = true;
    let off;
    if (s.rec.flow) off = top;
    else off = top > 0 ? top : end - vh < 0 ? end - vh : 0;
    s.el.style.transform = off ? `translate3d(0, ${off.toFixed(1)}px, 0)` : '';
    s.rec.frame(s, -top / s.unit, off, ctx);
    // the edge only matters while its ground is rising
    if (s.edge && top > -vh * 0.3) edgeDraw(s.edge, clamp01(1 - top / vh), speed);
  }
  if (c.stage.hidden === any) c.stage.hidden = !any;
}

export function chaptersLeave(c) {
  c.dead = true;
  document.fonts?.removeEventListener('loadingdone', c.refit);
  c.sheets.forEach((s) => s.dispose());
  c.sheets.length = 0;
  c.scenes.forEach((s) => { if (s.edge) edgeLeave(s.edge); });
  c.tone?.remove();
  c.stage?.remove();
}
