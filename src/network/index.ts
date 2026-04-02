/**
 * 网络模块 - 索引文件
 */

export { ChatManager, chatManager } from './ChatManager';
export type { ChatMessage, ConnectionState as ChatConnectionState } from './ChatManager';
export { MessageType } from './ChatManager';

// P2P网络
export { P2PNetwork } from './P2PNetwork';
export type { NetworkMessage, Peer, ConsensusMessage, DHTNode } from './P2PNetwork';

// WebRTC
export { WebRTCManager } from './WebRTCManager';
export type { WebRTCConfig, NetworkMessage as WebRTCMessage, ConnectionState as WebRTCConnectionState, Peer as WebRTCPeer } from './WebRTCManager';

// WebTorrent
export { TorrentClient } from './TorrentClient';
export type { TorrentInfo, DownloadState, TorrentEvents } from './TorrentClient';

// 同步协议
export { SyncProtocol } from './SyncProtocol';
export type { SyncState, DeltaUpdate, Change, SyncEvents } from './SyncProtocol';
