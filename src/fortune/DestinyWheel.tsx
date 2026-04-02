/**
 * =============================================================================
 * 命运之轮 - 可视化八字命盘
 * =============================================================================
 */

import React, { memo } from 'react';
import { EightCharactersAnalysis } from './EightCharactersCalculator';

export interface DestinyAspect {
  name: string;
  value: number;
  color: string;
}

export interface DestinyWheelProps {
  analysis: EightCharactersAnalysis;
  size?: number;
  className?: string;
}

/**
 * 命运之轮组件 - 可视化命盘信息
 */
export const DestinyWheel: React.FC<DestinyWheelProps> = memo(({
  analysis,
  size = 300,
  className = '',
}) => {
  const { eightChars, wuxingDistribution, strengthAnalysis } = analysis;
  const center = size / 2;
  const radius = size / 2 - 20;

  // 计算各象限的分数
  const aspects: DestinyAspect[] = [
    { name: '木', value: wuxingDistribution['木'], color: '#00ff88' },
    { name: '火', value: wuxingDistribution['火'], color: '#ff4444' },
    { name: '土', value: wuxingDistribution['土'], color: '#daa520' },
    { name: '金', value: wuxingDistribution['金'], color: '#ffd700' },
    { name: '水', value: wuxingDistribution['水'], color: '#00bfff' },
  ];

  return (
    <div className={`destiny-wheel ${className}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        {/* 外圈 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          opacity="0.3"
        />
        
        {/* 内圈 */}
        <circle
          cx={center}
          cy={center}
          r={radius * 0.6}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="1"
          opacity="0.2"
        />

        {/* 五行弧线 */}
        {aspects.map((aspect, index) => {
          const angle = (index * 72 - 90) * (Math.PI / 180);
          const nextAngle = ((index + 1) * 72 - 90) * (Math.PI / 180);
          const value = Math.max(0.1, aspect.value / 10);
          
          const x1 = center + Math.cos(angle) * radius;
          const y1 = center + Math.sin(angle) * radius;
          const x2 = center + Math.cos(nextAngle) * radius;
          const y2 = center + Math.sin(nextAngle) * radius;
          
          // 弧线路径
          const arcRadius = radius * (1 - value * 0.3);
          const midAngle = (angle + nextAngle) / 2;
          const midX = center + Math.cos(midAngle) * arcRadius;
          const midY = center + Math.sin(midAngle) * arcRadius;
          
          return (
            <g key={aspect.name}>
              <path
                d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                fill="none"
                stroke={aspect.color}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.6"
              />
              {/* 标签 */}
              <text
                x={center + Math.cos(midAngle) * (radius + 12)}
                y={center + Math.sin(midAngle) * (radius + 12)}
                fill={aspect.color}
                fontSize="12"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {aspect.name}
              </text>
              <text
                x={center + Math.cos(midAngle) * (radius + 28)}
                y={center + Math.sin(midAngle) * (radius + 28)}
                fill="var(--color-text-muted)"
                fontSize="10"
                textAnchor="middle"
              >
                {aspect.value.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* 中心信息 */}
        <circle
          cx={center}
          cy={center}
          r={radius * 0.35}
          fill="var(--color-bg-surface)"
          stroke="var(--color-primary)"
          strokeWidth="1"
          opacity="0.8"
        />
        
        <text
          x={center}
          y={center - 8}
          fill="var(--color-primary)"
          fontSize="14"
          fontFamily="var(--font-display)"
          textAnchor="middle"
        >
          {eightChars.day.stem}{eightChars.day.branch}
        </text>
        
        <text
          x={center}
          y={center + 12}
          fill="var(--color-text-muted)"
          fontSize="10"
          textAnchor="middle"
        >
          {strengthAnalysis.verdict}
        </text>

        {/* 四柱标注 */}
        {[
          { label: '年', pillar: eightChars.year, angle: -45 },
          { label: '月', pillar: eightChars.month, angle: 45 },
          { label: '日', pillar: eightChars.day, angle: 135 },
          { label: '时', pillar: eightChars.hour, angle: -135 },
        ].map(({ label, pillar, angle }) => {
          const rad = angle * (Math.PI / 180);
          const x = center + Math.cos(rad) * (radius * 0.75);
          const y = center + Math.sin(rad) * (radius * 0.75);
          
          return (
            <g key={label}>
              <circle
                cx={x}
                cy={y}
                r={18}
                fill="var(--color-bg-elevated)"
                stroke="var(--color-primary)"
                strokeWidth="1"
                opacity="0.9"
              />
              <text
                x={x}
                y={y}
                fill="var(--color-text-primary)"
                fontSize="12"
                fontFamily="var(--font-display)"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {pillar.stem}{pillar.branch}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

DestinyWheel.displayName = 'DestinyWheel';
