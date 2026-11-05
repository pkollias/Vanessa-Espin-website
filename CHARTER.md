# Project Charter: vanessaespin.com (custom build)

Version 2.1 · Nov 3, 2026 · Status: v1 built; the showcase is ready while photos and facts come in
Builder: you · Subject: Vanessa Espín

**What changed from v1:** v1 treated the visual design as open and invented defaults. The design is not open. It was made and approved on Oct 29 as the Design canvas "Vanessa Espín — Website Redesign". This version builds on that canvas, replaces the generic design section with its real spec (section 8), and fixes the goals, content model and decisions that conflicted with it. The poster facts in section 7 were also checked against the poster images.

## Sources of truth, in order

1. **Visual design and page layout:** the four canvas boards (Site map, Home, Project page, About). Live: https://claude.ai/code/artifact/5e0c9dd9-cbb4-4c0f-8a1f-dfbc23fba104. Static copies that open in a browser are in `design-reference/` (bundled with this charter).
2. **Copy and writing rules:** `website-redesign-plan.md`, Rev 2 (Oct 29).
3. **Facts:** section 7 of this charter.

If the canvas and the plan disagree, the plan's Rev 2 wins for content and the canvas wins for layout. The one known conflict: the canvas Site map board (Rev 1) still keeps The Dinner Table Doc and 100 Roses of Concrete; Rev 2 cut them by default. Rev 2 wins.

---

## 1. Purpose

Replace the current Adobe Portfolio site, which stops in 2021, with a small hand-coded site that presents Vanessa as a New York producer and designer of exhibitions and events, with four years of agency art direction behind her.

Primary job: be the link on her résumé and LinkedIn that a hiring manager (Ace Hotel NY, Community & Marketing Manager, and similar roles) opens after reading one page.
Secondary job: be the page that artists, venues and partners find when they look her up.

## 2. Background

- The résumé shipped without a website line because vanessaespin.com only shows 2018–2021 work. Rule: the URL goes back on the résumé only once the site shows the three 2026 exhibitions.
- The current site introduces a different person (a 2020-era eCommerce designer) from the one on the résumé and posters. Flywheel (2021–25, her longest job) and all 2025–26 cultural work are missing.
- Defects to leave behind: "Hola" under every page title, default gray theme, blue default LinkedIn button, empty social icons, no email anywhere, logo linking to the Experience gallery, name without the accent, spec/student work using big brands' logos (ZARA, Purell, Pure Leaf), a stock photo plus Google Drive link (Outside the Pink Box), an Enchante page with empty sections.
- The design was made as restyled Adobe Portfolio (Andreas theme) mocks. Portfolio's platform limits (no custom code, cropped landscape covers, Embed-only iframes) **no longer apply**. The look, structure and copy carry over.

## 3. Goals and success criteria

1. A visitor can say what she does after one sentence (the masthead line), and the first program cover (Iyuana) starts within the first desktop screen. The other covers follow on scroll.
2. Every claim on the site matches the résumé and LinkedIn. No number, tool, title or date appears that isn't in the fact base (section 7).
3. The build matches the approved mocks at 1280 px, and holds up on phones, keyboard and screen readers.
4. Adding a new program is copying one Markdown file and dropping in images. No code change.
5. Shareable link previews (title, description, poster image) look right in LinkedIn, iMessage and Slack.

## 4. Non-goals (v1)

No CMS or admin UI, blog, shop, services or pricing list, client login, animation beyond subtle transitions, bilingual pages (parked, see section 16), or analytics. Revisit after launch.

## 5. Audience

- Hiring managers and recruiters: skim, want proof of range and recent work.
- Venues, partners, sponsors: want to see what she has actually produced.
- Artists she might work with: want to see how their work gets presented.
- Press or programmers: want a short third-person bio.

## 6. Scope: v1 sitemap

Header nav on every page: **Programs · Brand Work · About · Contact**. Social links on the right of the header: Instagram, LinkedIn, Email.

| Route | Page | Contents | Mocked? |
|---|---|---|---|
| `/` | Programs (landing) | Masthead line, link to Brand Work, four cover bands: Iyuana (Aug 2026), Ayazamana (Jul 2026), Herencia Viva (May 2026), Ecuadorian American Cultural Center (2025–26) | Yes (`home.html`) |
| `/programs/iyuana` | Program page | Project template (section 8.4) | Yes (`project-page-iyuana.html`) |
| `/programs/ayazamana` | Program page | Same template | Template only |
| `/programs/herencia-viva` | Program page | Same template | Template only |
| `/programs/ecuadorian-american-cultural-center` | Program page | Role page for the 2025–26 coordinator work; text-led if there are few images | Cover only |
| `/brand-work` | Brand Work index | Flywheel (2021–25, new) and Enchante Accessories (2020–21, only if filled), as cover bands | **No** |
| `/brand-work/flywheel` | Project page | Same template; only screenshots she's allowed to show | **No** |
| `/about` | About | Portrait, About copy, Artists and partners (real names only), Contact column. No services list | Yes (`about.html`) |
| `/contact` | Contact | Email (required), optional short "open to" line, optional form | **No** (reuse the About contact column) |
| `404` | Not found | Plain, links home | No |

