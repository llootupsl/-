/**
 * =============================================================================
 * DAOPanel DAO治理面板 - 民主决策系统
 * =============================================================================
 */

import React, { useState, useCallback, memo, useEffect } from 'react';
import { toast } from '../../stores/toastStore';
import { 
  daoSystem, 
  Bill, 
  BillType, 
  VoteStatus, 
  VotingType,
  SentenceType,
  CaseType,
  VerdictType,
  SentenceStatus,
  JudicialRuling,
  JudicialHistoryEntry,
  CitizenJudicialState,
  JudicialEvent,
  SentenceExecutionLog,
  PardonRecord,
} from '../../governance/DAOSystem';

const SENTENCE_TYPE_LABELS: Record<SentenceType, string> = {
  [SentenceType.FINE]: '罚款',
  [SentenceType.IMPRISONMENT]: '监禁',
  [SentenceType.EXILE]: '流放',
  [SentenceType.COMMUNITY_SERVICE]: '社区服务',
  [SentenceType.DEATH_PENALTY]: '死刑',
  [SentenceType.RIGHTS_RESTRICTION]: '权利限制',
  [SentenceType.PROBATION]: '缓刑',
  [SentenceType.COMPENSATION]: '赔偿',
};

const CASE_TYPE_LABELS: Record<CaseType, string> = {
  [CaseType.CIVIL]: '民事',
  [CaseType.CRIMINAL]: '刑事',
  [CaseType.CONSTITUTIONAL]: '宪法',
  [CaseType.ADMINISTRATIVE]: '行政',
  [CaseType.ECONOMIC]: '经济',
};

const VERDICT_LABELS: Record<VerdictType, string> = {
  [VerdictType.GUILTY]: '有罪',
  [VerdictType.INNOCENT]: '无罪',
  [VerdictType.DISMISSED]: '驳回',
  [VerdictType.SETTLED]: '和解',
  [VerdictType.WITHDRAWN]: '撤诉',
};

const SENTENCE_STATUS_LABELS: Record<SentenceStatus, string> = {
  [SentenceStatus.PENDING]: '待执行',
  [SentenceStatus.EXECUTING]: '执行中',
  [SentenceStatus.COMPLETED]: '已完成',
  [SentenceStatus.SUSPENDED]: '已暂停',
  [SentenceStatus.REVOKED]: '已撤销',
  [SentenceStatus.ON_PROBATION]: '缓刑中',
};

const SENTENCE_STATUS_COLORS: Record<SentenceStatus, string> = {
  [SentenceStatus.PENDING]: '#ffd700',
  [SentenceStatus.EXECUTING]: '#1AEFFB',
  [SentenceStatus.COMPLETED]: '#1BF5A0',
  [SentenceStatus.SUSPENDED]: '#888',
  [SentenceStatus.REVOKED]: '#FF3867',
  [SentenceStatus.ON_PROBATION]: '#ff9800',
};

