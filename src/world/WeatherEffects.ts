/**
 * =============================================================================
 * 永夜熵纪 - 天气视觉效果系统
 * Weather Visual Effects System
 * =============================================================================
 * 
 * 特性：
 * - 雨、雪、雾、风暴等天气粒子效果
 * - 动态云层系统
 * - 天气音效支持
 * - 与气候系统集成
 * - 性能优化（粒子池化）
 * - 市民行为影响接口
 */

import { EventEmitter } from '../core/EventEmitter';
import { AudioEngine, SoundType } from '../audio/AudioEngine';

/** 天气类型 */
export enum WeatherType {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAIN = 'rain',
  HEAVY_RAIN = 'heavy_rain',
  SNOW = 'snow',
  HEAVY_SNOW = 'heavy_snow',
  FOG = 'fog',
  STORM = 'storm',
  SANDSTORM = 'sandstorm',
  HAIL = 'hail',
}

/** 天气对市民的影响 */
export interface WeatherCitizenImpact {
  moveSpeed: number;
  workEfficiency: number;
  healthRisk: number;
  moodModifier: number;
  socialDesire: number;
  visibility: number;
  outdoorSuitability: number;
}

/** 云层数据 */
export interface CloudData {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  opacity: number;
  speed: number;
  type: 'cumulus' | 'stratus' | 'cirrus' | 'storm';
}

/** 天气粒子 */
export interface WeatherParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
  rotation: number;
  life: number;
  maxLife: number;
  type: 'rain' | 'snow' | 'fog' | 'dust' | 'hail';
}

/** 天气效果配置 */
export interface WeatherEffectConfig {
  /** 粒子数量 */
  particleCount: number;
  /** 粒子速度范围 */
  speedRange: { min: number; max: number };
  /** 粒子大小范围 */
  sizeRange: { min: number; max: number };
  /** 粒子颜色 */
  color: [number, number, number, number];
  /** 下落角度（度） */
  fallAngle: number;
  /** 风力影响 */
  windInfluence: number;
  /** 音效类型 */
  soundType?: SoundType;
  /** 能见度（0-1） */
  visibility: number;
  /** 光照衰减 */
  lightAttenuation: number;
}

/** 天气状态 */
export interface WeatherState {
  /** 当前天气类型 */
  type: WeatherType;
  /** 强度（0-1） */
  intensity: number;
  /** 风速 */
  windSpeed: number;
  /** 风向（度） */
  windDirection: number;
  /** 温度 */
  temperature: number;
  /** 湿度 */
  humidity: number;
  /** 能见度 */
  visibility: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 已持续时间 */
  elapsed: number;
}

/** 天气效果事件 */
export enum WeatherEventType {
  WEATHER_CHANGED = 'weather_changed',
  WEATHER_STARTED = 'weather_started',
  WEATHER_ENDED = 'weatherEnded',
  PARTICLE_SPAWNED = 'particle_spawned',
}

/** 天气效果事件数据 */
export interface WeatherEventData {
  weather?: WeatherType;
  previousWeather?: WeatherType;
  intensity?: number;
  particle?: WeatherParticle;
}

