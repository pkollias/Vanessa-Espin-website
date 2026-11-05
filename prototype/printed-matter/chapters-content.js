/* What each program shows in the chapters engine (chapters.js). The engine holds no names, words or paths: all of that is
   here, one entry per program, keyed by its slug. To move a program into the chapters, add its entry; to move it out,
   remove it.

   lab: [switch, value], the lab switch that has to be set for the chapters to show. Leave it out for always.
   make(vis): returns what the chapters show, given the lab's switches (or give base, label and chapters directly):
   base: the folder of the pictures.
   chapters: in order, each one a recipe from RECIPES in chapters.js, with its own words, pictures and ground:

   recipe     what it does                                                                    takes
   bleed      a picture fills the screen and holds, no type, only a slow push                 pic, hold
   travel     giant words come up the middle and slide to the sides, framed pictures drift    words, first, lead, frames, rule
   aim        pictures rise edge to edge, the row slides off to the right and uncovers a light    words, by, pics, side, light,
              ground: words in masks on the left, one photograph unframed at the right edge       lightInk, credit
   pushin     a speck grows through the words, lifts off them, objects pop in                 hero, lines, objects, credit
   rooms      pictures flush to the screen's edges beside giant lines; a line gathers         spreads, spaced, insert
   closer     two words with a card between them; it opens until it is the screen, and holds  lines, pic

   Every chapter takes tone (paper, rose, cobalt, blood, night, stone: the page's ground and the nav follow), ink (the type's
   colour), edge (a number: the seed of the line its ground arrives on, chosen by the lab's edge switch; leave it out for a
   ground that simply comes up with the page) and stay (screens it holds while the next ground comes up over it).
   pic: { f: file, w, h: its pixels (of the crop, if it has one), alt, cap: the visible caption, by: the credit under it,
   crop: [x, y, w, h] as fractions of the file, photographs only, turn: true for a print lying upside down in the photograph,
   pos and posM: which part stays in view when a photograph
   fills the screen, on a screen and on a phone, as object-position fractions, zoom: how much closer than just filling it, ph: says what a placeholder caption needs }.
   Paintings stay whole. Photographs of prints may crop.

   Words here are only what is already on her poster, campaign image and specs, plus names, titles and dates. Never her
   voice. All display type is capitals (chapters.css sets them). */

const MEDINA = 'Luis Medina', HERS = 'Design: Vanessa Espín';
const pic = (f, w, h, alt, cap = alt, by = MEDINA, more = {}) => ({ f, w, h, alt, cap, by, ...more });
const big = (name, alt, cap, by, more) => pic(`big/${name}.jpg`, 1800, 2312, alt, cap, by, more);
const cut = (name, [x, y, w, h], alt) => pic(`big/${name}.jpg`, Math.round(1800 * w), Math.round(2312 * h), alt, alt, MEDINA, { crop: [x, y, w, h] });

// the three photographs that can open and close the page (lab: hvopen, hvclose)
const FULL = {
  oranges: big('oranges', 'Prints on a table: a woman with fish and oranges', 'The prints', `Paintings: ${MEDINA}`, { pos: [0.5, 0.74], posM: [0.42, 0.8] }),
  mona: big('mona-print', 'Prints on a table: the Mona Lisa with a rooster, hands rolling a print', 'The prints', `Paintings: ${MEDINA}`, { pos: [0.72, 0.84], posM: [0.56, 0.82], zoom: 1.2 }),
  ladder: big('ladder', 'Vanessa Espín on a step ladder, hanging a large painting', 'Vanessa Espín, installing', '', { pos: [0.5, 0.22], posM: [0.5, 0.5] }),
};
const YELLOW = '#f6c324'; // the oranges'

