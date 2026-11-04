> **What this is.** The enhancement spec produced on Nov 3, 2026 by a design workflow: five specialists (typography, motion, imagery, phone layout, unmocked pages) proposed changes within the approved design, a charter guardian and a creative director judged them, and a lead designer merged the result. CHARTER.md wins wherever the two differ.
>
> **What was built.** Everything below except: the hand-tuned fallback font faces (Astro generates metric-matched fallbacks itself), the build-time typesetter and its name bonds (A19), the glyph guard (A21), the lightbox (A25, deferred until poster files at least 1,080px wide exist) and the per-file allow-list for low-resolution images. File paths under `/private/tmp` refer to working files that were not kept.

# vanessaespin.com: final enhancement spec (v2 build)

Builds on the existing Astro 7.4.5 tree in `/Users/kollias/Desktop/Projects/Vanessa_Espin_site`. That tree already has `integrations/todos.mjs` with `TODO_MODE=show|hide|fail`, `src/lib/todo.ts`, `src/pages/og/[name].jpg.ts`, `netlify.toml` (with the `/_astro/*` immutable header) and the `build:showcase` / `build:review` scripts. Everything below extends those files. No new mode variables and no parallel routes.

## 1. Principles

1. **The mocks are the design.** At 1280px the header, Home, the Iyuana page and About must pixel-diff against `design-reference/*.html` with no changed line breaks and no moved boxes. A change is allowed at 1280 only if it is invisible at rest (hover, focus, transition, selection), or if it shifts glyphs without rewrapping and is logged in §17.
2. **The work stays the hero.** Her posters are shown whole, sharp and never cropped. They come forward only when she or a visitor acts on them. Swapping the 420px stand-ins for real files is worth more than every other item here.
3. **One gesture, one hand.** Every state uses oxblood, a 1px hairline and one set of timings. There is no load or scroll animation, and nothing moves for decoration.
4. **The showcase must read as finished.** Missing content is removed as whole units, with no brackets and no orphaned separators. Production still refuses to build while any `{{TODO` remains.
5. **Zero JavaScript.** Every enhancement is CSS, HTML attributes or build-time Node. The only exception is a JSON `speculationrules` element, logged in §16.

## 2. Accepted (priority order)

### A0. Charter edits first (working agreement 18). Make them before any code.
- **§8.1 Links.** "No underline at rest; hover adds a 1px hairline; links inside running text are underlined."
- **§8.1 Type.** Add: "proportional lining figures; one ::selection (cream on oxblood); 2px oxblood focus ring".
- **§8.6.** Replace the open items with pointers to the resolutions in sections 2–4 of this spec: phone layout, hover/focus, unmocked pages.
- **§11 Fonts.** "Committed Google Fonts v33 latin files (one variable upright 400–600 plus 400 italic) with OFL.txt; latin only; build fails on any glyph outside the shipped cmap." Remove `@fontsource/eb-garamond`.
- **§11 JavaScript / §16.** Log one deliberate exception: a JSON-only `<script type="speculationrules">`. Close the remaining §16 open items: the phone layout is resolved, Contact is mailto only, the host is Netlify.
- **§7.** LinkedIn becomes `https://www.linkedin.com/in/vanessaespin` (from the résumé header), still with a confirm note. Instagram stays "Needed".
- **§17 deliberate differences.** Log each of these:
  - Logo letter-spacing 0.2px on every page. Only home.html had it.
  - Proportional figures: digits after a "1" shift by up to 3px, with no rewrap.
  - The header uses a grid and puts the logo first in the DOM. No pixel changes.
  - Showcase variants: the EACC text band, the poster-only Iyuana band, and the no-photo program row with the poster on paper.
  - The Ayazamana stand-in is trimmed to 314px. This applies to the stand-in only.
  - The pull-quote hang, once a quote ships.
- **Appendix A.**
  - Restructure Iyuana paragraph 2 (see 4.2).
  - Add a draft EACC role-page body, written from the résumé lines only, with each paragraph followed by `{{TODO: confirm}}`.
  - Add the Flywheel facts labels "Work" and "Brands".
- **`integrations/todos.mjs` header comment.** Notes render as **roman** `[brackets]` in the surrounding type, not italic.

### A1. Real posters before the reveal, plus one resolution guard
Merges img-standin-guard and gaps-image-resolution.
- **No upscaling of any kind, including AI.** Until replacements arrive, the stand-ins render as they are. astro:assets already caps the srcset at the source width.
- **Ayazamana trim.** Run once with `scripts/trim-ayazamana.mjs`: `sharp(src).extract({ left: 10, top: 0, width: 408, height: 525 }).png()` writes `src/content/programs/ayazamana-poster.png`. Copy the untrimmed original to `reference/extracted-images/` for provenance.
- **Guard.** `src/lib/slots.ts` exports a `MIN_SOURCE_WIDTH` table:

  | Image | Minimum source width |
  |---|---|
  | poster | 968 |
  | portrait | 960 |
  | program photo | 1388 |
  | cover photo | 668 |
  | gallery tile | 960 |
  | EACC grid cell | 432 |
  | thumb | 216 |

  Each figure is 2× the widest CSS width the slot reaches in the adopted layout. The image components compare `src.width` against it.
  - `TODO_MODE=fail`: throw an `AstroError` listing file, slot, actual width and required width.
  - `show` / `hide`: print the same list as a warning. That list is the shopping list for originals.
  - An escape hatch exists: a per-file allow-list in `site.yaml`, logged in §17.
- **Originals spec.**
  - Posters at least 1080×1350. Her own public Instagram 4:5 exports, or the venues' listings, qualify, so nobody has to ask her.
  - Portrait at least 960×1000 at 24:25.
  - Photos at least 2100px on the long edge, JPEG or PNG, not HEIC.
  - Ayazamana comes first, because its top is cropped.
- Visible at 1280 at rest: no, apart from the Ayazamana stand-in being 314px wide instead of 323px.

### A2. Exact font files, metric fallbacks, preload
Merges type-exact-font-files and type-metric-fallbacks.
- **Fetch script.** `scripts/fetch-fonts.mjs` fetches both files, verifies their SHA-256 and writes them to `src/assets/fonts/`. Commit `OFL.txt` beside them.

  | File | Source | Size | SHA-256 |
  |---|---|---|---|
  | `eb-garamond-v33-latin-wght.woff2` | `https://fonts.gstatic.com/s/ebgaramond/v33/SlGUmQSNjdsmc35JDF1K5GR1SDk_YAPI.woff2` | 44,172 B | `68fd4b247dde89984ee835d99953d235e4927be2b1b732ad81173b519869cee8` |
  | `eb-garamond-v33-latin-italic-400.woff2` | `https://fonts.gstatic.com/s/ebgaramond/v33/SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7e8QL99U6i1hGFJRvw.woff2` | 25,412 B | `078bb1c082255b93ded45a05e4009221edb4727f64a77d4f19c9d4715d02e297` |

