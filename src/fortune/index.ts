/**
 * =============================================================================
 * OMNIS APIEN - 永夜熵纪
 * 八字命理系统 - 中华传统命理学的数字化实现
 * 结合熵增纪元世界观，创造独特的命运模拟体验
 * =============================================================================
 */

export { EightCharactersCalculator, EightCharactersCore } from './EightCharactersCalculator';
export { FortuneTeller } from './FortuneTeller';
export type { FortuneType } from './FortuneTeller';
export type { DestinyAspect } from './DestinyWheel';
export { EightCharsPanel } from './EightCharsPanel';
export { useEightCharacters } from './useEightCharacters';
// V5修复：添加缺失的 EightChars 类型导出
export type { EightCharacters } from './EightCharactersCalculator';
