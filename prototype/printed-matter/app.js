import * as THREE from 'three';
// pictures hook (owned by the pictures builder)
import { picturesHTML, picturesFrame, picturesEnter, picturesLeave } from './pictures.js';

/* =========================================================================
   Content. Facts are written out; anything in her voice is a placeholder
   (ph) naming what goes there and which interview question fills it.
   ========================================================================= */
const SITE = { linkedin: 'https://www.linkedin.com/in/vanessaespin', headline: 'Brand curator of events and experience' };

// The interview (published separately): question number -> what it fills.
const INTERVIEW = {
  q01: 'Her position in one breath (EN and ES)', q02: 'From brand jobs to “more than a role, it’s a mission”',
  q03: 'Herencia Viva', q04: 'Iyuana, and how to credit her role beside the Sápara artists', q05: 'The Ayazamana night',
  q06: 'The poster process', q07: 'Brand habits brought into a gallery', q08: 'A brand case', q09: 'What she’d never say; where home shows',
  q10: 'Earlier work', q11: 'An unrealized project', q12: 'Three words, plus anything else',
};
// A placeholder: [label] in the accent, with the interview question(s) that will fill it.
// ph('Iyuana in her words · 5–6 short lines', 'q04') or ph('…', '', 'To come: …') for things that aren't hers to write.
// The note (which question, or what is needed) is the title for a pointer and hidden text
// for a screen reader, since a title alone never reaches keyboard or touch users.
function phSpan(text, qs = '', note = '', spoken = true) {
  const list = qs.split(/[\s,]+/).filter(Boolean);
  const nums = list.map((q) => +q.slice(1));
  const said = nums.length > 1 ? `${nums.slice(0, -1).join(', ')} and ${nums[nums.length - 1]}` : nums[0];
  const asked = list.map((q) => INTERVIEW[q]).filter(Boolean).join('; ');
  const title = note || (list.length ? `Her words go here · interview question${nums.length > 1 ? 's' : ''} ${said}${asked ? `: ${asked}` : ''}` : 'To come');
  return `<span class="ph"${list.length ? ` data-q="${list.join(' ')}"` : ''} title="${title}">${text}${spoken ? `<span class="vh"> (${title})</span>` : ''}</span>`;
}
const ph = (label, qs, note) => phSpan(`[${label}]`, qs, note);
// A placeholder spread over several masked lines: the first opens the bracket, the last closes it
// (and carries the note for screen readers, once).
const phLines = (lines, qs, tail = '') => lines.map((t, i) => phSpan(`${i === 0 ? '[' : ''}${t}${i === lines.length - 1 ? `]${tail}` : ''}`, qs, '', i === lines.length - 1));
const PHOTOS = 'Her photographs go here, with the photographer’s credit';
// Real pictures for the documentation tool, from [file, width, height, caption, its own credit if it differs].
// fit: 'cover' for event photographs, 'contain' for artworks and designs (never cropped or shown above 1.2x).
// Alt text is the caption; a placeholder caption gets a neutral alt instead.
const pictures = (folder, name, fit, credit, list) => list.map(([file, w, h, cap, own], k) => ({ src: `img/${folder}/${file}`, w, h, fit, cap, credit: own || credit, alt: cap.includes('<') ? `${name}, photograph ${k + 1}` : cap }));
const WITH_PERMISSION = 'Their words go here, only with their permission';

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
      logline: phLines(['Iyuana,', 'in her words:', 'what it was,', 'who it was with,', 'why it mattered'], 'q04', ' · q04'),
      lead: ph('Iyuana in her words: what she did, and how her role sits beside the artists and the Sápara Nation · 2–3 sentences', 'q04'),
      docs: pictures('iyuana', 'Iyuana', 'cover', `Photographs: ${ph('photographer credit')}`, [['01-dscf4842.jpg', 1800, 1200, 'Detail'], ['02-dscf4619.jpg', 1800, 1200, 'Installation view'], ['03-dscf4633.jpg', 1800, 1200, 'A print, up close'], ['04-dscf4801.jpg', 1800, 1200, 'The prints in the room'], ['05-dscf4629.jpg', 1800, 1200, 'On the table'], ['06-dscf4758.jpg', 1800, 1200, 'The room'], ['07-dscf4762.jpg', 1800, 1200, ph('who is speaking', 'q04')], ['08-dscf4822.jpg', 1800, 1200, 'The circle'], ['09-dscf4825.jpg', 1800, 1200, 'Candles'], ['10-dscf4848.jpg', 1800, 1200, 'Everyone']]),
      list: { label: 'Artists', rows: [['Yanda Montahuano', 'Filmmaker & photographer, Ecuador'], ['Li Can Vega', 'CGI visual artist, Peru'], ['Armando Vega', 'Photographer, Mexico'], ['Israel Vargas “Panchis”', 'Photographer, Ecuador']] },
      voice: ph('A line from one of the artists, with their permission', '', WITH_PERMISSION),
      voiceBy: ph('artist · discipline · country', '', WITH_PERMISSION),
      credit: [['Identity, poster & campaign', 'Vanessa Espín'], ['Her relationship to the Sápara Nation', ph('as she describes it · one line', 'q04')], ['How the poster was made', ph('how she made it · 1–2 lines', 'q06')]],
    },
  },
  {
    slug: 'ayazamana', name: 'Ayazamana', poster: 'img/ayazamana.png', short: 'Jul 2026',
    homeTitle: ['Ayazamana'],
    pageTitle: ['Ayazamana'],
    specs: [['Poster', 'Vanessa Espín'], ['Performers', 'Ayazamana Dance Group'], ['When', 'Saturday, July 11, 2026']],
    blurbs: [['The night', 'Live music and<br>traditional dance'], ['With', 'The Ecuadorian American<br>Cultural Center']],
    back: { title: 'Ayazamana', lines: ['Live music & traditional dance', 'Ecuadorian American Cultural Center', 'Saturday, July 11, 2026, 8 PM'] },
    page: {
      credits: [['Poster', 'Vanessa Espín'], ['Performers', 'Ayazamana Dance Group']],
      specs: [['Type', 'Live music & traditional dance'], ['When', 'Saturday, July 11, 2026, 8 PM'], ['With', 'Ecuadorian American Cultural Center'], ['Her role', ph('her role on the night · q05', 'q05')]],
      logline: phLines(['Ayazamana,', 'in her words:', 'the night,', 'the dancers,', 'her part in it'], 'q05', ' · q05'),
      lead: ph('The night in her words: what it was, and what she did beyond the poster · 2–3 sentences', 'q05'),
      docs: ['The stage · photographer credit', 'The Ayazamana Dance Group · in performance', 'The musicians', 'The audience · the room that night', 'After · the dancers with guests'],
      list: { label: 'Performers', rows: [['Ayazamana Dance Group', 'The Ecuadorian American Cultural Center’s traditional dance group, founded in 1992 by José Rivera. Dances from La Costa, La Sierra and El Oriente.']] },
      voice: ph('A line from the Ayazamana Dance Group, with their permission', '', WITH_PERMISSION),
      voiceBy: ph('dancer or director · Ayazamana Dance Group', '', WITH_PERMISSION),
      credit: [['How the poster was made', ph('how she made it · 1–2 lines', 'q06')]],
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
      specs: [['Type', 'Painting exhibition'], ['Where', 'Flushing Town Hall, 137-35 Northern Blvd, Flushing'], ['When', 'May 29–31, 2026'], ['With', 'Ayllu Gallery']],
      logline: phLines(['Herencia Viva,', 'in her words:', 'the paintings,', 'the painter,', 'why it mattered'], 'q03', ' · q03'),
      lead: ph('Herencia Viva in her words: what she did with Luis Medina and Ayllu Gallery, and why these paintings · 2–3 sentences', 'q03'),
      docs: pictures('herencia-viva', 'Herencia Viva', 'contain', 'Paintings: Luis Medina', [['01-threads-of-memory.jpg', 1060, 1412, 'Threads of Memory · the campaign', 'Design: Vanessa Espín'], ['02-gallery-wall.jpg', 552, 526, 'Installation view'], ['03-meninas-detail.jpg', 550, 666, 'Meninas Ancestrales · detail'], ['04-andean-figures.jpg', 554, 666, 'Painting'], ['05-village-painting.jpg', 414, 444, 'Painting'], ['06-fish-in-the-city.jpg', 550, 670, 'The poster’s fish, in New York', 'Design: Vanessa Espín'], ['07-shirt-back.jpg', 552, 670, 'The shirt', 'Design: Vanessa Espín'], ['08-studio.jpg', 552, 666, 'Paintings in a studio']]),
      voice: ph('A line from Luis Medina, with his permission', '', WITH_PERMISSION),
      voiceBy: ph('Luis Medina · painter', '', WITH_PERMISSION),
      credit: [['Curation, poster & promotional materials', 'Vanessa Espín'], ['How the poster was made', ph('how she made it · 1–2 lines', 'q06')]],
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
      specs: [['Where', 'New York'], ['When', 'Sep 2025 – Apr 2026']],
      logline: phLines(['The Center,', 'in her words:', '“more than a role,', 'it’s a mission”:', 'what that meant'], 'q02', ' · q02'),
      did: ['Direct daily operations of the cultural center, managing scheduling, administrative functions, and facility coordination', 'Plan and execute cultural programs and events, increasing community engagement and strengthening stakeholder relationships', 'Manage cross-functional projects, coordinating with internal teams and external partners to meet organizational goals', 'Initiate fundraising and partnership development efforts by identifying new opportunities, conducting outreach, and building relationships with prospective sponsors'],
      docs: ['The Center · photographer credit', 'A program · in progress', 'The community · at an event', 'Behind the scenes · the daily work'],
      voice: ph('A line from a partner or colleague at the Center, with their permission', '', WITH_PERMISSION),
      voiceBy: ph('name · role', '', WITH_PERMISSION),
    },
  },
];
const N = PROGRAMS.length;

