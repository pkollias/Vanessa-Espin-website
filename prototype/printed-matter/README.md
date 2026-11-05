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
sticks while it is pressed, and a tap still opens it. There is no hover mark, and no tape
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

Nav: Vanessa Espín · Curation · Branding · About · Index. Index lists the programs, then Brand work, Earlier work, About and LinkedIn.
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

**The pictures.** `img/iyuana/` holds the eight event photographs (`01-…` to `10-…`, 1800 px wide) and
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
`pictures.js` hands on to `wall.js`, `crossing.js` and `chapters.js`. Through `ctx.paper` a section can hang
its own sheets of the posters' paper in the WebGL scene (`PaperSheet` in `app.js`) and put things behind them in
`#under-gl`, a layer between the page's ground and the canvas.

## Placeholders: facts stay, her voice is still to come

Facts (the poster credits, venues, dates, artists, her LinkedIn roles and bullets) are written out. Anything in her
voice is an honest placeholder, made with `ph(label, qs)` in `app.js`:

    <span class="ph" data-q="q04" title="Her words go here · interview question 4: Iyuana, and how …">[label]<span class="vh"> (same note)</span></span>

The label says what goes there and roughly how long it is. The title names the question (from `INTERVIEW` in
`app.js`) for a pointer; the same note is repeated as visually hidden text, so keyboard, touch and screen-reader users
get it too. It is set in the font of its context, in `--ph` (`#470000`) on
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

**Compare.** The first row, `Normal | Faded + tape`, sets two switches at once: `?compare=faded` is `poster=faded` and
`tape=on`, and a switch named in the link as well wins over it. At Normal the Compare row stays out of the link, and
when the switches are mixed, neither button is pressed and each switch is written on its own.

| Switch | Link value | Options |
|---|---|---|
| Home: poster under the pointer | `pin` | `hover` (default: the centred poster sticks flat to the wall under the pointer), `off` (it lifts) |
| Home: tape on the stuck poster | `tape` | `off` (default), `on` (four tapes press on) |
| Home: wheel | `step` | `free` (default: free scroll that snaps to a poster), `notch` (one notch, one poster, with the flock) |
| Program: poster | `poster` | `cover` (default: the press and flight, a flat cover, then to the side), `faded` (the same cover, then a ghost behind the story), `table` (on the table, then to the side) |
| Program: next poster | `next` | `turn` (default: on the pile, raised into view; a push or the click turns it into the next cover; Back lands at the top of the page), `click` (a link, and the page swaps at once) |
| Iyuana: opening print | `wallopen` | `hands` (default), `sky` |
| Iyuana: the walk | `walk` | `mixed` (default: far prints zoom, neighbours slide), `zoom` (always), `jump` (print to print, no pull back) |
| Herencia Viva: how a ground arrives | `edge` | `bubble` (default), `flat`, `fade` |
| Program: scroll | `scroll` | `glide` (default: the wheel glides), `native` |
| Title type | `type` | `gambetta` (default), `zodiak`, `caslon`, `instrument` |
| Paper | `paper` | `stone` (default), `warm`, `cream`, `white` |
| Grain | `grain` | `off`, `soft` (default), `strong` |
| Poster tilt | `tilt` | `flat`, `soft` (default), `strong` |
| Program story section | `story` | `night` (default), `stone`, `paper` |
| Loader | `loader` | `on` (default), `off` |
| About | `about` | `drawer` (default), `page` (the old full About page, with the same placeholders) |

Example: `?tape=on&paper=cream` shows the tape on cream paper.
To add a switch, add an entry to `LAB` in `app.js`: its options and an `apply` function (and an entry in `PRESETS`
if the Compare row should set it). The visual-pass switches write their value into `VIS`.

## Gliding scroll

On program pages the wheel glides, as on Daddy Yankee: `glide.js` smooths it the way Lenis does (lerp 0.1, the same at
any frame rate), so a notch still comes to 100 px and the scroll stops with a tail of under a second. The page scrolls
for real, so sticky pins, the scrollbar, find and the keyboard stay the browser's own. It moves the page at the top of the
frame, so the DOM and the WebGL sheets always read the same scroll. Off for touch and reduced motion; other pages keep
the native wheel, and the home carousel keeps its notch. Left alone: a wheel something else took (the documentation
tool, the lightbox), a pinch, a sideways or shift wheel, the lab, the Index panel and the drawer. A scrolling key or
any scroll that isn't its own ends the glide. Mark an element `data-no-glide` to keep the wheel off it.

## Grounds

`data-tone` takes `night`, `blood` (the oxblood), `cobalt` (`#2f5fc0`, the blue of her poster), `stone`, `paper` and `rose` (`#c7797f`, the pink of the Herencia Viva
poster). `blood` and `cobalt` behave as `night` (`darkTone` in `app.js`): paper text, the dark nav, the light placeholder colour. `rose`
behaves as `paper`. A section fades out only on a ground of the other kind, dark or light.

## Pictures (Nov 4 revision)

The rapid stepper is no longer the default. Each program shows its pictures according to what they are:

- **Iyuana: the wall** (`wall.js`). It opens full-screen on the print of hands over the eyes (lab `wallopen`), pulls back to 16 prints on one dark wall, and a click pushes a print in. Then the scroll walks the wall (see below); the last stop, the cacao, holds half a screen, and the photograph leaves with the scroll: the next section has its own paper ground (`.pic-wall + .p-text` in `pictures.css`) and rises on a flat line under it. Those two sections are exempt from the off-tone fade, and the page's tone turns when the paper has nearly reached the top. Photos are in `img/iyuana/wall/` and, for the prints the camera goes into, `img/iyuana/full/`. Phones get the prints that stay on the wall from `img/iyuana/phone/` (the same pictures, 1200 px on the long side); the lightbox always uses the larger files. The opening print loads first, the other fifteen after it.
- **Herencia Viva: the chapters** (`chapters.js`): see below. `crossing.js` and the held light and drift band in `pictures.js` can no longer be reached from the lab.
- **Stepper**: Ayazamana only, and it never takes the wheel on stone frames.

