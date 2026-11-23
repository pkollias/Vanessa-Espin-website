import * as THREE from 'three';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm5 = x => {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export const IYUANA_DURATION = 31.5;

// Exact 4-panel Iyuana gallery geometry constants (metres, matching aisle-final-v6/main.js `panels-4`)
export const IYUANA_GEOM = {
  CEIL: 4.4,
  EYE: 1.6,
  SPACING: 3.3,
  END_Z: -17.5,
  POSTER_Z: -17.44,
  POSTER_Y: 1.74,
  RING_Y: 2.02,
  BOARDS: [
    {
      id: 'P1', label: 'Panel 1 (Forest + 5)',
      x: -1.48, y: 1.48, z: -0.9, side: -1, yaw: 0.26, w: 1.92, h: 1.066,
      openSubRect: { x: -0.6017, y: 0.1928, w: 0.5652, h: 0.3541 },
    },
    { id: 'P2', label: 'Panel 2 (3×2)', x: 1.48, y: 1.48, z: -4.2, side: 1, yaw: -0.26, w: 1.92, h: 1.066 },
    { id: 'P3', label: 'Panel 3 (3 Portraits)', x: -1.48, y: 1.48, z: -7.5, side: -1, yaw: 0.26, w: 1.92, h: 1.066 },
    { id: 'P4', label: 'Panel 4 (Tall)', x: 1.48, y: 1.52, z: -10.8, side: 1, yaw: -0.26, w: 1.92, h: 1.645 },
  ],
  PALMS: [
    { x: -3.25, z: -0.95, h: 1.85 },
    { x: 3.35, z: -4.45, h: 1.95 },
    { x: -3.45, z: -7.55, h: 1.80 },
    { x: -1.95, z: -16.65, h: 2.10 },
    { x: 2.05, z: -16.80, h: 1.90 },
  ],
};

// De Casteljau C-infinity single polynomial Bezier evaluator
function evalBezier(ctrlPts, u, out) {
  const n = ctrlPts.length;
  const wx = new Float64Array(n);
  const wy = new Float64Array(n);
  const wz = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    wx[i] = ctrlPts[i][0];
    wy[i] = ctrlPts[i][1];
    wz[i] = ctrlPts[i][2];
  }
  const t = clamp(u, 0, 1);
  const om = 1.0 - t;
  for (let r = 1; r < n; r++) {
    for (let i = 0; i < n - r; i++) {
      wx[i] = om * wx[i] + t * wx[i + 1];
      wy[i] = om * wy[i] + t * wy[i + 1];
      wz[i] = om * wz[i] + t * wz[i + 1];
    }
  }
  return out.set(wx[0], wy[0], wz[0]);
}

// Clamped Uniform Cubic B-Spline (globally C2 continuous velocity & acceleration, exact endpoints)
function evalClampedBSpline(ctrlPts, u, out) {
  const n = ctrlPts.length - 1;
  const k = 3;
  const mInt = n - k + 1;
  if (u <= 0) return out.set(ctrlPts[0][0], ctrlPts[0][1], ctrlPts[0][2]);
  if (u >= 1) return out.set(ctrlPts[n][0], ctrlPts[n][1], ctrlPts[n][2]);

  const knots = [];
  for (let i = 0; i < k; i++) knots.push(0);
  for (let i = 0; i <= mInt; i++) knots.push(i);
  for (let i = 0; i < k; i++) knots.push(mInt);

  const t = clamp(u, 0, 1 - 1e-9) * mInt;
  const s = Math.min(k + mInt - 1, k + Math.floor(t));
  const dx = [0, 0, 0, 0], dy = [0, 0, 0, 0], dz = [0, 0, 0, 0];
  for (let j = 0; j <= k; j++) {
    const p = ctrlPts[s - k + j];
    dx[j] = p[0]; dy[j] = p[1]; dz[j] = p[2];
  }
  for (let r = 1; r <= k; r++) {
    for (let j = k; j >= r; j--) {
      const ik = s - k + j;
      const denom = knots[ik + k + 1 - r] - knots[ik];
      const alpha = denom === 0 ? 0 : (t - knots[ik]) / denom;
      const om = 1.0 - alpha;
      dx[j] = om * dx[j - 1] + alpha * dx[j];
      dy[j] = om * dy[j - 1] + alpha * dy[j];
      dz[j] = om * dz[j - 1] + alpha * dz[j];
    }
  }
  return out.set(dx[k], dy[k], dz[k]);
}

