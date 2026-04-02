/**
 * 无障碍管理器
 * 管理各种无障碍功能和设置
 */

import { logger } from '@/core/utils/Logger';

export interface AccessibilitySettings {
  // 视觉辅助
  highContrast: boolean;
  reducedMotion: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  screenReaderOptimized: boolean;
  
  // 听觉辅助
  subtitlesEnabled: boolean;
  audioDescriptions: boolean;
  volume: number;
  
  // 运动辅助
  keyboardNavigation: boolean;
  switchControl: boolean;
  eyeTracking: boolean;
  
  // 认知辅助
  simplifiedUI: boolean;
  extendedTime: boolean;
  clearFocus: boolean;
}

export interface AccessibilityAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  id?: string;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  colorBlindMode: 'none',
  fontSize: 'medium',
  screenReaderOptimized: false,
  subtitlesEnabled: true,
  audioDescriptions: false,
  volume: 1.0,
  keyboardNavigation: false,
  switchControl: false,
  eyeTracking: false,
  simplifiedUI: false,
  extendedTime: false,
  clearFocus: true,
};

class AccessibilityManager {
  private settings: AccessibilitySettings;
  private listeners: Map<string, Set<(settings: AccessibilitySettings) => void>> = new Map();
  private liveRegion: HTMLElement | null = null;
  private prefersReducedMotion: boolean = false;
  private prefersHighContrast: boolean = false;

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.init();
  }

  /**
   * 初始化
   */
  private init(): void {
    // 监听系统偏好
    this.setupSystemPreferenceListeners();
    
    // 创建 Live Region 用于屏幕阅读器
    this.createLiveRegion();
    
    // 从存储加载设置
    this.loadSettings();
  }

  /**
   * 设置系统偏好监听
   */
  private setupSystemPreferenceListeners(): void {
    // 减少动画偏好
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = motionQuery.matches;
    
    motionQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      if (this.settings.reducedMotion) {
        this.applyReducedMotion(e.matches);
      }
    });

    // 高对比度偏好
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    this.prefersHighContrast = contrastQuery.matches;
    
    contrastQuery.addEventListener('change', (e) => {
      this.prefersHighContrast = e.matches;
      if (this.settings.highContrast) {
        this.applyHighContrast(e.matches);
      }
    });

    // 焦点可见性
    if (window.matchMedia('(pointer: coarse)').matches) {
      this.settings.keyboardNavigation = false;
    }
  }

  /**
   * 创建 Live Region
   */
  private createLiveRegion(): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.liveRegion);
  }

  /**
   * 加载设置
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('accessibility_settings');
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        this.applyAllSettings();
      }
    } catch (error) {
      logger.error('Accessibility', '加载设置失败', error as Error);
    }
  }

  /**
   * 保存设置
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('accessibility_settings', JSON.stringify(this.settings));
    } catch (error) {
      logger.error('Accessibility', '保存设置失败', error as Error);
    }
  }

  /**
   * 应用所有设置
   */
  public applyAllSettings(): void {
    this.applyHighContrast(this.settings.highContrast);
    this.applyReducedMotion(this.settings.reducedMotion);
    this.applyColorBlindMode(this.settings.colorBlindMode);
    this.applyFontSize(this.settings.fontSize);
    this.applyKeyboardNavigation(this.settings.keyboardNavigation);
    this.applySimplifiedUI(this.settings.simplifiedUI);
  }

  /**
   * 获取设置
   */
  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  public updateSettings(updates: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.applyAllSettings();
    this.notifyListeners('settingsChange', this.settings);
  }

  /**
   * 重置设置
   */
  public resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.applyAllSettings();
    this.notifyListeners('reset', this.settings);
  }

  /**
   * 应用高对比度
   */
  private applyHighContrast(enabled: boolean): void {
    document.documentElement.classList.toggle('high-contrast', enabled);
    
    if (enabled) {
      document.documentElement.style.setProperty('--text-color', '#ffffff');
      document.documentElement.style.setProperty('--bg-color', '#000000');
      document.documentElement.style.setProperty('--border-color', '#ffffff');
    } else {
      document.documentElement.style.removeProperty('--text-color');
      document.documentElement.style.removeProperty('--bg-color');
      document.documentElement.style.removeProperty('--border-color');
    }
  }

  /**
   * 应用减少动画
   */
  private applyReducedMotion(enabled: boolean): void {
    document.documentElement.classList.toggle('reduced-motion', enabled);
    
    if (enabled || this.prefersReducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.documentElement.style.setProperty('--transition-duration', '0.01ms');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.style.removeProperty('--transition-duration');
    }
  }

  /**
   * 应用色盲模式
   */
  private applyColorBlindMode(mode: string): void {
    document.documentElement.dataset.colorBlindMode = mode;
    
    // 应用滤镜
    const filters: Record<string, string> = {
      none: 'none',
      protanopia: 'url(#protanopia)',
      deuteranopia: 'url(#deuteranopia)',
      tritanopia: 'url(#tritanopia)',
    };
    
    document.documentElement.style.filter = filters[mode] || 'none';
  }

  /**
   * 应用字体大小
   */
  private applyFontSize(size: string): void {
    const sizes: Record<string, string> = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px',
    };
    
    document.documentElement.style.fontSize = sizes[size] || '16px';
  }

  /**
   * 应用键盘导航
   */
  private applyKeyboardNavigation(enabled: boolean): void {
    document.documentElement.classList.toggle('keyboard-nav', enabled);
    
    if (enabled) {
      // 确保焦点样式可见
      const style = document.createElement('style');
      style.textContent = `
        *:focus {
          outline: 2px solid #a78bfa !important;
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * 应用简化界面
   */
  private applySimplifiedUI(enabled: boolean): void {
    document.documentElement.classList.toggle('simplified-ui', enabled);
  }

  /**
   * 宣布消息（屏幕阅读器）
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = '';
    
    // 延迟以确保屏幕阅读器能检测到变化
    requestAnimationFrame(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    });
  }

  /**
   * 注册设置变化监听
   */
  public onSettingsChange(callback: (settings: AccessibilitySettings) => void): () => void {
    return this.registerListener('settingsChange', callback);
  }

  /**
   * 注册重置监听
   */
  public onReset(callback: (settings: AccessibilitySettings) => void): () => void {
    return this.registerListener('reset', callback);
  }

  /**
   * 注册监听
   */
  private registerListener(
    event: string, 
    callback: (settings: AccessibilitySettings) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: string, settings: AccessibilitySettings): void {
    this.listeners.get(event)?.forEach(callback => callback(settings));
  }

  /**
   * 检查是否为屏幕阅读器用户
   */
  public isScreenReaderUser(): boolean {
    return this.settings.screenReaderOptimized;
  }

  /**
   * 获取焦点元素
   */
  public getFocusedElement(): HTMLElement | null {
    return document.activeElement as HTMLElement;
  }

  /**
   * 将焦点移到指定元素
   */
  public focusElement(element: HTMLElement | string): void {
    const target = typeof element === 'string' 
      ? document.querySelector(element) 
      : element;
    
    if (target instanceof HTMLElement) {
      target.focus();
      this.announce(`焦点已移动到 ${target.getAttribute('aria-label') || target.tagName}`);
    }
  }

  /**
   * 获取所有可聚焦元素
   */
  public getFocusableElements(container?: HTMLElement): HTMLElement[] {
    const root = container || document.body;
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    
    return Array.from(root.querySelectorAll<HTMLElement>(selector));
  }

  /**
   * 焦点导航
   */
  public navigateFocus(direction: 'next' | 'prev' | 'first' | 'last'): void {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;

    const current = this.getFocusedElement();
    let index = focusable.indexOf(current as HTMLElement);

    switch (direction) {
      case 'next':
        index = index < focusable.length - 1 ? index + 1 : 0;
        break;
      case 'prev':
        index = index > 0 ? index - 1 : focusable.length - 1;
        break;
      case 'first':
        index = 0;
        break;
      case 'last':
        index = focusable.length - 1;
        break;
    }

    focusable[index]?.focus();
  }

  /**
   * 销毁
   */
  public destroy(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    this.listeners.clear();
  }
}

// 单例实例
export const accessibilityManager = new AccessibilityManager();

export { AccessibilityManager, DEFAULT_SETTINGS };
