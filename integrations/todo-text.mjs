// String helpers for inline `{{TODO: note}}` markers (CHARTER §9). Shared by the
// Markdown plugin and the Astro components, so both treat notes the same way.
//
// Two kinds of note:
//   CHECK  "confirm …", "check …" or "verify …" right after some text. The text
//          is a draft that stands; the showcase drops only the note.
//   GAP    anything else. It stands for missing content and must be a whole unit
//          (a field, list item, line segment, sentence or paragraph); the
//          showcase drops the whole unit.

const NOTE = /\{\{TODO(?::\s*([^}]*?))?\s*\}\}/g;
const CHECK = /^(confirm|check|verify)\b/i;

export const hasTodo = (s) => typeof s === 'string' && s.includes('{{TODO');

/** Splits text into plain runs and notes: [{ text }, { note }, …]. */
export function splitTodo(s) {
  const out = [];
  let last = 0;
  for (const m of s.matchAll(NOTE)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push({ note: (m[1] || '').trim() });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}

/** A CHECK note confirms the text before it; anything else is a gap. */
export const isCheck = (note, textBefore) => CHECK.test(note) && /\S/.test(textBefore);

/** Doubled spaces, a space before punctuation, empty brackets, dangling separators. */
export const tidy = (s) =>
  s
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.;:)])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/[\s;,·]+$/u, '')
    .replace(/^[\s;,·]+/u, '')
    .trim();

/** Every note removed, whatever its kind: for alt text, meta tags and attributes. */
export function stripTodo(s) {
  if (!hasTodo(s)) return s;
  return tidy(s.replace(NOTE, ''));
}

/**
 * One unit (a field, list item or line segment) as the showcase shows it:
 * CHECK notes go and the text stays; a GAP removes the unit, returned as null.
 */
export function resolveUnit(s) {
  if (!hasTodo(s)) return s;
  let out = '';
  for (const part of splitTodo(s)) {
    if ('text' in part) out += part.text;
    else if (isCheck(part.note, out)) out = out.replace(/[ \t]+$/, '');
    else return null;
  }
  return tidy(out);
}

/**
 * Running prose (one paragraph's text, in order). CHECK notes go; a GAP may only
 * be a sentence of its own, and goes with its sentence. Returns the new text of
 * each run, or throws for a GAP in the middle of a sentence.
 */
export function resolveProse(runs, where = 'Markdown') {
  const out = [];
  let before = '';
  for (const [i, run] of runs.entries()) {
    let text = '';
    const parts = splitTodo(run);
    for (const [j, part] of parts.entries()) {
      if ('text' in part) {
        text += part.text;
        continue;
      }
      const prior = before + text;
      if (isCheck(part.note, prior)) {
        text = text.replace(/[ \t]+$/, '');
        continue;
      }
      const rest = parts.slice(j + 1).map((p) => ('text' in p ? p.text : '')).join('') + runs.slice(i + 1).join('');
      const startsSentence = prior.trim() === '' || /[.!?:]["”’)]?\s*$/.test(prior);
      const endsSentence = rest.trim() === '' || /^\s+["“(]?[A-ZÁÉÍÓÚÑ]/.test(rest);
      if (!startsSentence || !endsSentence) {
        throw new Error(
          `Gap note inside a sentence (${where}): "{{TODO: ${part.note}}}". ` +
            'Make it a sentence or paragraph of its own, or start it with "confirm" if the text around it stands.',
        );
      }
      text = text.replace(/[ \t]+$/, '');
    }
    before += text;
    out.push(text);
  }
  return out;
}
