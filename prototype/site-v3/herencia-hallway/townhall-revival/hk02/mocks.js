// Zero-Rebake Real-Time Architectural & Curatorial Mock Kit (`hk02/mocks.js`)
// Instant (< 2 ms) room exploration without waiting for a Cycles rebake:
//   1. Two Detailed, Narrowed-Down Side Window Designs (`Design A: Arched 5-Spoke Fanlight ★` & `Design B: Tall Casement + Reveal Shutters ★`)
//      in Slightly-Darker-White Satin Paint (`Warm Putty-White -8% ★` / `Soft Pearl-White -4%` / `Warm Stone -13%`) + Sculpted 3D Perch
//   2. Physically Projected Global-Sun Window Light (`Komorebi Sunlit Leaves ★` vs `Crisp Architectural Sunbeams ★`)
//   3. 4 Brightened Wall Cream / Alabaster Color Gradings (`G1..G4`) with 0.000-seam dual-UV wall infill
//   4. Proportion-Aware Tall Room Height Gradient (`4.02 m` -> `4.45 m` -> `4.90 m ★` -> `5.35 m`):
//      human-anchored baseboards/paintings/doors/perch, elongating upper plaster & window sashes, rising picture rail/cornice/coffers
//   5. Sconces Toggle (`Matte-Black Horizontal Bars ★` vs `GitHub 1862 Blackened-Iron & Brass Opaline Bells ★`) + Museum Gallery Cards

import * as THREE from 'three';
import { CATALOG, artSize } from './scene.js?v=20261126v71';
import { computeIndoorLightRig, kelvinWarmthTint } from './fixtures.js?v=20261126v71';
import { OUTSIDE_PRESETS, SHARED_OUTSIDE_UNIFORMS, PROBE_CUBE_GLSL, applyOutsidePresetValues, lerpOutsideModes, warmOutsideCpuImages, markOutsideCompositorDirty } from './outside-light.js?v=20261126v71';

const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);