- **`astro.config.mjs`.** Replace the `SUBSETS` / Fontsource block. **Keep `cssVariable: '--font-garamond'`.**
  ```js
  const LATIN = ['U+0000-00FF','U+0131','U+0152-0153','U+02BB-02BC','U+02C6','U+02DA','U+02DC','U+0304','U+0308','U+0329','U+2000-206F','U+20AC','U+2122','U+2191','U+2193','U+2212','U+2215','U+FEFF','U+FFFD'];
  fonts: [{ provider: fontProviders.local(), name: 'EB Garamond', cssVariable: '--font-garamond',
    display: 'fallback', optimizedFallbacks: false,
    fallbacks: ['EB Garamond Fallback', 'EB Garamond Fallback Noto', 'Garamond', 'Georgia', 'serif'],
    options: { variants: [
      { src: ['./src/assets/fonts/eb-garamond-v33-latin-wght.woff2'], weight: '400 600', style: 'normal', unicodeRange: LATIN },
      { src: ['./src/assets/fonts/eb-garamond-v33-latin-italic-400.woff2'], weight: '400', style: 'italic', unicodeRange: LATIN } ] } }]
  ```
  Remove `@fontsource/eb-garamond` from `package.json`. Do not use `fontProviders.google()`.
- **Fallback faces.** Add the four `@font-face` rules from type-metric-fallbacks verbatim to `src/styles/global.css`. They cover Times New Roman / Liberation Serif (upright and italic) and Noto Serif (upright and italic), with the given size-adjust, ascent, descent and line-gap overrides.
- **Preload in `Base.astro`.** Use `<Font cssVariable="--font-garamond" preload={preloadItalic ? [{weight:'400',style:'normal'},{weight:'400',style:'italic'}] : [{weight:'400',style:'normal'}]} />`. `preloadItalic` is true on `/`, `/brand-work` and `/about` only.
- **No global line-height reset.** Leave `normal` wherever the mocks leave it unset.
- Visible at 1280 at rest: no. These are the mocks' own bytes. Re-run the 1280 pixel diff after the switch.

### A3. Global type rendering, figures, selection, declaration rules
These go in `src/styles/global.css`.
```css
html { font-kerning: normal; font-variant-ligatures: common-ligatures; font-variant-numeric: proportional-nums;
       font-synthesis: none; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; hyphens: manual;
       scrollbar-gutter: stable; caret-color: var(--oxblood); accent-color: var(--oxblood); }
.on-dark { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; } /* filled button, review placeholders only */
::selection { background-color: var(--oxblood); color: var(--cream); text-shadow: none; }
```
- **Rules for every component.**
  - Use longhands only: `font-family`, `font-size`, `font-weight`, `font-style`, `line-height`, `font-variant-*`.
  - Never use the `font` shorthand, `font-feature-settings`, `text-rendering`, or font smoothing on `body`.
  - Set `tabular-nums` locally, and only on a future aligned column.
- **Sizes in rem, tracking in em.**
  - Sizes: 50px = 3.125rem, 30 = 1.875, 26 = 1.625, 20 = 1.25, 19 = 1.1875, 18 = 1.125, 17 = 1.0625, 16 = 1, 15 = .9375, 13 = .8125.
  - Tracking: labels `0.0923em`, logo `0.0067em` on every page.
- **Style conventions.**
  - Ragged right, never justified.
  - Titles of works are italic in running prose (`<i lang="es">Herencia Viva</i>`) and roman in display.
  - No small caps, old-style figures, discretionary ligatures or swashes.
- Visible at 1280 at rest: proportional figures shift digits by up to 3px with no rewrap (logged in §17). Everything else is pixel-identical.

### A4. Layout backbone: one page container plus fluid tokens
From phone-container-architecture and phone-fluid-scale. Full details are in section 3.
- Containers: `main{container:page/inline-size}`, plus component containers `media`, `info`, `tb` and `credit`.
- Every clamp lands on the §8.1 value at ≥1240px. Put the threshold table in one comment in `src/styles/tokens.css`, next to `src/lib/slots.ts`.
- Visible at 1280: no. A geometry diff of 108 boxes was within 0.1px.

### A5. Cover band hover and focus
From motion-band-hover-focus. Lives in `src/components/CoverBand.astro`.
- **Markup.**
  - `<a class="band" href="/programs/{slug}" style="--vt-name: poster-{slug}" aria-labelledby="{slug}-title" aria-describedby="{slug}-meta">`
  - Title: `<h2 id="{slug}-title" class="band__title"><span class="band__title-text" lang={titleLang}>…</span></h2>`
  - Meta lines go in `<div id="{slug}-meta">`.
  - Images get `alt=""`.
  - Reset the h2 to the mock's `<p>` metrics: `margin:0; font-size:var(--fs-cover-title); line-height:1.2; font-weight:500`. Pixel-diff it.
- **CSS.**
```css
.band { color: var(--ink); }
.band__title-text { padding-bottom: 3px; background: linear-gradient(currentColor,currentColor) 50% 100% / 0% 1px no-repeat;
  -webkit-box-decoration-break: clone; box-decoration-break: clone;
  transition: color 160ms ease, background-size 220ms var(--ease-out); }
.band__poster, .band__grid { transition: transform 450ms var(--ease-out); }
@media (hover:hover) and (pointer:fine) { .band:hover .band__title-text { color: var(--oxblood); background-size: 100% 1px; transition-duration: 160ms, 380ms; } }
.band:focus-visible .band__title-text { color: var(--oxblood); background-size: 100% 1px; }
@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference) { .band:hover :is(.band__poster,.band__grid) { transform: scale(1.02); transition-duration: 700ms; } }
@media (prefers-reduced-motion:no-preference) { .band:focus-visible :is(.band__poster,.band__grid) { transform: scale(1.02); transition-duration: 700ms; } }
.band:focus-visible { outline-offset: 6px; }
```
- **What lifts.**
  - Only the poster lifts. The photo never scales.
  - The EACC grid lifts as one block.
  - A text band only gets the title hairline.
  - This overrides the image lens's "images never move", but only inside band and card links. Gallery tiles, the portrait and project heroes never move.
- Visible at 1280 at rest: no.

### A6. More-programs card hover and focus
From motion-card-hover-focus.
- Markup: `<a class="card" href style="--vt-name: poster-{slug}">` with `<img class="card__thumb" alt="">` and `<span class="card__title-text">`.
- Same rules as the band, with three changes:
  - `background-position: 0 100%`, so the hairline grows from the left.
  - `padding-bottom: 1px`.
  - The thumb scales to `1.04`.
- Same durations as the band. Ring offset 6px. The date stays muted.
- Visible at 1280 at rest: no.

### A7. Text links
From motion-link-family.
- **Nav and quiet links** (header socials, footer email and Instagram):
  - Rest: `text-decoration: underline 1px transparent; text-underline-offset: .32em; transition: color 160ms ease, text-decoration-color 160ms ease`.
  - Hover, inside `@media (hover:hover) and (pointer:fine)`: `color: var(--oxblood); text-decoration-color: currentColor`.
  - Font weight never changes on hover. Active is `[aria-current="page"]{font-weight:600;color:var(--oxblood)}`, and is never animated.
- **Masthead link.** Keep `border-bottom:1px solid currentColor; padding-bottom:2px`. On hover add `box-shadow: 0 1px 0 0 currentColor`, with a 160ms `var(--ease-out)` transition.
- **Links in running text** (credit line, role-page facts and body): `color: var(--oxblood); text-decoration: underline 1px; text-underline-offset: .22em`. On hover, `text-decoration-thickness: 2px`.
- **Logo.** No hover change, focus ring only.
- Move the mock's global `a:hover` into `@media (hover:hover)`.
- Visible at 1280 at rest: no. The mocks contain no in-text links.

