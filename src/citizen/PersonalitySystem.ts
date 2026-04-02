/**
 * =============================================================================
 * 市民性格系统
 * Citizen Personality System
 * 基于大五人格模型 (Big Five Personality Traits)
 * =============================================================================
 */

import type { Genome, Gene, GeneType } from './GenomeSystem';
import { GeneType as GT } from './GenomeSystem';

/** 大五人格特质 */
export interface PersonalityTraits {
  /** 开放性 (Openness) - 好奇心、创造力、艺术兴趣 */
  openness: number;
  /** 尽责性 (Conscientiousness) - 自律、组织能力、可靠性 */
  conscientiousness: number;
  /** 外向性 (Extraversion) - 社交性、活力、自信 */
  extraversion: number;
  /** 宜人性 (Agreeableness) - 合作性、同理心、信任 */
  agreeableness: number;
  /** 神经质 (Neuroticism) - 情绪稳定性、焦虑倾向 */
  neuroticism: number;
}

/** 性格维度描述 */
export interface PersonalityDimension {
  name: string;
  value: number;
  level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  description: string;
}

/** 对话场景类型 */
export type DialogueScenario = 
  | 'greeting'
  | 'farewell'
  | 'complaint'
  | 'celebration'
  | 'conflict'
  | 'negotiation'
  | 'comfort'
  | 'advice'
  | 'gossip'
  | 'work_discussion';

/** 对话上下文 */
export interface DialogueContext {
  scenario: DialogueScenario;
  targetName?: string;
  topic?: string;
  mood: number;
  energy: number;
  relationshipLevel?: number;
  timeOfDay?: string;
  recentEvents?: string[];
}

/** 对话选项 */
export interface DialogueOption {
  text: string;
  tone: 'friendly' | 'neutral' | 'hostile' | 'enthusiastic' | 'cautious';
  personalityInfluence: Partial<PersonalityTraits>;
}

/** 性格系统配置 */
export interface PersonalitySystemConfig {
  geneticInfluenceWeight: number;
  environmentalInfluenceWeight: number;
  developmentRate: number;
}

/** 性格发展历史记录 */
export interface PersonalityDevelopmentRecord {
  timestamp: number;
  trait: keyof PersonalityTraits;
  previousValue: number;
  newValue: number;
  reason: string;
}

/**
 * 性格系统类
 */
export class PersonalitySystem {
  private config: PersonalitySystemConfig;
  private developmentHistory: PersonalityDevelopmentRecord[] = [];

  constructor(config?: Partial<PersonalitySystemConfig>) {
    this.config = {
      geneticInfluenceWeight: 0.6,
      environmentalInfluenceWeight: 0.4,
      developmentRate: 0.01,
      ...config,
    };
  }

  /**
   * 从基因组生成性格特质
   * @param genome 基因组
   * @returns 性格特质
   */
  public generatePersonality(genome: Genome | { genes: string; geneCount: number }): PersonalityTraits {
    if (this.isExtendedGenome(genome)) {
      return this.generateFromExtendedGenome(genome);
    } else {
      return this.generateFromSimpleGenome(genome as { genes: string; geneCount: number });
    }
  }

  /**
   * 检查是否为扩展基因组
   */
  private isExtendedGenome(genome: any): genome is Genome {
    return genome && Array.isArray(genome.genes) && 
           genome.genes.length > 0 && 
           typeof genome.genes[0] === 'object' && 
           'type' in genome.genes[0];
  }

