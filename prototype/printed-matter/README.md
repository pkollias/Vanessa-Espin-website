# Prototype: "printed matter"

A design prototype for vanessaespin.com, inspired by the A24 concept site by Ravi Klaassens
(a24.raviklaassens.com). Vanessa's posters are printed sheets in WebGL: they flex as they move,
flip to a printed back when dragged, and carry into each program page. Not part of the Astro build.

Run it (from the project folder):

    python3 -m http.server 4500 -d prototype/printed-matter

then open http://localhost:4500

Try: scroll, drag a poster to flip it, hover it, click it, use the arrow keys, open Index.
Fonts load from Fontshare (Zodiak, Switzer; free licence for web use); three.js from jsDelivr.
