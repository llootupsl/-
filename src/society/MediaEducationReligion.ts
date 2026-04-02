/**
 * =============================================================================
 * 永夜熵纪 - 媒体、教育与宗教系统
 * Media, Education and Religion System
 * =============================================================================
 */

/** 新闻文章 */
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  authorId: string;
  timestamp: number;
  sentiment: number;
  views: number;
  shares: number;
  relatedEvents: string[];
}

/** 媒体合约 */
export interface MediaContract {
  id: string;
  ownerId: string;
  name: string;
  subscribers: string[];
  articles: string[];
  reputation: number;
}

/** 学校合约 */
export interface SchoolContract {
  id: string;
  ownerId: string;
  name: string;
  teachers: string[];
  students: string[];
  knowledgeLevel: number;
  educationCapacity: number;
  tuitionFee: number;
}

/** 宗教 */
export interface Religion {
  id: string;
  founderId: string;
  name: string;
  description: string;
  values: ReligiousValue[];
  doctrines: string[];
  rituals: string[];
  followers: string[];
  influence: number;
  /** 文化基因 */
  memeCode: string;
}

/** 宗教价值观 */
export interface ReligiousValue {
  name: string;
  weight: number;
  description: string;
}

/** 媒体影响结果 */
export interface MediaInfluenceResult {
  citizenId: string;
  decisionType: string;
  influenceValue: number;
  sentimentBias: number;
  confidenceLevel: number;
  sources: string[];
}

/** 新闻传播状态 */
export interface NewsPropagationState {
  newsId: string;
  reachedCitizens: Set<string>;
  propagationDepth: number;
  viralCoefficient: number;
  timestamp: number;
}

/** 教育影响结果 */
export interface EducationInfluenceResult {
  citizenId: string;
  skillType: string;
  learningSpeedModifier: number;
  knowledgeGain: number;
  educationQuality: number;
}

/** 知识传递结果 */
export interface KnowledgeTransferResult {
  parentId: string;
  childId: string;
  transferredKnowledge: number;
  retainedKnowledge: number;
  generation: number;
}

/** 宗教影响结果 */
export interface ReligiousInfluenceResult {
  citizenId: string;
  decisionContext: string;
  moralGuidance: number;
  valueAlignment: Map<string, number>;
  communityPressure: number;
}

/** 宗教仪式结果 */
export interface RitualResult {
  religionId: string;
  participantIds: string[];
  faithBoost: number;
  communityCohesion: number;
  influenceSpread: number;
  duration: number;
}

/** 社会影响上下文 */
export interface SocialInfluenceContext {
  decisionType: 'voting' | 'economic' | 'social' | 'religious' | 'political';
  urgency: number;
  publicVisibility: number;
  timePressure: number;
}

/** 综合社会影响结果 */
export interface TotalSocialInfluenceResult {
  citizenId: string;
  mediaInfluence: number;
  educationInfluence: number;
  religiousInfluence: number;
  totalInfluence: number;
  dominantFactor: 'media' | 'education' | 'religion' | 'none';
  confidence: number;
  breakdown: {
    media: MediaInfluenceResult | null;
    education: EducationInfluenceResult | null;
    religion: ReligiousInfluenceResult | null;
  };
}

/** 技能类型 */
export type SkillType = 
  | 'agriculture' 
  | 'craftsmanship' 
  | 'scholarship' 
  | 'military' 
  | 'commerce' 
  | 'politics' 
  | 'arts' 
  | 'science';

/** 决策类型 */
export type DecisionType = 
  | 'voting_policy' 
  | 'voting_leader' 
  | 'economic_trade' 
  | 'social_interaction' 
  | 'religious_practice'
  | 'political_alliance';

/** 媒体系统 */
export class MediaSystem {
  private newspapers: Map<string, MediaContract> = new Map();
  private articles: Map<string, NewsArticle> = new Map();
  private headlines: NewsArticle[] = [];
  private socialGraph: Map<string, Set<string>> = new Map(); // 关注关系

  constructor() {}

  /**
   * 创建报社
   */
  public createNewspaper(ownerId: string, name: string): MediaContract {
    const contract: MediaContract = {
      id: crypto.randomUUID(),
      ownerId,
      name,
      subscribers: [],
      articles: [],
      reputation: 50,
    };
    this.newspapers.set(contract.id, contract);
    return contract;
  }

  /**
   * 发布新闻
   */
  public publishArticle(
    newspaperId: string,
    authorId: string,
    title: string,
    content: string,
    relatedEvents: string[] = []
  ): NewsArticle {
    const newspaper = this.newspapers.get(newspaperId);
    if (!newspaper) throw new Error('Newspaper not found');

    const sentiment = this.analyzeSentiment(content);

    const article: NewsArticle = {
      id: crypto.randomUUID(),
      title,
      content,
      authorId,
      timestamp: Date.now(),
      sentiment,
      views: 0,
      shares: 0,
      relatedEvents,
    };

    this.articles.set(article.id, article);
    newspaper.articles.push(article.id);
    this.updateHeadlines(article);

    return article;
  }

