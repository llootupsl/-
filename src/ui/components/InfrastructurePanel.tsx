/**
 * =============================================================================
 * InfrastructurePanel 基础设施系统可视化面板
 * 包含道路、桥梁、电力、水利等基础设施的管理与可视化
 * =============================================================================
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
  memo,
} from 'react';
import { Panel } from './common/Panel';
import { Progress } from './common/Progress';
import { Badge } from './common/Badge';
import { Button } from './common/Button';
import './InfrastructurePanel.css';
import {
  InfrastructureSystem,
  InfrastructureType,
  InfrastructureStatus,
  QualityLevel,
  Infrastructure,
  RoadSegment,
  Bridge,
  PowerPlant,
  PowerLine,
  WaterTreatment,
  Irrigation,
  Dam,
  RoadType,
  BridgeType,
  PowerPlantType,
  WaterTreatmentType,
  ConstructionCost,
  InfrastructureStatistics,
} from '@/economy/InfrastructureSystem';
import type { Vec2, EntityId } from '@/core/types';

/* ==========================================================================
   类型定义
   ========================================================================== */

export interface InfrastructureMapProps {
  width?: number;
  height?: number;
  infrastructures: Infrastructure[];
  selectedId?: EntityId;
  onInfrastructureClick?: (infra: Infrastructure) => void;
  onMapClick?: (position: Vec2) => void;
  showRoads?: boolean;
  showPower?: boolean;
  showWater?: boolean;
  showBridges?: boolean;
}

