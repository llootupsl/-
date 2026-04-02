/**
 * 模式选择组件
 * 优化版：用户友好描述 + 设备性能检测 + 推荐模式
 */
import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { isLabFeatureEnabled } from '@/core/config/FeatureFlags';

export type AppPerformanceMode = 'apex' | 'extreme' | 'balanced' | 'eco';

export interface ModeConfig {
  id: AppPerformanceMode;
  nameCN: string;
  nameEN: string;
  desc: string;
  color: string;
  userFriendlyDesc: string;
  deviceRequirement: string;
  performanceLevel: string;
  visualEffect: string;
  recommended?: boolean;
}

export interface DevicePerformance {
  level: 'high' | 'medium' | 'low';
  score: number;
  cpuCores: number;
  memoryGB: number;
  hasWebGPU: boolean;
  hasWebGL: boolean;
  gpuVendor: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

export const MODES: ModeConfig[] = [
  {
    id: 'apex',
    nameCN: '神之领域',
    nameEN: 'APEX',
    desc: '超越物理极限，解锁宇宙法则',
    color: 'var(--color-mode-apex)',
    userFriendlyDesc: '适合顶级硬件设备',
    deviceRequirement: '需要高端显卡与充足内存',
    performanceLevel: '极致流畅',
    visualEffect: '全特效 + 光线追踪',
  },
  {
    id: 'extreme',
    nameCN: '极致性能',
    nameEN: 'EXTREME',
    desc: '压榨硬件潜能，追求极致体验',
    color: 'var(--color-mode-extreme)',
    userFriendlyDesc: '适合高性能设备',
    deviceRequirement: '推荐独立显卡',
    performanceLevel: '超流畅',
    visualEffect: '高级特效',
  },
  {
    id: 'balanced',
    nameCN: '均衡模式',
    nameEN: 'BALANCED',
    desc: '性能与体验的完美平衡',
    color: 'var(--color-mode-balanced)',
    userFriendlyDesc: '适合主流设备',
    deviceRequirement: '普通电脑即可运行',
    performanceLevel: '流畅',
    visualEffect: '标准特效',
    recommended: true,
  },
  {
    id: 'eco',
    nameCN: '节能模式',
    nameEN: 'ECO',
    desc: '降低资源占用，延长设备寿命',
    color: 'var(--color-mode-eco)',
    userFriendlyDesc: '适合低配设备或笔记本',
    deviceRequirement: '低功耗运行',
    performanceLevel: '省电优先',
    visualEffect: '基础特效',
  },
];

export interface ModeSelectProps {
  selectedMode: AppPerformanceMode;
  onSelect: (mode: AppPerformanceMode) => void;
  onStart: () => void;
  currentMode: ModeConfig;
}

function detectDevicePerformance(): DevicePerformance {
  const ua = navigator.userAgent;
  
  const cpuCores = navigator.hardwareConcurrency || 4;
  
  const memoryGB = navigator.deviceMemory 
    ? navigator.deviceMemory 
    : Math.round((performance as Performance & { memory?: { jsHeapSizeLimit: number } }).memory?.jsHeapSizeLimit / 1e9) || 8;

  const hasWebGPU = 'gpu' in navigator;

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  const hasWebGL = !!gl;

  let gpuVendor = 'Unknown';
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
    }
  }

  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/mobile|android|iphone/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  }

  let score = 0;
  score += Math.min(cpuCores * 10, 40);
  score += Math.min(memoryGB * 5, 30);
  if (hasWebGPU) score += 20;
  if (hasWebGL) score += 10;
  if (deviceType === 'desktop') score += 10;
  if (gpuVendor.toLowerCase().includes('nvidia') || 
      gpuVendor.toLowerCase().includes('amd') ||
      gpuVendor.toLowerCase().includes('radeon')) {
    score += 15;
  }

  let level: 'high' | 'medium' | 'low';
  if (score >= 80) {
    level = 'high';
  } else if (score >= 50) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    level,
    score,
    cpuCores,
    memoryGB,
    hasWebGPU,
    hasWebGL,
    gpuVendor,
    deviceType,
  };
}

function getRecommendedMode(performance: DevicePerformance): AppPerformanceMode {
  switch (performance.level) {
    case 'high':
      return 'extreme';
    case 'medium':
      return 'balanced';
    case 'low':
      return 'eco';
  }
}

