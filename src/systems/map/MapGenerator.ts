import { NodeType, NodeStatus } from '../../core/types';
import {
    MapLevel,
    MapNode,
    MapPath,
    GameMap,
    MAP_CONFIG,
    getRandomNodeType,
    getRandomNodeCount,
    createNewMap
} from './MapData';

/**
 * 地图生成器类
 * 用于生成随机地图
 */
export class MapGenerator {
    /**
     * 生成随机地图
     * @returns 生成的地图
     */
    generateMap(): GameMap {
        console.log('MapGenerator: 开始生成随机地图');

        // 初始化地图
        const map = createNewMap();
        console.log('MapGenerator: 初始化地图数据');

        // 生成各层节点
        this.generateNodes(map);
        console.log(`MapGenerator: 生成节点完成，共 ${map.nodes.length} 个节点`);

        // 生成节点间的连接
        this.generatePaths(map);
        console.log(`MapGenerator: 生成路径完成，共 ${map.paths.length} 条路径`);

        // 不自动设置起始节点为玩家位置，而是留给玩家选择
        // 检查是否有起始节点
        const startNodes = map.nodes.filter(node => node.level === MapLevel.START);
        if (startNodes.length > 0) {
            console.log(`MapGenerator: 找到 ${startNodes.length} 个起始节点，等待玩家选择`);
            // 不设置玩家位置，留空字符串
            map.playerPosition = '';
        } else {
            console.error('MapGenerator: 未找到起始节点');
        }

        // 设置可访问的节点状态
        this.updateNodeStatus(map);
        console.log('MapGenerator: 更新节点状态完成');

        return map;
    }

    /**
     * 生成各层节点
     * @param map 地图
     */
    private generateNodes(map: GameMap): void {
        console.log('MapGenerator: 开始生成各层节点');

        // 生成每一层的节点
        for (let level = MapLevel.START; level <= MapLevel.BOSS; level++) {
            console.log(`MapGenerator: 生成第 ${level} 层节点`);
            const nodeCount = getRandomNodeCount(level);
            console.log(`MapGenerator: 第 ${level} 层将生成 ${nodeCount} 个节点`);

            // 特殊处理：获取这层必须包含的节点类型
            const requiredTypes = MAP_CONFIG.SPECIAL_RULES.REQUIRED_NODES[level as keyof typeof MAP_CONFIG.SPECIAL_RULES.REQUIRED_NODES] || [];
            if (requiredTypes.length > 0) {
                console.log(`MapGenerator: 第 ${level} 层必须包含节点类型: ${requiredTypes.join(', ')}`);
            }

            // 存储已经生成的节点类型计数
            const typeCount: Record<NodeType, number> = {
                [NodeType.BATTLE]: 0,
                [NodeType.ELITE]: 0,
                [NodeType.REST]: 0,
                [NodeType.EVENT]: 0,
                [NodeType.SHOP]: 0,
                [NodeType.BOSS]: 0
            };

            // 生成该层的节点
            for (let i = 0; i < nodeCount; i++) {
                let nodeType: NodeType;

                // 如果是Boss层，节点类型固定为Boss
                if (level === MapLevel.BOSS) {
                    nodeType = NodeType.BOSS;
                    console.log('MapGenerator: Boss层节点类型固定为Boss');
                }
                // 如果有必须包含的节点类型且还未满足
                else if (requiredTypes.length > 0 && requiredTypes.some((type: NodeType) => typeCount[type] === 0)) {
                    // 找到第一个未满足的必需类型
                    nodeType = requiredTypes.find((type: NodeType) => typeCount[type] === 0) || NodeType.BATTLE;
                    console.log(`MapGenerator: 满足必须包含的节点类型 ${nodeType}`);
                }
                // 否则随机生成节点类型
                else {
                    nodeType = getRandomNodeType();
                    console.log(`MapGenerator: 随机生成节点类型 ${nodeType}`);
                }

                // 更新节点类型计数
                typeCount[nodeType]++;

                // 计算节点坐标
                const x = this.calculateNodeX(level, i, nodeCount);
                const y = this.calculateNodeY(level);

                // 创建节点
                const node: MapNode = {
                    id: `node_${level}_${i}`,
                    type: nodeType,
                    x,
                    y,
                    level,
                    status: NodeStatus.UNAVAILABLE,
                    connections: []
                };
                console.log(`MapGenerator: 创建节点 ${node.id}, 类型: ${node.type}, 坐标: (${x}, ${y})`);

                // 添加到地图
                map.nodes.push(node);
            }
            console.log(`MapGenerator: 第 ${level} 层节点生成完成，各类型数量:`, typeCount);
        }
    }

