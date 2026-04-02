/**
 * =============================================================================
 * 市民基因与表观遗传学系统
 * Citizen Genome and Epigenetics System
 * =============================================================================
 */

import { citizenManager } from '@/citizen';

/** 基因类型 */
export interface Gene {
  /** 基因ID */
  id: string;
  /** 基因名称 */
  name: string;
  /** 基因类型 */
  type: GeneType;
  /** 基因值（0-1） */
  value: number;
  /** 显性/隐性 */
  dominance: 'dominant' | 'recessive' | 'co-dominant';
  /** 突变率 */
  mutationRate: number;
  /** 甲基化状态 */
  methylated: boolean;
  /** 表达水平 */
  expressionLevel: number;
}

/** 基因类型 */
export enum GeneType {
  /** 物理属性 */
  PHYSICAL = 'physical',
  /** 认知能力 */
  COGNITIVE = 'cognitive',
  /** 情感特质 */
  EMOTIONAL = 'emotional',
  /** 社交属性 */
  SOCIAL = 'social',
  /** 代谢特征 */
  METABOLIC = 'metabolic',
  /** 免疫系统 */
  IMMUNE = 'immune',
  /** 寿命相关 */
  LONGEVITY = 'longevity',
  /** 创造力 */
  CREATIVITY = 'creativity',
}

/** 表观遗传标记 */
export interface EpigeneticMark {
  /** 标记类型 */
  type: 'methylation' | 'histone' | 'noncodingRNA';
  /** 目标基因 */
  targetGeneId: string;
  /** 位置 */
  position: number;
  /** 强度 */
  intensity: number;
  /** 可逆性 */
  reversible: boolean;
}

/** 表观遗传学系统 */
export class EpigeneticsSystem {
  private marks: Map<string, EpigeneticMark[]> = new Map();

  /**
   * 创建表观遗传标记
   */
  public createMark(
    geneId: string,
    type: EpigeneticMark['type'],
    position: number,
    intensity: number = 1,
    reversible: boolean = true
  ): EpigeneticMark {
    const mark: EpigeneticMark = {
      type,
      targetGeneId: geneId,
      position,
      intensity,
      reversible,
    };

    if (!this.marks.has(geneId)) {
      this.marks.set(geneId, []);
    }
    this.marks.get(geneId)!.push(mark);

    return mark;
  }

  /**
   * 应用甲基化到基因
   */
  public methylate(geneId: string, intensity: number = 1): void {
    const gene = this.getGene(geneId);
    if (gene) {
      gene.methylated = true;
      gene.expressionLevel *= (1 - intensity * 0.8);
    }
  }

  /**
   * 去甲基化
   */
  public demethylate(geneId: string): void {
    const gene = this.getGene(geneId);
    if (gene) {
      gene.methylated = false;
      gene.expressionLevel = Math.min(1, gene.expressionLevel * 1.5);
    }
  }

  /**
   * 获取基因
   */
  private getGene(geneId: string): Gene | undefined {
    // 遍历所有标记找基因
    for (const marks of this.marks.values()) {
      const mark = marks.find(m => m.targetGeneId === geneId);
      if (mark) {
        return {
          id: geneId,
          name: '',
          type: GeneType.COGNITIVE,
          value: 0.5,
          dominance: 'co-dominant',
          mutationRate: 0.001,
          methylated: false,
          expressionLevel: 1,
        };
      }
    }
    return undefined;
  }

  /**
   * 获取基因的表观遗传状态
   */
  public getEpigeneticState(geneId: string): {
    methylated: boolean;
    marks: EpigeneticMark[];
    expressionLevel: number;
  } {
    const marks = this.marks.get(geneId) || [];
    const methylated = marks.some(m => m.type === 'methylation');
    const expressionLevel = methylated ? 0.2 : 1.0;

    return { methylated, marks, expressionLevel };
  }

