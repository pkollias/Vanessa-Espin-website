// HK02 Town Hall corridor (`v5` — Widened `3.92 m` Hall + `3.00 m` Alcove, Blotch-Free Satin-Enamel Joinery,
// Fast Parallel Room Boot, & Interactive `HK02` Striped Peach-Apricot Arch Wallpaper Lab).
// Shared by `layout.html` (the placement tool) and `film.html` (the 60 fps film).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAINT_GLSL } from './paint.js?v=20261125v31';
import { buildTownHallFixtures, attachPosterFrameAccents } from './fixtures.js?v=20261125v31';

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
// Exact `HK02` Soft-Shoulder Photometric Tone Mapping (`build_highkey_townhall.py` line 378!)
//   mapped = where(x <= 0.62, x, 0.62 + 0.38 * (1.0 - exp(-(x - 0.62) / 0.42)))
// ---------------------------------------------------------------------------
let toneInstalled = false;
export function installHK02Tone() {
  if (toneInstalled) return;
  toneInstalled = true;
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `vec3 CustomToneMapping( vec3 color ) {
      vec3 x = max(color * toneMappingExposure, vec3(0.0));
      vec3 toe = pow(clamp(x / 0.62, 0.0, 1.0), vec3(1.16)) * 0.62;
      vec3 hi  = vec3(0.62) + 0.372 * (vec3(1.0) - exp(-max(x - vec3(0.62), vec3(0.0)) / 0.44));
      return clamp(mix(toe, hi, step(vec3(0.62), x)), 0.0, 1.0);
    }`
  );
}

const texLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const texCache = new Map();
export const texListeners = new Set();

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
export function makeArtMaterial(mapTex, { roughness = 0.88, polygonOffset = false, frameShadow = true, onSwap = null } = {}) {
  const isReady = !!(mapTex && mapTex.image);
  const m = new THREE.MeshStandardMaterial({
    map: isReady ? mapTex : null,
    color: isReady ? 0xffffff : lin(0.92, 0.89, 0.84),
    roughness, metalness: 0.0, envMapIntensity: 0.0, toneMapped: false,
    polygonOffset, polygonOffsetFactor: polygonOffset ? -2 : 0, polygonOffsetUnits: polygonOffset ? -2 : 0,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFrameSh = { value: frameShadow ? 1.0 : 0.0 };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFrameSh;')
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
          outgoingLight = clamp(diffuseColor.rgb * eMuseum * sFr, 0.0, 1.0);
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
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec2 uStripCell;')
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
        `diffuseColor.rgb = clamp(diffuseColor.rgb * vec3(1.004, 1.000, 0.992), 0.0, 1.0);
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
    this._lastCamPos = new THREE.Vector3(1e9, 1e9, 1e9);
    this._lastCamQuat = new THREE.Quaternion();
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

  // Rebuilds flat cached lists of `userData.noRefl` overlay/decal meshes and sub-pixel metallic/HDR-bulb materials
  // ONCE on scene/overlay build (never traversing per-frame!) so `reflRT` never Z-fights or flickers on brass doorknobs!
  rebuildReflCaches() {
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
      if (t.image) this.renderer.initTexture(t);
    }
    this.reflDirty = true;
  }

  // Warms BOTH the `reflRT` (`HalfFloat` / `srgb-linear`) AND main canvas (`srgb`) shader variants across ALL scene meshes
  // (including frustum-culled corridor/easel/bird/patch meshes) inside a 1x1 scissor BEFORE `#loading` is removed -> 0 crane freezes!
  warmAllRenderPaths(camera, extraHidden = []) {
    this.rebuildReflCaches();
    const r = this.renderer;
    const saved = [];
    const hiddenSet = new Set(extraHidden.filter(Boolean));
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
    this.render(camera);
    r.setScissorTest(false);
    for (const s of saved) {
      s.o.frustumCulled = s.fc;
      s.o.visible = s.vis;
    }
    this.reflDirty = true;
  }

  async loadBakedPack() {
    try {
      const BV = ASSET_VER;
      const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      // Fire `meta.json`, `room.glb`, and all room lightmap + Town Hall narrow strip floor WebPs 100% IN PARALLEL:
      const metaP   = fetch(BAKED_DIR + 'meta.json' + BV, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null);
      const gltfP   = gltfLoader.loadAsync(BAKED_DIR + 'room.glb' + BV);
      const tWalls  = tex(BAKED_DIR + 'walls.webp' + BV,               { srgb: true,  flipY: false, mips: false, aniso: 1 });
      const tCeil   = tex(BAKED_DIR + 'ceiling.webp' + BV,             { srgb: true,  flipY: false, mips: false, aniso: 1 });
      const tFloor  = tex(BAKED_DIR + 'floor.webp' + BV,               { srgb: true,  flipY: false, mips: false, aniso: 1 });
      const tWallsF = tex(BAKED_DIR + 'walls_fix.webp' + BV,           { srgb: true,  flipY: false, mips: false, aniso: 1 });
      const tCeilF  = tex(BAKED_DIR + 'ceiling_fix.webp' + BV,         { srgb: true,  flipY: false, mips: false, aniso: 1 });
      const tFloorF = tex(BAKED_DIR + 'floor_fix.webp' + BV,           { srgb: true,  flipY: false, mips: false, aniso: 1 });
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

    // Shared 4-Tap Hardware Bicubic B-Spline Filter (eliminates 8-bit WebP contour rings on smooth gallery walls!),
    // Interleaved Gradient Noise (eliminates 8-bit display Mach banding), and Continuous Kelvin Warmth Curves!
    const LIGHT_COMMON_GLSL = /* glsl */`
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

    // 1. 1:1 Cycles-Baked Gallery Plaster Walls (Bicubic B-Spline Filtered + Separated Ambient & Warm Fixture GI)!
    const wallUniforms = {
      tLight:    { value: pk.tWalls },
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
        uniform sampler2D tLight, tLightFix, tWallNor;
        uniform float uScale, uFixScale, uBakeExp, uAmbientGain, uSpotGain, uSconceGain, uLightWarmth, uShadowDepth, uWallWhite, uHasFixMaps;
        uniform float uBakedV6, uArchMode, uArchPitch, uArchWarmth, uArchTexture, uArchRim;
        uniform float uArchS, uHalfW, uVH, uArchSpr, uArchRise, uCeilH, uAlcoveCeilH, uExtraH, uWallGrade;
        uniform float uContrastFix, uSkylightMode, uHideAlcoveWin, uWinLightMode, uWinDesign, uTime, uDualUv;
        uniform vec2 uWinCut;
        uniform vec4 uWinBay0, uWinBay1;
        varying vec2 vUv, vUv2;
        varying float vBlend;
        varying vec3 vW, vN;
        ${hasPaint ? PAINT_GLSL : ''}
        ${LIGHT_COMMON_GLSL}
        ${WALL_GRADE_GLSL}
        ${WIN_SUN_GLSL}

        bool inNarrowWinHole(vec4 bay, float x, float s, float y) {
          return bay.w > 0.5 && (x * bay.x > 0.85) && abs(s - bay.y) < (uWinCut.x + 0.015) && y > 0.90 && y < (uWinCut.y + 0.02);
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

          // 4-tap Bicubic B-Spline sampling completely eliminates 8-bit WebP contour rings on smooth plaster!
          vec3 rawTex = (uDualUv > 0.5)
            ? mix(min(textureBicubic(tLight, vUv, vec2(2048.0)).rgb, vec3(0.225)),
                  min(textureBicubic(tLight, vUv2, vec2(2048.0)).rgb, vec3(0.225)), smoothstep(0.0, 1.0, vBlend))
            : textureBicubic(tLight, vUv, vec2(2048.0)).rgb;

          // Calibrate Pass A (v8 window-only GI) + soft highlight roll-off so Crisp Gallery White reads as true luminous off-white
          // while warm 2516K S5 uplights & Bifora window daylight shine with crisp contrast (zero white-shoulder washout!):
          vec3 rawLin = rawTex * uScale;
          rawLin = rawLin / (vec3(1.0) + max(vec3(0.0), rawLin - vec3(0.85)) * 0.68);
          vec3 ambIrr = (rawLin * 0.80 + vec3(0.155)) * (uBakeExp * uAmbientGain);
          vec3 fixIrr = vec3(0.0);
          if (uHasFixMaps > 0.5) {
            vec3 rawFix = (uDualUv > 0.5)
              ? mix(textureBicubic(tLightFix, vUv, vec2(1024.0)).rgb,
                    textureBicubic(tLightFix, vUv2, vec2(1024.0)).rgb, smoothstep(0.0, 1.0, vBlend))
              : textureBicubic(tLightFix, vUv, vec2(1024.0)).rgb;
            float spotLin   = rawFix.r * uFixScale;
            float sconceLin = rawFix.g * uFixScale;
            // Smooth near-field uplight compression prevents pure-white oval clipping right above S5 bowls while preserving rich 2516K warmth:
            sconceLin = sconceLin / (1.0 + max(0.0, sconceLin - 0.36) * 1.45);
            fixIrr = (spotLin * (0.76 * uSpotGain) * evalSpotKelvin(uLightWarmth)
                    + sconceLin * (0.50 * uSconceGain) * evalSconceKelvin(uLightWarmth)) * uBakeExp;
          }

          vec3 baseIrr = ambIrr + fixIrr;
          vec3 N = normalize(vN);
          vec3 basePlaster;
          float shWall = mix(1.0, 1.0 + 0.16 * clamp(uShadowDepth, 0.0, 2.0), uContrastFix);

          if (sCoord >= uArchS - 0.01 && sCoord <= uArchS + 0.31 && N.z < 0.72) {
            // Subtle warm-stone arch soffit depth:
            float revShade = mix(0.95, pow(0.84 + 0.08 * max(-N.y, 0.0), shWall), uContrastFix);
            vec3 revIrr = mix(baseIrr * revShade, vec3(0.68, 0.66, 0.63) * (revShade * uBakeExp * (uAmbientGain + 0.16 * uSpotGain)), 0.35);
            basePlaster = gradeWallPlaster(revIrr, vW.y, effCeilH, uWallGrade, uWallWhite);
          } else if (sCoord > uArchS + 0.28) {
            // Seamless C0 alcove plaster across Left, Right & End Bifora walls (zero whiter end-wall jump & zero y=0.62 apron step!):
            float dHoriz = (N.z > 0.5)
              ? max(0.0, uVH - abs(vW.x))
              : min(max(0.0, sCoord - (uArchS + 0.30)), max(0.0, (uArchS + 3.92) - sCoord));
            float dPocket = min(dHoriz, max(0.0, effVC - vW.y));
            float pAO = pow(mix(1.0, mix(0.91, 1.0, smoothstep(0.0, 0.38, dPocket)), uContrastFix), shWall);
            if (N.z > 0.5 && sCoord > uArchS + 3.84) {
              float underPerch = (1.0 - smoothstep(0.84, 0.98, abs(vW.x))) * smoothstep(0.46, 0.618, vW.y) * (1.0 - smoothstep(0.622, 0.66, vW.y));
              vec3 smoothAlcoveAmb = vec3(0.955, 0.946, 0.928) * ((0.93 + 0.05 * (vW.y / effVC)) * (1.0 - 0.06 * underPerch) * uBakeExp * uAmbientGain);
              baseIrr = (smoothAlcoveAmb + fixIrr) * pAO;
            } else {
              baseIrr = (ambIrr + fixIrr) * pAO;
            }
            basePlaster = gradeWallPlaster(baseIrr, vW.y, effVC, uWallGrade, uWallWhite);
          } else {
            float aoTop = pow(mix(1.0, mix(0.92, 1.0, smoothstep(0.05, 0.38, effCeilH - vW.y)), uContrastFix), shWall);
            float aoBot = pow(mix(0.955, 1.0, smoothstep(0.315, 0.40, vW.y)), shWall);
            baseIrr = baseIrr * (aoTop * aoBot) + evalSideWindowSun(vW, N, 0.0);
            basePlaster = gradeWallPlaster(baseIrr, vW.y, effCeilH, uWallGrade, uWallWhite);
          }

          vec2 wUv = (abs(N.z) > 0.5) ? vec2(vW.x, vW.y) : vec2(sCoord, vW.y);
          float fw = max(fwidth(wUv.x), fwidth(wUv.y));
          float closeFade = 1.0 / (1.0 + fw * 64.0);

          vec3 nCoarse = texture2D(tWallNor, wUv / 1.85).xyz * 2.0 - 1.0;
          vec3 nFine   = texture2D(tWallNor, wUv * 1.65 + vec2(0.37, 0.19)).xyz * 2.0 - 1.0;
          vec2 dN = nCoarse.xy * 0.16 + nFine.xy * (0.18 * closeFade);

          float rakeY = dN.y * 0.115;
          float rakeS = dN.x * 0.072 * sign(sCoord - 12.0);
          float microMod = clamp(1.0 + (rakeY + rakeS) * (0.48 + 0.52 * closeFade), 0.94, 1.06);
          vec3 lit = basePlaster * microMod;

          if (uArchMode > 0.5 && sCoord >= uArchS - 0.03 && sCoord <= uArchS + 0.33 && vW.y < effCeilH - 0.085) {
            lit *= evalHK02ArchFinish(vW, N, nFine.xy, effCeilH);
          }

          vec3 V = normalize(cameraPosition - vW);
          float graze = pow(1.0 - max(dot(N, V), 0.0), 4.5);
          lit += lit * graze * 0.022;

          ${hasPaint ? 'lit = evalWallPaintKM(lit, vW, N);' : ''}

          gl_FragColor = vec4(lit, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb += ignDither(gl_FragCoord.xy) / 255.0;
        }
      `,
    });

    // 2. Cycles-Baked 3D Coved Pressed-Tin Ceiling + BVHTree Corner AO + Warm Fixture Uplight + Ceiling Colour Propagation!
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
        uniform vec4 uLay0, uLay1, uLay2, uLay3, uWinBay0, uWinBay1;
        varying vec2 vUv;
        varying vec3 vW, vN;
        varying vec4 vCol;
        ${LIGHT_COMMON_GLSL}

        void main() {
          float ax = abs(vW.x);
          float s = -vW.z;
          vec2 uvSample = vUv;
          if (uBakedV6 > 0.5 && s < uArchS + 0.05) {
            uvSample.y = max(uvSample.y, 0.205);
          }
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
          vec3 c = cAmb + cFix;

          vec3 nFlat = normalize(cross(dFdx(vW), dFdy(vW)));
          if (dot(nFlat, vN) < 0.0) nFlat = -nFlat;
          vec3 Nc = normalize(mix(vN, nFlat, mix(0.22, 0.92, uContrastFix)));

          // Split shadow depth: uCeilShadowDepth (135% ★) sculpts ONLY the pressed-tin coffer & rosette pattern,
          // while perimeter cornerAO stays gentle on uShadowDepth (88% ★) so surrounding cornice accents never darken!
          float shPerim = clamp(uShadowDepth, 0.0, 2.2) * uContrastFix;
          float shTin   = clamp(uCeilShadowDepth, 0.0, 2.5) * uContrastFix;
          vec3 L_spine = normalize(vec3(vW.x, -0.32, 0.16));
          float spineRake = dot(Nc, L_spine);
          float cofferSlope = clamp(1.0 - abs(Nc.y), 0.0, 1.0);
          float cornerAO = (uHasCornerAO > 0.5) ? mix(1.0, smoothstep(0.18, 0.86, vCol.r), 0.10 * shPerim) : 1.0;
          float rawShade = cornerAO * (1.0 + shTin * (0.125 * Nc.z + 0.115 * spineRake - 0.195 * cofferSlope));
          c *= clamp(rawShade, 0.66, 1.16);

          bool underRod = (s > 4.42 && s < uArchS - 0.62) || (s > uArchS + 0.60 && s < uArchS + 3.40);
          if (underRod) {
            c *= mix(0.88, 1.0, smoothstep(0.018, 0.068, ax));
          }

          vec3 V = normalize(cameraPosition - vW);
          float coat = pow(1.0 - max(dot(Nc, V), 0.0), 3.8) * 0.048;
          c += c * coat;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb += ignDither(gl_FragCoord.xy) / 255.0;
        }
      `,
    });

    // 2b. Backlit Milk-Glass Skylight Panes & Luminous Romanesque Bifora Morning Daylight Sky!
    this.milkLayMat = new THREE.ShaderMaterial({
      uniforms: { uLayX: { value: layXRange }, uExtraH: this.bakedU.uExtraH },
      vertexShader: VERT_BAKE,
      fragmentShader: /* glsl */`
        uniform vec2 uLayX;
        varying vec3 vW;
        void main() {
          float ax = abs(vW.x);
          float edgeX = smoothstep(0.0, 0.06, min(ax - uLayX.x, uLayX.y - ax));
          vec3 c = mix(vec3(2.25, 2.26, 2.30), vec3(3.15, 3.18, 3.24), edgeX);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    this.biforaSkyMat = new THREE.ShaderMaterial({
      uniforms: { uAmbientGain: this.bakedU.uAmbientGain },
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
        varying vec2 vUv;
        varying vec3 vW;
        void main() {
          // Natural luminous morning daylight streaming through the 1862 Romanesque Bifora panes:
          float yN = clamp((vW.y - 0.55) / 3.10, 0.0, 1.0);
          vec2 sunOff = vec2((vW.x - 0.14) / 0.92, (vW.y - 2.18) / 1.38);
          float sunBloom = exp(-dot(sunOff, sunOff) * 0.85);
          float softHaze = exp(-abs(vW.x) / 1.45);
          vec3 lowWarm  = vec3(2.55, 2.40, 2.12);
          vec3 midSun   = vec3(3.65, 3.52, 3.22);
          vec3 highSky  = vec3(2.95, 2.98, 3.05);
          vec3 baseSky  = mix(lowWarm, highSky, smoothstep(0.04, 0.92, yN));
          vec3 rad = mix(baseSky, midSun, sunBloom * 0.76) * (0.90 + 0.14 * softHaze) * (0.72 + 0.52 * uAmbientGain);
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
        varying vec2 vUv;
        varying vec3 vW;
        void main() {
          // Luminous warm golden-morning sky beyond the grand entrance doors (brightens warmly as doors swing open!)
          float yN = clamp(vW.y / 3.60, 0.0, 1.0);
          vec2 sunOff = vec2(vW.x / 1.15, (vW.y - 1.95) / 1.45);
          float sunCore = exp(-dot(sunOff, sunOff) * 0.85);
          vec3 lowGold = vec3(1.68, 1.44, 1.06);
          vec3 midGlow = vec3(2.85, 2.52, 1.98);
          vec3 highAir = vec3(2.05, 1.96, 1.78);
          vec3 sky = mix(lowGold, highAir, smoothstep(0.05, 0.92, yN));
          sky = mix(sky, midGlow, sunCore * (0.48 + 0.44 * uEntOpen));
          float gain = mix(0.66, 1.24, uEntOpen) * (0.76 + 0.42 * uAmbientGain);
          gl_FragColor = vec4(sky * gain, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    // 3. Deep-Shadow Architectural Satin-Enamel Millwork (`room_props` + `room_doors` + `room_end_leaf_L/R`):
    // Combines Raytraced BVHTree Corner AO + Direct Ceiling-Spot Overhang Shadows + Direct Sconce Flute Grazing + High-Contrast Bevel Relief!
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
        attribute vec4 color;
        varying vec2 vUv;
        varying vec3 vW, vN;
        varying vec4 vCol;
        ${WARP_Y_GLSL}
        void main() {
          vUv = uv;
          vCol = color;
          vec4 w = modelMatrix * vec4(position, 1.0);
          if (uIsDoor < 0.5) w.y = warpRoomY(w.y, -w.z, uExtraH);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D tFloorLight, tFloorFix, tCeilLight, tCeilFix, tWallNor;
        uniform vec4 uFloorRect, uCeilRect, uWinBay0, uWinBay1;
        uniform vec2 uWinCut;
        uniform vec3 uAlbedo;
        uniform float uFloorScale, uCeilScale, uFixCeilScale, uFixFloorScale, uBakeExp;
        uniform float uAmbientGain, uSpotGain, uSconceGain, uLightWarmth, uShadowDepth, uHasFixMaps, uHasCornerAO;
        uniform float uBakedV6, uCeilH, uExtraH, uHalfW, uVH, uArchS, uBevK, uIsDoor;
        uniform float uContrastFix, uSkylightMode, uHideAlcoveWin, uWinLightMode, uWinDesign, uTime;
        varying vec3 vW, vN;
        varying vec4 vCol;
        ${LIGHT_COMMON_GLSL}
        ${WIN_SUN_GLSL}

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

          vec3 viewVec = cameraPosition - vW;
          vec3 vNf = (dot(vN, viewVec) < 0.0) ? -vN : vN;
          vec3 nFlat = normalize(cross(dFdx(vW), dFdy(vW)));
          if (dot(nFlat, viewVec) < 0.0) nFlat = -nFlat;
          vec3 N = normalize(mix(vNf, nFlat, mix(0.28, 0.96, uContrastFix)));

          // Sample clean mid-room irradiance (avoiding dark wall-baseboard contact texels AND capping bright end-window glare!)
          // so doors, fluted pilasters, baseboards, cornices & Bifora window sit in 100% the SAME light field as adjacent walls!
          float xSample = clamp(vW.x * 0.25, -0.55, 0.55);
          float sSample = clamp(s, uFloorRect.z + 1.15, uFloorRect.w - 1.65);
          vec2 fuv = floorUV(xSample, sSample);
          vec2 cuv = ceilUV(xSample, clamp(s, uCeilRect.z + 0.85, uCeilRect.w - 1.25));

          // 1) Cohesive Gallery Ambient Daylight GI (matches calibrated v8 Crisp Gallery White wall without blowing out Bifora window!):
          vec3 flRaw = clamp(texture2D(tFloorLight, fuv).rgb * (uFloorScale * 0.72), vec3(0.48), vec3(0.82));
          vec3 clRaw = (s < uArchS + 0.10) ? clamp(texture2D(tCeilLight, cuv).rgb * (uCeilScale * 0.64), vec3(0.54), vec3(0.86)) : (flRaw * 1.04);
          float hFrac = clamp(vW.y / max(effCeilH, 3.5), 0.0, 1.0);
          vec3 envAmb = (mix(flRaw, clRaw, smoothstep(0.05, 0.88, hFrac)) * 1.02 + vec3(0.135)) * uAmbientGain;
          // Luminous morning daylight kiss on the Bifora window sill perch & inner reveals while keeping twin sub-arch & flute shadows crisp:
          if (s > uArchS + 3.55) {
            envAmb = min(envAmb, vec3(0.92 * max(0.60, uAmbientGain / 0.72)));
            float sillSun = smoothstep(0.58, 0.65, vW.y) * (1.0 - smoothstep(0.68, 0.85, vW.y)) * max(N.y, 0.0) * (1.0 - smoothstep(0.76, 0.96, abs(vW.x)));
            float revSun  = smoothstep(uArchS + 3.88, uArchS + 4.02, s) * (1.0 - smoothstep(0.68, 0.76, abs(vW.x))) * smoothstep(0.62, 0.70, vW.y);
            envAmb += vec3(1.06, 0.99, 0.88) * ((0.26 * sillSun + 0.22 * revSun) * max(0.55, uAmbientGain));
          }
          if (uIsDoor < 0.5 && vW.y < 1.25) {
            envAmb += evalSideWindowSun(vW, N, 0.0) * 0.85;
          }

          // 2) Subtle, Lab-parameterized (uShadowDepth: 0% = v6 soft, 100% = refined HK02 pearl-stone shadow accents, 200% = deeper relief):
          float shK = clamp(uShadowDepth, 0.0, 2.2) * uContrastFix;
          // On upper moldings (y > 2.92: long un-subdivided crown cornices, picture rails & curved arch hoods), attenuate coarse per-vertex
          // Gouraud COLOR_0 so coffer/spotlight vertex hits never draw blotchy bands across moldings (analytical normal relief sculpts every step!):
          float upperSmooth = (uIsDoor < 0.5) ? smoothstep(2.88, 3.05, vW.y) : 0.0;
          float aoClean   = (uHasCornerAO > 0.5) ? mix(smoothstep(0.16, 0.84, vCol.r), 1.0, upperSmooth) : 1.0;
          float aoCorner  = mix(1.0, mix(0.83, 1.0, aoClean), min(1.15, 0.65 * shK));
          float dirSpot   = (uHasCornerAO > 0.5) ? mix(vCol.g, 0.24, upperSmooth) : 0.35;
          float dirSconce = (uHasCornerAO > 0.5) ? mix(vCol.b, 0.16, upperSmooth) : 0.25;

          vec3 spotTint   = evalSpotKelvin(uLightWarmth);
          vec3 sconceTint = evalSconceKelvin(uLightWarmth);

          vec3 giFix = vec3(0.0);
          if (uHasFixMaps > 0.5) {
            vec3 ff = texture2D(tFloorFix, fuv).rgb * uFixFloorScale;
            vec3 cf = texture2D(tCeilFix, cuv).rgb * uFixCeilScale;
            vec3 bf = mix(ff, cf, smoothstep(0.08, 0.86, hFrac));
            giFix = bf.r * (0.65 * uSpotGain) * spotTint + bf.g * (0.38 * uSconceGain) * sconceTint;
          }

          // 3) Crisp HK02 Architectural Bevel, Flute & Bolection Relief (lit fillets crisp chalk; flute valleys & impost undercuts warm pearl-stone!):
          vec3 L_rod = normalize(vec3(-vW.x, max(0.32, (effCeilH - 0.14) - vW.y), 0.18));
          float dRod = dot(N, L_rod);

          bool isEndWall = (s < 4.10) || (s > uArchS + 3.65) || (abs(s - uArchS) < 0.36 && abs(vW.x) < uHalfW - 0.05);
          float sideTurn = isEndWall ? abs(N.x) : abs(N.z);
          float latSign  = isEndWall ? N.x : N.z;

          float bevGain = (0.50 + 0.88 * shK) * uBevK;
          float upTerm  =  0.085 * max(N.y, 0.0) - 0.145 * max(-N.y, 0.0);
          float rodTerm =  0.062 * dRod;
          float latTerm =  0.048 * max(latSign, 0.0) - 0.105 * max(-latSign, 0.0) - 0.095 * smoothstep(0.34, 0.90, sideTurn);
          float relief  = clamp(1.0 + bevGain * (upTerm + rodTerm + latTerm), 0.64, 1.15);

          // Delicate 6-panel bolection, baseboard quirk & Bifora reveal accents (scaled smoothly by shK!):
          float panelDrop = 0.0;
          if (uIsDoor > 0.5 && shK > 0.02) {
            float inRow1 = smoothstep(0.27, 0.30, vW.y) * (1.0 - smoothstep(0.91, 0.94, vW.y));
            float inRow2 = smoothstep(1.11, 1.14, vW.y) * (1.0 - smoothstep(2.13, 2.16, vW.y));
            float inRow3 = smoothstep(2.30, 2.33, vW.y) * (1.0 - smoothstep(2.66, 2.69, vW.y));
            float inPanelBand = max(max(inRow1, inRow2), inRow3);
            float ringSlope = smoothstep(0.08, 0.44, abs(N.y) + min(abs(N.x), abs(N.z)));
            float topBevelShadow = inPanelBand * clamp(-N.y, 0.0, 1.0);
            panelDrop = (0.042 * inPanelBand + 0.125 * ringSlope + 0.115 * topBevelShadow) * min(1.65, shK);
          } else if (shK > 0.02) {
            float quirkBand = smoothstep(0.208, 0.218, vW.y) * (1.0 - smoothstep(0.234, 0.244, vW.y));
            panelDrop += 0.105 * quirkBand * min(1.5, shK);
            if (s > uArchS + 3.70) {
              if (vW.y > 0.655) {
                // Bifora twin sub-arches, central colonnette, oculus & fluted jambs:
                float archBev = smoothstep(0.12, 0.55, abs(N.x) + abs(N.y)) * (1.0 - smoothstep(0.90, 0.99, abs(N.z)));
                panelDrop += (0.11 * archBev + 0.09 * clamp(-N.y, 0.0, 1.0)) * min(1.5, shK);
              } else {
                // Clean crisp shadow strictly underneath the sleek horizontal window perch (bench-like apron stiles removed!):
                float underPerch = smoothstep(0.545, 0.600, vW.y) * (1.0 - smoothstep(0.630, 0.655, vW.y)) * clamp(-N.y, 0.0, 1.0);
                panelDrop += 0.14 * underPerch * min(1.5, shK);
              }
            }
          }
          float panelAO = clamp(1.0 - panelDrop, 0.66, 1.0);

          // Hand-brushed satin oil-enamel wood grain at close inspection distances:
          vec2 eUv = isEndWall ? vec2(vW.x * 3.2, vW.y * 0.9) : vec2(s * 3.2, vW.y * 0.9);
          float fwE = max(fwidth(eUv.x), fwidth(eUv.y));
          float brushFade = 1.0 / (1.0 + fwE * 42.0);
          vec2 nBrush = (texture2D(tWallNor, eUv).xy * 2.0 - 1.0) * brushFade;
          float brushTex = 1.0 + (nBrush.x * 0.018 + nBrush.y * 0.012);

          float floorAO = mix(1.0 - 0.06 * min(1.4, shK), 1.0, smoothstep(0.0, 0.055, vW.y));
          float ceilAO  = mix(1.0 - 0.05 * min(1.4, shK), 1.0, smoothstep(0.0, 0.075, effCeilH - vW.y));

          // Refined warm-taupe/pearl shadow tone (lit fillets ~91% sRGB; flute valleys & impost undercuts ~68-76% sRGB; zero black soot!):
          float shapedAO = clamp(aoCorner * relief * panelAO * brushTex * floorAO * ceilAO, 0.56, 1.15);
          vec3 shadowTint = vec3(pow(shapedAO, 0.96), pow(shapedAO, 1.00), pow(shapedAO, 1.06));

          float spotFacing   = clamp(0.55 + 0.45 * dRod, 0.0, 1.20);
          float sconceFacing = clamp(0.60 + 0.40 * (1.0 - 0.50 * sideTurn), 0.25, 1.15);
          vec3 directFix = dirSpot * spotFacing * (0.24 * uSpotGain) * spotTint
                         + dirSconce * sconceFacing * (0.20 * uSconceGain) * sconceTint;

          vec3 totalIrr = (envAmb + giFix * 0.55) * shadowTint + directFix * mix(0.65, 1.0, aoClean);
          vec3 c = totalIrr * uAlbedo * uBakeExp;

          vec3 V = normalize(cameraPosition - vW);
          float NoV = max(dot(N, V), 0.0);
          float lagardeSpecOcc = clamp(pow(NoV + shapedAO, exp2(-16.0 * 0.34 - 1.0)) - 1.0 + shapedAO, 0.0, 1.0);
          float coat = pow(1.0 - NoV, 4.0) * 0.045 * lagardeSpecOcc;
          vec3 H_rod = normalize(L_rod + V);
          float spec = pow(max(dot(N, H_rod), 0.0), 38.0) * 0.055 * max(0.20, dirSpot) * lagardeSpecOcc;
          c += c * coat + (uSpotGain * 0.22 * spotTint + envAmb * 0.28) * spec;

          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb += ignDither(gl_FragCoord.xy) / 255.0;
        }
      `,
    });

    // Crisp Gallery White / Pearl Satin-Enamel Trim & 6-Panel Doors (lit fillets read crisp white; flutes & bolections carve rich dark shadows!):
    this.bakedTrimMat = makeEnamelMat(new THREE.Vector3(0.932, 0.916, 0.886), 1.18, false);
    this.bakedDoorMat = makeEnamelMat(new THREE.Vector3(0.916, 0.898, 0.866), 1.32, true);

    this.bakedDoorBrassMat = this.M.brass.clone();
    this.bakedDoorBrassMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWinBay0 = this.bakedU.uWinBay0;
      sh.uniforms.uWinBay1 = this.bakedU.uWinBay1;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vBrWorld;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvBrWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec4 uWinBay0, uWinBay1;\nvarying vec3 vBrWorld;')
        .replace('void main() {', `void main() {
          float sB = -vBrWorld.z;
          if ((uWinBay0.w > 0.5 && vBrWorld.x * uWinBay0.x > 0.85 && abs(sB - uWinBay0.y) < uWinBay0.z) ||
              (uWinBay1.w > 0.5 && vBrWorld.x * uWinBay1.x > 0.85 && abs(sB - uWinBay1.y) < uWinBay1.z)) discard;`);
    };
    this.bakedDoorGlassMat = this.M.glass.clone();
    this.bakedDoorGlassMat.onBeforeCompile = this.bakedDoorBrassMat.onBeforeCompile;

    // 4. Authentic 1862 Flushing Town Hall Narrow Longitudinal Hardwood Strip Floor (`6.5 cm` American Cherry / Heart-Pine)!
    const dummyWhite = new THREE.DataTexture(new Uint8Array([200, 160, 120, 255]), 1, 1, THREE.RGBAFormat);
    dummyWhite.needsUpdate = true;
    const dummyNor = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1, THREE.RGBAFormat);
    dummyNor.needsUpdate = true;

    this.bakedFloorMat = new THREE.ShaderMaterial({
      uniforms: {
        tLight:      { value: pk.tFloor },
        tLightFix:   { value: pk.tFloorF },
        tStripDiff:  { value: pk.tStripD || pk.tWood },
        tStripNor:   { value: pk.tStripN || pk.tWoodN },
        tStripRgh:   { value: pk.tStripR || pk.tWoodR },
        tWood:       { value: pk.tWood },
        tWoodNor:    { value: pk.tWoodN },
        tWoodRgh:    { value: pk.tWoodR },
        tWallNor:    { value: pk.tWallN },
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
        uniform sampler2D tLight, tLightFix, tStripDiff, tStripNor, tStripRgh, tWood, tWoodNor, tWoodRgh, tWallNor, tHerring, tHerringNor, uRefl;
        uniform mat4 uReflMatrix;
        uniform float uScale, uFixScale, uBakeExp, uAmbientGain, uSpotGain, uSconceGain, uLightWarmth, uShadowDepth, uFloorDark, uHasFixMaps;
        uniform float uBakedV6, uFloorTone, uPlankAcross, uReflGain;
        uniform float uFloorMode, uContrastFix, uSkylightMode, uHideAlcoveWin, uHalfW, uVH, uArchS;
        uniform float uWinLightMode, uWinDesign, uTime, uEntOpen;
        uniform vec2 uWinCut;
        uniform vec4 uWinBay0, uWinBay1;
        varying vec2 vUv;
        varying vec3 vW, vN;
        varying vec4 vReflUv;
        ${LIGHT_COMMON_GLSL}
        ${WIN_SUN_GLSL}

        void main() {
          float sCoord = -vW.z;
          vec3 rawFl = textureBicubic(tLight, vUv, vec2(1024.0, 2048.0)).rgb * uScale;
          rawFl = rawFl / (vec3(1.0) + max(vec3(0.0), rawFl - vec3(0.95)) * 0.48);
          vec3 ambLight = (rawFl * 0.62 + vec3(0.07)) * (uBakeExp * (0.32 + 0.82 * uAmbientGain));
          vec3 fixLight = vec3(0.0);
          if (uHasFixMaps > 0.5) {
            vec3 rf = textureBicubic(tLightFix, vUv, vec2(512.0, 1024.0)).rgb;
            fixLight = (rf.r * (0.75 * uSpotGain) * evalSpotKelvin(uLightWarmth)
                      + rf.g * (0.52 * uSconceGain) * evalSconceKelvin(uLightWarmth)) * (uFixScale * uBakeExp);
          }
          vec3 light = ambLight + fixLight + evalSideWindowSun(vW, vec3(0.0, 1.0, 0.0), 1.0);
          // Natural daylight pool streaming inward across the alcove floor from the Romanesque Bifora window:
          if (sCoord > uArchS + 0.30) {
            float dWinS = max(0.0, (uArchS + 3.92) - sCoord);
            float winPool = exp(-dWinS / 2.35) * exp(-(vW.x * vW.x) / 0.88);
            light += vec3(1.06, 0.99, 0.89) * (0.26 * winPool * max(0.45, uAmbientGain));
          }
          // Warm golden morning daylight pouring across the cherry-cognac wood floor as the grand entrance double doors open:
          if (uEntOpen > 0.001 && sCoord < 14.5) {
            float dEntS = max(0.0, sCoord - 3.55);
            float doorHalfW = 0.84 + dEntS * 0.165;
            float edgeX = 1.0 - smoothstep(doorHalfW * 0.42, doorHalfW * 1.15, abs(vW.x));
            float softWrap = exp(-(vW.x * vW.x) / (1.55 + dEntS * 0.55));
            float reach = exp(-dEntS / 4.85) * (1.0 - smoothstep(8.8, 14.2, sCoord));
            float beamMask = (0.72 * edgeX + 0.28 * softWrap) * reach;
            light += vec3(1.28, 1.12, 0.88) * (2.65 * uEntOpen * beamMask);
          }

          float hwHere = (sCoord > uArchS + 0.22) ? uVH : uHalfW;
          float dWall = max(0.0, hwHere - abs(vW.x));
          float shFl = mix(1.0, 1.0 + 0.14 * clamp(uShadowDepth, 0.0, 2.0), uContrastFix);
          light *= pow(mix(1.0, mix(0.88, 1.0, smoothstep(0.0, 0.24, dWall)), uContrastFix), shFl);

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
          float normFade = 1.0 / (1.0 + fwStrip * 18.0);

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
            float rgh  = texture2D(tStripRgh, stripUv).r;
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
            float rgh  = texture2D(tStripRgh, stripUv).r;
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
            float rgh  = texture2D(tStripRgh, stripUv).r;
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
            float rghTex = texture2D(tWoodRgh, uvHoriz).r;
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

          vec3 c = light * surfAlb;

          vec3 V = normalize(cameraPosition - vW);
          vec3 N = (uFloorMode < 2.5)
            ? normalize(vec3(nMap.x * 0.13, 1.0, -nMap.y * 0.08))
            : normalize(vec3(nMap.y * 0.10, 1.0, nMap.x * 0.10));
          float NoV = clamp(dot(N, V), 0.0, 1.0);
          // Physical dielectric Schlick Fresnel (f0 = 0.044, fPow = 4.6) — preserves deep roasted espresso blacks at mid/steep angles!
          float f0 = mix(0.036, 0.046, uContrastFix) * clearcoatBoost;
          float F  = f0 + (1.0 - f0) * pow(1.0 - NoV, 4.6);

          // 3D World-Space Projected Planar Reflection (2D 9-tap elliptical footprint — ZERO 003/010 grazing tremble or doorknob fireflies!):
          if (vReflUv.w > 0.05 && uReflGain > 0.001) {
            float dCam = clamp(length(cameraPosition.xz - vW.xz), 1.0, 7.5);
            vec3 pVirt = vec3(vW.x + N.x * dCam * 0.075, 0.0, vW.z + N.z * dCam * 0.075);
            vec4 pr0 = uReflMatrix * vec4(pVirt, 1.0);
            vec2 ruv = pr0.xy / max(0.05, pr0.w);
            if (ruv.x > 0.003 && ruv.x < 0.997 && ruv.y > 0.003 && ruv.y < 0.997) {
              vec3 horizTangent = normalize(vec3(-V.z, 0.0, V.x));
              vec4 prUp = uReflMatrix * vec4(pVirt + vec3(0.0, -0.17, 0.0), 1.0);
              vec4 prRt = uReflMatrix * vec4(pVirt + horizTangent * 0.095, 1.0);
              vec2 dUvUp = clamp((prUp.xy / max(0.05, prUp.w)) - ruv, vec2(-0.024), vec2(0.024));
              vec2 dUvRt = clamp((prRt.xy / max(0.05, prRt.w)) - ruv, vec2(-0.018), vec2(0.018));
              float baseLod = mix(1.65, 1.22, uContrastFix);
              float lod = baseLod + clamp((roughVal - 0.11) * 4.5, 0.0, 1.25);
              // Fast 5-tap 2D Cross filter (anti-aliases BOTH horizontal & steep grazing alcove vertical edges at 60 fps Retina!):
              vec3 refl = textureLod(uRefl, ruv, lod).rgb * 0.36
                        + textureLod(uRefl, clamp(ruv + dUvUp * 0.78, 0.003, 0.997), lod + 0.25).rgb * 0.17
                        + textureLod(uRefl, clamp(ruv - dUvUp * 0.78, 0.003, 0.997), lod + 0.25).rgb * 0.17
                        + textureLod(uRefl, clamp(ruv + dUvRt * 0.82, 0.003, 0.997), lod + 0.25).rgb * 0.15
                        + textureLod(uRefl, clamp(ruv - dUvRt * 0.82, 0.003, 0.997), lod + 0.25).rgb * 0.15;
              float peakR = max(max(refl.r, refl.g), refl.b);
              refl *= 1.0 / (1.0 + max(0.0, peakR - 0.62) * 1.35);
              // Energy-conserving coat reflection + V-groove/pore occlusion so dark wood seams NEVER get milky haze!
              float edgeFade = smoothstep(0.003, 0.035, min(min(ruv.x, 1.0 - ruv.x), min(ruv.y, 1.0 - ruv.y)));
              float reflW = clamp(F * uReflGain * specOcc * edgeFade, 0.0, maxReflCap);
              vec3 reflTinted = refl * mix(vec3(1.0, 0.95, 0.87), surfAlb * 1.45 + vec3(0.08), 0.26);
              c = c * (1.0 - reflW * 0.62) + reflTinted * reflW;
            }
          }

          // Warm Kelvin-coupled overhead spotlight & Bifora window specular sheen (occluded in dark V-grooves!):
          vec3 Lwin = normalize(vec3(-0.04, 0.26, -0.965));
          vec3 H    = normalize(Lwin + V);
          float winReach = smoothstep(10.0, 23.8, sCoord);
          float specEnd = pow(max(dot(N, H), 0.0), 32.0) * (0.065 + 0.065 * winReach) * specGainK * specOcc;
          vec3 Lrod = normalize(vec3(-vW.x * 0.35, 0.92, -0.22));
          vec3 Hrod = normalize(Lrod + V);
          float specIndoor = pow(max(dot(N, Hrod), 0.0), 26.0) * 0.085 * specGainK * specOcc;
          c += specEnd * vec3(1.04, 0.98, 0.89) * (ambLight + vec3(0.18 * winReach))
             + specIndoor * evalSpotKelvin(uLightWarmth) * (fixLight * 0.75 + ambLight * 0.35);
          // Grazing sunlit morning specular ribbon & broad Fresnel floor sheen streaming inward from the open entrance doors:
          if (uEntOpen > 0.001 && sCoord < 15.5) {
            float dEntS2 = max(0.0, sCoord - 3.55);
            float doorHalfW2 = 0.84 + dEntS2 * 0.16;
            float entX = 1.0 - smoothstep(doorHalfW2 * 0.38, doorHalfW2 * 1.25, abs(vW.x));
            float entReach = exp(-dEntS2 / 5.4) * (1.0 - smoothstep(9.5, 15.2, sCoord)) * entX;
            vec3 Lent = normalize(vec3(-vW.x * 0.18, 0.22, 0.96));
            vec3 Hent = normalize(Lent + V);
            float specTight = pow(max(dot(N, Hent), 0.0), 14.0) * 1.05;
            float specBroad = pow(1.0 - NoV, 2.2) * 0.58;
            c += (specTight + specBroad) * uEntOpen * entReach * specGainK * mix(0.45, 1.0, specOcc) * vec3(1.24, 1.10, 0.88);
          }

          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb += ignDither(gl_FragCoord.xy) / 255.0;
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

    const softenIvoryVC = (mat, aoStrength = 0.24) => {
      mat.onBeforeCompile = (sh) => {
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

    return {
      wall: wallMat,
      trim: new THREE.MeshStandardMaterial({ color: lin(0.955, 0.942, 0.916), emissive: lin(0.14, 0.134, 0.122), roughness: 0.40, envMapIntensity: 0.22 }),
      trimVC: softenIvoryVC(new THREE.MeshStandardMaterial({ color: lin(0.955, 0.942, 0.916), emissive: lin(0.14, 0.134, 0.122), roughness: 0.38, vertexColors: true, envMapIntensity: 0.24 }), 0.22),
      doorVC: softenIvoryVC(new THREE.MeshStandardMaterial({ color: lin(0.948, 0.932, 0.900), emissive: lin(0.15, 0.142, 0.128), roughness: 0.38, vertexColors: true, envMapIntensity: 0.25 }), 0.22),
      brass: new THREE.MeshStandardMaterial({ color: lin(0.74, 0.48, 0.17), roughness: 0.23, metalness: 0.92, envMapIntensity: 0.78 }),
      brassVC: softenIvoryVC(new THREE.MeshStandardMaterial({ color: lin(0.76, 0.50, 0.18), roughness: 0.24, metalness: 0.92, vertexColors: true, envMapIntensity: 0.75 }), 0.25),
      easelVC: softenIvoryVC(new THREE.MeshStandardMaterial({
        normalScale: new THREE.Vector2(0.22, 0.22),
        color: lin(0.94, 0.70, 0.44), roughness: 0.35, vertexColors: true, envMapIntensity: 0.32,
      }), 0.24),
      easelOak: new THREE.MeshStandardMaterial({
        normalScale: new THREE.Vector2(0.22, 0.22),
        color: lin(0.94, 0.70, 0.44), roughness: 0.35, envMapIntensity: 0.32,
      }),
      tin: new THREE.MeshStandardMaterial({
        color: lin(0.95, 0.942, 0.925), emissive: lin(0.32, 0.315, 0.305), roughness: 0.46, envMapIntensity: 0.22,
      }),
      frame: new THREE.MeshStandardMaterial({ color: lin(0.013, 0.011, 0.010), roughness: 0.32, envMapIntensity: 0.36 }),
      glass: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.06, transparent: true, opacity: 0.16, depthWrite: false }),
      lay: new THREE.MeshBasicMaterial({ color: lin(0.98, 0.99, 1.0).multiplyScalar(2.85) }),
      bar: new THREE.MeshStandardMaterial({ color: lin(0.93, 0.92, 0.90), roughness: 0.38 }),
      // Calm translucent museum-linen daylight behind Bifora end window (~0.89 sRGB, zero glare/washout!):
      sky: new THREE.MeshBasicMaterial({ color: lin(1.02, 0.97, 0.88).multiplyScalar(1.08) }),
      sideRoom: new THREE.MeshStandardMaterial({ color: lin(0.95, 0.93, 0.89), roughness: 0.82 }),
      sideRoomClosed: new THREE.MeshBasicMaterial({ color: lin(1.00, 0.955, 0.880).multiplyScalar(0.95) }),
      sideRoomSun: new THREE.MeshBasicMaterial({ color: lin(1.0, 0.94, 0.83).multiplyScalar(1.25) }),
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
    this.bakedU.uRefl.value = this.reflRT.texture;

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
        }

        for (const [side, leaf] of [['L', leafL], ['R', leafR]]) {
          if (!buckets[side].length) continue;
          const relMat = leaf.matrixWorld.clone().invert().multiply(mw);
          const subGeo = buildSubGeo(buckets[side], relMat);
          const subMesh = new THREE.Mesh(subGeo, mat);
          subMesh.name = `${namePrefix}_${side}`;
          subMesh.userData.keepGeo = true;
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

    const skyEnd = new THREE.Mesh(new THREE.PlaneGeometry(3.20, 4.00), this.biforaSkyMat || M.sky);
    skyEnd.position.set(0, 2.15, -(D.VS1 + 0.26)); g.add(skyEnd);
    if (L.hall.vestRightWindow) {
      // Strictly confined behind the Right-Alcove Bifora window (`s in [20.42..23.82]`, `y in [0.20..4.10]`,
      // `x = D.VH + 0.22 = 1.46 m`) so it NEVER protrudes past the `s = 20.00` arch pier into the main corridor!
      const skySide = new THREE.Mesh(new THREE.PlaneGeometry(3.40, 3.90), this.biforaSkyMat || M.sky);
      skySide.rotation.y = -Math.PI / 2;
      skySide.position.set(D.VH + 0.22, 2.15, -22.12);
      g.add(skySide);
      this.skySideMesh = skySide;
    }

    g.add(new THREE.HemisphereLight(0xfffdf7, 0xf5e5cc, 2.05));
    const midS = -((D.Y0 + D.L) * 0.5);
    const keyAlcove = new THREE.DirectionalLight(0xfff6e6, 1.05);
    keyAlcove.position.set(0.6, 4.2, -(D.VS1 + 2.0));
    keyAlcove.target.position.set(0, 1.4, midS);
    g.add(keyAlcove, keyAlcove.target);
    const fillFront = new THREE.DirectionalLight(0xfffbf2, 0.65);
    fillFront.position.set(-0.5, 3.8, -(D.Y0 - 2.0));
    fillFront.target.position.set(0, 1.4, midS);
    g.add(fillFront, fillFront.target);
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
        else if (n.startsWith('oak')) o.material = this.M.easelVC;
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
    const posterPaperMat = this._posterPaperMat || (this._posterPaperMat = new THREE.MeshStandardMaterial({
      color: lin(0.95, 0.93, 0.89), roughness: 0.88, metalness: 0.0, envMapIntensity: 0.15,
    }));
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

        const mat = makeArtMaterial(mapTex, { onSwap, frameShadow: false, roughness: 0.86 });
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
      makeArtMaterial(pt, { roughness: 0.82, onSwap: (mapTex, m) => this.queueArtSwap(mapTex, m) })
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
    const fl = this.isUsingBaked ? this.bakedFloorObj : this.floorMesh;
    if (fl) {
      r.getDrawingBufferSize(this._sz);
      const w = Math.min(512, Math.max(256, this._sz.x >> 2));
      const h = Math.min(288, Math.max(144, this._sz.y >> 2));
      const resized = (this.reflRT.width !== w || this.reflRT.height !== h);
      if (resized) this.reflRT.setSize(w, h);

      const posDelta  = camera.position.distanceToSquared(this._lastCamPos);
      const quatDelta = 1.0 - Math.abs(camera.quaternion.dot(this._lastCamQuat));
      // Update EVERY frame on even micro-rotation (1e-13) + high-precision depth range + sub-pixel brass/bulb dampening
      // (ZERO oblique clip-plane depth crushing, ZERO 003/painting Z-fighting, ZERO crane doorknob flicker!):
      if (resized || this.reflDirty || posDelta > 1e-13 || quatDelta > 1e-13) {
        this._lastCamPos.copy(camera.position);
        this._lastCamQuat.copy(camera.quaternion);
        this.reflDirty = false;

        const rc = this.reflCam;
        rc.fov    = camera.fov;
        rc.aspect = camera.aspect;
        rc.near   = Math.max(0.28, Math.min(1.10, Math.abs(camera.position.y) * 0.72));
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

        fl.visible = false;
        if (this.noReflGroup) this.noReflGroup.visible = false;
        const noRefl = this._noReflMeshes;
        for (let i = 0; i < noRefl.length; i++) {
          const o = noRefl[i];
          o._wasVisRefl = o.visible;
          o.visible = false;
        }
        const damp = this._reflDampMats;
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
        r.setRenderTarget(this.reflRT);
        r.clear();
        r.render(this.scene, rc);
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
    }
    r.setRenderTarget(target);
    r.render(this.scene, camera);
  }
}