    /**
     * 生成节点间的连接路径
     * @param map 地图
     */
    private generatePaths(map: GameMap): void {
        console.log('MapGenerator: 开始生成节点间的连接路径');

        // 对于每一层（除了Boss层）
        for (let level = MapLevel.START; level < MapLevel.BOSS; level++) {
            console.log(`MapGenerator: 生成第 ${level} 层到第 ${level + 1} 层的连接`);

            // 获取当前层的所有节点
            const currentLevelNodes = map.nodes.filter(node => node.level === level);
            console.log(`MapGenerator: 第 ${level} 层有 ${currentLevelNodes.length} 个节点`);

            // 获取下一层的所有节点
            const nextLevelNodes = map.nodes.filter(node => node.level === level + 1);
            console.log(`MapGenerator: 第 ${level + 1} 层有 ${nextLevelNodes.length} 个节点`);

            // 如果下一层没有节点，跳过
            if (nextLevelNodes.length === 0) {
                console.log(`MapGenerator: 第 ${level + 1} 层没有节点，跳过路径生成`);
                continue;
            }

            // 为当前层的每个节点生成到下一层的连接
            for (const sourceNode of currentLevelNodes) {
                console.log(`MapGenerator: 为节点 ${sourceNode.id} 生成连接`);

                // 确定要连接的节点数量
                const connectionCount = this.getRandomConnectionCount(
                    nextLevelNodes.length,
                    MAP_CONFIG.SPECIAL_RULES.CONNECTIONS.min,
                    MAP_CONFIG.SPECIAL_RULES.CONNECTIONS.max
                );
                console.log(`MapGenerator: 节点 ${sourceNode.id} 将连接到 ${connectionCount} 个下层节点`);

                // 特殊处理：如果下一层是Boss层，所有上一层节点都连接到Boss节点
                if (level + 1 === MapLevel.BOSS) {
                    const bossNode = nextLevelNodes[0];
                    console.log(`MapGenerator: 连接节点 ${sourceNode.id} 到Boss节点 ${bossNode.id}`);
                    this.createPath(map, sourceNode, bossNode);
                    continue;
                }

                // 计算可能的连接目标（根据x坐标的距离排序）
                const possibleTargets = [...nextLevelNodes].sort((a, b) => {
                    const distA = Math.abs(a.x - sourceNode.x);
                    const distB = Math.abs(b.x - sourceNode.x);
                    return distA - distB;
                });

                // 选择最近的几个节点作为连接目标
                const targetNodes = possibleTargets.slice(0, connectionCount);
                console.log(`MapGenerator: 为节点 ${sourceNode.id} 选择了 ${targetNodes.length} 个目标节点`);

                // 创建连接
                for (const targetNode of targetNodes) {
                    console.log(`MapGenerator: 创建连接 ${sourceNode.id} -> ${targetNode.id}`);
                    this.createPath(map, sourceNode, targetNode);
                }
            }

            // 确保下一层的每个节点都至少有一个连接
            for (const targetNode of nextLevelNodes) {
                if (!map.paths.some(path => path.targetId === targetNode.id)) {
                    console.log(`MapGenerator: 节点 ${targetNode.id} 没有连接，添加额外连接`);

                    // 找到距离最近的上层节点
                    const closestSourceNode = currentLevelNodes.reduce((closest, node) => {
                        const currentDist = Math.abs(node.x - targetNode.x);
                        const closestDist = closest ? Math.abs(closest.x - targetNode.x) : Infinity;
                        return currentDist < closestDist ? node : closest;
                    }, null as MapNode | null);

                    if (closestSourceNode) {
                        console.log(`MapGenerator: 连接最近的节点 ${closestSourceNode.id} -> ${targetNode.id}`);
                        this.createPath(map, closestSourceNode, targetNode);
                    }
                }
            }

            console.log(`MapGenerator: 第 ${level} 层到第 ${level + 1} 层的连接生成完成`);
        }

        console.log('MapGenerator: 所有路径生成完成');
    }

