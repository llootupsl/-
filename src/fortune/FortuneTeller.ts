/**
 * =============================================================================
 * 命理推算器 - 结合熵增纪元的命运预测
 * =============================================================================
 */

import { EightCharactersAnalysis, EightCharacters, STEM_WUXING, BRANCH_WUXING, Wuxing } from './EightCharactersCalculator';

/* ==========================================================================
   类型定义
   ========================================================================== */

/** 命理类型 */
export type FortuneType = 
  | 'career'      // 事业运势
  | 'wealth'      // 财富运势
  | 'love'        // 感情运势
  | 'health'      // 健康运势
  | 'study'       // 学业运势
  | 'overall';    // 综合运势

/** 运势等级 */
export type FortuneLevel = '极佳' | '优秀' | '良好' | '平顺' | '波动' | '低迷' | '低谷';

/** 命理推算结果 */
export interface FortuneResult {
  type: FortuneType;
  level: FortuneLevel;
  score: number;        // 0-100
  summary: string;      // 简要概述
  details: string[];     // 详细分析
  luckyDirections: string[];
  luckyColors: string[];
  luckyNumbers: number[];
  avoidThings: string[];
  suggestions: string[];
  suitableCareers: string[];
}

/* ==========================================================================
   运势等级配置
   ========================================================================== */

const FORTUNE_LEVEL_CONFIG: Record<FortuneLevel, { range: [number, number]; color: string; emoji: string }> = {
  '极佳': { range: [90, 100], color: '#ffd700', emoji: '🌟' },
  '优秀': { range: [75, 89], color: '#00ff88', emoji: '✨' },
  '良好': { range: [60, 74], color: '#00d4ff', emoji: '👍' },
  '平顺': { range: [45, 59], color: '#888888', emoji: '☯️' },
  '波动': { range: [30, 44], color: '#ffaa00', emoji: '🌊' },
  '低迷': { range: [15, 29], color: '#ff6666', emoji: '⚠️' },
  '低谷': { range: [0, 14], color: '#ff3333', emoji: '💔' },
};

/** 五行对应颜色 */
const WUXING_COLORS: Record<Wuxing, string[]> = {
  木: ['#00ff88', '#228b22', '#32cd32'],
  火: ['#ff4444', '#ff6600', '#ffaa00'],
  土: ['#8b4513', '#daa520', '#d2691e'],
  金: ['#ffd700', '#c0c0c0', '#b8860b'],
  水: ['#00bfff', '#1e90ff', '#4169e1'],
};

/** 五行对应数字 */
const WUXING_NUMBERS: Record<Wuxing, number[]> = {
  木: [1, 2],
  火: [3, 4],
  土: [5, 6],
  金: [7, 8],
  水: [9, 0],
};

/** 五行对应方位 */
const WUXING_DIRECTIONS: Record<Wuxing, string[]> = {
  木: ['东方', '东南'],
  火: ['南方', '东南'],
  土: ['中央', '西南', '东北'],
  金: ['西方', '西北'],
  水: ['北方', '东北'],
};

/* ==========================================================================
   命理推算引擎
   ========================================================================== */

export class FortuneTeller {
  private analysis: EightCharactersAnalysis;

  constructor(analysis: EightCharactersAnalysis) {
    this.analysis = analysis;
  }

  /**
   * 推算综合运势
   */
  calculateOverall(): FortuneResult {
    const { eightChars, strengthAnalysis, godsAnalysis } = this.analysis;
    let score = 50;
    score += this.getStrengthBonus(strengthAnalysis.score);
    score += this.getGodsBonus(godsAnalysis);
    score += this.getWuxingBalanceBonus();
    score = Math.max(0, Math.min(100, score));
    const level = this.getFortuneLevel(score);
    
    return {
      type: 'overall',
      level,
      score,
      summary: this.generateOverallSummary(score, strengthAnalysis.verdict),
      details: this.generateOverallDetails(),
      luckyDirections: this.getLuckyDirections(),
      luckyColors: this.getLuckyColors(),
      luckyNumbers: this.getLuckyNumbers(),
      avoidThings: this.getAvoidThings(),
      suggestions: this.getSuggestions(),
      suitableCareers: this.getSuitableCareers(),
    };
  }

