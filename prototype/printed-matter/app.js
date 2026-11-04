import * as THREE from 'three';

/* =========================================================================
   Content. Only facts from src/content (showcase wording: no open notes).
   ========================================================================= */
const PROGRAMS = [
  {
    slug: 'iyuana', name: 'Iyuana', lang: 'es', poster: 'img/iyuana.jpg', short: 'Aug 2026',
    homeTitle: ['Iyuana: El Retorno', 'de los Sueños'],
    pageTitle: ['Iyuana'], sub: 'El Retorno de los Sueños',
    specs: [['Role', 'Producer & creative director'], ['Where', 'Long Island City, Queens'], ['When', 'August 18–24, 2026'], ['Artists', 'Yanda Montahuano<br>Li Can Vega<br>Armando Vega<br>Israel Vargas “Panchis”']],
    blurbs: [['The exhibition', 'A week of film<br>and photography'], ['The artists', 'From Ecuador,<br>Peru and Mexico']],
    back: { title: 'Iyuana', sub: 'El Retorno de los Sueños', lines: ['Film & photography exhibition', 'Long Island City, Queens', 'August 18–24, 2026'] },
    page: {
      credits: [['Producer & creative director', 'Vanessa Espín'], ['Artists', 'Yanda Montahuano, Li Can Vega, Armando Vega, Israel Vargas “Panchis”']],
      specs: [['Type', 'Film & photography exhibition'], ['Where', '5-11 47th Ave, Long Island City'], ['When', 'August 18–24, 2026']],
      logline: ['Iyuana was a week', 'of film and photography', 'by four artists from', 'Ecuador, Peru and Mexico,', 'about the Sápara Nation', 'of the Ecuadorian Amazon.'],
      lead: 'I produced it: the two venues, the identity and campaign, the installation, and the week itself, introducing each artist’s work to visitors.',
      list: { label: 'Artists', rows: [['Yanda Montahuano', 'Filmmaker & photographer, Ecuador'], ['Li Can Vega', 'CGI visual artist, Peru'], ['Armando Vega', 'Photographer, Mexico'], ['Israel Vargas “Panchis”', 'Photographer, Ecuador']] },
      credit: [['Identity, poster & campaign', 'Vanessa Espín']],
    },
  },
  {
    slug: 'ayazamana', name: 'Ayazamana', poster: 'img/ayazamana.png', short: 'Jul 2026',
    homeTitle: ['Ayazamana'],
    pageTitle: ['Ayazamana'],
    specs: [['Role', 'Program & campaign'], ['With', 'Ecuadorian American Cultural Center'], ['When', 'Saturday, July 11, 2026']],
    blurbs: [['The night', 'Live music and<br>traditional dance'], ['With', 'The Ecuadorian American<br>Cultural Center']],
    back: { title: 'Ayazamana', lines: ['Live music & traditional dance', 'Ecuadorian American Cultural Center', 'Saturday, July 11, 2026, 8 PM'] },
    page: {
      credits: [['Program & campaign', 'Vanessa Espín'], ['With', 'Ecuadorian American Cultural Center']],
      specs: [['Type', 'Live music & traditional dance'], ['When', 'Saturday, July 11, 2026, 8 PM'], ['With', 'Ecuadorian American Cultural Center']],
      logline: ['Ayazamana was', 'a night of live music', 'and traditional dance', 'with the Ecuadorian', 'American Cultural Center.'],
      lead: 'I planned it with the Center as part of its public events program.',
    },
  },
  {
    slug: 'herencia-viva', name: 'Herencia Viva', lang: 'es', poster: 'img/herencia-viva.jpg', short: 'May 2026',
    homeTitle: ['Herencia Viva:', 'Threads of Memory'],
    pageTitle: ['Herencia', 'Viva'], sub: 'Threads of Memory',
    specs: [['Role', 'Curator & creative director'], ['Painter', 'Luis Medina'], ['Where', 'Flushing Town Hall'], ['When', 'May 29–31, 2026']],
    blurbs: [['The exhibition', 'Ecuadorian<br>magic realism'], ['The painter', 'Luis Medina']],
    back: { title: 'Herencia Viva', sub: 'Threads of Memory', lines: ['Painting exhibition', 'Flushing Town Hall', 'May 29–31, 2026'] },
    page: {
      credits: [['Curator & creative director', 'Vanessa Espín'], ['Painter', 'Luis Medina']],
      specs: [['Type', 'Painting exhibition'], ['Where', 'Flushing Town Hall, 137-35 Northern Blvd, Flushing'], ['When', 'May 29–31, 2026']],
      logline: ['Painter', 'Luis Medina’s exhibition', 'of Ecuadorian', 'magic realism.'],
      lead: 'I curated it and led its creative direction. I designed the poster and promotional materials, and hosted guests, walking them through the stories behind each work.',
      credit: [['Curation, poster & promotional materials', 'Vanessa Espín']],
    },
  },
  {
    slug: 'ecuadorian-american-cultural-center', name: 'Ecuadorian American Cultural Center', card: true, short: '2025–2026',
    homeTitle: ['Ecuadorian American', 'Cultural Center'],
    pageTitle: ['Ecuadorian', 'American', 'Cultural Center'],
    specs: [['Role', 'Creative & Community Coordinator'], ['Where', 'New York'], ['When', '2025–2026'], ['Work', 'Programs, content, sponsors']],
    blurbs: [['The role', 'Creative & Community<br>Coordinator'], ['The work', 'Programs, content<br>and sponsors']],
    back: { title: 'Ecuadorian American Cultural Center', lines: ['Creative & Community Coordinator', 'New York', '2025–2026'] },
    page: {
      credits: [['Creative & Community Coordinator', 'Vanessa Espín']],
      specs: [['Where', 'New York'], ['When', '2025–2026'], ['Programs', 'Ayazamana, July 2026']],
      logline: ['Daily operations', 'and a public events program,', 'shaped with', 'the community.'],
      lead: 'As Creative & Community Coordinator, I ran daily operations and a public events program shaped with the community, including <em>Ayazamana</em>, a night of live music and traditional dance. I made the event content and promotion, and built relationships with prospective sponsors and partners.',
    },
  },
];
const N = PROGRAMS.length;
const SITE = { email: 'vanessa.s.espin@gmail.com', linkedin: 'https://www.linkedin.com/in/vanessaespin' };

/* =========================================================================
   Setup
   ========================================================================= */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => clamp(v, 0, 1);
const mix = (a, b, t) => a + (b - a) * t;
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0, 10);

let VW = innerWidth, VH = innerHeight, Hv = 1, Wv = 1;
function resize() {
  VW = innerWidth; VH = innerHeight;
  renderer.setSize(VW, VH, false);
  camera.aspect = VW / VH;
  camera.updateProjectionMatrix();
  Hv = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  Wv = Hv * camera.aspect;
}
resize();
addEventListener('resize', resize);

/* =========================================================================
   Paper: a printed sheet that bends, curls and catches light
   ========================================================================= */
