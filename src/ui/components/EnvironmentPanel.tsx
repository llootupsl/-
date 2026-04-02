/**
 * =============================================================================
 * EnvironmentPanel 环境系统可视化面板
 * 包含气候、灾害、流行病的可视化
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
import {
  ClimateSystem,
  ClimateState,
  DisasterManager,
  DisasterType,
  DisasterWarning,
  NaturalDisaster,
  EpidemicSystem,
  DiseaseState,
  Season,
  SeasonSystem,
} from '@/world/EpidemicClimateSystem';

/* ==========================================================================
   类型定义
   ========================================================================== */

export interface EnvironmentMapProps {
  width?: number;
  height?: number;
  climateState: ClimateState;
  disasters: NaturalDisaster[];
  infectionZones: InfectionZone[];
  seaLevelOffset?: number;
  onCellClick?: (x: number, y: number) => void;
  showTemperature?: boolean;
  showSeaLevel?: boolean;
  showDisasters?: boolean;
  showInfection?: boolean;
}

export interface InfectionZone {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  diseaseId: string;
}

export interface ClimateIndicatorProps {
  temperature: number;
  co2: number;
  seaLevel: number;
  precipitation: number;
  extremeWeatherProb: number;
}

export interface DisasterMarkerProps {
  disaster: NaturalDisaster;
  scale?: number;
}

export interface SEIRStats {
  susceptible: number;
  exposed: number;
  infected: number;
  recovered: number;
  dead: number;
}

export interface ClimateTrendData {
  timestamp: number;
  temperature: number;
  co2: number;
  seaLevel: number;
}

/* ==========================================================================
   常量
   ========================================================================== */

const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 1000;

const DISASTER_COLORS: Record<DisasterType, string> = {
  [DisasterType.EARTHQUAKE]: '#ff6b35',
  [DisasterType.FLOOD]: '#4a90d9',
  [DisasterType.DROUGHT]: '#d4a574',
  [DisasterType.STORM]: '#7b68ee',
  [DisasterType.WILDFIRE]: '#ff4500',
  [DisasterType.TSUNAMI]: '#00ced1',
  [DisasterType.VOLCANO]: '#dc143c',
  [DisasterType.PLAGUE]: '#8b0000',
};

const DISASTER_ICONS: Record<DisasterType, string> = {
  [DisasterType.EARTHQUAKE]: '🌋',
  [DisasterType.FLOOD]: '🌊',
  [DisasterType.DROUGHT]: '☀️',
  [DisasterType.STORM]: '⛈️',
  [DisasterType.WILDFIRE]: '🔥',
  [DisasterType.TSUNAMI]: '🌊',
  [DisasterType.VOLCANO]: '🌋',
  [DisasterType.PLAGUE]: '🦠',
};

const SEIR_COLORS = {
  susceptible: '#3498db',
  exposed: '#f39c12',
  infected: '#e74c3c',
  recovered: '#27ae60',
  dead: '#7f8c8d',
};

/* ==========================================================================
   工具函数
   ========================================================================== */

function temperatureToColor(temp: number): string {
  const normalized = Math.max(-20, Math.min(50, temp));
  const t = (normalized + 20) / 70;
  
  if (t < 0.15) {
    const ratio = t / 0.15;
    return `rgb(${Math.round(30 + ratio * 50)}, ${Math.round(80 + ratio * 80)}, ${Math.round(180 + ratio * 40)})`;
  } else if (t < 0.3) {
    const ratio = (t - 0.15) / 0.15;
    return `rgb(${Math.round(80 + ratio * 80)}, ${Math.round(160 + ratio * 60)}, ${Math.round(220 - ratio * 80)})`;
  } else if (t < 0.45) {
    const ratio = (t - 0.3) / 0.15;
    return `rgb(${Math.round(160 + ratio * 60)}, ${Math.round(220 - ratio * 40)}, ${Math.round(140 - ratio * 60)})`;
  } else if (t < 0.6) {
    const ratio = (t - 0.45) / 0.15;
    return `rgb(${Math.round(220 + ratio * 35)}, ${Math.round(180 - ratio * 80)}, ${Math.round(80 - ratio * 40)})`;
  } else if (t < 0.75) {
    const ratio = (t - 0.6) / 0.15;
    return `rgb(${Math.round(255)}, ${Math.round(100 - ratio * 60)}, ${Math.round(40 - ratio * 40)})`;
  } else if (t < 0.9) {
    const ratio = (t - 0.75) / 0.15;
    return `rgb(${Math.round(255 - ratio * 30)}, ${Math.round(40 - ratio * 20)}, ${Math.round(0)})`;
  } else {
    const ratio = (t - 0.9) / 0.1;
    return `rgb(${Math.round(225 + ratio * 30)}, ${Math.round(20 + ratio * 10)}, ${Math.round(ratio * 30)})`;
  }
}

