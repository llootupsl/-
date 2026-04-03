import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, PanelSection, Progress } from './common';
import { FeaturePanelFrame, type FeaturePanelMetric, type FeaturePanelStatus } from './common/FeaturePanelFrame';
import {
  crimeSystem,
  lawEnforcement,
  warSystem,
  CrimeType,
} from '@/conflict/CrimeWarSystem';
import {
  climateSystem,
  disasterManager,
  epidemicSystem,
  seasonSystem,
  DisasterType,
  type ChaosWarning,
  type DisasterWarning,
  Season,
} from '@/world/EpidemicClimateSystem';

export type ConflictClimatePanelAction =
  | 'toggle-quarantine'
  | 'increase-vaccination'
  | 'advance-climate'
  | 'cycle-season'
  | 'record-incident'
  | 'resolve-incident'
  | 'declare-tension'
  | 'sign-truce'
  | 'refresh';

export interface ConflictClimatePanelSnapshot {
  temperature: number;
  seaLevel: number;
  co2: number;
  biodiversity: number;
  extremeWeather: number;
  season: Season;
  seasonProgress: number;
  diseaseSpread: number;
  quarantine: boolean;
  vaccinationRate: number;
  activeWars: number;
  cityStates: number;
  crimeLog: number;
  prisonCurrent: number;
  prisonCapacity: number;
  warnings: number;
}

export interface ConflictClimateFeaturePanelProps {
  className?: string;
  onAction?: (action: ConflictClimatePanelAction) => void;
  onSnapshotChange?: (snapshot: ConflictClimatePanelSnapshot) => void;
}

const CONFLICT_CITY_A = 'panel-city-north-harbor';
const CONFLICT_CITY_B = 'panel-city-south-ridge';
const CONFLICT_CRIMINAL = 'panel-criminal-rogue';
const CONFLICT_VICTIM = 'panel-victim-archive';

const conflictSeed = {
  seeded: false,
  cityAId: '',
  cityBId: '',
  crimeId: '',
};

function ensureConflictSeed(): void {
  if (conflictSeed.seeded) return;

  const cityA = warSystem.createCityState(CONFLICT_CITY_A, 'North Harbor', ['n-a1', 'n-a2', 'n-a3']);
  const cityB = warSystem.createCityState(CONFLICT_CITY_B, 'South Ridge', ['s-b1', 's-b2']);
  lawEnforcement.createPolice(1800);
  lawEnforcement.createPrison(28);
  lawEnforcement.hireOfficer('officer-alpha');
  lawEnforcement.startPatrol('officer-alpha', { x: 42, y: 58, radius: 22 });

  epidemicSystem.setQuarantine(false);
  epidemicSystem.setVaccinationRate(0.24);
  epidemicSystem.infectCitizen('panel-health-worker', 'flu');
  epidemicSystem.infectCitizen('panel-traveler', 'pandemic');
  seasonSystem.setSeason(Season.SPRING);

  const crime = crimeSystem.recordCrime(CONFLICT_CRIMINAL, CrimeType.THEFT, CONFLICT_VICTIM, 'civic sensor trail');
  conflictSeed.seeded = true;
  conflictSeed.cityAId = cityA.id;
  conflictSeed.cityBId = cityB.id;
  conflictSeed.crimeId = crime.id;
}

function cycleSeason(current: Season): Season {
  switch (current) {
    case Season.SPRING:
      return Season.SUMMER;
    case Season.SUMMER:
      return Season.AUTUMN;
    case Season.AUTUMN:
      return Season.WINTER;
    case Season.WINTER:
    default:
      return Season.SPRING;
  }
}

function warningId(warning: ChaosWarning | DisasterWarning): string {
  if ('type' in warning) {
    return `${warning.type}-${warning.timestamp}`;
  }
  return `${warning.disasterType}-${warning.estimatedTime}`;
}

