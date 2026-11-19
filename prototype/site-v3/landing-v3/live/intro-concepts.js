// Vanessa Espín — Landing v3 Loading Overture / Intro Concepts (o1–o6)
// Self-contained ES module: zero dependencies, 60fps Canvas + GPU-composited DOM,
// deterministic ?introPreview=0..1 freeze support, and skippable fast-forward.

export const INTRO_CONCEPTS = [
  {
    id: 'o1',
    short: 'O1 · Komorebi Dawn ★',
    label: 'O1 · Komorebi Dawn ★',
    name: 'Komorebi Dawn & Rising Prints',
    pick: true,
    desc: 'Nocturnal umber & brass thread melting into golden sunbeams as the 3D prints rise and uncurl.',
  },
  {
    id: 'o2',
    short: 'O2 · 3-Print Deal ★',
    label: 'O2 · 3-Print Deal ★',
    name: 'Three-Print Deal',
    pick: true,
    desc: 'Three uncropped miniature exhibition prints deal out on charcoal linen, then glide into the 3D carousel.',
  },
  {
    id: 'o3',
    short: 'O3 · Wet-Edge Bloom',
    label: 'O3 · Wet-Edge Bloom',
    name: 'Watercolour Wet-Edge Bloom',
    desc: 'Warm archival cotton paper & ink registration hairline blooming open with a pigmented watercolour rim.',
  },
  {
    id: 'o4',
    short: 'O4 · Velvet Curtain',
    label: 'O4 · Velvet Curtain',
    name: 'Theatre Velvet Fly-Curtain',
    desc: 'Deep espresso stage curtain with bottom footlight glow lifting briskly upward over the lit gallery.',
  },
  {
    id: 'o5',
    short: 'O5 · Pin-Spot Iris',
    label: 'O5 · Pin-Spot Iris',
    name: 'Pin-Spot Aperture on Poster',
    desc: 'Dark room glimmer opening first to spotlight just the centred 3D poster, then illuminating the room.',
  },
  {
    id: 'o6',
    short: 'O6 · Purpose Line',
    label: 'O6 · Purpose Line',
    name: 'Purpose Statement Overture',
    desc: 'Her seven-word statement rises in masked italic Gambetta on umber cardstock, holds one breath, and parts.',
  },
  {
    id: 'none',
    short: 'Off · Instant',
    label: 'Off · Instant',
    name: 'No Intro (Instant Stage)',
    desc: 'Skips the loading overture immediately.',
  },
];

export const INTROS = INTRO_CONCEPTS;

const VALID_IDS = new Set(INTRO_CONCEPTS.map((d) => d.id));

const FALLBACK_EXHIBITIONS = [
  {
    slug: 'iyuana',
    name: 'Iyuana',
    poster: '../img/iyuana.jpg',
    wash: { base: '#37302a', mid: '#211c18', deep: '#9c662b', dark: true },
  },
  {
    slug: 'herencia-viva',
    name: 'Herencia Viva',
    poster: '../img/herencia-viva.jpg',
    wash: { base: '#e3b5ba', mid: '#c6606b', deep: '#a94856', dark: false },
  },
  {
    slug: 'ayazamana',
    name: 'Ayazamana',
    poster: '../img/ayazamana.png',
    wash: { base: '#f2e8c2', mid: '#e2cc72', deep: '#cfb354', dark: false },
  },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => clamp(v, 0, 1);
const mix = (a, b, t) => a + (b - a) * t;
const mod = (n, m) => ((n % m) + m) % m;
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / Math.max(1e-6, b - a));
  return t * t * (3 - 2 * t);
};

