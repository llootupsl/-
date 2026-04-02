/**
 * =============================================================================
 * Canvas 2D 渲染器 - WebGPU 回退方案
 * 永夜熵纪 - 汉字雨 + 体素小人 + 后处理效果
 * =============================================================================
 * 
 * 特性：
 * - 支持昼夜循环渲染
 * - 支持天气粒子效果（雨、雪、云层）
 * - 动态光照和阴影
 * - 后处理效果
 */

import { LODLevel } from '@/core/constants';
import type { RenderableCitizen } from './WebGPURenderer';
import { WeatherType, type WeatherParticle, type CloudData } from '@/world/WeatherEffects';
import type { DayNightState } from '@/world/DayNightCycle';
import { eventCleanupManager } from '@/core/EventCleanupManager';
import { logger } from '@/core/utils/Logger';

/** 粒子数据结构 */
interface CanvasParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  char: string;
  color: string;
  size: number;
  opacity: number;
  life: number;
  speed: number;
}

/** 渲染环境状态 */
interface RenderEnvironment {
  dayNight: DayNightState | null;
  weatherParticles: WeatherParticle[];
  clouds: CloudData[];
  weatherType: WeatherType;
  weatherIntensity: number;
}

/**
 * Canvas 2D 渲染器 - 纯前端回退
 * 当 WebGPU 不可用时使用 Canvas2D API 进行渲染
 * 虽然性能不如 WebGPU，但功能完整
 */
