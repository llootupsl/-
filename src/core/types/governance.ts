/**
 * 治理系统类型定义
 */

import type { EntityId, Timestamp, Duration, Probability } from './index';

/**
 * 提案
 */
export interface Proposal {
  /** 提案 ID */
  id: EntityId;
  /** 提案标题 */
  title: string;
  /** 提案描述 */
  description: string;
  /** 提案类型 */
  type: ProposalType;
  /** 提案者 ID */
  proposerId: EntityId;
  /** 创建时间 */
  createdAt: Timestamp;
  /** 投票开始时间 */
  votingStartAt: Timestamp;
  /** 投票结束时间 */
  votingEndAt: Timestamp;
  /** 状态 */
  status: ProposalStatus;
  /** 支持票数 */
  votesFor: number;
  /** 反对票数 */
  votesAgainst: number;
  /** 弃权票数 */
  votesAbstain: number;
  /** 通过条件 */
  passCondition: PassCondition;
}

/**
 * 提案类型
 */
export enum ProposalType {
  POLICY = 'policy',           // 政策提案
  LAW = 'law',                 // 法律提案
  BUDGET = 'budget',           // 预算提案
  CONSTITUTION = 'constitution', // 宪法修正
  RECALL = 'recall',           // 弹劾
  WAR = 'war',                 // 战争宣言
  TREATY = 'treaty',           // 条约
  INFRASTRUCTURE = 'infrastructure', // 基础设施
}

/**
 * 提案状态
 */
export enum ProposalStatus {
  DRAFT = 'draft',             // 草稿
  PUBLISHED = 'published',    // 已发布
  VOTING = 'voting',          // 投票中
  PASSED = 'passed',          // 已通过
  REJECTED = 'rejected',      // 已否决
  EXPIRED = 'expired',        // 已过期
  CANCELLED = 'cancelled',    // 已取消
}

/**
 * 通过条件
 */
export interface PassCondition {
  /** 条件类型 */
  type: PassConditionType;
  /** 阈值 */
  threshold: number;
  /** 最小投票数 */
  minVotes: number;
  /** 是否加权 */
  weighted: boolean;
  /** 加权方式 */
  weightBy?: 'reputation' | 'stake' | 'time';
}

/**
 * 通过条件类型
 */
export enum PassConditionType {
  SIMPLE_MAJORITY = 'simple_majority',
  SUPERMajority = 'supermajority',
  UNANIMOUS = 'unanimous',
  QUORUM = 'quorum',
  CONSENSUS = 'consensus',
}

/**
 * 投票
 */
export interface Vote {
  /** 投票 ID */
  id: EntityId;
  /** 提案 ID */
  proposalId: EntityId;
  /** 投票者 ID */
  voterId: EntityId;
  /** 投票选择 */
  choice: VoteChoice;
  /** 投票权重 */
  weight: number;
  /** 投票时间 */
  timestamp: Timestamp;
  /** 委托来源 (如果是委托投票) */
  delegatedFrom?: EntityId;
}

/**
 * 投票选择
 */
export enum VoteChoice {
  YES = 'yes',
  NO = 'no',
  ABSTAIN = 'abstain',
}

/**
 * 法律
 */
export interface Law {
  /** 法律 ID */
  id: EntityId;
  /** 法律标题 */
  title: string;
  /** 法律内容 */
  content: string;
  /** 法律类型 */
  type: LawType;
  /** 通过的提案 ID */
  proposalId?: EntityId;
  /** 生效时间 */
  effectiveAt: Timestamp;
  /** 状态 */
  status: LawStatus;
  /** 违反次数 */
  violations: number;
  /** 处罚力度 */
  penaltyLevel: number;
}

/**
 * 法律类型
 */
export enum LawType {
  CONSTITUTION = 'constitution',     // 宪法
  CRIMINAL = 'criminal',           // 刑法
  CIVIL = 'civil',                 // 民法
  ADMINISTRATIVE = 'administrative', // 行政法
  ECONOMIC = 'economic',           // 经济法
  ENVIRONMENTAL = 'environmental', // 环境法
  SOCIAL = 'social',               // 社会法
}

/**
 * 法律状态
 */
export enum LawStatus {
  PROPOSED = 'proposed',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REPEALED = 'repealed',
  AMENDED = 'amended',
}

/**
 * 政党/派系
 */
export interface Faction {
  /** 派系 ID */
  id: EntityId;
  /** 派系名称 */
  name: string;
  /** 派系描述 */
  description: string;
  /** 派系图标 */
  icon?: string;
  /** 成员列表 */
  memberIds: EntityId[];
  /** 领袖 ID */
  leaderId?: EntityId;
  /** 意识形态 */
  ideology: Ideology;
  /** 影响力 */
  influence: number;
  /** 资源 */
  resources: Record<string, number>;
}

/**
 * 意识形态
 */
