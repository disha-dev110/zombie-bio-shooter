import * as THREE from 'three';
import {
  GameMode,
  PlayerStats,
  EnemyEntity,
  BulletEntity,
  ParticleEntity,
  GrenadeEntity,
  SentryTurretEntity,
  DropItemEntity,
  MedalPopup,
  FloatingCoinPopup,
  EnemyType,
  WeaponId,
  KillstreakId,
  SpecialAmmoType
} from '../types/game';
import { WEAPONS, getWeaponStats, getUpgradeCost, SPECIAL_AMMO_SHOP, KILLSTREAKS } from './weapons';
import {
  createOperatorModel,
  createEnemyModel,
  createSentryGunModel,
  createMysteryBoxModel,
  createPerkMachineModel,
  createRedBloodCell,
  createCoinModel,
  getOrganicGridTexture
} from './models';
import { sound } from '../audio/soundSystem';

// Pre-allocated math variables for ZERO Garbage Collection in game loop
const _v1 = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

interface EnemyAnimState {
  hitScale: THREE.Vector3;
  flashTimer: number;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private animId: number = 0;
  private lastTime: number = 0;

  // Game state
  public mode: GameMode = 'spec_ops';
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;

  // Player state & animations
  public playerStats: PlayerStats;
  public playerGroup: THREE.Group;
  private playerMuzzleFlashLight: THREE.PointLight;
  private muzzleFlashTimer: number = 0;
  private walkCycle: number = 0;
  private idleCycle: number = 0;
  private gunRecoil: number = 0;
  private playerHitScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  // Arena & Props
  public arenaRadius: number = 38;
  private arenaFloor!: THREE.Mesh;
  private ambientRBCs: THREE.Mesh[] = [];
  private ambientBubbles: THREE.Mesh[] = [];

  // Entities
  public enemies: EnemyEntity[] = [];
  private enemyAnimStates: Map<number, EnemyAnimState> = new Map();
  public bullets: BulletEntity[] = [];
  public particles: ParticleEntity[] = [];
  public grenades: GrenadeEntity[] = [];
  public sentries: SentryTurretEntity[] = [];
  public drops: DropItemEntity[] = [];

  // Spawning & Waves
  public waveTimer: number = 0;
  public enemiesRemainingInWave: number = 0;
  public waveSpawnCooldown: number = 0;
  public isIntermission: boolean = false;
  public intermissionTimer: number = 0;

  // Input states (Keyboard, Mouse, Touch)
  public keys: { [key: string]: boolean } = {};
  public mousePos: THREE.Vector2 = new THREE.Vector2();
  public mouseWorldPos: THREE.Vector3 = new THREE.Vector3();
  public isMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;
  public justPressedKeys: Set<string> = new Set();

  public touchMoveVector = { x: 0, y: 0 };
  public touchAimVector = { x: 0, y: 0 };
  public isTouchFiring = false;

  // Screen shake & hitstop
  public screenShake: number = 0;
  public hitstopTimer: number = 0;

  // React Callbacks
  public onStatsUpdate?: (stats: PlayerStats) => void;
  public onMedalPopup?: (medal: MedalPopup) => void;
  public onFloatingPopup?: (popup: FloatingCoinPopup) => void;
  public onHitmarker?: (isHeadshot: boolean, isKill: boolean) => void;
  public onGameOver?: (stats: PlayerStats) => void;
  public onOpenShop?: () => void;

  private nextEntityId: number = 1;
  private mysteryBoxActive: boolean = false;
  private mysteryBoxMesh: THREE.Group | null = null;
  private bossEntity: EnemyEntity | null = null;

