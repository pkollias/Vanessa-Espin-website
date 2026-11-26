// Locked Herencia Viva L05 Opener ("Herencia Viva: / Threads of Memory") for the 1862 Flushing Town Hall film.
// Synced 1:1 with Pavlos's saved Logo Lab setup (`reference/vision-board/herencia-logo-lab.json`, 2026-11-25T22:12:11Z):
//   xPct: 6.4, yPct: 76.3, align: 'left', widthVw: 48, ink: 'charcoal',
//   surface: 'rack-focus' (0.48), animIn: 'descend-whisper' (0.20..1.05s),
//   animOut: 'soft-down' (2.20..3.05s), stagger: 0.14s.
//
// Pre-walk prelude duration `T_LOGO_PRELUDE = 3.25s`:
//   Row 1 & Row 2 finish disappearing at ~3.09s and rack-focus clears completely by 3.23s,
//   handing off seamlessly into the existing corridor walk at t = 3.25s!

export const T_LOGO_PRELUDE = 3.25;

export const LOCKED_LOGO_CFG = {
  xPct: 6.4,
  yPct: 76.3,
  align: 'left',
  widthVw: 48.0,
  ink: 'charcoal',
  surface: 'rack-focus',
  surfaceStrength: 0.48,
  animIn: 'descend-whisper',
  animOut: 'soft-down',
  in0: 0.20,
  in1: 1.05,
  out0: 2.20,
  out1: 3.05,
  stagger: 0.14,
};

const INKS = {
  charcoal:  { r1: '#1a1714', r2: '#221e1a', shadow: '0 1px 10px rgba(252, 249, 242, 0.32)' },
  forest:    { r1: '#1d2d25', r2: '#24382e', shadow: '0 1px 10px rgba(250, 248, 240, 0.28)' },
  dual:      { r1: '#2f4538', r2: '#1a1714', shadow: '0 1px 10px rgba(252, 249, 242, 0.30)' },
  espresso:  { r1: '#2d2119', r2: '#3a2a1f', shadow: '0 1px 10px rgba(252, 248, 240, 0.30)' },
  chalk:     { r1: '#faf6ee', r2: '#f6f1e6', shadow: '0 2px 18px rgba(18, 15, 12, 0.42)' },
  champagne: { r1: '#f0e4cd', r2: '#f7efe0', shadow: '0 2px 20px rgba(18, 15, 12, 0.46)' },
};

