/**
 * 多模态输入选择器
 * 提供语音、手柄、键盘等多种输入方式的管理
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { voiceController } from './VoiceController';
import { gamepadManager } from '@/input/GamepadManager';
import { accessibilityManager } from './AccessibilityManager';

export type InputMode = 'voice' | 'gamepad' | 'keyboard' | 'mouse' | 'touch';
export type InputPriority = 'voice' | 'gamepad' | 'keyboard' | 'auto';

export interface MultimodalInputConfig {
  enabledModes: InputMode[];
  activeMode: InputMode | 'auto';
  priority: InputPriority;
  autoSwitch: boolean;
  hapticFeedback: boolean;
  audioFeedback: boolean;
}

export interface MultimodalInputState {
  isListening: boolean;
  currentMode: InputMode | 'auto';
  availableModes: InputMode[];
  lastInput: { mode: InputMode; timestamp: number } | null;
}

const DEFAULT_CONFIG: MultimodalInputConfig = {
  enabledModes: ['voice', 'gamepad', 'keyboard', 'mouse', 'touch'],
  activeMode: 'auto',
  priority: 'auto',
  autoSwitch: true,
  hapticFeedback: true,
  audioFeedback: true,
};

export const MultimodalInput: React.FC<{
  config?: Partial<MultimodalInputConfig>;
  onModeChange?: (mode: InputMode | 'auto') => void;
  onInput?: (mode: InputMode, data: unknown) => void;
  className?: string;
}> = ({ config, onModeChange, onInput, className = '' }) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<MultimodalInputState>({
    isListening: false,
    currentMode: finalConfig.activeMode,
    availableModes: [],
    lastInput: null,
  });
  const [showSettings, setShowSettings] = useState(false);

  // 初始化检测
  useEffect(() => {
    const available: InputMode[] = [];

    // 检测语音支持
    if (voiceController.isSupported() && finalConfig.enabledModes.includes('voice')) {
      available.push('voice');
    }

    // 检测手柄支持
    if (gamepadManager.isSupported() && finalConfig.enabledModes.includes('gamepad')) {
      available.push('gamepad');
    }

    // 键盘和鼠标始终可用
    if (finalConfig.enabledModes.includes('keyboard')) {
      available.push('keyboard');
    }
    if (finalConfig.enabledModes.includes('mouse')) {
      available.push('mouse');
    }
    if (finalConfig.enabledModes.includes('touch')) {
      available.push('touch');
    }

    setState(prev => ({ ...prev, availableModes: available }));

    // 初始化手柄监听
    if (available.includes('gamepad')) {
      initGamepadListener();
    }

    // 初始化键盘监听
    if (available.includes('keyboard')) {
      initKeyboardListener();
    }

    return () => {
      gamepadManager.stopPolling();
    };
  }, []);

  // 初始化手柄监听
  const initGamepadListener = useCallback(() => {
    gamepadManager.on('buttonDown', (index: number, button: number) => {
      handleInput('gamepad', { type: 'pressed', index, button });
      
      if (finalConfig.hapticFeedback) {
        gamepadManager.triggerVibration('light', 50);
      }
    });

    gamepadManager.startPolling();
  }, [finalConfig.hapticFeedback]);

  // 初始化键盘监听
  const initKeyboardListener = useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 跳过输入框内的按键
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }

      handleInput('keyboard', { key: e.key, code: e.code });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 处理输入
  const handleInput = useCallback((mode: InputMode, data: unknown) => {
    setState(prev => ({
      ...prev,
      lastInput: { mode, timestamp: Date.now() },
      currentMode: finalConfig.autoSwitch ? mode : prev.currentMode,
    }));

    onInput?.(mode, data);

    // 语音反馈
    if (finalConfig.audioFeedback && mode !== 'voice') {
      accessibilityManager.announce(`${getModeName(mode)} 输入`);
    }
  }, [finalConfig.autoSwitch, finalConfig.audioFeedback, onInput]);

  // 获取模式名称
  const getModeName = (mode: InputMode): string => {
    const names: Record<InputMode, string> = {
      voice: '语音',
      gamepad: '手柄',
      keyboard: '键盘',
      mouse: '鼠标',
      touch: '触屏',
    };
    return names[mode];
  };

  // 切换语音监听
  const toggleVoiceListening = useCallback(() => {
    if (!voiceController.isSupported()) return;

    const newState = !state.isListening;
    setState(prev => ({ ...prev, isListening: newState }));

    if (newState) {
      voiceController.startListening();
      handleInput('voice', { action: 'start' });
    } else {
      voiceController.stopListening();
      handleInput('voice', { action: 'stop' });
    }
  }, [state.isListening, handleInput]);

  // 切换模式
  const switchMode = useCallback((mode: InputMode | 'auto') => {
    setState(prev => ({ ...prev, currentMode: mode }));
    onModeChange?.(mode);
  }, [onModeChange]);

  return (
    <div className={`multimodal-input ${className}`}>
      <style>{`
        .multimodal-input {
          font-family: var(--font-ui, 'Noto Sans SC', sans-serif);
          background: linear-gradient(135deg, rgba(15, 15, 20, 0.95), rgba(25, 25, 35, 0.9));
          border: 1px solid rgba(120, 119, 198, 0.25);
          border-radius: 12px;
          padding: 16px;
          color: #e4e4e7;
        }
        .multimodal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .multimodal-title {
          font-size: 14px;
          font-weight: 600;
          color: #a78bfa;
        }
        .multimodal-modes {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .multimodal-mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid rgba(120, 119, 198, 0.3);
          border-radius: 8px;
          background: rgba(120, 119, 198, 0.1);
          color: #a78bfa;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .multimodal-mode-btn:hover {
          background: rgba(120, 119, 198, 0.2);
        }
        .multimodal-mode-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-color: transparent;
          color: white;
        }
        .multimodal-mode-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .multimodal-mode-icon {
          font-size: 16px;
        }
        .multimodal-voice-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid rgba(120, 119, 198, 0.4);
          background: rgba(120, 119, 198, 0.15);
          cursor: pointer;
          transition: all 0.3s;
          margin: 16px auto;
        }
        .multimodal-voice-btn:hover {
          transform: scale(1.05);
          border-color: #667eea;
        }
        .multimodal-voice-btn.listening {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-color: transparent;
          animation: pulse-voice 1.5s infinite;
        }
        @keyframes pulse-voice {
          0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.5); }
          50% { box-shadow: 0 0 0 12px rgba(102, 126, 234, 0); }
        }
        .multimodal-voice-icon {
          font-size: 20px;
        }
        .multimodal-status {
          text-align: center;
          margin-top: 12px;
          font-size: 11px;
          color: #71717a;
        }
        .multimodal-last-input {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
          font-size: 11px;
        }
        .multimodal-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
        }
        .multimodal-settings-toggle {
          font-size: 11px;
          color: #71717a;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .multimodal-settings-toggle:hover {
          background: rgba(120, 119, 198, 0.2);
          color: #a78bfa;
        }
      `}</style>

      <div className="multimodal-header">
        <span className="multimodal-title">🎮 多模态输入</span>
        <span 
          className="multimodal-settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? '收起' : '设置'}
        </span>
      </div>

      {/* 模式按钮 */}
      <div className="multimodal-modes">
        {state.availableModes.includes('voice') && (
          <button
            className={`multimodal-mode-btn ${state.currentMode === 'voice' ? 'active' : ''}`}
            onClick={() => switchMode('voice')}
          >
            <span className="multimodal-mode-icon">🎤</span>
            <span>语音</span>
          </button>
        )}
        
        {state.availableModes.includes('gamepad') && (
          <button
            className={`multimodal-mode-btn ${state.currentMode === 'gamepad' ? 'active' : ''}`}
            onClick={() => switchMode('gamepad')}
          >
            <span className="multimodal-mode-icon">🎮</span>
            <span>手柄</span>
          </button>
        )}
        
        {state.availableModes.includes('keyboard') && (
          <button
            className={`multimodal-mode-btn ${state.currentMode === 'keyboard' ? 'active' : ''}`}
            onClick={() => switchMode('keyboard')}
          >
            <span className="multimodal-mode-icon">⌨️</span>
            <span>键盘</span>
          </button>
        )}
        
        {state.availableModes.includes('mouse') && (
          <button
            className={`multimodal-mode-btn ${state.currentMode === 'mouse' ? 'active' : ''}`}
            onClick={() => switchMode('mouse')}
          >
            <span className="multimodal-mode-icon">🖱️</span>
            <span>鼠标</span>
          </button>
        )}
        
        {state.availableModes.includes('touch') && (
          <button
            className={`multimodal-mode-btn ${state.currentMode === 'touch' ? 'active' : ''}`}
            onClick={() => switchMode('touch')}
          >
            <span className="multimodal-mode-icon">👆</span>
            <span>触屏</span>
          </button>
        )}
      </div>

      {/* 语音按钮 */}
      {state.availableModes.includes('voice') && (
        <button
          className={`multimodal-voice-btn ${state.isListening ? 'listening' : ''}`}
          onClick={toggleVoiceListening}
        >
          <span className="multimodal-voice-icon">
            {state.isListening ? '🔊' : '🎤'}
          </span>
        </button>
      )}

      {/* 状态 */}
      <div className="multimodal-status">
        {state.isListening 
          ? '正在监听... 说出命令' 
          : `当前模式: ${state.currentMode === 'auto' ? '自动' : getModeName(state.currentMode as InputMode)}`}
      </div>

      {/* 最后输入 */}
      {state.lastInput && (
        <div className="multimodal-last-input">
          <span className="multimodal-indicator" />
          <span>
            上次输入: {getModeName(state.lastInput.mode)}
            {' '}
            {Math.round((Date.now() - state.lastInput.timestamp) / 1000)}秒前
          </span>
        </div>
      )}

      {/* 扩展设置 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ marginTop: 12, overflow: 'hidden' }}
          >
            <div style={{ fontSize: 11, color: '#71717a', padding: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox"
                    checked={finalConfig.autoSwitch}
                    onChange={(e) => {
                      // 更新配置
                    }}
                  />
                  <span>自动切换输入模式</span>
                </label>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox"
                    checked={finalConfig.hapticFeedback}
                    onChange={(e) => {
                      // 更新配置
                    }}
                  />
                  <span>触觉反馈</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultimodalInput;
