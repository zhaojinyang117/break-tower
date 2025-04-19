import { NodeType, NodeStatus } from '../../core/types';

/**
 * 地图层级
 * 表示每层有多少个节点
 */
export enum MapLevel {
    START = 0,
    LEVEL_1 = 1,
    LEVEL_2 = 2,
    LEVEL_3 = 3,
    LEVEL_4 = 4,
    LEVEL_5 = 5,
    LEVEL_6 = 6,
    LEVEL_7 = 7,
    BOSS = 8
}

/**
 * 节点接口
 */
export interface MapNode {
    id: string;               // 节点唯一标识
    type: NodeType;           // 节点类型
    x: number;                // 节点x坐标
    y: number;                // 节点y坐标
    level: MapLevel;          // 节点所在层级
    status: NodeStatus;       // 节点状态
    connections: string[];    // 连接到的节点ID
    data?: any;               // 节点相关数据（如战斗敌人ID等）
}

/**
 * 路径接口
 */
export interface MapPath {
    id: string;               // 路径唯一标识
    sourceId: string;         // 起始节点ID
    targetId: string;         // 目标节点ID
    status: NodeStatus;       // 路径状态
}

/**
 * 地图接口
 */
export interface GameMap {
    id: string;               // 地图唯一标识
    nodes: MapNode[];         // 地图节点
    paths: MapPath[];         // 地图路径
    playerPosition: string;   // 玩家当前位置（节点ID）
    currentLevel: MapLevel;   // 当前层级
}

/**
 * 地图配置常量
 */
export const MAP_CONFIG = {
    // 每层节点数范围
    NODE_COUNT: {
        [MapLevel.START]: 1,            // 起始层固定1个节点
        [MapLevel.LEVEL_1]: { min: 2, max: 3 },
        [MapLevel.LEVEL_2]: { min: 2, max: 4 },
        [MapLevel.LEVEL_3]: { min: 2, max: 4 },
        [MapLevel.LEVEL_4]: { min: 2, max: 4 },
        [MapLevel.LEVEL_5]: { min: 2, max: 3 },
        [MapLevel.LEVEL_6]: { min: 1, max: 3 },
        [MapLevel.LEVEL_7]: { min: 1, max: 2 },
        [MapLevel.BOSS]: 1              // Boss层固定1个节点
    },

    // 节点类型分布
    NODE_DISTRIBUTION: {
        [NodeType.BATTLE]: { weight: 65 },  // 65%概率是战斗节点
        [NodeType.ELITE]: { weight: 8 },    // 8%概率是精英节点
        [NodeType.REST]: { weight: 12 },    // 12%概率是休息节点
        [NodeType.EVENT]: { weight: 10 },   // 10%概率是事件节点
        [NodeType.SHOP]: { weight: 5 },     // 5%概率是商店节点
        [NodeType.BOSS]: { weight: 0 }      // Boss节点不随机生成
    },

    // 特殊规则
    SPECIAL_RULES: {
        // 每层必须包含的节点类型
        REQUIRED_NODES: {
            [MapLevel.LEVEL_2]: [NodeType.REST],  // 第2层必须有一个休息节点
            [MapLevel.LEVEL_5]: [NodeType.REST],  // 第5层必须有一个休息节点
            [MapLevel.LEVEL_7]: [NodeType.REST]   // 第7层必须有一个休息节点
        },

        // Boss前必须是休息节点
        BOSS_REQUIRES_REST: true,

        // 节点连接数范围
        CONNECTIONS: {
            min: 1,  // 每个节点至少连接到下一层的1个节点
            max: 3   // 每个节点最多连接到下一层的3个节点
        }
    },

    // 地图UI配置
    UI: {
        // 节点大小
        NODE_SIZE: {
            width: 80,
            height: 80
        },

        // 层级间距
        LEVEL_SPACING: 120,

        // 每层节点横向分布范围
        LEVEL_WIDTH: 800
    }
};

/**
 * 获取随机节点类型
 * 按照权重随机选择一个节点类型
 * @param excludedTypes 排除的节点类型
 * @returns 随机节点类型
 */
export function getRandomNodeType(excludedTypes: NodeType[] = []): NodeType {
    // 过滤掉排除的类型
    const availableTypes = Object.values(NodeType).filter(
        type => !excludedTypes.includes(type) && type !== NodeType.BOSS
    );

    // 计算总权重
    let totalWeight = 0;
    availableTypes.forEach(type => {
        if (MAP_CONFIG.NODE_DISTRIBUTION[type]) {
            totalWeight += MAP_CONFIG.NODE_DISTRIBUTION[type].weight;
        }
    });

    // 生成随机值
    const random = Math.random() * totalWeight;

    // 根据权重选择节点类型
    let accWeight = 0;
    for (const type of availableTypes) {
        accWeight += MAP_CONFIG.NODE_DISTRIBUTION[type].weight;
        if (random < accWeight) {
            return type;
        }
    }

    // 默认返回战斗节点
    return NodeType.BATTLE;
}

/**
 * 获取随机节点数量
 * 在指定层级的min-max范围内随机选择一个数量
 * @param level 地图层级
 * @returns 随机节点数量
 */
export function getRandomNodeCount(level: MapLevel): number {
    const range = MAP_CONFIG.NODE_COUNT[level];

    // 如果是固定数量，直接返回
    if (typeof range === 'number') {
        return range;
    }

    // 在范围内随机选择
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

/**
 * 创建新的地图
 * @returns 新的地图对象
 */
export function createNewMap(): GameMap {
    const mapId = `map_${Date.now()}`;
    
    return {
        id: mapId,
        nodes: [],
        paths: [],
        playerPosition: '',
        currentLevel: MapLevel.START
    };
}