import * as THREE from 'three';

// Parametric sculpted rose petal mesh: rounded heart-shaped silhouette, concave cupped belly & classic reflexed outer lip curl
function buildCurvedPetalGeometry(width, height, cupDepth, lipCurl, segU = 6, segV = 7) {
  const geo = new THREE.BufferGeometry();
  const verts = [];
  const norms = [];
  const uvs = [];
  const indices = [];

  function evalPt(uNorm, vNorm) {
    const profileW = Math.sin(Math.PI * Math.pow(Math.max(0.001, vNorm), 0.68)) * (1.0 + 0.22 * vNorm);
    const x = uNorm * (width * 0.5) * profileW;
    const y = vNorm * height;
    const bowl = cupDepth * (1.0 - uNorm * uNorm * 0.85) * Math.sin(Math.PI * vNorm);
    const curlT = Math.max(0.0, (vNorm - 0.64) / 0.36);
    const curl = -lipCurl * curlT * curlT * (0.65 + 0.35 * uNorm * uNorm);
    const z = bowl + curl;
    return [x, y, z];
  }

  const eps = 0.02;
  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV;
    for (let iu = 0; iu <= segU; iu++) {
      const u = -1.0 + (2.0 * iu) / segU;
      const p = evalPt(u, v);
      const pu = evalPt(Math.min(1, u + eps), v);
      const pv = evalPt(u, Math.min(1, v + eps));
      const tx = pu[0] - p[0], ty = pu[1] - p[1], tz = pu[2] - p[2];
      const bx = pv[0] - p[0], by = pv[1] - p[1], bz = pv[2] - p[2];
      const nx = ty * bz - tz * by;
      const ny = tz * bx - tx * bz;
      const nz = tx * by - ty * bx;
      const nl = Math.hypot(nx, ny, nz) || 1.0;
      verts.push(p[0], p[1], p[2]);
      norms.push(nx / nl, ny / nl, nz / nl);
      uvs.push(iu / segU, v);
    }
  }

  const rowStride = segU + 1;
  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * rowStride + iu;
      const b = a + 1;
      const c = a + rowStride;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function buildLeafletGeometry(len = 0.068, wid = 0.036) {
  const geo = new THREE.BufferGeometry();
  const segU = 4, segV = 6;
  const verts = [], uvs = [], indices = [];
  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV;
    const serrate = 1.0 + 0.08 * Math.sin(v * Math.PI * 7.0);
    const wEnv = Math.sin(Math.PI * Math.pow(v, 0.72)) * serrate;
    const archY = v * len;
    const droopZ = -0.012 * v * v;
    for (let iu = 0; iu <= segU; iu++) {
      const u = -1.0 + (2.0 * iu) / segU;
      const vFold = 0.005 * Math.abs(u);
      verts.push(u * wid * 0.5 * wEnv, archY, droopZ + vFold);
      uvs.push(iu / segU, v);
    }
  }
  const stride = segU + 1;
  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * stride + iu, b = a + 1, c = a + stride, d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds Pavlos's Easter Egg on `chair_orch_r06_s14` (Row 6, Seat 14 from `org_img_1609267555_L-theater2.jpg`,
 * `X = +3.445 m, Z = +6.700 m`, cushion `Y = 0.471 m`):
 * - Zero artificial emissive glow so the seat & rose stay naturally dark at the beginning and during the show.
 * - Includes an overhead narrow-beam warm theatrical pin-spot + subtle volumetric dust-beam shaft (`setSpotlightLevel(0..1)`)
 *   that fades up on the seat at the end of the movie as the curtains draw closed.
 */
