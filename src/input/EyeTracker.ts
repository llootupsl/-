/**
 * =============================================================================
 * 永夜熵纪 - 眼动追踪模块
 * Eye Tracking Module using MediaPipe Face Mesh
 * =============================================================================
 * 
 * 实现基于 MediaPipe Face Mesh 的眼动追踪系统：
 * - 瞳孔检测
 * - 注视点估计
 * - 校准系统
 */

import { EventEmitter } from 'eventemitter3';
import { logger } from '@/core/utils/Logger';

/** MediaPipe FaceMesh 类型声明 */
interface FaceMeshLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface FaceMeshResults {
  multiFaceLandmarks?: FaceMeshLandmark[][];
}

interface FaceMeshInstance {
  setOptions(options: {
    maxNumFaces?: number;
    refineLandmarks?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }): Promise<void>;
  onResults(callback: (results: FaceMeshResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

interface FaceMeshConstructor {
  new (config: { locateFile: (file: string) => string }): FaceMeshInstance;
}

declare global {
  interface Window {
    FaceMesh?: FaceMeshConstructor;
  }
}

/** 眼动追踪事件 */
export interface EyeTrackingEvents {
  /** 注视点更新 */
  gaze: (point: GazePoint) => void;
  /** 瞳孔检测 */
  pupil: (data: PupilData) => void;
  /** 眨眼检测 */
  blink: (eye: 'left' | 'right') => void;
  /** 校准状态变化 */
  calibration: (status: CalibrationStatus) => void;
  /** 错误 */
  error: (error: Error) => void;
}

/** 注视点数据 */
export interface GazePoint {
  /** 屏幕坐标 (归一化 0-1) */
  screenX: number;
  screenY: number;
  /** 3D 世界坐标 (可选) */
  worldX?: number;
  worldY?: number;
  worldZ?: number;
  /** 置信度 */
  confidence: number;
  /** 时间戳 */
  timestamp: number;
}

/** 瞳孔数据 */
export interface PupilData {
  eye: 'left' | 'right';
  /** 瞳孔中心 (图像坐标) */
  centerX: number;
  centerY: number;
  /** 瞳孔直径 (像素) */
  diameter: number;
  /** 瞳孔相对位置 (归一化) */
  relativeX: number;
  relativeY: number;
  /** 置信度 */
  confidence: number;
  /** 时间戳 */
  timestamp: number;
}

/** 校准状态 */
export interface CalibrationStatus {
  calibrated: boolean;
  progress: number;
  pointCount: number;
  currentPoint?: { x: number; y: number };
  error?: number;
  failedCount: number;
  maxFailures: number;
}

export interface EyeTrackerConfig {
  confidenceThreshold: number;
  calibrationPoints: number;
  sampleRate: number;
  smoothingFactor: number;
  enableBlinkDetection: boolean;
  blinkThreshold: number;
  maxCalibrationFailures: number;
  enableManualCalibration: boolean;
  skipCalibrationAllowed: boolean;
}

/** 默认配置 */
const DEFAULT_CONFIG: EyeTrackerConfig = {
  confidenceThreshold: 0.5,
  calibrationPoints: 9,
  sampleRate: 30,
  smoothingFactor: 0.3,
  enableBlinkDetection: true,
  blinkThreshold: 150,
  maxCalibrationFailures: 3,
  enableManualCalibration: true,
  skipCalibrationAllowed: true,
};

interface CalibrationData {
  screenPoints: Array<{ x: number; y: number }>;
  pupilPoints: Array<{ left: { x: number; y: number }; right: { x: number; y: number } }>;
  transformMatrix: number[] | null;
}

/** Face Mesh 关键点索引 */
const FACE_MESH_LANDMARKS = {
  // 左眼
  LEFT_EYE_INNER: 133,
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  LEFT_IRIS_CENTER: 468,
  LEFT_PUPIL: 473,
  
  // 右眼
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  RIGHT_IRIS_CENTER: 473,
  RIGHT_PUPIL: 468,
  
  // 面部参考点
  NOSE_TIP: 1,
  FOREHEAD: 10,
  CHIN: 152,
};

/**
 * 眼动追踪器
 * 
 * 使用 MediaPipe Face Mesh 进行高精度眼动追踪
 */
export class EyeTracker extends EventEmitter<EyeTrackingEvents> {
  private config: EyeTrackerConfig;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  private faceMesh: FaceMeshInstance | null = null;
  private camera: unknown = null;
  
  private isRunning: boolean = false;
  private isCalibrating: boolean = false;
  private isDisabled: boolean = false;
  private calibrationData: CalibrationData;
  private calibrationStatus: CalibrationStatus;
  private calibrationFailureCount: number = 0;
  private manualCalibrationPoints: Array<{ screen: { x: number; y: number }; pupil: { left: { x: number; y: number }; right: { x: number; y: number } } }> = [];
  
  private lastGazePoint: GazePoint | null = null;
  private lastPupilData: { left: PupilData | null; right: PupilData | null } = {
    left: null,
    right: null,
  };
  
  private lastEyeOpenTime: { left: number; right: number } = {
    left: 0,
    right: 0,
  };
  private eyeClosedFrames: { left: number; right: number } = {
    left: 0,
    right: 0,
  };

  private detectionRafId: number | null = null;

  constructor(config: Partial<EyeTrackerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.calibrationData = {
      screenPoints: [],
      pupilPoints: [],
      transformMatrix: null,
    };
    
    this.calibrationStatus = {
      calibrated: false,
      progress: 0,
      pointCount: 0,
      failedCount: 0,
      maxFailures: this.config.maxCalibrationFailures,
    };
  }

  public disable(): void {
    this.isDisabled = true;
    this.stop();
    logger.info('EyeTracker', '已禁用');
  }

  public enable(): void {
    this.isDisabled = false;
    logger.info('EyeTracker', '已启用');
  }

  public isTrackerDisabled(): boolean {
    return this.isDisabled;
  }

  public canSkipCalibration(): boolean {
    return this.config.skipCalibrationAllowed;
  }

  public skipCalibration(): boolean {
    if (!this.config.skipCalibrationAllowed) {
      logger.warn('EyeTracker', '不允许跳过校准');
      return false;
    }
    
    this.calibrationStatus.calibrated = false;
    this.calibrationStatus.progress = 1;
    this.calibrationStatus.failedCount = 0;
    logger.info('EyeTracker', '已跳过校准，将使用未校准的注视点');
    return true;
  }

  public getCalibrationFailureCount(): number {
    return this.calibrationFailureCount;
  }

  public resetCalibrationFailures(): void {
    this.calibrationFailureCount = 0;
    this.calibrationStatus.failedCount = 0;
  }

  public addManualCalibrationPoint(screenX: number, screenY: number): boolean {
    if (!this.config.enableManualCalibration) {
      logger.warn('EyeTracker', '手动校准未启用');
      return false;
    }

    const { left, right } = this.lastPupilData;
    if (!left || !right) {
      logger.warn('EyeTracker', '无法获取瞳孔数据，请确保追踪已启动');
      return false;
    }

    this.manualCalibrationPoints.push({
      screen: { x: screenX, y: screenY },
      pupil: {
        left: { x: left.relativeX, y: left.relativeY },
        right: { x: right.relativeX, y: right.relativeY },
      },
    });

    this.calibrationData.screenPoints.push({ x: screenX, y: screenY });
    this.calibrationData.pupilPoints.push({
      left: { x: left.relativeX, y: left.relativeY },
      right: { x: right.relativeX, y: right.relativeY },
    });

    this.calibrationStatus.pointCount = this.calibrationData.screenPoints.length;
    this.calibrationStatus.progress = Math.min(1, this.calibrationStatus.pointCount / this.config.calibrationPoints);

    if (this.calibrationData.screenPoints.length >= 4) {
      this.computeTransformMatrix();
      this.calibrationStatus.calibrated = true;
    }

    this.emit('calibration', { ...this.calibrationStatus });
    logger.info('EyeTracker', `手动校准点已添加 (${this.calibrationStatus.pointCount}/${this.config.calibrationPoints})`);
    return true;
  }

  public clearManualCalibration(): void {
    this.manualCalibrationPoints = [];
    this.calibrationData.screenPoints = [];
    this.calibrationData.pupilPoints = [];
    this.calibrationData.transformMatrix = null;
    this.calibrationStatus.calibrated = false;
    this.calibrationStatus.progress = 0;
    this.calibrationStatus.pointCount = 0;
    this.calibrationStatus.failedCount = 0;
    this.calibrationFailureCount = 0;
    this.emit('calibration', { ...this.calibrationStatus });
    logger.info('EyeTracker', '手动校准数据已清除');
  }

  /**
   * 初始化眼动追踪
   */
  public async init(): Promise<boolean> {
    try {
      // 检查 MediaPipe 可用性
      if (!this.isMediaPipeAvailable()) {
        logger.warn('EyeTracker', 'MediaPipe not available, using fallback');
        return this.initFallback();
      }

      // 创建视频元素
      this.video = document.createElement('video');
      this.video.setAttribute('playsinline', 'true');
      this.video.setAttribute('autoplay', 'true');
      this.video.muted = true;

      // 创建 Canvas
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');

      // 初始化 MediaPipe Face Mesh
      await this.initFaceMesh();

      logger.info('EyeTracker', 'Initialized successfully');
      return true;
    } catch (error) {
      logger.error('EyeTracker', 'Init failed', error instanceof Error ? error : new Error(String(error)));
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * 检查 MediaPipe 可用性
   */
  private isMediaPipeAvailable(): boolean {
    return typeof window.FaceMesh !== 'undefined';
  }

  /**
   * 初始化回退模式
   */
  private initFallback(): boolean {
    logger.info('EyeTracker', 'Using mouse fallback mode');
    return true;
  }

  /**
   * 初始化 Face Mesh
   */
  private async initFaceMesh(): Promise<void> {
    const FaceMesh = window.FaceMesh;
    
    if (!FaceMesh) {
      throw new Error('FaceMesh not loaded');
    }

    this.faceMesh = new FaceMesh({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    if (typeof this.faceMesh.setOptions === 'function') {
      await this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } else {
      logger.warn('EyeTracker', 'FaceMesh.setOptions unavailable, continuing with defaults');
    }

    if (typeof this.faceMesh.onResults === 'function') {
      this.faceMesh.onResults(this.onFaceMeshResults.bind(this));
    }
  }

  /**
   * 启动追踪
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      // 请求摄像头
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      if (this.video) {
        this.video.srcObject = stream;
        await this.video.play();
      }

      // 启动检测循环
      this.isRunning = true;
      this.startDetectionLoop();

      logger.info('EyeTracker', 'Started tracking');
    } catch (error) {
      logger.error('EyeTracker', 'Start failed', error instanceof Error ? error : new Error(String(error)));
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 停止追踪
   */
  public stop(): void {
    this.isRunning = false;

    if (this.detectionRafId !== null) {
      cancelAnimationFrame(this.detectionRafId);
      this.detectionRafId = null;
    }

    if (this.video?.srcObject) {
      const tracks = (this.video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }

    logger.info('EyeTracker', 'Stopped tracking');
  }

  /**
   * 检测循环
   */
  private startDetectionLoop(): void {
    const detect = async () => {
      if (!this.isRunning) return;

      if (this.faceMesh && this.video && this.video.readyState >= 2) {
        await this.faceMesh.send({ image: this.video });
      }

      this.detectionRafId = requestAnimationFrame(detect);
    };

    detect();
  }

  /**
   * 处理 Face Mesh 结果
   */
  private onFaceMeshResults(results: FaceMeshResults): void {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    
    // 检测瞳孔
    this.detectPupils(landmarks);
    
    // 检测眨眼
    if (this.config.enableBlinkDetection) {
      this.detectBlink(landmarks);
    }
    
    // 计算注视点
    this.computeGazePoint(landmarks);
  }

  /**
   * 检测瞳孔
   */
  private detectPupils(landmarks: FaceMeshLandmark[]): void {
    const timestamp = performance.now();

    // 左眼
    const leftPupil = this.extractPupilData(landmarks, 'left', timestamp);
    if (leftPupil) {
      this.lastPupilData.left = leftPupil;
      this.emit('pupil', leftPupil);
    }

    // 右眼
    const rightPupil = this.extractPupilData(landmarks, 'right', timestamp);
    if (rightPupil) {
      this.lastPupilData.right = rightPupil;
      this.emit('pupil', rightPupil);
    }
  }

  /**
   * 提取瞳孔数据
   */
  private extractPupilData(
    landmarks: FaceMeshLandmark[],
    eye: 'left' | 'right',
    timestamp: number
  ): PupilData | null {
    const isLeft = eye === 'left';
    
    // 瞳孔中心
    const pupilIdx = isLeft ? FACE_MESH_LANDMARKS.LEFT_PUPIL : FACE_MESH_LANDMARKS.RIGHT_PUPIL;
    const pupil = landmarks[pupilIdx];
    
    if (!pupil) return null;

    // 眼睛边界
    const inner = landmarks[isLeft ? FACE_MESH_LANDMARKS.LEFT_EYE_INNER : FACE_MESH_LANDMARKS.RIGHT_EYE_INNER];
    const outer = landmarks[isLeft ? FACE_MESH_LANDMARKS.LEFT_EYE_OUTER : FACE_MESH_LANDMARKS.RIGHT_EYE_OUTER];
    const top = landmarks[isLeft ? FACE_MESH_LANDMARKS.LEFT_EYE_TOP : FACE_MESH_LANDMARKS.RIGHT_EYE_TOP];
    const bottom = landmarks[isLeft ? FACE_MESH_LANDMARKS.LEFT_EYE_BOTTOM : FACE_MESH_LANDMARKS.RIGHT_EYE_BOTTOM];

    if (!inner || !outer || !top || !bottom) return null;

    // 计算瞳孔相对位置
    const eyeWidth = Math.sqrt(
      Math.pow(outer.x - inner.x, 2) + Math.pow(outer.y - inner.y, 2)
    );
    const eyeHeight = Math.sqrt(
      Math.pow(bottom.x - top.x, 2) + Math.pow(bottom.y - top.y, 2)
    );

    const relativeX = (pupil.x - inner.x) / eyeWidth;
    const relativeY = (pupil.y - top.y) / eyeHeight;

    // 瞳孔直径估算
    const irisIdx = isLeft ? FACE_MESH_LANDMARKS.LEFT_IRIS_CENTER : FACE_MESH_LANDMARKS.RIGHT_IRIS_CENTER;
    const iris = landmarks[irisIdx];
    const diameter = iris ? eyeWidth * 0.8 : eyeWidth * 0.5;

    // 置信度（基于关键点可见性）
    const confidence = Math.min(
      pupil.visibility || 0.5,
      inner.visibility || 0.5,
      outer.visibility || 0.5
    );

    return {
      eye,
      centerX: pupil.x,
      centerY: pupil.y,
      diameter,
      relativeX,
      relativeY,
      confidence,
      timestamp,
    };
  }

  /**
   * 检测眨眼
   */
  private detectBlink(landmarks: FaceMeshLandmark[]): void {
    const now = performance.now();

    // 计算眼睛纵横比 (EAR)
    const leftEAR = this.calculateEar(landmarks, 'left');
    const rightEAR = this.calculateEar(landmarks, 'right');

    const blinkThreshold = 0.2;

    // 左眼
    if (leftEAR < blinkThreshold) {
      this.eyeClosedFrames.left++;
      if (this.eyeClosedFrames.left === 1) {
        this.lastEyeOpenTime.left = now;
      }
    } else {
      if (this.eyeClosedFrames.left > 0) {
        const blinkDuration = now - this.lastEyeOpenTime.left;
        if (blinkDuration < this.config.blinkThreshold) {
          this.emit('blink', 'left');
        }
      }
      this.eyeClosedFrames.left = 0;
    }

    // 右眼
    if (rightEAR < blinkThreshold) {
      this.eyeClosedFrames.right++;
      if (this.eyeClosedFrames.right === 1) {
        this.lastEyeOpenTime.right = now;
      }
    } else {
      if (this.eyeClosedFrames.right > 0) {
        const blinkDuration = now - this.lastEyeOpenTime.right;
        if (blinkDuration < this.config.blinkThreshold) {
          this.emit('blink', 'right');
        }
      }
      this.eyeClosedFrames.right = 0;
    }
  }

  /**
   * 计算眼睛纵横比
   */
  private calculateEar(landmarks: FaceMeshLandmark[], eye: 'left' | 'right'): number {
    const isLeft = eye === 'left';
    
    const top = landmarks[isLeft ? FACE_MESH_LANDMARKS.LEFT_EYE_TOP : FACE_MESH_LANDMARKS.RIGHT_EYE_TOP];
    const bottom = landmarks[isLeft ? FACE_MESH_LANDMARKS.LEFT_EYE_BOTTOM : FACE_MESH_LANDMARKS.RIGHT_EYE_BOTTOM];
    const inner = landmarks[isLeft ? FACE_MESH_LANDMARKS.LEFT_EYE_INNER : FACE_MESH_LANDMARKS.RIGHT_EYE_INNER];
    const outer = landmarks[isLeft ? FACE_MESH_LANDMARKS.LEFT_EYE_OUTER : FACE_MESH_LANDMARKS.RIGHT_EYE_OUTER];

    if (!top || !bottom || !inner || !outer) return 1;

    const verticalDist = Math.sqrt(
      Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2)
    );
    const horizontalDist = Math.sqrt(
      Math.pow(inner.x - outer.x, 2) + Math.pow(inner.y - outer.y, 2)
    );

    return verticalDist / horizontalDist;
  }

  /**
   * 计算注视点
   */
  private computeGazePoint(landmarks: FaceMeshLandmark[]): void {
    const { left, right } = this.lastPupilData;
    
    if (!left || !right) return;

    const timestamp = performance.now();

    // 平均瞳孔位置
    const avgRelX = (left.relativeX + right.relativeX) / 2;
    const avgRelY = (left.relativeY + right.relativeY) / 2;
    const avgConfidence = (left.confidence + right.confidence) / 2;

    if (avgConfidence < this.config.confidenceThreshold) {
      return;
    }

    // 如果已校准，应用变换
    let screenX = avgRelX;
    let screenY = avgRelY;

    if (this.calibrationStatus.calibrated && this.calibrationData.transformMatrix) {
      const transformed = this.applyCalibrationTransform(avgRelX, avgRelY);
      screenX = transformed.x;
      screenY = transformed.y;
    }

    // 平滑
    if (this.lastGazePoint && this.config.smoothingFactor > 0) {
      const alpha = this.config.smoothingFactor;
      screenX = this.lastGazePoint.screenX * (1 - alpha) + screenX * alpha;
      screenY = this.lastGazePoint.screenY * (1 - alpha) + screenY * alpha;
    }

    // Clamp
    screenX = Math.max(0, Math.min(1, screenX));
    screenY = Math.max(0, Math.min(1, screenY));

    const gazePoint: GazePoint = {
      screenX,
      screenY,
      confidence: avgConfidence,
      timestamp,
    };

    this.lastGazePoint = gazePoint;
    this.emit('gaze', gazePoint);
  }

  /**
   * 应用校准变换
   */
  private applyCalibrationTransform(x: number, y: number): { x: number; y: number } {
    const matrix = this.calibrationData.transformMatrix;
    
    if (!matrix || matrix.length !== 6) {
      return { x, y };
    }

    // 仿射变换
    return {
      x: matrix[0] * x + matrix[1] * y + matrix[2],
      y: matrix[3] * x + matrix[4] * y + matrix[5],
    };
  }

  /**
   * 开始校准
   */
  public async startCalibration(): Promise<boolean> {
    if (this.isDisabled) {
      logger.warn('EyeTracker', '追踪器已禁用，无法校准');
      return false;
    }

    this.isCalibrating = true;
    this.calibrationData = {
      screenPoints: [],
      pupilPoints: [],
      transformMatrix: null,
    };
    this.calibrationFailureCount = 0;
    
    const points = this.generateCalibrationPoints();
    this.calibrationStatus.pointCount = points.length;
    this.calibrationStatus.progress = 0;
    this.calibrationStatus.calibrated = false;
    this.calibrationStatus.failedCount = 0;

    for (let i = 0; i < points.length; i++) {
      if (this.calibrationFailureCount >= this.config.maxCalibrationFailures) {
        logger.warn('EyeTracker', `校准失败次数达到上限 (${this.config.maxCalibrationFailures})`);
        this.isCalibrating = false;
        this.calibrationStatus.failedCount = this.calibrationFailureCount;
        this.emit('calibration', { ...this.calibrationStatus });
        return false;
      }

      this.calibrationStatus.currentPoint = points[i];
      this.calibrationStatus.progress = i / points.length;
      this.emit('calibration', { ...this.calibrationStatus });

      const success = await this.waitForCalibrationPoint(points[i]);
      if (!success) {
        this.calibrationFailureCount++;
        this.calibrationStatus.failedCount = this.calibrationFailureCount;
        logger.warn('EyeTracker', `校准点 ${i + 1} 失败，重试中...`);
        i--;
        continue;
      }
    }

    this.computeTransformMatrix();

    this.calibrationStatus.calibrated = true;
    this.calibrationStatus.progress = 1;
    this.isCalibrating = false;
    
    this.emit('calibration', { ...this.calibrationStatus });
    logger.info('EyeTracker', 'Calibration complete');
    return true;
  }

  /**
   * 生成校准点
   */
  private generateCalibrationPoints(): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const n = Math.sqrt(this.config.calibrationPoints);
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        points.push({
          x: (i + 0.5) / n,
          y: (j + 0.5) / n,
        });
      }
    }
    
    return points;
  }

  /**
   * 等待校准点注视
   */
  private async waitForCalibrationPoint(point: { x: number; y: number }): Promise<boolean> {
    return new Promise((resolve) => {
      const samples: Array<{ left: { x: number; y: number }; right: { x: number; y: number } }> = [];
      let sampleCount = 0;
      const targetSamples = 10;
      const timeout = 10000;
      const startTime = performance.now();

      const sampleInterval = setInterval(() => {
        if (performance.now() - startTime > timeout) {
          clearInterval(sampleInterval);
          logger.warn('EyeTracker', '校准点超时');
          resolve(false);
          return;
        }

        const { left, right } = this.lastPupilData;
        
        if (left && right && left.confidence > this.config.confidenceThreshold && right.confidence > this.config.confidenceThreshold) {
          samples.push({
            left: { x: left.relativeX, y: left.relativeY },
            right: { x: right.relativeX, y: right.relativeY },
          });
          sampleCount++;
        }

        if (sampleCount >= targetSamples) {
          clearInterval(sampleInterval);
          
          if (samples.length >= targetSamples * 0.8) {
            const avgSample = samples.reduce((acc, s) => ({
              left: {
                x: acc.left.x + s.left.x / samples.length,
                y: acc.left.y + s.left.y / samples.length,
              },
              right: {
                x: acc.right.x + s.right.x / samples.length,
                y: acc.right.y + s.right.y / samples.length,
              },
            }), { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });

            this.calibrationData.screenPoints.push(point);
            this.calibrationData.pupilPoints.push(avgSample);
            resolve(true);
          } else {
            resolve(false);
          }
        }
      }, 100);
    });
  }

  /**
   * 计算变换矩阵
   */
  private computeTransformMatrix(): void {
    const { screenPoints, pupilPoints } = this.calibrationData;
    
    if (screenPoints.length < 4) {
      logger.warn('EyeTracker', 'Not enough calibration points');
      return;
    }

    // 简单的最小二乘拟合
    // 使用瞳孔中心点
    const n = screenPoints.length;
    
    let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0, sumYY = 0;
    let sumSX = 0, sumSY = 0, sumSXX = 0, sumSXY = 0, sumSYY = 0;

    for (let i = 0; i < n; i++) {
      const pupilCenter = {
        x: (pupilPoints[i].left.x + pupilPoints[i].right.x) / 2,
        y: (pupilPoints[i].left.y + pupilPoints[i].right.y) / 2,
      };
      const screenPoint = screenPoints[i];

      sumX += pupilCenter.x;
      sumY += pupilCenter.y;
      sumXX += pupilCenter.x * pupilCenter.x;
      sumXY += pupilCenter.x * pupilCenter.y;
      sumYY += pupilCenter.y * pupilCenter.y;
      sumSX += pupilCenter.x * screenPoint.x;
      sumSY += pupilCenter.y * screenPoint.x;
      sumSXX += pupilCenter.x * screenPoint.y;
      sumSXY += pupilCenter.y * screenPoint.y;
      sumSYY += pupilCenter.y * screenPoint.y;
    }

    // 简化：使用线性回归
    // 实际应使用更复杂的非线性模型
    const det = n * sumXX - sumX * sumX;
    
    if (Math.abs(det) < 0.0001) {
      logger.warn('EyeTracker', 'Degenerate calibration data');
      return;
    }

    const a = (n * sumSX - sumX * sumSX) / det;
    const b = (sumXX - sumX * sumSX) / det;
    const c = (sumSX - a * sumX - b * sumY) / n;

    this.calibrationData.transformMatrix = [
      a, b, c,
      a, b, c, // Y 方向简化处理
    ];
  }

  /**
   * 获取当前注视点
   */
  public getGazePoint(): GazePoint | null {
    return this.lastGazePoint;
  }

  /**
   * 获取校准状态
   */
  public getCalibrationStatus(): CalibrationStatus {
    return { ...this.calibrationStatus };
  }

  /**
   * 是否正在运行
   */
  public isTracking(): boolean {
    return this.isRunning;
  }

  /**
   * 销毁资源
   */
  public dispose(): void {
    this.stop();
    
    if (this.faceMesh) {
      if (typeof this.faceMesh.close === 'function') {
        this.faceMesh.close();
      }
      this.faceMesh = null;
    }
    
    this.video = null;
    this.canvas = null;
    this.ctx = null;
  }
}

// 单例
export const eyeTracker = new EyeTracker();

export default EyeTracker;