  /**
   * 分析情感
   */
  private analyzeSentiment(content: string): number {
    const positiveWords = ['和平', '繁荣', '幸福', '希望', '发展', '进步', '成功', '富强'];
    const negativeWords = ['战争', '灾难', '瘟疫', '死亡', '危机', '崩溃', '衰退', '痛苦'];

    let score = 0;
    for (const word of positiveWords) {
      if (content.includes(word)) score += 0.1;
    }
    for (const word of negativeWords) {
      if (content.includes(word)) score -= 0.1;
    }
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * 更新头条
   */
  private updateHeadlines(article: NewsArticle): void {
    this.headlines.unshift(article);
    if (this.headlines.length > 10) {
      this.headlines.pop();
    }
  }

  /**
   * 关注市民
   */
  public follow(followerId: string, targetId: string): void {
    if (!this.socialGraph.has(followerId)) {
      this.socialGraph.set(followerId, new Set());
    }
    this.socialGraph.get(followerId)!.add(targetId);
  }

  /**
   * 取消关注
   */
  public unfollow(followerId: string, targetId: string): void {
    this.socialGraph.get(followerId)?.delete(targetId);
  }

  /**
   * 获取关注列表
   */
  public getFollowing(userId: string): string[] {
    return Array.from(this.socialGraph.get(userId) || []);
  }

  /**
   * 获取头条
   */
  public getHeadlines(): NewsArticle[] {
    return [...this.headlines];
  }

  /**
   * 获取报纸
   */
  public getNewspaper(id: string): MediaContract | undefined {
    return this.newspapers.get(id);
  }

  /**
   * 舆论对投票的影响
   */
  public getSentimentImpact(newspaperId: string): number {
    const newspaper = this.newspapers.get(newspaperId);
    if (!newspaper) return 0;

    let totalSentiment = 0;
    let count = 0;

    for (const articleId of newspaper.articles.slice(-10)) {
      const article = this.articles.get(articleId);
      if (article) {
        totalSentiment += article.sentiment;
        count++;
      }
    }

    return count > 0 ? totalSentiment / count : 0;
  }

  private propagationStates: Map<string, NewsPropagationState> = new Map();
  private citizenExposure: Map<string, Set<string>> = new Map();
  private citizenMediaTrust: Map<string, number> = new Map();

  public applyMediaInfluenceToCitizen(
    citizenId: string,
    decisionType: DecisionType
  ): MediaInfluenceResult {
    const exposure = this.citizenExposure.get(citizenId) || new Set<string>();
    const trustLevel = this.citizenMediaTrust.get(citizenId) || 50;
    const following = this.getFollowing(citizenId);
    
    let totalInfluence = 0;
    let sentimentBias = 0;
    const sources: string[] = [];
    
    for (const articleId of Array.from(exposure)) {
      const article = this.articles.get(articleId);
      if (!article) continue;
      
      const newspaper = this.findNewspaperByArticle(articleId);
      if (!newspaper) continue;
      
      const relevanceFactor = this.calculateRelevanceFactor(article, decisionType);
      const trustFactor = trustLevel / 100;
      const recencyFactor = this.calculateRecencyFactor(article.timestamp);
      const viralFactor = Math.log10(article.shares + 1) / 3;
      
      const influence = article.sentiment * relevanceFactor * trustFactor * recencyFactor * (1 + viralFactor);
      totalInfluence += influence;
      sentimentBias += article.sentiment * trustFactor;
      
      if (newspaper) {
        sources.push(newspaper.name);
      }
    }
    
    const peerInfluence = this.calculatePeerMediaInfluence(citizenId, following, decisionType);
    totalInfluence += peerInfluence * 0.3;
    
    const confidenceLevel = Math.min(1, exposure.size / 10 + trustLevel / 200);
    
    return {
      citizenId,
      decisionType,
      influenceValue: Math.max(-1, Math.min(1, totalInfluence)),
      sentimentBias: Math.max(-1, Math.min(1, sentimentBias)),
      confidenceLevel,
      sources: Array.from(new Set(sources)).slice(0, 5)
    };
  }

  private findNewspaperByArticle(articleId: string): MediaContract | undefined {
    for (const newspaper of Array.from(this.newspapers.values())) {
      if (newspaper.articles.includes(articleId)) {
        return newspaper;
      }
    }
    return undefined;
  }

  private calculateRelevanceFactor(article: NewsArticle, decisionType: DecisionType): number {
    const keywordMappings: Record<DecisionType, string[]> = {
      voting_policy: ['政策', '法律', '改革', '税收', '福利'],
      voting_leader: ['选举', '领导', '候选人', '投票', '执政'],
      economic_trade: ['经济', '贸易', '市场', '商业', '金融'],
      social_interaction: ['社会', '社区', '民生', '教育', '医疗'],
      religious_practice: ['宗教', '信仰', '仪式', '传统', '文化'],
      political_alliance: ['联盟', '合作', '外交', '条约', '组织']
    };
    
    const keywords = keywordMappings[decisionType] || [];
    let relevance = 0.5;
    
    for (const keyword of keywords) {
      if (article.title.includes(keyword) || article.content.includes(keyword)) {
        relevance += 0.1;
      }
    }
    
    return Math.min(1, relevance);
  }

  private calculateRecencyFactor(timestamp: number): number {
    const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    return Math.exp(-ageInHours / 24);
  }

  private calculatePeerMediaInfluence(
    citizenId: string,
    following: string[],
    decisionType: DecisionType
  ): number {
    if (following.length === 0) return 0;
    
    let peerInfluence = 0;
    for (const peerId of following) {
      const peerExposure = this.citizenExposure.get(peerId) || new Set();
      for (const articleId of Array.from(peerExposure)) {
        const article = this.articles.get(articleId);
        if (article) {
          const relevance = this.calculateRelevanceFactor(article, decisionType);
          peerInfluence += article.sentiment * relevance * 0.1;
        }
      }
    }
    
    return peerInfluence / following.length;
  }

  public propagateNews(newsId: string, citizenIds: string[]): NewsPropagationState {
    const article = this.articles.get(newsId);
    if (!article) {
      throw new Error(`Article ${newsId} not found`);
    }
    
    let state = this.propagationStates.get(newsId);
    if (!state) {
      state = {
        newsId,
        reachedCitizens: new Set(),
        propagationDepth: 0,
        viralCoefficient: this.calculateViralCoefficient(article),
        timestamp: Date.now()
      };
      this.propagationStates.set(newsId, state);
    }
    
    const newlyReached: string[] = [];
    
    for (const citizenId of citizenIds) {
      if (!state.reachedCitizens.has(citizenId)) {
        state.reachedCitizens.add(citizenId);
        newlyReached.push(citizenId);
        
        if (!this.citizenExposure.has(citizenId)) {
          this.citizenExposure.set(citizenId, new Set());
        }
        this.citizenExposure.get(citizenId)!.add(newsId);
        
        article.views++;
      }
    }
    
    state.propagationDepth++;
    
    const secondaryPropagation = this.calculateSecondaryPropagation(
      newlyReached,
      state.viralCoefficient,
      state.propagationDepth
    );
    
    if (secondaryPropagation.length > 0 && state.propagationDepth < 5) {
      setTimeout(() => {
        this.propagateNews(newsId, secondaryPropagation);
      }, 1000);
    }
    
    return state;
  }

  private calculateViralCoefficient(article: NewsArticle): number {
    const sentimentIntensity = Math.abs(article.sentiment);
    const baseViral = 1.2;
    const sentimentBonus = sentimentIntensity * 0.5;
    const shareBonus = Math.log10(article.shares + 1) * 0.1;
    
    return baseViral + sentimentBonus + shareBonus;
  }

  private calculateSecondaryPropagation(
    newlyReached: string[],
    viralCoefficient: number,
    depth: number
  ): string[] {
    const secondaryTargets: string[] = [];
    const depthDecay = Math.pow(0.7, depth);
    
    for (const citizenId of newlyReached) {
      const following = this.getFollowing(citizenId);
      const propagationChance = viralCoefficient * depthDecay;
      
      for (const peerId of following) {
        if (Math.random() < propagationChance) {
          secondaryTargets.push(peerId);
        }
      }
    }
    
    return Array.from(new Set(secondaryTargets));
  }

  public setCitizenMediaTrust(citizenId: string, trustLevel: number): void {
    this.citizenMediaTrust.set(citizenId, Math.max(0, Math.min(100, trustLevel)));
  }

  public getCitizenMediaTrust(citizenId: string): number {
    return this.citizenMediaTrust.get(citizenId) || 50;
  }

  public getPropagationState(newsId: string): NewsPropagationState | undefined {
    return this.propagationStates.get(newsId);
  }

  public getCitizenExposure(citizenId: string): string[] {
    return Array.from(this.citizenExposure.get(citizenId) || []);
  }
}

/** 教育系统 */
export class EducationSystem {
  private schools: Map<string, SchoolContract> = new Map();
  private citizenKnowledge: Map<string, number> = new Map();

