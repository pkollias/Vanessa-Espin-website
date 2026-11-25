// Iyuana: the aisle, elevated (v2).
// A calm walk at eye height between her hanging boards, each lit by its own warm spot and dappled by her
// palm's shadow, to the clearing where the round film plays on the last board. The film's light grows into a
// halo, closes to a point, floods the room, and out of that light her poster comes forward and settles.
// Image rule: only the Fujifilm photographs (142-157) are seen large; the poster never past half its pixel
// width; phone photos only as transformed surfaces (162: leaf shadow, 175: the floor's own maple).
//
// aisle-final v5 (Nov 17, night): v3 with the one thing he kept from v4: the walk opens inside the first
// photograph (4633), full frame, the title printed in ink on its pale wall, and pulls straight back out of it into
// v3's walk. Everything else is v3 (camera, light, palms, lens). ?open=0 gives v3's entrance.
//
// aisle-final v3 (Nov 17): the converged walk. v2's pace and fire ending (b, into the fire) with the hang he chose
// (m1: the hands print alone, her four board categories, a night board of two candles, her presenting alone).
// ?hang=final|tall-b|tall-c gives the three-photo options he passed over.
//
// aisle-mega (Nov 17): the composed hang. Any number of boards (from hangs.json), each wall label optional;
// the room, palms, film and poster move back as the walk grows. Four leaf-shadowed lamps are shared among the
// boards nearest the walker (a GPU has 16 texture slots), so boards further ahead stay dark until you near them.
//
// aisle-hang (Nov 17): the hang round. The boards are read from hangs.json (?hang=<id>): which of the Fujifilm
// photographs hang on each board and how (rows, columns, free, or bare prints on their own wires). Everything else is v2.
//
// v2 (Nov 17): pace and fire.
// Pace: v1 stood still for most of its scroll (a 1000 px hold at every board, and walks that eased out of and
// into a dead stop), behind a slow spring. v2 never parks: the walk slows to a drift at each board and keeps
// going, the moves between boards are shorter, and the spring follows the hand more closely. ?pace=old is v1.
// Fire: the ending passes through the poster's own fire, seen close and out of focus, as in the one-descent
// walk: a hard-edged lens in linear light that weights the bright parts, so the flame spreads into a glow while
// the dark stays dark. ?fire=a|b|c picks the variant; ?fire=0 is v1's white flood.
import * as THREE from 'three';
import { TRAJECTORIES, TRAJECTORY_LIST } from '../trajectories/paths.js?v=20261122g';
import { SCHEDULE_PRESETS, SCHEDULE_VERSION, STATION_DEFS, cloneSchedule, compileSchedule, decodeScheduleParam } from '../trajectories/schedule.js?v=20261123g';
import { IYUANA_TRACKS, createIyuanaAudio } from '../ambient-audio.js?v=20261122g';
import { skipUnlitLights } from '/shared/film-lights.js';
skipUnlitLights(THREE);   // a lamp's maths is skipped wherever its cone does not reach: same picture, far less work (see the file)

const A = '../assets/';
const qs = new URLSearchParams(location.search);
if (qs.get('clean') === '1') document.body.classList.add('clean');
if (qs.get('embed') === '1') document.body.classList.add('embed');
try {
  if (window.parent !== window && window.parent.document.getElementById('progSeam')) {
    document.body.classList.add('in-fold-stage');
  }
} catch {}

// Load any saved v2 custom schedule from `/api/iyuana-trajectories` unless overridden by `?sched=` or `?dur=`
let initialSched = decodeScheduleParam(qs.get('sched'));
if (!initialSched && !qs.has('dur')) {
  try {
    const r = await fetch('/api/iyuana-trajectories', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      if (d?.__schedule?.sched?.version === SCHEDULE_VERSION) initialSched = d.__schedule.sched;
    }
  } catch {}
}
if (!initialSched) {
  initialSched = cloneSchedule(SCHEDULE_PRESETS.balanced);
  if (qs.has('dur')) {
    const targetDur = Math.min(90, Math.max(8, Number(qs.get('dur')) || 31.5));
    const scale = targetDur / initialSched.totalSec;
    initialSched.departSec *= scale;
    for (const def of STATION_DEFS) {
      initialSched.stops[def.id].arrive *= scale;
      initialSched.stops[def.id].leave *= scale;
    }
    initialSched.roomSec *= scale;
    initialSched.totalSec = targetDur;
  }
}
let compiledSched = compileSchedule(initialSched);
let FILM_DURATION = compiledSched.totalSec;

let activeTrajId = (qs.get('traj') || 'T1').toUpperCase();
if (!TRAJECTORIES[activeTrajId]) activeTrajId = 'T1';
const AT = qs.has('at') ? +qs.get('at') : null;          // jump to a position (0..1 or legacy px)
const TIME_Q = qs.has('t') ? +qs.get('t') : null;        // jump to a movie timestamp in seconds
const FILM_AT = qs.has('film') ? +qs.get('film') : null; // hold the film on one moment (stills)
const CAM = qs.has('cam') ? qs.get('cam').split(',').map(Number) : null; // fixed camera for close-up stills
const PACE = 'new';
const FIRE = ['0', 'a', 'b', 'c'].includes(qs.get('fire')) ? qs.get('fire') : 'b';
const MANUAL = qs.has('manual');                          // captures: the script drives the clock and the movie time
const OPEN = qs.get('open') === '0' ? '0' : 'photo';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HANG_DATA = await (await fetch('./hangs.json', { cache: 'no-store' })).json();
const HANG = HANG_DATA.mocks.find((m) => m.id === (qs.get('hang') ?? 'panels-4')) ?? HANG_DATA.mocks[0];
document.body.classList.toggle('open-photo', OPEN === 'photo' && activeTrajId === 'T1' && HANG.id !== 'panels-4');
const body = document.body;

// ---------------------------------------------------------------- small tools
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
function cubicBezier(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-6) break; const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    if (Math.abs(sx(t) - x) > 1e-4) { let lo = 0, hi = 1; t = x; for (let i = 0; i < 30; i++) { if (sx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; } }
    return sy(t);
  };
}
const easeIn = cubicBezier(0.55, 0, 0.9, 0.45), easeOut = cubicBezier(0.12, 0.6, 0.3, 1), land = cubicBezier(0.22, 0.9, 0.3, 1);

// ---------------------------------------------------------------- the film track
// v206 is a phone recording of the round film projected in the dark; this is the circle's smoothed centre
// (source pixels, every 0.1 s) and half-size, measured from the clip, so the slide can be steadied.
const TRACK = { rx: 113, ry: 132, dt: 0.1, c: [337,274,337,276,337,279,337,283,337,287,337,290,337,292,337,295,338,296,338,298,338,299,339,300,340,301,341,301,342,302,343,302,344,302,344,302,345,302,346,302,346,302,346,302,347,302,347,302,347,302,347,302,347,302,347,302,347,302,347,302,347,302,347,302,347,302,347,302,347,302,346,302,346,302,346,302,345,302,344,302,343,302,342,302,341,302,340,302,339,302,339,303,338,303,338,303,337,303,336,303,336,303,335,303,335,303,334,303,334,303,334,303,333,303,333,302,333,302,334,301,333,301,333,301,333,301,332,301,331,301,329,301,328,300,327,300,326,300,326,299,325,299,324,299,325,298,326,298,327,297,328,296,329,296,330,295,330,295,330,295,330,295,329,296,329,296,329,296,328,296,328,296,328,296,327,296,327,296,326,296,326,297,326,297,326,297,326,298,326,298,326,299,326,299,326,299,326,300,326,300,326,300,326,301,326,301,326,302,326,302,326,302,326,303,326,303,325,303,325,303,325,303,325,303,325,303,326,303,326,303,326,304,326,304,325,304,325,305,325,305,325,305,325,305,325,305,325,305,325,305,325,305,325,305,325,305,325,306,325,306,325,306,325,306,325,306,325,306,325,306,325,306,324,307,324,307,324,307,323,307,323,307,322,307,322,307,322,307,322,307,321,307,321,307,321,307,321,307,321,307,321,307,321,307,320,307,320,307,320,307,319,307,319,307,319,307,319,307,319,307,319,307,318,307,318,307,318,308,317,308,317,308,316,308,316,309,316,309,316,309,315,309,314,310,314,310,314,310,314,310,313,310,313,310,313,310,313,310,313,310,312,310,312,310,312,310,312,309,312,309,312,309,312,309,312,308,311,308,311,308,311,308,312,308,312,308,312,308,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307,313,307] };

// ---------------------------------------------------------------- contact-hardening soft shadows
// Shadows are sharp where a board is close to what it shades and widen with distance, as under a real lamp:
// a blocker search, then a filter sized by the gap. Spot shadow cameras all share near 0.3 / far 14.
{
  const C = THREE.ShaderChunk, chunk = C.shadowmap_pars_fragment;
  const sig = 'float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {';
  const at = chunk.lastIndexOf(sig);
  const PCSS = `
    float pcssLin( float d ) { return 0.3 * 14.0 / ( 14.0 - d * ( 14.0 - 0.3 ) ); }
    vec2 pcssDisk( int i, int n, float phi ) { float r = sqrt( ( float( i ) + 0.5 ) / float( n ) ); float th = float( i ) * 2.399963 + phi; return vec2( cos( th ), sin( th ) ) * r; }
    float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
      shadowCoord.xyz /= shadowCoord.w; shadowCoord.z += shadowBias;
      if ( shadowCoord.x < 0.0 || shadowCoord.x > 1.0 || shadowCoord.y < 0.0 || shadowCoord.y > 1.0 || shadowCoord.z > 1.0 ) return 1.0;
      float texel = 1.0 / shadowMapSize.x;
      float phi = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) ) * 6.2831853;
      float zR = pcssLin( shadowCoord.z ), sum = 0.0, cnt = 0.0;
      for ( int i = 0; i < 12; i ++ ) {
        float d = texture2D( shadowMap, shadowCoord.xy + pcssDisk( i, 12, phi ) * shadowRadius * 1.2 * texel ).r;
        if ( d < shadowCoord.z ) { sum += pcssLin( d ); cnt += 1.0; }
      }
      if ( cnt < 0.5 ) return 1.0;
      float zB = sum / cnt;
      float r = clamp( 1.2 + shadowRadius * ( zR - zB ) / zB, 1.2, shadowRadius ) * texel;
      float lit = 0.0;
      for ( int i = 0; i < 20; i ++ ) lit += step( shadowCoord.z, texture2D( shadowMap, shadowCoord.xy + pcssDisk( i, 20, phi * 1.618 ) * r ).r );
      return mix( 1.0, lit / 20.0, shadowIntensity );
    }
  `;
  if (at > 0) C.shadowmap_pars_fragment = chunk.slice(0, at) + PCSS + chunk.slice(at).replace('float getShadow(', 'float getShadowBasic(');
}

// ---------------------------------------------------------------- the room
const CEIL = 4.4;
const NB = HANG.boards.length, SPACING = HANG.spacing ?? 3.0;
const BZ = (i) => -0.9 - i * SPACING;
const END_Z = BZ(NB - 1) - 6.7;
const WARM = new THREE.Color().setRGB(1.0, 0.8, 0.6, THREE.LinearSRGBColorSpace);
const EMBER = new THREE.Color().setRGB(1.0, 0.42, 0.14, THREE.LinearSRGBColorSpace);
const FLASH = new THREE.Color().setRGB(1.0, 0.9, 0.78, THREE.LinearSRGBColorSpace);

// Her hanging panels face the walker, staggered left and right as in her room; each has a discreet museum
// exhibition tag on its outer side, hung on fine wires, so no text ever stands in front of a photograph.
const LABELS = [
  { k: '01 · Panel I', t: ['Selva Viva'], sub: 'Sápara Territory, Ecuadorian Amazon', med: 'Archival pigment prints, 2026' },
  { k: '02 · Panel II', t: ['El Río y la Vida'], sub: 'Pastaza Basin · Daily Life & Craft', med: 'Archival pigment prints, 2026' },
  { k: '03 · Panel III', t: ['Guardians of the Forest'], sub: 'Portraits from the Sápara Nation', med: 'Archival pigment prints, 2026' },
  { k: '04 · Panel IV', t: ['El Retorno de los Sueños'], sub: 'Montahuano · Vega · Vargas', med: 'Archival pigment prints, 2026' },
];
const BOARDS = HANG.boards.map((h, i) => {
  const side = i % 2 ? 1 : -1;
  const label = h.label === undefined ? (i < 4 ? i : null) : h.label;
  return { id: `B${i + 1}`, c: [side * 1.25, 1.45, BZ(i)], yaw: -side * 0.26, side, gobo: i % 3, label: label === null ? null : LABELS[label] };
});
BOARDS.forEach((b, i) => { b.hang = HANG.boards[i]; });
const ASPECT = HANG_DATA.aspect;
const ar = (n) => ASPECT[n] ?? 1.5;
const PHOTO = (n) => `${A}dscf/DSCF${n}.jpg`;
const LW = 0.21, LH = 0.132, LABEL_Y = 1.28;

const POSTER = { file: 'poster-1.png', w: 1.6, h: 2.0, ring: { u: 0.509, v: 0.248, r: 0.41 } };
const PB = { w: 1.82, h: 2.38, top: 0.22, z: END_Z + 0.06, cy: 0.55 + 2.38 / 2 };

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false });
} catch (e) { body.classList.add('nogl'); throw e; }
let DPR = Math.min(window.devicePixelRatio || 1, 2.0);   // Full Retina crispness for panels & poster
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;     // raw depth, filtered by the soft-shadow code above
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.NoToneMapping;
const maxAniso = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
const NIGHT = new THREE.Color().setRGB(0.0035, 0.003, 0.0025, THREE.LinearSRGBColorSpace);
scene.background = NIGHT;
scene.fog = new THREE.FogExp2(NIGHT.clone(), 0.035);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.08, 60);

// ---------------------------------------------------------------- materials
const faceMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.86, metalness: 0 });
const edgeMat = new THREE.MeshStandardMaterial({ color: 0xd6d2ca, roughness: 0.3, metalness: 0.35 });
const cableMat = new THREE.MeshStandardMaterial({ color: 0xb8b4ac, roughness: 0.28, metalness: 0.7 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x141312, roughness: 0.55, metalness: 0.5 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0xb4afa6, roughness: 0.95 });
const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0e0d0c, roughness: 1 });

// ---------------------------------------------------------------- the floor: her maple, board by board
// floor-strips.jpg holds eight single maple strips cut from her room photo (175). The shader lays the floor
// strip by strip, each board its own length, strip, offset and tone, so the surface never repeats.
const ROOM_W = 9.2, ROOM_Z0 = 8, ROOM_L = ROOM_Z0 - END_Z + 2.5;
const reflMatrix = new THREE.Matrix4();
const floorU = { uRefl: { value: null }, uReflMatrix: { value: reflMatrix }, uAtlas: { value: null } };
const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
floorMat.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, floorU);
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nuniform mat4 uReflMatrix;\nvarying vec4 vReflUv;\nvarying vec3 vFloorPos;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvec4 fw = modelMatrix * vec4(transformed, 1.0); vReflUv = uReflMatrix * fw; vFloorPos = fw.xyz;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', `#include <common>
      uniform sampler2D uRefl; uniform sampler2D uAtlas; varying vec4 vReflUv; varying vec3 vFloorPos;
      float fh1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      float fh2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float gJoint = 1.0; float gRough = 0.4;`)
    .replace('#include <map_fragment>', `
      {
        const float SW = 0.057, N = 8.0, ALEN = 1.25;
        vec2 fp = vFloorPos.xz;
        float si = floor(fp.x / SW);
        float len = mix(0.5, 1.5, fh1(si * 7.13 + 3.1));
        float zz = fp.y + fh1(si * 1.37) * 4.0;
        float sj = floor(zz / len);
        float u = fract(fp.x / SW), v = fract(zz / len);
        float h = fh2(vec2(si, sj));
        float k = floor(h * N);
        float flip = step(0.5, fract(h * 13.7));
        float uu = mix(u, 1.0 - u, flip);
        float vo = fract(h * 31.3) * (1.0 - min(len / ALEN, 1.0) * 0.98);
        vec2 auv = vec2((k + 0.08 + uu * 0.84) / N, vo + v * min(len / ALEN, 1.0) * 0.98);
        vec2 gx = vec2(dFdx(fp.x) / SW * 0.84 / N, dFdx(fp.y) / ALEN), gy = vec2(dFdy(fp.x) / SW * 0.84 / N, dFdy(fp.y) / ALEN);
        vec3 wood = textureGrad(uAtlas, auv, gx, gy).rgb;
        float tone = mix(0.84, 1.1, fh2(vec2(sj * 3.1, si))) * (fh2(vec2(si, sj * 7.7)) < 0.06 ? 0.8 : 1.0);
        // seams: a fine dark line, filtered by the pixel footprint so it never shimmers
        float wu = fwidth(fp.x / SW), wv = fwidth(zz / len);
        float eu = min(u, 1.0 - u), ev = min(v, 1.0 - v);
        float ju = 1.0 - (1.0 - smoothstep(0.0, 0.035 + wu, eu)) * 0.55 / (1.0 + wu * 6.0);
        float jv = 1.0 - (1.0 - smoothstep(0.0, 0.006 + wv, ev)) * 0.5 / (1.0 + wv * 6.0);
        gJoint = ju * jv;
        gRough = mix(0.26, 0.48, fh2(vec2(si + 9.0, sj))) + (1.0 - gJoint) * 0.6;
        diffuseColor.rgb *= pow(wood, vec3(2.2)) * 1.05 * tone * gJoint;
      }`)
    .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = clamp(gRough, 0.05, 1.0);')
    .replace('#include <opaque_fragment>', `
      {
        vec2 ruv = vReflUv.xy / vReflUv.w;
        float rg = clamp(roughnessFactor, 0.05, 1.0);
        float lod = mix(1.0, 4.6, rg);
        vec3 refl = vec3(0.0); float wsum = 0.0;
        for (int k = -5; k <= 5; k++) {
          float fk = float(k); float w = exp(-fk * fk / 12.0);
          refl += textureLod(uRefl, ruv + vec2(0.0, fk * 0.0042 * (0.35 + rg * 1.8)), lod).rgb * w; wsum += w;
        }
        refl /= wsum;
        float NoV = clamp(dot(normal, geometryViewDir), 0.0, 1.0);
        float F = 0.04 + 0.96 * pow(1.0 - NoV, 5.0);
        outgoingLight += refl * F * (1.0 - rg) * (1.0 - rg) * gJoint;
      }
      #include <opaque_fragment>`);
};
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_L), floorMat);
floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, ROOM_Z0 - ROOM_L / 2);
floor.receiveShadow = true;
scene.add(floor);
{
  const zc = ROOM_Z0 - ROOM_L / 2;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, CEIL), wallMat);
  back.position.set(0, CEIL / 2, END_Z); back.receiveShadow = true; scene.add(back);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_L, CEIL), wallMat);
    w.rotation.y = -s * Math.PI / 2; w.position.set(s * ROOM_W / 2, CEIL / 2, zc); w.receiveShadow = true; scene.add(w);
  }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_L), ceilMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, CEIL, zc); scene.add(ceil);
}
scene.add(new THREE.HemisphereLight(new THREE.Color().setRGB(0.9, 0.75, 0.6), new THREE.Color().setRGB(0.25, 0.18, 0.12), 0.03));