  /**
   * 环境因素影响表观遗传
   */
  public applyEnvironmentalFactor(
    geneId: string,
    factor: 'stress' | 'nutrition' | 'social' | 'learning' | 'trauma'
  ): void {
    const intensity = 0.5;

    switch (factor) {
      case 'stress':
        // 压力增加甲基化
        this.createMark(geneId, 'methylation', 0, intensity, true);
        this.methylate(geneId, intensity);
        break;

      case 'nutrition':
        // 营养影响基因表达
        this.createMark(geneId, 'histone', 0, intensity * 0.5, true);
        break;

      case 'social':
        // 社交影响社会基因
        this.createMark(geneId, 'noncodingRNA', 0, intensity * 0.3, true);
        break;

      case 'learning':
        // 学习增加认知基因表达
        this.createMark(geneId, 'histone', 0, intensity, false);
        this.demethylate(geneId);
        break;

      case 'trauma':
        // 创伤可能永久改变基因表达
        this.createMark(geneId, 'methylation', 0, intensity, false);
        this.methylate(geneId, 1);
        break;
    }
  }

  /**
   * 重置表观遗传状态
   */
  public reset(): void {
    this.marks.clear();
  }

  /**
   * 序列化
   */
  public serialize(): string {
    const data: Record<string, EpigeneticMark[]> = {};
    this.marks.forEach((marks, geneId) => {
      data[geneId] = marks;
    });
    return JSON.stringify(data);
  }

  /**
   * 反序列化
   */
  public deserialize(json: string): void {
    const data = JSON.parse(json);
    this.marks = new Map(Object.entries(data));
  }
}

/** 基因组 */
export interface Genome {
  /** 基因序列 */
  genes: Gene[];
  /** 染色体对数 */
  chromosomePairs: number;
  /** 基因组大小 */
  genomeSize: number;
  /** 突变历史 */
  mutationHistory: MutationEvent[];
  /** 表观遗传标记 */
  epigenetics: EpigeneticsSystem;
}

/** 突变事件 */
export interface MutationEvent {
  timestamp: number;
  geneId: string;
  oldValue: number;
  newValue: number;
  type: 'point' | 'insertion' | 'deletion' | 'duplication';
  source: 'random' | 'radiation' | 'chemical' | 'viral';
}

/** 基因组管理器 */
export class GenomeManager {
  private static instance: GenomeManager | null = null;
  private epigenetics: Map<string, EpigeneticsSystem> = new Map();

  public static getInstance(): GenomeManager {
    if (!GenomeManager.instance) {
      GenomeManager.instance = new GenomeManager();
    }
    return GenomeManager.instance;
  }

  /**
   * 创建随机基因组
   */
  public createRandomGenome(): Genome {
    const genes: Gene[] = [];
    const mutationHistory: MutationEvent[] = [];

    // 创建基础基因
    const geneTemplates = this.getGeneTemplates();
    for (const template of geneTemplates) {
      for (let i = 0; i < template.count; i++) {
        genes.push({
          id: `${template.type}_${i}`,
          name: `${template.name}_${i}`,
          type: template.type,
          value: 0.3 + Math.random() * 0.4, // 0.3-0.7
          dominance: template.dominance,
          mutationRate: template.mutationRate,
          methylated: false,
          expressionLevel: 1,
        });
      }
    }

    return {
      genes,
      chromosomePairs: 23,
      genomeSize: genes.length,
      mutationHistory,
      epigenetics: new EpigeneticsSystem(),
    };
  }