export interface DAOPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'success';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = memo(({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog" onClick={onCancel}>
      <div className="confirm-dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-title">{title}</div>
        <div className="confirm-dialog-message">{message}</div>
        <div className="confirm-dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : variant === 'success' ? 'btn-success' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

interface VoteResultOverlayProps {
  isOpen: boolean;
  passed: boolean;
  billName: string;
  onClose: () => void;
}

const VoteResultOverlay: React.FC<VoteResultOverlayProps> = memo(({
  isOpen,
  passed,
  billName,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="vote-result-overlay" onClick={onClose}>
      <div className="vote-result-card" onClick={(e) => e.stopPropagation()}>
        <div className="vote-result-icon">
          {passed ? '✓' : '✗'}
        </div>
        <div className={`vote-result-title ${passed ? 'passed' : 'rejected'}`}>
          {passed ? '投票通过' : '投票否决'}
        </div>
        <div className="vote-result-message">
          {billName}
        </div>
        <button className="btn btn-primary" onClick={onClose}>
          确定
        </button>
      </div>
    </div>
  );
});

VoteResultOverlay.displayName = 'VoteResultOverlay';

const BILL_TYPE_LABELS: Record<BillType, string> = {
  constitutional: '宪法修正',
  ordinary: '普通法律',
  budget: '预算案',
  emergency: '紧急状态',
  impeachment: '弹劾案',
  trade: '贸易协定',
  research: '科技研发',
  infrastructure: '基础设施',
};

const VOTING_TYPE_LABELS: Record<VotingType, string> = {
  simple_majority: '简单多数',
  absolute_majority: '绝对多数',
  quadratic: '二次方投票',
  liquid: '流动民主',
  weighted: '加权投票',
};

const STATUS_LABELS: Record<VoteStatus, string> = {
  proposed: '提案中',
  voting: '投票中',
  passed: '已通过',
  rejected: '已否决',
  tabled: '已搁置',
  executed: '已执行',
};

const STATUS_COLORS: Record<VoteStatus, string> = {
  proposed: '#ffd700',
  voting: '#1AEFFB',
  passed: '#1BF5A0',
  rejected: '#FF3867',
  tabled: '#888',
  executed: '#1BF5A0',
};

interface BillCardProps {
  bill: Bill;
  onVote: (billId: string, voteType: 'yes' | 'no' | 'abstain') => void;
  hasVoted: boolean;
  userVote?: 'yes' | 'no' | 'abstain';
}

const BillCard: React.FC<BillCardProps> = memo(({ bill, onVote, hasVoted, userVote }) => {
  const [confirmVote, setConfirmVote] = useState<'yes' | 'no' | 'abstain' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [animatingVote, setAnimatingVote] = useState<'yes' | 'no' | 'abstain' | null>(null);

  const handleVoteClick = useCallback((voteType: 'yes' | 'no' | 'abstain') => {
    if (hasVoted || isVoting) return;
    setConfirmVote(voteType);
  }, [hasVoted, isVoting]);

  const handleConfirmVote = useCallback(() => {
    if (!confirmVote) return;
    
    setIsVoting(true);
    setAnimatingVote(confirmVote);
    
    setTimeout(() => {
      onVote(bill.id, confirmVote);
      setIsVoting(false);
      setAnimatingVote(null);
      setConfirmVote(null);
      
      toast.success(
        '投票成功',
        `您对"${bill.name}"投了${confirmVote === 'yes' ? '赞成' : confirmVote === 'no' ? '反对' : '弃权'}票`
      );
    }, 500);
  }, [confirmVote, onVote, bill.id, bill.name]);

  const totalVotes = bill.yesVotes.length + bill.noVotes.length + bill.abstainVotes.length;
  const yesPercent = totalVotes > 0 ? (bill.yesVotes.length / totalVotes) * 100 : 0;
  const noPercent = totalVotes > 0 ? (bill.noVotes.length / totalVotes) * 100 : 0;

  const isVotingActive = bill.status === 'proposed' || bill.status === 'voting';

  return (
    <>
      <div className="bill-card">
        <div className="bill-header">
          <div className="bill-type" style={{ color: STATUS_COLORS[bill.status] }}>
            {BILL_TYPE_LABELS[bill.type]}
          </div>
          <div className="bill-status" style={{ backgroundColor: STATUS_COLORS[bill.status] }}>
            {STATUS_LABELS[bill.status]}
          </div>
        </div>
        
        <div className="bill-name">{bill.name}</div>
        <div className="bill-description">{bill.description}</div>
        
        <div className="bill-meta">
          <div className="bill-meta-item">
            <span className="meta-label">投票方式</span>
            <span className="meta-value">{VOTING_TYPE_LABELS[bill.votingType]}</span>
          </div>
          <div className="bill-meta-item">
            <span className="meta-label">截止时间</span>
            <span className="meta-value">
              {new Date(bill.votingDeadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="bill-votes">
          <div className="vote-bar">
            <div className="vote-bar-yes" style={{ width: `${yesPercent}%` }} />
            <div className="vote-bar-no" style={{ width: `${noPercent}%` }} />
          </div>
          <div className="vote-counts">
            <span className="vote-count yes">赞成 {bill.yesVotes.length}</span>
            <span className="vote-count abstain">弃权 {bill.abstainVotes.length}</span>
            <span className="vote-count no">反对 {bill.noVotes.length}</span>
          </div>
        </div>

        {isVotingActive && !hasVoted && (
          <div className="bill-actions">
            <button
              className={`vote-btn vote-btn-yes ${animatingVote === 'yes' ? 'confirming' : ''}`}
              onClick={() => handleVoteClick('yes')}
              disabled={isVoting}
            >
              ✓ 赞成
            </button>
            <button
              className={`vote-btn vote-btn-abstain ${animatingVote === 'abstain' ? 'confirming' : ''}`}
              onClick={() => handleVoteClick('abstain')}
              disabled={isVoting}
            >
              ○ 弃权
            </button>
            <button
              className={`vote-btn vote-btn-no ${animatingVote === 'no' ? 'confirming' : ''}`}
              onClick={() => handleVoteClick('no')}
              disabled={isVoting}
            >
              ✗ 反对
            </button>
          </div>
        )}

        {hasVoted && (
          <div className="bill-voted">
            <span className="voted-label">您已投票:</span>
            <span className={`voted-value ${userVote}`}>
              {userVote === 'yes' ? '赞成' : userVote === 'no' ? '反对' : '弃权'}
            </span>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmVote !== null}
        title="确认投票"
        message={`确定要对此法案投${confirmVote === 'yes' ? '赞成' : confirmVote === 'no' ? '反对' : '弃权'}票吗？此操作不可撤销。`}
        onConfirm={handleConfirmVote}
        onCancel={() => setConfirmVote(null)}
        confirmText="确认投票"
        cancelText="取消"
        variant={confirmVote === 'yes' ? 'success' : confirmVote === 'no' ? 'danger' : 'default'}
      />
    </>
  );
});

BillCard.displayName = 'BillCard';

interface JudicialHistoryCardProps {
  entry: JudicialHistoryEntry;
  onViewDetails: (rulingId: string) => void;
}

const JudicialHistoryCard: React.FC<JudicialHistoryCardProps> = memo(({ entry, onViewDetails }) => {
  return (
    <div className="judicial-history-card">
      <div className="judicial-header">
        <div className="case-number">{entry.caseNumber}</div>
        <div className="case-type">{CASE_TYPE_LABELS[entry.caseType]}</div>
      </div>
      <div className="judicial-defendant">{entry.defendantName}</div>
      <div className="judicial-verdict" style={{ 
        color: entry.verdict === VerdictType.GUILTY ? '#FF3867' : '#1BF5A0' 
      }}>
        {VERDICT_LABELS[entry.verdict]}
      </div>
      <div className="judicial-sentence">{entry.sentenceSummary}</div>
      <div className="judicial-footer">
        <span className="judicial-time">
          {new Date(entry.timestamp).toLocaleDateString()}
        </span>
        <span 
          className="judicial-status" 
          style={{ backgroundColor: SENTENCE_STATUS_COLORS[entry.executionStatus] }}
        >
          {SENTENCE_STATUS_LABELS[entry.executionStatus]}
        </span>
      </div>
      <button 
        className="btn btn-ghost btn-sm"
        onClick={() => onViewDetails(entry.rulingId)}
      >
        查看详情
      </button>
    </div>
  );
});

JudicialHistoryCard.displayName = 'JudicialHistoryCard';

interface RulingDetailModalProps {
  ruling: JudicialRuling | null;
  onClose: () => void;
  onExecuteSentence: (rulingId: string, sentenceIndex: number) => Promise<void>;
}

const RulingDetailModal: React.FC<RulingDetailModalProps> = memo(({ 
  ruling, 
  onClose,
  onExecuteSentence,
}) => {
  const [executingIndex, setExecutingIndex] = useState<number | null>(null);

  const handleExecute = useCallback(async (index: number) => {
    if (!ruling) return;
    setExecutingIndex(index);
    try {
      await onExecuteSentence(ruling.id, index);
      toast.success('判决执行成功');
    } catch (e) {
      toast.error('判决执行失败');
    } finally {
      setExecutingIndex(null);
    }
  }, [ruling, onExecuteSentence]);

  if (!ruling) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ruling-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{ruling.caseName}</h3>
          <span className="case-number">{ruling.caseNumber}</span>
        </div>
        
        <div className="modal-body">
          <div className="ruling-info">
            <div className="info-row">
              <span className="label">案件类型:</span>
              <span className="value">{CASE_TYPE_LABELS[ruling.caseType]}</span>
            </div>
            <div className="info-row">
              <span className="label">判决结果:</span>
              <span className="value" style={{ 
                color: ruling.verdict === VerdictType.GUILTY ? '#FF3867' : '#1BF5A0' 
              }}>
                {VERDICT_LABELS[ruling.verdict]}
              </span>
            </div>
            <div className="info-row">
              <span className="label">原告:</span>
              <span className="value">{ruling.plaintiff}</span>
            </div>
            <div className="info-row">
              <span className="label">被告:</span>
              <span className="value">{ruling.defendant}</span>
            </div>
            <div className="info-row">
              <span className="label">判决时间:</span>
              <span className="value">{new Date(ruling.timestamp).toLocaleString()}</span>
            </div>
          </div>

          {ruling.caseDescription && (
            <div className="ruling-description">
              <h4>案件描述</h4>
              <p>{ruling.caseDescription}</p>
            </div>
          )}

          <div className="sentences-section">
            <h4>判决内容</h4>
            {ruling.sentences.map((sentence, index) => (
              <div key={index} className="sentence-item">
                <div className="sentence-header">
                  <span className="sentence-type">{SENTENCE_TYPE_LABELS[sentence.type]}</span>
                  <span 
                    className="sentence-status"
                    style={{ backgroundColor: SENTENCE_STATUS_COLORS[sentence.status] }}
                  >
                    {SENTENCE_STATUS_LABELS[sentence.status]}
                  </span>
                </div>
                <div className="sentence-details">
                  {sentence.amount && <span>金额: {sentence.amount}</span>}
                  {sentence.duration && <span>时长: {sentence.duration}天</span>}
                  {sentence.probationPeriod && <span>缓刑期: {sentence.probationPeriod}天</span>}
                </div>
                {sentence.status === SentenceStatus.PENDING && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleExecute(index)}
                    disabled={executingIndex === index}
                  >
                    {executingIndex === index ? '执行中...' : '执行判决'}
                  </button>
                )}
              </div>
            ))}
          </div>

          {ruling.rulingText && (
            <div className="ruling-text">
              <h4>判决书</h4>
              <p>{ruling.rulingText}</p>
            </div>
          )}

          <div className="legal-basis">
            <h4>法律依据</h4>
            <ul>
              {ruling.legalBasis.map((basis, i) => (
                <li key={i}>{basis}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          {ruling.appealable && ruling.appealDeadline && Date.now() < ruling.appealDeadline && (
            <button className="btn btn-ghost">提起上诉</button>
          )}
          <button className="btn btn-primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
});

RulingDetailModal.displayName = 'RulingDetailModal';

interface JudicialStatsProps {
  stats: ReturnType<typeof daoSystem.getJudicialStatistics>;
}

const JudicialStats: React.FC<JudicialStatsProps> = memo(({ stats }) => {
  return (
    <div className="judicial-stats">
      <div className="stat-item">
        <span className="stat-value">{stats.totalCases}</span>
        <span className="stat-label">总案件</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{stats.activeSentences}</span>
        <span className="stat-label">待执行</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{stats.imprisonedCitizens}</span>
        <span className="stat-label">在押人员</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{stats.exiledCitizens}</span>
        <span className="stat-label">流放人员</span>
      </div>
    </div>
  );
});

JudicialStats.displayName = 'JudicialStats';

interface ExecutionLogListProps {
  logs: SentenceExecutionLog[];
}

const ExecutionLogList: React.FC<ExecutionLogListProps> = memo(({ logs }) => {
  if (logs.length === 0) {
    return <div className="dao-empty">暂无执行日志</div>;
  }

  const actionLabels: Record<string, string> = {
    execute: '执行',
    complete: '完成',
    revoke: '撤销',
    pardon: '赦免',
    progress_update: '进度更新',
  };

  return (
    <div className="execution-log-list">
      {logs.map((log) => (
        <div key={log.id} className={`execution-log-item ${log.success ? 'success' : 'error'}`}>
          <div className="log-header">
            <span className="log-case">{log.caseNumber || '系统操作'}</span>
            <span className="log-action">{actionLabels[log.action] || log.action}</span>
            <span className="log-type">{SENTENCE_TYPE_LABELS[log.sentenceType]}</span>
          </div>
          <div className="log-citizen">{log.citizenName}</div>
          <div className="log-details">{log.details}</div>
          {log.resourceChanges && Object.keys(log.resourceChanges).length > 0 && (
            <div className="log-resources">
              {Object.entries(log.resourceChanges).map(([key, value]) => (
                <span key={key} className={`resource-change ${value > 0 ? 'positive' : 'negative'}`}>
                  {key}: {value > 0 ? '+' : ''}{value}
                </span>
              ))}
            </div>
          )}
          <div className="log-time">
            {new Date(log.timestamp).toLocaleString()}
          </div>
          {!log.success && log.errorMessage && (
            <div className="log-error">{log.errorMessage}</div>
          )}
        </div>
      ))}
    </div>
  );
});

ExecutionLogList.displayName = 'ExecutionLogList';

interface PardonModalProps {
  isOpen: boolean;
  citizenId: string;
  citizenName: string;
  onClose: () => void;
  onGrant: (options: {
    citizenId: string;
    pardonType: 'full' | 'partial' | 'amnesty';
    reason: string;
    grantedBy: string;
    notes?: string;
  }) => void;
}

const PardonModal: React.FC<PardonModalProps> = memo(({
  isOpen,
  citizenId,
  citizenName,
  onClose,
  onGrant,
}) => {
  const [pardonType, setPardonType] = useState<'full' | 'partial' | 'amnesty'>('full');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleGrant = useCallback(() => {
    if (!reason.trim()) {
      toast.error('请填写赦免理由');
      return;
    }
    onGrant({
      citizenId,
      pardonType,
      reason,
      grantedBy: 'player',
      notes: notes || undefined,
    });
    setReason('');
    setNotes('');
    onClose();
  }, [citizenId, pardonType, reason, notes, onGrant, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pardon-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>赦免市民</h3>
          <span className="citizen-name">{citizenName}</span>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>赦免类型</label>
            <div className="pardon-type-options">
              <button
                className={`pardon-type-btn ${pardonType === 'full' ? 'active' : ''}`}
                onClick={() => setPardonType('full')}
              >
                完全赦免
                <span className="pardon-desc">清除所有犯罪记录和处罚</span>
              </button>
              <button
                className={`pardon-type-btn ${pardonType === 'partial' ? 'active' : ''}`}
                onClick={() => setPardonType('partial')}
              >
                部分赦免
                <span className="pardon-desc">赦免特定判决</span>
              </button>
              <button
                className={`pardon-type-btn ${pardonType === 'amnesty' ? 'active' : ''}`}
                onClick={() => setPardonType('amnesty')}
              >
                大赦
                <span className="pardon-desc">赦免30天前的所有案件</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>赦免理由 *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请输入赦免理由..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>备注（可选）</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="附加说明..."
              rows={2}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button 
            className="btn btn-success" 
            onClick={handleGrant}
            disabled={!reason.trim()}
          >
            确认赦免
          </button>
        </div>
      </div>
    </div>
  );
});

PardonModal.displayName = 'PardonModal';

interface CitizenJudicialStatusProps {
  citizenId: string;
  state: CitizenJudicialState;
  onPardon: () => void;
}

const CitizenJudicialStatus: React.FC<CitizenJudicialStatusProps> = memo(({
  citizenId,
  state,
  onPardon,
}) => {
  const statusItems = [];

  if (state.isImprisoned) {
    statusItems.push(
      <div key="imprisoned" className="status-item imprisoned">
        <span className="status-icon">🔒</span>
        <span className="status-label">监禁中</span>
        <span className="status-value">剩余 {state.imprisonmentRemaining} 天</span>
      </div>
    );
  }

  if (state.isExiled) {
    statusItems.push(
      <div key="exiled" className="status-item exiled">
        <span className="status-icon">🚫</span>
        <span className="status-label">流放中</span>
        {state.exileLocation && (
          <span className="status-value">
            位置: ({state.exileLocation.x}, {state.exileLocation.y})
          </span>
        )}
      </div>
    );
  }

  if (state.isOnProbation) {
    statusItems.push(
      <div key="probation" className="status-item probation">
        <span className="status-icon">⚠️</span>
        <span className="status-label">缓刑中</span>
        <span className="status-value">剩余 {state.probationRemaining} 天</span>
      </div>
    );
  }

  if (state.restrictedRights.length > 0) {
    statusItems.push(
      <div key="restricted" className="status-item restricted">
        <span className="status-icon">⛔</span>
        <span className="status-label">权利受限</span>
        <span className="status-value">{state.restrictedRights.join(', ')}</span>
      </div>
    );
  }

  if (state.criminalRecord > 0) {
    statusItems.push(
      <div key="criminal" className="status-item criminal">
        <span className="status-icon">📋</span>
        <span className="status-label">犯罪记录</span>
        <span className="status-value">{state.criminalRecord} 次</span>
      </div>
    );
  }

  if (state.totalFines > 0) {
    statusItems.push(
      <div key="fines" className="status-item fines">
        <span className="status-icon">💰</span>
        <span className="status-label">累计罚款</span>
        <span className="status-value">{state.totalFines} 单位</span>
      </div>
    );
  }

  if (statusItems.length === 0) {
    return (
      <div className="citizen-judicial-status clean">
        <span className="status-icon">✓</span>
        <span className="status-label">清白记录</span>
      </div>
    );
  }

  return (
    <div className="citizen-judicial-status">
      {statusItems}
      <button className="btn btn-sm btn-ghost" onClick={onPardon}>
        申请赦免
      </button>
    </div>
  );
});

CitizenJudicialStatus.displayName = 'CitizenJudicialStatus';

export const DAOPanel: React.FC<DAOPanelProps> = memo(({ isOpen, onClose, className = '' }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filter, setFilter] = useState<VoteStatus | 'all'>('all');
  const [userVotes, setUserVotes] = useState<Map<string, 'yes' | 'no' | 'abstain'>>(new Map());
  const [showResult, setShowResult] = useState<{ passed: boolean; billName: string } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'bills' | 'judicial' | 'logs'>('bills');
  const [judicialHistory, setJudicialHistory] = useState<JudicialHistoryEntry[]>([]);
  const [judicialStats, setJudicialStats] = useState<ReturnType<typeof daoSystem.getJudicialStatistics> | null>(null);
  const [selectedRuling, setSelectedRuling] = useState<JudicialRuling | null>(null);
  const [executionLogs, setExecutionLogs] = useState<SentenceExecutionLog[]>([]);
  const [pardonModal, setPardonModal] = useState<{ isOpen: boolean; citizenId: string; citizenName: string }>({
    isOpen: false,
    citizenId: '',
    citizenName: '',
  });

  useEffect(() => {
    if (isOpen) {
      setBills(daoSystem.getAllBills());
      setJudicialHistory(daoSystem.getJudicialHistory({ limit: 20 }));
      setJudicialStats(daoSystem.getJudicialStatistics());
      setExecutionLogs(daoSystem.getExecutionLogs({ limit: 50 }));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleJudicialEvent = (event: JudicialEvent) => {
      setJudicialHistory(daoSystem.getJudicialHistory({ limit: 20 }));
      setJudicialStats(daoSystem.getJudicialStatistics());
      setExecutionLogs(daoSystem.getExecutionLogs({ limit: 50 }));
      
      if (event.type === 'ruling_issued' && event.ruling) {
        toast.info('新判决', `案件 ${event.ruling.caseNumber} 已宣判`);
      } else if (event.type === 'sentence_executed') {
        toast.success('判决执行', event.result?.message || '判决已执行');
      } else if (event.type === 'sentence_completed') {
        toast.info('判决完成', '刑期已结束');
      } else if (event.type === 'pardon_granted') {
        toast.success('赦免授予', `市民 ${event.citizenId} 已获赦免`);
      } else if (event.type === 'citizen_executed') {
        toast.warning('死刑执行', `市民 ${event.citizenId} 已被执行死刑`);
      } else if (event.type === 'citizen_exiled') {
        toast.warning('流放执行', `市民 ${event.citizenId} 已被流放`);
      }
    };

    daoSystem.addJudicialEventListener(handleJudicialEvent);
    return () => daoSystem.removeJudicialEventListener(handleJudicialEvent);
  }, []);

  const handleVote = useCallback((billId: string, voteType: 'yes' | 'no' | 'abstain') => {
    setUserVotes((prev) => {
      const newMap = new Map(prev);
      newMap.set(billId, voteType);
      return newMap;
    });
    
    setBills((prev) => prev.map((b) => {
      if (b.id === billId) {
        const updated = { ...b };
        if (voteType === 'yes') {
          updated.yesVotes = [...updated.yesVotes, { voterId: 'player', weight: 1, timestamp: Date.now() }];
        } else if (voteType === 'no') {
          updated.noVotes = [...updated.noVotes, { voterId: 'player', weight: 1, timestamp: Date.now() }];
        } else {
          updated.abstainVotes = [...updated.abstainVotes, { voterId: 'player', weight: 1, timestamp: Date.now() }];
        }
        return updated;
      }
      return b;
    }));
  }, []);

  const handleViewRulingDetails = useCallback((rulingId: string) => {
    const ruling = daoSystem.getRuling(rulingId);
    setSelectedRuling(ruling || null);
  }, []);

  const handleExecuteSentence = useCallback(async (rulingId: string, sentenceIndex: number) => {
    const result = await daoSystem.executeSentence(rulingId, sentenceIndex);
    if (!result.success) {
      throw new Error(result.message);
    }
    const ruling = daoSystem.getRuling(rulingId);
    setSelectedRuling(ruling || null);
    setExecutionLogs(daoSystem.getExecutionLogs({ limit: 50 }));
  }, []);

  const handleGrantPardon = useCallback((options: {
    citizenId: string;
    pardonType: 'full' | 'partial' | 'amnesty';
    reason: string;
    grantedBy: string;
    notes?: string;
  }) => {
    const record = daoSystem.grantPardon(options);
    if (record) {
      toast.success('赦免成功', `${options.citizenId} 已获得${options.pardonType === 'full' ? '完全' : options.pardonType === 'partial' ? '部分' : '大'}赦免`);
      setJudicialHistory(daoSystem.getJudicialHistory({ limit: 20 }));
      setJudicialStats(daoSystem.getJudicialStatistics());
      setExecutionLogs(daoSystem.getExecutionLogs({ limit: 50 }));
    } else {
      toast.error('赦免失败', '无法完成赦免操作');
    }
  }, []);

  const handleOpenPardonModal = useCallback((citizenId: string, citizenName: string) => {
    setPardonModal({ isOpen: true, citizenId, citizenName });
  }, []);

  const handleClosePardonModal = useCallback(() => {
    setPardonModal({ isOpen: false, citizenId: '', citizenName: '' });
  }, []);

  const filteredBills = filter === 'all' ? bills : bills.filter((b) => b.status === filter);

  if (!isOpen) return null;

  return (
    <div className={`dao-panel ${className}`}>
      {onClose && (
        <button className="panel-close-btn" onClick={onClose} aria-label="关闭">
          ✕
        </button>
      )}

      <div className="dao-header">
        <h2 className="dao-title">DAO 治理中心</h2>
        <p className="dao-subtitle">参与民主决策，塑造文明未来</p>
      </div>

      <div className="dao-tabs">
        <button
          className={`tab-btn ${activeTab === 'bills' ? 'active' : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          法案投票
        </button>
        <button
          className={`tab-btn ${activeTab === 'judicial' ? 'active' : ''}`}
          onClick={() => setActiveTab('judicial')}
        >
          司法系统
        </button>
        <button
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          执行日志
        </button>
      </div>

      {activeTab === 'bills' && (
        <>
          <div className="dao-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              全部
            </button>
            {(['voting', 'passed', 'rejected'] as VoteStatus[]).map((status) => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
                style={{ '--filter-color': STATUS_COLORS[status] } as React.CSSProperties}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          <div className="dao-bills">
            {filteredBills.length === 0 ? (
              <div className="dao-empty">暂无法案</div>
            ) : (
              filteredBills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onVote={handleVote}
                  hasVoted={userVotes.has(bill.id)}
                  userVote={userVotes.get(bill.id)}
                />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'judicial' && (
        <>
          {judicialStats && <JudicialStats stats={judicialStats} />}
          
          <div className="judicial-history">
            <h3 className="section-title">司法历史</h3>
            {judicialHistory.length === 0 ? (
              <div className="dao-empty">暂无司法记录</div>
            ) : (
              judicialHistory.map((entry) => (
                <JudicialHistoryCard
                  key={entry.id}
                  entry={entry}
                  onViewDetails={handleViewRulingDetails}
                />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'logs' && (
        <div className="execution-logs-section">
          <h3 className="section-title">判决执行日志</h3>
          <ExecutionLogList logs={executionLogs} />
        </div>
      )}

      <VoteResultOverlay
        isOpen={showResult !== null}
        passed={showResult?.passed ?? false}
        billName={showResult?.billName ?? ''}
        onClose={() => setShowResult(null)}
      />

      <RulingDetailModal
        ruling={selectedRuling}
        onClose={() => setSelectedRuling(null)}
        onExecuteSentence={handleExecuteSentence}
      />

      <PardonModal
        isOpen={pardonModal.isOpen}
        citizenId={pardonModal.citizenId}
        citizenName={pardonModal.citizenName}
        onClose={handleClosePardonModal}
        onGrant={handleGrantPardon}
      />
    </div>
  );
});

DAOPanel.displayName = 'DAOPanel';

export default DAOPanel;
