import React, { useState } from 'react';
import { PlayerStats, WeaponId, SpecialAmmoType } from '../types/game';
import { WEAPONS, getWeaponStats, getUpgradeCost, SPECIAL_AMMO_SHOP } from '../game/weapons';
import { sound } from '../audio/soundSystem';
import {
  X,
  Coins,
  Shield,
  Zap,
  Bomb,
  Heart,
  Star,
  Check,
  ChevronRight,
  Flame,
  Rocket
} from 'lucide-react';

interface ShopModalProps {
  stats: PlayerStats;
  onClose: () => void;
  onBuyWeapon: (weaponId: WeaponId) => void;
  onUpgradeWeapon: (weaponId: WeaponId) => void;
  onEquipWeapon: (weaponId: WeaponId, slot: 'primary' | 'secondary') => void;
  onBuySpecialAmmo: (ammoType: SpecialAmmoType) => void;
  onBuySupplies: (type: 'grenade' | 'shield' | 'medkit') => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  stats,
  onClose,
  onBuyWeapon,
  onUpgradeWeapon,
  onEquipWeapon,
  onBuySpecialAmmo,
  onBuySupplies
}) => {
  const [activeTab, setActiveTab] = useState<'guns' | 'upgrades' | 'gear'>('guns');
  const [selectedWeaponId, setSelectedWeaponId] = useState<WeaponId>(stats.equippedWeapon);

  const selectedDef = WEAPONS[selectedWeaponId];
  const selectedLvl = stats.weaponLevels[selectedWeaponId] || 1;
  const currentStats = getWeaponStats(selectedWeaponId, selectedLvl);
  const nextStats = selectedLvl < selectedDef.maxLevel ? getWeaponStats(selectedWeaponId, selectedLvl + 1) : null;
  const upgradeCost = getUpgradeCost(selectedWeaponId, selectedLvl);
  const isOwned = stats.ownedWeapons.includes(selectedWeaponId);

  const handleBuy = (wId: WeaponId) => {
    const cost = WEAPONS[wId].price;
    if (stats.coins >= cost && !stats.ownedWeapons.includes(wId)) {
      sound.playPurchase();
      onBuyWeapon(wId);
    }
  };

  const handleUpgrade = (wId: WeaponId) => {
    const lvl = stats.weaponLevels[wId] || 1;
    const cost = getUpgradeCost(wId, lvl);
    if (stats.coins >= cost && lvl < WEAPONS[wId].maxLevel) {
      sound.playUpgrade();
      onUpgradeWeapon(wId);
    }
  };

  const allWeaponIds: WeaponId[] = [
    'm4_carbine',
    'mp5_smg',
    'spore12_shotgun',
    'barrett_sniper',
    'ray_cell',
    'acid_spewer',
    'plasma_launcher'
  ];

  return (
    <div className="absolute inset-0 bg-slate-950/80 z-40 flex items-center justify-center p-3 sm:p-6 font-sans select-none backdrop-blur-none">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[720px] bg-slate-900 border-3 border-indigo-500 rounded-3xl shadow-[0_12px_0_#1e1b4b] flex flex-col overflow-hidden text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b-2 border-indigo-500/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 border-2 border-white flex items-center justify-center shadow-[0_4px_0_#b45309]">
              <Flame className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-white drop-shadow">
                BIO-ARSENAL LOADOUT SHOP
              </h2>
              <p className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider">
                TACTICAL UPGRADES & WEAPONS DEPOT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Coins Balance Pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-950/90 border-2 border-amber-400 rounded-2xl shadow-[0_4px_0_#78350f]">
              <Coins className="w-5 h-5 text-yellow-300 fill-yellow-400" />
              <span className="text-lg font-black text-yellow-300 tabular-nums">
                {stats.coins.toLocaleString()}
              </span>
              <span className="text-[10px] font-black text-amber-200">COINS</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-rose-600 border-2 border-slate-700 hover:border-white rounded-2xl text-slate-300 hover:text-white transition shadow-[0_4px_0_#0f172a] cursor-pointer"
              title="Close Shop [Esc / B]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-indigo-900/80 bg-slate-950/60 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('guns')}
            className={`px-5 py-2.5 rounded-t-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'guns'
                ? 'bg-indigo-600 text-white border-t-2 border-x-2 border-indigo-400 shadow-[0_-2px_8px_rgba(79,70,229,0.4)]'
                : 'text-indigo-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🔫 BROWSE WEAPONS</span>
          </button>
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`px-5 py-2.5 rounded-t-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'upgrades'
                ? 'bg-amber-600 text-white border-t-2 border-x-2 border-amber-400 shadow-[0_-2px_8px_rgba(217,119,6,0.4)]'
                : 'text-indigo-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>⚡ STAT UPGRADES</span>
          </button>
          <button
            onClick={() => setActiveTab('gear')}
            className={`px-5 py-2.5 rounded-t-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'gear'
                ? 'bg-emerald-600 text-white border-t-2 border-x-2 border-emerald-400 shadow-[0_-2px_8px_rgba(5,150,105,0.4)]'
                : 'text-indigo-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🧪 AMMO & GEAR</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/60">
          {/* TAB 1: GUNS & WEAPONS */}
          {activeTab === 'guns' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allWeaponIds.map((wId) => {
                const wep = WEAPONS[wId];
                const owned = stats.ownedWeapons.includes(wId);
                const isEquippedPrimary = stats.equippedWeapon === wId;
                const isEquippedSecondary = stats.secondaryWeapon === wId;
                const lvl = stats.weaponLevels[wId] || 1;
                const statsForLvl = getWeaponStats(wId, lvl);
                const canAfford = stats.coins >= wep.price;

                return (
                  <div
                    key={wId}
                    onClick={() => setSelectedWeaponId(wId)}
                    className={`relative p-4 rounded-3xl border-2 flex flex-col justify-between transition cursor-pointer ${
                      selectedWeaponId === wId
                        ? 'bg-slate-800/90 border-cyan-400 shadow-[0_6px_0_#0284c7]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 shadow-[0_4px_0_#0f172a]'
                    }`}
                  >
                    <div>
                      {/* Badge / Category */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                          {wep.category}
                        </span>
                        {owned && (
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < lvl ? 'fill-amber-400' : 'text-slate-700'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-black text-white">{wep.name}</h3>
                      <p className="text-[11px] text-slate-300 font-medium line-clamp-2 mt-1 leading-snug">
                        {wep.description}
                      </p>

                      {/* Key Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold">DAMAGE: </span>
                          <span className="text-rose-400 font-black">{statsForLvl.damage}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold">MAG: </span>
                          <span className="text-cyan-400 font-black">{statsForLvl.magazineSize}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold">FIRE RATE: </span>
                          <span className="text-yellow-400 font-black">{statsForLvl.fireRate}/s</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold">RELOAD: </span>
                          <span className="text-emerald-400 font-black">{statsForLvl.reloadTime}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {owned ? (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sound.playReload('slide');
                              onEquipWeapon(wId, 'primary');
                            }}
                            className={`flex-1 py-1.5 text-xs font-black uppercase rounded-xl transition ${
                              isEquippedPrimary
                                ? 'bg-cyan-500 text-slate-950 shadow-[0_3px_0_#0369a1]'
                                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                            }`}
                          >
                            {isEquippedPrimary ? '✓ PRIMARY' : 'SET PRIMARY'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sound.playReload('slide');
                              onEquipWeapon(wId, 'secondary');
                            }}
                            className={`flex-1 py-1.5 text-xs font-black uppercase rounded-xl transition ${
                              isEquippedSecondary
                                ? 'bg-emerald-500 text-slate-950 shadow-[0_3px_0_#065f46]'
                                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700'
                            }`}
                          >
                            {isEquippedSecondary ? '✓ SEC.' : 'SET SEC.'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuy(wId);
                          }}
                          disabled={!canAfford}
                          className={`w-full py-2 flex items-center justify-center gap-2 text-xs font-black uppercase rounded-xl border-2 transition ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 border-white text-slate-950 shadow-[0_4px_0_#b45309] cursor-pointer'
                              : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Coins className="w-4 h-4 fill-amber-500" />
                          <span>UNLOCK FOR {wep.price} COINS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: WEAPON STAT UPGRADES */}
          {activeTab === 'upgrades' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Owned Weapon Selector */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-1">
                  SELECT OWNED WEAPON TO TUNE:
                </div>
                {stats.ownedWeapons.map((wId) => {
                  const wep = WEAPONS[wId];
                  const lvl = stats.weaponLevels[wId] || 1;
                  return (
                    <button
                      key={wId}
                      onClick={() => setSelectedWeaponId(wId)}
                      className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                        selectedWeaponId === wId
                          ? 'bg-amber-500 border-white text-slate-950 font-black shadow-[0_4px_0_#b45309]'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black">{wep.name}</div>
                        <div className="text-[10px] text-amber-200 mt-0.5">Level {lvl} / 5</div>
                      </div>
                      <ChevronRight className="w-5 h-5 opacity-80" />
                    </button>
                  );
                })}
              </div>

              {/* Center & Right Column: Upgrade Details & Stat Comparisons */}
              <div className="md:col-span-2 bg-slate-950/80 border-2 border-indigo-900 rounded-3xl p-6 flex flex-col justify-between shadow-[0_8px_0_#1e1b4b]">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-xl font-black text-white">{selectedDef.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < selectedLvl ? 'fill-amber-400' : 'text-slate-700'}`}
                          />
                        ))}
                        <span className="text-xs font-black ml-2 text-indigo-200">
                          Tier {selectedLvl} of 5
                        </span>
                      </div>
                    </div>

                    {selectedLvl < selectedDef.maxLevel ? (
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">UPGRADE COST</div>
                        <div className="text-xl font-black text-yellow-300 tabular-nums">
                          {upgradeCost} COINS
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-amber-500/20 border border-amber-400 rounded-xl text-xs font-black text-amber-300">
                        MAX LEVEL REACHED!
                      </div>
                    )}
                  </div>

                  {/* Stat Progression Comparison */}
                  <div className="flex flex-col gap-4 mt-6">
                    {/* Damage */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-300">DAMAGE POWER</span>
                        <span>
                          <span className="text-white font-black">{currentStats.damage}</span>
                          {nextStats && (
                            <span className="text-emerald-400 font-black ml-2">
                              ➔ {nextStats.damage} (+{nextStats.damage - currentStats.damage})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, (currentStats.damage / 320) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Magazine Capacity */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-300">MAGAZINE CAPACITY</span>
                        <span>
                          <span className="text-white font-black">{currentStats.magazineSize}</span>
                          {nextStats && (
                            <span className="text-emerald-400 font-black ml-2">
                              ➔ {nextStats.magazineSize} (+{nextStats.magazineSize - currentStats.magazineSize})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${Math.min(100, (currentStats.magazineSize / 100) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Reload Speed */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-300">RELOAD TIME (LOWER IS BETTER)</span>
                        <span>
                          <span className="text-white font-black">{currentStats.reloadTime}s</span>
                          {nextStats && (
                            <span className="text-emerald-400 font-black ml-2">
                              ➔ {nextStats.reloadTime}s
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${Math.max(20, (currentStats.reloadTime / 3.0) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Fire Rate */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-300">FIRE RATE</span>
                        <span>
                          <span className="text-white font-black">{currentStats.fireRate} rps</span>
                          {nextStats && (
                            <span className="text-emerald-400 font-black ml-2">
                              ➔ {nextStats.fireRate} rps
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${Math.min(100, (currentStats.fireRate / 24) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upgrade CTA */}
                {selectedLvl < selectedDef.maxLevel ? (
                  <button
                    onClick={() => handleUpgrade(selectedWeaponId)}
                    disabled={stats.coins < upgradeCost}
                    className={`mt-6 py-3.5 flex items-center justify-center gap-3 font-black text-sm uppercase rounded-2xl border-2 transition ${
                      stats.coins >= upgradeCost
                        ? 'bg-amber-400 hover:bg-amber-300 border-white text-slate-950 shadow-[0_6px_0_#b45309] cursor-pointer hover:scale-102 active:translate-y-1'
                        : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Zap className="w-5 h-5 fill-slate-950" />
                    <span>UPGRADE TO TIER {selectedLvl + 1} ({upgradeCost} COINS)</span>
                  </button>
                ) : (
                  <div className="mt-6 py-3 text-center text-xs font-black text-amber-400 bg-amber-950/40 border border-amber-500 rounded-2xl">
                    THIS WEAPON IS AT MAXIMUM COMBAT POWER!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SPECIAL AMMO & COMBAT SUPPLIES */}
          {activeTab === 'gear' && (
            <div className="flex flex-col gap-6">
              {/* Special Ammo Row */}
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>SPECIAL ELEMENTAL AMMO UPGRADES:</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SPECIAL_AMMO_SHOP.map((ammo) => {
                    const isEquipped = stats.specialAmmo === ammo.id && stats.specialAmmoShotsRemaining > 0;
                    const canAfford = stats.coins >= ammo.cost;

                    return (
                      <div
                        key={ammo.id}
                        className="p-4 bg-slate-950/80 border-2 border-slate-800 rounded-3xl flex flex-col justify-between shadow-[0_4px_0_#0f172a]"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black" style={{ color: ammo.color }}>
                              {ammo.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-bold border border-slate-700">
                              {ammo.shotsCount} Rounds
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-medium leading-snug">
                            {ammo.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                          {isEquipped ? (
                            <div className="w-full py-2 bg-emerald-600/30 border border-emerald-400 rounded-xl text-center text-xs font-black text-emerald-300">
                              ✓ {stats.specialAmmoShotsRemaining} SHOTS ACTIVE
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (canAfford) {
                                  sound.playPurchase();
                                  onBuySpecialAmmo(ammo.id);
                                }
                              }}
                              disabled={!canAfford}
                              className={`w-full py-2 flex items-center justify-center gap-2 text-xs font-black uppercase rounded-xl border-2 transition ${
                                canAfford
                                  ? 'bg-amber-400 hover:bg-amber-300 border-white text-slate-950 shadow-[0_4px_0_#b45309] cursor-pointer'
                                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <Coins className="w-4 h-4 fill-amber-500" />
                              <span>BUY ({ammo.cost} COINS)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Combat Consumables */}
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>TACTICAL SUPPLIES & AMMO PACKS:</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Frag Grenade Pack */}
                  <div className="p-4 bg-slate-950/80 border-2 border-slate-800 rounded-3xl flex flex-col justify-between shadow-[0_4px_0_#0f172a]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500 flex items-center justify-center">
                        <Bomb className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">+2 Bio-Grenades</div>
                        <div className="text-[10px] text-slate-400 font-bold">Current: {stats.grenades}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (stats.coins >= 100) {
                          sound.playPurchase();
                          onBuySupplies('grenade');
                        }
                      }}
                      disabled={stats.coins < 100}
                      className="mt-3 py-2 bg-emerald-500 hover:bg-emerald-400 border-2 border-white text-slate-950 font-black text-xs uppercase rounded-xl shadow-[0_4px_0_#065f46] cursor-pointer transition disabled:opacity-50"
                    >
                      BUY (100 COINS)
                    </button>
                  </div>

                  {/* Nano Shield Refill */}
                  <div className="p-4 bg-slate-950/80 border-2 border-slate-800 rounded-3xl flex flex-col justify-between shadow-[0_4px_0_#0f172a]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-950 border border-sky-500 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">Full Nano-Shield Recharge</div>
                        <div className="text-[10px] text-slate-400 font-bold">Recharges to 100%</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (stats.coins >= 120) {
                          sound.playPurchase();
                          onBuySupplies('shield');
                        }
                      }}
                      disabled={stats.coins < 120}
                      className="mt-3 py-2 bg-sky-500 hover:bg-sky-400 border-2 border-white text-slate-950 font-black text-xs uppercase rounded-xl shadow-[0_4px_0_#0369a1] cursor-pointer transition disabled:opacity-50"
                    >
                      RECHARGE (120 COINS)
                    </button>
                  </div>

                  {/* Medkit Stim */}
                  <div className="p-4 bg-slate-950/80 border-2 border-slate-800 rounded-3xl flex flex-col justify-between shadow-[0_4px_0_#0f172a]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-950 border border-rose-500 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">Full Health Syringe</div>
                        <div className="text-[10px] text-slate-400 font-bold">Restores to max HP</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (stats.coins >= 150) {
                          sound.playPurchase();
                          onBuySupplies('medkit');
                        }
                      }}
                      disabled={stats.coins < 150}
                      className="mt-3 py-2 bg-rose-500 hover:bg-rose-400 border-2 border-white text-white font-black text-xs uppercase rounded-xl shadow-[0_4px_0_#9f1239] cursor-pointer transition disabled:opacity-50"
                    >
                      HEAL (150 COINS)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
