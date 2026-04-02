/**
 * =============================================================================
 * 农历日历工具
 * =============================================================================
 */

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeap: boolean;
}

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

export interface LunarInfo {
  lunar: LunarDate;
  solar: SolarDate;
  zodiac: string;
  solarTerms: string | null;
  festival: string | null;
  ganzhiYear: string;
  ganzhiMonth: string;
  ganzhiDay: string;
}

/**
 * 农历转换工具类
 */
export class LunarCalendar {
  private static readonly LUNAR_INFO: number[] = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04ddb, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ];

  private static readonly MONTH_NAMES = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  private static readonly DAY_NAMES = [
    '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ];

  /**
   * 公历转农历 - V5修复：offset 需要可变
   */
  static solarToLunar(year: number, month: number, day: number): LunarDate {
    const [y, m, d] = this.baseDate();
    // V5修复：使用 let 而非 const，因为后续需要修改
    let offset = this.dayCount(year, month, day) - this.dayCount(y, m, d);
    
    let lunarYear = y;
    let lunarMonth = 1;
    let lunarDay = 1;
    let isLeap = false;
    
    // 查找农历年信息
    const leapMonth = this.getLeapMonth(lunarYear);
    
    // 跳过闰月
    if (leapMonth > 0) {
      const leapDays = this.getLeapDays(lunarYear);
      if (offset < leapDays) {
        if (offset === leapDays - this.getMonthDays(lunarYear, leapMonth)) {
          lunarMonth = leapMonth;
          isLeap = true;
        }
        offset -= leapDays;
      }
    }
    
    // 定位月份
    let days = 0;
    for (let i = 1; i <= 12; i++) {
      if (i === leapMonth) {
        days += this.getMonthDays(lunarYear, i);
      }
      days += this.getMonthDays(lunarYear, i);
      
      if (offset < days) {
        lunarMonth = i;
        break;
      }
    }
    
    // 计算日期
    lunarDay = offset - days + this.getMonthDays(lunarYear, lunarMonth) + 1;
    
    return { year: lunarYear, month: lunarMonth, day: lunarDay, isLeap };
  }

  /**
   * 农历转公历
   */
  static lunarToSolar(year: number, month: number, day: number, isLeap: boolean = false): SolarDate {
    const [baseY, baseM, baseD] = this.baseDate();
    let offset = 0;
    
    // 累加年份
    for (let y = baseY; y < year; y++) {
      offset += this.lunarYearDays(y);
    }
    
    // 累加月份
    const leapMonth = this.getLeapMonth(year);
    for (let m = 1; m < month; m++) {
      offset += this.getMonthDays(year, m);
      if (m === leapMonth) {
        offset += this.getLeapDays(year);
      }
    }
    
    // 闰月调整
    if (isLeap && month === leapMonth) {
      offset += this.getMonthDays(year, month);
    }
    
    offset += day - 1;
    
    // 转公历
    return this.offsetToSolar(baseY, baseM, baseD, offset);
  }

  /**
   * 获取农历年的天数
   */
  private static lunarYearDays(year: number): number {
    let days = 0;
    const leapMonth = this.getLeapMonth(year);
    for (let i = 1; i <= 12; i++) {
      days += this.getMonthDays(year, i);
    }
    if (leapMonth > 0) {
      days += this.getLeapDays(year);
    }
    return days;
  }

  /**
   * 获取农历月的天数
   */
  private static getMonthDays(year: number, month: number): number {
    const index = year - 2000;
    if (index < 0 || index >= this.LUNAR_INFO.length) return 30;
    
    const info = this.LUNAR_INFO[index];
    const bit = (info >> (month - 1)) & 1;
    return bit === 1 ? 30 : 29;
  }

  /**
   * 获取闰月天数
   */
  private static getLeapDays(year: number): number {
    const index = year - 2000;
    if (index < 0 || index >= this.LUNAR_INFO.length) return 0;
    
    if (this.getLeapMonth(year) === 0) return 0;
    
    const info = this.LUNAR_INFO[index];
    const leapBit = (info >> 12) & 1;
    return leapBit === 1 ? 30 : 29;
  }

  /**
   * 获取闰月月份
   */
  private static getLeapMonth(year: number): number {
    const index = year - 2000;
    if (index < 0 || index >= this.LUNAR_INFO.length) return 0;
    
    const info = this.LUNAR_INFO[index];
    return info & 0xf;
  }

  /**
   * 计算两日期间隔
   */
  private static dayCount(year: number, month: number, day: number): number {
    const [baseY, baseM, baseD] = this.baseDate();
    
    let days = 0;
    for (let y = baseY; y < year; y++) {
      days += this.isLeapYear(y) ? 366 : 365;
    }
    
    const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (this.isLeapYear(year)) monthDays[2] = 29;
    
    for (let m = 1; m < month; m++) {
      days += monthDays[m];
    }
    
    days += day;
    
    // 减去基准日期
    let baseDays = 0;
    for (let y = baseY; y < baseY; y++) {
      baseDays += this.isLeapYear(y) ? 366 : 365;
    }
    for (let m = 1; m < baseM; m++) {
      baseDays += monthDays[m];
    }
    baseDays += baseD;
    
    return days - baseDays;
  }

  /**
   * 偏移量转公历
   */
  private static offsetToSolar(baseY: number, baseM: number, baseD: number, offset: number): SolarDate {
    const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    let year = baseY;
    let month = baseM;
    let day = baseD + offset;
    
    while (true) {
      if (this.isLeapYear(year)) monthDays[2] = 29;
      else monthDays[2] = 28;
      
      if (day <= monthDays[month]) break;
      
      day -= monthDays[month];
      month++;
      
      if (month > 12) {
        month = 1;
        year++;
      }
    }
    
    return { year, month, day };
  }

  /**
   * 判断是否闰年
   */
  private static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * 基准日期 (2000年1月1日为甲子日)
   */
  private static baseDate(): [number, number, number] {
    return [2000, 1, 1];
  }

  /**
   * 格式化农历日期
   */
  static formatLunarDate(date: LunarDate): string {
    const monthName = date.isLeap ? '闰' + this.MONTH_NAMES[date.month] : this.MONTH_NAMES[date.month];
    return `${date.year}年${monthName}月${this.DAY_NAMES[date.day]}`;
  }
}