**Off the site:** ZARA, Purell, Pure Leaf, Editorial Design, Outside the Pink Box, The Dinner Table Doc (2019) and 100 Roses of Concrete (2021) (unless she has strong images and wants them). Thin 2019–21 pages dilute the 2026 work.

## 7. Fact base: what the site is allowed to say

Anything not marked **Confirmed** must be resolved with Vanessa before it ships. "Poster" means checked against the poster image in the canvas.

| Item | Fact | Status |
|---|---|---|
| Name | Vanessa Espín (with accent everywhere) | Confirmed |
| Iyuana: El Retorno de los Sueños | Film & photography exhibition about the Sápara Nation of the Ecuadorian Amazon; **August 18–24, 2026**; 5-11 47th Ave, Long Island City, Queens, NY 11101; four artists from Ecuador, Peru, Mexico; she produced it and is credited as creative director | Confirmed (poster). **Second venue unconfirmed** |
| Iyuana artists | Yanda Montahuano (filmmaker & photographer, Ecuador); Li Can Vega (CGI visual artist, Peru); Armando Vega (photographer, Mexico); Israel Vargas "Panchis" (photographer, Ecuador) | Matches the poster as readable at web size. **Verify Li Can Vega against the original file** |
| Herencia Viva: Threads of Memory | Painter Luis Medina's exhibition of Ecuadorian magic realism; **May 29–31, 2026**, 12–5 pm; Flushing Town Hall, 137-35 Northern Blvd, Flushing; she curated; poster credits her as Creative Director, Brand & Experience; Ayllu Gallery's logo is on the poster | Confirmed (poster). **"Three venues" is from the résumé notes, but the poster shows one address: confirm which venues. What Ayllu Gallery is to her: unconfirmed**; see Confirmed Nov 4, 2026 below |
| Ayazamana | Live music and traditional dance with the Ecuadorian American Cultural Center; **Sat July 11, 2026, 8 PM** | Confirmed (poster). **Her exact role (staff vs freelance, program vs campaign): unconfirmed** |
| EACC role | Creative & Community Coordinator, 2025–2026 | **Date conflict:** LinkedIn ends it Apr 2026, but Ayazamana is Jul 2026; see Confirmed Nov 4, 2026 below |
| Independent work | Creative Director, Brand & Experience (matches LinkedIn and the Herencia Viva poster credit) | **Start date conflict:** Apr 2026 on LinkedIn vs 2025 on her draft |
| Flywheel | Art Direction Design Specialist, 2021–2025; Amazon and Walmart storefronts and ads; 20+ brands in health, beauty and consumer goods | Confirmed |
| Enchante Accessories | Brand Designer, eCommerce, 2020–21 | Role confirmed. **"15+ brands" and "Cook with Color refresh" are NOT confirmed.** The résumé notes rejected the 15+ claim as unverified, so leave both out until she confirms |
| Education | Communication Design, City Tech, CUNY | Confirmed |
| Email | vanessa.s.espin@gmail.com (used in the mocks) | Appears in the mocks; confirm it is the one she wants public |
| Instagram | Not known | **Needed** |
| LinkedIn URL | https://www.linkedin.com/in/vanessaespin (from the résumé header) | **Confirm** |
| Languages | "English and Spanish" appears in the About mock with "[confirm]" | **Unconfirmed** |
| Numbers | Attendance, RSVPs, sponsors or funds raised, social reach, press | **None exist yet.** Do not estimate |