function getTemperatureGradientColors(temp: number): { start: string; mid: string; end: string } {
  if (temp < 0) {
    return { start: '#1e3a5f', mid: '#2d5a87', end: '#4a90d9' };
  } else if (temp < 15) {
    return { start: '#4a90d9', mid: '#5fb3a1', end: '#7ed957' };
  } else if (temp < 25) {
    return { start: '#7ed957', mid: '#f4d03f', end: '#f39c12' };
  } else if (temp < 35) {
    return { start: '#f39c12', mid: '#e74c3c', end: '#c0392b' };
  } else {
    return { start: '#e74c3c', mid: '#c0392b', end: '#8b0000' };
  }
}

function co2ToColor(co2: number): string {
  const normalized = Math.max(280, Math.min(1000, co2));
  const t = (normalized - 280) / 720;
  
  if (t < 0.3) return '#27ae60';
  if (t < 0.6) return '#f39c12';
  return '#e74c3c';
}

function seaLevelToColor(seaLevel: number): string {
  const normalized = Math.max(0, Math.min(20, seaLevel));
  const t = normalized / 20;
  
  const r = Math.round(0 + t * 100);
  const g = Math.round(150 - t * 50);
  const b = Math.round(200 + t * 55);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function getWarningLevel(probability: number): 'low' | 'medium' | 'high' | 'critical' {
  if (probability < 0.3) return 'low';
  if (probability < 0.5) return 'medium';
  if (probability < 0.7) return 'high';
  return 'critical';
}

/* ==========================================================================
   环境地图组件
   ========================================================================== */

export const EnvironmentMap: React.FC<EnvironmentMapProps> = memo(
  ({
    width = 300,
    height = 200,
    climateState,
    disasters,
    infectionZones,
    seaLevelOffset = 0,
    onCellClick,
    showTemperature = true,
    showSeaLevel = true,
    showDisasters = true,
    showInfection = true,
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

      if (showTemperature) {
        const tempColor = temperatureToColor(climateState.temperature);
        const gradient = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, width / 2
        );
        gradient.addColorStop(0, tempColor);
        gradient.addColorStop(1, 'rgba(5, 5, 8, 0.8)');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      }

      if (showSeaLevel && climateState.seaLevel > 0) {
        const seaLevel = climateState.seaLevel + seaLevelOffset;
        const floodHeight = Math.min(height * 0.3, (seaLevel / 20) * height * 0.3);
        
        ctx.fillStyle = seaLevelToColor(seaLevel);
        ctx.globalAlpha = 0.4;
        
        const waveOffset = Math.sin(time * 2) * 3;
        
        for (let y = height - floodHeight; y < height; y += 2) {
          const waveY = y + Math.sin((y / 10) + time * 3) * 2 + waveOffset;
          ctx.fillRect(0, waveY, width, 2);
        }
        
        ctx.globalAlpha = 1;
      }

      if (showInfection && infectionZones.length > 0) {
        infectionZones.forEach((zone) => {
          const x = zone.x * scaleX;
          const y = zone.y * scaleY;
          const radius = zone.radius * Math.min(scaleX, scaleY);
          
          const pulseRadius = radius * (1 + Math.sin(time * 4) * 0.1);
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius);
          gradient.addColorStop(0, `rgba(255, 0, 0, ${zone.intensity * 0.6})`);
          gradient.addColorStop(0.5, `rgba(255, 100, 0, ${zone.intensity * 0.3})`);
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (showDisasters && disasters.length > 0) {
        disasters.forEach((disaster) => {
          if (!disaster.isActive) return;
          
          const x = disaster.affectedArea.centerX * scaleX;
          const y = disaster.affectedArea.centerY * scaleY;
          const radius = disaster.affectedArea.radius * Math.min(scaleX, scaleY);
          const color = DISASTER_COLORS[disaster.type];
          
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.3;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.globalAlpha = 1;
          
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(DISASTER_ICONS[disaster.type], x, y);
        });
      }

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);
    }, [
      width,
      height,
      climateState,
      disasters,
      infectionZones,
      seaLevelOffset,
      showTemperature,
      showSeaLevel,
      showDisasters,
      showInfection,
      time,
    ]);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !onCellClick) return;

        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / width) * WORLD_WIDTH;
        const y = ((e.clientY - rect.top) / height) * WORLD_HEIGHT;
        onCellClick(x, y);
      },
      [width, height, onCellClick]
    );

    return (
      <div className="environment-map">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleClick}
          role="img"
          aria-label="环境地图"
        />
      </div>
    );
  }
);

