/**
 * =============================================================================
 * 永夜熵纪 - 流行病与气候模型
 * Epidemic and Climate Simulation System
 * =============================================================================
 */

/** 季节类型 */
export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter',
}

/** 季节配置 */
export interface SeasonConfig {
  name: string;
  temperatureModifier: number;
  precipitationModifier: number;
  resourceMultiplier: number;
  diseaseSpreadModifier: number;
  daylightHours: number;
}

/** 季节状态 */
export interface SeasonState {
  currentSeason: Season;
  dayInSeason: number;
  daysPerSeason: number;
  yearProgress: number;
}

/** 灾害类型 */
export enum DisasterType {
  EARTHQUAKE = 'earthquake',
  FLOOD = 'flood',
  DROUGHT = 'drought',
  STORM = 'storm',
  WILDFIRE = 'wildfire',
  TSUNAMI = 'tsunami',
  VOLCANO = 'volcano',
  PLAGUE = 'plague',
}

/** 自然灾害 */
export interface NaturalDisaster {
  id: string;
  type: DisasterType;
  name: string;
  severity: number;
  affectedArea: {
    centerX: number;
    centerY: number;
    radius: number;
  };
  startTime: number;
  duration: number;
  effects: DisasterEffects;
  isActive: boolean;
}

/** 灾害效果 */
export interface DisasterEffects {
  healthDamage: number;
  resourceLoss: number;
  buildingDamage: number;
  populationDisplacement: number;
  economicImpact: number;
  environmentalDamage: number;
}

/** 灾害预警 */
export interface DisasterWarning {
  disasterType: DisasterType;
  probability: number;
  estimatedTime: number;
  affectedArea: string[];
  severity: number;
}

/** 市民环境状态 */
export interface CitizenEnvironmentState {
  citizenId: string;
  temperatureStress: number;
  weatherExposure: number;
  seasonalAffect: number;
  disasterTrauma: number;
  adaptationLevel: number;
}

/** 环境可视化数据 */
export interface EnvironmentVisualizationData {
  season: {
    current: Season;
    name: string;
    progress: number;
    temperatureMod: number;
  };
  climate: {
    temperature: number;
    precipitation: number;
    extremeWeatherProb: number;
  };
  disasters: {
    active: Array<{
      type: DisasterType;
      name: string;
      severity: number;
      location: { x: number; y: number };
    }>;
    warnings: Array<{
      type: DisasterType;
      probability: number;
    }>;
  };
  effects: {
    agricultureMultiplier: number;
    healthRisk: number;
    energyDemand: number;
  };
}

/** 疾病状态 */
export enum DiseaseState {
  SUSCEPTIBLE = 'susceptible',
  EXPOSED = 'exposed',
  INFECTED = 'infected',
  RECOVERED = 'recovered',
  DEAD = 'dead',
}

/** 疾病 */
export interface Disease {
  id: string;
  name: string;
  /** 基本传染率 */
  baseTransmissionRate: number;
  /** 潜伏期（天） */
  incubationPeriod: number;
  /** 感染期（天） */
  infectiousPeriod: number;
  /** 死亡率 */
  mortalityRate: number;
  /** 症状严重程度 */
  severity: number;
  /** 变异概率 */
  mutationRate: number;
  /** 当前感染人数 */
  currentInfected: number;
}

/** 市民疾病状态 */
export interface CitizenDiseaseState {
  citizenId: string;
  diseaseId: string;
  state: DiseaseState;
  /** 感染时间 */
  infectedTime: number;
  /** 病毒载量 */
  viralLoad: number;
  /** 免疫力 */
  immunity: number;
}

/** 气候状态 */
export interface ClimateState {
  /** 全球平均温度（摄氏度） */
  temperature: number;
  /** 海平面（米） */
  seaLevel: number;
  /** 降水量（mm/天） */
  precipitation: number;
  /** 二氧化碳浓度（ppm） */
  co2Concentration: number;
  /** 碳排放量（Gt/年） */
  carbonEmissions: number;
  /** 生物多样性指数 */
  biodiversityIndex: number;
  /** 极端天气概率 */
  extremeWeatherProbability: number;
}

/** 生态系统 */
export interface Ecosystem {
  /** 碳循环 */
  carbonCycle: {
    atmosphere: number;
    vegetation: number;
    ocean: number;
    soil: number;
  };
  /** 氮循环 */
  nitrogenCycle: {
    atmosphere: number;
    soil: number;
    vegetation: number;
  };
  /** 水循环 */
  waterCycle: {
    evaporation: number;
    precipitation: number;
    runoff: number;
  };
  /** 生态系统健康指数 */
  healthIndex: number;
}

/** 混沌预警 */
export interface ChaosWarning {
  type: 'lyapunov' | 'tipping_point' | 'cascade_failure';
  description: string;
  riskLevel: number;
  affectedSystems: string[];
  timestamp: number;
}

/** 流行病系统 */
export class EpidemicSystem {
  private diseases: Map<string, Disease> = new Map();
  private citizenStates: Map<string, CitizenDiseaseState[]> = new Map();
  private quarantineActive: boolean = false;
  private vaccinationRate: number = 0;

  constructor() {
    this.initializeDefaultDiseases();
  }