const ModePreview: React.FC<{ mode: ModeConfig; isActive: boolean }> = ({ mode, isActive }) => {
  const particleCount = useMemo(() => {
    switch (mode.id) {
      case 'apex': return 50;
      case 'extreme': return 35;
      case 'balanced': return 20;
      case 'eco': return 10;
    }
  }, [mode.id]);

  return (
    <div className={`mode-preview ${isActive ? 'active' : ''}`}>
      <div className="preview-particles">
        {Array.from({ length: particleCount }).map((_, i) => (
          <div
            key={i}
            className="preview-particle"
            style={{
              '--delay': `${Math.random() * 3}s`,
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--size': `${2 + Math.random() * 4}px`,
              '--color': mode.color,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="preview-glow" style={{ background: mode.color }} />
    </div>
  );
};

const DeviceInfo: React.FC<{ performance: DevicePerformance }> = ({ performance }) => {
  const levelText = {
    high: '高性能',
    medium: '中等性能',
    low: '基础性能',
  };

  const levelColor = {
    high: 'var(--color-hope)',
    medium: 'var(--color-energy)',
    low: 'var(--color-unrest)',
  };

  return (
    <div className="device-info-panel">
      <div className="device-info-header">
        <span className="device-info-icon">⚡</span>
        <span className="device-info-title">设备性能检测</span>
      </div>
      <div className="device-info-content">
        <div className="device-info-row">
          <span className="device-info-label">性能等级</span>
          <span 
            className="device-info-value" 
            style={{ color: levelColor[performance.level] }}
          >
            {levelText[performance.level]}
          </span>
        </div>
        <div className="device-info-row">
          <span className="device-info-label">CPU 核心</span>
          <span className="device-info-value">{performance.cpuCores} 核</span>
        </div>
        <div className="device-info-row">
          <span className="device-info-label">内存</span>
          <span className="device-info-value">{performance.memoryGB} GB</span>
        </div>
        <div className="device-info-row">
          <span className="device-info-label">WebGPU</span>
          <span className="device-info-value">
            {performance.hasWebGPU ? '✓ 支持' : '✗ 不支持'}
          </span>
        </div>
      </div>
    </div>
  );
};

const RecommendedBadge: React.FC = () => (
  <div className="recommended-badge">
    <span className="recommended-icon">★</span>
    <span className="recommended-text">推荐</span>
  </div>
);

export const ModeSelect: React.FC<ModeSelectProps> = ({ selectedMode, onSelect, onStart, currentMode }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [devicePerformance, setDevicePerformance] = useState<DevicePerformance | null>(null);
  const [recommendedMode, setRecommendedMode] = useState<AppPerformanceMode>('balanced');
  const availableModes = useMemo(() => {
    const apexEnabled = isLabFeatureEnabled('extremeStress_4_8');
    return MODES.filter((mode) => {
      if (mode.id === 'apex') {
        return apexEnabled;
      }
      return true;
    });
  }, []);

  useEffect(() => {
    const performance = detectDevicePerformance();
    setDevicePerformance(performance);
    const autoRecommended = getRecommendedMode(performance);
    const recommended = availableModes.some((mode) => mode.id === autoRecommended)
      ? autoRecommended
      : 'balanced';
    setRecommendedMode(recommended);
    
    if (!sessionStorage.getItem('modeSelected')) {
      onSelect(recommended);
    }
  }, [availableModes, onSelect]);

  useEffect(() => {
    if (!availableModes.some((mode) => mode.id === selectedMode)) {
      onSelect('balanced');
    }
  }, [availableModes, onSelect, selectedMode]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, mode: AppPerformanceMode, index: number) => {
    let nextIndex = index;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % availableModes.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + availableModes.length) % availableModes.length;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(mode);
        return;
      default:
        return;
    }
    e.preventDefault();
    const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
    buttons?.[nextIndex]?.focus();
  }, [availableModes.length, onSelect]);

  const handleStart = useCallback(() => {
    sessionStorage.setItem('modeSelected', 'true');
    onStart();
  }, [onStart]);

  return (
    <div className="mode-select-screen">
      <header className="mode-select-header">
        <div>
          <div className="header-title">OMNIS APIEN</div>
          <p className="header-subtitle">选择你的性能模式</p>
        </div>
      </header>

      {devicePerformance && (
        <div className="recommendation-banner">
          <span className="recommendation-icon">💡</span>
          <span className="recommendation-text">
            根据您的设备性能，推荐选择 
            <strong style={{ color: availableModes.find(m => m.id === recommendedMode)?.color }}>
              {availableModes.find(m => m.id === recommendedMode)?.nameCN}
            </strong>
            模式
          </span>
        </div>
      )}

      <div ref={gridRef} className="mode-grid" role="listbox" aria-label="性能模式选择" aria-activedescendant={`mode-${selectedMode}`}>
        {availableModes.map((mode, index) => {
          const isRecommended = mode.id === recommendedMode;
          const isSelected = selectedMode === mode.id;
          
          return (
            <button
              key={mode.id}
              id={`mode-${mode.id}`}
              className={`mode-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
              onClick={() => onSelect(mode.id)}
              onKeyDown={(e) => handleKeyDown(e, mode.id, index)}
              role="option"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              style={{ '--mode-color': mode.color } as React.CSSProperties}
            >
              <ModePreview mode={mode} isActive={isSelected} />
              
              {isRecommended && <RecommendedBadge />}
              
              <div className="mode-card-inner">
                <div className="mode-name">{mode.nameCN}</div>
                <div className="mode-name-en">{mode.nameEN}</div>
                <div className="mode-desc">{mode.desc}</div>
                
                <div className="mode-user-info">
                  <div className="mode-info-item">
                    <span className="info-icon">📱</span>
                    <span className="info-text">{mode.userFriendlyDesc}</span>
                  </div>
                  <div className="mode-info-item">
                    <span className="info-icon">⚡</span>
                    <span className="info-text">{mode.performanceLevel}</span>
                  </div>
                  <div className="mode-info-item">
                    <span className="info-icon">✨</span>
                    <span className="info-text">{mode.visualEffect}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {devicePerformance && <DeviceInfo performance={devicePerformance} />}

      <button
        className="start-button"
        onClick={handleStart}
        style={{ '--btn-color': currentMode.color } as React.CSSProperties}
        aria-label={`进入永夜熵纪，当前选择${currentMode.nameCN}模式`}
      >
        <span>进入永夜熵纪</span>
        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" /></svg>
      </button>
    </div>
  );
};

export default ModeSelect;
