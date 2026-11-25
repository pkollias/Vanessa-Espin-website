// Shared Piecewise-Monotonic (`C¹` Fritsch-Carlson PCHIP) Narrative Schedule for Iyuana (v3)
// Drives BOTH `/concepts/iyuana/aisle-final-v6/` and `/concepts/iyuana/trajectories/`.

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// Canonical normalized positions `uCanon = px / 9300` along the 4-panel Iyuana route (`panels-4`)
// (walk+lingers = 5540, END = 1900 -> 7440, HOLD_SE = 560 -> 8000, BACK = 1080 -> 9080, SP = 220 -> 9300)
export const CANON_TOTAL_PX = 9300;
export const SCHEDULE_VERSION = 7;

export const STATION_DEFS = [
  {
    id: 'p1', label: 'Panel 1 · Selva Viva', short: 'Panel 1', color: '#2563eb',
    uArrive: 920 / CANON_TOTAL_PX, uLeave: 1240 / CANON_TOTAL_PX, hasQuote: true, side: -1,
    defaultQuote: 'From the Amazons to New York City!',
  },
  {
    id: 'p2', label: 'Panel 2 · El Río y la Vida', short: 'Panel 2', color: '#0d9488',
    uArrive: 1920 / CANON_TOTAL_PX, uLeave: 2240 / CANON_TOTAL_PX, hasQuote: true, side: 1,
    defaultQuote: 'A community with a story to preserve',
  },
  {
    id: 'p3', label: 'Panel 3 · Guardians of the Forest', short: 'Panel 3', color: '#7c3aed',
    uArrive: 2920 / CANON_TOTAL_PX, uLeave: 3240 / CANON_TOTAL_PX, hasQuote: true, side: -1,
    defaultQuote: 'Told through the voice of the Sápara artist Yanda Montahuano and his collaborators',
  },
  {
    id: 'p4', label: 'Panel 4 · El Retorno de los Sueños', short: 'Panel 4', color: '#b45309',
    uArrive: 3920 / CANON_TOTAL_PX, uLeave: 4240 / CANON_TOTAL_PX, hasQuote: true, side: 1,
    defaultQuote: 'Curated through the lens of...',
  },
  {
    id: 'film', label: 'Canopy Film Circle', short: 'Canopy Film', color: '#0284c7',
    uArrive: 5120 / CANON_TOTAL_PX, uLeave: 5540 / CANON_TOTAL_PX, hasQuote: false, side: 0,
    defaultQuote: '',
  },
  {
    id: 'poster', label: 'Main Poster (Close View · Vanessa Espín)', short: 'Main Poster', color: '#c2410c',
    uArrive: 7440 / CANON_TOTAL_PX, uLeave: 8000 / CANON_TOTAL_PX, hasQuote: false, side: 0,
    defaultQuote: '',
  },
];

export const U_ROOM_SETTLE = 9080 / CANON_TOTAL_PX; // Pull-back from closer poster view (SE) settles at room view (SP)

export const SCHEDULE_PRESETS = {
  balanced: {
    version: SCHEDULE_VERSION,
    name: 'Narrative Default ★ (33.0s · Unhurried Intro + Exact 4.4s Fire Transition)',
    departSec: 1.45,
    stops: {
      p1:     { arrive: 5.45,  leave: 7.45,  quote: STATION_DEFS[0].defaultQuote },
      p2:     { arrive: 9.55,  leave: 11.55, quote: STATION_DEFS[1].defaultQuote },
      p3:     { arrive: 13.65, leave: 15.85, quote: STATION_DEFS[2].defaultQuote },
      p4:     { arrive: 17.95, leave: 19.95, quote: STATION_DEFS[3].defaultQuote },
      film:   { arrive: 21.85, leave: 22.85, quote: '' },
      poster: { arrive: 27.25, leave: 29.50, quote: '' },
    },
    roomSec: 31.9,
    totalSec: 33.0,
    extraKnots: [],
  },
  relaxed34: {
    version: SCHEDULE_VERSION,
    name: 'Unhurried Salon (34.0s · ~3.5s Panels + 4.0s Close Poster)',
    departSec: 0.85,
    stops: {
      p1:     { arrive: 4.3,  leave: 6.2,  quote: STATION_DEFS[0].defaultQuote },
      p2:     { arrive: 8.5,  leave: 10.4, quote: STATION_DEFS[1].defaultQuote },
      p3:     { arrive: 12.7, leave: 14.9, quote: STATION_DEFS[2].defaultQuote },
      p4:     { arrive: 17.2, leave: 19.1, quote: STATION_DEFS[3].defaultQuote },
      film:   { arrive: 21.3, leave: 22.3, quote: '' },
      poster: { arrive: 25.6, leave: 29.6, quote: '' },
    },
    roomSec: 32.6,
    totalSec: 34.0,
    extraKnots: [],
  },
  compact26: {
    version: SCHEDULE_VERSION,
    name: 'Brisk Flow (26.5s · ~2.5s Panels + 3.1s Close Poster)',
    departSec: 0.65,
    stops: {
      p1:     { arrive: 3.4,  leave: 4.8,  quote: STATION_DEFS[0].defaultQuote },
      p2:     { arrive: 6.6,  leave: 8.0,  quote: STATION_DEFS[1].defaultQuote },
      p3:     { arrive: 9.8,  leave: 11.4, quote: STATION_DEFS[2].defaultQuote },
      p4:     { arrive: 13.2, leave: 14.6, quote: STATION_DEFS[3].defaultQuote },
      film:   { arrive: 16.4, leave: 17.2, quote: '' },
      poster: { arrive: 20.0, leave: 23.1, quote: '' },
    },
    roomSec: 25.5,
    totalSec: 26.5,
    extraKnots: [],
  },
};

