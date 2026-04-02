/**
 * =============================================================================
 * 聊天气泡组件
 * =============================================================================
 */

import React, { memo, useMemo } from 'react';
import { ChatMessage } from './ChatRoom';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = memo(({ message, isOwn }) => {
  const timeStr = useMemo(() => {
    const date = new Date(message.timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }, [message.timestamp]);

  const typeStyles: Record<ChatMessage['type'], { bg: string; border: string; icon: string }> = {
    text: { bg: 'var(--color-bg-elevated)', border: 'rgba(0, 240, 255, 0.2)', icon: '' },
    system: { bg: 'rgba(0, 240, 255, 0.1)', border: 'var(--color-primary)', icon: '⚙️' },
    divine: { bg: 'rgba(255, 215, 0, 0.1)', border: 'rgba(255, 215, 0, 0.5)', icon: '✨' },
    entity: { bg: 'rgba(138, 43, 226, 0.1)', border: 'rgba(138, 43, 226, 0.3)', icon: '👤' },
    ai: { bg: 'rgba(0, 191, 255, 0.1)', border: 'rgba(0, 191, 255, 0.3)', icon: '🤖' },
  };

  const style = typeStyles[message.type];

  return (
    <div className={`chat-bubble ${isOwn ? 'own' : 'other'} ${message.type}`}>
      {!isOwn && (
        <div className="bubble-avatar">
          {message.avatar || (message.type === 'system' ? '⚙️' : message.type === 'divine' ? '✨' : '👤')}
        </div>
      )}
      
      <div className="bubble-content" style={{ backgroundColor: style.bg, borderColor: style.border }}>
        {!isOwn && message.type !== 'system' && (
          <div className="bubble-sender">{message.sender}</div>
        )}
        
        {message.type === 'system' && (
          <div className="bubble-system-header">
            {style.icon && <span className="system-icon">{style.icon}</span>}
            <span>系统消息</span>
          </div>
        )}
        
        <div className="bubble-text">{message.content}</div>
        
        <div className="bubble-time">{timeStr}</div>
      </div>
      
      {isOwn && (
        <div className="bubble-avatar own-avatar">👤</div>
      )}
      
      <style>{`
        .chat-bubble {
          display: flex;
          gap: 0.5rem;
          max-width: 85%;
          animation: bubbleSlide 0.2s ease;
        }
        
        @keyframes bubbleSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .chat-bubble.own {
          margin-left: auto;
          flex-direction: row-reverse;
        }
        
        .bubble-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        
        .bubble-content {
          padding: 0.6rem 0.8rem;
          border-radius: 12px;
          border: 1px solid;
          position: relative;
        }
        
        .chat-bubble.own .bubble-content {
          border-radius: 12px 12px 4px 12px;
        }
        
        .chat-bubble.other .bubble-content {
          border-radius: 12px 12px 12px 4px;
        }
        
        .bubble-sender {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          margin-bottom: 0.25rem;
        }
        
        .bubble-system-header {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.7rem;
          color: var(--color-primary);
          margin-bottom: 0.25rem;
        }
        
        .system-icon {
          font-size: 0.8rem;
        }
        
        .bubble-text {
          font-size: 0.85rem;
          line-height: 1.4;
          word-break: break-word;
        }
        
        .bubble-time {
          font-size: 0.65rem;
          color: var(--color-text-muted);
          text-align: right;
          margin-top: 0.25rem;
        }
        
        .chat-bubble.divine .bubble-content {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05));
        }
        
        .chat-bubble.ai .bubble-content {
          background: linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(0, 140, 255, 0.05));
        }
        
        @media (prefers-reduced-motion: reduce) {
          .chat-bubble {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
});

ChatBubble.displayName = 'ChatBubble';
