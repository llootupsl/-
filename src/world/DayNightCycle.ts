/**
 * =============================================================================
 * 永夜熵纪 - 昼夜循环系统
 * Day-Night Cycle System
 * =============================================================================
 * 
 * 特性：
 * - 动态天空颜色变化（HSL平滑渐变）
 * - 光照强度模拟
 * - 阴影方向实时变化
 * - 与季节系统集成
 * - 支持加速时间流逝
 * - 市民活动影响接口
 */

import { EventEmitter } from '../core/EventEmitter';
import { Season } from './EpidemicClimateSystem';

/** 时间段类型 */
export enum TimeOfDay {
  DAWN = 'dawn',
  MORNING = 'morning',
  NOON = 'noon',
  AFTERNOON = 'afternoon',
  DUSK = 'dusk',
  EVENING = 'evening',
  MIDNIGHT = 'midnight',
  LATE_NIGHT = 'late_night',
}

/** 市民活动影响因子 */
export interface CitizenActivityModifier {
  workEfficiency: number;
  socialDesire: number;
  restNeed: number;
  moveSpeed: number;
  visibility: number;
  dangerLevel: number;
}

/** 昼夜状态 */
export interface DayNightState {
  /** 当前游戏内时间（小时，0-24） */
  time: number;
  /** 光照强度（0-1） */
  lightIntensity: number;
  /** 天空颜色（RGBA） */
  skyColor: [number, number, number, number];
  /** 环境光颜色（RGBA） */
  ambientColor: [number, number, number, number];
  /** 太阳/月亮位置 */
  celestialPosition: {
    x: number;
    y: number;
    z: number;
  };
  /** 当前时间段 */
  timeOfDay: TimeOfDay;
  /** 是否为夜间 */
  isNight: boolean;
  /** 日出时间 */
  sunriseTime: number;
  /** 日落时间 */
  sunsetTime: number;
}

/** 昼夜循环配置 */
export interface DayNightConfig {
  /** 一天的持续时间（毫秒，游戏时间） */
  dayDuration: number;
  /** 时间加速倍率 */
  timeScale: number;
  /** 初始时间（小时） */
  initialTime: number;
  /** 日出时间（小时） */
  sunriseHour: number;
  /** 日落时间（小时） */
  sunsetHour: number;
  /** 是否启用动态光照 */
  enableDynamicLighting: boolean;
  /** 是否启用天空颜色变化 */
  enableSkyColorChange: boolean;
}

/** 时间段配置 */
interface TimePeriodConfig {
  name: string;
  startHour: number;
  endHour: number;
  skyColorStart: [number, number, number];
  skyColorEnd: [number, number, number];
  lightIntensityRange: [number, number];
  ambientColor: [number, number, number];
}