  /**
   * 推算事业运势
   */
  calculateCareer(): FortuneResult {
    const { godsAnalysis, strengthAnalysis } = this.analysis;
    let score = 50;
    score += godsAnalysis.zhengGuan * 10 + godsAnalysis.pianGuan * 5;
    if (strengthAnalysis.score > 10 && godsAnalysis.zhengGuan > 0) score += 15;
    if (strengthAnalysis.score < -10 && godsAnalysis.zhengGuan > 0) score -= 15;
    score += godsAnalysis.zhengYin * 8 + godsAnalysis.pianYin * 4;
    score = Math.max(0, Math.min(100, score));
    const level = this.getFortuneLevel(score);
    
    return {
      type: 'career',
      level,
      score,
      summary: this.generateCareerSummary(score),
      details: this.generateCareerDetails(godsAnalysis),
      luckyDirections: this.getLuckyDirections(),
      luckyColors: this.getLuckyColors(),
      luckyNumbers: this.getLuckyNumbers(),
      avoidThings: this.getCareerAvoidThings(),
      suggestions: this.getCareerSuggestions(),
      suitableCareers: this.getSuitableCareers(),
    };
  }

  /**
   * 推算财富运势
   */
  calculateWealth(): FortuneResult {
    const { godsAnalysis, strengthAnalysis } = this.analysis;
    let score = 50;
    score += godsAnalysis.zhengCai * 10 + godsAnalysis.pianCai * 7;
    if (strengthAnalysis.score > 0 && godsAnalysis.zhengCai > 0) score += 10;
    if (godsAnalysis.biJian > 0 || godsAnalysis.jieCai > 0) {
      score -= godsAnalysis.biJian * 3 + godsAnalysis.jieCai * 5;
    }
    if (godsAnalysis.shiShen > 0 || godsAnalysis.shangGuan > 0) {
      score += (godsAnalysis.shiShen + godsAnalysis.shangGuan) * 5;
    }
    score = Math.max(0, Math.min(100, score));
    const level = this.getFortuneLevel(score);
    
    return {
      type: 'wealth',
      level,
      score,
      summary: this.generateWealthSummary(score),
      details: this.generateWealthDetails(godsAnalysis),
      luckyDirections: this.getLuckyDirections(),
      luckyColors: this.getLuckyColors(),
      luckyNumbers: this.getLuckyNumbers(),
      avoidThings: this.getWealthAvoidThings(),
      suggestions: this.getWealthSuggestions(),
      suitableCareers: this.getSuitableCareers(),
    };
  }

  /**
   * 推算感情运势
   */
  calculateLove(): FortuneResult {
    const { eightChars, godsAnalysis } = this.analysis;
    let score = 50;
    score += godsAnalysis.zhengGuan * 8 + godsAnalysis.pianGuan * 4;
    score += godsAnalysis.zhengCai * 8 + godsAnalysis.pianCai * 4;
    const taohuaBranches = ['卯', '酉'];
    if (taohuaBranches.includes(eightChars.day.branch) || taohuaBranches.includes(eightChars.hour.branch)) {
      score += 10;
    }
    score = Math.max(0, Math.min(100, score));
    const level = this.getFortuneLevel(score);
    
    return {
      type: 'love',
      level,
      score,
      summary: this.generateLoveSummary(score),
      details: this.generateLoveDetails(eightChars),
      luckyDirections: ['东南', '正东'],
      luckyColors: ['粉色', '红色', '#ff69b4'],
      luckyNumbers: [2, 3, 7, 8],
      avoidThings: ['冲动行事', '三角关系'],
      suggestions: this.getLoveSuggestions(),
      suitableCareers: [],
    };
  }

