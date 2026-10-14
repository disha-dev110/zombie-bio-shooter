import * as THREE from 'three';
import { EnemyType, WeaponId } from '../types/game';

// Shared procedural textures and materials
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a vibrant, stylized cartoon biological floor texture (Brawl Stars / Clash style)
 * Rich violet-indigo base, glowing turquoise & coral bio-hexes, and bubbly cytoplasm patterns!
 */
export function getOrganicGridTexture(): THREE.CanvasTexture {
  if (textureCache.has('vibrant_cartoon_bio')) return textureCache.get('vibrant_cartoon_bio')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Vibrant lush biological gradient base (Deep Royal Purple -> Rich Violet Indigo)
  const baseGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
  baseGrad.addColorStop(0, '#2b1055');
  baseGrad.addColorStop(0.5, '#1e1b4b');
  baseGrad.addColorStop(1, '#172554');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Stylized cartoon hexagonal bio-tiles with rounded corners and highlights
  const hexSize = 56;
  const h = hexSize * Math.sqrt(3);
  const w = hexSize * 2;

  ctx.lineWidth = 4;
  for (let row = -1; row < 12; row++) {
    for (let col = -1; col < 12; col++) {
      const cx = col * (w * 0.75);
      const cy = row * h + (col % 2 === 0 ? 0 : h * 0.5);

      // Tile fill gradient
      const tileGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, hexSize);
      const isAlt = (row + col) % 3 === 0;
      const isCoral = (row * 2 + col) % 5 === 0;

      if (isCoral) {
        tileGrad.addColorStop(0, '#4c1d95');
        tileGrad.addColorStop(1, '#311042');
      } else if (isAlt) {
        tileGrad.addColorStop(0, '#1e1b4b');
        tileGrad.addColorStop(1, '#0f172a');
      } else {
        tileGrad.addColorStop(0, '#2e1065');
        tileGrad.addColorStop(1, '#1e1035');
      }

      ctx.fillStyle = tileGrad;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = cx + hexSize * Math.cos(angle);
        const y = cy + hexSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Stylized beveled border
      ctx.strokeStyle = isCoral ? 'rgba(244, 63, 94, 0.45)' : 'rgba(56, 189, 248, 0.35)';
      ctx.stroke();

      // Soft cartoon inner glow dot
      if ((row + col) % 2 === 0) {
        ctx.fillStyle = isCoral ? 'rgba(251, 113, 133, 0.5)' : 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3. Playful cartoon cytoplasmic bubbles & organelles
  for (let i = 0; i < 70; i++) {
    const bx = Math.random() * 1024;
    const by = Math.random() * 1024;
    const r = 6 + Math.random() * 14;

    const bGrad = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, 1, bx, by, r);
    bGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    bGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
    bGrad.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();

    // Cartoon white shiny specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(bx - r * 0.35, by - r * 0.35, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('vibrant_cartoon_bio', texture);
  return texture;
}

// Stylized cartoon contact shadow (crisp, rounded, slightly colored)
function getCartoonContactShadowTexture(): THREE.CanvasTexture {
  if (textureCache.has('cartoon_shadow')) return textureCache.get('cartoon_shadow')!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 58);
  grad.addColorStop(0, 'rgba(15, 7, 36, 0.75)');
  grad.addColorStop(0.65, 'rgba(15, 7, 36, 0.4)');
  grad.addColorStop(1, 'rgba(15, 7, 36, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('cartoon_shadow', texture);
  return texture;
}

export function createContactShadow(radius: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const mat = new THREE.MeshBasicMaterial({
    map: getCartoonContactShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.85
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  mesh.renderOrder = 1;
  return mesh;
}

/**
 * Creates cartoon stylized eyes with white sclera, colored pupil, and glossy white catchlight reflection!
 */
export function createCartoonEyes(
  size = 0.18,
  pupilColor = 0x0284c7,
  angry = false
): THREE.Group {
  const eyeGroup = new THREE.Group();

  const eyeGeo = new THREE.SphereGeometry(size, 16, 16);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.05
  });

  const pupilGeo = new THREE.SphereGeometry(size * 0.55, 12, 12);
  const pupilMat = new THREE.MeshStandardMaterial({
    color: pupilColor,
    roughness: 0.1,
    metalness: 0.1
  });

  const pupilCenterGeo = new THREE.SphereGeometry(size * 0.32, 8, 8);
  const pupilCenterMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const glintGeo = new THREE.SphereGeometry(size * 0.18, 6, 6);
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  [-1, 1].forEach((dir) => {
    const singleEye = new THREE.Group();
    singleEye.position.x = dir * size * 1.05;

    // Eyeball
    const sclera = new THREE.Mesh(eyeGeo, eyeMat);
    singleEye.add(sclera);

    // Colored Iris
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, size * 0.65);
    singleEye.add(pupil);

    // Dark Pupil Center
    const pupilCenter = new THREE.Mesh(pupilCenterGeo, pupilCenterMat);
    pupilCenter.position.set(0, 0, size * 0.85);
    singleEye.add(pupilCenter);

    // Cute cartoon shiny glint
    const glint = new THREE.Mesh(glintGeo, glintMat);
    glint.position.set(size * 0.2, size * 0.2, size * 0.95);
    singleEye.add(glint);

    // Angry cartoon eyebrow
    if (angry) {
      const browGeo = new THREE.BoxGeometry(size * 1.5, size * 0.35, size * 0.4);
      const browMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.4 });
      const brow = new THREE.Mesh(browGeo, browMat);
      brow.position.set(0, size * 0.9, size * 0.4);
      brow.rotation.z = -dir * 0.35;
      singleEye.add(brow);
    }

    eyeGroup.add(singleEye);
  });

  return eyeGroup;
}