  constructor() {}

  /**
   * 创建学校
   */
  public createSchool(
    ownerId: string,
    name: string,
    capacity: number = 100,
    tuitionFee: number = 10
  ): SchoolContract {
    const school: SchoolContract = {
      id: crypto.randomUUID(),
      ownerId,
      name,
      teachers: [],
      students: [],
      knowledgeLevel: 50,
      educationCapacity: capacity,
      tuitionFee,
    };
    this.schools.set(school.id, school);
    return school;
  }

  /**
   * 雇佣教师
   */
  public hireTeacher(schoolId: string, teacherId: string): boolean {
    const school = this.schools.get(schoolId);
    if (!school) return false;
    if (!school.teachers.includes(teacherId)) {
      school.teachers.push(teacherId);
      school.knowledgeLevel = Math.min(100, school.knowledgeLevel + 5);
    }
    return true;
  }

  /**
   * 招收学生
   */
  public enrollStudent(schoolId: string, studentId: string): boolean {
    const school = this.schools.get(schoolId);
    if (!school) return false;
    if (school.students.length >= school.educationCapacity) return false;
    if (!school.students.includes(studentId)) {
      school.students.push(studentId);
    }
    return true;
  }

  /**
   * 联邦学习 - 分享梯度
   */
  public shareGradients(schoolId: string): number[] {
    const school = this.schools.get(schoolId);
    if (!school || school.students.length === 0) {
      return [];
    }

    // 模拟梯度聚合
    const gradientSize = 100;
    const aggregatedGradient = new Array(gradientSize).fill(0);

    for (const studentId of school.students) {
      const studentKnowledge = this.citizenKnowledge.get(studentId) || 0;
      for (let i = 0; i < gradientSize; i++) {
        aggregatedGradient[i] += (Math.random() - 0.5) * studentKnowledge / school.students.length;
      }
    }

    return aggregatedGradient;
  }

  /**
   * 更新知识
   */
  public updateKnowledge(citizenId: string, delta: number): void {
    const current = this.citizenKnowledge.get(citizenId) || 0;
    this.citizenKnowledge.set(citizenId, Math.max(0, Math.min(100, current + delta)));
  }

