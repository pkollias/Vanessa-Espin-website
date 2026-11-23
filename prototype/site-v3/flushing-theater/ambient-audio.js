// Shared gapless WebAudio ambient music & concert-hall soundscape controller for the Ayazamana experience
// (Flushing Town Hall 3D theater film + below-the-fold About & Media Salon + fullscreen media viewer).

export const AYAZAMANA_TRACKS = [
  { id: 'sanjuanito', label: '♪ Sanjuanito — Atlas: Ecuador ★',       short: 'Sanjuanito',    src: '/Vanessa-Espin-website/flushing-theater/assets/audio/sanjuanito-ecuador.m4a' },
  { id: 'canyon',     label: '♪ Solo Concert Hall Quena',             short: 'Solo Quena',    src: '/Vanessa-Espin-website/flushing-theater/assets/audio/canyon-quena.m4a' },
  { id: 'condor',     label: '♪ Andean Ensemble: Charango & Quena',   short: 'Ensemble',      src: '/Vanessa-Espin-website/flushing-theater/assets/audio/andean-ensemble.m4a' },
  { id: 'quena',      label: '♪ Nocturnal Quena & Panpipe Choir',     short: 'Quena Choir',   src: '/Vanessa-Espin-website/flushing-theater/assets/audio/quena-hall.m4a' },
  { id: 'sikuri',     label: '♪ Bombo Heartbeat & Bamboo Quena',      short: 'Bombo & Flute', src: '/Vanessa-Espin-website/flushing-theater/assets/audio/bombo-panpipe.m4a' },
];

export function createAyazamanaAudio({ initialTrack = 'sanjuanito', initialEnabled = true, baseGain = 0.72 } = {}) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  let trackId = AYAZAMANA_TRACKS.some(t => t.id === initialTrack) ? initialTrack : 'sanjuanito';
  let userMuted = !initialEnabled;
  let eventActive = true;
  let videoDucked = false;
  let ctx = null, gainNode = null, srcNode = null;
  let loadToken = 0;
  const bufferCache = new Map();
  const listeners = new Set();

  // Reuse an already-unlocked AudioContext & pre-decoded buffers from same-origin parent (landing-v3)
  // so clicking "Experience the Event" starts audio instantaneously at 0.0s with zero autoplay block!
  function getParentAudioBridge() {
    try {
      if (window.parent && window.parent !== window && window.parent.location.origin === location.origin) {
        return window.parent.__ayazamanaAudioBridge || window.parent.__iyuanaAudioBridge || null;
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
    const bridgeKey = `ayazamana:${id}`;
    if (bridge?.buffers?.has(bridgeKey)) {
      const p = bridge.buffers.get(bridgeKey);
      bufferCache.set(id, p);
      return p;
    }
    const meta = AYAZAMANA_TRACKS.find(t => t.id === id) || AYAZAMANA_TRACKS[0];
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

  // Ensure audio stops cleanly if the iframe is unloaded (e.g., returning to Landing Page or switching events)
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
      if (!AYAZAMANA_TRACKS.some(t => t.id === newId)) return;
      trackId = newId;
      userMuted = false;
      await startTrack(trackId, 0.7);
      if (ctx && ctx.state === 'suspended') { try { await ctx.resume(); } catch {} }
      notify();
    },
    setActiveEvent(slug) {
      const shouldPlay = slug === 'ayazamana';
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
