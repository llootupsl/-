/**
 * =============================================================================
 * 永夜熵纪 - 叙事引擎与文明史
 * Narrative Engine and Civilization Chronicle
 * =============================================================================
 */

/** 历史事件 */
export interface HistoricalEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: number;
  importance: number;
  effects: EventEffect[];
  actors: string[];
  era: string;
}

/** 事件类型 */
export enum EventType {
  BIRTH = 'birth',
  DEATH = 'death',
  WAR = 'war',
  TREATY = 'treaty',
  REVOLUTION = 'revolution',
  DISCOVERY = 'discovery',
  DISASTER = 'disaster',
  ACHIEVEMENT = 'achievement',
  POLITICAL = 'political',
  ECONOMIC = 'economic',
  CULTURAL = 'cultural',
}

/** 事件效果 */
export interface EventEffect {
  type: 'resource' | 'population' | 'stability' | 'technology' | 'culture';
  target: string;
  value: number;
}

/** 文明编年史 */
export interface Chronicle {
  events: HistoricalEvent[];
  currentEra: string;
  eraTransitions: EraTransition[];
  majorFigures: MajorFigure[];
}

/** 时代转换 */
export interface EraTransition {
  fromEra: string;
  toEra: string;
  timestamp: number;
  description: string;
}

/** 重要人物 */
export interface MajorFigure {
  id: string;
  name: string;
  title: string;
  era: string;
  achievements: string[];
  birthYear: number;
  deathYear?: number;
  influence: number;
}

/** 叙事生成器配置 */
export interface NarrativeConfig {
  style: 'classical' | 'modern' | 'cyberpunk';
  language: 'classical' | 'vernacular';
  length: 'brief' | 'standard' | 'detailed';
}

/** 叙事引擎 */
export class NarrativeEngine {
  private chronicle: Chronicle;
  private narrativeTemplates: Map<EventType, string[]> = new Map();
  private eraMilestones: Map<string, string> = new Map();

  constructor() {
    this.chronicle = {
      events: [],
      currentEra: '创世纪',
      eraTransitions: [],
      majorFigures: [],
    };
    this.initializeTemplates();
  }

  /**
   * 初始化模板
   */
  private initializeTemplates(): void {
    // 战争模板
    this.narrativeTemplates.set(EventType.WAR, [
      '公元{year}年，{location}爆发了一场激烈的冲突。',
      '{faction1}与{faction2}之间的战争撼动了整个文明。',
      '在{location}的边境，战火纷飞，{faction1}发起了对{faction2}的进攻。',
    ]);

    // 发现模板
    this.narrativeTemplates.set(EventType.DISCOVERY, [
      '公元{year}年，一项划时代的发明在{location}诞生。',
      '{scientist}在{location}取得了突破性进展。',
      '文明的曙光在{location}闪耀，一项新技术被发现。',
    ]);

    // 灾难模板
    this.narrativeTemplates.set(EventType.DISASTER, [
      '公元{year}年，一场突如其来的灾难降临{location}。',
      '{location}陷入了前所未有的危机。',
      '天灾人祸同时降临，{location}满目疮痍。',
    ]);

    // 革命模板
    this.narrativeTemplates.set(EventType.REVOLUTION, [
      '公元{year}年，{faction}发动了一场改变历史的革命。',
      '受压迫的民众揭竿而起，{faction}领导了这场起义。',
      '新思想在{location}传播，一场革命悄然酝酿。',
    ]);

    // 成就模板
    this.narrativeTemplates.set(EventType.ACHIEVEMENT, [
      '公元{year}年，{actor}达成了前所未有的成就。',
      '文明迈向新的高度，{achievement}被实现。',
      '后世的里程碑：{achievement}。',
    ]);

    // 时代里程碑
    this.eraMilestones.set('创世纪', '文明起源');
    this.eraMilestones.set('黎明纪', '文字诞生');
    this.eraMilestones.set('古典纪', '城邦兴起');
    this.eraMilestones.set('中世纪', '宗教统一');
    this.eraMilestones.set('工业纪', '机械革命');
    this.eraMilestones.set('信息纪', '数字革命');
    this.eraMilestones.set('量子纪', '量子突破');
    this.eraMilestones.set('飞升纪', '文明永生');
  }