  /**
   * 获取市民知识水平
   */
  public getKnowledgeLevel(citizenId: string): number {
    return this.citizenKnowledge.get(citizenId) || 0;
  }

  /**
   * 获取所有学校
   */
  public getAllSchools(): SchoolContract[] {
    return Array.from(this.schools.values());
  }

  private citizenSkills: Map<string, Map<SkillType, number>> = new Map();
  private citizenEducationLevel: Map<string, number> = new Map();
  private familyKnowledge: Map<string, Map<SkillType, number>> = new Map();
  private learningProgress: Map<string, Map<SkillType, number[]>> = new Map();

  public applyEducationInfluence(
    citizenId: string,
    skillType: SkillType
  ): EducationInfluenceResult {
    const educationLevel = this.citizenEducationLevel.get(citizenId) || 0;
    const currentSkillLevel = this.getSkillLevel(citizenId, skillType);
    const enrolledSchools = this.getEnrolledSchools(citizenId);
    
    let learningSpeedModifier = 1.0;
    let educationQuality = 0;
    
    for (const school of enrolledSchools) {
      const schoolQuality = this.calculateSchoolQuality(school);
      educationQuality += schoolQuality;
      
      const teacherBonus = school.teachers.length * 0.05;
      const facilityBonus = school.knowledgeLevel / 100;
      const peerBonus = this.calculatePeerLearningBonus(school, citizenId, skillType);
      
      learningSpeedModifier += (teacherBonus + facilityBonus + peerBonus) / enrolledSchools.length;
    }
    
    const baseLearningRate = 0.1;
    const educationBonus = educationLevel / 100 * 0.5;
    const aptitudeBonus = this.calculateAptitudeBonus(citizenId, skillType);
    
    const knowledgeGain = baseLearningRate * learningSpeedModifier * (1 + educationBonus + aptitudeBonus);
    
    this.updateSkillProgress(citizenId, skillType, knowledgeGain);
    
    return {
      citizenId,
      skillType,
      learningSpeedModifier,
      knowledgeGain,
      educationQuality: educationQuality / Math.max(1, enrolledSchools.length)
    };
  }

  private getSkillLevel(citizenId: string, skillType: SkillType): number {
    if (!this.citizenSkills.has(citizenId)) {
      this.citizenSkills.set(citizenId, new Map());
    }
    return this.citizenSkills.get(citizenId)!.get(skillType) || 0;
  }

  private getEnrolledSchools(citizenId: string): SchoolContract[] {
    return Array.from(this.schools.values()).filter(school => 
      school.students.includes(citizenId)
    );
  }

  private calculateSchoolQuality(school: SchoolContract): number {
    const teacherQuality = school.teachers.length * 5;
    const knowledgeQuality = school.knowledgeLevel;
    const capacityRatio = school.students.length / school.educationCapacity;
    const overcrowdingPenalty = Math.max(0, capacityRatio - 0.8) * 20;
    
    return Math.max(0, Math.min(100, 
      (teacherQuality + knowledgeQuality) / 2 - overcrowdingPenalty
    ));
  }

  private calculatePeerLearningBonus(
    school: SchoolContract,
    citizenId: string,
    skillType: SkillType
  ): number {
    const peers = school.students.filter(id => id !== citizenId);
    if (peers.length === 0) return 0;
    
    let totalPeerSkill = 0;
    for (const peerId of peers) {
      totalPeerSkill += this.getSkillLevel(peerId, skillType);
    }
    
    const avgPeerSkill = totalPeerSkill / peers.length;
    return avgPeerSkill / 200;
  }

  private calculateAptitudeBonus(citizenId: string, skillType: SkillType): number {
    const baseAptitude = 0.1;
    const familyKnowledge = this.getFamilyKnowledge(citizenId, skillType);
    const randomFactor = (Math.random() - 0.5) * 0.2;
    
    return baseAptitude + familyKnowledge * 0.01 + randomFactor;
  }

  private getFamilyKnowledge(citizenId: string, skillType: SkillType): number {
    if (!this.familyKnowledge.has(citizenId)) {
      this.familyKnowledge.set(citizenId, new Map());
    }
    return this.familyKnowledge.get(citizenId)!.get(skillType) || 0;
  }

  private updateSkillProgress(citizenId: string, skillType: SkillType, gain: number): void {
    if (!this.citizenSkills.has(citizenId)) {
      this.citizenSkills.set(citizenId, new Map());
    }
    
    const currentLevel = this.getSkillLevel(citizenId, skillType);
    const newLevel = Math.min(100, currentLevel + gain);
    this.citizenSkills.get(citizenId)!.set(skillType, newLevel);
    
    if (!this.learningProgress.has(citizenId)) {
      this.learningProgress.set(citizenId, new Map());
    }
    if (!this.learningProgress.get(citizenId)!.has(skillType)) {
      this.learningProgress.get(citizenId)!.set(skillType, []);
    }
    this.learningProgress.get(citizenId)!.get(skillType)!.push(gain);
  }

