/**
 * =============================================================================
 * 永夜熵纪 - 系统状态面板
 * System Status Panel - 显示所有已激活功能的状态
 * =============================================================================
 * 
 * V5 修复：解决"代码尸体"问题 - 让用户能看到所有功能状态
 */

import React, { useState, useEffect, useCallback } from 'react';
import { systemIntegrator } from '@/core/SystemIntegrator';
import { torrentClient } from '@/network/TorrentClient';
import { speechRecognition } from '@/input/SpeechRecognition';
import { eyeTracker } from '@/input/EyeTracker';
import { gamepadManager } from '@/input/GamepadManager';
import { hapticsManager } from '@/output/HapticsManager';
import { backgroundSync } from '@/sw/BackgroundSync';
import { audioEngine } from '@/audio/AudioEngine';

interface SystemStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SystemStatus {
  name: string;
  nameCN: string;
  active: boolean;
  supported: boolean;
  details: string;
  icon: string;
  warning?: boolean;
  warningDetails?: string;
}

interface P2PDownloadProgress {
  isDownloading: boolean;
  progress: number;
  downloadSpeed: number;
  downloadedBytes: number;
  timeRemaining: number;
  torrentName: string;
}

interface P2PContribution {
  uploadedBytes: number;
  seedCount: number;
  contributionScore: number;
  level: string;
  levelIcon: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '计算中...';
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${Math.round(seconds % 60)}秒`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}时${minutes}分`;
}

function getContributionLevel(score: number): { level: string; icon: string } {
  if (score >= 10000) return { level: '传奇贡献者', icon: '🏆' };
  if (score >= 5000) return { level: '钻石贡献者', icon: '💎' };
  if (score >= 2000) return { level: '黄金贡献者', icon: '🥇' };
  if (score >= 500) return { level: '白银贡献者', icon: '🥈' };
  if (score >= 100) return { level: '青铜贡献者', icon: '🥉' };
  if (score >= 10) return { level: '初级贡献者', icon: '⭐' };
  return { level: '新手', icon: '🌱' };
}

