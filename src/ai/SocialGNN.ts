/**
 * =============================================================================
 * 永夜熵纪 - 图神经网络社交分析
 * Graph Neural Network Social Analysis
 * =============================================================================
 */

/** 供应链节点类型 */
export enum SupplyChainNodeType {
  SUPPLIER = 'supplier',
  PRODUCER = 'producer',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
  CONSUMER = 'consumer',
  WAREHOUSE = 'warehouse',
  LOGISTICS = 'logistics',
}

/** 供应链边类型 */
export enum SupplyChainEdgeType {
  SUPPLY = 'supply',
  TRANSPORT = 'transport',
  DISTRIBUTION = 'distribution',
  RETAIL = 'retail',
}

/** 市民特征接口（用于派生embedding） */
export interface CitizenFeatures {
  energy: number;
  mood: number;
  health: number;
  age?: number;
  intelligence?: number;
  socialStatus?: number;
  genome?: number[];
}

/** 供应链节点特征 */
export interface SupplyChainNodeFeatures {
  nodeType: SupplyChainNodeType;
  capacity: number;
  currentLoad: number;
  efficiency: number;
  reliability: number;
  inventoryLevel: number;
  throughput: number;
  leadTime: number;
  cost: number;
  riskScore: number;
  geographicPosition?: { lat: number; lng: number };
}

/** 供应链边特征 */
export interface SupplyChainEdgeFeatures {
  edgeType: SupplyChainEdgeType;
  flowRate: number;
  maxCapacity: number;
  transportCost: number;
  leadTime: number;
  reliability: number;
  distance: number;
}

/**
 * 从市民特征派生有意义的embedding
 * 使用特征归一化和简单哈希组合，确保一致性
 */
export function deriveEmbeddingFromCitizen(features: CitizenFeatures, dim: number = 64): number[] {
  const embedding: number[] = new Array(dim).fill(0);
  
  // 基础特征归一化 (0-1)
  const normalizedEnergy = features.energy / 100;
  const normalizedMood = features.mood / 100;
  const normalizedHealth = features.health / 100;
  const normalizedAge = (features.age || 30) / 100;
  const normalizedIntelligence = (features.intelligence || 50) / 100;
  const normalizedSocialStatus = (features.socialStatus || 50) / 100;
  
  // 使用确定性哈希分布特征到各个维度
  const baseFeatures = [
    normalizedEnergy,
    normalizedMood,
    normalizedHealth,
    normalizedAge,
    normalizedIntelligence,
    normalizedSocialStatus,
  ];
  
  // 分配基础特征到前几个维度
  for (let i = 0; i < Math.min(baseFeatures.length, dim); i++) {
    embedding[i] = baseFeatures[i];
  }
  
  // 生成组合特征维度
  for (let i = baseFeatures.length; i < dim; i++) {
    const f1 = baseFeatures[i % baseFeatures.length];
    const f2 = baseFeatures[(i + 1) % baseFeatures.length];
    const f3 = baseFeatures[(i + 2) % baseFeatures.length];
    
    // 使用简单的非线性组合
    embedding[i] = (f1 * 0.5 + f2 * 0.3 + f3 * 0.2) * Math.sin(i * 0.1);
  }
  
  // 如果有基因组数据，融入embedding
  if (features.genome && features.genome.length > 0) {
    const genomeDim = Math.min(features.genome.length, dim - 10);
    for (let i = 0; i < genomeDim; i++) {
      embedding[10 + i] = (embedding[10 + i] + features.genome[i]) / 2;
    }
  }
  
  // L2归一化，使embedding在单位球面上
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += embedding[i] * embedding[i];
  }
  norm = Math.sqrt(norm) + 0.0001; // 防止除零
  
  for (let i = 0; i < dim; i++) {
    embedding[i] /= norm;
  }
  
  return embedding;
}

/** 图节点 */
export interface GraphNode {
  id: string;
  type: 'citizen' | 'institution' | 'religion' | 'event' | 'supply_chain_node';
  features: number[];
  embedding: number[];
  supplyChainFeatures?: SupplyChainNodeFeatures;
}

/** 图边 */
export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'friend' | 'family' | 'work' | 'trade' | 'follow' | 'conflict' | 'supply_chain_edge';
  supplyChainFeatures?: SupplyChainEdgeFeatures;
}

