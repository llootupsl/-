/**
 * =============================================================================
 * 创世纪数据孪生 - 天气/地理/时间数据集成
 * =============================================================================
 */

import { EventEmitter } from '@/core/EventEmitter';
import { logger } from '@/core/utils/Logger';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy' | 'unknown';
  description: string;
  visibility: number;
  uvIndex: number;
  timestamp: number;
}

export interface TimeData {
  timezone: string;
  offset: number;
  isDst: boolean;
  sunrise: number;
  sunset: number;
  moonPhase: number;
  lunarDate?: string;
  timestamp: number;
}

export type LocationSource = 'none' | 'browser' | 'fallback';
export type WeatherSource = 'none' | 'open-meteo' | 'mock';
export type WeatherStatus = 'idle' | 'live' | 'fallback';

export interface GenesisTwinData {
  location: LocationData | null;
  weather: WeatherData | null;
  time: TimeData | null;
  lastUpdate: number;
  locationSource: LocationSource;
  weatherSource: WeatherSource;
  weatherStatus: WeatherStatus;
  weatherMessage: string | null;
}

export interface GenesisTwinStatus {
  initialized: boolean;
  lastUpdate: number;
  hasLocation: boolean;
  hasWeather: boolean;
  hasTime: boolean;
  locationSource: LocationSource;
  weatherSource: WeatherSource;
  weatherStatus: WeatherStatus;
  weatherMessage: string | null;
}

export interface GenesisTwinConfig {
  updateInterval?: number;
  useBrowserGeolocation?: boolean;
  weatherApiKey?: string;
}

const defaultConfig: Required<GenesisTwinConfig> = {
  updateInterval: 60000,
  useBrowserGeolocation: true,
  weatherApiKey: '',
};

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_LOCATION: LocationData = {
  latitude: 39.9042,
  longitude: 116.4074,
  timestamp: Date.now(),
};

/**
 * 创世纪数据孪生引擎
 */
export class GenesisTwin extends EventEmitter {
  private config: Required<GenesisTwinConfig>;
  private data: GenesisTwinData = {
    location: null,
    weather: null,
    time: null,
    lastUpdate: 0,
    locationSource: 'none',
    weatherSource: 'none',
    weatherStatus: 'idle',
    weatherMessage: null,
  };
  private updateInterval: ReturnType<typeof globalThis.setInterval> | null = null;
  private initialized = false;

  constructor(config?: GenesisTwinConfig) {
    super();
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 初始化
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    await this.fetchLocation();
    await this.fetchWeather();
    this.fetchTimeData();

    this.initialized = true;
    this.data.lastUpdate = Date.now();
    this.emit('initialized', this.getData());
  }

  /**
   * 启动自动更新
   */
  public startAutoUpdate(): void {
    if (this.updateInterval) return;

    this.updateInterval = globalThis.setInterval(() => {
      void this.refresh();
    }, this.config.updateInterval);

    logger.info('GenesisTwin', 'Auto-update started');
  }

