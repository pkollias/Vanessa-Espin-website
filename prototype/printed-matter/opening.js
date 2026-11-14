/* The home opening. A V and an E made of eight plain bars, cut out of the paper. Behind the paper sits a black sheet with
   Curation and Branding on it, so the words only ever show through the bars. It plays by itself on every full load of home:
   the bars turn, lock into four columns and flood the page, then the black lifts off the first poster.
   Everything drawn is a pure function of one value, q (0 to 1), and the score below turns time into q. */

const WORDS = ['Curation', 'Branding'];
const INKS = ['#e8502a', '#f0a31c'];
const FONT = 'Gambetta';
const T = { go: 0.012, pose: 0.42, settle: 0.46, lock: 0.56, flood: 0.58, full: 0.88, lift: 0.905 }; // the moves, in q
// The score, in ms: each beat runs q up to its `to`. barAt and the lift ease inside their own segments, so q stays linear
// through them; the flood's curves only ease in, so `out` gives it an ease-out on q. The timings are still to be tuned.
const SCORE = [
  { beat: 'rest', ms: 450, to: 0 },
  { beat: 'dance', ms: 950, to: T.settle },
  { beat: 'lock', ms: 280, to: T.lock },
  { beat: 'columns', ms: 500, to: T.flood }, // the score holds at the end of this beat until the posters are hung
  { beat: 'flood', ms: 550, to: T.full, out: true },
  { beat: 'black', ms: 150, to: T.lift },
  { beat: 'lift', ms: 500, to: 1 },
];
const at = (name) => SCORE.slice(0, SCORE.findIndex((b) => b.beat === name)).reduce((t, b) => t + b.ms, 0);
const GATE = at('flood'), LAND = at('lift'), TOTAL = SCORE.reduce((t, b) => t + b.ms, 0);
const FONT_CAP = 1200; // the longest the score waits for Gambetta Bold
const SIGN_AFTER = 1200; // how long it holds on the columns before a bar shows it is still alive
const SKIP_RUN = 400, SKIP_END = 300; // a skip: everything up to the lift, then the lift itself
const STILL = 1200, FADE = 500; // without motion: the still columns, then a plain fade
const AGAIN = 350; // a replay fades in over the home, so the rest is this much longer

