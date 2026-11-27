// High-craft, low-draw-call architectural lighting, frame-accent & curatorial fixture module
// for the Flushing Town Hall 1862 gallery (`hk02/fixtures.js`).
//
// Exports:
//   - kelvinWarmthTint(warmth01)
//   - computeIndoorLightRig(layout, D, artSize)
//   - buildTownHallFixtures({ hall, layout, D, artSize, catalog })
//   - attachPosterFrameAccents(boardGroup, pw, ph, oakMat, brassMat)

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SHARED_OUTSIDE_UNIFORMS, PROBE_CUBE_GLSL } from './outside-light.js?v=20261126v71';

const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);

/**
 * Maps warmth01 in [0..1] to a linear RGB tungsten tint:
 *   0.00 -> 3300K neutral-warm (1.00, 0.96, 0.90)
 *   0.72 -> 2550K gallery tungsten (1.06, 0.84, 0.58)
 *   1.00 -> 2200K candle-amber (1.12, 0.75, 0.44)
 */
export function kelvinWarmthTint(warmth01 = 0.72) {
  const w = Math.max(0, Math.min(1, +warmth01 || 0));
  let r, g, b;
  if (w <= 0.72) {
    const u = w / 0.72;
    r = 1.00 + (1.06 - 1.00) * u;
    g = 0.96 + (0.84 - 0.96) * u;
    b = 0.90 + (0.58 - 0.90) * u;
  } else {
    const u = (w - 0.72) / 0.28;
    r = 1.06 + (1.12 - 1.06) * u;
    g = 0.84 + (0.75 - 0.84) * u;
    b = 0.58 + (0.44 - 0.58) * u;
  }
  return lin(r, g, b);
}

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function getArtDims(a, artSize, catalog) {
  if (typeof artSize === 'function') return artSize(a);
  const c = catalog && catalog[a.id];
  const w = a.w;
  const h = c && c.px ? (w * c.px[1] / c.px[0]) : (a.h || w * 1.07);
  return { w, h };
}

function resolveDims(layout, hall, D) {
  const src = D || (hall && hall.D);
  const h = (layout && layout.hall) || {};
  if (src) {
    const C = src.C ?? (h.ceiling || 4.86);
    const L = src.L ?? (h.arch || 20.00);
    return {
      ...src,
      VC: src.VC ?? (h.alcoveCeiling || (C - 0.24)),
      VS0: src.VS0 ?? (L + 0.30),
      VS1: src.VS1 ?? (L + 3.92),
    };
  }
  const HW = (h.width || 3.92) / 2;
  const C = h.ceiling || 4.02;
  const Y0 = h.start || 3.70;
  const AR = h.arch || 20.00;
  const VH = (h.alcoveWidth || 3.00) / 2;
  const VC = h.alcoveCeiling || (C - 0.24);
  return { HW, C, Y0, L: AR, VH, VC, VS0: AR + 0.30, VS1: AR + 3.92 };
}

