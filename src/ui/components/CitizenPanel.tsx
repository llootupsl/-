/**
 * =============================================================================
 * CitizenPanel 市民面板 - 熵增纪元的人口管理
 * =============================================================================
 */

import React, { useState, useCallback, memo, useMemo, useRef, useEffect, createContext, useContext } from 'react';
import { toast } from '../../stores/toastStore';

/* ==========================================================================
   类型定义
   ========================================================================== */

export interface Citizen {
  id: string;
  name: string;
  state: 'active' | 'background' | 'dormant';
  mood: number;
  energy: number;
  health: number;
  position: { x: number; y: number };
  birthTime: number;
  profession?: string;
  age?: number;
  relationships?: Array<{ targetId: string; type: string; strength: number }>;
  memories?: Array<{ event: string; timestamp: number; emotion: string; importance?: number }>;
  geneticInfluences?: {
    dominantTraits: string[];
    attributeBonuses: Array<{ name: string; value: number }>;
    behaviorProbabilities: Array<{ name: string; probability: number }>;
  };
  personalityTraits?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  snnDebug?: {
    firingRate: number;
    firingRateHistory: number[];
    neuronCount: number;
    lastSpikeCount: number;
    membranePotentials: number[];
  };
}

export interface CitizenPanelProps {
  citizens?: Citizen[];
  selectedCitizen?: Citizen;
  onCitizenClick?: (citizen: Citizen) => void;
  onCitizenSelect?: (citizen: Citizen) => void;
  onDivineIntervention?: (citizen: Citizen, action: string) => void;
  onTrackCitizen?: (citizen: Citizen) => void;
  maxVisible?: number;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

type DetailTab = 'basic' | 'attributes' | 'relationships' | 'memories' | 'network' | 'personality';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

/* ==========================================================================
   常量
   ========================================================================== */

const STATE_COLORS: Record<Citizen['state'], string> = {
  active: '#00ff88',
  background: '#ffaa00',
  dormant: '#666666',
};

const STATE_LABELS: Record<Citizen['state'], string> = {
  active: '活跃',
  background: '休眠',
  dormant: '死亡',
};

const HOVER_DELAY = 400;

/* ==========================================================================
   音效管理
   ========================================================================== */

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  private createBeep(frequency: number, duration: number, volume: number = 0.1) {
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
    }
  }

  playSelect() {
    this.createBeep(880, 0.08, 0.08);
    setTimeout(() => this.createBeep(1100, 0.06, 0.06), 50);
  }

  playHover() {
    this.createBeep(660, 0.04, 0.03);
  }

  playClick() {
    this.createBeep(550, 0.05, 0.05);
  }
}

const soundManager = new SoundManager();

/* ==========================================================================
   市民状态管理 Hook
   ========================================================================== */

