import * as THREE from 'three';
import {
  PlayerPhysicsState,
  ObstacleDef,
  CollectibleStar,
  Checkpoint,
  StageDefinition,
  BallEmotion,
} from '../types/game';
import { soundManager } from '../audio/soundManager';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
}

export class PhysicsEngine {
  public player: PlayerPhysicsState;
  public ballRadius: number = 0.8;
  public currentStage: StageDefinition | null = null;

  // Kinematic parameters
  private gravity: number = -26.0;
  private moveSpeed: number = 22.0;
  private airControl: number = 0.45;
  private maxGroundSpeed: number = 14.0;
  private maxDashSpeed: number = 24.0;
  private groundFriction: number = 0.88;
  private airDrag: number = 0.985;
  private jumpForce: number = 11.2;

  // Squash spring state
  private squashVelocityY: number = 0;
  private squashSpringK: number = 140.0;
  private squashDamping: number = 12.0;

  // Dash cooldown
  public dashCooldown: number = 0;
  public dashDuration: number = 0;

  // Dynamic obstacle state tracking
  public dynamicObstacles: Map<
    string,
    {
      currentPos: THREE.Vector3;
      velocity: THREE.Vector3;
      rotation: THREE.Euler;
      angularVelocity: THREE.Vector3;
      tiltAngle: number;
      tiltVel: number;
    }
  > = new Map();

  // Scratch objects to avoid GC in game loop
  private _ballPos = new THREE.Vector3();
  private _ballVel = new THREE.Vector3();
  private _moveDir = new THREE.Vector3();
  private _camForward = new THREE.Vector3();
  private _camRight = new THREE.Vector3();
  private _boxMin = new THREE.Vector3();
  private _boxMax = new THREE.Vector3();
  private _closestPoint = new THREE.Vector3();
  private _deltaVec = new THREE.Vector3();

  // Callbacks
  public onStarCollected?: (starId: string) => void;
  public onCheckpointReached?: (checkpointId: string) => void;
  public onGoalReached?: () => void;
  public onRespawn?: () => void;

  // Blink timer
  private nextBlinkTime: number = 3.0;
  private blinkTimer: number = 0;

  constructor() {
    this.player = {
      position: { x: 0, y: 3, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      isGrounded: false,
      groundNormal: { x: 0, y: 1, z: 0 },
      squashY: 1.0,
      squashXZ: 1.0,
      emotion: 'normal',
      speed: 0,
      isDashing: false,
    };
  }

  public loadStage(stage: StageDefinition) {
    this.currentStage = stage;
    this.resetToPoint(stage.spawnPoint);

    // Initialize dynamic obstacles
    this.dynamicObstacles.clear();
    for (const obs of stage.obstacles) {
      this.dynamicObstacles.set(obs.id, {
        currentPos: new THREE.Vector3(obs.position.x, obs.position.y, obs.position.z),
        velocity: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(
          obs.rotation?.x || 0,
          obs.rotation?.y || 0,
          obs.rotation?.z || 0
        ),
        angularVelocity: new THREE.Vector3(
          obs.spinSpeed?.x || 0,
          obs.spinSpeed?.y || 0,
          obs.spinSpeed?.z || 0
        ),
        tiltAngle: 0,
        tiltVel: 0,
      });
    }
  }

  public resetToPoint(pt: { x: number; y: number; z: number }) {
    this.player.position.x = pt.x;
    this.player.position.y = pt.y + 0.5;
    this.player.position.z = pt.z;
    this.player.velocity.x = 0;
    this.player.velocity.y = 0;
    this.player.velocity.z = 0;
    this.player.isGrounded = false;
    this.player.squashY = 1.0;
    this.player.squashXZ = 1.0;
    this.squashVelocityY = 0;
    this.player.emotion = 'normal';
    this.player.isDashing = false;
    this.dashCooldown = 0;
    this.dashDuration = 0;
  }

  public update(dt: number, input: InputState, cameraYaw: number) {
    if (!this.currentStage) return;

    // Clamp dt to prevent tunneling on frame hitch
    const clampedDt = Math.min(dt, 0.05);

    // Update dynamic obstacles (moving platforms, hammers, etc.)
    this.updateObstacles(clampedDt);

    // Apply Dash & Timers
    if (this.dashCooldown > 0) this.dashCooldown -= clampedDt;
    if (this.dashDuration > 0) {
      this.dashDuration -= clampedDt;
      if (this.dashDuration <= 0) {
        this.player.isDashing = false;
      }
    }

    if (input.dash && this.dashCooldown <= 0 && this.dashDuration <= 0) {
      this.player.isDashing = true;
      this.dashDuration = 0.35;
      this.dashCooldown = 1.2;
      soundManager.playBooster();
    }

    // Camera relative direction vectors
    this._camForward.set(Math.sin(cameraYaw), 0, Math.cos(cameraYaw)).normalize();
    this._camRight.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw)).normalize();

