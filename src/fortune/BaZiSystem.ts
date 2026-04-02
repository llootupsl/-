/**
 * =============================================================================
 * 永夜熵纪 - 八字命理系统
 * Chinese Fortune-Telling with BaZi Astrology
 * 实现公历农历转换、五行十神、大运流年推算
 * =============================================================================
 */

import { wasmBazi } from '@/wasm/WasmBridge';

/** 天干 */
export enum HeavenlyStem {
  Jia = 0,  // 甲
  Yi = 1,   // 乙
  Bing = 2, // 丙
  Ding = 3, // 丁
  Wu = 4,   // 戊
  Ji = 5,   // 己
  Geng = 6, // 庚
  Xin = 7,  // 辛
  Ren = 8,  // 壬
  Gui = 9,  // 癸
}

/** 地支 */
export enum EarthlyBranch {
  Zi = 0,    // 子
  Chou = 1,  // 丑
  Yin = 2,   // 寅
  Mao = 3,   // 卯
  Chen = 4,  // 辰
  Si = 5,    // 巳
  Wu = 6,    // 午
  Wei = 7,   // 未
  Shen = 8,  // 申
  You = 9,   // 酉
  Xu = 10,   // 戌
  Hai = 11,  // 亥
}

/** 五行 */
export enum FiveElements {
  Wood = '木',
  Fire = '火',
  Earth = '土',
  Metal = '金',
  Water = '水',
}

/** 十神 */
export enum TenGods {
  /** 比肩 */
  Bijia = '比肩',
  /** 劫财 */
  Jiecai = '劫财',
  /** 食神 */
  Shishen = '食神',
  /** 伤官 */
  Shangquan = '伤官',
  /** 偏财 */
  Piancai = '偏财',
  /** 正财 */
  Zhengcai = '正财',
  /** 七杀 */
  Qisha = '七杀',
  /** 正官 */
  Zhengguan = '正官',
  /** 偏印 */
  Pianyin = '偏印',
  /** 正印 */
  Zhengyin = '正印',
}

/** 命盘八字 */
export interface BaZiChart {
  /** 年柱 */
  yearPillar: Pillar;
  /** 月柱 */
  monthPillar: Pillar;
  /** 日柱 */
  dayPillar: Pillar;
  /** 时柱 */
  hourPillar: Pillar;
  /** 命主天干（日干） */
  dayMaster: HeavenlyStem;
  /** 五行旺衰 */
  elementStrength: Record<FiveElements, number>;
  /** 格局 */
  pattern: string;
  /** 用神 */
  usefulGods: TenGods[];
  /** 忌神 */
  harmfulGods: TenGods[];
}

/** 柱（八字中的柱） */
export interface Pillar {
  /** 天干 */
  stem: HeavenlyStem;
  /** 地支 */
  branch: EarthlyBranch;
  /** 天干五行 */
  stemElement: FiveElements;
  /** 地支五行 */
  branchElement: FiveElements;
  /** 藏干 */
  hiddenStems: HiddenStem[];
  /** 十神 */
  tenGods: TenGods[];
}

/** 藏干 */
export interface HiddenStem {
  stem: HeavenlyStem;
  element: FiveElements;
  strength: number;
}

/** 大运 */
export interface DaYun {
  /** 起始年龄 */
  startAge: number;
  /** 结束年龄 */
  endAge: number;
  /** 天干 */
  stem: HeavenlyStem;
  /** 地支 */
  branch: EarthlyBranch;
  /** 五行 */
  element: FiveElements;
  /** 运势描述 */
  description: string;
  /** 吉凶指数 (-10 to 10) */
  fortuneIndex: number;
}

/** 流年 */
export interface LiuNian {
  /** 年份 */
  year: number;
  /** 干支 */
  stem: HeavenlyStem;
  /** 地支 */
  branch: EarthlyBranch;
  /** 五行 */
  element: FiveElements;
  /** 与命局的生克关系 */
  relations: string[];
  /** 年运描述 */
  description: string;
  /** 吉凶指数 */
  fortuneIndex: number;
  /** 注意事项 */
  warnings: string[];
}