  public transferKnowledge(parentId: string, childId: string): KnowledgeTransferResult {
    const parentSkills = this.citizenSkills.get(parentId) || new Map();
    const parentEducationLevel = this.citizenEducationLevel.get(parentId) || 0;
    
    let transferredKnowledge = 0;
    const generation = this.determineGeneration(parentId, childId);
    const transferEfficiency = Math.pow(0.8, generation - 1);
    
    if (!this.familyKnowledge.has(childId)) {
      this.familyKnowledge.set(childId, new Map());
    }
    
    for (const [skillType, parentLevel] of Array.from(parentSkills)) {
      const baseTransfer = parentLevel * 0.3;
      const educationBonus = parentEducationLevel / 100 * 0.2;
      const transferAmount = baseTransfer * (1 + educationBonus) * transferEfficiency;
      
      const currentFamilyKnowledge = this.getFamilyKnowledge(childId, skillType);
      this.familyKnowledge.get(childId)!.set(skillType, currentFamilyKnowledge + transferAmount);
      
      transferredKnowledge += transferAmount;
    }
    
    const retainedKnowledge = transferredKnowledge * 0.9;
    
    this.citizenEducationLevel.set(childId, 
      Math.min(100, (this.citizenEducationLevel.get(childId) || 0) + parentEducationLevel * 0.2)
    );
    
    return {
      parentId,
      childId,
      transferredKnowledge,
      retainedKnowledge,
      generation
    };
  }

  private determineGeneration(parentId: string, childId: string): number {
    return 1;
  }

  public setCitizenEducationLevel(citizenId: string, level: number): void {
    this.citizenEducationLevel.set(citizenId, Math.max(0, Math.min(100, level)));
  }

  public getCitizenEducationLevel(citizenId: string): number {
    return this.citizenEducationLevel.get(citizenId) || 0;
  }

  public getCitizenSkills(citizenId: string): Map<SkillType, number> {
    return this.citizenSkills.get(citizenId) || new Map();
  }

  public getLearningHistory(citizenId: string, skillType: SkillType): number[] {
    if (!this.learningProgress.has(citizenId)) return [];
    return this.learningProgress.get(citizenId)!.get(skillType) || [];
  }
}

/** 宗教系统 */
export class ReligionSystem {
  private religions: Map<string, Religion> = new Map();
  private citizenReligions: Map<string, string> = new Map(); // 市民 -> 宗教ID

  constructor() {}

  /**
   * 创建宗教
   */
  public createReligion(
    founderId: string,
    name: string,
    description: string,
    values: Omit<ReligiousValue, 'weight'>[]
  ): Religion {
    // 归一化权重
    const totalWeight = values.reduce((sum, v) => sum + 1, 0);
    const normalizedValues = values.map(v => ({
      ...v,
      weight: 1 / totalWeight,
    }));

    const religion: Religion = {
      id: crypto.randomUUID(),
      founderId,
      name,
      description,
      values: normalizedValues,
      doctrines: [],
      rituals: [],
      followers: [founderId],
      influence: 10,
      memeCode: this.generateMemeCode(),
    };

    this.religions.set(religion.id, religion);
    this.citizenReligions.set(founderId, religion.id);

    return religion;
  }

