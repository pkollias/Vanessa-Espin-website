// Vanessa Espín — 8 Divergent Dark-Gallery About Visual & Animation Concepts (a1–a8)
// Pure vanilla ES module: zero external dependencies, 100% approved verbatim copy, 60fps choreography.

export const ABOUT_CONCEPTS = [
  { id: 'a1', short: 'A1 · Asymmetric Salon ★', name: 'Lights-Go-Off Asymmetric Salon', dur: 0.54 },
  { id: 'a2', short: 'A2 · 3D Portrait Sheet ★', name: '3D WebGL Portrait Sheet & Nocturne Wall', dur: 0.58 },
  { id: 'a3', short: 'A3 · Dark Monograph', name: 'Full-Canvas 3-Column Dark Monograph', dur: 0.50 },
  { id: 'a4', short: 'A4 · Gallery Alcove', name: 'Elevated Dark Gallery Alcove & Room Push', dur: 0.50 },
  { id: 'a5', short: 'A5 · Stipple Chiaroscuro', name: 'Velvet Chiaroscuro & Pointillist Halo', dur: 0.56 },
  { id: 'a6', short: 'A6 · 3-Bay Tech Booth', name: 'Zero-Scroll Three-Bay Tech Booth', dur: 0.54 },
  { id: 'a7', short: 'A7 · Curatorial Desk', name: 'Nocturnal Curatorial Desk on Smoked Walnut', dur: 0.58 },
  { id: 'a8', short: 'A8 · Night-Komorebi Plinth', name: 'Night-Komorebi Same-Room Plinth', dur: 0.58 },
];

const VALID_IDS = new Set(ABOUT_CONCEPTS.map((c) => c.id));
const OPEN_BAY_STYLES = new Set(['a1', 'a2', 'a4', 'a8']);
const POSTER_BAY_STYLES = new Set(['a1', 'a4', 'a8']);

const DEFAULT_BIO = {
  statement: 'I wanted to tell the stories of us.',
  eyebrow: 'Event Planning & Creative Direction · New York',
  door: 'I help bring cultural and artistic events to life. I create the visual identity and the marketing material, and I curate the experience itself.',
  stood: [
    {
      exIdx: 2,
      name: 'Ayazamana',
      place: 'Flushing Town Hall',
      text: 'At Ayazamana I was in the tech room above the stage, handling the visuals that came up after every dance.',
    },
    {
      exIdx: 0,
      name: 'Iyuana',
      place: 'Long Island City',
      text: 'At Iyuana I made sure Yanda, a member of the Sápara Nation, told his story himself.',
    },
    {
      exIdx: 1,
      name: 'Herencia Viva',
      place: 'Flushing Town Hall',
      text: 'At Herencia Viva, if I could go back for five minutes, I’d stand in front of the Ecuadorian Mona Lisa.',
    },
  ],
  home: 'Where I come from shows up in my warmth, my passion and my communal spirit. I make sure people don’t only experience the art; they feel seen, listened to and celebrated. The food, the spaces and the way people meet at my events resemble how we connect back home.',
  turn: 'At some point I realised I wanted more of me in the work. Being a graphic designer and art director wasn’t enough; I wanted to be part of the entire creative experience. I was also looking for purpose. This time I followed my heart and joined the Ecuadorian community.',
  letterHeading: 'How I work',
  letterSalutation: 'Dear artist, dear client,',
  letterBody: 'Your work will tell most of the story. I will choose what to show, how it sits together and where people see it. I will give it a visual identity and make the material that carries it. What is written about your work, you will read first. I will ask before anything of yours goes out. And when people arrive, you tell your own story.',
  linkedin: 'https://www.linkedin.com/in/vanessaespin',
};

const FALLBACK_POSTERS = {
  0: '../img/iyuana.jpg',
  1: '../img/herencia-viva.jpg',
  2: '../img/ayazamana.png',
};

const ZERO_ROOM_MODE = {
  dimWall: 0,
  posterShiftX: 0,
  posterScale: 1,
  sideFade: 0,
  show3DPortrait: 0,
  portraitPose: null,
  nightKomorebi: 0,
  cameraZOffset: 0,
};

const PORTRAIT_POSE_A2 = { x: -0.22, y: 0.01, z: 0.35, ry: 0.16, s: 0.50 };

const ROOM_TARGETS = {
  a1: { dimWall: 1.0, posterShiftX: -0.29, posterScale: 0.88, sideFade: 0.82, show3DPortrait: 0, portraitPose: null, nightKomorebi: 0, cameraZOffset: 0 },
  a2: { dimWall: 1.0, posterShiftX: -0.55, posterScale: 0.72, sideFade: 1.0, show3DPortrait: 1.0, portraitPose: PORTRAIT_POSE_A2, nightKomorebi: 0, cameraZOffset: 0 },
  a3: { dimWall: 1.0, posterShiftX: 0, posterScale: 1.0, sideFade: 0, show3DPortrait: 0, portraitPose: null, nightKomorebi: 0, cameraZOffset: 1.1 },
  a4: { dimWall: 0.88, posterShiftX: -0.23, posterScale: 0.92, sideFade: 0.70, show3DPortrait: 0, portraitPose: null, nightKomorebi: 0, cameraZOffset: 0 },
  a5: { dimWall: 1.0, posterShiftX: 0, posterScale: 1.0, sideFade: 0, show3DPortrait: 0, portraitPose: null, nightKomorebi: 0, cameraZOffset: 0 },
  a6: { dimWall: 1.0, posterShiftX: 0, posterScale: 1.0, sideFade: 0, show3DPortrait: 0, portraitPose: null, nightKomorebi: 0, cameraZOffset: 0 },
  a7: { dimWall: 1.0, posterShiftX: 0, posterScale: 1.0, sideFade: 0, show3DPortrait: 0, portraitPose: null, nightKomorebi: 0, cameraZOffset: 0 },
  a8: { dimWall: 1.0, posterShiftX: -0.32, posterScale: 0.78, sideFade: 0.88, show3DPortrait: 0, portraitPose: null, nightKomorebi: 1.0, cameraZOffset: 0 },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t = clamp01(t - (((ax * t + bx) * t + cx) * t - x) / d);
    }
    return ((ay * t + by) * t + cy) * t;
  };
}

