import { GameConfig } from './types';

/**
 * 游戏全局配置
 */
export const gameConfig: GameConfig = {
    // 游戏窗口大小
    WIDTH: 1280,
    HEIGHT: 720,

    // 游戏设置
    DEBUG: process.env.NODE_ENV !== 'production',
    VERSION: '0.1.0',

    // 玩家设置
    PLAYER: {
        STARTING_HP: 80,
        STARTING_ENERGY: 3,
        HAND_SIZE: 5,
        MAX_HAND_SIZE: 10
    },

    // 敌人设置
    ENEMY: {
        DEFAULT_HP: 45,
        ELITE_HP_MULTIPLIER: 1.5,
        BOSS_HP_MULTIPLIER: 3
    },

    // 战斗设置
    BATTLE: {
        TURN_DURATION: 40000, // 玩家回合时长上限(毫秒)，0表示无限
        ENEMY_TURN_DELAY: 500, // 敌人行动之间的延迟(毫秒)
    },

    // 卡牌设置
    CARD: {
        WIDTH: 200,
        HEIGHT: 280,
        SCALE: {
            DEFAULT: 0.7,
            HOVER: 1.0
        }
    },

    // 地图设置
    MAP: {
        FLOORS: 3, // 层数
        NODES_PER_FLOOR: 15, // 每层节点数
        PATHS_PER_NODE: 2, // 每个节点平均路径数
        NODE_DISTRIBUTION: { // 节点类型分布
            BATTLE: 0.55,
            ELITE: 0.10,
            EVENT: 0.20,
            REST: 0.10,
            SHOP: 0.05,
            BOSS: 0.0 // Boss由固定位置决定
        }
    },

    // 奖励设置
    REWARDS: {
        GOLD_PER_BATTLE: { min: 10, max: 20 },
        GOLD_PER_ELITE: { min: 25, max: 35 },
        GOLD_PER_BOSS: { min: 75, max: 100 },
        CARDS_PER_BATTLE: 3, // 战斗后提供的卡牌选择数量
    },

    // 存储配置
    STORAGE: {
        SAVE_KEY: 'breakTower_savedGame',
        AUTO_SAVE: true // 自动保存
    },

    // 显示选项
    DISPLAY: {
        SHOW_FPS: false,
        ENABLE_PARTICLES: true,
        ENABLE_CARD_GLOW: true
    },

    // 音频设置
    AUDIO: {
        MUSIC_VOLUME: 0.5,
        SFX_VOLUME: 0.8,
        ENABLE_MUSIC: true,
        ENABLE_SFX: true
    }
};