  /**
   * 获取基因模板
   */
  private getGeneTemplates(): Array<{
    type: GeneType;
    name: string;
    count: number;
    dominance: Gene['dominance'];
    mutationRate: number;
  }> {
    return [
      // 物理属性
      { type: GeneType.PHYSICAL, name: '身高', count: 3, dominance: 'co-dominant', mutationRate: 0.0001 },
      { type: GeneType.PHYSICAL, name: '体力', count: 4, dominance: 'dominant', mutationRate: 0.0002 },
      { type: GeneType.PHYSICAL, name: '外貌', count: 5, dominance: 'co-dominant', mutationRate: 0.0001 },
      
      // 认知能力
      { type: GeneType.COGNITIVE, name: '智力', count: 4, dominance: 'recessive', mutationRate: 0.0001 },
      { type: GeneType.COGNITIVE, name: '记忆力', count: 3, dominance: 'co-dominant', mutationRate: 0.0002 },
      { type: GeneType.COGNITIVE, name: '注意力', count: 2, dominance: 'dominant', mutationRate: 0.0001 },
      { type: GeneType.COGNITIVE, name: '创造力', count: 3, dominance: 'recessive', mutationRate: 0.0003 },
      
      // 情感特质
      { type: GeneType.EMOTIONAL, name: '情绪稳定性', count: 3, dominance: 'co-dominant', mutationRate: 0.0002 },
      { type: GeneType.EMOTIONAL, name: '同理心', count: 2, dominance: 'dominant', mutationRate: 0.0001 },
      { type: GeneType.EMOTIONAL, name: '勇气', count: 2, dominance: 'recessive', mutationRate: 0.0002 },
      
      // 社交属性
      { type: GeneType.SOCIAL, name: '社交能力', count: 3, dominance: 'co-dominant', mutationRate: 0.0001 },
      { type: GeneType.SOCIAL, name: '领导力', count: 2, dominance: 'recessive', mutationRate: 0.0002 },
      { type: GeneType.SOCIAL, name: '信任度', count: 2, dominance: 'dominant', mutationRate: 0.0001 },
      
      // 代谢特征
      { type: GeneType.METABOLIC, name: '代谢率', count: 3, dominance: 'co-dominant', mutationRate: 0.0002 },
      { type: GeneType.METABOLIC, name: '食欲', count: 2, dominance: 'dominant', mutationRate: 0.0001 },
      { type: GeneType.METABOLIC, name: '能量效率', count: 2, dominance: 'co-dominant', mutationRate: 0.0001 },
      
      // 免疫系统
      { type: GeneType.IMMUNE, name: '免疫力', count: 4, dominance: 'dominant', mutationRate: 0.0001 },
      { type: GeneType.IMMUNE, name: '过敏倾向', count: 2, dominance: 'recessive', mutationRate: 0.0002 },
      
      // 寿命相关
      { type: GeneType.LONGEVITY, name: '寿命潜力', count: 3, dominance: 'recessive', mutationRate: 0.00005 },
      { type: GeneType.LONGEVITY, name: '衰老速度', count: 2, dominance: 'co-dominant', mutationRate: 0.0001 },
      
      // 创造力
      { type: GeneType.CREATIVITY, name: '艺术天赋', count: 2, dominance: 'recessive', mutationRate: 0.0003 },
      { type: GeneType.CREATIVITY, name: '创新能力', count: 3, dominance: 'co-dominant', mutationRate: 0.0002 },
    ];
  }

  /**
   * 基因重组（繁殖）
   */
  public recombine(parent1: Genome, parent2: Genome): Genome {
    const childGenes: Gene[] = [];

    // 交叉
    for (let i = 0; i < parent1.genes.length; i++) {
      const gene1 = parent1.genes[i];
      const gene2 = parent2.genes.find(g => g.type === gene1.type && g.name === gene1.name);

      if (gene2) {
        // 等位基因选择
        if (Math.random() < 0.5) {
          childGenes.push({ ...gene1 });
        } else {
          childGenes.push({ ...gene2 });
        }
      } else {
        childGenes.push({ ...gene1 });
      }
    }

    // 可能突变
    for (const gene of childGenes) {
      if (Math.random() < gene.mutationRate) {
        const oldValue = gene.value;
        gene.value = Math.max(0, Math.min(1, gene.value + (Math.random() - 0.5) * 0.2));
        
        // 记录突变
        parent1.mutationHistory.push({
          timestamp: Date.now(),
          geneId: gene.id,
          oldValue,
          newValue: gene.value,
          type: 'point',
          source: 'random',
        });
      }
    }

    return {
      genes: childGenes,
      chromosomePairs: 23,
      genomeSize: childGenes.length,
      mutationHistory: [],
      epigenetics: new EpigeneticsSystem(),
    };
  }

  /**
   * 获取基因表现值
   */
  public getPhenotypeValue(genome: Genome, geneType: GeneType): number {
    const genes = genome.genes.filter(g => g.type === geneType);
    if (genes.length === 0) return 0.5;

    let totalValue = 0;
    let totalWeight = 0;

    for (const gene of genes) {
      const weight = gene.dominance === 'dominant' ? 1.5 :
                     gene.dominance === 'recessive' ? 0.5 : 1;
      totalValue += gene.value * gene.expressionLevel * weight;
      totalWeight += weight;
    }

    return totalValue / totalWeight;
  }

