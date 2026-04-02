/**
 * =============================================================================
 * 空间折跃面板 - P2P 连接 UI
 * =============================================================================
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { logger } from '../../core/utils/Logger';
import { QRHandshake, type HandshakeData, type QRHandshakeState } from './QRHandshake';

export type SpaceWarpPanelMode = 'idle' | 'create' | 'scan' | 'connected';

export interface SpaceWarpPanelProps {
  className?: string;
  peerId: string;
  peerName: string;
  onConnect?: (remotePeerId: string, remotePeerName: string) => void;
  onDisconnect?: () => void;
  onMessage?: (message: string) => void;
}

export const SpaceWarpPanel: React.FC<SpaceWarpPanelProps> = memo(({
  className = '',
  peerId,
  peerName,
  onConnect,
  onDisconnect,
  onMessage,
}) => {
  const [mode, setMode] = useState<SpaceWarpPanelMode>('idle');
  const [handshakeState, setHandshakeState] = useState<QRHandshakeState>('idle');
  const [roomCode, setRoomCode] = useState<string>('');
  const [generatedPayload, setGeneratedPayload] = useState<string>('');
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [remotePeerName, setRemotePeerName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ from: string; content: string; time: number }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handshakeRef = useRef<QRHandshake | null>(null);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);

  useEffect(() => {
    const handshake = new QRHandshake({
      onStateChange: (state, error) => {
        setHandshakeState(state);
        if (error) {
          setScanError(error);
        } else if (state !== 'error') {
          setScanError('');
        }
      },
      onRoomCreated: (code) => {
        setRoomCode(code);
        setGeneratedPayload(handshake.getHandshakeData());
      },
      onScanned: (data: HandshakeData) => {
        setScanResult(JSON.stringify(data, null, 2));
        setScanError('');
      },
      onConnected: ({ peerId: remotePeerId, peerName: remoteName }) => {
        setMode('connected');
        setConnectedPeers([remotePeerId]);
        setRemotePeerName(remoteName);
        setChatMessages([]);
        setInputMessage('');
        setScanInput('');
        onConnectRef.current?.(remotePeerId, remoteName);
      },
      onError: (error) => {
        setScanError(error);
        logger.warn('SpaceWarpPanel', error);
      },
    });

    handshakeRef.current = handshake;

    return () => {
      handshake.destroy();
      handshakeRef.current = null;
    };
  }, []);

  const resetSessionState = useCallback(() => {
    setConnectedPeers([]);
    setRemotePeerName('');
    setChatMessages([]);
    setInputMessage('');
  }, []);

  const handleCreateRoom = useCallback(async () => {
    if (!handshakeRef.current) return;

    handshakeRef.current.destroy();
    setMode('create');
    setScanError('');
    setScanResult(null);
    setScanInput('');
    resetSessionState();

    try {
      const code = await handshakeRef.current.createRoom(canvasRef.current, peerId, peerName);
      setRoomCode(code);
      setGeneratedPayload(handshakeRef.current.getHandshakeData());
    } catch (error) {
      logger.error('SpaceWarpPanel', 'Failed to create room', error instanceof Error ? error : new Error(String(error)));
      setScanError('创建房间失败');
      setMode('idle');
    }
  }, [peerId, peerName, resetSessionState]);

  const handleStartScan = useCallback(async () => {
    if (!handshakeRef.current || !videoRef.current) {
      setMode('scan');
      setScanError('摄像头未准备好');
      return;
    }

    handshakeRef.current.destroy();
    setMode('scan');
    setScanError('');
    setScanResult(null);
    setScanInput('');
    setGeneratedPayload('');
    resetSessionState();

    try {
      await handshakeRef.current.scanQRCode(videoRef.current);
    } catch (error) {
      logger.error('SpaceWarpPanel', 'Failed to start scan', error instanceof Error ? error : new Error(String(error)));
      setScanError('无法启动扫码');
    }
  }, [resetSessionState]);

  const handleStopScan = useCallback(() => {
    handshakeRef.current?.stopScanning();
    setMode('idle');
    setHandshakeState('idle');
    setScanError('');
    setScanResult(null);
    setScanInput('');
  }, []);

  const handleManualConnect = useCallback(() => {
    if (!handshakeRef.current) return;

    const payload = scanInput.trim();
    if (!payload) {
      setScanError('请先粘贴连接码');
      return;
    }

    const parsed = handshakeRef.current.connectFromPayload(payload);
    if (!parsed) {
      setScanError('无法解析连接码');
      return;
    }
  }, [scanInput]);

  const handleDisconnect = useCallback(() => {
    handshakeRef.current?.destroy();
    setMode('idle');
    setHandshakeState('idle');
    setRoomCode('');
    setGeneratedPayload('');
    setScanError('');
    setScanResult(null);
    setScanInput('');
    resetSessionState();
    onDisconnectRef.current?.();
  }, [resetSessionState]);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      from: peerName,
      content: inputMessage,
      time: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    onMessage?.(inputMessage);
    setInputMessage('');
  }, [inputMessage, onMessage, peerName]);

  const handleCopyPayload = useCallback(async () => {
    if (!generatedPayload) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(generatedPayload);
      setScanError('');
    } catch (error) {
      logger.warn('SpaceWarpPanel', 'Failed to copy payload', error instanceof Error ? error : new Error(String(error)));
      setScanError('复制失败，请手动选择文本');
    }
  }, [generatedPayload]);

  const handleCopyScanInput = useCallback(async () => {
    if (!scanInput.trim()) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(scanInput.trim());
      setScanError('');
    } catch (error) {
      logger.warn('SpaceWarpPanel', 'Failed to copy scan payload', error instanceof Error ? error : new Error(String(error)));
      setScanError('复制失败，请手动选择文本');
    }
  }, [scanInput]);

  const handleCopyRoomCode = useCallback(async () => {
    if (!roomCode) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(roomCode);
      setScanError('');
    } catch (error) {
      logger.warn('SpaceWarpPanel', 'Failed to copy room code', error instanceof Error ? error : new Error(String(error)));
      setScanError('复制失败，请手动选择房间码');
    }
  }, [roomCode]);

  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const barcodeSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const headerStatus = mode === 'connected'
    ? '🟢 已连接'
    : mode === 'create'
      ? '🟣 已创建'
      : mode === 'scan'
        ? handshakeState === 'error'
          ? '⚠️ 需要手动连接'
          : '🔍 扫描中'
        : '⚪ 待机';

  return (
    <div className={`space-warp-panel ${className}`}>
      <div className="panel-header">
        <h3>空间折跃</h3>
        <span className="status-indicator">{headerStatus}</span>
      </div>

      {mode === 'idle' && (
        <div className="mode-idle">
          <div className="identity-info">
            <div className="identity-item">
              <span className="label">节点ID:</span>
              <span className="value">{peerId.slice(0, 8)}...</span>
            </div>
            <div className="identity-item">
              <span className="label">节点名:</span>
              <span className="value">{peerName}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="action-btn primary" onClick={handleCreateRoom}>
              <span className="icon">🔗</span>
              创建房间
            </button>
            <button className="action-btn secondary" onClick={handleStartScan}>
              <span className="icon">📷</span>
              扫描连接
            </button>
          </div>

          <div className="info-section">
            <h4>连接方式</h4>
            <ul>
              <li><strong>创建房间:</strong> 生成可扫码或复制的连接码</li>
              <li><strong>扫描连接:</strong> 使用摄像头识别二维码，或粘贴连接码手动连接</li>
            </ul>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="mode-create">
          <div className="room-info">
            <h4>房间已创建</h4>
            <div className="room-code">
              <span className="code-label">房间码:</span>
              <span className="code-value">{roomCode}</span>
              <button
                className="copy-btn"
                onClick={handleCopyRoomCode}
                disabled={!roomCode}
              >
                复制
              </button>
            </div>
          </div>

          <div className="qr-container">
            <canvas ref={canvasRef} className="qr-canvas" />
            <p className="qr-hint">
              {barcodeSupported
                ? '让对方扫描此二维码，或复制下方连接码'
                : '当前浏览器不支持二维码识别，请复制下方连接码'}
            </p>
          </div>

          <div className="payload-section">
            <label className="payload-label" htmlFor="generated-payload">连接码</label>
            <textarea
              id="generated-payload"
              className="payload-textarea"
              value={generatedPayload}
              readOnly
              rows={6}
            />
            <div className="action-buttons">
              <button className="action-btn secondary" onClick={handleCopyPayload} disabled={!generatedPayload}>
                复制连接码
              </button>
              <button className="action-btn secondary" onClick={handleDisconnect}>
                放弃创建
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'scan' && (
        <div className="mode-scan">
          <div className="scanner-container">
            <video ref={videoRef} className="scanner-video" />
            <div className="scanner-overlay">
              <div className="scan-frame" />
            </div>
          </div>

          <div className="scan-hints">
            <div className="info-section">
              <h4>扫码状态</h4>
              <ul>
                <li>{barcodeSupported ? '摄像头扫码已开启，识别到二维码后将自动连接' : '当前浏览器不支持 BarcodeDetector，请使用手动粘贴连接'}</li>
                <li>连接码内容会自动解析为房间、节点和协议信息</li>
              </ul>
            </div>
          </div>

          {scanError && (
            <div className="scan-result">
              <h4>提示</h4>
              <pre>{scanError}</pre>
            </div>
          )}

          {scanResult && (
            <div className="scan-result">
              <h4>扫描结果</h4>
              <pre>{scanResult}</pre>
            </div>
          )}

          <div className="payload-section">
            <label className="payload-label" htmlFor="scan-payload">手动连接码</label>
            <textarea
              id="scan-payload"
              className="payload-textarea"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="粘贴二维码中的 JSON 连接码"
              rows={6}
            />
            <div className="action-buttons">
              <button className="action-btn primary" onClick={handleManualConnect} disabled={!scanInput.trim()}>
                使用连接码连接
              </button>
              <button className="action-btn secondary" onClick={handleCopyScanInput} disabled={!scanInput.trim()}>
                复制输入内容
              </button>
              <button className="action-btn secondary" onClick={handleStopScan}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'connected' && (
        <div className="mode-connected">
          <div className="connection-info">
            <div className="connected-peers">
              <h4>已连接节点 ({connectedPeers.length})</h4>
              {connectedPeers.map((peer) => (
                <div key={peer} className="peer-item">
                  <span className="peer-status online" />
                  <span className="peer-name">{remotePeerName || peer}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="empty-chat">
                  暂无消息，开始聊天吧
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message ${msg.from === peerName ? 'outgoing' : 'incoming'}`}
                  >
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">{formatTime(msg.time)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入消息..."
              />
              <button onClick={handleSendMessage}>发送</button>
            </div>
          </div>

          <div className="action-buttons">
            <button className="action-btn danger" onClick={handleDisconnect}>
              断开连接
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

SpaceWarpPanel.displayName = 'SpaceWarpPanel';

export default SpaceWarpPanel;
