/**
 * =============================================================================
 * 区块链快照同步
 * =============================================================================
 */

import { EventEmitter } from '@/core/EventEmitter';
import { logger } from '@/core/utils/Logger';

export interface BlockData {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  transactions: number;
  gasUsed: number;
  gasLimit: number;
  miner: string;
  difficulty: number;
}

export interface TransactionData {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface WalletData {
  address: string;
  balance: string;
  transactions: TransactionData[];
  lastSync: number;
}

export interface BlockchainSyncConfig {
  syncInterval?: number;
  maxBlocksPerSync?: number;
  wsEndpoint?: string;
  rpcUrl?: string;
  transport?: 'auto' | 'websocket' | 'http';
  requestTimeoutMs?: number;
}

const defaultConfig: Required<BlockchainSyncConfig> = {
  syncInterval: 15000,
  maxBlocksPerSync: 10,
  wsEndpoint: '',
  rpcUrl: '',
  transport: 'auto',
  requestTimeoutMs: 10000,
};

type SyncTransport = 'simulation' | 'websocket' | 'http';

interface PendingRpcRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof globalThis.setTimeout>;
}

interface RpcErrorPayload {
  code: number;
  message: string;
  data?: unknown;
}

interface RpcResponse<T = unknown> {
  id?: number;
  result?: T;
  error?: RpcErrorPayload;
  params?: { result?: unknown };
}

interface RawBlockData {
  number?: string;
  hash?: string;
  parentHash?: string;
  timestamp?: string;
  transactions?: unknown[];
  gasUsed?: string;
  gasLimit?: string;
  miner?: string;
  difficulty?: string;
}

/**
 * 区块链快照同步引擎
 */
export class BlockchainSync extends EventEmitter {
  private config: Required<BlockchainSyncConfig>;
  private blocks: Map<number, BlockData> = new Map();
  private pendingTransactions: Map<string, TransactionData> = new Map();
  private wallets: Map<string, WalletData> = new Map();
  private latestBlockNumber = 0;
  private syncInterval: ReturnType<typeof globalThis.setInterval> | null = null;
  private wsConnection: WebSocket | null = null;
  private connected = false;
  private simulated = false;
  private transport: SyncTransport = 'simulation';
  private rpcEndpoint = '';
  private rpcRequestId = 1;
  private pendingRpcRequests: Map<number, PendingRpcRequest> = new Map();
  private suppressCloseEvent = false;

  constructor(config?: BlockchainSyncConfig) {
    super();
    this.config = { ...defaultConfig, ...config };
    if (!this.getConfiguredEndpoint()) {
      this.simulated = true;
    }
  }

  /**
   * 初始化
   */
  public async init(): Promise<void> {
    const endpoint = this.getConfiguredEndpoint();

    if (!endpoint) {
      this.enableSimulationFallback('No RPC endpoint configured');
      return;
    }

    this.rpcEndpoint = endpoint;

    try {
      const transport = this.resolveTransport(endpoint);
      if (transport === 'websocket') {
        const connected = await this.connectWebSocket(endpoint);
        if (!connected) {
          this.enableSimulationFallback('WebSocket connection failed');
        }
        return;
      }

      const connected = await this.connectHttp(endpoint);
      if (!connected) {
        this.enableSimulationFallback('HTTP JSON-RPC connection failed');
      }
    } catch (error) {
      logger.error(
        'BlockchainSync',
        'Initialization failed',
        error instanceof Error ? error : new Error(String(error))
      );
      this.enableSimulationFallback('Transport initialization failed');
    }
  }

  /**
   * 获取当前配置的 RPC 地址
   */
  private getConfiguredEndpoint(): string {
    return this.config.rpcUrl || this.config.wsEndpoint || '';
  }

  /**
   * 解析使用的传输方式
   */
  private resolveTransport(endpoint: string): Exclude<SyncTransport, 'simulation'> {
    if (this.config.transport === 'websocket') {
      return 'websocket';
    }

    if (this.config.transport === 'http') {
      return 'http';
    }

    if (/^wss?:\/\//i.test(endpoint)) {
      return 'websocket';
    }

    return 'http';
  }