  /**
   * 应用环境影响到表观遗传
   */
  public applyEnvironment(
    citizenId: string,
    genome: Genome,
    environment: {
      stress?: number;
      nutrition?: number;
      socialInteraction?: number;
      learning?: number;
      trauma?: number;
    }
  ): void {
    let epigenetics = this.epigenetics.get(citizenId);
    if (!epigenetics) {
      epigenetics = new EpigeneticsSystem();
      this.epigenetics.set(citizenId, epigenetics);
    }

    // 应用各种环境因素
    if (environment.stress && environment.stress > 0.5) {
      epigenetics.applyEnvironmentalFactor(genome.genes[0].id, 'stress');
    }
    if (environment.nutrition && environment.nutrition < 0.3) {
      epigenetics.applyEnvironmentalFactor(genome.genes[0].id, 'nutrition');
    }
    if (environment.learning && environment.learning > 0.7) {
      epigenetics.applyEnvironmentalFactor(genome.genes[0].id, 'learning');
    }
    if (environment.trauma && environment.trauma > 0.8) {
      epigenetics.applyEnvironmentalFactor(genome.genes[0].id, 'trauma');
    }
  }

  /**
   * 序列化基因组
   */
  public serializeGenome(genome: Genome): string {
    return JSON.stringify({
      genes: genome.genes,
      chromosomePairs: genome.chromosomePairs,
      genomeSize: genome.genomeSize,
      epigenetics: genome.epigenetics.serialize(),
    });
  }

  /**
   * 反序列化基因组
   */
  public deserializeGenome(json: string): Genome {
    const data = JSON.parse(json);
    const epigenetics = new EpigeneticsSystem();
    epigenetics.deserialize(data.epigenetics || '{}');

    return {
      genes: data.genes,
      chromosomePairs: data.chromosomePairs,
      genomeSize: data.genomeSize,
      mutationHistory: [],
      epigenetics,
    };
  }
}

/** 基因影响配置 */
export interface GeneInfluenceConfig {
  /** 目标属性名 */
  targetAttribute: string;
  /** 影响权重 (-1 到 1) */
  weight: number;
  /** 影响类型 */
  influenceType: 'additive' | 'multiplicative' | 'threshold';
}

/** 行为概率影响配置 */
export interface BehaviorInfluenceConfig {
  /** 行为类型 */
  behavior: 'work' | 'rest' | 'socialize' | 'explore' | 'migrate' | 'learn';
  /** 基因类型权重 */
  geneWeights: Map<GeneType, number>;
  /** 基础概率 */
  baseProbability: number;
}

/** 基因影响映射器 */
export class GeneInfluenceMapper {
  private static instance: GeneInfluenceMapper | null = null;

  /** 基因类型到属性的映射 */
  private readonly attributeMappings: Map<GeneType, GeneInfluenceConfig[]> = new Map([
    [GeneType.PHYSICAL, [
      { targetAttribute: 'strength', weight: 0.8, influenceType: 'additive' },
      { targetAttribute: 'agility', weight: 0.4, influenceType: 'additive' },
      { targetAttribute: 'constitution', weight: 0.6, influenceType: 'additive' },
    ]],
    [GeneType.COGNITIVE, [
      { targetAttribute: 'intelligence', weight: 0.9, influenceType: 'additive' },
      { targetAttribute: 'perception', weight: 0.5, influenceType: 'additive' },
      { targetAttribute: 'learning', weight: 0.7, influenceType: 'additive' },
    ]],
    [GeneType.EMOTIONAL, [
      { targetAttribute: 'charisma', weight: 0.5, influenceType: 'additive' },
      { targetAttribute: 'stability', weight: 0.8, influenceType: 'additive' },
      { targetAttribute: 'empathy', weight: 0.6, influenceType: 'additive' },
    ]],
    [GeneType.SOCIAL, [
      { targetAttribute: 'charisma', weight: 0.7, influenceType: 'additive' },
      { targetAttribute: 'leadership', weight: 0.6, influenceType: 'additive' },
      { targetAttribute: 'trust', weight: 0.5, influenceType: 'additive' },
    ]],
    [GeneType.METABOLIC, [
      { targetAttribute: 'constitution', weight: 0.5, influenceType: 'additive' },
      { targetAttribute: 'energy', weight: 0.7, influenceType: 'additive' },
      { targetAttribute: 'endurance', weight: 0.6, influenceType: 'additive' },
    ]],
    [GeneType.IMMUNE, [
      { targetAttribute: 'health', weight: 0.8, influenceType: 'additive' },
      { targetAttribute: 'constitution', weight: 0.4, influenceType: 'additive' },
    ]],
    [GeneType.LONGEVITY, [
      { targetAttribute: 'lifespan', weight: 0.9, influenceType: 'additive' },
      { targetAttribute: 'health', weight: 0.5, influenceType: 'additive' },
    ]],
    [GeneType.CREATIVITY, [
      { targetAttribute: 'creativity', weight: 0.9, influenceType: 'additive' },
      { targetAttribute: 'intelligence', weight: 0.3, influenceType: 'additive' },
      { targetAttribute: 'curiosity', weight: 0.5, influenceType: 'additive' },
    ]],
  ]);