/** 命理分析结果 */
export interface FortuneAnalysis {
  /** 八字命盘 */
  chart: BaZiChart;
  /** 大运 */
  daYun: DaYun[];
  /** 当前大运 */
  currentDaYun: DaYun;
  /** 流年 */
  liuNian: LiuNian[];
  /** 当前流年 */
  currentLiuNian: LiuNian;
  /** 性格特点 */
  personality: string[];
  /** 事业运势 */
  career: string;
  /** 感情运势 */
  love: string;
  /** 健康运势 */
  health: string;
  /** 财运 */
  wealth: string;
}

/** 农历信息 */
export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  zodiac: string;
}

/** 农历转换器类 */
export class LunarCalendar {
  private static readonly LUNAR_MONTH_DAYS = [
    30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, // 正常年
  ];

  private static readonly LUNAR_LEAP_MONTHS: Record<number, number> = {
    1900: 3, 1903: 1, 1906: 5, 1909: 2, 1912: 6,
    1915: 5, 1917: 2, 1919: 7, 1922: 1, 1924: 6,
    1926: 5, 1928: 2, 1930: 7, 1933: 3, 1935: 8,
    1936: 2, 1938: 6, 1940: 1, 1942: 7, 1944: 5,
    1947: 2, 1949: 5, 1950: 8, 1952: 4, 1955: 2,
    1957: 7, 1959: 5, 1960: 6, 1961: 4, 1963: 2,
    1964: 7, 1966: 5, 1968: 2, 1970: 6, 1972: 4,
    1973: 8, 1975: 5, 1977: 4, 1979: 7, 1981: 6,
    1983: 2, 1984: 7, 1986: 5, 1987: 6, 1989: 2,
    1990: 7, 1992: 5, 1993: 8, 1995: 2, 1996: 6,
    1998: 5, 2000: 4, 2001: 7, 2002: 6, 2004: 2,
    2005: 7, 2006: 5, 2007: 4, 2008: 2, 2009: 7,
    2010: 5, 2011: 6, 2012: 4, 2013: 8, 2014: 9,
    2015: 6, 2016: 6, 2017: 2, 2018: 7, 2019: 5,
    2020: 4, 2021: 2, 2022: 2, 2023: 2, 2024: 2,
  };

  private static readonly ZODIACS = [
    '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'
  ];

  /**
   * 公历转农历
   */
  public static solarToLunar(year: number, month: number, day: number): LunarDate {
    // 简化算法（实际需要更复杂的天文计算）
    const baseYear = 1900;
    const baseDate = new Date(1900, 0, 31);
    const targetDate = new Date(year, month - 1, day);
    const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));

    let lunarYear = baseYear;
    let lunarMonth = 1;
    let lunarDay = 1;
    let isLeapMonth = false;

    // 计算年份
    let days = diffDays;
    for (let y = baseYear; y <= year + 1; y++) {
      const yearDays = this.getLunarYearDays(y);
      if (days < yearDays) {
        lunarYear = y;
        break;
      }
      days -= yearDays;
    }

    // 计算月份
    const leapMonth = this.LUNAR_LEAP_MONTHS[lunarYear] ?? 0;
    for (let m = 1; m <= 12; m++) {
      const monthDays = this.getLunarMonthDays(lunarYear, m);
      if (days < monthDays) {
        lunarMonth = m;
        break;
      }
      days -= monthDays;

      // 检查闰月
      if (m === leapMonth && days >= this.getLunarMonthDays(lunarYear, m)) {
        days -= this.getLunarMonthDays(lunarYear, m);
        if (days < this.getLunarMonthDays(lunarYear, m + 1)) {
          lunarMonth = m;
          isLeapMonth = true;
          break;
        }
        days -= this.getLunarMonthDays(lunarYear, m + 1);
      }
    }

    lunarDay = days + 1;

    return {
      year: lunarYear,
      month: isLeapMonth ? lunarMonth : lunarMonth,
      day: lunarDay,
      isLeapMonth,
      zodiac: this.ZODIACS[(lunarYear - 4) % 12],
    };
  }

  /**
   * 农历转公历
   */
  public static lunarToSolar(year: number, month: number, day: number, isLeapMonth: boolean = false): Date {
    // 简化算法
    let days = 0;
    for (let y = 1900; y < year; y++) {
      days += this.getLunarYearDays(y);
    }

    const leapMonth = this.LUNAR_LEAP_MONTHS[year] ?? 0;
    for (let m = 1; m < month; m++) {
      days += this.getLunarMonthDays(year, m);
      if (m === leapMonth) {
        days += this.getLunarMonthDays(year, m + 1);
      }
    }

    if (isLeapMonth && month === leapMonth) {
      days += this.getLunarMonthDays(year, month);
    }

    days += day - 1;
    const baseDate = new Date(1900, 0, 31);
    return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * 获取农历年天数
   */
  private static getLunarYearDays(year: number): number {
    let days = 0;
    const leapMonth = this.LUNAR_LEAP_MONTHS[year] ?? 0;
    for (let m = 1; m <= 12; m++) {
      days += this.getLunarMonthDays(year, m);
      if (m === leapMonth) {
        days += this.getLunarMonthDays(year, m);
      }
    }
    return days;
  }

  /**
   * 获取农历月天数
   */
  private static getLunarMonthDays(year: number, month: number): number {
    if (month < 1 || month > 12) return 30;
    const isLeapYear = this.isLunarLeapYear(year);
    const baseDays = month % 2 === 1 ? 30 : 29;
    if (month === 12) return isLeapYear ? 30 : 29;
    return baseDays;
  }

  /**
   * 判断是否是闰年
   */
  private static isLunarLeapYear(year: number): boolean {
    return (this.LUNAR_LEAP_MONTHS[year] ?? 0) > 0;
  }
}