const VERT = /* glsl */ `
uniform float uBend;
uniform float uCurl;
uniform float uWave;
uniform float uTime;
uniform vec2 uSize;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vP;

vec3 deform(vec3 p, vec2 uv) {
  // A sheet carried sideways bends around its vertical axis.
  float b = uBend;
  if (abs(b) > 0.0005) {
    float a = p.x * b;
    p = vec3(sin(a) / b, p.y, p.z + (1.0 - cos(a)) / b);
  }
  // Paper is never flat: the lower right corner lifts a little.
  float cx = smoothstep(0.05, 0.5, uv.x - 0.5);
  float cy = smoothstep(0.05, 0.5, 0.5 - uv.y);
  p.z += uCurl * cx * cy * (cx + cy);
  // A slow ripple, as if air moved across it.
  p.z += uWave * 0.06 * sin(uv.x * 3.6 + uv.y * 2.2 + uTime * 1.25) * sin(uv.y * 3.1 + uTime * 0.8);
  return p;
}

void main() {
  vUv = uv;
  vec3 p = deform(position, uv);
  float e = 0.004;
  vec3 px = deform(position + vec3(e, 0.0, 0.0), uv + vec2(e / uSize.x, 0.0));
  vec3 py = deform(position + vec3(0.0, e, 0.0), uv + vec2(0.0, e / uSize.y));
  vec3 n = normalize(cross(px - p, py - p));
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vP = wp.xyz;
  vN = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */ `
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform vec3 uLight;
uniform vec3 uCam;
uniform float uOpacity;
uniform float uLift;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vP;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec3 n = normalize(vN);
  vec3 col;
  if (gl_FrontFacing) {
    col = texture2D(uFront, vUv).rgb;
  } else {
    col = texture2D(uBack, vec2(1.0 - vUv.x, vUv.y)).rgb;
    n = -n;
  }
  vec3 V = normalize(uCam - vP);
  float diff = max(dot(n, uLight), 0.0);
  float shade = 0.70 + 0.36 * diff;
  vec3 H = normalize(uLight + V);
  float sheen = pow(max(dot(n, H), 0.0), 48.0) * (0.05 + 0.06 * uLift);
  float fibre = (hash(floor(vUv * vec2(700.0, 875.0))) - 0.5) * 0.018;
  col = col * shade + sheen + fibre;
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
  vec2 p = (vUv - 0.5) * uSize * 1.6;
  float d = sdBox(p, uSize * 0.5 - uBlur * 0.6);
  float a = 1.0 - smoothstep(-uBlur * 0.4, uBlur, d);
  gl_FragColor = vec4(0.07, 0.05, 0.04, a * a * uOpacity);
}`;

const LIGHT = new THREE.Vector3(-0.42, 0.62, 0.66).normalize();
const KEYS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 's', 'o'];

class Sheet {
  constructor(front, back, aspect, seed) {
    this.aspect = aspect;
    this.seed = seed;
    this.group = new THREE.Group();
    this.spinner = new THREE.Group();
    this.group.add(this.spinner);
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uFront: { value: front }, uBack: { value: back },
        uBend: { value: 0 }, uCurl: { value: 0.05 }, uWave: { value: 0.1 }, uTime: { value: 0 },
        uSize: { value: new THREE.Vector2(aspect, 1) },
        uLight: { value: LIGHT }, uCam: { value: camera.position },
        uOpacity: { value: 0 }, uLift: { value: 0 },
      },
      vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, transparent: true,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1, 48, 60), this.mat);
    this.spinner.add(this.mesh);
    this.shadowMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 }, uSize: { value: new THREE.Vector2(aspect, 1) }, uBlur: { value: 0.16 } },
      vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false,
    });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(aspect * 1.6, 1.6), this.shadowMat);
    this.shadow.position.set(0.06, -0.09, -0.4);
    this.shadow.renderOrder = -1;
    this.group.add(this.shadow);
    scene.add(this.group);
    this.cur = { x: 0, y: 0, z: -6, rx: 0, ry: Math.PI / 2, rz: 0, s: 1, o: 0 };
    this.tgt = { ...this.cur };
    this.spin = 0; this.spinTgt = 0; this.spinVel = 0;
    this.bend = 0; this.lift = 0; this.liftTgt = 0;
    this.float = 1;
    this.rate = 9;
  }
  snap() { Object.assign(this.cur, this.tgt); }
  update(dt, t) {
    const k = reduced ? 1 : 1 - Math.exp(-dt * this.rate);
    const c = this.cur, g = this.tgt;
    if (g.o === 0 && c.o < 0.02) Object.assign(c, g);
    const px = c.x;
    for (const key of KEYS) c[key] += (g[key] - c[key]) * k;
    const vx = (c.x - px) / Math.max(dt, 1e-3);
    if (!reduced) {
      const bendTgt = clamp(-vx * 0.085 - this.spinVel * 0.045, -0.95, 0.95);
      this.bend += (bendTgt - this.bend) * (1 - Math.exp(-dt * 7));
      const acc = (this.spinTgt - this.spin) * 85 - this.spinVel * 13;
      this.spinVel += acc * dt;
      this.spin += this.spinVel * dt;
    } else {
      this.spin = this.spinTgt; this.bend = 0;
    }
    this.lift += (this.liftTgt - this.lift) * (1 - Math.exp(-dt * 8));
    const f = reduced ? 0 : this.float;
    const ts = t * 0.001;
    const fy = Math.sin(ts * 0.62 + this.seed) * 0.022 * f;
    const fr = Math.sin(ts * 0.47 + this.seed * 2.3) * 0.022 * f;
    this.group.position.set(c.x, c.y + fy, c.z + this.lift * 0.22);
    this.group.rotation.set(c.rx + fr * 0.6, c.ry + fr, c.rz + fr * 0.3);
    this.group.scale.setScalar(Math.max(c.s, 0.0001));
    this.spinner.rotation.y = this.spin;
    this.group.visible = c.o > 0.004;
    const u = this.mat.uniforms;
    u.uBend.value = this.bend;
    u.uTime.value = ts;
    u.uOpacity.value = c.o;
    u.uLift.value = this.lift;
    u.uCurl.value = reduced ? 0 : 0.045 + this.lift * 0.05;
    u.uWave.value = reduced ? 0 : 0.1 + Math.abs(this.bend) * 0.3;
    this.shadowMat.uniforms.uOpacity.value = c.o * (0.2 - this.lift * 0.05);
    this.shadow.position.set(0.05 + this.lift * 0.05, -0.08 - this.lift * 0.06, -0.4);
    this.shadow.scale.x = Math.max(0.1, Math.abs(Math.cos(this.spin)));
  }
}

/* =========================================================================
   Textures: posters, printed backs, the EACC card, the portrait print
   ========================================================================= */
const maxAniso = renderer.capabilities.getMaxAnisotropy();
function texFromCanvas(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  return t;
}
function texFromImage(img) {
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true;
  return t;
}
const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

function paperFibres(g, W, H, amount = 7) {
  const d = g.getImageData(0, 0, W, H);
  const a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    a[i] += n; a[i + 1] += n; a[i + 2] += n;
  }
  g.putImageData(d, 0, 0);
}

function regMark(g, x, y, r, color) {
  g.save(); g.strokeStyle = color; g.lineWidth = r * 0.07;
  g.beginPath(); g.arc(x, y, r * 0.55, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke();
  g.restore();
}

function backCanvas(p, img, aspect, index) {
  const W = 1000, H = Math.round(W / aspect);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f1eee8'; g.fillRect(0, 0, W, H);
  if (img) {
    g.save(); g.translate(W, 0); g.scale(-1, 1);
    g.globalAlpha = 0.055; g.filter = 'blur(3px) saturate(0.5)';
    g.drawImage(img, 0, 0, W, H); g.restore();
  }
  paperFibres(g, W, H, 8);
  const ink = '#1d1a17';
  const x = W * 0.08;
  g.fillStyle = ink;
  g.textBaseline = 'alphabetic';
  g.font = `500 ${W * 0.022}px Switzer`;
  g.letterSpacing = `${W * 0.004}px`;
  g.fillText(`N° ${String(index + 1).padStart(2, '0')}`, x, W * 0.11);
  regMark(g, W - W * 0.11, W * 0.1, W * 0.035, '#470000');
  let y = H * 0.62;
  g.font = `400 ${W * 0.083}px Zodiak`;
  g.letterSpacing = `-${W * 0.0008}px`;
  const words = p.back.title.toUpperCase().split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > W * 0.84 && line) { lines.push(line); line = w; } else line = test;
  }
  lines.push(line);
  y -= (lines.length - 1) * W * 0.08;
  for (const l of lines) { g.fillText(l, x, y); y += W * 0.08; }
  if (p.back.sub) {
    g.font = `400 ${W * 0.042}px Zodiak`;
    g.fillText(p.back.sub.toUpperCase(), x, y - W * 0.012);
    y += W * 0.04;
  }
  y += W * 0.035;
  g.fillStyle = ink;
  for (const l of p.back.lines) {
    g.fillRect(x, y - W * 0.034, W * 0.84, Math.max(1, W * 0.0012));
    g.font = `500 ${W * 0.029}px Switzer`;
    g.letterSpacing = '0px';
    g.fillText(l, x, y + W * 0.006);
    y += W * 0.058;
  }
  g.fillRect(x, y - W * 0.034, W * 0.84, Math.max(1, W * 0.0012));
  g.font = `400 ${W * 0.019}px Zodiak`;
  g.letterSpacing = `${W * 0.004}px`;
  g.fillText('VANESSA ESPÍN · NEW YORK', x, H - W * 0.075);
  return c;
}

function cardCanvas(p, aspect) {
  const W = 1000, H = Math.round(W / aspect);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f3efe7'; g.fillRect(0, 0, W, H);
  paperFibres(g, W, H, 9);
  const ink = '#1d1a17';
  const x = W * 0.08;
  g.strokeStyle = ink; g.lineWidth = Math.max(1, W * 0.0015);
  g.strokeRect(W * 0.04, W * 0.04, W * 0.92, H - W * 0.08);
  g.fillStyle = ink;
  g.font = `400 ${W * 0.128}px Zodiak`;
  g.letterSpacing = `-${W * 0.0015}px`;
  let y = W * 0.25;
  for (const l of ['ECUADORIAN', 'AMERICAN', 'CULTURAL', 'CENTER']) { g.fillText(l, x, y); y += W * 0.118; }
  g.fillStyle = '#470000';
  g.fillRect(x, y - W * 0.03, W * 0.12, W * 0.008);
  g.fillStyle = ink;
  y = H - W * 0.34;
  const rows = [['ROLE', 'Creative & Community Coordinator'], ['WHERE', 'New York'], ['WHEN', '2025–2026']];
  for (const [k, v] of rows) {
    g.fillRect(x, y - W * 0.04, W * 0.84, Math.max(1, W * 0.0012));
    g.font = `400 ${W * 0.019}px Zodiak`;
    g.letterSpacing = `${W * 0.005}px`;
    g.fillText(k, x, y);
    g.font = `500 ${W * 0.03}px Switzer`;
    g.letterSpacing = '0px';
    g.textAlign = 'right';
    g.fillText(v, x + W * 0.84, y + W * 0.004);
    g.textAlign = 'left';
    y += W * 0.075;
  }
  return c;
}

function portraitCanvas(img) {
  const W = 1000, H = Math.round(W / 0.92);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f4ef'; g.fillRect(0, 0, W, H);
  const m = W * 0.05;
  const iw = W - m * 2, ih = iw * (img.height / img.width);
  g.drawImage(img, m, m, iw, ih);
  paperFibres(g, W, H, 5);
  g.fillStyle = '#1d1a17';
  g.font = `400 ${W * 0.024}px Zodiak`;
  g.letterSpacing = `${W * 0.005}px`;
  g.fillText('VANESSA ESPÍN · BROOKLYN BRIDGE PARK', m, ih + m + (H - ih - m) * 0.55);
  return c;
}
function plainBackCanvas() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 556;
  const g = c.getContext('2d'); g.fillStyle = '#f1eee8'; g.fillRect(0, 0, 512, 556); paperFibres(g, 512, 556, 8);
  return c;
}

/* =========================================================================
   DOM helpers: masked lines, hairlines, spec rows
   ========================================================================= */
const lns = (arr, d0 = 0, step = 0.07) => arr.map((t, i) => `<span class="ln"><span class="ln__i" style="--d:${(d0 + i * step).toFixed(2)}s">${t}</span></span>`).join('');
const rows = (pairs, d0 = 0.1, step = 0.08) => pairs.map(([k, v], i) => {
  const d = (d0 + i * step).toFixed(2);
  return `<div class="specs__row"><i class="rule" style="--d:${d}s"></i><dt class="eyebrow">${lns([k], +d)}</dt><dd>${lns(v.split('<br>'), +d + 0.05, 0.05)}</dd></div>`;
}).join('');

function reveal(el, on = true) {
  if (!el) return;
  el.classList.remove('is-out');
  if (on) { void el.offsetWidth; el.classList.add('is-in'); } else el.classList.remove('is-in');
}
function conceal(el) { if (!el) return; el.classList.add('is-out'); el.classList.remove('is-in'); }

/* =========================================================================
   Home overlay text
   ========================================================================= */
const home = $('.home');
const homeTitle = $('.home__title');
const homeSpecs = $('.home__specs');
const homeBlurbs = $('.home__blurbs');
const homeCount = $('.home__count');
const homeOpen = $('.home__open');
let shownIndex = -1, swapToken = 0;

function homeHTML(i) {
  const p = PROGRAMS[i];
  return {
    title: lns(p.homeTitle, 0, 0.06),
    specs: rows(p.specs, 0.12, 0.07),
    blurbs: p.blurbs.map(([k, v], j) => `<div class="blurb"><i class="blurb__mark" style="--d:${0.2 + j * 0.1}s"></i><span class="eyebrow">${lns([k], 0.22 + j * 0.1)}</span><p class="blurb__text" style="margin:0">${lns(v.split('<br>'), 0.28 + j * 0.1, 0.06)}</p></div>`).join(''),
  };
}
function showHomeText(i, instant = false) {
  if (i === shownIndex && !instant) return;
  shownIndex = i;
  const token = ++swapToken;
  const p = PROGRAMS[i];
  if (p.lang) homeTitle.lang = p.lang; else homeTitle.removeAttribute('lang');
  homeCount.textContent = `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
  homeOpen.href = `#/${p.slug}`;
  homeOpen.textContent = `Open ${p.name}`;
  const els = [homeTitle, homeSpecs, homeBlurbs];
  const put = () => {
    if (token !== swapToken) return;
    const h = homeHTML(i);
    homeTitle.innerHTML = h.title; homeSpecs.innerHTML = h.specs; homeBlurbs.innerHTML = h.blurbs;
    els.forEach((el) => reveal(el));
  };
  if (instant || !homeTitle.innerHTML) { put(); return; }
  els.forEach(conceal);
  setTimeout(put, reduced ? 0 : 420);
}

