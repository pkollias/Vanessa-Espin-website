# Prototype: "printed matter"

A design prototype for vanessaespin.com, inspired by the A24 concept site by Ravi Klaassens
(a24.raviklaassens.com). Vanessa's posters are printed sheets in WebGL: they flex as they move,
flip to a printed back when dragged, and carry into each program page. Not part of the Astro build.

Run it (from the project folder):

    python3 -m http.server 4500 -d prototype/printed-matter

then open http://localhost:4500

Try: scroll, drag a poster to flip it, hover it, click it, use the arrow keys, open Index.
Fonts load from Fontshare (Zodiak, Switzer; free licence for web use); three.js from jsDelivr.

## The lab: trying alternatives

Add `?lab` to the address (or press Shift+L) to open a panel of switches. The defaults are the
live site; a dot marks them. Every change is kept in the address, so any combination is a link:
"Copy link" copies the current version without the panel, to send to someone.

| Switch | Link value | Options |
|---|---|---|
| Selection mark | `mark` | `circle` (live), `grease`, `hang`, `tape`, `hangtape` |
| Title type | `type` | `zodiak` (live), `gambetta`, `caslon`, `instrument` |
| Paper | `paper` | `warm` (live), `cream`, `white`, `stone` |
| Accent | `accent` | `oxblood` (live), `brick`, `ink` |
| Grain | `grain` | `off`, `soft` (live), `strong` |
| Poster tilt | `tilt` | `flat`, `soft` (live), `strong` |
| Program story section | `story` | `night` (live), `stone`, `paper` |
| Loader | `loader` | `on` (live), `off` |

Example: `?mark=hangtape&paper=cream` shows the tape and hanging marks on cream paper.
To add a switch, add an entry to `LAB` in `app.js`: its options and an `apply` function.