/** 天气类型配置映射 */
const WEATHER_CONFIGS: Record<WeatherType, WeatherEffectConfig> = {
  [WeatherType.CLEAR]: {
    particleCount: 0,
    speedRange: { min: 0, max: 0 },
    sizeRange: { min: 0, max: 0 },
    color: [1, 1, 1, 0],
    fallAngle: 0,
    windInfluence: 0,
    visibility: 1.0,
    lightAttenuation: 0,
  },
  [WeatherType.CLOUDY]: {
    particleCount: 0,
    speedRange: { min: 0, max: 0 },
    sizeRange: { min: 0, max: 0 },
    color: [0.7, 0.7, 0.75, 0.3],
    fallAngle: 0,
    windInfluence: 0,
    visibility: 0.85,
    lightAttenuation: 0.15,
  },
  [WeatherType.RAIN]: {
    particleCount: 500,
    speedRange: { min: 8, max: 12 },
    sizeRange: { min: 2, max: 4 },
    color: [0.6, 0.7, 0.9, 0.6],
    fallAngle: 75,
    windInfluence: 0.3,
    soundType: SoundType.AMBIENT,
    visibility: 0.7,
    lightAttenuation: 0.2,
  },
  [WeatherType.HEAVY_RAIN]: {
    particleCount: 1500,
    speedRange: { min: 12, max: 18 },
    sizeRange: { min: 3, max: 6 },
    color: [0.5, 0.6, 0.85, 0.7],
    fallAngle: 70,
    windInfluence: 0.4,
    soundType: SoundType.AMBIENT,
    visibility: 0.4,
    lightAttenuation: 0.35,
  },
  [WeatherType.SNOW]: {
    particleCount: 300,
    speedRange: { min: 1, max: 3 },
    sizeRange: { min: 3, max: 8 },
    color: [1, 1, 1, 0.9],
    fallAngle: 85,
    windInfluence: 0.5,
    visibility: 0.75,
    lightAttenuation: 0.1,
  },
  [WeatherType.HEAVY_SNOW]: {
    particleCount: 800,
    speedRange: { min: 2, max: 4 },
    sizeRange: { min: 4, max: 10 },
    color: [1, 1, 1, 0.95],
    fallAngle: 80,
    windInfluence: 0.6,
    visibility: 0.5,
    lightAttenuation: 0.2,
  },
  [WeatherType.FOG]: {
    particleCount: 200,
    speedRange: { min: 0.1, max: 0.5 },
    sizeRange: { min: 50, max: 150 },
    color: [0.8, 0.8, 0.85, 0.3],
    fallAngle: 0,
    windInfluence: 0.1,
    visibility: 0.3,
    lightAttenuation: 0.25,
  },
  [WeatherType.STORM]: {
    particleCount: 2000,
    speedRange: { min: 15, max: 25 },
    sizeRange: { min: 4, max: 8 },
    color: [0.4, 0.5, 0.7, 0.8],
    fallAngle: 60,
    windInfluence: 0.7,
    soundType: SoundType.CATASTROPHE,
    visibility: 0.25,
    lightAttenuation: 0.45,
  },
  [WeatherType.SANDSTORM]: {
    particleCount: 1000,
    speedRange: { min: 10, max: 20 },
    sizeRange: { min: 2, max: 5 },
    color: [0.9, 0.7, 0.4, 0.6],
    fallAngle: 10,
    windInfluence: 0.9,
    soundType: SoundType.WARNING,
    visibility: 0.35,
    lightAttenuation: 0.4,
  },
  [WeatherType.HAIL]: {
    particleCount: 200,
    speedRange: { min: 15, max: 25 },
    sizeRange: { min: 5, max: 15 },
    color: [0.9, 0.95, 1, 0.9],
    fallAngle: 80,
    windInfluence: 0.2,
    soundType: SoundType.WARNING,
    visibility: 0.6,
    lightAttenuation: 0.2,
  },
};

/**
 * 天气视觉效果系统
 */
export class WeatherEffects extends EventEmitter {
  private particles: WeatherParticle[] = [];
  private particlePool: WeatherParticle[] = [];
  private clouds: CloudData[] = [];
  private state: WeatherState;
  private config: WeatherEffectConfig;
  private audioEngine: AudioEngine;
  private lastUpdateTime: number = 0;
  private lightningTimer: number = 0;
  private lightningFlash: number = 0;
  private bounds: { width: number; height: number; depth: number };
  private cloudSpawnTimer: number = 0;

  constructor(bounds?: { width: number; height: number; depth: number }) {
    super();
    
    this.bounds = bounds ?? { width: 1920, height: 1080, depth: 1000 };
    this.audioEngine = AudioEngine.getInstance();
    
    this.state = {
      type: WeatherType.CLEAR,
      intensity: 0,
      windSpeed: 0,
      windDirection: 0,
      temperature: 20,
      humidity: 0.5,
      visibility: 1,
      duration: 0,
      elapsed: 0,
    };
    
    this.config = WEATHER_CONFIGS[WeatherType.CLEAR];
    this.initParticlePool();
  }