/* =========================================================================
   Marks: the hand-made gesture around the selected poster.
   ?mark=circle (default) | grease | hang | tape | hangtape | wire | box,
   also chosen in the lab (see Lab below).
   ========================================================================= */
const SVGNS = 'http://www.w3.org/2000/svg';
const markLayer = $('#marks');
const MARK_NAMES = ['circle', 'grease', 'hang', 'tape', 'hangtape', 'wire', 'box'];
const params = new URLSearchParams(location.search);
let markName = MARK_NAMES.includes(params.get('mark')) ? params.get('mark') : 'circle';
let scribbleOn = false, markTrack = null, markToken = 0, markClock = null;

function projectCorners(sheet) {
  const a = sheet.aspect;
  return [[-a / 2, -0.5], [a / 2, -0.5], [a / 2, 0.5], [-a / 2, 0.5]].map(([x, y]) => {
    const v = new THREE.Vector3(x, y, 0);
    sheet.mesh.localToWorld(v); v.project(camera);
    return [(v.x + 1) / 2 * VW, (1 - v.y) / 2 * VH];
  });
}
function rectCorners(r, pad = 0) {
  return [[r.left - pad, r.bottom + pad], [r.right + pad, r.bottom + pad], [r.right + pad, r.top - pad], [r.left - pad, r.top - pad]];
}
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const len2 = (v) => Math.hypot(v[0], v[1]);
const unit = (v) => mul(v, 1 / (len2(v) || 1));
const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

function smoothPath(pts) {
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}
function loopPoints(c, seed, turns, grow) {
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const L = mid(c[0], c[3]), R = mid(c[1], c[2]), B = mid(c[0], c[1]), T = mid(c[3], c[2]);
  const cx = (L[0] + R[0] + B[0] + T[0]) / 4, cy = (L[1] + R[1] + B[1] + T[1]) / 4;
  const rx = len2(sub(R, L)) / 2 * 1.2 * grow + 16;
  const ry = len2(sub(T, B)) / 2 * 1.08 * grow + 16;
  const rot = Math.atan2(R[1] - L[1], R[0] - L[0]);
  const n = 70, a0 = -Math.PI * 0.6 + seed, span = Math.PI * 2 * turns;
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const a = a0 + (span * k) / n;
    const wob = 1 + 0.035 * Math.sin(a * 3 + seed * 5) + 0.018 * Math.sin(a * 7 + seed);
    const g = 1 + 0.06 * (k / n);
    const x = rx * wob * g * Math.cos(a), y = ry * wob * g * Math.sin(a);
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return pts;
}
const loopPath = (c, seed, turns, grow) => smoothPath(loopPoints(c, seed, turns, grow));

function svg(tag, attrs = {}, parent = markLayer) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}
function drawPath(d, cls, dur, delay, ease = 'cubic-bezier(.62,.05,.28,1)') {
  const p = svg('path', { d, class: `mk ${cls}` });
  const len = p.getTotalLength();
  p.dataset.len = len;
  p.style.strokeDasharray = `${len}`;
  p.style.strokeDashoffset = `${len}`;
  p.getBoundingClientRect();
  p.style.transition = `stroke-dashoffset ${dur}s ${ease} ${delay}s`;
  p.style.strokeDashoffset = '0';
  return p;
}
// screen "up" relative to a poster's top edge
function edgeFrame(c) {
  const [BL, BR, TR, TL] = c;
  const along = unit(sub(TR, TL));
  let up = [along[1], -along[0]];
  if (up[1] > 0) up = mul(up, -1);
  return { BL, BR, TR, TL, along, up, w: len2(sub(TR, TL)), h: len2(sub(TL, BL)) };
}

/* The wire and the box are drawn by the frame loop from a clock, not by CSS
   transitions: the wire keeps moving once drawn (it takes the weight), and the box
   is paced by hand, slowing into each turn. Both are re-fitted every frame. */
// a CSS cubic-bezier() as a function
const bez = (x1, y1, x2, y2) => {
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
};
const E_DRAW = bez(0.62, 0.05, 0.28, 1); // the circle's curve
const E_OUT = bez(0.2, 0.7, 0.3, 1);
const E_IN = bez(0.55, 0, 0.75, 0); // the erase
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const lerp2 = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
const perp = (d) => [d[1], -d[0]];
const rot2 = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

// The sheet's plane on screen: P(u, v) in sheet widths and heights from the top-left
// corner, exact in perspective, so marks off the sheet still lie on its plane.
function quadMap(c) {
  const [BL, BR, TR, TL] = c;
  const [x0, y0] = TL, [x1, y1] = TR, [x2, y2] = BR, [x3, y3] = BL;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9;
  const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  const P = (u, v) => { const w = g * u + h * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w]; };
  P.w = len2(sub(TR, TL)); P.h = len2(sub(BL, TL));
  P.down = unit(sub(P(0.5, 0.6), P(0.5, 0.1)));
  return P;
}
// the part of a polyline between fractions a..b of its length
function sliceArc(pts, a, b) {
  if (pts.length < 2 || b - a <= 1e-4) return [];
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + len2(sub(pts[i], pts[i - 1])));
  const A = a * L[L.length - 1], B = b * L[L.length - 1];
  const at = (s) => { let i = 1; while (i < L.length - 1 && L[i] < s) i++; return lerp2(pts[i - 1], pts[i], clamp01((s - L[i - 1]) / (L[i] - L[i - 1] || 1))); };
  const out = [at(A)];
  for (let i = 1; i < pts.length - 1; i++) if (L[i] > A && L[i] < B) out.push(pts[i]);
  out.push(at(B));
  return out;
}
// a Catmull-Rom curve through ctrl as a dense polyline (the curve smoothPath draws)
function catmull(ctrl, per = 8) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}
const crossPts = (N, r) => [[add(N, [-r, -r]), add(N, [r, r])], [add(N, [r, -r]), add(N, [-r, r])]];
function setD(el, pts) {
  const d = pts.length < 2 ? '' : 'M' + pts.map(pt).join('L');
  if (el.getAttribute('d') !== d) el.setAttribute('d', d);
}
// The frame loop calls render(corners, t, lt) every frame: t in seconds since shown,
// lt since leave (-1 until then).
function clockMark(sheet, c, render) {
  markClock = { sheet, c, t0: performance.now(), leaveAt: 0, render };
  render(c, 0, -1);
}
function tickMark(now) {
  const m = markClock;
  m.render(m.sheet ? projectCorners(m.sheet) : m.c, (now - m.t0) / 1000, m.leaveAt ? (now - m.leaveAt) / 1000 : -1);
}

