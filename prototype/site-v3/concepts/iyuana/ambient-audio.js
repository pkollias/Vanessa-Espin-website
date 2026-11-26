// Shared gapless WebAudio + iOS-native HTMLAudioElement soundscape controller for the whole Iyuana experience
// (3D gallery walk + below-the-fold About & Media Salon + fullscreen media viewer).
//
// Mobile / iOS Safari guarantee:
//   - Uses native streaming HTMLAudioElement (<audio loop playsinline>) + navigator.audioSession = 'playback' on
//     touch mobile devices so audio plays even when the iPhone hardware Silent/Ringer switch is ON, streams
//     instantly over cellular, and never suffers cross-iframe WebKit AudioContext suspension!
//   - Fixes toggle() so tapping "♪ Sound (Tap)" when waitingGesture is true UNLOCKS & PLAYS rather than muting!

export const IYUANA_TRACKS = [
  { id: 'chant',  label: '♪ Forest + Amazonian Chant ★', short: 'Chant',  src: '/concepts/iyuana/assets/audio/forest-chant.m4a' },
  { id: 'forest', label: '♪ Pure Amazonian Night Forest', short: 'Forest', src: '/concepts/iyuana/assets/audio/amazon-forest.m4a' },
  { id: 'flute',  label: '♪ Forest + Ceremonial Flute',   short: 'Flute',  src: '/concepts/iyuana/assets/audio/forest-flute.m4a' },
];

const IS_TOUCH_MOBILE = typeof navigator !== 'undefined' && (
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '') ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
  (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && typeof innerWidth === 'number' && innerWidth < 1024)
);

function forcePlaybackSession() {
  try {
    if (typeof navigator !== 'undefined' && navigator.audioSession && navigator.audioSession.type !== 'playback') {
      navigator.audioSession.type = 'playback';
    }
  } catch {}
}