  /**
   * 记录事件
   */
  public recordEvent(
    type: EventType,
    title: string,
    description: string,
    actors: string[] = [],
    effects: EventEffect[] = [],
    importance: number = 1
  ): HistoricalEvent {
    const event: HistoricalEvent = {
      id: crypto.randomUUID(),
      type,
      title,
      description,
      timestamp: Date.now(),
      importance,
      effects,
      actors,
      era: this.chronicle.currentEra,
    };

    this.chronicle.events.push(event);

    // 限制事件数量
    if (this.chronicle.events.length > 1000) {
      this.chronicle.events.shift();
    }

    return event;
  }

  /**
   * 生成叙事文本
   */
  public generateNarrative(
    event: HistoricalEvent,
    config: Partial<NarrativeConfig> = {}
  ): string {
    const templates = this.narrativeTemplates.get(event.type) || ['公元{year}年，发生了重要事件。'];
    const template = templates[Math.floor(Math.random() * templates.length)];

    const year = this.calculateYear(event.timestamp);
    const narrative = template
      .replace('{year}', year.toString())
      .replace('{location}', event.actors[0] || '某地')
      .replace('{faction1}', event.actors[0] || '势力A')
      .replace('{faction2}', event.actors[1] || '势力B')
      .replace('{faction}', event.actors[0] || '起义者')
      .replace('{scientist}', event.actors[0] || '科学家')
      .replace('{actor}', event.actors[0] || '某人')
      .replace('{achievement}', event.title);

    return narrative + ' ' + event.description;
  }

  /**
   * 计算年份
   */
  private calculateYear(timestamp: number): number {
    // 假设公元元年对应某个时间戳
    const epoch = new Date('2024-01-01').getTime();
    return Math.floor((timestamp - epoch) / (365 * 24 * 60 * 60 * 1000));
  }

  /**
   * 检查时代转换
   */
  public checkEraTransition(techLevel: number, year: number): string | null {
    let newEra: string | null = null;

    if (techLevel < 1) newEra = '创世纪';
    else if (techLevel < 5) newEra = '黎明纪';
    else if (techLevel < 15) newEra = '古典纪';
    else if (techLevel < 30) newEra = '中世纪';
    else if (techLevel < 50) newEra = '工业纪';
    else if (techLevel < 80) newEra = '信息纪';
    else if (techLevel < 100) newEra = '量子纪';
    else newEra = '飞升纪';

    if (newEra && newEra !== this.chronicle.currentEra) {
      const transition: EraTransition = {
        fromEra: this.chronicle.currentEra,
        toEra: newEra,
        timestamp: Date.now(),
        description: `文明进入了新的时代：${newEra}`,
      };
      this.chronicle.eraTransitions.push(transition);
      this.chronicle.currentEra = newEra;

      // 记录时代转换事件
      this.recordEvent(
        EventType.ACHIEVEMENT,
        `${newEra}开启`,
        transition.description,
        [],
        [],
        10
      );

      return newEra;
    }

    return null;
  }

  /**
   * 生成传记
   */
  public generateBiography(citizenId: string, citizenName: string): string {
    const citizenEvents = this.chronicle.events.filter(e => 
      e.actors.includes(citizenId)
    );

    if (citizenEvents.length === 0) {
      return `${citizenName}是一位普通的市民，在历史的长河中留下了淡淡的足迹。`;
    }

    const bio = [`【${citizenName}传】`];
    bio.push(`出生于${this.calculateYear(citizenEvents[0].timestamp)}年。`);

    // 按时间排序
    citizenEvents.sort((a, b) => a.timestamp - b.timestamp);

    for (const event of citizenEvents.slice(0, 5)) {
      bio.push(`\n${this.calculateYear(event.timestamp)}年：${event.description}`);
    }

    return bio.join('\n');
  }

