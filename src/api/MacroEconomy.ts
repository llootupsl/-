/**
 * =============================================================================
 * 宏观经济数据模拟引擎
 * =============================================================================
 */

import { EventEmitter } from '@/core/EventEmitter';
import { logger } from '@/core/utils/Logger';

export interface EconomicIndicator {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  unit: string;
  timestamp: number;
}

export interface MarketData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface MacroEconomyData {
  gdp: EconomicIndicator;
  inflation: EconomicIndicator;
  unemployment: EconomicIndicator;
  interestRate: EconomicIndicator;
  consumerConfidence: EconomicIndicator;
  markets: MarketData[];
  timestamp: number;
}

export interface MacroEconomyConfig {
  updateInterval?: number;
  simulationSpeed?: number;
  volatilityFactor?: number;
}

const defaultConfig: Required<MacroEconomyConfig> = {
  updateInterval: 5000,
  simulationSpeed: 1,
  volatilityFactor: 0.02,
};

/**
 * 宏观经济模拟引擎
 */
export class MacroEconomy extends EventEmitter {
  private config: Required<MacroEconomyConfig>;
  private data: MacroEconomyData;
  private updateInterval: number | null = null;
  private tickCount: number = 0;
  private initialized: boolean = false;

  constructor(config?: MacroEconomyConfig) {
    super();
    this.config = { ...defaultConfig, ...config };

    // 初始化基础数据
    this.data = this.generateInitialData();
  }