  /**
   * 从扩展基因组生成性格
   */
  private generateFromExtendedGenome(genome: Genome): PersonalityTraits {
    const traits: PersonalityTraits = {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5,
    };

    const geneTypeInfluence: Record<keyof PersonalityTraits, Array<[GeneType, number]>> = {
      openness: [
        [GT.CREATIVITY, 0.4],
        [GT.COGNITIVE, 0.3],
        [GT.EMOTIONAL, 0.2],
      ],
      conscientiousness: [
        [GT.COGNITIVE, 0.3],
        [GT.EMOTIONAL, 0.3],
        [GT.PHYSICAL, 0.1],
      ],
      extraversion: [
        [GT.SOCIAL, 0.5],
        [GT.EMOTIONAL, 0.3],
        [GT.CREATIVITY, 0.1],
      ],
      agreeableness: [
        [GT.SOCIAL, 0.4],
        [GT.EMOTIONAL, 0.4],
        [GT.COGNITIVE, 0.1],
      ],
      neuroticism: [
        [GT.EMOTIONAL, 0.5],
        [GT.COGNITIVE, 0.2],
        [GT.IMMUNE, 0.1],
      ],
    };

    for (const [trait, typeWeights] of Object.entries(geneTypeInfluence) as Array<[keyof PersonalityTraits, Array<[GeneType, number]>]>) {
      let totalValue = 0.5;
      let totalWeight = 1;

      const weightMap = new Map(typeWeights);

      for (const gene of genome.genes) {
        const weight = weightMap.get(gene.type) || 0;
        if (weight > 0) {
          const dominanceMultiplier = gene.dominance === 'dominant' ? 1.3 :
                                      gene.dominance === 'recessive' ? 0.7 : 1.0;
          totalValue += gene.value * gene.expressionLevel * weight * dominanceMultiplier;
          totalWeight += weight;
        }
      }

      traits[trait] = Math.max(0, Math.min(1, totalValue / totalWeight));
    }

    return traits;
  }

  /**
   * 从简单基因组生成性格
   */
  private generateFromSimpleGenome(genome: { genes: string; geneCount: number }): PersonalityTraits {
    const genes = Uint8Array.from(atob(genome.genes), c => c.charCodeAt(0));

    return {
      openness: this.calculateTraitFromGenes(genes, [7, 9, 10, 11]),
      conscientiousness: this.calculateTraitFromGenes(genes, [8, 10, 20, 23]),
      extraversion: this.calculateTraitFromGenes(genes, [6, 18, 19, 21]),
      agreeableness: this.calculateTraitFromGenes(genes, [5, 6, 18, 21]),
      neuroticism: this.calculateTraitFromGenes(genes, [8, 22, 5]),
    };
  }

  /**
   * 从基因位置计算特质值
   */
  private calculateTraitFromGenes(genes: Uint8Array, positions: number[]): number {
    let sum = 0;
    let count = 0;

    for (const pos of positions) {
      if (pos < genes.length) {
        sum += genes[pos] / 255;
        count++;
      }
    }

    return count > 0 ? sum / count : 0.5;
  }

  /**
   * 获取性格描述文本
   * @param traits 性格特质
   * @returns 性格描述
   */
  public getPersonalityDescription(traits: PersonalityTraits): string {
    const dimensions = this.getPersonalityDimensions(traits);
    const descriptions: string[] = [];

    const dominantTraits = dimensions
      .filter(d => d.level === 'high' || d.level === 'very_high')
      .slice(0, 3);

    for (const trait of dominantTraits) {
      descriptions.push(trait.description);
    }

    const recessiveTraits = dimensions
      .filter(d => d.level === 'low' || d.level === 'very_low')
      .slice(0, 2);

    for (const trait of recessiveTraits) {
      descriptions.push(trait.description);
    }

    const archetype = this.getArchetype(traits);
    descriptions.unshift(`性格类型：${archetype}`);

    return descriptions.join('。');
  }

  /**
   * 获取性格维度详情
   */
  public getPersonalityDimensions(traits: PersonalityTraits): PersonalityDimension[] {
    return [
      this.createDimension('开放性', traits.openness, 'openness'),
      this.createDimension('尽责性', traits.conscientiousness, 'conscientiousness'),
      this.createDimension('外向性', traits.extraversion, 'extraversion'),
      this.createDimension('宜人性', traits.agreeableness, 'agreeableness'),
      this.createDimension('神经质', traits.neuroticism, 'neuroticism'),
    ];
  }

  /**
   * 创建性格维度
   */
  private createDimension(
    name: string,
    value: number,
    traitKey: keyof PersonalityTraits
  ): PersonalityDimension {
    const level = this.getTraitLevel(value);
    const description = this.getTraitDescription(traitKey, level);

    return { name, value, level, description };
  }

