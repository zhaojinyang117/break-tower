import { CardData } from '../systems/card/CardData';
import { GameMap } from '../systems/map/MapData';

/**
 * 游戏运行状态接口
 * 表示一次游戏运行的状态数据
 */
export interface RunState {
    id: string;                // 运行ID
    playerName: string;        // 玩家名称
    maxHp: number;             // 最大生命值
    currentHp: number;         // 当前生命值
    gold: number;              // 金币
    deck: CardData[];          // 卡组
    map: GameMap | null;       // 当前地图
    currentFloor: number;      // 当前层数
    potions: any[];            // 药水（待实现）
    relics: any[];             // 遗物（待实现）
    createdAt: number;         // 创建时间
    updatedAt: number;         // 最后更新时间
}

/**
 * 创建新的运行状态
 * @param playerName 玩家名称
 * @param maxHp 最大生命值
 * @param startingDeck 初始卡组
 * @returns 新的运行状态
 */
export function createNewRunState(playerName: string, maxHp: number, startingDeck: CardData[]): RunState {
    const now = Date.now();
    
    return {
        id: `run_${now}`,
        playerName,
        maxHp,
        currentHp: maxHp,
        gold: 0,
        deck: [...startingDeck],
        map: null,
        currentFloor: 1,
        potions: [],
        relics: [],
        createdAt: now,
        updatedAt: now
    };
}