// ---------------------------------------------------------------- boards
function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
const T = 0.006, BEV = 0.0016, FRONT = T / 2 + BEV;
function panel(w, h, t = T, bev = BEV) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bev, h - 2 * bev, 0.006), { depth: t, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -t / 2);
  return g;
}
// A board's hang, in metres, centred on the board. rows: each row a height and its prints side by side; cols: a
// height and columns of prints stacked to fill it; free / bare: prints placed by hand (bare = no panel, each print
// on its own wires).
function layout(d) {
  if (d.kind === 'panel') {
    return { W: d.W, H: d.H, panelSrc: d.src, rects: d.rects ?? [] };
  }
  const m = d.m ?? 0.085, mb = d.mb ?? 0.105, g = d.g ?? 0.05, rects = [];
  if (d.kind === 'rows') {
    const rows = d.rows.map((r, i) => { const h = d.h[i] ?? d.h[0], ws = r.map((n) => h * ar(n)); return { r, h, ws, w: ws.reduce((a, b) => a + b, 0) + g * (r.length - 1) }; });
    const iw = Math.max(...rows.map((r) => r.w)), ih = rows.reduce((a, r) => a + r.h, 0) + g * (rows.length - 1);
    const W = 2 * m + iw, H = m + mb + ih;
    let y = H / 2 - m;
    for (const r of rows) {
      let x = -r.w / 2;
      r.r.forEach((n, j) => { rects.push({ n, x: x + r.ws[j] / 2, y: y - r.h / 2, w: r.ws[j], h: r.h }); x += r.ws[j] + g; });
      y -= r.h + g;
    }
    return { W, H, rects };
  }
  if (d.kind === 'cols') {
    const cols = d.cols.map((c) => { const k = c.reduce((a, n) => a + 1 / ar(n), 0); return { c, w: (d.H - g * (c.length - 1)) / k }; });
    const W = 2 * m + cols.reduce((a, c) => a + c.w, 0) + g * (cols.length - 1), H = m + mb + d.H;
    let x = -W / 2 + m;
    for (const c of cols) {
      let y = H / 2 - m;
      for (const n of c.c) { const h = c.w / ar(n); rects.push({ n, x: x + c.w / 2, y: y - h / 2, w: c.w, h }); y -= h + g; }
      x += c.w + g;
    }
    return { W, H, rects };
  }
  // free and bare: placed by hand; the board's size is the extent of its prints plus the margins
  for (const it of d.items) rects.push({ n: it.n, x: it.x, y: it.y, w: it.w, h: it.w / ar(it.n), dz: it.dz ?? 0 });
  const ext = (f) => Math.max(...rects.map(f));
  const W = d.W ?? 2 * Math.max(ext((r) => Math.abs(r.x) + r.w / 2)) + 2 * m;
  const H = d.H ?? 2 * Math.max(ext((r) => Math.abs(r.y) + r.h / 2)) + m + mb;
  return { W, H, rects, bare: d.kind === 'bare' };
}

const texLoader = new THREE.TextureLoader();
const loads = [];
function photo(src) {
  const p = new Promise((res, rej) => texLoader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; res(t); }, undefined, rej));
  loads.push(p);
  return p;
}
photo('./floor-strips.jpg').then((t) => { t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; floorU.uAtlas.value = t; });

const swingers = [];
function cables(group, x, top, len) {
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, len, 6, 1, true), cableMat);
  cab.position.set(x, top + len / 2, 0); group.add(cab);
  const grom = new THREE.Mesh(new THREE.TorusGeometry(0.0065, 0.0019, 8, 18), cableMat);
  grom.position.set(x, top, FRONT + 0.0004); group.add(grom);
}
function hang(group, cx, cy, cz, yaw) {
  const pivot = new THREE.Group();
  pivot.position.set(cx, CEIL, cz); pivot.rotation.order = 'YXZ'; pivot.rotation.y = yaw;
  group.position.y = cy - CEIL; pivot.add(group);
  scene.add(pivot);
  const sw = { pivot, ax: 0, vx: 0, az: 0, vz: 0, ph: Math.random() * 6.28, cz, mass: 1 };
  swingers.push(sw);
  return sw;
}

// discreet museum exhibition tags: set in the site's type onto a compact archival card beside each panel
const labelCards = [];
function labelTexture(L) {
  const S = 1400, W = S, H = Math.round(S * LH / LW);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#efebe4'; g.fillRect(0, 0, W, H);
  const px = W / LW;                         // canvas pixels per metre
  const x0 = 0.015 * px;
  g.fillStyle = '#6b635a'; g.font = `500 ${0.0085 * px}px Switzer, "Helvetica Neue", Arial, sans-serif`;
  g.letterSpacing = `${0.0018 * px}px`;
  g.textBaseline = 'alphabetic';
  g.fillText(L.k.toUpperCase(), x0, 0.028 * px);
  g.letterSpacing = '0px';
  g.fillStyle = '#181512';
  g.font = `italic 400 ${0.0175 * px}px Gambetta, Georgia, serif`;
  let y = 0.056 * px;
  for (const line of L.t) { g.fillText(line, x0, y); y += 0.022 * px; }
  if (L.sub) {
    g.fillStyle = '#3d3731'; g.font = `400 ${0.0096 * px}px Switzer, "Helvetica Neue", Arial, sans-serif`;
    g.fillText(L.sub, x0, 0.084 * px);
  }
  g.fillStyle = '#756d63'; g.font = `400 ${0.0082 * px}px Switzer, "Helvetica Neue", Arial, sans-serif`;
  g.fillText(L.med || 'Archival pigment prints, 2026', x0, LH * px - 0.016 * px);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  return t;
}

function makeArtMaterial(keySuffix, litUniform) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.56, metalness: 0, clearcoat: 0.14, clearcoatRoughness: 0.36,
    blending: THREE.NoBlending,
  });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uArtLit = litUniform;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uArtLit;')
      .replace('#include <opaque_fragment>', '#include <opaque_fragment>\ngl_FragColor = vec4( mix( outgoingLight * 0.58, diffuseColor.rgb * uArtLit, 0.88 ), 0.20 );');
  };
  mat.customProgramCacheKey = () => 'artPanel_' + keySuffix;
  return mat;
}

const boards = BOARDS.map((def, bi) => {
  const L = layout(def.hang);
  // a wider board stands further out from the walk; a taller one hangs higher
  def.c = [def.side * (0.55 + (L.W / 2) * Math.cos(def.yaw)), def.hang.cy ?? Math.max(def.c[1], L.H / 2 + 0.38), def.c[2]];
  const g = new THREE.Group();
  const artLit = { value: 0.94 };
  if (!L.bare) { const pan = new THREE.Mesh(panel(L.W, L.H), [faceMat, edgeMat]); pan.castShadow = true; pan.receiveShadow = true; g.add(pan); }
  if (L.panelSrc) {
    const mat = makeArtMaterial(String(bi), artLit);
    photo(A + L.panelSrc).then((t) => { mat.map = t; mat.needsUpdate = true; });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L.W - 0.004, L.H - 0.004), mat);
    m.position.set(0, 0, FRONT + 0.0005); m.receiveShadow = false; g.add(m);
  }
  for (const r of L.rects) {
    if (r.subOnly) continue;
    if (L.bare) {
      // each print on its own mount and its own pair of wires
      const mount = new THREE.Mesh(panel(r.w, r.h, 0.004, 0.0008), [faceMat, edgeMat]);
      mount.position.set(r.x, r.y, r.dz); mount.castShadow = true; mount.receiveShadow = true; g.add(mount);
      const top = r.y + r.h / 2 - 0.02, [, cyy] = def.c;
      for (const sx of [-1, 1]) { const cg = new THREE.Group(); cg.position.z = r.dz; g.add(cg); cables(cg, r.x + sx * (r.w / 2 - 0.03), top, CEIL - (cyy + top)); }
    }
    const mat = makeArtMaterial(`${bi}_${r.n}`, artLit);
    photo(PHOTO(r.n)).then((t) => { mat.map = t; mat.needsUpdate = true; });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.h), mat);
    m.position.set(r.x, r.y, (r.dz ?? 0) + (L.bare ? 0.002 + 0.0008 : FRONT) + 0.0005); m.receiveShadow = false; g.add(m);
  }
  const gromInset = L.panelSrc ? 0.028 : 0.035;
  const top = L.H / 2 - gromInset, [cx, cy, cz] = def.c;
  if (!L.bare) for (const s of [-1, 1]) cables(g, s * (L.W / 2 - gromInset), top, CEIL - (cy + top));
  // compact museum exhibition tag, beside the panel on its outer side
  if (def.label) {
    const lg = new THREE.Group();
    const lx = def.side * (L.W / 2 + 0.045 + LW / 2), ly = LABEL_Y - cy;
    lg.position.set(lx, ly, 0); g.add(lg);
    const card = new THREE.Mesh(panel(LW, LH, 0.0022, 0.0007), [faceMat, edgeMat]);
    card.castShadow = true; card.receiveShadow = true; lg.add(card);
    const labelMat = makeArtMaterial(`lbl_${bi}`, artLit);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(LW - 0.003, LH - 0.003), labelMat);
    face.position.z = 0.0021; face.receiveShadow = false; lg.add(face);
    labelCards.push({ def, labelMat });
    for (const s of [-1, 1]) {
      const cabLen = CEIL - (LABEL_Y + LH / 2 - 0.012);
      const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, cabLen, 5, 1, true), cableMat);
      cab.position.set(s * (LW / 2 - 0.014), (LH / 2 - 0.012) + cabLen / 2, 0); lg.add(cab);
    }
  }
  const sw = hang(g, cx, cy, cz, def.yaw);
  const n = new THREE.Vector3(Math.sin(def.yaw), 0, Math.cos(def.yaw));
  const xAxis = new THREE.Vector3(Math.cos(def.yaw), 0, -Math.sin(def.yaw));
  return { ...def, L, group: g, sw, n, xAxis, artLit, center: new THREE.Vector3(cx, cy, cz) };
});

// the poster board: her poster mounted with a white margin, a hand's width off the end wall
const posterU = { uReveal: { value: 0 }, uTrueArt: { value: 0 }, uBlank: { value: faceMat.color }, uPosterLit: { value: 0.96 } };
const posterMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, roughness: 0.86, clearcoat: 0.0001, clearcoatRoughness: 0.32,
  blending: THREE.NoBlending,
});
posterMat.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, posterU);
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uReveal;\nuniform float uTrueArt;\nuniform vec3 uBlank;\nuniform float uPosterLit;')
    .replace('#include <map_fragment>', '#include <map_fragment>\nvec3 rawPoster = diffuseColor.rgb;\ndiffuseColor.rgb = mix(uBlank, diffuseColor.rgb, uReveal);')
    .replace('#include <opaque_fragment>', '#include <opaque_fragment>\nvec3 truePoster = mix(outgoingLight * 0.52, rawPoster * uPosterLit, 0.90);\nfloat kArt = uReveal * uTrueArt;\ngl_FragColor = vec4(mix(outgoingLight, truePoster, kArt), mix(1.0, 0.20, kArt));');
};
posterMat.customProgramCacheKey = () => 'posterTrue';
photo(A + POSTER.file).then((t) => { posterMat.map = t; posterMat.needsUpdate = true; });
const posterBoard = (() => {
  const g = new THREE.Group();
  const pan = new THREE.Mesh(panel(PB.w, PB.h), [faceMat, edgeMat]);
  pan.castShadow = true; pan.receiveShadow = true; g.add(pan);
  const py = PB.h / 2 - PB.top - POSTER.h / 2;
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(POSTER.w, POSTER.h), posterMat);
  pm.position.set(0, py, FRONT + 0.0005); pm.receiveShadow = true; g.add(pm);
  for (const s of [-1, 1]) cables(g, s * (PB.w / 2 - 0.04), PB.h / 2 - 0.04, CEIL - (PB.cy + PB.h / 2 - 0.04));
  const sw = hang(g, 0, PB.cy, PB.z, 0); sw.mass = 2.4;
  const printTop = PB.cy + PB.h / 2 - PB.top;
  const ring = new THREE.Vector3((POSTER.ring.u - 0.5) * POSTER.w, printTop - POSTER.ring.v * POSTER.h, PB.z + FRONT);
  const center = new THREE.Vector3(0, printTop - POSTER.h / 2, PB.z + FRONT);
  return { ring, ringR: POSTER.ring.r * POSTER.w, center };
})();

// ---------------------------------------------------------------- lamps
const lamps = [];
const lensGeo = new THREE.CircleGeometry(0.034, 24);
function fixture(pos, target) {
  const g = new THREE.Group(); g.position.copy(pos);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, CEIL - pos.y, 6), blackMat);
  stem.position.y = (CEIL - pos.y) / 2; g.add(stem);
  const head = new THREE.Group(); g.add(head);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.17, 24, 1, true), blackMat);
  can.rotation.x = Math.PI / 2; can.position.z = -0.03; head.add(can);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), blackMat); cap.position.z = -0.115; cap.rotation.y = Math.PI; head.add(cap);
  const lensMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const lens = new THREE.Mesh(lensGeo, lensMat); lens.position.z = 0.05; head.add(lens);
  scene.add(g); g.updateMatrixWorld(true); head.lookAt(target);
  return { g, lensMat };
}
function spot(pos, target, angle, intensity, opts = {}) {
  const l = new THREE.SpotLight(WARM.clone(), 0, 0, angle, opts.penumbra ?? 0.62, 2);
  l.position.copy(pos); l.target.position.copy(target);
  l.castShadow = true;
  l.shadow.mapSize.set(opts.map ?? 2048, opts.map ?? 2048);
  l.shadow.bias = -0.00035; l.shadow.normalBias = 0.008; l.shadow.radius = opts.radius ?? 26;
  l.shadow.intensity = 0.86;
  l.shadow.camera.near = 0.3; l.shadow.camera.far = 14;
  scene.add(l, l.target);
  const fx = opts.noFixture ? null : fixture(pos, target);
  const lamp = { l, fx, base: intensity, scroll: 1, pos, target, kind: opts.kind ?? 'board', haze: opts.haze ?? 1 };
  if (opts.fill) {
    lamp.fill = new THREE.PointLight(WARM.clone(), 0, 5, 2);
    lamp.fill.position.copy(opts.fill); lamp.fillBase = intensity * 0.045;
    scene.add(lamp.fill);
  }
  lamps.push(lamp);
  return lamp;
}
// every board has its fixture; four lamps (leaf shadow, soft shadow, fill) travel to the boards nearest the walker
boards.forEach((b) => {
  // aimed a little toward the label so the card sits in the same light as the prints
  const target = b.center.clone().addScaledVector(b.xAxis, b.label ? b.side * 0.22 : 0).add(new THREE.Vector3(0, -0.02, 0));
  const pos = target.clone().addScaledVector(b.n, 1.55); pos.y = 3.78;
  const dist = pos.distanceTo(target), half = Math.hypot(b.L.W / 2 + (b.label ? LW * 0.75 : 0.1), b.L.H / 2);
  const fillAt = b.center.clone().addScaledVector(b.n, 0.9); fillAt.y = 0.35;
  b.aim = { pos, target, angle: Math.atan(half / dist) * 1.12, fillAt };
  b.fixture = fixture(pos, target); b.w = 0; b.goboTex = null;
});
const POOL = boards.slice(0, Math.min(4, boards.length)).map((b) => ({ lamp: spot(b.aim.pos, b.aim.target, b.aim.angle, 31, { fill: b.aim.fillAt, noFixture: true }), board: null }));
// how lit a board is, by its distance ahead of (or behind) the walker along the aisle
function boardWeight(b, camZ) { const d = camZ - b.center.z; return d >= 0 ? 1 - ss(5.2, 7.2, d) : 1 - ss(0.5, 2.5, -d); }
function assignPool(camZ) {
  for (const b of boards) b.w = boardWeight(b, camZ);
  const want = boards.filter((b) => b.w > 0.001).sort((a, b) => b.w - a.w).slice(0, POOL.length);
  for (const p of POOL) if (p.board && !want.includes(p.board)) p.board = null;
  for (const b of want) if (!POOL.some((p) => p.board === b)) { const free = POOL.find((p) => !p.board); if (free) free.board = b; }
  for (const p of POOL) {
    const l = p.lamp.l, b = p.board;
    if (!b) { p.lamp.weight = 0; continue; }
    l.position.copy(b.aim.pos); l.target.position.copy(b.aim.target); l.angle = b.aim.angle; l.target.updateMatrixWorld();
    if (b.goboTex) l.map = b.goboTex;
    p.lamp.fill.position.copy(b.aim.fillAt); p.lamp.weight = b.w; p.lamp.boardRef = b;
  }
}
const posterWash = spot(new THREE.Vector3(0, 3.7, END_Z + 3.3), posterBoard.center.clone().add(new THREE.Vector3(0, 0.08, 0)), 0.38, 34,
  { kind: 'poster', penumbra: 0.78, fill: new THREE.Vector3(0, 0.4, END_Z + 1.2), haze: 0.6 });

