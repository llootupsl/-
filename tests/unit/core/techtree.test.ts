/**
 * =============================================================================
 * 永夜熵纪 - 科技树测试
 * Tech Tree Unit Tests
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TechTree, TechStatus } from '../../../src/economy/TechTree';

describe('TechTree', () => {
  let techTree: TechTree;

  beforeEach(() => {
    techTree = new TechTree();
  });

  describe('初始化', () => {
    it('should initialize with default techs', () => {
      const nodes = techTree.getAllNodes();
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('should have available tier 1 techs', () => {
      const available = techTree.getAvailableTechs();
      const tier1Available = available.filter(t => t.tier === 1);
      expect(tier1Available.length).toBeGreaterThan(0);
    });

    it('should lock higher tier techs', () => {
      const nodes = techTree.getAllNodes();
      const higherTier = nodes.filter(t => t.tier > 1);
      
      for (const node of higherTier) {
        expect(node.state).toBe('locked');
      }
    });
  });

  describe('研究', () => {
    it('should start research', () => {
      const available = techTree.getAvailableTechs();
      const result = techTree.startResearch(available[0].id);
      
      expect(result).toBe(true);
      expect(techTree.getCurrentResearch()).toBeDefined();
    });

    it('should not start research on locked tech', () => {
      const nodes = techTree.getAllNodes();
      const locked = nodes.find(n => n.state === 'locked');
      
      if (locked) {
        const result = techTree.startResearch(locked.id);
        expect(result).toBe(false);
      }
    });

    it('should not start research when already researching', () => {
      const available = techTree.getAvailableTechs();
      
      techTree.startResearch(available[0].id);
      const result = techTree.startResearch(available[1]?.id || available[0].id);
      
      expect(result).toBe(false);
    });

    it('should emit researchStarted event', () => {
      const handler = vi.fn();
      techTree.on('researchStarted', handler);

      const available = techTree.getAvailableTechs();
      techTree.startResearch(available[0].id);

      expect(handler).toHaveBeenCalledWith(available[0].id);
    });
  });

  describe('研究进度', () => {
    it('should update progress', () => {
      const available = techTree.getAvailableTechs();
      techTree.startResearch(available[0].id);

      techTree.updateResearch(1000, 10); // 1秒, 10科学产出

      const progress = techTree.getProgress(available[0].id);
      expect(progress).toBeGreaterThan(0);
    });

    it('should emit progress event', () => {
      const handler = vi.fn();
      techTree.on('researchProgress', handler);

      const available = techTree.getAvailableTechs();
      techTree.startResearch(available[0].id);
      techTree.updateResearch(1000, 10);

      expect(handler).toHaveBeenCalled();
    });

    it('should complete research at 100%', () => {
      const handler = vi.fn();
      techTree.on('researchCompleted', handler);

      const available = techTree.getAvailableTechs();
      techTree.startResearch(available[0].id);
      
      // 模拟大量进度
      techTree.updateResearch(10000, 10000);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('前置条件', () => {
    it('should unlock techs when prerequisites are met', () => {
      const handler = vi.fn();
      techTree.on('unlocked', handler);

      // 完成一个前置科技
      const available = techTree.getAvailableTechs();
      techTree.startResearch(available[0].id);
      techTree.updateResearch(10000, 10000);

      // 检查是否有科技被解锁
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('效果系统', () => {
    it('should apply modifiers', () => {
      const available = techTree.getAvailableTechs();
      const tech = available.find(t => 
        t.effects.some(e => e.type === 'resource_rate' || e.type === 'citizen_bonus')
      );

      if (tech) {
        techTree.startResearch(tech.id);
        techTree.updateResearch(10000, 10000);

        const modifierEffect = tech.effects.find(e => e.type === 'resource_rate' || e.type === 'citizen_bonus');
        if (modifierEffect) {
          const target = modifierEffect.params.resource || modifierEffect.params.attribute;
          if (target) {
            const value = techTree.getModifier(target as string);
            expect(value).toBeGreaterThan(1);
          }
        }
      }
    });

    it('should track unlocked abilities', () => {
      const available = techTree.getAvailableTechs();
      const tech = available.find(t => 
        t.effects.some(e => e.type === 'unlock_ability' || e.type === 'unlock_building')
      );

      if (tech) {
        techTree.startResearch(tech.id);
        techTree.updateResearch(10000, 10000);

        const unlockEffect = tech.effects.find(e => e.type === 'unlock_ability' || e.type === 'unlock_building');
        if (unlockEffect) {
          const target = unlockEffect.params.ability || unlockEffect.params.building;
          if (target) {
            expect(techTree.isUnlocked(target as string)).toBe(true);
          }
        }
      }
    });
  });

  describe('查询', () => {
    it('should get completed techs', () => {
      const available = techTree.getAvailableTechs();
      techTree.startResearch(available[0].id);
      techTree.updateResearch(10000, 10000);

      const completed = techTree.getCompletedTechs();
      expect(completed.length).toBeGreaterThan(0);
    });

    it('should return stats', () => {
      const stats = techTree.getStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.completionRate).toBeGreaterThanOrEqual(0);
      expect(stats.completionRate).toBeLessThanOrEqual(1);
    });
  });

  describe('取消研究', () => {
    it('should cancel current research', () => {
      const available = techTree.getAvailableTechs();
      techTree.startResearch(available[0].id);
      
      const result = techTree.cancelResearch();
      
      expect(result).toBe(true);
      expect(techTree.getCurrentResearch()).toBeNull();
    });
  });

  describe('重置', () => {
    it('should reset tech tree', () => {
      const available = techTree.getAvailableTechs();
      techTree.startResearch(available[0].id);
      techTree.updateResearch(10000, 10000);

      techTree.reset();

      const stats = techTree.getStats();
      expect(stats.completed).toBe(0);
      expect(stats.researching).toBe(0);
    });
  });
});
