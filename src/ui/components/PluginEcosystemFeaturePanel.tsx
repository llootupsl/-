import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Input, PanelSection, Textarea } from './common';
import { FeaturePanelFrame, type FeaturePanelMetric, type FeaturePanelStatus } from './common/FeaturePanelFrame';
import { genePluginManager, type GenePluginInstance } from '@/citizen/GenePluginSystem';
import { initializeGenePluginSystem } from '@/citizen/GenePluginExamples';
import { GeneType } from '@/citizen/GenomeSystem';
import { torrentClient } from '@/network/TorrentClient';

export type PluginEcosystemPanelAction =
  | 'bootstrap-plugins'
  | 'toggle-debug'
  | 'enable-selected'
  | 'disable-selected'
  | 'remove-selected'
  | 'seed-fork'
  | 'merge-fork'
  | 'refresh';

export interface PluginEcosystemPanelSnapshot {
  totalPlugins: number;
  enabledPlugins: number;
  totalExecutions: number;
  totalErrors: number;
  averageExecutionTime: number;
  selectedPluginId: string;
  selectedPluginName: string;
  debugMode: boolean;
  forkName: string;
  forkHash: string;
}

export interface PluginEcosystemFeaturePanelProps {
  className?: string;
  onAction?: (action: PluginEcosystemPanelAction) => void;
  onSnapshotChange?: (snapshot: PluginEcosystemPanelSnapshot) => void;
}

const pluginSeed = {
  seeded: false,
  promise: null as Promise<void> | null,
};

const GENE_TYPE_LABELS: Record<GeneType, string> = {
  [GeneType.PHYSICAL]: '身体',
  [GeneType.COGNITIVE]: '认知',
  [GeneType.EMOTIONAL]: '情感',
  [GeneType.SOCIAL]: '社会',
  [GeneType.METABOLIC]: '代谢',
  [GeneType.IMMUNE]: '免疫',
  [GeneType.LONGEVITY]: '长寿',
  [GeneType.CREATIVITY]: '创造力',
};

function ensurePluginSeed(): Promise<void> {
  if (pluginSeed.seeded) return Promise.resolve();
  if (!pluginSeed.promise) {
    pluginSeed.promise = initializeGenePluginSystem().then(() => {
      pluginSeed.seeded = true;
    });
  }
  return pluginSeed.promise;
}

function getPlugins(): GenePluginInstance[] {
  return genePluginManager.getEngine().getAllPlugins();
}

function buildSnapshot(
  selectedPluginId: string,
  debugMode: boolean,
  forkName: string,
  forkHash: string
): PluginEcosystemPanelSnapshot {
  const stats = genePluginManager.getStats();
  const plugins = getPlugins();
  const selectedPlugin = plugins.find((plugin) => plugin.metadata.id === selectedPluginId);

  return {
    totalPlugins: stats.totalPlugins,
    enabledPlugins: stats.enabledPlugins,
    totalExecutions: stats.totalExecutions,
    totalErrors: stats.totalErrors,
    averageExecutionTime: stats.averageExecutionTime,
    selectedPluginId,
    selectedPluginName: selectedPlugin?.metadata.name ?? 'None selected',
    debugMode,
    forkName,
    forkHash,
  };
}

function metricsFromSnapshot(snapshot: PluginEcosystemPanelSnapshot): FeaturePanelMetric[] {
  return [
    { label: '插件', value: snapshot.totalPlugins.toString(), detail: '已注册的插件单元。' },
    { label: '已启用', value: snapshot.enabledPlugins.toString(), detail: '实时执行表面。' },
    { label: '执行次数', value: snapshot.totalExecutions.toString(), detail: '历史运行记录。' },
    { label: '错误数', value: snapshot.totalErrors.toString(), detail: '已捕获的失败。' },
    { label: '平均耗时', value: `${snapshot.averageExecutionTime.toFixed(1)} ms`, detail: '平均执行时间。' },
  ];
}

function statusesFromSnapshot(snapshot: PluginEcosystemPanelSnapshot): FeaturePanelStatus[] {
  return [
    { label: snapshot.debugMode ? '调试模式开启' : '调试模式关闭', tone: snapshot.debugMode ? 'fallback' : 'native' },
    { label: snapshot.totalErrors > 0 ? '存在错误日志' : '暂无近期错误', tone: snapshot.totalErrors > 0 ? 'fallback' : 'native' },
    { label: snapshot.forkHash ? 'Fork 已播种' : 'Fork 待播种', tone: snapshot.forkHash ? 'native' : 'fallback' },
  ];
}