const ROW1_MASK = '/herencia-hallway/assets/title/lockups/l05/row-1-white.png';
const ROW2_MASK = '/herencia-hallway/assets/title/lockups/l05/row-2-white.png';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => {
  const t = clamp((x - a) / Math.max(1e-4, b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOutCubic = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOutCubic = t => {
  const u = clamp(t, 0, 1);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};

function injectStyles() {
  if (document.getElementById('hv-logo-opener-css')) return;
  const st = document.createElement('style');
  st.id = 'hv-logo-opener-css';
  st.textContent = `
    .hv-opener-veil {
      position: fixed; inset: 0; z-index: 4; pointer-events: none;
      opacity: 0; visibility: hidden; will-change: opacity, transform;
    }
    .hv-opener-layer {
      position: fixed; inset: 0; z-index: 5; pointer-events: none;
      visibility: hidden;
    }
    .hv-opener-anchor {
      position: absolute;
      transform: translate3d(0%, -50%, 0);
      will-change: transform, opacity;
      pointer-events: none;
    }
    .hv-opener-backing {
      position: absolute; inset: -34% -18%; border-radius: 999px;
      pointer-events: none; opacity: 0; z-index: -1;
    }
    .hv-opener-stack {
      position: relative; width: 100%;
      display: flex; flex-direction: column; align-items: flex-start;
    }
    .hv-opener-row {
      position: relative; width: 100%; overflow: visible;
    }
    .hv-opener-row.clip-mask {
      overflow: hidden;
    }
    .hv-opener-row.r1-wrap {
      width: 56.763%;
      margin-left: 0.925%;
      margin-bottom: 2.775%;
    }
    .hv-opener-plate {
      display: block; width: 100%;
      -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
      -webkit-mask-size: 100% 100%; mask-size: 100% 100%;
      -webkit-mask-position: center; mask-position: center;
      will-change: transform, opacity, filter;
    }
    .hv-opener-plate.r1 {
      aspect-ratio: 491 / 66;
      background-color: #1a1714;
      -webkit-mask-image: url('${ROW1_MASK}');
      mask-image: url('${ROW1_MASK}');
    }
    .hv-opener-plate.r2 {
      aspect-ratio: 865 / 125;
      background-color: #221e1a;
      -webkit-mask-image: url('${ROW2_MASK}');
      mask-image: url('${ROW2_MASK}');
    }
  `;
  document.head.appendChild(st);
}

export function createHerenciaLogoOpener(canvasEl, opts = {}) {
  const enabled = opts.enabled !== false;
  const cfg = { ...LOCKED_LOGO_CFG, ...(opts.cfg || {}) };

  if (!enabled) {
    return {
      cfg,
      preludeDuration: T_LOGO_PRELUDE,
      syncSavedConfig: async () => cfg,
      warm: async () => {},
      update: () => {},
      destroy: () => {},
    };
  }

  injectStyles();

  const veil = document.createElement('div');
  veil.className = 'hv-opener-veil';
  veil.setAttribute('aria-hidden', 'true');

  const layer = document.createElement('div');
  layer.className = 'hv-opener-layer';
  layer.setAttribute('aria-label', 'Herencia Viva: Threads of Memory');

  const anchor = document.createElement('div');
  anchor.className = 'hv-opener-anchor';

  const localBacking = document.createElement('div');
  localBacking.className = 'hv-opener-backing';

  const stack = document.createElement('div');
  stack.className = 'hv-opener-stack';

  const r1Wrap = document.createElement('div');
  r1Wrap.className = 'hv-opener-row r1-wrap';
  const r1Plate = document.createElement('div');
  r1Plate.className = 'hv-opener-plate r1';
  r1Wrap.appendChild(r1Plate);

  const r2Wrap = document.createElement('div');
  r2Wrap.className = 'hv-opener-row';
  const r2Plate = document.createElement('div');
  r2Plate.className = 'hv-opener-plate r2';
  r2Wrap.appendChild(r2Plate);

  stack.appendChild(r1Wrap);
  stack.appendChild(r2Wrap);
  anchor.appendChild(localBacking);
  anchor.appendChild(stack);
  layer.appendChild(anchor);

  document.body.appendChild(veil);
  document.body.appendChild(layer);

  let isHidden = true;
  let lastBlurStr = '';

  function hideAll() {
    if (isHidden) return;
    isHidden = true;
    layer.style.visibility = 'hidden';
    veil.style.visibility = 'hidden';
    veil.style.opacity = '0';
    localBacking.style.opacity = '0';
    if (canvasEl && lastBlurStr !== '') {
      canvasEl.style.filter = '';
      lastBlurStr = '';
    }
  }

  function evalRow(rowIdx, t) {
    const st = cfg.stagger;
    const inDur = Math.max(0.15, cfg.in1 - cfg.in0);
    const outDur = Math.max(0.18, cfg.out1 - cfg.out0);
    const rIn0 = cfg.in0 + rowIdx * st;
    const rIn1 = rIn0 + inDur;
    const rOut0 = cfg.out0 + rowIdx * (st * 0.55);
    const rOut1 = rOut0 + outDur;

    const pIn = clamp((t - rIn0) / Math.max(1e-4, rIn1 - rIn0), 0, 1);
    const pOut = clamp((t - rOut0) / Math.max(1e-4, rOut1 - rOut0), 0, 1);
    const eIn = easeOutCubic(pIn);
    const eOut = easeInOutCubic(pOut);

    let op = 1.0, dx = 0, dy = 0, sc = 1.0, bl = 0, clip = '';

    switch (cfg.animIn) {
      case 'mask-rise':
        op *= ss(0.0, 0.35, pIn);
        dy += (1 - eIn) * 115;
        break;
      case 'focus-pull':
        op *= ss(0.0, 0.72, pIn);
        sc *= lerp(1.045, 1.0, eIn);
        bl += (1 - eIn) * 9.5;
        break;
      case 'wipe-ltr': {
        const w = clamp(eIn * 104, 0, 100);
        op *= ss(0.0, 0.25, pIn);
        clip = `inset(-25% ${(100 - w).toFixed(2)}% -25% -4%)`;
        dx += -(1 - eIn) * 12;
        break;
      }
      case 'breath-settle':
        op *= ss(0.0, 0.85, pIn);
        dy += (1 - eIn) * 18;
        sc *= lerp(1.035, 1.0, eIn);
        bl += (1 - eIn) * 1.2;
        break;
      case 'hairline-split':
        op *= ss(0.05, 0.65, pIn);
        dx += -(1 - eIn) * 24;
        break;
      case 'instant-hold':
        break;
      case 'descend-whisper':
      default:
        op *= ss(0.0, 0.80, pIn);
        dy += -(1 - eIn) * 26.0;
        bl += (1 - eIn) * 2.2;
        break;
    }

    switch (cfg.animOut) {
      case 'curtain-lift':
        op *= (1 - ss(0.18, 0.92, pOut));
        dy -= eOut * 90;
        break;
      case 'optical-dissolve':
        op *= (1 - ss(0.0, 0.95, pOut));
        dy -= eOut * 22;
        sc *= lerp(1.0, 1.035, eOut);
        bl += eOut * 6.5;
        break;
      case 'walkthrough-3d':
        op *= (1 - ss(0.12, 0.96, pOut));
        sc *= lerp(1.0, 1.28, eOut);
        bl += eOut * 8.5;
        break;
      case 'parallax-left':
        op *= (1 - ss(0.05, 0.95, pOut));
        dx -= eOut * 68;
        bl += eOut * 2.4;
        break;
      case 'parallax-right':
        op *= (1 - ss(0.05, 0.95, pOut));
        dx += eOut * 68;
        bl += eOut * 2.4;
        break;
      case 'mask-tuck':
        op *= (1 - ss(0.55, 1.0, pOut));
        dy += eOut * 115;
        break;
      case 'ink-evaporate':
        op *= (1 - ss(0.0, 0.98, pOut));
        dy -= eOut * 10;
        sc *= lerp(1.0, 1.02, eOut);
        bl += eOut * 5.0;
        break;
      case 'soft-down':
      default:
        op *= (1 - ss(0.0, 0.95, pOut));
        dy += eOut * 28.0;
        bl += eOut * 2.2;
        break;
    }

    const usePctY = (cfg.animIn === 'mask-rise' && pIn < 1) || (cfg.animOut === 'mask-tuck' && pOut > 0);
    return { op: clamp(op, 0, 1), dx, dy, usePctY, sc, bl, clip };
  }

  function applyRowEl(el, a, ik) {
    el.style.opacity = a.op.toFixed(3);
    const yStr = a.usePctY ? `${a.dy.toFixed(2)}%` : `${a.dy.toFixed(2)}px`;
    el.style.transform = `translate3d(${a.dx.toFixed(2)}px, ${yStr}, 0) scale(${a.sc.toFixed(4)})`;
    const filtParts = [];
    if (a.bl > 0.08) filtParts.push(`blur(${a.bl.toFixed(2)}px)`);
    if (ik.shadow && cfg.surface !== 'green-veil' && cfg.surface !== 'linen-veil') {
      filtParts.push(`drop-shadow(${ik.shadow})`);
    }
    el.style.filter = filtParts.join(' ');
    el.style.clipPath = a.clip || 'none';
  }

  function update(t, active = true) {
    const maxEnd = Math.max(T_LOGO_PRELUDE, cfg.out1 + Math.max(0.20, cfg.stagger * 0.55 + 0.18));
    if (!active || t < 0 || t >= maxEnd) {
      hideAll();
      return;
    }

    if (isHidden) {
      isHidden = false;
      layer.style.visibility = 'visible';
      veil.style.visibility = 'visible';
    }

    const ik = INKS[cfg.ink] || INKS.charcoal;
    r1Plate.style.backgroundColor = ik.r1;
    r2Plate.style.backgroundColor = ik.r2;

    const needClip = (cfg.animIn === 'mask-rise' || cfg.animOut === 'mask-tuck');
    r1Wrap.classList.toggle('clip-mask', needClip);
    r2Wrap.classList.toggle('clip-mask', needClip);

    // Exact 1:1 placement & alignment matching Logo Lab (`xPct: 6.4, yPct: 76.3, align: 'left', widthVw: 48`)
    const isPhone = window.innerWidth < 680 || window.innerWidth < window.innerHeight;
    const effW = isPhone ? Math.min(84, cfg.widthVw * 1.95) : cfg.widthVw;
    const tx = cfg.align === 'left' ? '0%' : (cfg.align === 'right' ? '-100%' : '-50%');

    anchor.style.left = `${cfg.xPct}%`;
    anchor.style.top = `${cfg.yPct}%`;
    anchor.style.width = `${effW}%`;
    anchor.style.transform = `translate3d(${tx}, -50%, 0)`;

    applyRowEl(r1Plate, evalRow(0, t), ik);
    applyRowEl(r2Plate, evalRow(1, t), ik);

    const envIn = (cfg.surface === 'green-veil' || cfg.surface === 'linen-veil' || cfg.surface === 'rack-focus')
      ? 1.0
      : ss(Math.max(0, cfg.in0 - 0.1), cfg.in1, t);
    const envOut = 1 - ss(cfg.out0, cfg.out1 + 0.18, t);
    const veilAlpha = clamp(envIn * envOut * cfg.surfaceStrength, 0, 1);

    let blurPx = 0;
    veil.style.opacity = '0';
    veil.style.transform = 'none';
    veil.style.background = 'none';
    localBacking.style.opacity = '0';
    localBacking.style.background = 'none';

    if (cfg.surface === 'rack-focus') {
      blurPx = veilAlpha * 10.5;
      veil.style.background = 'radial-gradient(ellipse 68% 60% at 50% 48%, rgba(250, 248, 242, 0.82) 0%, rgba(246, 242, 234, 0.25) 66%, rgba(246, 242, 234, 0) 100%)';
      veil.style.opacity = (veilAlpha * 0.45).toFixed(3);
    } else if (cfg.surface === 'plaster-halo') {
      localBacking.style.background = 'radial-gradient(ellipse 62% 68% at 50% 50%, rgba(251, 248, 242, 0.94) 0%, rgba(248, 244, 236, 0.58) 48%, rgba(248, 244, 236, 0) 82%)';
      localBacking.style.opacity = veilAlpha.toFixed(3);
    } else if (cfg.surface === 'dark-vignette') {
      localBacking.style.background = 'radial-gradient(ellipse 64% 72% at 50% 50%, rgba(18, 16, 14, 0.58) 0%, rgba(18, 16, 14, 0.28) 52%, rgba(18, 16, 14, 0) 84%)';
      localBacking.style.opacity = veilAlpha.toFixed(3);
    } else if (cfg.surface === 'linen-veil') {
      veil.style.background = 'linear-gradient(180deg, rgba(247,243,234,0.97) 0%, rgba(240,234,221,0.94) 100%)';
      veil.style.opacity = veilAlpha.toFixed(3);
    } else if (cfg.surface === 'green-veil') {
      veil.style.background = 'linear-gradient(180deg, #4b5d4e 0%, #3d4d40 100%)';
      veil.style.opacity = veilAlpha.toFixed(3);
    }

    if (canvasEl) {
      const blurStr = blurPx > 0.08 ? `blur(${blurPx.toFixed(2)}px)` : '';
      if (blurStr !== lastBlurStr) {
        canvasEl.style.filter = blurStr;
        lastBlurStr = blurStr;
      }
    }
  }

  async function syncSavedConfig() {
    if (opts.cfg) return cfg;
    try {
      const r = await fetch('/api/herencia-logo-lab');
      if (r.ok) {
        const j = await r.json();
        if (j?.custom?.cfg) Object.assign(cfg, j.custom.cfg);
      }
    } catch {}
    return cfg;
  }

  async function warm() {
    const preload = (src) => new Promise((res) => {
      const im = new Image();
      im.onload = () => res();
      im.onerror = () => res();
      im.src = src;
    });
    await Promise.all([preload(ROW1_MASK), preload(ROW2_MASK), syncSavedConfig()]);
  }

  function destroy() {
    hideAll();
    veil.remove();
    layer.remove();
  }

  return {
    cfg,
    get preludeDuration() {
      return Math.max(T_LOGO_PRELUDE, +(cfg.out1 + cfg.stagger * 0.55 + 0.16).toFixed(2));
    },
    syncSavedConfig,
    warm,
    update,
    destroy,
  };
}
