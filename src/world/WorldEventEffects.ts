/**
 * =============================================================================
 * 永夜熵纪 - 世界事件视觉反馈系统
 * World Event Visual Effects System
 * =============================================================================
 * 
 * 特性：
 * - 灾害、庆典、战争等事件的视觉效果
 * - 屏幕特效（震动、闪烁、色彩偏移）
 * - 事件通知动画
 * - 与音频系统集成
 */

import { EventEmitter } from '../core/EventEmitter';
import { AudioEngine, SoundType } from '../audio/AudioEngine';
import { WorldEventType } from '../core/types/world';
import { DisasterType } from './EpidemicClimateSystem';
import { CatastropheType } from './EntropyEpoch';

/** 事件效果类型 */
export enum EventEffectType {
  SCREEN_SHAKE = 'screen_shake',
  FLASH = 'flash',
  COLOR_SHIFT = 'color_shift',
  VIGNETTE = 'vignette',
  CHROMATIC_ABERRATION = 'chromatic_aberration',
  GLITCH = 'glitch',
  RIPPLE = 'ripple',
  PARTICLE_BURST = 'particle_burst',
}

/** 屏幕震动配置 */
export interface ScreenShakeConfig {
  /** 震动强度 */
  intensity: number;
  /** 震动频率 */
  frequency: number;
  /** 持续时间 */
  duration: number;
  /** 衰减率 */
  decay: number;
}

/** 闪光效果配置 */
export interface FlashConfig {
  /** 闪光颜色 */
  color: [number, number, number, number];
  /** 强度 */
  intensity: number;
  /** 持续时间 */
  duration: number;
  /** 闪烁次数 */
  count: number;
}

/** 颜色偏移配置 */
export interface ColorShiftConfig {
  /** 目标颜色 */
  color: [number, number, number];
  /** 强度 */
  intensity: number;
  /** 持续时间 */
  duration: number;
  /** 过渡时间 */
  transitionTime: number;
}

/** 暗角效果配置 */
export interface VignetteConfig {
  /** 强度 */
  intensity: number;
  /** 半径 */
  radius: number;
  /** 颜色 */
  color: [number, number, number, number];
  /** 持续时间 */
  duration: number;
}

/** 故障效果配置 */
export interface GlitchConfig {
  /** 强度 */
  intensity: number;
  /** 块大小 */
  blockSize: number;
  /** 持续时间 */
  duration: number;
  /** 频率 */
  frequency: number;
}

/** 涟漪效果配置 */
export interface RippleConfig {
  /** 中心点 */
  center: { x: number; y: number };
  /** 半径 */
  radius: number;
  /** 强度 */
  intensity: number;
  /** 波数 */
  waves: number;
  /** 持续时间 */
  duration: number;
}

/** 粒子爆发配置 */
export interface ParticleBurstConfig {
  /** 中心点 */
  center: { x: number; y: number };
  /** 粒子数量 */
  count: number;
  /** 颜色 */
  color: [number, number, number, number];
  /** 速度 */
  speed: number;
  /** 大小 */
  size: number;
  /** 持续时间 */
  duration: number;
}

/** 事件通知配置 */
export interface EventNotificationConfig {
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 图标 */
  icon: string;
  /** 颜色 */
  color: string;
  /** 持续时间 */
  duration: number;
  /** 动画类型 */
  animation: 'slide' | 'fade' | 'bounce' | 'pulse';
  /** 优先级 */
  priority: 'low' | 'normal' | 'high' | 'critical';
}

/** 活跃效果 */
interface ActiveEffect {
  id: string;
  type: EventEffectType;
  config: unknown;
  elapsed: number;
  progress: number;
}

/** 事件效果事件类型 */
export enum EventEffectEventType {
  EFFECT_STARTED = 'effect_started',
  EFFECT_ENDED = 'effect_ended',
  NOTIFICATION_TRIGGERED = 'notification_triggered',
}

/** 事件效果事件数据 */
export interface EventEffectEventData {
  effectType?: EventEffectType;
  effectId?: string;
  notification?: EventNotificationConfig;
}

