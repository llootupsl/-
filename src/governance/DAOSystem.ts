/**
 * =============================================================================
 * 永夜熵纪 - DAO治理系统
 * Decentralized Autonomous Governance System
 * 实现宪法、立法、司法和智能合约
 * =============================================================================
 */

/** 法案类型 */
export enum BillType {
  /** 宪法修正 */
  CONSTITUTIONAL = 'constitutional',
  /** 普通法律 */
  ORDINARY = 'ordinary',
  /** 预算案 */
  BUDGET = 'budget',
  /** 紧急状态 */
  EMERGENCY = 'emergency',
  /** 弹劾案 */
  IMPEACHMENT = 'impeachment',
  /** 贸易协定 */
  TRADE = 'trade',
  /** 科技研发 */
  RESEARCH = 'research',
  /** 基础设施 */
  INFRASTRUCTURE = 'infrastructure',
}

/** 投票类型 */
export enum VotingType {
  /** 简单多数 */
  SIMPLE_MAJORITY = 'simple_majority',
  /** 绝对多数 */
  ABSOLUTE_MAJORITY = 'absolute_majority',
  /** 二次方投票 */
  QUADRATIC = 'quadratic',
  /** 流动民主 */
  LIQUID = 'liquid',
  /** 加权投票 */
  WEIGHTED = 'weighted',
}

/** 投票状态 */
export enum VoteStatus {
  /** 提案中 */
  PROPOSED = 'proposed',
  /** 投票中 */
  VOTING = 'voting',
  /** 通过 */
  PASSED = 'passed',
  /** 否决 */
  REJECTED = 'rejected',
  /** 搁置 */
  TABLED = 'tabled',
  /** 已执行 */
  EXECUTED = 'executed',
}

/** 法案 */
export interface Bill {
  /** 法案ID */
  id: string;
  /** 法案名称 */
  name: string;
  /** 法案描述 */
  description: string;
  /** 法案类型 */
  type: BillType;
  /** 提案人ID */
  proposerId: string;
  /** 提案时间 */
  proposedAt: number;
  /** 投票截止时间 */
  votingDeadline: number;
  /** 投票类型 */
  votingType: VotingType;
  /** 赞成票 */
  yesVotes: Vote[];
  /** 反对票 */
  noVotes: Vote[];
  /** 弃权票 */
  abstainVotes: Vote[];
  /** 状态 */
  status: VoteStatus;
  /** 影响范围 */
  effects: BillEffect[];
  /** 执行的合约 */
  smartContract?: SmartContract;
  /** 执行结果 */
  executionResult?: string;
  /** 过期时间 */
  expiresAt?: number;
}

/** 投票 */
export interface Vote {
  /** 投票人ID */
  voterId: string;
  /** 投票权重 */
  weight: number;
  /** 投票时间 */
  timestamp: number;
  /** 委托来源（流动民主） */
  delegatedFrom?: string;
}

/** 法案效果 */
export interface BillEffect {
  /** 效果类型 */
  type: 'resource_change' | 'entropy_change' | 'citizen_rights' | 
        'government_structure' | 'economic_policy' | 'tech_requirement' |
        'social_modifier' | 'law_enforcement';
  /** 效果参数 */
  params: Record<string, number | string | boolean>;
  /** 效果强度 */
  intensity: number;
  /** 生效时间 */
  activationTime?: number;
}

/** 智能合约 */
export interface SmartContract {
  /** 合约ID */
  id: string;
  /** 合约代码（简化版） */
  code: string;
  /** 合约状态 */
  state: Record<string, any>;
  /** 执行条件 */
  triggerConditions: TriggerCondition[];
  /** 执行动作 */
  actions: ContractAction[];
}

/** 触发条件 */
export interface TriggerCondition {
  /** 条件类型 */
  type: 'time' | 'resource' | 'vote' | 'entropy' | 'population';
  /** 参数 */
  params: Record<string, number | string>;
}

/** 合约动作 */
export interface ContractAction {
  /** 动作类型 */
  type: 'transfer' | 'emit' | 'modify' | 'activate' | 'deactivate';
  /** 目标 */
  target: string;
  /** 参数 */
  params: Record<string, number | string>;
}

/** 宪法 */
export interface Constitution {
  /** 宪法ID */
  id: string;
  /** 宪法名称 */
  name: string;
  /** 版本 */
  version: number;
  /** 条款 */
  articles: ConstitutionalArticle[];
  /** 权利清单 */
  billOfRights: Right[];
  /** 最后修改时间 */
  lastModified: number;
}

/** 宪法条款 */
export interface ConstitutionalArticle {
  /** 条款ID */
  id: string;
  /** 条款编号 */
  number: string;
  /** 条款标题 */
  title: string;
  /** 条款内容 */
  content: string;
  /** 是否为核心条款（不可修改） */
  isCore: boolean;
  /** 修改所需票数 */
  requiredVotes: number;
}

/** 权利 */
export interface Right {
  /** 权利ID */
  id: string;
  /** 权利名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 限制条件 */
  restrictions?: string[];
}

/** 判决类型枚举 */
export enum SentenceType {
  /** 罚款 - 扣除金钱 */
  FINE = 'fine',
  /** 监禁 - 限制自由，扣除属性 */
  IMPRISONMENT = 'imprisonment',
  /** 流放 - 强制迁移到边缘区域 */
  EXILE = 'exile',
  /** 社区服务 - 强制劳动，恢复声誉 */
  COMMUNITY_SERVICE = 'community_service',
  /** 死刑 - 终极惩罚 */
  DEATH_PENALTY = 'death_penalty',
  /** 权利限制 - 降低投票权等 */
  RIGHTS_RESTRICTION = 'rights_restriction',
  /** 缓刑 - 保留观察期 */
  PROBATION = 'probation',
  /** 赔偿 - 向受害者支付 */
  COMPENSATION = 'compensation',
}

/** 案件类型 */
export enum CaseType {
  /** 民事案件 */
  CIVIL = 'civil',
  /** 刑事案件 */
  CRIMINAL = 'criminal',
  /** 宪法案件 */
  CONSTITUTIONAL = 'constitutional',
  /** 行政案件 */
  ADMINISTRATIVE = 'administrative',
  /** 经济案件 */
  ECONOMIC = 'economic',
}

/** 判决结果 */
export enum VerdictType {
  /** 有罪 */
  GUILTY = 'guilty',
  /** 无罪 */
  INNOCENT = 'innocent',
  /** 驳回 */
  DISMISSED = 'dismissed',
  /** 和解 */
  SETTLED = 'settled',
  /** 撤诉 */
  WITHDRAWN = 'withdrawn',
}

/** 判决执行状态 */
export enum SentenceStatus {
  /** 待执行 */
  PENDING = 'pending',
  /** 执行中 */
  EXECUTING = 'executing',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 已暂停 */
  SUSPENDED = 'suspended',
  /** 已撤销 */
  REVOKED = 'revoked',
  /** 缓刑中 */
  ON_PROBATION = 'on_probation',
}

/** 判决详情 */
export interface SentenceDetail {
  /** 判决类型 */
  type: SentenceType;
  /** 执行状态 */
  status: SentenceStatus;
  /** 持续时间（游戏天数） */
  duration?: number;
  /** 金额（罚款/赔偿） */
  amount?: number;
  /** 受害者ID（赔偿用） */
  victimId?: string;
  /** 开始时间 */
  startedAt?: number;
  /** 结束时间 */
  endedAt?: number;
  /** 执行进度 0-100 */
  progress?: number;
  /** 缓刑期（天） */
  probationPeriod?: number;
  /** 附加说明 */
  notes?: string;
}

/** 司法判决 */
export interface JudicialRuling {
  /** 判决ID */
  id: string;
  /** 案件编号 */
  caseNumber: string;
  /** 案件类型 */
  caseType: CaseType;
  /** 案件名称 */
  caseName: string;
  /** 案件描述 */
  caseDescription?: string;
  /** 原告 */
  plaintiff: string;
  /** 被告 */
  defendant: string;
  /** 法官ID */
  judgeId?: string;
  /** 判决结果 */
  verdict: VerdictType;
  /** 判决详情列表（可多项并罚） */
  sentences: SentenceDetail[];
  /** 依据法条 */
  legalBasis: string[];
  /** 判决时间 */
  timestamp: number;
  /** 判决书内容 */
  rulingText?: string;
  /** 是否可上诉 */
  appealable: boolean;
  /** 上诉截止时间 */
  appealDeadline?: number;
  /** 证据列表 */
  evidence?: string[];
}