// the projector: a narrow lamp whose slide is the film, aimed into the poster's ring of canopy
const film = { video: null, canvas: document.createElement('canvas'), ready: false, avg: new THREE.Color(0.2, 0.2, 0.3), seeked: false };
film.canvas.width = film.canvas.height = 512;
const fctx = film.canvas.getContext('2d');
fctx.fillStyle = '#000'; fctx.fillRect(0, 0, 512, 512);
const filmTex = new THREE.CanvasTexture(film.canvas); filmTex.colorSpace = THREE.SRGBColorSpace;
const PROJ_POS = new THREE.Vector3(0, 3.55, END_Z + 5.2);
const projector = (() => {
  const target = posterBoard.ring.clone();
  const L = PROJ_POS.distanceTo(target);
  const angle = Math.atan(posterBoard.ringR / ((1 / 1.22) * L));
  const l = new THREE.SpotLight(new THREE.Color(1, 1, 1), 0, 0, angle, 0.06, 2);
  l.position.copy(PROJ_POS); l.target.position.copy(target);
  l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.camera.near = 0.3; l.shadow.camera.far = 14; l.shadow.bias = -0.0008; l.shadow.radius = 4;
  l.map = filmTex;
  scene.add(l, l.target);
  const incl = Math.atan2(PROJ_POS.y - target.y, PROJ_POS.z - target.z);
  const g = new THREE.Group(); g.position.copy(PROJ_POS);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.34), blackMat));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, CEIL - PROJ_POS.y, 6), blackMat); rod.position.y = (CEIL - PROJ_POS.y) / 2; g.add(rod);
  scene.add(g);
  return { l, target, L, angle, incl, base: 520 };
})();
const bounce = new THREE.SpotLight(new THREE.Color(0.3, 0.3, 0.4), 0, 0, 1.1, 1, 2);
bounce.position.set(0, 2.1, END_Z + 0.35); bounce.target.position.set(0, 0, END_Z + 5.5);
scene.add(bounce, bounce.target);

// ---------------------------------------------------------------- leaf shadow from her own palm (photo 162)
// The frond is keyed out of the photo, then laid twice: a near frond with a tight penumbra and a far one
// softened and fainter, so the shadow has depth. The lamps project it as light, never as a cut-out.
async function palmGobos() {
  const blob = await (await fetch(A + '162.jpg')).blob();
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  const S = 512;
  const base = document.createElement('canvas'); base.width = base.height = S;
  const g = base.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  const sx = 560 * bmp.width / 1650, sy = 1600 * bmp.height / 2200, sW = 1090 * bmp.width / 1650, sH = 600 * bmp.height / 2200;
  g.drawImage(bmp, sx, sy, sW, sH, -60, 236, 700, 385);
  const d = g.getImageData(0, 0, S, S), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const m = clamp((p[i + 1] - Math.max(p[i], p[i + 2]) - 1) / 12);
    p[i] = p[i + 1] = p[i + 2] = 255; p[i + 3] = Math.round(255 * m);   // frond as alpha
  }
  g.putImageData(d, 0, 0);
  const out = [];
  for (const [rot, flip, rot2] of [[0.15, 1, 2.2], [2.6, -1, -0.8], [-1.9, 1, 0.9]]) {
    const c = document.createElement('canvas'); c.width = c.height = S; const o = c.getContext('2d');
    o.fillStyle = '#fff'; o.fillRect(0, 0, S, S);
    const lay = (r, f, sc, blur, alpha, dx, dy) => {
      o.save(); o.filter = `blur(${blur}px)`; o.globalAlpha = alpha;
      o.translate(S / 2 + dx, S / 2 + dy); o.rotate(r); o.scale(f * sc, sc); o.translate(-S / 2, -S / 2);
      // draw the frond as dark: tint the alpha mask
      o.drawImage(tint, 0, 0); o.restore();
    };
    const tint = document.createElement('canvas'); tint.width = tint.height = S; const tg = tint.getContext('2d');
    tg.drawImage(base, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#2a2622'; tg.fillRect(0, 0, S, S);
    lay(rot2, -flip, 1.35, 14, 0.5, 70 * flip, -150);          // far frond: wide penumbra, faint
    lay(rot + 0.9, flip, 1.2, 6.5, 0.62, -90 * flip, -40);    // middle frond
    lay(rot, flip, 1.5, 2.6, 0.86, 40 * flip, -110);          // near frond: tight penumbra
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    out.push(t);
  }
  return out;
}

// ---------------------------------------------------------------- plants
// Potted palms stand near the side walls in the spill of the board lamps, and one each side of the poster in
// the clearing. They take no light of their own; every lit leaf and cast shadow comes from the lamps above.
const PLANTS = [
  ...BOARDS.slice(0, -1).map((bd, i) => ({ x: bd.side * (3.25 + 0.2 * ((i * 7) % 3) / 2), z: bd.c[2] - 0.05 - 0.2 * (i % 2), s: 0.88 + 0.07 * ((i * 5) % 3), r: 0.8 + i * 1.45, seed: 11 + 7 * i })),
  { x: -1.95, z: END_Z + 0.85, s: 1.22, r: 4.1, seed: 32 },
  { x: 2.05, z: END_Z + 0.7, s: 1.06, r: 1.3, seed: 39 },
];
// thin leaves: a lamp behind a leaf shows through it, warmer and yellower than its lit face
function leafy(mat, through = '0.62, 0.8, 0.2') {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <shadowmap_vertex>', THREE.ShaderChunk.shadowmap_vertex.replaceAll('shadowWorldNormal *', '0.0 * shadowWorldNormal *'));
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', `#include <lights_physical_pars_fragment>
      void RE_Direct_Leaf( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
        RE_Direct_Physical( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
        float back = saturate( dot( - geometryNormal, directLight.direction ) );
        reflectedLight.directDiffuse += back * directLight.color * BRDF_Lambert( material.diffuseContribution ) * vec3( ${through} );
      }
      #undef RE_Direct
      #define RE_Direct RE_Direct_Leaf`);
  };
  mat.customProgramCacheKey = () => 'leaf';
  return mat;
}

// a potted palm modelled leaf by leaf: every frond an arching rib, every leaflet a folded, drooping blade
const DEG = Math.PI / 180;
const potMat = new THREE.MeshStandardMaterial({ color: 0x4c4e50, roughness: 0.52, metalness: 0 });
const soilMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });
const woodMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
const frondMat = leafy(new THREE.MeshPhysicalMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.46, clearcoat: 0.3, clearcoatRoughness: 0.4 }));
function palmTree(seed) {
  const R = rng(seed), V = THREE.Vector3, Y = new V(0, 1, 0), SOIL = 0.29;
  const leaf = { p: [], c: [], i: [] }, wood = { p: [], c: [], i: [] };
  const put = (m, v, r, g, b) => { m.p.push(v.x, v.y, v.z); m.c.push(r, g, b); };
  function tube(pts, S, r0, r1, c0, c1) {
    const n = 6; let prev = -1;
    const T = new V(), U = new V(), S2 = new V();
    for (let k = 0; k < pts.length; k++) {
      const t = k / (pts.length - 1);
      T.subVectors(pts[Math.min(k + 1, pts.length - 1)], pts[Math.max(k - 1, 0)]).normalize();
      U.crossVectors(S, T).normalize(); S2.crossVectors(T, U);
      const r = lerp(r0, r1, t), first = wood.p.length / 3;
      for (let j = 0; j < n; j++) { const a = j / n * 6.2832; put(wood, pts[k].clone().addScaledVector(S2, Math.cos(a) * r).addScaledVector(U, Math.sin(a) * r), lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)); }
      if (prev >= 0) for (let j = 0; j < n; j++) { const a = prev + j, b = prev + (j + 1) % n, c = first + j, d = first + (j + 1) % n; wood.i.push(a, c, b, b, c, d); }
      prev = first;
    }
  }
  function frond(base, az, e0, bend, L, age) {
    const M = 34, pts = [base.clone()], S = new V(-Math.sin(az), 0, Math.cos(az)), tw = (R() - 0.5) * 0.5;
    for (let k = 1; k <= M; k++) {
      const t = k / M, e = e0 - bend * Math.pow(t, 1.7), a = az + tw * t * t;
      pts.push(pts[k - 1].clone().add(new V(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)).multiplyScalar(L / M)));
    }
    tube(pts, S, 0.0075, 0.0016, [0.10, 0.12, 0.035], [0.07, 0.14, 0.03]);
    const at = (t, out) => { const f = t * M, k = Math.min(M - 1, Math.floor(f)); return out.lerpVectors(pts[k], pts[k + 1], f - k); };
    const t0 = 0.24 + R() * 0.06, per = Math.round((1 - t0) * L / 0.021);
    const Lmax = 0.27 + R() * 0.08, wmax = 0.021 + R() * 0.007, droop = lerp(0.35, 0.95, age) + R() * 0.2;
    const tone = lerp(1.3, 0.78, age) * (0.9 + R() * 0.2);
    const P = new V(), P2 = new V(), T = new V(), U = new V(), d = new V(), W = new V(), N = new V(), c = new V(), q = new V();
    for (let side = -1; side <= 1; side += 2) for (let j = 0; j < per; j++) {
      const u = (j + (side > 0 ? 0.5 : 0) + R() * 0.3) / per, t = t0 + u * (1 - t0);
      if (t >= 0.995) continue;
      at(t, P); at(Math.min(1, t + 0.02), P2); T.subVectors(P2, P).normalize(); U.crossVectors(S, T).normalize();
      const ang = (lerp(62, 26, u) + (R() - 0.5) * 8) * DEG, lift = (lerp(26, 10, u) + (R() - 0.5) * 10) * DEG;
      d.copy(T).multiplyScalar(Math.cos(ang)).addScaledVector(S, side * Math.sin(ang) * Math.cos(lift)).addScaledVector(U, Math.sin(ang) * Math.sin(lift));
      const len = Lmax * Math.pow(Math.sin(Math.PI * (0.12 + 0.76 * u)), 0.6) * (1 - 0.35 * u) * (0.9 + R() * 0.2);
      const K = 6, brown = R() < 0.07, jit = 0.85 + R() * 0.3, fold = 0.3 + R() * 0.15, dr = droop * (0.8 + R() * 0.4);
      c.copy(P); let ring0 = -1;
      for (let k = 0; k <= K; k++) {
        const s = k / K;
        q.copy(d).addScaledVector(Y, -dr * s * s * 1.2).normalize();           // the blade bends down under its own weight
        if (k > 0) c.addScaledVector(q, len / K);
        W.crossVectors(U, q).normalize(); N.crossVectors(q, W).normalize();
        const w = wmax * 0.95 * Math.sqrt(s + 0.04) * Math.pow(1 - s, 0.8);    // half width: lance-shaped, pointed
        const sh = tone * jit * (0.85 + 0.3 * s);
        let r = 0.045 * sh, g = 0.115 * sh, b = 0.022 * sh;
        if (brown && s > 0.7) { const m = (s - 0.7) / 0.3; r = lerp(r, 0.16, m); g = lerp(g, 0.11, m); b = lerp(b, 0.04, m); }
        const first = leaf.p.length / 3;
        put(leaf, P2.copy(c).addScaledVector(W, -w).addScaledVector(N, w * fold), r, g, b);
        put(leaf, c, r * 1.15, g * 1.15, b * 1.1);
        put(leaf, c, r * 1.15, g * 1.15, b * 1.1);
        put(leaf, P2.copy(c).addScaledVector(W, w).addScaledVector(N, w * fold), r, g, b);
        if (ring0 >= 0) leaf.i.push(ring0, ring0 + 1, first, ring0 + 1, first + 1, first, ring0 + 2, ring0 + 3, first + 2, ring0 + 3, first + 3, first + 2);
        ring0 = first;
      }
    }
  }
  const stems = 3 + (R() < 0.5 ? 1 : 0);
  for (let s = 0; s < stems; s++) {
    const sa = s / stems * 6.2832 + R() * 0.9, sr = 0.03 + R() * 0.04;
    const base = new V(Math.cos(sa) * sr, SOIL - 0.015, Math.sin(sa) * sr);
    const top = base.clone().add(new V(Math.cos(sa) * 0.015, 0.11 + R() * 0.08, Math.sin(sa) * 0.015));
    tube([base, base.clone().lerp(top, 0.5), top], new V(1, 0, 0), 0.03, 0.016, [0.07, 0.04, 0.02], [0.1, 0.085, 0.035]);
    const cnt = 3 + Math.floor(R() * 2.2);
    for (let f = 0; f < cnt; f++) {
      const age = cnt > 1 ? f / (cnt - 1) : 0.5;
      frond(top.clone().setY(top.y - 0.03), sa + f * 2.2 + (R() - 0.5) * 0.7, (lerp(84, 58, age) + (R() - 0.5) * 8) * DEG, (lerp(30, 85, age) + R() * 18) * DEG, 0.8 + R() * 0.4 - age * 0.1, age);
    }
  }
  const mk = (m) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(m.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(m.c, 3)); g.setIndex(m.i); g.computeVertexNormals(); return g; };
  const group = new THREE.Group();
  const add = (geo, mat) => { const me = new THREE.Mesh(geo, mat); me.castShadow = true; me.receiveShadow = true; group.add(me); return me; };
  add(mk(leaf), frondMat); add(mk(wood), woodMat);
  // the pot: a grey nursery pot with a rolled rim, as in her room; soil with its own crumbs
  const prof = [[0.001, 0], [0.145, 0], [0.152, 0.012], [0.205, 0.298], [0.222, 0.303], [0.227, 0.317], [0.222, 0.33], [0.207, 0.332], [0.2, 0.312], [0.197, 0.27]].map(([r, y]) => new THREE.Vector2(r, y));
  potMat.side = THREE.DoubleSide;
  add(new THREE.LatheGeometry(prof, 56), potMat);
  const soil = { p: [], c: [], i: [] }, RN = 12, SN = 44;
  for (let i = 0; i <= RN; i++) for (let j = 0; j < SN; j++) {
    const r = 0.199 * Math.sqrt(i / RN), a = j / SN * 6.2832 + i * 0.07, h = R();
    const v = 0.022 + h * 0.03;
    put(soil, new V(Math.cos(a) * r, SOIL + (i === RN ? -0.012 : (h - 0.5) * 0.016 + (R() < 0.08 ? 0.012 : 0)), Math.sin(a) * r), v * 1.25, v * 0.95, v * 0.7);
    if (i < RN) { const a0 = i * SN + j, a1 = i * SN + (j + 1) % SN, b0 = a0 + SN, b1 = a1 + SN; soil.i.push(a0, b0, a1, a1, b0, b1); }
  }
  soilMat.side = THREE.DoubleSide;
  add(mk(soil), soilMat);
  return group;
}
function plantsModelled() {
  for (const p of PLANTS) for (const b of boards) {
    if (Math.abs(p.z - b.center.z) > 1.3 || Math.sign(p.x) !== b.side) continue;
    const edge = Math.abs(b.center.x) + (b.L.W / 2 + 0.64) * Math.cos(b.yaw);
    p.x = b.side * Math.min(4.1, Math.max(Math.abs(p.x), edge + 0.45));
  }
  PLANTS.forEach((p) => {
    const g = palmTree(p.seed);
    g.position.set(p.x, 0, p.z); g.rotation.y = p.r; g.scale.setScalar(p.s);
    scene.add(g);
  });
}

// ---------------------------------------------------------------- render targets
const size = new THREE.Vector2();
const sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true });
sceneRT.depthTexture = new THREE.DepthTexture(1, 1);
const reflRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
floorU.uRefl.value = reflRT.texture;
const half = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
const airRT = half(), halfRT = half(), dofRT = half();
const BLOOM_LEVELS = 6, down = [], up = [];
for (let i = 0; i < BLOOM_LEVELS; i++) { down.push(half()); up.push(half()); }

const fsScene = new THREE.Scene(), fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const fsGeo = new THREE.BufferGeometry();
fsGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
fsGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
const fsMesh = new THREE.Mesh(fsGeo); fsMesh.frustumCulled = false; fsScene.add(fsMesh);
const FS_V = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const sm = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: FS_V, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
function pass(mat, target) { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }
const LIN = `uniform float uNear; uniform float uFar; float linZ(float d){ return uNear * uFar / (uFar - d * (uFar - uNear)); }`;
const WHITE = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); WHITE.needsUpdate = true;
const FAR = new THREE.DataTexture(new Float32Array([1]), 1, 1, THREE.RedFormat, THREE.FloatType); FAR.needsUpdate = true;

