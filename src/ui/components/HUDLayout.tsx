/**
 * =============================================================================
 * 熵增纪元 HUD - 统一游戏界面控制中心
 * 整合资源、叙事、市民、神力、设置等所有面板
 * =============================================================================
 */

import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { ResourcePanel, Resource, useResources } from './ResourcePanel';
import { NarrativePanel, NarrativeEntry, NarrativeType, useNarrative } from './NarrativePanel';
import { CitizenPanel, Citizen, useCitizenStore } from './CitizenPanel';
import { DivinePanel, DivinePower, DivinePowerTier, DivinePowerType, useDivineStore } from './DivinePanel';
import { SettingsPanel, GameSettings, defaultSettings, useSettingsStore } from './SettingsPanel';
import { EpochPanel, EpochInfo, EpochType, useEpochStore } from './EpochPanel';
import { AIConfigPanel, AIConfig, useAIConfigStore } from './AIConfigPanel';
import { MiniMap, MapMarker, useMapMarkers } from './MiniMap';
import { Tabs, Tab } from './Tabs';
import { Modal } from './Modal';
import { toast } from './ToastContainer';
import './HUDLayout.css';

/* ==========================================================================
   面板标识
   ========================================================================== */

export type PanelType = 'resources' | 'narrative' | 'citizens' | 'divine' | 'settings' | 'ai' | 'epoch';

export interface HUDLayoutProps {
  className?: string;
  onPanelChange?: (panel: PanelType | null) => void;
  onSettingsSave?: (settings: GameSettings) => void;
  onAISave?: (config: AIConfig) => void;
}

/* ==========================================================================
   HUD 布局组件
   ========================================================================== */