function bez(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
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

const E_GLIDE = bez(0.32, 0.72, 0, 1);
const E_POISE = bez(0.19, 1, 0.22, 1);
const E_OUT = (t) => 1 - Math.pow(1 - clamp01(t), 3);

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const clean = (hex || '#9c662b').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixRgb(a, b, t) {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

function rgbStr(rgb, a = 1) {
  const r = rgb[0] | 0;
  const g = rgb[1] | 0;
  const b = rgb[2] | 0;
  return a >= 0.999 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${clamp01(a).toFixed(3)})`;
}

// Deterministic Komorebi morning leaf dapples for o1 dawn wash
const DAWN_LEAVES = (() => {
  const R = rng(7109);
  const out = [];
  for (let i = 0; i < 26; i++) {
    out.push({
      ux: 0.04 + R() * 0.90,
      uy: -0.04 + R() * 0.94,
      rx: 0.028 + R() * 0.056,
      ry: 0.015 + R() * 0.032,
      rot: -0.52 + R() * 1.04,
      ph: R() * Math.PI * 2,
      spd: 0.45 + R() * 0.5,
      wt: 0.6 + R() * 0.6,
      sunlit: i % 3 !== 2,
    });
  }
  return out;
})();

// Deterministic multi-lobe organic watercolour silhouette for o3 wet-edge aperture
const BLOOM_LOBES = [
  { ang: 0.0, dist: 0.0, sc: 0.96, aspect: 0.88, rot: 0.12 },
  { ang: 0.22, dist: 0.34, sc: 0.80, aspect: 0.84, rot: 0.45 },
  { ang: 0.88, dist: 0.31, sc: 0.78, aspect: 0.90, rot: 1.05 },
  { ang: 1.58, dist: 0.29, sc: 0.82, aspect: 0.86, rot: 1.62 },
  { ang: 2.34, dist: 0.35, sc: 0.79, aspect: 0.83, rot: 2.28 },
  { ang: 3.12, dist: 0.36, sc: 0.84, aspect: 0.87, rot: 3.05 },
  { ang: 3.84, dist: 0.32, sc: 0.77, aspect: 0.85, rot: 3.74 },
  { ang: 4.58, dist: 0.30, sc: 0.81, aspect: 0.89, rot: 4.42 },
  { ang: 5.36, dist: 0.35, sc: 0.78, aspect: 0.84, rot: 5.20 },
  { ang: 5.88, dist: 0.26, sc: 0.83, aspect: 0.91, rot: 5.80 },
];

function ensureIntroStylesheet() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('intro-concepts-css')) {
    const link = document.createElement('link');
    link.id = 'intro-concepts-css';
    link.rel = 'stylesheet';
    link.href = 'intro-concepts.css';
    document.head.appendChild(link);
  }
}

function normalizeStyle(styleId, fallback = 'o1') {
  if (typeof styleId === 'string') {
    const clean = styleId.trim().toLowerCase();
    if (VALID_IDS.has(clean)) return clean;
  }
  return fallback;
}

export function createIntroController(ctx = {}) {
  ensureIntroStylesheet();

  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Build #introStage once and append to document.body
  let stageEl = document.getElementById('introStage');
  if (stageEl) stageEl.remove();

  stageEl = document.createElement('div');
  stageEl.id = 'introStage';
  stageEl.className = 'intro-stage is-done';
  stageEl.hidden = true;
  stageEl.setAttribute('aria-hidden', 'true');
  // Critical inline positioning prevents any 1-frame FOUC while intro-concepts.css parses
  stageEl.style.cssText = 'position:fixed;inset:0;z-index:70;overflow:hidden;';

  stageEl.innerHTML = `
    <canvas class="intro-canvas" aria-hidden="true"></canvas>

    <!-- o1: Komorebi Dawn & Rising Prints -->
    <div class="intro-scene intro-scene--o1">
      <div class="intro-o1__lockup">
        <p class="intro-o1__name">Vanessa Espín</p>
        <p class="intro-o1__meta">Event Planning · New York</p>
        <div class="intro-o1__thread-track">
          <div class="intro-o1__thread"></div>
        </div>
      </div>
    </div>

    <!-- o2: Three-Print Deal -->
    <div class="intro-scene intro-scene--o2">
      <div class="intro-o2__ground"></div>
      <div class="intro-o2__masthead">
        <span class="intro-o2__brand">Vanessa Espín</span>
        <span class="intro-o2__role">Event Planning · New York</span>
      </div>
      <div class="intro-o2__deck">
        <div class="intro-o2__card" data-slot="0"><img class="intro-o2__img" alt="" decoding="async"></div>
        <div class="intro-o2__card" data-slot="1"><img class="intro-o2__img" alt="" decoding="async"></div>
        <div class="intro-o2__card" data-slot="2"><img class="intro-o2__img" alt="" decoding="async"></div>
      </div>
      <div class="intro-o2__foot">Event Planning · New York</div>
    </div>

    <!-- o3: Watercolour Wet-Edge Bloom -->
    <div class="intro-scene intro-scene--o3">
      <div class="intro-o3__lockup">
        <p class="intro-o3__name">Vanessa Espín</p>
        <div class="intro-o3__reg"><div class="intro-o3__reg-line"></div></div>
        <p class="intro-o3__role">Event Planning</p>
        <p class="intro-o3__city">New York</p>
      </div>
    </div>

    <!-- o4: Theatre Velvet Fly-Curtain -->
    <div class="intro-scene intro-scene--o4">
      <div class="intro-o4__curtain">
        <div class="intro-o4__lockup">
          <div class="intro-o4__line">
            <span class="intro-o4__name">Vanessa Espín</span>
            <span class="intro-o4__sep" aria-hidden="true">·</span>
            <span class="intro-o4__role">Event Planning</span>
          </div>
          <div class="intro-o4__rule-wrap"><div class="intro-o4__rule"></div></div>
          <p class="intro-o4__city">New York</p>
        </div>
        <div class="intro-o4__hem"></div>
      </div>
    </div>

    <!-- o5: Pin-Spot Aperture on the Poster -->
    <div class="intro-scene intro-scene--o5">
      <div class="intro-o5__lockup">
        <p class="intro-o5__name">Vanessa Espín</p>
        <p class="intro-o5__meta">Event Planning · New York</p>
      </div>
    </div>

    <!-- o6: Purpose Statement Overture -->
    <div class="intro-scene intro-scene--o6">
      <div class="intro-o6__leaf intro-o6__leaf--left"></div>
      <div class="intro-o6__leaf intro-o6__leaf--right"></div>
      <div class="intro-o6__center">
        <div class="intro-o6__mask">
          <p class="intro-o6__quote">“I wanted to tell the stories of us.”</p>
        </div>
        <div class="intro-o6__rule"></div>
        <p class="intro-o6__colophon">Vanessa Espín · Event Planning</p>
      </div>
    </div>

    <div class="intro-grain" aria-hidden="true"></div>
  `;

  document.body.appendChild(stageEl);

  // Cached DOM references for zero-allocation 60fps updates
  const canvasEl = stageEl.querySelector('.intro-canvas');
  const c2d = canvasEl.getContext('2d');
  const grainEl = stageEl.querySelector('.intro-grain');

  const o1Lockup = stageEl.querySelector('.intro-o1__lockup');
  const o1Thread = stageEl.querySelector('.intro-o1__thread');

  const o2Ground = stageEl.querySelector('.intro-o2__ground');
  const o2Masthead = stageEl.querySelector('.intro-o2__masthead');
  const o2Foot = stageEl.querySelector('.intro-o2__foot');
  const o2Cards = Array.from(stageEl.querySelectorAll('.intro-o2__card'));
  const o2Imgs = o2Cards.map((el) => el.querySelector('.intro-o2__img'));

  const o3Lockup = stageEl.querySelector('.intro-o3__lockup');
  const o3RegLine = stageEl.querySelector('.intro-o3__reg-line');

  const o4Curtain = stageEl.querySelector('.intro-o4__curtain');
  const o4Lockup = stageEl.querySelector('.intro-o4__lockup');
  const o4Rule = stageEl.querySelector('.intro-o4__rule');
  const o4Hem = stageEl.querySelector('.intro-o4__hem');

  const o5Lockup = stageEl.querySelector('.intro-o5__lockup');

  const o6Left = stageEl.querySelector('.intro-o6__leaf--left');
  const o6Right = stageEl.querySelector('.intro-o6__leaf--right');
  const o6Center = stageEl.querySelector('.intro-o6__center');
  const o6Quote = stageEl.querySelector('.intro-o6__quote');
  const o6Rule = stageEl.querySelector('.intro-o6__rule');
  const o6Colophon = stageEl.querySelector('.intro-o6__colophon');

  // Controller state
  let currentStyle = 'o1';
  let active = false;
  let isReady = Boolean(ctx?.state?.ready);
  let previewMode = false;
  let previewU = 0;

  let u = 0;
  let elapsedSec = 0;
  let skipping = false;
  let skipFromU = 0;
  let skipElapsed = 0;
  const SKIP_DUR = 0.25;

  let vw = window.innerWidth || 1440;
  let vh = window.innerHeight || 900;
  let dpr = 1;
  let lastStepMs = 0;
  let lastExternalTickMs = -1e9;
  let internalRaf = 0;
  let syncedDeckKey = '';

  function getExhibitions() {
    const list = ctx?.exhibitions || ctx?.EXHIBITIONS;
    return Array.isArray(list) && list.length >= 3 ? list : FALLBACK_EXHIBITIONS;
  }

  function getActiveIndex() {
    const exs = getExhibitions();
    if (typeof ctx?.getActiveIndex === 'function') {
      return mod(ctx.getActiveIndex() | 0, exs.length);
    }
    if (ctx?.state && typeof ctx.state.active === 'number') {
      return mod(ctx.state.active | 0, exs.length);
    }
    const q = parseInt(new URLSearchParams(location.search).get('i') ?? '0', 10);
    return mod(Number.isFinite(q) ? q : 0, exs.length);
  }

  function getActiveExhibition() {
    if (typeof ctx?.getActiveExhibition === 'function') {
      const ex = ctx.getActiveExhibition();
      if (ex) return ex;
    }
    const exs = getExhibitions();
    return exs[getActiveIndex()] || FALLBACK_EXHIBITIONS[0];
  }

  function getConceptId() {
    if (typeof ctx?.getConcept === 'function') {
      const c = ctx.getConcept();
      if (c) return c;
    }
    if (ctx?.state?.concept) return ctx.state.concept;
    if (document.body?.dataset?.concept) return document.body.dataset.concept;
    return new URLSearchParams(location.search).get('c') || 'c1';
  }

  function wakeHost() {
    if (typeof ctx?.startLoop === 'function') ctx.startLoop();
    else if (typeof ctx?.requestRender === 'function') ctx.requestRender();
    else if (typeof ctx?.wake === 'function') ctx.wake();
  }

  function resizeCanvas() {
    vw = Math.max(1, window.innerWidth || 1440);
    vh = Math.max(1, window.innerHeight || 900);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cw = Math.round(vw * dpr);
    const ch = Math.round(vh * dpr);
    if (canvasEl.width !== cw || canvasEl.height !== ch) {
      canvasEl.width = cw;
      canvasEl.height = ch;
    }
  }

  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (active) renderAtProgress(u, performance.now());
  });

  // Sync the 3 miniature uncropped poster prints in o2 to match the linear [0, 1, 2] stage order
  function syncO2DeckSources() {
    const exs = getExhibitions();
    const order = [0, 1, 2];
    const key = `linear:${order.join(',')}`;
    if (key === syncedDeckKey) return;
    syncedDeckKey = key;
    order.forEach((exIdx, slot) => {
      const ex = exs[exIdx] || FALLBACK_EXHIBITIONS[exIdx];
      const img = o2Imgs[slot];
      if (img && img.getAttribute('src') !== ex.poster) {
        img.src = ex.poster;
      }
    });
  }

  // Compute exact 2D screen target poses for linear posters [0, 1, 2] relative to active index
  function getO2CarouselTargets() {
    const mob = vw < 820;
    const cId = getConceptId();
    const act = getActiveIndex();
    const deltas = [0 - act, 1 - act, 2 - act];

    if (cId === 'c4') {
      const baseH = vh * (mob ? 0.34 : 0.48);
      const span = vw * (mob ? 0.29 : 0.285);
      const yOff = -vh * (mob ? 0.03 : 0.04);
      return [0, 1, 2].map((slot) => {
        const focus = slot === act;
        return {
          x: (slot - 1) * span,
          y: yOff,
          h: baseH * (focus ? 1.035 : 0.96),
          rot: (slot - 1) * 1.15,
          z: focus ? 4 : 2,
          endOpacity: 1,
        };
      });
    }

    if (cId === 'c3') {
      const baseH = vh * (mob ? 0.42 : 0.50);
      return deltas.map((d) => {
        const ad = Math.abs(d);
        const persp = 10 / (10 + ad * 1.4);
        return {
          x: d * vw * 0.42 * persp,
          y: d * vh * 0.28 * persp,
          h: baseH * mix(1, 0.68, clamp01(ad)) * persp,
          rot: d * -3.4,
          z: d === 0 ? 5 : 2,
          endOpacity: ad > 1.35 ? 0 : 1,
        };
      });
    }

    if (cId === 'c7') {
      const baseH = vh * (mob ? 0.40 : 0.58);
      const cx = mob ? 0 : vw * 0.21;
      return deltas.map((d) => {
        const ad = Math.abs(d);
        const persp = 10 / (10 + ad * 1.9);
        return {
          x: (cx + d * vw * 0.30) * persp,
          y: -(mob ? vh * 0.14 : vh * 0.01 + d * vh * 0.11) * persp,
          h: baseH * persp,
          rot: (-0.04 + d * 0.04) * (180 / Math.PI),
          z: d === 0 ? 5 : 2,
          endOpacity: (d < 0 || ad > 1.35) ? 0 : 1,
        };
      });
    }

    // Default linear stage geometry: C1, C2, C5, C6, C8
    const isLedge = cId === 'c6';
    const baseH = vh * (mob ? (isLedge ? 0.44 : 0.42) : (isLedge ? 0.54 : 0.55));
    const cxFrac = mob ? 0 : (isLedge ? 0.02 : 0.025);
    const cyFrac = mob ? (isLedge ? -0.035 : 0.08) : -0.035;
    const sxFrac = mob ? 0.56 : 0.315;
    const syFrac = isLedge ? 0 : (mob ? 0.04 : 0.085);
    const sz = isLedge ? 0.55 : (mob ? 0.95 : 1.18);

    return deltas.map((d) => {
      const ad = Math.abs(d);
      const persp = 10 / (10 + ad * sz);
      return {
        x: (cxFrac + d * sxFrac) * vw * persp,
        y: -(cyFrac + d * syFrac) * vh * persp,
        h: baseH * persp,
        rot: isLedge ? 0 : (-2.0 + d * 2.3),
        z: d === 0 ? 5 : (d > 0 ? 3 : 2),
        endOpacity: ad > 1.35 ? 0 : 1,
      };
    });
  }

  function clearCanvas() {
    c2d.setTransform(1, 0, 0, 1, 0, 0);
    c2d.clearRect(0, 0, canvasEl.width, canvasEl.height);
  }

  /* =========================================================================
     Per-Style Renderers Driven Deterministically by u ∈ [0, 1]
     ========================================================================= */

  function renderO1(prog, nowSec) {
    const W = canvasEl.width;
    const H = canvasEl.height;
    const v = clamp01((prog - 0.50) / 0.50);

    // 1. Nocturnal gallery umber veil (#13100d) + diagonal Komorebi dawn sunbeams
    c2d.save();
    c2d.setTransform(1, 0, 0, 1, 0, 0);
    c2d.clearRect(0, 0, W, H);

    const veilEase = E_GLIDE(v);
    const veilAlpha = clamp01(1 - veilEase);

    if (veilAlpha > 0.002) {
      // Subtle warm dawn shift in the umber cardstock right as morning light enters
      const umber = mixRgb([19, 16, 13], [44, 33, 22], smooth(0.0, 0.65, v));
      c2d.fillStyle = rgbStr(umber, veilAlpha);
      c2d.fillRect(0, 0, W, H);

      const amb = c2d.createRadialGradient(W * 0.48, H * 0.46, H * 0.04, W * 0.48, H * 0.46, Math.hypot(W, H) * 0.55);
      amb.addColorStop(0, `rgba(235, 192, 124, ${(0.065 * veilAlpha).toFixed(3)})`);
      amb.addColorStop(1, 'rgba(19, 16, 13, 0)');
      c2d.fillStyle = amb;
      c2d.fillRect(0, 0, W, H);
    }

    // Golden Komorebi morning beams: faint pre-dawn warmth (0.30..0.50), full sunlit wash across reveal (0.50..1.00)
    const preDawn = smooth(0.28, 0.50, prog) * 0.24;
    const revealDawn = v > 0 ? Math.sin(Math.pow(v, 0.68) * Math.PI) * 1.12 : 0;
    const beamStrength = preDawn + revealDawn;

    if (beamStrength > 0.004) {
      const sway = (reduced || previewMode) ? 0 : Math.sin(nowSec * 0.58) * W * 0.012;
      c2d.globalCompositeOperation = 'screen';

      const shafts = [
        [-0.04, -0.10, 0.72, 0.96, 0.38],
        [0.24, -0.12, 0.96, 0.88, 0.28],
        [0.08, 0.06, 0.62, 0.78, 0.20],
      ];
      for (const [x0, y0, x1, y1, baseA] of shafts) {
        const g = c2d.createLinearGradient(W * x0 + sway, H * y0, W * x1 + sway, H * y1);
        const a = clamp01(baseA * beamStrength);
        g.addColorStop(0, `rgba(255, 236, 188, ${a.toFixed(3)})`);
        g.addColorStop(0.48, `rgba(252, 222, 160, ${(a * 0.62).toFixed(3)})`);
        g.addColorStop(1, 'rgba(248, 212, 142, 0)');
        c2d.fillStyle = g;
        c2d.fillRect(0, 0, W, H);
      }

      for (const lf of DAWN_LEAVES) {
        const dx = (reduced || previewMode) ? 0 : Math.sin(nowSec * lf.spd + lf.ph) * W * 0.008;
        const dy = (reduced || previewMode) ? 0 : Math.cos(nowSec * lf.spd * 0.84 + lf.ph) * H * 0.006;
        const lx = lf.ux * W + sway * 0.65 + dx;
        const ly = lf.uy * H + dy;
        const rx = lf.rx * W;
        const ry = lf.ry * W;

        c2d.save();
        c2d.translate(lx, ly);
        c2d.rotate(lf.rot);
        c2d.scale(1, ry / rx);
        if (lf.sunlit) {
          c2d.globalCompositeOperation = 'screen';
          const sg = c2d.createRadialGradient(0, 0, rx * 0.06, 0, 0, rx);
          const sa = clamp01(0.20 * lf.wt * beamStrength);
          sg.addColorStop(0, `rgba(255, 244, 212, ${sa.toFixed(3)})`);
          sg.addColorStop(1, 'rgba(255, 244, 212, 0)');
          c2d.fillStyle = sg;
        } else if (veilAlpha > 0.08) {
          c2d.globalCompositeOperation = 'multiply';
          const dg = c2d.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
          const da = clamp01(0.14 * lf.wt * beamStrength * veilAlpha);
          dg.addColorStop(0, `rgba(24, 17, 11, ${da.toFixed(3)})`);
          dg.addColorStop(1, 'rgba(24, 17, 11, 0)');
          c2d.fillStyle = dg;
        }
        c2d.beginPath();
        c2d.arc(0, 0, rx, 0, Math.PI * 2);
        c2d.fill();
        c2d.restore();
      }
    }
    c2d.restore();

    // 2. Typography & whisper-thin 0.5px warm brass thread
    const enterT = E_POISE(clamp01(prog / 0.28));
    const exitT = smooth(0.0, 0.56, v);
    const textOpacity = clamp01(mix(0.42, 1.0, enterT) * (1 - exitT));
    const textY = mix(8, 0, enterT) - exitT * 12;
    o1Lockup.style.opacity = textOpacity.toFixed(3);
    o1Lockup.style.transform = `translate3d(0, ${textY.toFixed(2)}px, 0)`;

    const threadProgress = prog <= 0.50
      ? mix(0.08, 1.0, E_OUT(clamp01(prog / 0.48)))
      : mix(1.0, 1.16, E_OUT(v));
    o1Thread.style.transform = `scaleX(${threadProgress.toFixed(4)})`;
    o1Thread.style.opacity = clamp01(1 - smooth(0.08, 0.52, v)).toFixed(3);

    grainEl.style.opacity = (0.075 * clamp01(1 - smooth(0.55, 1.0, v))).toFixed(3);
  }

  function renderO2(prog) {
    clearCanvas();
    syncO2DeckSources();

    const targets = getO2CarouselTargets();
    const v = clamp01((prog - 0.50) / 0.50);
    const glide = E_GLIDE(v);

    // Charcoal gallery linen dissolves cleanly as prints glide to their 3D carousel homes
    const groundAlpha = clamp01(1 - smooth(0.04, 0.72, v));
    o2Ground.style.opacity = groundAlpha.toFixed(3);

    // Top-left masthead sits at exact .masthead coordinates, cross-fading smoothly into real header
    const mastEnter = E_POISE(clamp01(prog / 0.24));
    const mastExit = smooth(0.32, 0.88, v);
    o2Masthead.style.opacity = clamp01(mix(0.52, 1.0, mastEnter) * (1 - mastExit)).toFixed(3);
    o2Foot.style.opacity = clamp01(mix(0.28, 1.0, mastEnter) * (1 - smooth(0.0, 0.42, v))).toFixed(3);

    // Miniature hand-dealt card geometry (100% uncropped, clean separation, -5° / 0° / +5°)
    const mob = vw < 820;
    const dealtH = clamp(vh * (mob ? 0.185 : 0.22), mob ? 108 : 138, mob ? 156 : 216);
    const dealtSpreadX = Math.min(vw * (mob ? 0.275 : 0.24), dealtH * 0.98);
    const dealtTilts = [-5, 0, 5];
    const dealtArcY = [9, 0, 9];
    const dealStarts = [0.0, 0.085, 0.17]; // ~120ms stagger across the 0.76s deal phase
    const dealSpan = 0.25;

    for (let slot = 0; slot < 3; slot++) {
      const cardEl = o2Cards[slot];
      const imgEl = o2Imgs[slot];
      const tgt = targets[slot];

      // Render img at full target height & scale down in GPU so scaling up has zero blur
      const targetH = Math.max(180, tgt.h);
      imgEl.style.setProperty('--o2-target-h', `${targetH.toFixed(1)}px`);

      const dealRaw = clamp01((prog - dealStarts[slot]) / dealSpan);
      const dealE = E_POISE(dealRaw);

      // Entry lift during deal (slot 0 already emerging at u = 0 so ?introPreview=0 is alive)
      const entryAlpha = slot === 0
        ? mix(0.48, 1.0, dealE)
        : clamp01((prog - dealStarts[slot] + 0.02) / 0.12);
      const dealSlideY = mix(slot === 0 ? 22 : 34, 0, dealE);
      const dealScaleBoost = mix(0.92, 1.0, dealE);

      const dealtX = (slot - 1) * dealtSpreadX * mix(0.45, 1.0, dealE);
      const dealtY = dealtArcY[slot] + dealSlideY;
      const dealtRot = dealtTilts[slot] * dealE;
      const dealtScale = (dealtH / targetH) * dealScaleBoost;

      const curX = mix(dealtX, tgt.x, glide);
      const curY = mix(dealtY, tgt.y, glide);
      const curRot = mix(dealtRot, tgt.rot, glide);
      const curScale = mix(dealtScale, 1.0, glide);

      // Seamless cross-dissolve into the 3D WebGL posters underneath in the second half of the glide
      const dissolveOut = 1 - smooth(0.46, 0.96, v);
      const slotFade = mix(1, tgt.endOpacity, smooth(0.2, 0.8, v));
      const cardOpacity = clamp01(entryAlpha * dissolveOut * slotFade);

      cardEl.style.zIndex = String(tgt.z);
      cardEl.style.opacity = cardOpacity.toFixed(3);
      cardEl.style.transform = `translate(-50%, -50%) translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0) scale(${curScale.toFixed(4)}) rotate(${curRot.toFixed(2)}deg)`;
    }

    grainEl.style.opacity = (0.07 * clamp01(1 - smooth(0.55, 1.0, v))).toFixed(3);
  }

  function renderO3(prog, nowSec) {
    const W = canvasEl.width;
    const H = canvasEl.height;
    const v = clamp01((prog - 0.50) / 0.50);
    const ex = getActiveExhibition();

    // Active exhibition's watercolour pigment (blend wash.mid + wash.deep for rich cotton-rag rim)
    const midRgb = hexToRgb(ex?.wash?.mid || '#c6606b');
    const deepRgb = hexToRgb(ex?.wash?.deep || '#9c662b');
    const midLuma = midRgb[0] * 0.299 + midRgb[1] * 0.587 + midRgb[2] * 0.114;
    // When wash.mid is dark sepia (Iyuana #211c18), pull warm sienna from wash.deep for outer watercolour soak
    const outerWashRgb = midLuma < 55 ? mixRgb(midRgb, deepRgb, 0.65) : mixRgb(midRgb, deepRgb, 0.25);
    const capillaryRgb = midLuma < 55 ? mixRgb(midRgb, deepRgb, 0.35) : mixRgb(midRgb, deepRgb, 0.58);

    const endFade = clamp01(1 - smooth(0.90, 1.0, v));

    c2d.save();
    c2d.setTransform(1, 0, 0, 1, 0, 0);
    c2d.clearRect(0, 0, W, H);

    if (endFade > 0.002) {
      // 1. Warm archival cotton rag paper (#f2ede3) + subtle deckle warmth
      c2d.fillStyle = `rgba(242, 237, 227, ${endFade.toFixed(3)})`;
      c2d.fillRect(0, 0, W, H);

      const halfDiag = 0.5 * Math.hypot(W, H);
      const vig = c2d.createRadialGradient(W * 0.5, H * 0.5, halfDiag * 0.2, W * 0.5, H * 0.5, halfDiag * 1.08);
      vig.addColorStop(0, 'rgba(250, 246, 238, 0)');
      vig.addColorStop(1, `rgba(214, 203, 184, ${(0.34 * endFade).toFixed(3)})`);
      c2d.fillStyle = vig;
      c2d.fillRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.5;

      // Subtle wet brush drop gathering behind the registration hairline just before bloom (0.30..0.50)
      if (prog > 0.28 && v <= 0.02) {
        const dropT = smooth(0.28, 0.50, prog);
        const dr = Math.min(W, H) * 0.11 * dropT;
        if (dr > 2) {
          const dg = c2d.createRadialGradient(cx, cy, dr * 0.05, cx, cy, dr);
          dg.addColorStop(0, rgbStr(outerWashRgb, 0.15 * dropT));
          dg.addColorStop(0.72, rgbStr(capillaryRgb, 0.10 * dropT));
          dg.addColorStop(1, rgbStr(outerWashRgb, 0));
          c2d.fillStyle = dg;
          c2d.beginPath();
          c2d.arc(cx, cy, dr, 0, Math.PI * 2);
          c2d.fill();
        }
      }

      // 2. Multi-lobe wet-edge watercolour bloom (destination-out cutout + outer pigmented capillary rim)
      if (v > 0.002) {
        // Calibrated so u=0.78 (v=0.56) frames a ~52% viewport bloom with rich pigment rim on all sides,
        // and u=1.00 (v=1.0) expands past all four corners cleanly.
        const bloomR = halfDiag * 1.50 * Math.pow(v, 1.92);
        const rimAlpha = clamp01(smooth(0.0, 0.08, v) * endFade);
        const breath = (reduced || previewMode) ? 0 : nowSec * 0.65;

        // Pass A: Paint pigmented wet bleed & dark capillary backrun onto cotton paper around lobe perimeter
        for (let i = 0; i < BLOOM_LOBES.length; i++) {
          const lb = BLOOM_LOBES[i];
          const ang = lb.ang + (breath ? Math.sin(breath + i) * 0.03 : 0);
          const lx = cx + Math.cos(ang) * bloomR * lb.dist;
          const ly = cy + Math.sin(ang) * bloomR * lb.dist * 0.88;
          const lr = Math.max(4, bloomR * lb.sc * 1.13);

          c2d.save();
          c2d.translate(lx, ly);
          c2d.rotate(lb.rot);
          c2d.scale(1, lb.aspect);
          const pg = c2d.createRadialGradient(0, 0, lr * 0.58, 0, 0, lr);
          pg.addColorStop(0, rgbStr(capillaryRgb, 0.62 * rimAlpha));
          pg.addColorStop(0.76, rgbStr(capillaryRgb, 0.54 * rimAlpha));
          pg.addColorStop(0.88, rgbStr(outerWashRgb, 0.30 * rimAlpha));
          pg.addColorStop(1, rgbStr(outerWashRgb, 0));
          c2d.fillStyle = pg;
          c2d.beginPath();
          c2d.arc(0, 0, lr, 0, Math.PI * 2);
          c2d.fill();
          c2d.restore();
        }

        // Pass B: Carve clean organic multi-lobe destination-out aperture so interior is 100% clear to WebGL
        c2d.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < BLOOM_LOBES.length; i++) {
          const lb = BLOOM_LOBES[i];
          const ang = lb.ang + (breath ? Math.sin(breath + i) * 0.03 : 0);
          const lx = cx + Math.cos(ang) * bloomR * lb.dist;
          const ly = cy + Math.sin(ang) * bloomR * lb.dist * 0.88;
          const lr = Math.max(3, bloomR * lb.sc);

          c2d.save();
          c2d.translate(lx, ly);
          c2d.rotate(lb.rot);
          c2d.scale(1, lb.aspect);
          const cg = c2d.createRadialGradient(0, 0, lr * 0.74, 0, 0, lr);
          cg.addColorStop(0, 'rgba(0,0,0,1)');
          cg.addColorStop(0.82, 'rgba(0,0,0,0.96)');
          cg.addColorStop(0.93, 'rgba(0,0,0,0.48)');
          cg.addColorStop(1, 'rgba(0,0,0,0)');
          c2d.fillStyle = cg;
          c2d.beginPath();
          c2d.arc(0, 0, lr, 0, Math.PI * 2);
          c2d.fill();
          c2d.restore();
        }
      }
    }

    c2d.restore();

    // 3. Centered archival typography & ink registration hairline
    const enterT = E_POISE(clamp01(prog / 0.26));
    const soakOut = smooth(0.01, 0.34, v);
    const lockAlpha = clamp01(mix(0.45, 1.0, enterT) * (1 - soakOut));
    const scale = mix(0.99, 1.0, enterT) + soakOut * 0.025;
    o3Lockup.style.opacity = lockAlpha.toFixed(3);
    o3Lockup.style.transform = `translate3d(0, ${mix(7, 0, enterT).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;

    const regScale = mix(0.14, 1.0, E_OUT(clamp01(prog / 0.42)));
    o3RegLine.style.transform = `scaleX(${regScale.toFixed(4)})`;

    grainEl.style.opacity = (0.11 * clamp01(1 - smooth(0.55, 1.0, v))).toFixed(3);
  }

  function renderO4(prog) {
    clearCanvas();

    const enterT = E_POISE(clamp01(prog / 0.28));
    const ruleDraw = mix(0.10, 1.0, E_OUT(clamp01(prog / 0.46)));

    // Two-stage theatrical release:
    // u ∈ [0.50, 0.735]: footlight swell + fly-line tension release (0% → -3.5%)
    // u ∈ [0.735, 1.00]: brisk 0.58s upward fly-curtain lift (-3.5% → -103%) along cubic-bezier(0.32, 0.72, 0, 1)
    let yPct = 0;
    if (prog > 0.50 && prog <= 0.735) {
      const pre = (prog - 0.50) / 0.235;
      yPct = -3.5 * smooth(0, 1, pre);
    } else if (prog > 0.735) {
      const vFly = clamp01((prog - 0.735) / 0.265);
      yPct = -3.5 - 99.5 * E_GLIDE(vFly);
    }

    o4Curtain.style.transform = `translate3d(0, ${yPct.toFixed(3)}%, 0)`;

    const lockFade = 1 - smooth(0.72, 0.94, prog);
    o4Lockup.style.opacity = clamp01(mix(0.45, 1.0, enterT) * lockFade).toFixed(3);
    o4Lockup.style.transform = `translate3d(0, ${mix(8, 0, enterT).toFixed(2)}px, 0)`;

    o4Rule.style.transform = `scaleX(${ruleDraw.toFixed(4)})`;
    o4Hem.style.opacity = clamp01(mix(0.58, 1.0, smooth(0.18, 0.62, prog))).toFixed(3);

    // Keep paper grain confined to the curtain region by fading cleanly as curtain clears
    grainEl.style.opacity = (0.068 * clamp01(1 - smooth(0.76, 0.98, prog))).toFixed(3);
  }

  function renderO5(prog, nowSec) {
    const W = canvasEl.width;
    const H = canvasEl.height;
    const mob = vw < 820;
    const cId = getConceptId();

    // Spotlight center glides smoothly from exact screen center (during text glimmer) to center 3D poster
    let targetSpotX = W * 0.5;
    let targetSpotY = H * 0.5;
    if (cId === 'c7' && !mob) {
      targetSpotX = W * 0.71;
      targetSpotY = H * 0.49;
    } else if (cId !== 'c4' && cId !== 'c3' && !mob) {
      targetSpotX = W * 0.525;
      targetSpotY = H * 0.515;
    } else if (cId === 'c4') {
      const act = getActiveIndex();
      targetSpotX = W * (0.5 + (act - 1) * (mob ? 0.29 : 0.285));
      targetSpotY = H * 0.46;
    }

    const aimBlend = smooth(0.46, 0.60, prog);
    const sx = mix(W * 0.5, targetSpotX, aimBlend);
    const sy = mix(H * 0.5, targetSpotY, aimBlend);
    const endFade = clamp01(1 - smooth(0.92, 1.0, prog));

    c2d.save();
    c2d.setTransform(1, 0, 0, 1, 0, 0);
    c2d.clearRect(0, 0, W, H);

    if (endFade > 0.002) {
      // Pure dark gallery room (#090807)
      c2d.fillStyle = `rgba(9, 8, 7, ${endFade.toFixed(3)})`;
      c2d.fillRect(0, 0, W, H);

      if (prog < 0.54) {
        // Loading (0..0.54): tiny warm gallery pin-spot glimmering at center behind faint parchment name
        const pulse = (reduced || previewMode) ? 1 : (0.94 + 0.06 * Math.sin(nowSec * 3.1));
        const glimT = mix(0.68, 1.0, E_OUT(clamp01(prog / 0.38)));
        const pinR = H * 0.135 * glimT * pulse;
        const pg = c2d.createRadialGradient(sx, sy, pinR * 0.04, sx, sy, pinR);
        pg.addColorStop(0, `rgba(248, 206, 138, ${(0.22 * glimT).toFixed(3)})`);
        pg.addColorStop(0.48, `rgba(212, 152, 82, ${(0.09 * glimT).toFixed(3)})`);
        pg.addColorStop(1, 'rgba(9, 8, 7, 0)');
        c2d.fillStyle = pg;
        c2d.fillRect(0, 0, W, H);
      } else {
        // Beat 1 (0.54..0.62 -> hold 0.62..0.75 = 0.28s): iris opens to frame JUST center 3D poster (r = 22vh)
        // Beat 2 (0.75..1.00): iris expands smoothly (r -> 130vmax) to illuminate the full room
        const rPoster = H * 0.22;
        const rHoldEnd = H * 0.238;
        const rFull = Math.max(W, H) * 1.32;

        let r;
        let tExp = 0;
        if (prog <= 0.62) {
          r = rPoster * E_OUT((prog - 0.54) / 0.08);
        } else if (prog <= 0.75) {
          r = mix(rPoster, rHoldEnd, (prog - 0.62) / 0.13);
        } else {
          tExp = clamp01((prog - 0.75) / 0.25);
          r = mix(rHoldEnd, rFull, Math.pow(tExp, 1.76));
        }

        // Subtle portrait-proportioned gallery framing ellipse on the poster, relaxing to circular as room opens
        const aspectMix = smooth(0.0, 0.55, tExp);
        const rx = Math.max(2, r * mix(0.92, 1.0, aspectMix));
        const ry = Math.max(2, r * mix(1.16, 1.0, aspectMix));

        // Carve crisp optical spotlight iris into the dark room
        c2d.save();
        c2d.globalCompositeOperation = 'destination-out';
        c2d.translate(sx, sy);
        c2d.scale(1, ry / rx);
        const ig = c2d.createRadialGradient(0, 0, rx * 0.72, 0, 0, rx);
        ig.addColorStop(0, 'rgba(0,0,0,1)');
        ig.addColorStop(0.84, 'rgba(0,0,0,0.94)');
        ig.addColorStop(0.95, 'rgba(0,0,0,0.38)');
        ig.addColorStop(1, 'rgba(0,0,0,0)');
        c2d.fillStyle = ig;
        c2d.beginPath();
        c2d.arc(0, 0, rx, 0, Math.PI * 2);
        c2d.fill();
        c2d.restore();

        // Warm gallery halogen rim around the spotlight edge
        const rimA = 0.22 * endFade * (1 - smooth(0.65, 1.0, tExp));
        if (rimA > 0.004) {
          c2d.save();
          c2d.globalCompositeOperation = 'screen';
          c2d.translate(sx, sy);
          c2d.scale(1, ry / rx);
          const rg = c2d.createRadialGradient(0, 0, rx * 0.76, 0, 0, rx * 1.12);
          rg.addColorStop(0, 'rgba(248, 206, 136, 0)');
          rg.addColorStop(0.58, `rgba(248, 204, 132, ${rimA.toFixed(3)})`);
          rg.addColorStop(1, 'rgba(248, 206, 136, 0)');
          c2d.fillStyle = rg;
          c2d.beginPath();
          c2d.arc(0, 0, rx * 1.12, 0, Math.PI * 2);
          c2d.fill();
          c2d.restore();
        }
      }
    }

    c2d.restore();

    // Parchment name glimmers during 0..0.54, releasing cleanly as the poster iris snaps open
    const enterT = E_POISE(clamp01(prog / 0.28));
    const fadeOut = smooth(0.49, 0.58, prog);
    o5Lockup.style.opacity = clamp01(mix(0.42, 1.0, enterT) * (1 - fadeOut)).toFixed(3);
    o5Lockup.style.transform = `translate3d(0, ${mix(6, 0, enterT).toFixed(2)}px, 0)`;

    grainEl.style.opacity = (0.068 * endFade).toFixed(3);
  }

  function renderO6(prog) {
    clearCanvas();

    // Masked italic Gambetta 300 rise (0..0.34), calm 0.45s breath hold (0.34..0.63),
    // then editorial monograph leaves part smoothly from center (0.63..1.00)
    const riseT = E_POISE(clamp01(prog / 0.34));
    const colophonT = E_POISE(clamp01((prog - 0.08) / 0.30));
    const vPart = clamp01((prog - 0.63) / 0.37);
    const partEase = E_GLIDE(vPart);

    // Quote rises out of line mask (already visible emerging at u=0 so ?introPreview=0 is poised)
    const quoteY = mix(44, 0, riseT) - partEase * 10;
    const quoteAlpha = clamp01(mix(0.42, 1.0, riseT) * (1 - smooth(0.06, 0.68, vPart)));
    o6Quote.style.transform = `translate3d(0, ${quoteY.toFixed(2)}%, 0)`;
    o6Quote.style.opacity = quoteAlpha.toFixed(3);

    const colAlpha = clamp01(mix(0.24, 1.0, colophonT) * (1 - smooth(0.0, 0.54, vPart)));
    o6Rule.style.transform = `scaleX(${mix(0.25, 1.0, colophonT).toFixed(3)})`;
    o6Rule.style.opacity = colAlpha.toFixed(3);
    o6Colophon.style.opacity = colAlpha.toFixed(3);
    o6Colophon.style.transform = `translate3d(0, ${(mix(6, 0, colophonT) + partEase * 8).toFixed(2)}px, 0)`;
    o6Center.style.opacity = '1';

    // Seamless umber cardstock prior to u=0.63; parts smoothly left & right to frame the centered poster
    const leafShiftVw = partEase * 53;
    const leafAlpha = clamp01(1 - smooth(0.68, 1.0, vPart));
    const seamAlpha = vPart > 0.004 ? 0.34 * (1 - smooth(0.65, 1.0, vPart)) : 0;
    const shadowAlpha = vPart > 0.004 ? 0.48 * (1 - smooth(0.7, 1.0, vPart)) : 0;

    o6Left.style.transform = `translate3d(${(-leafShiftVw).toFixed(3)}vw, 0, 0)`;
    o6Right.style.transform = `translate3d(${leafShiftVw.toFixed(3)}vw, 0, 0)`;
    o6Left.style.opacity = leafAlpha.toFixed(3);
    o6Right.style.opacity = leafAlpha.toFixed(3);
    o6Left.style.borderRightColor = `rgba(226, 188, 126, ${seamAlpha.toFixed(3)})`;
    o6Right.style.borderLeftColor = `rgba(226, 188, 126, ${seamAlpha.toFixed(3)})`;
    o6Left.style.boxShadow = `18px 0 48px rgba(6, 5, 4, ${shadowAlpha.toFixed(3)})`;
    o6Right.style.boxShadow = `-18px 0 48px rgba(6, 5, 4, ${shadowAlpha.toFixed(3)})`;

    grainEl.style.opacity = (0.072 * leafAlpha).toFixed(3);
  }

  function renderAtProgress(prog, nowMs = performance.now()) {
    const clamped = clamp01(prog);
    const nowSec = nowMs * 0.001;

    stageEl.dataset.intro = currentStyle;

    // Pass pointer events through to the stage during final dissolve so visitor interaction is never delayed
    const passthrough = !previewMode && (skipping || clamped > 0.80);
    stageEl.classList.toggle('is-passthrough', passthrough);

    // Smooth overall fast-forward fade when user clicks/presses Escape/Space
    if (skipping && !previewMode) {
      const skipK = clamp01(skipElapsed / SKIP_DUR);
      stageEl.style.opacity = clamp01(1 - E_OUT(skipK)).toFixed(3);
    } else {
      stageEl.style.opacity = '1';
    }

    switch (currentStyle) {
      case 'o1':
        renderO1(clamped, nowSec);
        break;
      case 'o2':
        renderO2(clamped, nowSec);
        break;
      case 'o3':
        renderO3(clamped, nowSec);
        break;
      case 'o4':
        renderO4(clamped, nowSec);
        break;
      case 'o5':
        renderO5(clamped, nowSec);
        break;
      case 'o6':
        renderO6(clamped, nowSec);
        break;
      default:
        clearCanvas();
        break;
    }
  }

  /* =========================================================================
     Live Timeline Advancement — Forced Minimum Duration (~3.1s–3.45s Unhurried!)
     ========================================================================= */
  const MIN_FORCED_SKIP_SEC = 2.65; // Forcibly play at least 2.65s before any click/key can skip!

  function getStyleOvertureDur(style) {
    if (reduced) return 1.15;
    switch (style) {
      case 'o2': return 2.05; // 3 prints deal deliberately & hold so eye takes all 3 in
      case 'o5': return 1.80;
      case 'o6': return 2.25; // Full unhurried beat to read “I wanted to tell the stories of us.”
      default: return 1.90;   // O1/O3/O4: unhurried 1.90s overture hold before dawn/reveal breaks
    }
  }

  function advanceProgress(dt) {
    if (previewMode) {
      u = previewU;
      return;
    }

    elapsedSec += dt;

    // Smooth 0.25s fast-forward only when allowed after MIN_FORCED_SKIP_SEC
    if (skipping) {
      skipElapsed += dt;
      const k = clamp01(skipElapsed / SKIP_DUR);
      u = mix(skipFromU, 1.0, E_OUT(k));
      if (k >= 1) {
        finishIntro();
      }
      return;
    }

    const overtureDur = getStyleOvertureDur(currentStyle);

    // Phase 1: Overture (0 -> 0.50). Forcibly takes at least overtureDur seconds even on instant cache!
    if (u < 0.50 || elapsedSec < overtureDur) {
      if (!isReady && u >= 0.44) {
        u += (0.495 - u) * (1 - Math.exp(-dt * 1.65));
        return;
      }
      const nextU = u + (0.50 / overtureDur) * dt;
      if (!isReady && nextU >= 0.45) {
        u = 0.45 + (0.495 - 0.45) * (1 - Math.exp(-dt * 1.65));
        return;
      }
      u = Math.min(nextU, 0.50);
      if (u < 0.50 || elapsedSec < overtureDur || !isReady) return;
    }

    if (!isReady) return;

    // Phase 2: Unhurried Reveal (0.50 -> 1.00, ~1.20s–1.30s -> total ~3.10s–3.45s forced duration!)
    if (reduced) {
      u = Math.min(1, u + (0.50 / 0.65) * dt);
    } else if (currentStyle === 'o1') {
      // 1.22s Komorebi dawn dissolve + 3D poster rise (total = 3.12s)
      u = Math.min(1, u + (0.50 / 1.22) * dt);
    } else if (currentStyle === 'o2') {
      // 1.18s outward glide to carousel slots + cross-dissolve (total = 3.23s)
      u = Math.min(1, u + (0.50 / 1.18) * dt);
    } else if (currentStyle === 'o3') {
      // 1.24s multi-lobe wet-edge watercolour bloom (total = 3.14s)
      u = Math.min(1, u + (0.50 / 1.24) * dt);
    } else if (currentStyle === 'o4') {
      // 0.30s footlight release + 0.92s fly-curtain lift (total = 3.12s)
      if (u < 0.735) {
        u = Math.min(0.735, u + (0.235 / 0.30) * dt);
      } else {
        u = Math.min(1, u + (0.265 / 0.92) * dt);
      }
    } else if (currentStyle === 'o5') {
      // 0.22s snap + 0.52s spotlight hold on center poster + 0.60s room open (total = 3.14s)
      if (u < 0.62) {
        u = Math.min(0.62, u + (0.12 / 0.22) * dt);
      } else if (u < 0.75) {
        u = Math.min(0.75, u + (0.13 / 0.52) * dt);
      } else {
        u = Math.min(1, u + (0.25 / 0.60) * dt);
      }
    } else if (currentStyle === 'o6') {
      // 0.55s breath + 0.65s monograph parting (total = 3.45s)
      if (u < 0.63) {
        u = Math.min(0.63, u + (0.13 / 0.55) * dt);
      } else {
        u = Math.min(1, u + (0.37 / 0.65) * dt);
      }
    } else {
      u = Math.min(1, u + (0.50 / 1.15) * dt);
    }

    if (u >= 1) {
      finishIntro();
    }
  }

  function finishIntro() {
    if (previewMode) return;
    active = false;
    skipping = false;
    u = 1;
    if (internalRaf) {
      cancelAnimationFrame(internalRaf);
      internalRaf = 0;
    }
    clearCanvas();
    stageEl.classList.add('is-done');
    stageEl.classList.remove('is-passthrough');
    stageEl.hidden = true;
    stageEl.style.opacity = '1';
    stageEl.setAttribute('aria-hidden', 'true');
    wakeHost();
  }

  function triggerFastForward() {
    if (!active || previewMode || skipping) return;
    // Enforce minimum forced intro duration before any input can dismiss it!
    if (elapsedSec < MIN_FORCED_SKIP_SEC) return;
    skipping = true;
    skipFromU = Math.max(u, 0.52);
    skipElapsed = 0;
    stageEl.classList.add('is-passthrough');
    scheduleInternalLoop();
    wakeHost();
  }

  // Self-driving fallback RAF so t=0 animates smoothly at 60fps even while host awaits fonts/textures,
  // while yielding cleanly whenever host's tick(nowMs, dt) drives the same frame.
  function internalLoop(nowMs) {
    internalRaf = 0;
    if (!active || previewMode) return;
    const rawDt = lastStepMs > 0 ? (nowMs - lastStepMs) / 1000 : 0;
    if (rawDt >= 0.004) {
      lastStepMs = nowMs;
      advanceProgress(Math.min(rawDt, 0.05));
      if (active) renderAtProgress(u, nowMs);
    }
    if (active && !previewMode) {
      internalRaf = requestAnimationFrame(internalLoop);
    }
  }

  function scheduleInternalLoop() {
    if (!internalRaf && active && !previewMode) {
      internalRaf = requestAnimationFrame(internalLoop);
    }
  }

  function beginPlay(styleId, freezeAt = null) {
    if (internalRaf) {
      cancelAnimationFrame(internalRaf);
      internalRaf = 0;
    }

    syncedDeckKey = '';
    resizeCanvas();

    if (styleId === 'none') {
      currentStyle = 'none';
      previewMode = false;
      finishIntro();
      return;
    }

    currentStyle = normalizeStyle(styleId, 'o1');
    previewMode = freezeAt !== null;
    previewU = freezeAt !== null ? clamp01(freezeAt) : 0;
    u = previewMode ? previewU : 0;
    elapsedSec = 0;
    skipping = false;
    skipElapsed = 0;
    active = true;
    lastStepMs = performance.now();

    stageEl.hidden = false;
    stageEl.classList.remove('is-done', 'is-passthrough');
    stageEl.setAttribute('aria-hidden', 'false');
    stageEl.dataset.intro = currentStyle;

    renderAtProgress(u, lastStepMs);
    scheduleInternalLoop();
    wakeHost();
  }

  /* =========================================================================
     Skip / Fast-Forward Listeners (Enforces MIN_FORCED_SKIP_SEC; ignores stray wheel inertia!)
     ========================================================================= */
  stageEl.addEventListener('pointerdown', (e) => {
    if (!active || previewMode) return;
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('.bench')) return;
    triggerFastForward();
  });

  window.addEventListener('keydown', (e) => {
    if (!active || previewMode) return;
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('input, textarea')) return;
    if (e.key === 'Escape' || e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
      if (elapsedSec >= MIN_FORCED_SKIP_SEC) {
        e.preventDefault();
        triggerFastForward();
      }
    }
  });

  /* =========================================================================
     Public Controller API
     ========================================================================= */
  function startInitial(styleId) {
    const params = new URLSearchParams(location.search);
    const rawPreview = params.get('introPreview');
    const urlIntro = params.get('intro');

    // 1. Deterministic Storyboard / Contact-Sheet Freeze (?introPreview=0 | 0.45 | 0.78)
    if (rawPreview !== null) {
      const parsed = parseFloat(rawPreview);
      const frozenU = clamp01(Number.isFinite(parsed) ? parsed : 0.45);
      const resolved = normalizeStyle(urlIntro || styleId || 'o1', 'o1');
      if (resolved === 'none' && urlIntro === 'none') {
        beginPlay('none', null);
      } else {
        beginPlay(resolved === 'none' ? 'o1' : resolved, frozenU);
      }
      return;
    }

    // 2. Clean static stage capture mode (?clean=1 without ?introPreview and without ?playIntro)
    if (params.get('clean') === '1' && !params.get('playIntro')) {
      currentStyle = 'none';
      finishIntro();
      return;
    }

    // 3. Normal visit (or explicit ?playIntro=1): play selected intro from t = 0
    const resolved = normalizeStyle(styleId ?? urlIntro ?? 'o1', 'o1');
    beginPlay(resolved, null);
  }

  function notifyReady() {
    isReady = true;
    if (active) {
      syncedDeckKey = '';
      if (previewMode) {
        renderAtProgress(previewU, performance.now());
      } else {
        scheduleInternalLoop();
      }
    }
  }

  function replay(styleId) {
    const next = normalizeStyle(styleId ?? (currentStyle === 'none' ? 'o1' : currentStyle), 'o1');
    if (next === 'none') {
      currentStyle = 'none';
      previewMode = false;
      finishIntro();
      return;
    }
    beginPlay(next, null);
  }

  function setStyle(styleId) {
    const next = normalizeStyle(styleId, 'o1');
    currentStyle = next;
    if (next === 'none') {
      previewMode = false;
      finishIntro();
      return;
    }
    if (previewMode) {
      syncedDeckKey = '';
      stageEl.hidden = false;
      stageEl.classList.remove('is-done');
      stageEl.dataset.intro = currentStyle;
      active = true;
      renderAtProgress(previewU, performance.now());
      wakeHost();
      return;
    }
    // If already active mid-boot, switch visual style smoothly; if post-boot interactive switch, replay it
    if (active) {
      syncedDeckKey = '';
      stageEl.dataset.intro = currentStyle;
      renderAtProgress(u, performance.now());
    } else if (isReady) {
      beginPlay(next, null);
    }
  }

  function computeSheetFactor() {
    if (!active || (currentStyle !== 'o1' && currentStyle !== 'o2')) {
      return { lift: 0, extraCurl: 0, wallDawn: 0 };
    }
    if (u <= 0.50) {
      return { lift: 1, extraCurl: 1, wallDawn: 1 };
    }
    const v = clamp01((u - 0.50) / 0.50);
    const k = clamp01(1 - E_GLIDE(v));
    if (currentStyle === 'o1') {
      return {
        lift: k,
        extraCurl: Math.pow(k, 1.15),
        wallDawn: Math.pow(k, 0.9),
      };
    }
    // o2: subtle lift & curl settle as the dealt miniature prints cross-dissolve into the 3D sheets
    return {
      lift: k * 0.55,
      extraCurl: k * 0.85,
      wallDawn: k * 0.5,
    };
  }

  function tick(nowMs = performance.now()) {
    lastExternalTickMs = nowMs;
    if (!active) return;

    if (previewMode) {
      renderAtProgress(previewU, nowMs);
      return;
    }

    const rawDt = lastStepMs > 0 ? (nowMs - lastStepMs) / 1000 : 0;
    if (rawDt < 0.004) return;
    lastStepMs = nowMs;

    advanceProgress(Math.min(rawDt, 0.05));
    if (active) {
      renderAtProgress(u, nowMs);
    }
  }

  return {
    startInitial,
    notifyReady,
    replay,
    setStyle,
    getStyle: () => currentStyle,
    isActive: () => active,
    getSheetIntroFactor: () => computeSheetFactor(),
    tick,
  };
}
