/**
 * 盲眼先知模式
 * 纯音频交互体验
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { logger } from '@/core/utils/Logger';
import { voiceController } from './VoiceController';

export interface BlindModeConfig {
  enableVoiceCommand?: boolean;
  enableAudioFeedback?: boolean;
  audioLevel?: 'minimal' | 'detailed' | 'full';
  narrationSpeed?: number;
  language?: string;
}

export interface GameEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

export interface BlindModeState {
  isActive: boolean;
  currentEvent: GameEvent | null;
  eventHistory: GameEvent[];
  audioLevel: 'minimal' | 'detailed' | 'full';
  voiceCommandEnabled: boolean;
}

const DEFAULT_CONFIG: Required<BlindModeConfig> = {
  enableVoiceCommand: true,
  enableAudioFeedback: true,
  audioLevel: 'detailed',
  narrationSpeed: 1.0,
  language: 'zh-CN',
};

const EVENT_TEMPLATES = {
  civilization: [
    { type: 'birth', title: '新生命诞生', description: '一个新生儿来到了这个世界' },
    { type: 'death', title: '生命消逝', description: '一位公民离开了我们' },
    { type: 'discovery', title: '重大发现', description: '科学家有了新的突破' },
    { type: 'construction', title: '建筑完工', description: '新的建筑已经建成' },
  ],
  economy: [
    { type: 'trade', title: '交易完成', description: '一笔贸易已经达成' },
    { type: 'crisis', title: '经济危机', description: '市场出现了波动' },
    { type: 'prosperity', title: '繁荣时期', description: '经济正在蓬勃发展' },
  ],
  combat: [
    { type: 'attack', title: '遭遇袭击', description: '敌人正在逼近' },
    { type: 'victory', title: '战斗胜利', description: '我们取得了胜利' },
    { type: 'defeat', title: '战斗失败', description: '敌人占领了我们的领土' },
  ],
};

const IMPORTANCE_AUDIO = {
  low: { pitch: 0.9, rate: 0.9, prefix: '' },
  medium: { pitch: 1.0, rate: 1.0, prefix: '[重要] ' },
  high: { pitch: 1.1, rate: 1.1, prefix: '⚠️ [警报] ' },
  critical: { pitch: 1.2, rate: 1.2, prefix: '🚨🚨🚨 [紧急] ' },
};

export const BlindMode: React.FC<{
  config?: Partial<BlindModeConfig>;
  onCommand?: (command: string) => void;
  className?: string;
}> = ({ config, onCommand, className = '' }) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<BlindModeState>({
    isActive: false,
    currentEvent: null,
    eventHistory: [],
    audioLevel: finalConfig.audioLevel,
    voiceCommandEnabled: finalConfig.enableVoiceCommand,
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const eventQueueRef = useRef<GameEvent[]>([]);
  const isProcessingRef = useRef(false);

  // 初始化语音控制
  useEffect(() => {
    if (!voiceController.isSupported()) {
      console.warn('[BlindMode] 语音功能不支持');
      return;
    }

    // 注册语音命令
    const commands = [
      {
        command: '激活先知',
        action: () => enterBlindMode(),
        description: '进入先知模式',
      },
      {
        command: '退出先知',
        action: () => exitBlindMode(),
        description: '退出先知模式',
      },
      {
        command: '状态报告',
        action: () => reportStatus(),
        description: '获取当前状态',
      },
      {
        command: '历史回顾',
        action: () => reviewHistory(),
        description: '回顾事件历史',
      },
      {
        command: '下一条',
        action: () => processNextEvent(),
        description: '处理下一条事件',
      },
    ];

    voiceController.registerCommands(commands);

    // 监听语音状态
    voiceController.onStateChange((voiceState) => {
      setIsSpeaking(voiceState === 'speaking');
    });

    return () => {
      voiceController.clearCommands();
    };
  }, []);

  // 进入盲眼模式
  const enterBlindMode = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
    voiceController.speak('先知模式已激活', { 
      rate: finalConfig.narrationSpeed,
      lang: finalConfig.language,
    });
    announceContext();
  }, [finalConfig]);

  // 退出盲眼模式
  const exitBlindMode = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
    voiceController.speak('先知模式已退出', { 
      rate: finalConfig.narrationSpeed,
      lang: finalConfig.language,
    });
  }, [finalConfig]);

  // 宣布上下文
  const announceContext = useCallback(() => {
    if (state.audioLevel === 'minimal') {
      voiceController.speak('当前处于先知模式', { rate: finalConfig.narrationSpeed });
    } else {
      voiceController.speak(
        `欢迎来到先知模式。您正在以纯音频方式体验文明演变。` +
        `当前事件详细度: ${state.audioLevel === 'detailed' ? '详细' : '完整'}。` +
        `共有 ${state.eventHistory.length} 条历史事件。`,
        { rate: finalConfig.narrationSpeed }
      );
    }
  }, [state.audioLevel, state.eventHistory.length, finalConfig]);

  // 报告状态
  const reportStatus = useCallback(() => {
    const statusText = [
      `当前状态报告:`,
      `事件队列: ${eventQueueRef.current.length} 条待处理`,
      `历史记录: ${state.eventHistory.length} 条`,
      `音频详细度: ${state.audioLevel}`,
      `语音命令: ${state.voiceCommandEnabled ? '已启用' : '已禁用'}`,
    ].join('。');

    voiceController.speak(statusText, { rate: finalConfig.narrationSpeed });
  }, [state.eventHistory.length, state.audioLevel, state.voiceCommandEnabled, finalConfig]);

  // 回顾历史
  const reviewHistory = useCallback(() => {
    if (state.eventHistory.length === 0) {
      voiceController.speak('暂无历史事件', { rate: finalConfig.narrationSpeed });
      return;
    }

    const recentEvents = state.eventHistory.slice(-5).reverse();
    let speech = '最近 5 条事件: ';
    
    recentEvents.forEach((event, index) => {
      speech += `第 ${index + 1} 条: ${event.title}。`;
    });

    voiceController.speak(speech, { rate: finalConfig.narrationSpeed });
  }, [state.eventHistory, finalConfig]);

  // 处理下一条事件
  const processNextEvent = useCallback(() => {
    if (eventQueueRef.current.length === 0) {
      voiceController.speak('没有待处理的事件', { rate: finalConfig.narrationSpeed });
      return;
    }

    const event = eventQueueRef.current.shift();
    if (event) {
      announceEvent(event);
    }
  }, [finalConfig]);

  // 宣布事件
  const announceEvent = useCallback((event: GameEvent) => {
    const audioConfig = IMPORTANCE_AUDIO[event.importance];
    let speech = audioConfig.prefix;

    switch (state.audioLevel) {
      case 'minimal':
        speech += event.title;
        break;
      case 'detailed':
        speech += `${event.title}。${event.description}`;
        break;
      case 'full':
        speech += `${event.title}。${event.description}。时间戳: ${new Date(event.timestamp).toLocaleTimeString()}`;
        break;
    }

    setState(prev => ({
      ...prev,
      currentEvent: event,
      eventHistory: [...prev.eventHistory, event].slice(-50),
    }));

    voiceController.speak(speech, { 
      rate: finalConfig.narrationSpeed * audioConfig.rate,
      pitch: audioConfig.pitch,
      lang: finalConfig.language,
    });
  }, [state.audioLevel, finalConfig]);

  // 添加事件到队列
  const addEvent = useCallback((event: Omit<GameEvent, 'id' | 'timestamp'>) => {
    const newEvent: GameEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    eventQueueRef.current.push(newEvent);

    // 如果是重要事件，立即宣布
    if (event.importance === 'critical' || event.importance === 'high') {
      processNextEvent();
    }
  }, [processNextEvent]);

  // 模拟事件生成（用于演示）
  const simulateRandomEvent = useCallback(() => {
    const categories = Object.keys(EVENT_TEMPLATES) as Array<keyof typeof EVENT_TEMPLATES>;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const templates = EVENT_TEMPLATES[category];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const importanceLevels: Array<'low' | 'medium' | 'high' | 'critical'> = 
      ['low', 'medium', 'medium', 'high', 'critical'];
    const importance = importanceLevels[Math.floor(Math.random() * importanceLevels.length)];

    addEvent({
      type: template.type,
      title: template.title,
      description: template.description,
      importance,
    });
  }, [addEvent]);

  // 手动触发语音命令
  const triggerCommand = useCallback((command: string) => {
    voiceController.speak(`收到命令: ${command}`, { rate: finalConfig.narrationSpeed });
    onCommand?.(command);
  }, [finalConfig, onCommand]);

  return (
    <div className={`blind-mode ${className}`}>
      <style>{`
        .blind-mode {
          font-family: var(--font-ui, 'Noto Sans SC', sans-serif);
          background: linear-gradient(135deg, rgba(5, 5, 8, 0.98), rgba(15, 15, 20, 0.95));
          border: 1px solid rgba(167, 139, 250, 0.2);
          border-radius: 16px;
          padding: 20px;
          max-width: 360px;
          color: #e4e4e7;
        }
        .blind-mode-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .blind-mode-icon {
          font-size: 24px;
        }
        .blind-mode-title {
          font-size: 16px;
          font-weight: 600;
          color: #a78bfa;
        }
        .blind-mode-status {
          font-size: 12px;
          color: #71717a;
        }
        .blind-mode-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #4b5563;
          transition: all 0.3s;
        }
        .blind-mode-indicator.active {
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
          animation: pulse 2s infinite;
        }
        .blind-mode-indicator.speaking {
          background: #f59e0b;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
          animation: pulse 0.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        .blind-mode-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }
        .blind-mode-btn {
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .blind-mode-btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
        .blind-mode-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .blind-mode-btn-secondary {
          background: rgba(120, 119, 198, 0.15);
          color: #a78bfa;
          border: 1px solid rgba(120, 119, 198, 0.3);
        }
        .blind-mode-btn-secondary:hover {
          background: rgba(120, 119, 198, 0.25);
        }
        .blind-mode-event-queue {
          margin-top: 16px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          font-size: 12px;
        }
        .blind-mode-event-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .blind-mode-event-item:last-child {
          border-bottom: none;
        }
        .blind-mode-importance {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .blind-mode-importance.low { background: #6b7280; }
        .blind-mode-importance.medium { background: #3b82f6; }
        .blind-mode-importance.high { background: #f59e0b; }
        .blind-mode-importance.critical { background: #ef4444; }
        .blind-mode-waveform {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 30px;
          margin: 12px 0;
        }
        .blind-mode-waveform-bar {
          width: 3px;
          background: linear-gradient(to top, #667eea, #764ba2);
          border-radius: 2px;
          transition: height 0.1s;
        }
      `}</style>

      <div className="blind-mode-header">
        <span className="blind-mode-icon">👁️</span>
        <div>
          <div className="blind-mode-title">盲眼先知模式</div>
          <div className="blind-mode-status">
            {state.isActive ? '模式已激活' : '模式未激活'}
          </div>
        </div>
        <div 
          className={`blind-mode-indicator ${state.isActive ? 'active' : ''} ${isSpeaking ? 'speaking' : ''}`}
        />
      </div>

      {/* 波形指示器 */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div 
            className="blind-mode-waveform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="blind-mode-waveform-bar"
                animate={{
                  height: [10, 20 + Math.random() * 15, 10],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.05,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="blind-mode-controls">
        {!state.isActive ? (
          <button 
            className="blind-mode-btn blind-mode-btn-primary"
            onClick={enterBlindMode}
          >
            👁️ 进入先知模式
          </button>
        ) : (
          <>
            <button 
              className="blind-mode-btn blind-mode-btn-secondary"
              onClick={reportStatus}
            >
              📊 状态报告
            </button>
            <button 
              className="blind-mode-btn blind-mode-btn-secondary"
              onClick={reviewHistory}
            >
              📜 历史回顾
            </button>
            <button 
              className="blind-mode-btn blind-mode-btn-secondary"
              onClick={exitBlindMode}
            >
              🚪 退出先知
            </button>
          </>
        )}
        
        {/* 测试按钮 */}
        <button 
          className="blind-mode-btn blind-mode-btn-secondary"
          onClick={simulateRandomEvent}
          style={{ marginTop: 8 }}
        >
          🎲 模拟随机事件
        </button>
      </div>

      {/* 事件队列 */}
      {eventQueueRef.current.length > 0 && (
        <div className="blind-mode-event-queue">
          <div style={{ fontSize: 11, color: '#71717a', marginBottom: 8 }}>
            待处理事件 ({eventQueueRef.current.length})
          </div>
          {eventQueueRef.current.slice(0, 5).map((event) => (
            <div key={event.id} className="blind-mode-event-item">
              <span className={`blind-mode-importance ${event.importance}`} />
              <span>{event.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlindMode;