  /**
   * 生成文明编年史摘要
   */
  public generateChronicleSummary(years: number = 100): string {
    const recentEvents = this.chronicle.events
      .filter(e => this.calculateYear(Date.now()) - this.calculateYear(e.timestamp) <= years)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20);

    const summary = [`【${this.chronicle.currentEra}文明编年史】\n`];

    for (const event of recentEvents) {
      const year = this.calculateYear(event.timestamp);
      summary.push(`${year}年：${event.title} - ${event.description.slice(0, 50)}...`);
    }

    return summary.join('\n');
  }

  /**
   * 生成新闻
   */
  public generateNews(
    type: 'headline' | 'report' | 'analysis'
  ): string {
    const recentEvents = this.chronicle.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    if (recentEvents.length === 0) {
      return '今日无事，岁月静好。';
    }

    const topEvent = recentEvents[0];

    switch (type) {
      case 'headline':
        return `【头条】${topEvent.title}`;
      case 'report':
        return `【新闻报道】\n${topEvent.title}\n\n${topEvent.description}`;
      case 'analysis':
        return `【深度分析】\n${topEvent.title}\n\n${topEvent.description}\n\n专家点评：这场事件将对未来产生深远影响...`;
      default:
        return topEvent.description;
    }
  }

  /**
   * 获取编年史
   */
  public getChronicle(): Chronicle {
    return { ...this.chronicle };
  }

  /**
   * 获取时代信息
   */
  public getEraInfo(): { current: string; milestone: string; progress: number } {
    return {
      current: this.chronicle.currentEra,
      milestone: this.eraMilestones.get(this.chronicle.currentEra) || '',
      progress: 0.5, // 需要根据实际游戏进度计算
    };
  }
}

/** 世界聊天系统 */
export class WorldChat {
  private messages: ChatMessage[] = [];
  private maxMessages: number = 100;
  private userName: string = '匿名市民';

  constructor() {}

  /**
   * 设置用户名
   */
  public setUserName(name: string): void {
    this.userName = name;
  }

  /**
   * 发送消息
   */
  public sendMessage(content: string, type: 'normal' | 'system' | 'event' = 'normal'): ChatMessage {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId: 'local',
      userName: this.userName,
      content,
      timestamp: Date.now(),
      type,
    };

    this.messages.unshift(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.pop();
    }

    return message;
  }

  /**
   * 添加系统消息
   */
  public addSystemMessage(content: string): ChatMessage {
    return this.sendMessage(content, 'system');
  }

  /**
   * 添加事件消息
   */
  public addEventMessage(event: HistoricalEvent): ChatMessage {
    return this.sendMessage(`【${event.title}】${event.description}`, 'event');
  }

  /**
   * 获取消息历史
   */
  public getMessages(limit: number = 50): ChatMessage[] {
    return this.messages.slice(0, limit);
  }

  /**
   * 模拟其他玩家消息（用于演示）
   */
  public simulateRandomMessages(): void {
    const randomMessages = [
      '大家好啊！',
      '今天的文明发展得真快！',
      '有人研究新科技了吗？',
      '支持DAO治理！',
      '量子计算真是神奇',
      '这个模拟器太棒了',
      '永夜熵纪万岁！',
    ];

    const randomNames = ['星际旅者', '量子法师', '熵增观察者', '文明守护者', '数据漫游者'];

    if (Math.random() < 0.3) {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        userId: 'bot-' + Math.random().toString(36).substr(2, 9),
        userName: randomNames[Math.floor(Math.random() * randomNames.length)],
        content: randomMessages[Math.floor(Math.random() * randomMessages.length)],
        timestamp: Date.now(),
        type: 'normal',
      };
      this.messages.unshift(message);
    }
  }
}

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  type: 'normal' | 'system' | 'event';
}

// 导出单例
export const narrativeEngine = new NarrativeEngine();
export const worldChat = new WorldChat();
export default { narrativeEngine, worldChat };