// air: the light each lamp scatters in the room's haze, marched through its cone, shadowed by the boards and
// dappled by the same leaf gobo, so beams are soft shafts rather than drawn cones
const NL = 6;
const airMat = sm(`
  ${LIN}
  uniform sampler2D tDepth; uniform mat4 uInvProj; uniform mat4 uCamWorld; uniform vec3 uCamPos;
  uniform vec3 uLPos[${NL}]; uniform vec3 uLDir[${NL}]; uniform vec2 uLCos[${NL}]; uniform vec3 uLCol[${NL}]; uniform mat4 uLMat[${NL}];
  uniform sampler2D tG0; uniform sampler2D tG1; uniform sampler2D tG2; uniform sampler2D tG3; uniform sampler2D tG4; uniform sampler2D tG5;
  uniform sampler2D tS0; uniform sampler2D tS1; uniform sampler2D tS2; uniform sampler2D tS3; uniform sampler2D tS4; uniform sampler2D tS5;
  uniform float uTime; uniform float uDensity;
  varying vec2 vUv;
  float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
  vec3 gob(int i, vec2 uv){ if (i == 0) return texture2D(tG0, uv).rgb; if (i == 1) return texture2D(tG1, uv).rgb; if (i == 2) return texture2D(tG2, uv).rgb;
    if (i == 3) return texture2D(tG3, uv).rgb; if (i == 4) return texture2D(tG4, uv).rgb; return texture2D(tG5, uv).rgb; }
  float shd(int i, vec2 uv){ if (i == 0) return texture2D(tS0, uv).r; if (i == 1) return texture2D(tS1, uv).r; if (i == 2) return texture2D(tS2, uv).r;
    if (i == 3) return texture2D(tS3, uv).r; if (i == 4) return texture2D(tS4, uv).r; return texture2D(tS5, uv).r; }
  void main(){
    float d = texture2D(tDepth, vUv).r;
    vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); v /= v.w;
    vec3 pEnd = (uCamWorld * v).xyz;
    vec3 rd = pEnd - uCamPos; float len = length(rd); rd /= len; len = min(len, 24.0);
    float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uTime * 0.618);
    const int N = 16; float dt = len / float(N);
    vec3 acc = vec3(0.0);
    for (int s = 0; s < N; s++) {
      vec3 p = uCamPos + rd * ((float(s) + jit) * dt);
      float dens = 0.55 + 0.9 * n3(p * vec3(0.9, 0.7, 0.9) + vec3(uTime * 0.035, -uTime * 0.02, uTime * 0.01));
      for (int i = 0; i < ${NL}; i++) {
        vec3 lv = p - uLPos[i]; float d2 = dot(lv, lv); vec3 l = lv * inversesqrt(d2);
        float cone = smoothstep(uLCos[i].x, uLCos[i].y, dot(l, uLDir[i]));
        if (cone <= 0.0 || dot(uLCol[i], vec3(1.0)) <= 0.0) continue;
        vec4 sc = uLMat[i] * vec4(p, 1.0); vec3 q = sc.xyz / sc.w;
        vec3 g = vec3(1.0); float sh = 1.0;
        if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0 && q.z < 1.0) { g = gob(i, q.xy); sh = step(q.z - 0.0015, shd(i, q.xy)); }
        float ph = 0.8775 / pow(1.1225 - 0.7 * dot(l, -rd), 1.5);
        acc += uLCol[i] * g * (cone * sh * ph * dens / (d2 + 0.15));
      }
    }
    gl_FragColor = vec4(acc * dt * uDensity, 1.0);
  }`, {
  tDepth: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() },
  uLPos: { value: Array.from({ length: NL }, () => new THREE.Vector3()) }, uLDir: { value: Array.from({ length: NL }, () => new THREE.Vector3(0, -1, 0)) },
  uLCos: { value: Array.from({ length: NL }, () => new THREE.Vector2(0.9, 0.95)) }, uLCol: { value: Array.from({ length: NL }, () => new THREE.Vector3()) },
  uLMat: { value: Array.from({ length: NL }, () => new THREE.Matrix4()) },
  ...Object.fromEntries([0, 1, 2, 3, 4, 5].flatMap((i) => [[`tG${i}`, { value: WHITE }], [`tS${i}`, { value: FAR }]])),
  uTime: { value: 0 }, uDensity: { value: 0.0022 }, uNear: { value: 0.08 }, uFar: { value: 60 },
});
const downMat = sm(`
  uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uPre; uniform float uThreshold; varying vec2 vUv;
  void main(){
    vec2 d = uTexel;
    vec3 c = (texture2D(tSrc, vUv + vec2(-d.x, -d.y)).rgb + texture2D(tSrc, vUv + vec2(d.x, -d.y)).rgb
            + texture2D(tSrc, vUv + vec2(-d.x, d.y)).rgb + texture2D(tSrc, vUv + vec2(d.x, d.y)).rgb) * 0.25;
    if (uPre > 0.5) { float br = max(c.r, max(c.g, c.b)); float k = 0.5 * uThreshold;
      float rq = clamp(br - uThreshold + k, 0.0, 2.0 * k); rq = rq * rq / (4.0 * k + 1e-4);
      c *= max(rq, br - uThreshold) / max(br, 1e-4); }
    gl_FragColor = vec4(c, 1.0);
  }`, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uPre: { value: 0 }, uThreshold: { value: 1.1 } });
const upMat = sm(`
  uniform sampler2D tLow; uniform sampler2D tHigh; uniform vec2 uTexel; varying vec2 vUv;
  void main(){
    vec2 d = uTexel;
    vec3 s = texture2D(tLow, vUv).rgb * 4.0;
    s += (texture2D(tLow, vUv + vec2(-d.x, 0.0)).rgb + texture2D(tLow, vUv + vec2(d.x, 0.0)).rgb + texture2D(tLow, vUv + vec2(0.0, -d.y)).rgb + texture2D(tLow, vUv + vec2(0.0, d.y)).rgb) * 2.0;
    s += texture2D(tLow, vUv + vec2(-d.x, -d.y)).rgb + texture2D(tLow, vUv + vec2(d.x, -d.y)).rgb + texture2D(tLow, vUv + vec2(-d.x, d.y)).rgb + texture2D(tLow, vUv + vec2(d.x, d.y)).rgb;
    gl_FragColor = vec4(s / 16.0 + texture2D(tHigh, vUv).rgb, 1.0);
  }`, { tLow: { value: null }, tHigh: { value: null }, uTexel: { value: new THREE.Vector2() } });
// depth of field, gathered at half resolution: a lens focused on the board you are standing at
const COC = `uniform float uFocus; uniform float uAperture; uniform float uBlurAll; uniform float uMaxCoc;
  float coc(float z){ return min(uMaxCoc, uAperture * abs(1.0 - uFocus / z) + uBlurAll); }`;
const dofMat = sm(`
  ${LIN} ${COC}
  uniform sampler2D tSrc; uniform sampler2D tDepth; uniform vec2 uTexel; varying vec2 vUv;
  void main(){
    float zc = linZ(texture2D(tDepth, vUv).r), cc = coc(zc);
    vec3 acc = texture2D(tSrc, vUv).rgb; float wsum = 1.0;
    const float phi = 0.0;
    for (int i = 0; i < 28; i++) {
      float r = sqrt((float(i) + 0.5) / 28.0) * uMaxCoc; float th = float(i) * 2.399963 + phi;
      vec2 o = vec2(cos(th), sin(th)) * r;
      vec2 uv = vUv + o * uTexel;
      float zs = linZ(texture2D(tDepth, uv).r), cs = coc(zs);
      float reach = zs < zc ? cs : min(cs, cc);          // nearer things may spill over; farther ones may not
      float w = smoothstep(r - 1.0, r + 0.5, reach);
      acc += texture2D(tSrc, uv).rgb * w; wsum += w;
    }
    gl_FragColor = vec4(acc / wsum, cc);
  }`, { tSrc: { value: null }, tDepth: { value: null }, uTexel: { value: new THREE.Vector2() }, uFocus: { value: 3 }, uAperture: { value: 0 }, uBlurAll: { value: 0 }, uMaxCoc: { value: 9 }, uNear: { value: 0.08 }, uFar: { value: 60 } });
const compMat = sm(`
  ${LIN} ${COC}
  uniform sampler2D tScene; uniform sampler2D tDof; uniform sampler2D tDepth; uniform sampler2D tBloom; uniform sampler2D tAir;
  uniform vec2 uRes; uniform float uBloom; uniform float uExposure; uniform float uTime; uniform float uFade;
  uniform vec4 uHalo; uniform vec3 uHaloCol; uniform float uDofScale; uniform float uHaloIn; uniform float uHaloAmt;
  uniform sampler2D tFire; uniform float uFire;
  varying vec2 vUv;
  vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
  vec3 aces(vec3 c){
    const mat3 IN = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
    const mat3 OUT = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
    c = IN * c; c = RRTAndODTFit(c); c = OUT * c; return clamp(c, 0.0, 1.0); }
  float srgb(float c){ return c <= 0.0031308 ? 12.92 * c : 1.055 * pow(c, 1.0 / 2.4) - 0.055; }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec2 uv = vUv, d = uv - 0.5;
    vec2 q = d * vec2(uRes.x / uRes.y, 1.0);
    float r2 = dot(q, q);
    vec4 sc0 = texture2D(tScene, uv);
    float isArt = clamp((0.6 - sc0.a) * 2.5, 0.0, 1.0) * (1.0 - clamp(uFire * 4.0, 0.0, 1.0));
    vec2 ca = d * 0.0014 * (0.3 + r2) * (1.0 - isArt);
    vec3 c = isArt > 0.5 ? sc0.rgb : vec3(texture2D(tScene, uv - ca).r, sc0.g, texture2D(tScene, uv + ca).b);
    float cc = coc(linZ(texture2D(tDepth, uv).r)) * uDofScale;
    vec4 b = texture2D(tDof, uv);
    float dofMix = mix(smoothstep(1.1, 2.6, cc), smoothstep(3.8, 6.8, cc), isArt);
    c = mix(c, b.rgb, dofMix);
    c = mix(c, texture2D(tFire, uv).rgb, uFire);
    // the haze: four bilinear taps soften the march's dither (suppressed over crisp artwork & poster surfaces)
    vec2 ht = 1.0 / uRes;
    float hazeKeep = 1.0 - isArt * 0.88;
    c += (texture2D(tAir, uv + ht * vec2(1.0, 1.0)).rgb + texture2D(tAir, uv + ht * vec2(-1.0, 1.0)).rgb + texture2D(tAir, uv + ht * vec2(1.0, -1.0)).rgb + texture2D(tAir, uv + ht * vec2(-1.0, -1.0)).rgb) * 0.25 * hazeKeep;
    c += texture2D(tBloom, uv).rgb * uBloom * vec3(1.0, 0.9, 0.82) * hazeKeep;
    // the film's light: a halo that grows, closes to a point, then floods the room
    vec2 hp = (uv - uHalo.xy) * uRes; float hd = length(hp), hR = uHalo.z, hw = max(uHalo.w, 1.0);
    float out_ = max(hd - hR, 0.0);
    float rim = hd < hR ? uHaloIn : exp(-out_ * out_ / (2.0 * hw * hw));
    c += uHaloCol * uHaloAmt * (rim + 0.07 * exp(-out_ / (hw * 3.0)));
    vec3 cRoom = aces((c * uExposure * (1.0 - 0.34 * smoothstep(0.05, 1.0, r2))) / 0.6);
    vec3 oRoom = vec3(srgb(cRoom.r), srgb(cRoom.g), srgb(cRoom.b));
    vec3 cArt = clamp(c * uExposure, 0.0, 1.0);
    vec3 oArt = vec3(srgb(cArt.r), srgb(cArt.g), srgb(cArt.b));
    vec3 o = mix(oRoom, oArt, isArt);
    float lum = dot(o, vec3(0.299, 0.587, 0.114));
    o += (hash(gl_FragCoord.xy * 0.71 + fract(uTime * 7.31) * 113.0) - 0.5) * (0.008 * (1.0 - lum) + 0.002) * (1.0 - isArt * 0.75);
    gl_FragColor = vec4(o * uFade, 1.0);
  }`, { tScene: { value: null }, tDof: { value: null }, tDepth: { value: null }, tBloom: { value: null }, tAir: { value: null },
  uRes: { value: new THREE.Vector2() }, uBloom: { value: 0.24 }, uExposure: { value: 1.0 }, uTime: { value: 0 }, uFade: { value: 0 },
  uHalo: { value: new THREE.Vector4(0.5, 0.5, 10, 10) }, uHaloIn: { value: 0.2 }, uHaloAmt: { value: 0 }, uHaloCol: { value: new THREE.Color(1, 1, 1) }, uDofScale: { value: 2 },
  tFire: { value: null }, uFire: { value: 0 },
  uFocus: { value: 3 }, uAperture: { value: 0 }, uBlurAll: { value: 0 }, uMaxCoc: { value: 9 }, uNear: { value: 0.08 }, uFar: { value: 60 } });

// the fire lens, learned from the one-descent walk: a wide hard-edged disc gathered in linear light, each sample
// weighted up by its brightness, so a flame spreads into a glow brighter than itself while the dark stays dark.
// Gathered at half size from a quarter-size copy of the scene; only runs while the ending opens it.
const FIRE_R = qs.has('r') ? +qs.get('r') : 0.065;     // widest radius, as a share of the screen's height
const FIRE_LO = qs.has('lo') ? +qs.get('lo') : 0.18, FIRE_HI = qs.has('hi') ? +qs.get('hi') : 0.85;
const qRT = half(), fireRT = half();
const fireMat = sm(`
  uniform sampler2D tSrc; uniform vec2 uPx; uniform float uR; uniform float uBoost; uniform float uLo; uniform float uHi; varying vec2 vUv;
  void main(){
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 112; i++) {
      float fi = float(i) + 0.5;
      float r = uR * sqrt(fi / 112.0), th = fi * 2.3999632;
      vec3 c = texture2D(tSrc, vUv + r * vec2(cos(th), sin(th)) * uPx).rgb;
      float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
      float mx = max(c.r, max(c.g, c.b)), sat = (mx - min(c.r, min(c.g, c.b))) / max(mx, 1e-4);
      acc += c * (1.0 + uBoost * smoothstep(uLo, uHi, L) * smoothstep(0.12, 0.45, sat) * 5.0);
    }
    gl_FragColor = vec4(acc / 112.0, 1.0);
  }`, { tSrc: { value: null }, uPx: { value: new THREE.Vector2() }, uR: { value: 0 }, uBoost: { value: 1 }, uLo: { value: FIRE_LO }, uHi: { value: FIRE_HI } });

function resizeTargets() {
  renderer.getDrawingBufferSize(size);
  const w = Math.max(2, size.x), h = Math.max(2, size.y), hw = Math.max(1, Math.round(w / 2)), hh = Math.max(1, Math.round(h / 2));
  const lw = Math.max(1, Math.round(w * 0.35)), lh = Math.max(1, Math.round(h * 0.35));
  sceneRT.setSize(w, h);
  reflRT.setSize(lw, lh); airRT.setSize(lw, lh); halfRT.setSize(hw, hh); dofRT.setSize(hw, hh);
  fireRT.setSize(hw, hh); qRT.setSize(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 4)));
  let bw = hw, bh = hh;
  for (let i = 0; i < BLOOM_LEVELS; i++) { down[i].setSize(Math.max(1, bw), Math.max(1, bh)); up[i].setSize(Math.max(1, bw), Math.max(1, bh)); bw = Math.round(bw / 2); bh = Math.round(bh / 2); }
  compMat.uniforms.uRes.value.set(w, h);
  dofMat.uniforms.uTexel.value.set(1 / hw, 1 / hh);
}

// planar mirror for the floor
const mirrorCam = new THREE.PerspectiveCamera();
const _v = new THREE.Vector3(), _t = new THREE.Vector3(), _m = new THREE.Matrix4(), _up = new THREE.Vector3();
const BIAS = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
function updateMirror() {
  camera.updateMatrixWorld();
  _m.extractRotation(camera.matrixWorld);
  _v.setFromMatrixPosition(camera.matrixWorld);
  _t.set(0, 0, -1).applyMatrix4(_m).add(_v);
  mirrorCam.position.set(_v.x, -_v.y, _v.z);
  _up.set(0, 1, 0).applyMatrix4(_m); _up.y = -_up.y;
  mirrorCam.up.copy(_up);
  mirrorCam.lookAt(_t.x, -_t.y, _t.z);
  mirrorCam.near = camera.near; mirrorCam.far = camera.far;
  mirrorCam.updateMatrixWorld();
  mirrorCam.projectionMatrix.copy(camera.projectionMatrix);
  mirrorCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  reflMatrix.copy(BIAS).multiply(mirrorCam.projectionMatrix).multiply(mirrorCam.matrixWorldInverse);
}

