import React, { useEffect, useCallback, useRef } from 'react';
import { useTutorialStore, TUTORIAL_STEPS } from '../../stores/tutorialStore';
import { TutorialStep } from './TutorialStep';

interface TutorialManagerProps {
  onAction?: (action: string) => void;
}

export const TutorialManager: React.FC<TutorialManagerProps> = ({ onAction }) => {
  const {
    isActive,
    currentStep,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
  } = useTutorialStore();

  const prevStepRef = useRef(currentStep);

  const handleNext = useCallback(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (step?.action && onAction) {
      onAction(step.action);
    }
    nextStep();
  }, [currentStep, nextStep, onAction]);

  const handleSkip = useCallback(() => {
    skipTutorial();
  }, [skipTutorial]);

  const handleComplete = useCallback(() => {
    completeTutorial();
  }, [completeTutorial]);

  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div className="tutorial-overlay" role="presentation">
      <div className="tutorial-backdrop" onClick={handleSkip} />
      <TutorialStep
        step={step}
        stepNumber={currentStep + 1}
        totalSteps={TUTORIAL_STEPS.length}
        onNext={isLast ? handleComplete : handleNext}
        onPrev={prevStep}
        onSkip={handleSkip}
        isFirst={isFirst}
        isLast={isLast}
      />
    </div>
  );
};

export const TutorialRestartButton: React.FC = () => {
  const { completed, skipped, resetTutorial } = useTutorialStore();

  if (!completed && !skipped) {
    return null;
  }

  return (
    <button
      className="tutorial-restart-btn"
      onClick={resetTutorial}
      aria-label="重新开始引导"
      title="重新开始引导"
    >
      <span className="tutorial-restart-icon">❓</span>
      <span className="tutorial-restart-text">引导</span>
    </button>
  );
};

export default TutorialManager;
