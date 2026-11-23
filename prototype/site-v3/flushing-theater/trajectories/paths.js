import * as THREE from 'three';

export const DEFAULT_FILM_DURATION = 30.5;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm5 = x => {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
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

// Compile single C-infinity / C2 trajectory with biological Two-Thirds Power Law curvature timing
// + smooth stage-appreciation linger (`s in [0.10..0.66]`) so all 5 stage photos play unhurriedly inside the hall!
function compileTrajectory(spec) {
  const N = 400;
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
    // Very slow, poised opening camera crawl during the closed-curtain logo & text overture (0..5.7s), then smooth glide to stage:
    const easeIn = 0.15 + 0.18 * sm5(s / 0.05) + 0.67 * sm5((s - 0.055) / 0.115);
    const easeOut = 0.08 + 0.92 * (1.0 - sm5((s - 0.89) / 0.11));
    // Gentle C-infinity stage-appreciation linger while inside the auditorium (`Z < 10.5m`) so all 4 dance photos breathe up close:
    const stageDwell = 1.0 - 0.56 * (sm5((s - 0.11) / 0.12) * (1.0 - sm5((s - 0.62) / 0.14)));
    const bioCurveSlow = Math.pow(1.0 + 2.2 * smoothKappa[j], -0.38);
    speedProfile[j] = Math.max(0.06, easeIn * easeOut * stageDwell * bioCurveSlow);
    if (j > 0) {
      const avgV = 0.5 * (speedProfile[j - 1] + speedProfile[j]);
      cumTime[j] = cumTime[j - 1] + ds / avgV;
    }
  }
  const totalVirtualTime = cumTime[M - 1] || 1.0;
  for (let j = 0; j < M; j++) cumTime[j] /= totalVirtualTime;

  const speedMps = new Float32Array(M);
  for (let j = 0; j < M; j++) {
    speedMps[j] = (speedProfile[j] * totalVirtualTime) / DEFAULT_FILM_DURATION;
  }

  function sampleAtTime01(uTime, outPos, outLook) {
    // Final 5% (`0.95..1.0`) rests gently on the foyer poster + spotlighted seat composition:
    const uActive = clamp(uTime / 0.95, 0, 1);
    let lo = 0, hi = M - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cumTime[mid] <= uActive) lo = mid;
      else hi = mid;
    }
    const spanT = Math.max(1e-6, cumTime[hi] - cumTime[lo]);
    const frac = (uActive - cumTime[lo]) / spanT;
    outPos.lerpVectors(arcPts[lo], arcPts[hi], frac);
    const sArc = (lo + frac) / (M - 1);

    spec.evalGaze(sArc, outPos, outLook);

    const fov = lerp(spec.fovStart || 49.5, 47.0, sArc) - 3.5 * Math.sin(Math.PI * sArc);
    const speedNow = lerp(speedMps[lo], speedMps[hi], frac) * (uTime < 0.95 ? 1.0 : 0.0);
    return { sArc, fov, speedNow };
  }

  return {
    ...spec,
    totalLen: +totalLen.toFixed(1),
    minTurnRadius: +(1.0 / Math.max(0.03, maxKappa)).toFixed(2),
    arcPts,
    cumTime,
    speedMps,
    sampleAtTime01,
  };
}

// Guaranteed-forward analytical gaze: Booth -> Stage -> Pier-Wall Poster + Open Doorway (framing Row 6 Seat 14 spotlight)
function standardStageToPierGaze(sArc, pos, outLook, opts = {}) {
  const startLook = opts.startLook || [-0.25, 1.85, -1.25];
  const wStage = sm5(sArc / (opts.stageInEnd || 0.26));
  const wAisle = sm5((sArc - 0.52) / 0.28);

  const lx = lerp(startLook[0], 0.15, wStage) + 0.65 * wAisle;
  const ly = lerp(startLook[1], 2.22, wStage) - 0.28 * wAisle;
  const lz = lerp(startLook[2], -3.50, wStage) + 1.05 * wAisle;

  // Blend to Pier-Wall Poster + Open Right Doorway `(3.12, 1.52, 12.60)` when backing out past `Z > 9.5m`:
  const endStart = opts.endBlendStart ?? 0.70;
  const wEnd = sm5((sArc - endStart) / (1.0 - endStart));
  const gx = lerp(lx, 3.12, wEnd);
  const gy = lerp(ly, 1.52, wEnd);
  const gz = Math.min(pos.z - 3.20, lerp(lz, 12.60, wEnd));
  return outLook.set(gx, gy, gz);
}

