// Shared gapless WebAudio + iOS-native HTMLAudioElement ambient music controller for the Herencia Viva experience
// (Flushing Town Hall 3D corridor film + below-the-fold About & Media Salon + fullscreen media viewer).

export const HERENCIA_TRACKS = [
  { id: 'granados',  label: '♪ Granados — Danza Española XII: Arabesca ★',                  short: 'Arabesca ★',      src: '/herencia-hallway/audio/tracks/h10-granados-arabesca.m4a' },
  { id: 'ravel',     label: '♪ Ravel — Introduction & Allegro (Harp, Flute & Strings)',    short: 'Ravel Harp',      src: '/herencia-hallway/audio/tracks/h01-ravel-intro-allegro.m4a' },
  { id: 'moldau',    label: '♪ Smetana — The Moldau (Flutes → 26.5s Strings)',             short: 'Moldau',          src: '/herencia-hallway/audio/tracks/h04-smetana-moldau.m4a' },
  { id: 'respighi',  label: '♪ Respighi — Ancient Airs: Villanella (Oboe, Harp & Strings)', short: 'Villanella',     src: '/herencia-hallway/audio/tracks/h03-respighi-villanella.m4a' },
  { id: 'debussy',   label: '♪ Debussy — Danse sacrée (Strings & Concert Harp)',           short: 'Debussy Harp',    src: '/herencia-hallway/audio/tracks/h02-debussy-danse-sacree.m4a' },
  { id: 'sarabande', label: '♪ Grieg — Holberg Suite: Sarabande (Chamber Strings)',        short: 'Grieg Strings',   src: '/herencia-hallway/audio/tracks/h05-grieg-holberg-sarabande.m4a' },
  { id: 'morning',   label: '♪ Grieg — Morning Mood (Flute, Oboe & Strings)',              short: 'Morning Mood',    src: '/herencia-hallway/audio/tracks/h06-grieg-morning-mood.m4a' },
  { id: 'vindsvept', label: '♪ Vindsvept — The Bridge to the Unseen (Celtic Fantasy)',     short: 'Fantasy Flute',   src: '/herencia-hallway/audio/tracks/h07-vindsvept-bridge-unseen.m4a' },
  { id: 'oblivion',  label: '♪ Scott Buckley — Beautiful Oblivion (GRIS Minimalism)',      short: 'Violin & Felt',   src: '/herencia-hallway/audio/tracks/h08-buckley-beautiful-oblivion.m4a' },
  { id: 'swan',      label: '♪ Saint-Saëns — Le Cygne / The Swan (Solo Cello)',            short: 'The Swan',        src: '/herencia-hallway/audio/tracks/h09-saint-saens-the-swan.m4a' },
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

export function createHerenciaAudio({ initialTrack = 'granados', initialEnabled = true, baseGain = 0.72 } = {}) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx && typeof Audio === 'undefined') return null;
  forcePlaybackSession();

  let trackId = HERENCIA_TRACKS.some(t => t.id === initialTrack) ? initialTrack : 'granados';
  let userMuted = !initialEnabled;
  let eventActive = true;
  let videoDucked = false;
  let ctx = null, gainNode = null, srcNode = null;
  let htmlAudio = null;
  let htmlAudioFromBridge = false;
  const localMobileAudio = new Map();
  let loadToken = 0;
  let trackLoading = false;
  const bufferCache = new Map();
  const listeners = new Set();
  const MOBILE_EVENTS = ['play', 'playing', 'pause', 'ended', 'error', 'abort'];

  function getParentAudioBridge() {
    try {
      if (window.parent && window.parent !== window && window.parent.location.origin === location.origin) {
        return window.parent.__herenciaAudioBridge || window.parent.__ayazamanaAudioBridge || window.parent.__iyuanaAudioBridge || null;
      }
    } catch {}
    return null;
  }

  function isHealthyMobileAudio(el) {
    try {
      return Boolean(
        el &&
        el.ownerDocument &&
        el.ownerDocument.defaultView &&
        !el.error &&
        el.networkState !== 3
      );
    } catch { return false; }
  }

  function notify() {
    const state = getState();
    for (const fn of listeners) { try { fn(state); } catch {} }
  }

  function getState() {
    if (IS_TOUCH_MOBILE) {
      const isPlaying = Boolean(isHealthyMobileAudio(htmlAudio) && !htmlAudio.paused && !htmlAudio.ended);
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

  function detachMobileAudioListeners(el) {
    if (!el) return;
    for (const ev of MOBILE_EVENTS) {
      try { el.removeEventListener(ev, notify); } catch {}
    }
  }

  function bindMobileAudioEl(el, fromBridge) {
    if (htmlAudio !== el) {
      if (htmlAudio) {
        detachMobileAudioListeners(htmlAudio);
        try { htmlAudio.pause(); } catch {}
      }
      htmlAudio = el;
      htmlAudioFromBridge = !!fromBridge;
      for (const ev of MOBILE_EVENTS) {
        htmlAudio.addEventListener(ev, notify);
      }
    }
    return htmlAudio;
  }

  function makeLocalMobileAudio(meta) {
    const el = new Audio(meta.src);
    el.loop = true;
    el.preload = 'auto';
    el.playsInline = true;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    try { el.volume = Math.min(1, Math.max(0, baseGain)); } catch {}
    return el;
  }

  function getOrCreateLocalMobileAudio(meta) {
    let el = localMobileAudio.get(meta.id) || null;
    if (!isHealthyMobileAudio(el)) {
      if (el) { try { el.pause(); } catch {} }
      el = makeLocalMobileAudio(meta);
      localMobileAudio.set(meta.id, el);
    }
    return el;
  }

  function ensureMobileAudio(id, forceLocal = false) {
    const meta = HERENCIA_TRACKS.find(t => t.id === id) || HERENCIA_TRACKS[0];
    const bridge = getParentAudioBridge();
    const mKey = `herencia-viva:${meta.id}`;
    const bridged = !forceLocal ? (bridge?.mobileAudio?.get(mKey) || null) : null;
    if (bridged && isHealthyMobileAudio(bridged)) {
      return bindMobileAudioEl(bridged, true);
    }
    // Keep iframe-created <audio> strictly local — NEVER store an iframe-owned element in parent's bridge.mobileAudio,
    // because destroying this iframe on navigation detaches its ownerDocument and permanently breaks re-entry playback!
    const el = getOrCreateLocalMobileAudio(meta);
    return bindMobileAudioEl(el, false);
  }

  function pauseBridgedIfAny(id) {
    const meta = HERENCIA_TRACKS.find(t => t.id === id) || HERENCIA_TRACKS[0];
    const bridge = getParentAudioBridge();
    const mKey = `herencia-viva:${meta.id}`;
    const bridged = bridge?.mobileAudio?.get(mKey) || null;
    if (bridged && bridged !== htmlAudio && !bridged.paused) {
      try { bridged.pause(); } catch {}
    }
  }

  function syncMobilePlayback(fromGesture = false, gestureDoc = document) {
    if (!IS_TOUCH_MOBILE) return;
    forcePlaybackSession();
    const meta = HERENCIA_TRACKS.find(t => t.id === trackId) || HERENCIA_TRACKS[0];
    const bridge = getParentAudioBridge();
    const mKey = `herencia-viva:${meta.id}`;
    const bridged = bridge?.mobileAudio?.get(mKey) || null;
    const bridgedHealthy = isHealthyMobileAudio(bridged);

    if (userMuted || !eventActive || videoDucked) {
      if (htmlAudio && !htmlAudio.paused) { try { htmlAudio.pause(); } catch {} }
      if (bridged && !bridged.paused) { try { bridged.pause(); } catch {} }
      notify();
      return;
    }

    // If the parent-owned bridged <audio> is already actively playing, attach seamlessly with 0ms interruption.
    // If playback must start from a tap inside THIS iframe (gestureDoc === document) and the bridged element is paused
    // and owned by the parent document, use our same-document local <audio> SYNCHRONOUSLY inside the tap handler —
    // iOS WebKit rejects cross-document play() from an iframe gesture and drops gesture activation before .catch()!
    const preferLocalForIframeGesture = Boolean(
      fromGesture &&
      gestureDoc === document &&
      bridgedHealthy &&
      bridged.ownerDocument !== document &&
      (bridged.paused || bridged.ended)
    );
    if (preferLocalForIframeGesture) {
      try { bridged.pause(); } catch {}
    }
    const el = ensureMobileAudio(trackId, preferLocalForIframeGesture);
    if (!htmlAudioFromBridge) pauseBridgedIfAny(trackId);

    el.preload = 'auto';
    el.muted = false;
    try { el.volume = Math.min(1, Math.max(0, baseGain)); } catch {}
    if (el.paused || el.ended) {
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(notify).catch(notify);
      } else {
        notify();
      }
    } else {
      notify();
    }
  }

  function ensureContext() {
    if (!ctx) {
      const bridge = getParentAudioBridge();
      ctx = bridge?.ctx || new AudioCtx();
      gainNode = ctx.createGain();
      gainNode.gain.value = 0.0001;
      gainNode.connect(ctx.destination);
      ctx.addEventListener('statechange', () => {
        if (ctx.state === 'running' && !userMuted && eventActive && !srcNode && !trackLoading) {
          startTrack(trackId, 0.55);
        }
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
    const bridgeKey = `herencia:${id}`;
    if (bridge?.buffers?.has(bridgeKey)) {
      const p = bridge.buffers.get(bridgeKey);
      bufferCache.set(id, p);
      return p;
    }
    const meta = HERENCIA_TRACKS.find(t => t.id === id) || HERENCIA_TRACKS[0];
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
    trackLoading = true;
    ensureContext();
    let buf;
    try { buf = await fetchBuffer(id); } catch { if (tok === loadToken) trackLoading = false; return; }
    if (tok !== loadToken) return;
    trackLoading = false;
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

  async function tryUnlock(fromGesture = false, gestureDoc = document) {
    if (userMuted || !eventActive) return;
    forcePlaybackSession();
    if (IS_TOUCH_MOBILE) {
      syncMobilePlayback(fromGesture, gestureDoc);
      return;
    }
    ensureContext();
    // Never await ctx.resume() before startTrack(): on a hard reload (Ctrl+R) where autoplay is suspended,
    // resume() stays pending until a user gesture — we still pre-fetch & attach srcNode so sound starts at 0ms!
    if (ctx.state !== 'running') {
      unlockWebAudioSync(ctx);
      ctx.resume().then(() => { syncGain(0.45); notify(); }).catch(() => {});
    }
    if (!srcNode && !trackLoading) {
      await startTrack(trackId, 0.55);
    } else if (srcNode) {
      syncGain(0.45);
    }
    notify();
  }

  let lastGestureUnlockMs = 0;
  const unlockEvents = ['touchend', 'pointerup', 'click', 'keydown'];
  const onGesture = (e) => {
    if (userMuted || !eventActive) return;
    if (e?.target?.closest?.('#bottomSoundBtn, #cleanSound, #soundBtn, #soundWakePill, [data-sound-toggle], #filmReturn, #filmAbout, #brandHome, #aboutBtn')) return;
    const st = getState();
    if (!st.playing) {
      lastGestureUnlockMs = performance.now();
      tryUnlock(true, e?.target?.ownerDocument || document);
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

  window.addEventListener('pageshow', (e) => {
    if (e.persisted && !userMuted && eventActive) tryUnlock(false);
  });

  window.addEventListener('pagehide', () => {
    for (const ev of unlockEvents) {
      window.removeEventListener(ev, onGesture, { capture: true });
      try {
        if (window.parent && window.parent !== window && window.parent.location.origin === location.origin) {
          window.parent.removeEventListener(ev, onGesture, { capture: true });
        }
      } catch {}
    }
    const bridge = getParentAudioBridge();
    const meta = HERENCIA_TRACKS.find(t => t.id === trackId) || HERENCIA_TRACKS[0];
    const mKey = `herencia-viva:${meta.id}`;
    detachMobileAudioListeners(htmlAudio);
    for (const localEl of localMobileAudio.values()) {
      try { localEl.pause(); } catch {}
    }
    if (htmlAudio && (!htmlAudioFromBridge || bridge?.activeMobileKey !== mKey)) {
      try { htmlAudio.pause(); } catch {}
    }
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
      if (document.hidden) {
        if (htmlAudio) { try { htmlAudio.pause(); } catch {} }
        pauseBridgedIfAny(trackId);
      } else if (!userMuted && eventActive) {
        syncMobilePlayback(false);
      }
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
    tryUnlock(false);
  }

  return {
    getState,
    unlock: (gestureDoc = document) => tryUnlock(true, gestureDoc),
    onStateChange(fn) { listeners.add(fn); fn(getState()); return () => listeners.delete(fn); },
    toggle() {
      const st = getState();
      if (!userMuted && (!st.playing || (lastGestureUnlockMs > 0 && performance.now() - lastGestureUnlockMs < 350))) {
        lastGestureUnlockMs = 0;
        tryUnlock(true, document);
        return true;
      }
      userMuted = !userMuted;
      if (!userMuted) tryUnlock(true, document);
      else {
        if (IS_TOUCH_MOBILE) syncMobilePlayback(false);
        else syncGain(0.35);
        notify();
      }
      return !userMuted;
    },
    setMuted(m) {
      userMuted = !!m;
      if (!userMuted) tryUnlock(false);
      else {
        if (IS_TOUCH_MOBILE) syncMobilePlayback(false);
        else syncGain(0.35);
        notify();
      }
    },
    async setTrack(newId) {
      if (!HERENCIA_TRACKS.some(t => t.id === newId)) return;
      trackId = newId;
      userMuted = false;
      if (IS_TOUCH_MOBILE) {
        syncMobilePlayback(true, document);
        return;
      }
      await startTrack(trackId, 0.7);
      if (ctx && ctx.state !== 'running') { try { await ctx.resume(); } catch {} }
      notify();
    },
    setActiveEvent(slug) {
      const shouldPlay = slug === 'herencia-viva';
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