### A8. Buttons
From motion-button-states. Shared with Contact.
```css
.btn { border:1px solid var(--oxblood); color:var(--oxblood); background:transparent; padding:10px 19px; font-size:1.0625rem; transition: background-color 160ms ease, color 160ms ease; }
@media (hover:hover) and (pointer:fine) { .btn:hover { background-color:var(--oxblood); color:var(--paper); } }
@media (prefers-reduced-motion:no-preference) { .btn:active { transform: translateY(1px); } }
.btn--solid { background:var(--oxblood); color:var(--paper); }               /* add .on-dark */
@media (hover:hover) and (pointer:fine) { .btn--solid:hover { background:var(--paper); color:var(--oxblood); } }
```
- Visible at 1280 at rest: no. The resting buttons match about.html.

### A9. One focus ring
From motion-focus-ring.
```css
:focus-visible { outline: 2px solid var(--oxblood); outline-offset: 4px; }
.band:focus-visible, .card:focus-visible { outline-offset: 6px; }
:is(input,textarea,select):focus-visible { outline-offset: 2px; }
@media (prefers-reduced-motion:no-preference) { :focus-visible { animation: ring-in 180ms var(--ease-out); } }
@keyframes ring-in { from { outline-offset: 9px; outline-color: rgb(71 0 0 / 0); } }
@media (forced-colors:active) { :focus-visible { outline-color: Highlight; } }
```
- Never use `outline: none` or a box-shadow ring. Contact uses this ring too: 4px, not 3px.
- If the settle reads as fussy in QA, drop it first.
- Visible at rest: no.

### A10. Skip link
From motion-skip-link.
- The first element in `<body>` is `<a class="skip" href="#main">Skip to content</a>`. Every page has `<main id="main">`.
- CSS: `.skip{position:absolute;top:6px;left:max(24px,calc(50% - 596px));z-index:10;padding:3px 10px;font-size:.9375rem;line-height:1.4;background:var(--cream);color:var(--oxblood);transform:translateY(-150%)} .skip:focus-visible{transform:none}`.
- Below 960px, while focused, it may cover the top edge of the centred logo. That is acceptable, but check it at 375px.
- Visible at rest: no.

### A11. Page crossfade
From motion-page-crossfade.
```css
@media (prefers-reduced-motion:no-preference) { @view-transition { navigation: auto; } }
::view-transition-group(root) { animation-duration: 280ms; }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 280ms; animation-timing-function: cubic-bezier(0.4,0,0.2,1); }
```
- Override only the duration and easing.
- There is exactly one `@view-transition` rule in the codebase.
- Do not name the header, logo, footer, titles, photos or grid tiles.
- Do not use `<ClientRouter />`, `transition:name` or `transition:animate`.
- `Header.astro` must render byte-identically on every page, with the logo at 0.2px everywhere.
- Visible at rest: no.

### A12. Poster morph
From motion-poster-morph, plus parts 2 and 3 of motion-morph-image-readiness.
```css
.band__poster, .card__thumb, .project-poster { view-transition-class: poster; }
.project-poster { view-transition-name: var(--vt-name); }
.band:is(:hover,:focus) .band__poster, .card:is(:hover,:focus) .card__thumb { view-transition-name: var(--vt-name); }
::view-transition-group(*.poster) { animation-duration: 480ms; animation-timing-function: cubic-bezier(0.2,0,0,1); }
::view-transition-new(*.poster) { animation: vt-in 200ms cubic-bezier(0.4,0,0.2,1) both; }
::view-transition-old(*.poster) { animation: vt-out 480ms cubic-bezier(0.7,0,0.84,0) both; }
::view-transition-old(*.poster):only-child { animation-duration: 280ms; animation-timing-function: cubic-bezier(0.4,0,0.2,1); }
::view-transition-new(*.poster):only-child { animation-duration: 280ms; }
@keyframes vt-in { from { opacity: 0; } }  @keyframes vt-out { to { opacity: 0; } }
```
- **Naming.** The hero is `<img class="project-poster" style="--vt-name: poster-{slug}">`.
  - The slug is the collection id. Enforce `/^[a-z0-9]+(-[a-z0-9]+)*$/` in `content.config.ts`.
  - Assert in code that More programs excludes the current program.
- **Not morphed.** The EACC grid, Brand Work and posterless pages only get the crossfade.
- **Hero loading.** The hero uses Astro's `priority` (eager, `fetchpriority="high"`).
- **Speculation rules.** `Base.astro` gets `<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/*.pdf"}}]},"eagerness":"moderate"}]}</script>`, logged in §16. Check it in a normal Chrome window under DevTools > Application > Speculative loads.
- **Not adopted.** The shared hero-size srcset for band posters is skipped (see Rejected).
- **QA.** Test in Safari 18.2+. If `view-transition-class` falls back badly there, accept Safari's default morph. If 480ms feels long on a real device, 420ms is the allowed tightening.
- Visible at rest: no.

### A13. Reduced motion, touch, hit areas
Merges motion-reduced-motion-touch and phone-touch-and-tap. Each rule is declared once.
- **Reduced motion.**
  - Everything spatial lives only inside `prefers-reduced-motion: no-preference`: the `@view-transition`, scale, press and ring settle.
  - `@media (prefers-reduced-motion:reduce){ .band__title-text, .card__title-text { transition: color 160ms ease; } }`.
  - No blanket `transition:none !important`.
- **Touch.**
  - `a { -webkit-tap-highlight-color: rgb(71 0 0 / .08); }`.
  - Hover visuals stay only inside `(hover:hover) and (pointer:fine)`.
  - The view-transition naming rule stays ungated.
  - No hover rule changes `display` or `visibility`.
- **Hit areas.** `@media (any-pointer:coarse){ .hit{position:relative} .hit::after{content:'';position:absolute;inset:-12px -8px} }` on the nav, socials, masthead link and footer links in row layouts. Not on the logo. The stacked phone footer gets real 44px rows instead (section 3).
- Footer email becomes `mailto:`. The Instagram link renders only when a handle exists.
- Visible at rest: no.

### A14. Motion allowlist and code guard
From motion-system-allowlist.
- **Tokens** in `tokens.css`:
  - Easing: `--ease-out: cubic-bezier(0.22,1,0.36,1); --ease-std: cubic-bezier(0.4,0,0.2,1); --ease-travel: cubic-bezier(0.2,0,0,1)`.
  - Durations: `--t-color:160ms; --t-line-in:380ms; --t-line-out:220ms; --t-lift-in:700ms; --t-lift-out:450ms; --t-ring:180ms; --t-page:280ms; --t-travel:480ms`.
  - Inside `::view-transition-*` rules, write literal values.
- **Allowed to animate:** opacity, transform, color, text-decoration-color and thickness, background-size (the hairline), box-shadow (the masthead line only), outline-offset and outline-color.
- **Never:**
  - load or entrance animations
  - `animation-timeline`, parallax, `scroll-behavior: smooth`
  - sticky, shrinking or hide-on-scroll headers
  - hover on non-interactive images
  - `:visited` styles
  - fade-in on image load, spinners or shimmer
  - layout properties, font-weight or size, filter or blur
- **Guard.** In `integrations/todos.mjs` at `astro:config:setup`, scan `src/styles/**` and the `<style>` blocks in `src/**/*.astro`. Throw in every build mode, and warn in dev, on any of:
  - `transition:\s*all`
  - `animation-timeline`
  - `scroll-behavior:\s*smooth`
  - `will-change`
  - `\bfont:\s` (shorthand)
  - `font-feature-settings`
- Visible: no.