export function useCitizenStore() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);

  const selectedCitizen = useMemo(
    () => citizens.find((c) => c.id === selectedCitizenId),
    [citizens, selectedCitizenId]
  );

  const addCitizen = useCallback((citizen: Omit<Citizen, 'id'>) => {
    const id = `citizen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setCitizens((prev) => [...prev, { ...citizen, id }]);
    return id;
  }, []);

  const removeCitizen = useCallback((id: string) => {
    setCitizens((prev) => prev.filter((c) => c.id !== id));
    if (selectedCitizenId === id) {
      setSelectedCitizenId(null);
    }
  }, [selectedCitizenId]);

  const updateCitizen = useCallback((id: string, updates: Partial<Citizen>) => {
    setCitizens((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const selectCitizen = useCallback((citizen: Citizen | null) => {
    setSelectedCitizenId(citizen?.id ?? null);
  }, []);

  const getCitizensByState = useCallback(
    (state: Citizen['state']) => citizens.filter((c) => c.state === state),
    [citizens]
  );

  return {
    citizens,
    selectedCitizen,
    setCitizens,
    addCitizen,
    removeCitizen,
    updateCitizen,
    selectCitizen,
    getCitizensByState,
  };
}

/* ==========================================================================
   悬停预览卡片组件
   ========================================================================== */

interface HoverPreviewProps {
  citizen: Citizen;
  position: { x: number; y: number };
  visible: boolean;
}

const HoverPreview: React.FC<HoverPreviewProps> = memo(({ citizen, position, visible }) => {
  if (!visible) return null;

  const moodEmoji = citizen.mood > 70 ? '😊' : citizen.mood > 40 ? '😐' : '😟';
  const age = citizen.age ?? Math.floor((Date.now() - citizen.birthTime) / (365 * 24 * 60 * 60 * 1000));

  return (
    <div
      className="citizen-hover-preview"
      style={{
        left: position.x + 15,
        top: position.y + 15,
      }}
    >
      <div className="hover-preview-header">
        <span className="hover-preview-face">{moodEmoji}</span>
        <div className="hover-preview-info">
          <div className="hover-preview-name">{citizen.name}</div>
          <div className="hover-preview-state" style={{ color: STATE_COLORS[citizen.state] }}>
            {STATE_LABELS[citizen.state]}
          </div>
        </div>
      </div>
      <div className="hover-preview-stats">
        <div className="hover-stat">
          <span className="hover-stat-label">心情</span>
          <span className="hover-stat-value">{citizen.mood}%</span>
        </div>
        <div className="hover-stat">
          <span className="hover-stat-label">能量</span>
          <span className="hover-stat-value">{citizen.energy}%</span>
        </div>
        <div className="hover-stat">
          <span className="hover-stat-label">健康</span>
          <span className="hover-stat-value">{citizen.health}%</span>
        </div>
      </div>
      {citizen.profession && (
        <div className="hover-preview-profession">
          职业: {citizen.profession}
        </div>
      )}
      <div className="hover-preview-hint">
        点击查看详情 · 右键快速操作
      </div>
    </div>
  );
});

/* ==========================================================================
   右键菜单组件
   ========================================================================== */

interface ContextMenuProps {
  citizen: Citizen;
  position: { x: number; y: number };
  visible: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = memo(({ citizen, position, visible, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;
      
      const key = e.key.toLowerCase();
      if (key === 'd') onAction('detail');
      else if (key === 'b') onAction('bless');
      else if (key === 'c') onAction('curse');
      else if (key === 'h') onAction('heal');
      else if (key === 't') onAction('track');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onAction]);

  if (!visible) return null;

  const actions: QuickAction[] = [
    { id: 'detail', label: '查看详情', icon: '📋', shortcut: 'D', action: () => onAction('detail') },
    { id: 'bless', label: '神力祝福', icon: '✨', shortcut: 'B', action: () => onAction('bless') },
    { id: 'heal', label: '治愈', icon: '💚', shortcut: 'H', action: () => onAction('heal') },
    { id: 'curse', label: '神力诅咒', icon: '💀', shortcut: 'C', action: () => onAction('curse') },
    { id: 'track', label: '追踪市民', icon: '🎯', shortcut: 'T', action: () => onAction('track') },
  ];

  return (
    <div
      ref={menuRef}
      className="citizen-context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="context-menu-header">
        <span className="context-menu-title">{citizen.name}</span>
        <span className="context-menu-subtitle">快速操作</span>
      </div>
      <div className="context-menu-actions">
        {actions.map((action) => (
          <button
            key={action.id}
            className="context-menu-item"
            onClick={() => {
              soundManager.playClick();
              action.action();
              onClose();
            }}
          >
            <span className="context-menu-icon">{action.icon}</span>
            <span className="context-menu-label">{action.label}</span>
            {action.shortcut && (
              <span className="context-menu-shortcut">{action.shortcut}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

/* ==========================================================================
   详情标签页组件
   ========================================================================== */

interface DetailTabsProps {
  citizen: Citizen;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}

const DetailTabs: React.FC<DetailTabsProps> = memo(({ citizen, activeTab, onTabChange }) => {
  const tabs: { id: DetailTab; label: string; icon: string }[] = [
    { id: 'basic', label: '基本信息', icon: '👤' },
    { id: 'attributes', label: '属性', icon: '📊' },
    { id: 'personality', label: '性格', icon: '🧠' },
    { id: 'relationships', label: '关系', icon: '🤝' },
    { id: 'network', label: '网络', icon: '🕸️' },
    { id: 'memories', label: '记忆', icon: '💭' },
  ];

  return (
    <div className="detail-tabs">
      <div className="detail-tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`detail-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              soundManager.playClick();
              onTabChange(tab.id);
            }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="detail-tabs-content">
        {activeTab === 'basic' && <BasicInfoTab citizen={citizen} />}
        {activeTab === 'attributes' && <AttributesTab citizen={citizen} />}
        {activeTab === 'personality' && <PersonalityTab citizen={citizen} />}
        {activeTab === 'relationships' && <RelationshipsTab citizen={citizen} />}
        {activeTab === 'network' && <RelationshipNetworkTab citizen={citizen} />}
        {activeTab === 'memories' && <MemoriesTab citizen={citizen} />}
      </div>
    </div>
  );
});

const BasicInfoTab: React.FC<{ citizen: Citizen }> = memo(({ citizen }) => {
  const age = citizen.age ?? Math.floor((Date.now() - citizen.birthTime) / (365 * 24 * 60 * 60 * 1000));

  return (
    <div className="detail-tab-content">
      <div className="info-row">
        <span className="info-label">ID</span>
        <span className="info-value mono">{citizen.id.slice(0, 12)}...</span>
      </div>
      <div className="info-row">
        <span className="info-label">年龄</span>
        <span className="info-value">{age} 岁</span>
      </div>
      <div className="info-row">
        <span className="info-label">职业</span>
        <span className="info-value">{citizen.profession || '无业'}</span>
      </div>
      <div className="info-row">
        <span className="info-label">状态</span>
        <span className="info-value" style={{ color: STATE_COLORS[citizen.state] }}>
          {STATE_LABELS[citizen.state]}
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">位置</span>
        <span className="info-value mono">({citizen.position.x.toFixed(0)}, {citizen.position.y.toFixed(0)})</span>
      </div>
      <div className="info-section">
        <div className="info-section-title">状态条</div>
        <div className="status-bars">
          <StatusBar label="心情" value={citizen.mood} color={citizen.mood > 70 ? '#00ff88' : citizen.mood > 30 ? '#ffaa00' : '#ff3333'} />
          <StatusBar label="能量" value={citizen.energy} color="#ffd700" />
          <StatusBar label="健康" value={citizen.health} color="#00aaff" />
        </div>
      </div>
    </div>
  );
});