// a seeded random stream (mulberry32): the same quirks every frame, new ones every show
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// the quad's edges pushed out by pad px and re-intersected: a frame round the sheet as seen
function inflate(c, pad) {
  const cen = mul(c.reduce((s, p) => add(s, p), [0, 0]), 0.25);
  const lines = c.map((p, i) => {
    const q = c[(i + 1) % 4], d = unit(sub(q, p)), m = lerp2(p, q, 0.5);
    let n = perp(d);
    if ((m[0] - cen[0]) * n[0] + (m[1] - cen[1]) * n[1] < 0) n = mul(n, -1);
    return { p: add(p, mul(n, pad)), d };
  });
  return c.map((_, i) => {
    const A = lines[(i + 3) % 4], B = lines[i];
    const den = A.d[0] * B.d[1] - A.d[1] * B.d[0];
    if (Math.abs(den) < 1e-6) return B.p;
    const t = ((B.p[0] - A.p[0]) * B.d[1] - (B.p[1] - A.p[1]) * B.d[0]) / den;
    return add(A.p, mul(A.d, t));
  });
}
// a hand-drawn run from p to q (interior points only): a slight bow and a tremor, never ruled
function run(p, q, R, steps) {
  const d = sub(q, p), n = perp(unit(d)), bow = (R() - 0.35) * 0.022 * len2(d);
  const out = [];
  for (let k = 1; k < steps; k++) out.push(add(lerp2(p, q, k / steps), mul(n, bow * Math.sin((Math.PI * k) / steps) + (R() - 0.5) * 1.1)));
  return out;
}
// The select box round a quad. The frame (tilt about a degree, jittered corners) comes
// from one seed and the hand (bow, tremor, start and run-on) from another, so a second
// pass can follow the same box with a different hand. On the home page the bottom side
// keeps 8px above the captions under the sheet, but never enters the sheet.
const BOX_PER = 6;
function boxGeom(c, frameSeed, handSeed, extra, avoid) {
  const F = rng(frameSeed), R = rng(handSeed);
  const f = edgeFrame(c), s = Math.min(f.w, f.h);
  const pad = clamp(f.h * (VW < 760 ? 0.035 : 0.05), 9, 34) + extra, jit = f.h * 0.008;
  const tilt = (F() < 0.5 ? -1 : 1) * 0.022 * (0.6 + F() * 0.4);
  const cen = mul(c.reduce((q, p) => add(q, p), [0, 0]), 0.25);
  const Q = inflate(c, pad).map((p) => add(add(cen, rot2(sub(p, cen), tilt)), [(F() - 0.5) * 2 * jit, (F() - 0.5) * 2 * jit]));
  let lim = Infinity;
  if (avoid && avoid.left < Math.max(Q[1][0], Q[2][0]) && avoid.right > Math.min(Q[0][0], Q[3][0])) {
    lim = Math.max(avoid.top - 8, Math.max(c[0][1], c[1][1]) + 5);
    Q[0][1] = Math.min(Q[0][1], lim); Q[1][1] = Math.min(Q[1][1], lim);
  }
  const keep = (pts) => pts.map((p) => [p[0], Math.min(p[1], lim)]);
  const [BL, BR, TR, TL] = Q;
  const top = unit(sub(TR, TL)), down = unit(sub(BR, TR)), back = unit(sub(BL, BR)), up = unit(sub(TL, BL));
  const S = add(sub(TL, mul(top, 1.3 * clamp(s * 0.06, 10, 24) * (0.8 + R() * 0.4))), mul(perp(top), (R() - 0.5) * 3));
  const E = add(add(TL, mul(up, 1.3 * clamp(s * 0.075, 12, 30) * (0.8 + R() * 0.4))), mul(top, 2 + R() * 5));
  const rc = clamp(s * 0.045, 4, 22);
  const turn = (K, din, dout) => [sub(K, mul(din, rc)), add(K, mul(sub(din, dout), 1.3)), add(K, mul(dout, rc))];
  const ctrl = [S], at = [];
  ctrl.push(...run(S, TR, R, 5), ...turn(TR, top, down)); at.push(ctrl.length - 2);
  ctrl.push(...run(TR, BR, R, 6), ...keep(turn(BR, down, back))); at.push(ctrl.length - 2);
  ctrl.push(...keep([...run(BR, BL, R, 5), ...turn(BL, back, up)])); at.push(ctrl.length - 2);
  ctrl.push(...run(BL, TL, R, 6), TL); at.push(ctrl.length - 1);
  ctrl.push(E);
  const pts = catmull(ctrl, BOX_PER);
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + len2(sub(pts[i], pts[i - 1])));
  const T = L[L.length - 1], ks = [...at.map((i) => L[i * BOX_PER]), T];
  return { pts, fr: ks.map((k) => k / T), legLen: ks.map((k, i) => k - (i ? ks[i - 1] : 0)) };
}
const BOX_EASES = [bez(0.55, 0.04, 0.62, 0.86), ...Array(3).fill(bez(0.36, 0.16, 0.64, 0.84)), bez(0.3, 0.45, 0.6, 0.95)];
// how far round the box the pen is at t, with each leg eased into its turn
function legAt(legs, t) {
  let from = 0;
  for (const l of legs) {
    if (t < l.t1) return mix(from, l.to, l.ease(seg(t, l.t0, l.t1)));
    from = l.to;
  }
  return 1;
}