Never repeat the home carousel's visual on another page.

## The chapters

Herencia Viva's pictures, between the story and the text, on Daddy Yankee's logic: each kind of thing gets its own treatment, and every screen has one loud thing on it. `chapters.js` is the engine and holds no content. `chapters-content.js` holds the words, pictures and grounds, one entry per program, so moving a program in or out of the chapters is an edit there (a program with an entry gets the chapters before anything else in `picturesHTML`; `lab` ties an entry to a lab switch). The file's header lists the recipes and what each takes.

| Chapter | Recipe | What happens |
|---|---|---|
| The print | `bleed` | The oranges print fills the screen on night, no type, only a slow push |
| The words | `travel` | Cobalt rises on the bubbling edge; ECUADORIAN, MAGIC and REALISM come up the screen in giant capitals and slide to the sides, each at its own moment |
| His paintings, then her | `aim` | Encuentro, the Meninas detail and the village rise edge to edge on night, each a small step lower. The row slides off to the right and uncovers the light ground: A TEAM THAT DIDN'T REST on the left, Vanessa on the ladder at the right, black and white and unframed |
| Her designs | `pushin` | On blood, Threads of Memory grows from a speck to the screen's height, lifts off, and ECUADOR. NY. 2026 is there behind it; the fish and the shirt pop in and cross over the type at 1.23 and 1.88 times the scroll |
| The event | `rooms` | No pin. On night, FLUSHING TOWN HALL goes by beside a finger pointing at Encuentro, flush to the screen's left edge |
| The close | `closer` | LUIS [print] MEDINA on cobalt: the print opens between the words and grows until it fills the screen, the words go off past the edges, and it holds until the page's paper covers it on a flat line |

What you see lives in two layers: `.ch-stage` in `#under-gl` below the canvas (grounds, type, rooms), and sheets of the posters' paper above it (every printed object), so objects always pass in front of the type. The page keeps a transparent spacer for the scroll and for what a screen reader gets. Each scene is a sticky pin done by hand, and a recipe's `frame()` is a pure function of the scroll, so when the scroll stops the move stops; only the words have a tail (scrub 0.8). The page's tone turns when a new ground has nearly reached the top of the screen. The display type is the title font (`--serif`) at weight 800. Type is fitted to the screen by measuring it, again whenever a font arrives.

At 1440 and 1280 nothing is shown above 1.2 times its own size. The row of paintings runs edge to edge, so on monitors of 1920 and up it passes that (the village reaches 1.46x at 1920 and 1.94x at 2560); whether to accept this or get larger files is an open decision. No painting is cropped. On a phone the word stacks turn and read up the screen, since a tall screen is a wide one on its side, and the sheet that fills the height on a desktop stops at the screen's width. With reduced motion each recipe's `still()` replaces all of it: still compositions in the page's flow, with no sheets. The words are only what is on her poster, campaign image and specs, plus names and dates.

## The edge

`edge.js` and `edge.css` draw the line where one ground meets the next, three ways: `bubble`, `flat` (the ground's own straight top) and `fade` (a third of a screen of gradient). `bubble` is Daddy Yankee's seam, ported from its source with its numbers: two sheets of round cells slide across each other under a threshold, so blobs swell out of the front, pinch off, hang and are taken back, and a fine grain roughens the outline. The scroll drives it; when it stops, the edge settles in about a second to a slow breath. Each edge is one WebGL2 canvas standing on the top of its ground (the parent must be positioned and must not clip), at most 1.5x the screen's pixels and 24 fps, and only on screen. Without WebGL2 or with reduced motion it is `flat`. The file's header has the API.

## Herencia Viva, as approved (Nov 5)

`chapters.js` is the engine and `chapters-content.js` the content, so a program can move between engines by config. The page runs: the oranges print full-screen, ECUADORIAN MAGIC REALISM travelling on cobalt, three paintings rising edge to edge, A TEAM THAT DIDN'T REST (Luis Medina's words, translated from his June 7, 2026 post) beside Vanessa on the ladder, ECUADOR. NY. 2026, Flushing Town Hall, then LUIS [print] MEDINA with the print growing to full screen. The opening and the ending are approved: leave them as they are. Lab switches: `edge` (bubble, flat, fade), `scroll`.

No email address and no résumé on public pages or in this repo (decided Nov 5, 2026, because of crawlers). LinkedIn is the contact for now.

Iyuana's wall now walks: after the pull back the scroll stops at the palm portraits, Vanessa, the Sápara Nation, the candles and the cacao. Far prints are reached by zooming out and in, neighbours by a slide along the wall. The stops are `TOUR` in `wall.js`.

## The normal version (Nov 5)

Defaults: Gambetta titles, stone paper, free wheel on home. The lab's Compare row has Normal and Faded + tape (`?compare=faded`: poster=faded, tape=on). `Iyuana: the walk` (`walk`) chooses mixed, zoom or jump. Older links with switches that no longer exist fall back to the defaults.

## Home's statement and the next poster (Nov 5)

Home opens at `INTRO` (position -1 in the carousel): the statement in the middle and the first poster waiting at the top right, in the slot the next poster always uses. The first scroll, swipe, key or click on the poster goes on to it; scrolling back returns. The name in the nav goes to the statement, Curation to the posters. "I create curated experiences" is a placeholder line until her words arrive. At the foot of a program page the next poster itself is the link (`.p-next__link` over `slot--next`); the name above it is a label.
