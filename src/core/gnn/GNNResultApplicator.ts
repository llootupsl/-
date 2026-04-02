/**
 * =============================================================================
 * GNN 结果应用器
 * GNN Result Applicator - 将社交网络分析结果应用到市民行为
 * =============================================================================
 * 
 * 解决问题：GNN 计算了消息传递，但结果从未被使用
 * 此模块将 GNN 输出转换为实际的市民行为变化
 */

import { EventEmitter } from 'eventemitter3';

/** GNN 输出类型 */
interface GNNOutput {
  /** 市民嵌入向量 */
  embeddings: Map<string, number[]>;
  /** 社交影响力分数 */
  influenceScores: Map<string, number>;
  /** 群体归属 */
  communityAssignments: Map<string, number>;
  /** 关系强度预测 */
  relationPredictions: Map<string, Map<string, number>>;
}

/** 市民行为修改 */
interface BehaviorModification {
  citizenId: string;
  type: 'social' | 'economic' | 'political' | 'cultural';
  changes: {
    attribute: string;
    oldValue: number | string;
    newValue: number | string;
    reason: string;
  }[];
}

/** GNN 应用事件 */
export interface GNNApplicatorEvents {
  /** 行为修改 */
  behaviorModified: (mod: BehaviorModification) => void;
  /** 社交事件触发 */
  socialEvent: (event: SocialEvent) => void;
  /** 影响力传播 */
  influencePropagated: (from: string, to: string, strength: number) => void;
  /** 群体动态 */
  communityDynamic: (communityId: number, size: number, cohesion: number) => void;
}

/** 社交事件 */
interface SocialEvent {
  type: 'friendship' | 'conflict' | 'trade' | 'collaboration' | 'migration';
  participants: string[];
  intensity: number;
  context: Record<string, unknown>;
}

/** 行为阈值配置 */
interface BehaviorThresholds {
  /** 影响力触发阈值 */
  influenceThreshold: number;
  /** 关系强度阈值 */
  relationThreshold: number;
  /** 社区凝聚力阈值 */
  cohesionThreshold: number;
  /** 行为变化速率限制 */
  changeRateLimit: number;
}

/** 默认阈值 */
const DEFAULT_THRESHOLDS: BehaviorThresholds = {
  influenceThreshold: 0.3,
  relationThreshold: 0.5,
  cohesionThreshold: 0.6,
  changeRateLimit: 0.1,
};

/**
 * GNN 结果应用器
 * 
 * 将 GNN 分析结果转化为实际的市民行为变化
 */
export class GNNResultApplicator extends EventEmitter<GNNApplicatorEvents> {
  private thresholds: BehaviorThresholds;
  private lastApplication: number = 0;
  private pendingModifications: BehaviorModification[] = [];
  private socialEvents: SocialEvent[] = [];
  private communityStats: Map<number, { size: number; cohesion: number }> = new Map();

