import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/core/utils/Logger';

export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  icon: string;
  content: string;
  keywords: string[];
  relatedArticles?: string[];
}

export type HelpCategory = 
  | 'getting-started'
  | 'resources'
  | 'citizens'
  | 'divine'
  | 'dao'
  | 'economy'
  | 'technology'
  | 'entropy'
  | 'controls';

export interface HelpCategoryInfo {
  id: HelpCategory;
  name: string;
  icon: string;
  description: string;
}

export const HELP_CATEGORIES: HelpCategoryInfo[] = [
  { id: 'getting-started', name: '入门指南', icon: '🚀', description: '游戏基础和目标介绍' },
  { id: 'resources', name: '资源管理', icon: '⚡', description: '五大核心资源详解' },
  { id: 'citizens', name: '市民系统', icon: '👥', description: '市民管理与社交网络' },
  { id: 'divine', name: '神力系统', icon: '✨', description: '神力干预与观测值' },
  { id: 'dao', name: 'DAO治理', icon: '📜', description: '民主投票与法案系统' },
  { id: 'economy', name: '经济系统', icon: '💰', description: '市场经济与供应链' },
  { id: 'technology', name: '科技树', icon: '🔬', description: '科技研发与效果' },
  { id: 'entropy', name: '熵值系统', icon: '🌡️', description: '宇宙熵增与时代演变' },
  { id: 'controls', name: '操作指南', icon: '🎮', description: '键盘快捷键与操作' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'game-objective',
    title: '游戏目标',
    category: 'getting-started',
    icon: '🎯',
    content: `## 你的使命

作为一位观察者，你的目标是尽可能延长文明的存续时间。

### 核心目标
- **延长文明寿命**：通过资源管理、科技研发和神力干预减缓熵增
- **维持市民幸福**：满足市民需求，避免暴乱和崩溃
- **推动文明进步**：研发科技，解锁新能力

### 游戏结束条件
- 熵值达到 100%（宇宙热寂）
- 所有市民死亡
- 核心能源耗尽

### 评分标准
- 文明存续年数
- 市民幸福指数
- 科技研发完成度
- 神力使用效率`,
    keywords: ['目标', '使命', '结束', '评分', '胜利'],
    relatedArticles: ['entropy-basics', 'resources-overview'],
  },
  {
    id: 'basic-controls',
    title: '基本操作',
    category: 'getting-started',
    icon: '🎮',
    content: `## 操作方式

### 鼠标操作
- **左键点击**：选择市民、建筑或面板
- **右键点击**：打开上下文菜单
- **滚轮**：缩放视图

### 键盘快捷键
| 按键 | 功能 |
|------|------|
| H | 打开帮助面板 |
| C | 打开市民面板 |
| D | 打开神力面板 |
| G | 打开治理面板 |
| R | 打开资源面板 |
| ESC | 关闭当前面板 |
| Space | 暂停/继续游戏 |
| +/- | 加速/减速时间 |

### 面板导航
- 底部快捷栏可快速访问主要功能
- 点击顶部状态栏查看详细资源信息`,
    keywords: ['操作', '快捷键', '键盘', '鼠标', '控制'],
    relatedArticles: ['game-objective'],
  },
  {
    id: 'resources-overview',
    title: '资源概览',
    category: 'resources',
    icon: '⚡',
    content: `## 五大核心资源

### 1. 核心能源 (Core Energy)
文明的命脉，驱动所有系统运转。
- **用途**：维持城市运转、生产其他资源
- **获取**：能源设施产出、科技加成
- **警告**：低于 20% 时触发危机

### 2. 算力配额 (Compute Quota)
计算资源，用于科技研发和AI辅助。
- **用途**：加速研究、优化系统
- **获取**：数据中心产出
- **建议**：保持充足算力以维持科技进度

### 3. 生物质 (Biomass)
生命物质，用于市民生存和繁衍。
- **用途**：维持市民生命、生产食物
- **获取**：农业区、合成工厂
- **警告**：不足会导致饥荒

### 4. 信息熵 (Information)
数据资源，影响决策和预测能力。
- **用途**：预测事件、优化决策
- **获取**：观测站、研究设施
- **特点**：影响事件触发概率

### 5. 信任值 (Trust)
市民对文明的信任度，影响社会稳定。
- **用途**：降低暴乱风险、提高效率
- **获取**：满足市民需求、通过法案
- **警告**：过低会引发暴乱`,
    keywords: ['资源', '能源', '算力', '生物质', '信息', '信任'],
    relatedArticles: ['resource-management-tips', 'economy-basics'],
  },
  {
    id: 'resource-management-tips',
    title: '资源管理技巧',
    category: 'resources',
    icon: '💡',
    content: `## 高效资源管理

### 优先级原则
1. **核心能源优先**：确保能源供应稳定
2. **生物质次之**：避免饥荒导致人口下降
3. **算力平衡**：维持科技研发进度
4. **信息积累**：为预测和决策提供支持
5. **信任维护**：保持社会稳定

### 危机应对
- **能源危机**：关闭非必要设施，启用备用能源
- **食物短缺**：紧急调配生物质，启动合成工厂
- **信任危机**：通过惠民法案，满足市民需求

### 资源联动
- 能源 → 算力（数据中心）
- 生物质 → 信任（食物供应）
- 信息 → 所有资源（预测优化）
- 算力 → 科技 → 资源产出加成`,
    keywords: ['技巧', '管理', '优先级', '危机', '联动'],
    relatedArticles: ['resources-overview'],
  },
  {
    id: 'citizens-overview',
    title: '市民系统介绍',
    category: 'citizens',
    icon: '👥',
    content: `## 市民是文明的核心

### 市民属性
每位市民拥有独特的属性组合：
- **体力**：影响工作效率
- **情绪**：影响社会行为
- **健康**：影响寿命和生产力
- **智力**：影响科研贡献
- **魅力**：影响社交能力

### 市民需求
市民有多种需求层次：
1. **生理需求**：食物、住所
2. **安全需求**：治安、医疗
3. **社交需求**：朋友、家庭
4. **尊重需求**：地位、成就
5. **自我实现**：创造、探索

### 社交网络
市民之间会建立关系：
- **朋友关系**：提升双方情绪
- **家庭关系**：繁衍后代
- **工作关系**：提高效率
- **冲突关系**：可能引发问题`,
    keywords: ['市民', '属性', '需求', '社交', '关系'],
    relatedArticles: ['citizen-management', 'social-network'],
  },
  {
    id: 'citizen-management',
    title: '市民管理指南',
    category: 'citizens',
    icon: '📋',
    content: `## 有效管理市民

### 查看市民信息
1. 点击底部"市民"按钮
2. 浏览市民列表或搜索特定市民
3. 点击市民卡片查看详细信息

### 市民状态监控
- **健康状态**：绿色=健康，黄色=亚健康，红色=危险
- **情绪状态**：通过情绪网络查看整体趋势
- **需求满足度**：查看各项需求的满足程度

### 干预措施
- **神力干预**：直接改变市民状态
- **法案影响**：通过DAO制定政策
- **资源调配**：调整资源分配优先级

### 繁衍管理
- 市民会自然建立家庭关系
- 确保足够的生物质支持人口增长
- 注意人口密度对资源的影响`,
    keywords: ['管理', '监控', '干预', '繁衍', '人口'],
    relatedArticles: ['citizens-overview', 'divine-intervention'],
  },
  {
    id: 'divine-intervention',
    title: '神力干预系统',
    category: 'divine',
    icon: '✨',
    content: `## 作为观察者的力量

### 观测值系统
你的观测行为本身会影响文明：
- **观测点数**：通过时间积累
- **观测效应**：观测改变现实

### 神力类型

#### 1. 创造类
- **赐予生命**：创造新市民
- **资源祝福**：增加资源产出
- **科技启示**：加速研究进度

#### 2. 干预类
- **情绪引导**：调整市民情绪
- **命运改写**：改变事件结果
- **关系调解**：修复或建立关系

#### 3. 惩罚类
- **天灾降临**：消耗过剩人口
- **资源凋零**：平衡资源过剩
- **混乱播种**：测试文明韧性

### 使用建议
- 谨慎使用惩罚类神力
- 在危机时刻使用创造类神力
- 观测点数有限，合理规划使用`,
    keywords: ['神力', '干预', '观测', '创造', '惩罚'],
    relatedArticles: ['observation-value', 'citizen-management'],
  },
  {
    id: 'observation-value',
    title: '观测值详解',
    category: 'divine',
    icon: '👁️',
    content: `## 量子观测效应

### 观测值获取
- **时间积累**：每秒自动获取少量观测值
- **事件触发**：重要事件提供额外观测值
- **成就解锁**：完成成就获得奖励

### 观测值消耗
- **神力使用**：每种神力消耗不同数量
- **命运干预**：改写事件结果
- **信息获取**：查看隐藏信息

### 观测效应
你的观测会影响文明：
- **正面效应**：观测希望会增强希望
- **负面效应**：观测混乱会加剧混乱
- **量子叠加**：观测使不确定状态坍缩

### 高级技巧
- 在关键时刻积累观测值
- 利用观测效应放大正面影响
- 避免过度观测负面事件`,
    keywords: ['观测', '量子', '效应', '积累', '消耗'],
    relatedArticles: ['divine-intervention'],
  },
  {
    id: 'dao-governance',
    title: 'DAO治理系统',
    category: 'dao',
    icon: '📜',
    content: `## 去中心化自治组织

### 治理结构
文明由全体市民共同治理：
- **提案系统**：市民可提出法案
- **投票机制**：每位市民有投票权
- **执行系统**：通过的法案自动生效

### 法案类型

#### 经济类
- 税率调整
- 资源分配
- 贸易政策

#### 社会类
- 福利政策
- 教育投入
- 医疗保障

#### 科技类
- 研究方向
- 技术限制
- 创新激励

### 参与治理
1. 点击"治理"按钮打开DAO面板
2. 查看当前提案和投票进度
3. 提出新提案或参与投票
4. 观察法案执行效果

### 治理策略
- 平衡各方利益
- 关注长期影响
- 预防短视决策`,
    keywords: ['DAO', '治理', '法案', '投票', '提案'],
    relatedArticles: ['voting-strategy', 'law-effects'],
  },
  {
    id: 'voting-strategy',
    title: '投票策略指南',
    category: 'dao',
    icon: '🗳️',
    content: `## 有效参与投票

### 投票权重
- 每位市民有基础投票权
- 市民属性影响投票权重
- 社会地位高的市民权重更大

### 投票时机
- **紧急提案**：快速响应
- **长期提案**：充分讨论
- **争议提案**：权衡利弊

### 投票策略

#### 保守策略
- 优先维持现状
- 谨慎尝试新政策
- 关注稳定性

#### 激进策略
- 大胆改革
- 快速推进科技
- 承担风险换取收益

#### 平衡策略
- 综合考虑各方利益
- 渐进式改革
- 维持社会和谐

### 预测投票结果
- 查看市民倾向分布
- 分析利益相关方
- 预估投票结果影响`,
    keywords: ['投票', '策略', '权重', '时机', '预测'],
    relatedArticles: ['dao-governance'],
  },
  {
    id: 'economy-basics',
    title: '经济系统基础',
    category: 'economy',
    icon: '💰',
    content: `## 市场经济运作

### 经济要素
- **供给**：资源产出
- **需求**：市民消费
- **价格**：供需平衡决定

### 经济指标
- **GDP**：总产出价值
- **通胀率**：价格变化速度
- **就业率**：市民工作比例

### 经济周期
1. **繁荣期**：高产出、高消费
2. **衰退期**：产出下降、消费减少
3. **萧条期**：经济低谷
4. **复苏期**：逐步恢复

### 经济政策
- 通过DAO制定经济法案
- 调整税率影响经济
- 神力干预紧急情况`,
    keywords: ['经济', '市场', '供给', '需求', '周期'],
    relatedArticles: ['resources-overview', 'dao-governance'],
  },
  {
    id: 'technology-tree',
    title: '科技树系统',
    category: 'technology',
    icon: '🔬',
    content: `## 科技研发指南

### 科技分类

#### 基础科技
- 能源技术
- 农业技术
- 建筑技术

#### 进阶科技
- AI技术
- 量子计算
- 生物工程

#### 终极科技
- 熵减技术
- 永生技术
- 宇宙工程

### 研发流程
1. 消耗算力进行研究
2. 满足前置科技要求
3. 等待研发完成
4. 解锁新效果

### 科技效果
- **产出加成**：提高资源产出
- **效率提升**：降低消耗
- **新功能**：解锁新能力
- **熵减效果**：减缓熵增速度

### 研发策略
- 优先研发能源科技
- 平衡各领域发展
- 关注熵减相关科技`,
    keywords: ['科技', '研发', '技术', '解锁', '效果'],
    relatedArticles: ['resources-overview', 'entropy-basics'],
  },
  {
    id: 'entropy-basics',
    title: '熵值系统详解',
    category: 'entropy',
    icon: '🌡️',
    content: `## 宇宙熵增法则

### 熵值概念
熵是宇宙走向终结的度量：
- **0%**：文明诞生
- **50%**：中期阶段
- **100%**：宇宙热寂

### 时代演变
| 熵值范围 | 时代名称 | 特征 |
|----------|----------|------|
| 0-15% | 黄金时代 | 繁荣稳定 |
| 15-35% | 稳定时代 | 平稳发展 |
| 35-55% | 压力时代 | 资源紧张 |
| 55-75% | 危机时代 | 频繁危机 |
| 75-90% | 崩溃边缘 | 极度危险 |
| 90-100% | 熵增纪元 | 末日降临 |

### 熵增因素
- 时间流逝（自然熵增）
- 资源消耗
- 市民死亡
- 灾难事件

### 熵减方法
- 科技研发（熵减科技）
- 神力干预
- 资源优化
- 社会和谐`,
    keywords: ['熵', '熵增', '熵减', '时代', '热寂'],
    relatedArticles: ['game-objective', 'technology-tree'],
  },
  {
    id: 'epoch-events',
    title: '时代事件',
    category: 'entropy',
    icon: '⏳',
    content: `## 各时代特殊事件

### 黄金时代事件
- 人口快速增长
- 科技突破频繁
- 资源产出加成

### 稳定时代事件
- 稳步发展
- 偶尔小波动
- 适合积累

### 压力时代事件
- 资源危机开始
- 市民不满增加
- 需要调整策略

### 危机时代事件
- 频繁灾难
- 社会动荡
- 考验治理能力

### 崩溃边缘事件
- 极端危机
- 人口锐减
- 需要强力干预

### 熵增纪元事件
- 末日事件频发
- 最后的挣扎
- 准备终结或奇迹`,
    keywords: ['时代', '事件', '灾难', '危机', '机遇'],
    relatedArticles: ['entropy-basics', 'divine-intervention'],
  },
];

