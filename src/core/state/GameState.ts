/**
 * 游戏状态管理系统
 * 采用类似Redux的单向数据流设计
 */

// 定义动作类型
export enum ActionType {
    // 游戏系统动作
    INIT_GAME = 'INIT_GAME',
    RESET_GAME = 'RESET_GAME',
    LOAD_GAME = 'LOAD_GAME',
    SAVE_GAME = 'SAVE_GAME',

    // 玩家相关动作
    UPDATE_PLAYER_HP = 'UPDATE_PLAYER_HP',
    UPDATE_PLAYER_MAX_HP = 'UPDATE_PLAYER_MAX_HP',
    UPDATE_PLAYER_ENERGY = 'UPDATE_PLAYER_ENERGY',
    UPDATE_PLAYER_BLOCK = 'UPDATE_PLAYER_BLOCK',
    UPDATE_PLAYER_GOLD = 'UPDATE_PLAYER_GOLD',

    // 卡牌相关动作
    ADD_CARD_TO_DECK = 'ADD_CARD_TO_DECK',
    REMOVE_CARD_FROM_DECK = 'REMOVE_CARD_FROM_DECK',
    UPGRADE_CARD = 'UPGRADE_CARD',
    DRAW_CARD = 'DRAW_CARD',
    DISCARD_CARD = 'DISCARD_CARD',
    EXHAUST_CARD = 'EXHAUST_CARD',
    SHUFFLE_DECK = 'SHUFFLE_DECK',

    // 战斗相关动作
    START_BATTLE = 'START_BATTLE',
    END_BATTLE = 'END_BATTLE',
    START_PLAYER_TURN = 'START_PLAYER_TURN',
    END_PLAYER_TURN = 'END_PLAYER_TURN',
    START_ENEMY_TURN = 'START_ENEMY_TURN',
    END_ENEMY_TURN = 'END_ENEMY_TURN',
    APPLY_BUFF = 'APPLY_BUFF',
    APPLY_DEBUFF = 'APPLY_DEBUFF',

    // 地图相关动作
    GENERATE_MAP = 'GENERATE_MAP',
    MOVE_TO_NODE = 'MOVE_TO_NODE',
    COMPLETE_NODE = 'COMPLETE_NODE',

    // 遗物相关动作
    ADD_RELIC = 'ADD_RELIC',
    ACTIVATE_RELIC = 'ACTIVATE_RELIC',

    // 事件相关动作
    TRIGGER_EVENT = 'TRIGGER_EVENT',
    RESOLVE_EVENT = 'RESOLVE_EVENT'
}

// 定义Action接口
export interface Action {
    type: ActionType;
    payload?: any;
}

// 游戏状态接口
export interface GameStateData {
    // 游戏元数据
    gameId: string;
    currentFloor: number;
    gold: number;

    // 玩家状态
    player: {
        maxHp: number;
        currentHp: number;
        block: number;
        energy: number;
        maxEnergy: number;
    };

    // 卡牌状态
    cards: {
        deck: CardData[];   // 完整卡组
        drawPile: string[]; // 抽牌堆 (id)
        hand: string[];     // 手牌 (id)
        discardPile: string[]; // 弃牌堆 (id)
        exhaustPile: string[]; // 消耗堆 (id)
    };

    // 遗物状态
    relics: RelicData[];

    // 地图状态
    map: MapData | null;
    currentNodeId: string | null;
    completedNodeIds: string[];

    // 战斗状态
    inBattle: boolean;
    currentEnemies: EnemyData[];
    turnNumber: number;
    isPlayerTurn: boolean;

    // 事件状态
    currentEvent: EventData | null;
}

// 卡牌数据接口
export interface CardData {
    id: string;
    name: string;
    type: 'attack' | 'skill' | 'power' | 'status' | 'curse';
    rarity: 'starter' | 'basic' | 'common' | 'uncommon' | 'rare' | 'special' | 'curse';
    energy: number;
    cost?: number; // 保留原有的cost字段作为可选项
    description: string;
    upgraded?: boolean;
    effects: CardEffect[];
    upgrades?: any[]; // 添加upgrades字段用于存储升级信息
}

// 卡牌效果接口
export interface CardEffect {
    id: string;
    name: string;
    amount: number;
    times?: number;
    counterMax?: number;
    // 保留原有的字段作为可选
    type?: string;
    value?: number;
    target?: 'self' | 'enemy' | 'all_enemies';
}

// 遗物效果接口
export interface RelicEffect {
    id: string;
    name: string;
    amount: number;
    counterMax?: number;
    counterBase?: number;
}

// 遗物数据接口
export interface RelicData {
    id: string;
    name: string;
    description: string;
    rarity: 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'event' | 'shop';
    effects?: RelicEffect[];
    isActive?: boolean;
    counter?: number;
    triggered?: boolean;
}