export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;
  private initialized: boolean = false;
  private animationId: number = 0;
  private lastTime: number = 0;

  // 粒子系统
  private particles: CanvasParticle[] = [];
  private maxParticles: number = 50000;

  // 市民
  private citizens: RenderableCitizen[] = [];

  // 相机
  private camera = {
    x: 0,
    y: 50,
    z: 100,
    zoom: 1,
    rotation: 0,
  };

  // 背景颜色
  private backgroundColor: string = '#050508';

  // 扫描线效果
  private scanlineIntensity: number = 0.03;

  // 时间
  private time: number = 0;

  // FPS
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsTime: number = 0;

  // 环境状态
  private environment: RenderEnvironment = {
    dayNight: null,
    weatherParticles: [],
    clouds: [],
    weatherType: WeatherType.CLEAR,
    weatherIntensity: 0,
  };

  /* ==========================================================================
     粒子数据结构
     ========================================================================== */

  private static readonly CHARS = '永夜熵纪数字市民智慧混沌宇宙文明福祸相依光暗交替'.split('');
  private static readonly COLORS = [
    '#00f0ff', // 青色
    '#ff00ff', // 洋红
    '#39ff14', // 绿色
    '#ffd700', // 金色
    '#ff6b6b', // 红色
    '#00ffcc', // 青绿
    '#9933ff', // 紫色
  ];

  /* ==========================================================================
     初始化
     ========================================================================== */

  /**
   * 初始化渲染器
   */
  public init(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    if (!this.ctx) {
      logger.error('Canvas2DRenderer', '无法获取 Canvas2D 上下文');
      return false;
    }

    this.handleResize();
    eventCleanupManager.register(window, 'resize', () => this.handleResize());

    this.initParticles();

    this.initialized = true;
    console.log('[Canvas2DRenderer] Canvas2D 渲染器初始化完成');
    return true;
  }

  /**
   * 处理窗口大小调整
   */
  private handleResize(): void {
    if (!this.canvas) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx?.scale(dpr, dpr);

    this.width = width;
    this.height = height;
  }

  /**
   * 初始化粒子系统
   */
  private initParticles(): void {
    this.particles = [];

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  /**
   * 创建单个粒子
   */
  private createParticle(index?: number): CanvasParticle {
    const char = Canvas2DRenderer.CHARS[
      index !== undefined
        ? index % Canvas2DRenderer.CHARS.length
        : Math.floor(Math.random() * Canvas2DRenderer.CHARS.length)
    ];
    const color = Canvas2DRenderer.COLORS[
      Math.floor(Math.random() * Canvas2DRenderer.COLORS.length)
    ];
    const speed = 0.5 + Math.random() * 3;

    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      z: (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -speed,
      vz: 0,
      char,
      color,
      size: 10 + Math.random() * 12,
      opacity: 0.3 + Math.random() * 0.7,
      life: Math.random(),
      speed,
    };
  }

  /* ==========================================================================
     粒子更新
     ========================================================================== */

  /**
   * 更新粒子（CPU 模拟）
   */
  public updateParticles(deltaTime: number): void {
    const dt = deltaTime / 1000;
    const gravity = 50; // 像素/秒²
    const wind = 10;   // 水平风力

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // 重力
      p.vy += gravity * dt;

      // 风力（随高度变化）
      const windEffect = wind * (1 - p.y / this.height) * dt;
      p.vx += (Math.random() - 0.5) * windEffect;

      // 湍流
      p.vx += (Math.random() - 0.5) * 20 * dt;
      p.vy += (Math.random() - 0.5) * 5 * dt;

      // 速度阻尼
      p.vx *= 0.98;
      p.vy *= 0.99;

      // 位置更新
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      // 生命周期
      p.life -= dt * 0.1;

      // 边界处理
      if (p.y < -20 || p.life <= 0) {
        // 从顶部重生
        p.x = Math.random() * this.width;
        p.y = this.height + 20;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = -p.speed;
        p.life = 1;
        p.char = Canvas2DRenderer.CHARS[Math.floor(Math.random() * Canvas2DRenderer.CHARS.length)];
        p.color = Canvas2DRenderer.COLORS[Math.floor(Math.random() * Canvas2DRenderer.COLORS.length)];
      }

      // 左右环绕
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;

      // 闪烁效果
      p.opacity = 0.3 + Math.sin(this.time * 3 + i * 0.1) * 0.2 + Math.random() * 0.1;
    }
  }

  /* ==========================================================================
     渲染
     ========================================================================== */

  /**
   * 渲染一帧
   */
  public render(deltaTime: number): void {
    if (!this.initialized || !this.ctx) return;

    this.time += deltaTime / 1000;

    // FPS 计算
    this.frameCount++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = 0;
    }

    const ctx = this.ctx;

    // 根据昼夜状态调整背景
    this.updateBackgroundColor();

    // 清空画布（带拖尾效果）
    ctx.fillStyle = this.backgroundColor;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.globalAlpha = 1;

    // 绘制背景渐变
    this.drawBackground();

    // 绘制云层
    this.drawClouds();

    // 绘制市民（体素小人）
    this.drawCitizens();

    // 绘制天气粒子（雨、雪等）
    this.drawWeatherParticles();

    // 绘制粒子（汉字雨）
    this.drawParticles();

    // 后处理效果
    this.applyPostProcessing();

    // 更新粒子
    this.updateParticles(deltaTime);
  }

  /**
   * 更新背景颜色（根据昼夜）
   */
  private updateBackgroundColor(): void {
    const dayNight = this.environment.dayNight;
    if (!dayNight) {
      this.backgroundColor = '#050508';
      return;
    }

    const skyColor = dayNight.skyColor;
    const r = Math.floor(skyColor[0] * 255 * 0.3);
    const g = Math.floor(skyColor[1] * 255 * 0.3);
    const b = Math.floor(skyColor[2] * 255 * 0.3);
    
    this.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * 绘制云层
   */
  private drawClouds(): void {
    if (!this.ctx || this.environment.clouds.length === 0) return;

    const ctx = this.ctx;
    const dayNight = this.environment.dayNight;
    const lightIntensity = dayNight ? dayNight.lightIntensity : 1;

    for (const cloud of this.environment.clouds) {
      const screenX = cloud.x;
      const screenY = this.height * 0.1 + cloud.y * 0.3;
      
      ctx.save();
      ctx.globalAlpha = cloud.opacity * (0.3 + lightIntensity * 0.4);
      
      const gradient = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, cloud.width * 0.5
      );
      
      const baseColor = this.getCloudColor(cloud.type, lightIntensity);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, baseColor.replace('1)', '0.6)'));
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(screenX, screenY, cloud.width * 0.5, cloud.height * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }

  /**
   * 获取云层颜色
   */
  private getCloudColor(type: CloudData['type'], lightIntensity: number): string {
    const brightness = 0.5 + lightIntensity * 0.5;
    
    switch (type) {
      case 'storm':
        return `rgba(${Math.floor(60 * brightness)}, ${Math.floor(60 * brightness)}, ${Math.floor(80 * brightness)}, 1)`;
      case 'stratus':
        return `rgba(${Math.floor(150 * brightness)}, ${Math.floor(150 * brightness)}, ${Math.floor(160 * brightness)}, 1)`;
      case 'cirrus':
        return `rgba(${Math.floor(220 * brightness)}, ${Math.floor(220 * brightness)}, ${Math.floor(230 * brightness)}, 1)`;
      default:
        return `rgba(${Math.floor(180 * brightness)}, ${Math.floor(180 * brightness)}, ${Math.floor(190 * brightness)}, 1)`;
    }
  }

  /**
   * 绘制天气粒子（雨、雪）
   */
  private drawWeatherParticles(): void {
    if (!this.ctx || this.environment.weatherParticles.length === 0) return;

    const ctx = this.ctx;
    const dayNight = this.environment.dayNight;
    const lightIntensity = dayNight ? dayNight.lightIntensity : 1;

    for (const particle of this.environment.weatherParticles) {
      const screenX = particle.x;
      const screenY = particle.y;
      
      ctx.save();
      ctx.globalAlpha = particle.opacity * lightIntensity;
      
      switch (particle.type) {
        case 'rain':
          this.drawRainDrop(ctx, screenX, screenY, particle.size);
          break;
        case 'snow':
          this.drawSnowflake(ctx, screenX, screenY, particle.size, particle.rotation);
          break;
        case 'hail':
          this.drawHail(ctx, screenX, screenY, particle.size);
          break;
        case 'fog':
          this.drawFogParticle(ctx, screenX, screenY, particle.size, particle.opacity);
          break;
        case 'dust':
          this.drawDustParticle(ctx, screenX, screenY, particle.size);
          break;
      }
      
      ctx.restore();
    }
  }

  /**
   * 绘制雨滴
   */
  private drawRainDrop(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + size * 3);
    ctx.stroke();
  }

  /**
   * 绘制雪花
   */
  private drawSnowflake(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
    }
    
    ctx.fill();
    ctx.restore();
  }

  /**
   * 绘制冰雹
   */
  private drawHail(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制雾粒子
   */
  private drawFogParticle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number): void {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, `rgba(200, 200, 210, ${opacity * 0.3})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制沙尘粒子
   */
  private drawDustParticle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = 'rgba(180, 140, 80, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 设置环境状态
   */
  public setEnvironment(env: Partial<RenderEnvironment>): void {
    this.environment = { ...this.environment, ...env };
  }

  /**
   * 绘制背景
   */
  private drawBackground(): void {
    if (!this.ctx) return;

    const ctx = this.ctx;

    // 径向渐变
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width * 0.7
    );
    gradient.addColorStop(0, '#0a0a15');
    gradient.addColorStop(0.5, '#050508');
    gradient.addColorStop(1, '#020204');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 网格线
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 0.5;

    const gridSize = 50;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  /**
   * 绘制市民（简化的体素表示）
   */
  private drawCitizens(): void {
    if (!this.ctx) return;

    const ctx = this.ctx;

    for (const citizen of this.citizens) {
      if (!citizen.visible) continue;

      // 计算投影位置
      const scale = this.camera.zoom * 2;
      const screenX = this.width / 2 + citizen.position.x * scale;
      const screenY = this.height / 2 - citizen.position.z * scale;

      // 视锥剔除
      if (screenX < -50 || screenX > this.width + 50 ||
          screenY < -50 || screenY > this.height + 50) {
        continue;
      }

      // 根据 LOD 级别绘制
      switch (citizen.lodLevel) {
        case LODLevel.CLOUD:
          // 远处：汉字
          this.drawHanziCitizen(ctx, screenX, screenY, citizen);
          break;

        case LODLevel.GRID:
          // 中距离：简单网格
          this.drawGridCitizen(ctx, screenX, screenY, citizen, scale);
          break;

        case LODLevel.VOXEL:
          // 近景：体素小人
          this.drawVoxelCitizen(ctx, screenX, screenY, citizen, scale);
          break;

        case LODLevel.PORTRAIT:
          // 激活态：详细头像
          this.drawPortraitCitizen(ctx, screenX, screenY, citizen, scale);
          break;
      }
    }
  }

  /**
   * 绘制汉字市民
   */
  private drawHanziCitizen(ctx: CanvasRenderingContext2D, x: number, y: number, citizen: RenderableCitizen): void {
    const chars = '市民农工商兵学';
    const char = chars[Math.floor(Math.random() * chars.length)] || '民';

    ctx.font = '12px monospace';
    ctx.fillStyle = citizen.color || this.getMoodColor(citizen.mood);
    ctx.globalAlpha = 0.6;
    ctx.fillText(char, x - 6, y);
    ctx.globalAlpha = 1;
  }

  /**
   * 绘制网格市民
   */
  private drawGridCitizen(ctx: CanvasRenderingContext2D, x: number, y: number, citizen: RenderableCitizen, scale: number): void {
    const size = 4 * scale;
    ctx.fillStyle = citizen.color || this.getMoodColor(citizen.mood);
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.globalAlpha = 1;
  }

  /**
   * 绘制体素市民
   */
  private drawVoxelCitizen(ctx: CanvasRenderingContext2D, x: number, y: number, citizen: RenderableCitizen, scale: number): void {
    const baseSize = 8 * scale;
    const moodColor = citizen.color || this.getMoodColor(citizen.mood);

    // 身体
    ctx.fillStyle = moodColor;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x - baseSize / 2, y - baseSize / 2, baseSize, baseSize * 1.5);

    // 头部
    ctx.beginPath();
    ctx.arc(x, y - baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 发光效果
    ctx.shadowColor = moodColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(x - baseSize / 2, y - baseSize / 2, baseSize, baseSize * 1.5);
    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1;
  }

  /**
   * 绘制肖像市民（详细头像）
   */
  private drawPortraitCitizen(ctx: CanvasRenderingContext2D, x: number, y: number, citizen: RenderableCitizen, scale: number): void {
    const size = 40 * scale;
    const moodColor = citizen.color || this.getMoodColor(citizen.mood);

    // 外发光
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, moodColor);
    gradient.addColorStop(0.5, moodColor.replace(')', ', 0.3)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 主体
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = moodColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 内部特征（简化的程序化面孔）
    ctx.fillStyle = moodColor;
    ctx.globalAlpha = 0.8;

    // 眼睛
    const eyeY = y - size * 0.1;
    ctx.beginPath();
    ctx.arc(x - size * 0.15, eyeY, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + size * 0.15, eyeY, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴
    ctx.beginPath();
    ctx.arc(x, y + size * 0.15, size * 0.15, 0, Math.PI);
    ctx.stroke();

    // 名字
    if (citizen.faceData) {
      ctx.font = `${Math.max(8, size * 0.15)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = moodColor;
      ctx.textAlign = 'center';
      ctx.fillText(citizen.name || '市民', x, y + size * 0.7);
    }

    ctx.globalAlpha = 1;
  }

  /**
   * 绘制汉字雨粒子
   */
  private drawParticles(): void {
    if (!this.ctx) return;

    const ctx = this.ctx;

    ctx.font = '14px monospace, "Noto Sans SC"';
    ctx.textAlign = 'center';

    for (const p of this.particles) {
      // 跳过离屏粒子
      if (p.x < -20 || p.x > this.width + 20 || p.y < -20 || p.y > this.height + 20) {
        continue;
      }

      // 深度效果：远处更暗更小
      const depthFactor = Math.max(0.3, 1 - Math.abs(p.z) / 200);

      ctx.font = `${p.size * depthFactor}px monospace, "Noto Sans SC"`;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * depthFactor;

      // 发光效果
      if (p.opacity > 0.7) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }

      ctx.fillText(p.char, p.x, p.y);

      // 重置发光
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
  }

  /**
   * 应用后处理效果
   */
  private applyPostProcessing(): void {
    if (!this.ctx) return;

    const ctx = this.ctx;

    // 扫描线效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < this.height; y += 3) {
      ctx.fillRect(0, y, this.width, 1);
    }

    // 暗角
    const vignetteGradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.width * 0.3,
      this.width / 2, this.height / 2, this.width * 0.8
    );
    vignetteGradient.addColorStop(0, 'transparent');
    vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 屏幕边缘光晕（赛博朋克效果）
    this.drawEdgeGlow();
  }

  /**
   * 绘制边缘光晕
   */
  private drawEdgeGlow(): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const pulse = Math.sin(this.time * 2) * 0.5 + 0.5;

    // 顶部青色光晕
    const topGradient = ctx.createLinearGradient(0, 0, 0, 100);
    topGradient.addColorStop(0, `rgba(0, 240, 255, ${0.05 * pulse})`);
    topGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, this.width, 100);

    // 底部洋红色光晕
    const bottomGradient = ctx.createLinearGradient(0, this.height, 0, this.height - 100);
    bottomGradient.addColorStop(0, `rgba(255, 0, 255, ${0.05 * pulse})`);
    bottomGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, this.height - 100, this.width, 100);
  }

  /* ==========================================================================
     辅助方法
     ========================================================================== */

  /**
   * 根据心情获取颜色
   */
  private getMoodColor(mood: number): string {
    if (mood > 80) return '#39ff14';  // 绿色
    if (mood > 60) return '#00f0ff';  // 青色
    if (mood > 40) return '#ffff00';  // 黄色
    if (mood > 20) return '#ff6600';  // 橙色
    return '#ff3333';                  // 红色
  }

  /**
   * 设置市民数据
   */
  public setCitizens(citizens: RenderableCitizen[]): void {
    this.citizens = citizens;
  }

  /**
   * 设置相机
   */
  public setCamera(x: number, y: number, z: number, zoom: number = 1): void {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.z = z;
    this.camera.zoom = zoom;
  }

  /**
   * 缩放
   */
  public setZoom(zoom: number): void {
    this.camera.zoom = Math.max(0.1, Math.min(10, zoom));
  }

  /**
   * 平移
   */
  public pan(dx: number, dy: number): void {
    this.camera.x += dx;
    this.camera.z += dy;
  }

  /**
   * 获取 FPS
   */
  public getFPS(): number {
    return this.fps;
  }

  /**
   * 获取粒子数量
   */
  public getParticleCount(): number {
    return this.maxParticles;
  }

  /**
   * 设置粒子数量
   */
  public setParticleCount(count: number): void {
    this.maxParticles = Math.max(100, Math.min(200000, count));

    // 调整粒子数组
    while (this.particles.length < this.maxParticles) {
      this.particles.push(this.createParticle(this.particles.length));
    }
    while (this.particles.length > this.maxParticles) {
      this.particles.pop();
    }
  }

  /**
   * 是否初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 销毁
   */
  public dispose(): void {
    eventCleanupManager.cleanupByTarget(window);
    this.initialized = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.particles = [];
  }
}

// 单例
export const canvas2DRenderer = new Canvas2DRenderer();