  /** 行为概率影响配置 */
  private readonly behaviorInfluences: BehaviorInfluenceConfig[] = [
    {
      behavior: 'work',
      geneWeights: new Map([
        [GeneType.PHYSICAL, 0.3],
        [GeneType.COGNITIVE, 0.4],
        [GeneType.METABOLIC, 0.2],
      ]),
      baseProbability: 0.2,
    },
    {
      behavior: 'rest',
      geneWeights: new Map([
        [GeneType.METABOLIC, 0.4],
        [GeneType.LONGEVITY, 0.3],
      ]),
      baseProbability: 0.15,
    },
    {
      behavior: 'socialize',
      geneWeights: new Map([
        [GeneType.SOCIAL, 0.5],
        [GeneType.EMOTIONAL, 0.3],
        [GeneType.CREATIVITY, 0.2],
      ]),
      baseProbability: 0.2,
    },
    {
      behavior: 'explore',
      geneWeights: new Map([
        [GeneType.CREATIVITY, 0.4],
        [GeneType.COGNITIVE, 0.3],
        [GeneType.PHYSICAL, 0.2],
      ]),
      baseProbability: 0.15,
    },
    {
      behavior: 'migrate',
      geneWeights: new Map([
        [GeneType.SOCIAL, 0.2],
        [GeneType.CREATIVITY, 0.3],
      ]),
      baseProbability: 0.1,
    },
    {
      behavior: 'learn',
      geneWeights: new Map([
        [GeneType.COGNITIVE, 0.5],
        [GeneType.CREATIVITY, 0.3],
        [GeneType.SOCIAL, 0.2],
      ]),
      baseProbability: 0.2,
    },
  ];

  public static getInstance(): GeneInfluenceMapper {
    if (!GeneInfluenceMapper.instance) {
      GeneInfluenceMapper.instance = new GeneInfluenceMapper();
    }
    return GeneInfluenceMapper.instance;
  }

  /**
   * 计算基因对属性的影响
   * @param genome 基因组
   * @returns 属性影响映射
   */
  public calculateAttributeInfluences(genome: Genome): Map<string, number> {
    const influences = new Map<string, number>();

    for (const gene of genome.genes) {
      const configs = this.attributeMappings.get(gene.type);
      if (!configs) continue;

      for (const config of configs) {
        const currentValue = influences.get(config.targetAttribute) || 0;
        let influence = 0;

        switch (config.influenceType) {
          case 'additive':
            influence = gene.value * gene.expressionLevel * config.weight;
            break;
          case 'multiplicative':
            influence = currentValue * (1 + gene.value * config.weight);
            break;
          case 'threshold':
            influence = gene.value > 0.5 ? config.weight : 0;
            break;
        }

        const dominanceMultiplier = gene.dominance === 'dominant' ? 1.5 :
                                    gene.dominance === 'recessive' ? 0.5 : 1.0;

        influences.set(
          config.targetAttribute,
          currentValue + influence * dominanceMultiplier
        );
      }
    }

    return influences;
  }