// Merge an array of BufferGeometries safely (normalizes indexed state and attributes, disposes inputs).
function mergeClean(geos) {
  if (!geos || !geos.length) return null;
  const normalized = [];
  for (const g of geos) {
    if (!g) continue;
    const ng = g.index ? g.toNonIndexed() : g.clone();
    if (!ng.getAttribute('normal')) ng.computeVertexNormals();
    if (!ng.getAttribute('uv')) {
      const count = ng.getAttribute('position').count;
      ng.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    for (const attr of Object.keys(ng.attributes)) {
      if (attr !== 'position' && attr !== 'normal' && attr !== 'uv') {
        ng.deleteAttribute(attr);
      }
    }
    normalized.push(ng);
  }
  const merged = normalized.length ? mergeGeometries(normalized, false) : null;
  for (const ng of normalized) ng.dispose();
  for (const g of geos) {
    if (g) g.dispose();
  }
  return merged;
}

function transformedGeo(geo, objOrMat4) {
  const g = geo.clone();
  const mat = objOrMat4.isMatrix4 ? objOrMat4 : objOrMat4.matrix;
  g.applyMatrix4(mat);
  return g;
}

// ---------------------------------------------------------------------------
// 1. Deterministic Indoor Light Rig (Ceiling Track Spots + Flanking Sconces)
// ---------------------------------------------------------------------------
export function computeIndoorLightRig(layout, D, artSize, catalog = null) {
  const dims = resolveDims(layout, null, D);
  const minSpotS = dims.Y0 + 1.0;
  const maxSpotS = dims.L - 0.9;
  const spotY = dims.C - 0.14;
  const minSpacing = 0.95;

  // Gather corridor artwork targets (1 aimed bullet per painting + 1 shared spot for any poster cluster — no spots wasted on closed doors!)
  const rawTargets = [];
  const corrPosters = [];
  for (const a of (layout.art || [])) {
    if (a.s >= dims.L) continue;
    const isPoster = catalog && catalog[a.id] && catalog[a.id].kind === 'poster';
    if (isPoster) { corrPosters.push(a); continue; }
    const wallSign = a.wall === 'L' ? -1 : 1;
    rawTargets.push({
      kind: 'art',
      id: a.id,
      wall: a.wall,
      wallSign,
      targetX: wallSign * dims.HW,
      targetY: a.y + 0.10,
      targetS: a.s,
    });
  }
  // Group nearby posters on the same wall (<= 1.8 m apart) under one shared wash spot
  for (const wall of ['L', 'R']) {
    const wp = corrPosters.filter(p => p.wall === wall).sort((a, b) => a.s - b.s);
    const clusters = [];
    for (const p of wp) {
      const last = clusters[clusters.length - 1];
      if (last && p.s - last[last.length - 1].s <= 1.8) last.push(p);
      else clusters.push([p]);
    }
    const wallSign = wall === 'L' ? -1 : 1;
    for (const cl of clusters) {
      const avgS = cl.reduce((acc, q) => acc + q.s, 0) / cl.length;
      const avgY = cl.reduce((acc, q) => acc + q.y, 0) / cl.length;
      rawTargets.push({
        kind: 'art',
        id: cl.map(q => q.id).join('+'),
        wall,
        wallSign,
        targetX: wallSign * dims.HW,
        targetY: avgY + 0.08,
        targetS: avgS,
      });
    }
  }

  rawTargets.sort((a, b) => a.targetS - b.targetS);

  const spots = rawTargets.map((t) => ({
    ...t,
    x: 0,
    y: spotY,
    inAlcove: false,
    sMount: Math.max(minSpotS, Math.min(maxSpotS, t.targetS - 0.25)),
  }));

  // Forward pass: enforce minimum 0.95 m spacing on corridor spine
  for (let i = 1; i < spots.length; i++) {
    const minNext = spots[i - 1].sMount + minSpacing;
    if (spots[i].sMount < minNext) spots[i].sMount = minNext;
  }
  // Backward pass if pushed past maxSpotS
  if (spots.length && spots[spots.length - 1].sMount > maxSpotS) {
    spots[spots.length - 1].sMount = maxSpotS;
    for (let i = spots.length - 2; i >= 0; i--) {
      const maxPrev = spots[i + 1].sMount - minSpacing;
      if (spots[i].sMount > maxPrev) spots[i].sMount = Math.max(minSpotS, maxPrev);
    }
  }

  // 2 Alcove Ceiling Rod spots (`x = 0, y = (dims.VC || 4.62) - 0.14, inAlcove: true`):
  // When the Right alcove wall has the sunlit Romanesque window (`vestRightWindow`), NEVER glare a spotlight into the glass!
  // Instead, softly cross-light `003` on the Left alcove wall from two symmetrical rod positions (`21.42` & `22.62 m`).
  if (dims.VH > 0) {
    const alcoveSpotY = (dims.VC || 4.62) - 0.14;
    const a003 = (layout.art || []).find(a => a.id === '003' && a.s > dims.L);
    const targetS = a003 ? a003.s : (Math.abs(dims.L - 20.00) < 0.05 ? 22.02 : (dims.L + 2.02));
    const hasRightWin = !!(layout.hall && layout.hall.vestRightWindow);
    if (hasRightWin) {
      spots.push(
        {
          kind: 'art', id: '003_a', wall: 'L', wallSign: -1,
          targetX: -dims.VH, targetY: 1.88, targetS: targetS - 0.18,
          x: 0, y: alcoveSpotY, inAlcove: true, sMount: dims.L + 1.42,
        },
        {
          kind: 'art', id: '003_b', wall: 'L', wallSign: -1,
          targetX: -dims.VH, targetY: 1.88, targetS: targetS + 0.18,
          x: 0, y: alcoveSpotY, inAlcove: true, sMount: dims.L + 2.62,
        }
      );
    } else {
      spots.push(
        {
          kind: 'art', id: '003', wall: 'L', wallSign: -1,
          targetX: -dims.VH, targetY: 1.86, targetS,
          x: 0, y: alcoveSpotY, inAlcove: true, sMount: dims.L + 1.45,
        },
        {
          kind: 'art', id: '010', wall: 'R', wallSign: 1,
          targetX: dims.VH, targetY: 1.86, targetS,
          x: 0, y: alcoveSpotY, inAlcove: true, sMount: dims.L + 2.58,
        }
      );
    }
  }

  // Architectural bay sconces (`y = 2.30 m`, 10 total: symmetric Entrance pair, Door-framing mid-bays, symmetric Arch pair, symmetric Alcove pair)
  // Auto-guarded so a sconce never overlaps a door casing or artwork frame even if dragged in `layout.html`!
  const doorsByWall = { L: [], R: [] };
  for (const d of (layout.doors || [])) {
    if (d.wall === 'L' || d.wall === 'R') doorsByWall[d.wall].push(d);
  }
  const artByWall = { L: [], R: [] };
  for (const a of (layout.art || [])) {
    if (a.wall === 'L' || a.wall === 'R') artByWall[a.wall].push(a);
  }

  const corridorBayS = {
    L: [5.66, 11.61, 13.97, 19.64],
    R: [5.66,  9.27, 17.51, 19.71],
  };

  const sconces = [];
  for (const wall of ['L', 'R']) {
    const wallSign = wall === 'L' ? -1 : 1;
    const wallDoors = doorsByWall[wall];
    const wallArt = artByWall[wall];
    for (const s of corridorBayS[wall]) {
      if (s < dims.Y0 + 0.35 || s > dims.L - 0.22) continue;
      if (wallDoors.some((d) => Math.abs(s - d.s) < 0.78)) continue;
      if (wallArt.some((a) => Math.abs(s - a.s) < getArtDims(a, artSize, catalog).w * 0.5 + 0.22)) continue;
      sconces.push({
        wall,
        wallSign,
        x: wallSign * dims.HW,
        y: 2.30,
        s,
        inAlcove: false,
      });
    }
  }

  // Symmetric alcove window-framing sconces (`L: 23.38`, `R: 23.41` at `x = ±dims.VH, y = 2.30`)
  if (dims.VH > 0) {
    const baseAlc = Math.abs(dims.L - 20.00) < 0.05 ? 23.38 : (dims.L + 3.38);
    for (const [wall, sAlc] of [['L', baseAlc], ['R', baseAlc + 0.03]]) {
      const wallSign = wall === 'L' ? -1 : 1;
      sconces.push({
        wall,
        wallSign,
        x: wallSign * dims.VH,
        y: 2.30,
        s: sAlc,
        inAlcove: true,
      });
    }
  }

  return { spots, sconces };
}

// ---------------------------------------------------------------------------
// 2. Procedural Canvas Textures (Zero External Assets)
// ---------------------------------------------------------------------------
function makeHoneycombTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');

  // Warm 2850K golden reflector core gradient
  const grd = g.createRadialGradient(S * 0.5, S * 0.5, 4, S * 0.5, S * 0.5, S * 0.5);
  grd.addColorStop(0.00, '#fff7e0');
  grd.addColorStop(0.32, '#ffe1a1');
  grd.addColorStop(0.68, '#e3a54d');
  grd.addColorStop(1.00, '#6e4516');
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);

  // Hexagonal anti-glare louver cell walls
  const r = 6.2;
  const dx = r * 1.5;
  const dy = r * Math.sqrt(3);
  g.strokeStyle = '#1c1208';
  g.lineWidth = 1.65;
  for (let col = -1; col <= Math.ceil(S / dx) + 1; col++) {
    const cx = col * dx;
    const yOff = (col & 1) ? dy * 0.5 : 0;
    for (let row = -1; row <= Math.ceil(S / dy) + 1; row++) {
      const cy = row * dy + yOff;
      g.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = (k * Math.PI) / 3;
        const px = cx + r * Math.cos(ang);
        const py = cy + r * Math.sin(ang);
        if (k === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.stroke();
    }
  }

  // Dark outer perimeter vignette
  const rim = g.createRadialGradient(S * 0.5, S * 0.5, S * 0.38, S * 0.5, S * 0.5, S * 0.5);
  rim.addColorStop(0.0, 'rgba(0,0,0,0)');
  rim.addColorStop(1.0, 'rgba(12,8,4,0.85)');
  g.fillStyle = rim;
  g.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeKnurlBumpTexture() {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, S, S);

  g.lineWidth = 1.5;
  for (let i = -S; i < S * 2; i += 6) {
    g.strokeStyle = 'rgba(235,235,235,0.55)';
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + S, S);
    g.stroke();
    g.strokeStyle = 'rgba(30,30,30,0.55)';
    g.beginPath();
    g.moveTo(i + S, 0);
    g.lineTo(i, S);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function makeAlabasterTextures() {
  const W = 256, H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');

  // Translucent creamy milk-ivory backlit Spanish alabaster base (matching reference sheet panels 5, 7, 11, 14!)
  const base = g.createRadialGradient(W * 0.5, H * 0.48, 10, W * 0.5, H * 0.52, H * 0.56);
  base.addColorStop(0.00, '#fffaf0');
  base.addColorStop(0.46, '#faecd2');
  base.addColorStop(0.82, '#eed4a5');
  base.addColorStop(1.00, '#dcba82');
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);

  // Soft diffused geological bedding clouds in ONE natural quarry-strata direction (~52 deg, zero stringy criss-cross!)
  const veinC = document.createElement('canvas');
  veinC.width = W;
  veinC.height = H;
  const vg = veinC.getContext('2d');

  const rnd = seededRng(202607);
  // 1) Broad translucent honey-ochre alabaster clouds
  vg.filter = 'blur(11px)';
  for (let i = 0; i < 6; i++) {
    const y0 = (i / 5.2) * H * 1.15 - H * 0.12 + (rnd() - 0.5) * 34;
    const slope = 135 + rnd() * 55; // single consistent geological bedding angle!
    vg.strokeStyle = (i % 3 === 1)
      ? `rgba(255, 252, 245, ${(0.34 + rnd() * 0.18).toFixed(2)})`
      : `rgba(196, 122, 42, ${(0.22 + rnd() * 0.18).toFixed(2)})`;
    vg.lineWidth = 14 + rnd() * 20;
    vg.lineCap = 'round';
    vg.beginPath();
    vg.moveTo(-24, y0);
    for (let x = 0; x <= W + 24; x += 24) {
      const t = x / W;
      const wob = Math.sin(t * 5.2 + i * 1.7) * 12 + Math.cos(t * 9.0 - i) * 5;
      vg.lineTo(x, y0 + slope * t + wob);
    }
    vg.stroke();
  }
  // 2) Delicate natural amber-calcite seams along the main strata
  vg.filter = 'blur(1.8px)';
  for (let i = 0; i < 4; i++) {
    const y0 = H * (0.14 + i * 0.24) + (rnd() - 0.5) * 26;
    const slope = 140 + rnd() * 45;
    vg.strokeStyle = `rgba(154, 84, 22, ${(0.20 + rnd() * 0.14).toFixed(2)})`;
    vg.lineWidth = 1.6 + rnd() * 1.8;
    vg.beginPath();
    vg.moveTo(-12, y0);
    for (let x = 0; x <= W + 12; x += 16) {
      const t = x / W;
      vg.lineTo(x, y0 + slope * t + Math.sin(t * 6.5 + i * 2.1) * 10);
    }
    vg.stroke();
  }
  vg.filter = 'none';
  g.drawImage(veinC, 0, 0);

  // 16 crisp vertical carved alabaster flutes + subtle cylinder edge taper
  const bumpC = document.createElement('canvas');
  bumpC.width = W;
  bumpC.height = 64;
  const bg = bumpC.getContext('2d');

  const numFlutes = 16;
  for (let x = 0; x < W; x++) {
    const u = x / W;
    const phase = u * numFlutes * Math.PI;
    const rib = Math.abs(Math.sin(phase)); // 0 at valley, 1 at crest
    const cylEdge = Math.pow(Math.abs(u - 0.5) * 2.0, 2.0) * 0.16;
    const valleyDark = Math.pow(1.0 - rib, 1.9) * 0.25 + cylEdge;
    const crestBright = Math.pow(rib, 3.0) * 0.13 * (1.0 - cylEdge * 1.8);
    if (valleyDark > 0.005) {
      g.fillStyle = `rgba(136, 86, 34, ${Math.min(0.48, valleyDark).toFixed(3)})`;
      g.fillRect(x, 0, 1, H);
    }
    if (crestBright > 0.005) {
      g.fillStyle = `rgba(255, 252, 242, ${crestBright.toFixed(3)})`;
      g.fillRect(x, 0, 1, H);
    }
    const v = Math.round(45 + rib * 210);
    bg.fillStyle = `rgb(${v},${v},${v})`;
    bg.fillRect(x, 0, 1, 64);
  }

  // Soft darkening right next to top/bottom brass end-caps
  const endGrad = g.createLinearGradient(0, 0, 0, H);
  endGrad.addColorStop(0.00, 'rgba(112,68,24,0.30)');
  endGrad.addColorStop(0.07, 'rgba(112,68,24,0.0)');
  endGrad.addColorStop(0.93, 'rgba(112,68,24,0.0)');
  endGrad.addColorStop(1.00, 'rgba(112,68,24,0.30)');
  g.fillStyle = endGrad;
  g.fillRect(0, 0, W, H);

  const mapTex = new THREE.CanvasTexture(c);
  mapTex.colorSpace = THREE.SRGBColorSpace;
  const bumpTex = new THREE.CanvasTexture(bumpC);
  bumpTex.colorSpace = THREE.NoColorSpace;
  return { mapTex, bumpTex };
}