export function cloneSchedule(src = SCHEDULE_PRESETS.balanced) {
  return JSON.parse(JSON.stringify(src));
}

export function normalizeSchedule(raw) {
  const s = cloneSchedule(raw || SCHEDULE_PRESETS.balanced);
  s.version = SCHEDULE_VERSION;
  s.departSec = clamp(Number(s.departSec) || 0, 0, 8.0);
  let prevT = s.departSec;
  const minLinger = 0.15;

  for (const def of STATION_DEFS) {
    const minTransit = def.id === 'poster' ? 0.9 : 0.45;
    const st = s.stops?.[def.id] || { arrive: prevT + 2.0, leave: prevT + 3.5, quote: def.defaultQuote };
    st.arrive = Math.max(prevT + minTransit, Number(st.arrive) || prevT + 2.0);
    st.leave = Math.max(st.arrive + minLinger, Number(st.leave) || st.arrive + 1.6);
    st.quote = typeof st.quote === 'string' ? st.quote : def.defaultQuote;
    s.stops[def.id] = st;
    prevT = st.leave;
  }
  s.roomSec = Math.max(prevT + 0.8, Number(s.roomSec) || prevT + 2.6);
  s.totalSec = Math.max(s.roomSec + 0.4, Math.min(90, Number(s.totalSec) || s.roomSec + 1.1));
  if (!Array.isArray(s.extraKnots)) s.extraKnots = [];
  return s;
}

export function uCanonAtUniformFilmTime(tOld, oldDur = 34.0) {
  const u = clamp(tOld / Math.max(1, oldDur), 0, 1);
  const hold = 0.015;
  if (u <= hold) return 0;
  const v = (u - hold) / (1 - hold);
  const r = 0.032;
  const eased = v < r ? (v * v) / (2 * r) : v - r / 2;
  return clamp(eased / (1 - r / 2), 0, 1);
}