  /**
   * 生成文化基因代码
   */
  private generateMemeCode(): string {
    // 简化的"基因代码"用于文化传播
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 64; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * 皈依
   */
  public convert(citizenId: string, religionId: string): void {
    // 离开原有宗教
    const currentReligionId = this.citizenReligions.get(citizenId);
    if (currentReligionId) {
      const currentReligion = this.religions.get(currentReligionId);
      if (currentReligion) {
        currentReligion.followers = currentReligion.followers.filter(id => id !== citizenId);
        currentReligion.influence -= 1;
      }
    }

    // 加入新宗教
    const religion = this.religions.get(religionId);
    if (religion) {
      if (!religion.followers.includes(citizenId)) {
        religion.followers.push(citizenId);
        religion.influence += 1;
      }
      this.citizenReligions.set(citizenId, religionId);
    }
  }

  /**
   * 文化基因传播
   */
  public memePropagation(sourceReligionId: string, targetReligionId: string): boolean {
    const source = this.religions.get(sourceReligionId);
    const target = this.religions.get(targetReligionId);
    if (!source || !target) return false;

    // 随机发生文化融合
    if (Math.random() < source.influence / 100) {
      // 混合价值观
      const mixedValues = [...target.values];
      for (const value of source.values.slice(0, 2)) {
        const existing = mixedValues.find(v => v.name === value.name);
        if (existing) {
          existing.weight += value.weight * 0.2;
        } else {
          mixedValues.push({ ...value, weight: value.weight * 0.2 });
        }
      }
      target.values = mixedValues;
      target.influence += source.influence * 0.1;
      return true;
    }
    return false;
  }

  /**
   * 获取宗教对决策的影响
   */
  public getReligiousInfluence(citizenId: string, decisionType: string): number {
    const religionId = this.citizenReligions.get(citizenId);
    if (!religionId) return 0;

    const religion = this.religions.get(religionId);
    if (!religion) return 0;

    // 根据决策类型和宗教价值观计算影响
    const relevantValue = religion.values.find(v => 
      decisionType.includes(v.name) || v.name.includes(decisionType)
    );

    return relevantValue ? relevantValue.weight * religion.influence / 100 : 0;
  }

  /**
   * 获取市民的宗教
   */
  public getCitizenReligion(citizenId: string): Religion | null {
    const religionId = this.citizenReligions.get(citizenId);
    if (!religionId) return null;
    return this.religions.get(religionId) || null;
  }

  /**
   * 宗教冲突检测
   */
  public detectConflict(religionId1: string, religionId2: string): boolean {
    const r1 = this.religions.get(religionId1);
    const r2 = this.religions.get(religionId2);
    if (!r1 || !r2) return false;

    // 检测价值观冲突
    for (const v1 of r1.values) {
      for (const v2 of r2.values) {
        if (v1.name === v2.name && Math.abs(v1.weight - v2.weight) > 0.5) {
          return true;
        }
      }
    }
    return false;
  }

  private citizenFaith: Map<string, number> = new Map();
  private ritualHistory: Map<string, RitualResult[]> = new Map();
  private religiousCommunityPressure: Map<string, number> = new Map();

  public applyReligiousInfluence(
    citizenId: string,
    decisionContext: string
  ): ReligiousInfluenceResult {
    const religion = this.getCitizenReligion(citizenId);
    const faithLevel = this.citizenFaith.get(citizenId) || 0;
    const communityPressure = this.religiousCommunityPressure.get(citizenId) || 0;
    
    const valueAlignment = new Map<string, number>();
    let moralGuidance = 0;
    
    if (religion) {
      for (const value of religion.values) {
        const alignment = this.calculateValueAlignment(value, decisionContext, faithLevel);
        valueAlignment.set(value.name, alignment);
        moralGuidance += alignment * value.weight;
      }
      
      const doctrineInfluence = this.applyDoctrineInfluence(religion, decisionContext);
      moralGuidance += doctrineInfluence * 0.3;
      
      const peerReligiousInfluence = this.calculatePeerReligiousInfluence(citizenId, religion.id);
      moralGuidance += peerReligiousInfluence * 0.2;
    }
    
    moralGuidance = moralGuidance * (1 + communityPressure / 100);
    moralGuidance = Math.max(-1, Math.min(1, moralGuidance));
    
    return {
      citizenId,
      decisionContext,
      moralGuidance,
      valueAlignment,
      communityPressure
    };
  }

  private calculateValueAlignment(
    value: ReligiousValue,
    decisionContext: string,
    faithLevel: number
  ): number {
    const contextKeywords = decisionContext.toLowerCase().split(/\s+/);
    const valueKeywords = value.description.toLowerCase().split(/\s+/);
    
    let keywordMatch = 0;
    for (const ck of contextKeywords) {
      for (const vk of valueKeywords) {
        if (ck.includes(vk) || vk.includes(ck)) {
          keywordMatch++;
        }
      }
    }
    
    const baseAlignment = keywordMatch > 0 ? 0.5 + keywordMatch * 0.1 : 0;
    const faithModifier = faithLevel / 100;
    
    return baseAlignment * (0.5 + faithModifier * 0.5) * (value.weight > 0.3 ? 1.2 : 1);
  }

  private applyDoctrineInfluence(religion: Religion, decisionContext: string): number {
    let influence = 0;
    
    for (const doctrine of religion.doctrines) {
      const doctrineKeywords = doctrine.toLowerCase().split(/\s+/);
      const contextWords = decisionContext.toLowerCase().split(/\s+/);
      
      for (const keyword of doctrineKeywords) {
        if (contextWords.some(word => word.includes(keyword))) {
          influence += 0.1;
        }
      }
    }
    
    return Math.min(1, influence);
  }

  private calculatePeerReligiousInfluence(citizenId: string, religionId: string): number {
    const religion = this.religions.get(religionId);
    if (!religion) return 0;
    
    const fellowFollowers = religion.followers.filter(id => id !== citizenId);
    if (fellowFollowers.length === 0) return 0;
    
    let totalInfluence = 0;
    for (const followerId of fellowFollowers) {
      const followerFaith = this.citizenFaith.get(followerId) || 0;
      totalInfluence += followerFaith / 100;
    }
    
    return totalInfluence / fellowFollowers.length;
  }

  public performRitual(religionId: string, participantIds: string[]): RitualResult {
    const religion = this.religions.get(religionId);
    if (!religion) {
      throw new Error(`Religion ${religionId} not found`);
    }
    
    const validParticipants = participantIds.filter(id => 
      religion.followers.includes(id)
    );
    
    const baseFaithBoost = 5;
    const participantBonus = Math.log10(validParticipants.length + 1) * 3;
    const ritualComplexity = religion.rituals.length;
    const complexityBonus = ritualComplexity * 0.5;
    
    const faithBoost = baseFaithBoost + participantBonus + complexityBonus;
    
    for (const participantId of validParticipants) {
      const currentFaith = this.citizenFaith.get(participantId) || 0;
      this.citizenFaith.set(participantId, Math.min(100, currentFaith + faithBoost));
      
      const currentPressure = this.religiousCommunityPressure.get(participantId) || 0;
      this.religiousCommunityPressure.set(
        participantId, 
        Math.min(100, currentPressure + validParticipants.length * 0.5)
      );
    }
    
    const communityCohesion = this.calculateCommunityCohesion(validParticipants);
    
    religion.influence += validParticipants.length * 0.1;
    
    const influenceSpread = validParticipants.length * 0.05 * (1 + communityCohesion / 100);
    
    const result: RitualResult = {
      religionId,
      participantIds: validParticipants,
      faithBoost,
      communityCohesion,
      influenceSpread,
      duration: Math.max(1, Math.floor(validParticipants.length / 10))
    };
    
    if (!this.ritualHistory.has(religionId)) {
      this.ritualHistory.set(religionId, []);
    }
    this.ritualHistory.get(religionId)!.push(result);
    
    return result;
  }

  private calculateCommunityCohesion(participantIds: string[]): number {
    if (participantIds.length < 2) return 100;
    
    let totalFaith = 0;
    let count = 0;
    
    for (const participantId of participantIds) {
      const faith = this.citizenFaith.get(participantId) || 0;
      totalFaith += faith;
      count++;
    }
    
    const avgFaith = totalFaith / count;
    let variance = 0;
    
    for (const participantId of participantIds) {
      const faith = this.citizenFaith.get(participantId) || 0;
      variance += Math.pow(faith - avgFaith, 2);
    }
    
    const stdDev = Math.sqrt(variance / count);
    const cohesion = Math.max(0, 100 - stdDev);
    
    return cohesion;
  }

  public setCitizenFaith(citizenId: string, faithLevel: number): void {
    this.citizenFaith.set(citizenId, Math.max(0, Math.min(100, faithLevel)));
  }

  public getCitizenFaith(citizenId: string): number {
    return this.citizenFaith.get(citizenId) || 0;
  }

  public getRitualHistory(religionId: string): RitualResult[] {
    return this.ritualHistory.get(religionId) || [];
  }

  public getCommunityPressure(citizenId: string): number {
    return this.religiousCommunityPressure.get(citizenId) || 0;
  }
}

// 导出单例
export const mediaSystem = new MediaSystem();
export const educationSystem = new EducationSystem();
export const religionSystem = new ReligionSystem();

/** 社会影响管理器 - 整合媒体、教育、宗教三大系统 */
export class SocialInfluenceManager {
  private mediaSystem: MediaSystem;
  private educationSystem: EducationSystem;
  private religionSystem: ReligionSystem;
  