  /**
   * 初始化
   */
  public init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.emit('initialized', this.data);
  }

  /**
   * 生成初始数据
   */
  private generateInitialData(): MacroEconomyData {
    return {
      gdp: {
        name: 'GDP 增长率',
        value: 5.2,
        change: 0,
        changePercent: 0,
        unit: '%',
        timestamp: Date.now(),
      },
      inflation: {
        name: '通货膨胀率',
        value: 2.1,
        change: 0,
        changePercent: 0,
        unit: '%',
        timestamp: Date.now(),
      },
      unemployment: {
        name: '失业率',
        value: 5.0,
        change: 0,
        changePercent: 0,
        unit: '%',
        timestamp: Date.now(),
      },
      interestRate: {
        name: '基准利率',
        value: 3.45,
        change: 0,
        changePercent: 0,
        unit: '%',
        timestamp: Date.now(),
      },
      consumerConfidence: {
        name: '消费者信心指数',
        value: 105.5,
        change: 0,
        changePercent: 0,
        unit: '点',
        timestamp: Date.now(),
      },
      markets: [
        {
          name: '上证指数',
          symbol: '000001.SS',
          price: 3150.0,
          change: 0,
          changePercent: 0,
          volume: 3500000000,
          timestamp: Date.now(),
        },
        {
          name: '深证成指',
          symbol: '399001.SZ',
          price: 10550.0,
          change: 0,
          changePercent: 0,
          volume: 4500000000,
          timestamp: Date.now(),
        },
        {
          name: '创业板指',
          symbol: '399006.SZ',
          price: 1850.0,
          change: 0,
          changePercent: 0,
          volume: 1800000000,
          timestamp: Date.now(),
        },
      ],
      timestamp: Date.now(),
    };
  }

  /**
   * 启动模拟
   */
  public start(): void {
    if (this.updateInterval) return;

    this.updateInterval = window.setInterval(() => {
      this.tick();
    }, this.config.updateInterval / this.config.simulationSpeed);

    logger.info('MacroEconomy', 'Simulation started');
    this.emit('started');
  }

  /**
   * 停止模拟
   */
  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.info('MacroEconomy', 'Simulation stopped');
    this.emit('stopped');
  }

  /**
   * 模拟一次 tick
   */
  private tick(): void {
    this.tickCount++;
    const prevData = { ...this.data };

    // 更新各项指标
    this.updateIndicator('gdp');
    this.updateIndicator('inflation');
    this.updateIndicator('unemployment');
    this.updateIndicator('interestRate');
    this.updateIndicator('consumerConfidence');

    // 更新市场数据
    this.updateMarkets();

    this.data.timestamp = Date.now();

    // 计算变化
    this.calculateChanges(prevData);

    // 发出更新事件
    this.emit('update', this.data);

    // 偶尔发出事件
    if (this.tickCount % 10 === 0) {
      this.emitRandomEvent();
    }
  }

  /**
   * 更新指标
   */
  private updateIndicator(key: keyof Omit<MacroEconomyData, 'markets' | 'timestamp'>): void {
    const indicator = this.data[key];
    const volatility = this.config.volatilityFactor;

    // 根据指标类型添加不同的随机波动
    let change: number;
    switch (key) {
      case 'gdp':
        change = (Math.random() - 0.5) * 0.3 * volatility;
        indicator.value = Math.max(-5, Math.min(15, indicator.value + change));
        break;

      case 'inflation':
        change = (Math.random() - 0.5) * 0.5 * volatility;
        indicator.value = Math.max(-2, Math.min(15, indicator.value + change));
        break;

      case 'unemployment':
        change = (Math.random() - 0.5) * 0.2 * volatility;
        indicator.value = Math.max(2, Math.min(20, indicator.value + change));
        break;

      case 'interestRate':
        change = (Math.random() - 0.5) * 0.1 * volatility;
        indicator.value = Math.max(0, Math.min(10, indicator.value + change));
        break;

      case 'consumerConfidence':
        change = (Math.random() - 0.5) * 5 * volatility;
        indicator.value = Math.max(50, Math.min(150, indicator.value + change));
        break;
    }

    indicator.timestamp = Date.now();
  }

  /**
   * 更新市场数据
   */
  private updateMarkets(): void {
    this.data.markets.forEach((market) => {
      const volatility = 0.01 * this.config.volatilityFactor;
      const changePercent = (Math.random() - 0.5) * volatility;
      const prevPrice = market.price;
      market.price *= (1 + changePercent);
      market.change = market.price - prevPrice;
      market.changePercent = changePercent * 100;

      // 模拟成交量变化
      const volumeChange = (Math.random() - 0.5) * 0.1;
      market.volume *= (1 + volumeChange);
      market.volume = Math.max(1000000000, market.volume);

      market.timestamp = Date.now();
    });
  }

  /**
   * 计算变化
   */
  private calculateChanges(prevData: MacroEconomyData): void {
    const keys: (keyof Omit<MacroEconomyData, 'markets' | 'timestamp'>)[] = [
      'gdp', 'inflation', 'unemployment', 'interestRate', 'consumerConfidence'
    ];

    keys.forEach((key) => {
      const prev = prevData[key].value;
      const curr = this.data[key].value;
      this.data[key].change = curr - prev;
      this.data[key].changePercent = prev !== 0 ? ((curr - prev) / prev) * 100 : 0;
    });
  }

  /**
   * 发出随机经济事件
   */
  private emitRandomEvent(): void {
    const events = [
      { type: 'bull-market', message: '市场看涨情绪升温', impact: 'positive' },
      { type: 'bear-market', message: '市场出现回调压力', impact: 'negative' },
      { type: 'rate-change', message: '央行调整利率政策', impact: 'neutral' },
      { type: 'inflation-spike', message: '通胀数据超出预期', impact: 'negative' },
      { type: 'gdp-beat', message: 'GDP 数据好于预期', impact: 'positive' },
      { type: 'trade-tension', message: '贸易局势紧张', impact: 'negative' },
      { type: 'stimulus-announced', message: '政府出台刺激政策', impact: 'positive' },
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    this.emit('event', { ...event, timestamp: Date.now() });
  }

  /**
   * 设置手动输入的指标值
   */
  public setIndicator(key: keyof Omit<MacroEconomyData, 'markets' | 'timestamp'>, value: number): void {
    const indicator = this.data[key];
    const prev = indicator.value;
    indicator.value = value;
    indicator.change = value - prev;
    indicator.changePercent = prev !== 0 ? ((value - prev) / prev) * 100 : 0;
    indicator.timestamp = Date.now();
    this.emit('indicator-changed', { key, value, prev });
  }

  /**
   * 获取数据
   */
  public getData(): MacroEconomyData {
    return { ...this.data, markets: [...this.data.markets] };
  }

  /**
   * 获取特定指标
   */
  public getIndicator(key: keyof Omit<MacroEconomyData, 'markets' | 'timestamp'>): EconomicIndicator {
    return { ...this.data[key] };
  }

  /**
   * 获取市场数据
   */
  public getMarket(symbol?: string): MarketData | MarketData[] {
    if (symbol) {
      const market = this.data.markets.find(m => m.symbol === symbol);
      return market ? { ...market } : this.data.markets.map(m => ({ ...m }));
    }
    return this.data.markets.map(m => ({ ...m }));
  }

  /**
   * 获取状态
   */
  public getStatus(): {
    initialized: boolean;
    running: boolean;
    tickCount: number;
    lastUpdate: number;
  } {
    return {
      initialized: this.initialized,
      running: this.updateInterval !== null,
      tickCount: this.tickCount,
      lastUpdate: this.data.timestamp,
    };
  }

  /**
   * 导出历史数据（简化）
   */
  public exportData(): string {
    return JSON.stringify({
      currentData: this.data,
      tickCount: this.tickCount,
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stop();
    this.data = this.generateInitialData();
    this.tickCount = 0;
    this.initialized = false;
    this.removeAllListeners();
  }
}

export default MacroEconomy;