/** 事件类型到效果的映射 */
const EVENT_EFFECT_MAPPING: Record<string, {
  effects: EventEffectType[];
  sound: SoundType;
  color: [number, number, number];
  priority: 'low' | 'normal' | 'high' | 'critical';
}> = {
  [WorldEventType.CATASTROPHE]: {
    effects: [EventEffectType.SCREEN_SHAKE, EventEffectType.FLASH, EventEffectType.VIGNETTE],
    sound: SoundType.CATASTROPHE,
    color: [1, 0.2, 0.1],
    priority: 'critical',
  },
  [WorldEventType.WAR]: {
    effects: [EventEffectType.SCREEN_SHAKE, EventEffectType.COLOR_SHIFT, EventEffectType.GLITCH],
    sound: SoundType.BATTLE,
    color: [0.8, 0.1, 0.1],
    priority: 'high',
  },
  [WorldEventType.PEACE]: {
    effects: [EventEffectType.COLOR_SHIFT, EventEffectType.RIPPLE],
    sound: SoundType.PEACE,
    color: [0.2, 0.8, 0.4],
    priority: 'normal',
  },
  [WorldEventType.BIRTH]: {
    effects: [EventEffectType.PARTICLE_BURST, EventEffectType.FLASH],
    sound: SoundType.BIRTH,
    color: [0.4, 0.8, 1],
    priority: 'low',
  },
  [WorldEventType.DEATH]: {
    effects: [EventEffectType.VIGNETTE, EventEffectType.COLOR_SHIFT],
    sound: SoundType.DEATH,
    color: [0.3, 0.3, 0.4],
    priority: 'normal',
  },
  [WorldEventType.DISEASE]: {
    effects: [EventEffectType.COLOR_SHIFT, EventEffectType.VIGNETTE],
    sound: SoundType.WARNING,
    color: [0.6, 0.8, 0.2],
    priority: 'high',
  },
  [WorldEventType.FAMINE]: {
    effects: [EventEffectType.COLOR_SHIFT, EventEffectType.VIGNETTE],
    sound: SoundType.WARNING,
    color: [0.7, 0.5, 0.2],
    priority: 'high',
  },
  [WorldEventType.INVENTION]: {
    effects: [EventEffectType.FLASH, EventEffectType.PARTICLE_BURST],
    sound: SoundType.NOTIFICATION,
    color: [0.9, 0.8, 0.2],
    priority: 'normal',
  },
  [WorldEventType.METAMORPHOSIS]: {
    effects: [EventEffectType.CHROMATIC_ABERRATION, EventEffectType.FLASH, EventEffectType.RIPPLE],
    sound: SoundType.NOTIFICATION,
    color: [0.8, 0.4, 1],
    priority: 'high',
  },
  [WorldEventType.AWAKENING]: {
    effects: [EventEffectType.FLASH, EventEffectType.RIPPLE, EventEffectType.PARTICLE_BURST],
    sound: SoundType.BIRTH,
    color: [1, 1, 0.8],
    priority: 'high',
  },
};

/** 灾害类型到效果的映射 */
const DISASTER_EFFECT_MAPPING: Record<DisasterType, {
  effects: EventEffectType[];
  intensity: number;
  color: [number, number, number];
}> = {
  [DisasterType.EARTHQUAKE]: {
    effects: [EventEffectType.SCREEN_SHAKE, EventEffectType.GLITCH],
    intensity: 0.9,
    color: [0.6, 0.4, 0.3],
  },
  [DisasterType.FLOOD]: {
    effects: [EventEffectType.COLOR_SHIFT, EventEffectType.RIPPLE],
    intensity: 0.7,
    color: [0.2, 0.4, 0.8],
  },
  [DisasterType.DROUGHT]: {
    effects: [EventEffectType.COLOR_SHIFT, EventEffectType.VIGNETTE],
    intensity: 0.6,
    color: [0.9, 0.7, 0.3],
  },
  [DisasterType.STORM]: {
    effects: [EventEffectType.SCREEN_SHAKE, EventEffectType.FLASH],
    intensity: 0.8,
    color: [0.4, 0.4, 0.5],
  },
  [DisasterType.WILDFIRE]: {
    effects: [EventEffectType.COLOR_SHIFT, EventEffectType.FLASH],
    intensity: 0.85,
    color: [1, 0.4, 0.1],
  },
  [DisasterType.TSUNAMI]: {
    effects: [EventEffectType.SCREEN_SHAKE, EventEffectType.RIPPLE],
    intensity: 0.95,
    color: [0.1, 0.3, 0.6],
  },
  [DisasterType.VOLCANO]: {
    effects: [EventEffectType.SCREEN_SHAKE, EventEffectType.FLASH, EventEffectType.COLOR_SHIFT],
    intensity: 0.95,
    color: [1, 0.3, 0],
  },
  [DisasterType.PLAGUE]: {
    effects: [EventEffectType.COLOR_SHIFT, EventEffectType.VIGNETTE],
    intensity: 0.7,
    color: [0.4, 0.6, 0.2],
  },
};

