/**
 * =============================================================================
 * 八字命理计算引擎 - Eight Characters Destiny Calculator
 * 天干地支、五行、十神、旺衰分析
 * =============================================================================
 */

export enum HeavenlyStem {
  甲 = 0, 乙 = 1, 丙 = 2, 丁 = 3, 戊 = 4,
  己 = 5, 庚 = 6, 辛 = 7, 壬 = 8, 癸 = 9
}

export enum EarthlyBranch {
  子 = 0, 丑 = 1, 寅 = 2, 卯 = 3, 辰 = 4, 巳 = 5,
  午 = 6, 未 = 7, 申 = 8, 酉 = 9, 戌 = 10, 亥 = 11
}

export enum FiveElement {
  木 = 0, 火 = 1, 土 = 2, 金 = 3, 水 = 4
}

export interface EightCharResult {
  year: { stem: HeavenlyStem; branch: EarthlyBranch };
  month: { stem: HeavenlyStem; branch: EarthlyBranch };
  day: { stem: HeavenlyStem; branch: EarthlyBranch };
  hour: { stem: HeavenlyStem; branch: EarthlyBranch };
  fiveElements: { wood: number; fire: number; earth: number; metal: number; water: number };
  dayMasterStrength: string;
  dayMasterElement: FiveElement;
  destinyHint: string;
}

const STEM_NAMES = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ELEMENT_NAMES = ['木', '火', '土', '金', '水'];

// 天干对应的五行
const STEM_ELEMENTS: FiveElement[] = [
  FiveElement.木, FiveElement.木,
  FiveElement.火, FiveElement.火,
  FiveElement.土, FiveElement.土,
  FiveElement.金, FiveElement.金,
  FiveElement.水, FiveElement.水
];

// 地支对应的五行
const BRANCH_ELEMENTS: FiveElement[] = [
  FiveElement.水, // 子
  FiveElement.土, // 丑
  FiveElement.木, // 寅
  FiveElement.木, // 卯
  FiveElement.土, // 辰
  FiveElement.火, // 巳
  FiveElement.火, // 午
  FiveElement.土, // 未
  FiveElement.金, // 申
  FiveElement.金, // 酉
  FiveElement.土, // 戌
  FiveElement.水  // 亥
];

// 五行相生：木生火、火生土、土生金、金生水、水生木
const GENERATING: FiveElement[][] = [
  [FiveElement.火], // 木生火
  [FiveElement.土], // 火生土
  [FiveElement.金], // 土生金
  [FiveElement.水], // 金生水
  [FiveElement.木]  // 水生木
];

// 五行相克：木克土、土克水、水克火、火克金、金克木
const OVERCOMING: FiveElement[][] = [
  [FiveElement.土], // 木克土
  [FiveElement.金], // 火克金
  [FiveElement.水], // 土克水
  [FiveElement.木], // 金克木
  [FiveElement.火]  // 水克火
];

export class BaziEngine {
  private yearStem: HeavenlyStem;
  private yearBranch: EarthlyBranch;
  private monthStem: HeavenlyStem;
  private monthBranch: EarthlyBranch;
  private dayStem: HeavenlyStem;
  private dayBranch: EarthlyBranch;
  private hourStem: HeavenlyStem;
  private hourBranch: EarthlyBranch;

  constructor(year: number, month: number, day: number, hour: number) {
    this.yearStem = BaziEngine.getYearStem(year);
    this.yearBranch = BaziEngine.getYearBranch(year);
    this.monthStem = BaziEngine.getMonthStem(year, month);
    this.monthBranch = BaziEngine.getMonthBranch(month);
    this.dayStem = BaziEngine.getDayStem(year, month, day);
    this.dayBranch = BaziEngine.getDayBranch(year, month, day);
    this.hourStem = BaziEngine.getHourStem(this.dayStem, hour);
    this.hourBranch = BaziEngine.getHourBranch(hour);
  }

