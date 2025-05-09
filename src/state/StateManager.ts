import { gameConfig } from '../core/config';
import { CardData } from '../systems/card/CardData';
import { GameMap } from '../systems/map/MapData';
import { createNewRunState, RunState } from './RunState';
import { StorageManager } from './StorageManager';

/**
 * 状态管理器
 * 管理游戏运行状态和事件
 */
export class StateManager {
    // 当前运行状态
    private currentRun: RunState | null = null;

    // 事件监听器
    private eventListeners: { [eventName: string]: Function[] } = {};

    // 单例模式
    private static instance: StateManager;

    /**
     * 获取单例实例
     */
    public static getInstance(): StateManager {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() {
        console.log('StateManager: 初始化');
        // 尝试从存储加载状态
        this.initializeAsync();
    }

    /**
     * 异步初始化
     */
    private async initializeAsync(): Promise<void> {
        try {
            // 尝试加载保存的运行状态
            await this.loadSavedRun();
        } catch (error) {
            console.error('StateManager: 异步初始化失败:', error);
        }
    }

    /**
     * 创建新的运行
     * @param playerName 玩家名称
     * @param maxHp 最大生命值
     * @param startingDeck 初始卡组
     * @returns 创建的运行状态
     */
    createNewRun(playerName: string, maxHp: number, startingDeck: CardData[]): RunState {
        console.log(`StateManager: 创建新运行 - 玩家: ${playerName}, 生命值: ${maxHp}, 牌组: ${startingDeck.length}张牌`);

        this.currentRun = createNewRunState(playerName, maxHp, startingDeck);

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
            console.warn('StateManager: 尝试获取运行状态，但当前无运行状态');
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
            console.error('StateManager: 尝试设置地图，但当前无运行状态');
            return false;
        }

        this.currentRun.map = map;
        this.currentRun.updatedAt = Date.now();

        this.triggerEvent('mapUpdated', map);

        // 自动保存
        if (gameConfig.STORAGE.AUTO_SAVE) {
            void this.saveCurrentRun();
        }

        return true;
    }

    /**
     * 更新生命值
     * @param hpChange 生命值变化（正数为回复，负数为伤害）
     * @returns 当前生命值
     */
    updateHp(hpChange: number): number {
        if (!this.currentRun) {
            console.error('StateManager: 尝试更新生命值，但当前无运行状态');
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
            if (gameConfig.STORAGE.AUTO_SAVE) {
                void this.saveCurrentRun();
            }
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
            console.error('StateManager: 尝试更新最大生命值，但当前无运行状态');
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
            if (gameConfig.STORAGE.AUTO_SAVE) {
                void this.saveCurrentRun();
            }
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
            console.error('StateManager: 尝试更新金币，但当前无运行状态');
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
            if (gameConfig.STORAGE.AUTO_SAVE) {
                void this.saveCurrentRun();
            }
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
            console.error('StateManager: 尝试添加卡牌，但当前无运行状态');
            return false;
        }

        this.currentRun.deck.push({ ...card });
        this.currentRun.updatedAt = Date.now();

        this.triggerEvent('cardAdded', card);

        // 自动保存
        if (gameConfig.STORAGE.AUTO_SAVE) {
            void this.saveCurrentRun();
        }

        return true;
    }

    /**
     * 移除卡牌
     * @param cardId 卡牌ID
     * @returns 是否成功移除
     */
    removeCard(cardId: string): boolean {
        if (!this.currentRun) {
            console.error('StateManager: 尝试移除卡牌，但当前无运行状态');
            return false;
        }

        const index = this.currentRun.deck.findIndex(card => card.id === cardId);
        if (index === -1) return false;

        const removedCard = this.currentRun.deck.splice(index, 1)[0];
        this.currentRun.updatedAt = Date.now();

        this.triggerEvent('cardRemoved', removedCard);

        // 自动保存
        if (gameConfig.STORAGE.AUTO_SAVE) {
            void this.saveCurrentRun();
        }

        return true;
    }

    /**
     * 获取当前卡组
     * @returns 当前卡组
     */
    getDeck(): CardData[] {
        if (!this.currentRun) {
            console.warn('StateManager: 尝试获取卡组，但当前无运行状态');
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
            console.error('StateManager: 尝试更新层数，但当前无运行状态');
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
        if (gameConfig.STORAGE.AUTO_SAVE) {
            void this.saveCurrentRun();
        }
    }

    /**
     * 保存当前运行状态
     * @returns 是否成功保存
     */
    async saveCurrentRun(): Promise<boolean> {
        if (!this.currentRun) {
            console.warn('StateManager: 尝试保存运行状态，但当前无运行状态');
            return false;
        }

        try {
            // 使用StorageManager保存数据
            const storageManager = StorageManager.getInstance();
            const success = await storageManager.save(gameConfig.STORAGE.SAVE_KEY, this.currentRun);

            if (success) {
                console.log('StateManager: 保存运行状态成功');
            } else {
                console.error('StateManager: 保存运行状态失败');
            }

            return success;
        } catch (error) {
            console.error('StateManager: 保存运行状态失败:', error);
            return false;
        }
    }

    /**
     * 加载保存的运行状态
     * @returns 是否成功加载
     */
    async loadSavedRun(): Promise<boolean> {
        try {
            // 使用StorageManager加载数据
            const storageManager = StorageManager.getInstance();
            const data = await storageManager.load(gameConfig.STORAGE.SAVE_KEY);

            if (!data) {
                console.log('StateManager: 没有找到保存的运行状态');
                return false;
            }

            // 设置当前运行状态
            this.currentRun = data;

            console.log('StateManager: 加载运行状态成功');
            this.triggerEvent('runLoaded', this.currentRun);

            return true;
        } catch (error) {
            console.error('StateManager: 加载运行状态失败:', error);
            return false;
        }
    }

    /**
     * 删除保存的运行状态
     */
    async deleteSavedRun(): Promise<void> {
        try {
            const storageManager = StorageManager.getInstance();
            await storageManager.delete(gameConfig.STORAGE.SAVE_KEY);
            this.currentRun = null;

            console.log('StateManager: 删除运行状态成功');
            this.triggerEvent('runDeleted', null);
        } catch (error) {
            console.error('StateManager: 删除运行状态失败:', error);
        }
    }

    /**
     * 检查是否有保存的运行状态
     * @returns 是否有保存的运行状态
     */
    async hasSavedRun(): Promise<boolean> {
        const storageManager = StorageManager.getInstance();
        return await storageManager.exists(gameConfig.STORAGE.SAVE_KEY);
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
                console.error(`StateManager: 事件回调执行错误 (${eventName}):`, error);
            }
        }
    }
}