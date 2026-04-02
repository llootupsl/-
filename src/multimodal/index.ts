/**
 * 多模态交互模块导出
 */

export { voiceController, VoiceController } from './VoiceController';
export type { VoiceConfig, VoiceCommand, VoiceState } from './VoiceController';

export { gamepadManager, GamepadManager } from '@/input/GamepadManager';
export type { 
  GamepadState,
  GamepadEvents,
  GamepadConfig,
  ButtonMapping,
} from '@/input/GamepadManager';

export { BlindMode } from './BlindMode';
export type { BlindModeConfig, GameEvent, BlindModeState } from './BlindMode';

export { accessibilityManager, AccessibilityManager } from './AccessibilityManager';
export type { 
  AccessibilitySettings, 
  AccessibilityAnnouncement,
} from './AccessibilityManager';

export { MultimodalInput } from './MultimodalInput';
export type { 
  InputMode, 
  InputPriority,
  MultimodalInputConfig,
  MultimodalInputState,
} from './MultimodalInput';