### A15. Posters keep their own shape
img-poster-frame, folded into the cover plates.
- Pass `style="--r:{(w/h).toFixed(4)}"` from astro:assets metadata. Never type it by hand.
- **Band poster:** `.band__poster{display:block;flex:none;height:100%;width:auto;max-width:100%;aspect-ratio:var(--r);object-fit:contain;background-color:var(--ph)}` inside `.band-media{display:flex;justify-content:center;align-items:center;gap:10px;padding:18px}`. A 4:5 poster resolves to 323.2×404 at 1280.
- **Project poster:** `.lead-poster{flex:2 1 300px;min-width:0;max-width:484px}` with `img{display:block;width:100%;height:auto}`, giving 482.4×603.
- No `object-fit: cover` on any poster slot (band, page, lightbox, OG). The 72×90 thumbs may cover-crop by 5% or less.
- Visible at 1280: no, for 4:5 sources.

### A16. Image slots and priority
Merges img-slot-srcset and phone-image-sizes into one `src/lib/slots.ts`, recomputed from the adopted layout. Use `<Picture formats={['avif']} fallbackFormat="webp">` with explicit widths and sizes, not Astro's `layout`.

| Slot | Size at 1280 | widths | sizes |
|---|---|---|---|
| Cover poster | 323.2×404 | 240,324,480,648,972 | `(max-width: 487.98px) calc(80vw - 67px), 324px` |
| Cover photo (Iyuana) | 334×404, crop 334:404 | 334,668 | in a `<picture><source media="(min-width:1002px), (min-width:608px) and (max-width:767.98px)">`, sizes `(max-width:767px) calc(100vw - 417px), (max-width:1239px) calc(60vw - 410px), 334px`. The fallback `<img>` is a 1×1 data GIF, `width=334 height=404` |
| EACC grid cell | 216×128 | 216,432 | `(max-width:767px) calc(33.33vw - 35px), (max-width:1239px) calc(20vw - 32px), 216px` |
| Project poster (pair) | 482.4×603 | 360,483,720,968 | `(max-width:527px) calc(100vw - 48px), (max-width:783px) calc(41.67vw - 27px), (max-width:1239px) calc(40vw - 14px), 483px` |
| Project poster (solo) | 482.4×603 | 360,483,720,968 | `(max-width:530px) calc(100vw - 48px), 483px` |
| Project photo | 693.6×603 | 694,1040,1388 | `(max-width:527px) calc(100vw - 48px), (max-width:783px) calc(58.33vw - 37px), (max-width:1239px) calc(60vw - 50px), 694px` |
| Gallery tile 4:3 | 386.7×290 | 388,580,776,960 | `(max-width:527px) calc(100vw - 48px), (max-width:979px) calc(50vw - 32px), (max-width:1239px) calc(33.33vw - 27px), 387px` |
| Thumb | 72×90 | densities 1,2,3 | `72px` |
| Portrait 24:25 | 478.4×498.3 | 480,720,960 | `(max-width:488px) calc(100vw - 48px), (max-width:747px) 440px, (max-width:843px) calc(43.24vw - 45px), (max-width:1239px) calc(40vw - 18px), 479px` |

- **`priority` goes on:**
  - Home: the Iyuana band poster, and its photo when one exists.
  - Program pages: the lead poster, and the photo when present.
  - About: the portrait.
  - Brand Work: the first band image.
- Everything else stays lazy.
- Visible: no.

### A17. Encoding and loading tint
From img-encode-placeholder, solid tint only.
- **Encoder config:** `image: { service: sharpImageService({ avif: { quality: 64, effort: 6, chromaSubsampling: '4:4:4' }, webp: { quality: 82, effort: 6, smartSubsample: true } }) }`. Never pass quality per image.
- **Loading tint `--ph`** on each image:
  - dark panels (luminance below 0.18): `color-mix(in oklab, var(--panel), white 8%)`
  - light panels: `color-mix(in oklab, var(--panel), #1F1A19 8%)`
  - on paper: `var(--cream)`
- Visible: no.

### A18. One MetaLine component
Merges type-meta-line-segments, phone-meta-one-fact-per-line and the segment parts of gaps-field-rules. Lives in `src/components/MetaLine.astro` and takes `parts: (string|null)[]`.
- **Inputs.** Built only from separate frontmatter fields: `type, role` / `place, dateShort` / `type, place, dateLabel` / `city, languages` / footer parts / credit segments. A preformatted `' · '` string is a validator warning.
- **Dropping parts.** Empty parts and GAP parts are dropped. CHECK notes are stripped (see 4.2).
- **Markup.** `<span class="seg">phrase<span class="sep">&nbsp;·</span></span> <span class="seg">last</span>`.
- **Parity rule at 1280.**
  - `.seg{display:inline}` at ≥1240px viewport, so line breaks match the mocks exactly.
  - `@media (max-width:1239.98px){.seg{display:inline-block}}`.
  - The nbsp before the dot applies at every width, which is characters only.
- **One fact per line** (`.seg{display:block}` and `.sep{display:none}`):
  - `@container info (width < 420px)`
  - `@container tb (width < 560px)`, plus `.sub{line-height:1.35}`
  - `@container credit (width < 600px)`
  - footer `@media (max-width:639.98px)`
- Use it for the cover lines, project subtitle, credit line, About and Contact contact line, footer and More programs dates.
- Visible at 1280: no.

### A19. Build-time typesetter
type-typeset-filter, limited for 1280 parity. `src/lib/typeset.ts`, a `<T text lang?>` component (no `set:html`), and a Sätteri hast plugin added to `hastPlugins` **after** `todoNotes`. The plugin skips `span.todo`, `code` and `pre`.
1. **Normalize.** NFC. U+202F and U+2009 become U+00A0. U+2011 becomes `-`. Strip U+200B, U+2060 and U+FEFF.
2. **Quotes.** Curly double quotes and apostrophes, using the stated rules: `Medina’s`, `’26`, `“Panchis”`. Only straight quotes are touched.
3. **Dashes.** ` -- ` becomes `&nbsp;– ` and `--` becomes `–`.
4. **Separators.** ` · ` becomes `&nbsp;· `.
5. **Bonds.**
   - **Character-level, at all widths:** `©`+year, month (or abbreviation)+number, and a 1–3 digit number (optionally with `+`)+the next lowercase word. Digit–digit ranges are wrapped in `<span class="nowrap">` (`white-space:nowrap`). Each of these must pass the 1280 pixel diff on all three mocks. Any rule that rewraps moves to the span form below.
   - **Span-level, `<span class="bond">`:** the owner's name, `artists[].name`, partner names (first two words if longer), the `site.yaml` `bonds` list (Latin America, New York, Long Island City, Flushing Town Hall, City Tech, Sápara Nation), and `I`+the next word. CSS: `@media (max-width:1239.98px){.bond{white-space:nowrap}}`. This keeps the About mock's breaks at 1280 and fixes phones.
- **Lint.**
  - Patterns: `/\d-\d/` in `dateLabel` or `dateShort` ("use an en dash"); a spaced en dash between bare numbers ("close it up").
  - `fail` mode throws; `show` and `hide` warn.
  - Address hyphens are never touched.
- Visible at 1280: no (by construction, after the diff gate).

### A20. Balanced and pretty wrapping
type-wrap-balance-pretty, with the parity rule.
- `.band__title, .page-subtitle, .credit-line, .pq, .card__title-text { text-wrap: balance; }`
- `p, .facts dd, .partners { text-wrap: pretty; }`
- Cover meta lines: `@media (max-width:1239.98px){ .cover-meta { text-wrap: balance; } }`
- Visible at 1280: no. About and Iyuana were measured pixel-identical, and Home is held by the parity rule.

### A21. Glyph guard
From type-glyph-guard.
- Commit `src/assets/fonts/coverage.json`: 236 upright and 233 italic code points.
  - Generate it with a pinned script from the committed woff2 files: fontkitten `getBestCmap`-equivalent, or fontTools in a pinned venv.
  - Cross-check it against (working file, not kept).