    /**
     * 创建两个节点之间的路径
     * @param map 地图
     * @param sourceNode 源节点
     * @param targetNode 目标节点
     */
    private createPath(map: GameMap, sourceNode: MapNode, targetNode: MapNode): void {
        // 检查是否已存在路径
        if (map.paths.some(path =>
            path.sourceId === sourceNode.id && path.targetId === targetNode.id
        )) {
            return;
        }

        // 创建路径
        const path: MapPath = {
            id: `path_${sourceNode.id}_${targetNode.id}`,
            sourceId: sourceNode.id,
            targetId: targetNode.id,
            status: NodeStatus.UNAVAILABLE
        };

        // 添加到地图
        map.paths.push(path);

        // 更新节点的连接
        sourceNode.connections.push(targetNode.id);
    }

    /**
     * 更新节点状态
     * 将起始节点的下一层节点设置为可用
     * 如果是游戏开始，则将所有起始节点设置为可用
     * @param map 地图
     */
    updateNodeStatus(map: GameMap): void {
        console.log('MapGenerator: 开始更新节点状态');

        // 特殊情况：如果玩家位置为空，说明是游戏初始状态
        // 将所有起始层节点设置为可用
        if (!map.playerPosition) {
            console.log('MapGenerator: 玩家位置为空，设置所有起始层节点为可用');

            // 获取所有起始层节点
            const startNodes = map.nodes.filter(node => node.level === MapLevel.START);
            console.log(`MapGenerator: 找到 ${startNodes.length} 个起始层节点`);

            // 将所有起始层节点设置为可用
            for (const node of startNodes) {
                node.status = NodeStatus.AVAILABLE;
                console.log(`MapGenerator: 设置起始节点 ${node.id} 状态为 ${node.status}`);
            }

            console.log('MapGenerator: 起始节点状态更新完成');
            return;
        }

        // 获取玩家当前位置的节点
        const playerNode = map.nodes.find(node => node.id === map.playerPosition);
        if (!playerNode) {
            console.error('MapGenerator: 找不到玩家位置节点，无法更新节点状态');
            return;
        }

        console.log(`MapGenerator: 玩家当前位置: ${playerNode.id}, 连接数: ${playerNode.connections.length}`);

        // 找到当前节点连接的所有节点
        for (const connectionId of playerNode.connections) {
            const connectedNode = map.nodes.find(node => node.id === connectionId);
            if (connectedNode) {
                // 设置节点为可用
                connectedNode.status = NodeStatus.AVAILABLE;
                console.log(`MapGenerator: 设置节点 ${connectedNode.id} 状态为 ${connectedNode.status}`);

                // 设置路径为可用
                const path = map.paths.find(p => p.sourceId === playerNode.id && p.targetId === connectionId);
                if (path) {
                    path.status = NodeStatus.AVAILABLE;
                    console.log(`MapGenerator: 设置路径 ${path.id} 状态为 ${path.status}`);
                }
            }
        }

        console.log('MapGenerator: 节点状态更新完成');
    }

