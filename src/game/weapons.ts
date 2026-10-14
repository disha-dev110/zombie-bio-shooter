import { WeaponDef, WeaponId, KillstreakDef, PerkDef, SpecialAmmoType } from '../types/game';

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  m4_carbine: {
    id: 'm4_carbine',
    name: 'M4A1 Enzyme',
    category: 'Assault Rifle',
    damage: 36,
    fireRate: 11, // ~660 RPM
    magazineSize: 30,
    maxReserveAmmo: 180,
    reloadTime: 1.7,
    spread: 0.04,
    bulletSpeed: 52,
    bulletCount: 1,
    bulletColor: '#38bdf8',
    penetration: 1,
    range: 55,
    recoilKick: 0.035,
    soundType: 'rifle',
    description: 'Rapid-firing tactical assault carbine with high bio-kinetic velocity. Very versatile!',
    price: 0, // Default starting weapon
    upgradeBaseCost: 150,
    maxLevel: 5
  },
  mp5_smg: {
    id: 'mp5_smg',
    name: 'MP5 Cytokine',
    category: 'Submachine Gun',
    damage: 26,
    fireRate: 15.5, // ~930 RPM
    magazineSize: 40,
    maxReserveAmmo: 240,
    reloadTime: 1.3,
    spread: 0.075,
    bulletSpeed: 46,
    bulletCount: 1,
    bulletColor: '#4ade80',
    penetration: 1,
    range: 36,
    recoilKick: 0.02,
    soundType: 'smg',
    description: 'Ultra-fast submachine gun for close-quarters pathogen clearing and aggressive mobile brawling.',
    price: 350,
    upgradeBaseCost: 200,
    maxLevel: 5
  },
  spore12_shotgun: {
    id: 'spore12_shotgun',
    name: 'Spore-12 Breacher',
    category: 'Shotgun',
    damage: 20, // 20 * 8 = 160 point blank!
    fireRate: 2.0,
    magazineSize: 8,
    maxReserveAmmo: 48,
    reloadTime: 2.0,
    spread: 0.17,
    bulletSpeed: 40,
    bulletCount: 8,
    bulletColor: '#f97316',
    penetration: 1,
    range: 25,
    recoilKick: 0.12,
    soundType: 'shotgun',
    description: 'Heavy pump-action bio-shotgun firing clusters of corrosive buckshot. Massive close-range impact!',
    price: 600,
    upgradeBaseCost: 250,
    maxLevel: 5
  },
  barrett_sniper: {
    id: 'barrett_sniper',
    name: 'Barrett .50 Anti-Viral',
    category: 'Sniper',
    damage: 180,
    fireRate: 1.25,
    magazineSize: 5,
    maxReserveAmmo: 30,
    reloadTime: 2.3,
    spread: 0.005,
    bulletSpeed: 82,
    bulletCount: 1,
    bulletColor: '#ec4899',
    penetration: 3,
    range: 85,
    recoilKick: 0.2,
    soundType: 'sniper',
    description: 'High-caliber anti-material rifle engineered to pierce multiple heavy pathogens with one devastating shot.',
    price: 900,
    upgradeBaseCost: 350,
    maxLevel: 5
  },
  ray_cell: {
    id: 'ray_cell',
    name: 'Ray-Cell Mark II',
    category: 'Wonder Weapon',
    damage: 110,
    fireRate: 5.0,
    magazineSize: 24,
    maxReserveAmmo: 120,
    reloadTime: 1.8,
    spread: 0.015,
    bulletSpeed: 65,
    bulletCount: 2,
    bulletColor: '#a855f7',
    penetration: 2,
    range: 65,
    recoilKick: 0.05,
    soundType: 'laser',
    description: 'Legendary Wonder Weapon! Fires twin high-energy bio-plasma bolts that vaporize viral membranes into sparks.',
    price: 1500,
    upgradeBaseCost: 500,
    maxLevel: 5
  },
  acid_spewer: {
    id: 'acid_spewer',
    name: 'Phagocyte Flamethrower',
    category: 'Heavy',
    damage: 18,
    fireRate: 22,
    magazineSize: 80,
    maxReserveAmmo: 240,
    reloadTime: 2.4,
    spread: 0.22,
    bulletSpeed: 32,
    bulletCount: 1,
    bulletColor: '#eab308',
    penetration: 4,
    range: 22,
    recoilKick: 0.01,
    soundType: 'acid',
    description: 'Pressurized lysosomal digestive acid projector that incinerates incoming swarms and melt armor.',
    price: 1200,
    upgradeBaseCost: 400,
    maxLevel: 5
  },
  plasma_launcher: {
    id: 'plasma_launcher',
    name: 'Bio-Mortar RPG',
    category: 'Explosive',
    damage: 320,
    fireRate: 0.9,
    magazineSize: 3,
    maxReserveAmmo: 15,
    reloadTime: 2.8,
    spread: 0.02,
    bulletSpeed: 35,
    bulletCount: 1,
    bulletColor: '#38bdf8',
    penetration: 5,
    range: 60,
    recoilKick: 0.25,
    soundType: 'rocket',
    description: 'Heavy shoulder-mounted cannon launching explosive bio-warheads that detonate in a massive shockwave!',
    price: 2000,
    upgradeBaseCost: 600,
    maxLevel: 5
  }
};

