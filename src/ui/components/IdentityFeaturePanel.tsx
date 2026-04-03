import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Input, PanelSection } from './common';
import { FeaturePanelFrame, type FeaturePanelMetric, type FeaturePanelStatus } from './common/FeaturePanelFrame';
import { createWebAuthnManager } from '@/auth/WebAuthnManager';

export type IdentityPanelAction =
  | 'provision-pin'
  | 'register-passkey'
  | 'authenticate-passkey'
  | 'remove-pin'
  | 'clear-passkeys'
  | 'refresh';

export interface IdentityPanelSnapshot {
  webAuthnSupported: boolean;
  platformAuthenticatorAvailable: boolean;
  fallbackAvailable: boolean;
  credentialCount: number;
  pinCount: number;
  lastResult: string;
  lastCredentialId: string;
  userId: string;
  userName: string;
  displayName: string;
  deviceName: string;
  pin: string;
}

export interface IdentityFeaturePanelProps {
  className?: string;
  onAction?: (action: IdentityPanelAction) => void;
  onSnapshotChange?: (snapshot: IdentityPanelSnapshot) => void;
}

const identityManager = createWebAuthnManager({
  rpId: typeof window === 'undefined' ? 'localhost' : window.location.hostname || 'localhost',
  rpName: 'OMNIS APIEN',
});

function buildSnapshot(fields: {
  userId: string;
  userName: string;
  displayName: string;
  deviceName: string;
  pin: string;
  lastResult: string;
  lastCredentialId: string;
  platformAuthenticatorAvailable: boolean;
}): IdentityPanelSnapshot {
  const credentials = identityManager.getAllCredentials();
  return {
    webAuthnSupported: identityManager.isWebAuthnSupported(),
    platformAuthenticatorAvailable: fields.platformAuthenticatorAvailable,
    fallbackAvailable: identityManager.hasFallbackAvailable(),
    credentialCount: credentials.length,
    pinCount: identityManager.hasFallbackAvailable() ? 1 : 0,
    lastResult: fields.lastResult,
    lastCredentialId: fields.lastCredentialId,
    userId: fields.userId,
    userName: fields.userName,
    displayName: fields.displayName,
    deviceName: fields.deviceName,
    pin: fields.pin,
  };
}

function metricsFromSnapshot(snapshot: IdentityPanelSnapshot): FeaturePanelMetric[] {
  return [
    { label: '通行密钥', value: snapshot.credentialCount.toString(), detail: '本地管理器中的凭证数量。' },
    { label: 'PIN 降级', value: snapshot.fallbackAvailable ? '已就绪' : '为空', detail: '不支持浏览器时的降级路径。' },
    { label: '支持情况', value: snapshot.webAuthnSupported ? '可用' : '不可用', detail: '安全上下文中的 WebAuthn 能力。' },
    { label: '平台认证', value: snapshot.platformAuthenticatorAvailable ? '已就绪' : '未就绪', detail: '平台认证器的可用性。' },
    { label: '最近结果', value: snapshot.lastResult || '空闲', detail: '最近一次身份操作。' },
  ];
}

function statusesFromSnapshot(snapshot: IdentityPanelSnapshot): FeaturePanelStatus[] {
  return [
    { label: snapshot.webAuthnSupported ? 'WebAuthn 原生' : 'WebAuthn 不可用', tone: snapshot.webAuthnSupported ? 'native' : 'fallback' },
    { label: snapshot.fallbackAvailable ? 'PIN 降级已就绪' : 'PIN 降级为空', tone: snapshot.fallbackAvailable ? 'native' : 'fallback' },
    { label: snapshot.credentialCount > 0 ? '凭证库已填充' : '凭证库为空', tone: snapshot.credentialCount > 0 ? 'native' : 'fallback' },
  ];
}

