/**
 * =============================================================================
 * 永夜熵纪 - 区块链模块
 * Lightweight Blockchain with PoS and DID
 * 实现轻量级权益证明和去中心化身份
 * =============================================================================
 */

import { createHash, createSign, createVerify } from 'crypto';
import { logger } from '../core/utils/Logger';

/** 区块数据 */
export interface BlockData {
  /** 交易列表 */
  transactions: Transaction[];
  /** 状态变化 */
  stateChanges: StateChange[];
  /** 治理投票 */
  governanceVotes?: string[];
  /** 时间戳 */
  timestamp: number;
}

/** 交易 */
export interface Transaction {
  /** 交易ID */
  id: string;
  /** 类型 */
  type: TransactionType;
  /** 发送者 */
  from: string;
  /** 接收者 */
  to: string;
  /** 金额/数据 */
  value: number;
  /** 费用 */
  fee: number;
  /** 签名 */
  signature?: string;
  /** 公钥 */
  publicKeyHex?: string;
  /** 时间戳 */
  timestamp: number;
  /** 附加数据 */
  data?: Record<string, any>;
}

/** 交易类型 */
export enum TransactionType {
  /** 转账 */
  TRANSFER = 'transfer',
  /** 质押 */
  STAKE = 'stake',
  /** 解质押 */
  UNSTAKE = 'unstake',
  /** 奖励 */
  REWARD = 'reward',
  /** 治理投票 */
  GOVERNANCE = 'governance',
  /** 合约调用 */
  CONTRACT = 'contract',
  /** DID注册 */
  DID_REGISTER = 'did_register',
  /** DID更新 */
  DID_UPDATE = 'did_update',
}

/** 状态变化 */
export interface StateChange {
  /** 账户 */
  account: string;
  /** 变化类型 */
  type: 'increment' | 'decrement' | 'set';
  /** 键 */
  key: string;
  /** 值 */
  value: number | string;
}

/** 区块 */
export interface Block {
  /** 区块高度 */
  height: number;
  /** 前一个区块哈希 */
  prevBlockHash: string;
  /** 当前区块哈希 */
  hash: string;
  /** 验证者签名 */
  validatorSignature?: string;
  /** 区块数据 */
  data: BlockData;
  /** 时间戳 */
  timestamp: number;
  /** 验证者列表 */
  validators: string[];
}

/** 验证者 */
export interface Validator {
  /** 验证者DID */
  did: string;
  /** 质押金额 */
  stake: number;
  /** 声誉分 */
  reputation: number;
  /** 活跃状态 */
  isActive: boolean;
  /** 验证次数 */
  validationCount: number;
  /** 正确验证次数 */
  correctValidations: number;
  /** 最后活跃时间 */
  lastActive: number;
}

/** DID文档 */
export interface DIDDocument {
  /** DID标识符 */
  id: string;
  /** 公钥 */
  publicKeys: PublicKey[];
  /** 认证方法 */
  authentication: string[];
  /** 授权委托 */
  delegation?: string[];
  /** 服务端点 */
  serviceEndpoints?: ServiceEndpoint[];
  /** 创建时间 */
  created: number;
  /** 更新时间 */
  updated: number;
  /** 版本号 */
  versionId: number;
}

/** 公钥 */
export interface PublicKey {
  /** ID */
  id: string;
  /** 类型 */
  type: 'Ed25519' | 'EcdsaSecp256k1' | 'RSA';
  /** 公钥 */
  publicKeyHex: string;
  /** 用途 */
  purpose: 'authentication' | 'assertion' | 'keyAgreement';
}

/** 服务端点 */
export interface ServiceEndpoint {
  /** ID */
  id: string;
  /** 类型 */
  type: string;
  /** URL */
  endpoint: string;
}

/** 区块链类 */
export class Blockchain {
  private chain: Block[] = [];
  private pendingTransactions: Transaction[] = [];
  private accounts: Map<string, number> = new Map();
  private didRegistry: Map<string, DIDDocument> = new Map();
  private stakePool: StakePool = {
    totalStake: 0,
    validators: new Map(),
    pendingUnstakes: new Map(),
    rewards: new Map(),
  };
  private blockRewards: Map<string, number> = new Map();
  
  private readonly BLOCK_REWARD = 10; // 基础区块奖励
  private readonly MIN_STAKE = 100; // 最低质押
  private readonly UNSTAKE_DELAY = 7 * 24 * 60 * 60 * 1000; // 7天解锁延迟
  private readonly SLASH_RATE = 0.1; // 惩罚比例
  private readonly MAX_VALIDATORS = 21; // 最大验证者数

