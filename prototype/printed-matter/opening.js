/* The home opening. A V and an E made of eight plain bars, cut out of the paper. Behind the paper sits a black sheet with
   Curation and Branding on it, so the words only ever show through the bars. As you scroll the bars turn, grow into four
   columns and flood the page, then the black lifts off the first poster.
   Everything drawn is a pure function of one value, q (0 to 1), so scrolling back plays it in reverse. */

const WORDS = ['Curation', 'Branding'];
const INKS = ['#e8502a', '#f0a31c'];
const FONT = 'Gambetta';
const TRAVEL = 3.2; // screens of scrolling from the letters to the first poster
const TAU = 0.16; // the lag of the site's other scrubbed motion
const SWIPE = 1.5, FLICK = 120; // a finger moves it further than a wheel does, and a flick carries on
const T = { go: 0.012, pose: 0.42, lock: 0.56, flood: 0.58, full: 0.88, lift: 0.905 }; // the score, in q

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
  const links = [...host.querySelectorAll('.opening__word')];
  let W = 0, H = 0, D = 1, M = 0, cx = 0, cy = 0, words = [], cols = [], flood = null, bars = [];
  let paper = '#e3dfd8', black = '#121110';
  let on = false, q = 0, target = 0, tw = null, raf = 0, last = 0, hover = -1, dir = 1, settle = 0;

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
    words = WORDS.map((s) => { const m = ctx.measureText(s); return { s, fs, up: (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2, width: m.width }; });

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

    links.forEach((a, i) => {
      const w = words[i];
      a.style.cssText = `left:${cols[i ? 2 : 1].x - w.width / 2 - 10}px;top:${cy - w.fs * 0.8}px;width:${w.width + 20}px;height:${w.fs * 1.6}px;font:700 ${w.fs}px/${w.fs * 1.6}px ${FONT}`;
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
      const x = cols[i ? 2 : 1].x, y = cy + w.up + rise;
      ctx.font = `700 ${w.fs}px ${FONT}`;
      ctx.fillStyle = INKS[i];
      ctx.fillText(w.s, x, y);
      if (hover === i) ctx.fillRect(x - w.width / 2, y + w.fs * 0.17, w.width, Math.max(1.5, w.fs * 0.045));
    });
    ctx.restore();
    host.classList.toggle('is-moving', q > 0.01);
    host.classList.toggle('is-live', q > 0.2 && q < T.lift);
  }

  function loop(now) {
    raf = 0;
    if (!on) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (tw) {
      const t = clamp((now - tw.t0) / tw.ms);
      q = target = lerp(tw.from, tw.to, ease(t));
      if (t >= 1) tw = null;
    } else {
      q += (target - q) * (1 - Math.exp(-dt / TAU));
      if (Math.abs(target - q) < 0.0005) q = target;
    }
    draw();
    if (q >= 1 && !tw) { finish(); return; } // a rewind starts at 1, so a running tween is not the end
    if (tw || q !== target) wake();
  }
  function wake() { if (!raf) raf = requestAnimationFrame(loop); }

  function start(fade = false) {
    on = true; tw = null; q = target = reduced ? T.lock : 0; // without motion: the columns, still, with the two words
    host.hidden = false; host.classList.toggle('is-in', fade);
    layout(); draw();
  }
  // from the first poster, in reverse
  function back() {
    if (on) return;
    if (reduced) { start(); return; }
    on = true; tw = null; q = target = 1;
    host.hidden = false; host.classList.remove('is-in');
    layout(); draw();
  }
  function finish() {
    on = false; tw = null; q = target = 1;
    host.hidden = true;
    api.onEnd();
  }
  function to(v, ms) {
    if (reduced) { if (v >= 1) finish(); else start(); return; }
    clearTimeout(settle);
    tw = { from: q, to: v, t0: performance.now(), ms };
    wake();
  }
  function scroll(px) {
    if (reduced) { if (px > 0) finish(); return; }
    tw = null;
    if (px) dir = Math.sign(px);
    target = clamp(target + px / (TRAVEL * H));
    wake();
    // the black never stops half lifted: the poster under it has to be there to click
    clearTimeout(settle);
    settle = setTimeout(() => { if (on && !tw && target > T.lift && target < 1) to(dir > 0 ? 1 : T.full, 500); }, 260);
  }

  links[0].addEventListener('click', (e) => { e.preventDefault(); to(1, 1400); });
  links.forEach((a, i) => {
    a.addEventListener('pointerenter', () => { hover = i; if (on) draw(); });
    a.addEventListener('pointerleave', () => { hover = -1; if (on) draw(); });
  });

  // a finger scrubs it; the wheel and the keys come in through scroll() from the site
  let touch = null;
  host.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') touch = { y: e.clientY, t: e.timeStamp, v: 0 }; });
  host.addEventListener('pointermove', (e) => {
    if (!touch) return;
    const dy = touch.y - e.clientY, ms = Math.max(1, e.timeStamp - touch.t);
    touch.v = lerp(touch.v, dy / ms, 0.4); touch.y = e.clientY; touch.t = e.timeStamp;
    if (dy) scroll(dy * SWIPE);
  });
  const lift = () => { if (touch && Math.abs(touch.v) > 0.15) scroll(touch.v * FLICK * SWIPE); touch = null; };
  host.addEventListener('pointerup', lift);
  host.addEventListener('pointercancel', () => { touch = null; });

  addEventListener('resize', () => { if (on) { layout(); draw(); } });
  document.fonts.load(`700 100px ${FONT}`).then(() => { if (on) { layout(); draw(); } }).catch(() => {});

  const api = {
    get on() { return on; },
    onEnd() {},
    start, back, finish, scroll, to,
    nudge: (d) => scroll(d * TRAVEL * H * 0.14),
    skip: () => to(1, 1400),
    rewind: () => { back(); to(0, 1500); },
    repaint: () => { if (on) { layout(); draw(); } },
  };
  return api;
}

export const opening = createOpening(document.querySelector('.opening'));
// This file loads ahead of everything else, so on home the V and E are the first thing on the page: no poster shows before them.
if (!location.hash.replace(/^#\/?/, '')) { document.body.classList.add('is-home'); opening.start(); }