**Confirmed Nov 4, 2026 (Pavlos)**, with her LinkedIn as the source for her own roles:
- **Posters:** Vanessa designed all the posters. "Poster: Vanessa Espín" is credited on Iyuana, Herencia Viva and Ayazamana.
- **Iyuana** is the "Sapara Nation - Art Exhibition" on her LinkedIn (Creative Director, Brand & Experience, Jun 2026 to present). How she describes her relationship to the Sápara Nation is still to come from her.
- **Herencia Viva: Threads of Memory** is painter Luis Medina's exhibition, listed on her LinkedIn as the "Ayllu Gallery - Luis Medina Exhibition Project" (Creative Director, Brand & Experience, Apr to Jun 2026); the poster carries Ayllu Gallery's logo. Credited "With: Ayllu Gallery".
- **EACC role:** Sep 2025 – Apr 2026 per LinkedIn; Ayazamana (Jul 2026) is not listed as her EACC program.
- **Ayazamana:** the performers are the **Ayazamana Dance Group**, the Ecuadorian American Cultural Center's traditional dance group, founded in 1992 by José Rivera, performing dances from La Costa, La Sierra and El Oriente (sources: Dance/NYC, https://www.dance.nyc/equity/immigrant-artists/worksartists/view/Ayazamana-Dance-Group/, and ecuadorcenter.org). Her confirmed part is the poster; her role on the night is still to come from her. The site must not imply she created, named or planned Ayazamana.

## 8. Design spec (from the approved canvas)

The mocks were drawn at 1280 px wide with inline styles. They say fonts and spacing are "indicative", so treat the values below as the intended design and refine rather than guess. Reference copies are in `design-reference/`.

### 8.1 Tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#FFFFFF` | Page background |
| `--ink` | `#1F1A19` | Body text, default link color |
| `--oxblood` | `#470000` | Logo, active nav, project titles, labels, pull quote, outline buttons, text links, link hover |
| `--cream` | `#F5EFE8` | Cover info panels, "More programs" cards |
| `--text-2` | `#4A403C` | Secondary lines (type · role, project subtitle) |
| `--muted` | `#6B605B` | Social links, footer, meta lines, attribution, credit line |
| `--rule` | `#E6DED7` | Header, footer and section borders |
| Placeholder fills | `#D6CBC2`, `#CBBEB4`; dark `#3A302B` with text `#E2D9D2` | Dev-only image placeholders. Never ship |

**Per-program cover panel colors** (chosen to sit behind each poster): Iyuana `#14100E`, Ayazamana `#2B1424`, Herencia Viva `#C98C98`, EACC `#E9E1DA`. Store as `panelColor` in each program's frontmatter.

**Type:** one family, **EB Garamond** (weights 400, 500, 600, plus 400 italic), with fallback Garamond, Georgia, serif. This is the same family and the same oxblood as the résumé. There is no sans-serif in the design; v1's suggestion of a second sans was wrong.

| Role | Size / line-height | Weight, style, color |
|---|---|---|
| Logo "Vanessa Espín" | 30px, letter-spacing 0.2px | 500, oxblood |
| Nav links | 18px | 400, ink; active: 600, oxblood |
| Header social links | 16px | muted |
| Home masthead (h1) | 30px / 1.35, max 820px, `text-wrap: balance` | 400, ink |
| Masthead link | 18px | oxblood, 1px bottom border, 2px padding |
| Cover title | 26px / 1.2 | 500 |
| Cover type · role | 17px | `--text-2` |
| Cover place · date | 15px | italic, muted |
| Project title (h1) | 50px / 1.08, `text-wrap: balance` | 500, oxblood |
| Project subtitle | 20px | `--text-2` |
| Facts labels (Role, Artists, Where, Partners) | 13px, uppercase, letter-spacing 1.2px | 600, oxblood |
| Facts text | 17px / 1.45 | ink |
| Project body | 20px / 1.55 | ink |
| About h1 (the statement) | 30px / 1.35, `text-wrap: pretty` | 400, ink |
| About body | 20px / 1.58 | ink |
| Artists and partners, Contact text | 19px / 1.6 | ink |
| Pull quote | 30px / 1.3, max 760px | italic, oxblood; attribution 17px muted |
| Credit line | 16px | muted |
| Footer | 16px | muted |
| Outline button | 17px, padding 10px 19px, 1px oxblood border | oxblood text |

Links: no underline at rest, ink by default; on hover, oxblood with a 1px hairline. Links inside running text are oxblood and underlined. Use the actual rendered values from `design-reference/` when in doubt.

Type details (added Nov 3): proportional lining figures, one `::selection` (cream on oxblood), and a 2px oxblood focus ring on everything. Titles of works are italic in running prose and roman in display.

### 8.2 Layout system

- Container: `max-width: 1240px`, 24px side padding, centered.
- Everything is flex-wrap, not breakpoints: columns have a flex-basis and drop below each other when they don't fit. Reproduce that behavior (CSS grid or flex with the same bases). The mocks do not show a phone layout, so section 8.6 lists what to decide.
- Gaps: 20px between cover bands, 16px in image grids, 32px / 56px in two-column text blocks.
- Rules: 1px `--rule` borders under the header and above the footer and secondary sections.

### 8.3 Home (Programs)