export const HUDLayout: React.FC<HUDLayoutProps> = memo(({
  className = '',
  onPanelChange,
  onSettingsSave,
  onAISave,
}) => {
  // 面板状态
  const [activePanel, setActivePanel] = useState<PanelType | null>('resources');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 资源系统
  const {
    resources,
    updateResources,
    setResource,
    setResourceRate,
    addResource,
    consumeResource,
  } = useResources();

  // 叙事系统
  const {
    entries,
    addNarrative,
    clearNarratives,
    addSystemNarrative,
    addEventNarrative,
    addAchievementNarrative,
    addDivineNarrative,
  } = useNarrative();

  // 市民系统
  const {
    citizens,
    selectedCitizen,
    selectCitizen,
    addCitizen,
    removeCitizen,
    updateCitizen,
  } = useCitizenStore();

  // 神力系统
  const {
    powers,
    divineEnergy,
    usePower: triggerPower,
    unlockPower,
  } = useDivineStore();

  // 设置系统
  const {
    settings,
    updateSettings,
    resetSettings,
  } = useSettingsStore();

  // AI 配置系统
  const {
    config: aiConfig,
    updateConfig,
  } = useAIConfigStore();

  // 纪元系统
  const {
    epoch,
    entropyHistory,
    updateEntropy,
    setEpochType,
  } = useEpochStore();

  // 地图标记
  const { markers } = useMapMarkers();

  // 面板切换
  const handlePanelChange = useCallback((panel: PanelType | null) => {
    setActivePanel(panel);
    onPanelChange?.(panel);
  }, [onPanelChange]);

  // 切换侧边栏
  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // 叙事过滤
  const [narrativeFilter, setNarrativeFilter] = useState<NarrativeType | 'all'>('all');

  const filteredNarratives = useMemo(() => {
    if (narrativeFilter === 'all') return entries;
    return entries.filter((e) => e.type === narrativeFilter);
  }, [entries, narrativeFilter]);

  // 资源点击处理
  const handleResourceClick = useCallback((resource: Resource) => {
    toast.info(`资源: ${resource.name}`, `当前: ${resource.current.toFixed(0)} / ${resource.max}`);
  }, []);

  // 叙事点击处理
  const handleNarrativeClick = useCallback((entry: NarrativeEntry) => {
    toast.info(entry.title, entry.content);
  }, []);

  // 市民点击处理
  const handleCitizenClick = useCallback((citizen: Citizen) => {
    toast.info(citizen.name, `状态: ${citizen.state} | 心情: ${citizen.mood.toFixed(0)}%`);
  }, []);

  // 神力使用处理
  const handlePowerUse = useCallback((power: DivinePower) => {
    if (divineEnergy < power.cost) {
      toast.warning('神力不足', `需要 ${power.cost} 点神力`);
      return;
    }

    triggerPower(power.id);
    addDivineNarrative(power.name, `使用了神力: ${power.description}`);
    toast.success('神力释放', power.name);
  }, [divineEnergy, triggerPower, addDivineNarrative]);

  // 设置保存处理
  const handleSettingsSave = useCallback(() => {
    onSettingsSave?.(settings);
    toast.success('设置已保存', '游戏设置已更新');
  }, [settings, onSettingsSave]);

  // AI 配置保存处理
  const handleAISave = useCallback(() => {
    onAISave?.(aiConfig);
    toast.success('AI 配置已保存', `使用 ${aiConfig.provider} 的 ${aiConfig.model}`);
  }, [aiConfig, onAISave]);

  // 设置弹窗状态
  const [showSettings, setShowSettings] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // 面板按钮
  const panelButtons = [
    { key: 'resources' as PanelType, icon: '📦', label: '资源', color: 'var(--color-core-energy)' },
    { key: 'narrative' as PanelType, icon: '📜', label: '日志', color: 'var(--color-accent)' },
    { key: 'citizens' as PanelType, icon: '👥', label: '市民', color: 'var(--color-biomass)' },
    { key: 'divine' as PanelType, icon: '✨', label: '神力', color: 'var(--color-quantum)' },
    { key: 'epoch' as PanelType, icon: '🌀', label: '纪元', color: 'var(--color-chaos)' },
  ];

  return (
    <div className={`hud-layout ${sidebarCollapsed ? 'collapsed' : ''} ${className}`}>
      {/* 侧边栏 */}
      <div className="hud-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-text">OMNIS</span>
            <span className="logo-sub">APIEN</span>
          </div>
        </div>

        <div className="sidebar-panels">
          {panelButtons.map((btn) => (
            <button
              key={btn.key}
              className={`panel-btn ${activePanel === btn.key ? 'active' : ''}`}
              onClick={() => handlePanelChange(activePanel === btn.key ? null : btn.key)}
              style={{ '--btn-accent': btn.color } as React.CSSProperties}
              title={btn.label}
            >
              <span className="panel-icon">{btn.icon}</span>
              {!sidebarCollapsed && <span className="panel-label">{btn.label}</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-actions">
          <button
            className="action-btn"
            onClick={() => setShowAI(true)}
            title="AI 配置"
          >
            🤖
          </button>
          <button
            className="action-btn"
            onClick={() => setShowSettings(true)}
            title="设置"
          >
            ⚙️
          </button>
          <button
            className="action-btn collapse-btn"
            onClick={handleToggleSidebar}
            title={sidebarCollapsed ? '展开' : '收起'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* 主面板区域 */}
      <div className="hud-main-area">
        {/* 资源面板 */}
        {activePanel === 'resources' && (
          <div className="panel-container">
            <div className="panel-header">
              <h2>资源系统</h2>
              <span className="panel-subtitle">核心能源与配额管理</span>
            </div>
            <div className="panel-content">
              <ResourcePanel
                resources={resources}
                onResourceClick={handleResourceClick}
              />
            </div>
          </div>
        )}

        {/* 叙事面板 */}
        {activePanel === 'narrative' && (
          <div className="panel-container">
            <div className="panel-header">
              <h2>叙事日志</h2>
              <span className="panel-subtitle">时代演进与事件记录</span>
            </div>
            <div className="panel-content">
              <NarrativePanel
                entries={filteredNarratives}
                onEntryClick={handleNarrativeClick}
                onClear={clearNarratives}
              />
            </div>
          </div>
        )}

        {/* 市民面板 */}
        {activePanel === 'citizens' && (
          <div className="panel-container">
            <div className="panel-header">
              <h2>市民管理</h2>
              <span className="panel-subtitle">人口状态与社会关系</span>
            </div>
            <div className="panel-content">
              <CitizenPanel
                citizens={citizens}
                selectedCitizen={selectedCitizen}
                onCitizenClick={handleCitizenClick}
                onCitizenSelect={selectCitizen}
              />
            </div>
          </div>
        )}

        {/* 神力面板 */}
        {activePanel === 'divine' && (
          <div className="panel-container">
            <div className="panel-header">
              <h2>神力系统</h2>
              <span className="panel-subtitle">干预宇宙的神圣力量</span>
            </div>
            <div className="panel-content">
              <DivinePanel
                powers={powers}
                divineEnergy={divineEnergy}
                onPowerUse={handlePowerUse}
              />
            </div>
          </div>
        )}

        {/* 纪元面板 */}
        {activePanel === 'epoch' && (
          <div className="panel-container">
            <div className="panel-header">
              <h2>时代演进</h2>
              <span className="panel-subtitle">熵增纪元的时代变迁</span>
            </div>
            <div className="panel-content">
              <EpochPanel
                epoch={epoch}
                entropyHistory={entropyHistory}
              />
            </div>
          </div>
        )}
      </div>

      {/* 小地图 */}
      <div className="hud-minimap-area">
        <MiniMap
          width={160}
          height={120}
          markers={markers}
          showViewRect
          showGrid
        />
      </div>

      {/* 设置弹窗 */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="游戏设置"
        size="lg"
      >
        <SettingsPanel
          settings={settings}
          onSettingsChange={updateSettings}
          onSave={handleSettingsSave}
          onReset={resetSettings}
        />
      </Modal>

      {/* AI 配置弹窗 */}
      <Modal
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        title="AI 配置"
        size="lg"
      >
        <AIConfigPanel
          config={aiConfig}
          onConfigChange={updateConfig}
          onSave={handleAISave}
        />
      </Modal>
    </div>
  );
});

HUDLayout.displayName = 'HUDLayout';

/* ==========================================================================
   Hooks 整合
   ========================================================================== */

export function useGameHUD() {
  // 资源
  const resourcesHook = useResources();
  // 叙事
  const narrativesHook = useNarrative();
  // 市民
  const citizensHook = useCitizenStore();
  // 神力
  const divineHook = useDivineStore();
  // 设置
  const settingsHook = useSettingsStore();
  // AI
  const aiHook = useAIConfigStore();
  // 纪元
  const epochHook = useEpochStore();
  // 地图
  const mapHook = useMapMarkers();

  return {
    resources: resourcesHook.resources,
    updateResources: resourcesHook.updateResources,
    narratives: narrativesHook.entries,
    addNarrative: narrativesHook.addNarrative,
    citizens: citizensHook.citizens,
    divinePowers: divineHook.powers,
    divineEnergy: divineHook.divineEnergy,
    settings: settingsHook.settings,
    aiConfig: aiHook.config,
    epoch: epochHook.epoch,
    entropyHistory: epochHook.entropyHistory,
    markers: mapHook.markers,
  };
}
