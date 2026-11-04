// @ts-check
import { defineConfig, fontProviders, sharpImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { renderMode, resolveTodoMode, todoGuard, todoNotes } from './integrations/todos.mjs';

const todoMode = resolveTodoMode();

// Only the launch build, which refuses to run while notes remain, may be indexed.
const indexable = todoMode === 'fail';

// The Latin range of the Google Fonts files: every Spanish character is in it.
const LATIN = [
  'U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC', 'U+0304', 'U+0308',
  'U+0329', 'U+2000-206F', 'U+20AC', 'U+2122', 'U+2191', 'U+2193', 'U+2212', 'U+2215', 'U+FEFF', 'U+FFFD',
];

export default defineConfig({
  // GitHub Pages builds set SITE_URL and BASE_PATH (.github/workflows/pages.yml).
  // Netlify previews use their own address, so share images resolve there.
  site:
    process.env.SITE_URL ||
    (process.env.CONTEXT && process.env.CONTEXT !== 'production' ? process.env.DEPLOY_PRIME_URL : undefined) ||
    'https://vanessaespin.com',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [todoGuard(todoMode), ...(indexable ? [sitemap({ filter: (page) => !page.includes('/og/') })] : [])],
  markdown: { processor: satteri({ hastPlugins: [todoNotes(todoMode)] }) },
  image: {
    service: sharpImageService({
      avif: { quality: 64, effort: 6, chromaSubsampling: '4:4:4' },
      webp: { quality: 82, effort: 6, smartSubsample: true },
    }),
  },
  vite: {
    define: {
      __TODO_MODE__: JSON.stringify(renderMode(todoMode)),
      __INDEXABLE__: JSON.stringify(indexable),
    },
  },
  fonts: [
    {
      // EB Garamond only (CHARTER §8.1): the Google Fonts v33 files the approved
      // mocks load, committed with their licence in src/assets/fonts/. One
      // variable upright file covers 400–600; italic is 400 only.
      provider: fontProviders.local(),
      name: 'EB Garamond',
      cssVariable: '--font-garamond',
      fallbacks: ['Garamond', 'Georgia', 'serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/eb-garamond-v33-latin-wght.woff2'], weight: '400 600', style: 'normal', unicodeRange: LATIN },
          { src: ['./src/assets/fonts/eb-garamond-v33-latin-italic-400.woff2'], weight: '400', style: 'italic', unicodeRange: LATIN },
        ],
      },
    },
  ],
});