/** 时间段配置数据 */
const TIME_PERIOD_CONFIGS: TimePeriodConfig[] = [
  {
    name: '黎明',
    startHour: 5,
    endHour: 7,
    skyColorStart: [0.1, 0.1, 0.2],
    skyColorEnd: [0.9, 0.6, 0.4],
    lightIntensityRange: [0.2, 0.6],
    ambientColor: [0.8, 0.6, 0.5],
  },
  {
    name: '早晨',
    startHour: 7,
    endHour: 10,
    skyColorStart: [0.9, 0.6, 0.4],
    skyColorEnd: [0.5, 0.7, 0.9],
    lightIntensityRange: [0.6, 0.9],
    ambientColor: [0.9, 0.85, 0.8],
  },
  {
    name: '正午',
    startHour: 10,
    endHour: 14,
    skyColorStart: [0.5, 0.7, 0.9],
    skyColorEnd: [0.4, 0.6, 0.85],
    lightIntensityRange: [0.9, 1.0],
    ambientColor: [1.0, 1.0, 0.95],
  },
  {
    name: '下午',
    startHour: 14,
    endHour: 17,
    skyColorStart: [0.4, 0.6, 0.85],
    skyColorEnd: [0.9, 0.7, 0.5],
    lightIntensityRange: [0.9, 0.7],
    ambientColor: [0.95, 0.9, 0.85],
  },
  {
    name: '黄昏',
    startHour: 17,
    endHour: 19,
    skyColorStart: [0.9, 0.7, 0.5],
    skyColorEnd: [0.8, 0.3, 0.2],
    lightIntensityRange: [0.7, 0.3],
    ambientColor: [0.9, 0.6, 0.4],
  },
  {
    name: '傍晚',
    startHour: 19,
    endHour: 21,
    skyColorStart: [0.8, 0.3, 0.2],
    skyColorEnd: [0.1, 0.1, 0.2],
    lightIntensityRange: [0.3, 0.1],
    ambientColor: [0.3, 0.3, 0.5],
  },
  {
    name: '子夜',
    startHour: 21,
    endHour: 24,
    skyColorStart: [0.1, 0.1, 0.2],
    skyColorEnd: [0.02, 0.02, 0.05],
    lightIntensityRange: [0.1, 0.05],
    ambientColor: [0.1, 0.1, 0.2],
  },
  {
    name: '深夜',
    startHour: 0,
    endHour: 5,
    skyColorStart: [0.02, 0.02, 0.05],
    skyColorEnd: [0.1, 0.1, 0.2],
    lightIntensityRange: [0.05, 0.2],
    ambientColor: [0.05, 0.05, 0.15],
  },
];

/** 季节对昼夜的影响 */
const SEASON_DAYLIGHT_MODIFIERS: Record<Season, { sunriseOffset: number; sunsetOffset: number }> = {
  [Season.SPRING]: { sunriseOffset: 0, sunsetOffset: 0 },
  [Season.SUMMER]: { sunriseOffset: -1, sunsetOffset: 1.5 },
  [Season.AUTUMN]: { sunriseOffset: 0.5, sunsetOffset: -0.5 },
  [Season.WINTER]: { sunriseOffset: 1.5, sunsetOffset: -1.5 },
};

/** 昼夜循环事件类型 */
export enum DayNightEventType {
  TIME_CHANGED = 'time_changed',
  PERIOD_CHANGED = 'period_changed',
  SUNRISE = 'sunrise',
  SUNSET = 'sunset',
  MIDNIGHT = 'midnight',
  NOON = 'noon',
}

/** 昼夜循环事件数据 */
export interface DayNightEventData {
  state: DayNightState;
  previousTime?: number;
  previousPeriod?: TimeOfDay;
}

/**
 * 昼夜循环系统
 */
export class DayNightCycle extends EventEmitter {
  private config: DayNightConfig;
  private state: DayNightState;
  private lastUpdateTime: number = 0;
  private currentSeason: Season = Season.SPRING;

  constructor(config?: Partial<DayNightConfig>) {
    super();
    
    this.config = {
      dayDuration: config?.dayDuration ?? 86400000,
      timeScale: config?.timeScale ?? 60,
      initialTime: config?.initialTime ?? 8,
      sunriseHour: config?.sunriseHour ?? 6,
      sunsetHour: config?.sunsetHour ?? 18,
      enableDynamicLighting: config?.enableDynamicLighting ?? true,
      enableSkyColorChange: config?.enableSkyColorChange ?? true,
    };

    this.state = this.createInitialState();
  }

  /**
   * 创建初始状态
   */
  private createInitialState(): DayNightState {
    const time = this.config.initialTime;
    const timeOfDay = this.getTimeOfDay(time);
    
    return {
      time,
      lightIntensity: this.calculateLightIntensity(time),
      skyColor: this.calculateSkyColor(time),
      ambientColor: this.calculateAmbientColor(time),
      celestialPosition: this.calculateCelestialPosition(time),
      timeOfDay,
      isNight: this.isNightTime(time),
      sunriseTime: this.config.sunriseHour,
      sunsetTime: this.config.sunsetHour,
    };
  }

