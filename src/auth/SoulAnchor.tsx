/**
 * 灵魂锚定组件
 * WebAuthn 灵魂绑定认证 UI
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WebAuthnManager } from './WebAuthnManager';

export interface SoulAnchorProps {
  webAuthnManager: WebAuthnManager;
  onBindingComplete?: (credentialId: string) => void;
  onVerificationComplete?: (verified: boolean) => void;
  className?: string;
  mode?: 'bind' | 'verify' | 'both';
}

interface AnchorStatus {
  phase: 'idle' | 'checking' | 'binding' | 'verifying' | 'success' | 'error';
  message: string;
  progress: number;
  error?: string;
}

const SOUL_PATTERNS = [
  '量子共振', '神经映射', '熵寂印记', '永恒契约', '先知之眼',
  '熵增印记', '零点波动', '超弦共鸣', '暗物质锚', '虚粒子对'
];

export const SoulAnchor: React.FC<SoulAnchorProps> = ({
  webAuthnManager,
  onBindingComplete,
  onVerificationComplete,
  className = '',
  mode = 'both',
}) => {
  const [isBound, setIsBound] = useState(false);
  const [status, setStatus] = useState<AnchorStatus>({
    phase: 'idle',
    message: '等待初始化...',
    progress: 0,
  });
  const [selectedPattern, setSelectedPattern] = useState<string>(SOUL_PATTERNS[0]);
  const [userName, setUserName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    checkBindingStatus();
  }, []);

  const checkBindingStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, phase: 'checking', message: '检测灵魂印记...' }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const hasCredentials = webAuthnManager.hasCredentials();
    setIsBound(hasCredentials);
    
    setStatus({
      phase: 'idle',
      message: hasCredentials ? '灵魂已锚定' : '灵魂尚未锚定',
      progress: hasCredentials ? 100 : 0,
    });
  }, [webAuthnManager]);

  const handleBind = useCallback(async () => {
    if (!userName.trim()) {
      setStatus(prev => ({ 
        ...prev, 
        phase: 'error', 
        error: '请输入灵魂名称' 
      }));
      return;
    }

    setStatus({ phase: 'binding', message: '正在建立灵魂链接...', progress: 10 });

    try {
      // 检查支持
      if (!webAuthnManager.isWebAuthnSupported()) {
        throw new Error('浏览器不支持 WebAuthn 生物识别');
      }

      setStatus(prev => ({ ...prev, message: '正在验证生物特征...', progress: 30 }));
      await new Promise(resolve => setTimeout(resolve, 800));

      setStatus(prev => ({ ...prev, message: '正在锚定灵魂印记...', progress: 60 }));
      
      const credential = await webAuthnManager.register(
        `soul_${Date.now()}`,
        userName,
        `${selectedPattern} - ${userName}`,
        `灵魂锚点 #${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      );

      setStatus(prev => ({ ...prev, message: '锚定成功！', progress: 100 }));
      
      setIsBound(true);
      onBindingComplete?.(credential.credentialId);

      setTimeout(() => {
        setStatus({ phase: 'success', message: '灵魂已永恒锚定', progress: 100 });
      }, 1000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setStatus({ 
        phase: 'error', 
        message: '锚定失败', 
        progress: 0,
        error: errorMessage 
      });
    }
  }, [userName, selectedPattern, webAuthnManager, onBindingComplete]);

  const handleVerify = useCallback(async () => {
    setStatus({ phase: 'verifying', message: '正在验证灵魂印记...', progress: 10 });

    try {
      if (!webAuthnManager.isWebAuthnSupported()) {
        throw new Error('浏览器不支持 WebAuthn 生物识别');
      }

      setStatus(prev => ({ ...prev, message: '请进行生物识别验证...', progress: 40 }));
      
      const result = await webAuthnManager.authenticate();

      if (result.verified) {
        setStatus(prev => ({ ...prev, message: '验证通过！', progress: 100 }));
        onVerificationComplete?.(true);
        
        setTimeout(() => {
          setStatus({ phase: 'success', message: '灵魂共鸣成功', progress: 100 });
        }, 1000);
      } else {
        throw new Error('验证被取消');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setStatus({ 
        phase: 'error', 
        message: '验证失败', 
        progress: 0,
        error: errorMessage 
      });
      onVerificationComplete?.(false);
    }
  }, [webAuthnManager, onVerificationComplete]);

  const handleUnbind = useCallback(async () => {
    const credentials = webAuthnManager.getAllCredentials();
    if (credentials.length > 0) {
      await webAuthnManager.deleteCredential(credentials[0].credentialId);
    }
    setIsBound(false);
    setStatus({ phase: 'idle', message: '灵魂已解绑', progress: 0 });
  }, [webAuthnManager]);

  return (
    <div className={`soul-anchor ${className}`}>
      <style>{`
        .soul-anchor {
          font-family: var(--font-ui, 'Noto Sans SC', sans-serif);
          background: linear-gradient(135deg, rgba(10, 10, 15, 0.95), rgba(20, 20, 30, 0.9));
          border: 1px solid rgba(120, 119, 198, 0.3);
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          color: #e4e4e7;
        }
        .soul-anchor-title {
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 20px;
          background: linear-gradient(90deg, #a78bfa, #818cf8, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .soul-pattern-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin: 16px 0;
        }
        .soul-pattern-btn {
          background: rgba(120, 119, 198, 0.15);
          border: 1px solid rgba(120, 119, 198, 0.3);
          border-radius: 8px;
          padding: 10px;
          color: #a78bfa;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .soul-pattern-btn:hover, .soul-pattern-btn.selected {
          background: rgba(120, 119, 198, 0.3);
          border-color: #a78bfa;
          box-shadow: 0 0 12px rgba(167, 139, 250, 0.3);
        }
        .soul-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(120, 119, 198, 0.3);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          margin: 8px 0;
          box-sizing: border-box;
        }
        .soul-input:focus {
          outline: none;
          border-color: #a78bfa;
          box-shadow: 0 0 8px rgba(167, 139, 250, 0.3);
        }
        .soul-btn {
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 12px;
        }
        .soul-btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
        .soul-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .soul-btn-secondary {
          background: rgba(120, 119, 198, 0.2);
          color: #a78bfa;
          border: 1px solid rgba(120, 119, 198, 0.4);
        }
        .soul-btn-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }
        .soul-progress {
          height: 4px;
          background: rgba(120, 119, 198, 0.2);
          border-radius: 2px;
          margin: 16px 0;
          overflow: hidden;
        }
        .soul-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }
        .soul-status {
          text-align: center;
          padding: 16px;
          font-size: 14px;
          color: #a78bfa;
        }
        .soul-error {
          color: #f87171;
          font-size: 12px;
          margin-top: 8px;
          text-align: center;
        }
        .soul-success {
          color: #4ade80;
          font-size: 12px;
          margin-top: 8px;
          text-align: center;
        }
      `}</style>

      <div className="soul-anchor-title">
        {mode === 'bind' ? '🔗 灵魂锚定' : mode === 'verify' ? '🔐 灵魂验证' : '⚡ 灵魂共鸣'}
      </div>

      <AnimatePresence mode="wait">
        {status.phase === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="soul-status"
          >
            <div style={{ fontSize: 48 }}>✨</div>
            <div>{status.message}</div>
          </motion.div>
        )}

        {status.phase !== 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!isBound && (mode === 'bind' || mode === 'both') && (
              <div>
                <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 8 }}>
                  选择灵魂印记类型
                </div>
                <div className="soul-pattern-grid">
                  {SOUL_PATTERNS.slice(0, 4).map(pattern => (
                    <button
                      key={pattern}
                      className={`soul-pattern-btn ${selectedPattern === pattern ? 'selected' : ''}`}
                      onClick={() => setSelectedPattern(pattern)}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  className="soul-input"
                  placeholder="输入灵魂名称..."
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  maxLength={20}
                />

                <div className="soul-progress">
                  <div className="soul-progress-bar" style={{ width: `${status.progress}%` }} />
                </div>

                <button className="soul-btn soul-btn-primary" onClick={handleBind}>
                  锚定灵魂
                </button>

                {status.error && (
                  <div className="soul-error">{status.error}</div>
                )}
              </div>
            )}

            {isBound && (mode === 'verify' || mode === 'both') && (
              <div>
                <div className="soul-status">
                  <div style={{ fontSize: 32 }}>🎭</div>
                  <div>灵魂印记已锚定</div>
                  <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>
                    {webAuthnManager.getAllCredentials().length} 个锚点
                  </div>
                </div>

                <div className="soul-progress">
                  <div className="soul-progress-bar" style={{ width: `${status.progress}%` }} />
                </div>

                <button className="soul-btn soul-btn-secondary" onClick={handleVerify}>
                  验证灵魂印记
                </button>

                <button className="soul-btn soul-btn-danger" onClick={handleUnbind}>
                  解绑灵魂
                </button>

                {status.error && (
                  <div className="soul-error">{status.error}</div>
                )}
              </div>
            )}

            {status.phase === 'checking' && (
              <div className="soul-status">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ fontSize: 32 }}
                >
                  🌑
                </motion.div>
                <div>{status.message}</div>
              </div>
            )}

            {(status.phase === 'binding' || status.phase === 'verifying') && (
              <div className="soul-status">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ fontSize: 32 }}
                >
                  ⚡
                </motion.div>
                <div>{status.message}</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SoulAnchor;