function warningTitle(warning: ChaosWarning | DisasterWarning): string {
  if ('type' in warning) {
    return warning.type;
  }
  return warning.disasterType;
}

function warningSummary(warning: ChaosWarning | DisasterWarning): string {
  if ('description' in warning) {
    return warning.description;
  }
  return `Probability ${(warning.probability * 100).toFixed(0)}% · affected ${warning.affectedArea.join(', ')}`;
}

function buildConflictSnapshot(quarantine: boolean, vaccinationRate: number): ConflictClimatePanelSnapshot {
  const climate = climateSystem.getState();
  const season = seasonSystem.getState();
  const wars = warSystem.getActiveWars();
  const cityStates = warSystem.getAllCityStates();
  const prison = lawEnforcement.getPrisonStatus();
  const warnings = [
    ...climateSystem.getChaosWarnings(),
    ...disasterManager.generateWarnings(climate),
  ];

  return {
    temperature: climate.temperature,
    seaLevel: climate.seaLevel,
    co2: climate.co2Concentration,
    biodiversity: climate.biodiversityIndex,
    extremeWeather: climate.extremeWeatherProbability,
    season: season.currentSeason,
    seasonProgress: season.dayInSeason / season.daysPerSeason,
    diseaseSpread: seasonSystem.getDiseaseSpreadModifier(),
    quarantine,
    vaccinationRate,
    activeWars: wars.length,
    cityStates: cityStates.length,
    crimeLog: crimeSystem.getCriminalRecord(CONFLICT_CRIMINAL).length,
    prisonCurrent: prison?.current ?? 0,
    prisonCapacity: prison?.capacity ?? 0,
    warnings: warnings.length,
  };
}

function metricsFromSnapshot(snapshot: ConflictClimatePanelSnapshot): FeaturePanelMetric[] {
  return [
    { label: 'Temperature', value: `${snapshot.temperature.toFixed(1)} °C`, detail: 'Global climate state.' },
    { label: 'CO2', value: `${snapshot.co2.toFixed(0)} ppm`, detail: 'Atmospheric load.' },
    { label: 'Biodiversity', value: `${(snapshot.biodiversity * 100).toFixed(0)}%`, progress: snapshot.biodiversity * 100, detail: 'Ecosystem health.' },
    { label: 'Wars', value: snapshot.activeWars.toString(), detail: 'Active war rooms.' },
    { label: 'Warnings', value: snapshot.warnings.toString(), detail: 'Climate and disaster alerts.' },
  ];
}

function statusesFromSnapshot(snapshot: ConflictClimatePanelSnapshot): FeaturePanelStatus[] {
  return [
    { label: snapshot.quarantine ? 'Quarantine on' : 'Quarantine off', tone: snapshot.quarantine ? 'fallback' : 'native' },
    { label: `${snapshot.vaccinationRate.toFixed(0)}% vaccinated`, tone: snapshot.vaccinationRate >= 50 ? 'native' : 'fallback' },
    { label: snapshot.extremeWeather > 0.45 ? 'Climate risk rising' : 'Climate stable', tone: snapshot.extremeWeather > 0.45 ? 'fallback' : 'native' },
  ];
}