  private influenceWeights: Map<string, { media: number; education: number; religion: number }> = new Map();
  private historicalInfluences: Map<string, TotalSocialInfluenceResult[]> = new Map();
  
  constructor(
    media: MediaSystem = mediaSystem,
    education: EducationSystem = educationSystem,
    religion: ReligionSystem = religionSystem
  ) {
    this.mediaSystem = media;
    this.educationSystem = education;
    this.religionSystem = religion;
  }
  
  public calculateTotalSocialInfluence(
    citizenId: string,
    context: SocialInfluenceContext
  ): TotalSocialInfluenceResult {
    const weights = this.getInfluenceWeights(citizenId, context);
    
    const mediaInfluence = this.calculateMediaComponent(citizenId, context, weights.media);
    const educationInfluence = this.calculateEducationComponent(citizenId, context, weights.education);
    const religiousInfluence = this.calculateReligiousComponent(citizenId, context, weights.religion);
    
    const totalInfluence = 
      mediaInfluence * weights.media +
      educationInfluence * weights.education +
      religiousInfluence * weights.religion;
    
    const dominantFactor = this.determineDominantFactor(
      mediaInfluence * weights.media,
      educationInfluence * weights.education,
      religiousInfluence * weights.religion
    );
    
    const confidence = this.calculateConfidence(
      mediaInfluence,
      educationInfluence,
      religiousInfluence,
      weights
    );
    
    const result: TotalSocialInfluenceResult = {
      citizenId,
      mediaInfluence,
      educationInfluence,
      religiousInfluence,
      totalInfluence,
      dominantFactor,
      confidence,
      breakdown: {
        media: null,
        education: null,
        religion: null
      }
    };
    
    result.breakdown.media = this.mediaSystem.applyMediaInfluenceToCitizen(
      citizenId,
      this.mapContextToDecisionType(context)
    );
    result.breakdown.education = this.educationSystem.applyEducationInfluence(
      citizenId,
      this.mapContextToSkillType(context)
    );
    result.breakdown.religion = this.religionSystem.applyReligiousInfluence(
      citizenId,
      this.buildDecisionContext(context)
    );
    
    this.recordHistoricalInfluence(citizenId, result);
    
    return result;
  }
  
  private getInfluenceWeights(
    citizenId: string,
    context: SocialInfluenceContext
  ): { media: number; education: number; religion: number } {
    const cacheKey = `${citizenId}_${context.decisionType}`;
    const cached = this.influenceWeights.get(cacheKey);
    if (cached) return cached;
    
    const baseWeights = this.getBaseWeights(context.decisionType);
    
    const mediaTrust = this.mediaSystem.getCitizenMediaTrust(citizenId) / 100;
    const educationLevel = this.educationSystem.getCitizenEducationLevel(citizenId) / 100;
    const faithLevel = this.religionSystem.getCitizenFaith(citizenId) / 100;
    
    const urgencyModifier = 1 - context.urgency * 0.3;
    const visibilityModifier = context.publicVisibility * 0.2;
    
    const adjustedWeights = {
      media: baseWeights.media * (0.5 + mediaTrust * 0.5) * (1 + visibilityModifier),
      education: baseWeights.education * (0.5 + educationLevel * 0.5) * urgencyModifier,
      religion: baseWeights.religion * (0.5 + faithLevel * 0.5)
    };
    
    const total = adjustedWeights.media + adjustedWeights.education + adjustedWeights.religion;
    const normalizedWeights = {
      media: adjustedWeights.media / total,
      education: adjustedWeights.education / total,
      religion: adjustedWeights.religion / total
    };
    
    this.influenceWeights.set(cacheKey, normalizedWeights);
    return normalizedWeights;
  }
  
