import React, { useState, useRef } from 'react';
import {
  Play,
  Users,
  Settings,
  Copy,
  Check,
  Upload,
  Globe2,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { CountryId, UserProfile } from '../types/game';
import { SettingsModal } from './SettingsModal';

interface TitleScreenProps {
  onStartAction: () => void;
  onStartPeerRoom: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  myPeerId: string;
  connectedCount: number;
  onConnectToPeer: (code: string) => void;
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

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartAction,
  onStartPeerRoom,
  profile,
  onUpdateProfile,
  myPeerId,
  connectedCount,
  onConnectToPeer,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetCode, setTargetCode] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyCode = () => {
    if (!myPeerId) return;
    navigator.clipboard.writeText(myPeerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetCode.trim()) {
      onConnectToPeer(targetCode.trim());
      setTargetCode('');
    }
  };

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
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 select-none bg-stone-950/70 backdrop-blur-xs">
      {/* 1. TOP BAR: PEER CONNECTION & STATUS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/90 border border-stone-800 rounded-2xl px-5 py-3 shadow-2xl">
        {/* Left: App Logo Tag */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-b from-red-600 to-white flex items-center justify-center border-2 border-stone-950 font-black text-xs text-stone-950 shadow-md">
            PL
          </div>
          <div>
            <div className="text-xs font-black text-amber-300 tracking-wider">
              POLANDBALL 3D
            </div>
            <div className="text-[10px] text-stone-400">
              P2P Multiplayer Powered
            </div>
          </div>
        </div>

        {/* Center: My PeerCode & Copy */}
        <div className="flex items-center gap-2 bg-stone-950/80 border border-stone-800 rounded-xl px-3 py-1.5">
          <span className="text-[11px] text-stone-400 font-medium">あなたのPeerCode:</span>
          <span className="font-mono font-black text-amber-400 tracking-wider text-xs">
            {myPeerId || '接続準備中...'}
          </span>
          <button
            onClick={handleCopyCode}
            disabled={!myPeerId}
            className="p-1 hover:bg-stone-800 rounded text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="コードをコピー"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right: Join Friend Code & Status */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleConnectSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="親友のPeerCodeを入力..."
              value={targetCode}
              onChange={(e) => setTargetCode(e.target.value.toUpperCase())}
              className="bg-stone-950/90 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-stone-500 font-mono w-40 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
            >
              ペア接続
            </button>
          </form>

          {/* Connection status badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800/80 border border-stone-700 text-xs text-stone-300">
            <span
              className={`w-2 h-2 rounded-full ${
                connectedCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
              }`}
            />
            <span className="text-[11px] font-bold">
              {connectedCount > 0 ? `${connectedCount}人と接続中` : 'ソロ'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CENTER HERO: TITLE & PRIMARY ACTIONS */}
      <div className="mx-auto my-auto text-center max-w-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Countryball Physics Action
        </div>

        {/* Big Stylized Title */}
        <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-2xl">
          balls Can into <span className="text-amber-400 underline decoration-red-500 decoration-wavy decoration-2">3d!?</span>
        </h1>

        <p className="mt-3 text-sm sm:text-base text-stone-300 font-medium max-w-md mx-auto">
          手描きダンゴの国ボールを操り、障害物コースを踏破せよ！
          <br />
          Minecraft風の自由視点 ＆ 友達と遊べるPeerRoom搭載！
        </p>

        {/* Current Player Card Badge */}
        <div className="mt-5 inline-flex items-center gap-3 bg-stone-900/90 border border-stone-700/80 rounded-2xl px-4 py-2 shadow-lg">
          <div className="text-xl">
            {COUNTRIES.find((c) => c.id === profile.selectedCountry)?.flagEmoji || '🏳️'}
          </div>
          <div className="text-left">
            <div className="text-[10px] text-stone-400 uppercase font-bold">Player</div>
            <div className="text-sm font-black text-white">{profile.name}</div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="ml-2 p-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 transition-colors cursor-pointer"
            title="国旗やユーザー名を変更"
          >
            <Settings className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Main Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Action Campaign Mode */}
          <button
            onClick={onStartAction}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black rounded-2xl text-base flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl shadow-amber-500/20 cursor-pointer group"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>アクションを開始</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* PeerRoom Social Playground Mode */}
          <button
            onClick={onStartPeerRoom}
            className="w-full sm:w-auto px-7 py-4 bg-stone-900 hover:bg-stone-800 border-2 border-sky-400/80 text-sky-300 font-black rounded-2xl text-base flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl cursor-pointer"
          >
            <Users className="w-5 h-5" />
            <span>PeerRoom (フレンド広場)</span>
          </button>
        </div>

        {/* Controls Info / Help Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowGuide(true)}
            className="text-xs text-stone-400 hover:text-stone-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>操作方法 ＆ Minecraft風マウス視点について</span>
          </button>
        </div>
      </div>

      {/* 3. FOOTER */}
      <div className="text-center text-xs text-stone-500 font-medium">
        ※画面クリックで視点を自由に操作可能（Minecraft操作スタイル・ESCで解除）
      </div>

      {/* MODAL: MY SETTINGS (Country, Custom Flag Upload, Eye Size, Username) */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        profile={profile}
        onUpdateProfile={onUpdateProfile}
      />

      {/* MODAL: CONTROLS & MINECRAFT LOOK GUIDE */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-3xl p-6 shadow-2xl text-stone-200">
            <h3 className="text-lg font-black text-amber-300 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              操作方法 (Minecraftスタイル)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-xl text-sky-200">
                🎮 <strong>Minecraft同様のマウス視点操作:</strong>
                <br />
                画面をクリックするだけでカーソルが固定され、<strong>マウスをつかまずに動かすだけで全方位を見渡せます！</strong>
                ESCキーでいつでも解除可能です。
              </div>

              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-bold text-white">移動 (Move)</span>
                <span className="font-mono bg-stone-800 px-2 py-1 rounded text-amber-300">
                  W / A / S / D または 矢印キー
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-bold text-white">ジャンプ (Jump)</span>
                <span className="font-mono bg-stone-800 px-2 py-1 rounded text-emerald-300">
                  Space キー
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-bold text-white">ダッシュ加速 (Dash)</span>
                <span className="font-mono bg-stone-800 px-2 py-1 rounded text-amber-300">
                  Shift または E キー
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-bold text-white">チャット (Chat)</span>
                <span className="font-mono bg-stone-800 px-2 py-1 rounded text-purple-300">
                  Enter キー
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-sm transition-colors cursor-pointer"
            >
              了解！
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
