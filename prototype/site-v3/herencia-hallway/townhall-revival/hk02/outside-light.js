// Modular Outside Window Daylight & Cycles Multi-Basis HDR System (hk02/outside-light.js — Phase 2)
// Encapsulates the 4 Outside Window Lighting Concepts (C02, C03, C04, C05)
// plus the untouched V9 locked baseline (0-LSB bit-identical, 0 B extra VRAM on V9 boot).
//
// Architecture Contract v2 Compliance:
//   - B1 Namespace Split: uTmOutMix/uTmAgx* live ONLY in scene.js CustomToneMapping;
//     uOutCyclesMix (synced === uTmOutMix) + olPbrNeutralTone live ONLY in OUTSIDE_LIGHT_GLSL.
//   - B2 V9 Idle-Eviction: atomic rebind-before-dispose across all referencing materials (-40 MiB);
//     fresh new THREE.Texture(cachedImg) restore on return to V9 or V9<->C0x.
//   - B3 Purge: zero leaf-gobo sampler anywhere -> OUTSIDE_LIGHT_GLSL adds 0 samplers.
//   - H1 OutsideLerpCompositor: single pre-warmed fullscreen ShaderMaterial (NoBlending, no tonemap/
//     colorspace), strict viewport/scissor/scissorTest save+restore, lazy ceilRT/wallFixRT/probeRT,
//     dirty-checked (eps 1e-5), disposed immediately on settle/preset-switch/hall.dispose().

import * as THREE from 'three';

export const OUTSIDE_MODES = ['v9', 'c04', 'c05', 'c03', 'c02'];

export const OUTSIDE_PRESETS = {
  v9: {
    id: 'v9',
    label: 'V9 · Baseline ★',
    weights: [0, 0, 0, 0],
    outStrength: 1.00,
    artPop: 0.00,
  },
  c04: {
    id: 'c04',
    label: 'C04 · North-Light 6500K',
    weights: [0, 0, 1, 0],
    outStrength: 1.00,
    artPop: 0.12,
  },
  c05: {
    id: 'c05',
    label: 'C05 · Sheer Linen Bloom',
    weights: [0, 0, 0, 1],
    outStrength: 1.00,
    artPop: 0.12,
  },
  c03: {
    id: 'c03',
    label: 'C03 · 3300K Golden Rake',
    weights: [0, 1, 0, 0],
    outStrength: 1.00,
    artPop: 0.10,
  },
  c02: {
    id: 'c02',
    label: 'C02 · Courtyard Komorebi',
    weights: [1, 0, 0, 0],
    outStrength: 1.00,
    artPop: 0.10,
  },
};

const BAKED_BASE   = new URL('../baked/', import.meta.url).href;
const OUTSIDE_BASE = new URL('../baked/outside/', import.meta.url).href;
const PLATE_VER    = '?v=20261126v71';
const OUTSIDE_VER  = '?v=20261126v71';

const PLATE_URLS = {
  c02: OUTSIDE_BASE + 'ext_c02_canopy_v7.webp' + PLATE_VER,
  c03: OUTSIDE_BASE + 'ext_c03_golden_v4.webp' + PLATE_VER,
  c04: OUTSIDE_BASE + 'ext_c04_north_v4.webp'  + PLATE_VER,
  c05: BAKED_BASE   + 'ext_c05_linen.webp'     + PLATE_VER,
};
const LEAF_COOKIE_URL = OUTSIDE_BASE + 'c02_komorebi_gobo.webp' + PLATE_VER;

const MODE_VEC4 = {
  c02: [1, 0, 0, 0],
  c03: [0, 1, 0, 0],
  c04: [0, 0, 1, 0],
  c05: [0, 0, 0, 1],
};

function makePlaceholder1x1(r = 250, g = 248, b = 242, srgb = true, nearest = false, a = 255) {
  const data = new Uint8Array([r, g, b, a]);
  const t = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.generateMipmaps = false;
  t.minFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.premultiplyAlpha = false;
  t.flipY = false;
  t.needsUpdate = true;
  return t;
}

const _phPlate     = makePlaceholder1x1(245, 244, 240, true, false, 255);
const _phRgbmsqrt  = makePlaceholder1x1(0, 0, 0, false, true, 4);
const _phWhite1x1  = makePlaceholder1x1(255, 255, 255, false, false, 255);
export const DUMMY_RGBMSQRT = _phRgbmsqrt;

export const SHARED_OUTSIDE_UNIFORMS = {
  // Exterior weights & sky plate slots (B3: 0 leaf-gobo samplers!)
  uOutWeights:       { value: new THREE.Vector4(0, 0, 0, 0) }, // (C02, C03, C04, C05)
  uOutStrength:      { value: 1.00 },                          // [0..1.8] master outside-light intensity
  uArtPop:           { value: 0.00 },                          // [0..0.40] museum canvas luminance boost
  uOutTime:          { value: 0.00 },                          // [s] gentle breeze clock for C02 komorebi
  tOutPlateA:        { value: _phPlate },                      // active exterior plate slot A (1x1 at V9 boot)
  tOutPlateB:        { value: _phPlate },                      // secondary exterior plate slot B (cross-concept lerps)
  uOutPlateSlotA:    { value: new THREE.Vector4(0, 0, 0, 0) }, // one-hot concept owner of tOutPlateA
  uOutPlateSlotB:    { value: new THREE.Vector4(0, 0, 0, 0) }, // one-hot concept owner of tOutPlateB

  // B1 Split Tone-Mapping Namespace (declared EXCLUSIVELY in scene.js tonemapping_pars_fragment):
  uTmOutMix:         { value: 0.00 },                          // 0.0 on V9 (0-LSB HK02); 1.0 on Cycles C02-C05
  uTmAgxHybrid:      { value: 0.45 },                          // locked Pilot 3 convex mix(PBR_Neutral, AgX, 0.45)
  uTmAgxPow:         { value: 1.22 },                          // locked AgX contrast power
  uTmAgxSat:         { value: 1.28 },                          // locked AgX Rec.2020 saturation
  uTmOutExposure:    { value: 1.00 },                          // Cycles post-irradiance tone-map exposure
  uTmShadowToe:      { value: new THREE.Vector3(0, 0, 0) },    // subtle chromatic shadow-toe glaze (0 on V9)
  uTmContrast:       { value: 1.00 },                          // Cycle 5 filmic log-pivot contrast S-curve (1.00 on V9 -> 0-LSB!)

  // B1 Cycles-Mode & Render-Pass Namespace (declared ONLY outside tonemapping_pars_fragment; reflRT-safe!):
  uOutCyclesMix:     { value: 0.00 },                          // kept STRICTLY equal to uTmOutMix!
  uInReflPass:       { value: 0.00 },                          // 1.0 strictly during Cycles reflRT mirror pass (Karis + no-dither)
  uReflBlurred:      { value: 0.00 },                          // 1.0 when 2-pass pre-blurred reflBlurV.texture is bound to uRefl

  // Cycles Multi-Basis Encoding, Resolution & Radiometric Scaling:
  uLightMix:         { value: 0.00 },                          // [0..1] blend slot A -> slot B (walls & floor)
  uLightEncA:        { value: 0.00 },                          // 0.0 = V9 sRGB, 1.0 = Cycles RGBM-sqrt, 2.0 = Cycles RGBA16F 1-tap
  uLightEncB:        { value: 0.00 },                          // 0.0 = V9 sRGB, 1.0 = Cycles RGBM-sqrt, 2.0 = Cycles RGBA16F 1-tap
  uFixEnc:           { value: 0.00 },                          // 0.0 = V9 R/G, 1.0 = Cycles B_sconce RGBM-sqrt, 2.0 = wallFixRT V9<->C0x, 3.0 = Cycles RGBA16F 1-tap
  uWallLightSizeA:   { value: new THREE.Vector2(2048, 2048) },
  uWallLightSizeB:   { value: new THREE.Vector2(2048, 2048) },
  uLightFixSize:     { value: new THREE.Vector2(1024, 1024) },
  uCeilLightSize:    { value: new THREE.Vector2(1024, 2048) },
  uCeilFixSize:      { value: new THREE.Vector2(512, 1024) },
  uFloorLightSizeA:  { value: new THREE.Vector2(1024, 2048) },
  uFloorLightSizeB:  { value: new THREE.Vector2(1024, 2048) },
  uFloorFixSizeA:    { value: new THREE.Vector2(512, 1024) },
  uFloorFixSizeB:    { value: new THREE.Vector2(512, 1024) },
  uFloorFixEncA:     { value: 0.00 },                          // 0.0 = V9, 1.0 = RGBM-sqrt, 2.0 = RGBA16F 1-tap
  uFloorFixEncB:     { value: 0.00 },                          // 0.0 = V9, 1.0 = RGBM-sqrt, 2.0 = RGBA16F 1-tap
  uFloorFixMix:      { value: 0.00 },
  uCeilEnc:          { value: 0.00 },                          // 0.0 = V9 sRGB, 1.0 = Cycles RGBM-sqrt, 2.0 = Cycles RGBA16F 1-tap
  uCeilFixEnc:       { value: 0.00 },                          // 0.0 = V9 R/G, 1.0 = Cycles B_sconce RGBM-sqrt, 2.0 = Cycles RGBA16F 1-tap
  uCeilFixWeight:    { value: 1.00 },                          // 0.0 when ceilRT already composites full V9<->C0x radiance

  uSmaxWallA:        { value: 16.0 },
  uSmaxWallB:        { value: 16.0 },
  uSmaxWallFix:      { value: 6.0 },
  uSmaxCeil:         { value: 8.0 },
  uSmaxCeilFix:      { value: 6.0 },
  uSmaxFloorA:       { value: 16.0 },
  uSmaxFloorB:       { value: 16.0 },
  uSmaxFloorFixA:    { value: 6.0 },
  uSmaxFloorFixB:    { value: 6.0 },
  uSmaxTrimA:        { value: 16.0 },
  uSmaxTrimB:        { value: 16.0 },
  uSmaxTrimSc:       { value: 6.0 },
  uSmaxProbe:        { value: 16.0 },

  uExtGainA:         { value: 1.00 },
  uExtGainB:         { value: 1.00 },
  uExtGainCeil:      { value: 1.00 },
  uSconceCyclesGain: { value: 1.00 },
  uSconceColorCorr:  { value: new THREE.Vector3(1.0, 0.84, 0.62) },
  uSconceColorAlc:   { value: new THREE.Vector3(1.0, 0.84, 0.62) },
  uWallAlbedoPhys:   { value: new THREE.Vector3(0.80, 0.78, 0.75) },
  uTinAlbedoPhys:    { value: new THREE.Vector3(0.54, 0.52, 0.48) },

  // Frequency-Split Unified Direct Sun RGB weights (B6a: default 0 on v1 packs -> zero double-sun in Wave 1!):
  uDirSunRgbC03:     { value: new THREE.Vector3(0, 0, 0) },
  uDirSunRgbC02:     { value: new THREE.Vector3(0, 0, 0) },
  uDirSunRgbC02Br:   { value: new THREE.Vector3(0, 0, 0) },
  uSunVecC02Br:      { value: new THREE.Vector3(0.2151, 0.5752, 0.7892) },
  // Cycle 4 Photographic Mipmapped C02 Leaf Cookie (NEVER declared in OUTSIDE_LIGHT_GLSL -> wall 6/6, ceil 2/2, floor 13/16!):
  uLeafCookieReady:  { value: 0.00 },
  tLeafCookie:       { value: _phWhite1x1 },

  // Trim Vertex Radiosity & Dynamic 6-Face Ambient Cube (8x8x40 v1 or 12x12x48 Cycle 2):
  uTrimRadMix:       { value: 0.00 },                          // 0.0 on V9, 1.0 on Cycles C02-C05, t on V9<->C0x
  uTrimExtMix:       { value: 0.00 },                          // [0..1] blend aRadExtA -> aRadExtB
  uTrimProbeBlend:   { value: 0.35 },                          // locked #96 #4: 0.35 alcove trim, 0.70 corridor trim, 1.0 doors
  uHasProbeCube:     { value: 0.00 },                          // 1.0 when probe cube RT is bound
  tProbeCube:        { value: _phRgbmsqrt },                   // declared ONLY in PROBE_CUBE_GLSL (0 samplers elsewhere!)
  uProbeDims:        { value: new THREE.Vector3(8, 8, 40) },   // B6b: populated from meta.probe_grid.dims
  uProbeBoundsX:     { value: new THREE.Vector2(-1.72, 1.72) },
  uProbeBoundsY:     { value: new THREE.Vector2(0.0, 4.86) },
  uProbeBoundsS:     { value: new THREE.Vector2(3.70, 23.92) },
};

function setCyclesMix(v) {
  const c = Math.max(0, Math.min(1, +v || 0));
  SHARED_OUTSIDE_UNIFORMS.uTmOutMix.value = c;
  SHARED_OUTSIDE_UNIFORMS.uOutCyclesMix.value = c;
}

// ---------------------------------------------------------------------------
// 1. Exterior Sky Plate Slot Manager (Bounded VRAM, O(1) Handoff, 0 B on V9)
// ---------------------------------------------------------------------------
const _cpuImages = {};
const _pendingCallbacks = {};
const _plateListeners = new Set();
export function onOutsidePlateReady(fn) { _plateListeners.add(fn); }
function notifyPlateReady(key) {
  _plateListeners.forEach(fn => { try { fn(key); } catch {} });
}

function preloadCpuImage(key) {
  if (_cpuImages[key] || typeof Image === 'undefined' || !PLATE_URLS[key]) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.decoding = 'async';
  _cpuImages[key] = { img, ready: false };
  img.onload = () => {
    _cpuImages[key].ready = true;
    const cbs = _pendingCallbacks[key];
    if (cbs) {
      delete _pendingCallbacks[key];
      cbs.forEach(fn => fn(img));
    }
    notifyPlateReady(key);
  };
  img.onerror = () => {
    _cpuImages[key].ready = true;
    const cbs = _pendingCallbacks[key];
    if (cbs) {
      delete _pendingCallbacks[key];
      cbs.forEach(fn => fn(null));
    }
  };
  img.src = PLATE_URLS[key];
}

let _gpuSlotA = { mode: null, tex: null };
let _gpuSlotB = { mode: null, tex: null };
let _skyPlatesWantMips = false;

function makeGpuTexFromImg(img, srgb, renderer, mipped = _skyPlatesWantMips) {
  const t = new THREE.Texture(img);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.generateMipmaps = !!mipped;
  t.minFilter = mipped ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = (mipped && renderer) ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  if (renderer) {
    try { renderer.initTexture(t); } catch {}
  }
  return t;
}

function setSkyPlateMips(wantMips, renderer = null) {
  const want = !!wantMips;
  _skyPlatesWantMips = want;
  const slots = [
    [_gpuSlotA, SHARED_OUTSIDE_UNIFORMS.tOutPlateA],
    [_gpuSlotB, SHARED_OUTSIDE_UNIFORMS.tOutPlateB],
  ];
  for (const [slot, uniformRef] of slots) {
    if (!slot.tex || !slot.mode) continue;
    if (!!slot.tex.generateMipmaps === want) continue;
    const img = slot.tex.image || _cpuImages[slot.mode]?.img;
    if (!img) continue;
    const oldTex = slot.tex;
    const newTex = makeGpuTexFromImg(img, true, renderer, want);
    slot.tex = newTex;
    uniformRef.value = newTex;
    oldTex.dispose();
  }
}

function disposeSlot(slot, uniformRef, maskUniformRef, placeholder) {
  uniformRef.value = placeholder;
  if (maskUniformRef) maskUniformRef.value.set(0, 0, 0, 0);
  if (slot.tex) {
    slot.tex.dispose();
    slot.tex = null;
  }
  slot.mode = null;
}

function bindSlotMode(slot, mode, uniformRef, maskUniformRef, placeholder, renderer) {
  if (!mode || mode === 'v9' || !PLATE_URLS[mode]) {
    disposeSlot(slot, uniformRef, maskUniformRef, placeholder);
    return;
  }
  if (slot.mode === mode && slot.tex) {
    const m = MODE_VEC4[mode];
    maskUniformRef.value.set(m[0], m[1], m[2], m[3]);
    return;
  }
  disposeSlot(slot, uniformRef, maskUniformRef, placeholder);
  slot.mode = mode;
  preloadCpuImage(mode);
  const entry = _cpuImages[mode];
  const mountImg = (img) => {
    if (!img || slot.mode !== mode) return;
    const newTex = makeGpuTexFromImg(img, true, renderer);
    const oldTex = slot.tex;
    slot.tex = newTex;
    uniformRef.value = newTex;
    const m = MODE_VEC4[mode];
    maskUniformRef.value.set(m[0], m[1], m[2], m[3]);
    if (oldTex) oldTex.dispose();
  };
  if (entry && entry.ready) {
    mountImg(entry.img);
  } else {
    (_pendingCallbacks[mode] || (_pendingCallbacks[mode] = [])).push(mountImg);
  }
}

export function syncOutsideGpuPlates(modeA, modeB = null, renderer = null) {
  // Zero-reupload O(1) slot handoff when a cross-plate lerp settles onto modeB:
  if ((!modeB || modeB === modeA || modeB === 'v9') && modeA && modeA !== 'v9' && _gpuSlotB.mode === modeA && _gpuSlotB.tex) {
    const handoffTex = _gpuSlotB.tex;
    const oldA = _gpuSlotA.tex;
    _gpuSlotA = { mode: modeA, tex: handoffTex };
    _gpuSlotB = { mode: null, tex: null };
    SHARED_OUTSIDE_UNIFORMS.tOutPlateA.value = handoffTex;
    const m = MODE_VEC4[modeA];
    SHARED_OUTSIDE_UNIFORMS.uOutPlateSlotA.value.set(m[0], m[1], m[2], m[3]);
    SHARED_OUTSIDE_UNIFORMS.tOutPlateB.value = _phPlate;
    SHARED_OUTSIDE_UNIFORMS.uOutPlateSlotB.value.set(0, 0, 0, 0);
    if (oldA) oldA.dispose();
    return;
  }
  bindSlotMode(_gpuSlotA, modeA, SHARED_OUTSIDE_UNIFORMS.tOutPlateA, SHARED_OUTSIDE_UNIFORMS.uOutPlateSlotA, _phPlate, renderer);
  if (modeB && modeB !== modeA && modeB !== 'v9') {
    bindSlotMode(_gpuSlotB, modeB, SHARED_OUTSIDE_UNIFORMS.tOutPlateB, SHARED_OUTSIDE_UNIFORMS.uOutPlateSlotB, _phPlate, renderer);
  } else {
    disposeSlot(_gpuSlotB, SHARED_OUTSIDE_UNIFORMS.tOutPlateB, SHARED_OUTSIDE_UNIFORMS.uOutPlateSlotB, _phPlate);
  }
}

// ---------------------------------------------------------------------------
// 2. Cycles Multi-Basis Loader, CPU Cache & Bounded GPU Slot Manager
// ---------------------------------------------------------------------------
let _metaPromise = null;
let _metaData = null;
let _metaWarned = false;
const _basisCpuCache = new Map(); // mode -> Promise<{ cfg, wallsSrc, ceilSrc, floorSrc, probesSrc, trimBytes } | null>

let _sconceGpu = null;            // { mode: 'sconce', cfg, walls, ceil, floor, probes, trimBytes }
let _extGpuA   = null;            // { mode, cfg, walls, ceil, floor, probes, trimBytes }
let _extGpuB   = null;            // { mode, cfg, walls, ceil, floor, probes, trimBytes }

let _syncSeq = 0;
let _activeSyncPromise = Promise.resolve();
let _lastHallRef = null;
let _cyclesActiveState = {
  kind: 'v9',     // 'v9' | 'settled' | 'lerp_cc' | 'lerp_vc'
  modeA: 'v9',
  modeB: null,
  u: 0.0,
};

function fetchOutsideMeta() {
  if (_metaPromise) return _metaPromise;
  if (typeof fetch === 'undefined') {
    _metaPromise = Promise.resolve(null);
    return _metaPromise;
  }
  _metaPromise = fetch(OUTSIDE_BASE + 'outside_meta.json' + OUTSIDE_VER, { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : null))
    .then(json => {
      if (json && json.bases && typeof json.bases === 'object') {
        _metaData = json;
        const pg = json.probe_grid;
        if (pg) {
          if (Array.isArray(pg.dims) && pg.dims.length >= 3) {
            SHARED_OUTSIDE_UNIFORMS.uProbeDims.value.set(
              Math.max(1, +pg.dims[0] || 8),
              Math.max(1, +pg.dims[1] || 8),
              Math.max(1, +pg.dims[2] || 40)
            );
          } else {
            SHARED_OUTSIDE_UNIFORMS.uProbeDims.value.set(8, 8, 40);
          }
          if (Array.isArray(pg.bounds_x)) SHARED_OUTSIDE_UNIFORMS.uProbeBoundsX.value.set(+pg.bounds_x[0], +pg.bounds_x[1]);
          if (Array.isArray(pg.bounds_y)) SHARED_OUTSIDE_UNIFORMS.uProbeBoundsY.value.set(+pg.bounds_y[0], +pg.bounds_y[1]);
          if (Array.isArray(pg.bounds_s)) SHARED_OUTSIDE_UNIFORMS.uProbeBoundsS.value.set(+pg.bounds_s[0], +pg.bounds_s[1]);
        }
        syncMetaDirectSunUniforms(json);
        return json;
      }
      if (!_metaWarned) {
        _metaWarned = true;
        console.warn('[outside-light] baked/outside/outside_meta.json unavailable; preserving V9 cleanly until assets arrive.');
      }
      return null;
    })
    .catch(() => {
      if (!_metaWarned) {
        _metaWarned = true;
        console.warn('[outside-light] baked/outside/outside_meta.json not baked yet; preserving V9 cleanly.');
      }
      return null;
    });
  return _metaPromise;
}

// Bit-exact lossless RGBA8 image loader (zero alpha premultiplication via createImageBitmap when supported):
async function loadLosslessRgbmSource(url) {
  if (typeof fetch !== 'undefined' && typeof createImageBitmap === 'function') {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      const blob = await r.blob();
      return await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    } catch {
      // Fall through to HTMLImageElement fallback
    }
  }
  if (typeof Image === 'undefined') return null;
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function loadTrimBin(url) {
  if (typeof fetch === 'undefined') return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

function makeRgbmsqrtTexture(src, renderer) {
  if (!src) return null;
  const t = new THREE.Texture(src);
  t.colorSpace = THREE.NoColorSpace;
  t.premultiplyAlpha = false;
  t.flipY = false;
  t.generateMipmaps = false;
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  if (renderer) {
    try { renderer.initTexture(t); } catch {}
  }
  return t;
}

function loadBasisCpu(mode, meta) {
  if (_basisCpuCache.has(mode)) return _basisCpuCache.get(mode);
  const cfg = meta?.bases?.[mode];
  if (!cfg || !cfg.walls?.file || !cfg.ceil?.file || !cfg.floor?.file) {
    return Promise.resolve(null);
  }
  const p = (async () => {
    try {
      const [wallsSrc, ceilSrc, floorSrc, probesSrc, trimBytes] = await Promise.all([
        loadLosslessRgbmSource(OUTSIDE_BASE + cfg.walls.file + OUTSIDE_VER),
        loadLosslessRgbmSource(OUTSIDE_BASE + cfg.ceil.file + OUTSIDE_VER),
        loadLosslessRgbmSource(OUTSIDE_BASE + cfg.floor.file + OUTSIDE_VER),
        cfg.probes?.file ? loadLosslessRgbmSource(OUTSIDE_BASE + cfg.probes.file + OUTSIDE_VER) : Promise.resolve(null),
        cfg.trim?.file ? loadTrimBin(OUTSIDE_BASE + cfg.trim.file + OUTSIDE_VER) : Promise.resolve(null),
      ]);
      if (!wallsSrc || !ceilSrc || !floorSrc) {
        console.warn(`[outside-light] Incomplete Cycles basis assets for "${mode}"; falling back gracefully.`);
        return null;
      }
      return { mode, cfg, wallsSrc, ceilSrc, floorSrc, probesSrc, trimBytes };
    } catch (err) {
      console.warn(`[outside-light] Failed loading Cycles basis "${mode}":`, err);
      return null;
    }
  })();
  _basisCpuCache.set(mode, p);
  return p;
}

function syncMetaDirectSunUniforms(meta) {
  const U = SHARED_OUTSIDE_UNIFORMS;
  const setV3 = (dst, arr, def) => {
    const a = (Array.isArray(arr) && arr.length >= 3) ? arr : def;
    dst.set(+a[0] || 0, +a[1] || 0, +a[2] || 0);
  };
  const c03 = meta?.bases?.c03;
  const c02 = meta?.bases?.c02;
  setV3(U.uDirSunRgbC03.value,   c03?.dir_sun_rgb,    [0, 0, 0]);
  setV3(U.uDirSunRgbC02.value,   c02?.dir_sun_rgb,    [0, 0, 0]);
  setV3(U.uDirSunRgbC02Br.value, c02?.dir_sun_rgb_br, [0, 0, 0]);
  setV3(U.uSunVecC02Br.value,    c02?.sun_vec_br,     [0.2151, 0.5752, 0.7892]);
  if (U.uSunVecC02Br.value.lengthSq() > 1e-6) {
    U.uSunVecC02Br.value.normalize();
  } else {
    U.uSunVecC02Br.value.set(0.2151, 0.5752, 0.7892).normalize();
  }
}

// Lazy CPU+GPU loader for 512x512 photographic mipmapped C02 leaf cookie (Evict-Before-Promote, +0 B on V9 & lerp_vc!):
let _leafCookieCpuPromise = null;
let _leafCookieCpuImg = null;
let _leafCookieTex = null;

function loadLeafCookieCpu() {
  if (_leafCookieCpuImg) return Promise.resolve(_leafCookieCpuImg);
  if (_leafCookieCpuPromise) return _leafCookieCpuPromise;
  if (typeof Image === 'undefined') return Promise.resolve(null);
  _leafCookieCpuPromise = new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => { _leafCookieCpuImg = img; resolve(img); };
    img.onerror = () => { _leafCookieCpuPromise = null; resolve(null); };
    img.src = LEAF_COOKIE_URL;
  });
  return _leafCookieCpuPromise;
}