function softGlowTex(innerHex = 'rgba(255,228,182,0.52)', midHex = 'rgba(255,214,155,0.18)') {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 3, 64, 64, 62);
  grd.addColorStop(0.0, innerHex);
  grd.addColorStop(0.42, midHex);
  grd.addColorStop(1.0, 'rgba(255,210,150,0.0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

// Zero-clip upward + downward warm grazing wall-wash texture (hits 0.0 alpha well inside quad edges!)
function makeBarWashTex() {
  const S = 128;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.clearRect(0, 0, S, S);
  for (const [cy, ry, peak] of [[S * 0.38, S * 0.30, 0.85], [S * 0.62, S * 0.30, 0.85]]) {
    g.save();
    g.translate(S * 0.5, cy);
    g.scale(1.18, 0.92);
    const r = ry;
    const grd = g.createRadialGradient(0, 0, 2, 0, 0, r);
    grd.addColorStop(0.00, `rgba(255, 252, 245, ${peak})`);
    grd.addColorStop(0.38, `rgba(255, 246, 232, ${(peak * 0.42).toFixed(2)})`);
    grd.addColorStop(0.72, `rgba(255, 240, 222, ${(peak * 0.10).toFixed(2)})`);
    grd.addColorStop(1.00, 'rgba(255, 240, 222, 0.0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

function softRectShadowTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 64);
  g.filter = 'blur(8px)';
  g.fillStyle = 'rgba(18,14,10,0.62)';
  g.fillRect(22, 16, 84, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

// Painterly backlit garden foliage + golden morning sun halo outside the side windows (`Komorebi ★`)
function makeKomorebiBackdropTex() {
  const W = 256, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');

  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.00, '#eaf2ff');
  sky.addColorStop(0.35, '#fffdf2');
  sky.addColorStop(0.75, '#fff5dc');
  sky.addColorStop(1.00, '#ede2c8');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  let seed = 4217;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // Soft-focus courtyard tree boughs & warm sunlit olive/emerald foliage:
  g.save();
  g.filter = 'blur(6.5px)';
  g.strokeStyle = 'rgba(78,66,46,0.52)';
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(-12, H * 0.09); g.quadraticCurveTo(W * 0.46, H * 0.25, W * 0.96, H * 0.14);
  g.moveTo(W + 12, H * 0.36); g.quadraticCurveTo(W * 0.50, H * 0.48, W * 0.08, H * 0.62);
  g.moveTo(-8, H * 0.72); g.quadraticCurveTo(W * 0.38, H * 0.66, W * 0.78, H * 0.78);
  g.stroke();

  const farPalette = [
    'rgba(116,144,74,0.62)',
    'rgba(148,172,88,0.60)',
    'rgba(96,126,64,0.55)',
    'rgba(186,192,106,0.64)',
  ];
  for (let i = 0; i < 78; i++) {
    const x = rnd() * W;
    const y = rnd() * H * 0.90;
    const rx = 13 + rnd() * 24;
    const ry = 8 + rnd() * 14;
    g.fillStyle = farPalette[i % farPalette.length];
    g.beginPath();
    g.ellipse(x, y, rx, ry, (rnd() - 0.5) * 2.0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // Foreground softly-focused backlit leaves + glowing golden sun-gaps:
  g.save();
  g.filter = 'blur(3.2px)';
  const nearPalette = [
    'rgba(92,122,56,0.62)',
    'rgba(136,162,74,0.66)',
    'rgba(74,102,48,0.52)',
    'rgba(198,196,112,0.68)',
  ];
  for (let i = 0; i < 64; i++) {
    const edgeBias = rnd() < 0.68 ? (rnd() * 0.65) : (0.52 + rnd() * 0.38);
    const x = rnd() * W;
    const y = edgeBias * H;
    const rx = 8 + rnd() * 15;
    const ry = 5 + rnd() * 10;
    g.fillStyle = nearPalette[i % nearPalette.length];
    g.beginPath();
    g.ellipse(x, y, rx, ry, (rnd() - 0.5) * 2.4, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 28; i++) {
    const x = rnd() * W, y = rnd() * H * 0.82, r = 9 + rnd() * 20;
    g.fillStyle = 'rgba(255,251,228,0.65)';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // Warm golden morning sun-flare veil across upper right:
  const sun = g.createRadialGradient(W * 0.64, H * 0.22, 6, W * 0.64, H * 0.22, W * 0.88);
  sun.addColorStop(0.0, 'rgba(255,253,240,0.78)');
  sun.addColorStop(0.42, 'rgba(255,242,198,0.34)');
  sun.addColorStop(1.0, 'rgba(255,240,195,0.0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSunShaftTex() {
  const W = 128, H = 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.clearRect(0, 0, W, H);
  // Softly tapered volumetric morning sun-veil (strongest near window, fading completely into air):
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    const aV = Math.pow(1.0 - v, 1.85) * Math.min(1.0, v * 8.0);
    const grd = g.createLinearGradient(0, y, W, y);
    grd.addColorStop(0.00, 'rgba(255,236,190,0.0)');
    grd.addColorStop(0.22, `rgba(255,238,196,${(0.75 * aV).toFixed(3)})`);
    grd.addColorStop(0.50, `rgba(255,244,210,${(1.00 * aV).toFixed(3)})`);
    grd.addColorStop(0.78, `rgba(255,238,196,${(0.75 * aV).toFixed(3)})`);
    grd.addColorStop(1.00, 'rgba(255,236,190,0.0)');
    g.fillStyle = grd;
    g.fillRect(0, y, W, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSunlitSkyBackdropTex() {
  const W = 128, H = 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0.0, '#f3f7ff');
  grd.addColorStop(0.48, '#fffdf7');
  grd.addColorStop(0.84, '#fff8ea');
  grd.addColorStop(1.0, '#f5ecda');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makePlacardTexture({ title, year = '2026', medium = 'Oil on linen', sub = '' }) {
  const W = 512, H = 340;
  const c = document.createElement('canvas'); c.width = 256; c.height = 170;
  const g = c.getContext('2d');
  g.scale(0.5, 0.5);
  g.fillStyle = '#faf7f0';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(38,33,28,0.13)';
  g.lineWidth = 4;
  g.strokeRect(2, 2, W - 4, H - 4);

  g.fillStyle = '#181614';
  g.fillRect(40, 44, 54, 3.5);

  g.font = '700 22px "Georgia", "Times New Roman", serif';
  g.fillStyle = '#161412';
  g.letterSpacing = '2.5px';
  g.fillText('LUIS MEDINA', 40, 86);

  g.font = 'italic 26px "Georgia", "Times New Roman", serif';
  g.fillStyle = '#1f1c19';
  const words = title.split(' ');
  let line = '', y = 134;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > W - 80 && line) {
      g.fillText(line, 40, y);
      line = w;
      y += 33;
    } else {
      line = test;
    }
  }
  if (line) g.fillText(line, 40, y);

  g.font = '400 18.5px -apple-system, "Helvetica Neue", sans-serif';
  g.fillStyle = '#4a433b';
  g.fillText(`${medium}, ${year}`, 40, y + 40);

  g.font = '600 15.5px -apple-system, "Helvetica Neue", sans-serif';
  g.fillStyle = '#756b5e';
  g.fillText(sub || 'Herencia Viva: Threads of Memory · Ayllu', 40, H - 36);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

// Builds 24 exact 45-deg-coved pressed-tin coffers + central stamped rosettes matching `bake_townhall_hk02.py` (`lay_rects`)
function buildSkylightInfillGeometry(layRects, ceilH) {
  const pos = [], nor = [], uvs = [];
  const cx0 = -2.01, cx1 = 2.01, cy0 = 3.64, cy1 = 23.98;
  const pushQuad = (p0, p1, p2, p3) => {
    const V = ([x, s, z]) => new THREE.Vector3(x, z, -s);
    const a = V(p0), b = V(p1), c = V(p2), d = V(p3);
    const e1 = new THREE.Vector3().subVectors(b, a);
    const e2 = new THREE.Vector3().subVectors(d, a);
    const n = new THREE.Vector3().crossVectors(e1, e2).normalize();
    const flip = n.y > 0;
    if (flip) n.negate();
    const uvOf = ([x, s]) => [
      Math.max(0.02, Math.min(0.98, (x - cx0) / (cx1 - cx0))),
      Math.max(0.02, Math.min(0.98, 1.0 - (s - cy0) / (cy1 - cy0))),
    ];
    const tri = (q0, q1, q2, r0, r1, r2) => {
      pos.push(q0.x, q0.y, q0.z, q1.x, q1.y, q1.z, q2.x, q2.y, q2.z);
      for (let k = 0; k < 3; k++) nor.push(n.x, n.y, n.z);
      uvs.push(...uvOf(r0), ...uvOf(r1), ...uvOf(r2));
    };
    if (flip) {
      tri(a, c, b, p0, p2, p1);
      tri(a, d, c, p0, p3, p2);
    } else {
      tri(a, b, c, p0, p1, p2);
      tri(a, c, d, p0, p2, p3);
    }
  };
  const ring = (xa0, xb0, sa0, sb0, z0, xa1, xb1, sa1, sb1, z1) => {
    const o = [[xa0, sa0, z0], [xb0, sa0, z0], [xb0, sb0, z0], [xa0, sb0, z0]];
    const inn = [[xa1, sa1, z1], [xb1, sa1, z1], [xb1, sb1, z1], [xa1, sb1, z1]];
    for (let k = 0; k < 4; k++) {
      const kn = (k + 1) % 4;
      pushQuad(o[k], inn[k], inn[kn], o[kn]);
    }
  };

  for (const r of layRects) {
    const ca = r[0] - 0.052, cb = r[1] + 0.052;
    const saAll = r[2] - 0.052, sbAll = r[3] + 0.052;
    const ds = (sbAll - saAll) / 3.0;
    const C = ceilH;
    for (let row = 0; row < 3; row++) {
      const ra = saAll + row * ds, rb = ra + ds;
      ring(ca, cb, ra, rb, C - 0.0235, ca + 0.036, cb - 0.036, ra + 0.036, rb - 0.036, C - 0.0235);
      ring(ca + 0.036, cb - 0.036, ra + 0.036, rb - 0.036, C - 0.0235, ca + 0.054, cb - 0.054, ra + 0.054, rb - 0.054, C - 0.011);
      ring(ca + 0.054, cb - 0.054, ra + 0.054, rb - 0.054, C - 0.011,  ca + 0.082, cb - 0.082, ra + 0.082, rb - 0.082, C - 0.011);
      ring(ca + 0.082, cb - 0.082, ra + 0.082, rb - 0.082, C - 0.011,  ca + 0.104, cb - 0.104, ra + 0.104, rb - 0.104, C + 0.008);
      const px0 = ca + 0.104, px1 = cb - 0.104, py0 = ra + 0.104, py1 = rb - 0.104;
      const mx = 0.5 * (px0 + px1), my = 0.5 * (py0 + py1);
      ring(px0, px1, py0, py1, C + 0.008, mx - 0.068, mx + 0.068, my - 0.068, my + 0.068, C + 0.008);
      ring(mx - 0.068, mx + 0.068, my - 0.068, my + 0.068, C + 0.008, mx - 0.052, mx + 0.052, my - 0.052, my + 0.052, C - 0.004);
      pushQuad([mx - 0.052, my - 0.052, C - 0.004], [mx + 0.052, my - 0.052, C - 0.004],
               [mx + 0.052, my + 0.052, C - 0.004], [mx - 0.052, my + 0.052, C - 0.004]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return g;
}

// Paint shade presets for the narrowed window woodwork & sculpted perch ("sliiiightly darker white paint"):
const WIN_PAINT_SHADES = {
  putty: { label: 'Warm Putty-White (-10%)', rgb: new THREE.Vector3(0.680, 0.638, 0.575) },
  pearl: { label: 'Soft Pearl-White (-5%)',  rgb: new THREE.Vector3(0.785, 0.750, 0.696) },
  stone: { label: 'Warm Stone-Greige (-16%)', rgb: new THREE.Vector3(0.568, 0.524, 0.462) },
};

export class HK02MockManager {
  constructor(hall, layout) {
    this.hall = hall;
    this.layout = layout;
    this.root = new THREE.Group();
    this.root.name = 'hk02_mock_kit';
    hall.scene.add(this.root);

    this.texKomorebi = null;
    this.texSunSky   = null;
    this.texSunShaft = null;

    // B1: Bind SHARED_OUTSIDE_UNIFORMS on every toneMapped:true built-in material so CustomToneMapping uTmOutMix/uTmAgx* are always bound!
    const bindTone = (mat) => {
      mat.userData = { ...(mat.userData || {}), _toneUniformsBound: true };
      mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS); };
      return mat;
    };

    this.mats = {
      matteBlack: bindTone(new THREE.MeshStandardMaterial({
        color: lin(0.014, 0.013, 0.012), roughness: 0.42, metalness: 0.25, envMapIntensity: 0.55,
      })),
      opalineWarm: bindTone(new THREE.MeshStandardMaterial({
        color: lin(1.0, 0.94, 0.82), emissive: lin(1.35, 1.02, 0.62), roughness: 0.22, metalness: 0.0,
      })),
      diffuserTube: bindTone(new THREE.MeshBasicMaterial({
        color: lin(1.65, 1.32, 0.88),
      })),
      wallWashSprite: bindTone(new THREE.MeshBasicMaterial({
        map: makeBarWashTex(),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.25,
      })),
      winBackdrop: new THREE.MeshBasicMaterial({
        color: 0xfffaf0, toneMapped: false,
      }),
      winSunShaft: new THREE.MeshBasicMaterial({
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.052, side: THREE.DoubleSide, toneMapped: false,
      }),
      winGlass: bindTone(new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.06, metalness: 0.08, transparent: true, opacity: 0.14, envMapIntensity: 0.85, depthWrite: false,
      })),
      cardEdge: bindTone(new THREE.MeshStandardMaterial({
        color: lin(0.88, 0.85, 0.79), roughness: 0.78, envMapIntensity: 0.15,
      })),
      cardShadow: bindTone(new THREE.MeshBasicMaterial({
        map: softRectShadowTex(), transparent: true, opacity: 0.32, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      })),
      sconceShadow: bindTone(new THREE.MeshBasicMaterial({
        map: softRectShadowTex(), transparent: true, opacity: 0.28, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      })),
    };

    // 1. Non-discarding corridor baseboard/chair-rail trim material (`winBaseTrim`)
    // 2. Custom sunlit "Sliiiightly Darker White" window & perch satin-enamel material (`winPaintMat`)
    // 3. 0.000-seam dual-UV `bakedWallMat` clone (`winWallMat`) for flush plaster infill around narrowed windows!
    this.uWinAlbedo = { value: WIN_PAINT_SHADES.putty.rgb.clone() };

    if (hall.bakedTrimMat) {
      const baseTrim = hall.bakedTrimMat.clone();
      baseTrim.uniforms = {
        ...hall.bakedTrimMat.uniforms,
        uWinBay0: { value: new THREE.Vector4(0, -99, 0, 0) },
        uWinBay1: { value: new THREE.Vector4(0, -99, 0, 0) },
        uExtraH:  { value: 0.0 }, // window infill baseboards stay anchored at floor
        // B2: Procedural BoxGeometry infill has no baked vertex radiosity -> sample 6-face Ambient Cube on Cycles!
        uTrimRadMix:     { value: 0.0 },
        uTrimProbeBlend: { value: 1.0 },
      };
      this.mats.winBaseTrim = baseTrim;
      hall.registerV9RefMaterial?.(baseTrim);

      // Dedicated Sunlit Off-White Window & Perch Satin-Enamel Shader:
      // Catches warm exterior golden sunlight on upward perch slab (`N.y > 0.5`) & splayed jamb reveals,
      // while holding crisp warm-stone self-shadowing under the bullnose ogee & corbels (`N.y < -0.4`)!
      this.mats.winPaintMat = new THREE.ShaderMaterial({
        uniforms: {
          ...baseTrim.uniforms,
          uAlbedo: this.uWinAlbedo,
          uBevK:   { value: 1.28 },
        },
        vertexShader: /* glsl */`
          varying vec3 vW, vN;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz;
            vN = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * w;
          }
        `,
        fragmentShader: /* glsl */`
          uniform sampler2D tFloorLight, tCeilLight;
          uniform vec4 uFloorRect, uCeilRect;
          uniform vec3 uAlbedo;
          uniform float uFloorScale, uCeilScale, uBakeExp, uCeilH, uHalfW, uBevK, uContrastFix, uWinLightMode;
          uniform float uOutCyclesMix, uInReflPass;
          varying vec3 vW, vN;
          ${PROBE_CUBE_GLSL}

          vec3 sampleFloorGI(float x, float s) {
            float u = clamp((x - uFloorRect.x) / (uFloorRect.y - uFloorRect.x), 0.03, 0.97);
            float v = clamp(1.0 - (s - uFloorRect.z) / (uFloorRect.w - uFloorRect.z), 0.015, 0.985);
            return texture2D(tFloorLight, vec2(u, v)).rgb * uFloorScale;
          }
          vec3 sampleCeilGI(float x, float s) {
            float u = clamp((x - uCeilRect.x) / (uCeilRect.y - uCeilRect.x), 0.03, 0.97);
            float v = clamp(1.0 - (s - uCeilRect.z) / (uCeilRect.w - uCeilRect.z), 0.02, 0.98);
            return texture2D(tCeilLight, vec2(u, v)).rgb * (uCeilScale / 0.94);
          }

          void main() {
            float s = -vW.z;
            vec3 nFlat = normalize(cross(dFdx(vW), dFdy(vW)));
            if (dot(nFlat, vN) < 0.0) nFlat = -nFlat;
            vec3 N = normalize(mix(vN, nFlat, 0.90));

            float kCycW = clamp(uOutCyclesMix, 0.0, 1.0);
            vec3 envGI = vec3(0.0);
            // B2: Never sample evicted V9 floor/ceil maps once settled in Cycles (kCycW >= 0.9995)!
            if (kCycW < 0.9995) {
              float xSample = clamp(vW.x + N.x * 0.16, -(uHalfW - 0.18), uHalfW - 0.18);
              float sSample = clamp(s, uFloorRect.z + 0.25, uFloorRect.w - 0.25);
              vec3 flGI = clamp(sampleFloorGI(xSample, sSample), vec3(0.72, 0.70, 0.66), vec3(1.04, 1.00, 0.94));
              vec3 clGI = clamp(sampleCeilGI(xSample, sSample), vec3(0.80, 0.78, 0.75), vec3(1.08, 1.05, 1.00));
              envGI = mix(flGI, clGI, clamp(vW.y / 3.8, 0.0, 1.0));
            }
            if (kCycW > 0.0005) {
              vec3 cycGI = (uHasProbeCube > 0.5) ? sampleProbeCube(vW, N) : vec3(0.86, 0.83, 0.78);
              envGI = (kCycW >= 0.9995) ? cycGI : mix(envGI, cycGI, kCycW);
            }

            // Deep reveal & exterior daylight bounce inside the window pocket (|x| > uHalfW - 0.02):
            float inReveal = smoothstep(uHalfW - 0.02, uHalfW + 0.18, abs(vW.x));
            float topSun   = max(N.y, 0.0);
            float underSh  = max(-N.y, 0.0);
            float jambSun  = abs(N.z);

            float sunActive = step(0.5, uWinLightMode);
            vec3 winSunKiss = vec3(1.10, 0.98, 0.80) * (
              (0.18 * topSun * smoothstep(0.88, 0.98, vW.y) + 0.22 * inReveal * (0.45 + 0.55 * jambSun)) * (0.45 + 0.55 * sunActive)
            );
            envGI += winSunKiss;

            // Crisp architectural ogee, corbel, shutter-panel & muntin relief:
            float relief = 1.0
              + uBevK * (0.14 * topSun - 0.20 * underSh)
              + uBevK * (0.08 * jambSun * (inReveal > 0.1 ? 1.0 : 0.45))
              - 0.08 * (1.0 - abs(N.x)) * (1.0 - inReveal) * underSh;

            vec3 aoTint = vec3(pow(clamp(relief, 0.56, 1.22), 0.93), pow(clamp(relief, 0.56, 1.22), 1.00), pow(clamp(relief, 0.56, 1.22), 1.08));
            vec3 c = envGI * uAlbedo * aoTint * uBakeExp;

            vec3 V = normalize(cameraPosition - vW);
            float coat = pow(1.0 - max(dot(N, V), 0.0), 3.6) * 0.065;
            c += c * coat;
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
      hall.registerV9RefMaterial?.(this.mats.winPaintMat);
    } else {
      this.mats.winBaseTrim = hall.M.trim;
      this.mats.winPaintMat = hall.M.trim;
    }

    if (hall.bakedWallMat) {
      const ww = hall.bakedWallMat.clone();
      ww.side = THREE.DoubleSide;
      ww.uniforms = {
        ...hall.bakedWallMat.uniforms,
        uDualUv: { value: 1.0 },
      };
      this.mats.winWallMat = ww;
      hall.registerV9RefMaterial?.(ww);
    } else {
      this.mats.winWallMat = hall.M.wall;
    }

    // Default state reflects Pavlos's locked Town Hall Lab choices (`5.06 m` ceiling, Crisp Gallery White + 112% Wall Whiteness,
    // Trim: Crisp Chalk ★, S5 Plaster Uplight ★ across corridor + alcove, dual Ceiling Rod + L/R Spots ★, 2516K warmth, 70% floor blacks!)
    this.state = {
      sideWindows: 'off',
      winDesign:   'arched',
      winPaint:    'pearl',
      trimPaint:   'chalk',       // Trim: Crisp Chalk ★
      winLight:    'komorebi',
      wallGrade:   3,             // Crisp Gallery White ★
      wallWhite:   1.28,          // Live Wall Whiteness parameter (128% default -> whiter walls, 0 rebake!)
      ceilHeight:  5.06,          // 5.06 m ★
      alcoveSideWin: layout?.hall?.vestRightWindow !== false,
      skylights:   'cove',
      ceilingSpine: true,         // Ceiling Rod + L/R Spots (corridor + alcove) ★
      sconces:     'plaster',     // S5 · Plaster Uplight ★
      frameAccents: true,         // Brass + Floater Frames ★
      cards:       true,          // Gallery Cards ★
      floorMode:   0,             // F1 · Dark Cherry-Cognac ★
      ambientGain: 0.39,          // 39% ★ (Pavlos locked screenshot)
      indoorGain:  0.39,
      sconceGain:  2.15,          // 215% ★
      spotGain:    1.05,          // 105% ★
      lightWarmth: 1.00,          // 2300K ★ (3500 - 1.00 * 1200 = 2300K)
      shadowDepth: 0.84,          // 84% Doors, Trim & Accents Shadow Depth ★
      ceilShadowDepth: 1.80,      // 180% Ceiling Pattern Shadow Depth ★
      floorDark:   0.70,          // 70% Floor Blacks ★
      contrastFix: true,
      outLight:    'v9',          // V9 · Locked Baseline ★ (options: 'v9', 'c04', 'c05', 'c03', 'c02')
      outStrength: 1.00,          // 100% Outside Window Daylight strength
      artPop:      0.00,          // 0% on V9; auto-set to 12-15% on C02-C05 so paintings stay vivid
    };

    this._builtWinKey = '';
    this.groups = {};
    this._buildStaticGroups();
    this.applyState();
  }

  _buildStaticGroups() {
    const D = this.hall.D;
    const pk = this.hall.bakedPack;
    const isV6 = (pk?.meta?.version || 1) >= 6;
    this.groups.winGroup = new THREE.Group();
    this.groups.alcoveCap = isV6 ? null : this._buildAlcoveRightCap(D);
    this.groups.noSkyCoffers = isV6 ? null : this._buildNoSkylightCoffers(pk, D);
    this.groups.cards = this._buildGalleryCards(D);
    this.groups.sconceBlackBar = this._buildBlackHorizontalSconces(D);
    this.groups.sconceGithub = this._buildGithubBellSconces(D);
    this.groups.sconcePic = this._buildPictureLights(D);

    Object.values(this.groups).forEach(g => { if (g) this.root.add(g); });
  }

  // Builds a subdivided planar plaster patch at `x = sg * HW` whose `uv` & `uv2` sample the exact left & right
  // `walls.webp` islands adjacent to `sDoorCenter` (`±0.705 m`) -> 0.000 RGB seam across all wall gradings!
  _makeSeamlessWallPatch(sg, sA, sB, yA, yB, sDoorCenter) {
    const HW = this.hall.D.HW;
    const x = sg * HW;
    const nx = -sg;
    const sampleUV = this.hall.sampleWallUV || (() => [0.5, 0.5]);
    const ns = Math.max(2, Math.ceil(Math.abs(sB - sA) / 0.18));
    const ny = Math.max(2, Math.ceil(Math.abs(yB - yA) / 0.24));

    const pos = [], nor = [], uv1 = [], uv2 = [], blend = [];
    const emitV = (s, y) => {
      pos.push(x, y, -s);
      nor.push(nx, 0, 0);
      // Sample clean corridor plaster well clear of the old 9.5-deg ajar door spotlight corner!
      const uL = sampleUV(sg, sDoorCenter - 0.88, y);
      const uR = sampleUV(sg, sDoorCenter + 1.25, y);
      uv1.push(uL[0], uL[1]);
      uv2.push(uR[0], uR[1]);
      blend.push(Math.max(0, Math.min(1, (s - (sDoorCenter - 0.688)) / (2 * 0.688))));
    };

    for (let is = 0; is < ns; is++) {
      const s0 = sA + (sB - sA) * (is / ns);
      const s1 = sA + (sB - sA) * ((is + 1) / ns);
      for (let iy = 0; iy < ny; iy++) {
        const z0 = yA + (yB - yA) * (iy / ny);
        const z1 = yA + (yB - yA) * ((iy + 1) / ny);
        // Outward interior normal `(-sg, 0, 0)` CCW winding in Three.js `(x, y, -s)`:
        if (sg < 0) {
          emitV(s0, z0); emitV(s1, z0); emitV(s1, z1);
          emitV(s0, z0); emitV(s1, z1); emitV(s0, z1);
        } else {
          emitV(s1, z0); emitV(s0, z0); emitV(s0, z1);
          emitV(s1, z0); emitV(s0, z1); emitV(s1, z1);
        }
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv1, 2));
    g.setAttribute('aUvRight', new THREE.Float32BufferAttribute(uv2, 2));
    g.setAttribute('aBlend', new THREE.Float32BufferAttribute(blend, 1));
    return new THREE.Mesh(g, this.mats.winWallMat);
  }

  // Rebuilds the narrowed, high-detail sculpted side windows (Design A or Design B), scaling their vertical
  // sash & pilaster height cleanly with `extraH` while keeping the sculpted perch anchored at human `0.92 m`!
  _rebuildCorridorWindows(specs, design, extraH) {
    const grp = this.groups.winGroup;
    grp.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    grp.clear();
    if (!specs || !specs.length) return;

    const D = this.hall.D;
    const HW = D.HW;
    const baseTrim = this.mats.winBaseTrim;
    const paintMat = this.mats.winPaintMat;
    const brassMat = this.hall.M.brass;
    const isArched = (design === 'arched');

    // Narrowed gallery proportions (vs old 1.08 m full doorway):
    const wOpen = isArched ? 0.78 : 0.74;
    const hw    = wOpen * 0.5;
    const zSill = 0.92; // human-height sculpted perch!
    // Elongate vertical sash gracefully as ceiling rises (`+0.68 * extraH`), keeping arch crown 100% circular!
    const zSpring = (isArched ? 2.76 : 2.76) + 0.68 * extraH;
    const zTop    = isArched ? (zSpring + hw) : (zSpring + 0.38);
    const depth   = 0.27; // deep 27 cm historic masonry window reveal!

    // Sync exact aperture dimensions to `scene.js` shaders (`bakedWallMat` hole cut + projective sunbeams!):
    if (this.hall.bakedU) {
      this.hall.bakedU.uWinCut.value.set(hw, zTop);
      this.hall.bakedU.uWinDesign.value = isArched ? 0.0 : 1.0;
    }

    for (const sp of specs) {
      const sg = sp.wall === 'L' ? -1 : 1;
      const s0 = sp.s;
      const xi = sg * HW;
      const xGlass = xi + sg * depth;

      const addBox = (xa, xb, sa, sb, za, zb, mat) => {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(Math.abs(xb - xa), Math.abs(zb - za), Math.abs(sb - sa)),
          mat
        );
        m.position.set(0.5 * (xa + xb), 0.5 * (za + zb), -0.5 * (sa + sb));
        grp.add(m);
        return m;
      };

      // 1. Exact non-overlapping Dual-UV Plaster Wall Infill (`±0.688 m` exact room_walls doorway gap — zero Z-fighting!):
      const sSpan = 0.688;
      // Lower wall apron (`0.285 .. zSill`):
      grp.add(this._makeSeamlessWallPatch(sg, s0 - sSpan, s0 + sSpan, 0.285, zSill + 0.004, s0));
      // Left & Right narrowed wall piers (`s0 - sSpan .. s0 - hw` and `s0 + hw .. s0 + sSpan`, `zSill .. 3.578`):
      grp.add(this._makeSeamlessWallPatch(sg, s0 - sSpan, s0 - hw + 0.003, zSill, 3.578, s0));
      grp.add(this._makeSeamlessWallPatch(sg, s0 + hw - 0.003, s0 + sSpan, zSill, 3.578, s0));
      // Upper lintel infill if `zTop < 3.578`:
      if (zTop < 3.576) {
        grp.add(this._makeSeamlessWallPatch(sg, s0 - hw - 0.004, s0 + hw + 0.004, zTop - 0.004, 3.578, s0));
      }
      // Continuous floor baseboard (`0 .. 0.285`) across `±0.76 m` + Left-wall chair rail (`0.94..0.975`) on side piers!
      addBox(xi + sg * 0.004, xi - sg * 0.025, s0 - 0.765, s0 + 0.765, 0.0, 0.285, baseTrim);
      if (sg < 0) {
        addBox(xi - 0.004, xi + 0.024, s0 - 0.765, s0 - hw - 0.11, 0.940, 0.975, baseTrim);
        addBox(xi - 0.004, xi + 0.024, s0 + hw + 0.11, s0 + 0.765, 0.940, 0.975, baseTrim);
      }

      // 2. Deep 27 cm Recessed Masonry Jambs + Backing Light-Box (`winBackdrop`)
      addBox(xi - sg * 0.008, xGlass + sg * 0.03, s0 - hw - 0.036, s0 - hw, zSill, zSpring + 0.02, paintMat);
      addBox(xi - sg * 0.008, xGlass + sg * 0.03, s0 + hw, s0 + hw + 0.036, zSill, zSpring + 0.02, paintMat);
      // Exterior light-box enclosure so zero void is ever visible from acute grazing angles:
      const xBack = xi + sg * 0.68;
      const skyH = (zTop - zSill) + 1.1;
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(wOpen + 0.95, skyH), this.mats.winBackdrop);
      sky.rotation.y = sg > 0 ? -Math.PI / 2 : Math.PI / 2;
      sky.position.set(xBack, 0.5 * (zSill + zTop), -s0);
      grp.add(sky);

      // 3. Fluted Classical Pilaster Casings Framing Both Sides (`10.2 cm` wide, Slightly-Darker-White Paint)
      for (const sideS of [-1, 1]) {
        const sc = s0 + sideS * (hw + 0.052);
        // Main pilaster shaft:
        addBox(xi - sg * 0.026, xi + sg * 0.004, sc - 0.052, sc + 0.052, zSill + 0.040, zSpring, paintMat);
        // Two crisp vertical classical flutes/ribs on each pilaster face:
        for (const df of [-0.022, 0.022]) {
          addBox(xi - sg * 0.033, xi - sg * 0.024, sc + df - 0.007, sc + df + 0.007, zSill + 0.09, zSpring - 0.05, paintMat);
        }
        // Pilaster base plinth & impost capital block:
        addBox(xi - sg * 0.036, xi + sg * 0.004, sc - 0.058, sc + 0.058, zSill + 0.040, zSill + 0.085, paintMat);
        addBox(xi - sg * 0.038, xi + sg * 0.004, sc - 0.060, sc + 0.060, zSpring - 0.042, zSpring + 0.008, paintMat);
      }

      if (isArched) {
        // ==================== DESIGN A: NARROWED ARCHED 5-SPOKE FANLIGHT SASH + SCULPTED PUTTY PERCH ====================
        // A1. Arched spandrel block (`zSpring .. zTop`) + curved 3D extrados architrave moulding + keystone!
        const spShape = new THREE.Shape();
        const padW = hw + 0.112;
        spShape.moveTo(-padW, 0);
        spShape.lineTo(-hw, 0);
        const NSEG = 28;
        for (let k = 1; k < NSEG; k++) {
          const a = Math.PI * (1.0 - k / NSEG);
          spShape.lineTo(hw * Math.cos(a), hw * Math.sin(a));
        }
        spShape.lineTo(hw, 0);
        spShape.lineTo(padW, 0);
        spShape.lineTo(padW, hw + 0.112);
        spShape.lineTo(-padW, hw + 0.112);
        spShape.closePath();

        const spGeo = new THREE.ExtrudeGeometry(spShape, { depth: depth + 0.045, bevelEnabled: false });
        const spMesh = new THREE.Mesh(spGeo, paintMat);
        // Extrude along X from `xi - sg*0.020` to `xGlass + sg*0.025`:
        spMesh.rotation.y = sg > 0 ? Math.PI / 2 : -Math.PI / 2;
        spMesh.position.set(sg > 0 ? (xi - 0.020) : (xGlass - 0.025), zSpring, -s0);
        grp.add(spMesh);

        // Curved proud moulded extrados hood ring (`r = hw + 0.015 .. hw + 0.108`):
        const hoodShape = new THREE.Shape();
        const rIn = hw + 0.006, rOut = hw + 0.106;
        hoodShape.moveTo(-rOut, 0);
        for (let k = 0; k <= NSEG; k++) {
          const a = Math.PI * (1.0 - k / NSEG);
          hoodShape.lineTo(rOut * Math.cos(a), rOut * Math.sin(a));
        }
        for (let k = NSEG; k >= 0; k--) {
          const a = Math.PI * (1.0 - k / NSEG);
          hoodShape.lineTo(rIn * Math.cos(a), rIn * Math.sin(a));
        }
        hoodShape.closePath();
        const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, { depth: 0.038, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2 });
        const hoodMesh = new THREE.Mesh(hoodGeo, paintMat);
        hoodMesh.rotation.y = sg > 0 ? Math.PI / 2 : -Math.PI / 2;
        hoodMesh.position.set(sg > 0 ? (xi - 0.048) : (xi + 0.010), zSpring, -s0);
        grp.add(hoodMesh);

        // Sculpted keystone boss at the apex of the arch (`s = s0, y = zTop + 0.055`):
        addBox(xi - sg * 0.062, xi - sg * 0.012, s0 - 0.044, s0 + 0.044, zTop - 0.005, zTop + 0.122, paintMat);

        // Recessed fielded panels on the deep `27 cm` jamb reveals:
        for (const sideS of [-1, 1]) {
          const sj = s0 + sideS * (hw - 0.003);
          addBox(xi + sg * 0.045, xGlass - sg * 0.045, sj, sj - sideS * 0.008, zSill + 0.10, zSpring - 0.08, paintMat);
        }

        // A2. Impost Transom Bar + 5-Spoke Radiated Semicircular Fanlight (`zSpring .. zTop`)
        addBox(xGlass - sg * 0.024, xGlass + sg * 0.022, s0 - hw, s0 + hw, zSpring - 0.018, zSpring + 0.018, paintMat);
        // Semicircular hub boss:
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.028, 18, 1, false, 0, Math.PI), paintMat);
        hub.rotation.z = sg > 0 ? -Math.PI / 2 : Math.PI / 2;
        hub.rotation.x = Math.PI / 2;
        hub.position.set(xGlass, zSpring + 0.01, -s0);
        grp.add(hub);
        for (let k = 1; k <= 5; k++) {
          const ang = (Math.PI * k) / 6.0;
          const spokeLen = hw - 0.065;
          const spk = new THREE.Mesh(new THREE.BoxGeometry(0.020, spokeLen, 0.013), paintMat);
          const rMid = 0.055 + spokeLen * 0.5;
          spk.position.set(xGlass, zSpring + Math.sin(ang) * rMid, -(s0 - Math.cos(ang) * rMid));
          spk.rotation.x = -(ang - Math.PI / 2);
          grp.add(spk);
        }

        // A3. Slender Double-Hung Sash Perimeter + Meeting Rail + Brass Sash Lock & Lifts!
        addBox(xGlass - sg * 0.020, xGlass + sg * 0.020, s0 - hw, s0 - hw + 0.034, zSill + 0.040, zSpring, paintMat);
        addBox(xGlass - sg * 0.020, xGlass + sg * 0.020, s0 + hw - 0.034, s0 + hw, zSill + 0.040, zSpring, paintMat);
        addBox(xGlass - sg * 0.020, xGlass + sg * 0.020, s0 - hw, s0 + hw, zSill + 0.040, zSill + 0.076, paintMat);

        const zMeet = 0.5 * (zSill + 0.040 + zSpring);
        addBox(xGlass - sg * 0.028, xGlass + sg * 0.022, s0 - hw, s0 + hw, zMeet - 0.016, zMeet + 0.016, paintMat);
        // Burnished antique-brass sash lock + twin brass bottom-rail sash lifts:
        addBox(xGlass - sg * 0.044, xGlass - sg * 0.022, s0 - 0.028, s0 + 0.028, zMeet + 0.016, zMeet + 0.030, brassMat);
        for (const dl of [-0.18, 0.18]) {
          addBox(xGlass - sg * 0.032, xGlass - sg * 0.018, s0 + dl - 0.022, s0 + dl + 0.022, zSill + 0.050, zSill + 0.062, brassMat);
        }

        // Delicate 1.4 cm ovolo muntins (3 columns; 2 rows per sash, or 3 rows per sash when tall `extraH > 0.65`!):
        for (const fracS of [-1 / 6, 1 / 6]) {
          const sm = s0 + fracS * wOpen;
          addBox(xGlass - sg * 0.011, xGlass + sg * 0.011, sm - 0.007, sm + 0.007, zSill + 0.076, zSpring - 0.018, paintMat);
        }
        const rowsPerSash = extraH > 0.72 ? 3 : 2;
        for (const [ya, yb] of [[zSill + 0.076, zMeet - 0.016], [zMeet + 0.016, zSpring - 0.018]]) {
          for (let r = 1; r < rowsPerSash; r++) {
            const zm = ya + (yb - ya) * (r / rowsPerSash);
            addBox(xGlass - sg * 0.011, xGlass + sg * 0.011, s0 - hw + 0.034, s0 + hw - 0.034, zm - 0.0065, zm + 0.0065, paintMat);
          }
        }

        // A4. Sculpted Projecting Bullnose Perch (`9.2 cm` proud) + Cove Bed-Moulding + Fielded Apron + Scroll Corbels!
        addBox(xi - sg * 0.092, xGlass + sg * 0.02, s0 - hw - 0.142, s0 + hw + 0.142, zSill, zSill + 0.040, paintMat);
        addBox(xi - sg * 0.064, xi + sg * 0.004, s0 - hw - 0.120, s0 + hw + 0.120, zSill - 0.030, zSill, paintMat);
        addBox(xi - sg * 0.024, xi + sg * 0.004, s0 - hw - 0.095, s0 + hw + 0.095, zSill - 0.092, zSill - 0.030, paintMat);
        addBox(xi - sg * 0.032, xi - sg * 0.022, s0 - hw + 0.02, s0 + hw - 0.02, zSill - 0.078, zSill - 0.044, paintMat);
        for (const cs of [s0 - hw - 0.052, s0 + hw + 0.052]) {
          addBox(xi - sg * 0.062, xi + sg * 0.002, cs - 0.034, cs + 0.034, zSill - 0.096, zSill - 0.030, paintMat);
          addBox(xi - sg * 0.042, xi + sg * 0.002, cs - 0.026, cs + 0.026, zSill - 0.138, zSill - 0.096, paintMat);
          addBox(xi - sg * 0.024, xi + sg * 0.002, cs - 0.020, cs + 0.020, zSill - 0.164, zSill - 0.138, paintMat);
        }
      } else {
        // ==================== DESIGN B: NARROWED TALL GALLERY CASEMENT + REVEAL SHUTTERS & CREMONE BOLT ====================
        // B1. Head Reveal + Classical Entablature Frieze, Dentil Row & Projecting Cornice Hood (`zTop .. zTop + 0.165`)
        addBox(xi - sg * 0.012, xGlass + sg * 0.03, s0 - hw - 0.036, s0 + hw + 0.036, zTop, zTop + 0.038, paintMat);
        addBox(xi - sg * 0.032, xi + sg * 0.004, s0 - hw - 0.112, s0 + hw + 0.112, zSpring, zTop + 0.095, paintMat);
        // Miniature classical dentil blocks under the window cornice:
        const nDent = 11;
        for (let kd = 0; kd < nDent; kd++) {
          const sd = (s0 - hw - 0.095) + ((2 * (hw + 0.095)) * (kd + 0.5)) / nDent;
          addBox(xi - sg * 0.048, xi - sg * 0.028, sd - 0.014, sd + 0.014, zTop + 0.095, zTop + 0.118, paintMat);
        }
        addBox(xi - sg * 0.072, xi + sg * 0.004, s0 - hw - 0.148, s0 + hw + 0.148, zTop + 0.118, zTop + 0.158, paintMat);

        // B2. Folded 3-Panel Bolection Interior Pocket Shutters inside the `27 cm` Splayed Jambs!
        for (const sideS of [-1, 1]) {
          const shG = new THREE.Group();
          const shW = depth - 0.045; // 22.5 cm wide folded shutter leaf
          const shH = zSpring - (zSill + 0.044);
          shG.position.set(xi + sg * (0.022 + shW * 0.5), zSill + 0.044 + shH * 0.5, -(s0 + sideS * (hw - 0.014)));
          // Splay 7 deg open toward the corridor so raking window sunlight sculpts every shutter panel!
          shG.rotation.y = sideS * sg * THREE.MathUtils.degToRad(7.5);
          const leafBody = new THREE.Mesh(new THREE.BoxGeometry(shW, shH, 0.018), paintMat);
          shG.add(leafBody);

          const panHeights = [
            [-shH * 0.45, -shH * 0.19],
            [-shH * 0.13,  shH * 0.19],
            [ shH * 0.25,  shH * 0.45],
          ];
          for (const [py0, py1] of panHeights) {
            const ph = py1 - py0, pw = shW - 0.056;
            const rim = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.016, ph + 0.016, 0.026), paintMat);
            rim.position.set(0, 0.5 * (py0 + py1), 0);
            shG.add(rim);
            const boss = new THREE.Mesh(new THREE.BoxGeometry(pw - 0.018, ph - 0.018, 0.031), paintMat);
            boss.position.set(0, 0.5 * (py0 + py1), 0);
            shG.add(boss);
          }
          // Tiny burnished-brass shutter pull knob:
          const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 10, 8), brassMat);
          knob.position.set(-sg * shW * 0.26, -shH * 0.16, -sideS * 0.015);
          shG.add(knob);
          grp.add(shG);
        }

        // B3. Rectangular 2-Light Transom (`zSpring .. zTop`) + Tall Double-Casement Sashes (`zSill .. zSpring`)
        addBox(xGlass - sg * 0.024, xGlass + sg * 0.022, s0 - hw, s0 + hw, zSpring - 0.018, zSpring + 0.018, paintMat);
        addBox(xGlass - sg * 0.020, xGlass + sg * 0.020, s0 - hw, s0 + hw, zTop - 0.032, zTop, paintMat);
        addBox(xGlass - sg * 0.014, xGlass + sg * 0.014, s0 - 0.010, s0 + 0.010, zSpring + 0.018, zTop - 0.032, paintMat);

        // Outer casement stiles, bottom rail & central molded meeting astragal (`s = s0`):
        addBox(xGlass - sg * 0.020, xGlass + sg * 0.020, s0 - hw, s0 - hw + 0.034, zSill + 0.040, zTop, paintMat);
        addBox(xGlass - sg * 0.020, xGlass + sg * 0.020, s0 + hw - 0.034, s0 + hw, zSill + 0.040, zTop, paintMat);
        addBox(xGlass - sg * 0.020, xGlass + sg * 0.020, s0 - hw, s0 + hw, zSill + 0.040, zSill + 0.076, paintMat);
        addBox(xGlass - sg * 0.026, xGlass + sg * 0.020, s0 - 0.020, s0 + 0.020, zSill + 0.076, zSpring - 0.018, paintMat);

        // Horizontal casement muntin bars (4 panes high, or 5 when tall):
        const casRows = extraH > 0.65 ? 5 : 4;
        for (let r = 1; r < casRows; r++) {
          const zm = (zSill + 0.076) + ((zSpring - 0.018) - (zSill + 0.076)) * (r / casRows);
          addBox(xGlass - sg * 0.011, xGlass + sg * 0.011, s0 - hw + 0.034, s0 + hw - 0.034, zm - 0.0065, zm + 0.0065, paintMat);
        }

        // Full-Height Burnished-Brass Cremone Bolt Rod + Keeper Guides + Sculpted Lever Handle (`y = 1.48 m`)!
        const cremH = (zSpring - 0.018) - (zSill + 0.044);
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, cremH, 10), brassMat);
        rod.position.set(xGlass - sg * 0.031, zSill + 0.044 + cremH * 0.5, -s0);
        grp.add(rod);
        for (const zk of [zSill + 0.09, 1.48, zSpring - 0.07]) {
          addBox(xGlass - sg * 0.037, xGlass - sg * 0.024, s0 - 0.011, s0 + 0.011, zk - 0.018, zk + 0.018, brassMat);
        }
        // Brass lever handle jutting slightly toward left leaf:
        addBox(xGlass - sg * 0.048, xGlass - sg * 0.035, s0 - 0.056, s0 + 0.008, 1.474, 1.486, brassMat);

        // B4. Tailored Fluted Console Perch Ledge (`8.6 cm` proud) + Tapered Brackets!
        addBox(xi - sg * 0.086, xGlass + sg * 0.02, s0 - hw - 0.136, s0 + hw + 0.136, zSill, zSill + 0.038, paintMat);
        addBox(xi - sg * 0.054, xi + sg * 0.004, s0 - hw - 0.114, s0 + hw + 0.114, zSill - 0.028, zSill, paintMat);
        addBox(xi - sg * 0.022, xi + sg * 0.004, s0 - hw - 0.102, s0 + hw + 0.102, zSill - 0.074, zSill - 0.028, paintMat);
        for (const cs of [s0 - hw - 0.052, s0 + hw + 0.052]) {
          addBox(xi - sg * 0.056, xi + sg * 0.002, cs - 0.030, cs + 0.030, zSill - 0.112, zSill - 0.028, paintMat);
          addBox(xi - sg * 0.034, xi + sg * 0.002, cs - 0.024, cs + 0.024, zSill - 0.142, zSill - 0.112, paintMat);
        }
      }

      // Crown Glass Pane:
      const glPane = new THREE.Mesh(new THREE.PlaneGeometry(wOpen - 0.03, zTop - zSill - 0.05), this.mats.winGlass);
      glPane.rotation.y = sg > 0 ? -Math.PI / 2 : Math.PI / 2;
      glPane.position.set(xGlass, 0.5 * (zSill + 0.04 + zTop), -s0);
      glPane.renderOrder = 2;
      grp.add(glPane);

      // Subtle golden atmospheric morning sun-shaft veil streaming inward from right-side windows:
      if (sg > 0) {
        const shaftLen = 2.55;
        const shaftGeo = new THREE.PlaneGeometry(wOpen * 1.12, shaftLen);
        shaftGeo.translate(0, -shaftLen * 0.5, 0);
        const shaft = new THREE.Mesh(shaftGeo, this.mats.winSunShaft);
        shaft.name = 'mock_sun_shaft';
        shaft.position.set(xi - 0.04, 0.5 * (zSill + 0.25 + zTop), -s0);
        // Slant inward from +X -> -X at ~30 deg solar altitude and slight +s azimuth:
        shaft.rotation.set(0, -Math.PI * 0.5 + 0.22, -Math.PI * 0.33, 'YXZ');
        shaft.renderOrder = 3;
        grp.add(shaft);
      }
    }
  }

  // End-Alcove Side Window Cap (`x = +1.50, s = 20.30..23.92`) — stretches cleanly with `uExtraH` and syncs with `uWallGrade`!
  _buildAlcoveRightCap(D) {
    const grp = new THREE.Group();
    const trimMat = this.mats.winBaseTrim || this.hall.bakedTrimMat || this.hall.M.trim;
    const U = this.hall.bakedU;
    const capWallMat = new THREE.ShaderMaterial({
      uniforms: {
        ...SHARED_OUTSIDE_UNIFORMS,
        uBakeExp:   U?.uBakeExp   || { value: 1.0 },
        uContrast:  U?.uContrastFix || { value: 1.0 },
        uWallGrade: U?.uWallGrade || { value: 1.0 },
        uExtraH:    U?.uExtraH    || { value: 0.0 },
      },
      vertexShader: /* glsl */`
        uniform float uExtraH;
        varying vec3 vW;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          if (w.y > 3.580) {
            w.y += ((w.y - 3.580) / max(0.01, 3.920 - 3.580)) * uExtraH;
          }
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uBakeExp, uContrast, uWallGrade, uExtraH;
        varying vec3 vW;
        void main() {
          float s = -vW.z;
          float effVC = 3.92 + uExtraH;
          float dBack = clamp((23.92 - s) / 3.62, 0.0, 1.0);
          float dCorn = min(min(s - 20.30, 23.92 - s), effVC - vW.y);
          float ao = mix(0.86, 1.0, smoothstep(0.0, 0.45, dCorn)) * mix(0.95, 1.0, smoothstep(0.28, 0.70, vW.y));
          float falloff = mix(0.82, 0.70, sin(dBack * 3.14159265) * 0.65 + dBack * 0.22);
          vec3 c = vec3(1.00, 0.938, 0.852) * (mix(0.86, falloff, uContrast) * ao * uBakeExp);
          if (uWallGrade > 0.5) {
            float l = dot(c, vec3(0.299, 0.587, 0.114));
            vec3 tint = (uWallGrade > 2.5 && uWallGrade < 3.5) ? vec3(1.004, 0.994, 0.974) : vec3(1.008, 0.986, 0.948);
            c = mix(c, vec3(l) * tint, 0.60) * 1.15 + vec3(0.018);
          }
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const wSpan = D.VS1 - D.VS0;
    const hSpan = 3.92 - 0.285;
    const wallPlane = new THREE.Mesh(new THREE.PlaneGeometry(wSpan, hSpan, 1, 8), capWallMat);
    wallPlane.rotation.y = -Math.PI / 2;
    wallPlane.position.set(D.VH - 0.002, 0.285 + 0.5 * hSpan, -0.5 * (D.VS0 + D.VS1));
    grp.add(wallPlane);

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.285, wSpan), trimMat);
    base.position.set(D.VH - 0.013, 0.1425, -0.5 * (D.VS0 + D.VS1));
    grp.add(base);
    return grp;
  }

  _buildNoSkylightCoffers(pk, D) {
    if (!pk?.meta?.lay_rects || !this.hall.bakedCeilMat) return null;
    const geo = buildSkylightInfillGeometry(pk.meta.lay_rects, D.C);
    const mesh = new THREE.Mesh(geo, this.hall.bakedCeilMat);
    mesh.name = 'mock_nosky_coffers';
    return mesh;
  }

  _buildGalleryCards(D) {
    const grp = new THREE.Group();
    const L = this.layout;
    const preferredSides = {
      '085': -1, '087': +1, '086': -1, '010': +1, '090': +1, '006': +1, '003': -1,
      'site-04-andean-figures': -1, 'site-05-village-painting': +1,
    };

    const cw = 0.158, ch = 0.104, cd = 0.0045;
    for (const a of (L.art || [])) {
      const cat = CATALOG[a.id];
      // Posters are typographic prints mounted directly on the wall — NO white museum card tags!
      if (!a || !cat || cat.kind === 'poster') continue;
      const { w, h } = artSize(a);
      const sg = a.wall === 'L' ? -1 : 1;
      const halfHall = a.s > D.L ? D.VH : D.HW;
      const xWall = sg * halfHall;
      let side = (!a.uid && preferredSides[a.id]) ? preferredSides[a.id] : +1;
      if (a.uid || !preferredSides[a.id]) {
        const scoreSide = (sd) => {
          const sc = a.s + sd * (w * 0.5 + 0.21);
          if (sc < D.Y0 + 0.15 || (a.s < D.L && sc > D.L - 0.12) || sc > D.VS1 - 0.15) return -99;
          let minD = 99;
          for (const d of (L.doors || [])) if (d.wall === a.wall) minD = Math.min(minD, Math.abs(sc - d.s) - 0.72);
          for (const b of (L.art || [])) if (b !== a && b.wall === a.wall) minD = Math.min(minD, Math.abs(sc - b.s) - artSize(b).w * 0.5);
          return minD;
        };
        side = scoreSide(+1) >= scoreSide(-1) ? +1 : -1;
      }
      const sCard = a.s + side * (w * 0.5 + 0.036 + 0.088 + cw * 0.5);
      const yCard = a.y - h * 0.5 + ch * 0.5 + 0.035;

      const cardTex = makePlacardTexture({
        title: cat.title,
        year: '2026',
        medium: 'Oil on linen',
      });
      const faceMat = new THREE.MeshBasicMaterial({ map: cardTex, toneMapped: false });
      const cardGrp = new THREE.Group();
      cardGrp.position.set(xWall, yCard, -sCard);
      cardGrp.rotation.y = a.wall === 'L' ? Math.PI / 2 : -Math.PI / 2;

      const sh = new THREE.Mesh(new THREE.PlaneGeometry(cw + 0.016, ch + 0.016), this.mats.cardShadow);
      sh.position.set(0.003, -0.004, 0.003);
      sh.userData.noRefl = true;
      cardGrp.add(sh);

      const body = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), this.mats.cardEdge);
      body.position.z = 0.0078 - cd * 0.5;
      cardGrp.add(body);

      const face = new THREE.Mesh(new THREE.PlaneGeometry(cw - 0.003, ch - 0.003), faceMat);
      face.position.z = 0.008;
      face.userData.isGalleryCard = true;
      face.userData.s = sCard;
      cardGrp.add(face);

      grp.add(cardGrp);
    }
    return grp;
  }

  _sconcePositions() {
    return [
      { wall: 'L', s: 5.66,  y: 2.38 },
      { wall: 'L', s: 11.61, y: 2.38 },
      { wall: 'L', s: 13.97, y: 2.38 },
      { wall: 'L', s: 19.64, y: 2.38 },
      { wall: 'R', s: 5.66,  y: 2.38 },
      { wall: 'R', s: 9.27,  y: 2.38 },
      { wall: 'R', s: 17.51, y: 2.38 },
      { wall: 'R', s: 19.71, y: 2.38 },
    ];
  }

  // Shared beveled matte-black rectangular rosette & extruded linear hood geometry builders
  _makeBeveledPlateGeo(w, h, d = 0.008) {
    const hw = w * 0.5 - 0.0018, hh = h * 0.5 - 0.0018;
    const sh = new THREE.Shape();
    sh.moveTo(-hw, -hh); sh.lineTo(hw, -hh); sh.lineTo(hw, hh); sh.lineTo(-hw, hh); sh.closePath();
    return new THREE.ExtrudeGeometry(sh, {
      depth: d, bevelEnabled: true, bevelThickness: 0.0018, bevelSize: 0.0018, bevelSegments: 1,
    });
  }

  _makeLinearHoodGeo(width, height = 0.020, depth = 0.032) {
    const hz = depth * 0.5 - 0.0015, hy = height * 0.5 - 0.0015;
    const lip = 0.0045;
    const sh = new THREE.Shape();
    sh.moveTo(-hz, -hy);
    sh.lineTo(-hz + lip, -hy);
    sh.lineTo(-hz + lip, hy - 0.006);
    sh.lineTo(hz - lip, hy - 0.006);
    sh.lineTo(hz - lip, -hy);
    sh.lineTo(hz, -hy);
    sh.lineTo(hz, hy);
    sh.lineTo(-hz, hy);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: Math.max(0.04, width - 0.003),
      bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0012, bevelSegments: 1,
    });
    g.translate(0, 0, -(width - 0.003) * 0.5);
    g.rotateY(Math.PI / 2);
    return g;
  }

  // 5A. Upgraded Matte-Black Horizontal Architectural Bar Sconces ★
  _buildBlackHorizontalSconces(D) {
    const grp = new THREE.Group();
    const blackM = this.mats.matteBlack;
    const brassM = this.hall.M.brass;
    const diffM  = this.mats.diffuserTube;
    const rig = computeIndoorLightRig(this.layout, D, artSize, CATALOG);

    // Shared prototype geometries across all corridor & alcove bar sconces
    const plateGeo  = this._makeBeveledPlateGeo(0.140, 0.042, 0.008);
    const stemGeo   = new THREE.CylinderGeometry(0.0055, 0.0055, 0.085, 12);
    stemGeo.rotateX(Math.PI / 2);
    const collarGeo = new THREE.CylinderGeometry(0.0115, 0.0115, 0.013, 16);
    collarGeo.rotateZ(Math.PI / 2);
    const hoodGeo   = this._makeLinearHoodGeo(0.420, 0.020, 0.032);
    const endRingGeo = new THREE.CylinderGeometry(0.0132, 0.0132, 0.006, 16);
    endRingGeo.rotateZ(Math.PI / 2);
    const endCapGeo = new THREE.CylinderGeometry(0.0112, 0.0112, 0.009, 16);
    endCapGeo.rotateZ(Math.PI / 2);
    const endFinGeo = new THREE.CylinderGeometry(0.0068, 0.0068, 0.005, 14);
    endFinGeo.rotateZ(Math.PI / 2);
    const tubeGeo   = new THREE.CylinderGeometry(0.0085, 0.0085, 0.398, 14);
    tubeGeo.rotateZ(Math.PI / 2);
    const washGeo   = new THREE.PlaneGeometry(1.18, 1.02);
    const shGeo     = new THREE.PlaneGeometry(0.45, 0.058);

    for (const sc of rig.sconces) {
      const yMount = Math.min(D.C - 0.50, Math.max(2.02, sc.y + 0.16));
      const g = new THREE.Group();
      g.userData.baseY = yMount;
      g.position.set(sc.x, yMount, -sc.s);
      g.rotation.y = sc.wall === 'L' ? Math.PI / 2 : -Math.PI / 2;

      const wash = new THREE.Mesh(washGeo, this.mats.wallWashSprite);
      wash.position.set(0, 0.01, 0.0022);
      wash.userData.noRefl = true;
      g.add(wash);

      const sh = new THREE.Mesh(shGeo, this.mats.sconceShadow);
      sh.position.set(0.004, -0.020, 0.0018);
      sh.userData.noRefl = true;
      g.add(sh);

      const plate = new THREE.Mesh(plateGeo, blackM);
      plate.position.z = 0.002;
      g.add(plate);

      for (const sx of [-0.048, 0.048]) {
        const stem = new THREE.Mesh(stemGeo, blackM);
        stem.position.set(sx, 0, 0.050);
        g.add(stem);

        const rearCollar = new THREE.Mesh(collarGeo, brassM);
        rearCollar.position.set(sx, 0, 0.015);
        g.add(rearCollar);

        const frontCollar = new THREE.Mesh(collarGeo, brassM);
        frontCollar.position.set(sx, 0, 0.085);
        g.add(frontCollar);
      }

      const barHood = new THREE.Mesh(hoodGeo, blackM);
      barHood.position.set(0, 0.003, 0.090);
      g.add(barHood);

      for (const ex of [-0.211, 0.211]) {
        const ring = new THREE.Mesh(endRingGeo, brassM);
        ring.position.set(ex, 0.001, 0.090);
        g.add(ring);

        const cap = new THREE.Mesh(endCapGeo, blackM);
        cap.position.set(ex + Math.sign(ex) * 0.006, 0.001, 0.090);
        g.add(cap);

        const fin = new THREE.Mesh(endFinGeo, brassM);
        fin.position.set(ex + Math.sign(ex) * 0.012, 0.001, 0.090);
        g.add(fin);
      }

      const tube = new THREE.Mesh(tubeGeo, diffM);
      tube.position.set(0, -0.0045, 0.089);
      g.add(tube);

      grp.add(g);
    }
    return grp;
  }

  // 5B. Upgraded GitHub 1862 Sconces (`Blackened-Iron Rosette & Swan-Neck + Burnished Brass Fitter + Fluted Opaline Bell` ★)
  _buildGithubBellSconces(D) {
    const grp = new THREE.Group();
    const blackM = this.mats.matteBlack;
    const brassM = this.hall.M.brass;
    const opalM  = this.mats.opalineWarm;

    const bellPts = [
      new THREE.Vector2(0.022, 0.095),
      new THREE.Vector2(0.030, 0.078),
      new THREE.Vector2(0.048, 0.035),
      new THREE.Vector2(0.072, -0.015),
      new THREE.Vector2(0.078, -0.028),
      new THREE.Vector2(0.073, -0.030),
    ];
    const bellGeo = new THREE.LatheGeometry(bellPts, 18);

    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.00, 0.018),
      new THREE.Vector3(0, 0.055, 0.085),
      new THREE.Vector3(0, 0.115, 0.135),
      new THREE.Vector3(0, 0.098, 0.175),
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 16, 0.0085, 10, false);

    for (const sp of this._sconcePositions()) {
      const sg = sp.wall === 'L' ? -1 : 1;
      const g = new THREE.Group();
      g.userData.baseY = sp.y;
      g.position.set(sg * D.HW, sp.y, -sp.s);
      g.rotation.y = sp.wall === 'L' ? Math.PI / 2 : -Math.PI / 2;

      const wash = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), this.mats.wallWashSprite);
      wash.position.set(0, -0.02, 0.002);
      wash.userData.noRefl = true;
      g.add(wash);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), this.mats.sconceShadow);
      sh.position.set(0.004, -0.030, 0.002);
      sh.userData.noRefl = true;
      g.add(sh);

      const ros1 = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.060, 0.014, 20), blackM);
      ros1.rotation.x = Math.PI / 2; ros1.position.z = 0.007; g.add(ros1);
      const ros2 = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 0.016, 18), brassM);
      ros2.rotation.x = Math.PI / 2; ros2.position.z = 0.018; g.add(ros2);

      g.add(new THREE.Mesh(armGeo, blackM));
      const fitter = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.028, 0.026, 16), brassM);
      fitter.position.set(0, 0.098, 0.175);
      g.add(fitter);

      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 10), blackM);
      finial.position.set(0, 0.116, 0.175);
      g.add(finial);

      const bell = new THREE.Mesh(bellGeo, opalM);
      bell.position.set(0, 0.00, 0.175);
      g.add(bell);

      grp.add(g);
    }
    return grp;
  }

  _buildPictureLights(D) {
    const grp = new THREE.Group();
    const blackM = this.mats.matteBlack;
    const brassM = this.hall.M.brass;
    const diffM  = this.mats.diffuserTube;
    const L = this.layout;

    const plateGeo  = this._makeBeveledPlateGeo(0.140, 0.038, 0.008);
    const armGeo    = new THREE.CylinderGeometry(0.0055, 0.0055, 0.16, 12);
    armGeo.rotateX(Math.PI / 2);
    const collarGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.013, 14);
    collarGeo.rotateZ(Math.PI / 2);
    const endRingGeo = new THREE.CylinderGeometry(0.0128, 0.0128, 0.006, 16);
    endRingGeo.rotateZ(Math.PI / 2);

    for (const a of (L.art || [])) {
      if (a.s > D.L) continue;
      const { w, h } = artSize(a);
      const sg = a.wall === 'L' ? -1 : 1;
      const g = new THREE.Group();
      const yMount = Math.min(D.C - 0.44, a.y + h * 0.5 + 0.13);
      g.userData.baseY = yMount;
      g.position.set(sg * D.HW, yMount, -a.s);
      g.rotation.y = a.wall === 'L' ? Math.PI / 2 : -Math.PI / 2;

      const barW = Math.min(0.60, w * 0.44);
      const plate = new THREE.Mesh(plateGeo, blackM);
      plate.position.z = 0.002;
      g.add(plate);

      for (const sx of [-0.048, 0.048]) {
        const arm = new THREE.Mesh(armGeo, blackM);
        arm.position.set(sx, 0.008, 0.088);
        g.add(arm);

        const rearKn = new THREE.Mesh(collarGeo, brassM);
        rearKn.position.set(sx, 0.004, 0.015);
        g.add(rearKn);

        const kn = new THREE.Mesh(collarGeo, brassM);
        kn.position.set(sx, 0.008, 0.168);
        g.add(kn);
      }

      const shade = new THREE.Mesh(this._makeLinearHoodGeo(barW, 0.020, 0.032), blackM);
      shade.position.set(0, 0.006, 0.174);
      g.add(shade);

      for (const ex of [-barW * 0.5 - 0.002, barW * 0.5 + 0.002]) {
        const ring = new THREE.Mesh(endRingGeo, brassM);
        ring.position.set(ex, 0.004, 0.174);
        g.add(ring);
      }

      const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.0078, 0.0078, barW - 0.024, 12), diffM);
      bulb.rotation.z = Math.PI / 2;
      bulb.position.set(0, -0.002, 0.172);
      g.add(bulb);

      grp.add(g);
    }
    return grp;
  }

  _syncGalleryCardLuminance() {
    if (!this.groups?.cards) return;
    const w = SHARED_OUTSIDE_UNIFORMS.uOutWeights.value;
    const wSum = w.x + w.y + w.z + w.w;
    const str = SHARED_OUTSIDE_UNIFORMS.uOutStrength.value;
    const kOut = Math.max(0, Math.min(1, wSum * str));
    this.groups.cards.traverse(o => {
      if (!o.userData?.isGalleryCard || !o.material) return;
      if (kOut <= 0.0005) {
        o.material.color.setRGB(1, 1, 1);
      } else {
        const inAlc = o.userData.s > 20.0 ? 1.0 : 0.0;
        const invW = 1.0 / Math.max(1e-4, wSum);
        const corrG = (w.z * 0.48 + w.w * 0.60 + w.y * 0.49 + w.x * 0.52) * invW;
        const baseG = inAlc ? 0.80 : corrG;
        const tr = (w.z * 0.98 + w.w * 1.02 + w.y * 1.06 + w.x * 1.01) * invW;
        const tg = (w.z * 0.99 + w.w * 0.99 + w.y * 0.90 + w.x * 0.98) * invW;
        const tb = (w.z * 1.00 + w.w * 0.94 + w.y * 0.72 + w.x * 0.91) * invW;
        o.material.color.setRGB(
          1 + (baseG * tr - 1) * kOut,
          1 + (baseG * tg - 1) * kOut,
          1 + (baseG * tb - 1) * kOut
        );
      }
    });
  }

  setOutsideLerp(modeA, modeB, u) {
    const t = Math.max(0, Math.min(1, +u || 0));
    lerpOutsideModes(modeA, modeB, t, this.hall.renderer, this.hall);
    this.state.outStrength = SHARED_OUTSIDE_UNIFORMS.uOutStrength.value;
    this.state.artPop      = SHARED_OUTSIDE_UNIFORMS.uArtPop.value;
    if (t <= 0.0005) {
      this.state.outLight = modeA;
      this._outsideLerpActive = false;
    } else if (t >= 0.9995) {
      this.state.outLight = modeB;
      this._outsideLerpActive = false;
    } else {
      this._outsideLerpActive = true;
    }
    if (this.hall.outsideOpticsGroup) {
      const w = SHARED_OUTSIDE_UNIFORMS.uOutWeights.value;
      this.hall.outsideOpticsGroup.visible = (w.x + w.y + w.z + w.w > 0.0005) && (this.state.outStrength > 0.0005);
    }
    this._syncGalleryCardLuminance();
    markOutsideCompositorDirty();
    this.hall.markReflDirty();
  }

  applyState(patch = null) {
    if (patch) {
      if (patch.outLight !== undefined) {
        this._outsideLerpActive = false;
        if (patch.outLight !== this.state.outLight) {
          const op = OUTSIDE_PRESETS[patch.outLight] || OUTSIDE_PRESETS.v9;
          if (patch.outStrength === undefined) this.state.outStrength = op.outStrength;
          if (patch.artPop === undefined)      this.state.artPop      = op.artPop;
        }
      }
      Object.assign(this.state, patch);
      if (patch.ambientGain !== undefined && patch.indoorGain === undefined) {
        this.state.indoorGain = +patch.ambientGain;
      } else if (patch.indoorGain !== undefined && patch.ambientGain === undefined) {
        this.state.ambientGain = +patch.indoorGain;
      }
    }
    const st = this.state;
    const U = this.hall.bakedU;
    const baseCeil = this.hall.D.C || 4.86;
    const extraH = (+st.ceilHeight || baseCeil) - baseCeil;

    // 0. Modular Outside Window Daylight Concepts (`V9` baseline vs `C02`, `C03`, `C04`, `C05`):
    if (this._outsideLerpActive) {
      SHARED_OUTSIDE_UNIFORMS.uOutStrength.value = st.outStrength ?? 1.00;
      SHARED_OUTSIDE_UNIFORMS.uArtPop.value      = st.artPop ?? 0.00;
      markOutsideCompositorDirty();
    } else {
      applyOutsidePresetValues(st.outLight || 'v9', {
        outStrength: st.outStrength ?? 1.00,
        artPop: st.artPop ?? 0.00,
        renderer: this.hall.renderer,
        hall: this.hall,
      });
    }
    if (this.hall.outsideOpticsGroup) {
      const w = SHARED_OUTSIDE_UNIFORMS.uOutWeights.value;
      const optVis = (w.x + w.y + w.z + w.w > 0.0005) && (SHARED_OUTSIDE_UNIFORMS.uOutStrength.value > 0.0005);
      this.hall.outsideOpticsGroup.visible = optVis;
      if (optVis) warmOutsideCpuImages(this._outsideLerpActive ? null : st.outLight);
    }

    // 1. Paint shade for doors, Bifora window, baseboards & optional side windows:
    const shade = WIN_PAINT_SHADES[st.winPaint] || WIN_PAINT_SHADES.pearl;
    this.uWinAlbedo.value.copy(shade.rgb);
    if (this.hall.bakedTrimMat && this.hall.bakedDoorMat) {
      if (st.trimPaint === 'putty') {
        this.hall.bakedTrimMat.uniforms.uAlbedo.value.set(0.818, 0.782, 0.726);
        this.hall.bakedDoorMat.uniforms.uAlbedo.value.set(0.798, 0.760, 0.704);
      } else if (st.trimPaint === 'chalk') {
        this.hall.bakedTrimMat.uniforms.uAlbedo.value.set(0.932, 0.916, 0.884);
        this.hall.bakedDoorMat.uniforms.uAlbedo.value.set(0.912, 0.892, 0.858);
      } else {
        // Soft Pearl-White
        this.hall.bakedTrimMat.uniforms.uAlbedo.value.set(0.886, 0.858, 0.812);
        this.hall.bakedDoorMat.uniforms.uAlbedo.value.set(0.864, 0.834, 0.786);
      }
    }

    // 2. Exterior backdrop behind optional corridor window glass (lazy-built only if sideWindows !== 'off'!):
    if (st.sideWindows && st.sideWindows !== 'off') {
      if (!this.texKomorebi) {
        this.texKomorebi = makeKomorebiBackdropTex();
        this.texSunSky   = makeSunlitSkyBackdropTex();
        this.texSunShaft = makeSunShaftTex();
        this.mats.winSunShaft.map = this.texSunShaft;
        this.mats.winSunShaft.needsUpdate = true;
      }
      this.mats.winBackdrop.map = (st.winLight === 'komorebi') ? this.texKomorebi : this.texSunSky;
      this.mats.winBackdrop.needsUpdate = true;
    }

    // 3. Rebuild narrowed side windows only when `(sideWindows, winDesign, extraH)` changes:
    const specs = st.sideWindows === 'right2'
      ? [{ wall: 'R', s: 9.85 }, { wall: 'R', s: 15.45 }]
      : (st.sideWindows === 'lr2' ? [{ wall: 'L', s: 13.35 }, { wall: 'R', s: 15.45 }] : []);
    const winKey = `${st.sideWindows}|${st.winDesign}|${extraH.toFixed(3)}`;
    if (winKey !== this._builtWinKey) {
      this._builtWinKey = winKey;
      this._rebuildCorridorWindows(specs, st.winDesign, Math.max(0.0, extraH));
    }
    this.groups.winGroup.visible = specs.length > 0;
    const showShaft = (st.winLight !== 'soft');
    this.groups.winGroup.traverse(o => {
      if (o.name === 'mock_sun_shaft') o.visible = showShaft;
    });

    // 4. Sync warmth, sconceGain, spotGain & built-in Town Hall 3D fixtures!
    const rawSconceGain = Math.max(0, +(st.sconceGain ?? 2.15));
    const rawSpotGain   = Math.max(0, +(st.spotGain ?? 1.05));
    const sconceActive  = (st.sconces && st.sconces !== 'off');
    const spotActive    = (st.ceilingSpine !== false);
    const sconceGain    = sconceActive ? rawSconceGain : 0.0;
    const spotGain      = spotActive   ? rawSpotGain   : 0.0;
    const warmth        = Math.max(0, Math.min(1, +(st.lightWarmth ?? 1.00)));
    const warmTint      = kelvinWarmthTint(warmth);

    this.mats.diffuserTube.color.copy(warmTint).multiplyScalar(0.95 + 0.35 * sconceGain);
    this.mats.opalineWarm.emissive.copy(warmTint).multiplyScalar(0.75 + 0.30 * sconceGain);
    this.mats.wallWashSprite.color.copy(warmTint);
    // Whisper-subtle micro-bloom directly behind tube; Cycles-baked `walls_fix.webp` provides the physical wall pool!
    this.mats.wallWashSprite.opacity = Math.min(0.10, 0.032 * sconceGain);
    this.mats.sconceShadow.opacity = Math.min(0.32, 0.14 + 0.08 * (+(st.shadowDepth ?? 0.84)));

    const isS4Bars = (st.sconces === 's4_bars');
    const fixtureSconce = isS4Bars
      ? 'globe'
      : ((st.sconces === 'alabaster' || st.sconces === 'globe' || st.sconces === 'plaster') ? st.sconces : 'off');
    if (this.hall.fixtures) {
      this.hall.fixtures.setState({
        sconces: fixtureSconce,
        ceilingSpine: st.ceilingSpine !== false,
        frameAccents: st.frameAccents !== false,
        ceilHeight: +st.ceilHeight || baseCeil,
        sconceGain,
        spotGain,
        warmth,
      });
    }

    // Keep sconces human-anchored (0.0 * extraH) so they stay aligned with paintings when ceilHeight = 5.06 m
    for (const sg of [this.groups.sconceBlackBar, this.groups.sconceGithub, this.groups.sconcePic]) {
      if (!sg) continue;
      for (const ch of sg.children) {
        if (ch.userData.baseY !== undefined) ch.position.y = ch.userData.baseY;
      }
    }

    if (U) {
      if (st.sideWindows === 'right2') {
        U.uWinBay0.value.set(1.0, 9.85, 0.76, 1.0);
        U.uWinBay1.value.set(1.0, 15.45, 0.76, 1.0);
      } else if (st.sideWindows === 'lr2') {
        U.uWinBay0.value.set(-1.0, 13.35, 0.76, 1.0);
        U.uWinBay1.value.set(1.0, 15.45, 0.76, 1.0);
      } else {
        U.uWinBay0.value.set(0.0, -99.0, 0.0, 0.0);
        U.uWinBay1.value.set(0.0, -99.0, 0.0, 0.0);
      }

      U.uExtraH.value        = extraH;
      U.uWallGrade.value     = +st.wallGrade;
      if (U.uWallWhite) U.uWallWhite.value = +(st.wallWhite ?? 1.28);
      const amb = +(st.ambientGain ?? st.indoorGain ?? 0.39);
      if (U.uIndoorGain)  U.uIndoorGain.value  = amb;
      if (U.uAmbientGain) U.uAmbientGain.value = amb;
      if (U.uSconceGain)  U.uSconceGain.value  = sconceGain;
      if (U.uSpotGain)    U.uSpotGain.value    = spotGain;
      if (U.uLightWarmth) U.uLightWarmth.value = warmth;
      if (U.uShadowDepth) U.uShadowDepth.value = +(st.shadowDepth ?? 0.84);
      if (U.uCeilShadowDepth) U.uCeilShadowDepth.value = +(st.ceilShadowDepth ?? 1.80);
      if (U.uFloorDark)   U.uFloorDark.value   = +(st.floorDark ?? 0.70);
      U.uWinLightMode.value  = st.winLight === 'komorebi' ? 1.0 : (st.winLight === 'sunbeam' ? 2.0 : 0.0);
      U.uHideAlcoveWin.value = st.alcoveSideWin ? 0.0 : 1.0;
      U.uSkylightMode.value  = st.skylights === 'on' ? 1.0 : (st.skylights === 'cove' ? 0.5 : 0.0);
      U.uFloorMode.value     = +st.floorMode;
      U.uContrastFix.value   = st.contrastFix ? 1.0 : 0.0;
    }

    if (st.floorMode === 3 && this.hall.ensureHK02WoodMaps) {
      this.hall.ensureHK02WoodMaps();
    }
    if (st.floorMode === 4 && this.hall.ensureHerringboneMaps) {
      this.hall.ensureHerringboneMaps();
    }

    if (this.groups.alcoveCap) this.groups.alcoveCap.visible = !st.alcoveSideWin;
    if (this.hall.skySideMesh) this.hall.skySideMesh.visible = !!st.alcoveSideWin;

    const skyOn = (st.skylights === 'on');
    if (this.hall.laylightMesh) this.hall.laylightMesh.visible = skyOn;
    if (this.groups.noSkyCoffers) this.groups.noSkyCoffers.visible = !skyOn;

    if (this.groups.cards) this.groups.cards.visible = !!st.cards;
    this._syncGalleryCardLuminance();
    if (this.groups.sconceBlackBar) this.groups.sconceBlackBar.visible = (st.sconces === 'black_bar');
    if (this.groups.sconceGithub)   this.groups.sconceGithub.visible   = (st.sconces === 'github_brass');
    if (this.groups.sconcePic)      this.groups.sconcePic.visible      = (st.sconces === 'pic_black' || isS4Bars);

    markOutsideCompositorDirty();
    this.hall.markReflDirty();
  }
}
