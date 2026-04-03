import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Input, PanelSection, Textarea } from './common';
import { FeaturePanelFrame, type FeaturePanelMetric, type FeaturePanelStatus } from './common/FeaturePanelFrame';
import { storage } from '@/storage/StorageManager';

export type PersistencePanelAction =
  | 'initialize-store'
  | 'seal-snapshot'
  | 'save-note'
  | 'load-note'
  | 'reset-store'
  | 'refresh';

export interface PersistencePanelSnapshot {
  initialized: boolean;
  backend: 'opfs' | 'indexeddb' | 'unknown';
  citizenCount: number;
  eventCount: number;
  snapshotCount: number;
  latestSnapshotType: string;
  loadedNote: string;
  worldId: string;
  noteKey: string;
  noteValue: string;
}

export interface PersistenceFeaturePanelProps {
  className?: string;
  onAction?: (action: PersistencePanelAction) => void;
  onSnapshotChange?: (snapshot: PersistencePanelSnapshot) => void;
}

const WORLD_ID = 'panel-world';
const NOTE_KEY = 'panel-note';

function detectBackend(): PersistencePanelSnapshot['backend'] {
  if (typeof navigator !== 'undefined' && 'storage' in navigator) {
    const supportsOPFS = typeof navigator.storage.getOriginPrivateFileSystem === 'function';
    return supportsOPFS ? 'opfs' : 'indexeddb';
  }
  return 'unknown';
}

function buildSnapshot(fields: {
  initialized: boolean;
  loadedNote: string;
  worldId: string;
  noteKey: string;
  noteValue: string;
}): PersistencePanelSnapshot {
  let citizenCount = 0;
  let eventCount = 0;
  let snapshotCount = 0;
  let latestSnapshotType = 'none';

  try {
    citizenCount = storage.getCitizenCount();
  } catch {
    citizenCount = 0;
  }

  try {
    eventCount = storage.getEvents(fields.worldId, 20).length;
  } catch {
    eventCount = 0;
  }

  try {
    snapshotCount = storage.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM snapshots WHERE world_id = ?',
      [fields.worldId],
    )[0]?.count ?? 0;

    latestSnapshotType = storage.getLatestSnapshot(fields.worldId, 'panel-seal')?.id ? 'panel-seal' : 'none';
  } catch {
    snapshotCount = 0;
    latestSnapshotType = 'unknown';
  }

  return {
    initialized: fields.initialized,
    backend: detectBackend(),
    citizenCount,
    eventCount,
    snapshotCount,
    latestSnapshotType,
    loadedNote: fields.loadedNote,
    worldId: fields.worldId,
    noteKey: fields.noteKey,
    noteValue: fields.noteValue,
  };
}

function metricsFromSnapshot(snapshot: PersistencePanelSnapshot): FeaturePanelMetric[] {
  return [
    { label: '后端', value: snapshot.backend.toUpperCase(), detail: '优先 OPFS，降级到 IndexedDB。' },
    { label: '市民', value: snapshot.citizenCount.toString(), detail: '已持久化的市民记录。' },
    { label: '事件', value: snapshot.eventCount.toString(), detail: '面板世界中的开放事件记录。' },
    { label: '快照', value: snapshot.snapshotCount.toString(), detail: '已保存的世界封印。' },
    { label: '已载入便笺', value: snapshot.loadedNote || '空', detail: '最近重新载入的便笺。' },
  ];
}

function statusesFromSnapshot(snapshot: PersistencePanelSnapshot): FeaturePanelStatus[] {
  return [
    { label: snapshot.initialized ? '存储已初始化' : '存储未就绪', tone: snapshot.initialized ? 'native' : 'fallback' },
    { label: snapshot.backend === 'opfs' ? 'OPFS 已启用' : 'IndexedDB 降级', tone: snapshot.backend === 'unknown' ? 'unavailable' : 'native' },
    { label: snapshot.snapshotCount > 0 ? '快照已封印' : '尚未封印', tone: snapshot.snapshotCount > 0 ? 'native' : 'fallback' },
  ];
}