  /**
   * 初始化默认疾病
   */
  private initializeDefaultDiseases(): void {
    const diseases: Disease[] = [
      {
        id: 'flu',
        name: '流感',
        baseTransmissionRate: 0.3,
        incubationPeriod: 2,
        infectiousPeriod: 5,
        mortalityRate: 0.01,
        severity: 0.3,
        mutationRate: 0.05,
        currentInfected: 0,
      },
      {
        id: 'plague',
        name: '瘟疫',
        baseTransmissionRate: 0.6,
        incubationPeriod: 3,
        infectiousPeriod: 7,
        mortalityRate: 0.3,
        severity: 0.8,
        mutationRate: 0.02,
        currentInfected: 0,
      },
      {
        id: 'pandemic',
        name: '大流行病',
        baseTransmissionRate: 0.8,
        incubationPeriod: 5,
        infectiousPeriod: 14,
        mortalityRate: 0.05,
        severity: 0.7,
        mutationRate: 0.1,
        currentInfected: 0,
      },
    ];

    for (const disease of diseases) {
      this.diseases.set(disease.id, disease);
    }
  }

  /**
   * 感染市民
   */
  public infectCitizen(citizenId: string, diseaseId: string): void {
    const disease = this.diseases.get(diseaseId);
    if (!disease) return;

    const states = this.citizenStates.get(citizenId) || [];
    const existing = states.find(s => s.diseaseId === diseaseId);
    
    if (!existing) {
      states.push({
        citizenId,
        diseaseId,
        state: DiseaseState.EXPOSED,
        infectedTime: Date.now(),
        viralLoad: 0.1,
        immunity: 0,
      });
      this.citizenStates.set(citizenId, states);
      disease.currentInfected++;
    }
  }

  /**
   * 更新疾病传播
   */
  public updateTransmission(dt: number, population: number, density: number): void {
    for (const disease of this.diseases.values()) {
      if (disease.currentInfected === 0) continue;

      // 计算有效传染率
      let transmissionRate = disease.baseTransmissionRate;
      
      // 隔离措施降低传染率
      if (this.quarantineActive) {
        transmissionRate *= 0.3;
      }
      
      // 接种率降低传染率
      transmissionRate *= (1 - this.vaccinationRate);
      
      // 人口密度影响
      transmissionRate *= (1 + density * 0.5);
      
      // 计算新感染人数
      const susceptible = population - disease.currentInfected;
      const newInfected = Math.floor(susceptible * transmissionRate * dt * 0.1);
      
      disease.currentInfected += newInfected;
    }
  }

  /**
   * 更新疾病状态
   */
  public updateDiseaseProgression(dt: number): void {
    const now = Date.now();

    for (const states of this.citizenStates.values()) {
      for (const state of states) {
        const disease = this.diseases.get(state.diseaseId);
        if (!disease) continue;

        // 更新病毒载量
        switch (state.state) {
          case DiseaseState.EXPOSED:
            state.viralLoad += dt * 0.1;
            if (state.viralLoad >= 1) {
              state.state = DiseaseState.INFECTED;
            }
            break;

          case DiseaseState.INFECTED:
            state.viralLoad = Math.min(1, state.viralLoad + dt * 0.05);
            
            // 死亡率判定
            if (Math.random() < disease.mortalityRate * dt * 0.01) {
              state.state = DiseaseState.DEAD;
              disease.currentInfected--;
            }
            
            // 康复判定
            const daysSinceInfection = (now - state.infectedTime) / (24 * 60 * 60 * 1000);
            if (daysSinceInfection > disease.infectiousPeriod) {
              state.state = DiseaseState.RECOVERED;
              state.immunity = 0.8;
              disease.currentInfected--;
            }
            break;
        }
      }
    }
  }

  /**
   * 实施隔离
   */
  public setQuarantine(active: boolean): void {
    this.quarantineActive = active;
  }

  /**
   * 设置接种率
   */
  public setVaccinationRate(rate: number): void {
    this.vaccinationRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * 获取疾病统计
   */
  public getStats(): Record<string, { infected: number; recovered: number; dead: number }> {
    const stats: Record<string, any> = {};

    for (const disease of this.diseases.values()) {
      stats[disease.id] = {
        name: disease.name,
        infected: disease.currentInfected,
        recovered: 0,
        dead: 0,
      };
    }

    for (const states of this.citizenStates.values()) {
      for (const state of states) {
        if (state.state === DiseaseState.RECOVERED) {
          stats[state.diseaseId].recovered++;
        } else if (state.state === DiseaseState.DEAD) {
          stats[state.diseaseId].dead++;
        }
      }
    }

    return stats;
  }
}

/** 气候系统 */
export class ClimateSystem {
  private state: ClimateState;
  private ecosystem: Ecosystem;
  private history: ClimateState[] = [];
  private lyapunovExponent: number = 0;

  constructor() {
    this.state = this.getInitialClimateState();
    this.ecosystem = this.getInitialEcosystem();
  }

  /**
   * 获取初始气候状态
   */
  private getInitialClimateState(): ClimateState {
    return {
      temperature: 15, // 全球平均温度
      seaLevel: 0,
      precipitation: 2.5,
      co2Concentration: 280,
      carbonEmissions: 0,
      biodiversityIndex: 1.0,
      extremeWeatherProbability: 0.1,
    };
  }

  /**
   * 获取初始生态系统
   */
  private getInitialEcosystem(): Ecosystem {
    return {
      carbonCycle: {
        atmosphere: 720,
        vegetation: 2300,
        ocean: 38000,
        soil: 1500,
      },
      nitrogenCycle: {
        atmosphere: 4000000,
        soil: 95000,
        vegetation: 12000,
      },
      waterCycle: {
        evaporation: 0,
        precipitation: 0,
        runoff: 0,
      },
      healthIndex: 1.0,
    };
  }