  /**
   * 获取特质等级
   */
  private getTraitLevel(value: number): PersonalityDimension['level'] {
    if (value < 0.2) return 'very_low';
    if (value < 0.4) return 'low';
    if (value < 0.6) return 'moderate';
    if (value < 0.8) return 'high';
    return 'very_high';
  }

  /**
   * 获取特质描述
   */
  private getTraitDescription(
    trait: keyof PersonalityTraits,
    level: PersonalityDimension['level']
  ): string {
    const descriptions: Record<keyof PersonalityTraits, Record<PersonalityDimension['level'], string>> = {
      openness: {
        very_low: '思想保守，偏好传统和熟悉的事物',
        low: '较为务实，对新事物持谨慎态度',
        moderate: '对新事物保持适度的好奇心',
        high: '富有想象力和创造力，乐于尝试新事物',
        very_high: '极具创造力，追求新奇和多样性',
      },
      conscientiousness: {
        very_low: '随性自由，不太注重计划和秩序',
        low: '较为灵活，有时缺乏条理',
        moderate: '做事有计划，但也能适应变化',
        high: '自律性强，做事有条理且可靠',
        very_high: '极度自律，追求完美和高效率',
      },
      extraversion: {
        very_low: '内向安静，喜欢独处',
        low: '较为内敛，社交活动有限',
        moderate: '能在社交和独处间保持平衡',
        high: '外向开朗，喜欢社交活动',
        very_high: '极度外向，充满活力和热情',
      },
      agreeableness: {
        very_low: '竞争心强，较少考虑他人感受',
        low: '较为独立，有时显得冷漠',
        moderate: '能与他人合作，但也会坚持己见',
        high: '友善合作，富有同理心',
        very_high: '极度善良，总是优先考虑他人',
      },
      neuroticism: {
        very_low: '情绪非常稳定，极少焦虑',
        low: '情绪较为稳定，压力承受力强',
        moderate: '情绪波动适中，能应对日常压力',
        high: '容易焦虑和情绪波动',
        very_high: '情绪敏感，容易感到压力和不安',
      },
    };

    return descriptions[trait][level];
  }

  /**
   * 获取性格原型
   */
  public getArchetype(traits: PersonalityTraits): string {
    const archetypes = this.getArchetypes();
    let bestMatch = archetypes[0];
    let bestScore = 0;

    for (const archetype of archetypes) {
      let score = 0;
      for (const key of Object.keys(traits) as Array<keyof PersonalityTraits>) {
        const diff = Math.abs(traits[key] - archetype.idealTraits[key]);
        score += 1 - diff;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = archetype;
      }
    }

    return bestMatch.name;
  }

