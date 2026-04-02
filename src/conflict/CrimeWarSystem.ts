/**
 * =============================================================================
 * 永夜熵纪 - 犯罪、执法与战争系统
 * Crime, Law Enforcement and War System
 * =============================================================================
 */

/** 犯罪类型 */
export enum CrimeType {
  THEFT = 'theft',
  VANDALISM = 'vandalism',
  ASSAULT = 'assault',
  FRAUD = 'fraud',
  SMUGGLING = 'smuggling',
  TREASON = 'treason',
}

/** 犯罪记录 */
export interface CrimeRecord {
  id: string;
  criminalId: string;
  type: CrimeType;
  victimId?: string;
  timestamp: number;
  severity: number;
  evidence: string;
  status: 'pending' | 'arrested' | 'convicted' | 'acquitted';
  sentence?: Sentence;
}

/** 判决 */
export interface Sentence {
  type: 'fine' | 'imprisonment' | 'rights_restriction' | 'exile';
  duration?: number;
  amount?: number;
}

/** 警察合约 */
export interface PoliceContract {
  id: string;
  officerIds: string[];
  activePatrols: Patrol[];
  arrestRate: number;
  reputation: number;
  budget: number;
}

/** 巡逻 */
export interface Patrol {
  officerId: string;
  area: { x: number; y: number; radius: number };
  status: 'patrolling' | 'responding' | 'returning';
}

/** 监狱 */
export interface Prison {
  id: string;
  capacity: number;
  inmates: Prisoner[];
  reformationRate: number;
}

/** 囚犯 */
export interface Prisoner {
  citizenId: string;
  crimeId: string;
  sentence: Sentence;
  incarcerationDate: number;
  behavior: number; // 0-1, 改造程度
}

/** 城邦 */
export interface CityState {
  id: string;
  name: string;
  leaderId: string;
  citizens: string[];
  resources: Record<string, number>;
  militaryPower: number;
  technologyLevel: number;
  treaties: Treaty[];
  allies: string[];
  enemies: string[];
}

/** 条约 */
export interface Treaty {
  id: string;
  type: 'alliance' | 'non_aggression' | 'trade' | 'surrender';
  parties: string[];
  terms: string[];
  startDate: number;
  endDate?: number;
  violated: boolean;
}

/** 战争 */
export interface War {
  id: string;
  aggressors: string[];
  defenders: string[];
  startDate: number;
  endDate?: number;
  status: 'active' | 'ended' | 'negotiating';
  battles: Battle[];
  totalCasualties: { aggressors: number; defenders: number };
  outcome?: 'aggressor_victory' | 'defender_victory' | 'draw' | 'negotiated';
}

/** 战斗 */
export interface Battle {
  id: string;
  location: { x: number; y: number };
  startDate: number;
  duration: number;
  participants: { side: 'aggressor' | 'defender'; count: number }[];
  casualties: { side: 'aggressor' | 'defender'; count: number }[];
}

/** 犯罪系统 */
export class CrimeSystem {
  private crimes: Map<string, CrimeRecord> = new Map();
  private crimeProbability: Map<CrimeType, number> = new Map();
  private povertyThreshold: number = 0.2;

  constructor() {
    this.initializeCrimeRates();
  }

  /**
   * 初始化犯罪率
   */
  private initializeCrimeRates(): void {
    this.crimeProbability.set(CrimeType.THEFT, 0.05);
    this.crimeProbability.set(CrimeType.VANDALISM, 0.03);
    this.crimeProbability.set(CrimeType.ASSAULT, 0.02);
    this.crimeProbability.set(CrimeType.FRAUD, 0.01);
    this.crimeProbability.set(CrimeType.SMUGGLING, 0.005);
    this.crimeProbability.set(CrimeType.TREASON, 0.001);
  }

  /**
   * 检查是否犯罪
   */
  public checkCrime(citizenId: string, wealth: number, stress: number): CrimeType | null {
    // 贫困导致犯罪
    const povertyFactor = wealth < this.povertyThreshold ? 2 : 1;
    const stressFactor = 1 + stress * 0.5;

    for (const [type, baseProb] of this.crimeProbability) {
      const crimeProb = baseProb * povertyFactor * stressFactor;
      if (Math.random() < crimeProb) {
        return type;
      }
    }
    return null;
  }

  /**
   * 记录犯罪
   */
  public recordCrime(
    criminalId: string,
    type: CrimeType,
    victimId?: string,
    evidence?: string
  ): CrimeRecord {
    const crime: CrimeRecord = {
      id: crypto.randomUUID(),
      criminalId,
      type,
      victimId,
      timestamp: Date.now(),
      severity: this.getCrimeSeverity(type),
      evidence: evidence || '',
      status: 'pending',
    };
    this.crimes.set(crime.id, crime);
    return crime;
  }

  /**
   * 获取犯罪严重程度
   */
  private getCrimeSeverity(type: CrimeType): number {
    const severities: Record<CrimeType, number> = {
      [CrimeType.THEFT]: 0.3,
      [CrimeType.VANDALISM]: 0.2,
      [CrimeType.ASSAULT]: 0.5,
      [CrimeType.FRAUD]: 0.4,
      [CrimeType.SMUGGLING]: 0.6,
      [CrimeType.TREASON]: 1.0,
    };
    return severities[type];
  }

