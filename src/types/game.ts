export type GameMode = 'spec_ops' | 'zombies' | 'boss_assault';

export type WeaponId =
  | 'm4_carbine'
  | 'mp5_smg'
  | 'spore12_shotgun'
  | 'barrett_sniper'
  | 'ray_cell'
  | 'acid_spewer'
  | 'plasma_launcher';

export type SpecialAmmoType = 'standard' | 'acid_rounds' | 'cryo_pellets' | 'explosive_darts';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: 'Assault Rifle' | 'Submachine Gun' | 'Shotgun' | 'Sniper' | 'Wonder Weapon' | 'Heavy' | 'Explosive';
  damage: number;
  fireRate: number; // rounds per sec
  magazineSize: number;
  maxReserveAmmo: number;
  reloadTime: number; // seconds
  spread: number;
  bulletSpeed: number;
  bulletCount: number;
  bulletColor: string;
  penetration: number;
  range: number;
  recoilKick: number;
  soundType: 'rifle' | 'smg' | 'shotgun' | 'sniper' | 'laser' | 'acid' | 'rocket';
  description: string;
  price: number; // coin unlock cost
  upgradeBaseCost: number;
  maxLevel: number;
}

export type KillstreakId = 'uav' | 'predator' | 'sentry' | 'juggernaut';

export interface KillstreakDef {
  id: KillstreakId;
  name: string;
  killsRequired: number;
  icon: string;
  description: string;
}

export interface PerkDef {
  id: 'juggernog' | 'speed_cola' | 'double_tap' | 'stamin_up';
  name: string;
  cost: number;
  color: string;
  description: string;
}

export interface MedalPopup {
  id: string;
  text: string;
  xp: number;
  coins: number;
  type: 'kill' | 'headshot' | 'streak' | 'multikill' | 'wave' | 'coin';
  timestamp: number;
}

export interface FloatingCoinPopup {
  id: string;
  text: string;
  coins: number;
  x: number; // 0-100% or pixels
  y: number;
  timestamp: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  stamina: number;
  maxStamina: number;
  isSprinting: boolean;
  score: number;
  kills: number;
  headshots: number;
  currentStreak: number;
  wave: number;
  coins: number;
  totalCoinsEarned: number;
  ownedWeapons: WeaponId[];
  weaponLevels: Record<WeaponId, number>;
  specialAmmo: SpecialAmmoType;
  specialAmmoShotsRemaining: number;
  credits: number;
  activePerks: { [key: string]: boolean };
  hasJuggernaut: boolean;
  juggernautTimer: number;
  equippedWeapon: WeaponId;
  secondaryWeapon: WeaponId;
  ammo: {
    [key in WeaponId]?: {
      mag: number;
      reserve: number;
    };
  };
  isReloading: boolean;
  reloadProgress: number;
  grenades: number;
  unlockedKillstreaks: KillstreakId[];
}

export type EnemyType = 'grunt_bacillus' | 'viral_spiker' | 'sniper_spore' | 'zombie_walker' | 'bio_juggernaut';

export interface EnemyEntity {
  id: number;
  type: EnemyType;
  x: number;
  z: number;
  vx: number;
  vz: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  windupTimer: number;
  isWindingUp: boolean;
  color: number;
  scoreValue: number;
  coinValue: number;
  meshGroup: any;
  telegraphMesh?: any;
}

export interface BulletEntity {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  rangeRemaining: number;
  penetrationLeft: number;
  color: number;
  isPlayerBullet: boolean;
  mesh: any;
  specialType?: SpecialAmmoType;
}

export interface ParticleEntity {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  mesh: any;
}

export interface GrenadeEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fuseTimer: number;
  radius: number;
  damage: number;
  mesh: any;
}

export interface SentryTurretEntity {
  id: number;
  x: number;
  z: number;
  angle: number;
  targetAngle: number;
  hp: number;
  maxHp: number;
  fireCooldown: number;
  fireTimer: number;
  lifeTimer: number;
  meshGroup: any;
}

export interface DropItemEntity {
  id: number;
  x: number;
  z: number;
  type: 'ammo' | 'medkit' | 'coin_pickup' | 'mystery_box' | 'perk_juggernog' | 'perk_speed';
  cost?: number;
  value?: number;
  meshGroup: any;
  angle: number;
}
