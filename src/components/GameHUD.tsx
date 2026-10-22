import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Star,
  Clock,
  Home,
  MessageSquare,
  Copy,
  Check,
  MousePointer,
  Compass,
  Settings,
} from 'lucide-react';
import { StageDefinition } from '../types/game';

interface GameHUDProps {
  currentStage: StageDefinition;
  stageIndex: number;
  totalStages: number;
  elapsedTime: number;
  starsCollected: number;
  totalStars: number;
  speed: number;
  isDashing: boolean;
  dashCooldown: number;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  onToggleSound: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
  onToggleChat: () => void;
  onOpenSettings?: () => void;
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
  myPeerId: string;
  connectedCount: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentStage,
  stageIndex,
  totalStages,
  elapsedTime,
  starsCollected,
  totalStars,
  speed,
  isDashing,
  dashCooldown,
  soundEnabled,
  bgmEnabled,
  onToggleSound,
  onRestart,
  onReturnToTitle,
  onToggleChat,
  onOpenSettings,
  isPointerLocked,
  onRequestPointerLock,
  myPeerId,
  connectedCount,
}) => {
  const [copied, setCopied] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const kmh = Math.round(speed * 3.6);

  const handleCopyCode = () => {
    if (!myPeerId) return;
    navigator.clipboard.writeText(myPeerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 overflow-hidden">
      {/* 1. TOP BAR: Stage Info, Timer/Room, PeerCode & Navigation */}
      <div className="flex flex-wrap items-start justify-between w-full gap-3 pointer-events-auto">
        {/* Left: Stage Title & Subtitle */}
        <div className="bg-stone-900/90 border border-stone-700/80 rounded-2xl px-4 py-2.5 shadow-xl max-w-sm">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase border ${
                currentStage.isRoom
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}
            >
              {currentStage.difficulty}
            </span>
            <h1 className="text-base font-black text-white tracking-wide truncate">
              {currentStage.title}
            </h1>
          </div>
          <p className="text-xs text-stone-300 mt-0.5 font-medium line-clamp-1">
            {currentStage.subtitle}
          </p>
        </div>

        {/* Center: Live Timer & Stars (Action) or Room Status (PeerRoom) */}
        {!currentStage.isRoom ? (
          <div className="flex items-center gap-3 bg-stone-900/90 border border-stone-700/80 rounded-2xl px-4 py-2 shadow-xl">
            <div className="flex items-center gap-1.5 text-sky-300 font-mono font-bold text-base">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className="h-4 w-px bg-stone-700" />
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>
                {starsCollected} / {totalStars}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-stone-900/90 border border-sky-500/30 rounded-2xl px-4 py-2 shadow-xl text-sky-300 font-bold text-xs">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>フレンド自由交流エリア (ボールを蹴って遊ぼう！)</span>
          </div>
        )}

        {/* Right: Peer Status Bar & Controls */}
        <div className="flex items-center gap-2">
          {/* PeerCode Box */}
          <div className="bg-stone-900/90 border border-stone-700/80 rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-xl">
            <span className="text-[10px] text-stone-400 font-bold">Peer:</span>
            <span className="font-mono font-black text-amber-400 text-xs tracking-wider">
              {myPeerId || '...'}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 hover:bg-stone-800 rounded text-stone-300 transition-colors cursor-pointer"
              title="PeerCodeをコピー"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <span
              className={`w-2 h-2 rounded-full ml-1 ${
                connectedCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
              }`}
            />
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-2xl border transition-colors cursor-pointer shadow-xl ${
              soundEnabled
                ? 'bg-stone-900/90 border-stone-700 text-emerald-400 hover:bg-stone-800'
                : 'bg-stone-900/50 border-stone-800 text-stone-500'
            }`}
            title="効果音 (SFX)"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-200 p-2.5 rounded-2xl transition-colors cursor-pointer shadow-xl active:scale-95"
              title="設定 (目のサイズ・国旗・名前)"
            >
              <Settings className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Restart Stage Button (Action mode only) */}
          {!currentStage.isRoom && (
            <button
              onClick={onRestart}
              className="bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-200 p-2.5 rounded-2xl transition-colors cursor-pointer shadow-xl active:scale-95"
              title="ステージ最初から再挑戦 (Rキー)"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Return to Title */}
          <button
            onClick={onReturnToTitle}
            className="bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-200 px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xl active:scale-95"
            title="タイトル画面に戻る"
          >
            <Home className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">タイトル</span>
          </button>
        </div>
      </div>

      {/* 2. CENTER SCREEN: MINECRAFT-STYLE POINTER LOCK NOTIFICATION */}
      {!isPointerLocked && (
        <div
          onClick={onRequestPointerLock}
          className="mx-auto my-auto pointer-events-auto bg-stone-900/95 border-2 border-amber-400/80 rounded-2xl px-6 py-3.5 shadow-2xl text-center cursor-pointer hover:bg-stone-800 transition-all transform hover:scale-105 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm">
            <MousePointer className="w-4 h-4" />
            <span>画面をクリックして視点操作を開始</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Minecraft同様、マウスを動かすだけで見回せます（ESCキーで解除）
          </p>
        </div>
      )}

      {/* 3. BOTTOM BAR: Speedometer & Controls hint */}
      <div className="flex items-end justify-between w-full pointer-events-none">
        <div />

        {/* Speedometer Gauge */}
        <div className="bg-stone-900/90 border border-stone-700/80 rounded-2xl px-4 py-2 flex items-center gap-2.5 text-stone-200 shadow-xl pointer-events-auto">
          <Zap className={`w-4 h-4 ${isDashing ? 'text-amber-400' : 'text-stone-400'}`} />
          <div className="text-right">
            <span className="text-base font-black font-mono text-white">{kmh}</span>
            <span className="text-[10px] text-stone-400 ml-1">km/h</span>
          </div>
          {isDashing && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-stone-950">
              BOOST
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