/** 八字命理引擎 */
export class BaZiEngine {
  private static readonly HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  private static readonly EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  private static readonly ELEMENTS = ['木', '火', '土', '金', '水'];
  
  private static readonly STEM_ELEMENTS: FiveElements[] = [
    FiveElements.Wood, FiveElements.Wood,
    FiveElements.Fire, FiveElements.Fire,
    FiveElements.Earth, FiveElements.Earth,
    FiveElements.Metal, FiveElements.Metal,
    FiveElements.Water, FiveElements.Water,
  ];

  private static readonly BRANCH_ELEMENTS: FiveElements[] = [
    FiveElements.Water,    // 子
    FiveElements.Earth,     // 丑
    FiveElements.Wood,       // 寅
    FiveElements.Wood,       // 卯
    FiveElements.Earth,      // 辰
    FiveElements.Fire,       // 巳
    FiveElements.Fire,       // 午
    FiveElements.Earth,      // 未
    FiveElements.Metal,      // 申
    FiveElements.Metal,      // 酉
    FiveElements.Earth,      // 戌
    FiveElements.Water,      // 亥
  ];

  private static readonly HIDDEN_STEMS: Record<number, Array<{ stem: number; strength: number }>> = {
    0: [{ stem: 8, strength: 100 }],  // 子: 癸
    1: [{ stem: 5, strength: 60 }, { stem: 8, strength: 30 }, { stem: 7, strength: 10 }],  // 丑
    2: [{ stem: 6, strength: 60 }, { stem: 0, strength: 30 }, { stem: 8, strength: 10 }],  // 寅
    3: [{ stem: 0, strength: 100 }],  // 卯: 甲
    4: [{ stem: 4, strength: 60 }, { stem: 0, strength: 30 }, { stem: 8, strength: 10 }],  // 辰
    5: [{ stem: 2, strength: 60 }, { stem: 6, strength: 30 }, { stem: 8, strength: 10 }],  // 巳
    6: [{ stem: 3, strength: 60 }, { stem: 6, strength: 30 }, { stem: 7, strength: 10 }],  // 午
    7: [{ stem: 5, strength: 60 }, { stem: 3, strength: 30 }, { stem: 7, strength: 10 }],  // 未
    8: [{ stem: 6, strength: 50 }, { stem: 4, strength: 30 }, { stem: 2, strength: 20 }],  // 申
    9: [{ stem: 7, strength: 100 }],  // 酉: 辛
    10: [{ stem: 4, strength: 50 }, { stem: 7, strength: 30 }, { stem: 5, strength: 20 }], // 戌
    11: [{ stem: 8, strength: 60 }, { stem: 9, strength: 30 }, { stem: 5, strength: 10 }], // 亥
  };

  constructor() {}

