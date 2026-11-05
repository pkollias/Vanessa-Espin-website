/* The line where one ground meets the next.

   edgeHTML(kind, colour, seed)  the markup for one edge, placed at the top of the ground that is rising (its parent is that
                                 ground, positioned). kind: 'bubble' | 'flat' | 'fade'. colour: any CSS colour, the ground's.
   edgeEnter(el)                 el is that element, once it is in the page. What it returns goes to the other two.
   edgeDraw(e, p, speed)         every frame while it is on screen. p: 0 to 1, how far the ground has risen; speed: the
                                 scroll's speed in px per second (the edge also reads it from p, so it may be left out).
   edgeLeave(e)                  when the page is left.

   'flat' is the ground's own straight top. 'fade' is a gradient over a third of a screen, in edge.css. 'bubble' is Daddy
   Yankee's seam, ported from its source, with its numbers (the `jagged` type of its transition module): a threshold over a
   moving field. Two sheets of round cells slide across each other, and only where a cell of one meets a cell of the other is
   the field high enough to show. So a blob swells out of the front, pinches off, hangs, and is taken back, with no particles
   and nothing to keep track of. A fine fractal grain roughens the outline like ink on paper. The field is tied to the scroll
   (TRAVEL), so the hand drives it: the front climbs through it, and a fast scroll swells the middle and lets more loose
   (SWELL, LOOSE). When the scroll stops those ease out on the reference's own smoothing, and only a slow breath is left
   (REST, about a third of the reference's). It redraws at 24 fps, as the reference does, and at 12 once it is calm.

   The silhouette stands on the ground's top inside the element, which is .62 of a unit tall (unit: the screen's height, or
   its width if that is less). Near p = 0 it is squashed down onto that top, so nothing shows before the ground does.
   The front stands BASE above that top, so the ground looks full about .17 of a unit before p reaches 1.
   No WebGL2, or reduced motion: it becomes 'flat'. A lost context shows the same flat top. */

const FPS = 24, DPR = 1.5, DPR_TOUCH = 1.25;
const CATCH = 0.08;                                  // smoothing per 60 Hz frame
const REACH = 0.62;                                  // the element's height, in units: edge.css has the same sum
const BASE = 0.17;                                   // the front's height above the ground's top, in units
const RAMP = 0.1;                                    // p by which the silhouette has reached full height
const TRAVEL = 1.65;                                 // how far the front climbs through the field
const SWELL = 0.2, SWELL_MAX = 0.12;                 // the middle swells by speed (screens per second) x SWELL
const BOIL = 0.3, REST = 0.35, HARD = 4;             // the field's clock: at rest BOIL x REST, flat out BOIL x (REST + HARD)
const PAN = 30, PAN_HARD = 0.65;                     // the hills' sideways drift, px per second: PAN x REST at rest, PAN x (REST + PAN_HARD) flat out
const LOOSE = 0.05;                                  // how much lower the bar for a droplet is at full speed
const DRIFT = -0.05;                                 // the field's sideways slide
const LAYERS = [[1.42, 0, 0.025, 0.37, 0.61], [1.89, -0.025, 0, 0.53, 0.29], [1.89, -0.013, 0.013, 0.71, 0.43]]; // scale, pace x y, phase x y

