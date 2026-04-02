import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useHelpStore } from '../../stores/helpStore';

export type BubblePosition = 'top' | 'bottom' | 'left' | 'right';

export interface FeatureDiscovery {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  icon?: string;
  position?: BubblePosition;
  delay?: number;
  priority?: 'high' | 'medium' | 'low';
}

interface FeatureBubbleProps {
  feature: FeatureDiscovery;
  onDismiss: () => void;
  onHighlight?: () => void;
}

export type { FeatureBubbleProps };

export const FeatureBubble: React.FC<FeatureBubbleProps> = ({
  feature,
  onDismiss,
  onHighlight,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    const target = document.querySelector(feature.targetSelector);
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const bubbleWidth = bubbleRef.current?.offsetWidth || 280;
    const bubbleHeight = bubbleRef.current?.offsetHeight || 150;
    const gap = 12;

    let top = 0;
    let left = 0;
    let arrowTop = 0;
    let arrowLeft = 0;

    const pos = feature.position || 'bottom';

    switch (pos) {
      case 'top':
        top = targetRect.top - bubbleHeight - gap;
        left = targetRect.left + (targetRect.width - bubbleWidth) / 2;
        arrowTop = bubbleHeight - 6;
        arrowLeft = bubbleWidth / 2 - 8;
        break;
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + (targetRect.width - bubbleWidth) / 2;
        arrowTop = -6;
        arrowLeft = bubbleWidth / 2 - 8;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - bubbleHeight) / 2;
        left = targetRect.left - bubbleWidth - gap;
        arrowTop = bubbleHeight / 2 - 8;
        arrowLeft = bubbleWidth - 6;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - bubbleHeight) / 2;
        left = targetRect.right + gap;
        arrowTop = bubbleHeight / 2 - 8;
        arrowLeft = -6;
        break;
    }

    if (left < 20) left = 20;
    if (left + bubbleWidth > window.innerWidth - 20) {
      left = window.innerWidth - bubbleWidth - 20;
    }
    if (top < 20) top = 20;
    if (top + bubbleHeight > window.innerHeight - 20) {
      top = window.innerHeight - bubbleHeight - 20;
    }

    setPosition({ top, left });
    setArrowPosition({ top: arrowTop, left: arrowLeft });
  }, [feature.targetSelector, feature.position]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculatePosition();
      setVisible(true);
      onHighlight?.();
    }, feature.delay || 500);

    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [calculatePosition, feature.delay, onHighlight]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 200);
  };

  const pos = feature.position || 'bottom';

  return createPortal(
    <div
      ref={bubbleRef}
      className={`feature-bubble ${visible ? 'visible' : ''} position-${pos}`}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div
        className="feature-bubble-arrow"
        style={{
          top: arrowPosition.top,
          left: arrowPosition.left,
        }}
      />
      <div className="feature-bubble-content">
        <div className="feature-bubble-header">
          {feature.icon && (
            <span className="feature-bubble-icon">{feature.icon}</span>
          )}
          <h4 className="feature-bubble-title">{feature.title}</h4>
        </div>
        <p className="feature-bubble-description">{feature.description}</p>
        <div className="feature-bubble-actions">
          <button
            className="feature-bubble-dismiss"
            onClick={handleDismiss}
            aria-label="知道了"
          >
            知道了
          </button>
        </div>
      </div>
      <style>{`
        .feature-bubble {
          position: fixed;
          z-index: 10001;
          width: 280px;
          background: var(--bg-overlay, #0C2035);
          border: 1px solid var(--accent, #1AEFFB);
          border-radius: var(--radius-lg, 12px);
          box-shadow: 0 0 30px rgba(26, 239, 251, 0.3), var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.8));
          opacity: 0;
          transform: scale(0.9) translateY(10px);
          transition: all 0.3s ease-out;
          pointer-events: none;
        }

        .feature-bubble.visible {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }

        .feature-bubble.position-top {
          transform-origin: bottom center;
        }

        .feature-bubble.position-bottom {
          transform-origin: top center;
        }

        .feature-bubble.position-left {
          transform-origin: right center;
        }

        .feature-bubble.position-right {
          transform-origin: left center;
        }

        .feature-bubble-arrow {
          position: absolute;
          width: 16px;
          height: 16px;
          background: var(--bg-overlay, #0C2035);
          border: 1px solid var(--accent, #1AEFFB);
          transform: rotate(45deg);
        }

        .feature-bubble.position-top .feature-bubble-arrow {
          border-top: none;
          border-left: none;
        }

        .feature-bubble.position-bottom .feature-bubble-arrow {
          border-bottom: none;
          border-right: none;
        }

        .feature-bubble.position-left .feature-bubble-arrow {
          border-bottom: none;
          border-left: none;
        }

        .feature-bubble.position-right .feature-bubble-arrow {
          border-top: none;
          border-right: none;
        }

        .feature-bubble-content {
          position: relative;
          z-index: 1;
          padding: 1rem;
        }

        .feature-bubble-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .feature-bubble-icon {
          font-size: 1.25rem;
        }

        .feature-bubble-title {
          font-family: var(--font-display, 'ZCOOL QingKe HuangYou', sans-serif);
          font-size: 1rem;
          font-weight: 700;
          color: var(--accent, #1AEFFB);
          letter-spacing: 0.05em;
          margin: 0;
        }

        .feature-bubble-description {
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--text-secondary, rgba(214, 248, 255, 0.65));
          margin: 0 0 1rem;
        }

        .feature-bubble-actions {
          display: flex;
          justify-content: flex-end;
        }

        .feature-bubble-dismiss {
          padding: 0.5rem 1rem;
          background: var(--accent, #1AEFFB);
          border: none;
          border-radius: var(--radius-md, 8px);
          color: var(--bg-void, #040C14);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .feature-bubble-dismiss:hover {
          box-shadow: 0 0 15px rgba(26, 239, 251, 0.5);
          transform: translateY(-1px);
        }

        @media (prefers-reduced-motion: reduce) {
          .feature-bubble {
            transition: none;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

interface FeatureDiscoveryManagerProps {
  features?: FeatureDiscovery[];
  autoShow?: boolean;
  onComplete?: () => void;
}

export const FeatureDiscoveryManager: React.FC<FeatureDiscoveryManagerProps> = ({
  features = DEFAULT_FEATURES,
  autoShow = true,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const { markFeatureDiscovered, isFeatureDiscovered } = useHelpStore();

  const pendingFeatures = features.filter((f) => !isFeatureDiscovered(f.id));
  const currentFeature = pendingFeatures[currentIndex];

  useEffect(() => {
    if (!autoShow || pendingFeatures.length === 0) return;

    const timer = setTimeout(() => {
      setCurrentIndex(0);
    }, 2000);

    return () => clearTimeout(timer);
  }, [autoShow, pendingFeatures.length]);

  useEffect(() => {
    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('feature-highlight');
      }
    };
  }, [highlightedElement]);

  const handleHighlight = useCallback(() => {
    if (!currentFeature) return;

    if (highlightedElement) {
      highlightedElement.classList.remove('feature-highlight');
    }

    const target = document.querySelector(currentFeature.targetSelector) as HTMLElement;
    if (target) {
      target.classList.add('feature-highlight');
      setHighlightedElement(target);
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentFeature, highlightedElement]);

  const handleDismiss = useCallback(() => {
    if (!currentFeature) return;

    markFeatureDiscovered(currentFeature.id);

    if (highlightedElement) {
      highlightedElement.classList.remove('feature-highlight');
      setHighlightedElement(null);
    }

    if (currentIndex < pendingFeatures.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete?.();
    }
  }, [currentFeature, markFeatureDiscovered, highlightedElement, currentIndex, pendingFeatures.length, onComplete]);

  if (!currentFeature) return null;

  return (
    <>
      <FeatureBubble
        feature={currentFeature}
        onDismiss={handleDismiss}
        onHighlight={handleHighlight}
      />
      <style>{`
        .feature-highlight {
          position: relative;
          z-index: 10000;
          animation: featureHighlightPulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 0 3px rgba(26, 239, 251, 0.5), 0 0 20px rgba(26, 239, 251, 0.3);
          border-radius: var(--radius-md, 8px);
        }

        @keyframes featureHighlightPulse {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(26, 239, 251, 0.5), 0 0 20px rgba(26, 239, 251, 0.3);
          }
          50% {
            box-shadow: 0 0 0 5px rgba(26, 239, 251, 0.7), 0 0 30px rgba(26, 239, 251, 0.5);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .feature-highlight {
            animation: none;
          }
        }
      `}</style>
    </>
  );
};

export const DEFAULT_FEATURES: FeatureDiscovery[] = [
  {
    id: 'help-button',
    targetSelector: '.help-trigger-btn',
    title: '帮助系统',
    description: '点击这里或按 H 键打开帮助面板，查看游戏指南和操作说明。',
    icon: '❓',
    position: 'bottom',
    priority: 'high',
  },
  {
    id: 'citizen-panel',
    targetSelector: '.quick-btn:first-child',
    title: '市民管理',
    description: '点击查看所有市民信息，管理他们的需求和社会关系。',
    icon: '👥',
    position: 'top',
    delay: 500,
    priority: 'high',
  },
  {
    id: 'divine-panel',
    targetSelector: '.quick-btn:nth-child(2)',
    title: '神力干预',
    description: '使用观测值施放神力，影响文明进程和市民命运。',
    icon: '✨',
    position: 'top',
    delay: 500,
    priority: 'high',
  },
  {
    id: 'dao-panel',
    targetSelector: '.quick-btn:nth-child(3)',
    title: 'DAO治理',
    description: '参与民主投票，制定法案引导文明发展方向。',
    icon: '📜',
    position: 'top',
    delay: 500,
    priority: 'medium',
  },
  {
    id: 'entropy-bar',
    targetSelector: '.entropy-bar-container',
    title: '熵值监控',
    description: '熵值是宇宙走向终结的倒计时，通过科技和神力减缓熵增。',
    icon: '🌡️',
    position: 'bottom',
    delay: 500,
    priority: 'high',
  },
  {
    id: 'resource-overview',
    targetSelector: '.resource-overview',
    title: '资源概览',
    description: '监控五大核心资源，保持资源平衡避免文明崩溃。',
    icon: '⚡',
    position: 'bottom',
    delay: 500,
    priority: 'high',
  },
];

export const useFeatureDiscovery = () => {
  const { markFeatureDiscovered, isFeatureDiscovered } = useHelpStore();

  const showFeature = useCallback((feature: FeatureDiscovery) => {
    if (!isFeatureDiscovered(feature.id)) {
      return true;
    }
    return false;
  }, [isFeatureDiscovered]);

  const dismissFeature = useCallback((featureId: string) => {
    markFeatureDiscovered(featureId);
  }, [markFeatureDiscovered]);

  return {
    showFeature,
    dismissFeature,
    isFeatureDiscovered,
  };
};

export default FeatureDiscoveryManager;