  /**
   * 更新气候
   */
  public update(dt: number, carbonEmissions: number, technologyLevel: number): void {
    // 保存历史状态
    this.history.push({ ...this.state });
    if (this.history.length > 1000) this.history.shift();

    // CO2浓度变化
    const absorptionRate = 0.4 - technologyLevel * 0.1; // 科技提高吸收率
    this.state.co2Concentration += (carbonEmissions * 0.001 - this.state.co2Concentration * absorptionRate * 0.001) * dt;

    // 温度变化（简化的能量平衡模型）
    const temperatureChange = 0.01 * (this.state.co2Concentration - 280) * dt;
    this.state.temperature += temperatureChange;

    // 海平面变化
    this.state.seaLevel += 0.001 * this.state.temperature * dt;

    // 碳排放记录
    this.state.carbonEmissions = carbonEmissions;

    // 更新生态系统
    this.updateEcosystem(dt, technologyLevel);

    // 计算极端天气概率
    this.updateExtremeWeatherProbability();

    // 计算李雅普诺夫指数
    this.calculateLyapunovExponent();
  }

  /**
   * 更新生态系统
   */
  private updateEcosystem(dt: number, techLevel: number): void {
    const eco = this.ecosystem;

    // 碳循环
    eco.carbonCycle.vegetation -= eco.carbonCycle.vegetation * 0.001 * dt;
    eco.carbonCycle.ocean += this.state.carbonEmissions * 0.001 * dt;
    
    // 植被覆盖率影响碳吸收
    const vegetationHealth = Math.max(0, 1 - this.state.temperature / 40);
    eco.carbonCycle.vegetation *= (1 + vegetationHealth * 0.01 * dt);

    // 生物多样性
    this.state.biodiversityIndex = Math.max(0, Math.min(1, 
      1 - this.state.temperature / 50 - eco.carbonCycle.vegetation * 0.001
    ));

    // 生态系统健康
    eco.healthIndex = (
      this.state.biodiversityIndex * 0.3 +
      vegetationHealth * 0.3 +
      (1 - this.state.seaLevel / 100) * 0.2 +
      (1 - this.state.co2Concentration / 1000) * 0.2
    );
  }

  /**
   * 更新极端天气概率
   */
  private updateExtremeWeatherProbability(): void {
    const tempFactor = Math.max(0, this.state.temperature - 15) / 30;
    const seaFactor = this.state.seaLevel / 10;
    const co2Factor = (this.state.co2Concentration - 280) / 500;

    this.state.extremeWeatherProbability = Math.min(1, 
      0.1 + tempFactor * 0.3 + seaFactor * 0.2 + co2Factor * 0.4
    );
  }

  /**
   * 计算李雅普诺夫指数
   */
  private calculateLyapunovExponent(): void {
    if (this.history.length < 10) return;

    const recent = this.history.slice(-10);
    let sum = 0;

    for (let i = 1; i < recent.length; i++) {
      const dx = recent[i].temperature - recent[i - 1].temperature;
      sum += Math.log(Math.abs(dx) + 0.0001);
    }

    this.lyapunovExponent = sum / (recent.length - 1);
  }

  /**
   * 获取混沌警告
   */
  public getChaosWarnings(): ChaosWarning[] {
    const warnings: ChaosWarning[] = [];

    // 李雅普诺夫警告
    if (this.lyapunovExponent > 0.5) {
      warnings.push({
        type: 'lyapunov',
        description: `系统混沌度较高（λ=${this.lyapunovExponent.toFixed(3)}），长期预测不可靠`,
        riskLevel: Math.min(1, this.lyapunovExponent),
        affectedSystems: ['气候', '农业', '生态'],
        timestamp: Date.now(),
      });
    }

    // 临界点警告
    if (this.state.temperature > 25) {
      warnings.push({
        type: 'tipping_point',
        description: '温度接近临界点，可能触发不可逆气候变化',
        riskLevel: 0.8,
        affectedSystems: ['气候', '海平面', '农业'],
        timestamp: Date.now(),
      });
    }

    // 级联故障警告
    if (this.state.biodiversityIndex < 0.3) {
      warnings.push({
        type: 'cascade_failure',
        description: '生物多样性过低，生态系统可能崩溃',
        riskLevel: 0.9,
        affectedSystems: ['生态', '农业', '气候'],
        timestamp: Date.now(),
      });
    }

    return warnings;
  }

  /**
   * 获取气候状态
   */
  public getState(): ClimateState {
    return { ...this.state };
  }

  /**
   * 获取生态系统状态
   */
  public getEcosystem(): Ecosystem {
    return { ...this.ecosystem };
  }

  /**
   * 获取气候影响因子
   */
  public getImpactFactors(): Record<string, number> {
    const temp = this.state.temperature;
    const precip = this.state.precipitation;
    
    return {
      agricultureYield: Math.max(0, 1 - Math.abs(temp - 20) / 30 - Math.abs(precip - 2.5) / 5),
      healthRisk: Math.min(1, temp / 40 + this.state.extremeWeatherProbability),
      energyDemand: 1 + temp / 50,
      floodRisk: Math.min(1, this.state.seaLevel / 10),
    };
  }

