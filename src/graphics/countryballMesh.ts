import * as THREE from 'three';
import { CountryId, BallEmotion } from '../types/game';

/**
 * Draws a single flag motif inside a given sub-rectangle of the canvas.
 * Center is at (offsetX + width / 2, offsetY + height / 2).
 */
function drawSingleFlag(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  w: number,
  h: number,
  countryId: CountryId,
  customImage?: HTMLImageElement | null
) {
  const cx = offsetX + w / 2;
  const cy = offsetY + h / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(offsetX, offsetY, w, h);
  ctx.clip();

  switch (countryId) {
    case 'poland': {
      // Polandball canonical rule: red top, white bottom
      ctx.fillStyle = '#dc143c';
      ctx.fillRect(offsetX, offsetY, w, h / 2);
      ctx.fillStyle = '#f8f8fa';
      ctx.fillRect(offsetX, offsetY + h / 2, w, h / 2);
      break;
    }
    case 'japan': {
      // White field with Hinomaru red sun centered right between eyes!
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(offsetX, offsetY, w, h);
      ctx.fillStyle = '#bc002d';
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'palau': {
      // Sky blue with bright yellow disc centered right between eyes!
      ctx.fillStyle = '#4aafe8';
      ctx.fillRect(offsetX, offsetY, w, h);
      ctx.fillStyle = '#ffce00';
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'carrot': {
      // White field with carrot centered right between eyes!
      ctx.fillStyle = '#f5f5f7';
      ctx.fillRect(offsetX, offsetY, w, h);

      ctx.save();
      ctx.translate(cx, cy);

      // Green leafy top
      ctx.fillStyle = '#8bc34a';
      ctx.beginPath();
      ctx.ellipse(-14, -65, 16, 32, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(14, -68, 14, 30, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -78, 15, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Orange carrot root cone
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.moveTo(-36, -42);
      ctx.bezierCurveTo(-32, -5, -10, 75, 0, 95);
      ctx.bezierCurveTo(10, 75, 32, -5, 36, -42);
      ctx.bezierCurveTo(24, -55, -24, -55, -36, -42);
      ctx.closePath();
      ctx.fill();

      // Carrot segment lines
      ctx.strokeStyle = '#f57c00';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-20, -18);
      ctx.lineTo(12, -14);
      ctx.moveTo(-14, 15);
      ctx.lineTo(16, 20);
      ctx.moveTo(-8, 48);
      ctx.lineTo(10, 52);
      ctx.stroke();

      ctx.restore();
      break;
    }
    case 'germany': {
      // Black, Red, Gold horizontal stripes
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(offsetX, offsetY, w, h / 3);
      ctx.fillStyle = '#dd0000';
      ctx.fillRect(offsetX, offsetY + h / 3, w, h / 3);
      ctx.fillStyle = '#ffce00';
      ctx.fillRect(offsetX, offsetY + (h * 2) / 3, w, h / 3);
      break;
    }
    case 'usa': {
      // 13 Stripes
      const stripeH = h / 13;
      for (let i = 0; i < 13; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#b22234' : '#ffffff';
        ctx.fillRect(offsetX, offsetY + i * stripeH, w, stripeH);
      }
      // Blue Canton
      ctx.fillStyle = '#3c3b6e';
      ctx.fillRect(offsetX, offsetY, w * 0.46, stripeH * 7);

      // Stars in canton
      ctx.fillStyle = '#ffffff';
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 6; col++) {
          const starX = offsetX + 25 + (col * (w * 0.46 - 50)) / 5;
          const starY = offsetY + 18 + (row * (stripeH * 7 - 36)) / 4;
          ctx.beginPath();
          ctx.arc(starX, starY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'france': {
      // Blue, White, Red vertical tricolor
      ctx.fillStyle = '#002654';
      ctx.fillRect(offsetX, offsetY, w / 3, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(offsetX + w / 3, offsetY, w / 3, h);
      ctx.fillStyle = '#ed2939';
      ctx.fillRect(offsetX + (w * 2) / 3, offsetY, w / 3, h);
      break;
    }
    case 'uk': {
      // Union Jack
      ctx.fillStyle = '#012169';
      ctx.fillRect(offsetX, offsetY, w, h);

      // White saltire diagonals
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 60;
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.lineTo(offsetX + w, offsetY + h);
      ctx.moveTo(offsetX + w, offsetY);
      ctx.lineTo(offsetX, offsetY + h);
      ctx.stroke();

      // Red saltire diagonals
      ctx.strokeStyle = '#c8102e';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.lineTo(offsetX + w, offsetY + h);
      ctx.moveTo(offsetX + w, offsetY);
      ctx.lineTo(offsetX, offsetY + h);
      ctx.stroke();

      // White cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 45, offsetY, 90, h);
      ctx.fillRect(offsetX, cy - 45, w, 90);

      // Red cross
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(cx - 25, offsetY, 50, h);
      ctx.fillRect(offsetX, cy - 25, w, 50);
      break;
    }
    case 'ukraine': {
      // Azure sky over yellow wheat
      ctx.fillStyle = '#0057b7';
      ctx.fillRect(offsetX, offsetY, w, h / 2);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(offsetX, offsetY + h / 2, w, h / 2);
      break;
    }
    case 'italy': {
      // Green, White, Red vertical tricolor
      ctx.fillStyle = '#009246';
      ctx.fillRect(offsetX, offsetY, w / 3, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(offsetX + w / 3, offsetY, w / 3, h);
      ctx.fillStyle = '#ce2b37';
      ctx.fillRect(offsetX + (w * 2) / 3, offsetY, w / 3, h);
      break;
    }
    case 'brazil': {
      // Green field, yellow rhombus, blue disc
      ctx.fillStyle = '#009b3a';
      ctx.fillRect(offsetX, offsetY, w, h);

      ctx.fillStyle = '#fedf00';
      ctx.beginPath();
      ctx.moveTo(cx, offsetY + 40);
      ctx.lineTo(offsetX + w - 50, cy);
      ctx.lineTo(cx, offsetY + h - 40);
      ctx.lineTo(offsetX + 50, cy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#002776';
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(cx, cy + 10, h * 0.26, -0.9, -2.2, true);
      ctx.stroke();
      break;
    }
    case 'canada': {
      // Red, White, Red vertical bands
      ctx.fillStyle = '#d80621';
      ctx.fillRect(offsetX, offsetY, w / 4, h);
      ctx.fillRect(offsetX + (w * 3) / 4, offsetY, w / 4, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(offsetX + w / 4, offsetY, w / 2, h);

      ctx.fillStyle = '#d80621';
      ctx.beginPath();
      ctx.arc(cx, cy - 20, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - 38, cy, 38, 0, Math.PI * 2);
      ctx.arc(cx + 38, cy, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 6, cy, 12, 55);
      break;
    }
    case 'custom': {
      if (customImage && customImage.complete && customImage.naturalWidth > 0) {
        // Fill clean white base so transparent PNGs/SVGs look crisp
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(offsetX, offsetY, w, h);

        const imgAspect = customImage.naturalWidth / customImage.naturalHeight;
        let dw = w;
        let dh = h;
        let dx = offsetX;
        let dy = offsetY;

        // Maintain aspect ratio centered on the hemisphere
        if (imgAspect > 1.0) {
          dh = Math.min(h, w / imgAspect);
          dy = offsetY + (h - dh) / 2;
          ctx.drawImage(customImage, dx, dy, dw, dh);
        } else {
          dw = Math.min(w, h * imgAspect);
          dx = offsetX + (w - dw) / 2;
          ctx.drawImage(customImage, dx, dy, dw, dh);
        }
      } else {
        // Fallback placeholder pattern
        ctx.fillStyle = '#263238';
        ctx.fillRect(offsetX, offsetY, w, h);
        ctx.fillStyle = '#ffca28';
        ctx.font = 'bold 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CUSTOM FLAG', cx, cy);
      }
      break;
    }
  }

  ctx.restore();
}

/**
 * Creates Dual-Face Flag Texture:
 * "国旗は二枚をボールにつけます。前面(目と同じ面)と後面。
 * 簡単に言うと、日本ボールとかは日の丸が目と目の間に来るイメージ"
 *
 * In Three.js SphereGeometry:
 * +Z (front face, between eyes) corresponds to UV u = 0.75 (pixel x = 768).
 * -Z (back face) corresponds to UV u = 0.25 (pixel x = 256).
 * Drawing Flag on [0, 512] puts emblem centered on back face.
 * Drawing Flag on [512, 1024] puts emblem centered right between the eyes on the front!
 */
export function createFlagTexture(
  countryId: CountryId,
  customImage?: HTMLImageElement | null
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const halfW = 512;
  const h = 512;

  // 1. Back Face Flag (u = 0.0 to 0.5, centered at u = 0.25 / x = 256)
  drawSingleFlag(ctx, 0, 0, halfW, h, countryId, customImage);

  // 2. Front Face Flag (u = 0.5 to 1.0, centered at u = 0.75 / x = 768, right between the eyes!)
  drawSingleFlag(ctx, halfW, 0, halfW, h, countryId, customImage);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates the Stylized Polandball Geometry
 */
export function createCountryballGeometry(radius: number = 0.8): THREE.BufferGeometry {
  const widthSegments = 48;
  const heightSegments = 36;
  const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

  const posAttr = geo.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    const u = vertex.y / radius;

    // Height compression (dumpling / mochi proportions)
    vertex.y *= 0.90;

    let horizontalScale = 1.0;
    if (u < 0) {
      const t = -u;
      horizontalScale = 1.0 + 0.10 * Math.sin(t * Math.PI * 0.7);
    } else {
      const t = u;
      horizontalScale = 1.0 - 0.12 * Math.pow(t, 1.4);
    }

    if (u < -0.7) {
      const bottomT = (-u - 0.7) / 0.3;
      vertex.y += bottomT * 0.05 * radius;
    }

    vertex.x *= horizontalScale;
    vertex.z *= horizontalScale;

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Inverted Hull Outline Material
 */
export function createCountryballOutlineMaterial(outlineWidth: number = 0.095): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      outlineWidth: { value: outlineWidth },
      outlineColor: { value: new THREE.Color(0x101014) },
    },
    vertexShader: `
      uniform float outlineWidth;
      void main() {
        vec3 displaced = position + normal * outlineWidth;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 outlineColor;
      void main() {
        gl_FragColor = vec4(outlineColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: true,
  });
}

/**
 * Generates the authentic Polandball Eye Texture:
 * - Large, prominent arched dome eye (matching user's Germany ball image)
 * - Soft steel-blue eyelid shadow on top
 * - Pure white lower half
 * - Thick, bold black outline that scales with the body outline
 */
export function createPolandballEyeTexture(
  emotion: BallEmotion,
  isLeft: boolean,
  outlineWidth: number = 0.095
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  ctx.save();
  ctx.translate(cx, cy);

  const outlineFactor = Math.max(0.4, outlineWidth / 0.075);
  const borderThickness = Math.round(54 * outlineFactor);

  if (emotion === 'happy') {
    ctx.lineWidth = Math.round(56 * outlineFactor);
    ctx.strokeStyle = '#101015';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -10, 165, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.stroke();
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  if (emotion === 'blink') {
    ctx.lineWidth = Math.round(48 * outlineFactor);
    ctx.strokeStyle = '#101015';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-165, 0);
    ctx.lineTo(165, 0);
    ctx.stroke();
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Draw eye outline: Large, round-domed Polandball eye (Even larger & bolder!)
  const slant = isLeft ? 15 : -15;
  const w = emotion === 'worried' ? 195 : 185;
  const hTop = emotion === 'worried' ? -205 : (emotion === 'squint' ? -80 : -175);
  const hBottom = 160;

  ctx.beginPath();
  // Bottom line: slightly bowed
  ctx.moveTo(-w + 12, hBottom);
  ctx.quadraticCurveTo(0, hBottom + 14, w - 12, hBottom);

  // Right side curving upward into top dome
  ctx.bezierCurveTo(w * 1.08, (hTop + hBottom) * 0.5, w * 0.85, hTop + slant, 0, hTop - 8);

  // Left side curving downward from top dome
  ctx.bezierCurveTo(-w * 0.85, hTop - slant, -w * 1.08, (hTop + hBottom) * 0.5, -w + 12, hBottom);
  ctx.closePath();

  // 1. Fill base white
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // 2. Soft Light-Blue Upper Eyelid Shadow
  ctx.save();
  ctx.clip();

  const shadowHeight = (hBottom - hTop) * 0.46;
  const grad = ctx.createLinearGradient(0, hTop - 25, 0, hTop + shadowHeight);
  grad.addColorStop(0.0, '#9cb8d5');
  grad.addColorStop(0.65, '#b8ceea');
  grad.addColorStop(1.0, '#dbe7f5');

  ctx.fillStyle = grad;
  ctx.fillRect(-w * 1.5, hTop - 35, w * 3, shadowHeight + 35);
  ctx.restore();

  // 3. Thick, Bold Black Comic Border
  ctx.lineWidth = borderThickness;
  ctx.strokeStyle = '#101014';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates a standalone 3D Eye assembly (Large & Bold!)
 */
export function createEye3DPart(
  isLeft: boolean,
  outlineWidth: number = 0.095
): { group: THREE.Group; mesh: THREE.Mesh; material: THREE.MeshStandardMaterial } {
  const eyeGroup = new THREE.Group();

  // Front Textured Eye Plate (Large size: 0.88 x 0.86)
  const frontGeo = new THREE.PlaneGeometry(0.88, 0.86);
  const tex = createPolandballEyeTexture('normal', isLeft, outlineWidth);
  const frontMat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    roughness: 0.25,
    metalness: 0.0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const frontMesh = new THREE.Mesh(frontGeo, frontMat);
  frontMesh.renderOrder = 10;
  eyeGroup.add(frontMesh);

  return { group: eyeGroup, mesh: frontMesh, material: frontMat };
}

/**
 * Composite Countryball 3D Actor
 */
export class CountryballActor {
  public group: THREE.Group;
  public bodyMesh: THREE.Mesh;
  public outlineMesh: THREE.Mesh;
  public eyesGroup: THREE.Group;
  public leftEye: THREE.Group;
  public rightEye: THREE.Group;
  private leftEyePart: { group: THREE.Group; mesh: THREE.Mesh; material: THREE.MeshStandardMaterial };
  private rightEyePart: { group: THREE.Group; mesh: THREE.Mesh; material: THREE.MeshStandardMaterial };
  public accessoryGroup: THREE.Group;

  private flagTexture: THREE.CanvasTexture;
  private currentCountry: CountryId;
  private currentCustomImage: HTMLImageElement | null = null;
  private currentEmotion: BallEmotion = 'normal';
  private currentOutlineWidth: number = 0.095;
  private currentEyeScale: number = 1.0;
  private currentEyeSpacing: number = 1.0;
  private outlineMaterial: THREE.ShaderMaterial;
  private bodyMaterial: THREE.MeshStandardMaterial;

  constructor(
    countryId: CountryId = 'poland',
    radius: number = 0.8,
    customImage?: HTMLImageElement | null,
    eyeScale: number = 1.0,
    eyeSpacing: number = 1.0
  ) {
    this.currentCountry = countryId;
    this.currentCustomImage = customImage || null;
    this.currentEyeScale = eyeScale;
    this.currentEyeSpacing = eyeSpacing;
    this.group = new THREE.Group();

    // 1. Create Base Gumdrop Geometry (Smooth, Stylized Non-Spherical)
    const geo = createCountryballGeometry(radius);

    // 2. Dual-Face Flag Texture & PBR Body Material
    this.flagTexture = createFlagTexture(countryId, this.currentCustomImage);
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.flagTexture,
      roughness: 0.35,
      metalness: 0.05,
    });
    this.bodyMesh = new THREE.Mesh(geo, this.bodyMaterial);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // 3. Inverted Hull Comic Outline Mesh
    this.outlineMaterial = createCountryballOutlineMaterial(this.currentOutlineWidth);
    this.outlineMesh = new THREE.Mesh(geo.clone(), this.outlineMaterial);
    this.group.add(this.outlineMesh);

    // 4. Standalone 3D Eye Parts (Large & Bold, proud of front surface)
    this.eyesGroup = new THREE.Group();
    this.eyesGroup.position.set(0, 0.055, 0.865);

    this.leftEyePart = createEye3DPart(true, this.currentOutlineWidth);
    this.rightEyePart = createEye3DPart(false, this.currentOutlineWidth);
    this.leftEye = this.leftEyePart.group;
    this.rightEye = this.rightEyePart.group;

    this.leftEye.rotation.x = -0.04;
    this.leftEye.rotation.z = -0.04;
    this.rightEye.rotation.x = -0.04;
    this.rightEye.rotation.z = 0.04;

    this.eyesGroup.add(this.leftEye);
    this.eyesGroup.add(this.rightEye);
    this.group.add(this.eyesGroup);

    this.setEyeSpacing(eyeSpacing);
    this.setEyeScale(eyeScale);

    // 5. Accessories
    this.accessoryGroup = new THREE.Group();
    this.group.add(this.accessoryGroup);
    this.updateAccessories(countryId, radius);
  }

  public setEyeScale(scale: number) {
    this.currentEyeScale = Math.max(0.4, Math.min(2.5, scale));
    this.eyesGroup.scale.set(this.currentEyeScale, this.currentEyeScale, this.currentEyeScale);
    this.eyesGroup.position.set(0, 0.055, 0.865 + (this.currentEyeScale - 1.0) * 0.025);
  }

  public setEyeSpacing(spacing: number) {
    this.currentEyeSpacing = Math.max(0.3, Math.min(2.5, spacing));
    const baseSpacing = 0.30;
    const actualSpacing = baseSpacing * this.currentEyeSpacing;

    // As eyes move further to the sides of the round ball, angle them naturally
    const angleY = Math.min(0.65, actualSpacing * 0.93);
    // Slight curvature depth offset so eyes conform to the curved ball surface
    const zOffset = -Math.max(0, (actualSpacing - 0.30) * 0.16);

    this.leftEye.position.set(-actualSpacing, 0, zOffset);
    this.leftEye.rotation.y = -angleY;

    this.rightEye.position.set(actualSpacing, 0, zOffset);
    this.rightEye.rotation.y = angleY;
  }

  public setCountry(countryId: CountryId, customImage?: HTMLImageElement | null) {
    this.currentCountry = countryId;
    if (customImage !== undefined) {
      this.currentCustomImage = customImage;
    }
    this.flagTexture.dispose();
    this.flagTexture = createFlagTexture(countryId, this.currentCustomImage);
    this.bodyMaterial.map = this.flagTexture;
    this.bodyMaterial.needsUpdate = true;
    this.updateAccessories(countryId, 0.8);
  }

  public setEmotion(emotion: BallEmotion) {
    if (this.currentEmotion === emotion) return;
    this.currentEmotion = emotion;

    const oldLeftMap = this.leftEyePart.material.map;
    const oldRightMap = this.rightEyePart.material.map;

    const newLeftMap = createPolandballEyeTexture(emotion, true, this.currentOutlineWidth);
    const newRightMap = createPolandballEyeTexture(emotion, false, this.currentOutlineWidth);

    this.leftEyePart.material.map = newLeftMap;
    this.rightEyePart.material.map = newRightMap;
    this.leftEyePart.material.needsUpdate = true;
    this.rightEyePart.material.needsUpdate = true;

    if (oldLeftMap) oldLeftMap.dispose();
    if (oldRightMap) oldRightMap.dispose();

    switch (emotion) {
      case 'happy': {
        this.leftEye.scale.set(1.0, 1.0, 1.0);
        this.rightEye.scale.set(1.0, 1.0, 1.0);
        this.leftEye.rotation.z = -0.05;
        this.rightEye.rotation.z = 0.05;
        break;
      }
      case 'worried': {
        this.leftEye.scale.set(1.15, 1.2, 1.0);
        this.rightEye.scale.set(1.15, 1.2, 1.0);
        this.leftEye.rotation.z = 0.06;
        this.rightEye.rotation.z = -0.06;
        break;
      }
      case 'blink': {
        this.leftEye.scale.set(1.0, 1.0, 1.0);
        this.rightEye.scale.set(1.0, 1.0, 1.0);
        break;
      }
      case 'squint': {
        this.leftEye.scale.set(1.0, 0.65, 1.0);
        this.rightEye.scale.set(1.0, 0.65, 1.0);
        break;
      }
      case 'normal':
      default: {
        this.leftEye.scale.set(1.0, 1.0, 1.0);
        this.rightEye.scale.set(1.0, 1.0, 1.0);
        this.leftEye.rotation.z = -0.04;
        this.rightEye.rotation.z = 0.04;
        break;
      }
    }
  }

  public setOutlineThickness(thickness: number) {
    this.currentOutlineWidth = thickness;
    this.outlineMaterial.uniforms.outlineWidth.value = thickness;

    const oldLeftMap = this.leftEyePart.material.map;
    const oldRightMap = this.rightEyePart.material.map;

    const newLeftMap = createPolandballEyeTexture(this.currentEmotion, true, thickness);
    const newRightMap = createPolandballEyeTexture(this.currentEmotion, false, thickness);

    this.leftEyePart.material.map = newLeftMap;
    this.rightEyePart.material.map = newRightMap;
    this.leftEyePart.material.needsUpdate = true;
    this.rightEyePart.material.needsUpdate = true;

    if (oldLeftMap) oldLeftMap.dispose();
    if (oldRightMap) oldRightMap.dispose();
  }

  private updateAccessories(countryId: CountryId, radius: number) {
    while (this.accessoryGroup.children.length > 0) {
      const child = this.accessoryGroup.children[0] as THREE.Mesh;
      this.accessoryGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }

    if (countryId === 'usa') {
      const glassGroup = new THREE.Group();
      const lensGeo = new THREE.BoxGeometry(0.36, 0.25, 0.06);
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x111115,
        roughness: 0.1,
        metalness: 0.9,
      });
      const leftLens = new THREE.Mesh(lensGeo, lensMat);
      leftLens.position.set(-0.26, 0.06, radius * 0.96);
      leftLens.rotation.y = -0.15;

      const rightLens = new THREE.Mesh(lensGeo, lensMat);
      rightLens.position.set(0.26, 0.06, radius * 0.96);
      rightLens.rotation.y = 0.15;

      const bridgeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22);
      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set(0, 0.1, radius * 0.96);

      glassGroup.add(leftLens);
      glassGroup.add(rightLens);
      glassGroup.add(bridge);
      this.accessoryGroup.add(glassGroup);
    } else if (countryId === 'uk') {
      const hatGroup = new THREE.Group();
      const brimGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 32);
      const crownGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.45, 32);
      const bandGeo = new THREE.CylinderGeometry(0.385, 0.385, 0.08, 32);

      const feltMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.9 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.6 });

      const brim = new THREE.Mesh(brimGeo, feltMat);
      brim.position.y = radius * 0.76;
      const crown = new THREE.Mesh(crownGeo, feltMat);
      crown.position.y = radius * 0.76 + 0.23;
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = radius * 0.76 + 0.06;

      hatGroup.add(brim);
      hatGroup.add(crown);
      hatGroup.add(band);
      hatGroup.rotation.z = -0.15;
      hatGroup.rotation.x = -0.05;
      this.accessoryGroup.add(hatGroup);
    } else if (countryId === 'japan') {
      const bandGeo = new THREE.TorusGeometry(radius * 0.88, 0.035, 12, 36);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.25;

      const dotGeo = new THREE.CircleGeometry(0.08, 24);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xbc002d });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(0, 0.25, radius * 0.9);
      this.accessoryGroup.add(band);
      this.accessoryGroup.add(dot);
    }
  }

  public setSquash(squashY: number, squashXZ: number) {
    this.group.scale.set(squashXZ, squashY, squashXZ);
  }

  public dispose() {
    this.flagTexture.dispose();
    this.bodyMaterial.dispose();
    this.outlineMaterial.dispose();
    this.bodyMesh.geometry.dispose();
    this.outlineMesh.geometry.dispose();
    if (this.leftEyePart.material.map) this.leftEyePart.material.map.dispose();
    if (this.rightEyePart.material.map) this.rightEyePart.material.map.dispose();
    this.leftEyePart.material.dispose();
    this.rightEyePart.material.dispose();
    this.leftEyePart.mesh.geometry.dispose();
    this.rightEyePart.mesh.geometry.dispose();
  }
}