/** 熵增灾难效果映射 */
const CATASTROPHE_EFFECT_MAPPING: Record<CatastropheType, {
  effects: EventEffectType[];
  intensity: number;
  color: [number, number, number];
}> = {
  [CatastropheType.ENERGY_CRISIS]: {
    effects: [EventEffectType.VIGNETTE, EventEffectType.GLITCH],
    intensity: 0.7,
    color: [0.8, 0.6, 0],
  },
  [CatastropheType.BIOMASS_DECAY]: {
    effects: [EventEffectType.COLOR_SHIFT, EventEffectType.VIGNETTE],
    intensity: 0.75,
    color: [0.5, 0.3, 0.2],
  },
  [CatastropheType.INFORMATION_OVERFLOW]: {
    effects: [EventEffectType.GLITCH, EventEffectType.CHROMATIC_ABERRATION],
    intensity: 0.8,
    color: [0.2, 0.8, 1],
  },
  [CatastropheType.TRUST_COLLAPSE]: {
    effects: [EventEffectType.COLOR_SHIFT, EventEffectType.VIGNETTE],
    intensity: 0.85,
    color: [0.3, 0.3, 0.4],
  },
  [CatastropheType.SYSTEM_CORRUPTION]: {
    effects: [EventEffectType.GLITCH, EventEffectType.CHROMATIC_ABERRATION, EventEffectType.SCREEN_SHAKE],
    intensity: 0.9,
    color: [0.8, 0.1, 0.1],
  },
  [CatastropheType.ENTROPY_CATASTROPHE]: {
    effects: [EventEffectType.SCREEN_SHAKE, EventEffectType.FLASH, EventEffectType.GLITCH, EventEffectType.VIGNETTE],
    intensity: 1.0,
    color: [0.1, 0, 0.2],
  },
};

/**
 * 世界事件视觉反馈系统
 */
export class WorldEventEffects extends EventEmitter {
  private activeEffects: Map<string, ActiveEffect> = new Map();
  private effectIdCounter: number = 0;
  private audioEngine: AudioEngine;
  private screenOffset: { x: number; y: number } = { x: 0, y: 0 };
  private flashIntensity: number = 0;
  private flashColor: [number, number, number, number] = [1, 1, 1, 1];
  private colorShift: [number, number, number] = [0, 0, 0];
  private colorShiftIntensity: number = 0;
  private vignetteIntensity: number = 0;
  private vignetteRadius: number = 0.5;
  private glitchIntensity: number = 0;
  private chromaticAberration: number = 0;
  private rippleTime: number = 0;
  private rippleCenter: { x: number; y: number } = { x: 0.5, y: 0.5 };

  constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
  }

  /**
   * 更新效果
   */
  public update(deltaTime: number): void {
    const dt = deltaTime / 1000;
    
    this.updateActiveEffects(dt);
    this.updateScreenEffects(dt);
  }

  /**
   * 更新活跃效果
   */
  private updateActiveEffects(dt: number): void {
    const toRemove: string[] = [];
    
    for (const [id, effect] of this.activeEffects) {
      effect.elapsed += dt;
      
      const config = effect.config as { duration: number };
      effect.progress = Math.min(1, effect.elapsed / (config.duration / 1000));
      
      if (effect.progress >= 1) {
        toRemove.push(id);
      }
    }
    
    for (const id of toRemove) {
      const effect = this.activeEffects.get(id);
      this.activeEffects.delete(id);
      this.emit(EventEffectEventType.EFFECT_ENDED, {
        effectType: effect?.type,
        effectId: id,
      });
    }
  }

  /**
   * 更新屏幕效果
   */
  private updateScreenEffects(dt: number): void {
    this.screenOffset = { x: 0, y: 0 };
    this.flashIntensity = Math.max(0, this.flashIntensity - dt * 3);
    this.colorShiftIntensity = Math.max(0, this.colorShiftIntensity - dt * 0.5);
    this.vignetteIntensity = Math.max(0, this.vignetteIntensity - dt * 0.3);
    this.glitchIntensity = Math.max(0, this.glitchIntensity - dt * 2);
    this.chromaticAberration = Math.max(0, this.chromaticAberration - dt);
    this.rippleTime += dt;
    
    for (const effect of this.activeEffects.values()) {
      this.applyEffect(effect);
    }
  }

  /**
   * 应用效果
   */
  private applyEffect(effect: ActiveEffect): void {
    const progress = effect.progress;
    const decay = 1 - progress;
    
    switch (effect.type) {
      case EventEffectType.SCREEN_SHAKE: {
        const config = effect.config as ScreenShakeConfig;
        const intensity = config.intensity * decay * Math.exp(-config.decay * progress);
        const time = effect.elapsed * config.frequency;
        this.screenOffset.x += Math.sin(time * 20) * intensity * 10;
        this.screenOffset.y += Math.cos(time * 25) * intensity * 10;
        break;
      }
      
      case EventEffectType.FLASH: {
        const config = effect.config as FlashConfig;
        const flashProgress = (effect.elapsed * 1000) % (config.duration / config.count);
        const flashIntensity = Math.sin(flashProgress / config.duration * Math.PI * 2 * config.count);
        this.flashIntensity = Math.max(this.flashIntensity, Math.abs(flashIntensity) * config.intensity * decay);
        this.flashColor = config.color;
        break;
      }
      
      case EventEffectType.COLOR_SHIFT: {
        const config = effect.config as ColorShiftConfig;
        this.colorShift = config.color;
        this.colorShiftIntensity = Math.max(this.colorShiftIntensity, config.intensity * decay);
        break;
      }
      
      case EventEffectType.VIGNETTE: {
        const config = effect.config as VignetteConfig;
        this.vignetteIntensity = Math.max(this.vignetteIntensity, config.intensity * decay);
        this.vignetteRadius = config.radius;
        break;
      }
      
      case EventEffectType.GLITCH: {
        const config = effect.config as GlitchConfig;
        this.glitchIntensity = Math.max(this.glitchIntensity, config.intensity * decay);
        break;
      }
      
      case EventEffectType.CHROMATIC_ABERRATION: {
        this.chromaticAberration = Math.max(this.chromaticAberration, 0.01 * decay);
        break;
      }
      
      case EventEffectType.RIPPLE: {
        const config = effect.config as RippleConfig;
        this.rippleCenter = config.center;
        break;
      }
    }
  }

  /**
   * 触发世界事件效果
   */
  public triggerWorldEvent(
    eventType: WorldEventType,
    severity: number = 1,
    position?: { x: number; y: number }
  ): void {
    const mapping = EVENT_EFFECT_MAPPING[eventType];
    if (!mapping) return;
    
    const intensity = Math.max(0, Math.min(1, severity));
    
    for (const effectType of mapping.effects) {
      this.createEffect(effectType, intensity, mapping.color, position);
    }
    
    this.audioEngine.play(mapping.sound);
    
    this.emit(EventEffectEventType.NOTIFICATION_TRIGGERED, {
      notification: {
        title: this.getEventTitle(eventType),
        description: this.getEventDescription(eventType),
        icon: this.getEventIcon(eventType),
        color: `rgb(${mapping.color.map(c => Math.round(c * 255)).join(',')})`,
        duration: 3000,
        animation: 'slide',
        priority: mapping.priority,
      },
    });
  }

  /**
   * 触发灾害效果
   */
  public triggerDisaster(
    disasterType: DisasterType,
    severity: number = 1,
    position?: { x: number; y: number }
  ): void {
    const mapping = DISASTER_EFFECT_MAPPING[disasterType];
    if (!mapping) return;
    
    const intensity = Math.max(0, Math.min(1, severity)) * mapping.intensity;
    
    for (const effectType of mapping.effects) {
      this.createEffect(effectType, intensity, mapping.color, position);
    }
    
    this.audioEngine.play(SoundType.CATASTROPHE);
  }

  /**
   * 触发熵增灾难效果
   */
  public triggerCatastrophe(
    catastropheType: CatastropheType,
    severity: number = 1
  ): void {
    const mapping = CATASTROPHE_EFFECT_MAPPING[catastropheType];
    if (!mapping) return;
    
    const intensity = Math.max(0, Math.min(1, severity)) * mapping.intensity;
    
    for (const effectType of mapping.effects) {
      this.createEffect(effectType, intensity, mapping.color);
    }
    
    this.audioEngine.play(SoundType.CATASTROPHE);
  }

  /**
   * 创建效果
   */
  private createEffect(
    type: EventEffectType,
    intensity: number,
    color: [number, number, number],
    position?: { x: number; y: number }
  ): string {
    const id = `effect_${++this.effectIdCounter}`;
    let config: unknown;
    
    switch (type) {
      case EventEffectType.SCREEN_SHAKE:
        config = {
          intensity,
          frequency: 10 + Math.random() * 5,
          duration: 500 + intensity * 1000,
          decay: 2,
        } as ScreenShakeConfig;
        break;
        
      case EventEffectType.FLASH:
        config = {
          color: [...color, 1] as [number, number, number, number],
          intensity,
          duration: 300 + intensity * 500,
          count: Math.ceil(1 + intensity * 3),
        } as FlashConfig;
        break;
        
      case EventEffectType.COLOR_SHIFT:
        config = {
          color,
          intensity,
          duration: 1000 + intensity * 2000,
          transitionTime: 300,
        } as ColorShiftConfig;
        break;
        
      case EventEffectType.VIGNETTE:
        config = {
          intensity,
          radius: 0.3 + (1 - intensity) * 0.4,
          color: [0, 0, 0, 1],
          duration: 1500 + intensity * 1500,
        } as VignetteConfig;
        break;
        
      case EventEffectType.GLITCH:
        config = {
          intensity,
          blockSize: 10 + Math.random() * 20,
          duration: 500 + intensity * 1000,
          frequency: 5 + intensity * 10,
        } as GlitchConfig;
        break;
        
      case EventEffectType.CHROMATIC_ABERRATION:
        config = {
          intensity,
          duration: 800 + intensity * 1200,
        };
        break;
        
      case EventEffectType.RIPPLE:
        config = {
          center: position ?? { x: 0.5, y: 0.5 },
          radius: 100 + intensity * 200,
          intensity,
          waves: 3 + Math.floor(intensity * 3),
          duration: 1000 + intensity * 1000,
        } as RippleConfig;
        break;
        
      case EventEffectType.PARTICLE_BURST:
        config = {
          center: position ?? { x: 0.5, y: 0.5 },
          count: Math.floor(20 + intensity * 80),
          color: [...color, 1] as [number, number, number, number],
          speed: 100 + intensity * 200,
          size: 5 + intensity * 10,
          duration: 500 + intensity * 500,
        } as ParticleBurstConfig;
        break;
        
      default:
        config = { intensity, duration: 1000 };
    }
    
    const effect: ActiveEffect = {
      id,
      type,
      config,
      elapsed: 0,
      progress: 0,
    };
    
    this.activeEffects.set(id, effect);
    
    this.emit(EventEffectEventType.EFFECT_STARTED, {
      effectType: type,
      effectId: id,
    });
    
    return id;
  }

  /**
   * 获取事件标题
   */
  private getEventTitle(eventType: WorldEventType): string {
    const titles: Record<WorldEventType, string> = {
      [WorldEventType.BIRTH]: '新生命诞生',
      [WorldEventType.DEATH]: '生命消逝',
      [WorldEventType.DISEASE]: '疾病爆发',
      [WorldEventType.FAMINE]: '饥荒蔓延',
      [WorldEventType.WAR]: '战争爆发',
      [WorldEventType.PEACE]: '和平降临',
      [WorldEventType.INVENTION]: '重大发明',
      [WorldEventType.CATASTROPHE]: '灾难降临',
      [WorldEventType.METAMORPHOSIS]: '蜕变时刻',
      [WorldEventType.AWAKENING]: '觉醒之时',
    };
    return titles[eventType] ?? '未知事件';
  }

  /**
   * 获取事件描述
   */
  private getEventDescription(eventType: WorldEventType): string {
    const descriptions: Record<WorldEventType, string> = {
      [WorldEventType.BIRTH]: '一个新的生命来到这个世界',
      [WorldEventType.DEATH]: '一个生命离开了这个世界',
      [WorldEventType.DISEASE]: '疾病正在蔓延，请注意防护',
      [WorldEventType.FAMINE]: '食物短缺，人们正在挨饿',
      [WorldEventType.WAR]: '冲突升级，战争已经爆发',
      [WorldEventType.PEACE]: '和平协议签署，战争结束',
      [WorldEventType.INVENTION]: '一项重大发明改变了世界',
      [WorldEventType.CATASTROPHE]: '灾难性事件正在发生',
      [WorldEventType.METAMORPHOSIS]: '世界正在经历蜕变',
      [WorldEventType.AWAKENING]: '某种力量正在觉醒',
    };
    return descriptions[eventType] ?? '';
  }

  /**
   * 获取事件图标
   */
  private getEventIcon(eventType: WorldEventType): string {
    const icons: Record<WorldEventType, string> = {
      [WorldEventType.BIRTH]: '👶',
      [WorldEventType.DEATH]: '💀',
      [WorldEventType.DISEASE]: '🦠',
      [WorldEventType.FAMINE]: '🌾',
      [WorldEventType.WAR]: '⚔️',
      [WorldEventType.PEACE]: '🕊️',
      [WorldEventType.INVENTION]: '💡',
      [WorldEventType.CATASTROPHE]: '🌋',
      [WorldEventType.METAMORPHOSIS]: '🦋',
      [WorldEventType.AWAKENING]: '✨',
    };
    return icons[eventType] ?? '❓';
  }

  /**
   * 触发自定义通知
   */
  public triggerNotification(config: EventNotificationConfig): void {
    this.emit(EventEffectEventType.NOTIFICATION_TRIGGERED, {
      notification: config,
    });
  }

  /**
   * 触发屏幕震动
   */
  public shake(intensity: number, duration: number = 500): void {
    this.createEffect(EventEffectType.SCREEN_SHAKE, intensity, [1, 1, 1]);
  }

  /**
   * 触发闪光
   */
  public flash(color: [number, number, number] = [1, 1, 1], intensity: number = 1): void {
    this.createEffect(EventEffectType.FLASH, intensity, color);
  }

  /**
   * 获取屏幕偏移
   */
  public getScreenOffset(): { x: number; y: number } {
    return { ...this.screenOffset };
  }

  /**
   * 获取闪光强度
   */
  public getFlashIntensity(): number {
    return this.flashIntensity;
  }

  /**
   * 获取闪光颜色
   */
  public getFlashColor(): [number, number, number, number] {
    return [...this.flashColor] as [number, number, number, number];
  }

  /**
   * 获取颜色偏移
   */
  public getColorShift(): { color: [number, number, number]; intensity: number } {
    return {
      color: [...this.colorShift] as [number, number, number],
      intensity: this.colorShiftIntensity,
    };
  }

  /**
   * 获取暗角参数
   */
  public getVignette(): { intensity: number; radius: number } {
    return {
      intensity: this.vignetteIntensity,
      radius: this.vignetteRadius,
    };
  }

  /**
   * 获取故障强度
   */
  public getGlitchIntensity(): number {
    return this.glitchIntensity;
  }

  /**
   * 获取色差强度
   */
  public getChromaticAberration(): number {
    return this.chromaticAberration;
  }

  /**
   * 获取涟漪参数
   */
  public getRipple(): { center: { x: number; y: number }; time: number } {
    return {
      center: { ...this.rippleCenter },
      time: this.rippleTime,
    };
  }

  /**
   * 获取活跃效果数量
   */
  public getActiveEffectCount(): number {
    return this.activeEffects.size;
  }

  /**
   * 清除所有效果
   */
  public clearAllEffects(): void {
    this.activeEffects.clear();
    this.screenOffset = { x: 0, y: 0 };
    this.flashIntensity = 0;
    this.colorShiftIntensity = 0;
    this.vignetteIntensity = 0;
    this.glitchIntensity = 0;
    this.chromaticAberration = 0;
  }

  /**
   * 序列化状态
   */
  public serialize(): Record<string, unknown> {
    return {
      activeEffects: Array.from(this.activeEffects.entries()).map(([id, effect]) => ({
        id,
        type: effect.type,
        progress: effect.progress,
      })),
    };
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.clearAllEffects();
    this.removeAllListeners();
  }
}

export const worldEventEffects = new WorldEventEffects();
export default worldEventEffects;
