import React from 'react';
import { PlayerStats } from '../types/game';
import { Play, RotateCcw, Home, Volume2, VolumeX, ShieldAlert, Award, Sparkles } from 'lucide-react';
import { sound } from '../audio/soundSystem';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExit
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getIsMuted());

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/75 z-30 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-indigo-500/80 rounded-3xl p-6 shadow-[0_12px_0_#1e1b4b] flex flex-col gap-4 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-yellow-400" />
            <span className="text-xl font-black tracking-wide text-white uppercase">
              GAME PAUSED
            </span>
          </div>
          <button
            onClick={toggleSound}
            className="p-2 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 rounded-xl text-slate-300 shadow-[0_3px_0_#0f172a]"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>

        {/* Controls reference */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border-2 border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5 shadow-inner">
          <div className="text-[11px] text-cyan-400 font-black uppercase mb-1">CONTROLS CHEAT-SHEET:</div>
          <div className="flex justify-between"><span>Movement</span><span className="text-white font-black">W, A, S, D</span></div>
          <div className="flex justify-between"><span>Aim & Fire</span><span className="text-white font-black">Mouse + LMB / Space</span></div>
          <div className="flex justify-between"><span>Tactical Reload</span><span className="text-white font-black">R</span></div>
          <div className="flex justify-between"><span>Bio-Grenade</span><span className="text-white font-black">G or Q</span></div>
          <div className="flex justify-between"><span>Melee Phagocytosis</span><span className="text-white font-black">F or RMB</span></div>
          <div className="flex justify-between"><span>Killstreaks</span><span className="text-white font-black">3, 4, 5, 6</span></div>
          <div className="flex justify-between"><span>Tactical Sprint</span><span className="text-white font-black">Left Shift</span></div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 border-2 border-white text-slate-950 font-black text-sm uppercase rounded-2xl shadow-[0_5px_0_#0369a1] hover:scale-102 active:translate-y-1 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>RESUME BRAWL</span>
          </button>
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm uppercase rounded-2xl border-2 border-slate-700 shadow-[0_4px_0_#0f172a] transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART LEVEL</span>
          </button>
          <button
            onClick={onExit}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-950 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 font-black text-xs uppercase rounded-2xl border border-slate-800 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: PlayerStats;
  onRestart: () => void;
  onExit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onExit
}) => {
  return (
    <div className="absolute inset-0 bg-rose-950/80 z-30 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 shadow-[0_12px_0_#4c0519] flex flex-col gap-4 text-white text-center">
        <div className="text-rose-500 text-3xl font-black tracking-wide uppercase drop-shadow-[0_4px_0_#881337]">
          DEFEAT!
        </div>
        <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">
          THE SWARM OVERWHELMED YOUR DEFENSES
        </div>

        {/* Debrief Stats */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/90 p-4 rounded-2xl border-2 border-slate-800 text-left my-2 shadow-inner">
          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase">FINAL SCORE</div>
            <div className="text-2xl font-black text-amber-400 tabular-nums">{stats.score}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase">WAVES REACHED</div>
            <div className="text-2xl font-black text-cyan-400 tabular-nums">{stats.wave}</div>
          </div>
          <div className="mt-1">
            <div className="text-[10px] text-slate-400 font-extrabold uppercase">ELIMINATIONS</div>
            <div className="text-xl font-bold text-rose-400 tabular-nums">{stats.kills}</div>
          </div>
          <div className="mt-1">
            <div className="text-[10px] text-slate-400 font-extrabold uppercase">HEADSHOTS</div>
            <div className="text-xl font-bold text-yellow-400 tabular-nums">{stats.headshots}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 border-2 border-white text-white font-black text-sm uppercase tracking-wide rounded-2xl shadow-[0_6px_0_#9f1239] hover:scale-102 active:translate-y-1 transition cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>TRY AGAIN!</span>
          </button>
          <button
            onClick={onExit}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-black text-xs uppercase rounded-2xl border border-slate-700 shadow-[0_4px_0_#0f172a] transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: PlayerStats;
  onRestart: () => void;
  onExit: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onRestart,
  onExit
}) => {
  return (
    <div className="absolute inset-0 bg-indigo-950/85 z-30 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-[0_12px_0_#78350f] flex flex-col gap-4 text-white text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white flex items-center justify-center mx-auto shadow-[0_6px_0_#b45309]">
          <Award className="w-10 h-10 text-slate-950" />
        </div>
        <div className="text-amber-400 text-3xl font-black tracking-wide uppercase drop-shadow-[0_4px_0_#b45309]">
          VICTORY!
        </div>
        <div className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center gap-1">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>VIRAL GOLIATH TERMINATED // AREA SECURE</span>
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-950/90 p-4 rounded-2xl border-2 border-slate-800 text-left my-2 shadow-inner">
          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase">TOTAL SCORE</div>
            <div className="text-2xl font-black text-amber-400 tabular-nums">{stats.score}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase">HOSTILES ELIMINATED</div>
            <div className="text-2xl font-black text-rose-400 tabular-nums">{stats.kills}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 border-2 border-white text-slate-950 font-black text-sm uppercase tracking-wide rounded-2xl shadow-[0_6px_0_#b45309] hover:scale-102 active:translate-y-1 transition cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 fill-slate-950" />
            <span>PLAY AGAIN!</span>
          </button>
          <button
            onClick={onExit}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-black text-xs uppercase rounded-2xl border border-slate-700 shadow-[0_4px_0_#0f172a] transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