function coverageByGeneType(plugins: GenePluginInstance[]): Array<{ geneType: GeneType; count: number }> {
  return (Object.values(GeneType) as GeneType[]).map((geneType) => ({
    geneType,
    count: plugins.filter((plugin) => plugin.metadata.targetGeneTypes.includes(geneType)).length,
  }));
}

export function PluginEcosystemFeaturePanel({
  className = '',
  onAction,
  onSnapshotChange,
}: PluginEcosystemFeaturePanelProps) {
  const [revision, setRevision] = useState(0);
  const [selectedPluginId, setSelectedPluginId] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [forkName, setForkName] = useState('世界分叉 Alpha（World Fork Alpha）');
  const [forkPayload, setForkPayload] = useState('');
  const [forkHash, setForkHash] = useState('');
  const [mergeHash, setMergeHash] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [torrentReady, setTorrentReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void ensurePluginSeed().then(() => {
      if (!mounted) return;
      const firstPlugin = getPlugins()[0];
      if (firstPlugin && !selectedPluginId) {
        setSelectedPluginId(firstPlugin.metadata.id);
      }
      setRevision((value) => value + 1);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const plugins = useMemo(() => getPlugins(), [revision]);
  const selectedPlugin = plugins.find((plugin) => plugin.metadata.id === selectedPluginId) ?? plugins[0];
  const snapshot = useMemo(
    () => buildSnapshot(selectedPlugin?.metadata.id ?? '', debugMode, forkName, forkHash),
    [debugMode, forkHash, forkName, revision, selectedPlugin?.metadata.id]
  );

  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [onSnapshotChange, snapshot]);

  const refresh = () => {
    onAction?.('refresh');
    setRevision((value) => value + 1);
  };

  const bootstrapPlugins = async () => {
    onAction?.('bootstrap-plugins');
    await ensurePluginSeed();
    setRevision((value) => value + 1);
    setLog((entries) => ['Sample plugins bootstrapped', ...entries].slice(0, 6));
  };

  const toggleDebug = () => {
    onAction?.('toggle-debug');
    const next = !debugMode;
    setDebugMode(next);
    genePluginManager.getEngine().setDebugMode(next);
    setRevision((value) => value + 1);
  };

  const enableSelected = () => {
    onAction?.('enable-selected');
    if (selectedPlugin) {
      genePluginManager.getEngine().setPluginEnabled(selectedPlugin.metadata.id, true);
      setRevision((value) => value + 1);
    }
  };

  const disableSelected = () => {
    onAction?.('disable-selected');
    if (selectedPlugin) {
      genePluginManager.getEngine().setPluginEnabled(selectedPlugin.metadata.id, false);
      setRevision((value) => value + 1);
    }
  };

  const removeSelected = () => {
    onAction?.('remove-selected');
    if (selectedPlugin) {
      genePluginManager.getEngine().unregisterPlugin(selectedPlugin.metadata.id);
      setSelectedPluginId('');
      setRevision((value) => value + 1);
    }
  };

  const seedFork = async () => {
    onAction?.('seed-fork');
    if (!torrentReady) {
      setTorrentReady(await torrentClient.init());
    }
    const payload = new TextEncoder().encode(
      forkPayload ||
        JSON.stringify({
          forkName,
          pluginCount: plugins.length,
          enabledCount: plugins.filter((plugin) => plugin.metadata.enabled).length,
          capturedAt: Date.now(),
          surface: 'plugin-ecosystem',
        }, null, 2)
    );
    const info = await torrentClient.seed(forkName, payload.buffer);
    if (info) {
      setForkHash(info.infoHash);
      setMergeHash(info.infoHash);
      setLog((entries) => [`Fork seeded: ${info.infoHash}`, ...entries].slice(0, 6));
    }
    setRevision((value) => value + 1);
  };

  const mergeFork = async () => {
    onAction?.('merge-fork');
    if (!mergeHash) return;
    if (!torrentReady) {
      setTorrentReady(await torrentClient.init());
    }
    await torrentClient.download(mergeHash);
    setLog((entries) => [`Merge requested: ${mergeHash}`, ...entries].slice(0, 6));
    setRevision((value) => value + 1);
  };

  const geneCoverage = coverageByGeneType(plugins);

  return (
    <FeaturePanelFrame
      className={className}
      eyebrow="插件生态 / 世界 Fork-合并"
      title="可组合基因交换（Composable Genome Exchange）"
      description="这个市场不是展柜，而是样例插件、运行时开关和分支快照的实时注册表，它们都能通过同一套公开控制面播种或合并。"
      status={statusesFromSnapshot(snapshot)}
      metrics={metricsFromSnapshot(snapshot)}
      actions={
        <>
          <Button variant="primary" onClick={bootstrapPlugins}>
            引导样例
          </Button>
          <Button variant="secondary" onClick={toggleDebug}>
            切换调试
          </Button>
          <Button variant="secondary" onClick={enableSelected}>
            启用选中项
          </Button>
          <Button variant="ghost" onClick={disableSelected}>
            禁用选中项
          </Button>
          <Button variant="ghost" onClick={removeSelected}>
            移除选中项
          </Button>
          <Button variant="ghost" onClick={seedFork}>
            播种 Fork
          </Button>
          <Button variant="ghost" onClick={mergeFork}>
            合并 Fork
          </Button>
          <Button variant="ghost" onClick={refresh}>
            刷新
          </Button>
        </>
      }
      footer="世界 Fork 会被编码成普通 JSON 或 Torrent 种子。如果浏览器无法完成传输，面板仍会直接暴露载荷、哈希和降级状态。"
    >
      <div style={{ display: 'grid', gap: '0.9rem', padding: '0 1rem 1rem' }}>
        <PanelSection title="当前选中插件">
          {selectedPlugin ? (
            <Card
              title={selectedPlugin.metadata.name}
              subtitle={selectedPlugin.metadata.description}
              badge={<Badge variant={selectedPlugin.metadata.enabled ? 'success' : 'warning'}>{selectedPlugin.metadata.enabled ? 'enabled' : 'disabled'}</Badge>}
            >
              <div style={{ display: 'grid', gap: '0.45rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>版本 {selectedPlugin.metadata.version} · 优先级 {selectedPlugin.metadata.priority}</div>
                <div>目标基因：{selectedPlugin.metadata.targetGeneTypes.map((geneType) => GENE_TYPE_LABELS[geneType]).join('、')}</div>
                <div>执行 {selectedPlugin.executionCount} 次 · 错误 {selectedPlugin.errorCount} 次 · 平均 {selectedPlugin.averageExecutionTime.toFixed(1)} ms</div>
                <div>字节码哈希 {selectedPlugin.bytecodeHash}</div>
              </div>
            </Card>
          ) : (
            <Card title="尚未选择插件" subtitle="先引导样例注册表，露出一组可工作的插件。" />
          )}
        </PanelSection>

        <PanelSection title="基因覆盖">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem' }}>
            {geneCoverage.map((entry) => (
              <Card
                key={entry.geneType}
                title={GENE_TYPE_LABELS[entry.geneType]}
                subtitle={`${entry.count} 个插件`}
                badge={<Badge variant={entry.count > 0 ? 'primary' : 'default'}>{entry.geneType}</Badge>}
              />
            ))}
          </div>
        </PanelSection>

        <PanelSection title="世界 Fork 控制台">
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <Textarea
              value={forkPayload}
              onChange={(event) => setForkPayload(event.target.value)}
              rows={6}
              placeholder="Fork 快照可选 JSON 载荷。"
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.7rem' }}>
              <Input
                value={forkName}
                onChange={(event) => setForkName(event.target.value)}
                placeholder="Fork 名称"
              />
              <Input
                value={mergeHash}
                onChange={(event) => setMergeHash(event.target.value)}
                placeholder="磁力哈希或 Fork infoHash"
              />
            </div>
          </div>
        </PanelSection>

        <PanelSection title="注册表日志">
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {log.map((entry, index) => (
              <Card
                key={`${entry}-${index}`}
                title={entry}
                badge={<Badge variant={index === 0 ? 'primary' : 'default'}>{index === 0 ? '最新' : '事件'}</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {index === 0 ? '最近一次插件或 Fork 事件' : '更早的注册表更新'}
                </p>
              </Card>
            ))}
            {log.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>当前还没有注册表事件。先引导样例集。</div>}
          </div>
        </PanelSection>
      </div>
    </FeaturePanelFrame>
  );
}

export default PluginEcosystemFeaturePanel;