// Brand work: facts from her LinkedIn.
const BRANDS = [
  { name: 'Flywheel', years: '2021–2025', role: 'Art Direction Design Specialist', dates: 'Jun 2021 – May 2025', facts: ['Design strategy for over 20 brands', 'Primary liaison for one of Flywheel’s largest accounts', 'Amazon and Walmart brand stores, A+ content, carousel imagery and paid ads'] },
  { name: 'Enchante Accessories', years: '2020–2021', role: 'Brand designer, E-commerce Division', dates: 'Aug 2020 – Feb 2021', facts: ['Amazon store pages and Shopify assets', 'Visual styles for 3 brands', 'Product infographics', 'E-commerce photography direction for beauty products', 'Social ad campaigns'] },
  { name: 'Humane Lane', years: '2025–', role: 'Brand development project, for Heidi Pearl', dates: 'Apr 2025 – present', facts: ['Brand development strategy', 'Art direction'] },
];
const CASE = [
  ['Objective', `Design strategy for over 20 brands on one of Flywheel’s largest accounts, as its primary liaison. ${ph('the brief in one line', 'q08')}`],
  ['Insight', ph('what she saw that shaped the work · one sentence', 'q08')],
  ['Idea', ph('the principle she brought to the portfolio · one sentence', 'q08')],
  ['Execution', `Amazon and Walmart brand stores, A+ content, carousel imagery and paid ads. ${ph('what she can show, with permission', '', 'To come: the work Flywheel and the client allow her to show')}`],
  ['Result', ph('a sourced result, or cut this', '', 'Only a result with a source; otherwise this column goes')],
];
// Earlier work, from her old site: year · title · kind · role.
const ARCHIVE = [
  ['2021', '100 Roses of Concrete', 'Awareness campaign · Live Light Live Right', 'Art director & lead designer'],
  ['2020', 'Outside the Pink Box', 'Case study · workplace gender bias', null],
  ['2019', 'The Dinner Table Doc', 'Non-profit campaign · Wunderman Thompson', 'Co-art director'],
  ['2019', 'ZARA Loyalty Program', 'App and print concept', null],
  ['2019', 'Purell', 'Out-of-home and print', null],
  ['2018', 'Pure Leaf', 'Magazine ad', null],
  ['2018', 'BOLD Cosmetics', 'Identity, book, website', null],
];
// Selected experience, as she lists it on LinkedIn.
const EXPERIENCE = [
  ['Creative Director, Brand & Experience', 'Sápara Nation art exhibition (Iyuana)', 'Jun 2026 – present'],
  ['Creative Director, Brand & Experience', 'Ayllu Gallery · Luis Medina exhibition project (Herencia Viva)', 'Apr – Jun 2026'],
  ['Creative & Community Coordinator', 'Ecuadorian American Cultural Center', 'Sep 2025 – Apr 2026'],
  ['Brand development project', 'Humane Lane (Heidi Pearl)', 'Apr 2025 – present'],
  ['Art Direction Design Specialist', 'Flywheel', 'Jun 2021 – May 2025'],
  ['Brand designer, E-commerce Division', 'Enchante Accessories', 'Aug 2020 – Feb 2021'],
];
const EDUCATION = [['BA, Communication Design', 'City Tech (CUNY)', 'President of the Art + Design Club']];

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
const HIT_MAT = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });

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
    // what the pointer's ray tests: the sheet as two triangles, never drawn
    this.hit = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1), HIT_MAT);
    this.hit.visible = false;
    this.spinner.add(this.hit);
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
    // Home, pin=hover: flat is 1 when the sheet is stuck flat to the wall (eased by a clock,
    // see setFlat), hung is 1 while it floats a little off the wall. Both stay 0 with pin=off,
    // which is the snapshot's sheet exactly.
    this.flat = 0; this.flatTo = 0; this.flatFrom = 0; this.flatT0 = 0;
    this.hung = 0; this.hungTgt = 0;
    this.hangRz = 0;
  }
  snap() { Object.assign(this.cur, this.tgt); }
  // Pinning flattens in 280 ms; lifting off the wall takes 200 ms (both ease out).
  setFlat(v, now) {
    if (this.flatTo === v) return;
    this.flatTo = v; this.flatFrom = this.flat; this.flatT0 = now;
  }
  arrived() {
    const c = this.cur, g = this.tgt;
    // close enough that the 280 ms flatten covers the rest of the glide
    return Math.abs(c.x - g.x) + Math.abs(c.y - g.y) + Math.abs(c.z - g.z) < 0.09 && Math.abs(c.s - g.s) < 0.03 && Math.abs(c.ry - g.ry) + Math.abs(c.rx - g.rx) < 0.04
      && Math.abs(this.spin - this.spinTgt) < 0.03 && Math.abs(this.spinVel) < 0.4;
  }
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
    this.hung += (this.hungTgt - this.hung) * (reduced ? 1 : 1 - Math.exp(-dt * 5));
    const ft = reduced ? 1 : clamp01((t - this.flatT0) / 1000 / (this.flatTo ? 0.28 : 0.2));
    this.flat = mix(this.flatFrom, this.flatTo, 1 - (1 - ft) ** 3);
    // F: flat against the wall (no tilt, curl, wave, lift or float); Hh: a bit off the wall.
    const F = this.flat, Hh = this.hung * (1 - F), lift = this.lift * (1 - F);
    const f = (reduced ? 0 : this.float) * (1 - F);
    const ts = t * 0.001;
    const fy = Math.sin(ts * 0.62 + this.seed) * 0.022 * f;
    const fr = Math.sin(ts * 0.47 + this.seed * 2.3) * 0.022 * f;
    this.group.position.set(c.x, c.y + fy, c.z + lift * 0.22 + Hh * 0.05);
    this.group.rotation.set((c.rx + fr * 0.6) * (1 - F), (c.ry + fr) * (1 - F), (c.rz + fr * 0.3 + Hh * this.hangRz) * (1 - F));
    this.group.scale.setScalar(Math.max(c.s, 0.0001));
    this.spinner.rotation.y = this.spin;
    this.group.visible = c.o > 0.004;
    const u = this.mat.uniforms;
    u.uBend.value = this.bend * (1 - F);
    u.uTime.value = ts;
    u.uOpacity.value = c.o;
    u.uLift.value = lift;
    u.uCurl.value = reduced ? 0 : (0.045 + Hh * 0.045 + lift * 0.05) * (1 - F);
    u.uWave.value = reduced ? 0 : (0.1 + Math.abs(this.bend) * 0.3) * (1 - F);
    // the shadow: softer and larger while hung, a tight contact line once pinned
    let so = 0.2 - lift * 0.05 - Hh * 0.05, sx = 0.05 + lift * 0.05 + Hh * 0.03, sy = -0.08 - lift * 0.06 - Hh * 0.04, sz = -0.4 - Hh * 0.12, blur = 0.16 + Hh * 0.08;
    if (F) { so = mix(so, 0.6, F); sx = mix(sx, 0.006, F); sy = mix(sy, -0.011, F); sz = mix(sz, -0.02, F); blur = mix(blur, 0.035, F); }
    this.shadowMat.uniforms.uOpacity.value = c.o * so;
    this.shadowMat.uniforms.uBlur.value = blur;
    this.shadow.position.set(sx, sy, sz);
    this.shadow.scale.x = Math.max(0.1, Math.abs(Math.cos(this.spin))) * (1 + Hh * 0.04 + F * 0.04);
    this.shadow.scale.y = 1 + Hh * 0.04 + F * 0.04;
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