export function addPavlosSeatRoseEasterEgg(scene, initialSpotLevel = 0.0) {
  const root = new THREE.Group();
  root.name = 'pavlos_seat_rose_easter_egg';
  // Chair `chair_orch_r06_s14` (`X = 3.445, Z = 6.700`, cushion `Y = 0.471`, backrest `Y = 0.505..0.840` at `Z ~ 6.89`):
  // Stem rests on the velvet cushion and leans gracefully up against the right-aisle corner of the backrest (`Y ~ 0.83m`)
  // so the spotlighted bloom clears Row 7 & Row 8 backrests and is visible all the way from the open foyer doorway at the end!
  root.position.set(3.465, 0.474, 6.685);
  root.scale.setScalar(1.18);
  scene.add(root);

  // Pure physically-lit materials (zero artificial emissive -> completely dark until spotlighted!)
  const matHeart = new THREE.MeshStandardMaterial({
    color: 0xa8102d,
    roughness: 0.46,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const matMidInner = new THREE.MeshStandardMaterial({
    color: 0xd92348,
    roughness: 0.42,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const matMidOuter = new THREE.MeshStandardMaterial({
    color: 0xf25c78,
    roughness: 0.38,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const matOuterBlush = new THREE.MeshStandardMaterial({
    color: 0xffb8c6,
    roughness: 0.35,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const matStemLeaf = new THREE.MeshStandardMaterial({
    color: 0x2d8a45,
    roughness: 0.36,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const matSilkRibbon = new THREE.MeshStandardMaterial({
    color: 0xfff3dc,
    roughness: 0.28,
    metalness: 0.10,
    side: THREE.DoubleSide,
  });

  // 1. Gracefully arched stem resting naturally diagonally across the velvet seat cushion toward the right-aisle edge:
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.128, -0.002,  0.082),
    new THREE.Vector3(-0.046,  0.004,  0.030),
    new THREE.Vector3( 0.035,  0.015, -0.018),
    new THREE.Vector3( 0.100,  0.038, -0.056),
  ]);
  const stemMesh = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 20, 0.0045, 7, false), matStemLeaf);
  root.add(stemMesh);

  const thornGeo = new THREE.ConeGeometry(0.0032, 0.011, 5);
  for (const [uT, sideAng] of [[0.24, 1.1], [0.52, -1.3], [0.74, 0.9]]) {
    const tp = stemCurve.getPoint(uT);
    const th = new THREE.Mesh(thornGeo, matStemLeaf);
    th.position.copy(tp);
    th.rotation.set(0.4, sideAng, 1.15);
    root.add(th);
  }

  // 2. Two compound 3-leaflet serrated emerald rose leaves:
  const leafMainGeo = buildLeafletGeometry(0.068, 0.036);
  const leafSideGeo = buildLeafletGeometry(0.048, 0.027);
  for (const [uL, yawL, rollL] of [[0.34, 0.85, 0.18], [0.62, -1.65, -0.15]]) {
    const lp = stemCurve.getPoint(uL);
    const leafGrp = new THREE.Group();
    leafGrp.position.copy(lp);
    leafGrp.rotation.set(-Math.PI * 0.46, yawL, rollL);

    const centerLeaf = new THREE.Mesh(leafMainGeo, matStemLeaf);
    centerLeaf.position.y = 0.012;
    leafGrp.add(centerLeaf);

    for (const sgn of [-1, 1]) {
      const sideLeaf = new THREE.Mesh(leafSideGeo, matStemLeaf);
      sideLeaf.position.set(sgn * 0.010, 0.006, 0.001);
      sideLeaf.rotation.z = -sgn * 0.95;
      leafGrp.add(sideLeaf);
    }
    root.add(leafGrp);
  }

  // 3. Delicate ivory-gold silk ribbon tie & tails around mid-stem:
  {
    const ribPos = stemCurve.getPoint(0.45);
    const ribGrp = new THREE.Group();
    ribGrp.position.copy(ribPos);
    ribGrp.rotation.y = -0.58;

    const knot = new THREE.Mesh(new THREE.TorusGeometry(0.0075, 0.0028, 6, 12), matSilkRibbon);
    knot.rotation.y = Math.PI * 0.5;
    ribGrp.add(knot);

    const tailGeo = buildLeafletGeometry(0.056, 0.013);
    for (const [yawT, pitchT] of [[0.45, -1.42], [0.95, -1.46]]) {
      const tail = new THREE.Mesh(tailGeo, matSilkRibbon);
      tail.rotation.set(pitchT, yawT, 0.1);
      ribGrp.add(tail);
    }
    root.add(ribGrp);
  }

  // 4. Sculpted Multi-Whorl Golden-Angle Spiral Rose Bloom resting on the cushion:
  const bloomGrp = new THREE.Group();
  bloomGrp.position.copy(stemCurve.getPoint(1.0));
  bloomGrp.rotation.set(0.62, 0.56, -0.48);
  root.add(bloomGrp);

  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), matStemLeaf);
  hip.scale.set(1.0, 1.25, 1.0);
  bloomGrp.add(hip);

  const sepalGeo = buildLeafletGeometry(0.044, 0.014);
  for (let i = 0; i < 5; i++) {
    const sp = new THREE.Group();
    sp.rotation.y = (i / 5) * Math.PI * 2 + 0.3;
    const sm = new THREE.Mesh(sepalGeo, matStemLeaf);
    sm.position.set(0, 0.004, 0.011);
    sm.rotation.x = 1.18;
    sp.add(sm);
    bloomGrp.add(sp);
  }

  const GOLDEN_ANGLE = 2.39996323;
  const whorls = [
    { count: 5, rBase: 0.005, tiltX: 0.16, w: 0.028, h: 0.046, cup: 0.012, curl: 0.004, mat: matHeart },
    { count: 5, rBase: 0.010, tiltX: 0.36, w: 0.038, h: 0.054, cup: 0.014, curl: 0.009, mat: matMidInner },
    { count: 6, rBase: 0.015, tiltX: 0.60, w: 0.048, h: 0.060, cup: 0.015, curl: 0.015, mat: matMidOuter },
    { count: 6, rBase: 0.020, tiltX: 0.86, w: 0.056, h: 0.064, cup: 0.014, curl: 0.021, mat: matOuterBlush },
  ];

  let petalIdx = 0;
  for (const wh of whorls) {
    const pGeo = buildCurvedPetalGeometry(wh.w, wh.h, wh.cup, wh.curl);
    for (let i = 0; i < wh.count; i++) {
      const holder = new THREE.Group();
      holder.rotation.y = petalIdx * GOLDEN_ANGLE;
      const pm = new THREE.Mesh(pGeo, wh.mat);
      pm.position.set(0, 0.004, wh.rBase);
      pm.rotation.x = wh.tiltX + (i % 2) * 0.04;
      holder.add(pm);
      bloomGrp.add(holder);
      petalIdx++;
    }
  }

  // 5. End-of-Movie Dedicated Theatrical Seat Spotlight + Gossamer Dust-in-Beam Cone:
  const spotOrigin = new THREE.Vector3(3.92, 4.82, 7.05);
  const spotTarget = new THREE.Vector3(3.52, 0.48, 6.66);
  const MAX_CD = 640.0 / (4.0 * Math.PI);

  const spotCol = new THREE.Color().setRGB(1.0, 0.88, 0.70, THREE.LinearSRGBColorSpace);
  const rosePinSpot = new THREE.SpotLight(spotCol, 0.0, 0.0, THREE.MathUtils.degToRad(6.2), 0.72, 2.0);
  rosePinSpot.position.copy(spotOrigin);
  rosePinSpot.target.position.copy(spotTarget);
  scene.add(rosePinSpot, rosePinSpot.target);

  // Subtle volumetric theatrical follow-spot haze shaft from ceiling grid onto Row 6 Seat 14:
  const beamVec = new THREE.Vector3().subVectors(spotTarget, spotOrigin);
  const beamLen = beamVec.length() + 0.55;
  const beamGeo = new THREE.CylinderGeometry(0.055, 0.46, beamLen, 20, 1, true);
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uLevel: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uLevel;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        // Soft Fresnel edge fade so cylinder silhouette never has hard edges:
        float rim = pow(abs(dot(vNormalView, vViewDir)), 1.65);
        // vUv.y = 1 at ceiling lamp, 0 at seat cushion:
        float axial = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.78, vUv.y) * (0.45 + 0.55 * vUv.y);
        float alpha = uLevel * 0.082 * rim * axial;
        vec3 warmBeam = vec3(1.0, 0.86, 0.64);
        gl_FragColor = vec4(warmBeam * alpha, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const roseBeamMesh = new THREE.Mesh(beamGeo, beamMat);
  roseBeamMesh.position.copy(spotOrigin).addScaledVector(beamVec.clone().normalize(), beamLen * 0.5);
  roseBeamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), beamVec.clone().normalize());
  scene.add(roseBeamMesh);

  function setSpotlightLevel(level01) {
    const lv = Math.max(0, Math.min(1, level01));
    rosePinSpot.visible = true;   // always counted, at zero strength until the end: a light switching on makes every lit surface rebuild its shader, which froze the film here
    rosePinSpot.intensity = MAX_CD * lv;
    roseBeamMesh.visible = lv > 0.002;
    beamMat.uniforms.uLevel.value = lv;
  }
  setSpotlightLevel(initialSpotLevel);

  return { root, rosePinSpot, roseBeamMesh, setSpotlightLevel };
}
