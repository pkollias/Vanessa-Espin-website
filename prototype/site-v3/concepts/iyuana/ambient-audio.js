// Shared gapless WebAudio ambient soundscape controller for the whole Iyuana experience
// (3D gallery walk + below-the-fold About & Media Salon + fullscreen media viewer).

export const IYUANA_TRACKS = [
  { id: 'chant',  label: '♪ Forest + Amazonian Chant ★', short: 'Chant',  src: '/Vanessa-Espin-website/concepts/iyuana/assets/audio/forest-chant.m4a' },
  { id: 'forest', label: '♪ Pure Amazonian Night Forest', short: 'Forest', src: '/Vanessa-Espin-website/concepts/iyuana/assets/audio/amazon-forest.m4a' },
  { id: 'flute',  label: '♪ Forest + Ceremonial Flute',   short: 'Flute',  src: '/Vanessa-Espin-website/concepts/iyuana/assets/audio/forest-flute.m4a' },
];

export function createIyuanaAudio({ initialTrack = 'chant', initialEnabled = true, baseGain = 0.72 } = {}) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  let trackId = IYUANA_TRACKS.some(t => t.id === initialTrack) ? initialTrack : 'chant';
  let userMuted = !initialEnabled;
  let eventActive = true;
  let videoDucked = false;
  let ctx = null, gainNode = null, srcNode = null;
  let loadToken = 0;
  const bufferCache = new Map();
  const listeners = new Set();

  // Reuse an already-unlocked AudioContext & pre-decoded buffers from same-origin parent (landing-v3)
  // so clicking "Experience the Event" starts audio instantaneously with zero autoplay block or decode lag!
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
    // Play cleanly from the exact beginning (0.0s) and loop seamlessly
    s.start(0, 0);
    srcNode = s;
    syncGain(fadeSec);
    notify();
  }

  async function tryUnlock() {
    if (userMuted || !eventActive) return;
    ensureContext();
    // Kick off fetch + decode in parallel with resume() so audio starts with 0ms wait once unlocked
    const startP = !srcNode ? startTrack(trackId, 0.55) : null;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
    if (startP) await startP;
    else syncGain(0.45);
    notify();
  }

  // Unlock on first user interaction anywhere in this window (or same-origin parent) if browser suspended autoplay
  const unlockEvents = ['pointerdown', 'click', 'keydown', 'touchstart'];
  const onGesture = () => {
    if (!userMuted && eventActive && (!ctx || ctx.state !== 'running' || !srcNode)) {
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

  // Ensure audio stops cleanly if the iframe is unloaded (e.g., returning to Landing Page or switching to Herencia Viva)
  window.addEventListener('pagehide', () => {
    stopSource();
    if (gainNode) { try { gainNode.disconnect(); } catch {} }
  });

  // Duck smoothly if any unmuted <video> plays in the media salon / carousel
  function checkVideos() {
    let anyUnmuted = false;
    document.querySelectorAll('video').forEach(v => {
      if (!v.muted && !v.paused && !v.ended && v.volume > 0.01) anyUnmuted = true;
    });
    if (anyUnmuted !== videoDucked) {
      videoDucked = anyUnmuted;
      syncGain(0.35);
    }
  }
  for (const ev of ['play', 'pause', 'ended', 'volumechange']) {
    document.addEventListener(ev, checkVideos, true);
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) syncGain(0.3);
    else if (!userMuted && eventActive) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      syncGain(0.8);
    }
  });

  // Start immediately if allowed
  if (!userMuted && eventActive) {
    tryUnlock();
  }

  return {
    getState,
    onStateChange(fn) { listeners.add(fn); fn(getState()); return () => listeners.delete(fn); },
    toggle() {
      userMuted = !userMuted;
      if (!userMuted) tryUnlock();
      else { syncGain(0.35); notify(); }
      return !userMuted;
    },
    setMuted(m) {
      userMuted = !!m;
      if (!userMuted) tryUnlock();
      else { syncGain(0.35); notify(); }
    },
    async setTrack(newId) {
      if (!IYUANA_TRACKS.some(t => t.id === newId)) return;
      trackId = newId;
      userMuted = false;
      await startTrack(trackId, 0.9);
      if (ctx && ctx.state === 'suspended') { try { await ctx.resume(); } catch {} }
      notify();
    },
    setActiveEvent(slug) {
      const shouldPlay = slug === 'iyuana';
      if (shouldPlay === eventActive) return;
      eventActive = shouldPlay;
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