function makeFiligreePlateTextures() {
  const S = 256;
  const colC = document.createElement('canvas');
  colC.width = S;
  colC.height = S;
  const cg = colC.getContext('2d');

  const bmpC = document.createElement('canvas');
  bmpC.width = S;
  bmpC.height = S;
  const bg = bmpC.getContext('2d');

  cg.fillStyle = '#f3eee2';
  cg.fillRect(0, 0, S, S);
  bg.fillStyle = '#686868';
  bg.fillRect(0, 0, S, S);

  // Subtle recessed border groove
  const drawFrame = (ctx, stroke, lw, pad) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.strokeRect(pad, pad, S - pad * 2, S - pad * 2);
  };
  drawFrame(cg, '#bfb39d', 6, 10);
  drawFrame(cg, '#fffdf9', 3, 15);
  drawFrame(bg, '#2e2e2e', 6, 10);
  drawFrame(bg, '#dadada', 3.5, 15);

  // 4-quadrant symmetric acanthus / botanical scroll relief
  const drawScrollMotifs = (ctx, shadowCol, highlightCol) => {
    const cx = S * 0.5;
    const cy = S * 0.5;
    for (let q = 0; q < 4; q++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((q * Math.PI) / 2);

      // Diagonal acanthus stem & C-scrolls
      for (const pass of [
        { col: shadowCol, w: 8.5, dy: 2.8 },
        { col: highlightCol, w: 4.5, dy: 0 },
      ]) {
        ctx.strokeStyle = pass.col;
        ctx.lineWidth = pass.w;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(16, 16 + pass.dy);
        ctx.bezierCurveTo(44, 18 + pass.dy, 72, 42 + pass.dy, 88, 86 + pass.dy);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(28, 28 + pass.dy);
        ctx.quadraticCurveTo(68, 20 + pass.dy, 84, 52 + pass.dy);
        ctx.quadraticCurveTo(92, 68 + pass.dy, 74, 72 + pass.dy);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(28, 28 + pass.dy);
        ctx.quadraticCurveTo(20, 68 + pass.dy, 52, 84 + pass.dy);
        ctx.quadraticCurveTo(68, 92 + pass.dy, 72, 74 + pass.dy);
        ctx.stroke();

        // Axial fleur-de-lis bud
        ctx.beginPath();
        ctx.moveTo(18, 0 + pass.dy);
        ctx.quadraticCurveTo(54, -14 + pass.dy, 78, 0 + pass.dy);
        ctx.quadraticCurveTo(54, 14 + pass.dy, 18, 0 + pass.dy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Center raised rosette dome
    const dome = ctx.createRadialGradient(cx, cy - 3, 2, cx, cy, 24);
    dome.addColorStop(0.0, highlightCol);
    dome.addColorStop(0.75, highlightCol);
    dome.addColorStop(1.0, shadowCol);
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();
  };

  drawScrollMotifs(cg, '#b9ac95', '#fffdf8');
  drawScrollMotifs(bg, '#2b2b2b', '#f4f4f4');

  const mapTex = new THREE.CanvasTexture(colC);
  mapTex.colorSpace = THREE.SRGBColorSpace;
  const bumpTex = new THREE.CanvasTexture(bmpC);
  bumpTex.colorSpace = THREE.NoColorSpace;
  return { mapTex, bumpTex };
}

function makeOpalineGlobeTextures() {
  const W = 512, H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');

  const bmpC = document.createElement('canvas');
  bmpC.width = W;
  bmpC.height = 32;
  const bg = bmpC.getContext('2d');

  // Vertical milk-opaline warmth (warm 2800K glowing core at mid-belly, creamy milk-glass taper at crown & brass fitter neck!)
  const vGrad = g.createLinearGradient(0, 0, 0, H);
  vGrad.addColorStop(0.00, '#dfcaa4');
  vGrad.addColorStop(0.24, '#f8e6c2');
  vGrad.addColorStop(0.55, '#fff3d8');
  vGrad.addColorStop(0.84, '#f4e0ba');
  vGrad.addColorStop(1.00, '#d8be92');
  g.fillStyle = vGrad;
  g.fillRect(0, 0, W, H);

  const numRibs = 36;
  for (let x = 0; x < W; x++) {
    const phase = (x / W) * numRibs * Math.PI;
    const rib = Math.abs(Math.sin(phase));
    const shadow = Math.pow(1.0 - rib, 1.85) * 0.28;
    const crest  = Math.pow(rib, 3.0) * 0.08;
    if (shadow > 0.005) {
      g.fillStyle = `rgba(156, 116, 66, ${shadow.toFixed(3)})`;
      g.fillRect(x, 0, 1, H);
    }
    if (crest > 0.004) {
      g.fillStyle = `rgba(255, 252, 244, ${crest.toFixed(3)})`;
      g.fillRect(x, 0, 1, H);
    }
    const bv = Math.round(55 + rib * 200);
    bg.fillStyle = `rgb(${bv},${bv},${bv})`;
    bg.fillRect(x, 0, 1, 32);
  }

  const mapTex = new THREE.CanvasTexture(c);
  mapTex.colorSpace = THREE.SRGBColorSpace;
  const bumpTex = new THREE.CanvasTexture(bmpC);
  bumpTex.colorSpace = THREE.NoColorSpace;
  return { mapTex, bumpTex };
}

function makeWallWashTexture(upBias = 0.0) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  g.clearRect(0, 0, S, S);

  // Scalloped upper cone (centered at (0, 0) in translated space so 0% edge clipping is possible!)
  const upCy = S * (0.37 - upBias * 0.05);
  const rUp  = S * 0.34;
  g.save();
  g.translate(S * 0.5, upCy);
  g.scale(0.68, 0.96);
  const upGrd = g.createRadialGradient(0, 0, 3, 0, 0, rUp);
  upGrd.addColorStop(0.00, 'rgba(255, 222, 162, 0.88)');
  upGrd.addColorStop(0.36, 'rgba(255, 204, 132, 0.38)');
  upGrd.addColorStop(0.72, 'rgba(255, 192, 114, 0.08)');
  upGrd.addColorStop(1.00, 'rgba(255, 190, 110, 0.0)');
  g.fillStyle = upGrd;
  g.beginPath();
  g.arc(0, 0, rUp, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // Scalloped lower cone (centered at (0, 0) in translated space, reaching 0.0 alpha well inside canvas!)
  const dnAlpha = Math.max(0.16, 0.74 - upBias * 0.52);
  const dnCy = S * 0.64;
  const rDn  = S * 0.33;
  g.save();
  g.translate(S * 0.5, dnCy);
  g.scale(0.66, 0.94);
  const dnGrd = g.createRadialGradient(0, 0, 3, 0, 0, rDn);
  dnGrd.addColorStop(0.00, `rgba(255, 218, 156, ${dnAlpha.toFixed(2)})`);
  dnGrd.addColorStop(0.38, `rgba(255, 200, 128, ${(dnAlpha * 0.38).toFixed(2)})`);
  dnGrd.addColorStop(0.74, `rgba(255, 190, 112, ${(dnAlpha * 0.07).toFixed(2)})`);
  dnGrd.addColorStop(1.00, 'rgba(255, 190, 110, 0.0)');
  g.fillStyle = dnGrd;
  g.beginPath();
  g.arc(0, 0, rDn, 0, Math.PI * 2);
  g.fill();
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSoftShadowTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(S * 0.5, S * 0.5, 8, S * 0.5, S * 0.5, S * 0.48);
  grd.addColorStop(0.00, 'rgba(18, 13, 8, 0.72)');
  grd.addColorStop(0.50, 'rgba(18, 13, 8, 0.28)');
  grd.addColorStop(1.00, 'rgba(18, 13, 8, 0.0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// 3. Shared Geometry Helpers (Half-Disc Caps, Hollow Frames, Mitered Moulding)
// ---------------------------------------------------------------------------
function makeHalfDiscGeometry(radius, thickness) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI, false);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.0008,
    bevelSegments: 1,
    curveSegments: 24,
  });
  // Extrude is along +Z in XY; rotate so flat chord is on Z=0, arc protrudes into +Z, thickness along Y
  geo.rotateX(Math.PI / 2);
  geo.translate(0, thickness * 0.5, 0);
  return geo;
}

function makeHollowRectFrameGeo(innerW, innerH, outerW, outerH, zBack, zFront) {
  const hwO = outerW * 0.5;
  const hhO = outerH * 0.5;
  const hwI = innerW * 0.5;
  const hhI = innerH * 0.5;

  const shape = new THREE.Shape();
  shape.moveTo(-hwO, -hhO);
  shape.lineTo(hwO, -hhO);
  shape.lineTo(hwO, hhO);
  shape.lineTo(-hwO, hhO);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-hwI, -hhI);
  hole.lineTo(-hwI, hhI);
  hole.lineTo(hwI, hhI);
  hole.lineTo(hwI, -hhI);
  hole.closePath();
  shape.holes.push(hole);

  const depth = Math.max(0.001, zFront - zBack);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geo.translate(0, 0, zBack);
  return geo;
}

