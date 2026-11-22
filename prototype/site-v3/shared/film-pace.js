// Film pace: keeps a film moving smoothly on whatever machine plays it.
// The three event films shade a great many pixels on a Retina screen. When frames run late, this lowers the resolution the film
// draws at, one step at a time, and raises it again when there is clear room. On a machine that keeps up, it never does anything.
//
//   import('/Vanessa-Espin-website/shared/film-pace.js').then(({ keepPace }) => keepPace({ renderer, min: 1, apply: resize }));
//
// renderer  the film's three.js renderer
// min       the lowest resolution scale this film may fall to (1 = one drawn pixel per CSS pixel)
// apply     called after the scale changes, to let the film resize what depends on it; by default the window's resize event is sent
// ?pace=off on the film's address turns this off; ?pace=1.25 pins a scale.
// state.hint(ms) sets the starting scale from a measured frame time (called by the warm-up, before the film starts).
const STEPS = [2, 1.75, 1.5, 1.25, 1, 0.85, 0.75];
const SLOW = 40;      // below this many frames a second for a while, step down (was 30 until Nov 22: he asked for smooth first)
const AIM = 50;       // the pace a film should start at; the warm-up measures a frame and the starting resolution is set from it
const ROOM = 57;      // at or above this for a good while, try one step up

export function keepPace({ renderer, min = 1, apply = null, name = location.pathname } = {}) {
  const q = new URLSearchParams(location.search).get('pace');
  const start = renderer.getPixelRatio();
  const steps = STEPS.filter((s) => s <= start + 0.001 && s >= min - 0.001);
  if (steps[0] !== start) steps.unshift(start);
  const setScale = (s) => { renderer.setPixelRatio(s); if (apply) apply(s); else window.dispatchEvent(new Event('resize')); };
  const state = { scale: start, steps, fps: 0, changes: 0, off: q === 'off' };
  window.__filmPace = state;
  if (q === 'off' || steps.length < 2) return state;
  if (q && +q > 0) { state.scale = Math.min(start, +q); setScale(state.scale); state.off = true; return state; }

  const KEY = 'film-pace:' + name;
  let idx = 0, lockedUp = false;
  try { const saved = +sessionStorage.getItem(KEY); const k = steps.indexOf(saved); if (k > 0) { idx = k; state.scale = steps[k]; setScale(steps[k]); } } catch {}

  const raf = window.requestAnimationFrame.bind(window);
  let last = 0, quietUntil = performance.now() + 2500, sum = 0, n = 0, slowFor = 0, roomFor = 0, steppedUpAt = -1e9;
  const change = (k, now) => {
    idx = k; state.scale = steps[k]; state.changes++; setScale(steps[k]);
    try { sessionStorage.setItem(KEY, String(steps[k])); } catch {}
    quietUntil = now + 1300; sum = n = slowFor = roomFor = 0;
  };
  // The warm-up (film-warm.js) measures how long the film's heavier frames take to draw and tells us before the film starts,
  // so the right resolution is in place from the first frame instead of being found over the first ten seconds.
  // The guess assumes about three quarters of a frame's cost follows the number of pixels.
  state.hint = (frameMs) => {
    if (!(frameMs > 0)) return state.scale;
    let k = idx, est = frameMs;
    while (est > 1000 / AIM && k < steps.length - 1) { est *= 0.25 + 0.75 * (steps[k + 1] / steps[k]) ** 2; k++; }
    state.hinted = { frameMs: +frameMs.toFixed(1), from: steps[idx], to: steps[k] };
    if (k !== idx) change(k, performance.now());
    return state.scale;
  };
  (function beat(now) {
    raf(beat);
    const dt = now - last; last = now;
    if (document.hidden || dt <= 0 || dt > 250 || now < quietUntil) { sum = n = 0; return; }   // a held film, a stall or a fresh resize is not a measurement
    sum += dt; n++;
    if (sum < 500) return;                         // judge half a second at a time
    const fps = 1000 * n / sum; state.fps = +fps.toFixed(1); const span = sum; sum = n = 0;
    if (fps < SLOW) { slowFor += span; roomFor = 0; } else if (fps >= ROOM) { roomFor += span; slowFor = 0; } else { slowFor = roomFor = 0; }
    if (slowFor >= 1500 && idx < steps.length - 1) {
      if (now - steppedUpAt < 6000) lockedUp = true;   // the step up did not hold: stay down from now on
      change(idx + 1, now);
    } else if (roomFor >= 8000 && idx > 0 && !lockedUp) { steppedUpAt = now; change(idx - 1, now); }
  })(performance.now());
  return state;
}
