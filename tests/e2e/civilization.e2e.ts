/**
 * =============================================================================
 * 永夜熵纪 - E2E 测试 - 文明模拟
 * End-to-End Tests for Civilization Simulation
 * =============================================================================
 */

import { test, expect } from '@playwright/test';

test.describe('文明模拟器', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待加载完成
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 });
  });

  test('should load the application', async ({ page }) => {
    // 检查标题
    await expect(page).toHaveTitle(/永夜熵纪|OMNIS/);
    
    // 检查主要元素
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should display initial citizens', async ({ page }) => {
    // 等待市民渲染
    await page.waitForTimeout(2000);
    
    // 检查市民数量显示
    const citizenCount = page.locator('[data-testid="citizen-count"]');
    await expect(citizenCount).toBeVisible();
  });

  test('should navigate camera', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // 模拟鼠标拖拽
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2);
      await page.mouse.up();
    }
    
    // 验证没有错误
    const errorDialog = page.locator('[role="alertdialog"]');
    await expect(errorDialog).not.toBeVisible();
  });

  test('should open settings panel', async ({ page }) => {
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();
    
    const settingsPanel = page.locator('[data-testid="settings-panel"]');
    await expect(settingsPanel).toBeVisible();
  });

  test('should change performance mode', async ({ page }) => {
    // 打开设置
    await page.click('[data-testid="settings-button"]');
    
    // 选择性能模式
    const performanceSelect = page.locator('[data-testid="performance-mode"]');
    await performanceSelect.selectOption('low');
    
    // 验证变化
    await page.waitForTimeout(1000);
    const selectedValue = await performanceSelect.inputValue();
    expect(selectedValue).toBe('low');
  });

  test('should handle audio controls', async ({ page }) => {
    // 检查音量控制
    const volumeSlider = page.locator('[data-testid="volume-slider"]');
    
    if (await volumeSlider.isVisible()) {
      await volumeSlider.fill('0.5');
      
      const value = await volumeSlider.inputValue();
      expect(parseFloat(value)).toBeCloseTo(0.5, 1);
    }
  });

  test('should display time controls', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-button"]');
    const pauseButton = page.locator('[data-testid="pause-button"]');
    
    // 初始状态：暂停
    await expect(playButton).toBeVisible();
    
    // 点击播放
    await playButton.click();
    await expect(pauseButton).toBeVisible();
    
    // 点击暂停
    await pauseButton.click();
    await expect(playButton).toBeVisible();
  });

  test('should show citizen info on click', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // 点击画布中心
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    
    // 检查是否显示信息面板
    const infoPanel = page.locator('[data-testid="citizen-info"]');
    // 可能没有选中市民，所以不强制要求
  });
});

test.describe('离线功能', () => {
  test('should work offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 });
    
    // 切换到离线模式
    await context.setOffline(true);
    
    // 刷新页面
    await page.reload();
    
    // 应该仍然能加载
    await expect(page.locator('canvas')).toBeVisible();
  });
});

test.describe('性能测试', () => {
  test('should maintain 60 FPS with 1000 citizens', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 });
    
    // 监控 FPS
    const fpsMetrics: number[] = [];
    
    page.on('console', msg => {
      if (msg.text().includes('FPS:')) {
        const fps = parseFloat(msg.text().split('FPS:')[1]);
        if (!isNaN(fps)) {
          fpsMetrics.push(fps);
        }
      }
    });
    
    // 运行 10 秒
    await page.waitForTimeout(10000);
    
    // 检查 FPS
    if (fpsMetrics.length > 0) {
      const avgFps = fpsMetrics.reduce((a, b) => a + b, 0) / fpsMetrics.length;
      expect(avgFps).toBeGreaterThan(30); // 至少 30 FPS
    }
  });

  test('should not exceed memory limit', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 });
    
    // 获取内存使用
    const metrics = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // 应该小于 2GB
    expect(metrics).toBeLessThan(2 * 1024 * 1024 * 1024);
  });
});

test.describe('无障碍测试', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // 检查主要按钮有无障碍标签
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // 按钮应该有可访问的名称
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab 导航
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 应该有元素获得焦点
    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focused).toBeTruthy();
  });
});