// ---------------------------------------------------------------- the route: eye height, square to the boards
const EYE = 1.6;
const st = {};
function boardView(b, turn, dist, shift, yDrop = 0.04) {
  const look = b.center.clone().addScaledVector(b.xAxis, b.side * shift); look.y = b.center.y - yDrop;
  const a = b.yaw + turn, d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
  const pos = look.clone().addScaledVector(d, dist); pos.y = EYE;
  return { pos, look };
}
function buildStations(portrait) {
  const yDrop = portrait ? 0.22 : 0.04;
  st.S0 = { pos: new THREE.Vector3(0.25, EYE, 6.2), look: new THREE.Vector3(-0.1, 1.42, -8.0), fov: 40 };
  const fit = (b) => clamp(1.4 * Math.max(b.L.W, b.L.H * 1.5), 1.6, 3.4);   // stand back as far as the board needs
  const distFor = (b) => portrait ? clamp(fit(b) * 1.88, 5.0, 5.85) : fit(b) * 1.14;
  // on desktop, shift slightly toward the open aisle so each panel's narrative caption sits cleanly in the open bay beside it
  boards.forEach((b, idx) => {
    const turn = portrait ? 0 : -b.side * 0.16;
    const shift = portrait ? (b.label ? 0.05 : 0) : -0.34;
    st[`S${idx + 1}`] = { ...boardView(b, turn, distFor(b), shift, yDrop), fov: 40 };
  });
  if (OPEN === 'photo') {
    const b = boards[0];
    if (portrait) {
      const toAisle = -b.side * 0.18;
      st.S1 = { ...boardView(b, 0, distFor(b) * 1.04, b.label ? 0.05 : 0, yDrop), fov: 40 };
      st.S1.pos.x += toAisle; st.S1.look.x += toAisle * 0.4;
    } else {
      st.S1 = { ...boardView(b, -b.side * 0.14, fit(b) * 1.18, -0.34, yDrop), fov: 40 };
    }
  }
  st.SF = { pos: new THREE.Vector3(0, EYE, END_Z + 4.25 * (portrait ? 1.3 : 1)), look: new THREE.Vector3(posterBoard.ring.x, 2.0, END_Z), fov: 42 };
  st.SE = { pos: new THREE.Vector3(0, EYE, END_Z + (portrait ? 5.05 : 4.18)), look: new THREE.Vector3(portrait ? 0 : 0.12, posterBoard.center.y + (portrait ? -0.16 : -0.01), END_Z), fov: 36 };
  st.SP = { pos: new THREE.Vector3(0, EYE - 0.04, END_Z + (portrait ? 5.75 : 4.75)), look: new THREE.Vector3(0, portrait ? 1.56 : 1.82, END_Z), fov: 44, stop: 0.35 };
  if (portrait) for (const s of Object.values(st)) s.fov = Math.min(64, s.fov * 1.4);
  if (OPEN === 'photo') {
    // the first photograph fills the frame: the lens square to its print, as close as still covers the screen
    const b = boards[0], r = b.L.rects[0];
    const look = b.center.clone().addScaledVector(b.xAxis, r.x); look.y += r.y;
    const fov = st.S1.fov, t = Math.tan((fov * DEG) / 2), asp = innerWidth / innerHeight;
    const d = Math.min(r.h / (2 * t), r.w / (2 * t * asp)) * 0.94;
    st.S0 = { pos: look.clone().addScaledVector(b.n, d + FRONT), look, fov };
  }
  for (const s of Object.values(st)) s.q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(s.pos, s.look, new THREE.Vector3(0, 1, 0)));
}
// one gait for every walk: a calm start, a steady middle, a long soft landing; the head turns with the body
const WALK = { p: cubicBezier(0.45, 0.0, 0.3, 1.0), l: cubicBezier(0.42, 0.0, 0.3, 1.0) };
// legs between stations: each sways away from the board it leaves and arrives along the aisle
// ?open=photo: uniform 1/3-chord Bezier pull-back along b.n into the aisle — constant smooth zoom-out with zero start hesitation
const LEGS = [OPEN === 'photo' ? { from: 'S0', to: 'S1', c1: [0.25, -0.02, 0.95], c2: [-0.38, 0.02, -0.82] } : { from: 'S0', to: 'S1', c1: [0, 0, -1.6], c2: [0.25, 0, 1.2] }];
for (let i = 1; i < NB; i++) { const sf = BOARDS[i - 1].side, sto = BOARDS[i].side; LEGS.push({ from: `S${i}`, to: `S${i + 1}`, c1: [-sf * 0.3, 0, -0.9], c2: [-sto * 0.2, 0, 1.0] }); }
LEGS.push({ from: `S${NB}`, to: 'SF', c1: [-0.1, 0, -1.3], c2: [0, 0, 1.4] });
const SAY = ['The entrance', ...BOARDS.map((b, i) => `Panel ${i + 1}${b.label ? '. ' + b.label.t.join(', ') : ''}`), 'The film, projected as a circle'];
let TL;
if (PACE === 'old') {
  TL = [{ at: 'S0', px: 300, say: SAY[0] }];
  LEGS.forEach((g, i) => TL.push({ ...g, px: i === NB - 1 ? 1700 : 1350 }, { at: g.to, px: i === NB - 1 ? 900 : 1000, say: SAY[i + 1] }));
  TL.push({ end: true, px: 2500, say: 'The poster' }, { at: 'SE', px: 300 }, { back: true, px: 1300, say: 'The poster, in its room' }, { at: 'SP', px: 200 });
} else {
  TL = [
    { walk: true, px: 0 },
    { end: true, px: 1900, say: 'The poster' },
    { holdSE: true, px: 560, say: 'Vanessa Espín' },
    { back: true, px: 1080, say: 'The poster, in its room' },
    { at: 'SP', px: 220 },
  ];
}

// v2's walk: one position s along the route (station i at s = i), reached through a scroll map that slows to a
// drift at each board (a linger: never zero) and carries the walk between them.
// For OPEN === 'photo', Leg 0 starts smoothly with a gentle non-zero slope m0 = 0.44 (subtle, unhurried zoom-out).
const PACE_NEW = { lead: 180, walk: [920, ...Array(NB - 1).fill(680), 880], linger: 320, a: 0.05, film: 420, aFilm: 0.035 };
const PIECES = [];
if (PACE === 'new') {
  const P = PACE_NEW, aAt = (j) => (j === 0 && OPEN === 'photo' ? 0 : j === NB + 1 ? P.aFilm : P.a);
  const speed = (j) => (j === 0 ? P.a / P.lead : j === NB + 1 ? P.aFilm / P.film : (2 * P.a) / P.linger); // s per px while lingering at j
  let px = 0;
  const add = (o) => { o.start = px; px += o.px; PIECES.push(o); };
  if (OPEN !== 'photo') add({ kind: 'linger', s0: 0, s1: P.a, px: P.lead, j: 0 });
  for (let i = 0; i <= NB; i++) {
    const s0 = i + aAt(i), s1 = i + 1 - aAt(i + 1), ds = s1 - s0, n = P.walk[i];
    const m0 = (i === 0 && OPEN === 'photo') ? 0.44 : (speed(i) * n) / ds;
    const m1 = (i === 0 && OPEN === 'photo') ? (speed(1) * n) / (ds * 1.45) : (speed(i + 1) * n) / ds;
    add({ kind: 'walk', s0, s1, px: n, m0, m1 });
    if (i < NB) add({ kind: 'linger', s0: s1, s1: i + 1 + P.a, px: P.linger, j: i + 1 });
  }
  add({ kind: 'linger', s0: NB + 1 - P.aFilm, s1: NB + 1, px: P.film, j: NB + 1 });
  TL[0].px = px;
}
const hermite = (t, m0, m1) => { const t2 = t * t, t3 = t2 * t; return (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) + (t3 - t2) * m1; };
function sAtPx(px) {
  const p = PIECES.find((x) => px < x.start + x.px) ?? PIECES[PIECES.length - 1];
  const t = clamp((px - p.start) / p.px);
  return p.kind === 'walk' ? lerp(p.s0, p.s1, hermite(t, p.m0, p.m1)) : lerp(p.s0, p.s1, t);
}
function pxAtS(s) { // inverse, for anchoring type to places on the route
  let lo = 0, hi = TL[0].px;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (sAtPx(m) < s) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

let TOTAL = 0;
for (const s of TL) { s.start = TOTAL; TOTAL += s.px; }
const END = TL.find((s) => s.end), HOLD_SE = TL.find((s) => s.holdSE), BACK = TL.find((s) => s.back);
// where the walk turns toward the film, and where it stands before it (the line and the film's cue hang off these)
const FILM_APPROACH = { start: pxAtS(NB), px: pxAtS(NB + 1) - pxAtS(NB) };
const FILM_HOLD = { start: pxAtS(NB + 1 - PACE_NEW.aFilm) };

const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _p3 = new THREE.Vector3();
function bez(a, b, c, d, t, out) { const u = 1 - t; return out.set(0, 0, 0).addScaledVector(a, u * u * u).addScaledVector(b, 3 * u * u * t).addScaledVector(c, 3 * u * t * t).addScaledVector(d, t * t * t); }
const route = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 40, look: new THREE.Vector3(), stop: 1, s: 0 };
const _lk = new THREE.Vector3(), _mq = new THREE.Matrix4(), _cA = new THREE.Vector3(), _cB = new THREE.Vector3();
function legAt(g, tp, tl, t) {
  const A0 = st[g.from], B0 = st[g.to];
  _p0.copy(A0.pos); _p3.copy(B0.pos);
  _p1.copy(A0.pos).add(_v.set(...g.c1)); _p2.copy(B0.pos).add(_t.set(...g.c2));
  bez(_p0, _p1, _p2, _p3, tp, route.pos);   // stations are at eye height, except the photograph the walk starts inside
  route.q.copy(A0.q).slerp(B0.q, tl);
  route.fov = lerp(A0.fov, B0.fov, tl);
  route.look.lerpVectors(A0.look, B0.look, tl);
  route.stop = 1 - ss(0.0, 0.18, t) * (1 - ss(0.82, 1.0, t));
}
function lookFrom(pos, look, fov) {
  route.pos.copy(pos); route.look.copy(look); route.fov = fov;
  route.q.setFromRotationMatrix(_mq.lookAt(route.pos, route.look, _v.set(0, 1, 0)));
}
function routeAt(px) {
  px = clamp(px, 0, TOTAL - 0.001);
  const s = TL.find((x) => px >= x.start && px < x.start + x.px) ?? TL[TL.length - 1];
  if (s.at) { const S = st[s.at]; route.pos.copy(S.pos); route.q.copy(S.q); route.fov = S.fov; route.look.copy(S.look); route.stop = S.stop ?? 1; return s; }
  const t = (px - s.start) / s.px;
  if (s.walk) {
    const sp = sAtPx(px - s.start), i = Math.min(NB, Math.floor(sp)), tt = sp - i;
    route.s = sp;
    // Gentle perspective-balanced zoom-out out of Panel 1's forest photo
    const tp = (i === 0 && OPEN === 'photo') ? (Math.pow(2.5, tt) - 1) / 1.5 : tt;
    const tl = (i === 0 && OPEN === 'photo') ? clamp(tp * 1.04) : clamp(tt * 1.04);
    legAt(LEGS[i], tp, tl, tt);
    return s;
  }
  if (s.end) { endCam(t); return s; }
  if (s.holdSE) {
    // stay on the closer poster view (st.SE) with a barely perceptible 3% living gallery breath
    const tb = 0.03 * t, A0 = st.SE, B0 = st.SP;
    route.pos.lerpVectors(A0.pos, B0.pos, tb); route.look.lerpVectors(A0.look, B0.look, tb); route.fov = lerp(A0.fov, B0.fov, tb);
    route.q.setFromRotationMatrix(_mq.lookAt(route.pos, route.look, _v.set(0, 1, 0)));
    route.stop = 1;
    return s;
  }
  if (s.back) {
    // the pull-back: straight back along the same line until the poster hangs in its room
    const tb0 = PACE === 'old' ? WALK.p(t) : BACK_EASE(t), tb = HOLD_SE ? 0.03 + 0.97 * tb0 : tb0, A0 = st.SE, B0 = st.SP;
    route.pos.lerpVectors(A0.pos, B0.pos, tb); route.look.lerpVectors(A0.look, B0.look, tb); route.fov = lerp(A0.fov, B0.fov, tb);
    route.q.setFromRotationMatrix(_mq.lookAt(route.pos, route.look, _v.set(0, 1, 0)));
    route.stop = lerp(1, 0.35, tb0);
    return s;
  }
  const g = LEGS.find((x) => x.from === s.from);
  legAt(g, WALK.p(t), WALK.l(clamp(t * 1.04)), t);
  return s;
}
const BACK_EASE = cubicBezier(0.28, 0.08, 0.28, 1.0);

// ---------------------------------------------------------------- the ending: four ways through the film's light
// The flame in her poster (212) is its brightest spot: measured at u 0.52, v 0.465, inside the canopy ring the
// film is projected into. Variants b and c pass through that fire; a keeps v1's point of light but makes it fire.
const FLAME = { u: 0.52, v: 0.49 };
const PUSH = cubicBezier(0.55, 0.0, 0.35, 1.0), RISE = cubicBezier(0.5, 0.0, 0.12, 1.0), IO = cubicBezier(0.45, 0, 0.55, 1);
const flamePt = new THREE.Vector3((FLAME.u - 0.5) * POSTER.w, posterBoard.center.y + POSTER.h / 2 - FLAME.v * POSTER.h, posterBoard.center.z);
function endCam(e) {
  const A0 = st.SF, B0 = st.SE, dirA = _cA.copy(A0.look).sub(A0.pos).normalize();
  route.stop = 1;
  if (FIRE === '0' || FIRE === 'a') {
    // v1: a slow lean toward the film; then, under the light, the camera stands back for the poster
    if (e < 0.555) lookFrom(_p0.copy(A0.pos).addScaledVector(dirA, ss(0.0, 0.5, e) * 0.32), A0.look, A0.fov);
    else { const k = land(clamp((e - 0.56) / 0.4)); lookFrom(_p0.copy(B0.pos).addScaledVector(_cB.copy(B0.look).sub(B0.pos).normalize(), 0.62 * (1 - k)), B0.look, B0.fov); }
    return;
  }
  // the close place: a hand's length from the flame, the lens wide open
  const close = _p3.copy(flamePt).add(_v.set(0, -0.02, 0.62));
  if (FIRE === 'b') {
    // b: walk into the film's circle until there is only its fire, then stand back out of it
    const lean = _p1.copy(A0.pos).addScaledVector(dirA, ss(0, 0.12, e) * 0.14);
    if (e < 0.47) {
      const k = PUSH(clamp((e - 0.12) / 0.35));
      _p0.lerpVectors(lean, close, k); _p2.lerpVectors(A0.look, flamePt, k);
      lookFrom(_p0, _p2, lerp(A0.fov, 40, k));
    } else if (e < 0.6) {
      // inside the fire it keeps moving: a little closer, and the eye drifts up the flame toward the sky
      const k = clamp((e - 0.47) / 0.13);
      _p0.copy(close).add(_v.set(0, 0.1 * k, -0.16 * k)); _p2.copy(flamePt).add(_v.set(0, 0.1 * k, 0));
      lookFrom(_p0, _p2, 40);
    } else {
      const k = RISE(clamp((e - 0.6) / 0.4));
      _p0.copy(close).add(_v.set(0, 0.1, -0.16)); _p0.lerp(B0.pos, k);
      _p2.copy(flamePt).add(_v.set(0, 0.1, 0)); _p2.lerp(B0.look, k);
      lookFrom(_p0, _p2, lerp(40, B0.fov, k));
    }
    return;
  }
  // c: stay with the film; the lens lets go of it, the film becomes the poster's fire, and the focus comes back
  const push = 1.5 * IO(clamp(e / 0.5)) + 0.04 * clamp((e - 0.5) / 0.12);
  _p1.copy(A0.pos).addScaledVector(dirA, push);
  if (e < 0.62) lookFrom(_p1, A0.look, A0.fov);
  else { const k = land(clamp((e - 0.62) / 0.33)); _p0.lerpVectors(_p1, B0.pos, k); _p2.lerpVectors(A0.look, B0.look, k); lookFrom(_p0, _p2, lerp(A0.fov, B0.fov, k)); }
}

// ---------------------------------------------------------------- the film
async function loadFilm() {
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
  try { const blob = await (await fetch(A + 'v206.mp4')).blob(); v.src = URL.createObjectURL(blob); } catch { v.src = A + 'v206.mp4'; }
  film.video = v;
  await new Promise((r) => { v.addEventListener('loadeddata', r, { once: true }); setTimeout(r, 4000); });
  if (FILM_AT !== null) { v.currentTime = FILM_AT; await new Promise((r) => { v.addEventListener('seeked', r, { once: true }); setTimeout(r, 2500); }); }
  else if (!MANUAL) { try { await v.play(); } catch {} }
  film.ready = true;
  const onFrame = () => { drawFilm(); if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(onFrame); };
  if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(onFrame);
  drawFilm();
}
// The projected film's average colour by video time, one value every 0.1 s (red, green, blue, 0-255). The page used to read it
// back from the picture every few frames; that read waits for the graphics card to finish and held up the whole film.
// Recorded once from the same picture instead (site-check/results/stalls/rec-avg.mjs).
const FILM_AVG = { dt: 0.1, c: [20,20,32,22,22,36,24,24,38,26,26,39,24,24,38,23,22,35,23,21,34,23,22,35,23,22,35,23,21,35,23,21,35,22,21,34,23,20,33,24,21,33,25,22,33,25,21,32,27,23,33,27,23,34,29,24,34,29,24,33,29,24,33,29,24,33,29,24,34,30,24,35,30,24,35,30,24,35,30,24,35,30,24,35,30,24,34,30,24,34,30,24,34,30,24,34,29,24,34,29,24,34,29,24,33,29,23,33,29,23,33,29,23,34,28,23,34,28,23,33,28,23,33,28,23,33,27,22,33,27,21,32,28,22,32,28,22,32,29,22,33,29,22,33,29,22,33,28,22,33,29,22,33,29,22,33,29,22,33,28,22,32,28,21,32,28,22,33,28,22,33,29,23,34,33,28,40,38,36,51,42,43,59,57,65,89,68,79,109,78,93,128,84,104,141,88,108,146,96,119,157,94,118,157,93,118,157,91,115,155,88,112,154,79,101,143,77,97,139,75,94,135,71,90,131,62,80,119,60,75,115,55,69,108,51,65,106,48,62,106,45,58,103,45,58,103,47,60,107,50,63,113,50,65,114,51,66,115,50,66,115,50,65,115,50,66,116,51,66,117,50,66,118,49,64,117,49,64,116,49,64,116,49,64,116,49,63,115,49,63,114,49,63,113,46,60,110,48,60,109,49,61,108,50,61,107,53,62,106,56,63,104,58,63,103,62,64,101,65,64,98,68,65,96,72,65,93,75,66,88,77,66,87,80,67,84,83,67,81,86,67,78,88,68,77,90,68,74,92,68,71,95,69,67,97,69,63,98,70,62,100,69,58,101,69,57,101,69,56,101,69,55,101,69,55,102,69,55,101,69,55,102,69,55,102,69,55,103,69,55,102,69,55,102,69,55,102,69,55,102,69,55,102,69,54,102,69,54,102,69,54,102,69,55,102,69,55,102,69,55,102,69,55,102,69,55,102,69,54,102,69,55,102,68,54,101,69,54,100,69,54,100,69,54,100,69,54,100,69,54,100,69,54,100,69,54,100,69,54,100,69,54,100,68,54,101,69,54,100,69,54,101,69,54,101,69,55,101,70,55,101,70,55,101,70,55,101,69,55,102,70,55,101,69,54,101,69,54,101,69,54,102,70,55,102,70,55,103,71,55,103,71,55,103,71,55,103,70,55,102,70,55,103,70,55,103,71,55,103,71,55,103,70,55,103,70,55,102,70,54,102,70,54,102,70,54,102,70,54,101,69,54,102,69,54,102,70,55,102,70,55,102,70,56,99,70,58,99,71,59,100,71,59,99,70,59,99,70,58,100,71,59,99,70,58,99,70,58,99,70,58,100,70,58,100,71,59,100,71,59,100,71,59,100,71,58,100,70,58,100,70,58,100,70,58,100,71,58,100,71,59,100,71,58,100,71,58,100,71,58,100,71,58,100,71,58,100,71,58,100,71,58,100,71,58,100,71,58,100,71,58,99,70,58,99,70,58] };
const ringGrad = (() => {
  const g = fctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.83, 'rgba(0,0,0,0)'); g.addColorStop(0.9, 'rgba(0,0,0,0.92)'); g.addColorStop(0.95, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  return g;
})();
function drawFilm() {
  const v = film.video; if (!v || v.readyState < 2) return;
  const f = clamp(v.currentTime / TRACK.dt, 0, TRACK.c.length / 2 - 1);
  const i0 = Math.floor(f), i1 = Math.min(TRACK.c.length / 2 - 1, i0 + 1), k = f - i0;
  const cx = lerp(TRACK.c[i0 * 2], TRACK.c[i1 * 2], k), cy = lerp(TRACK.c[i0 * 2 + 1], TRACK.c[i1 * 2 + 1], k);
  const hx = TRACK.rx * 1.22, hy = TRACK.ry * 1.22, squash = Math.cos(projector.incl);
  fctx.fillStyle = '#000'; fctx.fillRect(0, 0, 512, 512);
  fctx.drawImage(v, cx - hx, cy - hy, hx * 2, hy * 2, 0, 256 - 256 * squash, 512, 512 * squash);
  fctx.save(); fctx.translate(256, 256); fctx.scale(1, squash); fctx.translate(-256, -256);
  fctx.fillStyle = ringGrad; fctx.fillRect(-10, -60, 532, 632); fctx.restore();
  filmTex.needsUpdate = true;
  const ac = FILM_AVG.c, an = ac.length / 3 - 1, af = clamp(v.currentTime / FILM_AVG.dt, 0, an), a0 = Math.floor(af), a1 = Math.min(an, a0 + 1), ak = af - a0;
  film.avg.setRGB(lerp(ac[a0 * 3], ac[a1 * 3], ak) / 255, lerp(ac[a0 * 3 + 1], ac[a1 * 3 + 1], ak) / 255, lerp(ac[a0 * 3 + 2], ac[a1 * 3 + 2], ak) / 255, THREE.SRGBColorSpace);
}