export interface InfrastructureMarkerProps {
  infrastructure: Infrastructure;
  scale?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export interface StatusIndicatorProps {
  status: InfrastructureStatus;
  health: number;
  constructionProgress?: number;
}

export interface ConstructionPanelProps {
  infrastructureSystem: InfrastructureSystem;
  onBuild?: (type: InfrastructureType, position: Vec2, options: BuildOptions) => void;
  availableResources: number;
}

export interface BuildOptions {
  name: string;
  quality: QualityLevel;
  roadType?: RoadType;
  bridgeType?: BridgeType;
  plantType?: PowerPlantType;
  treatmentType?: WaterTreatmentType;
  startPosition?: Vec2;
  endPosition?: Vec2;
  coverageArea?: number;
  reservoirCapacity?: number;
}

export interface DetailPanelProps {
  infrastructure: Infrastructure;
  onClose?: () => void;
  onRepair?: () => void;
  onMaintain?: () => void;
  onDecommission?: () => void;
}

export interface InfrastructureStatsProps {
  statistics: InfrastructureStatistics;
}

/* ==========================================================================
   常量
   ========================================================================== */

const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 1000;

const INFRA_TYPE_COLORS: Record<InfrastructureType, string> = {
  [InfrastructureType.ROAD]: '#8b7355',
  [InfrastructureType.BRIDGE]: '#a0522d',
  [InfrastructureType.POWER_PLANT]: '#ffd700',
  [InfrastructureType.POWER_LINE]: '#ff8c00',
  [InfrastructureType.WATER_TREATMENT]: '#00bfff',
  [InfrastructureType.IRRIGATION]: '#32cd32',
  [InfrastructureType.DAM]: '#4169e1',
};

const INFRA_TYPE_ICONS: Record<InfrastructureType, string> = {
  [InfrastructureType.ROAD]: '🛤️',
  [InfrastructureType.BRIDGE]: '🌉',
  [InfrastructureType.POWER_PLANT]: '⚡',
  [InfrastructureType.POWER_LINE]: '🔌',
  [InfrastructureType.WATER_TREATMENT]: '💧',
  [InfrastructureType.IRRIGATION]: '🌾',
  [InfrastructureType.DAM]: '🏗️',
};

const STATUS_COLORS: Record<InfrastructureStatus, string> = {
  [InfrastructureStatus.PLANNING]: '#9b59b6',
  [InfrastructureStatus.UNDER_CONSTRUCTION]: '#f39c12',
  [InfrastructureStatus.OPERATIONAL]: '#27ae60',
  [InfrastructureStatus.DAMAGED]: '#e74c3c',
  [InfrastructureStatus.UNDER_REPAIR]: '#e67e22',
  [InfrastructureStatus.DECOMMISSIONED]: '#7f8c8d',
};

const STATUS_NAMES: Record<InfrastructureStatus, string> = {
  [InfrastructureStatus.PLANNING]: '规划中',
  [InfrastructureStatus.UNDER_CONSTRUCTION]: '建设中',
  [InfrastructureStatus.OPERATIONAL]: '运营中',
  [InfrastructureStatus.DAMAGED]: '已损坏',
  [InfrastructureStatus.UNDER_REPAIR]: '修复中',
  [InfrastructureStatus.DECOMMISSIONED]: '已停用',
};

const INFRA_TYPE_NAMES: Record<InfrastructureType, string> = {
  [InfrastructureType.ROAD]: '道路',
  [InfrastructureType.BRIDGE]: '桥梁',
  [InfrastructureType.POWER_PLANT]: '发电厂',
  [InfrastructureType.POWER_LINE]: '输电线',
  [InfrastructureType.WATER_TREATMENT]: '水处理厂',
  [InfrastructureType.IRRIGATION]: '灌溉系统',
  [InfrastructureType.DAM]: '大坝',
};

const ROAD_TYPE_NAMES: Record<RoadType, string> = {
  [RoadType.DIRT]: '土路',
  [RoadType.GRAVEL]: '碎石路',
  [RoadType.PAVED]: '铺装路',
  [RoadType.HIGHWAY]: '高速公路',
  [RoadType.MAGLEV]: '磁悬浮',
};

const BRIDGE_TYPE_NAMES: Record<BridgeType, string> = {
  [BridgeType.WOODEN]: '木桥',
  [BridgeType.STONE]: '石桥',
  [BridgeType.STEEL]: '钢桥',
  [BridgeType.SUSPENSION]: '悬索桥',
  [BridgeType.MAGNETIC]: '磁悬浮桥',
};

const POWER_PLANT_TYPE_NAMES: Record<PowerPlantType, string> = {
  [PowerPlantType.COAL]: '燃煤电厂',
  [PowerPlantType.GAS]: '燃气电厂',
  [PowerPlantType.NUCLEAR]: '核电站',
  [PowerPlantType.SOLAR]: '太阳能电站',
  [PowerPlantType.WIND]: '风力发电站',
  [PowerPlantType.FUSION]: '聚变电站',
  [PowerPlantType.QUANTUM]: '量子电站',
};

const WATER_TREATMENT_TYPE_NAMES: Record<WaterTreatmentType, string> = {
  [WaterTreatmentType.BASIC]: '基础水处理厂',
  [WaterTreatmentType.STANDARD]: '标准水处理厂',
  [WaterTreatmentType.ADVANCED]: '高级水处理厂',
  [WaterTreatmentType.QUANTUM_PURIFICATION]: '量子净化厂',
};

const QUALITY_NAMES: Record<QualityLevel, string> = {
  [QualityLevel.POOR]: '劣质',
  [QualityLevel.BASIC]: '基础',
  [QualityLevel.STANDARD]: '标准',
  [QualityLevel.ADVANCED]: '高级',
  [QualityLevel.PREMIUM]: '优质',
};

/* ==========================================================================
   工具函数
   ========================================================================== */

function getStatusLevel(status: InfrastructureStatus, health: number): 'success' | 'warning' | 'danger' | 'default' {
  if (status === InfrastructureStatus.OPERATIONAL && health >= 80) return 'success';
  if (status === InfrastructureStatus.DAMAGED) return 'danger';
  if (status === InfrastructureStatus.UNDER_CONSTRUCTION || status === InfrastructureStatus.UNDER_REPAIR) return 'warning';
  return 'default';
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天`;
  if (hours > 0) return `${hours}小时`;
  if (minutes > 0) return `${minutes}分钟`;
  return `${seconds}秒`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

/* ==========================================================================
   基础设施地图组件
   ========================================================================== */

export const InfrastructureMap: React.FC<InfrastructureMapProps> = memo(
  ({
    width = 300,
    height = 200,
    infrastructures,
    selectedId,
    onInfrastructureClick,
    onMapClick,
    showRoads = true,
    showPower = true,
    showWater = true,
    showBridges = true,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const [time, setTime] = useState(0);

    useEffect(() => {
      const animate = () => {
        setTime((t) => t + 0.016);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = width / WORLD_WIDTH;
      const scaleY = height / WORLD_HEIGHT;

      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.lineWidth = 0.5;
      const gridSize = 50;
      for (let x = 0; x <= width; x += gridSize * scaleX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize * scaleY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const filteredInfra = infrastructures.filter((infra) => {
        switch (infra.type) {
          case InfrastructureType.ROAD:
            return showRoads;
          case InfrastructureType.BRIDGE:
            return showBridges;
          case InfrastructureType.POWER_PLANT:
          case InfrastructureType.POWER_LINE:
            return showPower;
          case InfrastructureType.WATER_TREATMENT:
          case InfrastructureType.IRRIGATION:
          case InfrastructureType.DAM:
            return showWater;
          default:
            return true;
        }
      });

      filteredInfra.forEach((infra) => {
        const x = infra.position.x * scaleX;
        const y = infra.position.y * scaleY;
        const color = INFRA_TYPE_COLORS[infra.type];
        const isSelected = infra.id === selectedId;

        ctx.globalAlpha = isSelected ? 1 : 0.7;

        if (infra.type === InfrastructureType.ROAD) {
          const road = infra as RoadSegment;
          const pulseWidth = road.width * scaleX * (1 + Math.sin(time * 3) * 0.1);
          
          ctx.strokeStyle = color;
          ctx.lineWidth = pulseWidth;
          ctx.lineCap = 'round';
          
          if (road.status === InfrastructureStatus.OPERATIONAL) {
            ctx.strokeStyle = color;
          } else if (road.status === InfrastructureStatus.DAMAGED) {
            ctx.strokeStyle = '#ff4444';
            ctx.setLineDash([5, 5]);
          } else if (road.status === InfrastructureStatus.UNDER_CONSTRUCTION) {
            ctx.strokeStyle = '#ffaa00';
            ctx.setLineDash([3, 3]);
          }
          
          ctx.beginPath();
          ctx.arc(x, y, pulseWidth * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (infra.type === InfrastructureType.POWER_LINE) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          
          const flowOffset = (time * 20) % 8;
          ctx.lineDashOffset = -flowOffset;
          
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          const baseRadius = 10;
          const pulseRadius = baseRadius * (1 + Math.sin(time * 4) * 0.15);
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius * 2);
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.5, `${color}66`);
          gradient.addColorStop(1, `${color}00`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius * 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, baseRadius * 0.6, 0, Math.PI * 2);
          ctx.fill();

          if (infra.status === InfrastructureStatus.DAMAGED) {
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(x, y, baseRadius * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else if (infra.status === InfrastructureStatus.UNDER_CONSTRUCTION) {
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, baseRadius * 1.2, 0, Math.PI * 2 * infra.constructionProgress);
            ctx.stroke();
          }
        }

        if (isSelected) {
          ctx.strokeStyle = '#00fff9';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.strokeStyle = 'rgba(0, 255, 249, 0.3)';
          ctx.beginPath();
          ctx.arc(x, y, 22 + Math.sin(time * 5) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      });

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);
    }, [
      width,
      height,
      infrastructures,
      selectedId,
      showRoads,
      showPower,
      showWater,
      showBridges,
      time,
    ]);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const scaleX = width / WORLD_WIDTH;
        const scaleY = height / WORLD_HEIGHT;

        const worldX = clickX / scaleX;
        const worldY = clickY / scaleY;

        let clickedInfra: Infrastructure | null = null;
        let minDist = 20;

        for (const infra of infrastructures) {
          const dx = infra.position.x - worldX;
          const dy = infra.position.y - worldY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < minDist) {
            minDist = dist;
            clickedInfra = infra;
          }
        }

        if (clickedInfra) {
          onInfrastructureClick?.(clickedInfra);
        } else {
          onMapClick?.({ x: worldX, y: worldY });
        }
      },
      [width, height, infrastructures, onInfrastructureClick, onMapClick]
    );

    return (
      <div className="infrastructure-map">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleClick}
          role="img"
          aria-label="基础设施地图"
        />
      </div>
    );
  }
);

InfrastructureMap.displayName = 'InfrastructureMap';

/* ==========================================================================
   状态指示器组件
   ========================================================================== */

export const StatusIndicator: React.FC<StatusIndicatorProps> = memo(
  ({ status, health, constructionProgress }) => {
    const statusColor = STATUS_COLORS[status];
    const statusName = STATUS_NAMES[status];

    return (
      <div className="status-indicator">
        <div className="status-badge" style={{ backgroundColor: statusColor }}>
          {statusName}
        </div>
        {status === InfrastructureStatus.UNDER_CONSTRUCTION && constructionProgress !== undefined && (
          <div className="construction-progress">
            <Progress
              percent={constructionProgress * 100}
              status="warning"
              strokeHeight={4}
              showInfo
            />
          </div>
        )}
        {status !== InfrastructureStatus.UNDER_CONSTRUCTION && (
          <div className="health-bar">
            <span className="health-label">健康度</span>
            <Progress
              percent={health}
              status={getStatusLevel(status, health)}
              strokeHeight={4}
              showInfo
            />
          </div>
        )}
      </div>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';

/* ==========================================================================
   基础设施统计组件
   ========================================================================== */

export const InfrastructureStats: React.FC<InfrastructureStatsProps> = memo(
  ({ statistics }) => {
    const stats = [
      { label: '总设施数', value: statistics.totalInfrastructure, icon: '🏗️' },
      { label: '运营中', value: statistics.operationalCount, icon: '✅', color: '#27ae60' },
      { label: '损坏', value: statistics.damagedCount, icon: '⚠️', color: '#e74c3c' },
      { label: '建设中', value: statistics.underConstructionCount, icon: '🔧', color: '#f39c12' },
    ];

    return (
      <div className="infrastructure-stats">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-icon">{stat.icon}</span>
              <span className="stat-value" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="stats-details">
          <div className="detail-row">
            <span className="detail-label">平均健康度</span>
            <Progress
              percent={statistics.averageHealth}
              status={statistics.averageHealth > 70 ? 'success' : statistics.averageHealth > 40 ? 'warning' : 'danger'}
              strokeHeight={6}
            />
          </div>
          <div className="detail-row">
            <span className="detail-label">日维护成本</span>
            <span className="detail-value">{formatNumber(statistics.totalMaintenanceCost)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">总发电量</span>
            <span className="detail-value">{formatNumber(statistics.totalPowerGeneration)} MW</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">水处理量</span>
            <span className="detail-value">{formatNumber(statistics.totalWaterProcessing)} m³/d</span>
          </div>
        </div>
      </div>
    );
  }
);

InfrastructureStats.displayName = 'InfrastructureStats';

/* ==========================================================================
   建设面板组件
   ========================================================================== */

export const ConstructionPanel: React.FC<ConstructionPanelProps> = memo(
  ({ infrastructureSystem, onBuild, availableResources }) => {
    const [selectedType, setSelectedType] = useState<InfrastructureType | null>(null);
    const [selectedQuality, setSelectedQuality] = useState<QualityLevel>(QualityLevel.STANDARD);
    const [selectedSubType, setSelectedSubType] = useState<string>('');
    const [buildPosition, setBuildPosition] = useState<Vec2 | null>(null);
    const [infraName, setInfraName] = useState('');

    const constructionTypes = useMemo(() => [
      { type: InfrastructureType.ROAD, icon: INFRA_TYPE_ICONS[InfrastructureType.ROAD], name: '道路' },
      { type: InfrastructureType.BRIDGE, icon: INFRA_TYPE_ICONS[InfrastructureType.BRIDGE], name: '桥梁' },
      { type: InfrastructureType.POWER_PLANT, icon: INFRA_TYPE_ICONS[InfrastructureType.POWER_PLANT], name: '发电厂' },
      { type: InfrastructureType.POWER_LINE, icon: INFRA_TYPE_ICONS[InfrastructureType.POWER_LINE], name: '输电线' },
      { type: InfrastructureType.WATER_TREATMENT, icon: INFRA_TYPE_ICONS[InfrastructureType.WATER_TREATMENT], name: '水处理厂' },
      { type: InfrastructureType.IRRIGATION, icon: INFRA_TYPE_ICONS[InfrastructureType.IRRIGATION], name: '灌溉系统' },
      { type: InfrastructureType.DAM, icon: INFRA_TYPE_ICONS[InfrastructureType.DAM], name: '大坝' },
    ], []);

    const subTypeOptions = useMemo(() => {
      if (!selectedType) return [];
      
      switch (selectedType) {
        case InfrastructureType.ROAD:
          return Object.entries(ROAD_TYPE_NAMES).map(([key, name]) => ({ key, name }));
        case InfrastructureType.BRIDGE:
          return Object.entries(BRIDGE_TYPE_NAMES).map(([key, name]) => ({ key, name }));
        case InfrastructureType.POWER_PLANT:
          return Object.entries(POWER_PLANT_TYPE_NAMES).map(([key, name]) => ({ key, name }));
        case InfrastructureType.WATER_TREATMENT:
          return Object.entries(WATER_TREATMENT_TYPE_NAMES).map(([key, name]) => ({ key, name }));
        default:
          return [];
      }
    }, [selectedType]);

    const estimatedCost = useMemo(() => {
      if (!selectedType) return null;
      
      const baseCost = 1000 * selectedQuality;
      const resourceMultiplier = selectedSubType ? 1.5 : 1;
      
      return {
        baseCost: baseCost * resourceMultiplier,
        constructionTime: 86400000 * selectedQuality,
        laborRequired: 10 * selectedQuality,
      };
    }, [selectedType, selectedQuality, selectedSubType]);

    const canAfford = useMemo(() => {
      if (!estimatedCost) return false;
      return availableResources >= estimatedCost.baseCost;
    }, [estimatedCost, availableResources]);

    const handleBuild = useCallback(() => {
      if (!selectedType || !buildPosition || !onBuild) return;

      const options: BuildOptions = {
        name: infraName || `${INFRA_TYPE_NAMES[selectedType]}-${Date.now()}`,
        quality: selectedQuality,
      };

      switch (selectedType) {
        case InfrastructureType.ROAD:
          options.roadType = (selectedSubType as RoadType) || RoadType.PAVED;
          break;
        case InfrastructureType.BRIDGE:
          options.bridgeType = (selectedSubType as BridgeType) || BridgeType.STEEL;
          break;
        case InfrastructureType.POWER_PLANT:
          options.plantType = (selectedSubType as PowerPlantType) || PowerPlantType.COAL;
          break;
        case InfrastructureType.WATER_TREATMENT:
          options.treatmentType = (selectedSubType as WaterTreatmentType) || WaterTreatmentType.STANDARD;
          break;
      }

      onBuild(selectedType, buildPosition, options);
      
      setSelectedType(null);
      setBuildPosition(null);
      setInfraName('');
      setSelectedSubType('');
    }, [selectedType, buildPosition, selectedQuality, selectedSubType, infraName, onBuild]);

    return (
      <div className="construction-panel">
        <div className="construction-header">
          <span className="construction-icon">🏗️</span>
          <span className="construction-title">基础设施建设</span>
        </div>

        <div className="construction-type-grid">
          {constructionTypes.map((item) => (
            <button
              key={item.type}
              className={`type-button ${selectedType === item.type ? 'selected' : ''}`}
              onClick={() => setSelectedType(item.type)}
            >
              <span className="type-icon">{item.icon}</span>
              <span className="type-name">{item.name}</span>
            </button>
          ))}
        </div>

        {selectedType && (
          <div className="construction-options">
            <div className="option-group">
              <label className="option-label">设施名称</label>
              <input
                type="text"
                className="option-input"
                value={infraName}
                onChange={(e) => setInfraName(e.target.value)}
                placeholder="输入设施名称..."
              />
            </div>

            <div className="option-group">
              <label className="option-label">质量等级</label>
              <div className="quality-selector">
                {Object.entries(QUALITY_NAMES).map(([level, name]) => (
                  <button
                    key={level}
                    className={`quality-button ${selectedQuality === parseInt(level) ? 'selected' : ''}`}
                    onClick={() => setSelectedQuality(parseInt(level) as QualityLevel)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {subTypeOptions.length > 0 && (
              <div className="option-group">
                <label className="option-label">类型选择</label>
                <select
                  className="option-select"
                  value={selectedSubType}
                  onChange={(e) => setSelectedSubType(e.target.value)}
                >
                  <option value="">请选择...</option>
                  {subTypeOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="option-group">
              <label className="option-label">建设位置</label>
              <div className="position-input">
                {buildPosition ? (
                  <span className="position-value">
                    ({buildPosition.x.toFixed(0)}, {buildPosition.y.toFixed(0)})
                  </span>
                ) : (
                  <span className="position-placeholder">点击地图选择位置</span>
                )}
              </div>
            </div>

            {estimatedCost && (
              <div className="cost-preview">
                <div className="cost-item">
                  <span className="cost-label">建设成本</span>
                  <span className={`cost-value ${canAfford ? '' : 'insufficient'}`}>
                    {formatNumber(estimatedCost.baseCost)}
                  </span>
                </div>
                <div className="cost-item">
                  <span className="cost-label">建设时间</span>
                  <span className="cost-value">{formatDuration(estimatedCost.constructionTime)}</span>
                </div>
                <div className="cost-item">
                  <span className="cost-label">所需人力</span>
                  <span className="cost-value">{estimatedCost.laborRequired}</span>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              block
              disabled={!buildPosition || !canAfford}
              onClick={handleBuild}
            >
              {canAfford ? '确认建设' : '资源不足'}
            </Button>
          </div>
        )}
      </div>
    );
  }
);

ConstructionPanel.displayName = 'ConstructionPanel';

/* ==========================================================================
   详情面板组件
   ========================================================================== */

export const DetailPanel: React.FC<DetailPanelProps> = memo(
  ({ infrastructure, onClose, onRepair, onMaintain, onDecommission }) => {
    const getSpecificDetails = () => {
      switch (infrastructure.type) {
        case InfrastructureType.ROAD: {
          const road = infrastructure as RoadSegment;
          return (
            <>
              <div className="detail-row">
                <span className="detail-label">道路类型</span>
                <span className="detail-value">{ROAD_TYPE_NAMES[road.roadType]}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">长度</span>
                <span className="detail-value">{road.length.toFixed(0)} m</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">宽度</span>
                <span className="detail-value">{road.width} m</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">速度加成</span>
                <span className="detail-value">{(road.speedMultiplier * 100).toFixed(0)}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">贸易效率</span>
                <span className="detail-value">+{(road.tradeEfficiencyBonus * 100).toFixed(1)}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">交通密度</span>
                <Progress percent={road.trafficDensity} strokeHeight={4} />
              </div>
              <div className="detail-row">
                <span className="detail-label">磨损程度</span>
                <Progress percent={road.wearLevel} status={road.wearLevel > 70 ? 'danger' : 'warning'} strokeHeight={4} />
              </div>
            </>
          );
        }
        case InfrastructureType.BRIDGE: {
          const bridge = infrastructure as Bridge;
          return (
            <>
              <div className="detail-row">
                <span className="detail-label">桥梁类型</span>
                <span className="detail-value">{BRIDGE_TYPE_NAMES[bridge.bridgeType]}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">跨度</span>
                <span className="detail-value">{bridge.spanLength.toFixed(0)} m</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">承载能力</span>
                <span className="detail-value">{bridge.loadCapacity} t</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">当前负载</span>
                <Progress percent={(bridge.currentLoad / bridge.loadCapacity) * 100} strokeHeight={4} />
              </div>
              <div className="detail-row">
                <span className="detail-label">水深</span>
                <span className="detail-value">{bridge.waterDepth.toFixed(0)} m</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">结构完整性</span>
                <Progress percent={bridge.structuralIntegrity} status={bridge.structuralIntegrity < 50 ? 'danger' : 'default'} strokeHeight={4} />
              </div>
            </>
          );
        }
        case InfrastructureType.POWER_PLANT: {
          const plant = infrastructure as PowerPlant;
          return (
            <>
              <div className="detail-row">
                <span className="detail-label">电厂类型</span>
                <span className="detail-value">{POWER_PLANT_TYPE_NAMES[plant.plantType]}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">发电容量</span>
                <span className="detail-value">{plant.generationCapacity} MW</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">当前输出</span>
                <Progress percent={(plant.currentOutput / plant.generationCapacity) * 100} strokeHeight={4} />
              </div>
              <div className="detail-row">
                <span className="detail-label">效率</span>
                <span className="detail-value">{(plant.efficiency * 100).toFixed(1)}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">排放水平</span>
                <Progress percent={plant.emissionLevel} status={plant.emissionLevel > 50 ? 'danger' : 'warning'} strokeHeight={4} />
              </div>
              <div className="detail-row">
                <span className="detail-label">运行时间</span>
                <span className="detail-value">{plant.operationalHours.toFixed(0)} h</span>
              </div>
            </>
          );
        }
        case InfrastructureType.POWER_LINE: {
          const line = infrastructure as PowerLine;
          return (
            <>
              <div className="detail-row">
                <span className="detail-label">传输容量</span>
                <span className="detail-value">{line.transmissionCapacity} MW</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">当前负载</span>
                <Progress percent={(line.currentLoad / line.transmissionCapacity) * 100} strokeHeight={4} />
              </div>
              <div className="detail-row">
                <span className="detail-label">传输损耗</span>
                <span className="detail-value">{(line.transmissionLoss * 100).toFixed(2)}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">电压等级</span>
                <span className="detail-value">{line.voltageLevel} kV</span>
              </div>
            </>
          );
        }
        case InfrastructureType.WATER_TREATMENT: {
          const treatment = infrastructure as WaterTreatment;
          return (
            <>
              <div className="detail-row">
                <span className="detail-label">处理类型</span>
                <span className="detail-value">{WATER_TREATMENT_TYPE_NAMES[treatment.treatmentType]}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">处理容量</span>
                <span className="detail-value">{treatment.processingCapacity} m³/d</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">当前输出</span>
                <Progress percent={(treatment.currentOutput / treatment.processingCapacity) * 100} strokeHeight={4} />
              </div>
              <div className="detail-row">
                <span className="detail-label">水质</span>
                <span className="detail-value">{(treatment.waterQuality * 100).toFixed(1)}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">服务人口</span>
                <span className="detail-value">{formatNumber(treatment.servedPopulation)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">污染减少</span>
                <span className="detail-value">{(treatment.pollutionReduction * 100).toFixed(0)}%</span>
              </div>
            </>
          );
        }
        case InfrastructureType.IRRIGATION: {
          const irrigation = infrastructure as Irrigation;
          return (
            <>
              <div className="detail-row">
                <span className="detail-label">覆盖面积</span>
                <span className="detail-value">{irrigation.coverageArea} km²</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">效率</span>
                <span className="detail-value">{(irrigation.efficiency * 100).toFixed(0)}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">作物产量加成</span>
                <span className="detail-value">+{(irrigation.cropYieldBonus * 100).toFixed(0)}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">水消耗</span>
                <span className="detail-value">{irrigation.waterConsumption.toFixed(0)} m³/d</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">服务农场</span>
                <span className="detail-value">{irrigation.servedFarms.length}</span>
              </div>
            </>
          );
        }
        case InfrastructureType.DAM: {
          const dam = infrastructure as Dam;
          return (
            <>
              <div className="detail-row">
                <span className="detail-label">水库容量</span>
                <span className="detail-value">{formatNumber(dam.reservoirCapacity)} m³</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">当前水位</span>
                <Progress percent={(dam.currentWaterLevel / dam.reservoirCapacity) * 100} strokeHeight={4} />
              </div>
              <div className="detail-row">
                <span className="detail-label">发电容量</span>
                <span className="detail-value">{dam.powerGenerationCapacity} MW</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">防洪容量</span>
                <span className="detail-value">{formatNumber(dam.floodControlCapacity)} m³</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">下游区域</span>
                <span className="detail-value">{dam.downstreamRegions.length}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">结构完整性</span>
                <Progress percent={dam.structuralIntegrity} status={dam.structuralIntegrity < 50 ? 'danger' : 'default'} strokeHeight={4} />
              </div>
            </>
          );
        }
        default:
          return null;
      }
    };

    const canRepair = infrastructure.status === InfrastructureStatus.DAMAGED;
    const canMaintain = infrastructure.status === InfrastructureStatus.OPERATIONAL && infrastructure.health < 100;
    const canDecommission = infrastructure.status !== InfrastructureStatus.UNDER_CONSTRUCTION;

    return (
      <div className="detail-panel">
        <div className="detail-header">
          <div className="detail-title-row">
            <span className="detail-icon">{INFRA_TYPE_ICONS[infrastructure.type]}</span>
            <div className="detail-title-info">
              <h4 className="detail-name">{infrastructure.name}</h4>
              <span className="detail-type">{INFRA_TYPE_NAMES[infrastructure.type]}</span>
            </div>
          </div>
          {onClose && (
            <button className="detail-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <StatusIndicator
          status={infrastructure.status}
          health={infrastructure.health}
          constructionProgress={infrastructure.constructionProgress}
        />

        <div className="detail-section">
          <h5 className="section-title">基本信息</h5>
          <div className="detail-row">
            <span className="detail-label">质量等级</span>
            <span className="detail-value">{QUALITY_NAMES[infrastructure.quality]}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">位置</span>
            <span className="detail-value">
              ({infrastructure.position.x.toFixed(0)}, {infrastructure.position.y.toFixed(0)})
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">使用年限</span>
            <span className="detail-value">{(infrastructure.age / 86400).toFixed(1)} 天</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">维护成本</span>
            <span className="detail-value">{infrastructure.maintenanceCost.toFixed(0)}/天</span>
          </div>
        </div>

        <div className="detail-section">
          <h5 className="section-title">详细属性</h5>
          {getSpecificDetails()}
        </div>

        <div className="detail-actions">
          {canRepair && (
            <Button variant="danger" onClick={onRepair}>
              开始修复
            </Button>
          )}
          {canMaintain && (
            <Button variant="primary" onClick={onMaintain}>
              执行维护
            </Button>
          )}
          {canDecommission && (
            <Button variant="secondary" onClick={onDecommission}>
              停用设施
            </Button>
          )}
        </div>
      </div>
    );
  }
);

DetailPanel.displayName = 'DetailPanel';

/* ==========================================================================
   基础设施列表组件
   ========================================================================== */

export interface InfrastructureListProps {
  infrastructures: Infrastructure[];
  selectedId?: EntityId;
  onSelect?: (infra: Infrastructure) => void;
  filterType?: InfrastructureType | null;
}

export const InfrastructureList: React.FC<InfrastructureListProps> = memo(
  ({ infrastructures, selectedId, onSelect, filterType }) => {
    const filteredList = useMemo(() => {
      if (!filterType) return infrastructures;
      return infrastructures.filter((i) => i.type === filterType);
    }, [infrastructures, filterType]);

    const groupedByType = useMemo(() => {
      const groups = new Map<InfrastructureType, Infrastructure[]>();
      filteredList.forEach((infra) => {
        const list = groups.get(infra.type) || [];
        list.push(infra);
        groups.set(infra.type, list);
      });
      return groups;
    }, [filteredList]);

    return (
      <div className="infrastructure-list">
        {Array.from(groupedByType.entries()).map(([type, items]) => (
          <div key={type} className="infra-group">
            <div className="group-header">
              <span className="group-icon">{INFRA_TYPE_ICONS[type]}</span>
              <span className="group-name">{INFRA_TYPE_NAMES[type]}</span>
              <Badge count={items.length} variant="default" />
            </div>
            <div className="group-items">
              {items.map((infra) => (
                <div
                  key={infra.id}
                  className={`infra-item ${selectedId === infra.id ? 'selected' : ''}`}
                  onClick={() => onSelect?.(infra)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="item-status" style={{ backgroundColor: STATUS_COLORS[infra.status] }} />
                  <div className="item-info">
                    <span className="item-name">{infra.name}</span>
                    <span className="item-health">健康度: {infra.health.toFixed(0)}%</span>
                  </div>
                  <Badge
                    variant={getStatusLevel(infra.status, infra.health) === 'success' ? 'success' : 
                             getStatusLevel(infra.status, infra.health) === 'danger' ? 'danger' : 'default'}
                  >
                    {STATUS_NAMES[infra.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredList.length === 0 && (
          <div className="list-empty">暂无基础设施</div>
        )}
      </div>
    );
  }
);

InfrastructureList.displayName = 'InfrastructureList';

/* ==========================================================================
   主基础设施面板组件
   ========================================================================== */

export interface InfrastructurePanelProps {
  infrastructureSystem: InfrastructureSystem;
  availableResources?: number;
  className?: string;
}

export const InfrastructurePanel: React.FC<InfrastructurePanelProps> = memo(
  ({ infrastructureSystem, availableResources = 10000, className = '' }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'build' | 'list'>('overview');
    const [selectedInfra, setSelectedInfra] = useState<Infrastructure | null>(null);
    const [buildPosition, setBuildPosition] = useState<Vec2 | null>(null);
    const [filterType, setFilterType] = useState<InfrastructureType | null>(null);

    const infrastructures = useMemo(
      () => infrastructureSystem.getAllInfrastructure(),
      [infrastructureSystem]
    );

    const statistics = useMemo(
      () => infrastructureSystem.getStatistics(),
      [infrastructureSystem]
    );

    const handleMapClick = useCallback((position: Vec2) => {
      setBuildPosition(position);
    }, []);

    const handleInfrastructureClick = useCallback((infra: Infrastructure) => {
      setSelectedInfra(infra);
    }, []);

    const handleBuild = useCallback(
      (type: InfrastructureType, position: Vec2, options: BuildOptions) => {
        switch (type) {
          case InfrastructureType.ROAD:
            infrastructureSystem.createRoadSegment(
              options.name,
              options.roadType || RoadType.PAVED,
              position,
              { x: position.x + 100, y: position.y },
              options.quality
            );
            break;
          case InfrastructureType.BRIDGE:
            break;
          case InfrastructureType.POWER_PLANT:
            infrastructureSystem.createPowerPlant(
              options.name,
              options.plantType || PowerPlantType.COAL,
              position,
              options.quality
            );
            break;
          case InfrastructureType.WATER_TREATMENT:
            infrastructureSystem.createWaterTreatment(
              options.name,
              options.treatmentType || WaterTreatmentType.STANDARD,
              position,
              options.quality
            );
            break;
          case InfrastructureType.IRRIGATION:
            infrastructureSystem.createIrrigation(
              options.name,
              position,
              options.coverageArea || 100,
              '' as EntityId,
              options.quality
            );
            break;
          case InfrastructureType.DAM:
            infrastructureSystem.createDam(
              options.name,
              position,
              options.reservoirCapacity || 10000,
              options.quality
            );
            break;
        }
        setBuildPosition(null);
      },
      [infrastructureSystem]
    );

    const handleRepair = useCallback(() => {
      if (selectedInfra) {
        infrastructureSystem.startRepair(selectedInfra.id);
      }
    }, [selectedInfra, infrastructureSystem]);

    const handleMaintain = useCallback(() => {
      if (selectedInfra) {
        infrastructureSystem.performMaintenance(selectedInfra.id);
      }
    }, [selectedInfra, infrastructureSystem]);

    const handleDecommission = useCallback(() => {
      if (selectedInfra) {
        infrastructureSystem.decommissionInfrastructure(selectedInfra.id);
        setSelectedInfra(null);
      }
    }, [selectedInfra, infrastructureSystem]);

    const tabs = [
      { key: 'overview' as const, icon: '📊', label: '概览' },
      { key: 'build' as const, icon: '🏗️', label: '建设' },
      { key: 'list' as const, icon: '📋', label: '列表' },
    ];

    return (
      <Panel
        title="基础设施系统"
        subtitle="道路 · 电力 · 水利"
        className={`infrastructure-panel ${className}`}
        variant="glass"
        bordered
        glowing
      >
        <div className="infra-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`infra-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="infra-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <InfrastructureMap
                infrastructures={infrastructures}
                selectedId={selectedInfra?.id}
                onInfrastructureClick={handleInfrastructureClick}
                onMapClick={handleMapClick}
                width={300}
                height={180}
              />
              <InfrastructureStats statistics={statistics} />
              {selectedInfra && (
                <DetailPanel
                  infrastructure={selectedInfra}
                  onClose={() => setSelectedInfra(null)}
                  onRepair={handleRepair}
                  onMaintain={handleMaintain}
                  onDecommission={handleDecommission}
                />
              )}
            </div>
          )}

          {activeTab === 'build' && (
            <div className="build-tab">
              <InfrastructureMap
                infrastructures={infrastructures}
                selectedId={selectedInfra?.id}
                onInfrastructureClick={handleInfrastructureClick}
                onMapClick={handleMapClick}
                width={300}
                height={150}
              />
              <ConstructionPanel
                infrastructureSystem={infrastructureSystem}
                onBuild={handleBuild}
                availableResources={availableResources}
              />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="list-tab">
              <div className="filter-bar">
                <button
                  className={`filter-btn ${!filterType ? 'active' : ''}`}
                  onClick={() => setFilterType(null)}
                >
                  全部
                </button>
                {Object.values(InfrastructureType).map((type) => (
                  <button
                    key={type}
                    className={`filter-btn ${filterType === type ? 'active' : ''}`}
                    onClick={() => setFilterType(type)}
                  >
                    {INFRA_TYPE_ICONS[type]}
                  </button>
                ))}
              </div>
              <InfrastructureList
                infrastructures={infrastructures}
                selectedId={selectedInfra?.id}
                onSelect={setSelectedInfra}
                filterType={filterType}
              />
              {selectedInfra && (
                <DetailPanel
                  infrastructure={selectedInfra}
                  onClose={() => setSelectedInfra(null)}
                  onRepair={handleRepair}
                  onMaintain={handleMaintain}
                  onDecommission={handleDecommission}
                />
              )}
            </div>
          )}
        </div>
      </Panel>
    );
  }
);

InfrastructurePanel.displayName = 'InfrastructurePanel';

/* ==========================================================================
   Hook: 基础设施系统状态
   ========================================================================== */

export function useInfrastructureState(infrastructureSystem: InfrastructureSystem) {
  const [state, setState] = useState({
    infrastructures: infrastructureSystem.getAllInfrastructure(),
    statistics: infrastructureSystem.getStatistics(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setState({
        infrastructures: infrastructureSystem.getAllInfrastructure(),
        statistics: infrastructureSystem.getStatistics(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [infrastructureSystem]);

  return state;
}

export default InfrastructurePanel;