// Build Fritsch-Carlson Monotone Cubic Hermite (`C¹` PCHIP) evaluator `tSec -> uCanon in [0..1]`
export function compileSchedule(rawSched) {
  const sched = normalizeSchedule(rawSched);
  const pts = [{ t: 0, u: 0 }];
  if (sched.departSec > 0.02) {
    pts.push({ t: sched.departSec, u: 0.0005 });
  }
  for (const def of STATION_DEFS) {
    const st = sched.stops[def.id];
    pts.push({ t: st.arrive, u: def.uArrive });
    pts.push({ t: st.leave, u: def.uLeave });
  }
  pts.push({ t: sched.roomSec, u: U_ROOM_SETTLE });
  pts.push({ t: sched.totalSec, u: 1.0 });

  for (const k of sched.extraKnots) {
    const kt = Number(k.tSec), ku = Number(k.uCanon);
    if (!Number.isFinite(kt) || !Number.isFinite(ku)) continue;
    const idx = pts.findIndex(p => p.t > kt);
    if (idx > 0) {
      const prev = pts[idx - 1], next = pts[idx];
      if (kt > prev.t + 0.12 && kt < next.t - 0.12 && ku > prev.u + 0.005 && ku < next.u - 0.005) {
        pts.splice(idx, 0, { t: kt, u: ku });
      }
    }
  }

  const n = pts.length;
  const ts = pts.map(p => p.t);
  const us = pts.map(p => p.u);
  const h = new Float64Array(n - 1);
  const delta = new Float64Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    h[i] = Math.max(1e-5, ts[i + 1] - ts[i]);
    delta[i] = (us[i + 1] - us[i]) / h[i];
  }

  const m = new Float64Array(n);
  m[0] = sched.departSec > 0.02 ? 0 : delta[0] * 0.65;
  m[n - 1] = delta[n - 2] * 0.20;
  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] <= 0 || delta[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]);
    }
  }

  // Preserve exact un-warped linear progression `de/dt = const` across the authored ring->fire->poster segment
  // (`film.leave` -> `poster.arrive`), matching the GitHub cut's `endCam(e)` PUSH / flame-drift / RISE curves 1:1.
  const uFilmLeave = STATION_DEFS.find(d => d.id === 'film').uLeave;
  const uPosterArrive = STATION_DEFS.find(d => d.id === 'poster').uArrive;
  const fireSegIdx = pts.findIndex((p, idx) => idx < n - 1 && Math.abs(p.u - uFilmLeave) < 1e-5 && Math.abs(pts[idx + 1].u - uPosterArrive) < 1e-5);
  if (fireSegIdx >= 0) {
    m[fireSegIdx] = delta[fireSegIdx];
    m[fireSegIdx + 1] = delta[fireSegIdx];
  }

  function uAtTimeSec(tSec) {
    if (tSec <= ts[0]) return us[0];
    if (tSec >= ts[n - 1]) return us[n - 1];
    let lo = 0, hi = n - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (ts[mid] <= tSec) lo = mid;
      else hi = mid;
    }
    const span = h[lo];
    const s = clamp((tSec - ts[lo]) / span, 0, 1);
    if (lo === fireSegIdx) {
      return clamp(us[lo] + s * (us[lo + 1] - us[lo]), 0, 1);
    }
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    return clamp(h00 * us[lo] + h10 * span * m[lo] + h01 * us[lo + 1] + h11 * span * m[lo + 1], 0, 1);
  }

  function timeSecAtU(uTarget) {
    const u = clamp(uTarget, 0, 1);
    let lo = 0, hi = sched.totalSec;
    for (let i = 0; i < 36; i++) {
      const mid = 0.5 * (lo + hi);
      if (uAtTimeSec(mid) < u) lo = mid;
      else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  function activeBeatName(tSec) {
    if (tSec <= sched.departSec + 0.1) return 'Forest Photo · Poster Title';
    for (const def of STATION_DEFS) {
      const st = sched.stops[def.id];
      if (tSec < st.arrive) return def.id === 'poster' ? 'Fire → Main Poster' : `Walk → ${def.short}`;
      if (tSec <= st.leave) return `At ${def.short}`;
    }
    if (tSec < sched.roomSec) return 'Pull-Back → Room';
    return 'Room Rest · Poster 1';
  }

  return {
    sched,
    totalSec: sched.totalSec,
    knots: pts,
    uAtTimeSec,
    timeSecAtU,
    activeBeatName,
  };
}

export function encodeScheduleParam(sched) {
  const s = normalizeSchedule(sched);
  const nums = [
    s.departSec.toFixed(2),
    ...STATION_DEFS.flatMap(d => [s.stops[d.id].arrive.toFixed(2), s.stops[d.id].leave.toFixed(2)]),
    s.roomSec.toFixed(2),
    s.totalSec.toFixed(2),
  ];
  return nums.join(',');
}

export function decodeScheduleParam(str, base = SCHEDULE_PRESETS.balanced) {
  if (!str) return null;
  const parts = str.split(',').map(Number);
  if (parts.some(x => !Number.isFinite(x))) return null;
  const out = cloneSchedule(base);
  if (parts.length >= 3 + STATION_DEFS.length * 2) {
    out.departSec = parts[0];
    STATION_DEFS.forEach((d, idx) => {
      out.stops[d.id].arrive = parts[1 + idx * 2];
      out.stops[d.id].leave = parts[2 + idx * 2];
    });
    out.roomSec = parts[1 + STATION_DEFS.length * 2];
    out.totalSec = parts[2 + STATION_DEFS.length * 2];
    return normalizeSchedule(out);
  }
  return null;
}