  /**
   * 实例方法：计算八字（供 WasmBridge 调用）
   */
  public calculate(year: number, month: number, day: number, hour: number): {
    year: { stem: string; branch: string; element: string };
    month: { stem: string; branch: string; element: string };
    day: { stem: string; branch: string; element: string };
    hour: { stem: string; branch: string; element: string };
    elementStrength: string;
    dayMasterStrength: string;
  } {
    const chart = BaZiEngine.calculateBaZi(year, month, day, hour);
    
    const getElementName = (stem: number): string => {
      return BaZiEngine.ELEMENTS[Math.floor(stem / 2)];
    };

    return {
      year: {
        stem: BaZiEngine.HEAVENLY_STEMS[chart.yearPillar.stem],
        branch: BaZiEngine.EARTHLY_BRANCHES[chart.yearPillar.branch],
        element: chart.yearPillar.stemElement,
      },
      month: {
        stem: BaZiEngine.HEAVENLY_STEMS[chart.monthPillar.stem],
        branch: BaZiEngine.EARTHLY_BRANCHES[chart.monthPillar.branch],
        element: chart.monthPillar.stemElement,
      },
      day: {
        stem: BaZiEngine.HEAVENLY_STEMS[chart.dayPillar.stem],
        branch: BaZiEngine.EARTHLY_BRANCHES[chart.dayPillar.branch],
        element: chart.dayPillar.stemElement,
      },
      hour: {
        stem: BaZiEngine.HEAVENLY_STEMS[chart.hourPillar.stem],
        branch: BaZiEngine.EARTHLY_BRANCHES[chart.hourPillar.branch],
        element: chart.hourPillar.stemElement,
      },
      elementStrength: this.formatElementStrength(chart.elementStrength),
      dayMasterStrength: this.getDayMasterStrength(chart),
    };
  }

  private formatElementStrength(strength: Record<FiveElements, number>): string {
    const sorted = Object.entries(strength).sort((a, b) => b[1] - a[1]);
    return sorted.map(([e, s]) => `${e}:${(s * 100).toFixed(1)}%`).join(' ');
  }

  private getDayMasterStrength(chart: BaZiChart): string {
    const dayElement = BaZiEngine.STEM_ELEMENTS[chart.dayMaster];
    const strength = chart.elementStrength[dayElement];
    if (strength > 0.3) return '旺';
    if (strength > 0.2) return '相';
    if (strength > 0.15) return '休';
    if (strength > 0.1) return '囚';
    return '死';
  }

  /**
   * 计算八字
   */
  public static calculateBaZi(
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    birthHour: number
  ): BaZiChart {
    // 获取农历
    const lunar = LunarCalendar.solarToLunar(birthYear, birthMonth, birthDay);

    // 计算天干
    const yearStem = (birthYear - 4) % 10;
    const monthStem = ((birthYear % 10) * 2 + birthMonth) % 10;
    const dayStem = BaZiEngine.calculateDayStem(birthYear, birthMonth, birthDay);
    const hourStem = ((dayStem % 10) * 2 + birthHour) % 10;

    // 计算地支
    const yearBranch = (birthYear - 4) % 12;
    const monthBranch = (birthMonth + 2) % 12;
    const hourBranch = (birthHour / 2 + 2) % 12;

    // 构建四柱
    const yearPillar = BaZiEngine.createPillar(yearStem, yearBranch);
    const monthPillar = BaZiEngine.createPillar(monthStem, monthBranch);
    const dayPillar = BaZiEngine.createPillar(dayStem, hourBranch);
    const hourPillar = BaZiEngine.createPillar(hourStem, hourBranch);

    // 计算五行旺衰
    const elementStrength = BaZiEngine.calculateElementStrength(yearPillar, monthPillar, dayPillar, hourPillar);

    // 确定格局
    const pattern = BaZiEngine.determinePattern(monthPillar, dayStem);

    // 确定用神忌神
    const { usefulGods, harmfulGods } = BaZiEngine.determineUsefulGods(elementStrength, dayStem);

    return {
      yearPillar,
      monthPillar,
      dayPillar,
      hourPillar,
      dayMaster: dayStem,
      elementStrength,
      pattern,
      usefulGods,
      harmfulGods,
    };
  }

  /**
   * 计算日干
   */
  private static calculateDayStem(year: number, month: number, day: number): number {
    // 基数
    const c = Math.floor(year / 100);
    const y = year % 100;
    const g = (c * 5 + Math.floor(c / 4) + 3 * y + Math.floor(y / 4) + Math.floor((3 * (month + 1)) / 5) + day) % 10;
    return g;
  }

