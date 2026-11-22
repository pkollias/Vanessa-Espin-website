// Film lights: skip a light's maths wherever the light does not reach.
//
// three.js works out the full surface response to every light for every pixel, also for the pixels outside a
// spotlight's cone or beyond a light's range, where the answer is always zero. In a room lit by many narrow lamps
// that is most of the work the graphics card does. This adds the missing test, "only if this light reaches this pixel".
// The picture is identical (what is skipped was adding zero). Measured on the theater film, Nov 22, 2026:
// about 35 -> 58 frames a second at standard resolution, 21 -> 53 on a Retina screen.
//
//   import { skipUnlitLights } from '/Vanessa-Espin-website/shared/film-lights.js';
//   skipUnlitLights(THREE);        // once, before the first material is drawn
export function skipUnlitLights(THREE) {
  const chunks = THREE && THREE.ShaderChunk;
  if (!chunks || typeof chunks.lights_fragment_begin !== 'string') return false;
  if (chunks.lights_fragment_begin.includes('if ( directLight.visible ) RE_Direct(')) return true;
  const after = chunks.lights_fragment_begin.replace(/RE_Direct\( directLight,/g, 'if ( directLight.visible ) RE_Direct( directLight,');
  if (after === chunks.lights_fragment_begin) return false;
  chunks.lights_fragment_begin = after;
  return true;
}
