/**
 * =============================================================================
 * 八字命理 Hook
 * =============================================================================
 */

import { useState, useCallback, useMemo } from 'react';
import { EightCharactersCalculator, EightCharactersAnalysis, EightCharacters } from './EightCharactersCalculator';
import { FortuneTeller, FortuneResult } from './FortuneTeller';
import { logger } from '../core/utils/Logger';

export interface UseEightCharactersOptions {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  isLunar?: boolean;
}

export interface UseEightCharactersReturn {
  // 输入状态
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthMinute: number;
  isLunar: boolean;
  
  // 八字数据
  eightChars: EightCharacters | null;
  analysis: EightCharactersAnalysis | null;
  
  // 运势
  fortunes: FortuneResult[];
  
  // 方法
  setBirthDate: (date: Partial<{
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    isLunar: boolean;
  }>) => void;
  recalculate: () => void;
}

/**
 * 八字命理 Hook
 */
export function useEightCharacters(options: UseEightCharactersOptions = {}): UseEightCharactersReturn {
  const [birthYear, setBirthYear] = useState(options.year ?? 1990);
  const [birthMonth, setBirthMonth] = useState(options.month ?? 1);
  const [birthDay, setBirthDay] = useState(options.day ?? 1);
  const [birthHour, setBirthHour] = useState(options.hour ?? 12);
  const [birthMinute, setBirthMinute] = useState(options.minute ?? 0);
  const [isLunar, setIsLunar] = useState(options.isLunar ?? false);
  
  // 计算八字
  const eightChars = useMemo(() => {
    try {
      return EightCharactersCalculator.calculate(
        birthYear,
        birthMonth,
        birthDay,
        birthHour,
        birthMinute,
        isLunar
      );
    } catch (error) {
      logger.warn('useEightCharacters', 'Failed to calculate eight characters', error as Error);
      return null;
    }
  }, [birthYear, birthMonth, birthDay, birthHour, birthMinute, isLunar]);
  
  // 分析八字
  const analysis = useMemo(() => {
    if (!eightChars) return null;
    return EightCharactersCalculator.analyze(eightChars);
  }, [eightChars]);
  
  // 计算运势
  const fortunes = useMemo(() => {
    if (!analysis) return [];
    
    const fortuneTeller = new FortuneTeller(analysis);
    return [
      fortuneTeller.calculateOverall(),
      fortuneTeller.calculateCareer(),
      fortuneTeller.calculateWealth(),
      fortuneTeller.calculateLove(),
      fortuneTeller.calculateHealth(),
      fortuneTeller.calculateStudy(),
    ];
  }, [analysis]);
  
  // 设置出生日期
  const setBirthDate = useCallback((date: Partial<{
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    isLunar: boolean;
  }>) => {
    if (date.year !== undefined) setBirthYear(date.year);
    if (date.month !== undefined) setBirthMonth(date.month);
    if (date.day !== undefined) setBirthDay(date.day);
    if (date.hour !== undefined) setBirthHour(date.hour);
    if (date.minute !== undefined) setBirthMinute(date.minute);
    if (date.isLunar !== undefined) setIsLunar(date.isLunar);
  }, []);
  
  // 重新计算
  const recalculate = useCallback(() => {
    // 强制重新渲染
    setBirthYear(y => y + 0);
  }, []);
  
  return {
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    birthMinute,
    isLunar,
    eightChars,
    analysis,
    fortunes,
    setBirthDate,
    recalculate,
  };
}