  /**
   * 创建柱
   */
  private static createPillar(stem: number, branch: number): Pillar {
    const stemElement = BaZiEngine.STEM_ELEMENTS[stem];
    const branchElement = BaZiEngine.BRANCH_ELEMENTS[branch];
    const hidden = BaZiEngine.HIDDEN_STEMS[branch] || [];

    return {
      stem: stem,
      branch: branch,
      stemElement,
      branchElement,
      hiddenStems: hidden.map(h => ({
        stem: h.stem,
        element: BaZiEngine.STEM_ELEMENTS[h.stem],
        strength: h.strength,
      })),
      tenGods: BaZiEngine.calculateTenGods(stem, branch),
    };
  }

  /**
   * 计算十神
   */
  private static calculateTenGods(stem: number, branch: number): TenGods[] {
    // 十神关系：生我者为印绶，我生者为食伤，克我者为官杀，我克者为财，比和者为比劫
    // 日干为基准
    const dayStem = stem; // 这里需要传入日干
    
    // 简化：返回基于地支藏干的十神
    const hidden = BaZiEngine.HIDDEN_STEMS[branch] || [];
    return hidden.map(h => BaZiEngine.getTenGod(h.stem, dayStem));
  }

  /**
   * 获取十神
   */
  private static getTenGod(otherStem: number, dayStem: number): TenGods {
    const diff = (otherStem - dayStem + 10) % 10;
    
    // 阴阳相同为七杀/正官/偏财/正财/食神/伤官/比肩/劫财/偏印/正印
    const sameYinYang = Math.floor(diff / 5) !== Math.floor(diff % 5 / 5);
    
    switch (diff) {
      case 0: return TenGods.Bijia;        // 比肩
      case 1: return TenGods.Jiecai;       // 劫财
      case 2: return TenGods.Shishen;      // 食神
      case 3: return TenGods.Shangquan;    // 伤官
      case 4: return TenGods.Piancai;      // 偏财
      case 5: return TenGods.Zhengcai;     // 正财
      case 6: return TenGods.Qisha;        // 七杀
      case 7: return TenGods.Zhengguan;    // 正官
      case 8: return TenGods.Pianyin;      // 偏印
      case 9: return TenGods.Zhengyin;     // 正印
      default: return TenGods.Bijia;
    }
  }

  /**
   * 计算五行旺衰
   */
  private static calculateElementStrength(
    year: Pillar, month: Pillar, day: Pillar, hour: Pillar
  ): Record<FiveElements, number> {
    const strength: Record<FiveElements, number> = {
      [FiveElements.Wood]: 0,
      [FiveElements.Fire]: 0,
      [FiveElements.Earth]: 0,
      [FiveElements.Metal]: 0,
      [FiveElements.Water]: 0,
    };

    // 统计天干
    [year, month, day, hour].forEach(p => {
      strength[p.stemElement] += 1;
    });

    // 统计地支藏干
    [year, month, day, hour].forEach(p => {
      p.hiddenStems.forEach(h => {
        strength[h.element] += h.strength / 100;
      });
    });

    // 归一化
    const total = Object.values(strength).reduce((a, b) => a + b, 0);
    for (const key in strength) {
      strength[key as FiveElements] = strength[key as FiveElements] / total;
    }

    return strength;
  }

  /**
   * 确定格局
   */
  private static determinePattern(month: Pillar, dayStem: number): string {
    // 月令（月支本气）决定旺衰，旺者取克泄为用
    const monthElement = month.branchElement;
    
    // 简化格局判断
    if (monthElement === FiveElements.Wood) return '木旺格';
    if (monthElement === FiveElements.Fire) return '火旺格';
    if (monthElement === FiveElements.Earth) return '土旺格';
    if (monthElement === FiveElements.Metal) return '金旺格';
    if (monthElement === FiveElements.Water) return '水旺格';
    
    return '普通格局';
  }