  private getBaseWeights(decisionType: string): { media: number; education: number; religion: number } {
    const weights: Record<string, { media: number; education: number; religion: number }> = {
      voting: { media: 0.5, education: 0.3, religion: 0.2 },
      economic: { media: 0.3, education: 0.5, religion: 0.2 },
      social: { media: 0.4, education: 0.3, religion: 0.3 },
      religious: { media: 0.1, education: 0.2, religion: 0.7 },
      political: { media: 0.4, education: 0.4, religion: 0.2 }
    };
    
    return weights[decisionType] || { media: 0.33, education: 0.34, religion: 0.33 };
  }
  
  private calculateMediaComponent(
    citizenId: string,
    context: SocialInfluenceContext,
    weight: number
  ): number {
    const mediaResult = this.mediaSystem.applyMediaInfluenceToCitizen(
      citizenId,
      this.mapContextToDecisionType(context)
    );
    
    const timePressureEffect = 1 - context.timePressure * 0.2;
    
    return mediaResult.influenceValue * weight * timePressureEffect;
  }
  
  private calculateEducationComponent(
    citizenId: string,
    context: SocialInfluenceContext,
    weight: number
  ): number {
    const educationResult = this.educationSystem.applyEducationInfluence(
      citizenId,
      this.mapContextToSkillType(context)
    );
    
    const knowledgeBonus = educationResult.educationQuality / 100 * 0.3;
    
    return educationResult.knowledgeGain * 10 * weight * (1 + knowledgeBonus);
  }
  
  private calculateReligiousComponent(
    citizenId: string,
    context: SocialInfluenceContext,
    weight: number
  ): number {
    const religiousResult = this.religionSystem.applyReligiousInfluence(
      citizenId,
      this.buildDecisionContext(context)
    );
    
    const communityBonus = religiousResult.communityPressure / 100 * 0.2;
    
    return religiousResult.moralGuidance * weight * (1 + communityBonus);
  }
  
  private determineDominantFactor(
    media: number,
    education: number,
    religion: number
  ): 'media' | 'education' | 'religion' | 'none' {
    const absMedia = Math.abs(media);
    const absEducation = Math.abs(education);
    const absReligion = Math.abs(religion);
    
    const max = Math.max(absMedia, absEducation, absReligion);
    
    if (max < 0.1) return 'none';
    if (max === absMedia) return 'media';
    if (max === absEducation) return 'education';
    return 'religion';
  }
  
  private calculateConfidence(
    mediaInfluence: number,
    educationInfluence: number,
    religiousInfluence: number,
    weights: { media: number; education: number; religion: number }
  ): number {
    const weightedVariance = 
      Math.pow(mediaInfluence, 2) * weights.media +
      Math.pow(educationInfluence, 2) * weights.education +
      Math.pow(religiousInfluence, 2) * weights.religion;
    
    const maxPossibleVariance = 1;
    const confidence = 1 - Math.sqrt(weightedVariance) / maxPossibleVariance;
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  private mapContextToDecisionType(context: SocialInfluenceContext): DecisionType {
    const mapping: Record<string, DecisionType> = {
      voting: 'voting_policy',
      economic: 'economic_trade',
      social: 'social_interaction',
      religious: 'religious_practice',
      political: 'political_alliance'
    };
    
    return mapping[context.decisionType] || 'social_interaction';
  }
  
  private mapContextToSkillType(context: SocialInfluenceContext): SkillType {
    const mapping: Record<string, SkillType> = {
      voting: 'politics',
      economic: 'commerce',
      social: 'arts',
      religious: 'scholarship',
      political: 'politics'
    };
    
    return mapping[context.decisionType] || 'scholarship';
  }
  
  private buildDecisionContext(context: SocialInfluenceContext): string {
    return `${context.decisionType} decision with urgency ${context.urgency} and visibility ${context.publicVisibility}`;
  }
  
  private recordHistoricalInfluence(citizenId: string, result: TotalSocialInfluenceResult): void {
    if (!this.historicalInfluences.has(citizenId)) {
      this.historicalInfluences.set(citizenId, []);
    }
    
    const history = this.historicalInfluences.get(citizenId)!;
    history.push(result);
    
    if (history.length > 100) {
      history.shift();
    }
  }
  
  public getHistoricalInfluences(citizenId: string): TotalSocialInfluenceResult[] {
    return this.historicalInfluences.get(citizenId) || [];
  }
  
  public getAverageInfluence(citizenId: string): {
    media: number;
    education: number;
    religion: number;
    total: number;
  } {
    const history = this.getHistoricalInfluences(citizenId);
    if (history.length === 0) {
      return { media: 0, education: 0, religion: 0, total: 0 };
    }
    
    const sums = history.reduce(
      (acc, result) => ({
        media: acc.media + result.mediaInfluence,
        education: acc.education + result.educationInfluence,
        religion: acc.religion + result.religiousInfluence,
        total: acc.total + result.totalInfluence
      }),
      { media: 0, education: 0, religion: 0, total: 0 }
    );
    
    return {
      media: sums.media / history.length,
      education: sums.education / history.length,
      religion: sums.religion / history.length,
      total: sums.total / history.length
    };
  }
  
  public clearInfluenceCache(citizenId?: string): void {
    if (citizenId) {
      for (const key of Array.from(this.influenceWeights.keys())) {
        if (key.startsWith(citizenId)) {
          this.influenceWeights.delete(key);
        }
      }
      this.historicalInfluences.delete(citizenId);
    } else {
      this.influenceWeights.clear();
      this.historicalInfluences.clear();
    }
  }
}

export const socialInfluenceManager = new SocialInfluenceManager();

export default { 
  mediaSystem, 
  educationSystem, 
  religionSystem,
  socialInfluenceManager
};
