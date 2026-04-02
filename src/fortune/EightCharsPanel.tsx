/**
 * =============================================================================
 * 八字命理 UI 面板
 * =============================================================================
 */

import React, { useState, useCallback, memo } from 'react';
import { Tabs } from '../ui/components/Tabs';
import { Modal } from '../ui/components/Modal';
import { EightCharactersCalculator, EightCharactersAnalysis, EightCharacters, STEM_WUXING, BRANCH_WUXING } from './EightCharactersCalculator';
import { FortuneTeller, FortuneResult, FortuneType } from './FortuneTeller';

/* ==========================================================================
   类型定义
   ========================================================================== */

interface EightCharsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  birthDate?: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute?: number;
    isLunar?: boolean;
  };
  className?: string;
}

/* ==========================================================================
   常量
   ========================================================================== */

const WUXING_ICONS: Record<string, string> = {
  木: '🌲',
  火: '🔥',
  土: '🏔️',
  金: '⚔️',
  水: '💧',
};

const WUXING_COLORS: Record<string, string> = {
  木: '#00ff88',
  火: '#ff4444',
  土: '#daa520',
  金: '#ffd700',
  水: '#00bfff',
};

/* ==========================================================================
   八字展示组件
   ========================================================================== */

const EightCharsDisplay: React.FC<{ eightChars: EightCharacters; analysis: EightCharactersAnalysis }> = ({ eightChars, analysis }) => {
  const renderPillar = (title: string, pillar: { stem: string; branch: string }) => {
    const stemWx = STEM_WUXING[pillar.stem];
    const branchWx = BRANCH_WUXING[pillar.branch];
    
    return (
      <div className="pillar">
        <div className="pillar-title">{title}</div>
        <div className="pillar-content">
          <div className="pillar-stem" style={{ color: WUXING_COLORS[stemWx] }}>
            <span className="pillar-char">{pillar.stem}</span>
            <span className="pillar-wx">{WUXING_ICONS[stemWx]}</span>
          </div>
          <div className="pillar-branch" style={{ color: WUXING_COLORS[branchWx] }}>
            <span className="pillar-char">{pillar.branch}</span>
            <span className="pillar-wx">{WUXING_ICONS[branchWx]}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="eight-chars-display">
      <h3 className="section-title">八字命盘</h3>
      <div className="pillars-container">
        {renderPillar('年柱', eightChars.year)}
        {renderPillar('月柱', eightChars.month)}
        <div className="pillar pillar-day">
          <div className="pillar-title">日柱</div>
          <div className="pillar-content">
            <div className="pillar-stem" style={{ color: WUXING_COLORS[analysis.dayStemWuxing] }}>
              <span className="pillar-char">{eightChars.day.stem}</span>
              <span className="pillar-wx">{WUXING_ICONS[analysis.dayStemWuxing]}</span>
            </div>
            <div className="pillar-branch" style={{ color: WUXING_COLORS[BRANCH_WUXING[eightChars.day.branch]] }}>
              <span className="pillar-char">{eightChars.day.branch}</span>
              <span className="pillar-wx">{WUXING_ICONS[BRANCH_WUXING[eightChars.day.branch]]}</span>
            </div>
          </div>
          <div className="pillar-label">命主</div>
        </div>
        {renderPillar('时柱', eightChars.hour)}
      </div>
    </div>
  );
};

/* ==========================================================================
   五行分布组件
   ========================================================================== */

const WuxingDistribution: React.FC<{ distribution: Record<string, number> }> = ({ distribution }) => {
  const maxValue = Math.max(...Object.values(distribution), 1);
  
  return (
    <div className="wuxing-distribution">
      <h3 className="section-title">五行分布</h3>
      <div className="wuxing-bars">
        {Object.entries(distribution).map(([wx, value]) => (
          <div key={wx} className="wuxing-bar-item">
            <span className="wuxing-icon">{WUXING_ICONS[wx]}</span>
            <div className="wuxing-bar">
              <div 
                className="wuxing-bar-fill" 
                style={{ 
                  width: `${(value / maxValue) * 100}%`,
                  backgroundColor: WUXING_COLORS[wx],
                }}
              />
            </div>
            <span className="wuxing-value" style={{ color: WUXING_COLORS[wx] }}>
              {value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   强弱分析组件
   ========================================================================== */

const StrengthAnalysis: React.FC<{ analysis: EightCharactersAnalysis['strengthAnalysis'] }> = ({ analysis }) => {
  const scoreColor = analysis.score > 0 ? '#00ff88' : analysis.score < 0 ? '#ff4444' : '#888';
  
  return (
    <div className="strength-analysis">
      <h3 className="section-title">旺衰分析</h3>
      <div className="strength-score">
        <div className="score-circle" style={{ borderColor: scoreColor }}>
          <span className="score-value" style={{ color: scoreColor }}>{analysis.score}</span>
        </div>
        <div className="score-label">{analysis.verdict}</div>
      </div>
      <div className="strength-details">
        <div className="detail-row">
          <span className="detail-label">喜用五行</span>
          <span className="detail-value xi">{analysis.xiYong.join('、')}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">忌讳五行</span>
          <span className="detail-value ji">{analysis.jiHuan.join('、')}</span>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   运势卡片组件
   ========================================================================== */

const FortuneCard: React.FC<{ fortune: FortuneResult }> = ({ fortune }) => {
  const icons: Record<FortuneType, string> = {
    overall: '☯️',
    career: '💼',
    wealth: '💰',
    love: '❤️',
    health: '🏥',
    study: '📚',
  };
  
  const typeNames: Record<FortuneType, string> = {
    overall: '综合运势',
    career: '事业运势',
    wealth: '财富运势',
    love: '感情运势',
    health: '健康运势',
    study: '学业运势',
  };

  return (
    <div className="fortune-card">
      <div className="fortune-header">
        <span className="fortune-icon">{icons[fortune.type]}</span>
        <span className="fortune-type">{typeNames[fortune.type]}</span>
        <span className="fortune-level">{fortune.level}</span>
      </div>
      <div className="fortune-score">
        <div className="score-bar">
          <div 
            className="score-fill" 
            style={{ width: `${fortune.score}%` }}
          />
        </div>
        <span className="score-number">{fortune.score}</span>
      </div>
      <p className="fortune-summary">{fortune.summary}</p>
      <div className="fortune-lucky">
        <div className="lucky-item">
          <span className="lucky-label">幸运方位</span>
          <span className="lucky-value">{fortune.luckyDirections?.join(', ')}</span>
        </div>
        <div className="lucky-item">
          <span className="lucky-label">幸运颜色</span>
          <span className="lucky-value">{fortune.luckyColors?.slice(0, 2).join(', ')}</span>
        </div>
        <div className="lucky-item">
          <span className="lucky-label">幸运数字</span>
          <span className="lucky-value">{fortune.luckyNumbers?.slice(0, 4).join(', ')}</span>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   主面板组件
   ========================================================================== */

export const EightCharsPanel: React.FC<EightCharsPanelProps> = memo(({
  isOpen,
  onClose,
  birthDate = {
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
  },
  className = '',
}) => {
  const [birthInput, setBirthInput] = useState(birthDate);

  // 计算八字
  const eightChars = EightCharactersCalculator.calculate(
    birthInput.year,
    birthInput.month,
    birthInput.day,
    birthInput.hour,
    birthInput.minute ?? 0,
    birthInput.isLunar
  );

  // 分析八字
  const analysis = EightCharactersCalculator.analyze(eightChars);

  // 创建命理推算器
  const fortuneTeller = new FortuneTeller(analysis);

  // 计算各类运势
  const fortunes = [
    fortuneTeller.calculateOverall(),
    fortuneTeller.calculateCareer(),
    fortuneTeller.calculateWealth(),
    fortuneTeller.calculateLove(),
    fortuneTeller.calculateHealth(),
    fortuneTeller.calculateStudy(),
  ];

  const tabs = [
    { key: 'bazi', label: '八字', icon: '📜', content: (
      <div className="tab-content-bazi">
        <EightCharsDisplay eightChars={eightChars} analysis={analysis} />
        <WuxingDistribution distribution={analysis.wuxingDistribution} />
        <StrengthAnalysis analysis={analysis.strengthAnalysis} />
      </div>
    )},
    { key: 'yunshi', label: '运势', icon: '🔮', content: (
      <div className="tab-content-yunshi">
        <div className="fortunes-grid">
          {fortunes.map((fortune) => (
            <FortuneCard key={fortune.type} fortune={fortune} />
          ))}
        </div>
      </div>
    )},
    { key: 'info', label: '信息', icon: 'ℹ️', content: (
      <div className="tab-content-info">
        <div className="info-form">
          <h3 className="section-title">出生信息</h3>
          <div className="form-row">
            <label>年份</label>
            <input 
              type="number" 
              className="input"
              value={birthInput.year}
              onChange={(e) => setBirthInput(prev => ({ ...prev, year: parseInt(e.target.value) || 1990 }))}
            />
          </div>
          <div className="form-row">
            <label>月份</label>
            <input 
              type="number" 
              className="input"
              value={birthInput.month}
              min={1}
              max={12}
              onChange={(e) => setBirthInput(prev => ({ ...prev, month: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="form-row">
            <label>日期</label>
            <input 
              type="number" 
              className="input"
              value={birthInput.day}
              min={1}
              max={31}
              onChange={(e) => setBirthInput(prev => ({ ...prev, day: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="form-row">
            <label>时辰 (小时)</label>
            <input 
              type="number" 
              className="input"
              value={birthInput.hour}
              min={0}
              max={23}
              onChange={(e) => setBirthInput(prev => ({ ...prev, hour: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="form-row">
            <label>
              <input 
                type="checkbox"
                checked={birthInput.isLunar}
                onChange={(e) => setBirthInput(prev => ({ ...prev, isLunar: e.target.checked }))}
              />
              农历
            </label>
          </div>
        </div>
        <div className="gods-analysis">
          <h3 className="section-title">十神分析</h3>
          <div className="gods-grid">
            {analysis.godsAnalysis.list.map((god, i) => (
              <div key={i} className="god-item">
                <span className="god-type">{god.type}</span>
                <span className="god-name">{god.name}</span>
                <span className="god-stem">{god.stem}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )},
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="八字命理"
      size="xl"
    >
      <div className={`eight-chars-panel ${className}`}>
        <Tabs tabs={tabs} type="card" />
      </div>
      
      <style>{`
        .eight-chars-panel {
          padding: 1rem;
        }
        
        .tab-content-bazi,
        .tab-content-yunshi,
        .tab-content-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1rem 0;
        }
        
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-primary);
          margin-bottom: 0.75rem;
        }
        
        /* 八字展示 */
        .pillars-container {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--color-bg-surface);
          border-radius: var(--radius-lg);
        }
        
        .pillar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem;
          min-width: 60px;
        }
        
        .pillar-title {
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }
        
        .pillar-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .pillar-stem,
        .pillar-branch {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          font-family: var(--font-display);
          font-size: 1.5rem;
        }
        
        .pillar-wx {
          font-size: 0.8rem;
        }
        
        .pillar-day {
          position: relative;
        }
        
        .pillar-label {
          position: absolute;
          bottom: -1rem;
          font-size: 0.6rem;
          color: var(--color-primary);
          background: var(--color-bg-elevated);
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-primary);
        }
        
        /* 五行分布 */
        .wuxing-bars {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .wuxing-bar-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .wuxing-icon {
          width: 24px;
          text-align: center;
        }
        
        .wuxing-bar {
          flex: 1;
          height: 8px;
          background: var(--color-bg-overlay);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .wuxing-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .wuxing-value {
          width: 40px;
          text-align: right;
          font-family: var(--font-mono);
          font-size: 0.8rem;
        }
        
        /* 强弱分析 */
        .strength-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .score-value {
          font-family: var(--font-display);
          font-size: 1.5rem;
        }
        
        .score-label {
          font-size: 1rem;
          color: var(--color-text-primary);
        }
        
        .strength-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
        }
        
        .detail-label {
          color: var(--color-text-muted);
        }
        
        .detail-value.xi {
          color: var(--color-success);
        }
        
        .detail-value.ji {
          color: var(--color-danger);
        }
        
        /* 运势卡片 */
        .fortunes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .fortune-card {
          padding: 1rem;
          background: var(--color-bg-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-bg-overlay);
        }
        
        .fortune-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .fortune-icon {
          font-size: 1.25rem;
        }
        
        .fortune-type {
          flex: 1;
          font-weight: 600;
        }
        
        .fortune-level {
          padding: 0.2rem 0.5rem;
          background: var(--color-bg-overlay);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
        }
        
        .fortune-score {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .score-bar {
          flex: 1;
          height: 4px;
          background: var(--color-bg-overlay);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
        }
        
        .score-number {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--color-primary);
        }
        
        .fortune-summary {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }
        
        .fortune-lucky {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--color-bg-overlay);
        }
        
        .lucky-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
        }
        
        .lucky-label {
          color: var(--color-text-muted);
        }
        
        .lucky-value {
          color: var(--color-text-secondary);
        }
        
        /* 信息表单 */
        .info-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .form-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .form-row label {
          width: 100px;
          color: var(--color-text-secondary);
        }
        
        .form-row .input {
          flex: 1;
          max-width: 120px;
        }
        
        /* 十神 */
        .gods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem;
        }
        
        .god-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          background: var(--color-bg-surface);
          border-radius: var(--radius-md);
          gap: 0.25rem;
        }
        
        .god-type {
          font-size: 0.65rem;
          color: var(--color-text-muted);
        }
        
        .god-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }
        
        .god-stem {
          font-family: var(--font-display);
          font-size: 1rem;
          color: var(--color-primary);
        }
        
        @media (prefers-reduced-motion: reduce) {
          .wuxing-bar-fill {
            transition: none !important;
          }
        }
      `}</style>
    </Modal>
  );
});

EightCharsPanel.displayName = 'EightCharsPanel';
