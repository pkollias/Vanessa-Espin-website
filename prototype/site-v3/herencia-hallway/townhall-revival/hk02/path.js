// Regularized Non-Stopping Six-Phase Walk (`PACE_NEW` + `legAt` Hermite) + Three Bird-Flight Modes (`hk02/path.js`):
//
// Directly modeled on Iyuana's `aisle-final-v6/main.js` (`PACE_NEW` + `legAt`) and `walk-research/README.md`:
//   - NEVER fully stops: every painting gets a regularized ~1.35 s slow forward drift (~0.13 m/s, never 0.00 m/s),
//     joined to inter-painting walks by a C1 Hermite curve with non-zero endpoint slopes (`hermite(u, m0, m1)`),
//     producing crisp, even ~2.1–2.4 s visual holds (matching Iyuana's 2.1–2.7 s holds and ~25% settled share).
//   - Six phases per painting:
//       1. Notice (painting enters view down-hall)
//       2. Eyes First (gaze starts turning 0.32 s before body leaves linger — Hollands et al. 2002)
//       3. Approach Locked (Z-target lock while forward pace eases into the drift linger)
//       4. Hold / Linger (continuous ~0.13 m/s forward drift, < 1.0 deg/s screen slip)
//       5. Let Go (eyes release toward corridor/next target 0.32 s ahead of body)
//       6. Between Paintings (aim looks down the corridor toward the next work — 0% aimless bare-wall turns)
//   - Driven through a C2 critically-damped spring (`halflife = 0.16 s`) bounded <= 36 deg/s.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
export const sm3 = x => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
export const sm5 = x => { const t = clamp(x, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
export const ramp = (t, a, b) => clamp((t - a) / Math.max(1e-5, b - a), 0, 1);
const unwrap = (a, ref) => a + 360 * Math.round((ref - a) / 360);

export const FLIGHT7_PACE = 0.85;
export const EYES = {
  turn010: [0, 0.82], turn003: [0.0, 0.80], hold: 0.36,
  fps: 12, blink: { '003': 0 }, lid: [5, 6, 6, 5], restAfterBlink: 1.90,
};

// Iyuana `PACE_NEW` C1 Hermite unit interpolator on [0..1] with non-zero endpoint slopes m0, m1 > 0
function hermiteUnit(t, m0, m1) {
  const u = clamp(t, 0, 1), u2 = u * u, u3 = u2 * u;
  return (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) + (u3 - u2) * m1;
}

// Cubic Bezier evaluation in 1D (used for `legAt` corridor S-curves)
function bez1(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function makeTrack(keys, field) {
  const n = keys.length;
  const m = keys.map((k, i) => {
    if (k.flat) return 0;
    const a = keys[Math.max(0, i - 1)], b = keys[Math.min(n - 1, i + 1)];
    if (b.t === a.t) return 0;
    const sl = (b[field] - a[field]) / (b.t - a.t);
    const d0 = i > 0 ? (k[field] - a[field]) / Math.max(1e-4, k.t - a.t) : sl;
    const d1 = i < n - 1 ? (b[field] - k[field]) / Math.max(1e-4, b.t - k.t) : sl;
    if (d0 * d1 <= 0) return 0;
    const cap = 2.2 * Math.min(Math.abs(d0), Math.abs(d1));
    return Math.sign(sl) * Math.min(Math.abs(sl), cap);
  });
  return (t) => {
    if (t <= keys[0].t) return keys[0][field];
    if (t >= keys[n - 1].t) return keys[n - 1][field];
    let i = 0; while (i < n - 2 && t > keys[i + 1].t) i++;
    const a = keys[i], b = keys[i + 1], h = b.t - a.t, u = (t - a.t) / h;
    if (a.flat && b.flat) return a[field] + (b[field] - a[field]) * sm3(u);
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * a[field]
         + (u3 - 2 * u2 + u) * h * m[i]
         + (-2 * u3 + 3 * u2) * b[field]
         + (u3 - u2) * h * m[i + 1];
  };
}

// Exact analytical step of a critically-damped 2nd-order spring (Holden 2021)
function springStep(x, v, goal, halflife, dt) {
  const y = (4.0 * 0.69314718056) / Math.max(1e-4, halflife) * 0.5;
  const j0 = x - goal;
  const j1 = v + j0 * y;
  const eydt = Math.exp(-y * dt);
  return [eydt * (j0 + j1 * dt) + goal, eydt * (v - j1 * y * dt)];
}

export function buildTimeline(layout, opts = {}) {
  const flightMode = +(opts.flightMode || 1);
  const C = layout.cam, HW = layout.hall.width / 2, AR = layout.hall.arch;
  const VH = (layout.hall.alcoveWidth ?? 3.00) / 2;
  const ceilH = layout.hall.ceiling ?? 4.02;
  const st = C.start, bl = C.blink, en = C.end;
  const findArt = id => (layout.art || []).find(a => a.id === id);

  const a003 = findArt('003');
  const a010 = findArt('010');

  // ---------------------------------------------------------------------------
  // 0. Dedicated Pre-Walk Logo Prelude (`0 .. T_LOGO`, default 3.25 s)
  //    Unified C2-smoothly into the first walk approach (ZERO splice or yank at 3.25 s!)
  // ---------------------------------------------------------------------------
  const T_LOGO = opts.prelude === false ? 0.0 : (opts.preludeSec ?? 3.25);
  const sPre = Math.max(
    layout.hall.start + 0.55,
    (layout.stand && st.s > layout.stand.s + 0.15)
      ? Math.max(layout.stand.s + 0.12, st.s - 0.64)
      : st.s - 0.64
  );
  // Dynamic corridor paintings: hung corridor works in `(st.s + 2.0 .. AR - 0.75)` sorted by `s`.
  // Prioritize hero Medina canvases (`086`, `010`, `090`, `006`) over flanking companions (`site-04`, `site-05`)
  // and frameless posters so the walk visits Fish (086) -> Fruit-Tree Woman (010) -> Mona Lisa (090) -> Red Tree (006)!
  const FLANK_OR_POSTER = new Set([
    'site-04-andean-figures', 'site-05-village-painting',
    '000', '011', '012', '013', '014', '015', '018',
  ]);
  const allCorrArts = (layout.art || [])
    .filter(a => a.hung !== false && a.id !== '003' && a.s > st.s + 2.0 && a.s < AR - 0.75)
    .sort((p, q) => p.s - q.s);
  const heroCorrArts = allCorrArts.filter(a => !FLANK_OR_POSTER.has(a.id));
  const rawCorrArts = heroCorrArts.length >= 2 ? heroCorrArts : allCorrArts;
  const pickedArts = [];
  let simPrevS = st.s;
  for (const a of rawCorrArts) {
    const prev = pickedArts[pickedArts.length - 1];
    const minGap = prev ? (a.wall === prev.wall ? 1.45 : 1.15) : 0;
    if (!prev || a.s - prev.s >= minGap) {
      const nextRest = Math.max(simPrevS + (pickedArts.length === 0 ? 0.48 : 1.15), Math.min(AR - 1.35, a.s - 2.28));
      if (nextRest <= AR - 1.25) {
        pickedArts.push(a);
        simPrevS = nextRest;
      }
    }
  }

  const forwardWalk = bl.s > st.s + 2.0 && pickedArts.length > 0;
  // Align prelude lateral lane cleanly with the first corridor painting standoff so there is ZERO lateral direction reversal!
  const firstArt = pickedArts[0];
  const firstWallSg = firstArt ? (firstArt.wall === 'L' ? -1 : 1) : 1;
  const firstWallX = firstWallSg * (HW - 0.05);
  const xPreTarget = firstArt
    ? clamp(-firstWallSg * Math.max(0.22, 2.02 - Math.abs(firstWallX)), -HW + 0.50, HW - 0.50)
    : clamp(st.x, -HW + 0.50, HW - 0.50);
  const xPre = T_LOGO > 0 ? xPreTarget : st.x;
  const hPre = st.h ?? 1.58;
  const dirPre = T_LOGO > 0 ? ((st.dir ?? 32.0) - 9.5) : (st.dir ?? 32.0);
  const pitchPre = (st.pitch ?? 1.8) - (T_LOGO > 0 ? 0.2 : 0.0);
  const fovPre = st.fov ?? 53.0;

  // ---------------------------------------------------------------------------
  // 1. Unified C2 Prelude + Six-Phase Walk (`0 .. T_WALK`, never stops & never yanks!)
  // ---------------------------------------------------------------------------
  let T_WALK = +(T_LOGO + 17.75).toFixed(3);
  let walkPoseAt = null;
  let walkStationsMeta = [];
  let walkEndYaw = bl.dir ?? 270;

  if (forwardWalk) {
    const CORR_PRESETS = {
      '086': { backM: 2.18, fov: 53.0 },
      '010': { backM: 2.24, fov: 53.0 },
      '090': { backM: 2.34, fov: 53.0 },
      '006': { backM: 2.30, fov: 53.5 },
    };
    const corridorArts = pickedArts.map(a => ({
      id: a.id,
      art: a,
      backM: CORR_PRESETS[a.id]?.backM ?? 2.28,
      fov: CORR_PRESETS[a.id]?.fov ?? 53.0,
    }));
    const N_CORR = corridorArts.length;

    // Author composed Rest Stations S0 (prelude/walk start), S1..S_{N_CORR} (corridor paintings), S_last (Alcove / 003):
    const S_NODES = [
      { id: 'start', s: T_LOGO > 0 ? sPre : st.s, x: xPre, h: hPre, fov: fovPre },
    ];
    let prevNodeS = st.s;
    for (let i = 0; i < N_CORR; i++) {
      const stn = corridorArts[i], a = stn.art;
      const sg = a.wall === 'L' ? -1 : 1;
      const xWall = sg * (a.s > AR ? (VH - 0.05) : (HW - 0.05));
      // Keep natural ~2.02 m lateral standoff in narrowed 3.44 m corridor so head turns stay gentle (~42 deg)!
      const xRest = clamp(-sg * Math.max(0.22, 2.02 - Math.abs(xWall)), -HW + 0.50, HW - 0.50);
      const sRest = Math.min(AR - 1.25, Math.max(prevNodeS + (i === 0 ? 0.48 : 1.15), Math.min(AR - 1.35, a.s - stn.backM)));
      S_NODES.push({
        id: stn.id, s: sRest, x: xRest, h: 1.58, fov: stn.fov,
        artX: xWall, artS: a.s, artY: a.y + 0.01, artW: a.w,
      });
      prevNodeS = sRest;
    }

    // S_last: Left-alcove portrait (`003`) blink activation station (direct single-leg arch glide)
    const sg3 = a003 ? (a003.wall === 'L' ? -1 : 1) : -1;
    S_NODES.push({
      id: 'alcove', s: bl.s, x: bl.x, h: bl.h ?? 1.60, fov: bl.fov ?? 56.0,
      artX: sg3 * (VH - 0.05),
      artS: a003 ? a003.s : bl.s,
      artY: a003 ? a003.y : 1.82,
      artW: a003 ? a003.w : 1.50,
    });

    const N_LEGS = S_NODES.length - 1;

    // Build `LEGS` Cubic Bezier corridor route (`u` in [0..N_LEGS], station `j` at `u = j`), just like Iyuana's `legAt`!
    const LEGS = [];
    for (let i = 0; i < N_LEGS; i++) {
      const A = S_NODES[i], B = S_NODES[i + 1];
      const ds = Math.max(0.2, B.s - A.s);
      if (i === N_LEGS - 1 && B.s > AR && A.s < AR) {
        // Single smooth Bezier walk leg from last corridor station through the `s = AR` arch straight into `bl` (`003`):
        LEGS.push({
          s0: A.s, s1: A.s + ds * 0.34, s2: AR + 0.32, s3: B.s,
          x0: A.x, x1: A.x * 0.55,      x2: clamp(B.x * 0.32, -0.30, 0.30), x3: B.x,
          h0: A.h, h3: B.h, f0: A.fov, f3: B.fov,
          chord: Math.hypot(ds, B.x - A.x),
        });
      } else {
        // Corridor-aligned longitudinal tangents (`dx/ds = 0` at stations so lateral sway eases gently in & out!)
        LEGS.push({
          s0: A.s, s1: A.s + ds / 3, s2: B.s - ds / 3, s3: B.s,
          x0: A.x, x1: A.x,          x2: B.x,          x3: B.x,
          h0: A.h, h3: B.h, f0: A.fov, f3: B.fov,
          chord: Math.hypot(ds, B.x - A.x),
        });
      }
    }

    function evalRouteAtU(uRaw) {
      const u = clamp(uRaw, 0, N_LEGS);
      const i = Math.min(N_LEGS - 1, Math.floor(u));
      const tt = u - i;
      const g = LEGS[i];
      return {
        s: bez1(g.s0, g.s1, g.s2, g.s3, tt),
        x: bez1(g.x0, g.x1, g.x2, g.x3, tt),
        h: lerp(g.h0, g.h3, sm3(tt)),
        fov: lerp(g.f0, g.f3, sm3(tt)),
      };
    }

    // Every station j = 1..N_LEGS gets a regularized slow drift linger advancing at `DRIFT_MPS = 0.132 m/s`
    // (NEVER 0.00 m/s — continuous forward motion like Iyuana's `PACE_NEW`!), joined by C1 Hermite walk legs!
    const DRIFT_MPS = 0.132;
    const LINGER_SEC = [0.0];
    for (let j = 1; j <= N_CORR; j++) {
      LINGER_SEC.push(j === 1 ? 1.55 : (j === N_CORR ? 1.88 : 1.70));
    }
    LINGER_SEC.push(1.15); // crisp settle linger on `'003'`!

    const aHalf = [0.0];
    for (let j = 1; j <= N_LEGS; j++) {
      const pMinus = evalRouteAtU(Math.max(0, j - 0.05)), pPlus = evalRouteAtU(Math.min(N_LEGS, j + (j < N_LEGS ? 0.05 : 0.0)));
      const spanU = (j < N_LEGS) ? 0.10 : 0.05;
      const mPerU = Math.max(0.6, Math.hypot(pPlus.s - pMinus.s, pPlus.x - pMinus.x) / spanU);
      const duTot = (DRIFT_MPS * LINGER_SEC[j]) / mPerU;
      aHalf.push(clamp(duTot * 0.5, 0.022, 0.14));
    }

    // Walk leg durations — Leg 0 spans the entire prelude + smooth glide onto painting #1 (`T_LOGO + 2.15 s`) with ZERO splice!
    const WALK_SEC = LEGS.map((g, i) => {
      if (i === 0) return T_LOGO > 0 ? (T_LOGO + 2.15) : 2.05;
      if (i === N_LEGS - 1) return 3.85; // S_last_corridor (`006`) -> alcove (`003`) single smooth arch leg
      if (i === 1 && S_NODES[1]?.artX && S_NODES[2]?.artX && Math.sign(S_NODES[1].artX) === Math.sign(S_NODES[2].artX)) {
        return 2.10; // crisp same-wall crab-walk (`086` Fish -> `010` Fruit-Tree Woman)
      }
      if (i === 1) return 2.55;
      if (i === N_CORR - 1) return 2.95; // `090` -> `006` (across to Red Tree!)
      return clamp(g.chord / 0.88, 2.55, 3.25);
    });

    const pieces = [];
    let tCursor = 0.0;
    const stationWindows = [];

    for (let i = 0; i < N_LEGS; i++) {
      const u0 = i === 0 ? 0.0 : (i + aHalf[i]);
      const u1 = (i === N_LEGS - 1) ? (N_LEGS - 2 * aHalf[N_LEGS]) : ((i + 1) - aHalf[i + 1]);
      const du = Math.max(0.08, u1 - u0);
      const durW = WALK_SEC[i];

      const ratePrev = i === 0
        ? (du / durW) * (T_LOGO > 0 ? 0.62 : 0.55)
        : (2 * aHalf[i]) / LINGER_SEC[i];
      const rateNext = (2 * aHalf[i + 1]) / LINGER_SEC[i + 1];
      const m0 = clamp((ratePrev * durW) / du, 0.06, 0.72);
      const m1 = clamp((rateNext * durW) / du, 0.06, 0.65);

      pieces.push({ kind: 'walk', t0: tCursor, dur: durW, u0, u1, m0, m1 });
      tCursor += durW;

      const j = i + 1;
      const lu0 = (j === N_LEGS) ? (N_LEGS - 2 * aHalf[N_LEGS]) : (j - aHalf[j]);
      const lu1 = (j === N_LEGS) ? N_LEGS : (j + aHalf[j]);
      const lDur = LINGER_SEC[j];
      pieces.push({ kind: 'linger', t0: tCursor, dur: lDur, u0: lu0, u1: lu1, j });
      stationWindows.push({
        j, id: S_NODES[j].id,
        tArrive: tCursor, tLeave: tCursor + lDur, tMid: tCursor + lDur * 0.5,
        node: S_NODES[j],
      });
      if (j < N_LEGS) {
        walkStationsMeta.push({ id: S_NODES[j].id, s: S_NODES[j].s, x: S_NODES[j].x, tMid: tCursor + lDur * 0.5 });
      }
      tCursor += lDur;
    }
    T_WALK = +tCursor.toFixed(3);

    function uAtTime(t) {
      if (t <= 0) return 0;
      if (t >= T_WALK) return N_LEGS;
      const p = pieces.find(q => t < q.t0 + q.dur) || pieces[pieces.length - 1];
      const tau = clamp((t - p.t0) / p.dur, 0, 1);
      return p.kind === 'walk' ? lerp(p.u0, p.u1, hermiteUnit(tau, p.m0, p.m1)) : lerp(p.u0, p.u1, tau);
    }

    function bearingDeg(cs, cx, tx, ts) {
      return Math.atan2(tx - cx, ts - cs) * 180 / Math.PI;
    }
    function pitchDeg(cs, cx, ch, tx, ty, ts) {
      return clamp(Math.atan2(ty - ch, Math.max(0.35, Math.hypot(ts - cs, tx - cx))) * 180 / Math.PI, -10, 10);
    }

    // Six-Phase Gaze Goal (`Prelude Drift -> Notice -> Eyes First (0.32s lead) -> Approach Locked -> Linger -> Let Go -> Direct 003`):
    const EYE_LEAD = 0.32; // eyes start turning 0.32 s before body leaves the linger (Hollands et al. 2002)!
    const swLastCorr = stationWindows[N_CORR - 1];
    const swAlcove = stationWindows[N_LEGS - 1];
    const tSkimStart = swLastCorr.tLeave - EYE_LEAD;
    const aAlcoveSide = (layout.art || []).find(a => a.hung !== false && a.s > AR && a !== a003);
    const hasSideAlcoveArt = !!aAlcoveSide;
    const sg10 = aAlcoveSide ? (aAlcoveSide.wall === 'L' ? -1 : 1) : 1;
    const tAlcoveTurn = tSkimStart + (hasSideAlcoveArt ? 1.35 : 0.95);

    const isSameWallNeighbor = (idx) => {
      if (idx <= 0 || idx >= N_CORR) return false;
      const a = stationWindows[idx - 1].node, b = stationWindows[idx].node;
      return Math.sign(a.artX) === Math.sign(b.artX) && (b.artS - a.artS) < 2.8;
    };

    function rawDesiredAim(t, pos) {
      const cs = pos.s, cx = pos.x, ch = pos.h;

      // Corridor stations j = 1..N_CORR (`086`, `010`, `090`, `006`)
      for (let idx = 0; idx < N_CORR; idx++) {
        const sw = stationWindows[idx];
        const nd = sw.node;
        const lockRelease = sw.tLeave - EYE_LEAD;

        if (t <= lockRelease) {
          if (idx === 0) {
            // Silky quintic C2 blend from the slow prelude corridor gaze straight onto painting #1 (`086`) — ZERO yank at 3.25 s!
            const artYaw = bearingDeg(cs, cx, nd.artX, nd.artS);
            const artPit = pitchDeg(cs, cx, ch, nd.artX, nd.artY, nd.artS);
            const wTurn = T_LOGO > 0
              ? sm5(ramp(t, T_LOGO * 0.52, sw.tArrive - 0.55))
              : sm5(ramp(t, 0.0, sw.tArrive - 0.45));
            return {
              yaw: lerp(dirPre, artYaw, wTurn),
              pit: lerp(pitchPre, artPit, wTurn),
            };
          }
          if (isSameWallNeighbor(idx)) {
            // Same-wall neighbor crab-walk (`086` Fish -> `010` Fruit-Tree Woman):
            // NEVER look away down the empty hallway! Glide gaze directly across the 46 cm gap onto `010`
            // and stay warmly fixated on her as you walk closer until done!
            const prevSw = stationWindows[idx - 1];
            const prevNd = prevSw.node;
            const tShift0 = prevSw.tLeave - EYE_LEAD;
            const wShift = sm5(ramp(t, tShift0, tShift0 + 0.85));
            const prevYaw = bearingDeg(cs, cx, prevNd.artX, prevNd.artS);
            const prevPit = pitchDeg(cs, cx, ch, prevNd.artX, prevNd.artY, prevNd.artS);
            const nextYaw = bearingDeg(cs, cx, nd.artX, nd.artS);
            const nextPit = pitchDeg(cs, cx, ch, nd.artX, nd.artY, nd.artS);
            return {
              yaw: lerp(prevYaw, nextYaw, wShift),
              pit: lerp(prevPit, nextPit, wShift),
            };
          }
          const lockOnset = sw.tArrive - (idx === N_CORR - 1 ? 1.75 : 1.50);
          if (t >= lockOnset) {
            return {
              yaw: bearingDeg(cs, cx, nd.artX, nd.artS),
              pit: pitchDeg(cs, cx, ch, nd.artX, nd.artY, nd.artS),
            };
          }
          const downBias = Math.sign(nd.artX) * 6.5;
          const nextYaw = bearingDeg(cs, cx, nd.artX, nd.artS);
          const blendAcquire = sm3(ramp(t, lockOnset - 0.65, lockOnset));
          return {
            yaw: downBias * (1 - blendAcquire) + nextYaw * blendAcquire,
            pit: 0.8,
          };
        }
      }

      // Final leg (`006 Red Tree -> alcove 003`):
      // 1) Ease cleanly forward toward the arch (briefly skimming right alcove art if hung, or gliding straight through the arch)
      if (t < tAlcoveTurn) {
        return { yaw: hasSideAlcoveArt ? sg10 * 14.5 : 5.0, pit: 1.3 };
      }
      // 2) Sweep monotonically & directly leftward straight onto `003`!
      if (a003) {
        return {
          yaw: bearingDeg(cs, cx, sg3 * (VH - 0.05), a003.s),
          pit: bl.pitch ?? 1.4,
        };
      }
      return { yaw: bl.dir ?? 270, pit: bl.pitch ?? 1.4 };
    }

    const HZ = 120;
    const N_SAMP = Math.ceil(T_WALK * HZ);
    const dt = T_WALK / N_SAMP;
    const sArr   = new Float64Array(N_SAMP + 1);
    const xArr   = new Float64Array(N_SAMP + 1);
    const hArr   = new Float64Array(N_SAMP + 1);
    const fovArr = new Float64Array(N_SAMP + 1);
    const yawArr = new Float64Array(N_SAMP + 1);
    const pitArr = new Float64Array(N_SAMP + 1);

    const allVisibleArts = (layout.art || []).filter(a => a.hung !== false).map(a => ({
      id: a.id, s: a.s, y: a.y, w: a.w,
      x: (a.wall === 'L' ? -1 : 1) * (a.s > AR ? (VH - 0.05) : (HW - 0.05)),
    }));

    // Exact 1:1 screen-center target check (`abs(bestNx) <= 0.30` among visible artworks on `aspect = 1.6`):
    function hasPaintingInMid(cs, cx, ch, yawDeg, pitDeg, fovDeg) {
      const yr = yawDeg * Math.PI / 180, pr = pitDeg * Math.PI / 180;
      const fx = Math.sin(yr) * Math.cos(pr), fy = Math.sin(pr), fs = Math.cos(yawDeg * Math.PI / 180) * Math.cos(pr);
      const rx = Math.cos(yr), rs = -Math.sin(yr);
      const ux = -rs * fy, uy = Math.cos(pr), uz = rx * fy;
      const ty = Math.tan(fovDeg * Math.PI / 360), tx = ty * 1.6;
      let bestAbs = Infinity;
      for (const a of allVisibleArts) {
        const dx = a.x - cx, dy = a.y - ch, ds = a.s - cs;
        const zc = dx * fx + dy * fy + ds * fs;
        if (zc <= 0.1) continue;
        const nx = (dx * rx + ds * rs) / (zc * tx);
        const ny = (dx * ux + dy * uy + ds * uz) / (zc * ty);
        if (Math.abs(nx) <= 1.0 && Math.abs(ny) <= 1.0 && Math.abs(nx) < bestAbs) {
          bestAbs = Math.abs(nx);
        }
      }
      return bestAbs <= 0.30;
    }

    // Smooth C1 lock weight in [0..1] (no discontinuous spring-halflife jumps!)
    function lockWeight(t) {
      let w = 0;
      for (let idx = 0; idx < N_CORR; idx++) {
        const sw = stationWindows[idx];
        const wIn = idx === 0
          ? sm3(ramp(t, sw.tArrive - 1.65, sw.tArrive - 0.40))
          : isSameWallNeighbor(idx)
            ? sm3(ramp(t, stationWindows[idx - 1].tLeave - EYE_LEAD, stationWindows[idx - 1].tLeave - EYE_LEAD + 0.55))
            : sm3(ramp(t, sw.tArrive - 0.95, sw.tArrive - 0.40));
        const wOut = 1.0 - sm3(ramp(t, sw.tLeave - EYE_LEAD - 0.12, sw.tLeave - EYE_LEAD + 0.18));
        w = Math.max(w, wIn * wOut);
      }
      const wAlcIn = sm3(ramp(t, swAlcove.tArrive - 0.85, swAlcove.tArrive - 0.25));
      return Math.max(w, wAlcIn);
    }

    let cmdYaw = dirPre, sprYaw = cmdYaw, sprVel = 0.0;
    let sprPit = pitchPre, sprPitVel = 0.0;
    const tAlcoveEntryBoost = tAlcoveTurn - 0.05;

    for (let k = 0; k <= N_SAMP; k++) {
      const tk = k * dt;
      const pos = evalRouteAtU(uAtTime(tk));
      sArr[k] = pos.s; xArr[k] = pos.x; hArr[k] = pos.h; fovArr[k] = pos.fov;

      const des = rawDesiredAim(tk, pos);
      const tgtYaw = unwrap(des.yaw, cmdYaw);

      if (k === 0) {
        sprYaw = dirPre;
        sprPit = pitchPre;
      } else {
        const yawMod = (((sprYaw % 360) + 540) % 360) - 180;
        const isDownHall = Math.abs(yawMod) <= 13.8;
        const isOnArt = hasPaintingInMid(pos.s, pos.x, pos.h, sprYaw, sprPit, pos.fov);
        // Corridor uses <= 35.5 deg/s on art/down-hall (13.8 deg/s between);
        // on the prelude glide, relax the spring halflife so the opening gaze feels effortlessly liquid;
        // on the alcove direct entry onto `003`, allow smooth 42 deg/s turn without pausing!
        const wPrelude = T_LOGO > 0 ? (1.0 - sm3(ramp(tk, T_LOGO * 0.65, T_LOGO + 1.35))) : 0.0;
        const wSkim = sm3(ramp(tk, tSkimStart, tSkimStart + 0.22));
        const wAlcEntry = sm3(ramp(tk, tAlcoveEntryBoost, tAlcoveEntryBoost + 0.20));
        const baseMaxRate = (isDownHall || isOnArt) ? 35.5 : 13.8;
        const maxRate = lerp(lerp(lerp(baseMaxRate, 28.0, wSkim), 42.0, wAlcEntry), 18.0, wPrelude); // deg/s

        cmdYaw = sprYaw + clamp(tgtYaw - sprYaw, -maxRate * 0.24, maxRate * 0.24);
        const hlCorridor = lerp(0.155, 0.085, lockWeight(tk));
        const hlWithPre  = lerp(hlCorridor, 0.28, wPrelude);
        const hl = lerp(hlWithPre, 0.135, wAlcEntry * (1.0 - lockWeight(tk) * 0.45));
        let [ny, nv] = springStep(sprYaw, sprVel, cmdYaw, hl, dt);
        if (Math.abs(nv) > maxRate) {
          nv = Math.sign(nv) * maxRate;
          ny = sprYaw + nv * dt;
        }
        sprYaw = ny; sprVel = nv;
        [sprPit, sprPitVel] = springStep(sprPit, sprPitVel, des.pit, lerp(0.22, 0.34, wPrelude), dt);
      }
      yawArr[k] = sprYaw;
      pitArr[k] = sprPit;
    }

    // Gentle final blend (<= 12 deg/s) into exact `bl.dir` & `bl.pitch` -> 0.000 deg seam at `T_WALK`!
    const endTargetYaw = unwrap(bl.dir ?? 270, yawArr[N_SAMP]);
    const endResidual = endTargetYaw - yawArr[N_SAMP];
    const pitResidual = (bl.pitch ?? 1.4) - pitArr[N_SAMP];
    if (Math.abs(endResidual) > 1e-4 || Math.abs(pitResidual) > 1e-4) {
      const durEnd = Math.max(0.85, Math.abs(endResidual) * 1.55 / 12.0);
      const kStart = Math.max(0, N_SAMP - Math.round(durEnd * HZ));
      for (let k = kStart; k <= N_SAMP; k++) {
        const u = sm3((k - kStart) / Math.max(1, N_SAMP - kStart));
        yawArr[k] += endResidual * u;
        pitArr[k] += pitResidual * u;
      }
    }
    walkEndYaw = yawArr[N_SAMP];

    walkPoseAt = (t) => {
      const u = clamp(t / T_WALK, 0, 1) * N_SAMP;
      const i0 = Math.min(N_SAMP - 1, Math.floor(u)), fr = u - i0;
      const s = sArr[i0] + (sArr[i0 + 1] - sArr[i0]) * fr;
      const x = xArr[i0] + (xArr[i0 + 1] - xArr[i0]) * fr;
      const h = hArr[i0] + (hArr[i0 + 1] - hArr[i0]) * fr;
      const fov = fovArr[i0] + (fovArr[i0 + 1] - fovArr[i0]) * fr;
      const dir = yawArr[i0] + (yawArr[i0 + 1] - yawArr[i0]) * fr;
      const pitch = pitArr[i0] + (pitArr[i0 + 1] - pitArr[i0]) * fr;
      const hStepFade = sm3(ramp(t, T_LOGO + 0.20, T_LOGO + 1.40)) * (1 - sm3(ramp(t, T_WALK - 1.0, T_WALK)));
      const hStep = 0.0020 * Math.sin(t * 4.8) * hStepFade;
      return { s, x, h: h + hStep, dir, pitch, roll: 0, fov };
    };
  } else {
    const walkDist = Math.hypot(bl.s - st.s, bl.x - st.x);
    const T_WALK_DUR = clamp(walkDist / 0.95, 8.0, 20.0);
    T_WALK = +(T_LOGO + T_WALK_DUR).toFixed(3);
    const d0 = dirPre, d1 = unwrap(bl.dir, d0);
    walkEndYaw = d1;
    const wKeys = [
      { t: 0, s: T_LOGO > 0 ? sPre : st.s, x: xPre, h: hPre, dir: d0, pitch: pitchPre, roll: 0, fov: fovPre },
      { t: T_LOGO + T_WALK_DUR * 0.65, s: st.s + (bl.s - st.s) * 0.68, x: st.x + (bl.x - st.x) * 0.65, h: 1.60, dir: d0 + (d1 - d0) * 0.25, pitch: 0, roll: 0, fov: 54 },
      { t: T_WALK, s: bl.s, x: bl.x, h: bl.h ?? 1.60, dir: d1, pitch: bl.pitch ?? 1.5, roll: 0, fov: bl.fov ?? 58, flat: true },
    ];
    const tr = Object.fromEntries(['s', 'x', 'h', 'dir', 'pitch', 'roll', 'fov'].map(f => [f, makeTrack(wKeys, f)]));
    walkPoseAt = t => ({ s: tr.s(t), x: tr.x(t), h: tr.h(t), dir: tr.dir(t), pitch: tr.pitch(t), roll: 0, fov: tr.fov(t) });
  }

  // ---------------------------------------------------------------------------
  // 2. Eyes & Blink at the Alcove (all timestamps absolute on [0 .. TOTAL])
  // ---------------------------------------------------------------------------
  const T_EYES = T_WALK;
  const T_EYES_DONE = T_EYES + EYES.turn003[1];
  const T_BLINK = T_EYES_DONE + EYES.hold;
  const T_RELEASE = T_BLINK + 0.50 / FLIGHT7_PACE;

  // ---------------------------------------------------------------------------
  // 3. Three Dramatic Bird-Flight Camera Modes (`flightMode = 1 | 2 | 3`)
  //    All 3 hold steady during `t = 0.00..0.52` so the women finish blinking BEFORE camera/flock/colour start!
  // ---------------------------------------------------------------------------
  const endH = en.h ?? 1.50;
  const endPitch = en.pitch ?? 3.5;
  const endFov = en.fov ?? 58.0;
  let CRANE_BASE;
  if (flightMode === 1) {
    // Flight 1 ★: Close-up above the emerging dove's face, then dissociate camera speed (~1.4 m/s calm glide)
    //             so the faster S-weaving 10-bird flock (3.3–4.85 m/s) surges dramatically past & around the lens,
    //             settling with gentle upward pitch (+3.5 deg) so both the 015 poster AND the 4.86 m pressed-tin ceiling stay visible!
    CRANE_BASE = [
      { t: 0.00, f: 0.000, x:  0.64, h: bl.h ?? 1.60, yaw:  -90.0, pitch: bl.pitch ?? 1.2, roll:  0.0, fov: bl.fov ?? 55.0, flat: true },
      { t: 0.52, f: 0.000, x:  0.64, h: bl.h ?? 1.60, yaw:  -90.0, pitch: bl.pitch ?? 1.2, roll:  0.0, fov: bl.fov ?? 55.0, flat: true },
      { t: 1.65, f: 0.052, x: -0.10, h: 2.18,         yaw: -144.0, pitch:  -6.5,           roll: -1.2, fov: 54.0 },
      { t: 3.10, f: 0.195, x:  0.12, h: 2.14,         yaw: -177.0, pitch:  -2.2,           roll: -1.8, fov: 55.5 },
      { t: 4.85, f: 0.395, x: -0.22, h: 2.04,         yaw: -183.0, pitch:  -1.6,           roll: -2.0, fov: 56.0 },
      { t: 6.65, f: 0.625, x: -0.56, h: 1.80,         yaw: -202.0, pitch:  -0.4,           roll: -1.6, fov: 56.5 },
      { t: 8.25, f: 0.825, x: -0.46, h: 1.60,         yaw: -266.0, pitch:  endPitch * 0.55,roll:  0.0, fov: endFov - 1.0 },
      { t: 9.75, f: 0.955, x: -0.02, h: endH + 0.02,  yaw: -340.0, pitch:  endPitch * 0.92,roll:  0.0, fov: endFov - 0.3 },
      { t: 11.00,f: 0.994, x:  0.06, h: endH,         yaw: -361.5, pitch:  endPitch,       roll:  0.0, fov: endFov },
      { t: 11.75,f: 1.000, x:  0.08, h: endH,         yaw: -362.5, pitch:  endPitch,       roll:  0.0, fov: endFov, flat: true },
    ];
  } else if (flightMode === 3) {
    // Flight 3: Backing hero counter-pass facing the emerging birds upfront
    CRANE_BASE = [
      { t: 0.00, f: 0.000, x:  0.64, h: bl.h ?? 1.60, yaw:  -90.0, pitch: bl.pitch ?? 1.2, roll:  0.0, fov: bl.fov ?? 55.0, flat: true },
      { t: 0.52, f: 0.000, x:  0.64, h: bl.h ?? 1.60, yaw:  -90.0, pitch: bl.pitch ?? 1.2, roll:  0.0, fov: bl.fov ?? 55.0, flat: true },
      { t: 1.45, f: 0.075, x:  0.28, h: 1.72,         yaw:  -38.0, pitch:   3.2,           roll:  0.5, fov: 54.5 },
      { t: 2.85, f: 0.235, x:  0.04, h: 1.84,         yaw:   -4.0, pitch:   5.2,           roll:  1.0, fov: 54.0 },
      { t: 4.55, f: 0.445, x: -0.32, h: 1.86,         yaw:  +10.0, pitch:   4.8,           roll:  0.8, fov: 55.0 },
      { t: 6.35, f: 0.665, x: -0.58, h: 1.70,         yaw:  +16.0, pitch:   3.8,           roll:  0.0, fov: 56.2 },
      { t: 8.20, f: 0.865, x: -0.36, h: 1.56,         yaw:   +2.0, pitch:   endPitch,       roll:  0.0, fov: endFov - 0.6 },
      { t: 10.10,f: 0.982, x:  0.04, h: endH,         yaw:   -2.0, pitch:   endPitch,       roll:  0.0, fov: endFov },
      { t: 11.40,f: 1.000, x:  0.08, h: endH,         yaw:   -2.5, pitch:   endPitch,       roll:  0.0, fov: endFov, flat: true },
    ];
  } else {
    // Flight 2: High crane soaring above the S-weaving flock
    CRANE_BASE = [
      { t: 0.00, f: 0.000, x:  0.64, h: bl.h ?? 1.60, yaw:  -90.0, pitch: bl.pitch ?? 1.2, roll:  0.0, fov: bl.fov ?? 55.0, flat: true },
      { t: 0.52, f: 0.000, x:  0.64, h: bl.h ?? 1.60, yaw:  -90.0, pitch: bl.pitch ?? 1.2, roll:  0.0, fov: bl.fov ?? 55.0, flat: true },
      { t: 1.55, f: 0.070, x:  0.14, h: 2.18,         yaw: -144.0, pitch:  -4.2,           roll:  0.0, fov: 58.0 },
      { t: 2.75, f: 0.195, x:  0.00, h: 2.86,         yaw: -179.0, pitch: -13.2,           roll:  0.0, fov: 58.5 },
      { t: 4.10, f: 0.380, x: -0.22, h: 3.16,         yaw: -185.0, pitch: -15.8,           roll: -1.8, fov: 58.0 },
      { t: 5.50, f: 0.570, x: -0.62, h: 2.18,         yaw: -204.0, pitch:  -5.5,           roll: -3.2, fov: 57.2 },
      { t: 6.85, f: 0.740, x: -0.66, h: 1.66,         yaw: -230.0, pitch:   0.0,           roll: -1.6, fov: 57.2 },
      { t: 8.20, f: 0.880, x: -0.36, h: 1.56,         yaw: -288.0, pitch:  endPitch * 0.75,roll:  0.0, fov: endFov - 0.5 },
      { t: 9.55, f: 0.962, x:  0.02, h: endH,         yaw: -344.0, pitch:  endPitch,       roll:  0.0, fov: endFov },
      { t: 10.80,f: 0.993, x:  0.06, h: endH,         yaw: -361.5, pitch:  endPitch,       roll:  0.0, fov: endFov },
      { t: 11.65,f: 1.000, x:  0.08, h: endH,         yaw: -362.5, pitch:  endPitch,       roll:  0.0, fov: endFov, flat: true },
    ];
  }

  const flightDist = Math.abs(en.s - bl.s);
  const scale = clamp(flightDist / 14.95, 0.65, 1.30);
  const tv = CRANE_BASE.map(q => q.t * (0.72 + 0.28 * scale));
  const travel = en.s < bl.s ? -180 : 0;
  const yawShift = travel === -180 ? 0 : 180;

  const baseStartYaw = CRANE_BASE[0].yaw + yawShift;
  const startWrap = 360 * Math.round((walkEndYaw - baseStartYaw) / 360);
  const dStartYaw = walkEndYaw - (baseStartYaw + startWrap);

  const baseEndYaw = CRANE_BASE[CRANE_BASE.length - 1].yaw + yawShift + startWrap;
  const targetEndYaw = unwrap(en.dir, baseEndYaw);
  const dEndYaw = targetEndYaw - baseEndYaw;

  const standSide = (layout.stand?.x ?? 0.44) >= 0 ? 1 : -1;
  const laneScale = (HW / 1.72) * standSide;
  const ceilMaxH  = Math.min(3.35, ceilH - 0.92);

  const flightKeys = CRANE_BASE.map((q, i) => {
    const f = q.f;
    const wStart = 1 - sm3(f / 0.16);
    const wEnd   = sm3((f - 0.65) / 0.35);
    let x = q.x * laneScale;
    x = x * (1 - wStart) + bl.x * wStart;
    x = x * (1 - wEnd)   + en.x * wEnd;
    if (i === 0) x = bl.x;
    if (i === CRANE_BASE.length - 1) x = en.x;

    const sHere = bl.s + f * (en.s - bl.s);
    if (sHere > AR - 0.35 && i > 0) x = clamp(x, -(VH - 0.32), VH - 0.32);
    else if (i > 0 && i < CRANE_BASE.length - 1) x = clamp(x, -(HW - 0.42), HW - 0.42);

    const hRaw = i === CRANE_BASE.length - 1 ? endH : (q.h * (1 - wEnd) + endH * wEnd);
    const h = Math.min(ceilMaxH, sHere > AR - 0.55 && sHere < AR + 0.55 ? Math.min(hRaw, 2.68) : hRaw);
    const pitch = i === CRANE_BASE.length - 1 ? endPitch : (q.pitch * (1 - wEnd) + endPitch * wEnd);
    const fov = i === CRANE_BASE.length - 1 ? endFov : (q.fov * (1 - wEnd) + endFov * wEnd);

    return {
      t: tv[i], flat: q.flat,
      s: sHere, x, h,
      dir: (q.yaw + yawShift + startWrap) + dStartYaw * (1 - sm3(f / 0.22)) + dEndYaw * sm3((f - 0.45) / 0.55),
      pitch, roll: q.roll * (1 - wEnd), fov,
    };
  });

  const flightTrk = Object.fromEntries(['s', 'x', 'h', 'dir', 'pitch', 'roll', 'fov'].map(f => [f, makeTrack(flightKeys, f)]));
  const T_FLIGHT_V = tv[tv.length - 1];
  const T_END = T_BLINK + T_FLIGHT_V / FLIGHT7_PACE;
  const TOTAL = T_END + 1.6;

  function poseAt(t) {
    if (t < T_WALK) return walkPoseAt(Math.max(0, t));
    if (t < T_BLINK) {
      const u = (t - T_WALK) / Math.max(0.01, T_BLINK - T_WALK);
      return {
        s: bl.s, x: bl.x, h: bl.h ?? 1.60,
        dir: walkEndYaw, pitch: bl.pitch ?? 1.5, roll: 0, fov: (bl.fov ?? 58) + 0.12 * Math.sin(Math.PI * u),
      };
    }
    const tvv = Math.min(T_FLIGHT_V, (t - T_BLINK) * FLIGHT7_PACE);
    return {
      s: flightTrk.s(tvv), x: flightTrk.x(tvv), h: flightTrk.h(tvv),
      dir: flightTrk.dir(tvv), pitch: flightTrk.pitch(tvv), roll: flightTrk.roll(tvv), fov: flightTrk.fov(tvv),
    };
  }

  // Track 010 gaze schedule cleanly for `eyeAt('010', t)` (returns `0..4`, NEVER blinks!)
  function eyeAt(id, t) {
    if (t < T_LOGO) return 0;
    if (id === '010') {
      if (t < T_EYES) return 0;
      if (t < T_BLINK) {
        const [a, b] = EYES.turn010;
        const u = ramp(t, T_EYES + a, T_EYES + b);
        return clamp(u >= 0.999 ? 4 : Math.floor(u * 4 + 1e-5), 0, 4);
      }
      const tf = (t - T_BLINK) * FLIGHT7_PACE;
      return tf >= EYES.restAfterBlink ? 0 : 4;
    }

    if (t < T_EYES) return 0;
    if (t < T_BLINK) {
      const [a, b] = EYES.turn003;
      const u = ramp(t, T_EYES + a, T_EYES + b);
      return clamp(u >= 0.999 ? 4 : Math.floor(u * 4 + 1e-5), 0, 4);
    }
    const tf = (t - T_BLINK) * FLIGHT7_PACE;
    if (tf >= EYES.restAfterBlink) return 0;
    const fr = Math.floor(tf * EYES.fps + 1e-6) - (EYES.blink[id] ?? 0);
    return (fr >= 0 && fr < EYES.lid.length) ? EYES.lid[fr] : 4;
  }

  return { T_LOGO, T_WALK, T_EYES, T_BLINK, T_RELEASE, T_END, TOTAL, poseAt, eyeAt, walkStationsMeta, flightKeys };
}