// Build arc-length + Two-Thirds Power Law biological curvature-coupled timing LUT
// Immediate constant zoom-out onset at t = 0 + constant smooth ending pull-back
function compileTrajectory(spec) {
  const N = 420;
  const evalFn = spec.curveType === 'bezier' ? evalBezier : evalClampedBSpline;
  const rawPts = [];
  for (let i = 0; i < N; i++) {
    rawPts.push(evalFn(spec.ctrl, i / (N - 1), new THREE.Vector3()));
  }

  const cumArc = new Float64Array(N);
  for (let i = 1; i < N; i++) {
    cumArc[i] = cumArc[i - 1] + rawPts[i].distanceTo(rawPts[i - 1]);
  }
  const totalLen = cumArc[N - 1] || 1.0;

  const M = 320;
  const arcPts = [];
  let ptr = 0;
  for (let j = 0; j < M; j++) {
    const target = (j / (M - 1)) * totalLen;
    while (ptr < N - 2 && cumArc[ptr + 1] < target) ptr++;
    const span = Math.max(1e-6, cumArc[ptr + 1] - cumArc[ptr]);
    arcPts.push(new THREE.Vector3().lerpVectors(rawPts[ptr], rawPts[ptr + 1], (target - cumArc[ptr]) / span));
  }

  const ds = totalLen / (M - 1);
  const kappa = new Float64Array(M);
  let maxKappa = 0;
  for (let j = 1; j < M - 1; j++) {
    const v1x = arcPts[j].x - arcPts[j - 1].x, v1y = arcPts[j].y - arcPts[j - 1].y, v1z = arcPts[j].z - arcPts[j - 1].z;
    const v2x = arcPts[j + 1].x - arcPts[j].x, v2y = arcPts[j + 1].y - arcPts[j].y, v2z = arcPts[j + 1].z - arcPts[j].z;
    const l1 = Math.hypot(v1x, v1y, v1z) || 1e-6;
    const l2 = Math.hypot(v2x, v2y, v2z) || 1e-6;
    const dot = clamp((v1x * v2x + v1y * v2y + v1z * v2z) / (l1 * l2), -1, 1);
    const kVal = Math.acos(dot) / (0.5 * (l1 + l2));
    kappa[j] = kVal;
    if (kVal > maxKappa) maxKappa = kVal;
  }
  kappa[0] = kappa[1];
  kappa[M - 1] = kappa[M - 2];

  const smoothKappa = new Float64Array(M);
  for (let j = 0; j < M; j++) {
    let acc = 0, wSum = 0;
    for (let d = -3; d <= 3; d++) {
      const idx = clamp(j + d, 0, M - 1);
      const w = 0.5 * (1 + Math.cos((Math.PI * d) / 4));
      acc += kappa[idx] * w;
      wSum += w;
    }
    smoothKappa[j] = acc / wSum;
  }

  const speedProfile = new Float64Array(M);
  const cumTime = new Float64Array(M);
  for (let j = 0; j < M; j++) {
    const s = j / (M - 1);
    // Gentle, unhurried zoom-out onset + calm smooth ending pull-back (34.0s film)
    const easeIn = 0.28 + 0.72 * sm5(s / 0.10);
    const easeOut = 0.14 + 0.86 * (1.0 - sm5((s - 0.89) / 0.11));
    const bioCurveSlow = Math.pow(1.0 + 2.0 * smoothKappa[j], -0.36);
    speedProfile[j] = Math.max(0.08, easeIn * easeOut * bioCurveSlow);
    if (j > 0) {
      const avgV = 0.5 * (speedProfile[j - 1] + speedProfile[j]);
      cumTime[j] = cumTime[j - 1] + ds / avgV;
    }
  }
  const totalVirtualTime = cumTime[M - 1] || 1.0;
  for (let j = 0; j < M; j++) cumTime[j] /= totalVirtualTime;

  const speedMps = new Float32Array(M);
  for (let j = 0; j < M; j++) {
    speedMps[j] = (speedProfile[j] * totalVirtualTime) / IYUANA_DURATION;
  }

  function sampleAtTime01(uTime, outPos, outLook) {
    const u = clamp(uTime / 0.97, 0, 1);
    let lo = 0, hi = M - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (cumTime[mid] <= u) lo = mid;
      else hi = mid;
    }
    const spanT = Math.max(1e-7, cumTime[hi] - cumTime[lo]);
    const frac = clamp((u - cumTime[lo]) / spanT, 0, 1);
    outPos.lerpVectors(arcPts[lo], arcPts[hi], frac);
    const sArc = (lo + frac) / (M - 1);
    const fov = spec.gaze(sArc, uTime, outPos, outLook);
    return { sArc, fov };
  }

  return {
    ...spec,
    arcPts,
    totalLen,
    maxKappa,
    speedMps,
    sampleAtTime01,
  };
}

