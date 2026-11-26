// Confirmed facts & approved words of Vanessa Espín (from tracked prototype/printed-matter/app.js & about-lenses/index.html).
// Never invent first-person voice; LinkedIn is the sole public contact.

export const SITE = {
  name: 'Vanessa Espín',
  headline: 'Brand Curator of Events & Experiences',
  city: 'New York',
  linkedin: 'https://www.linkedin.com/in/vanessaespin',
  threeWords: 'Colorful · Stylish · Crafty',
};

export const EXHIBITIONS = [
  {
    slug: 'iyuana',
    num: '01',
    name: 'Iyuana',
    sub: 'El Retorno de los Sueños',
    uniformSub: 'Film & photography exhibition · Queens, Brooklyn, NYC',
    typeHeadline: 'Film & Photography',
    typeSub: 'Sápara & Latin American artists · Queens, Brooklyn, NYC',
    stoodShort: '“At Iyuana I made sure Yanda, a member of the Sápara Nation, told his story himself.”',
    lang: 'es',
    poster: '../img/iyuana.jpg',
    aspect: 420 / 525,
    filmUrl: '/event-wall-lab/fold/stage.html?event=iyuana&hosted=1&v=20261126d',
    filmRuntimeSec: 33.0,
    filmDurationLabel: '0:33',
    filmOpenBg: '#070605',
    filmOpenTone: 'dark',
    splitTop: 'IYUANA',
    splitBot: 'SUEÑOS',
    kind: 'Film & photography exhibition',
    role: 'Producer & creative director',
    venue: 'Queens, Brooklyn, NYC',
    date: 'August 18–24, 2026',
    shortDate: 'Aug 2026',
    whoLabel: 'Artists',
    who: 'Yanda Montahuano · Li Can Vega · Armando Vega · Israel Vargas “Panchis”',
    wash: { base: '#0f0d0b', mid: '#745744', deep: '#4a3426', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
    spot: { room: '#070605', cone: 'rgba(248, 178, 92, 0.30)', rim: '#f0a84b', ink: '#ece4d7' },
    franco: { ground: '#17221b', ink: '#f6ad49', subInk: '#dce3dc', accent: '#5ecb78' },
    evolved: { ground: '#14110e', ink: '#f5b052', subInk: '#e8dfd1' },
    aura: 'iyuana',
    place: 'Queens, Brooklyn, NYC · August 2026',
  },
  {
    slug: 'herencia-viva',
    num: '02',
    name: 'Herencia Viva',
    sub: 'Threads of Memory',
    uniformSub: 'Painting exhibition · Manhattan, Queens, NYC',
    typeHeadline: 'Painting Exhibition',
    typeSub: 'Solo exhibition of Luis Medina · Manhattan, Queens, NYC',
    stoodShort: '“At Herencia Viva, if I could go back for five minutes, I’d stand in front of the Ecuadorian Mona Lisa.”',
    lang: 'es',
    poster: '../img/herencia-viva-ayllu.png',
    aspect: 420 / 525,
    filmUrl: '/event-wall-lab/fold/stage.html?event=herencia-viva&hosted=1&v=20261126d',
    filmRuntimeSec: 41.8,
    filmDurationLabel: '0:42',
    filmOpenBg: '#f6f4ef',
    filmOpenTone: 'light',
    splitTop: 'HERENCIA',
    splitBot: 'VIVA',
    kind: 'Painting exhibition',
    role: 'Curator & creative director',
    venue: 'Manhattan, Queens, NYC',
    date: 'May 16–31, 2026',
    shortDate: 'May 2026',
    whoLabel: 'Painter',
    who: 'Luis Medina · with Ayllu Gallery',
    wash: { base: '#0e0d0b', mid: '#4e5e40', deep: '#323824', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
    spot: { room: '#0b0f0c', cone: 'rgba(222, 234, 194, 0.27)', rim: '#9db883', ink: '#edf2e9' },
    franco: { ground: '#213828', ink: '#f3efe4', subInk: '#dcd184', accent: '#8ab07a' },
    evolved: { ground: '#121b14', ink: '#edf2e9', subInk: '#c5d4c2' },
    aura: 'herencia',
    place: 'Manhattan, Queens, NYC · May 2026',
  },
  {
    slug: 'ayazamana',
    num: '03',
    name: 'Ayazamana',
    sub: 'Traditional Dance of Ecuador',
    uniformSub: 'Traditional dance & live music · Queens, NYC',
    typeHeadline: 'Dance & Live Music',
    typeSub: 'Ayazamana Dance Group · Queens, NYC',
    stoodShort: '“At Ayazamana I was in the tech room above the stage, handling the visuals that came up after every dance.”',
    lang: 'es',
    poster: '../img/ayazamana.png?v=20261123a',
    aspect: 1252 / 1826,
    filmUrl: '/event-wall-lab/fold/stage.html?event=ayazamana&hosted=1&v=20261126d',
    filmRuntimeSec: 30.5,
    filmDurationLabel: '0:31',
    filmOpenBg: '#040303',
    filmOpenTone: 'dark',
    splitTop: 'AYAZA',
    splitBot: 'MANA',
    kind: 'Live music & traditional dance',
    role: 'Creative & event coordination',
    venue: 'Queens, NYC',
    date: 'July 11, 2026',
    shortDate: 'Jul 2026',
    whoLabel: 'Performers',
    who: 'Ayazamana Dance Group',
    wash: { base: '#0e0b0b', mid: '#592744', deep: '#391726', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
    spot: { room: '#080607', cone: 'rgba(218, 92, 112, 0.27)', rim: '#f0d765', ink: '#ece4d7' },
    franco: { ground: '#4d1624', ink: '#f3dd67', subInk: '#f4ebe4', accent: '#d95b72' },
    evolved: { ground: '#180d12', ink: '#f3dd67', subInk: '#ece2d8' },
    aura: 'ayazamana',
    place: 'Queens, NYC · July 2026',
  },
];

// Verbatim About Me & Client Message from Vanessa Espín (Nov 22, 2026).
// Zero email address or phone number in code or DOM; inquiries route via opaque privacy relay endpoint or LinkedIn.
export const BIO = {
  quote: '“A well told and organized visual story can transform vision into impact.”',
  roleTitle: 'Brand Curator of Events & Experiences',
  statement: 'A well told and organized visual story can transform vision into impact.',
  eyebrow: 'Brand Curator of Events & Experiences · New York',
  door: 'I’m a New York-based Brand Curator of Events & Experiences, driven by the belief that the way we bring people, stories, and ideas together can move us toward meaningful change.',
  aboutParagraphs: [
    'I’m a New York-based Brand Curator of Events & Experiences, driven by the belief that the way we bring people, stories, and ideas together can move us toward meaningful change.',
    'My work lives at the intersection of culture, creativity, and community. I approach every project with a curiosity for people and the stories that shape them, bringing together the right voices, creative perspectives, and environments to create experiences that resonate beyond the moment.',
    'Rooted in New York’s Latin American arts community, I’ve collaborated with cultural organizations, independent artists, and creative teams to bring ideas to life through exhibitions, live performances, and community-driven gatherings. From producing cultural programs and coordinating artist collaborations to shaping visual identities, developing partnerships, and hosting events, I enjoy working across the many layers that turn a vision into a shared experience.',
    'My creative foundation comes from five years of agency experience in art direction, brand storytelling, and visual strategy. Over time, I’ve found myself drawn beyond the screen and into the spaces where brands, culture, and people meet. Today, I bring that visual sensibility and strategic perspective into the curation and production of experiences, with an appreciation for the details that make a gathering feel intentional and meaningful.',
    'At the heart of it all is a simple belief: A well told and organized visual story can transform vision into impact.',
    'I’m interested in working with people and organizations who share that ambition, particularly those using creativity as a tool for cultural connection, positive impact, and a more thoughtful world.',
  ],
  clientKicker: 'For Clients & Collaborators',
  clientHeading: 'Working With Vanessa',
  clientParagraphs: [
    'Vanessa is a creative dedicated to organizing, clarifying, and positioning personal and experiential brands with purpose. She specializes in person-centered creative services that transform ideas, stories, and initiatives into cohesive visual identities with a strong voice and presence.',
    'What sets her apart is her ability to distill complex stories into experiences that are clear, engaging, and authentic to the people behind them. Every creative decision is rooted in your original intention, ensuring your brand not only resonates with your audience but also remains true to its purpose.',
    'She synthesizes your vision into thoughtful visual systems that communicate who you are, what you stand for, and why your work matters. Whether you’re an individual, artist, founder, or cultural initiative, Vanessa helps your story become something people can understand, remember, and connect with.',
  ],
  stood: [
    {
      exIdx: 2,
      num: '01',
      name: 'Ayazamana',
      place: 'Queens, NYC',
      text: 'At Ayazamana I was in the tech room above the stage, handling the visuals that came up after every dance.',
    },
    {
      exIdx: 0,
      num: '02',
      name: 'Iyuana',
      place: 'Queens, Brooklyn, NYC',
      text: 'At Iyuana I made sure Yanda, a member of the Sápara Nation, told his story himself.',
    },
    {
      exIdx: 1,
      num: '03',
      name: 'Herencia Viva',
      place: 'Manhattan, Queens, NYC',
      text: 'At Herencia Viva, if I could go back for five minutes, I’d stand in front of the Ecuadorian Mona Lisa.',
    },
  ],
  home: 'Rooted in New York’s Latin American arts community, I’ve collaborated with cultural organizations, independent artists, and creative teams to bring ideas to life through exhibitions, live performances, and community-driven gatherings.',
  turn: 'My creative foundation comes from five years of agency experience in art direction, brand storytelling, and visual strategy. Over time, I’ve found myself drawn beyond the screen and into the spaces where brands, culture, and people meet.',
  letterHeading: 'For Clients & Collaborators',
  letterSalutation: 'Working With Vanessa',
  letterBody: 'Vanessa is a creative dedicated to organizing, clarifying, and positioning personal and experiential brands with purpose. Whether you’re an individual, artist, founder, or cultural initiative, Vanessa helps your story become something people can understand, remember, and connect with.',
  // Paste an opaque Formspree / Web3Forms relay endpoint (e.g. 'https://formspree.io/f/xxxxxxxx') before launch — zero email exposed in code!
  contactRelayUrl: '',
  linkedin: 'https://www.linkedin.com/in/vanessaespin',
};

export const CONCEPTS = [
  {
    id: 'c1',
    short: 'C1 · Komorebi + Wash ★',
    name: 'Komorebi & Watercolour Wall',
    pick: true,
    defaultPortal: 'threshold',
    defaultAbout: 'a9',
    summary: 'Washed C8 colour bases grazed by swaying window-light, centered poster framing, and uniform borough/NYC captions.',
  },
  {
    id: 'c2',
    short: 'C2 · Chiaroscuro Spot',
    name: 'Chiaroscuro Spotlight Stage',
    pick: true,
    defaultPortal: 'iris',
    defaultAbout: 'a2',
    summary: 'Dark gallery room matching Iyuana & Theater: honey-oak floor sheen below, one warm pin-spot on the centred poster.',
  },
  {
    id: 'c3',
    short: 'C3 · Type',
    name: 'Monumental Split-Type',
    defaultPortal: 'curtain',
    defaultAbout: 'a3',
    summary: 'Saturated screen-printed pigment fields + partner ink, monumental title split above and below the hanging sheet.',
  },
  {
    id: 'c4',
    short: 'C4 · Salon Triptych',
    name: 'Triptych Salon Hang',
    pick: true,
    defaultPortal: 'threshold',
    defaultAbout: 'a6',
    summary: 'All three event posters hang together at once on sunlit stone; hovering flattens one with masking tape.',
  },
  {
    id: 'c5',
    short: 'C5 · Living Aura',
    name: 'Living-Window Aura',
    defaultPortal: 'threshold',
    defaultAbout: 'a5',
    summary: 'Poised linen wall where resting on the centred poster wakes a subtle living halo of its 3D world behind the curled paper.',
  },
  {
    id: 'c6',
    short: 'C6 · Gallery Ledge 3D',
    name: '3D Gallery Ledge Maquette',
    defaultPortal: 'threshold',
    defaultAbout: 'a7',
    summary: 'Real 3D wainscot moulding, honey-oak floor, and sculpted walnut rail holding the leaning posters.',
  },
  {
    id: 'c7',
    short: 'C7 · Broadsheet Rail',
    name: 'Event Broadsheet & Voice Rail',
    defaultPortal: 'curtain',
    defaultAbout: 'a3',
    summary: 'Archival cotton broadsheet with hairline registration rules: numbered event index on the left, 3D poster on the right.',
  },
  {
    id: 'c8',
    short: 'C8 · Evolved Baseline',
    name: 'Printed Matter v2.5 (Control)',
    defaultPortal: 'curtain',
    defaultAbout: 'a4',
    summary: 'Solid C8 colour bases with straight-edge ink pass, wired directly to the 3 events.',
  },
];

export const PORTALS = [
  { id: 'threshold', label: 'P1 · Crisp Threshold ★', desc: 'Snappy 0.45s 3D poster straighten + camera glide into event space (0 iframe lag)' },
  { id: 'curtain', label: 'P2 · Curtain Lift', desc: 'Crisp 0.48s upward sheet lift into the event space' },
  { id: 'iris', label: 'P3 · Spotlight Dim', desc: 'Snappy 0.45s spotlight dim into the event opening' },
  { id: 'wash', label: 'P4 · Pigment Dissolve', desc: 'Quick watercolour dissolve into the event opening' },
];

export const ABOUT_CONCEPTS = [
  { id: 'a9', label: 'A9 · Landing Komorebi + Wash ★', desc: 'Unified Landing C1 Komorebi + Wash styling + live poster shift (zero legacy dark override)' },
  { id: 'a1', label: 'A1 · Asymmetric Salon', desc: 'Lights-go-off dusk + 3D poster re-hangs in left spotlight + wide 2-col dark salon' },
  { id: 'a2', label: 'A2 · 3D Portrait Print ★', desc: 'Portrait is a real 7th 3D WebGL creased print lit beside unboxed ivory prose' },
  { id: 'a3', label: 'A3 · Monograph', desc: 'Full-canvas matte obsidian 3-col monograph + sticky rail + curtain drop' },
  { id: 'a4', label: 'A4 · Dark Alcove + Push', desc: 'Refined 54vw dark lime-wash alcove coordinated with left 3D room push' },
  { id: 'a5', label: 'A5 · Stipple Iris', desc: 'Velvet black + golden pointillist light-motes + optical iris bloom' },
  { id: 'a6', label: 'A6 · 3-Bay Tech Booth', desc: 'Zero-scroll 3 vertical architectural bays unfolding in horizontal shutter wipe' },
  { id: 'a7', label: 'A7 · Curatorial Desk', desc: '3 tactile dark-room cards laid onto smoked walnut table with contact shadows' },
  { id: 'a8', label: 'A8 · Night Komorebi', desc: 'Seamless day-to-night komorebi crossfade in the same room' },
];

export const INTRO_CONCEPTS = [
  { id: 'o1', label: 'O1 · Komorebi Dawn ★', desc: 'Nocturnal umber warms into diagonal sunlight as 3D posters rise & uncurl' },
  { id: 'o2', label: 'O2 · Print Deal ★', desc: 'Three miniature posters deal at center, then part spatially into the 3D stage' },
  { id: 'o3', label: 'O3 · Watercolour Bloom', desc: 'Archival cotton hairline blooms a wet-edge watercolour aperture onto the wall' },
  { id: 'o4', label: 'O4 · Velvet Fly-Curtain', desc: 'Brass loading line draws across espresso velvet, then lifts like a stage curtain' },
  { id: 'o5', label: 'O5 · Pin-Spot Iris', desc: 'Gallery pin-spot opens on the center poster first, then illuminates the room' },
  { id: 'o6', label: 'O6 · Purpose Overture', desc: '“I wanted to tell the stories of us.” rises on dark umber paper before parting' },
];

export const COPY_MODES = [
  { id: 'l1', label: 'L1 · Name + Event/NYC ★', desc: 'Uniform short name + plain English event type & NYC boroughs' },
  { id: 'l2', label: 'L2 · Event Type Headline', desc: 'Plain English event type headline (no title repetition with poster)' },
  { id: 'l3', label: 'L3 · Her Room Moment', desc: 'Vanessa’s own 1-sentence story of what she did in that room' },
  { id: 'l4', label: 'L4 · Poster Only', desc: 'Zero title; poster carries 100% of typography above CTA' },
];

export const SCROLL_CUES = [
  { id: 's1', label: 'S1 · Pill Dots', desc: 'Expanding active story-pill + dots' },
  { id: 's2', label: 'S2 · Dots + 1/3 ★', desc: 'Three minimal dots + 1 / 3 counter between ‹ › chevrons (default)' },
  { id: 's3', label: 'S3 · Named Story Bars ★', desc: 'Three named editorial hairline progress bars (Iyuana · Herencia Viva · Ayazamana)' },
  { id: 's4', label: 'S4 · Edge Arrows + Titles ★', desc: 'Breathing left/right margin show cues + minimal center dots' },
  { id: 's5', label: 'S5 · Mini Poster Strip', desc: 'Three miniature uncropped poster thumbnails + flanking chevrons' },
  { id: 's6', label: 'S6 · Vernier Tick Scale', desc: 'Architectural tick-ruler with live continuous gliding indicator' },
];

export const COLOR_MODES = [
  { id: 'p5', label: 'Nocturnal Charcoal ★', desc: 'Constant nocturnal charcoal (#100e0d) + subtle sunset-orange / sage / ruby aura' },
  { id: 'p1', label: 'Deep Poster Nocturnes', desc: 'Dark gallery grounds keyed to each poster: Ember Umber · Forest Night · Velvet Ruby' },
  { id: 'p2', label: 'Pure Obsidian', desc: 'Deepest cinema-black (#090807) gallery wall with restrained poster halo' },
];

export const POSTER_SWATCHES = {
  iyuana: [
    { id: 'iy1', label: 'Warm Umber ★', chip: '#745744', base: '#0f0d0b', mid: '#745744', deep: '#4a3426', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
    { id: 'iy2', label: 'Deep Honey Ochre', chip: '#b87a0c', base: '#0d0904', mid: '#b87a0c', deep: '#7a4c05', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
    { id: 'iy3', label: 'Jungle Hearth', chip: '#b86824', base: '#111410', mid: '#b86824', deep: '#243828', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
  ],
  'herencia-viva': [
    { id: 'hv1', label: 'Botanical Olive ★', chip: '#4e5e40', base: '#0e0d0b', mid: '#4e5e40', deep: '#323824', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
    { id: 'hv2', label: 'Deep Olive Umber', chip: '#6b7a40', base: '#13150f', mid: '#4b572c', deep: '#293018', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
    { id: 'hv3', label: 'Andean Emerald', chip: '#2f6b53', base: '#0d1513', mid: '#245240', deep: '#143026', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
  ],
  ayazamana: [
    { id: 'ay1', label: 'Dusky Plum ★', chip: '#592744', base: '#0e0b0b', mid: '#592744', deep: '#391726', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
    { id: 'ay2', label: 'Stage Crimson', chip: '#9c2840', base: '#160c0f', mid: '#781e30', deep: '#42101a', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
    { id: 'ay3', label: 'Gilded Nocturne', chip: '#b88632', base: '#14110c', mid: '#6e4e1c', deep: '#451923', ink: '#f4ede2', muted: 'rgba(244,237,226,0.66)', dark: true },
  ],
};

export const CARD_MOODS = [
  { id: 'f1', label: 'F1 · Iyuana Dusk Nebula ★', desc: 'Fuzzy nocturnal cosmos: blurred sunset amber, smoky rose-plum & tactile 35mm grain' },
  { id: 'f2', label: 'F2 · Smoked Umber & Gold', desc: 'Blurred warm bronze-ochre clouds & heavy charcoal rag grain' },
  { id: 'f3', label: 'F3 · Forest Ember Mist', desc: 'Blurred Amazonian moss-jade, warm ember mist & stippled grain' },
];

export const BIOS = ABOUT_CONCEPTS;