  constructor(thresholds: Partial<BehaviorThresholds> = {}) {
    super();
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * 应用 GNN 结果到市民系统
   * 
   * @param gnnOutput - GNN 计算输出
   * @param citizens - 当前市民状态
   * @param deltaTime - 时间增量
   * @returns 行为修改列表
   */
  public applyResults(
    gnnOutput: GNNOutput,
    citizens: Map<string, CitizenState>,
    deltaTime: number
  ): BehaviorModification[] {
    const modifications: BehaviorModification[] = [];
    const now = Date.now();

    // 限制应用频率
    if (now - this.lastApplication < 100) {
      return [];
    }
    this.lastApplication = now;

    // 1. 应用影响力传播
    const influenceMods = this.applyInfluencePropagation(gnnOutput, citizens);
    modifications.push(...influenceMods);

    // 2. 应用群体动态
    const communityMods = this.applyCommunityDynamics(gnnOutput, citizens);
    modifications.push(...communityMods);

    // 3. 应用关系预测
    const relationMods = this.applyRelationPredictions(gnnOutput, citizens);
    modifications.push(...relationMods);

    // 4. 触发社交事件
    this.triggerSocialEvents(gnnOutput, citizens);

    // 存储待处理的修改
    this.pendingModifications = modifications;

    return modifications;
  }

  /**
   * 应用影响力传播
   * 
   * 高影响力市民会影响低影响力市民的行为
   */
  private applyInfluencePropagation(
    gnnOutput: GNNOutput,
    citizens: Map<string, CitizenState>
  ): BehaviorModification[] {
    const modifications: BehaviorModification[] = [];

    for (const [citizenId, influence] of gnnOutput.influenceScores) {
      const citizen = citizens.get(citizenId);
      if (!citizen) continue;

      // 高影响力市民
      if (influence > this.thresholds.influenceThreshold) {
        // 找到受影响的市民
        const relations = gnnOutput.relationPredictions.get(citizenId);
        if (!relations) continue;

        for (const [targetId, relationStrength] of relations) {
          if (relationStrength < this.thresholds.relationThreshold) continue;

          const target = citizens.get(targetId);
          if (!target) continue;

          // 计算影响力传播效果
          const influenceEffect = influence * relationStrength * this.thresholds.changeRateLimit;

          // 创建行为修改
          const mod: BehaviorModification = {
            citizenId: targetId,
            type: 'social',
            changes: [],
          };

          // 影响目标的政治倾向
          if (Math.abs(citizen.politicalAlignment - target.politicalAlignment) > 0.2) {
            const oldAlignment = target.politicalAlignment;
            const newAlignment = oldAlignment + (citizen.politicalAlignment - oldAlignment) * influenceEffect;
            
            mod.changes.push({
              attribute: 'politicalAlignment',
              oldValue: oldAlignment,
              newValue: newAlignment,
              reason: `Influenced by ${citizenId} (influence: ${influence.toFixed(2)})`,
            });

            target.politicalAlignment = newAlignment;
          }

          // 影响目标的经济偏好
          if (Math.abs(citizen.economicPreference - target.economicPreference) > 0.2) {
            const oldPref = target.economicPreference;
            const newPref = oldPref + (citizen.economicPreference - oldPref) * influenceEffect;
            
            mod.changes.push({
              attribute: 'economicPreference',
              oldValue: oldPref,
              newValue: newPref,
              reason: `Economic influence from ${citizenId}`,
            });

            target.economicPreference = newPref;
          }

          if (mod.changes.length > 0) {
            modifications.push(mod);
            this.emit('influencePropagated', citizenId, targetId, influenceEffect);
          }
        }
      }
    }

    return modifications;
  }

  /**
   * 应用群体动态
   * 
   * 同一群体的市民会趋向相似的行为
   */
  private applyCommunityDynamics(
    gnnOutput: GNNOutput,
    citizens: Map<string, CitizenState>
  ): BehaviorModification[] {
    const modifications: BehaviorModification[] = [];

    // 按群体分组
    const communities = new Map<number, CitizenState[]>();
    
    for (const [citizenId, communityId] of gnnOutput.communityAssignments) {
      const citizen = citizens.get(citizenId);
      if (!citizen) continue;

      if (!communities.has(communityId)) {
        communities.set(communityId, []);
      }
      communities.get(communityId)!.push(citizen);
    }

    // 计算每个群体的平均属性
    for (const [communityId, members] of communities) {
      if (members.length < 2) continue;

      // 计算群体平均属性
      const avgAlignment = members.reduce((sum, c) => sum + c.politicalAlignment, 0) / members.length;
      const avgEconomic = members.reduce((sum, c) => sum + c.economicPreference, 0) / members.length;
      
      // 计算群体凝聚力
      let cohesion = 0;
      for (const member of members) {
        cohesion += 1 - Math.abs(member.politicalAlignment - avgAlignment);
        cohesion += 1 - Math.abs(member.economicPreference - avgEconomic);
      }
      cohesion /= members.length * 2;

      // 更新群体统计
      this.communityStats.set(communityId, { size: members.length, cohesion });
      this.emit('communityDynamic', communityId, members.length, cohesion);

      // 如果群体凝聚力高，成员会趋向群体平均
      if (cohesion > this.thresholds.cohesionThreshold) {
        for (const member of members) {
          const mod: BehaviorModification = {
            citizenId: member.id,
            type: 'cultural',
            changes: [],
          };

          // 趋向群体政治平均
          const alignmentDiff = avgAlignment - member.politicalAlignment;
          if (Math.abs(alignmentDiff) > 0.05) {
            const oldVal = member.politicalAlignment;
            const newVal = oldVal + alignmentDiff * 0.1;
            
            mod.changes.push({
              attribute: 'politicalAlignment',
              oldValue: oldVal,
              newValue: newVal,
              reason: `Community ${communityId} cohesion (${cohesion.toFixed(2)})`,
            });
            
            member.politicalAlignment = newVal;
          }

          if (mod.changes.length > 0) {
            modifications.push(mod);
          }
        }
      }
    }

    return modifications;
  }

  /**
   * 应用关系预测
   * 
   * 根据预测的关系强度创建或断开关系
   */
  private applyRelationPredictions(
    gnnOutput: GNNOutput,
    citizens: Map<string, CitizenState>
  ): BehaviorModification[] {
    const modifications: BehaviorModification[] = [];

    for (const [citizenId, relations] of gnnOutput.relationPredictions) {
      const citizen = citizens.get(citizenId);
      if (!citizen) continue;

      for (const [targetId, strength] of relations) {
        const target = citizens.get(targetId);
        if (!target) continue;

        // 检查是否已有关系
        const existingRelation = citizen.relations?.get(targetId);
        const mod: BehaviorModification = {
          citizenId,
          type: 'social',
          changes: [],
        };

        if (strength > 0.8 && !existingRelation) {
          // 创建新关系
          if (!citizen.relations) citizen.relations = new Map();
          
          const relationType = this.determineRelationType(strength, citizen, target);
          citizen.relations.set(targetId, { type: relationType, strength });
          
          mod.changes.push({
            attribute: `relations.${targetId}`,
            oldValue: 'none',
            newValue: relationType,
            reason: `GNN predicted strong relation (${strength.toFixed(2)})`,
          });

          // 触发社交事件
          this.socialEvents.push({
            type: 'friendship',
            participants: [citizenId, targetId],
            intensity: strength,
            context: { relationType },
          });

        } else if (strength < 0.2 && existingRelation) {
          // 断开弱关系
          const oldType = existingRelation.type;
          citizen.relations.delete(targetId);
          
          mod.changes.push({
            attribute: `relations.${targetId}`,
            oldValue: oldType,
            newValue: 'none',
            reason: `GNN predicted weak relation (${strength.toFixed(2)})`,
          });

          // 可能触发冲突事件
          if (Math.random() < 0.3) {
            this.socialEvents.push({
              type: 'conflict',
              participants: [citizenId, targetId],
              intensity: 1 - strength,
              context: { previousRelation: oldType },
            });
          }
        }

        if (mod.changes.length > 0) {
          modifications.push(mod);
        }
      }
    }

    return modifications;
  }

  /**
   * 确定关系类型
   */
  private determineRelationType(
    strength: number,
    citizen: CitizenState,
    target: CitizenState
  ): string {
    const alignmentDiff = Math.abs(citizen.politicalAlignment - target.politicalAlignment);
    const economicDiff = Math.abs(citizen.economicPreference - target.economicPreference);

    if (alignmentDiff < 0.1 && economicDiff < 0.1) {
      return strength > 0.9 ? 'family' : 'close_friend';
    } else if (alignmentDiff < 0.3) {
      return 'friend';
    } else if (alignmentDiff > 0.7) {
      return 'rival';
    } else {
      return 'acquaintance';
    }
  }

  /**
   * 触发社交事件
   */
  private triggerSocialEvents(
    gnnOutput: GNNOutput,
    citizens: Map<string, CitizenState>
  ): void {
    // 随机触发存储的社交事件
    while (this.socialEvents.length > 0) {
      const event = this.socialEvents.shift()!;
      this.emit('socialEvent', event);
    }

    // 基于影响力生成贸易事件
    for (const [citizenId, influence] of gnnOutput.influenceScores) {
      if (influence > 0.7 && Math.random() < 0.05) {
        const relations = gnnOutput.relationPredictions.get(citizenId);
        if (!relations) continue;

        // 找一个关系好的目标进行贸易
        for (const [targetId, strength] of relations) {
          if (strength > 0.6) {
            this.emit('socialEvent', {
              type: 'trade',
              participants: [citizenId, targetId],
              intensity: strength,
              context: {
                initiatorInfluence: influence,
              },
            });
            break;
          }
        }
      }
    }

    // 基于群体生成协作事件
    for (const [communityId, stats] of this.communityStats) {
      if (stats.cohesion > 0.7 && stats.size > 5 && Math.random() < 0.03) {
        // 获取群体成员
        const members: string[] = [];
        for (const [citizenId, cid] of gnnOutput.communityAssignments) {
          if (cid === communityId) members.push(citizenId);
        }

        if (members.length >= 2) {
          const participants = members.slice(0, Math.min(5, members.length));
          this.emit('socialEvent', {
            type: 'collaboration',
            participants,
            intensity: stats.cohesion,
            context: { communityId },
          });
        }
      }
    }
  }

  /**
   * 获取 GNN 嵌入并应用到市民行为
   */
  public applyEmbeddingToBehavior(
    citizenId: string,
    embedding: number[],
    citizen: CitizenState
  ): void {
    // 嵌入向量的维度代表不同的行为倾向
    // 假设嵌入维度为 16
    
    if (embedding.length < 8) return;

    // 维度解释:
    // [0-3]: 社交活跃度
    // [4-7]: 经济倾向
    // [8-11]: 政治倾向
    // [12-15]: 文化偏好

    const socialActivity = (embedding[0] + embedding[1] + embedding[2] + embedding[3]) / 4;
    const economicTendency = (embedding[4] + embedding[5] + embedding[6] + embedding[7]) / 4;
    const politicalTendency = (embedding[8] + embedding[9] + embedding[10] + embedding[11]) / 4;
    const culturalPreference = (embedding[12] + embedding[13] + embedding[14] + embedding[15]) / 4;

    // 更新市民属性
    const oldSocial = citizen.socialActivity || 0.5;
    const oldEconomic = citizen.economicPreference;
    const oldPolitical = citizen.politicalAlignment;

    citizen.socialActivity = oldSocial + (socialActivity - oldSocial) * 0.2;
    citizen.economicPreference = oldEconomic + (economicTendency - oldEconomic) * 0.1;
    citizen.politicalAlignment = oldPolitical + (politicalTendency - oldPolitical) * 0.1;

    // 触发行为修改事件
    if (Math.abs(citizen.socialActivity - oldSocial) > 0.05) {
      this.emit('behaviorModified', {
        citizenId,
        type: 'social',
        changes: [{
          attribute: 'socialActivity',
          oldValue: oldSocial,
          newValue: citizen.socialActivity,
          reason: 'GNN embedding update',
        }],
      });
    }
  }

  /**
   * 获取待处理的修改
   */
  public getPendingModifications(): BehaviorModification[] {
    return [...this.pendingModifications];
  }

  /**
   * 清除待处理的修改
   */
  public clearPendingModifications(): void {
    this.pendingModifications = [];
  }

  /**
   * 获取群体统计
   */
  public getCommunityStats(): Map<number, { size: number; cohesion: number }> {
    return new Map(this.communityStats);
  }

  /**
   * 重置应用器
   */
  public reset(): void {
    this.pendingModifications = [];
    this.socialEvents = [];
    this.communityStats.clear();
    this.lastApplication = 0;
  }
}

/** 市民状态接口 */
export interface CitizenState {
  id: string;
  politicalAlignment: number;
  economicPreference: number;
  socialActivity?: number;
  relations?: Map<string, { type: string; strength: number }>;
  position?: { x: number; y: number; z: number };
}

// 单例
export const gnnResultApplicator = new GNNResultApplicator();

export default GNNResultApplicator;