/**
 * Procedural Cartoon Operator Character (Brawl Stars Hero Style)
 * Chunky heroic proportions, vibrant cyan-white armored chassis, oversized cartoon helmet,
 * expressive visor reflections, articulated cartoon limbs ready for bouncy step cycles!
 */
export function createOperatorModel(weaponId: WeaponId = 'm4_carbine'): THREE.Group {
  const group = new THREE.Group();
  group.name = 'operator';

  // Contact shadow
  group.add(createContactShadow(1.2));

  // Vibrant Cartoon Hero Materials
  const suitMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant electric blue
    roughness: 0.25,
    metalness: 0.15
  });

  const armorWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Crisp glossy porcelain white
    roughness: 0.2,
    metalness: 0.1
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Saturated hero gold
    roughness: 0.2,
    metalness: 0.6,
    emissive: 0xd97706,
    emissiveIntensity: 0.25
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x00f5ff,
    emissive: 0x00d8f6,
    emissiveIntensity: 1.8,
    roughness: 0.05,
    metalness: 0.2
  });

  const gunBodyMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.2,
    metalness: 0.5
  });

  const gunAccentMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.8
  });

  // 1. Chunky Cartoon Boots & Legs (Articulated for bouncy walk)
  const leftLegGroup = new THREE.Group();
  leftLegGroup.name = 'leftLeg';
  leftLegGroup.position.set(-0.28, 0.4, 0);

  const bootGeo = new THREE.CapsuleGeometry(0.18, 0.32, 8, 12);
  const leftBoot = new THREE.Mesh(bootGeo, armorWhiteMat);
  leftBoot.castShadow = true;
  leftLegGroup.add(leftBoot);

  const leftToe = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), goldAccentMat);
  leftToe.position.set(0, -0.15, 0.1);
  leftLegGroup.add(leftToe);
  group.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.name = 'rightLeg';
  rightLegGroup.position.set(0.28, 0.4, 0);

  const rightBoot = new THREE.Mesh(bootGeo, armorWhiteMat);
  rightBoot.castShadow = true;
  rightLegGroup.add(rightBoot);

  const rightToe = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), goldAccentMat);
  rightToe.position.set(0, -0.15, 0.1);
  rightLegGroup.add(rightToe);
  group.add(rightLegGroup);

  // 2. Chunky Heroic Torso & Backpack (Named for bobbing animation)
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'torso';
  torsoGroup.position.set(0, 0.95, 0);

  // Chunky bean-shaped hero body
  const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.45, 12, 16), suitMat);
  bodyMesh.castShadow = true;
  torsoGroup.add(bodyMesh);

  // Chest armor plate with golden hero star/crest
  const chestPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.35, 0.4, 12), armorWhiteMat);
  chestPlate.rotation.x = 0.2;
  chestPlate.position.set(0, 0.05, 0.12);
  torsoGroup.add(chestPlate);

  const heroBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8), goldAccentMat);
  heroBadge.rotation.x = Math.PI / 2;
  heroBadge.position.set(0, 0.08, 0.32);
  torsoGroup.add(heroBadge);

  // Cartoon oxygen/cytoplasm backpack tanks with bubbling serum
  const tankGeo = new THREE.CapsuleGeometry(0.16, 0.5, 8, 12);
  const tankL = new THREE.Mesh(tankGeo, armorWhiteMat);
  tankL.position.set(-0.22, 0.08, -0.32);
  torsoGroup.add(tankL);

  const tankR = new THREE.Mesh(tankGeo, armorWhiteMat);
  tankR.position.set(0.22, 0.08, -0.32);
  torsoGroup.add(tankR);

  // 3. Oversized Cartoon Helmet & Glowing Visor
  const headGroup = new THREE.Group();
  headGroup.name = 'head';
  headGroup.position.set(0, 0.65, 0.05);

  const helmetMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 18), armorWhiteMat);
  helmetMesh.castShadow = true;
  headGroup.add(helmetMesh);

  // Shiny glossy curved cartoon visor
  const visorMesh = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), visorMat);
  visorMesh.rotation.x = Math.PI / 2.3;
  visorMesh.position.set(0, 0.04, 0.2);
  headGroup.add(visorMesh);

  // Cartoon golden comms antenna
  const antennaStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.35), goldAccentMat);
  antennaStalk.position.set(-0.35, 0.4, -0.05);
  antennaStalk.rotation.z = 0.25;
  headGroup.add(antennaStalk);

  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), goldAccentMat);
  antennaTip.position.set(-0.42, 0.58, -0.05);
  headGroup.add(antennaTip);

  torsoGroup.add(headGroup);

  // 4. Chunky Cartoon Arms & Stylized Blaster
  const weaponGroup = new THREE.Group();
  weaponGroup.name = 'weaponGroup';
  weaponGroup.position.set(0.35, 0.15, 0.35);

  // Chunky cartoon blaster (Supercell style)
  const gunReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.55), gunBodyMat);
  weaponGroup.add(gunReceiver);

  // Oversized chunky barrel
  const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.45, 12), gunAccentMat);
  gunBarrel.rotation.x = Math.PI / 2;
  gunBarrel.position.set(0, 0.02, 0.45);
  weaponGroup.add(gunBarrel);

  // Flared cartoon muzzle ring
  const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 16), goldAccentMat);
  muzzleRing.position.set(0, 0.02, 0.68);
  muzzleRing.name = 'muzzle';
  weaponGroup.add(muzzleRing);

  // Chunky curved cartoon magazine
  const gunMag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.18), goldAccentMat);
  gunMag.position.set(0, -0.22, 0.12);
  gunMag.rotation.x = 0.2;
  weaponGroup.add(gunMag);

  // Chunky round optic sight with glowing cyan dot
  const sightMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 10), gunBodyMat);
  sightMesh.rotation.x = Math.PI / 2;
  sightMesh.position.set(0, 0.18, 0.08);
  weaponGroup.add(sightMesh);

  const opticDot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), visorMat);
  opticDot.position.set(0, 0.18, 0.18);
  weaponGroup.add(opticDot);

  // Dynamic tactical cartoon flashlight spot
  const flashlight = new THREE.SpotLight(0x7dd3fc, 4, 30, Math.PI / 6, 0.35, 1.2);
  flashlight.position.set(0, 0, 0.7);
  flashlight.target.position.set(0, 0, 10);
  weaponGroup.add(flashlight);
  weaponGroup.add(flashlight.target);

  torsoGroup.add(weaponGroup);
  group.add(torsoGroup);

  return group;
}

