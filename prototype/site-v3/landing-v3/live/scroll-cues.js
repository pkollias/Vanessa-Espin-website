// Vanessa Espín — Landing v3 Divergent Scroll & Poster-Navigation Cue Mocks (s1–s6)
// Pure vanilla ES module: zero dependencies, adaptive --ink/--muted/--rule tokens, 60fps DOM updates.

export const SCROLL_CUES = [
  {
    id: 's1',
    short: 'S1 · Pill Dots',
    label: 'S1 · Pill Dots',
    name: 'Expanding Pill Dots',
    pick: false,
    desc: 'Active 28×6px gallery pill + 6px story dots between ‹ › chevrons.',
  },
  {
    id: 's2',
    short: 'S2 · Dots + 1/3 ★',
    label: 'S2 · Dots + 1/3 ★',
    name: 'Minimal Dots + 1 / 3 Counter',
    pick: true,
    desc: 'Three crisp little dots + 1 / 3 counter between ‹ › chevrons, tucked directly below the poster cluster.',
  },
  {
    id: 's3',
    short: 'S3 · Named Story Bars ★',
    label: 'S3 · Named Story Bars ★',
    name: 'Editorial Story Bars with Event Names',
    pick: true,
    desc: 'Three museum-grade horizontal progress segments labeled Iyuana · Herencia Viva · Ayazamana so all 3 shows are visible at first glance.',
  },
  {
    id: 's4',
    short: 'S4 · Edge Ghost Titles ★',
    label: 'S4 · Edge Ghost Titles ★',
    name: 'Peripheral Edge Arrows + Ghost Neighbour Titles',
    pick: true,
    desc: 'Breathing left/right mid-margin cues (“← Iyuana” / “Ayazamana →”) in peripheral vision paired with 3 minimal center dots.',
  },
  {
    id: 's5',
    short: 'S5 · Mini Poster Strip',
    label: 'S5 · Mini Poster Strip',
    name: 'Miniature Poster Strip + Chevrons',
    pick: false,
    desc: 'Three uncropped 22×28px miniature poster prints between ← and →; active print lifts 3px in natural colour while neighbours wait softly.',
  },
  {
    id: 's6',
    short: 'S6 · Vernier Scale Dial',
    label: 'S6 · Vernier Scale Dial',
    name: 'Architectural Vernier Scale & Continuous Needle',
    pick: false,
    desc: '180px curatorial 13-tick ruler with a live diamond needle coupled 1:1 to continuous stage position p (0.00..2.00) and 01 / 03 readout.',
  },
];

export const CUES = SCROLL_CUES;

const VALID_CUES = new Set([...SCROLL_CUES.map((c) => c.id), 'none']);

const FALLBACK_EXHIBITIONS = [
  { slug: 'iyuana', num: '01', name: 'Iyuana', poster: '../img/iyuana.jpg' },
  { slug: 'herencia-viva', num: '02', name: 'Herencia Viva', poster: '../img/herencia-viva-ayllu.png' },
  { slug: 'ayazamana', num: '03', name: 'Ayazamana', poster: '../img/ayazamana.png?v=20261123a' },
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeCueId(raw) {
  if (raw === 'off' || raw === 'none' || raw === false) return 'none';
  const s = String(raw || '').trim().toLowerCase();
  return VALID_CUES.has(s) ? s : 's2';
}

function ensureStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('scroll-cues-css')) return;
  const existing = document.querySelector('link[rel="stylesheet"][href*="scroll-cues.css"]');
  if (existing) {
    existing.id = 'scroll-cues-css';
    return;
  }
  const link = document.createElement('link');
  link.id = 'scroll-cues-css';
  link.rel = 'stylesheet';
  link.href = 'scroll-cues.css';
  document.head.appendChild(link);
}

