# Prototype: "printed matter"

A design prototype for vanessaespin.com, inspired by the A24 concept site by Ravi Klaassens
(a24.raviklaassens.com). Vanessa's posters are printed sheets in WebGL: they flex as they move,
flip to a printed back when dragged, and carry into each program page. Not part of the Astro build.

Run it (from the project folder):

    python3 -m http.server 4500 -d prototype/printed-matter

then open http://localhost:4500

Try: scroll, drag a poster to flip it, hover it, click it, use the arrow keys, open Index.

**Home, visual pass 1.** One wheel notch moves exactly one poster: it glides 0.51 s on A24's
`cubic-bezier(.32,.72,0,1)`, and the neighbours follow with growing lag (about 90 ms at the centre, 155 ms at the
edges). Trackpad deltas add up to a step at 50 px; after a step the wheel is locked until the glide is mostly done
(at most 400 ms), and the tail of a flick never re-arms it, so one flick is one step (a pause, a harder push or a
sustained push gives the next). Arrow keys and drag are unchanged. At rest every poster hangs tilted, the centred
one included: the carousel's tilt plus a little off the wall (more curl, a small alternating turn of about 2°, a
softer shadow). The poster under the pointer, any of them, sticks flat to the wall: tilt, curl, wave, bend, float and
lift ease to 0 in 280 ms with a tight contact shadow, and it eases back in 200 ms when the pointer leaves. One poster
at a time; while the carousel moves or a drag is under way, all of them hang. On touch, the poster under the finger
sticks while it is pressed, and a tap still opens it. There is no hover mark by default (lab `mark=none`), and no tape
(lab `tape=on` presses four strips across the stuck poster's corners, top left, top right, bottom right, bottom left,
70 ms apart, once it is flat, and peels them in 100 ms; the tape's animation is still to be designed). The tape is a
state of the poster, drawn in its own layer (`#pins`) by the frame loop. The two lines under the poster are smaller
and tighter, so they clear the posters.

**The poster's journey, visual pass 1.** Opening a program from home, the clicked poster presses (0.94 in 120 ms),
springs (1.015 in 160 ms) and comes off the wall while the others sink back and shrink away, the nearest first; it
then flies to the hero, where it lands upright and sticks flat to the wall: the program's cover, about 70vh tall and
right of the title. The title, credits and specs keep to a column on its left, and `fitHeroTitle` shrinks the title
if its widest word wouldn't fit. On phones the cover sits below the title, the full column wide, and stays on the page
until the text under it has nearly passed. Scrolling into the story, the poster comes off the wall and travels to the
side, or with `poster=faded` grows behind the lines as a ghost at 15% (7% for the Center's pale card). The ghost waits
for the hero's text to leave before it grows, and it has gone before the ground turns to paper. With `tape=on` the
cover carries the four tapes. At the foot of the page the next poster waits on the pile, about 5° askew with a corner
lifted, raised into view (`.p-next--turn`). "Open X", or a deliberate push past the end, hands off to it: it lifts, turns over
once so its printed back flashes past, and rises to the hero, while the old page's text exits upward; the page swaps
behind it at 0.5 s, when only the poster is on screen, so nothing cuts or jumps. A push is one more wheel notch or
about 80 px of overscroll (trackpad or touch), begun after the page has rested at its end for 350 ms: scrolling that
runs into the end never fires it, and neither does a wheel over the documentation tool, the lab or the open Index.
About opened during the turn stays open, and the turn finishes when it closes. Back from the next program lands at the
top of the page. Keyboard focus moves to the new page's title. A modified click still opens the link as usual. Any element with
`data-sheets="park"` fades the program's poster while at least 60% of the screen's height shows it. With reduced
motion there is no press, flight or turn: the poster is simply in place, and the page fades out for the hand-off.

## Routes

| Link | View |
|---|---|
| `#/` | Programs: the poster carousel (home) |
| `#/iyuana`, `#/ayazamana`, `#/herencia-viva`, `#/ecuadorian-american-cultural-center` | A program page: hero, story, text with the documentation tool and a voice line, next program |
| `#/brand` | Brand work: Flywheel, Enchante Accessories, Humane Lane; a five-column Flywheel case; a testimonial slot; the bridge block |
| `#/archive` | Earlier work (rows from her old site), selected experience, education |
| `#/about` | Opens the About drawer over the view on screen (with the lab's `about=page`, the old About page) |

Nav: Programs · Brand work · About · Index. Index lists the programs, then Brand work, Earlier work, About and LinkedIn.
On Earlier work the Index button is marked as the current item, since that is where the page is listed.
Her headline ("Brand curator of events and experience") sits in the home's lower-left corner; on phones it is one
small centred line above the blurbs (the right-hand counter and hint stay hidden there).
Brand work and Earlier work have no WebGL slots: the sheets are parked out of sight (`pageFrame`), as on the old About page.

**About as a drawer.** "About", Index → About and `#/about` slide a 420 px panel (full width on phones) in from the
right over the current view, in 0.5 s on `cubic-bezier(.165,.84,.44,1)`, while a scrim dims the page. Close, a click
on the scrim or Esc closes it; focus moves into the drawer and back afterwards, and the link returns to what it was
(the view underneath is not rebuilt). It holds her name and headline, a bio placeholder, "How I work with artists",
four "Work together" doors (Artists; Institutions & venues; Brands & sponsors; Press), LinkedIn and
a greyscale portrait.

**Documentation tool** (on each program page). One frame at a time: a wheel notch inside it, the arrow keys (when
focused) or a click steps to the next frame. The picture cuts at once and the caption follows. The wheel scrolls the
page until the whole frame fits the screen, and at either end it scrolls the page again. Iyuana and Herencia Viva show real pictures; Ayazamana and the Cultural Center keep stone
frames with placeholder captions until her photographs exist.

**The pictures.** `img/iyuana/` holds the ten event photographs (`01-…` to `10-…`, 1800 px wide) and
`held-dscf4842.jpg`, the same photograph as frame 01 at 2600 px for the held light. `img/herencia-viva/` holds eight
artworks and designs (`01-…` to `08-…`). They are listed in the `docs` arrays in `PROGRAMS`, through `pictures()` in
`app.js`: file, size, caption and, where it differs, the frame's own credit. Event photographs fill the frame
(`cover`). Artworks and designs are shown whole on the paper ground with a thin margin (`contain`): never cropped and
never above 1.2 times their own size, since most of those files are only about 550 px wide. Only the current frame and
the next one load: the first is lazy, and each step preloads the one after it.

Caption rule: a neutral label (what the picture shows) with the credit line under it, in the tool's caption slot.
Nothing is written in her voice, and anything unknown is a `ph()` placeholder: Iyuana's credit line is
`Photographs: [photographer credit]`, and frame 07 waits for who is speaking (q04). On Herencia Viva the credit is
`Paintings: Luis Medina`, except frames 01, 06 and 07, which are `Design: Vanessa Espín`. Alt text is the caption
label; a placeholder caption gets a neutral alt ("Iyuana, photograph 7").

**The held light** (Iyuana, `held`). Between the story and the text, the page holds on one full-bleed photograph for
120svh, with nothing moving but a slow scale from 1.00 to 1.04 and no text over it. As you keep scrolling, it shrinks
and travels to where the first frame of the Documentation tool will land (one viewport height of scroll, on Radian's
`cubic-bezier(.625,.05,0,1)`), the page rises to meet it, and the tool takes over. If the tool was left on another
frame, it goes back to frame 01 first, under the picture. A night backdrop keeps the page dark around the light until
it lands; until then the tool takes no wheel or click, so the wheel still reaches the landing. The section is sized
in `pictures.js` so the frame lands centred on the screen. The poster is parked meanwhile (`data-sheets="park"`).
With reduced motion it is a plain hold: no scale and no cut, and the picture scrolls away with the page.

**The drift band** (Herencia Viva, `drift`). Between the story and the text, on paper: one giant line, MAGIC REALISM,
taken from her poster's "Ecuadorian Magic Realism", rises out of its own masks, and four framed pictures (18–25vw,
white mount, thin dark frame, soft shadow) drift past it at 0.6, 0.85, 1.15 and 1.4 times the page. The two slower
ones pass behind the line and the two faster ones in front. Three are Luis Medina's paintings and the fish is her
design, so the credit under the band reads `Paintings: Luis Medina · Design: Vanessa Espín`. Positions and rates are in
`DRIFT` in `pictures.js`, with their own positions for phones, where the line breaks in two. With reduced motion the pictures hold still.

The code for both is in `pictures.js` and `pictures.css`; `app.js` calls four hooks (search for "pictures hook").

## Placeholders: facts stay, her voice is still to come

Facts (the poster credits, venues, dates, artists, her LinkedIn roles and bullets) are written out. Anything in her
voice is an honest placeholder, made with `ph(label, qs)` in `app.js`:

    <span class="ph" data-q="q04" title="Her words go here · interview question 4: Iyuana, and how …">[label]<span class="vh"> (same note)</span></span>

The label says what goes there and roughly how long it is. The title names the question (from `INTERVIEW` in
`app.js`) for a pointer; the same note is repeated as visually hidden text, so keyboard, touch and screen-reader users
get it too. It is set in the font of its context, in `--ph` (`#470000`, which the lab's accent switch leaves alone) on
paper and stone and in `#e3907d` on night. A section drawn for the other tone fades out while the page is still on the
wrong ground (`followTone` in `app.js`), so night text never sits on paper or the reverse. Things that are not hers to write (photographs, artists' or colleagues' lines,
results) carry no `data-q` and say in their title what is needed (for example, permission). To find every open slot:
`document.querySelectorAll('.ph')`; for one question: `.ph[data-q~="q05"]`.

| # | Interview question | Fills |
|---|---|---|
| q01 | Her position in one breath (EN and ES) | About (drawer and page) |
| q02 | From brand jobs to "more than a role, it's a mission" | Cultural Center story, the bridge, About bio |
| q03 | Herencia Viva | Herencia Viva story and lead |
| q04 | Iyuana; how to credit her role beside the Sápara artists | Iyuana story, lead, credits; "How I work with artists" |
| q05 | The Ayazamana night | Ayazamana story, lead, "her role on the night" |
| q06 | The poster process | "How the poster was made" credit on each program; "How I work with artists" |
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

**Compare.** The first row, `Director's cut | Snapshot`, sets the switches of visual pass 1 (and the mark) at once. Each of
them defaults to the new behaviour (the director's cut), and one option, marked with a ring, reproduces the
snapshot: the site as tagged `stage-2026-11-04`. `?compare=snapshot` is the whole snapshot; a switch named in the
link as well wins over it (`?compare=snapshot&pin=hover`). At its default the Compare row stays out of the link, and
when the switches are mixed, neither button is pressed and each switch is written on its own.

| Switch | Link value | Options |
|---|---|---|
| Home: poster under the pointer | `pin` | `hover` (default: all hang tilted, the one under the pointer sticks flat to the wall), `off` (snapshot: the centred poster lifts under the pointer) |
| Home: tape on the stuck poster | `tape` | `off` (default and snapshot), `on` (four tapes press on; an older link's `pin=tape` reads as `tape=on`) |
| Home: wheel | `step` | `notch` (default: one notch, one poster, with the flock), `free` (snapshot: free scroll that snaps back) |
| Program: poster | `poster` | `cover` (default: the press and flight, a flat cover, then to the side), `faded` (the same cover, then a ghost behind the story), `table` (snapshot: on the table, then to the side; the Center's card keeps its larger type, which runs past the rule) |
| Program: next poster | `next` | `turn` (default: on the pile, raised into view; a push or the click turns it into the next cover; Back lands at the top of the page), `click` (snapshot: a link, and the page swaps at once; the poster waits low, and the browser restores the scroll) |
| Iyuana: held light | `held` | `on` (default), `off` (snapshot) |
| Herencia Viva: drift | `drift` | `on` (default), `off` (snapshot) |
| Selection mark | `mark` | `none` (default: nothing is drawn, on the posters or the next program's title), `circle` (snapshot), `grease`, `hang`, `tape`, `hangtape`, `wire` (nail and wire), `box` (select box) |
| Title type | `type` | `zodiak` (live), `gambetta`, `caslon`, `instrument` |
| Paper | `paper` | `warm` (live), `cream`, `white`, `stone` |
| Accent | `accent` | `oxblood` (live), `brick`, `ink` |
| Grain | `grain` | `off`, `soft` (live), `strong` |
| Poster tilt | `tilt` | `flat`, `soft` (live), `strong` |
| Program story section | `story` | `night` (live), `stone`, `paper` |
| Loader | `loader` | `on` (live), `off` |
| About | `about` | `drawer` (live), `page` (the old full About page, with the same placeholders) |

Example: `?mark=hangtape&paper=cream` shows the tape and hanging marks on cream paper.
To add a switch, add an entry to `LAB` in `app.js`: its options and an `apply` function (and `snap`, its
snapshot option, if the Compare row should set it). The visual-pass switches write their value into `VIS`.

No email address and no résumé on public pages or in this repo (decided Nov 5, 2026, because of crawlers). LinkedIn is the contact for now.