const VERT = `#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

// Once per edge: the reference's two noise maps, drawn on the GPU rather than built in JS. R: round cells on an 8 x 8 grid. G: eight octaves of value noise.
const BAKE = `#version 300 es
precision highp float; precision highp int;
out vec4 colour;
float rnd(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return float(v.x >> 8u) / 16777216.0;
}
float cells(vec2 uv) {
  vec2 g = uv * 8.0, i = floor(g);
  float best = 1e9;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 c = i + vec2(x, y);
    uvec2 w = uvec2(mod(c, 8.0));
    vec2 f = c + 0.1 + 0.8 * vec2(rnd(uvec3(w, 1u)), rnd(uvec3(w, 2u)));
    vec2 d = f - g;
    best = min(best, dot(d, d));
  }
  float r = sqrt(best);
  return pow(max(0.0, 1.0 - 0.8746356 * r * r * r), 4.0);
}
float value(vec2 uv, float n, uint o) {
  vec2 g = uv * n, i = floor(g), f = g - i;
  f = f * f * (3.0 - 2.0 * f);
  uvec2 a = uvec2(mod(i, n)), b = uvec2(mod(i + 1.0, n));
  return mix(mix(rnd(uvec3(a.x, a.y, o)), rnd(uvec3(b.x, a.y, o)), f.x),
             mix(rnd(uvec3(a.x, b.y, o)), rnd(uvec3(b.x, b.y, o)), f.x), f.y);
}
float grain(vec2 uv) {
  float w = 0.0, amp = 1.0, sum = 0.0, n = 4.0;
  for (uint o = 0u; o < 8u; o++) { w += amp * value(uv, n, o + 10u); sum += amp; amp *= 0.7; n *= 2.0; }
  return clamp(0.5 + min((w / sum - 0.5) / 0.0951, 2.64) / 8.0, 0.0, 1.0);
}
void main() { vec2 uv = gl_FragCoord.xy / 512.0; colour = vec4(cells(uv), grain(uv), 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uMaps;
uniform vec3 uColour;
uniform vec3 uLayer[3];
uniform vec2 uRes;      // the element, css px
uniform float uDpr, uUnit, uBase, uRamp, uS, uLift, uBulge, uPan, uSpacing, uSeed, uLoose;
out vec4 colour;

const float EDGE = 0.048, CELLS = 0.359, MOUND = 0.226, GRAIN = 0.312, DOTS = 0.226, HUG = 0.205, SIDES = 0.144, PEAKS = 0.1;

float hash(float n) { return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453); }

float peaks(float x) {
  float v = 0.0;
  for (int o = 0; o < 2; o++) {
    float size = o == 0 ? 2.6 : 1.0, amp = o == 0 ? 0.65 : 0.35, off = float(o) * 50.0;
    float f = (x - uPan) / (uSpacing * size), i = floor(f), t = fract(f);
    v += amp * (mix(hash(i + off), hash(i + off + 1.0), t) * 2.0 - 1.0);
  }
  return v;
}

float dome(vec2 d) {
  float t = clamp((0.68 - length(d)) / 0.498, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  return t * t * t;
}

void main() {
  vec2 px = gl_FragCoord.xy / uDpr;
  float y = px.y / uUnit;
  float top = uRes.y / uUnit;
  float across = px.x / uRes.x - 0.5;
  float lead = across / 0.22;
  float seam = y / uRamp - uBase;
  float h = seam - PEAKS * peaks(px.x) - uBulge * exp(-lead * lead);
  colour = vec4(uColour, 1.0);
  if (h < -0.159) return;

  float x = (px.x - 0.5 * uRes.x) / uUnit;
  vec2 p = vec2(x, seam - uLift);  // the field keeps still as the hills go by, and the front climbs through it
  float band = 1.0 - smoothstep(-EDGE, EDGE, h);
  float mound = dome(vec2(x, h));
  float front = band + MOUND * mound - HUG * smoothstep(0.048, 0.254, h)
    - (1.0 - band) * (DOTS - uLoose + SIDES * smoothstep(0.12, 0.45, abs(across)));

  float cells = texture(uMaps, p * uLayer[0].z + uLayer[0].xy).r * texture(uMaps, p * uLayer[1].z + uLayer[1].xy).r;
  float grain = texture(uMaps, p * uLayer[2].z + uLayer[2].xy).g - 0.5;
  float fill = -0.261 + front + CELLS * cells - GRAIN * grain - smoothstep(0.84, 1.0, y / top); // nothing reaches the canvas's top

  float moment = smoothstep(-0.793, 0.476, h);
  if (fill < 0.0 || sqrt(fill) < 1.013 * abs(uS - moment)) colour = vec4(0.0);
}`;

const UNIFORMS = ['uMaps', 'uColour', 'uLayer', 'uRes', 'uDpr', 'uUnit', 'uBase', 'uRamp', 'uS', 'uLift', 'uBulge', 'uPan', 'uSpacing', 'uSeed', 'uLoose'];

const FADE = Array.from({ length: 33 }, (_, i) => `scaleY(${(i / 32).toFixed(4)})`); // strings made once, so the fade allocates nothing while it rises

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth01 = (v) => { const t = clamp01(v); return t * t * (3 - 2 * t); };

function program(gl, frag) {
  const pr = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, frag]]) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(pr, s); gl.deleteShader(s);
  }
  gl.linkProgram(pr);
  return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : null;
}

// the colour as the page paints it, whatever way it was written, read through a 2D canvas
function rgbOf(el) {
  const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  c.canvas.width = c.canvas.height = 1;
  c.fillStyle = getComputedStyle(el).color;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

function bake(gl) {
  const pr = program(gl, BAKE), tex = gl.createTexture();
  if (!pr) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, 512, 512, 0, gl.RG, gl.UNSIGNED_BYTE, null);
  for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, 512, 512);
  gl.useProgram(pr);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fb); gl.deleteProgram(pr);
  return tex;
}

function flatten(e) {
  e.kind = 'flat';
  e.el.classList.remove('ch-edge--bubble');
  e.el.classList.add('ch-edge--flat');
  drop(e);
}

function drop(e) {
  if (e.io) e.io.disconnect();
  if (e.ro) e.ro.disconnect();
  e.io = e.ro = null;
  if (e.idle) { if (window.cancelIdleCallback) cancelIdleCallback(e.idle); else clearTimeout(e.idle); }
  e.idle = 0;
  if (!e.canvas) return;
  e.canvas.removeEventListener('webglcontextlost', e.onLost);
  e.canvas.removeEventListener('webglcontextrestored', e.onBack);
  if (e.gl && !e.gl.isContextLost()) e.gl.getExtension('WEBGL_lose_context')?.loseContext();
  e.canvas.remove();
  e.canvas = e.gl = e.u = null;
}

function boot(e) {
  const gl = e.gl = e.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return flatten(e);
  const pr = program(gl, FRAG), maps = pr && bake(gl);
  if (!maps) return flatten(e);
  gl.useProgram(pr);
  e.u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(pr, n)]));
  gl.bindVertexArray(gl.createVertexArray());
  gl.uniform1i(e.u.uMaps, 0);
  gl.uniform3fv(e.u.uColour, rgbOf(e.el));
  gl.uniform1f(e.u.uSeed, e.seed);
  gl.uniform1f(e.u.uBase, BASE);
  gl.clearColor(0, 0, 0, 0);
  e.sized = false;
  e.frame = -1;
}

function size(e) {
  const { canvas, gl, u } = e, w = e.el.clientWidth, h = e.el.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, e.coarse ? DPR_TOUCH : DPR);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(u.uRes, w, h);
  gl.uniform1f(u.uDpr, canvas.width / Math.max(w, 1));
  gl.uniform1f(u.uUnit, e.unit = h / REACH);
  gl.uniform1f(u.uSpacing, Math.max(w, 900) / 16);
  e.sized = true;
  e.frame = -1;
}

export function edgeHTML(kind, colour, seed = 1) { return `<div class="ch-edge ch-edge--${kind}" style="--edge:${colour}" data-seed="${seed}" aria-hidden="true"></div>`; }

export function edgeEnter(el) {
  const kind = ['bubble', 'flat', 'fade'].find((k) => el.classList.contains(`ch-edge--${k}`)) || 'flat';
  const e = {
    el, kind, seed: (+el.dataset.seed || 1) * 0.73, coarse: matchMedia('(pointer: coarse)').matches, on: true, sized: false,
    canvas: null, gl: null, u: null, io: null, ro: null, idle: 0, onLost: null, onBack: null, layer: new Float32Array(9),
    p: -1, s: 0, seen: false, last: 0, unit: 1, frame: -1, agit: 0, bulge: 0, clock: 0, pan: 0, ramp: -1, drawn: 0,
  };
  if (kind !== 'bubble') return e;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || typeof WebGL2RenderingContext === 'undefined') { flatten(e); return e; }
  e.canvas = document.createElement('canvas');
  el.append(e.canvas);
  e.onLost = (ev) => { ev.preventDefault(); e.u = null; };
  e.onBack = () => boot(e);
  e.canvas.addEventListener('webglcontextlost', e.onLost);
  e.canvas.addEventListener('webglcontextrestored', e.onBack);
  e.io = new IntersectionObserver((list) => { e.on = list[list.length - 1].isIntersecting; });
  e.io.observe(el);
  e.ro = new ResizeObserver(() => { e.sized = false; });
  e.ro.observe(el);
  // compiled before it is needed where the browser allows, so that the first frame on screen is not the one that pays
  const early = () => { e.idle = 0; if (e.canvas && !e.gl) boot(e); };
  e.idle = window.requestIdleCallback ? requestIdleCallback(early, { timeout: 300 }) : setTimeout(early, 300);
  return e;
}

export function edgeDraw(e, p, speed = 0) {
  if (!e) return;
  if (e.kind === 'fade') {
    const r = Math.round(smooth01(p / RAMP) * 32);
    if (r !== e.ramp) { e.ramp = r; e.el.style.transform = FADE[r]; }
    return;
  }
  if (e.kind !== 'bubble' || !e.canvas) return;

  const now = performance.now(), dt = e.last ? Math.min(now - e.last, 100) / 1000 : 1 / 60;
  e.last = now;
  const k = 1 - Math.pow(1 - CATCH, dt * 60);

  // motion, in screens per second: what p itself did, or the speed passed in, whichever says more
  const dp = e.seen ? p - e.p : 0;
  const fromP = dp / dt, fromSpeed = Math.abs(speed) / innerHeight;
  const q = Math.abs(fromP) >= fromSpeed ? fromP : fromSpeed * Math.sign(fromP || 1);
  if (!e.seen) { e.s = p; e.seen = true; }
  e.p = p;
  e.s += (p - e.s) * k;
  if (Math.abs(p - e.s) < 0.0005) e.s = p;
  e.bulge += (Math.max(-SWELL_MAX, Math.min(SWELL_MAX, q * SWELL)) - e.bulge) * k;
  if (Math.abs(e.bulge) < 0.0005) e.bulge = 0;
  e.agit += (clamp01(Math.abs(q) / 1.2) - e.agit) * k;
  if (e.agit < 0.002) e.agit = 0;
  e.clock += dt * BOIL * (REST + HARD * e.agit);
  e.pan += dt * PAN * (REST + PAN_HARD * e.agit);

  if (!e.on || p >= 1) return;
  if (!e.gl) boot(e);
  if (!e.u) return;
  if (!e.sized) size(e);
  const frame = Math.floor(now / 1000 * (e.agit ? FPS : FPS / 2));
  if (frame === e.frame) return;
  e.frame = frame;

  // the reference's scroll position when its front stood this high on the screen: its travel, solved for the height
  const r = (Math.sqrt(1 + 4 * TRAVEL * (1 - e.s)) - 1) / (2 * TRAVEL);
  const { gl, u, layer } = e, ramp = Math.max(0.02, smooth01(p / RAMP));
  const shift = DRIFT * e.unit / Math.max(e.el.clientWidth, 1);
  for (let i = 0; i < 3; i++) {
    const L = LAYERS[i], x = L[3] * e.seed + L[0] * (L[1] + shift) * e.clock, y = L[4] * e.seed + L[0] * L[2] * e.clock;
    layer[i * 3] = x - Math.floor(x);
    layer[i * 3 + 1] = y - Math.floor(y);
    layer[i * 3 + 2] = L[0];
  }
  gl.uniform3fv(u.uLayer, layer);
  gl.uniform1f(u.uRamp, ramp);
  gl.uniform1f(u.uS, 1 - r);
  gl.uniform1f(u.uLift, TRAVEL * r * r);
  gl.uniform1f(u.uBulge, e.bulge);
  gl.uniform1f(u.uPan, e.pan % 1e5);
  gl.uniform1f(u.uLoose, LOOSE * e.agit);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  e.drawn++;
}

export function edgeLeave(e) { if (e) drop(e); }
