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
const STEPS = [2, 1.75, 1.5, 1.25, 1, 0.85, 0.75];
const SLOW = 30;      // below this many frames a second, motion visibly stutters: step down
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