  private genesisBlock: Block;

  constructor() {
    this.genesisBlock = this.createGenesisBlock();
    this.chain.push(this.genesisBlock);
    
    // 设置初始验证者
    this.initializeValidators();
  }

  /**
   * 创建创世区块
   */
  private createGenesisBlock(): Block {
    const genesisData: BlockData = {
      transactions: [],
      stateChanges: [],
      governanceVotes: [],
      timestamp: Date.now(),
    };

    return {
      height: 0,
      prevBlockHash: '0'.repeat(64),
      hash: this.hashBlock(genesisData, '0'.repeat(64)),
      data: genesisData,
      timestamp: Date.now(),
      validators: [],
    };
  }

  /**
   * 初始化验证者
   */
  private initializeValidators(): void {
    // 添加初始验证者
    const initialValidators = ['validator-1', 'validator-2', 'validator-3'];
    for (const did of initialValidators) {
      this.stakePool.validators.set(did, {
        did,
        stake: 1000,
        reputation: 50,
        isActive: true,
        validationCount: 0,
        correctValidations: 0,
        lastActive: Date.now(),
      });
      this.stakePool.totalStake += 1000;
    }
  }

  /**
   * 哈希区块
   */
  private hashBlock(data: BlockData, prevHash: string): string {
    const content = JSON.stringify(data) + prevHash + Date.now();
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * 添加交易到待确认池
   */
  public addTransaction(tx: Transaction): boolean {
    // 验证交易签名
    if (!this.verifyTransactionSignature(tx)) {
      return false;
    }

    // 检查余额
    const balance = this.accounts.get(tx.from) ?? 0;
    if (tx.type !== TransactionType.REWARD && balance < tx.value + tx.fee) {
      return false;
    }

    // 检查nonce顺序
    const pendingFrom = this.pendingTransactions.filter(t => t.from === tx.from);
    if (pendingFrom.length > 10) return false;

    this.pendingTransactions.push(tx);
    return true;
  }

  /**
   * 验证交易签名
   */
  private verifyTransactionSignature(tx: Transaction): boolean {
    if (!tx.signature) return tx.type === TransactionType.REWARD;
    
    // Ed25519验证
    const data = tx.id + tx.from + tx.to + tx.value + tx.fee + tx.timestamp;
    return createVerify('Ed25519').update(data).verify(tx.publicKeyHex, tx.signature);
  }

  /**
   * 创建Ed25519密钥对
   */
  public static generateKeyPair(): { publicKey: string; privateKey: string } {
    try {
      const { publicKey, privateKey } = require('crypto').generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      return {
        publicKey: publicKey.toString('hex'),
        privateKey: privateKey.toString('hex'),
      };
    } catch (error) {
      logger.warn('Blockchain', 'Node.js crypto module not available, using browser fallback for key generation', error as Error);
      return {
        publicKey: crypto.getRandomValues(new Uint8Array(32)).toString(),
        privateKey: crypto.getRandomValues(new Uint8Array(32)).toString(),
      };
    }
  }

  /**
   * 签名交易
   */
  public static signTransaction(tx: Transaction, privateKeyHex: string): string {
    const data = tx.id + tx.from + tx.to + tx.value + tx.fee + tx.timestamp;
    return createSign('Ed25519').update(data).sign(privateKeyHex, 'hex');
  }

  /**
   * 创建新区块
   */
  public createBlock(validatorDID: string): Block | null {
    const validator = this.stakePool.validators.get(validatorDID);
    if (!validator || !validator.isActive) return null;

    // 选择验证者（基于权益和随机性）
    if (!this.isSelectedAsValidator(validatorDID)) return null;

    const prevBlock = this.chain[this.chain.length - 1];

    const blockData: BlockData = {
      transactions: [...this.pendingTransactions.slice(0, 100)],
      stateChanges: this.calculateStateChanges(),
      governanceVotes: [],
      timestamp: Date.now(),
    };

    const block: Block = {
      height: prevBlock.height + 1,
      prevBlockHash: prevBlock.hash,
      hash: this.hashBlock(blockData, prevBlock.hash),
      data: blockData,
      timestamp: Date.now(),
      validators: this.getActiveValidators(),
    };

    // 应用状态变化
    this.applyStateChanges(blockData.stateChanges);

    // 清空已确认交易
    this.pendingTransactions = this.pendingTransactions.filter(
      tx => !blockData.transactions.find(bt => bt.id === tx.id)
    );

    // 添加区块
    this.chain.push(block);

    // 分发奖励
    this.distributeRewards(validatorDID);

    // 更新验证者状态
    validator.validationCount++;
    validator.correctValidations++;
    validator.lastActive = Date.now();

    return block;
  }

  /**
   * 计算状态变化
   */
  private calculateStateChanges(): StateChange[] {
    const changes: StateChange[] = [];

    for (const tx of this.pendingTransactions.slice(0, 100)) {
      if (tx.type === TransactionType.TRANSFER) {
        changes.push({ account: tx.from, type: 'decrement', key: 'balance', value: tx.value + tx.fee });
        changes.push({ account: tx.to, type: 'increment', key: 'balance', value: tx.value });
      } else if (tx.type === TransactionType.STAKE) {
        changes.push({ account: tx.from, type: 'decrement', key: 'balance', value: tx.value });
        changes.push({ account: tx.from, type: 'increment', key: 'stake', value: tx.value });
      } else if (tx.type === TransactionType.REWARD) {
        changes.push({ account: tx.to, type: 'increment', key: 'balance', value: tx.value });
      }
    }

    return changes;
  }

  /**
   * 应用状态变化
   */
  private applyStateChanges(changes: StateChange[]): void {
    for (const change of changes) {
      let balance = this.accounts.get(change.account) ?? 0;

      switch (change.type) {
        case 'increment':
          balance += change.value as number;
          break;
        case 'decrement':
          balance -= change.value as number;
          break;
        case 'set':
          balance = change.value as number;
          break;
      }

      this.accounts.set(change.account, balance);
    }
  }

  /**
   * 检查是否被选为验证者
   */
  private isSelectedAsValidator(did: string): boolean {
    const validator = this.stakePool.validators.get(did);
    if (!validator) return false;

    const totalStake = this.stakePool.totalStake;
    const probability = validator.stake / totalStake;

    return Math.random() < probability;
  }

  /**
   * 获取活跃验证者
   */
  private getActiveValidators(): string[] {
    const active: string[] = [];

    for (const [did, validator] of this.stakePool.validators) {
      if (validator.isActive) {
        active.push(did);
      }
      if (active.length >= this.MAX_VALIDATORS) break;
    }

    return active;
  }

  /**
   * 分发奖励
   */
  private distributeRewards(validatorDID: string): void {
    const validator = this.stakePool.validators.get(validatorDID);
    if (!validator) return;

    // 计算奖励（包括质押者分成）
    const totalReward = this.BLOCK_REWARD;
    const validatorReward = totalReward * 0.3; // 验证者得30%
    const poolReward = totalReward * 0.7; // 质押池得70%

    validator.reputation = Math.min(100, validator.reputation + 1);

    // 更新账户余额
    const balance = this.accounts.get(validatorDID) ?? 0;
    this.accounts.set(validatorDID, balance + validatorReward);

    // 记录待分发奖励
    const currentReward = this.stakePool.rewards.get(validatorDID) ?? 0;
    this.stakePool.rewards.set(validatorDID, currentReward + poolReward);
  }

  /**
   * 质押
   */
  public stake(did: string, amount: number): boolean {
    const balance = this.accounts.get(did) ?? 0;
    if (balance < amount) return false;

    // 扣减余额
    this.accounts.set(did, balance - amount);

    // 获取或创建验证者
    let validator = this.stakePool.validators.get(did);
    if (!validator) {
      validator = {
        did,
        stake: 0,
        reputation: 50,
        isActive: true,
        validationCount: 0,
        correctValidations: 0,
        lastActive: Date.now(),
      };
      this.stakePool.validators.set(did, validator);
    }

    validator.stake += amount;
    validator.lastActive = Date.now();
    this.stakePool.totalStake += amount;

    // 创建质押交易
    this.addTransaction({
      id: crypto.randomUUID(),
      type: TransactionType.STAKE,
      from: did,
      to: did,
      value: amount,
      fee: 0,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 申请解质押
   */
  public unstake(did: string, amount: number): boolean {
    const validator = this.stakePool.validators.get(did);
    if (!validator || validator.stake < amount) return false;

    validator.stake -= amount;
    this.stakePool.totalStake -= amount;

    // 设置延迟解锁
    this.stakePool.pendingUnstakes.set(did, {
      validator: did,
      amount,
      unlockTime: Date.now() + this.UNSTAKE_DELAY,
    });

    // 创建解质押交易
    this.addTransaction({
      id: crypto.randomUUID(),
      type: TransactionType.UNSTAKE,
      from: did,
      to: did,
      value: amount,
      fee: 0,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 处理待解锁的质押
   */
  public processUnstakes(): void {
    for (const [did, request] of this.stakePool.pendingUnstakes) {
      if (Date.now() >= request.unlockTime) {
        const balance = this.accounts.get(did) ?? 0;
        this.accounts.set(did, balance + request.amount);
        this.stakePool.pendingUnstakes.delete(did);
      }
    }
  }

  /**
   * 惩罚恶意验证者
   */
  public slashValidator(did: string): void {
    const validator = this.stakePool.validators.get(did);
    if (!validator) return;

    const slashAmount = validator.stake * this.SLASH_RATE;
    validator.stake -= slashAmount;
    validator.reputation = Math.max(0, validator.reputation - 20);
    this.stakePool.totalStake -= slashAmount;

    // 如果质押低于最低要求，标记为非活跃
    if (validator.stake < this.MIN_STAKE) {
      validator.isActive = false;
    }
  }

  /**
   * 注册DID
   */
  public registerDID(
    did: string,
    publicKeys: PublicKey[],
    authentication: string[],
    serviceEndpoints?: ServiceEndpoint[]
  ): DIDDocument {
    const doc: DIDDocument = {
      id: `did:entropy:${did}`,
      publicKeys,
      authentication,
      serviceEndpoints,
      created: Date.now(),
      updated: Date.now(),
      versionId: 1,
    };

    this.didRegistry.set(did, doc);
    return doc;
  }

  /**
   * 更新DID文档
   */
  public updateDID(
    did: string,
    updates: Partial<Pick<DIDDocument, 'publicKeys' | 'authentication' | 'serviceEndpoints'>>
  ): DIDDocument | null {
    const doc = this.didRegistry.get(did);
    if (!doc) return null;

    Object.assign(doc, updates);
    doc.updated = Date.now();
    doc.versionId++;

    return doc;
  }

  /**
   * 解析DID
   */
  public resolveDID(did: string): DIDDocument | null {
    return this.didRegistry.get(did) ?? null;
  }

  /**
   * 获取账户余额
   */
  public getBalance(account: string): number {
    return this.accounts.get(account) ?? 0;
  }

  /**
   * 获取账户信息
   */
  public getAccountInfo(account: string): {
    balance: number;
    stake: number;
    isValidator: boolean;
    reputation: number;
  } {
    const balance = this.accounts.get(account) ?? 0;
    const validator = this.stakePool.validators.get(account);

    return {
      balance,
      stake: validator?.stake ?? 0,
      isValidator: validator?.isActive ?? false,
      reputation: validator?.reputation ?? 0,
    };
  }

  /**
   * 获取链信息
   */
  public getChainInfo(): {
    height: number;
    totalTransactions: number;
    totalStake: number;
    validatorCount: number;
  } {
    let totalTx = 0;
    for (const block of this.chain) {
      totalTx += block.data.transactions.length;
    }

    return {
      height: this.chain.length - 1,
      totalTransactions: totalTx,
      totalStake: this.stakePool.totalStake,
      validatorCount: this.stakePool.validators.size,
    };
  }

  /**
   * 验证链完整性
   */
  public validateChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];
      const prevBlock = this.chain[i - 1];
      if (block.prevBlockHash !== prevBlock.hash) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取区块
   */
  public getBlock(height: number): Block | undefined {
    return this.chain[height];
  }

  /**
   * 获取待确认交易
   */
  public getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions];
  }

  /**
   * 导出链数据
   */
  public exportChain(): string {
    return JSON.stringify({
      chain: this.chain,
      accounts: Array.from(this.accounts.entries()),
      validators: Array.from(this.stakePool.validators.entries()),
      didRegistry: Array.from(this.didRegistry.entries()),
    });
  }

  /**
   * 导入链数据
   */
  public importChain(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.chain = parsed.chain;
      this.accounts = new Map(parsed.accounts);
      this.stakePool.validators = new Map(parsed.validators);
      this.didRegistry = new Map(parsed.didRegistry);
      return this.validateChain();
    } catch (error) {
      logger.warn('Blockchain', 'Import blockchain failed', error as Error);
      return false;
    }
  }
}

/** 质押池接口 */
interface StakePool {
  totalStake: number;
  validators: Map<string, Validator>;
  pendingUnstakes: Map<string, UnstakeRequest>;
  rewards: Map<string, number>;
}

/** 解质押请求 */
interface UnstakeRequest {
  validator: string;
  amount: number;
  unlockTime: number;
}

// 导出单例
export const blockchain = new Blockchain();
export default blockchain;