const MARKS = {
  // A fan circling their pick with a marker (the A24 gesture).
  circle(c) {
    drawPath(loopPath(c, 0.35, 1.13, 1), 'mk--marker', 0.8, 0);
    drawPath(loopPath(c, 1.7, 0.78, 1.05), 'mk--marker-thin', 0.6, 0.18);
  },
  // A picture editor's china marker circling the select on a contact sheet:
  // one fast, heavy, waxy loop that overshoots and flicks off.
  grease(c) {
    const pts = loopPoints(c, 0.9, 1.07, 1.0);
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    const dir = unit(sub(b, a));
    pts.push(add(b, add(mul(dir, 26), [6, 10])));
    drawPath(smoothPath(pts), 'mk--grease', 0.55, 0, 'cubic-bezier(.35,.55,.2,1)');
  },
  // An installer marking the wall before hanging: hand-ruled corner guides,
  // a level line with a centre tick, and crosses where the nails go.
  hang(c) {
    const f = edgeFrame(c);
    const o = Math.max(10, f.w * 0.045);
    const s = Math.max(12, f.w * 0.07);
    const corners = [
      [f.TL, mul(f.along, 1), mul(f.up, -1)], [f.TR, mul(f.along, -1), mul(f.up, -1)],
      [f.BR, mul(f.along, -1), f.up], [f.BL, f.along, f.up],
    ];
    corners.forEach(([p, dx, dy], i) => {
      const out = add(add(p, mul(dx, -o)), mul(dy, -o));
      drawPath(`M${pt(add(out, mul(dx, s)))}L${pt(out)}L${pt(add(out, mul(dy, s)))}`, 'mk--pencil', 0.18, 0.04 + i * 0.07);
    });
    const lineY = mul(f.up, o + Math.max(14, f.h * 0.05));
    const a = add(add(f.TL, lineY), mul(f.along, -f.w * 0.16)), b = add(add(f.TR, lineY), mul(f.along, f.w * 0.16));
    drawPath(`M${pt(a)}L${pt(b)}`, 'mk--pencil', 0.42, 0.3, 'cubic-bezier(.5,0,.2,1)');
    const m = add(mul(add(a, b), 0.5), [0, 0]);
    drawPath(`M${pt(add(m, mul(f.up, 9)))}L${pt(add(m, mul(f.up, -9)))}`, 'mk--pencil', 0.12, 0.66);
    [0.24, 0.76].forEach((t, k) => {
      const p = add(add(f.TL, mul(sub(f.TR, f.TL), t)), lineY);
      const r = 5;
      drawPath(`M${pt(add(p, [-r, -r]))}L${pt(add(p, [r, r]))}`, 'mk--pencil-thin', 0.08, 0.72 + k * 0.1);
      drawPath(`M${pt(add(p, [r, -r]))}L${pt(add(p, [-r, r]))}`, 'mk--pencil-thin', 0.08, 0.77 + k * 0.1);
    });
  },
  // Two strips of masking tape pressed onto the top corners: put up on the wall.
  tape(c) {
    const pieces = [0, 1].map((k) => {
      const outer = svg('g');
      const inner = svg('g', { class: 'tape' }, outer);
      const L = 1, H = 0.27;
      const jag = (side) => Array.from({ length: 6 }, (_, i) => [side * (L / 2 + (Math.random() - 0.5) * 0.05), -H / 2 + (H * i) / 5]);
      const left = jag(-1), right = jag(1).reverse();
      svg('polygon', { class: 'tape__body', points: [...left, ...right].map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ') }, inner);
      inner.style.opacity = '0';
      inner.style.transform = 'scale(1.3)';
      inner.getBoundingClientRect();
      inner.style.transition = `transform .36s cubic-bezier(.2,1.6,.4,1) ${0.05 + k * 0.12}s, opacity .14s linear ${0.05 + k * 0.12}s`;
      inner.style.transform = 'scale(1)';
      inner.style.opacity = '1';
      return outer;
    });
    const tilt = [-36 + (Math.random() - 0.5) * 8, 34 + (Math.random() - 0.5) * 8];
    markTrack = (c2) => {
      const f = edgeFrame(c2);
      const ang = (Math.atan2(f.along[1], f.along[0]) * 180) / Math.PI;
      const size = Math.max(40, f.w * 0.3);
      [f.TL, f.TR].forEach((p, k) => {
        pieces[k].setAttribute('transform', `translate(${pt(p)}) rotate(${(ang + tilt[k]).toFixed(1)}) scale(${size.toFixed(1)})`);
      });
    };
    markTrack(c);
  },
  // Both: the installer's marks, then the tape.
  hangtape(c) {
    MARKS.hang(c);
    MARKS.tape(c);
  },
  // Hung: a pencil cross where the nail goes, the nail, then the wire from corner to
  // corner over it, slack until it takes the weight. Under a link the wire is strung
  // between two nails below the words. On leave it goes slack and is pulled off.
  wire(c, sheet) {
    const g = svg('g', { filter: 'url(#rough-wire)' }); // #rough, with room round a near-straight wire
    const nails = (sheet ? [0] : [0, 1]).map(() => [svg('path', { class: 'mk mk--cross' }, g), svg('path', { class: 'mk mk--cross' }, g)]);
    const strand = svg('path', { class: 'mk mk--strand' }, g), wire = svg('path', { class: 'mk mk--wire' }, g);
    const heads = nails.map(() => svg('circle', { class: 'mk-nail', r: 0 }));
    const slack = sheet ? 0.1 : 0.05, rest = sheet ? 0 : 0.006;
    clockMark(sheet, c, (c2, t, lt) => {
      const P = quadMap(c2);
      const down = P.down, up = mul(down, -1), r = clamp(P.h * 0.011, 3.6, 6);
      const N = sheet ? [P(0.5, -clamp(P.h * 0.13, 28, 74) / P.h)] : [0, 1].map((u) => add(P(u, 1), mul(down, 6)));
      const fade = lt < 0 ? 1 : 1 - seg(lt, 0.15, 0.32);
      N.forEach((p, k) => {
        const [ca, cb] = crossPts(p, r), t0 = k * 0.08;
        setD(nails[k][0], sliceArc(ca, 0, E_OUT(seg(t, t0, t0 + 0.09))));
        setD(nails[k][1], sliceArc(cb, 0, E_OUT(seg(t, t0 + 0.07, t0 + 0.16))));
        nails[k][0].style.opacity = nails[k][1].style.opacity = fade;
        const hp = seg(t, t0 + 0.14, t0 + 0.3);
        heads[k].setAttribute('cx', p[0].toFixed(1)); heads[k].setAttribute('cy', p[1].toFixed(1));
        heads[k].setAttribute('r', hp <= 0 ? 0 : (r * 0.5 * (1 + 0.45 * Math.sin(hp * Math.PI) * (1 - hp))).toFixed(2));
        heads[k].style.opacity = fade;
      });
      // slack while it is drawn, then it takes the weight: one twang and still
      const tau = t - 0.62;
      let sag = tau < 0 ? slack : rest + (slack - rest) * Math.exp(-tau / 0.09) * Math.cos(2 * Math.PI * 4.2 * tau);
      if (lt >= 0) sag = mix(sag, slack * 1.4, E_OUT(seg(lt, 0, 0.2)));
      const leg = (S, E, n = 28) => {
        const L = len2(sub(E, S));
        return Array.from({ length: n + 1 }, (_, i) => add(lerp2(S, E, i / n), mul(down, sag * L * 4 * (i / n) * (1 - i / n))));
      };
      let pts, along;
      if (sheet) {
        const A = P(0.012, 0.004), B = P(0.988, 0.004), [M] = N;
        along = unit(sub(B, A));
        const h0 = add(add(M, mul(along, -r * 1.1)), mul(up, r * 0.2)), h1 = add(M, mul(up, r * 0.95)), h2 = add(add(M, mul(along, r * 1.1)), mul(up, r * 0.2));
        pts = [...leg(A, h0), ...catmull([h0, h1, h2], 6).slice(1), ...leg(h2, B).slice(1)];
      } else {
        along = unit(sub(N[1], N[0]));
        pts = leg(N[0], N[1], 40);
      }
      const a0 = lt < 0 ? 0 : E_IN(seg(lt, 0.02, 0.36)), off = mul(perp(along), -1.6);
      setD(wire, sliceArc(pts, a0, E_DRAW(seg(t, 0.1, 0.62))));
      setD(strand, sliceArc(pts.map((p) => add(p, off)), a0, 0.97 * E_DRAW(seg(t, 0.18, 0.7))));
    });
  },
  // The select box: on a contact sheet the pick is boxed in red china marker. One
  // stroke from just left of the top-left corner, slowing into each turn and run on
  // past its start so the closing corner crosses; a thinner second pass goes over the
  // right side. Today's marker ink, a little different every time.
  box(c, sheet) {
    const seed = (Math.random() * 2 ** 32) >>> 0;
    const avoid = sheet && state.mode === 'home' ? $('.home__blurbs').getBoundingClientRect() : null;
    const main = svg('path', { class: 'mk mk--marker' }), thin = svg('path', { class: 'mk mk--marker-thin' });
    const T = VW < 760 ? 0.66 : 0.74;
    let legs = null;
    clockMark(sheet, c, (c2, t, lt) => {
      const G = boxGeom(c2, seed, seed + 1, 0, avoid), G2 = boxGeom(c2, seed, seed + 2, 2.6, avoid);
      if (!legs) {
        const w = G.legLen.slice(0, 4).map((l) => l ** 0.8), W = w.reduce((x, y) => x + y, 0);
        let t0 = 0;
        legs = G.fr.map((to, i) => {
          const dur = i < 4 ? ((T - 0.07) * w[i]) / W : 0.07;
          t0 += dur;
          return { to, t0: t0 - dur, t1: t0, ease: BOX_EASES[i] };
        });
      }
      const a0 = lt < 0 ? 0 : E_IN(seg(lt, 0, 0.36));
      setD(main, sliceArc(G.pts, a0, legAt(legs, t)));
      const u0 = 0.55 * G2.fr[0], u1 = G2.fr[1] + 0.6 * (G2.fr[2] - G2.fr[1]);
      setD(thin, sliceArc(G2.pts, mix(u0, u1, a0), mix(u0, u1, E_DRAW(seg(t, 0.3, 0.72)))));
    });
  },
};

function showScribble(sheet, corners) {
  if (reduced) return;
  const token = ++markToken;
  markLayer.replaceChildren();
  markTrack = null; markClock = null;
  const c = corners || projectCorners(sheet);
  MARKS[markName](c, sheet);
  scribbleOn = token;
  markLayer.dataset.sheet = sheet ? sheets.indexOf(sheet) : '';
}
function hideScribble() {
  if (!scribbleOn) return;
  scribbleOn = false;
  markTrack = null;
  if (markClock) markClock.leaveAt = performance.now();
  const token = ++markToken;
  for (const p of markLayer.querySelectorAll('path[data-len]')) {
    p.style.transition = 'stroke-dashoffset .35s cubic-bezier(.55,0,.75,0)';
    p.style.strokeDashoffset = `${-(+p.dataset.len || 0)}`;
  }
  for (const t of markLayer.querySelectorAll('.tape')) {
    t.style.transition = 'transform .25s ease-in, opacity .2s ease-in';
    t.style.transform = 'scale(1.12)';
    t.style.opacity = '0';
  }
  setTimeout(() => { if (token === markToken) { markLayer.replaceChildren(); markClock = null; } }, 420);
}
function setMark(name) {
  if (!MARK_NAMES.includes(name)) return;
  markName = name;
  hideScribble();
}

/* =========================================================================
   State, carousel, routing
   ========================================================================= */
const body = document.body;
const pageBg = $('.page-bg');
const programView = $('.program');
const aboutView = $('.about');
const state = { p: 0, target: 0, mode: 'loading', active: 0, hoverWanted: false, ready: false };
let sheets = [], portrait = null;
let tiltK = 1, storyTone = 'night', loaderOn = true;

function layout() {
  const mobile = VW < 760;
  if (mobile) {
    const H = Math.min(Hv * 0.4, Wv * 0.82);
    return { H, cx: 0, cy: -Hv * 0.01, sx: Wv * 0.62, sy: Hv * 0.04, sz: 1.1, rx: -0.14 * tiltK, ry: -0.34 * tiltK, rz: -0.05 * tiltK };
  }
  return { H: Hv * 0.56, cx: Wv * 0.02, cy: -Hv * 0.03, sx: Wv * 0.33, sy: Hv * 0.19, sz: 2.3, rx: -0.2 * tiltK, ry: -0.42 * tiltK, rz: -0.07 * tiltK };
}
function carouselTarget(sheet, d, out = sheet.tgt) {
  const l = layout();
  out.x = l.cx + d * l.sx; out.y = l.cy + d * l.sy; out.z = d * l.sz;
  out.rx = l.rx; out.ry = l.ry; out.rz = l.rz + d * 0.05;
  out.s = l.H;
  out.o = d < -1 ? clamp01(1 - (-1 - d) * 1.4) : d > 1.35 ? clamp01(1 - (d - 1.35) * 1.4) : 1;
}
function slotTarget(el, rot, out) {
  const r = el.getBoundingClientRect();
  const s = Hv / VH;
  out.x = (r.left + r.width / 2 - VW / 2) * s;
  out.y = -(r.top + r.height / 2 - VH / 2) * s;
  out.z = 0; out.s = r.height * s;
  out.rx = rot[0]; out.ry = rot[1]; out.rz = rot[2]; out.o = 1;
  return out;
}
const HERO_ROT = [-0.92, 0.0, 0.07];
const STORY_ROT = [0.0, -0.1, 0.0];
const NEXT_ROT = [-0.86, 0.0, -0.06];
const tmpA = {}, tmpB = {};

const clampP = (v) => clamp(v, -0.25, N - 0.75);
let snapTimer = 0;
function scheduleSnap(ms = 170) {
  clearTimeout(snapTimer);
  snapTimer = setTimeout(() => { state.target = clamp(Math.round(state.target), 0, N - 1); }, ms);
}
function goTo(i) { state.target = clamp(i, 0, N - 1); }

function setTone(tone) {
  pageBg.dataset.tone = tone;
  body.classList.toggle('is-night', tone === 'night');
}
function setNav(which) {
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-current', a.dataset.nav === which));
}

function enterHome() {
  const from = state.mode;
  state.mode = 'home';
  body.classList.add('is-home'); body.classList.remove('is-scroll');
  setNav('programs'); setTone('paper');
  sheets.forEach((s) => { s.rate = from === 'loading' ? 4.2 : 5.5; s.float = 1; });
  if (portrait) portrait.tgt.o = 0;
  const leaving = [programView, aboutView].filter((v) => !v.hidden);
  leaving.forEach((v) => v.querySelectorAll('.is-in').forEach(conceal));
  setTimeout(() => {
    leaving.forEach((v) => { v.hidden = true; v.innerHTML = ''; });
    scrollTo(0, 0);
    home.hidden = false;
    showHomeText(state.active, true);
    document.querySelectorAll('.home__corner').forEach((el) => reveal(el));
    setTimeout(() => sheets.forEach((s) => (s.rate = 9)), 900);
  }, leaving.length ? 450 : 0);
}

function enterProgram(i) {
  hideScribble();
  const fromHome = state.mode === 'home';
  state.mode = 'program';
  state.active = i; state.target = state.p = i;
  body.classList.remove('is-home');
  setNav('programs');
  [homeTitle, homeSpecs, homeBlurbs].forEach(conceal);
  document.querySelectorAll('.home__corner').forEach(conceal);
  aboutView.hidden = true; aboutView.innerHTML = '';
  const build = () => {
    home.hidden = true;
    programView.innerHTML = programHTML(i);
    programView.hidden = false;
    body.classList.add('is-scroll');
    scrollTo(0, 0);
    sheets.forEach((s) => { s.rate = 4.6; s.spinTgt = Math.round(s.spinTgt / (Math.PI * 2)) * Math.PI * 2; });
    requestAnimationFrame(() => {
      const hero = $('.p-hero', programView);
      setTimeout(() => reveal(hero), fromHome ? 260 : 120);
      setTimeout(() => sheets.forEach((s) => (s.rate = 7)), 1300);
    });
  };
  setTimeout(build, fromHome ? 380 : 0);
}

function enterAbout() {
  hideScribble();
  state.mode = 'about';
  body.classList.remove('is-home');
  setNav('about'); setTone('paper');
  [homeTitle, homeSpecs, homeBlurbs].forEach(conceal);
  document.querySelectorAll('.home__corner').forEach(conceal);
  setTimeout(() => {
    home.hidden = true; programView.hidden = true; programView.innerHTML = '';
    aboutView.innerHTML = aboutHTML(); aboutView.hidden = false;
    body.classList.add('is-scroll'); scrollTo(0, 0);
    sheets.forEach((s) => (s.rate = 4.6));
    if (portrait) portrait.rate = 4.2;
    requestAnimationFrame(() => setTimeout(() => reveal($('.about__inner', aboutView)), 200));
  }, 380);
}

function route() {
  if (!state.ready) return;
  const h = location.hash.replace(/^#\/?/, '');
  closeIndex();
  if (!h) return enterHome();
  if (h === 'about') return enterAbout();
  const i = PROGRAMS.findIndex((p) => p.slug === h);
  if (i >= 0) return enterProgram(i);
  enterHome();
}
addEventListener('hashchange', route);

/* =========================================================================
   Program and About pages
   ========================================================================= */
function programHTML(i) {
  const p = PROGRAMS[i], g = p.page, next = PROGRAMS[(i + 1) % N];
  const lang = p.lang ? ` lang="${p.lang}"` : '';
  const credits = g.credits.map(([k, v]) => `<span class="eyebrow">${k}</span>${v}`).join(' ');
  const list = g.list ? `<div class="p-list"><span class="eyebrow">${g.list.label}</span>${g.list.rows.map(([n, m]) => `<div class="p-list__row"><i class="rule"></i><span class="p-list__name">${n}</span><span class="p-list__meta">${m}</span></div>`).join('')}<div class="p-list__row" style="padding:0"><i class="rule"></i></div></div>` : '';
  const credit = g.credit ? `<dl class="specs p-credit">${rows(g.credit, 0, 0.05)}</dl>` : '';
  return `
  <div class="p-hero" data-tone="paper">
    <a class="p-back" href="#/">← All programs</a>
    <i class="crop crop--tl"></i><i class="crop crop--tr"></i><i class="crop crop--bl"></i><i class="crop crop--br"></i>
    <h1 class="p-title"${lang}>${lns(p.pageTitle, 0.05, 0.08)}</h1>
    ${p.sub ? `<p class="p-sub"${lang}>${lns([p.sub], 0.25)}</p>` : ''}
    <p class="p-credits">${lns([credits], 0.35)}</p>
    <dl class="specs p-specs">${rows(g.specs, 0.42, 0.08)}<div class="specs__row" style="padding:0"><i class="rule" style="--d:${(0.42 + g.specs.length * 0.08).toFixed(2)}s"></i></div></dl>
    <div class="slot slot--hero" data-slot="hero" style="--ar:${sheets[i].aspect}"></div>
  </div>
  <div class="p-story" data-tone="${storyTone}" style="--rows:${g.logline.length}">
    <div class="p-story__sticky">
      <ol class="p-logline">${g.logline.map((t) => `<li><i class="rule"></i><span class="ln"><span class="ln__i">${t}</span></span></li>`).join('')}</ol>
      <div class="slot slot--story" data-slot="story" style="--ar:${sheets[i].aspect}"></div>
    </div>
  </div>
  <div class="p-text" data-tone="paper">
    <p class="p-text__lead">${g.lead}</p>
    ${list}
    ${credit}
  </div>
  <section class="p-next" data-tone="stone">
    <a class="p-next__link" href="#/${next.slug}">
      <span class="eyebrow">Next program</span>
      <span class="p-next__title"${next.lang ? ` lang="${next.lang}"` : ''}>${next.pageTitle.join('<br>')}</span>
      <span class="p-next__go">Open ${next.name}</span>
    </a>
    <div class="slot slot--next" data-slot="next" style="--ar:${sheets[(i + 1) % N].aspect}"></div>
    <footer class="p-foot"><span>Vanessa Espín · New York</span><span><a href="mailto:${SITE.email}">${SITE.email}</a> · <a href="${SITE.linkedin}">LinkedIn</a></span></footer>
  </section>`;
}

function aboutHTML() {
  return `
  <div class="about__slot" data-slot="portrait"></div>
  <div class="about__inner">
    <h1 class="about__statement">${lns(['I produce exhibitions', 'and events in New York,', 'most of them with artists', 'from Ecuador and across', 'Latin America, and I', 'design them myself.'], 0.05, 0.06)}</h1>
    <div class="about__body">
      ${lns([`In 2026 I produced <em>Iyuana</em>, a week of film and photography about the Sápara Nation of the Ecuadorian Amazon, in Long Island City. I curated <em>Herencia Viva</em>, painter Luis Medina’s exhibition of Ecuadorian magic realism, at three venues including Flushing Town Hall. And for the Ecuadorian American Cultural Center, where I was Creative & Community Coordinator, I planned <em>Ayazamana</em>, a night of live music and traditional dance.`], 0.4)}
      ${lns(['Before that, I spent four years at Flywheel, a digital commerce agency, art-directing Amazon and Walmart storefronts and ads for more than twenty health, beauty and consumer brands.'], 0.5)}
      ${lns(['I studied Communication Design at City Tech, CUNY.'], 0.58)}
    </div>
    <dl class="specs">${rows([['Email', `<a href="mailto:${SITE.email}">${SITE.email}</a>`], ['LinkedIn', `<a href="${SITE.linkedin}">linkedin.com/in/vanessaespin</a>`], ['Résumé', '<a href="Vanessa_Espin_Resume.pdf">PDF</a>'], ['Based in', 'New York']], 0.6, 0.07)}<div class="specs__row" style="padding:0"><i class="rule" style="--d:0.9s"></i></div></dl>
  </div>`;
}

/* Scroll-driven parts of the program page */
function programFrame() {
  const i = state.active;
  const hero = $('[data-slot=hero]', programView), story = $('[data-slot=story]', programView), nextSlot = $('[data-slot=next]', programView);
  if (!hero || !story) return;
  const heroEl = $('.p-hero', programView);
  const t = easeIO(clamp01(scrollY / (heroEl.offsetHeight * 0.92)));
  slotTarget(hero, HERO_ROT, tmpA);
  slotTarget(story, STORY_ROT, tmpB);
  const s = sheets[i];
  for (const k of KEYS) s.tgt[k] = mix(tmpA[k], tmpB[k], t);
  s.float = t;
  const ni = (i + 1) % N;
  sheets.forEach((o, j) => {
    if (j === i) return;
    if (j === ni && nextSlot) {
      slotTarget(nextSlot, NEXT_ROT, o.tgt);
      const r = nextSlot.getBoundingClientRect();
      o.tgt.o = r.top < VH * 1.05 ? 1 : 0;
      o.float = 0.6;
    } else {
      carouselTarget(o, (j - i) * 2.6);
      o.tgt.o = 0;
    }
  });
  // logline: lines arrive as the story section scrolls past
  const storyEl = $('.p-story', programView);
  const prog = (scrollY - storyEl.offsetTop) / Math.max(1, storyEl.offsetHeight - VH);
  const items = storyEl.querySelectorAll('.p-logline li');
  items.forEach((li, k) => {
    const on = prog > -0.15 + (k / items.length) * 0.75;
    if (on && !li.classList.contains('is-in')) { li.classList.remove('is-out'); li.classList.add('is-in'); }
    if (!on && li.classList.contains('is-in')) { li.classList.remove('is-in'); li.classList.add('is-out'); }
  });
  // other sections reveal on entry
  programView.querySelectorAll('.p-text, .p-next').forEach((el) => {
    if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < VH * 0.8) reveal(el);
  });
  // page tone follows the section in the middle of the screen
  const mid = VH * 0.5;
  for (const el of programView.querySelectorAll('[data-tone]')) {
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) { if (pageBg.dataset.tone !== el.dataset.tone) setTone(el.dataset.tone); break; }
  }
}
function aboutFrame() {
  const slot = $('[data-slot=portrait]', aboutView);
  if (slot && portrait) { slotTarget(slot, [0.0, 0.16, -0.035], portrait.tgt); portrait.float = 1; }
  sheets.forEach((o, j) => { carouselTarget(o, (j - state.active) * 2.6); o.tgt.o = 0; });
}

/* =========================================================================
   Input
   ========================================================================= */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pointer = { x: 0, y: 0, nx: 0, ny: 0, inside: false };
function hitActive(e) {
  const s = sheets[state.active];
  if (!s || state.mode !== 'home') return false;
  ndc.set((e.clientX / VW) * 2 - 1, -(e.clientY / VH) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.intersectObject(s.mesh, false).length > 0;
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (state.mode !== 'home') return;
  canvas.setPointerCapture(e.pointerId);
  const onSheet = hitActive(e);
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, onSheet, spinMode: onSheet && !coarse, p0: state.target, spin0: sheets[state.active].spinTgt, samples: [[performance.now(), e.clientX]] };
  canvas.classList.add('is-dragging');
});
canvas.addEventListener('pointermove', (e) => {
  pointer.nx = (e.clientX / VW) * 2 - 1; pointer.ny = (e.clientY / VH) * 2 - 1; pointer.inside = true;
  if (!drag) {
    const over = hitActive(e);
    state.hoverWanted = over && !coarse;
    canvas.classList.toggle('is-over', over);
    return;
  }
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (Math.hypot(dx, dy) > 6) drag.moved = true;
  if (!drag.moved) return;
  hideScribble();
  if (drag.spinMode) sheets[state.active].spinTgt = drag.spin0 + dx * 0.011;
  else { state.target = clampP(drag.p0 - dx / (VW * (VW < 760 ? 0.6 : 0.34))); }
  drag.samples.push([performance.now(), e.clientX]);
  if (drag.samples.length > 6) drag.samples.shift();
});
function endDrag(e) {
  if (!drag) return;
  const d = drag; drag = null;
  canvas.classList.remove('is-dragging');
  if (!d.moved) {
    if (d.onSheet) location.hash = `#/${PROGRAMS[state.active].slug}`;
    return;
  }
  if (d.spinMode) {
    const s = sheets[state.active];
    s.spinTgt = Math.round(s.spinTgt / Math.PI) * Math.PI;
    return;
  }
  const [t0, x0] = d.samples[0], [t1, x1] = d.samples[d.samples.length - 1];
  const v = (x1 - x0) / Math.max(16, t1 - t0);
  state.target = clamp(Math.round(clampP(state.target - v * (VW < 760 ? 0.6 : 0.9))), 0, N - 1);
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', () => { pointer.inside = false; if (!drag) { state.hoverWanted = false; canvas.classList.remove('is-over'); } });

addEventListener('wheel', (e) => {
  if (state.mode !== 'home') return;
  e.preventDefault();
  const dy = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  const unit = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? VH : 1;
  state.target = clampP(state.target + dy * unit * 0.0032);
  hideScribble();
  scheduleSnap();
}, { passive: false });

addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (e.key === 'Escape') { if (!indexPanel.hidden) closeIndex(); else if (state.mode !== 'home') location.hash = '#/'; return; }
  if (state.mode !== 'home') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(state.active + 1); hideScribble(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(state.active - 1); hideScribble(); }
  if (e.key === 'Enter' && document.activeElement === body) location.hash = `#/${PROGRAMS[state.active].slug}`;
});