  /**
   * 逮捕罪犯
   */
  public arrest(crimeId: string): boolean {
    const crime = this.crimes.get(crimeId);
    if (!crime || crime.status !== 'pending') return false;
    crime.status = 'arrested';
    return true;
  }

  /**
   * 判决
   */
  public convict(crimeId: string, sentence: Sentence): boolean {
    const crime = this.crimes.get(crimeId);
    if (!crime || crime.status !== 'arrested') return false;
    crime.status = 'convicted';
    crime.sentence = sentence;
    return true;
  }

  /**
   * 获取市民的犯罪记录
   */
  public getCriminalRecord(citizenId: string): CrimeRecord[] {
    return Array.from(this.crimes.values()).filter(c => c.criminalId === citizenId);
  }
}

/** 执法系统 */
export class LawEnforcementSystem {
  private police: PoliceContract | null = null;
  private prison: Prison | null = null;
  private crimeSystem: CrimeSystem;

  constructor(crimeSystem: CrimeSystem) {
    this.crimeSystem = crimeSystem;
  }

  /**
   * 创建警察系统
   */
  public createPolice(budget: number = 1000): PoliceContract {
    this.police = {
      id: crypto.randomUUID(),
      officerIds: [],
      activePatrols: [],
      arrestRate: 0.3,
      reputation: 50,
      budget,
    };
    return this.police;
  }

  /**
   * 雇佣警察
   */
  public hireOfficer(officerId: string): boolean {
    if (!this.police) return false;
    if (!this.police.officerIds.includes(officerId)) {
      this.police.officerIds.push(officerId);
    }
    return true;
  }

  /**
   * 巡逻
   */
  public startPatrol(officerId: string, area: { x: number; y: number; radius: number }): void {
    if (!this.police) return;
    this.police.activePatrols.push({
      officerId,
      area,
      status: 'patrolling',
    });
  }

  /**
   * 检查巡逻区域
   */
  public checkPatrolArea(criminalId: string, position: { x: number; y: number }): boolean {
    if (!this.police) return false;

    for (const patrol of this.police.activePatrols) {
      const dx = position.x - patrol.area.x;
      const dy = position.y - patrol.area.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < patrol.area.radius && Math.random() < this.police.arrestRate) {
        return true;
      }
    }
    return false;
  }

  /**
   * 创建监狱
   */
  public createPrison(capacity: number = 100): Prison {
    this.prison = {
      id: crypto.randomUUID(),
      capacity,
      inmates: [],
      reformationRate: 0.1,
    };
    return this.prison;
  }

  /**
   * 关押囚犯
   */
  public imprison(citizenId: string, crimeId: string, sentence: Sentence): boolean {
    if (!this.prison) return false;
    if (this.prison.inmates.length >= this.prison.capacity) return false;

    this.prison.inmates.push({
      citizenId,
      crimeId,
      sentence,
      incarcerationDate: Date.now(),
      behavior: 1.0,
    });
    return true;
  }

  /**
   * 更新囚犯改造
   */
  public updateReformation(dt: number): void {
    if (!this.prison) return;

    for (const inmate of this.prison.inmates) {
      // 行为改善
      inmate.behavior = Math.min(1, inmate.behavior + this.prison.reformationRate * dt);
      
      // 检查刑期
      if (inmate.sentence.type === 'imprisonment' && inmate.sentence.duration) {
        const daysIncarcerated = (Date.now() - inmate.incarcerationDate) / (24 * 60 * 60 * 1000);
        if (daysIncarcerated >= inmate.sentence.duration) {
          this.release(inmate.citizenId);
        }
      }
    }
  }

  /**
   * 释放囚犯
   */
  public release(citizenId: string): void {
    if (!this.prison) return;
    this.prison.inmates = this.prison.inmates.filter(p => p.citizenId !== citizenId);
  }

  /**
   * 获取监狱状态
   */
  public getPrisonStatus(): { capacity: number; current: number; reformationRate: number } | null {
    if (!this.prison) return null;
    return {
      capacity: this.prison.capacity,
      current: this.prison.inmates.length,
      reformationRate: this.prison.reformationRate,
    };
  }
}

/** 战争系统 */
export class WarSystem {
  private cityStates: Map<string, CityState> = new Map();
  private wars: Map<string, War> = new Map();
  private treaties: Map<string, Treaty> = new Map();

  constructor() {}

  /**
   * 创建城邦
   */
  public createCityState(
    leaderId: string,
    name: string,
    citizens: string[] = []
  ): CityState {
    const cityState: CityState = {
      id: crypto.randomUUID(),
      name,
      leaderId,
      citizens,
      resources: {},
      militaryPower: 100,
      technologyLevel: 1,
      treaties: [],
      allies: [],
      enemies: [],
    };
    this.cityStates.set(cityState.id, cityState);
    return cityState;
  }

