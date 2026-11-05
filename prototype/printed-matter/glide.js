/* The gliding scroll (lab scroll=glide): the wheel on a program page, smoothed the way Lenis does it, as on Daddy
   Yankee. The wheel adds to a target and the page closes on it each frame, by lerp 0.1 at 60 fps and the same at
   any other frame rate, so the scroll stops with a short tail when the hand stops. The page still scrolls
   for real (window.scrollTo): sticky pins, the scrollbar, keyboard and find all stay the browser's own.

   glideInstall(can)  once, at start, and not at all for touch or reduced motion. can() says whether a wheel may glide
                      now. The listener has to go on after anything that reads defaultPrevented on window.
   glideTick(dt)      at the top of the frame, before anything reads the scroll: the page, the slots and the
                      sheets then all agree, which native scrolling can't promise.
   glideHalt()        stops where it is.

   It leaves alone a wheel that something else took (the documentation tool, the lightbox), a pinch, a sideways or
   shift wheel, and a wheel over anything that scrolls by itself. A scrolling key ends the glide at once, and any other
   scroll that isn't its own (a drag of the scrollbar, focus moving, a page change) on the next frame; the next wheel
   starts from wherever the page is. At either end of the page the wheel stays native, so the bounce is the browser's. */

const LERP = 0.1;
const LINE = 33; // a wheel that counts in lines (the same as the rest of the site): three lines, one notch of 100 px
const SKIP = '.lab, #index-panel, .drawer, [data-no-glide]';
const KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];

let on = false, pos = 0, target = 0, seen = 0;
const limit = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);

export function glideInstall(can) {
  addEventListener('wheel', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.shiftKey || !can() || e.target.closest?.(SKIP)) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const d = e.deltaY * (e.deltaMode === 1 ? LINE : e.deltaMode === 2 ? innerHeight : 1);
    if (!d) return;
    if (!on) pos = target = seen = scrollY;
    const to = Math.min(limit(), Math.max(0, target + d));
    if (!on && to === target) return;
    e.preventDefault();
    target = to; on = true;
  }, { passive: false });
  // a scrolling key lets go before the browser starts its own animation: one more write from here would cut that short
  addEventListener('keydown', (e) => { if (KEYS.includes(e.key)) on = false; });
}

export function glideTick(dt) {
  if (!on) return;
  if (Math.abs(scrollY - seen) > 1) { on = false; return; } // someone else moved the page
  target = Math.min(target, limit()); // the page may have got shorter
  pos += (target - pos) * (1 - Math.exp(-LERP * 60 * dt));
  if (Math.abs(target - pos) < 0.5) { pos = target; on = false; }
  scrollTo(0, pos);
  seen = scrollY;
}

export function glideHalt() { on = false; }