1. **Header:** three flex columns, each `flex: 1 1 280px`. Left: nav (gap 22px). Center: logo, centered. Right: Instagram, LinkedIn, Email (gap 18px, right-aligned). Padding 34px 0 26px, bottom border.
2. **Masthead:** padding 60px 0 52px, centered. h1 "I produce and design exhibitions and events in New York." Below it one text link: "Brand and ecommerce work, 2020–2025" (to `/brand-work`).
3. **Cover bands**, newest first, 20px apart, bottom padding 72px. Each band is one link wrapping two blocks:
   - **Image panel** (`flex: 3 1 420px`, height 440px, padding 18px, per-program `panelColor`): holds the poster at 4:5, full panel height. Variants: *poster + photo* (Iyuana: poster beside an opening-night photo that fills the rest), *poster only* (Ayazamana, Herencia Viva: poster centered), *grid* (EACC: 3×3 grid of posters and posts, 10px gap).
   - **Info panel** (`flex: 2 1 300px`, min-height 260px, `--cream`, padding 32px): centered title, "type · role", "place · date".
   - Bands **alternate sides**: first normal, second `row-reverse`, third normal, fourth reversed. Drive this by index, not by content.
4. **Footer:** "© 2026 Vanessa Espín · New York" left; email and Instagram right. Padding 28px 0 40px.

### 8.4 Project page (Iyuana is the template)

1. Header (same).
2. **Title block:** padding 64px 0 40px, centered. h1 title; subtitle "type · place · dates", e.g. "Film & photography exhibition · Long Island City, Queens · August 18–24, 2026".
3. **Poster + photo row** (16px gap): poster `flex: 2 1 300px` at 4:5, beside the best photo with people in it (`flex: 3 1 420px`, min-height 360px).
4. **Facts + body** (padding 56px 0, gap 32px 56px): left column `flex: 1 1 260px` with labeled blocks Role, Artists (name, craft, country), Where, Partners. Right column `flex: 2.4 1 420px`: three short paragraphs: what it was, what she did, what came of it (facts only).
5. **Photo grid** (16px gap): tiles `flex: 1 1 300px`, 4:3. Six slots in the mock: installation view; a film screening; guests with the artists; Instagram carousel laid out flat; printed pieces (flyers, wall text, signage); a short video or reel (embed). Captions are small italic.
6. **Pull quote:** centered, one real line from an artist, partner or visitor, then "Name, role". Omit the section if there is no real quote.
7. **Credit line:** "Identity, poster & campaign: Vanessa Espín · Photography: [name] · With thanks to [partners]".
8. **More programs:** top border, label "More programs" (18px, 600), then cards (`flex: 1 1 260px`, `--cream`, padding 12px) each with a 72×90 poster thumb (4:5), title 18px and date 15px italic.
9. Footer.

### 8.5 About

1. Header with About active.
2. **Statement + portrait** (padding 64px 0 48px, gap 40px 56px): portrait `flex: 2 1 320px` at 24:25 (alt: "Vanessa Espín at Brooklyn Bridge Park"); text `flex: 3 1 420px`. The About's first sentence is the **h1** (30px); the rest are 20px paragraphs, 18px apart. Copy is in Appendix A.
3. **Lower band** (top border, padding 40px 0): "Artists and partners" label plus one running paragraph of names (`flex: 2 1 420px`), and a Contact column (`flex: 1 1 300px`): email, Instagram, "New York · English and Spanish" (unconfirmed), then two outline buttons: Résumé (PDF) and LinkedIn.
4. Footer.

### 8.6 Not in the mocks: resolved while coding (Nov 3)

The full reasoning is in `docs/design-enhancements.md`; the values live in `src/styles/tokens.css` and the components.

- **Phone and tablet.** Exact mock values from 1240px up; below that, sizes ease down with `clamp()`. Bands stack below 720px of content with a square image plate and the poster at its own ratio; narrow panels show one fact per line; the project lead row, facts and gallery reflow at fixed thresholds. The header stacks logo, nav and social links on phones, with the nav always on one row: no menu button, nothing hidden.
- **Unmocked pages.** Brand Work index: the masthead line plus cover bands. EACC and Flywheel: role pages on the project template (role in the subtitle, linked programs in the facts). Contact: a cream band with the email large and one filled oxblood Email button. 404: the program cards.
- **Hover and focus.** One language: a band or card title takes oxblood and a 1px hairline, its poster lifts 2% (4% for thumbs), one 2px oxblood focus ring. Page changes crossfade, and a poster carries from its band or card into its page (CSS view transitions; nothing moves with reduced motion).
- **Placeholders** show only in review builds. Showcase and launch builds never render them (see section 9).

## 9. Content model

All copy and facts live in `src/content/`, not in components. One Markdown file per program, with frontmatter that mirrors the mocks:

```yaml
---
slug: iyuana
title: "Iyuana: El Retorno de los Sueños"
titleLang: es
type: Film & photography exhibition
role: Producer & creative director
place: Long Island City, Queens
dateStart: 2026-08-18        # sort key; newest first on the home page
dateEnd: 2026-08-24
dateLabel: "August 18–24, 2026"   # project subtitle
dateShort: "Aug 2026"             # cover line
poster: ./iyuana-poster.jpg       # 4:5
cover:
  mode: poster+photo         # poster | poster+photo | grid
  panelColor: "#14100E"
  photo: "{{TODO: opening-night photo}}"
venues:
  - 5-11 47th Ave, Long Island City, NY 11101
  - "{{TODO: second venue}}"
artists:
  - { name: Yanda Montahuano, credit: "Filmmaker & photographer, Ecuador" }
partners: []
gallery:                      # up to six tiles, 4:3
  - { image: "{{TODO}}", caption: Installation view }
embed: null                   # reel or video URL, or null
quote: null                   # { text, name, role } or null
credit: "Identity, poster & campaign: Vanessa Espín · Photography: {{TODO}} · With thanks to {{TODO}}"
---
Body paragraphs: what it was, what she did, what came of it.
```

**Placeholder guard:** unresolved items are written `{{TODO: ...}}`. The production build must fail if any `{{TODO` remains in content, so nothing unverified ships by accident.

Two kinds of note (added Nov 3): a note starting "confirm", "check" or "verify" right after some text confirms that draft text, which stands; any other note marks missing content and must be a whole unit (a field, list item, credit segment, sentence or paragraph). Three builds use them: **review** (`npm run dev`, `build:review`) shows every note in [brackets] and every missing photo as a placeholder; **showcase** (`build:showcase`, the previews) drops confirm notes and removes missing units whole, so it reads as finished; **launch** (`npm run build`) refuses to run while any note or web-size stand-in image remains.

Refinements to the model: `kind: program | role`; artists as `{ name, craft, country, note }`; `cover.line` and `cover.place` when the cover line differs from the page; `facts` for extra labeled lines or linked programs; `posterAlt`, `description` and `draft`.

## 10. Content and writing rules (apply to every word on the site)

- Say the job in plain words in the first sentence. Verbs over titles.
- Names, places, numbers and things made do the persuading. Cut adjectives that praise.
- Be precise about role: "I produced / I curated / I planned" beats one big title.
- State identity as a fact, once. Don't decorate with it. No greetings or flourishes doing identity work.
- End flat, on a fact. No rhetorical questions, no lesson-learned line.
- About stays under about 150 words. Project pages carry the detail.
- Avoid: "where X meets Y", "bring to life", "deserve", "passionate", "meaningful", "journey", lists of three abstract nouns, "It taught me…", "Hola".
- Say "artists from Ecuador and across Latin America." No source says any of the artists are Indigenous. The Sápara subject belongs on the Iyuana page only.
- Don't write that Iyuana "brought the Sápara Nation to New York."

## 11. Technical approach

Recommended; swap freely, nothing above depends on it.

- **Framework:** Astro, static output, content collections for programs and brand work, `astro:assets` for responsive images (AVIF/WebP, width and height set to prevent layout shift).
- **Styling:** plain CSS with custom properties for the section 8.1 tokens. No UI framework.
- **Fonts:** EB Garamond, self-hosted: the Google Fonts v33 Latin files the mocks load (one variable upright file for 400–600, plus 400 italic, about 70 KB together), committed with `OFL.txt` in `src/assets/fonts/`. Latin only: every Spanish character is in it.
- **JavaScript:** none by default. Add only for things like a lightbox, and make it optional. One deliberate exception (Nov 3): a JSON `<script type="speculationrules">` that prerenders a page when its link is hovered. No code runs.
- **Hosting:** Netlify, plus a GitHub Pages copy at the user's request. Until launch both serve the showcase build with `noindex`; branch deploys on Netlify do the same, and a branch named `review` shows the review build.
- **Contact:** a visible `mailto:` link is required. A form is optional (Netlify Forms or Formspree). Never expose an address as an image.
- **SEO and sharing:** unique `<title>` and meta description per page, Open Graph image from each program's poster, favicon (monogram "VE" or similar, oxblood on cream), `sitemap.xml`, `robots.txt`.
- **Accessibility:** semantic landmarks, one `h1` per page, alt text per image, visible focus states, AA contrast, `lang="es"` on Spanish titles, tested keyboard-only.
- **Performance budget:** no page over about 1 MB of initial transfer apart from images below the fold; Lighthouse 95+ on performance, accessibility and SEO.
- **Résumé link:** host the résumé PDF as a static file at `/Vanessa_Espin_Resume.pdf` and link it from About and Contact.