- **Integration** (`integrations/glyph-guard.mjs`, on `astro:build:done`):
  - For each `dist/**/*.html`, take `<body>` and drop script, style, svg, comments and tags.
  - Decode entities and test every non-whitespace character against the cmap.
  - Report `page: U+2192 → …context…`.
  - Keyed to TODO_MODE: `fail` throws, other modes warn.
- Visible: no.

### A22. Pull quote
Template only. Renders only when a real quote exists.
- **Markup.** `<blockquote class="pull-quote" lang={quote.lang}><p class="pq"><span class="q-open">“</span>{text}<span class="q-close">”</span></p><p class="pq-by">{name}, {role}</p></blockquote>`. The component strips any marks typed into `quote.text`, and the README says so.
- **CSS.** `.pq{max-width:760px;margin:0 auto;font-size:var(--fs-quote);line-height:1.3;font-style:italic;color:var(--oxblood)} .q-open{margin-inline-start:-0.389em} .q-close{margin-inline-end:-0.39em}`. No `hanging-punctuation`.
- Add optional `lang` to the quote schema.
- Visible at 1280: the marks hang about 11.7px. Log it in §17 when the first quote ships.

### A23. Short pages keep the footer at the bottom
`.page{min-height:100vh;min-height:100svh;display:flex;flex-direction:column} main{flex:1 0 auto}`. Visible on the mocked pages: no.

### A24. Share cards and icons (section 5).

### A25. Lightbox (deferred until originals ≥1080px wide exist)
img-poster-lightbox mechanics, with motion-poster-viewer's timings.
- Render only if `poster.width >= 1080`.
- **Markup.**
  - Trigger: `<button type="button" class="poster-zoom" popovertarget="poster-full" aria-label="View poster larger">` around the hero. The image keeps its view-transition name.
  - `<div id="poster-full" popover class="lightbox">` containing a `<Picture>` with widths 1080,1620,2160, sizes `(min-aspect-ratio: 4/5) 74vh, 92vw`, `loading="lazy"` and the same alt as the hero.
  - `<button type="button" popovertarget="poster-full" popovertargetaction="hide" autofocus>Close</button>`, 17px, `#F5EFE8` text.
- **CSS.**
  - `.lightbox{display:none;margin:auto;padding:0;border:0;background:none;overflow:visible} .lightbox:popover-open{display:block}`
  - `.lightbox img{display:block;height:min(92dvh,115vw);width:auto}`
  - `::backdrop{background:rgb(20 16 14 / .94)}`
  - `.poster-zoom{display:block;padding:0;border:0;background:none;cursor:zoom-in}`
- **Transitions.**
  - In: opacity and transform `scale(.985)→none` over 220ms `var(--ease-out)`, with `overlay`/`display 220ms allow-discrete` and `@starting-style`.
  - Out: 160ms.
  - Reduced motion: opacity only.
- Visible at rest: no.

### A26. Photo rules for when event pictures arrive (future)
From img-photo-direction.
- **Gallery item schema:** `{ image, caption, alt?, kind: photo|piece|video, focus?: attention|top|center|bottom|left|right }`.
- **Photo crops.** Photos are server-cropped to the slot ratio with `fit:'cover', position: focus ?? 'attention'`: 334:404 for the band, 694:603 for the program page, 4:3 for tiles.
- **Pieces and video.** Pieces are contained on `var(--panel)` with 6% padding. Video is self-hosted: `<video controls playsinline preload="none" poster width height>`, H.264, 8 MB or less. Never the Instagram embed.
- **Captions** sit below the image in `<figcaption>`: 15px italic `--muted`, 8px gap.
- The gallery layout is in section 3.

### A27. Verification gate (every PR)
- Pixel-diff the header, Home, Iyuana and About at 1280 against `design-reference/` with headless Chrome at 1280×2600.
- Width sweep at 320–1440 checking for no horizontal overflow and a one-row nav.
- Lighthouse mobile 95+ on all three metrics.
- Keyboard-only pass.
- macOS Reduce Motion on.
- A real iPhone.
- The Noto fallback once on Android.

## 3. Phone and tablet layout

**Thresholds** (content-box widths inside `main{container:page/inline-size}`; viewport = content + 48):

| Switch | Threshold |
|---|---|
| Bands stack | under 720 |
| Cover photo hidden | media content under 524 |
| One fact per line | info under 420, title block under 560, credit under 600 |
| Project lead row | stacked under 480; nowrap 480–735 |
| Facts in two columns | 560–735 |
| Facts and body stack | under 736 |
| Gallery | 3 across from 932, 2 across 480–931, 1 under 480 |
| More programs become a list | under 812 |
| About statement | nowrap 700–795, stacked under 700 |
| About lower band | nowrap 700–775 |
| Header (viewport media queries) | 960 / 640 |
| Footer (viewport media query) | 640 |

Traps:
- Container queries measure the content box.
- An element can't query itself.
- A size container that is a column-flex item needs `width:100%`.

**Fluid tokens** (`tokens.css`; each equals the mock value at ≥1240):

| Token | clamp() | 375 → 1240 |
|---|---|---|
| `--fs-statement` | `clamp(1.625rem,1.5166rem + .4624vw,1.875rem)`; `@media (max-width:374.98px){--fs-statement:1.5rem}` | 26 → 30 (masthead h1, About h1) |
| `--fs-project-title` | `clamp(2.25rem,1.8707rem + 1.6185vw,3.125rem)` | 36 → 50 |
| `--fs-subtitle` | `clamp(1.0625rem,.9812rem + .3468vw,1.25rem)` | 17 → 20 |
| `--fs-body` | `clamp(1.125rem,1.0708rem + .2312vw,1.25rem)` | 18 → 20 |
| `--fs-quote` | `clamp(1.5rem,1.3374rem + .6936vw,1.875rem)` | 24 → 30 |
| `--fs-cover-title` | `clamp(1.5rem,1.4458rem + .2312vw,1.625rem)` | 24 → 26 |
| `--fs-lower` | `clamp(1.125rem,1.0979rem + .1156vw,1.1875rem)` | 18 → 19 |
| `--sp-72` | `clamp(44px,31.86px + 3.237vw,72px)` | bands bottom |
| `--sp-64` | `clamp(40px,29.6px + 2.7746vw,64px)` | title block top, quote top, statement top |
| `--sp-60` | `clamp(36px,25.6px + 2.7746vw,60px)` | masthead top |
| `--sp-56` | `clamp(36px,27.33px + 2.3121vw,56px)` | story, credit bottom, More bottom |
| `--sp-52` | `clamp(32px,23.33px + 2.3121vw,52px)` | masthead bottom |
| `--sp-48` | `clamp(32px,25.06px + 1.8497vw,48px)` | statement bottom |
| `--sp-40` | `clamp(28px,22.8px + 1.3873vw,40px)` | title block bottom, More top, lower band |
| header padding | `clamp(20px,13.93px + 1.6185vw,34px) 0 clamp(16px,11.665px + 1.1561vw,26px)` | |
| footer padding | `clamp(24px,22.27px + .4624vw,28px) 0 clamp(32px,28.53px + .9249vw,40px)` | |

Fixed at every width: logo 30, nav 18 (16–18 on phones), socials 16 (15 in the phone row), facts 17 with 13px labels, cover role 17, place 15, credit 16, footer 16, buttons 17, More 18/15, gutter 24, gaps 20/16/10.