// fit: the title stays inside the rule (a cover); without it, the snapshot's larger type (poster=table)
function cardCanvas(p, aspect, fit) {
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
  g.font = `400 ${W * (fit ? 0.12 : 0.128)}px Zodiak`;
  g.letterSpacing = `-${W * 0.0015}px`;
  let y = W * 0.25;
  for (const l of ['ECUADORIAN', 'AMERICAN', 'CULTURAL', 'CENTER']) { g.fillText(l, x, y); y += W * (fit ? 0.11 : 0.118); }
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
// the card's face, one per type size (a cover or the snapshot's table), drawn the first time it is needed
const cardFaces = {};
const cardFace = (p, aspect) => { const fit = isCover(); return (cardFaces[fit] ||= texFromCanvas(cardCanvas(p, aspect, fit))); };
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
   ?mark=none (default: no mark anywhere, the next program's title included) | circle (the
   snapshot) | grease | hang | tape | hangtape | wire | box, also chosen in the lab (see Lab below).
   ========================================================================= */
const SVGNS = 'http://www.w3.org/2000/svg';
const markLayer = $('#marks');
const MARK_NAMES = ['none', 'circle', 'grease', 'hang', 'tape', 'hangtape', 'wire', 'box'];
const params = new URLSearchParams(location.search);
let markName = MARK_NAMES.includes(params.get('mark')) ? params.get('mark') : 'none';
// markSheet: the poster the mark is drawn on (the frame loop keeps it on that sheet)
let scribbleOn = false, markTrack = null, markToken = 0, markClock = null, markSheet = null;

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
      const { outer, inner } = tapeStrip();
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

/* The tape (lab tape=on): the poster stuck to the wall (pin=hover) gets a strip of tape
   across each corner. It is a state of the poster, not a hover mark: it has its own layer
   (#pins, under the marks), and the frame loop places the strips on the sheet every frame.
   Pressed on one by one (TL, TR, BR, BL, 70 ms apart, 160 ms each) once the sheet is flat;
   peeled off in 100 ms when it leaves. */
const pinLayer = $('#pins');
const PIN_CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];
const PIN_AT = 0.28, PIN_GAP = 0.07, PIN_PRESS = 0.16, PIN_PEEL = 0.1;
let pins = []; // { sheet, t0, leaveAt, strips: [{ outer, tilt, len }] }
// one strip of masking tape (translucent, torn at both ends), 1 unit long, centred on 0,0
function tapeStrip(parent = markLayer) {
  const outer = svg('g', {}, parent);
  const inner = svg('g', { class: 'tape' }, outer);
  const L = 1, H = 0.27;
  const jag = (side) => Array.from({ length: 6 }, (_, i) => [side * (L / 2 + (Math.random() - 0.5) * 0.05), -H / 2 + (H * i) / 5]);
  const left = jag(-1), right = jag(1).reverse();
  svg('polygon', { class: 'tape__body', points: [...left, ...right].map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ') }, inner);
  return { outer, inner };
}
function pinShow(sheet, now) {
  const live = pins.find((p) => !p.leaveAt);
  if (live && live.sheet === sheet) return;
  pinRelease(now);
  // each strip ±6° off the diagonal and ±10% in length: put up by hand
  const strips = PIN_CORNERS.map(() => ({ ...tapeStrip(pinLayer), tilt: (Math.random() - 0.5) * 12, len: 1 + (Math.random() - 0.5) * 0.2 }));
  strips.forEach((s) => (s.outer.style.opacity = '0'));
  pins.push({ sheet, t0: now, leaveAt: 0, strips });
}
function pinRelease(now) {
  for (const p of pins) if (!p.leaveAt) p.leaveAt = now;
}
function tickPins(now) {
  if (!pins.length) return;
  pins = pins.filter((p) => {
    const lt = p.leaveAt ? (now - p.leaveAt) / 1000 : -1;
    if (lt > PIN_PEEL + 0.02) { p.strips.forEach((s) => s.outer.remove()); return false; }
    const P = quadMap(projectCorners(p.sheet));
    const t = (now - p.t0) / 1000, size = Math.max(30, P.w * 0.18);
    const peel = lt < 0 ? 0 : clamp01(lt / PIN_PEEL);
    PIN_CORNERS.forEach(([u, v], k) => {
      const s = p.strips[k];
      // reduced motion: all four fade in together, no scale
      const a = reduced ? clamp01((t - PIN_AT) / 0.2) : clamp01((t - PIN_AT - k * PIN_GAP) / PIN_PRESS);
      s.outer.style.opacity = (a * (1 - peel)).toFixed(3);
      if (reduced && lt >= 0) return; // reduced motion: the strips fade where they were
      const sc = (reduced ? 1 : 1.06 - 0.06 * E_OUT(a)) * (1 + 0.03 * peel);
      // across the corner: at right angles to the bisector of its two edges
      const K = P(u, v), inward = unit(add(unit(sub(P(1 - u, v), K)), unit(sub(P(u, 1 - v), K))));
      const ang = (Math.atan2(-inward[0], inward[1]) * 180) / Math.PI + s.tilt;
      const at = add(add(K, mul(inward, size * 0.08)), [0, reduced ? 0 : -3 * peel]);
      s.outer.setAttribute('transform', `translate(${pt(at)}) rotate(${ang.toFixed(1)}) scale(${(size * s.len * sc).toFixed(1)})`);
    });
    return true;
  });
}

function showScribble(sheet, corners) {
  if (reduced || markName === 'none') return;
  const token = ++markToken;
  markLayer.replaceChildren();
  markTrack = null; markClock = null;
  const c = corners || projectCorners(sheet);
  MARKS[markName](c, sheet);
  scribbleOn = token; markSheet = sheet;
  markLayer.dataset.sheet = sheet ? sheets.indexOf(sheet) : '';
}
// at once: no erase, the mark is simply gone (the turn is taking the page away)
function hideScribble(atOnce = false) {
  if (!scribbleOn) return;
  scribbleOn = false;
  markTrack = null;
  if (atOnce) { ++markToken; markClock = null; markLayer.replaceChildren(); return; }
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
const brandView = $('.brand');
const archiveView = $('.archive');
const pageViews = [programView, aboutView, brandView, archiveView];
// tw: the glide of one wheel step (step=notch), { from, to, t0, dur }
const state = { p: 0, target: 0, mode: 'loading', active: 0, hoverWanted: false, ready: false, tw: null };
let sheets = [], portrait = null;
let tiltK = 1, storyTone = 'night', loaderOn = true, aboutMode = 'drawer';
// Visual pass 1: the lab switches (see LAB below). Each default is the new behaviour; one
// option of each reproduces the snapshot (the site as tagged stage-2026-11-04).
//   pin    hover | off           home: every poster hangs tilted; the one under the pointer sticks flat to the wall
//   tape   off | on              home: the stuck poster gets four tapes (both off in the snapshot)
//   step   notch | free          home: one wheel notch, one poster, with the flock
//   poster cover | faded | table  program: the poster as the hero's cover
//   next   turn | click          program: the next poster turns into the next cover
//   held   on | off              Iyuana: the held light before the documentation
//   drift  on | off              Herencia Viva: paintings drift past the type
const VIS = { pin: 'hover', tape: 'off', step: 'notch', poster: 'cover', next: 'turn', held: 'on', drift: 'on' };
// homeRates: the entry flight back to the carousel is over and the follow rates are the carousel's own
let homeRates = false;
// viewHash: the route of the view on screen (null before the first one); the About drawer opens over it.
let viewHash = null, navToken = 0, currentNav = 'programs';
// pictures hook (owned by the pictures builder): picturesFrame runs only between picturesEnter and picturesLeave
let picturesOn = false;
const picCtx = { root: null, scrollY: 0, vh: 0, vw: 0, reduced, coarse, i: 0, p: null, vis: VIS, resetDocs: (st) => stepDocs(st, -(+st.dataset.i)) };
function leavePictures() { if (picturesOn) { picturesOn = false; picturesLeave(); } }
// A lab switch (held, drift) changed: swap the pictures section of the program on screen, in place.
function rePictures() {
  if (!state.ready || state.mode !== 'program' || !picturesOn) return;
  leavePictures();
  programView.querySelectorAll('[data-pictures]').forEach((el) => el.remove());
  $('.p-story', programView).insertAdjacentHTML('afterend', picturesHTML(PROGRAMS[state.active], state.active, VIS));
  picturesOn = true; picturesEnter(programView, PROGRAMS[state.active], state.active);
}

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
// The journey (poster=cover|faded, next=turn): the cover hangs upright, flat on the wall;
// the next poster waits on the pile, about 5° askew with one corner lifted.
const COVER_ROT = [0.0, 0.0, 0.0];
const NEXT_ROT_TURN = [-0.86, 0.0, -0.087];
const NEXT_LIFT = 0.55;
const tmpA = {}, tmpB = {};
// flight: home -> program with the press (poster != table), { t0, i, flat }.
// turn: the next poster's hand-off (next=turn), { t0, ni, pose, tok }.
// push: the deliberate push past the end of a program page (wheel or touch).
// pendingGo: a turn that ended under the About drawer; it goes when the drawer closes.
const journey = { flight: null, turn: null, endAt: 0, pendingGo: null };
const push = { acc: 0, last: -1e9, armed: false, touchY: null };
const isCover = () => VIS.poster !== 'table';

const clampP = (v) => clamp(v, -0.25, N - 0.75);
let snapTimer = 0;
function scheduleSnap(ms = 170) {
  clearTimeout(snapTimer);
  snapTimer = setTimeout(() => { state.target = clamp(Math.round(state.target), 0, N - 1); }, ms);
}
function goTo(i) { state.target = clamp(i, 0, N - 1); }

/* One notch, one poster (step=notch). A wheel step glides 0.51 s on A24's
   cubic-bezier(.32,.72,0,1). The filter: deltas add up to a step at 50 px (a mouse notch
   is one event of about 100; a trackpad sends many small ones). After a step the wheel is
   locked until the glide is mostly done (at most 400 ms), and the tail of a flick, a
   decaying stream with no pause, never re-arms it: a pause, a fresh harder push or a
   sustained one does. */
const E_GLIDE = bez(0.32, 0.72, 0, 1);
const GLIDE = 0.51, NOTCH_PX = 50, NOTCH_LOCK = 400, NOTCH_PAUSE = 150;
const glideAt = (now) => (state.tw ? E_GLIDE(clamp01((now - state.tw.t0) / 1000 / state.tw.dur)) : 1);
function stepTo(dir, now) {
  const from = state.tw ? state.tw.to : clamp(Math.round(state.target), 0, N - 1);
  const to = clamp(from + dir, 0, N - 1);
  if (to === from) return false;
  state.target = to;
  state.tw = reduced ? null : { from: state.p, to, t0: now, dur: GLIDE };
  return true;
}
const wheelF = { acc: 0, last: -1e9, armed: true, stepAt: -1e9, avg: 0, peak: 0 };
function wheelNotch(d, now) {
  const w = wheelF, mag = Math.abs(d);
  if (now - w.last > NOTCH_PAUSE) { w.acc = 0; w.avg = 0; w.peak = 0; w.armed = true; } // a new gesture
  w.last = now;
  const rising = w.peak > 0 && mag > w.peak * 1.5;
  w.avg = w.avg ? mix(w.avg, mag, 0.3) : mag;
  w.peak = Math.max(w.peak, w.avg);
  const since = now - w.stepAt;
  if (since < NOTCH_LOCK && glideAt(now) < 0.9) return false;
  if (!w.armed) {
    if ((rising && since > 190) || (since > 480 && w.avg >= 0.8 * w.peak)) { w.armed = true; w.acc = 0; } else return false;
  }
  if (w.acc && Math.sign(d) !== Math.sign(w.acc)) w.acc = 0;
  w.acc += d;
  if (Math.abs(w.acc) < NOTCH_PX) return false;
  const dir = Math.sign(w.acc);
  w.acc = 0;
  if (!stepTo(dir, now)) return false;
  w.armed = false; w.stepAt = now;
  return true;
}

function setTone(tone) {
  pageBg.dataset.tone = tone;
  body.classList.toggle('is-night', tone === 'night');
}
function setNav(which) {
  currentNav = which;
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-current', a.dataset.nav === which));
}
// Leaving a page view: its revealed parts slide out, then it empties.
function leavePages(keep) {
  const leaving = pageViews.filter((v) => v !== keep && !v.hidden);
  leaving.forEach((v) => v.querySelectorAll('.is-in').forEach(conceal));
  return leaving;
}
function clearPages(keep) {
  pageViews.forEach((v) => { if (v !== keep) { v.hidden = true; v.innerHTML = ''; } });
}

function enterHome() {
  leavePictures(); // pictures hook (owned by the pictures builder)
  journey.flight = null; journey.turn = null; journey.pendingGo = null;
  const from = state.mode;
  state.mode = 'home';
  body.classList.add('is-home'); body.classList.remove('is-scroll');
  setNav('programs'); setTone('paper');
  sheets.forEach((s) => { s.rate = from === 'loading' ? 4.2 : 5.5; s.float = 1; });
  homeRates = false; state.tw = null;
  if (portrait) portrait.tgt.o = 0;
  const leaving = leavePages(null);
  const tok = ++navToken;
  setTimeout(() => {
    if (tok !== navToken) return;
    clearPages(null);
    scrollTo(0, 0);
    home.hidden = false;
    showHomeText(state.active, true);
    document.querySelectorAll('.home__corner').forEach((el) => reveal(el));
    setTimeout(() => { sheets.forEach((s) => (s.rate = 9)); if (tok === navToken) homeRates = true; }, 900);
  }, leaving.length ? 450 : 0);
}

function enterProgram(i) {
  leavePictures(); // pictures hook (owned by the pictures builder)
  hideScribble();
  journey.pendingGo = null;
  const fromHome = state.mode === 'home';
  if (state.mode !== 'program') journey.turn = null; // a turn cut short by leaving the page
  // poster=cover|faded: the clicked poster presses and springs, the others fall back, then it flies
  const press = fromHome && isCover() && !reduced && !!sheets[i];
  journey.flight = press ? { t0: performance.now(), i, flat: sheets[i].flatTo === 1 } : null;
  state.mode = 'program';
  state.active = i; state.target = state.p = i;
  body.classList.remove('is-home');
  setNav('programs');
  [homeTitle, homeSpecs, homeBlurbs].forEach(conceal);
  document.querySelectorAll('.home__corner').forEach(conceal);
  if (portrait) portrait.tgt.o = 0;
  const others = leavePages(programView);
  const tok = ++navToken;
  const build = () => {
    if (tok !== navToken) return;
    home.hidden = true;
    clearPages(programView);
    const hadFocus = programView.contains(document.activeElement); // the link that opened this page goes with the old DOM
    programView.innerHTML = programHTML(i);
    programView.classList.remove('is-leaving');
    programView.hidden = false;
    picturesOn = true; picturesEnter(programView, PROGRAMS[i], i); // pictures hook (owned by the pictures builder)
    body.classList.add('is-scroll');
    scrollTo(0, 0);
    fitHeroTitle();
    if (hadFocus) { const t = $('.p-title', programView); t.tabIndex = -1; t.focus({ preventScroll: true }); }
    // the flight and the turn hand over here: the poster glides on into the new hero slot
    const flew = !!journey.flight;
    journey.flight = null;
    if (journey.turn) {
      sheets[i].liftTgt = 0; journey.turn = null;
      sheets.forEach((s, j) => { if (j !== i) s.cur.o = 0; }); // the old poster is off screen: it doesn't cross the new page
    }
    sheets.forEach((s, j) => { s.rate = flew && j !== i ? 14 : 4.6; s.spinTgt = Math.round(s.spinTgt / (Math.PI * 2)) * Math.PI * 2; });
    requestAnimationFrame(() => {
      const hero = $('.p-hero', programView);
      setTimeout(() => reveal(hero), fromHome ? 260 : 120);
      setTimeout(() => sheets.forEach((s) => (s.rate = 7)), 1300);
    });
  };
  setTimeout(build, fromHome || others.length ? (press ? FLIGHT_BUILD : 380) : 0);
}

// A page without WebGL slots of its own (About as a page, Brand work, Earlier work): the
// posters are parked out of sight by pageFrame, as on the old About page.
function enterPage(mode, view, html, nav, tone, after) {
  leavePictures(); // pictures hook (owned by the pictures builder)
  journey.flight = null; journey.turn = null; journey.pendingGo = null;
  hideScribble();
  state.mode = mode;
  body.classList.remove('is-home');
  setNav(nav); setTone(tone);
  [homeTitle, homeSpecs, homeBlurbs].forEach(conceal);
  document.querySelectorAll('.home__corner').forEach(conceal);
  leavePages(view);
  if (!view.hidden) view.querySelectorAll('.is-in').forEach(conceal);
  const tok = ++navToken;
  setTimeout(() => {
    if (tok !== navToken) return;
    home.hidden = true;
    clearPages(view);
    view.innerHTML = html; view.hidden = false;
    body.classList.add('is-scroll'); scrollTo(0, 0);
    sheets.forEach((s) => (s.rate = 4.6));
    if (after) after();
  }, 380);
}
function enterAbout() {
  enterPage('about', aboutView, aboutHTML(), 'about', 'paper', () => {
    if (portrait) portrait.rate = 4.2;
    requestAnimationFrame(() => setTimeout(() => reveal($('.about__inner', aboutView)), 200));
  });
}
function enterBrand() {
  enterPage('brand', brandView, brandHTML(), 'brand', 'night', () => requestAnimationFrame(() => setTimeout(() => reveal($('.b-head', brandView)), 160)));
}
function enterArchive() {
  enterPage('archive', archiveView, archiveHTML(), 'index', 'paper', () => requestAnimationFrame(() => setTimeout(() => reveal($('.a-head', archiveView)), 160)));
}

function route() {
  if (!state.ready) return;
  const h = location.hash.replace(/^#\/?/, '');
  // a row in the Index panel is about to be hidden: focus returns to the Index button
  const fromIndex = indexPanel.contains(document.activeElement);
  closeIndex();
  // About as a drawer opens over the view on screen; with nothing under it (a direct
  // link, or the About page itself), over home.
  if (h === 'about' && aboutMode === 'drawer') {
    const under = viewHash !== null && state.mode !== 'about';
    if (!under) { viewHash = ''; enterHome(); }
    return openDrawer(under, fromIndex ? indexBtn : null);
  }
  if (drawerOn) closeDrawer(true);
  if (h === viewHash) { // back from the drawer: the view under it stays as it was, unless a turn was waiting
    const go = journey.pendingGo;
    journey.pendingGo = null;
    if (go) go();
    return;
  }
  viewHash = h;
  if (!h) return enterHome();
  if (h === 'about') return enterAbout();
  if (h === 'brand') return enterBrand();
  if (h === 'archive') return enterArchive();
  const i = PROGRAMS.findIndex((p) => p.slug === h);
  if (i >= 0) return enterProgram(i);
  viewHash = '';
  enterHome();
}
addEventListener('hashchange', route);

/* =========================================================================
   Program and About pages
   ========================================================================= */
const foot = () => `<footer class="pg-foot"><span>Vanessa Espín · New York</span><span><a href="${SITE.linkedin}">LinkedIn</a></span></footer>`;

// The quick-cut tool: one frame per wheel notch, arrow key or click. The picture cuts,
// the caption follows. docs is a list of pictures (see pictures() at the top) or of placeholder
// captions, whose stone frames stand in until her photographs exist. Only the first picture has a
// src (lazy); docsLoad gives the next ones theirs, one step ahead.
const docsFrame = (d, k) => (d.src
  ? `<div class="p-docs__frame p-docs__frame--${d.fit}" data-k="${k}"${k ? ' hidden' : ''}><img ${k ? `data-src="${d.src}"` : `src="${d.src}" loading="lazy"`} alt="${d.alt}" width="${d.w}" height="${d.h}" decoding="sync" style="--w:${d.w}px;--h:${d.h}px"><i class="crop crop--tl"></i><i class="crop crop--tr"></i><i class="crop crop--bl"></i><i class="crop crop--br"></i></div>`
  : `<div class="p-docs__frame" data-k="${k}"${k ? ' hidden' : ''}><i class="crop crop--tl"></i><i class="crop crop--tr"></i><i class="crop crop--bl"></i><i class="crop crop--br"></i><span class="p-docs__no">${String(k + 1).padStart(2, '0')}</span></div>`);
function docsHTML(docs) {
  const n = docs.length, pad = (k) => String(k).padStart(2, '0'), real = !!docs[0].src;
  const caps = docs.map((d) => (d.src ? { cap: d.cap, credit: d.credit } : d));
  return `<section class="p-docs${real ? ` p-docs--pics p-docs--${docs[0].fit}` : ''}" aria-label="Documentation">
    <div class="p-docs__side">
      <span class="eyebrow">Documentation</span>
      <span class="p-docs__count" aria-hidden="true"><b>${pad(1)}</b> / ${pad(n)}</span>
      <p class="p-docs__cap" aria-live="polite">${docsCap(caps, 0)}</p>
      <span class="p-docs__hint">${coarse ? `Tap for the next ${real ? 'picture' : 'photograph'}` : 'Scroll inside, click or use the arrow keys'}</span>
    </div>
    <div class="p-docs__stage" tabindex="0" role="group" aria-roledescription="slideshow" aria-label="Documentation, ${n} ${real ? 'pictures' : 'photographs to come'}" data-i="0" data-caps="${encodeURIComponent(JSON.stringify(caps))}">
      ${docs.map(docsFrame).join('')}
    </div>
  </section>`;
}
// The live caption also says which frame this is, since the counter is hidden from screen readers.
const docsCap = (caps, j) => `<span class="vh">Frame ${j + 1} of ${caps.length}: </span>${caps[j].cap ? `${caps[j].cap}<span class="p-docs__credit">${caps[j].credit}</span>` : ph(caps[j], '', PHOTOS)}`;
// Only the current frame and the next one load: this gives them their src (the next one preloads while hidden).
function docsLoad(stage, j) {
  const imgs = stage.querySelectorAll('.p-docs__frame img');
  [j, (j + 1) % imgs.length].forEach((k) => {
    const im = imgs[k];
    if (im && im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; }
  });
}
function stepDocs(stage, d, wrap = false) {
  const caps = JSON.parse(decodeURIComponent(stage.dataset.caps)), n = caps.length;
  const i = +stage.dataset.i, j = wrap ? (i + d + n) % n : clamp(i + d, 0, n - 1);
  if (j === i) return false;
  stage.dataset.i = j;
  docsLoad(stage, j);
  stage.querySelectorAll('.p-docs__frame').forEach((f) => (f.hidden = +f.dataset.k !== j));
  const side = stage.parentElement;
  $('.p-docs__count b', side).textContent = String(j + 1).padStart(2, '0');
  $('.p-docs__cap', side).innerHTML = docsCap(caps, j);
  return true;
}

function programHTML(i) {
  const p = PROGRAMS[i], g = p.page, next = PROGRAMS[(i + 1) % N];
  const lang = p.lang ? ` lang="${p.lang}"` : '';
  const credits = g.credits.map(([k, v]) => `<span class="eyebrow">${k}</span>${v}`).join(' ');
  const list = g.list ? `<div class="p-list"><span class="eyebrow">${g.list.label}</span>${g.list.rows.map(([n, m]) => `<div class="p-list__row"><i class="rule"></i><span class="p-list__name">${n}</span><span class="p-list__meta">${m}</span></div>`).join('')}<div class="p-list__row" style="padding:0"><i class="rule"></i></div></div>` : '';
  const credit = g.credit ? `<dl class="specs p-credit">${rows(g.credit, 0, 0.05)}<div class="specs__row" style="padding:0"><i class="rule" style="--d:${(g.credit.length * 0.05).toFixed(2)}s"></i></div></dl>` : '';
  const lead = g.did
    ? `<div class="p-did"><span class="eyebrow">What I did</span><ul>${g.did.map((t) => `<li><i class="rule"></i>${t}</li>`).join('')}</ul></div>`
    : `<p class="p-text__lead">${g.lead}</p>`;
  const voice = g.voice ? `<blockquote class="p-voice"><p>${g.voice}</p><footer>${g.voiceBy}</footer></blockquote>` : '';
  // pictures hook (owned by the pictures builder): ${picturesHTML(p, i)} sits between .p-story and .p-text below
  return `
  <div class="p-hero${isCover() ? ' p-hero--cover' : ''}" data-tone="paper" style="--ar:${sheets[i].aspect}">
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
  ${picturesHTML(p, i, VIS)}
  <div class="p-text" data-tone="paper">
    ${lead}
    ${docsHTML(g.docs)}
    ${list}
    ${voice}
    ${credit}
  </div>
  <section class="p-next${VIS.next === 'turn' ? ' p-next--turn' : ''}" data-tone="stone">
    <a class="p-next__link" href="#/${next.slug}">
      <span class="eyebrow">Next program</span>
      <span class="p-next__title"${next.lang ? ` lang="${next.lang}"` : ''}>${next.pageTitle.join('<br>')}</span>
      <span class="p-next__go">Open ${next.name}</span>
    </a>
    <div class="slot slot--next" data-slot="next" style="--ar:${sheets[(i + 1) % N].aspect}"></div>
    <footer class="p-foot"><span>Vanessa Espín · New York</span><span><a href="${SITE.linkedin}">LinkedIn</a></span></footer>
  </section>`;
}

/* About: the same placeholders in the drawer (live) and on the old page (lab) */
const ABOUT = {
  position: phLines(['Her position', 'in one breath,', 'in English', 'and Spanish'], 'q01', ' · q01'),
  bio: ph('Her bio in her own words: who she is, where she works, what she makes, where home shows · 40–60 words', 'q01 q02 q09'),
  artists: ph('How she works with artists, in her words · 2–3 sentences', 'q04 q06'),
  doors: [
    ['Artists', ph('what an artist can bring her, and how to begin · one line', 'q11 q12')],
    ['Institutions & venues', ph('what she brings to a venue · one line', 'q11 q12')],
    ['Brands & sponsors', ph('what a partnership with her looks like · one line', 'q11 q12')],
    ['Press', ph('what she can send, and in which languages · one line', 'q11 q12')],
  ],
};
const doorsHTML = () => `<ul class="doors" role="list">${ABOUT.doors.map(([k, v]) => `<li><a class="door" href="${SITE.linkedin}"><span class="door__k">${k}</span><span class="door__v">${v}</span><span class="door__go" aria-hidden="true">→</span></a></li>`).join('')}</ul>`;
const contactRows = (d0, cls = '', based = true) => {
  const list = [['LinkedIn', `<a href="${SITE.linkedin}">linkedin.com/in/vanessaespin</a>`], ...(based ? [['Based in', 'New York']] : [])];
  return `<dl class="specs ${cls}">${rows(list, d0, 0.07)}<div class="specs__row" style="padding:0"><i class="rule" style="--d:${(d0 + list.length * 0.07).toFixed(2)}s"></i></div></dl>`;
};

function aboutHTML() {
  return `
  <div class="about__slot" data-slot="portrait"></div>
  <div class="about__inner">
    <h1 class="about__statement">${lns(ABOUT.position, 0.05, 0.06)}</h1>
    <p class="about__headline eyebrow">${lns([SITE.headline], 0.3)}</p>
    <div class="about__body">
      ${lns([ABOUT.bio], 0.4)}
      <span class="eyebrow about__label">${lns(['How I work with artists'], 0.46)}</span>
      ${lns([ABOUT.artists], 0.5)}
    </div>
    <div class="about__together"><span class="eyebrow about__label">Work together</span>${doorsHTML()}</div>
    ${contactRows(0.6)}
  </div>`;
}

function drawerHTML() {
  return `<div class="drawer__inner">
    <div class="drawer__top"><span class="eyebrow">About</span><button class="drawer__close" type="button">Close <span aria-hidden="true">×</span></button></div>
    <h2 class="drawer__name" id="drawer-title">${lns(['Vanessa', 'Espín'], 0.12, 0.07)}</h2>
    <p class="drawer__headline eyebrow">${lns([SITE.headline], 0.28)}</p>
    <p class="drawer__bio">${ABOUT.bio}</p>
    <figure class="drawer__portrait"><img src="img/portrait.jpg" alt="Vanessa Espín at Brooklyn Bridge Park" decoding="async"></figure>
    <section class="drawer__sec"><span class="eyebrow">How I work with artists</span><p>${ABOUT.artists}</p></section>
    <section class="drawer__sec"><span class="eyebrow">Work together</span>${doorsHTML()}</section>
    ${contactRows(0.45, 'drawer__contact', false)}
  </div>`;
}

/* Brand work, #/brand */
function brandHTML() {
  return `
  <div class="b-head" data-tone="night">
    <span class="eyebrow">${lns(['Brand work · 2020 to now'], 0.05)}</span>
    <h1 class="b-title">${lns(['Brand work'], 0.1)}</h1>
    <p class="b-intro">${lns([ph('What she brings from brand work into a gallery, in her words · 2–3 lines', 'q07')], 0.3)}</p>
  </div>
  <div class="b-entries js-in" data-tone="night">
    ${BRANDS.map((b, k) => `<article class="b-entry"><i class="rule" style="--d:${(k * 0.08).toFixed(2)}s"></i>
      <h2 class="b-entry__name">${lns([b.name], 0.05 + k * 0.08)}</h2>
      <div class="b-entry__info">
        <p class="b-entry__role">${b.role}<span>${b.dates}</span></p>
        <ul class="b-entry__facts">${b.facts.map((f) => `<li>${f}</li>`).join('')}</ul>
      </div></article>`).join('')}
    <div class="b-entry" style="padding:0"><i class="rule" style="--d:0.24s"></i></div>
  </div>
  <div class="b-case js-in" data-tone="night">
    <span class="eyebrow">A case · Flywheel</span>
    <div class="b-case__cols">${CASE.map(([k, v], j) => `<div class="b-case__col"><i class="rule" style="--d:${(j * 0.07).toFixed(2)}s"></i><span class="eyebrow">${String(j + 1).padStart(2, '0')} · ${k}</span><p>${v}</p></div>`).join('')}</div>
    <blockquote class="b-quote"><p>“${ph('a line from a colleague, with permission', '', WITH_PERMISSION)}”</p><footer>${ph('name · role · Flywheel', '', WITH_PERMISSION)}</footer></blockquote>
  </div>
  <div class="b-bridge js-in" data-tone="paper">
    <span class="eyebrow">Brands and culture</span>
    <p class="b-bridge__lines">${lns(phLines(['What changed', 'between the brand jobs', 'and “more than a role,', 'it’s a mission”;', 'what she carried over'], 'q02 q07', ' · q02 · q07'), 0.05, 0.09)}</p>
    <a class="pg-next" href="#/archive"><span class="eyebrow">Next</span>Earlier work →</a>
    ${foot()}
  </div>`;
}

/* Earlier work, #/archive */
function archiveHTML() {
  const block = (label, head, list, d0) => `<section class="a-block js-in"><span class="eyebrow">${label}</span>
    <div class="a-rows a-rows--${head.length}" role="table" aria-label="${label}"><div class="a-row a-row--head" role="row">${head.map((h) => `<span class="eyebrow" role="columnheader">${h}</span>`).join('')}</div>
    ${list.map((r, k) => `<div class="a-row" role="row"><i class="rule" style="--d:${(d0 + k * 0.05).toFixed(2)}s"></i>${r.map((c, j) => `<span role="cell" class="a-c${j}">${c}</span>`).join('')}</div>`).join('')}
    <div class="a-row" style="padding:0"><i class="rule" style="--d:${(d0 + list.length * 0.05).toFixed(2)}s"></i></div></div></section>`;
  return `
  <div class="a-head" data-tone="paper">
    <span class="eyebrow">${lns(['Before the programs'], 0.05)}</span>
    <h1 class="a-title">${lns(['Earlier work'], 0.1)}</h1>
    <p class="a-intro">${lns([ph('Her earlier work in her words: what she is proud of, and what it taught her · 2 lines', 'q10')], 0.3)}</p>
  </div>
  <div class="a-body" data-tone="paper">
    ${block('Earlier work', ['Year', 'Title', 'Kind', 'Role'], ARCHIVE.map(([y, t, k, r]) => [y, t, k, r || ph('her role', 'q10')]), 0)}
    ${block('Selected experience', ['Role', 'With', 'Dates'], EXPERIENCE, 0)}
    ${block('Education', ['Degree', 'School', 'Also'], EDUCATION, 0)}
    <a class="pg-next" href="#/brand"><span class="eyebrow">Next</span>Brand work →</a>
    ${foot()}
  </div>`;
}

/* Scroll-driven parts of the program page.
   poster=cover|faded: the poster lands upright and flat on the wall as the hero's cover (with
   tape=on, the four tapes). Scrolling into the story it comes off the wall and travels to the side
   (cover), or grows behind the lines as a ghost at about 15% (faded). poster=table is the
   snapshot: the poster lies on a table in the hero, then goes to the side.
   Shared contract (data-sheets="park"): an element in the program view with data-sheets="park"
   parks the program's poster (it fades out) while that element covers most of the viewport,
   i.e. its visible height is at least 60% of VH. Every poster mode; not the next poster. */
const FLIGHT_BUILD = 520, PRESS_IN = 0.12, PRESS_OUT = 0.16, FADED_O = 0.15, FADED_CARD_O = 0.07;
const TURN_RISE = 0.28, TURN_GO = 500, PUSH_PX = 80, PUSH_DWELL = 350, PUSH_GAP = 160;
const eOut2 = (x) => 1 - (1 - clamp01(x)) ** 2;
// the flight from home (poster != table): press to 0.94 in 120 ms, spring to 1.015 in 160 ms,
// come off the wall; the others sink back and shrink away, the nearest first
function flightFrame(now) {
  const f = journey.flight, t = (now - f.t0) / 1000, l = layout();
  sheets.forEach((s, j) => {
    const d = j - f.i;
    carouselTarget(s, d);
    if (j === f.i) {
      const sc = t < PRESS_IN ? mix(1, 0.94, eOut2(t / PRESS_IN)) : mix(0.94, 1.015, eOut2((t - PRESS_IN) / PRESS_OUT));
      s.tgt.s = l.H * sc; s.rate = 30; s.liftTgt = 0;
      s.setFlat(f.flat && t < PRESS_IN + PRESS_OUT ? 1 : 0, now);
    } else {
      const k = clamp01((t - 0.06 - (Math.abs(d) - 1) * 0.08) / 0.42), e = k * (2 - k);
      s.tgt.s = l.H * mix(1, 0.35, e); s.tgt.z -= e * 2.2 * (l.H / 1.8); s.tgt.o *= 1 - seg(k, 0.5, 1);
      s.rate = 14; s.setFlat(0, now);
    }
  });
}
// poster=faded: the story's ghost fills the sticky frame behind the lines
function fadedTarget(el, aspect, out, o) {
  const r = el.getBoundingClientRect(), k = Hv / VH;
  out.x = (r.left + r.width / 2 - VW / 2) * k; out.y = -(r.top + r.height / 2 - VH / 2) * k; out.z = 0;
  out.s = Math.max(r.height, r.width / aspect) * k * 1.04;
  out.rx = 0; out.ry = 0; out.rz = 0; out.o = o;
  return out;
}
function parkedNow() {
  for (const el of programView.querySelectorAll('[data-sheets="park"]')) {
    const r = el.getBoundingClientRect();
    if (Math.min(r.bottom, VH) - Math.max(r.top, 0) >= 0.6 * VH) return true;
  }
  return false;
}
// next=turn: the next poster lifts and turns over once (its printed back flashes past), then
// rises toward the hero slot as it sits at the top of the page; the new page takes it from there
function turnFrame(o, now) {
  const T = journey.turn;
  if (!T.pose) return false; // reduced motion: a plain fade, the poster stays where it is
  Object.assign(o.tgt, (now - T.t0) / 1000 < TURN_RISE ? T.lift : T.pose);
  o.rate = 6; o.float = 0; o.liftTgt = 1; o.setFlat(0, now);
  return true;
}
function startTurn() {
  if (journey.turn || state.mode !== 'program') return;
  const ni = (state.active + 1) % N, o = sheets[ni];
  const heroSlot = $('[data-slot=hero]', programView), nextSlot = $('[data-slot=next]', programView);
  if (!o || !heroSlot || !nextSlot) return;
  hideScribble(true);
  const tok = navToken;
  // About opened during the turn: the drawer stays, and the turn finishes when it closes
  const go = () => {
    if (tok !== navToken) return;
    if (drawerOn) journey.pendingGo = go;
    else location.hash = `#/${PROGRAMS[ni].slug}`;
  };
  journey.turn = { t0: performance.now(), ni, lift: null, pose: null };
  programView.classList.add('is-leaving');
  if (reduced) { setTimeout(go, 260); return; }
  // the lift: up off the pile by a fifth of its height, straightening, a little larger
  const lift = slotTarget(nextSlot, NEXT_ROT_TURN, {});
  lift.y += lift.s * 0.2; lift.rx = -0.35; lift.s *= 1.04;
  // the hero slot as it will sit once the page is back at the top
  const r = heroSlot.getBoundingClientRect(), k = Hv / VH, h = r.height;
  const cx = isCover() && VW >= 760 ? r.right - (h * o.aspect) / 2 : r.left + r.width / 2;
  const rot = isCover() ? COVER_ROT : HERO_ROT;
  const pose = { x: (cx - VW / 2) * k, y: -(r.top + scrollY + h / 2 - VH / 2) * k, z: 0, s: h * k, rx: rot[0], ry: rot[1], rz: rot[2], o: 1 };
  Object.assign(journey.turn, { lift, pose });
  o.spinTgt += Math.PI * 2;
  programView.querySelectorAll('.is-in').forEach(conceal);
  setTimeout(go, TURN_GO);
}
// poster=cover|faded on desktop: the giant title shrinks, if it must, to stay left of the cover
function fitHeroTitle() {
  const hero = $('.p-hero', programView), t = hero && $('.p-title', hero);
  if (!t) return;
  t.style.fontSize = '';
  if (!hero.classList.contains('p-hero--cover') || VW < 760) return;
  const avail = t.clientWidth, rg = document.createRange();
  let w = 0;
  for (const el of t.querySelectorAll('.ln__i')) { rg.selectNodeContents(el); w = Math.max(w, rg.getBoundingClientRect().width); }
  if (w > avail) t.style.fontSize = `${((parseFloat(getComputedStyle(t).fontSize) * avail) / w * 0.985).toFixed(1)}px`;
}
addEventListener('resize', fitHeroTitle);
document.fonts && document.fonts.addEventListener('loadingdone', fitHeroTitle);
// the lab's poster switch, live on a program page
function applyPoster() {
  sheets.forEach((s, i) => { if (PROGRAMS[i].card) s.mat.uniforms.uFront.value = cardFace(PROGRAMS[i], s.aspect); });
  if (!state.ready || state.mode !== 'program') return;
  const hero = $('.p-hero', programView);
  if (hero) hero.classList.toggle('p-hero--cover', isCover());
  fitHeroTitle();
  if (!isCover()) { pinRelease(performance.now()); if (sheets[state.active]) sheets[state.active].liftTgt = 0; }
}
function programFrame(now = performance.now()) {
  const i = state.active;
  const hero = $('[data-slot=hero]', programView), story = $('[data-slot=story]', programView), nextSlot = $('[data-slot=next]', programView);
  if (journey.flight) { flightFrame(now); return; }
  if (!hero || !story) return;
  const heroEl = $('.p-hero', programView);
  const s = sheets[i], cover = isCover(), faded = VIS.poster === 'faded';
  // t: from the hero to the story. On phones the text sits under the cover, so the poster stays on the
  // page until that text has nearly passed; the tone turns as it slides into the story slot.
  const heroH = heroEl.offsetHeight, a = cover && VW < 760 ? Math.max(0, heroH - VH * 0.55) : 0, b = a ? heroH : heroH * 0.92;
  const t = easeIO(clamp01((scrollY - a) / (b - a)));
  const fo = PROGRAMS[i].card ? FADED_CARD_O : FADED_O; // the pale card needs less to stay a ghost
  slotTarget(hero, cover ? COVER_ROT : HERO_ROT, tmpA);
  if (faded) fadedTarget($('.p-story__sticky', programView), s.aspect, tmpB, fo);
  else slotTarget(story, STORY_ROT, tmpB);
  for (const k of KEYS) s.tgt[k] = mix(tmpA[k], tmpB[k], t);
  if (faded) {
    // it grows, and leaves the column right of the text, only once the hero's text has gone
    const tg = clamp01((t - 0.4) / 0.6);
    s.tgt.s = mix(tmpA.s, tmpB.s, tg); s.tgt.x = mix(tmpA.x, tmpB.x, tg);
    s.tgt.o = mix(1, fo, clamp01(t * 1.6));
    // the ghost ends with the story: it is gone before the ground turns to paper
    s.tgt.o *= clamp01(($('.p-story', programView).getBoundingClientRect().bottom - VH * 0.5) / (VH * 0.25));
  }
  s.float = t;
  if (cover) {
    // it lands flat on the wall; scrolled on, it comes off the wall (lifting a little on the way)
    s.setFlat((s.flatTo === 1 ? t < 0.06 : t < 0.03 && s.arrived()) ? 1 : 0, now);
    s.liftTgt = faded ? 0 : 2.8 * t * (1 - t);
  } else s.setFlat(0, now);
  if (parkedNow()) s.tgt.o = 0;
  if (cover && VIS.tape === 'on' && s.flatTo === 1 && s.tgt.o > 0.5) pinShow(s, now); else pinRelease(now);
  const ni = (i + 1) % N, turn = VIS.next === 'turn';
  // the push: it drains once the wheel (or finger) lets go; the end of the page is timed for the dwell
  if (now - push.last > 180 && push.touchY === null) push.acc = 0;
  const atEnd = scrollY >= document.documentElement.scrollHeight - innerHeight - 4;
  journey.endAt = atEnd ? journey.endAt || now : 0;
  sheets.forEach((o, j) => {
    if (j === i) return;
    o.setFlat(0, now);
    if (journey.turn && j === journey.turn.ni && turnFrame(o, now)) return;
    if (j === ni && nextSlot) {
      slotTarget(nextSlot, turn ? NEXT_ROT_TURN : NEXT_ROT, o.tgt);
      const r = nextSlot.getBoundingClientRect();
      o.tgt.o = r.top < VH * 1.05 ? 1 : 0;
      o.float = 0.6;
      // next=turn: one corner lifted, like the next sheet on a pile; a push lifts it further
      if (turn) o.liftTgt = NEXT_LIFT + 0.45 * clamp01(push.acc / PUSH_PX);
    } else {
      // a poster still fading out of the flight finishes where it is, instead of growing on its way off
      if (!cover || o.cur.o < 0.02) carouselTarget(o, (j - i) * 2.6);
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
  followTone(programView);
  // pictures hook (owned by the pictures builder)
  if (picturesOn) {
    picCtx.root = programView; picCtx.scrollY = scrollY; picCtx.vh = VH; picCtx.vw = VW; picCtx.i = i; picCtx.p = PROGRAMS[i];
    picturesFrame(picCtx);
  }
}
// The page tone follows the section in the middle of the screen. Sections have no ground of
// their own, so one that needs the other ground (night text on paper, or the reverse) fades
// out until the page turns to its tone.
// Shared contract: ANY element in the view with data-tone="night|stone|paper" takes part, not
// only the four program sections. Of those crossing the middle, the last in document order wins,
// so a nested one beats its parent (and the parent of the winner is never faded, or the winner
// would vanish with it). Siblings never overlap today, so this is the old first-match exactly.
function followTone(view) {
  const mid = VH * 0.5;
  const sections = view.querySelectorAll('[data-tone]');
  let lead = null;
  for (const el of sections) {
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) lead = el;
  }
  if (lead && pageBg.dataset.tone !== lead.dataset.tone) setTone(lead.dataset.tone);
  const night = pageBg.dataset.tone === 'night';
  for (const el of sections) el.classList.toggle('is-offtone', (el.dataset.tone === 'night') !== night && !(lead && el !== lead && el.contains(lead)));
}
function aboutFrame() {
  const slot = $('[data-slot=portrait]', aboutView);
  if (slot && portrait) { slotTarget(slot, [0.0, 0.16, -0.035], portrait.tgt); portrait.float = 1; }
  sheets.forEach((o, j) => { carouselTarget(o, (j - state.active) * 2.6); o.tgt.o = 0; });
}
// Brand work and Earlier work: no slots, so every sheet stays parked out of sight (as on
// About); sections reveal on entry and the page tone follows the one mid-screen.
function pageFrame(view) {
  sheets.forEach((o, j) => { carouselTarget(o, (j - state.active) * 2.6); o.tgt.o = 0; });
  if (portrait) portrait.tgt.o = 0;
  view.querySelectorAll('.js-in').forEach((el) => {
    if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < VH * 0.92) reveal(el);
  });
  followTone(view);
}

/* =========================================================================
   About as a drawer (the Winkeler move): it slides over the view on screen,
   which stays as it was. #/about opens it; closing restores the previous link.
   ========================================================================= */
const drawer = $('.drawer'), scrim = $('.drawer-scrim');
let drawerOn = false, drawerPushed = false, drawerToken = 0, drawerFocus = null, navBeforeDrawer = 'programs';
// focusBack: where focus returns on close (the Index button when About came from the Index).
function openDrawer(pushed, focusBack = null) {
  if (drawerOn) return;
  drawerOn = true; drawerPushed = pushed;
  const tok = ++drawerToken;
  hideScribble(); state.hoverWanted = false; canvas.classList.remove('is-over');
  const active = document.activeElement;
  drawerFocus = focusBack || (active && active !== body ? active : $('.nav [data-nav=about]'));
  navBeforeDrawer = currentNav; setNav('about');
  drawer.innerHTML = drawerHTML();
  drawer.hidden = false; scrim.hidden = false;
  void drawer.offsetWidth;
  drawer.classList.add('is-open'); scrim.classList.add('is-open');
  body.classList.add('is-drawer');
  $('#main').inert = true; $('.nav').inert = true;
  $('.drawer__close', drawer).focus({ preventScroll: true });
  setTimeout(() => { if (tok === drawerToken) reveal($('.drawer__inner', drawer)); }, reduced ? 0 : 140);
}
// silent: the route already moved on (back button, another link), so leave the history alone
function closeDrawer(silent = false) {
  if (!drawerOn) return;
  drawerOn = false;
  const tok = ++drawerToken;
  drawer.classList.remove('is-open'); scrim.classList.remove('is-open');
  body.classList.remove('is-drawer');
  $('#main').inert = false; $('.nav').inert = false;
  setNav(navBeforeDrawer);
  setTimeout(() => { if (tok === drawerToken) { drawer.hidden = true; scrim.hidden = true; drawer.innerHTML = ''; } }, reduced ? 0 : 520);
  const shown = (el) => el && el.isConnected && (el.checkVisibility ? el.checkVisibility() : el.getClientRects().length > 0);
  (shown(drawerFocus) ? drawerFocus : $('.nav [data-nav=about]')).focus({ preventScroll: true });
  if (silent || !/^#\/?about$/.test(location.hash)) return;
  if (drawerPushed) { history.back(); return; } // route() runs any turn that was waiting
  history.replaceState(null, '', viewHash ? `#/${viewHash}` : location.pathname + location.search);
  const go = journey.pendingGo;
  journey.pendingGo = null;
  if (go) go();
}
scrim.addEventListener('click', () => closeDrawer());
drawer.addEventListener('click', (e) => { if (e.target.closest('.drawer__close')) closeDrawer(); });
drawer.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const f = [...drawer.querySelectorAll('a[href], button')];
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
});

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
// pin=hover: the front-most poster under a point (any poster, not only the centred one), or null.
// The answer comes from the two end poses, never the live mesh: a poster easing between them would
// sweep its outline back under the pointer and the answer would flip every few frames. Every poster
// is tested where it hangs (F=0). keep, the poster stuck to the wall now, is also tested flat (F=1)
// and counts at its nearer pose, so it lets go only when the pointer is outside both outlines, and
// two overlapping posters can't trade the pointer back and forth.
const HIT_EULER = new THREE.Euler(), HITS = [];
// the ray's distance to s in that end pose (float left out), or Infinity; the group is put back
function overPose(s, F) {
  const g = s.group, c = s.cur, y = g.position.y, z = g.position.z;
  HIT_EULER.copy(g.rotation);
  if (F) g.rotation.set(0, 0, 0); else g.rotation.set(c.rx, c.ry, c.rz + s.hung * s.hangRz);
  g.position.y = c.y; g.position.z = F ? c.z : c.z + s.hung * 0.05;
  g.updateMatrixWorld(true);
  HITS.length = 0;
  ray.intersectObject(s.hit, false, HITS);
  g.rotation.copy(HIT_EULER); g.position.y = y; g.position.z = z; g.updateMatrixWorld(true);
  return HITS.length ? HITS[0].distance : Infinity;
}
function hitSheet(x, y, keep = null) {
  if (state.mode !== 'home' || !sheets.length) return null;
  ndc.set((x / VW) * 2 - 1, -(y / VH) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  let best = null, near = Infinity;
  for (const s of sheets) {
    if (!s.group.visible || s.cur.o <= 0.5) continue;
    const d = s === keep ? Math.min(overPose(s, 0), overPose(s, 1)) : overPose(s, 0);
    if (d < near) { near = d; best = s; }
  }
  return best;
}
// The answer can only change if the pointer, the camera or a poster's end pose moved, so the frame loop
// asks again only then. hitAt: where the pointer was when it last asked (NaN: ask next time).
const hitAt = { x: NaN, y: NaN };
function posesMoving() {
  if (!reduced && Math.abs(camera.position.x - pointer.nx * 0.16) + Math.abs(camera.position.y + pointer.ny * 0.1) > 0.002) return true;
  for (const s of sheets) {
    const c = s.cur, g = s.tgt;
    if (Math.abs(c.x - g.x) + Math.abs(c.y - g.y) + Math.abs(c.z - g.z) + Math.abs(c.s - g.s) + Math.abs(c.rx - g.rx) + Math.abs(c.ry - g.ry) + Math.abs(c.rz - g.rz) + Math.abs(c.o - g.o) + Math.abs(s.hung - s.hungTgt) > 0.002) return true;
  }
  return false;
}
// stuck: the poster stuck flat to the wall on home (pin=hover), or null
let drag = null, stuck = null;
canvas.addEventListener('pointerdown', (e) => {
  if (state.mode !== 'home') return;
  canvas.setPointerCapture(e.pointerId);
  const onSheet = hitActive(e);
  // press: the poster under the finger (or the mouse) sticks to the wall until the drag moves or ends
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, onSheet, spinMode: onSheet && !coarse, p0: state.target, spin0: sheets[state.active].spinTgt, samples: [[performance.now(), e.clientX]], press: hitSheet(e.clientX, e.clientY, stuck) };
  canvas.classList.add('is-dragging');
});
canvas.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX; pointer.y = e.clientY;
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
  if (state.mode !== 'home' || drawerOn) return;
  e.preventDefault();
  const dy = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  const unit = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? VH : 1;
  if (VIS.step === 'notch') {
    // a mouse that reports a notch as a few pixels still steps: its legacy wheelDelta is a multiple of 120
    const notch = Math.abs(e.wheelDeltaY || 0) >= 120 && e.wheelDeltaY % 120 === 0;
    const d = notch ? Math.sign(dy) * Math.max(Math.abs(dy * unit), NOTCH_PX) : dy * unit;
    if (!drag && wheelNotch(d, performance.now())) hideScribble();
    return;
  }
  state.target = clampP(state.target + dy * unit * 0.0032);
  hideScribble();
  scheduleSnap();
}, { passive: false });

addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (e.key === 'Escape') { if (drawerOn) closeDrawer(); else if (!indexPanel.hidden) closeIndex(); else if (state.mode !== 'home') location.hash = '#/'; return; }
  if (state.mode !== 'home' || drawerOn) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(state.active + 1); hideScribble(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(state.active - 1); hideScribble(); }
  if (e.key === 'Enter' && document.activeElement === body) location.hash = `#/${PROGRAMS[state.active].slug}`;
});