export function ConflictClimateFeaturePanel({
  className = '',
  onAction,
  onSnapshotChange,
}: ConflictClimateFeaturePanelProps) {
  ensureConflictSeed();

  const [quarantine, setQuarantine] = useState(false);
  const [vaccinationRate, setVaccinationRate] = useState(24);
  const [revision, setRevision] = useState(0);
  const [lastCrimeId, setLastCrimeId] = useState(conflictSeed.crimeId);
  const [lastWarId, setLastWarId] = useState('');

  const snapshot = useMemo(() => buildConflictSnapshot(quarantine, vaccinationRate), [revision, quarantine, vaccinationRate]);
  const climate = climateSystem.getState();
  const season = seasonSystem.getState();
  const wars = warSystem.getActiveWars();
  const cityStates = warSystem.getAllCityStates();
  const prison = lawEnforcement.getPrisonStatus();
  const warnings = [...climateSystem.getChaosWarnings(), ...disasterManager.generateWarnings(climate)].slice(0, 4);
  const diseaseStats = epidemicSystem.getStats();

  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [onSnapshotChange, snapshot]);

  const refresh = () => {
    onAction?.('refresh');
    setRevision((value) => value + 1);
  };

  const toggleQuarantine = () => {
    onAction?.('toggle-quarantine');
    const next = !quarantine;
    setQuarantine(next);
    epidemicSystem.setQuarantine(next);
    setRevision((value) => value + 1);
  };

  const increaseVaccination = () => {
    onAction?.('increase-vaccination');
    const next = Math.min(100, vaccinationRate + 18);
    setVaccinationRate(next);
    epidemicSystem.setVaccinationRate(next / 100);
    epidemicSystem.updateDiseaseProgression(1);
    setRevision((value) => value + 1);
  };

  const advanceClimate = () => {
    onAction?.('advance-climate');
    climateSystem.update(1, 220, 3.2);
    epidemicSystem.updateTransmission(1, 140000, 0.42);
    epidemicSystem.updateDiseaseProgression(1);
    disasterManager.update(1);
    setRevision((value) => value + 1);
  };

  const cycleSeasonAction = () => {
    onAction?.('cycle-season');
    seasonSystem.setSeason(cycleSeason(season.currentSeason));
    seasonSystem.update(1);
    setRevision((value) => value + 1);
  };

  const recordIncident = () => {
    onAction?.('record-incident');
    const crime = crimeSystem.recordCrime(
      `panel-criminal-${Date.now()}`,
      CrimeType.FRAUD,
      CONFLICT_VICTIM,
      'panel forensic trace'
    );
    setLastCrimeId(crime.id);
    lawEnforcement.hireOfficer('officer-beta');
    lawEnforcement.startPatrol('officer-beta', { x: 18, y: 26, radius: 18 });
    setRevision((value) => value + 1);
  };

  const resolveIncident = () => {
    onAction?.('resolve-incident');
    if (lastCrimeId) {
      crimeSystem.arrest(lastCrimeId);
      crimeSystem.convict(lastCrimeId, { type: 'fine', amount: 250 });
      if (prison) {
        lawEnforcement.imprison(CONFLICT_CRIMINAL, lastCrimeId, { type: 'imprisonment', duration: 2 });
      }
    }
    setRevision((value) => value + 1);
  };

  const declareTension = () => {
    onAction?.('declare-tension');
    if (cityStates[0] && cityStates[1]) {
      const war = warSystem.declareWar(cityStates[0].id, cityStates[1].id);
      setLastWarId(war?.id ?? '');
    }
    setRevision((value) => value + 1);
  };

  const signTruce = () => {
    onAction?.('sign-truce');
    if (cityStates[0] && cityStates[1]) {
      warSystem.signTreaty([cityStates[0].id, cityStates[1].id], 'non_aggression', [
        'open talks',
        'de-escalate border incidents',
      ]);
    }
    setRevision((value) => value + 1);
  };

  return (
    <FeaturePanelFrame
      className={className}
      eyebrow="冲突 / 疫情 / 气候"
      title="稳定与风险控制台（Stability and Risk Console）"
      description="这个面板把治安、疫情和气候漂移放在同一屏。目标不是制造戏剧感，而是提供一个可见的控制台：状态诚实、动作可用、浏览器能力不足时也有清晰降级。"
      status={statusesFromSnapshot(snapshot)}
      metrics={metricsFromSnapshot(snapshot)}
      actions={
        <>
          <Button variant="primary" onClick={toggleQuarantine}>
            切换隔离
          </Button>
          <Button variant="secondary" onClick={increaseVaccination}>
            提高接种率
          </Button>
          <Button variant="secondary" onClick={advanceClimate}>
            推进气候
          </Button>
          <Button variant="ghost" onClick={cycleSeasonAction}>
            切换季节
          </Button>
          <Button variant="ghost" onClick={recordIncident}>
            记录事件
          </Button>
          <Button variant="ghost" onClick={resolveIncident}>
            处置事件
          </Button>
          <Button variant="ghost" onClick={declareTension}>
            宣告紧张
          </Button>
          <Button variant="ghost" onClick={signTruce}>
            签署休战
          </Button>
          <Button variant="ghost" onClick={refresh}>
            刷新
          </Button>
        </>
      }
      footer={`活跃战争室：${lastWarId || '无'} · 最近案件：${lastCrimeId || '无'} · 季节修正：${snapshot.diseaseSpread.toFixed(2)}x`}
    >
      <div style={{ display: 'grid', gap: '0.9rem', padding: '0 1rem 1rem' }}>
        <PanelSection title="气候信号">
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <Card
              title={`Season: ${season.currentSeason}`}
              subtitle={`Day ${season.dayInSeason} of ${season.daysPerSeason}`}
              badge={<Badge variant="default">spread x{snapshot.diseaseSpread.toFixed(2)}</Badge>}
            >
              <Progress percent={snapshot.seasonProgress * 100} glow />
              <p style={{ margin: '0.75rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Temperature {snapshot.temperature.toFixed(1)} °C, sea level {snapshot.seaLevel.toFixed(2)} m, biodiversity {snapshot.biodiversity.toFixed(2)}.
              </p>
            </Card>
          </div>
        </PanelSection>

        <PanelSection title="Epidemic status">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.7rem' }}>
            {Object.entries(diseaseStats).map(([key, value]) => (
              <Card
                key={key}
                title={key}
                subtitle={`感染 ${value.infected} · 康复 ${value.recovered} · 死亡 ${value.dead}`}
                badge={<Badge variant={value.infected > 0 ? 'warning' : 'success'}>{key}</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  防控状态保持可见。面板直接呈现感染计数，不用抽象文案把模型藏起来。
                </p>
              </Card>
            ))}
          </div>
        </PanelSection>

        <PanelSection title="治安秩序">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.7rem' }}>
            <Card
              title="执法系统"
              subtitle={`${prison?.current ?? 0} inmates / ${prison?.capacity ?? 0} capacity`}
              badge={<Badge variant="primary">prison</Badge>}
            >
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                城邦数量：{cityStates.length}。活跃战争：{wars.length}。犯罪记录：{snapshot.crimeLog}。
              </p>
            </Card>

              <Card
                title="预警"
                subtitle="气候与灾害警报"
                badge={<Badge variant={warnings.length > 0 ? 'warning' : 'success'}>{warnings.length}</Badge>}
              >
              <div style={{ display: 'grid', gap: '0.55rem' }}>
                {warnings.map((warning) => (
                  <div key={warningId(warning)} style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{warningTitle(warning)}</strong> {warningSummary(warning)}
                  </div>
                ))}
                {warnings.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>当前没有预警。系统此刻处于平静状态。</div>}
              </div>
            </Card>
          </div>
        </PanelSection>

        <PanelSection title="城邦账本">
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {cityStates.map((city) => (
              <Card
                key={city.id}
                title={city.name}
                subtitle={`军事 ${city.militaryPower.toFixed(0)} · 技术 ${city.technologyLevel.toFixed(0)}`}
                badge={<Badge variant={city.enemies.length > 0 ? 'warning' : 'default'}>{city.enemies.length} 个敌对方</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  市民 {city.citizens.length}。盟友 {city.allies.length}。条约 {city.treaties.length}。
                </p>
              </Card>
            ))}
          </div>
        </PanelSection>
      </div>
    </FeaturePanelFrame>
  );
}

export default ConflictClimateFeaturePanel;
