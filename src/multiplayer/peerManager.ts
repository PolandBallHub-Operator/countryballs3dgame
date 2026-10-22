import Peer, { DataConnection } from 'peerjs';
import { RemotePlayerState, ChatMessage, CountryId } from '../types/game';

type MessagePayload =
  | {
      type: 'player_state';
      state: RemotePlayerState;
    }
  | {
      type: 'chat';
      message: ChatMessage;
    };

export class PeerManager {
  private peer: Peer | null = null;
  public myPeerId: string = '';
  public isReady: boolean = false;
  private connections: Map<string, DataConnection> = new Map();
  public remotePlayers: Map<string, RemotePlayerState> = new Map();

  // Callbacks
  public onPeerReady?: (id: string) => void;
  public onConnectionChange?: (connectedCount: number) => void;
  public onRemoteState?: (state: RemotePlayerState) => void;
  public onRemoteLeave?: (id: string) => void;
  public onChatMessage?: (msg: ChatMessage) => void;

  constructor() {
    this.initPeer();
  }

  public initPeer(customCode?: string) {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    // Generate cute Polandball-style Peer ID if none provided
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const desiredId = customCode || `BALL-${randomSuffix}`;

    try {
      this.peer = new Peer(desiredId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        this.isReady = true;
        if (this.onPeerReady) this.onPeerReady(id);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        // If desired ID is taken, fallback to default random ID
        if (err.type === 'unavailable-id') {
          this.peer?.destroy();
          this.peer = new Peer({ debug: 1 });
          this.peer.on('open', (id) => {
            this.myPeerId = id;
            this.isReady = true;
            if (this.onPeerReady) this.onPeerReady(id);
          });
          this.peer.on('connection', (conn) => this.setupConnection(conn));
        }
      });
    } catch (e) {
      console.warn('PeerJS init error:', e);
    }
  }

  public connectToPeer(remoteCode: string) {
    if (!this.peer || !this.isReady) return;
    const cleanCode = remoteCode.trim().toUpperCase();
    if (cleanCode === this.myPeerId) return;
    if (this.connections.has(cleanCode)) return;

    const conn = this.peer.connect(cleanCode, { reliable: true });
    this.setupConnection(conn);
  }

  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      if (this.onConnectionChange) this.onConnectionChange(this.connections.size);
    });

    conn.on('data', (raw: any) => {
      const payload = raw as MessagePayload;
      if (!payload || !payload.type) return;

      if (payload.type === 'player_state') {
        const state = payload.state;
        this.remotePlayers.set(state.id, state);
        if (this.onRemoteState) this.onRemoteState(state);
      } else if (payload.type === 'chat') {
        if (this.onChatMessage) this.onChatMessage(payload.message);

        // Also assign message to remote player for 3D speech bubble
        const p = this.remotePlayers.get(payload.message.senderId);
        if (p) {
          p.lastMessage = payload.message.text;
          p.lastMessageTime = Date.now();
        }
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.remotePlayers.delete(conn.peer);
      if (this.onRemoteLeave) this.onRemoteLeave(conn.peer);
      if (this.onConnectionChange) this.onConnectionChange(this.connections.size);
    });

    conn.on('error', () => {
      this.connections.delete(conn.peer);
      this.remotePlayers.delete(conn.peer);
      if (this.onRemoteLeave) this.onRemoteLeave(conn.peer);
      if (this.onConnectionChange) this.onConnectionChange(this.connections.size);
    });
  }

  public broadcastState(state: RemotePlayerState) {
    if (this.connections.size === 0) return;
    const payload: MessagePayload = {
      type: 'player_state',
      state,
    };
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(payload);
      }
    }
  }

  public broadcastChat(text: string, senderName: string) {
    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: this.myPeerId,
      senderName,
      text,
      time: Date.now(),
    };

    const payload: MessagePayload = {
      type: 'chat',
      message: msg,
    };

    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(payload);
      }
    }

    if (this.onChatMessage) this.onChatMessage(msg);
    return msg;
  }

  public getConnectedCount(): number {
    return this.connections.size;
  }

  public destroy() {
    for (const conn of this.connections.values()) {
      try {
        conn.close();
      } catch (e) {}
    }
    this.connections.clear();
    this.remotePlayers.clear();
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {}
      this.peer = null;
    }
  }
}

export const peerManager = new PeerManager();