  /**
   * 停止自动更新
   */
  public stopAutoUpdate(): void {
    if (this.updateInterval) {
      globalThis.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * 刷新所有数据
   */
  public async refresh(): Promise<GenesisTwinData> {
    await this.fetchLocation();
    await this.fetchWeather();
    this.fetchTimeData();

    this.data.lastUpdate = Date.now();
    this.emit('update', this.getData());
    return this.getData();
  }

  /**
   * 获取地理位置
   */
  public async fetchLocation(): Promise<LocationData | null> {
    if (!this.config.useBrowserGeolocation) {
      this.data.location = { ...DEFAULT_LOCATION, timestamp: Date.now() };
      this.data.locationSource = 'fallback';
      this.emit('location-update', this.getLocation());
      return this.data.location;
    }

    if (!navigator.geolocation) {
      logger.warn('GenesisTwin', 'Geolocation not supported, using fallback location');
      this.data.location = { ...DEFAULT_LOCATION, timestamp: Date.now() };
      this.data.locationSource = 'fallback';
      this.emit('location-update', this.getLocation());
      return this.data.location;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.data.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || undefined,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          this.data.locationSource = 'browser';
          this.emit('location-update', this.getLocation());
          resolve(this.data.location);
        },
        (error) => {
          logger.warn(
            'GenesisTwin',
            'Geolocation failed, using fallback location',
            error instanceof Error ? error : new Error(String(error))
          );
          this.data.location = { ...DEFAULT_LOCATION, timestamp: Date.now() };
          this.data.locationSource = 'fallback';
          this.emit('location-update', this.getLocation());
          resolve(this.data.location);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  /**
   * 获取天气数据
   */
  public async fetchWeather(): Promise<WeatherData | null> {
    if (!this.data.location) {
      return this.useMockWeather('No location available');
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      logger.warn('GenesisTwin', 'Offline detected, using mock weather');
      return this.useMockWeather('Offline mode');
    }

    try {
      const weather = await this.fetchOpenMeteoWeather(this.data.location);
      this.data.weather = weather;
      this.data.weatherSource = 'open-meteo';
      this.data.weatherStatus = 'live';
      this.data.weatherMessage = null;
      this.emit('weather-update', this.getWeather());
      return this.data.weather;
    } catch (error) {
      logger.warn(
        'GenesisTwin',
        'Open-Meteo weather fetch failed, using mock weather',
        error instanceof Error ? error : new Error(String(error))
      );
      return this.useMockWeather(
        error instanceof Error ? error.message : 'Open-Meteo unavailable'
      );
    }
  }

  /**
   * 通过 Open-Meteo 获取天气
   */
  private async fetchOpenMeteoWeather(location: LocationData): Promise<WeatherData> {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      timezone: 'auto',
      forecast_days: '1',
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,uv_index',
    });

    const response = await fetch(`${OPEN_METEO_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      current?: {
        time?: string;
        temperature_2m?: number;
        relative_humidity_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        wind_direction_10m?: number;
        surface_pressure?: number;
        visibility?: number;
        uv_index?: number;
      };
    };

    if (!payload.current) {
      throw new Error('Open-Meteo current weather payload missing');
    }

    const current = payload.current;
    const weatherCode = current.weather_code ?? -1;

    return {
      temperature: current.temperature_2m ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      pressure: current.surface_pressure ?? 1013,
      windSpeed: current.wind_speed_10m ?? 0,
      windDirection: current.wind_direction_10m ?? 0,
      condition: this.mapWeatherCodeToCondition(weatherCode),
      description: this.describeWeatherCode(weatherCode),
      visibility: current.visibility ?? 10,
      uvIndex: current.uv_index ?? 0,
      timestamp: current.time ? Date.parse(current.time) || Date.now() : Date.now(),
    };
  }

  /**
   * 使用模拟天气回退
   */
  private useMockWeather(message: string): WeatherData | null {
    this.data.weather = this.generateMockWeather();
    this.data.weatherSource = 'mock';
    this.data.weatherStatus = 'fallback';
    this.data.weatherMessage = message;
    this.emit('weather-update', this.getWeather());
    return this.data.weather;
  }

  /**
   * 生成模拟天气数据
   */
  private generateMockWeather(): WeatherData {
    const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'foggy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      temperature: 15 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      pressure: 1000 + Math.random() * 30,
      windSpeed: Math.random() * 20,
      windDirection: Math.random() * 360,
      condition,
      description: this.getConditionDescription(condition),
      visibility: condition === 'foggy' ? 2 : 10,
      uvIndex: Math.floor(Math.random() * 11),
      timestamp: Date.now(),
    };
  }

  /**
   * 根据天气码映射条件
   */
  private mapWeatherCodeToCondition(code: number): WeatherData['condition'] {
    if (code === 0) return 'sunny';
    if ([1, 2, 3].includes(code)) return 'cloudy';
    if ([45, 48].includes(code)) return 'foggy';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
    if ([95, 96, 99].includes(code)) return 'stormy';
    return 'unknown';
  }

  /**
   * 根据天气码生成中文描述
   */
  private describeWeatherCode(code: number): string {
    const descriptions: Record<number, string> = {
      0: '晴朗',
      1: '大致晴朗',
      2: '局部多云',
      3: '阴天',
      45: '有雾',
      48: '霜雾',
      51: '毛毛雨',
      53: '小雨',
      55: '中雨',
      56: '冻雨',
      57: '强冻雨',
      61: '小雨',
      63: '中雨',
      65: '大雨',
      71: '小雪',
      73: '中雪',
      75: '大雪',
      77: '冰粒',
      80: '阵雨',
      81: '强阵雨',
      82: '暴雨',
      85: '阵雪',
      86: '强阵雪',
      95: '雷暴',
      96: '雷暴伴冰雹',
      99: '强雷暴伴冰雹',
    };

    return descriptions[code] ?? '未知天气';
  }

  /**
   * 获取天气描述
   */
  private getConditionDescription(condition: WeatherData['condition']): string {
    const descriptions: Record<WeatherData['condition'], string> = {
      sunny: '晴朗',
      cloudy: '多云',
      rainy: '雨天',
      snowy: '雪天',
      stormy: '暴风雨',
      foggy: '有雾',
      unknown: '未知',
    };
    return descriptions[condition];
  }

  /**
   * 获取时间数据
   */
  public fetchTimeData(): TimeData {
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const sunrise = new Date(now);
    sunrise.setHours(6, 30, 0, 0);
    const sunset = new Date(now);
    sunset.setHours(18, 30, 0, 0);

    const moonPhase = this.calculateMoonPhase(now);
    const lunarDate = this.getLunarDate(now);

    this.data.time = {
      timezone,
      offset: now.getTimezoneOffset(),
      isDst: false,
      sunrise: sunrise.getTime(),
      sunset: sunset.getTime(),
      moonPhase,
      lunarDate,
      timestamp: Date.now(),
    };

    this.emit('time-update', this.data.time);
    return this.data.time;
  }

  /**
   * 计算月相
   */
  private calculateMoonPhase(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const c = Math.floor(365.25 * year);
    const e = Math.floor(30.6 * month);
    const jd = c + e + day - 694039.09;
    const phase = jd / 29.53058867;
    return phase - Math.floor(phase);
  }

  /**
   * 获取农历日期（简化版）
   */
  private getLunarDate(date: Date): string {
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const lunarDays = [
      '初一',
      '初二',
      '初三',
      '初四',
      '初五',
      '初六',
      '初七',
      '初八',
      '初九',
      '初十',
      '十一',
      '十二',
      '十三',
      '十四',
      '十五',
      '十六',
      '十七',
      '十八',
      '十九',
      '二十',
      '廿一',
      '廿二',
      '廿三',
      '廿四',
      '廿五',
      '廿六',
      '廿七',
      '廿八',
      '廿九',
      '三十',
    ];

    const month = lunarMonths[Math.floor(Math.random() * 12)];
    const day = lunarDays[Math.floor(Math.random() * 30)];

    return `${month}月${day}`;
  }

  /**
   * 获取完整数据
   */
  public getData(): GenesisTwinData {
    return {
      ...this.data,
      location: this.data.location ? { ...this.data.location } : null,
      weather: this.data.weather ? { ...this.data.weather } : null,
      time: this.data.time ? { ...this.data.time } : null,
    };
  }

  /**
   * 获取位置
   */
  public getLocation(): LocationData | null {
    return this.data.location ? { ...this.data.location } : null;
  }

  /**
   * 获取天气
   */
  public getWeather(): WeatherData | null {
    return this.data.weather ? { ...this.data.weather } : null;
  }

  /**
   * 获取时间
   */
  public getTime(): TimeData | null {
    return this.data.time ? { ...this.data.time } : null;
  }

  /**
   * 获取状态
   */
  public getStatus(): GenesisTwinStatus {
    return {
      initialized: this.initialized,
      lastUpdate: this.data.lastUpdate,
      hasLocation: !!this.data.location,
      hasWeather: !!this.data.weather,
      hasTime: !!this.data.time,
      locationSource: this.data.locationSource,
      weatherSource: this.data.weatherSource,
      weatherStatus: this.data.weatherStatus,
      weatherMessage: this.data.weatherMessage,
    };
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stopAutoUpdate();
    this.data = {
      location: null,
      weather: null,
      time: null,
      lastUpdate: 0,
      locationSource: 'none',
      weatherSource: 'none',
      weatherStatus: 'idle',
      weatherMessage: null,
    };
    this.initialized = false;
    this.removeAllListeners();
  }
}

export default GenesisTwin;