  /**
   * 更新昼夜状态
   */
  public update(deltaTime: number): void {
    const scaledDelta = deltaTime * this.config.timeScale;
    const hoursPassed = (scaledDelta / this.config.dayDuration) * 24;
    
    const previousTime = this.state.time;
    const previousPeriod = this.state.timeOfDay;
    
    this.state.time = (this.state.time + hoursPassed) % 24;
    
    if (this.state.time < 0) {
      this.state.time += 24;
    }

    this.updateState();
    this.checkEvents(previousTime, previousPeriod);
    
    this.lastUpdateTime = Date.now();
  }

  /**
   * 更新状态
   */
  private updateState(): void {
    this.state.lightIntensity = this.calculateLightIntensity(this.state.time);
    this.state.skyColor = this.calculateSkyColor(this.state.time);
    this.state.ambientColor = this.calculateAmbientColor(this.state.time);
    this.state.celestialPosition = this.calculateCelestialPosition(this.state.time);
    this.state.timeOfDay = this.getTimeOfDay(this.state.time);
    this.state.isNight = this.isNightTime(this.state.time);
    
    const seasonMod = SEASON_DAYLIGHT_MODIFIERS[this.currentSeason];
    this.state.sunriseTime = this.config.sunriseHour + seasonMod.sunriseOffset;
    this.state.sunsetTime = this.config.sunsetHour + seasonMod.sunsetOffset;
  }

  /**
   * 检查并触发事件
   */
  private checkEvents(previousTime: number, previousPeriod: TimeOfDay): void {
    this.emit(DayNightEventType.TIME_CHANGED, {
      state: this.state,
      previousTime,
    });

    if (this.state.timeOfDay !== previousPeriod) {
      this.emit(DayNightEventType.PERIOD_CHANGED, {
        state: this.state,
        previousPeriod,
      });
    }

    if (previousTime < this.state.sunriseTime && this.state.time >= this.state.sunriseTime) {
      this.emit(DayNightEventType.SUNRISE, { state: this.state });
    }

    if (previousTime < this.state.sunsetTime && this.state.time >= this.state.sunsetTime) {
      this.emit(DayNightEventType.SUNSET, { state: this.state });
    }

    if (previousTime < 12 && this.state.time >= 12) {
      this.emit(DayNightEventType.NOON, { state: this.state });
    }

    if (previousTime < 0 && this.state.time >= 0 || 
        (previousTime > 23 && this.state.time < 1)) {
      this.emit(DayNightEventType.MIDNIGHT, { state: this.state });
    }
  }

