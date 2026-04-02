/**
 * =============================================================================
 * 近场时空裂隙面板 - UI 组件
 * =============================================================================
 */

import React, { useState, useCallback, useMemo, memo } from 'react';

export type NearbyPanelMode = 'idle' | 'scanning' | 'devices' | 'connected';

export interface NearbyDeviceUI {
  id: string;
  name: string;
  type: string;
  signal: number;
  connected: boolean;
}

export interface NearbyPanelProps {
  className?: string;
  nodeId: string;
  onDeviceSelect?: (device: NearbyDeviceUI) => void;
  onSync?: (data: unknown) => void;
}

export const NearbyPanel: React.FC<NearbyPanelProps> = memo(({
  className = '',
  nodeId,
  onDeviceSelect,
  onSync,
}) => {
  const [mode, setMode] = useState<NearbyPanelMode>('idle');
  const [devices, setDevices] = useState<NearbyDeviceUI[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<NearbyDeviceUI | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');

  // 模拟扫描
  const handleStartScan = useCallback(() => {
    setMode('scanning');

    // 模拟发现设备
    setTimeout(() => {
      const mockDevices: NearbyDeviceUI[] = [
        { id: 'device-001', name: '我的手机', type: 'phone', signal: -45, connected: false },
        { id: 'device-002', name: '平板设备', type: 'tablet', signal: -62, connected: false },
        { id: 'device-003', name: '智能手表', type: 'watch', signal: -78, connected: false },
      ];
      setDevices(mockDevices);
      setMode('devices');
    }, 2000);
  }, []);

  // 停止扫描
  const handleStopScan = useCallback(() => {
    setMode('idle');
    setDevices([]);
  }, []);

  // 选择设备
  const handleDeviceSelect = useCallback((device: NearbyDeviceUI) => {
    setSelectedDevice(device);
    setDevices(prev => prev.map(d => 
      d.id === device.id ? { ...d, connected: true } : d
    ));
    setMode('connected');
    onDeviceSelect?.(device);
  }, [onDeviceSelect]);

  // 断开连接
  const handleDisconnect = useCallback(() => {
    setSelectedDevice(null);
    setDevices(prev => prev.map(d => ({ ...d, connected: false })));
    setMode('idle');
  }, []);

  // 开始同步
  const handleSync = useCallback(() => {
    setSyncStatus('syncing');
    onSync?.({ nodeId, timestamp: Date.now() });
    setTimeout(() => {
      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 1500);
  }, [nodeId, onSync]);

  // 获取信号强度图标
  const getSignalIcon = useCallback((rssi: number) => {
    if (rssi > -50) return '📶';
    if (rssi > -60) return '📱';
    if (rssi > -70) return '📴';
    return '📵';
  }, []);

  // 获取设备类型图标
  const getDeviceIcon = useCallback((type: string) => {
    switch (type) {
      case 'phone': return '📱';
      case 'tablet': return '📲';
      case 'watch': return '⌚';
      case 'laptop': return '💻';
      default: return '📟';
    }
  }, []);

  return (
    <div className={`nearby-panel ${className}`}>
      <div className="panel-header">
        <h3>时空裂隙</h3>
        <span className={`status-badge ${mode === 'connected' ? 'active' : ''}`}>
          {mode === 'scanning' ? '🔍 扫描中' : mode === 'connected' ? '🟢 已连接' : '⚪ 待机'}
        </span>
      </div>

      {/* 节点信息 */}
      <div className="node-info">
        <div className="node-id">
          <span className="label">节点ID:</span>
          <span className="value">{nodeId.slice(0, 8)}...</span>
        </div>
      </div>

      {/* 空闲状态 */}
      {mode === 'idle' && (
        <div className="mode-idle">
          <div className="proximity-animation">
            <div className="pulse-ring" />
            <div className="pulse-ring delay-1" />
            <div className="pulse-ring delay-2" />
            <span className="node-icon">🌀</span>
          </div>
          
          <p className="hint-text">启用蓝牙或 NFC 进行近场通讯</p>
          
          <div className="action-buttons">
            <button className="action-btn primary" onClick={handleStartScan}>
              <span className="icon">📡</span>
              开始扫描
            </button>
          </div>

          <div className="info-cards">
            <div className="info-card">
              <span className="card-icon">📱</span>
              <span className="card-text">近场感应</span>
            </div>
            <div className="info-card">
              <span className="card-icon">🔄</span>
              <span className="card-text">数据同步</span>
            </div>
            <div className="info-card">
              <span className="card-icon">🔒</span>
              <span className="card-text">加密传输</span>
            </div>
          </div>
        </div>
      )}

      {/* 扫描中 */}
      {mode === 'scanning' && (
        <div className="mode-scanning">
          <div className="scan-animation">
            <div className="radar" />
            <div className="radar-sweep" />
          </div>
          <p className="scanning-text">正在搜索附近设备...</p>
          <button className="action-btn secondary" onClick={handleStopScan}>
            取消
          </button>
        </div>
      )}

      {/* 设备列表 */}
      {mode === 'devices' && (
        <div className="mode-devices">
          <h4>发现设备 ({devices.length})</h4>
          <div className="device-list">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`device-item ${device.connected ? 'connected' : ''}`}
                onClick={() => handleDeviceSelect(device)}
              >
                <span className="device-icon">{getDeviceIcon(device.type)}</span>
                <div className="device-info">
                  <span className="device-name">{device.name}</span>
                  <span className="device-type">{device.type}</span>
                </div>
                <span className="signal-icon">{getSignalIcon(device.signal)}</span>
              </div>
            ))}
          </div>
          <button className="action-btn secondary" onClick={handleStopScan}>
            返回
          </button>
        </div>
      )}

      {/* 已连接 */}
      {mode === 'connected' && selectedDevice && (
        <div className="mode-connected">
          <div className="connection-card">
            <span className="device-icon large">{getDeviceIcon(selectedDevice.type)}</span>
            <h4>{selectedDevice.name}</h4>
            <span className="connection-status">🟢 已连接</span>
          </div>

          <div className="sync-section">
            <h4>数据同步</h4>
            <div className="sync-options">
              <button
                className={`sync-btn ${syncStatus === 'syncing' ? 'syncing' : ''}`}
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'idle' && '🔄 同步数据'}
                {syncStatus === 'syncing' && '⏳ 同步中...'}
                {syncStatus === 'done' && '✅ 同步完成'}
              </button>
            </div>

            <div className="sync-info">
              <div className="sync-item">
                <span className="sync-label">同步模式</span>
                <span className="sync-value">增量同步</span>
              </div>
              <div className="sync-item">
                <span className="sync-label">信号强度</span>
                <span className="sync-value">{getSignalIcon(selectedDevice.signal)}</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="action-btn danger" onClick={handleDisconnect}>
              断开连接
            </button>
          </div>
        </div>
      )}

      {/* 底部提示 */}
      <div className="panel-footer">
        <p>近场通讯范围: 约 10 米</p>
      </div>
    </div>
  );
});

NearbyPanel.displayName = 'NearbyPanel';

export default NearbyPanel;