  /**
   * 推算健康运势
   */
  calculateHealth(): FortuneResult {
    const { strengthAnalysis, wuxingDistribution } = this.analysis;
    let score = 60;
    if (strengthAnalysis.score > 10) score += 15;
    if (strengthAnalysis.score < -10) score -= 15;
    const missing = Object.entries(wuxingDistribution).filter(([_, v]) => v < 1);
    if (missing.length > 0) score -= missing.length * 5;
    score = Math.max(0, Math.min(100, score));
    const level = this.getFortuneLevel(score);
    
    return {
      type: 'health',
      level,
      score,
      summary: this.generateHealthSummary(score),
      details: this.generateHealthDetails(),
      luckyDirections: this.getLuckyDirections(),
      luckyColors: this.getLuckyColors(),
      luckyNumbers: this.getLuckyNumbers(),
      avoidThings: this.getHealthAvoidThings(),
      suggestions: this.getHealthSuggestions(),
      suitableCareers: [],
    };
  }

  /**
   * 推算学业运势
   */
  calculateStudy(): FortuneResult {
    const { godsAnalysis } = this.analysis;
    let score = 50;
    score += godsAnalysis.zhengYin * 12 + godsAnalysis.pianYin * 6;
    score += godsAnalysis.shiShen * 8 + godsAnalysis.shangGuan * 6;
    if (godsAnalysis.zhengGuan > 0) score -= 5;
    score = Math.max(0, Math.min(100, score));
    const level = this.getFortuneLevel(score);
    
    return {
      type: 'study',
      level,
      score,
      summary: this.generateStudySummary(score),
      details: this.generateStudyDetails(godsAnalysis),
      luckyDirections: ['正北', '东北'],
      luckyColors: ['蓝色', '黑色', '#4169e1'],
      luckyNumbers: [1, 6, 4, 9],
      avoidThings: ['分心娱乐', '拖延症'],
      suggestions: this.getStudySuggestions(),
      suitableCareers: [],
    };
  }