  /**
   * 应用环境影响到市民
   * @param citizens 市民数组
   * @param seasonSystem 季节系统实例（可选）
   * @param disasterManager 灾害管理器实例（可选）
   */
  public applyEffectsToCitizens(
    citizens: Array<{
      id: string;
      state: { health: number; mood: number; energy: number };
      position: { grid: { x: number; y: number } };
      phenotype?: { adaptability?: { environment: number; stress: number } };
    }>,
    seasonSystem?: SeasonSystem,
    disasterManager?: DisasterManager
  ): Map<string, CitizenEnvironmentState> {
    const results = new Map<string, CitizenEnvironmentState>();

    for (const citizen of citizens) {
      const envState = this.calculateCitizenEnvironmentEffect(
        citizen,
        seasonSystem,
        disasterManager
      );
      results.set(citizen.id, envState);

      this.applyEnvironmentToCitizenState(citizen, envState);
    }

    return results;
  }

  /**
   * 计算单个市民的环境影响
   */
  private calculateCitizenEnvironmentEffect(
    citizen: {
      id: string;
      state: { health: number; mood: number; energy: number };
      position: { grid: { x: number; y: number } };
      phenotype?: { adaptability?: { environment: number; stress: number } };
    },
    seasonSystem?: SeasonSystem,
    disasterManager?: DisasterManager
  ): CitizenEnvironmentState {
    const temp = this.state.temperature;
    const adaptability = citizen.phenotype?.adaptability?.environment || 0.5;
    const stressAdapt = citizen.phenotype?.adaptability?.stress || 0.5;

    let temperatureStress = 0;
    if (temp > 30) {
      temperatureStress = (temp - 30) / 20 * (1 - adaptability);
    } else if (temp < 5) {
      temperatureStress = (5 - temp) / 15 * (1 - adaptability);
    }

    let weatherExposure = 0;
    if (this.state.extremeWeatherProbability > 0.5) {
      weatherExposure = this.state.extremeWeatherProbability * (1 - adaptability);
    }
    if (this.state.precipitation > 5) {
      weatherExposure += (this.state.precipitation - 5) / 10 * 0.2;
    }

    let seasonalAffect = 0;
    if (seasonSystem) {
      const season = seasonSystem.getCurrentSeason();
      const seasonConfig = seasonSystem.getCurrentConfig();
      
      if (season === Season.WINTER) {
        seasonalAffect = 0.1 * (1 - stressAdapt);
      } else if (season === Season.SUMMER && temp > 35) {
        seasonalAffect = 0.05 * (1 - adaptability);
      }
      
      const daylightHours = seasonConfig.daylightHours;
      if (daylightHours < 10) {
        seasonalAffect += (10 - daylightHours) / 5 * 0.05;
      }
    }

    let disasterTrauma = 0;
    if (disasterManager) {
      const disasterEffects = disasterManager.getDisasterEffectsAt(
        citizen.position.grid.x,
        citizen.position.grid.y
      );
      disasterTrauma = disasterEffects.healthDamage * (1 - stressAdapt);
    }

    const adaptationLevel = adaptability * 0.5 + stressAdapt * 0.3 + 
      (citizen.state.health / 100) * 0.2;

    return {
      citizenId: citizen.id,
      temperatureStress,
      weatherExposure,
      seasonalAffect,
      disasterTrauma,
      adaptationLevel,
    };
  }

  /**
   * 应用环境效果到市民状态
   */
  private applyEnvironmentToCitizenState(
    citizen: {
      state: { health: number; mood: number; energy: number };
    },
    envState: CitizenEnvironmentState
  ): void {
    const totalStress = 
      envState.temperatureStress * 0.3 +
      envState.weatherExposure * 0.2 +
      envState.seasonalAffect * 0.2 +
      envState.disasterTrauma * 0.3;

    const effectiveStress = totalStress * (1 - envState.adaptationLevel);

    citizen.state.health = Math.max(0, 
      citizen.state.health - effectiveStress * 10
    );

    citizen.state.mood = Math.max(0, Math.min(100,
      citizen.state.mood - effectiveStress * 15
    ));

    if (envState.temperatureStress > 0.3 || envState.weatherExposure > 0.3) {
      citizen.state.energy = Math.max(0,
        citizen.state.energy - effectiveStress * 5
      );
    }
  }