const EASE_GLIDE = cubicBezier(0.32, 0.72, 0, 1);
const EASE_CLOSE = (t) => 1 - Math.pow(1 - clamp01(t), 3);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitStatementTwoLines(statement) {
  const clean = String(statement || DEFAULT_BIO.statement).trim();
  const idx = clean.toLowerCase().indexOf('the stories');
  if (idx > 0) {
    return [clean.slice(0, idx).trim(), clean.slice(idx).trim()];
  }
  const words = clean.split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

function ensureStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('about-concepts-css')) return;
  const existing = document.querySelector('link[rel="stylesheet"][href*="about-concepts.css"]');
  if (existing) {
    existing.id = 'about-concepts-css';
    return;
  }
  const link = document.createElement('link');
  link.id = 'about-concepts-css';
  link.rel = 'stylesheet';
  link.href = 'about-concepts.css';
  document.head.appendChild(link);
}

function resolveBio(ctx) {
  const raw = ctx?.BIO || {};
  const str = (key) => (typeof raw[key] === 'string' && raw[key].trim() ? raw[key].trim() : DEFAULT_BIO[key]);

  let stood = DEFAULT_BIO.stood;
  if (Array.isArray(raw.stood) && raw.stood.length > 0 && typeof raw.stood[0] === 'object' && raw.stood[0] !== null && 'text' in raw.stood[0]) {
    stood = raw.stood.map((item, i) => {
      const fb = DEFAULT_BIO.stood[i % DEFAULT_BIO.stood.length];
      const exIdx = Number.isFinite(item.exIdx) ? item.exIdx : fb.exIdx;
      return {
        exIdx,
        name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : fb.name,
        place: typeof item.place === 'string' && item.place.trim() ? item.place.trim() : fb.place,
        text: typeof item.text === 'string' && item.text.trim() ? item.text.trim() : fb.text,
      };
    });
  }

  const withPosters = stood.map((row, idx) => ({
    ...row,
    num: String(idx + 1).padStart(2, '0'),
    poster: ctx?.EXHIBITIONS?.[row.exIdx]?.poster || FALLBACK_POSTERS[row.exIdx] || '../img/iyuana.jpg',
  }));

  return {
    statement: str('statement'),
    eyebrow: str('eyebrow'),
    door: str('door'),
    stood: withPosters,
    home: str('home'),
    turn: str('turn'),
    letterHeading: str('letterHeading'),
    letterSalutation: str('letterSalutation'),
    letterBody: str('letterBody'),
    linkedin: str('linkedin'),
  };
}

function buildStippleParticles() {
  const rand = mulberry32(20261119);
  const pts = [];
  const RING_COUNT = 172;
  const MOTE_COUNT = 52;
  const GOLDEN_ANGLE = 2.399963229728653;

  for (let i = 0; i < RING_COUNT; i++) {
    const u = i / RING_COUNT;
    const ang = i * GOLDEN_ANGLE + (rand() - 0.5) * 0.16;
    const rScale = 0.56 + 1.42 * Math.pow(u, 0.78) + (rand() - 0.5) * 0.08;
    pts.push({
      kind: 'dot',
      ang,
      rScale,
      ex: 1.24,
      ey: 0.96,
      ox: 0.14 * u,
      oy: -0.02 * u,
      rad: 0.65 + 1.15 * rand(),
      alpha: (0.18 + 0.44 * rand()) * (1 - u * 0.52),
      speed: 0.42 + 0.68 * rand(),
      phase: rand() * Math.PI * 2,
      drift: 1.6 + 3.4 * rand(),
      warmth: rand(),
    });
  }

  for (let j = 0; j < MOTE_COUNT; j++) {
    const ang = rand() * Math.PI * 2;
    const rScale = 0.45 + 2.15 * Math.pow(rand(), 0.72);
    pts.push({
      kind: 'mote',
      ang,
      rScale,
      ex: 1.55,
      ey: 1.05,
      ox: 0.22,
      oy: -0.03,
      rad: 1.8 + 2.3 * rand(),
      alpha: 0.055 + 0.115 * rand(),
      speed: 0.28 + 0.45 * rand(),
      phase: rand() * Math.PI * 2,
      drift: 3.5 + 6.5 * rand(),
      warmth: rand(),
    });
  }
  return pts;
}

