import { CardData } from '../config/cardData';
import { GameMap } from '../config/mapData';
import { gameConfig } from '../config/gameConfig';

/**
 * 游戏运行状态接口
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

// 本地存储键名
const STORAGE_KEY = 'breakTower_savedGame';

/**
 * 游戏运行状态管理器
 * 管理游戏过程中的状态数据
 */
export default class RunStateManager {
    // 当前运行状态
    private currentRun: RunState | null = null;

    // 事件监听器
    private eventListeners: { [eventName: string]: Function[] } = {};

    // 单例模式
    private static instance: RunStateManager;

    /**
     * 获取单例实例
     */
    public static getInstance(): RunStateManager {
        if (!RunStateManager.instance) {
            RunStateManager.instance = new RunStateManager();
        }
        return RunStateManager.instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() {
        console.log('RunStateManager: 初始化');
        // 尝试从本地存储加载状态
        this.loadSavedRun();
    }

    /**
     * 创建新的运行
     * @param playerName 玩家名称
     * @param maxHp 最大生命值
     * @param startingDeck 初始卡组
     * @returns 创建的运行状态
     */
    createNewRun(playerName: string, maxHp: number, startingDeck: CardData[]): RunState {
        console.log(`RunStateManager: 创建新运行 - 玩家: ${playerName}, 生命值: ${maxHp}, 牌组: ${startingDeck.length}张牌`);

        const now = Date.now();

        this.currentRun = {
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

        // 触发创建事件
        this.triggerEvent('runCreated', this.currentRun);

        return this.currentRun;
    }

    /**
     * 获取当前运行状态
     * @returns 当前运行状态
     */
    getCurrentRun(): RunState | null {
        if (!this.currentRun) {
            console.warn('RunStateManager: 尝试获取运行状态，但当前无运行状态');
            return null;
        }
        return this.currentRun;
    }

    /**
     * 检查是否有当前运行状态
     * @returns 是否有当前运行状态
     */
    hasCurrentRun(): boolean {
        return this.currentRun !== null;
    }

    /**
     * 设置当前地图
     * @param map 地图
     * @returns 是否成功设置
     */
    setMap(map: GameMap): boolean {
        if (!this.currentRun) {
            console.error('RunStateManager: 尝试设置地图，但当前无运行状态');
            return false;
        }

        this.currentRun.map = map;
        this.currentRun.updatedAt = Date.now();

        this.triggerEvent('mapUpdated', map);

        // 自动保存
        this.saveCurrentRun();

        return true;
    }

    /**
     * 更新生命值
     * @param hpChange 生命值变化（正数为回复，负数为伤害）
     * @returns 当前生命值
     */
    updateHp(hpChange: number): number {
        if (!this.currentRun) {
            console.error('RunStateManager: 尝试更新生命值，但当前无运行状态');
            return 0;
        }

        const oldHp = this.currentRun.currentHp;
        this.currentRun.currentHp = Math.max(0, Math.min(this.currentRun.maxHp, this.currentRun.currentHp + hpChange));
        this.currentRun.updatedAt = Date.now();

        // 如果生命值变化，触发事件
        if (oldHp !== this.currentRun.currentHp) {
            this.triggerEvent('hpChanged', {
                oldHp,
                newHp: this.currentRun.currentHp,
                change: hpChange
            });

            // 自动保存
            this.saveCurrentRun();
        }

        return this.currentRun.currentHp;
    }

    /**
     * 更新最大生命值
     * @param maxHpChange 最大生命值变化
     * @returns 当前最大生命值
     */
    updateMaxHp(maxHpChange: number): number {
        if (!this.currentRun) {
            console.error('RunStateManager: 尝试更新最大生命值，但当前无运行状态');
            return 0;
        }

        const oldMaxHp = this.currentRun.maxHp;
        this.currentRun.maxHp = Math.max(1, this.currentRun.maxHp + maxHpChange);
        this.currentRun.updatedAt = Date.now();

        // 如果生命值大于最大生命值，调整为最大生命值
        if (this.currentRun.currentHp > this.currentRun.maxHp) {
            this.currentRun.currentHp = this.currentRun.maxHp;
        }

        // 如果最大生命值变化，触发事件
        if (oldMaxHp !== this.currentRun.maxHp) {
            this.triggerEvent('maxHpChanged', {
                oldMaxHp,
                newMaxHp: this.currentRun.maxHp,
                change: maxHpChange
            });

            // 自动保存
            this.saveCurrentRun();
        }

        return this.currentRun.maxHp;
    }

    /**
     * 更新金币
     * @param goldChange 金币变化（正数为获得，负数为消费）
     * @returns 当前金币
     */
    updateGold(goldChange: number): number {
        if (!this.currentRun) {
            console.error('RunStateManager: 尝试更新金币，但当前无运行状态');
            return 0;
        }

        const oldGold = this.currentRun.gold;
        this.currentRun.gold = Math.max(0, this.currentRun.gold + goldChange);
        this.currentRun.updatedAt = Date.now();

        // 如果金币变化，触发事件
        if (oldGold !== this.currentRun.gold) {
            this.triggerEvent('goldChanged', {
                oldGold,
                newGold: this.currentRun.gold,
                change: goldChange
            });

            // 自动保存
            this.saveCurrentRun();
        }

        return this.currentRun.gold;
    }

    /**
     * 添加卡牌到卡组
     * @param card 卡牌数据
     * @returns 是否成功添加
     */
    addCard(card: CardData): boolean {
        if (!this.currentRun) {
            console.error('RunStateManager: 尝试添加卡牌，但当前无运行状态');
            return false;
        }

        this.currentRun.deck.push({ ...card });
        this.currentRun.updatedAt = Date.now();

        this.triggerEvent('cardAdded', card);

        // 自动保存
        this.saveCurrentRun();

        return true;
    }

    /**
     * 移除卡牌
     * @param cardId 卡牌ID
     * @returns 是否成功移除
     */
    removeCard(cardId: string): boolean {
        if (!this.currentRun) {
            console.error('RunStateManager: 尝试移除卡牌，但当前无运行状态');
            return false;
        }

        const index = this.currentRun.deck.findIndex(card => card.id === cardId);
        if (index === -1) return false;

        const removedCard = this.currentRun.deck.splice(index, 1)[0];
        this.currentRun.updatedAt = Date.now();

        this.triggerEvent('cardRemoved', removedCard);

        // 自动保存
        this.saveCurrentRun();

        return true;
    }

    /**
     * 获取当前卡组
     * @returns 当前卡组
     */
    getDeck(): CardData[] {
        if (!this.currentRun) {
            console.warn('RunStateManager: 尝试获取卡组，但当前无运行状态');
            return [];
        }
        return [...this.currentRun.deck];
    }

    /**
     * 更新当前层数
     * @param floor 层数
     */
    updateFloor(floor: number): void {
        if (!this.currentRun) {
            console.error('RunStateManager: 尝试更新层数，但当前无运行状态');
            return;
        }

        const oldFloor = this.currentRun.currentFloor;
        this.currentRun.currentFloor = floor;
        this.currentRun.updatedAt = Date.now();

        this.triggerEvent('floorChanged', {
            oldFloor,
            newFloor: floor
        });

        // 自动保存
        this.saveCurrentRun();
    }

    /**
     * 保存当前运行状态
     * @returns 是否成功保存
     */
    saveCurrentRun(): boolean {
        if (!this.currentRun) {
            console.warn('RunStateManager: 尝试保存运行状态，但当前无运行状态');
            return false;
        }

        try {
            // 将运行状态转换为JSON
            const json = JSON.stringify(this.currentRun);

            // 保存到本地存储
            localStorage.setItem(STORAGE_KEY, json);

            console.log('RunStateManager: 保存运行状态成功');
            return true;
        } catch (error) {
            console.error('RunStateManager: 保存运行状态失败:', error);
            return false;
        }
    }

    /**
     * 加载保存的运行状态
     * @returns 是否成功加载
     */
    loadSavedRun(): boolean {
        try {
            // 从本地存储获取JSON
            const json = localStorage.getItem(STORAGE_KEY);

            if (!json) {
                console.log('RunStateManager: 没有找到保存的运行状态');
                return false;
            }

            // 解析JSON
            const data = JSON.parse(json);

            // 设置当前运行状态
            this.currentRun = data;

            console.log('RunStateManager: 加载运行状态成功');
            this.triggerEvent('runLoaded', this.currentRun);

            return true;
        } catch (error) {
            console.error('RunStateManager: 加载运行状态失败:', error);
            return false;
        }
    }

    /**
     * 删除保存的运行状态
     */
    deleteSavedRun(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
            this.currentRun = null;

            console.log('RunStateManager: 删除运行状态成功');
            this.triggerEvent('runDeleted', null);
        } catch (error) {
            console.error('RunStateManager: 删除运行状态失败:', error);
        }
    }

    /**
     * 检查是否有保存的运行状态
     * @returns 是否有保存的运行状态
     */
    hasSavedRun(): boolean {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }

    /**
     * 添加事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    addEventListener(eventName: string, callback: Function): void {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }

        this.eventListeners[eventName].push(callback);
    }

    /**
     * 移除事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    removeEventListener(eventName: string, callback: Function): void {
        if (!this.eventListeners[eventName]) return;

        const index = this.eventListeners[eventName].indexOf(callback);
        if (index !== -1) {
            this.eventListeners[eventName].splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param data 事件数据
     */
    private triggerEvent(eventName: string, data: any): void {
        if (!this.eventListeners[eventName]) return;

        for (const callback of this.eventListeners[eventName]) {
            try {
                callback(data);
            } catch (error) {
                console.error(`RunStateManager: 事件回调执行错误 (${eventName}):`, error);
            }
        }
    }
} 