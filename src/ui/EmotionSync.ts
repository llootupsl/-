/**
 * =============================================================================
 * APEX 情绪突触同步引擎 (EmotionSync)
 * 实时监控文明情绪网络并平滑映射为全局 CSS 变量
 * =============================================================================
 */

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const c = hex.replace('#', '');
  if (c.length !== 6) return [26, 239, 251]; // 默认冰霜青
  return [
    parseInt(c.substr(0, 2), 16),
    parseInt(c.substr(2, 2), 16),
    parseInt(c.substr(4, 2), 16)
  ];
}

function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

function rgbaToRgbaString(r1: number, g1: number, b1: number, a1: number, r2: number, g2: number, b2: number, ratio: number): string {
   const r = Math.round(r1 + (r2 - r1) * ratio);
   const g = Math.round(g1 + (g2 - g1) * ratio);
   const b = Math.round(b1 + (b2 - b1) * ratio);
   return `rgba(${r}, ${g}, ${b}, ${a1})`;
}

let activeAnimation: number | null = null;
let currentAccent: string = '#1AEFFB';

/**
 * requestAnimationFrame 平滑插值 CSS 变量
 * @param targetHex 目标颜色
 * @param duration 持续时间(ms)
 */
function smoothTransition(targetHex: string, duration: number = 2000) {
  if (activeAnimation) cancelAnimationFrame(activeAnimation);

  const startRgb = hexToRgb(currentAccent);
  const endRgb = hexToRgb(targetHex);
  const startTime = performance.now();

  const animate = (time: number) => {
    let elapsed = time - startTime;
    if (elapsed > duration) elapsed = duration;
    const progress = elapsed / duration;
    
    // Ease-out
    const ease = 1 - Math.pow(1 - progress, 3);
    
    const currentRgb: RGB = [
      startRgb[0] + (endRgb[0] - startRgb[0]) * ease,
      startRgb[1] + (endRgb[1] - startRgb[1]) * ease,
      startRgb[2] + (endRgb[2] - startRgb[2]) * ease
    ];

    const currentHex = rgbToHex(currentRgb);
    currentAccent = currentHex;
    
    // 同步到全局 CSS 变量
    document.documentElement.style.setProperty('--accent', currentHex);
    document.documentElement.style.setProperty('--accent-glow', `0 0 12px ${currentHex}55`);
    document.documentElement.style.setProperty('--accent-border', `${currentHex}40`);

    if (progress < 1) {
      activeAnimation = requestAnimationFrame(animate);
    }
  };

  activeAnimation = requestAnimationFrame(animate);
}

/**
 * 情感网络同步钩子
 * @param hope 希望值 0~1
 * @param unrest 不满值 0~1
 * @param chaos 混沌度 0~1
 */
export function syncEmotionToUI(hope: number, unrest: number, chaos: number) {
  // 边界检查
  hope = Math.max(0, Math.min(1, hope));
  unrest = Math.max(0, Math.min(1, unrest));
  chaos = Math.max(0, Math.min(1, chaos));

  const root = document.documentElement;
  
  // 基础变量映射
  root.style.setProperty('--emotion-hope', hope.toString());
  root.style.setProperty('--emotion-unrest', unrest.toString());
  root.style.setProperty('--emotion-chaos', chaos.toString());
  
  // 根据情感计算目标品牌色
  let targetAccent = '#1AEFFB'; // default Cyan
  
  if (hope > 0.95) {
    targetAccent = '#FFD600'; // 文明接近飞升 (Gold)
    root.classList.add('ascension-glow');
  } else {
    root.classList.remove('ascension-glow');
    
    if (unrest > 0.5) {
      // 从冰霜插值到霓虹粉
      const ratio = Math.min((unrest - 0.5) * 2, 1);
      const cyan = hexToRgb('#1AEFFB');
      const pink = hexToRgb('#FF2E7E');
      targetAccent = rgbToHex([
        cyan[0] + (pink[0] - cyan[0]) * ratio,
        cyan[1] + (pink[1] - cyan[1]) * ratio,
        cyan[2] + (pink[2] - cyan[2]) * ratio
      ]);
      
      root.style.setProperty('--border-default', rgbaToRgbaString(26, 239, 251, 0.12, 255, 56, 103, ratio));
    } else {
      root.style.setProperty('--border-default', 'rgba(26, 239, 251, 0.12)');
    }
  }

  // 混沌爆发全局 Glitch 效果
  if (chaos > 0.7) {
    root.classList.add('chaos-glitch');
  } else {
    root.classList.remove('chaos-glitch');
  }

  // 执行平滑过渡
  if (targetAccent !== currentAccent) {
    smoothTransition(targetAccent, 2000);
  }
}

/**
 * 获取当前accent颜色
 */
export function getCurrentAccent(): string {
  return currentAccent;
}