/* The loop also circles the next program's title on hover */
programView.addEventListener('pointerover', (e) => {
  const link = e.target.closest('.p-next__link');
  if (!link || coarse || link.dataset.circled) return;
  link.dataset.circled = '1';
  const t = $('.p-next__go', link).getBoundingClientRect();
  showScribble(null, rectCorners(t, 4));
});
programView.addEventListener('pointerout', (e) => {
  const link = e.target.closest('.p-next__link');
  if (!link || link.contains(e.relatedTarget)) return;
  delete link.dataset.circled;
  hideScribble();
});
addEventListener('scroll', () => { if (state.mode !== 'home' && scribbleOn) hideScribble(); }, { passive: true });

/* Index dropdown */
const indexBtn = $('.nav__index-btn'), indexPanel = $('#index-panel'), indexList = $('.index__list');
indexList.innerHTML =
  PROGRAMS.map((p, i) => `<li><a class="index__row" href="#/${p.slug}" data-i="${i}"><span${p.lang ? ` lang="${p.lang}"` : ''}>${p.homeTitle.join(' ')}</span><span>${p.short}</span></a></li>`).join('') +
  `<li class="index__group eyebrow">Brand work</li><li><a class="index__row" href="#/about"><span>Flywheel</span><span>2021–2025</span></a></li>` +
  `<li class="index__group eyebrow">Studio</li><li><a class="index__row" href="#/about"><span>About</span><span>New York</span></a></li><li><a class="index__row" href="mailto:${SITE.email}"><span>Email</span><span>${SITE.email}</span></a></li>`;
