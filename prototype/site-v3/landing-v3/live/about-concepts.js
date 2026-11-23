// Vanessa Espín — 8 Divergent Dark-Gallery About Visual & Animation Concepts (a1–a8)
// Pure vanilla ES module: zero external dependencies, 100% approved verbatim copy, 60fps choreography.

export const ABOUT_CONCEPTS = [
  { id: 'a9', short: 'A9 · Landing Komorebi + Wash ★', name: 'Unified Landing C1 Komorebi + Wash Salon', dur: 0.52 },
  { id: 'a1', short: 'A1 · Asymmetric Salon', name: 'Lights-Go-Off Asymmetric Salon', dur: 0.54 },
  { id: 'a2', short: 'A2 · 3D Portrait Sheet', name: '3D WebGL Portrait Sheet & Nocturne Wall', dur: 0.58 },
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
  quote: '“A well told and organized visual story can transform vision into impact.”',
  roleTitle: 'Brand Curator of Events & Experiences',
  statement: 'A well told and organized visual story can transform vision into impact.',
  eyebrow: 'Brand Curator of Events & Experiences · New York',
  door: 'I’m a New York-based Brand Curator of Events & Experiences, driven by the belief that the way we bring people, stories, and ideas together can move us toward meaningful change.',
  aboutParagraphs: [
    'I’m a New York-based Brand Curator of Events & Experiences, driven by the belief that the way we bring people, stories, and ideas together can move us toward meaningful change.',
    'My work lives at the intersection of culture, creativity, and community. I approach every project with a curiosity for people and the stories that shape them, bringing together the right voices, creative perspectives, and environments to create experiences that resonate beyond the moment.',
    'Rooted in New York’s Latin American arts community, I’ve collaborated with cultural organizations, independent artists, and creative teams to bring ideas to life through exhibitions, live performances, and community-driven gatherings. From producing cultural programs and coordinating artist collaborations to shaping visual identities, developing partnerships, and hosting events, I enjoy working across the many layers that turn a vision into a shared experience.',
    'My creative foundation comes from five years of agency experience in art direction, brand storytelling, and visual strategy. Over time, I’ve found myself drawn beyond the screen and into the spaces where brands, culture, and people meet. Today, I bring that visual sensibility and strategic perspective into the curation and production of experiences, with an appreciation for the details that make a gathering feel intentional and meaningful.',
    'At the heart of it all is a simple belief: A well told and organized visual story can transform vision into impact.',
    'I’m interested in working with people and organizations who share that ambition, particularly those using creativity as a tool for cultural connection, positive impact, and a more thoughtful world.',
  ],
  clientKicker: 'For Clients & Collaborators',
  clientHeading: 'Working With Vanessa',
  clientParagraphs: [
    'Vanessa is a creative dedicated to organizing, clarifying, and positioning personal and experiential brands with purpose. She specializes in person-centered creative services that transform ideas, stories, and initiatives into cohesive visual identities with a strong voice and presence.',
    'What sets her apart is her ability to distill complex stories into experiences that are clear, engaging, and authentic to the people behind them. Every creative decision is rooted in your original intention, ensuring your brand not only resonates with your audience but also remains true to its purpose.',
    'She synthesizes your vision into thoughtful visual systems that communicate who you are, what you stand for, and why your work matters. Whether you’re an individual, artist, founder, or cultural initiative, Vanessa helps your story become something people can understand, remember, and connect with.',
  ],
  stood: [
    {
      exIdx: 2,
      name: 'Ayazamana',
      place: 'Queens, NYC',
      text: 'At Ayazamana I was in the tech room above the stage, handling the visuals that came up after every dance.',
    },
    {
      exIdx: 0,
      name: 'Iyuana',
      place: 'Queens, Brooklyn, NYC',
      text: 'At Iyuana I made sure Yanda, a member of the Sápara Nation, told his story himself.',
    },
    {
      exIdx: 1,
      name: 'Herencia Viva',
      place: 'Manhattan, Queens, NYC',
      text: 'At Herencia Viva, if I could go back for five minutes, I’d stand in front of the Ecuadorian Mona Lisa.',
    },
  ],
  home: 'Rooted in New York’s Latin American arts community, I’ve collaborated with cultural organizations, independent artists, and creative teams to bring ideas to life through exhibitions, live performances, and community-driven gatherings.',
  turn: 'My creative foundation comes from five years of agency experience in art direction, brand storytelling, and visual strategy. Over time, I’ve found myself drawn beyond the screen and into the spaces where brands, culture, and people meet.',
  letterHeading: 'For Clients & Collaborators',
  letterSalutation: 'Working With Vanessa',
  letterBody: 'Vanessa is a creative dedicated to organizing, clarifying, and positioning personal and experiential brands with purpose. Whether you’re an individual, artist, founder, or cultural initiative, Vanessa helps your story become something people can understand, remember, and connect with.',
  contactRelayUrl: '',
  linkedin: 'https://www.linkedin.com/in/vanessaespin',
};