// ---------------------------------------------------------------- type over the picture
const intro = document.getElementById('intro'), head = document.getElementById('head');
const tl1El = document.getElementById('tl-1'), tl2El = document.getElementById('tl-2'), tl3El = document.getElementById('tl-3');
const stopLineEl = document.getElementById('stop-line'), stopLineP = document.getElementById('stop-line-p');
const label = document.getElementById('label'), live = document.getElementById('live');
for (const el of [tl1El, tl2El, tl3El]) {
  if (el?.decode) loads.push(el.decode().catch(() => null));
}
const _s = new THREE.Vector3();
function toScreen(p) { _s.copy(p).project(camera); return { x: (_s.x * 0.5 + 0.5) * innerWidth, y: (-_s.y * 0.5 + 0.5) * innerHeight }; }

// Hand-crafted organic domain-warped fBm watercolour & sumi-charcoal wash clouds (sumi wash):
// unique organic ragged silhouette per stop, ~74% translucent cold-press textured pigment core, zero rigid box edges
const WASH_PLATES = (() => {
  const W = 320, H = 200;
  function hash2(ix, iy, seed) {
    const h = Math.imul(ix * 374761393 + iy * 668265263 + seed * 1442695041, 1274126177);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed);
    const c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
    return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
  }
  function fbm(x, y, seed, oct = 4) {
    let sum = 0, amp = 0.5, freq = 1;
    for (let o = 0; o < oct; o++) {
      sum += amp * vnoise(x * freq, y * freq, seed + o * 97);
      freq *= 2.03; amp *= 0.5;
    }
    return sum;
  }
  function smin(a, b, k = 0.28) {
    const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
    return lerp(b, a, h) - k * h * (1 - h);
  }
  function bakeOne(seed) {
    const R = rng(seed * 7919 + 101);
    const lobes = [
      [0, 0, 0.56, 0.50, (R() - 0.5) * 0.28],
      [-0.22 + (R() - 0.5) * 0.06, -0.10 + (R() - 0.5) * 0.08, 0.42, 0.38, (R() - 0.5) * 0.6],
      [ 0.23 + (R() - 0.5) * 0.06,  0.09 + (R() - 0.5) * 0.08, 0.44, 0.39, (R() - 0.5) * 0.6],
      [-0.14 + (R() - 0.5) * 0.08,  0.14 + (R() - 0.5) * 0.06, 0.38, 0.35, (R() - 0.5) * 0.6],
      [ 0.15 + (R() - 0.5) * 0.08, -0.13 + (R() - 0.5) * 0.06, 0.39, 0.35, (R() - 0.5) * 0.6],
    ];
    const cInk = document.createElement('canvas'); cInk.width = W; cInk.height = H;
    const cMsk = document.createElement('canvas'); cMsk.width = W; cMsk.height = H;
    const gInk = cInk.getContext('2d'), gMsk = cMsk.getContext('2d');
    const idInk = gInk.createImageData(W, H), idMsk = gMsk.createImageData(W, H);
    const dI = idInk.data, dM = idMsk.data;

    for (let py = 0; py < H; py++) {
      const ny = (py / (H - 1)) * 2 - 1;
      for (let px = 0; px < W; px++) {
        const nx = (px / (W - 1)) * 2 - 1;
        // Strictly fade to 0 before reaching canvas borders so zero straight edge can ever appear
        const env = 1 - ss(0.74, 0.96, Math.hypot(nx * 1.02, ny * 1.04));
        const idx = (py * W + px) * 4;
        if (env <= 0.001) continue;

        let dMin = 9;
        for (let li = 0; li < lobes.length; li++) {
          const [lx, ly, rx, ry, rot] = lobes[li];
          const dx = nx - lx, dy = ny - ly;
          const ca = Math.cos(rot), sa = Math.sin(rot);
          const ux = (dx * ca + dy * sa) / rx, uy = (-dx * sa + dy * ca) / ry;
          dMin = li === 0 ? Math.hypot(ux, uy) : smin(dMin, Math.hypot(ux, uy), 0.34);
        }

        // Domain-warped watercolour bleed + cold-press paper tooth
        const qx = fbm(nx * 2.4 + 3.1, ny * 2.4 + 1.7, seed + 11, 3);
        const qy = fbm(nx * 2.4 + 8.3, ny * 2.4 + 5.9, seed + 37, 3);
        const bleed = fbm(nx * 3.2 + 1.35 * qx, ny * 3.2 + 1.35 * qy, seed + 73, 4);
        const fine = fbm(nx * 13.5, ny * 13.5, seed + 131, 3);
        const grain = hash2(px, py, seed + 211);
        const dWarp = dMin + (bleed - 0.5) * 0.44 + (fine - 0.5) * 0.14;

        // Soft optical blur mask (::before)
        const mskA = ss(1.18, 0.46, dWarp) * env;
        dM[idx] = dM[idx + 1] = dM[idx + 2] = 255;
        dM[idx + 3] = Math.round(clamp(mskA, 0, 1) * 255);

        // Translucent sumi-charcoal & warm-umber pigment pool with wet tide-glaze & paper tooth (::after)
        const core = ss(1.26, 0.36, dWarp);
        const tide = Math.exp(-Math.pow((dWarp - 0.84) / 0.16, 2)) * 0.14;
        const paperTooth = 0.82 + 0.28 * fine + 0.14 * (grain - 0.5);
        const inkA = clamp((core * 0.72 + tide) * paperTooth * env, 0, 0.78);
        const warmGlaze = clamp(tide * 4.5, 0, 1);
        dI[idx]     = Math.round(13 + 14 * warmGlaze + 7 * (fine - 0.5));
        dI[idx + 1] = Math.round(11 +  9 * warmGlaze + 5 * (fine - 0.5));
        dI[idx + 2] = Math.round( 9 +  4 * warmGlaze + 4 * (fine - 0.5));
        dI[idx + 3] = Math.round(inkA * 255);
      }
    }
    gInk.putImageData(idInk, 0, 0);
    gMsk.putImageData(idMsk, 0, 0);
    return { inkUrl: `url(${cInk.toDataURL()})`, maskUrl: `url(${cMsk.toDataURL()})` };
  }
  return [1, 2, 3, 4, 5].map(bakeOne);
})();

if (label) {
  label.style.setProperty('--wash-ink', WASH_PLATES[4].inkUrl);
  label.style.setProperty('--wash-mask', WASH_PLATES[4].maskUrl);
}
let activeStopWashIdx = -1;
function applyStopWashAndTightWrap(boardIdx) {
  if (!stopLineEl || !stopLineP) return;
  if (boardIdx !== activeStopWashIdx && WASH_PLATES[boardIdx]) {
    activeStopWashIdx = boardIdx;
    stopLineEl.style.setProperty('--wash-ink', WASH_PLATES[boardIdx].inkUrl);
    stopLineEl.style.setProperty('--wash-mask', WASH_PLATES[boardIdx].maskUrl);
  }
  // Tight-wrap width around actual balanced lines so short phrases get an intimate watercolour cloud
  stopLineEl.style.width = 'max-content';
  const textNode = stopLineP.firstChild;
  if (textNode) {
    const rngDom = document.createRange();
    rngDom.selectNodeContents(stopLineP);
    const rw = Math.ceil(rngDom.getBoundingClientRect().width);
    if (rw > 20) stopLineEl.style.width = `${rw + 22}px`;
  }
}

function renderIntroLockup(rawFilmTime, staticHold) {
  if (!intro) return;
  const p1Arrive = compiledSched?.sched?.stops?.p1?.arrive ?? 5.45;
  const scTime = Math.min(1, p1Arrive / 5.45);
  const tAnim = (staticHold && rawFilmTime < 0.08) ? 2.4 * scTime : rawFilmTime;
  if (tAnim >= 4.62 * scTime) {
    intro.style.opacity = '0';
    intro.style.visibility = 'hidden';
    intro.style.setProperty('--scrim-op', '0');
    return;
  }
  intro.style.visibility = 'visible';
  intro.style.opacity = '1';
  const scrimOp = ss(0.12 * scTime, 1.05 * scTime, tAnim) * (1 - ss(3.44 * scTime, 4.56 * scTime, tAnim));
  intro.style.setProperty('--scrim-op', scrimOp.toFixed(3));
  const plates = [
    [tl1El, 0.20, 1.00, 3.48, 4.36],
    [tl2El, 0.55, 1.45, 3.56, 4.46],
    [tl3El, 1.10, 2.00, 3.64, 4.56],
  ];
  for (const [el, a0, a1, d0, d1] of plates) {
    if (!el) continue;
    const appear = ss(a0 * scTime, a1 * scTime, tAnim);
    const disappear = 1 - ss(d0 * scTime, d1 * scTime, tAnim);
    const op = appear * disappear;
    const dy = (1 - appear) * 12 - (1 - disappear) * 14;
    const sc = 0.975 + 0.025 * appear + 0.03 * (1 - disappear);
    const bl = (1 - appear) * 5.2 + (1 - disappear) * 4.8;
    el.style.opacity = op.toFixed(3);
    el.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
    el.style.filter = bl > 0.08 ? `blur(${bl.toFixed(2)}px)` : 'none';
  }
}