**Header** (`Header.astro`; DOM order logo, nav, socials):
- **≥960:** `.site-header{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);grid-template-areas:'nav logo social';align-items:center;gap:12px 24px;border-bottom:1px solid var(--rule)}`.
  - Logo: `justify-self:center; white-space:nowrap`.
  - Nav: flex, gap 22px.
  - Socials: flex end, gap 18px.
- **640–959.98:** `grid-template-columns:1fr auto; grid-template-areas:'logo logo' 'nav social'; row-gap:14px`.
- **<640:**
  - One column, areas `'logo' 'nav' 'social'`, row-gap 16px.
  - Nav `flex-wrap:nowrap; justify-content:space-between; gap:0 8px; font-size:clamp(16px,11.6px + 1.5vw,18px)`.
  - Socials centred, gap 28px, 15px, margin-top 8px.
- No hamburger, nothing hidden, the nav is always one row. Log the grid and logo-first DOM in §17, and test focus order.

**Masthead:**
- Padding `var(--sp-60) 0 var(--sp-52)`, h1 `--fs-statement`, max-width 820px, balance.
- 18px link with a `.hit` area.

**Cover bands** (`@container page (width < 720px)`):
- **Stacking.** `.band, .band:nth-child(even){flex-direction:column}`, image first. Alternation applies only when bands sit side by side (≥768 viewport).
- **Image plate.** `.band-media{container:media/inline-size;flex:none;height:min(100cqi,440px)}` gives a square plate. The poster stays `height:100%` at its own `--r`, contained (A15): 233×291 at 375, capped at 323×404.
- **Info panel.** `.band-info{container:info/inline-size;flex:none;width:100%;min-height:0;padding:22px 24px 26px;gap:6px}`.
- **Landscape phones.** `@media (orientation:landscape) and (max-height:500px){.band-media{height:min(440px,86svh)}}`.
- **Spacing.** Gap between bands 20px; `.bands{padding-bottom:var(--sp-72)}`.
- **Iyuana photo.** `@container media (width < 524px){ .band-media--pp .band-photo{display:none} .band-media--pp .band-poster{margin-inline:auto} }`, using the `<picture>` source media from A16 so the hidden photo never downloads.
- **EACC grid** (when it exists): `align-items:stretch; grid-template-rows:repeat(3,minmax(0,1fr))`, 10px gap.

**Project page:**
- **Title block.** `container:tb/inline-size`, padding `var(--sp-64) 0 var(--sp-40)`. h1 `--fs-project-title`, line-height 1.08, balance. Subtitle `--fs-subtitle`, one fact per line under 560.
- **Lead row.**
  - `@container page (480px <= width < 736px){.lead{flex-wrap:nowrap}.lead-photo{min-height:0}}`: 293×366 plus 411 at 768.
  - `@container page (width < 480px){.lead{flex-direction:column}.lead-poster{flex:none;width:100%;max-width:none}.lead-photo{flex:none;width:100%;min-height:0;aspect-ratio:4/3}}`.
  - No photo: `.lead--solo .lead-poster{flex:0 1 482.4px;margin-inline:auto}`, on paper.
- **Facts and body.**
  - Stacked under 736, facts first.
  - `@container page (560px <= width < 736px){.facts{display:block;columns:2;column-gap:32px}.facts>div{break-inside:avoid;padding-bottom:18px}}`.
  - Body `--fs-body`, `text-wrap:pretty`. Padding `var(--sp-56) 0`.
- **Gallery.**
  - `.gallery{display:flex;flex-wrap:wrap;gap:16px;justify-content:center} .gallery>figure{flex:0 1 calc((100% - 32px)/3)}`, tiles 4:3.
  - `@container page (width < 932px){.gallery>figure{flex-basis:calc((100% - 16px)/2)}}`.
  - `@container page (width < 480px){.gallery{gap:12px}.gallery>figure{flex-basis:100%}}`.
  - Tiles are the same size at every count, and an incomplete last row is centred.
- **Pull quote.** `--fs-quote`, balance, padding-top `var(--sp-64)`, attribution 17px.
- **Credit.** `container:credit/inline-size`, one segment per line under 600, padding-bottom `var(--sp-56)`.
- **More programs.**
  - Padding `var(--sp-40) 0 var(--sp-56)`.
  - `@container page (width < 812px){.more-cards{flex-direction:column;gap:12px}.more-card{flex:none}}`.

**About:**
- **Statement.**
  - Padding `var(--sp-64) 0 var(--sp-48)`.
  - `@container page (700px <= width < 796px){.statement{flex-wrap:nowrap}}`: 287×299 portrait beside 377px of text at 768.
  - `@container page (width < 700px){.statement{row-gap:32px}.portrait{max-width:440px}}`: portrait first, left-aligned.
- **Lower band.**
  - Padding `var(--sp-40) 0`.
  - `@container page (700px <= width < 776px){.lower{flex-wrap:nowrap}}`, stacked below that.
  - Text at `--fs-lower`.
  - `@container page (width < 560px){.btn{flex:1 1 0;text-align:center}}`.

**Footer:**
- ≥640: the mock (space-between).
- <640: `.site-footer{flex-direction:column;align-items:center;text-align:center;gap:6px}`.
  - Line 1: "© 2026 Vanessa Espín · New York".
  - Then email and Instagram, each `display:inline-block;padding:12px 4px`, with no dot and no `.hit::after`.

**Spot checks.**
- At 768: tablet header; alternating bands side by side, with Iyuana poster-only and info one fact per line; lead pair 293/411; facts in two columns; gallery 2-up; More as a list; About side by side.
- At 375: 157px header; square plates; two-line 36px title; full-width poster; portrait first.
- At 1440: equal to 1280.

## 4. Unmocked pages and showcase/review modes

### 4.1 Modes (existing `TODO_MODE`, no new variables)

| Mode | Script | Where | Notes |
|---|---|---|---|
| `show` (review) | `dev`, `build:review` | Netlify `review` branch | Brackets, placeholder fills, Open items list, `<title>[Review] …</title>`, drafts (Enchante) visible |
| `hide` (showcase) | `dev:showcase`, `build:showcase` | Netlify production context until launch, plus previews | Reads as finished. Vanessa sees this first |
| `fail` (production) | `build` | At launch (§12) | Refuses to build while any `{{TODO`, stand-in, glyph or lint error remains |

- **When not indexable** (`__INDEXABLE__` false):
  - `<meta name="robots" content="noindex, nofollow">` on every page.
  - `todoGuard` writes `dist/_headers` with `/*  X-Robots-Tag: noindex` on `astro:build:done`.
  - The sitemap integration is skipped.
  - `robots.txt` stays permissive, so crawlers can see the noindex. No `Disallow: /`.
- **Build log.** The `hide` build logs hidden items per page, e.g. `iyuana: hidden photo, 6 gallery tiles, quote, 2 credit segments, 1 venue, partners`.

### 4.2 TODO markers: two kinds
Replaces the `DANGLING` heuristic in `src/lib/todo.ts`, keeping the `joinLine` / `shown` / `clean` API.
- **One marker:** `/\{\{TODO(?::\s*([^}]*))?\}\}/g`. The production guard is unchanged.
- **CHECK** (note starts with `/^(confirm|check|verify)\b/i` and directly follows text): `hide` removes only the space and the marker, so the text shows.
- **GAP** (anything else, including a bare `{{TODO}}` or a CHECK with no text before it): it must be a whole unit (field, list item, paragraph or sentence), and `hide` removes the unit.
  - A GAP mid-sentence is an error in `hide` and a warning in `show`: "Gap marker inside a sentence (iyuana.md:14). Make it its own sentence or list item."
  - Markdown handling happens at paragraph level in `integrations/todo-text.mjs` / `todoNotes`.