  /**
   * 初始化粒子池
   */
  private initParticlePool(): void {
    const poolSize = 3000;
    for (let i = 0; i < poolSize; i++) {
      this.particlePool.push(this.createParticle());
    }
  }

  /**
   * 创建粒子
   */
  private createParticle(): WeatherParticle {
    return {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      size: 0,
      opacity: 0,
      rotation: 0,
      life: 0,
      maxLife: 0,
      type: 'rain',
    };
  }

  /**
   * 从池中获取粒子
   */
  private getParticleFromPool(): WeatherParticle | null {
    return this.particlePool.pop() ?? null;
  }

  /**
   * 将粒子返回池中
   */
  private returnParticleToPool(particle: WeatherParticle): void {
    if (this.particlePool.length < 5000) {
      this.particlePool.push(particle);
    }
  }

  /**
   * 更新天气效果
   */
  public update(deltaTime: number): void {
    const dt = deltaTime / 1000;
    
    this.state.elapsed += deltaTime;
    
    this.updateParticles(dt);
    this.updateLightning(dt);
    this.updateClouds(dt);
    this.spawnParticles();
    this.spawnClouds(dt);
    
    this.lastUpdateTime = Date.now();
  }

  /**
   * 更新云层
   */
  private updateClouds(dt: number): void {
    const windX = Math.cos(this.state.windDirection * Math.PI / 180) * this.state.windSpeed;
    
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];
      
      cloud.x += windX * cloud.speed * dt;
      cloud.opacity = Math.max(0, Math.min(1, cloud.opacity + (Math.random() - 0.5) * 0.01));
      
      if (cloud.x > this.bounds.width + cloud.width) {
        cloud.x = -cloud.width;
      } else if (cloud.x < -cloud.width) {
        cloud.x = this.bounds.width + cloud.width;
      }
      
