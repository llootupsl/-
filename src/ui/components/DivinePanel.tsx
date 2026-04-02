/**
 * =============================================================================
 * DivinePanel 神力面板 - 干预宇宙的命运
 * =============================================================================
 */

import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { toast } from '../../stores/toastStore';

/* ==========================================================================
   类型定义
   ========================================================================== */

export type DivinePowerType = 'create' | 'destroy' | 'transform' | 'bless' | 'curse' | 'reveal' | 'time' | 'entropy';
export type DivinePowerTier = 'minor' | 'major' | 'divine' | 'cosmic' | 'transcendent';

export interface DivinePower {
  id: string;
  type: DivinePowerType;
  tier: DivinePowerTier;
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  lastUsed?: number;
  unlocked: boolean;
}

export interface DivinePanelProps {
  powers?: DivinePower[];
  divineEnergy?: number;
  onPowerUse?: (power: DivinePower) => void;
  onPowerUnlock?: (powerId: string) => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

/* ==========================================================================
   常量
   ========================================================================== */

const TIER_CONFIG: Record<DivinePowerTier, { color: string; label: string; costMultiplier: number }> = {
  minor: { color: '#888', label: '微弱', costMultiplier: 1 },
  major: { color: '#00aaff', label: '强大', costMultiplier: 5 },
  divine: { color: '#aa00ff', label: '神级', costMultiplier: 20 },
  cosmic: { color: '#ffd700', label: '宇宙', costMultiplier: 100 },
  transcendent: { color: '#ffffff', label: '超越', costMultiplier: 500 },
};

const TYPE_ICONS: Record<DivinePowerType, string> = {
  create: '✨',
  destroy: '💥',
  transform: '🔮',
  bless: '🙏',
  curse: '💀',
  reveal: '👁️',
  time: '⏳',
  entropy: '🌀',
};

const TYPE_NAMES: Record<DivinePowerType, string> = {
  create: '创世',
  destroy: '毁灭',
  transform: '转化',
  bless: '祝福',
  curse: '诅咒',
  reveal: '洞察',
  time: '时间',
  entropy: '熵增',
};

/* ==========================================================================
   神力卡片组件
   ========================================================================== */

interface DivinePowerCardProps {
  power: DivinePower;
  energy: number;
  onUse: () => void;
}

const DivinePowerCard: React.FC<DivinePowerCardProps> = memo(({ power, energy, onUse }) => {
  const tierConfig = TIER_CONFIG[power.tier];
  const canUse = energy >= power.cost && (!power.lastUsed || Date.now() - power.lastUsed >= power.cooldown * 1000);
  const cooldownRemaining = power.lastUsed
    ? Math.max(0, power.cooldown - (Date.now() - power.lastUsed) / 1000)
    : 0;
  const isOnCooldown = cooldownRemaining > 0;
  const [isActivating, setIsActivating] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  const handleUse = useCallback(() => {
    if (!canUse || !power.unlocked || isActivating) return;
    
    setIsActivating(true);
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: particleIdRef.current++,
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
      }));
      setParticles(newParticles);
    }
    
    setTimeout(() => {
      onUse();
      setIsActivating(false);
      setParticles([]);
      
      toast.success(
        `神力激活: ${power.name}`,
        `${tierConfig.label}级神力已成功释放`
      );
    }, 400);
  }, [canUse, power.unlocked, isActivating, onUse, power.name, tierConfig.label]);

  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => setParticles([]), 600);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  return (
    <div
      ref={cardRef}
      className={`divine-power-card ${!power.unlocked ? 'locked' : ''} ${!canUse ? 'disabled' : ''} ${isActivating ? 'divine-effect-active' : ''}`}
      onClick={canUse && power.unlocked && !isActivating ? handleUse : undefined}
      role="button"
      tabIndex={canUse && power.unlocked ? 0 : -1}
      aria-disabled={!canUse || !power.unlocked}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="divine-particle-burst"
          style={{
            left: p.x,
            top: p.y,
            background: tierConfig.color,
          }}
        />
      ))}
      <div className="power-header">
        <span className="power-icon">{TYPE_ICONS[power.type]}</span>
        <span className="power-name">{power.name}</span>
        <span className="power-tier" style={{ color: tierConfig.color }}>
          {tierConfig.label}
        </span>
      </div>
      <div className="power-description">{power.description}</div>
      <div className="power-footer">
        <div className="power-cost">
          <span className="cost-icon">⚡</span>
          <span className="cost-value" style={{ color: energy >= power.cost ? tierConfig.color : '#ff3333' }}>
            {power.cost}
          </span>
        </div>
        {isOnCooldown ? (
          <div className="power-cooldown">
            <span className="cooldown-label">冷却</span>
            <span className="cooldown-value">{Math.ceil(cooldownRemaining)}s</span>
          </div>
        ) : power.unlocked ? (
          <div className="power-ready">就绪</div>
        ) : (
          <div className="power-locked">未解锁</div>
        )}
      </div>
      {!power.unlocked && (
        <div className="power-lock-overlay">
          <span>🔒</span>
        </div>
      )}
    </div>
  );
});

DivinePowerCard.displayName = 'DivinePowerCard';

/* ==========================================================================
   神力面板组件
   ========================================================================== */