    /**
     * 计算节点的X坐标
     * @param level 层级
     * @param index 该层中的索引
     * @param count 该层的节点总数
     * @returns X坐标
     */
    private calculateNodeX(level: MapLevel, index: number, count: number): number {
        // 如果只有一个节点，放在中间
        if (count === 1) {
            return MAP_CONFIG.UI.LEVEL_WIDTH / 2;
        }

        // 计算节点间隔
        const spacing = MAP_CONFIG.UI.LEVEL_WIDTH / (count + 1);

        // 计算基本X坐标
        let x = spacing * (index + 1);

        // 添加小幅度的随机偏移，使节点分布更自然
        // 但不要偏移太多，避免节点重叠
        const maxOffset = spacing * 0.2; // 最大偏移为间隔的20%
        const randomOffset = (Math.random() * 2 - 1) * maxOffset; // -maxOffset 到 +maxOffset 之间

        // 对第一层和最后一层不进行偏移，保持整齐
        if (level === MapLevel.START || level === MapLevel.BOSS) {
            return x;
        }

        return x + randomOffset;
    }

    /**
     * 计算节点的Y坐标
     * @param level 层级
     * @returns Y坐标
     */
    private calculateNodeY(level: MapLevel): number {
        // 基础Y坐标
        const baseY = MAP_CONFIG.UI.LEVEL_SPACING * level + 150; // 增加基础偏移，给顶部留出更多空间

        // 对第一层和最后一层不进行偏移，保持整齐
        if (level === MapLevel.START || level === MapLevel.BOSS) {
            return baseY;
        }

        // 添加小幅度的随机偏移，使节点分布更自然
        const maxOffset = MAP_CONFIG.UI.LEVEL_SPACING * 0.1; // 最大偏移为层间距的10%
        const randomOffset = (Math.random() * 2 - 1) * maxOffset; // -maxOffset 到 +maxOffset 之间

        return baseY + randomOffset;
    }

    /**
     * 获取随机连接数量
     * @param maxTargets 可用目标节点的最大数量
     * @param minConnections 最小连接数
     * @param maxConnections 最大连接数
     * @returns 连接数量
     */
    private getRandomConnectionCount(maxTargets: number, minConnections: number, maxConnections: number): number {
        // 连接数不能超过目标节点数量
        const max = Math.min(maxTargets, maxConnections);
        const min = Math.min(maxTargets, minConnections);

        // 在范围内随机选择
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 移动玩家到新节点
     * @param map 地图
     * @param targetNodeId 目标节点ID
     * @returns 是否移动成功
     */
    movePlayer(map: GameMap, targetNodeId: string): boolean {
        // 获取目标节点
        const targetNode = map.nodes.find(node => node.id === targetNodeId);
        if (!targetNode || targetNode.status !== NodeStatus.AVAILABLE) {
            return false;
        }

        // 获取玩家当前位置的节点
        const playerNode = map.nodes.find(node => node.id === map.playerPosition);
        if (!playerNode) return false;

        // 检查目标节点是否在当前节点的连接中
        if (!playerNode.connections.includes(targetNodeId)) {
            return false;
        }

        // 更新玩家位置
        map.playerPosition = targetNodeId;
        map.currentLevel = targetNode.level;

        // 更新节点状态
        targetNode.status = NodeStatus.COMPLETED;

        // 更新路径状态
        const path = map.paths.find(p => p.sourceId === playerNode.id && p.targetId === targetNodeId);
        if (path) {
            path.status = NodeStatus.COMPLETED;
        }

        // 重置所有节点和路径状态，然后更新可用节点
        this.resetNodeStatus(map);
        this.updateNodeStatus(map);

        return true;
    }

    /**
     * 重置所有节点和路径状态
     * @param map 地图
     */
    private resetNodeStatus(map: GameMap): void {
        // 重置所有未完成节点为不可用
        for (const node of map.nodes) {
            if (node.status !== NodeStatus.COMPLETED) {
                node.status = NodeStatus.UNAVAILABLE;
            }
        }

        // 重置所有未完成路径为不可用
        for (const path of map.paths) {
            if (path.status !== NodeStatus.COMPLETED) {
                path.status = NodeStatus.UNAVAILABLE;
            }
        }
    }
}