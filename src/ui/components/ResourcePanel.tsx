/**
 * =============================================================================
 * ResourcePanel 资源面板 - 核心能源系统
 * =============================================================================
 */

import React, { useState, useEffect, useCallback, memo } from 'react';

/* ==========================================================================
   类型定义
   ========================================================================== */

export type ResourceType = 'coreEnergy' | 'computeQuota' | 'biomass' | 'information' | 'trust';

export interface Resource {
  type: ResourceType;
  name: string;
  icon: string;
  current: number;
  max: number;
  rate: number; // 每秒变化
  color: string;
}

interface ResourcePanelProps {
  resources: Resource[];
  onResourceClick?: (resource: Resource) => void;
  compact?: boolean;
  className?: string;
}

/* ==========================================================================
   常量
   ========================================================================== */

const RESOURCE_ICONS: Record<ResourceType, string> = {
  coreEnergy: '⚡',
  computeQuota: '🧠',
  biomass: '🌱',
  information: '📊',
  trust: '🤝',
};

const RESOURCE_COLORS: Record<ResourceType, string> = {
  coreEnergy: 'var(--color-core-energy)',
  computeQuota: 'var(--color-compute-quota)',
  biomass: 'var(--color-biomass)',
  information: 'var(--color-information)',
  trust: 'var(--color-trust)',
};

const RESOURCE_NAMES: Record<ResourceType, string> = {
  coreEnergy: '核心能源',
  computeQuota: '算力配额',
  biomass: '生物质',
  information: '信息',
  trust: '信任',
};

/* ==========================================================================
   单个资源条组件
   ========================================================================== */

interface ResourceBarProps {
  resource: Resource;
  onClick?: () => void;
  showRate?: boolean;
  showValue?: boolean;
  animated?: boolean;
}