function openIndex() { indexPanel.hidden = false; indexBtn.setAttribute('aria-expanded', 'true'); }
function closeIndex() { indexPanel.hidden = true; indexBtn.setAttribute('aria-expanded', 'false'); }
indexBtn.addEventListener('click', (e) => { e.stopPropagation(); indexPanel.hidden ? openIndex() : closeIndex(); });
document.addEventListener('click', (e) => { if (!e.target.closest('.nav__index')) closeIndex(); });
indexList.addEventListener('click', (e) => {
  const a = e.target.closest('[data-i]');
  if (a && state.mode === 'home') { e.preventDefault(); goTo(+a.dataset.i); closeIndex(); }
});

/* =========================================================================
   Frame loop
   ========================================================================= */
let last = performance.now();
let settledFor = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state.mode === 'home' || state.mode === 'loading') {
    state.p += (state.target - state.p) * (reduced ? 1 : 1 - Math.exp(-dt * 6.5));
    sheets.forEach((s, i) => carouselTarget(s, i - state.p));
    const ai = clamp(Math.round(state.p), 0, N - 1);
    if (ai !== state.active) {
      state.active = ai; hideScribble();
      sheets.forEach((s, i) => { if (i !== ai) s.spinTgt = Math.round(s.spinTgt / (Math.PI * 2)) * Math.PI * 2; });
    }
    if (state.mode === 'home') {
      if (shownIndex !== ai && Math.abs(state.target - ai) < 0.5) showHomeText(ai);
      const settled = Math.abs(state.target - state.p) < 0.01 && !drag;
      settledFor = settled ? settledFor + dt : 0;
      const wantScribble = (state.hoverWanted || coarse) && settledFor > (coarse ? 0.35 : 0.12);
      if (wantScribble && !scribbleOn) showScribble(sheets[state.active]);
      if (!state.hoverWanted && !coarse && scribbleOn) hideScribble();
      sheets.forEach((s, i) => (s.liftTgt = i === state.active && state.hoverWanted ? 1 : 0));
    }
    if (portrait) { portrait.tgt.o = 0; }
  } else if (state.mode === 'program') {
    programFrame();
  } else if (state.mode === 'about') {
    aboutFrame();
  }
  // a little parallax from the pointer on the carousel
  const px = state.mode === 'home' && pointer.inside && !reduced ? pointer.nx * 0.16 : 0;
  const py = state.mode === 'home' && pointer.inside && !reduced ? -pointer.ny * 0.1 : 0;
  camera.position.x += (px - camera.position.x) * (1 - Math.exp(-dt * 3));
  camera.position.y += (py - camera.position.y) * (1 - Math.exp(-dt * 3));
  camera.lookAt(0, 0, 0);
  sheets.forEach((s) => s.update(dt, now));
  if (portrait) portrait.update(dt, now);
  if (markTrack && state.mode === 'home') markTrack(projectCorners(sheets[state.active]));
  if (markClock) tickMark(now);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* =========================================================================
   Lab: try alternatives without touching the defaults.
   Every choice lives in the link (?mark=tape&paper=cream ...), so any
   combination can be sent to someone. ?lab shows the panel; Shift+L toggles it.
   "Copy link" copies the current version without the panel.
   ========================================================================= */
