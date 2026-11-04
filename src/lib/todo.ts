// How components treat TODO note markers. The mode is set at build time
// (see integrations/todos.mjs): "show" renders notes and placeholders for review,
// "hide" resolves them so the page reads as finished (see todo-text.mjs for the
// difference between CHECK and GAP notes).
import { hasTodo, resolveUnit, splitTodo, stripTodo } from '../../integrations/todo-text.mjs';

declare const __TODO_MODE__: 'show' | 'hide';

export const SHOW_TODOS = __TODO_MODE__ === 'show';

export { hasTodo, splitTodo };

/** Text with every note removed: for attributes, meta tags and alt text, in every mode. */
export const clean = (s?: string | null) => (s ? stripTodo(s) : '');

/** One field or list item as the showcase shows it, or null when it is a gap. */
export const unit = (s?: string | null): string | null => {
  if (!s) return null;
  const resolved = resolveUnit(s);
  return resolved === null || resolved === '' ? null : resolved;
};

/** Whether a field or list item renders: always in review, only if it is not a gap in the showcase. */
export const shown = (s?: string | null) => (SHOW_TODOS ? !!s : unit(s) !== null);

/** The parts of a " · " line that render, in order. */
export function segments(...parts: Array<string | null | undefined>): string[] {
  const all = parts.flatMap((p) => (p ? p.split(' · ') : []));
  return SHOW_TODOS ? all : all.map((p) => unit(p)).filter((p): p is string => p !== null);
}

/** The text of the notes themselves, e.g. a pending image's description. */
export const noteText = (s?: string | null) =>
  s
    ? splitTodo(s)
        .flatMap((p) => ('note' in p ? [p.note] : []))
        .join('; ')
    : '';

/** An image slot: a resolved image, or a pending one held by a TODO note. */
export type Pending<T> = T | { todo: string };
export const isPending = <T>(v: Pending<T> | undefined): v is { todo: string } =>
  typeof v === 'object' && v !== null && 'todo' in v;
