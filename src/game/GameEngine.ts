import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CountryId, StageDefinition, GameSettings, RemotePlayerState } from '../types/game';
import { CountryballActor } from '../graphics/countryballMesh';
import { PhysicsEngine, InputState } from '../physics/physicsEngine';
import { STAGES } from '../stages/stageData';

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;

  // Game Systems
  public physics: PhysicsEngine;
  public countryball: CountryballActor;
  public currentStageIndex: number = 1; // default to Stage 1 or 0 for room

  // Remote Players in 3D
  private remotePlayerMeshes: Map<
    string,
    {
      actor: CountryballActor;
      nameSprite: THREE.Sprite;
      bubbleSprite: THREE.Sprite;
      lastText: string;
      targetPos: THREE.Vector3;
      targetYaw: number;
      currentCountry?: CountryId;
      currentCustomFlag?: string;
    }
  > = new Map();

  // PeerRoom Beachballs
  private beachBalls: { mesh: THREE.Mesh; pos: THREE.Vector3; vel: THREE.Vector3; radius: number }[] = [];

  // Camera Control State (Minecraft-like look)
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.35;
  public cameraDistance: number = 7.0;
  public isPointerLocked: boolean = false;
  private walkCyclePhase: number = 0;
  private currentFacingYaw: number = 0;

  // Custom Flag Image
  private customFlagImage: HTMLImageElement | null = null;

  // Input State
  private inputs: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
  };

  // Scene Objects
  private stageGroup: THREE.Group;
  private obstacleMeshes: Map<string, THREE.Object3D> = new Map();
  private starMeshes: Map<string, THREE.Group> = new Map();
  private checkpointMeshes: Map<string, THREE.Group> = new Map();
  private goalMesh: THREE.Group | null = null;
  private shadowPlane: THREE.Mesh | null = null;

  // Particle System
  private dustParticles: THREE.InstancedMesh | null = null;
  private dustCount = 40;
  private dustData: { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number; scale: number }[] = [];

  // Scratch vectors for render loop to avoid GC
  private _camTarget = new THREE.Vector3();
  private _desiredCamPos = new THREE.Vector3();
  private _tempMat = new THREE.Matrix4();
  private _tempPos = new THREE.Vector3();
  private _tempScale = new THREE.Vector3();
  private _tempQuat = new THREE.Quaternion();

  // Settings
  public settings: GameSettings = {
    mouseSensitivity: 0.0028,
    soundEnabled: true,
    bgmEnabled: false,
    outlineThickness: 0.095,
    cameraDistance: 7.0,
  };

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Pointer lock state listener
  public onPointerLockChange?: (locked: boolean) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Scene Setup
    this.scene = new THREE.Scene();

    // 2. Camera Setup
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 400);

    // 3. Renderer Setup
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Directional Key Light & Hemisphere Fill
    this.dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.dirLight.position.set(20, 45, 25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 150;
    const d = 35;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x445566, 0.9);
    this.scene.add(this.hemiLight);

    // 6. Physics & Countryball
    this.physics = new PhysicsEngine();
    this.countryball = new CountryballActor('poland', this.physics.ballRadius);
    this.scene.add(this.countryball.group);

    // Contact shadow plane beneath countryball
    const shadowGeo = new THREE.PlaneGeometry(2.2, 2.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x090a10,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadowPlane);

    // 7. Stage Group
    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);

    // 8. Dust Particle System
    this.initDustParticles();

    // 9. Input & Window Event Listeners (Minecraft-like look)
    this.setupEventListeners();

    // 10. Load Initial Stage
    this.loadStage(1);

    // 11. Start Loop
    this.startLoop();
  }

  private initDustParticles() {
    const geo = new THREE.DodecahedronGeometry(0.12, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.8,
      transparent: true,
      opacity: 0.6,
    });
    this.dustParticles = new THREE.InstancedMesh(geo, mat, this.dustCount);
    this.dustParticles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < this.dustCount; i++) {
      this.dustData.push({
        pos: new THREE.Vector3(0, -100, 0),
        vel: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        scale: 0.1,
      });
      this._tempMat.makeTranslation(0, -100, 0);
      this.dustParticles.setMatrixAt(i, this._tempMat);
    }
    this.dustParticles.instanceMatrix.needsUpdate = true;
    this.scene.add(this.dustParticles);
  }

  private spawnDust(x: number, y: number, z: number, vx: number, vz: number) {
    if (!this.dustParticles) return;
    for (let i = 0; i < this.dustCount; i++) {
      const p = this.dustData[i];
      if (p.life <= 0) {
        p.pos.set(x + (Math.random() - 0.5) * 0.4, y + 0.08, z + (Math.random() - 0.5) * 0.4);
        p.vel.set(
          -vx * 0.2 + (Math.random() - 0.5) * 1.5,
          0.8 + Math.random() * 1.5,
          -vz * 0.2 + (Math.random() - 0.5) * 1.5
        );
        p.life = p.maxLife;
        p.scale = 0.8 + Math.random() * 0.5;
        break;
      }
    }
  }

  private updateDust(dt: number) {
    if (!this.dustParticles) return;
    let needsUpdate = false;

    for (let i = 0; i < this.dustCount; i++) {
      const p = this.dustData[i];
      if (p.life > 0) {
        p.life -= dt;
        p.pos.addScaledVector(p.vel, dt);
        p.vel.y -= 3.0 * dt;

        const progress = 1.0 - p.life / p.maxLife;
        const currentScale = p.scale * (1.0 - progress * 0.8);

        this._tempPos.copy(p.pos);
        this._tempScale.set(currentScale, currentScale, currentScale);
        this._tempMat.compose(this._tempPos, this._tempQuat, this._tempScale);
        this.dustParticles.setMatrixAt(i, this._tempMat);
        needsUpdate = true;
      } else {
        this._tempMat.makeTranslation(0, -100, 0);
        this.dustParticles.setMatrixAt(i, this._tempMat);
      }
    }

    if (needsUpdate) {
      this.dustParticles.instanceMatrix.needsUpdate = true;
    }
  }

  public setCustomFlag(dataUrl: string) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.customFlagImage = img;
      this.countryball.setCountry('custom', img);
    };
    img.src = dataUrl;
  }

  public loadStage(stageIndex: number) {
    this.currentStageIndex = stageIndex;
    const stage = STAGES[stageIndex];
    if (!stage) return;

    // Reset scene background & fog
    this.scene.background = new THREE.Color(stage.skyColor);
    this.scene.fog = new THREE.FogExp2(stage.fogColor, stage.isRoom ? 0.008 : 0.012);

    // Clear old stage meshes
    while (this.stageGroup.children.length > 0) {
      const obj = this.stageGroup.children[0];
      this.stageGroup.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
    }
    this.obstacleMeshes.clear();
    this.starMeshes.clear();
    this.checkpointMeshes.clear();
    this.beachBalls = [];

    // Reset star collected status
    stage.stars.forEach((s) => (s.collected = false));
    stage.checkpoints.forEach((c) => (c.reached = false));

    // Build stage visual geometry
    this.buildStageMeshes(stage);

    // If PeerRoom, add fun beachballs!
    if (stage.isRoom) {
      this.initPeerRoomBeachBalls();
    }

    // Pass to physics engine
    this.physics.loadStage(stage);

    // Reset camera orientation
    this.cameraYaw = 0;
    this.cameraPitch = 0.35;
  }

  private initPeerRoomBeachBalls() {
    const ballColors = [0xff1744, 0x00e676, 0xffea00];
    const initialPositions = [
      new THREE.Vector3(3, 2, 4),
      new THREE.Vector3(-4, 2, -3),
      new THREE.Vector3(5, 2, -6),
    ];

    ballColors.forEach((col, idx) => {
      const r = 1.1;
      const geo = new THREE.SphereGeometry(r, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.25,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.copy(initialPositions[idx]);
      this.stageGroup.add(mesh);

      this.beachBalls.push({
        mesh,
        pos: initialPositions[idx].clone(),
        vel: new THREE.Vector3(0, 0, 0),
        radius: r,
      });
    });
  }

  private buildStageMeshes(stage: StageDefinition) {
    for (const obs of stage.obstacles) {
      const group = new THREE.Group();
      group.position.set(obs.position.x, obs.position.y, obs.position.z);

      switch (obs.type) {
        case 'platform':
        case 'moving_platform':
        case 'tilting_bridge': {
          const sx = obs.size?.x || 4;
          const sy = obs.size?.y || 1;
          const sz = obs.size?.z || 4;

          const boxGeo = new THREE.BoxGeometry(sx, sy, sz);
          const boxMat = new THREE.MeshStandardMaterial({
            color: obs.color || 0x64b5f6,
            roughness: 0.45,
            metalness: 0.1,
          });
          const boxMesh = new THREE.Mesh(boxGeo, boxMat);
          boxMesh.castShadow = true;
          boxMesh.receiveShadow = true;
          group.add(boxMesh);

          const trimGeo = new THREE.BoxGeometry(sx + 0.06, 0.12, sz + 0.06);
          const trimMat = new THREE.MeshStandardMaterial({
            color: 0x222228,
            roughness: 0.8,
          });
          const trimMesh = new THREE.Mesh(trimGeo, trimMat);
          trimMesh.position.y = sy / 2;
          group.add(trimMesh);

          if (obs.type === 'moving_platform') {
            const stripeGeo = new THREE.BoxGeometry(sx + 0.02, sy * 0.4, sz + 0.02);
            const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffb300 });
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            group.add(stripe);
          }
          break;
        }

        case 'jump_pad': {
          const sx = obs.size?.x || 2.5;
          const sz = obs.size?.z || 2.5;

          const baseGeo = new THREE.CylinderGeometry(sx * 0.55, sx * 0.6, 0.3, 24);
          const baseMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8, roughness: 0.3 });
          const base = new THREE.Mesh(baseGeo, baseMat);
          base.position.y = 0.15;
          base.receiveShadow = true;
          group.add(base);

          const padGeo = new THREE.CylinderGeometry(sx * 0.48, sx * 0.48, 0.15, 24);
          const padMat = new THREE.MeshStandardMaterial({
            color: obs.color || 0xff4081,
            emissive: obs.color || 0xff4081,
            emissiveIntensity: 0.35,
            roughness: 0.2,
          });
          const pad = new THREE.Mesh(padGeo, padMat);
          pad.position.y = 0.32;
          group.add(pad);

          const arrowGeo = new THREE.ConeGeometry(0.35, 0.4, 3);
          const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const arrow = new THREE.Mesh(arrowGeo, arrowMat);
          arrow.rotation.x = -Math.PI / 2;
          arrow.position.set(0, 0.42, 0);
          group.add(arrow);
          break;
        }

        case 'speed_booster': {
          const sx = obs.size?.x || 2.5;
          const sz = obs.size?.z || 4.0;

          const baseGeo = new THREE.BoxGeometry(sx, 0.15, sz);
          const baseMat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.8, roughness: 0.4 });
          const base = new THREE.Mesh(baseGeo, baseMat);
          base.position.y = 0.08;
          group.add(base);

          for (let a = -1; a <= 1; a++) {
            const chevGeo = new THREE.ConeGeometry(0.4, 0.55, 3);
            const chevMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
            const chev = new THREE.Mesh(chevGeo, chevMat);
            chev.rotation.x = -Math.PI / 2;
            chev.position.set(0, 0.18, a * 1.1);
            group.add(chev);
          }
          break;
        }

        case 'pinball_bumper': {
          const rad = obs.radius || 1.2;

          const bBaseGeo = new THREE.CylinderGeometry(rad * 0.9, rad * 1.15, 0.4, 24);
          const bBaseMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.9, roughness: 0.2 });
          const bBase = new THREE.Mesh(bBaseGeo, bBaseMat);
          bBase.position.y = 0.2;
          group.add(bBase);

          const domeGeo = new THREE.SphereGeometry(rad * 0.85, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
          const domeMat = new THREE.MeshStandardMaterial({
            color: obs.color || 0xff1744,
            emissive: obs.color || 0xff1744,
            emissiveIntensity: 0.4,
            roughness: 0.1,
          });
          const dome = new THREE.Mesh(domeGeo, domeMat);
          dome.position.y = 0.35;
          group.add(dome);

          const jewelGeo = new THREE.DodecahedronGeometry(rad * 0.3);
          const jewelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const jewel = new THREE.Mesh(jewelGeo, jewelMat);
          jewel.position.y = 0.9;
          group.add(jewel);
          break;
        }

        case 'spinning_hammer': {
          const towerGeo = new THREE.CylinderGeometry(0.6, 0.8, 2.2, 24);
          const towerMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8, roughness: 0.3 });
          const tower = new THREE.Mesh(towerGeo, towerMat);
          group.add(tower);

          const armLength = obs.size?.x || 6.0;
          const armGeo = new THREE.BoxGeometry(armLength, 0.4, 0.4);
          const armMat = new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.7, roughness: 0.3 });
          const arm = new THREE.Mesh(armGeo, armMat);
          arm.position.y = 1.0;

          const headGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 16);
          const headMat = new THREE.MeshStandardMaterial({
            color: obs.color || 0xd32f2f,
            roughness: 0.3,
            metalness: 0.4,
          });
          const headLeft = new THREE.Mesh(headGeo, headMat);
          headLeft.rotation.z = Math.PI / 2;
          headLeft.position.set(-armLength / 2, 0, 0);
          arm.add(headLeft);

          const headRight = new THREE.Mesh(headGeo, headMat);
          headRight.rotation.z = Math.PI / 2;
          headRight.position.set(armLength / 2, 0, 0);
          arm.add(headRight);

          group.add(arm);
          break;
        }

        case 'wind_fan': {
          const houseGeo = new THREE.BoxGeometry(obs.size?.x || 4, 3, 2);
          const houseMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.7, roughness: 0.4 });
          const house = new THREE.Mesh(houseGeo, houseMat);
          house.position.y = 1.5;
          group.add(house);

          const fanGeo = new THREE.BoxGeometry(0.3, 2.2, 0.1);
          const fanMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.3 });
          const fanBlades = new THREE.Mesh(fanGeo, fanMat);
          fanBlades.position.set(0, 1.5, 1.05);
          group.add(fanBlades);
          break;
        }
      }

      this.stageGroup.add(group);
      this.obstacleMeshes.set(obs.id, group);
    }

    // Collectible Stars
    for (const star of stage.stars) {
      const starGroup = new THREE.Group();
      starGroup.position.set(star.position.x, star.position.y, star.position.z);

      const starShape = new THREE.Shape();
      const points = 5;
      const outerR = 0.6;
      const innerR = 0.28;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
      }
      starShape.closePath();

      const extrudeSettings = { depth: 0.25, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.08, bevelThickness: 0.08 };
      const starGeo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
      starGeo.center();

      const starMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffab00,
        emissiveIntensity: 0.4,
        roughness: 0.15,
        metalness: 0.85,
      });
      const starMesh = new THREE.Mesh(starGeo, starMat);
      starGroup.add(starMesh);

      const ringGeo = new THREE.TorusGeometry(0.85, 0.03, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xfff59d, transparent: true, opacity: 0.8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      starGroup.add(ring);

      this.stageGroup.add(starGroup);
      this.starMeshes.set(star.id, starGroup);
    }

    // Goal Podium (only if not room)
    if (!stage.isRoom) {
      const goalGroup = new THREE.Group();
      goalGroup.position.set(stage.goalPoint.x, stage.goalPoint.y, stage.goalPoint.z);

      const trophyGeo = new THREE.CylinderGeometry(0.8, 0.4, 1.4, 24);
      const trophyMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffa000,
        emissiveIntensity: 0.35,
        roughness: 0.1,
        metalness: 0.95,
      });
      const trophy = new THREE.Mesh(trophyGeo, trophyMat);
      trophy.position.y = 1.2;
      goalGroup.add(trophy);

      const handleGeo = new THREE.TorusGeometry(0.4, 0.08, 12, 24, Math.PI);
      const leftHandle = new THREE.Mesh(handleGeo, trophyMat);
      leftHandle.rotation.z = Math.PI / 2;
      leftHandle.position.set(-0.75, 1.3, 0);
      const rightHandle = new THREE.Mesh(handleGeo, trophyMat);
      rightHandle.rotation.z = -Math.PI / 2;
      rightHandle.position.set(0.75, 1.3, 0);
      goalGroup.add(leftHandle);
      goalGroup.add(rightHandle);

      const beamGeo = new THREE.CylinderGeometry(stage.goalRadius * 0.9, stage.goalRadius * 0.9, 40, 32, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffeb3b,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 20;
      goalGroup.add(beam);

      this.stageGroup.add(goalGroup);
      this.goalMesh = goalGroup;
    }
  }

  // Set up Minecraft-like mouse look & inputs
  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputs.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputs.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.right = true;
          break;
        case 'Space':
          this.inputs.jump = true;
          e.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyE':
          this.inputs.dash = true;
          break;
        case 'KeyR':
          this.loadStage(this.currentStageIndex);
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputs.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputs.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.right = false;
          break;
        case 'Space':
          this.inputs.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyE':
          this.inputs.dash = false;
          break;
      }
    });

    // Minecraft-Style Pointer Lock Look (Click anywhere to look around freely!)
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) {
        this.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === canvas;
      this.isPointerLocked = locked;
      if (this.onPointerLockChange) this.onPointerLockChange(locked);
    });

    // Seamless mouse movement when pointer locked (like Minecraft)
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) {
        const sens = this.settings.mouseSensitivity;
        this.cameraYaw -= e.movementX * sens;
        this.cameraPitch += e.movementY * sens;
        this.cameraPitch = Math.max(-0.25, Math.min(1.20, this.cameraPitch));
      }
    });

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.settings.cameraDistance += e.deltaY * 0.005;
        this.settings.cameraDistance = Math.max(4.0, Math.min(13.0, this.settings.cameraDistance));
      },
      { passive: false }
    );

    window.addEventListener('resize', this.onResize);
  }

  public requestPointerLock() {
    this.renderer.domElement.requestPointerLock?.();
  }

  public exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  public setCountry(countryId: CountryId) {
    this.countryball.setCountry(countryId, this.customFlagImage);
  }

  public setOutlineThickness(thickness: number) {
    this.settings.outlineThickness = thickness;
    this.countryball.setOutlineThickness(thickness);
  }

  public setEyeSize(size: number) {
    this.countryball.setEyeScale(size);
  }

  public setEyeSpacing(spacing: number) {
    this.countryball.setEyeSpacing(spacing);
  }

  // Update or Add Remote Peer Avatar in 3D
  public updateRemotePlayer(state: RemotePlayerState) {
    let p = this.remotePlayerMeshes.get(state.id);
    if (!p) {
      const actor = new CountryballActor(
        state.country,
        this.physics.ballRadius,
        null,
        state.eyeSize || 1.0,
        state.eyeSpacing || 1.0
      );
      this.scene.add(actor.group);

      // Name sprite tag above head
      const nameSprite = this.createNameSprite(state.name);
      actor.group.add(nameSprite);
      nameSprite.position.set(0, 1.45, 0);

      // Speech bubble sprite
      const bubbleSprite = this.createSpeechBubbleSprite('');
      bubbleSprite.visible = false;
      actor.group.add(bubbleSprite);
      bubbleSprite.position.set(0, 2.1, 0);

      p = {
        actor,
        nameSprite,
        bubbleSprite,
        lastText: '',
        targetPos: new THREE.Vector3(state.position.x, state.position.y, state.position.z),
        targetYaw: state.facingYaw,
      };
      this.remotePlayerMeshes.set(state.id, p);
    }

    // Check if country or custom flag changed
    if (
      p.currentCountry !== state.country ||
      (state.country === 'custom' && p.currentCustomFlag !== state.customFlagData)
    ) {
      p.currentCountry = state.country;
      p.currentCustomFlag = state.customFlagData;

      if (state.country === 'custom' && state.customFlagData) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          p?.actor.setCountry('custom', img);
        };
        img.src = state.customFlagData;
      } else {
        p.actor.setCountry(state.country);
      }
    }

    if (state.eyeSize !== undefined) {
      p.actor.setEyeScale(state.eyeSize);
    }
    if (state.eyeSpacing !== undefined) {
      p.actor.setEyeSpacing(state.eyeSpacing);
    }

    // Update target
    p.targetPos.set(state.position.x, state.position.y, state.position.z);
    p.targetYaw = state.facingYaw;
    p.actor.setEmotion(state.emotion);
    p.actor.setSquash(state.squashY, state.squashXZ);

    // Update speech bubble if recently messaged
    if (state.lastMessage && state.lastMessageTime && Date.now() - state.lastMessageTime < 7000) {
      if (p.lastText !== state.lastMessage) {
        p.lastText = state.lastMessage;
        this.updateSpeechBubble(p.bubbleSprite, state.lastMessage);
      }
      p.bubbleSprite.visible = true;
    } else {
      p.bubbleSprite.visible = false;
    }
  }

  public removeRemotePlayer(id: string) {
    const p = this.remotePlayerMeshes.get(id);
    if (p) {
      this.scene.remove(p.actor.group);
      p.actor.dispose();
      this.remotePlayerMeshes.delete(id);
    }
  }

  private createNameSprite(name: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(20, 20, 25, 0.75)';
    ctx.roundRect(10, 10, 236, 44, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.45, 1.0);
    return sprite;
  }

  private createSpeechBubbleSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.2, 0.8, 1.0);
    return sprite;
  }

  private updateSpeechBubble(sprite: THREE.Sprite, text: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#101015';
    ctx.lineWidth = 6;
    ctx.roundRect(12, 12, 488, 90, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#101015';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.slice(0, 32), 256, 56);

    const map = new THREE.CanvasTexture(canvas);
    (sprite.material as THREE.SpriteMaterial).map?.dispose();
    (sprite.material as THREE.SpriteMaterial).map = map;
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / (h || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private startLoop() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const dt = this.clock.getDelta();
      const time = performance.now() * 0.001;

      // 1. Update Physics
      this.physics.update(dt, this.inputs, this.cameraYaw);

      // 2. Sync Local Countryball Position & Bouncy Hopping Walk
      const player = this.physics.player;
      const horizontalSpeed = Math.sqrt(
        player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z
      );

      // Facing orientation
      if (horizontalSpeed > 0.35) {
        const targetYaw = Math.atan2(player.velocity.x, player.velocity.z);
        let diff = targetYaw - this.currentFacingYaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.currentFacingYaw += diff * Math.min(1.0, 14 * dt);
      } else {
        let diff = this.cameraYaw - this.currentFacingYaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.currentFacingYaw += diff * Math.min(1.0, 4 * dt);
      }

      // Hopping walk cycle
      let hopY = 0;
      let waddleRoll = 0;
      let forwardLean = 0;
      let hopSquash = 1.0;

      if (player.isGrounded && horizontalSpeed > 0.4) {
        this.walkCyclePhase += horizontalSpeed * dt * 9.0;
        const hopStrength = Math.min(1.0, horizontalSpeed / 4.5);
        hopY = Math.abs(Math.sin(this.walkCyclePhase)) * 0.16 * hopStrength;
        waddleRoll = Math.sin(this.walkCyclePhase) * 0.08 * hopStrength;
        forwardLean = Math.min(0.2, (horizontalSpeed / 15.0) * 0.16);
        hopSquash = 1.0 + Math.sin(this.walkCyclePhase * 2.0) * 0.06 * hopStrength;
      } else if (player.isGrounded) {
        hopY = Math.sin(time * 2.5) * 0.015;
      } else {
        forwardLean = Math.max(-0.25, Math.min(0.25, player.velocity.y * 0.02));
      }

      this.countryball.group.position.set(player.position.x, player.position.y + hopY, player.position.z);
      this.countryball.group.rotation.y = this.currentFacingYaw;
      this.countryball.group.rotation.x = forwardLean;
      this.countryball.group.rotation.z = waddleRoll;

      this.countryball.setSquash(player.squashY * hopSquash, player.squashXZ / Math.sqrt(hopSquash));
      this.countryball.setEmotion(player.emotion);

      // Shadow Plane Contact Grounding
      if (this.shadowPlane) {
        this.shadowPlane.position.set(
          player.position.x,
          player.position.y - player.squashY * this.physics.ballRadius + 0.03,
          player.position.z
        );
        const groundHeightDiff = player.position.y - this.shadowPlane.position.y;
        this.shadowPlane.scale.setScalar(Math.max(0.2, 1.0 - groundHeightDiff * 0.12));
        (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, 0.45 - groundHeightDiff * 0.08);
      }

      // 3. Update Remote Players (Interpolate)
      for (const p of this.remotePlayerMeshes.values()) {
        p.actor.group.position.lerp(p.targetPos, 0.25);
        p.actor.group.rotation.y = THREE.MathUtils.damp(p.actor.group.rotation.y, p.targetYaw, 12, dt);
      }

      // 4. Update PeerRoom Beachballs (bounce physics)
      if (this.beachBalls.length > 0) {
        for (const ball of this.beachBalls) {
          // Gravity
          ball.vel.y -= 14.0 * dt;
          ball.pos.addScaledVector(ball.vel, dt);

          // Floor bounce
          if (ball.pos.y < ball.radius) {
            ball.pos.y = ball.radius;
            ball.vel.y = Math.abs(ball.vel.y) * 0.75;
          }

          // Wall bounds (-17 to 17)
          const limit = 16.5;
          if (Math.abs(ball.pos.x) > limit) {
            ball.pos.x = Math.sign(ball.pos.x) * limit;
            ball.vel.x *= -0.75;
          }
          if (Math.abs(ball.pos.z) > limit) {
            ball.pos.z = Math.sign(ball.pos.z) * limit;
            ball.vel.z *= -0.75;
          }

          // Player kick collision
          const dx = ball.pos.x - player.position.x;
          const dy = ball.pos.y - player.position.y;
          const dz = ball.pos.z - player.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const hitDist = ball.radius + this.physics.ballRadius;

          if (dist < hitDist && dist > 0.001) {
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;
            ball.vel.x += nx * 14.0 + player.velocity.x * 0.8;
            ball.vel.y += Math.max(4.0, ny * 10.0 + 4.0);
            ball.vel.z += nz * 14.0 + player.velocity.z * 0.8;
            ball.pos.x = player.position.x + nx * (hitDist + 0.05);
            ball.pos.z = player.position.z + nz * (hitDist + 0.05);
          }

          // Friction
          ball.vel.x *= 0.98;
          ball.vel.z *= 0.98;

          ball.mesh.position.copy(ball.pos);
          ball.mesh.rotation.x += ball.vel.z * dt * 0.5;
          ball.mesh.rotation.z -= ball.vel.x * dt * 0.5;
        }
      }

      // 5. Particles
      if (player.isGrounded && player.speed > 3.0) {
        if (Math.random() < 0.45) {
          this.spawnDust(player.position.x, player.position.y - 0.7, player.position.z, player.velocity.x, player.velocity.z);
        }
      }
      this.updateDust(dt);

      // 6. Dynamic Obstacles
      if (this.physics.currentStage) {
        for (const obs of this.physics.currentStage.obstacles) {
          const mesh = this.obstacleMeshes.get(obs.id);
          const dyn = this.physics.dynamicObstacles.get(obs.id);
          if (mesh && dyn) {
            mesh.position.copy(dyn.currentPos);
            mesh.rotation.copy(dyn.rotation);
          }
        }
      }

      // Stars animation
      for (const [starId, starGroup] of this.starMeshes.entries()) {
        const starDef = this.physics.currentStage?.stars.find((s) => s.id === starId);
        if (starDef?.collected) {
          starGroup.visible = false;
        } else {
          starGroup.rotation.y += dt * 2.2;
          starGroup.position.y = (starDef?.position.y || 2) + Math.sin(time * 3 + starGroup.position.x) * 0.18;
        }
      }

      // Goal Trophy
      if (this.goalMesh) {
        this.goalMesh.children[0].rotation.y += dt * 1.5;
      }

      // 7. Third-Person Chase Camera with Minecraft-style look
      this._camTarget.set(player.position.x, player.position.y + 0.5, player.position.z);

      const camDist = this.settings.cameraDistance;
      const camH = Math.sin(this.cameraPitch) * camDist;
      const camR = Math.cos(this.cameraPitch) * camDist;

      this._desiredCamPos.set(
        player.position.x - Math.sin(this.cameraYaw) * camR,
        player.position.y + camH + 0.6,
        player.position.z - Math.cos(this.cameraYaw) * camR
      );

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this._desiredCamPos.x, 18, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this._desiredCamPos.y, 18, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this._desiredCamPos.z, 18, dt);
      this.camera.lookAt(this._camTarget);

      // Key light tracks player
      this.dirLight.position.set(player.position.x + 20, player.position.y + 45, player.position.z + 25);
      this.dirLight.target.position.set(player.position.x, player.position.y, player.position.z);
      this.dirLight.target.updateMatrixWorld();

      // Render
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.onResize);
    this.countryball.dispose();
    for (const p of this.remotePlayerMeshes.values()) {
      p.actor.dispose();
    }
    this.remotePlayerMeshes.clear();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
