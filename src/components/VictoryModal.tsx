import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Clock, RotateCcw, ArrowRight, Award } from 'lucide-react';
import { StageDefinition } from '../types/game';

interface VictoryModalProps {
  stage: StageDefinition;
  clearTime: number;
  starsCollected: number;
  totalStars: number;
  onNextStage: () => void;
  onRetry: () => void;
  hasNextStage: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stage,
  clearTime,
  starsCollected,
  totalStars,
  onNextStage,
  onRetry,
  hasNextStage,
}) => {
  // Determine Star Rating (1 to 3 stars)
  // 1 star: cleared
  // 2 stars: collected all stars OR beat par time
  // 3 stars: collected all stars AND beat par time
  const beatParTime = clearTime <= stage.parTime;
  const gotAllStars = starsCollected >= totalStars;
  let starRating = 1;
  if (gotAllStars && beatParTime) starRating = 3;
  else if (gotAllStars || beatParTime) starRating = 2;

  useEffect(() => {
    // Confetti cannon blast
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#ff4081', '#00e676', '#2979ff'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch (e) {}
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins > 0 ? `${mins}m ` : ''}${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-stone-900 border-2 border-amber-400/80 rounded-2xl shadow-2xl p-6 text-white text-center transform transition-all animate-in fade-in zoom-in-95">
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mb-3">
          <Trophy className="w-9 h-9 text-amber-300" />
        </div>

        <h2 className="text-2xl font-black tracking-wide text-amber-300 uppercase">
          STAGE CLEAR!
        </h2>
        <p className="text-sm text-stone-300 font-medium mt-1">
          {stage.title}
        </p>

        {/* 3 Stars Award */}
        <div className="flex justify-center items-center gap-3 my-5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`p-2 rounded-xl border transition-all ${
                s <= starRating
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-110 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-800 border-stone-700 text-stone-600'
              }`}
            >
              <Star className="w-7 h-7 fill-current" />
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-stone-800/80 border border-stone-700 rounded-xl p-3 mb-6 text-left">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-xs text-stone-400">Clear Time</div>
              <div className="text-sm font-bold text-sky-300">
                {formatTime(clearTime)}{' '}
                {beatParTime && <span className="text-[10px] text-emerald-400 font-semibold">(Par: {stage.parTime}s)</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs text-stone-400">Country Stars</div>
              <div className="text-sm font-bold text-amber-300">
                {starsCollected} / {totalStars}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-xl font-bold text-sm text-stone-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            もう一度 (Retry)
          </button>

          {hasNextStage ? (
            <button
              onClick={onNextStage}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-sm transition-transform active:scale-95 shadow-md shadow-amber-500/30 cursor-pointer"
            >
              次のステージ (Next)
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl text-sm transition-transform active:scale-95 cursor-pointer"
            >
              全ステージ制覇！
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