(function grain() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const d = g.createImageData(256, 256), R = rng(5);
  for (let i = 0; i < d.data.length; i += 4) { const v = (R() + R() + R()) / 3 * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0);
  const url = c.toDataURL();
  const els = [...document.querySelectorAll('.grain')];
  els.forEach((el) => { el.style.backgroundImage = `url(${url})`; el.style.backgroundSize = `${256 / DPR}px ${256 / DPR}px`; });
  if (reduce) return;
  let last = 0;
  const tick = (now) => {
    if (now - last > 41) { last = now; els.forEach((el) => { el.style.transform = `translate3d(${Math.round(-Math.random() * 256 / DPR)}px, ${Math.round(-Math.random() * 256 / DPR)}px, 0)`; }); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

// ---------------------------------------------------------------- movie timeline, playback & layout
const progBarEl = document.getElementById('prog-bar');
const progFillEl = document.getElementById('prog-fill');
const progTipEl = document.getElementById('prog-tip');
const tapStateEl = document.getElementById('tap-state');
const tapIconEl = document.getElementById('tap-icon');
const btnPlayEl = document.getElementById('btn-play');
const btnReplayEl = document.getElementById('btn-replay');
const timeLblEl = document.getElementById('time-lbl');

let filmTime = 0.0;
let isPlaying = true;
let isScrubbing = false;
let wasPlayingBeforeScrub = true;
let tapFlashTimer = 0;
const isStaticHold = () => (TIME_Q !== null || AT !== null) && qs.get('play') !== '1';
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.round(s)) % 60).padStart(2, '0')}`;

if (TIME_Q !== null) {
  filmTime = clamp(TIME_Q, 0, FILM_DURATION);
  if (qs.get('play') !== '1') isPlaying = false;
} else if (AT !== null) {
  filmTime = (AT <= 1 ? clamp(AT, 0, 1) : clamp(AT / TOTAL, 0, 1)) * FILM_DURATION;
  if (qs.get('play') !== '1') isPlaying = false;
}

function pxAtMovieTime(tSec) {
  return compiledSched.uAtTimeSec(tSec) * TOTAL;
}

function syncPlayUi(flash = false) {
  if (btnPlayEl) {
    btnPlayEl.textContent = isPlaying ? 'Pause' : 'Play';
    btnPlayEl.classList.toggle('active', isPlaying);
  }
  if (tapStateEl && tapIconEl && !isStaticHold() && !MANUAL) {
    clearTimeout(tapFlashTimer);
    if (!isPlaying && filmTime < FILM_DURATION - 0.05) {
      tapIconEl.innerHTML = '<path d="M8 5.5v13l11-6.5z"/>';
      tapStateEl.classList.remove('is-flash');
      tapStateEl.classList.add('is-paused');
    } else if (flash && isPlaying) {
      tapIconEl.innerHTML = '<path d="M8 5.5v13l11-6.5z"/>';
      tapStateEl.classList.remove('is-paused');
      tapStateEl.classList.add('is-flash');
      tapFlashTimer = setTimeout(() => tapStateEl.classList.remove('is-flash'), 420);
    } else {
      tapStateEl.classList.remove('is-paused', 'is-flash');
    }
  }
}
syncPlayUi(false);

function togglePlay(fromUser = false) {
  if (!isPlaying && filmTime >= FILM_DURATION - 0.02) {
    filmTime = 0.0;
    if (film.video) film.seeked = false;
  }
  isPlaying = !isPlaying;
  if (isPlaying && film.video && film.ready) film.video.play().catch(() => {});
  syncPlayUi(fromUser);
}

function seekToSec(sec, shouldPlay = isPlaying) {
  filmTime = clamp(Number(sec) || 0, 0, FILM_DURATION);
  if (filmTime < FILM_DURATION - 0.2 && film.video) film.seeked = pxAtMovieTime(filmTime) > FILM_APPROACH.start + 60;
  isPlaying = !!shouldPlay && filmTime < FILM_DURATION - 0.02;
  if (isPlaying && film.video && film.ready) film.video.play().catch(() => {});
  syncPlayUi(false);
}

function replayFilm() {
  filmTime = 0.0;
  isPlaying = true;
  if (film.video && film.ready) {
    film.seeked = false;
    film.video.currentTime = 0;
    film.video.play().catch(() => {});
  }
  syncPlayUi();
}

if (btnPlayEl) btnPlayEl.addEventListener('click', togglePlay);
if (btnReplayEl) btnReplayEl.addEventListener('click', replayFilm);

const trajSelEl = document.getElementById('traj-sel');
if (trajSelEl) {
  for (const tr of TRAJECTORY_LIST) {
    const opt = document.createElement('option');
    opt.value = tr.id;
    opt.textContent = tr.shortLabel;
    if (tr.id === activeTrajId) opt.selected = true;
    trajSelEl.appendChild(opt);
  }
  trajSelEl.addEventListener('change', () => {
    activeTrajId = trajSelEl.value;
    document.body.classList.toggle('open-photo', OPEN === 'photo' && activeTrajId === 'T1' && HANG.id !== 'panels-4');
    replayFilm();
  });
}

// Ambient Amazonian soundscape (decoupled from film play/end state so it breathes continuously across the page)
const parentOwnsAudio = (() => {
  try { return window.parent !== window && !!window.parent.__iyuanaAudioOwned; } catch { return false; }
})();
const btnSoundEl = document.getElementById('btn-sound');
const soundSelEl = document.getElementById('sound-sel');
const visitorSoundEl = document.getElementById('visitor-sound');
const ambientAudio = (!MANUAL && qs.get('embed') !== '1' && qs.get('sound') !== '0' && !parentOwnsAudio)
  ? createIyuanaAudio({ initialTrack: qs.get('sound') || 'chant', initialEnabled: true })
  : null;

if (ambientAudio) {
  if (soundSelEl) {
    for (const t of IYUANA_TRACKS) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.label;
      if (t.id === ambientAudio.getState().trackId) opt.selected = true;
      soundSelEl.appendChild(opt);
    }
    soundSelEl.addEventListener('change', () => ambientAudio.setTrack(soundSelEl.value));
  }
  if (visitorSoundEl && document.body.classList.contains('clean')) {
    visitorSoundEl.hidden = false;
    visitorSoundEl.addEventListener('click', () => ambientAudio.toggle());
  }
  if (btnSoundEl) btnSoundEl.addEventListener('click', () => ambientAudio.toggle());
  ambientAudio.onStateChange((st) => {
    const lbl = st.muted ? '♪ Muted' : (st.waitingGesture ? '♪ Sound (Tap)' : '♪ Sound');
    if (btnSoundEl) {
      btnSoundEl.textContent = lbl;
      btnSoundEl.classList.toggle('active', !st.muted);
    }
    if (visitorSoundEl) {
      visitorSoundEl.textContent = lbl;
      visitorSoundEl.classList.toggle('active', !st.muted);
    }
    if (soundSelEl && soundSelEl.value !== st.trackId) soundSelEl.value = st.trackId;
  });
} else {
  if (btnSoundEl) btnSoundEl.style.display = 'none';
  if (soundSelEl) soundSelEl.style.display = 'none';
}

window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay(true);
  } else if (e.code === 'KeyR') {
    replayFilm();
  } else if (e.code === 'KeyM' && ambientAudio) {
    ambientAudio.toggle();
  }
});

// Click anywhere on the video stage (#gl) to pause or resume playback
let stageDown = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== undefined && e.button !== 0) return;
  stageDown = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', (e) => {
  if (!stageDown) return;
  const moved = Math.hypot(e.clientX - stageDown.x, e.clientY - stageDown.y);
  stageDown = null;
  if (moved < 7 && !MANUAL && qs.get('embed') !== '1') {
    togglePlay(true);
  }
});

function updateProgTip(e) {
  if (!progBarEl || !progTipEl) return;
  const rect = progBarEl.getBoundingClientRect();
  const u = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  progTipEl.textContent = fmtClock(u * FILM_DURATION);
  progTipEl.style.left = `${clamp(e.clientX - rect.left, 22, Math.max(22, rect.width - 22)).toFixed(1)}px`;
  return u;
}

function scrubFromEvent(e) {
  const rect = progBarEl.getBoundingClientRect();
  const u = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  updateProgTip(e);
  filmTime = u * FILM_DURATION;
  if (filmTime < FILM_DURATION - 0.2 && film.video) film.seeked = pxAtMovieTime(filmTime) > FILM_APPROACH.start + 60;
}

if (progBarEl) {
  progBarEl.addEventListener('pointerdown', (e) => {
    wasPlayingBeforeScrub = isPlaying || filmTime >= FILM_DURATION - 0.15;
    isScrubbing = true;
    isPlaying = false;
    syncPlayUi(false);
    try { progBarEl.setPointerCapture(e.pointerId); } catch {}
    scrubFromEvent(e);
  });
  progBarEl.addEventListener('pointermove', (e) => {
    updateProgTip(e);
    if (isScrubbing) scrubFromEvent(e);
  });
  const finishScrub = () => {
    if (!isScrubbing) return;
    isScrubbing = false;
    if (wasPlayingBeforeScrub && filmTime < FILM_DURATION - 0.04) {
      isPlaying = true;
      if (film.video && film.ready) film.video.play().catch(() => {});
    }
    syncPlayUi(false);
  };
  progBarEl.addEventListener('pointerup', finishScrub);
  progBarEl.addEventListener('pointercancel', finishScrub);
}

const prog = { x: pxAtMovieTime(filmTime), v: 0 };
let portrait = false;
function layoutAll() {
  portrait = innerWidth / innerHeight < 1;
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  buildStations(portrait);
  resizeTargets();
}
layoutAll();
let resizeT;
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(layoutAll, 80); });
// Keep the film smooth without sacrificing Retina sharpness (floor >= 1.5 on Retina screens)
const minSharpDpr = Math.min(window.devicePixelRatio || 1, 1.5);
import('/shared/film-pace.js').then(({ keepPace }) => keepPace({ renderer, min: minSharpDpr, apply: (s) => { DPR = Math.max(minSharpDpr, s); layoutAll(); } })).catch(() => {});

// ---------------------------------------------------------------- frame by frame
const walker = { phase: 0, last: new THREE.Vector3(), speed: 0, init: false };
let overtureT0 = null, prev = performance.now(), lastSay = '', labelCorner = false;
const T0 = performance.now();
const _off = new THREE.Vector3(), _eul = new THREE.Euler(0, 0, 0, 'YXZ'), _q2 = new THREE.Quaternion();
const dof = { focus: st.S0 ? st.S0.pos.distanceTo(st.S0.look) : 3, aperture: 0 };

function lampOn(lamp, now) {
  if (overtureT0 === null || isStaticHold() || MANUAL || isScrubbing || filmTime > 0.9) return 1;
  const i = lamps.indexOf(lamp);
  if (i === 0) return lerp(0.92, 1.0, clamp((now - overtureT0) / 220));
  const t = (now - overtureT0) / 1000 - (0.06 + i * 0.09);
  return t <= 0 ? 0.35 : lerp(0.35, 1.0, clamp(t / 0.38) ** 1.4);
}

// What the ending does at e (0..1 through it): which lights are on, how far the poster has come through, how wide
// the fire lens is open (0..1), and the film's halo.
const EMBER_HOT = new THREE.Color().setRGB(1.0, 0.6, 0.28, THREE.LinearSRGBColorSpace);
const EMBER_DEEP = new THREE.Color().setRGB(1.0, 0.34, 0.09, THREE.LinearSRGBColorSpace);
const E2 = (t) => t * t;
function endFx(e) {
  const f = { reveal: 0, boards: 1, wash: 0.045, projK: 1, projGain: 1, bounceK: 1, grow: 0, fire: 0, tint: 0, boost: 1.4, exposure: 1, blurAll: 0, label: ss(0.84, 0.98, e), halo: null };
  if (FIRE === '0' || FIRE === 'a') {
    const swapped = e > 0.555, grow = ss(0.0, 0.3, e);
    const k = e < 0.3 ? 1 : lerp(1, 0.022, easeIn(clamp((e - 0.3) / 0.17)));    // the circle closes to a point
    const tighten = ss(0.47, 0.49, e) * (1 - ss(0.49, 0.5, e));
    const flood = e < 0.5 ? 0 : easeIn(clamp((e - 0.5) / 0.06));                // then floods the room
    const recede = swapped ? easeOut(clamp((e - 0.585) / 0.28)) : 0;             // and gives the poster back
    Object.assign(f, { reveal: swapped ? 1 : 0, boards: swapped ? 0.22 : 1 - 0.55 * grow, wash: swapped ? 1 : 0.045, projK: k, grow,
      projGain: swapped ? 0 : (1 + 0.6 * grow) * Math.min(FIRE === 'a' ? 2.5 : 6, 1 / k), bounceK: swapped ? 0 : Math.min(1, k) });
    f.halo = { mode: 'v1', e, grow, k, tighten, flood, swapped, recede };
    if (FIRE === '0') f.blurAll = swapped ? (1 - recede) * 10 : 0;
    else {
      // a: the point burns instead of whitening; it opens as fire through a wide lens, and the poster's own
      // flame is the last thing the focus finds
      f.fire = e < 0.49 ? 0 : swapped ? 1 - easeOut(clamp((e - 0.6) / 0.3)) : ss(0.49, 0.55, e);
      f.tint = ss(0.3, 0.47, e);
      f.exposure = 1 + 0.3 * f.fire;
    }
    return f;
  }
  // b and c: the film's light swells, the lens lets go of it, under the deepest blur the film gives way to the
  // poster's fire in the same ring, and the focus comes back on the poster
  // order of the exchange: the poster arrives under the film's (warmed, dimmed) light, then the film goes out,
  // then the poster's own lamp comes up, so the frame never passes through a lit blank board
  // The film keeps its own colours (warming a blue sky only greys it); its light goes soft as the lens opens,
  // and the warmth arrives with the poster's fire.
  const B = FIRE === 'b';
  const x0 = B ? 0.3 : 0.34, x1 = B ? 0.4 : 0.44;
  const out = ss(x1 - 0.04, x1 + 0.04, e);
  Object.assign(f, { reveal: ss(x0, x1, e), boards: lerp(1, 0.22, ss(0.12, 0.36, e)), bounceK: 1 - out, grow: ss(0, 0.2, e) * (1 - ss(0.24, 0.36, e)) });
  f.wash = B ? lerp(0.045, 1, ss(x1 - 0.02, x1 + 0.12, e)) : lerp(0.045, 0.5, ss(x1 - 0.02, x1 + 0.1, e)) + 0.5 * ss(0.62, 0.9, e);
  const open = B ? E2(clamp((e - 0.14) / 0.22)) : IO(clamp((e - 0.14) / 0.26));
  f.projGain = (1 - 0.3 * ss(0.15, 0.36, e)) * (1 - out);
  const close = B ? easeOut(clamp((e - 0.6) / 0.3)) : IO(clamp((e - 0.62) / 0.3));
  f.fire = open * (1 - close);
  f.exposure = 1 + 0.12 * f.fire;
  f.halo = { mode: 'rim', grow: f.grow };
  f.label = ss(0.74, 0.96, e);
  return f;
}

function frame(now) {
  if (!MANUAL && document.hidden) return;
  const dt = Math.min(0.05, Math.max(0.0001, (now - prev) / 1000)); prev = now;
  const time = now / 1000;
  if (!MANUAL && overtureT0 !== null && isPlaying && !isScrubbing && !reduce) {
    filmTime += dt;
    if (filmTime >= FILM_DURATION) {
      filmTime = FILM_DURATION;
      isPlaying = false;
      syncPlayUi();
    }
  }
  const px = MANUAL ? manual.px : pxAtMovieTime(filmTime);
  prog.v = dt > 0 ? (px - prog.x) / dt : 0;
  prog.x = px;
  if (progFillEl) progFillEl.style.width = `${(clamp(filmTime / FILM_DURATION, 0, 1) * 100).toFixed(2)}%`;
  if (timeLblEl) timeLblEl.textContent = `${filmTime.toFixed(1)}s / ${FILM_DURATION.toFixed(1)}s`;
  const s = routeAt(px);
  if (!CAM && activeTrajId !== 'T1') {
    const uCanon = compiledSched.uAtTimeSec(filmTime);
    const { fov } = TRAJECTORIES[activeTrajId].sampleAtTime01(uCanon, _p0, _p1);
    route.pos.copy(_p0);
    route.look.copy(_p1);
    route.fov = portrait ? Math.min(64, fov * 1.4) : fov;
    route.q.setFromRotationMatrix(_mq.lookAt(route.pos, route.look, _v.set(0, 1, 0)));
  }
  if (CAM) { route.pos.set(CAM[0], CAM[1], CAM[2]); route.look.set(CAM[3], CAM[4], CAM[5]); route.fov = CAM[6] ?? 30; route.q.setFromRotationMatrix(_mq.lookAt(route.pos, route.look, _v.set(0, 1, 0))); route.stop = 1; }

  // ---- the ending, by place in the scroll
  const e = clamp((px - END.start) / END.px);
  const holdFrac = HOLD_SE ? clamp((px - HOLD_SE.start) / HOLD_SE.px) : 0;
  const back = clamp((px - BACK.start) / BACK.px);
  const tb = HOLD_SE && px < BACK.start ? 0.03 * holdFrac : (HOLD_SE ? 0.03 + 0.97 * BACK_EASE(back) : (PACE === 'old' ? WALK.p(back) : BACK_EASE(back)));
  const fx = endFx(e);
  const swapped = fx.reveal > 0.5;

  posterU.uReveal.value = fx.reveal;
  posterU.uTrueArt.value = ss(0.76, 0.96, e);
  posterMat.roughness = swapped ? 0.5 : 0.86; posterMat.clearcoat = swapped ? 0.42 : 0.0001;
  assignPool(route.pos.z);
  for (const p of POOL) p.lamp.scroll = fx.boards;
  posterWash.scroll = fx.wash;
  // as the walk pulls back, the poster's lamp opens into the room: its cone above, its pool on the floor, a palm each side
  const wy = lerp(3.7, 3.55, tb), wh = CEIL - wy;
  posterWash.base = lerp(34, 21, tb); posterWash.fillBase = posterWash.base * 0.045; posterWash.haze = lerp(0.6, 0.7, tb);
  posterWash.l.position.set(0, wy, END_Z + lerp(3.3, 2.3, tb));
  posterWash.l.target.position.set(0, posterBoard.center.y + lerp(0.08, -0.3, tb), posterBoard.center.z);
  posterWash.l.angle = lerp(0.38, 0.85, tb); posterWash.l.penumbra = lerp(0.78, 0.85, tb);
  posterWash.fill.position.set(0, 0.4, END_Z + lerp(1.2, 1.5, tb));

  for (const L of lamps) {
    const on = lampOn(L, now) * L.scroll * (L.weight ?? 1);
    L.l.intensity = L.base * on;
    L.l.color.copy(EMBER).lerp(WARM, clamp(on * 1.25) ** 0.6);
    if (L.fx) L.fx.lensMat.color.copy(L.l.color).multiplyScalar(9 * on);
    if (L.fill) { L.fill.intensity = L.fillBase * on; L.fill.color.copy(L.l.color); }
  }
  { const ov = lampOn(POOL[0].lamp, now) * fx.boards;
    for (const b of boards) {
      b.fixture.lensMat.color.copy(WARM).multiplyScalar(9 * ov * b.w);
      if (b.artLit) b.artLit.value = clamp(0.06 + 0.88 * ov * Math.pow(clamp(b.w, 0, 1), 0.72), 0.05, 0.96);
    } }
  posterU.uPosterLit.value = lerp(0.95, 0.98, tb);
  if (posterWash.fx && tb > 0) {
    const stem = posterWash.fx.g.children[0], head = posterWash.fx.g.children[1];
    posterWash.fx.g.position.copy(posterWash.l.position);
    stem.scale.y = wh / (CEIL - 3.7); stem.position.y = wh / 2;
    posterWash.fx.g.updateMatrixWorld(true); head.lookAt(posterWash.l.target.position);
    posterWash.fx.lensMat.color.multiplyScalar(lerp(1, 2.5 / 9, tb));
  } else if (posterWash.fx && posterWash.fx.g.position.y !== 3.7) {
    const stem = posterWash.fx.g.children[0], head = posterWash.fx.g.children[1];
    posterWash.fx.g.position.copy(posterWash.l.position);
    stem.scale.y = 1; stem.position.y = (CEIL - 3.7) / 2;
    posterWash.fx.g.updateMatrixWorld(true); head.lookAt(posterWash.l.target.position);
  }
  const projLamp = (isStaticHold() || MANUAL || isScrubbing || filmTime > 1.5) ? 1 : overtureT0 === null ? 0 : clamp(((now - overtureT0) / 1000 - 1.2) / 1.0);
  projector.l.angle = projector.angle * fx.projK;
  projector.l.color.setRGB(1, 1, 1).lerp(EMBER_HOT, fx.tint);
  projector.l.intensity = projector.base * projLamp * fx.projGain * (film.ready ? 1 : 0);
  const lum = film.avg.r * 0.3 + film.avg.g * 0.59 + film.avg.b * 0.11;
  bounce.color.copy(film.avg).multiplyScalar(1 / Math.max(0.02, lum));
  bounce.intensity = 9 * lum * projLamp * (1 + 2.5 * fx.grow) * fx.bounceK;
  if (FILM_AT === null && !MANUAL && film.ready && !film.seeked && px > FILM_APPROACH.start + 60) { film.seeked = true; film.video.currentTime = 6.9; }

  // boards breathe on their cables; the walker's passing air pushes them a little
  for (const sw of swingers) {
    const dz = sw.cz - route.pos.z, prox = Math.exp(-(dz * dz) / 6) / sw.mass, W0 = 1.8, Z = 0.25, on = reduce ? 0 : 1;
    const fxs = on * (-prog.v * prox * 0.0000014 + Math.sin(time * 0.52 + sw.ph) * 0.0014);
    const fz = on * (Math.abs(prog.v) * prox * 0.0000009 + Math.sin(time * 0.41 + sw.ph * 1.7) * 0.001);
    sw.vx += (-W0 * W0 * sw.ax - 2 * Z * W0 * sw.vx + fxs * W0 * W0) * dt; sw.ax += sw.vx * dt;
    sw.vz += (-W0 * W0 * sw.az - 2 * Z * W0 * sw.vz + fz * W0 * W0) * dt; sw.az += sw.vz * dt;
    sw.pivot.rotation.x = sw.ax; sw.pivot.rotation.z = sw.az;
  }
  // the fronds move in slow air: the leaf shadow turns and drifts a little
  for (const L of lamps) if (L.l.map && L.kind === 'board') {
    const a = Math.sin(time * 0.31 + L.l.position.z) * 0.05 + Math.sin(time * 0.83 + L.l.position.x * 3.0) * 0.015;
    L.l.shadow.camera.up.set(Math.sin(a), Math.cos(a), 0);
  }

  // ---- the walker: steps sway a little while moving, breath when standing
  const snapInit = !walker.init || isStaticHold() || isScrubbing;
  if (!walker.init) { walker.last.copy(route.pos); walker.init = true; }
  const moved = route.pos.distanceTo(walker.last); walker.last.copy(route.pos);
  walker.speed += ((dt > 0 ? moved / dt : 0) - walker.speed) * (1 - Math.exp(-dt * 5));
  walker.phase += moved / 0.74 * Math.PI;
  const gait = reduce ? 0 : clamp(walker.speed / 1.2) * 0.8, breath = reduce ? 0 : 1;
  camera.position.copy(route.pos);
  camera.quaternion.copy(route.q);
  _off.set(Math.sin(walker.phase) * 0.008 * gait, Math.cos(walker.phase * 2) * 0.005 * gait + Math.sin(time * 1.5) * 0.0022 * breath, 0).applyQuaternion(route.q);
  camera.position.add(_off);
  _eul.set(Math.sin(time * 0.61) * 0.0009 * breath, Math.sin(time * 0.37) * 0.0013 * breath, Math.sin(walker.phase) * 0.0018 * gait);
  camera.quaternion.multiply(_q2.setFromEuler(_eul));
  camera.fov = route.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();

  // ---- lens: focus on what we stand before; the stops get a little depth
  const focusTarget = camera.position.distanceTo(route.look);
  dof.focus = snapInit ? focusTarget : dof.focus + (focusTarget - dof.focus) * (1 - Math.exp(-dt * 9));
  const apTarget = route.stop * (swapped ? 0.6 : 1) * (reduce ? 0.5 : 1);
  dof.aperture = snapInit ? apTarget : dof.aperture + (apTarget - dof.aperture) * (1 - Math.exp(-dt * 5));
  const resScale = size.y / 900;
  const blurAll = fx.blurAll;

  // ---- type: centered poster title lockup, 3D panel captions (Panels 1-4), and Main Poster credits
  renderIntroLockup(filmTime, isStaticHold());
  const [h0, h1] = PACE === 'old' ? [800, 1300] : [720, 1080];
  head.style.opacity = (ss(h0, h1, px) * (1 - ss(END.start + END.px * 0.2, END.start + END.px * 0.35, px))).toFixed(3);

  if (stopLineEl && stopLineP) {
    let activeQuote = '', qOp = 0, qBoardIdx = -1;
    for (let bi = 0; bi < Math.min(boards.length, STATION_DEFS.length); bi++) {
      const def = STATION_DEFS[bi];
      const stCfg = compiledSched.sched.stops?.[def.id];
      const txt = stCfg?.quote?.trim();
      if (!txt) continue;
      // Fade in while moving into the panel (close to arrival) and stay slightly on while moving out (close to departure)
      const op = ss(stCfg.arrive - 0.75, stCfg.arrive - 0.05, filmTime) * (1 - ss(stCfg.leave + 0.05, stCfg.leave + 0.80, filmTime));
      if (op > qOp) { qOp = op; activeQuote = txt; qBoardIdx = bi; }
    }
    stopLineEl.style.opacity = qOp.toFixed(3);
    if (qOp > 0.002 && qBoardIdx >= 0) {
      if (stopLineP.textContent !== activeQuote || activeStopWashIdx !== qBoardIdx) {
        stopLineP.textContent = activeQuote;
        applyStopWashAndTightWrap(qBoardIdx);
      }
      const rackBlur = (1 - qOp) * 3.0;
      stopLineEl.style.filter = rackBlur > 0.08 ? `blur(${rackBlur.toFixed(2)}px)` : 'none';
      if (portrait) {
        stopLineEl.style.left = '';
        stopLineEl.style.right = '';
        stopLineEl.style.top = '';
        stopLineEl.style.bottom = '';
        stopLineEl.style.transform = `translate3d(-50%, ${((1 - qOp) * 10).toFixed(1)}px, 0)`;
      } else {
        const b = boards[qBoardIdx];
        _p0.copy(b.center).addScaledVector(b.xAxis, -b.side * (b.L.W / 2 + 0.52));
        _p0.y = b.center.y - 0.02;
        const sc = toScreen(_p0);
        _p1.copy(b.center).addScaledVector(b.xAxis, -b.side * (b.L.W / 2 + 0.06));
        _p1.y = b.center.y - 0.02;
        const edgeSc = toScreen(_p1);
        const w = stopLineEl.offsetWidth || Math.min(innerWidth * 0.25, 326);
        const halfW = w * 0.5;
        const screenMinCx = 36 + halfW;
        const screenMaxCx = Math.max(screenMinCx, innerWidth - 36 - halfW);
        let cx = sc.x;
        if (b.side < 0) {
          const minCx = Math.min(screenMaxCx, edgeSc.x + 28 + halfW);
          cx = clamp(cx, minCx, screenMaxCx);
        } else {
          const maxCx = Math.max(screenMinCx, edgeSc.x - 28 - halfW);
          cx = clamp(cx, screenMinCx, maxCx);
        }
        const cy = clamp(sc.y, 120, innerHeight - 120);
        _eul.setFromQuaternion(camera.quaternion, 'YXZ');
        const relDeg = clamp(((b.yaw - _eul.y) * 180) / Math.PI, -22, 22);
        stopLineEl.style.left = `${cx.toFixed(1)}px`;
        stopLineEl.style.top = `${cy.toFixed(1)}px`;
        stopLineEl.style.right = 'auto';
        stopLineEl.style.bottom = 'auto';
        stopLineEl.style.transform = `translate3d(-50%, calc(-50% + ${((1 - qOp) * 10).toFixed(1)}px), 0) perspective(1000px) rotateY(${relDeg.toFixed(1)}deg)`;
      }
    }
  }

  // Main Poster curatorial credits (Vanessa Espín + 4 roles): fades in close to arrival at closer poster view (st.SE) and fades away when zooming out
  const labelOut = 1 - ss(0.02, 0.44, back);
  const labelO = fx.label * labelOut;
  label.style.opacity = labelO.toFixed(3);
  if (labelO > 0.001) {
    const lblBlur = (1 - labelO) * 3.0;
    label.style.filter = lblBlur > 0.08 ? `blur(${lblBlur.toFixed(2)}px)` : 'none';
    if (portrait) {
      label.style.left = '';
      label.style.right = '';
      label.style.top = '';
      label.style.bottom = '';
      label.style.transform = `translate3d(-50%, ${((1 - labelO) * 10).toFixed(1)}px, 0)`;
    } else {
      const anchor = toScreen(_v.set(PB.w / 2 + 0.26, posterBoard.center.y + 0.02, PB.z));
      const edge = toScreen(_t.set(PB.w / 2 + 0.04, posterBoard.center.y, PB.z));
      const lw = label.offsetWidth || Math.min(innerWidth * 0.24, 290);
      const screenMaxX = Math.max(28, innerWidth - lw - 36);
      const minX = Math.min(screenMaxX, Math.round(edge.x + 26));
      const lx = clamp(Math.round(anchor.x), minX, screenMaxX);
      const ly = clamp(Math.round(anchor.y), 120, innerHeight - 140);
      _eul.setFromQuaternion(camera.quaternion, 'YXZ');
      const relPosterDeg = clamp((-_eul.y * 180) / Math.PI, -18, 18);
      label.style.left = `${lx}px`;
      label.style.top = `${ly}px`;
      label.style.right = 'auto';
      label.style.bottom = 'auto';
      label.style.transform = `translate3d(${((1 - labelO) * 10).toFixed(1)}px, -50%, 0) perspective(1000px) rotateY(${relPosterDeg.toFixed(1)}deg)`;
    }
  }
  const say = s.walk ? (Math.abs(route.s - Math.round(route.s)) < 0.3 ? SAY[Math.round(route.s)] : '') : s.say;
  if (say && say !== lastSay) { lastSay = say; live.textContent = say; }

  // ---- render: shadows + mirror, scene, air, lens, bloom, composite
  renderer.shadowMap.needsUpdate = true;
  updateMirror();
  floor.visible = false;
  renderer.setRenderTarget(reflRT); renderer.render(scene, mirrorCam);
  floor.visible = true;
  renderer.shadowMap.needsUpdate = false;
  renderer.setRenderTarget(sceneRT); renderer.render(scene, camera);

  // air
  const au = airMat.uniforms, airLamps = [...lamps, { l: projector.l, haze: 0.5, proj: true }];
  au.tDepth.value = sceneRT.depthTexture; au.uInvProj.value.copy(camera.projectionMatrixInverse); au.uCamWorld.value.copy(camera.matrixWorld);
  au.uCamPos.value.copy(camera.position); au.uTime.value = time;
  airLamps.slice(0, NL).forEach((L, i) => {
    const l = L.l; l.updateMatrixWorld();
    au.uLPos.value[i].copy(l.position);
    au.uLDir.value[i].copy(l.target.position).sub(l.position).normalize();
    au.uLCos.value[i].set(Math.cos(l.angle), Math.cos(l.angle * (1 - l.penumbra)));
    au.uLCol.value[i].set(l.color.r, l.color.g, l.color.b).multiplyScalar(l.intensity * L.haze);
    au.uLMat.value[i].copy(l.shadow.matrix);
    au[`tG${i}`].value = l.map ?? WHITE;
    au[`tS${i}`].value = l.shadow.map?.depthTexture ?? FAR;
  });
  pass(airMat, airRT);
  // lens
  downMat.uniforms.uPre.value = 0; downMat.uniforms.tSrc.value = sceneRT.texture; downMat.uniforms.uTexel.value.set(0.5 / sceneRT.width, 0.5 / sceneRT.height);
  pass(downMat, halfRT);
  for (const U of [dofMat.uniforms, compMat.uniforms]) {
    U.uFocus.value = dof.focus; U.uAperture.value = 4.2 * dof.aperture * resScale * 0.5; U.uBlurAll.value = blurAll * resScale; U.uMaxCoc.value = Math.max(6, blurAll * resScale + 2);
    U.uNear.value = camera.near; U.uFar.value = camera.far;
  }
  dofMat.uniforms.tSrc.value = halfRT.texture; dofMat.uniforms.tDepth.value = sceneRT.depthTexture;
  pass(dofMat, dofRT);
  // the fire lens
  if (fx.fire > 0.001) {
    downMat.uniforms.uPre.value = 0; downMat.uniforms.tSrc.value = halfRT.texture; downMat.uniforms.uTexel.value.set(0.5 / halfRT.width, 0.5 / halfRT.height);
    pass(downMat, qRT);
    const fu = fireMat.uniforms;
    fu.tSrc.value = qRT.texture; fu.uPx.value.set(1 / fireRT.width, 1 / fireRT.height);
    fu.uR.value = fx.fire * FIRE_R * fireRT.height; fu.uBoost.value = fx.boost;
    pass(fireMat, fireRT);
  }
  // bloom
  downMat.uniforms.uPre.value = 1; downMat.uniforms.tSrc.value = sceneRT.texture; downMat.uniforms.uTexel.value.set(1 / sceneRT.width, 1 / sceneRT.height);
  pass(downMat, down[0]);
  downMat.uniforms.uPre.value = 0;
  for (let i = 1; i < BLOOM_LEVELS; i++) { downMat.uniforms.tSrc.value = down[i - 1].texture; downMat.uniforms.uTexel.value.set(1 / down[i - 1].width, 1 / down[i - 1].height); pass(downMat, down[i]); }
  for (let i = BLOOM_LEVELS - 2; i >= 0; i--) {
    const low = i === BLOOM_LEVELS - 2 ? down[BLOOM_LEVELS - 1] : up[i + 1];
    upMat.uniforms.tLow.value = low.texture; upMat.uniforms.tHigh.value = down[i].texture; upMat.uniforms.uTexel.value.set(1 / low.width, 1 / low.height);
    pass(upMat, up[i]);
  }
  // the film's light in the lens: halo, point, flood
  const cu = compMat.uniforms;
  const ringS = toScreen(posterBoard.ring), edgeS = toScreen(_v.copy(posterBoard.ring).add(_t.set(posterBoard.ringR, 0, 0)));
  const cR = Math.max(4, Math.abs(edgeS.x - ringS.x)) * DPR;
  const diag = Math.hypot(size.x, size.y);
  // grow: the rim widens around the playing film; close: rim and disc tighten to a burning point;
  // flood: the point opens over the whole frame; then the white recedes from the poster
  const filmTint = film.avg.clone().multiplyScalar(1.6 / Math.max(0.05, lum * 1.6 + 0.2));
  const H = fx.halo, grow = fx.grow;
  let hR = cR * 0.97, hWd = cR * lerp(0.05, 0.75, grow), amt = lerp(0.0, 0.55, grow), inner = 0.12 * grow;
  cu.uHaloCol.value.copy(FLASH).lerp(filmTint, 0.45);
  if (H.mode === 'v1') {
    const { k, tighten, flood, recede } = H, A_ = FIRE === 'a';
    if (e >= 0.3 && e < 0.5) { const c2 = ss(0.3, 0.47, e); hR = Math.max(2 * DPR, cR * 0.97 * k) * (1 - 0.2 * tighten); hWd = Math.max(5 * DPR, cR * 0.75 * k + 4 * DPR); amt = lerp(0.55, 2.4, c2); inner = lerp(0.12, 1.2, c2); }
    if (e >= 0.5) {
      if (A_) { hR = lerp(3 * DPR, diag * 0.07, flood); hWd = lerp(6 * DPR, diag * 0.1, flood); amt = lerp(2.4, 0.8, flood); inner = 1; }
      else { hR = lerp(3 * DPR, diag * 1.2, flood); hWd = lerp(6 * DPR, diag * 0.5, flood); amt = lerp(2.4, 30, flood); inner = 1; }
    }
    if (H.swapped) {
      if (A_) { hR = diag * 0.07 * (1 - recede); hWd = diag * 0.1; amt = 0.8 * (1 - recede) ** 2; inner = 1; }
      else { hR = diag * 1.6; hWd = diag; amt = 30 * (1 - recede) ** 3; inner = 1; }
    }
    if (A_) {
      // the closing point burns hot, and what floods the room is ember, not white
      const c2 = ss(0.3, 0.47, e), fl = e >= 0.5 ? 1 : 0;
      cu.uHaloCol.value.copy(FLASH).lerp(filmTint, 0.45 * (1 - c2)).lerp(EMBER_HOT, c2 * (1 - fl)).lerp(EMBER_DEEP, fl);
    } else cu.uHaloCol.value.copy(FLASH).lerp(filmTint, H.swapped || e > 0.5 ? 0.1 : 0.45);
  }
  if (H.mode === 'rim') { cu.uHaloCol.value.lerp(EMBER_HOT, fx.tint); amt = lerp(0.0, 0.3, grow); }
  if (s.end !== true) amt = 0;
  cu.uHalo.value.set(ringS.x / innerWidth, 1 - ringS.y / innerHeight, hR, hWd); cu.uHaloAmt.value = amt; cu.uHaloIn.value = inner;
  cu.tFire.value = fireRT.texture; cu.uFire.value = ss(0, 0.05, fx.fire); cu.uExposure.value = fx.exposure;
  cu.tScene.value = sceneRT.texture; cu.tDof.value = dofRT.texture; cu.tDepth.value = sceneRT.depthTexture; cu.tBloom.value = up[0].texture; cu.tAir.value = airRT.texture;
  cu.uTime.value = time; cu.uDofScale.value = 2.0;
  cu.uFade.value = (isStaticHold() || MANUAL || isScrubbing) ? 1 : overtureT0 === null ? 0 : clamp((now - overtureT0) / 380);
  pass(compMat, null);
  if (!MANUAL) requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- go
const manual = { px: 0, now: 0, filmT: 0 };
// motion per scroll px along the whole route (for the pacing check): screen-angle the view sweeps per 100 px
function measure(step = 10) {
  const out = [], pPos = new THREE.Vector3(), pQ = new THREE.Quaternion(); let first = true;
  for (let px = 0; px < TOTAL; px += step) {
    routeAt(px);
    const dist = Math.max(0.5, route.pos.distanceTo(route.look));
    const m = first ? 0 : (route.pos.distanceTo(pPos) / dist + pQ.angleTo(route.q)) * (100 / step);
    out.push(+m.toFixed(5)); pPos.copy(route.pos); pQ.copy(route.q); first = false;
  }
  return { step, TOTAL, END: END.start, BACK: BACK.start, motion: out };
}
window.__aisle = { TOTAL, TL, BACK, END, PACE, FIRE, HANG: HANG.id, NB, boards, posterBoard, PB, pxAtS, get px() { return prog.x; }, get filmTime() { return filmTime; }, get duration() { return FILM_DURATION; }, get isPlaying() { return isPlaying; }, stations: st, camera, routeAt, measure, togglePlay: () => togglePlay(true), seekToSec, replayFilm,
  setSchedule(newSched) {
    compiledSched = compileSchedule(newSched);
    FILM_DURATION = compiledSched.totalSec;
    filmTime = clamp(filmTime, 0, FILM_DURATION);
  },
  setState({ tSec, playing, trajId, sched } = {}) {
    if (sched) {
      compiledSched = compileSchedule(sched);
      FILM_DURATION = compiledSched.totalSec;
    }
    if (trajId && TRAJECTORIES[trajId] && trajId !== activeTrajId) {
      activeTrajId = trajId;
      if (trajSelEl) trajSelEl.value = trajId;
      document.body.classList.toggle('open-photo', OPEN === 'photo' && activeTrajId === 'T1' && HANG.id !== 'panels-4');
    }
    if (typeof playing === 'boolean') {
      isPlaying = playing;
      syncPlayUi();
    }
    if (typeof tSec === 'number') {
      isScrubbing = !isPlaying;
      filmTime = clamp(tSec, 0, FILM_DURATION);
    }
  },
  async tick(px, dtMs = 1000 / 30, snap = false) {
    manual.px = px; manual.now += dtMs;
    if (snap) { prog.x = px; prog.v = 0; }
    const v = film.video;
    if (v && film.ready && FILM_AT === null) {
      if (!film.seeked && px > FILM_APPROACH.start + 60) { film.seeked = true; manual.filmT = 6.9; } else manual.filmT += dtMs / 1000;
      v.currentTime = manual.filmT % (v.duration || 60);
      await new Promise((r) => { v.addEventListener('seeked', r, { once: true }); setTimeout(r, 1500); });
      drawFilm();
    }
    frame(manual.now);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { x: prog.x };
  } };
window.addEventListener('message', (ev) => {
  if (ev.data?.type === 'iyuana-lab-sync' && window.__aisle?.setState) {
    window.__aisle.setState(ev.data);
  }
});
renderIntroLockup(filmTime, isStaticHold());
(async () => {
  plantsModelled();
  const gobosP = palmGobos().catch(() => null);
  const filmP = loadFilm().catch((e) => console.warn('film', e));
  const fontsP = Promise.all(['500 40px Switzer', '400 40px Switzer', '400 40px Gambetta'].map((f) => document.fonts.load(f))).catch(() => null);
  await Promise.all(loads.map((p) => p.catch(() => null)));
  await Promise.race([fontsP, new Promise((r) => setTimeout(r, 450))]);
  for (const c of labelCards) { c.labelMat.map = labelTexture(c.def.label); c.labelMat.needsUpdate = true; }
  const gobos = await gobosP;
  if (gobos) { boards.forEach((b) => { b.goboTex = gobos[b.gobo % gobos.length]; }); POOL.forEach((p) => { p.lamp.l.map = gobos[0]; }); }
  window.__aisle.gobos = gobos;
  if (MANUAL) await filmP;
  renderer.compile(scene, camera);
  // Before the film starts: send every picture to the graphics card and build the fire lens's shader, so that neither
  // lands mid-film as a hitch (photographs used to be sent the first time their board came into view).
  try { const { sendPictures } = await import('/shared/film-warm.js'); sendPictures(renderer, scene); } catch {}
  if (new URLSearchParams(location.search).get('warm') !== 'off') {
    downMat.uniforms.uPre.value = 0; downMat.uniforms.tSrc.value = halfRT.texture; pass(downMat, qRT);
    fireMat.uniforms.tSrc.value = qRT.texture; pass(fireMat, fireRT);
    renderer.setRenderTarget(null);
  }
  overtureT0 = performance.now(); prev = overtureT0;
  if (MANUAL) { manual.now = overtureT0 + 4000; prev = manual.now - 33; window.__aisle.ready = true; }
  else {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && overtureT0 !== null) { prev = performance.now(); requestAnimationFrame(frame); }
    });
    requestAnimationFrame(frame);
  }
})();
