/**
 * =============================================================================
 * MiniMap 小地图 - 上帝视角
 * =============================================================================
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  memo,
} from 'react';

/* ==========================================================================
   类型定义
   ========================================================================== */

export interface MapMarker {
  id: string;
  x: number;
  y: number;
  type: 'citizen' | 'building' | 'event' | 'player' | 'poi';
  color?: string;
  icon?: string;
  label?: string;
  size?: number;
}

export interface MiniMapProps {
  width?: number;
  height?: number;
  markers?: MapMarker[];
  viewX?: number;
  viewY?: number;
  viewWidth?: number;
  viewHeight?: number;
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (x: number, y: number) => void;
  showViewRect?: boolean;
  showGrid?: boolean;
  className?: string;
}

/* ==========================================================================
   常量
   ========================================================================== */

const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 1000;

const MARKER_COLORS: Record<MapMarker['type'], string> = {
  citizen: '#00ff88',
  building: '#ffaa00',
  event: '#ff3333',
  player: '#00f0ff',
  poi: '#ff00ff',
};

/* ==========================================================================
   组件实现
   ========================================================================== */

export const MiniMap: React.FC<MiniMapProps> = memo(
  ({
    width = 150,
    height = 150,
    markers = [],
    viewX = 0,
    viewY = 0,
    viewWidth = 200,
    viewHeight = 200,
    onMarkerClick,
    onMapClick,
    showViewRect = true,
    showGrid = false,
    className = '',
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const scaleX = width / WORLD_WIDTH;
    const scaleY = height / WORLD_HEIGHT;

    // 渲染地图
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 清空画布
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      // 绘制网格
      if (showGrid) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.lineWidth = 0.5;
        const gridSize = 50 * scaleX;

        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // 绘制标记点
      markers.forEach((marker) => {
        const x = marker.x * scaleX;
        const y = marker.y * scaleY;
        const size = (marker.size ?? 3) * Math.min(scaleX, scaleY);
        const color = marker.color ?? MARKER_COLORS[marker.type];

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // 绘制发光效果
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 绘制标签
        if (marker.label) {
          ctx.fillStyle = color;
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(marker.label, x, y - size - 2);
        }

        ctx.globalAlpha = 1;
      });

      // 绘制视口矩形
      if (showViewRect) {
        const rectX = viewX * scaleX;
        const rectY = viewY * scaleY;
        const rectW = viewWidth * scaleX;
        const rectH = viewHeight * scaleY;

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.strokeRect(rectX, rectY, rectW, rectH);

        // 四角装饰
        const cornerSize = 4;
        ctx.fillStyle = '#00f0ff';
        ctx.globalAlpha = 0.8;

        // 左上角
        ctx.fillRect(rectX, rectY, cornerSize, 1);
        ctx.fillRect(rectX, rectY, 1, cornerSize);

        // 右上角
        ctx.fillRect(rectX + rectW - cornerSize, rectY, cornerSize, 1);
        ctx.fillRect(rectX + rectW - 1, rectY, 1, cornerSize);

        // 左下角
        ctx.fillRect(rectX, rectY + rectH - 1, cornerSize, 1);
        ctx.fillRect(rectX, rectY + rectH - cornerSize, 1, cornerSize);

        // 右下角
        ctx.fillRect(rectX + rectW - cornerSize, rectY + rectH - 1, cornerSize, 1);
        ctx.fillRect(rectX + rectW - 1, rectY + rectH - cornerSize, 1, cornerSize);

        ctx.globalAlpha = 1;
      }

      // 边框
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);
    }, [width, height, markers, viewX, viewY, viewWidth, viewHeight, showViewRect, showGrid, scaleX, scaleY]);

    // 处理点击
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scaleX;
        const y = (e.clientY - rect.top) / scaleY;

        // 检查是否点击了标记
        if (onMarkerClick) {
          const clickedMarker = markers.find((marker) => {
            const dx = marker.x - x;
            const dy = marker.y - y;
            return Math.sqrt(dx * dx + dy * dy) < (marker.size ?? 3) + 5;
          });

          if (clickedMarker) {
            onMarkerClick(clickedMarker);
            return;
          }
        }

        onMapClick?.(x, y);
      },
      [markers, onMarkerClick, onMapClick, scaleX, scaleY]
    );

    return (
      <div className={`minimap-container ${className}`}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="minimap-canvas"
          onClick={handleClick}
          role="img"
          aria-label="小地图"
        />
        <div className="minimap-overlay">
          <span className="minimap-label">MAP</span>
        </div>
      </div>
    );
  }
);

MiniMap.displayName = 'MiniMap';

/* ==========================================================================
   动态标记 Hook
   ========================================================================== */

export function useMapMarkers() {
  const [markers, setMarkers] = React.useState<MapMarker[]>([]);

  const addMarker = useCallback((marker: Omit<MapMarker, 'id'>) => {
    const id = `marker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMarkers((prev) => [...prev, { ...marker, id }]);
    return id;
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMarker = useCallback((id: string, updates: Partial<MapMarker>) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  const addCitizenMarkers = useCallback((citizens: Array<{ id: string; x: number; y: number; state?: string }>) => {
    setMarkers((prev) => [
      ...prev.filter((m) => m.type !== 'citizen'),
      ...citizens.map((c) => ({
        id: c.id,
        x: c.x,
        y: c.y,
        type: 'citizen' as const,
        color: c.state === 'active' ? '#00ff88' : c.state === 'background' ? '#ffaa00' : '#666',
        size: 2,
      })),
    ]);
  }, []);

  return {
    markers,
    addMarker,
    removeMarker,
    updateMarker,
    clearMarkers,
    addCitizenMarkers,
  };
}