export const DivinePanel: React.FC<DivinePanelProps> = memo(
  ({ powers = [], divineEnergy = 50, onPowerUse, onPowerUnlock, className = '', isOpen, onClose }) => {
    const [filter, setFilter] = useState<DivinePowerTier | 'all'>('all');
    const [expandedPower, setExpandedPower] = useState<string | null>(null);

    // V5修复：如果 isOpen 为 false，不渲染
    if (isOpen === false) return null;

    const filteredPowers = filter === 'all'
      ? powers
      : powers.filter((p) => p.tier === filter);

    const unlockedCount = powers.filter((p) => p.unlocked).length;
    const totalCount = powers.length;

    return (
      <div className={`divine-panel ${className}`}>
        {/* V5修复：添加关闭按钮 */}
        {onClose && (
          <button className="panel-close-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        )}
        {/* 神力能量条 */}
        <div className="divine-energy-bar">
          <div className="energy-label">
            <span className="energy-icon">⚡</span>
            <span>神力能量</span>
          </div>
          <div className="energy-track">
            <div
              className="energy-fill"
              style={{ width: `${(divineEnergy / 100) * 100}%` }}
            />
          </div>
          <div className="energy-value">{Math.floor(divineEnergy)} / 100</div>
        </div>

        {/* 解锁进度 */}
        <div className="divine-progress">
          <span className="progress-label">解锁进度</span>
          <span className="progress-value">
            {unlockedCount} / {totalCount}
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* 过滤器 */}
        <div className="divine-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          {(['minor', 'major', 'divine', 'cosmic', 'transcendent'] as DivinePowerTier[]).map((tier) => {
            const config = TIER_CONFIG[tier];
            return (
              <button
                key={tier}
                className={`filter-btn ${filter === tier ? 'active' : ''}`}
                onClick={() => setFilter(tier)}
                style={{ '--filter-color': config.color } as React.CSSProperties}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* 神力列表 */}
        <div className="divine-powers">
          {filteredPowers.map((power) => (
            <div key={power.id}>
              <DivinePowerCard
                power={power}
                energy={divineEnergy}
                onUse={() => onPowerUse?.(power)}
              />
              {expandedPower === power.id && (
                <div className="power-details">
                  <div className="detail-row">
                    <span className="detail-label">类型</span>
                    <span className="detail-value">{TYPE_NAMES[power.type]}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">等级</span>
                    <span className="detail-value" style={{ color: TIER_CONFIG[power.tier].color }}>
                      {TIER_CONFIG[power.tier].label}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">消耗</span>
                    <span className="detail-value">{power.cost} 神力</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">冷却</span>
                    <span className="detail-value">{power.cooldown}s</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

DivinePanel.displayName = 'DivinePanel';

/* ==========================================================================
   神力状态管理 Hook
   ========================================================================== */

const DEFAULT_POWERS: DivinePower[] = [
  { id: 'power-1', type: 'create', tier: 'minor', name: '微光创造', description: '创造少量基础资源', cost: 10, cooldown: 30, unlocked: true },
  { id: 'power-2', type: 'bless', tier: 'minor', name: '生命祝福', description: '小幅提升市民心情', cost: 15, cooldown: 60, unlocked: true },
  { id: 'power-3', type: 'entropy', tier: 'major', name: '熵流引导', description: '减缓熵增速度', cost: 30, cooldown: 120, unlocked: false },
  { id: 'power-4', type: 'destroy', tier: 'major', name: '天灾降临', description: '引发一场小规模灾难', cost: 50, cooldown: 300, unlocked: false },
  { id: 'power-5', type: 'transform', tier: 'divine', name: '形态转化', description: '改变特定区域的地形', cost: 100, cooldown: 600, unlocked: false },
  { id: 'power-6', type: 'reveal', tier: 'divine', name: '全知之眼', description: '揭示隐藏的信息和秘密', cost: 80, cooldown: 480, unlocked: false },
  { id: 'power-7', type: 'time', tier: 'cosmic', name: '时间回溯', description: '将区域时间倒退一定量', cost: 200, cooldown: 1200, unlocked: false },
  { id: 'power-8', type: 'entropy', tier: 'transcendent', name: '宇宙重启', description: '完全重置宇宙到初始状态', cost: 500, cooldown: 3600, unlocked: false },
];

export function useDivineStore() {
  const [powers, setPowers] = useState<DivinePower[]>(DEFAULT_POWERS);
  const [divineEnergy, setDivineEnergy] = useState(100);

  const usePower = useCallback((powerId: string) => {
    const power = powers.find((p) => p.id === powerId);
    if (!power || !power.unlocked) return false;
    if (divineEnergy < power.cost) return false;

    setDivineEnergy((prev) => prev - power.cost);
    setPowers((prev) =>
      prev.map((p) =>
        p.id === powerId ? { ...p, lastUsed: Date.now() } : p
      )
    );
    return true;
  }, [powers, divineEnergy]);

  const unlockPower = useCallback((powerId: string) => {
    setPowers((prev) =>
      prev.map((p) => (p.id === powerId ? { ...p, unlocked: true } : p))
    );
  }, []);

  const regenerateEnergy = useCallback((amount: number) => {
    setDivineEnergy((prev) => Math.min(100, prev + amount));
  }, []);

  return {
    powers,
    divineEnergy,
    setDivineEnergy,
    usePower,
    unlockPower,
    regenerateEnergy,
  };
}