EnvironmentMap.displayName = 'EnvironmentMap';

/* ==========================================================================
   气候指示器组件
   ========================================================================== */

export const ClimateIndicators: React.FC<ClimateIndicatorProps> = memo(
  ({ temperature, co2, seaLevel, precipitation, extremeWeatherProb }) => {
    const tempStatus = temperature > 30 ? 'danger' : temperature > 25 ? 'warning' : 'default';
    const co2Status = co2 > 600 ? 'danger' : co2 > 450 ? 'warning' : 'success';
    const seaStatus = seaLevel > 10 ? 'danger' : seaLevel > 5 ? 'warning' : 'default';

    return (
      <div className="climate-indicators">
        <div className="indicator-item">
          <div className="indicator-header">
            <span className="indicator-icon">🌡️</span>
            <span className="indicator-label">温度</span>
            <span className={`indicator-value indicator-${tempStatus}`}>
              {temperature.toFixed(1)}°C
            </span>
          </div>
          <div
            className="indicator-bar"
            style={{
              background: `linear-gradient(90deg, 
                ${temperatureToColor(-20)} 0%, 
                ${temperatureToColor(15)} 35%, 
                ${temperatureToColor(30)} 65%, 
                ${temperatureToColor(50)} 100%)`,
            }}
          >
            <div
              className="indicator-marker"
              style={{ left: `${Math.min(100, Math.max(0, ((temperature + 20) / 70) * 100))}%` }}
            />
          </div>
        </div>

        <div className="indicator-item">
          <div className="indicator-header">
            <span className="indicator-icon">☁️</span>
            <span className="indicator-label">CO₂</span>
            <span className={`indicator-value indicator-${co2Status}`}>
              {co2.toFixed(0)} ppm
            </span>
          </div>
          <Progress
            percent={Math.min(100, ((co2 - 280) / 720) * 100)}
            status={co2Status === 'danger' ? 'danger' : co2Status === 'warning' ? 'warning' : 'success'}
            strokeHeight={6}
            glow={co2 > 500}
          />
        </div>

        <div className="indicator-item">
          <div className="indicator-header">
            <span className="indicator-icon">🌊</span>
            <span className="indicator-label">海平面</span>
            <span className={`indicator-value indicator-${seaStatus}`}>
              +{seaLevel.toFixed(2)}m
            </span>
          </div>
          <Progress
            percent={Math.min(100, (seaLevel / 20) * 100)}
            status={seaStatus === 'danger' ? 'danger' : seaStatus === 'warning' ? 'warning' : 'default'}
            strokeHeight={6}
          />
        </div>

        <div className="indicator-item">
          <div className="indicator-header">
            <span className="indicator-icon">🌧️</span>
            <span className="indicator-label">降水</span>
            <span className="indicator-value">
              {precipitation.toFixed(1)} mm/d
            </span>
          </div>
        </div>

        <div className="indicator-item">
          <div className="indicator-header">
            <span className="indicator-icon">⚡</span>
            <span className="indicator-label">极端天气</span>
            <span className={`indicator-value indicator-${extremeWeatherProb > 0.5 ? 'danger' : 'default'}`}>
              {(extremeWeatherProb * 100).toFixed(0)}%
            </span>
          </div>
          <Progress
            percent={extremeWeatherProb * 100}
            status={extremeWeatherProb > 0.7 ? 'danger' : extremeWeatherProb > 0.4 ? 'warning' : 'default'}
            strokeHeight={6}
          />
        </div>
      </div>
    );
  }
);

ClimateIndicators.displayName = 'ClimateIndicators';

/* ==========================================================================
   气候趋势图表组件
   ========================================================================== */

export interface ClimateTrendChartProps {
  data: ClimateTrendData[];
  width?: number;
  height?: number;
  showTemperature?: boolean;
  showCO2?: boolean;
  showSeaLevel?: boolean;
}