/**
 * Creates High-Quality Cartoon Enemies (Clash & Brawl Stars Inspired)
 */
export function createEnemyModel(type: EnemyType): THREE.Group {
  const group = new THREE.Group();
  group.name = `enemy_${type}`;

  switch (type) {
    case 'grunt_bacillus': {
      // Chunky, cute-yet-angry cartoon bacterial pill
      group.add(createContactShadow(0.95));

      const cellMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e, // Vibrant coral crimson
        roughness: 0.25,
        metalness: 0.1
      });
      const bellyMat = new THREE.MeshStandardMaterial({
        color: 0xfecdd3, // Soft peach-pink cartoon belly
        roughness: 0.3,
        metalness: 0.05
      });
      const spikeMat = new THREE.MeshStandardMaterial({
        color: 0x9f1239,
        roughness: 0.35
      });

      // Animated Body Group
      const bodyGroup = new THREE.Group();
      bodyGroup.name = 'bodyGroup';
      bodyGroup.position.y = 0.65;

      // Chubby Pill Capsule Body
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.6, 12, 16), cellMat);
      body.rotation.x = 0.2;
      body.castShadow = true;
      bodyGroup.add(body);

      // Belly Patch
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), bellyMat);
      belly.scale.set(0.9, 1.1, 0.5);
      belly.position.set(0, -0.08, 0.32);
      bodyGroup.add(belly);

      // Big expressive cartoon angry eyes
      const eyes = createCartoonEyes(0.16, 0xd97706, true);
      eyes.position.set(0, 0.28, 0.42);
      bodyGroup.add(eyes);

      // Cute spiky cartoon crown ridges
      for (let i = 0; i < 3; i++) {
        const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), spikeMat);
        ridge.position.set(0, 0.55 + i * 0.02, -0.2 + i * 0.2);
        ridge.rotation.x = -0.3;
        bodyGroup.add(ridge);
      }

      // Nubby cartoon pitter-patter feet
      const footGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const leftFoot = new THREE.Mesh(footGeo, spikeMat);
      leftFoot.name = 'leftFoot';
      leftFoot.position.set(-0.25, -0.45, 0.1);
      bodyGroup.add(leftFoot);

      const rightFoot = new THREE.Mesh(footGeo, spikeMat);
      rightFoot.name = 'rightFoot';
      rightFoot.position.set(0.25, -0.45, 0.1);
      bodyGroup.add(rightFoot);

      // Wiggling cartoon tail flagella
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.12, 0.45, 6), spikeMat);
      tail.name = 'tail';
      tail.rotation.x = Math.PI / 2.2;
      tail.position.set(0, -0.15, -0.55);
      bodyGroup.add(tail);

      group.add(bodyGroup);
      break;
    }

    case 'viral_spiker': {
      // Vibrant neon-violet bouncy virus with playful crown spikes and googly cartoon eyes
      group.add(createContactShadow(1.1));

      const virusMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7, // Vibrant neon purple
        roughness: 0.2,
        metalness: 0.15
      });
      const spikeMat = new THREE.MeshStandardMaterial({
        color: 0xf472b6, // Playful hot pink
        roughness: 0.25,
        emissive: 0xdb2777,
        emissiveIntensity: 0.4
      });

      const bodyGroup = new THREE.Group();
      bodyGroup.name = 'bodyGroup';
      bodyGroup.position.y = 0.85;

      // Chubby sphere core
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), virusMat);
      core.castShadow = true;
      bodyGroup.add(core);

      // Cute big expressive cartoon eyes
      const eyes = createCartoonEyes(0.18, 0xef4444, false);
      eyes.position.set(0, 0.15, 0.52);
      bodyGroup.add(eyes);

      // Springy cartoon crown spikes with round bobbing balls on top
      const spikeAngles = [
        [0, 1, 0], [0.8, 0.5, 0], [-0.8, 0.5, 0],
        [0.6, -0.5, 0.4], [-0.6, -0.5, 0.4],
        [0, 0.5, -0.7], [0, -0.6, -0.6], [0, 0.3, 0.8]
      ];

      spikeAngles.forEach(([x, y, z]) => {
        const dir = new THREE.Vector3(x, y, z).normalize();
        const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.45, 8), spikeMat);
        spike.position.copy(dir.clone().multiplyScalar(0.72));
        spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        bodyGroup.add(spike);

        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), spikeMat);
        cap.position.copy(dir.clone().multiplyScalar(0.96));
        bodyGroup.add(cap);
      });

      group.add(bodyGroup);
      break;
    }

    case 'sniper_spore': {
      // Springy cartoon fungal sniper with oversized telescope lens and leafy cowl
      group.add(createContactShadow(0.85));

      const stalkMat = new THREE.MeshStandardMaterial({
        color: 0x10b981, // Vibrant emerald lime
        roughness: 0.3
      });
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x065f46,
        roughness: 0.35
      });
      const opticMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 2.2
      });

      const bodyGroup = new THREE.Group();
      bodyGroup.name = 'bodyGroup';

      // Springy curved stem (bends when aiming)
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.4, 10), stalkMat);
      stem.position.y = 0.7;
      bodyGroup.add(stem);

      // Big rounded cartoon mushroom sniper cap
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
      cap.position.set(0, 1.35, 0);
      bodyGroup.add(cap);

      // Oversized cartoon sniper scope / telescope lens
      const scopeHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 12), capMat);
      scopeHousing.rotation.x = Math.PI / 2;
      scopeHousing.position.set(0, 1.25, 0.35);
      bodyGroup.add(scopeHousing);

      const scopeLens = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), opticMat);
      scopeLens.position.set(0, 1.25, 0.55);
      bodyGroup.add(scopeLens);

      // Cute spots on cap
      for (let i = 0; i < 4; i++) {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), stalkMat);
        const a = (Math.PI / 2) * i;
        spot.position.set(Math.cos(a) * 0.35, 1.5, Math.sin(a) * 0.35);
        bodyGroup.add(spot);
      }

      group.add(bodyGroup);
      break;
    }

    case 'zombie_walker': {
      // Fun, wacky cartoon zombie cell with stitches, goofy mismatched eyes, and waddling arms
      group.add(createContactShadow(1.0));

      const zombieMat = new THREE.MeshStandardMaterial({
        color: 0x84cc16, // Vibrant radioactive cartoon green
        roughness: 0.35,
        metalness: 0.05
      });
      const stitchMat = new THREE.MeshStandardMaterial({
        color: 0x365314,
        roughness: 0.6
      });

      const bodyGroup = new THREE.Group();
      bodyGroup.name = 'bodyGroup';
      bodyGroup.position.y = 0.85;

      // Chubby slumping zombie body
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.55, 10, 14), zombieMat);
      body.rotation.z = 0.12;
      body.castShadow = true;
      bodyGroup.add(body);

      // Goofy mismatched cartoon eyes (one big, one small)
      const bigEye = createCartoonEyes(0.18, 0xd97706, false);
      bigEye.position.set(-0.18, 0.3, 0.42);
      bodyGroup.add(bigEye);

      // Comical cartoon stitches on cheek
      const stitch = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.05), stitchMat);
      stitch.position.set(0.22, 0.2, 0.42);
      stitch.rotation.z = 0.4;
      bodyGroup.add(stitch);

      // Outstretched cartoon zombie arms (waddling animation)
      const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 6, 8), zombieMat);
      leftArm.name = 'leftArm';
      leftArm.rotation.x = Math.PI / 2.2;
      leftArm.position.set(-0.4, 0.1, 0.35);
      bodyGroup.add(leftArm);

      const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 6, 8), zombieMat);
      rightArm.name = 'rightArm';
      rightArm.rotation.x = Math.PI / 2.0;
      rightArm.position.set(0.4, 0.15, 0.35);
      bodyGroup.add(rightArm);

      group.add(bodyGroup);
      break;
    }

    case 'bio_juggernaut': {
      // Massive, lovable yet terrifying cartoon brute (Clash Golem / P.E.K.K.A meets Cell)
      group.add(createContactShadow(2.4));

      const bruteMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6, // Heavy cartoon royal blue armor
        roughness: 0.2,
        metalness: 0.35
      });
      const goldTrimMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.15,
        metalness: 0.75,
        emissive: 0xb45309,
        emissiveIntensity: 0.3
      });
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 2.2
      });

      const bodyGroup = new THREE.Group();
      bodyGroup.name = 'bodyGroup';
      bodyGroup.position.y = 1.4;

      // Giant barrel torso
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.75, 1.4, 12), bruteMat);
      torso.castShadow = true;
      bodyGroup.add(torso);

      // Glowing power core emblem on chest
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), coreMat);
      core.position.set(0, 0.25, 0.82);
      bodyGroup.add(core);

      // Massive cartoon boulder shoulder pads with gold spikes
      [-1.15, 1.15].forEach((x) => {
        const pad = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), bruteMat);
        pad.position.set(x, 0.65, 0);
        bodyGroup.add(pad);

        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 8), goldTrimMat);
        spike.position.set(x, 1.25, 0);
        bodyGroup.add(spike);
      });

      // Giant cartoon horned helmet
      const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), bruteMat);
      helmet.position.set(0, 0.95, 0.2);
      bodyGroup.add(helmet);

      const visorSlot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.2), coreMat);
      visorSlot.position.set(0, 0.95, 0.58);
      bodyGroup.add(visorSlot);

      // Giant bone club/shield
      const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.6), goldTrimMat);
      hammer.position.set(-1.1, -0.2, 0.6);
      hammer.castShadow = true;
      bodyGroup.add(hammer);

      group.add(bodyGroup);
      break;
    }
  }

  return group;
}

