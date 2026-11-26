// Multi-Palette Kubelka-Munk Wall Colour Awakening (`hk02/paint.js`):
// Compatible with BOTH the Cycles-baked `HK02` room (`room_walls`) AND live real-time fallback walls (`M.wall`)!
//
// Modes (`uPaintMode`):
//   1 = Cool Jewel Mineral ★ (Cobalt, Cerulean, Celadon-Jade, Soft Rose-Carmine & Saffron — restores the cool multi-hue palette!)
//   2 = Warm Mineral Fresco  (Dry-brush limewash skipping over raised plaster sand peaks)
//   3 = Soft Shadow Tint     (Sunlit patches stay 100% crisp HK02 white; only shaded plaster takes delicate colour)

import * as THREE from 'three';

const ART_PX = {
  '003': [2036, 2200], '010': [2054, 2200], '006': [1939, 2200],
  '085': [2059, 2200], '086': [2069, 2200], '087': [2011, 2200], '090': [2058, 2200],
};
function localArtSize(a) {
  const px = ART_PX[a.id] || [2050, 2200];
  return { w: a.w, h: a.w * px[1] / px[0] };
}

function makeTinyPlaceholderTex() {
  const d = new Uint8Array(4 * 4 * 4).fill(128);
  const t = new THREE.DataTexture(d, 4, 4, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

let cachedPoreTex = null;
let cachedBrushTex = null;

export function makePoreTexture() {
  if (cachedPoreTex) return cachedPoreTex;
  const N = 256, data = new Uint8Array(N * N * 4);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const h2 = (ix, iy, seed) => { const x = ((ix % 64) + 64) % 64, y = ((iy % 64) + 64) % 64; const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };
  const vn = (ux, uy, f, seed) => {
    const px = ux * f, py = uy * f, ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), w = v => ((v % f) + f) % f;
    const a = h2(w(ix), w(iy), seed), b = h2(w(ix + 1), w(iy), seed), c = h2(w(ix), w(iy + 1), seed), d = h2(w(ix + 1), w(iy + 1), seed);
    return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
  };
  const cell = (ux, uy, f, seed) => {
    const px = ux * f, py = uy * f, ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy;
    let dm = 8;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = (((ix + dx) % f) + f) % f, cy = (((iy + dy) % f) + f) % f;
      const ox = dx + 0.16 + 0.68 * h2(cx, cy, seed) - fx, oy = dy + 0.16 + 0.68 * h2(cx, cy, seed + 19.3) - fy;
      dm = Math.min(dm, ox * ox + oy * oy);
    }
    return clamp(1 - Math.sqrt(dm) * 0.94, 0, 1);
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const ux = x / N, uy = y / N;
    const wx = (vn(ux, uy, 8, 1.1) - 0.5) * 0.06, wy = (vn(ux, uy, 8, 5.7) - 0.5) * 0.06;
    const d1 = cell(ux + wx, uy + wy, 14, 2.3), d2 = cell(ux + wx, uy + wy, 32, 8.9);
    const mp = 0.55 * vn(ux, uy, 4, 3.7) + 0.30 * vn(ux, uy, 8, 9.2) + 0.15 * vn(ux, uy, 16, 14.1);
    const c1 = Math.pow(d1, 1.5) * 0.48 + d2 * 0.30 + mp * 0.22;
    const c2 = Math.pow(cell(ux - wy, uy + wx, 18, 12.4), 1.45) * 0.56 + vn(ux, uy, 24, 6.1) * 0.44;
    const i = (y * N + x) * 4;
    data[i] = clamp(c1, 0, 1) * 255; data[i + 1] = clamp(c2, 0, 1) * 255; data[i + 2] = clamp(mp, 0, 1) * 255; data[i + 3] = clamp(d1 * 0.65 + d2 * 0.35, 0, 1) * 255;
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  cachedPoreTex = t;
  return t;
}

const MAX_SHIELDS = 8;

// Instant 0.01 ms uniform setup on boot; heavy procedural pore map & brush WebP build lazily ONLY when `Colours` is used!
export function makePaintUniforms() {
  const placeholder = makeTinyPlaceholderTex();
  return {
    uPaintActive:  { value: 0 },
    uPaintMode:    { value: 1 },        // 1 = Cool Jewel Mineral ★, 2 = Warm Fresco, 3 = Soft Shadow Tint
    uPaintOrigin:  { value: 22.0 },
    uPaintRadius:  { value: 0 },
    uPaintBandA:   { value: 3.7 },
    uPaintBandB:   { value: 23.92 },
    uPaintCeilH:   { value: 4.02 },
    uPaintSat:     { value: 0.72 },
    uWaterPore:    { value: placeholder },
    uSplashMedium: { value: placeholder },
    uSplashParams: { value: new THREE.Vector4(0.66, 1.15, 1.25, 0.0) },
    uArtShields:   { value: Array.from({ length: MAX_SHIELDS }, () => new THREE.Vector4(0, 0, -1, -1)) },
    uArtWalls:     { value: new Float32Array(MAX_SHIELDS) },
  };
}

export function ensurePaintAssets(U) {
  if (!U || U._assetsReady) return;
  U._assetsReady = true;
  U.uWaterPore.value = makePoreTexture();
  if (!cachedBrushTex) {
    cachedBrushTex = new THREE.TextureLoader().load('/herencia-hallway/film-v2/look/medina_brush_512.webp');
    cachedBrushTex.wrapS = cachedBrushTex.wrapT = THREE.RepeatWrapping;
    cachedBrushTex.colorSpace = THREE.NoColorSpace;
  }
  U.uSplashMedium.value = cachedBrushTex;
}

export function syncPaintShields(U, layout) {
  U.uPaintCeilH.value = layout.hall?.ceiling ?? 4.02;
  for (let i = 0; i < MAX_SHIELDS; i++) {
    const a = layout.art?.[i];
    if (a) {
      const { w, h } = localArtSize(a);
      U.uArtShields.value[i].set(a.s, a.y, w * 0.5 + 0.24, h * 0.5 + 0.24);
      U.uArtWalls.value[i] = a.wall === 'R' ? 1.0 : -1.0;
    } else {
      U.uArtShields.value[i].set(0, 0, -1, -1);
      U.uArtWalls.value[i] = 0;
    }
  }
}

export const PAINT_GLSL = /* glsl */`
uniform float uPaintActive, uPaintOrigin, uPaintRadius, uPaintBandA, uPaintBandB, uPaintCeilH, uPaintSat;
uniform int uPaintMode;
uniform sampler2D uWaterPore, uSplashMedium;
uniform vec4 uSplashParams;
uniform vec4 uArtShields[${MAX_SHIELDS}];
uniform float uArtWalls[${MAX_SHIELDS}];

vec3 pSrgbToLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }

// Cool Jewel Palette (Mode 1) vs Warm Mineral Fresco Palette (Mode 2):
// Mode 1 weaves cool ultramarine cobalt, cerulean, celadon-emerald, rose-crimson, and golden saffron
// along the corridor (echoing 085/087 blues up front, 090 emerald/cobalt mid-hall, 006 crimson, and 003/010 cerulean!).
vec3 pickPig(float sBand, float sTex, float crossCoord, float sideSeed, float caul, float macroFbm) {
  float nLobe = texture2D(uWaterPore, vec2(sTex * 0.055 + sideSeed * 0.13, crossCoord * 0.072)).b;
  float nSub  = texture2D(uWaterPore, vec2(sTex * 0.115 + 0.31, crossCoord * 0.115 + sideSeed * 0.07)).b;
  float sw = sBand + (nLobe - 0.48) * 3.4 + (caul - 0.5) * 1.1;
  float subMix = smoothstep(0.38, 0.62, nSub);

  vec3 cCobalt   = vec3(0.16, 0.40, 0.80);
  vec3 cCerulean = vec3(0.14, 0.63, 0.78);
  vec3 cCeladon  = vec3(0.20, 0.65, 0.54);
  vec3 cRose     = vec3(0.78, 0.28, 0.44);
  vec3 cSaffron  = vec3(0.93, 0.66, 0.16);
  vec3 cOchre    = vec3(0.86, 0.50, 0.18);

  vec3 p;
  if (uPaintMode == 2) {
    vec3 wVest  = mix(cCerulean, cCobalt, subMix);
    vec3 wUpper = mix(cSaffron, cCeladon, smoothstep(0.48, 0.68, macroFbm) * 0.65);
    vec3 wMid   = mix(cSaffron, cOchre, subMix);
    vec3 wFore  = mix(cOchre, cCobalt, smoothstep(0.50, 0.70, macroFbm) * 0.55);
    if (sw > 16.0) p = mix(wUpper, wVest, smoothstep(16.0, 17.6, sw));
    else if (sw > 11.0) p = mix(wMid, wUpper, smoothstep(11.0, 12.6, sw));
    else if (sw > 6.5) p = mix(wFore, wMid, smoothstep(6.5, 8.0, sw));
    else p = wFore;
  } else {
    // Cool Jewel Mineral Palette (Cobalt + Cerulean + Celadon-Emerald + Rose + Saffron accent):
    vec3 jVest  = mix(cCerulean, cCobalt, subMix);
    vec3 jUpper = mix(cCeladon, mix(cRose, cCerulean, subMix), smoothstep(0.44, 0.66, macroFbm));
    vec3 jMid   = mix(cCobalt, mix(cCeladon, cSaffron, 0.42), subMix);
    vec3 jFore  = mix(cCobalt, cCerulean, subMix * 0.75 + 0.15); // echoes blue 085 & 087 up front!
    if (sw > 16.0) p = mix(jUpper, jVest, smoothstep(16.0, 17.6, sw));
    else if (sw > 10.8) p = mix(jMid, jUpper, smoothstep(10.8, 12.5, sw));
    else if (sw > 6.2) p = mix(jFore, jMid, smoothstep(6.2, 7.8, sw));
    else p = jFore;
  }
  return mix(vec3(0.94, 0.93, 0.90), p, clamp(uPaintSat, 0.2, 1.0));
}

float evalFrameHalo(float wallSign, float s, float y) {
  // Keep baseboards (y < 0.31) and picture-rail/cornice/ceiling (y > uPaintCeilH - 0.39) 100% crisp white!
  float bandKeep = smoothstep(0.29, 0.42, y) * (1.0 - smoothstep(uPaintCeilH - 0.52, uPaintCeilH - 0.36, y));
  float keep = bandKeep;
  for (int i = 0; i < ${MAX_SHIELDS}; i++) {
    vec4 sh = uArtShields[i];
    if (sh.z < 0.0 || wallSign * uArtWalls[i] < 0.0) continue;
    vec2 d = abs(vec2(s - sh.x, y - sh.y)) - sh.zw;
    float boxDist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    keep *= smoothstep(-0.04, 0.24, boxDist);
  }
  return keep;
}

vec3 evalWallPaintKM(vec3 subLin, vec3 worldPos, vec3 worldNrm) {
  vec3 Np = normalize(worldNrm);
  float s = -worldPos.z, y = worldPos.y;
  bool endFace = abs(Np.z) > 0.5;
  int surfKind = (Np.x < -0.5) ? 2 : 1;
  float sP = endFace ? s + worldPos.x * 0.85 : s;
  float sideSeed = (surfKind == 2) ? 5.7 : 0.0;
  float crossM = (surfKind == 2) ? 6.73 + (3.89 - y) : y;
  vec2 pm = vec2(sP, crossM);
  // Hoist fwidth unconditionally (ESSL 3.00 §8.8 / Metal GPU safe)
  float pmFw = max(fwidth(pm.x), fwidth(pm.y));

  // Ceiling colour finale is owned exclusively by P1 (spread/mount.js); keep paint.js strictly off ceiling!
  if (uPaintActive < 0.5 || abs(Np.y) >= 0.42) return subLin;
  float wallSign = endFace ? 0.0 : (Np.x < 0.0 ? 1.0 : -1.0);
  float halo = evalFrameHalo(wallSign, sP, y);
  if (halo <= 0.005) return subLin;

  vec4 poreA = texture2D(uWaterPore, pm * 0.155 + vec2(sideSeed * 0.13, sideSeed * 0.07));
  vec4 poreB = texture2D(uWaterPore, pm * 0.215 + vec2(0.37, 0.61));
  float c1 = poreA.r, c2 = poreA.g, macroPore = poreA.b, domeMix = poreA.a;
  float c3 = poreB.g * 0.62 + poreB.r * 0.38;
  float tooth = 0.5 + (texture2D(uWaterPore, vec2(sP, y) * 2.4).g - 0.5) * 0.65;

  float scU = uSplashParams.x * 0.68;
  vec2 uvM1 = vec2(pm.x * scU, pm.y * scU * 0.92) + vec2(sideSeed * 0.17, sideSeed * 0.11);
  vec2 uvM2 = mat2(0.84, -0.54, 0.54, 0.84) * (pm * scU * 1.55) + vec2(0.31, 0.67);
  vec3 m1 = texture2D(uSplashMedium, uvM1).rgb, m2 = texture2D(uSplashMedium, uvM2).rgb;
  float distFade = 1.0 / (1.0 + pmFw * 38.0);
  float bStroke = clamp(0.5 + ((m1.r * 0.76 + m2.r * 0.24) - 0.5) * (1.70 * uSplashParams.y), 0.0, 1.0);
  float bGrain  = clamp(0.5 + ((m1.g * 0.65 + m2.g * 0.35) - 0.5) * (1.05 * distFade + 0.32), 0.0, 1.0);

  float crossPenalty = smoothstep(0.0, 0.65, abs(y - 1.96) - 1.25) * 0.30;
  float leadDist = uPaintRadius - abs(sP - uPaintOrigin);
  float wiggFbm = texture2D(uWaterPore, vec2(crossM * 0.11 + sideSeed * 0.09, sP * 0.038)).b;
  float aheadDist = leadDist + (wiggFbm - 0.48) * 1.85 + (c1 - 0.5) * 0.95 + (bStroke - 0.5) * 0.85;

  float poreField = 0.52 * macroPore + 0.48 * domeMix;
  float capMax = (uPaintMode == 2) ? 0.46 : ((uPaintMode == 3) ? 0.42 : 0.48);
  float steadyCap = clamp(0.02 + 0.72 * poreField - crossPenalty * 0.65, 0.0, capMax);
  float raw1 = min(clamp((aheadDist - crossPenalty * 1.06) * 0.36, 0.0, 0.72), steadyCap) * halo;
  float raw2 = min(clamp((aheadDist - 1.85 - crossPenalty * 1.14) * 0.33, 0.0, 0.66), steadyCap * 0.92) * halo;
  float raw3 = min(clamp((aheadDist - 3.60 - crossPenalty * 1.22) * 0.30, 0.0, 0.60), steadyCap * 0.85) * halo;
  if (raw1 <= 0.004) return subLin;

  float sBand = clamp((sP - uPaintBandA) / max(1.0, uPaintBandB - uPaintBandA), 0.0, 1.0) * 20.72;
  vec3 pigSRGB = pickPig(sBand, sP, crossM, sideSeed, c1, poreB.b);

  float strokeEdge = (bStroke - 0.5) * 0.38 + (bGrain - 0.5) * 0.28;
  float aa = clamp(pmFw * 0.65, 0.004, 0.026);
  float phi1 = raw1 + (c1 - 0.48) * 0.30 * smoothstep(0.01, 0.16, raw1) + strokeEdge * 0.88;
  float g1 = smoothstep(0.22 - aa, 0.22 + aa, phi1);
  if (g1 <= 0.002) return subLin;

  float phi2 = raw2 + (c2 - 0.47) * 0.27 * smoothstep(0.03, 0.20, raw2) + strokeEdge * 1.25;
  float g2 = smoothstep(0.34 - aa, 0.34 + aa, phi2);
  float phi3 = raw3 + (c3 - 0.46) * 0.25 * smoothstep(0.06, 0.26, raw3) + (bGrain - 0.48) * 0.46 + (bStroke - 0.49) * 0.36;
  float g3 = smoothstep(0.45 - aa, 0.45 + aa, phi3);

  float rimPool = (exp(-pow((phi1 - 0.225) / 0.024, 2.0)) * 0.48 * g1
                +  exp(-pow((phi2 - 0.345) / 0.025, 2.0)) * 0.36 * g2) * (uPaintMode == 1 ? 0.95 : 0.50);
  vec3 layers = vec3(g1, g2, g3) * halo;

  vec3 pigLin = pSrgbToLin(pigSRGB);
  float strokeLoad = clamp(0.38 + (1.0 - bStroke) * 1.12 + (bGrain - 0.5) * 0.48 + (0.5 - tooth) * 0.36, 0.14, 1.55);
  float drySkip = (uPaintMode == 2) ? smoothstep(0.28, 0.62, strokeLoad) : smoothstep(0.18, 0.46, strokeLoad);
  // In Mode 3 (Soft Shadow Tint), bright sunlit plaster (> 0.92 linear) stays crisp white while shaded plaster blooms!
  float subLum = dot(subLin, vec3(0.2126, 0.7152, 0.0722));
  float sunProtect = (uPaintMode == 3) ? (1.0 - smoothstep(0.76, 1.08, subLum)) : 1.0;
  float stainDepth = (((layers.x * 0.32 + layers.y * 0.36 + layers.z * 0.30) * strokeLoad * drySkip) + rimPool * 0.48) * sunProtect;
  vec3 trans = pow(clamp(pigLin, vec3(0.04), vec3(0.992)), vec3(stainDepth));
  return subLin * trans;
}
`;

export function installPaint(material, U) {
  if (!material || material.userData?.paintInstalled) return;
  material.userData = material.userData || {};
  material.userData.paintInstalled = true;
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPaintPos;\nvarying vec3 vPaintNrm;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvPaintPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvPaintNrm = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + PAINT_GLSL + '\nvarying vec3 vPaintPos;\nvarying vec3 vPaintNrm;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor.rgb = evalWallPaintKM(diffuseColor.rgb, vPaintPos, vPaintNrm);`);
  };
  material.needsUpdate = true;
}
