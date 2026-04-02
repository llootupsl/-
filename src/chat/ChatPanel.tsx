/**
 * =============================================================================
 * 聊天面板组件
 * =============================================================================
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { ChatRoom, ChatMessage } from './ChatRoom';
import { MessageQueue } from './MessageQueue';
import { ChatBubble } from './ChatBubble';
import type { LLMManager } from '@/ai/LLMBridge';

interface ChatPanelProps {
  userId?: string;
  userName?: string;
  className?: string;
  onMessage?: (message: ChatMessage) => void;
  llmManager?: LLMManager | null;
}

const EMOJI_LIST = ['😀', '😂', '🥰', '😎', '🤔', '👍', '❤️', '🔥', '✨', '🌟', '💡', '🎮', '🚀', '💪', '🙏'];

export const ChatPanel: React.FC<ChatPanelProps> = memo(({
  userId = `user-${Date.now()}`,
  userName = '观察者',
  className = '',
  onMessage,
  llmManager,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRoomRef = useRef<ChatRoom | null>(null);
  const messageQueueRef = useRef<MessageQueue>(new MessageQueue());

  // 初始化聊天房间
  useEffect(() => {
    chatRoomRef.current = new ChatRoom(userId, userName);
    
    chatRoomRef.current.on('message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      onMessage?.(message);
    });

    chatRoomRef.current.on('clear', () => {
      setMessages([]);
    });

    // 离线消息处理
    messageQueueRef.current.setOnFlush(async (queuedMessages) => {
      for (const msg of queuedMessages) {
        chatRoomRef.current?.send(msg.content, msg.type);
      }
    });

    // 尝试发送离线消息
    if (navigator.onLine) {
      messageQueueRef.current.flush();
    }

    setIsConnected(true);

    // 监听在线状态
    const handleOnline = () => {
      setIsConnected(true);
      messageQueueRef.current.flush();
    };
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      chatRoomRef.current?.destroy();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId, userName, onMessage, llmManager]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息（使用 LLM 生成回复）
  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content) return;

    if (navigator.onLine && chatRoomRef.current) {
      chatRoomRef.current.send(content);
    } else {
      // 离线队列
      messageQueueRef.current.enqueue({
        id: `${Date.now()}`,
        type: 'text',
        sender: userId,
        content,
        timestamp: Date.now(),
      });
    }

    setInput('');

    // 使用 LLM 生成 AI 回复
    if (llmManager) {
      setIsGenerating(true);
      try {
        // 构建系统提示（根据游戏上下文）
        const systemPrompt = `你是一个在数字文明模拟游戏《永夜熵纪》中生活的市民。
这个文明正在经历熵增的考验。
请用简洁、富有哲理的方式回应观察者（玩家）的问题。
可以提及量子叠加态、神经网络、命运熵变等概念。
保持神秘感，像一个了解宇宙深层规律的智者。`;

        // 获取最近的对话历史（最多5条）
        const recentMessages = messages.slice(-5).map(m => ({
          role: (m.sender === 'system' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: m.content,
        }));

        // 调用 LLM 生成回复
        const response = await llmManager.generate([
          { role: 'system' as const, content: systemPrompt },
          ...recentMessages,
          { role: 'user' as const, content },
        ]);

        // 发送 AI 回复
        if (response.content && chatRoomRef.current) {
          chatRoomRef.current.sendSystem(response.content);
        }
      } catch (error) {
        console.warn('[ChatPanel] LLM generation failed:', error);
        // LLM 失败时发送默认回复
        chatRoomRef.current?.sendSystem('我正在思考这个问题...');
      } finally {
        setIsGenerating(false);
      }
    }
  }, [input, userId, llmManager, messages]);

  // 发送快捷消息
  const handleQuickSend = useCallback((type: 'system' | 'divine') => {
    const messages = {
      system: [
        '熵值正在上升...',
        '检测到异常波动',
        '系统正在分析数据',
      ],
      divine: [
        '命运的齿轮开始转动',
        '神的目光正在注视',
        '因果律正在编织',
      ],
    };
    
    const list = messages[type];
    const msg = list[Math.floor(Math.random() * list.length)];
    
    if (type === 'system') {
      chatRoomRef.current?.sendSystem(msg);
    } else {
      chatRoomRef.current?.sendDivine(msg);
    }
  }, []);

  // 键盘发送
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className={`chat-panel ${className}`}>
      {/* 连接状态 */}
      <div className="chat-status">
        <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`} />
        <span className="status-text">
          {isConnected ? '已连接' : '离线模式'}
        </span>
      </div>

      {/* 消息列表 */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <span className="empty-icon">💬</span>
            <p>暂无消息</p>
            <p className="empty-hint">开始与文明互动吧</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender === userId}
          />
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷操作 */}
      <div className="chat-quick-actions">
        <button 
          className="quick-btn system"
          onClick={() => handleQuickSend('system')}
        >
          ⚙️ 系统
        </button>
        <button 
          className="quick-btn divine"
          onClick={() => handleQuickSend('divine')}
        >
          ✨ 神谕
        </button>
      </div>

      {/* 输入区域 */}
      <div className="chat-input-area">
        <div className="emoji-picker">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              className="emoji-btn"
              onClick={() => setInput(prev => prev + emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        <div className="input-row">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
          />
          <button 
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
          >
            {isGenerating ? '思考中...' : '发送'}
          </button>
        </div>
      </div>

      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-bg-primary);
        }
        
        .chat-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--color-bg-surface);
          border-bottom: 1px solid var(--color-bg-overlay);
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .status-indicator.online {
          background: var(--color-success);
          box-shadow: 0 0 6px var(--color-success);
        }
        
        .status-indicator.offline {
          background: var(--color-warning);
        }
        
        .status-text {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .empty-hint {
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }
        
        .chat-quick-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-top: 1px solid var(--color-bg-overlay);
        }
        
        .quick-btn {
          flex: 1;
          padding: 0.4rem;
          border: 1px solid var(--color-bg-overlay);
          border-radius: var(--radius-md);
          background: transparent;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .quick-btn:hover {
          background: var(--color-bg-surface);
        }
        
        .quick-btn.system:hover {
          border-color: var(--color-primary);
        }
        
        .quick-btn.divine:hover {
          border-color: rgba(255, 215, 0, 0.5);
        }
        
        .chat-input-area {
          padding: 0.75rem 1rem;
          background: var(--color-bg-surface);
          border-top: 1px solid var(--color-bg-overlay);
        }
        
        .emoji-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
          max-height: 80px;
          overflow-y: auto;
        }
        
        .emoji-btn {
          padding: 0.2rem 0.3rem;
          background: transparent;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
        }
        
        .emoji-btn:hover {
          background: var(--color-bg-overlay);
        }
        
        .input-row {
          display: flex;
          gap: 0.5rem;
        }
        
        .chat-input {
          flex: 1;
          padding: 0.6rem 0.8rem;
          background: var(--color-bg-primary);
          border: 1px solid var(--color-bg-overlay);
          border-radius: var(--radius-lg);
          color: var(--color-text-primary);
          font-size: 0.85rem;
          resize: none;
          max-height: 100px;
          font-family: inherit;
        }
        
        .chat-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        
        .send-btn {
          padding: 0.6rem 1.2rem;
          background: var(--color-primary);
          border: none;
          border-radius: var(--radius-lg);
          color: var(--color-bg-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .send-btn:hover:not(:disabled) {
          background: var(--color-primary-hover);
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }
        
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';