/**
 * Procedural Cartoon Sentry Gun
 */
export function createSentryGunModel(): THREE.Group {
  const group = new THREE.Group();
  group.add(createContactShadow(1.2));

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant blue
    roughness: 0.2,
    metalness: 0.3
  });
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.5
  });
  const redEyeMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 2.0
  });

  // Chunky tripod legs
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i;
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.6, 6, 8), metalMat);
    leg.position.set(Math.cos(angle) * 0.4, 0.3, Math.sin(angle) * 0.4);
    leg.rotation.z = Math.sin(angle) * 0.45;
    leg.rotation.x = Math.cos(angle) * 0.45;
    group.add(leg);
  }

  // Turret Swivel Head
  const headGroup = new THREE.Group();
  headGroup.name = 'headGroup';
  headGroup.position.y = 0.8;

  const housing = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), metalMat);
  housing.scale.set(1, 0.8, 1.1);
  headGroup.add(housing);

  // Big cartoon twin barrels
  [-0.14, 0.14].forEach((x) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.65, 10), yellowMat);
    b.rotation.x = Math.PI / 2;
    b.position.set(x, 0, 0.55);
    headGroup.add(b);
  });

  // Glowing cartoon cyclops targeting lens
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), redEyeMat);
  eye.position.set(0, 0.14, 0.38);
  headGroup.add(eye);

  group.add(headGroup);
  return group;
}