- **`null` vs TODO.** `null` means decided absent and never renders. A TODO is still open.
- **Copy deck fix** (Appendix A first, then `iyuana.md`), paragraph 2: "I produced it: the two venues {{TODO: confirm second venue}}, the identity and campaign, the installation, and the week itself, introducing each artist's work to visitors. {{TODO: How the artists and the show came together, in a sentence or two of your own}}"
- **Masthead link.** In `site.yaml`, `brandLink` keeps the approved "Brand and ecommerce work, 2020–2025", with `{{TODO: confirm 2020 start: keep only if the Enchante page ships}}` appended as a CHECK. The showcase shows the approved copy, and production can't ship it mismatched. Years are not computed.

### 4.3 Field rules (`hide`)
- **Facts.** GAP items are dropped. An empty block drops its 13px label. Iyuana's Where becomes "5-11 47th Ave, Long Island City", and Partners disappears.
- **Credit.** Segments containing a GAP are dropped and CHECK notes are stripped. If nothing remains, the `<p>` is omitted. Iyuana prints "Identity, poster & campaign: Vanessa Espín".
- **About artists and partners.** Two arrays joined with `, `, and the groups joined with `; `. An empty group leaves no semicolon.
- **Socials.** If Instagram or LinkedIn is a GAP or null, it disappears from header, footer, About and Contact together. The header's right column stays right-aligned.
- **Omitted sections.** A quote that is a GAP or null omits the section. An embed that is a GAP or null omits the reel tile.
- **Fallbacks.**
  - An alt that is a GAP becomes `alt=""`.
  - A meta description that is a GAP falls back to the subtitle string.
  - The OG image falls back from poster to the site card.
- **Schema.** It rejects a GAP in `title`. Image fields keep the existing `pending()` preprocess.

### 4.4 Empty image slots

| Slot | `show` (review) | `hide` / production |
|---|---|---|
| Iyuana band photo | `#3A302B` plate, 15px italic `#D9CFC8` bracketed caption, padding 16 | Poster-only, centred on `#14100E` |
| Program-page photo | `#3A302B`, 18px italic `#E2D9D2`, padding 22, bottom-left | `.lead--solo`: poster centred on paper, 482.4×603. Row height and facts y unchanged. Logged in §17 |
| Program page with no poster and no photo (EACC, Flywheel) | Same text-led layout. Missing images are listed in Open items | Row omitted. `.facts-body--text-led{border-top:1px solid var(--rule)}` |
| Gallery | Mock fills: `#D6CBC2` / `#CBBEB4` alternating, 16px italic `#3E3530`, padding 14 | Real tiles only. None means the section is omitted |
| EACC grid | Mock fills, with the centre cell `#BFB1A6` captioned | By count of real images, see the EACC row below |
| Card thumb | `#D6CBC2` 72×90 | Poster, then first grid image, then none. With none, a text-only `.card--text{min-height:114px}` |
| Quote / embed | Placeholder if TODO. Nothing if null | Omitted |

The EACC grid ladder in `hide` / production:

| Real images | Renders as |
|---|---|
| 0 | Text band |
| 1 | Poster-only |
| 2–8 | First two side by side, contained, 10px gap |
| 9+ | The approved 3×3, each image contained (not cropped) in its cell |

The 3×3 cells are landscape (215.7×128). That is a charter question to raise with Vanessa before grid images are exported; don't change it in code.

Review text notes are `<span class="todo">[note]</span>` with no styling of their own. They inherit: roman in prose and facts, italic oxblood in the quote. No chips, no highlights. Notes are written to her in the second person.

**Open items list (`show` only).**
- A `<section class="open-items">` above the footer: top rule, padding `40px 0 48px`, gap `32px 56px`.
- Left column (`flex:1 1 260px`):
  - "Open items" as the 13px oxblood label
  - "Review copy. Not shown on the live site." in 15px italic muted
- Right column (`flex:2.4 1 420px`): an `<ol>` at 17px/1.45. Each item is the note plus a muted "· field", using plain words (photo, artists, where, credit, poster description).
- It lists every marker in the page's content file, in file order, including YAML comments, alt text and meta fields. `site.yaml` items are listed on Contact.

### 4.5 Pages
- **EACC home band, zero images.** `<a class="band band--text">` containing only `.band__info`, with `.band--text .band__info{flex:1 1 100%;min-height:260px}`. Cream, padding 32, gap 8, 26/17/15 lines. The alternation index is kept. Never the panel colour alone, another program's poster, or typographic art.
- **Brand Work index** (`src/pages/brand-work/index.astro`).
  - Home `.masthead` (padding `var(--sp-60) 0 var(--sp-52)`). The h1 is the `brandLink` string, at 30px/1.35, 400, ink, balance.
  - Then `.bands` with one Flywheel text band: "Flywheel" / "Art Direction Design Specialist · Amazon & Walmart brand stores, paid ads, 20+ brands" / "2021–2025".
  - Enchante (`draft: true`) appears only in `show`.
  - No reciprocal "Exhibitions and events" link, no redirect, and no Flywheel panel colour until §8.1 names one.
- **Role pages.** Add `kind: z.enum(['program','role']).default('program')`, and extend `facts` items to `{label, items} | {label, programs: [slug]}`.
  - Title block: the project template.
  - Subtitle via MetaLine as role · place · dates. The Role block is omitted from facts.
  - In-text links follow A7.
  - **EACC** (`/programs/ecuadorian-american-cultural-center`):
    - Subtitle "Creative & Community Coordinator · New York · 2025–2026", keeping the end-date confirm note.
    - Facts: "Programs" (Ayazamana, Jul 2026, linked) and "Where" (New York).
    - Body: the Appendix A draft from the résumé, CHECK-marked.
    - Ends on More programs (the other three). Nav marks Programs as current.
  - **Flywheel** (`/brand-work/flywheel`):
    - Subtitle "Art Direction Design Specialist · 2021–2025".
    - Facts: "Work" (Amazon and Walmart storefronts and ads) and "Brands" (20+ in health, beauty and consumer goods).
    - Body: the approved About Flywheel sentence.
    - Ends on a "Programs" section with all four cards, newest first. Nav marks Brand Work as current.
- **Contact** (`contact.astro`; Contact is `aria-current`).
  - Title block: padding `var(--sp-64) 0 var(--sp-40)`, gap 12. h1 "Contact". Subtitle MetaLine `[city, languages]` (languages is a CHECK).
  - `.contact-band{background:var(--cream);min-height:260px;padding:32px;margin-bottom:var(--sp-72);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center}`. At ≤480px the padding becomes `32px 16px`.
  - Inside, in order:
    1. An optional `openTo` `<p>` (20px/1.55, max-width 560). It is null today.
    2. `<a href="mailto:vanessa.s.espin@gmail.com">` showing the address at `clamp(22px,6.2vw,30px)`, line-height 1.35, ink, with the A7 hover.
    3. `.btns{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}` holding:
       - `.btn.btn--solid.on-dark` "Email"
       - `.btn` "Résumé (PDF)" → `/Vanessa_Espin_Resume.pdf`
       - `.btn` "LinkedIn"
       - `.btn` "Instagram", only once a handle exists
  - Global ring. No form.
- **404** (`404.astro`).
  - h1 "Page not found" in the project-title style. Subtitle "There is no page at this address."
  - Then the More-programs component labelled "Programs", with all four cards newest first (EACC as a text card).
  - `<title>Page not found · Vanessa Espín</title>`, `noindex`, no nav item current.

