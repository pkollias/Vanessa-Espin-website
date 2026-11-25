// Film warm-up: do the slow first-time work before the film starts, not in the middle of it.
//
// The first time a film draws something new, the browser has to build a shader for it and send its pictures to the
// graphics card. The same happens when a light switches on, because every lit surface then needs a new shader.
// Mid-film that shows as a freeze: the theater stopped for a quarter of a second when the rose's light came on,
// Herencia for more than a second as its poster arrived (both on a fast laptop; longer on a phone).
// This visits the film's moments ahead of time, drawing each into a 2 x 2 pixel corner, so that all of that work is
// done while the opening frame is held. Then the film starts and nothing new has to be built.
//
//   const { warmFilm } = await import('/shared/film-warm.js');
//   await warmFilm({ renderer, scene, camera, times, visit, draw });
//
// renderer, scene, camera   the film's three.js objects
// times    the film times to visit, in whatever unit the film uses (a visit every second or so is enough;
//          add the exact moments where a light or an object switches on)
// visit    (t) => put the scene in the state of time t, without drawing
// draw     () => draw one frame the way the film does; default renderer.render(scene, camera)
// first    the time to hold on screen while warming and to return to; default times[0]
// ?warm=off on the film's address skips it (to compare).
//
// It returns { ms, states, programs, frameMs, skipped } and also leaves that in window.__filmWarm.
// frameMs is how long one of the film's heavier frames takes to draw here; the pace helper sets the starting resolution from it.
export async function warmFilm({ renderer, scene, camera, times, visit, draw = null, first = null, maxMs = 15000 } = {}) {
  const out = { ms: 0, states: 0, programs: 0, skipped: false, done: false };
  window.__filmWarm = out;
  if (new URLSearchParams(location.search).get('warm') === 'off' || !renderer || !times || !times.length) { out.skipped = true; out.done = true; return out; }
  const t0 = performance.now();
  const hold = first === null ? times[0] : first;
  const paint = draw || (() => renderer.render(scene, camera));
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  const programs = () => (renderer.info && renderer.info.programs ? renderer.info.programs.length : 0);
  const before = programs();

  // Pictures still arriving would be sent to the card later, mid-film: give them a moment to land first.
  const waiting = () => {
    let n = 0; const seen = new Set();
    const look = (tex) => { if (!tex || !tex.isTexture || seen.has(tex)) return; seen.add(tex); const im = tex.image; if (im && im.tagName === 'IMG' && !(im.complete && im.naturalWidth)) n++; };
    scene.traverse((o) => { for (const m of [].concat(o.material || [])) { for (const k in m) look(m[k]); if (m.uniforms) for (const k in m.uniforms) look(m.uniforms[k] && m.uniforms[k].value); } });
    return n;
  };
  for (let i = 0; i < 40 && waiting() > 0; i++) await new Promise((r) => setTimeout(r, 100));

  // While warming, nothing is left out for being off camera: what the film will show later gets built now.
  const culled = [];
  scene.traverse((o) => { if (o.frustumCulled) { culled.push(o); o.frustumCulled = false; } });
  try {
    // 1. Build the shaders for every moment. Where the browser can, this runs off the main thread, so nothing stalls.
    for (const t of times) {
      if (performance.now() - t0 > maxMs) break;
      visit(t);
      const built = renderer.compileAsync ? renderer.compileAsync(scene, camera) : (renderer.compile && renderer.compile(scene, camera), null);
      visit(hold);                                   // back to the opening before waiting, so nothing else sees a later moment
      if (built) { try { await built; } catch {} }
    }
    // 2. Draw every moment into a 2 x 2 pixel corner: this sends each picture to the card and builds whatever step 1
    //    could not reach (shadow passes, the film's own extra passes). After each batch the opening frame is drawn
    //    again in full, so the screen only ever shows the opening.
    let batch = performance.now();
    for (const t of times) {
      if (performance.now() - t0 > maxMs) break;
      visit(t);
      renderer.setScissor(0, 0, 2, 2); renderer.setScissorTest(true);
      try { paint(); } finally { renderer.setScissorTest(false); }
      out.states++;
      if (performance.now() - batch > 24) { visit(hold); paint(); await frame(); batch = performance.now(); }
    }
  } finally {
    for (const o of culled) o.frustumCulled = true;
    renderer.setScissorTest(false);
    visit(hold); paint();
  }
  // 3. How long does a frame of this film take on this machine? Draw a few moments in full, wait for the card each time,
  //    and tell the pace helper, which lowers the starting resolution if the film would run under about 50 frames a second.
  try {
    const gl = renderer.getContext(), took = [], px = new Uint8Array(4);
    // Reading one pixel back is what makes the browser wait until the card has really finished the frame.
    const settle = () => { renderer.setRenderTarget(null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
    const picks = [0.15, 0.4, 0.65, 0.9].map((f) => times[Math.min(times.length - 1, Math.floor(f * times.length))]);
    for (const t of picks) { visit(t); paint(); settle(); const a = performance.now(); paint(); settle(); took.push(performance.now() - a); }
    visit(hold); paint();
    took.sort((x, y) => x - y);
    out.frameMs = +took[took.length - 2].toFixed(1);                 // the second slowest: one outlier does not decide
    if (window.__filmPace && window.__filmPace.hint) out.scale = window.__filmPace.hint(out.frameMs);
  } catch {}
  out.programs = programs() - before; out.ms = Math.round(performance.now() - t0); out.done = true;
  return out;
}

// Send every picture the scene uses to the graphics card now, so none is sent the first time it comes into view.
// For a film that cannot be visited moment by moment (Iyuana: its hanging boards have swing physics that a jump in
// time would disturb). Returns how many pictures were sent.
export function sendPictures(renderer, scene) {
  if (new URLSearchParams(location.search).get('warm') === 'off' || !renderer || !renderer.initTexture) return 0;
  const seen = new Set(); let n = 0;
  const send = (tex) => {
    if (!tex || !tex.isTexture || seen.has(tex)) return; seen.add(tex);
    if (tex.isRenderTargetTexture || tex.isDepthTexture || tex.isCubeTexture || tex.isVideoTexture) return;
    const im = tex.image; if (!im) return;
    if (im.tagName === 'IMG' && !(im.complete && im.naturalWidth)) return;
    try { renderer.initTexture(tex); n++; } catch {}
  };
  scene.traverse((o) => {
    for (const m of [].concat(o.material || [])) { for (const k in m) send(m[k]); if (m.uniforms) for (const k in m.uniforms) send(m.uniforms[k] && m.uniforms[k].value); }
    if (o.isLight && o.map) send(o.map);
  });
  return n;
}