  /**
   * 确定用神忌神
   */
  private static determineUsefulGods(
    strength: Record<FiveElements, number>,
    dayStem: number
  ): { usefulGods: TenGods[]; harmfulGods: TenGods[] } {
    // 找出最弱和最强的五行
    let weakest = FiveElements.Water;
    let strongest = FiveElements.Wood;
    
    let minVal = Infinity, maxVal = 0;
    for (const [elem, val] of Object.entries(strength)) {
      if (val < minVal) { minVal = val; weakest = elem as FiveElements; }
      if (val > maxVal) { maxVal = val; strongest = elem as FiveElements; }
    }

    // 用神：补弱抑强
    const usefulGods: TenGods[] = [];
    const harmfulGods: TenGods[] = [];

    // 根据强弱关系确定用忌神
    if (strength[FiveElements.Water] < 0.2) usefulGods.push(TenGods.Zhengyin, TenGods.Pianyin);
    else if (strength[FiveElements.Water] > 0.3) harmfulGods.push(TenGods.Zhengyin, TenGods.Pianyin);

    if (strength[FiveElements.Fire] < 0.2) usefulGods.push(TenGods.Zhengcai, TenGods.Piancai);
    else if (strength[FiveElements.Fire] > 0.3) harmfulGods.push(TenGods.Zhengcai, TenGods.Piancai);

    return { usefulGods, harmfulGods };
  }

  /**
   * 计算大运
   */
  public static calculateDaYun(chart: BaZiChart, birthDate: Date): DaYun[] {
    const daYunList: DaYun[] = [];
    const currentYear = new Date().getFullYear();
    const birthYear = birthDate.getFullYear();

    // 大运起始年龄（简化计算）
    let startAge = 0;
    let startYear = birthYear;

    for (let i = 0; i < 10; i++) {
      const stem = (chart.monthPillar.stem + i + 1) % 10;
      const branch = (chart.monthPillar.branch + i + 1) % 12;

      const description = BaZiEngine.getDaYunDescription(stem, branch);
      const fortuneIndex = BaZiEngine.calculateFortuneIndex(chart, stem, branch);

      daYunList.push({
        startAge: startAge + i * 10,
        endAge: startAge + (i + 1) * 10 - 1,
        stem: stem,
        branch: branch,
        element: BaZiEngine.BRANCH_ELEMENTS[branch],
        description,
        fortuneIndex,
      });
    }

    return daYunList;
  }

  /**
   * 大运描述
   */
  private static getDaYunDescription(stem: number, branch: number): string {
    const stemName = BaZiEngine.HEAVENLY_STEMS[stem];
    const branchName = BaZiEngine.EARTHLY_BRANCHES[branch];
    const element = BaZiEngine.BRANCH_ELEMENTS[branch];

    return `${stemName}${branchName}（${element}）运`;
  }

  /**
   * 计算运势指数
   */
  private static calculateFortuneIndex(chart: BaZiChart, stem: number, branch: number): number {
    const element = BaZiEngine.BRANCH_ELEMENTS[branch];
    
    // 与命局的关系
    const dayElement = BaZiEngine.STEM_ELEMENTS[chart.dayMaster];
    
    // 生克关系计算
    let index = 0;
    if (element === dayElement) index += 3;
    
    // 用神被生扶
    if (chart.usefulGods.some(g => g.includes(element))) index += 2;
    
    // 忌神被克制
    if (chart.harmfulGods.some(g => g.includes(element))) index += 1;
    
    return Math.max(-10, Math.min(10, index - 5));
  }

  /**
   * 计算流年
   */
  public static calculateLiuNian(chart: BaZiChart, year: number): LiuNian[] {
    const liuNianList: LiuNian[] = [];
    const currentYear = new Date().getFullYear();

    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
      const stem = (y - 4) % 10;
      const branch = (y - 4) % 12;
      const element = BaZiEngine.BRANCH_ELEMENTS[branch];

      const relations = BaZiEngine.analyzeRelations(chart, stem, branch);
      const description = BaZiEngine.getLiuNianDescription(stem, branch, relations);
      const warnings = BaZiEngine.getWarnings(chart, stem, branch);
      const fortuneIndex = BaZiEngine.calculateFortuneIndex(chart, stem, branch);

      liuNianList.push({
        year: y,
        stem,
        branch,
        element,
        relations,
        description,
        fortuneIndex,
        warnings,
      });
    }