/** 社区 */
export interface Community {
  id: string;
  members: string[];
  density: number;
  influence: number;
  leaders: string[];
}

/** 图神经网络 */
export class GraphNeuralNetwork {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private adjacencyList: Map<string, Map<string, number>> = new Map();
  private communities: Map<string, Community> = new Map();
  private embeddingDim: number = 64;

  constructor() {}

  /**
   * 添加节点
   */
  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Map());
    }
  }

  /**
   * 添加边
   */
  public addEdge(edge: GraphEdge): void {
    this.edges.push(edge);
    
    // 更新邻接表
    if (!this.adjacencyList.has(edge.source)) {
      this.adjacencyList.set(edge.source, new Map());
    }
    this.adjacencyList.get(edge.source)!.set(edge.target, edge.weight);
  }

  /**
   * 批量添加边
   */
  public addEdges(edges: GraphEdge[]): void {
    for (const edge of edges) {
      this.addEdge(edge);
    }
  }

  /**
   * 消息传递（简化的GNN操作）
   */
  public messagePassing(iterations: number = 3): void {
    for (let iter = 0; iter < iterations; iter++) {
      const newEmbeddings = new Map<string, number[]>();
      
      for (const [nodeId, node] of this.nodes) {
        const neighbors = this.adjacencyList.get(nodeId);
        if (!neighbors || neighbors.size === 0) continue;

        // 聚合邻居信息
        const aggregated = new Array(this.embeddingDim).fill(0);
        let totalWeight = 0;

        for (const [neighborId, weight] of neighbors) {
          const neighbor = this.nodes.get(neighborId);
          if (!neighbor) continue;

          for (let i = 0; i < this.embeddingDim; i++) {
            aggregated[i] += neighbor.embedding[i] * weight;
          }
          totalWeight += weight;
        }

        // 归一化
        if (totalWeight > 0) {
          for (let i = 0; i < this.embeddingDim; i++) {
            aggregated[i] /= totalWeight;
          }
        }

        // 与自身特征融合
        for (let i = 0; i < this.embeddingDim; i++) {
          aggregated[i] = aggregated[i] * 0.7 + node.embedding[i] * 0.3;
        }

        newEmbeddings.set(nodeId, aggregated);
      }

      // 更新嵌入
      for (const [nodeId, embedding] of newEmbeddings) {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.embedding = embedding;
        }
      }
    }
  }

  /**
   * 社区检测（Louvain算法简化版）
   */
  public detectCommunities(): Community[] {
    const communities: Community[] = [];
    const nodeCommunity = new Map<string, string>();
    
    // 初始化：每个节点一个社区
    let communityId = 0;
    for (const nodeId of this.nodes.keys()) {
      const id = `community-${communityId++}`;
      nodeCommunity.set(nodeId, id);
      communities.push({
        id,
        members: [nodeId],
        density: 0,
        influence: 0,
        leaders: [],
      });
    }

    // 迭代优化
    for (let iter = 0; iter < 10; iter++) {
      let improved = false;

      for (const [nodeId, node] of this.nodes) {
        const neighbors = this.adjacencyList.get(nodeId);
        if (!neighbors) continue;

        const currentCommunity = nodeCommunity.get(nodeId)!;
        const neighborCommunities = new Map<string, number>();

        // 统计邻居社区的边权重
        for (const [neighborId, weight] of neighbors) {
          const neighborComm = nodeCommunity.get(neighborId);
          if (neighborComm) {
            neighborCommunities.set(neighborComm, (neighborCommunities.get(neighborComm) || 0) + weight);
          }
        }

        // 找到最佳社区
        let bestCommunity = currentCommunity;
        let bestWeight = neighborCommunities.get(currentCommunity) || 0;

        for (const [comm, weight] of neighborCommunities) {
          if (weight > bestWeight) {
            bestWeight = weight;
            bestCommunity = comm;
          }
        }

        // 移动节点
        if (bestCommunity !== currentCommunity) {
          // 从旧社区移除
          const oldComm = communities.find(c => c.id === currentCommunity);
          if (oldComm) {
            oldComm.members = oldComm.members.filter(id => id !== nodeId);
          }

          // 加入新社区
          let newComm = communities.find(c => c.id === bestCommunity);
          if (!newComm) {
            newComm = {
              id: bestCommunity,
              members: [],
              density: 0,
              influence: 0,
              leaders: [],
            };
            communities.push(newComm);
          }
          newComm.members.push(nodeId);
          nodeCommunity.set(nodeId, bestCommunity);
          improved = true;
        }
      }

      if (!improved) break;
    }

    // 计算社区属性
    for (const community of communities) {
      if (community.members.length === 0) continue;
      
      // 计算密度
      let internalEdges = 0;
      for (const memberId of community.members) {
        const neighbors = this.adjacencyList.get(memberId);
        if (neighbors) {
          for (const neighborId of neighbors.keys()) {
            if (community.members.includes(neighborId)) {
              internalEdges++;
            }
          }
        }
      }
      const maxEdges = community.members.length * (community.members.length - 1);
      community.density = maxEdges > 0 ? internalEdges / maxEdges : 0;

      // 计算影响力
      community.influence = community.members.length * community.density;

      // 识别领导者（连接数最多的）
      const connectionCounts = community.members.map(id => {
        const neighbors = this.adjacencyList.get(id);
        return { id, count: neighbors?.size || 0 };
      });
      connectionCounts.sort((a, b) => b.count - a.count);
      community.leaders = connectionCounts.slice(0, 3).map(c => c.id);
    }

    // 移除空社区
    this.communities.clear();
    for (const community of communities.filter(c => c.members.length > 0)) {
      this.communities.set(community.id, community);
    }

    return Array.from(this.communities.values());
  }

  /**
   * 识别关键节点（PageRank简化版）
   */
  public identifyKeyNodes(): Array<{ id: string; score: number }> {
    const scores = new Map<string, number>();
    const dampingFactor = 0.85;
    const iterations = 20;

    // 初始化
    for (const nodeId of this.nodes.keys()) {
      scores.set(nodeId, 1 / this.nodes.size);
    }

    // 迭代计算
    for (let iter = 0; iter < iterations; iter++) {
      const newScores = new Map<string, number>();
      let danglingSum = 0;

      // 计算悬挂节点贡献
      for (const [nodeId, node] of this.nodes) {
        const neighbors = this.adjacencyList.get(nodeId);
        if (!neighbors || neighbors.size === 0) {
          danglingSum += scores.get(nodeId)!;
        }
      }

      for (const [nodeId, node] of this.nodes) {
        let rank = (1 - dampingFactor) / this.nodes.size;
        rank += dampingFactor * danglingSum / this.nodes.size;

        const inNeighbors = this.edges.filter(e => e.target === nodeId);
        for (const edge of inNeighbors) {
          const outDegree = this.adjacencyList.get(edge.source)?.size || 1;
          rank += dampingFactor * scores.get(edge.source)! * edge.weight / outDegree;
        }

        newScores.set(nodeId, rank);
      }

      for (const [nodeId, score] of newScores) {
        scores.set(nodeId, score);
      }
    }

    return Array.from(scores.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * 预测信息传播
   */
  public predictInformationSpread(
    sourceId: string,
    depth: number = 3
  ): Map<string, number> {
    const reachability = new Map<string, number>();
    const visited = new Set<string>();

    const bfs = (currentId: string, currentDepth: number, probability: number) => {
      if (currentDepth > depth || probability < 0.01) return;

      visited.add(currentId);
      reachability.set(currentId, Math.max(reachability.get(currentId) || 0, probability));

      const neighbors = this.adjacencyList.get(currentId);
      if (!neighbors) return;

      for (const [neighborId, weight] of neighbors) {
        if (!visited.has(neighborId)) {
          const edge = this.edges.find(e => e.source === currentId && e.target === neighborId);
          const decayFactor = edge?.type === 'friend' ? 0.8 : 
                             edge?.type === 'work' ? 0.6 : 
                             edge?.type === 'follow' ? 0.4 : 0.3;
          bfs(neighborId, currentDepth + 1, probability * weight * decayFactor);
        }
      }
    };

    bfs(sourceId, 0, 1.0);
    return reachability;
  }

  /**
   * 情感传播（基于GNN）
   */
  public propagateEmotion(
    sourceId: string,
    emotionValue: number,
    threshold: number = 0.5
  ): Map<string, number> {
    const emotions = new Map<string, number>();
    emotions.set(sourceId, emotionValue);

    const iterations = 5;
    for (let iter = 0; iter < iterations; iter++) {
      const newEmotions = new Map(emotions);
      
      for (const [nodeId] of this.nodes) {
        const neighbors = this.adjacencyList.get(nodeId);
        if (!neighbors || neighbors.size === 0) continue;

        let weightedSum = 0;
        let totalWeight = 0;

        for (const [neighborId, weight] of neighbors) {
          const neighborEmotion = emotions.get(neighborId);
          if (neighborEmotion !== undefined) {
            weightedSum += neighborEmotion * weight;
            totalWeight += weight;
          }
        }

        if (totalWeight > 0) {
          const avgEmotion = weightedSum / totalWeight;
          const currentEmotion = emotions.get(nodeId) || 0;
          // 融合邻居情感
          const newEmotion = currentEmotion * 0.3 + avgEmotion * 0.7;
          newEmotions.set(nodeId, newEmotion);
        }
      }

      emotions.clear();
      for (const [id, emotion] of newEmotions) {
        emotions.set(id, emotion);
      }
    }

    // 过滤低于阈值的
    for (const [id, emotion] of emotions) {
      if (Math.abs(emotion) < threshold) {
        emotions.delete(id);
      }
    }

    return emotions;
  }

  /**
   * 获取节点嵌入相似度
   */
  public getEmbeddingSimilarity(nodeId1: string, nodeId2: string): number {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);
    if (!node1 || !node2) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < this.embeddingDim; i++) {
      dotProduct += node1.embedding[i] * node2.embedding[i];
      norm1 += node1.embedding[i] * node1.embedding[i];
      norm2 += node2.embedding[i] * node2.embedding[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) + 0.0001);
  }

  /**
   * 查找相似节点
   */
  public findSimilarNodes(nodeId: string, topK: number = 10): Array<{ id: string; similarity: number }> {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const similarities: Array<{ id: string; similarity: number }> = [];

    for (const [otherId] of this.nodes) {
      if (otherId !== nodeId) {
        const similarity = this.getEmbeddingSimilarity(nodeId, otherId);
        similarities.push({ id: otherId, similarity });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }

  /**
   * 获取所有社区
   */
  public getCommunities(): Community[] {
    return Array.from(this.communities.values());
  }

  /**
   * 获取图统计
   */
  public getGraphStats(): {
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
    density: number;
    communityCount: number;
  } {
    const nodeCount = this.nodes.size;
    let totalDegree = 0;

    for (const neighbors of this.adjacencyList.values()) {
      totalDegree += neighbors.size;
    }

    const avgDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;
    const maxEdges = nodeCount * (nodeCount - 1);
    const density = maxEdges > 0 ? this.edges.length / maxEdges : 0;

    return {
      nodeCount,
      edgeCount: this.edges.length,
      avgDegree,
      density,
      communityCount: this.communities.size,
    };
  }

  /**
   * 获取所有节点的嵌入向量
   * 用于 GNN 结果应用器
   */
  public getAllEmbeddings(): Map<string, number[]> {
    const embeddings = new Map<string, number[]>();
    for (const [id, node] of this.nodes) {
      embeddings.set(id, [...node.embedding]);
    }
    return embeddings;
  }

  /**
   * 获取所有节点的影响力分数
   * 基于 PageRank 和连接度
   */
  public getInfluenceScores(): Map<string, number> {
    const keyNodes = this.identifyKeyNodes();
    const scores = new Map<string, number>();
    
    // 从 PageRank 获取基础分数
    for (const { id, score } of keyNodes) {
      scores.set(id, score);
    }
    
    // 结合度中心性增强
    for (const [nodeId] of this.nodes) {
      const neighbors = this.adjacencyList.get(nodeId);
      const degree = neighbors?.size || 0;
      const pagerank = scores.get(nodeId) || 0;
      
      // 归一化影响力分数 (0-1)
      const maxDegree = Math.max(...Array.from(this.nodes.keys()).map(id => this.adjacencyList.get(id)?.size || 0));
      const normalizedDegree = maxDegree > 0 ? degree / maxDegree : 0;
      
      scores.set(nodeId, 0.6 * pagerank + 0.4 * normalizedDegree);
    }
    
    return scores;
  }

  /**
   * 获取社区分配
   * 返回节点 ID 到社区 ID 的映射
   */
  public getCommunityAssignments(): Map<string, number> {
    const assignments = new Map<string, number>();
    
    // 如果还没有社区，先检测
    if (this.communities.size === 0) {
      this.detectCommunities();
    }
    
    const communityArray = Array.from(this.communities.values());
    
    for (const [nodeId] of this.nodes) {
      for (let i = 0; i < communityArray.length; i++) {
        if (communityArray[i].members.includes(nodeId)) {
          assignments.set(nodeId, i);
          break;
        }
      }
    }
    
    return assignments;
  }

  /**
   * 获取关系预测
   * 预测节点之间可能的关系强度
   */
  public getRelationPredictions(): Map<string, Map<string, number>> {
    const predictions = new Map<string, Map<string, number>>();
    
    for (const [nodeId, node] of this.nodes) {
      const nodePredictions = new Map<string, number>();
      const neighbors = this.adjacencyList.get(nodeId);
      
      // 对每个其他节点预测关系强度
      for (const [otherId, otherNode] of this.nodes) {
        if (nodeId === otherId) continue;
        
        // 已有关系使用现有权重
        const existingWeight = neighbors?.get(otherId);
        if (existingWeight !== undefined) {
          nodePredictions.set(otherId, existingWeight);
          continue;
        }
        
        // 计算嵌入相似度
        const similarity = this.getEmbeddingSimilarity(nodeId, otherId);
        
        // 计算共同邻居数
        const nodeNeighbors = new Set(neighbors?.keys() || []);
        const otherNeighbors = new Set(this.adjacencyList.get(otherId)?.keys() || []);
        let commonNeighbors = 0;
        for (const n of nodeNeighbors) {
          if (otherNeighbors.has(n)) commonNeighbors++;
        }
        const jaccard = (nodeNeighbors.size + otherNeighbors.size) > 0
          ? commonNeighbors / (nodeNeighbors.size + otherNeighbors.size - commonNeighbors)
          : 0;
        
        // 综合预测
        const predictedStrength = 0.5 * similarity + 0.5 * jaccard;
        
        if (predictedStrength > 0.1) {
          nodePredictions.set(otherId, predictedStrength);
        }
      }
      
      predictions.set(nodeId, nodePredictions);
    }
    
    return predictions;
  }

  /**
   * 从供应链节点特征派生embedding
   */
  public deriveEmbeddingFromSupplyChain(features: SupplyChainNodeFeatures, dim: number = 64): number[] {
    const embedding: number[] = new Array(dim).fill(0);
    
    const normalizedCapacity = Math.min(features.capacity / 10000, 1);
    const normalizedLoad = features.currentLoad;
    const normalizedEfficiency = features.efficiency;
    const normalizedReliability = features.reliability;
    const normalizedInventory = Math.min(features.inventoryLevel / 1000, 1);
    const normalizedThroughput = Math.min(features.throughput / 500, 1);
    const normalizedLeadTime = Math.min(features.leadTime / 30, 1);
    const normalizedCost = Math.min(features.cost / 100, 1);
    const normalizedRisk = features.riskScore;
    
    const baseFeatures = [
      normalizedCapacity,
      normalizedLoad,
      normalizedEfficiency,
      normalizedReliability,
      normalizedInventory,
      normalizedThroughput,
      normalizedLeadTime,
      normalizedCost,
      normalizedRisk,
    ];
    
    for (let i = 0; i < Math.min(baseFeatures.length, dim); i++) {
      embedding[i] = baseFeatures[i];
    }
    
    const nodeTypeEncoding = this.encodeNodeType(features.nodeType);
    for (let i = 0; i < nodeTypeEncoding.length && baseFeatures.length + i < dim; i++) {
      embedding[baseFeatures.length + i] = nodeTypeEncoding[i];
    }
    
    for (let i = baseFeatures.length + nodeTypeEncoding.length; i < dim; i++) {
      const f1 = baseFeatures[i % baseFeatures.length];
      const f2 = baseFeatures[(i + 1) % baseFeatures.length];
      embedding[i] = (f1 * 0.6 + f2 * 0.4) * Math.sin(i * 0.15);
    }
    
    let norm = 0;
    for (let i = 0; i < dim; i++) {
      norm += embedding[i] * embedding[i];
    }
    norm = Math.sqrt(norm) + 0.0001;
    
    for (let i = 0; i < dim; i++) {
      embedding[i] /= norm;
    }
    
    return embedding;
  }

  /**
   * 编码节点类型为向量
   */
  private encodeNodeType(type: SupplyChainNodeType): number[] {
    const encoding: number[] = new Array(8).fill(0);
    const typeIndex = Object.values(SupplyChainNodeType).indexOf(type);
    if (typeIndex >= 0 && typeIndex < 8) {
      encoding[typeIndex] = 1;
    }
    return encoding;
  }

  /**
   * 添加供应链节点
   */
  public addSupplyChainNode(
    id: string,
    features: SupplyChainNodeFeatures,
    baseFeatures?: number[]
  ): void {
    const embedding = this.deriveEmbeddingFromSupplyChain(features);
    const node: GraphNode = {
      id,
      type: 'supply_chain_node',
      features: baseFeatures || embedding.slice(0, 10),
      embedding,
      supplyChainFeatures: features,
    };
    this.addNode(node);
  }

  /**
   * 添加供应链边
   */
  public addSupplyChainEdge(
    source: string,
    target: string,
    features: SupplyChainEdgeFeatures
  ): void {
    const weight = features.flowRate / Math.max(features.maxCapacity, 1) * features.reliability;
    const edge: GraphEdge = {
      source,
      target,
      weight,
      type: 'supply_chain_edge',
      supplyChainFeatures: features,
    };
    this.addEdge(edge);
  }

  /**
   * 检测供应链瓶颈
   */
  public detectSupplyChainBottlenecks(): Array<{
    nodeId: string;
    bottleneckType: 'capacity' | 'flow' | 'reliability' | 'lead_time';
    severity: number;
    impact: number;
    recommendations: string[];
  }> {
    const bottlenecks: Array<{
      nodeId: string;
      bottleneckType: 'capacity' | 'flow' | 'reliability' | 'lead_time';
      severity: number;
      impact: number;
      recommendations: string[];
    }> = [];

    for (const [nodeId, node] of this.nodes) {
      if (node.type !== 'supply_chain_node' || !node.supplyChainFeatures) continue;
      
      const features = node.supplyChainFeatures;
      const neighbors = this.adjacencyList.get(nodeId);
      const inDegree = this.getInDegree(nodeId);
      const outDegree = neighbors?.size || 0;

      if (features.currentLoad > 0.9) {
        bottlenecks.push({
          nodeId,
          bottleneckType: 'capacity',
          severity: (features.currentLoad - 0.9) / 0.1,
          impact: this.calculateNodeImpact(nodeId),
          recommendations: [
            '增加节点容量',
            '分流到其他节点',
            '优化处理流程',
            '考虑扩建设施',
          ],
        });
      }

      if (inDegree > 0 && outDegree === 0 && features.nodeType !== SupplyChainNodeType.CONSUMER) {
        bottlenecks.push({
          nodeId,
          bottleneckType: 'flow',
          severity: 0.8,
          impact: this.calculateNodeImpact(nodeId),
          recommendations: [
            '建立下游连接',
            '增加分销渠道',
            '优化库存管理',
          ],
        });
      }

      if (features.reliability < 0.7) {
        bottlenecks.push({
          nodeId,
          bottleneckType: 'reliability',
          severity: 1 - features.reliability,
          impact: this.calculateNodeImpact(nodeId),
          recommendations: [
            '维护设施设备',
            '建立备用系统',
            '提高质量控制',
            '培训操作人员',
          ],
        });
      }

      if (features.leadTime > 14) {
        bottlenecks.push({
          nodeId,
          bottleneckType: 'lead_time',
          severity: Math.min((features.leadTime - 14) / 16, 1),
          impact: this.calculateNodeImpact(nodeId),
          recommendations: [
            '优化物流路线',
            '增加仓储点',
            '改进预测模型',
            '与供应商协调',
          ],
        });
      }
    }

    return bottlenecks.sort((a, b) => b.severity * b.impact - a.severity * a.impact);
  }

  /**
   * 计算节点影响度
   */
  private calculateNodeImpact(nodeId: string): number {
    const visited = new Set<string>();
    const queue = [nodeId];
    let impact = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = this.adjacencyList.get(current);
      if (neighbors) {
        for (const [neighborId, weight] of neighbors) {
          impact += weight;
          if (!visited.has(neighborId)) {
            queue.push(neighborId);
          }
        }
      }
    }

    return Math.min(impact / 10, 1);
  }

  /**
   * 获取入度
   */
  private getInDegree(nodeId: string): number {
    let count = 0;
    for (const [, neighbors] of this.adjacencyList) {
      if (neighbors.has(nodeId)) count++;
    }
    return count;
  }

  /**
   * 分析供应链网络韧性
   */
  public analyzeSupplyChainResilience(): {
    overallResilience: number;
    criticalNodes: string[];
    redundantPaths: Map<string, number>;
    vulnerabilityScore: number;
  } {
    let totalResilience = 0;
    let nodeCount = 0;
    const criticalNodes: string[] = [];
    const redundantPaths = new Map<string, number>();
    let vulnerabilityScore = 0;

    for (const [nodeId, node] of this.nodes) {
      if (node.type !== 'supply_chain_node' || !node.supplyChainFeatures) continue;
      
      nodeCount++;
      const features = node.supplyChainFeatures;
      totalResilience += features.reliability;

      const inDegree = this.getInDegree(nodeId);
      const outDegree = this.adjacencyList.get(nodeId)?.size || 0;
      
      if (inDegree <= 1 && features.nodeType !== SupplyChainNodeType.SUPPLIER) {
        criticalNodes.push(nodeId);
        vulnerabilityScore += 0.2;
      }

      if (outDegree <= 1 && features.nodeType !== SupplyChainNodeType.CONSUMER) {
        if (!criticalNodes.includes(nodeId)) {
          criticalNodes.push(nodeId);
        }
        vulnerabilityScore += 0.15;
      }

      const paths = this.countRedundantPaths(nodeId);
      redundantPaths.set(nodeId, paths);
    }

    const overallResilience = nodeCount > 0 ? totalResilience / nodeCount : 0;
    vulnerabilityScore = Math.min(vulnerabilityScore, 1);

    return {
      overallResilience,
      criticalNodes,
      redundantPaths,
      vulnerabilityScore,
    };
  }

  /**
   * 计算冗余路径数量
   */
  private countRedundantPaths(nodeId: string): number {
    const neighbors = this.adjacencyList.get(nodeId);
    if (!neighbors) return 0;

    let pathCount = 0;
    for (const [neighborId] of neighbors) {
      const grandNeighbors = this.adjacencyList.get(neighborId);
      if (grandNeighbors && grandNeighbors.size > 1) {
        pathCount++;
      }
    }
    
    return pathCount;
  }

  /**
   * 优化供应链流量分配
   */
  public optimizeSupplyChainFlow(): Array<{
    edgeSource: string;
    edgeTarget: string;
    currentFlow: number;
    optimizedFlow: number;
    improvement: number;
  }> {
    const optimizations: Array<{
      edgeSource: string;
      edgeTarget: string;
      currentFlow: number;
      optimizedFlow: number;
      improvement: number;
    }> = [];

    for (const edge of this.edges) {
      if (edge.type !== 'supply_chain_edge' || !edge.supplyChainFeatures) continue;

      const features = edge.supplyChainFeatures;
      const utilization = features.flowRate / Math.max(features.maxCapacity, 1);

      let optimizedFlow = features.flowRate;
      
      if (utilization > 0.85) {
        optimizedFlow = features.maxCapacity * 0.9;
      } else if (utilization < 0.3) {
        const sourceNode = this.nodes.get(edge.source);
        if (sourceNode?.supplyChainFeatures && sourceNode.supplyChainFeatures.inventoryLevel > 100) {
          optimizedFlow = Math.min(
            features.maxCapacity * 0.7,
            sourceNode.supplyChainFeatures.inventoryLevel * 0.5
          );
        }
      }

      const improvement = Math.abs(optimizedFlow - features.flowRate) / Math.max(features.flowRate, 1);
      
      if (improvement > 0.1) {
        optimizations.push({
          edgeSource: edge.source,
          edgeTarget: edge.target,
          currentFlow: features.flowRate,
          optimizedFlow,
          improvement,
        });
      }
    }

    return optimizations.sort((a, b) => b.improvement - a.improvement);
  }

  /**
   * 预测供应链中断传播
   */
  public predictDisruptionPropagation(
    sourceNodeId: string,
    severity: number = 0.8
  ): Map<string, { probability: number; impactLevel: number; timeToReach: number }> {
    const propagation = new Map<string, { probability: number; impactLevel: number; timeToReach: number }>();
    const visited = new Set<string>();
    
    const queue: Array<{ nodeId: string; probability: number; impact: number; time: number }> = [
      { nodeId: sourceNodeId, probability: 1, impact: severity, time: 0 }
    ];

    while (queue.length > 0) {
      const { nodeId, probability, impact, time } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this.nodes.get(nodeId);
      const resilience = node?.supplyChainFeatures?.reliability || 0.5;
      const adjustedImpact = impact * (1 - resilience * 0.3);
      
      propagation.set(nodeId, {
        probability,
        impactLevel: adjustedImpact,
        timeToReach: time,
      });

      const neighbors = this.adjacencyList.get(nodeId);
      if (neighbors) {
        for (const [neighborId, weight] of neighbors) {
          if (!visited.has(neighborId)) {
            const edge = this.edges.find(e => e.source === nodeId && e.target === neighborId);
            const edgeReliability = edge?.supplyChainFeatures?.reliability || 0.8;
            const leadTime = edge?.supplyChainFeatures?.leadTime || 5;
            
            queue.push({
              nodeId: neighborId,
              probability: probability * weight * edgeReliability,
              impact: adjustedImpact * 0.8,
              time: time + leadTime,
            });
          }
        }
      }
    }

    return propagation;
  }

  /**
   * 获取供应链网络统计
   */
  public getSupplyChainStats(): {
    nodeCount: number;
    edgeCount: number;
    avgReliability: number;
    avgLeadTime: number;
    totalCapacity: number;
    totalThroughput: number;
    nodeTypeDistribution: Record<SupplyChainNodeType, number>;
  } {
    let nodeCount = 0;
    let edgeCount = 0;
    let totalReliability = 0;
    let totalLeadTime = 0;
    let totalCapacity = 0;
    let totalThroughput = 0;
    const nodeTypeDistribution: Record<SupplyChainNodeType, number> = {
      [SupplyChainNodeType.SUPPLIER]: 0,
      [SupplyChainNodeType.PRODUCER]: 0,
      [SupplyChainNodeType.DISTRIBUTOR]: 0,
      [SupplyChainNodeType.RETAILER]: 0,
      [SupplyChainNodeType.CONSUMER]: 0,
      [SupplyChainNodeType.WAREHOUSE]: 0,
      [SupplyChainNodeType.LOGISTICS]: 0,
    };

    for (const [, node] of this.nodes) {
      if (node.type !== 'supply_chain_node' || !node.supplyChainFeatures) continue;
      
      nodeCount++;
      const features = node.supplyChainFeatures;
      totalReliability += features.reliability;
      totalLeadTime += features.leadTime;
      totalCapacity += features.capacity;
      totalThroughput += features.throughput;
      nodeTypeDistribution[features.nodeType]++;
    }

    for (const edge of this.edges) {
      if (edge.type === 'supply_chain_edge') edgeCount++;
    }

    return {
      nodeCount,
      edgeCount,
      avgReliability: nodeCount > 0 ? totalReliability / nodeCount : 0,
      avgLeadTime: nodeCount > 0 ? totalLeadTime / nodeCount : 0,
      totalCapacity,
      totalThroughput,
      nodeTypeDistribution,
    };
  }

  /**
   * 清空图数据
   */
  public clear(): void {
    this.nodes.clear();
    this.edges = [];
    this.adjacencyList.clear();
    this.communities.clear();
  }
}

// 导出单例
export const socialGNN = new GraphNeuralNetwork();
export default socialGNN;
