/**
 * 核心类型定义
 * 包含游戏中使用的基本类型和接口
 */

// 游戏状态类型
export enum GameStateType {
    BOOT = 'boot',
    MAIN_MENU = 'mainMenu',
    MAP = 'map',
    COMBAT = 'combat',
    EVENT = 'event',
    SHOP = 'shop',
    REST = 'rest',
    REWARD = 'reward',
    GAME_OVER = 'gameOver',
    VICTORY = 'victory'
}

// 节点类型
export enum NodeType {
    BATTLE = 'battle',
    ELITE = 'elite',
    BOSS = 'boss',
    EVENT = 'event',
    REST = 'rest',
    SHOP = 'shop'
}

// 节点状态
export enum NodeStatus {
    AVAILABLE = 'available',
    UNAVAILABLE = 'unavailable',
    COMPLETED = 'completed'
}

// 卡牌类型
export enum CardType {
    ATTACK = 'attack',
    SKILL = 'skill',
    POWER = 'power',
    STATUS = 'status',
    CURSE = 'curse'
}

// 卡牌目标类型
export enum TargetType {
    ENEMY_SINGLE = 'enemy_single',
    ALL_ENEMIES = 'all_enemies',
    SELF = 'self',
    NONE = 'none'
}

// 卡牌稀有度
export enum Rarity {
    STARTER = 'starter',
    COMMON = 'common',
    UNCOMMON = 'uncommon',
    RARE = 'rare'
}

// 效果类型
export enum EffectType {
    DAMAGE = 'damage',
    BLOCK = 'block',
    DRAW = 'draw',
    ENERGY = 'energy',
    HEAL = 'heal',
    BUFF = 'buff',
    DEBUFF = 'debuff'
}

// 敌人意图类型
export enum IntentType {
    ATTACK = 'attack',
    DEFEND = 'defend',
    BUFF = 'buff',
    DEBUFF = 'debuff',
    SPECIAL = 'special',
    UNKNOWN = 'unknown'
}

// 敌人类型
export enum EnemyType {
    NORMAL = 'normal',
    ELITE = 'elite',
    BOSS = 'boss'
}

// 事件结果类型
export enum EventResultType {
    GAIN_GOLD = 'gain_gold',
    LOSE_GOLD = 'lose_gold',
    GAIN_HP = 'gain_hp',
    LOSE_HP = 'lose_hp',
    GAIN_MAX_HP = 'gain_max_hp',
    LOSE_MAX_HP = 'lose_max_hp',
    GAIN_CARD = 'gain_card',
    REMOVE_CARD = 'remove_card',
    UPGRADE_CARD = 'upgrade_card',
    GAIN_RELIC = 'gain_relic',
    START_COMBAT = 'start_combat',
    GAIN_POTION = 'gain_potion',
    SPECIAL = 'special'
}

// 位置接口
export interface Position {
    x: number;
    y: number;
}

// 尺寸接口
export interface Size {
    width: number;
    height: number;
}

// 矩形接口
export interface Rectangle extends Position, Size {}

// 范围接口
export interface Range {
    min: number;
    max: number;
}

// 效果接口
export interface Effect {
    type: EffectType;
    value: number;
    duration?: number;
    target?: TargetType;
}

// 状态效果接口
export interface StatusEffect {
    id: string;
    name: string;
    amount: number;
    duration: number; // -1表示永久效果
    icon?: string;
}

// 游戏配置接口
export interface GameConfig {
    WIDTH: number;
    HEIGHT: number;
    DEBUG: boolean;
    VERSION: string;
    PLAYER: PlayerConfig;
    ENEMY: EnemyConfig;
    BATTLE: BattleConfig;
    CARD: CardConfig;
    MAP: MapConfig;
    REWARDS: RewardsConfig;
    STORAGE: StorageConfig;
    DISPLAY: DisplayConfig;
    AUDIO: AudioConfig;
}

// 玩家配置接口
export interface PlayerConfig {
    STARTING_HP: number;
    STARTING_ENERGY: number;
    HAND_SIZE: number;
    MAX_HAND_SIZE: number;
}

// 敌人配置接口
export interface EnemyConfig {
    DEFAULT_HP: number;
    ELITE_HP_MULTIPLIER: number;
    BOSS_HP_MULTIPLIER: number;
}

// 战斗配置接口
export interface BattleConfig {
    TURN_DURATION: number;
    ENEMY_TURN_DELAY: number;
}

// 卡牌配置接口
export interface CardConfig {
    WIDTH: number;
    HEIGHT: number;
    SCALE: {
        DEFAULT: number;
        HOVER: number;
    };
}

// 地图配置接口
export interface MapConfig {
    FLOORS: number;
    NODES_PER_FLOOR: number;
    PATHS_PER_NODE: number;
    NODE_DISTRIBUTION: {
        BATTLE: number;
        ELITE: number;
        EVENT: number;
        REST: number;
        SHOP: number;
        BOSS: number;
    };
}

// 奖励配置接口
export interface RewardsConfig {
    GOLD_PER_BATTLE: Range;
    GOLD_PER_ELITE: Range;
    GOLD_PER_BOSS: Range;
    CARDS_PER_BATTLE: number;
}

// 存储配置接口
export interface StorageConfig {
    SAVE_KEY: string;
    AUTO_SAVE: boolean;
}

// 显示配置接口
export interface DisplayConfig {
    SHOW_FPS: boolean;
    ENABLE_PARTICLES: boolean;
    ENABLE_CARD_GLOW: boolean;
}

// 音频配置接口
export interface AudioConfig {
    MUSIC_VOLUME: number;
    SFX_VOLUME: number;
    ENABLE_MUSIC: boolean;
    ENABLE_SFX: boolean;
}