/** 司法历史记录条目 */
export interface JudicialHistoryEntry {
  /** 记录ID */
  id: string;
  /** 判决ID */
  rulingId: string;
  /** 案件编号 */
  caseNumber: string;
  /** 被告ID */
  defendantId: string;
  /** 被告姓名 */
  defendantName: string;
  /** 案件类型 */
  caseType: CaseType;
  /** 判决结果 */
  verdict: VerdictType;
  /** 判决摘要 */
  sentenceSummary: string;
  /** 判决时间 */
  timestamp: number;
  /** 执行状态 */
  executionStatus: SentenceStatus;
}

/** 市民司法状态 */
export interface CitizenJudicialState {
  /** 市民ID */
  citizenId: string;
  /** 是否在监禁中 */
  isImprisoned: boolean;
  /** 监禁剩余时间（游戏天数） */
  imprisonmentRemaining?: number;
  /** 是否被流放 */
  isExiled: boolean;
  /** 流放目的地 */
  exileLocation?: { x: number; y: number };
  /** 是否在缓刑期 */
  isOnProbation: boolean;
  /** 缓刑剩余时间 */
  probationRemaining?: number;
  /** 权利限制列表 */
  restrictedRights: string[];
  /** 待执行判决列表 */
  pendingSentences: SentenceDetail[];
  /** 累计罚款金额 */
  totalFines: number;
  /** 累计监禁天数 */
  totalImprisonmentDays: number;
  /** 犯罪记录次数 */
  criminalRecord: number;
  /** 最后判决时间 */
  lastRulingTime?: number;
}

/** 判决执行回调类型 */
export type SentenceExecutionCallback = (
  citizenId: string,
  sentence: SentenceDetail,
  ruling: JudicialRuling
) => Promise<SentenceExecutionResult>;

/** 判决执行结果 */
export interface SentenceExecutionResult {
  success: boolean;
  message: string;
  citizenUpdates?: Partial<CitizenJudicialState>;
  resourceChanges?: Record<string, number>;
}

/** DAO治理系统 - 支持事件发射 */
export class DAOSystem {
  private constitution: Constitution;
  private bills: Map<string, Bill> = new Map();
  private citizens: Map<string, CitizenVotePower> = new Map();
  private smartContracts: Map<string, SmartContract> = new Map();
  private judicialHistory: JudicialRuling[] = [];
  private activeLaws: Map<string, BillEffect[]> = new Map();
  
  /** 司法历史记录索引 */
  private judicialHistoryIndex: Map<string, JudicialHistoryEntry> = new Map();
  
  /** 市民司法状态 */
  private citizenJudicialStates: Map<string, CitizenJudicialState> = new Map();
  
  /** 案件编号计数器 */
  private caseNumberCounter: number = 1;
  
  /** V6修复：神启验证回调 */
  private divineVerificationCallback: ((voterId: string) => Promise<boolean>) | null = null;
  
  /** 判决执行回调 */
  private sentenceExecutionCallback: SentenceExecutionCallback | null = null;
  
  /** 司法事件监听器 */
  private judicialEventListeners: Array<(event: JudicialEvent) => void> = [];

  /** 判决执行日志 */
  private executionLogs: SentenceExecutionLog[] = [];

  /** 赦免记录 */
  private pardonRecords: PardonRecord[] = [];

  /** 市民回调函数 */
  private citizenCallbacks: CitizenCallbacks | null = null;

  /** 流放目标位置（边缘区域） */
  private exileDestinations: CitizenLocation[] = [
    { x: -100, y: -100, regionId: 'exile_zone_1' },
    { x: 100, y: -100, regionId: 'exile_zone_2' },
    { x: -100, y: 100, regionId: 'exile_zone_3' },
    { x: 100, y: 100, regionId: 'exile_zone_4' },
  ];

  /** 事件监听器 */
  private eventListeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  /** 总投票权 */
  private totalVotingPower: number = 0;

  /** 自定义权重计算器 */
  private customWeightCalculator: ((voterId: string) => number) | null = null;

  constructor(config?: {
    votingPeriod?: number;
    proposalDelay?: number;
    executionDelay?: number;
    quorum?: number;
    threshold?: number;
  }, weightCalculator?: (voterId: string) => number) {
    this.constitution = this.createDefaultConstitution();
    this.customWeightCalculator = weightCalculator || null;
  }

  /**
   * 设置总投票权
   */
  public setTotalVotingPower(power: number): void {
    this.totalVotingPower = power;
  }