/**
 * Procedural Cartoon Mystery Box (Brawl Stars / Clash Chest)
 */
export function createMysteryBoxModel(): THREE.Group {
  const group = new THREE.Group();
  group.add(createContactShadow(1.6));

  const chestMat = new THREE.MeshStandardMaterial({
    color: 0x9333ea, // Vibrant purple magical chest
    roughness: 0.25,
    metalness: 0.2
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.15,
    metalness: 0.85,
    emissive: 0xd97706,
    emissiveIntensity: 0.4
  });
  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.2
  });

  // Rounded cartoon treasure chest
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.0), chestMat);
  box.position.y = 0.45;
  box.castShadow = true;
  group.add(box);

  // Golden cartoon bands
  const band1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.82, 1.02), goldTrimMat);
  band1.position.set(-0.5, 0.45, 0);
  group.add(band1);

  const band2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.82, 1.02), goldTrimMat);
  band2.position.set(0.5, 0.45, 0);
  group.add(band2);

  // Big golden skull/question lock
  const lock = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), goldTrimMat);
  lock.position.set(0, 0.48, 0.52);
  group.add(lock);

  // Floating rotating golden 3D Question Mark!
  const markGroup = new THREE.Group();
  markGroup.name = 'markGroup';
  markGroup.position.set(0, 1.5, 0);

  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 8, 16, Math.PI * 1.5), cyanGlowMat);
  hook.rotation.z = -Math.PI / 4;
  markGroup.add(hook);

  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), cyanGlowMat);
  dot.position.set(0, -0.34, 0);
  markGroup.add(dot);

  group.add(markGroup);
  return group;
}