const CHEV_LEFT_SVG = `<svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M8.75 3.25L4.75 7L8.75 10.75" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHEV_RIGHT_SVG = `<svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5.25 3.25L9.25 7L5.25 10.75" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ARR_LEFT_SVG = `<svg viewBox="0 0 18 12" fill="none" aria-hidden="true"><path d="M16.5 6H2M6.25 1.75L1.75 6L6.25 10.25" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ARR_RIGHT_SVG = `<svg viewBox="0 0 18 12" fill="none" aria-hidden="true"><path d="M1.5 6H16M11.75 1.75L16.25 6L11.75 10.25" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const EDGE_LEFT_SVG = `<svg class="sc-s4-edge__arr" viewBox="0 0 22 12" fill="none" aria-hidden="true"><path d="M20.5 6H2M6.5 1.5L1.75 6L6.5 10.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const EDGE_RIGHT_SVG = `<svg class="sc-s4-edge__arr" viewBox="0 0 22 12" fill="none" aria-hidden="true"><path d="M1.5 6H20M15.5 1.5L20.25 6L15.5 10.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function createScrollCueController(ctx = {}) {
  ensureStylesheet();

  const exhibitions = Array.isArray(ctx.EXHIBITIONS) && ctx.EXHIBITIONS.length > 0
    ? ctx.EXHIBITIONS.map((ex, i) => {
        const fb = FALLBACK_EXHIBITIONS[i % FALLBACK_EXHIBITIONS.length];
        return {
          slug: ex.slug || fb.slug,
          num: ex.num || String(i + 1).padStart(2, '0'),
          name: ex.name || fb.name,
          poster: ex.poster || fb.poster,
        };
      })
    : FALLBACK_EXHIBITIONS;

  const N = exhibitions.length;
  const maxIdx = Math.max(1, N - 1);

  // Warm miniature poster cache so S5 switches with zero image flash
  if (typeof Image !== 'undefined') {
    exhibitions.forEach((ex) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = ex.poster;
    });
  }

  const urlCue = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('cue') : null;
  let currentCue = normalizeCueId(ctx.initialCue ?? ctx.cue ?? urlCue ?? 's2');
  let activeIndex = clamp(Number.isFinite(ctx.initialIndex) ? ctx.initialIndex : 0, 0, N - 1);
  let currentP = Number.isFinite(ctx.initialP) ? ctx.initialP : activeIndex;
  let hasScrolled = false;
  let lastTickMs = 0;

  // Mount #scrollCueStage inside #landingShell || document.body
  const host = (typeof document !== 'undefined')
    ? (document.getElementById('landingShell') || document.body)
    : null;

  let stageEl = (typeof document !== 'undefined') ? document.getElementById('scrollCueStage') : null;
  if (!stageEl && host) {
    stageEl = document.createElement('div');
    stageEl.id = 'scrollCueStage';
    stageEl.className = 'scroll-cue-stage';
    stageEl.setAttribute('role', 'region');
    stageEl.setAttribute('aria-label', 'Poster navigation');
    host.appendChild(stageEl);
  } else if (stageEl && host && stageEl.parentElement !== host) {
    host.appendChild(stageEl);
  }

  // Cached element refs for the currently mounted cue (zero DOM rebuild during sync/tick)
  let refs = {
    prevBtn: null,
    nextBtn: null,
    gotoBtns: [],
    capLeft: null,
    capRight: null,
    fracEl: null,
    prevKicker: null,
    prevTitle: null,
    nextKicker: null,
    nextTitle: null,
    s5Cap: null,
    s6Needle: null,
    s6MajorTicks: [],
    s6Count: null,
    s6Whisper: null,
  };

  function buildCueMarkup(cueId) {
    if (cueId === 'none') return '';

    if (cueId === 's1') {
      const dots = exhibitions.map((ex, i) => `
        <button type="button" class="sc-s1__dot-btn" data-cue-goto="${i}" aria-label="View poster ${i + 1} of ${N}: ${esc(ex.name)}">
          <span class="sc-s1__dot"></span>
        </button>
      `).join('');
      return `
        <div class="sc-dock">
          <div class="sc-s1">
            <div class="sc-s1__top">
              <button type="button" class="sc-chev sc-chev--prev" data-cue-step="-1" aria-label="Previous poster">${CHEV_LEFT_SVG}</button>
              <div class="sc-s1__dots">${dots}</div>
              <button type="button" class="sc-chev sc-chev--next" data-cue-step="1" aria-label="Next poster">${CHEV_RIGHT_SVG}</button>
            </div>
            <div class="sc-s1__whisper" aria-hidden="true">
              <span class="sc-s1__track"><span class="sc-s1__bead"></span></span>
              <span class="sc-s1__label">Scroll or swipe posters</span>
            </div>
          </div>
        </div>
      `;
    }

    if (cueId === 's2') {
      const dots = exhibitions.map((ex, i) => `
        <button type="button" class="sc-s2__dot-btn" data-cue-goto="${i}" aria-label="View poster ${i + 1} of ${N}: ${esc(ex.name)}">
          <span class="sc-s2__dot"></span>
        </button>
      `).join('');
      return `
        <div class="sc-dock">
          <div class="sc-s2">
            <button type="button" class="sc-chev sc-chev--prev" data-cue-step="-1" aria-label="Previous poster">${CHEV_LEFT_SVG}</button>
            <div class="sc-s2__dots">${dots}</div>
            <span class="sc-s2__frac">1 / ${N}</span>
            <button type="button" class="sc-chev sc-chev--next" data-cue-step="1" aria-label="Next poster">${CHEV_RIGHT_SVG}</button>
          </div>
        </div>
      `;
    }

    if (cueId === 's3') {
      const segs = exhibitions.map((ex, i) => `
        <button type="button" class="sc-s3__seg" data-cue-goto="${i}" aria-label="Poster ${i + 1} of ${N}: ${esc(ex.name)}">
          <span class="sc-s3__rail" aria-hidden="true">
            <span class="sc-s3__rule"></span>
            <span class="sc-s3__fill"></span>
          </span>
          <span class="sc-s3__name">${esc(ex.name)}</span>
        </button>
      `).join('');
      return `
        <div class="sc-dock">
          <div class="sc-s3">
            <button type="button" class="sc-chev sc-chev--prev" data-cue-step="-1" aria-label="Previous poster">${CHEV_LEFT_SVG}</button>
            <div class="sc-s3__bars">${segs}</div>
            <button type="button" class="sc-chev sc-chev--next" data-cue-step="1" aria-label="Next poster">${CHEV_RIGHT_SVG}</button>
          </div>
        </div>
      `;
    }

    if (cueId === 's4') {
      const dots = exhibitions.map((ex, i) => `
        <button type="button" class="sc-s4-dots__btn" data-cue-goto="${i}" aria-label="Poster ${i + 1} of ${N}: ${esc(ex.name)}">
          <span class="sc-s4-dots__dot"></span>
        </button>
      `).join('');
      return `
        <button type="button" class="sc-s4-edge sc-s4-edge--prev" data-cue-step="-1" aria-label="Previous poster">
          <span class="sc-s4-edge__nudge">
            ${EDGE_LEFT_SVG}
            <span class="sc-s4-edge__meta">
              <span class="sc-s4-edge__kicker" data-s4-prev-kicker>01</span>
              <span class="sc-s4-edge__title" data-s4-prev-title>Iyuana</span>
            </span>
          </span>
        </button>
        <button type="button" class="sc-s4-edge sc-s4-edge--next" data-cue-step="1" aria-label="Next poster">
          <span class="sc-s4-edge__nudge">
            <span class="sc-s4-edge__meta">
              <span class="sc-s4-edge__kicker" data-s4-next-kicker>02</span>
              <span class="sc-s4-edge__title" data-s4-next-title>Herencia Viva</span>
            </span>
            ${EDGE_RIGHT_SVG}
          </span>
        </button>
        <div class="sc-dock">
          <div class="sc-s4-dots">${dots}</div>
        </div>
      `;
    }

    if (cueId === 's5') {
      const thumbs = exhibitions.map((ex, i) => `
        <button type="button" class="sc-s5__thumb" data-cue-goto="${i}" title="${esc(ex.name)}" aria-label="Poster ${i + 1} of ${N}: ${esc(ex.name)}">
          <img class="sc-s5__img" src="${esc(ex.poster)}" alt="${esc(ex.name)}" decoding="async">
        </button>
      `).join('');
      return `
        <div class="sc-dock">
          <div class="sc-s5">
            <div class="sc-s5__deck">
              <button type="button" class="sc-chev sc-chev--prev" data-cue-step="-1" aria-label="Previous poster">${ARR_LEFT_SVG}</button>
              <div class="sc-s5__strip">${thumbs}</div>
              <button type="button" class="sc-chev sc-chev--next" data-cue-step="1" aria-label="Next poster">${ARR_RIGHT_SVG}</button>
            </div>
            <span class="sc-s5__cap" aria-hidden="true">1 / ${N} · Scroll posters</span>
          </div>
        </div>
      `;
    }

    if (cueId === 's6') {
      const ticks = [];
      const TOTAL_TICKS = 13; // 0..12, major at 0, 6, 12
      for (let t = 0; t < TOTAL_TICKS; t++) {
        const isMajor = t % 6 === 0;
        const isMid = !isMajor && t % 3 === 0;
        const cls = isMajor
          ? 'sc-s6__tick sc-s6__tick--major'
          : isMid
            ? 'sc-s6__tick sc-s6__tick--mid'
            : 'sc-s6__tick';
        const majorAttr = isMajor ? ` data-s6-major="${t / 6}"` : '';
        ticks.push(`<span class="${cls}"${majorAttr}></span>`);
      }
      const zones = exhibitions.map((ex, i) => `
        <button type="button" class="sc-s6__zone" data-cue-goto="${i}" aria-label="Jump to ${esc(ex.name)} (${i + 1} of ${N})"></button>
      `).join('');
      return `
        <div class="sc-dock">
          <div class="sc-s6">
            <div class="sc-s6__row">
              <button type="button" class="sc-chev sc-chev--prev" data-cue-step="-1" aria-label="Previous poster">${CHEV_LEFT_SVG}</button>
              <div class="sc-s6__scale">
                ${ticks.join('')}
                <span class="sc-s6__needle" data-s6-needle aria-hidden="true"></span>
                <div class="sc-s6__zones">${zones}</div>
              </div>
              <button type="button" class="sc-chev sc-chev--next" data-cue-step="1" aria-label="Next poster">${CHEV_RIGHT_SVG}</button>
            </div>
            <div class="sc-s6__meta" aria-hidden="true">
              <span class="sc-s6__count" data-s6-count>01 / 0${N}</span>
              <span class="sc-s6__whisper" data-s6-whisper>· Scroll ← →</span>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  function cacheRefs() {
    if (!stageEl) return;
    refs = {
      prevBtn: stageEl.querySelector('[data-cue-step="-1"]'),
      nextBtn: stageEl.querySelector('[data-cue-step="1"]'),
      gotoBtns: Array.from(stageEl.querySelectorAll('[data-cue-goto]')),
      capLeft: stageEl.querySelector('[data-cue-capsule="-1"]'),
      capRight: stageEl.querySelector('[data-cue-capsule="1"]'),
      fracEl: stageEl.querySelector('.sc-s2__frac'),
      prevKicker: stageEl.querySelector('[data-s4-prev-kicker]'),
      prevTitle: stageEl.querySelector('[data-s4-prev-title]'),
      nextKicker: stageEl.querySelector('[data-s4-next-kicker]'),
      nextTitle: stageEl.querySelector('[data-s4-next-title]'),
      s5Cap: stageEl.querySelector('.sc-s5__cap'),
      s6Needle: stageEl.querySelector('[data-s6-needle]'),
      s6MajorTicks: Array.from(stageEl.querySelectorAll('[data-s6-major]')),
      s6Count: stageEl.querySelector('[data-s6-count]'),
      s6Whisper: stageEl.querySelector('[data-s6-whisper]'),
    };
  }

  function applyButtonBound(btn, disabled) {
    if (!btn) return;
    btn.disabled = disabled;
    btn.classList.toggle('is-disabled', disabled);
    btn.setAttribute('aria-disabled', String(disabled));
  }

  function syncDOM() {
    if (!stageEl) return;
    stageEl.dataset.cue = currentCue;
    stageEl.classList.toggle('has-scrolled', hasScrolled);
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.cue = currentCue;
    }

    if (currentCue === 'none') return;

    const atStart = activeIndex <= 0;
    const atEnd = activeIndex >= N - 1;
    stageEl.dataset.dir = atStart ? 'right' : atEnd ? 'left' : 'both';

    applyButtonBound(refs.prevBtn, atStart);
    applyButtonBound(refs.nextBtn, atEnd);
    applyButtonBound(refs.capLeft, atStart);
    applyButtonBound(refs.capRight, atEnd);

    for (let i = 0; i < refs.gotoBtns.length; i++) {
      const b = refs.gotoBtns[i];
      const idx = +b.dataset.cueGoto;
      const on = idx === activeIndex;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-current', on ? 'true' : 'false');
    }

    if (refs.fracEl) {
      refs.fracEl.textContent = `${activeIndex + 1} / ${N}`;
    }

    if (currentCue === 's4') {
      if (!atStart) {
        const prevEx = exhibitions[activeIndex - 1];
        if (refs.prevKicker) refs.prevKicker.textContent = prevEx.num;
        if (refs.prevTitle) refs.prevTitle.textContent = prevEx.name;
        if (refs.prevBtn) refs.prevBtn.setAttribute('aria-label', `Previous poster: ${prevEx.name}`);
      }
      if (!atEnd) {
        const nextEx = exhibitions[activeIndex + 1];
        if (refs.nextKicker) refs.nextKicker.textContent = nextEx.num;
        if (refs.nextTitle) refs.nextTitle.textContent = nextEx.name;
        if (refs.nextBtn) refs.nextBtn.setAttribute('aria-label', `Next poster: ${nextEx.name}`);
      }
    }

    if (refs.s5Cap) {
      refs.s5Cap.textContent = `${activeIndex + 1} / ${N} · Scroll posters`;
    }

    if (currentCue === 's6') {
      const u = clamp(currentP, 0, maxIdx) / maxIdx;
      if (refs.s6Needle) {
        refs.s6Needle.style.transform = `translate3d(${(u * 100).toFixed(3)}%, 0, 0)`;
      }
      for (let i = 0; i < refs.s6MajorTicks.length; i++) {
        const tEl = refs.s6MajorTicks[i];
        tEl.classList.toggle('is-active', +tEl.dataset.s6Major === activeIndex);
      }
      if (refs.s6Count) {
        refs.s6Count.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
      }
      if (refs.s6Whisper) {
        refs.s6Whisper.textContent = atStart ? '· Scroll →' : atEnd ? '· Scroll ←' : '· Scroll ← →';
      }
    }
  }

  function mountCurrentCue() {
    if (!stageEl) return;
    stageEl.innerHTML = buildCueMarkup(currentCue);
    cacheRefs();
    syncDOM();
  }

  if (stageEl) {
    stageEl.addEventListener('click', (e) => {
      const gotoEl = e.target.closest('[data-cue-goto]');
      if (gotoEl && stageEl.contains(gotoEl)) {
        const idx = Number(gotoEl.dataset.cueGoto);
        if (Number.isFinite(idx)) {
          ctx.goToExhibition?.(clamp(idx, 0, N - 1));
        }
        return;
      }

      const stepEl = e.target.closest('[data-cue-step], [data-cue-capsule]');
      if (stepEl && stageEl.contains(stepEl)) {
        if (stepEl.disabled || stepEl.classList.contains('is-disabled')) return;
        const raw = stepEl.dataset.cueStep ?? stepEl.dataset.cueCapsule;
        const delta = Number(raw);
        if (Number.isFinite(delta) && delta !== 0) {
          if (typeof ctx.stepBy === 'function') {
            ctx.stepBy(delta);
          } else if (typeof ctx.goToExhibition === 'function') {
            ctx.goToExhibition(clamp(activeIndex + delta, 0, N - 1));
          }
        }
      }
    });
  }

  mountCurrentCue();

  return {
    setCue(id) {
      const next = normalizeCueId(id);
      if (next === currentCue && stageEl && stageEl.dataset.cue === next) {
        syncDOM();
        return;
      }
      currentCue = next;
      hasScrolled = false;
      mountCurrentCue();
    },

    getCue: () => currentCue,

    sync(activeIdx, p) {
      const resolvedP = Number.isFinite(p)
        ? p
        : (Number.isFinite(activeIdx) ? activeIdx : currentP);
      const resolvedActive = Number.isFinite(activeIdx)
        ? clamp(Math.round(activeIdx), 0, N - 1)
        : clamp(Math.round(resolvedP), 0, N - 1);

      const activeChanged = resolvedActive !== activeIndex;
      const pChanged = Math.abs(resolvedP - currentP) > 0.0004;

      activeIndex = resolvedActive;
      currentP = resolvedP;

      if (activeChanged) {
        syncDOM();
      } else if (pChanged && currentCue === 's6' && refs.s6Needle) {
        const u = clamp(currentP, 0, maxIdx) / maxIdx;
        refs.s6Needle.style.transform = `translate3d(${(u * 100).toFixed(3)}%, 0, 0)`;
      }
    },

    markScrolled() {
      if (hasScrolled) return;
      hasScrolled = true;
      if (stageEl) stageEl.classList.add('has-scrolled');
    },

    tick(nowMs = 0) {
      lastTickMs = nowMs;
      return lastTickMs;
    },
  };
}