// 地图数据接口
export interface MapData {
    floors: MapFloor[];
}

// 地图层接口
export interface MapFloor {
    floorNumber: number;
    nodes: MapNode[];
}

// 地图节点接口
export interface MapNode {
    id: string;
    type: 'battle' | 'elite' | 'boss' | 'rest' | 'shop' | 'event';
    position: { x: number; y: number };
    connections: string[]; // 连接的其他节点ID
}

// 敌人数据接口
export interface EnemyData {
    id: string;
    name: string;
    maxHp: number;
    currentHp: number;
    block: number;
    intents: EnemyIntent[];
    currentIntentIndex: number;
    buffs: BuffData[];
    debuffs: BuffData[];
}

// 敌人意图接口
export interface EnemyIntent {
    type: 'attack' | 'defend' | 'buff' | 'debuff' | 'special';
    value: number;
    effects?: any[];
}

// Buff数据接口
export interface BuffData {
    id: string;
    name: string;
    amount: number;
    duration: number;
}

// 事件数据接口
export interface EventData {
    id: string;
    title: string;
    description: string;
    options: EventOption[];
}

// 事件选项接口
export interface EventOption {
    text: string;
    consequence: Action;
}

/**
 * 游戏状态管理类
 * 负责管理游戏全局状态，处理动作，通知订阅者
 */
export class GameState {
    private static instance: GameState;
    private state: GameStateData;
    private listeners: ((state: GameStateData) => void)[] = [];
    private initialized: boolean = false;

    /**
     * 私有构造函数，确保单例模式
     */
    private constructor() {
        // 初始化为空状态
        this.state = this.getInitialState();
    }

    /**
     * 获取GameState实例
     */
    public static getInstance(): GameState {
        if (!GameState.instance) {
            GameState.instance = new GameState();
        }
        return GameState.instance;
    }

    /**
     * 获取初始状态
     */
    private getInitialState(): GameStateData {
        return {
            gameId: '',
            currentFloor: 1,
            gold: 0,

            player: {
                maxHp: 0,
                currentHp: 0,
                block: 0,
                energy: 0,
                maxEnergy: 0
            },

            cards: {
                deck: [],
                drawPile: [],
                hand: [],
                discardPile: [],
                exhaustPile: []
            },

            relics: [],

            map: null,
            currentNodeId: null,
            completedNodeIds: [],

            inBattle: false,
            currentEnemies: [],
            turnNumber: 0,
            isPlayerTurn: false,

            currentEvent: null
        };
    }

    /**
     * 获取当前状态
     */
    public getState(): GameStateData {
        return { ...this.state };
    }

    /**
     * 分发动作
     * @param action 要分发的动作
     */
    public dispatch(action: Action): void {
        console.log(`GameState: Dispatching action ${action.type}`, action.payload);

        // 执行状态更新
        const newState = this.reducer(this.state, action);
        this.state = newState;

        // 通知所有监听器
        this.notifyListeners();
    }

    /**
     * 还原器函数，根据动作创建新的状态
     * @param state 当前状态
     * @param action 动作
     * @returns 新状态
     */
    private reducer(state: GameStateData, action: Action): GameStateData {
        switch (action.type) {
            case ActionType.INIT_GAME:
                return this.handleInitGame(state, action.payload);

            case ActionType.RESET_GAME:
                return this.getInitialState();

            case ActionType.UPDATE_PLAYER_HP:
                return {
                    ...state,
                    player: {
                        ...state.player,
                        currentHp: Math.max(0, Math.min(state.player.maxHp, action.payload.hp))
                    }
                };

            case ActionType.UPDATE_PLAYER_MAX_HP:
                const newMaxHp = Math.max(1, action.payload.maxHp);
                return {
                    ...state,
                    player: {
                        ...state.player,
                        maxHp: newMaxHp,
                        currentHp: Math.min(state.player.currentHp, newMaxHp)
                    }
                };

            case ActionType.UPDATE_PLAYER_ENERGY:
                return {
                    ...state,
                    player: {
                        ...state.player,
                        energy: Math.max(0, action.payload.energy)
                    }
                };

            case ActionType.UPDATE_PLAYER_BLOCK:
                return {
                    ...state,
                    player: {
                        ...state.player,
                        block: Math.max(0, action.payload.block)
                    }
                };

            case ActionType.UPDATE_PLAYER_GOLD:
                return {
                    ...state,
                    gold: Math.max(0, action.payload.gold)
                };

            case ActionType.ADD_CARD_TO_DECK:
                return this.handleAddCardToDeck(state, action.payload);

            case ActionType.REMOVE_CARD_FROM_DECK:
                return this.handleRemoveCardFromDeck(state, action.payload);

            case ActionType.START_BATTLE:
                return this.handleStartBattle(state, action.payload);

            case ActionType.END_BATTLE:
                return this.handleEndBattle(state, action.payload);

            case ActionType.GENERATE_MAP:
                return {
                    ...state,
                    map: action.payload.map,
                    currentNodeId: action.payload.startingNodeId,
                    completedNodeIds: []
                };

            case ActionType.MOVE_TO_NODE:
                return {
                    ...state,
                    currentNodeId: action.payload.nodeId
                };

            case ActionType.COMPLETE_NODE:
                return {
                    ...state,
                    completedNodeIds: [...state.completedNodeIds, state.currentNodeId as string]
                };

            case ActionType.ADD_RELIC:
                return {
                    ...state,
                    relics: [...state.relics, action.payload.relic]
                };

            // 其他动作处理...

            default:
                console.warn(`GameState: Unhandled action type: ${action.type}`);
                return state;
        }
    }