  /**
   * 计算基因对行为概率的影响
   * @param genome 基因组
   * @returns 行为概率映射
   */
  public calculateBehaviorProbabilities(genome: Genome): Map<string, number> {
    const probabilities = new Map<string, number>();

    for (const behaviorConfig of this.behaviorInfluences) {
      let totalInfluence = behaviorConfig.baseProbability;

      for (const [geneType, weight] of behaviorConfig.geneWeights) {
        const geneTypeValue = genomeManager.getPhenotypeValue(genome, geneType);
        totalInfluence += geneTypeValue * weight * 0.3;
      }

      probabilities.set(behaviorConfig.behavior, Math.min(1, Math.max(0, totalInfluence)));
    }

    const total = Array.from(probabilities.values()).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const [behavior, prob] of probabilities) {
        probabilities.set(behavior, prob / total);
      }
    }

    return probabilities;
  }

  /**
   * 获取基因影响摘要
   * @param genome 基因组（支持扩展格式和简单格式）
   * @returns 影响摘要
   */
  public getInfluenceSummary(genome: Genome | { genes: string }): {
    attributes: Map<string, number>;
    behaviors: Map<string, number>;
    dominantTraits: string[];
    recessiveTraits: string[];
  } {
    const dominantTraits: string[] = [];
    const recessiveTraits: string[] = [];

    if (this.isExtendedGenome(genome)) {
      const attributes = this.calculateAttributeInfluences(genome);
      const behaviors = this.calculateBehaviorProbabilities(genome);

      for (const gene of genome.genes) {
        if (gene.value > 0.7 && gene.expressionLevel > 0.7) {
          dominantTraits.push(`${gene.name}(${(gene.value * 100).toFixed(0)}%)`);
        } else if (gene.value < 0.3 && gene.dominance === 'recessive') {
          recessiveTraits.push(`${gene.name}(${(gene.value * 100).toFixed(0)}%)`);
        }
      }

      return {
        attributes,
        behaviors,
        dominantTraits: dominantTraits.slice(0, 5),
        recessiveTraits: recessiveTraits.slice(0, 5),
      };
    } else {
      return this.getInfluenceSummaryFromSimpleGenome(genome as { genes: string });
    }
  }

  private isExtendedGenome(genome: any): genome is Genome {
    return genome && Array.isArray(genome.genes) && 
           genome.genes.length > 0 && 
           typeof genome.genes[0] === 'object' && 
           'type' in genome.genes[0];
  }

  private getInfluenceSummaryFromSimpleGenome(genome: { genes: string }): {
    attributes: Map<string, number>;
    behaviors: Map<string, number>;
    dominantTraits: string[];
    recessiveTraits: string[];
  } {
    const genes = Uint8Array.from(atob(genome.genes), c => c.charCodeAt(0));
    const attributes = new Map<string, number>();
    const behaviors = new Map<string, number>();

    const workGene = (genes[10] + genes[11]) / 2 / 255;
    const socialGene = genes[6] / 255;
    const exploreGene = genes[7] / 255;

    attributes.set('strength', genes[0] / 255);
    attributes.set('intelligence', genes[1] / 255);
    attributes.set('charisma', genes[2] / 255);
    attributes.set('constitution', genes[3] / 255);

    behaviors.set('work', 0.2 + workGene * 0.15);
    behaviors.set('rest', 0.15 + (1 - workGene) * 0.1);
    behaviors.set('socialize', 0.2 + socialGene * 0.15);
    behaviors.set('explore', 0.15 + exploreGene * 0.15);
    behaviors.set('migrate', 0.1);
    behaviors.set('learn', 0.2 + workGene * 0.1);

    const total = Array.from(behaviors.values()).reduce((a, b) => a + b, 0);
    for (const [key, value] of behaviors) {
      behaviors.set(key, value / total);
    }

    return {
      attributes,
      behaviors,
      dominantTraits: [],
      recessiveTraits: [],
    };
  }

  /**
   * 应用基因影响到市民属性
   * @param genome 基因组
   * @param baseAttributes 基础属性
   * @returns 应用后的属性
   */
  public applyGeneticInfluences(
    genome: Genome,
    baseAttributes: Record<string, number>
  ): Record<string, number> {
    const influences = this.calculateAttributeInfluences(genome);
    const result: Record<string, number> = { ...baseAttributes };

    for (const [attr, influence] of influences) {
      if (result[attr] !== undefined) {
        result[attr] = Math.min(1, Math.max(0, result[attr] + influence * 0.3));
      } else {
        result[attr] = Math.min(1, Math.max(0, 0.5 + influence * 0.3));
      }
    }

    return result;
  }
}

export const geneInfluenceMapper = GeneInfluenceMapper.getInstance();

// 导出单例
export const genomeManager = GenomeManager.getInstance();
export default genomeManager;