export function createAboutController(ctx = {}) {
  ensureStylesheet();

  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const searchParams = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  let bootSnapActive = searchParams.get('openbio') === '1';

  const paramStyle = searchParams.get('about') || searchParams.get('bio');
  const initialCandidate = ctx?.initialStyle || paramStyle || 'a1';
  let currentStyle = VALID_IDS.has(initialCandidate) ? initialCandidate : 'a1';

  let isOpenBool = bootSnapActive;
  let rawMix = bootSnapActive ? 1 : 0;
  let mix = bootSnapActive ? 1 : 0;

  let prevRoomStyle = currentStyle;
  let styleBlend = 1;
  let renderedStyle = '';
  let lastSyncedActiveEx = -99;
  let lastHoveredEx = -99;

  // Stipple canvas state for a5
  const stippleParticles = buildStippleParticles();
  let stippleCanvas = null;
  let stippleCtx = null;
  let portraitAnchor = { cx: 0, cy: 0, r0: 165, valid: false };

  // Build #aboutStage singleton
  let stageEl = document.getElementById('aboutStage');
  if (!stageEl) {
    stageEl = document.createElement('div');
    stageEl.id = 'aboutStage';
    document.body.appendChild(stageEl);
  }
  stageEl.setAttribute('role', 'dialog');
  stageEl.setAttribute('aria-modal', 'true');
  stageEl.setAttribute('aria-label', 'About Vanessa Espín');
  stageEl.setAttribute('aria-hidden', isOpenBool ? 'false' : 'true');
  stageEl.dataset.about = currentStyle;

  // Clear instant-boot snap as soon as real user input happens
  const clearBootSnap = () => {
    if (!bootSnapActive) return;
    bootSnapActive = false;
    stageEl.classList.remove('is-instant');
  };
  window.addEventListener('pointerdown', clearBootSnap, { passive: true });
  window.addEventListener('keydown', clearBootSnap, { passive: true });

  function getActiveDuration() {
    if (reducedMotion) return 0.01;
    const def = ABOUT_CONCEPTS.find((c) => c.id === currentStyle);
    return def ? def.dur : 0.52;
  }

  function renderStoodRows(bio, extraClass = '') {
    return `
      <div class="ab-stood-list ${extraClass}">
        ${bio.stood.map((row) => `
          <button type="button" class="ab-stood-item" data-stood-item data-ex-idx="${row.exIdx}">
            <span class="ab-stood-num">${esc(row.num)}</span>
            <div>
              <div class="ab-stood-head">
                <span>
                  <span class="ab-stood-title">${esc(row.name)}</span>
                  <span class="ab-stood-place"> · ${esc(row.place)}</span>
                </span>
                <span class="ab-stood-go" aria-hidden="true">Enter →</span>
              </div>
              <p class="ab-stood-text">${esc(row.text)}</p>
            </div>
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderConceptMarkup(styleId) {
    const bio = resolveBio(ctx);
    const [line1, line2] = splitStatementTwoLines(bio.statement);

    if (styleId === 'a1') {
      return `
        <div class="ab-open-bay a1-bay" data-about-bay aria-hidden="true">
          <span class="ab-bay-cue">Experience event →</span>
        </div>
        <div class="a1-salon">
          <div class="ab-grain" aria-hidden="true"></div>
          <div class="a1-inner">
            <div class="a1-top">
              <span class="ab-eyebrow">Vanessa Espín · About</span>
              <button type="button" class="ab-close" data-about-close aria-label="Close About">Close ×</button>
            </div>

            <div class="a1-hero">
              <figure class="a1-mat">
                <img class="ab-portrait-img" src="../img/portrait.jpg" width="773" height="806" alt="Vanessa Espín at Brooklyn Bridge Park, New York">
                <figcaption class="a1-mat__cap">Brooklyn Bridge Park · NY</figcaption>
              </figure>
              <div class="a1-hero-copy">
                <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.eyebrow)}</span>
                <h2 class="a1-statement">
                  <span class="ab-ln"><span>${esc(line1)}</span></span>
                  <span class="ab-ln"><span>${esc(line2)}</span></span>
                </h2>
                <p class="a1-door">${esc(bio.door)}</p>
              </div>
            </div>

            <div class="ab-brass-rule" aria-hidden="true"></div>

            <div class="a1-spread">
              <div class="a1-col-left">
                <span class="ab-eyebrow">Purpose &amp; Roots</span>
                <p class="a1-prose">${esc(bio.turn)}</p>
                <p class="a1-prose">${esc(bio.home)}</p>
                <div class="a1-foot">
                  <span class="a1-foot__city">Vanessa Espín · New York</span>
                  <a class="ab-linkedin" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                </div>
              </div>

              <div class="a1-col-right">
                <span class="ab-eyebrow">Where I Stood</span>
                ${renderStoodRows(bio)}
                <aside class="a1-letter" aria-label="${esc(bio.letterHeading)}">
                  <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.letterHeading)}</span>
                  <p class="a1-letter__sal">${esc(bio.letterSalutation)}</p>
                  <p class="a1-letter__body">${esc(bio.letterBody)}</p>
                </aside>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (styleId === 'a2') {
      return `
        <div class="a2-veil" aria-hidden="true"></div>
        <div class="ab-grain" aria-hidden="true"></div>
        <div class="ab-open-bay a2-bay" data-about-bay aria-hidden="true"></div>
        <div class="a2-3d-caption" aria-hidden="true">
          <span class="a2-3d-caption__name">Vanessa Espín</span>
          <span class="a2-3d-caption__sub">Brooklyn Bridge Park · New York</span>
        </div>

        <div class="a2-float">
          <div class="a2-top a2-stagger-1">
            <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.eyebrow)}</span>
            <button type="button" class="ab-close" data-about-close aria-label="Close About">Close ×</button>
          </div>

          <figure class="a2-mobile-portrait">
            <img class="ab-portrait-img" src="../img/portrait.jpg" width="773" height="806" alt="Vanessa Espín at Brooklyn Bridge Park, New York">
          </figure>

          <div class="a2-head a2-stagger-2">
            <h2 class="a2-statement">${esc(bio.statement)}</h2>
            <p class="a2-door">${esc(bio.door)}</p>
          </div>

          <div class="ab-brass-rule a2-stagger-3" aria-hidden="true"></div>

          <div class="a2-grid">
            <div class="a2-left a2-stagger-4">
              <span class="ab-eyebrow">The Turn &amp; Home</span>
              <p class="a2-prose">${esc(bio.turn)}</p>
              <p class="a2-prose">${esc(bio.home)}</p>
              <div style="padding-top:6px;">
                <a class="ab-linkedin" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              </div>
            </div>

            <div class="a2-right a2-stagger-5">
              <div class="a2-letter">
                <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.letterHeading)}</span>
                <p class="a2-letter__body">${esc(bio.letterSalutation)} ${esc(bio.letterBody)}</p>
              </div>
              <span class="ab-eyebrow" style="margin-top:4px;">Where I Stood</span>
              <div class="a2-pills">
                ${bio.stood.map((row) => `
                  <button type="button" class="a2-pill" data-stood-item data-ex-idx="${row.exIdx}">
                    <div class="a2-pill__top">
                      <span class="a2-pill__name">${esc(row.num)} · ${esc(row.name)}</span>
                      <span class="a2-pill__place">${esc(row.place)} ↗</span>
                    </div>
                    <p class="a2-pill__txt">${esc(row.text)}</p>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (styleId === 'a3') {
      return `
        <div class="a3-monograph">
          <div class="ab-grain" aria-hidden="true"></div>
          <header class="a3-mast">
            <span class="a3-mast__brand">Vanessa Espín</span>
            <span class="a3-mast__role">${esc(bio.eyebrow)}</span>
            <div class="a3-mast__end">
              <button type="button" class="ab-close" data-about-close aria-label="Close About">Close ×</button>
            </div>
          </header>

          <div class="a3-cols">
            <nav class="a3-rail" aria-label="About chapters">
              <div class="a3-chaps">
                <button type="button" class="a3-chap-btn is-current" data-about-chap="a3-purpose"><span>01</span><span>Purpose</span></button>
                <button type="button" class="a3-chap-btn" data-about-chap="a3-room"><span>02</span><span>In the Room</span></button>
                <button type="button" class="a3-chap-btn" data-about-chap="a3-roots"><span>03</span><span>Roots</span></button>
                <button type="button" class="a3-chap-btn" data-about-chap="a3-letter"><span>04</span><span>Dear Artist</span></button>
              </div>
              <div class="a3-rail__foot">
                <span class="ab-eyebrow">New York</span>
                <a class="ab-linkedin" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              </div>
            </nav>

            <div class="a3-plate">
              <figure class="a3-plate__fig">
                <img class="ab-portrait-img" src="../img/portrait.jpg" width="773" height="806" alt="Vanessa Espín at Brooklyn Bridge Park, New York">
                <figcaption class="a3-plate__cap">
                  <span>Vanessa Espín</span>
                  <span>New York</span>
                </figcaption>
              </figure>
            </div>

            <div class="a3-body" data-a3-scroller>
              <section class="a3-sec" id="a3-purpose">
                <span class="ab-eyebrow ab-eyebrow--brass">01 · Purpose</span>
                <h2 class="a3-statement">${esc(bio.statement)}</h2>
                <p class="a3-lead">${esc(bio.door)}</p>
                <p class="a3-hang">${esc(bio.turn)}</p>
              </section>

              <section class="a3-sec" id="a3-room">
                <span class="ab-eyebrow ab-eyebrow--brass" style="margin-bottom:8px;">02 · In the Room</span>
                ${renderStoodRows(bio)}
              </section>

              <section class="a3-sec" id="a3-roots">
                <span class="ab-eyebrow ab-eyebrow--brass" style="margin-bottom:8px;">03 · Roots</span>
                <p class="a3-hang">${esc(bio.home)}</p>
              </section>

              <section class="a3-sec" id="a3-letter">
                <span class="ab-eyebrow ab-eyebrow--brass">04 · ${esc(bio.letterHeading)}</span>
                <div class="a3-letter-box">
                  <p>${esc(bio.letterSalutation)}</p>
                  <p>${esc(bio.letterBody)}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      `;
    }

    if (styleId === 'a4') {
      return `
        <div class="ab-open-bay a4-bay" data-about-bay aria-hidden="true">
          <span class="ab-bay-cue">Experience event →</span>
        </div>
        <div class="a4-alcove">
          <div class="ab-grain" aria-hidden="true"></div>
          <div class="a4-inner">
            <div class="a4-top">
              <span class="ab-eyebrow">Vanessa Espín · About</span>
              <button type="button" class="ab-close" data-about-close aria-label="Close About">Close ×</button>
            </div>

            <div class="a4-header">
              <figure class="a4-portrait-card">
                <img class="ab-portrait-img" src="../img/portrait.jpg" width="773" height="806" alt="Vanessa Espín at Brooklyn Bridge Park, New York">
              </figure>
              <div class="a4-head-copy">
                <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.eyebrow)}</span>
                <h2 class="a4-statement">${esc(bio.statement)}</h2>
                <p class="a4-door">${esc(bio.door)}</p>
              </div>
            </div>

            <div class="ab-brass-rule" aria-hidden="true"></div>

            <div class="a4-cols">
              <div class="a4-left">
                <span class="ab-eyebrow">Purpose &amp; Roots</span>
                <p class="a4-prose">${esc(bio.turn)}</p>
                <p class="a4-prose">${esc(bio.home)}</p>
                <div class="a4-foot">
                  <span class="ab-eyebrow">New York</span>
                  <a class="ab-linkedin" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                </div>
              </div>

              <div class="a4-right">
                <span class="ab-eyebrow">Where I Stood</span>
                ${renderStoodRows(bio, 'a4-stood')}
                <aside class="a4-recess" aria-label="${esc(bio.letterHeading)}">
                  <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.letterHeading)}</span>
                  <p class="a4-recess__txt">${esc(bio.letterSalutation)} ${esc(bio.letterBody)}</p>
                </aside>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (styleId === 'a5') {
      return `
        <div class="a5-stage">
          <canvas class="ab-stipple-canvas" aria-hidden="true"></canvas>
          <div class="ab-grain" aria-hidden="true"></div>
          <div class="a5-inner">
            <div class="a5-top">
              <span class="ab-eyebrow">Vanessa Espín · ${esc(bio.eyebrow)}</span>
              <button type="button" class="ab-close" data-about-close aria-label="Close About">Close ×</button>
            </div>

            <div class="a5-focal">
              <figure class="a5-portrait-frame" data-a5-portrait>
                <img class="ab-portrait-img" src="../img/portrait.jpg" width="773" height="806" alt="Vanessa Espín at Brooklyn Bridge Park, New York">
                <figcaption class="a5-portrait-cap">Vanessa Espín · New York</figcaption>
              </figure>
              <div class="a5-hero-text">
                <span class="ab-eyebrow ab-eyebrow--brass">About</span>
                <h2 class="a5-statement">${esc(bio.statement)}</h2>
                <p class="a5-door">${esc(bio.door)}</p>
              </div>
            </div>

            <div class="a5-catalogue">
              <div class="a5-serif-col">
                <span class="ab-eyebrow ab-eyebrow--brass">Purpose &amp; Roots</span>
                <p class="a5-serif-prose">${esc(bio.turn)}</p>
                <p class="a5-serif-prose">${esc(bio.home)}</p>
              </div>

              <div>
                <span class="ab-eyebrow ab-eyebrow--brass" style="margin-bottom:8px;">Where I Stood</span>
                ${renderStoodRows(bio)}
              </div>

              <aside class="a5-colophon" aria-label="${esc(bio.letterHeading)}">
                <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.letterHeading)}</span>
                <p class="a5-colophon__body">${esc(bio.letterSalutation)} ${esc(bio.letterBody)}</p>
                <div class="a5-colophon__foot">
                  <span class="a5-sig">Vanessa Espín</span>
                  <a class="ab-linkedin" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                </div>
              </aside>
            </div>
          </div>
        </div>
      `;
    }

    if (styleId === 'a6') {
      return `
        <div class="a6-booth">
          <div class="ab-grain" aria-hidden="true"></div>
          <header class="a6-mast">
            <div class="a6-mast__left">
              <span class="a6-mast__title">Vanessa Espín · About</span>
              <span class="ab-eyebrow">${esc(bio.eyebrow)}</span>
            </div>
            <button type="button" class="ab-close" data-about-close aria-label="Close About">Close ×</button>
          </header>

          <div class="a6-bays">
            <section class="a6-bay a6-bay--1" aria-label="Purpose and Portrait">
              <div>
                <span class="ab-eyebrow ab-eyebrow--brass">I · Purpose</span>
                <h2 class="a6-statement">${esc(bio.statement)}</h2>
              </div>
              <figure class="a6-portrait-box">
                <img class="ab-portrait-img" src="../img/portrait.jpg" width="773" height="806" alt="Vanessa Espín at Brooklyn Bridge Park, New York">
              </figure>
              <p class="a6-door">${esc(bio.door)}</p>
            </section>

            <section class="a6-bay a6-bay--2" aria-label="In the Room and Roots">
              <div>
                <span class="ab-eyebrow ab-eyebrow--brass" style="margin-bottom:10px;">II · In the Room</span>
                <div class="a6-monitors">
                  ${bio.stood.map((row) => `
                    <button type="button" class="a6-mon-card" data-stood-item data-ex-idx="${row.exIdx}">
                      <img class="a6-mon-thumb" src="${esc(row.poster)}" alt="${esc(row.name)} poster">
                      <div>
                        <div class="a6-mon-meta">
                          <span class="a6-mon-name">${esc(row.num)} · ${esc(row.name)}</span>
                          <span class="a6-mon-place">${esc(row.place)} →</span>
                        </div>
                        <p class="a6-mon-txt">${esc(row.text)}</p>
                      </div>
                    </button>
                  `).join('')}
                </div>
              </div>

              <div class="a6-roots">
                <span class="ab-eyebrow">Roots &amp; Turn</span>
                <p>${esc(bio.turn)}</p>
                <p>${esc(bio.home)}</p>
              </div>
            </section>

            <section class="a6-bay a6-bay--3" aria-label="${esc(bio.letterHeading)}">
              <span class="ab-eyebrow ab-eyebrow--brass">III · ${esc(bio.letterHeading)}</span>
              <div class="a6-letter-center">
                <p class="a6-letter-sal">${esc(bio.letterSalutation)}</p>
                <p class="a6-letter-body">${esc(bio.letterBody)}</p>
                <div class="a6-letter-sig">— Vanessa Espín</div>
              </div>
              <div class="a6-bay-foot">
                <span class="ab-eyebrow">New York</span>
                <a class="ab-linkedin" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              </div>
            </section>
          </div>
        </div>
      `;
    }

    if (styleId === 'a7') {
      return `
        <div class="a7-desk">
          <div class="ab-grain" aria-hidden="true"></div>
          <header class="a7-bar">
            <span class="ab-eyebrow">Vanessa Espín · ${esc(bio.eyebrow)}</span>
            <button type="button" class="ab-close" data-about-close aria-label="Close About">Close ×</button>
          </header>

          <div class="a7-table">
            <article class="a7-card a7-card--print">
              <div class="a7-photo-mount">
                <span class="a7-corner a7-corner--tl" aria-hidden="true"></span>
                <span class="a7-corner a7-corner--tr" aria-hidden="true"></span>
                <span class="a7-corner a7-corner--bl" aria-hidden="true"></span>
                <span class="a7-corner a7-corner--br" aria-hidden="true"></span>
                <img class="ab-portrait-img" src="../img/portrait.jpg" width="773" height="806" alt="Vanessa Espín at Brooklyn Bridge Park, New York">
              </div>
              <div class="a7-print-meta">
                <span class="a7-print-name">Vanessa Espín</span>
                <span class="ab-eyebrow">Brooklyn Bridge Park · New York</span>
              </div>
            </article>

            <article class="a7-card a7-card--dossier">
              <div class="a7-dossier-hdr">
                <span class="ab-eyebrow ab-eyebrow--brass">About · Purpose First</span>
                <span class="ab-eyebrow">New York</span>
              </div>
              <h2 class="a7-statement">${esc(bio.statement)}</h2>
              <p class="a7-door">${esc(bio.door)}</p>
              <div class="a7-dossier-cols">
                <p>${esc(bio.turn)}</p>
                <p>${esc(bio.home)}</p>
              </div>
              <div class="a7-dossier-stood">
                <span class="ab-eyebrow" style="margin-bottom:5px;">Where I Stood</span>
                ${renderStoodRows(bio)}
              </div>
            </article>

            <article class="a7-card a7-card--note">
              <div>
                <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.letterHeading)}</span>
                <p class="a7-note-sal">${esc(bio.letterSalutation)}</p>
                <p class="a7-note-body">${esc(bio.letterBody)}</p>
                <div class="a7-note-sig">Vanessa Espín</div>
              </div>
              <div class="a7-note-foot">
                <span class="ab-eyebrow">Contact</span>
                <a class="ab-linkedin" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              </div>
            </article>
          </div>
        </div>
      `;
    }

    // Default / a8 — Night-Komorebi Same-Room Plinth
    return `
      <div class="a8-veil" aria-hidden="true"></div>
      <div class="ab-grain" aria-hidden="true"></div>
      <div class="ab-open-bay a8-bay" data-about-bay aria-hidden="true">
        <span class="ab-bay-cue">Experience event →</span>
      </div>

      <div class="a8-plinth">
        <div class="a8-top">
          <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.eyebrow)}</span>
          <button type="button" class="ab-close" data-about-close aria-label="Close About">Close ×</button>
        </div>

        <div class="a8-quote-wrap">
          <h2 class="a8-statement">${esc(bio.statement)}</h2>
        </div>

        <div class="a8-cols">
          <div class="a8-left">
            <div class="a8-portrait-row">
              <figure class="a8-portrait-frame">
                <img class="ab-portrait-img" src="../img/portrait.jpg" width="773" height="806" alt="Vanessa Espín at Brooklyn Bridge Park, New York">
              </figure>
              <p class="a8-door">${esc(bio.door)}</p>
            </div>
            <p class="a8-prose">${esc(bio.turn)}</p>
          </div>

          <div class="a8-right">
            <p class="a8-prose">${esc(bio.home)}</p>
            <div>
              <span class="ab-eyebrow" style="margin-bottom:6px;">Where I Stood</span>
              ${renderStoodRows(bio)}
            </div>
            <aside class="a8-letter" aria-label="${esc(bio.letterHeading)}">
              <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.letterHeading)}</span>
              <p class="a8-letter__body">${esc(bio.letterSalutation)} ${esc(bio.letterBody)}</p>
            </aside>
            <div class="a8-foot">
              <span class="ab-eyebrow">Vanessa Espín · New York</span>
              <a class="ab-linkedin" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function syncStippleCanvasSize() {
    if (!stippleCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(window.innerWidth * dpr));
    const h = Math.max(1, Math.round(window.innerHeight * dpr));
    if (stippleCanvas.width !== w || stippleCanvas.height !== h) {
      stippleCanvas.width = w;
      stippleCanvas.height = h;
    }
    const frame = stageEl.querySelector('[data-a5-portrait]');
    if (frame) {
      const r = frame.getBoundingClientRect();
      if (r.width > 20 && r.height > 20) {
        portraitAnchor = {
          cx: r.left + r.width * 0.5,
          cy: r.top + r.height * 0.48,
          r0: Math.max(132, r.width * 0.68),
          valid: true,
        };
        return;
      }
    }
    portraitAnchor = {
      cx: window.innerWidth * 0.24,
      cy: window.innerHeight * 0.38,
      r0: Math.min(window.innerWidth, window.innerHeight) * 0.19,
      valid: false,
    };
  }

  function drawStippleField(nowMs) {
    if (currentStyle !== 'a5' || !stippleCanvas || !stippleCtx) return;
    if (!portraitAnchor.valid) syncStippleCanvasSize();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = stippleCanvas.width;
    const H = stippleCanvas.height;
    const g = stippleCtx;
    const tSec = reducedMotion ? 2.4 : nowMs * 0.001;
    const bloom = clamp01(0.25 + 0.75 * mix);

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    g.save();
    g.scale(dpr, dpr);

    const cx = portraitAnchor.cx;
    const cy = portraitAnchor.cy;
    const R0 = portraitAnchor.r0 * (0.86 + 0.14 * bloom);

    // Warm chiaroscuro radial amber glow behind portrait & headline
    const glow = g.createRadialGradient(cx, cy, R0 * 0.15, cx + R0 * 0.35, cy, R0 * 2.35);
    glow.addColorStop(0, `rgba(224, 162, 86, ${(0.11 * bloom).toFixed(3)})`);
    glow.addColorStop(0.45, `rgba(182, 122, 58, ${(0.055 * bloom).toFixed(3)})`);
    glow.addColorStop(1, 'rgba(12, 9, 7, 0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const breathe = 1 + (reducedMotion ? 0 : 0.022 * Math.sin(tSec * 0.85));

    for (let i = 0; i < stippleParticles.length; i++) {
      const p = stippleParticles[i];
      const ang = p.ang + (reducedMotion ? 0 : Math.sin(tSec * p.speed * 0.45 + p.phase) * 0.045);
      const radDist = R0 * p.rScale * breathe;
      const dx = (reducedMotion ? 0 : Math.cos(tSec * p.speed + p.phase) * p.drift);
      const dy = (reducedMotion ? 0 : Math.sin(tSec * p.speed * 0.82 + p.phase * 1.3) * p.drift);

      const x = cx + R0 * p.ox + Math.cos(ang) * radDist * p.ex + dx;
      const y = cy + R0 * p.oy + Math.sin(ang) * radDist * p.ey + dy;

      const twinkle = reducedMotion ? 1 : (0.78 + 0.22 * Math.sin(tSec * p.speed * 1.6 + p.phase));
      const a = p.alpha * twinkle * bloom;
      if (a <= 0.004) continue;

      const rCol = Math.round(lerp(226, 246, p.warmth));
      const gCol = Math.round(lerp(172, 212, p.warmth));
      const bCol = Math.round(lerp(96, 146, p.warmth));

      if (p.kind === 'mote') {
        const mg = g.createRadialGradient(x, y, 0, x, y, p.rad * 2.2);
        mg.addColorStop(0, `rgba(${rCol},${gCol},${bCol},${(a * 1.15).toFixed(3)})`);
        mg.addColorStop(1, `rgba(${rCol},${gCol},${bCol},0)`);
        g.fillStyle = mg;
        g.beginPath();
        g.arc(x, y, p.rad * 2.2, 0, Math.PI * 2);
        g.fill();
      } else {
        g.fillStyle = `rgba(${rCol},${gCol},${bCol},${a.toFixed(3)})`;
        g.beginPath();
        g.arc(x, y, p.rad, 0, Math.PI * 2);
        g.fill();
      }
    }

    g.restore();
  }

  function syncActiveExhibitionHighlight(force = false) {
    const activeEx = ctx?.getState?.()?.active ?? -1;
    if (!force && activeEx === lastSyncedActiveEx) return;
    lastSyncedActiveEx = activeEx;
    stageEl.querySelectorAll('[data-stood-item]').forEach((el) => {
      el.classList.toggle('is-active-ex', Number(el.dataset.exIdx) === activeEx);
    });
  }

  function mountStyleDOM(styleId, replayAnim = false) {
    const styleChanged = renderedStyle !== styleId;
    if (styleChanged) {
      stageEl.dataset.about = styleId;
      stageEl.innerHTML = renderConceptMarkup(styleId);
      renderedStyle = styleId;
      stippleCanvas = stageEl.querySelector('.ab-stipple-canvas');
      stippleCtx = stippleCanvas ? stippleCanvas.getContext('2d') : null;
      portraitAnchor.valid = false;
      if (stippleCanvas) {
        syncStippleCanvasSize();
        drawStippleField(performance.now());
      }
    } else if (replayAnim && !bootSnapActive) {
      stageEl.classList.remove('is-open');
      void stageEl.offsetWidth;
    }
    syncActiveExhibitionHighlight(true);
  }

  function isOverShiftedPoster(clientX, clientY) {
    if (!POSTER_BAY_STYLES.has(currentStyle)) return false;
    if (window.innerWidth < 860) return false;
    if (typeof ctx?.hitTestPoster === 'function') {
      return Boolean(ctx.hitTestPoster(clientX, clientY));
    }
    if (typeof ctx?.hitTestSheets === 'function') {
      return ctx.hitTestSheets(clientX, clientY) >= 0;
    }
    const tgt = ROOM_TARGETS[currentStyle];
    if (!tgt) return false;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = (0.512 + tgt.posterShiftX) * vw;
    const cy = 0.535 * vh;
    const hPx = 0.55 * tgt.posterScale * vh;
    const wPx = hPx * 0.80;
    return Math.abs(clientX - cx) <= wPx * 0.54 && Math.abs(clientY - cy) <= hPx * 0.54;
  }

  function enterExhibitionFromAbout(exIdx) {
    const safeIdx = Number.isFinite(exIdx) ? exIdx : (ctx?.getState?.()?.active ?? 0);
    if (typeof ctx?.enterFilmFromAbout === 'function') {
      ctx.enterFilmFromAbout(safeIdx);
    } else {
      close();
      ctx?.enterFilm?.(safeIdx);
    }
  }

  // Delegated event listeners on #aboutStage
  stageEl.addEventListener('click', (e) => {
    if (!isOpenBool) return;

    if (e.target.closest('[data-about-close]')) {
      e.preventDefault();
      close();
      return;
    }

    const stoodBtn = e.target.closest('[data-stood-item]');
    if (stoodBtn) {
      e.preventDefault();
      const idx = Number(stoodBtn.dataset.exIdx);
      enterExhibitionFromAbout(idx);
      return;
    }

    const chapBtn = e.target.closest('[data-about-chap]');
    if (chapBtn) {
      e.preventDefault();
      const targetId = chapBtn.dataset.aboutChap;
      stageEl.querySelectorAll('[data-about-chap]').forEach((b) => b.classList.toggle('is-current', b === chapBtn));
      const sec = stageEl.querySelector(`#${targetId}`);
      sec?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    const bayEl = e.target.closest('[data-about-bay]');
    if (bayEl && OPEN_BAY_STYLES.has(currentStyle)) {
      if (isOverShiftedPoster(e.clientX, e.clientY)) {
        const activeIdx = ctx?.getState?.()?.active ?? 0;
        enterExhibitionFromAbout(activeIdx);
      } else {
        close();
      }
    }
  });

  stageEl.addEventListener('pointerover', (e) => {
    if (!isOpenBool) return;
    const stoodBtn = e.target.closest('[data-stood-item]');
    if (stoodBtn) {
      const idx = Number(stoodBtn.dataset.exIdx);
      if (Number.isFinite(idx) && idx !== lastHoveredEx) {
        lastHoveredEx = idx;
        ctx?.goToExhibition?.(idx);
        syncActiveExhibitionHighlight(true);
      }
    }
  });

  stageEl.addEventListener('pointerleave', () => {
    lastHoveredEx = -99;
  });

  stageEl.addEventListener('pointermove', (e) => {
    if (!isOpenBool || !POSTER_BAY_STYLES.has(currentStyle)) return;
    const bayEl = e.target.closest('[data-about-bay]');
    if (!bayEl) return;
    bayEl.classList.toggle('is-over-poster', isOverShiftedPoster(e.clientX, e.clientY));
  });

  stageEl.addEventListener('focusin', (e) => {
    if (!isOpenBool) return;
    const stoodBtn = e.target.closest('[data-stood-item]');
    if (stoodBtn) {
      const idx = Number(stoodBtn.dataset.exIdx);
      if (Number.isFinite(idx)) {
        ctx?.goToExhibition?.(idx);
        syncActiveExhibitionHighlight(true);
      }
    }
  });

  window.addEventListener('resize', () => {
    portraitAnchor.valid = false;
    if (currentStyle === 'a5' && stippleCanvas && (isOpenBool || mix > 0.01)) {
      syncStippleCanvasSize();
      drawStippleField(performance.now());
    }
  });

  function computeRoomMode(styleId, m) {
    if (m <= 0.00001) {
      return { ...ZERO_ROOM_MODE };
    }
    const tgt = ROOM_TARGETS[styleId] || ROOM_TARGETS.a1;
    const prev = ROOM_TARGETS[prevRoomStyle] || tgt;
    const b = styleBlend >= 0.999 ? 1 : EASE_GLIDE(styleBlend);

    const dimWall = lerp(prev.dimWall, tgt.dimWall, b) * m;
    const posterShiftX = lerp(prev.posterShiftX, tgt.posterShiftX, b) * m;
    const blendedScale = lerp(prev.posterScale, tgt.posterScale, b);
    const posterScale = 1 + (blendedScale - 1) * m;
    const sideFade = lerp(prev.sideFade, tgt.sideFade, b) * m;
    const nightKomorebi = lerp(prev.nightKomorebi, tgt.nightKomorebi, b) * m;
    const cameraZOffset = lerp(prev.cameraZOffset, tgt.cameraZOffset, b) * m;

    const desktop3D = typeof window === 'undefined' || window.innerWidth >= 860;
    const rawPortrait = desktop3D ? lerp(prev.show3DPortrait, tgt.show3DPortrait, b) * m : 0;
    const show3DPortrait = rawPortrait > 0.0001 ? rawPortrait : 0;
    const activePose = tgt.portraitPose || prev.portraitPose;
    const portraitPose = (show3DPortrait > 0 && activePose) ? { ...activePose } : null;

    return {
      dimWall,
      posterShiftX,
      posterScale,
      sideFade,
      show3DPortrait,
      portraitPose,
      nightKomorebi,
      cameraZOffset,
    };
  }

  function setStyle(styleId) {
    if (!VALID_IDS.has(styleId)) return;
    if (styleId !== currentStyle) {
      prevRoomStyle = currentStyle;
      currentStyle = styleId;
      styleBlend = (bootSnapActive || !isOpenBool || reducedMotion) ? 1 : 0;
    }
    mountStyleDOM(currentStyle, false);
    if (isOpenBool) {
      stageEl.classList.remove('is-closing');
      stageEl.classList.toggle('is-instant', bootSnapActive);
      stageEl.classList.add('is-open');
      if (currentStyle === 'a5') {
        syncStippleCanvasSize();
        drawStippleField(performance.now());
      }
    }
    ctx?.requestRender?.();
  }

  function open(styleId) {
    const nextStyle = VALID_IDS.has(styleId) ? styleId : currentStyle;
    const wasOpen = isOpenBool;
    if (nextStyle !== currentStyle) {
      prevRoomStyle = wasOpen ? currentStyle : nextStyle;
      currentStyle = nextStyle;
      styleBlend = (bootSnapActive || !wasOpen || reducedMotion) ? 1 : 0;
    }

    isOpenBool = true;
    lastHoveredEx = -99;
    mountStyleDOM(currentStyle, !wasOpen);

    stageEl.classList.remove('is-closing');
    stageEl.classList.toggle('is-instant', bootSnapActive);
    stageEl.setAttribute('aria-hidden', 'false');
    stageEl.classList.add('is-open');

    if (bootSnapActive || reducedMotion) {
      rawMix = 1;
      mix = 1;
      styleBlend = 1;
    }

    if (currentStyle === 'a5') {
      syncStippleCanvasSize();
      drawStippleField(performance.now());
    }
    ctx?.requestRender?.();
  }

  function close() {
    if (!isOpenBool && rawMix <= 0.0001) return;
    clearBootSnap();
    isOpenBool = false;
    lastHoveredEx = -99;
    stageEl.classList.remove('is-open');
    if (reducedMotion || rawMix <= 0.01) {
      rawMix = 0;
      mix = 0;
      stageEl.classList.remove('is-closing');
      stageEl.setAttribute('aria-hidden', 'true');
    } else {
      stageEl.classList.add('is-closing');
      stageEl.setAttribute('aria-hidden', 'true');
    }
    ctx?.requestRender?.();
    // Tell the landing, whichever way About was closed (its own Close button and a click outside end here too).
    // Without this the landing kept behaving as if About were open: the address stayed on #about and the masthead stayed covered.
    ctx?.onCloseStateChange?.(false);
  }

  function tick(nowMs = performance.now(), dtArg = 1 / 60) {
    let dt = typeof dtArg === 'number' && Number.isFinite(dtArg) ? dtArg : 1 / 60;
    if (dt > 1) dt *= 0.001; // guard if caller passed milliseconds
    dt = clamp(dt, 0, 0.05);

    if (bootSnapActive && isOpenBool) {
      rawMix = 1;
      mix = 1;
      styleBlend = 1;
    } else if (isOpenBool) {
      if (rawMix < 1) {
        const dur = getActiveDuration();
        rawMix = clamp01(rawMix + dt / Math.max(0.01, dur));
        mix = EASE_GLIDE(rawMix);
      } else {
        rawMix = 1;
        mix = 1;
      }
      if (styleBlend < 1) {
        styleBlend = clamp01(styleBlend + dt / 0.46);
      }
    } else if (rawMix > 0) {
      rawMix = clamp01(rawMix - dt / 0.44);
      mix = 1 - EASE_CLOSE(1 - rawMix);
      if (rawMix <= 0.0005) {
        rawMix = 0;
        mix = 0;
        stageEl.classList.remove('is-closing');
      }
    }

    if (isOpenBool) {
      syncActiveExhibitionHighlight(false);
    }
    if (currentStyle === 'a5' && (isOpenBool || mix > 0.01)) {
      drawStippleField(nowMs);
    }
  }

  // Initial mount (ready immediately; settled at mix=1 if ?openbio=1)
  mountStyleDOM(currentStyle, false);
  if (bootSnapActive) {
    stageEl.classList.add('is-instant', 'is-open');
    if (currentStyle === 'a5') {
      syncStippleCanvasSize();
      drawStippleField(performance.now());
    }
  }

  return {
    open,
    close,
    setStyle,
    isOpen: () => isOpenBool,
    getStyle: () => currentStyle,
    getMix: () => mix,
    getRoomMode: () => computeRoomMode(currentStyle, mix),
    tick,
  };
}