export interface Ideology {
  /** 经济立场 (-1 左派, 1 右派) */
  economic: number;
  /** 社会立场 (-1 自由, 1 保守) */
  social: number;
  /** 外交立场 (-1 和平, 1 扩张) */
  foreign: number;
}

/**
 * 治理机构
 */
export interface GovernmentBody {
  /** 机构 ID */
  id: EntityId;
  /** 机构名称 */
  name: string;
  /** 机构类型 */
  type: GovernmentBodyType;
  /** 成员 */
  memberIds: EntityId[];
  /** 权力范围 */
  powers: GovernmentPower[];
  /** 任期 */
  termDuration?: Duration;
  /** 上次选举 */
  lastElectionAt?: Timestamp;
  /** 下次选举 */
  nextElectionAt?: Timestamp;
}

/**
 * 政府机构类型
 */
export enum GovernmentBodyType {
  EXECUTIVE = 'executive',       // 行政
  LEGISLATIVE = 'legislative',   // 立法
  JUDICIAL = 'judicial',         // 司法
  MILITARY = 'military',         // 军事
  INTELLIGENCE = 'intelligence', // 情报
}

/**
 * 政府权力
 */
export enum GovernmentPower {
  EXECUTE_LAWS = 'execute_laws',
  CREATE_LAWS = 'create_laws',
  JUDGE_CASES = 'judge_cases',
  DECLARE_WAR = 'declare_war',
  MANAGE_BUDGET = 'manage_budget',
  APPOINT_OFFICIALS = 'appoint_officials',
  VETO = 'veto',
}

/**
 * 选举
 */
export interface Election {
  /** 选举 ID */
  id: EntityId;
  /** 选举类型 */
  type: ElectionType;
  /** 职位/机构 */
  targetId: EntityId;
  /** 开始时间 */
  startAt: Timestamp;
  /** 结束时间 */
  endAt: Timestamp;
  /** 候选人 */
  candidates: Candidate[];
  /** 状态 */
  status: ElectionStatus;
  /** 投票数 */
  totalVotes: number;
  /** 当选者 */
  winnerId?: EntityId;
}

/**
 * 选举类型
 */
export enum ElectionType {
  GENERAL = 'general',           // 大选
  PRIMARY = 'primary',           // 初选
  BY_ELECTION = 'by_election',   // 补选
  RECALL = 'recall',             // 罢免
  REFERENDUM = 'referendum',     // 公投
}

/**
 * 选举状态
 */
export enum ElectionStatus {
  UPCOMING = 'upcoming',
  VOTING = 'voting',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * 候选人
 */
export interface Candidate {
  /** 候选人 ID */
  id: EntityId;
  /** 政党/派系 */
  factionId?: EntityId;
  /** 得票数 */
  votes: number;
  /** 是否当选 */
  elected: boolean;
  /** 竞选纲领 */
  platform: string;
}

/**
 * 零知识证明
 */
export interface ZKProof {
  /** 证明 ID */
  id: EntityId;
  /** 证明类型 */
  type: ZKProofType;
  /** 公开输入 */
  publicInputs: string[];
  /** 证明数据 */
  proof: string;
  /** 验证结果 */
  verified: boolean;
  /** 创建时间 */
  createdAt: Timestamp;
}

/**
 * 零知识证明类型
 */
export enum ZKProofType {
  IDENTITY = 'identity',         // 身份证明
  ELIGIBILITY = 'eligibility',   // 投票资格证明
  BALANCE = 'balance',           // 余额证明
  CREDIT = 'credit',             // 信用证明
}

/**
 * 公民权利
 */
export interface CivilRight {
  /** 权利 ID */
  id: EntityId;
  /** 权利名称 */
  name: string;
  /** 权利描述 */
  description: string;
  /** 权利类型 */
  type: RightType;
  /** 是否授予 */
  granted: boolean;
  /** 限制条件 */
  restrictions?: string[];
}

/**
 * 权利类型
 */
export enum RightType {
  VOTE = 'vote',
  SPEECH = 'speech',
  ASSEMBLY = 'assembly',
  PROPERTY = 'property',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  WORK = 'work',
}

/**
 * 外交关系
 */
export interface DiplomaticRelation {
  /** 关系 ID */
  id: EntityId;
  /** 国家/派系 A */
  partyAId: EntityId;
  /** 国家/派系 B */
  partyBId: EntityId;
  /** 关系类型 */
  type: DiplomaticRelationType;
  /** 关系值 (-100 到 100) */
  value: number;
  /** 有效期 */
  expiresAt?: Timestamp;
  /** 条约 ID */
  treatyId?: EntityId;
}

/**
 * 外交关系类型
 */
export enum DiplomaticRelationType {
  ALLY = 'ally',
  FRIEND = 'friend',
  NEUTRAL = 'neutral',
  UNFRIENDLY = 'unfriendly',
  ENEMY = 'enemy',
  WAR = 'war',
}
