import * as THREE from 'three';
import { SITE, EXHIBITIONS, BIO, CONCEPTS, PORTALS, ABOUT_CONCEPTS, INTRO_CONCEPTS, COPY_MODES, SCROLL_CUES } from './data.js';
import { createAboutController } from './about-concepts.js';
import { createIntroController } from './intro-concepts.js';
import { createScrollCueController } from './scroll-cues.js';

const N = EXHIBITIONS.length;
const RING = N * 2; // 6-slot endless ring (2×3 sharing the 3 GPU textures) so scrolling wraps full-circle with 0 teleport!
const mod = (n, m) => ((n % m) + m) % m;
const wrapRing = (d, m = RING) => mod(d + m * 0.5, m) - m * 0.5;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => clamp(v, 0, 1);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function bez(x1, y1, x2, y2) {
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
const E_GLIDE = bez(0.32, 0.72, 0, 1);
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
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbStr(rgb, a = 1) {
  return a >= 0.999 ? `rgb(${rgb[0]|0},${rgb[1]|0},${rgb[2]|0})` : `rgba(${rgb[0]|0},${rgb[1]|0},${rgb[2]|0},${a.toFixed(3)})`;
}
function mixRgb(a, b, t) {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

/* =========================================================================
   URL Params & Live State
   ========================================================================= */
const params = new URLSearchParams(location.search);
const initConcept = CONCEPTS.find((c) => c.id === params.get('c'))?.id || 'c1';
const cDef = CONCEPTS.find((c) => c.id === initConcept);
const linkedIdx = EXHIBITIONS.findIndex((e) => e.slug === location.hash.slice(1).split('/')[0]);   // a link straight to an event: …/#herencia-viva
const initIdx = linkedIdx >= 0 ? linkedIdx : clamp(parseInt(params.get('i') ?? '0', 10) || 0, 0, N - 1);

const rawPortal = params.get('portal') === 'dolly' ? 'threshold' : params.get('portal');
const rawAbout = params.get('about') || params.get('bio');
const rawIntro = params.get('intro');
const rawCopy = params.get('copy');
const rawCue = params.get('cue');

const state = {
  concept: initConcept,
  portal: PORTALS.some((p) => p.id === rawPortal) ? rawPortal : cDef.defaultPortal,
  aboutStyle: ABOUT_CONCEPTS.some((a) => a.id === rawAbout) ? rawAbout : (cDef.defaultAbout || 'a1'),
  introStyle: (rawIntro === 'none' || INTRO_CONCEPTS.some((o) => o.id === rawIntro)) ? rawIntro : 'o1',
  copyMode: COPY_MODES.some((m) => m.id === rawCopy) ? rawCopy : 'l1',
  cueStyle: (rawCue === 'none' || SCROLL_CUES.some((s) => s.id === rawCue)) ? rawCue : 's2',
  active: initIdx,
  target: initIdx,
  p: initIdx,
  tw: null,
  ready: false,
  drawerOpen: false,
  inFilm: false,
  portalAnim: null, // { kind, t0, dur, idx, slotIdx, cx, cy }
  washTrans: { fromIdx: initIdx, toIdx: initIdx, t0: -999, dur: 0.78, dir: 1 },
  hoveredSlot: -1,
};

let aboutCtrl = null;
let introCtrl = null;
let scrollCueCtrl = null;
let portraitSheet = null;

document.body.classList.add('clean-hud');   // the public site is always the visitor's view

/* =========================================================================
   WebGL Setup & Creased Printed-Paper Shader (True Hardware sRGB, 0 Crush)
   ========================================================================= */
const glCanvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0, 10);

const backCanvasEl = $('#backdrop');
const backCtx = backCanvasEl.getContext('2d');
const fxCanvasEl = $('#portal-fx');
const fxCtx = fxCanvasEl.getContext('2d');

let VW = innerWidth, VH = innerHeight, Hv = 1, Wv = 1, DPR = 1;
function resize() {
  VW = innerWidth; VH = innerHeight;
  DPR = Math.min(devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(DPR);
  renderer.setSize(VW, VH, false);
  camera.aspect = VW / VH;
  camera.updateProjectionMatrix();
  Hv = 2 * 10 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  Wv = Hv * camera.aspect;

  backCanvasEl.width = Math.round(VW * DPR);
  backCanvasEl.height = Math.round(VH * DPR);
  fxCanvasEl.width = Math.round(VW * DPR);
  fxCanvasEl.height = Math.round(VH * DPR);
  updateLedgeGeometry();
  updateCenteredAnchors();
}
addEventListener('resize', resize);

const _envVec = new THREE.Vector3();
const _envEuler = new THREE.Euler();
const _layoutCam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
_layoutCam.position.set(0, 0, 10);
_layoutCam.lookAt(0, 0, 0);
_layoutCam.updateMatrixWorld(true);

const _measureRange = document.createRange();
function renderedTextWidth(el) {
  if (!el || getComputedStyle(el).display === 'none') return 0;
  let maxW = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    _measureRange.selectNodeContents(node);
    const w = _measureRange.getBoundingClientRect().width;
    if (w > maxW) maxW = w;
  }
  return maxW;
}

function getStagePosterPose(mob = VW < 820) {
  if (!mob) {
    const placardAllowance = 128;
    const gapAbove = Math.round(clamp(VH * 0.028, 22, 28));
    const gapBelow = Math.round(clamp(VH * 0.03, 24, 30));
    const cueAllowance = 26;
    const topSafe = 64;
    const botSafe = 18;
    const availForEnv = Math.max(180, VH - topSafe - placardAllowance - gapAbove - gapBelow - cueAllowance - botSafe);
    const posterFrac = clamp((availForEnv / 1.095) / Math.max(1, VH), 0.28, 0.44);
    const posterH = Hv * posterFrac;
    const envApprox = VH * posterFrac * 1.095;
    const clusterH = placardAllowance + gapAbove + envApprox + gapBelow + cueAllowance;
    const clusterTopPx = Math.max(topSafe, 56 + ((VH - 66) - clusterH) * 0.46);
    const posterCenterPx = clusterTopPx + placardAllowance + gapAbove + envApprox * 0.5;
    const posterCy = Hv * (0.5 - posterCenterPx / Math.max(1, VH));
    return { posterH, posterCy, gapAbove, gapBelow };
  }
  const placardAllowance = 124;
  const gapBelowPoster = Math.round(clamp(VH * 0.028, 20, 26));
  const gapBelowPlacard = Math.round(clamp(VH * 0.026, 20, 26));
  const cueAllowance = 24;
  const topSafe = 62;
  const botSafe = 14;
  const availForEnv = Math.max(150, VH - topSafe - gapBelowPoster - placardAllowance - gapBelowPlacard - cueAllowance - botSafe);
  const maxFracByWidth = ((VW - 64) / 0.80) / Math.max(1, VH);
  const posterFrac = clamp(Math.min((availForEnv / 1.095) / Math.max(1, VH), maxFracByWidth), 0.24, 0.40);
  const posterH = Hv * posterFrac;
  const envApprox = VH * posterFrac * 1.095;
  const clusterH = envApprox + gapBelowPoster + placardAllowance + gapBelowPlacard + cueAllowance;
  const clusterTopPx = Math.max(topSafe, 56 + ((VH - 70) - clusterH) * 0.42);
  const posterCenterPx = clusterTopPx + envApprox * 0.5;
  const posterCy = Hv * (0.5 - posterCenterPx / Math.max(1, VH));
  return { posterH, posterCy, gapBelowPoster, gapBelowPlacard, placardAllowance };
}

function computePosterEnvelopePx(posterH, posterCy, aspect) {
  _layoutCam.aspect = Math.max(0.1, VW / Math.max(1, VH));
  _layoutCam.updateProjectionMatrix();
  const hw = (posterH * aspect) * 0.5;
  const hh = posterH * 0.5;
  _envVec.set(-hw, posterCy, 0).project(_layoutCam);
  const leftPx = (_envVec.x + 1) * 0.5 * VW;
  _envVec.set(hw, posterCy, 0).project(_layoutCam);
  const rightPx = (_envVec.x + 1) * 0.5 * VW;

  // Include both flat+tape overhang (13px) and resting 3D tilted poses (rx=-0.15, ry=-0.26, rz)
  _envVec.set(0, posterCy + hh, 0).project(_layoutCam);
  let minTopPx = (1 - _envVec.y) * 0.5 * VH - 13;
  _envVec.set(0, posterCy - hh, 0).project(_layoutCam);
  let maxBotPx = (1 - _envVec.y) * 0.5 * VH + 13;

  for (const rz of [-0.04, 0.015]) {
    _envEuler.set(-0.15, -0.26, rz, 'XYZ');
    for (const [cx, cy] of [[-hw, hh], [hw, hh], [hw, -hh], [-hw, -hh]]) {
      _envVec.set(cx, cy, 0.04).applyEuler(_envEuler);
      _envVec.y += posterCy;
      _envVec.project(_layoutCam);
      const py = (1 - _envVec.y) * 0.5 * VH;
      if (py < minTopPx) minTopPx = py;
      if (py > maxBotPx) maxBotPx = py;
    }
  }
  return { leftPx, rightPx, widthPx: Math.max(160, rightPx - leftPx), minTopPx, maxBotPx };
}

function updateCenteredAnchors() {
  const root = document.documentElement;
  const mob = VW < 820;
  const ex = EXHIBITIONS[state.active] || EXHIBITIONS[0];
  const aspect = sheets[state.active]?.aspect || ex.aspect || 0.80;
  const pose = getStagePosterPose(mob);
  const env = computePosterEnvelopePx(pose.posterH, pose.posterCy, aspect);

  root.style.setProperty('--poster-left', `${Math.round(env.leftPx)}px`);
  root.style.setProperty('--poster-width', `${Math.round(env.widthPx)}px`);

  // Regularized figure-caption measure: W_max = min(VW - 36, clamp(13.5rem, 0.93 * posterWidth, W_ceil))
  const wMax = Math.min(Math.max(176, VW - 36), clamp(env.widthPx * 0.93, 216, mob ? 320 : 336));
  root.style.setProperty('--placard-max-w', `${Math.round(wMax)}px`);
  root.style.setProperty('--placard-tight-w', 'max-content');

  // Post-wrap tight bounding-box shrink-wrap (eliminates CSS post-wrap trailing slack after text-wrap: balance)
  const titleEl = document.getElementById('plTitle');
  const subEl = document.getElementById('plSub');
  const btnEl = document.getElementById('enterBtn');
  const btnW = (btnEl && getComputedStyle(btnEl.parentElement).display !== 'none') ? btnEl.offsetWidth : 0;
  const contentW = Math.max(renderedTextWidth(titleEl), renderedTextWidth(subEl), btnW);
  if (contentW > 40) {
    const tightW = Math.min(Math.round(wMax), Math.ceil(contentW + 1));
    root.style.setProperty('--placard-tight-w', `${tightW}px`);
  }

  const nonClusterConcept = state.concept === 'c3' || state.concept === 'c4' || state.concept === 'c7';
  if (!mob) {
    root.style.setProperty('--placard-above-bottom', `${Math.round(VH - (env.minTopPx - pose.gapAbove))}px`);
    if (nonClusterConcept) {
      root.style.setProperty('--cue-below-top', 'auto');
      root.style.setProperty('--cue-dock-bottom', 'clamp(16px, 2.8vh, 30px)');
    } else {
      root.style.setProperty('--cue-below-top', `${Math.round(env.maxBotPx + pose.gapBelow)}px`);
      root.style.setProperty('--cue-dock-bottom', 'auto');
    }
  } else {
    const placardTop = Math.round(env.maxBotPx + pose.gapBelowPoster);
    root.style.setProperty('--placard-below-top', `${placardTop}px`);
    if (nonClusterConcept) {
      root.style.setProperty('--cue-below-top', 'auto');
      root.style.setProperty('--cue-dock-bottom', 'clamp(12px, 2.2vh, 22px)');
    } else {
      const pEl = document.getElementById('placard');
      const pH = (pEl && pEl.offsetHeight > 20) ? pEl.offsetHeight : pose.placardAllowance;
      root.style.setProperty('--cue-below-top', `${Math.round(placardTop + pH + pose.gapBelowPlacard)}px`);
      root.style.setProperty('--cue-dock-bottom', 'auto');
    }
  }
}

const NFOLD = 20;
const FOLDS_GLSL = /* glsl */ `
uniform float uCrease;
uniform vec4 uFold[${NFOLD}];
uniform vec2 uFoldW[${NFOLD}];
float folds(vec2 q, inout vec2 grad) {
  float h = 0.0;
  for (int i = 0; i < ${NFOLD}; i++) {
    vec4 f = uFold[i];
    if (f.w == 0.0) continue;
    vec2 d = vec2(cos(f.z), sin(f.z)), m = vec2(-d.y, d.x), r = q - f.xy;
    float t = dot(r, d), s = dot(r, m), w = uFoldW[i].x, L = uFoldW[i].y;
    if (abs(s) >= w || abs(t) > 3.0 * L) continue;
    float k = 1.0 - abs(s) / w;
    float env = exp(-(t * t) / (L * L));
    h += f.w * k * k * env;
    grad += f.w * (-2.0 * k * sign(s) / w * env * m + k * k * (-2.0 * t / (L * L)) * env * d);
  }
  return h;
}`;

const PAPER_VERT = /* glsl */ `
uniform float uBend;
uniform float uCurl;
uniform float uWave;
uniform float uTime;
uniform float uRoll;
uniform float uSeed;
uniform vec2 uSize;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vT;
varying vec3 vB;
varying vec3 vP;
${FOLDS_GLSL}

float paperShape(vec2 uv, bool withFolds) {
  vec2 q = (uv - 0.5) * uSize;
  float yy = abs(uv.y - 0.5) * 2.0;
  float z = uRoll * (0.042 * yy * yy + 0.026 * pow(yy, 6.0));
  z += uRoll * 0.011 * sin(q.x * 6.3 + uSeed * 1.7) * sin(q.y * 4.1 + uSeed * 0.9);
  if (withFolds && uCrease > 0.001) { vec2 g = vec2(0.0); z += uCrease * folds(q, g); }
  return z;
}

vec3 deform(vec3 p, vec2 uv, bool withFolds) {
  float z0 = paperShape(uv, withFolds);
  float b = uBend;
  if (abs(b) > 0.0005) {
    float a = p.x * b;
    p = vec3(sin(a) / b - z0 * sin(a), p.y, p.z + (1.0 - cos(a)) / b + z0 * cos(a));
  } else {
    p.z += z0;
  }
  float cx = smoothstep(0.05, 0.5, uv.x - 0.5);
  float cy = smoothstep(0.05, 0.5, 0.5 - uv.y);
  p.z += uCurl * cx * cy * (cx + cy);
  p.z += uWave * 0.052 * sin(uv.x * 3.5 + uv.y * 2.1 + uTime * 1.15) * sin(uv.y * 3.0 + uTime * 0.78);
  return p;
}

void main() {
  vUv = uv;
  vec3 p = deform(position, uv, true);
  float e = 0.004;
  vec3 p0 = deform(position, uv, false);
  vec3 px = deform(position + vec3(e, 0.0, 0.0), uv + vec2(e / uSize.x, 0.0), false);
  vec3 py = deform(position + vec3(0.0, e, 0.0), uv + vec2(0.0, e / uSize.y), false);
  vec3 n = normalize(cross(px - p0, py - p0));
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vP = wp.xyz;
  vN = normalize(mat3(modelMatrix) * n);
  vT = normalize(mat3(modelMatrix) * (px - p0));
  vB = normalize(mat3(modelMatrix) * (py - p0));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const PAPER_FRAG = /* glsl */ `
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform vec3 uLight;
uniform vec3 uCam;
uniform float uOpacity;
uniform float uLift;
uniform float uExposure;
uniform vec3 uTint;
uniform vec2 uSize;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vT;
varying vec3 vB;
varying vec3 vP;
${FOLDS_GLSL}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec3 n = normalize(vN);
  if (uCrease > 0.001) {
    vec2 g = vec2(0.0);
    folds((vUv - 0.5) * uSize, g);
    n = normalize(n - uCrease * (g.x * normalize(vT) + g.y * normalize(vB)));
  }
  vec3 col;
  if (gl_FrontFacing) {
    col = texture2D(uFront, vUv).rgb;
  } else {
    col = texture2D(uBack, vec2(1.0 - vUv.x, vUv.y)).rgb;
    n = -n;
  }
  vec3 V = normalize(uCam - vP);
  float diff = max(dot(n, uLight), 0.0);
  // Balanced museum lighting so frontal flat posters preserve 1:1 true pigment
  float shade = (0.82 + 0.21 * diff) * uExposure;
  vec3 H = normalize(uLight + V);
  float sheen = pow(max(dot(n, H), 0.0), 42.0) * (0.035 + 0.045 * uLift) * uExposure;
  float fibre = (hash(floor(vUv * vec2(680.0, 850.0))) - 0.5) * 0.012;
  col = col * shade * uTint + sheen + fibre;
  gl_FragColor = vec4(col, uOpacity);
  #include <colorspace_fragment>
}`;

const SHADOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const SHADOW_FRAG = /* glsl */ `
uniform float uOpacity;
uniform vec2 uSize;
uniform float uBlur;
varying vec2 vUv;
float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
void main() {
  vec2 p = (vUv - 0.5) * uSize * 1.65;
  float d = sdBox(p, uSize * 0.5 - uBlur * 0.55);
  float a = 1.0 - smoothstep(-uBlur * 0.42, uBlur, d);
  gl_FragColor = vec4(0.06, 0.045, 0.035, a * a * uOpacity);
}`;

const LIGHT_DIR = new THREE.Vector3(-0.38, 0.58, 0.72).normalize();
const HIT_MAT = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });

function foldsFor(mat, aspect, seed) {
  const R = rng(seed), u = mat.uniforms, F = u.uFold.value, W = u.uFoldW.value;
  const pick = (a, b) => a + (b - a) * R();
  const sgn = () => (R() < 0.5 ? -1 : 1);
  const slant = sgn() * pick(0.25, 0.58);
  let k = 0;
  const add = (x, y, ang, h, w, L) => { if (k < NFOLD) { F[k].set(x, y, ang, h); W[k].set(w, L); k++; } };
  for (let i = 0; i < 4; i++) add(pick(-0.38, 0.38) * aspect, pick(-0.3, 0.3), Math.PI / 2 + slant + pick(-0.28, 0.28), sgn() * pick(0.004, 0.008), pick(0.03, 0.06), pick(0.3, 0.58));
  for (let i = 0; i < 12; i++) add(pick(-0.46, 0.46) * aspect, pick(-0.46, 0.46), (R() < 0.7 ? Math.PI / 2 + slant : pick(0, Math.PI)) + pick(-0.4, 0.4), sgn() * pick(0.0016, 0.004), pick(0.012, 0.028), pick(0.05, 0.15));
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([cx, cy]) => add(cx * pick(0.36, 0.45) * aspect, cy * pick(0.38, 0.46), Math.atan2(cy, -cx) + pick(-0.35, 0.35), sgn() * pick(0.003, 0.0065), pick(0.02, 0.04), pick(0.07, 0.14)));
  u.uSeed.value = (seed % 97) * 0.37;
}

class PosterSheet {
  constructor(frontTex, backTex, aspect, index, exIdx = index % N) {
    this.index = index;
    this.exIdx = exIdx;
    this.aspect = aspect;
    this.seed = exIdx * 1.73 + 0.41;
    this.group = new THREE.Group();
    this.spinner = new THREE.Group();
    this.group.add(this.spinner);

    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uFront: { value: frontTex },
        uBack: { value: backTex },
        uBend: { value: 0 },
        uCurl: { value: 0.05 },
        uWave: { value: 0.09 },
        uTime: { value: 0 },
        uSize: { value: new THREE.Vector2(aspect, 1) },
        uLight: { value: LIGHT_DIR },
        uCam: { value: camera.position },
        uOpacity: { value: 1 },
        uLift: { value: 0 },
        uExposure: { value: 1 },
        uTint: { value: new THREE.Color(1, 1, 1) },
        uCrease: { value: 0.07 },
        uRoll: { value: 0 },
        uSeed: { value: 0 },
        uFold: { value: Array.from({ length: NFOLD }, () => new THREE.Vector4(0, 0, 0, 0)) },
        uFoldW: { value: Array.from({ length: NFOLD }, () => new THREE.Vector2(1, 1)) },
      },
      vertexShader: PAPER_VERT,
      fragmentShader: PAPER_FRAG,
      side: THREE.DoubleSide,
      transparent: true,
    });
    foldsFor(this.mat, aspect, Math.round(this.seed * 1000) + 11);

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1, 44, 56), this.mat);
    this.spinner.add(this.mesh);

    this.hit = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1), HIT_MAT);
    this.hit.visible = false;
    this.spinner.add(this.hit);

    this.shadowMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0.22 }, uSize: { value: new THREE.Vector2(aspect, 1) }, uBlur: { value: 0.16 } },
      vertexShader: SHADOW_VERT,
      fragmentShader: SHADOW_FRAG,
      transparent: true,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(aspect * 1.65, 1.65), this.shadowMat);
    this.shadow.position.set(0.05, -0.08, -0.35);
    this.shadow.renderOrder = -1;
    this.group.add(this.shadow);
    scene.add(this.group);

    this.cur = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1, exp: 1 };
    this.tgt = { ...this.cur };
    this.spin = 0; this.spinTgt = 0; this.spinVel = 0;
    this.bend = 0; this.crease = 0.08; this.creaseTgt = 0.08;
    this.flat = 0; this.flatTgt = 0;
    this.hangRz = (exIdx % 2 ? 1 : -1) * THREE.MathUtils.degToRad(1.5 + 0.6 * exIdx);
    this.rate = 9.5;
    this.lastD = null;
  }

  snap() {
    Object.assign(this.cur, this.tgt);
    this.crease = this.creaseTgt;
    this.flat = this.flatTgt;
    this.spin = this.spinTgt;
  }

  update(dt, nowSec) {
    const k = reduced ? 1 : 1 - Math.exp(-dt * this.rate);
    const px = this.cur.x;
    for (const key of ['x', 'y', 'z', 'rx', 'ry', 'rz', 's', 'o', 'exp']) {
      this.cur[key] += (this.tgt[key] - this.cur[key]) * k;
    }
    const vx = (this.cur.x - px) / Math.max(dt, 1e-3);
    if (!reduced) {
      const bendTgt = clamp(-vx * 0.075 - this.spinVel * 0.04, -0.85, 0.85);
      this.bend += (bendTgt - this.bend) * (1 - Math.exp(-dt * 7.5));
      const acc = (this.spinTgt - this.spin) * 85 - this.spinVel * 13;
      this.spinVel += acc * dt;
      this.spin += this.spinVel * dt;
    } else {
      this.spin = this.spinTgt;
      this.bend = 0;
    }

    this.flat += (this.flatTgt - this.flat) * (reduced ? 1 : 1 - Math.exp(-dt * 11));
    this.crease += (this.creaseTgt - this.crease) * (reduced ? 1 : 1 - Math.exp(-dt * 12));

    const F = this.flat;
    const isLedge = state.concept === 'c6';
    const floatAmp = (reduced || isLedge) ? 0 : (1 - F);
    const fy = Math.sin(nowSec * 0.68 + this.seed) * 0.02 * floatAmp;
    const fr = Math.sin(nowSec * 0.51 + this.seed * 2.1) * 0.018 * floatAmp;

    this.group.position.set(this.cur.x, this.cur.y + fy, this.cur.z + (1 - F) * (isLedge ? 0 : 0.04));
    this.group.rotation.set(
      isLedge ? mix(this.cur.rx, -0.095, F * 0.4) : (this.cur.rx + fr * 0.5) * (1 - F),
      (this.cur.ry + fr) * (1 - F),
      (this.cur.rz + fr * 0.3 + (isLedge ? 0 : (1 - F) * this.hangRz)) * (1 - F)
    );
    this.group.scale.setScalar(Math.max(this.cur.s, 0.0001));
    this.spinner.rotation.y = this.spin;
    this.group.visible = this.cur.o > 0.005;

    const u = this.mat.uniforms;
    u.uBend.value = this.bend * (1 - F);
    u.uTime.value = nowSec;
    u.uOpacity.value = this.cur.o;
    u.uExposure.value = this.cur.exp;
    u.uCurl.value = (reduced || isLedge) ? 0.015 * (1 - F) : (0.068 * (1 - F));
    u.uWave.value = (reduced || isLedge) ? 0 : (0.09 + Math.abs(this.bend) * 0.25) * (1 - F);
    u.uCrease.value = this.crease * (1 - F);
    u.uRoll.value = clamp01((this.crease - 0.07) / 0.93) * (1 - F);

    let so = mix(0.24, 0.52, F);
    let sx = mix(0.055, 0.007, F);
    let sy = mix(-0.085, -0.012, F);
    let sz = mix(-0.34, -0.022, F);
    let blur = mix(0.18, 0.038, F);
    if (state.concept === 'c2') { so *= 1.35; }
    if (isLedge) { sy = -0.025; sz = -0.06; blur = 0.075; so = 0.38; }
    this.shadowMat.uniforms.uOpacity.value = this.cur.o * so;
    this.shadowMat.uniforms.uBlur.value = blur;
    this.shadow.position.set(sx, sy, sz);
    this.shadow.scale.x = Math.max(0.12, Math.abs(Math.cos(this.spin))) * 1.03;
    this.shadow.scale.y = 1.03;
  }
}

/* =========================================================================
   C6 3D Gallery Ledge & Dado Maquette (Real 3D Architectural Depth)
   ========================================================================= */
const ledgeGroup = new THREE.Group();
ledgeGroup.visible = false;
scene.add(ledgeGroup);

const roomKeyLight = new THREE.DirectionalLight(0xfff4e2, 1.55);
roomKeyLight.position.set(-3.2, 4.4, 5.5);
const roomFillLight = new THREE.HemisphereLight(0xf6efe4, 0x8a6d4b, 0.95);
ledgeGroup.add(roomKeyLight, roomFillLight);

const ledgeWoodMat = new THREE.MeshStandardMaterial({ color: 0x6b4c32, roughness: 0.52, metalness: 0.04 });
const ledgeLipMat = new THREE.MeshStandardMaterial({ color: 0x563b25, roughness: 0.46, metalness: 0.05 });
const wainscotMat = new THREE.MeshStandardMaterial({ color: 0xdad3c6, roughness: 0.88, metalness: 0.0 });
const floor3DMat = new THREE.MeshStandardMaterial({ color: 0x9b7449, roughness: 0.42, metalness: 0.04 });

const ledgeShelf = new THREE.Mesh(new THREE.BoxGeometry(16, 0.09, 0.48), ledgeWoodMat);
const ledgeLip = new THREE.Mesh(new THREE.BoxGeometry(16, 0.13, 0.06), ledgeLipMat);
const wainscotRail = new THREE.Mesh(new THREE.BoxGeometry(20, 0.06, 0.08), wainscotMat);
const floorPlane = new THREE.Mesh(new THREE.PlaneGeometry(24, 8), floor3DMat);
floorPlane.rotation.x = -Math.PI / 2 + 0.08;
ledgeGroup.add(ledgeShelf, ledgeLip, wainscotRail, floorPlane);

function updateLedgeGeometry() {
  const posterH = Hv * 0.55;
  const ledgeY = -Hv * 0.02 - posterH * 0.5 - 0.042;
  ledgeShelf.position.set(0, ledgeY, -0.02);
  ledgeLip.position.set(0, ledgeY + 0.03, 0.21);
  wainscotRail.position.set(0, ledgeY - 0.52, -0.28);
  floorPlane.position.set(0, -Hv * 0.44, -0.6);
}

/* =========================================================================
   Printed Reverse ("Her Note" on the Back of Each Poster)
   ========================================================================= */
function wrapCanvasLines(g, text, maxW) {
  const out = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const test = line ? `${line} ${w}` : w;
    if (line && g.measureText(test).width > maxW) { out.push(line); line = w; }
    else line = test;
  }
  if (line) out.push(line);
  return out;
}

function buildBackTexture(ex, img, aspect) {
  const W = 1200, H = Math.round(W / aspect);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f1ede5';
  g.fillRect(0, 0, W, H);

  if (img) {
    g.save();
    g.translate(W, 0); g.scale(-1, 1);
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = 0.065;
    g.filter = 'blur(8px) saturate(0.45)';
    g.drawImage(img, 0, 0, W, H);
    g.restore();
  }

  const x = W * 0.1, maxW = W * 0.8;
  g.fillStyle = '#1c1916';
  g.font = `500 ${W * 0.02}px Switzer, sans-serif`;
  g.fillText(`N° ${ex.num}`, x, W * 0.105);
  g.textAlign = 'right';
  g.fillText(ex.name.toUpperCase(), W - x, W * 0.105);
  g.textAlign = 'left';

  const size = W * 0.046, lead = size * 1.4;
  g.font = `400 ${size}px Gambetta, Georgia, serif`;
  const lines = wrapCanvasLines(g, ex.note, maxW);
  let y = Math.max(W * 0.28, (H - lines.length * lead - lead * 2.2) * 0.46);
  for (const l of lines) { g.fillText(l, x, y); y += lead; }
  y += lead * 0.65;
  g.font = `italic 400 ${size * 1.15}px Gambetta, Georgia, serif`;
  g.fillText('Vanessa Espín', x, y);
  y += W * 0.048;
  g.font = `500 ${W * 0.019}px Switzer, sans-serif`;
  g.fillStyle = 'rgba(28,25,22,0.62)';
  g.fillText(ex.place.toUpperCase(), x, y);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

/* =========================================================================
   Target Poses per Concept (C1..C8) — Linear 0..2 Stage (Circularity Inside Events Only!)
   ========================================================================= */
let sheets = [];

function getCentredSlot() {
  return state.active;
}

function applySheetTargets(nowSec) {
  // Snappy physical poster response during event entry: chosen poster straightens & centres, neighbours part cleanly
  if (state.portalAnim && params.get('portalPreview') === null) {
    const pSlot = state.portalAnim.slotIdx;
    sheets.forEach((s, slot) => {
      if (slot === pSlot) {
        s.tgt.x = 0; s.tgt.y = 0; s.tgt.z = 0.25;
        s.tgt.rx = 0; s.tgt.ry = 0; s.tgt.rz = 0;
        s.tgt.s = Hv * 0.58; s.tgt.o = 1; s.tgt.exp = 1.02;
        s.flatTgt = 1; s.creaseTgt = 0; s.rate = 16;
      } else {
        const dir = slot < pSlot ? -1 : 1;
        s.tgt.x = dir * Wv * 0.62;
        s.tgt.z = -2.2;
        s.tgt.o = 0;
        s.rate = 14;
      }
    });
    return;
  }

  const c = state.concept;
  const mob = VW < 820;

  // C4: Salon Triptych — all three posters hang side-by-side at once!
  if (c === 'c4') {
    const H = mob ? Hv * 0.34 : Hv * 0.48;
    const span = mob ? Wv * 0.29 : Wv * 0.285;
    sheets.forEach((s, slot) => {
      const isFocus = (state.hoveredSlot >= 0 ? state.hoveredSlot === slot : state.active === slot);
      s.tgt.x = (slot - 1) * span;
      s.tgt.y = mob ? Hv * 0.03 : Hv * 0.04;
      s.tgt.z = isFocus ? 0.24 : -0.12;
      s.tgt.rx = -0.09;
      s.tgt.ry = (1 - slot) * 0.14;
      s.tgt.rz = (slot - 1) * 0.02;
      s.tgt.s = H * (isFocus ? 1.035 : 0.96);
      s.tgt.o = 1;
      s.tgt.exp = isFocus ? 1.02 : 0.88;
      s.flatTgt = (!drag && isFocus) ? 1 : 0;
      s.creaseTgt = isFocus ? 0.04 : 0.42;
      s.rate = 8.5;
    });
    applyAboutAndIntroModifiers();
    return;
  }

  // C3: Monumental Split-Type — centred poster, diagonal corner peeks
  if (c === 'c3') {
    const H = mob ? Hv * 0.42 : Hv * 0.50;
    sheets.forEach((s, slot) => {
      const d = slot - state.p;
      const ad = Math.abs(d);
      s.tgt.x = d * Wv * 0.42;
      s.tgt.y = -d * Hv * 0.28;
      s.tgt.z = -ad * 1.4;
      s.tgt.rx = -0.08 * clamp01(ad);
      s.tgt.ry = -d * 0.22;
      s.tgt.rz = d * -0.06;
      s.tgt.s = H * mix(1, 0.68, clamp01(ad));
      s.tgt.o = ad > 1.35 ? 0 : 1;
      s.tgt.exp = 1;
      s.flatTgt = (!drag && state.hoveredSlot === slot && ad < 0.08) ? 1 : 0;
      s.creaseTgt = mix(0.06, 0.75, clamp01(ad));
      s.rate = clamp(11 - 1.2 * ad, 6.5, 14);
    });
    applyAboutAndIntroModifiers();
    return;
  }

  // C7: Event Broadsheet & Voice Rail — poster hangs on the right plate
  if (c === 'c7') {
    const H = mob ? Hv * 0.40 : Hv * 0.56;
    const cx = mob ? 0 : Wv * 0.21;
    sheets.forEach((s, slot) => {
      const d = slot - state.p;
      const ad = Math.abs(d);
      s.tgt.x = cx + d * Wv * 0.30;
      s.tgt.y = mob ? Hv * 0.14 : Hv * 0.01 + d * Hv * 0.11;
      s.tgt.z = -ad * 1.9;
      s.tgt.rx = -0.14;
      s.tgt.ry = -0.28;
      s.tgt.rz = -0.04 + d * 0.04;
      s.tgt.s = H;
      s.tgt.o = d < -0.12 ? clamp01(1 + (d + 0.12) * 3.2) : (ad > 1.15 ? clamp01(1 - (ad - 1.15) * 2.2) : 1);
      s.tgt.exp = 1;
      s.flatTgt = (!drag && state.hoveredSlot === slot && ad < 0.08) ? 1 : 0;
      s.creaseTgt = mix(0.06, 0.85, clamp01(ad));
      s.rate = clamp(11 - 1.2 * ad, 6.5, 14);
    });
    applyAboutAndIntroModifiers();
    return;
  }

  // C6: 3D Gallery Ledge Maquette — centered poster spacing on wooden picture rail
  if (c === 'c6') {
    const H = mob ? Hv * 0.41 : Hv * 0.50;
    const cx = 0;
    const sx = mob ? Wv * 0.56 : Wv * 0.315;
    sheets.forEach((s, slot) => {
      const d = slot - state.p;
      const ad = Math.abs(d);
      s.tgt.x = cx + d * sx;
      s.tgt.y = mob ? Hv * 0.11 : -Hv * 0.025;
      s.tgt.z = 0.04 - ad * 0.55;
      s.tgt.rx = -0.095;
      s.tgt.ry = d * -0.10;
      s.tgt.rz = 0;
      s.tgt.s = H;
      s.tgt.o = ad > 1.35 ? clamp01(1 - (ad - 1.35) * 2.4) : 1;
      s.tgt.exp = mix(1.03, 0.84, clamp01(ad));
      s.flatTgt = (!drag && state.hoveredSlot === slot && ad < 0.08) ? 1 : 0;
      s.creaseTgt = mix(0.03, 0.38, clamp01(ad));
      s.rate = clamp(10.5 - 1.1 * ad, 6.5, 13);
    });
    applyAboutAndIntroModifiers();
    return;
  }

  // C1 (Komorebi+Wash), C2 (Chiaroscuro Spot), C5 (Living Aura), C8 (Evolved Baseline)
  // Poster + placard + dots form a unified vertical cluster!
  const pose = getStagePosterPose(mob);
  const H = pose.posterH;
  const cx = 0;
  const cy = pose.posterCy;
  const sx = mob ? Wv * 0.56 : Wv * 0.315;
  const sy = mob ? Hv * 0.035 : Hv * 0.068;
  const sz = mob ? 0.95 : 1.18;

  sheets.forEach((s, slot) => {
    const d = slot - state.p;
    const ad = Math.abs(d);
    s.tgt.x = cx + d * sx;
    s.tgt.y = cy + d * sy;
    s.tgt.z = -ad * sz;
    s.tgt.rx = -0.15;
    s.tgt.ry = -0.26 + d * -0.06;
    s.tgt.rz = -0.03 + d * 0.04;
    s.tgt.s = H;
    s.tgt.o = ad > 1.35 ? clamp01(1 - (ad - 1.35) * 1.8) : 1;
    s.tgt.exp = c === 'c2' ? mix(1.05, 0.30, smooth(0.08, 0.85, ad)) : 1.0;
    s.flatTgt = (!drag && state.hoveredSlot === slot && ad < 0.08) ? 1 : 0;
    s.creaseTgt = mix(0.07, 0.92, smooth(0.08, 0.9, ad));
    s.rate = clamp(11 - 1.15 * ad, 6.5, 14);
  });

  applyAboutAndIntroModifiers();
}

function applyAboutAndIntroModifiers() {
  const rm = aboutCtrl ? aboutCtrl.getRoomMode() : null;
  const im = introCtrl ? introCtrl.getSheetIntroFactor() : null;
  const cSlot = getCentredSlot();

  if (drag) {
    sheets.forEach((s) => { s.flatTgt = 0; });
  }

  if (rm && (rm.dimWall > 0.002 || Math.abs(rm.posterShiftX || 0) > 0.001 || (rm.sideFade || 0) > 0.002)) {
    sheets.forEach((s, slot) => {
      if (slot === cSlot) {
        s.tgt.x += (rm.posterShiftX || 0) * Wv;
        s.tgt.s *= (rm.posterScale ?? 1);
        s.tgt.exp = mix(s.tgt.exp, 1.04, rm.dimWall || 0);
        if ((rm.show3DPortrait || 0) > 0.02) {
          s.tgt.o *= clamp01(1 - rm.show3DPortrait * 0.92);
        }
      } else {
        s.tgt.o *= clamp01(1 - (rm.sideFade || 0));
        s.tgt.exp *= mix(1, 0.28, rm.dimWall || 0);
      }
    });
  }

  if (portraitSheet) {
    if (rm && (rm.show3DPortrait || 0) > 0.005 && rm.portraitPose && VW >= 860) {
      const pp = rm.portraitPose;
      portraitSheet.tgt.x = (pp.x ?? -0.22) * Wv;
      portraitSheet.tgt.y = (pp.y ?? 0.01) * Hv;
      portraitSheet.tgt.z = pp.z ?? 0.35;
      portraitSheet.tgt.rx = -0.05;
      portraitSheet.tgt.ry = pp.ry ?? 0.16;
      portraitSheet.tgt.rz = -0.012;
      portraitSheet.tgt.s = (pp.s ?? 0.50) * Hv;
      portraitSheet.tgt.o = clamp01(rm.show3DPortrait);
      portraitSheet.tgt.exp = 1.03;
      portraitSheet.creaseTgt = 0.04;
      portraitSheet.flatTgt = 0.2;
      portraitSheet.rate = 10;
    } else {
      portraitSheet.tgt.o = 0;
      portraitSheet.tgt.z = -0.8;
      portraitSheet.tgt.y = -Hv * 0.1;
      portraitSheet.rate = 13;
    }
  }

  if (im && ((im.lift || 0) > 0.002 || (im.extraCurl || 0) > 0.002)) {
    sheets.forEach((s) => {
      s.tgt.y -= (im.lift || 0) * Hv * 0.22;
      s.creaseTgt = clamp01(s.creaseTgt + (im.extraCurl || 0) * 0.45);
    });
  }
}

/* =========================================================================
   Corner Masking Tape Overlay (#pinsSvg — shown when a sheet flattens)
   ========================================================================= */
const pinsSvg = $('#pinsSvg');
const SVGNS = 'http://www.w3.org/2000/svg';
const tapeEls = [0, 1, 2, 3].map(() => {
  const p = document.createElementNS(SVGNS, 'polygon');
  p.setAttribute('class', 'tape-poly');
  p.setAttribute('points', '-0.5,-0.13 0.48,-0.14 0.52,0.12 -0.47,0.14');
  p.style.opacity = '0';
  pinsSvg.appendChild(p);
  return p;
});

function projectSheetCorners(sheet) {
  const a = sheet.aspect;
  return [[0, 1], [1, 1], [1, 0], [0, 0]].map(([u, v]) => {
    const vec = new THREE.Vector3((u - 0.5) * a, v - 0.5, 0);
    sheet.mesh.localToWorld(vec);
    vec.project(camera);
    return [(vec.x + 1) * 0.5 * VW, (1 - vec.y) * 0.5 * VH];
  });
}

function updateTapeOverlay() {
  const cSlot = getCentredSlot();
  const slot = state.concept === 'c4'
    ? (state.hoveredSlot >= 0 ? (state.hoveredSlot % N) : state.active)
    : (state.hoveredSlot === cSlot ? cSlot : -1);
  const s = sheets[slot];
  const aboutMix = aboutCtrl ? aboutCtrl.getMix() : 0;
  const show = !drag && aboutMix < 0.05 && s && s.flat > 0.65 && (state.concept === 'c4' || state.concept === 'c1' || state.concept === 'c8');
  if (!show) {
    tapeEls.forEach((el) => { el.style.opacity = '0'; });
    return;
  }
  const corners = projectSheetCorners(s); // TL, TR, BR, BL
  const wPx = Math.hypot(corners[1][0] - corners[0][0], corners[1][1] - corners[0][1]);
  const sz = Math.max(28, wPx * 0.16);
  const angles = [-40, 40, -40, 40];
  corners.forEach(([x, y], k) => {
    tapeEls[k].style.opacity = clamp01((s.flat - 0.65) / 0.3).toFixed(2);
    tapeEls[k].setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${angles[k]}) scale(${sz.toFixed(1)})`);
  });
}