  /**
   * 获取环境可视化数据
   * @param seasonSystem 季节系统实例（可选）
   * @param disasterManager 灾害管理器实例（可选）
   */
  public getEnvironmentVisualizationData(
    seasonSystem?: SeasonSystem,
    disasterManager?: DisasterManager
  ): EnvironmentVisualizationData {
    const impactFactors = this.getImpactFactors();

    const seasonData = seasonSystem ? {
      current: seasonSystem.getCurrentSeason(),
      name: seasonSystem.getCurrentConfig().name,
      progress: seasonSystem.getState().dayInSeason / seasonSystem.getState().daysPerSeason,
      temperatureMod: seasonSystem.getTemperatureModifier(),
    } : {
      current: Season.SPRING,
      name: '春季',
      progress: 0,
      temperatureMod: 0,
    };

    const disasterData = disasterManager ? {
      active: disasterManager.getActiveDisasters().map(d => ({
        type: d.type,
        name: d.name,
        severity: d.severity,
        location: { x: d.affectedArea.centerX, y: d.affectedArea.centerY },
      })),
      warnings: disasterManager.generateWarnings(this.state).map(w => ({
        type: w.disasterType,
        probability: w.probability,
      })),
    } : {
      active: [],
      warnings: [],
    };

    return {
      season: seasonData,
      climate: {
        temperature: this.state.temperature,
        precipitation: this.state.precipitation,
        extremeWeatherProb: this.state.extremeWeatherProbability,
      },
      disasters: disasterData,
      effects: {
        agricultureMultiplier: seasonSystem ? 
          impactFactors.agricultureYield * seasonSystem.getResourceMultiplier() : 
          impactFactors.agricultureYield,
        healthRisk: impactFactors.healthRisk,
        energyDemand: impactFactors.energyDemand,
      },
    };
  }
}

// 导出单例
export const epidemicSystem = new EpidemicSystem();
export const climateSystem = new ClimateSystem();

/* ==========================================================================
   Task 25: 马克思主义经济学模型
   实现剩余价值、资本积累、阶级矛盾分析
   ========================================================================== */

/** 阶级类型 */
export enum SocialClass {
  PROLETARIAT = 'proletariat',     // 无产阶级
  BOURGEOISIE = 'bourgeoisie',     // 资产阶级
  PETITE_BOURGEOISIE = 'petite_bourgeoisie', // 小资产阶级
  LUMPEN = 'lumpen',               // 流氓无产阶级
}

/** 商品价值结构 */
export interface CommodityValue {
  /** 不变资本（机器、原料） */
  constantCapital: number;
  /** 可变资本（工资） */
  variableCapital: number;
  /** 剩余价值 */
  surplusValue: number;
  /** 总价值 */
  totalValue: number;
}

/** 马克思主义经济状态 */
export interface MarxistEconomicState {
  /** 社会总资本 */
  totalCapital: number;
  /** 有机构成（c/v比率） */
  organicComposition: number;
  /** 剩余价值率 */
  surplusValueRate: number;
  /** 利润率 */
  profitRate: number;
  /** 平均利润率趋向下降趋势 */
  profitRateTendency: number;
  /** 阶级矛盾指数 */
  classContradiction: number;
  /** 无产阶级占比 */
  proletariatRatio: number;
  /** 失业后备军规模 */
  reserveArmySize: number;
  /** 贫困化指数 */
  pauperizationIndex: number;
}

/** 马克思主义经济学模型 */
export class MarxistEconomics {
  private state: MarxistEconomicState;
  private history: MarxistEconomicState[] = [];

  constructor() {
    this.state = {
      totalCapital: 1000000,
      organicComposition: 4, // c/v = 4:1
      surplusValueRate: 1.0, // m/v = 100%
      profitRate: 0.167, // m/(c+v) = 1/6
      profitRateTendency: 0,
      classContradiction: 0.3,
      proletariatRatio: 0.7,
      reserveArmySize: 0.05,
      pauperizationIndex: 0.2,
    };
  }

  /**
   * 计算剩余价值
   * s = 劳动时间 - 必要劳动时间
   */
  public calculateSurplusValue(
    totalLaborHours: number,
    necessaryLaborHours: number
  ): number {
    return totalLaborHours - necessaryLaborHours;
  }

  /**
   * 计算剩余价值率
   * s' = s/v
   */
  public calculateSurplusValueRate(
    surplusValue: number,
    variableCapital: number
  ): number {
    return variableCapital > 0 ? surplusValue / variableCapital : 0;
  }

  /**
   * 计算利润率
   * p' = m/(c+v)
   */
  public calculateProfitRate(
    surplusValue: number,
    constantCapital: number,
    variableCapital: number
  ): number {
    const totalCapital = constantCapital + variableCapital;
    return totalCapital > 0 ? surplusValue / totalCapital : 0;
  }

  /**
   * 更新经济状态
   */
  public update(dt: number, technologyLevel: number, population: number): void {
    // 保存历史
    this.history.push({ ...this.state });
    if (this.history.length > 100) this.history.shift();

    // 有机构成随技术进步提高
    this.state.organicComposition += 0.01 * technologyLevel * dt;

    // 剩余价值率变化
    this.state.surplusValueRate = Math.min(3, 
      this.state.surplusValueRate + 0.005 * dt
    );

    // 利润率计算（平均利润率趋向下降规律）
    const c = this.state.totalCapital * (this.state.organicComposition / (1 + this.state.organicComposition));
    const v = this.state.totalCapital * (1 / (1 + this.state.organicComposition));
    const m = v * this.state.surplusValueRate;
    
    this.state.profitRate = m / (c + v);
    
    // 利润率趋向
    this.state.profitRateTendency = -0.001 * technologyLevel * dt;

    // 失业后备军（产业后备军）
    this.state.reserveArmySize = Math.max(0.02, 
      0.05 + technologyLevel * 0.02 // 技术进步增加失业
    );

    // 相对贫困化
    this.state.pauperizationIndex = Math.min(1,
      this.state.pauperizationIndex + 0.01 * this.state.organicComposition * dt / 10
    );

    // 阶级矛盾
    this.state.classContradiction = Math.min(1,
      0.3 +
      this.state.surplusValueRate * 0.1 +
      this.state.reserveArmySize * 0.5 +
      this.state.pauperizationIndex * 0.3
    );
  }

  /**
   * 获取阶级分析
   */
  public getClassAnalysis(): Record<SocialClass, { ratio: number; income: number }> {
    return {
      [SocialClass.PROLETARIAT]: {
        ratio: this.state.proletariatRatio,
        income: (1 - this.state.surplusValueRate * 0.5) / this.state.proletariatRatio,
      },
      [SocialClass.BOURGEOISIE]: {
        ratio: 0.1,
        income: this.state.surplusValueRate * 5,
      },
      [SocialClass.PETITE_BOURGEOISIE]: {
        ratio: 0.15,
        income: 1.5,
      },
      [SocialClass.LUMPEN]: {
        ratio: 0.05 - this.state.proletariatRatio,
        income: 0.3,
      },
    };
  }

