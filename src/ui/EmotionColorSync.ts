/**
 * =============================================================================
 * 永夜熵纪 - 情绪联动配色系统
 * 根据全局情绪变量实时调整CSS变量，让界面本身成为情感指示器
 * =============================================================================
 */

import { logger } from '@/core/utils/Logger';

export interface EmotionState {
  hope: number;      // 0~1 希望值
  unrest: number;    // 0~1 不满值
  chaos: number;     // 0~1 混沌度
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

// 预定义颜色
const COLORS = {
  // 冰霜青 - 正常状态
  FROST_CYAN: { r: 26, g: 239, b: 251 },
  // 霓虹粉 - 不满状态
  NEON_PINK: { r: 255, g: 46, b: 126 },
  // 金色 - 飞升状态
  GOLD: { r: 255, g: 214, b: 0 },
  // 混沌红
  CHAOS_RED: { r: 255, g: 46, b: 126 },
};

class EmotionColorSync {
  private static instance: EmotionColorSync;
  private currentState: EmotionState = { hope: 0.5, unrest: 0.2, chaos: 0.1 };
  private targetState: EmotionState = { hope: 0.5, unrest: 0.2, chaos: 0.1 };
  private animationFrame: number | null = null;
  private lastUpdateTime: number = 0;
  private glitchOverlay: HTMLDivElement | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): EmotionColorSync {
    if (!EmotionColorSync.instance) {
      EmotionColorSync.instance = new EmotionColorSync();
    }
    return EmotionColorSync.instance;
  }

  /**
   * 初始化情绪联动系统
   */
  init(): void {
    this.createGlitchOverlay();
    this.applyState(this.currentState);
    logger.info('EmotionColorSync', '情绪联动配色系统已初始化');
  }

  /**
   * 创建混沌状态Glitch覆盖层
   */
  private createGlitchOverlay(): void {
    if (typeof document === 'undefined') return;
    
    this.glitchOverlay = document.createElement('div');
    this.glitchOverlay.className = 'glitch-overlay';
    this.glitchOverlay.style.display = 'none';
    document.body.appendChild(this.glitchOverlay);
  }

  /**
   * 更新情绪状态（外部调用）
   */
  updateEmotion(state: Partial<EmotionState>): void {
    this.targetState = {
      ...this.targetState,
      ...state,
    };
  }

  /**
   * 启动自动同步（每500ms）
   */
  startAutoSync(getEmotionState: () => EmotionState): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      const newState = getEmotionState();
      this.updateEmotion(newState);
      this.smoothTransition();
    }, 500);

    // 立即执行一次
    const newState = getEmotionState();
    this.updateEmotion(newState);
    this.smoothTransition();
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * 平滑过渡到目标状态
   */
  public smoothTransition(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const lerp = (current: number, target: number, speed: number = 0.1): number => {
      return current + (target - current) * speed;
    };

    const animate = () => {
      this.currentState = {
        hope: lerp(this.currentState.hope, this.targetState.hope),
        unrest: lerp(this.currentState.unrest, this.targetState.unrest),
        chaos: lerp(this.currentState.chaos, this.targetState.chaos),
      };

      this.applyState(this.currentState);

      // 检查是否需要继续动画
      const needsAnimation = 
        Math.abs(this.currentState.hope - this.targetState.hope) > 0.001 ||
        Math.abs(this.currentState.unrest - this.targetState.unrest) > 0.001 ||
        Math.abs(this.currentState.chaos - this.targetState.chaos) > 0.001;

      if (needsAnimation) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * 应用情绪状态到CSS变量
   */
  private applyState(state: EmotionState): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // 设置情绪变量
    root.style.setProperty('--emotion-hope', state.hope.toFixed(3));
    root.style.setProperty('--emotion-unrest', state.unrest.toFixed(3));
    root.style.setProperty('--emotion-chaos', state.chaos.toFixed(3));

    // 计算动态accent颜色
    const dynamicAccent = this.calculateDynamicAccent(state);
    root.style.setProperty('--dynamic-accent', dynamicAccent.color);
    root.style.setProperty('--dynamic-accent-rgb', `${dynamicAccent.rgb.r}, ${dynamicAccent.rgb.g}, ${dynamicAccent.rgb.b}`);

    // 处理混沌状态
    this.handleChaosState(state.chaos);

    // 处理飞升状态
    this.handleAscensionState(state.hope);
  }

  /**
   * 计算动态accent颜色
   */
  private calculateDynamicAccent(state: EmotionState): { color: string; rgb: RGB } {
    // 飞升状态：希望 > 0.95
    if (state.hope > 0.95) {
      return {
        color: '#FFD600',
        rgb: COLORS.GOLD,
      };
    }

    // 不满上升：unrest > 0.5，从冰霜青插值到霓虹粉
    if (state.unrest > 0.5) {
      const t = (state.unrest - 0.5) * 2; // 0.5~1 映射到 0~1
      const rgb = this.lerpColor(COLORS.FROST_CYAN, COLORS.NEON_PINK, t);
      return {
        color: this.rgbToHex(rgb),
        rgb,
      };
    }

    // 正常状态
    return {
      color: '#1AEFFB',
      rgb: COLORS.FROST_CYAN,
    };
  }

  /**
   * 处理混沌状态
   */
  private handleChaosState(chaos: number): void {
    if (!this.glitchOverlay) return;

    if (chaos > 0.7) {
      this.glitchOverlay.style.display = 'block';
      
      // 根据混沌度调整强度
      const intensity = (chaos - 0.7) / 0.3; // 0.7~1 映射到 0~1
      this.glitchOverlay.style.opacity = (intensity * 0.3).toFixed(2);

      // 添加HUD危机脉冲
      document.body.classList.add('crisis-mode');
    } else {
      this.glitchOverlay.style.display = 'none';
      document.body.classList.remove('crisis-mode');
    }
  }

  /**
   * 处理飞升状态
   */
  private handleAscensionState(hope: number): void {
    if (hope > 0.95) {
      document.body.classList.add('ascension-mode');
    } else {
      document.body.classList.remove('ascension-mode');
    }
  }

  /**
   * 颜色插值
   */
  private lerpColor(color1: RGB, color2: RGB, t: number): RGB {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * t),
      g: Math.round(color1.g + (color2.g - color1.g) * t),
      b: Math.round(color1.b + (color2.b - color1.b) * t),
    };
  }

  /**
   * RGB转Hex
   */
  private rgbToHex(rgb: RGB): string {
    const toHex = (n: number): string => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): EmotionState {
    return { ...this.currentState };
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopAutoSync();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.glitchOverlay && this.glitchOverlay.parentNode) {
      this.glitchOverlay.parentNode.removeChild(this.glitchOverlay);
    }
  }
}

// 导出单例
export const emotionColorSync = EmotionColorSync.getInstance();

/**
 * 同步情绪到UI（兼容旧接口）
 */
export function syncEmotionToUI(hope: number, unrest: number, chaos: number): void {
  emotionColorSync.updateEmotion({ hope, unrest, chaos });
  emotionColorSync.smoothTransition();
}

export default EmotionColorSync;
