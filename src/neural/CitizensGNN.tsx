/**
 * 市民 GNN 可视化组件
 * 使用 WebGPU 渲染市民情感关系网络
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { SentimentState, SentimentDimension, SentimentAnalysis } from './SentimentNetwork';

/**
 * 组件属性
 */
export interface CitizensGNNProps {
  /** 市民情感状态列表 */
  sentiments: SentimentState[];
  /** 社交关系列表 */
  relations?: Array<{
    source: string;
    target: string;
    intimacy: number;
  }>;
  /** 情感分析结果 */
  analysis?: SentimentAnalysis;
  /** 是否启用 WebGPU 渲染 */
  useWebGPU?: boolean;
  /** 显示模式 */
  mode: 'network' | 'radar' | 'heatmap' | 'timeline';
  /** 选中市民 ID */
  selectedCitizenId?: string;
  /** 选中回调 */
  onCitizenSelect?: (citizenId: string) => void;
  /** 缩放级别 */
  zoom?: number;
  /** 类名 */
  className?: string;
}

/**
 * 节点位置
 */
interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * 情感颜色映射
 */
const EMOTION_COLORS: Record<SentimentDimension, string> = {
  happiness: '#4ade80',
  anger: '#f87171',
  fear: '#a78bfa',
  sadness: '#60a5fa',
  surprise: '#fbbf24',
  disgust: '#f472b6',
  trust: '#34d399',
  anticipation: '#fb923c',
};

/**
 * CitizensGNN 组件
 */