const AttributesTab: React.FC<{ citizen: Citizen }> = memo(({ citizen }) => {
  const attributeNames: Record<string, string> = {
    intelligence: '智力',
    strength: '力量',
    agility: '敏捷',
    charisma: '魅力',
    constitution: '体质',
    health: '健康',
    creativity: '创造力',
    perception: '感知',
    learning: '学习',
    stability: '稳定',
    empathy: '共情',
    leadership: '领导',
    trust: '信任',
    energy: '能量',
    endurance: '耐力',
    lifespan: '寿命',
    curiosity: '好奇',
  };

  const behaviorNames: Record<string, string> = {
    work: '工作',
    rest: '休息',
    socialize: '社交',
    explore: '探索',
    migrate: '迁移',
    learn: '学习',
  };

  return (
    <div className="detail-tab-content">
      {citizen.geneticInfluences ? (
        <>
          <div className="info-section">
            <div className="info-section-title">🧬 显性基因特质</div>
            <div className="traits-grid">
              {citizen.geneticInfluences.dominantTraits.length > 0 ? (
                citizen.geneticInfluences.dominantTraits.map((trait, i) => (
                  <span key={i} className="trait-tag dominant">{trait}</span>
                ))
              ) : (
                <span className="trait-tag neutral">无显著特质</span>
              )}
            </div>
          </div>
          <div className="info-section">
            <div className="info-section-title">📊 基因属性加成</div>
            <div className="attributes-list">
              {citizen.geneticInfluences.attributeBonuses.map((bonus, i) => (
                <div key={i} className="attribute-row">
                  <span className="attribute-name">{attributeNames[bonus.name] || bonus.name}</span>
                  <span className={`attribute-value ${bonus.value >= 0 ? 'positive' : 'negative'}`}>
                    {bonus.value >= 0 ? '+' : ''}{(bonus.value * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="info-section">
            <div className="info-section-title">🎯 行为倾向</div>
            <div className="behaviors-list">
              {citizen.geneticInfluences.behaviorProbabilities.slice(0, 5).map((bp, i) => (
                <div key={i} className="behavior-row">
                  <span className="behavior-name">{behaviorNames[bp.name] || bp.name}</span>
                  <div className="behavior-bar">
                    <div className="behavior-fill" style={{ width: `${bp.probability * 100}%` }} />
                  </div>
                  <span className="behavior-value">{(bp.probability * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">暂无基因数据</div>
      )}
    </div>
  );
});

const RelationshipsTab: React.FC<{ citizen: Citizen }> = memo(({ citizen }) => {
  const relationshipTypes: Record<string, { label: string; icon: string; color: string }> = {
    family: { label: '家人', icon: '👨‍👩‍👧‍👦', color: '#ff6b9d' },
    friend: { label: '朋友', icon: '🤝', color: '#4ecdc4' },
    enemy: { label: '敌人', icon: '⚔️', color: '#ff4757' },
    lover: { label: '恋人', icon: '💕', color: '#ff69b4' },
    colleague: { label: '同事', icon: '💼', color: '#95a5a6' },
  };

  return (
    <div className="detail-tab-content">
      {citizen.relationships && citizen.relationships.length > 0 ? (
        <div className="relationships-list">
          {citizen.relationships.map((rel, i) => {
            const typeInfo = relationshipTypes[rel.type] || { label: rel.type, icon: '❓', color: '#888' };
            return (
              <div key={i} className="relationship-item">
                <span className="rel-icon">{typeInfo.icon}</span>
                <div className="rel-info">
                  <span className="rel-type" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
                  <span className="rel-strength">亲密度: {Math.round(rel.strength * 100)}%</span>
                </div>
                <div className="rel-bar">
                  <div className="rel-fill" style={{ width: `${rel.strength * 100}%`, backgroundColor: typeInfo.color }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">暂无关系数据</div>
      )}
    </div>
  );
});

const MemoriesTab: React.FC<{ citizen: Citizen }> = memo(({ citizen }) => {
  const emotionIcons: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fear: '😨',
    surprise: '😲',
    neutral: '😐',
    joy: '😄',
    love: '🥰',
    achievement: '🏆',
    discovery: '🔍',
    conflict: '⚔️',
  };

  const memoryCategories = useMemo(() => {
    if (!citizen.memories || citizen.memories.length === 0) return [];
    
    const categories: Record<string, { count: number; avgImportance: number }> = {};
    
    citizen.memories.forEach(memory => {
      const category = memory.event.split(' ')[0] || 'other';
      if (!categories[category]) {
        categories[category] = { count: 0, avgImportance: 0 };
      }
      categories[category].count++;
      categories[category].avgImportance += memory.importance || 0.5;
    });
    
    return Object.entries(categories).map(([name, data]) => ({
      name,
      count: data.count,
      avgImportance: data.avgImportance / data.count,
    }));
  }, [citizen.memories]);

  return (
    <div className="detail-tab-content">
      {citizen.memories && citizen.memories.length > 0 ? (
        <>
          <div className="memory-stats">
            <div className="memory-stat-item">
              <span className="memory-stat-label">总记忆</span>
              <span className="memory-stat-value">{citizen.memories.length}</span>
            </div>
            {memoryCategories.slice(0, 3).map((cat, i) => (
              <div key={i} className="memory-stat-item">
                <span className="memory-stat-label">{cat.name}</span>
                <span className="memory-stat-value">{cat.count}</span>
              </div>
            ))}
          </div>
          <div className="memories-list">
            {citizen.memories.slice(0, 10).map((memory, i) => (
              <div key={i} className="memory-item">
                <span className="memory-icon">{emotionIcons[memory.emotion] || '💭'}</span>
                <div className="memory-content">
                  <div className="memory-event">{memory.event}</div>
                  <div className="memory-meta">
                    <span className="memory-time">
                      {new Date(memory.timestamp).toLocaleString('zh-CN')}
                    </span>
                    {memory.importance && (
                      <span className="memory-importance">
                        重要度: {Math.round(memory.importance * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">💭</div>
          <div className="empty-text">暂无记忆数据</div>
          <div className="empty-hint">市民会随着时间积累各种经历和记忆</div>
        </div>
      )}
    </div>
  );
});

const StatusBar: React.FC<{ label: string; value: number; color: string }> = memo(({ label, value, color }) => (
  <div className="status-bar-item">
    <span className="status-bar-label">{label}</span>
    <div className="status-bar-track">
      <div className="status-bar-fill" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
    <span className="status-bar-value">{value}%</span>
  </div>
));

const PersonalityTab: React.FC<{ citizen: Citizen }> = memo(({ citizen }) => {
  const personalityTraits = citizen.personalityTraits;
  
  const bigFiveLabels: Record<string, string> = {
    openness: '开放性',
    conscientiousness: '尽责性',
    extraversion: '外向性',
    agreeableness: '宜人性',
    neuroticism: '神经质',
  };

  const bigFiveDescriptions: Record<string, Record<string, string>> = {
    openness: {
      very_low: '思想保守，偏好传统',
      low: '较为务实，对新事物持谨慎态度',
      moderate: '对新事物保持适度的好奇心',
      high: '富有想象力和创造力',
      very_high: '极具创造力，追求新奇',
    },
    conscientiousness: {
      very_low: '随性自由，不太注重计划',
      low: '较为灵活，有时缺乏条理',
      moderate: '做事有计划，但也能适应变化',
      high: '自律性强，做事有条理',
      very_high: '极度自律，追求完美',
    },
    extraversion: {
      very_low: '内向安静，喜欢独处',
      low: '较为内敛，社交活动有限',
      moderate: '能在社交和独处间保持平衡',
      high: '外向开朗，喜欢社交活动',
      very_high: '极度外向，充满活力',
    },
    agreeableness: {
      very_low: '竞争心强，较少考虑他人',
      low: '较为独立，有时显得冷漠',
      moderate: '能与他人合作，但也会坚持己见',
      high: '友善合作，富有同理心',
      very_high: '极度善良，总是优先考虑他人',
    },
    neuroticism: {
      very_low: '情绪非常稳定，极少焦虑',
      low: '情绪较为稳定，压力承受力强',
      moderate: '情绪波动适中，能应对日常压力',
      high: '容易焦虑和情绪波动',
      very_high: '情绪敏感，容易感到压力',
    },
  };

  const getTraitLevel = (value: number): string => {
    if (value < 0.2) return 'very_low';
    if (value < 0.4) return 'low';
    if (value < 0.6) return 'moderate';
    if (value < 0.8) return 'high';
    return 'very_high';
  };

  const getTraitColor = (value: number): string => {
    if (value < 0.3) return '#6B7280';
    if (value < 0.5) return '#1AEFFB';
    if (value < 0.7) return '#1BF5A0';
    return '#FFD600';
  };

  return (
    <div className="detail-tab-content">
      {personalityTraits ? (
        <>
          <div className="personality-traits-grid">
            {(Object.keys(personalityTraits) as Array<keyof typeof personalityTraits>).map((trait) => {
              const value = personalityTraits[trait as keyof typeof personalityTraits];
              const level = getTraitLevel(value);
              const description = bigFiveDescriptions[trait]?.[level] || '';
              
              return (
                <div key={trait} className="personality-trait-item">
                  <div className="trait-header">
                    <span className="trait-name">{bigFiveLabels[trait]}</span>
                    <span className="trait-value" style={{ color: getTraitColor(value) }}>
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                  <div className="trait-bar">
                    <div 
                      className="trait-fill" 
                      style={{ 
                        width: `${value * 100}%`,
                        backgroundColor: getTraitColor(value),
                      }} 
                    />
                  </div>
                  <div className="trait-description">{description}</div>
                </div>
              );
            })}
          </div>
          
          {citizen.geneticInfluences && (
            <div className="info-section">
              <div className="info-section-title">🧬 基因影响</div>
              <div className="genetic-influence-summary">
                {citizen.geneticInfluences.dominantTraits.slice(0, 3).map((trait, i) => (
                  <span key={i} className="trait-tag dominant">{trait}</span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🧠</div>
          <div className="empty-text">性格数据尚未生成</div>
          <div className="empty-hint">性格特质会在市民出生时根据基因组生成</div>
        </div>
      )}
    </div>
  );
});

const RelationshipNetworkTab: React.FC<{ citizen: Citizen }> = memo(({ citizen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  const relationshipTypes: Record<string, { label: string; color: string }> = {
    family: { label: '家人', color: '#ff6b9d' },
    friend: { label: '朋友', color: '#4ecdc4' },
    enemy: { label: '敌人', color: '#ff4757' },
    lover: { label: '恋人', color: '#ff69b4' },
    colleague: { label: '同事', color: '#95a5a6' },
  };

  useEffect(() => {
    if (!canvasRef.current || !citizen.relationships || citizen.relationships.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#1AEFFB';
    ctx.fill();
    ctx.strokeStyle = '#1AEFFB';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#D6F8FF';
    ctx.textAlign = 'center';
    ctx.fillText(citizen.name.slice(0, 4), centerX, centerY + 45);

    const relations = citizen.relationships || [];
    const angleStep = (Math.PI * 2) / Math.max(relations.length, 1);

    relations.forEach((rel, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const relColor = relationshipTypes[rel.type]?.color || '#888888';

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = relColor;
      ctx.lineWidth = rel.strength * 5;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = relColor;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = relColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#D6F8FF';
      ctx.font = '10px sans-serif';
      ctx.fillText(rel.targetId.slice(0, 4), x, y + 30);
    });
  }, [citizen.relationships, citizen.name]);

  const networkStats = useMemo(() => {
    if (!citizen.relationships || citizen.relationships.length === 0) {
      return { total: 0, avgStrength: 0, typeDistribution: {} };
    }

    const total = citizen.relationships.length;
    const avgStrength = citizen.relationships.reduce((sum, r) => sum + r.strength, 0) / total;
    const typeDistribution: Record<string, number> = {};
    
    citizen.relationships.forEach(r => {
      typeDistribution[r.type] = (typeDistribution[r.type] || 0) + 1;
    });

    return { total, avgStrength, typeDistribution };
  }, [citizen.relationships]);

  return (
    <div className="detail-tab-content">
      {citizen.relationships && citizen.relationships.length > 0 ? (
        <>
          <div className="network-stats">
            <div className="network-stat">
              <span className="network-stat-value">{networkStats.total}</span>
              <span className="network-stat-label">关系总数</span>
            </div>
            <div className="network-stat">
              <span className="network-stat-value">{Math.round(networkStats.avgStrength * 100)}%</span>
              <span className="network-stat-label">平均亲密度</span>
            </div>
          </div>
          
          <div className="network-canvas-container">
            <canvas 
              ref={canvasRef} 
              width={300} 
              height={300}
              className="relationship-network-canvas"
            />
          </div>

          <div className="network-legend">
            {Object.entries(relationshipTypes).map(([type, info]) => (
              <div key={type} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: info.color }} />
                <span className="legend-label">{info.label}</span>
                <span className="legend-count">{networkStats.typeDistribution[type] || 0}</span>
              </div>
            ))}
          </div>

          <div className="info-section">
            <div className="info-section-title">📋 关系列表</div>
            <div className="relationships-list">
              {citizen.relationships.map((rel, i) => (
                <div key={i} className="relationship-item">
                  <span className="rel-icon">
                    {relationshipTypes[rel.type] ? '🤝' : '❓'}
                  </span>
                  <div className="rel-info">
                    <span className="rel-type" style={{ color: relationshipTypes[rel.type]?.color }}>
                      {relationshipTypes[rel.type]?.label || rel.type}
                    </span>
                    <span className="rel-strength">亲密度: {Math.round(rel.strength * 100)}%</span>
                  </div>
                  <div className="rel-bar">
                    <div 
                      className="rel-fill" 
                      style={{ 
                        width: `${rel.strength * 100}%`,
                        backgroundColor: relationshipTypes[rel.type]?.color,
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🕸️</div>
          <div className="empty-text">暂无关系网络数据</div>
          <div className="empty-hint">市民会随着社交活动建立各种关系</div>
        </div>
      )}
    </div>
  );
});

/* ==========================================================================
   市民卡片组件
   ========================================================================== */

interface CitizenCardProps {
  citizen: Citizen;
  selected?: boolean;
  onClick?: () => void;
  onSelect?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onHover?: (hovering: boolean, position: { x: number; y: number }) => void;
}

const CitizenCard: React.FC<CitizenCardProps> = memo(({ 
  citizen, 
  selected, 
  onClick, 
  onSelect,
  onContextMenu,
  onHover,
}) => {
  const stateColor = STATE_COLORS[citizen.state];
  const moodColor = citizen.mood > 70 ? '#00ff88' : citizen.mood > 30 ? '#ffaa00' : '#ff3333';
  const [showGenetics, setShowGenetics] = useState(false);
  const [showSNNDebug, setShowSNNDebug] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [selectAnimating, setSelectAnimating] = useState(false);
  const prevSelectedRef = useRef(selected);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && !prevSelectedRef.current) {
      setSelectAnimating(true);
      setHighlight(true);
      soundManager.playSelect();
      setTimeout(() => {
        setHighlight(false);
        setSelectAnimating(false);
      }, 500);
    }
    prevSelectedRef.current = selected;
  }, [selected]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    hoverTimeoutRef.current = setTimeout(() => {
      soundManager.playHover();
      onHover?.(true, { x: e.clientX, y: e.clientY });
    }, HOVER_DELAY);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    onHover?.(false, { x: 0, y: 0 });
  }, [onHover]);

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    onSelect?.();
    toast.info(
      `市民已选中`,
      `${citizen.name} - ${STATE_LABELS[citizen.state]}`
    );
  }, [onSelect, citizen.name, citizen.state]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e);
  }, [onContextMenu]);

  const attributeNames: Record<string, string> = {
    intelligence: '智力',
    strength: '力量',
    agility: '敏捷',
    charisma: '魅力',
    constitution: '体质',
    health: '健康',
    creativity: '创造力',
    perception: '感知',
    learning: '学习',
    stability: '稳定',
    empathy: '共情',
    leadership: '领导',
    trust: '信任',
    energy: '能量',
    endurance: '耐力',
    lifespan: '寿命',
    curiosity: '好奇',
  };

  const behaviorNames: Record<string, string> = {
    work: '工作',
    rest: '休息',
    socialize: '社交',
    explore: '探索',
    migrate: '迁移',
    learn: '学习',
  };

  return (
    <div
      ref={cardRef}
      className={`citizen-card ${selected ? 'selected' : ''} ${highlight ? 'highlight-flash' : ''} ${selectAnimating ? 'select-animating' : ''}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
    >
      <div className="citizen-header">
        <div className="citizen-avatar">
          <span className="citizen-face">{getCitizenFace(citizen.mood)}</span>
        </div>
        <div className="citizen-info">
          <div className="citizen-name">{citizen.name}</div>
          <div className="citizen-state" style={{ color: stateColor }}>
            {STATE_LABELS[citizen.state]}
          </div>
        </div>
        <div className="citizen-actions">
          <button
            className="citizen-genetics-btn"
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClick();
              setShowGenetics(!showGenetics);
            }}
            aria-label="查看基因"
            title="查看基因影响"
          >
            🧬
          </button>
          <button
            className="citizen-snn-btn"
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClick();
              setShowSNNDebug(!showSNNDebug);
            }}
            aria-label="查看SNN"
            title="查看神经网络活动"
            style={{ opacity: citizen.snnDebug ? 1 : 0.3 }}
          >
            🧠
          </button>
          <button
            className={`citizen-select-btn ${selected ? 'selected' : ''} ${selectAnimating ? 'animating' : ''}`}
            onClick={handleSelect}
            aria-label="选中市民"
          >
            {selected ? '◉' : '○'}
          </button>
        </div>
      </div>
      <div className="citizen-stats">
        <div className="citizen-stat">
          <span className="stat-label">心情</span>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: `${citizen.mood}%`, backgroundColor: moodColor }} />
          </div>
        </div>
        <div className="citizen-stat">
          <span className="stat-label">能量</span>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: `${citizen.energy}%`, backgroundColor: '#ffd700' }} />
          </div>
        </div>
        <div className="citizen-stat">
          <span className="stat-label">健康</span>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: `${citizen.health}%`, backgroundColor: '#00aaff' }} />
          </div>
        </div>
      </div>
      
      {showGenetics && citizen.geneticInfluences && (
        <div className="citizen-genetics-panel">
          <div className="genetics-section">
            <div className="genetics-title">🧬 显性基因特质</div>
            <div className="genetics-traits">
              {citizen.geneticInfluences.dominantTraits.length > 0 ? (
                citizen.geneticInfluences.dominantTraits.map((trait, i) => (
                  <span key={i} className="trait-tag dominant">{trait}</span>
                ))
              ) : (
                <span className="trait-tag neutral">无显著特质</span>
              )}
            </div>
          </div>
          
          <div className="genetics-section">
            <div className="genetics-title">📊 基因属性加成</div>
            <div className="genetics-attributes">
              {citizen.geneticInfluences.attributeBonuses.map((bonus, i) => (
                <div key={i} className="attribute-bonus">
                  <span className="attribute-name">{attributeNames[bonus.name] || bonus.name}</span>
                  <span className={`attribute-value ${bonus.value >= 0 ? 'positive' : 'negative'}`}>
                    {bonus.value >= 0 ? '+' : ''}{(bonus.value * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="genetics-section">
            <div className="genetics-title">🎯 行为倾向</div>
            <div className="genetics-behaviors">
              {citizen.geneticInfluences.behaviorProbabilities.slice(0, 4).map((bp, i) => (
                <div key={i} className="behavior-prob">
                  <span className="behavior-name">{behaviorNames[bp.name] || bp.name}</span>
                  <div className="behavior-bar">
                    <div 
                      className="behavior-fill" 
                      style={{ width: `${bp.probability * 100}%` }}
                    />
                  </div>
                  <span className="behavior-value">{(bp.probability * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {showSNNDebug && citizen.snnDebug && (
        <div className="citizen-snn-panel">
          <div className="snn-section">
            <div className="snn-title">🧠 脉冲神经网络状态</div>
            <div className="snn-stats">
              <div className="snn-stat">
                <span className="snn-label">神经元数量</span>
                <span className="snn-value">{citizen.snnDebug.neuronCount}</span>
              </div>
              <div className="snn-stat">
                <span className="snn-label">平均发放率</span>
                <span className="snn-value">{(citizen.snnDebug.firingRate * 100).toFixed(1)}%</span>
              </div>
              <div className="snn-stat">
                <span className="snn-label">最近脉冲数</span>
                <span className="snn-value">{citizen.snnDebug.lastSpikeCount}</span>
              </div>
            </div>
          </div>
          
          <div className="snn-section">
            <div className="snn-title">📈 发放率历史</div>
            <div className="snn-history-chart">
              {citizen.snnDebug.firingRateHistory.map((rate, i) => (
                <div 
                  key={i} 
                  className="snn-history-bar"
                  style={{ 
                    height: `${Math.min(100, rate * 200)}%`,
                    backgroundColor: rate > 0.5 ? '#00ff88' : rate > 0.2 ? '#ffaa00' : '#ff5555'
                  }}
                  title={`发放率: ${(rate * 100).toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
          
          <div className="snn-section">
            <div className="snn-title">⚡ 膜电位分布</div>
            <div className="snn-potentials">
              {citizen.snnDebug.membranePotentials.map((potential, i) => (
                <div key={i} className="potential-bar">
                  <div 
                    className="potential-fill"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, potential * 100))}%`,
                      backgroundColor: potential > 0.8 ? '#ff5555' : potential > 0.5 ? '#ffaa00' : '#00aaff'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

function getCitizenFace(mood: number): string {
  if (mood > 80) return '😊';
  if (mood > 60) return '🙂';
  if (mood > 40) return '😐';
  if (mood > 20) return '😟';
  return '😢';
}

/* ==========================================================================
   市民详情面板
   ========================================================================== */

interface CitizenDetailPanelProps {
  citizen: Citizen;
  onClose: () => void;
  onDivineIntervention?: (action: string) => void;
  onTrack?: () => void;
}

const CitizenDetailPanel: React.FC<CitizenDetailPanelProps> = memo(({ 
  citizen, 
  onClose,
  onDivineIntervention,
  onTrack,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('basic');

  return (
    <div className="citizen-detail-panel">
      <div className="detail-panel-header">
        <div className="detail-panel-title-area">
          <span className="detail-panel-face">{getCitizenFace(citizen.mood)}</span>
          <div className="detail-panel-title-info">
            <h3 className="detail-panel-name">{citizen.name}</h3>
            <span className="detail-panel-state" style={{ color: STATE_COLORS[citizen.state] }}>
              {STATE_LABELS[citizen.state]}
            </span>
          </div>
        </div>
        <button className="detail-panel-close" onClick={onClose}>✕</button>
      </div>
      
      <DetailTabs citizen={citizen} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="detail-panel-actions">
        <button 
          className="detail-action-btn bless"
          onClick={() => onDivineIntervention?.('bless')}
        >
          ✨ 祝福
        </button>
        <button 
          className="detail-action-btn heal"
          onClick={() => onDivineIntervention?.('heal')}
        >
          💚 治愈
        </button>
        <button 
          className="detail-action-btn track"
          onClick={() => onTrack?.()}
        >
          🎯 追踪
        </button>
      </div>
    </div>
  );
});

/* ==========================================================================
   市民面板组件
   ========================================================================== */

export const CitizenPanel: React.FC<CitizenPanelProps> = memo(
  ({ 
    citizens = [], 
    selectedCitizen, 
    onCitizenClick, 
    onCitizenSelect,
    onDivineIntervention,
    onTrackCitizen,
    maxVisible = 50, 
    className = '', 
    isOpen, 
    onClose 
  }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [stateFilter, setStateFilter] = useState<Citizen['state'] | 'all'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'mood' | 'state'>('state');
    const [hoverPreview, setHoverPreview] = useState<{
      citizen: Citizen;
      position: { x: number; y: number };
      visible: boolean;
    } | null>(null);
    const [contextMenu, setContextMenu] = useState<{
      citizen: Citizen;
      position: { x: number; y: number };
      visible: boolean;
    } | null>(null);
    const [detailPanel, setDetailPanel] = useState<Citizen | null>(null);
    const [trackedCitizen, setTrackedCitizen] = useState<Citizen | null>(null);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (contextMenu?.visible) {
            setContextMenu(null);
          } else if (detailPanel) {
            setDetailPanel(null);
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [contextMenu, detailPanel]);

    const handleCitizenHover = useCallback((citizen: Citizen) => (hovering: boolean, position: { x: number; y: number }) => {
      if (hovering) {
        setHoverPreview({ citizen, position, visible: true });
      } else {
        setHoverPreview(null);
      }
    }, []);

    const handleContextMenu = useCallback((citizen: Citizen) => (e: React.MouseEvent) => {
      setContextMenu({
        citizen,
        position: { x: e.clientX, y: e.clientY },
        visible: true,
      });
    }, []);

    const handleContextAction = useCallback((action: string) => {
      if (!contextMenu?.citizen) return;

      switch (action) {
        case 'detail':
          setDetailPanel(contextMenu.citizen);
          break;
        case 'bless':
        case 'curse':
        case 'heal':
          onDivineIntervention?.(contextMenu.citizen, action);
          toast.success('神力干预', `对 ${contextMenu.citizen.name} 施展了 ${action === 'bless' ? '祝福' : action === 'curse' ? '诅咒' : '治愈'}`);
          break;
        case 'track':
          setTrackedCitizen(contextMenu.citizen);
          onTrackCitizen?.(contextMenu.citizen);
          toast.info('追踪市民', `正在追踪 ${contextMenu.citizen.name}`);
          break;
      }
    }, [contextMenu, onDivineIntervention, onTrackCitizen]);

    if (!isOpen) return null;

    const filteredCitizens = citizens
      .filter((c) => {
        if (stateFilter !== 'all' && c.state !== stateFilter) return false;
        if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'mood':
            return b.mood - a.mood;
          case 'state':
            const stateOrder = { active: 0, background: 1, dormant: 2 };
            return stateOrder[a.state] - stateOrder[b.state];
          default:
            return a.name.localeCompare(b.name);
        }
      })
      .slice(0, maxVisible);

    const stats = {
      total: citizens.length,
      active: citizens.filter((c) => c.state === 'active').length,
      background: citizens.filter((c) => c.state === 'background').length,
      dormant: citizens.filter((c) => c.state === 'dormant').length,
    };

    return (
      <div className={`citizen-panel ${className}`}>
        {onClose && (
          <button className="panel-close-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        )}
        <div className="citizen-overview">
          <div className="overview-stat">
            <span className="overview-value">{stats.total}</span>
            <span className="overview-label">总计</span>
          </div>
          <div className="overview-stat">
            <span className="overview-value" style={{ color: STATE_COLORS.active }}>{stats.active}</span>
            <span className="overview-label">活跃</span>
          </div>
          <div className="overview-stat">
            <span className="overview-value" style={{ color: STATE_COLORS.background }}>{stats.background}</span>
            <span className="overview-label">休眠</span>
          </div>
        </div>

        <div className="citizen-controls">
          <input
            type="text"
            className="input citizen-search"
            placeholder="搜索市民..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="citizen-filters">
            <button
              className={`filter-btn ${stateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStateFilter('all')}
            >
              全部
            </button>
            {(['active', 'background', 'dormant'] as Citizen['state'][]).map((state) => (
              <button
                key={state}
                className={`filter-btn ${stateFilter === state ? 'active' : ''}`}
                onClick={() => setStateFilter(state)}
                style={{ '--filter-color': STATE_COLORS[state] } as React.CSSProperties}
              >
                {STATE_LABELS[state]}
              </button>
            ))}
          </div>
        </div>

        {trackedCitizen && (
          <div className="tracked-citizen-bar">
            <span className="tracked-label">🎯 追踪中:</span>
            <span className="tracked-name">{trackedCitizen.name}</span>
            <button 
              className="tracked-close"
              onClick={() => setTrackedCitizen(null)}
            >
              ✕
            </button>
          </div>
        )}

        <div className="citizen-list">
          {filteredCitizens.length === 0 ? (
            <div className="citizen-empty">暂无市民</div>
          ) : (
            filteredCitizens.map((citizen) => (
              <CitizenCard
                key={citizen.id}
                citizen={citizen}
                selected={selectedCitizen?.id === citizen.id}
                onClick={() => onCitizenClick?.(citizen)}
                onSelect={() => onCitizenSelect?.(citizen)}
                onContextMenu={handleContextMenu(citizen)}
                onHover={handleCitizenHover(citizen)}
              />
            ))
          )}
        </div>

        {hoverPreview && (
          <HoverPreview
            citizen={hoverPreview.citizen}
            position={hoverPreview.position}
            visible={hoverPreview.visible}
          />
        )}

        {contextMenu && (
          <ContextMenu
            citizen={contextMenu.citizen}
            position={contextMenu.position}
            visible={contextMenu.visible}
            onClose={() => setContextMenu(null)}
            onAction={handleContextAction}
          />
        )}

        {detailPanel && (
          <div className="detail-panel-overlay" onClick={() => setDetailPanel(null)}>
            <CitizenDetailPanel
              citizen={detailPanel}
              onClose={() => setDetailPanel(null)}
              onDivineIntervention={(action) => {
                onDivineIntervention?.(detailPanel, action);
              }}
              onTrack={() => {
                setTrackedCitizen(detailPanel);
                onTrackCitizen?.(detailPanel);
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

CitizenPanel.displayName = 'CitizenPanel';