export interface ContextualHelp {
  panelId: string;
  articles: string[];
  tips: string[];
}

export const CONTEXTUAL_HELP: Record<string, ContextualHelp> = {
  citizen: {
    panelId: 'citizen',
    articles: ['citizens-overview', 'citizen-management'],
    tips: [
      '点击市民卡片查看详细信息',
      '关注市民的情绪和需求状态',
      '使用神力可以直接干预市民状态',
    ],
  },
  divine: {
    panelId: 'divine',
    articles: ['divine-intervention', 'observation-value'],
    tips: [
      '观测值会随时间自动积累',
      '谨慎使用惩罚类神力',
      '神力干预会产生蝴蝶效应',
    ],
  },
  dao: {
    panelId: 'dao',
    articles: ['dao-governance', 'voting-strategy'],
    tips: [
      '法案通过后自动生效',
      '关注法案的长期影响',
      '平衡各方利益是关键',
    ],
  },
  resource: {
    panelId: 'resource',
    articles: ['resources-overview', 'resource-management-tips'],
    tips: [
      '核心能源是最重要的资源',
      '保持资源平衡避免危机',
      '科技可以提升资源产出',
    ],
  },
  economy: {
    panelId: 'economy',
    articles: ['economy-basics'],
    tips: [
      '供需关系决定价格',
      '经济周期是正常现象',
      '通过DAO可以调控经济',
    ],
  },
  technology: {
    panelId: 'technology',
    articles: ['technology-tree'],
    tips: [
      '优先研发能源科技',
      '关注熵减相关科技',
      '算力决定研发速度',
    ],
  },
  main: {
    panelId: 'main',
    articles: ['game-objective', 'basic-controls'],
    tips: [
      '按 H 键打开帮助面板',
      '点击底部快捷栏访问功能',
      '关注熵值变化趋势',
    ],
  },
};