    this._moveDir.set(0, 0, 0);
    if (input.forward) this._moveDir.add(this._camForward);
    if (input.backward) this._moveDir.sub(this._camForward);
    // Fixed: A/D and Left/Right arrow directions
    if (input.right) this._moveDir.sub(this._camRight);
    if (input.left) this._moveDir.add(this._camRight);

    if (this._moveDir.lengthSq() > 0.001) {
      this._moveDir.normalize();
    }

    // Movement force
    const currentMaxSpeed = this.player.isDashing ? this.maxDashSpeed : this.maxGroundSpeed;
    const accel = this.moveSpeed * (this.player.isDashing ? 2.2 : 1.0);
    const controlFactor = this.player.isGrounded ? 1.0 : this.airControl;

    this.player.velocity.x += this._moveDir.x * accel * controlFactor * clampedDt;
    this.player.velocity.z += this._moveDir.z * accel * controlFactor * clampedDt;

    // Apply horizontal friction/damping
    const friction = this.player.isGrounded ? this.groundFriction : this.airDrag;
    this.player.velocity.x *= Math.pow(friction, clampedDt * 60);
    this.player.velocity.z *= Math.pow(friction, clampedDt * 60);

    // Cap horizontal velocity
    const horizontalSpeed = Math.sqrt(
      this.player.velocity.x * this.player.velocity.x + this.player.velocity.z * this.player.velocity.z
    );
    if (horizontalSpeed > currentMaxSpeed) {
      const ratio = currentMaxSpeed / horizontalSpeed;
      this.player.velocity.x *= ratio;
      this.player.velocity.z *= ratio;
    }

    // Gravity
    this.player.velocity.y += this.gravity * clampedDt;

    // Jump handling
    if (input.jump && this.player.isGrounded) {
      this.player.velocity.y = this.jumpForce;
      this.player.isGrounded = false;
      this.squashVelocityY = 8.0; // Dynamic spring stretch
      soundManager.playJump();
    }

    // Integrate position
    this.player.position.x += this.player.velocity.x * clampedDt;
    this.player.position.y += this.player.velocity.y * clampedDt;
    this.player.position.z += this.player.velocity.z * clampedDt;

    // Collision detection & resolution against stage obstacles
    this.player.isGrounded = false;
    this.resolveObstacleCollisions(clampedDt);

    // Check Collectibles & Checkpoints
    this.checkStageTriggers();

    // Kill plane check
    if (this.player.position.y < this.currentStage.killY) {
      soundManager.playHazardHit();
      // Respawn at last reached checkpoint or spawn point
      const lastCheckpoint = this.currentStage.checkpoints
        .filter((c) => c.reached)
        .slice(-1)[0];
      const respawnPt = lastCheckpoint ? lastCheckpoint.position : this.currentStage.spawnPoint;
      this.resetToPoint(respawnPt);
      this.player.emotion = 'worried';
      if (this.onRespawn) this.onRespawn();
    }

    // Update Squash & Stretch Spring Physics
    this.updateSquashSpring(clampedDt);

    // Dynamic Emotion State
    this.updateEmotion(clampedDt);

