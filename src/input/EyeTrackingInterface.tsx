/**
 * =============================================================================
 * 永夜熵纪 - 眼动追踪界面组件
 * Eye Tracking UI Component
 * =============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EyeTracker, GazePoint, CalibrationStatus } from '@/input/EyeTracker';

interface EyeTrackingInterfaceProps {
  /** 是否启用 */
  enabled: boolean;
  /** 灵敏度 (0-1) */
  sensitivity?: number;
  /** 校准完成回调 */
  onCalibrated?: () => void;
  /** 注视点更新回调 */
  onGazeUpdate?: (point: GazePoint) => void;
}

/**
 * 眼动追踪界面组件
 */
export const EyeTrackingInterface: React.FC<EyeTrackingInterfaceProps> = ({
  enabled,
  sensitivity = 0.5,
  onCalibrated,
  onGazeUpdate,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<CalibrationStatus>({
    calibrated: false,
    progress: 0,
    pointCount: 0,
    failedCount: 0,
    maxFailures: 3,
  });
  const [gazePoint, setGazePoint] = useState<GazePoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  
  const trackerRef = useRef<EyeTracker | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  // 初始化追踪器
  useEffect(() => {
    if (!enabled) return;

    const initTracker = async () => {
      const tracker = new EyeTracker({
        confidenceThreshold: 0.5,
        calibrationPoints: 9,
        smoothingFactor: sensitivity,
      });

      const success = await tracker.init();
      
      if (success) {
        trackerRef.current = tracker;
        setIsInitialized(true);

        // 监听事件
        tracker.on('gaze', (point) => {
          setGazePoint(point);
          onGazeUpdate?.(point);
          
          // 更新光标位置
          if (cursorRef.current) {
            cursorRef.current.style.left = `${point.screenX * 100}%`;
            cursorRef.current.style.top = `${point.screenY * 100}%`;
          }
        });

        tracker.on('calibration', (status) => {
          setCalibrationStatus(status);
        });

        tracker.on('error', (err) => {
          setError(err.message);
        });
      } else {
        setError('眼动追踪初始化失败');
      }
    };

    initTracker();

    return () => {
      trackerRef.current?.dispose();
      trackerRef.current = null;
    };
  }, [enabled, sensitivity, onGazeUpdate]);

  // 启动/停止追踪
  useEffect(() => {
    if (!isInitialized || !trackerRef.current) return;

    if (enabled) {
      trackerRef.current.start();
    } else {
      trackerRef.current.stop();
    }

    return () => {
      trackerRef.current?.stop();
    };
  }, [enabled, isInitialized]);

  // 开始校准
  const startCalibration = useCallback(async () => {
    if (!trackerRef.current || isCalibrating) return;

    setIsCalibrating(true);
    setError(null);

    try {
      await trackerRef.current.startCalibration();
      onCalibrated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '校准失败');
    } finally {
      setIsCalibrating(false);
    }
  }, [isCalibrating, onCalibrated]);

  // 切换覆盖层
  const toggleOverlay = useCallback(() => {
    setShowOverlay(prev => !prev);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div className="eye-tracking-interface">
      {/* 控制面板 */}
      <div className="eye-tracking-controls p-4 bg-black/50 backdrop-blur-sm rounded-lg border border-cyan-500/30">
        <h3 className="text-cyan-400 text-sm font-bold mb-2">
          眼动追踪
        </h3>

        {/* 状态 */}
        <div className="status mb-2 text-xs text-gray-400">
          <div>状态: {isInitialized ? '已初始化' : '初始化中...'}</div>
          <div>
            校准: {calibrationStatus.calibrated ? '已完成' : `进行中 ${Math.round(calibrationStatus.progress * 100)}%`}
          </div>
        </div>

        {/* 按钮 */}
        <div className="buttons flex gap-2">
          <button
            onClick={startCalibration}
            disabled={!isInitialized || isCalibrating}
            className="px-3 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 rounded transition-colors"
          >
            {isCalibrating ? '校准中...' : '开始校准'}
          </button>
          
          <button
            onClick={toggleOverlay}
            className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded transition-colors"
          >
            {showOverlay ? '隐藏覆盖' : '显示覆盖'}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="error mt-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* 校准覆盖层 */}
      {showOverlay && isCalibrating && calibrationStatus.currentPoint && (
        <div className="calibration-overlay fixed inset-0 z-50 pointer-events-none">
          {/* 校准点 */}
          <div
            className="calibration-point absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-cyan-400 animate-pulse"
            style={{
              left: `${calibrationStatus.currentPoint.x * 100}%`,
              top: `${calibrationStatus.currentPoint.y * 100}%`,
            }}
          />
          
          {/* 进度条 */}
          <div className="progress-bar absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${calibrationStatus.progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 注视点光标 */}
      {showOverlay && gazePoint && (
        <div
          ref={cursorRef}
          className="gaze-cursor fixed w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-cyan-400 pointer-events-none z-40"
          style={{
            boxShadow: '0 0 10px rgba(0, 255, 249, 0.5)',
          }}
        />
      )}
    </div>
  );
};

export default EyeTrackingInterface;
