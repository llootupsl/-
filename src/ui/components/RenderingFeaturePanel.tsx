import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, PanelSection } from './common';
import { FeaturePanelFrame, type FeaturePanelMetric, type FeaturePanelStatus } from './common/FeaturePanelFrame';
import { PerformanceMode, getPerformanceModeDescription, getPerformanceModeName } from '@/core/constants/PerformanceMode';
import { webGPURenderer } from '@/rendering/WebGPURenderer';

export type RenderingPanelAction =
  | 'switch-apex'
  | 'switch-extreme'
  | 'switch-balanced'
  | 'switch-eco'
  | 'refresh';

export interface RenderingPanelSnapshot {
  webGpuSupported: boolean;
  rendererInitialized: boolean;
  deviceReady: boolean;
  particleCount: number;
  faceCacheCount: number;
  selectedMode: PerformanceMode;
  modeName: string;
  modeDescription: string;
}

export interface RenderingFeaturePanelProps {
  className?: string;
  onAction?: (action: RenderingPanelAction) => void;
  onSnapshotChange?: (snapshot: RenderingPanelSnapshot) => void;
}

const MODE_ORDER: PerformanceMode[] = [
  PerformanceMode.APEX,
  PerformanceMode.EXTREME,
  PerformanceMode.BALANCED,
  PerformanceMode.ECO,
];

function buildSnapshot(selectedMode: PerformanceMode): RenderingPanelSnapshot {
  return {
    webGpuSupported: typeof navigator !== 'undefined' && 'gpu' in navigator,
    rendererInitialized: webGPURenderer.isInitialized(),
    deviceReady: Boolean(webGPURenderer.getDevice()),
    particleCount: webGPURenderer.getParticleCount(),
    faceCacheCount: webGPURenderer.getAllFaces().size,
    selectedMode,
    modeName: getPerformanceModeName(selectedMode),
    modeDescription: getPerformanceModeDescription(selectedMode),
  };
}

function metricsFromSnapshot(snapshot: RenderingPanelSnapshot): FeaturePanelMetric[] {
  return [
    { label: '粒子预算', value: snapshot.particleCount.toLocaleString(), detail: '渲染器配置的粒子上限。' },
    { label: '面缓存', value: snapshot.faceCacheCount.toString(), detail: '当前存储的程序化面缓存条目。' },
    { label: '渲染器', value: snapshot.rendererInitialized ? '在线' : '离线', detail: 'WebGPU 渲染器初始化状态。' },
    { label: 'GPU 设备', value: snapshot.deviceReady ? '已就绪' : '缺失', detail: 'GPU 设备绑定状态。' },
    { label: '模式', value: snapshot.modeName, detail: snapshot.modeDescription },
  ];
}

function statusesFromSnapshot(snapshot: RenderingPanelSnapshot): FeaturePanelStatus[] {
  return [
    { label: snapshot.webGpuSupported ? 'WebGPU 原生' : 'WebGPU 不可用', tone: snapshot.webGpuSupported ? 'native' : 'fallback' },
    { label: snapshot.rendererInitialized ? '渲染器在线' : '渲染器空闲', tone: snapshot.rendererInitialized ? 'native' : 'fallback' },
    { label: snapshot.deviceReady ? '设备已绑定' : '设备待命', tone: snapshot.deviceReady ? 'native' : 'fallback' },
  ];
}

export function RenderingFeaturePanel({
  className = '',
  onAction,
  onSnapshotChange,
}: RenderingFeaturePanelProps) {
  const [revision, setRevision] = useState(0);
  const [selectedMode, setSelectedMode] = useState<PerformanceMode>(PerformanceMode.BALANCED);
  const [lastMessage, setLastMessage] = useState('idle');

  const snapshot = useMemo(
    () => buildSnapshot(selectedMode),
    [revision, selectedMode]
  );

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

  const switchMode = (mode: PerformanceMode, action: RenderingPanelAction) => {
    onAction?.(action);
    webGPURenderer.setPerformanceMode(mode);
    setSelectedMode(mode);
    setLastMessage(`渲染器已切换至 ${getPerformanceModeName(mode)}`);
    setRevision((value) => value + 1);
  };

  return (
    <FeaturePanelFrame
      className={className}
      eyebrow="渲染 / WebGPU / 性能"
      title="渲染锻炉（Renderer Forge）"
      description="这个面板通过支持的性能档位驱动实时 WebGPU 渲染器。它展示的是当前渲染状态、GPU 绑定和真实粒子预算，而不是一个虚假的预览。"
      status={statusesFromSnapshot(snapshot)}
      metrics={metricsFromSnapshot(snapshot)}
      actions={
        <>
          <Button variant="primary" onClick={() => switchMode(PerformanceMode.APEX, 'switch-apex')}>
            顶峰 APEX
          </Button>
          <Button variant="secondary" onClick={() => switchMode(PerformanceMode.EXTREME, 'switch-extreme')}>
            极限 EXTREME
          </Button>
          <Button variant="secondary" onClick={() => switchMode(PerformanceMode.BALANCED, 'switch-balanced')}>
            均衡 BALANCED
          </Button>
          <Button variant="ghost" onClick={() => switchMode(PerformanceMode.ECO, 'switch-eco')}>
            节能 ECO
          </Button>
          <Button variant="ghost" onClick={refresh}>
            刷新
          </Button>
        </>
      }
      footer={`当前模式 ${snapshot.modeName} · 最近消息：${lastMessage}`}
    >
      <div style={{ display: 'grid', gap: '0.9rem', padding: '0 1rem 1rem' }}>
        <PanelSection title="模式矩阵">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.7rem' }}>
            {MODE_ORDER.map((mode) => {
              const active = mode === selectedMode;
              return (
                <Card
                  key={mode}
                  title={getPerformanceModeName(mode)}
                  subtitle={getPerformanceModeDescription(mode)}
                  badge={<Badge variant={active ? 'success' : 'default'}>{mode}</Badge>}
                >
                  <div style={{ display: 'grid', gap: '0.4rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <div>粒子上限 {mode === PerformanceMode.APEX ? '1,000,000' : mode === PerformanceMode.EXTREME ? '100,000' : mode === PerformanceMode.BALANCED ? '50,000' : '10,000'}。</div>
                    <div>光线追踪 {mode === PerformanceMode.ECO ? '关闭' : mode === PerformanceMode.BALANCED ? '关闭' : '开启'}。</div>
                    <div>WebTransport 保活 {mode === PerformanceMode.APEX || mode === PerformanceMode.EXTREME ? '开启' : '关闭'}。</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </PanelSection>

        <PanelSection title="渲染状态">
          <div style={{ display: 'grid', gap: '0.55rem' }}>
              <Card
              title="当前档位"
              subtitle={snapshot.modeDescription}
              badge={<Badge variant={snapshot.rendererInitialized ? 'success' : 'warning'}>{snapshot.rendererInitialized ? '在线' : '冷启动'}</Badge>}
            >
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                实时渲染器响应的是运行时画布使用的同一个单例。如果 WebGPU 不存在，面板也会清楚报告当前降级状态。
              </p>
            </Card>
          </div>
        </PanelSection>
      </div>
    </FeaturePanelFrame>
  );
}

export default RenderingFeaturePanel;