  /**
   * 注册事件监听器
   */
  public on(event: string, listener: (...args: any[]) => void): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
    return this;
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, listener: (...args: any[]) => void): this {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  /**
   * 创建提案（兼容测试API）
   */
  public createProposal(
    type: string,
    title: string,
    description: string,
    proposerId: string
  ): Proposal {
    // 自动注册提案人
    if (!this.citizens.has(proposerId)) {
      this.registerCitizen(proposerId, 1);
    }

    const billType = this.mapProposalTypeToBillType(type);
    const bill = this.proposeBill(
      proposerId,
      title,
      description,
      billType,
      [],
      VotingType.SIMPLE_MAJORITY
    );

    if (!bill) {
      throw new Error('Failed to create proposal');
    }

    this.emit('proposalCreated', bill);
    
    return this.billToProposal(bill);
  }

  /**
   * 映射提案类型到法案类型
   */
  private mapProposalTypeToBillType(type: string): BillType {
    const typeMap: Record<string, BillType> = {
      'parameter_change': BillType.ORDINARY,
      'policy_update': BillType.ORDINARY,
      'constitutional': BillType.CONSTITUTIONAL,
      'budget': BillType.BUDGET,
      'emergency': BillType.EMERGENCY,
      'impeachment': BillType.IMPEACHMENT,
      'trade': BillType.TRADE,
      'research': BillType.RESEARCH,
      'infrastructure': BillType.INFRASTRUCTURE,
    };
    return typeMap[type] || BillType.ORDINARY;
  }

  /**
   * 将 Bill 转换为 Proposal（兼容测试API）
   */
  private billToProposal(bill: Bill): Proposal {
    return {
      id: bill.id,
      title: bill.name,
      description: bill.description,
      type: bill.type,
      proposerId: bill.proposerId,
      state: this.mapVoteStatusToState(bill.status),
      votes: {
        for: bill.yesVotes.reduce((sum, v) => sum + v.weight, 0),
        against: bill.noVotes.reduce((sum, v) => sum + v.weight, 0),
        abstain: bill.abstainVotes.reduce((sum, v) => sum + v.weight, 0),
      },
      createdAt: bill.proposedAt,
      deadline: bill.votingDeadline,
    };
  }

  /**
   * 映射投票状态到提案状态
   */
  private mapVoteStatusToState(status: VoteStatus): string {
    const stateMap: Record<VoteStatus, string> = {
      [VoteStatus.PROPOSED]: 'pending',
      [VoteStatus.VOTING]: 'active',
      [VoteStatus.PASSED]: 'passed',
      [VoteStatus.REJECTED]: 'rejected',
      [VoteStatus.TABLED]: 'tabled',
      [VoteStatus.EXECUTED]: 'executed',
    };
    return stateMap[status];
  }

  /**
   * 投票（重载以支持兼容API）
   */
  public async vote(
    billId: string,
    voterId: string,
    voteType: 'yes' | 'no' | 'abstain' | 'for' | 'against',
    weight?: number
  ): Promise<boolean> {
    const normalizedVote = voteType === 'for' ? 'yes' : voteType === 'against' ? 'no' : voteType as 'yes' | 'no' | 'abstain';
    
    const result = await this.voteInternal(billId, voterId, normalizedVote, weight);
    
    if (result) {
      const bill = this.bills.get(billId);
      if (bill) {
        const voteWeight = weight ?? this.calculateVoteWeightForVoter(voterId);
        this.emit('voted', billId, voterId, normalizedVote, voteWeight);
      }
    }
    
    return result;
  }

  /**
   * 内部投票方法
   */
  private async voteInternal(
    billId: string,
    voterId: string,
    voteType: 'yes' | 'no' | 'abstain',
    weight?: number
  ): Promise<boolean> {
    const bill = this.bills.get(billId);
    if (!bill) return false;

    if (bill.status !== VoteStatus.PROPOSED && bill.status !== VoteStatus.VOTING) {
      return false;
    }
    if (Date.now() > bill.votingDeadline) {
      return false;
    }

    // 检查是否已经投过票
    const hasVoted = bill.yesVotes.some(v => v.voterId === voterId) ||
                     bill.noVotes.some(v => v.voterId === voterId) ||
                     bill.abstainVotes.some(v => v.voterId === voterId);
    if (hasVoted) {
      return false;
    }

    // 自动注册投票者
    if (!this.citizens.has(voterId)) {
      this.registerCitizen(voterId, 1);
    }

    let actualWeight = weight ?? this.calculateVoteWeightForVoter(voterId);

    if (bill.votingType === VotingType.QUADRATIC) {
      actualWeight = Math.sqrt(actualWeight);
    }

    const vote: Vote = {
      voterId,
      weight: actualWeight,
      timestamp: Date.now(),
    };

    switch (voteType) {
      case 'yes':
        bill.yesVotes.push(vote);
        break;
      case 'no':
        bill.noVotes.push(vote);
        break;
      case 'abstain':
        bill.abstainVotes.push(vote);
        break;
    }

    bill.status = VoteStatus.VOTING;

    return true;
  }

  /**
   * 计算投票者权重
   */
  private calculateVoteWeightForVoter(voterId: string): number {
    if (this.customWeightCalculator) {
      return this.customWeightCalculator(voterId);
    }

    const voter = this.citizens.get(voterId);
    if (voter) {
      return this.calculateVoteWeight(voter, this.bills.values().next().value!);
    }

    return 1;
  }

  /**
   * 获取提案列表（兼容测试API）
   */
  public getProposals(state?: string): Proposal[] {
    let bills = this.getAllBills();
    
    if (state) {
      bills = bills.filter(bill => this.mapVoteStatusToState(bill.status) === state);
    }
    
    return bills.map(bill => this.billToProposal(bill));
  }

  /**
   * 获取单个提案（兼容测试API）
   */
  public getProposal(proposalId: string): Proposal | undefined {
    const bill = this.bills.get(proposalId);
    return bill ? this.billToProposal(bill) : undefined;
  }

  /**
   * 获取统计信息（兼容测试API）
   */
  public getStats(): {
    totalProposals: number;
    pending: number;
    active: number;
    passed: number;
    rejected: number;
  } {
    const bills = this.getAllBills();
    
    return {
      totalProposals: bills.length,
      pending: bills.filter(b => b.status === VoteStatus.PROPOSED).length,
      active: bills.filter(b => b.status === VoteStatus.VOTING).length,
      passed: bills.filter(b => b.status === VoteStatus.PASSED).length,
      rejected: bills.filter(b => b.status === VoteStatus.REJECTED).length,
    };
  }

  /**
   * 设置判决执行回调
   */
  public setSentenceExecutionCallback(callback: SentenceExecutionCallback): void {
    this.sentenceExecutionCallback = callback;
    console.log('[DAO] Sentence execution callback registered');
  }

  /**
   * 设置市民回调函数（用于与市民系统集成）
   */
  public setCitizenCallbacks(callbacks: CitizenCallbacks): void {
    this.citizenCallbacks = callbacks;
    console.log('[DAO] Citizen callbacks registered');
  }

  /**
   * 添加司法事件监听器
   */
  public addJudicialEventListener(listener: (event: JudicialEvent) => void): void {
    this.judicialEventListeners.push(listener);
  }

  /**
   * 移除司法事件监听器
   */
  public removeJudicialEventListener(listener: (event: JudicialEvent) => void): void {
    this.judicialEventListeners = this.judicialEventListeners.filter(l => l !== listener);
  }

  /**
   * 触发司法事件
   */
  private emitJudicialEvent(event: JudicialEvent): void {
    this.judicialEventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('[DAO] Judicial event listener error:', e);
      }
    });
  }

  /**
   * 记录执行日志
   */
  private logExecution(log: Omit<SentenceExecutionLog, 'id' | 'timestamp'>): void {
    const fullLog: SentenceExecutionLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    this.executionLogs.push(fullLog);
    
    if (log.success) {
      console.log(`[DAO] Execution log: ${log.action} - ${log.details}`);
    } else {
      console.error(`[DAO] Execution failed: ${log.action} - ${log.errorMessage}`);
    }
  }

  /**
   * 获取执行日志
   */
  public getExecutionLogs(options?: {
    citizenId?: string;
    rulingId?: string;
    sentenceType?: SentenceType;
    limit?: number;
  }): SentenceExecutionLog[] {
    let logs = [...this.executionLogs];
    
    if (options?.citizenId) {
      logs = logs.filter(l => l.citizenId === options.citizenId);
    }
    if (options?.rulingId) {
      logs = logs.filter(l => l.rulingId === options.rulingId);
    }
    if (options?.sentenceType) {
      logs = logs.filter(l => l.sentenceType === options.sentenceType);
    }
    
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    const limit = options?.limit || 100;
    return logs.slice(0, limit);
  }

  /**
   * 获取市民名称
   */
  private getCitizenName(citizenId: string): string {
    if (this.citizenCallbacks) {
      return this.citizenCallbacks.getCitizenName(citizenId);
    }
    return citizenId;
  }

  /**
   * V6修复：设置神启验证回调
   */
  public setDivineVerificationCallback(callback: (voterId: string) => Promise<boolean>): void {
    this.divineVerificationCallback = callback;
    console.log('[DAO] Divine verification callback registered');
  }

  /**
   * V6修复：检查是否需要神启验证
   */
  private requiresDivineVerification(bill: Bill): boolean {
    // 宪法修正案和紧急状态法案需要神启验证
    return bill.type === BillType.CONSTITUTIONAL || bill.type === BillType.EMERGENCY;
  }

  /**
   * 创建默认宪法
   */
  private createDefaultConstitution(): Constitution {
    return {
      id: 'constitution-v1',
      name: '永夜熵纪基础宪法',
      version: 1,
      lastModified: Date.now(),
      articles: [
        {
          id: 'art-1',
          number: '第一条',
          title: '基本人权',
          content: '所有市民享有生命权、自由权和追求幸福权。',
          isCore: true,
          requiredVotes: 100,
        },
        {
          id: 'art-2',
          number: '第二条',
          title: '法治原则',
          content: '任何权力必须受到法律约束，无人能凌驾于法律之上。',
          isCore: true,
          requiredVotes: 100,
        },
        {
          id: 'art-3',
          number: '第三条',
          title: '民主参与',
          content: '市民有权参与公共事务决策，任何重大决策必须经过市民投票。',
          isCore: false,
          requiredVotes: 80,
        },
        {
          id: 'art-4',
          number: '第四条',
          title: '熵增控制',
          content: '保护宇宙熵增平衡是每个市民的义务，破坏熵增平衡的行为将受到严厉惩罚。',
          isCore: true,
          requiredVotes: 100,
        },
        {
          id: 'art-5',
          number: '第五条',
          title: '科学自由',
          content: '保障科学研究的自由，但禁止危害文明的实验。',
          isCore: false,
          requiredVotes: 60,
        },
      ],
      billOfRights: [
        { id: 'right-1', name: '言论自由', description: '市民有权自由表达观点' },
        { id: 'right-2', name: '集会自由', description: '市民有权和平集会' },
        { id: 'right-3', name: '隐私权', description: '市民的私人信息受到保护' },
        { id: 'right-4', name: '工作权', description: '每个市民有权获得有意义的工作' },
        { id: 'right-5', name: '教育资源', description: '市民有权接受教育' },
      ],
    };
  }

  /**
   * 注册市民投票权
   */
  public registerCitizen(citizenId: string, baseWeight: number = 1): void {
    if (!this.citizens.has(citizenId)) {
      this.citizens.set(citizenId, {
        citizenId,
        baseWeight,
        reputation: 50,
        delegatedTo: null,
        delegatedFrom: [],
        participationRate: 0,
      });
    }
  }

  /**
   * 提案新法案
   */
  public proposeBill(
    proposerId: string,
    name: string,
    description: string,
    type: BillType,
    effects: BillEffect[],
    votingType: VotingType = VotingType.SIMPLE_MAJORITY
  ): Bill | null {
    // 检查提案权
    const voter = this.citizens.get(proposerId);
    if (!voter) return null;

    // 特殊类型需要特殊权限
    if (type === BillType.CONSTITUTIONAL && voter.reputation < 80) {
      return null;
    }

    const bill: Bill = {
      id: crypto.randomUUID(),
      name,
      description,
      type,
      proposerId,
      proposedAt: Date.now(),
      votingDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天
      votingType,
      yesVotes: [],
      noVotes: [],
      abstainVotes: [],
      status: VoteStatus.PROPOSED,
      effects,
    };

    this.bills.set(bill.id, bill);
    return bill;
  }

  /**
   * 计算投票权重
   */
  private calculateVoteWeight(voter: CitizenVotePower, bill: Bill): number {
    let weight = voter.baseWeight;

    // 声誉加成
    weight += voter.reputation * 0.01;

    // 参与率加成
    weight += voter.participationRate * 0.5;

    // 加权投票：根据市民类型
    if (bill.votingType === VotingType.WEIGHTED) {
      weight *= 2; // 有经验的市民权重翻倍
    }

    return weight;
  }

  /**
   * 移除之前的投票
   */
  private removePreviousVote(bill: Bill, voterId: string): void {
    bill.yesVotes = bill.yesVotes.filter(v => v.voterId !== voterId);
    bill.noVotes = bill.noVotes.filter(v => v.voterId !== voterId);
    bill.abstainVotes = bill.abstainVotes.filter(v => v.voterId !== voterId);
  }

  /**
   * 结算投票
   */
  public tallyVotes(billId: string): Bill | null {
    const bill = this.bills.get(billId);
    if (!bill) return null;

    // 计算总权重
    const yesWeight = bill.yesVotes.reduce((sum, v) => sum + v.weight, 0);
    const noWeight = bill.noVotes.reduce((sum, v) => sum + v.weight, 0);
    const totalWeight = yesWeight + noWeight + 
      bill.abstainVotes.reduce((sum, v) => sum + v.weight, 0);

    // 参与者数量
    const totalParticipants = bill.yesVotes.length + bill.noVotes.length + bill.abstainVotes.length;
    const participationRate = totalParticipants / this.citizens.size;

    // 根据投票类型决定结果
    let passed = false;

    switch (bill.votingType) {
      case VotingType.SIMPLE_MAJORITY:
        passed = yesWeight > noWeight && participationRate > 0.3;
        break;

      case VotingType.ABSOLUTE_MAJORITY:
        passed = yesWeight > totalWeight * 0.5 && participationRate > 0.5;
        break;

      case VotingType.QUADRATIC:
      case VotingType.LIQUID:
        passed = yesWeight > noWeight * 1.5 && participationRate > 0.4;
        break;

      case VotingType.WEIGHTED:
        passed = yesWeight > totalWeight * 0.6;
        break;
    }

    bill.status = passed ? VoteStatus.PASSED : VoteStatus.REJECTED;

    // 如果通过，执行法案
    if (passed) {
      this.executeBill(bill);
    }

    return bill;
  }

  /**
   * 执行法案
   */
  public executeBill(bill: Bill): void {
    const wasPassed = bill.status === VoteStatus.PASSED;
    bill.status = VoteStatus.EXECUTED;

    // 存储活跃法律效果
    this.activeLaws.set(bill.id, bill.effects);

    // 执行智能合约
    if (bill.smartContract) {
      this.executeSmartContract(bill.smartContract);
    }

    // 更新参与者声誉
    for (const vote of [...bill.yesVotes, ...bill.noVotes]) {
      const voter = this.citizens.get(vote.voterId);
      if (voter) {
        if (wasPassed) {
          voter.reputation = Math.min(100, voter.reputation + 1);
        } else {
          voter.reputation = Math.max(0, voter.reputation - 0.5);
        }
      }
    }
  }

  /**
   * 执行智能合约
   */
  public executeSmartContract(contract: SmartContract): void {
    for (const condition of contract.triggerConditions) {
      if (this.checkCondition(condition)) {
        for (const action of contract.actions) {
          this.executeAction(action);
        }
      }
    }
  }

  /**
   * 检查条件
   */
  private checkCondition(condition: TriggerCondition): boolean {
    switch (condition.type) {
      case 'time':
        return Date.now() >= (condition.params.timestamp as number);
      case 'entropy':
        return true; // 需要连接游戏状态
      case 'population':
        return true; // 需要连接游戏状态
      default:
        return false;
    }
  }

  /**
   * 执行动作
   */
  private executeAction(action: ContractAction): void {
    console.log(`[DAO] Executing action: ${action.type} on ${action.target}`);
  }

  /**
   * 委托投票权（流动民主）
   */
  public delegateVote(fromId: string, toId: string): boolean {
    const from = this.citizens.get(fromId);
    const to = this.citizens.get(toId);
    if (!from || !to) return false;

    // 不能委托给自己
    if (fromId === toId) return false;

    // 移除之前的委托
    if (from.delegatedTo) {
      const previousDelegate = this.citizens.get(from.delegatedTo);
      if (previousDelegate) {
        previousDelegate.delegatedFrom = previousDelegate.delegatedFrom.filter(id => id !== fromId);
      }
    }

    from.delegatedTo = toId;
    to.delegatedFrom.push(fromId);

    return true;
  }

  /**
   * 取消委托
   */
  public undelegateVote(citizenId: string): boolean {
    const citizen = this.citizens.get(citizenId);
    if (!citizen || !citizen.delegatedTo) return false;

    const delegate = this.citizens.get(citizen.delegatedTo);
    if (delegate) {
      delegate.delegatedFrom = delegate.delegatedFrom.filter(id => id !== citizenId);
    }

    citizen.delegatedTo = null;
    return true;
  }

  /**
   * 生成案件编号
   */
  private generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const num = String(this.caseNumberCounter++).padStart(6, '0');
    return `CASE-${year}-${num}`;
  }

  /**
   * 获取或创建市民司法状态
   */
  private getOrCreateCitizenJudicialState(citizenId: string): CitizenJudicialState {
    let state = this.citizenJudicialStates.get(citizenId);
    if (!state) {
      state = {
        citizenId,
        isImprisoned: false,
        isExiled: false,
        isOnProbation: false,
        restrictedRights: [],
        pendingSentences: [],
        totalFines: 0,
        totalImprisonmentDays: 0,
        criminalRecord: 0,
      };
      this.citizenJudicialStates.set(citizenId, state);
    }
    return state;
  }

  /**
   * 司法判决（新版完整实现）
   */
  public issueRuling(options: {
    caseType: CaseType;
    caseName: string;
    caseDescription?: string;
    plaintiff: string;
    defendant: string;
    defendantName?: string;
    judgeId?: string;
    verdict: VerdictType;
    sentences: Omit<SentenceDetail, 'status' | 'startedAt' | 'endedAt' | 'progress'>[];
    legalBasis: string[];
    rulingText?: string;
    evidence?: string[];
  }): JudicialRuling {
    const caseNumber = this.generateCaseNumber();
    const now = Date.now();

    const processedSentences: SentenceDetail[] = options.sentences.map(s => ({
      ...s,
      status: s.type === SentenceType.PROBATION ? SentenceStatus.ON_PROBATION : SentenceStatus.PENDING,
      startedAt: now,
      progress: 0,
    }));

    const ruling: JudicialRuling = {
      id: crypto.randomUUID(),
      caseNumber,
      caseType: options.caseType,
      caseName: options.caseName,
      caseDescription: options.caseDescription,
      plaintiff: options.plaintiff,
      defendant: options.defendant,
      judgeId: options.judgeId,
      verdict: options.verdict,
      sentences: processedSentences,
      legalBasis: options.legalBasis,
      timestamp: now,
      rulingText: options.rulingText,
      appealable: options.verdict !== VerdictType.INNOCENT && options.verdict !== VerdictType.WITHDRAWN,
      appealDeadline: now + 7 * 24 * 60 * 60 * 1000,
      evidence: options.evidence,
    };

    this.judicialHistory.push(ruling);

    const historyEntry: JudicialHistoryEntry = {
      id: crypto.randomUUID(),
      rulingId: ruling.id,
      caseNumber: ruling.caseNumber,
      defendantId: ruling.defendant,
      defendantName: options.defendantName || ruling.defendant,
      caseType: ruling.caseType,
      verdict: ruling.verdict,
      sentenceSummary: this.generateSentenceSummary(processedSentences),
      timestamp: now,
      executionStatus: SentenceStatus.PENDING,
    };
    this.judicialHistoryIndex.set(ruling.id, historyEntry);

    if (options.verdict === VerdictType.GUILTY) {
      const judicialState = this.getOrCreateCitizenJudicialState(options.defendant);
      judicialState.pendingSentences.push(...processedSentences);
      judicialState.criminalRecord++;
      judicialState.lastRulingTime = now;
    }

    this.emitJudicialEvent({
      type: 'ruling_issued',
      ruling,
      timestamp: now,
    });

    console.log(`[DAO] Ruling issued: ${caseNumber} - ${options.verdict}`);

    return ruling;
  }

  /**
   * 生成判决摘要
   */
  private generateSentenceSummary(sentences: SentenceDetail[]): string {
    if (sentences.length === 0) return '无处罚';

    const parts: string[] = [];
    for (const s of sentences) {
      switch (s.type) {
        case SentenceType.FINE:
          parts.push(`罚款${s.amount || 0}单位`);
          break;
        case SentenceType.IMPRISONMENT:
          parts.push(`监禁${s.duration || 0}天`);
          break;
        case SentenceType.EXILE:
          parts.push('流放');
          break;
        case SentenceType.COMMUNITY_SERVICE:
          parts.push(`社区服务${s.duration || 0}天`);
          break;
        case SentenceType.DEATH_PENALTY:
          parts.push('死刑');
          break;
        case SentenceType.RIGHTS_RESTRICTION:
          parts.push('权利限制');
          break;
        case SentenceType.PROBATION:
          parts.push(`缓刑${s.probationPeriod || 0}天`);
          break;
        case SentenceType.COMPENSATION:
          parts.push(`赔偿${s.amount || 0}单位`);
          break;
      }
    }
    return parts.join('、');
  }

  /**
   * 执行判决
   */
  public async executeSentence(
    rulingId: string,
    sentenceIndex: number = 0
  ): Promise<SentenceExecutionResult> {
    const ruling = this.judicialHistory.find(r => r.id === rulingId);
    if (!ruling) {
      return { success: false, message: '判决不存在' };
    }

    const sentence = ruling.sentences[sentenceIndex];
    if (!sentence) {
      return { success: false, message: '判决项不存在' };
    }

    if (sentence.status === SentenceStatus.COMPLETED) {
      return { success: false, message: '判决已执行完成' };
    }

    sentence.status = SentenceStatus.EXECUTING;
    sentence.startedAt = Date.now();

    const citizenId = ruling.defendant;
    const judicialState = this.getOrCreateCitizenJudicialState(citizenId);

    let result: SentenceExecutionResult;

    if (this.sentenceExecutionCallback) {
      result = await this.sentenceExecutionCallback(citizenId, sentence, ruling);
    } else {
      result = this.executeSentenceInternal(citizenId, sentence, ruling, judicialState);
    }

    if (result.success) {
      sentence.status = SentenceStatus.COMPLETED;
      sentence.endedAt = Date.now();
      sentence.progress = 100;

      if (result.citizenUpdates) {
        Object.assign(judicialState, result.citizenUpdates);
      }

      const historyEntry = this.judicialHistoryIndex.get(rulingId);
      if (historyEntry) {
        const allCompleted = ruling.sentences.every(s => s.status === SentenceStatus.COMPLETED);
        historyEntry.executionStatus = allCompleted ? SentenceStatus.COMPLETED : SentenceStatus.EXECUTING;
      }

      this.emitJudicialEvent({
        type: 'sentence_executed',
        ruling,
        sentence,
        result,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  /**
   * 内部执行判决逻辑
   */
  private executeSentenceInternal(
    citizenId: string,
    sentence: SentenceDetail,
    ruling: JudicialRuling,
    judicialState: CitizenJudicialState
  ): SentenceExecutionResult {
    const citizenName = this.getCitizenName(citizenId);
    const previousState = { ...judicialState };
    const updates: Partial<CitizenJudicialState> = {};
    const resourceChanges: Record<string, number> = {};

    switch (sentence.type) {
      case SentenceType.FINE: {
        return this.executeFine(citizenId, citizenName, sentence, ruling, judicialState, previousState);
      }

      case SentenceType.IMPRISONMENT: {
        return this.executeImprisonment(citizenId, citizenName, sentence, ruling, judicialState, previousState);
      }

      case SentenceType.EXILE: {
        return this.executeExile(citizenId, citizenName, sentence, ruling, judicialState, previousState);
      }

      case SentenceType.COMMUNITY_SERVICE: {
        return this.executeCommunityService(citizenId, citizenName, sentence, ruling, judicialState, previousState);
      }

      case SentenceType.DEATH_PENALTY: {
        return this.executeDeathPenalty(citizenId, citizenName, sentence, ruling, judicialState, previousState);
      }

      case SentenceType.RIGHTS_RESTRICTION: {
        return this.executeRightsRestriction(citizenId, citizenName, sentence, ruling, judicialState, previousState);
      }

      case SentenceType.PROBATION: {
        return this.executeProbation(citizenId, citizenName, sentence, ruling, judicialState, previousState);
      }

      case SentenceType.COMPENSATION: {
        return this.executeCompensation(citizenId, citizenName, sentence, ruling, judicialState, previousState);
      }

      default:
        return { success: false, message: '未知判决类型' };
    }
  }

  /**
   * 执行罚款判决
   */
  private executeFine(
    citizenId: string,
    citizenName: string,
    sentence: SentenceDetail,
    ruling: JudicialRuling,
    judicialState: CitizenJudicialState,
    previousState: Partial<CitizenJudicialState>
  ): SentenceExecutionResult {
    const amount = sentence.amount || 100;
    const updates: Partial<CitizenJudicialState> = {};
    const resourceChanges: Record<string, number> = {};

    let deductedAmount = amount;
    let success = true;
    let message = '';

    if (this.citizenCallbacks) {
      const assets = this.citizenCallbacks.getAssets(citizenId);
      if (assets) {
        if (assets.money >= amount) {
          this.citizenCallbacks.deductMoney(citizenId, amount);
          message = `罚款 ${amount} 单位已从 ${citizenName} 的资产中扣除`;
        } else {
          deductedAmount = assets.money;
          this.citizenCallbacks.deductMoney(citizenId, assets.money);
          message = `${citizenName} 资产不足，已扣除全部 ${assets.money} 单位（欠款 ${amount - assets.money} 单位将记录在案）`;
        }
        resourceChanges.money = -deductedAmount;
      } else {
        success = false;
        message = `无法获取 ${citizenName} 的资产信息`;
      }
    } else {
      message = `罚款 ${amount} 单位已执行（模拟模式）`;
      resourceChanges.money = -amount;
    }

    updates.totalFines = (judicialState.totalFines || 0) + deductedAmount;

    const citizen = this.citizens.get(citizenId);
    if (citizen) {
      citizen.reputation = Math.max(0, citizen.reputation - amount * 0.1);
    }

    this.logExecution({
      rulingId: ruling.id,
      caseNumber: ruling.caseNumber,
      citizenId,
      citizenName,
      sentenceType: SentenceType.FINE,
      action: 'execute',
      details: message,
      previousState,
      newState: updates,
      resourceChanges,
      success,
      errorMessage: success ? undefined : message,
    });

    return {
      success,
      message,
      citizenUpdates: updates,
      resourceChanges,
    };
  }

  /**
   * 执行监禁判决
   */
  private executeImprisonment(
    citizenId: string,
    citizenName: string,
    sentence: SentenceDetail,
    ruling: JudicialRuling,
    judicialState: CitizenJudicialState,
    previousState: Partial<CitizenJudicialState>
  ): SentenceExecutionResult {
    const duration = sentence.duration || 30;
    const updates: Partial<CitizenJudicialState> = {};

    updates.isImprisoned = true;
    updates.imprisonmentRemaining = duration;
    updates.totalImprisonmentDays = (judicialState.totalImprisonmentDays || 0) + duration;

    if (this.citizenCallbacks) {
      this.citizenCallbacks.setImprisoned(citizenId, true, duration);
      this.citizenCallbacks.setFreedom(citizenId, 0);
    }

    const citizen = this.citizens.get(citizenId);
    if (citizen) {
      citizen.reputation = Math.max(0, citizen.reputation - 30);
      citizen.baseWeight *= 0.8;
    }

    const message = `${citizenName} 已被监禁，刑期 ${duration} 天`;

    this.logExecution({
      rulingId: ruling.id,
      caseNumber: ruling.caseNumber,
      citizenId,
      citizenName,
      sentenceType: SentenceType.IMPRISONMENT,
      action: 'execute',
      details: message,
      previousState,
      newState: updates,
      success: true,
    });

    return {
      success: true,
      message,
      citizenUpdates: updates,
    };
  }

  /**
   * 执行流放判决
   */
  private executeExile(
    citizenId: string,
    citizenName: string,
    sentence: SentenceDetail,
    ruling: JudicialRuling,
    judicialState: CitizenJudicialState,
    previousState: Partial<CitizenJudicialState>
  ): SentenceExecutionResult {
    const updates: Partial<CitizenJudicialState> = {};

    const exileIndex = Math.floor(Math.random() * this.exileDestinations.length);
    const exileLocation = this.exileDestinations[exileIndex];
    updates.isExiled = true;
    updates.exileLocation = { x: exileLocation.x, y: exileLocation.y };

    if (this.citizenCallbacks) {
      const currentLocation = this.citizenCallbacks.getLocation(citizenId);
      if (currentLocation) {
        this.citizenCallbacks.setLocation(citizenId, exileLocation);
      }
      this.citizenCallbacks.setExiled(citizenId, true, exileLocation);
    }

    const citizen = this.citizens.get(citizenId);
    if (citizen) {
      citizen.reputation = Math.max(0, citizen.reputation - 50);
    }

    const message = `${citizenName} 已被流放到边缘区域 (${exileLocation.x}, ${exileLocation.y})`;

    this.logExecution({
      rulingId: ruling.id,
      caseNumber: ruling.caseNumber,
      citizenId,
      citizenName,
      sentenceType: SentenceType.EXILE,
      action: 'execute',
      details: message,
      previousState,
      newState: updates,
      success: true,
    });

    this.emitJudicialEvent({
      type: 'citizen_exiled',
      citizenId,
      ruling,
      sentence,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message,
      citizenUpdates: updates,
    };
  }

  /**
   * 执行社区服务判决
   */
  private executeCommunityService(
    citizenId: string,
    citizenName: string,
    sentence: SentenceDetail,
    ruling: JudicialRuling,
    judicialState: CitizenJudicialState,
    previousState: Partial<CitizenJudicialState>
  ): SentenceExecutionResult {
    const duration = sentence.duration || 7;
    const resourceChanges: Record<string, number> = {};

    const citizen = this.citizens.get(citizenId);
    if (citizen) {
      citizen.reputation = Math.min(100, citizen.reputation + duration * 0.5);
    }

    resourceChanges.biomass = duration * 10;
    const message = `${citizenName} 已开始 ${duration} 天的社区服务`;

    this.logExecution({
      rulingId: ruling.id,
      caseNumber: ruling.caseNumber,
      citizenId,
      citizenName,
      sentenceType: SentenceType.COMMUNITY_SERVICE,
      action: 'execute',
      details: message,
      previousState,
      newState: {},
      resourceChanges,
      success: true,
    });

    return {
      success: true,
      message,
      resourceChanges,
    };
  }

  /**
   * 执行死刑判决
   */
  private executeDeathPenalty(
    citizenId: string,
    citizenName: string,
    sentence: SentenceDetail,
    ruling: JudicialRuling,
    judicialState: CitizenJudicialState,
    previousState: Partial<CitizenJudicialState>
  ): SentenceExecutionResult {
    if (this.citizenCallbacks) {
      this.citizenCallbacks.removeCitizen(citizenId);
    }

    this.citizens.delete(citizenId);
    this.citizenJudicialStates.delete(citizenId);

    const message = `死刑已对 ${citizenName} 执行，该市民已被永久移除`;

    this.logExecution({
      rulingId: ruling.id,
      caseNumber: ruling.caseNumber,
      citizenId,
      citizenName,
      sentenceType: SentenceType.DEATH_PENALTY,
      action: 'execute',
      details: message,
      previousState,
      newState: undefined,
      success: true,
    });

    this.emitJudicialEvent({
      type: 'citizen_executed',
      citizenId,
      ruling,
      sentence,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message,
    };
  }

  /**
   * 执行权利限制判决
   */
  private executeRightsRestriction(
    citizenId: string,
    citizenName: string,
    sentence: SentenceDetail,
    ruling: JudicialRuling,
    judicialState: CitizenJudicialState,
    previousState: Partial<CitizenJudicialState>
  ): SentenceExecutionResult {
    const updates: Partial<CitizenJudicialState> = {};

    const restrictedRights = [...judicialState.restrictedRights, 'voting', 'office', 'property_ownership'];
    updates.restrictedRights = [...new Set(restrictedRights)];

    const citizen = this.citizens.get(citizenId);
    if (citizen) {
      citizen.baseWeight *= 0.5;
    }

    const message = `${citizenName} 的权利已被限制：投票权、任职权、财产权`;

    this.logExecution({
      rulingId: ruling.id,
      caseNumber: ruling.caseNumber,
      citizenId,
      citizenName,
      sentenceType: SentenceType.RIGHTS_RESTRICTION,
      action: 'execute',
      details: message,
      previousState,
      newState: updates,
      success: true,
    });

    return {
      success: true,
      message,
      citizenUpdates: updates,
    };
  }

  /**
   * 执行缓刑判决
   */
  private executeProbation(
    citizenId: string,
    citizenName: string,
    sentence: SentenceDetail,
    ruling: JudicialRuling,
    judicialState: CitizenJudicialState,
    previousState: Partial<CitizenJudicialState>
  ): SentenceExecutionResult {
    const updates: Partial<CitizenJudicialState> = {};
    const probationPeriod = sentence.probationPeriod || 30;

    updates.isOnProbation = true;
    updates.probationRemaining = probationPeriod;

    if (this.citizenCallbacks) {
      this.citizenCallbacks.setFreedom(citizenId, 50);
    }

    const message = `${citizenName} 已进入 ${probationPeriod} 天的缓刑期`;

    this.logExecution({
      rulingId: ruling.id,
      caseNumber: ruling.caseNumber,
      citizenId,
      citizenName,
      sentenceType: SentenceType.PROBATION,
      action: 'execute',
      details: message,
      previousState,
      newState: updates,
      success: true,
    });

    return {
      success: true,
      message,
      citizenUpdates: updates,
    };
  }

  /**
   * 执行赔偿判决
   */
  private executeCompensation(
    citizenId: string,
    citizenName: string,
    sentence: SentenceDetail,
    ruling: JudicialRuling,
    judicialState: CitizenJudicialState,
    previousState: Partial<CitizenJudicialState>
  ): SentenceExecutionResult {
    const amount = sentence.amount || 50;
    const updates: Partial<CitizenJudicialState> = {};
    const resourceChanges: Record<string, number> = {};

    let paidAmount = 0;
    let success = true;
    let message = '';

    if (this.citizenCallbacks) {
      const assets = this.citizenCallbacks.getAssets(citizenId);
      if (assets) {
        if (assets.money >= amount) {
          this.citizenCallbacks.deductMoney(citizenId, amount);
          paidAmount = amount;
          message = `${citizenName} 已向受害者支付赔偿金 ${amount} 单位`;
        } else {
          paidAmount = assets.money;
          this.citizenCallbacks.deductMoney(citizenId, assets.money);
          message = `${citizenName} 资产不足，已支付 ${assets.money} 单位（欠款 ${amount - assets.money} 单位）`;
        }
        resourceChanges.money = -paidAmount;
      } else {
        success = false;
        message = `无法获取 ${citizenName} 的资产信息`;
      }
    } else {
      paidAmount = amount;
      message = `赔偿 ${amount} 单位已支付（模拟模式）`;
      resourceChanges.money = -amount;
    }

    updates.totalFines = (judicialState.totalFines || 0) + paidAmount;

    const citizen = this.citizens.get(citizenId);
    if (citizen) {
      citizen.reputation = Math.max(0, citizen.reputation - amount * 0.05);
    }

    this.logExecution({
      rulingId: ruling.id,
      caseNumber: ruling.caseNumber,
      citizenId,
      citizenName,
      sentenceType: SentenceType.COMPENSATION,
      action: 'execute',
      details: message,
      previousState,
      newState: updates,
      resourceChanges,
      success,
      errorMessage: success ? undefined : message,
    });

    return {
      success,
      message,
      citizenUpdates: updates,
      resourceChanges,
    };
  }

  /**
   * 赦免市民
   */
  public grantPardon(options: {
    citizenId: string;
    pardonType: 'full' | 'partial' | 'amnesty';
    reason: string;
    grantedBy: string;
    specificRulings?: string[];
    notes?: string;
  }): PardonRecord | null {
    const citizenName = this.getCitizenName(options.citizenId);
    const judicialState = this.getOrCreateCitizenJudicialState(options.citizenId);
    const previousState = { ...judicialState };

    let pardonedRulings: string[] = [];

    if (options.pardonType === 'full') {
      pardonedRulings = this.judicialHistory
        .filter(r => r.defendant === options.citizenId)
        .map(r => r.id);
      
      judicialState.criminalRecord = 0;
      judicialState.pendingSentences = [];
      judicialState.restrictedRights = [];
      judicialState.isImprisoned = false;
      judicialState.imprisonmentRemaining = undefined;
      judicialState.isOnProbation = false;
      judicialState.probationRemaining = undefined;
      
      if (this.citizenCallbacks) {
        this.citizenCallbacks.setFreedom(options.citizenId, 100);
        this.citizenCallbacks.setImprisoned(options.citizenId, false);
        this.citizenCallbacks.setExiled(options.citizenId, false);
      }
    } else if (options.pardonType === 'partial') {
      pardonedRulings = options.specificRulings || [];
      
      for (const rulingId of pardonedRulings) {
        const ruling = this.judicialHistory.find(r => r.id === rulingId);
        if (ruling && ruling.defendant === options.citizenId) {
          for (const sentence of ruling.sentences) {
            sentence.status = SentenceStatus.REVOKED;
            sentence.notes = `已赦免: ${options.reason}`;
          }
        }
      }
      
      judicialState.pendingSentences = judicialState.pendingSentences.filter(
        s => !pardonedRulings.some(id => {
          const ruling = this.judicialHistory.find(r => r.id === id);
          return ruling?.sentences.includes(s);
        })
      );
      
      if (judicialState.criminalRecord > 0) {
        judicialState.criminalRecord = Math.max(0, judicialState.criminalRecord - pardonedRulings.length);
      }
    } else if (options.pardonType === 'amnesty') {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      pardonedRulings = this.judicialHistory
        .filter(r => r.defendant === options.citizenId && r.timestamp < thirtyDaysAgo)
        .map(r => r.id);
      
      for (const rulingId of pardonedRulings) {
        const ruling = this.judicialHistory.find(r => r.id === rulingId);
        if (ruling) {
          for (const sentence of ruling.sentences) {
            sentence.status = SentenceStatus.REVOKED;
            sentence.notes = `大赦: ${options.reason}`;
          }
        }
      }
      
      judicialState.criminalRecord = Math.max(0, judicialState.criminalRecord - pardonedRulings.length);
    }

    const pardonRecord: PardonRecord = {
      id: crypto.randomUUID(),
      citizenId: options.citizenId,
      citizenName,
      pardonType: options.pardonType,
      pardonedRulings,
      reason: options.reason,
      grantedBy: options.grantedBy,
      timestamp: Date.now(),
      previousCriminalRecord: previousState.criminalRecord || 0,
      notes: options.notes,
    };

    this.pardonRecords.push(pardonRecord);

    this.logExecution({
      rulingId: '',
      caseNumber: '',
      citizenId: options.citizenId,
      citizenName,
      sentenceType: SentenceType.PROBATION,
      action: 'pardon',
      details: `${options.pardonType === 'full' ? '完全' : options.pardonType === 'partial' ? '部分' : '大'}赦免已授予: ${options.reason}`,
      previousState,
      newState: judicialState,
      success: true,
    });

    this.emitJudicialEvent({
      type: 'pardon_granted',
      citizenId: options.citizenId,
      reason: options.reason,
      timestamp: Date.now(),
    });

    console.log(`[DAO] Pardon granted to ${citizenName}: ${options.pardonType}`);

    return pardonRecord;
  }

  /**
   * 获取赦免记录
   */
  public getPardonRecords(citizenId?: string): PardonRecord[] {
    let records = [...this.pardonRecords];
    if (citizenId) {
      records = records.filter(r => r.citizenId === citizenId);
    }
    return records.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 检查市民是否可以执行某动作（考虑司法状态）
   */
  public canCitizenPerformAction(citizenId: string, action: 'vote' | 'travel' | 'work' | 'trade' | 'own_property'): boolean {
    const state = this.citizenJudicialStates.get(citizenId);
    if (!state) return true;

    if (state.isImprisoned) {
      return false;
    }

    if (state.isExiled && action === 'travel') {
      return false;
    }

    if (state.restrictedRights.includes('voting') && action === 'vote') {
      return false;
    }

    if (state.restrictedRights.includes('property_ownership') && action === 'own_property') {
      return false;
    }

    return true;
  }

  /**
   * 更新判决执行进度
   */
  public updateSentenceProgress(citizenId: string, deltaTimeDays: number): void {
    const judicialState = this.citizenJudicialStates.get(citizenId);
    if (!judicialState) return;

    if (judicialState.isImprisoned && judicialState.imprisonmentRemaining) {
      judicialState.imprisonmentRemaining = Math.max(0, judicialState.imprisonmentRemaining - deltaTimeDays);
      if (judicialState.imprisonmentRemaining <= 0) {
        judicialState.isImprisoned = false;
        judicialState.imprisonmentRemaining = undefined;
        this.emitJudicialEvent({
          type: 'sentence_completed',
          citizenId,
          sentenceType: SentenceType.IMPRISONMENT,
          timestamp: Date.now(),
        });
      }
    }

    if (judicialState.isOnProbation && judicialState.probationRemaining) {
      judicialState.probationRemaining = Math.max(0, judicialState.probationRemaining - deltaTimeDays);
      if (judicialState.probationRemaining <= 0) {
        judicialState.isOnProbation = false;
        judicialState.probationRemaining = undefined;
        this.emitJudicialEvent({
          type: 'sentence_completed',
          citizenId,
          sentenceType: SentenceType.PROBATION,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * 获取市民司法状态
   */
  public getCitizenJudicialState(citizenId: string): CitizenJudicialState | undefined {
    return this.citizenJudicialStates.get(citizenId);
  }

  /**
   * 获取司法历史记录
   */
  public getJudicialHistory(options?: {
    citizenId?: string;
    caseType?: CaseType;
    limit?: number;
    offset?: number;
  }): JudicialHistoryEntry[] {
    let results = Array.from(this.judicialHistoryIndex.values());

    if (options?.citizenId) {
      results = results.filter(e => e.defendantId === options.citizenId);
    }
    if (options?.caseType) {
      results = results.filter(e => e.caseType === options.caseType);
    }

    results.sort((a, b) => b.timestamp - a.timestamp);

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    return results.slice(offset, offset + limit);
  }

  /**
   * 获取判决详情
   */
  public getRuling(rulingId: string): JudicialRuling | undefined {
    return this.judicialHistory.find(r => r.id === rulingId);
  }

  /**
   * 获取市民待执行判决
   */
  public getPendingSentences(citizenId: string): Array<{ ruling: JudicialRuling; sentence: SentenceDetail; index: number }> {
    const results: Array<{ ruling: JudicialRuling; sentence: SentenceDetail; index: number }> = [];

    for (const ruling of this.judicialHistory) {
      if (ruling.defendant !== citizenId) continue;

      ruling.sentences.forEach((sentence, index) => {
        if (sentence.status === SentenceStatus.PENDING || sentence.status === SentenceStatus.EXECUTING) {
          results.push({ ruling, sentence, index });
        }
      });
    }

    return results;
  }

  /**
   * 撤销判决
   */
  public revokeSentence(rulingId: string, sentenceIndex: number, reason: string): boolean {
    const ruling = this.judicialHistory.find(r => r.id === rulingId);
    if (!ruling) return false;

    const sentence = ruling.sentences[sentenceIndex];
    if (!sentence) return false;

    sentence.status = SentenceStatus.REVOKED;
    sentence.notes = `撤销原因: ${reason}`;

    const judicialState = this.citizenJudicialStates.get(ruling.defendant);
    if (judicialState) {
      judicialState.pendingSentences = judicialState.pendingSentences.filter(
        s => s !== sentence
      );
    }

    this.emitJudicialEvent({
      type: 'sentence_revoked',
      ruling,
      sentence,
      reason,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 上诉判决
   */
  public appealRuling(rulingId: string, appellantId: string, reason: string): boolean {
    const ruling = this.judicialHistory.find(r => r.id === rulingId);
    if (!ruling || !ruling.appealable) return false;
    if (Date.now() > (ruling.appealDeadline || 0)) return false;

    this.emitJudicialEvent({
      type: 'appeal_filed',
      ruling,
      appellantId,
      reason,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 获取司法统计
   */
  public getJudicialStatistics(): {
    totalCases: number;
    byCaseType: Record<CaseType, number>;
    byVerdict: Record<VerdictType, number>;
    activeSentences: number;
    imprisonedCitizens: number;
    exiledCitizens: number;
  } {
    const stats = {
      totalCases: this.judicialHistory.length,
      byCaseType: {} as Record<CaseType, number>,
      byVerdict: {} as Record<VerdictType, number>,
      activeSentences: 0,
      imprisonedCitizens: 0,
      exiledCitizens: 0,
    };

    for (const caseType of Object.values(CaseType)) {
      stats.byCaseType[caseType] = 0;
    }
    for (const verdict of Object.values(VerdictType)) {
      stats.byVerdict[verdict] = 0;
    }

    for (const ruling of this.judicialHistory) {
      stats.byCaseType[ruling.caseType]++;
      stats.byVerdict[ruling.verdict]++;
      for (const sentence of ruling.sentences) {
        if (sentence.status === SentenceStatus.PENDING || sentence.status === SentenceStatus.EXECUTING) {
          stats.activeSentences++;
        }
      }
    }

    for (const state of this.citizenJudicialStates.values()) {
      if (state.isImprisoned) stats.imprisonedCitizens++;
      if (state.isExiled) stats.exiledCitizens++;
    }

    return stats;
  }

  /**
   * 修改宪法
   */
  public amendConstitution(
    articleId: string,
    newContent: string,
    voterId: string
  ): boolean {
    const article = this.constitution.articles.find(a => a.id === articleId);
    if (!article) return false;

    // 检查核心条款
    if (article.isCore) return false;

    // 提案修正案
    const bill = this.proposeBill(
      voterId,
      `宪法修正案：${article.title}`,
      newContent,
      BillType.CONSTITUTIONAL,
      [{ type: 'government_structure', params: { article: articleId, newContent }, intensity: 1, activationTime: Date.now() }],
      VotingType.ABSOLUTE_MAJORITY
    );

    return bill !== null;
  }

  /**
   * 获取宪法
   */
  public getConstitution(): Constitution {
    return this.constitution;
  }

  /**
   * 获取法案
   */
  public getBill(billId: string): Bill | undefined {
    return this.bills.get(billId);
  }

  /**
   * 获取所有法案
   */
  public getAllBills(): Bill[] {
    return Array.from(this.bills.values());
  }

  /**
   * 获取活跃法案
   */
  public getActiveLaws(): Map<string, BillEffect[]> {
    return this.activeLaws;
  }

  /**
   * 获取市民投票权
   */
  public getCitizenVotePower(citizenId: string): CitizenVotePower | undefined {
    return this.citizens.get(citizenId);
  }

  /**
   * 应用法律效果到游戏状态
   */
  public applyLawsToGameState(): Record<string, number> {
    const modifiers: Record<string, number> = {
      resourceMultiplier: 1,
      entropyRate: 0,
      citizenRights: 1,
    };

    for (const effects of this.activeLaws.values()) {
      for (const effect of effects) {
        switch (effect.type) {
          case 'resource_change':
            if (effect.params.resource === 'coreEnergy') {
              modifiers.resourceMultiplier *= effect.intensity * (effect.params.amount as number || 1);
            }
            break;
          case 'entropy_change':
            modifiers.entropyRate += effect.intensity * (effect.params.rate as number || 0);
            break;
          case 'citizen_rights':
            modifiers.citizenRights *= effect.intensity;
            break;
        }
      }
    }

    return modifiers;
  }

  /**
   * 更新DAO系统（每帧调用）
   */
  public update(_deltaMs: number): void {
    // 检查法案超时
    for (const [billId, bill] of this.bills) {
      if (bill.status === VoteStatus.EXECUTED && bill.expiresAt && Date.now() > bill.expiresAt) {
        bill.status = VoteStatus.TABLED;
        this.activeLaws.delete(billId);
      }
    }
  }
}

/** 市民投票权信息 */
interface CitizenVotePower {
  citizenId: string;
  baseWeight: number;
  reputation: number;
  delegatedTo: string | null;
  delegatedFrom: string[];
  participationRate: number;
}

/** 司法事件类型 */
export interface JudicialEvent {
  type: 'ruling_issued' | 'sentence_executed' | 'sentence_completed' | 'sentence_revoked' | 'appeal_filed' | 'pardon_granted' | 'citizen_executed' | 'citizen_exiled';
  ruling?: JudicialRuling;
  sentence?: SentenceDetail;
  result?: SentenceExecutionResult;
  citizenId?: string;
  sentenceType?: SentenceType;
  appellantId?: string;
  reason?: string;
  timestamp: number;
}

/** 判决执行日志条目 */
export interface SentenceExecutionLog {
  id: string;
  rulingId: string;
  caseNumber: string;
  citizenId: string;
  citizenName: string;
  sentenceType: SentenceType;
  action: 'execute' | 'complete' | 'revoke' | 'pardon' | 'progress_update';
  details: string;
  timestamp: number;
  previousState?: Partial<CitizenJudicialState>;
  newState?: Partial<CitizenJudicialState>;
  resourceChanges?: Record<string, number>;
  success: boolean;
  errorMessage?: string;
}

/** 赦免记录 */
export interface PardonRecord {
  id: string;
  citizenId: string;
  citizenName: string;
  pardonType: 'full' | 'partial' | 'amnesty';
  pardonedRulings: string[];
  reason: string;
  grantedBy: string;
  timestamp: number;
  previousCriminalRecord: number;
  notes?: string;
}

/** 市民资产接口 */
export interface CitizenAssets {
  money: number;
  resources?: Record<string, number>;
}

/** 市民位置接口 */
export interface CitizenLocation {
  x: number;
  y: number;
  regionId?: string;
}

/** 市民回调接口 */
export interface CitizenCallbacks {
  getAssets: (citizenId: string) => CitizenAssets | null;
  deductMoney: (citizenId: string, amount: number) => boolean;
  getLocation: (citizenId: string) => CitizenLocation | null;
  setLocation: (citizenId: string, location: CitizenLocation) => boolean;
  removeCitizen: (citizenId: string) => boolean;
  getCitizenName: (citizenId: string) => string;
  setFreedom: (citizenId: string, freedom: number) => boolean;
  setImprisoned: (citizenId: string, imprisoned: boolean, duration?: number) => boolean;
  setExiled: (citizenId: string, exiled: boolean, location?: CitizenLocation) => boolean;
}

/** 提案接口（兼容测试API） */
export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: BillType | string;
  proposerId: string;
  state: string;
  votes: {
    for: number;
    against: number;
    abstain: number;
  };
  createdAt: number;
  deadline: number;
}

// 导出单例
export const daoSystem = new DAOSystem();
export default daoSystem;