  /**
   * 获取危机风险
   */
  public getCrisisRisk(): {
    probability: number;
    type: string;
    severity: number;
  } {
    const profitCrisis = Math.max(0, 0.1 - this.state.profitRate);
    const overproduction = this.state.reserveArmySize > 0.15 ? 0.3 : 0;
    const classConflict = this.state.classContradiction > 0.6 ? 0.4 : 0;

    const probability = Math.min(1, profitCrisis + overproduction + classConflict);
    
    let type = 'none';
    if (probability > 0.5) {
      type = profitCrisis > 0.3 ? 'profit_crisis' : 
             overproduction > 0 ? 'overproduction' : 'class_conflict';
    }

    return {
      probability,
      type,
      severity: probability * 0.8,
    };
  }

  /**
   * 获取状态
   */
  public getState(): MarxistEconomicState {
    return { ...this.state };
  }
}

export const marxistEconomics = new MarxistEconomics();

/* ==========================================================================
   季节系统
   管理季节循环及其对环境的影响
   ========================================================================== */

/** 季节配置数据 */
const SEASON_CONFIGS: Record<Season, SeasonConfig> = {
  [Season.SPRING]: {
    name: '春季',
    temperatureModifier: 0,
    precipitationModifier: 1.2,
    resourceMultiplier: 1.0,
    diseaseSpreadModifier: 1.1,
    daylightHours: 12,
  },
  [Season.SUMMER]: {
    name: '夏季',
    temperatureModifier: 10,
    precipitationModifier: 0.8,
    resourceMultiplier: 1.3,
    diseaseSpreadModifier: 1.3,
    daylightHours: 14,
  },
  [Season.AUTUMN]: {
    name: '秋季',
    temperatureModifier: -5,
    precipitationModifier: 1.0,
    resourceMultiplier: 1.5,
    diseaseSpreadModifier: 0.9,
    daylightHours: 11,
  },
  [Season.WINTER]: {
    name: '冬季',
    temperatureModifier: -15,
    precipitationModifier: 0.6,
    resourceMultiplier: 0.5,
    diseaseSpreadModifier: 0.7,
    daylightHours: 9,
  },
};

/** 季节系统 */
export class SeasonSystem {
  private state: SeasonState;
  private onSeasonChange?: (newSeason: Season, oldSeason: Season) => void;

  constructor(daysPerSeason: number = 30) {
    this.state = {
      currentSeason: Season.SPRING,
      dayInSeason: 0,
      daysPerSeason,
      yearProgress: 0,
    };
  }

  /**
   * 更新季节
   */
  public update(dt: number): void {
    const daysPassed = dt / (24 * 60 * 60 * 1000);
    this.state.dayInSeason += daysPassed;
    this.state.yearProgress = this.calculateYearProgress();

    if (this.state.dayInSeason >= this.state.daysPerSeason) {
      this.advanceSeason();
    }
  }

  /**
   * 推进到下一个季节
   */
  private advanceSeason(): void {
    const oldSeason = this.state.currentSeason;
    this.state.dayInSeason = 0;

    const seasonOrder = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER];
    const currentIndex = seasonOrder.indexOf(this.state.currentSeason);
    this.state.currentSeason = seasonOrder[(currentIndex + 1) % 4];

    if (this.onSeasonChange) {
      this.onSeasonChange(this.state.currentSeason, oldSeason);
    }
  }

  /**
   * 计算年度进度
   */
  private calculateYearProgress(): number {
    const seasonOrder = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER];
    const seasonIndex = seasonOrder.indexOf(this.state.currentSeason);
    return (seasonIndex + this.state.dayInSeason / this.state.daysPerSeason) / 4;
  }

  /**
   * 获取当前季节配置
   */
  public getCurrentConfig(): SeasonConfig {
    return SEASON_CONFIGS[this.state.currentSeason];
  }

  /**
   * 获取季节状态
   */
  public getState(): SeasonState {
    return { ...this.state };
  }

  /**
   * 获取当前季节
   */
  public getCurrentSeason(): Season {
    return this.state.currentSeason;
  }

  /**
   * 获取季节温度修正
   */
  public getTemperatureModifier(): number {
    const config = this.getCurrentConfig();
    const nextSeasonProgress = this.state.dayInSeason / this.state.daysPerSeason;
    const seasonOrder = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER];
    const nextIndex = (seasonOrder.indexOf(this.state.currentSeason) + 1) % 4;
    const nextConfig = SEASON_CONFIGS[seasonOrder[nextIndex]];

    return config.temperatureModifier * (1 - nextSeasonProgress) +
           nextConfig.temperatureModifier * nextSeasonProgress;
  }

  /**
   * 获取季节降水修正
   */
  public getPrecipitationModifier(): number {
    return this.getCurrentConfig().precipitationModifier;
  }

  /**
   * 获取资源产出倍率
   */
  public getResourceMultiplier(): number {
    return this.getCurrentConfig().resourceMultiplier;
  }

  /**
   * 获取疾病传播修正
   */
  public getDiseaseSpreadModifier(): number {
    return this.getCurrentConfig().diseaseSpreadModifier;
  }

  /**
   * 设置季节变更回调
   */
  public setOnSeasonChange(callback: (newSeason: Season, oldSeason: Season) => void): void {
    this.onSeasonChange = callback;
  }

  /**
   * 强制设置季节（用于测试或特殊事件）
   */
  public setSeason(season: Season): void {
    const oldSeason = this.state.currentSeason;
    this.state.currentSeason = season;
    this.state.dayInSeason = 0;

    if (this.onSeasonChange && oldSeason !== season) {
      this.onSeasonChange(season, oldSeason);
    }
  }
}

