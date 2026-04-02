/**
 * =============================================================================
 * SettingsPanel 设置面板 - 游戏配置中心
 * =============================================================================
 */

import React, { useState, useCallback, memo } from 'react';

/* ==========================================================================
   类型定义
   ========================================================================== */

export interface GameSettings {
  // 性能
  performanceMode: 'apex' | 'extreme' | 'balanced' | 'eco';
  targetFPS: number;
  particleCount: number;
  resolutionScale: number;
  // 音频
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  muteOnBlur: boolean;
  // 视频
  showFPS: boolean;
  showEntropy: boolean;
  showMinimap: boolean;
  // 叙事
  narrativeSpeed: 'slow' | 'normal' | 'fast';
  showNarrative: boolean;
  // 语言
  language: 'zh' | 'en';
  // 辅助功能
  reduceMotion: boolean;
  highContrast: boolean;
}

interface SettingsPanelProps {
  settings: GameSettings;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
  onSave?: () => void;
  onReset?: () => void;
  className?: string;
}

/* ==========================================================================
   常量
   ========================================================================== */

const PERFORMANCE_MODES = [
  { id: 'apex', label: '神之领域', color: '#ffd700' },
  { id: 'extreme', label: '极致性能', color: '#ff0080' },
  { id: 'balanced', label: '均衡模式', color: '#00d4ff' },
  { id: 'eco', label: '节能模式', color: '#10b981' },
] as const;

const NARRATIVE_SPEEDS = [
  { id: 'slow', label: '慢' },
  { id: 'normal', label: '正常' },
  { id: 'fast', label: '快' },
] as const;

const LANGUAGES = [
  { id: 'zh', label: '简体中文' },
  { id: 'en', label: 'English' },
] as const;

/* ==========================================================================
   设置行组件
   ========================================================================== */

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingsRow: React.FC<SettingsRowProps> = memo(({ label, description, children }) => (
  <div className="settings-row">
    <div className="settings-label-group">
      <span className="settings-label">{label}</span>
      {description && <span className="settings-description">{description}</span>}
    </div>
    <div className="settings-control">{children}</div>
  </div>
));

SettingsRow.displayName = 'SettingsRow';

/* ==========================================================================
   开关组件
   ========================================================================== */

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = memo(({ checked, onChange, disabled }) => (
  <button
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    className={`toggle-switch ${checked ? 'on' : ''}`}
    onClick={() => onChange(!checked)}
  >
    <span className="toggle-thumb" />
  </button>
));

ToggleSwitch.displayName = 'ToggleSwitch';

/* ==========================================================================
   滑块组件
   ========================================================================== */

interface SliderControlProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const SliderControl: React.FC<SliderControlProps> = memo(
  ({ value, min, max, step = 1, onChange, formatValue }) => (
    <div className="slider-control">
      <input
        type="range"
        className="slider"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-value">{formatValue ? formatValue(value) : value}</span>
    </div>
  )
);

SliderControl.displayName = 'SliderControl';

/* ==========================================================================
   设置面板组件
   ========================================================================== */

