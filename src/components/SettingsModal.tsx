import React, { useRef } from 'react';
import { Settings, Upload, Eye, X, MoveHorizontal, RotateCcw } from 'lucide-react';
import { CountryId, UserProfile } from '../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

const COUNTRIES: { id: CountryId; name: string; flagEmoji: string }[] = [
  { id: 'poland', name: 'ポーランド', flagEmoji: '🇵🇱' },
  { id: 'palau', name: 'パラオ', flagEmoji: '🇵🇼' },
  { id: 'carrot', name: 'にんじん', flagEmoji: '🥕' },
  { id: 'japan', name: '日本', flagEmoji: '🇯🇵' },
  { id: 'germany', name: 'ドイツ', flagEmoji: '🇩🇪' },
  { id: 'usa', name: 'アメリカ', flagEmoji: '🇺🇸' },
  { id: 'uk', name: 'イギリス', flagEmoji: '🇬🇧' },
  { id: 'france', name: 'フランス', flagEmoji: '🇫🇷' },
  { id: 'ukraine', name: 'ウクライナ', flagEmoji: '🇺🇦' },
  { id: 'italy', name: 'イタリア', flagEmoji: '🇮🇹' },
  { id: 'brazil', name: 'ブラジル', flagEmoji: '🇧🇷' },
  { id: 'canada', name: 'カナダ', flagEmoji: '🇨🇦' },
  { id: 'custom', name: 'オリジナル国旗', flagEmoji: '🎨' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdateProfile({
          selectedCountry: 'custom',
          customFlagDataUrl: dataUrl,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-3xl p-6 shadow-2xl text-stone-200 transform transition-all animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-800">
          <h3 className="text-xl font-black text-amber-300 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            マイ設定 (My Settings)
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Username Input */}
        <div className="mb-5">
          <label className="block text-xs text-stone-400 font-bold mb-1.5">
            ユーザー名 (Username)
          </label>
          <input
            type="text"
            value={profile.name}
            maxLength={16}
            onChange={(e) => onUpdateProfile({ name: e.target.value })}
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-bold"
          />
        </div>

        {/* 2. Country Selection */}
        <div className="mb-5">
          <label className="block text-xs text-stone-400 font-bold mb-1.5">
            国ボールスキンを選択
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
            {COUNTRIES.map((c) => (
              <button
                key={c.id}
                onClick={() => onUpdateProfile({ selectedCountry: c.id })}
                className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  profile.selectedCountry === c.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-300'
                }`}
              >
                <span className="text-base">{c.flagEmoji}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Eye Customization: Size & Spacing (Freely adjustable!) */}
        <div className="mb-5 p-4 bg-stone-950/80 border border-stone-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-800/80">
            <span className="text-xs text-amber-300 font-black flex items-center gap-1.5 uppercase tracking-wide">
              <Eye className="w-4 h-4 text-amber-400" />
              目のカスタマイズ (Eye Customization)
            </span>
            <button
              type="button"
              onClick={() => onUpdateProfile({ eyeSize: 1.0, eyeSpacing: 1.0 })}
              className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 hover:bg-stone-800 px-2 py-1 rounded-md transition-colors cursor-pointer"
              title="サイズと間隔を標準値にリセット"
            >
              <RotateCcw className="w-3 h-3" />
              標準にリセット
            </button>
          </div>

          {/* Interactive Live Mini Preview of Ball Face */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-stone-900/60 rounded-xl border border-stone-800/70">
            <div className="relative w-18 h-18 rounded-full overflow-hidden border-2 border-stone-950 shadow-md flex-shrink-0 bg-stone-800">
              {/* Ball Flag background for preview */}
              {profile.selectedCountry === 'poland' && (
                <div className="w-full h-full flex flex-col">
                  <div className="h-1/2 w-full bg-white" />
                  <div className="h-1/2 w-full bg-red-600" />
                </div>
              )}
              {profile.selectedCountry === 'japan' && (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-red-600" />
                </div>
              )}
              {profile.selectedCountry === 'germany' && (
                <div className="w-full h-full flex flex-col">
                  <div className="h-1/3 w-full bg-stone-900" />
                  <div className="h-1/3 w-full bg-red-600" />
                  <div className="h-1/3 w-full bg-amber-400" />
                </div>
              )}
              {profile.selectedCountry === 'ukraine' && (
                <div className="w-full h-full flex flex-col">
                  <div className="h-1/2 w-full bg-sky-500" />
                  <div className="h-1/2 w-full bg-yellow-400" />
                </div>
              )}
              {profile.selectedCountry === 'france' && (
                <div className="w-full h-full flex">
                  <div className="w-1/3 h-full bg-blue-700" />
                  <div className="w-1/3 h-full bg-white" />
                  <div className="w-1/3 h-full bg-red-600" />
                </div>
              )}
              {profile.selectedCountry === 'palau' && (
                <div className="w-full h-full bg-sky-400 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-yellow-300 ml-[-4px]" />
                </div>
              )}
              {profile.selectedCountry === 'carrot' && (
                <div className="w-full h-full bg-orange-500" />
              )}
              {profile.selectedCountry === 'custom' && profile.customFlagDataUrl ? (
                <img
                  src={profile.customFlagDataUrl}
                  alt="Custom"
                  className="w-full h-full object-cover"
                />
              ) : (
                !['poland', 'japan', 'germany', 'ukraine', 'france', 'palau', 'carrot'].includes(
                  profile.selectedCountry
                ) && <div className="w-full h-full bg-stone-700" />
              )}

              {/* Render dynamic eyes inside preview */}
              {(() => {
                const size = profile.eyeSize ?? 1.0;
                const spacing = profile.eyeSpacing ?? 1.0;
                const eyeW = Math.max(6, Math.min(22, 13 * size));
                const eyeH = Math.max(7, Math.min(26, 16 * size));
                const dist = Math.max(3, Math.min(24, 10 * spacing));
                return (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Left Eye */}
                    <div
                      style={{
                        width: `${eyeW}px`,
                        height: `${eyeH}px`,
                        transform: `translateX(-${dist}px) rotate(4deg)`,
                        borderWidth: `${Math.max(2, Math.round(2.6 * size))}px`,
                      }}
                      className="bg-white border-stone-950 rounded-[50%]"
                    />
                    {/* Right Eye */}
                    <div
                      style={{
                        width: `${eyeW}px`,
                        height: `${eyeH}px`,
                        transform: `translateX(${dist}px) rotate(-4deg)`,
                        borderWidth: `${Math.max(2, Math.round(2.6 * size))}px`,
                      }}
                      className="bg-white border-stone-950 rounded-[50%]"
                    />
                  </div>
                );
              })()}
            </div>

            <div className="text-[11px] text-stone-300">
              <div className="font-bold text-white mb-0.5">リアルタイム顔プレビュー</div>
              <p className="text-stone-400 text-[10px] leading-tight">
                スライダーを動かすと、目と目の距離や大きさが3Dボール本体に即時反映されます。
              </p>
            </div>
          </div>

          {/* 3A. 目のサイズ (Eye Size) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-stone-200 font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                目のサイズ (Size)
              </label>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {Math.round((profile.eyeSize ?? 1.0) * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={profile.eyeSize ?? 1.0}
              onChange={(e) => onUpdateProfile({ eyeSize: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-stone-800 rounded-lg appearance-none"
            />

            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { label: '小 (70%)', val: 0.7 },
                { label: '標準 (100%)', val: 1.0 },
                { label: '大 (130%)', val: 1.3 },
                { label: '特大 (160%)', val: 1.6 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => onUpdateProfile({ eyeSize: preset.val })}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    Math.abs((profile.eyeSize ?? 1.0) - preset.val) < 0.05
                      ? 'bg-amber-500 text-stone-950 border-amber-400'
                      : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3B. 目と目の間隔 (Eye Spacing / Distance) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-stone-200 font-bold flex items-center gap-1.5">
                <MoveHorizontal className="w-3.5 h-3.5 text-sky-400" />
                目と目の間隔 (Spacing)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-stone-400">
                  {(profile.eyeSpacing ?? 1.0) <= 0.75
                    ? '寄り目'
                    : (profile.eyeSpacing ?? 1.0) >= 1.35
                    ? '離れ目'
                    : '標準'}
                </span>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {Math.round((profile.eyeSpacing ?? 1.0) * 100)}%
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0.35"
              max="2.2"
              step="0.05"
              value={profile.eyeSpacing ?? 1.0}
              onChange={(e) => onUpdateProfile({ eyeSpacing: parseFloat(e.target.value) })}
              className="w-full accent-sky-400 cursor-pointer h-2 bg-stone-800 rounded-lg appearance-none"
            />

            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { label: '寄り目 (60%)', val: 0.6 },
                { label: '標準 (100%)', val: 1.0 },
                { label: '離れ目 (140%)', val: 1.4 },
                { label: '超離れ目 (180%)', val: 1.8 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => onUpdateProfile({ eyeSpacing: preset.val })}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    Math.abs((profile.eyeSpacing ?? 1.0) - preset.val) < 0.05
                      ? 'bg-sky-500 text-stone-950 border-sky-400'
                      : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Custom Flag Upload */}
        <div className="mb-6 p-4 bg-stone-950/80 border border-dashed border-stone-700 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-sky-400" />
              オリジナル国旗のアップロード
            </span>
            {profile.customFlagDataUrl && (
              <span className="text-[10px] text-emerald-400 font-bold">
                ✓ 画像読み込み済み
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-400 mb-3">
            お好きな画像（PNG/JPG）をアップロードすると、前面と後面に2枚貼り付けられます！
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-xl text-xs font-bold text-stone-200 cursor-pointer transition-colors"
            >
              画像ファイルを選択
            </button>

            {profile.customFlagDataUrl && (
              <img
                src={profile.customFlagDataUrl}
                alt="Custom Flag Preview"
                className="w-12 h-8 rounded border border-stone-600 object-cover"
              />
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-sm transition-colors cursor-pointer shadow-lg"
        >
          設定を保存して戻る
        </button>
      </div>
    </div>
  );
};