  private getFortuneLevel(score: number): FortuneLevel {
    if (score >= 90) return '极佳';
    if (score >= 75) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 45) return '平顺';
    if (score >= 30) return '波动';
    if (score >= 15) return '低迷';
    return '低谷';
  }

  private getStrengthBonus(score: number): number {
    if (score >= 40) return 15;
    if (score >= 20) return 10;
    if (score >= 0) return 5;
    if (score >= -20) return 0;
    if (score >= -40) return -5;
    return -10;
  }

  private getGodsBonus(gods: any): number {
    let bonus = 0;
    if (gods.zhengGuan > 0) bonus += 5;
    if (gods.zhengCai > 0) bonus += 5;
    if (gods.zhengYin > 0) bonus += 5;
    if (gods.shiShen > 0) bonus += 3;
    return bonus;
  }

  private getWuxingBalanceBonus(): number {
    const { wuxingDistribution } = this.analysis;
    const values = Object.values(wuxingDistribution);
    const avg = values.reduce((a, b) => a + b, 0) / 5;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / 5;
    if (variance < 1) return 10;
    if (variance < 3) return 5;
    if (variance < 5) return 0;
    return -5;
  }

  getLuckyDirections(): string[] {
    return WUXING_DIRECTIONS[this.analysis.dayStemWuxing];
  }

  getLuckyColors(): string[] {
    return WUXING_COLORS[this.analysis.dayStemWuxing];
  }

  getLuckyNumbers(): number[] {
    return WUXING_NUMBERS[this.analysis.dayStemWuxing];
  }

  getAvoidThings(): string[] {
    const { strengthAnalysis } = this.analysis;
    const avoid: string[] = [];
    if (strengthAnalysis.xiYong.includes('木')) avoid.push('西方活动');
    if (strengthAnalysis.xiYong.includes('火')) avoid.push('北方寒冷之地');
    if (strengthAnalysis.xiYong.includes('土')) avoid.push('激烈运动');
    if (strengthAnalysis.xiYong.includes('金')) avoid.push('南方火旺之地');
    if (strengthAnalysis.xiYong.includes('水')) avoid.push('干燥酷热环境');
    return avoid;
  }

  getSuitableCareers(): string[] {
    const { godsAnalysis } = this.analysis;
    const careers: string[] = [];
    if (godsAnalysis.zhengGuan > 0 || godsAnalysis.pianGuan > 0) {
      careers.push('公务员', '企业管理', '法律');
    }
    if (godsAnalysis.zhengCai > 0 || godsAnalysis.pianCai > 0) {
      careers.push('财务', '投资', '商业贸易');
    }
    if (godsAnalysis.zhengYin > 0 || godsAnalysis.pianYin > 0) {
      careers.push('教育', '文化', '医疗');
    }
    if (godsAnalysis.shiShen > 0) {
      careers.push('技术研发', '艺术创作', '餐饮');
    }
    if (godsAnalysis.biJian > 0 || godsAnalysis.jieCai > 0) {
      careers.push('创业', '销售', '自由职业');
    }
    return [...new Set(careers)];
  }

  private generateOverallSummary(score: number, verdict: string): string {
    if (score >= 80) return `${verdict}格局，整体运势极佳，把握机遇可有所成就。`;
    if (score >= 60) return `${verdict}格局运势良好，稳中求进，注意把握时机。`;
    if (score >= 40) return `${verdict}格局运势平稳，需耐心等待时机，避免冒进。`;
    return `${verdict}格局需谨慎行事，静心养性，积累力量。`;
  }

  private generateOverallDetails(): string[] {
    const { eightChars, strengthAnalysis } = this.analysis;
    return [
      `日主为${eightChars.day.stem}${STEM_WUXING[eightChars.day.stem]}，${strengthAnalysis.verdict}`,
      `年柱${eightChars.year.stem}${eightChars.year.branch}，${BRANCH_WUXING[eightChars.year.branch]}气旺盛`,
      `月柱${eightChars.month.stem}${eightChars.month.branch}，影响事业运势`,
      `时柱${eightChars.hour.stem}${eightChars.hour.branch}，关系晚年运势`,
      `命局喜${strengthAnalysis.xiYong.join('、')}，忌${strengthAnalysis.jiHuan.join('、')}`,
    ];
  }

  private generateCareerSummary(score: number): string {
    if (score >= 80) return '事业运势极佳，适合发展事业，有升职加薪的机会。';
    if (score >= 60) return '事业运势良好，工作中可展现才华，稳步发展。';
    if (score >= 40) return '事业运势平稳，需踏实努力，积累经验和口碑。';
    return '事业需谨慎，避免冒险，专注本行业务为佳。';
  }

  private generateCareerDetails(gods: any): string[] {
    const details: string[] = [];
    if (gods.zhengGuan > 0) details.push('有正官星，工作稳定有责任心');
    if (gods.pianGuan > 0) details.push('有偏官星，敢于挑战有魄力');
    if (gods.zhengYin > 0) details.push('有正印星，善于学习有靠山');
    if (gods.shiShen > 0) details.push('有食神星，表达能力强有创意');
    return details;
  }

  private generateWealthSummary(score: number): string {
    if (score >= 80) return '财富运势极佳，善于理财把握投资机会。';
    if (score >= 60) return '财富运势良好，勤劳致富，财源稳定。';
    if (score >= 40) return '财富运势平稳，理财需谨慎，开源节流。';
    return '财富需守成，避免冒险投资，防破财。';
  }

  private generateWealthDetails(gods: any): string[] {
    const details: string[] = [];
    if (gods.zhengCai > 0) details.push('正财星旺，勤劳正业得财');
    if (gods.pianCai > 0) details.push('偏财星旺，有意外之财机会');
    if (gods.shiShen > 0) details.push('食神生财，财运亨通');
    if (gods.biJian > 0 || gods.jieCai > 0) details.push('比劫较重，需防破财');
    return details;
  }

  private generateLoveSummary(score: number): string {
    if (score >= 80) return '感情运势极佳，姻缘美好，感情顺利。';
    if (score >= 60) return '感情运势良好，桃花运不错，需主动把握。';
    if (score >= 40) return '感情运势平稳，缘分需耐心等待。';
    return '感情需谨慎，避免冲动，专注自我成长。';
  }

  private generateLoveDetails(eightChars: any): string[] {
    const details: string[] = [];
    const taohuaBranches = ['卯', '酉'];
    if (taohuaBranches.includes(eightChars.day.branch)) {
      details.push('日支带桃花，感情丰富魅力强');
    }
    if (taohuaBranches.includes(eightChars.hour.branch)) {
      details.push('时支带桃花，晚年感情运佳');
    }
    return details;
  }

  private generateHealthSummary(score: number): string {
    if (score >= 80) return '健康运势极佳，身体素质好，少有疾病。';
    if (score >= 60) return '健康运势良好，注意养生保健即可。';
    if (score >= 40) return '健康运势平稳，需注意日常保健。';
    return '健康需多加注意，定期体检，养生调理。';
  }

  private generateHealthDetails(): string[] {
    const dayStem = this.analysis.eightChars.day.stem;
    const organs: Record<string, string> = {
      甲: '肝胆', 乙: '肝胆',
      丙: '心脏', 丁: '心脏',
      戊: '脾胃', 己: '脾胃',
      庚: '肺大肠', 辛: '肺大肠',
      壬: '肾膀胱', 癸: '肾膀胱',
    };
    return [
      `日主${dayStem}，需注意${organs[dayStem]}健康`,
      '注意饮食规律，适度运动',
      '保持心情舒畅，避免过度劳累',
    ];
  }

  private generateStudySummary(score: number): string {
    if (score >= 80) return '学业运势极佳，学习能力强，考试运佳。';
    if (score >= 60) return '学业运势良好，用功可有好成绩。';
    if (score >= 40) return '学业运势平稳，需勤奋努力。';
    return '学业需加倍努力，找对方法事半功倍。';
  }

  private generateStudyDetails(gods: any): string[] {
    const details: string[] = [];
    if (gods.zhengYin > 0) details.push('正印星旺，学习能力强');
    if (gods.pianYin > 0) details.push('偏印星旺，善于自学');
    if (gods.shiShen > 0) details.push('食神星旺，聪明有才华');
    return details;
  }

  private getSuggestions(): string[] {
    return ['保持积极心态，把握机遇', '注意人际关系维护', '定期反思总结，规划未来'];
  }

  private getCareerAvoidThings(): string[] {
    return ['冒险投机', '小人是非', '固执己见'];
  }

  private getCareerSuggestions(): string[] {
    return ['踏实工作积累经验', '把握贵人运势', '适时展示才华'];
  }

  private getWealthAvoidThings(): string[] {
    return ['冲动投资', '赌博投机', '攀比消费'];
  }

  private getWealthSuggestions(): string[] {
    return ['稳健理财为主', '开源节流并重', '长期投资规划'];
  }

  private getLoveSuggestions(): string[] {
    return ['主动但不过分', '真诚对待感情', '包容理解对方'];
  }

  private getHealthAvoidThings(): string[] {
    return ['熬夜', '暴饮暴食', '过度劳累'];
  }

  private getHealthSuggestions(): string[] {
    return ['规律作息', '适度运动', '定期体检'];
  }

  private getStudySuggestions(): string[] {
    return ['制定学习计划', '找到学习方法', '保持专注刻苦'];
  }
}
