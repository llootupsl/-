/**
 * =============================================================================
 * 八字计算核心 - 中国传统命理学基础
 * =============================================================================
 */

import { LunarDate, SolarDate, LunarInfo } from './LunarCalendar';

/* ==========================================================================
   天干地支定义
   ========================================================================== */

/** 天干 */
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

/** 地支 */
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/** 天干五行 */
export const STEM_WUXING: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

/** 地支五行 */
export const BRANCH_WUXING: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};

/** 地支藏干 */
export const BRANCH_HIDDEN_STEMS: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

/** 五行生克关系 - V5修复：使用 Wuxing 类型 */
export const WUXING_RELATIONS: {
  generate: Record<Wuxing, Wuxing>;
  overcome: Record<Wuxing, Wuxing>;
} = {
  // 相生: 木生火 -> 火生土 -> 土生金 -> 金生水 -> 水生木
  generate: { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' } as Record<Wuxing, Wuxing>,
  // 相克: 木克土 -> 土克水 -> 水克火 -> 火克金 -> 金克木
  overcome: { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' } as Record<Wuxing, Wuxing>,
};

/** 五行旺相表 (地支对应旺相状态) */
export const WUXING_STRENGTH: Record<string, Record<string, '旺' | '相' | '休' | '囚' | '死'>> = {
  木: { 寅: '旺', 卯: '旺', 辰: '相', 巳: '休', 午: '囚', 未: '死', 申: '死', 酉: '死', 戌: '死', 亥: '相', 子: '囚', 丑: '囚' },
  火: { 寅: '相', 卯: '相', 辰: '死', 巳: '旺', 午: '旺', 未: '休', 申: '囚', 酉: '死', 戌: '死', 亥: '死', 子: '死', 丑: '死' },
  土: { 寅: '死', 卯: '死', 辰: '旺', 巳: '死', 午: '旺', 未: '旺', 申: '死', 酉: '死', 戌: '旺', 亥: '死', 子: '死', 丑: '旺' },
  金: { 寅: '死', 卯: '死', 辰: '死', 巳: '死', 午: '死', 未: '相', 申: '旺', 酉: '旺', 戌: '相', 亥: '死', 子: '死', 丑: '死' },
  水: { 寅: '死', 卯: '死', 辰: '死', 巳: '死', 午: '死', 未: '死', 申: '相', 酉: '相', 戌: '死', 亥: '旺', 子: '旺', 丑: '死' },
};

/** 日干建禄表 */
export const DAY_STEM_STRONG_TYPES: Record<string, string[]> = {
  甲: ['寅', '卯'],
  乙: ['寅', '卯', '辰'],
  丙: ['巳', '午'],
  丁: ['巳', '午', '未'],
  戊: ['巳', '午', '辰', '戌', '丑'],
  己: ['巳', '午', '辰', '戌', '丑'],
  庚: ['申', '酉'],
  辛: ['申', '酉', '戌', '丑'],
  壬: ['亥', '子'],
  癸: ['亥', '子', '丑'],
};

/* ==========================================================================
   类型定义
   ========================================================================== */

/** 天干类型 */
export type HeavenlyStem = typeof HEAVENLY_STEMS[number];

/** 地支类型 */
export type EarthlyBranch = typeof EARTHLY_BRANCHES[number];

/** 五行类型 */
export type Wuxing = '木' | '火' | '土' | '金' | '水';

/** 旺相状态 */
export type StrengthState = '旺' | '相' | '休' | '囚' | '死';

/** 八字结构 */
export interface EightCharacters {
  /** 年柱: 天干 + 地支 */
  year: { stem: HeavenlyStem; branch: EarthlyBranch };
  /** 月柱: 天干 + 地支 */
  month: { stem: HeavenlyStem; branch: EarthlyBranch };
  /** 日柱: 天干 + 地支 */
  day: { stem: HeavenlyStem; branch: EarthlyBranch };
  /** 时柱: 天干 + 地支 */
  hour: { stem: HeavenlyStem; branch: EarthlyBranch };
}

/** 八字分析结果 */
export interface EightCharactersAnalysis {
  /** 八字本体 */
  eightChars: EightCharacters;
  /** 命主天干五行 */
  dayStemWuxing: Wuxing;
  /** 命主天干 - V5修复：添加缺失属性 */
  dayStem: HeavenlyStem;
  /** 日主天干 - V5修复：添加缺失属性 */
  dayStemName?: string;
  /** 四柱五行分布 */
  wuxingDistribution: Record<Wuxing, number>;
  /** 天干地支强弱分析 */
  strengthAnalysis: StrengthAnalysis;
  /** 十神分析 */
  godsAnalysis: GodsAnalysis;
  /** 大运 */
  daYun: Array<{ year: number; stem: HeavenlyStem; branch: EarthlyBranch }>;
  /** 流年 */
  liuNian: Array<{ year: number; stem: HeavenlyStem; branch: EarthlyBranch }>;
}

/** 强弱分析 */
export interface StrengthAnalysis {
  /** 综合旺衰得分 (-100 ~ 100) */
  score: number;
  /** 旺衰判断 */
  verdict: '极强' | '过强' | '身强' | '中和' | '身弱' | '过弱' | '极弱';
  /** 各五行得分 */
  wuxingScores: Record<Wuxing, number>;
  /** 喜用五行 */
  xiYong: Wuxing[];
  /** 忌讳五行 */
  jiHuan: Wuxing[];
}

/** 十神分析 */
export interface GodsAnalysis {
  /** 比肩 */
  biJian: number;
  /** 劫财 */
  jieCai: number;
  /** 食神 */
  shiShen: number;
  /** 伤官 */
  shangGuan: number;
  /** 偏财 */
  pianCai: number;
  /** 正财 */
  zhengCai: number;
  /** 偏官 */
  pianGuan: number;
  /** 正官 */
  zhengGuan: number;
  /** 偏印 */
  pianYin: number;
  /** 正印 */
  zhengYin: number;
  /** 十神列表 */
  list: Array<{ name: string; stem: HeavenlyStem; type: string }>;
}

/* ==========================================================================
   核心计算类
   ========================================================================== */

export class EightCharactersCore {
  /**
   * 根据日期计算八字
   */
  static calculate(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number = 0,
    isLunar: boolean = false
  ): EightCharacters {
    if (isLunar) {
      return this.calculateFromLunar(year, month, day, hour, minute);
    }
    return this.calculateFromSolar(year, month, day, hour, minute);
  }

  /**
   * 从公历计算八字
   */
  static calculateFromSolar(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number
  ): EightCharacters {
    // 转换为儒略日
    const jd = this.toJulianDay(year, month, day, hour, minute);
    
    // 计算年柱 (以立春为界)
    const yearStemBranch = this.getYearStemBranch(jd);
    
    // 计算月柱 (以节令为界)
    const monthStemBranch = this.getMonthStemBranch(yearStemBranch.stem, jd);
    
    // 计算日柱
    const dayStemBranch = this.getDayStemBranch(jd);
    
    // 计算时柱
    const hourStemBranch = this.getHourStemBranch(dayStemBranch.stem, hour, minute);
    
    return {
      year: yearStemBranch,
      month: monthStemBranch,
      day: dayStemBranch,
      hour: hourStemBranch,
    };
  }

  /**
   * 从农历计算八字
   */
  static calculateFromLunar(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number
  ): EightCharacters {
    // 农历转公历
    const solar = this.lunarToSolar(year, month, day);
    return this.calculateFromSolar(solar.year, solar.month, solar.day, hour, minute);
  }

  /**
   * 获取年柱
   */
  static getYearStemBranch(jd: number): { stem: HeavenlyStem; branch: EarthlyBranch } {
    // 年干: (年份 - 4) % 10
    const year = this.jdToYear(jd);
    const stemIndex = ((year - 4) % 10 + 10) % 10;
    const stem = HEAVENLY_STEMS[stemIndex];
    
    // 年支: (年份 - 4) % 12
    const branchIndex = ((year - 4) % 12 + 12) % 12;
    const branch = EARTHLY_BRANCHES[branchIndex];
    
    return { stem, branch };
  }

  /**
   * 获取月柱
   */
  static getMonthStemBranch(
    yearStem: HeavenlyStem,
    jd: number
  ): { stem: HeavenlyStem; branch: EarthlyBranch } {
    // 月干口诀: 甲己之年丙作首, 乙庚之年戊为头, 丙辛必定寻庚起, 丁壬壬位顺行流, 戊癸之年何方发, 甲寅之上好追求
    
    const monthBranch = this.getCurrentMonthBranch(jd);
    const branchIndex = EARTHLY_BRANCHES.indexOf(monthBranch);
    
    // 月干 = (年干index * 2 + 月支index) % 10
    const yearStemIndex = HEAVENLY_STEMS.indexOf(yearStem);
    const stemIndex = ((yearStemIndex * 2 + branchIndex) % 10 + 10) % 10;
    const stem = HEAVENLY_STEMS[stemIndex];
    
    return { stem, branch: monthBranch };
  }

  /**
   * 获取日柱
   */
  static getDayStemBranch(jd: number): { stem: HeavenlyStem; branch: EarthlyBranch } {
    // 日干支计算基于甲子日起
    const dayCount = Math.floor(jd) - 2440587.5; // 距离 1970-01-01 的天数
    const stemIndex = ((Math.floor(dayCount) + 4) % 10 + 10) % 10;
    const branchIndex = ((Math.floor(dayCount) + 2) % 12 + 12) % 12;
    
    return {
      stem: HEAVENLY_STEMS[stemIndex],
      branch: EARTHLY_BRANCHES[branchIndex],
    };
  }

  /**
   * 获取时柱
   */
  static getHourStemBranch(
    dayStem: HeavenlyStem,
    hour: number,
    minute: number
  ): { stem: HeavenlyStem; branch: EarthlyBranch } {
    // 时支: 23:00-1:00子时, 1:00-3:00丑时, ...
    const hourIndex = Math.floor((hour + 1) / 2) % 12;
    const branch = EARTHLY_BRANCHES[hourIndex];
    
    // 时干: 日干 * 2 + 时支index
    const dayStemIndex = HEAVENLY_STEMS.indexOf(dayStem);
    const stemIndex = ((dayStemIndex * 2 + hourIndex) % 10 + 10) % 10;
    const stem = HEAVENLY_STEMS[stemIndex];
    
    return { stem, branch };
  }

  /**
   * 获取当前月建 (地支)
   */
  static getCurrentMonthBranch(jd: number): EarthlyBranch {
    // 节令计算 (简化版)
    const date = this.jdToDate(jd);
    const month = date.month;
    const day = date.day;
    
    // 粗略节令日期
    const solarTerms: Record<number, number> = {
      1: 5,   // 小寒
      2: 4,   // 立春
      3: 5,   // 惊蛰
      4: 5,   // 清明
      5: 5,   // 立夏
      6: 5,   // 芒种
      7: 6,   // 小暑
      8: 7,   // 立秋
      9: 7,   // 白露
      10: 7,  // 寒露
      11: 6,  // 立冬
      12: 7,  // 大雪
    };
    
    // 节令后的月份调整
    const termDay = solarTerms[month] || 5;
    const adjustedMonth = day >= termDay && month < 12 ? month : month - 1;
    const branchIndex = ((adjustedMonth + 1) % 12 + 12) % 12;
    
    return EARTHLY_BRANCHES[branchIndex];
  }

  /**
   * 计算八字分析
   */
  static analyze(eightChars: EightCharacters): EightCharactersAnalysis {
    // 获取日干五行
    const dayStemWuxing = STEM_WUXING[eightChars.day.stem] as Wuxing;
    
    // 五行分布统计
    const wuxingDistribution = this.calculateWuxingDistribution(eightChars);
    
    // 强弱分析
    const strengthAnalysis = this.analyzeStrength(eightChars, dayStemWuxing);
    
    // 十神分析
    const godsAnalysis = this.analyzeGods(eightChars, dayStemWuxing);
    
    // 大运计算 (简化)
    const daYun = this.calculateDaYun(eightChars);
    
    // 流年计算
    const liuNian = this.calculateLiuNian(eightChars);
    
    // V5修复：添加缺失的 dayStem 属性
    const dayStem = eightChars.day.stem;
    
    return {
      eightChars,
      dayStemWuxing,
      dayStem,
      dayStemName: dayStem,
      wuxingDistribution,
      strengthAnalysis,
      godsAnalysis,
      daYun,
      liuNian,
    };
  }

  /**
   * 计算五行分布 - V5修复：使用正确的类型名 EightCharacters
   */
  static calculateWuxingDistribution(eightChars: EightCharacters): Record<Wuxing, number> {
    const distribution: Record<Wuxing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    
    const processStems = (stems: Array<HeavenlyStem | EarthlyBranch>) => {
      for (const s of stems) {
        const wx = STEM_WUXING[s] || BRANCH_WUXING[s];
        if (wx) distribution[wx as Wuxing]++;
        
        // 地支藏干也计算
        if (BRANCH_HIDDEN_STEMS[s]) {
          for (const hs of BRANCH_HIDDEN_STEMS[s]) {
            const hiddenWx = STEM_WUXING[hs];
            if (hiddenWx) distribution[hiddenWx as Wuxing] += 0.5;
          }
        }
      }
    };
    
    processStems([
      eightChars.year.stem, eightChars.year.branch,
      eightChars.month.stem, eightChars.month.branch,
      eightChars.day.stem, eightChars.day.branch,
      eightChars.hour.stem, eightChars.hour.branch,
    ]);
    
    return distribution;
  }

  /**
   * 分析强弱
   */
  static analyzeStrength(
    eightChars: EightCharacters,
    dayStemWuxing: Wuxing
  ): StrengthAnalysis {
    const distribution = this.calculateWuxingDistribution(eightChars);
    
    // 计算日干在地支的旺衰
    const dayStemBranches = DAY_STEM_STRONG_TYPES[eightChars.day.stem];
    let selfStrength = 0;
    
    for (const branch of [eightChars.year.branch, eightChars.month.branch, 
                          eightChars.day.branch, eightChars.hour.branch]) {
      const strength = WUXING_STRENGTH[dayStemWuxing][branch];
      switch (strength) {
        case '旺': selfStrength += 20; break;
        case '相': selfStrength += 15; break;
        case '休': selfStrength += 5; break;
        case '囚': selfStrength -= 5; break;
        case '死': selfStrength -= 15; break;
      }
    }
    
    // 加上自带的比劫数
    const dayStemIndex = HEAVENLY_STEMS.indexOf(eightChars.day.stem);
    const selfStems = [eightChars.year.stem, eightChars.month.stem, eightChars.hour.stem];
    selfStems.forEach(s => {
      if (HEAVENLY_STEMS.indexOf(s) % 2 === dayStemIndex % 2) {
        selfStrength += 5; // 比肩或劫财
      }
    });
    
    // 综合评分
    const score = Math.max(-100, Math.min(100, selfStrength));
    
    // 判断旺衰
    let verdict: StrengthAnalysis['verdict'];
    if (score >= 60) verdict = '极强';
    else if (score >= 30) verdict = '过强';
    else if (score >= 10) verdict = '身强';
    else if (score >= -10) verdict = '中和';
    else if (score >= -30) verdict = '身弱';
    else if (score >= -60) verdict = '过弱';
    else verdict = '极弱';
    
    // 计算各五行得分
    const wuxingScores: Record<Wuxing, number> = {
      木: distribution['木'] * 10,
      火: distribution['火'] * 10,
      土: distribution['土'] * 10,
      金: distribution['金'] * 10,
      水: distribution['水'] * 10,
    };
    
    // 确定喜忌
    const xiYong: Wuxing[] = [];
    const jiHuan: Wuxing[] = [];
    
    const wuxingOrder: Wuxing[] = ['木', '火', '土', '金', '水'];
    const dayIndex = wuxingOrder.indexOf(dayStemWuxing);
    
    if (score > 10) {
      // 身强: 喜克泄
      xiYong.push(WUXING_RELATIONS.overcome[dayStemWuxing]); // 克的五行
      xiYong.push(WUXING_RELATIONS.generate[dayStemWuxing]); // 生的五行
      jiHuan.push(dayStemWuxing); // 忌本身
      jiHuan.push(WUXING_RELATIONS.generate[WUXING_RELATIONS.overcome[dayStemWuxing]]); // 忌生我的
    } else {
      // 身弱: 喜生扶
      xiYong.push(dayStemWuxing); // 喜本气
      xiYong.push(WUXING_RELATIONS.generate[dayStemWuxing]); // 喜生我的
      jiHuan.push(WUXING_RELATIONS.overcome[dayStemWuxing]); // 忌克的
      jiHuan.push(WUXING_RELATIONS.overcome[WUXING_RELATIONS.generate[dayStemWuxing]]); // 忌生克的
    }
    
    return { score, verdict, wuxingScores, xiYong, jiHuan };
  }

  /**
   * 分析十神
   */
  static analyzeGods(eightChars: EightCharacters, dayStemWuxing: Wuxing): GodsAnalysis {
    const dayStem = eightChars.day.stem;
    const dayStemIndex = HEAVENLY_STEMS.indexOf(dayStem);
    const dayWuxing = dayStemWuxing;
    
    const result: GodsAnalysis = {
      biJian: 0, jieCai: 0, shiShen: 0, shangGuan: 0,
      pianCai: 0, zhengCai: 0, pianGuan: 0, zhengGuan: 0,
      pianYin: 0, zhengYin: 0, list: [],
    };
    
    const analyzeStem = (stem: HeavenlyStem, position: string) => {
      const stemWuxing = STEM_WUXING[stem];
      const stemIndex = HEAVENLY_STEMS.indexOf(stem);
      
      let godName: string;
      let godKey: keyof GodsAnalysis;
      
      // 判断是阳还是阴
      const isYang = stemIndex % 2 === 0;
      const dayIsYang = dayStemIndex % 2 === 0;
      
      if (stemWuxing === dayWuxing) {
        // 同我者: 比肩/劫财
        if (isYang === dayIsYang) {
          godName = '比肩';
          godKey = 'biJian';
        } else {
          godName = '劫财';
          godKey = 'jieCai';
        }
      } else if (WUXING_RELATIONS.generate[dayWuxing] === stemWuxing) {
        // 我生者: 食神/伤官
        if (isYang === dayIsYang) {
          godName = '食神';
          godKey = 'shiShen';
        } else {
          godName = '伤官';
          godKey = 'shangGuan';
        }
      } else if (WUXING_RELATIONS.overcome[dayWuxing] === stemWuxing) {
        // 我克者: 偏财/正财
        if (isYang === dayIsYang) {
          godName = '偏财';
          godKey = 'pianCai';
        } else {
          godName = '正财';
          godKey = 'zhengCai';
        }
      } else if (WUXING_RELATIONS.overcome[stemWuxing] === dayWuxing) {
        // 克我者: 偏官/正官
        if (isYang === dayIsYang) {
          godName = '偏官';
          godKey = 'pianGuan';
        } else {
          godName = '正官';
          godKey = 'zhengGuan';
        }
      } else {
        // 生我者: 偏印/正印
        if (isYang === dayIsYang) {
          godName = '偏印';
          godKey = 'pianYin';
        } else {
          godName = '正印';
          godKey = 'zhengYin';
        }
      }
      
      (result[godKey] as number)++;
      result.list.push({ name: godName, stem, type: position });
    };
    
    analyzeStem(eightChars.year.stem, '年干');
    analyzeStem(eightChars.month.stem, '月干');
    analyzeStem(eightChars.hour.stem, '时干');
    
    // 日支藏干
    const hiddenStems = BRANCH_HIDDEN_STEMS[eightChars.day.branch];
    if (hiddenStems && hiddenStems.length > 0) {
      // 本气
      analyzeStem(hiddenStems[0] as HeavenlyStem, '日支本气');
    }
    
    return result;
  }

  /**
   * 计算大运
   */
  static calculateDaYun(eightChars: EightCharacters): Array<{ year: number; stem: HeavenlyStem; branch: EarthlyBranch }> {
    const result: Array<{ year: number; stem: HeavenlyStem; branch: EarthlyBranch }> = [];
    const monthBranch = eightChars.month.branch;
    const monthBranchIndex = EARTHLY_BRANCHES.indexOf(monthBranch);
    const yearStemIndex = HEAVENLY_STEMS.indexOf(eightChars.year.stem);
    
    // 大运从月柱开始, 阳男阴女顺行, 阴男阳女逆行
    const isYangYear = yearStemIndex % 2 === 0;
    const direction = isYangYear ? 1 : -1;
    
    for (let i = 0; i < 10; i++) {
      const branchIndex = ((monthBranchIndex + direction * (i + 1)) % 12 + 12) % 12;
      const stemIndex = ((monthBranchIndex + direction * (i + 1) + 2) % 10 + 10) % 10;
      
      result.push({
        year: 0, // 待设置
        stem: HEAVENLY_STEMS[stemIndex],
        branch: EARTHLY_BRANCHES[branchIndex],
      });
    }
    
    return result;
  }

  /**
   * 计算流年
   */
  static calculateLiuNian(eightChars: EightCharacters): Array<{ year: number; stem: HeavenlyStem; branch: EarthlyBranch }> {
    const result: Array<{ year: number; stem: HeavenlyStem; branch: EarthlyBranch }> = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < 10; i++) {
      const year = currentYear + i;
      const jd = this.toJulianDay(year, 1, 1, 12, 0);
      const ys = this.getYearStemBranch(jd);
      result.push({
        year,
        stem: ys.stem,
        branch: ys.branch,
      });
    }
    
    return result;
  }

  /* ==========================================================================
     工具方法
     ========================================================================== */
  
  static toJulianDay(year: number, month: number, day: number, hour: number, minute: number): number {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    return jdn + (hour - 12) / 24 + minute / 1440;
  }
  
  static jdToYear(jd: number): number {
    const z = Math.floor(jd + 0.5);
    const a = Math.floor((z - 1867216.25) / 36524.25);
    const b = z + 1 + a - Math.floor(a / 4);
    const c = b + 1524;
    const d = Math.floor((c - 122.1) / 365.25);
    const e = Math.floor(365.25 * d);
    const g = Math.floor((c - e) / 30.6001);
    const day = c - e - Math.floor(30.6001 * g);
    const month = g - 1 - 12 * Math.floor(g / 14);
    const year = d - 4715 - Math.floor((7 + month) / 10);
    return year;
  }
  
  static jdToDate(jd: number): { year: number; month: number; day: number } {
    const year = this.jdToYear(jd);
    const z = Math.floor(jd + 0.5);
    const a = Math.floor((z - 1867216.25) / 36524.25);
    const b = z + 1 + a - Math.floor(a / 4);
    const c = b + 1524;
    const d = Math.floor((c - 122.1) / 365.25);
    const e = Math.floor(365.25 * d);
    const g = Math.floor((c - e) / 30.6001);
    const day = c - e - Math.floor(30.6001 * g);
    const month = g - 1 - 12 * Math.floor(g / 14);
    return { year, month, day };
  }
  
  static lunarToSolar(year: number, month: number, day: number): { year: number; month: number; day: number } {
    // 简化版: 假设农历比公历晚约1个月
    // 实际需要查表或复杂计算
    const offset = 30;
    let solarDay = day + offset;
    let solarMonth = month - 1;
    let solarYear = year;
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    if (solarDay > daysInMonth[solarMonth - 1]) {
      solarDay -= daysInMonth[solarMonth - 1];
      solarMonth++;
      if (solarMonth > 12) {
        solarMonth = 1;
        solarYear++;
      }
    }
    
    return { year: solarYear, month: solarMonth, day: solarDay };
  }
}

/* ==========================================================================
   简单封装
   ========================================================================== */

export class EightCharactersCalculator {
  static calculate(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute?: number,
    isLunar?: boolean
  ): EightCharacters {
    return EightCharactersCore.calculate(year, month, day, hour, minute ?? 0, isLunar);
  }
  
  static analyze(eightChars: EightCharacters): EightCharactersAnalysis {
    return EightCharactersCore.analyze(eightChars);
  }
}
