import React, { useEffect, useState } from 'react';
import { GameMode, WeaponId } from '../types/game';
import { WEAPONS } from '../game/weapons';
import { Shield, Skull, Crosshair, Play, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../audio/soundSystem';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, primaryWeapon: WeaponId) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('spec_ops');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>('m4_carbine');
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame(selectedMode, selectedWeapon);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMode, selectedWeapon, onStartGame]);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-12 z-20 font-sans select-none overflow-y-auto">
      {/* Vibrant Stylized Cartoon Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-purple-950 to-slate-950 pointer-events-none opacity-95" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.22),transparent_65%)] pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-indigo-950/90 border-2 border-cyan-400 rounded-full text-xs text-cyan-300 font-black uppercase tracking-wider shadow-[0_4px_0_#1e1b4b]">
          <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
          <span>CELL OF DUTY // TACTICAL CARTOON BIO-BRAWL</span>
        </div>

        <button
          onClick={toggleSound}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-cyan-400 rounded-2xl transition text-xs font-black text-slate-200 shadow-[0_4px_0_#1e1b4b] cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          <span>{isMuted ? 'SOUND OFF' : 'CARTOON AUDIO'}</span>
        </button>
      </div>

      {/* Centerpiece: Bespoke Vibrant Cartoon Title Lockup */}
      <div className="flex flex-col items-start max-w-2xl mt-4">
        {/* Inline SVG Title Lockup */}
        <div className="w-full max-w-xl mb-4">
          <svg viewBox="0 0 560 120" className="w-full h-auto drop-shadow-[0_8px_0_#1e1035]">
            <defs>
              <linearGradient id="cellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="45%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="dutyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="5" stdDeviation="1" floodColor="#0f0728" />
              </filter>
            </defs>

            {/* Chunky Shield Badge Icon */}
            <path
              d="M35 15 L65 5 L95 15 L95 55 Q65 85 65 85 Q35 55 35 55 Z"
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="4"
              filter="url(#shadow)"
            />
            <circle cx="65" cy="42" r="14" fill="#facc15" stroke="#ffffff" strokeWidth="3" />
            <path d="M57 42 L63 48 L73 36" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

            {/* Wordmark: CELL OF DUTY */}
            <text
              x="115"
              y="55"
              fontFamily="Impact, system-ui, sans-serif"
              fontWeight="900"
              fontSize="48"
              fill="url(#cellGrad)"
              stroke="#0f0728"
              strokeWidth="5"
              paintOrder="stroke fill"
              letterSpacing="2"
            >
              CELL
            </text>
            <text
              x="235"
              y="55"
              fontFamily="Impact, system-ui, sans-serif"
              fontWeight="900"
              fontSize="48"
              fill="#ffffff"
              stroke="#0f0728"
              strokeWidth="5"
              paintOrder="stroke fill"
              letterSpacing="2"
            >
              OF
            </text>
            <text
              x="305"
              y="55"
              fontFamily="Impact, system-ui, sans-serif"
              fontWeight="900"
              fontSize="48"
              fill="url(#dutyGrad)"
              stroke="#0f0728"
              strokeWidth="5"
              paintOrder="stroke fill"
              letterSpacing="2"
            >
              DUTY
            </text>

            {/* Cartoon Subtitle Pill */}
            <rect x="115" y="68" width="360" height="28" rx="14" fill="#0f0728" stroke="#38bdf8" strokeWidth="2.5" />
            <text
              x="295"
              y="87"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              fontWeight="900"
              fontSize="13"
              fill="#facc15"
              letterSpacing="2"
            >
              TACTICAL BIO-OPS // BRAWL STARS EDITION
            </text>
          </svg>
        </div>

        <p className="text-base text-indigo-100 font-semibold leading-relaxed max-w-xl mb-6 drop-shadow">
          Lead the animated Task Force Macrophage! Brawl against wacky bacterial grunts,
          bouncy viral spikers, and the legendary Viral Goliath in vibrant, cartoon-animated
          twin-stick combat!
        </p>

        {/* Operation Mode Selector */}
        <div className="w-full mb-6">
          <div className="text-xs text-indigo-200 font-black tracking-wider uppercase mb-2.5">
            CHOOSE OPERATION MODE:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Mode 1 */}
            <button
              onClick={() => setSelectedMode('spec_ops')}
              className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col gap-1.5 cursor-pointer ${
                selectedMode === 'spec_ops'
                  ? 'bg-cyan-600/90 border-white text-white shadow-[0_6px_0_#0369a1]'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 shadow-[0_4px_0_#1e1b4b] hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                <Crosshair className="w-4 h-4 text-yellow-300" />
                <span>SPEC OPS WAVE</span>
              </div>
              <span className="text-xs text-indigo-100 font-medium">
                Survive infinite waves of cartoon bacteria, spikers, and snipers!
              </span>
            </button>

            {/* Mode 2 */}
            <button
              onClick={() => setSelectedMode('zombies')}
              className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col gap-1.5 cursor-pointer ${
                selectedMode === 'zombies'
                  ? 'bg-emerald-600/90 border-white text-white shadow-[0_6px_0_#047857]'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 shadow-[0_4px_0_#1e1b4b] hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                <Skull className="w-4 h-4 text-emerald-300" />
                <span>BIO-ZOMBIES</span>
              </div>
              <span className="text-xs text-indigo-100 font-medium">
                Unlock Mystery Box weapon spins and Juggernog & Speed Cola perks!
              </span>
            </button>

            {/* Mode 3 */}
            <button
              onClick={() => setSelectedMode('boss_assault')}
              className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col gap-1.5 cursor-pointer ${
                selectedMode === 'boss_assault'
                  ? 'bg-amber-600/90 border-white text-white shadow-[0_6px_0_#b45309]'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 shadow-[0_4px_0_#1e1b4b] hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                <Shield className="w-4 h-4 text-amber-300" />
                <span>BOSS GOLIATH</span>
              </div>
              <span className="text-xs text-indigo-100 font-medium">
                Brawl against the 3,500 HP titan with ground stomps & shockwaves!
              </span>
            </button>
          </div>
        </div>

        {/* Loadout Selection */}
        <div className="w-full mb-6">
          <div className="text-xs text-indigo-200 font-black tracking-wider uppercase mb-2.5">
            CHOOSE PRIMARY BLASTER:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {(['m4_carbine', 'mp5_smg', 'spore12_shotgun', 'barrett_sniper'] as WeaponId[]).map((wId) => {
              const wep = WEAPONS[wId];
              return (
                <button
                  key={wId}
                  onClick={() => setSelectedWeapon(wId)}
                  className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                    selectedWeapon === wId
                      ? 'bg-indigo-600 border-white text-white shadow-[0_5px_0_#3730a3]'
                      : 'bg-slate-900/80 border-slate-700 text-slate-300 shadow-[0_4px_0_#1e1b4b] hover:border-slate-500'
                  }`}
                >
                  <div className="text-sm font-black truncate">{wep.name}</div>
                  <div className="text-[10px] text-cyan-300 font-bold uppercase mt-0.5">{wep.category}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Juicy Start CTA Button (Brawl Stars Style) */}
        <button
          onClick={() => onStartGame(selectedMode, selectedWeapon)}
          className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 border-2 border-white text-slate-950 font-black text-lg tracking-wider uppercase rounded-2xl shadow-[0_8px_0_#b45309] hover:shadow-[0_10px_0_#b45309] transition transform hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#b45309] cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>START BRAWL! [ENTER / SPACE]</span>
        </button>
      </div>

      {/* Flat Control Hints */}
      <div className="w-full pt-4 border-t border-indigo-900/80 flex flex-wrap items-center justify-between text-xs text-indigo-200 font-bold">
        <div>
          <span className="text-cyan-400">WASD</span> Move ·{' '}
          <span className="text-cyan-400">LMB / Space</span> Fire ·{' '}
          <span className="text-cyan-400">R</span> Reload ·{' '}
          <span className="text-cyan-400">G / Q</span> Grenade ·{' '}
          <span className="text-cyan-400">F / RMB</span> Melee ·{' '}
          <span className="text-cyan-400">1-2</span> Swap ·{' '}
          <span className="text-cyan-400">3-6</span> Killstreaks ·{' '}
          <span className="text-cyan-400">Shift</span> Sprint ·{' '}
          <span className="text-cyan-400">Esc</span> Pause
        </div>
        <div className="text-cyan-400 font-black">
          60 FPS CARTOON 3D
        </div>
      </div>
    </div>
  );
};
