import { Peer } from 'peerjs';
import { RemotePlayer } from './RemotePlayer.js';
import * as THREE from 'three';

export class NetworkManager {
  constructor(scene) {
    this.scene = scene;
    this.peer = null;
    this.hostConnection = null; // Client -> Host connection
    this.connections = new Map(); // Host -> Map of client connections

    this.isHost = false;
    this.isConnected = false;
    this.roomCode = null;
    this.localPlayerId = null;
    this.localPlayerName = 'Player_' + Math.floor(1000 + Math.random() * 9000);
    this.localPlayerColor = '#00f0ff';
    this.localPlayerTeam = 'blue';

    this.remotePlayers = new Map(); // peerId -> RemotePlayer
    this.lobbyPlayers = []; // List of player objects in lobby

    this.lobbyConfig = {
      mapId: 'speedball',
      mode: 'ffa', // 'ffa' (Deathmatch) or 'team'
      scoreLimit: 15,
      matchTime: 300 // 5 minutes
    };

    // State sync tick
    this.sendRate = 1000 / 25; // 25 Hz
    this.lastSendTime = 0;

    // Callbacks
    this.onLobbyUpdate = null;
    this.onMatchStart = null;
    this.onRemoteFire = null;
    this.onKillfeed = null;
    this.onChatMessage = null;
    this.onPlayerEliminated = null;
    this.onError = null;
    this.onRoomReady = null;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'APX';
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(playerName, mapId = 'speedball', mode = 'ffa') {
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    this.localPlayerName = playerName || this.localPlayerName;
    this.localPlayerId = 'host_' + Math.floor(Math.random() * 100000);
    this.lobbyConfig.mapId = mapId;
    this.lobbyConfig.mode = mode;

    const peerId = `paintball-apex-room-${this.roomCode.toLowerCase()}`;

    try {
      this.peer = new Peer(peerId, {
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.isConnected = true;
        this.lobbyPlayers = [{
          id: this.localPlayerId,
          name: this.localPlayerName,
          team: 'blue',
          color: '#00f0ff',
          isHost: true,
          isReady: true,
          score: 0,
          kills: 0,
          deaths: 0
        }];

        this.onRoomReady?.(this.roomCode);
        this.onLobbyUpdate?.(this.lobbyPlayers, this.lobbyConfig);
      });

      this.peer.on('connection', (conn) => {
        this.handleIncomingConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS Host Error:', err);
        if (err.type === 'unavailable-id') {
          // Retry with new room code
          this.createRoom(playerName, mapId, mode);
        } else {
          this.onError?.(err.message || 'Failed to create multiplayer room.');
        }
      });
    } catch (e) {
      console.error('Create room exception:', e);
      this.onError?.('WebRTC connection failed.');
    }
  }

  joinRoom(roomCode, playerName) {
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase().trim();
    this.localPlayerName = playerName || this.localPlayerName;
    this.localPlayerId = 'client_' + Math.floor(Math.random() * 100000);

    const hostPeerId = `paintball-apex-room-${this.roomCode.toLowerCase()}`;

    try {
      this.peer = new Peer(null, { debug: 1 });

      this.peer.on('open', (id) => {
        const conn = this.peer.connect(hostPeerId, {
          reliable: true
        });

        this.hostConnection = conn;

        conn.on('open', () => {
          this.isConnected = true;
          // Send Join Request
          conn.send({
            type: 'JOIN_REQUEST',
            player: {
              id: this.localPlayerId,
              name: this.localPlayerName,
              team: 'orange',
              color: '#ff7700',
              isHost: false,
              isReady: true,
              score: 0,
              kills: 0,
              deaths: 0
            }
          });
        });

        conn.on('data', (data) => {
          this.handleNetworkData(data, conn);
        });

        conn.on('close', () => {
          this.onError?.('Disconnected from host.');
          this.leaveRoom();
        });

        conn.on('error', (err) => {
          this.onError?.('Connection error with host.');
        });
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS Client Error:', err);
        this.onError?.('Room not found or host unavailable.');
      });
    } catch (e) {
      console.error('Join room exception:', e);
      this.onError?.('Failed to connect to room.');
    }
  }

  handleIncomingConnection(conn) {
    conn.on('open', () => {
      // Wait for JOIN_REQUEST
    });

    conn.on('data', (data) => {
      if (data.type === 'JOIN_REQUEST') {
        const newPlayer = data.player;
        newPlayer.peerId = conn.peer;

        // Auto assign team if team mode
        if (this.lobbyConfig.mode === 'team') {
          const blueCount = this.lobbyPlayers.filter(p => p.team === 'blue').length;
          const orangeCount = this.lobbyPlayers.filter(p => p.team === 'orange').length;
          newPlayer.team = blueCount <= orangeCount ? 'blue' : 'orange';
          newPlayer.color = newPlayer.team === 'blue' ? '#00f0ff' : '#ff7700';
        }

        this.lobbyPlayers.push(newPlayer);
        this.connections.set(conn.peer, conn);

        // Broadcast updated lobby to all clients
        this.broadcast({
          type: 'LOBBY_UPDATE',
          players: this.lobbyPlayers,
          config: this.lobbyConfig
        });

        this.onLobbyUpdate?.(this.lobbyPlayers, this.lobbyConfig);
      } else {
        this.handleNetworkData(data, conn);
        // Relay to other clients if host
        this.relayToOthers(data, conn.peer);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.lobbyPlayers = this.lobbyPlayers.filter(p => p.peerId !== conn.peer);
      this.removeRemotePlayer(conn.peer);

      this.broadcast({
        type: 'LOBBY_UPDATE',
        players: this.lobbyPlayers,
        config: this.lobbyConfig
      });
      this.onLobbyUpdate?.(this.lobbyPlayers, this.lobbyConfig);
    });
  }

  handleNetworkData(data, senderConn) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'LOBBY_UPDATE':
        this.lobbyPlayers = data.players;
        this.lobbyConfig = data.config;
        this.onLobbyUpdate?.(this.lobbyPlayers, this.lobbyConfig);
        break;

      case 'START_MATCH':
        this.lobbyConfig = data.config;
        this.onMatchStart?.(data.config);
        break;

      case 'PLAYER_STATE':
        this.updateRemotePlayerState(data);
        break;

      case 'FIRE_PROJECTILE':
        this.onRemoteFire?.(data);
        break;

      case 'PLAYER_HIT':
        this.handlePlayerHit(data);
        break;

      case 'PLAYER_ELIMINATED':
        this.handlePlayerEliminated(data);
        break;

      case 'CHAT_MESSAGE':
        this.onChatMessage?.(data);
        break;
    }
  }