**Suggested repo layout**
```
/design-reference/            approved mocks as static HTML + web-size images (reference only; don't ship)
/src/content/programs/        one .md per program (+ images)
/src/content/brand-work/
/src/content/site.yaml        masthead line, email, social links, bio text
/src/pages/                   index, about, contact, 404, dynamic routes
/src/components/  /src/styles/tokens.css
/public/                      favicon, résumé PDF, robots.txt
CHARTER.md
```

## 12. Domain and launch plan

1. Build and review on the host's preview URL. Leave vanessaespin.com untouched on Adobe Portfolio until content is ready.
2. Before cutover: note the current DNS records and Portfolio domain settings so they can be restored if needed.
3. Before adding the domain, change the Netlify build command in `netlify.toml` to `npm run build`. It refuses to run while any `{{TODO` note or web-size stand-in image remains, and it is the only build search engines may index.
4. Cut over: add the domain to the new host, update DNS, confirm HTTPS, then remove the domain from Portfolio.
5. Optional: add redirects from any old Portfolio URLs she's likely to have shared (for example the Experience gallery).
6. After launch: add the URL to the résumé header, LinkedIn (and align the LinkedIn About and headline, which still pitch design roles), and email signature.

## 13. Milestones

Dates to be set once Vanessa's availability for photos and answers is known. Ship v1 as soon as content allows; the résumé and application context favor a fast, smaller launch.

| # | Milestone | Exit criteria |
|---|---|---|
| M0 | Repo and setup | Framework installed, tokens file, EB Garamond loading, deploy-on-push to a preview URL |
| M1 | Shell | Header, footer, masthead, nav, 404, empty routes for every page in section 6; header matches `home.html` at 1280 px |
| M2 | Home and project template | Home with four alternating cover bands and the Iyuana page built from its content file, using the web-size images from `design-reference/` as stand-ins; side-by-side with the mocks at 1280 px |
| M3 | All pages with real copy | Other programs, EACC, Brand Work, Flywheel, About, Contact; placeholder guard passing |
| M4 | Quality pass | Phone layout decided and built (section 8.6), accessibility, Lighthouse, link and image checks, OG previews tested, `{{TODO` guard on in production build |
| M5 | Vanessa review | Every fact in section 7 confirmed or removed; she approves About and bio text |
| M6 | Launch | DNS cut over, résumé and LinkedIn updated |

## 14. Needs from Vanessa (blockers by milestone)

**Images (the canvas copies are web-size, 50–100 KB, and the Ayazamana image looks cropped: its title and year are cut off):**
- Original full-resolution files for the three posters and the portrait.
- Per program: the best photo with people in it; installation view; a screening or performance moment; guests with the artists; the Instagram carousel exported flat; printed pieces (flyers, wall text, signage); a reel or video if one exists; photographer's name.
- EACC: the posters and posts for the 3×3 grid. Flywheel: storefront screenshots she is allowed to show.

**Before M3:** email confirmation, Instagram handle, LinkedIn URL.
**Before M5:** Ayazamana timing vs her Apr 2026 EACC end date · her exact role on Ayazamana · Iyuana's second venue · which three venues Herencia Viva used · what Ayllu Gallery is · independent start date · how the cultural work started (volunteer at the Center while at Flywheel?) · Spanish level · whether to say she's open to roles · any press · one real quote per program (optional) · numbers, with how she knows them.
**Enchante:** whether to keep the page, and if so confirm or drop "15+ brands" and "Cook with Color."

## 15. Risks

| Risk | Response |
|---|---|
| Photos with people don't exist or arrive late | Use *poster only* panels and the shorter template; omit grid tiles and the quote rather than showing placeholders |
| Date and role conflicts reach the site | Fact base status column plus the `{{TODO` guard; confirm in M5 |
| Site overstates what the résumé says | Résumé wording wins; no numbers or tools without a source |
| Mocks have no phone layout | Decide in M4 (section 8.6) and compare against the mocks only at desktop width |
| Spanish titles or names break (encoding, accents) | UTF-8 everywhere, test with `Espín`, `Sueños`, `Sápara` in titles, URLs and OG tags |
| DNS cutover causes downtime | Preview first, record old DNS, cut over at a quiet hour |
| Scope creep (blog, shop, bilingual) | Non-goals list; log ideas for v2 |
| Thin Brand Work pages drag the site | Keep only Flywheel (and Enchante if filled) |

## 16. Decisions log