/**
 * Procedural Cartoon Perk Vending Machine (Brawl Stars Style)
 */
export function createPerkMachineModel(perkColor: number, name: string): THREE.Group {
  const group = new THREE.Group();
  group.add(createContactShadow(1.3));

  const cabinetMat = new THREE.MeshStandardMaterial({
    color: perkColor,
    roughness: 0.2,
    metalness: 0.2
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: perkColor,
    emissive: perkColor,
    emissiveIntensity: 1.8
  });

  // Rounded cartoon cabinet
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.9), cabinetMat);
  body.position.y = 0.95;
  body.castShadow = true;
  group.add(body);

  // Large cartoon glass display dome with glowing serum
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), glowMat);
  dome.position.set(0, 1.25, 0.35);
  group.add(dome);

  // Top marquee
  const marquee = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.28, 0.2), whiteMat);
  marquee.position.set(0, 1.72, 0.4);
  group.add(marquee);

  return group;
}

/**
 * Creates glossy, cartoon Red Blood Cells (Erythrocytes)
 * Stylized biconcave doughnut with bouncy cartoon shine!
 */
export function createRedBloodCell(radius = 0.65): THREE.Mesh {
  const points: THREE.Vector2[] = [];
  for (let deg = 0; deg <= 180; deg += 10) {
    const rad = (deg * Math.PI) / 180;
    const x = Math.sin(rad) * radius * (1 - 0.32 * Math.sin(rad));
    const y = Math.cos(rad) * radius * 0.38;
    points.push(new THREE.Vector2(x, y));
  }

  const geo = new THREE.LatheGeometry(points, 18);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e, // Vibrant juicy candy red
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.92
  });

  const mesh = new THREE.Mesh(geo, mat);
  return mesh;
}

/**
 * Creates a chunky, spinning cartoon golden coin pickup with contact shadow
 */
export function createCoinModel(radius = 0.45): THREE.Group {
  const group = new THREE.Group();
  group.name = 'coin';

  group.add(createContactShadow(radius * 1.5));

  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Bright cartoon gold
    roughness: 0.15,
    metalness: 0.75,
    emissive: 0xd97706,
    emissiveIntensity: 0.35
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a, // Shiny pale gold rim
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.5
  });

  const coinGroup = new THREE.Group();
  coinGroup.name = 'coinMesh';
  coinGroup.position.y = 0.55;

  // Coin cylinder body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.14, 18), coinMat);
  body.castShadow = true;
  coinGroup.add(body);

  // Outer beveled rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.05, 8, 20), rimMat);
  rim.rotation.x = Math.PI / 2;
  coinGroup.add(rim);

  // Star emblem in center
  const star = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.4, 8, 8), rimMat);
  star.scale.set(1, 0.4, 1);
  coinGroup.add(star);

  group.add(coinGroup);
  return group;
}