export function IdentityFeaturePanel({
  className = '',
  onAction,
  onSnapshotChange,
}: IdentityFeaturePanelProps) {
  const [revision, setRevision] = useState(0);
  const [userId, setUserId] = useState('panel-user');
  const [userName, setUserName] = useState('panel.user');
  const [displayName, setDisplayName] = useState('Panel User');
  const [deviceName, setDeviceName] = useState('Panel Device');
  const [pin, setPin] = useState('246810');
  const [lastResult, setLastResult] = useState('idle');
  const [lastCredentialId, setLastCredentialId] = useState('');
  const [platformAuthenticatorAvailable, setPlatformAuthenticatorAvailable] = useState(false);

  const snapshot = useMemo(
    () =>
      buildSnapshot({
        userId,
        userName,
        displayName,
        deviceName,
        pin,
        lastResult,
        lastCredentialId,
        platformAuthenticatorAvailable,
      }),
    [deviceName, displayName, lastCredentialId, lastResult, platformAuthenticatorAvailable, pin, userId, userName, revision]
  );

  const credentials = identityManager.getAllCredentials();

  useEffect(() => {
    let mounted = true;
    void identityManager.isAvailable()
      .then((available) => {
        if (mounted) {
          setPlatformAuthenticatorAvailable(available);
          setRevision((value) => value + 1);
        }
      })
      .catch(() => {
        if (mounted) {
          setPlatformAuthenticatorAvailable(false);
          setRevision((value) => value + 1);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [onSnapshotChange, snapshot]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRevision((value) => value + 1);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = () => {
    onAction?.('refresh');
    setRevision((value) => value + 1);
  };

  const provisionPin = async () => {
    onAction?.('provision-pin');
    try {
      await identityManager.setupPin(userId, pin);
      setLastResult(`PIN provisioned for ${userId}`);
      setRevision((value) => value + 1);
    } catch (error) {
      setLastResult(error instanceof Error ? error.message : String(error));
      setRevision((value) => value + 1);
    }
  };

  const registerPasskey = async () => {
    onAction?.('register-passkey');
    try {
      const credential = await identityManager.register(userId, userName, displayName, deviceName);
      setLastCredentialId(credential.credentialId);
      setLastResult(`通行密钥已注册：${credential.credentialId.slice(0, 12)}`);
      setRevision((value) => value + 1);
    } catch (error) {
      setLastResult(error instanceof Error ? error.message : String(error));
      setRevision((value) => value + 1);
    }
  };

  const authenticatePasskey = async () => {
    onAction?.('authenticate-passkey');
    try {
      const result = await identityManager.authenticate(userId, undefined, pin);
      setLastResult(result.verified ? `Verified via ${result.method}` : `Authentication via ${result.method ?? 'unknown'} failed`);
      setRevision((value) => value + 1);
    } catch (error) {
      setLastResult(error instanceof Error ? error.message : String(error));
      setRevision((value) => value + 1);
    }
  };

  const removePin = async () => {
    onAction?.('remove-pin');
    try {
      const removed = await identityManager.removePin(userId);
      setLastResult(removed ? `PIN removed for ${userId}` : `No PIN stored for ${userId}`);
      setRevision((value) => value + 1);
    } catch (error) {
      setLastResult(error instanceof Error ? error.message : String(error));
      setRevision((value) => value + 1);
    }
  };

  const clearPasskeys = async () => {
    onAction?.('clear-passkeys');
    try {
      await identityManager.clearAllCredentials();
      setLastCredentialId('');
      setLastResult('All passkeys cleared');
      setRevision((value) => value + 1);
    } catch (error) {
      setLastResult(error instanceof Error ? error.message : String(error));
      setRevision((value) => value + 1);
    }
  };

  return (
    <FeaturePanelFrame
      className={className}
      eyebrow="身份 / 通行密钥 / 降级"
      title="身份保险库（Identity Vault）"
      description="这个面板把 WebAuthn 和 PIN 降级绑定到同一个实时管理器。浏览器要么直接暴露通行密钥，要么由面板把降级路径明确展示出来，不再掩盖差异。"
      status={statusesFromSnapshot(snapshot)}
      metrics={metricsFromSnapshot(snapshot)}
      actions={
        <>
          <Button variant="primary" onClick={provisionPin}>
            设定 PIN
          </Button>
          <Button variant="secondary" onClick={registerPasskey}>
            注册通行密钥
          </Button>
          <Button variant="secondary" onClick={authenticatePasskey}>
            认证
          </Button>
          <Button variant="ghost" onClick={removePin}>
            移除 PIN
          </Button>
          <Button variant="ghost" onClick={clearPasskeys}>
            清空通行密钥
          </Button>
          <Button variant="ghost" onClick={refresh}>
            刷新
          </Button>
        </>
      }
      footer="通行密钥与 PIN 状态来自同一个身份管理器。面板会直接报告支持情况、可用性和已存储凭证。"
    >
      <div style={{ display: 'grid', gap: '0.9rem', padding: '0 1rem 1rem' }}>
        <PanelSection title="身份控制">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.7rem' }}>
            <Input value={userId} onChange={(event) => setUserId(event.target.value)} label="用户 ID" />
            <Input value={userName} onChange={(event) => setUserName(event.target.value)} label="用户名" />
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} label="显示名称" />
            <Input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} label="设备名称" />
            <Input value={pin} onChange={(event) => setPin(event.target.value)} label="降级 PIN" type="password" />
          </div>
        </PanelSection>

        <PanelSection title="已存凭证">
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {credentials.map((credential) => (
              <Card
                key={credential.credentialId}
                title={credential.deviceName}
                subtitle={credential.credentialId}
                badge={<Badge variant="success">通行密钥</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  创建于 {new Date(credential.createdAt).toLocaleString()} · 最近使用 {new Date(credential.lastUsed).toLocaleString()}。
                </p>
              </Card>
            ))}
            {credentials.length === 0 && (
              <div style={{ color: 'var(--text-secondary)' }}>当前还没有存储通行密钥。先设定 PIN 或注册通行密钥来填充保险库。</div>
            )}
          </div>
        </PanelSection>

        <PanelSection title="操作日志">
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            <Card
              title="当前状态"
              subtitle={snapshot.lastCredentialId || '未选择凭证'}
              badge={<Badge variant={snapshot.webAuthnSupported ? 'primary' : 'warning'}>{snapshot.webAuthnSupported ? 'WebAuthn' : '仅 PIN'}</Badge>}
            >
              <div style={{ display: 'grid', gap: '0.35rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>平台认证器：{snapshot.platformAuthenticatorAvailable ? '已就绪' : '未就绪'}</div>
                <div>降级可用性：{snapshot.fallbackAvailable ? '已就绪' : '未就绪'}</div>
                <div>最近结果：{snapshot.lastResult}</div>
              </div>
            </Card>
          </div>
        </PanelSection>
      </div>
    </FeaturePanelFrame>
  );
}

export default IdentityFeaturePanel;
