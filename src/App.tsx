import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { ChatOverlay } from './components/ChatOverlay';
import { VictoryModal } from './components/VictoryModal';
import { SettingsModal } from './components/SettingsModal';
import { CountryId, GameMode, UserProfile, ChatMessage } from './types/game';
import { STAGES } from './stages/stageData';
import { soundManager } from './audio/soundManager';
import { peerManager } from './multiplayer/peerManager';

const STORAGE_KEY_PROFILE = 'countryball_profile_v1';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // Game Mode State
  const [mode, setMode] = useState<GameMode>('title');

  // User Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: `Player_${Math.floor(100 + Math.random() * 900)}`,
      selectedCountry: 'poland',
      eyeSize: 1.0,
    };
  });
  const profileRef = useRef<UserProfile>(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Action Stage & Stats
  const [stageIndex, setStageIndex] = useState<number>(1);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [starsCollected, setStarsCollected] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [isDashing, setIsDashing] = useState<boolean>(false);
  const [dashCooldown, setDashCooldown] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // Minecraft-style Pointer Lock State
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

  // PeerJS Multiplayer State
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [connectedCount, setConnectedCount] = useState<number>(0);

  // In-Game Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // In-Game Settings Modal State
  const [showInGameSettings, setShowInGameSettings] = useState<boolean>(false);

  // Current Stage Definition
  const currentStage = STAGES[stageIndex] || STAGES[1];

  // Initialize GameEngine & PeerJS
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current);
    gameEngineRef.current = engine;

    // Apply saved profile skin / custom flag / eye size
    if (profile.selectedCountry === 'custom' && profile.customFlagDataUrl) {
      engine.setCustomFlag(profile.customFlagDataUrl);
    } else {
      engine.setCountry(profile.selectedCountry);
    }
    if (profile.eyeSize) {
      engine.setEyeSize(profile.eyeSize);
    }
    if (profile.eyeSpacing) {
      engine.setEyeSpacing(profile.eyeSpacing);
    }

    // Callbacks from Physics
    engine.physics.onStarCollected = () => {
      if (engine.physics.currentStage) {
        const count = engine.physics.currentStage.stars.filter((s) => s.collected).length;
        setStarsCollected(count);
      }
    };

    engine.physics.onGoalReached = () => {
      if (engine.physics.currentStage && !engine.physics.currentStage.isRoom) {
        soundManager.playVictory();
        setIsVictory(true);
      }
    };

    engine.onPointerLockChange = (locked) => {
      setIsPointerLocked(locked);
    };

    // PeerJS listeners
    peerManager.onPeerReady = (id) => setMyPeerId(id);
    peerManager.onConnectionChange = (count) => setConnectedCount(count);
    peerManager.onRemoteState = (state) => engine.updateRemotePlayer(state);
    peerManager.onRemoteLeave = (id) => engine.removeRemotePlayer(id);
    peerManager.onChatMessage = (msg) => {
      setChatMessages((prev) => [...prev.slice(-30), msg]);
    };

    // State poll interval for HUD
    const hudInterval = setInterval(() => {
      if (!engine || !engine.physics) return;
      setSpeed(engine.physics.player.speed);
      setIsDashing(engine.physics.player.isDashing);
      setDashCooldown(engine.physics.dashCooldown);
    }, 50);

    // State broadcast interval (25Hz)
    const broadcastInterval = setInterval(() => {
      if (!engine || !engine.physics || !peerManager.isReady) return;
      if (peerManager.getConnectedCount() > 0) {
        const player = engine.physics.player;
        const curr = profileRef.current;
        peerManager.broadcastState({
          id: peerManager.myPeerId,
          name: curr.name,
          country: curr.selectedCountry,
          customFlagData: curr.selectedCountry === 'custom' ? curr.customFlagDataUrl : undefined,
          eyeSize: curr.eyeSize ?? 1.0,
          eyeSpacing: curr.eyeSpacing ?? 1.0,
          position: player.position,
          facingYaw: engine.cameraYaw,
          squashY: player.squashY,
          squashXZ: player.squashXZ,
          emotion: player.emotion,
          isDashing: player.isDashing,
        });
      }
    }, 40);

    return () => {
      clearInterval(hudInterval);
      clearInterval(broadcastInterval);
      engine.dispose();
      soundManager.dispose();
      peerManager.destroy();
      gameEngineRef.current = null;
    };
  }, []);

  // Keyboard shortcut to toggle chat with Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'title') return;
      if (e.code === 'Enter') {
        setIsChatOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  // Timer loop for action stages
  useEffect(() => {
    if (mode !== 'action' || isVictory) return;
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, [mode, isVictory]);

  // Profile update handler
  const handleUpdateProfile = useCallback(
    (updated: Partial<UserProfile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...updated };
        try {
          localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(next));
        } catch (e) {}

        if (gameEngineRef.current) {
          if (next.selectedCountry === 'custom' && next.customFlagDataUrl) {
            gameEngineRef.current.setCustomFlag(next.customFlagDataUrl);
          } else {
            gameEngineRef.current.setCountry(next.selectedCountry);
          }
          if (next.eyeSize !== undefined) {
            gameEngineRef.current.setEyeSize(next.eyeSize);
          }
          if (next.eyeSpacing !== undefined) {
            gameEngineRef.current.setEyeSpacing(next.eyeSpacing);
          }
        }
        return next;
      });
    },
    []
  );

  // Start Action Campaign
  const handleStartAction = useCallback(() => {
    setMode('action');
    setStageIndex(1);
    setElapsedTime(0);
    setStarsCollected(0);
    setIsVictory(false);
    if (gameEngineRef.current) {
      gameEngineRef.current.loadStage(1);
      gameEngineRef.current.requestPointerLock();
      setTimeout(() => gameEngineRef.current?.requestPointerLock(), 150);
    }
  }, []);

  // Start PeerRoom Plaza
  const handleStartPeerRoom = useCallback(() => {
    setMode('peer_room');
    setStageIndex(0); // Stage 0 is the PeerRoom plaza
    setElapsedTime(0);
    setIsVictory(false);
    if (gameEngineRef.current) {
      gameEngineRef.current.loadStage(0);
      gameEngineRef.current.requestPointerLock();
      setTimeout(() => gameEngineRef.current?.requestPointerLock(), 150);
    }
  }, []);

  // Return to Title Screen
  const handleReturnToTitle = useCallback(() => {
    setMode('title');
    setIsVictory(false);
    if (gameEngineRef.current) {
      gameEngineRef.current.exitPointerLock();
    }
  }, []);

  // Restart current action stage
  const handleRestart = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.loadStage(stageIndex);
    }
    setElapsedTime(0);
    setStarsCollected(0);
    setIsVictory(false);
  }, [stageIndex]);

  // Next stage after clearing
  const handleNextStage = useCallback(() => {
    const nextIdx = stageIndex + 1;
    if (nextIdx < STAGES.length) {
      setStageIndex(nextIdx);
      setElapsedTime(0);
      setStarsCollected(0);
      setIsVictory(false);
      if (gameEngineRef.current) {
        gameEngineRef.current.loadStage(nextIdx);
      }
    } else {
      // Loop back to Stage 1
      handleStartAction();
    }
  }, [stageIndex, handleStartAction]);

  // Send Chat message
  const handleSendMessage = useCallback(
    (text: string) => {
      const msg = peerManager.broadcastChat(text, profile.name);
      if (msg) {
        setChatMessages((prev) => [...prev.slice(-30), msg]);
      }
      setIsChatOpen(false);
    },
    [profile.name]
  );

  // Connect to friend's PeerCode
  const handleConnectToPeer = useCallback((code: string) => {
    peerManager.connectToPeer(code);
  }, []);

  // Sound toggles
  const handleToggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  }, [soundEnabled]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans">
      {/* 1. Dedicated Three.js WebGL Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* 2. Title Screen (when mode === 'title') */}
      {mode === 'title' && (
        <TitleScreen
          onStartAction={handleStartAction}
          onStartPeerRoom={handleStartPeerRoom}
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          myPeerId={myPeerId}
          connectedCount={connectedCount}
          onConnectToPeer={handleConnectToPeer}
        />
      )}

      {/* 3. In-Game HUD (Action & PeerRoom modes) */}
      {mode !== 'title' && (
        <>
          <GameHUD
            currentStage={currentStage}
            stageIndex={stageIndex}
            totalStages={STAGES.length - 1} // excludes room from count
            elapsedTime={elapsedTime}
            starsCollected={starsCollected}
            totalStars={currentStage.stars.length}
            speed={speed}
            isDashing={isDashing}
            dashCooldown={dashCooldown}
            soundEnabled={soundEnabled}
            bgmEnabled={bgmEnabled}
            onToggleSound={handleToggleSound}
            onRestart={handleRestart}
            onReturnToTitle={handleReturnToTitle}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onOpenSettings={() => {
              gameEngineRef.current?.exitPointerLock();
              setShowInGameSettings(true);
            }}
            isPointerLocked={isPointerLocked}
            onRequestPointerLock={() => gameEngineRef.current?.requestPointerLock()}
            myPeerId={myPeerId}
            connectedCount={connectedCount}
          />

          {/* Real-time Multiplayer Chat Overlay */}
          <ChatOverlay
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isOpen={isChatOpen}
            onToggleOpen={() => setIsChatOpen(!isChatOpen)}
            userName={profile.name}
          />

          {/* In-Game Settings Modal (Eye size, custom flag, country) */}
          <SettingsModal
            isOpen={showInGameSettings}
            onClose={() => setShowInGameSettings(false)}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        </>
      )}

      {/* 4. Victory Celebration Modal */}
      {isVictory && (
        <VictoryModal
          stage={currentStage}
          clearTime={elapsedTime}
          starsCollected={starsCollected}
          totalStars={currentStage.stars.length}
          onNextStage={handleNextStage}
          onRetry={handleRestart}
          hasNextStage={stageIndex < STAGES.length - 1}
        />
      )}
    </div>
  );
}