  constructor(container: HTMLDivElement, mode: GameMode) {
    this.mode = mode;

    // 1. Scene setup: High-end stylized cartoon biological world
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a0f3d);
    this.scene.fog = new THREE.FogExp2(0x24144e, 0.014);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      160
    );
    this.camera.position.set(0, 25, 18);
    this.camera.lookAt(0, 0, 0);

    // 3. High Performance Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Vibrant Stylized Cartoon Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0xf43f5e, 1.4);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    sunLight.position.set(22, 38, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 90;
    const d = 38;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-22, 28, -22);
    this.scene.add(rimLight);

    // 5. Build Biological Map
    this.buildArena();

    // 6. Build Cartoon Operator
    this.playerGroup = createOperatorModel('m4_carbine');
    this.scene.add(this.playerGroup);

    this.playerMuzzleFlashLight = new THREE.PointLight(0xfef08a, 0, 14);
    this.playerMuzzleFlashLight.position.set(0.35, 1.1, 1.2);
    this.playerGroup.add(this.playerMuzzleFlashLight);

    // Initialize Player Stats with Coin Economy & Weapon Upgrade Progression
    this.playerStats = {
      hp: 100,
      maxHp: 100,
      shield: 50,
      maxShield: 50,
      stamina: 100,
      maxStamina: 100,
      isSprinting: false,
      score: 0,
      kills: 0,
      headshots: 0,
      currentStreak: 0,
      wave: 1,
      coins: 200, // Starter bounty coins!
      totalCoinsEarned: 200,
      ownedWeapons: ['m4_carbine'],
      weaponLevels: {
        m4_carbine: 1,
        mp5_smg: 1,
        spore12_shotgun: 1,
        barrett_sniper: 1,
        ray_cell: 1,
        acid_spewer: 1,
        plasma_launcher: 1
      },
      specialAmmo: 'standard',
      specialAmmoShotsRemaining: 0,
      credits: mode === 'zombies' ? 500 : 0,
      activePerks: {},
      hasJuggernaut: false,
      juggernautTimer: 0,
      equippedWeapon: 'm4_carbine',
      secondaryWeapon: 'mp5_smg',
      ammo: {
        m4_carbine: { mag: 30, reserve: 150 },
        mp5_smg: { mag: 40, reserve: 180 },
        spore12_shotgun: { mag: 8, reserve: 48 },
        barrett_sniper: { mag: 5, reserve: 25 },
        ray_cell: { mag: 24, reserve: 120 },
        acid_spewer: { mag: 80, reserve: 240 },
        plasma_launcher: { mag: 3, reserve: 15 }
      },
      isReloading: false,
      reloadProgress: 0,
      grenades: 3,
      unlockedKillstreaks: []
    };

    if (this.mode === 'zombies') {
      this.spawnMysteryBox();
      this.spawnPerkMachines();
    } else if (this.mode === 'boss_assault') {
      this.spawnBoss();
    }

    this.bindInputs();
    this.startWave(1);

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);

    sound.announce(this.mode === 'zombies' ? 'Bio-Zombies Outbreak! Defend the organism!' : 'Operator Macrophage deployed! Clear the infection!');
  }

  private buildArena() {
    const floorGeo = new THREE.CylinderGeometry(this.arenaRadius, this.arenaRadius, 1.2, 54);
    const floorMat = new THREE.MeshStandardMaterial({
      map: getOrganicGridTexture(),
      roughness: 0.45,
      metalness: 0.2
    });
    this.arenaFloor = new THREE.Mesh(floorGeo, floorMat);
    this.arenaFloor.position.y = -0.6;
    this.arenaFloor.receiveShadow = true;
    this.scene.add(this.arenaFloor);

    // Rounded, pillowy cartoon membrane outer wall
    const wallGeo = new THREE.TorusGeometry(this.arenaRadius, 2.2, 16, 54);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.35,
      metalness: 0.15,
      emissive: 0x9f1239,
      emissiveIntensity: 0.25
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.rotation.x = Math.PI / 2;
    wall.position.y = 0.6;
    wall.receiveShadow = true;
    this.scene.add(wall);

    const tubeGeo = new THREE.TorusGeometry(this.arenaRadius - 0.4, 0.25, 8, 48);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.8
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.y = 1.6;
    this.scene.add(tube);

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      roughness: 0.2,
      metalness: 0.3
    });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.6
    });

    const pillarPositions = [
      [-12, -8], [12, -8], [-12, 8], [12, 8],
      [0, -15], [0, 15], [-18, 0], [18, 0]
    ];
    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 3.4, 16), pillarMat);
      pillar.position.set(px, 1.7, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), pillarMat);
      cap.position.set(px, 3.4, pz);
      this.scene.add(cap);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.14, 8, 20), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(px, 1.8, pz);
      this.scene.add(ring);
    });

    for (let i = 0; i < 32; i++) {
      const rbc = createRedBloodCell(0.6 + Math.random() * 0.35);
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * (this.arenaRadius - 8);
      rbc.position.set(
        Math.cos(angle) * dist,
        1.2 + Math.random() * 5.5,
        Math.sin(angle) * dist
      );
      rbc.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.scene.add(rbc);
      this.ambientRBCs.push(rbc);
    }

    const bubbleGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5
    });

    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(bubbleGeo, bubbleMat);
      b.scale.setScalar(0.5 + Math.random() * 1.2);
      b.position.set(
        (Math.random() - 0.5) * (this.arenaRadius * 1.5),
        1 + Math.random() * 6,
        (Math.random() - 0.5) * (this.arenaRadius * 1.5)
      );
      this.scene.add(b);
      this.ambientBubbles.push(b);
    }
  }

  private spawnMysteryBox() {
    this.mysteryBoxMesh = createMysteryBoxModel();
    this.mysteryBoxMesh.position.set(0, 0, -18);
    this.scene.add(this.mysteryBoxMesh);

    this.drops.push({
      id: this.nextEntityId++,
      x: 0,
      z: -18,
      type: 'mystery_box',
      cost: 950,
      meshGroup: this.mysteryBoxMesh,
      angle: 0
    });
  }

  private spawnPerkMachines() {
    const juggMesh = createPerkMachineModel(0xef4444, 'JUGGERNOG');
    juggMesh.position.set(-18, 0, -14);
    this.scene.add(juggMesh);
    this.drops.push({
      id: this.nextEntityId++,
      x: -18,
      z: -14,
      type: 'perk_juggernog',
      cost: 2500,
      meshGroup: juggMesh,
      angle: 0
    });

    const speedMesh = createPerkMachineModel(0x10b981, 'SPEED COLA');
    speedMesh.position.set(18, 0, -14);
    this.scene.add(speedMesh);
    this.drops.push({
      id: this.nextEntityId++,
      x: 18,
      z: -14,
      type: 'perk_speed',
      cost: 3000,
      meshGroup: speedMesh,
      angle: 0
    });
  }

  private spawnBoss() {
    const bossGroup = createEnemyModel('bio_juggernaut');
    bossGroup.scale.set(1.9, 1.9, 1.9);
    bossGroup.position.set(0, 0, -22);
    this.scene.add(bossGroup);

    this.bossEntity = {
      id: this.nextEntityId++,
      type: 'bio_juggernaut',
      x: 0,
      z: -22,
      vx: 0,
      vz: 0,
      angle: Math.PI / 2,
      hp: 3500,
      maxHp: 3500,
      speed: 3.0,
      radius: 2.2,
      attackRange: 4.5,
      attackCooldown: 1.8,
      attackTimer: 0,
      windupTimer: 0,
      isWindingUp: false,
      color: 0xf59e0b,
      scoreValue: 5000,
      coinValue: 1000,
      meshGroup: bossGroup
    };
    this.enemies.push(this.bossEntity);
    this.enemyAnimStates.set(this.bossEntity.id, {
      hitScale: new THREE.Vector3(1, 1, 1),
      flashTimer: 0
    });
  }

  private bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.justPressedKeys.add(e.code);

      if (e.code === 'Digit1') this.switchWeapon(this.playerStats.equippedWeapon);
      if (e.code === 'Digit2') this.switchWeapon(this.playerStats.secondaryWeapon);

      if (e.code === 'Digit3') this.activateKillstreak('uav');
      if (e.code === 'Digit4') this.activateKillstreak('predator');
      if (e.code === 'Digit5') this.activateKillstreak('sentry');
      if (e.code === 'Digit6') this.activateKillstreak('juggernaut');

      if (e.code === 'KeyR') this.startReload();
      if (e.code === 'KeyG' || e.code === 'KeyQ') this.throwGrenade();
      if (e.code === 'KeyF' || e.code === 'KeyV') this.meleeAttack();
      if (e.code === 'KeyE') this.interactNearby();

      // Open Loadout Shop with 'B' hotkey!
      if (e.code === 'KeyB') {
        if (this.onOpenShop) this.onOpenShop();
      }

      if (e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.isMouseDown = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.isMouseDown = true;
      if (e.button === 2) {
        this.isRightMouseDown = true;
        this.meleeAttack();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMouseDown = false;
      if (e.button === 2) this.isRightMouseDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(this.mousePos, this.camera);
      _raycaster.ray.intersectPlane(_plane, this.mouseWorldPos);
    });

    window.addEventListener('resize', () => {
      const width = this.renderer.domElement.parentElement?.clientWidth || window.innerWidth;
      const height = this.renderer.domElement.parentElement?.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  public setTouchMove(x: number, y: number) {
    this.touchMoveVector.x = x;
    this.touchMoveVector.y = y;
  }

  public setTouchAim(x: number, y: number) {
    this.touchAimVector.x = x;
    this.touchAimVector.y = y;
  }

  public setTouchFiring(firing: boolean) {
    this.isTouchFiring = firing;
  }

  public togglePause() {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;
  }

  public startWave(waveNum: number) {
    this.playerStats.wave = waveNum;
    this.isIntermission = false;

    if (this.mode === 'boss_assault') {
      return;
    }

    this.enemiesRemainingInWave = Math.floor(12 + waveNum * 6);
    this.waveSpawnCooldown = 0.5;

    sound.announce(`Round ${waveNum}. Hostiles Inbound.`);
    this.triggerMedal('wave', `ROUND ${waveNum}`, 250, 50);
  }

  private loop(time: number) {
    if (!this.isRunning) return;
    this.animId = requestAnimationFrame(this.loop);

    const rawDt = (time - this.lastTime) * 0.001;
    this.lastTime = time;
    const dt = Math.min(rawDt, 0.05);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (!this.isPaused && !this.isGameOver) {
      this.updateSimulation(dt, time);
    }

    for (const rbc of this.ambientRBCs) {
      rbc.rotation.x += dt * 0.25;
      rbc.rotation.y += dt * 0.35;
      rbc.position.y += Math.sin(time * 0.002 + rbc.position.x) * 0.006;
    }

    for (const b of this.ambientBubbles) {
      b.position.y += dt * 0.8;
      b.position.x += Math.sin(time * 0.003 + b.position.z) * 0.01;
      if (b.position.y > 8) {
        b.position.y = 0.8;
      }
    }

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
    this.justPressedKeys.clear();
  }

  private updateSimulation(dt: number, time: number) {
    this.updatePlayer(dt);
    this.updateWeapon(dt);
    this.updateBullets(dt);
    this.updateEnemies(dt, time);
    this.updateGrenades(dt);
    this.updateSentries(dt);
    this.updateDrops(dt);
    this.updateParticles(dt);
    this.checkKillstreaks();
    this.updateHealthRegen(dt);

    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.playerStats });
    }
  }

  private updatePlayer(dt: number) {
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Apply touch joystick input if active
    if (Math.abs(this.touchMoveVector.x) > 0.05 || Math.abs(this.touchMoveVector.y) > 0.05) {
      moveX = this.touchMoveVector.x;
      moveZ = this.touchMoveVector.y;
    }

    const isMoving = moveX !== 0 || moveZ !== 0;

    const wantsSprint = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && isMoving;
    const hasStamina = this.playerStats.stamina > 10;
    const hasStaminUp = !!this.playerStats.activePerks['stamin_up'];
    const isSprinting = wantsSprint && (hasStamina || hasStaminUp);

    this.playerStats.isSprinting = isSprinting;

    if (isSprinting) {
      if (!hasStaminUp) {
        this.playerStats.stamina = Math.max(0, this.playerStats.stamina - dt * 30);
      }
    } else {
      this.playerStats.stamina = Math.min(this.playerStats.maxStamina, this.playerStats.stamina + dt * 25);
    }

    let speed = 9.5;
    if (isSprinting) speed = 14.5;
    if (hasStaminUp) speed *= 1.25;
    if (this.playerStats.hasJuggernaut) speed = 8.5;

    if (isMoving) {
      _dir.set(moveX, 0, moveZ).normalize().multiplyScalar(speed * dt);
      this.playerGroup.position.add(_dir);

      const distFromCenter = Math.sqrt(
        this.playerGroup.position.x * this.playerGroup.position.x +
        this.playerGroup.position.z * this.playerGroup.position.z
      );
      if (distFromCenter > this.arenaRadius - 2) {
        const angle = Math.atan2(this.playerGroup.position.z, this.playerGroup.position.x);
        this.playerGroup.position.x = Math.cos(angle) * (this.arenaRadius - 2);
        this.playerGroup.position.z = Math.sin(angle) * (this.arenaRadius - 2);
      }
    }

    // Aim rotation: Rotate player group toward mouse world position or touch aim
    if (Math.abs(this.touchAimVector.x) > 0.1 || Math.abs(this.touchAimVector.y) > 0.1) {
      this.playerGroup.rotation.y = Math.atan2(this.touchAimVector.x, this.touchAimVector.y);
    } else {
      const dx = this.mouseWorldPos.x - this.playerGroup.position.x;
      const dz = this.mouseWorldPos.z - this.playerGroup.position.z;
      const aimAngle = Math.atan2(dx, dz);
      this.playerGroup.rotation.y = aimAngle;
    }

    // PROCEDURAL FLUID CARTOON STEP CYCLE
    const leftLeg = this.playerGroup.getObjectByName('leftLeg');
    const rightLeg = this.playerGroup.getObjectByName('rightLeg');
    const torso = this.playerGroup.getObjectByName('torso');
    const head = this.playerGroup.getObjectByName('head');
    const weaponGroup = this.playerGroup.getObjectByName('weaponGroup');

    if (isMoving) {
      const strideFreq = isSprinting ? 24 : 16;
      this.walkCycle += dt * strideFreq;

      if (leftLeg) leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.65;
      if (rightLeg) rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.65;

      if (torso) {
        torso.position.y = 0.95 + Math.abs(Math.sin(this.walkCycle)) * 0.14;
        torso.rotation.z = Math.sin(this.walkCycle) * 0.08;
      }
      if (head) {
        head.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.08;
      }

      if (Math.random() < (isSprinting ? 0.35 : 0.15)) {
        this.spawnCartoonPuff(this.playerGroup.position.x, 0.2, this.playerGroup.position.z, 0x38bdf8);
      }
    } else {
      this.idleCycle += dt * 3.5;

      if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 8, dt);
      if (rightLeg) rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 8, dt);

      if (torso) {
        torso.position.y = 0.95 + Math.sin(this.idleCycle) * 0.04;
        torso.scale.set(
          1 + Math.cos(this.idleCycle) * 0.03,
          1 + Math.sin(this.idleCycle) * 0.04,
          1 + Math.cos(this.idleCycle) * 0.03
        );
        torso.rotation.z = THREE.MathUtils.damp(torso.rotation.z, 0, 6, dt);
      }
    }

    if (weaponGroup) {
      this.gunRecoil = THREE.MathUtils.damp(this.gunRecoil, 0, 14, dt);
      weaponGroup.position.z = 0.35 - this.gunRecoil;
      weaponGroup.scale.x = THREE.MathUtils.damp(weaponGroup.scale.x, 1, 12, dt);
      weaponGroup.scale.y = THREE.MathUtils.damp(weaponGroup.scale.y, 1, 12, dt);
      weaponGroup.scale.z = THREE.MathUtils.damp(weaponGroup.scale.z, 1, 12, dt);
    }

    if (this.playerGroup) {
      this.playerHitScale.x = THREE.MathUtils.damp(this.playerHitScale.x, 1, 10, dt);
      this.playerHitScale.y = THREE.MathUtils.damp(this.playerHitScale.y, 1, 10, dt);
      this.playerHitScale.z = THREE.MathUtils.damp(this.playerHitScale.z, 1, 10, dt);
      this.playerGroup.scale.copy(this.playerHitScale);
    }

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.playerMuzzleFlashLight.intensity = 0;
      }
    }

    if (this.playerStats.hasJuggernaut) {
      this.playerStats.juggernautTimer -= dt;
      if (this.playerStats.juggernautTimer <= 0) {
        this.playerStats.hasJuggernaut = false;
        this.playerStats.maxHp = 100;
        this.playerStats.hp = Math.min(this.playerStats.hp, 100);
        sound.announce('Juggernaut armor expired.');
      }
    }
  }

  private weaponFireTimer: number = 0;
  private updateWeapon(dt: number) {
    const curLevel = this.playerStats.weaponLevels[this.playerStats.equippedWeapon] || 1;
    const curWep = getWeaponStats(this.playerStats.equippedWeapon, curLevel);

    if (this.weaponFireTimer > 0) {
      this.weaponFireTimer -= dt;
    }

    if (this.playerStats.isReloading) {
      const speedMult = this.playerStats.activePerks['speed_cola'] ? 2.0 : 1.0;
      const totalReloadTime = curWep.reloadTime / speedMult;
      this.playerStats.reloadProgress += dt / totalReloadTime;

      if (this.playerStats.reloadProgress >= 1) {
        this.completeReload();
      }
      return;
    }

    if ((this.isMouseDown || this.keys['Space'] || this.isTouchFiring) && this.weaponFireTimer <= 0) {
      this.fireWeapon();
    }
  }

  public fireWeapon() {
    const curLevel = this.playerStats.weaponLevels[this.playerStats.equippedWeapon] || 1;
    const curWep = getWeaponStats(this.playerStats.equippedWeapon, curLevel);
    const ammoInfo = this.playerStats.ammo[this.playerStats.equippedWeapon];
    if (!ammoInfo) return;

    if (ammoInfo.mag <= 0) {
      sound.playReload('mag_out');
      this.startReload();
      return;
    }

    ammoInfo.mag--;

    const fireRateMultiplier = this.playerStats.activePerks['double_tap'] ? 1.33 : 1.0;
    this.weaponFireTimer = 1.0 / (curWep.fireRate * fireRateMultiplier);

    this.playerMuzzleFlashLight.intensity = 6;
    this.muzzleFlashTimer = 0.05;

    this.gunRecoil = 0.22;
    const weaponGroup = this.playerGroup.getObjectByName('weaponGroup');
    if (weaponGroup) {
      weaponGroup.scale.set(1.3, 0.75, 1.35);
    }

    sound.playGunshot(curWep.soundType);
    this.addScreenShake(curWep.recoilKick * 0.7);

    const origin = this.playerGroup.position.clone().add(new THREE.Vector3(0, 1.1, 0));
    const forwardAngle = this.playerGroup.rotation.y;

    // Special ammo checks
    let bulletColor = curWep.bulletColor;
    let bulletDamage = curWep.damage;
    let activeSpecialType: SpecialAmmoType | undefined = undefined;

    if (this.playerStats.specialAmmo !== 'standard' && this.playerStats.specialAmmoShotsRemaining > 0) {
      activeSpecialType = this.playerStats.specialAmmo;
      this.playerStats.specialAmmoShotsRemaining--;
      if (this.playerStats.specialAmmo === 'acid_rounds') {
        bulletColor = '#a3e635';
        bulletDamage *= 1.4;
      } else if (this.playerStats.specialAmmo === 'cryo_pellets') {
        bulletColor = '#38bdf8';
      } else if (this.playerStats.specialAmmo === 'explosive_darts') {
        bulletColor = '#f97316';
        bulletDamage *= 1.5;
      }
      if (this.playerStats.specialAmmoShotsRemaining <= 0) {
        this.playerStats.specialAmmo = 'standard';
      }
    }

    for (let i = 0; i < curWep.bulletCount; i++) {
      const spreadAngle = (Math.random() - 0.5) * curWep.spread;
      const angle = forwardAngle + spreadAngle;

      const vx = Math.sin(angle) * curWep.bulletSpeed;
      const vz = Math.cos(angle) * curWep.bulletSpeed;

      const tracerGeo = new THREE.CapsuleGeometry(0.12, 0.5, 6, 8);
      const tracerMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(bulletColor)
      });
      const mesh = new THREE.Mesh(tracerGeo, tracerMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = -angle;
      mesh.position.copy(origin);
      this.scene.add(mesh);

      this.bullets.push({
        id: this.nextEntityId++,
        x: origin.x,
        z: origin.z,
        vx,
        vz,
        damage: bulletDamage,
        rangeRemaining: curWep.range,
        penetrationLeft: curWep.penetration,
        color: new THREE.Color(bulletColor).getHex(),
        isPlayerBullet: true,
        mesh,
        specialType: activeSpecialType
      });
    }

    this.spawnCartoonMuzzleFlash(origin, forwardAngle);
  }

  public startReload() {
    const curLevel = this.playerStats.weaponLevels[this.playerStats.equippedWeapon] || 1;
    const curWep = getWeaponStats(this.playerStats.equippedWeapon, curLevel);
    const ammoInfo = this.playerStats.ammo[this.playerStats.equippedWeapon];
    if (!ammoInfo) return;

    if (ammoInfo.mag >= curWep.magazineSize || ammoInfo.reserve <= 0 || this.playerStats.isReloading) {
      return;
    }

    this.playerStats.isReloading = true;
    this.playerStats.reloadProgress = 0;
    sound.playReload('mag_out');
    setTimeout(() => {
      if (this.playerStats.isReloading) sound.playReload('mag_in');
    }, 450);
  }

  private completeReload() {
    const curLevel = this.playerStats.weaponLevels[this.playerStats.equippedWeapon] || 1;
    const curWep = getWeaponStats(this.playerStats.equippedWeapon, curLevel);
    const ammoInfo = this.playerStats.ammo[this.playerStats.equippedWeapon];
    if (!ammoInfo) return;

    const needed = curWep.magazineSize - ammoInfo.mag;
    const transfer = Math.min(needed, ammoInfo.reserve);
    ammoInfo.mag += transfer;
    ammoInfo.reserve -= transfer;

    this.playerStats.isReloading = false;
    this.playerStats.reloadProgress = 0;
    sound.playReload('slide');
  }

  public switchWeapon(wepId: WeaponId) {
    if (this.playerStats.isReloading) {
      this.playerStats.isReloading = false;
    }
    this.playerStats.equippedWeapon = wepId;
    sound.playReload('slide');
  }

  public throwGrenade() {
    if (this.playerStats.grenades <= 0) return;
    this.playerStats.grenades--;

    const origin = this.playerGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const forwardAngle = this.playerGroup.rotation.y;
    const throwSpeed = 22;

    const geo = new THREE.SphereGeometry(0.28, 12, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.2,
      metalness: 0.5,
      emissive: 0x059669,
      emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.grenades.push({
      id: this.nextEntityId++,
      x: origin.x,
      y: 1.2,
      z: origin.z,
      vx: Math.sin(forwardAngle) * throwSpeed,
      vy: 6.5,
      vz: Math.cos(forwardAngle) * throwSpeed,
      fuseTimer: 2.0,
      radius: 9.0,
      damage: 280,
      mesh
    });
  }

  public meleeAttack() {
    sound.playDash();
    const origin = this.playerGroup.position;
    const forwardAngle = this.playerGroup.rotation.y;
    const meleeRange = 3.2;

    let hitCount = 0;
    for (const enemy of this.enemies) {
      const dx = enemy.x - origin.x;
      const dz = enemy.z - origin.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= meleeRange) {
        const enemyAngle = Math.atan2(dx, dz);
        let angleDiff = Math.abs(forwardAngle - enemyAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (angleDiff < Math.PI / 2.5) {
          hitCount++;
          this.damageEnemy(enemy, 150, true);
          this.playerStats.shield = Math.min(this.playerStats.maxShield, this.playerStats.shield + 15);
        }
      }
    }

    if (hitCount > 0) {
      this.addScreenShake(0.4);
      this.hitstopTimer = 0.05;
    }
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const stepDist = Math.sqrt(b.vx * b.vx + b.vz * b.vz) * dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.rangeRemaining -= stepDist;

      b.mesh.position.set(b.x, 1.1, b.z);

      if (Math.sqrt(b.x * b.x + b.z * b.z) >= this.arenaRadius) {
        this.spawnComicStarburst(b.x, 1.1, b.z, b.color);
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.isPlayerBullet) {
        let hit = false;
        for (let e = this.enemies.length - 1; e >= 0; e--) {
          const enemy = this.enemies[e];
          const distSq = (b.x - enemy.x) * (b.x - enemy.x) + (b.z - enemy.z) * (b.z - enemy.z);
          if (distSq <= enemy.radius * enemy.radius) {
            const isHeadshot = Math.random() < 0.22;
            const finalDamage = isHeadshot ? b.damage * 2.0 : b.damage;

            if (b.specialType === 'cryo_pellets') {
              enemy.speed *= 0.55; // Freeze slow
            } else if (b.specialType === 'explosive_darts') {
              this.spawnCartoonExplosionVFX(enemy.x, 0.8, enemy.z);
            }

            this.damageEnemy(enemy, finalDamage, isHeadshot);
            this.spawnComicStarburst(b.x, 1.1, b.z, 0xfacc15);

            b.penetrationLeft--;
            if (b.penetrationLeft <= 0) {
              hit = true;
              break;
            }
          }
        }

        if (hit || b.rangeRemaining <= 0) {
          this.scene.remove(b.mesh);
          this.bullets.splice(i, 1);
        }
      }
    }
  }

  public damageEnemy(enemy: EnemyEntity, damage: number, isHeadshot: boolean = false) {
    enemy.hp -= damage;
    const isKill = enemy.hp <= 0;

    let anim = this.enemyAnimStates.get(enemy.id);
    if (!anim) {
      anim = { hitScale: new THREE.Vector3(1, 1, 1), flashTimer: 0 };
      this.enemyAnimStates.set(enemy.id, anim);
    }
    anim.hitScale.set(1.4, 0.65, 1.4);
    anim.flashTimer = 0.12;

    sound.playHitmarker(isHeadshot, isKill);
    if (this.onHitmarker) {
      this.onHitmarker(isHeadshot, isKill);
    }

    if (isKill) {
      this.killEnemy(enemy, isHeadshot);
    }
  }

  private killEnemy(enemy: EnemyEntity, isHeadshot: boolean) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
    this.enemyAnimStates.delete(enemy.id);
    this.scene.remove(enemy.meshGroup);

    // Economy & XP calculations
    const xp = isHeadshot ? 150 : 100;
    let coinsEarned = enemy.coinValue || 15;
    if (isHeadshot) coinsEarned += 10;

    this.playerStats.score += xp;
    this.playerStats.credits += isHeadshot ? 120 : 80;
    this.playerStats.coins += coinsEarned;
    this.playerStats.totalCoinsEarned += coinsEarned;
    this.playerStats.kills++;
    this.playerStats.currentStreak++;
    if (isHeadshot) this.playerStats.headshots++;

    sound.playCoinPickup();
    this.triggerFloatingPopup(enemy.x, 1.2, enemy.z, `+${coinsEarned} 🪙`, coinsEarned);

    this.triggerMedal(
      isHeadshot ? 'headshot' : 'kill',
      isHeadshot ? 'HEADSHOT' : 'ELIMINATION',
      xp,
      coinsEarned
    );

    // 25% chance to drop 3D spinning coin pickup
    if (Math.random() < 0.25) {
      this.spawnCoinPickup(enemy.x + (Math.random() - 0.5) * 1.5, enemy.z + (Math.random() - 0.5) * 1.5, 30);
    } else if (Math.random() < 0.2) {
      this.spawnLootDrop(enemy.x, enemy.z);
    }

    this.spawnCartoonDeathBurst(enemy.x, enemy.z, enemy.color);

    if (this.mode !== 'boss_assault') {
      if (this.enemiesRemainingInWave <= 0 && this.enemies.length === 0 && !this.isIntermission) {
        this.isIntermission = true;
        this.intermissionTimer = 4.0;
        const waveCoins = 100 * this.playerStats.wave;
        this.playerStats.coins += waveCoins;
        this.playerStats.totalCoinsEarned += waveCoins;
        sound.announce('Wave cleared! Loadout Shop is open!');
        this.triggerMedal('wave', `WAVE CLEAR BONUS (+${waveCoins} 🪙)`, 300, waveCoins);
      }
    } else if (enemy === this.bossEntity) {
      this.isVictory = true;
      sound.announce('Viral Goliath Defeated! Victory!');
    }
  }

  public triggerFloatingPopup(worldX: number, worldY: number, worldZ: number, text: string, coins: number = 0) {
    _v1.set(worldX, worldY, worldZ);
    _v1.project(this.camera);
    const screenX = (_v1.x * 0.5 + 0.5) * 100;
    const screenY = (-(_v1.y * 0.5) + 0.5) * 100;

    if (this.onFloatingPopup) {
      this.onFloatingPopup({
        id: Math.random().toString(),
        text,
        coins,
        x: screenX,
        y: screenY,
        timestamp: performance.now()
      });
    }
  }

  private spawnCoinPickup(x: number, z: number, value: number = 30) {
    const coinMesh = createCoinModel(0.45);
    coinMesh.position.set(x, 0, z);
    this.scene.add(coinMesh);

    this.drops.push({
      id: this.nextEntityId++,
      x,
      z,
      type: 'coin_pickup',
      value,
      meshGroup: coinMesh,
      angle: Math.random() * Math.PI
    });
  }

  private updateEnemies(dt: number, time: number) {
    if (this.isIntermission) {
      this.intermissionTimer -= dt;
      if (this.intermissionTimer <= 0) {
        this.startWave(this.playerStats.wave + 1);
      }
      return;
    }

    if (this.mode !== 'boss_assault' && this.enemiesRemainingInWave > 0) {
      this.waveSpawnCooldown -= dt;
      if (this.waveSpawnCooldown <= 0) {
        this.spawnRandomEnemy();
        this.enemiesRemainingInWave--;
        this.waveSpawnCooldown = Math.max(0.25, 1.4 - this.playerStats.wave * 0.08);
      }
    }

    const playerPos = this.playerGroup.position;
    const sec = time * 0.001;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = playerPos.x - e.x;
      const dz = playerPos.z - e.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      e.angle = Math.atan2(dx, dz);
      e.meshGroup.rotation.y = e.angle;

      if (dist > e.attackRange) {
        const moveSpeed = e.speed * dt;
        e.x += (dx / dist) * moveSpeed;
        e.z += (dz / dist) * moveSpeed;
      } else {
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = e.attackCooldown;
          this.enemyAttack(e);
        }
      }

      e.meshGroup.position.set(e.x, 0, e.z);

      const bodyGroup = e.meshGroup.getObjectByName('bodyGroup');
      const anim = this.enemyAnimStates.get(e.id);

      if (bodyGroup) {
        if (anim) {
          anim.hitScale.x = THREE.MathUtils.damp(anim.hitScale.x, 1, 10, dt);
          anim.hitScale.y = THREE.MathUtils.damp(anim.hitScale.y, 1, 10, dt);
          anim.hitScale.z = THREE.MathUtils.damp(anim.hitScale.z, 1, 10, dt);
        }

        switch (e.type) {
          case 'grunt_bacillus': {
            const leftFoot = bodyGroup.getObjectByName('leftFoot');
            const rightFoot = bodyGroup.getObjectByName('rightFoot');
            const tail = bodyGroup.getObjectByName('tail');

            const stepSpeed = sec * 22 + e.id;
            if (leftFoot) leftFoot.rotation.x = Math.sin(stepSpeed) * 0.7;
            if (rightFoot) rightFoot.rotation.x = -Math.sin(stepSpeed) * 0.7;
            if (tail) tail.rotation.z = Math.sin(sec * 30 + e.id) * 0.45;

            bodyGroup.position.y = 0.65 + Math.abs(Math.sin(stepSpeed)) * 0.15;
            break;
          }

          case 'viral_spiker': {
            bodyGroup.position.y = 0.85 + Math.sin(sec * 7 + e.id) * 0.24;
            bodyGroup.rotation.y += dt * 1.8;
            break;
          }

          case 'sniper_spore': {
            if (dist < 25) {
              e.windupTimer += dt;
              bodyGroup.rotation.x = -Math.min(0.65, e.windupTimer * 0.4);

              if (e.windupTimer >= 2.0) {
                e.windupTimer = 0;
                bodyGroup.rotation.x = 0.35;
                this.damagePlayer(45);
                sound.playGunshot('sniper');
                this.addScreenShake(0.5);
              }
            } else {
              bodyGroup.rotation.x = THREE.MathUtils.damp(bodyGroup.rotation.x, 0, 6, dt);
            }
            break;
          }

          case 'zombie_walker': {
            const leftArm = bodyGroup.getObjectByName('leftArm');
            const rightArm = bodyGroup.getObjectByName('rightArm');
            const waddleSpeed = sec * 9 + e.id;

            bodyGroup.rotation.z = Math.sin(waddleSpeed) * 0.22;
            bodyGroup.position.y = 0.85 + Math.abs(Math.sin(waddleSpeed)) * 0.12;

            if (leftArm) leftArm.rotation.x = Math.PI / 2.2 + Math.sin(waddleSpeed) * 0.35;
            if (rightArm) rightArm.rotation.x = Math.PI / 2.0 - Math.sin(waddleSpeed) * 0.35;
            break;
          }

          case 'bio_juggernaut': {
            const stomp = sec * 5;
            bodyGroup.position.y = 1.4 + Math.abs(Math.sin(stomp)) * 0.22;
            bodyGroup.rotation.z = Math.sin(stomp) * 0.14;
            break;
          }
        }

        if (anim) {
          bodyGroup.scale.copy(anim.hitScale);
        }
      }
    }
  }

  private spawnRandomEnemy() {
    const wave = this.playerStats.wave;
    let type: EnemyType = 'grunt_bacillus';

    if (this.mode === 'zombies') {
      type = 'zombie_walker';
    } else {
      const roll = Math.random();
      if (wave >= 5 && roll < 0.1) {
        type = 'bio_juggernaut';
      } else if (wave >= 3 && roll < 0.3) {
        type = 'sniper_spore';
      } else if (wave >= 2 && roll < 0.55) {
        type = 'viral_spiker';
      } else {
        type = 'grunt_bacillus';
      }
    }

    const angle = Math.random() * Math.PI * 2;
    const r = this.arenaRadius - 3;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const meshGroup = createEnemyModel(type);
    meshGroup.position.set(x, 0, z);
    this.scene.add(meshGroup);

    let hp = 70 + wave * 18;
    let speed = 4.2 + Math.min(wave * 0.25, 4.0);
    let radius = 0.8;
    let score = 100;
    let coinVal = 15;

    if (type === 'viral_spiker') {
      hp = 95 + wave * 22;
      speed = 6.2;
      radius = 0.9;
      score = 125;
      coinVal = 25;
    } else if (type === 'sniper_spore') {
      hp = 120 + wave * 25;
      speed = 2.5;
      radius = 0.85;
      score = 175;
      coinVal = 35;
    } else if (type === 'bio_juggernaut') {
      hp = 650 + wave * 150;
      speed = 2.8;
      radius = 1.8;
      score = 500;
      coinVal = 150;
    }

    const enemy: EnemyEntity = {
      id: this.nextEntityId++,
      type,
      x,
      z,
      vx: 0,
      vz: 0,
      angle: 0,
      hp,
      maxHp: hp,
      speed,
      radius,
      attackRange: type === 'sniper_spore' ? 22 : 1.8,
      attackCooldown: 1.2,
      attackTimer: 0.5,
      windupTimer: 0,
      isWindingUp: false,
      color: type === 'grunt_bacillus' ? 0xf43f5e : type === 'viral_spiker' ? 0xa855f7 : 0x10b981,
      scoreValue: score,
      coinValue: coinVal,
      meshGroup
    };

    this.enemies.push(enemy);
    this.enemyAnimStates.set(enemy.id, {
      hitScale: new THREE.Vector3(1, 1, 1),
      flashTimer: 0
    });
  }

  private enemyAttack(enemy: EnemyEntity) {
    let damage = 18;
    if (enemy.type === 'viral_spiker') damage = 24;
    if (enemy.type === 'bio_juggernaut') damage = 48;
    this.damagePlayer(damage);
  }

  public damagePlayer(amount: number) {
    if (this.isGameOver) return;

    if (this.playerStats.shield > 0) {
      const shieldAbsorb = Math.min(this.playerStats.shield, amount);
      this.playerStats.shield -= shieldAbsorb;
      amount -= shieldAbsorb;
    }

    if (amount > 0) {
      this.playerStats.hp -= amount;
      this.timeSinceLastDamage = 0;
      sound.playHitmarker(false, false);
      sound.playHeartbeat();
      this.addScreenShake(0.35);

      this.playerHitScale.set(1.3, 0.7, 1.3);
    }

    if (this.playerStats.hp <= 0) {
      this.playerStats.hp = 0;
      this.isGameOver = true;
      sound.announce('Operator Down! Mission Failed.');
      if (this.onGameOver) {
        this.onGameOver({ ...this.playerStats });
      }
    }
  }

  private timeSinceLastDamage: number = 0;
  private updateHealthRegen(dt: number) {
    this.timeSinceLastDamage += dt;
    if (this.timeSinceLastDamage >= 3.0 && this.playerStats.hp < this.playerStats.maxHp) {
      this.playerStats.hp = Math.min(
        this.playerStats.maxHp,
        this.playerStats.hp + dt * 45
      );
    }
  }

  private updateGrenades(dt: number) {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.fuseTimer -= dt;

      g.vy -= 18 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.z += g.vz * dt;

      if (g.y <= 0.28) {
        g.y = 0.28;
        g.vy = -g.vy * 0.55;
        g.vx *= 0.75;
        g.vz *= 0.75;
      }

      g.mesh.position.set(g.x, g.y, g.z);

      if (g.fuseTimer <= 0) {
        this.explodeGrenade(g);
        this.scene.remove(g.mesh);
        this.grenades.splice(i, 1);
      }
    }
  }

  private explodeGrenade(g: GrenadeEntity) {
    sound.playExplosion();
    this.addScreenShake(0.9);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const dx = enemy.x - g.x;
      const dz = enemy.z - g.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= g.radius) {
        const falloff = 1 - dist / g.radius;
        const damage = g.damage * falloff;
        this.damageEnemy(enemy, damage, false);
      }
    }

    this.spawnCartoonExplosionVFX(g.x, g.y, g.z);
  }

  private updateSentries(dt: number) {
    for (let i = this.sentries.length - 1; i >= 0; i--) {
      const s = this.sentries[i];
      s.lifeTimer -= dt;
      s.fireTimer -= dt;

      let closestEnemy: EnemyEntity | null = null;
      let closestDist = 24;

      for (const e of this.enemies) {
        const dx = e.x - s.x;
        const dz = e.z - s.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = e;
        }
      }

      const headGroup = s.meshGroup.getObjectByName('headGroup');

      if (closestEnemy && headGroup) {
        const targetAngle = Math.atan2(closestEnemy.x - s.x, closestEnemy.z - s.z);
        s.angle = THREE.MathUtils.damp(s.angle, targetAngle, 8, dt);
        headGroup.rotation.y = s.angle;

        if (s.fireTimer <= 0) {
          s.fireTimer = 0.12;
          sound.playGunshot('smg');
          this.damageEnemy(closestEnemy, 22, false);
          this.spawnComicStarburst(closestEnemy.x, 1.0, closestEnemy.z, 0x38bdf8);
        }
      }

      if (s.lifeTimer <= 0) {
        this.scene.remove(s.meshGroup);
        this.sentries.splice(i, 1);
        sound.announce('Sentry gun finished.');
      }
    }
  }

  private updateDrops(dt: number) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.angle += dt * 2.2;
      drop.meshGroup.rotation.y = drop.angle;

      const p = this.playerGroup.position;
      const dist = Math.sqrt((drop.x - p.x) * (drop.x - p.x) + (drop.z - p.z) * (drop.z - p.z));

      // Coin pickup auto-magnet
      if (drop.type === 'coin_pickup') {
        const coinMesh = drop.meshGroup.getObjectByName('coinMesh');
        if (coinMesh) {
          coinMesh.position.y = 0.55 + Math.sin(drop.angle * 2) * 0.1;
        }
        if (dist < 2.2) {
          const val = drop.value || 30;
          this.playerStats.coins += val;
          this.playerStats.totalCoinsEarned += val;
          sound.playCoinPickup();
          this.triggerFloatingPopup(drop.x, 1.2, drop.z, `+${val} 🪙`, val);
          this.scene.remove(drop.meshGroup);
          this.drops.splice(i, 1);
          continue;
        }
      }

      if (drop.type === 'ammo' || drop.type === 'medkit') {
        if (dist < 2.0) {
          if (drop.type === 'ammo') {
            for (const key in this.playerStats.ammo) {
              const info = this.playerStats.ammo[key as WeaponId];
              if (info) info.reserve += 60;
            }
            sound.playReload('mag_in');
            this.triggerMedal('streak', 'RESUPPLY +50', 50, 0);
          } else {
            this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 50);
            this.playerStats.shield = this.playerStats.maxShield;
            sound.playDash();
            this.triggerMedal('streak', 'STIM HEAL', 25, 0);
          }
          this.scene.remove(drop.meshGroup);
          this.drops.splice(i, 1);
        }
      }
    }
  }

  public interactNearby() {
    const p = this.playerGroup.position;

    for (const drop of this.drops) {
      const dist = Math.sqrt((drop.x - p.x) * (drop.x - p.x) + (drop.z - p.z) * (drop.z - p.z));
      if (dist < 3.2) {
        if (drop.type === 'mystery_box') {
          if (this.playerStats.credits >= 950 && !this.mysteryBoxActive) {
            this.playerStats.credits -= 950;
            this.rollMysteryBox();
          }
        } else if (drop.type === 'perk_juggernog') {
          if (this.playerStats.credits >= 2500 && !this.playerStats.activePerks['juggernog']) {
            this.playerStats.credits -= 2500;
            this.playerStats.activePerks['juggernog'] = true;
            this.playerStats.maxHp = 250;
            this.playerStats.hp = 250;
            sound.announce('Juggernog acquired! Maximum Health!');
          }
        } else if (drop.type === 'perk_speed') {
          if (this.playerStats.credits >= 3000 && !this.playerStats.activePerks['speed_cola']) {
            this.playerStats.credits -= 3000;
            this.playerStats.activePerks['speed_cola'] = true;
            sound.announce('Speed Cola acquired! Hyper Reload!');
          }
        }
      }
    }
  }

  private rollMysteryBox() {
    this.mysteryBoxActive = true;
    sound.playMysteryBoxJingle();

    const weaponList: WeaponId[] = [
      'm4_carbine',
      'mp5_smg',
      'spore12_shotgun',
      'barrett_sniper',
      'ray_cell',
      'acid_spewer',
      'plasma_launcher'
    ];

    setTimeout(() => {
      const picked = weaponList[Math.floor(Math.random() * weaponList.length)];
      this.playerStats.equippedWeapon = picked;
      if (!this.playerStats.ownedWeapons.includes(picked)) {
        this.playerStats.ownedWeapons.push(picked);
      }
      this.mysteryBoxActive = false;
      sound.announce(`Mystery Box: ${WEAPONS[picked].name}!`);
      this.triggerMedal('streak', WEAPONS[picked].name.toUpperCase(), 100, 50);
    }, 2800);
  }

  private spawnLootDrop(x: number, z: number) {
    const isMedkit = Math.random() < 0.35;
    const geo = new THREE.BoxGeometry(0.7, 0.5, 0.7);
    const mat = new THREE.MeshStandardMaterial({
      color: isMedkit ? 0x10b981 : 0x38bdf8,
      emissive: isMedkit ? 0x059669 : 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.45, z);
    this.scene.add(mesh);

    this.drops.push({
      id: this.nextEntityId++,
      x,
      z,
      type: isMedkit ? 'medkit' : 'ammo',
      meshGroup: mesh,
      angle: 0
    });
  }

  // SHOP TRANSACTIONS
  public buyWeapon(wId: WeaponId) {
    const wep = WEAPONS[wId];
    if (!wep || this.playerStats.ownedWeapons.includes(wId)) return;
    if (this.playerStats.coins >= wep.price) {
      this.playerStats.coins -= wep.price;
      this.playerStats.ownedWeapons.push(wId);
      this.playerStats.weaponLevels[wId] = 1;
      if (!this.playerStats.ammo[wId]) {
        this.playerStats.ammo[wId] = {
          mag: wep.magazineSize,
          reserve: wep.maxReserveAmmo
        };
      }
      this.switchWeapon(wId);
      this.triggerMedal('streak', `${wep.name.toUpperCase()} UNLOCKED!`, 150, 0);
    }
  }

  public upgradeWeapon(wId: WeaponId) {
    const currentLvl = this.playerStats.weaponLevels[wId] || 1;
    const cost = getUpgradeCost(wId, currentLvl);
    if (this.playerStats.coins >= cost && currentLvl < WEAPONS[wId].maxLevel) {
      this.playerStats.coins -= cost;
      this.playerStats.weaponLevels[wId] = currentLvl + 1;
      const upgradedStats = getWeaponStats(wId, currentLvl + 1);
      const ammoInfo = this.playerStats.ammo[wId];
      if (ammoInfo) {
        ammoInfo.mag = upgradedStats.magazineSize;
        ammoInfo.reserve = Math.max(ammoInfo.reserve, upgradedStats.maxReserveAmmo);
      }
      this.triggerMedal('streak', `${WEAPONS[wId].name.toUpperCase()} TIER ${currentLvl + 1}!`, 200, 0);
    }
  }

  public equipWeapon(wId: WeaponId, slot: 'primary' | 'secondary') {
    if (!this.playerStats.ownedWeapons.includes(wId)) return;
    if (slot === 'primary') {
      this.playerStats.equippedWeapon = wId;
    } else {
      this.playerStats.secondaryWeapon = wId;
    }
  }

  public buySpecialAmmo(type: SpecialAmmoType) {
    const item = SPECIAL_AMMO_SHOP.find((s) => s.id === type);
    if (!item || this.playerStats.coins < item.cost) return;
    this.playerStats.coins -= item.cost;
    this.playerStats.specialAmmo = type;
    this.playerStats.specialAmmoShotsRemaining = item.shotsCount;
    this.triggerMedal('streak', `${item.name.toUpperCase()} EQUIPPED!`, 100, 0);
  }

  public buySupplies(type: 'grenade' | 'shield' | 'medkit') {
    if (type === 'grenade' && this.playerStats.coins >= 100) {
      this.playerStats.coins -= 100;
      this.playerStats.grenades += 2;
    } else if (type === 'shield' && this.playerStats.coins >= 120) {
      this.playerStats.coins -= 120;
      this.playerStats.shield = this.playerStats.maxShield;
    } else if (type === 'medkit' && this.playerStats.coins >= 150) {
      this.playerStats.coins -= 150;
      this.playerStats.hp = this.playerStats.maxHp;
      this.playerStats.shield = this.playerStats.maxShield;
    }
  }

  private checkKillstreaks() {
    for (const ks of KILLSTREAKS) {
      if (
        this.playerStats.currentStreak >= ks.killsRequired &&
        !this.playerStats.unlockedKillstreaks.includes(ks.id)
      ) {
        this.playerStats.unlockedKillstreaks.push(ks.id);
        sound.announce(`${ks.name} is ready!`);
        this.triggerMedal('streak', `${ks.name.toUpperCase()} READY`, 200, 25);
      }
    }
  }

  public activateKillstreak(id: KillstreakId) {
    const idx = this.playerStats.unlockedKillstreaks.indexOf(id);
    if (idx === -1) return;

    this.playerStats.unlockedKillstreaks.splice(idx, 1);

    switch (id) {
      case 'uav':
        sound.announce('Bio-Radar active! Enemies spotted!');
        this.triggerMedal('streak', 'UAV RADAR ONLINE', 100, 0);
        break;

      case 'predator': {
        sound.announce('Predator Bio-Missile inbound!');
        const targetX = this.mouseWorldPos.x;
        const targetZ = this.mouseWorldPos.z;

        setTimeout(() => {
          this.explodeGrenade({
            id: this.nextEntityId++,
            x: targetX,
            y: 0,
            z: targetZ,
            vx: 0,
            vy: 0,
            vz: 0,
            fuseTimer: 0,
            radius: 18,
            damage: 850,
            mesh: null
          });
        }, 900);
        break;
      }

      case 'sentry': {
        sound.announce('Deploying cute Sentry Gun!');
        const sentryMesh = createSentryGunModel();
        sentryMesh.position.copy(this.playerGroup.position);
        this.scene.add(sentryMesh);

        this.sentries.push({
          id: this.nextEntityId++,
          x: this.playerGroup.position.x,
          z: this.playerGroup.position.z,
          angle: this.playerGroup.rotation.y,
          targetAngle: this.playerGroup.rotation.y,
          hp: 400,
          maxHp: 400,
          fireCooldown: 0.12,
          fireTimer: 0,
          lifeTimer: 35,
          meshGroup: sentryMesh
        });
        break;
      }

      case 'juggernaut':
        sound.announce('JUGGERNAUT SUIT ACTIVATED!');
        this.playerStats.hasJuggernaut = true;
        this.playerStats.juggernautTimer = 30;
        this.playerStats.maxHp = 400;
        this.playerStats.hp = 400;
        this.playerStats.shield = 100;
        this.addScreenShake(0.8);
        break;
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 9.8 * dt;

      p.mesh.position.set(p.x, p.y, p.z);
      const scale = Math.max(0.001, (p.life / p.maxLife) * p.size);
      p.mesh.scale.set(scale, scale, scale);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  private spawnCartoonMuzzleFlash(origin: THREE.Vector3, forwardAngle: number) {
    const geo = new THREE.SphereGeometry(0.18, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const flashMesh = new THREE.Mesh(geo, mat);
    flashMesh.position.copy(origin).add(new THREE.Vector3(Math.sin(forwardAngle) * 0.8, 0, Math.cos(forwardAngle) * 0.8));
    this.scene.add(flashMesh);

    this.particles.push({
      x: flashMesh.position.x,
      y: flashMesh.position.y,
      z: flashMesh.position.z,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0.06,
      maxLife: 0.06,
      size: 0.35,
      color: 0xfef08a,
      mesh: flashMesh
    });
  }

  private spawnComicStarburst(x: number, y: number, z: number, color: number) {
    const count = 7;
    const geo = new THREE.SphereGeometry(0.12, 6, 6);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      this.particles.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 12,
        vy: 2 + Math.random() * 8,
        vz: (Math.random() - 0.5) * 12,
        life: 0.22,
        maxLife: 0.22,
        size: 0.18,
        color,
        mesh
      });
    }
  }

  private spawnCartoonPuff(x: number, y: number, z: number, color: number) {
    const geo = new THREE.SphereGeometry(0.12, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.particles.push({
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 2,
      vy: 0.8 + Math.random() * 1.5,
      vz: (Math.random() - 0.5) * 2,
      life: 0.28,
      maxLife: 0.28,
      size: 0.22,
      color,
      mesh
    });
  }

  private spawnCartoonDeathBurst(x: number, z: number, color: number) {
    const count = 22;
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.6
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.8, z);
      this.scene.add(mesh);

      this.particles.push({
        x,
        y: 0.8,
        z,
        vx: (Math.random() - 0.5) * 16,
        vy: 3 + Math.random() * 12,
        vz: (Math.random() - 0.5) * 16,
        life: 0.55,
        maxLife: 0.55,
        size: 0.28,
        color,
        mesh
      });
    }
  }

  private spawnCartoonExplosionVFX(x: number, y: number, z: number) {
    const count = 40;
    const geo = new THREE.SphereGeometry(0.35, 8, 8);
    for (let i = 0; i < count; i++) {
      const isFire = Math.random() < 0.65;
      const color = isFire ? 0xfbbf24 : 0xf43f5e;
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + 0.5, z);
      this.scene.add(mesh);

      this.particles.push({
        x,
        y: y + 0.5,
        z,
        vx: (Math.random() - 0.5) * 24,
        vy: 3 + Math.random() * 16,
        vz: (Math.random() - 0.5) * 24,
        life: 0.65,
        maxLife: 0.65,
        size: 0.45,
        color,
        mesh
      });
    }
  }

  public addScreenShake(amount: number) {
    this.screenShake = Math.min(1.5, this.screenShake + amount);
  }

  private updateCamera(dt: number) {
    const targetCamX = this.playerGroup.position.x;
    const targetCamZ = this.playerGroup.position.z + 18;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 6, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 6, dt);

    if (this.screenShake > 0.01) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 1.5;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 1.5;
      this.camera.position.x += shakeX;
      this.camera.position.y = 25 + shakeY;
      this.screenShake = Math.max(0, this.screenShake - dt * 2.5);
    } else {
      this.camera.position.y = 25;
      this.screenShake = 0;
    }

    this.camera.lookAt(
      this.playerGroup.position.x,
      0,
      this.playerGroup.position.z
    );
  }

  public triggerMedal(type: 'kill' | 'headshot' | 'streak' | 'multikill' | 'wave' | 'coin', text: string, xp: number, coins: number = 0) {
    if (this.onMedalPopup) {
      this.onMedalPopup({
        id: Math.random().toString(),
        text,
        xp,
        coins,
        type,
        timestamp: performance.now()
      });
    }
  }

  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
  }
}