const FALLBACK_POSTERS = {
  0: '../img/iyuana.jpg',
  1: '../img/herencia-viva-ayllu.png',
  2: '../img/ayazamana.png?v=20261123a',
};

const ZERO_ROOM_MODE = {
  dimWall: 0,
  posterShiftX: 0,
  posterScale: 1,
  sideFade: 0,
  centerFade: 0,
  show3DPortrait: 0,
  portraitPose: null,
  nightKomorebi: 0,
  cameraZOffset: 0,
};

const PORTRAIT_POSE_A2 = { x: -0.22, y: 0.02, z: 0.35, ry: 0.16, s: 0.53 };

const ROOM_TARGETS = {
  a9: { dimWall: 1.0, posterShiftX: 0, posterScale: 0.94, sideFade: 1.0, centerFade: 1.0, show3DPortrait: 0, portraitPose: null, nightKomorebi: 1.0, cameraZOffset: 0.45 },
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

function highlightPhrases(str, phrases = []) {
  const src = String(str ?? '');
  if (!phrases.length) return esc(src);
  const ranges = [];
  for (const ph of phrases) {
    if (!ph) continue;
    const idx = src.indexOf(ph);
    if (idx !== -1) {
      ranges.push([idx, idx + ph.length]);
    }
  }
  if (!ranges.length) return esc(src);
  ranges.sort((a, b) => a[0] - b[0]);
  let out = '';
  let cur = 0;
  for (const [s, e] of ranges) {
    if (s < cur) continue;
    out += esc(src.slice(cur, s));
    out += `<strong class="a9m-hi">${esc(src.slice(s, e))}</strong>`;
    cur = e;
  }
  out += esc(src.slice(cur));
  return out;
}

const ABOUT_HIGHLIGHTS = [
  ['Brand Curator of Events & Experiences'],
  ['intersection of culture, creativity, and community', 'experiences that resonate beyond the moment'],
  [
    'New York’s Latin American arts community',
    'exhibitions, live performances, and community-driven gatherings',
  ],
  ['art direction, brand storytelling, and visual strategy'],
  [],
  ['cultural connection, positive impact'],
];

const CLIENT_HIGHLIGHTS = [
  [
    'personal and experiential brands with purpose',
    'cohesive visual identities',
  ],
  [
    'clear, engaging, and authentic',
    'rooted in your original intention',
  ],
  [
    'thoughtful visual systems',
  ],
];

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
  link.href = 'about-concepts.css?v=20261122q';
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

  const arr = (key) => (Array.isArray(raw[key]) && raw[key].length > 0 ? raw[key] : DEFAULT_BIO[key]);

  return {
    quote: str('quote'),
    roleTitle: str('roleTitle'),
    statement: str('statement'),
    eyebrow: str('eyebrow'),
    door: str('door'),
    aboutParagraphs: arr('aboutParagraphs'),
    clientKicker: str('clientKicker'),
    clientHeading: str('clientHeading'),
    clientParagraphs: arr('clientParagraphs'),
    stood: withPosters,
    home: str('home'),
    turn: str('turn'),
    letterHeading: str('letterHeading'),
    letterSalutation: str('letterSalutation'),
    letterBody: str('letterBody'),
    contactRelayUrl: typeof raw.contactRelayUrl === 'string' ? raw.contactRelayUrl.trim() : '',
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
  const initialCandidate = ctx?.initialStyle || paramStyle || 'a9';
  let currentStyle = VALID_IDS.has(initialCandidate) ? initialCandidate : 'a9';
  let currentCardMood = ['f1', 'f2', 'f3'].includes(searchParams.get('card')) ? searchParams.get('card') : 'f1';

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
  stageEl.dataset.cardMood = currentCardMood;

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

    if (styleId === 'a9') {
      const aboutParasHTML = bio.aboutParagraphs.map((p, idx) => {
        const beliefPhrase = 'A well told and organized visual story can transform vision into impact.';
        if (p.includes(beliefPhrase)) {
          const pos = p.indexOf(beliefPhrase);
          const intro = p.slice(0, pos).trim();
          const tail = p.slice(pos + beliefPhrase.length);
          return `
            <aside class="a9m-callout" aria-label="Core belief">
              ${intro ? `<span class="a9m-callout__lead">${esc(intro)}</span>` : ''}
              <p class="a9m-callout__quote">${esc(beliefPhrase)}${esc(tail)}</p>
            </aside>
          `;
        }
        const hi = ABOUT_HIGHLIGHTS[idx] || [];
        return `<p class="a9m-prose ${idx === 0 ? 'a9m-prose--lead' : ''}">${highlightPhrases(p, hi)}</p>`;
      }).join('');

      const clientParasHTML = bio.clientParagraphs.map((p, idx) => {
        const hi = CLIENT_HIGHLIGHTS[idx] || [];
        return `<p class="a9m-studio-p">${highlightPhrases(p, hi)}</p>`;
      }).join('');

      return `
        <div class="a9m-stage-grain" aria-hidden="true"></div>
        <div class="a9m-stage" data-about-scroll>
          <div class="a9m-wrap">
            <header class="a9m-topbar">
              <button type="button" class="a9m-brand" data-about-close>Vanessa Espín</button>
              <button type="button" class="ab-close a9-close" data-about-close aria-label="Close About Me">← Back to Work</button>
            </header>

            <div class="a9m-grid">
              <aside class="a9m-rail" aria-label="Portrait and direct contact">
                <figure class="a9m-portrait-card">
                  <img class="ab-portrait-img" src="../img/about-me.jpg" width="1290" height="1930" alt="Vanessa Espín speaking with a visitor at Herencia Viva in Queens, New York">
                  <figcaption class="a9m-portrait-cap">Herencia Viva · Queens, NYC</figcaption>
                </figure>

                <div class="a9m-rail-meta">
                  <span class="a9m-rail-name">Vanessa Espín</span>
                  <span class="a9m-rail-role">${esc(bio.roleTitle)} · New York</span>
                </div>

                <div class="a9m-rail-actions">
                  <button type="button" class="a9m-btn a9m-btn--solid" data-about-chap="abContact">Send a Message ↓</button>
                  <a class="a9m-btn a9m-btn--ghost" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                </div>
              </aside>

              <main class="a9m-main">
                <section class="a9m-sec" aria-labelledby="abMeHeading">
                  <div class="a9m-sec-head">
                    <span class="ab-eyebrow">About Me</span>
                    <h2 class="a9m-sec-title" id="abMeHeading">${esc(bio.roleTitle)}</h2>
                  </div>
                  <div class="a9m-prose-stack">
                    ${aboutParasHTML}
                  </div>
                </section>

                <section class="a9m-studio-card" aria-labelledby="abStudioHeading">
                  <div class="a9m-studio-aura" aria-hidden="true">
                    <span class="a9m-orb a9m-orb--1"></span>
                    <span class="a9m-orb a9m-orb--2"></span>
                    <span class="a9m-orb a9m-orb--3"></span>
                  </div>
                  <div class="a9m-studio-grain" aria-hidden="true"></div>
                  <div class="a9m-studio-inner">
                    <div class="a9m-studio-head">
                      <span class="ab-eyebrow">${esc(bio.clientKicker)}</span>
                      <h3 class="a9m-studio-title" id="abStudioHeading">${esc(bio.clientHeading)}</h3>
                    </div>
                    <div class="a9m-studio-prose">
                      ${clientParasHTML}
                    </div>
                  </div>
                </section>

                <section class="a9m-contact" id="abContact" aria-labelledby="abContactHeading">
                  <div class="a9m-sec-head">
                    <span class="ab-eyebrow">Get in Touch</span>
                    <h3 class="a9m-sec-title" id="abContactHeading">Inquiries &amp; Collaborations</h3>
                    <p class="a9m-contact-sub">Share a few details about your exhibition, brand identity, or collaboration below, or connect directly on LinkedIn.</p>
                  </div>

                  <form class="a9m-form" data-about-contact-form novalidate>
                    <input type="text" name="_gotcha" class="a9m-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
                    <div class="a9m-form-row">
                      <label class="a9m-field">
                        <span>Your Name</span>
                        <input type="text" name="name" id="abContactName" required autocomplete="name" placeholder="Jane Doe">
                      </label>
                      <label class="a9m-field">
                        <span>Your Email</span>
                        <input type="email" name="email" required autocomplete="email" placeholder="you@organization.com">
                      </label>
                    </div>

                    <label class="a9m-field">
                      <span>Organization or Project <em>(optional)</em></span>
                      <input type="text" name="organization" autocomplete="organization" placeholder="Gallery, brand, artist, or cultural initiative">
                    </label>

                    <label class="a9m-field">
                      <span>Message</span>
                      <textarea name="message" rows="4" required placeholder="Tell me about the story, event, or brand experience you have in mind…"></textarea>
                    </label>

                    <div class="a9m-form-actions">
                      <button type="submit" class="a9m-btn a9m-btn--solid" data-contact-submit>Send Message →</button>
                      <a class="a9m-btn a9m-btn--ghost" href="${esc(bio.linkedin)}" target="_blank" rel="noopener noreferrer">Message on LinkedIn ↗</a>
                    </div>

                    <div class="a9m-form-status" data-contact-status role="status" aria-live="polite" hidden></div>
                  </form>
                </section>
              </main>
            </div>
          </div>
        </div>
      `;
    }

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
                <img class="ab-portrait-img" src="../img/about-me.jpg" width="1290" height="1930" alt="Vanessa Espín with a visitor at Herencia Viva in Queens, New York">
                <figcaption class="a1-mat__cap">Herencia Viva · Queens, NYC</figcaption>
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
          <span class="a2-3d-caption__sub">Herencia Viva · Queens, NYC</span>
        </div>

        <div class="a2-float">
          <div class="a2-top a2-stagger-1">
            <span class="ab-eyebrow ab-eyebrow--brass">${esc(bio.eyebrow)}</span>
            <button type="button" class="ab-close" data-about-close aria-label="Close About">Close ×</button>
          </div>

          <figure class="a2-mobile-portrait">
            <img class="ab-portrait-img" src="../img/about-me.jpg" width="1290" height="1930" alt="Vanessa Espín with a visitor at Herencia Viva in Queens, New York">
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
                <img class="ab-portrait-img" src="../img/about-me.jpg" width="1290" height="1930" alt="Vanessa Espín with a visitor at Herencia Viva in Queens, New York">
                <figcaption class="a3-plate__cap">
                  <span>Vanessa Espín</span>
                  <span>Queens, NYC</span>
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
                <img class="ab-portrait-img" src="../img/about-me.jpg" width="1290" height="1930" alt="Vanessa Espín with a visitor at Herencia Viva in Queens, New York">
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
                <img class="ab-portrait-img" src="../img/about-me.jpg" width="1290" height="1930" alt="Vanessa Espín with a visitor at Herencia Viva in Queens, New York">
                <figcaption class="a5-portrait-cap">Herencia Viva · Queens, NYC</figcaption>
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
                <img class="ab-portrait-img" src="../img/about-me.jpg" width="1290" height="1930" alt="Vanessa Espín with a visitor at Herencia Viva in Queens, New York">
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
                <img class="ab-portrait-img" src="../img/about-me.jpg" width="1290" height="1930" alt="Vanessa Espín with a visitor at Herencia Viva in Queens, New York">
              </div>
              <div class="a7-print-meta">
                <span class="a7-print-name">Vanessa Espín</span>
                <span class="ab-eyebrow">Herencia Viva · Queens, NYC</span>
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
                <img class="ab-portrait-img" src="../img/about-me.jpg" width="1290" height="1930" alt="Vanessa Espín with a visitor at Herencia Viva in Queens, New York">
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
          r0: Math.max(142, Math.hypot(r.width, r.height) * 0.44),
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
      if (targetId === 'abContact') {
        setTimeout(() => stageEl.querySelector('#abContactName')?.focus({ preventScroll: true }), reducedMotion ? 20 : 380);
      }
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

  stageEl.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-about-contact-form]');
    if (!form) return;
    e.preventDefault();

    const statusEl = form.querySelector('[data-contact-status]');
    const submitBtn = form.querySelector('[data-contact-submit]');
    const showStatus = (msg, isError = false) => {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.classList.toggle('is-error', isError);
      statusEl.textContent = msg;
    };

    const fd = new FormData(form);
    if (String(fd.get('_gotcha') || '').trim()) {
      form.reset();
      showStatus('Thank you — your message has been received.');
      return;
    }

    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const organization = String(fd.get('organization') || '').trim();
    const message = String(fd.get('message') || '').trim();

    if (!name || !email || !email.includes('@') || !message) {
      showStatus('Please enter your name, a valid email address, and a brief message.', true);
      return;
    }

    const bio = resolveBio(ctx);
    const relayUrl = bio.contactRelayUrl;

    if (!relayUrl) {
      showStatus('Inquiry captured in preview mode — connect a Formspree relay ID in data.js before launch, or message Vanessa directly on LinkedIn.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }
    try {
      const res = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, organization, message }),
      });
      if (res.ok) {
        form.reset();
        showStatus('Thank you — your message has been sent to Vanessa.');
      } else {
        showStatus('Could not send right now — please reach out via LinkedIn while we check the form.', true);
      }
    } catch {
      showStatus('Network error — please reach out via LinkedIn and try again shortly.', true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message →';
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
    const centerFade = lerp(prev.centerFade || 0, tgt.centerFade || 0, b) * m;
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
      centerFade,
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

  let closeCleanupTimer = 0;

  function open(styleId) {
    clearTimeout(closeCleanupTimer);
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
    if (!wasOpen) {
      const scroller = stageEl.querySelector('[data-about-scroll]');
      if (scroller) scroller.scrollTop = 0;
    }

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

  function close({ notify = true } = {}) {
    if (!isOpenBool && rawMix <= 0.0001) {
      stageEl.classList.remove('is-open', 'is-closing');
      stageEl.setAttribute('aria-hidden', 'true');
      return;
    }
    clearTimeout(closeCleanupTimer);
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
      closeCleanupTimer = setTimeout(() => {
        if (!isOpenBool) {
          rawMix = 0;
          mix = 0;
          stageEl.classList.remove('is-closing');
        }
      }, 480);
    }
    ctx?.requestRender?.();
    // Tell the landing, whichever way About was closed (its own Close button and a click outside end here too).
    // Without this the landing kept behaving as if About were open: the address stayed on #about and the masthead stayed covered.
    if (notify) ctx?.onCloseStateChange?.(false);
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

  function setCardMood(moodId) {
    if (!['f1', 'f2', 'f3'].includes(moodId)) return;
    currentCardMood = moodId;
    stageEl.dataset.cardMood = moodId;
  }

  return {
    open,
    close,
    setStyle,
    setCardMood,
    getCardMood: () => currentCardMood,
    isOpen: () => isOpenBool,
    isClosing: () => stageEl.classList.contains('is-closing') || rawMix > 0,
    getStyle: () => currentStyle,
    getMix: () => mix,
    getRoomMode: () => computeRoomMode(currentStyle, mix),
    tick,
  };
}