/* =========================================================================
   Backdrop Canvas Renderer per Concept (60fps Procedural Light & Wash)
   ========================================================================= */
function drawWetWashBlob(ctx, cx, cy, maxR, prog, midHex, deepHex, alphaScale = 1) {
  if (prog <= 0.002) return;
  const r = maxR * E_OUT(prog);
  const mid = hexToRgb(midHex), deep = hexToRgb(deepHex);

  ctx.save();
  // 5 organic overlapping GRIS watercolour lobes with slightly darker wet pigment rim
  const lobes = [
    [0, 0, 1.0, 0],
    [-0.24, -0.15, 0.76, 1.1],
    [0.26, 0.14, 0.80, 2.3],
    [-0.14, 0.24, 0.70, 3.7],
    [0.18, -0.22, 0.72, 4.9],
  ];
  for (const [ox, oy, sc, ph] of lobes) {
    const lx = cx + ox * r * 0.52;
    const ly = cy + oy * r * 0.42;
    const lr = Math.max(2, r * sc);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(ph * 0.7);
    ctx.scale(1, 0.86);
    const grd = ctx.createRadialGradient(0, 0, lr * 0.06, 0, 0, lr);
    grd.addColorStop(0, rgbStr(mid, 0.20 * alphaScale));
    grd.addColorStop(0.62, rgbStr(mid, 0.16 * alphaScale));
    grd.addColorStop(0.84, rgbStr(mixRgb(mid, deep, 0.38), 0.21 * alphaScale));
    grd.addColorStop(1, rgbStr(deep, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, lr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Deterministic organic leaf clusters for Perfect Days Komorebi (zero crossed X bars!)
const KOMOREBI_LEAVES = (() => {
  const R = rng(4021);
  const arr = [];
  for (let i = 0; i < 34; i++) {
    arr.push({
      ux: 0.08 + R() * 0.86,
      uy: -0.04 + R() * 0.96,
      rx: 0.022 + R() * 0.052,
      ry: 0.012 + R() * 0.028,
      rot: -0.55 + R() * 1.1,
      ph: R() * Math.PI * 2,
      spd: 0.45 + R() * 0.55,
      wt: 0.55 + R() * 0.65,
      bright: i % 3 === 0, // sunlit gaps between foliage
    });
  }
  return arr;
})();

function drawKomorebiLight(ctx, W, H, nowSec, strength = 1, isDarkWall = false) {
  ctx.save();
  const breeze = reduced ? 0 : Math.sin(nowSec * 0.52) * W * 0.012;

  // 1. Soft directional warm sunbeams pouring diagonally from upper-left (no rigid window crossbars!)
  ctx.globalCompositeOperation = isDarkWall ? 'screen' : 'soft-light';
  const beamAngles = [
    [0.06, -0.08, 0.68, 0.95, 0.34],
    [0.32, -0.10, 0.96, 0.88, 0.24],
  ];
  for (const [x0, y0, x1, y1, a0] of beamAngles) {
    const g = ctx.createLinearGradient(W * x0 + breeze, H * y0, W * x1 + breeze, H * y1);
    const a = a0 * strength * (isDarkWall ? 0.20 : 1.0);
    g.addColorStop(0, `rgba(255, 244, 214, ${a.toFixed(3)})`);
    g.addColorStop(0.55, `rgba(255, 238, 198, ${(a * 0.48).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255, 236, 190, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Organic wind-breathing Perfect Days leaf-cluster dapples (soft sunlit pockets + soft foliage penumbra)
  for (const lf of KOMOREBI_LEAVES) {
    const dx = reduced ? 0 : Math.sin(nowSec * lf.spd + lf.ph) * W * 0.009 + Math.cos(nowSec * 0.33 + lf.ph) * W * 0.005;
    const dy = reduced ? 0 : Math.cos(nowSec * lf.spd * 0.82 + lf.ph) * H * 0.007;
    const cx = lf.ux * W + breeze * 0.7 + dx;
    const cy = lf.uy * H + dy;
    const rx = lf.rx * W, ry = lf.ry * W;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(lf.rot + (reduced ? 0 : Math.sin(nowSec * 0.7 + lf.ph) * 0.06));
    ctx.scale(1, ry / rx);

    if (lf.bright) {
      ctx.globalCompositeOperation = isDarkWall ? 'screen' : 'overlay';
      const sg = ctx.createRadialGradient(0, 0, rx * 0.05, 0, 0, rx);
      const sa = (isDarkWall ? 0.058 : 0.19) * lf.wt * strength;
      sg.addColorStop(0, `rgba(255, 248, 224, ${sa.toFixed(3)})`);
      sg.addColorStop(1, 'rgba(255, 248, 224, 0)');
      ctx.fillStyle = sg;
    } else {
      ctx.globalCompositeOperation = 'multiply';
      const dg = ctx.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
      const da = (isDarkWall ? 0.13 : 0.082) * lf.wt * strength;
      dg.addColorStop(0, `rgba(38, 28, 20, ${da.toFixed(3)})`);
      dg.addColorStop(0.6, `rgba(38, 28, 20, ${(da * 0.48).toFixed(3)})`);
      dg.addColorStop(1, 'rgba(38, 28, 20, 0)');
      ctx.fillStyle = dg;
    }
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function renderBackdrop(nowMs) {
  const nowSec = nowMs * 0.001;
  const W = backCanvasEl.width, H = backCanvasEl.height;
  const ctx = backCtx;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const c = state.concept;
  const ex = EXHIBITIONS[state.active];
  const prevEx = EXHIBITIONS[state.washTrans.fromIdx] || ex;
  const wt = clamp01((nowMs - state.washTrans.t0) / 1000 / state.washTrans.dur);
  const maxDiag = Math.hypot(W, H);

  if (c === 'c1') {
    // C1: Washed C8 colour bases + GRIS wet-edge watercolour bloom + organic Perfect Days Komorebi
    const baseRgb = mixRgb(hexToRgb(prevEx.wash.base), hexToRgb(ex.wash.base), E_OUT(wt));
    ctx.fillStyle = rgbStr(baseRgb);
    ctx.fillRect(0, 0, W, H);

    // Subtle plaster edge warmth so washed C8 bases feel painted onto gallery plaster, never flat hex!
    const plasterVig = ctx.createRadialGradient(W * 0.5, H * 0.48, H * 0.12, W * 0.5, H * 0.48, maxDiag * 0.62);
    plasterVig.addColorStop(0, ex.wash.dark ? 'rgba(255,244,225,0.06)' : 'rgba(255,250,242,0.22)');
    plasterVig.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = plasterVig;
    ctx.fillRect(0, 0, W, H);

    if (wt < 1 && state.washTrans.fromIdx !== state.washTrans.toIdx) {
      drawWetWashBlob(ctx, W * 0.52, H * 0.48, maxDiag * 0.62, 1, prevEx.wash.mid, prevEx.wash.deep, 1.15 * (1 - wt));
    }
    const originX = W * (state.washTrans.dir >= 0 ? 0.58 : 0.42);
    drawWetWashBlob(ctx, originX, H * 0.48, maxDiag * 0.66, wt < 1 ? mix(0.32, 1, wt) : 1, ex.wash.mid, ex.wash.deep, 1.22);
    drawKomorebiLight(ctx, W, H, nowSec, 1.05, !!ex.wash.dark);
  } else if (c === 'c2') {
    // C2: Chiaroscuro Spotlight Stage (Dark room + honey-oak floor sheen + warm gallery pin-spot)
    const roomRgb = mixRgb(hexToRgb(prevEx.spot.room), hexToRgb(ex.spot.room), E_OUT(wt));
    ctx.fillStyle = rgbStr(roomRgb);
    ctx.fillRect(0, 0, W, H);

    // Subtle honey-oak floor horizon & warm reflection pool along bottom 17%
    const floorY = H * 0.83;
    const fg = ctx.createLinearGradient(0, floorY, 0, H);
    fg.addColorStop(0, 'rgba(38, 26, 16, 0.55)');
    fg.addColorStop(0.35, 'rgba(26, 18, 11, 0.82)');
    fg.addColorStop(1, 'rgba(10, 8, 6, 0.98)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, floorY, W, H - floorY);
    ctx.fillStyle = 'rgba(236, 212, 178, 0.08)';
    ctx.fillRect(0, floorY, W, 1.5);

    // Focused overhead elliptical gallery spotlight onto the active poster
    const sx = W * (VW < 820 ? 0.5 : 0.575), sy = H * 0.47;
    const sp = ctx.createRadialGradient(sx, sy, H * 0.05, sx, sy, H * 0.52);
    sp.addColorStop(0, ex.spot.cone);
    sp.addColorStop(0.55, ex.spot.cone.replace(/[\d.]+\)$/, '0.10)'));
    sp.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sp;
    ctx.fillRect(0, 0, W, H);

    // Floor bounce pool
    const fb = ctx.createRadialGradient(sx, floorY + H * 0.05, H * 0.02, sx, floorY + H * 0.05, W * 0.24);
    fb.addColorStop(0, ex.spot.cone.replace(/[\d.]+\)$/, '0.22)'));
    fb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fb;
    ctx.fillRect(0, floorY, W, H - floorY);
  } else if (c === 'c3' || c === 'c8') {
    // C3 / C8 Evolved Baseline: Crisp straight-edge diagonal pigment pass
    const palPrev = c === 'c3' ? prevEx.franco : prevEx.evolved;
    const palCur = c === 'c3' ? ex.franco : ex.evolved;
    ctx.fillStyle = palPrev.ground;
    ctx.fillRect(0, 0, W, H);

    if (wt < 0.999 && state.washTrans.fromIdx !== state.washTrans.toIdx) {
      const e = 1 - Math.pow(1 - wt, 1.8);
      ctx.save();
      ctx.beginPath();
      if (state.washTrans.dir >= 0) {
        const xCut = mix(W * 1.25, -W * 0.25, e);
        ctx.moveTo(xCut, 0); ctx.lineTo(W * 1.3, 0); ctx.lineTo(W * 1.3, H); ctx.lineTo(xCut - W * 0.18, H);
      } else {
        const xCut = mix(-W * 0.25, W * 1.25, e);
        ctx.moveTo(-W * 0.3, 0); ctx.lineTo(xCut, 0); ctx.lineTo(xCut + W * 0.18, H); ctx.lineTo(-W * 0.3, H);
      }
      ctx.closePath();
      ctx.fillStyle = palCur.ground;
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = palCur.ground;
      ctx.fillRect(0, 0, W, H);
    }

    // dashed curatorial thread behind the stamp/poster
    if (c === 'c3') {
      ctx.save();
      ctx.strokeStyle = rgbStr(hexToRgb(palCur.ink), 0.26);
      ctx.lineWidth = Math.max(1.5, W * 0.0016);
      ctx.setLineDash([8 * DPR, 9 * DPR]);
      ctx.beginPath();
      ctx.moveTo(0, H * 0.58);
      ctx.bezierCurveTo(W * 0.28, H * 0.34, W * 0.68, H * 0.68, W, H * 0.42);
      ctx.stroke();
      ctx.restore();
    }
  } else if (c === 'c4') {
    // C4 Salon Triptych: Sunlit gallery plaster + subtle picture-rail + soft warm pool behind focused poster
    ctx.fillStyle = '#e6e1d7';
    ctx.fillRect(0, 0, W, H);
    const railY = H * 0.135;
    ctx.fillStyle = 'rgba(24, 20, 16, 0.11)';
    ctx.fillRect(0, railY, W, Math.max(1, DPR));
    const focusIdx = state.hoveredSlot >= 0 ? (state.hoveredSlot % N) : state.active;
    const fx = W * (0.5 + (focusIdx - 1) * 0.285);
    const fEx = EXHIBITIONS[focusIdx];
    const halo = ctx.createRadialGradient(fx, H * 0.46, H * 0.04, fx, H * 0.46, H * 0.36);
    halo.addColorStop(0, rgbStr(hexToRgb(fEx.wash.mid), 0.20));
    halo.addColorStop(1, 'rgba(230,225,215,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
    drawKomorebiLight(ctx, W, H, nowSec, 0.45);
  } else if (c === 'c5') {
    // C5 Living-Window Aura: Calm linen ground + animated world aura breathing behind the active poster!
    ctx.fillStyle = '#e3ded4';
    ctx.fillRect(0, 0, W, H);
    const px = W * (VW < 820 ? 0.5 : 0.575), py = H * 0.485;
    const boost = state.hoveredSlot === getCentredSlot() ? 1.35 : 1.0;

    if (ex.aura === 'iyuana') {
      const g = ctx.createRadialGradient(px, py, H * 0.06, px, py, H * 0.40);
      g.addColorStop(0, `rgba(245, 164, 66, ${(0.34 * boost).toFixed(2)})`);
      g.addColorStop(0.55, `rgba(42, 62, 44, ${(0.18 * boost).toFixed(2)})`);
      g.addColorStop(1, 'rgba(227,222,212,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Drifting golden Amazonian fire-sparks around the poster rim
      for (let k = 0; k < 18; k++) {
        const ph = k * 2.17 + nowSec * (0.45 + (k % 4) * 0.12);
        const exX = px + Math.sin(ph * 0.9 + k) * H * 0.22;
        const exY = py + H * 0.24 - ((ph * 38) % (H * 0.52));
        const r = (2.2 + (k % 3) * 1.4) * DPR;
        ctx.fillStyle = `rgba(244, 152, 48, ${(0.42 * boost * Math.sin(((ph * 38) % (H * 0.52)) / (H * 0.52) * Math.PI)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(exX, exY, r, 0, Math.PI * 2); ctx.fill();
      }
    } else if (ex.aura === 'herencia') {
      drawWetWashBlob(ctx, px, py, H * 0.44, 1, '#d88288', '#2f5fc0', 0.95 * boost);
      drawKomorebiLight(ctx, W, H, nowSec, 0.72);
    } else {
      // Ayazamana stage cyclorama aura (crimson + mint + warm stage gold)
      const g1 = ctx.createRadialGradient(px - H * 0.08 * Math.sin(nowSec * 0.8), py, H * 0.05, px, py, H * 0.42);
      g1.addColorStop(0, `rgba(182, 46, 78, ${(0.32 * boost).toFixed(2)})`);
      g1.addColorStop(0.55, `rgba(232, 188, 74, ${(0.20 * boost).toFixed(2)})`);
      g1.addColorStop(1, 'rgba(227,222,212,0)');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    }
  } else if (c === 'c6') {
    // C6 Gallery Ledge 3D: Warm upper museum wall + subtle raking side-window gradient
    const wg = ctx.createLinearGradient(0, 0, W, H);
    wg.addColorStop(0, '#eee9df');
    wg.addColorStop(0.65, '#dfd8cb');
    wg.addColorStop(1, '#cfc6b6');
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, W, H);
    drawKomorebiLight(ctx, W, H, nowSec, 0.62);
  } else if (c === 'c7') {
    // C7 Curatorial Broadsheet: Warm cotton newsprint + ink plate behind right-hand poster
    ctx.fillStyle = '#ece6da';
    ctx.fillRect(0, 0, W, H);
    if (VW >= 820) {
      const splitX = W * 0.46;
      ctx.fillStyle = 'rgba(21,19,16,0.14)';
      ctx.fillRect(splitX, H * 0.09, Math.max(1, DPR * 0.75), H * 0.82);
      const plateRgb = hexToRgb(ex.wash.mid);
      ctx.fillStyle = rgbStr(plateRgb, 0.13);
      ctx.fillRect(splitX + W * 0.035, H * 0.12, W * 0.46, H * 0.76);
    }
  }

  // True House-Lights-Down Dusk Curve when Dark-Gallery About opens (0 muddy grey CSS scrim!)
  const rm = aboutCtrl ? aboutCtrl.getRoomMode() : null;
  if (rm && (rm.dimWall || 0) > 0.002) {
    const dm = clamp01(rm.dimWall);
    ctx.fillStyle = `rgba(14, 11, 9, ${(dm * (rm.nightKomorebi ? 0.86 : 0.93)).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);

    // Warm gallery spotlight cone over the re-hung left 3D poster or 3D portrait print!
    const bayX = W * clamp(0.5 + (rm.posterShiftX ?? -0.26) * 0.85, 0.16, 0.44);
    const spot = ctx.createRadialGradient(bayX, H * 0.46, H * 0.04, bayX, H * 0.48, H * 0.46);
    const rimRgb = hexToRgb(ex.spot?.rim || '#f0a84b');
    spot.addColorStop(0, rgbStr(rimRgb, 0.20 * dm));
    spot.addColorStop(0.55, `rgba(244, 212, 168, ${(0.07 * dm).toFixed(3)})`);
    spot.addColorStop(1, 'rgba(14, 11, 9, 0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, W, H);

    if ((rm.nightKomorebi || 0) > 0.01) {
      drawKomorebiLight(ctx, W, H, nowSec, 0.95 * rm.nightKomorebi, true);
    }
  }

  ctx.restore();
}

/* =========================================================================
   Theme & Placard Synchronization
   ========================================================================= */
const placardEl = $('#placard');
const splitTopEl = $('#splitTop');
const splitBotEl = $('#splitBot');
const triptychBarEl = $('#triptychBar');
const bsListEl = $('#bsList');

function buildStaticConceptDOM() {
  // Centered Event Planning dropdown rows (uniform plain-English event type + Queens venue)
  $('#indexList').innerHTML = EXHIBITIONS.map((ex, i) => `
    <button class="index-row" type="button" data-goto="${i}">
      <span class="index-row__top"><span>${ex.name}</span><em>${ex.shortDate}</em></span>
      <span class="index-row__sub">${ex.uniformSub}</span>
    </button>
  `).join('');

  // C4 Triptych captions
  triptychBarEl.innerHTML = EXHIBITIONS.map((ex, i) => `
    <div class="triptych-cap" data-trip="${i}" role="button" tabindex="0">
      <div class="triptych-cap__num">N° ${ex.num} · ${ex.shortDate.toUpperCase()}</div>
      <div class="triptych-cap__title">${ex.name}</div>
      <div class="triptych-cap__meta">${ex.venue}</div>
      <span class="triptych-cap__go">Experience the Event →</span>
    </div>
  `).join('');

  // C7 Broadsheet rows
  bsListEl.innerHTML = EXHIBITIONS.map((ex, i) => `
    <button class="bs-item" type="button" data-bs="${i}">
      <span class="bs-item__n">${ex.num}</span>
      <span class="bs-item__t">${ex.name}</span>
      <span class="bs-item__d">${ex.shortDate}</span>
    </button>
  `).join('');
}

function syncThemeColors() {
  const c = state.concept;
  const ex = EXHIBITIONS[state.active];
  const root = document.documentElement;
  let ink = '#151310', muted = 'rgba(21,19,16,0.58)', rule = 'rgba(21,19,16,0.18)', bg = '#e6e1d7', dark = false;

  if (c === 'c2') {
    bg = ex.spot.room; ink = ex.spot.ink;
    muted = 'rgba(236,228,215,0.62)'; rule = 'rgba(236,228,215,0.20)'; dark = true;
  } else if (c === 'c3') {
    bg = ex.franco.ground; ink = ex.franco.ink;
    muted = rgbStr(hexToRgb(ex.franco.subInk), 0.78);
    rule = rgbStr(hexToRgb(ex.franco.ink), 0.25);
    dark = true;
  } else if (c === 'c8') {
    bg = ex.evolved.ground; ink = ex.evolved.ink;
    const ir = hexToRgb(ink);
    muted = rgbStr(ir, 0.68); rule = rgbStr(ir, 0.22);
    dark = (ir[0] + ir[1] + ir[2]) > 420;
  } else if (c === 'c1') {
    bg = ex.wash.base; ink = ex.wash.ink; muted = ex.wash.muted;
    dark = !!ex.wash.dark;
    rule = dark ? 'rgba(244,237,226,0.22)' : 'rgba(28,18,19,0.18)';
  }

  root.style.setProperty('--bg', bg);
  root.style.setProperty('--ink', ink);
  root.style.setProperty('--muted', muted);
  root.style.setProperty('--rule', rule);
  document.body.dataset.tone = dark ? 'dark' : 'light';
  document.body.dataset.concept = c;
  ledgeGroup.visible = (c === 'c6');
}

let placardSwapTimer = 0;
function syncExhibitionDOM(instant = false) {
  const i = state.active;
  const ex = EXHIBITIONS[i];
  syncThemeColors();

  splitTopEl.textContent = ex.splitTop;
  splitBotEl.textContent = ex.splitBot;
  const cornerCountEl = $('#cornerCount');
  if (cornerCountEl) cornerCountEl.textContent = `${ex.num} / 0${N}`;
  const nextEx = EXHIBITIONS[(i + 1) % N];
  const cornerNextEl = $('#cornerNext');
  if (cornerNextEl) cornerNextEl.textContent = `Next: ${nextEx.name} →`;

  document.querySelectorAll('[data-goto]').forEach((b) => b.classList.toggle('is-current', +b.dataset.goto === i));
  document.querySelectorAll('[data-trip]').forEach((b) => b.classList.toggle('is-active', +b.dataset.trip === i));
  document.querySelectorAll('[data-bs]').forEach((b) => b.classList.toggle('is-active', +b.dataset.bs === i));

  $('#bsQuote').textContent = ex.stoodShort || '';
  $('#bsVenue').textContent = `${ex.kind} · ${ex.venue}`;
  if (scrollCueCtrl) scrollCueCtrl.sync(i, state.p);

  document.body.dataset.copy = state.copyMode;
  const renderTwoLineSub = (raw) => {
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const idx = String(raw || '').indexOf(' · ');
    if (idx < 0) return `<span class="placard__desc">${esc(raw)}</span>`;
    return `<span class="placard__desc">${esc(raw.slice(0, idx))}</span><span class="placard__loc">${esc(raw.slice(idx + 3))}</span>`;
  };
  const writePlacard = () => {
    if (state.copyMode === 'l2') {
      $('#plTitle').textContent = ex.typeHeadline;
      $('#plSub').innerHTML = renderTwoLineSub(ex.typeSub);
    } else if (state.copyMode === 'l3') {
      $('#plTitle').textContent = ex.name;
      $('#plSub').textContent = ex.stoodShort;
    } else {
      // L1 (default) & L4 (hidden via CSS): Short name + Description on line 1, Location on line 2 (no dot)
      $('#plTitle').textContent = ex.name;
      $('#plSub').innerHTML = renderTwoLineSub(ex.uniformSub);
    }
    placardEl.classList.remove('is-swapping');
    updateCenteredAnchors();
  };

  updateCenteredAnchors();
  clearTimeout(placardSwapTimer);
  if (instant) {
    writePlacard();
  } else {
    placardEl.classList.add('is-swapping');
    placardSwapTimer = setTimeout(writePlacard, 150);
  }
}

/* =========================================================================
   Linear Navigation on Main Stage (0..2); Circular Loop Inside Events Only!
   ========================================================================= */
function goToExhibition(nextIdx, now = performance.now()) {
  const clamped = clamp(nextIdx, 0, N - 1);
  if (clamped === state.active && !state.tw && Math.abs(state.target - clamped) < 1e-4) return false;
  const prev = state.active;
  state.washTrans = { fromIdx: prev, toIdx: clamped, t0: now, dur: 0.78, dir: clamped >= prev ? 1 : -1 };
  state.active = clamped;
  state.target = clamped;
  state.tw = reduced ? null : { from: state.p, to: clamped, t0: now, dur: 0.51 };
  if (reduced) state.p = clamped;
  if (scrollCueCtrl) scrollCueCtrl.markScrolled();
  syncExhibitionDOM(false);
  syncUrl();
  return true;
}

function stepBy(delta, now = performance.now()) {
  if (!delta) return false;
  return goToExhibition(state.active + delta, now);
}

/* =========================================================================
   Snappy 60fps Graphical Event Entry (Deferred Iframe = Zero Click Jank!)
   Zero edits to the 3 event directories!
   ========================================================================= */
const filmStage = $('#filmStage');
const filmNav = $('#filmNav');
const filmReturn = $('#filmReturn');
const filmNext = $('#filmNext');
const filmMedia = $('#filmMedia');

// Event media (shared module in /event-media/): each film carries the viewer; this nav only asks it to open.
// The film says "ready" with its item count, and "open" / "close" so the nav can step aside while the viewer is up.
const filmFrame = () => filmStage.querySelector('iframe');
filmMedia.addEventListener('click', () => {
  const ifr = filmFrame();
  try { ifr.contentWindow.EventMedia.open(); ifr.contentWindow.focus(); } catch {}
});
window.addEventListener('message', (e) => {
  const d = e.data, ifr = filmFrame();
  if (e.origin !== location.origin || !d || d.source !== 'event-media' || !ifr || e.source !== ifr.contentWindow) return;
  if (d.type === 'ready') { filmMedia.textContent = `Media (${d.count})`; filmMedia.hidden = false; dressFilm(ifr); if (pendingMedia) { pendingMedia = false; try { ifr.contentWindow.EventMedia.open(); ifr.contentWindow.focus(); } catch {} } }
  if (d.type === 'open') { document.body.classList.add('media-open'); siteNav.media(true); }
  if (d.type === 'close') { document.body.classList.remove('media-open'); filmMedia.focus({ preventScroll: true }); siteNav.media(false); }
  if (d.type === 'escape') returnFromFilm();     // Escape pressed while the keyboard is inside the film
});
const resetFilmMedia = () => { filmMedia.hidden = true; document.body.classList.remove('media-open'); };

/* Site stitching: the browser's Back and Forward, and links straight to an event, to its media, or to About.
   Addresses: #iyuana · #herencia-viva · #ayazamana · #<event>/media · #about. The plain address is the landing. */
let pendingMedia = false;
const siteNav = (() => {
  let quiet = 0;                                   // history moves this code made itself, to be ignored when they report back
  let at = location.hash.slice(1);                 // where the address is, or is about to be (Back takes a moment to land)
  const slugIdx = (slug) => EXHIBITIONS.findIndex((e) => e.slug === slug);
  const here = () => { const [slug = '', sub = ''] = at.split('/'); return { slug, sub }; };
  const set = (hash, push) => { at = hash; const u = new URL(location.href); u.hash = hash; history[push ? 'pushState' : 'replaceState']({ site: hash }, '', u); };
  // Undo a step this code pushed. If the visitor arrived by a direct link there is no such step, so the address is rewritten in place.
  const stepBack = (fallback) => { if (history.state && history.state.site === at && quiet === 0) { quiet++; at = fallback; history.back(); } else set(fallback, false); };
  return {
    entered(slug) { if (here().slug !== slug) set(slug, true); },
    switched(slug) { set(slug, false); },          // Next keeps one entry, so Back from any event returns to the landing
    left(fromHistory) { if (!fromHistory && slugIdx(here().slug) >= 0) stepBack(''); },
    about(open) { const on = here().slug === 'about'; if (open && !on) set('about', true); else if (!open && on) stepBack(''); },
    media(open) { const h = here(); if (slugIdx(h.slug) < 0) return; if (open && h.sub !== 'media') set(h.slug + '/media', true); else if (!open && h.sub === 'media') stepBack(h.slug); },
    apply() {                                      // bring the page to what the address says
      at = location.hash.slice(1);
      const { slug, sub } = here(), idx = slugIdx(slug);
      if (idx >= 0) {
        if (state.drawerOpen) closeAbout();
        if (!state.inFilm && !state.portalAnim) { pendingMedia = sub === 'media'; goToExhibition(idx); setTimeout(() => enterFilm(idx, getCentredSlot()), 60); }
        else if (state.inFilm) { try { const m = filmFrame().contentWindow.EventMedia; if (sub === 'media') m.open(); else if (m.isOpen()) m.close(); } catch {} }
      } else {
        if (state.inFilm || state.portalAnim) returnFromFilm(true);
        if (slug === 'about') { if (!state.drawerOpen) openAbout(); } else if (state.drawerOpen) closeAbout();
      }
    },
    onPop() { if (quiet > 0) { quiet--; return; } this.apply(); },
  };
})();
addEventListener('popstate', () => siteNav.onPop());

/* In the visitor's view (?clean=1, or H) a film's own review controls are hidden too. They stay in the page, because the
   end of a film is read from its time label. The films themselves are not edited: the rule is added to the film's page here. */
const FILM_CLEAN_CSS = 'html.site-clean .cinema-pill, html.site-clean .review-pill, html.site-clean #hud, html.site-clean #hudMin, html.site-clean .prog-bar { visibility: hidden !important; pointer-events: none !important; } @media (max-width: 520px) { html.site-clean #head { top: 54px !important; } }';  // on a phone the film's corner title sits below the site's buttons
function dressFilm(ifr = filmFrame()) {
  try {
    const d = ifr && ifr.contentDocument; if (!d || !d.head) return;
    if (!d.getElementById('site-clean-css')) { const st = d.createElement('style'); st.id = 'site-clean-css'; st.textContent = FILM_CLEAN_CSS; d.head.appendChild(st); }
    d.documentElement.classList.toggle('site-clean', document.body.classList.contains('clean-hud'));
  } catch {}
}
const landingShell = $('#landingShell');
let filmEndTimer = 0, filmPollTimer = 0, veilFadeTimer = 0;
const prefetchedUrls = new Set();

function prefetchEvent(idx) {
  const ex = EXHIBITIONS[mod(idx, N)];
  if (!ex || prefetchedUrls.has(ex.filmUrl)) return;
  prefetchedUrls.add(ex.filmUrl);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = ex.filmUrl;
  document.head.appendChild(link);
}

function mountFilmIframe(ex) {
  clearInterval(filmPollTimer);
  clearTimeout(filmEndTimer);
  resetFilmMedia();
  filmStage.innerHTML = '';
  filmStage.style.background = ex.filmOpenBg;
  const ifr = document.createElement('iframe');
  ifr.src = ex.filmUrl;
  ifr.title = `${ex.name} — Event Experience`;
  ifr.allow = 'autoplay; fullscreen';
  ifr.style.opacity = '0';
  ifr.style.transition = 'opacity 0.28s ease';

  let revealed = false;
  const showIframe = () => {
    if (revealed || !state.inFilm) return;
    revealed = true;
    ifr.style.opacity = '1';
    fxCanvasEl.style.transition = 'opacity 0.26s ease';
    fxCanvasEl.style.opacity = '0';
    clearTimeout(veilFadeTimer);
    veilFadeTimer = setTimeout(() => {
      fxCtx.clearRect(0, 0, fxCanvasEl.width, fxCanvasEl.height);
      fxCanvasEl.style.transition = '';
      fxCanvasEl.style.opacity = '1';
    }, 280);
  };
  ifr.addEventListener('load', () => { dressFilm(ifr); setTimeout(showIframe, 90); }, { once: true });
  setTimeout(showIframe, 650);

  filmStage.appendChild(ifr);
  filmStage.setAttribute('aria-hidden', 'false');

  const nextIdx = (state.active + 1) % N;
  const nextEx = EXHIBITIONS[nextIdx];
  prefetchEvent(nextIdx);
  filmNext.textContent = `Next: ${nextEx.name} →`;
  filmNav.classList.remove('is-ended');

  // Same-origin live timeline detection (catches both natural finish AND progress-bar scrubbing to end!)
  filmPollTimer = setInterval(() => {
    if (!state.inFilm) return;
    try {
      const doc = ifr.contentDocument;
      if (!doc) return;
      const tl = doc.getElementById('time-lbl');
      const sc = doc.getElementById('scrub');
      let ratio = -1;
      if (tl) {
        const m = tl.textContent.match(/([\d.]+)\s*s?\s*\/\s*([\d.]+)/);
        if (m && parseFloat(m[2]) > 0) ratio = parseFloat(m[1]) / parseFloat(m[2]);
      } else if (sc && parseFloat(sc.max) > 0) {
        ratio = parseFloat(sc.value) / parseFloat(sc.max);
      }
      if (ratio >= 0) filmNav.classList.toggle('is-ended', ratio >= 0.94);
    } catch {}
  }, 350);

  filmEndTimer = setTimeout(() => {
    if (state.inFilm) filmNav.classList.add('is-ended');
  }, Math.round((ex.filmRuntimeSec + 1.2) * 1000));
}

function unmountFilmIframe() {
  clearTimeout(filmEndTimer);
  clearInterval(filmPollTimer);
  clearTimeout(veilFadeTimer);
  resetFilmMedia();
  const ifr = filmStage.querySelector('iframe');
  if (ifr) ifr.src = 'about:blank';
  filmStage.innerHTML = '';
  filmStage.className = 'film-stage';
  filmStage.setAttribute('aria-hidden', 'true');
  filmNav.classList.remove('is-ended');
}

function enterFilm(idx = state.active, slotHint = getCentredSlot()) {
  if (state.inFilm || state.portalAnim) return;
  const exIdx = mod(idx, N);
  if (exIdx !== state.active) goToExhibition(exIdx);
  const ex = EXHIBITIONS[exIdx];
  const slotIdx = (slotHint >= 0 && sheets[slotHint]) ? slotHint : getCentredSlot();
  const s = sheets[slotIdx];
  const corners = s ? projectSheetCorners(s) : [[VW * 0.4, VH * 0.3], [VW * 0.6, VH * 0.3], [VW * 0.6, VH * 0.7], [VW * 0.4, VH * 0.7]];
  const cx = (corners[0][0] + corners[2][0]) * 0.5;
  const cy = (corners[0][1] + corners[2][1]) * 0.5;

  const kind = state.portal;
  document.body.classList.add('is-entering');
  fxCanvasEl.style.transition = '';
  fxCanvasEl.style.opacity = '1';

  // Ensure flipped poster faces front as we enter
  if (s) s.spinTgt = Math.round(s.spinTgt / (Math.PI * 2)) * Math.PI * 2;

  if (kind === 'curtain') {
    filmStage.style.background = ex.filmOpenBg;
    filmStage.classList.add('is-under');
    state.portalAnim = { kind, t0: performance.now(), dur: 0.48, idx: exIdx, slotIdx, cx, cy };
    void landingShell.offsetWidth;
    landingShell.classList.add('is-curtain-lifting');
  } else {
    state.portalAnim = { kind, t0: performance.now(), dur: 0.45, idx: exIdx, slotIdx, cx, cy };
  }
}

let nextSwitching = false;
function goToNextEventFromFilm() {
  if (!state.inFilm || nextSwitching) return;
  nextSwitching = true;
  // Circular inside events (+1 mod N: Iyuana → Herencia Viva → Ayazamana → Iyuana!)
  const nextIdx = (state.active + 1) % N;
  const nextEx = EXHIBITIONS[nextIdx];
  state.active = nextIdx;
  state.target = nextIdx;
  state.p = nextIdx;
  state.tw = null;
  applySheetTargets(performance.now() * 0.001);
  sheets.forEach((s) => s.snap());
  syncExhibitionDOM(true);
  syncUrl();
  siteNav.switched(nextEx.slug);

  // Update Next button label immediately for instant click feedback
  filmNext.textContent = `Next: ${EXHIBITIONS[(nextIdx + 1) % N].name} →`;
  filmNav.classList.remove('is-ended');

  // Smooth veil cross-dissolve into the next event (zero old-WebGL overlap!)
  clearTimeout(veilFadeTimer);
  const bgRgb = hexToRgb(nextEx.filmOpenBg);
  fxCtx.setTransform(1, 0, 0, 1, 0, 0);
  fxCtx.fillStyle = rgbStr(bgRgb, 1);
  fxCtx.fillRect(0, 0, fxCanvasEl.width, fxCanvasEl.height);
  fxCanvasEl.style.transition = 'opacity 0.2s ease';
  fxCanvasEl.style.opacity = '0';
  void fxCanvasEl.offsetWidth;
  fxCanvasEl.style.opacity = '1';

  setTimeout(() => {
    nextSwitching = false;
    if (!state.inFilm) return;
    const oldIfr = filmStage.querySelector('iframe');
    if (oldIfr) oldIfr.src = 'about:blank';
    mountFilmIframe(nextEx);
  }, 190);
}

function returnFromFilm(fromHistory = false) {
  if (!state.inFilm && !state.portalAnim) return;
  siteNav.left(fromHistory === true);
  nextSwitching = false;
  document.body.classList.remove('in-film', 'is-entering');
  state.inFilm = false;
  state.portalAnim = null;
  landingShell.classList.remove('is-curtain-lifting');
  camera.position.set(0, 0, 10);
  fxCanvasEl.style.transition = '';
  fxCanvasEl.style.opacity = '1';
  fxCtx.clearRect(0, 0, fxCanvasEl.width, fxCanvasEl.height);
  unmountFilmIframe();
  startLoop();
}

function renderPortalFX(nowMs) {
  const pa = state.portalAnim;
  if (!pa) return;
  const frozen = params.get('portalPreview');
  const u = frozen !== null ? clamp01(parseFloat(frozen)) : clamp01((nowMs - pa.t0) / 1000 / pa.dur);
  const e = E_GLIDE(u);
  const ex = EXHIBITIONS[pa.idx];
  const bgRgb = hexToRgb(ex.filmOpenBg);
  const W = fxCanvasEl.width, H = fxCanvasEl.height;
  const cx = pa.cx * DPR, cy = pa.cy * DPR;
  const maxR = Math.hypot(W, H) * 1.08;

  fxCtx.save();
  fxCtx.setTransform(1, 0, 0, 1, 0, 0);
  fxCtx.clearRect(0, 0, W, H);

  if (pa.kind === 'threshold') {
    // P1 Crisp Threshold ★: 3D poster straightens & camera glides briskly forward while room melts into event ground
    const s = sheets[pa.slotIdx];
    if (s) {
      const fx = s.cur.x * 0.35, fy = s.cur.y * 0.35;
      camera.position.x = mix(0, fx, e);
      camera.position.y = mix(0, fy, e);
      camera.position.z = mix(10, 4.8, e);
      camera.lookAt(fx, fy, 0);
    }
    const veilA = smooth(0.28, 0.98, u);
    fxCtx.fillStyle = rgbStr(bgRgb, veilA);
    fxCtx.fillRect(0, 0, W, H);
  } else if (pa.kind === 'iris') {
    // P3 Spotlight Dim: Crisp spotlight narrows around poster into event's opening ground
    const rad = mix(maxR * 0.44, 0, Math.pow(e, 1.25));
    fxCtx.fillStyle = rgbStr(bgRgb, mix(0.68, 1.0, e));
    fxCtx.fillRect(0, 0, W, H);
    if (rad > 2) {
      fxCtx.globalCompositeOperation = 'destination-out';
      const g = fxCtx.createRadialGradient(cx, cy, rad * 0.3, cx, cy, rad);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      fxCtx.fillStyle = g;
      fxCtx.beginPath(); fxCtx.arc(cx, cy, rad, 0, Math.PI * 2); fxCtx.fill();
    }
  } else if (pa.kind === 'wash') {
    // P4 Pigment Dissolve: Quick watercolour bloom + smooth ground settle
    const s = sheets[pa.slotIdx];
    if (s) camera.position.z = mix(10, 6.8, e);
    drawWetWashBlob(fxCtx, cx, cy, maxR, e, ex.wash.mid, ex.filmOpenBg, 2.8);
    fxCtx.fillStyle = rgbStr(bgRgb, smooth(0.22, 0.96, u));
    fxCtx.fillRect(0, 0, W, H);
  } else if (pa.kind === 'curtain') {
    // Curtain shell lifts in CSS; hold solid ground at completion for zero-flash iframe mount
    if (u >= 0.92) {
      fxCtx.fillStyle = rgbStr(bgRgb, 1);
      fxCtx.fillRect(0, 0, W, H);
    }
  }

  fxCtx.restore();

  if (u >= 1 && frozen === null) {
    // Hold matching-colour veil on #portal-fx, halt landing WebGL loop (0 GPU contention!), and mount event iframe!
    fxCtx.fillStyle = rgbStr(bgRgb, 1);
    fxCtx.fillRect(0, 0, W, H);
    filmStage.classList.remove('is-under');
    filmStage.classList.add('is-active');
    document.body.classList.add('in-film');
    state.inFilm = true;
    state.portalAnim = null;
    mountFilmIframe(ex);
    siteNav.entered(ex.slug);
  }
}

/* =========================================================================
   3D Archival Portrait Print Builder (Used by About Concept A2)
   ========================================================================= */
function buildPortraitPrintTexture(img) {
  const pad = Math.round(img.width * 0.055);
  const botPad = Math.round(img.width * 0.11);
  const W = img.width + pad * 2;
  const H = img.height + pad + botPad;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f3eee4';
  g.fillRect(0, 0, W, H);
  g.drawImage(img, pad, pad, img.width, img.height);
  g.fillStyle = 'rgba(28, 24, 20, 0.55)';
  g.font = `500 ${Math.round(W * 0.019)}px Switzer, sans-serif`;
  g.fillText('VANESSA ESPÍN · BROOKLYN BRIDGE PARK, NY', pad, H - Math.round(botPad * 0.36));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return { tex, aspect: W / H };
}

/* =========================================================================
   Dark-Gallery About (A1–A8) & Loading Overture (O1–O6) Wiring
   ========================================================================= */
function openAbout(styleId = state.aboutStyle) {
  if (ABOUT_CONCEPTS.some((a) => a.id === styleId)) state.aboutStyle = styleId;
  state.drawerOpen = true;
  document.body.classList.add('about-open');
  siteNav.about(true);
  if (aboutCtrl) aboutCtrl.open(state.aboutStyle);
  buildWorkbench();
  syncUrl();
  startLoop();
}

function closeAbout() {
  state.drawerOpen = false;
  document.body.classList.remove('about-open');
  siteNav.about(false);
  if (aboutCtrl) aboutCtrl.close();
  syncUrl();
  startLoop();
}

/* =========================================================================
   Workbench Switcher & URL Sync
   ========================================================================= */
function syncUrl() {
  const u = new URL(location.href);
  u.searchParams.set('c', state.concept);
  u.searchParams.set('i', String(state.active));
  u.searchParams.set('portal', state.portal);
  u.searchParams.set('about', state.aboutStyle);
  u.searchParams.set('copy', state.copyMode);
  if (state.cueStyle && state.cueStyle !== 's2') u.searchParams.set('cue', state.cueStyle);
  else u.searchParams.delete('cue');
  if (state.introStyle && state.introStyle !== 'o1') u.searchParams.set('intro', state.introStyle);
  else u.searchParams.delete('intro');
  u.searchParams.delete('bio');
  history.replaceState(history.state, '', u);
}

function buildWorkbench() {
  const sp = $('#cuePills');
  if (sp) sp.innerHTML = SCROLL_CUES.map((s) => `
    <button type="button" class="bench__pill" data-cue="${s.id}" title="${s.desc}" aria-pressed="${state.cueStyle === s.id}">${s.label}</button>
  `).join('');
  const cp = $('#conceptPills');
  if (cp) cp.innerHTML = CONCEPTS.map((c) => `
    <button type="button" class="bench__pill" data-c="${c.id}" aria-pressed="${state.concept === c.id}">${c.short}</button>
  `).join('');
  const pp = $('#portalPills');
  if (pp) pp.innerHTML = PORTALS.map((p) => `
    <button type="button" class="bench__pill" data-p="${p.id}" title="${p.desc}" aria-pressed="${state.portal === p.id}">${p.label}</button>
  `).join('');
  const bp = $('#bioPills');
  if (bp) bp.innerHTML = ABOUT_CONCEPTS.map((a) => `
    <button type="button" class="bench__pill" data-a="${a.id}" title="${a.desc}" aria-pressed="${state.aboutStyle === a.id && state.drawerOpen}">${a.label}</button>
  `).join('');
  const ip = $('#introPills');
  if (ip) ip.innerHTML = INTRO_CONCEPTS.map((o) => `
    <button type="button" class="bench__pill" data-o="${o.id}" title="${o.desc}" aria-pressed="${state.introStyle === o.id}">${o.label}</button>
  `).join('');
  const lp = $('#copyPills');
  if (lp) lp.innerHTML = COPY_MODES.map((m) => `
    <button type="button" class="bench__pill" data-copy="${m.id}" title="${m.desc}" aria-pressed="${state.copyMode === m.id}">${m.label}</button>
  `).join('');
}

function setConcept(cid) {
  const found = CONCEPTS.find((c) => c.id === cid);
  if (!found) return;
  state.concept = cid;
  state.portal = found.defaultPortal;
  state.aboutStyle = found.defaultAbout || state.aboutStyle;
  if (aboutCtrl) aboutCtrl.setStyle(state.aboutStyle);
  state.washTrans = { fromIdx: state.active, toIdx: state.active, t0: performance.now(), dur: 0.5, dir: 1 };
  buildWorkbench();
  syncExhibitionDOM(true);
  syncUrl();
}
function setPortal(pid) {
  state.portal = pid;
  buildWorkbench();
  syncUrl();
}
function setAboutStyle(aid) {
  if (!ABOUT_CONCEPTS.some((a) => a.id === aid)) return;
  state.aboutStyle = aid;
  if (aboutCtrl) aboutCtrl.setStyle(aid);
  buildWorkbench();
  syncUrl();
}
function setCopyMode(mid) {
  if (!COPY_MODES.some((m) => m.id === mid)) return;
  state.copyMode = mid;
  buildWorkbench();
  syncExhibitionDOM(true);
  syncUrl();
}
function setCueStyle(sid) {
  if (!SCROLL_CUES.some((s) => s.id === sid)) return;
  state.cueStyle = sid;
  if (scrollCueCtrl) scrollCueCtrl.setCue(sid);
  buildWorkbench();
  syncUrl();
}

$('#bench').addEventListener('click', (e) => {
  const bsc = e.target.closest('[data-cue]');
  if (bsc) setCueStyle(bsc.dataset.cue);
  const bc = e.target.closest('[data-c]');
  if (bc) setConcept(bc.dataset.c);
  const bp = e.target.closest('[data-p]');
  if (bp) setPortal(bp.dataset.p);
  const ba = e.target.closest('[data-a]');
  if (ba) openAbout(ba.dataset.a);
  const bo = e.target.closest('[data-o]');
  if (bo) {
    state.introStyle = bo.dataset.o;
    if (state.drawerOpen) closeAbout();
    buildWorkbench();
    syncUrl();
    if (introCtrl) introCtrl.replay(state.introStyle);
    startLoop();
  }
  const bm = e.target.closest('[data-copy]');
  if (bm) setCopyMode(bm.dataset.copy);
  if (e.target.closest('#benchMinBtn')) $('#bench').classList.toggle('is-min');
});

/* =========================================================================
   Pointer, Wheel, Direct Drag-Over-Poster & Keyboard Input
   ========================================================================= */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const ptr = { x: 0, y: 0, nx: 0, ny: 0, inside: false };
let drag = null;

function hitTestSheets(clientX, clientY) {
  if (!sheets.length) return -1;
  ndc.set((clientX / VW) * 2 - 1, -(clientY / VH) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  let bestIdx = -1, near = Infinity;
  sheets.forEach((s, idx) => {
    if (!s.group.visible || s.cur.o < 0.25) return;
    const hits = raycaster.intersectObject(s.hit, false);
    if (hits.length && hits[0].distance < near) {
      near = hits[0].distance;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

glCanvas.addEventListener('pointerdown', (e) => {
  if (state.inFilm || state.drawerOpen || state.portalAnim) return;
  glCanvas.setPointerCapture(e.pointerId);
  const hitSlot = hitTestSheets(e.clientX, e.clientY);
  drag = {
    id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false,
    hitSlot,
    p0: state.p,
  };
  glCanvas.classList.add('is-dragging');
});

glCanvas.addEventListener('pointermove', (e) => {
  ptr.x = e.clientX; ptr.y = e.clientY;
  ptr.nx = (e.clientX / VW) * 2 - 1; ptr.ny = (e.clientY / VH) * 2 - 1;
  ptr.inside = true;

  if (!drag) {
    if (state.drawerOpen) return;
    const h = hitTestSheets(e.clientX, e.clientY);
    if (h >= 0) prefetchEvent(h % N);
    state.hoveredSlot = h;
    glCanvas.classList.toggle('is-over', h >= 0);
    if (state.concept === 'c4') {
      document.querySelectorAll('[data-trip]').forEach((el) => el.classList.toggle('is-active', +el.dataset.trip === (h >= 0 ? (h % N) : state.active)));
    }
    return;
  }
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (Math.hypot(dx, dy) > 6) drag.moved = true;
  if (!drag.moved) return;

  if (state.concept !== 'c4') {
    state.tw = null;
    state.target = clamp(drag.p0 - dx / (VW * 0.32), -0.18, N - 0.82);
    state.p = state.target;
    if (scrollCueCtrl) scrollCueCtrl.markScrolled();
    const liveEx = clamp(Math.round(state.p), 0, N - 1);
    if (liveEx !== state.active) {
      const prev = state.active;
      state.active = liveEx;
      state.washTrans = { fromIdx: prev, toIdx: liveEx, t0: performance.now(), dur: 0.65, dir: dx < 0 ? 1 : -1 };
      syncExhibitionDOM(false);
    }
  }
});

function finishDrag() {
  if (!drag) return;
  const d = drag; drag = null;
  glCanvas.classList.remove('is-dragging');
  if (!d.moved) {
    if (d.hitSlot >= 0) {
      if (state.concept === 'c4') {
        goToExhibition(d.hitSlot);
        enterFilm(d.hitSlot, d.hitSlot);
      } else if (d.hitSlot === state.active) {
        enterFilm(state.active, d.hitSlot);
      } else {
        goToExhibition(d.hitSlot);
      }
    }
    return;
  }
  if (state.concept !== 'c4') {
    goToExhibition(clamp(Math.round(state.target), 0, N - 1));
  }
}
glCanvas.addEventListener('pointerup', finishDrag);
glCanvas.addEventListener('pointercancel', finishDrag);
glCanvas.addEventListener('pointerleave', () => { ptr.inside = false; state.hoveredSlot = -1; glCanvas.classList.remove('is-over'); });

// Wheel: Linear 3-poster scroll (works right over the poster too!); one notch = one poster (0.51s glide)
let wheelAcc = 0, lastWheel = -1e9, wheelLockedUntil = 0;
addEventListener('wheel', (e) => {
  if (state.inFilm || state.drawerOpen || state.portalAnim || (introCtrl && introCtrl.isActive()) || e.target.closest('.bench, .menu-pop, #aboutStage')) return;
  e.preventDefault();
  const now = performance.now();
  if (now - lastWheel > 160) wheelAcc = 0;
  lastWheel = now;
  if (now < wheelLockedUntil) return;
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  wheelAcc += delta * (e.deltaMode === 1 ? 33 : 1);
  if (Math.abs(wheelAcc) >= 48) {
    const dir = Math.sign(wheelAcc);
    wheelAcc = 0;
    if (stepBy(dir, now)) wheelLockedUntil = now + 410;
  }
}, { passive: false });

// UI Buttons, Top-Right Burger Menu & Keyboard
const menuBtn = $('#menuBtn'), menuPop = $('#menuPop');
function closeMenuPop() {
  if (!menuPop) return;
  menuPop.hidden = true;
  menuBtn?.setAttribute('aria-expanded', 'false');
}

$('#aboutBtn').addEventListener('click', () => {
  closeMenuPop();
  if (state.drawerOpen) closeAbout();
  else openAbout(state.aboutStyle);
});
$('#enterBtn')?.addEventListener('click', () => enterFilm(state.active, getCentredSlot()));
$('#enterBtnMobile')?.addEventListener('click', () => enterFilm(state.active, getCentredSlot()));
$('#bsEnterBtn')?.addEventListener('click', () => enterFilm(state.active, getCentredSlot()));
$('#filmReturn').addEventListener('click', () => returnFromFilm());
$('#filmNext').addEventListener('click', goToNextEventFromFilm);
$('#brandHome').addEventListener('click', (e) => {
  e.preventDefault();
  closeMenuPop();
  if (state.drawerOpen) closeAbout();
  if (state.inFilm) returnFromFilm();
  goToExhibition(0);
});

menuBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = menuPop.hidden;
  if (open && state.drawerOpen) closeAbout();
  menuPop.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-wrap')) closeMenuPop();
  const gt = e.target.closest('[data-goto]');
  if (gt) { closeMenuPop(); goToExhibition(+gt.dataset.goto); }
  const tr = e.target.closest('[data-trip]');
  if (tr) {
    const idx = +tr.dataset.trip;
    if (idx === state.active) enterFilm(idx); else goToExhibition(idx);
  }
  const bs = e.target.closest('[data-bs]');
  if (bs) goToExhibition(+bs.dataset.bs);
});

addEventListener('keydown', (e) => {
  if (e.target?.closest?.('input, textarea')) return;
  if (e.key === 'Escape') {
    if (state.drawerOpen) closeAbout();
    else if (state.inFilm || state.portalAnim) returnFromFilm();
    else if (menuPop && !menuPop.hidden) closeMenuPop();
    return;
  }
  if (false) {
    document.body.classList.toggle('clean-hud');
    dressFilm();
    return;
  }
  if (state.inFilm || state.drawerOpen || state.portalAnim) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stepBy(1); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stepBy(-1); }
  if (e.key === 'Enter') { enterFilm(state.active, getCentredSlot()); }
});

/* =========================================================================
   Main Render Loop (Pauses cleanly on hidden tab or while inside 3D film!)
   ========================================================================= */
let rafId = 0, lastNow = performance.now();

function tick(now) {
  rafId = 0;
  if (document.hidden || (state.inFilm && !state.portalAnim)) return;

  const dt = Math.min(0.05, (now - lastNow) / 1000);
  lastNow = now;
  const nowSec = now * 0.001;

  if (aboutCtrl) aboutCtrl.tick(now, dt);
  if (introCtrl) introCtrl.tick(now, dt);

  if (state.tw) {
    const u = clamp01((now - state.tw.t0) / 1000 / state.tw.dur);
    state.p = mix(state.tw.from, state.tw.to, E_GLIDE(u));
    if (u >= 1) state.tw = null;
  } else {
    state.p += (state.target - state.p) * (reduced ? 1 : 1 - Math.exp(-dt * 8));
  }

  if (scrollCueCtrl) {
    scrollCueCtrl.sync(state.active, state.p);
    if (scrollCueCtrl.tick) scrollCueCtrl.tick(now, dt);
  }

  applySheetTargets(nowSec);
  sheets.forEach((s) => s.update(dt, nowSec));
  if (portraitSheet) portraitSheet.update(dt, nowSec);

  // Subtle camera parallax + optional About camera Z breathe when not running portal Z glide
  if (!state.portalAnim || (state.portalAnim.kind !== 'threshold' && state.portalAnim.kind !== 'wash')) {
    const rm = aboutCtrl ? aboutCtrl.getRoomMode() : null;
    const zTarget = 10 + (rm?.cameraZOffset || 0);
    const tx = ptr.inside && !reduced ? ptr.nx * 0.14 : 0;
    const ty = ptr.inside && !reduced ? -ptr.ny * 0.09 : 0;
    camera.position.x += (tx - camera.position.x) * (1 - Math.exp(-dt * 3.2));
    camera.position.y += (ty - camera.position.y) * (1 - Math.exp(-dt * 3.2));
    camera.position.z += (zTarget - camera.position.z) * (1 - Math.exp(-dt * 5));
    camera.lookAt(0, 0, 0);
  }

  renderBackdrop(now);
  renderer.render(scene, camera);
  updateTapeOverlay();
  if (state.portalAnim) renderPortalFX(now);

  startLoop();
}

function startLoop() {
  if (!rafId && !document.hidden && !(state.inFilm && !state.portalAnim)) {
    lastNow = performance.now();
    rafId = requestAnimationFrame(tick);
  }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) startLoop(); });

/* =========================================================================
   Boot (Mounts Loading Overture Immediately at t = 0!)
   ========================================================================= */
const loadImg = (src) => new Promise((res, rej) => {
  const im = new Image();
  im.decoding = 'async';
  im.onload = () => res(im);
  im.onerror = rej;
  im.src = src;
});

async function boot() {
  resize();
  buildStaticConceptDOM();

  scrollCueCtrl = createScrollCueController({
    EXHIBITIONS,
    SCROLL_CUES,
    getState: () => state,
    goToExhibition: (exIdx) => goToExhibition(exIdx),
    stepBy: (delta) => stepBy(delta),
  });
  scrollCueCtrl.setCue(state.cueStyle);

  aboutCtrl = createAboutController({
    SITE, EXHIBITIONS, BIO, ABOUT_CONCEPTS,
    getState: () => state,
    goToExhibition: (exIdx) => goToExhibition(exIdx),
    enterFilmFromAbout: (exIdx) => {
      closeAbout();
      goToExhibition(exIdx);
      setTimeout(() => enterFilm(exIdx, getCentredSlot()), 60);
    },
    onCloseStateChange: (isOpen) => {
      state.drawerOpen = isOpen;
      document.body.classList.toggle('about-open', isOpen);
      siteNav.about(isOpen);
      buildWorkbench();
      syncUrl();
      startLoop();
    },
  });

  introCtrl = createIntroController({
    SITE, EXHIBITIONS, BIO, INTRO_CONCEPTS,
    getState: () => state,
    requestRender: () => startLoop(),
  });
  introCtrl.startInitial(linkedIdx >= 0 ? 'none' : state.introStyle);

  buildWorkbench();
  syncExhibitionDOM(true);
  startLoop();

  await Promise.race([
    Promise.all([
      document.fonts.load('300 48px Gambetta'),
      document.fonts.load('400 40px Gambetta'),
      document.fonts.load('italic 400 40px Gambetta'),
      document.fonts.load('700 80px Gambetta'),
      document.fonts.load('500 16px Switzer'),
    ]),
    new Promise((r) => setTimeout(r, 1800)),
  ]);

  const [portraitImg, ...imgs] = await Promise.all([
    loadImg('../img/portrait.jpg'),
    ...EXHIBITIONS.map((ex) => loadImg(ex.poster)),
  ]);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const texPairs = EXHIBITIONS.map((ex, i) => {
    const img = imgs[i];
    const aspect = img.width / img.height;
    const front = new THREE.Texture(img);
    front.colorSpace = THREE.SRGBColorSpace;
    front.anisotropy = maxAniso;
    front.minFilter = THREE.LinearMipmapLinearFilter;
    front.needsUpdate = true;
    return { front, aspect };
  });

  // 3-poster linear stage (circularity lives inside events via Next: Iyuana → only!)
  sheets = EXHIBITIONS.map((ex, i) => {
    const { front, aspect } = texPairs[i];
    return new PosterSheet(front, front, aspect, i, i);
  });

  // 7th 3D WebGL Portrait Print for About Concept A2
  const { tex: pTex, aspect: pAspect } = buildPortraitPrintTexture(portraitImg);
  portraitSheet = new PosterSheet(pTex, pTex, pAspect, 99, 1);
  portraitSheet.cur.o = 0;
  portraitSheet.tgt.o = 0;
  portraitSheet.group.visible = false;

  if (params.get('openbio') === '1') {
    openAbout(state.aboutStyle);
  }

  applySheetTargets(0);
  sheets.forEach((s) => s.snap());
  if (portraitSheet) portraitSheet.snap();
  updateCenteredAnchors();

  introCtrl.notifyReady();

  state.ready = true;
  window.__LANDING_READY = true;
  if (location.hash.length > 1) siteNav.apply();   // a link straight to an event, its media, or About

  // Support frozen portal preview for storyboard / contact sheet capture (?portalPreview=0.45)
  if (params.get('portalPreview') !== null) {
    const pv = clamp01(parseFloat(params.get('portalPreview')) || 0.45);
    const slotIdx = getCentredSlot();
    const s = sheets[slotIdx];
    renderer.render(scene, camera);
    const corners = projectSheetCorners(s);
    const cx = (corners[0][0] + corners[2][0]) * 0.5;
    const cy = (corners[0][1] + corners[2][1]) * 0.5;
    state.portalAnim = { kind: state.portal, t0: performance.now() - pv * 900, dur: 0.90, idx: state.active, slotIdx, cx, cy };
  }

  startLoop();
}

boot().catch((err) => console.error('Landing v3 boot error:', err));