**Decided**
- **Design: the Oct 29 canvas is approved.** Cover bands alternating sides, cream info panels, EB Garamond throughout, oxblood on white, centered logo with nav left and socials right.
- Programs lead; Brand Work is secondary. The site reflects the résumé's positioning: cultural producer with a commercial foundation.
- Cut: ZARA, Purell, Pure Leaf, Editorial Design, Outside the Pink Box; Dinner Table Doc and 100 Roses by default (plan Rev 2 over the canvas Site map board).
- Real titles and employers, not umbrella titles: Creative & Community Coordinator (EACC), Art Direction Design Specialist (Flywheel).
- Plain, fact-led voice (Rev 2 of the copy). No greetings, no taglines, no "What I do."
- No services list on About.
- "Rooted in New York's Latin American arts community" stays out of the summary and belongs in the cover letter; on the site, state the Ecuador and Latin America focus as plain fact.
- Dropped from v1: the "wall label" default, the second sans-serif, and the 3:2 cover composites. The composites existed only to work around Portfolio's cover cropping.
- Framework and host (Nov 3): Astro 7, static, on Netlify, with a GitHub Pages copy. Contact is mailto only for v1.
- Phone layout, hover and focus, and the unmocked pages (Nov 3): resolved in section 8.6.
- A program page without an event photo shows its poster alone, on white, at the mock's size (Nov 3).

**Parked for later (from the plan, not built):** wall-label restraint, poster wall, listings, bilingual side-by-side, documentary photography-first. Revisit after v1 ships.

**Open**
- Whether to add analytics after launch.
- Two line-break refinements at desktop width the mocks don't have (the EACC cover line, names that split on About). Default: no, exact mock parity; phones get both.
- A 1px edge on posters that sit on very dark panels (Iyuana). Default: no, flat as mocked.
- The EACC 3×3 grid cells are landscape (about 216×128). Settle with Vanessa before grid images are exported.

## 17. Definition of done (v1)

- Every route in section 6 exists, with no `{{TODO`, no placeholder fills and no web-size stand-in images.
- Every fact traces to section 7 with status Confirmed.
- At 1280 px the header, home, project page and About match the mocks; any deliberate difference is logged here:
  - The logo's 0.2px letter-spacing is on every page (only `home.html` had it).
  - Proportional figures move some digits by up to 3px, with no rewrap.
  - The header is a grid with the logo first in the DOM; no pixel change.
  - Showcase variants: EACC as a text band; the Iyuana band poster-only until its photo exists; a program page without a photo shows the poster alone on white.
  - The Ayazamana stand-in is trimmed to 408×525 (its border removed), so it shows 314px wide instead of 323px. Stand-in only.
  - Pull-quote marks hang outside the measure, once a real quote ships.
- Passes keyboard-only navigation, AA contrast, Lighthouse targets in section 11.
- Looks right at 375 px, 768 px and 1440 px.
- Link previews verified for home and each program.
- Live on vanessaespin.com with HTTPS, and the résumé and LinkedIn point to it.

## 18. Working agreements (for you and any coding assistant in the editor)

- Design values come from section 8 and `design-reference/`. Don't substitute fonts, colors or layouts; if a value looks wrong, change it here first.
- Content comes from `src/content/` and the fact base. Never invent facts, numbers, tools, quotes or credits.
- Follow the writing rules in section 10 for any copy touched, including UI text and alt text.
- No new dependencies without a stated reason.
- Resolve a conflict between this charter and a code convenience in favor of the charter, and update the charter when a decision changes.

---

## Appendix A: Copy deck (draft, pending Vanessa's review)

**Home masthead**
I produce and design exhibitions and events in New York.
Link below it: Brand and ecommerce work, 2020–2025

**About (first person; about 110 words). The first sentence is the page h1.**

I produce exhibitions and events in New York, most of them with artists from Ecuador and across Latin America, and I design them myself.

In 2026 I produced *Iyuana*, a week of film and photography about the Sápara Nation of the Ecuadorian Amazon, in Long Island City. I curated *Herencia Viva*, painter Luis Medina's exhibition of Ecuadorian magic realism, at three venues including Flushing Town Hall. And for the Ecuadorian American Cultural Center, where I was Creative & Community Coordinator, I planned *Ayazamana*, a night of live music and traditional dance.

Before that, I spent four years at Flywheel, a digital commerce agency, art-directing Amazon and Walmart storefronts and ads for more than twenty health, beauty and consumer brands.

I studied Communication Design at City Tech, CUNY.

*Optional single true line, after the Flywheel paragraph, only if true (drafted from her answers):*
- If she volunteered at the Center while at Flywheel: "I started designing posters for the Ecuadorian American Cultural Center as a volunteer, while I was still at Flywheel."
- If she wants her heritage stated: "I'm Ecuadorian-American and grew up in {{TODO: neighborhood}}."
- If she greets people at her events: "On opening nights I'm usually at the door."