export const CitizensGNN: React.FC<CitizensGNNProps> = ({
  sentiments,
  relations = [],
  analysis,
  useWebGPU = false,
  mode,
  selectedCitizenId,
  onCitizenSelect,
  zoom = 1,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const animationRef = useRef<number>(0);

  // 维度列表
  const DIMENSIONS: SentimentDimension[] = [
    'happiness', 'anger', 'fear', 'sadness',
    'surprise', 'disgust', 'trust', 'anticipation'
  ];

  // 初始化节点位置
  useEffect(() => {
    const positions = new Map<string, NodePosition>();
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    sentiments.forEach((sentiment, index) => {
      const angle = (index / sentiments.length) * Math.PI * 2;
      positions.set(sentiment.citizenId, {
        id: sentiment.citizenId,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      });
    });

    setNodePositions(positions);
  }, [sentiments.length, dimensions]);

  // 更新尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 力导向布局动画
  useEffect(() => {
    if (mode !== 'network') return;

    const animate = () => {
      setNodePositions(prevPositions => {
        const newPositions = new Map(prevPositions);
        const repulsion = 5000;
        const attraction = 0.01;
        const damping = 0.9;
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        // 计算排斥力
        const nodeIds = Array.from(newPositions.keys());
        for (let i = 0; i < nodeIds.length; i++) {
          for (let j = i + 1; j < nodeIds.length; j++) {
            const posA = newPositions.get(nodeIds[i])!;
            const posB = newPositions.get(nodeIds[j])!;

            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            const force = repulsion / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            posA.vx -= fx;
            posA.vy -= fy;
            posB.vx += fx;
            posB.vy += fy;
          }
        }

        // 计算吸引力
        for (const relation of relations) {
          const posA = newPositions.get(relation.source);
          const posB = newPositions.get(relation.target);
          if (!posA || !posB) continue;

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = dist * attraction * relation.intimacy;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          posA.vx += fx;
          posA.vy += fy;
          posB.vx -= fx;
          posB.vy -= fy;
        }

        // 向心力
        for (const pos of newPositions.values()) {
          const dx = centerX - pos.x;
          const dy = centerY - pos.y;
          pos.vx += dx * 0.001;
          pos.vy += dy * 0.001;

          // 更新位置
          pos.vx *= damping;
          pos.vy *= damping;
          pos.x += pos.vx;
          pos.y += pos.vy;

          // 边界约束
          pos.x = Math.max(50, Math.min(dimensions.width - 50, pos.x));
          pos.y = Math.max(50, Math.min(dimensions.height - 50, pos.y));
        }

        return newPositions;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, [mode, relations, dimensions]);

  // 渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    if (mode === 'network') {
      renderNetwork(ctx);
    } else if (mode === 'radar') {
      renderRadar(ctx);
    } else if (mode === 'heatmap') {
      renderHeatmap(ctx);
    } else if (mode === 'timeline') {
      renderTimeline(ctx);
    }
  }, [mode, sentiments, relations, nodePositions, dimensions, analysis, hoveredNode, selectedCitizenId]);

  // 渲染网络图
  const renderNetwork = useCallback((ctx: CanvasRenderingContext2D) => {
    // 绘制边
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (const relation of relations) {
      const posA = nodePositions.get(relation.source);
      const posB = nodePositions.get(relation.target);
      if (!posA || !posB) continue;

      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${relation.intimacy * 0.3})`;
      ctx.stroke();
    }

    // 绘制节点
    for (const sentiment of sentiments) {
      const pos = nodePositions.get(sentiment.citizenId);
      if (!pos) continue;

      const isSelected = selectedCitizenId === sentiment.citizenId;
      const isHovered = hoveredNode === sentiment.citizenId;
      const size = isSelected || isHovered ? 16 : 12;

      // 获取情感颜色
      const emotionColor = getEmotionColor(sentiment.emotions);

      // 绘制圆形
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = emotionColor;
      ctx.fill();

      // 选中效果
      if (isSelected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // 悬停效果
      if (isHovered) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [sentiments, relations, nodePositions, selectedCitizenId, hoveredNode]);

  // 获取情感颜色
  const getEmotionColor = (emotions: Record<SentimentDimension, number>): string => {
    // 找到主导情感
    let maxEmotion: SentimentDimension = 'happiness';
    let maxValue = -Infinity;

    for (const [emotion, value] of Object.entries(emotions)) {
      if (value > maxValue) {
        maxValue = value;
        maxEmotion = emotion as SentimentDimension;
      }
    }

    return EMOTION_COLORS[maxEmotion];
  };

  // 渲染雷达图
  const renderRadar = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!analysis) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    // 绘制背景多边形
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      ctx.beginPath();
      for (let j = 0; j < DIMENSIONS.length; j++) {
        const angle = (j / DIMENSIONS.length) * Math.PI * 2 - Math.PI / 2;
        const r = radius * (i / 5);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 绘制轴
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < DIMENSIONS.length; i++) {
      const angle = (i / DIMENSIONS.length) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.stroke();

      // 标签
      ctx.fillStyle = '#fff';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        DIMENSIONS[i],
        centerX + Math.cos(angle) * (radius + 20),
        centerY + Math.sin(angle) * (radius + 20)
      );
    }

    // 绘制数据多边形
    ctx.beginPath();
    for (let i = 0; i < DIMENSIONS.length; i++) {
      const value = analysis.sentimentDistribution[DIMENSIONS[i]];
      const angle = (i / DIMENSIONS.length) * Math.PI * 2 - Math.PI / 2;
      const r = radius * value;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [analysis, dimensions]);

  // 渲染热力图
  const renderHeatmap = useCallback((ctx: CanvasRenderingContext2D) => {
    const cols = DIMENSIONS.length;
    const rows = Math.ceil(sentiments.length / cols);
    const cellWidth = dimensions.width / cols;
    const cellHeight = dimensions.height / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index >= sentiments.length) continue;

        const sentiment = sentiments[index];
        const value = sentiment.overallSentiment; // -1 到 1
        const color = getSentimentColor(value);

        ctx.fillStyle = color;
        ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth - 2, cellHeight - 2);

        // 显示市民ID
        ctx.fillStyle = '#fff';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(
          sentiment.citizenId.slice(-4),
          col * cellWidth + cellWidth / 2,
          row * cellHeight + cellHeight / 2
        );
      }
    }
  }, [sentiments, dimensions]);

  // 获取情感值对应的颜色
  const getSentimentColor = (value: number): string => {
    // -1 (红) -> 0 (灰) -> 1 (绿)
    const normalized = (value + 1) / 2;
    if (normalized > 0.5) {
      const g = Math.round(255 * (normalized - 0.5) * 2);
      return `rgb(${255 - g}, ${g}, 0)`;
    } else {
      const r = Math.round(255 * (1 - normalized) * 2);
      return `rgb(${r}, 0, 0)`;
    }
  };

  // 渲染时间线
  const renderTimeline = useCallback((ctx: CanvasRenderingContext2D) => {
    if (sentiments.length === 0) return;

    const padding = 50;
    const graphWidth = dimensions.width - padding * 2;
    const graphHeight = dimensions.height - padding * 2;
    const lineHeight = graphHeight / sentiments.length;

    // 绘制背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(padding, padding, graphWidth, graphHeight);

    // 绘制中心线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding + graphWidth / 2, padding);
    ctx.lineTo(padding + graphWidth / 2, padding + graphHeight);
    ctx.stroke();

    // 绘制每个市民的情感线
    sentiments.forEach((sentiment, index) => {
      const y = padding + index * lineHeight + lineHeight / 2;

      // 绘制标签
      ctx.fillStyle = '#fff';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(sentiment.citizenId.slice(-6), padding - 5, y + 4);

      // 绘制情感点
      const x = padding + graphWidth / 2 + sentiment.overallSentiment * (graphWidth / 2);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = getSentimentColor(sentiment.overallSentiment);
      ctx.fill();

      // 绘制强度条
      const barWidth = sentiment.intensity * 20;
      ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
      ctx.fillRect(x, y - 2, barWidth, 4);
    });
  }, [sentiments, dimensions]);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundNode: string | null = null;

    for (const [nodeId, pos] of nodePositions) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) {
        foundNode = nodeId;
        break;
      }
    }

    setHoveredNode(foundNode);
    canvas.style.cursor = foundNode ? 'pointer' : 'default';
  }, [nodePositions]);

  // 点击处理
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onCitizenSelect) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const [nodeId, pos] of nodePositions) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) {
        onCitizenSelect(nodeId);
        break;
      }
    }
  }, [nodePositions, onCitizenSelect]);

  // 选中的市民信息
  const selectedSentiment = useMemo(() => {
    if (!selectedCitizenId) return null;
    return sentiments.find(s => s.citizenId === selectedCitizenId) || null;
  }, [selectedCitizenId, sentiments]);

  return (
    <div ref={containerRef} className={`citizens-gnn ${className || ''}`} style={styles.container}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={styles.canvas}
      />

      {/* 悬停信息 */}
      {hoveredNode && (
        <div style={styles.tooltip}>
          <div style={styles.tooltipTitle}>{hoveredNode}</div>
        </div>
      )}

      {/* 选中市民详情 */}
      {selectedSentiment && (
        <div style={styles.detailPanel}>
          <div style={styles.detailTitle}>{selectedSentiment.citizenId}</div>
          <div style={styles.detailRow}>
            <span>综合情感:</span>
            <span style={{ color: getSentimentColor(selectedSentiment.overallSentiment) }}>
              {selectedSentiment.overallSentiment.toFixed(2)}
            </span>
          </div>
          <div style={styles.detailRow}>
            <span>强度:</span>
            <span>{selectedSentiment.intensity.toFixed(2)}</span>
          </div>
          <div style={styles.detailRow}>
            <span>稳定性:</span>
            <span>{selectedSentiment.stability.toFixed(2)}</span>
          </div>
          <div style={styles.detailRow}>
            <span>趋势:</span>
            <span>{selectedSentiment.trend === 'rising' ? '↑' : selectedSentiment.trend === 'falling' ? '↓' : '→'}</span>
          </div>
        </div>
      )}

      {/* 图例 */}
      <div style={styles.legend}>
        <div style={styles.legendTitle}>情感颜色</div>
        {DIMENSIONS.map(dim => (
          <div key={dim} style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: EMOTION_COLORS[dim] }} />
            <span>{dim}</span>
          </div>
        ))}
      </div>

      {/* 统计信息 */}
      {analysis && (
        <div style={styles.stats}>
          <div>市民数: {sentiments.length}</div>
          <div>关系数: {relations.length}</div>
          <div>平均情感: {analysis.averageSentiment.toFixed(2)}</div>
          <div>波动指数: {analysis.volatilityIndex.toFixed(2)}</div>
          <div>主导情感: {analysis.dominantEmotion}</div>
        </div>
      )}
    </div>
  );
};

/**
 * 样式
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 400,
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
  },
  tooltip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: '8px 12px',
    borderRadius: 6,
    color: '#fff',
    fontSize: 12,
    pointerEvents: 'none',
  },
  tooltipTitle: {
    fontWeight: 600,
  },
  detailPanel: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    color: '#fff',
    minWidth: 150,
  },
  detailTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 14,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    marginBottom: 4,
  },
  legend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    color: '#fff',
    fontSize: 10,
  },
  legendTitle: {
    fontWeight: 600,
    marginBottom: 6,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  stats: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    color: '#fff',
    fontSize: 11,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
};

export default CitizensGNN;