  /**
   * 获取时间段
   */
  private getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 7) return TimeOfDay.DAWN;
    if (hour >= 7 && hour < 10) return TimeOfDay.MORNING;
    if (hour >= 10 && hour < 14) return TimeOfDay.NOON;
    if (hour >= 14 && hour < 17) return TimeOfDay.AFTERNOON;
    if (hour >= 17 && hour < 19) return TimeOfDay.DUSK;
    if (hour >= 19 && hour < 21) return TimeOfDay.EVENING;
    if (hour >= 21 || hour < 1) return TimeOfDay.MIDNIGHT;
    return TimeOfDay.LATE_NIGHT;
  }

  /**
   * 计算光照强度
   */
  private calculateLightIntensity(hour: number): number {
    const config = this.findTimePeriodConfig(hour);
    if (!config) return 0.5;

    const progress = (hour - config.startHour) / (config.endHour - config.startHour);
    const [min, max] = config.lightIntensityRange;
    
    return min + (max - min) * progress;
  }

  /**
   * 计算天空颜色
   */
  private calculateSkyColor(hour: number): [number, number, number, number] {
    const config = this.findTimePeriodConfig(hour);
    if (!config) return [0.5, 0.5, 0.5, 1];

    const progress = (hour - config.startHour) / (config.endHour - config.startHour);
    const start = config.skyColorStart;
    const end = config.skyColorEnd;

    return [
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress,
      start[2] + (end[2] - start[2]) * progress,
      1,
    ];
  }

  /**
   * 计算环境光颜色
   */
  private calculateAmbientColor(hour: number): [number, number, number, number] {
    const config = this.findTimePeriodConfig(hour);
    if (!config) return [0.5, 0.5, 0.5, 1];

    const nextConfig = this.findTimePeriodConfig(hour + 0.1) || config;
    const progress = (hour - config.startHour) / (config.endHour - config.startHour);
    
    const current = config.ambientColor;
    const next = nextConfig.ambientColor;

    return [
      current[0] + (next[0] - current[0]) * progress * 0.3,
      current[1] + (next[1] - current[1]) * progress * 0.3,
      current[2] + (next[2] - current[2]) * progress * 0.3,
      1,
    ];
  }

  /**
   * 计算天体位置（太阳/月亮）
   */
  private calculateCelestialPosition(hour: number): { x: number; y: number; z: number } {
    const sunrise = this.state?.sunriseTime ?? this.config.sunriseHour;
    const sunset = this.state?.sunsetTime ?? this.config.sunsetHour;
    const dayLength = sunset - sunrise;
    
    let angle: number;
    let y: number;
    
    if (hour >= sunrise && hour < sunset) {
      const dayProgress = (hour - sunrise) / dayLength;
      angle = dayProgress * Math.PI;
      y = Math.sin(angle) * 100;
    } else {
      const nightProgress = hour >= sunset 
        ? (hour - sunset) / (24 - sunset + sunrise)
        : (hour + 24 - sunset) / (24 - sunset + sunrise);
      angle = Math.PI + nightProgress * Math.PI;
      y = Math.sin(angle) * 80 - 20;
    }

    const x = Math.cos(angle) * 100;
    const z = Math.sin(angle * 0.5) * 50;

    return { x, y, z };
  }

  /**
   * 查找时间段配置
   */
  private findTimePeriodConfig(hour: number): TimePeriodConfig | null {
    for (const config of TIME_PERIOD_CONFIGS) {
      if (config.startHour <= config.endHour) {
        if (hour >= config.startHour && hour < config.endHour) {
          return config;
        }
      } else {
        if (hour >= config.startHour || hour < config.endHour) {
          return config;
        }
      }
    }
    return TIME_PERIOD_CONFIGS[0];
  }

  /**
   * 判断是否为夜间
   */
  private isNightTime(hour: number): boolean {
    const sunrise = this.state?.sunriseTime ?? this.config.sunriseHour;
    const sunset = this.state?.sunsetTime ?? this.config.sunsetHour;
    return hour < sunrise || hour >= sunset;
  }

  /**
   * 设置季节
   */
  public setSeason(season: Season): void {
    this.currentSeason = season;
    this.updateState();
  }

  /**
   * 设置时间加速倍率
   */
  public setTimeScale(scale: number): void {
    this.config.timeScale = Math.max(1, Math.min(1000, scale));
  }

  /**
   * 设置当前时间
   */
  public setTime(hour: number): void {
    const previousTime = this.state.time;
    const previousPeriod = this.state.timeOfDay;
    
    this.state.time = hour % 24;
    if (this.state.time < 0) this.state.time += 24;
    
    this.updateState();
    this.checkEvents(previousTime, previousPeriod);
  }

  /**
   * 获取当前状态
   */
  public getState(): DayNightState {
    return { ...this.state };
  }

  /**
   * 获取环境光
   */
  public getAmbientLight(): { color: [number, number, number, number]; intensity: number } {
    return {
      color: this.state.ambientColor,
      intensity: this.state.lightIntensity,
    };
  }

  /**
   * 获取天空颜色
   */
  public getSkyColor(): [number, number, number, number] {
    return [...this.state.skyColor] as [number, number, number, number];
  }

  /**
   * 获取当前时间段名称
   */
  public getTimePeriodName(): string {
    const config = this.findTimePeriodConfig(this.state.time);
    return config?.name ?? '未知';
  }

  /**
   * 获取格式化时间字符串
   */
  public getFormattedTime(): string {
    const hours = Math.floor(this.state.time);
    const minutes = Math.floor((this.state.time % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * 获取配置
   */
  public getConfig(): DayNightConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<DayNightConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateState();
  }

  /**
   * 获取阴影方向
   */
  public getShadowDirection(): { x: number; y: number; z: number } {
    const pos = this.state.celestialPosition;
    const length = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    
    if (length === 0) return { x: 0, y: -1, z: 0 };
    
    return {
      x: -pos.x / length,
      y: -pos.y / length,
      z: -pos.z / length,
    };
  }

  /**
   * 获取阴影强度
   */
  public getShadowIntensity(): number {
    if (this.state.isNight) return 0.2;
    return this.state.lightIntensity * 0.8;
  }

  /**
   * 获取阴影长度倍数
   */
  public getShadowLength(): number {
    const pos = this.state.celestialPosition;
    const height = pos.y;
    if (height <= 0) return 5;
    return Math.max(0.5, 100 / Math.max(1, height));
  }

  /**
   * 获取平滑光照颜色（HSL插值）
   */
  public getSmoothLightColor(): { color: [number, number, number]; intensity: number } {
    const hour = this.state.time;
    const hsl = this.hourToHSL(hour);
    const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    
    return {
      color: rgb,
      intensity: this.state.lightIntensity,
    };
  }

  /**
   * 将小时转换为HSL颜色
   */
  private hourToHSL(hour: number): { h: number; s: number; l: number } {
    const configs: Array<{ start: number; end: number; h: number; s: number; l: number }> = [
      { start: 0, end: 5, h: 240, s: 0.3, l: 0.05 },
      { start: 5, end: 7, h: 30, s: 0.8, l: 0.4 },
      { start: 7, end: 12, h: 45, s: 0.6, l: 0.7 },
      { start: 12, end: 17, h: 55, s: 0.5, l: 0.85 },
      { start: 17, end: 19, h: 20, s: 0.9, l: 0.5 },
      { start: 19, end: 21, h: 270, s: 0.4, l: 0.25 },
      { start: 21, end: 24, h: 250, s: 0.3, l: 0.08 },
    ];

    for (let i = 0; i < configs.length; i++) {
      const cfg = configs[i];
      if (hour >= cfg.start && hour < cfg.end) {
        const next = configs[(i + 1) % configs.length];
        const progress = (hour - cfg.start) / (cfg.end - cfg.start);
        
        return {
          h: this.lerpAngle(cfg.h, next.h, progress),
          s: cfg.s + (next.s - cfg.s) * progress,
          l: cfg.l + (next.l - cfg.l) * progress,
        };
      }
    }
    return { h: 0, s: 0, l: 0.5 };
  }

  /**
   * 角度线性插值（处理360度环绕）
   */
  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return (a + diff * t + 360) % 360;
  }

  /**
   * HSL转RGB
   */
  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  }

  /**
   * 获取市民活动影响因子
   */
  public getCitizenActivityModifier(): CitizenActivityModifier {
    const hour = this.state.time;
    const isNight = this.state.isNight;
    const lightIntensity = this.state.lightIntensity;
    
    let workEfficiency = 1.0;
    let socialDesire = 0.5;
    let restNeed = 0.3;
    let moveSpeed = 1.0;
    let visibility = lightIntensity;
    let dangerLevel = 0.1;

    if (hour >= 6 && hour < 9) {
      workEfficiency = 0.7 + (hour - 6) / 3 * 0.3;
      socialDesire = 0.4;
      restNeed = 0.2;
      moveSpeed = 0.9;
      dangerLevel = 0.05;
    } else if (hour >= 9 && hour < 12) {
      workEfficiency = 1.0;
      socialDesire = 0.5;
      restNeed = 0.3;
      moveSpeed = 1.0;
      dangerLevel = 0.02;
    } else if (hour >= 12 && hour < 14) {
      workEfficiency = 0.8;
      socialDesire = 0.7;
      restNeed = 0.5;
      moveSpeed = 0.85;
      dangerLevel = 0.02;
    } else if (hour >= 14 && hour < 18) {
      workEfficiency = 0.9;
      socialDesire = 0.6;
      restNeed = 0.4;
      moveSpeed = 0.95;
      dangerLevel = 0.03;
    } else if (hour >= 18 && hour < 21) {
      workEfficiency = 0.5;
      socialDesire = 0.8;
      restNeed = 0.6;
      moveSpeed = 0.8;
      visibility = Math.max(0.3, lightIntensity);
      dangerLevel = 0.1;
    } else if (hour >= 21 || hour < 1) {
      workEfficiency = 0.2;
      socialDesire = 0.3;
      restNeed = 0.9;
      moveSpeed = 0.5;
      visibility = 0.15;
      dangerLevel = 0.3;
    } else {
      workEfficiency = 0.1;
      socialDesire = 0.1;
      restNeed = 1.0;
      moveSpeed = 0.3;
      visibility = 0.05;
      dangerLevel = 0.5;
    }

    const seasonMod = this.getSeasonActivityModifier();
    workEfficiency *= seasonMod.workMultiplier;
    moveSpeed *= seasonMod.speedMultiplier;

    return {
      workEfficiency,
      socialDesire,
      restNeed,
      moveSpeed,
      visibility,
      dangerLevel,
    };
  }

  /**
   * 获取季节活动修正
   */
  private getSeasonActivityModifier(): { workMultiplier: number; speedMultiplier: number } {
    switch (this.currentSeason) {
      case Season.SPRING:
        return { workMultiplier: 1.0, speedMultiplier: 1.0 };
      case Season.SUMMER:
        return { workMultiplier: 1.1, speedMultiplier: 1.05 };
      case Season.AUTUMN:
        return { workMultiplier: 1.05, speedMultiplier: 0.95 };
      case Season.WINTER:
        return { workMultiplier: 0.8, speedMultiplier: 0.7 };
      default:
        return { workMultiplier: 1.0, speedMultiplier: 1.0 };
    }
  }

  /**
   * 获取太阳/月亮角度（用于渲染）
   */
  public getCelestialAngle(): number {
    const pos = this.state.celestialPosition;
    return Math.atan2(pos.y, Math.sqrt(pos.x * pos.x + pos.z * pos.z));
  }

  /**
   * 判断是否适合户外活动
   */
  public isSuitableForOutdoor(): boolean {
    const hour = this.state.time;
    return hour >= 6 && hour < 20;
  }

  /**
   * 获取昼夜过渡进度（0-1）
   */
  public getTransitionProgress(): number {
    const hour = this.state.time;
    const sunrise = this.state.sunriseTime;
    const sunset = this.state.sunsetTime;
    
    if (hour >= sunrise - 1 && hour < sunrise + 1) {
      return (hour - (sunrise - 1)) / 2;
    }
    if (hour >= sunset - 1 && hour < sunset + 1) {
      return (hour - (sunset - 1)) / 2;
    }
    return 0;
  }

  /**
   * 序列化状态
   */
  public serialize(): Record<string, unknown> {
    return {
      time: this.state.time,
      timeScale: this.config.timeScale,
      season: this.currentSeason,
    };
  }

  /**
   * 从序列化数据恢复
   */
  public deserialize(data: Record<string, unknown>): void {
    if (typeof data.time === 'number') {
      this.state.time = data.time;
    }
    if (typeof data.timeScale === 'number') {
      this.config.timeScale = data.timeScale;
    }
    if (typeof data.season === 'string') {
      this.currentSeason = data.season as Season;
    }
    this.updateState();
  }
}

export const dayNightCycle = new DayNightCycle();
export default dayNightCycle;
