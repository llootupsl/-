import React, { type ReactNode } from 'react';
import { Badge } from './Badge';
import { ButtonGroup } from './Button';
import { Panel } from './Panel';
import { Progress } from './Progress';

export type FeaturePanelTone = 'native' | 'fallback' | 'unavailable';

export interface FeaturePanelMetric {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  progress?: number;
  tone?: FeaturePanelTone;
}

export interface FeaturePanelStatus {
  label: ReactNode;
  tone?: FeaturePanelTone;
}

export interface FeaturePanelFrameProps {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  status?: FeaturePanelStatus[];
  metrics?: FeaturePanelMetric[];
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

function toneVariant(tone: FeaturePanelTone | undefined): 'success' | 'warning' | 'danger' | 'primary' | 'default' {
  switch (tone) {
    case 'native':
      return 'success';
    case 'fallback':
      return 'warning';
    case 'unavailable':
      return 'danger';
    default:
      return 'default';
  }
}

function Styles() {
  return (
    <style>{`
      .feature-panel-frame {
        display: grid;
        gap: 1rem;
      }

      .feature-panel-frame__header {
        display: grid;
        gap: 0.9rem;
      }

      .feature-panel-frame__header-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      .feature-panel-frame__eyebrow {
        margin: 0 0 0.3rem;
        font-family: var(--font-mono);
        font-size: 0.72rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .feature-panel-frame__title {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(1.25rem, 2.8vw, 2rem);
        letter-spacing: 0.04em;
      }

      .feature-panel-frame__description {
        margin: 0;
        max-width: 72ch;
        color: var(--text-secondary);
        line-height: 1.65;
      }

      .feature-panel-frame__status,
      .feature-panel-frame__actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .feature-panel-frame__metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.75rem;
      }

      .feature-panel-frame__metric {
        display: grid;
        gap: 0.45rem;
        border-radius: 18px;
        padding: 0.85rem 0.95rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .feature-panel-frame__metric-label {
        color: var(--text-muted);
        font-size: 0.76rem;
      }

      .feature-panel-frame__metric-value {
        font-family: var(--font-mono);
        font-size: 1.08rem;
        color: var(--text-primary);
      }

      .feature-panel-frame__metric-detail {
        color: var(--text-secondary);
        font-size: 0.82rem;
        line-height: 1.5;
      }

      .feature-panel-frame__footer {
        color: var(--text-secondary);
        font-size: 0.84rem;
        line-height: 1.55;
      }
    `}</style>
  );
}

export function FeaturePanelFrame({
  eyebrow,
  title,
  description,
  status = [],
  metrics = [],
  actions,
  footer,
  className = '',
  children,
}: FeaturePanelFrameProps) {
  return (
    <Panel variant="glass" size="lg" glowing className={`feature-panel-frame ${className}`} noPadding>
      <Styles />
      <div style={{ padding: '1rem' }} className="feature-panel-frame__header">
        <div className="feature-panel-frame__header-top">
          <div>
            <div className="feature-panel-frame__eyebrow">{eyebrow}</div>
            <h3 className="feature-panel-frame__title">{title}</h3>
          </div>
          <div className="feature-panel-frame__status">
            {status.map((item, index) => (
              <Badge key={`${index}-${String(item.label)}`} variant={toneVariant(item.tone)}>
                {item.label}
              </Badge>
            ))}
          </div>
        </div>

        <p className="feature-panel-frame__description">{description}</p>

        {metrics.length > 0 && (
          <div className="feature-panel-frame__metrics">
            {metrics.map((metric) => (
              <div key={metric.label} className="feature-panel-frame__metric">
                <span className="feature-panel-frame__metric-label">{metric.label}</span>
                <strong className="feature-panel-frame__metric-value">{metric.value}</strong>
                {typeof metric.progress === 'number' && (
                  <Progress percent={metric.progress} showInfo={false} strokeHeight={5} glow />
                )}
                {metric.detail && (
                  <span className="feature-panel-frame__metric-detail">{metric.detail}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {actions && <ButtonGroup className="feature-panel-frame__actions">{actions}</ButtonGroup>}
      </div>

      {children}

      {footer && (
        <div style={{ padding: '0 1rem 1rem' }} className="feature-panel-frame__footer">
          {footer}
        </div>
      )}
    </Panel>
  );
}

export default FeaturePanelFrame;