    /**
     * 处理游戏初始化动作
     */
    private handleInitGame(state: GameStateData, payload: any): GameStateData {
        this.initialized = true;
        return {
            ...this.getInitialState(),
            gameId: Date.now().toString(),
            currentFloor: 1,
            gold: payload.startingGold || 0,
            player: {
                maxHp: payload.startingHp || 80,
                currentHp: payload.startingHp || 80,
                block: 0,
                energy: payload.startingEnergy || 3,
                maxEnergy: payload.startingEnergy || 3
            },
            cards: {
                ...this.getInitialState().cards,
                deck: payload.startingDeck || []
            }
        };
    }

    /**
     * 处理添加卡牌到卡组动作
     */
    private handleAddCardToDeck(state: GameStateData, payload: any): GameStateData {
        const newDeck = [...state.cards.deck, payload.card];
        return {
            ...state,
            cards: {
                ...state.cards,
                deck: newDeck
            }
        };
    }

    /**
     * 处理从卡组移除卡牌动作
     */
    private handleRemoveCardFromDeck(state: GameStateData, payload: any): GameStateData {
        const cardId = payload.cardId;
        const newDeck = state.cards.deck.filter(card => card.id !== cardId);
        return {
            ...state,
            cards: {
                ...state.cards,
                deck: newDeck
            }
        };
    }

    /**
     * 处理开始战斗动作
     */
    private handleStartBattle(state: GameStateData, payload: any): GameStateData {
        // 设置战斗状态
        return {
            ...state,
            inBattle: true,
            currentEnemies: payload.enemies,
            turnNumber: 1,
            isPlayerTurn: true,
            // 初始化战斗开始时的抽牌堆（使用整个卡组）
            cards: {
                ...state.cards,
                drawPile: state.cards.deck.map(card => card.id),
                hand: [],
                discardPile: [],
                exhaustPile: []
            },
            // 重置玩家状态
            player: {
                ...state.player,
                energy: state.player.maxEnergy,
                block: 0
            }
        };
    }

    /**
     * 处理结束战斗动作
     */
    private handleEndBattle(state: GameStateData, payload: any): GameStateData {
        return {
            ...state,
            inBattle: false,
            currentEnemies: [],
            // 保留卡组、遗物等永久状态
        };
    }

    /**
     * 添加状态监听器
     * @param listener 监听器函数
     */
    public subscribe(listener: (state: GameStateData) => void): () => void {
        this.listeners.push(listener);

        // 返回取消订阅函数
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * 通知所有监听器
     */
    private notifyListeners(): void {
        const currentState = this.getState();
        this.listeners.forEach(listener => listener(currentState));
    }

    /**
     * 保存当前状态到localStorage
     */
    public saveToLocalStorage(): void {
        try {
            const serializedState = JSON.stringify(this.state);
            localStorage.setItem('breakTower_gameState', serializedState);
            console.log('GameState: 状态已保存到localStorage');
        } catch (err) {
            console.error('GameState: 无法保存状态到localStorage', err);
        }
    }

    /**
     * 从localStorage加载状态
     * @returns 是否成功加载
     */
    public loadFromLocalStorage(): boolean {
        try {
            const serializedState = localStorage.getItem('breakTower_gameState');
            if (serializedState === null) {
                return false;
            }

            this.state = JSON.parse(serializedState);
            this.notifyListeners();
            console.log('GameState: 从localStorage加载状态成功');
            return true;
        } catch (err) {
            console.error('GameState: 从localStorage加载状态失败', err);
            return false;
        }
    }

    /**
     * 判断游戏状态是否已初始化
     */
    public isInitialized(): boolean {
        return this.initialized;
    }
} 