// V stem, V hidden, V diagonal, V hidden, E stem, E top, E middle, E bottom. The two hidden bars sit behind the V at rest.
const COL = [1, 0, 0, 1, 2, 3, 3, 2]; // where each bar ends: the two stems carry the words in the inner columns
const STAG = [0, 0.03, 0.012, 0.042, 0, 0.012, 0.03, 0.042];
const SPIN = [180, 270, 212, 360, 180, 270, 180, 450];
const SWING = [0, 118, 74, 150, 0, 74, 118, 150];
const BULGE = [0, 0.34, 0.2, 0.42, 0, 0.2, 0.34, 0.42];
const LATE = [0, 0.017, 0.034, 0.051]; // the columns take off in order, so their heights read as a staircase

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const glog = (a, b, t) => a * Math.pow(b / a, t);
const seg = (v, a, b) => clamp((v - a) / (b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rad = (d) => (d * Math.PI) / 180;

function createOpening(host) {
  const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
  const body = document.body;
  let W = 0, H = 0, D = 1, M = 0, cx = 0, cy = 0, words = [], cols = [], flood = null, bars = [];
  let paper = '#e3dfd8', black = '#121110';
  // t: where the score is. armed: the font gate has passed. homeReady: the poster gate has passed. skipFrom: where a skip began.
  // waited: time spent held at the poster gate.
  let on = false, q = 0, t = 0, raf = 0, last = 0, armed = false, homeReady = false, skipFrom = null, byWheel = false, landing = false, waited = 0;

  function layout() {
    W = innerWidth; H = innerHeight; D = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * D; cv.height = H * D;
    cx = W / 2; cy = H / 2 + Math.min(14, H * 0.015);
    const phone = W < 760, css = getComputedStyle(document.documentElement);
    paper = css.getPropertyValue('--paper').trim() || paper;
    black = css.getPropertyValue('--ink').trim() || black;

    // The words stay small: the blocks are the scale of this page and the words are the labels on them.
    const fs = Math.min(W * (phone ? 0.046 : 0.034), H * 0.062) * 1.14;
    ctx.font = `700 ${fs}px ${FONT}`;
    const c = ctx.measureText(WORDS[0]), up = (c.actualBoundingBoxAscent - c.actualBoundingBoxDescent) / 2; // one baseline: the g must not lift Branding
    words = WORDS.map((s) => ({ s, fs, up, width: ctx.measureText(s).width }));

    // Where the blocks lock: four tall columns.
    const cw = W * (phone ? 0.25 : 0.17), cg = W * (phone ? 0.02 : 0.03), ch = Math.min(H * 0.56, cw * (phone ? 2.2 : 1.9)), d = cw + cg;
    cols = [-1.5, -0.5, 0.5, 1.5].map((k) => ({ x: cx + k * d, y: cy, w: cw, h: ch }));
    // The flood: the columns outgrow their spacing, so the strips between them narrow as they slide off the page.
    flood = { spread: W / (2 * d) - 1, wide: (W * 0.502) / cw - 1, tall: (H * 1.3) / ch - 1 };

    // The letters. Every part is the same plain bar; V and E are only how the bars overlap at rest.
    M = Math.min(H * 0.4, W * (phone ? 0.42 : 0.24));
    const t = 0.26, th = rad(32), arm = 0.86, gap = 0.09;
    // the diagonal leans out of the stem's foot, its lowest corner on the stem's
    const ex = 0.5 * Math.sin(th) + (t / 2) * Math.cos(th), ey = 0.5 * Math.cos(th) + (t / 2) * Math.sin(th);
    const diag = { x: -t / 2 - ex + t * Math.cos(th), y: 0.5 - ey, r: -th }, stem = { x: 0, y: 0, r: 0 }, el = t / 2 + gap;
    const rest = [stem, { ...stem }, diag, { ...diag }, { x: el + t / 2, y: 0, r: 0 }];
    [-0.5 + t / 2, 0, 0.5 - t / 2].forEach((y) => rest.push({ x: el + arm / 2, y, r: rad(90), len: arm }));
    const xs = rest.map((p) => p.x), mid = (Math.min(...xs) + Math.max(...xs)) / 2 + 0.03;

    bars = rest.map((b, i) => {
      const p = { x: cx + (b.x - mid) * M, y: cy + b.y * M, r: b.r, w: t * M, h: (b.len || 1) * M };
      const g = cols[COL[i]];
      const a0 = Math.atan2(p.y - cy, p.x - cx);
      let a1 = Math.atan2(g.y - cy, g.x - cx);
      while (a1 - a0 > Math.PI) a1 -= Math.PI * 2;
      while (a1 - a0 < -Math.PI) a1 += Math.PI * 2;
      const rm = Math.round((p.r + rad(SPIN[i])) / rad(90)) * rad(90); // the pose: square to the page
      const r2 = Math.round(rm / Math.PI + 0.26) * Math.PI; // the lock: upright
      return { p, g, a0, a1, r0: Math.hypot(p.x - cx, p.y - cy), r1: Math.hypot(g.x - cx, g.y - cy), rm, r2, d: STAG[i], fd: LATE[COL[i]], swing: rad(SWING[i]), bulge: BULGE[i] * M, wm: p.w * 2.2, hm: p.h * 1.22 };
    });
  }

  function barAt(b) {
    const e = ease(seg(q, T.go + b.d, T.pose + b.d)), arc = Math.sin(Math.PI * e);
    const a = lerp(b.a0, b.a1, e) + b.swing * arc, rr = lerp(b.r0, b.r1, e) + b.bulge * arc;
    const l = ease(seg(q, T.pose - 0.05 + b.d, T.lock));
    const f = Math.pow(seg(q, T.flood + b.fd, T.full - 0.12 + b.fd), 1.5), fw = Math.pow(seg(q, T.flood, T.full), 1.7);
    return {
      x: cx + Math.cos(a) * rr * (1 + fw * flood.spread), y: cy + Math.sin(a) * rr,
      w: glog(glog(b.p.w, b.wm, e), b.g.w, l) * (1 + fw * flood.wide),
      h: glog(glog(b.p.h, b.hm, e), b.g.h, l) * (1 + f * flood.tall),
      r: lerp(lerp(b.p.r, b.rm, e), b.r2, l),
    };
  }

  function addBar(path, s) {
    const c = Math.cos(s.r), n = Math.sin(s.r), hw = s.w / 2, hh = s.h / 2;
    [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].forEach(([u, v], i) => {
      const X = s.x + u * c - v * n, Y = s.y + u * n + v * c;
      if (i) path.lineTo(X, Y); else path.moveTo(X, Y);
    });
    path.closePath();
  }

  function draw() {
    ctx.setTransform(D, 0, 0, D, 0, 0);
    const lift = ease(seg(q, T.lift, 1)) * H;
    if (lift > 0) ctx.clearRect(0, 0, W, H);
    else { ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H); }
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H - lift); ctx.clip();
    ctx.translate(0, -lift);
    const path = new Path2D();
    bars.forEach((b) => addBar(path, barAt(b)));
    ctx.clip(path, 'nonzero');
    ctx.fillStyle = black; ctx.fillRect(0, 0, W, H + lift);
    // The words start just under the letters, out of sight, and scroll up into the stems. They stay level while the blocks turn.
    const rise = Math.pow(1 - seg(q, 0.012, 0.3), 2) * M * 0.74;
    ctx.textAlign = 'center';
    words.forEach((w, i) => {
      ctx.font = `700 ${w.fs}px ${FONT}`;
      ctx.fillStyle = INKS[i];
      ctx.fillText(w.s, cols[i ? 2 : 1].x, cy + w.up + rise);
    });
    ctx.restore();
    // a long wait for the posters: one thin ink bar under the columns, so the still frame reads as alive
    if (!homeReady && waited > SIGN_AFTER) {
      const c = cols[0], m = Math.max(c.x - c.w / 2, 16), span = W - m * 2;
      ctx.fillStyle = black;
      ctx.fillRect(m, c.y + c.h / 2 + Math.min(28, H * 0.03), span * (1 - Math.exp(-(waited - SIGN_AFTER) / 2500)), 2);
    }
  }

  function qAt(v) {
    let from = 0, t0 = 0;
    for (const b of SCORE) {
      if (v < t0 + b.ms) { const k = clamp((v - t0) / b.ms); return lerp(from, b.to, b.out ? 1 - (1 - k) * (1 - k) : k); }
      from = b.to; t0 += b.ms;
    }
    return 1;
  }
  // a skip runs the rest of the score fast, but the lift keeps enough time to be seen
  const pace = () => (skipFrom === null ? 1 : t < LAND ? Math.max(1, (LAND - skipFrom) / SKIP_RUN) : Math.max(1, (TOTAL - LAND) / SKIP_END));
  function advance(ms) {
    t += ms * pace();
    if (t > GATE && !homeReady) { t = GATE; waited += ms; }
    q = qAt(t);
    if (t >= LAND && !landing) land();
    if (t >= TOTAL) finish();
  }
  // without motion the clock only counts the still frame; once it is up and the posters are hung, the page fades through
  function advanceStill(ms) {
    t += ms;
    if (landing) { if (t >= STILL + FADE) finish(); return; }
    if (t < STILL && skipFrom === null) return;
    if (!homeReady) { waited += ms; return; }
    t = STILL; landing = true;
    host.classList.add('is-fading'); body.classList.remove('is-opening');
    api.onLand();
  }
  function land() {
    landing = true;
    body.classList.remove('is-opening'); body.classList.add('is-landing');
    api.onLand();
  }

  // The clock counts its own time from a clamped dt: a hidden tab, a bfcache restore or a stall reads as a pause, never a jump.
  function loop(now) {
    raf = 0;
    if (!on) return;
    const ms = Math.min(50, now - last || 16); last = now;
    if (armed) (reduced ? advanceStill : advance)(ms);
    if (!on) return;
    draw();
    wake();
  }
  function wake() { if (!raf) raf = requestAnimationFrame(loop); }

  // Any wheel, touch, click or key skips, from the first frame: the site's own input is not listening yet.
  function skip(wheel = false) {
    if (!on) return;
    byWheel ||= wheel;
    if (skipFrom === null) skipFrom = Math.max(0, t);
  }
  const inLab = (e) => e.target.closest?.('.lab');
  const onWheel = (e) => { if (inLab(e)) return; e.preventDefault(); skip(true); };
  const onPress = (e) => { if (!inLab(e)) skip(); };
  const onKey = (e) => { if (e.key !== 'Tab' && !/^(Shift|Control|Alt|Meta)$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) skip(); };
  function listen(v) {
    const set = v ? addEventListener : removeEventListener;
    set('wheel', onWheel, { passive: false, capture: true });
    set('pointerdown', onPress, true);
    set('keydown', onKey, true);
  }

  function start(fade = false) {
    if (on) stop();
    on = true; skipFrom = null; byWheel = false; landing = false; waited = 0;
    t = fade ? -AGAIN : 0; q = reduced ? T.lock : 0; // without motion: the columns, still, with the two words
    host.hidden = false; host.classList.toggle('is-in', fade);
    body.classList.add('is-opening');
    layout(); draw();
    listen(true);
    last = performance.now();
    wake();
  }
  function stop() {
    on = false; landing = false;
    cancelAnimationFrame(raf); raf = 0;
    host.hidden = true; host.classList.remove('is-in', 'is-fading');
    body.classList.remove('is-opening', 'is-landing');
    listen(false);
  }
  function finish() {
    q = 1;
    stop();
    api.onEnd(byWheel);
  }

  addEventListener('resize', () => { if (on) { layout(); draw(); } });
  // The font gate. Whatever the cap decided, the words are measured again when Gambetta Bold does arrive.
  const font = document.fonts.load(`700 100px ${FONT}`).then(() => { if (on) { layout(); draw(); } }).catch(() => {});
  Promise.race([font, new Promise((r) => setTimeout(r, FONT_CAP))]).then(() => { armed = true; });

  const api = {
    get on() { return on; },
    onLand() {}, // the lift is starting
    onEnd() {}, // the black has gone; true if a wheel skipped it, so its tail is still coming
    start, skip,
    ready: () => { homeReady = true; }, // the poster gate: boot calls this when the posters are hung
    replay: () => start(true),
    end: () => { if (on) stop(); }, // a route left home: no trace of the opening stays behind
    repaint: () => { if (on) { layout(); draw(); } },
  };
  return api;
}

export const opening = createOpening(document.querySelector('.opening'));
// This file loads ahead of everything else, so on home the V and E are the first thing on the page: no poster shows before them.
if (!location.hash.replace(/^#\/?/, '')) { document.body.classList.add('is-home'); opening.start(); }