export const CHAPTERS = {
  'herencia-viva': {
    lab: ['drift', 'chapters'],
    make: (vis) => {
      const ground = vis.hvGround === 'rose' ? 'rose' : 'cobalt';
      const type = ground === 'rose' ? 'var(--oxblood)' : 'var(--paper)';
      return {
        base: 'img/herencia-viva/',
        label: 'Herencia Viva: the paintings, the designs and the show',
        chapters: [
          { recipe: 'bleed', tone: 'night', ink: 'var(--paper)', pic: FULL[vis.hvOpen] || FULL.oranges },
          {
            recipe: 'travel', tone: ground, ink: type, edge: 11, rule: YELLOW, first: 0.3, lead: 0.17, rate: 0.74, hold: 1.2,
            words: [{ text: 'Ecuadorian', fit: 0.965, go: 0 }, { text: 'Magic', fit: 0.74, go: 1 }, { text: 'Realism', fit: 0.78, go: -1 }],
            frames: [],
            credit: `Paintings: ${MEDINA}`,
          },
          {
            recipe: 'aim', tone: 'night', ink: 'var(--paper)', edge: 17, light: 'paper', lightInk: 'var(--oxblood)',
            pics: [
              pic('big/encuentro.jpg', 800, 840, 'Encuentro, 2024, a painting', 'Encuentro, 2024', MEDINA, { row: 1.1 }),
              pic('03-meninas-detail.jpg', 550, 666, 'Meninas Ancestrales, detail', 'Meninas Ancestrales · detail', MEDINA, { row: 1 }),
              pic('05-village-painting.jpg', 414, 444, 'Painting: a village in green hills', 'Painting', MEDINA, { row: 0.92 }),
            ],
            credit: `Paintings: ${MEDINA}`,
            // his own words, from his post of June 7, 2026: "Un equipo que no descansó el mes de Mayo. Se lograron 3 exhibiciones en NYC!"
            words: ['A team', 'that didn’t', 'rest'],
            by: 'Luis Medina, on three exhibitions in New York that May',
            side: big('ladder-bw', 'Vanessa Espín on a step ladder, hanging a large painting', 'Vanessa Espín, installing', '', { pos: [0.66, 0.5], posM: [0.5, 0.3] }),
          },
          {
            recipe: 'pushin', tone: 'blood', ink: 'var(--paper)', edge: 23, hold: 3.95,
            hero: pic('01-threads-of-memory.jpg', 1060, 1412, 'Threads of Memory · the campaign', 'Threads of Memory · the campaign', HERS),
            lines: [['Ecuador.'], ['NY.', '2026']],
            objects: [
              { pic: pic('06-fish-in-the-city.jpg', 550, 670, 'The poster’s fish, in New York', 'The poster’s fish, in New York', HERS), at: 2.0, wait: 0.28, pause: 0.7, rate: 1.23, x: 0.28, h: 0.82, m: { x: 0.4, h: 0.46 } },
              { pic: pic('07-shirt-back.jpg', 552, 670, 'The shirt', 'The shirt', HERS), at: 2.75, wait: 0.2, pause: 0.7, rate: 1.88, x: 0.74, h: 0.76, m: { x: 0.62, h: 0.44 } },
            ],
            credit: HERS,
          },
          {
            recipe: 'rooms', tone: 'night', ink: 'var(--paper)', edge: 29,
            spreads: [
              { room: big('pointing', 'A hand pointing at the painting Encuentro on a gallery wall', 'Encuentro, 2024 · Luis Medina', '', { pos: [0.5, 0.42] }), side: 'l', fill: true, lines: ['Flushing', 'Town', 'Hall'] },
            ],
          },
          { recipe: 'closer', tone: ground, ink: type, edge: 37, lines: ['Luis', 'Medina'], pic: FULL[vis.hvClose] || FULL.mona },
        ],
      };
    },
  },
};

// what a program shows given the lab's switches, or null if it isn't in the chapters
export function chaptersFor(slug, vis = {}) {
  const entry = CHAPTERS[slug];
  if (!entry || (entry.lab && vis[entry.lab[0]] !== entry.lab[1])) return null;
  return { edge: vis.edge, ...(entry.make ? entry.make(vis) : entry) };
}
