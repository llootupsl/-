import React, { useEffect, useRef } from 'react';
import { TutorialStep as TutorialStepType } from '../../stores/tutorialStore';

interface TutorialStepProps {
  step: TutorialStepType;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const TutorialStep: React.FC<TutorialStepProps> = ({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isFirst,
  isLast,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (step.highlight) {
      const element = document.querySelector(step.highlight) as HTMLElement;
      if (element) {
        highlightRef.current = element;
        element.classList.add('tutorial-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return () => {
      if (highlightRef.current) {
        highlightRef.current.classList.remove('tutorial-highlight');
      }
    };
  }, [step.highlight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!isFirst) {
            onPrev();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onSkip, isFirst]);

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  return (
    <div
      ref={cardRef}
      className="tutorial-step"
      role="dialog"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-description"
      tabIndex={-1}
    >
      <div className="tutorial-step-header">
        <span className="tutorial-step-icon">{step.icon}</span>
        <span className="tutorial-step-number">
          {stepNumber} / {totalSteps}
        </span>
      </div>

      <h2 id="tutorial-title" className="tutorial-step-title">
        {step.title}
      </h2>

      <p id="tutorial-description" className="tutorial-step-description">
        {step.description}
      </p>

      <div className="tutorial-progress-dots">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`tutorial-dot ${i === stepNumber - 1 ? 'active' : ''} ${i < stepNumber - 1 ? 'completed' : ''}`}
          />
        ))}
      </div>

      <div className="tutorial-step-actions">
        <button
          className="tutorial-btn tutorial-btn-skip"
          onClick={onSkip}
          aria-label="跳过引导"
        >
          跳过
        </button>

        <div className="tutorial-btn-group">
          {!isFirst && (
            <button
              className="tutorial-btn tutorial-btn-prev"
              onClick={onPrev}
              aria-label="上一步"
            >
              ← 上一步
            </button>
          )}

          <button
            className="tutorial-btn tutorial-btn-next"
            onClick={onNext}
            aria-label={isLast ? '完成' : '下一步'}
          >
            {isLast ? '开始游戏' : '下一步 →'}
          </button>
        </div>
      </div>

      <div className="tutorial-keyboard-hint">
        <span>Enter 下一步</span>
        <span>ESC 跳过</span>
      </div>
    </div>
  );
};