export const SettingsPanel: React.FC<SettingsPanelProps> = memo(
  ({ settings, onSettingsChange, onSave, onReset, className = '' }) => {
    const [activeSection, setActiveSection] = useState<string>('performance');

    const sections = [
      { id: 'performance', icon: '⚡', label: '性能' },
      { id: 'audio', icon: '🔊', label: '音频' },
      { id: 'video', icon: '🎮', label: '显示' },
      { id: 'narrative', icon: '📖', label: '叙事' },
      { id: 'accessibility', icon: '♿', label: '辅助' },
    ];

    return (
      <div className={`settings-panel ${className}`}>
        {/* 侧边栏 */}
        <div className="settings-sidebar">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`settings-section-btn ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="section-icon">{section.icon}</span>
              <span className="section-label">{section.label}</span>
            </button>
          ))}
        </div>

        {/* 主内容 */}
        <div className="settings-main">
          {activeSection === 'performance' && (
            <div className="settings-section">
              <h3 className="section-title">性能设置</h3>
              <SettingsRow label="性能模式" description="选择游戏的运行模式">
                <div className="mode-selector">
                  {PERFORMANCE_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      className={`mode-option ${settings.performanceMode === mode.id ? 'active' : ''}`}
                      onClick={() => onSettingsChange({ performanceMode: mode.id as GameSettings['performanceMode'] })}
                      style={{ '--mode-color': mode.color } as React.CSSProperties}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </SettingsRow>
              <SettingsRow label="目标帧率" description={`当前: ${settings.targetFPS} FPS`}>
                <SliderControl
                  value={settings.targetFPS}
                  min={30}
                  max={240}
                  step={15}
                  onChange={(v) => onSettingsChange({ targetFPS: v })}
                />
              </SettingsRow>
              <SettingsRow label="粒子数量" description="场景中最大粒子数">
                <SliderControl
                  value={settings.particleCount}
                  min={1000}
                  max={100000}
                  step={1000}
                  onChange={(v) => onSettingsChange({ particleCount: v })}
                  formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                />
              </SettingsRow>
              <SettingsRow label="分辨率缩放" description="渲染分辨率与显示分辨率的比值">
                <SliderControl
                  value={settings.resolutionScale}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onChange={(v) => onSettingsChange({ resolutionScale: v })}
                  formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                />
              </SettingsRow>
            </div>
          )}

          {activeSection === 'audio' && (
            <div className="settings-section">
              <h3 className="section-title">音频设置</h3>
              <SettingsRow label="主音量">
                <SliderControl
                  value={settings.masterVolume}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => onSettingsChange({ masterVolume: v })}
                  formatValue={(v) => `${v}%`}
                />
              </SettingsRow>
              <SettingsRow label="背景音乐">
                <SliderControl
                  value={settings.bgmVolume}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => onSettingsChange({ bgmVolume: v })}
                  formatValue={(v) => `${v}%`}
                />
              </SettingsRow>
              <SettingsRow label="音效">
                <SliderControl
                  value={settings.sfxVolume}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => onSettingsChange({ sfxVolume: v })}
                  formatValue={(v) => `${v}%`}
                />
              </SettingsRow>
              <SettingsRow label="失焦静音" description="切换标签页时自动静音">
                <ToggleSwitch
                  checked={settings.muteOnBlur}
                  onChange={(v) => onSettingsChange({ muteOnBlur: v })}
                />
              </SettingsRow>
            </div>
          )}

          {activeSection === 'video' && (
            <div className="settings-section">
              <h3 className="section-title">显示设置</h3>
              <SettingsRow label="显示 FPS" description="在屏幕上显示实时帧率">
                <ToggleSwitch
                  checked={settings.showFPS}
                  onChange={(v) => onSettingsChange({ showFPS: v })}
                />
              </SettingsRow>
              <SettingsRow label="显示熵值" description="显示当前宇宙熵值">
                <ToggleSwitch
                  checked={settings.showEntropy}
                  onChange={(v) => onSettingsChange({ showEntropy: v })}
                />
              </SettingsRow>
              <SettingsRow label="显示小地图" description="显示上帝视角小地图">
                <ToggleSwitch
                  checked={settings.showMinimap}
                  onChange={(v) => onSettingsChange({ showMinimap: v })}
                />
              </SettingsRow>
            </div>
          )}

          {activeSection === 'narrative' && (
            <div className="settings-section">
              <h3 className="section-title">叙事设置</h3>
              <SettingsRow label="叙事速度" description="事件和成就的展示速度">
                <div className="speed-selector">
                  {NARRATIVE_SPEEDS.map((speed) => (
                    <button
                      key={speed.id}
                      className={`speed-option ${settings.narrativeSpeed === speed.id ? 'active' : ''}`}
                      onClick={() => onSettingsChange({ narrativeSpeed: speed.id as GameSettings['narrativeSpeed'] })}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </SettingsRow>
              <SettingsRow label="显示叙事" description="在屏幕上显示事件和成就">
                <ToggleSwitch
                  checked={settings.showNarrative}
                  onChange={(v) => onSettingsChange({ showNarrative: v })}
                />
              </SettingsRow>
              <SettingsRow label="语言" description="选择界面显示语言">
                <div className="language-selector">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      className={`language-option ${settings.language === lang.id ? 'active' : ''}`}
                      onClick={() => onSettingsChange({ language: lang.id as GameSettings['language'] })}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </SettingsRow>
            </div>
          )}

          {activeSection === 'accessibility' && (
            <div className="settings-section">
              <h3 className="section-title">辅助功能</h3>
              <SettingsRow label="减少动画" description="降低或禁用界面动画效果">
                <ToggleSwitch
                  checked={settings.reduceMotion}
                  onChange={(v) => onSettingsChange({ reduceMotion: v })}
                />
              </SettingsRow>
              <SettingsRow label="高对比度" description="增强界面元素对比度">
                <ToggleSwitch
                  checked={settings.highContrast}
                  onChange={(v) => onSettingsChange({ highContrast: v })}
                />
              </SettingsRow>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="settings-footer">
            <button className="btn btn-secondary" onClick={onReset}>
              重置默认
            </button>
            <button className="btn btn-primary" onClick={onSave}>
              保存设置
            </button>
          </div>
        </div>
      </div>
    );
  }
);

SettingsPanel.displayName = 'SettingsPanel';

/* ==========================================================================
   设置状态管理 Hook
   ========================================================================== */

export const defaultSettings: GameSettings = {
  performanceMode: 'balanced',
  targetFPS: 60,
  particleCount: 10000,
  resolutionScale: 1,
  masterVolume: 80,
  bgmVolume: 70,
  sfxVolume: 80,
  muteOnBlur: false,
  showFPS: true,
  showEntropy: true,
  showMinimap: true,
  narrativeSpeed: 'normal',
  showNarrative: true,
  language: 'zh',
  reduceMotion: false,
  highContrast: false,
};

export function useSettingsStore() {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  const updateSettings = useCallback((updates: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
