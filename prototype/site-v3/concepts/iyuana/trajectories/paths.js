import * as THREE from 'three';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm5 = x => {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// Exact Iyuana gallery geometry constants (metres, matching aisle-final-v6/main.js)
export const IYUANA_GEOM = {
  CEIL: 4.4,
  EYE: 1.6,
  SPACING: 3.0,
  END_Z: -22.6,
  POSTER_Z: -22.54,
  POSTER_Y: 1.74,
  RING_Y: 2.02,
  BOARDS: [
    { id: 'B1', x: -1.25, y: 1.45, z: -0.9, side: -1, yaw: 0.26, w: 0.85, h: 1.15 },
    { id: 'B2', x: 1.25, y: 1.45, z: -3.9, side: 1, yaw: -0.26, w: 1.75, h: 1.25 },
    { id: 'B3', x: -1.25, y: 1.45, z: -6.9, side: -1, yaw: 0.26, w: 1.85, h: 0.95 },
    { id: 'B4', x: 1.25, y: 1.45, z: -9.9, side: 1, yaw: -0.26, w: 0.95, h: 1.65 },
    { id: 'B5', x: -1.25, y: 1.45, z: -12.9, side: -1, yaw: 0.26, w: 1.65, h: 1.25 },
    { id: 'B6', x: 1.25, y: 1.45, z: -15.9, side: 1, yaw: -0.26, w: 0.9, h: 1.2 },
  ],
  PALMS: [
    { x: -1.95, z: -21.75, h: 2.1 },
    { x: 2.05, z: -21.9, h: 1.9 },
    { x: -2.4, z: -4.5, h: 1.8 },
    { x: 2.4, z: -10.2, h: 1.9 },
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
// (`v(s) ~ easeEnds(s) * (1 + alpha * curvature(s))^-0.38` -> zero stop/bounce AND zero lateral whip)
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
    const easeIn = 0.14 + 0.86 * sm5(s / 0.12);
    const easeOut = 0.08 + 0.92 * (1.0 - sm5((s - 0.88) / 0.12));
    const bioCurveSlow = Math.pow(1.0 + 2.2 * smoothKappa[j], -0.38);
    speedProfile[j] = Math.max(0.06, easeIn * easeOut * bioCurveSlow);
    if (j > 0) {
      const avgV = 0.5 * (speedProfile[j - 1] + speedProfile[j]);
      cumTime[j] = cumTime[j - 1] + ds / avgV;
    }
  }
  const totalVirtualTime = cumTime[M - 1] || 1.0;
  for (let j = 0; j < M; j++) cumTime[j] /= totalVirtualTime;

  const speedMps = new Float32Array(M);
  for (let j = 0; j < M; j++) {
    speedMps[j] = (speedProfile[j] * totalVirtualTime) / 24.0;
  }

  function sampleAtTime01(uTime, outPos, outLook) {
    const u = clamp(uTime / 0.96, 0, 1);
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

// Smooth board-tracking gaze helper: sweeps gaze smoothly across B1..B6, then locks onto the canopy film & poster
function aisleBoardGaze(sArc, uTime, pos, outLook, swayScale = 1.0, endFov = 51) {
  // Approach phase (0..0.72) sweeps gaze down the staggered boards; ending phase (0.72..1.0) locks onto poster & ring
  const kFilm = sm5((uTime - 0.68) / 0.14);
  const kPull = sm5((uTime - 0.85) / 0.13);

  // Smooth sinusoidal look-ahead across the staggered boards as Z advances from -0.9 to -15.9
  const boardProgress = clamp((-pos.z - 0.5) / 16.5, 0, 1);
  const staggerX = Math.sin(boardProgress * Math.PI * 5.0 + Math.PI) * 0.85 * swayScale * (1.0 - kFilm);
  const lookZ = lerp(pos.z - 3.6, IYUANA_GEOM.POSTER_Z, sm5((uTime - 0.58) / 0.22));
  const lookY = lerp(1.48, lerp(IYUANA_GEOM.RING_Y, 1.88, kPull), kFilm);

  outLook.set(lerp(staggerX, 0.0, kFilm), lookY, lookZ);
  return lerp(40.0, lerp(38.0, endFov, kPull), kFilm);
}

const RAW_SPECS = [
  {
    id: 'T1',
    name: 'T1 · Converged S-Weave (aisle-final-v6 Baseline)',
    shortLabel: 'T1 · Converged S-Weave',
    curveType: 'bspline',
    color: '#1d4ed8',
    summary: 'Current v5/v6 converged path: opens at Board 1 (4633), weaves gently left-right past each staggered board at 1.60m eye height, arrives at the canopy film, and pulls straight back to frame the poster.',
    ctrl: [
      [-1.08, 1.56, 0.05],
      [-0.45, 1.60, -0.6],
      [0.42, 1.60, -3.5],
      [-0.42, 1.60, -6.7],
      [0.42, 1.60, -9.8],
      [-0.40, 1.60, -12.8],
      [0.36, 1.60, -15.6],
      [0.00, 1.60, -18.35],
      [0.00, 1.58, -17.90],
      [0.00, 1.55, -16.40],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 1.0, 51),
  },
  {
    id: 'T2',
    name: 'T2 · Center-Aisle Dolly (Zero Lateral Sway)',
    shortLabel: 'T2 · Center-Aisle Dolly',
    curveType: 'bspline',
    color: '#0f766e',
    summary: 'Body glides straight down the center aisle (x ≈ 0.0m) without zig-zagging while the lens smoothly looks left and right toward each board, ending with a straight pull-back.',
    ctrl: [
      [-0.95, 1.58, 0.1],
      [-0.12, 1.60, -1.6],
      [0.02, 1.60, -4.5],
      [0.00, 1.60, -8.5],
      [0.00, 1.60, -13.0],
      [0.00, 1.60, -18.35],
      [0.00, 1.55, -16.20],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 1.2, 51),
  },
  {
    id: 'T3',
    name: 'T3 · Single Degree-5 Bézier Bow (C^∞)',
    shortLabel: 'T3 · Degree-5 Bézier Bow',
    curveType: 'bezier',
    color: '#b45309',
    summary: 'One single C^∞ polynomial Bézier curve entering from the right threshold (+0.65m), bowing smoothly across the center-left aisle, and landing square on the canopy film & poster.',
    ctrl: [
      [0.65, 1.62, 2.2],
      [-0.85, 1.60, -2.5],
      [-0.95, 1.60, -9.5],
      [0.45, 1.60, -15.5],
      [0.00, 1.60, -18.5],
      [0.00, 1.55, -16.3],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 0.85, 51),
  },
  {
    id: 'T4',
    name: 'T4 · Elevated Crane Descent (2.85m → 1.55m)',
    shortLabel: 'T4 · Elevated Crane Descent',
    curveType: 'bspline',
    color: '#7c3aed',
    summary: 'Enters high above the gallery (Y = 2.85m) looking down across the hanging boards and palm fronds, descending smoothly like a cinema crane to eye-height for the film and poster.',
    ctrl: [
      [0.35, 2.85, 2.4],
      [-0.25, 2.65, -2.0],
      [0.20, 2.35, -7.2],
      [-0.15, 1.95, -12.6],
      [0.00, 1.62, -18.35],
      [0.00, 1.55, -16.25],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 0.75, 52),
  },
  {
    id: 'T5',
    name: 'T5 · Low-to-Eye Drift (1.15m → 1.62m)',
    shortLabel: 'T5 · Low-to-Eye Drift',
    curveType: 'bspline',
    color: '#be123c',
    summary: 'Opens low (1.15m) glancing slightly upward at the suspended boards and warm overhead spots against the dark ceiling, rising gradually to eye-height at the film.',
    ctrl: [
      [-0.55, 1.15, 1.2],
      [0.25, 1.24, -3.2],
      [-0.20, 1.38, -8.5],
      [0.15, 1.52, -13.8],
      [0.00, 1.62, -18.35],
      [0.00, 1.55, -16.40],
    ],
    gaze: (sArc, uTime, pos, outLook) => {
      const fov = aisleBoardGaze(sArc, uTime, pos, outLook, 0.85, 51);
      outLook.y += (1.0 - sm5((uTime - 0.55) / 0.25)) * 0.22;
      return fov;
    },
  },
  {
    id: 'T6',
    name: 'T6 · Wide Right-Flank Gallery Arc',
    shortLabel: 'T6 · Right-Flank Arc',
    curveType: 'bspline',
    color: '#0369a1',
    summary: 'Sweeps wider along the right side of the room (x = +1.75m), revealing the left boards (B1, B3, B5) in deep three-quarter perspective before curving back to center.',
    ctrl: [
      [1.35, 1.62, 1.8],
      [1.75, 1.60, -3.5],
      [1.65, 1.60, -9.2],
      [1.10, 1.60, -14.8],
      [0.00, 1.60, -18.35],
      [0.00, 1.55, -16.40],
    ],
    gaze: (sArc, uTime, pos, outLook) => {
      const kFilm = sm5((uTime - 0.68) / 0.14);
      const kPull = sm5((uTime - 0.85) / 0.13);
      outLook.set(lerp(-0.55, 0.0, kFilm), lerp(1.48, lerp(IYUANA_GEOM.RING_Y, 1.88, kPull), kFilm), lerp(pos.z - 4.2, IYUANA_GEOM.POSTER_Z, sm5((uTime - 0.58) / 0.22)));
      return lerp(42, lerp(38, 51, kPull), kFilm);
    },
  },
  {
    id: 'T7',
    name: 'T7 · Wide Left-Flank Gallery Arc',
    shortLabel: 'T7 · Left-Flank Arc',
    curveType: 'bspline',
    color: '#4338ca',
    summary: 'Sweeps wider along the left side of the room (x = -1.75m), framing the right boards (B2, B4, B6) and aisle depth diagonally before centering on the film & poster.',
    ctrl: [
      [-1.35, 1.62, 1.8],
      [-1.75, 1.60, -3.5],
      [-1.65, 1.60, -9.2],
      [-1.10, 1.60, -14.8],
      [0.00, 1.60, -18.35],
      [0.00, 1.55, -16.40],
    ],
    gaze: (sArc, uTime, pos, outLook) => {
      const kFilm = sm5((uTime - 0.68) / 0.14);
      const kPull = sm5((uTime - 0.85) / 0.13);
      outLook.set(lerp(0.55, 0.0, kFilm), lerp(1.48, lerp(IYUANA_GEOM.RING_Y, 1.88, kPull), kFilm), lerp(pos.z - 4.2, IYUANA_GEOM.POSTER_Z, sm5((uTime - 0.58) / 0.22)));
      return lerp(42, lerp(38, 51, kPull), kFilm);
    },
  },
  {
    id: 'T8',
    name: 'T8 · Direct Glide + Wide Room Reveal',
    shortLabel: 'T8 · Direct + Wide Reveal',
    curveType: 'bspline',
    color: '#15803d',
    summary: 'Clean, unhurried straight-aisle approach from Z = +2.4m to the canopy film, followed by a deeper pull-back (Z = -14.2m, 55° FOV) that reveals both flanking palms and the full dark gallery.',
    ctrl: [
      [0.25, 1.62, 2.4],
      [-0.18, 1.60, -3.0],
      [0.14, 1.60, -9.0],
      [-0.08, 1.60, -14.5],
      [0.00, 1.60, -18.35],
      [0.00, 1.54, -14.20],
    ],
    gaze: (sArc, uTime, pos, outLook) => aisleBoardGaze(sArc, uTime, pos, outLook, 0.65, 55),
  },
];

export const TRAJECTORY_LIST = RAW_SPECS.map(compileTrajectory);
export const TRAJECTORIES = Object.fromEntries(TRAJECTORY_LIST.map(t => [t.id, t]));
