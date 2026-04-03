import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Input, PanelSection, Select } from './common';
import { FeaturePanelFrame, type FeaturePanelMetric, type FeaturePanelStatus } from './common/FeaturePanelFrame';
import { ResourceType, RESOURCE_LABELS } from '@/core/constants';
import { EconomicPolicyType, type EconomicPolicy, type Transaction, OrderType } from '@/core/types/economy';
import { createEntityId } from '@/core/types';
import { economicSystem } from '@/economy/EconomicSystem';

export type EconomyPanelAction =
  | 'select-resource'
  | 'place-buy-order'
  | 'place-sell-order'
  | 'execute-sample-trade'
  | 'apply-tax'
  | 'apply-subsidy'
  | 'refresh';

export interface EconomyPanelSnapshot {
  selectedResource: ResourceType;
  resourceCount: number;
  marketCount: number;
  transactionCount: number;
  openOrderCount: number;
  gdp: number;
  gdpGrowthRate: number;
  inflationRate: number;
  unemploymentRate: number;
  inequality: number;
  giniCoefficient: number;
  totalVolume: number;
  averageWage: number;
  resourceLabel: string;
  resourceAmount: number;
  resourceCapacity: number;
  marketPrice: number;
  priceHistoryCount: number;
  buyOrders: number;
  sellOrders: number;
  lastTransaction?: Transaction;
  lastPolicy?: EconomicPolicy;
}

export interface EconomyFeaturePanelProps {
  className?: string;
  onAction?: (action: EconomyPanelAction) => void;
  onSnapshotChange?: (snapshot: EconomyPanelSnapshot) => void;
}

const ECONOMY_BUYER_ID = createEntityId();
const ECONOMY_SELLER_ID = createEntityId();

const RESOURCE_SEQUENCE: ResourceType[] = [
  ResourceType.CORE_ENERGY,
  ResourceType.COMPUTE_QUOTA,
  ResourceType.BIOMASS,
  ResourceType.INFORMATION,
  ResourceType.TRUST,
];

const POLICY_LABELS: Record<EconomicPolicyType, string> = {
  [EconomicPolicyType.TAX]: '税收',
  [EconomicPolicyType.SUBSIDY]: '补贴',
  [EconomicPolicyType.TRADE_BAN]: '贸易禁令',
  [EconomicPolicyType.PRICE_CONTROL]: '价格管制',
  [EconomicPolicyType.RESOURCE_RESTRICTION]: '资源限制',
  [EconomicPolicyType.MARKET_INTERVENTION]: '市场干预',
};

function buildPolicy(policyType: EconomicPolicyType): EconomicPolicy {
  return {
    id: createEntityId(),
    name: `${POLICY_LABELS[policyType]}脉冲`,
    description: `${POLICY_LABELS[policyType]}控制的实时政策脉冲。`,
    type: policyType,
    taxRate: policyType === EconomicPolicyType.TAX ? 0.08 : 0,
    subsidyRate: policyType === EconomicPolicyType.SUBSIDY ? 0.08 : 0,
    effectiveTime: Date.now(),
    active: true,
  };
}

function readOpenOrderCount(): number {
  return economicSystem
    .getAllResources()
    .reduce((total, resource) => {
      const market = economicSystem.getMarket(resource.type);
      return total + (market?.buyOrders.filter((order) => !order.fulfilled).length ?? 0)
        + (market?.sellOrders.filter((order) => !order.fulfilled).length ?? 0);
    }, 0);
}

function buildSnapshot(selectedResource: ResourceType): EconomyPanelSnapshot {
  const resource = economicSystem.getResource(selectedResource)!;
  const market = economicSystem.getMarket(selectedResource);
  const statistics = economicSystem.getStatistics();
  const transactions = economicSystem.getTransactions(1);
  const lastTransaction = transactions[0];

  return {
    selectedResource,
    resourceCount: economicSystem.getAllResources().length,
    marketCount: RESOURCE_SEQUENCE.length,
    transactionCount: economicSystem.getTransactions(50).length,
    openOrderCount: readOpenOrderCount(),
    gdp: statistics.gdp,
    gdpGrowthRate: statistics.gdpGrowthRate,
    inflationRate: statistics.inflationRate,
    unemploymentRate: statistics.unemploymentRate,
    inequality: statistics.inequality,
    giniCoefficient: statistics.giniCoefficient,
    totalVolume: statistics.totalVolume,
    averageWage: statistics.averageWage,
    resourceLabel: RESOURCE_LABELS[selectedResource],
    resourceAmount: resource.amount,
    resourceCapacity: resource.capacity,
    marketPrice: market?.currentPrice ?? 0,
    priceHistoryCount: market?.priceHistory.length ?? 0,
    buyOrders: market?.buyOrders.filter((order) => !order.fulfilled).length ?? 0,
    sellOrders: market?.sellOrders.filter((order) => !order.fulfilled).length ?? 0,
    lastTransaction,
  };
}