      if (cloud.opacity < 0.05) {
        this.clouds.splice(i, 1);
      }
    }
  }

  /**
   * 生成云层
   */
  private spawnClouds(dt: number): void {
    this.cloudSpawnTimer -= dt;
    
    const maxClouds = this.getMaxCloudCount();
    
    if (this.cloudSpawnTimer <= 0 && this.clouds.length < maxClouds) {
      this.cloudSpawnTimer = 2 + Math.random() * 5;
      
      const cloud: CloudData = {
        x: -200,
        y: 50 + Math.random() * 100,
        z: Math.random() * this.bounds.depth,
        width: 100 + Math.random() * 200,
        height: 30 + Math.random() * 50,
        opacity: 0.3 + Math.random() * 0.5,
        speed: 0.5 + Math.random() * 1.5,
        type: this.getCloudType(),
      };
      
      this.clouds.push(cloud);
    }
  }

  /**
   * 获取最大云层数量
   */
  private getMaxCloudCount(): number {
    switch (this.state.type) {
      case WeatherType.CLEAR:
        return 3;
      case WeatherType.CLOUDY:
        return 15;
      case WeatherType.RAIN:
      case WeatherType.HEAVY_RAIN:
        return 20;
      case WeatherType.STORM:
        return 30;
      case WeatherType.SNOW:
      case WeatherType.HEAVY_SNOW:
        return 15;
      default:
        return 5;
    }
  }

  /**
   * 获取云层类型
   */
  private getCloudType(): CloudData['type'] {
    switch (this.state.type) {
      case WeatherType.STORM:
        return 'storm';
      case WeatherType.RAIN:
      case WeatherType.HEAVY_RAIN:
        return Math.random() > 0.5 ? 'cumulus' : 'stratus';
      case WeatherType.CLOUDY:
        return Math.random() > 0.7 ? 'cirrus' : 'cumulus';
      default:
        return 'cumulus';
    }
  }

  /**
   * 获取云层数据
   */
  public getClouds(): CloudData[] {
    return this.clouds;
  }

  /**
   * 更新粒子
   */
  private updateParticles(dt: number): void {
    const windX = Math.cos(this.state.windDirection * Math.PI / 180) * this.state.windSpeed;
    const windZ = Math.sin(this.state.windDirection * Math.PI / 180) * this.state.windSpeed;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.life -= dt;
      
      if (p.life <= 0 || p.y > this.bounds.height + 50) {
        this.returnParticleToPool(p);
        this.particles.splice(i, 1);
        continue;
      }
      
      const windInfluence = this.config.windInfluence;
      p.vx = windX * windInfluence;
      p.vz = windZ * windInfluence * 0.5;
      
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.z += p.vz * dt * 60;
      
      if (p.type === 'snow') {
        p.rotation += dt * 2;
        p.x += Math.sin(p.rotation) * 0.5;
      }
      
      if (p.type === 'fog') {
        p.opacity = Math.sin(p.life / p.maxLife * Math.PI) * 0.3;
      }
      
      if (p.x < -100) p.x = this.bounds.width + 100;
      if (p.x > this.bounds.width + 100) p.x = -100;
    }
  }

  /**
   * 生成粒子
   */
  private spawnParticles(): void {
    const targetCount = Math.floor(this.config.particleCount * this.state.intensity);
    const spawnCount = Math.min(50, targetCount - this.particles.length);
    
    for (let i = 0; i < spawnCount; i++) {
      const particle = this.getParticleFromPool();
      if (!particle) break;
      
      this.initializeParticle(particle);
      this.particles.push(particle);
      
      this.emit(WeatherEventType.PARTICLE_SPAWNED, { particle });
    }
  }

  /**
   * 初始化粒子属性
   */
  private initializeParticle(particle: WeatherParticle): void {
    const config = this.config;
    const speedRange = config.speedRange;
    const sizeRange = config.sizeRange;
    
    particle.x = Math.random() * this.bounds.width;
    particle.y = -50 - Math.random() * 100;
    particle.z = Math.random() * this.bounds.depth;
    
    const speed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
    const angle = config.fallAngle * Math.PI / 180;
    
    particle.vx = Math.cos(angle + Math.PI / 2) * speed * config.windInfluence;
    particle.vy = Math.sin(angle) * speed;
    particle.vz = (Math.random() - 0.5) * speed * 0.2;
    
    particle.size = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
    particle.opacity = config.color[3];
    particle.rotation = Math.random() * Math.PI * 2;
    
    particle.maxLife = 5 + Math.random() * 5;
    particle.life = particle.maxLife;
    
    switch (this.state.type) {
      case WeatherType.RAIN:
      case WeatherType.HEAVY_RAIN:
      case WeatherType.STORM:
        particle.type = 'rain';
        break;
      case WeatherType.SNOW:
      case WeatherType.HEAVY_SNOW:
        particle.type = 'snow';
        break;
      case WeatherType.FOG:
        particle.type = 'fog';
        particle.x = Math.random() * this.bounds.width;
        particle.y = Math.random() * this.bounds.height;
        particle.maxLife = 10 + Math.random() * 10;
        particle.life = particle.maxLife;
        break;
      case WeatherType.SANDSTORM:
        particle.type = 'dust';
        break;
      case WeatherType.HAIL:
        particle.type = 'hail';
        particle.size *= 2;
        break;
      default:
        particle.type = 'rain';
    }
  }

  /**
   * 更新闪电
   */
  private updateLightning(dt: number): void {
    if (this.state.type !== WeatherType.STORM) {
      this.lightningFlash = 0;
      return;
    }
    
    this.lightningTimer -= dt;
    
    if (this.lightningTimer <= 0) {
      if (Math.random() < 0.3 * this.state.intensity) {
        this.lightningFlash = 1;
        this.lightningTimer = 0.1 + Math.random() * 0.2;
        
        if (Math.random() < 0.5) {
          this.audioEngine.play(SoundType.WARNING);
        }
      } else {
        this.lightningTimer = 2 + Math.random() * 5;
      }
    }
    
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 10);
  }

  /**
   * 设置天气
   */
  public setWeather(
    type: WeatherType,
    intensity: number = 1,
    duration: number = 0
  ): void {
    const previousWeather = this.state.type;
    
    this.state.type = type;
    this.state.intensity = Math.max(0, Math.min(1, intensity));
    this.state.duration = duration;
    this.state.elapsed = 0;
    
    this.config = WEATHER_CONFIGS[type];
    this.state.visibility = this.config.visibility;
    
    this.clearParticles();
    
    if (previousWeather !== type) {
      this.emit(WeatherEventType.WEATHER_CHANGED, {
        weather: type,
        previousWeather,
        intensity,
      });
      this.emit(WeatherEventType.WEATHER_STARTED, {
        weather: type,
        intensity,
      });
    }
    
    if (this.config.soundType) {
      this.audioEngine.play(this.config.soundType);
    }
  }

  /**
   * 清除粒子
   */
  private clearParticles(): void {
    for (const particle of this.particles) {
      this.returnParticleToPool(particle);
    }
    this.particles = [];
  }

  /**
   * 设置风力
   */
  public setWind(speed: number, direction: number): void {
    this.state.windSpeed = speed;
    this.state.windDirection = direction % 360;
  }

  /**
   * 设置环境参数
   */
  public setEnvironment(temperature: number, humidity: number): void {
    this.state.temperature = temperature;
    this.state.humidity = Math.max(0, Math.min(1, humidity));
  }

  /**
   * 获取粒子数据
   */
  public getParticles(): WeatherParticle[] {
    return this.particles;
  }

  /**
   * 获取粒子数量
   */
  public getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * 获取当前天气状态
   */
  public getState(): WeatherState {
    return { ...this.state };
  }

  /**
   * 获取当前天气配置
   */
  public getConfig(): WeatherEffectConfig {
    return { ...this.config };
  }

  /**
   * 获取能见度
   */
  public getVisibility(): number {
    return this.state.visibility;
  }

  /**
   * 获取光照衰减
   */
  public getLightAttenuation(): number {
    return this.config.lightAttenuation * this.state.intensity;
  }

  /**
   * 获取闪电强度
   */
  public getLightningIntensity(): number {
    return this.lightningFlash;
  }

  /**
   * 获取天气颜色叠加
   */
  public getWeatherColorOverlay(): [number, number, number, number] {
    const color = this.config.color;
    return [
      color[0],
      color[1],
      color[2],
      color[3] * this.state.intensity * 0.3,
    ];
  }

  /**
   * 获取雾效参数
   */
  public getFogParams(): { density: number; color: [number, number, number] } {
    if (this.state.type === WeatherType.FOG) {
      return {
        density: 0.005 * this.state.intensity,
        color: [0.8, 0.8, 0.85],
      };
    }
    
    if (this.state.type === WeatherType.SANDSTORM) {
      return {
        density: 0.003 * this.state.intensity,
        color: [0.9, 0.7, 0.4],
      };
    }
    
    return {
      density: 0,
      color: [1, 1, 1],
    };
  }

  /**
   * 根据气候数据自动设置天气
   */
  public updateFromClimate(
    temperature: number,
    precipitation: number,
    extremeWeatherProb: number
  ): void {
    this.state.temperature = temperature;
    
    if (extremeWeatherProb > 0.7) {
      if (temperature > 30) {
        this.setWeather(WeatherType.SANDSTORM, extremeWeatherProb);
      } else {
        this.setWeather(WeatherType.STORM, extremeWeatherProb);
      }
    } else if (precipitation > 5) {
      if (temperature < 0) {
        this.setWeather(WeatherType.HEAVY_SNOW, precipitation / 10);
      } else {
        this.setWeather(WeatherType.HEAVY_RAIN, precipitation / 10);
      }
    } else if (precipitation > 2) {
      if (temperature < 0) {
        this.setWeather(WeatherType.SNOW, precipitation / 5);
      } else {
        this.setWeather(WeatherType.RAIN, precipitation / 5);
      }
    } else if (this.state.humidity > 0.8) {
      this.setWeather(WeatherType.FOG, 0.5);
    } else if (extremeWeatherProb > 0.3) {
      this.setWeather(WeatherType.CLOUDY, extremeWeatherProb);
    } else {
      this.setWeather(WeatherType.CLEAR, 0);
    }
  }

  /**
   * 获取天气对市民的影响
   */
  public getCitizenImpact(): WeatherCitizenImpact {
    const baseImpact: WeatherCitizenImpact = {
      moveSpeed: 1.0,
      workEfficiency: 1.0,
      healthRisk: 0.0,
      moodModifier: 0.0,
      socialDesire: 0.5,
      visibility: 1.0,
      outdoorSuitability: 1.0,
    };

    const intensity = this.state.intensity;

    switch (this.state.type) {
      case WeatherType.CLEAR:
        return {
          ...baseImpact,
          moodModifier: 0.1 * intensity,
          socialDesire: 0.7,
          outdoorSuitability: 1.0,
        };

      case WeatherType.CLOUDY:
        return {
          ...baseImpact,
          moodModifier: -0.05 * intensity,
          socialDesire: 0.5,
          visibility: 0.9,
          outdoorSuitability: 0.9,
        };

      case WeatherType.RAIN:
        return {
          moveSpeed: 0.7 - intensity * 0.2,
          workEfficiency: 0.8 - intensity * 0.1,
          healthRisk: 0.1 * intensity,
          moodModifier: -0.15 * intensity,
          socialDesire: 0.3,
          visibility: 0.7 - intensity * 0.1,
          outdoorSuitability: 0.4,
        };

      case WeatherType.HEAVY_RAIN:
        return {
          moveSpeed: 0.4 - intensity * 0.2,
          workEfficiency: 0.5 - intensity * 0.2,
          healthRisk: 0.3 * intensity,
          moodModifier: -0.3 * intensity,
          socialDesire: 0.1,
          visibility: 0.4 - intensity * 0.1,
          outdoorSuitability: 0.1,
        };

      case WeatherType.SNOW:
        return {
          moveSpeed: 0.6 - intensity * 0.2,
          workEfficiency: 0.7 - intensity * 0.15,
          healthRisk: 0.15 * intensity,
          moodModifier: 0.05 * intensity,
          socialDesire: 0.4,
          visibility: 0.75 - intensity * 0.1,
          outdoorSuitability: 0.5,
        };

      case WeatherType.HEAVY_SNOW:
        return {
          moveSpeed: 0.3 - intensity * 0.15,
          workEfficiency: 0.4 - intensity * 0.2,
          healthRisk: 0.35 * intensity,
          moodModifier: -0.1 * intensity,
          socialDesire: 0.2,
          visibility: 0.5 - intensity * 0.15,
          outdoorSuitability: 0.15,
        };

      case WeatherType.FOG:
        return {
          moveSpeed: 0.5,
          workEfficiency: 0.7,
          healthRisk: 0.05 * intensity,
          moodModifier: -0.1 * intensity,
          socialDesire: 0.3,
          visibility: 0.3 - intensity * 0.1,
          outdoorSuitability: 0.3,
        };

      case WeatherType.STORM:
        return {
          moveSpeed: 0.2 - intensity * 0.15,
          workEfficiency: 0.2 - intensity * 0.15,
          healthRisk: 0.5 * intensity,
          moodModifier: -0.5 * intensity,
          socialDesire: 0.05,
          visibility: 0.25 - intensity * 0.1,
          outdoorSuitability: 0.0,
        };

      case WeatherType.SANDSTORM:
        return {
          moveSpeed: 0.3 - intensity * 0.2,
          workEfficiency: 0.3 - intensity * 0.2,
          healthRisk: 0.4 * intensity,
          moodModifier: -0.4 * intensity,
          socialDesire: 0.1,
          visibility: 0.35 - intensity * 0.15,
          outdoorSuitability: 0.05,
        };

      case WeatherType.HAIL:
        return {
          moveSpeed: 0.3,
          workEfficiency: 0.4,
          healthRisk: 0.45 * intensity,
          moodModifier: -0.35 * intensity,
          socialDesire: 0.1,
          visibility: 0.6 - intensity * 0.1,
          outdoorSuitability: 0.05,
        };

      default:
        return baseImpact;
    }
  }

  /**
   * 判断是否适合户外活动
   */
  public isSuitableForOutdoor(): boolean {
    const impact = this.getCitizenImpact();
    return impact.outdoorSuitability > 0.5;
  }

  /**
   * 获取天气危险等级（0-5）
   */
  public getDangerLevel(): number {
    const impact = this.getCitizenImpact();
    if (impact.healthRisk > 0.4) return 4;
    if (impact.healthRisk > 0.3) return 3;
    if (impact.healthRisk > 0.2) return 2;
    if (impact.healthRisk > 0.1) return 1;
    return 0;
  }

  /**
   * 获取天气描述文本
   */
  public getWeatherDescription(): string {
    const descriptions: Record<WeatherType, string[]> = {
      [WeatherType.CLEAR]: ['晴朗', '万里无云', '阳光明媚'],
      [WeatherType.CLOUDY]: ['多云', '阴天', '乌云密布'],
      [WeatherType.RAIN]: ['小雨', '细雨绵绵', '淅淅沥沥'],
      [WeatherType.HEAVY_RAIN]: ['大雨', '倾盆大雨', '暴雨'],
      [WeatherType.SNOW]: ['小雪', '雪花飘落', '银装素裹'],
      [WeatherType.HEAVY_SNOW]: ['大雪', '鹅毛大雪', '暴风雪'],
      [WeatherType.FOG]: ['大雾', '雾气弥漫', '能见度低'],
      [WeatherType.STORM]: ['暴风雨', '狂风暴雨', '电闪雷鸣'],
      [WeatherType.SANDSTORM]: ['沙尘暴', '黄沙漫天', '风沙肆虐'],
      [WeatherType.HAIL]: ['冰雹', '冰雹袭击', '灾害天气'],
    };

    const options = descriptions[this.state.type] || ['未知天气'];
    const index = Math.floor(this.state.intensity * (options.length - 1));
    return options[Math.min(index, options.length - 1)];
  }

  /**
   * 设置边界
   */
  public setBounds(bounds: { width: number; height: number; depth: number }): void {
    this.bounds = bounds;
  }

  /**
   * 序列化状态
   */
  public serialize(): Record<string, unknown> {
    return {
      type: this.state.type,
      intensity: this.state.intensity,
      windSpeed: this.state.windSpeed,
      windDirection: this.state.windDirection,
      temperature: this.state.temperature,
      humidity: this.state.humidity,
    };
  }

  /**
   * 从序列化数据恢复
   */
  public deserialize(data: Record<string, unknown>): void {
    if (typeof data.type === 'string') {
      this.state.type = data.type as WeatherType;
      this.config = WEATHER_CONFIGS[this.state.type];
    }
    if (typeof data.intensity === 'number') {
      this.state.intensity = data.intensity;
    }
    if (typeof data.windSpeed === 'number') {
      this.state.windSpeed = data.windSpeed;
    }
    if (typeof data.windDirection === 'number') {
      this.state.windDirection = data.windDirection;
    }
    if (typeof data.temperature === 'number') {
      this.state.temperature = data.temperature;
    }
    if (typeof data.humidity === 'number') {
      this.state.humidity = data.humidity;
    }
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.clearParticles();
    this.clouds = [];
    this.particlePool = [];
    this.removeAllListeners();
  }
}

export const weatherEffects = new WeatherEffects();
export default weatherEffects;