  /**
   * 连接 WebSocket RPC
   */
  private async connectWebSocket(endpoint: string): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finalize = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      try {
        this.closeWebSocket();
        this.wsConnection = new WebSocket(endpoint);

        const timeoutId = globalThis.setTimeout(() => {
          logger.warn('BlockchainSync', 'WebSocket connection timed out');
          this.rejectPendingRpcRequests(new Error('WebSocket connection timed out'));
          this.closeWebSocket();
          finalize(false);
        }, this.config.requestTimeoutMs);

        this.wsConnection.onopen = () => {
          globalThis.clearTimeout(timeoutId);
          this.connected = true;
          this.simulated = false;
          this.transport = 'websocket';
          logger.info('BlockchainSync', 'WebSocket connected');
          this.subscribeToBlocks();
          this.schedulePolling();

          void this.syncLatestBlocks()
            .then(() => {
              this.emit('connected');
              finalize(true);
            })
            .catch((error) => {
              logger.error(
                'BlockchainSync',
                'Initial WebSocket sync failed',
                error instanceof Error ? error : new Error(String(error))
              );
              this.rejectPendingRpcRequests(
                error instanceof Error ? error : new Error(String(error))
              );
              this.closeWebSocket();
              finalize(false);
            });
        };

        this.wsConnection.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.wsConnection.onerror = () => {
          globalThis.clearTimeout(timeoutId);
          const error = new Error('WebSocket error');
          logger.error('BlockchainSync', 'WebSocket error', error);
          this.rejectPendingRpcRequests(error);
          this.closeWebSocket();
          finalize(false);
        };

        this.wsConnection.onclose = () => {
          globalThis.clearTimeout(timeoutId);
          if (this.suppressCloseEvent) {
            this.suppressCloseEvent = false;
            finalize(false);
            return;
          }

          const wasConnected = this.connected;
          this.connected = false;

          if (this.transport === 'websocket' && wasConnected) {
            this.enableSimulationFallback('WebSocket disconnected');
          } else {
            finalize(false);
          }
        };
      } catch (error) {
        logger.error(
          'BlockchainSync',
          'WebSocket setup failed',
          error instanceof Error ? error : new Error(String(error))
        );
        finalize(false);
      }
    });
  }

  /**
   * 连接 HTTP JSON-RPC
   */
  private async connectHttp(endpoint: string): Promise<boolean> {
    try {
      this.transport = 'http';
      this.simulated = false;
      this.connected = true;
      this.rpcEndpoint = endpoint;

      await this.syncLatestBlocks();
      this.schedulePolling();
      this.emit('connected');
      logger.info('BlockchainSync', 'HTTP JSON-RPC connected');
      return true;
    } catch (error) {
      this.connected = false;
      logger.error(
        'BlockchainSync',
        'HTTP JSON-RPC connection failed',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * 启动轮询
   */
  private schedulePolling(): void {
    if (this.syncInterval) return;

    this.syncInterval = globalThis.setInterval(() => {
      if (this.transport === 'simulation') {
        this.simulateNewBlock();
        return;
      }

      void this.syncLatestBlocks().catch((error) => {
        logger.error(
          'BlockchainSync',
          'Periodic sync failed',
          error instanceof Error ? error : new Error(String(error))
        );
        this.enableSimulationFallback('Periodic RPC sync failed');
      });
    }, this.config.syncInterval);
  }

  /**
   * 执行 JSON-RPC 请求
   */
  private async executeRpc<T>(method: string, params: unknown[] = []): Promise<T> {
    if (this.transport === 'websocket') {
      return this.executeWebSocketRpc<T>(method, params);
    }

    if (!this.rpcEndpoint) {
      throw new Error('RPC endpoint not configured');
    }

    return this.executeHttpRpc<T>(method, params);
  }

  /**
   * WebSocket JSON-RPC 请求
   */
  private async executeWebSocketRpc<T>(method: string, params: unknown[] = []): Promise<T> {
    const ws = this.wsConnection;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }

    const id = this.rpcRequestId++;

    return new Promise<T>((resolve, reject) => {
      const timer = globalThis.setTimeout(() => {
        this.pendingRpcRequests.delete(id);
        reject(new Error(`RPC request timed out: ${method}`));
      }, this.config.requestTimeoutMs);

      this.pendingRpcRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });

      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          method,
          params,
        })
      );
    });
  }

  /**
   * HTTP JSON-RPC 请求
   */
  private async executeHttpRpc<T>(method: string, params: unknown[] = []): Promise<T> {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: this.rpcRequestId++,
          method,
          params,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} when calling ${method}`);
      }

      const payload = (await response.json()) as RpcResponse<T>;
      if (payload.error) {
        throw new Error(payload.error.message);
      }

      return payload.result as T;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  /**
   * 订阅新区块
   */
  private subscribeToBlocks(): void {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) return;

    this.wsConnection.send(
      JSON.stringify({
        jsonrpc: '2.0',
        id: this.rpcRequestId++,
        method: 'eth_subscribe',
        params: ['newHeads'],
      })
    );
  }

  /**
   * 处理 WebSocket 消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as RpcResponse<RawBlockData>;

      if (typeof message.id === 'number' && this.pendingRpcRequests.has(message.id)) {
        const pending = this.pendingRpcRequests.get(message.id);
        if (!pending) return;

        globalThis.clearTimeout(pending.timer);
        this.pendingRpcRequests.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error.message));
          return;
        }

        pending.resolve(message.result);
        return;
      }

      if (message.params && 'result' in message.params && message.params.result) {
        const block = this.parseBlockData(message.params.result as RawBlockData);
        this.handleNewBlock(block);
      }
    } catch (error) {
      logger.error(
        'BlockchainSync',
        'Message parse error',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 解析区块数据
   */
  private parseBlockData(raw: RawBlockData): BlockData {
    return {
      number: this.parseHexNumber(raw.number),
      hash: raw.hash ?? '0x0',
      parentHash: raw.parentHash ?? '0x0',
      timestamp: this.parseHexNumber(raw.timestamp) * 1000,
      transactions: Array.isArray(raw.transactions) ? raw.transactions.length : 0,
      gasUsed: this.parseHexNumber(raw.gasUsed),
      gasLimit: this.parseHexNumber(raw.gasLimit),
      miner: raw.miner ?? '0x0',
      difficulty: this.parseHexNumber(raw.difficulty),
    };
  }

  /**
   * 解析十六进制数字
   */
  private parseHexNumber(value?: string): number {
    if (!value) return 0;
    const parsed = Number.parseInt(value, 16);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /**
   * 同步最新区块
   */
  private async syncLatestBlocks(): Promise<void> {
    const latestHex = await this.executeRpc<string>('eth_blockNumber', []);
    const latestBlockNumber = this.parseHexNumber(latestHex);

    if (!Number.isFinite(latestBlockNumber)) {
      throw new Error('Invalid latest block number');
    }

    const startBlock =
      this.blocks.size === 0
        ? Math.max(0, latestBlockNumber - this.config.maxBlocksPerSync + 1)
        : Math.max(this.latestBlockNumber + 1, latestBlockNumber - this.config.maxBlocksPerSync + 1);

    for (let number = startBlock; number <= latestBlockNumber; number++) {
      const rawBlock = await this.executeRpc<RawBlockData | null>('eth_getBlockByNumber', [
        `0x${number.toString(16)}`,
        false,
      ]);

      if (rawBlock) {
        this.handleNewBlock(this.parseBlockData(rawBlock));
      }
    }

    this.latestBlockNumber = Math.max(this.latestBlockNumber, latestBlockNumber);
    this.connected = true;
  }

  /**
   * 处理新区块
   */
  private handleNewBlock(block: BlockData): void {
    this.blocks.set(block.number, block);
    this.latestBlockNumber = Math.max(this.latestBlockNumber, block.number);

    if (this.blocks.size > 100) {
      const minBlock = Math.min(...this.blocks.keys());
      this.blocks.delete(minBlock);
    }

    this.emit('new-block', block);
  }

  /**
   * 模拟初始区块
   */
  private async simulateInitialBlocks(): Promise<void> {
    if (this.blocks.size > 0) {
      this.emit('initialized', { latestBlock: this.latestBlockNumber });
      return;
    }

    const startBlock = 18000000 + Math.floor(Math.random() * 1000);

    for (let i = 0; i < 10; i++) {
      const block = this.generateSimulatedBlock(startBlock + i);
      this.blocks.set(block.number, block);
    }

    this.latestBlockNumber = startBlock + 9;
    this.emit('initialized', { latestBlock: this.latestBlockNumber });
  }

  /**
   * 生成模拟区块
   */
  private generateSimulatedBlock(blockNumber: number): BlockData {
    const timestamp = Date.now() - (18000000 + 100 - blockNumber) * 15 * 1000;
    const hash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    return {
      number: blockNumber,
      hash,
      parentHash: `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`,
      timestamp,
      transactions: Math.floor(Math.random() * 200),
      gasUsed: Math.floor(Math.random() * 15000000),
      gasLimit: 15000000,
      miner: `0x${Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`,
      difficulty: 1000000000000 + Math.floor(Math.random() * 500000000000),
    };
  }

  /**
   * 启动同步
   */
  public startSync(): void {
    if (this.syncInterval) return;

    this.schedulePolling();

    logger.info('BlockchainSync', 'Sync started');
    this.emit('sync-started');
  }

  /**
   * 停止同步
   */
  public stopSync(): void {
    if (this.syncInterval) {
      globalThis.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.rejectPendingRpcRequests(new Error('Sync stopped'));
    this.closeWebSocket();
    this.connected = false;
    this.transport = 'simulation';

    logger.info('BlockchainSync', 'Sync stopped');
    this.emit('sync-stopped');
  }

  /**
   * 模拟新区块
   */
  private simulateNewBlock(): void {
    this.latestBlockNumber++;
    const block = this.generateSimulatedBlock(this.latestBlockNumber);
    this.handleNewBlock(block);
  }

  /**
   * 回退到模拟模式
   */
  private enableSimulationFallback(reason: string): void {
    this.closeWebSocket();
    if (this.syncInterval) {
      globalThis.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.rejectPendingRpcRequests(new Error(reason));
    this.connected = false;
    this.simulated = true;
    this.transport = 'simulation';

    logger.warn('BlockchainSync', `Falling back to simulation: ${reason}`);
    void this.simulateInitialBlocks();
    this.schedulePolling();
    this.emit('fallback', { reason });
  }

  /**
   * 关闭 WebSocket
   */
  private closeWebSocket(): void {
    if (this.wsConnection) {
      try {
        this.suppressCloseEvent = true;
        this.wsConnection.close();
      } catch {
        // Ignore close failures during cleanup.
      }
      this.wsConnection = null;
    }
  }

  /**
   * 清理待处理 RPC 请求
   */
  private rejectPendingRpcRequests(error: Error): void {
    for (const [id, pending] of this.pendingRpcRequests.entries()) {
      globalThis.clearTimeout(pending.timer);
      pending.reject(error);
      this.pendingRpcRequests.delete(id);
    }
  }

  /**
   * 同步钱包数据
   */
  public async syncWallet(address: string): Promise<WalletData | null> {
    const checksumAddress = address.toLowerCase();

    if (this.simulated) {
      const wallet: WalletData = {
        address: checksumAddress,
        balance: `${(Math.random() * 100).toFixed(4)} ETH`,
        transactions: this.generateSimulatedTransactions(checksumAddress),
        lastSync: Date.now(),
      };

      this.wallets.set(checksumAddress, wallet);
      this.emit('wallet-synced', wallet);
      return wallet;
    }

    try {
      const balanceHex = await this.executeRpc<string>('eth_getBalance', [checksumAddress, 'latest']);
      const wallet: WalletData = {
        address: checksumAddress,
        balance: this.formatWeiToEth(balanceHex),
        transactions: [],
        lastSync: Date.now(),
      };

      this.wallets.set(checksumAddress, wallet);
      this.emit('wallet-synced', wallet);
      return wallet;
    } catch (error) {
      logger.warn(
        'BlockchainSync',
        `Wallet sync failed for ${checksumAddress}, using simulation fallback`,
        error instanceof Error ? error : new Error(String(error))
      );
      this.enableSimulationFallback('Wallet sync failed');
      return this.syncWallet(checksumAddress);
    }
  }

  /**
   * 格式化 wei 到 ETH
   */
  private formatWeiToEth(balanceHex: string): string {
    try {
      const wei = BigInt(balanceHex);
      const ethBase = 10n ** 18n;
      const whole = wei / ethBase;
      const remainder = wei % ethBase;
      const fraction = remainder.toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
      return fraction ? `${whole.toString()}.${fraction} ETH` : `${whole.toString()} ETH`;
    } catch {
      return '0 ETH';
    }
  }

  /**
   * 生成模拟交易
   */
  private generateSimulatedTransactions(address: string): TransactionData[] {
    const transactions: TransactionData[] = [];
    const count = Math.floor(Math.random() * 10) + 1;

    for (let i = 0; i < count; i++) {
      const toAddress = `0x${Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      transactions.push({
        hash: `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
        blockNumber: this.latestBlockNumber - Math.floor(Math.random() * 100),
        from: address,
        to: Math.random() > 0.5 ? toAddress : '',
        value: `${(Math.random() * 10).toFixed(4)} ETH`,
        gas: (Math.random() * 100000).toFixed(0),
        gasPrice: `${(Math.random() * 100).toFixed(2)} Gwei`,
        timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.1 ? 'confirmed' : 'pending',
      });
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 添加待处理交易
   */
  public addPendingTransaction(tx: TransactionData): void {
    this.pendingTransactions.set(tx.hash, tx);
    this.emit('pending-transaction', tx);
  }

  /**
   * 更新交易状态
   */
  public updateTransactionStatus(hash: string, status: TransactionData['status']): void {
    const tx = this.pendingTransactions.get(hash);
    if (tx) {
      tx.status = status;
      this.emit('transaction-status', { hash, status });
    }
  }

  /**
   * 获取区块
   */
  public getBlock(blockNumber: number): BlockData | null {
    return this.blocks.get(blockNumber) || null;
  }

  /**
   * 获取最新区块
   */
  public getLatestBlock(): BlockData | null {
    if (this.blocks.size === 0) return null;
    const latestNum = Math.max(...this.blocks.keys());
    return this.blocks.get(latestNum) || null;
  }

  /**
   * 获取区块列表
   */
  public getBlocks(fromBlock: number, toBlock: number): BlockData[] {
    const blocks: BlockData[] = [];
    for (let i = fromBlock; i <= toBlock; i++) {
      const block = this.blocks.get(i);
      if (block) blocks.push(block);
    }
    return blocks;
  }

  /**
   * 获取钱包
   */
  public getWallet(address: string): WalletData | null {
    return this.wallets.get(address.toLowerCase()) || null;
  }

  /**
   * 获取待处理交易
   */
  public getPendingTransactions(): TransactionData[] {
    return Array.from(this.pendingTransactions.values());
  }

  /**
   * 获取最新区块号
   */
  public getLatestBlockNumber(): number {
    return this.latestBlockNumber;
  }

  /**
   * 获取同步状态
   */
  public getStatus(): {
    connected: boolean;
    simulated: boolean;
    transport: SyncTransport;
    rpcEndpoint: string;
    latestBlock: number;
    blockCount: number;
    walletCount: number;
    pendingTxCount: number;
  } {
    return {
      connected: this.connected,
      simulated: this.simulated,
      transport: this.transport,
      rpcEndpoint: this.rpcEndpoint,
      latestBlock: this.latestBlockNumber,
      blockCount: this.blocks.size,
      walletCount: this.wallets.size,
      pendingTxCount: this.pendingTransactions.size,
    };
  }

  /**
   * 导出区块数据
   */
  public exportBlocks(fromBlock: number, toBlock: number): string {
    const blocks = this.getBlocks(fromBlock, toBlock);
    return JSON.stringify(
      {
        fromBlock,
        toBlock,
        count: blocks.length,
        blocks,
        exportedAt: Date.now(),
      },
      null,
      2
    );
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stopSync();
    this.blocks.clear();
    this.pendingTransactions.clear();
    this.wallets.clear();
    this.connected = false;
    this.simulated = false;
    this.transport = 'simulation';
    this.rpcEndpoint = '';
    this.removeAllListeners();
  }
}

export default BlockchainSync;