## 5. Share and brand assets

**OG cards.** Rework the existing `src/pages/og/[name].jpg.ts`; do not add a second route.
- **Program card.** `sharp({create:{width:1200,height:630,channels:3,background:panelColor}})` with the poster `resize({height:550, kernel:'lanczos3'})` at its own ratio (no cover crop), centred, top 40.
- **Site card (`site`).**
  - Three panels of 387/386/387px separated by 20px white gutters, for the three newest programs with posters.
  - Posters at a common height of 400px, centred.
  - Used by home, EACC, Brand Work, Flywheel, Contact and 404.
- **About card (`about`).** The portrait, cropped across its full width to a 1.905:1 window centred at 41% of its height, then resized to 1200×630.
- **Encoding.** `jpeg({quality:86, mozjpeg:true, chromaSubsampling:'4:4:4'})`.
- **Text.** None in the images.
- **Hairline.** None, unless the hairline question is approved, in which case 2px.
- **Filenames.** `/og/{name}.{hash8}.jpg`, where hash = sha256(source bytes + panelColor + `OG_LAYOUT=1`). Put the param in `getStaticPaths` and compute the same name in a shared helper for head tags. Keep the sitemap filter.
- **Absolute URLs.** `new URL(path, Astro.site)`. In `astro.config.mjs`: `site: process.env.SITE_URL || (process.env.CONTEXT && process.env.CONTEXT !== 'production' ? process.env.DEPLOY_PRIME_URL : undefined) || 'https://vanessaespin.com'`.
- **Head tags.**
  - `og:image`, `og:image:width` 1200, `og:image:height` 630, `og:image:type` image/jpeg.
  - `og:image:alt`: "{title} poster" for programs, "Posters for Iyuana, Ayazamana and Herencia Viva" for home, "Vanessa Espín at Brooklyn Bridge Park" for About.
  - `twitter:card` summary_large_image.
- **Crop safety.** The poster stays at most 440px wide, inside the 630px centre square and X's 1200×600 crop.
- **After launch,** re-scrape with LinkedIn Post Inspector.

**Alt text.**
- Band and thumb images: `alt=""`.
- Program-page poster: `posterAlt`, defaulting to "{type} poster".
- Portrait: "Vanessa Espín at Brooklyn Bridge Park".
- Gallery: its own alt, otherwise the caption.

**Favicons.** `scripts/make-icons.mjs` is a one-off; its outputs are committed to `/public`.
- **Glyph source.** Outlines come from the committed `eb-garamond-v33-latin-wght.woff2`, using a fontkit-compatible `getVariation({wght:600})` (500 for the touch icon). If that isn't supported, make a static instance with fontTools `varLib.instancer` in a pinned venv.
- **Placement.** E sits at `V.advanceWidth + kern`. The ink is centred horizontally and the cap height (650/1000 em) vertically. Fill `#470000`.
- **Files.**
  - `favicon.svg`: viewBox 512, `<rect rx="96" fill="#F5EFE8">`, weight 600, cap 48%, kern −60/1000 em.
  - `favicon.ico`: PNG-in-ICO with 16×16 (600, cap 50%, kern −50) and 32×32 (600, cap 48%, kern −60).
  - `apple-touch-icon.png`: 180×180 full-bleed cream, weight 500, cap 42%, kern −80.
- **Head tags.** `<link rel="icon" href="/favicon.ico" sizes="32x32">`, `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`. No manifest.
- Mark it as a draft Vanessa may redraw.

**theme-color.** `<meta name="theme-color" content="#FFFFFF">` plus `<meta name="color-scheme" content="light">`, with no media variants.

## 6. Rejected

**Duplicates and superseded proposals**
- **motion-selection-color:** duplicate. The single `::selection` is cream on oxblood.
- **img-poster-morph:** duplicate of motion-poster-morph, which has the better gating and tested Back behaviour.
- **motion-poster-viewer:** duplicate of img-poster-lightbox. Its timings are folded into A25.
- **gaps-gallery-counts:** its 588px tiles are a third tile size the mock never shows. The rule is same-size tiles with the last row centred.
- **phone-gallery-grid odd-tile span and `:has()` 2-column desktop rules:** they create tile sizes the mock never drew.
- **gaps-project-image-row poster-on-panel variant:** it uses `object-fit: cover` and is a new composition. Only its text-led rule is kept.
- **The image lens's phone sizing:** the 600px photo threshold, 784/844 wraps and 3:2 photo are superseded by the phone-lens container thresholds.

**Breaks parity with the approved mocks**
- **img-edge-hairline:** a visible addition to the approved flat mocks. It can be reopened by the user (see section 7).
- **img-poster-hero (poster on a full-width panel-colour band):** a new composition on the project page. The default is the poster on paper at the mock's size (see section 7).
- **Line-break changes at ≥1240** (EACC "sponsors" fix, name bonding on About): they change approved mock breaks. They apply below 1240 only (see section 7).

**Changes approved copy or design without sign-off**
- **Computing the masthead and Brand Work years in code:** it changes approved copy. A CHECK note gates it instead.
- **Reciprocal "Exhibitions and events" link:** new UI copy, and the page reads more restrained without it.
- **EACC 4×2 and 2×2 grids:** they change the approved 3×3. This goes to a charter question before grid images exist.
- **Flywheel panel `#E9E1DA`:** no colour until the charter names one.
- **Images never move on hover:** overridden by the 2% and 4% lifts inside links only.

**Costs more than it gives**
- **Shared hero-size srcset on band posters (morph-readiness part 1):** it oversizes the home LCP image. The fade layer and prerender cover it.
- **5-stop gradient placeholders:** complexity not needed in v1. The solid `--ph` tint covers it.
- **`RENDER_MODE` / `ALLOW_TODO` variables:** they duplicate the existing `TODO_MODE`.
- **`robots.txt Disallow` on previews:** it hides the noindex from crawlers.

**Typography choices declined**
- **latin-ext subset:** every Spanish character is in latin, and it would preload 114 KB.
- **Old-style figures and book features:** not in the approved design, and old-style "11" reads as "ıı".
- **Font smoothing on `body`, `optimizeLegibility`, `font-feature-settings`, a global line-height reset:** they thin the hairlines, override features or change mock heights.

**Rejected by the charter or the motion allowlist**
- **`<ClientRouter />`, `transition:*`, named header or logo transitions:** JavaScript, or a flickering header.
- **Load, entrance and scroll-driven animation, sticky header, smooth scroll:** charter §4 non-goal.
- **Contact form:** mailto only for v1.

## 7. Open questions for the user

1. **Line breaks at desktop width.** Allow two refinements at 1280 that the mocks don't have?
   - The EACC line ending "…Programs, content, sponsors" without the lone "sponsors" ((working file, not kept)).
   - Names like "Flushing Town Hall" never split on About ((working file, not kept)).

   **Default: no** (exact mock parity). Phones get both either way.
2. **Poster edge hairline.** Add a 12%-alpha 1px edge so the Iyuana poster doesn't dissolve into its near-black panel? Comparison: (working file, not kept). **Default: no** (flat, as mocked).
3. **Program page without an event photo.** Show the poster on white at the mock's size, or on a full-width band of its program colour ((working file, not kept))? **Default: on white.**
4. **Action, not a decision.** Before Vanessa sees the showcase, can you collect 1080×1350 versions of the three posters from her or the venues' public posts, Ayazamana first? Nothing else lifts the "million dollars" look as much.