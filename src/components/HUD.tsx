import React, { useState } from 'react';
import { PlayerStats, MedalPopup, FloatingCoinPopup, WeaponId } from '../types/game';
import { WEAPONS, getWeaponStats, KILLSTREAKS } from '../game/weapons';
import { sound } from '../audio/soundSystem';
import {
  Volume2,
  VolumeX,
  Shield,
  Heart,
  Zap,
  Bomb,
  Award,
  Sparkles,
  Coins,
  ShoppingBag,
  Flame,
  Snowflake,
  Crosshair
} from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  medals: MedalPopup[];
  floatingPopups: FloatingCoinPopup[];
  hitmarker: { active: boolean; isHeadshot: boolean; isKill: boolean };
  onActivateKillstreak: (id: any) => void;
  onSwitchWeapon: (id: WeaponId) => void;
  onThrowGrenade: () => void;
  onTogglePause: () => void;
  onOpenShop: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  medals,
  floatingPopups,
  hitmarker,
  onActivateKillstreak,
  onSwitchWeapon,
  onThrowGrenade,
  onTogglePause,
  onOpenShop
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const curLevel = stats.weaponLevels[stats.equippedWeapon] || 1;
  const curWeapon = getWeaponStats(stats.equippedWeapon, curLevel);
  const secLevel = stats.weaponLevels[stats.secondaryWeapon] || 1;
  const secWeapon = getWeaponStats(stats.secondaryWeapon, secLevel);
  const ammoInfo = stats.ammo[stats.equippedWeapon] || { mag: 0, reserve: 0 };

  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (stats.shield / stats.maxShield) * 100));
  const staminaPercent = Math.max(0, Math.min(100, (stats.stamina / stats.maxStamina) * 100));
  const isBloody = stats.hp < 60;

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans text-white">
      {/* 1. Low Health Vignette: Stylized Cartoon Coral Pulse */}
      {isBloody && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, transparent 45%, rgba(244, 63, 94, ${
              (1 - stats.hp / 60) * 0.65
            }) 100%)`,
            boxShadow: 'inset 0 0 80px rgba(225, 29, 72, 0.7)'
          }}
        />
      )}

      {/* 2. Floating Animated 3D-to-2D Coin & XP Popups */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingPopups.map((popup) => (
          <div
            key={popup.id}
            className="absolute flex items-center gap-1 font-black text-sm text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-float-up pointer-events-none"
            style={{
              left: `${popup.x}%`,
              top: `${popup.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-base">🪙</span>
            <span>{popup.text}</span>
          </div>
        ))}
      </div>

      {/* 3. Center Crosshair & Comic Hitmarkers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/80 shadow-[0_0_10px_#38bdf8]" />
          <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]" />

          {hitmarker.active && (
            <div
              className={`absolute w-10 h-10 transition-all duration-75 scale-125 flex items-center justify-center ${
                hitmarker.isKill
                  ? 'text-red-500 drop-shadow-[0_0_12px_#ef4444]'
                  : hitmarker.isHeadshot
                  ? 'text-yellow-400 drop-shadow-[0_0_12px_#facc15]'
                  : 'text-white drop-shadow-[0_0_8px_#ffffff]'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-full h-full stroke-[3.5]" fill="none">
                <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeLinecap="round" />
                <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* 4. Upper Center: Medals & Floating Rewards */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        {medals.slice(-3).map((medal) => (
          <div
            key={medal.id}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-violet-900 to-indigo-900 border-2 border-amber-400 rounded-full shadow-[0_6px_0_#4c1d95] animate-bounce"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span className="text-xs font-black tracking-wide text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {medal.text}
            </span>
            <span className="text-xs font-black text-amber-300 tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              +{medal.xp} XP
            </span>
            {medal.coins > 0 && (
              <span className="text-xs font-black text-yellow-300 tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                +{medal.coins} 🪙
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 5. Top-Left: Wave, Score, and Golden Coin Counter */}
      <div className="absolute top-5 left-5 flex flex-col gap-2.5">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/90 border-2 border-indigo-500/60 rounded-2xl shadow-[0_6px_0_#1e1b4b]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider">WAVE</span>
            <span className="text-xl font-black text-cyan-400 tabular-nums drop-shadow-[0_0_8px_#06b6d4]">
              {stats.wave}
            </span>
          </div>
          <div className="w-0.5 h-5 bg-slate-700/80 rounded" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider">SCORE</span>
            <span className="text-base font-black text-yellow-400 tabular-nums">
              {stats.score}
            </span>
          </div>
          <div className="w-0.5 h-5 bg-slate-700/80 rounded" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider">KILLS</span>
            <span className="text-base font-black text-rose-400 tabular-nums">
              {stats.kills}
            </span>
          </div>
        </div>

        {/* Big Juicy Coin Balance Pill */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 border-2 border-white rounded-2xl shadow-[0_5px_0_#b45309] w-fit">
          <Coins className="w-5 h-5 text-slate-950 fill-slate-950" />
          <span className="text-lg font-black text-slate-950 tabular-nums tracking-tight">
            {stats.coins.toLocaleString()}
          </span>
          <span className="text-[10px] font-black text-amber-950 uppercase">COINS</span>
        </div>

        {/* Special Elemental Ammo Badge */}
        {stats.specialAmmo !== 'standard' && stats.specialAmmoShotsRemaining > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border-2 border-lime-400 rounded-xl shadow-[0_3px_0_#365314] w-fit">
            {stats.specialAmmo === 'acid_rounds' ? (
              <Flame className="w-4 h-4 text-lime-400" />
            ) : stats.specialAmmo === 'cryo_pellets' ? (
              <Snowflake className="w-4 h-4 text-cyan-400" />
            ) : (
              <Bomb className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-black text-lime-300 uppercase">
              {stats.specialAmmo.replace('_', ' ')}
            </span>
            <span className="text-xs font-black text-white px-1.5 py-0.5 bg-black/40 rounded">
              {stats.specialAmmoShotsRemaining}
            </span>
          </div>
        )}
      </div>

      {/* 6. Top-Right: Loadout Shop CTA, Sound, Pause, and Bio-Radar */}
      <div className="absolute top-5 right-5 flex flex-col items-end gap-2.5">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* LOADOUT SHOP BUTTON */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 border-2 border-white text-slate-950 font-black text-xs uppercase rounded-2xl shadow-[0_5px_0_#b45309] hover:scale-105 active:translate-y-1 transition cursor-pointer"
            title="Open Loadout Shop [B]"
          >
            <ShoppingBag className="w-4 h-4 fill-slate-950" />
            <span>ARSENAL SHOP [B]</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-2.5 bg-slate-900/90 border-2 border-slate-700 hover:border-cyan-400 rounded-2xl transition text-slate-300 hover:text-white shadow-[0_4px_0_#1e1b4b] cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            onClick={onTogglePause}
            className="px-4 py-2 bg-slate-900/90 border-2 border-slate-700 hover:border-cyan-400 rounded-2xl text-xs font-black text-slate-300 hover:text-white shadow-[0_4px_0_#1e1b4b] transition cursor-pointer"
          >
            PAUSE [ESC]
          </button>
        </div>

        {/* Bio-Radar Disk */}
        <div className="relative w-28 h-28 rounded-full bg-indigo-950/90 border-2 border-cyan-400/60 overflow-hidden shadow-[0_6px_0_#1e1b4b] flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:14px_14px] opacity-35" />
          <div className="w-full h-0.5 bg-cyan-400/40" />
          <div className="h-full w-0.5 bg-cyan-400/40 absolute" />
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#38bdf8] z-10 border border-white" />
          <div className="absolute bottom-1.5 text-[9px] font-black text-cyan-300 tracking-wider">
            BIO-RADAR
          </div>
        </div>
      </div>

      {/* 7. Bottom-Left: Health & Shield Gauges */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 w-64">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs font-black text-sky-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 fill-sky-400" /> NANO-SHIELD
            </span>
            <span className="tabular-nums">{Math.round(stats.shield)} / {stats.maxShield}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-950 border-2 border-sky-600/80 rounded-full overflow-hidden shadow-[0_3px_0_#0c4a6e]">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-150 rounded-full"
              style={{ width: `${shieldPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs font-black text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> HEALTH
            </span>
            <span className="tabular-nums">{Math.round(stats.hp)} / {stats.maxHp}</span>
          </div>
          <div className="h-3 w-full bg-slate-950 border-2 border-slate-700 rounded-full overflow-hidden shadow-[0_3px_0_#0f172a]">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                stats.hp < 35
                  ? 'bg-rose-500'
                  : stats.hp < 70
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-75 rounded-full"
            style={{ width: `${staminaPercent}%` }}
          />
        </div>
      </div>

      {/* 8. Bottom-Center: Killstreak Activators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 pointer-events-auto">
        {KILLSTREAKS.map((ks, idx) => {
          const isUnlocked = stats.unlockedKillstreaks.includes(ks.id);
          const streakHotkeys = ['3', '4', '5', '6'];
          return (
            <button
              key={ks.id}
              onClick={() => onActivateKillstreak(ks.id)}
              disabled={!isUnlocked}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-2xl border-2 transition-all ${
                isUnlocked
                  ? 'bg-amber-500 border-white text-slate-950 font-black shadow-[0_5px_0_#b45309] cursor-pointer hover:scale-105 active:translate-y-1'
                  : 'bg-slate-900/80 border-slate-700 text-slate-500 shadow-[0_4px_0_#1e1b4b] opacity-60 cursor-not-allowed'
              }`}
              title={`${ks.name} ([${streakHotkeys[idx]}] key)`}
            >
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span className="px-1.5 py-0.5 bg-black/30 rounded text-white text-[10px]">
                  {streakHotkeys[idx]}
                </span>
                <span className="truncate max-w-[80px]">{ks.name.split(' ')[0]}</span>
              </div>
              <span className="text-[10px] mt-0.5">
                {isUnlocked ? 'READY!' : `${stats.currentStreak}/${ks.killsRequired}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* 9. Bottom-Right: Weapon Status, Tier Level, and Ammo */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 pointer-events-auto">
        <button
          onClick={onThrowGrenade}
          className="flex flex-col items-center justify-center p-3 bg-emerald-950/90 border-2 border-emerald-400 rounded-2xl shadow-[0_5px_0_#064e3b] hover:scale-105 active:translate-y-1 transition text-white cursor-pointer"
          title="Throw Bio-Grenade [G or Q]"
        >
          <Bomb className="w-6 h-6 text-emerald-400 fill-emerald-500" />
          <span className="text-[11px] font-black mt-1 text-emerald-200">[G] {stats.grenades}</span>
        </button>

        <div className="flex flex-col p-4 bg-slate-900/90 border-2 border-cyan-500/80 rounded-2xl shadow-[0_6px_0_#1e1b4b] min-w-[220px]">
          <div className="flex items-center justify-between text-xs font-black mb-1">
            <span className="text-cyan-300 uppercase tracking-wide truncate max-w-[130px]">
              {curWeapon.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black">
              TIER {curLevel}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-4xl font-black tabular-nums tracking-tight ${
                ammoInfo.mag <= curWeapon.magazineSize * 0.25
                  ? 'text-rose-500 animate-pulse'
                  : 'text-white'
              }`}
            >
              {stats.isReloading ? '--' : ammoInfo.mag}
            </span>
            <span className="text-base font-bold text-slate-400 tabular-nums">
              / {ammoInfo.reserve}
            </span>
          </div>

          {stats.isReloading && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-amber-400 font-black">
              <span>RELOADING...</span>
              <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.round(stats.reloadProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => onSwitchWeapon(stats.secondaryWeapon)}
            className="mt-2.5 pt-1.5 border-t border-slate-700/80 flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-cyan-300 transition cursor-pointer"
          >
            <span>[2] {secWeapon.name}</span>
            <span className="text-cyan-400 font-black">SWAP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