export const ClimateTrendChart: React.FC<ClimateTrendChartProps> = memo(
  ({
    data,
    width = 300,
    height = 120,
    showTemperature = true,
    showCO2 = true,
    showSeaLevel = true,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || data.length < 2) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      const padding = { top: 10, right: 10, bottom: 20, left: 40 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      const drawLine = (
        values: number[],
        min: number,
        max: number,
        color: string,
        label: string
      ) => {
        if (values.length < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        values.forEach((val, i) => {
          const x = padding.left + (i / (values.length - 1)) * chartWidth;
          const normalizedVal = (val - min) / (max - min);
          const y = padding.top + chartHeight - normalizedVal * chartHeight;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.1;
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      if (showTemperature) {
        const temps = data.map((d) => d.temperature);
        drawLine(temps, -10, 50, '#ff6b6b', '温度');
      }

      if (showCO2) {
        const co2s = data.map((d) => d.co2);
        drawLine(co2s, 280, 1000, '#9b59b6', 'CO₂');
      }

      if (showSeaLevel) {
        const seaLevels = data.map((d) => d.seaLevel);
        drawLine(seaLevels, 0, 20, '#3498db', '海平面');
      }

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;

      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i / 4) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.strokeRect(padding.left, padding.top, chartWidth, chartHeight);

      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';

      const legendItems: { color: string; label: string }[] = [];
      if (showTemperature) legendItems.push({ color: '#ff6b6b', label: '温度' });
      if (showCO2) legendItems.push({ color: '#9b59b6', label: 'CO₂' });
      if (showSeaLevel) legendItems.push({ color: '#3498db', label: '海平面' });

      legendItems.forEach((item, i) => {
        const x = padding.left + i * 60;
        ctx.fillStyle = item.color;
        ctx.fillRect(x, height - 10, 8, 8);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.fillText(item.label, x + 12, height - 2);
      });
    }, [data, width, height, showTemperature, showCO2, showSeaLevel]);

    return (
      <div className="climate-trend-chart">
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
    );
  }
);

ClimateTrendChart.displayName = 'ClimateTrendChart';

/* ==========================================================================
   灾害预警组件
   ========================================================================== */

export interface DisasterWarningPanelProps {
  warnings: DisasterWarning[];
  maxDisplay?: number;
}

export const DisasterWarningPanel: React.FC<DisasterWarningPanelProps> = memo(
  ({ warnings, maxDisplay = 5 }) => {
    const displayWarnings = warnings.slice(0, maxDisplay);

    return (
      <div className="disaster-warning-panel">
        <div className="warning-header">
          <span className="warning-icon">⚠️</span>
          <span className="warning-title">灾害预警</span>
          <Badge count={warnings.length} variant="danger" />
        </div>
        <div className="warning-list">
          {displayWarnings.length === 0 ? (
            <div className="warning-empty">暂无预警</div>
          ) : (
            displayWarnings.map((warning, index) => {
              const level = getWarningLevel(warning.probability);
              return (
                <div key={index} className={`warning-item warning-${level}`}>
                  <div className="warning-type">
                    <span className="warning-emoji">
                      {DISASTER_ICONS[warning.disasterType]}
                    </span>
                    <span className="warning-name">
                      {DISASTER_TYPE_NAMES[warning.disasterType]}
                    </span>
                  </div>
                  <div className="warning-prob">
                    <Progress
                      percent={warning.probability * 100}
                      status={level === 'critical' ? 'danger' : level === 'high' ? 'warning' : 'default'}
                      strokeHeight={4}
                      showInfo={false}
                    />
                    <span className="prob-value">{(warning.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="warning-areas">
                    {warning.affectedArea.slice(0, 3).map((area, i) => (
                      <Badge key={i} variant="default" className="area-badge">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);

DisasterWarningPanel.displayName = 'DisasterWarningPanel';

const DISASTER_TYPE_NAMES: Record<DisasterType, string> = {
  [DisasterType.EARTHQUAKE]: '地震',
  [DisasterType.FLOOD]: '洪水',
  [DisasterType.DROUGHT]: '干旱',
  [DisasterType.STORM]: '暴风',
  [DisasterType.WILDFIRE]: '野火',
  [DisasterType.TSUNAMI]: '海啸',
  [DisasterType.VOLCANO]: '火山',
  [DisasterType.PLAGUE]: '瘟疫',
};

/* ==========================================================================
   SEIR 统计图表组件
   ========================================================================== */

export interface SEIRChartProps {
  stats: SEIRStats;
  total: number;
}

export const SEIRChart: React.FC<SEIRChartProps> = memo(({ stats, total }) => {
  const data = useMemo(() => {
    if (total === 0) return [];
    return [
      { key: 'susceptible', label: '易感', value: stats.susceptible, color: SEIR_COLORS.susceptible },
      { key: 'exposed', label: '潜伏', value: stats.exposed, color: SEIR_COLORS.exposed },
      { key: 'infected', label: '感染', value: stats.infected, color: SEIR_COLORS.infected },
      { key: 'recovered', label: '康复', value: stats.recovered, color: SEIR_COLORS.recovered },
      { key: 'dead', label: '死亡', value: stats.dead, color: SEIR_COLORS.dead },
    ];
  }, [stats, total]);

  return (
    <div className="seir-chart">
      <div className="seir-header">
        <span className="seir-title">SEIR 流行病模型</span>
        <span className="seir-total">总人口: {total.toLocaleString()}</span>
      </div>
      
      <div className="seir-bar-container">
        {data.map((item) => (
          <div
            key={item.key}
            className="seir-bar-segment"
            style={{
              width: `${(item.value / total) * 100}%`,
              backgroundColor: item.color,
            }}
            title={`${item.label}: ${item.value.toLocaleString()} (${((item.value / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>

      <div className="seir-legend">
        {data.map((item) => (
          <div key={item.key} className="seir-legend-item">
            <div className="seir-legend-color" style={{ backgroundColor: item.color }} />
            <span className="seir-legend-label">{item.label}</span>
            <span className="seir-legend-value">{item.value.toLocaleString()}</span>
            <span className="seir-legend-percent">
              ({((item.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

SEIRChart.displayName = 'SEIRChart';

/* ==========================================================================
   活跃灾害列表组件
   ========================================================================== */

export interface ActiveDisastersListProps {
  disasters: NaturalDisaster[];
  onDisasterClick?: (disaster: NaturalDisaster) => void;
}

export const ActiveDisastersList: React.FC<ActiveDisastersListProps> = memo(
  ({ disasters, onDisasterClick }) => {
    const activeDisasters = disasters.filter((d) => d.isActive);

    return (
      <div className="active-disasters-list">
        <div className="disasters-header">
          <span className="disasters-icon">🔥</span>
          <span className="disasters-title">活跃灾害</span>
          <Badge count={activeDisasters.length} variant="warning" />
        </div>
        
        {activeDisasters.length === 0 ? (
          <div className="disasters-empty">暂无活跃灾害</div>
        ) : (
          <div className="disasters-items">
            {activeDisasters.map((disaster) => (
              <div
                key={disaster.id}
                className="disaster-item"
                onClick={() => onDisasterClick?.(disaster)}
                role="button"
                tabIndex={0}
              >
                <div className="disaster-icon" style={{ color: DISASTER_COLORS[disaster.type] }}>
                  {DISASTER_ICONS[disaster.type]}
                </div>
                <div className="disaster-info">
                  <div className="disaster-name">{disaster.name}</div>
                  <div className="disaster-severity">
                    严重程度: {(disaster.severity * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="disaster-effects">
                  <div className="effect-item">
                    <span className="effect-label">生命</span>
                    <Progress
                      percent={disaster.effects.healthDamage * 100}
                      status="danger"
                      strokeHeight={3}
                      showInfo={false}
                    />
                  </div>
                  <div className="effect-item">
                    <span className="effect-label">资源</span>
                    <Progress
                      percent={disaster.effects.resourceLoss * 100}
                      status="warning"
                      strokeHeight={3}
                      showInfo={false}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ActiveDisastersList.displayName = 'ActiveDisastersList';

/* ==========================================================================
   主环境面板组件
   ========================================================================== */

export interface EnvironmentPanelProps {
  climateSystem: ClimateSystem;
  disasterManager: DisasterManager;
  epidemicSystem: EpidemicSystem;
  seasonSystem?: SeasonSystem;
  className?: string;
}

export const EnvironmentPanel: React.FC<EnvironmentPanelProps> = memo(
  ({ climateSystem, disasterManager, epidemicSystem, seasonSystem, className = '' }) => {
    const [activeTab, setActiveTab] = useState<'climate' | 'disasters' | 'epidemic'>('climate');
    const [climateHistory, setClimateHistory] = useState<ClimateTrendData[]>([]);
    const [infectionZones, setInfectionZones] = useState<InfectionZone[]>([]);

    const climateState = useMemo(() => climateSystem.getState(), [climateSystem]);
    const disasters = useMemo(() => disasterManager.getActiveDisasters(), [disasterManager]);
    const warnings = useMemo(
      () => disasterManager.generateWarnings(climateState),
      [disasterManager, climateState]
    );

    useEffect(() => {
      const interval = setInterval(() => {
        const state = climateSystem.getState();
        setClimateHistory((prev) => {
          const newHistory = [
            ...prev,
            {
              timestamp: Date.now(),
              temperature: state.temperature,
              co2: state.co2Concentration,
              seaLevel: state.seaLevel,
            },
          ];
          return newHistory.slice(-100);
        });
      }, 5000);

      return () => clearInterval(interval);
    }, [climateSystem]);

    const seirStats = useMemo(() => {
      const stats = epidemicSystem.getStats();
      let susceptible = 1000;
      let exposed = 0;
      let infected = 0;
      let recovered = 0;
      let dead = 0;

      Object.values(stats).forEach((s) => {
        infected += s.infected;
        recovered += s.recovered;
        dead += s.dead;
      });

      susceptible = Math.max(0, 1000 - infected - recovered - dead);

      return { susceptible, exposed, infected, recovered, dead };
    }, [epidemicSystem]);

    const tabs = [
      { key: 'climate' as const, icon: '🌡️', label: '气候' },
      { key: 'disasters' as const, icon: '🔥', label: '灾害' },
      { key: 'epidemic' as const, icon: '🦠', label: '流行病' },
    ];

    return (
      <Panel
        title="环境系统"
        subtitle="气候 · 灾害 · 流行病"
        className={`environment-panel ${className}`}
        variant="glass"
        bordered
        glowing
      >
        <div className="environment-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`env-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="environment-content">
          {activeTab === 'climate' && (
            <div className="climate-tab">
              <EnvironmentMap
                climateState={climateState}
                disasters={disasters}
                infectionZones={infectionZones}
                width={300}
                height={180}
              />
              <ClimateIndicators
                temperature={climateState.temperature}
                co2={climateState.co2Concentration}
                seaLevel={climateState.seaLevel}
                precipitation={climateState.precipitation}
                extremeWeatherProb={climateState.extremeWeatherProbability}
              />
              <div className="climate-trend-section">
                <h4>气候变化趋势</h4>
                <ClimateTrendChart data={climateHistory} width={300} height={100} />
              </div>
            </div>
          )}

          {activeTab === 'disasters' && (
            <div className="disasters-tab">
              <DisasterWarningPanel warnings={warnings} />
              <ActiveDisastersList disasters={disasters} />
            </div>
          )}

          {activeTab === 'epidemic' && (
            <div className="epidemic-tab">
              <SEIRChart stats={seirStats} total={1000} />
              <div className="infection-map-section">
                <h4>感染区域分布</h4>
                <EnvironmentMap
                  climateState={climateState}
                  disasters={[]}
                  infectionZones={infectionZones}
                  width={300}
                  height={150}
                  showTemperature={false}
                  showSeaLevel={false}
                  showDisasters={false}
                  showInfection
                />
              </div>
            </div>
          )}
        </div>
      </Panel>
    );
  }
);

EnvironmentPanel.displayName = 'EnvironmentPanel';

/* ==========================================================================
   Hook: 环境系统状态
   ========================================================================== */

export function useEnvironmentState(
  climateSystem: ClimateSystem,
  disasterManager: DisasterManager,
  epidemicSystem: EpidemicSystem
) {
  const [state, setState] = useState({
    climate: climateSystem.getState(),
    disasters: disasterManager.getActiveDisasters(),
    warnings: [] as DisasterWarning[],
    seirStats: {
      susceptible: 1000,
      exposed: 0,
      infected: 0,
      recovered: 0,
      dead: 0,
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const climate = climateSystem.getState();
      const disasters = disasterManager.getActiveDisasters();
      const warnings = disasterManager.generateWarnings(climate);
      const stats = epidemicSystem.getStats();

      let susceptible = 1000;
      let infected = 0;
      let recovered = 0;
      let dead = 0;

      Object.values(stats).forEach((s) => {
        infected += s.infected;
        recovered += s.recovered;
        dead += s.dead;
      });

      susceptible = Math.max(0, 1000 - infected - recovered - dead);

      setState({
        climate,
        disasters,
        warnings,
        seirStats: { susceptible, exposed: 0, infected, recovered, dead },
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [climateSystem, disasterManager, epidemicSystem]);

  return state;
}

export default EnvironmentPanel;