const root = document.documentElement;
const TYPES = {
  zodiak: { family: "'Zodiak'" },
  gambetta: { family: "'Gambetta'", css: 'https://api.fontshare.com/v2/css?f[]=gambetta@300,400,401&display=swap' },
  caslon: { family: "'Libre Caslon Display'", css: 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&display=swap' },
  instrument: { family: "'Instrument Serif'", css: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap' },
};
const PAPERS = { warm: '#eeece8', cream: '#f2ebe0', white: '#f3f3f1', stone: '#e3dfd8' };
const ACCENTS = { oxblood: '#470000', brick: '#891a20', ink: '#121110' };
const GRAINS = { off: 0, soft: 0.11, strong: 0.22 };
const TILTS = { flat: 0.35, soft: 1, strong: 1.6 };

const LAB = {
  mark: { label: 'Selection mark', def: 'circle', options: [['circle', 'Circle'], ['grease', 'Grease pencil'], ['hang', 'Hanging marks'], ['tape', 'Tape'], ['hangtape', 'Tape + marks'], ['wire', 'Nail and wire'], ['box', 'Select box']], apply: (v) => setMark(v) },
  type: { label: 'Title type', def: 'zodiak', options: [['zodiak', 'Zodiak'], ['gambetta', 'Gambetta'], ['caslon', 'Libre Caslon'], ['instrument', 'Instrument Serif']], apply: (v) => {
    const t = TYPES[v];
    if (t.css && !document.querySelector(`link[data-type="${v}"]`)) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = t.css; l.dataset.type = v; document.head.appendChild(l);
    }
    root.style.setProperty('--serif', `${t.family}, 'Times New Roman', Georgia, serif`);
    root.dataset.type = v;
  } },
  paper: { label: 'Paper', def: 'warm', options: [['warm', 'Warm grey'], ['cream', 'Cream'], ['white', 'Cool white'], ['stone', 'Stone']], apply: (v) => root.style.setProperty('--paper', PAPERS[v]) },
  accent: { label: 'Accent', def: 'oxblood', options: [['oxblood', 'Oxblood'], ['brick', 'Brick red'], ['ink', 'Ink']], apply: (v) => root.style.setProperty('--oxblood', ACCENTS[v]) },
  grain: { label: 'Grain', def: 'soft', options: [['off', 'Off'], ['soft', 'Soft'], ['strong', 'Strong']], apply: (v) => root.style.setProperty('--grain', GRAINS[v]) },
  tilt: { label: 'Poster tilt', def: 'soft', options: [['flat', 'Flat'], ['soft', 'Soft'], ['strong', 'Strong']], apply: (v) => { tiltK = TILTS[v]; } },
  story: { label: 'Program story section', def: 'night', options: [['night', 'Night'], ['stone', 'Stone'], ['paper', 'Paper']], apply: (v) => {
    storyTone = v;
    const st = $('.p-story', programView);
    if (st) st.dataset.tone = v;
  } },
  loader: { label: 'Loader', def: 'on', options: [['on', 'On'], ['off', 'Off']], apply: (v) => { loaderOn = v === 'on'; } },
};
const lab = {};
for (const k in LAB) {
  const v = params.get(k);
  lab[k] = LAB[k].options.some(([o]) => o === v) ? v : LAB[k].def;
  LAB[k].apply(lab[k]);
}

const labEl = $('.lab');
function labLink(withPanel) {
  const u = new URL(location.href);
  for (const k in LAB) { if (lab[k] === LAB[k].def) u.searchParams.delete(k); else u.searchParams.set(k, lab[k]); }
  if (withPanel) u.searchParams.set('lab', ''); else u.searchParams.delete('lab');
  return `${u.origin}${u.pathname}${u.search.replace(/=(?=&|$)/g, '')}${u.hash}`;
}
function setLab(k, v) {
  lab[k] = v;
  LAB[k].apply(v);
  labEl.querySelectorAll(`[data-k="${k}"]`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
  history.replaceState(null, '', labLink(!labEl.hidden));
}
function buildLab() {
  labEl.innerHTML =
    `<div class="lab__head"><button type="button" class="lab__title" data-act="min" aria-expanded="true">Lab</button><span class="lab__actions"><button type="button" data-act="copy">Copy link</button><button type="button" data-act="reset">Reset</button><button type="button" data-act="close" aria-label="Close the lab">×</button></span></div>` +
    Object.entries(LAB).map(([k, d]) => `<div class="lab__row"><span class="lab__label">${d.label}</span><div class="lab__opts" role="group" aria-label="${d.label}">${d.options.map(([v, l]) => `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${lab[k] === v}">${l}${v === d.def ? '<i class="lab__live" title="The live site uses this"></i>' : ''}</button>`).join('')}</div></div>`).join('') +
    `<p class="lab__note">A dot marks what the live site uses. Every change is kept in the link; "Copy link" copies this exact version without the panel. Shift+L hides the lab.</p>`;
}
function toggleLab(on = labEl.hidden) {
  if (on && !labEl.innerHTML) {
    buildLab();
    if (VW < 760) { labEl.classList.add('is-min'); $('.lab__title', labEl).setAttribute('aria-expanded', 'false'); }
  }
  labEl.hidden = !on;
  history.replaceState(null, '', labLink(on));
}
labEl.addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.k) setLab(b.dataset.k, b.dataset.v);
  else if (b.dataset.act === 'close') toggleLab(false);
  else if (b.dataset.act === 'min') { const min = labEl.classList.toggle('is-min'); b.setAttribute('aria-expanded', String(!min)); }
  else if (b.dataset.act === 'reset') { for (const k in LAB) setLab(k, LAB[k].def); }
  else if (b.dataset.act === 'copy') {
    const link = labLink(false);
    try { await navigator.clipboard.writeText(link); b.textContent = 'Copied'; }
    catch { prompt('Copy this link', link); }
    setTimeout(() => (b.textContent = 'Copy link'), 1600);
  }
});
addEventListener('keydown', (e) => { if (e.shiftKey && (e.key === 'L' || e.key === 'l')) toggleLab(); });
if (params.has('lab')) toggleLab(true);

/* =========================================================================
   Boot: load, count, hang the posters
   ========================================================================= */
const counter = $('.loader__count');
const statusLabel = $('.nav__status');
async function boot() {
  const t0 = performance.now();
  let shown = 0;
  const tick = () => {
    const target = Math.min(100, ((performance.now() - t0) / 1400) * 100);
    shown = Math.max(shown, Math.floor(target));
    counter.textContent = shown;
    if (shown < 100) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  statusLabel.textContent = 'Hanging';
  requestAnimationFrame(frame);

  await Promise.race([
    Promise.all([document.fonts.load('300 40px Zodiak'), document.fonts.load('400 40px Zodiak'), document.fonts.load('500 20px Switzer')]),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  const imgs = await Promise.all(PROGRAMS.map((p) => (p.poster ? loadImage(p.poster) : Promise.resolve(null))));
  const portraitImg = await loadImage('img/portrait.jpg').catch(() => null);
  sheets = PROGRAMS.map((p, i) => {
    const img = imgs[i];
    const aspect = img ? img.width / img.height : 0.8;
    const front = img ? texFromImage(img) : texFromCanvas(cardCanvas(p, aspect));
    const back = texFromCanvas(backCanvas(p, img, aspect, i));
    const s = new Sheet(front, back, aspect, i * 1.7 + 0.3);
    return s;
  });
  if (portraitImg) {
    portrait = new Sheet(texFromCanvas(portraitCanvas(portraitImg)), texFromCanvas(plainBackCanvas()), 0.92, 9.1);
    portrait.tgt.o = 0; portrait.snap();
  }
  // start edge-on, far back, then hang one by one
  sheets.forEach((s, i) => {
    carouselTarget(s, i);
    Object.assign(s.cur, s.tgt, loaderOn ? { z: s.tgt.z - 5, ry: s.tgt.ry + Math.PI * 0.5, y: s.tgt.y - 0.6, o: 0 } : { o: 0 });
    s.rate = loaderOn ? 3.2 : 6;
  });
  const wait = loaderOn ? Math.max(0, 1450 - (performance.now() - t0)) : 0;
  await new Promise((r) => setTimeout(r, wait));
  counter.textContent = '100';
  body.classList.remove('is-loading');
  body.classList.add('is-ready');
  statusLabel.textContent = 'Index';
  state.ready = true;
  state.mode = 'loading';
  sheets.forEach((s, i) => setTimeout(() => { s.rate = 3.4 + i * 0.2; }, i * 110));
  setTimeout(() => {
    const h = location.hash.replace(/^#\/?/, '');
    if (h) route();
    else { enterHome(); document.querySelectorAll('.home__corner').forEach((el) => reveal(el)); }
  }, reduced ? 0 : 650);
}
boot().catch((err) => { console.error(err); body.classList.add('is-ready'); });