function ensureLeafCookieGpu(img, renderer) {
  if (_leafCookieTex) return _leafCookieTex;
  if (!img) return null;
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.NoColorSpace;
  t.premultiplyAlpha = false;
  t.flipY = false;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  t.needsUpdate = true;
  if (renderer) {
    try { renderer.initTexture(t); } catch {}
  }
  _leafCookieTex = t;
  return t;
}

function releaseLeafCookieGpu(hall) {
  SHARED_OUTSIDE_UNIFORMS.uLeafCookieReady.value = 0.0;
  SHARED_OUTSIDE_UNIFORMS.tLeafCookie.value = _phWhite1x1;
  if (_leafCookieTex) {
    if (hall?.bakedWallMat?.uniforms?.tLightB?.value === _leafCookieTex) {
      hall.bakedWallMat.uniforms.tLightB.value = _phRgbmsqrt;
    }
    if (hall?.bakedFloorMat?.uniforms?.tLightB?.value === _leafCookieTex) {
      hall.bakedFloorMat.uniforms.tLightB.value = _phRgbmsqrt;
    }
    _leafCookieTex.dispose();
    _leafCookieTex = null;
  }
}

let _hfMipSupported = null;
function probeHalfFloatMipSupport(renderer) {
  if (_hfMipSupported !== null) return _hfMipSupported;
  if (!renderer) return false;
  const isWebGL2 = !!renderer.capabilities?.isWebGL2;
  const hasExt = !!(renderer.extensions?.has('EXT_color_buffer_float')
                 || renderer.extensions?.has('EXT_color_buffer_half_float'));
  if (!isWebGL2 || !hasExt) {
    _hfMipSupported = false;
    return false;
  }
  let ok = false;
  let probeRT = null;
  const prevRT = renderer.getRenderTarget();
  try {
    probeRT = new THREE.WebGLRenderTarget(1, 1, {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: true,
      depthBuffer: false,
      stencilBuffer: false,
      samples: 0,
    });
    const gl = renderer.getContext();
    renderer.setRenderTarget(probeRT);
    ok = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
  } catch {
    ok = false;
  } finally {
    renderer.setRenderTarget(prevRT);
    if (probeRT) probeRT.dispose();
  }
  _hfMipSupported = ok;
  return ok;
}

export function canUseHalfFloatMips(renderer) {
  return probeHalfFloatMipSupport(renderer);
}

function makeHalfFloatMippedRT(w, h, renderer) {
  const rt = new THREE.WebGLRenderTarget(w, h, {
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: true,
    depthBuffer: false,
    stencilBuffer: false,
    samples: 0,
  });
  rt.texture.colorSpace = THREE.NoColorSpace;
  rt.texture.premultiplyAlpha = false;
  rt.texture.flipY = false;
  rt.texture.wrapS = THREE.ClampToEdgeWrapping;
  rt.texture.wrapT = THREE.ClampToEdgeWrapping;
  rt.texture.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  rt.viewport.set(0, 0, w, h);
  rt.scissor.set(0, 0, w, h);
  rt.scissorTest = false;
  return rt;
}

function uploadBasisGpu(cpu, renderer) {
  if (!cpu) return null;
  return {
    mode: cpu.mode,
    cfg: cpu.cfg,
    isHF: false,
    walls: makeRgbmsqrtTexture(cpu.wallsSrc, renderer),
    ceil:  makeRgbmsqrtTexture(cpu.ceilSrc, renderer),
    floor: makeRgbmsqrtTexture(cpu.floorSrc, renderer),
    wallsRT: null,
    ceilRT:  null,
    floorRT: null,
    probes: cpu.probesSrc ? makeRgbmsqrtTexture(cpu.probesSrc, renderer) : null,
    trimBytes: cpu.trimBytes,
  };
}

function promoteBasisGpuInPlace(gpu, renderer) {
  if (!gpu || gpu.isHF || !renderer || !probeHalfFloatMipSupport(renderer)) return false;
  ensureCompositorObjects();
  const promoteOne = (tex, cfgSurf) => {
    if (!tex) return { tex: null, rt: null };
    const w = cfgSurf?.size?.[0] || tex.image?.width || 512;
    const h = cfgSurf?.size?.[1] || tex.image?.height || 512;
    const sMax = cfgSurf?.s_max ?? 16.0;
    const rt = makeHalfFloatMippedRT(w, h, renderer);
    const cu = _compMat.uniforms;
    cu.uCompMode.value = 4.0;
    cu.tSrcA.value = tex;
    cu.uCompSmaxA.value = sMax;
    cu.uCompOutLin.value = 1.0;
    renderCompositorToRT(renderer, rt);
    tex.dispose(); // Free compact RGBA8 surface immediately!
    return { tex: rt.texture, rt };
  };
  const wRes = promoteOne(gpu.walls, gpu.cfg?.walls);
  gpu.walls = wRes.tex; gpu.wallsRT = wRes.rt;
  const cRes = promoteOne(gpu.ceil, gpu.cfg?.ceil);
  gpu.ceil = cRes.tex; gpu.ceilRT = cRes.rt;
  const fRes = promoteOne(gpu.floor, gpu.cfg?.floor);
  gpu.floor = fRes.tex; gpu.floorRT = fRes.rt;
  gpu.isHF = true;
  return true;
}

function demoteBasisGpuToCompact(gpu, cpu, renderer) {
  if (!gpu || !gpu.isHF || !cpu) return false;
  // B1 FBO Leak Guard: dispose promoted WebGLRenderTargets via rt.dispose(), keeping RGBA8 probes intact!
  if (gpu.wallsRT) { gpu.wallsRT.dispose(); gpu.wallsRT = null; }
  if (gpu.ceilRT)  { gpu.ceilRT.dispose();  gpu.ceilRT  = null; }
  if (gpu.floorRT) { gpu.floorRT.dispose(); gpu.floorRT = null; }
  gpu.walls = makeRgbmsqrtTexture(cpu.wallsSrc, renderer);
  gpu.ceil  = makeRgbmsqrtTexture(cpu.ceilSrc, renderer);
  gpu.floor = makeRgbmsqrtTexture(cpu.floorSrc, renderer);
  gpu.isHF = false;
  return true;
}

function disposeBasisGpu(gpu) {
  if (!gpu) return;
  // B1 FBO Leak Guard: call rt.dispose() on promoted RGBA16F surfaces so FBOs never leak!
  if (gpu.wallsRT) gpu.wallsRT.dispose(); else if (gpu.walls) gpu.walls.dispose();
  if (gpu.ceilRT)  gpu.ceilRT.dispose();  else if (gpu.ceil)  gpu.ceil.dispose();
  if (gpu.floorRT) gpu.floorRT.dispose(); else if (gpu.floor) gpu.floor.dispose();
  if (gpu.probes)  gpu.probes.dispose();
  gpu.wallsRT = gpu.ceilRT = gpu.floorRT = null;
  gpu.walls = gpu.ceil = gpu.floor = gpu.probes = null;
  gpu.isHF = false;
}

function unbindHallLightmapsToDummy(hall) {
  if (!hall) return;
  if (hall.bakedWallMat?.uniforms) {
    hall.bakedWallMat.uniforms.tLight.value = _phRgbmsqrt;
    hall.bakedWallMat.uniforms.tLightB.value = _phRgbmsqrt;
    hall.bakedWallMat.uniforms.tLightFix.value = _phRgbmsqrt;
  }
  if (hall.bakedCeilMat?.uniforms) {
    hall.bakedCeilMat.uniforms.tLight.value = _phRgbmsqrt;
    hall.bakedCeilMat.uniforms.tLightFix.value = _phRgbmsqrt;
  }
  if (hall.bakedFloorMat?.uniforms) {
    hall.bakedFloorMat.uniforms.tLight.value = _phRgbmsqrt;
    hall.bakedFloorMat.uniforms.tLightB.value = _phRgbmsqrt;
    hall.bakedFloorMat.uniforms.tLightFix.value = _phRgbmsqrt;
    hall.bakedFloorMat.uniforms.tLightFixB.value = _phRgbmsqrt;
  }
}

// ---------------------------------------------------------------------------
// 3. Trim Vertex Radiosity Sidecar VBO Manager (`*_trim.bin`, 143,331 x 4 B)
// ---------------------------------------------------------------------------
const TRIM_MESH_NAMES = new Set(['room_props', 'room_doors', 'room_end_leaf_L', 'room_end_leaf_R', 'astragal_end_L']);

function collectTrimMeshes(hall) {
  const out = [];
  if (!hall?.bakedPack?.scene) return out;
  hall.bakedPack.scene.traverse(o => {
    if (o.isMesh && o.geometry && TRIM_MESH_NAMES.has(o.name)) out.push(o);
  });
  return out;
}

function attachTrimAttribute(hall, attrName, trimBytes, trimOrder) {
  if (!hall?.bakedPack?.scene || !trimBytes || !Array.isArray(trimOrder)) return;
  const orderMap = new Map(trimOrder.map(e => [e.name, e]));
  const meshes = collectTrimMeshes(hall);

  for (const mesh of meshes) {
    const geo = mesh.geometry;
    const pos = geo.attributes?.position;
    if (!pos) continue;
    const nv = pos.count;
    const srcName = mesh.userData?.srcMeshName || mesh.name;
    const entry = orderMap.get(srcName);
    if (!entry) continue;

    let bytes = null;
    const srcIdx = mesh.userData?.srcVertIndices;
    if (srcIdx && srcIdx.length === nv) {
      const existing = geo.getAttribute(attrName);
      bytes = (existing && existing.array instanceof Uint8Array && existing.array.length === nv * 4)
        ? existing.array
        : new Uint8Array(nv * 4);
      const baseOff = entry.offset;
      for (let k = 0; k < nv; k++) {
        const srcB = (baseOff + srcIdx[k]) * 4;
        const dstB = k * 4;
        if (srcB + 3 < trimBytes.length) {
          bytes[dstB]     = trimBytes[srcB];
          bytes[dstB + 1] = trimBytes[srcB + 1];
          bytes[dstB + 2] = trimBytes[srcB + 2];
          bytes[dstB + 3] = trimBytes[srcB + 3];
        } else {
          bytes[dstB] = bytes[dstB + 1] = bytes[dstB + 2] = 0;
          bytes[dstB + 3] = 4;
        }
      }
      if (existing && existing.array === bytes) {
        existing.needsUpdate = true;
      } else {
        geo.setAttribute(attrName, new THREE.BufferAttribute(bytes, 4, true));
      }
    } else if (nv === entry.count && (entry.offset + entry.count) * 4 <= trimBytes.length) {
      const slice = trimBytes.subarray(entry.offset * 4, (entry.offset + entry.count) * 4);
      const existing = geo.getAttribute(attrName);
      if (existing && existing.array instanceof Uint8Array && existing.array.length === nv * 4) {
        existing.array.set(slice);
        existing.needsUpdate = true;
      } else {
        // Own a mutable copy so future mode switches update in-place via gl.bufferSubData without reallocating VBOs!
        const copy = new Uint8Array(slice.length);
        copy.set(slice);
        geo.setAttribute(attrName, new THREE.BufferAttribute(copy, 4, true));
      }
    }
  }
}

