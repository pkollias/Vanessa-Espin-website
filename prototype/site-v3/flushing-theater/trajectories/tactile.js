import * as THREE from 'three';

/**
 * Zero-VRAM World-Space Tactile Material Upgrades (`+0 KB` network, `-26 MB` GPU VRAM after disposing dead GLB floor maps).
 * Controlled live by a single shared uniform `uTex.value` (`1.0` = Tactile ON, `0.0` = Original Base) with zero shader recompiles.
 */
export function createTactileMaterialRig(initialEnabled = true) {
  const uTex = { value: initialEnabled ? 1.0 : 0.0 };
  const disposedUuids = new Set();
  let freedTexturesCount = 0;

  function disposeUnusedMap(tex) {
    if (!tex || !tex.isTexture || disposedUuids.has(tex.uuid)) return;
    disposedUuids.add(tex.uuid);
    tex.dispose();
    freedTexturesCount++;
  }

  // Shared GLSL hash/noise helpers injected into world-space shaders:
  const GLSL_NOISE_HELPERS = `
    uniform float uTex;
    varying vec3 vTacWorld;
    varying vec3 vTacObj;
    varying float vChairSeed;

    float tacHash2(vec2 p) {
      p = fract(p * vec2(443.8975, 397.2973));
      p += dot(p, p.yx + 19.19);
      return fract(p.x * p.y);
    }
    float tacNoise2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(tacHash2(i), tacHash2(i + vec2(1.0, 0.0)), f.x),
        mix(tacHash2(i + vec2(0.0, 1.0)), tacHash2(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    float tacFbm2(vec2 p) {
      float v = 0.50 * tacNoise2(p);
      p = p * 2.03 + vec2(17.1, 31.7);
      v += 0.30 * tacNoise2(p);
      p = p * 2.07 + vec2(43.3, 11.9);
      v += 0.20 * tacNoise2(p);
      return v;
    }
  `;

  function injectWorldVaryings(sh) {
    sh.uniforms.uTex = uTex;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTacWorld;\nvarying vec3 vTacObj;\nvarying float vChairSeed;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
vTacObj = transformed;
#ifdef USE_INSTANCING
  vTacWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
  vec3 tacInstOrig = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vChairSeed = fract(sin(dot(tacInstOrig.xz, vec2(127.1, 311.7))) * 43758.5453);
#else
  vTacWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vChairSeed = 0.5;
#endif`);
  }

  // 1. AISLE CARPET RUNNER (`runner_salmon`, X in [3.38..5.12]) & BOX CARPET (`carpet_olive`):
  function patchCarpet(mat, isRunner) {
    mat.onBeforeCompile = sh => {
      injectWorldVaryings(sh);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE_HELPERS}\nfloat gCarpHeight = 0.0;\nfloat gCarpRough = 0.92;`)
        .replace('#include <map_fragment>', `
          #include <map_fragment>
          if (uTex > 0.001) {
            vec2 wp = vTacWorld.xz;

            // ANISOTROPIC Footprint Filtering: separate X vs Z derivatives so longitudinal Wilton wool cords
            // stay razor-sharp 12m down the aisle at 15-deg grazing angles without shimmering!
            float uCord = wp.x * 105.0; // ~9.5mm heavy commercial Wilton wool warp ribs
            float vKnot = wp.y * 135.0; // ~7.4mm weft tuft knots
            float attX = 1.0 / (1.0 + fwidth(uCord) * 1.15);
            float attZ = 1.0 / (1.0 + fwidth(vKnot) * 1.25);

            float warpCord = sin(uCord * 6.2831853) * attX;
            // Herringbone / bouclé twist offset between adjacent warp cords:
            float cordIdx = floor(uCord);
            float twistPhase = mod(cordIdx, 2.0) * 1.5708;
            float weftTuft = sin(vKnot * 6.2831853 + twistPhase) * attZ;
            float fineBoucle = warpCord * 0.58 + weftTuft * 0.42;

            // Medium-scale tufted wool pile & heathering (resolved clearly from 1.5m to 9m away!):
            float tuftGrainX = (tacNoise2(vec2(wp.x * 58.0, wp.y * 18.0)) - 0.5) * 2.0 * (1.0 / (1.0 + fwidth(wp.x * 58.0) * 0.8));
            float suedeNap = tacFbm2(wp * vec2(6.5, 2.4)) - 0.5;
            float broadNap = tacFbm2(wp * vec2(1.9, 0.72) + vec2(4.2, 9.1)) - 0.5;

            ${isRunner ? `
              // Right-aisle runner bounds X in [3.38, 5.12] (center = 4.25m):
              float dEdge = min(wp.x - 3.38, 5.12 - wp.x);
              float bindingMask = 1.0 - smoothstep(0.036, 0.045, dEdge);
              float stitchGroove = exp(-pow((dEdge - 0.041) / 0.005, 2.0));
              float edgeLip = smoothstep(0.0, 0.018, dEdge);

              // Subtle woven jacquard fretwork along the inner border band (dEdge in [0.11..0.21]):
              float inBorderBand = smoothstep(0.095, 0.115, dEdge) * (1.0 - smoothstep(0.205, 0.225, dEdge));
              float jacquard = sin(wp.x * 190.0) * sin(wp.y * 190.0) * inBorderBand * attZ;

              // Subtle foot-traffic plush compression along center lane vs deeper pile near borders:
              float centerTraffic = exp(-pow((wp.x - 4.25) / 0.48, 2.0));

              // Deepen base wool root crevices slightly so highlight tufts pop with real 3D textile depth:
              float woolShade = 0.93
                + fineBoucle * 0.135 * (1.0 - 0.45 * bindingMask)
                + tuftGrainX * 0.115
                + suedeNap * 0.165
                + broadNap * 0.110
                + jacquard * 0.090
                + centerTraffic * 0.045;
              woolShade *= (0.72 + 0.28 * edgeLip) * (1.0 - 0.32 * stitchGroove);

              // Rich dyed wool color variation (warm rose-ochre tuft tips vs deeper wine-terracotta roots):
              vec3 woolColorShift = mix(vec3(0.92, 0.84, 0.83), vec3(1.06, 1.02, 0.99), clamp(0.5 + fineBoucle * 0.45 + suedeNap * 0.7, 0.0, 1.0));
              vec3 bindTint = mix(vec3(1.0), vec3(0.76, 0.68, 0.66), bindingMask);
              diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * woolShade * woolColorShift * bindTint, uTex);

              gCarpHeight = (fineBoucle * 0.85 + tuftGrainX * 0.65 + suedeNap * 0.55 + jacquard * 0.50 - stitchGroove * 1.8 + edgeLip * 1.1) * uTex;
              gCarpRough = clamp(0.92 - centerTraffic * 0.09 - bindingMask * 0.12 - fineBoucle * 0.06 + suedeNap * 0.08, 0.64, 0.99);
            ` : `
              float woolShade = 0.94 + fineBoucle * 0.14 + tuftGrainX * 0.12 + suedeNap * 0.17 + broadNap * 0.11;
              diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * woolShade, uTex);
              gCarpHeight = (fineBoucle * 0.85 + tuftGrainX * 0.65 + suedeNap * 0.55) * uTex;
              gCarpRough = clamp(0.94 - fineBoucle * 0.06 + suedeNap * 0.08, 0.74, 0.99);
            `}
          }
        `)
        .replace('#include <roughnessmap_fragment>', `
          #include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, gCarpRough, uTex);
        `)
        .replace('#include <normal_fragment_maps>', `
          #include <normal_fragment_maps>
          if (uTex > 0.001) {
            vec3 dPdx = dFdx(vViewPosition);
            vec3 dPdy = dFdy(vViewPosition);
            float dHdx = dFdx(gCarpHeight);
            float dHdy = dFdy(gCarpHeight);
            vec3 surfGrad = normalize(cross(dPdx, normal)) * dHdy + normalize(cross(normal, dPdy)) * dHdx;
            normal = normalize(normal - surfGrad * 0.052);
          }
        `)
        .replace('#include <dithering_fragment>', `
          if (uTex > 0.001) {
            // Grazing wool-pile retro-sheen modulated by nap tufts where spotlights skim the aisle:
            float ndv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
            float napSpark = 0.72 + 0.56 * tacNoise2(vTacWorld.xz * vec2(46.0, 16.0));
            float woolSheen = pow(1.0 - ndv, 3.0) * 0.24 * napSpark * uTex;
            float litMask = clamp(dot(gl_FragColor.rgb, vec3(0.333)) * 7.5, 0.0, 1.0);
            gl_FragColor.rgb += diffuseColor.rgb * woolSheen * litMask;
          }
          #include <dithering_fragment>
        `);
    };
    mat.needsUpdate = true;
  }

  // 2. HISTORIC LIME PLASTER (`plaster_cream`): 3D Raking Trowel Relief + Analytic Framed Poster & Wainscot Contact Shadows!
  function patchPlaster(mat) {
    mat.onBeforeCompile = sh => {
      injectWorldVaryings(sh);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE_HELPERS}\nfloat gPlasH = 0.0;`)
        .replace('#include <map_fragment>', `
          #include <map_fragment>
          {
            // Base mineral sand + upgraded dual-scale limewash trowel & analytic architectural contact shadows:
            float fineSand = (tacHash2(floor(vTacWorld.xy * 310.0 + vTacWorld.zy * 190.0)) - 0.5) * 0.045;
            float midTrowel = (sin(vTacWorld.x * 19.0 + sin(vTacWorld.y * 13.0)) * cos(vTacWorld.y * 17.0 + vTacWorld.z * 15.0)) * 0.018;
            float baseGrain = 1.0 + fineSand + midTrowel;

            if (uTex > 0.001) {
              vec2 pw = vTacWorld.xy + vec2(vTacWorld.z * 0.65, 0.0);
              float fwP = max(fwidth(pw.x * 95.0), fwidth(pw.y * 95.0));
              float attP = 1.0 / (1.0 + fwP * 1.4);
              float sandHi = (tacNoise2(pw * 95.0) - 0.5) * attP;
              float limeWash = tacFbm2(pw * 3.8) - 0.5;
              gPlasH = (sandHi * 0.75 + limeWash * 0.45 + midTrowel * 8.0) * uTex;

              // Analytic contact shadow + downward picture-light shadow behind poster_wall_E_doors (X in [1.778..2.602], Y in [1.138..2.163], Z ~ 12.76):
              float posterAO = 1.0;
              if (abs(vTacWorld.z - 12.76) < 0.14 && vTacWorld.x > 1.05 && vTacWorld.x < 3.30) {
                vec2 pCenter = vec2(2.190, 1.6505);
                vec2 pHalf = vec2(0.412, 0.5125);
                vec2 dTight = abs(vTacWorld.xy - pCenter) - pHalf;
                float sdfTight = length(max(dTight, 0.0)) + min(max(dTight.x, dTight.y), 0.0);
                // 9mm crisp frame-to-plaster contact crease:
                float tightCrease = 1.0 - 0.54 * (1.0 - smoothstep(0.0, 0.011, max(0.0, sdfTight)));

                // Soft downward drop-shadow cast by overhead brass picture-light (2.19, 2.58, 14.55):
                vec2 dCast = abs(vTacWorld.xy - (pCenter + vec2(0.0, -0.028))) - (pHalf + vec2(0.004, 0.006));
                float sdfCast = length(max(dCast, 0.0)) + min(max(dCast.x, dCast.y), 0.0);
                float castDrop = 1.0 - 0.34 * (1.0 - smoothstep(-0.005, 0.036, sdfCast));

                // Tiny escutcheon shadow under brass picture-light mount (2.19, 2.24):
                vec2 dLamp = abs(vTacWorld.xy - vec2(2.190, 2.228)) - vec2(0.085, 0.022);
                float sdfLamp = length(max(dLamp, 0.0)) + min(max(dLamp.x, dLamp.y), 0.0);
                float lampDrop = 1.0 - 0.30 * (1.0 - smoothstep(0.0, 0.020, max(0.0, sdfLamp)));

                // Subtle crease where plaster sits on top of Y=1.00m mahogany wainscot cap & beside door casings:
                float wainscotCrease = 1.0 - 0.28 * (1.0 - smoothstep(1.00, 1.022, vTacWorld.y)) * step(0.99, vTacWorld.y);
                posterAO = min(tightCrease, castDrop) * lampDrop * wainscotCrease;
              }

              float richGrain = 1.0 + sandHi * 0.055 + limeWash * 0.048 + midTrowel;
              diffuseColor.rgb *= mix(baseGrain, richGrain * posterAO, uTex);
            } else {
              diffuseColor.rgb *= baseGrain;
            }
          }
        `)
        .replace('#include <normal_fragment_maps>', `
          #include <normal_fragment_maps>
          if (uTex > 0.001) {
            vec3 dPdx = dFdx(vViewPosition);
            vec3 dPdy = dFdy(vViewPosition);
            vec3 surfGrad = normalize(cross(dPdx, normal)) * dFdy(gPlasH) + normalize(cross(normal, dPdy)) * dFdx(gPlasH);
            normal = normalize(normal - surfGrad * 0.018);
          }
        `);
    };
    mat.needsUpdate = true;
  }

  // 3. QUARTER-SAWN MAHOGANY WAINSCOT, SIDE BOXES & DOUBLE DOORS (`cherry_wood`, `dark_wainscot`):
  function patchWoodwork(mat, isDarkUntextured) {
    mat.onBeforeCompile = sh => {
      injectWorldVaryings(sh);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE_HELPERS}\nfloat gWoodH = 0.0;\nfloat gWoodRough = 0.42;`)
        .replace('#include <map_fragment>', `
          #include <map_fragment>
          if (uTex > 0.001) {
            // Orient wood grain naturally along vertical stiles vs horizontal rails/panels:
            vec2 wUv = vec2(vTacWorld.x + vTacWorld.z, vTacWorld.y);
            float isRail = step(0.82, abs(sin(vTacWorld.y * 5.2))) * step(vTacWorld.y, 1.05);
            vec2 grainCoord = mix(wUv * vec2(42.0, 5.5), wUv.yx * vec2(42.0, 5.5), isRail * 0.5);
            float fwW = max(fwidth(grainCoord.x), fwidth(grainCoord.y));
            float attW = 1.0 / (1.0 + fwW * 1.2);

            float ring = sin(grainCoord.x + tacFbm2(grainCoord * 0.22) * 5.5);
            float pores = (tacNoise2(grainCoord * vec2(3.2, 9.5)) - 0.5) * attW;
            float woodTone = 1.0 + ring * 0.085 * attW + pores * 0.075;

            // Analytic joinery & recessed panel molding AO (foyer wainscot rails Y ~ 0.02, 0.10, 0.205, 0.835, 0.99):
            float m1 = exp(-pow((vTacWorld.y - 0.10) / 0.014, 2.0));
            float m2 = exp(-pow((vTacWorld.y - 0.205) / 0.016, 2.0));
            float m3 = exp(-pow((vTacWorld.y - 0.835) / 0.016, 2.0));
            float m4 = exp(-pow((vTacWorld.y - 0.985) / 0.015, 2.0));
            float floorAO = 1.0 - 0.35 * (1.0 - smoothstep(0.0, 0.045, vTacWorld.y));
            float jointAO = (1.0 - 0.26 * clamp(m1 + m2 + m3 + m4, 0.0, 1.0)) * floorAO;

            ${isDarkUntextured ? `
              vec3 richMahog = vec3(0.062, 0.034, 0.026) * (0.85 + 0.32 * (0.5 + 0.5 * ring)) * (1.0 + pores * 0.12);
              diffuseColor.rgb = mix(diffuseColor.rgb, richMahog * jointAO, uTex);
            ` : `
              diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * woodTone * jointAO, uTex);
            `}
            gWoodH = (pores * 0.7 + ring * 0.25 * attW) * uTex;
            gWoodRough = clamp(0.38 - ring * 0.05 * attW - pores * 0.08, 0.22, 0.58);
          }
        `)
        .replace('#include <roughnessmap_fragment>', `
          #include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, gWoodRough, uTex);
        `)
        .replace('#include <normal_fragment_maps>', `
          #include <normal_fragment_maps>
          if (uTex > 0.001) {
            vec3 dPdx = dFdx(vViewPosition);
            vec3 dPdy = dFdy(vViewPosition);
            vec3 surfGrad = normalize(cross(dPdx, normal)) * dFdy(gWoodH) + normalize(cross(normal, dPdy)) * dFdx(gWoodH);
            normal = normalize(normal - surfGrad * 0.014);
          }
        `);
    };
    mat.needsUpdate = true;
  }

  // 4. COMMERCIAL TWEED/BOUCLE VELVET CHAIRS (`chair_red`) & STAGE CURTAINS (`crimson_velvet`) + POWDER-COATED STEEL (`chair_metal`):
  function patchVelvet(mat, isChair) {
    mat.onBeforeCompile = sh => {
      injectWorldVaryings(sh);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE_HELPERS}\nfloat gVelH = 0.0;\nfloat gVelR = 0.88;`)
        .replace('#include <map_fragment>', `
          #include <map_fragment>
          if (uTex > 0.001) {
            ${isChair ? `
              // Per-chair random phase & dye-lot / age variation from instanceMatrix origin (0 bytes extra memory!):
              float s2 = fract(vChairSeed * 17.31);
              float s3 = fract(vChairSeed * 43.19);
              vec2 seedOff = vec2(vChairSeed * 9.7, s2 * 11.3);

              // Coarse commercial contract-bouclé upholstery weave (~4.6mm nubby basketweave, filtered cleanly by fwidth):
              vec2 fabUv = (vTacObj.xz + vTacObj.xy * 0.92) * 215.0 + seedOff * 40.0;
              float fwF = max(fwidth(fabUv.x), fwidth(fabUv.y));
              float attF = 1.0 / (1.0 + fwF * 1.15);
              float warpB = sin(fabUv.x * 6.2831853);
              float weftB = sin(fabUv.y * 6.2831853 + (mod(floor(fabUv.x), 2.0) * 1.5708));
              float boucle = (warpB * 0.52 + weftB * 0.48) * attF;

              // Medium nubby yarn slubbing & brushed suede nap per chair:
              float slub = (tacNoise2((vTacObj.xy + vTacObj.xz) * 78.0 + seedOff) - 0.5) * 2.0 * (1.0 / (1.0 + fwF * 0.45));
              float napPatch = tacFbm2((vTacObj.xy + vTacObj.xz) * 6.2 + seedOff) - 0.5;

              // Molded perimeter welt/piping seam around backrest & seat cushion (X in [-0.21..0.21]) + center sit-zone patina:
              float ax = abs(vTacObj.x);
              float weltGroove = exp(-pow((ax - 0.196) / 0.0065, 2.0));
              float edgeRoll = smoothstep(0.222, 0.182, ax);
              // Subtle darker sit/lean compression in center of cushion & lower backrest, stronger on ~25% "well-loved" chairs:
              float centerZone = exp(-pow(vTacObj.x / 0.125, 2.0)) * exp(-pow((vTacObj.y - 0.56) / 0.18, 2.0));
              float wearStrength = mix(0.06, 0.17, step(0.74, s3));

              // Per-chair dye-lot & fade nuance (±10% value + subtle warm-scarlet vs deep-wine tint):
              float chairVal = mix(0.89, 1.11, vChairSeed);
              vec3 chairTint = vec3(1.0 + (s2 - 0.5) * 0.11, 1.0 - (s2 - 0.5) * 0.06, 1.0 + (s3 - 0.5) * 0.08);

              float velMod = chairVal
                * (1.0 + boucle * 0.125 + slub * 0.095 + napPatch * 0.165 - centerZone * wearStrength)
                * (0.76 + 0.24 * edgeRoll)
                * (1.0 - 0.28 * weltGroove);
              diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * chairTint * velMod, uTex);

              gVelH = (boucle * 0.85 + slub * 0.55 + napPatch * 0.40 - weltGroove * 1.6) * uTex;
              gVelR = clamp(0.86 - centerZone * wearStrength * 0.8 - boucle * 0.06 + napPatch * 0.09 + (s3 - 0.5) * 0.08, 0.62, 0.98);
            ` : `
              vec2 vUvW = vTacWorld.xy * 0.85;
              float twill = sin(vUvW.x * 420.0) * sin(vUvW.y * 420.0);
              float fwV = max(fwidth(vUvW.x * 420.0), fwidth(vUvW.y * 420.0));
              twill *= 1.0 / (1.0 + fwV * 1.5);
              float crushedNap = tacFbm2(vUvW * 4.8) - 0.5;
              float velMod = 1.0 + twill * 0.055 + crushedNap * 0.11;
              diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * velMod, uTex);
              gVelH = (twill * 0.35 + crushedNap * 0.45) * uTex;
              gVelR = clamp(0.91 + crushedNap * 0.06, 0.78, 0.98);
            `}
          }
        `)
        .replace('#include <roughnessmap_fragment>', `
          #include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, gVelR, uTex);
        `)
        .replace('#include <normal_fragment_maps>', `
          #include <normal_fragment_maps>
          if (uTex > 0.001) {
            vec3 dPdx = dFdx(vViewPosition);
            vec3 dPdy = dFdy(vViewPosition);
            vec3 surfGrad = normalize(cross(dPdx, normal)) * dFdy(gVelH) + normalize(cross(normal, dPdy)) * dFdx(gVelH);
            normal = normalize(normal - surfGrad * ${isChair ? '0.038' : '0.016'});
          }
        `)
        .replace('#include <dithering_fragment>', `
          if (uTex > 0.001) {
            // Physical velvet/bouclé cloth grazing rim sheen (varied per chair so slightly rotated rows catch broken highlights!):
            float ndv = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0);
            float clothRim = pow(1.0 - ndv, ${isChair ? '2.65' : '3.30'});
            float litGate = clamp(dot(gl_FragColor.rgb, vec3(0.45, 0.35, 0.20)) * ${isChair ? '10.5' : '5.5'}, 0.0, 1.0);
            float seedBoost = ${isChair ? '(0.82 + 0.38 * fract(vChairSeed * 29.1))' : '1.0'};
            vec3 sheenTint = ${isChair ? 'vec3(0.46, 0.085, 0.105)' : 'vec3(0.36, 0.055, 0.075)'};
            gl_FragColor.rgb += sheenTint * clothRim * litGate * seedBoost * ${isChair ? '0.54' : '0.32'} * uTex;
          }
          #include <dithering_fragment>
        `);
    };
    mat.needsUpdate = true;
  }

  function patchChairMetal(mat) {
    mat.onBeforeCompile = sh => {
      injectWorldVaryings(sh);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE_HELPERS}\nfloat gMetR = 0.44;`)
        .replace('#include <map_fragment>', `
          #include <map_fragment>
          if (uTex > 0.001) {
            // Powder-coated black tubular steel micro-pebble + subtle scuffing & rubber foot-glide darkening near floor:
            float peb = tacNoise2((vTacObj.xy + vTacObj.zy) * 260.0 + vChairSeed * 31.0) - 0.5;
            float scuff = tacFbm2(vTacObj.xy * 18.0 + vChairSeed * 13.0);
            float glideAO = 0.55 + 0.45 * smoothstep(0.0, 0.06, vTacWorld.y);
            gMetR = clamp(0.38 + scuff * 0.18 - peb * 0.08, 0.26, 0.64);
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.88 + 0.28 * scuff + 0.10 * peb) * glideAO, uTex);
          }
        `)
        .replace('#include <roughnessmap_fragment>', `
          #include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, gMetR, uTex);
        `);
    };
    mat.needsUpdate = true;
  }

  // 5. `03` APRON FLIGHT-CASE & STAGE WEDGE MONITORS (`flightcase_black` — pebbled Tolex / Warnex splatter relief):
  function patchFlightcase(mat) {
    mat.onBeforeCompile = sh => {
      injectWorldVaryings(sh);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE_HELPERS}\nfloat gTolexH = 0.0;\nfloat gTolexR = 0.74;`)
        .replace('#include <map_fragment>', `
          #include <map_fragment>
          if (uTex > 0.001) {
            vec2 tp = (vTacObj.xy + vTacObj.zy) * 190.0;
            float fwT = max(fwidth(tp.x), fwidth(tp.y));
            float attT = 1.0 / (1.0 + fwT * 1.3);
            float peb = (tacNoise2(tp) - 0.5) * attT;
            gTolexH = peb * uTex;
            gTolexR = clamp(0.62 - peb * 0.22, 0.38, 0.86);
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (1.0 + peb * 0.24), uTex);
          }
        `)
        .replace('#include <roughnessmap_fragment>', `
          #include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, gTolexR, uTex);
        `)
        .replace('#include <normal_fragment_maps>', `
          #include <normal_fragment_maps>
          if (uTex > 0.001) {
            vec3 dPdx = dFdx(vViewPosition);
            vec3 dPdy = dFdy(vViewPosition);
            vec3 surfGrad = normalize(cross(dPdx, normal)) * dFdy(gTolexH) + normalize(cross(normal, dPdy)) * dFdx(gTolexH);
            normal = normalize(normal - surfGrad * 0.024);
          }
        `);
    };
    mat.needsUpdate = true;
  }

  // 6. BRUSHED BRASS HARDWARE (`brass_hardware`) & ANTIQUE BEVELLED DOOR GLASS (`door_glass`):
  function patchBrass(mat) {
    mat.onBeforeCompile = sh => {
      injectWorldVaryings(sh);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE_HELPERS}\nfloat gBrassR = 0.30;`)
        .replace('#include <map_fragment>', `
          #include <map_fragment>
          if (uTex > 0.001) {
            float brush = (tacNoise2(vec2(vTacWorld.x * 420.0 + vTacWorld.z * 420.0, vTacWorld.y * 45.0)) - 0.5);
            float patina = tacFbm2(vTacWorld.xy * 12.0);
            gBrassR = clamp(0.24 + patina * 0.16 - brush * 0.05, 0.16, 0.46);
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.90 + 0.18 * patina + 0.06 * brush), uTex);
          }
        `)
        .replace('#include <roughnessmap_fragment>', `
          #include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, gBrassR, uTex);
        `);
    };
    mat.needsUpdate = true;
  }

  function patchDoorGlass(mat) {
    mat.onBeforeCompile = sh => {
      injectWorldVaryings(sh);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE_HELPERS}`)
        .replace('#include <dithering_fragment>', `
          if (uTex > 0.001) {
            // Subtle historic crown-glass shimmer + Fresnel reflection on open door panes:
            float ndv = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0);
            float glassFresnel = pow(1.0 - ndv, 3.8);
            float ripple = 0.85 + 0.30 * sin(vTacWorld.y * 14.0 + vTacWorld.z * 9.0);
            gl_FragColor.rgb += vec3(0.14, 0.11, 0.08) * glassFresnel * ripple * uTex;
            gl_FragColor.a = mix(gl_FragColor.a, clamp(gl_FragColor.a + glassFresnel * 0.22, 0.0, 0.65), uTex);
          }
          #include <dithering_fragment>
        `);
    };
    mat.needsUpdate = true;
  }

  const patchedSet = new Set();

  function patchSceneMaterial(mat) {
    if (!mat || patchedSet.has(mat.uuid)) return;
    patchedSet.add(mat.uuid);
    const nm = mat.name || '';
    if (nm === 'runner_salmon') patchCarpet(mat, true);
    else if (nm === 'carpet_olive') patchCarpet(mat, false);
    else if (nm === 'plaster_cream') patchPlaster(mat);
    else if (nm === 'cherry_wood') patchWoodwork(mat, false);
    else if (nm === 'dark_wainscot') patchWoodwork(mat, true);
    else if (nm === 'chair_red') patchVelvet(mat, true);
    else if (nm === 'chair_metal') patchChairMetal(mat);
    else if (nm === 'crimson_velvet') patchVelvet(mat, false);
    else if (nm === 'flightcase_black') patchFlightcase(mat);
    else if (nm === 'brass_hardware') patchBrass(mat);
    else if (nm === 'door_glass') patchDoorGlass(mat);
  }

  // ---- ZERO-MEMORY ORGANIC CHAIR DISORDER (MUTATES EXISTING INSTANCEDMESH MATRICES IN-PLACE!) ----
  const chairRecords = [];
  const instancedBatches = [];
  let roseSyncTarget = null;
  let pavlosChairDelta = { dx: 0.014, dz: 0.036, dYaw: -0.092 }; // subtle lived-in -5.3 deg angle & 3.6cm pull-back on Row 6 Seat 14!
  let roseBasePos = null;
  let roseBaseRotY = 0;

  function hashStr(str, salt = 1) {
    let h = 2166136261 ^ (salt * 16777619);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 100000) / 100000;
  }

  function prepareChairDisorder(root, roseGroup = null) {
    chairRecords.length = 0;
    if (roseGroup) {
      roseSyncTarget = roseGroup;
      roseBasePos = roseGroup.position.clone();
      roseBaseRotY = roseGroup.rotation.y;
    }

    root.traverse(node => {
      if (!node.name || !node.name.startsWith('chair_')) return;
      // Only target top-level chair placement nodes (skip child primitive meshes if named `chair_*_1`):
      if (node.parent && node.parent.name && node.parent.name.startsWith('chair_')) return;

      const nm = node.name;
      const h1 = hashStr(nm, 1);
      const h2 = hashStr(nm, 2);
      const h3 = hashStr(nm, 3);
      const hSpot = hashStr(nm, 7);

      let dx = 0, dz = 0, dYaw = 0;

      if (nm === 'chair_orch_r06_s14') {
        // Pavlos's own seat: lived-in pull-back & slight inward angle toward stage-center (synced 1:1 with the rose!):
        dx = pavlosChairDelta.dx;
        dz = pavlosChairDelta.dz;
        dYaw = pavlosChairDelta.dYaw;
      } else if (nm.startsWith('chair_orch_')) {
        // Parse row & seat (`chair_orch_r06_s14`) for subtle row-bow + aisle-end human looseness:
        const m = nm.match(/r(\d+)_s(\d+)/);
        const rIdx = m ? Number(m[1]) : 4;
        const sIdx = m ? Number(m[2]) : 7;
        const isAisleEnd = (sIdx === 1 || sIdx === 14 || sIdx === 13);
        const rowBowZ = Math.sin((sIdx / 14.0) * Math.PI) * ((hashStr('row' + rIdx, 5) - 0.5) * 0.022);

        // ~20% of orchestra chairs (higher near aisles) have a noticeable "sat-in / brushed-past" angle (5..9.5 deg) & 3..7cm pull-back:
        const isSpotted = hSpot > (isAisleEnd ? 0.56 : 0.80);
        if (isSpotted) {
          const signY = h3 > 0.5 ? 1 : -1;
          dYaw = signY * (0.085 + 0.082 * h1); // ±4.9° .. ±9.6°
          dz = 0.028 + 0.044 * h2 + rowBowZ;   // pulled back 2.8..7.2 cm into the 47cm legroom gap
          dx = (h1 - 0.5) * 0.032 + (sIdx === 14 ? 0.012 : 0); // bounded ±1.6 cm so frames never touch!
        } else {
          // Subtle everyday micro-misalignment on the rest so no row is a robotic laser line:
          dYaw = (h1 - 0.5) * 0.082;           // ±2.35°
          dz = (h2 - 0.45) * 0.044 + rowBowZ;  // -2.0 .. +2.4 cm
          dx = (h3 - 0.5) * 0.030;             // ±1.5 cm
        }
      } else {
        // Loose side-box & side-wall armchairs (`chair_lbox_*`, `chair_rbox*`, `chair_lwall_*`):
        dYaw = (h1 - 0.5) * 0.21;              // ±6.0° conversational looseness
        dz = (h2 - 0.5) * 0.055;
        dx = (h3 - 0.5) * 0.045;
      }

      chairRecords.push({
        node,
        baseX: node.position.x,
        baseY: node.position.y,
        baseZ: node.position.z,
        baseQuat: node.quaternion.clone(),
        dx,
        dz,
        dYaw,
      });
    });

    applyChairTransforms(uTex.value > 0.5, false);
  }

  const _yAxis = new THREE.Vector3(0, 1, 0);
  const _qDelta = new THREE.Quaternion();

  function applyChairTransforms(disorderOn, refreshInstanced = true) {
    for (const rec of chairRecords) {
      if (disorderOn) {
        rec.node.position.set(rec.baseX + rec.dx, rec.baseY, rec.baseZ + rec.dz);
        _qDelta.setFromAxisAngle(_yAxis, rec.dYaw);
        rec.node.quaternion.copy(rec.baseQuat).multiply(_qDelta);
      } else {
        rec.node.position.set(rec.baseX, rec.baseY, rec.baseZ);
        rec.node.quaternion.copy(rec.baseQuat);
      }
      rec.node.updateMatrixWorld(true);
    }

    // Keep Pavlos's rose glued 1:1 to `chair_orch_r06_s14` `(3.445, 0, 6.700)` when the chair shifts/rotates:
    if (roseSyncTarget && roseBasePos) {
      if (disorderOn) {
        const pivotX = 3.445, pivotZ = 6.700;
        const relX = roseBasePos.x - pivotX;
        const relZ = roseBasePos.z - pivotZ;
        const c = Math.cos(pavlosChairDelta.dYaw);
        const s = Math.sin(pavlosChairDelta.dYaw);
        roseSyncTarget.position.set(
          pivotX + pavlosChairDelta.dx + relX * c + relZ * s,
          roseBasePos.y,
          pivotZ + pavlosChairDelta.dz - relX * s + relZ * c
        );
        roseSyncTarget.rotation.y = roseBaseRotY + pavlosChairDelta.dYaw;
      } else {
        roseSyncTarget.position.copy(roseBasePos);
        roseSyncTarget.rotation.y = roseBaseRotY;
      }
    }

    if (refreshInstanced) {
      for (const batch of instancedBatches) {
        for (let i = 0; i < batch.sources.length; i++) {
          batch.inst.setMatrixAt(i, batch.sources[i].matrixWorld);
        }
        batch.inst.instanceMatrix.needsUpdate = true;
      }
    }
  }

  function registerInstancedBatch(inst, sources) {
    if (sources.length > 0) {
      const s0 = sources[0];
      const isChair = (s0.name && s0.name.startsWith('chair_')) || (s0.parent && s0.parent.name && s0.parent.name.startsWith('chair_'));
      if (isChair) instancedBatches.push({ inst, sources });
    }
  }

  function setEnabled(on) {
    uTex.value = on ? 1.0 : 0.0;
    applyChairTransforms(!!on, true);
  }

  return {
    uTex,
    setEnabled,
    isEnabled: () => uTex.value > 0.5,
    patchSceneMaterial,
    prepareChairDisorder,
    registerInstancedBatch,
    disposeUnusedMap,
    getFreedCount: () => freedTexturesCount,
  };
}
