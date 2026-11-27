// HK02 Town Hall corridor (`v5` — Widened `3.92 m` Hall + `3.00 m` Alcove, Blotch-Free Satin-Enamel Joinery,
// Fast Parallel Room Boot, & Interactive `HK02` Striped Peach-Apricot Arch Wallpaper Lab).
// Shared by `layout.html` (the placement tool) and `film.html` (the 60 fps film).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAINT_GLSL } from './paint.js?v=20261125v31';
import { buildTownHallFixtures, attachPosterFrameAccents } from './fixtures.js?v=20261126v71';
import {
  SHARED_OUTSIDE_UNIFORMS,
  OUTSIDE_LIGHT_GLSL,
  OUTSIDE_LIGHT_CEIL_GLSL,
  PROBE_CUBE_GLSL,
  DUMMY_RGBMSQRT,
  onOutsidePlateReady,
  warmOutsideCompositor,
  updateOutsideCompositor,
  runReflBlurPass,
  canUseHalfFloatMips,
  restoreV9Lightmaps,
  disposeOutsideGpuResources,
} from './outside-light.js?v=20261126v71';

export const BASE = new URL('./', import.meta.url).href;
const HI_ART_DIR = '/concepts/herencia/assets/';
const FAST_ART_DIR = BASE + '../baked/art/';
const TEX_DIR = '/herencia-light/tex/';
const BAKED_DIR = BASE + '../baked/';
const ASSET_VER = '?v=20261126v37';
const ROUND1_ART_DIR = '/round1/img/';

export const CATALOG = {
  // 9 Whole Luis Medina Paintings (including the Green Andean landscapes)
  '003': { title: 'Woman in blue headcloth with doves',      px: [2036, 2200], url: HI_ART_DIR + '003.jpg',         fastUrl: FAST_ART_DIR + '003.webp', eyes: true, kind: 'painting', defW: 1.48 },
  '010': { title: 'Woman with fruit-tree hair and macaw',    px: [2054, 2200], url: HI_ART_DIR + '010.jpg',         fastUrl: FAST_ART_DIR + '010.webp', eyes: true, green: true, kind: 'painting', defW: 1.48 },
  '006': { title: 'Red tree with sparrows',                  px: [1939, 2200], url: HI_ART_DIR + '006.jpg',         fastUrl: FAST_ART_DIR + '006.webp', kind: 'painting', defW: 1.45 },
  '085': { title: 'Women in blue shawls',                    px: [2059, 2200], url: HI_ART_DIR + '085.jpg',         fastUrl: FAST_ART_DIR + '085.webp', cloth: true, kind: 'painting', defW: 1.46 },
  '086': { title: 'Flying fish over the field (Encuentro)',  px: [2069, 2200], url: HI_ART_DIR + '086.jpg',         fastUrl: FAST_ART_DIR + '086.webp', kind: 'painting', defW: 1.48 },
  '087': { title: 'Two figures with orange fruit',           px: [2011, 2200], url: HI_ART_DIR + '087.jpg',         fastUrl: FAST_ART_DIR + '087.webp', cloth: true, green: true, kind: 'painting', defW: 1.44 },
  '090': { title: 'Andean Mona Lisa',                        px: [2058, 2200], url: HI_ART_DIR + '090.jpg',         fastUrl: FAST_ART_DIR + '090.webp', green: true, kind: 'painting', defW: 1.48 },
  'site-04-andean-figures':   { title: 'Andean Valley, Lake & Rainbow (Green)', px: [1339, 1600], url: ROUND1_ART_DIR + 'hv-andean.jpg',  fastUrl: FAST_ART_DIR + 'site-04-andean-figures.webp',   green: true, kind: 'painting', defW: 1.34 },
  'site-05-village-painting': { title: 'Green Hillside Village & Butterflies',  px: [1496, 1600], url: ROUND1_ART_DIR + 'hv-village.jpg', fastUrl: FAST_ART_DIR + 'site-05-village-painting.webp', green: true, kind: 'painting', defW: 1.42 },

  // 7 Pure Graphic Herencia Viva Posters (zero event photos)
  '014': { title: 'Poster · LIC Arts Open (Green)',          px: [1760, 2200], url: HI_ART_DIR + '014.jpg',         fastUrl: FAST_ART_DIR + '014.webp', green: true, kind: 'poster', defW: 0.92 },
  '011': { title: 'Poster · Consulate of Ecuador (Green)',   px: [1760, 2200], url: HI_ART_DIR + '011.jpg',         fastUrl: FAST_ART_DIR + '011.webp', green: true, kind: 'poster', defW: 0.92 },
  '015': { title: 'Poster · Threads of Memory (Key Green)',  px: [1760, 2200], url: HI_ART_DIR + '015.jpg',         fastUrl: FAST_ART_DIR + '015.webp', green: true, kind: 'poster', defW: 0.92 },
  '012': { title: 'Poster · Flushing Town Hall (Pink)',      px: [1466, 2200], url: HI_ART_DIR + '012.jpg',         fastUrl: FAST_ART_DIR + '012.webp', kind: 'poster', defW: 0.84 },
  '018': { title: 'Poster · Town Hall Reception (Pink)',     px: [1760, 2200], url: HI_ART_DIR + '018.jpg',         fastUrl: FAST_ART_DIR + '018.webp', kind: 'poster', defW: 0.90 },
  '013': { title: 'Poster · Opening Reception Invitation',   px: [1466, 2200], url: HI_ART_DIR + '013.jpg',         fastUrl: FAST_ART_DIR + '013.webp', kind: 'poster', defW: 0.84 },
  '000': { title: 'Poster · Save the Dates (Three Venues)',  px: [1760, 2200], url: HI_ART_DIR + '000.jpg',         fastUrl: FAST_ART_DIR + '000.webp', kind: 'poster', defW: 0.90 },
};
export const POSTER = {
  url: '/herencia-hallway/assets/poster-ayllu-medina.jpg',
  fastUrl: FAST_ART_DIR + 'poster.webp',
  px: [1080, 1350],
};

export const ARCH_FINISH_MODES = {
  plaster:   0, // Default: clean gallery plaster matching corridor wall grading
  wallpaper: 1, // Optional: `HK02` vertical peach-apricot & cream striped wallpaper + curved arch rim
  fluted:    2, // Softly fluted 3D vertical peach-apricot paneling
  linen:     3, // High-key warm champagne-blush gallery wallpaper stripe
  brick:     4, // Classic terracotta-cream arch course
};

// `version: 9` — Canonical curatorial gallery hang (9 whole Medina canvases + 2 frameless wall posters on unified `1.86 m` centerline,
// matched pair/triptych heights & `46 cm` intra-cluster spacing) + Right-Alcove 1862 Romanesque Bifora Window (`vestRightWindow: true`)!
export const DEFAULT_LAYOUT = {
  version: 9,
  hall: {
    start: 3.70, arch: 20.00, width: 3.44, alcoveWidth: 2.48,
    archSpring: 2.96, archRise: 0.72, ceiling: 4.86, alcoveCeiling: 4.62,
    archFinish: 'plaster', laylights: 0, floorTone: 1.00, vestRightWindow: true,
  },
  entrance: { style: 'G12' },
  doors: [
    { id: 'd1', wall: 'L', s: 12.90, open: 0, swing: 'in', transom: true },
    { id: 'd3', wall: 'R', s: 10.30, open: 0, swing: 'in', transom: true },
    { id: 'd4', wall: 'R', s: 16.28, open: 0, swing: 'in', transom: true },
  ],
  art: [
    // Left Cluster 1: Blue-shawl pair (`h = 1.580 m` matched, `46 cm` gap)
    { id: '085', wall: 'L', s: 8.40,  y: 1.86, w: 1.479 },
    { id: '087', wall: 'L', s: 10.32, y: 1.86, w: 1.444 },
    // Left Cluster 2: Symmetric Andean triptych (`h = 1.380 m` green landscapes flanking `h = 1.689 m` Mona Lisa, `46 cm` gaps, `72 cm` bay margins)
    { id: 'site-04-andean-figures',   wall: 'L', s: 14.91, y: 1.86, w: 1.155 },
    { id: '090',                      wall: 'L', s: 16.74, y: 1.86, w: 1.580 },
    { id: 'site-05-village-painting', wall: 'L', s: 18.64, y: 1.86, w: 1.290 },
    // Right Cluster 1: Frameless printed exhibition posters (`h = 0.780 m` matched, `22 cm` poster gap)
    { id: '000', wall: 'R', s: 7.90,  y: 1.86, w: 0.624 },
    { id: '013', wall: 'R', s: 8.69,  y: 1.86, w: 0.520 },
    // Right Cluster 2: Encuentro & Fruit-Tree Woman pair (`h = 1.580 m` matched, `46 cm` gap, `56.5 cm` symmetric door margins)
    { id: '086', wall: 'R', s: 12.32, y: 1.86, w: 1.486 },
    { id: '010', wall: 'R', s: 14.26, y: 1.86, w: 1.475 },
    // Right Cluster 3: Red Tree (`h = 1.580 m`)
    { id: '006', wall: 'R', s: 18.72, y: 1.86, w: 1.393 },
    // Left Alcove Hero: Woman in blue headcloth with doves (opposite the Right-Alcove Romanesque window)
    { id: '003', wall: 'L', s: 22.02, y: 1.84, w: 1.500 },
  ],
  stand: { s: 8.65, x: 0.44, face: 168 },
  light: { windowSun: 1.0, doorSun: 1.0, laylights: 1.0, exposure: 1.0 },
  cam: {
    start: { s: 9.40,  x: -0.28, h: 1.58, dir: 32.0,  pitch: 1.8,  fov: 53.0 },
    blink: { s: 22.02, x:  0.50, h: 1.60, dir: 270.0, pitch: 1.4,  fov: 56.0 },
    end:   { s: 6.45,  x:  0.08, h: 1.50, dir: 357.5, pitch: 3.5,  fov: 58.0 },
  },
};

export const CLASSIC_HK02_LAYOUT = {
  version: 3,
  hall: { start: 6.0, arch: 17.2, width: 3.24, alcoveWidth: 2.04, ceiling: 3.92, archFinish: 'wallpaper', laylights: 3, floorTone: 1.0, vestRightWindow: false },
  entrance: { style: 'G12' },
  doors: [
    { id: 'd1', wall: 'L', s: 9.45, open: 0, transom: true },
    { id: 'd2', wall: 'L', s: 13.55, open: 0, transom: true },
    { id: 'd3', wall: 'R', s: 11.65, open: 16, transom: true },
  ],
  art: [
    { id: '006', wall: 'R', s: 9.55, y: 1.74, w: 1.46 },
    { id: '086', wall: 'R', s: 13.75, y: 1.74, w: 1.48 },
    { id: '090', wall: 'R', s: 15.75, y: 1.74, w: 1.48 },
    { id: '003', wall: 'L', s: 11.50, y: 1.78, w: 1.46 },
    { id: '010', wall: 'L', s: 15.55, y: 1.78, w: 1.46 },
    { id: '085', wall: 'L', s: 18.95, y: 1.74, w: 1.26 },
    { id: '087', wall: 'R', s: 18.95, y: 1.74, w: 1.26 },
  ],
  stand: { s: 15.25, x: 0.48, face: 166 },
  light: { windowSun: 1.0, doorSun: 1.0, laylights: 1.0, exposure: 1.0 },
  cam: {
    start: { s: 7.50, x: 0.18, h: 1.56, dir: 358, pitch: 0, fov: 47.5 },
    blink: { s: 13.55, x: 0.82, h: 1.62, dir: 270, pitch: 0, fov: 58 },
    end:   { s: 7.50, x: 0.18, h: 1.56, dir: 358, pitch: 0, fov: 47.5 },
  },
};

export function cloneLayout(l) { return JSON.parse(JSON.stringify(l)); }

// Upgrades any pre-v6 saved draft (`version < 6`) in memory to the tall `4.86 m` + narrowed `3.44 m` Town Hall v6 layout,
// while preserving any new `version: 6` edits saved in `layout.html`!
export function upgradeSavedLayoutIfPrePolish(rec) {
  if (!rec || !rec.layout) return cloneLayout(DEFAULT_LAYOUT);
  if ((rec.layout.version || 1) < 9) {
    return cloneLayout(DEFAULT_LAYOUT);
  }
  const merged = cloneLayout(DEFAULT_LAYOUT);
  Object.assign(merged, rec.layout);
  merged.hall = { ...DEFAULT_LAYOUT.hall, ...(rec.layout.hall || {}) };
  if (merged.hall.archFinish === 'wallpaper') merged.hall.archFinish = 'plaster';
  merged.light = { ...DEFAULT_LAYOUT.light, ...(rec.layout.light || {}) };
  merged.cam = {
    start: { ...DEFAULT_LAYOUT.cam.start, ...(rec.layout.cam?.start || {}) },
    blink: { ...DEFAULT_LAYOUT.cam.blink, ...(rec.layout.cam?.blink || {}) },
    end:   { ...DEFAULT_LAYOUT.cam.end,   ...(rec.layout.cam?.end   || {}) },
  };
  return merged;
}

export function dims(L) {
  const HW = L.hall.width / 2, C = L.hall.ceiling, Y0 = L.hall.start, AR = L.hall.arch;
  const VH = (L.hall.alcoveWidth || 2.48) / 2;
  const ARCH_SPR = L.hall.archSpring || 2.96;
  const ARCH_RISE = L.hall.archRise || 0.72;
  const VC = L.hall.alcoveCeiling || Math.min(4.62, C - 0.24);
  return { HW, C, Y0, L: AR, VH, ARCH_SPR, ARCH_RISE, VS0: AR + 0.30, VS1: AR + 3.92, VC, WT: 0.20 };
}
export function artSize(a) {
  const c = CATALOG[a.id]; const w = a.w; return { w, h: w * c.px[1] / c.px[0] };
}
export function wallX(L, wall, s) {
  const D = dims(L); const sg = wall === 'L' ? -1 : 1;
  return sg * (s > D.L ? D.VH : D.HW);
}

// ---------------------------------------------------------------------------
// Split Photometric Tone Mapping (B1 Namespace — scene.js tonemapping_pars_fragment ONLY):
//   - V9 (uTmOutMix <= 0.0005): exact early-out to bit-identical HK02 soft-shoulder curve.
//   - Cycles C02-C05: convex mix(tmPbrNeutralTone, tmAgxRec2020Tone, uTmAgxHybrid) in exact
//     Rec.2020 linear order (AGX_IN -> log2 -> 6th poly -> pow -> Rec.2020 sat -> AGX_OUTSET_2020 -> pow(2.2) -> REC2020_TO_SRGB).
// ---------------------------------------------------------------------------
let toneInstalled = false;
export function installHK02Tone() {
  if (toneInstalled) return;
  toneInstalled = true;
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `uniform float uTmOutMix;
    uniform float uTmAgxHybrid;
    uniform float uTmAgxPow;
    uniform float uTmAgxSat;
    uniform float uTmOutExposure;
    uniform vec3 uTmShadowToe;
    uniform float uTmContrast;

    const mat3 TM_AGX_IN = mat3(
       0.5448147,  0.1404170,  0.0888104,
       0.3737874,  0.7541376,  0.1788717,
       0.0813979,  0.1054455,  0.7323179
    );
    const mat3 TM_AGX_OUTSET_2020 = mat3(
       1.1271006, -0.1413298, -0.1413298,
      -0.1106066,  1.1578237, -0.1106066,
      -0.0164939, -0.0164939,  1.2519364
    );
    const mat3 TM_REC2020_TO_SRGB = mat3(
       1.6604910, -0.1245505, -0.0181507,
      -0.5876411,  1.1328999, -0.1005789,
      -0.0728499, -0.0083494,  1.1187296
    );

    vec3 tmHk02Tone( vec3 x ) {
      vec3 toe = pow(clamp(x / 0.62, 0.0, 1.0), vec3(1.16)) * 0.62;
      vec3 hi  = vec3(0.62) + 0.372 * (vec3(1.0) - exp(-max(x - vec3(0.62), vec3(0.0)) / 0.44));
      return clamp(mix(toe, hi, step(vec3(0.62), x)), 0.0, 1.0);
    }

    vec3 tmPbrNeutralTone( vec3 col ) {
      vec3 c = max(col, vec3(0.0));
      float startCompression = 0.8 - 0.04;
      float desaturation = 0.15;
      float x = min(c.r, min(c.g, c.b));
      float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
      c -= offset;
      float peak = max(c.r, max(c.g, c.b));
      if (peak < startCompression) return clamp(c, 0.0, 1.0);
      float d = 1.0 - startCompression;
      float newPeak = 1.0 - d * d / (peak + d - startCompression);
      c *= newPeak / max(peak, 1e-6);
      float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
      return clamp(mix(c, vec3(newPeak), g), 0.0, 1.0);
    }

    vec3 tmAgxRec2020Tone( vec3 col, float agxPow, float agxSat ) {
      vec3 v = TM_AGX_IN * max(col, vec3(0.0));
      v = clamp((log2(max(v, vec3(1e-10))) + 12.47393) / 16.50000, 0.0, 1.0);
      vec3 x2 = v * v;
      vec3 x4 = x2 * x2;
      v = 15.5 * x4 * x2 - 40.14 * x4 * v + 31.96 * x4 - 6.868 * x2 * v + 0.4298 * x2 + 0.1191 * v - 0.00232;
      v = pow(max(v, vec3(1e-6)), vec3(agxPow));
      float luma = dot(v, vec3(0.2627, 0.6780, 0.0593));
      v = vec3(luma) + agxSat * (v - vec3(luma));
      v = pow(clamp(TM_AGX_OUTSET_2020 * v, 1e-6, 1.0), vec3(2.2));
      return clamp(TM_REC2020_TO_SRGB * v, 0.0, 1.0);
    }

    vec3 CustomToneMapping( vec3 color ) {
      vec3 x = max(color * toneMappingExposure, vec3(0.0));
      if (uTmOutMix <= 0.0005) return tmHk02Tone(x);
      vec3 xOut = x * max(uTmOutExposure, 1e-4);
      float toeW = exp(-dot(xOut, vec3(0.2126, 0.7152, 0.0722)) * 5.5);
      xOut = max(xOut + uTmShadowToe * toeW, vec3(0.0));
      // Cycle 5 §1.4: Filmic Log-Pivot Contrast S-Curve (strictly after uTmOutMix <= 0.0005 early-out -> 0-LSB V9!)
      float cRaw = (uTmContrast > 0.01) ? uTmContrast : 1.0;
      float yIn = max(dot(xOut, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
      float cPow = 1.0 + (max(cRaw, 0.80) - 1.0) / (1.0 + (yIn / 1.15) * (yIn / 1.15));
      float ySh = 0.18 * pow(yIn / 0.18, cPow);
      xOut *= (ySh / yIn);
      float p = (uTmAgxPow > 0.01) ? uTmAgxPow : 1.22;
      float s = (uTmAgxSat > 0.01) ? uTmAgxSat : 1.28;
      vec3 cyc = mix(tmPbrNeutralTone(xOut), tmAgxRec2020Tone(xOut, p, s), clamp(uTmAgxHybrid, 0.0, 1.0));
      return mix(tmHk02Tone(x), cyc, clamp(uTmOutMix, 0.0, 1.0));
    }`
  );
}

const texLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const texCache = new Map();
export const texListeners = new Set();

// B2: Dedicated V9 lightmap loader kept STRICTLY OUT of texCache so idle V9 lightmaps
// can be evicted (-40 MiB) on settled C02-C05 and restored from cached HTMLImageElements in ~2 ms!
function loadV9Lightmap(url) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  const t = new THREE.Texture();
  t.flipY = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 1;
  let resolveReady;
  const ready = new Promise(r => { resolveReady = r; });
  img.onload = () => {
    t.image = img;
    t.needsUpdate = true;
    resolveReady();
    texListeners.forEach(f => f());
  };
  img.onerror = () => { resolveReady(); };
  img.src = url;
  t.userData.ready = ready;
  t.userData._v9Img = img;
  return t;
}

function tex(url, { srgb = true, repeat = false, aniso = 8, flipY = true, mips = true } = {}) {
  const key = `${url}|${srgb}|${repeat}|${flipY}|${mips}`;
  if (texCache.has(key)) return texCache.get(key);
  let resolveReady;
  const ready = new Promise(r => { resolveReady = r; });
  const t = texLoader.load(
    url,
    () => { resolveReady(); texListeners.forEach(f => f()); },
    undefined,
    () => { resolveReady(); }
  );
  t.userData.ready = ready;
  t.flipY = flipY;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.generateMipmaps = mips;
  t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  texCache.set(key, t);
  return t;
}
const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);

function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#fff'; g.filter = 'blur(12px)';
  g.fillRect(24, 24, 80, 80);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}

function brickTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#f5eadc'; g.fillRect(0, 0, 512, 512);
  const sw = 512 / 8;
  for (let k = 0; k < 8; k++) {
    g.fillStyle = '#ebba98';
    g.fillRect(k * sw + 4, 0, sw - 8, 512);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// True-Pigment Museum Canvas & Poster Material:
// Pure file pigment (`eMuseum = vec3(1.004, 1.000, 0.992)`) + subtle 8 mm frame-rabbet top/side micro-shadow,
// `toneMapped: false` so canvases, eye plates, moving-cloth plates, and Vanessa's `015` poster match to 0.000 RGB delta!
// If `mapTex` is still streaming in when the room opens immediately, starts as warm gallery linen (`#f3ede3`) and
// swaps seamlessly on arrival -> instant room boot with 0 black canvas flashes!
export function makeArtMaterial(mapTex, { roughness = 0.88, polygonOffset = false, frameShadow = true, posterMode = 0, onSwap = null } = {}) {
  const isReady = !!(mapTex && mapTex.image);
  const m = new THREE.MeshStandardMaterial({
    map: isReady ? mapTex : null,
    color: isReady ? 0xffffff : lin(0.92, 0.89, 0.84),
    roughness, metalness: 0.0, envMapIntensity: 0.0, toneMapped: false,
    polygonOffset, polygonOffsetFactor: polygonOffset ? -2 : 0, polygonOffsetUnits: polygonOffset ? -2 : 0,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFrameSh = { value: frameShadow ? 1.0 : 0.0 };
    sh.uniforms.uPosterMode = { value: posterMode };
    Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vArtW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvArtW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform sampler2D tLeafCookie;\nuniform float uFrameSh;\nuniform float uPosterMode;\nvarying vec3 vArtW;\n${OUTSIDE_LIGHT_GLSL}`)
      .replace(
        '#include <opaque_fragment>',
        `{
          vec3 eMuseum = vec3(1.004, 1.000, 0.992);
          float sFr = 1.0;
          #ifdef USE_MAP
            float dTop  = (1.0 - vMapUv.y);
            float dSide = min(vMapUv.x, 1.0 - vMapUv.x);
            sFr = mix(1.0, (1.0 - 0.10 * exp(-dTop / 0.015)) * (1.0 - 0.045 * exp(-dSide / 0.012)), uFrameSh);
          #endif
          if (dot(uOutWeights, vec4(1.0)) <= 0.0005 && uArtPop <= 0.0005) {
            outgoingLight = clamp(diffuseColor.rgb * eMuseum * sFr, 0.0, 1.0);
          } else {
            outgoingLight = evalOutsideArtColor(diffuseColor.rgb * eMuseum * sFr, vArtW, uPosterMode, tLeafCookie);
          }
        }
        #include <opaque_fragment>`
      );
  };
  if (mapTex && !isReady && mapTex.userData?.ready) {
    mapTex.userData.ready.then(() => {
      if (!mapTex.image) return;
      if (onSwap) onSwap(mapTex, m);
      else {
        m.map = mapTex;
        m.color.setHex(0xffffff);
        m.needsUpdate = true;
      }
    });
  }
  return m;
}

// 6x4 Sprite-Strip Living Painting Material (for `085` & `087` moving blue cloths from the GitHub version!)
export function makeStripArtMaterial(stripTex) {
  const cellU = { value: new THREE.Vector2(0, 0) };
  const m = new THREE.MeshBasicMaterial({
    map: stripTex, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  m.userData.uStripCell = cellU;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uStripCell = cellU;
    Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vArtW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvArtW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform sampler2D tLeafCookie;\nuniform vec2 uStripCell;\nvarying vec3 vArtW;\n${OUTSIDE_LIGHT_GLSL}`)
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec2 cUv = vec2(
            (uStripCell.x + clamp(vMapUv.x, 0.0025, 0.9975)) / 6.0,
            (3.0 - uStripCell.y + clamp(vMapUv.y, 0.0025, 0.9975)) / 4.0
          );
          diffuseColor *= texture2D(map, cUv);
        #endif`
      )
      .replace(
        '#include <opaque_fragment>',
        `if (dot(uOutWeights, vec4(1.0)) <= 0.0005 && uArtPop <= 0.0005) {
          diffuseColor.rgb = clamp(diffuseColor.rgb * vec3(1.004, 1.000, 0.992), 0.0, 1.0);
        } else {
          diffuseColor.rgb = evalOutsideArtColor(diffuseColor.rgb * vec3(1.004, 1.000, 0.992), vArtW, 0.0, tLeafCookie);
        }
        #include <opaque_fragment>`
      );
  };
  return m;
}

function approxEq(a, b, tol = 0.045) { return Math.abs((+a || 0) - (+b || 0)) <= tol; }

export function matchesBakedMeta(L, meta) {
  if (!L || !meta || !meta.hall) return false;
  const H = L.hall, MH = meta.hall;
  if (!approxEq(H.start, MH.start) || !approxEq(H.arch, MH.arch) || !approxEq(H.width, MH.width) || !approxEq(H.ceiling, MH.ceiling)) return false;
  if (!approxEq(H.alcoveWidth || 3.00, MH.alcoveWidth || 3.00)) return false;
  if ((H.laylights | 0) !== (MH.laylights | 0)) return false;
  if (!!H.vestRightWindow !== !!MH.vestRightWindow) return false;
  if ((L.entrance?.style || 'G12') !== (meta.entrance?.style || 'G12')) return false;
  const ds = [...(L.doors || [])].sort((a, b) => a.s - b.s);
  const ms = [...(meta.doors || [])].sort((a, b) => a.s - b.s);
  if (ds.length !== ms.length) return false;
  for (let i = 0; i < ds.length; i++) {
    if (ds[i].wall !== ms[i].wall || !approxEq(ds[i].s, ms[i].s, 0.06) || !approxEq(ds[i].open || 0, ms[i].open || 0, 2.2)) return false;
    if ((ds[i].swing || 'in') !== (ms[i].swing || 'in')) return false;
  }
  if (meta.stand && L.stand) {
    if (!approxEq(L.stand.s, meta.stand.s, 0.16) || !approxEq(L.stand.x, meta.stand.x, 0.16)) return false;
  }
  return true;
}

// Splits a BufferGeometry cleanly across horizontal world-Y planes (`[3.580, 3.618, 3.662, 3.918]`) so
// our GPU vertex height stretch (`uExtraH`) elongates ONLY the smooth upper plaster spandrel & frieze
// with 0.000 mm UV shift on paintings, baked frame shadows, doors, or circular spoke windows!
function splitGeometryAtYPlanes(geo, yPlanes) {
  const src = geo.index ? geo.toNonIndexed() : geo;
  const posA = src.attributes.position.array;
  const norA = src.attributes.normal.array;
  const uvA  = src.attributes.uv ? src.attributes.uv.array : null;
  const nVerts = posA.length / 3;
  let tris = [];
  for (let i = 0; i < nVerts; i += 3) {
    const mk = k => ({
      px: posA[(i + k) * 3], py: posA[(i + k) * 3 + 1], pz: posA[(i + k) * 3 + 2],
      nx: norA[(i + k) * 3], ny: norA[(i + k) * 3 + 1], nz: norA[(i + k) * 3 + 2],
      u: uvA ? uvA[(i + k) * 2] : 0, v: uvA ? uvA[(i + k) * 2 + 1] : 0,
    });
    tris.push([mk(0), mk(1), mk(2)]);
  }
  const lerpV = (a, b, t) => {
    const nx = a.nx + (b.nx - a.nx) * t, ny = a.ny + (b.ny - a.ny) * t, nz = a.nz + (b.nz - a.nz) * t;
    const nl = Math.hypot(nx, ny, nz) || 1;
    return {
      px: a.px + (b.px - a.px) * t, py: a.py + (b.py - a.py) * t, pz: a.pz + (b.pz - a.pz) * t,
      nx: nx / nl, ny: ny / nl, nz: nz / nl,
      u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t,
    };
  };
  const clipHalf = (poly, yp, keepAbove) => {
    const out = [];
    const inside = p => keepAbove ? (p.py >= yp - 1e-6) : (p.py <= yp + 1e-6);
    for (let i = 0; i < poly.length; i++) {
      const cur = poly[i], prv = poly[(i + poly.length - 1) % poly.length];
      const inC = inside(cur), inP = inside(prv);
      if (inC !== inP) {
        const denom = cur.py - prv.py;
        const t = Math.abs(denom) > 1e-8 ? Math.max(0, Math.min(1, (yp - prv.py) / denom)) : 0.5;
        const hit = lerpV(prv, cur, t);
        hit.py = yp;
        out.push(hit);
      }
      if (inC) out.push(cur);
    }
    return out;
  };
  for (const yp of yPlanes) {
    const next = [];
    for (const tri of tris) {
      const yMin = Math.min(tri[0].py, tri[1].py, tri[2].py);
      const yMax = Math.max(tri[0].py, tri[1].py, tri[2].py);
      if (yMax <= yp + 1e-5 || yMin >= yp - 1e-5) { next.push(tri); continue; }
      for (const keepAbove of [false, true]) {
        const poly = clipHalf(tri, yp, keepAbove);
        for (let k = 1; k + 1 < poly.length; k++) next.push([poly[0], poly[k], poly[k + 1]]);
      }
    }
    tris = next;
  }
  const nOut = tris.length * 3;
  const pOut = new Float32Array(nOut * 3);
  const nrmOut = new Float32Array(nOut * 3);
  const uOut = uvA ? new Float32Array(nOut * 2) : null;
  let w = 0;
  for (const tri of tris) {
    for (let k = 0; k < 3; k++, w++) {
      const v = tri[k];
      pOut[w * 3] = v.px; pOut[w * 3 + 1] = v.py; pOut[w * 3 + 2] = v.pz;
      nrmOut[w * 3] = v.nx; nrmOut[w * 3 + 1] = v.ny; nrmOut[w * 3 + 2] = v.nz;
      if (uOut) { uOut[w * 2] = v.u; uOut[w * 2 + 1] = v.v; }
    }
  }
  const outGeo = new THREE.BufferGeometry();
  outGeo.setAttribute('position', new THREE.BufferAttribute(pOut, 3));
  outGeo.setAttribute('normal', new THREE.BufferAttribute(nrmOut, 3));
  if (uOut) outGeo.setAttribute('uv', new THREE.BufferAttribute(uOut, 2));
  return outGeo;
}

// Builds a fast barycentric UV sampler on `room_walls` so narrowed-window plaster infill in `mocks.js`
// samples the exact adjacent `walls.webp` UV island with 0.000 seam!
function buildWallUVSampler(wallGeo, halfW) {
  const g = wallGeo.index ? wallGeo.toNonIndexed() : wallGeo;
  const p = g.attributes.position?.array;
  const n = g.attributes.normal?.array;
  const uv = g.attributes.uv?.array;
  if (!p || !n || !uv) return () => [0.5, 0.5];
  const wallTris = { '-1': [], '1': [] };
  for (let i = 0; i < p.length / 3; i += 3) {
    const x0 = p[i * 3], nx0 = n[i * 3];
    for (const sg of [-1, 1]) {
      if (Math.abs(x0 - sg * halfW) < 0.045 && nx0 * sg < -0.7) {
        wallTris[String(sg)].push({
          s0: -p[i * 3 + 2], y0: p[i * 3 + 1], u0: uv[i * 2], v0: uv[i * 2 + 1],
          s1: -p[(i + 1) * 3 + 2], y1: p[(i + 1) * 3 + 1], u1: uv[(i + 1) * 2], v1: uv[(i + 1) * 2 + 1],
          s2: -p[(i + 2) * 3 + 2], y2: p[(i + 2) * 3 + 1], u2: uv[(i + 2) * 2], v2: uv[(i + 2) * 2 + 1],
        });
      }
    }
  }
  return (wallSign, sQ, yRaw) => {
    const list = wallTris[wallSign < 0 ? '-1' : '1'] || [];
    let yQ = Math.max(0.292, Math.min(3.565, yRaw));
    if (wallSign < 0 && yQ > 0.936 && yQ < 0.979) yQ = yQ < 0.958 ? 0.934 : 0.982;
    let best = null, bestErr = 1e9;
    for (const t of list) {
      const det = (t.y1 - t.y2) * (t.s0 - t.s2) + (t.s2 - t.s1) * (t.y0 - t.y2);
      if (Math.abs(det) < 1e-8) continue;
      const w0 = ((t.y1 - t.y2) * (sQ - t.s2) + (t.s2 - t.s1) * (yQ - t.y2)) / det;
      const w1 = ((t.y2 - t.y0) * (sQ - t.s2) + (t.s0 - t.s2) * (yQ - t.y2)) / det;
      const w2 = 1.0 - w0 - w1;
      const minW = Math.min(w0, w1, w2);
      if (minW >= -1e-4) return [w0 * t.u0 + w1 * t.u1 + w2 * t.u2, w0 * t.v0 + w1 * t.v1 + w2 * t.v2];
      const cx = (t.s0 + t.s1 + t.s2) / 3, cy = (t.y0 + t.y1 + t.y2) / 3;
      const err = Math.hypot(sQ - cx, yQ - cy) - minW * 0.25;
      if (err < bestErr) {
        bestErr = err;
        const c0 = Math.max(0, w0), c1 = Math.max(0, w1), c2 = Math.max(0, w2), cs = (c0 + c1 + c2) || 1;
        best = [(c0 * t.u0 + c1 * t.u1 + c2 * t.u2) / cs, (c0 * t.v0 + c1 * t.v1 + c2 * t.v2) / cs];
      }
    }
    return best || [0.5, 0.5];
  };
}

// Warm Sunlit HK02 Gallery PMREM Environment (< 1.5 ms boot, 0 KB wire)
function buildHK02EnvScene() {
  const s = new THREE.Scene();
  s.background = lin(0.95, 0.93, 0.89);
  const mk = (w, h, d, x, y, z, r, g, b) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color: lin(r, g, b), side: THREE.BackSide })
    );
    m.position.set(x, y, z);
    return m;
  };
  s.add(mk(4.0, 4.0, 18.0, 0, 2.0, 0, 1.05, 1.01, 0.95));
  const pl = (w, h, x, y, z, rx, ry, r, g, b) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: lin(r, g, b), side: THREE.DoubleSide })
    );
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    return m;
  };
  s.add(pl(4.0, 18.0, 0, 0.02, 0, -Math.PI / 2, 0, 0.72, 0.52, 0.33));
  s.add(pl(2.2, 2.8, 0, 1.9, -8.8, 0, 0, 2.8, 2.75, 2.65));
  s.add(pl(2.0, 2.6, 0, 1.8,  8.8, 0, 0, 1.6, 1.50, 1.32));
  s.add(pl(0.62, 14.0, -1.36, 3.96, 0, Math.PI / 2, 0, 2.6, 2.62, 2.68));
  s.add(pl(0.62, 14.0,  1.36, 3.96, 0, Math.PI / 2, 0, 2.6, 2.62, 2.68));
  return s;
}

// ---------------------------------------------------------------------------
// The Hall (Hybrid Cycles-Baked `HK02` + Live Fallback)
// ---------------------------------------------------------------------------
export class HK02Hall {
  constructor(renderer, opts = {}) {
    this.renderer = renderer;
    this.opts = opts;
    this.paintU = opts.paintUniforms || null;
    this.isUsingBaked = false;
    this.useFastArt = opts.useFastArt !== false;
    this._uploadQueue = [];
    this._uploading = false;

    installHK02Tone();
    renderer.toneMapping = THREE.CustomToneMapping;
    renderer.toneMappingExposure = 1.00;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    RectAreaLightUniformsLib.init();

    this.scene = new THREE.Scene();
    this.scene.background = lin(0.94, 0.96, 0.99);
    const pm = new THREE.PMREMGenerator(renderer);
    const envScene = buildHK02EnvScene();
    this.scene.environment = pm.fromScene(envScene, 0.035).texture;
    this.scene.environmentIntensity = 0.42;
    pm.dispose();

    this.dyn = new THREE.Group();
    this.scene.add(this.dyn);
    this.artGroup = new THREE.Group();
    this.scene.add(this.artGroup);
    this.artMeshes = {};

    this.wallU = { uCeilH: { value: 4.02 } };
    this.M = this.makeMaterials();

    // 4x MSAA half-float mipmapped planar room reflection (`reflRT` 512x288 + aniso 4: 120 MiB VRAM budget + 60fps Retina + 2D grazing stability!)
    this.reflCam = new THREE.PerspectiveCamera();
    this.reflRT = new THREE.WebGLRenderTarget(512, 288, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: true,
      samples: 4,
    });
    this.reflRT.texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    this.reflMatrix = new THREE.Matrix4();
    this.reflDirty = true;
    this._noReflMeshes = [];
    this._reflDampMats = [];
    this._v9RefMats = new Set();
    this._lastCamPos = new THREE.Vector3(1e9, 1e9, 1e9);
    this._lastCamQuat = new THREE.Quaternion();
    this._lastCamFov = -1;
    this._dynActorsActive = false;
    this._cyclesAntiTwitchOn = false;
    this.reflBlurH = null;
    this.reflBlurV = null;
    this._bakedLights = null;
    this._reflBgDark = lin(0.06, 0.06, 0.07);
    this._sz = new THREE.Vector2();
    this._fwd = new THREE.Vector3();
    this._up = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._plane = new THREE.Plane();
    this._cp = new THREE.Vector4();
    this._q = new THREE.Vector4();

    // Load tiny ~45 KB standalone `w01_easel.glb` + parallel room assets at millisecond 0!
    this.kit = null;
    this.easelKit = null;
    this.easelReady = gltfLoader.loadAsync(BASE + '../models/w01_easel.glb' + ASSET_VER)
      .then(g => { this.easelKit = g.scene; })
      .catch(() => null);
    this.kitReady = null;
    this.bakedReady = this.opts.forceLive ? Promise.resolve(null) : this.loadBakedPack();
    onOutsidePlateReady(() => this.markReflDirty());
  }

  ensureFullKit() {
    if (!this.kitReady) {
      this.kitReady = gltfLoader.loadAsync(BASE + '../models/hk02_kit.glb').then(g => { this.kit = g.scene; return this.kit; });
    }
    return this.kitReady;
  }

  markReflDirty() {
    this.reflDirty = true;
  }

  setDynActorsActive(active) {
    this._dynActorsActive = !!active;
  }

  registerV9RefMaterial(mat) {
    if (mat) this._v9RefMats.add(mat);
  }

  // B2: Auto-bind SHARED_OUTSIDE_UNIFORMS on all toneMapped !== false non-ShaderMaterial meshes (birds, leaves, props)
  // so CustomToneMapping never defaults uTmOutMix = 0.0 without touching film.html:718-1075!
  bindSceneToneUniforms() {
    this.scene.traverse(o => {
      if (!o.isMesh || !o.material) return;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) {
        if (!m || m.isShaderMaterial || m.toneMapped === false) continue;
        if (m.userData?._toneUniformsBound) continue;
        m.userData = m.userData || {};
        m.userData._toneUniformsBound = true;
        const prevOBC = m.onBeforeCompile;
        const prevKey = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
        m.onBeforeCompile = (sh, renderer) => {
          if (prevOBC) prevOBC.call(m, sh, renderer);
          Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
        };
        m.customProgramCacheKey = () => prevKey + '|tone';
        m.needsUpdate = true;
      }
    });
  }

  ensureReflBlurTargets() {
    if (!this.reflRT || !this.renderer) return;
    const bw = Math.max(128, this.reflRT.width >> 1);
    const bh = Math.max(72, this.reflRT.height >> 1);
    if (this.reflBlurH && this.reflBlurV && this.reflBlurH.width === bw && this.reflBlurH.height === bh) {
      return;
    }
    // Rebind uRefl to raw reflRT BEFORE disposing mismatched blur RTs!
    if (this.bakedU?.uRefl) this.bakedU.uRefl.value = this.reflRT.texture;
    if (this.bakedFloorMat?.uniforms?.uRefl) this.bakedFloorMat.uniforms.uRefl.value = this.reflRT.texture;
    if (this.reflBlurH) { this.reflBlurH.dispose(); this.reflBlurH = null; }
    if (this.reflBlurV) { this.reflBlurV.dispose(); this.reflBlurV = null; }
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const hRT = new THREE.WebGLRenderTarget(bw, bh, {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: false,
      stencilBuffer: false,
      samples: 0,
    });
    hRT.texture.colorSpace = THREE.NoColorSpace;
    hRT.texture.premultiplyAlpha = false;
    hRT.texture.flipY = false;
    hRT.texture.wrapS = THREE.ClampToEdgeWrapping;
    hRT.texture.wrapT = THREE.ClampToEdgeWrapping;
    hRT.viewport.set(0, 0, bw, bh);
    hRT.scissor.set(0, 0, bw, bh);
    hRT.scissorTest = false;

    const vRT = new THREE.WebGLRenderTarget(bw, bh, {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: true,
      depthBuffer: false,
      stencilBuffer: false,
      samples: 0,
    });
    vRT.texture.colorSpace = THREE.NoColorSpace;
    vRT.texture.premultiplyAlpha = false;
    vRT.texture.flipY = false;
    vRT.texture.wrapS = THREE.ClampToEdgeWrapping;
    vRT.texture.wrapT = THREE.ClampToEdgeWrapping;
    vRT.texture.anisotropy = Math.min(4, maxAniso);
    vRT.viewport.set(0, 0, bw, bh);
    vRT.scissor.set(0, 0, bw, bh);
    vRT.scissorTest = false;

    this.reflBlurH = hRT;
    this.reflBlurV = vRT;
    if (this._cyclesAntiTwitchOn) {
      if (this.bakedU?.uRefl) this.bakedU.uRefl.value = vRT.texture;
      if (this.bakedFloorMat?.uniforms?.uRefl) this.bakedFloorMat.uniforms.uRefl.value = vRT.texture;
      SHARED_OUTSIDE_UNIFORMS.uReflBlurred.value = 1.0;
    }
  }

  // B1/B3/B4: Lazily enable/revert tStripRgh/tWoodRgh mipmaps & reflBlurH/V strictly AFTER V9 eviction and BEFORE V9 restore!
  setCyclesAntiTwitchExtras(enabled) {
    const on = !!enabled && canUseHalfFloatMips(this.renderer);
    const setRoughMips = (t, wantOn) => {
      if (!t || !t.image || (t.image.width || 0) <= 1) return;
      const wantMin = wantOn ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      const wantAniso = wantOn ? Math.min(8, this.renderer.capabilities.getMaxAnisotropy()) : 1;
      if (t.generateMipmaps === wantOn && t.minFilter === wantMin && t.anisotropy === wantAniso) return;
      t.generateMipmaps = wantOn;
      t.minFilter = wantMin;
      t.anisotropy = wantAniso;
      t.needsUpdate = true;
      try { this.renderer.initTexture(t); } catch {}
    };

    if (!on) {
      this._cyclesAntiTwitchOn = false;
      const rawRefl = this.reflRT ? this.reflRT.texture : null;
      if (this.bakedU?.uRefl) this.bakedU.uRefl.value = rawRefl;
      if (this.bakedFloorMat?.uniforms?.uRefl) this.bakedFloorMat.uniforms.uRefl.value = rawRefl;
      SHARED_OUTSIDE_UNIFORMS.uReflBlurred.value = 0.0;
      if (this.reflBlurH) { this.reflBlurH.dispose(); this.reflBlurH = null; }
      if (this.reflBlurV) { this.reflBlurV.dispose(); this.reflBlurV = null; }
      setRoughMips(this.bakedPack?.tStripR, false);
      setRoughMips(this.bakedFloorMat?.uniforms?.tWoodRgh?.value, false);
      this.reflDirty = true;
      return;
    }

    this._cyclesAntiTwitchOn = true;
    setRoughMips(this.bakedPack?.tStripR, true);
    setRoughMips(this.bakedFloorMat?.uniforms?.tWoodRgh?.value, true);
    this.ensureReflBlurTargets();
    if (this.reflBlurV) {
      if (this.bakedU?.uRefl) this.bakedU.uRefl.value = this.reflBlurV.texture;
      if (this.bakedFloorMat?.uniforms?.uRefl) this.bakedFloorMat.uniforms.uRefl.value = this.reflBlurV.texture;
      SHARED_OUTSIDE_UNIFORMS.uReflBlurred.value = 1.0;
    }
    this.reflDirty = true;
  }

  // Rebuilds flat cached lists of `userData.noRefl` overlay/decal meshes and sub-pixel metallic/HDR-bulb materials
  // ONCE on scene/overlay build (never traversing per-frame!) so `reflRT` never Z-fights or flickers on brass doorknobs!
  rebuildReflCaches() {
    this.bindSceneToneUniforms();
    const noRefl = [];
    const matSet = new Set();
    const dampMats = [];
    this.scene.traverse(o => {
      if (o.userData && o.userData.noRefl) noRefl.push(o);
      if (o.isMesh && o.material) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) {
          if (!m || matSet.has(m)) continue;
          matSet.add(m);
          if (m.isMeshStandardMaterial && (m.metalness > 0.5 || (m.toneMapped === false && m.emissiveIntensity > 0.35))) {
            dampMats.push({ mat: m, isBrass: m.metalness > 0.5, origM: 0, origR: 0, origEnv: 0, origEm: 0 });
          }
        }
      }
    });
    this._noReflMeshes = noRefl;
    this._reflDampMats = dampMats;
    this.reflDirty = true;
  }

  // Background 1-per-rAF GPU texture uploader for progressive canvases -> 0 frame spikes & instant boot!
  queueArtSwap(mapTex, mat) {
    this._uploadQueue.push({ mapTex, mat });
    if (this._uploading) return;
    this._uploading = true;
    const step = () => {
      const job = this._uploadQueue.shift();
      if (!job) { this._uploading = false; return; }
      if (job.mapTex.image) {
        this.renderer.initTexture(job.mapTex);
        job.mat.map = job.mapTex;
        job.mat.color.setHex(0xffffff);
        job.mat.needsUpdate = true;
        this.reflDirty = true;
      }
      if (this._uploadQueue.length) requestAnimationFrame(step);
      else this._uploading = false;
    };
    requestAnimationFrame(step);
  }

  // Optional helper for headless capture scripts that want to await every painting before snapping a still!
  async warmTexturesStaggered() {
    const nextRaf = () => new Promise(r => requestAnimationFrame(r));
    const list = Array.from(texCache.values());
    await Promise.all(list.map(t => t.userData?.ready || Promise.resolve()));
    while (this._uploading || this._uploadQueue.length) await nextRaf();
    for (const t of list) {
      if (t && !t.userData?._evicted && t.image) this.renderer.initTexture(t);
    }
    if (this.bakedPack && !this.bakedPack._v9Evicted) {
      for (const k of ['tWalls', 'tCeil', 'tFloor', 'tWallsF', 'tCeilF', 'tFloorF']) {
        const vt = this.bakedPack[k];
        if (vt && !vt.userData?._evicted && vt.image) this.renderer.initTexture(vt);
      }
    }
    this.reflDirty = true;
  }

  // Warms BOTH the `reflRT` (`HalfFloat` / `srgb-linear`) AND main canvas (`srgb`) shader variants across ALL scene meshes
  // (including frustum-culled corridor/easel/bird/patch meshes) inside a 1x1 scissor BEFORE `#loading` is removed -> 0 crane freezes!
  warmAllRenderPaths(camera, extraHidden = []) {
    this.rebuildReflCaches();
    // H1: Pre-warm single fullscreen OutsideLerpCompositor shader once onto disposable 1x1 RT (0 mid-walk recompiles!):
    warmOutsideCompositor(this.renderer);
    const r = this.renderer;
    const saved = [];
    const hiddenSet = new Set(extraHidden.filter(Boolean));
    if (this.outsideOpticsGroup) hiddenSet.add(this.outsideOpticsGroup);
    if (this.entFloorCycles) hiddenSet.add(this.entFloorCycles);
    if (this.entThresholdStrip) hiddenSet.add(this.entThresholdStrip);
    this.scene.traverse(o => {
      if (o.isMesh || hiddenSet.has(o)) {
        saved.push({ o, fc: o.frustumCulled, vis: o.visible });
        o.frustumCulled = false;
        if (hiddenSet.has(o)) o.visible = true;
      }
    });
    r.setScissorTest(true);
    r.setScissor(0, 0, 1, 1);
    this.reflDirty = true;
    this._warmingPaths = true;
    try {
      this.render(camera);
    } finally {
      this._warmingPaths = false;
      r.setScissorTest(false);
      for (const s of saved) {
        s.o.frustumCulled = s.fc;
        s.o.visible = s.vis;
      }
    }
    this.reflDirty = true;
  }

  async loadBakedPack() {
    try {
      const BV = ASSET_VER;
      const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      // Fire `meta.json`, `room.glb`, and all room lightmap + Town Hall narrow strip floor WebPs 100% IN PARALLEL:
      // B2: Load the 6 V9 lightmaps outside texCache so settled C02-C05 can evict them (-40 MiB) cleanly!
      const metaP   = fetch(BAKED_DIR + 'meta.json' + BV, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null);
      const gltfP   = gltfLoader.loadAsync(BAKED_DIR + 'room.glb' + BV);
      const tWalls  = loadV9Lightmap(BAKED_DIR + 'walls.webp' + BV);
      const tCeil   = loadV9Lightmap(BAKED_DIR + 'ceiling.webp' + BV);
      const tFloor  = loadV9Lightmap(BAKED_DIR + 'floor.webp' + BV);
      const tWallsF = loadV9Lightmap(BAKED_DIR + 'walls_fix.webp' + BV);
      const tCeilF  = loadV9Lightmap(BAKED_DIR + 'ceiling_fix.webp' + BV);
      const tFloorF = loadV9Lightmap(BAKED_DIR + 'floor_fix.webp' + BV);
      const tStripD = tex(BAKED_DIR + 'townhall_strip_diff.webp' + BV, { srgb: true,  repeat: true, mips: true,  aniso: maxAniso });
      const tStripN = tex(BAKED_DIR + 'townhall_strip_nor.webp' + BV,  { srgb: false, repeat: true, mips: true,  aniso: maxAniso });
      const tStripR = tex(BAKED_DIR + 'townhall_strip_rgh.webp' + BV,  { srgb: false, repeat: true, mips: false, aniso: 1 });
      const tWood   = tex(BAKED_DIR + 'wood.webp' + BV,                { srgb: true,  repeat: true, mips: true,  aniso: 4 });
      const tWoodN  = tex(BAKED_DIR + 'wood_nor.webp' + BV,            { srgb: false, repeat: true, mips: true,  aniso: 4 });
      const tWallN  = tex(BAKED_DIR + 'wall_nor.webp' + BV,            { srgb: false, repeat: true, mips: true,  aniso: maxAniso });

      const [meta, gltf] = await Promise.all([
        metaP, gltfP,
        tWalls.userData.ready, tCeil.userData.ready, tFloor.userData.ready,
        tWallsF.userData.ready, tCeilF.userData.ready, tFloorF.userData.ready,
        tStripD.userData.ready, tStripN.userData.ready, tStripR.userData.ready,
        tWood.userData.ready, tWoodN.userData.ready, tWallN.userData.ready,
      ]);
      if (!meta || !gltf) return null;

      const halfW = ((meta.hall && meta.hall.width) || 3.44) * 0.5;
      const isV6 = (meta.version || 1) >= 6;
      const splitPlanes = isV6 ? [4.180, 4.338, 4.394, 4.460, 4.673] : [3.580, 3.618, 3.662, 3.918];
      let foundCornerAO = false;
      gltf.scene.traverse(o => {
        if (!o.isMesh || !o.geometry) return;
        if (o.name === 'room_walls') {
          this.sampleWallUV = buildWallUVSampler(o.geometry, halfW);
          o.geometry = splitGeometryAtYPlanes(o.geometry, splitPlanes);
        } else if (o.name === 'room_props' || o.name === 'room_doors' || o.name === 'room_ceiling' || o.name === 'room_end_leaf_L' || o.name === 'room_end_leaf_R') {
          if (o.geometry.attributes.color) {
            foundCornerAO = true;
          } else {
            const cnt = o.geometry.attributes.position.count;
            const fb = new Float32Array(cnt * 4);
            for (let k = 0; k < cnt; k++) { fb[k * 4] = 1.0; fb[k * 4 + 3] = 1.0; }
            o.geometry.setAttribute('color', new THREE.BufferAttribute(fb, 4));
          }
        }
      });

      const dummyBlack = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat);
      dummyBlack.needsUpdate = true;
      const dummyGrey = new THREE.DataTexture(new Uint8Array([140, 140, 140, 255]), 1, 1, THREE.RGBAFormat);
      dummyGrey.needsUpdate = true;
      const hasFixMaps = !!(meta.has_fixture_maps && tWallsF.image);

      this.M.easelVC.map = tWood; this.M.easelVC.normalMap = tWoodN; this.M.easelVC.needsUpdate = true;
      this.M.easelOak.map = tWood; this.M.easelOak.normalMap = tWoodN; this.M.easelOak.needsUpdate = true;
      this.bakedPack = {
        meta, scene: gltf.scene,
        tWalls, tCeil, tFloor,
        tWallsF: hasFixMaps ? tWallsF : dummyBlack,
        tCeilF:  hasFixMaps ? tCeilF  : dummyBlack,
        tFloorF: hasFixMaps ? tFloorF : dummyBlack,
        _v9Imgs: {
          tWalls:  tWalls.userData._v9Img,
          tCeil:   tCeil.userData._v9Img,
          tFloor:  tFloor.userData._v9Img,
          tWallsF: hasFixMaps ? tWallsF.userData._v9Img : null,
          tCeilF:  hasFixMaps ? tCeilF.userData._v9Img  : null,
          tFloorF: hasFixMaps ? tFloorF.userData._v9Img : null,
        },
        _dummyBlack: dummyBlack,
        _v9Evicted: false,
        hasFixMaps,
        hasCornerAO: foundCornerAO,
        tStripD, tStripN, tStripR, tWood, tWoodN, tWoodR: dummyGrey, tWallN,
      };
      this.makeBakedMaterials(this.bakedPack);
      return this.bakedPack;
    } catch (e) {
      console.warn('Cycles baked pack unavailable, using live fallback:', e);
      return null;
    }
  }

  ensureHK02WoodMaps() {
    if (this._hkWoodLoaded || !this.bakedFloorMat) return;
    this._hkWoodLoaded = true;
    const tWR = tex(BAKED_DIR + 'wood_rough.webp' + ASSET_VER, { srgb: false, repeat: true, mips: false, aniso: 1 });
    tWR.userData.ready.then(() => {
      this.bakedFloorMat.uniforms.tWoodRgh.value = tWR;
      if (this._cyclesAntiTwitchOn) {
        tWR.generateMipmaps = true;
        tWR.minFilter = THREE.LinearMipmapLinearFilter;
        tWR.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        tWR.needsUpdate = true;
        try { this.renderer.initTexture(tWR); } catch {}
      }
      this.reflDirty = true;
    });
  }

  ensureHerringboneMaps() {
    if (this._hbLoaded || !this.bakedFloorMat) return;
    this._hbLoaded = true;
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const tHB  = tex(BAKED_DIR + 'herringbone.webp' + ASSET_VER,     { srgb: true,  repeat: true, mips: true, aniso: maxAniso });
    const tHBN = tex(BAKED_DIR + 'herringbone_nor.webp' + ASSET_VER, { srgb: false, repeat: true, mips: true, aniso: maxAniso });
    Promise.all([tHB.userData.ready, tHBN.userData.ready]).then(() => {
      this.bakedFloorMat.uniforms.tHerring.value = tHB;
      this.bakedFloorMat.uniforms.tHerringNor.value = tHBN;
      this.reflDirty = true;
    });
  }

  setArchFinish(finishOrMode) {
    const mode = typeof finishOrMode === 'number'
      ? finishOrMode
      : (ARCH_FINISH_MODES[finishOrMode] ?? 0);
    if (this.bakedU) {
      this.bakedU.uArchMode.value = mode;
      this.bakedU.uArchBrick.value = mode > 0 ? 1.0 : 0.0;
    }
    if (this.layout?.hall && typeof finishOrMode === 'string') {
      this.layout.hall.archFinish = finishOrMode;
    }
    this.reflDirty = true;
  }

  setEntranceOpen(open) {
    const v = Math.max(0, Math.min(1, +open || 0));
    if (this.bakedU?.uEntOpen) this.bakedU.uEntOpen.value = v;
    if (this.entranceGlow) this.entranceGlow.visible = v > 0.002;
    if (Math.abs(v - (this._lastEntOpen ?? -1)) > 1e-4) {
      this._lastEntOpen = v;
      this.reflDirty = true;
    }
  }

  makeBakedMaterials(pk) {
    const wallSc = pk.meta.wall_scale || pk.meta.scale || 4.0;
    const ceilSc = pk.meta.ceil_scale || pk.meta.scale || 4.0;
    const sc = wallSc;
    const flSc = pk.meta.floor_scale || 8.0;
    const H = pk.meta.hall || {};
    const archS = H.arch || 20.00;
    const halfW = (H.width || 3.92) * 0.5;
    const vh = (H.alcoveWidth || 3.00) * 0.5;
    const archSpr = H.archSpring || 2.74;
    const archRise = H.archRise || 0.72;
    const flRect = pk.meta.floor_rect || [-2.06, 2.06, 3.60, 24.02];
    const clRect = pk.meta.ceil_rect  || [-2.04, 2.04, 3.60, 20.40];

    const posLays = (pk.meta.lay_rects || []).filter(r => r[0] > 0).sort((a, b) => a[2] - b[2]);
    const layVecs = [0, 1, 2, 3].map(i => {
      const r = posLays[i] || [1.078, 1.658, 5.05 + i * 3.91, 6.90 + i * 3.91];
      return new THREE.Vector4(r[0], r[1], r[2], r[3]);
    });
    const layXRange = posLays[0] ? new THREE.Vector2(posLays[0][0], posLays[0][1]) : new THREE.Vector2(1.078, 1.658);

    const isV6 = (pk.meta.version || 1) >= 6;
    this.bakedU = {
      uBakeExp:        { value: 1.00 },
      uIndoorGain:     { value: 0.39 },     // Legacy alias synced with uAmbientGain (39% ★)
      uAmbientGain:    { value: 0.39 },     // Default 39% ★: locked screenshot balance with 215% wall sconces & 105% spots
      uSpotGain:       { value: 1.05 },     // 105% ★ ceiling rod spotlight pools (corridor + alcove)
      uSconceGain:     { value: 2.15 },     // 215% ★ architectural wall sconce uplight pools
      uLightWarmth:    { value: 1.00 },     // 1.00 = 2300K ★ (3500 - 1.00 * 1200 = 2300K warm candle-tungsten)
      uShadowDepth:    { value: 0.84 },     // 84% ★ Doors, Pilasters, Baseboards, Cornices & Bifora Shadow Depth
      uCeilShadowDepth:{ value: 1.80 },     // 180% ★ Ceiling Pattern Shadow Depth — pressed-tin coffer pattern ONLY!
      uFloorDark:      { value: 0.70 },     // 70% ★ Floor Blacks
      uWallWhite:      { value: 1.28 },     // 128% ★ Live Wall Whiteness parameter (whiter plaster with 0 rebake!)
      uHasFixMaps:     { value: pk.hasFixMaps ? 1.0 : 0.0 },
      uHasCornerAO:    { value: pk.hasCornerAO ? 1.0 : 0.0 },
      uBakedV6:        { value: isV6 ? 1.0 : 0.0 },
      uFloorTone:      { value: 1.00 },
      uPlankAcross:    { value: 0.0 },
      uArchBrick:      { value: 0.0 },
      uArchMode:       { value: 0.0 },     // 0.0 = Clean Gallery Plaster ★
      uArchPitch:      { value: 0.196 },
      uArchWarmth:     { value: 1.00 },
      uArchTexture:    { value: 1.00 },
      uArchRim:        { value: 1.00 },
      uArchS:          { value: archS },
      uHalfW:          { value: halfW },
      uVH:             { value: vh },
      uArchSpr:        { value: archSpr },
      uArchRise:       { value: archRise },
      uCeilH:          { value: H.ceiling || 4.86 },
      uAlcoveCeilH:    { value: H.alcoveCeiling || 4.62 },
      uExtraH:         { value: 0.20 },    // Default 5.06 m live ceiling (+0.20 m above 4.86 m base) ★
      uWallGrade:      { value: 3.0 },     // 3=Crisp Gallery White ★ (default), 2=Warm Chalk-Ivory, 1=HK02 Alabaster, 4=Daylight Gradient
      uWinLightMode:   { value: 1.0 },
      uWinDesign:      { value: 0.0 },
      uWinCut:         { value: new THREE.Vector2(0.39, 3.24) },
      uTime:           { value: 0.0 },
      uFloorRect:      { value: new THREE.Vector4(flRect[0], flRect[1], flRect[2], flRect[3]) },
      uCeilRect:       { value: new THREE.Vector4(clRect[0], clRect[1], clRect[2], clRect[3]) },
      uFloorScale:     { value: flSc },
      uRefl:           { value: this.reflRT ? this.reflRT.texture : null },
      uReflMatrix:     { value: this.reflMatrix },
      uReflGain:       { value: 0.82 },
      uContrastFix:    { value: 1.0 },
      uSkylightMode:   { value: isV6 ? 0.5 : 1.0 },
      uHideAlcoveWin:  { value: 0.0 },
      uFloorMode:      { value: 0.0 },     // 0=1862 Town Hall Dark Cherry-Cognac Strips ★
      uWinBay0:        { value: new THREE.Vector4(0, -99, 0, 0) },
      uWinBay1:        { value: new THREE.Vector4(0, -99, 0, 0) },
      uEntOpen:        { value: 0.0 },     // [0..1] Grand entrance double-door opening fraction (golden morning floor spill & sunbeams)
      ...SHARED_OUTSIDE_UNIFORMS,
    };

    // Bidirectional vertical proportion law around baked `4.86 m` Town Hall ceiling (`extraH` in [-0.50 .. +0.55]):
    // - y <= 4.180 m: 0% shift (human baseboard, paintings, sconces, 6-panel doors, arched fanlights, Bifora window)
    // - Corridor (s <= 20.26 m): 4.180..4.338 spandrel, 4.338..4.394 picture rail (+0.85*extraH), 4.394..4.673 frieze, >=4.673 cornice & ceiling (+1.00*extraH)
    // - End Alcove (s > 20.26 m): 4.180..4.460 upper plaster scales smoothly, >=4.460 alcove cornice, ceiling & alcove rod shift rigidly (+1.00*extraH)!
    const WARP_Y_GLSL = /* glsl */`
      float warpRoomY(float y, float s, float extraH) {
        if (abs(extraH) <= 0.0001 || y <= 3.780) return y;
        if (y <= 4.180) return y;
        if (s > 20.26) {
          if (y < 4.460) return y + ((y - 4.180) / 0.280) * extraH;
          return y + extraH;
        }
        if (y < 4.338) return y + ((y - 4.180) / 0.158) * (0.85 * extraH);
        if (y <= 4.394) return y + 0.85 * extraH;
        if (y < 4.673) return y + mix(0.85, 1.00, (y - 4.394) / 0.279) * extraH;
        return y + extraH;
      }
    `;

    const VERT_BAKE = /* glsl */`
      uniform float uExtraH;
      varying vec2 vUv;
      varying vec3 vW;
      varying vec3 vN;
      ${WARP_Y_GLSL}
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        w.y = warpRoomY(w.y, -w.z, uExtraH);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `;

    // Shared 4-Tap Hardware Bicubic B-Spline Filter (V9), 4-Tap Decode-Before-Filter RGBM-sqrt (Cycles HDR),
    // Interleaved Gradient Noise (eliminates 8-bit display Mach banding), and Continuous Kelvin Warmth Curves!
    const LIGHT_COMMON_GLSL = /* glsl */`
      vec3 decodeRgbmsqrt(vec4 t, float sMax) { vec3 v = t.rgb * t.a; return (v * v) * sMax; }
      vec3 sampleRGBM4Tap(sampler2D tex, vec2 uv, vec2 texSize, float sMax) {
        vec2 invSz = 1.0 / max(texSize, vec2(1.0));
        vec2 p = uv * texSize - 0.5, i = floor(p), f = fract(p);
        vec3 c00 = decodeRgbmsqrt(texture2D(tex, (i + vec2(0.5, 0.5)) * invSz), sMax);
        vec3 c10 = decodeRgbmsqrt(texture2D(tex, (i + vec2(1.5, 0.5)) * invSz), sMax);
        vec3 c01 = decodeRgbmsqrt(texture2D(tex, (i + vec2(0.5, 1.5)) * invSz), sMax);
        vec3 c11 = decodeRgbmsqrt(texture2D(tex, (i + vec2(1.5, 1.5)) * invSz), sMax);
        return mix(mix(c00, c10, f.x), mix(c01, c11, f.x), f.y);
      }

      vec4 textureBicubic(sampler2D tex, vec2 uv, vec2 texSize) {
        vec2 invSize = 1.0 / texSize;
        vec2 coord = uv * texSize - 0.5;
        vec2 f = fract(coord);
        vec2 i = floor(coord);
        vec2 f2 = f * f;
        vec2 f3 = f2 * f;
        vec2 w0 = (1.0 - f) * (1.0 - f) * (1.0 - f) / 6.0;
        vec2 w1 = (3.0 * f3 - 6.0 * f2 + 4.0) / 6.0;
        vec2 w2 = (-3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0) / 6.0;
        vec2 w3 = f3 / 6.0;
        vec2 g0 = w0 + w1;
        vec2 g1 = w2 + w3;
        vec2 h0 = ((i - 1.0 + w1 / max(g0, 1e-5)) + 0.5) * invSize;
        vec2 h1 = ((i + 1.0 + w3 / max(g1, 1e-5)) + 0.5) * invSize;
        vec4 t00 = texture2D(tex, vec2(h0.x, h0.y));
        vec4 t10 = texture2D(tex, vec2(h1.x, h0.y));
        vec4 t01 = texture2D(tex, vec2(h0.x, h1.y));
        vec4 t11 = texture2D(tex, vec2(h1.x, h1.y));
        return mix(mix(t11, t01, g0.x), mix(t10, t00, g0.x), g0.y);
      }

      float ignDither(vec2 fragXY) {
        return fract(52.9829189 * fract(dot(fragXY, vec2(0.06711056, 0.00583715)))) - 0.5;
      }

      vec3 evalSpotKelvin(float w) {
        vec3 c0 = vec3(1.00, 0.99, 0.97); // 0.00 -> 3500K crisp neutral gallery white
        vec3 c1 = vec3(1.06, 0.95, 0.83); // 0.55 -> 2850K subtle warm museum halogen ★
        vec3 c2 = vec3(1.16, 0.83, 0.56); // 1.00 -> 2300K warm amber tungsten
        return (w < 0.55) ? mix(c0, c1, w / 0.55) : mix(c1, c2, (w - 0.55) / 0.45);
      }

      vec3 evalSconceKelvin(float w) {
        vec3 c0 = vec3(1.01, 0.98, 0.94); // ~100K warmer than overhead spots
        vec3 c1 = vec3(1.09, 0.93, 0.78); // 0.55 -> 2750K subtle warm gallery glow ★
        vec3 c2 = vec3(1.20, 0.79, 0.50); // 1.00 -> 2200K warm candle-amber
        return (w < 0.55) ? mix(c0, c1, w / 0.55) : mix(c1, c2, (w - 0.55) / 0.45);
      }
    `;

    const WALL_GRADE_GLSL = /* glsl */`
      vec3 wallPlasterAlbedo(float y, float effCeilH, float gradeMode) {
        float hNorm = clamp(y / max(effCeilH, 3.8), 0.0, 1.0);
        if (gradeMode < 0.5) return vec3(0.92, 0.91, 0.89);
        if (gradeMode < 1.5) {
          // Grade 1: HK02 Luminous Alabaster
          return vec3(0.958, 0.936, 0.896);
        } else if (gradeMode < 2.5) {
          // Grade 2: Warm Chalk-Ivory
          return vec3(0.950, 0.918, 0.864);
        } else if (gradeMode < 3.5) {
          // Grade 3: Crisp Gallery White ★ (#f7f6f2 — true museum white that lets warm fixtures & dark shadows sing!)
          return vec3(0.972, 0.966, 0.952);
        } else {
          // Grade 4: Tall-Hall Daylight Gradient
          vec3 dado = vec3(0.935, 0.882, 0.805);
          vec3 mid  = vec3(0.955, 0.926, 0.875);
          vec3 top  = vec3(0.980, 0.974, 0.958);
          return (hNorm < 0.36)
            ? mix(dado, mid, smoothstep(0.03, 0.36, hNorm))
            : mix(mid, top, smoothstep(0.36, 0.90, hNorm));
        }
      }

      vec3 gradeWallPlaster(vec3 rawIrr, float y, float effCeilH, float gradeMode, float wallWhite) {
        vec3 alb = wallPlasterAlbedo(y, effCeilH, gradeMode);
        float wOver = clamp(wallWhite - 1.0, -0.35, 0.65);
        alb = mix(alb, vec3(0.993, 0.991, 0.986), clamp(wOver * 1.35, 0.0, 0.88));
        float gainW = 1.0 + wOver * 0.82;
        return rawIrr * alb * gainW;
      }
    `;

    // Physically-grounded 3D projective side-window sunlight + Komorebi garden leaf canopy + soft sky-fill bloom!
    const WIN_SUN_GLSL = /* glsl */`
      float komorebiCanopy(vec2 p, float tSec) {
        vec2 breeze = vec2(sin(tSec * 0.55 + p.y * 1.4) * 0.028, cos(tSec * 0.43 + p.x * 1.7) * 0.020);
        vec2 q1 = (p + breeze) * vec2(3.8, 3.1);
        vec2 q2 = mat2(0.80, -0.60, 0.60, 0.80) * ((p - breeze * 0.7) * vec2(7.1, 5.8)) + vec2(1.7, 3.1);
        vec2 q3 = mat2(0.60,  0.80, -0.80, 0.60) * ((p + breeze * 1.2) * vec2(12.4, 10.2)) + vec2(4.3, 0.9);
        float w1 = 0.5 + 0.5 * sin(q1.x + 0.72 * sin(q1.y * 1.35));
        float w2 = 0.5 + 0.5 * cos(q2.y + 0.75 * sin(q2.x * 1.25));
        float w3 = 0.5 + 0.5 * sin(q3.x * 0.95 - q3.y * 0.85);
        float gap = w1 * 0.46 + w2 * 0.34 + w3 * 0.20;
        // Distinct dappled leaf shadows & bright golden sun-flecks:
        return mix(0.14, 1.58, smoothstep(0.30, 0.70, gap));
      }

      vec3 evalSingleWindowLight(vec4 bay, vec3 wPos, vec3 N, float isFloor) {
        if (bay.w < 0.5) return vec3(0.0);
        float sCoord = -wPos.z;
        float hw = uWinCut.x;
        float ySill = 0.92;
        float yTop  = uWinCut.y;

        // 1. Soft diffuse hemispherical sky-fill entering through the glazed opening:
        vec3 winCtr = vec3(bay.x * uHalfW, 0.5 * (ySill + yTop), -bay.y);
        vec3 toWin = winCtr - wPos;
        float dist = length(toWin);
        vec3 dirWin = toWin / max(dist, 0.001);
        float facing = (isFloor > 0.5)
          ? clamp(0.45 + 0.55 * max(dirWin.y, 0.0), 0.0, 1.0)
          : clamp(0.25 + 0.75 * max(dot(N, dirWin), 0.0), 0.0, 1.0);
        float revealBounce = exp(-dist / 1.15) * 0.16;
        float skyFalloff = exp(-dist / 2.45) * facing + revealBounce;
        vec3 skyCol = (uWinLightMode > 0.5 && uWinLightMode < 1.5)
          ? vec3(0.98, 0.95, 0.84)
          : vec3(0.96, 0.97, 1.00);
        vec3 total = skyCol * (skyFalloff * (isFloor > 0.5 ? 0.22 : 0.075));

        if (uWinLightMode < 0.5) return total;

        // 2. Direct Global Sun Ray Projection (consistent with HK02 sun shining from Right +X -> -X, angled gently +s):
        float sunSide = bay.x;
        float xGlass = bay.x * (uHalfW + 0.24);
        float dx = (xGlass - wPos.x) * bay.x;
        if (dx <= 0.04) return total;

        float inc = (isFloor > 0.5)
          ? 1.0
          : clamp(N.y * 0.42 + (N.x * bay.x) * 0.88, 0.0, 1.0);
        if (inc <= 0.02) return total;

        float tanElev = 0.585; // ~30.3 deg solar altitude -> sweeps richly across the honey-oak floor & kisses lower left dado!
        float tanPsi  = 0.245 * bay.x;
        float yHit = wPos.y + dx * tanElev;
        float sHit = sCoord - dx * tanPsi;
        float ds   = sHit - bay.y;

        float pen = 0.022 + 0.012 * dx;
        float maskS = 1.0 - smoothstep(hw - pen, hw + pen, abs(ds));
        float maskBot = smoothstep(ySill - pen, ySill + pen * 1.10, yHit);
        float maskTop = 0.0;

        if (uWinDesign < 0.5) {
          float ySpring = yTop - hw;
          if (yHit <= ySpring) {
            maskTop = 1.0;
          } else {
            float rArch = length(vec2(ds, yHit - ySpring));
            maskTop = 1.0 - smoothstep(hw - pen, hw + pen, rArch);
          }
        } else {
          maskTop = 1.0 - smoothstep(yTop - pen, yTop + pen, yHit);
        }

        float ap = maskS * maskBot * maskTop;
        if (ap <= 0.002) return total;

        // Crisp-soft optical sash, meeting-rail, muntin & spoke-fanlight shadows:
        float mBlur = 0.008 + 0.0065 * dx;
        float barShadow = 1.0;
        if (uWinDesign < 0.5) {
          float ySpring = yTop - hw;
          float yMeet = 0.5 * (ySill + 0.05 + ySpring);
          barShadow *= 1.0 - 0.50 * (1.0 - smoothstep(0.013, 0.013 + mBlur, abs(yHit - yMeet)));
          barShadow *= 1.0 - 0.46 * (1.0 - smoothstep(0.013, 0.013 + mBlur, abs(yHit - ySpring)));
          if (yHit < ySpring) {
            float dMv = abs(abs(ds) - hw * 0.333);
            barShadow *= 1.0 - 0.36 * (1.0 - smoothstep(0.0065, 0.0065 + mBlur, dMv));
            float yQ1 = 0.5 * (ySill + 0.05 + yMeet);
            float yQ2 = 0.5 * (yMeet + ySpring);
            float dMh = min(abs(yHit - yQ1), abs(yHit - yQ2));
            barShadow *= 1.0 - 0.34 * (1.0 - smoothstep(0.0065, 0.0065 + mBlur, dMh));
          } else {
            float ang = atan(yHit - ySpring, ds);
            float spokeF = abs(sin(ang * 6.0));
            float rA = length(vec2(ds, yHit - ySpring));
            barShadow *= mix(1.0, 0.64 + 0.36 * smoothstep(0.0, 0.32 + mBlur * 5.0, spokeF), smoothstep(0.08, 0.16, rA));
          }
        } else {
          float yTrans = yTop - 0.38;
          barShadow *= 1.0 - 0.54 * (1.0 - smoothstep(0.015, 0.015 + mBlur, abs(ds)));
          barShadow *= 1.0 - 0.46 * (1.0 - smoothstep(0.013, 0.013 + mBlur, abs(yHit - yTrans)));
          if (yHit < yTrans) {
            float uCas = (yHit - ySill) / max(0.4, yTrans - ySill) * 4.0;
            float dRung = min(fract(uCas), 1.0 - fract(uCas)) * (yTrans - ySill) * 0.25;
            barShadow *= 1.0 - 0.34 * (1.0 - smoothstep(0.0065, 0.0065 + mBlur, dRung));
          }
        }

        float sunStrength = (sunSide > 0.0) ? 1.0 : 0.22;
        vec3 sunTint = vec3(1.14, 0.97, 0.72);
        float leafMod = 1.0;
        if (uWinLightMode < 1.5) {
          leafMod = komorebiCanopy(vec2(ds + bay.y * 0.13, yHit * 0.92), uTime);
          sunTint = mix(vec3(0.92, 0.88, 0.68), vec3(1.18, 0.99, 0.72), clamp(leafMod * 0.65, 0.0, 1.0));
        }
        float gain = (isFloor > 0.5) ? 1.38 : 0.30;
        total += sunTint * (ap * barShadow * leafMod * inc * sunStrength * gain);
        return total;
      }

      vec3 evalSideWindowSun(vec3 wPos, vec3 N, float isFloor) {
        return evalSingleWindowLight(uWinBay0, wPos, N, isFloor)
             + evalSingleWindowLight(uWinBay1, wPos, N, isFloor);
      }
    `;

    // 1. 1:1 Cycles-Baked Gallery Plaster Walls (V9 Bicubic + Cycles Multi-Basis 4-Tap RGBM-sqrt; strictly <= 6 samplers!):
    const wallUniforms = {
      tLight:    { value: pk.tWalls },
      tLightB:   { value: DUMMY_RGBMSQRT },
      tLightFix: { value: pk.tWallsF },
      tWallNor:  { value: pk.tWallN },
      uScale:    { value: wallSc },
      uFixScale: { value: pk.meta.wall_fix_scale || pk.meta.fix_scale || wallSc },
      uDualUv:   { value: 0.0 },
      ...this.bakedU,
      ...(this.paintU || {}),
    };
    const hasPaint = !!this.paintU;
    this.bakedWallMat = new THREE.ShaderMaterial({
      uniforms: wallUniforms,
      vertexShader: /* glsl */`
        uniform float uExtraH, uDualUv;
        attribute vec2 aUvRight;
        attribute float aBlend;
        varying vec2 vUv, vUv2;
        varying float vBlend;
        varying vec3 vW, vN;
        ${WARP_Y_GLSL}
        void main() {
          vUv = uv;
          vUv2 = aUvRight;
          vBlend = aBlend;
          vec4 w = modelMatrix * vec4(position, 1.0);
          w.y = warpRoomY(w.y, -w.z, uExtraH);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D tLight, tLightB, tLightFix, tWallNor;
        uniform float uScale, uFixScale, uBakeExp, uAmbientGain, uSpotGain, uSconceGain, uLightWarmth, uShadowDepth, uWallWhite, uHasFixMaps;
        uniform float uBakedV6, uArchMode, uArchPitch, uArchWarmth, uArchTexture, uArchRim;
        uniform float uArchS, uHalfW, uVH, uArchSpr, uArchRise, uCeilH, uAlcoveCeilH, uExtraH, uWallGrade;
        uniform float uContrastFix, uSkylightMode, uHideAlcoveWin, uWinLightMode, uWinDesign, uTime, uDualUv;
        uniform float uLightMix, uLightEncA, uLightEncB, uFixEnc;
        uniform float uSmaxWallA, uSmaxWallB, uSmaxWallFix, uExtGainA, uExtGainB, uSconceCyclesGain;
        uniform vec2 uWinCut, uWallLightSizeA, uWallLightSizeB, uLightFixSize;
        uniform vec3 uSconceColorCorr, uSconceColorAlc, uWallAlbedoPhys;
        uniform vec4 uWinBay0, uWinBay1;
        varying vec2 vUv, vUv2;
        varying float vBlend;
        varying vec3 vW, vN;
        ${hasPaint ? PAINT_GLSL : ''}
        ${LIGHT_COMMON_GLSL}
        ${WALL_GRADE_GLSL}
        ${WIN_SUN_GLSL}
        ${OUTSIDE_LIGHT_GLSL}

        bool inNarrowWinHole(vec4 bay, float x, float s, float y) {
          return bay.w > 0.5 && (x * bay.x > 0.85) && abs(s - bay.y) < (uWinCut.x + 0.015) && y > 0.90 && y < (uWinCut.y + 0.02);
        }

        // H2: NEVER apply V9 min(..., vec3(0.225)) pre-clamp to raw RGBM-sqrt texels in uDualUv > 0.5!
        // Cycle 2: enc > 1.5 = RGBA16F 1-tap hardware trilinear + 8x aniso; enc > 0.5 = RGBM-sqrt 4-tap; else V9 bicubic.
        vec3 sampleWallLightTex(sampler2D tex, vec2 texSize, float enc, float sMax) {
          if (enc > 1.5) {
            return (uDualUv > 0.5)
              ? mix(texture2D(tex, vUv).rgb, texture2D(tex, vUv2).rgb, smoothstep(0.0, 1.0, vBlend))
              : texture2D(tex, vUv).rgb;
          }
          if (enc > 0.5) {
            return (uDualUv > 0.5)
              ? mix(sampleRGBM4Tap(tex, vUv, texSize, sMax),
                    sampleRGBM4Tap(tex, vUv2, texSize, sMax), smoothstep(0.0, 1.0, vBlend))
              : sampleRGBM4Tap(tex, vUv, texSize, sMax);
          }
          return (uDualUv > 0.5)
            ? mix(min(textureBicubic(tex, vUv, texSize).rgb, vec3(0.225)),
                  min(textureBicubic(tex, vUv2, texSize).rgb, vec3(0.225)), smoothstep(0.0, 1.0, vBlend))
            : textureBicubic(tex, vUv, texSize).rgb;
        }

        vec3 evalWallAmbTerm(vec3 rawSample, float enc, float extGain) {
          if (enc > 0.5) {
            return rawSample * (extGain * uOutStrength * uBakeExp);
          }
          vec3 rawLin = rawSample * uScale;
          rawLin = rawLin / (vec3(1.0) + max(vec3(0.0), rawLin - vec3(0.85)) * 0.68);
          return (rawLin * 0.80 + vec3(0.155)) * (uBakeExp * uAmbientGain);
        }

        vec3 evalHK02ArchFinish(vec3 wPos, vec3 N, vec2 fineNoise, float effCeilH) {
          vec3 plasterRef = vec3(0.955, 0.946, 0.928);
          float soffitTone = mix(0.96, 0.76 + 0.10 * max(-N.y, 0.0), uContrastFix);
          vec3 soffitAlb = vec3(0.955, 0.928, 0.892) * soffitTone;
          float frontFace = smoothstep(0.74, 0.94, N.z);
          if (frontFace <= 0.002) {
            return soffitAlb / plasterRef;
          }

          float pitch = max(0.08, uArchPitch);
          float u = wPos.x / pitch + 0.5;
          float cell = floor(u);
          float f = fract(u);
          float fw = clamp(fwidth(u), 0.003, 0.22);
          float h = fract(sin(cell * 127.1 + 31.7) * 43758.5453);

          vec3 peachA = vec3(0.840, 0.548, 0.382);
          vec3 peachB = vec3(0.792, 0.498, 0.342);
          vec3 cream  = vec3(0.958, 0.892, 0.808);

          if (uArchMode > 2.5 && uArchMode < 3.5) {
            peachA = vec3(0.900, 0.710, 0.572);
            peachB = vec3(0.868, 0.675, 0.538);
            cream  = vec3(0.968, 0.930, 0.875);
          } else if (uArchMode > 3.5) {
            peachA = vec3(0.742, 0.478, 0.348);
            peachB = vec3(0.678, 0.422, 0.305);
            cream  = vec3(0.925, 0.882, 0.822);
          }

          vec3 bandCol = clamp(mix(cream, mix(peachA, peachB, h * 0.70), uArchWarmth), 0.05, 0.99);

          float dPin = min(f, 1.0 - f);
          float softBell = exp(-pow(dPin / 0.145, 1.75)) / (1.0 + fw * 3.5);
          float crispPin = 1.0 - smoothstep(0.044 - fw * 0.85, 0.044 + fw * 0.85, dPin);
          float creamWeight = mix(crispPin, softBell * 0.78, uContrastFix) * clamp(uArchTexture, 0.0, 1.4);
          vec3 alb = mix(bandCol, cream, clamp(creamWeight, 0.0, 1.0));

          float cyl = cos((f - 0.5) * 6.2831853);
          float rib3D = mix(0.015, 0.042, uArchMode > 1.5 && uArchMode < 2.5 ? 1.0 : 0.45) * cyl * uArchTexture;
          float paperTooth = (fineNoise.x * 0.018 + fineNoise.y * 0.014) * uArchTexture;
          alb *= (1.0 + rib3D + paperTooth);

          float yNorm = clamp(wPos.y / max(effCeilH, 3.8), 0.0, 1.0);
          float vertGrad = mix(1.0, mix(0.84, 1.07, smoothstep(0.05, 0.96, yNorm)), uContrastFix);
          float edgeAO = mix(1.0, mix(0.87, 1.0, smoothstep(0.0, 0.36, uHalfW - abs(wPos.x))), uContrastFix);
          alb *= vertGrad * edgeAO;

          float springFade = smoothstep(uArchSpr - 0.01, uArchSpr + 0.04, wPos.y);
          if (uArchRim > 0.01 && springFade > 0.002) {
            float ex = wPos.x / uVH;
            float ey = max(0.0, wPos.y - uArchSpr) / uArchRise;
            float rEll = sqrt(ex * ex + ey * ey);
            float radScale = mix(uVH, uArchRise, clamp(ey * ey, 0.0, 1.0));
            float dRimM = (rEll - 1.0) * radScale;
            float fwRim = max(fwidth(dRimM), 0.003);
            if (dRimM >= -0.012 && dRimM < 0.085) {
              float innerBead = 1.0 - smoothstep(0.006 - fwRim, 0.016 + fwRim, dRimM);
              float rimBand = smoothstep(0.006 - fwRim, 0.020 + fwRim, dRimM)
                            * (1.0 - smoothstep(0.046 - fwRim, 0.068 + fwRim, dRimM));
              vec3 rimTerra = mix(cream * 0.90, vec3(0.655, 0.415, 0.305), clamp(uArchWarmth, 0.0, 1.4));
              alb = mix(alb, rimTerra, rimBand * springFade * 0.72 * clamp(uArchRim, 0.0, 1.2));
              alb = mix(alb, soffitAlb * 1.04, innerBead * springFade * 0.65 * clamp(uArchRim, 0.0, 1.0));
            }
          }

          return mix(soffitAlb, alb, frontFace) / plasterRef;
        }

        void main() {
          float sCoord = -vW.z;
          float effCeilH = uCeilH + uExtraH;
          float effVC    = uAlcoveCeilH + uExtraH;

          // Cut clean aperture in room_walls when optional narrowed side windows are active:
          if (uDualUv < 0.5 && (inNarrowWinHole(uWinBay0, vW.x, sCoord, vW.y) || inNarrowWinHole(uWinBay1, vW.x, sCoord, vW.y))) {
            discard;
          }

          vec3 ambA = evalWallAmbTerm(sampleWallLightTex(tLight, uWallLightSizeA, uLightEncA, uSmaxWallA), uLightEncA, uExtGainA);
          vec3 ambIrr = (uLightMix > 0.0005)
            ? mix(ambA, evalWallAmbTerm(sampleWallLightTex(tLightB, uWallLightSizeB, uLightEncB, uSmaxWallB), uLightEncB, uExtGainB), clamp(uLightMix, 0.0, 1.0))
            : ambA;
          vec3 fixIrr = vec3(0.0);
          vec3 spotIrr = vec3(0.0);
          vec3 sconceIrr = vec3(0.0);
          float sconceLinSaved = 0.0;
          if (uFixEnc > 0.5) {
            vec3 rawFixC = (uFixEnc > 2.5)
              ? ((uDualUv > 0.5)
                  ? mix(texture2D(tLightFix, vUv).rgb, texture2D(tLightFix, vUv2).rgb, smoothstep(0.0, 1.0, vBlend))
                  : texture2D(tLightFix, vUv).rgb)
              : ((uDualUv > 0.5)
                  ? mix(sampleRGBM4Tap(tLightFix, vUv, uLightFixSize, uSmaxWallFix),
                        sampleRGBM4Tap(tLightFix, vUv2, uLightFixSize, uSmaxWallFix), smoothstep(0.0, 1.0, vBlend))
                  : sampleRGBM4Tap(tLightFix, vUv, uLightFixSize, uSmaxWallFix));
            float alcTintT = smoothstep(19.90, 20.58, sCoord);
            vec3 sconceTintSpatial = mix(uSconceColorCorr, uSconceColorAlc, alcTintT);
            // B1c: Guard wallFixRT strictly as (1.5 < uFixEnc < 2.5) so uFixEnc = 3.0 (RGBA16F B_sconce) uses Cycles sconce scaling!
            if (uFixEnc > 1.5 && uFixEnc < 2.5) {
              // H1: Zero-pop V9 <-> C0x alcove spatial tint ramp (C0 continuous at u = 0 and u = 1!):
              vec3 alcCorrRatio = sconceTintSpatial / max(uSconceColorCorr, vec3(1e-4));
              fixIrr = rawFixC * mix(vec3(1.0), alcCorrRatio, smoothstep(0.5, 1.0, clamp(uLightMix, 0.0, 1.0)));
            } else {
              float scLiveScale = clamp(uSconceGain / 2.15, 0.0, 2.5);
              fixIrr = rawFixC * (uSconceCyclesGain * scLiveScale * uBakeExp) * sconceTintSpatial;
            }
          } else if (uHasFixMaps > 0.5) {
            vec3 rawFix = (uDualUv > 0.5)
              ? mix(textureBicubic(tLightFix, vUv, vec2(1024.0)).rgb,
                    textureBicubic(tLightFix, vUv2, vec2(1024.0)).rgb, smoothstep(0.0, 1.0, vBlend))
              : textureBicubic(tLightFix, vUv, vec2(1024.0)).rgb;
            float spotLin   = rawFix.r * uFixScale;
            float sconceLin = rawFix.g * uFixScale;
            // Smooth near-field uplight compression prevents pure-white oval clipping right above S5 bowls while preserving rich 2516K warmth:
            sconceLin = sconceLin / (1.0 + max(0.0, sconceLin - 0.36) * 1.45);
            sconceLinSaved = sconceLin;
            spotIrr   = spotLin * (0.76 * uSpotGain) * evalSpotKelvin(uLightWarmth) * uBakeExp;
            sconceIrr = sconceLin * (0.50 * uSconceGain) * evalSconceKelvin(uLightWarmth) * uBakeExp;
            fixIrr = (spotLin * (0.76 * uSpotGain) * evalSpotKelvin(uLightWarmth)
                    + sconceLin * (0.50 * uSconceGain) * evalSconceKelvin(uLightWarmth)) * uBakeExp;
          }

          vec3 baseIrr = ambIrr + fixIrr;
          vec3 N = normalize(vN);
          vec3 basePlaster;
          float kCycW = clamp(uOutCyclesMix, 0.0, 1.0);
          // B5a/B6a: Uniform-flow call to evalUnifiedDirectSun (tLightB carries tLeafCookie on C02 with +0 samplers!)
          vec3 dirSunW = (kCycW > 0.0005) ? (evalUnifiedDirectSun(vW, N, 0.0, 1.0, tLightB) * uBakeExp) : vec3(0.0);

          if (kCycW >= 0.9995) {
            // Pure Cycles multi-basis irradiance + soft Cycles painting-frame/poster/sconce contact-AO (float, Guard #2!):
            float cycContact = evalOutsideWallContactShadows(vW, N);
            basePlaster = (ambIrr + fixIrr + dirSunW + evalSideWindowSun(vW, N, 0.0)) * uWallAlbedoPhys * cycContact;
          } else {
            bool olActive = (kCycW <= 0.0005) && (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005);
            vec4 outWall = vec4(0.0, 0.0, 0.0, 1.0);
            vec3 sconceTailScaled = vec3(0.0);
            float spotScaleW = 1.0;
            vec3 fixDelta = vec3(0.0);
            vec3 ambGradeStd = vec3(0.0);
            if (olActive) {
              outWall = evalOutsideWallMod(vW, N);
              float wSumW     = max(1e-4, dot(uOutWeights, vec4(1.0)));
              float kOutW     = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
              float kSunW     = clamp((uOutWeights.x + uOutWeights.y) * uOutStrength, 0.0, 1.0);
              float endMaskSc = smoothstep(0.5, 0.9, N.z) * step(23.60, sCoord);
              float k4End     = endMaskSc * clamp(uOutWeights.z * uOutStrength, 0.0, 1.0);
              float yCapSc    = smoothstep(3.48, 2.58, vW.y);
              float smSc      = smoothstep(0.045, 0.54, sconceLinSaved);
              float plumeSc   = (smSc > 0.0 ? pow(smSc, 1.28) : 0.0) * yCapSc * (1.0 - 0.65 * k4End);
              vec3 sconceNear = sconceIrr * plumeSc;
              vec3 sconceTail = sconceIrr * (1.0 - plumeSc);
              float portalSc  = smoothstep(19.90, 20.58, sCoord);
              float alcPlume  = mix(0.76, 0.66, clamp((uOutWeights.z + uOutWeights.w) * uOutStrength, 0.0, 1.0));
              float tailScale = mix(1.0, mix(0.32, 0.58, portalSc) * outWall.w, kOutW);
              vec3 sconceShaped = (sconceNear / (vec3(1.0) + sconceNear * 0.64))
                                * mix(1.12, alcPlume, portalSc) * (1.0 - 0.65 * k4End);
              vec3 sconceNearFinal = mix(sconceNear, sconceShaped + evalOutsideSconceDelta(sconceShaped, portalSc), kOutW);
              sconceTailScaled = sconceTail * tailScale;
              float spotCorr  = mix(outWall.w, 0.78, 0.55);
              float spotAlc   = mix(outWall.w, 0.22, kSunW);
              spotScaleW      = mix(1.0, mix(spotCorr, spotAlc, portalSc), kOutW);
              vec3 spotTgtMul = (uOutWeights.z * vec3(1.02, 1.05, 1.08)
                               + uOutWeights.w * vec3(1.03, 1.05, 1.06)
                               + uOutWeights.y * vec3(1.06, 1.00, 0.92)
                               + uOutWeights.x * vec3(1.03, 1.05, 1.06)) / wSumW;
              vec3 spotScaled = spotIrr * spotScaleW * mix(vec3(1.0), spotTgtMul, kOutW * (1.0 - portalSc * 0.5));
              fixDelta        = (spotScaled - spotIrr)
                              + sconceTail * (tailScale - 1.0)
                              + (sconceNearFinal - sconceNear);
              ambGradeStd     = evalOutsideAmbGradeDelta(ambIrr * outWall.w + spotScaled + sconceTailScaled, sCoord);
            }
            float shWall = mix(1.0, 1.0 + 0.16 * clamp(uShadowDepth, 0.0, 2.0), uContrastFix);

            if (sCoord >= uArchS - 0.01 && sCoord <= uArchS + 0.31 && N.z < 0.72) {
              float revShade = mix(0.95, pow(0.84 + 0.08 * max(-N.y, 0.0), shWall), uContrastFix);
              vec3 revIrr;
              if (!olActive) {
                revIrr = mix(baseIrr * revShade, vec3(0.68, 0.66, 0.63) * (revShade * uBakeExp * (uAmbientGain + 0.16 * uSpotGain)), 0.35);
              } else {
                vec3 revBase = (ambIrr * outWall.w + fixIrr + fixDelta + ambGradeStd) * revShade + outWall.rgb * (uBakeExp * 0.85);
                vec3 soffBase = vec3(0.68, 0.66, 0.63) * (revShade * uBakeExp * (uAmbientGain * outWall.w + 0.16 * uSpotGain * spotScaleW));
                revIrr = mix(revBase, soffBase + evalOutsideAmbGradeDelta(soffBase, sCoord) + outWall.rgb * (uBakeExp * 0.55), 0.35);
              }
              basePlaster = gradeWallPlaster(revIrr, vW.y, effCeilH, uWallGrade, uWallWhite);
            } else if (sCoord > uArchS + 0.28) {
              float dHoriz = (N.z > 0.5)
                ? max(0.0, uVH - abs(vW.x))
                : min(max(0.0, sCoord - (uArchS + 0.30)), max(0.0, (uArchS + 3.92) - sCoord));
              float dPocket = min(dHoriz, max(0.0, effVC - vW.y));
              float pAO = pow(mix(1.0, mix(0.91, 1.0, smoothstep(0.0, 0.38, dPocket)), uContrastFix), shWall);
              if (N.z > 0.5 && sCoord > uArchS + 3.84) {
                float underPerch = (1.0 - smoothstep(0.84, 0.98, abs(vW.x))) * smoothstep(0.46, 0.618, vW.y) * (1.0 - smoothstep(0.622, 0.66, vW.y));
                vec3 smoothAlcoveAmb = vec3(0.955, 0.946, 0.928) * ((0.93 + 0.05 * (vW.y / effVC)) * (1.0 - 0.06 * underPerch) * uBakeExp * uAmbientGain);
                if (!olActive) {
                  vec3 endAmb = (kCycW > 0.0005) ? mix(smoothAlcoveAmb, ambIrr, kCycW) : smoothAlcoveAmb;
                  baseIrr = (endAmb + fixIrr) * pAO;
                } else {
                  vec3 ambGradeEnd = evalOutsideAmbGradeDelta(smoothAlcoveAmb * outWall.w + spotIrr * spotScaleW + sconceTailScaled, sCoord);
                  baseIrr = (smoothAlcoveAmb * outWall.w + fixIrr + fixDelta + ambGradeEnd) * pAO + outWall.rgb * uBakeExp;
                }
              } else {
                if (!olActive) {
                  baseIrr = (ambIrr + fixIrr) * pAO;
                } else {
                  baseIrr = (ambIrr * outWall.w + fixIrr + fixDelta + ambGradeStd) * pAO + outWall.rgb * uBakeExp;
                }
              }
              basePlaster = gradeWallPlaster(baseIrr, vW.y, effVC, uWallGrade, uWallWhite);
            } else {
              float aoTop = pow(mix(1.0, mix(0.92, 1.0, smoothstep(0.05, 0.38, effCeilH - vW.y)), uContrastFix), shWall);
              float aoBot = pow(mix(0.955, 1.0, smoothstep(0.315, 0.40, vW.y)), shWall);
              if (!olActive) {
                baseIrr = baseIrr * (aoTop * aoBot) + evalSideWindowSun(vW, N, 0.0);
              } else {
                baseIrr = (ambIrr * outWall.w + fixIrr + fixDelta + ambGradeStd) * (aoTop * aoBot) + evalSideWindowSun(vW, N, 0.0) + outWall.rgb * uBakeExp;
              }
              basePlaster = gradeWallPlaster(baseIrr, vW.y, effCeilH, uWallGrade, uWallWhite);
            }
            if (olActive) {
              basePlaster *= evalOutsideWallContactShadows(vW, N);
            }
            if (kCycW > 0.0005) {
              float cycContact = evalOutsideWallContactShadows(vW, N);
              vec3 cycPlaster = (ambIrr + fixIrr + dirSunW + evalSideWindowSun(vW, N, 0.0)) * uWallAlbedoPhys * cycContact;
              basePlaster = mix(basePlaster, cycPlaster, kCycW);
            }
          }

          vec2 wUv = (abs(N.z) > 0.5) ? vec2(vW.x, vW.y) : vec2(sCoord, vW.y);
          float fw = max(fwidth(wUv.x), fwidth(wUv.y));
          float closeFade = 1.0 / (1.0 + fw * 64.0);

          vec3 nCoarse = texture2D(tWallNor, wUv / 1.85).xyz * 2.0 - 1.0;
          vec3 nFine   = texture2D(tWallNor, wUv * 1.65 + vec2(0.37, 0.19)).xyz * 2.0 - 1.0;
          vec2 dN = nCoarse.xy * 0.16 + nFine.xy * (0.18 * closeFade);

          float rakeY = dN.y * 0.115;
          float rakeSign = (kCycW > 0.0005) ? clamp((sCoord - 12.0) * 0.25, -1.0, 1.0) : sign(sCoord - 12.0);
          float rakeS = dN.x * 0.072 * rakeSign;
          float microMod = clamp(1.0 + (rakeY + rakeS) * (0.48 + 0.52 * closeFade), 0.94, 1.06);
          vec3 lit = basePlaster * microMod;

          if (uArchMode > 0.5 && sCoord >= uArchS - 0.03 && sCoord <= uArchS + 0.33 && vW.y < effCeilH - 0.085) {
            lit *= evalHK02ArchFinish(vW, N, nFine.xy, effCeilH);
          }

          vec3 V = normalize(cameraPosition - vW);
          float graze = pow(1.0 - max(dot(N, V), 0.0), 4.5);
          lit += lit * graze * 0.022;

          ${hasPaint ? 'lit = evalWallPaintKM(lit, vW, N);' : ''}

          if (uInReflPass > 0.5) {
            float pkR = max(lit.r, max(lit.g, lit.b));
            lit *= 1.0 / (1.0 + max(0.0, pkR - 0.85) * 0.90);
          }

          gl_FragColor = vec4(lit, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          if (uInReflPass < 0.5) {
            gl_FragColor.rgb += ignDither(gl_FragCoord.xy) / 255.0;
          }
        }
      `,
    });

    // 2. Cycles-Baked 3D Coved Pressed-Tin Ceiling (strictly <= 2 samplers: tLight, tLightFix!):
    this.bakedCeilMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
      uniforms: {
        tLight:    { value: pk.tCeil },
        tLightFix: { value: pk.tCeilF },
        uScale:    { value: ceilSc },
        uFixScale: { value: pk.meta.ceil_fix_scale || pk.meta.fix_scale || ceilSc },
        uLay0:     { value: layVecs[0] },
        uLay1:     { value: layVecs[1] },
        uLay2:     { value: layVecs[2] },
        uLay3:     { value: layVecs[3] },
        ...this.bakedU,
      },
      vertexShader: /* glsl */`
        uniform float uExtraH;
        attribute vec4 color;
        varying vec2 vUv;
        varying vec3 vW, vN;
        varying vec4 vCol;
        ${WARP_Y_GLSL}
        void main() {
          vUv = uv;
          vCol = color;
          vec4 w = modelMatrix * vec4(position, 1.0);
          w.y = warpRoomY(w.y, -w.z, uExtraH);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D tLight, tLightFix;
        uniform float uScale, uFixScale, uBakeExp, uAmbientGain, uSpotGain, uSconceGain, uLightWarmth, uShadowDepth, uCeilShadowDepth, uWallWhite, uHasFixMaps, uHasCornerAO;
        uniform float uBakedV6, uArchS, uHalfW, uContrastFix, uSkylightMode;
        uniform float uCeilEnc, uCeilFixEnc, uCeilFixWeight, uSmaxCeil, uSmaxCeilFix, uExtGainCeil, uSconceCyclesGain;
        uniform vec2 uCeilLightSize, uCeilFixSize;
        uniform vec3 uSconceColorCorr, uSconceColorAlc, uTinAlbedoPhys;
        uniform vec4 uLay0, uLay1, uLay2, uLay3, uWinBay0, uWinBay1;
        varying vec2 vUv;
        varying vec3 vW, vN;
        varying vec4 vCol;
        ${LIGHT_COMMON_GLSL}
        ${OUTSIDE_LIGHT_CEIL_GLSL}

        void main() {
          float ax = abs(vW.x);
          float s = -vW.z;
          vec2 uvSample = vUv;
          if (uBakedV6 > 0.5 && s < uArchS + 0.05) {
            uvSample.y = max(uvSample.y, 0.205);
          }
          vec3 c = vec3(0.0);
          if (uCeilEnc > 0.5) {
            // Cycles multi-basis pure irradiance (enc > 1.5 = RGBA16F 1-tap; enc > 0.5 = RGBM-sqrt 4-tap; multiplies ONCE by uTinAlbedoPhys!):
            vec3 extSample = (uCeilEnc > 1.5)
              ? texture2D(tLight, uvSample).rgb
              : sampleRGBM4Tap(tLight, uvSample, uCeilLightSize, uSmaxCeil);
            if (uCeilFixWeight <= 0.5) {
              // V9 <-> C0x ceilRT already composites exact mix(cV9, cCyc, u)
              c = extSample;
            } else {
              vec3 cAmbC = extSample * (uExtGainCeil * uOutStrength * uBakeExp);
              float alcTintC = smoothstep(19.90, 20.58, s);
              vec3 scTintC = mix(uSconceColorCorr, uSconceColorAlc, alcTintC);
              float scLiveC = clamp(uSconceGain / 2.15, 0.0, 2.5);
              vec3 cFixC = (uCeilFixEnc > 1.5)
                ? (texture2D(tLightFix, uvSample).rgb * (uSconceCyclesGain * scLiveC * uBakeExp) * scTintC)
                : ((uCeilFixEnc > 0.5)
                    ? (sampleRGBM4Tap(tLightFix, uvSample, uCeilFixSize, uSmaxCeilFix) * (uSconceCyclesGain * scLiveC * uBakeExp) * scTintC)
                    : vec3(0.0));
              c = (cAmbC + cFixC) * uTinAlbedoPhys;
            }
          } else {
            float ceilWhiteGain = 1.0 + clamp(uWallWhite - 1.0, -0.30, 0.60) * 0.48;
            vec3 rawCeil = textureBicubic(tLight, uvSample, vec2(1024.0, 2048.0)).rgb * uScale;
            rawCeil = rawCeil / (vec3(1.0) + max(vec3(0.0), rawCeil - vec3(0.92)) * 0.58);
            vec3 cAmb = (rawCeil * 0.52 + vec3(0.10)) * (uBakeExp * uAmbientGain * ceilWhiteGain);
            vec3 cFix = vec3(0.0);
            if (uHasFixMaps > 0.5) {
              vec3 rf = textureBicubic(tLightFix, uvSample, vec2(512.0, 1024.0)).rgb;
              cFix = (rf.r * (0.68 * uSpotGain) * evalSpotKelvin(uLightWarmth)
                    + rf.g * (0.45 * uSconceGain) * evalSconceKelvin(uLightWarmth)) * (uFixScale * uBakeExp);
            }
            if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005) {
              vec4 cm = evalOutsideCeilMod(vW);
              cAmb = cAmb * cm.w + cm.rgb * (uBakeExp * ceilWhiteGain);
              cFix *= cm.w;
              float wSumCeil = max(1e-4, dot(uOutWeights, vec4(1.0)));
              float kCeil    = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
              float alcCeil  = smoothstep(19.6, 20.8, s);
              vec3 tgtCeil   = (uOutWeights.z * mix(vec3(1.09, 1.00, 0.89), vec3(0.90, 0.99, 1.09), alcCeil)
                              + uOutWeights.w * mix(vec3(1.26, 1.01, 0.74), vec3(1.16, 1.01, 0.82), alcCeil)
                              + uOutWeights.y * vec3(1.60, 0.91, 0.44)
                              + uOutWeights.x * mix(vec3(1.28, 0.98, 0.70), vec3(1.20, 1.00, 0.78), alcCeil)) / wSumCeil;
              float lumAmbC  = dot(cAmb, vec3(0.2126, 0.7152, 0.0722));
              float lumFixC  = dot(cFix, vec3(0.2126, 0.7152, 0.0722));
              cAmb = mix(cAmb, vec3(lumAmbC) * tgtCeil, 0.78 * kCeil);
              cFix = mix(cFix, vec3(lumFixC) * tgtCeil, 0.74 * kCeil);
            }
            c = cAmb + cFix;
          }

          float kCycC = clamp(uOutCyclesMix, 0.0, 1.0);
          vec3 camToC = cameraPosition - vW;
          float distC = length(camToC);
          vec3 V = camToC / max(distC, 1e-5);
          vec3 nFlat = normalize(cross(dFdx(vW), dFdy(vW)));
          if (dot(nFlat, vN) < 0.0) nFlat = -nFlat;
          float flatW = (kCycC > 0.0005)
            ? mix(mix(0.22, 0.92, uContrastFix), mix(0.85, 0.35, smoothstep(6.0, 18.0, distC)), kCycC)
            : mix(0.22, 0.92, uContrastFix);
          vec3 Nc = normalize(mix(vN, nFlat, flatW));

          float shPerim = clamp(uShadowDepth, 0.0, 2.2) * uContrastFix;
          float shTin   = clamp(uCeilShadowDepth, 0.0, 2.5) * uContrastFix;
          vec3 L_spine = normalize(vec3(vW.x, -0.32, 0.16));
          float spineRake = dot(Nc, L_spine);
          float cofferSlope = clamp(1.0 - abs(Nc.y), 0.0, 1.0);
          float cornerAO = (uHasCornerAO > 0.5) ? mix(1.0, smoothstep(0.18, 0.86, vCol.r), 0.10 * shPerim) : 1.0;
          float rawShade = cornerAO * (1.0 + shTin * (0.125 * Nc.z + 0.115 * spineRake - 0.195 * cofferSlope));
          float tinRelief = clamp(rawShade, 0.66, 1.16);
          c *= mix(tinRelief, mix(1.0, tinRelief, 0.55), kCycC);

          bool underRod = (s > 4.42 && s < uArchS - 0.62) || (s > uArchS + 0.60 && s < uArchS + 3.40);
          if (underRod) {
            c *= mix(0.88, 1.0, smoothstep(0.018, 0.068, ax));
          }

          float coatAtten = (kCycC > 0.0005) ? mix(1.0, mix(1.0, 0.35, smoothstep(6.0, 18.0, distC)), kCycC) : 1.0;
          float coat = pow(1.0 - max(dot(Nc, V), 0.0), 3.8) * 0.048 * coatAtten;
          c += c * coat;
          if (uInReflPass > 0.5) {
            float pkR = max(c.r, max(c.g, c.b));
            c *= 1.0 / (1.0 + max(0.0, pkR - 0.85) * 0.90);
          }
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          if (uInReflPass < 0.5) {
            gl_FragColor.rgb += ignDither(gl_FragCoord.xy) / 255.0;
          }
        }
      `,
    });

    // 2b. Backlit Milk-Glass Skylight Panes & Luminous Romanesque Bifora Morning Daylight Sky!
    this.milkLayMat = new THREE.ShaderMaterial({
      uniforms: { uLayX: { value: layXRange }, uExtraH: this.bakedU.uExtraH, ...SHARED_OUTSIDE_UNIFORMS },
      vertexShader: VERT_BAKE,
      fragmentShader: /* glsl */`
        uniform vec2 uLayX;
        uniform float uInReflPass;
        varying vec3 vW;
        void main() {
          float ax = abs(vW.x);
          float edgeX = smoothstep(0.0, 0.06, min(ax - uLayX.x, uLayX.y - ax));
          vec3 c = mix(vec3(2.25, 2.26, 2.30), vec3(3.15, 3.18, 3.24), edgeX);
          if (uInReflPass > 0.5) {
            float pkR = max(c.r, max(c.g, c.b));
            c *= 1.0 / (1.0 + max(0.0, pkR - 0.85) * 0.90);
          }
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    this.biforaSkyMat = new THREE.ShaderMaterial({
      uniforms: {
        uAmbientGain: this.bakedU.uAmbientGain,
        ...SHARED_OUTSIDE_UNIFORMS,
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        varying vec3 vW;
        void main() {
          vUv = uv;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uAmbientGain;
        uniform sampler2D tOutPlateA, tOutPlateB;
        uniform vec4 uOutPlateSlotA, uOutPlateSlotB;
        varying vec2 vUv;
        varying vec3 vW;
        ${OUTSIDE_LIGHT_GLSL}

        vec3 sampleConceptPlate(int idx, vec2 uv) {
          vec2 cuv = clamp(uv, 0.015, 0.985);
          float mA = (idx == 0) ? uOutPlateSlotA.x : ((idx == 1) ? uOutPlateSlotA.y : ((idx == 2) ? uOutPlateSlotA.z : uOutPlateSlotA.w));
          float mB = (idx == 0) ? uOutPlateSlotB.x : ((idx == 1) ? uOutPlateSlotB.y : ((idx == 2) ? uOutPlateSlotB.z : uOutPlateSlotB.w));
          if (mA > 0.5) return texture2D(tOutPlateA, cuv).rgb;
          if (mB > 0.5) return texture2D(tOutPlateB, cuv).rgb;
          return vec3(0.5);
        }

        void main() {
          // Baseline V9 luminous morning daylight (100% untouched when uOutWeights == 0):
          float yN0 = clamp((vW.y - 0.55) / 3.10, 0.0, 1.0);
          vec2 sunOff = vec2((vW.x - 0.14) / 0.92, (vW.y - 2.18) / 1.38);
          float sunBloom = exp(-dot(sunOff, sunOff) * 0.85);
          float softHaze = exp(-abs(vW.x) / 1.45);
          vec3 lowWarm  = vec3(2.55, 2.40, 2.12);
          vec3 midSun   = vec3(3.65, 3.52, 3.22);
          vec3 highSky  = vec3(2.95, 2.98, 3.05);
          vec3 baseSky  = mix(lowWarm, highSky, smoothstep(0.04, 0.92, yN0));
          vec3 rad = mix(baseSky, midSun, sunBloom * 0.76) * (0.90 + 0.14 * softHaze) * (0.72 + 0.52 * uAmbientGain);

          bool onSide = (-vW.z < 24.00);
          float uWin  = onSide ? (-vW.z - 22.02) : vW.x; // [-0.72 .. +0.72] across BOTH End & Right-Alcove Biforas!
          float yN    = clamp((vW.y - 0.60) / 2.88, 0.0, 1.0);
          float yN2   = clamp((vW.y - 0.60) / 3.02, 0.0, 1.0); // stays < 0.97 up to 3.55 m arch apex (0 top-arch streak!)
          // Pre-Flight Guard #4: True 3:4 aspect on BOTH Right-Alcove & End Biforas (mirrored cleanly to avoid Rorschach seam, 0-LSB V9!):
          vec2 plateUv = onSide
            ? vec2(clamp(0.50 - uWin / 1.62, 0.03, 0.97), clamp(yN * 0.90 + 0.05, 0.03, 0.97))
            : vec2(clamp(uWin / 1.62 + 0.50, 0.02, 0.98), clamp(yN * 0.92 + 0.04, 0.02, 0.98));

          float wSum = dot(uOutWeights, vec4(1.0));
          if (wSum > 0.0005 && uOutStrength > 0.0005) {
            vec3 cConcept = vec3(0.0);
            // Cycle 6 §2.2 #5: Zero-Endpoint-Bias Mist-Bridge Lerp weights (strictly 0.0 on EVERY settled mode!)
            float m23 = clamp(4.0 * uOutWeights.x * uOutWeights.y, 0.0, 1.0);
            float m43 = clamp(4.0 * uOutWeights.z * uOutWeights.y, 0.0, 1.0);

            // C04 — 6500K Museum North-Light Overcast (Cycle 7 §3.1: crisp volumetric silver-blue clouds, 0 grey milk veil!)
            if (uOutWeights.z > 0.001) {
              vec2 winUv4 = vec2(plateUv.x, mix(0.37, 0.97, yN));
              vec3 pl4 = sampleConceptPlate(2, winUv4);
              vec3 pl4Vol = mix(pl4, vec3(0.84, 0.90, 0.98), 0.05);
              vec3 sky4 = pow(max(pl4Vol, vec3(0.001)), vec3(1.28)) * vec3(0.96, 1.12, 1.34)
                        + mix(vec3(0.04, 0.08, 0.14), vec3(0.09, 0.12, 0.16), smoothstep(0.05, 0.90, yN));
              cConcept += uOutWeights.z * sky4;
            }

            // C05 — Warm 3900K Belgian Champagne Linen (Cycle 7 §3.2: luminous backlit sheer linen p95 ~246, Win>250 <= 1.5%!)
            if (uOutWeights.w > 0.001) {
              vec3 pl5Lo = 0.5 * (sampleConceptPlate(3, plateUv + vec2(0.018, 0.014)) + sampleConceptPlate(3, plateUv - vec2(0.018, 0.014)));
              pl5Lo = mix(vec3(dot(pl5Lo, vec3(0.2126, 0.7152, 0.0722))), pl5Lo, 0.55) * vec3(1.03, 0.99, 0.91);
              vec3 flaxBase = mix(vec3(1.46, 1.39, 1.25), pl5Lo * 1.62, 0.30) * mix(1.03, 0.94, smoothstep(0.55, 0.98, yN));
              vec2 uvFine5 = abs(fract(plateUv * 2.45) * 2.0 - 1.0) * 0.84 + 0.08;
              float lumHi5 = dot(sampleConceptPlate(3, uvFine5), vec3(0.2126, 0.7152, 0.0722));
              float threadTooth = clamp((lumHi5 - 0.785) * 0.85, -0.06, 0.06);
              float slubGrid = ((olNoise2(vec2(uWin * 4.5, vW.y * 52.0)) - 0.5) + (olNoise2(vec2(uWin * 48.0, vW.y * 4.8 + 3.7)) - 0.5)) * 0.036;
              vec2 dSun = vec2((uWin - (onSide ? -0.04 : 0.04)) / 0.65, (yN - 0.44) / 0.52);
              float r2Sun = dot(dSun, dSun);
              vec3 voile = flaxBase * (1.0 + (threadTooth + slubGrid) * mix(1.0, 0.55, exp(-r2Sun * 0.7)));
              vec3 coreGain = vec3(0.18, 0.17, 0.14) * exp(-r2Sun * 0.42);
              vec3 sky5 = voile + coreGain;
              cConcept += uOutWeights.w * sky5;
            }

            // C03 — Pure Golden-Amber Sunset (Cycle 7 §2.2: molten amber horizon + tightened Mie orb -> crisp right mullions!)
            if (uOutWeights.y > 0.001) {
              vec2 winUv3 = vec2(plateUv.x, mix(0.30, 0.965, yN));
              vec3 pl3 = sampleConceptPlate(1, winUv3);
              vec3 plate3 = pow(max(pl3, vec3(0.001)), vec3(1.02)) * vec3(1.48, 1.28, 0.74);
              vec3 lowAmb3  = vec3(2.25, 1.05, 0.16);
              vec3 midHon3  = vec3(2.15, 1.48, 0.56);
              vec3 highSky3 = vec3(1.58, 1.38, 0.88);
              vec3 grad3 = (yN < 0.46)
                ? mix(lowAmb3, midHon3, smoothstep(0.04, 0.46, yN))
                : mix(midHon3, highSky3, smoothstep(0.46, 0.94, yN));
              vec3 sky3 = mix(plate3, grad3, 0.34);
              if (onSide) {
                vec3 Vray = normalize(vW - cameraPosition);
                float sunCos = clamp(dot(Vray, L_ORB_C03), -1.0, 0.999999);
                float sunAng = acos(sunCos);
                float dCore  = sunAng / 0.042;
                sky3 += vec3(3.8, 3.0, 1.5) * exp(-(dCore * dCore))
                      + vec3(1.45, 0.92, 0.26) * exp(-sunAng / 0.085)
                      + vec3(0.24, 0.15, 0.05) * exp(-sunAng / 0.24);
              }
              cConcept += uOutWeights.y * sky3;
            }

            // C02 — Crisp f/4 Sunlit Courtyard Canopy v7 (Cycle 7 §1.1+§5.2: crisp emerald-to-sky contrast, 1:1 isotropic UV, 0.78 m23 dissolve!)
            if (uOutWeights.x > 0.001) {
              vec2 sway = vec2(sin(uOutTime * 0.42 + yN2 * 2.8) * 0.0035, cos(uOutTime * 0.34 + uWin * 2.2) * 0.0020);
              float uBase2 = onSide ? (0.56 - uWin / 3.60) : (0.44 + uWin / 3.60);
              vec2 uv2 = clamp(vec2(uBase2, mix(0.33, 0.955, yN2)) + sway, vec2(0.03, 0.32), vec2(0.97, 0.975));
              vec3 pl2 = sampleConceptPlate(0, uv2);
              float luma2 = dot(pl2, vec3(0.2126, 0.7152, 0.0722));
              vec3 sky2 = pow(max(pl2, vec3(0.001)), vec3(1.06)) * vec3(1.20, 1.18, 1.05) + vec3(0.025, 0.025, 0.015)
                        + vec3(0.78, 0.74, 0.56) * smoothstep(0.74, 0.96, luma2);
              if (m23 > 0.001) {
                sky2 = mix(sky2, vec3(1.68, 1.48, 1.08), 0.78 * m23);
              }
              cConcept += uOutWeights.x * sky2;
            }

            cConcept /= max(wSum, 1e-4);
            if (m43 > 0.001) {
              cConcept = mix(cConcept, vec3(1.52, 1.46, 1.32), 0.32 * m43 * (1.0 - 0.45 * yN));
            }
            float blendK = clamp(wSum * uOutStrength, 0.0, 1.0);
            float boostK = max(1.0, uOutStrength);
            // 50% V9 <-> C0x midpoint anti-double-exposure guard (strictly 0-LSB at wSum == 0, exact C0x at wSum == 1!):
            float midVC = clamp(wSum * (1.0 - wSum) * 4.0, 0.0, 1.0);
            vec3 radBase = rad * mix(1.0, 0.68, midVC);
            rad = mix(radBase, cConcept * boostK, blendK);
          }

          if (uInReflPass > 0.5) {
            float pkR = max(rad.r, max(rad.g, rad.b));
            rad *= 1.0 / (1.0 + max(0.0, pkR - 0.85) * 0.90);
          }

          gl_FragColor = vec4(rad, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    this.entranceSkyMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uAmbientGain: this.bakedU.uAmbientGain,
        uEntOpen: this.bakedU.uEntOpen,
        ...SHARED_OUTSIDE_UNIFORMS,
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        varying vec3 vW;
        void main() {
          vUv = uv;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uAmbientGain, uEntOpen;
        uniform sampler2D tOutPlateA, tOutPlateB;
        uniform vec4 uOutPlateSlotA, uOutPlateSlotB;
        varying vec2 vUv;
        varying vec3 vW;
        ${OUTSIDE_LIGHT_GLSL}

        vec3 sampleEntPlate(int idx, vec2 uv) {
          vec2 cuv = clamp(uv, 0.02, 0.98);
          float mA = (idx == 0) ? uOutPlateSlotA.x : ((idx == 1) ? uOutPlateSlotA.y : ((idx == 2) ? uOutPlateSlotA.z : uOutPlateSlotA.w));
          float mB = (idx == 0) ? uOutPlateSlotB.x : ((idx == 1) ? uOutPlateSlotB.y : ((idx == 2) ? uOutPlateSlotB.z : uOutPlateSlotB.w));
          if (mA > 0.5) return texture2D(tOutPlateA, cuv).rgb;
          if (mB > 0.5) return texture2D(tOutPlateB, cuv).rgb;
          return vec3(0.5);
        }

        void main() {
          // Baseline V9 warm morning sky beyond the grand entrance doors & fanlight:
          float yN = clamp(vW.y / 3.60, 0.0, 1.0);
          vec2 sunOff = vec2(vW.x / 1.15, (vW.y - 1.95) / 1.45);
          float sunCore = exp(-dot(sunOff, sunOff) * 0.85);
          vec3 lowGold = vec3(1.68, 1.44, 1.06);
          vec3 midGlow = vec3(2.85, 2.52, 1.98);
          vec3 highAir = vec3(2.05, 1.96, 1.78);
          vec3 sky = mix(lowGold, highAir, smoothstep(0.05, 0.92, yN));
          sky = mix(sky, midGlow, sunCore * (0.48 + 0.44 * uEntOpen));
          float gain = mix(0.66, 1.24, uEntOpen) * (0.76 + 0.42 * uAmbientGain);
          vec3 rad = sky * gain;

          float wSum = dot(uOutWeights, vec4(1.0));
          if (wSum > 0.0005 && uOutStrength > 0.0005) {
            float openBoost = mix(1.0, 1.12, uEntOpen);
            float openT = smoothstep(0.0, 0.14, uEntOpen);
            float m23E = clamp(4.0 * uOutWeights.x * uOutWeights.y, 0.0, 1.0);
            float m43E = clamp(4.0 * uOutWeights.z * uOutWeights.y, 0.0, 1.0);
            // Cycle 6 §2.2 + §5.2: Upper fanlight vista (vW.y >= 2.74 or closed) + Zero-Endpoint-Bias Mist-Bridge Lerp!
            float yFan  = clamp((vW.y - 2.98) / 0.88, 0.0, 1.0);
            float yFull = clamp((vW.y - 0.04) / 3.86, 0.0, 1.0);
            float uAsp  = clamp(vW.x / 2.90 + 0.50, 0.04, 0.96);
            float uEnt  = mix(clamp(vW.x / 2.10 + 0.50, 0.04, 0.96), uAsp, openT);
            float vOpen = clamp(0.02 + yFull * 0.95, 0.02, 0.98);
            vec3 eC = vec3(0.0);
            if (uOutWeights.z > 0.001) {
              vec2 entUv4 = vec2(uEnt, mix(mix(0.37, 0.97, yFan), vOpen, openT));
              vec3 pl4 = sampleEntPlate(2, entUv4);
              vec3 pl4VolE = mix(pl4, vec3(0.84, 0.90, 0.98), 0.05);
              vec3 sky4E = pow(max(pl4VolE, vec3(0.001)), vec3(1.28)) * vec3(0.96, 1.12, 1.34)
                         + mix(vec3(0.04, 0.08, 0.14), vec3(0.09, 0.12, 0.16), smoothstep(0.05, 0.90, yFan));
              eC += uOutWeights.z * sky4E * openBoost;
            }
            if (uOutWeights.w > 0.001) {
              vec2 entUv5 = vec2(uEnt, mix(clamp(0.38 + yFan * 0.54, 0.36, 0.94), vOpen, openT));
              vec3 pl5E = sampleEntPlate(3, entUv5);
              pl5E = mix(vec3(dot(pl5E, vec3(0.2126, 0.7152, 0.0722))), pl5E, 0.55) * vec3(1.03, 0.99, 0.91);
              vec2 uvFineE = abs(fract(entUv5 * 2.45) * 2.0 - 1.0) * 0.84 + 0.08;
              float toothE = clamp((dot(sampleEntPlate(3, uvFineE), vec3(0.2126, 0.7152, 0.0722)) - 0.785) * 0.80, -0.05, 0.05);
              vec2 dTr = vec2(vW.x / 1.20, (vW.y - mix(3.20, 2.15, openT)) / mix(0.62, 1.50, openT));
              vec3 linE = mix(vec3(1.48, 1.41, 1.27), pl5E * 1.64, 0.30) * (1.0 + toothE * 0.55)
                        + vec3(0.18, 0.17, 0.14) * exp(-dot(dTr, dTr) * 0.42);
              eC += uOutWeights.w * linE * openBoost;
            }
            if (uOutWeights.y > 0.001) {
              vec2 entUv3 = vec2(uEnt, mix(mix(0.30, 0.965, yFan), vOpen, openT));
              vec3 pl3 = sampleEntPlate(1, entUv3);
              float l3 = dot(pl3, vec3(0.2126, 0.7152, 0.0722));
              vec3 fanClosed3 = mix(vec3(2.75, 0.96, 0.14), vec3(2.05, 1.28, 0.38), smoothstep(0.08, 0.92, yFan))
                              * (1.0 + clamp((l3 - 0.52) * 0.22, -0.10, 0.10));
              vec3 plate3E = pow(max(pl3, vec3(0.001)), vec3(1.02)) * vec3(1.48, 1.28, 0.74);
              vec3 sky3E = mix(fanClosed3, plate3E, openT);
              eC += uOutWeights.y * sky3E * openBoost;
            }
            if (uOutWeights.x > 0.001) {
              vec2 swayE = vec2(sin(uOutTime * 0.40 + yFull * 2.4) * 0.0030, cos(uOutTime * 0.32 + vW.x * 1.8) * 0.0020);
              float uBase2E = clamp(0.50 + vW.x / 3.60, 0.04, 0.96);
              vec2 entUv2 = vec2(uBase2E, mix(mix(0.35, 0.94, yFan), vOpen, openT)) + swayE;
              entUv2.y = clamp(entUv2.y, mix(0.32, 0.02, openT), 0.975);
              vec3 pl2 = sampleEntPlate(0, entUv2);
              float luma2 = dot(pl2, vec3(0.2126, 0.7152, 0.0722));
              vec3 sky2E = pow(max(pl2, vec3(0.001)), vec3(1.06)) * vec3(1.20, 1.18, 1.05) + vec3(0.025, 0.025, 0.015)
                         + vec3(0.78, 0.74, 0.56) * smoothstep(0.74, 0.96, luma2);
              sky2E = mix(sky2E, vec3(1.75, 1.72, 1.48), 0.28 * smoothstep(0.25, 0.92, yFan) * (1.0 - openT));
              if (m23E > 0.001) {
                sky2E = mix(sky2E, vec3(1.68, 1.48, 1.08), 0.78 * m23E);
              }
              eC += uOutWeights.x * sky2E * openBoost;
            }
            eC /= max(wSum, 1e-4);
            if (m43E > 0.001) {
              eC = mix(eC, vec3(1.52, 1.46, 1.32), 0.32 * m43E * (1.0 - 0.45 * yFan));
            }

            // Cycle 7 §6.3: Row 5 Ray-Marched Virtual Courtyard Terrace (y=-0.02) + Sculpted AO Limestone Balustrade (z=+2.60) + Direction-Parallax Sky/Garden (+0 B VRAM, ZERO non-uniform fwidth UB!)
            if (uOutCyclesMix > 0.0005 && uEntOpen > 0.001 && vW.y < 2.74) {
              float wN = max(wSum, 1e-4);
              float f4 = uOutWeights.z / wN, f5 = uOutWeights.w / wN, f3 = uOutWeights.y / wN, f2 = uOutWeights.x / wN;
              vec3 Vext = normalize(vW - cameraPosition);
              float vzPos = max(Vext.z, 0.08);
              float tBal = (2.60 - cameraPosition.z) / vzPos;
              vec3 pBal  = cameraPosition + Vext * max(tBal, 0.0);
              float hitTerr = 0.0;
              vec3 pTerr = vec3(0.0);
              float zOutTerr = 99.0;
              if (Vext.y < -0.008) {
                float tG = (-0.02 - cameraPosition.y) / Vext.y;
                if (tG > 0.0) {
                  pTerr = cameraPosition + Vext * tG;
                  zOutTerr = pTerr.z + 3.60;
                  if (zOutTerr >= 0.0 && zOutTerr < 6.20) hitTerr = 1.0;
                }
              }

              // Concept 6.2 m aerial perspective haze palette:
              vec3 hazeCol = f4 * vec3(0.95, 1.02, 1.12) + f5 * vec3(1.38, 1.32, 1.20)
                           + f3 * vec3(1.65, 1.16, 0.56) + f2 * vec3(1.32, 1.26, 0.96);

              // Layer A: True Direction-Locked Parallax Sky/Garden Vista + Optical DOF
              float uDir = clamp(0.50 - (Vext.x / vzPos) * 0.55, 0.04, 0.96);
              float yAng = clamp((Vext.y / vzPos + 0.06) / 0.52, 0.0, 1.0);
              float vDir = clamp(mix(0.38, 0.95, yAng), 0.36, 0.96);
              vec2 dirUv = vec2(uDir, vDir);
              vec3 layerA = vec3(0.0);
              if (uOutWeights.z > 0.001) {
                vec3 pl4D = sampleEntPlate(2, dirUv);
                vec3 pl4DVol = mix(pl4D, vec3(0.84, 0.90, 0.98), 0.05);
                vec3 skyA4 = pow(max(pl4DVol, vec3(0.001)), vec3(1.28)) * vec3(0.96, 1.12, 1.34)
                           + mix(vec3(0.04, 0.08, 0.14), vec3(0.09, 0.12, 0.16), smoothstep(0.05, 0.90, yAng));
                float parkH4 = 0.20 + 0.07 * olNoise2(vec2(uDir * 6.0, 2.1));
                float parkM4 = 1.0 - smoothstep(parkH4 - 0.06, parkH4 + 0.10, yAng);
                skyA4 = mix(skyA4, vec3(0.58, 0.66, 0.75), 0.42 * parkM4);
                layerA += uOutWeights.z * skyA4;
              }
              if (uOutWeights.w > 0.001) {
                float farH5  = 0.34 + 0.09 * olNoise2(vec2(uDir * 4.5, 2.7)) + 0.04 * olNoise2(vec2(uDir * 11.0, 0.9));
                float nearH5 = 0.22 + 0.08 * olNoise2(vec2(uDir * 7.2, 1.3)) + 0.04 * olNoise2(vec2(uDir * 16.5, 4.1));
                float farM5  = 1.0 - smoothstep(farH5 - 0.08, farH5 + 0.09, yAng);
                float nearM5 = 1.0 - smoothstep(nearH5 - 0.06, nearH5 + 0.08, yAng);
                float dB5 = (uDir - 0.52) / 0.36;
                float sunBeam5 = exp(-(dB5 * dB5)) * (0.24 + 0.18 * (1.0 - yAng));
                vec3 skyA5 = mix(vec3(1.52, 1.46, 1.32), vec3(1.28, 1.24, 1.08), farM5 * 0.78);
                skyA5 = mix(skyA5, vec3(1.06, 1.02, 0.84), nearM5 * 0.82);
                skyA5 += vec3(0.24, 0.21, 0.15) * sunBeam5;
                layerA += uOutWeights.w * skyA5;
              }
              if (uOutWeights.y > 0.001) {
                vec2 dirUv3 = vec2(uDir, clamp(mix(0.30, 0.95, yAng), 0.30, 0.96));
                vec3 pl3D = sampleEntPlate(1, dirUv3);
                vec3 plate3D = pow(max(pl3D, vec3(0.001)), vec3(1.02)) * vec3(1.48, 1.28, 0.74);
                vec3 grad3D = (yAng < 0.46)
                  ? mix(vec3(2.25, 1.05, 0.16), vec3(2.15, 1.48, 0.56), smoothstep(0.04, 0.46, yAng))
                  : mix(vec3(2.15, 1.48, 0.56), vec3(1.58, 1.38, 0.88), smoothstep(0.46, 0.94, yAng));
                vec3 skyA3 = mix(plate3D, grad3D, 0.34);
                float roofH3 = 0.14 + 0.055 * step(0.55, olNoise2(vec2(floor(uDir * 10.0), 3.1))) + 0.045 * olNoise2(vec2(uDir * 8.5, 5.2));
                float silM3  = 1.0 - smoothstep(roofH3 - 0.025, roofH3 + 0.035, yAng);
                skyA3 = mix(skyA3, vec3(0.52, 0.26, 0.10), 0.62 * silM3);
                layerA += uOutWeights.y * skyA3;
              }
              if (uOutWeights.x > 0.001) {
                vec2 dofOff = vec2(0.004, 0.003);
                vec3 pl2D = 0.5 * (sampleEntPlate(0, dirUv + dofOff) + sampleEntPlate(0, dirUv - dofOff));
                float luma2D = dot(pl2D, vec3(0.2126, 0.7152, 0.0722));
                vec3 skyA2 = pow(max(pl2D, vec3(0.001)), vec3(1.06)) * vec3(1.20, 1.18, 1.05) + vec3(0.025, 0.025, 0.015)
                           + vec3(0.78, 0.74, 0.56) * smoothstep(0.74, 0.96, luma2D);
                skyA2 = mix(skyA2, vec3(1.48, 1.42, 1.14), 0.14);
                if (m23E > 0.001) skyA2 = mix(skyA2, vec3(1.68, 1.48, 1.08), 0.78 * m23E);
                layerA += uOutWeights.x * skyA2;
              }
              layerA /= wN;
              if (m43E > 0.001) {
                layerA = mix(layerA, vec3(1.52, 1.46, 1.32), 0.32 * m43E * (1.0 - 0.45 * yAng));
              }

              // Layer B: Sculpted 1862 Romanesque Limestone Balustrade at zBal = +2.60 (under-coping AO + 3D cylindrical turning + plinth AO!)
              vec3 virtualCourt = layerA;
              if (hitTerr < 0.5 && pBal.y > -0.02 && pBal.y < 1.08) {
                float isCoping = smoothstep(0.90, 0.93, pBal.y) * (1.0 - smoothstep(1.03, 1.06, pBal.y));
                float isPlinth = 1.0 - smoothstep(0.14, 0.18, pBal.y);
                float balSolid = 1.0 - smoothstep(0.28, 0.62, abs(cos(pBal.x * 11.5)));
                float pierM    = smoothstep(0.88, 0.95, abs(cos(pBal.x * 1.21)));
                float balMask  = clamp(max(max(isCoping, isPlinth), max(balSolid, pierM)), 0.0, 1.0)
                               * smoothstep(1.06, 1.03, pBal.y) * smoothstep(-0.02, 0.02, pBal.y);
                vec3 stoneBal = f4 * vec3(0.68, 0.74, 0.82) + f5 * vec3(1.02, 0.97, 0.88)
                              + f3 * vec3(1.14, 0.82, 0.42) + f2 * vec3(0.96, 0.90, 0.74);
                float underCopingAO = mix(1.0, 0.58, exp(-max(0.0, 0.90 - pBal.y) / 0.055) * step(pBal.y, 0.91));
                float balCyl = mix(1.0, 0.68 + 0.36 * smoothstep(-0.2, 0.8, sin(pBal.x * 11.5 + 0.7)), clamp(balSolid * (1.0 - max(isCoping, max(isPlinth, pierM))), 0.0, 1.0));
                float plinthAO = mix(0.62, 1.0, smoothstep(0.02, 0.18, pBal.y));
                float weather = 0.92 + 0.08 * olNoise2(pBal.xy * 5.2) + 0.04 * olNoise2(pBal.xy * 13.5);
                float balShade = weather * mix(1.0, 1.22, isCoping) * underCopingAO * balCyl * plinthAO;
                vec3 balCol = mix(stoneBal * balShade, hazeCol, 0.28);
                virtualCourt = mix(layerA, balCol, balMask);
              }

              // Layer C: True-Perspective Sunlit Limestone Terrace (zOut in [0.0, 6.2 m], analytical fwTerr -> ZERO non-uniform fwidth UB!)
              if (hitTerr > 0.5) {
                float fwTerr = clamp(max(0.012, zOutTerr * 0.008 / max(abs(Vext.y), 0.05)), 0.012, 0.25);
                vec2 stT = vec2(pTerr.x * 1.15, zOutTerr * 0.95);
                stT.x += floor(stT.y) * 0.47;
                vec2 fT = fract(stT);
                float jX = 1.0 - smoothstep(0.014, 0.026 + fwTerr * 1.1, min(fT.x, 1.0 - fT.x));
                float jY = 1.0 - smoothstep(0.014, 0.026 + fwTerr * 1.1, min(fT.y, 1.0 - fT.y));
                float mortT = clamp(max(jX, jY), 0.0, 1.0) * (1.0 - smoothstep(0.10, 0.22, fwTerr));
                float grainT = 0.94 + 0.10 * olNoise2(vec2(pTerr.x * 2.8, zOutTerr * 2.4))
                             + 0.04 * olHash21(floor(stT) + vec2(3.1, 7.4));
                float slabTex = clamp(grainT, 0.82, 1.14) * mix(1.0, 0.78, mortT);
                float dapple2T = smoothstep(0.28, 0.74, olNoise2(vec2(pTerr.x * 0.85 + sin(uOutTime * 0.35) * 0.04, zOutTerr * 0.80)));
                vec3 terrBase = f4 * vec3(0.48, 0.53, 0.60)
                              + f5 * vec3(0.86, 0.82, 0.73)
                              + f3 * vec3(0.82, 0.58, 0.28)
                              + f2 * (vec3(0.68, 0.63, 0.50) * mix(0.76, 1.18, dapple2T));
                float balEdgeAO = mix(1.0, 0.76, smoothstep(5.4, 6.2, zOutTerr));
                vec3 terrCol = mix(terrBase * (slabTex * balEdgeAO), hazeCol, 0.20 * smoothstep(1.8, 6.2, zOutTerr));
                virtualCourt = terrCol;
              }

              float openCourtK = clamp(uOutCyclesMix, 0.0, 1.0) * smoothstep(0.001, 0.05, uEntOpen);
              eC = mix(eC, virtualCourt * openBoost, openCourtK);
            }

            // 50% V9 <-> C0x midpoint anti-double-exposure guard (0-LSB at wSum == 0!):
            float midVC = clamp(wSum * (1.0 - wSum) * 4.0, 0.0, 1.0);
            vec3 radBase = rad * mix(1.0, 0.68, midVC);
            rad = mix(radBase, eC * max(1.0, uOutStrength), clamp(wSum * uOutStrength, 0.0, 1.0));
          }

          // Bug 2 Seal (0-LSB on V9): black out lower doorway behind closed doors so zero light leaks under 1.8 cm gap!
          if (uOutCyclesMix > 0.0005 && uEntOpen < 0.002 && vW.y < 2.74) {
            rad = vec3(0.0);
          }

          if (uInReflPass > 0.5) {
            float pkR = max(rad.r, max(rad.g, rad.b));
            rad *= 1.0 / (1.0 + max(0.0, pkR - 0.85) * 0.90);
          }

          gl_FragColor = vec4(rad, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    // 3. Deep-Shadow Architectural Satin-Enamel Millwork (`room_props` + `room_doors` + `room_end_leaf_L/R` + `astragal_end_L`):
    // Strictly 6 samplers: tFloorLight, tFloorFix, tCeilLight, tCeilFix, tWallNor, tProbeCube (from PROBE_CUBE_GLSL)!
    // Cycles mode decodes per-vertex RGBM-sqrt in vertex shader (0 M-seam fringes) + blends 6-face Ambient Cube on baseboard/crown!
    const makeEnamelMat = (albedoVec3, bevelContrast, isDoorLeaf) => new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        tFloorLight:    { value: pk.tFloor },
        tFloorFix:      { value: pk.tFloorF },
        tCeilLight:     { value: pk.tCeil },
        tCeilFix:       { value: pk.tCeilF },
        tWallNor:       { value: pk.tWallN },
        uCeilScale:     { value: ceilSc },
        uFixCeilScale:  { value: pk.meta.ceil_fix_scale || pk.meta.fix_scale || ceilSc },
        uFixFloorScale: { value: pk.meta.floor_fix_scale || pk.meta.fix_floor_scale || flSc },
        uAlbedo:        { value: albedoVec3 },
        uBevK:          { value: bevelContrast },
        uIsDoor:        { value: isDoorLeaf ? 1.0 : 0.0 },
        ...this.bakedU,
      },
      vertexShader: /* glsl */`
        uniform float uExtraH, uIsDoor;
        uniform float uTrimRadMix, uTrimExtMix, uSmaxTrimA, uSmaxTrimB, uSmaxTrimSc;
        uniform float uExtGainA, uExtGainB, uOutStrength, uSconceCyclesGain, uSconceGain, uBakeExp;
        attribute vec4 color;
        attribute vec4 aRadExtA;
        attribute vec4 aRadExtB;
        attribute vec4 aRadSconce;
        varying vec2 vUv;
        varying vec3 vW, vN;
        varying vec3 vObjPos, vObjNrm;
        varying vec4 vCol;
        varying vec3 vRadExt;
        varying vec3 vRadSc;
        ${WARP_Y_GLSL}
        vec3 vsDecodeRgbmsqrt(vec4 t, float sMax) {
          vec3 v = t.rgb * t.a;
          return (v * v) * sMax;
        }
        void main() {
          vUv = uv;
          vCol = color;
          vObjPos = position;
          vObjNrm = normalize(normal);
          vec4 w = modelMatrix * vec4(position, 1.0);
          if (uIsDoor < 0.5) w.y = warpRoomY(w.y, -w.z, uExtraH);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          if (uTrimRadMix > 0.0005) {
            vec3 eA = vsDecodeRgbmsqrt(aRadExtA, uSmaxTrimA) * uExtGainA;
            vec3 eExt = (uTrimExtMix > 0.0005)
              ? mix(eA, vsDecodeRgbmsqrt(aRadExtB, uSmaxTrimB) * uExtGainB, clamp(uTrimExtMix, 0.0, 1.0))
              : eA;
            vRadExt = eExt * (uOutStrength * uBakeExp);
            float scLiveT = clamp(uSconceGain / 2.15, 0.0, 2.5);
            vRadSc = vsDecodeRgbmsqrt(aRadSconce, uSmaxTrimSc) * (uSconceCyclesGain * scLiveT * uBakeExp);
          } else {
            vRadExt = vec3(0.0);
            vRadSc = vec3(0.0);
          }
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D tFloorLight, tFloorFix, tCeilLight, tCeilFix, tWallNor, tLeafCookie;
        uniform vec4 uFloorRect, uCeilRect, uWinBay0, uWinBay1;
        uniform vec2 uWinCut;
        uniform vec3 uAlbedo, uSconceColorCorr, uSconceColorAlc;
        uniform float uFloorScale, uCeilScale, uFixCeilScale, uFixFloorScale, uBakeExp;
        uniform float uAmbientGain, uSpotGain, uSconceGain, uLightWarmth, uShadowDepth, uHasFixMaps, uHasCornerAO;
        uniform float uBakedV6, uCeilH, uExtraH, uHalfW, uVH, uArchS, uBevK, uIsDoor;
        uniform float uContrastFix, uSkylightMode, uHideAlcoveWin, uWinLightMode, uWinDesign, uTime, uEntOpen;
        uniform float uTrimRadMix, uTrimProbeBlend;
        varying vec3 vW, vN;
        varying vec3 vObjPos, vObjNrm;
        varying vec4 vCol;
        varying vec3 vRadExt;
        varying vec3 vRadSc;
        ${LIGHT_COMMON_GLSL}
        ${WIN_SUN_GLSL}
        ${OUTSIDE_LIGHT_GLSL}
        ${PROBE_CUBE_GLSL}

        float sdBox2D(vec2 p, vec2 b) {
          vec2 q = abs(p) - b;
          return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
        }

        // Exact millimeter-verified 6-panel bolection door SDF + brass handle backplate contact-AO extracted from baked/room.glb:
        float evalDoorPanelSDF(bool isEntLeaf, vec3 objPos, vec3 wPos, float s, vec3 N) {
          float uP, yP, hU, uH, yH;
          vec2 r1, r2, r3;
          if (isEntLeaf) {
            uP = abs(objPos.x - 0.419) - 0.1715;
            yP = objPos.y;
            hU = 0.1235;
            r1 = vec2(0.605, 0.330);
            r2 = vec2(1.611, 0.496);
            r3 = vec2(2.4465, 0.1995);
            uH = objPos.x - 0.770;
            yH = 1.015;
          } else {
            float sC = (s < 11.6) ? 10.30 : ((s < 14.6) ? 12.90 : 16.28);
            uP = abs(s - sC) - 0.230;
            yP = wPos.y;
            hU = 0.182;
            r1 = vec2(0.620, 0.330);
            r2 = vec2(1.647, 0.517);
            r3 = vec2(2.5035, 0.1995);
            uH = (s - sC) - 0.470;
            yH = 1.030;
          }
          float d1 = sdBox2D(vec2(uP, yP - r1.x), vec2(hU, r1.y));
          float d2 = sdBox2D(vec2(uP, yP - r2.x), vec2(hU, r2.y));
          float d3 = sdBox2D(vec2(uP, yP - r3.x), vec2(hU, r3.y));
          float d = d1;
          float yTop = r1.x + r1.y;
          if (d2 < d) { d = d2; yTop = r2.x + r2.y; }
          if (d3 < d) { d = d3; yTop = r3.x + r3.y; }
          float rebateCrevice = exp(-(d * d) / (0.011 * 0.011));
          float innerRecess   = smoothstep(0.0, -0.042, d);
          float topRailCast   = innerRecess * exp(-max(0.0, yTop - yP) / 0.048);
          float bevelLipGleam = exp(-((d + 0.024) * (d + 0.024)) / (0.014 * 0.014)) * smoothstep(0.18, 0.72, N.y);
          float dHandle = sdBox2D(vec2(uH, yP - yH + 0.004), vec2(0.018, 0.084)) - 0.010;
          float handleAO = mix(0.78, 1.0, smoothstep(0.0, 0.014, max(0.0, dHandle)));
          return clamp(1.0 - 0.065 * rebateCrevice - 0.030 * innerRecess - 0.055 * topRailCast + 0.038 * bevelLipGleam, 0.88, 1.04) * handleAO;
        }

        bool inWinBay(vec4 bay, float x, float s, float y) {
          return bay.w > 0.5 && (x * bay.x > 0.85) && abs(s - bay.y) < bay.z && y < 3.60;
        }

        vec2 floorUV(float x, float s) {
          return vec2(
            clamp((x - uFloorRect.x) / (uFloorRect.y - uFloorRect.x), 0.03, 0.97),
            clamp(1.0 - (s - uFloorRect.z) / (uFloorRect.w - uFloorRect.z), 0.015, 0.985)
          );
        }
        vec2 ceilUV(float x, float s) {
          return vec2(
            clamp((x - uCeilRect.x) / (uCeilRect.y - uCeilRect.x), 0.03, 0.97),
            clamp(1.0 - (s - uCeilRect.z) / (uCeilRect.w - uCeilRect.z), 0.02, 0.98)
          );
        }

        void main() {
          float s = -vW.z;
          float effCeilH = uCeilH + uExtraH;
          if (inWinBay(uWinBay0, vW.x, s, vW.y) || inWinBay(uWinBay1, vW.x, s, vW.y)) discard;

          float kCycT = clamp(uOutCyclesMix, 0.0, 1.0);
          bool olActiveT = (kCycT <= 0.0005) && (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005);

          vec3 viewVec = cameraPosition - vW;
          vec3 vNf = (dot(vN, viewVec) < 0.0) ? -vN : vN;
          vec3 nFlat = normalize(cross(dFdx(vW), dFdy(vW)));
          if (dot(nFlat, viewVec) < 0.0) nFlat = -nFlat;
          float distTrim = length(viewVec);
          bool isEntLeaf = (uIsDoor > 0.5) && (s < 6.0);
          float flatCyc = (uIsDoor > 0.5)
            ? 0.06
            : mix(mix(0.62, 0.42, smoothstep(2.4, 3.0, vW.y)), 0.35, smoothstep(8.0, 18.0, distTrim));
          vec3 N = normalize(mix(vNf, nFlat, mix(mix(0.28, 0.96, uContrastFix), flatCyc, kCycT)));

          // Cycle 7 §6.1: Silky wide sun penumbra (softMult=4.5) + damped corridor side-door sun (0.12 vs ent 0.20 -> 0 d4 leaf seam!)
          vec3 doorSunRaw = (kCycT > 0.0005 && uIsDoor > 0.5)
            ? (evalUnifiedDirectSun(vW, N, 0.0, 4.5, tLeafCookie) * uBakeExp)
            : vec3(0.0);
          float doorSunK = isEntLeaf ? 0.20 : 0.12;
          vec3 doorSunT = (doorSunRaw / (vec3(1.0) + doorSunRaw * 0.55)) * doorSunK;

          float shK = clamp(uShadowDepth, 0.0, 2.2) * uContrastFix;
          float upperSmooth = (uIsDoor < 0.5) ? smoothstep(2.88, 3.05, vW.y) : 0.0;
          float aoClean   = (uHasCornerAO > 0.5) ? mix(smoothstep(0.16, 0.84, vCol.r), 1.0, upperSmooth) : 1.0;
          float aoCorner  = mix(1.0, mix(0.83, 1.0, aoClean), min(1.15, 0.65 * shK));
          float dirSpot   = (uHasCornerAO > 0.5) ? mix(vCol.g, 0.24, upperSmooth) : 0.35;
          float dirSconce = (uHasCornerAO > 0.5) ? mix(vCol.b, 0.16, upperSmooth) : 0.25;

          vec3 spotTint   = evalSpotKelvin(uLightWarmth);
          vec3 sconceTint = evalSconceKelvin(uLightWarmth);

          vec3 L_rod = normalize(vec3(-vW.x, max(0.32, (effCeilH - 0.14) - vW.y), 0.18));
          float dRod = dot(N, L_rod);

          // B3b: Gate object-space leaf locking STRICTLY on (isEntLeaf && kCycT > 0.0005) for V9 0-LSB identity!
          bool entLocal  = isEntLeaf && (kCycT > 0.0005);
          bool isEndWall = entLocal || (s < 4.10) || (s > uArchS + 3.65) || (abs(s - uArchS) < 0.36 && abs(vW.x) < uHalfW - 0.05);
          float sideTurn = entLocal ? abs(vObjNrm.x) : (isEndWall ? abs(N.x) : abs(N.z));
          float latSign  = entLocal ? vObjNrm.x      : (isEndWall ? N.x      : N.z);

          float bevGain = (0.50 + 0.88 * shK) * uBevK;
          float upTerm  =  0.085 * max(N.y, 0.0) - 0.145 * max(-N.y, 0.0);
          float rodTerm =  0.062 * dRod;
          float latTerm =  0.048 * max(latSign, 0.0) - 0.105 * max(-latSign, 0.0) - 0.095 * smoothstep(0.34, 0.90, sideTurn);
          float relief  = clamp(1.0 + bevGain * (upTerm + rodTerm + latTerm), 0.64, 1.15);

          float panelDrop = 0.0;
          if (uIsDoor > 0.5 && shK > 0.02) {
            float inRow1 = smoothstep(0.27, 0.30, vW.y) * (1.0 - smoothstep(0.91, 0.94, vW.y));
            float inRow2 = smoothstep(1.11, 1.14, vW.y) * (1.0 - smoothstep(2.13, 2.16, vW.y));
            float inRow3 = smoothstep(2.30, 2.33, vW.y) * (1.0 - smoothstep(2.66, 2.69, vW.y));
            float inPanelBand = max(max(inRow1, inRow2), inRow3);
            float ringSlope = smoothstep(0.08, 0.44, abs(N.y) + min(abs(N.x), abs(N.z)));
            float topBevelShadow = inPanelBand * clamp(-N.y, 0.0, 1.0);
            float entRelBoost = olActiveT ? mix(1.0, 1.55, clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0) * (1.0 - smoothstep(3.9, 4.4, s))) : 1.0;
            panelDrop = (0.042 * inPanelBand + 0.125 * ringSlope + 0.115 * topBevelShadow) * min(1.65, shK) * entRelBoost;
          } else if (shK > 0.02) {
            float quirkBand = smoothstep(0.208, 0.218, vW.y) * (1.0 - smoothstep(0.234, 0.244, vW.y));
            panelDrop += 0.105 * quirkBand * min(1.5, shK);
            if (s > uArchS + 3.70) {
              if (vW.y > 0.655) {
                float archBev = smoothstep(0.12, 0.55, abs(N.x) + abs(N.y)) * (1.0 - smoothstep(0.90, 0.99, abs(N.z)));
                panelDrop += (0.11 * archBev + 0.09 * clamp(-N.y, 0.0, 1.0)) * min(1.5, shK);
              } else {
                float underPerch = smoothstep(0.545, 0.600, vW.y) * (1.0 - smoothstep(0.630, 0.655, vW.y)) * clamp(-N.y, 0.0, 1.0);
                panelDrop += 0.14 * underPerch * min(1.5, shK);
              }
            }
          }
          float kOutAO = olActiveT ? clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0) : 0.0;
          float panelAO = clamp(1.0 - panelDrop, olActiveT ? mix(0.66, 0.58, kOutAO) : 0.66, 1.0);

          vec2 eUv = entLocal
            ? vec2(vObjPos.x * 3.2, vObjPos.y * 0.9)
            : (isEndWall ? vec2(vW.x * 3.2, vW.y * 0.9) : vec2(s * 3.2, vW.y * 0.9));
          float fwE = max(fwidth(eUv.x), fwidth(eUv.y));
          float brushFade = 1.0 / (1.0 + fwE * 42.0);
          vec2 nBrush = (texture2D(tWallNor, eUv).xy * 2.0 - 1.0) * brushFade;
          float brushTex = 1.0 + (nBrush.x * 0.018 + nBrush.y * 0.012);

          float floorAO = mix(1.0 - 0.06 * min(1.4, shK), 1.0, smoothstep(0.0, 0.055, vW.y));
          float ceilAO  = mix(1.0 - 0.05 * min(1.4, shK), 1.0, smoothstep(0.0, 0.075, effCeilH - vW.y));
          float shapedAO = clamp(aoCorner * relief * panelAO * brushTex * floorAO * ceilAO, olActiveT ? mix(0.56, 0.54, kOutAO) : 0.56, 1.15);
          vec3 shadowTint = vec3(pow(shapedAO, 0.96), pow(shapedAO, 1.00), pow(shapedAO, 1.06));

          vec3 v9Irr = vec3(0.0);
          vec3 envAmb = vec3(0.0);
          vec3 mullionBloomEmit = vec3(0.0);

          // B2 Guard: NEVER sample V9 tFloorLight/tCeilLight/tFloorFix/tCeilFix when evicted (uTrimRadMix >= 0.9995 || kCycT >= 0.9995)!
          if (uTrimRadMix < 0.9995 && kCycT < 0.9995) {
            float xSample = clamp(vW.x * 0.25, -0.55, 0.55);
            float sSample = clamp(s, uFloorRect.z + 1.15, uFloorRect.w - 1.65);
            vec2 fuv = floorUV(xSample, sSample);
            vec2 cuv = ceilUV(xSample, clamp(s, uCeilRect.z + 0.85, uCeilRect.w - 1.25));

            vec3 flRaw = clamp(texture2D(tFloorLight, fuv).rgb * (uFloorScale * 0.72), vec3(0.48), vec3(0.82));
            vec3 clRaw = (s < uArchS + 0.10) ? clamp(texture2D(tCeilLight, cuv).rgb * (uCeilScale * 0.64), vec3(0.54), vec3(0.86)) : (flRaw * 1.04);
            float hFrac = clamp(vW.y / max(effCeilH, 3.5), 0.0, 1.0);
            envAmb = (mix(flRaw, clRaw, smoothstep(0.05, 0.88, hFrac)) * 1.02 + vec3(0.135)) * uAmbientGain;

            float cjMul = 1.0;
            vec3 cjRim = vec3(0.0);
            float c04EndTrim = 0.0;
            if (!olActiveT) {
              if (s > uArchS + 3.55) {
                envAmb = min(envAmb, vec3(0.92 * max(0.60, uAmbientGain / 0.72)));
                float sillSun = smoothstep(0.58, 0.65, vW.y) * (1.0 - smoothstep(0.68, 0.85, vW.y)) * max(N.y, 0.0) * (1.0 - smoothstep(0.76, 0.96, abs(vW.x)));
                float revSun  = smoothstep(uArchS + 3.88, uArchS + 4.02, s) * (1.0 - smoothstep(0.68, 0.76, abs(vW.x))) * smoothstep(0.62, 0.70, vW.y);
                envAmb += vec3(1.06, 0.99, 0.88) * ((0.26 * sillSun + 0.22 * revSun) * max(0.55, uAmbientGain));
              }
            } else {
              vec4 outTrim = evalOutsideWallMod(vW, N);
              float kOutT0 = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
              float isBaseboard = 1.0 - smoothstep(0.28, 0.42, vW.y);
              vec3 trimAdd = outTrim.rgb * mix(0.76, 0.94, isBaseboard);
              trimAdd *= 1.0 / (1.0 + 0.32 * isBaseboard * dot(trimAdd, vec3(0.2126, 0.7152, 0.0722)));
              float c02ForeDoor = clamp(uOutWeights.x * uOutStrength, 0.0, 1.0) * (1.0 - smoothstep(11.5, 14.2, s)) * step(10.0, s) * step(0.0, -vW.x);
              float trimAmbW = (s < 19.90) ? mix(1.0, max(outTrim.w * 1.08, 0.46) * (1.0 - 0.14 * c02ForeDoor), kOutT0) : outTrim.w;
              vec3 envScaled = envAmb * trimAmbW;
              envAmb = envScaled + evalOutsideAmbGradeDelta(envScaled, s) + trimAdd;
              float c05AlcBase = clamp(uOutWeights.w * uOutStrength, 0.0, 1.0) * smoothstep(19.95, 20.55, s) * isBaseboard;
              if (c05AlcBase > 0.001) {
                envAmb = mix(envAmb, max(envAmb, vec3(0.66, 0.61, 0.52)), c05AlcBase);
              }
              bool onEndBifora  = (s > uArchS + 3.48);
              bool onSideBifora = (s > uArchS + 0.35 && vW.x > uVH - 0.18);
              if (onEndBifora) c04EndTrim = clamp(uOutWeights.z * uOutStrength, 0.0, 1.0);
              if (onEndBifora || onSideBifora) {
                if (onEndBifora) envAmb = min(envAmb, vec3(0.92 * max(0.60, uAmbientGain / 0.72)) + outTrim.rgb * 0.55);
                float uSpan = onEndBifora ? abs(vW.x) : abs(s - 22.02);
                float sillTop  = smoothstep(0.54, 0.60, vW.y) * (1.0 - smoothstep(0.72, 0.86, vW.y)) * smoothstep(0.35, 0.85, N.y) * (1.0 - smoothstep(0.76, 1.02, uSpan));
                float revDepth = onEndBifora ? smoothstep(uArchS + 3.84, uArchS + 4.02, s) : smoothstep(uVH - 0.12, uVH + 0.10, vW.x);
                float revSun   = revDepth * (1.0 - smoothstep(0.68, onEndBifora ? 0.78 : 0.80, uSpan)) * smoothstep(0.58, 0.70, vW.y);
                float wSumT = max(1e-4, dot(uOutWeights, vec4(1.0)));
                float kOutT = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
                vec3 cTint = (uOutWeights.z * vec3(0.84, 0.95, 1.06)
                            + uOutWeights.w * vec3(1.18, 1.10, 0.96)
                            + uOutWeights.y * vec3(1.48, 0.94, 0.40)
                            + uOutWeights.x * vec3(1.18, 1.12, 0.90)) / wSumT;
                vec3 sillDirect = (uOutWeights.z * vec3(0.56, 0.64, 0.74)
                                 + uOutWeights.w * vec3(1.18, 1.09, 0.92)
                                 + uOutWeights.y * vec3(1.48, 0.98, 0.44)
                                 + uOutWeights.x * vec3(1.24, 1.12, 0.84)) / wSumT;
                float voileShare = clamp(uOutWeights.w / wSumT, 0.0, 1.0);
                float inward = onEndBifora ? smoothstep(0.28, 0.85, N.z) : smoothstep(0.28, 0.85, -N.x);
                float edgeRim = 1.0 - inward;
                float rBifora  = (vW.y <= 2.74) ? uSpan : length(vec2(uSpan, vW.y - 2.74));
                float inGlaze  = (1.0 - smoothstep(0.65, 0.70, rBifora)) * smoothstep(0.635, 0.675, vW.y);
                float inOuter  = (1.0 - inGlaze) * (1.0 - smoothstep(0.94, 1.04, rBifora)) * smoothstep(0.56, 0.62, vW.y);

                float dyH5 = (vW.y - 1.66) / 0.86;
                float haloLocal5 = (vW.y > 0.64) ? (exp(-(dyH5 * dyH5)) * (1.0 - smoothstep(0.10, 0.64, uSpan))) : 0.0;
                float sunWrap3 = 0.0;
                if (onSideBifora && uOutWeights.y > 0.001 && vW.y > 0.65) {
                  vec3 Vray3 = normalize(vW - cameraPosition);
                  float sunCos3 = clamp(dot(Vray3, U_SUN_C03), -1.0, 0.999999);
                  float sunAng3 = acos(sunCos3);
                  sunWrap3 = exp(-(sunAng3 * sunAng3) / (0.20 * 0.20));
                }

                float silDark5 = mix(0.76, 0.94, haloLocal5);
                float silDark3 = onSideBifora ? mix(0.42, 1.08, sunWrap3) : 0.50;
                float silDark  = (uOutWeights.z * 0.68 + uOutWeights.w * silDark5 + uOutWeights.y * silDark3 + uOutWeights.x * 0.76) / wSumT;
                float cjTarget = (uOutWeights.z * 0.85 + uOutWeights.w * mix(0.90, 0.98, haloLocal5) + uOutWeights.y * mix(0.68, 1.04, sunWrap3) + uOutWeights.x * 0.85) / wSumT;
                if (onEndBifora && c04EndTrim > 0.001 && inOuter > 0.001) {
                  vec3 crispArchAmb = max(envAmb, vec3(0.52, 0.56, 0.62) * max(0.65, uAmbientGain / 0.39));
                  envAmb = mix(envAmb, crispArchAmb, c04EndTrim * inOuter);
                }
                float c05Outer = clamp(uOutWeights.w * uOutStrength, 0.0, 1.0) * inOuter;
                if (c05Outer > 0.001) {
                  envAmb = mix(envAmb, max(envAmb, vec3(0.68, 0.62, 0.51)), c05Outer);
                }
                envAmb *= mix(1.0, silDark, inward * kOutT * inGlaze);
                cjMul   = mix(1.0, mix(0.96, cjTarget, inGlaze), inward * kOutT * clamp(inGlaze + inOuter, 0.0, 1.0));
                cjRim   = cTint * (edgeRim * kOutT * (0.16 * revDepth * (1.0 - 0.35 * voileShare) * inGlaze + 0.08 * inOuter));
                cjRim  += sillDirect * ((sillTop + 0.24 * revSun * edgeRim) * kOutT);
                if (uOutWeights.w > 0.001 && haloLocal5 > 0.001) {
                  cjRim += vec3(0.10, 0.088, 0.066) * (uOutWeights.w * uOutStrength * haloLocal5 * inGlaze);
                }
                if (sunWrap3 > 0.001) {
                  cjRim += vec3(1.52, 0.96, 0.36) * (uOutWeights.y * uOutStrength * sunWrap3 * (0.60 * inGlaze + 0.45 * edgeRim));
                }
              }
            }
            if (uIsDoor < 0.5 && vW.y < 1.25) {
              envAmb += evalSideWindowSun(vW, N, 0.0) * 0.85;
            }

            vec3 giFix = vec3(0.0);
            if (uHasFixMaps > 0.5) {
              vec3 ff = texture2D(tFloorFix, fuv).rgb * uFixFloorScale;
              vec3 cf = texture2D(tCeilFix, cuv).rgb * uFixCeilScale;
              vec3 bf = mix(ff, cf, smoothstep(0.08, 0.86, hFrac));
              giFix = bf.r * (0.65 * uSpotGain) * spotTint + bf.g * (0.38 * uSconceGain) * sconceTint;
            }

            float spotFacing   = clamp(0.55 + 0.45 * dRod, 0.0, 1.20);
            float sconceFacing = clamp(0.60 + 0.40 * (1.0 - 0.50 * sideTurn), 0.25, 1.15);
            vec3 directFix = dirSpot * spotFacing * (0.24 * uSpotGain) * spotTint
                           + dirSconce * sconceFacing * (0.20 * uSconceGain) * sconceTint;

            if (!olActiveT) {
              v9Irr = (envAmb + giFix * 0.55) * shadowTint + directFix * mix(0.65, 1.0, aoClean);
            } else {
              float portalTrim = smoothstep(19.90, 20.58, s);
              float wSumTr     = max(1e-4, dot(uOutWeights, vec4(1.0)));
              float kOutTrim   = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
              float c05ShareTr = clamp(uOutWeights.w / wSumTr, 0.0, 1.0);
              float entDoorCJ  = mix(mix(0.76, 0.88, c05ShareTr), 1.0, smoothstep(3.85, 4.75, s));
              float giMulT     = mix(1.0, mix(mix(0.42, 0.58, c05ShareTr), 0.88, portalTrim), kOutTrim);
              float dirMulT    = mix(1.0, mix(mix(0.48, 0.64, c05ShareTr), 0.92, portalTrim), kOutTrim);
              vec3 giGraded    = giFix + evalOutsideAmbGradeDelta(giFix, s);
              vec3 dirGraded   = directFix + evalOutsideAmbGradeDelta(directFix, s) * 0.75;
              v9Irr = ((envAmb + giGraded * (0.55 * giMulT)) * shadowTint + dirGraded * dirMulT * mix(0.65, 1.0, aoClean)) * mix(1.0, entDoorCJ, kOutTrim);
              if (c04EndTrim > 0.001) {
                vec3 coolEndIrr = (envAmb + giGraded * 0.22) * shadowTint + dirGraded * 0.32 * mix(0.65, 1.0, aoClean);
                float lumEnd = dot(coolEndIrr, vec3(0.2126, 0.7152, 0.0722));
                v9Irr = mix(v9Irr, mix(coolEndIrr, vec3(lumEnd) * vec3(0.94, 1.00, 1.06), 0.58), c04EndTrim);
              }
              v9Irr = v9Irr * cjMul + cjRim;
            }
          }

          // B5d: Extracted backlit mullion light-wrap (runs in BOTH Cycles & fallback; uIsDoor < 0.5; damped 0.35x in reflRT!):
          if (uIsDoor < 0.5 && dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005) {
            bool onEndBifM  = (s > uArchS + 3.48);
            bool onSideBifM = (s > uArchS + 0.35 && vW.x > uVH - 0.18);
            if (onEndBifM || onSideBifM) {
              float uSpanM = onEndBifM ? abs(vW.x) : abs(s - 22.02);
              float rBifM  = (vW.y <= 2.74) ? uSpanM : length(vec2(uSpanM, vW.y - 2.74));
              float inGlazeM = (1.0 - smoothstep(0.65, 0.70, rBifM)) * smoothstep(0.635, 0.675, vW.y);
              float inOuterM = (1.0 - inGlazeM) * (1.0 - smoothstep(0.94, 1.04, rBifM)) * smoothstep(0.56, 0.62, vW.y);
              if (uOutWeights.w > 0.001 && vW.y > 0.64) {
                float dyH5M = (vW.y - 1.66) / 0.86;
                float haloLocal5M = exp(-(dyH5M * dyH5M)) * (1.0 - smoothstep(0.10, 0.64, uSpanM));
                mullionBloomEmit += vec3(0.24, 0.225, 0.195) * (uOutWeights.w * uOutStrength * ((0.55 + 0.45 * haloLocal5M) * inGlazeM + 0.26 * inOuterM));
              }
              if (uOutWeights.y > 0.001 && vW.y > 0.65) {
                if (onSideBifM) {
                  vec3 VrayM = normalize(vW - cameraPosition);
                  float sunCosM = clamp(dot(VrayM, L_ORB_C03), -1.0, 0.999999);
                  float sunAngM = acos(sunCosM);
                  float sunWrap3M = exp(-(sunAngM * sunAngM) / (0.15 * 0.15));
                  mullionBloomEmit += vec3(0.22, 0.16, 0.07) * (uOutWeights.y * uOutStrength * sunWrap3M * (0.42 * inGlazeM + 0.18 * inOuterM));
                }
                mullionBloomEmit += vec3(0.08, 0.06, 0.025) * (uOutWeights.y * uOutStrength * inGlazeM);
              }
              if (uOutWeights.z > 0.001 && vW.y > 0.64) {
                mullionBloomEmit += vec3(0.09, 0.105, 0.125) * (uOutWeights.z * uOutStrength * inGlazeM);
              }
              if (uOutWeights.x > 0.001 && vW.y > 0.64) {
                float dOcM = length(vec2(uSpanM, vW.y - 3.175));
                mullionBloomEmit += vec3(0.14, 0.135, 0.105) * (uOutWeights.x * uOutStrength * (0.42 + 0.58 * exp(-(dOcM * dOcM) / 0.28)) * inGlazeM);
              }
            }
            if (s < 4.10 && vW.y > 2.76 && abs(vW.x) < 0.92) {
              vec2 dFanSpoke = vec2(vW.x / 0.58, (vW.y - 3.08) / 0.34);
              float fanSpokeWrap = (1.0 - smoothstep(3.85, 4.10, s)) * smoothstep(2.78, 2.92, vW.y) * exp(-dot(dFanSpoke, dFanSpoke));
              mullionBloomEmit += (uOutWeights.w * vec3(0.14, 0.13, 0.11) + uOutWeights.y * vec3(0.34, 0.18, 0.06) + uOutWeights.z * vec3(0.08, 0.10, 0.13) + uOutWeights.x * vec3(0.12, 0.12, 0.09)) * (uOutStrength * fanSpokeWrap);
            }
            if (uInReflPass > 0.5) mullionBloomEmit *= 0.35;
          }

          vec3 totalIrr = v9Irr;
          if (kCycT > 0.0005) {
            float alcTintT = smoothstep(19.90, 20.58, s);
            vec3 scTintSpatial = mix(uSconceColorCorr, uSconceColorAlc, alcTintT);
            vec3 cycRad;
            if (uIsDoor > 0.5) {
              // Cycle 6 §5.1 #1-2: Naturally backlit closed (0.96x, +0.06 +Y) & swinging (0.76x + 0.58 rim) entrance leaves; side doors 1.32x!
              vec3 doorSamplePos = vW + N * (isEntLeaf ? 0.14 : 0.22);
              if (isEntLeaf) {
                doorSamplePos.z = min(doorSamplePos.z, -3.78);
              } else {
                doorSamplePos.x = clamp(doorSamplePos.x, -1.56, 1.56);
              }
              float openT_d = smoothstep(0.0, 0.25, uEntOpen);
              float doorGain = isEntLeaf ? mix(0.86, 0.74, openT_d) : 1.30;
              if (uHasProbeCube > 0.5) {
                vec3 pDoor = sampleProbeCube(doorSamplePos, N);
                if (isEntLeaf) {
                  vec3 pUp = sampleProbeCube(doorSamplePos, vec3(0.0, 1.0, 0.0));
                  pDoor = mix(pDoor, pUp, 0.06);
                  float wSumM0 = max(1e-4, dot(uOutWeights, vec4(1.0)));
                  vec3 doorModeTint = (uOutWeights.z * vec3(0.95, 0.99, 1.05)
                                     + uOutWeights.w * vec3(1.03, 1.00, 0.94)
                                     + uOutWeights.x * vec3(1.04, 1.00, 0.91)
                                     + uOutWeights.y * vec3(1.14, 0.96, 0.72)) / wSumM0;
                  float pDoorL = dot(pDoor, vec3(0.2126, 0.7152, 0.0722));
                  pDoor = mix(pDoor, vec3(pDoorL) * doorModeTint, 0.34);
                }
                if (vW.y < 0.85) {
                  vec3 pMid = sampleProbeCube(vec3(doorSamplePos.x, 1.65, doorSamplePos.z), N);
                  pDoor = mix(pDoor, pMid, 0.40 * smoothstep(0.85, 0.15, vW.y));
                }
                cycRad = pDoor * (doorGain * uBakeExp);
              } else {
                cycRad = (vRadExt + vRadSc * scTintSpatial) * doorGain;
              }
              if (isEntLeaf && uEntOpen > 0.001) {
                float wSumD = max(1e-4, dot(uOutWeights, vec4(1.0)));
                vec3 entTint = (uOutWeights.z * vec3(0.84, 0.96, 1.14)
                              + uOutWeights.w * vec3(1.14, 1.06, 0.90)
                              + uOutWeights.y * vec3(1.36, 0.94, 0.44)
                              + uOutWeights.x * vec3(1.16, 1.06, 0.78)) / wSumD;
                float latchW    = 0.35 + 0.65 * smoothstep(0.0, 0.838, vObjPos.x);
                float openSm    = smoothstep(0.0, 0.90, uEntOpen);
                // Cycle 7 §6.3: Subtle open jamb bounce (0.12) + crisp grazing exterior rim-wrap ONLY on bevels & leading latch stile (0.78)!
                cycRad += entTint * (0.12 * openSm * latchW * uBakeExp);
                vec3 Vd = normalize(cameraPosition - vW);
                float rimGrazeD = pow(clamp(1.0 - max(dot(N, Vd), 0.0), 0.0, 1.0), 2.4) * smoothstep(-0.35, 0.65, dot(N, vec3(0.0, 0.12, 0.99)));
                float latchEdge = smoothstep(0.58, 0.838, vObjPos.x);
                cycRad += entTint * (0.78 * openSm * rimGrazeD * (0.35 + 0.65 * latchEdge) * uBakeExp);
                float swingBotAO = mix(1.0, mix(0.72, 1.0, smoothstep(0.0, 0.09, vW.y)), smoothstep(0.02, 0.15, uEntOpen));
                cycRad *= swingBotAO;
              }
              cycRad += doorSunT;
            } else {
              vec3 vertRad = vRadExt + vRadSc * scTintSpatial;
              float corrMask = 1.0 - smoothstep(19.6, 20.4, s);
              float probeW = (uTrimRadMix <= 0.0005)
                ? clamp(uTrimProbeBlend, 0.0, 1.0)
                : clamp(mix(uTrimProbeBlend, 0.70, corrMask), 0.0, 1.0);
              cycRad = vertRad;
              if (uHasProbeCube > 0.5 && probeW > 0.0005) {
                vec3 probeRad = sampleProbeCube(vW, N) * uBakeExp;
                cycRad = mix(vertRad, probeRad, probeW);
              }
              if (uEntOpen > 0.001 && s < 4.50) {
                float wSumP = max(1e-4, dot(uOutWeights, vec4(1.0)));
                vec3 entTintP = (uOutWeights.z * vec3(0.84, 0.96, 1.14)
                               + uOutWeights.w * vec3(1.14, 1.06, 0.90)
                               + uOutWeights.y * vec3(1.36, 0.94, 0.44)
                               + uOutWeights.x * vec3(1.16, 1.06, 0.78)) / wSumP;
                float openSmP = smoothstep(0.0, 0.90, uEntOpen);
                cycRad += entTintP * (0.24 * openSmP * smoothstep(4.35, 3.65, s) * uBakeExp);
              }
              if (vW.y < 1.25) {
                cycRad += evalSideWindowSun(vW, N, 0.0) * 0.85;
              }
              // Cycle 5 §2.2 #3: Backlit Window Mullion & Fanlight Spoke Counter-Light Silhouettes (0-LSB on V9!)
              bool onEndBifC  = (s > uArchS + 3.48);
              bool onSideBifC = (s > uArchS + 0.35 && vW.x > uVH - 0.18);
              bool onEntFanC  = (s < 4.08 && vW.y > 2.74 && abs(vW.x) < 0.92);
              float wSumM = max(1e-4, dot(uOutWeights, vec4(1.0)));
              if (onEndBifC || onSideBifC) {
                float uSp = onEndBifC ? abs(vW.x) : abs(s - 22.02);
                float rB  = (vW.y <= 2.74) ? uSp : length(vec2(uSp, vW.y - 2.74));
                float inGl = (1.0 - smoothstep(0.64, 0.70, rB)) * smoothstep(0.64, 0.68, vW.y);
                float inwd = onEndBifC ? smoothstep(0.25, 0.85, N.z) : smoothstep(0.25, 0.85, -N.x);
                float silK = (uOutWeights.y * 0.60 + uOutWeights.z * 0.78 + uOutWeights.w * 0.85 + uOutWeights.x * 0.76) / wSumM;
                cycRad *= mix(1.0, silK, inGl * inwd);
              }
              if (onEntFanC) {
                float inwdF = smoothstep(0.25, 0.85, -N.z);
                float inFanGl = smoothstep(2.77, 2.84, vW.y) * (1.0 - smoothstep(0.76, 0.86, length(vec2(vW.x, max(0.0, vW.y - 2.76) * 1.15))));
                float fanSil = (uOutWeights.y * 0.54 + uOutWeights.z * 0.74 + uOutWeights.w * 0.80 + uOutWeights.x * 0.66) / wSumM;
                cycRad *= mix(1.0, fanSil, inFanGl * inwdF);
              }
            }
            float sdfRelief = (uIsDoor > 0.5) ? evalDoorPanelSDF(isEntLeaf, vObjPos, vW, s, N) : 1.0;
            // brushTex is already inside shapedAO -> shadowTint (removed duplicate * brushTex)!
            vec3 cycIrr = cycRad * mix(vec3(1.0), shadowTint * sdfRelief, (uIsDoor > 0.5) ? 0.42 : 0.45);
            totalIrr = (kCycT >= 0.9995) ? cycIrr : mix(v9Irr, cycIrr, kCycT);
            envAmb = mix(envAmb, cycRad, kCycT);
          }

          // Cycle 5 §5 #1: Harmonize door albedo with flanking trim in Cycles (0-LSB on V9!)
          vec3 effAlb = mix(uAlbedo, vec3(0.932, 0.916, 0.886), kCycT * step(0.5, uIsDoor));
          vec3 c = totalIrr * effAlb * mix(uBakeExp, 1.0, kCycT);
          c += mullionBloomEmit * uBakeExp;

          vec3 V = normalize(cameraPosition - vW);
          float NoV = clamp(dot(N, V), 0.0, 1.0);
          float lagardeSpecOcc = clamp(pow(NoV + shapedAO, exp2(-16.0 * 0.34 - 1.0)) - 1.0 + shapedAO, 0.0, 1.0);
          float coatV9 = pow(clamp(1.0 - NoV, 0.0, 1.0), 4.0) * 0.045 * lagardeSpecOcc;
          vec3 H_rod = normalize(L_rod + V);
          float specV9 = pow(max(dot(N, H_rod), 0.0), 38.0) * 0.055 * max(0.20, dirSpot) * lagardeSpecOcc;
          vec3 specAddV9 = c * coatV9 + (uSpotGain * 0.22 * spotTint * (1.0 - 0.65 * kCycT) + envAmb * 0.28) * specV9;
          if (kCycT > 0.0005) {
            // Cycle 7 §6.1: Smooth semi-gloss architectural satin paint (deletes d4 bevel spikes, lifts closed/C03 doors out of flat clay!)
            float woodRough = 0.34;
            vec3 L_winAx = normalize(vec3(-vW.x * 0.25, 0.32, (s > 11.5) ? -0.92 : 0.92));
            float ggxWood = olGgxLobe(N, V, L_rod, woodRough) * 0.45 + olGgxLobe(N, V, L_winAx, woodRough) * 0.65;
            float fresSatin = pow(clamp(1.0 - NoV, 0.0, 1.0), 4.0) * 0.075 * lagardeSpecOcc;
            vec3 specAddCyc = (c * 0.65 + envAmb * 0.35) * fresSatin + envAmb * (ggxWood * 0.30 * lagardeSpecOcc);
            c += mix(specAddV9, specAddCyc, kCycT);
          } else {
            c += specAddV9;
          }

          if (uInReflPass > 0.5) {
            float pkR = max(c.r, max(c.g, c.b));
            c *= 1.0 / (1.0 + max(0.0, pkR - 0.85) * 0.90);
          }
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          if (uInReflPass < 0.5) {
            gl_FragColor.rgb += ignDither(gl_FragCoord.xy) / 255.0;
          }
        }
      `,
    });

    // Crisp Gallery White / Pearl Satin-Enamel Trim & 6-Panel Doors (lit fillets read crisp white; flutes & bolections carve rich dark shadows!):
    this.bakedTrimMat = makeEnamelMat(new THREE.Vector3(0.932, 0.916, 0.886), 1.18, false);
    this.bakedDoorMat = makeEnamelMat(new THREE.Vector3(0.916, 0.898, 0.866), 1.32, true);

    this.bakedDoorBrassMat = this.M.brass.clone();
    this.bakedDoorBrassMat.userData = { ...(this.bakedDoorBrassMat.userData || {}), _toneUniformsBound: true };
    this.bakedDoorBrassMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
      sh.uniforms.uWinBay0 = this.bakedU.uWinBay0;
      sh.uniforms.uWinBay1 = this.bakedU.uWinBay1;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vBrWorld;\nvarying vec3 vBrN;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvBrWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvBrN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform vec4 uWinBay0, uWinBay1;\nuniform float uOutCyclesMix;\nvarying vec3 vBrWorld;\nvarying vec3 vBrN;\n${PROBE_CUBE_GLSL}`)
        .replace('void main() {', `void main() {
          float sB = -vBrWorld.z;
          if ((uWinBay0.w > 0.5 && vBrWorld.x * uWinBay0.x > 0.85 && abs(sB - uWinBay0.y) < uWinBay0.z) ||
              (uWinBay1.w > 0.5 && vBrWorld.x * uWinBay1.x > 0.85 && abs(sB - uWinBay1.y) < uWinBay1.z)) discard;`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          vec3 nBr0 = normalize(vBrN);
          float fwBr = length(fwidth(nBr0));
          if (uOutCyclesMix > 0.0005 && uHasProbeCube > 0.5) {
            // Cycle 7 §6.2 (Pre-Flight Guard #2: uniform-flow fwBr outside if): True high-metalness dark-reflecting antique brass (0.035 dark floor + razor-sharp ribbons!)
            float kBr = clamp(uOutCyclesMix, 0.0, 1.0);
            vec3 nBr = nBr0;
            vec3 pBr = sampleProbeCube(vBrWorld + nBr * 0.04, nBr);
            float pBrL = dot(pBr, vec3(0.2126, 0.7152, 0.0722));
            vec3 pBrNorm = (pBrL < 0.28 && pBrL > 1e-4) ? (pBr * (0.28 / pBrL)) : max(pBr, vec3(0.18));
            vec3 Vbr = normalize(cameraPosition - vBrWorld);
            vec3 Rbr = reflect(-Vbr, nBr);
            float NoVb = clamp(dot(nBr, Vbr), 0.0, 1.0);
            float darkUnder = smoothstep(-0.45, 0.15, Rbr.y);
            float spPow = mix(26.0, 10.0, clamp(fwBr * 2.0, 0.0, 1.0));
            float envWin  = pow(clamp(abs(Rbr.z), 0.0, 1.0), spPow) * smoothstep(-0.10, 0.45, Rbr.y) * 4.4;
            float envCeil = pow(clamp(Rbr.y, 0.0, 1.0), spPow * 0.85) * 3.4;
            vec3 H_br = normalize(Vbr + normalize(vec3(0.22, 0.84, 0.48)));
            float anisoGlint = pow(clamp(dot(nBr, H_br), 0.0, 1.0), mix(44.0, 18.0, clamp(fwBr * 2.0, 0.0, 1.0))) * 2.6;
            float envMetal = 0.035 + 0.11 * darkUnder + envWin + envCeil + anisoGlint;
            vec3 F_brass = mix(vec3(0.84, 0.54, 0.16), vec3(1.00, 0.95, 0.80), pow(clamp(1.0 - NoVb, 0.0, 1.0), 5.0));
            vec3 darkBody = vec3(0.16, 0.09, 0.025) * (1.0 - darkUnder);
            vec3 brassPbr = (F_brass * envMetal + darkBody) * pBrNorm * mix(0.38, 1.0, smoothstep(0.04, 0.42, NoVb));
            reflectedLight.directDiffuse    = mix(reflectedLight.directDiffuse, vec3(0.0), kBr);
            reflectedLight.indirectDiffuse  = mix(reflectedLight.indirectDiffuse, vec3(0.006) * F_brass * pBrNorm, kBr);
            reflectedLight.directSpecular   = mix(reflectedLight.directSpecular, brassPbr * 0.65, kBr);
            reflectedLight.indirectSpecular = mix(reflectedLight.indirectSpecular, brassPbr * 0.95, kBr);
          }`);
    };
    this.bakedDoorGlassMat = this.M.glass.clone();
    this.bakedDoorGlassMat.userData = { ...(this.bakedDoorGlassMat.userData || {}), _toneUniformsBound: true };
    this.bakedDoorGlassMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
      sh.uniforms.uWinBay0 = this.bakedU.uWinBay0;
      sh.uniforms.uWinBay1 = this.bakedU.uWinBay1;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vBrWorld;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvBrWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec4 uWinBay0, uWinBay1;\nuniform vec4 uOutWeights;\nuniform float uOutStrength;\nuniform float uOutCyclesMix;\nvarying vec3 vBrWorld;')
        .replace('void main() {', `void main() {
          float sB = -vBrWorld.z;
          if ((uWinBay0.w > 0.5 && vBrWorld.x * uWinBay0.x > 0.85 && abs(sB - uWinBay0.y) < uWinBay0.z) ||
              (uWinBay1.w > 0.5 && vBrWorld.x * uWinBay1.x > 0.85 && abs(sB - uWinBay1.y) < uWinBay1.z)) discard;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005 && sB < 19.5) {
            float kGlTr = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
            float sideDoorFade = (sB > 5.5) ? mix(0.07, 0.34, clamp(uOutCyclesMix, 0.0, 1.0)) : 0.14;
            diffuseColor.a *= mix(1.0, sideDoorFade, kGlTr);
          }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          // Cycle 7 §4 (Pre-Flight Guard #1): Soft frosted backlit architectural glazing on corridor side-door transoms (0-LSB V9!)
          if (uOutCyclesMix > 0.0005 && sB > 5.5 && sB < 19.5 && dot(uOutWeights, vec4(1.0)) > 0.0005) {
            float wSG = max(1e-4, dot(uOutWeights, vec4(1.0)));
            float kG  = clamp(uOutCyclesMix * uOutStrength, 0.0, 1.0);
            float yG  = mix(0.78, 1.12, smoothstep(2.78, 3.40, vBrWorld.y));
            vec3 trGlow = (uOutWeights.z * vec3(0.18, 0.24, 0.31)
                         + uOutWeights.w * vec3(0.38, 0.33, 0.27)
                         + uOutWeights.y * vec3(0.36, 0.20, 0.07)
                         + uOutWeights.x * vec3(0.26, 0.21, 0.14)) / wSG;
            totalEmissiveRadiance += trGlow * (yG * kG);
          }`);
    };

    // 4. Authentic 1862 Flushing Town Hall Narrow Longitudinal Hardwood Strip Floor (`6.5 cm` American Cherry / Heart-Pine)!
    const dummyWhite = new THREE.DataTexture(new Uint8Array([200, 160, 120, 255]), 1, 1, THREE.RGBAFormat);
    dummyWhite.needsUpdate = true;
    const dummyNor = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1, THREE.RGBAFormat);
    dummyNor.needsUpdate = true;

    this.bakedFloorMat = new THREE.ShaderMaterial({
      uniforms: {
        tLight:      { value: pk.tFloor },
        tLightB:     { value: DUMMY_RGBMSQRT },
        tLightFix:   { value: pk.tFloorF },
        tLightFixB:  { value: DUMMY_RGBMSQRT },
        tStripDiff:  { value: pk.tStripD || pk.tWood },
        tStripNor:   { value: pk.tStripN || pk.tWoodN },
        tStripRgh:   { value: pk.tStripR || pk.tWoodR },
        tWood:       { value: pk.tWood },
        tWoodNor:    { value: pk.tWoodN },
        tWoodRgh:    { value: pk.tWoodR },
        tHerring:    { value: dummyWhite },
        tHerringNor: { value: dummyNor },
        uScale:      { value: flSc },
        uFixScale:   { value: pk.meta.floor_fix_scale || pk.meta.fix_floor_scale || flSc },
        ...this.bakedU,
      },
      vertexShader: /* glsl */`
        uniform mat4 uReflMatrix;
        varying vec2 vUv;
        varying vec3 vW, vN;
        varying vec4 vReflUv;
        void main() {
          vUv = uv;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          vReflUv = uReflMatrix * w;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        // Strictly 13 samplers (dropped dead tWallNor & B3 leaf-gobo; added tLightB & tLightFixB -> 0 floor RT!):
        uniform sampler2D tLight, tLightB, tLightFix, tLightFixB, tStripDiff, tStripNor, tStripRgh, tWood, tWoodNor, tWoodRgh, tHerring, tHerringNor, uRefl;
        uniform mat4 uReflMatrix;
        uniform float uScale, uFixScale, uBakeExp, uAmbientGain, uSpotGain, uSconceGain, uLightWarmth, uShadowDepth, uFloorDark, uHasFixMaps;
        uniform float uBakedV6, uFloorTone, uPlankAcross, uReflGain;
        uniform float uFloorMode, uContrastFix, uSkylightMode, uHideAlcoveWin, uHalfW, uVH, uArchS;
        uniform float uWinLightMode, uWinDesign, uTime, uEntOpen, uReflBlurred;
        uniform float uLightMix, uLightEncA, uLightEncB, uFloorFixEncA, uFloorFixEncB, uFloorFixMix;
        uniform float uSmaxFloorA, uSmaxFloorB, uSmaxFloorFixA, uSmaxFloorFixB, uExtGainA, uExtGainB, uSconceCyclesGain;
        uniform vec2 uWinCut, uFloorLightSizeA, uFloorLightSizeB, uFloorFixSizeA, uFloorFixSizeB;
        uniform vec3 uSconceColorCorr, uSconceColorAlc;
        uniform vec4 uWinBay0, uWinBay1;
        varying vec2 vUv;
        varying vec3 vW, vN;
        varying vec4 vReflUv;
        ${LIGHT_COMMON_GLSL}
        ${WIN_SUN_GLSL}
        ${OUTSIDE_LIGHT_GLSL}

        vec3 evalFloorAmbTerm(sampler2D tex, vec2 texSize, float enc, float sMax, float extGain) {
          if (enc > 1.5) {
            return texture2D(tex, vUv).rgb * (extGain * uOutStrength * uBakeExp);
          }
          if (enc > 0.5) {
            return sampleRGBM4Tap(tex, vUv, texSize, sMax) * (extGain * uOutStrength * uBakeExp);
          }
          vec3 rawFl = textureBicubic(tex, vUv, texSize).rgb * uScale;
          rawFl = rawFl / (vec3(1.0) + max(vec3(0.0), rawFl - vec3(0.95)) * 0.48);
          return (rawFl * 0.62 + vec3(0.07)) * (uBakeExp * (0.32 + 0.82 * uAmbientGain));
        }

        vec3 evalFloorFixTerm(sampler2D tex, vec2 texSize, float enc, float sMax, float sCoord) {
          if (enc > 0.5) {
            vec3 scTintF = mix(uSconceColorCorr, uSconceColorAlc, smoothstep(19.90, 20.58, sCoord));
            float scLiveF = clamp(uSconceGain / 2.15, 0.0, 2.5);
            vec3 rawF = (enc > 1.5) ? texture2D(tex, vUv).rgb : sampleRGBM4Tap(tex, vUv, texSize, sMax);
            return rawF * (uSconceCyclesGain * scLiveF * uBakeExp) * scTintF;
          }
          if (uHasFixMaps <= 0.5) return vec3(0.0);
          vec3 rf = textureBicubic(tex, vUv, texSize).rgb;
          return (rf.r * (0.75 * uSpotGain) * evalSpotKelvin(uLightWarmth)
                + rf.g * (0.52 * uSconceGain) * evalSconceKelvin(uLightWarmth)) * (uFixScale * uBakeExp);
        }

        void main() {
          float sCoord = -vW.z;
          vec3 ambA = evalFloorAmbTerm(tLight, uFloorLightSizeA, uLightEncA, uSmaxFloorA, uExtGainA);
          vec3 ambLight = (uLightMix > 0.0005)
            ? mix(ambA, evalFloorAmbTerm(tLightB, uFloorLightSizeB, uLightEncB, uSmaxFloorB, uExtGainB), clamp(uLightMix, 0.0, 1.0))
            : ambA;
          vec3 fixA = evalFloorFixTerm(tLightFix, uFloorFixSizeA, uFloorFixEncA, uSmaxFloorFixA, sCoord);
          vec3 fixLight = (uFloorFixMix > 0.0005)
            ? mix(fixA, evalFloorFixTerm(tLightFixB, uFloorFixSizeB, uFloorFixEncB, uSmaxFloorFixB, sCoord), clamp(uFloorFixMix, 0.0, 1.0))
            : fixA;

          float kCycF = clamp(uOutCyclesMix, 0.0, 1.0);
          bool olActiveF = (kCycF <= 0.0005) && (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005);
          // B4: Disable legacy R13 outSpecActive in Cycles mode (strictly gated on kCycF <= 0.0005)!
          bool outSpecActive = olActiveF;
          // B5a/B6a: Uniform-flow call to evalUnifiedDirectSun (tLightB carries tLeafCookie on C02 with +0 samplers!)
          vec3 dirSunF = (kCycF > 0.0005) ? (evalUnifiedDirectSun(vW, vec3(0.0, 1.0, 0.0), 1.0, 1.0, tLightB) * uBakeExp) : vec3(0.0);
          vec3 light;
          if (kCycF >= 0.9995) {
            // Pure Cycles multi-basis irradiance (bypasses +0.07 pedestal, 0.95 pre-clamp & analytical floor pools!):
            light = ambLight + fixLight + dirSunF + evalSideWindowSun(vW, vec3(0.0, 1.0, 0.0), 1.0);
          } else if (!olActiveF) {
            light = ambLight + fixLight + dirSunF * kCycF + evalSideWindowSun(vW, vec3(0.0, 1.0, 0.0), 1.0);
            if (sCoord > uArchS + 0.30) {
              float dWinS = max(0.0, (uArchS + 3.92) - sCoord);
              float winPool = exp(-dWinS / 2.35) * exp(-(vW.x * vW.x) / 0.88);
              light += vec3(1.06, 0.99, 0.89) * (0.26 * winPool * max(0.45, uAmbientGain) * (1.0 - kCycF));
            }
          } else {
            float portalFl = smoothstep(19.65, 21.10, sCoord);
            float wSumF    = max(1e-4, dot(uOutWeights, vec4(1.0)));
            float kOutFl   = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
            float corrFlTarget = (0.50 * uOutWeights.z + 0.62 * uOutWeights.w + 0.47 * uOutWeights.y + 0.48 * uOutWeights.x) / wSumF;
            float alcFlTarget  = (0.76 * uOutWeights.z + 0.84 * uOutWeights.w + 0.62 * uOutWeights.y + 0.64 * uOutWeights.x) / wSumF;
            float flAmbScale   = mix(1.0, mix(corrFlTarget, alcFlTarget, portalFl), kOutFl);
            light = ambLight * flAmbScale + fixLight * mix(1.0, 0.56, kOutFl * (1.0 - 0.55 * portalFl))
                  + evalSideWindowSun(vW, vec3(0.0, 1.0, 0.0), 1.0) + evalOutsideFloorAdd(vW) * uBakeExp;
            if (sCoord > uArchS + 0.30) {
              float dWinS = max(0.0, (uArchS + 3.92) - sCoord);
              float winPool = exp(-dWinS / 2.35) * exp(-(vW.x * vW.x) / 0.88);
              float warmKeep = (1.0 - 0.76 * clamp(uOutWeights.z * uOutStrength, 0.0, 1.0)) * flAmbScale;
              light += vec3(1.06, 0.99, 0.89) * (0.26 * winPool * max(0.45, uAmbientGain) * warmKeep);
            }
          }
          // Cycle 7 §6.3 (Pre-Flight Guard #4): Exact 80-deg swinging-door V-contact shadow (0-LSB on V9!) + rich dark-wood diffuse spill!
          float doorLeafShadow = 1.0;
          if (kCycF > 0.0005 && uEntOpen > 0.001 && sCoord < 6.0) {
            float angL = uEntOpen * 1.3963; // exact 80 deg max swing matching film.html:1182
            vec2 qL = vec2(abs(vW.x) - 0.838, sCoord - 3.60);
            vec2 dirLeaf = vec2(-cos(angL), sin(angL));
            vec2 outNormal = vec2(sin(angL), cos(angL));
            float alongL = dot(qL, dirLeaf);
            float projL = clamp(alongL, 0.0, 0.838);
            float dLeaf = length(qL - dirLeaf * projL);
            float underL = 1.0 - smoothstep(0.03, 0.16, dLeaf);
            float behindL = smoothstep(-0.04, 0.14, dot(qL, outNormal))
                          * smoothstep(-0.08, 0.10, alongL)
                          * (1.0 - smoothstep(0.75, 1.65, alongL))
                          * (1.0 - smoothstep(4.65, 5.85, sCoord))
                          * smoothstep(3.55, 3.70, sCoord);
            float shLeaf = clamp(max(underL, 0.82 * behindL) * smoothstep(0.05, 0.25, uEntOpen), 0.0, 1.0);
            doorLeafShadow = mix(1.0, 0.28, shLeaf * kCycF);
          }
          // Exterior daylight pouring across the wood floor as the grand entrance double doors open (concept-tinted on Cycles, 0-LSB on V9!):
          if (uEntOpen > 0.001 && sCoord < 14.5) {
            float dEntS = max(0.0, sCoord - 3.55);
            float doorHalfW = 0.84 + dEntS * 0.165;
            float edgeX = 1.0 - smoothstep(doorHalfW * 0.42, doorHalfW * 1.15, abs(vW.x));
            float softWrap = exp(-(vW.x * vW.x) / (1.55 + dEntS * 0.55));
            float reach = exp(-dEntS / 4.85) * (1.0 - smoothstep(8.8, 14.2, sCoord));
            float beamMask = (0.72 * edgeX + 0.28 * softWrap) * reach;
            vec3 entFloorCol = vec3(1.28, 1.12, 0.88);
            if (kCycF > 0.0005) {
              float wSumEF = dot(uOutWeights, vec4(1.0));
              vec3 cycEntCol = (wSumEF > 1e-3)
                ? ((uOutWeights.z * vec3(0.86, 1.02, 1.24)
                  + uOutWeights.w * vec3(1.18, 1.12, 0.98)
                  + uOutWeights.y * vec3(1.42, 0.96, 0.44)
                  + uOutWeights.x * vec3(1.22, 1.12, 0.82)) / wSumEF)
                : entFloorCol;
              entFloorCol = mix(entFloorCol, cycEntCol, kCycF);
            }
            light += entFloorCol * (mix(2.65, 3.85, kCycF) * doorLeafShadow * uEntOpen * beamMask);
          }

          float hwHere = (sCoord > uArchS + 0.22) ? uVH : uHalfW;
          float dWall = max(0.0, hwHere - abs(vW.x));
          float shFl = mix(1.0, 1.0 + 0.14 * clamp(uShadowDepth, 0.0, 2.0), uContrastFix);
          float wallEdgeAO = pow(mix(1.0, mix(0.88, 1.0, smoothstep(0.0, 0.24, dWall)), uContrastFix), shFl);
          light *= mix(wallEdgeAO, mix(1.0, wallEdgeAO, 0.55), kCycF);

          vec3 surfAlb;
          vec3 nMap;
          float roughVal;
          float clearcoatBoost = 1.05;
          float maxReflCap = mix(0.22, 0.28, uContrastFix);
          float specGainK  = 1.0;
          float specOcc    = 1.0;

          // Physical 16-strip tile scale: 1.04 m across X (16 x 6.5 cm longitudinal strips) x 2.60 m along S!
          vec2 stripUv = vec2(vW.x / 1.04, sCoord / 2.60);
          float fwStrip = max(fwidth(stripUv.x), fwidth(stripUv.y));
          // Attenuate micro-normal ripple smoothly in the far corridor -> ZERO distant Moire shimmer!
          // Cycle 7 §5.1: Alcove-only stability lock (inAlcoveF = 0.0 in TL corridor s < 18.8 -> 0-LSB on V9!)
          float inAlcoveF = smoothstep(18.8, 21.0, sCoord);
          float alcNormCalm = (kCycF > 0.0005) ? mix(1.0, mix(1.0, 0.42, kCycF), inAlcoveF) : 1.0;
          float normFade = (1.0 / (1.0 + fwStrip * 18.0)) * alcNormCalm;

          // uFloorDark (Floor Blacks slider in Lab):
          //   0.0 (0%)   = exact v6 warm Cherry-Cognac baseline
          //   1.0 (100%) = subtle, refined ~14% darkening of brightness & deeper grain/seam blacks ★
          //   2.0 (200%) = deep roasted cherry-espresso
          float dK = clamp(uFloorDark, 0.0, 2.0);
          float expShift  = 1.0 + 0.10 * dK;
          float brightMul = clamp(1.0 - 0.11 * dK, 0.72, 1.05);

          if (uFloorMode < 0.5) {
            // Mode 0 (Default ★): 1862 Flushing Town Hall Warm Cherry-Cognac Strips with Subtle Darkened Blacks!
            vec3 stTex = texture2D(tStripDiff, stripUv).rgb;
            nMap       = (texture2D(tStripNor, stripUv).xyz * 2.0 - 1.0) * normFade;
            float rgh  = (kCycF <= 0.0005)
              ? textureLod(tStripRgh, stripUv, 0.0).r
              : mix(0.50, texture2D(tStripRgh, stripUv).r, normFade);
            float lumaW = dot(stTex, vec3(0.299, 0.587, 0.114));
            float seamBlack = mix(1.0, mix(0.58, 1.0, smoothstep(0.10, 0.36, lumaW)) * (1.0 - 0.22 * smoothstep(0.18, 0.58, abs(nMap.x))), min(1.5, 0.60 * dK));
            vec3 cherryPatina = pow(max(stTex, vec3(0.001)), vec3(1.28 * expShift)) * vec3(0.76, 0.50, 0.34) * (uFloorTone * brightMul * seamBlack);
            surfAlb  = cherryPatina * (1.0 + nMap.x * 0.044 + nMap.y * 0.024);
            roughVal = mix(0.11, 0.24, rgh);
            specOcc  = mix(1.0, smoothstep(0.12, 0.34, lumaW) * (1.0 - 0.45 * smoothstep(0.22, 0.60, abs(nMap.x))), min(1.0, 0.65 * dK));
            clearcoatBoost = 1.10;
            maxReflCap = 0.26;
            specGainK  = 1.08;
          } else if (uFloorMode < 1.5) {
            // Mode 1: Saddle-Chestnut Longitudinal Strips ★
            vec3 stTex = texture2D(tStripDiff, stripUv).rgb;
            nMap       = (texture2D(tStripNor, stripUv).xyz * 2.0 - 1.0) * normFade;
            float rgh  = (kCycF <= 0.0005)
              ? textureLod(tStripRgh, stripUv, 0.0).r
              : mix(0.50, texture2D(tStripRgh, stripUv).r, normFade);
            float lumaW = dot(stTex, vec3(0.299, 0.587, 0.114));
            float seamBlack = mix(1.0, mix(0.60, 1.0, smoothstep(0.10, 0.36, lumaW)), min(1.5, 0.55 * dK));
            vec3 saddle = pow(max(stTex, vec3(0.001)), vec3(1.26 * expShift)) * vec3(0.84, 0.64, 0.48) * (uFloorTone * brightMul * seamBlack);
            surfAlb  = saddle * (1.0 + nMap.x * 0.042 + nMap.y * 0.022);
            roughVal = mix(0.12, 0.24, rgh);
            specOcc  = mix(1.0, smoothstep(0.12, 0.34, lumaW), min(1.0, 0.60 * dK));
            clearcoatBoost = 1.08;
            maxReflCap = 0.25;
          } else if (uFloorMode < 2.5) {
            // Mode 2: Aged Amber Heart-Pine Longitudinal Strips
            vec3 stTex = texture2D(tStripDiff, stripUv).rgb;
            nMap       = (texture2D(tStripNor, stripUv).xyz * 2.0 - 1.0) * normFade;
            float rgh  = (kCycF <= 0.0005)
              ? textureLod(tStripRgh, stripUv, 0.0).r
              : mix(0.50, texture2D(tStripRgh, stripUv).r, normFade);
            float lumaW = dot(stTex, vec3(0.299, 0.587, 0.114));
            float seamBlack = mix(1.0, mix(0.66, 1.0, smoothstep(0.10, 0.36, lumaW)), min(1.5, 0.50 * dK));
            vec3 honeyStrip = pow(max(stTex, vec3(0.001)), vec3(1.18 * expShift)) * vec3(0.95, 0.78, 0.60) * (uFloorTone * brightMul * seamBlack);
            surfAlb  = honeyStrip * (1.0 + nMap.x * 0.038 + nMap.y * 0.020);
            roughVal = mix(0.12, 0.24, rgh);
            specOcc  = smoothstep(0.12, 0.34, lumaW);
          } else if (uFloorMode < 3.5) {
            // Mode 3: HK02 Wide Honey-Oak Planks
            vec2 uvHoriz = vec2(sCoord, vW.x) / 1.65;
            vec3 woodTex = texture2D(tWood, uvHoriz).rgb;
            nMap         = (texture2D(tWoodNor, uvHoriz).xyz * 2.0 - 1.0) * normFade;
            float rghTex = (kCycF <= 0.0005)
              ? textureLod(tWoodRgh, uvHoriz, 0.0).r
              : mix(0.50, texture2D(tWoodRgh, uvHoriz).r, normFade);
            float lumaW  = dot(woodTex, vec3(0.299, 0.587, 0.114));
            vec3 oakTint = vec3(0.86, 0.72, 0.58) * (uFloorTone * brightMul);
            surfAlb  = pow(max(woodTex, vec3(0.001)), vec3(1.24 * expShift)) * oakTint * (1.0 + nMap.y * 0.024 + nMap.x * 0.018);
            roughVal = mix(0.11, 0.22, rghTex);
            specOcc  = smoothstep(0.12, 0.34, lumaW);
          } else {
            vec2 hbUv = vec2(vW.x, sCoord) / 1.55;
            vec3 hbTex = texture2D(tHerring, hbUv).rgb;
            vec3 hbNor = (texture2D(tHerringNor, hbUv).xyz * 2.0 - 1.0) * normFade;
            vec3 esp = pow(max(hbTex, vec3(0.001)), vec3(1.38 * expShift)) * vec3(0.24, 0.15, 0.095) * (uFloorTone * brightMul);
            float ebonyLine = smoothstep(0.28, 0.29, dWall) * (1.0 - smoothstep(0.325, 0.335, dWall));
            surfAlb = mix(esp * (1.0 + hbNor.x * 0.04), vec3(0.012, 0.010, 0.009), ebonyLine);
            nMap = hbNor;
            roughVal = 0.16;
            clearcoatBoost = 0.82;
            maxReflCap = 0.16;
            specGainK = 0.60;
          }

          if (olActiveF) {
            float kOutE = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
            vec2 pE = vec2(vW.x - 0.43, sCoord - 8.70);
            if (dot(pE, pE) < 0.85) {
              vec2 qE = vec2(pE.x * 0.978 - pE.y * 0.208, pE.x * 0.208 + pE.y * 0.978);
              float softE = exp(-dot(qE / vec2(0.45, 0.40), qE / vec2(0.45, 0.40)) * 1.55);
              float railE = (1.0 - smoothstep(0.26, 0.38, abs(qE.x))) * (1.0 - smoothstep(0.05, 0.14, abs(abs(qE.y) - 0.17)));
              float easelKeep = mix(1.0, 0.36, clamp(0.72 * softE + 0.48 * railE, 0.0, 1.0) * kOutE);
              light   *= easelKeep;
              specOcc *= mix(1.0, easelKeep, 0.85);
            }
          }

          // Cycle 5/7 §3.1+§5.1: Rich Dark Satin-Mahogany/Walnut albedo + alcove-only seam calm (0-LSB on V9!):
          if (kCycF > 0.0005) {
            float albL = dot(surfAlb, vec3(0.2126, 0.7152, 0.0722));
            vec3 walnutNeutral = vec3(albL) * vec3(1.22, 0.80, 0.54);
            vec3 walnutAlb = mix(walnutNeutral, surfAlb * vec3(0.74, 1.12, 1.62), 0.32) * 0.96;
            surfAlb = mix(surfAlb, walnutAlb, kCycF);
            vec3 alcCalmAlb = vec3(dot(surfAlb, vec3(0.2126, 0.7152, 0.0722))) * vec3(1.22, 0.80, 0.54) * 0.96;
            surfAlb = mix(surfAlb, alcCalmAlb, 0.22 * inAlcoveF * kCycF);
          }

          vec3 c = light * surfAlb;

          vec3 V = normalize(cameraPosition - vW);
          vec3 N = (uFloorMode < 2.5)
            ? normalize(vec3(nMap.x * 0.13, 1.0, -nMap.y * 0.08))
            : normalize(vec3(nMap.y * 0.10, 1.0, nMap.x * 0.10));
          float NoV = clamp(dot(N, V), 0.0, 1.0);
          float NoV_geo = clamp(V.y, 0.0, 1.0);
          float NoV_fres = mix(NoV, mix(NoV_geo, NoV, 0.18 * normFade), kCycF);
          float f0 = mix(0.036, 0.046, uContrastFix) * clearcoatBoost;
          float F  = f0 + (1.0 - f0) * pow(1.0 - NoV_fres, 4.6);
          float specOccEff = (kCycF > 0.0005) ? mix(specOcc, mix(0.88, specOcc, 0.30 * normFade * normFade), kCycF) : specOcc;
          vec3 N_macro = normalize(mix(vec3(0.0, 1.0, 0.0), N, 0.14 * normFade));

          if (vReflUv.w > 0.05 && uReflGain > 0.001) {
            float dCamRaw = length(cameraPosition.xz - vW.xz);
            float dCam = clamp(dCamRaw, 1.0, 7.5);
            vec3 pVirtV9;
            if (!outSpecActive) {
              pVirtV9 = vec3(vW.x + N.x * dCam * 0.075, 0.0, vW.z + N.z * dCam * 0.075);
            } else {
              float nCoatRip = 1.0 - 0.62 * clamp((uOutWeights.z + uOutWeights.w) * uOutStrength, 0.0, 1.0);
              pVirtV9 = vec3(vW.x + N.x * dCam * (0.075 * nCoatRip), 0.0, vW.z + N.z * dCam * (0.075 * nCoatRip));
            }
            vec3 pVirtCyc = vec3(vW.x + N.x * (0.016 * normFade), 0.0, vW.z + N.z * (0.016 * normFade));
            vec3 pVirt = (kCycF > 0.0005) ? mix(pVirtV9, pVirtCyc, kCycF) : pVirtV9;

            vec4 pr0 = uReflMatrix * vec4(pVirt, 1.0);
            vec2 ruv = pr0.xy / max(0.05, pr0.w);
            if (ruv.x > 0.003 && ruv.x < 0.997 && ruv.y > 0.003 && ruv.y < 0.997) {
              vec3 refl;
              if (uReflBlurred > 0.5) {
                // Cycle 3/4: Raised near lodCyc floor (0.85+) from 2-pass pre-blurred reflBlurV using unclamped dCamRaw!
                float lodCyc = 0.85 + 0.55 * smoothstep(3.5, 14.0, dCamRaw) + clamp((roughVal - 0.11) * 3.0, 0.0, 0.85);
                refl = textureLod(uRefl, ruv, lodCyc).rgb;
              } else {
                vec3 horizTangent = normalize(vec3(-V.z, 0.0, V.x));
                vec4 prUp = uReflMatrix * vec4(pVirt + vec3(0.0, -0.17, 0.0), 1.0);
                vec4 prRt = uReflMatrix * vec4(pVirt + horizTangent * 0.095, 1.0);
                vec2 dUvUp = clamp((prUp.xy / max(0.05, prUp.w)) - ruv, vec2(-0.024), vec2(0.024));
                vec2 dUvRt = clamp((prRt.xy / max(0.05, prRt.w)) - ruv, vec2(-0.018), vec2(0.018));
                float baseLod = mix(1.65, 1.22, uContrastFix);
                float lod = baseLod + clamp((roughVal - 0.11) * 4.5, 0.0, 1.25);
                refl = textureLod(uRefl, ruv, lod).rgb * 0.36
                     + textureLod(uRefl, clamp(ruv + dUvUp * 0.78, 0.003, 0.997), lod + 0.25).rgb * 0.17
                     + textureLod(uRefl, clamp(ruv - dUvUp * 0.78, 0.003, 0.997), lod + 0.25).rgb * 0.17
                     + textureLod(uRefl, clamp(ruv + dUvRt * 0.82, 0.003, 0.997), lod + 0.25).rgb * 0.15
                     + textureLod(uRefl, clamp(ruv - dUvRt * 0.82, 0.003, 0.997), lod + 0.25).rgb * 0.15;
                float peakR = max(max(refl.r, refl.g), refl.b);
                refl *= 1.0 / (1.0 + max(0.0, peakR - 0.62) * 1.35);
              }
              float edgeFadeV9 = smoothstep(0.003, 0.035, min(min(ruv.x, 1.0 - ruv.x), min(ruv.y, 1.0 - ruv.y)));
              // Cycle 6 §3.1: Strengthened near-feet & bottom-ruv.y taper -> ZERO bottom-viewport residual fringe during Live Walk!
              float nearFeetDamp = smoothstep(0.62, 0.30, NoV_geo);
              float edgeFadeCyc = smoothstep(0.004, 0.055, min(ruv.x, 1.0 - ruv.x))
                                * smoothstep(0.015, 0.280, ruv.y)
                                * smoothstep(0.004, 0.065, 1.0 - ruv.y);
              float edgeFade = (kCycF > 0.0005) ? mix(edgeFadeV9, edgeFadeCyc, kCycF) : edgeFadeV9;
              float reflW;
              vec3 reflTinted;
              if (!outSpecActive) {
                reflW = clamp(F * uReflGain * specOcc * edgeFade, 0.0, maxReflCap);
                reflTinted = refl * mix(vec3(1.0, 0.95, 0.87), surfAlb * 1.45 + vec3(0.08), 0.26);
              } else {
                float grazePlanar4 = smoothstep(0.32, 0.14, NoV);
                float grazePlanar5 = smoothstep(0.34, 0.14, NoV);
                float reflZone4 = smoothstep(15.0, 19.5, sCoord) * grazePlanar4;
                float reflZone5 = smoothstep(10.8, 20.2, sCoord) * grazePlanar5;
                float c04Refl   = clamp(uOutWeights.z * uOutStrength, 0.0, 1.2) * reflZone4;
                float c05Refl   = clamp(uOutWeights.w * uOutStrength, 0.0, 1.2) * reflZone5;
                float outReflBoost = 1.0 + 0.72 * c04Refl + 0.58 * c05Refl;
                float effReflCap   = maxReflCap + 0.16 * c04Refl + 0.14 * c05Refl;
                reflW = clamp(F * uReflGain * outReflBoost * specOcc * edgeFade, 0.0, effReflCap);
                float c04K = clamp(uOutWeights.z * uOutStrength, 0.0, 1.0) * reflZone4;
                vec3 coatBaseTint = mix(vec3(1.0, 0.95, 0.87), vec3(0.82, 0.96, 1.15), c04K);
                reflTinted = refl * mix(coatBaseTint, surfAlb * 1.45 + vec3(0.08), 0.26 * (1.0 - 0.88 * c04K));
              }
              if (kCycF > 0.0005) {
                // Cycle 6 §3.1: Decoupled corridor gloss (0.26 cap for C04/C05) vs calm alcove throat (s > 19.0 -> 0.52x)!
                float grazeGeo = smoothstep(0.34, 0.10, NoV_geo);
                float wSumRefl = dot(uOutWeights, vec4(1.0));
                vec3 coatTintCyc = (wSumRefl > 1e-3)
                  ? ((uOutWeights.z * vec3(0.88, 0.95, 1.06)
                    + uOutWeights.w * vec3(1.02, 1.00, 0.96)
                    + uOutWeights.y * vec3(1.08, 0.94, 0.76)
                    + uOutWeights.x * vec3(1.02, 0.98, 0.88)) / wSumRefl)
                  : vec3(1.0);
                float cw45 = (wSumRefl > 1e-3) ? clamp((uOutWeights.z + uOutWeights.w) / wSumRefl, 0.0, 1.0) : 0.0;
                float cw45Tint = (wSumRefl > 1e-3) ? clamp((uOutWeights.z + 0.5 * uOutWeights.w) / wSumRefl, 0.0, 1.0) : 0.0;
                float alcReflCalm = mix(1.0, 0.34, smoothstep(18.8, 21.2, sCoord));
                float spineWidth  = mix(0.85, 1.12, cw45);
                float spineMask   = mix(0.56, 1.0, exp(-(vW.x * vW.x) / (spineWidth * spineWidth)));
                float capCyc      = mix(0.22, 0.26, cw45) * alcReflCalm;
                float reflWCyc    = clamp(F * uReflGain * mix(1.0, 1.24, grazeGeo * cw45) * specOccEff * edgeFade * nearFeetDamp * spineMask * alcReflCalm, 0.0, capCyc);
                vec3 reflTintedCyc = refl * mix(coatTintCyc, surfAlb * 1.45 + vec3(0.08), 0.24 * (1.0 - 0.65 * cw45Tint));
                reflW = mix(reflW, reflWCyc, kCycF);
                reflTinted = mix(reflTinted, reflTintedCyc, kCycF);
              }
              c = c * (1.0 - reflW * 0.62) + reflTinted * reflW;
            }
          }

          // Cycle 7 §3.1/§3.2: Wide Corridor-Grazing Pure-Geometric Bifora Mirror Spine for C04/C05 (luminous TL spine + calm steep Live Walk, 0 flicker!)
          if (kCycF > 0.0005 && (uOutWeights.z > 0.001 || uOutWeights.w > 0.001) && sCoord > 9.5) {
            vec3 Rgeo = vec3(-V.x, max(V.y, 0.02), -V.z);
            float F_geo = 0.05 + 0.95 * pow(clamp(1.0 - NoV_geo, 0.0, 1.0), 4.2);
            float maskWin = 0.0;
            if (Rgeo.z < -0.05) {
              float tW = (-23.98 - vW.z) / Rgeo.z;
              if (tW > 0.0) {
                float xW = vW.x + Rgeo.x * tW;
                float yW = Rgeo.y * tW;
                float winX = exp(-(xW * xW) / (0.94 * 0.94));
                float winY = smoothstep(0.18, 0.85, yW) * (1.0 - smoothstep(3.45, 5.10, yW));
                float archM = 1.0;
                if (sCoord < 20.08) {
                  float tA = (-20.12 - vW.z) / Rgeo.z;
                  float xA = vW.x + Rgeo.x * max(0.0, tA);
                  archM = 1.0 - smoothstep(0.96, 1.38, abs(xA));
                }
                maskWin = winX * winY * archM;
              }
            }
            float sideWrap = smoothstep(18.5, 20.5, sCoord) * exp(-abs(sCoord - 22.02) / 2.6) * exp(-max(0.0, 1.24 - vW.x) / 1.75);
            float wSumM = max(1e-4, dot(uOutWeights, vec4(1.0)));
            float corrGraze = smoothstep(0.38, 0.14, NoV_geo) * smoothstep(20.8, 17.6, sCoord);
            vec3 sheen4 = (uOutWeights.z / wSumM) * vec3(0.60, 0.86, 1.26) * (0.92 * maskWin * smoothstep(12.2, 18.0, sCoord) * corrGraze + 0.06 * sideWrap);
            vec3 sheen5 = (uOutWeights.w / wSumM) * vec3(1.20, 1.12, 0.98) * (1.12 * maskWin * smoothstep(10.0, 16.4, sCoord) * corrGraze + 0.07 * sideWrap);
            vec3 sheenRaw = (sheen4 + sheen5) * (F_geo * specOccEff * kCycF * uOutStrength);
            float shLum = dot(sheenRaw, vec3(0.2126, 0.7152, 0.0722));
            vec3 sheenAdd = sheenRaw / (1.0 + 0.68 * shLum);
            c = c * (1.0 - clamp(shLum * 0.28, 0.0, 0.30)) + sheenAdd;
          }

          vec3 N_spec = (kCycF > 0.0005) ? normalize(mix(N, N_macro, kCycF)) : N;
          vec3 Lwin = normalize(vec3(-0.04, 0.26, -0.965));
          vec3 H    = normalize(Lwin + V);
          float winReach = smoothstep(10.0, 23.8, sCoord);
          float alcSpecEndK = mix(1.0, 0.55, inAlcoveF * kCycF);
          float specEnd = pow(max(dot(N_spec, H), 0.0), 32.0) * (0.065 + 0.065 * winReach) * specGainK * specOccEff * alcSpecEndK;
          vec3 Lrod = normalize(vec3(-vW.x * 0.35, 0.92, -0.22));
          vec3 Hrod = normalize(Lrod + V);
          float specIndoor = pow(max(dot(N_spec, Hrod), 0.0), 26.0) * 0.085 * specGainK * specOccEff * alcSpecEndK;
          c += specEnd * vec3(1.04, 0.98, 0.89) * (ambLight + vec3(0.18 * winReach * (1.0 - kCycF)))
             + specIndoor * evalSpotKelvin(uLightWarmth) * (fixLight * 0.75 + ambLight * 0.35);
          if (outSpecActive) {
            vec3 outSpec = evalOutsideFloorSpec(vW, N, V, specOcc, NoV);
            float c04SkyMask = clamp(uOutWeights.z * uOutStrength * outSpec.b * 0.90, 0.0, 0.72) * smoothstep(0.35, 0.14, NoV) * (1.0 - 0.55 * kCycF);
            vec3 cNeutral = vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))) * 0.66;
            c = mix(c, cNeutral, 0.74 * c04SkyMask);
            c += outSpec;
          }
          if (kCycF > 0.0005) {
            c += evalUnifiedFloorSpec(vW, N_macro, V, specOccEff, roughVal, tLightB) * (uBakeExp * kCycF);
          }
          // Grazing daylight specular ribbon & broad Fresnel floor sheen streaming inward from the open entrance doors (Cycle 7 §6.3: 75% less milky haze + V-door shadow, 0-LSB on V9!):
          if (uEntOpen > 0.001 && sCoord < 15.5) {
            float dEntS2 = max(0.0, sCoord - 3.55);
            float doorHalfW2 = 0.84 + dEntS2 * 0.16;
            float entX = 1.0 - smoothstep(doorHalfW2 * 0.38, doorHalfW2 * 1.25, abs(vW.x));
            float entReach = exp(-dEntS2 / 5.4) * (1.0 - smoothstep(9.5, 15.2, sCoord)) * entX;
            vec3 Lent = normalize(vec3(-vW.x * 0.18, 0.22, 0.96));
            vec3 Hent = normalize(Lent + V);
            float specTight = pow(max(dot(N_spec, Hent), 0.0), 14.0) * mix(1.05, 0.38, kCycF);
            float specBroad = pow(clamp(1.0 - NoV_fres, 0.0, 1.0), 2.2) * mix(0.58, 0.14, kCycF);
            vec3 entSpecCol = vec3(1.24, 1.10, 0.88);
            if (kCycF > 0.0005) {
              float wSumES = dot(uOutWeights, vec4(1.0));
              vec3 cycSpecCol = (wSumES > 1e-3)
                ? ((uOutWeights.z * vec3(0.84, 1.00, 1.26)
                  + uOutWeights.w * vec3(1.20, 1.14, 1.02)
                  + uOutWeights.y * vec3(1.46, 0.98, 0.42)
                  + uOutWeights.x * vec3(1.22, 1.10, 0.78)) / wSumES)
                : entSpecCol;
              entSpecCol = mix(entSpecCol, cycSpecCol, kCycF);
            }
            c += (specTight + specBroad) * uEntOpen * entReach * specGainK * mix(0.45, 1.0, specOccEff) * mix(1.0, doorLeafShadow, kCycF) * entSpecCol;
          }

          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          if (uInReflPass < 0.5) {
            gl_FragColor.rgb += ignDither(gl_FragCoord.xy) / 255.0;
          }
        }
      `,
    });
  }

  makeMaterials() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: lin(0.915, 0.905, 0.886), roughness: 0.82,
      normalScale: new THREE.Vector2(0.22, 0.22), envMapIntensity: 0.18,
    });
    wallMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.wallU);
      if (this.paintU) Object.assign(sh.uniforms, this.paintU);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWallWorld;\nvarying vec3 vPaintNrm;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWallWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvPaintNrm = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uCeilH;\nvarying vec3 vWallWorld;\nvarying vec3 vPaintNrm;\n' + (this.paintU ? PAINT_GLSL : ''))
        .replace('#include <map_fragment>', `#include <map_fragment>
          ${this.paintU ? 'diffuseColor.rgb = evalWallPaintKM(diffuseColor.rgb, vWallWorld, vPaintNrm);' : ''}`)
        .replace('#include <aomap_fragment>', `#include <aomap_fragment>
          float aoFloor = mix(0.86, 1.0, smoothstep(0.26, 0.95, vWallWorld.y));
          float aoCeil  = mix(0.90, 1.0, smoothstep(0.0, 0.45, uCeilH - vWallWorld.y));
          float wAO = aoFloor * aoCeil;
          reflectedLight.indirectDiffuse *= vec3(pow(wAO, 0.94), pow(wAO, 1.0), pow(wAO, 1.08));
        `);
    };
    wallMat.userData.paintInstalled = !!this.paintU;

    const bindSharedToneUniforms = (mat) => {
      mat.userData = { ...(mat.userData || {}), _toneUniformsBound: true };
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
      };
      return mat;
    };

    const softenIvoryVC = (mat, aoStrength = 0.24) => {
      mat.userData = { ...(mat.userData || {}), _toneUniformsBound: true };
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
        sh.fragmentShader = sh.fragmentShader.replace(
          '#include <color_fragment>',
          `#if defined( USE_COLOR_ALPHA )
             diffuseColor *= vec4( mix( vec3( 1.0 ), vColor.rgb, ${aoStrength.toFixed(2)} ), vColor.a );
           #elif defined( USE_COLOR )
             diffuseColor.rgb *= mix( vec3( 1.0 ), vColor, ${aoStrength.toFixed(2)} );
           #endif`
        );
      };
      return mat;
    };

    const installEaselCounterShadow = (mat, hasVC = false) => {
      mat.userData = { ...(mat.userData || {}), _toneUniformsBound: true };
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vEaselW;\nvarying vec3 vEaselN;')
          .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvEaselW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvEaselN = normalize(mat3(modelMatrix) * objectNormal);');
        let frag = sh.fragmentShader.replace(
          '#include <common>',
          `#include <common>\nuniform vec4 uOutWeights;\nuniform float uOutStrength;\nuniform float uOutCyclesMix;\nvarying vec3 vEaselW;\nvarying vec3 vEaselN;\n${PROBE_CUBE_GLSL}`
        );
        if (hasVC) {
          frag = frag.replace(
            '#include <color_fragment>',
            `#if defined( USE_COLOR_ALPHA )
               diffuseColor *= vec4( mix( vec3( 1.0 ), vColor.rgb, 0.24 ), vColor.a );
             #elif defined( USE_COLOR )
               diffuseColor.rgb *= mix( vec3( 1.0 ), vColor, 0.24 );
             #endif`
          );
        }
        frag = frag.replace(
          '#include <lights_fragment_end>',
          `#include <lights_fragment_end>
          if (uOutCyclesMix > 0.0005 && uHasProbeCube > 0.5) {
            // Cycle 3: Physical 6-face probe lighting REPLACES 0.48x-attenuated Three.js diffuse (fixes 15x double-attenuation crush!)
            float kEc = clamp(uOutCyclesMix, 0.0, 1.0);
            vec3 nE = normalize(vEaselN);
            vec3 probeE = sampleProbeCube(vEaselW, nE);
            float topShape = 0.88 + 0.24 * clamp(nE.y, 0.0, 1.0);
            vec3 easelLit = diffuseColor.rgb * (probeE * (1.18 * topShape) + vec3(0.065));
            reflectedLight.directDiffuse    = mix(reflectedLight.directDiffuse, vec3(0.0), kEc);
            reflectedLight.indirectDiffuse  = mix(reflectedLight.indirectDiffuse, easelLit, kEc);
            reflectedLight.directSpecular   *= mix(1.0, 0.45, kEc);
            reflectedLight.indirectSpecular *= mix(1.0, 0.55, kEc);
          } else if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005) {
            float kEasel = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
            vec3 nE = normalize(vEaselN);
            // Panel-4 camera (cameraPosition.z < -9.6, looking from corridor toward entrance) views the ENTIRE easel & top T-clamp in counter-shadow:
            float viewFromBack = smoothstep(-9.2, -10.2, cameraPosition.z);
            float backFace = max(smoothstep(-0.04, -0.52, nE.z), viewFromBack);
            float sideRim  = smoothstep(0.45, 0.92, max(abs(nE.x), max(0.0, nE.y * 0.85)));
            vec3 walnutScale = mix(vec3(0.48, 0.43, 0.36), vec3(0.23, 0.185, 0.135), backFace);
            reflectedLight.directDiffuse    *= mix(vec3(1.0), walnutScale, kEasel);
            reflectedLight.indirectDiffuse  *= mix(vec3(1.0), walnutScale, kEasel);
            reflectedLight.directSpecular   *= mix(1.0, 0.18, backFace * kEasel);
            reflectedLight.indirectSpecular *= mix(1.0, 0.28, kEasel);
            reflectedLight.indirectDiffuse  += vec3(0.036, 0.024, 0.012) * (sideRim * backFace * kEasel);
          }`
        );
        sh.fragmentShader = frag;
      };
      return mat;
    };

    return {
      wall: wallMat,
      trim: new THREE.MeshStandardMaterial({ color: lin(0.955, 0.942, 0.916), emissive: lin(0.14, 0.134, 0.122), roughness: 0.40, envMapIntensity: 0.22 }),
      trimVC: softenIvoryVC(new THREE.MeshStandardMaterial({ color: lin(0.955, 0.942, 0.916), emissive: lin(0.14, 0.134, 0.122), roughness: 0.38, vertexColors: true, envMapIntensity: 0.24 }), 0.22),
      doorVC: softenIvoryVC(new THREE.MeshStandardMaterial({ color: lin(0.948, 0.932, 0.900), emissive: lin(0.15, 0.142, 0.128), roughness: 0.38, vertexColors: true, envMapIntensity: 0.25 }), 0.22),
      brass: bindSharedToneUniforms(new THREE.MeshStandardMaterial({ color: lin(0.74, 0.48, 0.17), roughness: 0.23, metalness: 0.92, envMapIntensity: 0.78 })),
      brassVC: softenIvoryVC(new THREE.MeshStandardMaterial({ color: lin(0.76, 0.50, 0.18), roughness: 0.24, metalness: 0.92, vertexColors: true, envMapIntensity: 0.75 }), 0.25),
      easelVC: installEaselCounterShadow(new THREE.MeshStandardMaterial({
        normalScale: new THREE.Vector2(0.22, 0.22),
        color: lin(0.94, 0.70, 0.44), roughness: 0.35, vertexColors: true, envMapIntensity: 0.32,
      }), true),
      easelOak: installEaselCounterShadow(new THREE.MeshStandardMaterial({
        normalScale: new THREE.Vector2(0.22, 0.22),
        color: lin(0.94, 0.70, 0.44), roughness: 0.35, envMapIntensity: 0.32,
      }), false),
      tin: new THREE.MeshStandardMaterial({
        color: lin(0.95, 0.942, 0.925), emissive: lin(0.32, 0.315, 0.305), roughness: 0.46, envMapIntensity: 0.22,
      }),
      frame: bindSharedToneUniforms(new THREE.MeshStandardMaterial({ color: lin(0.013, 0.011, 0.010), roughness: 0.32, envMapIntensity: 0.36 })),
      glass: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.06, transparent: true, opacity: 0.16, depthWrite: false }),
      lay: new THREE.MeshBasicMaterial({ color: lin(0.98, 0.99, 1.0).multiplyScalar(2.85) }),
      bar: new THREE.MeshStandardMaterial({ color: lin(0.93, 0.92, 0.90), roughness: 0.38 }),
      // Calm translucent museum-linen daylight behind Bifora end window (~0.89 sRGB, zero glare/washout!):
      sky: new THREE.MeshBasicMaterial({ color: lin(1.02, 0.97, 0.88).multiplyScalar(1.08) }),
      sideRoom: (() => {
        const m = new THREE.MeshStandardMaterial({ color: lin(0.95, 0.93, 0.89), roughness: 0.82 });
        m.userData._toneUniformsBound = true;
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
          sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vSrBoxW;')
            .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSrBoxW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', '#include <common>\nuniform vec4 uOutWeights;\nuniform float uOutStrength;\nvarying vec3 vSrBoxW;')
            .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
              if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005 && -vSrBoxW.z > 6.5) {
                float wSumSb = max(1e-4, dot(uOutWeights, vec4(1.0)));
                float kSb = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
                float yGradB = mix(0.84, 1.14, smoothstep(2.78, 3.44, vSrBoxW.y));
                vec3 sbTgt = (uOutWeights.z * vec3(0.32, 0.42, 0.52)
                            + uOutWeights.w * vec3(0.68, 0.59, 0.49)
                            + uOutWeights.y * vec3(0.62, 0.34, 0.12)
                            + uOutWeights.x * vec3(0.46, 0.37, 0.26)) / wSumSb;
                reflectedLight.directDiffuse   *= mix(vec3(1.0), sbTgt * yGradB, kSb);
                reflectedLight.indirectDiffuse *= mix(vec3(1.0), sbTgt * yGradB, kSb);
                reflectedLight.directSpecular  *= mix(1.0, 0.12, kSb);
                reflectedLight.indirectSpecular *= mix(1.0, 0.12, kSb);
              }`);
        };
        return m;
      })(),
      sideRoomClosed: (() => {
        const m = new THREE.MeshBasicMaterial({ color: lin(1.00, 0.955, 0.880).multiplyScalar(0.95) });
        m.userData._toneUniformsBound = true;
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
          sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vSrW;')
            .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSrW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', '#include <common>\nuniform vec4 uOutWeights;\nuniform float uOutStrength;\nvarying vec3 vSrW;')
            .replace('#include <color_fragment>', `#include <color_fragment>
              if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005) {
                float wSumSr = max(1e-4, dot(uOutWeights, vec4(1.0)));
                float kSr = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
                float yGrad = mix(0.84, 1.14, smoothstep(2.78, 3.44, vSrW.y));
                vec3 srTgt = (uOutWeights.z * vec3(0.32, 0.42, 0.52)
                            + uOutWeights.w * vec3(0.68, 0.59, 0.49)
                            + uOutWeights.y * vec3(0.62, 0.34, 0.12)
                            + uOutWeights.x * vec3(0.46, 0.37, 0.26)) / wSumSr;
                diffuseColor.rgb *= mix(vec3(1.0), srTgt * yGrad, kSr);
              }`);
        };
        return m;
      })(),
      sideRoomSun: bindSharedToneUniforms(new THREE.MeshBasicMaterial({ color: lin(1.0, 0.94, 0.83).multiplyScalar(1.25) })),
      shadowProxy: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
      dropShadow: new THREE.MeshBasicMaterial({ color: 0x1a140e, transparent: true, opacity: 0.30, depthWrite: false, alphaMap: shadowTexture() }),
      easelShadow: new THREE.MeshBasicMaterial({ color: 0x22170c, transparent: true, opacity: 0.18, depthWrite: false, alphaMap: shadowTexture() }),
      brick: null,
    };
  }

  ensureLiveFallbackTextures() {
    if (!this.M.floor) this.makeFloorMaterial();
    if (!this.M.wall.normalMap) {
      const wallNor = tex(TEX_DIR + 'beige_wall_001_nor.jpg', { srgb: false, repeat: true, aniso: 8 });
      wallNor.repeat.set(0.5, 0.5);
      this.M.wall.normalMap = wallNor;
      this.M.wall.needsUpdate = true;
    }
    if (!this.M.easelVC.map) {
      const easelD = tex(TEX_DIR + 'wood_floor_diff.jpg', { repeat: true });
      const easelN = tex(TEX_DIR + 'wood_floor_nor.jpg', { srgb: false, repeat: true });
      this.M.easelVC.map = easelD; this.M.easelVC.normalMap = easelN; this.M.easelVC.needsUpdate = true;
      this.M.easelOak.map = easelD; this.M.easelOak.normalMap = easelN; this.M.easelOak.needsUpdate = true;
    }
    if (!this.M.brick) {
      this.M.brick = new THREE.MeshStandardMaterial({ map: brickTexture(), roughness: 0.78 });
    }
  }

  makeFloorMaterial() {
    const d = tex(TEX_DIR + 'wood_floor_diff.jpg', { repeat: true, aniso: 16 });
    const r = tex(TEX_DIR + 'wood_floor_rough.jpg', { srgb: false, repeat: true });
    const n = tex(TEX_DIR + 'wood_floor_nor.jpg', { srgb: false, repeat: true });
    this.floorU = {
      uRefl: { value: this.reflRT.texture }, uReflMatrix: { value: this.reflMatrix },
      uReflGain: { value: 0.16 }, uTone: { value: 0.98 }, uHalfW: { value: 1.96 }, uVH: { value: 1.50 }, uArchS: { value: 20.00 },
    };
    const m = new THREE.MeshStandardMaterial({
      map: d, roughnessMap: r, normalMap: n,
      normalScale: new THREE.Vector2(0.36, 0.36),
      color: lin(1.02, 0.86, 0.66), roughness: 1.0, envMapIntensity: 0.20,
    });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.floorU);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform mat4 uReflMatrix;\nvarying vec4 vReflUv;\nvarying vec3 vFlWorld;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvec4 flW = modelMatrix * vec4(transformed, 1.0);\nvReflUv = uReflMatrix * flW;\nvFlWorld = flW.xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D uRefl;\nuniform float uReflGain, uTone, uHalfW, uVH, uArchS;\nvarying vec4 vReflUv;\nvarying vec3 vFlWorld;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec2 wUvH = vec2(-vFlWorld.z, vFlWorld.x) / 1.80;
          diffuseColor.rgb = texture2D(map, wUvH).rgb * vec3(1.02, 0.86, 0.66) * uTone * 1.08;
          float sFl = -vFlWorld.z;
          float hwHere = (sFl > uArchS + 0.25) ? uVH : uHalfW;
          float dWall = abs(hwHere - abs(vFlWorld.x));
          diffuseColor.rgb *= mix(0.82, 1.0, smoothstep(0.0, 0.20, dWall));
        `)
        .replace('#include <roughnessmap_fragment>', `float roughnessFactor = 0.42;`)
        .replace('#include <opaque_fragment>', `{
          vec2 ruv = vReflUv.xy / max(1e-4, vReflUv.w) + normal.xz * 0.015;
          if (ruv.x > 0.0 && ruv.x < 1.0 && ruv.y > 0.0 && ruv.y < 1.0) {
            vec3 refl = vec3(0.0); float ws = 0.0;
            for (int ix = -2; ix <= 2; ix++) for (int iy = -2; iy <= 2; iy++) {
              float w = exp(-float(ix*ix + iy*iy) / 4.5);
              refl += textureLod(uRefl, clamp(ruv + vec2(float(ix)*0.006, float(iy)*0.006), 0.002, 0.998), 3.2).rgb * w;
              ws += w;
            }
            refl /= ws;
            float NoV = clamp(dot(normal, geometryViewDir), 0.0, 1.0);
            float F = 0.03 + 0.97 * pow(1.0 - NoV, 5.0);
            outgoingLight = mix(outgoingLight, refl, clamp(F * uReflGain, 0.0, 0.22));
          }
        }
        #include <opaque_fragment>`);
    };
    this.M.floor = m;
  }

  // ------------------------------------------------------------------------
  async build(L) {
    await Promise.all([this.easelReady, this.bakedReady]);
    this.layout = L;
    const D = this.D = dims(L);
    const { HW, C, Y0, VH, ARCH_SPR, ARCH_RISE, VS0, VS1, VC, WT } = D;
    const AR = D.L;
    this.wallU.uCeilH.value = C;
    this.renderer.toneMappingExposure = 1.00 * (L.light.exposure ?? 1.0);
    this.reflDirty = true;

    this.dyn.traverse(o => { if (o.geometry && !o.userData.keepGeo) o.geometry.dispose(); });
    this.dyn.clear();

    const useBaked = !!(this.bakedPack && !this.opts.forceLive && matchesBakedMeta(L, this.bakedPack.meta));
    this.isUsingBaked = useBaked;
    this.renderer.shadowMap.enabled = !useBaked;

    if (useBaked) {
      this.buildBakedRoom(L);
      this.buildArt(L, /* bakedShadows */ true);
      this.buildStand(L, /* bakedShadows */ true);
      if (this.fixtures) this.fixtures.dispose();
      this.fixtures = buildTownHallFixtures({ hall: this, layout: L, D, artSize, catalog: CATALOG });
      this.dyn.add(this.fixtures.root);
      this.rebuildReflCaches();
      this.onBuilt && this.onBuilt();
      return;
    }

    // ---- Upgraded Live Preview Fallback (for interactive wall/door dragging in `layout.html`) ----
    await this.ensureFullKit();
    this.ensureLiveFallbackTextures();
    this.floorU.uHalfW.value = HW;
    this.floorU.uVH.value = VH;
    this.floorU.uArchS.value = AR;
    const g = this.dyn;
    const M = this.M;
    const add = (mesh, cast = true, recv = true) => { mesh.castShadow = cast; mesh.receiveShadow = recv; g.add(mesh); return mesh; };
    const box = (x0, x1, s0, s1, z0, z1, mat, cast = true) => {
      const geo = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0), Math.abs(s1 - s0));
      const m = new THREE.Mesh(geo, mat);
      m.position.set((x0 + x1) / 2, (z0 + z1) / 2, -(s0 + s1) / 2);
      return add(m, cast);
    };

    const fl = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2 + 8, VS1 - Y0 + 4), M.floor);
    fl.rotation.x = -Math.PI / 2;
    fl.position.set(0, 0, -(Y0 - 2 + (VS1 - Y0 + 4) / 2));
    add(fl, false, true);
    this.floorMesh = fl;
    this.floorU.uTone.value = L.hall.floorTone ?? 0.98;

    const lays = this.laylightCenters();
    this.buildTinCeiling(-HW, HW, Y0, AR + 0.02, C, lays);
    box(-HW - WT, HW + WT, Y0 - WT, AR + 0.3, C + 0.04, C + 0.25, M.shadowProxy);

    this.rectLights = [];
    const lk = L.light.laylights ?? 1.0;
    for (const yc of lays) {
      for (const [xa, xb] of [[-HW + 0.28, -HW + 0.96], [HW - 0.96, HW - 0.28]]) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(xb - xa, 1.85), M.lay);
        p.rotation.x = Math.PI / 2; p.position.set((xa + xb) / 2, C - 0.030, -yc); add(p, false, false);
        box(xa - 0.03, xb + 0.03, yc - 0.95, yc + 0.95, C - 0.030, C - 0.018, M.bar, false);
        for (let kx = 1; kx < 3; kx++) box(xa + (xb - xa) * kx / 3 - 0.007, xa + (xb - xa) * kx / 3 + 0.007, yc - 0.92, yc + 0.92, C - 0.040, C - 0.030, M.bar, false);
        box(xa, xb, yc - 0.007, yc + 0.007, C - 0.040, C - 0.030, M.bar, false);
        const rl = new THREE.RectAreaLight(0xf8f9ff, 3.8 * lk, xb - xa, 1.85);
        rl.position.set((xa + xb) / 2, C - 0.03, -yc); rl.rotation.x = -Math.PI / 2;
        g.add(rl); this.rectLights.push(rl);
      }
    }
    for (const sg of [-1, 1]) {
      const len = AR - Y0 - 0.8;
      const rl = new THREE.RectAreaLight(0xfffaf2, 0.92 * lk, len, 0.45);
      rl.position.set(sg * (HW - 0.34), C - 0.18, -(Y0 + AR) / 2);
      rl.lookAt(sg * HW * 1.4, 2.2, -(Y0 + AR) / 2);
      g.add(rl); this.rectLights.push(rl);
    }
    g.add(new THREE.HemisphereLight(0xf8faff, 0xeadbc4, 0.48 * lk));
    const up = new THREE.RectAreaLight(0xfff8ee, 1.05 * lk, HW * 2 - 0.3, AR - Y0 - 0.6);
    up.position.set(0, 0.04, -(Y0 + AR) / 2); up.rotation.x = Math.PI / 2;
    g.add(up); this.rectLights.push(up);

    this.buildEntrance(L, g, box);

    this.doorLeaves = [];
    this.doorSunTargets = [];
    for (const [side, sg] of [['L', -1], ['R', 1]]) {
      const xi = sg * HW;
      const [xa, xb] = [xi, sg * (HW + WT)].sort((a, b) => a - b);
      const cuts = L.doors.filter(d => d.wall === side).sort((a, b) => a.s - b.s);
      let yc = Y0; const plinths = [];
      for (const d of cuts) {
        const hw = 0.54, cutH = d.transom ? 2.80 + 0.652 : 2.80 + 0.03;
        const k = this.kitPart(d.transom ? 'kit_door_transom' : 'kit_door_plain');
        k.position.set(xi, 0, -d.s); if (side === 'L') k.rotation.y = Math.PI;
        g.add(k);
        const leaf = k.getObjectByName(d.transom ? 'transom_leaf' : 'plain_leaf');
        const openDeg = d.open || 0;
        const swingMode = d.swing || 'in';
        if (leaf) {
          if (swingMode === 'in' && openDeg > 0) {
            leaf.position.x = 0.045;
            leaf.rotation.y = leaf.userData.baseY + THREE.MathUtils.degToRad(openDeg);
          } else {
            leaf.position.x = 0.095;
            leaf.rotation.y = leaf.userData.baseY - THREE.MathUtils.degToRad(openDeg);
          }
          this.doorLeaves.push(leaf);
        }
        box(xa, xb, yc, d.s - hw, 0, C, M.wall);
        box(xa, xb, d.s - hw, d.s + hw, cutH, C, M.wall);
        yc = d.s + hw; plinths.push([d.s - 0.688, d.s + 0.688]);

        const [r0, r1] = [sg * (HW + WT), sg * (HW + WT + 1.8)].sort((a, b) => a - b);
        box(r0, r1, d.s - 1.35, d.s - 1.25, 0, C, M.sideRoom, false);
        box(r0, r1, d.s + 1.25, d.s + 1.35, 0, C, M.sideRoom, false);
        const backMat = openDeg > 2 ? M.sideRoomSun : M.sideRoom;
        box(sg * (HW + WT + 1.75), sg * (HW + WT + 1.85), d.s - 1.35, d.s + 1.35, 0, C, backMat, false);
        box(r0, r1, d.s - 1.35, d.s + 1.35, C, C + 0.1, M.sideRoom, false);

        if (openDeg > 2) {
          this.doorSunTargets.push({ side, s: d.s, open: openDeg, swing: swingMode });
          const [ex0, ex1] = [sg * (HW + 1.15), sg * (HW + 1.21)].sort((a, b) => a - b);
          box(ex0, ex1, d.s - 2.6, d.s + 2.6, 1.375, C + 1.2, M.shadowProxy, true);
          box(ex0, ex1, d.s - 2.6, d.s - 0.85, 0, 1.375, M.shadowProxy, true);
          box(ex0, ex1, d.s + 0.85, d.s + 2.6, 0, 1.375, M.shadowProxy, true);

          const openScale = Math.min(1.0, openDeg / 14.0) * (L.light.doorSun ?? 1);
          const dFill = new THREE.RectAreaLight(0xffe8c6, 1.65 * openScale, 0.88, 0.95);
          dFill.position.set(sg * (HW + WT + 0.06), 0.96, -d.s);
          dFill.lookAt(sg * (HW - 0.42), 0.0, -d.s);
          g.add(dFill); this.rectLights.push(dFill);
        }
      }
      box(xa, xb, yc, AR + 0.30, 0, C, M.wall);

      let yb = Y0 - 0.002;
      const [bx0, bx1] = [xi + sg * 0.002, xi - sg * 0.024].sort((a, b) => a - b);
      for (const [pa, pb] of plinths) {
        if (pa + 0.003 > yb) {
          box(bx0, bx1, yb, pa + 0.003, 0, 0.285, M.trim);
          box(bx0, bx1, yb, pa + 0.003, 0.94, 0.975, M.trim);
        }
        yb = pb - 0.003;
      }
      box(bx0, bx1, yb, AR + 0.004, 0, 0.285, M.trim);
      box(bx0, bx1, yb, AR + 0.004, 0.94, 0.975, M.trim);
      box(Math.min(xi, xi - sg * 0.028), Math.max(xi, xi - sg * 0.028), Y0, AR, C - 0.37, C - 0.33, M.trim);
      box(Math.min(xi, xi - sg * 0.08), Math.max(xi, xi - sg * 0.08), Y0, AR, C - 0.09, C, M.trim);
    }

    const archMat = L.hall.archFinish !== 'plaster' ? M.brick : M.wall;
    const hasRightVestWin = !!L.hall.vestRightWindow;
    for (const sg of [-1, 1]) {
      box(Math.min(sg * VH, sg * (HW + WT)), Math.max(sg * VH, sg * (HW + WT)), AR, VS0, 0, C, archMat);
      if (sg > 0 && hasRightVestWin) {
        this.sideVestibuleWindow(VH, VS0, VS1, VC, WT, lk);
      } else {
        box(Math.min(sg * VH, sg * (VH + WT)), Math.max(sg * VH, sg * (VH + WT)), VS0, VS1 + WT, 0, VC, M.wall);
        box(Math.min(sg * VH, sg * (VH - 0.024)), Math.max(sg * VH, sg * (VH - 0.024)), VS0, VS1, 0, 0.285, M.trim);
      }
    }
    this.archHead(VH, ARCH_SPR, ARCH_RISE, C, AR, VS0, archMat);
    box(-VH - WT, VH + WT, VS0, VS1 + WT, VC, VC + 0.12, M.tin);
    this.windowWall(VH, VS1, VC);

    const wl = new THREE.RectAreaLight(0xf6f8ff, 3.2 * lk, 1.88, 2.8);
    wl.position.set(0, 1.85, -(VS1 - 0.04)); wl.lookAt(0, 1.65, -(VS1 - 3.0)); g.add(wl); this.rectLights.push(wl);
    const vl = new THREE.RectAreaLight(0xfff7ec, 1.6 * lk, VH * 2 - 0.2, VS1 - VS0 - 0.4);
    vl.position.set(0, VC - 0.03, -(VS0 + VS1) / 2); vl.rotation.x = -Math.PI / 2; g.add(vl); this.rectLights.push(vl);

    this.buildLights(L);
    this.buildArt(L, false);
    this.buildStand(L, false);
    this.onBuilt && this.onBuilt();
  }

  // Builds the 1:1 Cycles-Baked `HK02` Room (`room.glb` walls, 3D coved ceiling, blotch-free satin-enamel doors & trim, floor!)
  buildBakedRoom(L) {
    const g = this.dyn, M = this.M, D = this.D;
    const pk = this.bakedPack;
    if (pk?._v9Evicted && SHARED_OUTSIDE_UNIFORMS.uOutCyclesMix.value <= 0.0005) {
      restoreV9Lightmaps(this, this.renderer);
    }
    const mode = ARCH_FINISH_MODES[L.hall.archFinish || 'plaster'] ?? 0;
    this.bakedU.uFloorTone.value = L.hall.floorTone ?? 1.00;
    this.bakedU.uArchMode.value = mode;
    this.bakedU.uArchBrick.value = mode > 0 ? 1.0 : 0.0;
    this.bakedU.uArchS.value = D.L;
    this.bakedU.uHalfW.value = D.HW;
    this.bakedU.uVH.value = D.VH;
    this.bakedU.uArchSpr.value = D.ARCH_SPR;
    this.bakedU.uArchRise.value = D.ARCH_RISE;
    this.bakedU.uCeilH.value = D.C;
    this.bakedU.uRefl.value = (this._cyclesAntiTwitchOn && this.reflBlurV) ? this.reflBlurV.texture : this.reflRT.texture;

    this.bakedFloorObj = null;
    this.laylightMesh = null;
    this.skySideMesh = null;
    this.entranceLeaves = [];
    this.doorLeaves = [];

    let leafL = null, leafR = null, roomBrass = null, roomProps = null;
    pk.scene.traverse(o => {
      if (!o.isMesh) return;
      o.userData.keepGeo = true;
      o.geometry.userData.keepGeo = true;
      o.visible = true;
      if (o.name === 'room_walls') o.material = this.bakedWallMat;
      else if (o.name === 'room_ceiling') o.material = this.bakedCeilMat;
      else if (o.name === 'room_floor') { o.material = this.bakedFloorMat; this.bakedFloorObj = o; }
      else if (o.name === 'room_props' || o.name === 'astragal_end_L') {
        o.material = this.bakedTrimMat;
        if (o.name === 'room_props') roomProps = o;
      }
      else if (o.name === 'room_doors') o.material = this.bakedDoorMat;
      else if (o.name === 'room_end_leaf_L' || o.name === 'room_end_leaf_R') {
        o.material = this.bakedDoorMat;
        if (o.userData.baseY === undefined) o.userData.baseY = o.rotation.y;
        o.rotation.y = o.userData.baseY;
        this.entranceLeaves.push(o);
        if (o.name === 'room_end_leaf_L') leafL = o;
        else leafR = o;
      }
      else if (o.name === 'room_brass' || o.name === 'brass_end_L' || o.name === 'brass_end_R') {
        o.material = this.bakedDoorBrassMat || M.brass;
        if (o.name === 'room_brass') roomBrass = o;
      }
      else if (o.name === 'room_glass') { o.material = this.bakedDoorGlassMat || M.glass; o.renderOrder = 2; }
      else if (o.name === 'room_laylights') { o.material = this.milkLayMat || M.lay; this.laylightMesh = o; }
    });

    // Split entrance double-door brass handles (`room_brass`) and center astragal (`room_props`) onto
    // `room_end_leaf_L` & `room_end_leaf_R` ONCE so handles & astragal swing rigidly bolted to the leaves!
    if (!pk.scene.userData._entHardwareSplit && leafL && leafR) {
      pk.scene.updateMatrixWorld(true);
      const splitIntoLeaves = (srcMesh, classifyTri, mat, namePrefix) => {
        if (!srcMesh?.geometry?.attributes?.position) return;
        const g0 = srcMesh.geometry;
        const pos = g0.attributes.position;
        const nor = g0.attributes.normal;
        const col = g0.attributes.color;
        const uv  = g0.attributes.uv;
        const idx = g0.index;
        const nTri = idx ? (idx.count / 3) : (pos.count / 3);
        const mw = srcMesh.matrixWorld;
        const buckets = { keep: [], L: [], R: [] };
        const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
        for (let t = 0; t < nTri; t++) {
          const i0 = idx ? idx.getX(t * 3)     : t * 3;
          const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
          const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
          p0.fromBufferAttribute(pos, i0).applyMatrix4(mw);
          p1.fromBufferAttribute(pos, i1).applyMatrix4(mw);
          p2.fromBufferAttribute(pos, i2).applyMatrix4(mw);
          const cx = (p0.x + p1.x + p2.x) / 3, cy = (p0.y + p1.y + p2.y) / 3, cz = (p0.z + p1.z + p2.z) / 3;
          const key = classifyTri(cx, cy, cz, p0, p1, p2);
          buckets[key].push(i0, i1, i2);
        }
        if (buckets.L.length === 0 && buckets.R.length === 0) return;

        const buildSubGeo = (vertIndices, relMat) => {
          const n = vertIndices.length;
          const outPos = new Float32Array(n * 3);
          const outNor = nor ? new Float32Array(n * 3) : null;
          const outUv  = uv  ? new Float32Array(n * 2) : null;
          let outCol = null;
          if (col) outCol = new col.array.constructor(n * col.itemSize);
          const nMat = relMat ? new THREE.Matrix3().getNormalMatrix(relMat) : null;
          const tv = new THREE.Vector3(), tn = new THREE.Vector3();
          for (let k = 0; k < n; k++) {
            const vi = vertIndices[k];
            tv.fromBufferAttribute(pos, vi);
            if (relMat) tv.applyMatrix4(relMat);
            outPos[k * 3] = tv.x; outPos[k * 3 + 1] = tv.y; outPos[k * 3 + 2] = tv.z;
            if (outNor) {
              tn.fromBufferAttribute(nor, vi);
              if (nMat) tn.applyMatrix3(nMat).normalize();
              outNor[k * 3] = tn.x; outNor[k * 3 + 1] = tn.y; outNor[k * 3 + 2] = tn.z;
            }
            if (outUv) { outUv[k * 2] = uv.getX(vi); outUv[k * 2 + 1] = uv.getY(vi); }
            if (outCol) {
              const s = col.itemSize;
              for (let c = 0; c < s; c++) outCol[k * s + c] = col.array[vi * s + c];
            }
          }
          const ng = new THREE.BufferGeometry();
          ng.setAttribute('position', new THREE.BufferAttribute(outPos, 3));
          if (outNor) ng.setAttribute('normal', new THREE.BufferAttribute(outNor, 3));
          if (outUv)  ng.setAttribute('uv', new THREE.BufferAttribute(outUv, 2));
          if (outCol) ng.setAttribute('color', new THREE.BufferAttribute(outCol, col.itemSize, col.normalized));
          ng.userData.keepGeo = true;
          return ng;
        };

        // Keep remaining static triangles on `srcMesh` (preserve exact index buffer when possible)
        if (idx) {
          const keepArr = (pos.count > 65535) ? new Uint32Array(buckets.keep) : new Uint16Array(buckets.keep);
          g0.setIndex(new THREE.BufferAttribute(keepArr, 1));
        } else {
          const keepGeo = buildSubGeo(buckets.keep, null);
          srcMesh.geometry.dispose();
          srcMesh.geometry = keepGeo;
          srcMesh.userData.srcVertIndices = Uint32Array.from(buckets.keep);
          srcMesh.userData.srcMeshName = srcMesh.name;
        }

        for (const [side, leaf] of [['L', leafL], ['R', leafR]]) {
          if (!buckets[side].length) continue;
          const relMat = leaf.matrixWorld.clone().invert().multiply(mw);
          const subGeo = buildSubGeo(buckets[side], relMat);
          const subMesh = new THREE.Mesh(subGeo, mat);
          subMesh.name = `${namePrefix}_${side}`;
          subMesh.userData.keepGeo = true;
          subMesh.userData.srcVertIndices = Uint32Array.from(buckets[side]);
          subMesh.userData.srcMeshName = srcMesh.name;
          leaf.add(subMesh);
        }
      };

      if (roomBrass) {
        splitIntoLeaves(
          roomBrass,
          (cx, _cy, cz) => (Math.abs(-cz - D.Y0) < 0.35 ? (cx < 0 ? 'L' : 'R') : 'keep'),
          this.bakedDoorBrassMat || M.brass,
          'brass_end'
        );
      }
      if (roomProps) {
        splitIntoLeaves(
          roomProps,
          (_cx, _cy, _cz, p0, p1, p2) => {
            const inAstr = p => Math.abs(p.x) < 0.022 && p.y > 0.014 && p.y < 2.804 && -p.z > D.Y0 - 0.14 && -p.z < D.Y0 - 0.03;
            return (inAstr(p0) && inAstr(p1) && inAstr(p2)) ? 'L' : 'keep';
          },
          this.bakedTrimMat,
          'astragal_end'
        );
      }
      pk.scene.userData._entHardwareSplit = true;
    }

    g.add(pk.scene);

    const outer = this.noReflGroup = new THREE.Group();
    g.add(outer);
    const box = (x0, x1, s0, s1, z0, z1, mat) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0), Math.abs(s1 - s0)), mat);
      m.position.set((x0 + x1) / 2, (z0 + z1) / 2, -(s0 + s1) / 2);
      outer.add(m); return m;
    };

    for (const d of L.doors) {
      const sg = d.wall === 'L' ? -1 : 1;
      const openDeg = d.open || 0;
      const [r0, r1] = [sg * (D.HW + D.WT), sg * (D.HW + D.WT + 1.55)].sort((a, b) => a - b);
      box(r0, r1, d.s - 1.35, d.s - 1.25, 0, D.C + 0.08, M.sideRoom);
      box(r0, r1, d.s + 1.25, d.s + 1.35, 0, D.C + 0.08, M.sideRoom);
      box(r0, r1, d.s - 1.35, d.s + 1.35, D.C, D.C + 0.08, M.sideRoom);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.85), openDeg > 2 ? M.sideRoomSun : M.sideRoomClosed);
      back.rotation.y = sg > 0 ? -Math.PI / 2 : Math.PI / 2;
      back.position.set(sg * (D.HW + D.WT + 0.38), 1.95, -d.s);
      (openDeg > 2 ? g : outer).add(back);
    }

    const f0 = D.Y0 - D.WT - 3.0, f1 = D.Y0 - D.WT;
    box(-2.4, 2.4, f0 - 0.1, f0, 0, D.C, M.sideRoom);
    box(-2.5, -2.4, f0, f1, 0, D.C, M.sideRoom); box(2.4, 2.5, f0, f1, 0, D.C, M.sideRoom);
    box(-2.4, 2.4, f0, f1, D.C, D.C + 0.1, M.sideRoom);
    // Warm sunlit morning exterior sky & threshold floor behind the grand entrance doors (visible in floor reflections too!):
    const entSky = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.5), this.entranceSkyMat || M.sideRoomSun);
    entSky.position.set(0, 2.05, -(D.Y0 - 1.55));
    entSky.rotation.y = Math.PI;
    g.add(entSky);
    const entFloor = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), M.sideRoomSun);
    entFloor.rotation.x = -Math.PI / 2;
    entFloor.position.set(0, 0.004, -(D.Y0 - 0.85));
    g.add(entFloor);
    this.entFloorV9 = entFloor;

    // Bug 2 Seal (0-LSB on V9, non-additive unmapped MeshBasicMaterial -> washCandidates = 21 intact!):
    // Dark satin-walnut threshold weatherstrip blocking the 1.8 cm gap under closed entrance leaves in BOTH main & reflRT passes!
    const entStripMat = new THREE.MeshBasicMaterial({ color: lin(0.036, 0.026, 0.019) });
    entStripMat.userData = { _toneUniformsBound: true };
    entStripMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
    };
    const entThresholdStrip = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.022, 0.07), entStripMat);
    entThresholdStrip.position.set(0, 0.011, -(D.Y0 - 0.105)); // exact s in [3.56, 3.63] under closed s=3.60 doors, y in [0, 0.022]
    entThresholdStrip.visible = false;
    g.add(entThresholdStrip);
    this.entThresholdStrip = entThresholdStrip;

    // Bug 3 Fix (0-LSB on V9, 0 samplers ShaderMaterial -> washCandidates = 21 intact!):
    // Cycles sunlit exterior stone terrace (s in [2.15, 3.58], strictly behind closed doors!) with smooth horizon dissolve into entSky!
    const entSkyS = D.Y0 - 1.55;
    this.entranceThresholdMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        ...SHARED_OUTSIDE_UNIFORMS,
        uEntSkyS: { value: entSkyS },
      },
      vertexShader: /* glsl */`
        varying vec3 vW;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uEntSkyS;
        varying vec3 vW;
        ${OUTSIDE_LIGHT_GLSL}
        void main() {
          float s = -vW.z;
          // Procedural running-bond exterior architectural flagstones (0 samplers, uniform-flow fwidth AA!):
          vec2 st = vec2(vW.x * 1.45, (s - uEntSkyS) * 1.85);
          st.x += floor(st.y) * 0.47;
          vec2 fwSt = fwidth(st);
          vec2 cell = floor(st);
          vec2 f = fract(st);
          float dJointX = min(f.x, 1.0 - f.x);
          float dJointY = min(f.y, 1.0 - f.y);
          float jointX = 1.0 - smoothstep(0.012, 0.024 + fwSt.x * 1.4, dJointX);
          float jointY = 1.0 - smoothstep(0.014, 0.028 + fwSt.y * 1.4, dJointY);
          float mortar = clamp(max(jointX, jointY), 0.0, 1.0);
          float tileVar = 0.90 + 0.18 * olHash21(cell + vec2(3.1, 7.4));
          float grain = (olNoise2(vW.xz * 13.5) - 0.5) * 0.11 + (olNoise2(vW.xz * 36.0) - 0.5) * 0.05;
          float stoneTex = clamp(tileVar + grain, 0.72, 1.18) * mix(1.0, 0.68, mortar);

          // Soft doorway jamb occlusion right at threshold (s -> 3.58) & flanking stone cheeks (|x| -> 0.88):
          float jambAO = mix(0.60, 1.0, smoothstep(0.0, 0.28, 0.96 - abs(vW.x)))
                       * mix(0.74, 1.0, smoothstep(uEntSkyS + 1.44, uEntSkyS + 1.08, s));

          float wSum = max(1e-4, dot(uOutWeights, vec4(1.0)));
          // Cycle 6 §5.2 Layer C: Soft botanical courtyard stone dapple + 1:1 terrace stone match at zOut = 1.45 m (ZERO seam!)
          float leafS = evalBotanicalKomorebi(vW.xz * 0.90, 2.2, uOutTime, 0.12);
          vec3 col4 = vec3(0.50, 0.55, 0.62);
          vec3 col5 = vec3(0.88, 0.84, 0.75);
          vec3 col3 = vec3(0.84, 0.60, 0.30);
          vec3 col2 = vec3(0.70, 0.65, 0.52) * mix(0.76, 1.18, leafS);
          vec3 stoneBase = (uOutWeights.z * col4 + uOutWeights.w * col5 + uOutWeights.y * col3 + uOutWeights.x * col2) / wSum;

          // Match mistCol 1:1 to entranceSkyMat Layer C terrace base at zOut = 1.45 m -> seamless threshold-to-terrace merge!
          float farFade = smoothstep(uEntSkyS + 0.02, uEntSkyS + 0.68, s);
          vec3 mistCol = (uOutWeights.z * vec3(0.48, 0.53, 0.60)
                        + uOutWeights.w * vec3(0.86, 0.82, 0.73)
                        + uOutWeights.y * vec3(0.82, 0.58, 0.28)
                        + uOutWeights.x * vec3(0.68, 0.63, 0.50)) / wSum;
          vec3 rad = mix(mistCol, stoneBase * (stoneTex * jambAO), smoothstep(0.0, 0.72, farFade)) * max(1.0, uOutStrength);
          if (uInReflPass > 0.5) {
            float pkR = max(rad.r, max(rad.g, rad.b));
            rad *= 1.0 / (1.0 + max(0.0, pkR - 0.85) * 0.90);
          }
          if (farFade < 0.002) discard;
          gl_FragColor = vec4(rad, farFade);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const entFloorCycles = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.44), this.entranceThresholdMat);
    entFloorCycles.rotation.x = -Math.PI / 2;
    entFloorCycles.position.set(0, 0.004, -(D.Y0 - 0.835)); // exact s in [2.145, 3.585], strictly behind closed s=3.60 doors!
    entFloorCycles.renderOrder = 1;
    entFloorCycles.visible = false;
    g.add(entFloorCycles);
    this.entFloorCycles = entFloorCycles;

    // Feathered volumetric morning sunbeams, doorway threshold halo & entrance-wall bounce glow (driven by `uEntOpen`!):
    const entGlow = this.entranceGlow = new THREE.Group();
    entGlow.visible = (this.bakedU.uEntOpen.value > 0.002);
    outer.add(entGlow);

    const makeVolBeamMat = (strength, mode) => new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        ...SHARED_OUTSIDE_UNIFORMS,
        uEntOpen: this.bakedU.uEntOpen,
        uStr: { value: strength },
        uMode: { value: mode }, // 0 = doorway radial bloom, 1 = longitudinal volumetric sunbeam, 2 = wall bounce glow
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        varying vec3 vW, vN;
        void main() {
          vUv = uv;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec4 uOutWeights;
        uniform float uOutCyclesMix;
        uniform float uEntOpen, uStr, uMode;
        varying vec2 vUv;
        varying vec3 vW, vN;
        void main() {
          vec3 V = normalize(cameraPosition - vW);
          float viewFade = pow(clamp(abs(dot(normalize(vN), V)), 0.0, 1.0), 0.55);
          float a = 0.0;
          vec3 col = vec3(1.00, 0.90, 0.72);
          if (uMode < 0.5) {
            // Mode 0: Soft feathered doorway threshold radiance halo & optical light-wrap bloom
            vec2 d = (vUv - vec2(0.5, 0.46)) * vec2(1.92, 1.88);
            float r2 = dot(d, d);
            a = exp(-r2 * 1.55) * smoothstep(1.0, 0.10, r2);
            col = mix(vec3(1.00, 0.84, 0.58), vec3(1.00, 0.95, 0.82), exp(-r2 * 1.8));
          } else if (uMode < 1.5) {
            // Mode 1: Feathered volumetric morning sunlight shafts fanning down the corridor (vUv.y = 0 at door -> 1 far down hall)
            float along = pow(max(0.0, 1.0 - vUv.y), 1.45) * smoothstep(0.0, 0.06, vUv.y);
            float across = smoothstep(0.0, 0.32, vUv.x) * smoothstep(1.0, 0.68, vUv.x);
            float rays = 0.78 + 0.22 * sin(vUv.x * 18.85 + 0.6) * sin(vUv.x * 9.42 - 0.4);
            a = along * across * rays * mix(0.52, 1.0, viewFade);
            col = mix(vec3(1.00, 0.82, 0.54), vec3(1.00, 0.94, 0.78), along);
          } else {
            // Mode 2: Soft bounced warm daylight washing the white plaster entrance walls near the doorway
            float along = pow(max(0.0, 1.0 - vUv.x), 1.45) * smoothstep(0.0, 0.07, vUv.x);
            float vert  = smoothstep(0.0, 0.30, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
            a = along * vert;
            col = vec3(1.00, 0.87, 0.64);
          }
          float alpha = a * uStr * uEntOpen;
          if (uOutCyclesMix > 0.0005) {
            float wSumV = dot(uOutWeights, vec4(1.0));
            if (wSumV > 1e-3) {
              float kCycV = clamp(uOutCyclesMix, 0.0, 1.0);
              vec3 cycCol = (uOutWeights.z * vec3(0.74, 0.88, 1.05)
                           + uOutWeights.w * vec3(1.00, 0.97, 0.90)
                           + uOutWeights.y * vec3(1.05, 0.78, 0.36)
                           + uOutWeights.x * vec3(0.98, 0.94, 0.72)) / wSumV;
              float cycGain = (uOutWeights.z * 0.42 + uOutWeights.w * 0.65 + uOutWeights.y * 0.85 + uOutWeights.x * 0.72) / wSumV;
              col = mix(col, cycCol, kCycV);
              alpha *= mix(1.0, cycGain, kCycV);
            }
          }
          if (alpha < 0.0005) discard;
          gl_FragColor = vec4(col * alpha, alpha);
        }
      `,
    });

    // A) Doorway threshold warm golden bloom veils (`s = D.Y0 + 0.08` & `s = D.Y0 + 0.65`, optical light-wrap across jambs & arch!)
    const haloMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 4.10), makeVolBeamMat(0.46, 0.0));
    haloMesh.position.set(0, 1.72, -(D.Y0 + 0.08));
    haloMesh.rotation.y = Math.PI;
    haloMesh.renderOrder = 4;
    entGlow.add(haloMesh);

    const haloFar = new THREE.Mesh(new THREE.PlaneGeometry(3.35, 3.85), makeVolBeamMat(0.24, 0.0));
    haloFar.position.set(0, 1.56, -(D.Y0 + 0.75));
    haloFar.rotation.y = Math.PI;
    haloFar.renderOrder = 4;
    entGlow.add(haloFar);

    // B) 3 soft volumetric morning sunbeams fanning inward from the open doorway (`s = 3.72 -> 10.2 m`)
    const beamCenter = new THREE.Mesh(new THREE.PlaneGeometry(2.65, 6.4), makeVolBeamMat(0.24, 1.0));
    beamCenter.position.set(0, 1.42, -(D.Y0 + 3.22));
    beamCenter.rotation.x = -Math.PI * 0.5 - 0.30; // slopes gently downward from doorway (`y ~ 2.38 m`) onto wood floor (`y ~ 0.46 m`)
    beamCenter.renderOrder = 4;
    entGlow.add(beamCenter);

    for (const sgn of [-1, 1]) {
      const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 5.8), makeVolBeamMat(0.18, 1.0));
      curtain.position.set(sgn * 0.62, 1.48, -(D.Y0 + 2.92));
      curtain.rotation.set(-Math.PI * 0.5 - 0.22, 0, sgn * 0.14);
      curtain.rotateY(sgn * 0.62);
      curtain.renderOrder = 4;
      entGlow.add(curtain);
    }

    // C) Soft bounced daylight glow on the flanking white plaster entrance walls (`s = 3.74 .. 8.8 m`)
    for (const sgn of [-1, 1]) {
      const bounce = new THREE.Mesh(new THREE.PlaneGeometry(5.10, 3.45), makeVolBeamMat(0.22, 2.0));
      bounce.position.set(sgn * (D.HW - 0.012), 1.60, -(D.Y0 + 2.58));
      bounce.rotation.y = sgn > 0 ? -Math.PI / 2 : Math.PI / 2;
      if (sgn > 0) bounce.scale.x = -1; // keep vUv.x = 0 right at the entrance doorway on BOTH Left & Right walls!
      bounce.renderOrder = 3;
      entGlow.add(bounce);
    }

    // D) Front-of-Mullion Optical Halation Veils, Alcove Volumetric Sun-Shafts & Entrance Fanlight Halo
    //    (0 px on V9, 0 recompiles, ALL ShaderMaterial inside noReflGroup -> preserves P1 washCandidates = 21!):
    const outsideOptics = this.outsideOpticsGroup = new THREE.Group();
    outsideOptics.visible = false;
    outer.add(outsideOptics);
    const makeOutsideOpticMat = (optMode) => new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        ...SHARED_OUTSIDE_UNIFORMS,
        uOptMode: { value: optMode }, // 0 = End Bifora halation, 1 = Right Bifora halation/solar orb, 2 = Alcove shafts, 3 = Entrance Fanlight Halo
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        varying vec3 vW, vN;
        void main() {
          vUv = uv;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec4 uOutWeights;
        uniform float uOutStrength, uOutTime, uOptMode;
        varying vec2 vUv;
        varying vec3 vW, vN;
        const vec3 L_SUN_C03_OPT = vec3(0.4950, 0.0320, -0.8683); // Cycle 6 right-window solar disk centered in open pane (y=1.71, s=21.82)
        void main() {
          float wSum = dot(uOutWeights, vec4(1.0));
          if (wSum <= 0.0005 || uOutStrength <= 0.0005) discard;
          vec3 V = normalize(cameraPosition - vW);
          float absNoV = clamp(abs(dot(normalize(vN), V)), 0.0, 1.0);
          float viewFade = smoothstep(0.02, 0.15, absNoV);
          float edgeBox = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x)
                        * smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
          vec3 acc = vec3(0.0);
          float aAcc = 0.0;

          if (uOptMode < 0.5) {
            // Mode 0: End-Bifora Subtle Black Pro-Mist Halation (Cycle 6 calibrated, C05 Win>250 <= 1.0%!)
            vec2 pCore = vec2(vW.x, vW.y - 1.72);
            vec2 pVeil = vec2(vW.x, vW.y - 2.02);
            vec2 pOc   = vec2(vW.x, vW.y - 3.175);
            float gCore = exp(-dot(pCore / vec2(0.42, 0.48), pCore / vec2(0.42, 0.48))) * 0.55
                        + exp(-dot(pCore, pCore) / (2.0 * 0.14 * 0.14)) * 0.45;
            float gVeil = exp(-dot(pVeil, pVeil) / (2.0 * 0.68 * 0.68));
            float gCrown = exp(-dot(pOc, pOc) / (2.0 * 0.42 * 0.42));
            float a5 = 0.045 * gCore + 0.025 * gVeil;
            float a4 = 0.042 * gVeil;
            float a3 = 0.048 * gVeil;
            float a2 = 0.075 * gCrown + 0.030 * gVeil;
            acc  += uOutWeights.w * vec3(1.00, 0.96, 0.88) * a5
                  + uOutWeights.z * vec3(0.84, 0.93, 1.00) * a4
                  + uOutWeights.y * vec3(1.00, 0.72, 0.30) * a3
                  + uOutWeights.x * vec3(1.00, 0.97, 0.84) * a2;
            aAcc += uOutWeights.w * a5 + uOutWeights.z * a4 + uOutWeights.y * a3 + uOutWeights.x * a2;
          } else if (uOptMode < 1.5) {
            // Mode 1: Right-Bifora Subtle Halation + Isotropic 3-Scale Radial Mie Solar Bloom at L_ORB_C03 (ZERO horizontal neon bar!)
            float uWin1 = -vW.z - 22.02;
            float inAp1 = (1.0 - smoothstep(0.62, 0.74, abs(uWin1)))
                        * smoothstep(0.60, 0.72, vW.y) * (1.0 - smoothstep(3.30, 3.46, vW.y));
            vec3 Vray1 = normalize(vW - cameraPosition);
            float sunCos1 = clamp(dot(Vray1, L_SUN_C03_OPT), -1.0, 0.999999);
            float sunAng1 = acos(sunCos1);
            float dCore1  = sunAng1 / 0.042;
            float core3   = 0.16 * exp(-(dCore1 * dCore1));
            float corona3 = 0.08 * exp(-sunAng1 / 0.085);
            float halo3   = 0.025 * exp(-sunAng1 / 0.24);
            float gate3   = 0.25 + 0.75 * inAp1;
            vec3 col3 = (vec3(1.00, 0.92, 0.74) * core3
                       + vec3(1.00, 0.76, 0.34) * corona3
                       + vec3(0.95, 0.66, 0.26) * halo3) * gate3;
            float a3 = (core3 + corona3 + halo3) * gate3;

            vec2 pCore1 = vec2(uWin1, vW.y - 1.72);
            vec2 pVeil1 = vec2(uWin1, vW.y - 2.02);
            vec2 pOc1   = vec2(uWin1, vW.y - 3.175);
            float gCore1 = exp(-dot(pCore1 / vec2(0.42, 0.48), pCore1 / vec2(0.42, 0.48))) * 0.55
                         + exp(-dot(pCore1, pCore1) / (2.0 * 0.14 * 0.14)) * 0.45;
            float gVeil1 = exp(-dot(pVeil1, pVeil1) / (2.0 * 0.68 * 0.68));
            float gCrown1 = exp(-dot(pOc1, pOc1) / (2.0 * 0.42 * 0.42));
            float a5 = 0.045 * gCore1 + 0.025 * gVeil1;
            float a4 = 0.042 * gVeil1;
            float a2 = 0.075 * gCrown1 + 0.030 * gVeil1;
            acc  += uOutWeights.y * col3
                  + uOutWeights.w * vec3(1.00, 0.96, 0.88) * a5
                  + uOutWeights.z * vec3(0.84, 0.93, 1.00) * a4
                  + uOutWeights.x * vec3(1.00, 0.97, 0.84) * a2;
            aAcc += uOutWeights.y * a3 + uOutWeights.w * a5 + uOutWeights.z * a4 + uOutWeights.x * a2;
          } else if (uOptMode < 2.5) {
            // Mode 2: Pop-Free Alcove Tyndall Sun-Shaft Curtains (planeFade * heroClear -> 0.0 before Woman 003; linear-additive calibrated!)
            float planeFade = smoothstep(0.38, 1.40, abs(dot(cameraPosition - vW, normalize(vN))));
            float heroClear = smoothstep(1.35, 3.10, length(cameraPosition - vec3(-1.24, 1.84, -22.02)));
            float shaftGuard = planeFade * heroClear;
            float smAlong = smoothstep(0.0, 0.94, vUv.x);
            float along = (smAlong > 0.0 ? pow(smAlong, 0.78) : 0.0) * smoothstep(1.0, 0.86, vUv.x);
            float vert  = smoothstep(0.0, 0.24, vUv.y) * smoothstep(1.0, 0.76, vUv.y);
            float muntinBands = 0.50 + 0.50 * cos(vUv.y * 16.5 - 0.6);
            float komoBands   = 0.62 + 0.38 * sin(vUv.y * 11.5 + uOutTime * 0.42) * cos(vUv.x * 6.5 - uOutTime * 0.30);
            float a3 = 0.068 * along * vert * muntinBands * shaftGuard;
            float a2 = 0.032 * along * vert * komoBands * shaftGuard;
            float a5 = 0.012 * along * vert * shaftGuard;
            acc  += uOutWeights.y * vec3(1.00, 0.76, 0.32) * a3
                  + uOutWeights.x * vec3(1.00, 0.94, 0.70) * a2
                  + uOutWeights.w * vec3(1.00, 0.96, 0.88) * a5;
            aAcc += uOutWeights.y * a3 + uOutWeights.x * a2 + uOutWeights.w * a5;
          } else {
            // Mode 3: Entrance Fanlight Optical Halo (Cycle 4 §2.3 calibrated: C03 fiery sunset orange, 0 sky washout!)
            vec2 pFan = vec2(vW.x, vW.y - 3.08);
            float gCore3 = exp(-dot(pFan / vec2(0.42, 0.22), pFan / vec2(0.42, 0.22)));
            float gVeil3 = exp(-dot(pFan / vec2(0.82, 0.44), pFan / vec2(0.82, 0.44)));
            float a5 = 0.080 * gCore3 + 0.032 * gVeil3;
            float a3 = 0.115 * gCore3 + 0.040 * gVeil3;
            float a4 = 0.038 * gCore3 + 0.018 * gVeil3;
            float a2 = 0.070 * gCore3 + 0.028 * gVeil3;
            acc  += uOutWeights.w * vec3(1.00, 0.96, 0.88) * a5
                  + uOutWeights.y * vec3(1.00, 0.62, 0.22) * a3
                  + uOutWeights.z * vec3(0.84, 0.93, 1.00) * a4
                  + uOutWeights.x * vec3(1.00, 0.97, 0.84) * a2;
            aAcc += uOutWeights.w * a5 + uOutWeights.y * a3 + uOutWeights.z * a4 + uOutWeights.x * a2;
          }

          // Cycle 3 Fix: Un-premultiply RGB for THREE.AdditiveBlending (SRC_ALPHA, ONE) so hardware adds acc * kScale linearly!
          float kScale = clamp(uOutStrength, 0.0, 1.4) * edgeBox * viewFade / max(1.0, wSum);
          float alphaOut = clamp(aAcc * kScale, 0.0, 1.0);
          if (alphaOut < 0.0006) discard;
          vec3 rgbUnpremul = clamp(acc / max(aAcc, 1e-4), vec3(0.0), vec3(3.0));
          gl_FragColor = vec4(rgbUnpremul, alphaOut);
        }
      `,
    });

    const endVeil = new THREE.Mesh(new THREE.PlaneGeometry(2.06, 3.24), makeOutsideOpticMat(0.0));
    endVeil.position.set(0, 2.04, -(D.VS1 - 0.055));
    endVeil.renderOrder = 4;
    outsideOptics.add(endVeil);

    const entFanHalo = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.92), makeOutsideOpticMat(3.0));
    entFanHalo.position.set(0, 3.10, -(D.Y0 + 0.04)); // s = 3.74
    entFanHalo.rotation.y = Math.PI;
    entFanHalo.renderOrder = 4;
    outsideOptics.add(entFanHalo);

    if (L.hall.vestRightWindow) {
      const sideVeil = new THREE.Mesh(new THREE.PlaneGeometry(2.06, 3.24), makeOutsideOpticMat(1.0));
      sideVeil.position.set(D.VH - 0.055, 2.04, -22.02);
      sideVeil.rotation.y = -Math.PI / 2;
      sideVeil.renderOrder = 4;
      outsideOptics.add(sideVeil);

      const shaftMat = makeOutsideOpticMat(2.0);
      for (const [sPos, yPos, tiltZ] of [[21.52, 1.92, 0.25], [22.15, 1.88, 0.27], [22.82, 1.84, 0.28]]) {
        const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.34, 2.48), shaftMat);
        shaft.position.set(0.04, yPos, -sPos);
        shaft.rotation.z = tiltZ;
        shaft.renderOrder = 4;
        outsideOptics.add(shaft);
      }
    }

    const skyEnd = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), this.biforaSkyMat || M.sky);
    skyEnd.position.set(0, 2.2, -(D.VS1 + 0.34)); g.add(skyEnd);
    if (L.hall.vestRightWindow) {
      // Slit-safe near edge (`s = 21.19 > 20.00` arch pier) + extended far edge (`s = 23.79`) covering all oblique pane angles!
      const skySide = new THREE.Mesh(new THREE.PlaneGeometry(2.60, 3.60), this.biforaSkyMat || M.sky);
      skySide.rotation.y = -Math.PI / 2;
      skySide.position.set(D.VH + 0.16, 2.15, -(D.VS0 + 2.19));
      g.add(skySide);
      this.skySideMesh = skySide;
    }

    const hemiLight = new THREE.HemisphereLight(0xfffdf7, 0xf5e5cc, 2.05);
    g.add(hemiLight);
    const midS = -((D.Y0 + D.L) * 0.5);
    const keyAlcove = new THREE.DirectionalLight(0xfff6e6, 1.05);
    keyAlcove.position.set(0.6, 4.2, -(D.VS1 + 2.0));
    keyAlcove.target.position.set(0, 1.4, midS);
    g.add(keyAlcove, keyAlcove.target);
    const fillFront = new THREE.DirectionalLight(0xfffbf2, 0.65);
    fillFront.position.set(-0.5, 3.8, -(D.Y0 - 2.0));
    fillFront.target.position.set(0, 1.4, midS);
    g.add(fillFront, fillFront.target);
    // B2: Store base light intensities so Cycles mode attenuates dynamic actors smoothly by mix(1.0, 0.48, uOutCyclesMix) (0-LSB V9!)
    this._bakedLights = [
      { light: hemiLight, base: 2.05 },
      { light: keyAlcove, base: 1.05 },
      { light: fillFront, base: 0.65 },
    ];
  }

  buildEntrance(L, g, box, wallsAlreadyBaked = false) {
    const M = this.M, { HW, C, Y0, WT } = this.D;
    let ehw = 0.84 + 0.162, etop = 2.76 + 0.66;
    const es = L.entrance.style;
    if (es === 'G12') {
      const k = this.kitPart('kit_end_double');
      k.position.set(0, 0, -Y0); g.add(k);
      this.foyerGlow(-1.2, 1.2, Y0 - 0.6, 2.7, 3.7);
    } else if (es === 'G11') {
      const k = this.kitPart('kit_door_plain');
      ehw = 0.56; etop = 2.83;
      k.position.set(0, 0, -Y0); k.rotation.y = -Math.PI / 2; g.add(k);
    } else if (es === 'open') {
      ehw = 0.86; etop = 3.0;
      if (!wallsAlreadyBaked) {
        box(-ehw - 0.06, -ehw, Y0 - WT, Y0, 0, etop, M.trim); box(ehw, ehw + 0.06, Y0 - WT, Y0, 0, etop, M.trim);
        box(-ehw - 0.06, ehw + 0.06, Y0 - WT, Y0, etop - 0.06, etop, M.trim);
      }
      this.foyerGlow(-1.6, 1.6, Y0 - 2.2, 0, 3.6);
    } else { ehw = 0; etop = 0; }

    this.entranceLeaves = [];
    if (es === 'G12' || es === 'G11' || es === 'open') {
      const f0 = Y0 - WT - 3.2, f1 = Y0 - WT;
      box(-2.4, 2.4, f0 - 0.1, f0, 0, C, M.sideRoom);
      box(-2.5, -2.4, f0, f1, 0, C, M.sideRoom); box(2.4, 2.5, f0, f1, 0, C, M.sideRoom);
      box(-2.4, 2.4, f0, f1, C, C + 0.1, M.sideRoom);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.4), new THREE.MeshBasicMaterial({ color: lin(1.0, 0.96, 0.88).multiplyScalar(1.35) }));
      glow.position.set(0, 1.6, -(f0 + 0.02)); g.add(glow);
      g.traverse(o => { if (/grand_end_[LR]_leaf$|plain_leaf$/.test(o.name) && o.parent && o.parent.name.startsWith('kit_') && o.parent.parent === g && o.parent.position.z === -Y0) this.entranceLeaves.push(o); });
    }
    if (!wallsAlreadyBaked) {
      if (ehw > 0) {
        box(-HW - WT, -ehw, Y0 - WT, Y0, 0, C, M.wall); box(ehw, HW + WT, Y0 - WT, Y0, 0, C, M.wall);
        box(-ehw, ehw, Y0 - WT, Y0, etop, C, M.wall);
      } else box(-HW - WT, HW + WT, Y0 - WT, Y0, 0, C, M.wall);
      for (const sx of [-1, 1]) {
        const [xa, xb] = [sx * (ehw + 0.16), sx * (HW + 0.004)].sort((a, b) => a - b);
        if (xb - xa > 0.02) box(xa, xb, Y0 - 0.002, Y0 + 0.022, 0, 0.285, M.trim);
      }
    }
  }

  sideVestibuleWindow(VH, VS0, VS1, VC, WT, lk) {
    const M = this.M, g = this.dyn;
    const sMid = (VS0 + VS1) * 0.5;
    const WHW = 0.86, SILL = 0.48, SPRING = 2.44;
    const sA = sMid - WHW, sB = sMid + WHW;
    const b = (x0, x1, s0, s1, z0, z1, mat, cast = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0), Math.abs(s1 - s0)), mat);
      m.position.set((x0 + x1) / 2, (z0 + z1) / 2, -(s0 + s1) / 2);
      m.castShadow = cast; m.receiveShadow = true; g.add(m); return m;
    };
    b(VH, VH + WT, VS0, sA, 0, VC, M.wall);
    b(VH, VH + WT, sB, VS1 + WT, 0, VC, M.wall);
    b(VH, VH + WT, sA, sB, 0, SILL, M.wall);
    b(VH - 0.024, VH, VS0, VS1, 0, 0.285, M.trim);
    b(VH - 0.032, VH + WT + 0.02, sA - 0.06, sB + 0.06, SILL - 0.025, SILL + 0.015, M.trim);

    const sh = new THREE.Shape();
    sh.moveTo(-WHW, SPRING);
    for (let k = 1; k < 24; k++) { const a = Math.PI * k / 24; sh.lineTo(-WHW * Math.cos(a), SPRING + WHW * Math.sin(a)); }
    sh.lineTo(WHW, SPRING); sh.lineTo(WHW, VC); sh.lineTo(-WHW, VC); sh.closePath();
    const head = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: WT, bevelEnabled: false }), M.wall);
    head.rotation.y = Math.PI / 2; head.position.set(VH, 0, -sMid);
    head.castShadow = head.receiveShadow = true; g.add(head);

    const xg = VH + 0.09;
    b(xg - 0.015, xg + 0.015, sA, sB, SPRING - 0.02, SPRING + 0.02, M.trim);
    for (const ds of [-0.43, 0, 0.43]) b(xg - 0.014, xg + 0.014, sMid + ds - 0.015, sMid + ds + 0.015, SILL, SPRING, M.trim);
    for (const zg of [1.14, 1.80]) b(xg - 0.014, xg + 0.014, sA, sB, zg - 0.012, zg + 0.012, M.trim);
    for (let k = 1; k < 6; k++) {
      const a = Math.PI * k / 6, len = WHW - 0.14;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.022, len), M.trim);
      m.position.set(xg, SPRING + Math.sin(a) * (0.14 + len / 2), -(sMid - Math.cos(a) * (0.14 + len / 2)));
      m.rotation.x = -a; m.castShadow = true; g.add(m);
    }
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 5.0), M.sky);
    sky.rotation.y = -Math.PI / 2; sky.position.set(VH + 1.8, 2.2, -sMid); g.add(sky);

    const rWinLight = new THREE.RectAreaLight(0xfff8ed, 0.55 * lk, WHW * 1.6, 1.45);
    rWinLight.position.set(VH - 0.02, 1.65, -sMid);
    rWinLight.lookAt(-VH, 0.65, -(sMid + 0.85));
    g.add(rWinLight); this.rectLights.push(rWinLight);
  }

  laylightCenters() {
    const L = this.layout, D = dims(L);
    const n = Math.max(0, L.hall.laylights | 0);
    if (n === 0) return [];
    const a = D.Y0 + 2.4, b = D.L - 1.9;
    if (n === 1) return [(a + b) / 2];
    return Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
  }

  kitPart(name) {
    const srcRoot = (name === 'kit_w01_easel' && this.easelKit) ? this.easelKit : this.kit;
    const src = srcRoot ? (srcRoot.getObjectByName(name) || (name === 'kit_w01_easel' ? srcRoot : null)) : null;
    if (!src) return new THREE.Group();
    const k = src.clone(true);
    k.traverse(o => {
      if (o.isMesh) {
        o.castShadow = !this.isUsingBaked; o.receiveShadow = !this.isUsingBaked;
        const n = (o.material && o.material.name) || '';
        const hasVC = !!o.geometry?.attributes?.color;
        if (n.startsWith('trim')) o.material = hasVC ? this.M.trimVC : this.M.trim;
        else if (n.startsWith('door')) o.material = hasVC ? this.M.doorVC : this.M.trim;
        else if (n.startsWith('brass')) o.material = this.M.brassVC;
        else if (n.startsWith('oak') || name === 'kit_w01_easel') o.material = hasVC ? this.M.easelVC : this.M.easelOak;
        else if (n.startsWith('glass')) { o.material = this.M.glass; o.castShadow = false; }
      }
      if (/leaf$/.test(o.name) && o.userData.baseY === undefined) o.userData.baseY = o.rotation.y;
    });
    return k;
  }

  foyerGlow(x0, x1, s, z0, z1) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ color: lin(1.0, 0.95, 0.87).multiplyScalar(1.3) }));
    p.position.set((x0 + x1) / 2, (z0 + z1) / 2, -s); this.dyn.add(p);
  }

  buildTinCeiling(x0, x1, y0, y1, z) {
    const nx = Math.max(1, Math.round((x1 - x0) / 0.65)), ny = Math.max(1, Math.round((y1 - y0) / 0.65));
    const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
    const geos = [];
    const B = (a, b, c, d, e, f) => {
      const geo = new THREE.BoxGeometry(b - a, f - e, d - c);
      geo.translate((a + b) / 2, (e + f) / 2, -(c + d) / 2); geos.push(geo);
    };
    for (let ix = 0; ix < nx; ix++) for (let iy = 0; iy < ny; iy++) {
      const ca = x0 + ix * dx, cb = ca + dx, ra = y0 + iy * dy, rb = ra + dy;
      const rib = 0.042, st = 0.088;
      B(ca, cb, ra, ra + rib, z - 0.026, z + 0.02); B(ca, cb, rb - rib, rb, z - 0.026, z + 0.02);
      B(ca, ca + rib, ra + rib, rb - rib, z - 0.026, z + 0.02); B(cb - rib, cb, ra + rib, rb - rib, z - 0.026, z + 0.02);
      B(ca + st, cb - st, ra + st, rb - st, z, z + 0.03);
    }
    const m = new THREE.Mesh(mergeGeometries(geos), this.M.tin);
    geos.forEach(q => q.dispose());
    m.receiveShadow = true; this.dyn.add(m);
  }

  archHead(VH, spring, rise, C, s0, s1, mat) {
    const sh = new THREE.Shape();
    sh.moveTo(-VH - 0.001, spring);
    for (let k = 1; k < 24; k++) { const a = Math.PI * k / 24; sh.lineTo(-VH * Math.cos(a), spring + rise * Math.sin(a)); }
    sh.lineTo(VH + 0.001, spring); sh.lineTo(VH + 0.001, C); sh.lineTo(-VH - 0.001, C); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: s1 - s0, bevelEnabled: false });
    const m = new THREE.Mesh(geo, mat); m.position.z = -s1; m.castShadow = m.receiveShadow = true;
    this.dyn.add(m);
  }

  windowWall(VH, VS1, VC) {
    const M = this.M, WX = 0.94, SILL = 0.42, SPRING = 2.42, T = 0.20;
    const g = this.dyn;
    const box = (x0, x1, s0, s1, z0, z1, mat, cast = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, z1 - z0, s1 - s0), mat);
      m.position.set((x0 + x1) / 2, (z0 + z1) / 2, -(s0 + s1) / 2); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m;
    };
    box(-VH, VH, VS1, VS1 + T, 0, SILL, M.trim);
    box(-VH, -WX, VS1, VS1 + T, SILL, VC, M.wall); box(WX, VH, VS1, VS1 + T, SILL, VC, M.wall);
    const sh = new THREE.Shape();
    sh.moveTo(-WX, SPRING);
    for (let k = 1; k < 24; k++) { const a = Math.PI * k / 24; sh.lineTo(-WX * Math.cos(a), SPRING + WX * Math.sin(a)); }
    sh.lineTo(WX, SPRING); sh.lineTo(WX, VC); sh.lineTo(-WX, VC); sh.closePath();
    const head = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false }), M.wall);
    head.position.z = -(VS1 + T); head.castShadow = head.receiveShadow = true; g.add(head);
    const yg = VS1 + 0.08;
    box(-WX, WX, yg, yg + 0.03, SPRING - 0.02, SPRING + 0.02, M.trim);
    for (const xg of [-0.47, 0, 0.47]) box(xg - 0.015, xg + 0.015, yg, yg + 0.028, SILL, SPRING, M.trim);
    for (const zg of [1.10, 1.80]) box(-WX, WX, yg, yg + 0.028, zg - 0.012, zg + 0.012, M.trim);
    for (let k = 1; k < 6; k++) {
      const a = Math.PI * k / 6, len = WX - 0.14;
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.022, 0.028), M.trim);
      m.position.set(Math.cos(a) * (0.14 + len / 2), SPRING + Math.sin(a) * (0.14 + len / 2), -(yg + 0.014));
      m.rotation.z = a; m.castShadow = true; g.add(m);
    }
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), M.sky);
    sky.position.set(0, 2.5, -(VS1 + 3.0)); g.add(sky);
  }

  buildLights(L) {
    const D = this.D, g = this.dyn;
    const H = (x, y, s) => new THREE.Vector3(x, y, -s);
    const place = (light, tgtHall, travelHall, dist) => {
      const t = travelHall.clone().normalize();
      light.target.position.copy(H(tgtHall.x, tgtHall.y, tgtHall.z));
      light.position.copy(H(tgtHall.x - t.x * dist, tgtHall.y - t.y * dist, tgtHall.z - t.z * dist));
      g.add(light, light.target);
    };

    const e = THREE.MathUtils.degToRad(17.5), a = THREE.MathUtils.degToRad(-9.5);
    const sun = new THREE.DirectionalLight(0xffe9c8, 2.85 * (L.light.windowSun ?? 1));
    place(sun, new THREE.Vector3(0, 0, D.L - 1.0), new THREE.Vector3(Math.sin(a) * Math.cos(e), -Math.sin(e), -Math.cos(a) * Math.cos(e)), 16);
    this.shadowSetup(sun, 9.5, 8.5, 2.6);
    this.sun = sun;

    this.doorSuns = [];
    for (const t of this.doorSunTargets) {
      const sg = t.side === 'L' ? -1 : 1;
      const openDeg = Math.max(4, t.open);
      const dsSign = (t.swing === 'in' ? 1 : -1) * sg;
      const psi = THREE.MathUtils.degToRad((t.swing === 'in' ? 15.5 : 17.5) + 0.15 * Math.max(0, openDeg - 15));
      const elev = THREE.MathUtils.degToRad(13.5);
      const dx = -sg * Math.cos(elev) * Math.cos(psi);
      const dy = -Math.sin(elev);
      const dsHall = dsSign * Math.cos(elev) * Math.sin(psi);
      const ds = new THREE.DirectionalLight(0xffe2ad, 6.2 * (L.light.doorSun ?? 1));
      const sMid = t.s + (dsHall / Math.abs(dx)) * D.HW;
      place(ds, new THREE.Vector3(0, 0.45, sMid), new THREE.Vector3(dx, dy, dsHall), 8.5);
      ds.castShadow = true;
      ds.shadow.mapSize.set(2048, 2048);
      const sc = ds.shadow.camera;
      sc.left = -1.15; sc.right = 1.15; sc.bottom = -1.15; sc.top = 1.15;
      sc.near = 2.0; sc.far = 15.0;
      ds.shadow.bias = -0.00012;
      ds.shadow.normalBias = 0.0025;
      ds.shadow.radius = 1.25;
      this.doorSuns.push(ds);
    }
  }

  shadowSetup(l, w, h, radius = 2.5) {
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    const c = l.shadow.camera; c.left = -w; c.right = w; c.top = h; c.bottom = -h; c.near = 0.5; c.far = 40;
    l.shadow.bias = -0.00025; l.shadow.normalBias = 0.012; l.shadow.radius = radius;
  }

  buildArt(L, bakedShadows = false) {
    this.artGroup.clear();
    this.artMeshes = {};
    const frameGeos = [];
    const posterPaperMat = this._posterPaperMat || (this._posterPaperMat = (() => {
      const m = new THREE.MeshStandardMaterial({
        color: lin(0.95, 0.93, 0.89), roughness: 0.88, metalness: 0.0, envMapIntensity: 0.15,
      });
      m.userData._toneUniformsBound = true;
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec4 uOutWeights;\nuniform float uOutStrength;')
          .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
            if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005) {
              float kP = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
              reflectedLight.directDiffuse   *= mix(1.0, 0.48, kP);
              reflectedLight.indirectDiffuse *= mix(1.0, 0.48, kP);
            }`);
      };
      return m;
    })());
    const posterShadowMat = this._posterShadowMat || (this._posterShadowMat = (() => {
      const m = this.M.dropShadow.clone();
      m.opacity = 0.38;
      return m;
    })());
    const onSwap = (mapTex, m) => this.queueArtSwap(mapTex, m);
    for (const a of L.art) {
      const c = CATALOG[a.id]; if (!c) continue;
      const isPoster = c.kind === 'poster';
      const { w, h } = artSize(a);
      const xi = wallX(L, a.wall, a.s);
      const grp = new THREE.Group();
      grp.position.set(xi, a.y, -a.s);
      grp.rotation.y = a.wall === 'L' ? Math.PI / 2 : -Math.PI / 2;

      const artUrl = (this.useFastArt && c.fastUrl) ? (c.fastUrl + ASSET_VER) : c.url;
      const mapTex = tex(artUrl, { aniso: 8 });

      if (isPoster) {
        // Frameless matte paper poster sheet mounted directly to the gallery plaster wall (ZERO black frame, ZERO border):
        const sheet = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.0022), posterPaperMat);
        sheet.position.z = 0.0018;
        grp.add(sheet);

        const mat = makeArtMaterial(mapTex, { onSwap, frameShadow: false, posterMode: 1, roughness: 0.86 });
        const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        art.position.z = 0.0033;
        grp.add(art);

        const ps = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.055, h * 1.048), posterShadowMat);
        ps.position.set(0.004, -0.009, 0.0006);
        ps.userData.noRefl = true;
        grp.add(ps);

        this.artGroup.add(grp);
        const meshRec = { group: grp, art, mat, w, h, item: a };
        if (a.uid) this.artMeshes[a.uid] = meshRec;
        if (!this.artMeshes[a.id]) this.artMeshes[a.id] = meshRec;
        continue;
      }

      if (bakedShadows) {
        // Hollow 4-bar perimeter frame (ZERO solid black geometry behind the canvas interior -> 0% grazing reflection Z-fight!):
        const fw = w + 0.014, fh = h + 0.014, bt = 0.036, fd = 0.0475;
        grp.updateMatrix();
        for (const [bw, bh, bx, by] of [
          [fw, bt, 0,  (fh - bt) * 0.5],
          [fw, bt, 0, -(fh - bt) * 0.5],
          [bt, fh - 2 * bt, -(fw - bt) * 0.5, 0],
          [bt, fh - 2 * bt,  (fw - bt) * 0.5, 0],
        ]) {
          const fg = new THREE.BoxGeometry(bw, bh, fd);
          fg.translate(bx, by, fd * 0.5);
          fg.applyMatrix4(grp.matrix);
          frameGeos.push(fg);
        }
      } else {
        const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.046, h + 0.046, 0.048), this.M.frame);
        fr.position.z = 0.024; fr.castShadow = true; fr.receiveShadow = true; grp.add(fr);
      }
      const mat = makeArtMaterial(mapTex, { onSwap });
      const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      art.position.z = 0.0508; grp.add(art);
      const defA = DEFAULT_LAYOUT.art.find(q => q.id === a.id && !a.uid);
      const artMoved = !defA || defA.wall !== a.wall || Math.abs(defA.s - a.s) > 0.05 || Math.abs(defA.y - a.y) > 0.05;
      if (!bakedShadows || artMoved) {
        const ds = new THREE.Mesh(new THREE.PlaneGeometry((w + 0.046) * 1.24, (h + 0.046) * 1.22), this.M.dropShadow);
        ds.position.set(0.010, -0.040, 0.002);
        ds.userData.noRefl = true;
        grp.add(ds);
      }
      this.artGroup.add(grp);
      const meshRec = { group: grp, art, mat, w, h, item: a };
      if (a.uid) this.artMeshes[a.uid] = meshRec;
      if (!this.artMeshes[a.id]) this.artMeshes[a.id] = meshRec;
    }
    if (frameGeos.length) {
      const mergedF = new THREE.Mesh(mergeGeometries(frameGeos), this.M.frame);
      frameGeos.forEach(g => g.dispose());
      this.artGroup.add(mergedF);
    }
  }

  buildStand(L, bakedShadows = false) {
    if (this.stand) this.scene.remove(this.stand);
    const st = new THREE.Group();
    const M = this.M;
    const pw = 0.74, ph = pw * POSTER.px[1] / POSTER.px[0], lean = THREE.MathUtils.degToRad(8.5), zb = 0.80;
    const posterUrl = (this.useFastArt && POSTER.fastUrl) ? (POSTER.fastUrl + ASSET_VER) : POSTER.url;
    const pt = tex(posterUrl, { aniso: 8 });

    const hasW01 = this.easelKit || (this.kit && this.kit.getObjectByName('kit_w01_easel'));
    if (hasW01) st.add(this.kitPart('kit_w01_easel'));

    const board = new THREE.Group();
    board.position.set(0, zb + 0.003, 0.046);
    board.rotation.x = -lean;
    st.add(board);

    const back = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.024, ph + 0.024, 0.018), M.easelOak);
    back.position.set(0, (ph + 0.024) / 2, -0.010);
    back.castShadow = !bakedShadows; back.receiveShadow = !bakedShadows;
    board.add(back);

    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(pw, ph),
      makeArtMaterial(pt, { roughness: 0.82, posterMode: 2, onSwap: (mapTex, m) => this.queueArtSwap(mapTex, m) })
    );
    poster.position.set(0, ph / 2 + 0.012, 0.0005);
    board.add(poster);
    attachPosterFrameAccents(board, pw, ph, M.easelOak, M.brass);

    const fsh = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.88), M.easelShadow);
    fsh.rotation.x = -Math.PI / 2;
    fsh.position.set(0, 0.0018, -0.14);
    fsh.userData.noRefl = true;
    st.add(fsh);

    st.position.set(L.stand.x, 0, -L.stand.s);
    st.rotation.y = -THREE.MathUtils.degToRad(L.stand.face) + Math.PI;
    this.scene.add(st);
    this.stand = st;
    this.posterMesh = poster;
  }

  static applyPose(camera, p) {
    camera.position.set(p.x, p.h ?? 1.58, -p.s);
    camera.rotation.set(
      THREE.MathUtils.degToRad(p.pitch || 0),
      -THREE.MathUtils.degToRad(p.dir),
      THREE.MathUtils.degToRad(p.roll || 0),
      'YXZ'
    );
    if (p.fov && camera.fov !== p.fov) { camera.fov = p.fov; camera.updateProjectionMatrix(); }
  }

  static readPose(camera) {
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    const dir = ((-THREE.MathUtils.radToDeg(e.y)) % 360 + 360) % 360;
    return {
      s: +(-camera.position.z).toFixed(2),
      x: +(camera.position.x).toFixed(2),
      h: +(camera.position.y).toFixed(2),
      dir: +dir.toFixed(1),
      pitch: +THREE.MathUtils.radToDeg(e.x).toFixed(1),
      fov: +camera.fov.toFixed(1),
    };
  }

  render(camera, target = null) {
    const r = this.renderer;
    camera.updateMatrixWorld();
    // B2: Smoothly attenuate baked-room dynamic actor lights by mix(1.0, 0.48, uOutCyclesMix) (0-LSB on V9!)
    if (this._bakedLights) {
      const kL = 1.0 + (0.48 - 1.0) * SHARED_OUTSIDE_UNIFORMS.uOutCyclesMix.value;
      for (let i = 0; i < this._bakedLights.length; i++) {
        this._bakedLights[i].light.intensity = this._bakedLights[i].base * kL;
      }
    }
    // H1: Run OutsideLerpCompositor BEFORE the reflRT floor-mirror pass so reflections see freshly composited lightmaps!
    updateOutsideCompositor(this);
    const isCycles = SHARED_OUTSIDE_UNIFORMS.uOutCyclesMix.value > 0.0005;
    // Bug 2 & 3 Seal (0-LSB on V9): hide V9 entFloor in Cycles; show weatherstrip always & stone terrace only when open!
    if (!this._warmingPaths) {
      const entOpen = (this.bakedU?.uEntOpen?.value || 0) > 0.002;
      if (this.entFloorV9) this.entFloorV9.visible = !isCycles;
      if (this.entFloorCycles) this.entFloorCycles.visible = isCycles && entOpen;
      if (this.entThresholdStrip) this.entThresholdStrip.visible = isCycles;
    }
    const fl = this.isUsingBaked ? this.bakedFloorObj : this.floorMesh;
    if (fl) {
      // B3a: DPR-locked 512x288 (384x216 portrait) strictly on Cycles; keep legacy _sz >> 2 on V9 for 0-LSB on DPR=1!
      let w, h;
      if (isCycles) {
        const isPort = (camera.aspect || 1.78) < 1.0;
        w = isPort ? 384 : 512;
        h = isPort ? 216 : 288;
      } else {
        r.getDrawingBufferSize(this._sz);
        w = Math.min(512, Math.max(256, this._sz.x >> 2));
        h = Math.min(288, Math.max(144, this._sz.y >> 2));
      }
      const resized = (this.reflRT.width !== w || this.reflRT.height !== h);
      if (resized) this.reflRT.setSize(w, h);

      const posDelta  = camera.position.distanceToSquared(this._lastCamPos);
      const quatDelta = 1.0 - Math.abs(camera.quaternion.dot(this._lastCamQuat));
      const fovDelta  = Math.abs((camera.fov || 50) - this._lastCamFov);
      // Update EVERY frame on micro-motion, fovDelta, or live dynamic actors (birds/leaves/doors):
      if (resized || this.reflDirty || this._dynActorsActive || posDelta > 1e-13 || quatDelta > 1e-13 || fovDelta > 1e-4) {
        this._lastCamPos.copy(camera.position);
        this._lastCamQuat.copy(camera.quaternion);
        this._lastCamFov = camera.fov || 50;
        this.reflDirty = false;

        const rc = this.reflCam;
        rc.fov    = isCycles ? Math.min(82, camera.fov * 1.14) : camera.fov;
        rc.aspect = camera.aspect;
        rc.near   = isCycles
          ? 0.24
          : Math.max(0.28, Math.min(1.10, Math.abs(camera.position.y) * 0.72));
        rc.far    = 36.0;
        rc.position.set(camera.position.x, -camera.position.y, camera.position.z);
        this._fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
        this._up.set(0, 1, 0).applyQuaternion(camera.quaternion);
        this._fwd.y *= -1;
        this._up.y  *= -1;
        rc.up.copy(this._up);
        this._look.copy(rc.position).add(this._fwd);
        rc.lookAt(this._look);
        rc.updateMatrixWorld(true);
        rc.updateProjectionMatrix();

        this.reflMatrix.set(
          0.5, 0.0, 0.0, 0.5,
          0.0, 0.5, 0.0, 0.5,
          0.0, 0.0, 0.5, 0.5,
          0.0, 0.0, 0.0, 1.0
        ).multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse);

        const prevBg = this.scene.background;
        const noRefl = this._noReflMeshes;
        const damp = this._reflDampMats;
        // B4a: Wrap uInReflPass, scene.background, damp, noRefl & fl.visible in try/finally so state NEVER leaks!
        try {
          fl.visible = false;
          if (this.noReflGroup) this.noReflGroup.visible = false;
          for (let i = 0; i < noRefl.length; i++) {
            const o = noRefl[i];
            o._wasVisRefl = o.visible;
            o.visible = false;
          }
          for (let i = 0; i < damp.length; i++) {
            const d = damp[i], m = d.mat;
            if (d.isBrass) {
              d.origM = m.metalness; d.origR = m.roughness; d.origEnv = m.envMapIntensity;
              m.metalness = 0.10; m.roughness = 0.82; m.envMapIntensity = 0.04;
            } else {
              d.origEm = m.emissiveIntensity;
              m.emissiveIntensity = d.origEm * 0.16;
            }
          }
          if (isCycles) {
            SHARED_OUTSIDE_UNIFORMS.uInReflPass.value = 1.0;
            this.scene.background = this._reflBgDark;
          }
          r.setRenderTarget(this.reflRT);
          r.clear();
          r.render(this.scene, rc);
        } finally {
          SHARED_OUTSIDE_UNIFORMS.uInReflPass.value = 0.0;
          this.scene.background = prevBg;
          for (let i = 0; i < damp.length; i++) {
            const d = damp[i], m = d.mat;
            if (d.isBrass) {
              m.metalness = d.origM; m.roughness = d.origR; m.envMapIntensity = d.origEnv;
            } else {
              m.emissiveIntensity = d.origEm;
            }
          }
          for (let i = 0; i < noRefl.length; i++) {
            const o = noRefl[i];
            o.visible = o._wasVisRefl;
          }
          if (this.noReflGroup) this.noReflGroup.visible = true;
          fl.visible = true;
        }
        // B4a: Restore target BEFORE running 2-pass separable anisotropic pre-blur (reflBlurH/V)!
        r.setRenderTarget(target);
        if (this._cyclesAntiTwitchOn && isCycles && this.reflBlurH && this.reflBlurV) {
          this.ensureReflBlurTargets();
          runReflBlurPass(r, this.reflRT, this.reflBlurH, this.reflBlurV);
        }
      }
    }
    r.setRenderTarget(target);
    r.render(this.scene, camera);
  }

  // H1: Clean GPU resource disposal (compositor RTs, outside lightmaps/probes/plates, sidecar trim VBOs, reflRT, blur RTs, fixtures).
  dispose() {
    this.setCyclesAntiTwitchExtras(false);
    disposeOutsideGpuResources(this);
    if (this.fixtures?.dispose) {
      this.fixtures.dispose();
      this.fixtures = null;
    }
    if (this.reflRT) {
      this.reflRT.dispose();
      this.reflRT = null;
    }
    if (this.bakedPack) {
      const pk = this.bakedPack;
      for (const k of ['tWalls', 'tCeil', 'tFloor', 'tWallsF', 'tCeilF', 'tFloorF', '_dummyBlack']) {
        if (pk[k] && !pk[k].userData?._evicted) pk[k].dispose();
      }
      pk._v9Evicted = true;
    }
    if (this.scene?.environment) {
      this.scene.environment.dispose();
      this.scene.environment = null;
    }
    this._v9RefMats?.clear();
  }
}