/* A lab mark (mark=circle and the others) also circles the next program's title on hover */
programView.addEventListener('pointerover', (e) => {
  const link = e.target.closest('.p-next__link');
  if (!link || coarse || link.dataset.circled || journey.turn || markName === 'none') return;
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

/* The turn (next=turn): "Open X" hands off to the next poster, and so does a deliberate push past
   the end of the page: one more wheel notch or about 80 px of overscroll, begun after the page has
   rested at its end. Scrolling that runs into the end (a stream of notches, a trackpad's momentum)
   is not a push, so it never fires while reading. A modified click stays a plain link. */
const canPush = () => state.mode === 'program' && VIS.next === 'turn' && !drawerOn && !journey.turn && indexPanel.hidden;
const NO_PUSH = '.p-docs__stage, .lab, #index-panel'; // the wheel or finger is busy there, whatever the page is doing
const restedAtEnd = (now) => !!journey.endAt && now - journey.endAt >= PUSH_DWELL;
programView.addEventListener('click', (e) => {
  if (!e.target.closest('.p-next__link') || VIS.next !== 'turn' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  startTurn();
});
addEventListener('wheel', (e) => {
  if (!canPush() || e.defaultPrevented || e.target.closest?.(NO_PUSH)) return;
  const now = performance.now(), gap = now - push.last;
  push.last = now;
  const dy = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? VH : 1);
  if (dy <= 0 || !restedAtEnd(now)) { push.acc = 0; push.armed = false; return; }
  if (gap > PUSH_GAP) { push.armed = true; push.acc = 0; } // a fresh gesture, begun at the end
  if (!push.armed) return;
  push.acc += dy;
  // a mouse notch is one event after a gap (its legacy wheelDelta is a multiple of 120); a trackpad adds up
  // to 80 px, and only the first event of its stream could pass for a notch
  const notch = gap > PUSH_GAP && Math.abs(e.wheelDeltaY || 0) >= 120 && e.wheelDeltaY % 120 === 0;
  if (notch || push.acc >= PUSH_PX) { push.acc = 0; push.armed = false; startTurn(); }
}, { passive: true });
addEventListener('touchstart', (e) => {
  push.touchY = canPush() && e.touches.length === 1 && !e.target.closest?.(NO_PUSH) && restedAtEnd(performance.now()) ? e.touches[0].clientY : null;
}, { passive: true });
addEventListener('touchmove', (e) => {
  if (push.touchY === null || !canPush()) return;
  push.acc = Math.max(0, push.touchY - e.touches[0].clientY);
  if (push.acc >= PUSH_PX) { push.touchY = null; push.acc = 0; startTurn(); }
}, { passive: true });
addEventListener('touchend', () => { push.touchY = null; }, { passive: true });
addEventListener('touchcancel', () => { push.touchY = null; }, { passive: true });

/* The documentation tool: a wheel notch inside it steps one frame; at either end the
   wheel goes back to scrolling the page. Arrow keys when focused, a click for the next. */
let docsAcc = 0, docsLast = 0, docsLock = 0;
programView.addEventListener('wheel', (e) => {
  const stage = e.target.closest('.p-docs__stage');
  // is-cutting: the Iyuana held picture is still travelling into it (pictures.js), so the page keeps scrolling
  if (!stage || stage.classList.contains('is-cutting')) return;
  // the page scrolls until the whole frame fits the screen, so reading never stalls on a half-seen picture
  const box = stage.getBoundingClientRect();
  if (box.height < VH && (box.top < -8 || box.bottom > VH + 8)) return;
  const dy = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  const d = Math.sign(dy), i = +stage.dataset.i, n = stage.querySelectorAll('.p-docs__frame').length;
  if (!d || (d < 0 && i === 0) || (d > 0 && i === n - 1)) return;
  e.preventDefault();
  const now = performance.now();
  if (now - docsLast > 220 || Math.sign(docsAcc) !== d) docsAcc = 0;
  docsLast = now;
  docsAcc += dy * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? VH : 1);
  if (Math.abs(docsAcc) >= 30 && now - docsLock > 160) { docsAcc = 0; docsLock = now; stepDocs(stage, d); }
}, { passive: false });
programView.addEventListener('click', (e) => {
  const stage = e.target.closest('.p-docs__stage');
  if (stage && !stage.classList.contains('is-cutting')) stepDocs(stage, 1, true);
});
// the first picture (lazy) has arrived: the next one preloads
programView.addEventListener('load', (e) => {
  const first = e.target.closest && e.target.closest('.p-docs__frame[data-k="0"]');
  if (first) docsLoad(first.parentElement, 0);
}, true);
programView.addEventListener('keydown', (e) => {
  const stage = e.target.closest('.p-docs__stage');
  if (!stage) return;
  const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
  if (d) { e.preventDefault(); stepDocs(stage, d); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stepDocs(stage, 1, true); }
});

/* Index dropdown */
const indexBtn = $('.nav__index-btn'), indexPanel = $('#index-panel'), indexList = $('.index__list');
indexList.innerHTML =
  PROGRAMS.map((p, i) => `<li><a class="index__row" href="#/${p.slug}" data-i="${i}"><span${p.lang ? ` lang="${p.lang}"` : ''}>${p.homeTitle.join(' ')}</span><span>${p.short}</span></a></li>`).join('') +
  `<li class="index__group eyebrow">Work</li><li><a class="index__row" href="#/brand"><span>Brand work</span><span>2020–now</span></a></li><li><a class="index__row" href="#/archive"><span>Earlier work</span><span>2018–2021</span></a></li>` +
  `<li class="index__group eyebrow">Studio</li><li><a class="index__row" href="#/about"><span>About</span><span>New York</span></a></li><li><a class="index__row" href="${SITE.linkedin}"><span>LinkedIn</span><span>Vanessa Espín</span></a></li>`;
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
// homeFlat: the carousel set the sheets' flat state last frame (see the top of frame)
let homeFlat = false;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const carousel = state.mode === 'home' || state.mode === 'loading';
  // pin=hover, only on the carousel: every poster hangs tilted, and flatSheet (the one under the
  // pointer) sticks flat to the wall. Leaving the carousel lets go of it once, here, before the
  // page's own frame code runs; after that the flat state belongs to the page (setFlat).
  let flatSheet = null;
  if (!carousel && homeFlat) { homeFlat = false; stuck = null; sheets.forEach((s) => s.setFlat(0, now)); pinRelease(now); }
  sheets.forEach((s) => (s.hungTgt = carousel && VIS.pin !== 'off' ? 1 : 0));
  if (carousel) {
    if (state.tw && state.tw.to === state.target) {
      const k = clamp01((now - state.tw.t0) / 1000 / state.tw.dur);
      state.p = mix(state.tw.from, state.tw.to, E_GLIDE(k));
      if (k >= 1) state.tw = null;
    } else {
      state.tw = null; // another input (keys, drag, the Index) took over
      state.p += (state.target - state.p) * (reduced ? 1 : 1 - Math.exp(-dt * 6.5));
    }
    sheets.forEach((s, i) => carouselTarget(s, i - state.p));
    // the flock (step=notch): the centre sheet follows fastest, the far ones a beat later
    if (homeRates && state.mode === 'home') sheets.forEach((s, i) => (s.rate = VIS.step === 'notch' ? clamp(11 - 1.15 * Math.abs(i - state.p), 6.5, 15) : 9));
    const ai = clamp(Math.round(state.p), 0, N - 1);
    if (ai !== state.active) {
      state.active = ai; hideScribble();
      sheets.forEach((s, i) => { if (i !== ai) s.spinTgt = Math.round(s.spinTgt / (Math.PI * 2)) * Math.PI * 2; });
    }
    if (state.mode === 'home') {
      if (shownIndex !== ai && Math.abs(state.target - ai) < 0.5) showHomeText(ai);
      const settled = Math.abs(state.target - state.p) < 0.01 && !drag;
      settledFor = settled ? settledFor + dt : 0;
      const sa = sheets[state.active];
      if (VIS.pin === 'hover') {
        // the poster under the pointer sticks to the wall, or the one under a finger (or the mouse)
        // while it is pressed; while the carousel moves or a drag is under way, every poster hangs
        const still = Math.abs(state.target - state.p) < 0.02;
        if (drag) { stuck = drag.moved ? null : drag.press; hitAt.x = NaN; }
        else if (!pointer.inside || coarse || !still || drawerOn) { stuck = null; hitAt.x = NaN; }
        else if (pointer.x !== hitAt.x || pointer.y !== hitAt.y || posesMoving()) {
          stuck = hitSheet(pointer.x, pointer.y, stuck);
          hitAt.x = pointer.x; hitAt.y = pointer.y;
        }
        flatSheet = stuck;
        // a lab mark (none by default) waits until the poster is flat on the wall; nothing lifts
        const wantMark = markName !== 'none' && !!stuck && stuck.flat > 0.97;
        if (wantMark && (!scribbleOn || markSheet !== stuck)) showScribble(stuck);
        if (!wantMark && scribbleOn) hideScribble();
        sheets.forEach((s) => (s.liftTgt = 0));
      } else {
        // pin=off, the snapshot: hovering the centred poster lifts it and the mark draws
        stuck = null;
        const wantScribble = markName !== 'none' && (state.hoverWanted || coarse) && settledFor > (coarse ? 0.35 : 0.12);
        if (wantScribble && !scribbleOn) showScribble(sa);
        if (!state.hoverWanted && !coarse && scribbleOn) hideScribble();
        sheets.forEach((s, i) => (s.liftTgt = i === state.active && state.hoverWanted ? 1 : 0));
      }
    }
    if (portrait) { portrait.tgt.o = 0; }
  } else if (state.mode === 'program') {
    programFrame(now);
  } else if (state.mode === 'about') {
    aboutFrame();
  } else if (state.mode === 'brand') {
    pageFrame(brandView);
  } else if (state.mode === 'archive') {
    pageFrame(archiveView);
  }
  if (!carousel && state.mode !== 'program') pinRelease(now); // a cover's tape goes with the page
  // a little parallax from the pointer on the carousel
  const px = state.mode === 'home' && pointer.inside && !reduced ? pointer.nx * 0.16 : 0;
  const py = state.mode === 'home' && pointer.inside && !reduced ? -pointer.ny * 0.1 : 0;
  camera.position.x += (px - camera.position.x) * (1 - Math.exp(-dt * 3));
  camera.position.y += (py - camera.position.y) * (1 - Math.exp(-dt * 3));
  camera.lookAt(0, 0, 0);
  if (carousel) {
    homeFlat = true;
    sheets.forEach((s) => s.setFlat(s === flatSheet ? 1 : 0, now));
    // tape=on: the stuck poster gets the four tapes, pressed on once it is flat
    if (flatSheet && VIS.tape === 'on') pinShow(flatSheet, now); else pinRelease(now);
  }
  sheets.forEach((s) => s.update(dt, now));
  if (portrait) portrait.update(dt, now);
  tickPins(now);
  if (markTrack && state.mode === 'home') markTrack(projectCorners(markSheet || sheets[state.active]));
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

// The switches of visual pass 1 (and mark, whose snapshot is the circle) carry snap: their
// snapshot option. The Compare row sets them all at once (Director's cut: every def; Snapshot: every snap).
const LAB = {
  pin: { label: 'Home: poster under the pointer', def: 'hover', snap: 'off', options: [['hover', 'Sticks to the wall'], ['off', 'Lifts (snapshot)']], apply: (v) => { VIS.pin = v; } },
  tape: { label: 'Home: tape on the stuck poster', def: 'off', snap: 'off', options: [['off', 'Off'], ['on', 'Four tapes']], apply: (v) => { VIS.tape = v; } },
  step: { label: 'Home: wheel', def: 'notch', snap: 'free', options: [['notch', 'One notch, one poster'], ['free', 'Free']], apply: (v) => { VIS.step = v; state.tw = null; } },
  poster: { label: 'Program: poster', def: 'cover', snap: 'table', options: [['cover', 'Cover'], ['faded', 'Faded'], ['table', 'Table']], apply: (v) => { VIS.poster = v; applyPoster(); } },
  next: { label: 'Program: next poster', def: 'turn', snap: 'click', options: [['turn', 'Turn'], ['click', 'Click']], apply: (v) => {
    VIS.next = v;
    // the turn is the main way between programs: Back lands at the top of a page, as the route scrolled it
    history.scrollRestoration = v === 'turn' ? 'manual' : 'auto';
    const sec = $('.p-next', programView);
    if (sec) sec.classList.toggle('p-next--turn', v === 'turn');
    if (v !== 'turn') sheets.forEach((s, j) => { if (j !== state.active) s.liftTgt = 0; });
  } },
  held: { label: 'Iyuana: held light', def: 'on', snap: 'off', options: [['on', 'On'], ['off', 'Off']], apply: (v) => { VIS.held = v; rePictures(); } },
  drift: { label: 'Herencia Viva: drift', def: 'on', snap: 'off', options: [['on', 'On'], ['off', 'Off']], apply: (v) => { VIS.drift = v; rePictures(); } },
  mark: { label: 'Selection mark', def: 'none', snap: 'circle', options: [['none', 'None'], ['circle', 'Circle'], ['grease', 'Grease pencil'], ['hang', 'Hanging marks'], ['tape', 'Tape'], ['hangtape', 'Tape + marks'], ['wire', 'Nail and wire'], ['box', 'Select box']], apply: (v) => setMark(v) },
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
  about: { label: 'About', def: 'drawer', options: [['drawer', 'Drawer'], ['page', 'Page']], apply: (v) => {
    const was = aboutMode;
    aboutMode = v;
    // unchanged (the selected button again, or Reset): leave the drawer and its history alone
    if (v === was || !state.ready || location.hash.replace(/^#\/?/, '') !== 'about') return;
    // switched while About is showing: show it the other way, in place
    if (drawerOn) closeDrawer(true);
    if (v === 'page') { viewHash = 'about'; enterAbout(); } else route();
  } },
};
const COMPARE = Object.keys(LAB).filter((k) => LAB[k].snap);
// 'cut' or 'snapshot' when every new switch agrees, '' when they are mixed
const compareOf = () => (COMPARE.every((k) => lab[k] === LAB[k].def) ? 'cut' : COMPARE.every((k) => lab[k] === LAB[k].snap) ? 'snapshot' : '');
// ?compare=snapshot starts every new switch from its snapshot option; a switch's own value wins
const labBase = (k, cmp) => (cmp === 'snapshot' && LAB[k].snap ? LAB[k].snap : LAB[k].def);
const lab = {};
// an older link's pin=tape (the pinned centre poster) now reads as the stuck poster with tape
if (params.get('pin') === 'tape') { params.set('pin', 'hover'); if (!params.has('tape')) params.set('tape', 'on'); }
for (const k in LAB) {
  const v = params.get(k);
  lab[k] = LAB[k].options.some(([o]) => o === v) ? v : labBase(k, params.get('compare'));
  LAB[k].apply(lab[k]);
}

const labEl = $('.lab');
function labLink(withPanel) {
  const u = new URL(location.href);
  // the Compare row stays out of the link at its default (the director's cut, or a mix)
  const cmp = compareOf();
  for (const k in LAB) { if (lab[k] === labBase(k, cmp)) u.searchParams.delete(k); else u.searchParams.set(k, lab[k]); }
  if (cmp === 'snapshot') u.searchParams.set('compare', 'snapshot'); else u.searchParams.delete('compare');
  if (withPanel) u.searchParams.set('lab', ''); else u.searchParams.delete('lab');
  return `${u.origin}${u.pathname}${u.search.replace(/=(?=&|$)/g, '')}${u.hash}`;
}
function setLab(k, v) {
  lab[k] = v;
  LAB[k].apply(v);
  labEl.querySelectorAll(`[data-k="${k}"]`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
  const cmp = compareOf();
  labEl.querySelectorAll('[data-cmp]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cmp === cmp)));
  history.replaceState(null, '', labLink(!labEl.hidden));
}
const labOpt = (k, d, v, l) => `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${lab[k] === v}">${l}${v === d.def ? '<i class="lab__live" title="The default"></i>' : ''}${v === d.snap ? '<i class="lab__snap" title="The snapshot: the site as it was on 4 November"></i>' : ''}</button>`;
function buildLab() {
  labEl.innerHTML =
    `<div class="lab__head"><button type="button" class="lab__title" data-act="min" aria-expanded="true">Lab</button><span class="lab__actions"><button type="button" data-act="copy">Copy link</button><button type="button" data-act="reset">Reset</button><button type="button" data-act="close" aria-label="Close the lab">×</button></span></div>` +
    `<div class="lab__row lab__row--compare"><span class="lab__label">Compare</span><div class="lab__opts" role="group" aria-label="Compare">${[['cut', 'Director’s cut'], ['snapshot', 'Snapshot']].map(([v, l]) => `<button type="button" data-cmp="${v}" aria-pressed="${compareOf() === v}">${l}</button>`).join('')}</div></div>` +
    Object.entries(LAB).map(([k, d]) => `<div class="lab__row${d.snap ? ' lab__row--new' : ''}"><span class="lab__label">${d.label}</span><div class="lab__opts" role="group" aria-label="${d.label}">${d.options.map(([v, l]) => labOpt(k, d, v, l)).join('')}</div></div>`).join('') +
    `<p class="lab__note">A dot marks the default; a ring marks the snapshot (the site as it was on 4 November). Compare switches every new row at once. Every change is kept in the link; "Copy link" copies this exact version without the panel. Shift+L hides the lab.</p>`;
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
  else if (b.dataset.cmp) { for (const k of COMPARE) setLab(k, b.dataset.cmp === 'snapshot' ? LAB[k].snap : LAB[k].def); }
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
    const front = img ? texFromImage(img) : cardFace(p, aspect);
    const back = texFromCanvas(backCanvas(p, img, aspect, i));
    const s = new Sheet(front, back, aspect, i * 1.7 + 0.3);
    // hung by hand: a small z-turn of 1.5–2.5°, alternating by index
    s.hangRz = (i % 2 ? 1 : -1) * THREE.MathUtils.degToRad(1.6 + 0.8 * ((i * 0.618) % 1));
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
    else { viewHash = ''; enterHome(); document.querySelectorAll('.home__corner').forEach((el) => reveal(el)); }
  }, reduced ? 0 : 650);
}
boot().catch((err) => { console.error(err); body.classList.add('is-ready'); });