    // Sound updates
    this.player.speed = Math.sqrt(
      this.player.velocity.x * this.player.velocity.x +
        this.player.velocity.y * this.player.velocity.y +
        this.player.velocity.z * this.player.velocity.z
    );
    soundManager.updateRollSound(horizontalSpeed, this.player.isGrounded);
  }

  private updateObstacles(dt: number) {
    if (!this.currentStage) return;
    const time = performance.now() * 0.001;

    for (const obs of this.currentStage.obstacles) {
      const state = this.dynamicObstacles.get(obs.id);
      if (!state) continue;

      switch (obs.type) {
        case 'moving_platform': {
          if (obs.moveRange && obs.moveSpeed) {
            const freq = obs.moveSpeed;
            const sine = Math.sin(time * freq);
            const cos = Math.cos(time * freq);

            const prevX = state.currentPos.x;
            const prevY = state.currentPos.y;
            const prevZ = state.currentPos.z;

            state.currentPos.x = obs.position.x + obs.moveRange.x * sine;
            state.currentPos.y = obs.position.y + obs.moveRange.y * sine;
            state.currentPos.z = obs.position.z + obs.moveRange.z * sine;

            state.velocity.x = (state.currentPos.x - prevX) / dt;
            state.velocity.y = (state.currentPos.y - prevY) / dt;
            state.velocity.z = (state.currentPos.z - prevZ) / dt;
          }
          break;
        }
        case 'spinning_hammer':
        case 'spike_roller': {
          if (obs.spinSpeed) {
            state.rotation.x += obs.spinSpeed.x * dt;
            state.rotation.y += obs.spinSpeed.y * dt;
            state.rotation.z += obs.spinSpeed.z * dt;
          }
          break;
        }
        case 'tilting_bridge': {
          // Spring physics to return tilting bridge to neutral
          const springK = 8.0;
          const damping = 2.5;
          const accel = -springK * state.tiltAngle - damping * state.tiltVel;
          state.tiltVel += accel * dt;
          state.tiltAngle += state.tiltVel * dt;

          if (obs.tiltAxis === 'z') {
            state.rotation.z = state.tiltAngle;
          } else {
            state.rotation.x = state.tiltAngle;
          }
          break;
        }
      }
    }
  }

  private resolveObstacleCollisions(dt: number) {
    if (!this.currentStage) return;

    this._ballPos.set(this.player.position.x, this.player.position.y, this.player.position.z);
    this._ballVel.set(this.player.velocity.x, this.player.velocity.y, this.player.velocity.z);

    for (const obs of this.currentStage.obstacles) {
      const state = this.dynamicObstacles.get(obs.id);
      const obsPos = state ? state.currentPos : obs.position;

      switch (obs.type) {
        case 'platform':
        case 'moving_platform':
        case 'tilting_bridge': {
          const sx = (obs.size?.x || 4) / 2;
          const sy = (obs.size?.y || 1) / 2;
          const sz = (obs.size?.z || 4) / 2;

          this._boxMin.set(obsPos.x - sx, obsPos.y - sy, obsPos.z - sz);
          this._boxMax.set(obsPos.x + sx, obsPos.y + sy, obsPos.z + sz);

          // Find closest point on box to sphere
          this._closestPoint.x = Math.max(this._boxMin.x, Math.min(this._ballPos.x, this._boxMax.x));
          this._closestPoint.y = Math.max(this._boxMin.y, Math.min(this._ballPos.y, this._boxMax.y));
          this._closestPoint.z = Math.max(this._boxMin.z, Math.min(this._ballPos.z, this._boxMax.z));

          this._deltaVec.subVectors(this._ballPos, this._closestPoint);
          const distSq = this._deltaVec.lengthSq();

          if (distSq < this.ballRadius * this.ballRadius) {
            const dist = Math.sqrt(distSq);
            let nx = 0;
            let ny = 1;
            let nz = 0;

            if (dist > 0.0001) {
              nx = this._deltaVec.x / dist;
              ny = this._deltaVec.y / dist;
              nz = this._deltaVec.z / dist;
            }

            const penetration = this.ballRadius - dist;
            this.player.position.x += nx * penetration;
            this.player.position.y += ny * penetration;
            this.player.position.z += nz * penetration;

            // Collision reaction
            const normalVel =
              this.player.velocity.x * nx + this.player.velocity.y * ny + this.player.velocity.z * nz;

            if (normalVel < 0) {
              // Restitution (bounciness)
              const bounciness = 0.15;
              this.player.velocity.x -= (1 + bounciness) * normalVel * nx;
              this.player.velocity.y -= (1 + bounciness) * normalVel * ny;
              this.player.velocity.z -= (1 + bounciness) * normalVel * nz;
            }

            // Check if standing on top surface
            if (ny > 0.5) {
              this.player.isGrounded = true;
              this.player.groundNormal.x = nx;
              this.player.groundNormal.y = ny;
              this.player.groundNormal.z = nz;

              // If moving platform, transfer platform velocity
              if (obs.type === 'moving_platform' && state) {
                this.player.position.x += state.velocity.x * dt;
                this.player.position.z += state.velocity.z * dt;
              }

              // If tilting bridge, apply ball weight to tilt
              if (obs.type === 'tilting_bridge' && state) {
                const leverArm = obs.tiltAxis === 'z' ? this.player.position.x - obsPos.x : this.player.position.z - obsPos.z;
                state.tiltVel += leverArm * 0.4 * dt;
              }

              // Landing squash trigger
              if (this._ballVel.y < -3.0) {
                const impact = Math.min(1.0, Math.abs(this._ballVel.y) / 16.0);
                this.squashVelocityY = -impact * 12.0;
                soundManager.playBounce(impact);
              }
            }
          }
          break;
        }

        case 'jump_pad': {
          const sx = (obs.size?.x || 2.5) / 2;
          const sy = (obs.size?.y || 0.4) / 2;
          const sz = (obs.size?.z || 2.5) / 2;

          if (
            Math.abs(this.player.position.x - obsPos.x) < sx + this.ballRadius * 0.7 &&
            Math.abs(this.player.position.z - obsPos.z) < sz + this.ballRadius * 0.7 &&
            this.player.position.y > obsPos.y &&
            this.player.position.y < obsPos.y + sy + this.ballRadius
          ) {
            this.player.velocity.y = obs.jumpForce || 20.0;
            this.player.isGrounded = false;
            this.squashVelocityY = 16.0;
            soundManager.playTrampoline();
          }
          break;
        }

        case 'speed_booster': {
          const sx = (obs.size?.x || 2.5) / 2;
          const sz = (obs.size?.z || 4.0) / 2;

          if (
            Math.abs(this.player.position.x - obsPos.x) < sx + this.ballRadius * 0.5 &&
            Math.abs(this.player.position.z - obsPos.z) < sz + this.ballRadius * 0.5 &&
            Math.abs(this.player.position.y - obsPos.y) < 1.2
          ) {
            const rotY = obs.rotation?.y || 0;
            const boost = obs.boostForce || 26.0;
            this.player.velocity.x = Math.sin(rotY) * boost;
            this.player.velocity.z = Math.cos(rotY) * boost;
            this.player.isDashing = true;
            this.dashDuration = 0.6;
            soundManager.playBooster();
          }
          break;
        }

        case 'pinball_bumper': {
          const rad = (obs.radius || 1.2) + this.ballRadius;
          const dx = this.player.position.x - obsPos.x;
          const dz = this.player.position.z - obsPos.z;
          const dy = this.player.position.y - obsPos.y;
          const distSq = dx * dx + dz * dz;

          if (distSq < rad * rad && Math.abs(dy) < 1.5) {
            const dist = Math.sqrt(distSq) || 0.001;
            const nx = dx / dist;
            const nz = dz / dist;
            const repulse = obs.boostForce || 18.0;

            this.player.velocity.x = nx * repulse;
            this.player.velocity.z = nz * repulse;
            this.player.velocity.y = 6.0;
            this.player.position.x = obsPos.x + nx * (rad + 0.05);
            this.player.position.z = obsPos.z + nz * (rad + 0.05);

            soundManager.playTrampoline();
            this.player.emotion = 'happy';
          }
          break;
        }

        case 'spinning_hammer': {
          if (!state) break;
          // Approximate hammer head position orbiting center
          const armLength = (obs.size?.x || 5.0) / 2;
          const angle = state.rotation.y;
          const headX = obsPos.x + Math.sin(angle) * armLength;
          const headZ = obsPos.z + Math.cos(angle) * armLength;
          const headY = obsPos.y;

          const dx = this.player.position.x - headX;
          const dy = this.player.position.y - headY;
          const dz = this.player.position.z - headZ;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 1.5 + this.ballRadius) {
            // Strong dynamic knockback in spin tangent direction
            const spinVelX = Math.cos(angle) * armLength * 12;
            const spinVelZ = -Math.sin(angle) * armLength * 12;

            this.player.velocity.x = spinVelX;
            this.player.velocity.z = spinVelZ;
            this.player.velocity.y = 9.0;

            soundManager.playHazardHit();
            this.player.emotion = 'worried';
          }
          break;
        }

        case 'wind_fan': {
          if (obs.windForce) {
            const range = obs.size?.z || 12;
            const width = obs.size?.x || 4;
            const dx = this.player.position.x - obsPos.x;
            const dz = this.player.position.z - obsPos.z;
            const dy = this.player.position.y - obsPos.y;

            if (Math.abs(dx) < width / 2 && Math.abs(dy) < 3.0 && dz > 0 && dz < range) {
              this.player.velocity.x += obs.windForce.x * dt;
              this.player.velocity.y += obs.windForce.y * dt;
              this.player.velocity.z += obs.windForce.z * dt;
            }
          }
          break;
        }
      }
    }
  }

  private checkStageTriggers() {
    if (!this.currentStage) return;

    // Collectible Stars
    for (const star of this.currentStage.stars) {
      if (star.collected) continue;
      const dx = this.player.position.x - star.position.x;
      const dy = this.player.position.y - star.position.y;
      const dz = this.player.position.z - star.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < (this.ballRadius + 0.7) * (this.ballRadius + 0.7)) {
        star.collected = true;
        soundManager.playStarCollect();
        if (this.onStarCollected) this.onStarCollected(star.id);
      }
    }

    // Checkpoints
    for (const cp of this.currentStage.checkpoints) {
      if (cp.reached) continue;
      const dx = this.player.position.x - cp.position.x;
      const dy = this.player.position.y - cp.position.y;
      const dz = this.player.position.z - cp.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < cp.radius * cp.radius) {
        cp.reached = true;
        soundManager.playCheckpoint();
        if (this.onCheckpointReached) this.onCheckpointReached(cp.id);
      }
    }

    // Goal Check
    const gx = this.player.position.x - this.currentStage.goalPoint.x;
    const gy = this.player.position.y - this.currentStage.goalPoint.y;
    const gz = this.player.position.z - this.currentStage.goalPoint.z;
    const goalDistSq = gx * gx + gy * gy + gz * gz;

    if (goalDistSq < (this.currentStage.goalRadius + this.ballRadius) * (this.currentStage.goalRadius + this.ballRadius)) {
      if (this.onGoalReached) {
        this.onGoalReached();
      }
    }
  }

  private updateSquashSpring(dt: number) {
    // Spring towards target squash = 1.0
    const targetSquashY = 1.0;
    const diff = targetSquashY - this.player.squashY;
    const springForce = diff * this.squashSpringK;
    const dampingForce = -this.squashVelocityY * this.squashDamping;

    const accel = springForce + dampingForce;
    this.squashVelocityY += accel * dt;
    this.player.squashY += this.squashVelocityY * dt;

    // Preserve volume: squashXZ inversely proportional to squashY
    this.player.squashY = Math.max(0.45, Math.min(1.6, this.player.squashY));
    this.player.squashXZ = 1.0 / Math.sqrt(this.player.squashY);
  }

  private updateEmotion(dt: number) {
    if (!this.player.isGrounded && this.player.velocity.y < -9.0) {
      this.player.emotion = 'worried';
      return;
    }

    if (this.player.isDashing || this.player.speed > 16.0) {
      this.player.emotion = 'happy';
      return;
    }

    // Cute spontaneous blink
    this.blinkTimer += dt;
    if (this.blinkTimer > this.nextBlinkTime) {
      this.player.emotion = 'blink';
      if (this.blinkTimer > this.nextBlinkTime + 0.18) {
        this.player.emotion = 'normal';
        this.blinkTimer = 0;
        this.nextBlinkTime = 2.5 + Math.random() * 4.0;
      }
    } else {
      this.player.emotion = 'normal';
    }
  }
}