export function createIyuanaAudio({ initialTrack = 'chant', initialEnabled = true, baseGain = 0.72 } = {}) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx && typeof Audio === 'undefined') return null;
  forcePlaybackSession();

  let trackId = IYUANA_TRACKS.some(t => t.id === initialTrack) ? initialTrack : 'chant';
  let userMuted = !initialEnabled;
  let eventActive = true;
  let videoDucked = false;
  let ctx = null, gainNode = null, srcNode = null;
  let htmlAudio = null;
  let loadToken = 0;
  const bufferCache = new Map();
  const listeners = new Set();

  function getParentAudioBridge() {
    try {
      if (window.parent && window.parent !== window && window.parent.location.origin === location.origin) {
        return window.parent.__iyuanaAudioBridge || null;
      }
    } catch {}
    return null;
  }

  function notify() {
    const state = getState();
    for (const fn of listeners) { try { fn(state); } catch {} }
  }

  function getState() {
    if (IS_TOUCH_MOBILE) {
      const isPlaying = Boolean(htmlAudio && !htmlAudio.paused && !htmlAudio.ended);
      return {
        trackId,
        muted: userMuted,
        eventActive,
        unlocked: isPlaying,
        playing: !userMuted && eventActive && isPlaying,
        waitingGesture: !userMuted && eventActive && !isPlaying && !videoDucked,
      };
    }
    const unlocked = !!ctx && ctx.state === 'running';
    return {
      trackId,
      muted: userMuted,
      eventActive,
      unlocked,
      playing: !userMuted && eventActive && unlocked && !!srcNode,
      waitingGesture: !userMuted && eventActive && !unlocked,
    };
  }

  // ---- Mobile Native Streaming HTMLAudioElement Engine (bypasses iPhone Silent switch & cross-iframe WebKit bugs)
  function ensureMobileAudio(id) {
    const meta = IYUANA_TRACKS.find(t => t.id === id) || IYUANA_TRACKS[0];
    const bridge = getParentAudioBridge();
    const mKey = `iyuana:${meta.id}`;
    let el = bridge?.mobileAudio?.get(mKey) || null;
    if (!el) {
      el = new Audio(meta.src);
      el.loop = true;
      el.preload = 'auto';
      el.playsInline = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      try { el.volume = Math.min(1, Math.max(0, baseGain)); } catch {}
      if (bridge?.mobileAudio) bridge.mobileAudio.set(mKey, el);
    }
    if (htmlAudio !== el) {
      if (htmlAudio) { try { htmlAudio.pause(); } catch {} }
      htmlAudio = el;
      for (const ev of ['play', 'playing', 'pause', 'ended']) {
        htmlAudio.addEventListener(ev, notify);
      }
    }
    return htmlAudio;
  }

  function syncMobilePlayback() {
    if (!IS_TOUCH_MOBILE) return;
    forcePlaybackSession();
    const el = ensureMobileAudio(trackId);
    if (userMuted || !eventActive || videoDucked) {
      if (!el.paused) { try { el.pause(); } catch {} }
      notify();
      return;
    }
    try { el.volume = Math.min(1, Math.max(0, baseGain)); } catch {}
    if (el.paused) {
      const p = el.play();
      if (p && typeof p.then === 'function') p.then(notify).catch(notify);
    } else {
      notify();
    }
  }

  // ---- Desktop Sample-Accurate WebAudio Engine
  function ensureContext() {
    if (!ctx) {
      const bridge = getParentAudioBridge();
      ctx = bridge?.ctx || new AudioCtx();
      gainNode = ctx.createGain();
      gainNode.gain.value = 0.0001;
      gainNode.connect(ctx.destination);
      ctx.addEventListener('statechange', () => {
        syncGain(0.55);
        notify();
      });
    }
    return ctx;
  }

  function unlockWebAudioSync(c) {
    try {
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch {}
  }

  function desiredGain() {
    if (userMuted || !eventActive) return 0.0;
    return videoDucked ? baseGain * 0.11 : baseGain;
  }

  function syncGain(rampSec = 0.45) {
    if (!ctx || !gainNode) return;
    const now = ctx.currentTime;
    const target = desiredGain();
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(target, now + rampSec);
  }

  async function fetchBuffer(id) {
    if (bufferCache.has(id)) return bufferCache.get(id);
    const bridge = getParentAudioBridge();
    if (bridge?.buffers?.has(id)) {
      const p = bridge.buffers.get(id);
      bufferCache.set(id, p);
      return p;
    }
    const meta = IYUANA_TRACKS.find(t => t.id === id) || IYUANA_TRACKS[0];
    const p = (async () => {
      const res = await fetch(meta.src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr = await res.arrayBuffer();
      return await ensureContext().decodeAudioData(arr);
    })();
    bufferCache.set(id, p);
    p.catch(() => bufferCache.delete(id));
    return p;
  }

  function stopSource() {
    if (srcNode) {
      try { srcNode.stop(); } catch {}
      try { srcNode.disconnect(); } catch {}
      srcNode = null;
    }
  }

  async function startTrack(id, fadeSec = 0.55) {
    const tok = ++loadToken;
    ensureContext();
    let buf;
    try { buf = await fetchBuffer(id); } catch { return; }
    if (tok !== loadToken) return;
    stopSource();
    if (!eventActive) return;
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.loopStart = 0;
    s.loopEnd = buf.duration;
    s.connect(gainNode);
    s.start(0, 0);
    srcNode = s;
    syncGain(fadeSec);
    notify();
  }

  async function tryUnlock() {
    if (userMuted || !eventActive) return;
    forcePlaybackSession();
    if (IS_TOUCH_MOBILE) {
      syncMobilePlayback();
      return;
    }
    ensureContext();
    if (ctx.state !== 'running') {
      unlockWebAudioSync(ctx);
      try { await ctx.resume(); } catch {}
    }
    const startP = !srcNode ? startTrack(trackId, 0.55) : null;
    if (startP) await startP;
    else syncGain(0.45);
    notify();
  }

  // Trusted iOS Safari / Mobile user-activation events MUST include touchend & pointerup (touchstart/pointerdown are rejected by WebKit!)
  let lastGestureUnlockMs = 0;
  const unlockEvents = ['touchend', 'pointerup', 'click', 'keydown'];
  const onGesture = (e) => {
    if (userMuted || !eventActive) return;
    if (e?.target?.closest?.('#bottomSoundBtn, #cleanSound, #soundBtn, [data-sound-toggle]')) return;
    const st = getState();
    if (!st.playing) {
      lastGestureUnlockMs = performance.now();
      tryUnlock();
    }
  };
  for (const ev of unlockEvents) {
    window.addEventListener(ev, onGesture, { capture: true, passive: true });
    try {
      if (window.parent && window.parent !== window && window.parent.location.origin === location.origin) {
        window.parent.addEventListener(ev, onGesture, { capture: true, passive: true });
      }
    } catch {}
  }

  window.addEventListener('pagehide', () => {
    for (const ev of unlockEvents) {
      window.removeEventListener(ev, onGesture, { capture: true });
      try {
        if (window.parent && window.parent !== window && window.parent.location.origin === location.origin) {
          window.parent.removeEventListener(ev, onGesture, { capture: true });
        }
      } catch {}
    }
    if (htmlAudio) { try { htmlAudio.pause(); } catch {} }
    stopSource();
    if (gainNode) { try { gainNode.disconnect(); } catch {} }
  });

  function checkVideos() {
    let anyUnmuted = false;
    document.querySelectorAll('video').forEach(v => {
      if (!v.muted && !v.paused && !v.ended && v.volume > 0.01) anyUnmuted = true;
    });
    if (anyUnmuted !== videoDucked) {
      videoDucked = anyUnmuted;
      if (IS_TOUCH_MOBILE) syncMobilePlayback();
      else syncGain(0.35);
    }
  }
  for (const ev of ['play', 'pause', 'ended', 'volumechange']) {
    document.addEventListener(ev, checkVideos, true);
  }

  document.addEventListener('visibilitychange', () => {
    if (IS_TOUCH_MOBILE) {
      if (document.hidden && htmlAudio) { try { htmlAudio.pause(); } catch {} }
      else if (!document.hidden && !userMuted && eventActive) syncMobilePlayback();
      return;
    }
    if (!ctx) return;
    if (document.hidden) syncGain(0.3);
    else if (!userMuted && eventActive) {
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      syncGain(0.8);
    }
  });

  if (!userMuted && eventActive) {
    tryUnlock();
  }

  return {
    getState,
    unlock: tryUnlock,
    onStateChange(fn) { listeners.add(fn); fn(getState()); return () => listeners.delete(fn); },
    toggle() {
      const st = getState();
      // Critical fix: if unmuted & waiting for gesture ("♪ Sound (Tap)"), tapping the button MUST unlock & play — never mute!
      if (!userMuted && (!st.playing || (lastGestureUnlockMs > 0 && performance.now() - lastGestureUnlockMs < 350))) {
        lastGestureUnlockMs = 0;
        tryUnlock();
        return true;
      }
      userMuted = !userMuted;
      if (!userMuted) tryUnlock();
      else {
        if (IS_TOUCH_MOBILE) syncMobilePlayback();
        else syncGain(0.35);
        notify();
      }
      return !userMuted;
    },
    setMuted(m) {
      userMuted = !!m;
      if (!userMuted) tryUnlock();
      else {
        if (IS_TOUCH_MOBILE) syncMobilePlayback();
        else syncGain(0.35);
        notify();
      }
    },
    async setTrack(newId) {
      if (!IYUANA_TRACKS.some(t => t.id === newId)) return;
      trackId = newId;
      userMuted = false;
      if (IS_TOUCH_MOBILE) {
        syncMobilePlayback();
        return;
      }
      await startTrack(trackId, 0.9);
      if (ctx && ctx.state !== 'running') { try { await ctx.resume(); } catch {} }
      notify();
    },
    setActiveEvent(slug) {
      const shouldPlay = slug === 'iyuana';
      if (shouldPlay === eventActive) return;
      eventActive = shouldPlay;
      if (IS_TOUCH_MOBILE) {
        syncMobilePlayback();
        return;
      }
      if (!eventActive) {
        syncGain(0.5);
        setTimeout(() => { if (!eventActive && ctx && ctx.state === 'running') stopSource(); }, 550);
      } else if (!userMuted) {
        tryUnlock();
      }
      notify();
    },
  };
}
