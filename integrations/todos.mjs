// Unresolved content is written inline as `{{TODO: note}}` (CHARTER §9), in
// Markdown, frontmatter, or YAML comments. The build runs in one of three modes:
//
//   show   dev and review builds: notes render as [bracketed] text in the
//          surrounding type, and missing images as placeholders, like the mocks
//   hide   showcase builds: CHECK notes are dropped and their text stays; GAP
//          notes are dropped with their unit (see todo-text.mjs), so the
//          preview reads as finished (CHARTER §15: poster-only, no empty tiles)
//   fail   launch builds: refuse to build while any `{{TODO` remains in src/
//
// TODO_MODE=show|hide|fail overrides the default (fail for `astro build`, show otherwise).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasTodo, resolveProse, splitTodo } from './todo-text.mjs';

const TEXT_FILES = /\.(md|mdx|ya?ml|json|astro|ts|js|mjs|css|html)$/;

// Motion and type rules from the design spec (§2 A3, A14): nothing animates for
// decoration, and type is set with longhands only.
const BANNED_STYLES = [
  [/transition:\s*all\b/, '"transition: all"; name the properties'],
  [/animation-timeline/, 'scroll-driven animation'],
  [/scroll-behavior:\s*smooth/, 'smooth scrolling'],
  [/will-change/, '"will-change"'],
  [/(?:^|[;{\s])font:\s/, 'the "font" shorthand; use longhands'],
  [/font-feature-settings/, '"font-feature-settings"; use font-variant-*'],
];

export function resolveTodoMode() {
  const env = process.env.TODO_MODE;
  if (env === 'show' || env === 'hide' || env === 'fail') return env;
  return process.argv.includes('build') ? 'fail' : 'show';
}

/** What components and Markdown render with: a launch build renders like a showcase. */
export const renderMode = (mode) => (mode === 'show' ? 'show' : 'hide');

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (TEXT_FILES.test(entry.name)) yield path;
  }
}

async function scan(root) {
  const todos = [];
  const styles = [];
  for await (const file of walk(join(root, 'src'))) {
    const text = await readFile(file, 'utf-8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (hasTodo(line)) todos.push(`  ${relative(root, file)}:${i + 1}  ${line.trim()}`);
    });
    if (!/\.(css|astro)$/.test(file)) continue;
    const css = file.endsWith('.css') ? text : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
    for (const [pattern, what] of BANNED_STYLES) {
      if (pattern.test(css)) styles.push(`  ${relative(root, file)}: ${what}`);
    }
  }
  return { todos, styles };
}

/** Astro integration: blocks launch builds with open notes, lints styles, marks previews noindex. */
export function todoGuard(mode) {
  return {
    name: 'todo-guard',
    hooks: {
      'astro:config:setup': async ({ command, config, logger }) => {
        if (command !== 'build' && command !== 'dev') return;
        const { todos, styles } = await scan(fileURLToPath(config.root));
        if (styles.length) {
          const message = `Styles that break the design's motion and type rules:\n${styles.join('\n')}`;
          if (command === 'build') throw new Error(message);
          logger.warn(message);
        }
        if (command !== 'build' || todos.length === 0) return;
        if (mode !== 'fail') {
          logger.warn(`${todos.length} open {{TODO notes, rendered in "${mode}" mode. The launch build refuses to run until they are resolved.`);
          return;
        }
        throw new Error(
          `Launch build blocked: ${todos.length} unresolved {{TODO notes.\n` +
            `Resolve them, or build a preview with \`npm run build:showcase\` or \`npm run build:review\`.\n\n` +
            todos.join('\n'),
        );
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (mode === 'fail') return;
        // Previews and mirrors stay out of search engines until launch (Netlify reads this file).
        await writeFile(new URL('_headers', dir), '/*\n  X-Robots-Tag: noindex\n');
        logger.info('Wrote _headers: noindex on every page of this preview build.');
      },
    },
  };
}

const textRuns = (node, out = []) => {
  if (node.type === 'text') out.push(node);
  else for (const child of node.children ?? []) textRuns(child, out);
  return out;
};

/** Sätteri hast plugin: renders (review) or resolves (showcase) notes inside Markdown bodies. */
export function todoNotes(mode) {
  const show = renderMode(mode) === 'show';
  const where = (ctx) => (ctx.fileURL ? relative(process.cwd(), fileURLToPath(ctx.fileURL)) : 'Markdown');
  // Notes are resolved per block of running text, so a sentence-level gap goes with its sentence.
  const BLOCKS = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dt', 'dd', 'td', 'th', 'figcaption'];

  if (!show) {
    return {
      name: 'todo-notes-hide',
      element: {
        filter: BLOCKS,
        visit(node, ctx) {
          const runs = textRuns(node);
          if (!runs.some((r) => hasTodo(r.value))) return;
          const resolved = resolveProse(runs.map((r) => r.value), where(ctx));
          if (resolved.join('').trim() === '') {
            ctx.removeNode(node);
            return;
          }
          // Rebuild the block as plain hast with the resolved text in each run.
          const plain = JSON.parse(JSON.stringify(node));
          textRuns(plain).forEach((run, i) => (run.value = resolved[i]));
          ctx.replaceNode(node, plain);
        },
      },
    };
  }

  return {
    name: 'todo-notes-show',
    element: {
      filter: BLOCKS,
      visit(node, ctx) {
        // Review builds render every note, but still flag a gap that would break a sentence.
        const runs = textRuns(node);
        if (!runs.some((r) => hasTodo(r.value))) return;
        try {
          resolveProse(runs.map((r) => r.value), where(ctx));
        } catch (error) {
          console.warn(`[todo-notes] ${error.message}`);
        }
      },
    },
    text(node, ctx) {
      if (!hasTodo(node.value)) return;
      ctx.replaceNode(
        node,
        splitTodo(node.value).map((part) =>
          'note' in part
            ? { type: 'element', tagName: 'span', properties: { className: ['todo'] }, children: [{ type: 'text', value: `[${part.note || 'to come'}]` }] }
            : { type: 'text', value: part.text },
        ),
      );
    },
  };
}