    return liuNianList;
  }

  /**
   * 分析流年与命局关系
   */
  private static analyzeRelations(chart: BaZiChart, stem: number, branch: number): string[] {
    const relations: string[] = [];
    const element = BaZiEngine.BRANCH_ELEMENTS[branch];

    // 生克冲合
    // ... 简化实现

    return relations;
  }

  /**
   * 流年描述
   */
  private static getLiuNianDescription(stem: number, branch: number, relations: string[]): string {
    const stemName = BaZiEngine.HEAVENLY_STEMS[stem];
    const branchName = BaZiEngine.EARTHLY_BRANCHES[branch];
    return `${stemName}${branchName}年`;
  }

  /**
   * 注意事项
   */
  private static getWarnings(chart: BaZiChart, stem: number, branch: number): string[] {
    const warnings: string[] = [];
    // ... 根据命盘特征生成警告
    return warnings;
  }

  /**
   * 完整命理分析
   */
  public static analyzeFortune(
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    birthHour: number
  ): FortuneAnalysis {
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    const chart = BaZiEngine.calculateBaZi(birthYear, birthMonth, birthDay, birthHour);
    const daYun = BaZiEngine.calculateDaYun(chart, birthDate);
    const liuNian = BaZiEngine.calculateLiuNian(chart, new Date().getFullYear());

    // 当前大运
    const currentAge = new Date().getFullYear() - birthYear;
    const currentDaYun = daYun.find(d => currentAge >= d.startAge && currentAge <= d.endAge) || daYun[0];

    // 当前流年
    const currentYear = new Date().getFullYear();
    const currentLiuNian = liuNian.find(l => l.year === currentYear) || liuNian[5];

    return {
      chart,
      daYun,
      currentDaYun,
      liuNian,
      currentLiuNian,
      personality: BaZiEngine.analyzePersonality(chart),
      career: BaZiEngine.analyzeCareer(chart),
      love: BaZiEngine.analyzeLove(chart),
      health: BaZiEngine.analyzeHealth(chart),
      wealth: BaZiEngine.analyzeWealth(chart),
    };
  }

  /**
   * 性格分析
   */
  private static analyzePersonality(chart: BaZiChart): string[] {
    const traits: string[] = [];
    
    // 根据五行旺衰分析
    if (chart.elementStrength[FiveElements.Wood] > 0.25) {
      traits.push('具有较强的创造力和进取心');
    }
    if (chart.elementStrength[FiveElements.Fire] > 0.25) {
      traits.push('热情开朗，善于社交');
    }
    if (chart.elementStrength[FiveElements.Earth] > 0.25) {
      traits.push('稳重踏实，诚实守信');
    }
    if (chart.elementStrength[FiveElements.Metal] > 0.25) {
      traits.push('意志坚定，果断有力');
    }
    if (chart.elementStrength[FiveElements.Water] > 0.25) {
      traits.push('聪明灵活，善于变通');
    }

    return traits;
  }

  /**
   * 事业分析
   */
  private static analyzeCareer(chart: BaZiChart): string {
    return '事业运势平稳，适合稳定发展';
  }

  /**
   * 感情分析
   */
  private static analyzeLove(chart: BaZiChart): string {
    return '感情运势需要耐心经营';
  }

  /**
   * 健康分析
   */
  private static analyzeHealth(chart: BaZiChart): string {
    return '注意调理身体，保持身心健康';
  }

  /**
   * 财运分析
   */
  private static analyzeWealth(chart: BaZiChart): string {
    return '财运逐步上升，理性投资';
  }

  /**
   * 获取八字字符串
   */
  public static toString(chart: BaZiChart): string {
    const year = BaZiEngine.HEAVENLY_STEMS[chart.yearPillar.stem] + BaZiEngine.EARTHLY_BRANCHES[chart.yearPillar.branch];
    const month = BaZiEngine.HEAVENLY_STEMS[chart.monthPillar.stem] + BaZiEngine.EARTHLY_BRANCHES[chart.monthPillar.branch];
    const day = BaZiEngine.HEAVENLY_STEMS[chart.dayPillar.stem] + BaZiEngine.EARTHLY_BRANCHES[chart.dayPillar.branch];
    const hour = BaZiEngine.HEAVENLY_STEMS[chart.hourPillar.stem] + BaZiEngine.EARTHLY_BRANCHES[chart.hourPillar.branch];
    return `${year} ${month} ${day} ${hour}`;
  }
}

// 导出
export const baziEngine = BaZiEngine;
export const lunarCalendar = LunarCalendar;
export default { BaZiEngine, LunarCalendar };