const RAW_SPECS = [
  {
    id: 'T2',
    shortLabel: 'T2 · Pure Bezier Hook ★',
    title: 'T2 · Single Degree-5 Bezier Parabolic Hook (Locked Hero Trajectory)',
    axis: 'Elevated Booth overlook (3.78m) -> unhurried C-infinity sweep across all 5 stage photos -> backs out Right Door as curtains close & spotlight hits Row 6 · Seat 14',
    curveType: 'bezier',
    fovStart: 49.5,
    ctrl: [
      [7.05, 3.78, 10.35],
      [6.65, 2.25,  2.40],
      [1.45, 1.28,  1.10],
      [4.12, 1.42,  4.90],
      [4.35, 1.52, 12.60],
      [3.84, 1.54, 16.45],
    ],
    evalGaze: (s, pos, out) => standardStageToPierGaze(s, pos, out),
  },
  {
    id: 'T1',
    shortLabel: 'T1 · Right-Side Teardrop',
    title: 'T1 · Right-Side Rounded Teardrop (Stays on Right Side, 0 Bounce)',
    axis: 'Right-box glide in -> rounded 2.0m teardrop past stage apron -> straight out Right Door',
    curveType: 'bspline',
    fovStart: 49.5,
    ctrl: [
      [7.05, 3.78, 10.35],
      [6.35, 2.55,  6.40],
      [5.35, 1.60,  2.75],
      [3.48, 1.38,  2.65],
      [3.98, 1.44,  5.65],
      [4.22, 1.50, 10.20],
      [4.18, 1.52, 13.20],
      [3.84, 1.54, 16.45],
    ],
    evalGaze: (s, pos, out) => standardStageToPierGaze(s, pos, out),
  },
  {
    id: 'T3',
    shortLabel: 'T3 · In Center -> Out Right',
    title: 'T3 · Walk In Center Door -> Wide Stage U-Arch -> Out Right Door',
    axis: 'Enters Center Doors -> sweeps wide U-arch across stage -> exits Right Doors to Pier Poster',
    curveType: 'bspline',
    fovStart: 48.0,
    ctrl: [
      [0.00, 1.58, 15.60],
      [0.05, 1.54, 11.20],
      [0.25, 1.50,  5.60],
      [1.05, 1.40,  2.65],
      [3.85, 1.40,  2.95],
      [4.28, 1.48,  7.80],
      [4.20, 1.52, 13.00],
      [3.84, 1.54, 16.45],
    ],
    evalGaze: (s, pos, out) => standardStageToPierGaze(s, pos, out, { startLook: [0.0, 2.05, -2.80] }),
  },
  {
    id: 'T4',
    shortLabel: 'T4 · Left->Right C-Crane',
    title: 'T4 · Left-to-Right Diagonal Crane C-Sweep (Zero X Reversal)',
    axis: 'High rear-left vantage -> sweeps diagonally past Stage -> straight out Right Door',
    curveType: 'bspline',
    fovStart: 49.0,
    ctrl: [
      [-2.60, 3.40, 10.20],
      [-1.10, 2.30,  6.60],
      [ 0.85, 1.50,  3.25],
      [ 3.65, 1.40,  3.15],
      [ 4.28, 1.47,  7.50],
      [ 4.20, 1.52, 12.95],
      [ 3.84, 1.54, 16.45],
    ],
    evalGaze: (s, pos, out) => standardStageToPierGaze(s, pos, out, { startLook: [0.25, 1.95, -2.20] }),
  },
  {
    id: 'T5',
    shortLabel: 'T5 · Pure 1-Way Pull-Back',
    title: 'T5 · Pure 1-Way Pull-Back (Opens at Stage -> Straight Out Doors)',
    axis: 'Zero forward/backward reversal — opens close on Stage and glides continuously out to Poster',
    curveType: 'bspline',
    fovStart: 45.0,
    ctrl: [
      [3.78, 1.38,  2.85],
      [4.08, 1.43,  5.20],
      [4.24, 1.48,  8.80],
      [4.20, 1.52, 12.90],
      [3.84, 1.54, 16.45],
    ],
    evalGaze: (s, pos, out) => standardStageToPierGaze(s, pos, out, { startLook: [0.45, 2.05, -3.10], stageInEnd: 0.18, endBlendStart: 0.62 }),
  },
  {
    id: 'T6',
    shortLabel: 'T6 · Shallow Mid-Hall Swoop',
    title: 'T6 · Shallow Mid-Hall Grazing Arc (Never Dives Deep, Wide Gentle Turn)',
    axis: 'High Booth -> shallow mid-hall C-curve (Z_min ~ 4.8m) -> glides out Right Door',
    curveType: 'bspline',
    fovStart: 49.5,
    ctrl: [
      [7.05, 3.78, 10.35],
      [6.25, 2.55,  5.40],
      [2.85, 1.56,  4.75],
      [4.12, 1.48,  8.60],
      [4.20, 1.52, 13.00],
      [3.84, 1.54, 16.45],
    ],
    evalGaze: (s, pos, out) => standardStageToPierGaze(s, pos, out, { endBlendStart: 0.68 }),
  },
  {
    id: 'T7',
    shortLabel: 'T7 · Orchestra Bowl U-Loop',
    title: 'T7 · Center-Right Orchestra Bowl U-Loop (Wide 2.6m Stage Sweep)',
    axis: 'Booth -> diagonal sweep over center-right seats -> wide front arch -> out Right Door',
    curveType: 'bspline',
    fovStart: 49.5,
    ctrl: [
      [7.05, 3.78, 10.35],
      [3.85, 2.48,  7.40],
      [1.35, 1.62,  4.20],
      [1.95, 1.40,  2.55],
      [4.05, 1.40,  3.40],
      [4.32, 1.47,  7.80],
      [4.20, 1.52, 13.00],
      [3.84, 1.54, 16.45],
    ],
    evalGaze: (s, pos, out) => standardStageToPierGaze(s, pos, out),
  },
  {
    id: 'T8',
    shortLabel: 'T8 · Elevated Balcony Swoop',
    title: 'T8 · Elevated Balcony Orbit -> Gentle Swoop Out Doors',
    axis: 'Stays elevated (Y=3.8->2.0m) arcing across mid-hall -> descends smoothly through Right Door to Poster',
    curveType: 'bspline',
    fovStart: 49.5,
    ctrl: [
      [7.05, 3.78, 10.35],
      [2.20, 3.05,  7.80],
      [1.60, 2.05,  4.40],
      [3.85, 1.58,  4.60],
      [4.24, 1.52,  9.20],
      [4.20, 1.52, 13.10],
      [3.84, 1.54, 16.45],
    ],
    evalGaze: (s, pos, out) => standardStageToPierGaze(s, pos, out, { endBlendStart: 0.70 }),
  },
];

export const TRAJECTORY_LIST = RAW_SPECS.map(compileTrajectory);
export const TRAJECTORIES = Object.fromEntries(TRAJECTORY_LIST.map(t => [t.id, t]));