/**
 * Calculates dynamically scaled stats for a weapon based on its current level (1 to 5)
 */
export function getWeaponStats(weaponId: WeaponId, level: number = 1): WeaponDef {
  const base = WEAPONS[weaponId];
  if (!base) return WEAPONS.m4_carbine;

  const lvl = Math.max(1, Math.min(5, level));
  // Multipliers per level: Lv 1=1.0x, Lv 2=1.25x, Lv 3=1.55x, Lv 4=1.90x, Lv 5=2.35x
  const damageMult = 1 + (lvl - 1) * 0.34;
  const magMult = 1 + (lvl - 1) * 0.2;
  const reloadMult = Math.max(0.65, 1 - (lvl - 1) * 0.08); // faster reload
  const fireRateMult = 1 + (lvl - 1) * 0.08;

  return {
    ...base,
    damage: Math.round(base.damage * damageMult),
    magazineSize: Math.round(base.magazineSize * magMult),
    reloadTime: Number((base.reloadTime * reloadMult).toFixed(2)),
    fireRate: Number((base.fireRate * fireRateMult).toFixed(1))
  };
}

/**
 * Calculates coin cost to upgrade a weapon from currentLevel to next
 */
export function getUpgradeCost(weaponId: WeaponId, currentLevel: number): number {
  const base = WEAPONS[weaponId];
  if (!base || currentLevel >= base.maxLevel) return 0;
  return Math.round(base.upgradeBaseCost * Math.pow(1.5, currentLevel - 1));
}

export interface SpecialAmmoItem {
  id: SpecialAmmoType;
  name: string;
  cost: number;
  shotsCount: number;
  description: string;
  color: string;
}

export const SPECIAL_AMMO_SHOP: SpecialAmmoItem[] = [
  {
    id: 'acid_rounds',
    name: 'Caustic Acid Bullets',
    cost: 180,
    shotsCount: 60,
    description: 'Coats projectiles in digestive enzymes, dealing +40% corrosive burn damage over 2 seconds.',
    color: '#a3e635'
  },
  {
    id: 'cryo_pellets',
    name: 'Cryo-Freeze Rounds',
    cost: 220,
    shotsCount: 50,
    description: 'Slows enemy movement by 50% on hit, freezing aggressive swarms in their tracks.',
    color: '#38bdf8'
  },
  {
    id: 'explosive_darts',
    name: 'Micro-Explosive Darts',
    cost: 300,
    shotsCount: 40,
    description: 'Embeds miniature bio-explosives that detonate upon impact for huge area of effect damage.',
    color: '#f97316'
  }
];

export const KILLSTREAKS: KillstreakDef[] = [
  {
    id: 'uav',
    name: 'Bio-Radar (UAV)',
    killsRequired: 3,
    icon: 'Radio',
    description: 'Reconnaissance sweep that highlights all pathogens on your tactical radar.'
  },
  {
    id: 'predator',
    name: 'Predator Bio-Missile',
    killsRequired: 5,
    icon: 'Crosshair',
    description: 'Laser-guided surgical air-dropped missile striking target coordinates with massive explosive radius.'
  },
  {
    id: 'sentry',
    name: 'Automated Sentry Gun',
    killsRequired: 7,
    icon: 'ShieldAlert',
    description: 'Deploys a rapid-fire dual-barrel automated defense turret tracking and terminating hostiles.'
  },
  {
    id: 'juggernaut',
    name: 'Task Force Juggernaut',
    killsRequired: 10,
    icon: 'Zap',
    description: 'Calls in reinforced chitin-exoskeleton armor and infinite-spin minigun for unstoppable power.'
  }
];

export const PERKS: Record<string, PerkDef> = {
  juggernog: {
    id: 'juggernog',
    name: 'Juggernog',
    cost: 2500,
    color: '#ef4444',
    description: 'Increases health capacity from 100 to 250 HP and accelerates recovery time.'
  },
  speed_cola: {
    id: 'speed_cola',
    name: 'Speed Cola',
    cost: 3000,
    color: '#10b981',
    description: 'Cuts reload times by 50% and weapon switch delay by half.'
  },
  double_tap: {
    id: 'double_tap',
    name: 'Double Tap Root Beer',
    cost: 2000,
    color: '#f59e0b',
    description: 'Boosts weapon fire rate by 33% and delivers extra kinetic punch.'
  },
  stamin_up: {
    id: 'stamin_up',
    name: 'Stamin-Up',
    cost: 2000,
    color: '#3b82f6',
    description: 'Increases movement speed by 25% and grants continuous tactical sprint.'
  }
};