// Smooth 4-panel tracking gaze helper: starts on Panel 1's top-left forest photo (when fromForest=true),
// sweeps smoothly across Panels 1..4, then locks onto the canopy film & new poster
function aisleBoardGaze(sArc, uTime, pos, outLook, swayScale = 1.0, endFov = 43, fromForest = false) {
  const kOut = fromForest ? sm5(uTime / 0.11) : 1.0;
  const kFilm = sm5((uTime - 0.62) / 0.14);
  const kPull = sm5((uTime - 0.82) / 0.16);

  const boardProgress = clamp((-pos.z - 0.5) / 11.4, 0, 1);
  const staggerX = Math.sin(boardProgress * Math.PI * 3.0 + Math.PI) * 0.95 * swayScale * (1.0 - kFilm);
  const aisleLookX = lerp(staggerX, 0.0, kFilm);
  const aisleLookY = lerp(1.48, lerp(IYUANA_GEOM.RING_Y, 1.82, kPull), kFilm);
  const aisleLookZ = lerp(pos.z - 3.6, IYUANA_GEOM.POSTER_Z, sm5((uTime - 0.52) / 0.22));

  // Forest sub-image center on Panel 1: (-2.060, 1.673, -0.745)
  outLook.set(
    lerp(-2.060, aisleLookX, kOut),
    lerp(1.673, aisleLookY, kOut),
    lerp(-0.745, aisleLookZ, kOut)
  );
  return lerp(40.0, lerp(35.0, endFov, kPull), kFilm);
}

