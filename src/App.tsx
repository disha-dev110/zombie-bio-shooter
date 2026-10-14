import React, { useEffect, useRef, useState } from 'react';
import {
  GameMode,
  PlayerStats,
  MedalPopup,
  FloatingCoinPopup,
  WeaponId,
  KillstreakId,
  SpecialAmmoType
} from './types/game';
import { GameEngine } from './game/engine';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { PauseModal, GameOverModal, VictoryModal } from './components/Modals';
import { ShopModal } from './components/ShopModal';

export default function App() {
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');
  const [gameMode, setGameMode] = useState<GameMode>('spec_ops');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [medals, setMedals] = useState<MedalPopup[]>([]);
  const [floatingPopups, setFloatingPopups] = useState<FloatingCoinPopup[]>([]);
  const [hitmarker, setHitmarker] = useState<{ active: boolean; isHeadshot: boolean; isKill: boolean }>({
    active: false,
    isHeadshot: false,
    isKill: false
  });

  const handleStartGame = (mode: GameMode, primaryWeapon: WeaponId) => {
    setGameMode(mode);
    setGameState('playing');
    setIsPaused(false);
    setIsGameOver(false);
    setIsVictory(false);
    setIsShopOpen(false);
  };

  useEffect(() => {
    if (gameState !== 'playing' || !canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, gameMode);
    engineRef.current = engine;

    engine.onStatsUpdate = (stats) => {
      setPlayerStats(stats);
      if (engine.isPaused !== isPaused) {
        setIsPaused(engine.isPaused);
      }
      if (engine.isVictory && !isVictory) {
        setIsVictory(true);
      }
    };

    engine.onMedalPopup = (medal) => {
      setMedals((prev) => [...prev.slice(-6), medal]);
    };

    engine.onFloatingPopup = (popup) => {
      setFloatingPopups((prev) => [...prev.slice(-8), popup]);
      setTimeout(() => {
        setFloatingPopups((prev) => prev.filter((p) => p.id !== popup.id));
      }, 1200);
    };

    engine.onHitmarker = (isHeadshot, isKill) => {
      setHitmarker({ active: true, isHeadshot, isKill });
      setTimeout(() => {
        setHitmarker((prev) => ({ ...prev, active: false }));
      }, 95);
    };

    engine.onGameOver = (finalStats) => {
      setPlayerStats(finalStats);
      setIsGameOver(true);
    };

    engine.onOpenShop = () => {
      setIsShopOpen(true);
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [gameState, gameMode]);

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.isPaused = false;
      setIsPaused(false);
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setIsShopOpen(false);

    if (canvasMountRef.current) {
      const engine = new GameEngine(canvasMountRef.current, gameMode);
      engineRef.current = engine;
      engine.onStatsUpdate = (stats) => setPlayerStats(stats);
      engine.onMedalPopup = (medal) => setMedals((prev) => [...prev.slice(-6), medal]);
      engine.onFloatingPopup = (popup) => {
        setFloatingPopups((prev) => [...prev.slice(-8), popup]);
        setTimeout(() => {
          setFloatingPopups((prev) => prev.filter((p) => p.id !== popup.id));
        }, 1200);
      };
      engine.onHitmarker = (isHeadshot, isKill) => {
        setHitmarker({ active: true, isHeadshot, isKill });
        setTimeout(() => setHitmarker((prev) => ({ ...prev, active: false })), 95);
      };
      engine.onGameOver = (finalStats) => {
        setPlayerStats(finalStats);
        setIsGameOver(true);
      };
      engine.onOpenShop = () => setIsShopOpen(true);
    }
  };

  const handleExitToTitle = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setGameState('title');
    setIsPaused(false);
    setIsGameOver(false);
    setIsVictory(false);
    setIsShopOpen(false);
  };

  const handleActivateKillstreak = (id: KillstreakId) => {
    engineRef.current?.activateKillstreak(id);
  };

  const handleSwitchWeapon = (id: WeaponId) => {
    engineRef.current?.switchWeapon(id);
  };

  const handleThrowGrenade = () => {
    engineRef.current?.throwGrenade();
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
      setIsPaused(engineRef.current.isPaused);
    }
  };

  // SHOP HANDLERS
  const handleBuyWeapon = (wId: WeaponId) => {
    engineRef.current?.buyWeapon(wId);
  };

  const handleUpgradeWeapon = (wId: WeaponId) => {
    engineRef.current?.upgradeWeapon(wId);
  };

  const handleEquipWeapon = (wId: WeaponId, slot: 'primary' | 'secondary') => {
    engineRef.current?.equipWeapon(wId, slot);
  };

  const handleBuySpecialAmmo = (type: SpecialAmmoType) => {
    engineRef.current?.buySpecialAmmo(type);
  };

  const handleBuySupplies = (type: 'grenade' | 'shield' | 'medkit') => {
    engineRef.current?.buySupplies(type);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {gameState === 'title' ? (
        <TitleScreen onStartGame={handleStartGame} />
      ) : (
        <div className="relative w-full h-full">
          {/* Isolated WebGL Canvas Container */}
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

          {/* Low-Occlusion Cartoon HUD Overlay */}
          {playerStats && (
            <HUD
              stats={playerStats}
              medals={medals}
              floatingPopups={floatingPopups}
              hitmarker={hitmarker}
              onActivateKillstreak={handleActivateKillstreak}
              onSwitchWeapon={handleSwitchWeapon}
              onThrowGrenade={handleThrowGrenade}
              onTogglePause={handleTogglePause}
              onOpenShop={() => setIsShopOpen(true)}
            />
          )}

          {/* Loadout Shop Modal */}
          {isShopOpen && playerStats && (
            <ShopModal
              stats={playerStats}
              onClose={() => setIsShopOpen(false)}
              onBuyWeapon={handleBuyWeapon}
              onUpgradeWeapon={handleUpgradeWeapon}
              onEquipWeapon={handleEquipWeapon}
              onBuySpecialAmmo={handleBuySpecialAmmo}
              onBuySupplies={handleBuySupplies}
            />
          )}

          {/* Pause Modal */}
          {isPaused && !isGameOver && !isVictory && !isShopOpen && (
            <PauseModal
              onResume={handleResume}
              onRestart={handleRestart}
              onExit={handleExitToTitle}
            />
          )}

          {/* Game Over Modal */}
          {isGameOver && playerStats && (
            <GameOverModal
              stats={playerStats}
              onRestart={handleRestart}
              onExit={handleExitToTitle}
            />
          )}

          {/* Victory Modal */}
          {isVictory && playerStats && (
            <VictoryModal
              stats={playerStats}
              onRestart={handleRestart}
              onExit={handleExitToTitle}
            />
          )}
        </div>
      )}
    </div>
  );
}