function metricsFromSnapshot(snapshot: EconomyPanelSnapshot): FeaturePanelMetric[] {
  return [
    { label: 'GDP', value: snapshot.gdp.toFixed(1), detail: '经济循环中的实时产出。' },
    { label: '未结订单', value: snapshot.openOrderCount.toString(), detail: '市场里尚未成交的订单。' },
    { label: '交易量', value: snapshot.transactionCount.toString(), detail: '运行时记录的已执行交易。' },
    { label: '通胀', value: `${(snapshot.inflationRate * 100).toFixed(1)}%`, detail: '受政策影响的价格压力。' },
    { label: '工资', value: snapshot.averageWage.toFixed(1), detail: '当前模型中的参考工资。' },
  ];
}

function statusesFromSnapshot(snapshot: EconomyPanelSnapshot): FeaturePanelStatus[] {
  return [
    { label: '市场在线', tone: snapshot.marketCount > 0 ? 'native' : 'unavailable' },
    { label: snapshot.openOrderCount > 0 ? '订单簿活跃' : '订单簿空闲', tone: snapshot.openOrderCount > 0 ? 'native' : 'fallback' },
    { label: snapshot.transactionCount > 0 ? '交易链路已验证' : '交易链路空闲', tone: snapshot.transactionCount > 0 ? 'native' : 'fallback' },
  ];
}