const ResourceBar: React.FC<ResourceBarProps> = memo(
  ({ resource, onClick, showRate = true, showValue = true, animated = true }) => {
    const [displayValue, setDisplayValue] = useState(resource.current);
    const percentage = Math.min(100, (resource.current / resource.max) * 100);
    const isLow = percentage < 20;
    const isFull = percentage >= 95;

    // 平滑动画效果
    useEffect(() => {
      if (!animated) {
        setDisplayValue(resource.current);
        return;
      }

      const diff = resource.current - displayValue;
      if (Math.abs(diff) < 1) {
        setDisplayValue(resource.current);
        return;
      }

      const step = diff * 0.1;
      const timer = setTimeout(() => {
        setDisplayValue((prev) => prev + step);
      }, 16);

      return () => clearTimeout(timer);
    }, [resource.current, animated, displayValue]);

    const formatValue = (val: number): string => {
      if (val >= 1_000_000) {
        return `${(val / 1_000_000).toFixed(1)}M`;
      }
      if (val >= 1_000) {
        return `${(val / 1_000).toFixed(1)}K`;
      }
      return val.toFixed(0);
    };

    return (
      <div
        className={`resource-item ${isLow ? 'resource-low' : ''} ${isFull ? 'resource-full' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="resource-header">
          <div className="resource-identity">
            <span className="resource-icon">{resource.icon}</span>
            <span className="resource-name">{resource.name}</span>
          </div>
          <div className="resource-metrics">
            {showValue && (
              <span className="resource-value">
                {formatValue(displayValue)}/{formatValue(resource.max)}
              </span>
            )}
            {showRate && resource.rate !== 0 && (
              <span
                className={`resource-rate ${resource.rate > 0 ? 'positive' : 'negative'}`}
              >
                {resource.rate > 0 ? '+' : ''}{resource.rate.toFixed(1)}/s
              </span>
            )}
          </div>
        </div>
        <div className="resource-track">
          <div
            className="resource-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: resource.color,
              boxShadow: `0 0 8px ${resource.color}`,
            }}
          />
          <div
            className="resource-glow"
            style={{ backgroundColor: resource.color }}
          />
        </div>
        {isLow && (
          <div className="resource-warning">
            <span>⚠️ 资源告急</span>
          </div>
        )}
      </div>
    );
  }
);

ResourceBar.displayName = 'ResourceBar';

/* ==========================================================================
   资源面板组件
   ========================================================================== */

export const ResourcePanel: React.FC<ResourcePanelProps> = memo(
  ({ resources, onResourceClick, compact = false, className = '' }) => {
    const [collapsed, setCollapsed] = useState(false);

    const handleToggle = useCallback(() => {
      setCollapsed((prev) => !prev);
    }, []);

    const totalResources = resources.length;
    const criticalResources = resources.filter(
      (r) => r.current / r.max < 0.2
    ).length;

    return (
      <div className={`resource-panel ${compact ? 'compact' : ''} ${className}`}>
        {/* 面板头部 */}
        <div className="hud-panel-header" onClick={handleToggle}>
          <div className="hud-panel-title">
            <span>资源系统</span>
            {criticalResources > 0 && (
              <span className="resource-alert-badge">
                {criticalResources}
              </span>
            )}
          </div>
          <button
            className="collapse-btn"
            aria-expanded={!collapsed}
            aria-label={collapsed ? '展开' : '收起'}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <path
                fill="currentColor"
                d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
              />
            </svg>
          </button>
        </div>

        {/* 资源列表 */}
        {!collapsed && (
          <div className="hud-panel-content">
            <div className="resource-list">
              {resources.map((resource) => (
                <ResourceBar
                  key={resource.type}
                  resource={resource}
                  onClick={onResourceClick ? () => onResourceClick(resource) : undefined}
                />
              ))}
            </div>

            {/* 资源统计 */}
            <div className="resource-summary">
              <div className="summary-item">
                <span className="summary-label">总容量</span>
                <span className="summary-value">
                  {resources
                    .reduce((sum, r) => sum + r.max, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">使用率</span>
                <span className="summary-value">
                  {(
                    (resources.reduce((sum, r) => sum + r.current, 0) /
                      resources.reduce((sum, r) => sum + r.max, 0)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ResourcePanel.displayName = 'ResourcePanel';

/* ==========================================================================
   资源工厂 Hook
   ========================================================================== */

export function useResources(initialResources?: Partial<Resource>[]) {
  const [resources, setResources] = useState<Resource[]>(() => {
    const defaults: Resource[] = [
      {
        type: 'coreEnergy',
        name: RESOURCE_NAMES.coreEnergy,
        icon: RESOURCE_ICONS.coreEnergy,
        current: 1000,
        max: 2000,
        rate: 0,
        color: RESOURCE_COLORS.coreEnergy,
      },
      {
        type: 'computeQuota',
        name: RESOURCE_NAMES.computeQuota,
        icon: RESOURCE_ICONS.computeQuota,
        current: 500,
        max: 1000,
        rate: 0,
        color: RESOURCE_COLORS.computeQuota,
      },
      {
        type: 'biomass',
        name: RESOURCE_NAMES.biomass,
        icon: RESOURCE_ICONS.biomass,
        current: 3000,
        max: 5000,
        rate: 0,
        color: RESOURCE_COLORS.biomass,
      },
      {
        type: 'information',
        name: RESOURCE_NAMES.information,
        icon: RESOURCE_ICONS.information,
        current: 200,
        max: 500,
        rate: 0,
        color: RESOURCE_COLORS.information,
      },
      {
        type: 'trust',
        name: RESOURCE_NAMES.trust,
        icon: RESOURCE_ICONS.trust,
        current: 80,
        max: 100,
        rate: 0,
        color: RESOURCE_COLORS.trust,
      },
    ];

    if (!initialResources) return defaults;

    return defaults.map((d) => {
      const override = initialResources.find((r) => r.type === d.type);
      return override ? { ...d, ...override } : d;
    });
  });

  // 更新资源
  const updateResources = useCallback((deltaTime: number) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        current: Math.max(0, Math.min(r.max, r.current + r.rate * deltaTime)),
      }))
    );
  }, []);

  // 设置资源值
  const setResource = useCallback(
    (type: ResourceType, value: number | ((prev: number) => number)) => {
      setResources((prev) =>
        prev.map((r) =>
          r.type === type
            ? {
                ...r,
                current:
                  typeof value === 'function'
                    ? value(r.current)
                    : Math.max(0, Math.min(r.max, value)),
              }
            : r
        )
      );
    },
    []
  );

  // 设置资源速率
  const setResourceRate = useCallback((type: ResourceType, rate: number) => {
    setResources((prev) =>
      prev.map((r) => (r.type === type ? { ...r, rate } : r))
    );
  }, []);

  // 增加资源
  const addResource = useCallback((type: ResourceType, amount: number) => {
    setResource(type, (prev) => prev + amount);
  }, [setResource]);

  // 消耗资源
  const consumeResource = useCallback(
    (type: ResourceType, amount: number): boolean => {
      let success = false;
      setResources((prev) =>
        prev.map((r) => {
          if (r.type === type && r.current >= amount) {
            success = true;
            return { ...r, current: r.current - amount };
          }
          return r;
        })
      );
      return success;
    },
    []
  );

  return {
    resources,
    updateResources,
    setResource,
    setResourceRate,
    addResource,
    consumeResource,
  };
}