  /** 计算儒略日 */
  private static toJulianDay(year: number, month: number, day: number): number {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y +
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  /** 获取年干 */
  public static getYearStem(year: number): HeavenlyStem {
    return ((year - 4) % 10) as HeavenlyStem;
  }

  /** 获取年支 */
  public static getYearBranch(year: number): EarthlyBranch {
    return ((year - 4) % 12) as EarthlyBranch;
  }

  /** 获取月干 */
  public static getMonthStem(year: number, month: number): HeavenlyStem {
    const yearStem = BaziEngine.getYearStem(year);
    return ((yearStem * 2 + month) % 10) as HeavenlyStem;
  }

  /** 获取月支 */
  public static getMonthBranch(month: number): EarthlyBranch {
    return ((month + 1) % 12) as EarthlyBranch;
  }

  /** 获取日干 */
  public static getDayStem(year: number, month: number, day: number): HeavenlyStem {
    const jd = BaziEngine.toJulianDay(year, month, day);
    return ((jd + 4) % 10) as HeavenlyStem;
  }

  /** 获取日支 */
  public static getDayBranch(year: number, month: number, day: number): EarthlyBranch {
    const jd = BaziEngine.toJulianDay(year, month, day);
    return ((jd + 2) % 12) as EarthlyBranch;
  }

  /** 获取时干 */
  public static getHourStem(dayStem: HeavenlyStem, hour: number): HeavenlyStem {
    const hourIndex = Math.floor(hour / 2) % 12;
    return ((dayStem * 2 + hourIndex) % 10) as HeavenlyStem;
  }

  /** 获取时支 */
  public static getHourBranch(hour: number): EarthlyBranch {
    return Math.floor(hour / 2) as EarthlyBranch;
  }

  /** 计算五行数量 */
  public elementStrength(): { wood: number; fire: number; earth: number; metal: number; water: number } {
    const counts: number[] = [0, 0, 0, 0, 0]; // 木火土金水

    // 统计八字中的五行
    const elements = [
      STEM_ELEMENTS[this.yearStem],
      BRANCH_ELEMENTS[this.yearBranch],
      STEM_ELEMENTS[this.monthStem],
      BRANCH_ELEMENTS[this.monthBranch],
      STEM_ELEMENTS[this.dayStem],
      BRANCH_ELEMENTS[this.dayBranch],
      STEM_ELEMENTS[this.hourStem],
      BRANCH_ELEMENTS[this.hourBranch],
    ];

    for (const elem of elements) {
      counts[elem]++;
    }

    return {
      wood: counts[FiveElement.木],
      fire: counts[FiveElement.火],
      earth: counts[FiveElement.土],
      metal: counts[FiveElement.金],
      water: counts[FiveElement.水],
    };
  }

  /** 获取日主五行 */
  public getDayMasterElement(): FiveElement {
    return STEM_ELEMENTS[this.dayStem];
  }

  /** 分析日主强弱 */
  public dayMasterStrength(): string {
    const dayElement = this.getDayMasterElement();
    const counts = this.elementStrength();

    const elementCount = [
      counts.wood,
      counts.fire,
      counts.earth,
      counts.metal,
      counts.water
    ][dayElement];

    // 简单判断：数量越多越强
    if (elementCount >= 3) return '强';
    if (elementCount === 2) return '偏强';
    if (elementCount === 1) return '中和';
    return '弱';
  }

  /** 获取十神 */
  public getTenGods(): { name: string; relation: string }[] {
    const dayElement = this.getDayMasterElement();
    const result: { name: string; relation: string }[] = [];

    const positions = [
      { stem: this.yearStem, name: '年干' },
      { stem: this.monthStem, name: '月干' },
      { stem: this.hourStem, name: '时干' },
    ];

    const stemElements = positions.map(p => STEM_ELEMENTS[p.stem]);

    for (let i = 0; i < stemElements.length; i++) {
      const elem = stemElements[i];
      const pos = positions[i].name;

      if (elem === dayElement) {
        result.push({ name: '比肩', relation: pos });
        result.push({ name: '劫财', relation: pos });
      } else if (GENERATING[dayElement].includes(elem)) {
        result.push({ name: '食神', relation: pos });
      } else if (OVERCOMING[dayElement].includes(elem)) {
        result.push({ name: '正官', relation: pos });
      } else {
        result.push({ name: '其他', relation: pos });
      }
    }

    return result;
  }

  /** 获取命运提示 */
  public getDestinyHint(): string {
    const strength = this.dayMasterStrength();
    const element = this.getDayMasterElement();
    const elementName = ELEMENT_NAMES[element];

    const hints: string[] = [];
    hints.push(`日主属${elementName}，${strength}`);

    const counts = this.elementStrength();
    const strongest = Math.max(counts.wood, counts.fire, counts.earth, counts.metal, counts.water);
    const strongestIndex = [counts.wood, counts.fire, counts.earth, counts.metal, counts.water].indexOf(strongest);

    if (strongestIndex === element) {
      hints.push('五行平衡，命运相对稳定');
    } else {
      hints.push(`${ELEMENT_NAMES[strongestIndex]}气较旺，需注意调和`);
    }

    return hints.join('；');
  }

  /** 获取完整八字结果 */
  public calculate(): EightCharResult {
    const counts = this.elementStrength();
    return {
      year: { stem: this.yearStem, branch: this.yearBranch },
      month: { stem: this.monthStem, branch: this.monthBranch },
      day: { stem: this.dayStem, branch: this.dayBranch },
      hour: { stem: this.hourStem, branch: this.hourBranch },
      fiveElements: counts,
      dayMasterStrength: this.dayMasterStrength(),
      dayMasterElement: this.getDayMasterElement(),
      destinyHint: this.getDestinyHint(),
    };
  }

  /** 格式化输出 */
  public toString(): string {
    const result = this.calculate();
    return [
      `${STEM_NAMES[result.year.stem]}${BRANCH_NAMES[result.year.branch]}年`,
      `${STEM_NAMES[result.month.stem]}${BRANCH_NAMES[result.month.branch]}月`,
      `${STEM_NAMES[result.day.stem]}${BRANCH_NAMES[result.day.branch]}日`,
      `${STEM_NAMES[result.hour.stem]}${BRANCH_NAMES[result.hour.branch]}时`,
      `五行：木${result.fiveElements.wood} 火${result.fiveElements.fire} 土${result.fiveElements.earth} 金${result.fiveElements.metal} 水${result.fiveElements.water}`,
      result.destinyHint
    ].join('\n');
  }
}
