import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Input, PanelSection, Textarea } from './common';
import { FeaturePanelFrame, type FeaturePanelMetric, type FeaturePanelStatus } from './common/FeaturePanelFrame';
import { p2pNetwork } from '@/network/P2PNetwork';
import { torrentClient } from '@/network/TorrentClient';
import { QRHandshake, type QRHandshakeState } from '@/network/p2p/QRHandshake';

export type SpaceConnectionPanelAction =
  | 'arm-network'
  | 'create-room'
  | 'scan-qr'
  | 'connect-payload'
  | 'seed-fork'
  | 'merge-fork'
  | 'refresh';

export interface SpaceConnectionPanelSnapshot {
  online: boolean;
  rtcSupported: boolean;
  barcodeSupported: boolean;
  torrentSupported: boolean;
  handshakeState: QRHandshakeState;
  roomCode: string;
  lastPeerName: string;
  torrentCount: number;
  forkHash: string;
  forkName: string;
}

export interface SpaceConnectionFeaturePanelProps {
  className?: string;
  onAction?: (action: SpaceConnectionPanelAction) => void;
  onSnapshotChange?: (snapshot: SpaceConnectionPanelSnapshot) => void;
}

const SPACE_PEER_ID = 'panel-space-peer';
const SPACE_PEER_NAME = 'Bridge Console';

function createHandshake(setters: {
  setHandshakeState: React.Dispatch<React.SetStateAction<QRHandshakeState>>;
  setHandshakeError: React.Dispatch<React.SetStateAction<string>>;
  setRoomCode: React.Dispatch<React.SetStateAction<string>>;
  setLastPeerName: React.Dispatch<React.SetStateAction<string>>;
  setSharePayload: React.Dispatch<React.SetStateAction<string>>;
}): QRHandshake {
  return new QRHandshake({
    onStateChange: (state, error) => {
      setters.setHandshakeState(state);
      setters.setHandshakeError(error ?? '');
    },
    onRoomCreated: (roomCode) => {
      setters.setRoomCode(roomCode);
      setters.setSharePayload(JSON.stringify({
        roomCode,
        peerId: SPACE_PEER_ID,
        peerName: SPACE_PEER_NAME,
        timestamp: Date.now(),
        signalServers: ['wss://signaling.omnis-apien.dev'],
        capabilities: ['data-sync', 'chat', 'file-transfer'],
        version: '1.0.0',
      }, null, 2));
    },
    onConnected: (peerInfo) => {
      setters.setLastPeerName(peerInfo.peerName);
    },
    onError: (error) => {
      setters.setHandshakeError(error);
    },
  });
}

function buildSnapshot(
  handshakeState: QRHandshakeState,
  roomCode: string,
  lastPeerName: string,
  forkHash: string,
  forkName: string
): SpaceConnectionPanelSnapshot {
  return {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    rtcSupported: typeof RTCPeerConnection !== 'undefined',
    barcodeSupported: typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function',
    torrentSupported: torrentClient.isSupportedBrowser(),
    handshakeState,
    roomCode,
    lastPeerName,
    torrentCount: torrentClient.getTorrents().length,
    forkHash,
    forkName,
  };
}

function metricsFromSnapshot(snapshot: SpaceConnectionPanelSnapshot): FeaturePanelMetric[] {
  return [
    { label: '传输层', value: snapshot.rtcSupported ? 'WebRTC 已就绪' : 'WebRTC 不可用', detail: '点对点通道基础。' },
    { label: '相机扫描', value: snapshot.barcodeSupported ? 'BarcodeDetector 已就绪' : '手动载荷模式', detail: '二维码接力路径。' },
    { label: 'Torrent 栈', value: snapshot.torrentSupported ? 'WebTorrent 已就绪' : '仅保留降级', detail: '快照分发。' },
    { label: '房间码', value: snapshot.roomCode || '待定', detail: '实时接力会话。' },
    { label: 'Fork 哈希', value: snapshot.forkHash || '无', detail: '最近播种的快照。' },
  ];
}

function statusesFromSnapshot(snapshot: SpaceConnectionPanelSnapshot): FeaturePanelStatus[] {
  return [
    { label: snapshot.online ? '网络在线' : '离线模式', tone: snapshot.online ? 'native' : 'fallback' },
    { label: snapshot.handshakeState === 'connected' ? '接力已连接' : `接力 ${snapshot.handshakeState}`, tone: snapshot.handshakeState === 'connected' ? 'native' : 'fallback' },
    { label: snapshot.torrentSupported ? 'Fork 分发已就绪' : '分发降级', tone: snapshot.torrentSupported ? 'native' : 'fallback' },
  ];
}