/* ==========================================================================
   自然灾害系统
   管理灾害的生成、影响和消退
   ========================================================================== */

/** 灾害名称映射 */
const DISASTER_NAMES: Record<DisasterType, string> = {
  [DisasterType.EARTHQUAKE]: '地震',
  [DisasterType.FLOOD]: '洪水',
  [DisasterType.DROUGHT]: '干旱',
  [DisasterType.STORM]: '暴风',
  [DisasterType.WILDFIRE]: '野火',
  [DisasterType.TSUNAMI]: '海啸',
  [DisasterType.VOLCANO]: '火山爆发',
  [DisasterType.PLAGUE]: '瘟疫',
};

/** 灾害管理器 */
export class DisasterManager {
  private activeDisasters: Map<string, NaturalDisaster> = new Map();
  private disasterHistory: NaturalDisaster[] = [];
  private disasterIdCounter: number = 0;

  constructor() {}

  /**
   * 生成灾害
   */
  public generateDisaster(
    type: DisasterType,
    severity: number,
    location: { x: number; y: number },
    climateState: ClimateState
  ): NaturalDisaster | null {
    const baseProbability = this.calculateDisasterProbability(type, climateState);
    
    if (Math.random() > baseProbability) {
      return null;
    }

    const id = `disaster_${++this.disasterIdCounter}`;
    const radius = this.calculateDisasterRadius(type, severity);
    const duration = this.calculateDisasterDuration(type, severity);
    const effects = this.calculateDisasterEffects(type, severity);

    const disaster: NaturalDisaster = {
      id,
      type,
      name: DISASTER_NAMES[type],
      severity,
      affectedArea: {
        centerX: location.x,
        centerY: location.y,
        radius,
      },
      startTime: Date.now(),
      duration,
      effects,
      isActive: true,
    };

    this.activeDisasters.set(id, disaster);
    return disaster;
  }

  /**
   * 计算灾害发生概率
   */
  private calculateDisasterProbability(type: DisasterType, climate: ClimateState): number {
    let probability = 0.05;

    switch (type) {
      case DisasterType.FLOOD:
        probability += climate.precipitation * 0.1;
        probability += climate.extremeWeatherProbability * 0.3;
        break;
      case DisasterType.DROUGHT:
        probability += Math.max(0, (3 - climate.precipitation)) * 0.05;
        probability += Math.max(0, climate.temperature - 20) * 0.02;
        break;
      case DisasterType.STORM:
        probability += climate.extremeWeatherProbability * 0.5;
        break;
      case DisasterType.WILDFIRE:
        probability += Math.max(0, climate.temperature - 25) * 0.03;
        probability += Math.max(0, 2 - climate.precipitation) * 0.1;
        break;
      case DisasterType.EARTHQUAKE:
        probability = 0.02;
        break;
      case DisasterType.TSUNAMI:
        probability = 0.01 + climate.seaLevel * 0.005;
        break;
      case DisasterType.VOLCANO:
        probability = 0.005;
        break;
      case DisasterType.PLAGUE:
        probability = 0.03 + climate.extremeWeatherProbability * 0.1;
        break;
    }

    return Math.min(0.8, probability);
  }

  /**
   * 计算灾害影响半径
   */
  private calculateDisasterRadius(type: DisasterType, severity: number): number {
    const baseRadius: Record<DisasterType, number> = {
      [DisasterType.EARTHQUAKE]: 50,
      [DisasterType.FLOOD]: 30,
      [DisasterType.DROUGHT]: 100,
      [DisasterType.STORM]: 40,
      [DisasterType.WILDFIRE]: 20,
      [DisasterType.TSUNAMI]: 60,
      [DisasterType.VOLCANO]: 80,
      [DisasterType.PLAGUE]: 200,
    };

    return baseRadius[type] * (0.5 + severity);
  }

  /**
   * 计算灾害持续时间
   */
  private calculateDisasterDuration(type: DisasterType, severity: number): number {
    const baseDuration: Record<DisasterType, number> = {
      [DisasterType.EARTHQUAKE]: 1,
      [DisasterType.FLOOD]: 7,
      [DisasterType.DROUGHT]: 30,
      [DisasterType.STORM]: 3,
      [DisasterType.WILDFIRE]: 5,
      [DisasterType.TSUNAMI]: 1,
      [DisasterType.VOLCANO]: 14,
      [DisasterType.PLAGUE]: 60,
    };

    return baseDuration[type] * (0.5 + severity * 0.5) * 24 * 60 * 60 * 1000;
  }