**About, lower band**
- Artists and partners: Luis Medina, Yanda Montahuano, Armando Vega, Israel Vargas "Panchis", Li Can Vega; Flushing Town Hall, Ayllu Gallery, Ecuadorian American Cultural Center; {{TODO: Iyuana venues and sponsors}}
- Contact: vanessa.s.espin@gmail.com · Instagram {{TODO: handle}} · New York · English and Spanish {{TODO: confirm}}
- Buttons: Résumé (PDF) · LinkedIn

**Footer (all pages):** "© 2026 Vanessa Espín · New York" · "vanessa.s.espin@gmail.com · Instagram {{TODO: handle}}"

**Short bio (third person, for press, partners and programs)**
Vanessa Espín is a designer and producer in New York. In 2026 she produced *Iyuana: El Retorno de los Sueños*, a film and photography exhibition about the Sápara Nation of the Ecuadorian Amazon; curated *Herencia Viva: Threads of Memory*, painter Luis Medina's exhibition of Ecuadorian magic realism, at three venues including Flushing Town Hall; and planned *Ayazamana*, a night of live music and traditional dance, with the Ecuadorian American Cultural Center, where she was Creative & Community Coordinator. She previously spent four years at the digital commerce agency Flywheel, art-directing ecommerce for health, beauty and consumer brands. She studied Communication Design at City Tech, CUNY.

**Cover lines** (title / type · role / place · date)
- *Iyuana: El Retorno de los Sueños*: Film & photography exhibition · Producer & creative director · Long Island City · Aug 2026
- *Ayazamana*: Live music & traditional dance · Program & campaign {{TODO: confirm role}} · Ecuadorian American Cultural Center · Jul 2026
- *Herencia Viva: Threads of Memory*: Painting exhibition · Curator & creative director · Ayllu Gallery · Flushing Town Hall · May 2026
- Ecuadorian American Cultural Center: Creative & Community Coordinator · Programs, content, sponsors · New York · 2025–2026 {{TODO: confirm end date}}
- Flywheel: Art Direction Design Specialist · Amazon & Walmart brand stores, paid ads, 20+ brands · 2021–2025
- Enchante Accessories: Brand Designer, eCommerce · 2020–2021 {{TODO: only if the page is kept; claims about brand counts unconfirmed}}

**Iyuana page**
- Subtitle: Film & photography exhibition · Long Island City, Queens · August 18–24, 2026
- Body, paragraph 1: Iyuana was a week of film and photography by four artists from Ecuador, Peru and Mexico, about the Sápara Nation of the Ecuadorian Amazon. {{TODO: why this show, and what "Iyuana" means, in her words}}
- Paragraph 2 (restructured Nov 3 so the note never splits a sentence): I produced it: the two venues {{TODO: confirm the second venue}}, the identity and campaign, the installation, and the week itself, introducing each artist's work to visitors. {{TODO: How the artists and the show came together, in a sentence or two of your own}}
- Paragraph 3: {{TODO: what came of it, as facts}}
- Credit: Identity, poster & campaign: Vanessa Espín · Photography: {{TODO}} · With thanks to {{TODO}}

**EACC role page (draft from the résumé lines only)**
- Subtitle: Creative & Community Coordinator · New York · 2025–2026 {{TODO: confirm the end date}}
- Facts: Programs (Ayazamana, Jul 2026, linked) · Where (New York)
- Body: As Creative & Community Coordinator, I ran daily operations and a public events program shaped with the community, including *Ayazamana*, a night of live music and traditional dance. {{TODO: confirm}} / I made the event content and promotion, and built relationships with prospective sponsors and partners. {{TODO: confirm}}

**Flywheel role page**
- Subtitle: Art Direction Design Specialist · 2021–2025
- Facts: Work (Amazon and Walmart storefronts and ads) · Brands (20+ in health, beauty and consumer goods)
- Body: the approved About sentence about Flywheel.

## Appendix B: Source documents

1. Design canvas "Vanessa Espín — Website Redesign" (Oct 29): https://claude.ai/code/artifact/5e0c9dd9-cbb4-4c0f-8a1f-dfbc23fba104, mirrored in `design-reference/`
2. `website-redesign-plan.md`: diagnosis, site map, copy deck, writing rules (Rev 2, Oct 29)
3. `resume-review-2026-10-28.md`: résumé review, open items
4. `resume-notes.md`: positioning and key decisions
5. `resume-synthesis.md`: synthesis of three chats plus a Gemini review
6. `resume-synthesis-alternate.md`: a second synthesis run