  broadcast(msg) {
    if (this.isHost) {
      for (const conn of this.connections.values()) {
        if (conn.open) conn.send(msg);
      }
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(msg);
    }
  }

  relayToOthers(msg, senderPeerId) {
    if (!this.isHost) return;
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId !== senderPeerId && conn.open) {
        conn.send(msg);
      }
    }
  }

  startMatch() {
    if (!this.isHost) return;
    const msg = {
      type: 'START_MATCH',
      config: this.lobbyConfig
    };
    this.broadcast(msg);
    this.onMatchStart?.(this.lobbyConfig);
  }

  sendPlayerState(position, yaw, pitch, stance, health) {
    if (!this.isConnected) return;
    const now = performance.now();
    if (now - this.lastSendTime < this.sendRate) return;
    this.lastSendTime = now;

    this.broadcast({
      type: 'PLAYER_STATE',
      playerId: this.localPlayerId,
      name: this.localPlayerName,
      team: this.localPlayerTeam,
      color: this.localPlayerColor,
      pos: { x: position.x, y: position.y, z: position.z },
      yaw: yaw,
      pitch: pitch,
      stance: stance,
      health: health
    });
  }

  sendFireProjectile(origin, velocity, colorHex, weaponType) {
    this.broadcast({
      type: 'FIRE_PROJECTILE',
      shooterId: this.localPlayerId,
      shooterName: this.localPlayerName,
      origin: { x: origin.x, y: origin.y, z: origin.z },
      velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
      colorHex: colorHex,
      weaponType: weaponType
    });
  }

  sendPlayerHit(victimId, damage, isHeadshot) {
    this.broadcast({
      type: 'PLAYER_HIT',
      victimId: victimId,
      shooterId: this.localPlayerId,
      shooterName: this.localPlayerName,
      damage: damage,
      isHeadshot: isHeadshot
    });
  }

  sendPlayerEliminated(victimId, victimName, weaponType) {
    this.broadcast({
      type: 'PLAYER_ELIMINATED',
      victimId: victimId,
      victimName: victimName,
      killerId: this.localPlayerId,
      killerName: this.localPlayerName,
      weaponType: weaponType
    });
  }

  sendChat(text) {
    this.broadcast({
      type: 'CHAT_MESSAGE',
      sender: this.localPlayerName,
      text: text
    });
    this.onChatMessage?.({ sender: this.localPlayerName, text: text });
  }

  updateRemotePlayerState(data) {
    if (data.playerId === this.localPlayerId) return;

    let rp = this.remotePlayers.get(data.playerId);
    if (!rp) {
      rp = new RemotePlayer(this.scene, data.playerId, data.name, data.team, data.color);
      this.remotePlayers.set(data.playerId, rp);
    }

    rp.setTransform(data.pos, data.yaw, data.pitch, data.stance);
    rp.health = data.health;
    rp.updateNameTag();
  }

  handlePlayerHit(data) {
    if (data.victimId === this.localPlayerId) {
      // Local player was hit!
      this.onPlayerHitLocal?.(data);
    } else {
      const rp = this.remotePlayers.get(data.victimId);
      if (rp) {
        rp.applyDamage(data.damage, data.isHeadshot);
      }
    }
  }

  handlePlayerEliminated(data) {
    this.onKillfeed?.(data);

    // Update Scores in lobby list
    const killer = this.lobbyPlayers.find(p => p.id === data.killerId);
    const victim = this.lobbyPlayers.find(p => p.id === data.victimId);
    if (killer) killer.kills = (killer.kills || 0) + 1;
    if (victim) victim.deaths = (victim.deaths || 0) + 1;
  }

  removeRemotePlayer(peerId) {
    for (const [id, rp] of this.remotePlayers.entries()) {
      if (rp.id === peerId) {
        rp.dispose();
        this.remotePlayers.delete(id);
        break;
      }
    }
  }

  update(delta) {
    for (const rp of this.remotePlayers.values()) {
      rp.update(delta);
    }
  }

  leaveRoom() {
    for (const rp of this.remotePlayers.values()) {
      rp.dispose();
    }
    this.remotePlayers.clear();
    this.lobbyPlayers = [];
    this.isConnected = false;
    this.roomCode = null;

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  getRemoteHitboxes() {
    const hitboxes = [];
    for (const rp of this.remotePlayers.values()) {
      if (!rp.isEliminated) {
        hitboxes.push(...rp.hitboxes);
      }
    }
    return hitboxes;
  }
}
