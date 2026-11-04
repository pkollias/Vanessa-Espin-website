// The site can be served from a sub-path (GitHub Pages: /<repo>/) as well as
// from a domain root (Netlify, vanessaespin.com). Every internal link and
// public file goes through withBase(); Astro handles its own /_astro assets.
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** "/about" → "/about", or "/repo/about" when served from /repo/. "/" → the site's home. */
export const withBase = (path: string) => {
  if (/^[a-z]+:/i.test(path)) return path; // absolute URLs and mailto: stay as they are
  return path === '/' ? `${BASE}/` : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};