  /**
   * 宣战
   */
  public declareWar(aggressorId: string, defenderId: string): War | null {
    const aggressor = this.cityStates.get(aggressorId);
    const defender = this.cityStates.get(defenderId);
    if (!aggressor || !defender) return null;

    // 检查是否有互不侵犯条约
    const treaty = this.findTreaty(aggressorId, defenderId, 'non_aggression');
    if (treaty) {
      treaty.violated = true;
    }

    const war: War = {
      id: crypto.randomUUID(),
      aggressors: [aggressorId],
      defenders: [defenderId],
      startDate: Date.now(),
      status: 'active',
      battles: [],
      totalCasualties: { aggressors: 0, defenders: 0 },
    };

    this.wars.set(war.id, war);

    // 更新敌对关系
    aggressor.enemies.push(defenderId);
    defender.enemies.push(aggressorId);

    return war;
  }

  /**
   * 发起战斗
   */
  public startBattle(warId: string, location: { x: number; y: number }): Battle | null {
    const war = this.wars.get(warId);
    if (!war || war.status !== 'active') return null;

    const battle: Battle = {
      id: crypto.randomUUID(),
      location,
      startDate: Date.now(),
      duration: 0,
      participants: [],
      casualties: [],
    };

    // 计算参战人数
    for (const aggressorId of war.aggressors) {
      const city = this.cityStates.get(aggressorId);
      if (city) {
        battle.participants.push({
          side: 'aggressor',
          count: Math.floor(city.militaryPower * Math.random()),
        });
      }
    }

    for (const defenderId of war.defenders) {
      const city = this.cityStates.get(defenderId);
      if (city) {
        battle.participants.push({
          side: 'defender',
          count: Math.floor(city.militaryPower * Math.random()),
        });
      }
    }

    // 计算伤亡
    const aggressorPower = battle.participants
      .filter(p => p.side === 'aggressor')
      .reduce((sum, p) => sum + p.count, 0);
    const defenderPower = battle.participants
      .filter(p => p.side === 'defender')
      .reduce((sum, p) => sum + p.count, 0);

    const aggressorCasualties = Math.floor(defenderPower * 0.3 * Math.random());
    const defenderCasualties = Math.floor(aggressorPower * 0.3 * Math.random());

    battle.casualties = [
      { side: 'aggressor', count: aggressorCasualties },
      { side: 'defender', count: defenderCasualties },
    ];

    war.totalCasualties.aggressors += aggressorCasualties;
    war.totalCasualties.defenders += defenderCasualties;
    war.battles.push(battle);

    return battle;
  }

  /**
   * 结束战争
   */
  public endWar(warId: string, outcome: War['outcome']): boolean {
    const war = this.wars.get(warId);
    if (!war || war.status !== 'active') return false;

    war.status = 'ended';
    war.endDate = Date.now();
    war.outcome = outcome;

    // 处理结果
    if (outcome === 'aggressor_victory') {
      for (const defenderId of war.defenders) {
        const defender = this.cityStates.get(defenderId);
        if (defender) {
          defender.militaryPower *= 0.5;
          defender.resources = {};
        }
      }
    }

    return true;
  }

  /**
   * 签订条约
   */
  public signTreaty(
    parties: string[],
    type: Treaty['type'],
    terms: string[],
    duration?: number
  ): Treaty {
    const treaty: Treaty = {
      id: crypto.randomUUID(),
      type,
      parties,
      terms,
      startDate: Date.now(),
      endDate: duration ? Date.now() + duration * 24 * 60 * 60 * 1000 : undefined,
      violated: false,
    };

    this.treaties.set(treaty.id, treaty);

    // 更新城邦关系
    if (type === 'alliance') {
      for (const partyId of parties) {
        const party = this.cityStates.get(partyId);
        if (party) {
          for (const otherId of parties) {
            if (otherId !== partyId) {
              if (!party.allies.includes(otherId)) {
                party.allies.push(otherId);
              }
              party.enemies = party.enemies.filter(id => id !== otherId);
            }
          }
        }
      }
    }

    return treaty;
  }

  /**
   * 查找条约
   */
  private findTreaty(cityId1: string, cityId2: string, type?: Treaty['type']): Treaty | null {
    for (const treaty of this.treaties.values()) {
      if (treaty.parties.includes(cityId1) && treaty.parties.includes(cityId2)) {
        if (!type || treaty.type === type) {
          return treaty;
        }
      }
    }
    return null;
  }

  /**
   * 获取城邦
   */
  public getCityState(id: string): CityState | undefined {
    return this.cityStates.get(id);
  }

  /**
   * 获取所有城邦
   */
  public getAllCityStates(): CityState[] {
    return Array.from(this.cityStates.values());
  }

  /**
   * 获取活跃战争
   */
  public getActiveWars(): War[] {
    return Array.from(this.wars.values()).filter(w => w.status === 'active');
  }
}

// 导出
export const crimeSystem = new CrimeSystem();
export const lawEnforcement = new LawEnforcementSystem(crimeSystem);
export const warSystem = new WarSystem();
export default { crimeSystem, lawEnforcement, warSystem };
