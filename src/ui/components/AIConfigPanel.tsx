/**
 * =============================================================================
 * AIConfigPanel AI配置面板 - 外部API配置中心
 * =============================================================================
 */

import React, { useState, useCallback, memo } from 'react';
import { logger } from '../../core/utils/Logger';

/* ==========================================================================
   类型定义
   ========================================================================== */

export type AIProvider = 'openai' | 'anthropic' | 'ollama' | 'webllm' | 'custom';
export type AIModel = string;

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseURL?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  streamEnabled: boolean;
}

export interface AIConfigPanelProps {
  config: AIConfig;
  onConfigChange: (config: Partial<AIConfig>) => void;
  onTestConnection?: () => Promise<boolean>;
  onSave?: () => void;
  className?: string;
}

/* ==========================================================================
   常量
   ========================================================================== */

const PROVIDERS: { id: AIProvider; name: string; icon: string; description: string }[] = [
  { id: 'openai', name: 'OpenAI', icon: '🤖', description: 'GPT-4, GPT-3.5' },
  { id: 'anthropic', name: 'Anthropic', icon: '🧠', description: 'Claude 3, Claude 2' },
  { id: 'ollama', name: 'Ollama', icon: '🦙', description: '本地 LLM' },
  { id: 'webllm', name: 'WebLLM', icon: '⚡', description: '浏览器端本地推理' },
  { id: 'custom', name: '自定义', icon: '🔧', description: '自定义 API 端点' },
];

const MODELS: Record<AIProvider, { id: string; name: string }[]> = {
  openai: [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
  ],
  ollama: [
    { id: 'llama2', name: 'Llama 2' },
    { id: 'mistral', name: 'Mistral' },
    { id: 'codellama', name: 'Code Llama' },
  ],
  webllm: [
    { id: 'Llama-3-8B-Instruct-q4f16_1-MLC', name: 'Llama 3 8B (Q4)' },
    { id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC', name: 'Phi-3 Mini (Q4)' },
    { id: 'Qwen2-7B-Instruct-q4f16_1-MLC', name: 'Qwen2 7B (Q4)' },
  ],
  custom: [
    { id: 'custom-model', name: '自定义模型' },
  ],
};

/* ==========================================================================
   API 密钥输入组件
   ========================================================================== */

interface SecureInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showToggle?: boolean;
}

const SecureInput: React.FC<SecureInputProps> = memo(({ value, onChange, placeholder, showToggle = true }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="secure-input-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showToggle && (
        <button
          type="button"
          className="secure-input-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? '隐藏密钥' : '显示密钥'}
        >
          {visible ? '👁️' : '🔒'}
        </button>
      )}
    </div>
  );
});

SecureInput.displayName = 'SecureInput';

/* ==========================================================================
   配置面板组件
   ========================================================================== */

export const AIConfigPanel: React.FC<AIConfigPanelProps> = memo(
  ({ config, onConfigChange, onTestConnection, onSave, className = '' }) => {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    const handleTest = useCallback(async () => {
      if (!onTestConnection) return;

      setTesting(true);
      setTestResult(null);

      try {
        const success = await onTestConnection();
        setTestResult(success ? 'success' : 'error');
      } catch (error) {
        logger.warn('AIConfigPanel', 'AI connection test failed', error as Error);
        setTestResult('error');
      } finally {
        setTesting(false);
        setTimeout(() => setTestResult(null), 3000);
      }
    }, [onTestConnection]);

    const models = MODELS[config.provider] || [];

    const needsApiKey = ['openai', 'anthropic', 'custom'].includes(config.provider);
    const needsBaseURL = ['ollama', 'custom'].includes(config.provider);
    const needsModel = true;

    return (
      <div className={`ai-config-panel ${className}`}>
        {/* 提供商选择 */}
        <div className="config-section">
          <h3 className="section-title">AI 提供商</h3>
          <div className="provider-grid">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                className={`provider-card ${config.provider === provider.id ? 'active' : ''}`}
                onClick={() => onConfigChange({ provider: provider.id, model: MODELS[provider.id][0]?.id || '' })}
              >
                <span className="provider-icon">{provider.icon}</span>
                <span className="provider-name">{provider.name}</span>
                <span className="provider-desc">{provider.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 连接设置 */}
        <div className="config-section">
          <h3 className="section-title">连接设置</h3>

          {needsApiKey && (
            <div className="config-row">
              <label className="config-label">
                API 密钥
                <span className="config-hint">用于身份验证</span>
              </label>
              <SecureInput
                value={config.apiKey || ''}
                onChange={(v) => onConfigChange({ apiKey: v })}
                placeholder="sk-..."
              />
            </div>
          )}

          {needsBaseURL && (
            <div className="config-row">
              <label className="config-label">
                API 端点
                <span className="config-hint">服务器地址</span>
              </label>
              <input
                type="text"
                className="input"
                value={config.baseURL || ''}
                onChange={(e) => onConfigChange({ baseURL: e.target.value })}
                placeholder={config.provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com'}
              />
            </div>
          )}

          {needsModel && (
            <div className="config-row">
              <label className="config-label">
                模型
                <span className="config-hint">选择要使用的 AI 模型</span>
              </label>
              <select
                className="input select"
                value={config.model}
                onChange={(e) => onConfigChange({ model: e.target.value })}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 生成设置 */}
        <div className="config-section">
          <h3 className="section-title">生成参数</h3>

          <div className="config-row">
            <label className="config-label">
              Temperature
              <span className="config-hint">创造性 (0) - 确定性 (1)</span>
            </label>
            <div className="slider-row">
              <input
                type="range"
                className="slider"
                min={0}
                max={2}
                step={0.1}
                value={config.temperature}
                onChange={(e) => onConfigChange({ temperature: Number(e.target.value) })}
              />
              <span className="slider-value">{config.temperature.toFixed(1)}</span>
            </div>
          </div>

          <div className="config-row">
            <label className="config-label">
              最大 Token 数
              <span className="config-hint">单次响应的最大长度</span>
            </label>
            <div className="slider-row">
              <input
                type="range"
                className="slider"
                min={256}
                max={8192}
                step={256}
                value={config.maxTokens}
                onChange={(e) => onConfigChange({ maxTokens: Number(e.target.value) })}
              />
              <span className="slider-value">{config.maxTokens}</span>
            </div>
          </div>

          <div className="config-row">
            <label className="config-label">
              流式输出
              <span className="config-hint">实时显示生成结果</span>
            </label>
            <button
              role="switch"
              aria-checked={config.streamEnabled}
              className={`toggle-switch ${config.streamEnabled ? 'on' : ''}`}
              onClick={() => onConfigChange({ streamEnabled: !config.streamEnabled })}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="config-actions">
          <button
            className={`btn ${testResult === 'success' ? 'btn-success' : testResult === 'error' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? '测试中...' : testResult === 'success' ? '✓ 连接成功' : testResult === 'error' ? '✗ 连接失败' : '测试连接'}
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            保存配置
          </button>
        </div>
      </div>
    );
  }
);

AIConfigPanel.displayName = 'AIConfigPanel';

/* ==========================================================================
   AI 配置状态管理 Hook
   ========================================================================== */

export const defaultAIConfig: AIConfig = {
  provider: 'webllm',
  model: 'Qwen2-7B-Instruct-q4f16_1-MLC',
  temperature: 0.7,
  maxTokens: 2048,
  streamEnabled: true,
};

export function useAIConfigStore() {
  const [config, setConfig] = useState<AIConfig>(defaultAIConfig);

  const updateConfig = useCallback((updates: Partial<AIConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultAIConfig);
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
  };
}