export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({ isOpen, onClose }) => {
  const [statuses, setStatuses] = useState<SystemStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [p2pDownloadProgress, setP2PDownloadProgress] = useState<P2PDownloadProgress>({
    isDownloading: false,
    progress: 0,
    downloadSpeed: 0,
    downloadedBytes: 0,
    timeRemaining: 0,
    torrentName: '',
  });
  const [p2pContribution, setP2PContribution] = useState<P2PContribution>({
    uploadedBytes: 0,
    seedCount: 0,
    contributionScore: 0,
    level: '新手',
    levelIcon: '🌱',
  });

  const refreshStatus = useCallback(async () => {
    setRefreshing(true);
    
    const integratorState = systemIntegrator.getState();
    const integratorStats = systemIntegrator.getStats();
    
    const torrents = torrentClient.getTorrents();
    let downloadingTorrent: P2PDownloadProgress = {
      isDownloading: false,
      progress: 0,
      downloadSpeed: 0,
      downloadedBytes: 0,
      timeRemaining: 0,
      torrentName: '',
    };
    
    for (const torrent of torrents) {
      const state = torrentClient.getTorrentState(torrent.infoHash);
      if (state && state.progress < 1) {
        downloadingTorrent = {
          isDownloading: true,
          progress: state.progress,
          downloadSpeed: state.downloadSpeed,
          downloadedBytes: Math.floor(torrent.length * state.progress),
          timeRemaining: state.timeRemaining,
          torrentName: torrent.name,
        };
        break;
      }
    }
    setP2PDownloadProgress(downloadingTorrent);
    
    const contribution = systemIntegrator.getP2PContribution();
    const levelInfo = getContributionLevel(contribution.contributionScore);
    setP2PContribution({
      uploadedBytes: contribution.uploadedBytes,
      seedCount: contribution.seedCount,
      contributionScore: contribution.contributionScore,
      level: levelInfo.level,
      levelIcon: levelInfo.icon,
    });
    
    const newStatuses: SystemStatus[] = [
      {
        name: 'P2P Network',
        nameCN: 'P2P 网络',
        active: integratorState.p2p?.active || false,
        supported: torrentClient.isSupportedBrowser(),
        details: integratorState.p2p?.active 
          ? `${integratorState.p2p.peerCount} 个节点已连接`
          : '点击启用以开始 P2P 连接',
        icon: '🌐',
      },
      {
        name: 'Global Illumination',
        nameCN: '全局光照',
        active: integratorState.gi?.active || false,
        supported: true,
        details: integratorState.gi?.active
          ? `${integratorState.gi.nodeCount} 个节点, ${integratorState.gi.probeCount} 个探针`
          : '未激活',
        icon: '💡',
      },
      {
        name: 'Gaussian Splatting',
        nameCN: '高斯泼溅',
        active: integratorState.gaussian?.active || false,
        supported: true,
        details: integratorState.gaussian?.active
          ? `${integratorState.gaussian.pointCount} 个点`
          : '未激活',
        icon: '✨',
      },
      {
        name: 'Eye Tracking',
        nameCN: '眼动追踪',
        active: integratorState.eyeTracker?.active || false,
        supported: true,
        details: integratorState.eyeTracker?.active
          ? integratorState.eyeTracker.calibrated 
            ? '已校准'
            : '未校准 - 点击开始校准'
          : '点击启用以开始追踪',
        icon: '👁️',
      },
      {
        name: 'Voice Control',
        nameCN: '语音控制',
        active: integratorState.voice?.listening || false,
        supported: speechRecognition.isSupportedBrowser(),
        details: integratorState.voice?.listening
          ? `正在监听... 最后命令: ${integratorState.voice.lastCommand || '无'}`
          : '点击启用以开始语音控制',
        icon: '🎤',
      },
      {
        name: 'Gamepad',
        nameCN: '手柄',
        active: integratorState.gamepad?.connected > 0,
        supported: true,
        details: integratorState.gamepad?.connected
          ? `${integratorState.gamepad.connected} 个手柄已连接`
          : '未检测到手柄',
        icon: '🎮',
      },
      {
        name: 'Biometric Auth',
        nameCN: '生物识别',
        active: integratorState.dao?.activeProposals > 0,
        supported: typeof window.PublicKeyCredential !== 'undefined',
        details: '用于 DAO 抲票的神启验证',
        icon: '🔐',
      },
      {
        name: 'Background Sync',
        nameCN: '后台同步',
        active: true,
        supported: 'serviceWorker' in navigator,
        details: backgroundSync.getSyncStatus().isOnline 
          ? '在线 - 同步就绪'
          : '离线 - 待同步',
        icon: '🔄',
      },
      {
        name: 'Audio Engine',
        nameCN: '音频引擎',
        active: true,
        supported: true,
        details: (() => {
          const info = audioEngine.getSampleRateInfo();
          return `采样率: ${info.current}Hz / 目标: ${info.target}Hz`;
        })(),
        warning: (() => {
          const info = audioEngine.getSampleRateInfo();
          return !info.isAtTarget;
        })(),
        warningDetails: (() => {
          const info = audioEngine.getSampleRateInfo();
          if (!info.isAtTarget) {
            return `您的设备支持最高${info.target}Hz，当前使用${info.current}Hz`;
          }
          return undefined;
        })(),
        icon: '🔊',
      },
    ];
    
    setStatuses(newStatuses);
    setRefreshing(false);
  }, []);

  const toggleSystem = useCallback(async (systemName: string) => {
    switch (systemName) {
      case 'P2P Network':
        if (!systemIntegrator.getState().p2p?.active) {
          await systemIntegrator.startP2P();
        }
        break;
      case 'Eye Tracking':
        if (!systemIntegrator.getState().eyeTracker?.active) {
          await systemIntegrator.startEyeTracking();
        }
        break;
      case 'Voice Control':
        if (!speechRecognition.isActive()) {
          speechRecognition.start();
        } else {
          speechRecognition.stop();
        }
        break;
      case 'Eye Tracking Calibration':
        await systemIntegrator.calibrateEyeTracking();
        break;
    }
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 2000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  if (!isOpen) return null;

  return (
    <div className="system-status-panel">
      <div className="panel-header">
        <h2>系统状态</h2>
        <button className="refresh-btn" onClick={refreshStatus} disabled={refreshing}>
          {refreshing ? '刷新中...' : '🔄 刷新'}
        </button>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="status-grid">
        {statuses.map((status) => (
          <div key={status.name} className={`status-card ${status.active ? 'active' : 'inactive'} ${status.warning ? 'warning' : ''}`}>
            <div className="status-icon">
              {status.icon}
              {status.warning && <span className="warning-badge">⚠️</span>}
            </div>
            <div className="status-info">
              <div className="status-name">
                <span className="name-en">{status.name}</span>
                <span className="name-cn">{status.nameCN}</span>
              </div>
              <div className="status-supported">
                {status.supported ? '✅ 支持' : '❌ 不支持'}
              </div>
              <div className="status-details">{status.details}</div>
              {status.warning && status.warningDetails && (
                <div className="status-warning">{status.warningDetails}</div>
              )}
              {status.name === 'P2P Network' && status.active && (
                <>
                  {p2pDownloadProgress.isDownloading && (
                    <div className="p2p-download-progress">
                      <div className="download-info">
                        <span className="download-name">{p2pDownloadProgress.torrentName}</span>
                        <span className="download-percent">{(p2pDownloadProgress.progress * 100).toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${p2pDownloadProgress.progress * 100}%` }}
                        />
                      </div>
                      <div className="download-stats">
                        <span>↓ {formatBytes(p2pDownloadProgress.downloadSpeed)}/s</span>
                        <span>已下载: {formatBytes(p2pDownloadProgress.downloadedBytes)}</span>
                        <span>剩余: {formatTime(p2pDownloadProgress.timeRemaining / 1000)}</span>
                      </div>
                    </div>
                  )}
                  <div className="p2p-contribution">
                    <div className="contribution-header">
                      <span className="contribution-icon">{p2pContribution.levelIcon}</span>
                      <span className="contribution-level">{p2pContribution.level}</span>
                    </div>
                    <div className="contribution-stats">
                      <div className="stat-item">
                        <span className="stat-label">上传量</span>
                        <span className="stat-value">{formatBytes(p2pContribution.uploadedBytes)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">做种数</span>
                        <span className="stat-value">{p2pContribution.seedCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">贡献分</span>
                        <span className="stat-value">{p2pContribution.contributionScore}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="status-actions">
              {status.name === 'P2P Network' && !status.active && (
                <button onClick={() => toggleSystem('P2P Network')}>启用</button>
              )}
              {status.name === 'Eye Tracking' && !status.active && (
                <button onClick={() => toggleSystem('Eye Tracking')}>启用</button>
              )}
              {status.name === 'Eye Tracking' && status.active && !systemIntegrator.getState().eyeTracker?.calibrated && (
                <button onClick={() => toggleSystem('Eye Tracking Calibration')}>校准</button>
              )}
              {status.name === 'Voice Control' && status.supported && (
                <button onClick={() => toggleSystem('Voice Control')}>
                  {speechRecognition.isActive() ? '停止' : '启用'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="panel-footer">
        <div className="active-count">
          活跃系统: {statuses.filter(s => s.active).length} / {statuses.length}
        </div>
      </div>
      
      <style>{`
        .system-status-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          max-height: 80vh;
          background: rgba(10, 10, 20, 0.95);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 12px;
          color: #fff;
          font-family: var(--font-ui);
          z-index: 10000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(0, 240, 255, 0.2);
        }
        .panel-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--color-primary);
        }
        .refresh-btn, .close-btn {
          background: transparent;
          border: 1px solid rgba(0, 240, 255, 0.3);
          color: #fff;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .refresh-btn:hover, .close-btn:hover {
          background: rgba(0, 240, 255, 0.1);
          border-color: var(--color-primary);
        }
        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .status-grid {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .status-card {
          background: rgba(20, 20, 40, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.75rem;
          transition: all 0.2s;
        }
        .status-card.active {
          border-color: rgba(16, 185, 129, 0.5);
          background: rgba(16, 185, 129, 0.1);
        }
        .status-card.inactive {
          border-color: rgba(255, 255, 255, 0.1);
        }
        .status-card.warning {
          border-color: rgba(255, 193, 7, 0.6);
          background: rgba(255, 193, 7, 0.08);
        }
        .warning-badge {
          margin-left: 0.25rem;
          font-size: 0.9rem;
        }
        .status-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .status-info {
          margin-bottom: 0.5rem;
        }
        .status-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .name-en {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .name-cn {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .status-supported {
          font-size: 0.7rem;
          color: rgba(16, 185, 129, 0.8);
        }
        .status-details {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }
        .status-warning {
          font-size: 0.7rem;
          color: rgba(255, 193, 7, 0.9);
          margin-top: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 193, 7, 0.1);
          border-radius: 4px;
          border-left: 2px solid rgba(255, 193, 7, 0.6);
        }
        .status-actions button {
          background: rgba(0, 240, 255, 0.2);
          border: 1px solid rgba(0, 240, 255, 0.4);
          color: var(--color-primary);
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .status-actions button:hover {
          background: rgba(0, 240, 255, 0.3);
        }
        .p2p-download-progress {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(0, 240, 255, 0.05);
          border-radius: 6px;
          border: 1px solid rgba(0, 240, 255, 0.2);
        }
        .download-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .download-name {
          font-size: 0.7rem;
          color: rgba(0, 240, 255, 0.9);
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .download-percent {
          font-size: 0.75rem;
          font-weight: 600;
          color: #00fff9;
        }
        .progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.35rem;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00fff9, #00ff88);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .download-stats {
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .p2p-contribution {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(255, 215, 0, 0.05);
          border-radius: 6px;
          border: 1px solid rgba(255, 215, 0, 0.2);
        }
        .contribution-header {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.35rem;
        }
        .contribution-icon {
          font-size: 1rem;
        }
        .contribution-level {
          font-size: 0.75rem;
          font-weight: 600;
          color: #ffd700;
        }
        .contribution-stats {
          display: flex;
          justify-content: space-between;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-label {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .stat-value {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
        .panel-footer {
          padding: 0.75rem 1.5rem;
          border-top: 1px solid rgba(0, 240, 255, 0.2);
          text-align: center;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }
        @media (max-width: 640px) {
          .system-status-panel {
            width: 95%;
            max-width: 600px;
          }
          .status-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SystemStatusPanel;
