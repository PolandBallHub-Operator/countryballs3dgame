export type CountryId =
  | 'poland'
  | 'palau'
  | 'carrot'
  | 'japan'
  | 'germany'
  | 'usa'
  | 'france'
  | 'uk'
  | 'ukraine'
  | 'italy'
  | 'brazil'
  | 'canada'
  | 'custom';

export interface CountryInfo {
  id: CountryId;
  name: string;
  flagEmoji: string;
  description: string;
}

export type BallEmotion = 'normal' | 'happy' | 'worried' | 'blink' | 'squint';

export type GameMode = 'title' | 'action' | 'peer_room';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerPhysicsState {
  position: Vector3D;
  velocity: Vector3D;
  angularVelocity: Vector3D;
  isGrounded: boolean;
  groundNormal: Vector3D;
  squashY: number;
  squashXZ: number;
  emotion: BallEmotion;
  speed: number;
  isDashing: boolean;
}

export interface CollectibleStar {
  id: string;
  position: Vector3D;
  collected: boolean;
}

export interface Checkpoint {
  id: string;
  position: Vector3D;
  radius: number;
  reached: boolean;
}

export type ObstacleType =
  | 'platform'
  | 'moving_platform'
  | 'tilting_bridge'
  | 'spinning_hammer'
  | 'pinball_bumper'
  | 'jump_pad'
  | 'speed_booster'
  | 'wind_fan'
  | 'spike_roller'
  | 'beach_ball'
  | 'goal';

export interface ObstacleDef {
  id: string;
  type: ObstacleType;
  position: Vector3D;
  size?: Vector3D;
  radius?: number;
  rotation?: Vector3D;
  color?: number;
  moveRange?: Vector3D;
  moveSpeed?: number;
  spinSpeed?: Vector3D;
  jumpForce?: number;
  boostForce?: number;
  windForce?: Vector3D;
  tiltAxis?: 'x' | 'z';
  customParams?: Record<string, any>;
}

export interface StageDefinition {
  id: number;
  isRoom?: boolean;
  title: string;
  subtitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme' | 'Plaza';
  skyColor: number;
  fogColor: number;
  groundColor: number;
  spawnPoint: Vector3D;
  goalPoint: Vector3D;
  goalRadius: number;
  killY: number;
  parTime: number;
  checkpoints: Checkpoint[];
  stars: CollectibleStar[];
  obstacles: ObstacleDef[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: number;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  country: CountryId;
  customFlagData?: string;
  eyeSize?: number;
  eyeSpacing?: number;
  position: Vector3D;
  facingYaw: number;
  squashY: number;
  squashXZ: number;
  emotion: BallEmotion;
  isDashing: boolean;
  lastMessage?: string;
  lastMessageTime?: number;
}

export interface UserProfile {
  name: string;
  selectedCountry: CountryId;
  customFlagDataUrl?: string;
  eyeSize?: number;
  eyeSpacing?: number;
}

export interface GameSettings {
  mouseSensitivity: number;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  outlineThickness: number;
  cameraDistance: number;
}