export function EconomyFeaturePanel({
  className = '',
  onAction,
  onSnapshotChange,
}: EconomyFeaturePanelProps) {
  const [revision, setRevision] = useState(0);
  const [selectedResource, setSelectedResource] = useState<ResourceType>(ResourceType.INFORMATION);
  const [quantity, setQuantity] = useState('12');
  const [price, setPrice] = useState('4');
  const [policyLog, setPolicyLog] = useState<string[]>([]);

  const snapshot = useMemo(
    () => buildSnapshot(selectedResource),
    [revision, selectedResource]
  );

  const recentTransactions = economicSystem.getTransactions(5);
  const resources = economicSystem.getAllResources();

  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [onSnapshotChange, snapshot]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRevision((value) => value + 1);
    }, 1500);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = () => {
    onAction?.('refresh');
    setRevision((value) => value + 1);
  };

  const placeTrade = (type: OrderType, action: EconomyPanelAction) => {
    onAction?.(action);
    const parsedQuantity = Math.max(1, Number(quantity) || 1);
    const parsedPrice = Math.max(0.1, Number(price) || 1);
    const order = economicSystem.createOrder(
      type,
      selectedResource,
      parsedQuantity,
      parsedPrice,
      type === OrderType.BUY ? ECONOMY_BUYER_ID : ECONOMY_SELLER_ID,
    );
    const transaction = economicSystem.executeTrade(
      order,
      type === OrderType.BUY ? ECONOMY_SELLER_ID : ECONOMY_BUYER_ID,
    );
    if (transaction) {
      setPolicyLog((entries) => [
        `${type === OrderType.BUY ? 'Buy' : 'Sell'} trade settled for ${RESOURCE_LABELS[selectedResource]}`,
        ...entries,
      ].slice(0, 6));
    }
    setRevision((value) => value + 1);
  };

  const applyPolicy = (policyType: EconomicPolicyType, action: EconomyPanelAction) => {
    onAction?.(action);
    const policy = buildPolicy(policyType);
    economicSystem.applyPolicy(policy);
    setPolicyLog((entries) => [
      `${POLICY_LABELS[policyType]} policy applied`,
      ...entries,
    ].slice(0, 6));
    setRevision((value) => value + 1);
  };

  return (
    <FeaturePanelFrame
      className={className}
      eyebrow="经济 / 市场 / 交易"
      title="实时经济账本（Live Economy Ledger）"
      description="这个面板直接暴露真实资源循环：价格、交易、政策脉冲和市场深度都更新同一个运行时单例。这里没有静态假数据。"
      status={statusesFromSnapshot(snapshot)}
      metrics={metricsFromSnapshot(snapshot)}
      actions={
        <>
          <Button variant="primary" onClick={() => placeTrade(OrderType.BUY, 'place-buy-order')}>
            发起买入交易
          </Button>
          <Button variant="secondary" onClick={() => placeTrade(OrderType.SELL, 'place-sell-order')}>
            发起卖出交易
          </Button>
          <Button variant="secondary" onClick={() => placeTrade(OrderType.BUY, 'execute-sample-trade')}>
            执行样例交易
          </Button>
          <Button variant="ghost" onClick={() => applyPolicy(EconomicPolicyType.TAX, 'apply-tax')}>
            施加税收
          </Button>
          <Button variant="ghost" onClick={() => applyPolicy(EconomicPolicyType.SUBSIDY, 'apply-subsidy')}>
            施加补贴
          </Button>
          <Button variant="ghost" onClick={refresh}>
            刷新
          </Button>
        </>
      }
      footer="这个账本反映的就是仿真所用的同一组世界状态对象。政策变化会回写资源循环，已执行的交易也会出现在实时历史里。"
    >
      <div style={{ display: 'grid', gap: '0.9rem', padding: '0 1rem 1rem' }}>
        <PanelSection title="市场控制">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem' }}>
            <Select
              options={RESOURCE_SEQUENCE.map((resource) => ({
                value: resource,
                label: RESOURCE_LABELS[resource],
              }))}
              value={selectedResource}
              onChange={(value) => {
                onAction?.('select-resource');
                setSelectedResource(value as ResourceType);
                setRevision((current) => current + 1);
              }}
              label="资源"
            />
            <Input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              label="数量"
              inputMode="numeric"
              type="number"
              min={1}
              step={1}
            />
            <Input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              label="价格"
              inputMode="decimal"
              type="number"
              min={0.1}
              step={0.1}
            />
          </div>
        </PanelSection>

        <PanelSection title="资源矩阵">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.7rem' }}>
            {resources.map((resource) => {
              const market = economicSystem.getMarket(resource.type);
              const fill = resource.capacity > 0 ? (resource.amount / resource.capacity) * 100 : 0;
              return (
                <Card
                  key={resource.type}
                  title={RESOURCE_LABELS[resource.type]}
                  subtitle={`${resource.amount.toFixed(1)} / ${resource.capacity.toFixed(1)}`}
                  badge={<Badge variant={resource.type === selectedResource ? 'primary' : 'default'}>{market ? `${market.currentPrice.toFixed(2)} / 单位` : '无市场'}</Badge>}
                >
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      买单 {market?.buyOrders.filter((order) => !order.fulfilled).length ?? 0}，卖单 {market?.sellOrders.filter((order) => !order.fulfilled).length ?? 0}，历史 {market?.priceHistory.length ?? 0}。
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      容量占用 {fill.toFixed(0)}%。
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </PanelSection>

        <PanelSection title="最近交易">
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {recentTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                title={`${RESOURCE_LABELS[transaction.resourceType]} 交易`}
                subtitle={new Date(transaction.timestamp).toLocaleString()}
                badge={<Badge variant="success">总额 {transaction.total.toFixed(1)}</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  买方 {transaction.buyerId.slice(0, 8)} · 卖方 {transaction.sellerId.slice(0, 8)} · 数量 {transaction.quantity} · 价格 {transaction.price.toFixed(2)}。
                </p>
              </Card>
            ))}
            {recentTransactions.length === 0 && (
              <div style={{ color: 'var(--text-secondary)' }}>目前还没有交易。请先使用上方控件完成第一笔交换。</div>
            )}
          </div>
        </PanelSection>

        <PanelSection title="政策脉冲">
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {policyLog.map((entry, index) => (
              <Card
                key={`${entry}-${index}`}
                title={entry}
                badge={<Badge variant={index === 0 ? 'primary' : 'default'}>{index === 0 ? '最新' : '较早'}</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {index === 0 ? '最近一次市场干预' : '更早的政策脉冲'}
                </p>
              </Card>
            ))}
            {policyLog.length === 0 && (
              <div style={{ color: 'var(--text-secondary)' }}>当前还没有政策脉冲。施加税收或补贴即可改变经济斜率。</div>
            )}
          </div>
        </PanelSection>
      </div>
    </FeaturePanelFrame>
  );
}

export default EconomyFeaturePanel;