function detachTrimAttribute(hall, attrName) {
  const meshes = collectTrimMeshes(hall);
  for (const mesh of meshes) {
    if (mesh.geometry?.getAttribute(attrName)) {
      mesh.geometry.deleteAttribute(attrName);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. B2-Hardened V9 Idle Lightmap Eviction & Zero-Fetch Restoration (-40 MiB)
// ---------------------------------------------------------------------------
function gatherV9EnamelMaterials(hall) {
  const list = [];
  if (hall?.bakedTrimMat) list.push(hall.bakedTrimMat);
  if (hall?.bakedDoorMat) list.push(hall.bakedDoorMat);
  if (hall?._v9RefMats) {
    for (const m of hall._v9RefMats) {
      if (m && m !== hall.bakedWallMat && m !== hall.bakedCeilMat && m !== hall.bakedFloorMat && !list.includes(m)) {
        list.push(m);
      }
    }
  }
  return list;
}

export function restoreV9Lightmaps(hall, renderer = null) {
  const pk = hall?.bakedPack;
  if (!pk || !pk._v9Evicted) return;
  const r = renderer || hall.renderer;
  const keys = ['tWalls', 'tCeil', 'tFloor', 'tWallsF', 'tCeilF', 'tFloorF'];
  for (const key of keys) {
    const img = pk._v9Imgs?.[key];
    if (!img) continue;
    const t = new THREE.Texture(img);
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 1;
    t.needsUpdate = true;
    if (r) {
      try { r.initTexture(t); } catch {}
    }
    pk[key] = t;
  }
  pk._v9Evicted = false;
  // Rebind enamel & mocks materials back to restored V9 floor/ceil maps:
  for (const mat of gatherV9EnamelMaterials(hall)) {
    const u = mat.uniforms;
    if (!u) continue;
    if (u.tFloorLight) u.tFloorLight.value = pk.tFloor;
    if (u.tFloorFix)   u.tFloorFix.value   = pk.tFloorF;
    if (u.tCeilLight)  u.tCeilLight.value  = pk.tCeil;
    if (u.tCeilFix)    u.tCeilFix.value    = pk.tCeilF;
  }
}

export function evictV9Lightmaps(hall) {
  const pk = hall?.bakedPack;
  if (!pk || pk._v9Evicted) return;

  // B2 Mandatory Guard: NEVER dispose V9 lightmaps if ANY wall/ceil/floor uniform still points to them!
  const v9Set = new Set([pk.tWalls, pk.tCeil, pk.tFloor, pk.tWallsF, pk.tCeilF, pk.tFloorF].filter(Boolean));
  const checkRebound = (mat, keys) => {
    if (!mat?.uniforms) return true;
    for (const k of keys) {
      const u = mat.uniforms[k];
      if (u && v9Set.has(u.value)) return false;
    }
    return true;
  };
  if (!checkRebound(hall.bakedWallMat, ['tLight', 'tLightB', 'tLightFix']) ||
      !checkRebound(hall.bakedCeilMat, ['tLight', 'tLightFix']) ||
      !checkRebound(hall.bakedFloorMat, ['tLight', 'tLightB', 'tLightFix', 'tLightFixB'])) {
    return;
  }

  // Rebind ALL enamel + mocks.js referencing uniforms to 1x1 dummy BEFORE disposing any V9 GPU texture!
  for (const mat of gatherV9EnamelMaterials(hall)) {
    const u = mat.uniforms;
    if (!u) continue;
    if (u.tFloorLight) u.tFloorLight.value = _phRgbmsqrt;
    if (u.tFloorFix)   u.tFloorFix.value   = _phRgbmsqrt;
    if (u.tCeilLight)  u.tCeilLight.value  = _phRgbmsqrt;
    if (u.tCeilFix)    u.tCeilFix.value    = _phRgbmsqrt;
    if (u.tLight && v9Set.has(u.tLight.value))       u.tLight.value    = hall.bakedWallMat.uniforms.tLight.value;
    if (u.tLightB && v9Set.has(u.tLightB.value))     u.tLightB.value   = hall.bakedWallMat.uniforms.tLightB.value;
    if (u.tLightFix && v9Set.has(u.tLightFix.value)) u.tLightFix.value = hall.bakedWallMat.uniforms.tLightFix.value;
  }

  // Clear compositor sampler refs too so it never holds a disposed texture:
  clearCompositorSourceRefs();

  for (const key of ['tWalls', 'tCeil', 'tFloor', 'tWallsF', 'tCeilF', 'tFloorF']) {
    const tex = pk[key];
    if (tex && tex !== pk._dummyBlack && !tex.userData?._evicted) {
      tex.userData = tex.userData || {};
      tex.userData._evicted = true;
      tex.dispose();
    }
  }
  pk._v9Evicted = true;
}

// ---------------------------------------------------------------------------
// 5. H1-Hardened OutsideLerpCompositor (Single Fullscreen Shader, 0 Recompiles)
// ---------------------------------------------------------------------------
let _compScene = null;
let _compCam   = null;
let _compGeo   = null;
let _compMat   = null;
let _compWarmed = false;

let _ceilRT       = null; // 256x512 (0.50 MiB RGBA8 lerp_vc or 1.33 MiB RGBA16F mipped lerp_cc)
let _ceilRTIsHF   = false;
let _wallFixRT    = null; // 512x512 (1.00 MiB) allocated ONLY during V9 <-> C0x lerps
let _wallLerpRT   = null; // 512x512 (2.67 MiB RGBA16F mipped) allocated ONLY during C02 <-> C0x lerps (frees tLightB for tLeafCookie!)
let _wallLerpRTIsHF  = false;
let _floorLerpRT  = null; // 256x512 (1.33 MiB RGBA16F mipped) allocated ONLY during C02 <-> C0x lerps (frees tLightB for tLeafCookie!)
let _floorLerpRTIsHF = false;
let _probeRT      = null; // Dynamic (ns*nx x 6*ny): 320x48 (v1) or 576x72 (12x12x48 Cycle 2+)

let _lastCeilKey      = '';
let _lastWallFixKey   = '';
let _lastWallLerpKey  = '';
let _lastFloorLerpKey = '';
let _lastProbeKey     = '';

const _savedVp = new THREE.Vector4();
const _savedSc = new THREE.Vector4();

function ensureCompositorObjects() {
  if (_compMat) return;
  _compScene = new THREE.Scene();
  _compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  _compGeo = new THREE.PlaneGeometry(2, 2);
  _compMat = new THREE.ShaderMaterial({
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    dithering: false,
    uniforms: {
      tSrcA:             { value: _phRgbmsqrt },
      tSrcB:             { value: _phRgbmsqrt },
      tSrcC:             { value: _phRgbmsqrt },
      tSrcD:             { value: _phRgbmsqrt },
      uSrcSizeA:         { value: new THREE.Vector2(1, 1) },
      uSrcSizeB:         { value: new THREE.Vector2(1, 1) },
      uSrcSizeC:         { value: new THREE.Vector2(1, 1) },
      uSrcSizeD:         { value: new THREE.Vector2(1, 1) },
      uCompMode:         { value: 0.0 },
      uCompMix:          { value: 0.0 },
      uCompLinA:         { value: 0.0 },
      uCompLinB:         { value: 0.0 },
      uCompOutLin:       { value: 0.0 },
      uCompSmaxA:        { value: 16.0 },
      uCompSmaxB:        { value: 16.0 },
      uCompSmaxC:        { value: 16.0 },
      uCompSmaxD:        { value: 6.0 },
      uCompSmaxOut:      { value: 16.0 },
      uCompGainA:        { value: 1.0 },
      uCompGainB:        { value: 1.0 },
      uCompGainC:        { value: 1.0 },
      uCompGainD:        { value: 1.0 },
      uCompTintCorr:     { value: new THREE.Vector3(1.0, 0.84, 0.62) },
      uCompTintAlc:      { value: new THREE.Vector3(1.0, 0.84, 0.62) },
      uCompTinAlb:       { value: new THREE.Vector3(0.54, 0.52, 0.48) },
      uCompCeilRect:     { value: new THREE.Vector4(-1.77, 1.77, 3.64, 23.98) },
      uCompProbeBoundsS: { value: new THREE.Vector2(3.70, 23.92) },
      uCompProbeDims:    { value: new THREE.Vector3(8, 8, 40) },
      uV9Scale:          { value: 3.6 },
      uV9FixScale:       { value: 7.25 },
      uV9BakeExp:        { value: 1.0 },
      uV9AmbGain:        { value: 0.39 },
      uV9SpotGain:       { value: 1.05 },
      uV9SconceGain:     { value: 2.15 },
      uV9Warmth:         { value: 1.0 },
      uV9WallWhite:      { value: 1.28 },
      uV9HasFix:         { value: 1.0 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform sampler2D tSrcA, tSrcB, tSrcC, tSrcD;
      uniform vec2 uSrcSizeA, uSrcSizeB, uSrcSizeC, uSrcSizeD;
      uniform float uCompMode, uCompMix, uCompLinA, uCompLinB, uCompOutLin;
      uniform float uCompSmaxA, uCompSmaxB, uCompSmaxC, uCompSmaxD, uCompSmaxOut;
      uniform float uCompGainA, uCompGainB, uCompGainC, uCompGainD;
      uniform vec3 uCompTintCorr, uCompTintAlc, uCompTinAlb, uCompProbeDims;
      uniform vec4 uCompCeilRect;
      uniform vec2 uCompProbeBoundsS;
      uniform float uV9Scale, uV9FixScale, uV9BakeExp, uV9AmbGain, uV9SpotGain, uV9SconceGain, uV9Warmth, uV9WallWhite, uV9HasFix;
      varying vec2 vUv;

      vec3 compDecodeRgbmsqrt(vec4 t, float sMax) {
        vec3 v = t.rgb * t.a;
        return (v * v) * sMax;
      }

      vec3 compSampleRGBM4Tap(sampler2D tex, vec2 uv, vec2 texSize, float sMax) {
        vec2 invSz = 1.0 / max(texSize, vec2(1.0));
        vec2 p = uv * texSize - 0.5, i = floor(p), f = fract(p);
        vec3 c00 = compDecodeRgbmsqrt(texture2D(tex, (i + vec2(0.5, 0.5)) * invSz), sMax);
        vec3 c10 = compDecodeRgbmsqrt(texture2D(tex, (i + vec2(1.5, 0.5)) * invSz), sMax);
        vec3 c01 = compDecodeRgbmsqrt(texture2D(tex, (i + vec2(0.5, 1.5)) * invSz), sMax);
        vec3 c11 = compDecodeRgbmsqrt(texture2D(tex, (i + vec2(1.5, 1.5)) * invSz), sMax);
        return mix(mix(c00, c10, f.x), mix(c01, c11, f.x), f.y);
      }

      vec4 compEncodeRgbmsqrt(vec3 lin, float sMax) {
        vec3 lp = sqrt(clamp(max(lin, vec3(0.0)) / max(sMax, 1e-4), vec3(0.0), vec3(1.0)));
        float mx = max(lp.r, max(lp.g, lp.b));
        float m = clamp(ceil(mx * 255.0) / 255.0, 4.0 / 255.0, 1.0);
        vec3 rgb = clamp(lp / m, vec3(0.0), vec3(1.0));
        return vec4(rgb, m);
      }

      vec3 compSpotKelvin(float w) {
        vec3 c0 = vec3(1.00, 0.99, 0.97);
        vec3 c1 = vec3(1.06, 0.95, 0.83);
        vec3 c2 = vec3(1.16, 0.83, 0.56);
        return (w < 0.55) ? mix(c0, c1, w / 0.55) : mix(c1, c2, (w - 0.55) / 0.45);
      }

      vec3 compSconceKelvin(float w) {
        vec3 c0 = vec3(1.01, 0.98, 0.94);
        vec3 c1 = vec3(1.09, 0.93, 0.78);
        vec3 c2 = vec3(1.20, 0.79, 0.50);
        return (w < 0.55) ? mix(c0, c1, w / 0.55) : mix(c1, c2, (w - 0.55) / 0.45);
      }

      void main() {
        vec3 outLin = vec3(0.0);
        if (uCompMode < 0.5) {
          // Mode 0: C0x <-> C0y ceiling exterior irradiance mix (B1a: supports linear RGBA16F in/out OR RGBM-sqrt!)
          vec3 eA = ((uCompLinA > 0.5) ? texture2D(tSrcA, vUv).rgb : compSampleRGBM4Tap(tSrcA, vUv, uSrcSizeA, uCompSmaxA)) * uCompGainA;
          vec3 eB = ((uCompLinB > 0.5) ? texture2D(tSrcB, vUv).rgb : compSampleRGBM4Tap(tSrcB, vUv, uSrcSizeB, uCompSmaxB)) * uCompGainB;
          outLin = mix(eA, eB, clamp(uCompMix, 0.0, 1.0));
        } else if (uCompMode < 1.5) {
          // Mode 1: V9 <-> C0x full ceiling radiance composite (ceilRT 256x512 RGBA8; uCeilFixWeight = 0)
          float ceilWhiteGain = 1.0 + clamp(uV9WallWhite - 1.0, -0.30, 0.60) * 0.48;
          vec3 rawCeil = texture2D(tSrcA, vUv).rgb * uV9Scale;
          rawCeil = rawCeil / (vec3(1.0) + max(vec3(0.0), rawCeil - vec3(0.92)) * 0.58);
          vec3 cAmbV9 = (rawCeil * 0.52 + vec3(0.10)) * (uV9BakeExp * uV9AmbGain * ceilWhiteGain);
          vec3 cFixV9 = vec3(0.0);
          if (uV9HasFix > 0.5) {
            vec3 rf = texture2D(tSrcB, vUv).rgb;
            cFixV9 = (rf.r * (0.68 * uV9SpotGain) * compSpotKelvin(uV9Warmth)
                    + rf.g * (0.45 * uV9SconceGain) * compSconceKelvin(uV9Warmth)) * (uV9FixScale * uV9BakeExp);
          }
          vec3 cV9 = cAmbV9 + cFixV9;
          vec3 eExtC = compSampleRGBM4Tap(tSrcC, vUv, uSrcSizeC, uCompSmaxC) * uCompGainC;
          vec3 eScC  = compSampleRGBM4Tap(tSrcD, vUv, uSrcSizeD, uCompSmaxD) * uCompGainD;
          float sCeil = mix(uCompCeilRect.w, uCompCeilRect.z, vUv.y);
          vec3 scTintC = mix(uCompTintCorr, uCompTintAlc, smoothstep(19.90, 20.58, sCeil));
          vec3 cCyc = (eExtC + eScC * scTintC) * uCompTinAlb;
          outLin = mix(cV9, cCyc, clamp(uCompMix, 0.0, 1.0));
        } else if (uCompMode < 2.5) {
          // Mode 2: V9 <-> C0x wall fixture composite (wallFixRT 512x512 RGBA8; H1 alcove ramp runs in bakedWallMat)
          vec3 fixV9 = vec3(0.0);
          if (uV9HasFix > 0.5) {
            vec3 rf = texture2D(tSrcA, vUv).rgb;
            float spotLin   = rf.r * uV9FixScale;
            float sconceLin = rf.g * uV9FixScale;
            sconceLin = sconceLin / (1.0 + max(0.0, sconceLin - 0.36) * 1.45);
            fixV9 = (spotLin * (0.76 * uV9SpotGain) * compSpotKelvin(uV9Warmth)
                   + sconceLin * (0.50 * uV9SconceGain) * compSconceKelvin(uV9Warmth)) * uV9BakeExp;
          }
          vec3 scCyc = compSampleRGBM4Tap(tSrcB, vUv, uSrcSizeB, uCompSmaxB) * uCompGainB * uCompTintCorr;
          outLin = mix(fixV9, scCyc, clamp(uCompMix, 0.0, 1.0));
        } else if (uCompMode < 3.5) {
          // Mode 3: 6-Face Ambient Cube composite (dynamic ns*nx x 6*ny, exact 1:1 texel lookup, zero cross-face bleed!)
          vec3 eExtA = compDecodeRgbmsqrt(texture2D(tSrcA, vUv), uCompSmaxA) * uCompGainA;
          vec3 eExtB = compDecodeRgbmsqrt(texture2D(tSrcB, vUv), uCompSmaxB) * uCompGainB;
          vec3 eExt  = (uCompMix > 0.0005) ? mix(eExtA, eExtB, clamp(uCompMix, 0.0, 1.0)) : eExtA;
          vec3 eSc   = compDecodeRgbmsqrt(texture2D(tSrcC, vUv), uCompSmaxC) * uCompGainC;
          float nsP = max(1.0, uCompProbeDims.z);
          float isIdx = floor(clamp(vUv.x * nsP, 0.0, nsP - 0.001));
          float sSlice = mix(uCompProbeBoundsS.x, uCompProbeBoundsS.y, (isIdx + 0.5) / nsP);
          vec3 scTintP = mix(uCompTintCorr, uCompTintAlc, smoothstep(19.90, 20.58, sSlice));
          outLin = eExt + eSc * scTintP;
        } else if (uCompMode < 4.5) {
          // Mode 4: Exact 1:1 RGBM-sqrt -> linear RGBA16F GPU promotion (NearestFilter input, bypass compEncodeRgbmsqrt!)
          gl_FragColor = vec4(compDecodeRgbmsqrt(texture2D(tSrcA, vUv), uCompSmaxA), 1.0);
          return;
        } else if (uCompMode < 5.5) {
          // Mode 5: reflRT -> reflBlurH 5-tap horizontal Gaussian (sigma_x = 1.35 px at half-res, mip 1.0 2x2 pre-box!)
          float dx = 1.0 / max(uSrcSizeA.x, 1.0);
          float o1 = 1.38461538 * dx;
          float o2 = 3.23076923 * dx;
          vec3 acc = textureLod(tSrcA, clamp(vUv, vec2(0.002), vec2(0.998)), 1.0).rgb * 0.22702703
                   + (textureLod(tSrcA, clamp(vUv + vec2(o1, 0.0), vec2(0.002), vec2(0.998)), 1.0).rgb
                    + textureLod(tSrcA, clamp(vUv - vec2(o1, 0.0), vec2(0.002), vec2(0.998)), 1.0).rgb) * 0.31621622
                   + (textureLod(tSrcA, clamp(vUv + vec2(o2, 0.0), vec2(0.002), vec2(0.998)), 1.0).rgb
                    + textureLod(tSrcA, clamp(vUv - vec2(o2, 0.0), vec2(0.002), vec2(0.998)), 1.0).rgb) * 0.07027027;
          gl_FragColor = vec4(max(acc, vec3(0.0)), 1.0);
          return;
        } else {
          // Mode 6: reflBlurH -> reflBlurV 5-tap vertical Gaussian (1.8:1 longitudinal varnish anisotropy, mipped target!)
          float dy = 1.0 / max(uSrcSizeA.y, 1.0);
          float o1 = (1.44 * 1.45) * dy;
          float o2 = (3.36 * 1.45) * dy;
          vec3 acc = texture2D(tSrcA, clamp(vUv, vec2(0.002), vec2(0.998))).rgb * 0.22702703
                   + (texture2D(tSrcA, clamp(vUv + vec2(0.0, o1), vec2(0.002), vec2(0.998))).rgb
                    + texture2D(tSrcA, clamp(vUv - vec2(0.0, o1), vec2(0.002), vec2(0.998))).rgb) * 0.31621622
                   + (texture2D(tSrcA, clamp(vUv + vec2(0.0, o2), vec2(0.002), vec2(0.998))).rgb
                    + texture2D(tSrcA, clamp(vUv - vec2(0.0, o2), vec2(0.002), vec2(0.998))).rgb) * 0.07027027;
          gl_FragColor = vec4(max(acc, vec3(0.0)), 1.0);
          return;
        }
        if (uCompOutLin > 0.5) {
          gl_FragColor = vec4(max(outLin, vec3(0.0)), 1.0);
        } else {
          gl_FragColor = compEncodeRgbmsqrt(outLin, uCompSmaxOut);
        }
      }
    `,
  });
  const quad = new THREE.Mesh(_compGeo, _compMat);
  quad.frustumCulled = false;
  _compScene.add(quad);
}

function clearCompositorSourceRefs() {
  if (!_compMat) return;
  _compMat.uniforms.tSrcA.value = _phRgbmsqrt;
  _compMat.uniforms.tSrcB.value = _phRgbmsqrt;
  _compMat.uniforms.tSrcC.value = _phRgbmsqrt;
  _compMat.uniforms.tSrcD.value = _phRgbmsqrt;
}

function makeCompositorRT(w, h) {
  const rt = new THREE.WebGLRenderTarget(w, h, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    generateMipmaps: false,
    depthBuffer: false,
    stencilBuffer: false,
    samples: 0,
  });
  rt.texture.colorSpace = THREE.NoColorSpace;
  rt.texture.premultiplyAlpha = false;
  rt.texture.flipY = false;
  rt.texture.wrapS = THREE.ClampToEdgeWrapping;
  rt.texture.wrapT = THREE.ClampToEdgeWrapping;
  rt.viewport.set(0, 0, w, h);
  rt.scissor.set(0, 0, w, h);
  rt.scissorTest = false;
  return rt;
}

function renderCompositorToRT(renderer, rt) {
  if (!renderer || !rt || !_compMat) return;
  const prevRT = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  const prevToneMapping = renderer.toneMapping;
  const prevOutputCS = renderer.outputColorSpace;
  const prevScissorTest = renderer.getScissorTest();
  renderer.getViewport(_savedVp);
  renderer.getScissor(_savedSc);

  try {
    // H1 State Hygiene: disable 1x1 scissor from warmAllRenderPaths and use RT native physical viewport!
    renderer.setScissorTest(false);
    renderer.autoClear = false;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    rt.viewport.set(0, 0, rt.width, rt.height);
    rt.scissorTest = false;
    renderer.setRenderTarget(rt);
    renderer.render(_compScene, _compCam);
  } finally {
    // B4a: Restore _savedVp/_savedSc/prevScissorTest ONLY when prevRT === null (setRenderTarget(prevRT) already restores RT state!)
    renderer.setRenderTarget(prevRT);
    if (prevRT === null) {
      renderer.setViewport(_savedVp);
      renderer.setScissor(_savedSc);
      renderer.setScissorTest(prevScissorTest);
    }
    renderer.autoClear = prevAutoClear;
    renderer.toneMapping = prevToneMapping;
    renderer.outputColorSpace = prevOutputCS;
    clearCompositorSourceRefs();
  }
}

export function runReflBlurPass(renderer, reflRT, blurH, blurV) {
  if (!renderer || !reflRT || !blurH || !blurV) return;
  ensureCompositorObjects();
  const cu = _compMat.uniforms;
  // Pass 1 (Mode 5): reflRT -> reflBlurH (horizontal 5-tap Gaussian on mip 1.0)
  cu.uCompMode.value = 5.0;
  cu.tSrcA.value = reflRT.texture;
  cu.uSrcSizeA.value.set(blurH.width, blurH.height);
  renderCompositorToRT(renderer, blurH);
  // Pass 2 (Mode 6): reflBlurH -> reflBlurV (vertical 5-tap Gaussian + hardware mipmaps on blurV)
  cu.uCompMode.value = 6.0;
  cu.tSrcA.value = blurH.texture;
  cu.uSrcSizeA.value.set(blurV.width, blurV.height);
  renderCompositorToRT(renderer, blurV);
}

export function warmOutsideCompositor(renderer) {
  if (_compWarmed || !renderer) return;
  _compWarmed = true;
  ensureCompositorObjects();
  // B1: Probe RGBA16F mipmap FBO completeness once at boot
  probeHalfFloatMipSupport(renderer);
  const tinyRT = makeCompositorRT(1, 1);
  _compMat.uniforms.uCompMode.value = 0.0;
  _compMat.uniforms.uCompLinA.value = 0.0;
  _compMat.uniforms.uCompLinB.value = 0.0;
  _compMat.uniforms.uCompOutLin.value = 0.0;
  _compMat.uniforms.tSrcA.value = _phRgbmsqrt;
  _compMat.uniforms.tSrcB.value = _phRgbmsqrt;
  renderCompositorToRT(renderer, tinyRT);
  tinyRT.dispose();
}

export function markOutsideCompositorDirty() {
  _lastCeilKey = '';
  _lastWallFixKey = '';
  _lastWallLerpKey = '';
  _lastFloorLerpKey = '';
  _lastProbeKey = '';
}

function disposeC02LerpRTs(hall) {
  if (_wallLerpRT) {
    if (hall?.bakedWallMat?.uniforms?.tLight?.value === _wallLerpRT.texture) {
      hall.bakedWallMat.uniforms.tLight.value = _extGpuA?.walls || (!hall.bakedPack?._v9Evicted ? hall.bakedPack?.tWalls : null) || _phRgbmsqrt;
    }
    _wallLerpRT.dispose();
    _wallLerpRT = null;
    _wallLerpRTIsHF = false;
    _lastWallLerpKey = '';
  }
  if (_floorLerpRT) {
    if (hall?.bakedFloorMat?.uniforms?.tLight?.value === _floorLerpRT.texture) {
      hall.bakedFloorMat.uniforms.tLight.value = _extGpuA?.floor || (!hall.bakedPack?._v9Evicted ? hall.bakedPack?.tFloor : null) || _phRgbmsqrt;
    }
    _floorLerpRT.dispose();
    _floorLerpRT = null;
    _floorLerpRTIsHF = false;
    _lastFloorLerpKey = '';
  }
}

function disposeTransitionRTs(hall) {
  if (_ceilRT) {
    if (hall?.bakedCeilMat?.uniforms?.tLight?.value === _ceilRT.texture) {
      hall.bakedCeilMat.uniforms.tLight.value = _extGpuA?.ceil || (!hall.bakedPack?._v9Evicted ? hall.bakedPack?.tCeil : null) || _phRgbmsqrt;
    }
    _ceilRT.dispose();
    _ceilRT = null;
    _ceilRTIsHF = false;
    _lastCeilKey = '';
  }
  if (_wallFixRT) {
    if (hall?.bakedWallMat?.uniforms?.tLightFix?.value === _wallFixRT.texture) {
      hall.bakedWallMat.uniforms.tLightFix.value = _sconceGpu?.walls || (!hall.bakedPack?._v9Evicted ? hall.bakedPack?.tWallsF : null) || _phRgbmsqrt;
    }
    _wallFixRT.dispose();
    _wallFixRT = null;
    _lastWallFixKey = '';
  }
  disposeC02LerpRTs(hall);
}

function disposeProbeRT() {
  SHARED_OUTSIDE_UNIFORMS.tProbeCube.value = _phRgbmsqrt;
  SHARED_OUTSIDE_UNIFORMS.uHasProbeCube.value = 0.0;
  if (_probeRT) {
    _probeRT.dispose();
    _probeRT = null;
    _lastProbeKey = '';
  }
}

// Called inside hall.render() BEFORE the reflRT floor-mirror pass (H1)!
export function updateOutsideCompositor(hall) {
  if (!hall?.renderer || !hall.isUsingBaked || !hall.bakedPack) return;
  const st = _cyclesActiveState;
  if (st.kind === 'v9' || SHARED_OUTSIDE_UNIFORMS.uOutCyclesMix.value <= 0.0005) {
    if (_ceilRT || _wallFixRT || _wallLerpRT || _floorLerpRT) disposeTransitionRTs(hall);
    return;
  }

  ensureCompositorObjects();
  const r = hall.renderer;
  const U = hall.bakedU;
  const pk = hall.bakedPack;
  const scLive = Math.max(0, Math.min(2.5, (U?.uSconceGain?.value ?? 2.15) / 2.15));
  const outStr = SHARED_OUTSIDE_UNIFORMS.uOutStrength.value;
  const bakeExp = U?.uBakeExp?.value ?? 1.0;
  const scGain = SHARED_OUTSIDE_UNIFORMS.uSconceCyclesGain.value * scLive * bakeExp;
  const cCorr = SHARED_OUTSIDE_UNIFORMS.uSconceColorCorr.value;
  const cAlc  = SHARED_OUTSIDE_UNIFORMS.uSconceColorAlc.value;
  const tinAlb = SHARED_OUTSIDE_UNIFORMS.uTinAlbedoPhys.value;
  let didRender = false;

  // 1. 6-Face Ambient Cube composite (dynamic ns*nx x 6*ny: 320x48 v1 or 576x72 Cycle 2) when probes exist:
  const hasProbes = !!(_extGpuA?.probes || _sconceGpu?.probes);
  if (hasProbes) {
    const extA = _extGpuA;
    const extB = (st.kind === 'lerp_cc') ? _extGpuB : null;
    const uMixP = extB ? st.u : 0.0;
    const gA = (extA?.cfg?.ext_gain ?? 1.0) * outStr;
    const gB = (extB?.cfg?.ext_gain ?? 1.0) * outStr;
    const gScP = _sconceGpu?.probes ? (SHARED_OUTSIDE_UNIFORMS.uSconceCyclesGain.value * scLive) : 0.0;
    const sMaxA = extA?.cfg?.probes?.s_max ?? 16.0;
    const sMaxB = extB?.cfg?.probes?.s_max ?? 16.0;
    const sMaxSc = _sconceGpu?.cfg?.probes?.s_max ?? 6.0;
    const sMaxOut = Math.max(8.0, sMaxA * gA + sMaxSc * gScP, sMaxB * gB + sMaxSc * gScP);
    const pd = SHARED_OUTSIDE_UNIFORMS.uProbeDims.value;
    const pW = Math.max(8, Math.round(pd.z * pd.x));
    const pH = Math.max(6, Math.round(6 * pd.y));
    const pKey = `p|${pW}x${pH}|${extA?.mode || ''}|${extB?.mode || ''}|${Math.round(uMixP * 1e5)}|${Math.round(gA * 1e5)}|${Math.round(gB * 1e5)}|${Math.round(gScP * 1e5)}|${Math.round(cCorr.x * 1e4)},${Math.round(cCorr.y * 1e4)},${Math.round(cCorr.z * 1e4)}|${Math.round(cAlc.x * 1e4)},${Math.round(cAlc.y * 1e4)},${Math.round(cAlc.z * 1e4)}`;
    if (_probeRT && (_probeRT.width !== pW || _probeRT.height !== pH)) {
      disposeProbeRT();
    }
    if (!_probeRT) _probeRT = makeCompositorRT(pW, pH);
    if (pKey !== _lastProbeKey) {
      _lastProbeKey = pKey;
      const cu = _compMat.uniforms;
      cu.uCompMode.value = 3.0;
      cu.uCompMix.value = uMixP;
      cu.uCompLinA.value = 0.0;
      cu.uCompLinB.value = 0.0;
      cu.uCompOutLin.value = 0.0;
      cu.tSrcA.value = extA?.probes || _phRgbmsqrt;
      cu.tSrcB.value = extB?.probes || _phRgbmsqrt;
      cu.tSrcC.value = _sconceGpu?.probes || _phRgbmsqrt;
      cu.uCompSmaxA.value = sMaxA;
      cu.uCompSmaxB.value = sMaxB;
      cu.uCompSmaxC.value = sMaxSc;
      cu.uCompSmaxOut.value = sMaxOut;
      cu.uCompGainA.value = extA?.probes ? gA : 0.0;
      cu.uCompGainB.value = extB?.probes ? gB : 0.0;
      cu.uCompGainC.value = gScP;
      cu.uCompTintCorr.value.copy(cCorr);
      cu.uCompTintAlc.value.copy(cAlc);
      cu.uCompProbeBoundsS.value.copy(SHARED_OUTSIDE_UNIFORMS.uProbeBoundsS.value);
      cu.uCompProbeDims.value.copy(pd);
      renderCompositorToRT(r, _probeRT);
      didRender = true;
    }
    SHARED_OUTSIDE_UNIFORMS.tProbeCube.value = _probeRT.texture;
    SHARED_OUTSIDE_UNIFORMS.uSmaxProbe.value = sMaxOut;
    SHARED_OUTSIDE_UNIFORMS.uHasProbeCube.value = 1.0;
  } else {
    disposeProbeRT();
  }

  // 2. Settled C0x: 0 transition RTs!
  if (st.kind === 'settled') {
    if (_ceilRT || _wallFixRT || _wallLerpRT || _floorLerpRT) disposeTransitionRTs(hall);
    if (didRender) hall.reflDirty = true;
    return;
  }

  // 3. C0x <-> C0y Lerp: ceilRT (256x512 RGBA16F mipped); PLUS lazy wallLerpRT + floorLerpRT ONLY when C02 is involved (keeps tLightB = tLeafCookie!)
  if (st.kind === 'lerp_cc' && _extGpuA && _extGpuB) {
    if (_wallFixRT) {
      if (hall.bakedWallMat?.uniforms?.tLightFix?.value === _wallFixRT.texture) {
        hall.bakedWallMat.uniforms.tLightFix.value = _sconceGpu?.walls || _phRgbmsqrt;
      }
      _wallFixRT.dispose();
      _wallFixRT = null;
      _lastWallFixKey = '';
    }
    const gA = _extGpuA.cfg.ext_gain ?? 1.0;
    const gB = _extGpuB.cfg.ext_gain ?? 1.0;
    const sMaxA = _extGpuA.cfg.ceil?.s_max ?? 8.0;
    const sMaxB = _extGpuB.cfg.ceil?.s_max ?? 8.0;
    const sMaxOut = Math.max(1.0, sMaxA * gA, sMaxB * gB);
    const szA = _extGpuA.cfg.ceil?.size || [256, 512];
    const szB = _extGpuB.cfg.ceil?.size || [256, 512];
    const wantHF = !!(_extGpuA.isHF && _extGpuB.isHF && probeHalfFloatMipSupport(r));
    const cKey = `cc|${wantHF ? 'hf' : '8'}|${_extGpuA.mode}|${_extGpuB.mode}|${Math.round(st.u * 1e5)}|${Math.round(gA * 1e5)}|${Math.round(gB * 1e5)}`;
    if (_ceilRT && _ceilRTIsHF !== wantHF) {
      if (hall.bakedCeilMat?.uniforms?.tLight?.value === _ceilRT.texture) {
        hall.bakedCeilMat.uniforms.tLight.value = _extGpuA.ceil || _phRgbmsqrt;
      }
      _ceilRT.dispose();
      _ceilRT = null;
      _ceilRTIsHF = false;
      _lastCeilKey = '';
    }
    if (!_ceilRT) {
      _ceilRT = wantHF ? makeHalfFloatMippedRT(256, 512, r) : makeCompositorRT(256, 512);
      _ceilRTIsHF = wantHF;
    }
    if (cKey !== _lastCeilKey) {
      _lastCeilKey = cKey;
      const cu = _compMat.uniforms;
      cu.uCompMode.value = 0.0;
      cu.uCompMix.value = st.u;
      cu.uCompLinA.value = _extGpuA.isHF ? 1.0 : 0.0;
      cu.uCompLinB.value = _extGpuB.isHF ? 1.0 : 0.0;
      cu.uCompOutLin.value = wantHF ? 1.0 : 0.0;
      cu.tSrcA.value = _extGpuA.ceil;
      cu.tSrcB.value = _extGpuB.ceil;
      cu.uSrcSizeA.value.set(szA[0], szA[1]);
      cu.uSrcSizeB.value.set(szB[0], szB[1]);
      cu.uCompSmaxA.value = sMaxA;
      cu.uCompSmaxB.value = sMaxB;
      cu.uCompSmaxOut.value = sMaxOut;
      cu.uCompGainA.value = gA;
      cu.uCompGainB.value = gB;
      renderCompositorToRT(r, _ceilRT);
      didRender = true;
    }
    hall.bakedCeilMat.uniforms.tLight.value = _ceilRT.texture;
    SHARED_OUTSIDE_UNIFORMS.uCeilLightSize.value.set(256, 512);
    SHARED_OUTSIDE_UNIFORMS.uSmaxCeil.value = sMaxOut;
    SHARED_OUTSIDE_UNIFORMS.uExtGainCeil.value = 1.0; // ext_gain already folded into ceilRT
    SHARED_OUTSIDE_UNIFORMS.uCeilEnc.value = wantHF ? 2.0 : 1.0;
    SHARED_OUTSIDE_UNIFORMS.uCeilFixWeight.value = 1.0;

    // 3b. C02 <-> C0x Lerp: pre-composite walls (512x512) & floor (256x512) into RGBA16F mipped RTs via Mode 0 so tLightB stays free for tLeafCookie!
    if (st.usesC02 && _leafCookieTex) {
      const sMaxWA = _extGpuA.cfg.walls?.s_max ?? 16.0;
      const sMaxWB = _extGpuB.cfg.walls?.s_max ?? 16.0;
      const sMaxWOut = Math.max(1.0, sMaxWA * gA, sMaxWB * gB);
      const wSzA = _extGpuA.cfg.walls?.size || [512, 512];
      const wSzB = _extGpuB.cfg.walls?.size || [512, 512];
      const wKey = `cc_w|${wantHF ? 'hf' : '8'}|${_extGpuA.mode}|${_extGpuB.mode}|${Math.round(st.u * 1e5)}|${Math.round(gA * 1e5)}|${Math.round(gB * 1e5)}`;
      if (_wallLerpRT && _wallLerpRTIsHF !== wantHF) {
        if (hall.bakedWallMat?.uniforms?.tLight?.value === _wallLerpRT.texture) {
          hall.bakedWallMat.uniforms.tLight.value = _extGpuA.walls || _phRgbmsqrt;
        }
        _wallLerpRT.dispose();
        _wallLerpRT = null;
        _wallLerpRTIsHF = false;
        _lastWallLerpKey = '';
      }
      if (!_wallLerpRT) {
        _wallLerpRT = wantHF ? makeHalfFloatMippedRT(512, 512, r) : makeCompositorRT(512, 512);
        _wallLerpRTIsHF = wantHF;
      }
      if (wKey !== _lastWallLerpKey) {
        _lastWallLerpKey = wKey;
        const cu = _compMat.uniforms;
        cu.uCompMode.value = 0.0;
        cu.uCompMix.value = st.u;
        cu.uCompLinA.value = _extGpuA.isHF ? 1.0 : 0.0;
        cu.uCompLinB.value = _extGpuB.isHF ? 1.0 : 0.0;
        cu.uCompOutLin.value = wantHF ? 1.0 : 0.0;
        cu.tSrcA.value = _extGpuA.walls;
        cu.tSrcB.value = _extGpuB.walls;
        cu.uSrcSizeA.value.set(wSzA[0], wSzA[1]);
        cu.uSrcSizeB.value.set(wSzB[0], wSzB[1]);
        cu.uCompSmaxA.value = sMaxWA;
        cu.uCompSmaxB.value = sMaxWB;
        cu.uCompSmaxOut.value = sMaxWOut;
        cu.uCompGainA.value = gA;
        cu.uCompGainB.value = gB;
        renderCompositorToRT(r, _wallLerpRT);
        didRender = true;
      }
      hall.bakedWallMat.uniforms.tLight.value = _wallLerpRT.texture;
      hall.bakedWallMat.uniforms.tLightB.value = _leafCookieTex;
      SHARED_OUTSIDE_UNIFORMS.uWallLightSizeA.value.set(512, 512);
      SHARED_OUTSIDE_UNIFORMS.uSmaxWallA.value = sMaxWOut;

      const sMaxFA = _extGpuA.cfg.floor?.s_max ?? 16.0;
      const sMaxFB = _extGpuB.cfg.floor?.s_max ?? 16.0;
      const sMaxFOut = Math.max(1.0, sMaxFA * gA, sMaxFB * gB);
      const fSzA = _extGpuA.cfg.floor?.size || [256, 512];
      const fSzB = _extGpuB.cfg.floor?.size || [256, 512];
      const fKey = `cc_f|${wantHF ? 'hf' : '8'}|${_extGpuA.mode}|${_extGpuB.mode}|${Math.round(st.u * 1e5)}|${Math.round(gA * 1e5)}|${Math.round(gB * 1e5)}`;
      if (_floorLerpRT && _floorLerpRTIsHF !== wantHF) {
        if (hall.bakedFloorMat?.uniforms?.tLight?.value === _floorLerpRT.texture) {
          hall.bakedFloorMat.uniforms.tLight.value = _extGpuA.floor || _phRgbmsqrt;
        }
        _floorLerpRT.dispose();
        _floorLerpRT = null;
        _floorLerpRTIsHF = false;
        _lastFloorLerpKey = '';
      }
      if (!_floorLerpRT) {
        _floorLerpRT = wantHF ? makeHalfFloatMippedRT(256, 512, r) : makeCompositorRT(256, 512);
        _floorLerpRTIsHF = wantHF;
      }
      if (fKey !== _lastFloorLerpKey) {
        _lastFloorLerpKey = fKey;
        const cu = _compMat.uniforms;
        cu.uCompMode.value = 0.0;
        cu.uCompMix.value = st.u;
        cu.uCompLinA.value = _extGpuA.isHF ? 1.0 : 0.0;
        cu.uCompLinB.value = _extGpuB.isHF ? 1.0 : 0.0;
        cu.uCompOutLin.value = wantHF ? 1.0 : 0.0;
        cu.tSrcA.value = _extGpuA.floor;
        cu.tSrcB.value = _extGpuB.floor;
        cu.uSrcSizeA.value.set(fSzA[0], fSzA[1]);
        cu.uSrcSizeB.value.set(fSzB[0], fSzB[1]);
        cu.uCompSmaxA.value = sMaxFA;
        cu.uCompSmaxB.value = sMaxFB;
        cu.uCompSmaxOut.value = sMaxFOut;
        cu.uCompGainA.value = gA;
        cu.uCompGainB.value = gB;
        renderCompositorToRT(r, _floorLerpRT);
        didRender = true;
      }
      hall.bakedFloorMat.uniforms.tLight.value = _floorLerpRT.texture;
      hall.bakedFloorMat.uniforms.tLightB.value = _leafCookieTex;
      SHARED_OUTSIDE_UNIFORMS.uFloorLightSizeA.value.set(256, 512);
      SHARED_OUTSIDE_UNIFORMS.uSmaxFloorA.value = sMaxFOut;

      // ext_gain already folded into wallLerpRT & floorLerpRT; uLightMix = 0 so tLightB is NEVER decoded as irradiance!
      SHARED_OUTSIDE_UNIFORMS.uExtGainA.value = 1.0;
      SHARED_OUTSIDE_UNIFORMS.uLightEncA.value = wantHF ? 2.0 : 1.0;
      SHARED_OUTSIDE_UNIFORMS.uLightMix.value = 0.0;
    } else if (_wallLerpRT || _floorLerpRT) {
      disposeC02LerpRTs(hall);
    }

    if (didRender) hall.reflDirty = true;
    return;
  }

  // 4. V9 <-> C0x Lerp: compact RGBA8 ceilRT (256x512 = 0.50 MiB) + wallFixRT (512x512 = 1.00 MiB)
  if (st.kind === 'lerp_vc' && _extGpuA && _sconceGpu && !pk._v9Evicted) {
    const cycT = st.u;
    const ambG = U?.uAmbientGain?.value ?? 0.39;
    const spotG = U?.uSpotGain?.value ?? 1.05;
    const scG = U?.uSconceGain?.value ?? 2.15;
    const warm = U?.uLightWarmth?.value ?? 1.0;
    const wWhite = U?.uWallWhite?.value ?? 1.28;
    const hasFix = pk.hasFixMaps ? 1.0 : 0.0;
    const v9Sliders = `${Math.round(ambG * 1e4)}|${Math.round(spotG * 1e4)}|${Math.round(scG * 1e4)}|${Math.round(warm * 1e4)}|${Math.round(wWhite * 1e4)}|${Math.round(bakeExp * 1e4)}|${Math.round(outStr * 1e4)}`;

    // 4a. ceilRT (full V9 ceil radiance <-> C0x ceil total radiance, compact RGBA8!)
    const ceilSzC = _extGpuA.cfg.ceil?.size || [256, 512];
    const ceilSzSc = _sconceGpu.cfg.ceil?.size || [128, 512];
    const gCeilExt = (_extGpuA.cfg.ext_gain ?? 1.0) * outStr * bakeExp;
    const sMaxCeilC = _extGpuA.cfg.ceil?.s_max ?? 8.0;
    const sMaxCeilSc = _sconceGpu.cfg.ceil?.s_max ?? 6.0;
    const sMaxCeilOut = Math.max(8.0, sMaxCeilC * gCeilExt + sMaxCeilSc * scGain);
    const cKey = `vc_c|${_extGpuA.mode}|${Math.round(cycT * 1e5)}|${v9Sliders}|${Math.round(scGain * 1e4)}|${Math.round(cCorr.x * 1e3)},${Math.round(cAlc.x * 1e3)}`;
    if (_ceilRT && _ceilRTIsHF) {
      if (hall.bakedCeilMat?.uniforms?.tLight?.value === _ceilRT.texture) {
        hall.bakedCeilMat.uniforms.tLight.value = pk.tCeil || _phRgbmsqrt;
      }
      _ceilRT.dispose();
      _ceilRT = null;
      _ceilRTIsHF = false;
      _lastCeilKey = '';
    }
    if (!_ceilRT) { _ceilRT = makeCompositorRT(256, 512); _ceilRTIsHF = false; }
    if (cKey !== _lastCeilKey) {
      _lastCeilKey = cKey;
      const cu = _compMat.uniforms;
      cu.uCompMode.value = 1.0;
      cu.uCompMix.value = cycT;
      cu.uCompLinA.value = 0.0;
      cu.uCompLinB.value = 0.0;
      cu.uCompOutLin.value = 0.0;
      cu.tSrcA.value = pk.tCeil;
      cu.tSrcB.value = pk.tCeilF;
      cu.tSrcC.value = _extGpuA.ceil;
      cu.tSrcD.value = _sconceGpu.ceil;
      cu.uSrcSizeC.value.set(ceilSzC[0], ceilSzC[1]);
      cu.uSrcSizeD.value.set(ceilSzSc[0], ceilSzSc[1]);
      cu.uCompSmaxC.value = sMaxCeilC;
      cu.uCompSmaxD.value = sMaxCeilSc;
      cu.uCompSmaxOut.value = sMaxCeilOut;
      cu.uCompGainC.value = gCeilExt;
      cu.uCompGainD.value = scGain;
      cu.uCompTintCorr.value.copy(cCorr);
      cu.uCompTintAlc.value.copy(cAlc);
      cu.uCompTinAlb.value.copy(tinAlb);
      if (U?.uCeilRect) cu.uCompCeilRect.value.copy(U.uCeilRect.value);
      cu.uV9Scale.value = hall.bakedCeilMat.uniforms.uScale.value;
      cu.uV9FixScale.value = hall.bakedCeilMat.uniforms.uFixScale.value;
      cu.uV9BakeExp.value = bakeExp;
      cu.uV9AmbGain.value = ambG;
      cu.uV9SpotGain.value = spotG;
      cu.uV9SconceGain.value = scG;
      cu.uV9Warmth.value = warm;
      cu.uV9WallWhite.value = wWhite;
      cu.uV9HasFix.value = hasFix;
      renderCompositorToRT(r, _ceilRT);
      didRender = true;
    }
    hall.bakedCeilMat.uniforms.tLight.value = _ceilRT.texture;
    SHARED_OUTSIDE_UNIFORMS.uCeilLightSize.value.set(256, 512);
    SHARED_OUTSIDE_UNIFORMS.uSmaxCeil.value = sMaxCeilOut;
    SHARED_OUTSIDE_UNIFORMS.uCeilEnc.value = 1.0;
    SHARED_OUTSIDE_UNIFORMS.uCeilFixWeight.value = 0.0;

    // 4b. wallFixRT (V9 wall fix RGB <-> B_sconce corridor-tinted RGB; H1 alcove ramp runs in bakedWallMat!)
    const wSzSc = _sconceGpu.cfg.walls?.size || [512, 512];
    const sMaxWSc = _sconceGpu.cfg.walls?.s_max ?? 6.0;
    const sMaxWFOut = Math.max(12.0, sMaxWSc * scGain * 1.5);
    const wfKey = `vc_w|${_extGpuA.mode}|${Math.round(cycT * 1e5)}|${v9Sliders}|${Math.round(scGain * 1e4)}|${Math.round(cCorr.x * 1e4)},${Math.round(cCorr.y * 1e4)},${Math.round(cCorr.z * 1e4)}`;
    if (!_wallFixRT) _wallFixRT = makeCompositorRT(512, 512);
    if (wfKey !== _lastWallFixKey) {
      _lastWallFixKey = wfKey;
      const cu = _compMat.uniforms;
      cu.uCompMode.value = 2.0;
      cu.uCompMix.value = cycT;
      cu.uCompLinA.value = 0.0;
      cu.uCompLinB.value = 0.0;
      cu.uCompOutLin.value = 0.0;
      cu.tSrcA.value = pk.tWallsF;
      cu.tSrcB.value = _sconceGpu.walls;
      cu.uSrcSizeB.value.set(wSzSc[0], wSzSc[1]);
      cu.uCompSmaxB.value = sMaxWSc;
      cu.uCompSmaxOut.value = sMaxWFOut;
      cu.uCompGainB.value = scGain;
      cu.uCompTintCorr.value.copy(cCorr);
      cu.uV9FixScale.value = hall.bakedWallMat.uniforms.uFixScale.value;
      cu.uV9BakeExp.value = bakeExp;
      cu.uV9SpotGain.value = spotG;
      cu.uV9SconceGain.value = scG;
      cu.uV9Warmth.value = warm;
      cu.uV9HasFix.value = hasFix;
      renderCompositorToRT(r, _wallFixRT);
      didRender = true;
    }
    hall.bakedWallMat.uniforms.tLightFix.value = _wallFixRT.texture;
    SHARED_OUTSIDE_UNIFORMS.uLightFixSize.value.set(512, 512);
    SHARED_OUTSIDE_UNIFORMS.uSmaxWallFix.value = sMaxWFOut;
    SHARED_OUTSIDE_UNIFORMS.uFixEnc.value = 2.0;
    if (didRender) hall.reflDirty = true;
  }
}

// ---------------------------------------------------------------------------
// 6. Cycles State Binding, Mode Switching, Lerp & Full GPU Cleanup
// ---------------------------------------------------------------------------
function applyCfgLookUniforms(cfgA, cfgB = null, t = 0.0) {
  const lerpNum = (a, b, def) => {
    const va = a !== undefined ? +a : def;
    const vb = (cfgB && b !== undefined) ? +b : va;
    return va + (vb - va) * t;
  };
  const lerpVec3 = (dst, a, b, def) => {
    const va = Array.isArray(a) ? a : def;
    const vb = (cfgB && Array.isArray(b)) ? b : va;
    dst.set(
      va[0] + (vb[0] - va[0]) * t,
      va[1] + (vb[1] - va[1]) * t,
      va[2] + (vb[2] - va[2]) * t
    );
  };
  const U = SHARED_OUTSIDE_UNIFORMS;
  U.uTmAgxHybrid.value      = lerpNum(cfgA?.agx_hybrid, cfgB?.agx_hybrid, 0.45);
  U.uTmAgxPow.value         = lerpNum(cfgA?.agx_pow, cfgB?.agx_pow, 1.22);
  U.uTmAgxSat.value         = lerpNum(cfgA?.agx_sat, cfgB?.agx_sat, 1.28);
  U.uTmOutExposure.value    = lerpNum(cfgA?.exposure, cfgB?.exposure, 1.00);
  U.uTmContrast.value       = lerpNum(cfgA?.tm_contrast, cfgB?.tm_contrast, 1.00);
  U.uSconceCyclesGain.value = lerpNum(cfgA?.sconce_gain, cfgB?.sconce_gain, 1.00);
  U.uTrimProbeBlend.value   = lerpNum(cfgA?.trim_probe_blend, cfgB?.trim_probe_blend, 0.35);
  lerpVec3(U.uTmShadowToe.value,     cfgA?.shadow_toe,       cfgB?.shadow_toe,       [0.0, 0.0, 0.0]);
  lerpVec3(U.uSconceColorCorr.value, cfgA?.sconce_tint_corr, cfgB?.sconce_tint_corr, [1.0, 0.84, 0.62]);
  lerpVec3(U.uSconceColorAlc.value,  cfgA?.sconce_tint_alc,  cfgB?.sconce_tint_alc,  [1.0, 0.84, 0.62]);
  lerpVec3(U.uWallAlbedoPhys.value,  cfgA?.wall_albedo,      cfgB?.wall_albedo,      [0.80, 0.78, 0.75]);
  lerpVec3(U.uTinAlbedoPhys.value,   cfgA?.tin_albedo,       cfgB?.tin_albedo,       [0.54, 0.52, 0.48]);
}

function bindSettledV9(hall, renderer, releaseCycles = true) {
  _cyclesActiveState = { kind: 'v9', modeA: 'v9', modeB: null, u: 0.0 };
  setCyclesMix(0.0);
  const U = SHARED_OUTSIDE_UNIFORMS;
  U.uTmShadowToe.value.set(0, 0, 0);
  U.uTmContrast.value = 1.00;
  U.uReflBlurred.value = 0.0;
  U.uInReflPass.value = 0.0;
  U.uLightMix.value = 0.0;
  U.uLightEncA.value = 0.0;
  U.uLightEncB.value = 0.0;
  U.uFixEnc.value = 0.0;
  U.uCeilEnc.value = 0.0;
  U.uCeilFixEnc.value = 0.0;
  U.uCeilFixWeight.value = 1.0;
  U.uFloorFixEncA.value = 0.0;
  U.uFloorFixEncB.value = 0.0;
  U.uFloorFixMix.value = 0.0;
  U.uTrimRadMix.value = 0.0;
  U.uTrimExtMix.value = 0.0;
  U.uWallLightSizeA.value.set(2048, 2048);
  U.uWallLightSizeB.value.set(2048, 2048);
  U.uLightFixSize.value.set(1024, 1024);
  U.uCeilLightSize.value.set(1024, 2048);
  U.uCeilFixSize.value.set(512, 1024);
  U.uFloorLightSizeA.value.set(1024, 2048);
  U.uFloorLightSizeB.value.set(1024, 2048);
  U.uFloorFixSizeA.value.set(512, 1024);
  U.uFloorFixSizeB.value.set(512, 1024);
  U.uExtGainA.value = 1.0;
  U.uExtGainB.value = 1.0;
  U.uExtGainCeil.value = 1.0;

  // B1 Demote/Dispose-Before-Restore: release ALL Cycles RTs, blur targets, leaf cookie & rough mips BEFORE restoreV9Lightmaps (+40 MiB)!
  _skyPlatesWantMips = false;
  releaseLeafCookieGpu(hall);
  unbindHallLightmapsToDummy(hall);
  clearCompositorSourceRefs();
  hall?.setCyclesAntiTwitchExtras?.(false);
  disposeTransitionRTs(hall);
  disposeProbeRT();

  if (releaseCycles) {
    if (hall) {
      detachTrimAttribute(hall, 'aRadExtA');
      detachTrimAttribute(hall, 'aRadExtB');
      detachTrimAttribute(hall, 'aRadSconce');
    }
    disposeBasisGpu(_extGpuA); _extGpuA = null;
    disposeBasisGpu(_extGpuB); _extGpuB = null;
    disposeBasisGpu(_sconceGpu); _sconceGpu = null;
  }

  if (hall?.bakedPack) {
    restoreV9Lightmaps(hall, renderer);
    const pk = hall.bakedPack;
    if (hall.bakedWallMat) {
      hall.bakedWallMat.uniforms.tLight.value = pk.tWalls;
      hall.bakedWallMat.uniforms.tLightB.value = _phRgbmsqrt;
      hall.bakedWallMat.uniforms.tLightFix.value = pk.tWallsF;
    }
    if (hall.bakedCeilMat) {
      hall.bakedCeilMat.uniforms.tLight.value = pk.tCeil;
      hall.bakedCeilMat.uniforms.tLightFix.value = pk.tCeilF;
    }
    if (hall.bakedFloorMat) {
      hall.bakedFloorMat.uniforms.tLight.value = pk.tFloor;
      hall.bakedFloorMat.uniforms.tLightB.value = _phRgbmsqrt;
      hall.bakedFloorMat.uniforms.tLightFix.value = pk.tFloorF;
      hall.bakedFloorMat.uniforms.tLightFixB.value = _phRgbmsqrt;
    }
  }
}

async function syncOutsideCyclesState(modeA, modeB, u, hall, renderer) {
  if (hall) _lastHallRef = hall;
  const h = hall || _lastHallRef;
  const r = renderer || h?.renderer || null;
  const seq = ++_syncSeq;
  const t = Math.max(0, Math.min(1, +u || 0));

  // Normalize settled endpoints:
  let effA = modeA || 'v9';
  let effB = (modeB && modeB !== effA) ? modeB : null;
  let effU = t;
  if (effB) {
    if (effU <= 0.0005) { effB = null; effU = 0.0; }
    else if (effU >= 0.9995) { effA = effB; effB = null; effU = 0.0; }
  }

  // Case A: Settled V9 -> 0 network fetches, 0 B extra VRAM, bit-exact V9!
  if (effA === 'v9' && !effB) {
    bindSettledV9(h, r, true);
    h?.markReflDirty?.();
    return;
  }

  // If hall isn't using baked geometry, skip Cycles lightmap binding gracefully:
  if (!h?.isUsingBaked || !h.bakedPack || !h.bakedWallMat || !h.bakedCeilMat || !h.bakedFloorMat) {
    setCyclesMix(0.0);
    return;
  }

  const meta = await fetchOutsideMeta();
  if (seq !== _syncSeq) return;
  if (!meta || !meta.bases || !meta.bases.sconce) {
    // Pre-bake graceful fallback: preserve V9 lightmaps cleanly, zero errors!
    bindSettledV9(h, r, false);
    return;
  }

  // Canonicalize V9 <-> C0x lerp so cycMode is slot A (trim/ext) and cycT in (0, 1) goes 0=V9 -> 1=C0x:
  const isVC = (effA === 'v9' || effB === 'v9');
  const cycModeA = isVC ? (effA === 'v9' ? effB : effA) : effA;
  const cycModeB = isVC ? null : effB;
  const cycT = isVC ? (effA === 'v9' ? effU : (1.0 - effU)) : effU;

  if (!meta.bases[cycModeA] || (cycModeB && !meta.bases[cycModeB])) {
    bindSettledV9(h, r, false);
    return;
  }

  // Fetch required CPU sources in parallel (also pull cached CPU sources for HF->RGBA8 demotion on lerp_vc with 0 fetches!):
  const usesC02 = !isVC && (cycModeA === 'c02' || cycModeB === 'c02');
  const needLeafCpu = usesC02 && !_leafCookieTex;
  const needScCpu = !_sconceGpu || (isVC && _sconceGpu.isHF);
  const needACpu = (_extGpuA?.mode !== cycModeA && _extGpuB?.mode !== cycModeA)
                || (isVC && ((_extGpuA?.mode === cycModeA && _extGpuA.isHF)
                          || (_extGpuB?.mode === cycModeA && _extGpuB.isHF)));
  const needBCpu = !!(cycModeB && _extGpuB?.mode !== cycModeB && _extGpuA?.mode !== cycModeB);
  const [scCpu, aCpu, bCpu, leafCpu] = await Promise.all([
    needScCpu   ? loadBasisCpu('sconce', meta) : Promise.resolve(null),
    needACpu    ? loadBasisCpu(cycModeA, meta) : Promise.resolve(null),
    needBCpu    ? loadBasisCpu(cycModeB, meta) : Promise.resolve(null),
    needLeafCpu ? loadLeafCookieCpu()          : Promise.resolve(null),
  ]);
  if (seq !== _syncSeq) return;

  // Verify every needed basis succeeded:
  if ((!_sconceGpu && !scCpu) ||
      (_extGpuA?.mode !== cycModeA && _extGpuB?.mode !== cycModeA && !aCpu) ||
      (cycModeB && _extGpuB?.mode !== cycModeB && _extGpuA?.mode !== cycModeB && !bCpu)) {
    bindSettledV9(h, r, false);
    return;
  }

  // Upload shared B_sconce once (initially compact RGBA8 -> <= 145 MiB even before V9 eviction!):
  if (!_sconceGpu && scCpu) {
    _sconceGpu = uploadBasisGpu(scCpu, r);
    if (_sconceGpu?.trimBytes) {
      attachTrimAttribute(h, 'aRadSconce', _sconceGpu.trimBytes, meta.trim_vertex_order);
    }
  }

  // O(1) GPU slot management for _extGpuA & _extGpuB (defer disposal until AFTER rebinding!):
  const toDispose = [];
  let nextA = null;
  let nextB = null;
  if (_extGpuA?.mode === cycModeA) {
    nextA = _extGpuA;
  } else if (_extGpuB?.mode === cycModeA) {
    nextA = _extGpuB; // O(1) handoff!
  } else {
    nextA = uploadBasisGpu(aCpu, r);
  }

  if (cycModeB) {
    if (_extGpuB?.mode === cycModeB) {
      nextB = _extGpuB;
    } else if (_extGpuA?.mode === cycModeB) {
      nextB = _extGpuA;
    } else {
      nextB = uploadBasisGpu(bCpu, r);
    }
  }

  if (_extGpuA && _extGpuA !== nextA && _extGpuA !== nextB) toDispose.push(_extGpuA);
  if (_extGpuB && _extGpuB !== nextA && _extGpuB !== nextB) toDispose.push(_extGpuB);
  const aChanged = (_extGpuA !== nextA);
  const bChanged = (_extGpuB !== nextB);
  _extGpuA = nextA;
  _extGpuB = nextB;

  // Attach/update trim VBOs (in-place update when attribute already exists!):
  if (aChanged && _extGpuA?.trimBytes) {
    attachTrimAttribute(h, 'aRadExtA', _extGpuA.trimBytes, meta.trim_vertex_order);
  }
  if (cycModeB) {
    if (bChanged && _extGpuB?.trimBytes) {
      attachTrimAttribute(h, 'aRadExtB', _extGpuB.trimBytes, meta.trim_vertex_order);
    }
  } else {
    detachTrimAttribute(h, 'aRadExtB');
  }

  const U = SHARED_OUTSIDE_UNIFORMS;
  const scCfg = _sconceGpu.cfg;
  const cfgA = _extGpuA.cfg;
  const cfgB = _extGpuB?.cfg || null;
  const pk = h.bakedPack;

  U.uSmaxTrimA.value  = cfgA.trim?.s_max ?? 16.0;
  U.uSmaxTrimB.value  = cfgB?.trim?.s_max ?? 16.0;
  U.uSmaxTrimSc.value = scCfg.trim?.s_max ?? 6.0;

  if (isVC) {
    // ---- V9 <-> C0x Lerp (B1 Demote/Dispose-Before-Restore -> <= 143.71 MiB peak!) ----
    setSkyPlateMips(false, r);
    releaseLeafCookieGpu(h);
    disposeC02LerpRTs(h);
    unbindHallLightmapsToDummy(h);
    clearCompositorSourceRefs();
    h.setCyclesAntiTwitchExtras?.(false);
    if (_ceilRT && _ceilRTIsHF) {
      _ceilRT.dispose();
      _ceilRT = null;
      _ceilRTIsHF = false;
      _lastCeilKey = '';
    }
    for (const old of toDispose) disposeBasisGpu(old);
    toDispose.length = 0;
    if (_sconceGpu.isHF && scCpu) demoteBasisGpuToCompact(_sconceGpu, scCpu, r);
    if (_extGpuA.isHF && aCpu)    demoteBasisGpuToCompact(_extGpuA, aCpu, r);

    restoreV9Lightmaps(h, r);
    _cyclesActiveState = { kind: 'lerp_vc', modeA: 'v9', modeB: cycModeA, u: cycT };
    applyCfgLookUniforms(cfgA, null, 0.0);
    setCyclesMix(cycT);

    // Walls: slot A = V9, slot B = C0x compact RGBA8, tLightFix = wallFixRT (updated in updateOutsideCompositor)
    h.bakedWallMat.uniforms.tLight.value = pk.tWalls;
    h.bakedWallMat.uniforms.tLightB.value = _extGpuA.walls;
    U.uLightEncA.value = 0.0;
    U.uLightEncB.value = 1.0;
    U.uLightMix.value = cycT;
    U.uWallLightSizeA.value.set(2048, 2048);
    U.uWallLightSizeB.value.set(cfgA.walls.size[0], cfgA.walls.size[1]);
    U.uSmaxWallB.value = cfgA.walls.s_max ?? 16.0;
    U.uExtGainA.value = 1.0;
    U.uExtGainB.value = cfgA.ext_gain ?? 1.0;

    // Ceiling: ceilRT composites full V9<->C0x radiance in updateOutsideCompositor
    h.bakedCeilMat.uniforms.tLightFix.value = pk.tCeilF;
    U.uCeilFixEnc.value = 0.0;
    U.uCeilFixWeight.value = 0.0;

    // Floor: 0 RT! Dual samplers tLight/tLightB + tLightFix/tLightFixB
    h.bakedFloorMat.uniforms.tLight.value = pk.tFloor;
    h.bakedFloorMat.uniforms.tLightB.value = _extGpuA.floor;
    h.bakedFloorMat.uniforms.tLightFix.value = pk.tFloorF;
    h.bakedFloorMat.uniforms.tLightFixB.value = _sconceGpu.floor;
    U.uFloorLightSizeA.value.set(1024, 2048);
    U.uFloorLightSizeB.value.set(cfgA.floor.size[0], cfgA.floor.size[1]);
    U.uFloorFixSizeA.value.set(512, 1024);
    U.uFloorFixSizeB.value.set(scCfg.floor.size[0], scCfg.floor.size[1]);
    U.uSmaxFloorB.value = cfgA.floor.s_max ?? 16.0;
    U.uSmaxFloorFixB.value = scCfg.floor.s_max ?? 6.0;
    U.uFloorFixEncA.value = 0.0;
    U.uFloorFixEncB.value = 1.0;
    U.uFloorFixMix.value = cycT;

    // Trim: blend V9 -> C0x
    U.uTrimRadMix.value = cycT;
    U.uTrimExtMix.value = 0.0;
    markOutsideCompositorDirty();
  } else if (cycModeB) {
    // ---- C0x <-> C0y Lerp (B1 Evict-Before-Promote -> RGBA16F mipped + reflBlurH/V, <= 122.90 MiB w/ C02 leaf cookie!) ----
    applyCfgLookUniforms(cfgA, cfgB, cycT);
    setCyclesMix(1.0);

    // 1. Bind currently resident Cycles textures everywhere BEFORE evicting V9 (-40 MiB):
    h.bakedWallMat.uniforms.tLight.value = _extGpuA.walls;
    h.bakedWallMat.uniforms.tLightB.value = _extGpuB.walls;
    h.bakedWallMat.uniforms.tLightFix.value = _sconceGpu.walls;
    h.bakedCeilMat.uniforms.tLight.value = _extGpuA.ceil;
    h.bakedCeilMat.uniforms.tLightFix.value = _sconceGpu.ceil;
    h.bakedFloorMat.uniforms.tLight.value = _extGpuA.floor;
    h.bakedFloorMat.uniforms.tLightB.value = _extGpuB.floor;
    h.bakedFloorMat.uniforms.tLightFix.value = _sconceGpu.floor;
    h.bakedFloorMat.uniforms.tLightFixB.value = _phRgbmsqrt;
    for (const old of toDispose) disposeBasisGpu(old);
    toDispose.length = 0;
    evictV9Lightmaps(h);
    setSkyPlateMips(true, r);

    // 2. NOW that V9 (-40 MiB) is evicted, promote compact RGBA8 slots in-place to RGBA16F mipped + enable anti-twitch extras!
    if (r && probeHalfFloatMipSupport(r)) {
      if (!_sconceGpu.isHF || !_extGpuA.isHF || !_extGpuB.isHF) {
        unbindHallLightmapsToDummy(h);
        if (!_sconceGpu.isHF) promoteBasisGpuInPlace(_sconceGpu, r);
        if (!_extGpuA.isHF)   promoteBasisGpuInPlace(_extGpuA, r);
        if (!_extGpuB.isHF)   promoteBasisGpuInPlace(_extGpuB, r);
      }
      h.setCyclesAntiTwitchExtras?.(true);
    }

    // 3. Evict-Before-Promote C02 leaf cookie ONLY when C02 participates; dispose immediately when leaving C02!
    let activeLeafTex = null;
    if (usesC02) {
      activeLeafTex = ensureLeafCookieGpu(leafCpu || _leafCookieCpuImg, r);
      if (activeLeafTex) {
        U.tLeafCookie.value = activeLeafTex;
        U.uLeafCookieReady.value = 1.0;
      } else {
        releaseLeafCookieGpu(h);
        disposeC02LerpRTs(h);
      }
    } else {
      releaseLeafCookieGpu(h);
      disposeC02LerpRTs(h);
    }

    _cyclesActiveState = { kind: 'lerp_cc', modeA: cycModeA, modeB: cycModeB, u: cycT, usesC02: !!activeLeafTex };

    const encA = _extGpuA.isHF ? 2.0 : 1.0;
    const encB = _extGpuB.isHF ? 2.0 : 1.0;
    const encSc = _sconceGpu.isHF ? 2.0 : 1.0;

    // Walls (when activeLeafTex is bound on tLightB, updateOutsideCompositor binds wallLerpRT to tLight with uLightMix = 0!)
    h.bakedWallMat.uniforms.tLight.value = _extGpuA.walls;
    h.bakedWallMat.uniforms.tLightB.value = activeLeafTex || _extGpuB.walls;
    h.bakedWallMat.uniforms.tLightFix.value = _sconceGpu.walls;
    U.uLightEncA.value = encA;
    U.uLightEncB.value = encB;
    U.uFixEnc.value = _sconceGpu.isHF ? 3.0 : 1.0;
    U.uLightMix.value = activeLeafTex ? 0.0 : cycT;
    U.uWallLightSizeA.value.set(cfgA.walls.size[0], cfgA.walls.size[1]);
    U.uWallLightSizeB.value.set(cfgB.walls.size[0], cfgB.walls.size[1]);
    U.uLightFixSize.value.set(scCfg.walls.size[0], scCfg.walls.size[1]);
    U.uSmaxWallA.value = cfgA.walls.s_max ?? 16.0;
    U.uSmaxWallB.value = cfgB.walls.s_max ?? 16.0;
    U.uSmaxWallFix.value = scCfg.walls.s_max ?? 6.0;
    U.uExtGainA.value = cfgA.ext_gain ?? 1.0;
    U.uExtGainB.value = cfgB.ext_gain ?? 1.0;

    // Ceiling (ceilRT replaces tLight in updateOutsideCompositor)
    h.bakedCeilMat.uniforms.tLight.value = _extGpuA.ceil;
    h.bakedCeilMat.uniforms.tLightFix.value = _sconceGpu.ceil;
    U.uCeilFixSize.value.set(scCfg.ceil.size[0], scCfg.ceil.size[1]);
    U.uSmaxCeilFix.value = scCfg.ceil.s_max ?? 6.0;
    U.uCeilEnc.value = encA;
    U.uCeilFixEnc.value = encSc;
    U.uCeilFixWeight.value = 1.0;

    // Floor (when activeLeafTex is bound on tLightB, updateOutsideCompositor binds floorLerpRT to tLight with uLightMix = 0!)
    h.bakedFloorMat.uniforms.tLight.value = _extGpuA.floor;
    h.bakedFloorMat.uniforms.tLightB.value = activeLeafTex || _extGpuB.floor;
    h.bakedFloorMat.uniforms.tLightFix.value = _sconceGpu.floor;
    h.bakedFloorMat.uniforms.tLightFixB.value = _phRgbmsqrt;
    U.uFloorLightSizeA.value.set(cfgA.floor.size[0], cfgA.floor.size[1]);
    U.uFloorLightSizeB.value.set(cfgB.floor.size[0], cfgB.floor.size[1]);
    U.uFloorFixSizeA.value.set(scCfg.floor.size[0], scCfg.floor.size[1]);
    U.uSmaxFloorA.value = cfgA.floor.s_max ?? 16.0;
    U.uSmaxFloorB.value = cfgB.floor.s_max ?? 16.0;
    U.uSmaxFloorFixA.value = scCfg.floor.s_max ?? 6.0;
    U.uFloorFixEncA.value = encSc;
    U.uFloorFixEncB.value = encSc;
    U.uFloorFixMix.value = 0.0;

    // Trim: blend aRadExtA -> aRadExtB
    U.uTrimRadMix.value = 1.0;
    U.uTrimExtMix.value = cycT;
    markOutsideCompositorDirty();
  } else {
    // ---- Settled C0x (B1 Evict-Before-Promote -> 0 Transition RTs, RGBA16F mipped + reflBlurH/V, 108.7 / 110.1 MiB!) ----
    _cyclesActiveState = { kind: 'settled', modeA: cycModeA, modeB: null, u: 0.0, usesC02: false };
    applyCfgLookUniforms(cfgA, null, 0.0);
    setCyclesMix(1.0);

    // 1. Bind currently resident Cycles textures everywhere, dispose old slots/RTs, and evict V9 (-40 MiB) FIRST!
    h.bakedWallMat.uniforms.tLight.value = _extGpuA.walls;
    h.bakedWallMat.uniforms.tLightB.value = _phRgbmsqrt;
    h.bakedWallMat.uniforms.tLightFix.value = _sconceGpu.walls;
    h.bakedCeilMat.uniforms.tLight.value = _extGpuA.ceil;
    h.bakedCeilMat.uniforms.tLightFix.value = _sconceGpu.ceil;
    h.bakedFloorMat.uniforms.tLight.value = _extGpuA.floor;
    h.bakedFloorMat.uniforms.tLightB.value = _phRgbmsqrt;
    h.bakedFloorMat.uniforms.tLightFix.value = _sconceGpu.floor;
    h.bakedFloorMat.uniforms.tLightFixB.value = _phRgbmsqrt;
    disposeTransitionRTs(h);
    for (const old of toDispose) disposeBasisGpu(old);
    toDispose.length = 0;
    evictV9Lightmaps(h);
    setSkyPlateMips(true, r);

    // 2. NOW promote compact RGBA8 slots in-place to RGBA16F mipped + enable tStripRgh mips & reflBlurH/V!
    if (r && probeHalfFloatMipSupport(r)) {
      if (!_sconceGpu.isHF || !_extGpuA.isHF) {
        unbindHallLightmapsToDummy(h);
        if (!_sconceGpu.isHF) promoteBasisGpuInPlace(_sconceGpu, r);
        if (!_extGpuA.isHF)   promoteBasisGpuInPlace(_extGpuA, r);
      }
      h.setCyclesAntiTwitchExtras?.(true);
    }

    // 3. Evict-Before-Promote C02 leaf cookie strictly AFTER V9 eviction (+1.33 MiB -> 110.06 MiB); release on C03/C04/C05!
    let settledLeafTex = null;
    if (usesC02) {
      settledLeafTex = ensureLeafCookieGpu(leafCpu || _leafCookieCpuImg, r);
      if (settledLeafTex) {
        U.tLeafCookie.value = settledLeafTex;
        U.uLeafCookieReady.value = 1.0;
      } else {
        releaseLeafCookieGpu(h);
      }
    } else {
      releaseLeafCookieGpu(h);
    }

    const encA = _extGpuA.isHF ? 2.0 : 1.0;
    const encSc = _sconceGpu.isHF ? 2.0 : 1.0;

    // Walls (uLightMix === 0 -> tLightB holds tLeafCookie on C02 with +0 samplers!)
    h.bakedWallMat.uniforms.tLight.value = _extGpuA.walls;
    h.bakedWallMat.uniforms.tLightB.value = settledLeafTex || _phRgbmsqrt;
    h.bakedWallMat.uniforms.tLightFix.value = _sconceGpu.walls;
    U.uLightEncA.value = encA;
    U.uLightEncB.value = 0.0;
    U.uFixEnc.value = _sconceGpu.isHF ? 3.0 : 1.0;
    U.uLightMix.value = 0.0;
    U.uWallLightSizeA.value.set(cfgA.walls.size[0], cfgA.walls.size[1]);
    U.uLightFixSize.value.set(scCfg.walls.size[0], scCfg.walls.size[1]);
    U.uSmaxWallA.value = cfgA.walls.s_max ?? 16.0;
    U.uSmaxWallFix.value = scCfg.walls.s_max ?? 6.0;
    U.uExtGainA.value = cfgA.ext_gain ?? 1.0;
    U.uExtGainB.value = 1.0;

    // Ceiling (direct bind, 0 RT!)
    h.bakedCeilMat.uniforms.tLight.value = _extGpuA.ceil;
    h.bakedCeilMat.uniforms.tLightFix.value = _sconceGpu.ceil;
    U.uCeilLightSize.value.set(cfgA.ceil.size[0], cfgA.ceil.size[1]);
    U.uCeilFixSize.value.set(scCfg.ceil.size[0], scCfg.ceil.size[1]);
    U.uSmaxCeil.value = cfgA.ceil.s_max ?? 8.0;
    U.uSmaxCeilFix.value = scCfg.ceil.s_max ?? 6.0;
    U.uExtGainCeil.value = cfgA.ext_gain ?? 1.0;
    U.uCeilEnc.value = encA;
    U.uCeilFixEnc.value = encSc;
    U.uCeilFixWeight.value = 1.0;

    // Floor (uLightMix === 0 -> tLightB holds tLeafCookie on C02 with +0 samplers!)
    h.bakedFloorMat.uniforms.tLight.value = _extGpuA.floor;
    h.bakedFloorMat.uniforms.tLightB.value = settledLeafTex || _phRgbmsqrt;
    h.bakedFloorMat.uniforms.tLightFix.value = _sconceGpu.floor;
    h.bakedFloorMat.uniforms.tLightFixB.value = _phRgbmsqrt;
    U.uFloorLightSizeA.value.set(cfgA.floor.size[0], cfgA.floor.size[1]);
    U.uFloorFixSizeA.value.set(scCfg.floor.size[0], scCfg.floor.size[1]);
    U.uSmaxFloorA.value = cfgA.floor.s_max ?? 16.0;
    U.uSmaxFloorFixA.value = scCfg.floor.s_max ?? 6.0;
    U.uFloorFixEncA.value = encSc;
    U.uFloorFixEncB.value = 0.0;
    U.uFloorFixMix.value = 0.0;

    // Trim
    U.uTrimRadMix.value = 1.0;
    U.uTrimExtMix.value = 0.0;

    markOutsideCompositorDirty();
  }

  // Dispose any remaining superseded exterior GPU slots AFTER every uniform has been rebound:
  for (const old of toDispose) disposeBasisGpu(old);

  // Immediately run compositor if renderer is ready so textures are valid before next draw:
  if (r) updateOutsideCompositor(h);
  h.markReflDirty?.();
  notifyPlateReady(cycModeA);
}

export function waitOutsideCyclesReady() {
  return _activeSyncPromise.catch(() => {});
}

export function warmOutsideCpuImages(onlyMode = null) {
  if (typeof Image === 'undefined') return waitOutsideCyclesReady();
  const keys = (onlyMode && PLATE_URLS[onlyMode]) ? [onlyMode] : Object.keys(PLATE_URLS);
  const platesP = Promise.all(keys.map(key => new Promise(resolve => {
    preloadCpuImage(key);
    const entry = _cpuImages[key];
    if (entry && entry.ready) return resolve(entry.img);
    (_pendingCallbacks[key] || (_pendingCallbacks[key] = [])).push(() => resolve(entry?.img));
  })));
  return Promise.all([platesP, waitOutsideCyclesReady()]);
}

export function applyOutsidePresetValues(mode = 'v9', { outStrength, artPop, renderer = null, hall = null } = {}) {
  const p = OUTSIDE_PRESETS[mode] || OUTSIDE_PRESETS.v9;
  const [x, y, z, w] = p.weights;
  SHARED_OUTSIDE_UNIFORMS.uOutWeights.value.set(x, y, z, w);
  SHARED_OUTSIDE_UNIFORMS.uOutStrength.value = outStrength !== undefined ? +outStrength : p.outStrength;
  SHARED_OUTSIDE_UNIFORMS.uArtPop.value      = artPop !== undefined ? +artPop : p.artPop;
  const r = renderer || hall?.renderer || null;
  const hRef = hall || _lastHallRef;
  if (p.id === 'v9' || !hRef?.bakedPack?._v9Evicted) {
    setSkyPlateMips(false, r);
  }
  syncOutsideGpuPlates(p.id, null, r);
  _activeSyncPromise = syncOutsideCyclesState(p.id, null, 0.0, hall, renderer).catch(err => {
    console.warn('[outside-light] preset sync fallback:', err);
  });
  return p;
}

export function lerpOutsideModes(modeA, modeB, u, renderer = null, hall = null) {
  const a = OUTSIDE_PRESETS[modeA] || OUTSIDE_PRESETS.v9;
  const b = OUTSIDE_PRESETS[modeB] || OUTSIDE_PRESETS.v9;
  const t = Math.max(0, Math.min(1, +u || 0));
  const wx = a.weights[0] + (b.weights[0] - a.weights[0]) * t;
  const wy = a.weights[1] + (b.weights[1] - a.weights[1]) * t;
  const wz = a.weights[2] + (b.weights[2] - a.weights[2]) * t;
  const ww = a.weights[3] + (b.weights[3] - a.weights[3]) * t;
  SHARED_OUTSIDE_UNIFORMS.uOutWeights.value.set(wx, wy, wz, ww);
  SHARED_OUTSIDE_UNIFORMS.uOutStrength.value = a.outStrength + (b.outStrength - a.outStrength) * t;
  SHARED_OUTSIDE_UNIFORMS.uArtPop.value      = a.artPop + (b.artPop - a.artPop) * t;
  const r = renderer || hall?.renderer || null;
  const hRef = hall || _lastHallRef;
  const involvesV9 = (a.id === 'v9' || b.id === 'v9');
  if (involvesV9 || !hRef?.bakedPack?._v9Evicted) {
    setSkyPlateMips(false, r);
  }
  if (t <= 0.0005) syncOutsideGpuPlates(a.id, null, r);
  else if (t >= 0.9995) syncOutsideGpuPlates(b.id, null, r);
  else if (a.id === 'v9') syncOutsideGpuPlates(b.id, null, r);
  else if (b.id === 'v9') syncOutsideGpuPlates(a.id, null, r);
  else syncOutsideGpuPlates(a.id, b.id, r);
  _activeSyncPromise = syncOutsideCyclesState(a.id, b.id, t, hall, r).catch(err => {
    console.warn('[outside-light] lerp sync fallback:', err);
  });
}

export function disposeOutsideGpuResources(hall = null) {
  _syncSeq++;
  _skyPlatesWantMips = false;
  const h = hall || _lastHallRef;
  releaseLeafCookieGpu(h);
  _leafCookieCpuImg = null;
  _leafCookieCpuPromise = null;
  unbindHallLightmapsToDummy(h);
  h?.setCyclesAntiTwitchExtras?.(false);
  disposeTransitionRTs(h);
  disposeProbeRT();
  disposeSlot(_gpuSlotA, SHARED_OUTSIDE_UNIFORMS.tOutPlateA, SHARED_OUTSIDE_UNIFORMS.uOutPlateSlotA, _phPlate);
  disposeSlot(_gpuSlotB, SHARED_OUTSIDE_UNIFORMS.tOutPlateB, SHARED_OUTSIDE_UNIFORMS.uOutPlateSlotB, _phPlate);
  if (h) {
    detachTrimAttribute(h, 'aRadExtA');
    detachTrimAttribute(h, 'aRadExtB');
    detachTrimAttribute(h, 'aRadSconce');
  }
  disposeBasisGpu(_extGpuA); _extGpuA = null;
  disposeBasisGpu(_extGpuB); _extGpuB = null;
  disposeBasisGpu(_sconceGpu); _sconceGpu = null;
  for (const prom of _basisCpuCache.values()) {
    Promise.resolve(prom).then((cpu) => {
      if (!cpu) return;
      for (const src of [cpu.wallsSrc, cpu.ceilSrc, cpu.floorSrc, cpu.probesSrc]) {
        if (src && typeof src.close === 'function') {
          try { src.close(); } catch {}
        }
      }
    }).catch(() => {});
  }
  _basisCpuCache.clear();
  clearCompositorSourceRefs();
  if (_compGeo) { _compGeo.dispose(); _compGeo = null; }
  if (_compMat) { _compMat.dispose(); _compMat = null; }
  _compScene = null;
  _compCam = null;
  _compWarmed = false;
  _hfMipSupported = null;
  _cyclesActiveState = { kind: 'v9', modeA: 'v9', modeB: null, u: 0.0 };
  SHARED_OUTSIDE_UNIFORMS.uTmShadowToe.value.set(0, 0, 0);
  SHARED_OUTSIDE_UNIFORMS.uTmContrast.value = 1.00;
  SHARED_OUTSIDE_UNIFORMS.uReflBlurred.value = 0.0;
  SHARED_OUTSIDE_UNIFORMS.uInReflPass.value = 0.0;
  setCyclesMix(0.0);
}

export function getOutsideCyclesDebugState() {
  return {
    metaLoaded: !!_metaData,
    state: { ..._cyclesActiveState },
    uOutCyclesMix: SHARED_OUTSIDE_UNIFORMS.uOutCyclesMix.value,
    uTmOutMix: SHARED_OUTSIDE_UNIFORMS.uTmOutMix.value,
    uTmContrast: SHARED_OUTSIDE_UNIFORMS.uTmContrast.value,
    canHalfFloatMip: _hfMipSupported,
    hasSconceGpu: !!_sconceGpu,
    sconceIsHF: !!_sconceGpu?.isHF,
    slotAMode: _extGpuA?.mode || null,
    slotAIsHF: !!_extGpuA?.isHF,
    slotBMode: _extGpuB?.mode || null,
    slotBIsHF: !!_extGpuB?.isHF,
    hasCeilRT: !!_ceilRT,
    ceilRTIsHF: _ceilRTIsHF,
    hasWallFixRT: !!_wallFixRT,
    hasWallLerpRT: !!_wallLerpRT,
    hasFloorLerpRT: !!_floorLerpRT,
    hasLeafCookie: !!_leafCookieTex,
    uLeafCookieReady: SHARED_OUTSIDE_UNIFORMS.uLeafCookieReady.value,
    hasProbeRT: !!_probeRT,
    probeDims: SHARED_OUTSIDE_UNIFORMS.uProbeDims.value.toArray(),
    uReflBlurred: SHARED_OUTSIDE_UNIFORMS.uReflBlurred.value,
    hasReflBlur: !!(_lastHallRef?.reflBlurH && _lastHallRef?.reflBlurV),
    v9Evicted: !!_lastHallRef?.bakedPack?._v9Evicted,
  };
}

// ---------------------------------------------------------------------------
// 7. GLSL Libraries (B1 Split Namespaces, B3 Zero-Sampler, 6-Face Ambient Cube)
// ---------------------------------------------------------------------------

// Sampler-free GLSL snippet exclusively for bakedCeilMat (0 texture samplers added -> preserves P1 <= 2 ceiling cap!):
export const OUTSIDE_LIGHT_CEIL_GLSL = /* glsl */`
  uniform vec4 uOutWeights;
  uniform float uOutStrength;
  uniform float uOutCyclesMix;
  uniform float uInReflPass;

  vec4 evalOutsideCeilMod(vec3 vW) {
    float wSum = dot(uOutWeights, vec4(1.0));
    if (wSum <= 0.0005 || uOutStrength <= 0.0005) return vec4(0.0, 0.0, 0.0, 1.0);
    float s = -vW.z;
    float ax = abs(vW.x);
    float wNorm = max(1e-4, wSum);
    float portalOpen  = smoothstep(19.75, 20.65, s);
    float cavityK     = clamp((uOutWeights.x + 0.45 * uOutWeights.y) / wNorm, 0.0, 1.0);
    float perimDip    = mix(mix(0.84, 0.72, cavityK), 1.0, 1.0 - smoothstep(1.00, 1.68, ax));
    float foyerDip    = mix(mix(0.80, 0.72, cavityK), 1.0, smoothstep(3.80, 8.80, s));
    float vigK        = 1.0 - clamp(uOutWeights.w / wNorm, 0.0, 1.0);
    float foreCeilVig = mix(1.0, mix(0.80, 1.0, smoothstep(9.5, 18.2, s)), vigK);
    float foreCoffer  = mix(1.0, 0.85, cavityK * (1.0 - smoothstep(11.4, 15.8, s)) * step(9.5, s));
    float corrCeilBase = (0.49 * uOutWeights.z + 0.68 * uOutWeights.w + 0.39 * uOutWeights.y + 0.36 * uOutWeights.x) / wNorm;
    float corrScale   = corrCeilBase * perimDip * foyerDip * foreCeilVig * foreCoffer;
    float alcScale   = 0.88 + 0.05 * (uOutWeights.w / wNorm);
    float targetScale = mix(corrScale, alcScale, portalOpen);
    float ceilScale   = mix(1.0, targetScale, clamp(wSum * uOutStrength, 0.0, 1.0));

    float nearWin = smoothstep(18.5, 23.8, s) * portalOpen;
    vec3 cAdd = vec3(0.0);
    cAdd += uOutWeights.z * vec3(0.76, 0.90, 1.06) * (0.14 * nearWin);
    cAdd += uOutWeights.w * vec3(1.16, 1.05, 0.89) * (0.18 * nearWin);
    cAdd += uOutWeights.y * vec3(1.26, 0.82, 0.36) * (0.15 * nearWin + 0.025 * smoothstep(9.0, 20.0, s));
    cAdd += uOutWeights.x * vec3(1.10, 0.99, 0.80) * (0.15 * nearWin);
    return vec4(cAdd * uOutStrength, ceilScale);
  }
`;

// Dedicated 6-Face Ambient Cube GLSL snippet (dynamic dims: 8x8x40 v1 or 12x12x48 Cycle 2; arch_contract.md §1B):
// Included ONLY by enamel trim/door shaders, mocks.js winPaintMat, and probe-lit PBR props (NEVER in walls/ceil/floor!).
export const PROBE_CUBE_GLSL = /* glsl */`
  uniform sampler2D tProbeCube;
  uniform float uHasProbeCube;
  uniform float uSmaxProbe;
  uniform vec3 uProbeDims;
  uniform vec2 uProbeBoundsX;
  uniform vec2 uProbeBoundsY;
  uniform vec2 uProbeBoundsS;

  vec3 probeDecodeRgbmsqrt(vec4 t, float sMax) {
    vec3 v = t.rgb * t.a;
    return (v * v) * sMax;
  }

  // Exact 2D atlas layout (flipY = false; row 0 = top of WebP):
  //   col = is * nx + ix (0..ns*nx-1), u = (col + 0.5) / (ns * nx)
  //   row = face * ny + iy (0..6*ny-1), v = (row + 0.5) / (6.0 * ny)
  // Face mapping (Three.js Y-up): 0:+X, 1:-X, 2:+Y, 3:-Y, 4:+Z (entrance), 5:-Z (end window)
  vec3 probeTexel(float ix, float iy, float isIdx, float face) {
    float nx = max(1.0, uProbeDims.x);
    float ny = max(1.0, uProbeDims.y);
    float ns = max(1.0, uProbeDims.z);
    float col = isIdx * nx + ix;
    float row = face * ny + iy;
    vec2 uv = vec2((col + 0.5) / (ns * nx), (row + 0.5) / (6.0 * ny));
    return probeDecodeRgbmsqrt(texture2D(tProbeCube, uv), uSmaxProbe);
  }

  vec3 sampleProbeFace(float fx, float fy, float fs, float face) {
    float maxX = max(0.0, uProbeDims.x - 1.0);
    float maxY = max(0.0, uProbeDims.y - 1.0);
    float maxS = max(0.0, uProbeDims.z - 1.0);
    float ix0 = clamp(floor(fx), 0.0, maxX);
    float iy0 = clamp(floor(fy), 0.0, maxY);
    float is0 = clamp(floor(fs), 0.0, maxS);
    float ix1 = min(ix0 + 1.0, maxX);
    float iy1 = min(iy0 + 1.0, maxY);
    float is1 = min(is0 + 1.0, maxS);
    float tx = clamp(fx - ix0, 0.0, 1.0);
    float ty = clamp(fy - iy0, 0.0, 1.0);
    float ts = clamp(fs - is0, 0.0, 1.0);

    vec3 c000 = probeTexel(ix0, iy0, is0, face);
    vec3 c100 = probeTexel(ix1, iy0, is0, face);
    vec3 c010 = probeTexel(ix0, iy1, is0, face);
    vec3 c110 = probeTexel(ix1, iy1, is0, face);
    vec3 c001 = probeTexel(ix0, iy0, is1, face);
    vec3 c101 = probeTexel(ix1, iy0, is1, face);
    vec3 c011 = probeTexel(ix0, iy1, is1, face);
    vec3 c111 = probeTexel(ix1, iy1, is1, face);

    vec3 c00 = mix(c000, c100, tx);
    vec3 c10 = mix(c010, c110, tx);
    vec3 c01 = mix(c001, c101, tx);
    vec3 c11 = mix(c011, c111, tx);
    return mix(mix(c00, c10, ty), mix(c01, c11, ty), ts);
  }

  vec3 sampleProbeCube(vec3 wPos, vec3 N) {
    if (uHasProbeCube < 0.5) return vec3(0.0);
    float nx = max(1.0, uProbeDims.x);
    float ny = max(1.0, uProbeDims.y);
    float ns = max(1.0, uProbeDims.z);
    float sCoord = -wPos.z;
    float ux = clamp((wPos.x - uProbeBoundsX.x) / max(1e-4, uProbeBoundsX.y - uProbeBoundsX.x), 0.0, 1.0);
    float uy = clamp((wPos.y - uProbeBoundsY.x) / max(1e-4, uProbeBoundsY.y - uProbeBoundsY.x), 0.0, 1.0);
    float us = clamp((sCoord - uProbeBoundsS.x) / max(1e-4, uProbeBoundsS.y - uProbeBoundsS.x), 0.0, 1.0);
    float fx = clamp(ux * nx - 0.5, 0.0, max(0.0, nx - 1.0));
    float fy = clamp(uy * ny - 0.5, 0.0, max(0.0, ny - 1.0));
    float fs = clamp(us * ns - 0.5, 0.0, max(0.0, ns - 1.0));
    vec3 n = normalize(N);
    vec3 n2 = n * n;
    float fX = (n.x >= 0.0) ? 0.0 : 1.0;
    float fY = (n.y >= 0.0) ? 2.0 : 3.0;
    float fZ = (n.z >= 0.0) ? 4.0 : 5.0;
    vec3 irr = vec3(0.0);
    if (n2.x > 1e-4) irr += n2.x * sampleProbeFace(fx, fy, fs, fX);
    if (n2.y > 1e-4) irr += n2.y * sampleProbeFace(fx, fy, fs, fY);
    if (n2.z > 1e-4) irr += n2.z * sampleProbeFace(fx, fy, fs, fZ);
    return irr;
  }
`;

// Shared GLSL library (0 samplers — B3 leaf-gobo purged!; B1 olPbrNeutralTone + uOutCyclesMix + Unified Direct Sun):
export const OUTSIDE_LIGHT_GLSL = /* glsl */`
  uniform vec4 uOutWeights;
  uniform float uOutStrength;
  uniform float uArtPop;
  uniform float uOutTime;
  uniform float uOutCyclesMix;
  uniform float uInReflPass;
  uniform vec3 uDirSunRgbC03;
  uniform vec3 uDirSunRgbC02;
  uniform vec3 uDirSunRgbC02Br;
  uniform vec3 uSunVecC02Br;
  uniform float uLeafCookieReady;

  // Exact Cycle 7 aperture-locked physical sun vectors (1:1 Blender Z-up <-> Three.js Y-up, literal unit consts!):
  const vec3 L_SIDE_C02  = vec3(0.9403, 0.2756, -0.2000); // az=78.0 deg, el=16.0 deg -> dappled sun + arch across 003 & left alcove wall
  const vec3 L_END_C02_W = vec3(0.3542, 0.3256, -0.8767); // az=22.0 deg, el=19.0 deg -> blazing (+) oculus LEFT of 003 (s=20.91, y=2.04)!
  const vec3 L_END_C02_F = vec3(0.0762, 0.4848, -0.8713); // az=5.0 deg,  el=29.0 deg -> compact blazing creamy-gold TL floor pool (s=17.9..22.8)
  const vec3 L_SIDE_C03  = vec3(0.9133, 0.2588, -0.3145); // az=71.0 deg, el=15.0 deg -> 0 mustache/choker on 003 (ONLY 1.0 deg from L_SIDE_C02!)
  const vec3 L_END_C03   = vec3(0.2309, 0.1478, -0.9617); // az=13.5 deg, el=8.5 deg  -> clears 003, hits 002 + TWO golden diagonal TL floor wedges!
  const vec3 L_ORB_C03   = vec3(0.4950, 0.0320, -0.8683); // right-window solar disk centered in open pane (y=1.71, s=21.82) BELOW y=2.03 bar!
  const vec3 U_SUN_C03   = L_ORB_C03;
  const vec3 U_SUN_C02   = L_SIDE_C02;

  // B1 Khronos PBR Neutral strictly for toneMapped:false art/strip/eye shaders (distinct from tmPbrNeutralTone!):
  vec3 olPbrNeutralTone(vec3 col) {
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

  float olHash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float olNoise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = olHash21(i);
    float b = olHash21(i + vec2(1.0, 0.0));
    float c = olHash21(i + vec2(0.0, 1.0));
    float d = olHash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Exact 1862 Flushing Town Hall Romanesque Bifora Window Tracery Transmission in local window plane (u, y):
  float evalBiforaTracery(vec2 uy, float soft) {
    float u = uy.x;
    float y = uy.y;
    float s = max(0.006, soft);

    float inBottom = smoothstep(0.648 - s, 0.648 + s, y);
    float rTop = length(vec2(u, max(0.0, y - 2.74)));
    float inArch = (y <= 2.74)
      ? (1.0 - smoothstep(0.688 - s, 0.688 + s, abs(u)))
      : (1.0 - smoothstep(0.688 - s, 0.688 + s, rTop));
    float open = inBottom * inArch;
    if (open <= 0.001) return 0.0;

    if (y > 2.74 - s) {
      float dSubL = length(vec2(u + 0.350, y - 2.74));
      float dSubR = length(vec2(u - 0.350, y - 2.74));
      float inSub = max(
        1.0 - smoothstep(0.312 - s, 0.312 + s, dSubL),
        1.0 - smoothstep(0.312 - s, 0.312 + s, dSubR)
      );
      float dOc = length(vec2(u, y - 3.175));
      float sOc = min(s * 0.58, 0.028);
      float inOc = 1.0 - smoothstep(0.160 - sOc, 0.160 + sOc, dOc);
      float ocBar = max(
        1.0 - smoothstep(0.026, 0.026 + sOc * 1.05, abs(u)),
        1.0 - smoothstep(0.026, 0.026 + sOc * 1.05, abs(y - 3.175))
      );
      inOc *= (1.0 - 0.95 * ocBar);
      float spandrelMask = clamp(max(inSub, inOc), 0.0, 1.0);
      open *= mix(1.0, spandrelMask, smoothstep(2.74 - s, 2.74 + s, y));
    }

    float barSharp = clamp(0.056 / (0.010 + s), 0.56, 0.96);
    float colBlk  = (1.0 - smoothstep(0.026, 0.026 + s * 1.08, abs(u))) * (1.0 - smoothstep(2.74, 2.78, y));
    float munV    = (1.0 - smoothstep(0.018, 0.018 + s * 1.10, abs(abs(u) - 0.350))) * (1.0 - smoothstep(3.03, 3.07, y));
    float munH1   = 1.0 - smoothstep(0.018, 0.018 + s * 1.10, abs(y - 1.32));
    float munH2   = 1.0 - smoothstep(0.018, 0.018 + s * 1.10, abs(y - 2.03));
    float munSpr  = 1.0 - smoothstep(0.021, 0.021 + s * 1.08, abs(y - 2.74));
    float bars = clamp(colBlk * 0.97 + max(max(munV, munH1), max(munH2, munSpr)) * 0.94 * barSharp, 0.0, 0.97);
    return open * (1.0 - bars);
  }

  // B3 Sampler-Free Procedural Botanical Komorebi Canopy Kernel (0 samplers!):
  float evalBotanicalKomorebi(vec2 uyWin, float rayDist, float tSec, float uvOffset) {
    vec2 sway1 = vec2(sin(tSec * 0.44 + uyWin.y * 1.3) * 0.016, cos(tSec * 0.36 + uyWin.x * 1.1) * 0.011);
    vec2 p = uyWin + sway1;
    float blurK = clamp(0.18 + rayDist * 0.045, 0.18, 0.58);
    vec2 p1 = (p + vec2(uvOffset * 1.4, 0.0)) * vec2(1.48, 1.32) + vec2(2.3, 5.7 + uvOffset * 9.0);
    vec2 p2 = mat2(0.82, -0.57, 0.57, 0.82) * ((p - sway1 * 0.8) * vec2(2.85, 2.55)) + vec2(8.1, 1.9);
    vec2 p3 = mat2(0.55,  0.83, -0.83, 0.55) * ((p + sway1 * 1.1) * vec2(5.40, 4.90)) + vec2(3.7, 11.4);
    float m1 = olNoise2(p1);
    float m2 = olNoise2(p2);
    float m3 = olNoise2(p3);
    float canopy = mix(0.46 * m1 + 0.36 * m2 + 0.18 * m3, 0.62 * m1 + 0.38 * m2, blurK);

    float crownOpen = (uvOffset < 0.0)
      ? (smoothstep(2.68, 3.22, uyWin.y) * 0.30)
      : (smoothstep(2.62, 3.25, uyWin.y) * 0.32);
    float loGap = (uvOffset < 0.0) ? 0.24 : 0.17;
    float hiGap = (uvOffset < 0.0) ? 0.54 : 0.56;
    float sunGap = smoothstep(loGap - crownOpen, hiGap - crownOpen, canopy);
    float ocClear = 1.0 - smoothstep(0.18, 0.34, length(uyWin - vec2(0.0, 3.175)));
    sunGap = max(sunGap, 0.97 * ocClear);
    return mix(0.04, 1.0, sunGap);
  }

  // Cycle 4 Photographic Mipmapped Botanical Leaf-Cluster Gobo (Pre-Flight Guard #1: explicit analytical textureLod -> ZERO Metal derivative UB!):
  vec2 olHash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }

  float evalC02LeafGobo(sampler2D leafTex, vec2 uyWin, float tRay, float aaWin, float tSec, float isFloor, float isEntFan, float softMult) {
    // Calm museum micro-breeze <= 0.0022 m (0 motion jitter!)
    vec2 sway = vec2(sin(tSec * 0.40 + uyWin.y * 1.3) * 0.0022, cos(tSec * 0.32 + uyWin.x * 1.1) * 0.0018);
    vec2 p = uyWin + sway;
    float lodSoft = log2(max(softMult, 1.0));
    float g;
    if (uLeafCookieReady > 0.5) {
      if (isEntFan > 0.5) {
        // Cycle 7 §1.2: Smooth low-frequency organic dappled pools (ZERO rust camo splatter or jagged wall paper!)
        vec2 uv1 = vec2(p.x * 0.42 + 0.50, (p.y - 2.45) * 0.40);
        vec2 uv2 = vec2(-p.x * 0.28 + 0.31, (p.y - 2.35) * 0.28 + 0.41);
        float baseLod = (isFloor > 0.5) ? (2.55 + tRay * 0.28) : (1.75 + tRay * 0.24);
        float lod1 = clamp(max(log2(max(aaWin * 0.42 * 512.0, 1.0)), baseLod) + lodSoft, 1.75, 4.2);
        float lod2 = clamp(lod1 + 0.65, 2.2, 4.6);
        float l1 = textureLod(leafTex, uv1, lod1).r;
        float l2 = textureLod(leafTex, uv2, lod2).r;
        g = smoothstep(0.32, 0.76, l1 * 0.78 + l2 * 0.22);
      } else {
        vec2 uv1 = vec2(p.x * 0.62 + 0.50, (p.y - 0.65) * 0.36);
        vec2 uv2 = vec2(-p.x * 0.44 + 0.31, (p.y - 0.50) * 0.27 + 0.41);
        float lod1 = (isFloor > 0.5)
          ? min(clamp(max(log2(max(aaWin * 0.62 * 512.0, 1.0)), 0.85 + tRay * 0.28), 0.90, 3.4) + lodSoft, 5.0)
          : min(clamp(max(log2(max(aaWin * 0.62 * 512.0, 1.0)), 0.35 + tRay * 0.15), 0.35, 2.3) + lodSoft, 5.0);
        float lod2 = min(lod1 + 0.60, 5.4);
        float l1 = textureLod(leafTex, uv1, lod1).r;
        float l2 = textureLod(leafTex, uv2, lod2).r;
        float raw = smoothstep(0.24, 0.78, l1 * 0.72 + l2 * 0.28);
        float crownOpen = smoothstep(2.65, 3.22, uyWin.y) * 0.22;
        g = clamp(raw + crownOpen, 0.0, 1.0);
      }
    } else {
      // Soft band-limited fallback ONLY during V9<->C02 lerp (keeps peak VRAM <= 143.71 MiB, 0 kidney-beans!):
      float fb = evalBotanicalKomorebi(p, max(tRay, 2.5), tSec, 0.0);
      g = smoothstep(0.18, 0.84, fb);
    }
    // Exact 0.23 m crown clearance around the (+) Romanesque oculus (0.0, 3.175) -> strictly on Biforas (NEVER on BR fanlight!)
    if (isEntFan < 0.5) {
      float ocClear = 1.0 - smoothstep(0.15, 0.23, length(uyWin - vec2(0.0, 3.175)));
      g = max(g, 0.96 * ocClear);
    }
    return mix(0.08, 1.0, g);
  }

  float evalBoxShadow2D(float sP, float yP, float sC, float yC, float hS, float hY, float pen) {
    float inS = 1.0 - smoothstep(hS - pen, hS + pen, abs(sP - sC));
    float inY = 1.0 - smoothstep(hY - pen, hY + pen, abs(yP - yC));
    return inS * inY;
  }

  // Exact ray-aligned 3D frame cast shadow (5.9 cm ebony frame depth projected along ray):
  float evalFrameCastShadow(vec3 vW, vec3 ray) {
    if (ray.x <= 0.08) return 1.0;
    float s = -vW.z;
    float tf = 0.059 / max(ray.x, 0.15);
    float sF = s - ray.z * tf;
    float yF = vW.y + ray.y * tf;
    if (s > 20.30 && vW.x < -1.215 && vW.x > -1.265) {
      float occ = evalBoxShadow2D(sF, yF, 22.02, 1.84, 0.786, 0.847, 0.012);
      return 1.0 - 0.97 * occ;
    }
    if (s > 13.5 && s < 19.95 && vW.x < -1.695 && vW.x > -1.745) {
      float occ = max(
        evalBoxShadow2D(sF, yF, 14.91, 1.86, 0.613, 0.725, 0.014),
        max(
          evalBoxShadow2D(sF, yF, 16.74, 1.86, 0.825, 0.880, 0.014),
          evalBoxShadow2D(sF, yF, 18.64, 1.86, 0.680, 0.725, 0.014)
        )
      );
      return 1.0 - 0.96 * occ;
    }
    return 1.0;
  }

  // Unified Analytical-AA Aperture-Locked Bifora Beam Mask (B5a: zero fwidth/dFdx inside branches — returns vec2(beamEnd, beamSide)):
  vec2 evalUnifiedBiforaMask(vec3 vW, vec3 L_end, vec3 L_side, float leafAmt, float softMult, float isFloor, vec3 dWx, vec3 dWy, sampler2D leafTex) {
    float s = -vW.z;
    if (s < 11.0 || s > 23.95) return vec2(0.0);
    float beamE = 0.0;
    float beamR = 0.0;
    float leafK = clamp(leafAmt, 0.0, 1.0);
    float pen0 = mix(0.008, 0.006, leafK);
    float penR = mix(0.0052, 0.0048, leafK);

    // 1. End Bifora (z = -23.98) traced along L_end
    if (L_end.z < -0.05 && s < 23.94) {
      float tE = (-23.98 - vW.z) / L_end.z;
      if (tE > 0.0) {
        float xHit = vW.x + L_end.x * tE;
        float yHit = vW.y + L_end.y * tE;
        vec3 dU_E = vec3(1.0, 0.0, -L_end.x / L_end.z);
        vec3 dY_E = vec3(0.0, 1.0, -L_end.y / L_end.z);
        float aaE = clamp(max(
          abs(dot(dWx, dU_E)) + abs(dot(dWy, dU_E)),
          abs(dot(dWx, dY_E)) + abs(dot(dWy, dY_E))
        ), 0.0, 0.25);
        float softE = max((pen0 + penR * tE) * softMult, 1.50 * aaE);
        float trE = evalBiforaTracery(vec2(xHit, yHit), softE);
        if (trE > 0.001) {
          if (leafK > 0.001) trE *= mix(1.0, evalC02LeafGobo(leafTex, vec2(xHit, yHit), tE, aaE, uOutTime, isFloor, 0.0, softMult), leafK);
          float archPassE = 1.0;
          if (s < 20.08) {
            float tArch = (-20.12 - vW.z) / L_end.z;
            if (tArch > 0.0 && tArch < tE) {
              float xA = vW.x + L_end.x * tArch;
              float yA = vW.y + L_end.y * tArch;
              float archHalf = 1.22;
              float archR = length(vec2(xA / archHalf, max(0.0, yA - 2.96) / 0.74));
              archPassE = (yA < 2.96)
                ? (1.0 - smoothstep(archHalf - 0.07, archHalf + 0.04, abs(xA)))
                : (1.0 - smoothstep(0.94, 1.04, archR));
            }
          }
          beamE = trE * archPassE * evalFrameCastShadow(vW, L_end);
        }
      }
    }

    // 2. Right Bifora (x = +1.31, centered at s = 22.02) traced along L_side
    if (L_side.x > 0.05 && vW.x < 1.28) {
      float tR = (1.31 - vW.x) / L_side.x;
      if (tR > 0.0) {
        float yHit = vW.y + L_side.y * tR;
        float sHit = s - L_side.z * tR;
        float uR = sHit - 22.02;
        vec3 dU_R = vec3(L_side.z / L_side.x, 0.0, -1.0);
        vec3 dY_R = vec3(-L_side.y / L_side.x, 1.0, 0.0);
        float aaR = clamp(max(
          abs(dot(dWx, dU_R)) + abs(dot(dWy, dU_R)),
          abs(dot(dWx, dY_R)) + abs(dot(dWy, dY_R))
        ), 0.0, 0.25);
        float softR = max((pen0 + penR * tR) * softMult, 1.50 * aaR);
        float trR = evalBiforaTracery(vec2(uR, yHit), softR);
        if (trR > 0.001) {
          if (leafK > 0.001) trR *= mix(1.0, evalC02LeafGobo(leafTex, vec2(uR, yHit), tR, aaR, uOutTime, isFloor, 0.0, softMult), leafK);
          float archPassR = 1.0;
          if (s < 20.08 && L_side.z < -0.02) {
            float tArch = (-20.12 - vW.z) / L_side.z;
            if (tArch > 0.0 && tArch < tR) {
              float xA = vW.x + L_side.x * tArch;
              float yA = vW.y + L_side.y * tArch;
              float archHalf = 1.22;
              float archR = length(vec2(xA / archHalf, max(0.0, yA - 2.96) / 0.74));
              archPassR = (yA < 2.96)
                ? (1.0 - smoothstep(archHalf - 0.07, archHalf + 0.04, abs(xA)))
                : (1.0 - smoothstep(0.94, 1.04, archR));
            }
          }
          beamR = trR * archPassR * evalFrameCastShadow(vW, L_side);
        }
      }
    }

    return vec2(beamE, beamR);
  }

  // Unified Analytical-AA C02 BR Entrance Fanlight Courtyard Slash (z = -3.60, x in [-0.84, 0.84], y in [2.76, 3.42]):
  float evalUnifiedEntFanMask(vec3 vW, vec3 Lbr, float leafAmt, float softMult, float isFloor, vec3 dWx, vec3 dWy, sampler2D leafTex) {
    float s = -vW.z;
    if (s <= 3.66 || s > 13.0 || Lbr.z <= 0.05) return 0.0;
    float tF = (-3.60 - vW.z) / Lbr.z;
    if (tF <= 0.0) return 0.0;
    float uF = vW.x + Lbr.x * tF;
    float yF = vW.y + Lbr.y * tF;
    vec3 dU_F = vec3(1.0, 0.0, -Lbr.x / Lbr.z);
    vec3 dY_F = vec3(0.0, 1.0, -Lbr.y / Lbr.z);
    float aaF = clamp(max(
      abs(dot(dWx, dU_F)) + abs(dot(dWy, dU_F)),
      abs(dot(dWx, dY_F)) + abs(dot(dWy, dY_F))
    ), 0.0, 0.25);
    float softF = max((0.006 + 0.004 * tF) * softMult, 1.45 * aaF);
    // Cycle 7 §1.2: Soft continuous diagonal dappled courtyard shaft + elliptical BR floor envelope (0 rust camo splatter!)
    float softBot  = max(0.22 + 0.028 * tF, 1.50 * aaF);
    float inBot    = smoothstep(2.35 - softBot, 2.86 + softBot * 0.65, yF);
    float rFan     = length(vec2(uF / 1.12, max(0.0, yF - 2.66) / 0.80));
    float softArch = max(0.16 + 0.024 * tF, 1.45 * aaF);
    float inArch   = 1.0 - smoothstep(0.76 - softArch * 0.5, 1.16 + softArch, rFan);
    float openF    = inBot * inArch;
    if (isFloor > 0.5) {
      vec2 dFlBr = vec2((vW.x + 0.85) / 0.95, (s - 7.55) / 1.15);
      float envF = smoothstep(0.0, 0.35, openF) * exp(-dot(dFlBr, dFlBr));
      openF *= envF;
    }
    if (openF <= 0.001) return 0.0;
    float leafK = clamp(leafAmt, 0.0, 1.0);
    // Cycle 5/6 §3.2: Decoupled floor-spec aperture path (leafAmt <= 0.001 -> broad openF * 0.55, zero spoke/leaf shimmer!)
    if (leafK <= 0.001) return openF * 0.55;
    // Cycle 7 §1.2: Softened radial transom rib hint (0.18 -> zero hard decal stripes!) + real isFloor LOD!
    float angF = atan(max(1e-5, yF - 2.66), uF);
    float spoke = 1.0 - 0.18 * (1.0 - smoothstep(0.04, 0.16 + softF * 2.5, abs(sin(angF * 5.0)))) * smoothstep(0.22, 0.45, rFan);
    float leafF = mix(1.0, evalC02LeafGobo(leafTex, vec2(uF, yF), tF, aaF, uOutTime, isFloor, 1.0, softMult), leafK);
    return openF * spoke * leafF;
  }

  // Unified Room-Surface Direct Sun Operator (B5a uniform-flow derivatives + B6a metadata-gated RGB weights + Cycle 7 §1.2/§2.1/§5.2):
  vec3 evalUnifiedDirectSun(vec3 vW, vec3 N, float isFloor, float softMult, sampler2D leafTex) {
    vec3 dWx = dFdx(vW);
    vec3 dWy = dFdy(vW);
    float w2 = uOutWeights.x;
    float w3 = uOutWeights.y;
    if ((w2 <= 0.0005 && w3 <= 0.0005) || uOutStrength <= 0.0005) return vec3(0.0);
    vec3 acc = vec3(0.0);
    // Cycle 7 §1.2/§2.1/§5.1: Blazing TL corridor pools + calm alcove floor roll-off + soft BR floor dapples (0 rust splatter!)
    float alcSunRoll2 = (isFloor > 0.5) ? mix(1.0, 0.30, smoothstep(19.4, 21.2, -vW.z)) : 1.0;
    float alcSunRoll3 = (isFloor > 0.5) ? mix(1.0, 0.42, smoothstep(19.6, 21.4, -vW.z)) : 1.0;
    vec3 flTint2   = (isFloor > 0.5) ? (vec3(1.24, 1.10, 0.78) * (1.95 * alcSunRoll2)) : vec3(1.0);
    vec3 flTint2Br = (isFloor > 0.5) ? (vec3(1.12, 0.94, 0.58) * 0.52) : vec3(1.0);
    float flBoost3 = (isFloor > 0.5) ? (1.95 * alcSunRoll3) : 1.0;
    float soft2    = (isFloor > 0.5) ? (softMult * mix(1.0, 1.55, smoothstep(19.4, 21.2, -vW.z))) : softMult;
    float soft3    = (isFloor > 0.5) ? (softMult * mix(0.76, 1.15, smoothstep(19.2, 20.6, -vW.z))) : softMult;
    if (w2 > 0.001 && w3 > 0.001) {
      // Cycle 7 §5.2: Orbital Sun Slerp + Quadratic Leaf Dissolve + Passing-Cloud Sun V-Dip (0.0 at endpoints!)
      float w23 = w2 + w3;
      float tSun = clamp(w3 / w23, 0.0, 1.0);
      float leafMix = pow(clamp(1.0 - tSun * 1.45, 0.0, 1.0), 2.0);
      float m23s = clamp(4.0 * tSun * (1.0 - tSun), 0.0, 1.0);
      float softLerp = mix(soft2, soft3, tSun) + 2.4 * m23s;
      float cloudDip = 1.0 - 0.68 * m23s;
      vec3 lEndMix  = normalize(mix((isFloor > 0.5) ? L_END_C02_F : L_END_C02_W, L_END_C03, tSun));
      vec3 lSideMix = normalize(mix(L_SIDE_C02, L_SIDE_C03, tSun));
      vec3 rgb2 = uDirSunRgbC02 * flTint2;
      vec3 rgb3 = uDirSunRgbC03 * flBoost3;
      vec3 rgbMix = mix(rgb2, rgb3, tSun);
      if (dot(rgbMix, vec3(1.0)) > 1e-5) {
        vec2 mMix = evalUnifiedBiforaMask(vW, lEndMix, lSideMix, leafMix, softLerp, isFloor, dWx, dWy, leafTex);
        float ndlE = (isFloor > 0.5) ? max(lEndMix.y, 0.0) : max(dot(N, lEndMix), 0.0);
        float ndlS = (isFloor > 0.5) ? max(lSideMix.y, 0.0) : max(dot(N, lSideMix), 0.0);
        vec3 sF = w23 * rgbMix * (max(mMix.x * ndlE, mMix.y * ndlS) * cloudDip);
        if (isFloor > 0.5) sF /= (vec3(1.0) + vec3(mix(0.14, 0.12, tSun)) * dot(sF, vec3(0.2126, 0.7152, 0.0722)));
        acc += sF;
      }
      float brFade = w2 * smoothstep(0.55, 0.0, tSun);
      if (brFade > 0.001 && dot(uDirSunRgbC02Br, vec3(1.0)) > 1e-5) {
        vec3 Lbr = normalize(uSunVecC02Br);
        float mBr = evalUnifiedEntFanMask(vW, Lbr, leafMix, softLerp, isFloor, dWx, dWy, leafTex);
        float ndlBr = (isFloor > 0.5) ? max(Lbr.y, 0.0) : max(dot(N, Lbr), 0.0);
        vec3 sBr = brFade * uDirSunRgbC02Br * flTint2Br * (mBr * ndlBr * cloudDip);
        if (isFloor > 0.5) sBr /= (vec3(1.0) + vec3(0.14) * dot(sBr, vec3(0.2126, 0.7152, 0.0722)));
        acc += sBr;
      }
    } else {
      if (w3 > 0.0005 && dot(uDirSunRgbC03, vec3(1.0)) > 1e-5) {
        vec2 m3 = evalUnifiedBiforaMask(vW, L_END_C03, L_SIDE_C03, 0.0, soft3, isFloor, dWx, dWy, leafTex);
        float ndlE3 = (isFloor > 0.5) ? max(L_END_C03.y, 0.0) : max(dot(N, L_END_C03), 0.0);
        float ndlS3 = (isFloor > 0.5) ? max(L_SIDE_C03.y, 0.0) : max(dot(N, L_SIDE_C03), 0.0);
        vec3 s3 = w3 * uDirSunRgbC03 * (max(m3.x * ndlE3, m3.y * ndlS3) * flBoost3);
        if (isFloor > 0.5) s3 /= (vec3(1.0) + vec3(0.12) * dot(s3, vec3(0.2126, 0.7152, 0.0722)));
        acc += s3;
      }
      if (w2 > 0.0005) {
        if (dot(uDirSunRgbC02, vec3(1.0)) > 1e-5) {
          vec3 lEnd2 = (isFloor > 0.5) ? L_END_C02_F : L_END_C02_W;
          vec2 m2 = evalUnifiedBiforaMask(vW, lEnd2, L_SIDE_C02, 1.0, soft2, isFloor, dWx, dWy, leafTex);
          float ndlE2 = (isFloor > 0.5) ? max(lEnd2.y, 0.0) : max(dot(N, lEnd2), 0.0);
          float ndlS2 = (isFloor > 0.5) ? max(L_SIDE_C02.y, 0.0) : max(dot(N, L_SIDE_C02), 0.0);
          vec3 s2 = w2 * uDirSunRgbC02 * flTint2 * max(m2.x * ndlE2, m2.y * ndlS2);
          if (isFloor > 0.5) s2 /= (vec3(1.0) + vec3(0.14) * dot(s2, vec3(0.2126, 0.7152, 0.0722)));
          acc += s2;
        }
        if (dot(uDirSunRgbC02Br, vec3(1.0)) > 1e-5) {
          vec3 Lbr = normalize(uSunVecC02Br);
          float mBr = evalUnifiedEntFanMask(vW, Lbr, 1.0, soft2, isFloor, dWx, dWy, leafTex);
          float ndlBr = (isFloor > 0.5) ? max(Lbr.y, 0.0) : max(dot(N, Lbr), 0.0);
          vec3 sBr2 = w2 * uDirSunRgbC02Br * flTint2Br * (mBr * ndlBr);
          if (isFloor > 0.5) sBr2 /= (vec3(1.0) + vec3(0.14) * dot(sBr2, vec3(0.2126, 0.7152, 0.0722)));
          acc += sBr2;
        }
      }
    }
    return acc * uOutStrength;
  }

  // Smooth Macro-Normal GGX Direct-Sun Specular Lobe for Cycles Hardwood Floor (0 grain twinkle, exact unified mask!):
  float olGgxLobe(vec3 Nm, vec3 V, vec3 L, float rough) {
    float NoL = max(dot(Nm, L), 0.0);
    float NoV = max(dot(Nm, V), 1e-4);
    if (NoL <= 0.001) return 0.0;
    vec3 H = normalize(L + V);
    float NoH = max(dot(Nm, H), 0.0);
    float VoH = max(dot(V, H), 0.0);
    float a = clamp(rough * 1.15, 0.15, 0.38);
    float a2 = a * a;
    float denom = NoH * NoH * (a2 - 1.0) + 1.0;
    float D = a2 / (3.14159265 * denom * denom + 1e-5);
    float F = 0.04 + 0.96 * pow(clamp(1.0 - VoH, 0.0, 1.0), 5.0);
    float k = (a + 1.0) * (a + 1.0) * 0.125;
    float G = (NoV / (NoV * (1.0 - k) + k)) * (NoL / (NoL * (1.0 - k) + k));
    return clamp((D * F * G) / max(4.0 * NoV * NoL, 0.025), 0.0, 1.8) * NoL;
  }

  vec3 evalUnifiedFloorSpec(vec3 vW, vec3 Nm, vec3 V, float specOcc, float roughVal, sampler2D leafTex) {
    vec3 dWx = dFdx(vW);
    vec3 dWy = dFdy(vW);
    float w2 = uOutWeights.x;
    float w3 = uOutWeights.y;
    if ((w2 <= 0.0005 && w3 <= 0.0005) || uOutStrength <= 0.0005) return vec3(0.0);
    float occClear = mix(0.55, 1.0, specOcc);
    vec3 sp = vec3(0.0);
    float alcSpec2 = mix(1.0, 0.45, smoothstep(19.6, 21.5, -vW.z));
    float alcSpec3 = mix(1.0, 0.58, smoothstep(19.8, 21.6, -vW.z));
    vec3 spTint2 = vec3(1.18, 1.02, 0.68) * alcSpec2;
    if (w2 > 0.001 && w3 > 0.001) {
      // Cycle 5/6 §3.2 + §4.2: Decoupled leaf cookie (leafAmt=0.0) + Orbital Single-Sun Slerp + alcove calm!
      float w23 = w2 + w3;
      float tSun = clamp(w3 / w23, 0.0, 1.0);
      vec3 lEndMix  = normalize(mix(L_END_C02_F, L_END_C03, tSun));
      vec3 lSideMix = normalize(mix(L_SIDE_C02, L_SIDE_C03, tSun));
      float softSpec = mix(3.5, 1.0, tSun);
      vec3 spColMix = mix(uDirSunRgbC02 * spTint2 * 0.36, uDirSunRgbC03 * (0.42 * 1.45 * alcSpec3), tSun);
      if (dot(spColMix, vec3(1.0)) > 1e-5) {
        vec2 mMix = evalUnifiedBiforaMask(vW, lEndMix, lSideMix, 0.0, softSpec, 1.0, dWx, dWy, leafTex);
        float spM = max(mMix.x * olGgxLobe(Nm, V, lEndMix, roughVal), mMix.y * olGgxLobe(Nm, V, lSideMix, roughVal));
        if (spM > 0.0005) sp += w23 * spColMix * spM;
      }
      float brFade = w2 * smoothstep(0.55, 0.0, tSun);
      if (brFade > 0.001 && dot(uDirSunRgbC02Br, vec3(1.0)) > 1e-5) {
        vec3 Lbr = normalize(uSunVecC02Br);
        float mBr = evalUnifiedEntFanMask(vW, Lbr, 0.0, 3.5, 1.0, dWx, dWy, leafTex);
        if (mBr > 0.001) sp += brFade * uDirSunRgbC02Br * spTint2 * (mBr * olGgxLobe(Nm, V, Lbr, roughVal) * 0.36);
      }
    } else {
      if (w3 > 0.0005 && dot(uDirSunRgbC03, vec3(1.0)) > 1e-5) {
        vec2 m3 = evalUnifiedBiforaMask(vW, L_END_C03, L_SIDE_C03, 0.0, 1.0, 1.0, dWx, dWy, leafTex);
        float sp3 = max(m3.x * olGgxLobe(Nm, V, L_END_C03, roughVal), m3.y * olGgxLobe(Nm, V, L_SIDE_C03, roughVal));
        if (sp3 > 0.0005) sp += w3 * uDirSunRgbC03 * (sp3 * 0.42 * 1.45 * alcSpec3);
      }
      if (w2 > 0.0005) {
        // Cycle 5/6 §3.2: Decouple C02 leaf cookie from floor specular (leafAmt=0.0, softMult=3.5 -> -42.5% SpatialHF!)
        if (dot(uDirSunRgbC02, vec3(1.0)) > 1e-5) {
          vec2 m2 = evalUnifiedBiforaMask(vW, L_END_C02_F, L_SIDE_C02, 0.0, 3.5, 1.0, dWx, dWy, leafTex);
          float sp2 = max(m2.x * olGgxLobe(Nm, V, L_END_C02_F, roughVal), m2.y * olGgxLobe(Nm, V, L_SIDE_C02, roughVal));
          if (sp2 > 0.0005) sp += w2 * uDirSunRgbC02 * spTint2 * (sp2 * 0.36);
        }
        if (dot(uDirSunRgbC02Br, vec3(1.0)) > 1e-5) {
          vec3 Lbr = normalize(uSunVecC02Br);
          float mBr = evalUnifiedEntFanMask(vW, Lbr, 0.0, 3.5, 1.0, dWx, dWy, leafTex);
          if (mBr > 0.001) sp += w2 * uDirSunRgbC02Br * spTint2 * (mBr * olGgxLobe(Nm, V, Lbr, roughVal) * 0.36);
        }
      }
    }
    // Cycle 7 §5.1 #2: Alcove-only outSpec calm (s > 19.0 -> 0.32x, TL corridor 100% untouched!)
    float alcSpecCalm = mix(1.0, 0.32, smoothstep(19.0, 21.2, -vW.z));
    return sp * (occClear * uOutStrength * alcSpecCalm);
  }

  // Pre-Flight Guard #2: returns float (0-LSB on V9; Cycles soft contact-AO for all 9 frames, BL posters & sconce bowls!)
  float evalOutsideWallContactShadows(vec3 vW, vec3 N) {
    float wSum = dot(uOutWeights, vec4(1.0));
    if (wSum <= 0.0005 || uOutStrength <= 0.0005) return 1.0;
    float kOut = clamp(wSum * uOutStrength, 0.0, 1.0);
    float kSun = clamp((uOutWeights.x + uOutWeights.y) / max(1e-4, wSum), 0.0, 1.0);
    float kCycCS = clamp(uOutCyclesMix, 0.0, 1.0);
    float s = -vW.z;
    float mul = 1.0;

    if (vW.y > 0.84 && vW.y < 2.82 && abs(N.x) > 0.55) {
      float ds = mix(mix(0.032, 0.072, kSun), mix(0.028, 0.064, kSun), kCycCS);
      float dy = mix(mix(0.048, 0.078, kSun), mix(0.044, 0.068, kSun), kCycCS);
      float pen = mix(mix(0.016, 0.012, kSun), mix(0.024, 0.015, kSun), kCycCS);
      float occ = 0.0;
      float darkTarget = mix(mix(0.56, 0.25, kSun), mix(0.66, 0.44, kSun), kCycCS);
      if (N.x > 0.5) {
        if (s > 20.30) {
          occ = evalBoxShadow2D(s + ds, vW.y + dy, 22.02, 1.84, 0.786, 0.847, pen);
        } else if (s < 12.5) {
          // BL Posters (s = 8.40, 10.32): tight 1.5 cm paper edge-AO in Cycles!
          float dsP = mix(-0.024, -0.014, kCycCS);
          float dyP = mix(0.056, 0.018, kCycCS);
          float penP = mix(0.015, 0.012, kCycCS);
          occ = max(
            evalBoxShadow2D(s + dsP, vW.y + dyP, 8.40, 1.86, 0.775, 0.825, penP),
            evalBoxShadow2D(s + dsP, vW.y + dyP, 10.32, 1.86, 0.757, 0.825, penP)
          );
          darkTarget = mix(0.48, 0.62, kCycCS);
        } else if (s < 19.95) {
          float dsC = mix(mix(0.028, 0.062, clamp(uOutWeights.y / max(1e-4, wSum), 0.0, 1.0)), ds, kCycCS);
          float dyC = mix(mix(0.052, 0.070, kSun), dy, kCycCS);
          float penC = mix(0.014, pen, kCycCS);
          occ = max(
            evalBoxShadow2D(s + dsC, vW.y + dyC, 14.91, 1.86, 0.613, 0.725, penC),
            max(
              evalBoxShadow2D(s + dsC, vW.y + dyC, 16.74, 1.86, 0.825, 0.880, penC),
              evalBoxShadow2D(s + dsC, vW.y + dyC, 18.64, 1.86, 0.680, 0.725, penC)
            )
          );
          darkTarget = mix(mix(0.52, 0.28, kSun), mix(0.66, 0.44, kSun), kCycCS);
        }
      } else {
        if (s > 11.0 && s < 19.95) {
          float dsR = mix(0.030, ds, kCycCS);
          float dyR = mix(0.058, dy, kCycCS);
          float penR2 = mix(0.015, pen, kCycCS);
          occ = max(
            evalBoxShadow2D(s + dsR, vW.y + dyR, 12.32, 1.86, 0.778, 0.825, penR2),
            max(
              evalBoxShadow2D(s + dsR, vW.y + dyR, 14.26, 1.86, 0.773, 0.825, penR2),
              evalBoxShadow2D(s + mix(0.034, ds, kCycCS), vW.y + dyR, 18.72, 1.86, 0.732, 0.825, penR2)
            )
          );
          darkTarget = mix(mix(0.54, 0.40, kSun), mix(0.66, 0.48, kSun), kCycCS);
        }
      }
      mul *= mix(1.0, darkTarget, occ);
    }

    if (vW.y > 1.90 && vW.y < 2.30 && abs(N.x) > 0.55) {
      float dScMin = 9.0;
      if (N.x > 0.5) {
        dScMin = min(min(abs(s - 5.66), abs(s - 11.61)), min(min(abs(s - 13.97), abs(s - 19.64)), abs(s - 23.38)));
      } else {
        dScMin = min(min(abs(s - 5.66), abs(s - 9.27)), min(min(abs(s - 17.51), abs(s - 19.71)), abs(s - 23.41)));
      }
      if (dScMin < 0.16) {
        float dySc = clamp((2.29 - vW.y) / 0.35, 0.0, 1.0);
        float halfWSc = mix(0.075, 0.135, dySc);
        float scOcc = (1.0 - smoothstep(halfWSc * 0.45, halfWSc, dScMin)) * sin(dySc * 3.14159) * (1.0 - 0.35 * dySc);
        mul *= mix(1.0, mix(0.83, 0.85, kCycCS), scOcc);
      }
    }

    return mix(1.0, mul, kOut);
  }

  float traceDualBiforaBeam(vec3 vW, vec3 N, vec3 raySide, vec3 rayEnd, float baseSoft, float penumbraRate, float leafAmt) {
    float s = -vW.z;
    if (s < 11.4) return 0.0;
    float sFeather = mix(smoothstep(13.6, 15.8, s), smoothstep(12.2, 14.2, s), clamp(leafAmt, 0.0, 1.0));
    if (sFeather <= 0.001) return 0.0;
    float beam = 0.0;

    float ndlR = smoothstep(-0.04, 0.24, dot(N, raySide));
    if (ndlR > 0.001 && raySide.x > 0.05 && vW.x < 1.05) {
      float tR = (1.31 - vW.x) / raySide.x;
      if (tR > 0.0) {
        float yHit = vW.y + raySide.y * tR;
        float sHit = s - raySide.z * tR;
        float sOrigin = mix(22.22, 22.26, clamp(leafAmt, 0.0, 1.0));
        float uScale  = mix(0.62, 0.92, clamp(leafAmt, 0.0, 1.0));
        float uR = (sHit - sOrigin) * uScale;
        float leafR = 1.0;
        float pinholeScallop = 0.0;
        if (leafAmt > 0.001) {
          leafR = mix(1.0, evalBotanicalKomorebi(vec2(uR, yHit), tR, uOutTime, 0.06), leafAmt);
          float ocProtect = 1.0 - smoothstep(0.15, 0.34, length(vec2(uR, yHit - 3.175)));
          pinholeScallop = 0.014 * leafR * leafAmt * (1.0 - 0.85 * ocProtect);
        }
        float softR = baseSoft + penumbraRate * tR + pinholeScallop;
        float trR = evalBiforaTracery(vec2(uR, yHit), softR) * leafR;
        if (leafAmt > 0.001 && vW.y > 0.02 && uR > 0.58 && uR < 2.96 && yHit > 0.66 && yHit < 3.30) {
          float spanEnv = smoothstep(0.58, 0.84, uR) * smoothstep(2.96, 1.48, uR)
                        * smoothstep(0.66, 0.94, yHit) * (1.0 - smoothstep(2.74, 3.28, yHit));
          float extLeaf = evalBotanicalKomorebi(vec2(uR * 0.42 + 0.24, yHit * 0.52), tR * 1.10, uOutTime * 0.94, 0.22);
          trR = max(trR, 0.88 * spanEnv * extLeaf * leafAmt);
        }
        if (trR > 0.001) {
          float archPass = 1.0;
          if (s < 20.08 && abs(raySide.z) > 0.02) {
            float tArch = (-20.12 - vW.z) / raySide.z;
            if (tArch > 0.0 && tArch < tR) {
              float xA = vW.x + raySide.x * tArch;
              float yA = vW.y + raySide.y * tArch;
              float archHalf = 1.22;
              float archR = length(vec2(xA / archHalf, max(0.0, yA - 2.96) / 0.74));
              archPass = (yA < 2.96)
                ? (1.0 - smoothstep(archHalf - 0.07, archHalf + 0.04, abs(xA)))
                : (1.0 - smoothstep(0.94, 1.04, archR));
            }
          }
          float frameShR = evalFrameCastShadow(vW, raySide);
          beam = max(beam, trR * archPass * frameShR * ndlR * exp(-tR * 0.028));
        }
      }
    }

    float ndlE = smoothstep(-0.02, 0.20, dot(N, rayEnd));
    if (ndlE > 0.001 && rayEnd.z < -0.05 && s < 23.94) {
      float tE = (-23.98 - vW.z) / rayEnd.z;
      if (tE > 0.0) {
        float xHit = vW.x + rayEnd.x * tE;
        float yHit = vW.y + rayEnd.y * tE;
        float leafE = 1.0;
        float pinholeScallopE = 0.0;
        if (leafAmt > 0.001) {
          leafE = mix(1.0, evalBotanicalKomorebi(vec2(xHit, yHit), tE * 0.70, uOutTime * 0.92, -0.05), leafAmt);
          pinholeScallopE = 0.015 * leafE * leafAmt;
        }
        float softE = baseSoft + penumbraRate * 0.55 * tE + pinholeScallopE;
        float trE = evalBiforaTracery(vec2(xHit, yHit), softE) * leafE;
        if (trE > 0.001) {
          float archPassE = 1.0;
          if (s < 20.08) {
            float tArch = (-20.12 - vW.z) / rayEnd.z;
            if (tArch > 0.0 && tArch < tE) {
              float xA = vW.x + rayEnd.x * tArch;
              float yA = vW.y + rayEnd.y * tArch;
              float archHalf = 1.22;
              float archR = length(vec2(xA / archHalf, max(0.0, yA - 2.96) / 0.74));
              archPassE = (yA < 2.96)
                ? (1.0 - smoothstep(archHalf - 0.07, archHalf + 0.04, abs(xA)))
                : (1.0 - smoothstep(0.94, 1.04, archR));
            }
          }
          float frameShE = evalFrameCastShadow(vW, rayEnd);
          beam = max(beam, trE * archPassE * frameShE * ndlE * exp(-tE * 0.026));
        }
      }
    }

    return beam * sFeather;
  }

  const vec3 OL_C03_SIDE = vec3(0.9265, 0.3080, -0.2165);
  const vec3 OL_C03_END  = vec3(0.1960, 0.1960, -0.9608);
  const vec3 OL_C02_SIDE = vec3(0.8660, 0.3520, -0.3550);
  const vec3 OL_C02_END  = vec3(0.0680, 0.3720, -0.9257);
  const vec3 OL_C02_P4   = vec3(0.7602, 0.4650,  0.4536);

  float tracePanel4KomorebiRay(vec3 vW, vec3 N, float tSec) {
    float s = -vW.z;
    if (s < 4.5 || s > 10.4 || vW.x > 0.28 || vW.y > 1.62) return 0.0;
    float ndl = smoothstep(-0.02, 0.22, dot(N, OL_C02_P4));
    if (ndl <= 0.001) return 0.0;
    float tP4 = (1.76 - vW.x) / OL_C02_P4.x;
    if (tP4 <= 0.0) return 0.0;
    float ySrc = vW.y + OL_C02_P4.y * tP4;
    float sSrc = s - OL_C02_P4.z * tP4;
    float uAlong  = (sSrc - 5.62) / 1.54;
    float dyRay   = ySrc - (2.78 - 0.52 * (sSrc - 5.62));
    float vAcross = dyRay / ((dyRay < 0.0) ? 1.62 : 0.52);
    float rEll = length(vec2(uAlong * 0.80, vAcross));
    float env = 1.0 - smoothstep(0.52, 0.96, rEll);
    if (env <= 0.001) return 0.0;
    float bHi = (vW.y < 0.04) ? 0.23 : 0.165;
    float softBands = (1.0 - 0.84 * (1.0 - smoothstep(0.045, bHi, abs(uAlong + 0.28 * vAcross + 0.38))))
                    * (1.0 - 0.82 * (1.0 - smoothstep(0.045, bHi, abs(uAlong + 0.25 * vAcross - 0.04))))
                    * (1.0 - 0.80 * (1.0 - smoothstep(0.045, bHi, abs(uAlong + 0.22 * vAcross - 0.44))));
    float dapple = mix(0.20, 1.0, evalBotanicalKomorebi(vec2(uAlong * 0.42, vAcross * 0.40 + 1.85), tP4 * 0.95, tSec * 0.88, 0.18));
    float floorFade = (vW.y < 0.04)
      ? (smoothstep(0.24, -0.34, vW.x) * smoothstep(4.5, 5.4, s) * (1.0 - smoothstep(8.9, 10.2, s)))
      : 1.0;
    return env * softBands * dapple * floorFade * ndl;
  }

  vec4 evalOutsideWallMod(vec3 vW, vec3 N) {
    float wSum = dot(uOutWeights, vec4(1.0));
    if (wSum <= 0.0005 || uOutStrength <= 0.0005) return vec4(0.0, 0.0, 0.0, 1.0);

    float w2 = uOutWeights.x;
    float w3 = uOutWeights.y;
    float w4 = uOutWeights.z;
    float w5 = uOutWeights.w;
    float s = -vW.z;

    float portalOpen   = smoothstep(19.90, 20.58, s);
    float archSpandrel = smoothstep(0.45, 0.85, N.z) * step(19.75, s) * (1.0 - portalOpen);
    float archApproach = smoothstep(15.50, 20.10, s) * (1.0 - archSpandrel);
    float corrVignette = mix(0.76, 1.0, smoothstep(10.5, 18.5, s));
    float foyerDepth   = 1.0 - smoothstep(3.80, 8.20, s);
    float entFanGlow   = (1.0 - smoothstep(3.70, 6.80, s)) * smoothstep(1.85, 3.55, vW.y) * (1.0 - smoothstep(0.65, 1.45, abs(vW.x)));
    float faceRightWin = clamp(N.x * 0.82 + 0.22, 0.0, 1.0);
    float onLeftAlcWall = portalOpen * smoothstep(0.35, 0.85, N.x);
    float isEndWallIn  = smoothstep(0.5, 0.9, N.z) * step(23.60, s);
    float flBounce     = exp(-vW.y * 0.72) * smoothstep(17.4, 21.0, s);

    float ceilRef   = (s > 20.25) ? 4.82 : 5.06;
    float photoDado = 0.05 * (1.0 - smoothstep(0.28, 1.15, vW.y));
    float photoCove = 0.075 * smoothstep(ceilRef - 1.10, ceilRef, vW.y);
    float corrDrop  = 0.06 * foyerDepth + photoDado + photoCove + 0.07 * archSpandrel;

    vec3 addIrr = vec3(0.0);
    float ambAcc = 0.0;

    if (w4 > 0.001) {
      float dEnd = max(0.0, 23.92 - s);
      float skyWrap  = exp(-dEnd / 4.2) * (0.48 + 0.52 * smoothstep(0.3, 3.3, vW.y)) * portalOpen;
      float rWinWrap = exp(-abs(s - 22.02) / 2.65) * faceRightWin * portalOpen;
      vec3 alcNorth  = vec3(0.56, 0.84, 1.14);
      vec3 corrStone = vec3(1.06, 1.00, 0.91);
      addIrr += w4 * (alcNorth * (0.24 * rWinWrap + 0.14 * skyWrap * (1.0 - 0.42 * isEndWallIn) * (0.52 + 0.48 * faceRightWin) + 0.035 * flBounce)
                    + corrStone * (0.032 * archApproach + 0.030 * entFanGlow));
      float c04Corr = (0.59 - corrDrop * 0.80) * corrVignette + 0.04 * archApproach;
      float c04Alc  = 0.67 + 0.05 * faceRightWin - 0.10 * isEndWallIn - 0.02 * photoCove;
      float c04Amb  = clamp(mix(c04Corr, c04Alc, portalOpen), 0.34, 0.88);
      ambAcc += w4 * (c04Amb - 1.0);
    }

    if (w5 > 0.001) {
      float dEnd = max(0.0, 23.92 - s);
      float haloEnd   = exp(-dEnd / 1.25) * exp(-max(0.0, abs(vW.x) - 0.72) / 0.74) * portalOpen;
      float haloSide  = exp(-max(0.0, 1.24 - vW.x) / 1.00) * exp(-abs(s - 22.02) / 1.30) * portalOpen;
      float pearlSide = exp(-abs(s - 22.02) / 2.85) * (0.44 + 0.56 * faceRightWin) * portalOpen;
      vec3 linenTint  = vec3(1.16, 1.05, 0.89);
      addIrr += w5 * (linenTint * (0.17 * pearlSide + 0.21 * (haloEnd + haloSide) + 0.10 * flBounce)
                    + vec3(1.12, 1.02, 0.88) * (0.055 * archApproach + 0.062 * entFanGlow));
      float c05Corr = (0.74 - corrDrop * 0.52) * mix(0.92, 1.0, smoothstep(8.5, 16.5, s)) + 0.04 * archApproach;
      float c05Alc  = mix(0.71 - 0.05 * isEndWallIn, 0.67, onLeftAlcWall) - 0.02 * photoCove;
      float c05Amb  = clamp(mix(c05Corr, c05Alc, portalOpen), 0.56, 0.86);
      ambAcc += w5 * (c05Amb - 1.0);
    }

    if (w3 > 0.001) {
      float beam3 = traceDualBiforaBeam(vW, N, OL_C03_SIDE, OL_C03_END, 0.009, 0.0050, 0.0);
      float alcHoney = exp(-abs(s - 22.02) / 3.8) * portalOpen * (1.0 - 0.68 * onLeftAlcWall);
      vec3 goldSun = vec3(2.30, 1.00, 0.20);
      vec3 goldAmb = vec3(1.34, 0.75, 0.26);
      vec3 bA3 = goldSun * (1.88 * beam3);
      bA3 *= 1.0 / (1.0 + 0.24 * dot(bA3, vec3(0.2126, 0.7152, 0.0722)));
      addIrr += w3 * (bA3 + goldAmb * (0.16 * alcHoney + 0.15 * flBounce * (1.0 - 0.42 * onLeftAlcWall) + 0.052 * archApproach + 0.062 * entFanGlow));
      float rightShade3 = 0.045 * smoothstep(0.30, 0.85, -N.x) * (1.0 - portalOpen);
      float c03Corr = (0.53 - corrDrop * 0.80 - rightShade3) * corrVignette + 0.04 * archApproach;
      float c03EndWrap = exp(-max(0.0, 23.92 - s) / 0.85);
      float c03Alc  = mix(0.46 - 0.03 * isEndWallIn, mix(0.28, 0.42, c03EndWrap), onLeftAlcWall);
      float c03Amb  = clamp(mix(c03Corr, c03Alc, portalOpen), 0.26, 0.68);
      ambAcc += w3 * (c03Amb - 1.0);
    }

    if (w2 > 0.001) {
      float beam2 = traceDualBiforaBeam(vW, N, OL_C02_SIDE, OL_C02_END, 0.012, 0.0036, 0.98);
      float p4Ray = tracePanel4KomorebiRay(vW, N, uOutTime);
      vec3 komoSun = vec3(2.14, 1.72, 0.94);
      vec3 courtyardWarm = vec3(1.22, 1.02, 0.74);
      vec3 bAlc2 = komoSun * (2.10 * beam2);
      bAlc2 *= 1.0 / (1.0 + 0.24 * dot(bAlc2, vec3(0.2126, 0.7152, 0.0722)));
      vec3 bP4   = vec3(1.94, 1.46, 0.70) * (1.16 * p4Ray);
      bP4   *= 1.0 / (1.0 + 0.26 * dot(bP4, vec3(0.2126, 0.7152, 0.0722)));
      float endCornerWrap = exp(-max(0.0, 23.92 - s) / 0.90);
      float courtFill2 = 0.10 * portalOpen * (1.0 - 0.82 * onLeftAlcWall * (1.0 - 0.65 * endCornerWrap)) + 0.10 * flBounce * (1.0 - 0.50 * onLeftAlcWall);
      addIrr += w2 * (bAlc2 + bP4 + courtyardWarm * (courtFill2 + 0.040 * archApproach + 0.048 * entFanGlow));
      float c02Cavity = 0.075 * smoothstep(ceilRef - 1.45, ceilRef, vW.y) * max(foyerDepth, (1.0 - smoothstep(11.0, 15.2, s)) * step(9.5, s));
      float rightShade2 = 0.045 * smoothstep(0.30, 0.85, -N.x) * (1.0 - portalOpen);
      float c02Corr = (0.47 - corrDrop * 0.74 - c02Cavity - rightShade2) * corrVignette + 0.04 * archApproach;
      float c02Alc  = mix(0.49 - 0.06 * isEndWallIn, mix(0.26, 0.45, endCornerWrap), onLeftAlcWall);
      float c02Amb  = clamp(mix(c02Corr, c02Alc, portalOpen), 0.23, 0.66);
      ambAcc += w2 * (c02Amb - 1.0);
    }

    float ambScale = 1.0 + ambAcc / max(1.0, wSum);
    return vec4(addIrr * uOutStrength, mix(1.0, ambScale, clamp(uOutStrength, 0.0, 1.0)));
  }

  vec3 evalOutsideAmbGradeDelta(vec3 asTerm, float sCoord) {
    float k4 = clamp(uOutWeights.z * uOutStrength, 0.0, 1.0);
    float k5 = clamp(uOutWeights.w * uOutStrength, 0.0, 1.0);
    float k3 = clamp(uOutWeights.y * uOutStrength, 0.0, 1.0);
    float k2 = clamp(uOutWeights.x * uOutStrength, 0.0, 1.0);
    if (k4 <= 0.0005 && k5 <= 0.0005 && k3 <= 0.0005 && k2 <= 0.0005) return vec3(0.0);
    float lum = dot(asTerm, vec3(0.2126, 0.7152, 0.0722));
    float alcZone = smoothstep(19.4, 21.0, sCoord);
    vec3 tgt4 = mix(vec3(1.10, 1.00, 0.89), vec3(0.90, 0.99, 1.09), alcZone);
    vec3 d4   = (vec3(lum) * tgt4 - asTerm) * (mix(0.72, 0.60, alcZone) * k4);
    vec3 tgt5 = mix(vec3(1.28, 1.01, 0.73), vec3(1.20, 1.01, 0.80), alcZone);
    vec3 d5   = (vec3(lum) * tgt5 - asTerm) * (mix(0.76, 0.62, alcZone) * k5);
    vec3 tgt3 = mix(vec3(1.62, 0.92, 0.44), vec3(1.52, 0.92, 0.46), alcZone);
    vec3 d3   = (vec3(lum) * tgt3 - asTerm) * (0.91 * k3);
    vec3 tgt2 = mix(vec3(1.30, 0.98, 0.68), vec3(1.22, 1.00, 0.76), alcZone);
    vec3 d2   = (vec3(lum) * tgt2 - asTerm) * (mix(0.80, 0.72, alcZone) * k2);
    return d4 + d5 + d3 + d2;
  }

  vec3 evalOutsideSconceDelta(vec3 sconceIrr, float portalSc) {
    float k4 = clamp(uOutWeights.z * uOutStrength, 0.0, 1.0);
    float k5 = clamp(uOutWeights.w * uOutStrength, 0.0, 1.0);
    float k3 = clamp(uOutWeights.y * uOutStrength, 0.0, 1.0);
    float k2 = clamp(uOutWeights.x * uOutStrength, 0.0, 1.0);
    if (k4 <= 0.0005 && k5 <= 0.0005 && k3 <= 0.0005 && k2 <= 0.0005) return vec3(0.0);
    vec3 mult4 = mix(vec3(1.10, 1.19, 1.12), vec3(0.93, 1.27, 1.74), portalSc);
    vec3 d4 = sconceIrr * (mult4 - vec3(1.0)) * k4;
    vec3 d5 = sconceIrr * (vec3(1.12, 1.12, 1.02) - vec3(1.0)) * k5;
    vec3 d3 = sconceIrr * (vec3(1.24, 1.02, 0.72) - vec3(1.0)) * k3;
    vec3 d2 = sconceIrr * (vec3(1.18, 1.05, 0.82) - vec3(1.0)) * k2;
    return d4 + d5 + d3 + d2;
  }

  vec3 evalOutsideFloorAdd(vec3 vW) {
    float wSum = dot(uOutWeights, vec4(1.0));
    if (wSum <= 0.0005 || uOutStrength <= 0.0005) return vec3(0.0);

    float w2 = uOutWeights.x;
    float w3 = uOutWeights.y;
    float w4 = uOutWeights.z;
    float w5 = uOutWeights.w;
    float s = -vW.z;

    vec3 upN = vec3(0.0, 1.0, 0.0);
    float dEnd = max(0.0, 23.92 - s);
    float archAperture = (s > 20.05) ? 1.0 : ((1.0 - smoothstep(0.98, 1.42, abs(vW.x))) * smoothstep(11.2, 20.05, s));
    vec3 flAdd = vec3(0.0);

    if (w4 > 0.001 && s > 14.5) {
      float dxSide4 = max(0.0, 1.24 - vW.x);
      float poolEnd  = exp(-dEnd / 4.2) * exp(-(vW.x * vW.x) / 1.45) * smoothstep(15.0, 19.2, s);
      float poolSide = exp(-abs(s - 22.02) / 2.4) * exp(-(dxSide4 * dxSide4) / 1.75) * smoothstep(19.8, 20.4, s);
      flAdd += w4 * vec3(0.72, 0.90, 1.14) * (0.05 * poolEnd * archAperture + 0.04 * poolSide);
    }

    if (w5 > 0.001 && s > 10.8) {
      float dxSide5 = max(0.0, 1.24 - vW.x);
      float poolEnd  = exp(-dEnd / 5.4) * exp(-(vW.x * vW.x) / 1.50);
      float poolSide = exp(-abs(s - 22.02) / 2.55) * exp(-(dxSide5 * dxSide5) / 1.95) * smoothstep(19.8, 20.4, s);
      flAdd += w5 * vec3(1.24, 1.12, 0.92) * (0.16 * poolEnd * archAperture + 0.10 * poolSide);
    }

    if (w3 > 0.001 && s > 13.4) {
      float beam3 = traceDualBiforaBeam(vW, upN, OL_C03_SIDE, OL_C03_END, 0.008, 0.0042, 0.0);
      float dx3 = vW.x + 0.28;
      float warmSpill = exp(-dEnd / 5.2) * archAperture * exp(-(dx3 * dx3) / 1.40) * smoothstep(13.8, 16.5, s);
      flAdd += w3 * (vec3(3.65, 1.78, 0.38) * beam3 + vec3(1.18, 0.70, 0.24) * (0.20 * warmSpill));
    }

    if (w2 > 0.001) {
      float beam2 = (s > 12.0) ? traceDualBiforaBeam(vW, upN, OL_C02_SIDE, OL_C02_END, 0.032, 0.0082, 0.98) : 0.0;
      float env2  = (s > 14.5) ? traceDualBiforaBeam(vW, upN, OL_C02_SIDE, OL_C02_END, 0.120, 0.0100, 0.0) : 0.0;
      float entFl = tracePanel4KomorebiRay(vW, upN, uOutTime);
      vec3 flP4 = vec3(3.45, 2.55, 1.18) * entFl;
      flP4 *= 1.0 / (1.0 + 0.22 * dot(flP4, vec3(0.2126, 0.7152, 0.0722)));
      flAdd += w2 * (vec3(2.85, 1.98, 0.82) * beam2 + vec3(0.46, 0.34, 0.18) * env2 + flP4);
    }

    return flAdd * uOutStrength;
  }

  vec3 evalOutsideFloorSpec(vec3 vW, vec3 N, vec3 V, float specOcc, float NoV) {
    float wSum = dot(uOutWeights, vec4(1.0));
    if (wSum <= 0.0005 || uOutStrength <= 0.0005) return vec3(0.0);
    float s = -vW.z;

    float w2 = uOutWeights.x;
    float w3 = uOutWeights.y;
    float w4 = uOutWeights.z;
    float w5 = uOutWeights.w;

    vec3 upN = vec3(0.0, 1.0, 0.0);
    float occClear = mix(0.48, 1.0, specOcc);
    float plankGrain = 0.70 + 0.62 * smoothstep(-0.075, 0.075, N.x);
    vec3 sp = vec3(0.0);

    if ((w4 > 0.001 || w5 > 0.001) && s > 10.5) {
      vec3 N_refl = normalize(mix(upN, N, 0.22));
      vec3 R = reflect(-V, N_refl);
      if (R.z < -0.08) {
        float tWin = (-23.98 - vW.z) / R.z;
        if (tWin > 0.0) {
          float xWin = vW.x + R.x * tWin;
          float winX = exp(-(xWin * xWin) / 1.32);
          float yWin4 = (max(0.0, R.y) + 0.24) * tWin + 0.48;
          float winY4 = smoothstep(0.15, 0.80, yWin4) * (1.0 - smoothstep(3.60, 5.20, yWin4));
          float yWin5 = (max(0.0, R.y) + 0.16) * tWin + 0.34;
          float winY5 = smoothstep(0.12, 0.80, yWin5) * (1.0 - smoothstep(3.50, 5.00, yWin5));
          float archClip = 1.0;
          if (s < 20.08) {
            float tA = (-20.12 - vW.z) / R.z;
            float xA = vW.x + R.x * max(0.0, tA);
            archClip = 1.0 - smoothstep(0.98, 1.44, abs(xA));
          }
          float sideRefl4 = smoothstep(19.4, 20.4, s) * exp(-abs(s - 22.02) / 2.5) * exp(-max(0.0, 1.24 - vW.x) / 1.65) * 0.35;
          float sideRefl5 = smoothstep(19.6, 20.5, s) * exp(-abs(s - 22.02) / 2.3) * exp(-max(0.0, 1.24 - vW.x) / 1.55) * 0.36;
          float grazeF4   = pow(max(1.0 - NoV, 1e-4), 5.0);
          float grazeF5   = pow(max(1.0 - NoV, 1e-4), 4.5);
          float reflMask4 = (winX * winY4 * archClip * smoothstep(15.2, 19.2, s) + sideRefl4) * grazeF4 * occClear;
          float reflMask5 = (winX * winY5 * archClip * smoothstep(11.4, 16.5, s) + sideRefl5) * grazeF5 * occClear;
          sp += w4 * vec3(0.68, 0.92, 1.22) * (1.85 * reflMask4);
          sp += w5 * vec3(1.50, 1.34, 1.05) * (1.75 * reflMask5);
        }
      }
    }
    if (w4 > 0.001 && s < 9.2) {
      float entFadeS = smoothstep(3.72, 4.08, s) * exp(-max(0.0, s - 3.90) / 2.65) * (1.0 - smoothstep(7.8, 9.1, s));
      float entFadeX = exp(-(vW.x * vW.x) / 0.82);
      float entGraze = pow(max(1.0 - NoV, 1e-4), 3.8) * smoothstep(0.05, 0.35, -V.z);
      sp += w4 * vec3(0.62, 0.86, 1.18) * (0.78 * entFadeS * entFadeX * entGraze * occClear);
    }

    if (w3 > 0.001 && s > 13.4) {
      float bFl3 = traceDualBiforaBeam(vW, upN, OL_C03_SIDE, OL_C03_END, 0.008, 0.0042, 0.0);
      vec3 H3 = normalize(OL_C03_END + V);
      float aniso3 = exp(-((H3.x - N.x * 1.35) * (H3.x - N.x * 1.35)) / 0.055 - (H3.z * H3.z) / 0.44) * max(H3.y, 0.0);
      float glint3 = pow(max(dot(N, H3), 1e-4), 10.0);
      sp += w3 * bFl3 * vec3(1.52, 0.88, 0.28) * (0.52 + 1.18 * aniso3 * plankGrain + 0.58 * glint3) * occClear;
    }

    if (w2 > 0.001) {
      float bFl2 = (s > 12.0) ? traceDualBiforaBeam(vW, upN, OL_C02_SIDE, OL_C02_END, 0.032, 0.0082, 0.98) : 0.0;
      float eFl2 = tracePanel4KomorebiRay(vW, upN, uOutTime);
      vec3 H2 = normalize(OL_C02_END + V);
      float aniso2 = exp(-((H2.x - N.x * 1.35) * (H2.x - N.x * 1.35)) / 0.060 - (H2.z * H2.z) / 0.46) * max(H2.y, 0.0);
      vec3 HP4 = normalize(OL_C02_P4 + V);
      float glintP4 = pow(max(dot(N, HP4), 1e-4), 8.0);
      sp += w2 * (bFl2 * vec3(1.18, 0.90, 0.44) * (0.50 + 1.12 * aniso2 * plankGrain)
                + eFl2 * vec3(1.24, 0.96, 0.50) * (0.64 + 0.72 * glintP4 * plankGrain)) * occClear;
    }

    return sp * uOutStrength;
  }

  float evalCanvasRabbetSunMask(vec3 vArtW, vec3 ray) {
    float s = -vArtW.z;
    if (s > 20.5) {
      float dTop = 2.650 - vArtW.y;
      float dSunSide = (ray.z < 0.0) ? (22.770 - s) : (s - 21.270);
      float lipT = smoothstep(0.002, 0.024, dTop);
      float lipS = (abs(ray.z) > 0.08) ? smoothstep(0.002, 0.022, dSunSide) : 1.0;
      return lipT * lipS;
    }
    float hY = (abs(s - 16.74) < 0.90) ? 0.844 : 0.690;
    float sC = (s < 15.8) ? 14.91 : ((s < 17.75) ? 16.74 : 18.64);
    float hS = (abs(s - 16.74) < 0.90) ? 0.790 : ((s < 15.8) ? 0.578 : 0.645);
    float dTopC = (1.86 + hY) - vArtW.y;
    float dFarC = (sC + hS) - s;
    return smoothstep(0.002, 0.020, dTopC) * smoothstep(0.002, 0.022, dFarC);
  }

  // Unified Museum Oil-Canvas, Eye-Plate & Printed-Poster Illumination:
  // B1: Uses 100% olPbrNeutralTone when uOutCyclesMix > 0.0005 (0% AgX desat; 0-LSB V9 untouched!).
  // Cycle 4 §2.4: Separated ambient shade + linear direct-sun irradiance -> exact 50% midpoint linearity across C0x<->C0y & V9<->C0x!
  vec3 evalOutsideArtColor(vec3 baseLin, vec3 vArtW, float posterMode, sampler2D leafTex) {
    vec3 dArtX = dFdx(vArtW);
    vec3 dArtY = dFdy(vArtW);
    float wSum = dot(uOutWeights, vec4(1.0));
    if (wSum <= 0.0005 && uArtPop <= 0.0005 && uOutCyclesMix <= 0.0005) {
      return clamp(baseLin, 0.0, 1.0);
    }

    if (posterMode > 0.5 && wSum > 0.0005 && uOutStrength > 0.0005) {
      float sP = -vArtW.z;
      float kOut = clamp(wSum * uOutStrength, 0.0, 1.0);
      vec3 paperTint = (uOutWeights.z * vec3(0.99, 0.995, 1.00)
                      + uOutWeights.w * vec3(1.05, 1.00, 0.91)
                      + uOutWeights.y * vec3(1.18, 0.88, 0.56)
                      + uOutWeights.x * vec3(1.06, 0.97, 0.82)) / max(wSum, 1e-4);
      float basePaper = (0.46 * uOutWeights.z + 0.62 * uOutWeights.w + 0.41 * uOutWeights.y + 0.43 * uOutWeights.x) / max(wSum, 1e-4);
      vec3 paperMul;
      if (posterMode < 1.5) {
        float dSc = length(vec2(sP - 9.27, (vArtW.y - 2.44) * 1.05));
        float scCone = exp(-(dSc * dSc) / 0.78);
        vec3 scPaperCol = (uOutWeights.z * vec3(1.22, 0.98, 0.70)
                         + uOutWeights.w * vec3(1.22, 0.96, 0.66)
                         + uOutWeights.y * vec3(1.30, 0.90, 0.50)
                         + uOutWeights.x * vec3(1.24, 0.94, 0.60)) / max(wSum, 1e-4);
        paperMul = paperTint * (basePaper * 0.92) + scPaperCol * (0.32 * scCone);
      } else {
        float topFill = 0.88 + 0.15 * smoothstep(0.95, 1.85, vArtW.y);
        paperMul = paperTint * ((basePaper * 0.90) * topFill);
      }
      vec3 pLin = mix(baseLin, baseLin * paperMul, kOut);
      return (uOutCyclesMix > 0.0005) ? mix(clamp(pLin, 0.0, 1.0), olPbrNeutralTone(pLin), clamp(uOutCyclesMix, 0.0, 1.0)) : clamp(pLin, 0.0, 1.0);
    }

    float pop = 1.0 + uArtPop;
    vec3 artLit = baseLin * pop;
    if (wSum > 0.0005 && uOutStrength > 0.0005) {
      float w2 = uOutWeights.x;
      float w3 = uOutWeights.y;
      float w4 = uOutWeights.z;
      float w5 = uOutWeights.w;
      float s = -vArtW.z;

      if (s > 12.5 && vArtW.x < -1.10) {
        float kS = clamp(uOutStrength, 0.0, 1.4);
        float wNorm = max(wSum, 1.0); // NEVER divide out w3/w2 < 1 during V9<->C0x lerp!
        float f4 = w4 / wNorm, f5 = w5 / wNorm, f3 = w3 / wNorm, f2 = w2 / wNorm;
        bool isAlcove003 = (s > 20.3);

        vec3 shade3 = isAlcove003
          ? vec3(0.68, 0.58, 0.46)
          : mix(vec3(0.98, 0.95, 0.90), vec3(0.76, 0.68, 0.58), smoothstep(15.0, 16.2, s));
        vec3 shade2 = isAlcove003 ? vec3(0.86, 0.83, 0.77) : vec3(0.98, 0.98, 0.97);
        vec3 mul4   = isAlcove003 ? vec3(0.98, 1.02, 1.06) : vec3(1.0);
        vec3 mul5   = isAlcove003 ? vec3(1.03, 1.01, 0.98) : vec3(1.0);
        float corrBoost3 = (!isAlcove003 && s > 14.5 && s < 19.5) ? 1.48 : 1.0;

        vec3 ambMul = vec3(1.0)
          + f4 * (mul4 - vec3(1.0))
          + f5 * (mul5 - vec3(1.0))
          + f3 * (shade3 - vec3(1.0))
          + f2 * (shade2 - vec3(1.0));
        vec3 ambAdd = isAlcove003
          ? (f4 * vec3(0.010, 0.016, 0.024) + f5 * vec3(0.018, 0.016, 0.012)) * kS
          : vec3(0.0);

        vec3 sunMul = vec3(0.0);
        vec3 sunAdd = vec3(0.0);
        vec3 sMul2 = vec3(1.06, 0.95, 0.62);
        vec3 sAdd2 = vec3(0.185, 0.160, 0.085);
        vec3 sMul3 = vec3(1.22, 0.80, 0.26) * corrBoost3;
        vec3 sAdd3 = vec3(0.220, 0.115, 0.018) * corrBoost3;
        float soft2Art = isAlcove003 ? 1.65 : 1.0;
        if (f2 > 0.001 && f3 > 0.001) {
          float f23 = f2 + f3;
          float tSun = clamp(f3 / f23, 0.0, 1.0);
          float leafMix = pow(clamp(1.0 - tSun * 1.45, 0.0, 1.0), 2.0);
          float m23a = clamp(4.0 * tSun * (1.0 - tSun), 0.0, 1.0);
          float softMix = mix(soft2Art, 0.95, tSun) + 2.4 * m23a;
          float cloudDipA = 1.0 - 0.68 * m23a;
          vec3 lEndMix  = normalize(mix(L_END_C02_W, L_END_C03, tSun));
          vec3 lSideMix = normalize(mix(L_SIDE_C02, L_SIDE_C03, tSun));
          vec2 mMix = evalUnifiedBiforaMask(vArtW, lEndMix, lSideMix, leafMix, softMix, 0.0, dArtX, dArtY, leafTex);
          float bMix = max(
            mMix.x * evalCanvasRabbetSunMask(vArtW, lEndMix),
            mMix.y * evalCanvasRabbetSunMask(vArtW, lSideMix)
          );
          sunMul += f23 * mix(sMul2, sMul3, tSun) * (bMix * cloudDipA * kS);
          sunAdd += f23 * mix(sAdd2, sAdd3, tSun) * (bMix * cloudDipA * kS);
        } else {
          if (f3 > 0.001) {
            vec2 m3 = evalUnifiedBiforaMask(vArtW, L_END_C03, L_SIDE_C03, 0.0, 0.95, 0.0, dArtX, dArtY, leafTex);
            float b3 = max(
              m3.x * evalCanvasRabbetSunMask(vArtW, L_END_C03),
              m3.y * evalCanvasRabbetSunMask(vArtW, L_SIDE_C03)
            );
            sunMul += f3 * sMul3 * (b3 * kS);
            sunAdd += f3 * sAdd3 * (b3 * kS);
          }
          if (f2 > 0.001) {
            vec2 m2 = evalUnifiedBiforaMask(vArtW, L_END_C02_W, L_SIDE_C02, 1.0, soft2Art, 0.0, dArtX, dArtY, leafTex);
            float b2 = max(
              m2.x * evalCanvasRabbetSunMask(vArtW, L_END_C02_W),
              m2.y * evalCanvasRabbetSunMask(vArtW, L_SIDE_C02)
            );
            sunMul += f2 * sMul2 * (b2 * kS);
            sunAdd += f2 * sAdd2 * (b2 * kS);
          }
        }

        artLit = artLit * (ambMul + sunMul) + ambAdd + sunAdd;
      }
    }

    vec3 legacyRoll = mix(artLit, vec3(0.84) + 0.156 * (vec3(1.0) - exp(-max(artLit - vec3(0.84), vec3(0.0)) / 0.26)), step(vec3(0.84), artLit));
    vec3 rolled = (uOutCyclesMix > 0.0005)
      ? mix(legacyRoll, olPbrNeutralTone(artLit), clamp(uOutCyclesMix, 0.0, 1.0))
      : legacyRoll;
    float kRoll = clamp(max(max(wSum * uOutStrength, uArtPop), uOutCyclesMix) * 20.0, 0.0, 1.0);
    return clamp(mix(artLit, rolled, kRoll), 0.0, 1.0);
  }
`;
