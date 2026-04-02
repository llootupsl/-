/**
 * 加载屏幕组件 - 增强版
 * 支持详细步骤显示、进度百分比、错误重试
 */
import React, { useMemo } from 'react';

export type LoadingStepStatus = 'pending' | 'loading' | 'success' | 'error';

export interface LoadingStep {
  id: string;
  name: string;
  description: string;
  status: LoadingStepStatus;
  progress: number;
  error?: string;
}

export interface BackgroundLoadingState {
  isActive: boolean;
  progress: number;
  currentModule: string;
  loadedModules: string[];
  totalModules: number;
}

export interface LoadingScreenProps {
  progress: number;
  status: string;
  steps?: LoadingStep[];
  error?: string | null | { message: string; friendlyMessage?: string } | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  backgroundLoading?: BackgroundLoadingState;
  isComplete?: boolean;
  allowEmergencyStart?: boolean;
  onEmergencyStart?: () => void;
}

const STEP_ICONS: Record<string, string> = {
  wasm: '⚡',
  citizen: '👥',
  economy: '💰',
  system: '⚙️',
  audio: '�',
  ai: '🤖',
  social: '🌐',
  divine: '✨',
  p2p: '�',
  eyeTracker: '�️',
  haptics: '�',
  sync: '🔄',
  observation: '👁️',
  dao: '📜',
  tech: '🔬',
  genome: '🧬',
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  status,
  steps = [],
  error,
  onRetry,
  isRetrying = false,
  backgroundLoading,
  isComplete = false,
  allowEmergencyStart = false,
  onEmergencyStart,
}) => {
  const coreSteps = useMemo(() => 
    steps.filter(s => ['wasm', 'citizen', 'economy', 'system'].includes(s.id)),
    [steps]
  );
  
  const backgroundSteps = useMemo(() => 
    steps.filter(s => !['wasm', 'citizen', 'economy', 'system'].includes(s.id)),
    [steps]
  );

  const completedCoreSteps = useMemo(() => 
    coreSteps.filter(s => s.status === 'success').length, 
    [coreSteps]
  );

  const completedBgSteps = useMemo(() => 
    backgroundSteps.filter(s => s.status === 'success').length, 
    [backgroundSteps]
  );
  
  const totalSteps = steps.length || 1;
  const hasError = error || steps.some(s => s.status === 'error');
  
  const getErrorMessage = (): string => {
    if (!error) return '初始化过程中发生错误';
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && 'friendlyMessage' in error) return error.friendlyMessage || error.message;
    return '初始化过程中发生错误';
  };

  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-label="加载中">
      <div className="loading-content">
        <div className="loading-header">
          <div className="loading-logo">永夜熵纪</div>
          <div className="loading-subtitle">OMNIS APIEN</div>
        </div>

        <div className="loading-spinner-container">
          <div className="loading-spinner" />
          <div className="loading-percentage">{Math.round(progress)}%</div>
        </div>

        <div className="loading-main-progress">
          <div className="loading-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div className="loading-progress-bar" style={{ width: `${progress}%` }} />
            <div className="loading-progress-glow" style={{ left: `${progress}%` }} />
          </div>
          <div className="loading-status">{status}</div>
        </div>

        {coreSteps.length > 0 && (
          <div className="loading-steps">
            <div className="loading-steps-header">
              <span className="steps-title">核心模块初始化</span>
              <span className="steps-count">{completedCoreSteps}/{coreSteps.length}</span>
            </div>
            <div className="loading-steps-list">
              {coreSteps.map((step) => (
                <div key={step.id} className={`loading-step loading-step--${step.status}`}>
                  <div className="step-icon">
                    {step.status === 'loading' && (
                      <span className="step-spinner" />
                    )}
                    {step.status === 'success' && '✓'}
                    {step.status === 'error' && '✗'}
                    {step.status === 'pending' && (
                      <span className="step-pending">○</span>
                    )}
                  </div>
                  <div className="step-info">
                    <div className="step-name">
                      <span className="step-emoji">{STEP_ICONS[step.id] || '◈'}</span>
                      {step.name}
                    </div>
                    <div className="step-description">{step.description}</div>
                    {step.status === 'error' && step.error && (
                      <div className="step-error">{step.error}</div>
                    )}
                  </div>
                  <div className="step-progress">
                    {step.status === 'loading' && (
                      <>
                        <div className="step-progress-bar">
                          <div className="step-progress-fill" style={{ width: `${step.progress}%` }} />
                        </div>
                        <span className="step-progress-text">{step.progress}%</span>
                      </>
                    )}
                    {step.status === 'success' && (
                      <span className="step-done">完成</span>
                    )}
                    {step.status === 'error' && (
                      <span className="step-failed">失败</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isComplete && backgroundLoading && (
          <div className="loading-background-section">
            <div className="background-header">
              <span className="background-title">后台模块加载</span>
              <span className="background-count">{completedBgSteps}/{backgroundSteps.length}</span>
            </div>
            {backgroundLoading.isActive && (
              <div className="background-progress">
                <div className="background-progress-bar">
                  <div className="background-progress-fill" style={{ width: `${backgroundLoading.progress}%` }} />
                </div>
                <span className="background-status">
                  正在加载: {STEP_ICONS[backgroundLoading.currentModule] || ''} {backgroundLoading.currentModule}
                </span>
              </div>
            )}
            <div className="background-modules">
              {backgroundSteps.slice(0, 4).map((step) => (
                <div key={step.id} className={`background-module ${step.status === 'success' ? 'loaded' : ''}`}>
                  <span className="module-icon">{STEP_ICONS[step.id] || '◈'}</span>
                  <span className="module-name">{step.name}</span>
                  {step.status === 'success' && <span className="module-check">✓</span>}
                  {step.status === 'loading' && <span className="module-loading">●</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasError && onRetry && (
          <div className="loading-error-section">
            <div className="loading-error-message">
              <span className="error-icon">⚠️</span>
              <span>{getErrorMessage()}</span>
            </div>
            <button 
              className="loading-retry-btn" 
              onClick={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <span className="retry-spinner" />
                  重试中...
                </>
              ) : (
                <>
                  <span className="retry-icon">↻</span>
                  重试初始化
                </>
              )}
            </button>
          </div>
        )}

        {allowEmergencyStart && onEmergencyStart && !hasError && (
          <div className="loading-emergency-section">
            <div className="loading-emergency-message">
              初始化时间较长，你可以先进入安全启动模式。
            </div>
            <button className="loading-emergency-btn" onClick={onEmergencyStart}>
              进入安全启动
            </button>
          </div>
        )}

        <div className="loading-footer">
          <div className="loading-tips">
            <span className="tip-icon">💡</span>
            <span className="tip-text">提示：首次加载可能需要较长时间，请耐心等待</span>
          </div>
        </div>
      </div>

      <span className="visually-hidden">正在加载: {status}</span>

      <style>{`
        .loading-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-void);
          z-index: 100;
          overflow: auto;
          padding: 2rem;
        }

        .loading-content {
          width: 100%;
          max-width: 560px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .loading-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .loading-logo {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 7vw, 4.5rem);
          color: var(--accent);
          text-shadow: 0 0 30px var(--accent), 0 0 60px var(--accent);
          letter-spacing: 0.3em;
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .loading-subtitle {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--text-secondary);
          letter-spacing: 0.5em;
          margin-top: 0.5rem;
          opacity: 0.7;
        }

        .loading-spinner-container {
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 1.5rem;
        }

        .loading-spinner {
          position: absolute;
          inset: 0;
          border: 2px solid var(--bg-elevated);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-percentage {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--accent);
        }

        .loading-main-progress {
          width: 100%;
          margin-bottom: 2rem;
        }

        .loading-progress {
          width: 100%;
          height: 4px;
          background: var(--bg-elevated);
          border-radius: 2px;
          overflow: visible;
          position: relative;
        }

        .loading-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--color-chaos));
          border-radius: 2px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px var(--accent);
        }

        .loading-progress-glow {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 20px var(--accent), 0 0 40px var(--accent);
          animation: glow-pulse 1s ease-in-out infinite;
        }

        .loading-status {
          text-align: center;
          margin-top: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .loading-steps {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .loading-steps-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(26, 239, 251, 0.03);
          border-bottom: 1px solid var(--border-default);
        }

        .steps-title {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .steps-count {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--accent);
        }

        .loading-steps-list {
          max-height: 280px;
          overflow-y: auto;
        }

        .loading-step {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-default);
          transition: background 0.2s ease;
        }

        .loading-step:last-child {
          border-bottom: none;
        }

        .loading-step--loading {
          background: rgba(26, 239, 251, 0.03);
        }

        .loading-step--error {
          background: rgba(255, 56, 103, 0.05);
        }

        .loading-step--success {
          opacity: 0.7;
        }

        .step-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .loading-step--success .step-icon {
          color: var(--color-hope);
        }

        .loading-step--error .step-icon {
          color: var(--color-unrest);
        }

        .loading-step--loading .step-icon {
          color: var(--accent);
        }

        .step-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--bg-elevated);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .step-pending {
          color: var(--text-muted);
        }

        .step-info {
          flex: 1;
          min-width: 0;
        }

        .step-name {
          font-size: 0.85rem;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .step-emoji {
          font-size: 0.9rem;
        }

        .step-description {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }

        .step-error {
          font-size: 0.75rem;
          color: var(--color-unrest);
          margin-top: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 56, 103, 0.1);
          border-radius: var(--radius-sm);
        }

        .step-progress {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
          min-width: 70px;
        }

        .step-progress-bar {
          width: 60px;
          height: 3px;
          background: var(--bg-elevated);
          border-radius: 2px;
          overflow: hidden;
        }

        .step-progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          transition: width 0.2s ease;
        }

        .step-progress-text {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--accent);
        }

        .step-done {
          font-size: 0.75rem;
          color: var(--color-hope);
        }

        .step-failed {
          font-size: 0.75rem;
          color: var(--color-unrest);
        }

        .loading-error-section {
          width: 100%;
          padding: 1rem;
          background: rgba(255, 56, 103, 0.08);
          border: 1px solid rgba(255, 56, 103, 0.3);
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
        }

        .loading-error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--color-unrest);
          margin-bottom: 0.75rem;
        }

        .error-icon {
          font-size: 1rem;
        }

        .loading-retry-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--color-unrest);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .loading-retry-btn:hover:not(:disabled) {
          background: #ff5277;
          box-shadow: 0 0 20px rgba(255, 56, 103, 0.4);
        }

        .loading-retry-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .retry-icon {
          font-size: 1.1rem;
        }

        .retry-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-footer {
          width: 100%;
        }

        .loading-emergency-section {
          width: 100%;
          margin-bottom: 1rem;
          padding: 0.85rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          background: rgba(255, 214, 0, 0.08);
        }

        .loading-emergency-message {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.65rem;
        }

        .loading-emergency-btn {
          width: 100%;
          border: 1px solid var(--color-energy);
          border-radius: var(--radius-md);
          background: rgba(255, 214, 0, 0.1);
          color: var(--color-energy);
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.65rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .loading-emergency-btn:hover {
          background: rgba(255, 214, 0, 0.18);
        }

        .loading-tips {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(26, 239, 251, 0.03);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
        }

        .tip-icon {
          font-size: 0.9rem;
        }

        .tip-text {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .loading-background-section {
          width: 100%;
          background: rgba(26, 239, 251, 0.02);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .background-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 1rem;
          background: rgba(26, 239, 251, 0.05);
          border-bottom: 1px solid var(--border-default);
        }

        .background-title {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .background-count {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--accent);
        }

        .background-progress {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-default);
        }

        .background-progress-bar {
          width: 100%;
          height: 3px;
          background: var(--bg-elevated);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .background-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--color-chaos));
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .background-status {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .background-modules {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          padding: 0.75rem 1rem;
        }

        .background-module {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.6rem;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .background-module.loaded {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-hope);
        }

        .module-icon {
          font-size: 0.85rem;
        }

        .module-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .module-check {
          color: var(--color-hope);
          font-weight: 600;
        }

        .module-loading {
          color: var(--accent);
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes pulse-glow {
          0%, 100% {
            text-shadow: 0 0 30px var(--accent), 0 0 60px var(--accent);
          }
          50% {
            text-shadow: 0 0 50px var(--accent), 0 0 100px var(--accent), 0 0 150px var(--color-chaos);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes glow-pulse {
          0%, 100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }

        @media (max-width: 480px) {
          .loading-content {
            padding: 0 0.5rem;
          }

          .loading-step {
            padding: 0.5rem 0.75rem;
          }

          .step-description {
            display: none;
          }

          .step-progress {
            min-width: 50px;
          }

          .step-progress-bar {
            width: 40px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-spinner,
          .step-spinner,
          .retry-spinner {
            animation: none;
          }

          .loading-logo {
            animation: none;
          }

          .loading-progress-glow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