  /**
   * 获取性格原型列表
   */
  private getArchetypes(): Array<{ name: string; idealTraits: PersonalityTraits }> {
    return [
      {
        name: '探索者',
        idealTraits: {
          openness: 0.8,
          conscientiousness: 0.4,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.3,
        },
      },
      {
        name: '领导者',
        idealTraits: {
          openness: 0.6,
          conscientiousness: 0.7,
          extraversion: 0.8,
          agreeableness: 0.4,
          neuroticism: 0.3,
        },
      },
      {
        name: '艺术家',
        idealTraits: {
          openness: 0.9,
          conscientiousness: 0.3,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.5,
        },
      },
      {
        name: '守护者',
        idealTraits: {
          openness: 0.3,
          conscientiousness: 0.8,
          extraversion: 0.4,
          agreeableness: 0.7,
          neuroticism: 0.3,
        },
      },
      {
        name: '调解者',
        idealTraits: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.9,
          neuroticism: 0.4,
        },
      },
      {
        name: '学者',
        idealTraits: {
          openness: 0.7,
          conscientiousness: 0.8,
          extraversion: 0.3,
          agreeableness: 0.5,
          neuroticism: 0.4,
        },
      },
      {
        name: '冒险家',
        idealTraits: {
          openness: 0.7,
          conscientiousness: 0.3,
          extraversion: 0.7,
          agreeableness: 0.4,
          neuroticism: 0.5,
        },
      },
      {
        name: '智者',
        idealTraits: {
          openness: 0.6,
          conscientiousness: 0.6,
          extraversion: 0.4,
          agreeableness: 0.6,
          neuroticism: 0.2,
        },
      },
    ];
  }

  /**
   * 生成对话
   * @param citizen 市民信息
   * @param context 对话上下文
   * @returns 对话文本
   */
  public generateDialogue(
    citizen: {
      name: string;
      traits: PersonalityTraits;
      mood: number;
      energy: number;
    },
    context: DialogueContext
  ): string {
    const dialogueOptions = this.getDialogueOptions(citizen.traits, context);
    const selectedOption = this.selectDialogue(dialogueOptions, citizen, context);
    
    return this.personalizeDialogue(selectedOption.text, citizen, context);
  }

  /**
   * 获取对话选项
   */
  private getDialogueOptions(traits: PersonalityTraits, context: DialogueContext): DialogueOption[] {
    const baseOptions = this.getBaseDialogueOptions(context.scenario);
    
    return baseOptions.map(option => ({
      ...option,
      score: this.calculateDialogueScore(option, traits, context),
    }));
  }

  /**
   * 获取基础对话选项
   */
  private getBaseDialogueOptions(scenario: DialogueScenario): DialogueOption[] {
    const scenarioDialogues: Record<DialogueScenario, DialogueOption[]> = {
      greeting: [
        { text: '你好，{target}。', tone: 'neutral', personalityInfluence: {} },
        { text: '嗨！{target}，很高兴见到你！', tone: 'enthusiastic', personalityInfluence: { extraversion: 0.7 } },
        { text: '哦，是你啊，{target}。', tone: 'cautious', personalityInfluence: { neuroticism: 0.6 } },
        { text: '{target}！我正想找你呢。', tone: 'friendly', personalityInfluence: { extraversion: 0.6, agreeableness: 0.5 } },
      ],
      farewell: [
        { text: '再见，{target}。', tone: 'neutral', personalityInfluence: {} },
        { text: '下次再聊，{target}！保重！', tone: 'friendly', personalityInfluence: { extraversion: 0.6 } },
        { text: '嗯，走了。', tone: 'neutral', personalityInfluence: { extraversion: 0.3 } },
        { text: '期待下次见面，{target}。', tone: 'friendly', personalityInfluence: { agreeableness: 0.6 } },
      ],
      complaint: [
        { text: '我对此很不满意...', tone: 'hostile', personalityInfluence: { neuroticism: 0.7 } },
        { text: '这事儿让我很困扰。', tone: 'neutral', personalityInfluence: { conscientiousness: 0.5 } },
        { text: '算了，没什么大不了的。', tone: 'neutral', personalityInfluence: { agreeableness: 0.7 } },
        { text: '我们需要解决这个问题。', tone: 'cautious', personalityInfluence: { conscientiousness: 0.7 } },
      ],
      celebration: [
        { text: '太棒了！我们成功了！', tone: 'enthusiastic', personalityInfluence: { extraversion: 0.8 } },
        { text: '不错的成果。', tone: 'neutral', personalityInfluence: { conscientiousness: 0.6 } },
        { text: '这是团队的努力！', tone: 'friendly', personalityInfluence: { agreeableness: 0.7 } },
        { text: '终于...我们做到了。', tone: 'neutral', personalityInfluence: { neuroticism: 0.4 } },
      ],
      conflict: [
        { text: '我不同意你的看法。', tone: 'neutral', personalityInfluence: { conscientiousness: 0.5 } },
        { text: '你这是在开玩笑吗？', tone: 'hostile', personalityInfluence: { neuroticism: 0.7 } },
        { text: '让我们冷静下来讨论。', tone: 'cautious', personalityInfluence: { agreeableness: 0.7 } },
        { text: '我理解你的立场，但...', tone: 'friendly', personalityInfluence: { agreeableness: 0.8 } },
      ],
      negotiation: [
        { text: '我们可以各退一步。', tone: 'neutral', personalityInfluence: { agreeableness: 0.6 } },
        { text: '这是我的底线。', tone: 'cautious', personalityInfluence: { conscientiousness: 0.7 } },
        { text: '让我们找到一个双赢的方案。', tone: 'friendly', personalityInfluence: { openness: 0.6 } },
        { text: '我需要更多时间考虑。', tone: 'neutral', personalityInfluence: { neuroticism: 0.5 } },
      ],
      comfort: [
        { text: '一切都会好起来的。', tone: 'friendly', personalityInfluence: { agreeableness: 0.7 } },
        { text: '我在这里陪着你。', tone: 'friendly', personalityInfluence: { extraversion: 0.5, agreeableness: 0.8 } },
        { text: '别担心，这只是暂时的。', tone: 'neutral', personalityInfluence: { conscientiousness: 0.5 } },
        { text: '有什么我能帮你的吗？', tone: 'friendly', personalityInfluence: { agreeableness: 0.9 } },
      ],
      advice: [
        { text: '我觉得你应该...', tone: 'neutral', personalityInfluence: { conscientiousness: 0.6 } },
        { text: '如果我是你，我会...', tone: 'friendly', personalityInfluence: { openness: 0.6 } },
        { text: '相信你的直觉。', tone: 'friendly', personalityInfluence: { openness: 0.7 } },
        { text: '让我分析一下情况...', tone: 'cautious', personalityInfluence: { conscientiousness: 0.8 } },
      ],
      gossip: [
        { text: '你听说了吗？', tone: 'friendly', personalityInfluence: { extraversion: 0.7 } },
        { text: '有些有趣的事情...', tone: 'neutral', personalityInfluence: { openness: 0.5 } },
        { text: '我不应该说的，但是...', tone: 'cautious', personalityInfluence: { neuroticism: 0.5 } },
        { text: '这事儿只有你知道...', tone: 'friendly', personalityInfluence: { agreeableness: 0.6 } },
      ],
      work_discussion: [
        { text: '关于这个项目...', tone: 'neutral', personalityInfluence: { conscientiousness: 0.7 } },
        { text: '我有个想法想分享。', tone: 'friendly', personalityInfluence: { openness: 0.7 } },
        { text: '我们需要更高效的方法。', tone: 'cautious', personalityInfluence: { conscientiousness: 0.8 } },
        { text: '大家觉得怎么样？', tone: 'friendly', personalityInfluence: { extraversion: 0.6 } },
      ],
    };

    return scenarioDialogues[scenario] || scenarioDialogues.greeting;
  }

  /**
   * 计算对话选项得分
   */
  private calculateDialogueScore(
    option: DialogueOption,
    traits: PersonalityTraits,
    context: DialogueContext
  ): number {
    let score = 0;

    for (const [trait, value] of Object.entries(option.personalityInfluence)) {
      const traitKey = trait as keyof PersonalityTraits;
      const traitValue = traits[traitKey];
      const matchScore = 1 - Math.abs(traitValue - (value || 0.5));
      score += matchScore * 0.5;
    }

    if (context.mood < 30 && option.tone === 'enthusiastic') {
      score *= 0.5;
    }
    if (context.mood > 70 && option.tone === 'hostile') {
      score *= 0.3;
    }

    if (context.energy < 30 && option.tone === 'enthusiastic') {
      score *= 0.7;
    }

    return score;
  }

  /**
   * 选择对话选项
   */
  private selectDialogue(
    options: Array<DialogueOption & { score?: number }>,
    citizen: { traits: PersonalityTraits; mood: number; energy: number },
    context: DialogueContext
  ): DialogueOption {
    const scoredOptions = options.map(opt => ({
      ...opt,
      score: opt.score || Math.random(),
    }));

    scoredOptions.sort((a, b) => (b.score || 0) - (a.score || 0));

    const topOptions = scoredOptions.slice(0, Math.min(3, scoredOptions.length));
    const randomFactor = Math.random();
    
    if (randomFactor < 0.5) {
      return topOptions[0];
    } else if (randomFactor < 0.8 && topOptions.length > 1) {
      return topOptions[1];
    } else if (topOptions.length > 2) {
      return topOptions[2];
    }
    
    return topOptions[0];
  }

  /**
   * 个性化对话文本
   */
  private personalizeDialogue(
    text: string,
    citizen: { name: string; traits: PersonalityTraits; mood: number },
    context: DialogueContext
  ): string {
    let personalizedText = text;

    personalizedText = personalizedText.replace(/{target}/g, context.targetName || '朋友');

    if (citizen.traits.extraversion > 0.7) {
      personalizedText = personalizedText.replace('。', '！');
    }

    if (citizen.traits.neuroticism > 0.7 && Math.random() < 0.3) {
      const hesitations = ['嗯...', '这个...', '怎么说呢...'];
      personalizedText = hesitations[Math.floor(Math.random() * hesitations.length)] + personalizedText;
    }

    if (citizen.traits.agreeableness > 0.8 && context.scenario === 'greeting') {
      personalizedText = personalizedText.replace('你好', '亲爱的');
    }

    if (citizen.traits.conscientiousness > 0.7 && context.scenario === 'work_discussion') {
      personalizedText = '关于工作，' + personalizedText;
    }

    return personalizedText;
  }

  /**
   * 根据经历发展性格
   */
  public developPersonality(
    traits: PersonalityTraits,
    experience: {
      type: 'positive' | 'negative' | 'neutral';
      intensity: number;
      relatedTrait?: keyof PersonalityTraits;
    }
  ): PersonalityTraits {
    const newTraits = { ...traits };
    const delta = experience.intensity * this.config.developmentRate;

    if (experience.relatedTrait) {
      if (experience.type === 'positive') {
        newTraits[experience.relatedTrait] = Math.min(1, 
          newTraits[experience.relatedTrait] + delta
        );
      } else if (experience.type === 'negative') {
        newTraits[experience.relatedTrait] = Math.max(0, 
          newTraits[experience.relatedTrait] - delta
        );
      }
    }

    this.recordDevelopment(traits, newTraits, experience);

    return newTraits;
  }

  /**
   * 记录性格发展
   */
  private recordDevelopment(
    oldTraits: PersonalityTraits,
    newTraits: PersonalityTraits,
    experience: { type: string; relatedTrait?: keyof PersonalityTraits }
  ): void {
    if (!experience.relatedTrait) return;

    this.developmentHistory.push({
      timestamp: Date.now(),
      trait: experience.relatedTrait,
      previousValue: oldTraits[experience.relatedTrait],
      newValue: newTraits[experience.relatedTrait],
      reason: `${experience.type} experience`,
    });

    if (this.developmentHistory.length > 100) {
      this.developmentHistory.shift();
    }
  }

  /**
   * 获取性格发展历史
   */
  public getDevelopmentHistory(): PersonalityDevelopmentRecord[] {
    return [...this.developmentHistory];
  }

  /**
   * 计算两个性格的兼容性
   */
  public calculateCompatibility(traits1: PersonalityTraits, traits2: PersonalityTraits): number {
    let compatibility = 0;

    const agreeablenessBonus = (traits1.agreeableness + traits2.agreeableness) / 2 * 0.2;
    compatibility += agreeablenessBonus;

    const extraversionMatch = 1 - Math.abs(traits1.extraversion - traits2.extraversion);
    compatibility += extraversionMatch * 0.2;

    const opennessMatch = 1 - Math.abs(traits1.openness - traits2.openness);
    compatibility += opennessMatch * 0.15;

    const conscientiousnessMatch = 1 - Math.abs(traits1.conscientiousness - traits2.conscientiousness);
    compatibility += conscientiousnessMatch * 0.15;

    const neuroticismPenalty = Math.max(traits1.neuroticism, traits2.neuroticism) * 0.1;
    compatibility -= neuroticismPenalty;

    return Math.max(0, Math.min(1, compatibility));
  }

  /**
   * 获取性格对决策的影响
   */
  public getDecisionInfluence(traits: PersonalityTraits): Record<string, number> {
    return {
      work: traits.conscientiousness * 0.3 + traits.openness * 0.1,
      rest: (1 - traits.conscientiousness) * 0.2 + traits.neuroticism * 0.1,
      socialize: traits.extraversion * 0.4 + traits.agreeableness * 0.2,
      explore: traits.openness * 0.4 + traits.extraversion * 0.1,
      migrate: traits.openness * 0.2 + (1 - traits.agreeableness) * 0.1,
      learn: traits.openness * 0.3 + traits.conscientiousness * 0.2,
    };
  }
}

export const personalitySystem = new PersonalitySystem();
export default PersonalitySystem;
