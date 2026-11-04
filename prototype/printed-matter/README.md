# Prototype: "printed matter"

A design prototype for vanessaespin.com, inspired by the A24 concept site by Ravi Klaassens
(a24.raviklaassens.com). Vanessa's posters are printed sheets in WebGL: they flex as they move,
flip to a printed back when dragged, and carry into each program page. Not part of the Astro build.

Run it (from the project folder):

    python3 -m http.server 4500 -d prototype/printed-matter

then open http://localhost:4500

Try: scroll, drag a poster to flip it, hover it, click it, use the arrow keys, open Index.

## Routes

| Link | View |
|---|---|
| `#/` | Programs: the poster carousel (home) |
| `#/iyuana`, `#/ayazamana`, `#/herencia-viva`, `#/ecuadorian-american-cultural-center` | A program page: hero, story, text with the documentation tool and a voice line, next program |
| `#/brand` | Brand work: Flywheel, Enchante Accessories, Humane Lane; a five-column Flywheel case; a testimonial slot; the bridge block |
| `#/archive` | Earlier work (rows from her old site), selected experience, education |
| `#/about` | Opens the About drawer over the view on screen (with the lab's `about=page`, the old About page) |

Nav: Programs · Brand work · About · Index. Index lists the programs, then Brand work, Earlier work, About and Email.
Brand work and Earlier work have no WebGL slots: the sheets are parked out of sight (`pageFrame`), as on the old About page.

**About as a drawer.** "About", Index → About and `#/about` slide a 420 px panel (full width on phones) in from the
right over the current view, in 0.5 s on `cubic-bezier(.165,.84,.44,1)`, while a scrim dims the page. Close, a click
on the scrim or Esc closes it; focus moves into the drawer and back afterwards, and the link returns to what it was
(the view underneath is not rebuilt). It holds her name and headline, a bio placeholder, "How I work with artists",
four "Work together" doors (Artists; Institutions & venues; Brands & sponsors; Press), email, LinkedIn, the résumé and
a greyscale portrait.

**Documentation tool** (on each program page). One frame at a time: a wheel notch inside it, the arrow keys (when
focused) or a click steps to the next frame. The picture cuts at once and the caption follows. At either end the wheel
scrolls the page again. Stone frames with placeholder captions stand in until her photographs exist.

## Placeholders: facts stay, her voice is still to come

Facts (the poster credits, venues, dates, artists, her LinkedIn roles and bullets) are written out. Anything in her
voice is an honest placeholder, made with `ph(label, qs)` in `app.js`:

    <span class="ph" data-q="q04" title="Her words go here · interview question 4">[label]</span>

The label says what goes there and roughly how long it is. It is set in the font of its context, in oxblood on paper
and stone and in `#e3907d` on night. Things that are not hers to write (photographs, artists' or colleagues' lines,
results) carry no `data-q` and say in their title what is needed (for example, permission). To find every open slot:
`document.querySelectorAll('.ph')`; for one question: `.ph[data-q~="q05"]`.

| # | Interview question | Fills |
|---|---|---|
| q01 | Her position in one breath (EN and ES) | About (drawer and page) |
| q02 | From brand jobs to "more than a role, it's a mission" | Cultural Center story, the bridge, About bio |
| q03 | Herencia Viva | Herencia Viva story and lead |
| q04 | Iyuana; how to credit her role beside the Sápara artists | Iyuana story, lead, credits; "How I work with artists" |
| q05 | The Ayazamana night | Ayazamana story, lead, "her role on the night" |
| q06 | The poster process | "The poster" credit on each program; "How I work with artists" |
| q07 | Brand habits brought into a gallery | Brand work intro, the bridge |
| q08 | A brand case | The Flywheel case: objective, insight, idea |
| q09 | What she'd never say; where home shows | About bio |
| q10 | Earlier work | Earlier work intro, the "[her role]" cells |
| q11 | An unrealized project | Work together doors |
| q12 | Three words, plus anything else | Work together doors |
Fonts load from Fontshare (Zodiak, Switzer; free licence for web use); three.js from jsDelivr.

## The lab: trying alternatives

Add `?lab` to the address (or press Shift+L) to open a panel of switches. The defaults are the
live site; a dot marks them. Every change is kept in the address, so any combination is a link:
"Copy link" copies the current version without the panel, to send to someone.

| Switch | Link value | Options |
|---|---|---|
| Selection mark | `mark` | `circle` (live), `grease`, `hang`, `tape`, `hangtape`, `wire` (nail and wire), `box` (select box) |
| Title type | `type` | `zodiak` (live), `gambetta`, `caslon`, `instrument` |
| Paper | `paper` | `warm` (live), `cream`, `white`, `stone` |
| Accent | `accent` | `oxblood` (live), `brick`, `ink` |
| Grain | `grain` | `off`, `soft` (live), `strong` |
| Poster tilt | `tilt` | `flat`, `soft` (live), `strong` |
| Program story section | `story` | `night` (live), `stone`, `paper` |
| Loader | `loader` | `on` (live), `off` |
| About | `about` | `drawer` (live), `page` (the old full About page, with the same placeholders) |

Example: `?mark=hangtape&paper=cream` shows the tape and hanging marks on cream paper.
To add a switch, add an entry to `LAB` in `app.js`: its options and an `apply` function.