  /**
   * 计算灾害效果
   */
  private calculateDisasterEffects(type: DisasterType, severity: number): DisasterEffects {
    const baseEffects: Record<DisasterType, DisasterEffects> = {
      [DisasterType.EARTHQUAKE]: {
        healthDamage: 0.3,
        resourceLoss: 0.2,
        buildingDamage: 0.5,
        populationDisplacement: 0.3,
        economicImpact: 0.4,
        environmentalDamage: 0.1,
      },
      [DisasterType.FLOOD]: {
        healthDamage: 0.1,
        resourceLoss: 0.4,
        buildingDamage: 0.3,
        populationDisplacement: 0.5,
        economicImpact: 0.3,
        environmentalDamage: 0.2,
      },
      [DisasterType.DROUGHT]: {
        healthDamage: 0.05,
        resourceLoss: 0.6,
        buildingDamage: 0.0,
        populationDisplacement: 0.2,
        economicImpact: 0.5,
        environmentalDamage: 0.4,
      },
      [DisasterType.STORM]: {
        healthDamage: 0.1,
        resourceLoss: 0.2,
        buildingDamage: 0.3,
        populationDisplacement: 0.2,
        economicImpact: 0.2,
        environmentalDamage: 0.15,
      },
      [DisasterType.WILDFIRE]: {
        healthDamage: 0.15,
        resourceLoss: 0.5,
        buildingDamage: 0.4,
        populationDisplacement: 0.4,
        economicImpact: 0.3,
        environmentalDamage: 0.6,
      },
      [DisasterType.TSUNAMI]: {
        healthDamage: 0.4,
        resourceLoss: 0.5,
        buildingDamage: 0.6,
        populationDisplacement: 0.6,
        economicImpact: 0.5,
        environmentalDamage: 0.3,
      },
      [DisasterType.VOLCANO]: {
        healthDamage: 0.35,
        resourceLoss: 0.4,
        buildingDamage: 0.5,
        populationDisplacement: 0.5,
        economicImpact: 0.4,
        environmentalDamage: 0.5,
      },
      [DisasterType.PLAGUE]: {
        healthDamage: 0.5,
        resourceLoss: 0.1,
        buildingDamage: 0.0,
        populationDisplacement: 0.1,
        economicImpact: 0.3,
        environmentalDamage: 0.0,
      },
    };

    const effects = baseEffects[type];
    return {
      healthDamage: effects.healthDamage * severity,
      resourceLoss: effects.resourceLoss * severity,
      buildingDamage: effects.buildingDamage * severity,
      populationDisplacement: effects.populationDisplacement * severity,
      economicImpact: effects.economicImpact * severity,
      environmentalDamage: effects.environmentalDamage * severity,
    };
  }

  /**
   * 更新灾害状态
   */
  public update(dt: number): void {
    const now = Date.now();

    for (const [id, disaster] of this.activeDisasters) {
      if (now - disaster.startTime >= disaster.duration) {
        disaster.isActive = false;
        this.disasterHistory.push(disaster);
        this.activeDisasters.delete(id);
      }
    }
  }

  /**
   * 获取活跃灾害
   */
  public getActiveDisasters(): NaturalDisaster[] {
    return Array.from(this.activeDisasters.values());
  }

  /**
   * 获取指定位置的灾害影响
   */
  public getDisasterEffectsAt(x: number, y: number): DisasterEffects {
    const combinedEffects: DisasterEffects = {
      healthDamage: 0,
      resourceLoss: 0,
      buildingDamage: 0,
      populationDisplacement: 0,
      economicImpact: 0,
      environmentalDamage: 0,
    };

    for (const disaster of this.activeDisasters.values()) {
      if (!disaster.isActive) continue;

      const distance = Math.sqrt(
        Math.pow(x - disaster.affectedArea.centerX, 2) +
        Math.pow(y - disaster.affectedArea.centerY, 2)
      );

      if (distance <= disaster.affectedArea.radius) {
        const distanceFactor = 1 - (distance / disaster.affectedArea.radius);
        
        combinedEffects.healthDamage += disaster.effects.healthDamage * distanceFactor;
        combinedEffects.resourceLoss += disaster.effects.resourceLoss * distanceFactor;
        combinedEffects.buildingDamage += disaster.effects.buildingDamage * distanceFactor;
        combinedEffects.populationDisplacement += disaster.effects.populationDisplacement * distanceFactor;
        combinedEffects.economicImpact += disaster.effects.economicImpact * distanceFactor;
        combinedEffects.environmentalDamage += disaster.effects.environmentalDamage * distanceFactor;
      }
    }

    return combinedEffects;
  }

  /**
   * 生成灾害预警
   */
  public generateWarnings(climateState: ClimateState): DisasterWarning[] {
    const warnings: DisasterWarning[] = [];

    for (const type of Object.values(DisasterType)) {
      const probability = this.calculateDisasterProbability(type, climateState);
      
      if (probability > 0.2) {
        warnings.push({
          disasterType: type,
          probability,
          estimatedTime: Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000,
          affectedArea: this.predictAffectedArea(type),
          severity: probability,
        });
      }
    }

    return warnings.sort((a, b) => b.probability - a.probability);
  }

  /**
   * 预测灾害影响区域
   */
  private predictAffectedArea(type: DisasterType): string[] {
    const areas: Record<DisasterType, string[]> = {
      [DisasterType.EARTHQUAKE]: ['地震带区域', '山区', '沿海城市'],
      [DisasterType.FLOOD]: ['河流沿岸', '低洼地区', '沿海平原'],
      [DisasterType.DROUGHT]: ['内陆地区', '农业区', '草原'],
      [DisasterType.STORM]: ['沿海地区', '平原', '高地'],
      [DisasterType.WILDFIRE]: ['森林区', '干旱地区', '草原'],
      [DisasterType.TSUNAMI]: ['沿海城市', '岛屿', '低海拔海岸'],
      [DisasterType.VOLCANO]: ['火山周边', '下风向区域', '山谷'],
      [DisasterType.PLAGUE]: ['人口密集区', '交通枢纽', '边境地区'],
    };

    return areas[type];
  }

  /**
   * 获取灾害历史
   */
  public getHistory(): NaturalDisaster[] {
    return [...this.disasterHistory];
  }

  /**
   * 清除灾害历史
   */
  public clearHistory(): void {
    this.disasterHistory = [];
  }
}

export const seasonSystem = new SeasonSystem();
export const disasterManager = new DisasterManager();
export default { epidemicSystem, climateSystem, marxistEconomics, seasonSystem, disasterManager };
