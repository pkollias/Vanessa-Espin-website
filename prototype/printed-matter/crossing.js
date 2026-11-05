/* Herencia Viva, the crossing. Owned by the pictures builder.

   Her campaign line gives the page its structure, with no new words: ECUADOR. NY. 2026, then the poster's
   Ecuadorian Magic Realism. All eight pieces cross between those giant lines, each treated as what it is:
   his paintings slow, whole and mounted; her designs fast, as printed things; the rooms at the page's own speed,
   flush to the screen's edge. Then the type leaves and one painting holds.
   Daddy Yankee's framed drift and rising headlines. Position is a pure function of scroll, so when the scroll
   stops everything stops: nothing trails, and nothing here moves like the home carousel. */

const H = 600, HM = 760; // the section's height in svh, desktop and phone
const ART = 'Luis Medina', HERS = 'Design: Vanessa Espín';
// x, w: left edge and width in vw; a: where its centre crosses the middle of the screen, in svh from the section's
// top; r: its speed against the page. m: the same on a phone. side: flush to that edge of the screen.
const PIECES = [
  { f: '05-village-painting.jpg', w0: 414, h0: 444, kind: 'art', cap: 'Painting', credit: ART, x: 58, w: 30, a: 115, r: 0.7, m: { x: 14, w: 72, a: 125, r: 0.85 } },
  { f: '01-threads-of-memory.jpg', w0: 1060, h0: 1412, kind: 'sheet', cap: 'Threads of Memory · the campaign', credit: HERS, x: 50, w: 38, a: 205, r: 1.25, m: { x: 6, w: 88, a: 245, r: 1.15 } },
  { f: '06-fish-in-the-city.jpg', w0: 550, h0: 670, kind: 'print', cap: 'The poster’s fish, in New York', credit: HERS, x: 7, w: 27, a: 248, r: 1.4, m: { x: 30, w: 64, a: 325, r: 1.2 } },
  { f: '07-shirt-back.jpg', w0: 552, h0: 670, kind: 'print', cap: 'The shirt', credit: HERS, x: 40, w: 21, a: 292, r: 1.3, m: { x: 6, w: 60, a: 390, r: 1.25 } },
  { f: '08-studio.jpg', w0: 552, h0: 666, kind: 'room', side: 'l', cap: 'Paintings in a studio', credit: '', x: 0, w: 40, a: 402, r: 1, m: { x: 0, w: 74, a: 495, r: 1 } },
  { f: '02-gallery-wall.jpg', w0: 552, h0: 526, kind: 'room', side: 'r', cap: 'Installation view', credit: '', x: 60, w: 38, a: 432, r: 1, m: { x: 26, w: 74, a: 545, r: 1 } },
  { f: '03-meninas-detail.jpg', w0: 550, h0: 666, kind: 'art', cap: 'Meninas Ancestrales · detail', credit: ART, x: 12, w: 30, a: 555, r: 0.7, m: { x: 8, w: 76, a: 705, r: 0.85 } },
];
const LINES = [
  { html: 'Ecuador.', cls: 'one', a: 50, am: 50 },
  { html: 'NY.', cls: 'two', a: 165, am: 185 },
  { html: '2026', cls: 'three', a: 332, am: 445 },
  { html: '<small>Ecuadorian</small>Magic Realism', cls: 'four', a: 490, am: 625 },
];
const ln = (t, d) => `<span class="ln"><span class="ln__i" style="--d:${d}s">${t}</span></span>`;
const lineHTML = (l) => {
  const small = /<small>(.*)<\/small>(.*)/.exec(l.html);
  const body = small ? `<small>${ln(small[1], 0)}</small>${small[2].split(' ').map((w, i) => ln(w, 0.08 * (i + 1))).join(' ')}` : ln(l.html, 0);
  return `<h2 class="pic-line pic-line--${l.cls}" style="--a:${l.a};--am:${l.am}">${body}</h2>`;
};
const pieceHTML = (p) => `<figure class="pic-piece pic-piece--${p.kind}${p.side ? ` pic-piece--${p.side}` : ''}" data-a="${p.a}" data-am="${p.m.a}" data-r="${p.r}" data-rm="${p.m.r}" style="--x:${p.x};--w:${p.w};--a:${p.a};--xm:${p.m.x};--wm:${p.m.w};--am:${p.m.a};--nw:${p.w0}px">
    <img src="img/herencia-viva/${p.f}" alt="${p.cap}" width="${p.w0}" height="${p.h0}" loading="lazy" decoding="async">
    <figcaption>${p.cap}${p.credit ? `<span>${p.credit}</span>` : ''}</figcaption>
  </figure>`;

export function longHTML() {
  return `
  <section class="pic-long" data-pictures="long" data-tone="paper" data-sheets="park" style="--H:${H};--HM:${HM}" aria-label="Herencia Viva: the paintings and the campaign">
    ${LINES.map(lineHTML).join('')}
    ${PIECES.map(pieceHTML).join('')}
  </section>
  <section class="pic-hold" data-pictures="long" data-tone="paper" data-sheets="park" aria-label="One painting">
    <div class="pic-hold__pin">
      <figure class="pic-piece pic-piece--art pic-hold__fig"><img src="img/herencia-viva/04-andean-figures.jpg" alt="Painting" width="554" height="666" loading="lazy" decoding="async">
        <figcaption>Painting<span>${ART}</span></figcaption></figure>
    </div>
  </section>`;
}

export function longEnter(root) {
  const sec = root.querySelector('.pic-long');
  return {
    sec, root, phone: null,
    pieces: [...sec.querySelectorAll('.pic-piece')].map((el) => ({ el, a: +el.dataset.a, am: +el.dataset.am, r: +el.dataset.r, rm: +el.dataset.rm, dy: NaN })),
    lines: [...sec.querySelectorAll('.pic-line')].map((el) => ({ el, on: false })),
  };
}

export function longFrame(c, ctx) {
  const { vh, vw, reduced } = ctx;
  const r = c.sec.getBoundingClientRect();
  for (const l of c.lines) {
    if (!l.on && l.el.getBoundingClientRect().top < vh * 0.82) { l.on = true; l.el.classList.add('is-in'); }
  }
  if (r.bottom < -vh || r.top > vh * 2) return;
  const phone = vw < 760, svh = c.sec.offsetHeight / (phone ? HM : H);
  for (const p of c.pieces) {
    const d = reduced ? 0 : r.top + (phone ? p.am : p.a) * svh - vh / 2;
    if (Math.abs(d) > vh * 2.2) continue;
    const dy = Math.round(((phone ? p.rm : p.r) - 1) * d * 10) / 10;
    if (dy !== p.dy) { p.dy = dy; p.el.style.transform = dy ? `translate3d(0, ${dy}px, 0)` : ''; }
  }
}