interface HelpState {
  isOpen: boolean;
  searchQuery: string;
  selectedCategory: HelpCategory | null;
  selectedArticle: string | null;
  contextualPanel: string | null;
  discoveredFeatures: string[];
}

interface HelpActions {
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
  setSearchQuery: (query: string) => void;
  selectCategory: (category: HelpCategory | null) => void;
  selectArticle: (articleId: string | null) => void;
  setContextualPanel: (panelId: string | null) => void;
  markFeatureDiscovered: (featureId: string) => void;
  isFeatureDiscovered: (featureId: string) => boolean;
}

type HelpStore = HelpState & HelpActions;

const STORAGE_KEY = 'omnis-help-state';

const loadDiscoveredFeatures = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.discoveredFeatures || [];
    }
  } catch (e) {
    logger.warn('Help', 'Failed to load from localStorage', e as Error);
  }
  return [];
};

const saveDiscoveredFeatures = (features: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ discoveredFeatures: features }));
  } catch (e) {
    logger.warn('Help', 'Failed to save to localStorage', e as Error);
  }
};

export const useHelpStore = create<HelpStore>()((set, get) => ({
  isOpen: false,
  searchQuery: '',
  selectedCategory: null,
  selectedArticle: null,
  contextualPanel: null,
  discoveredFeatures: loadDiscoveredFeatures(),

  openHelp: () => set({ isOpen: true }),
  closeHelp: () => set({ isOpen: false }),
  toggleHelp: () => set((state) => ({ isOpen: !state.isOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectCategory: (category) => set({ selectedCategory: category, selectedArticle: null }),
  selectArticle: (articleId) => set({ selectedArticle: articleId }),
  setContextualPanel: (panelId) => set({ contextualPanel: panelId }),
  
  markFeatureDiscovered: (featureId) => {
    const { discoveredFeatures } = get();
    if (!discoveredFeatures.includes(featureId)) {
      const newFeatures = [...discoveredFeatures, featureId];
      set({ discoveredFeatures: newFeatures });
      saveDiscoveredFeatures(newFeatures);
    }
  },
  
  isFeatureDiscovered: (featureId) => {
    return get().discoveredFeatures.includes(featureId);
  },
}));

export const useSearchHelp = (query: string) => {
  return HELP_ARTICLES.filter((article) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return (
      article.title.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery) ||
      article.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
    );
  });
};

export const useArticlesByCategory = (category: HelpCategory | null) => {
  if (!category) return HELP_ARTICLES;
  return HELP_ARTICLES.filter((article) => article.category === category);
};

export const useArticleById = (id: string | null) => {
  if (!id) return null;
  return HELP_ARTICLES.find((article) => article.id === id) || null;
};

export const useContextualHelp = (panelId: string | null) => {
  if (!panelId) return null;
  return CONTEXTUAL_HELP[panelId] || null;
};