export function PersistenceFeaturePanel({
  className = '',
  onAction,
  onSnapshotChange,
}: PersistenceFeaturePanelProps) {
  const seededRef = useRef(false);
  const [revision, setRevision] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [loadedNote, setLoadedNote] = useState('');
  const [worldId, setWorldId] = useState(WORLD_ID);
  const [noteKey, setNoteKey] = useState(NOTE_KEY);
  const [noteValue, setNoteValue] = useState('A durable note from the current browser session.');
  const [lastMessage, setLastMessage] = useState('idle');

  const snapshot = useMemo(
    () =>
      buildSnapshot({
        initialized,
        loadedNote,
        worldId,
        noteKey,
        noteValue,
      }),
    [initialized, loadedNote, noteKey, noteValue, revision, worldId]
  );

  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [onSnapshotChange, snapshot]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRevision((value) => value + 1);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    void storage
      .init()
      .then(async () => {
        if (!mounted) return;
        setInitialized(true);
        if (!seededRef.current) {
          seededRef.current = true;
          await storage.createSnapshot(worldId, 'panel-seal', {
            noteKey,
            noteValue,
            createdAt: Date.now(),
            backend: detectBackend(),
          });
        }

        const note = await storage.get<{ message?: string }>(noteKey);
        setLoadedNote(note?.message ?? '');
        setLastMessage('Storage initialized');
        setRevision((value) => value + 1);
      })
      .catch((error) => {
        if (!mounted) return;
        setLastMessage(error instanceof Error ? error.message : String(error));
        setRevision((value) => value + 1);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const refresh = () => {
    onAction?.('refresh');
    setRevision((value) => value + 1);
  };

  const initializeStore = async () => {
    onAction?.('initialize-store');
    try {
      await storage.init();
      setInitialized(true);
      setLastMessage('Storage ready');
    } catch (error) {
      setLastMessage(error instanceof Error ? error.message : String(error));
    }
    setRevision((value) => value + 1);
  };

  const sealSnapshot = async () => {
    onAction?.('seal-snapshot');
    try {
      await storage.createSnapshot(worldId, 'panel-seal', {
        noteKey,
        noteValue,
        createdAt: Date.now(),
        backend: detectBackend(),
        loadedNote,
      });
      setLastMessage(`Snapshot sealed for ${worldId}`);
    } catch (error) {
      setLastMessage(error instanceof Error ? error.message : String(error));
    }
    setRevision((value) => value + 1);
  };

  const saveNote = async () => {
    onAction?.('save-note');
    try {
      await storage.set(noteKey, {
        message: noteValue,
        worldId,
        savedAt: Date.now(),
      });
      setLastMessage(`Note saved under ${noteKey}`);
    } catch (error) {
      setLastMessage(error instanceof Error ? error.message : String(error));
    }
    setRevision((value) => value + 1);
  };

  const loadNote = async () => {
    onAction?.('load-note');
    try {
      const note = await storage.get<{ message?: string }>(noteKey);
      setLoadedNote(note?.message ?? '');
      setLastMessage(note?.message ? `Loaded note from ${noteKey}` : `No note stored under ${noteKey}`);
    } catch (error) {
      setLastMessage(error instanceof Error ? error.message : String(error));
    }
    setRevision((value) => value + 1);
  };

  const resetStore = async () => {
    onAction?.('reset-store');
    try {
      await storage.clear();
      setLoadedNote('');
      setLastMessage('Store cleared');
    } catch (error) {
      setLastMessage(error instanceof Error ? error.message : String(error));
    }
    setRevision((value) => value + 1);
  };

  return (
    <FeaturePanelFrame
      className={className}
      eyebrow="持久化 / OPFS / 快照"
      title="持久化档案库（Persistence Archive）"
      description="这个面板直接对接运行时使用的存储管理器。它可以初始化存储、封印快照、保存普通便笺，并通过同一条浏览器持久化路径重新载入。"
      status={statusesFromSnapshot(snapshot)}
      metrics={metricsFromSnapshot(snapshot)}
      actions={
        <>
          <Button variant="primary" onClick={initializeStore}>
            初始化
          </Button>
          <Button variant="secondary" onClick={sealSnapshot}>
            封印快照
          </Button>
          <Button variant="secondary" onClick={saveNote}>
            保存便笺
          </Button>
          <Button variant="ghost" onClick={loadNote}>
            载入便笺
          </Button>
          <Button variant="ghost" onClick={resetStore}>
            重置存储
          </Button>
          <Button variant="ghost" onClick={refresh}>
            刷新
          </Button>
        </>
      }
      footer={`后端 ${snapshot.backend.toUpperCase()} · 最近消息：${lastMessage}`}
    >
      <div style={{ display: 'grid', gap: '0.9rem', padding: '0 1rem 1rem' }}>
        <PanelSection title="档案控制">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.7rem' }}>
            <Input value={worldId} onChange={(event) => setWorldId(event.target.value)} label="世界 ID" />
            <Input value={noteKey} onChange={(event) => setNoteKey(event.target.value)} label="便笺键" />
          </div>
          <div style={{ marginTop: '0.7rem' }}>
            <Textarea value={noteValue} onChange={(event) => setNoteValue(event.target.value)} rows={5} label="便笺内容" />
          </div>
        </PanelSection>

        <PanelSection title="档案状态">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.7rem' }}>
            <Card title="最近封印" subtitle={snapshot.latestSnapshotType} badge={<Badge variant={snapshot.snapshotCount > 0 ? 'success' : 'warning'}>{snapshot.snapshotCount}</Badge>}>
              <div style={{ display: 'grid', gap: '0.35rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>已初始化：{snapshot.initialized ? '是' : '否'}</div>
                <div>已载入便笺：{snapshot.loadedNote || '空'}</div>
                <div>世界：{snapshot.worldId}</div>
              </div>
            </Card>
            <Card title="当前便笺" subtitle={snapshot.noteKey} badge={<Badge variant="primary">草稿</Badge>}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {snapshot.noteValue || '内存里还没有便笺草稿。'}
              </p>
            </Card>
          </div>
        </PanelSection>
      </div>
    </FeaturePanelFrame>
  );
}

export default PersistenceFeaturePanel;