// Tapered parabolic half-bowl shell for S5 Plaster Wall Uplight
function makeParabolicHalfBowlGeometry(rx, rz, height, wallThick) {
  const rows = 14;
  const cols = 20;
  const positions = [];
  const uvs = [];
  const indices = [];

  const profileScale = (t) => (t <= 0 ? 0.0 : Math.pow(t, 0.56));

  // Outer surface (i: 0..rows, j: 0..cols) + Inner surface (offset by rows+1)
  for (let side = 0; side < 2; side++) {
    const shrink = side === 0 ? 1.0 : (rx - wallThick) / rx;
    for (let i = 0; i <= rows; i++) {
      const t = i / rows;
      const y = -height * 0.60 + t * height;
      const sc = profileScale(t) * shrink;
      for (let j = 0; j <= cols; j++) {
        const u = j / cols;
        const theta = -Math.PI * 0.5 + u * Math.PI;
        const x = Math.sin(theta) * rx * sc;
        const z = Math.cos(theta) * rz * sc;
        positions.push(x, y, z);
        uvs.push(u, t);
      }
    }
  }

  const stride = cols + 1;
  const innerBase = (rows + 1) * stride;

  // Outer triangles
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = (i + 1) * stride + j;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  // Inner triangles (reversed winding)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = innerBase + i * stride + j;
      const b = a + 1;
      const c = innerBase + (i + 1) * stride + j;
      const d = c + 1;
      indices.push(a, d, b, a, c, d);
    }
  }
  // Top rim bridge connecting outer top row to inner top row
  const topOut = rows * stride;
  const topIn = innerBase + rows * stride;
  for (let j = 0; j < cols; j++) {
    const a = topOut + j;
    const b = topOut + j + 1;
    const c = topIn + j;
    const d = topIn + j + 1;
    indices.push(a, b, d, a, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeHalfRimLipGeometry(rx, rz, lipWidth, lipHeight) {
  const segs = 24;
  const positions = [];
  const uvs = [];
  const indices = [];

  const rings = [
    { rScale: 1.0, y: 0 },
    { rScale: 1.0, y: lipHeight },
    { rScale: (rx - lipWidth) / rx, y: lipHeight },
    { rScale: (rx - lipWidth) / rx, y: 0 },
  ];

  for (let r = 0; r < rings.length; r++) {
    const { rScale, y } = rings[r];
    for (let j = 0; j <= segs; j++) {
      const u = j / segs;
      const theta = -Math.PI * 0.5 + u * Math.PI;
      positions.push(Math.sin(theta) * rx * rScale, y, Math.cos(theta) * rz * rScale);
      uvs.push(u, r / 3);
    }
  }

  const stride = segs + 1;
  for (let r = 0; r < 4; r++) {
    const rNext = (r + 1) % 4;
    for (let j = 0; j < segs; j++) {
      const a = r * stride + j;
      const b = a + 1;
      const c = rNext * stride + j;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// 4. Poster Board Frame Accents (`015` Easel Poster)
// ---------------------------------------------------------------------------
export function attachPosterFrameAccents(boardGroup, pw, ph, oakMat, brassMat) {
  if (!boardGroup) return null;
  const cy = ph * 0.5 + 0.012;

  // Inner opening is pw + 0.006 x ph + 0.006 -> 3 mm safe clearance around poster (zero crop!)
  const outerW = pw + 0.044;
  const outerH = ph + 0.044;

  const oakGeos = [
    makeHollowRectFrameGeo(pw + 0.006, ph + 0.006, outerW, outerH, -0.019, 0.006),
    makeHollowRectFrameGeo(pw + 0.016, ph + 0.016, outerW, outerH, 0.006, 0.012),
  ];
  for (const g of oakGeos) g.translate(0, cy, 0);

  const mergedOak = mergeClean(oakGeos);
  const moulding = new THREE.Mesh(mergedOak, oakMat);
  moulding.name = 'poster_frame_moulding';
  moulding.castShadow = true;
  moulding.receiveShadow = true;
  boardGroup.add(moulding);

  // 4 petite brushed-brass corner L-brackets (well outside pw x ph!)
  const brassGeos = [];
  const armLen = 0.042;
  const armW = 0.010;
  const thick = 0.0028;
  const zFront = 0.012 + thick * 0.5;
  const hw = outerW * 0.5;
  const hh = outerH * 0.5;

  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      // Horizontal front arm
      const hArm = new THREE.BoxGeometry(armLen, armW, thick);
      hArm.translate(sx * (hw - armLen * 0.5 + 0.001), cy + sy * (hh - armW * 0.5 + 0.001), zFront);
      brassGeos.push(hArm);

      // Vertical front arm
      const vArm = new THREE.BoxGeometry(armW, armLen, thick);
      vArm.translate(sx * (hw - armW * 0.5 + 0.001), cy + sy * (hh - armLen * 0.5 + 0.001), zFront);
      brassGeos.push(vArm);

      // Outer edge wrap strips
      const wrapSide = new THREE.BoxGeometry(thick, armLen, 0.022);
      wrapSide.translate(sx * (hw + thick * 0.5), cy + sy * (hh - armLen * 0.5 + 0.001), 0.001);
      brassGeos.push(wrapSide);

      const wrapTop = new THREE.BoxGeometry(armLen, thick, 0.022);
      wrapTop.translate(sx * (hw - armLen * 0.5 + 0.001), cy + sy * (hh + thick * 0.5), 0.001);
      brassGeos.push(wrapTop);

      // Corner pin heads
      const pin = new THREE.CylinderGeometry(0.0018, 0.0018, 0.002, 8);
      pin.rotateX(Math.PI * 0.5);
      pin.translate(sx * (hw - armW * 0.5), cy + sy * (hh - armW * 0.5), zFront + thick * 0.5 + 0.0006);
      brassGeos.push(pin);
    }
  }

  const mergedBrass = mergeClean(brassGeos);
  const brackets = new THREE.Mesh(mergedBrass, brassMat);
  brackets.name = 'poster_frame_brackets';
  boardGroup.add(brackets);

  return { moulding, brackets };
}

// ---------------------------------------------------------------------------
// 5. Main Fixture Builder (`buildTownHallFixtures`)
// ---------------------------------------------------------------------------
export function buildTownHallFixtures({ hall = null, layout, D = null, artSize, catalog = null } = {}) {
  const dims = resolveDims(layout, hall, D);
  const rig = computeIndoorLightRig(layout, dims, artSize, catalog);

  const root = new THREE.Group();
  root.name = 'townhall_fixtures_root';

  const ownedTextures = [];
  const ownedMaterials = [];
  const trackTex = (t) => { ownedTextures.push(t); return t; };
  const trackMat = (m) => { ownedMaterials.push(m); return m; };

  // Procedural textures
  const hexTex = trackTex(makeHoneycombTexture());
  const knurlBumpTex = trackTex(makeKnurlBumpTexture());
  const { mapTex: alabTex, bumpTex: alabBumpTex } = makeAlabasterTextures();
  trackTex(alabTex);
  trackTex(alabBumpTex);
  const { mapTex: plateTex, bumpTex: plateBumpTex } = makeFiligreePlateTextures();
  trackTex(plateTex);
  trackTex(plateBumpTex);
  const { mapTex: opalTex, bumpTex: opalBumpTex } = makeOpalineGlobeTextures();
  trackTex(opalTex);
  trackTex(opalBumpTex);
  const washBalancedTex = trackTex(makeWallWashTexture(0.0));
  const washUplightTex = trackTex(makeWallWashTexture(0.75));
  const shadowTex = trackTex(makeSoftShadowTexture());

  // Shared materials
  const ivoryMat = trackMat(new THREE.MeshStandardMaterial({
    color: lin(0.91, 0.89, 0.84),
    roughness: 0.36,
    metalness: 0.04,
    envMapIntensity: 0.48,
  }));
  ivoryMat.userData._toneUniformsBound = true;
  ivoryMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vIvoryW;\nvarying vec3 vIvoryN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvIvoryW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvIvoryN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec4 uOutWeights;\nuniform float uOutStrength;\nuniform float uOutCyclesMix;\nvarying vec3 vIvoryW;\nvarying vec3 vIvoryN;\n${PROBE_CUBE_GLSL}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        if (uOutCyclesMix > 0.0005 && uHasProbeCube > 0.5) {
          float kIvC = clamp(uOutCyclesMix, 0.0, 1.0);
          vec3 pIv = sampleProbeCube(vIvoryW, normalize(vIvoryN));
          vec3 ivMod = clamp(pIv * 0.62 + vec3(0.05), vec3(0.16), vec3(1.35));
          reflectedLight.directDiffuse   *= mix(vec3(1.0), ivMod, kIvC);
          reflectedLight.indirectDiffuse *= mix(vec3(1.0), ivMod, kIvC);
        } else if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005) {
          float kIv = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
          float inAlcIv = smoothstep(19.90, 20.60, -vIvoryW.z);
          float ivScale = mix(1.0, mix(0.56, 0.90, inAlcIv), kIv);
          reflectedLight.directDiffuse   *= ivScale;
          reflectedLight.indirectDiffuse *= ivScale;
        }`);
  };
  const plasterMat = trackMat(new THREE.MeshStandardMaterial({
    color: lin(0.92, 0.895, 0.845),
    roughness: 0.78,
    metalness: 0.0,
    envMapIntensity: 0.28,
  }));
  plasterMat.userData._toneUniformsBound = true;
  // Sculptural 3D Ceramic Sconce Half-Bowl Shading (0-LSB on V9; probe-lit + glowing upper rim on Cycles C02-C05!):
  plasterMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBowlW;\nvarying vec3 vBowlN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvBowlW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvBowlN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec4 uOutWeights;\nuniform float uOutStrength;\nuniform float uOutCyclesMix;\nuniform vec3 uSconceColorCorr, uSconceColorAlc;\nvarying vec3 vBowlW;\nvarying vec3 vBowlN;\n${PROBE_CUBE_GLSL}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        if (uOutCyclesMix > 0.0005 && uHasProbeCube > 0.5) {
          // Cycle 4: Chromaticity-preserving luminance floor on probe-lit ceramic bowls (0 pink/lavender blue injection on C03!)
          float kBC = clamp(uOutCyclesMix, 0.0, 1.0);
          vec3 nB = normalize(vBowlN);
          vec3 pB = sampleProbeCube(vBowlW + nB * 0.02, nB);
          float bellyT = smoothstep(0.28, -0.70, nB.y);
          float wSumP = max(1e-4, dot(uOutWeights, vec4(1.0)));
          float c04Share = clamp(uOutWeights.z / wSumP, 0.0, 1.0);
          float inAlcLip = smoothstep(19.90, 20.60, -vBowlW.z);
          vec3 fallbackTint = mix(vec3(1.0, 0.94, 0.84), vec3(0.86, 0.94, 1.04), c04Share * inAlcLip);
          float pLum = dot(pB, vec3(0.2126, 0.7152, 0.0722));
          float minLum = mix(0.26, 0.42, inAlcLip);
          vec3 pBowl = (pLum < minLum)
            ? ((pLum > 1e-4) ? (pB * (mix(pLum, minLum, 0.72) / pLum)) : (fallbackTint * minLum))
            : pB;
          vec3 bowlLit = diffuseColor.rgb * (pBowl * mix(1.10, 0.74, bellyT));
          float topLip = smoothstep(2.334, 2.362, vBowlW.y) * (1.0 - smoothstep(2.375, 2.42, vBowlW.y));
          vec3 scColLip = mix(uSconceColorCorr, uSconceColorAlc, inAlcLip);
          scColLip = mix(scColLip, vec3(0.58, 0.64, 0.70), c04Share * inAlcLip);
          reflectedLight.directDiffuse    = mix(reflectedLight.directDiffuse, vec3(0.0), kBC);
          reflectedLight.indirectDiffuse  = mix(reflectedLight.indirectDiffuse, bowlLit, kBC) + scColLip * (0.42 * topLip * kBC);
          reflectedLight.indirectSpecular *= mix(1.0, 0.35, kBC);
        } else if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005) {
          float wSumB = max(1e-4, dot(uOutWeights, vec4(1.0)));
          float kBowl = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
          float inAlcB = smoothstep(19.90, 20.60, -vBowlW.z);
          float foreB  = mix(0.82, 1.0, smoothstep(9.5, 18.0, -vBowlW.z));
          vec3 nB = normalize(vBowlN);
          // Outer/underside curve of the ceramic bowl sits in rich 3D counter-shadow (~30-46% sRGB), rising to a warm glowing upper lip!
          float bellyT = smoothstep(0.32, -0.68, nB.y);
          float bowlScale = mix(mix(0.78, 0.18, bellyT) * foreB, mix(0.86, 0.32, bellyT), inAlcB);
          vec3 corrTintB = (uOutWeights.z * vec3(1.09, 1.00, 0.89)
                          + uOutWeights.w * vec3(1.24, 1.01, 0.76)
                          + uOutWeights.y * vec3(1.56, 0.92, 0.46)
                          + uOutWeights.x * vec3(1.26, 0.99, 0.72)) / wSumB;
          vec3 alcTintB  = (uOutWeights.z * vec3(0.92, 1.00, 1.07)
                          + uOutWeights.w * vec3(1.18, 1.01, 0.82)
                          + uOutWeights.y * vec3(1.48, 0.92, 0.48)
                          + uOutWeights.x * vec3(1.20, 1.00, 0.78)) / wSumB;
          vec3 bowlTint = mix(corrTintB, alcTintB, inAlcB) * bowlScale;
          float topLip = smoothstep(2.334, 2.362, vBowlW.y) * (1.0 - smoothstep(2.375, 2.42, vBowlW.y));
          vec3 lipFbCol = mix(vec3(0.62, 0.44, 0.24), vec3(0.56, 0.62, 0.68), clamp(uOutWeights.z / wSumB, 0.0, 1.0) * inAlcB);
          reflectedLight.directDiffuse   *= mix(vec3(1.0), bowlTint, kBowl);
          reflectedLight.indirectDiffuse *= mix(vec3(1.0), bowlTint, kBowl);
          reflectedLight.indirectSpecular *= mix(1.0, 0.35, kBowl);
          reflectedLight.indirectDiffuse += lipFbCol * (topLip * kBowl);
        }`);
  };
  // B1: Every toneMapped:true material binds SHARED_OUTSIDE_UNIFORMS so scene.js CustomToneMapping uTmOutMix/uTmAgx* are always bound!
  const bindToneUniforms = (mat) => {
    mat.userData = { ...(mat.userData || {}), _toneUniformsBound: true };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
    };
    return mat;
  };
  const brassMat = bindToneUniforms(trackMat(new THREE.MeshStandardMaterial({
    color: lin(0.74, 0.48, 0.17),
    roughness: 0.24,
    metalness: 0.90,
    envMapIntensity: 0.78,
  })));
  const knurlBrassMat = bindToneUniforms(trackMat(new THREE.MeshStandardMaterial({
    color: lin(0.72, 0.46, 0.16),
    roughness: 0.32,
    metalness: 0.88,
    bumpMap: knurlBumpTex,
    bumpScale: 0.0018,
    envMapIntensity: 0.75,
  })));
  const slotMat = bindToneUniforms(trackMat(new THREE.MeshStandardMaterial({
    color: 0x0f0e0d,
    roughness: 0.86,
    metalness: 0.05,
    envMapIntensity: 0.08,
  })));
  const honeycombMat = trackMat(new THREE.MeshStandardMaterial({
    map: hexTex,
    emissiveMap: hexTex,
    emissive: new THREE.Color(0xffcf84),
    emissiveIntensity: 1.20,
    roughness: 0.38,
    metalness: 0.22,
    toneMapped: false,
  }));
  const alabasterMat = trackMat(new THREE.MeshStandardMaterial({
    color: lin(0.90, 0.85, 0.76),
    map: alabTex,
    emissiveMap: alabTex,
    emissive: new THREE.Color(0xfad396),
    emissiveIntensity: 0.84,
    bumpMap: alabBumpTex,
    bumpScale: 0.0055,
    roughness: 0.30,
    metalness: 0.0,
    envMapIntensity: 0.25,
    toneMapped: true,
  }));
  const plateMat = bindToneUniforms(trackMat(new THREE.MeshStandardMaterial({
    map: plateTex,
    bumpMap: plateBumpTex,
    bumpScale: 0.0085,
    roughness: 0.42,
    metalness: 0.02,
    envMapIntensity: 0.46,
  })));
  const opalineMat = trackMat(new THREE.MeshStandardMaterial({
    color: lin(0.82, 0.78, 0.70),
    map: opalTex,
    emissiveMap: opalTex,
    emissive: new THREE.Color(0xf4c884),
    emissiveIntensity: 0.74,
    bumpMap: opalBumpTex,
    bumpScale: 0.0046,
    roughness: 0.28,
    metalness: 0.0,
    envMapIntensity: 0.22,
    toneMapped: true,
  }));
  // Add subtle translucent glass rim darkening (`dot(N, V)`) so `S4` acorn globe silhouette & `S1` flutes read crisply against ivory plaster!
  for (const [gMat, rimFloor] of [[opalineMat, 0.78], [alabasterMat, 0.84]]) {
    gMat.userData = { ...(gMat.userData || {}), _toneUniformsBound: true };
    gMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float vRim = clamp(abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.0, 1.0);
        totalEmissiveRadiance *= mix(${rimFloor.toFixed(2)}, 1.08, pow(vRim, 0.65));`
      );
    };
  }
  const plasterGlowMat = trackMat(new THREE.MeshStandardMaterial({
    color: 0xfff2d6,
    emissive: new THREE.Color(0xffcf86),
    emissiveIntensity: 1.15,
    roughness: 0.4,
    toneMapped: false,
  }));
  plasterGlowMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGlowW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGlowW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec4 uOutWeights;\nuniform float uOutStrength;\nvarying vec3 vGlowW;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005) {
          float wSumGl = max(1e-4, dot(uOutWeights, vec4(1.0)));
          float kGl = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
          float alcGl = smoothstep(19.90, 20.60, -vGlowW.z);
          vec3 gl4 = mix(vec3(1.14, 1.05, 0.92), vec3(0.96, 1.13, 1.36), alcGl);
          vec3 glTint = (uOutWeights.z * gl4
                       + uOutWeights.w * vec3(1.14, 1.06, 0.94)
                       + uOutWeights.y * vec3(1.24, 1.00, 0.76)
                       + uOutWeights.x * vec3(1.18, 1.04, 0.86)) / wSumGl;
          totalEmissiveRadiance *= mix(vec3(1.0), glTint * 0.92, kGl);
        }`);
  };
  const floaterMat = bindToneUniforms(trackMat(new THREE.MeshStandardMaterial({
    color: lin(0.022, 0.018, 0.015),
    roughness: 0.34,
    metalness: 0.18,
    envMapIntensity: 0.40,
  })));
  const installWashDeYellow = (mat) => {
    mat.userData = { ...(mat.userData || {}), _toneUniformsBound: true };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, SHARED_OUTSIDE_UNIFORMS);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWashW;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWashW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec4 uOutWeights;\nuniform float uOutStrength;\nuniform float uOutCyclesMix;\nvarying vec3 vWashW;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          if (dot(uOutWeights, vec4(1.0)) > 0.0005 && uOutStrength > 0.0005) {
            float wSumW = max(1e-4, dot(uOutWeights, vec4(1.0)));
            float kWash = clamp(dot(uOutWeights, vec4(1.0)) * uOutStrength, 0.0, 1.0);
            float alcW  = smoothstep(19.90, 20.60, -vWashW.z);
            // Spatial C04 split (warm ~3050K halogen in corridor vs clean ~3800K ivory in alcove) + ~3100K champagne in C05 + ~2850K/2750K amber in C02/C03:
            vec3 w4 = mix(vec3(1.16, 1.06, 0.90) * 0.50, vec3(0.95, 1.17, 1.58) * 0.42, alcW);
            vec3 wTint = (uOutWeights.z * w4
                        + uOutWeights.w * vec3(1.18, 1.05, 0.88) * 0.52
                        + uOutWeights.y * vec3(1.30, 0.98, 0.66) * 0.60
                        + uOutWeights.x * vec3(1.22, 1.02, 0.76) * 0.52) / wSumW;
            diffuseColor.rgb *= mix(vec3(1.0), wTint, kWash);
          }
          // H2: Keep all 21 wash quads present & visible for P1 findWashQuads, smoothly dimming when physical Cycles B_sconce takes over:
          if (uOutCyclesMix > 0.0005) {
            diffuseColor.rgb *= mix(1.0, 0.15, clamp(uOutCyclesMix, 0.0, 1.0));
          }`);
    };
    return mat;
  };
  const washBalancedMat = installWashDeYellow(trackMat(new THREE.MeshBasicMaterial({
    map: washBalancedTex,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })));
  const washUplightMat = installWashDeYellow(trackMat(new THREE.MeshBasicMaterial({
    map: washUplightTex,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })));
  const shadowMat = bindToneUniforms(trackMat(new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })));

  // -------------------------------------------------------------------------
  // A. `groups.ceilingSpine` (Corridor + End-Alcove Dark-Slot Tracks & L/R Spots)
  // -------------------------------------------------------------------------
  const ceilingSpine = new THREE.Group();
  ceilingSpine.name = 'ceiling_spine';

  const spineIvoryGeos = [];
  const spineSlotGeos = [];
  const spineBrassGeos = [];
  const spineKnurlGeos = [];
  const spineHexGeos = [];

  // Shared extruded track builder: dual ivory flanges, recessed 15 mm matte-black bus slot,
  // end caps, and flush ceiling canopies with brass fasteners.
  const addTrackExtrusion = (s0, s1, ceilY, canopySList = []) => {
    const trackLen = Math.max(0.5, s1 - s0);
    const trackZMid = -0.5 * (s0 + s1);
    const trackYBot = ceilY - 0.022;

    for (const sx of [-1, 1]) {
      const flange = new THREE.BoxGeometry(0.0185, 0.024, trackLen);
      flange.translate(sx * 0.01675, trackYBot + 0.011, trackZMid);
      spineIvoryGeos.push(flange);
    }

    const topBack = new THREE.BoxGeometry(0.052, 0.004, trackLen);
    topBack.translate(0, ceilY - 0.002, trackZMid);
    spineIvoryGeos.push(topBack);

    const busSlot = new THREE.BoxGeometry(0.015, 0.012, Math.max(0.48, trackLen - 0.016));
    busSlot.translate(0, ceilY - 0.010, trackZMid);
    spineSlotGeos.push(busSlot);

    // Precision end caps at both ends of the track extrusion
    for (const sEnd of [s0, s1]) {
      const cap = new THREE.BoxGeometry(0.054, 0.025, 0.012);
      cap.translate(0, trackYBot + 0.0105, -sEnd);
      spineIvoryGeos.push(cap);

      const capTrim = new THREE.BoxGeometry(0.048, 0.018, 0.004);
      capTrim.translate(0, trackYBot + 0.0105, -sEnd + (sEnd === s0 ? 0.007 : -0.007));
      spineBrassGeos.push(capTrim);
    }

    // Ceiling canopies / coupler plates + tiny brass screw heads
    for (const sc of canopySList) {
      const zc = -sc;
      const canopy = new THREE.BoxGeometry(0.072, 0.007, 0.084);
      canopy.translate(0, ceilY - 0.0035, zc);
      spineIvoryGeos.push(canopy);

      for (const sx of [-0.030, 0.030]) {
        for (const dz of [-0.024, 0.024]) {
          const scr = new THREE.CylinderGeometry(0.003, 0.003, 0.003, 10);
          scr.translate(sx, ceilY - 0.007, zc + dz);
          spineBrassGeos.push(scr);
        }
      }
    }
  };

  // (a) Main corridor central ceiling track (`s = 4.45 .. 19.35 m` at `y = dims.C`)
  const trackS0 = dims.Y0 + 0.75;
  const trackS1 = dims.L - 0.65;
  const corridorCanopies = [];
  for (let sc = trackS0 + 1.85; sc < trackS1 - 0.5; sc += 1.85) {
    corridorCanopies.push(sc);
  }
  addTrackExtrusion(trackS0, trackS1, dims.C, corridorCanopies);

  // (b) Shorter central ceiling track in narrower end alcove (`s = 20.62 .. 23.38 m` at `y = dims.VC || 4.62`)
  const alcoveCeilY = dims.VC || (dims.C - 0.24) || 4.62;
  if (dims.VH > 0) {
    const alcBase = Math.abs(dims.L - 20.00) < 0.05 ? 20.00 : dims.L;
    addTrackExtrusion(alcBase + 0.62, alcBase + 3.38, alcoveCeilY, [alcBase + 0.85, alcBase + 3.15]);
  }

  // Hollow front brass bezel lathe profile (rInner = 0.037, rOuter = 0.0445, depth = 0.017)
  const bezelPts = [
    new THREE.Vector2(0.0370, 0.066),
    new THREE.Vector2(0.0445, 0.066),
    new THREE.Vector2(0.0445, 0.081),
    new THREE.Vector2(0.0420, 0.083),
    new THREE.Vector2(0.0370, 0.083),
    new THREE.Vector2(0.0370, 0.066),
  ];
  const baseBezelGeo = new THREE.LatheGeometry(bezelPts, 24);
  baseBezelGeo.rotateX(Math.PI * 0.5);

  const yokeHelper = new THREE.Object3D();
  const aimHelper = new THREE.Object3D();

  for (const sp of rig.spots) {
    const zMount = -sp.sMount;
    const spTrackYBot = (sp.inAlcove ? alcoveCeilY : dims.C) - 0.022;

    // Track adapter box + mounting screws
    const adapter = new THREE.BoxGeometry(0.044, 0.024, 0.072);
    adapter.translate(0, spTrackYBot + 0.003, zMount);
    spineIvoryGeos.push(adapter);

    for (const dz of [-0.024, 0.024]) {
      const aScr = new THREE.CylinderGeometry(0.0024, 0.0024, 0.004, 8);
      aScr.translate(0, spTrackYBot - 0.009, zMount + dz);
      spineBrassGeos.push(aScr);
    }

    const dx = sp.targetX;
    const dz = -sp.targetS - zMount;
    const yaw = Math.atan2(dx, dz);
    yokeHelper.position.set(0, sp.y, zMount);
    yokeHelper.rotation.set(0, yaw, 0);
    yokeHelper.updateMatrix();

    const upperCollar = new THREE.CylinderGeometry(0.015, 0.016, 0.018, 16);
    upperCollar.translate(0, 0.112, 0);
    spineKnurlGeos.push(transformedGeo(upperCollar, yokeHelper));
    upperCollar.dispose();

    const stemNeck = new THREE.CylinderGeometry(0.010, 0.010, 0.032, 12);
    stemNeck.translate(0, 0.091, 0);
    spineBrassGeos.push(transformedGeo(stemNeck, yokeHelper));
    stemNeck.dispose();

    const thumbPin = new THREE.CylinderGeometry(0.0065, 0.0065, 0.016, 12);
    thumbPin.rotateZ(Math.PI * 0.5);
    thumbPin.translate(0.016, 0.090, 0);
    spineKnurlGeos.push(transformedGeo(thumbPin, yokeHelper));
    thumbPin.dispose();

    const lowerCollar = new THREE.CylinderGeometry(0.014, 0.014, 0.015, 16);
    lowerCollar.translate(0, 0.070, 0);
    spineKnurlGeos.push(transformedGeo(lowerCollar, yokeHelper));
    lowerCollar.dispose();

    const yokeBar = new THREE.BoxGeometry(0.102, 0.006, 0.016);
    yokeBar.translate(0, 0.062, 0);
    spineBrassGeos.push(transformedGeo(yokeBar, yokeHelper));
    yokeBar.dispose();

    for (const sx of [-1, 1]) {
      const arm = new THREE.BoxGeometry(0.0055, 0.066, 0.016);
      arm.translate(sx * 0.048, 0.030, 0);
      spineBrassGeos.push(transformedGeo(arm, yokeHelper));
      arm.dispose();

      const wheel = new THREE.CylinderGeometry(0.008, 0.008, 0.010, 14);
      wheel.rotateZ(Math.PI * 0.5);
      wheel.translate(sx * 0.054, 0, 0);
      spineKnurlGeos.push(transformedGeo(wheel, yokeHelper));
      wheel.dispose();
    }

    aimHelper.position.set(0, sp.y, zMount);
    aimHelper.lookAt(sp.targetX, sp.targetY, -sp.targetS);
    aimHelper.updateMatrix();

    // Satin Pearl-Ivory spotlight barrel (8.5 cm dia x 14.0 cm long — crisp architectural presence at 4.86 m!)
    const barrelBody = new THREE.CylinderGeometry(0.0425, 0.0425, 0.138, 24);
    barrelBody.rotateX(Math.PI * 0.5);
    barrelBody.translate(0, 0, -0.002);
    spineIvoryGeos.push(transformedGeo(barrelBody, aimHelper));
    barrelBody.dispose();

    const rearRing = new THREE.CylinderGeometry(0.0432, 0.0432, 0.011, 24);
    rearRing.rotateX(Math.PI * 0.5);
    rearRing.translate(0, 0, -0.044);
    spineBrassGeos.push(transformedGeo(rearRing, aimHelper));
    rearRing.dispose();

    spineBrassGeos.push(transformedGeo(baseBezelGeo, aimHelper));

    const baffle = new THREE.CylinderGeometry(0.0368, 0.0368, 0.016, 20, 1, true);
    baffle.rotateX(Math.PI * 0.5);
    baffle.translate(0, 0, 0.065);
    spineSlotGeos.push(transformedGeo(baffle, aimHelper));
    baffle.dispose();

    const hexDisc = new THREE.CircleGeometry(0.0368, 24);
    hexDisc.translate(0, 0, 0.063);
    spineHexGeos.push(transformedGeo(hexDisc, aimHelper));
    hexDisc.dispose();
  }
  baseBezelGeo.dispose();

  const addMerged = (parent, geos, mat, name) => {
    const mGeo = mergeClean(geos);
    if (!mGeo) return null;
    const mesh = new THREE.Mesh(mGeo, mat);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  addMerged(ceilingSpine, spineIvoryGeos, ivoryMat, 'spine_ivory');
  addMerged(ceilingSpine, spineSlotGeos, slotMat, 'spine_slot');
  addMerged(ceilingSpine, spineBrassGeos, brassMat, 'spine_brass');
  addMerged(ceilingSpine, spineKnurlGeos, knurlBrassMat, 'spine_knurl_brass');
  addMerged(ceilingSpine, spineHexGeos, honeycombMat, 'spine_honeycomb');

  // -------------------------------------------------------------------------
  // B. Sconce Builders (`S1` Alabaster, `S4` Opaline Globe, `S5` Plaster Bowl)
  // -------------------------------------------------------------------------
  const sconceAlabaster = new THREE.Group();
  sconceAlabaster.name = 'sconce_alabaster';

  const sconceGlobe = new THREE.Group();
  sconceGlobe.name = 'sconce_globe';
  sconceGlobe.visible = false;

  const sconcePlaster = new THREE.Group();
  sconcePlaster.name = 'sconce_plaster';
  sconcePlaster.visible = false;

  // Shared wall transform helper
  const wallObj = new THREE.Object3D();

  // --- S1 Geometry Templates ---
  const s1AlabProto = new THREE.CylinderGeometry(0.052, 0.052, 0.332, 24, 1, true, -Math.PI * 0.5, Math.PI);
  const s1CapProto = makeHalfDiscGeometry(0.054, 0.014);
  const s1AlabGeos = [];
  const s1BrassGeos = [];
  const s1WashGeos = [];
  const s1ShadowGeos = [];

  // --- S4 Geometry Templates ---
  const s4PlateProto = new THREE.BoxGeometry(0.126, 0.126, 0.012);
  s4PlateProto.translate(0, 0, 0.006);
  const s4ArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0, 0.022),
    new THREE.Vector3(0, 0.0, 0.064),
    new THREE.Vector3(0, -0.048, 0.088),
    new THREE.Vector3(0, -0.052, 0.118),
    new THREE.Vector3(0, 0.014, 0.132),
  ]);
  const s4ArmProto = new THREE.TubeGeometry(s4ArmCurve, 20, 0.0075, 10, false);
  const s4FitterPts = [
    new THREE.Vector2(0.012, 0.012),
    new THREE.Vector2(0.016, 0.016),
    new THREE.Vector2(0.014, 0.024),
    new THREE.Vector2(0.022, 0.032),
    new THREE.Vector2(0.035, 0.044),
    new THREE.Vector2(0.038, 0.052),
    new THREE.Vector2(0.032, 0.054),
  ];
  const s4FitterProto = new THREE.LatheGeometry(s4FitterPts, 20);
  s4FitterProto.translate(0, 0, 0.132);

  // Acorn globe: 11.5 cm dia (r = 0.0575) x 13.5 cm tall (y = 0.052..0.187)
  const s4GlobePts = [
    new THREE.Vector2(0.031, 0.052),
    new THREE.Vector2(0.047, 0.068),
    new THREE.Vector2(0.0565, 0.094),
    new THREE.Vector2(0.0575, 0.120),
    new THREE.Vector2(0.051, 0.150),
    new THREE.Vector2(0.036, 0.174),
    new THREE.Vector2(0.016, 0.185),
    new THREE.Vector2(0.0, 0.187),
  ];
  const s4GlobeProto = new THREE.LatheGeometry(s4GlobePts, 28);
  const s4PlateGeos = [];
  const s4BrassGeos = [];
  const s4GlobeGeos = [];
  const s4WashGeos = [];
  const s4ShadowGeos = [];

  // --- S5 Geometry Templates ---
  const s5BowlProto = makeParabolicHalfBowlGeometry(0.085, 0.085, 0.155, 0.008);
  const s5LipProto = makeHalfRimLipGeometry(0.085, 0.085, 0.007, 0.0045);
  s5LipProto.translate(0, 0.062, 0);
  const s5GlowProto = new THREE.CylinderGeometry(0.075, 0.075, 0.004, 20, 1, false, -Math.PI * 0.5, Math.PI);
  s5GlowProto.translate(0, 0.052, 0);
  const s5PlasterGeos = [];
  const s5BrassGeos = [];
  const s5GlowGeos = [];
  const s5WashGeos = [];
  const s5ShadowGeos = [];

  for (const sc of rig.sconces) {
    wallObj.position.set(sc.x, sc.y, -sc.s);
    wallObj.rotation.set(0, sc.wall === 'L' ? Math.PI * 0.5 : -Math.PI * 0.5, 0);
    wallObj.updateMatrix();
    const M = wallObj.matrix;

    // --- Populate S1 ---
    s1AlabGeos.push(transformedGeo(s1AlabProto, M));

    const capTop = s1CapProto.clone();
    capTop.translate(0, 0.173, 0);
    s1BrassGeos.push(transformedGeo(capTop, M));
    capTop.dispose();

    const capBot = s1CapProto.clone();
    capBot.translate(0, -0.173, 0);
    s1BrassGeos.push(transformedGeo(capBot, M));
    capBot.dispose();

    for (const sx of [-1, 1]) {
      const rail = new THREE.BoxGeometry(0.007, 0.360, 0.014);
      rail.translate(sx * 0.0525, 0, 0.007);
      s1BrassGeos.push(transformedGeo(rail, M));
      rail.dispose();

      for (const sy of [-0.105, 0.0, 0.105]) {
        const scr = new THREE.CylinderGeometry(0.0022, 0.0022, 0.003, 8);
        scr.rotateZ(Math.PI * 0.5);
        scr.translate(sx * 0.0565, sy, 0.007);
        s1BrassGeos.push(transformedGeo(scr, M));
        scr.dispose();
      }
    }

    const s1Wash = new THREE.PlaneGeometry(0.92, 1.18);
    s1Wash.translate(0, 0, 0.0025);
    s1WashGeos.push(transformedGeo(s1Wash, M));
    s1Wash.dispose();

    const s1Sh = new THREE.PlaneGeometry(0.22, 0.46);
    s1Sh.translate(0.004, -0.010, 0.0018);
    s1ShadowGeos.push(transformedGeo(s1Sh, M));
    s1Sh.dispose();

    // --- Populate S4 ---
    s4PlateGeos.push(transformedGeo(s4PlateProto, M));

    // 4 brass screws on embossed plate
    for (const [px, py] of [[0, 0.049], [0, -0.049], [-0.049, 0], [0.049, 0]]) {
      const scr = new THREE.CylinderGeometry(0.0032, 0.0032, 0.003, 10);
      scr.rotateX(Math.PI * 0.5);
      scr.translate(px, py, 0.013);
      s4BrassGeos.push(transformedGeo(scr, M));
      scr.dispose();
    }

    const s4Collar = new THREE.CylinderGeometry(0.017, 0.022, 0.012, 16);
    s4Collar.rotateX(Math.PI * 0.5);
    s4Collar.translate(0, 0, 0.017);
    s4BrassGeos.push(transformedGeo(s4Collar, M));
    s4Collar.dispose();

    s4BrassGeos.push(transformedGeo(s4ArmProto, M));

    const s4Knuckle = new THREE.CylinderGeometry(0.0105, 0.0105, 0.018, 14);
    s4Knuckle.translate(0, 0.004, 0.132);
    s4BrassGeos.push(transformedGeo(s4Knuckle, M));
    s4Knuckle.dispose();

    const s4SetScrew = new THREE.CylinderGeometry(0.0035, 0.0035, 0.008, 10);
    s4SetScrew.rotateZ(Math.PI * 0.5);
    s4SetScrew.translate(0.012, 0.004, 0.132);
    s4BrassGeos.push(transformedGeo(s4SetScrew, M));
    s4SetScrew.dispose();

    s4BrassGeos.push(transformedGeo(s4FitterProto, M));

    const gMeshGeo = s4GlobeProto.clone();
    gMeshGeo.translate(0, 0, 0.132);
    s4GlobeGeos.push(transformedGeo(gMeshGeo, M));
    gMeshGeo.dispose();

    const s4Wash = new THREE.PlaneGeometry(0.98, 1.08);
    s4Wash.translate(0, 0.08, 0.0025);
    s4WashGeos.push(transformedGeo(s4Wash, M));
    s4Wash.dispose();

    const s4Sh = new THREE.PlaneGeometry(0.22, 0.24);
    s4Sh.translate(0.004, -0.012, 0.0018);
    s4ShadowGeos.push(transformedGeo(s4Sh, M));
    s4Sh.dispose();

    // --- Populate S5 ---
    s5PlasterGeos.push(transformedGeo(s5BowlProto, M));
    s5BrassGeos.push(transformedGeo(s5LipProto, M));
    s5GlowGeos.push(transformedGeo(s5GlowProto, M));

    const s5Wash = new THREE.PlaneGeometry(0.96, 1.06);
    s5Wash.translate(0, 0.22, 0.0025);
    s5WashGeos.push(transformedGeo(s5Wash, M));
    s5Wash.dispose();

    const s5Sh = new THREE.PlaneGeometry(0.24, 0.24);
    s5Sh.translate(0.004, -0.025, 0.0018);
    s5ShadowGeos.push(transformedGeo(s5Sh, M));
    s5Sh.dispose();
  }

  // Dispose prototype geometries
  s1AlabProto.dispose();
  s1CapProto.dispose();
  s4PlateProto.dispose();
  s4ArmProto.dispose();
  s4FitterProto.dispose();
  s4GlobeProto.dispose();
  s5BowlProto.dispose();
  s5LipProto.dispose();
  s5GlowProto.dispose();

  const markNoRefl = (m) => { if (m) m.userData.noRefl = true; return m; };

  addMerged(sconceAlabaster, s1AlabGeos, alabasterMat, 's1_alabaster');
  addMerged(sconceAlabaster, s1BrassGeos, brassMat, 's1_brass');
  markNoRefl(addMerged(sconceAlabaster, s1WashGeos, washBalancedMat, 's1_wash'));
  markNoRefl(addMerged(sconceAlabaster, s1ShadowGeos, shadowMat, 's1_shadow'));

  addMerged(sconceGlobe, s4PlateGeos, plateMat, 's4_plate');
  addMerged(sconceGlobe, s4BrassGeos, brassMat, 's4_brass');
  addMerged(sconceGlobe, s4GlobeGeos, opalineMat, 's4_opaline');
  markNoRefl(addMerged(sconceGlobe, s4WashGeos, washBalancedMat, 's4_wash'));
  markNoRefl(addMerged(sconceGlobe, s4ShadowGeos, shadowMat, 's4_shadow'));

  addMerged(sconcePlaster, s5PlasterGeos, plasterMat, 's5_plaster');
  addMerged(sconcePlaster, s5BrassGeos, brassMat, 's5_brass_lip');
  addMerged(sconcePlaster, s5GlowGeos, plasterGlowMat, 's5_glow');
  markNoRefl(addMerged(sconcePlaster, s5WashGeos, washUplightMat, 's5_wash'));
  markNoRefl(addMerged(sconcePlaster, s5ShadowGeos, shadowMat, 's5_shadow'));

  // -------------------------------------------------------------------------
  // C. `groups.frameAccents` (Museum Shadow-Gap & Brass-Fillet Frame Accents)
  // -------------------------------------------------------------------------
  const frameAccents = new THREE.Group();
  frameAccents.name = 'frame_accents';

  const frameBrassGeos = [];
  const frameFloaterGeos = [];

  for (const a of (layout.art || [])) {
    if (catalog && catalog[a.id] && catalog[a.id].kind === 'poster') continue;
    const { w, h } = getArtDims(a, artSize, catalog);
    const sg = a.wall === 'L' ? -1 : 1;
    const xi = sg * (a.s > dims.L ? dims.VH : dims.HW);

    wallObj.position.set(xi, a.y, -a.s);
    wallObj.rotation.set(0, a.wall === 'L' ? Math.PI * 0.5 : -Math.PI * 0.5, 0);
    wallObj.updateMatrix();
    const M = wallObj.matrix;

    // 3.5 mm brushed antique-brass inner liner bevel (inner >= w + 0.006 -> never crops canvas!)
    const linerGeo = makeHollowRectFrameGeo(w + 0.006, h + 0.006, w + 0.013, h + 0.013, 0.0482, 0.0522);
    frameBrassGeos.push(transformedGeo(linerGeo, M));
    linerGeo.dispose();

    // Outer stepped dark-bronze/ebony museum floater frame (4.5 mm shadow-gap, depth 5.4 cm)
    const floaterBody = makeHollowRectFrameGeo(w + 0.022, h + 0.022, w + 0.068, h + 0.068, 0.002, 0.056);
    frameFloaterGeos.push(transformedGeo(floaterBody, M));
    floaterBody.dispose();

    const floaterStep = makeHollowRectFrameGeo(w + 0.048, h + 0.048, w + 0.068, h + 0.068, 0.056, 0.059);
    frameFloaterGeos.push(transformedGeo(floaterStep, M));
    floaterStep.dispose();
  }

  addMerged(frameAccents, frameBrassGeos, brassMat, 'art_brass_fillets');
  addMerged(frameAccents, frameFloaterGeos, floaterMat, 'art_floater_frames');

  // Assemble root
  root.add(ceilingSpine, sconceAlabaster, sconceGlobe, sconcePlaster, frameAccents);

  const groups = {
    ceilingSpine,
    sconceAlabaster,
    sconceGlobe,
    sconcePlaster,
    frameAccents,
  };

  // -------------------------------------------------------------------------
  // D. State & Lifecycle Control
  // -------------------------------------------------------------------------
  const currentState = {
    sconces: 'plaster',
    ceilingSpine: true,
    frameAccents: true,
    ceilHeight: dims.C,
    intensity: 1.0,
    spotGain: 1.25,
    sconceGain: 1.10,
    warmth: 0.82,
  };

  function normalizeSconceKey(v) {
    if (v === false || v === 'off' || v === 'none') return 'off';
    const s = String(v).toLowerCase();
    if (s === 'globe' || s === 's4' || s === 'acorn') return 'globe';
    if (s === 'plaster' || s === 's5' || s === 'bowl') return 'plaster';
    return 'alabaster';
  }

  function setState(patch = {}) {
    if (!patch || typeof patch !== 'object') return;
    if (patch.sconceStyle !== undefined) currentState.sconces = normalizeSconceKey(patch.sconceStyle);
    if (patch.sconces !== undefined) currentState.sconces = normalizeSconceKey(patch.sconces);
    if (patch.sconce !== undefined) currentState.sconces = normalizeSconceKey(patch.sconce);

    if (patch.ceilingSpine !== undefined) currentState.ceilingSpine = !!patch.ceilingSpine;
    if (patch.spots !== undefined) currentState.ceilingSpine = !!patch.spots;
    if (patch.track !== undefined) currentState.ceilingSpine = !!patch.track;

    if (patch.frameAccents !== undefined) currentState.frameAccents = !!patch.frameAccents;
    if (patch.frames !== undefined) currentState.frameAccents = !!patch.frames;

    if (patch.ceilHeight !== undefined) currentState.ceilHeight = +patch.ceilHeight || dims.C;
    if (patch.intensity !== undefined) {
      currentState.intensity = Math.max(0, +patch.intensity);
      if (patch.spotGain === undefined) currentState.spotGain = 1.55 * currentState.intensity;
      if (patch.sconceGain === undefined) currentState.sconceGain = 1.65 * currentState.intensity;
    }
    if (patch.spotGain !== undefined) currentState.spotGain = Math.max(0, +patch.spotGain);
    if (patch.sconceGain !== undefined) currentState.sconceGain = Math.max(0, +patch.sconceGain);
    if (patch.warmth !== undefined) currentState.warmth = Math.max(0, Math.min(1, +patch.warmth));
    else if (patch.lightWarmth !== undefined) currentState.warmth = Math.max(0, Math.min(1, +patch.lightWarmth));

    ceilingSpine.visible = currentState.ceilingSpine;
    frameAccents.visible = currentState.frameAccents;
    sconceAlabaster.visible = currentState.sconces === 'alabaster';
    sconceGlobe.visible = currentState.sconces === 'globe';
    sconcePlaster.visible = currentState.sconces === 'plaster';

    const extraH = currentState.ceilHeight - dims.C;
    ceilingSpine.position.y = extraH;
    // Sconces sit at y = 2.30 m (<= 4.18 m human-anchored zone -> 0.0 * extraH)
    const sconceLift = 0.0;
    sconceAlabaster.position.y = sconceLift;
    sconceGlobe.position.y = sconceLift;
    sconcePlaster.position.y = sconceLift;

    const { spotGain, sconceGain, warmth } = currentState;
    const warmTint = kelvinWarmthTint(warmth);

    washBalancedMat.color.copy(warmTint);
    washUplightMat.color.copy(warmTint);
    washBalancedMat.opacity = 0.085 * sconceGain;
    washUplightMat.opacity = 0.065 * sconceGain;

    alabasterMat.emissive.copy(warmTint);
    alabasterMat.emissiveIntensity = 0.78 * Math.min(1.45, 0.55 + 0.45 * sconceGain);

    opalineMat.emissive.copy(warmTint);
    opalineMat.emissiveIntensity = 0.72 * Math.min(1.45, 0.55 + 0.45 * sconceGain);

    plasterGlowMat.emissive.copy(warmTint);
    plasterGlowMat.emissiveIntensity = 1.10 * Math.min(1.55, 0.55 + 0.45 * sconceGain);

    honeycombMat.emissive.copy(warmTint);
    honeycombMat.emissiveIntensity = 1.15 * spotGain * (0.75 + 0.25 * warmth);
  }

  setState(currentState);

  function dispose() {
    root.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });
    for (const m of ownedMaterials) m.dispose();
    for (const t of ownedTextures) t.dispose();
    root.clear();
  }

  return { root, groups, rig, setState, dispose };
}