const RAW_SPECS = [
  {
    id: 'T1',
    name: 'T1 · Converged 4-Panel S-Weave (aisle-final-v6 Baseline)',
    shortLabel: 'T1 · 4-Panel S-Weave ★',
    curveType: 'bspline',
    color: '#1d4ed8',
    summary: 'Active default: opens zoomed-in on Panel 1’s top-left forest photo, zooms out immediately at constant speed, weaves past Panels 1–4, passes through the fire, and pulls smoothly back to frame Poster 1.',
    ctrl: [
      [-1.94, 1.67, -0.30],
      [-0.36, 1.60, 1.80],
      [0.44, 1.60, -2.00],
      [-0.44, 1.60, -5.60],
      [0.42, 1.60, -9.20],
      [0.00, 1.60, -13.85],
      [0.00, 1.58, -13.65],
      [0.00, 1.56, -12.95],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 1.0, 43, true),
  },
  {
    id: 'T2',
    name: 'T2 · Forest Zoom-Out → Center-Aisle Dolly',
    shortLabel: 'T2 · Center-Aisle Dolly',
    curveType: 'bspline',
    color: '#0f766e',
    summary: 'Zooms smoothly out of Panel 1’s top-left forest photo straight into the center aisle (X ≈ 0.0m, zero lateral weave) while the lens pans across Panels 1–4, ending with a constant pull-back.',
    ctrl: [
      [-1.94, 1.67, -0.30],
      [-0.25, 1.60, 1.65],
      [0.00, 1.60, -2.20],
      [0.00, 1.60, -6.40],
      [0.00, 1.60, -10.20],
      [0.00, 1.60, -13.85],
      [0.00, 1.56, -12.95],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 1.18, 43, true),
  },
  {
    id: 'T3',
    name: 'T3 · Single Degree-5 Bézier Bow (C^∞)',
    shortLabel: 'T3 · Degree-5 Bézier Bow',
    curveType: 'bezier',
    color: '#b45309',
    summary: 'One single C^∞ polynomial Bézier curve zooming out from Panel 1’s forest photo, bowing smoothly across the 4-panel gallery, and settling square on Poster 1.',
    ctrl: [
      [-1.94, 1.67, -0.30],
      [0.75, 1.60, 1.90],
      [-0.95, 1.60, -4.80],
      [0.55, 1.60, -10.40],
      [0.00, 1.60, -13.85],
      [0.00, 1.56, -12.95],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 0.88, 43, true),
  },
  {
    id: 'T4',
    name: 'T4 · Elevated Crane Descent (2.75m → 1.55m)',
    shortLabel: 'T4 · Elevated Crane Descent',
    curveType: 'bspline',
    color: '#7c3aed',
    summary: 'Enters high above the 4-panel gallery (Y = 2.75m) looking down across Vanessa’s four panels and palm shadows, descending smoothly like a crane to eye-height for the fire & poster.',
    ctrl: [
      [0.35, 2.75, 2.40],
      [-0.25, 2.48, -1.50],
      [0.20, 2.12, -5.80],
      [-0.12, 1.78, -9.80],
      [0.00, 1.60, -13.85],
      [0.00, 1.56, -12.95],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 0.78, 44, false),
  },
  {
    id: 'T5',
    name: 'T5 · Low-to-Eye Drift (1.15m → 1.62m)',
    shortLabel: 'T5 · Low-to-Eye Drift',
    curveType: 'bspline',
    color: '#be123c',
    summary: 'Zooms out from Panel 1 low (1.15m) glancing slightly upward at the four suspended panels and warm overhead spots against the dark ceiling, rising gradually to eye-height.',
    ctrl: [
      [-1.94, 1.67, -0.30],
      [-0.35, 1.18, 1.50],
      [0.25, 1.28, -3.20],
      [-0.18, 1.44, -7.80],
      [0.00, 1.60, -13.85],
      [0.00, 1.56, -12.95],
    ],
    gaze: (sArc, uTime, pos, outLook) => {
      const fov = aisleBoardGaze(sArc, uTime, pos, outLook, 0.88, 43, true);
      outLook.y += sm5(uTime / 0.12) * (1.0 - sm5((uTime - 0.52) / 0.25)) * 0.20;
      return fov;
    },
  },
  {
    id: 'T6',
    name: 'T6 · Wide Right-Flank Gallery Arc',
    shortLabel: 'T6 · Right-Flank Arc',
    curveType: 'bspline',
    color: '#0369a1',
    summary: 'Pulls out from Panel 1’s forest photo across to the right flank (X = +1.70m), revealing Panels 1 & 3 in deep three-quarter perspective before curving center for the poster.',
    ctrl: [
      [-1.94, 1.67, -0.30],
      [1.25, 1.60, 1.75],
      [1.72, 1.60, -3.20],
      [1.45, 1.60, -8.40],
      [0.00, 1.60, -13.85],
      [0.00, 1.56, -12.95],
    ],
    gaze: (sArc, uTime, pos, outLook) => {
      const kOut = sm5(uTime / 0.11);
      const kFilm = sm5((uTime - 0.62) / 0.14);
      const kPull = sm5((uTime - 0.82) / 0.16);
      outLook.set(
        lerp(-2.060, lerp(-0.65, 0.0, kFilm), kOut),
        lerp(1.673, lerp(1.48, lerp(IYUANA_GEOM.RING_Y, 1.82, kPull), kFilm), kOut),
        lerp(-0.745, lerp(pos.z - 4.0, IYUANA_GEOM.POSTER_Z, sm5((uTime - 0.52) / 0.22)), kOut)
      );
      return lerp(40, lerp(35, 43, kPull), kFilm);
    },
  },
  {
    id: 'T7',
    name: 'T7 · Wide Left-Flank Gallery Arc',
    shortLabel: 'T7 · Left-Flank Arc',
    curveType: 'bspline',
    color: '#4338ca',
    summary: 'Pulls back along the left flank (X = −1.70m), framing Panel 2 and the tall Panel 4 diagonally down the aisle before centering on the canopy film & Poster 1.',
    ctrl: [
      [-1.94, 1.67, -0.30],
      [-1.55, 1.60, 1.55],
      [-1.72, 1.60, -3.40],
      [-1.40, 1.60, -8.60],
      [0.00, 1.60, -13.85],
      [0.00, 1.56, -12.95],
    ],
    gaze: (sArc, uTime, pos, outLook) => {
      const kOut = sm5(uTime / 0.11);
      const kFilm = sm5((uTime - 0.62) / 0.14);
      const kPull = sm5((uTime - 0.82) / 0.16);
      outLook.set(
        lerp(-2.060, lerp(0.65, 0.0, kFilm), kOut),
        lerp(1.673, lerp(1.50, lerp(IYUANA_GEOM.RING_Y, 1.82, kPull), kFilm), kOut),
        lerp(-0.745, lerp(pos.z - 4.0, IYUANA_GEOM.POSTER_Z, sm5((uTime - 0.52) / 0.22)), kOut)
      );
      return lerp(40, lerp(35, 43, kPull), kFilm);
    },
  },
  {
    id: 'T8',
    name: 'T8 · Forest Zoom-Out + Wide Room Reveal',
    shortLabel: 'T8 · Direct + Wide Reveal',
    curveType: 'bspline',
    color: '#15803d',
    summary: 'Constant smooth zoom-out from Panel 1’s forest photo into a clean aisle glide, followed by a wider constant pull-back (Z = −11.6m, 47° FOV) revealing Poster 1 and both clearing palms.',
    ctrl: [
      [-1.94, 1.67, -0.30],
      [-0.20, 1.60, 1.70],
      [0.16, 1.60, -2.80],
      [-0.12, 1.60, -7.80],
      [0.00, 1.60, -13.85],
      [0.00, 1.55, -11.60],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 0.72, 47, true),
  },
];

export const TRAJECTORY_LIST = RAW_SPECS.map(compileTrajectory);
export const TRAJECTORIES = Object.fromEntries(TRAJECTORY_LIST.map(t => [t.id, t]));