export function SpaceConnectionFeaturePanel({
  className = '',
  onAction,
  onSnapshotChange,
}: SpaceConnectionFeaturePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const torrentReadyRef = useRef(false);
  const handshakeRef = useRef<QRHandshake | null>(null);

  const [handshakeState, setHandshakeState] = useState<QRHandshakeState>('idle');
  const [handshakeError, setHandshakeError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [lastPeerName, setLastPeerName] = useState('');
  const [sharePayload, setSharePayload] = useState('');
  const [importHash, setImportHash] = useState('');
  const [forkHash, setForkHash] = useState('');
  const [forkName, setForkName] = useState('世界分叉 Alpha（World Fork Alpha）');
  const [torrentVersion, setTorrentVersion] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  if (!handshakeRef.current) {
    handshakeRef.current = createHandshake({
      setHandshakeState,
      setHandshakeError,
      setRoomCode,
      setLastPeerName,
      setSharePayload,
    });
  }
  const handshake = handshakeRef.current;

  useEffect(() => {
    const handleReady = () => {
      setLog((entries) => [`Torrent ready`, ...entries].slice(0, 6));
      setTorrentVersion((value) => value + 1);
    };
    const handleProgress = () => {
      setTorrentVersion((value) => value + 1);
    };
    const handleDone = (infoHash: string) => {
      setForkHash(infoHash);
      setLog((entries) => [`Fork merged: ${infoHash}`, ...entries].slice(0, 6));
      setTorrentVersion((value) => value + 1);
    };
    const handleError = (error: Error) => {
      setLog((entries) => [`Torrent error: ${error.message}`, ...entries].slice(0, 6));
      setTorrentVersion((value) => value + 1);
    };
    const handlePeer = (peerId: string) => {
      setLastPeerName(peerId);
      setLog((entries) => [`Peer seen: ${peerId}`, ...entries].slice(0, 6));
      setTorrentVersion((value) => value + 1);
    };

    torrentClient.on('ready', handleReady);
    torrentClient.on('progress', handleProgress);
    torrentClient.on('done', handleDone);
    torrentClient.on('error', handleError);
    torrentClient.on('peer', handlePeer);

    return () => {
      const emitter = torrentClient as unknown as {
        off?: (event: string, listener: (...args: unknown[]) => void) => void;
        removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
      };
      emitter.off?.('ready', handleReady);
      emitter.off?.('progress', handleProgress);
      emitter.off?.('done', handleDone);
      emitter.off?.('error', handleError);
      emitter.off?.('peer', handlePeer);
      emitter.removeListener?.('ready', handleReady);
      emitter.removeListener?.('progress', handleProgress);
      emitter.removeListener?.('done', handleDone);
      emitter.removeListener?.('error', handleError);
      emitter.removeListener?.('peer', handlePeer);
      handshake.stopScanning();
    };
  }, [handshake]);

  const snapshot = useMemo(
    () => buildSnapshot(handshakeState, roomCode, lastPeerName, forkHash, forkName),
    [forkHash, forkName, handshakeState, lastPeerName, roomCode, torrentVersion]
  );

  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [onSnapshotChange, snapshot]);

  const refresh = () => {
    onAction?.('refresh');
    setTorrentVersion((value) => value + 1);
  };

  const armNetwork = async () => {
    onAction?.('arm-network');
    try {
      await p2pNetwork.init();
      if (!torrentReadyRef.current) {
        torrentReadyRef.current = await torrentClient.init();
      }
      setLog((entries) => ['Transport stack armed', ...entries].slice(0, 6));
      setTorrentVersion((value) => value + 1);
    } catch (error) {
      setLog((entries) => [`Transport init failed: ${error instanceof Error ? error.message : String(error)}`, ...entries].slice(0, 6));
    }
  };

  const createRoom = async () => {
    onAction?.('create-room');
    const room = await handshake.createRoom(canvasRef.current, SPACE_PEER_ID, SPACE_PEER_NAME);
    setRoomCode(room);
    setLog((entries) => [`Room created: ${room}`, ...entries].slice(0, 6));
    setTorrentVersion((value) => value + 1);
  };

  const scanQr = async () => {
    onAction?.('scan-qr');
    if (!videoRef.current) return;
    await handshake.scanQRCode(videoRef.current);
    setTorrentVersion((value) => value + 1);
  };

  const connectPayload = () => {
    onAction?.('connect-payload');
    const parsed = handshake.connectFromPayload(sharePayload);
    setLog((entries) => [
      parsed ? `Payload accepted for room ${parsed.roomCode}` : 'Payload rejected',
      ...entries,
    ].slice(0, 6));
    setTorrentVersion((value) => value + 1);
  };

  const seedFork = async () => {
    onAction?.('seed-fork');
    if (!torrentReadyRef.current) {
      torrentReadyRef.current = await torrentClient.init();
    }
    const payload = new TextEncoder().encode(
      JSON.stringify({
        branch: forkName,
        roomCode,
        peerName: lastPeerName || SPACE_PEER_NAME,
        handshakeState,
        seededAt: Date.now(),
        surface: 'world-fork',
      }, null, 2)
    );
    const info = await torrentClient.seed(forkName, payload.buffer);
    if (info) {
      setForkHash(info.infoHash);
      setImportHash(info.infoHash);
      setLog((entries) => [`Fork seeded: ${info.infoHash}`, ...entries].slice(0, 6));
    }
    setTorrentVersion((value) => value + 1);
  };

  const mergeFork = async () => {
    onAction?.('merge-fork');
    if (!importHash) return;
    if (!torrentReadyRef.current) {
      torrentReadyRef.current = await torrentClient.init();
    }
    await torrentClient.download(importHash);
    setLog((entries) => [`Merge requested for ${importHash}`, ...entries].slice(0, 6));
    setTorrentVersion((value) => value + 1);
  };

  return (
    <FeaturePanelFrame
      className={className}
      eyebrow="跨文明 / 空间连接"
      title="桥接与 Fork 控制台（Bridge and Fork Console）"
      description="这个面板把二维码接力、点对点传输和 Torrent 分发整合成一条可见工作流。设计上优先真实传输路径，再在浏览器无法走完时给出明确降级状态。"
      status={statusesFromSnapshot(snapshot)}
      metrics={metricsFromSnapshot(snapshot)}
      actions={
        <>
          <Button variant="primary" onClick={armNetwork}>
            预热传输栈
          </Button>
          <Button variant="secondary" onClick={createRoom}>
            创建房间
          </Button>
          <Button variant="secondary" onClick={scanQr}>
            扫描二维码
          </Button>
          <Button variant="ghost" onClick={connectPayload}>
            连接载荷
          </Button>
          <Button variant="ghost" onClick={seedFork}>
            播种 Fork
          </Button>
          <Button variant="ghost" onClick={mergeFork}>
            合并 Fork
          </Button>
          <Button variant="ghost" onClick={refresh}>
            刷新
          </Button>
        </>
      }
      footer="二维码载荷是普通 JSON，Fork 分支是真实的 Torrent 种子，只有底层浏览器 API 都同意时，点对点层才会声明成功。"
    >
      <div style={{ display: 'grid', gap: '0.9rem', padding: '0 1rem 1rem' }}>
        <PanelSection title="接力表面">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: '0.9rem' }}>
            <Card title="二维码房间" subtitle={handshakeError || '画布生成会话码'}>
              <canvas ref={canvasRef} width={240} height={240} style={{ width: '100%', borderRadius: 20, background: 'rgba(0,0,0,0.18)' }} />
              <p style={{ margin: '0.75rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                房间码：{roomCode || '待定'}
              </p>
            </Card>
            <Card title="扫描预览" subtitle="使用摄像头读取实时载荷">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                style={{ width: '100%', minHeight: 240, borderRadius: 20, background: 'rgba(0,0,0,0.22)' }}
              />
              <p style={{ margin: '0.75rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                如果设备无法打开摄像头或条码读取器，面板会停留在手动载荷模式，而不会假装扫描成功。
              </p>
            </Card>
          </div>
        </PanelSection>

        <PanelSection title="载荷与 Fork">
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <Textarea
              value={sharePayload}
              onChange={(event) => setSharePayload(event.target.value)}
              rows={7}
              placeholder="在这里粘贴或编辑二维码载荷 JSON。"
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.7rem' }}>
              <Input
                value={forkName}
                onChange={(event) => setForkName(event.target.value)}
                placeholder="Fork 名称"
              />
              <Input
                value={importHash}
                onChange={(event) => setImportHash(event.target.value)}
                placeholder="磁力哈希或 Fork infoHash"
              />
            </div>
          </div>
        </PanelSection>

        <PanelSection title="实时网络日志">
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {log.map((entry, index) => (
              <Card
                key={`${entry}-${index}`}
                title={entry}
                badge={<Badge variant={index === 0 ? 'primary' : 'default'}>{index === 0 ? '最新' : '事件'}</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {index === 0 ? '最近一次传输事件' : '同一次接力循环中的更早更新'}
                </p>
              </Card>
            ))}
            {log.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>目前还没有传输事件。请先预热传输栈开始。</div>}
          </div>
        </PanelSection>
      </div>
    </FeaturePanelFrame>
  );
}

export default SpaceConnectionFeaturePanel;
