import { EnemyData, EnemyIntent } from '../core/state/GameState';
import { gameConfig } from '../config/gameConfig';

/**
 * 普通敌人数据
 */
export const NORMAL_ENEMIES: EnemyData[] = [
    // 小喽啰
    {
        id: 'minion',
        name: '小喽啰',
        maxHp: gameConfig.ENEMY.DEFAULT_HP - 15,
        currentHp: gameConfig.ENEMY.DEFAULT_HP - 15,
        block: 0,
        intents: [
            { type: 'attack', value: 5, effects: [] },
            { type: 'attack', value: 6, effects: [] },
            { type: 'defend', value: 5, effects: [] }
        ],
        currentIntentIndex: 0,
        buffs: [],
        debuffs: []
    },

    // 强盗
    {
        id: 'bandit',
        name: '强盗',
        maxHp: gameConfig.ENEMY.DEFAULT_HP,
        currentHp: gameConfig.ENEMY.DEFAULT_HP,
        block: 0,
        intents: [
            { type: 'attack', value: 8, effects: [] },
            { type: 'defend', value: 6, effects: [] },
            { type: 'attack', value: 10, effects: [] }
        ],
        currentIntentIndex: 0,
        buffs: [],
        debuffs: []
    },

    // 炮手
    {
        id: 'gunner',
        name: '炮手',
        maxHp: gameConfig.ENEMY.DEFAULT_HP - 10,
        currentHp: gameConfig.ENEMY.DEFAULT_HP - 10,
        block: 0,
        intents: [
            { type: 'defend', value: 5, effects: [] },
            { type: 'attack', value: 3, effects: [] }, // 连射，攻击3次
            { type: 'attack', value: 3, effects: [] },
            { type: 'attack', value: 3, effects: [] },
            { type: 'buff', value: 2, effects: [{ id: 'strength', name: '力量', amount: 2, duration: -1 }] }
        ],
        currentIntentIndex: 0,
        buffs: [],
        debuffs: []
    },

    // 盾卫
    {
        id: 'shield_guardian',
        name: '盾卫',
        maxHp: gameConfig.ENEMY.DEFAULT_HP + 10,
        currentHp: gameConfig.ENEMY.DEFAULT_HP + 10,
        block: 0,
        intents: [
            { type: 'defend', value: 10, effects: [] },
            { type: 'defend', value: 10, effects: [] },
            { type: 'attack', value: 7, effects: [] }
        ],
        currentIntentIndex: 0,
        buffs: [],
        debuffs: []
    },

    // 术士
    {
        id: 'cultist',
        name: '术士',
        maxHp: gameConfig.ENEMY.DEFAULT_HP - 20,
        currentHp: gameConfig.ENEMY.DEFAULT_HP - 20,
        block: 0,
        intents: [
            { type: 'buff', value: 3, effects: [{ id: 'ritual', name: '仪式', amount: 3, duration: -1 }] },
            { type: 'attack', value: 6, effects: [] },
            { type: 'debuff', value: 1, effects: [{ id: 'weak', name: '虚弱', amount: 1, duration: 2 }] }
        ],
        currentIntentIndex: 0,
        buffs: [],
        debuffs: []
    }
];

/**
 * 精英敌人数据
 */
export const ELITE_ENEMIES: EnemyData[] = [
    // 守卫队长
    {
        id: 'elite_captain',
        name: '守卫队长',
        maxHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.ELITE_HP_MULTIPLIER),
        currentHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.ELITE_HP_MULTIPLIER),
        block: 0,
        intents: [
            { type: 'buff', value: 2, effects: [{ id: 'strength', name: '力量', amount: 2, duration: -1 }] },
            { type: 'attack', value: 12, effects: [] },
            { type: 'defend', value: 15, effects: [] },
            { type: 'attack', value: 15, effects: [] }
        ],
        currentIntentIndex: 0,
        buffs: [],
        debuffs: []
    },

    // 狂战士
    {
        id: 'elite_berserker',
        name: '狂战士',
        maxHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.ELITE_HP_MULTIPLIER) - 20,
        currentHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.ELITE_HP_MULTIPLIER) - 20,
        block: 0,
        intents: [
            { type: 'attack', value: 7, effects: [] },
            { type: 'attack', value: 7, effects: [] }, // 连击两次
            { type: 'buff', value: 3, effects: [{ id: 'strength', name: '力量', amount: 3, duration: -1 }] },
            { type: 'attack', value: 18, effects: [] }
        ],
        currentIntentIndex: 0,
        buffs: [{ id: 'enrage', name: '激怒', amount: 1, duration: -1 }], // 每次受到攻击增加1点力量
        debuffs: []
    },

    // 巫师
    {
        id: 'elite_wizard',
        name: '巫师',
        maxHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.ELITE_HP_MULTIPLIER) - 30,
        currentHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.ELITE_HP_MULTIPLIER) - 30,
        block: 0,
        intents: [
            {
                type: 'debuff', value: 2, effects: [
                    { id: 'weak', name: '虚弱', amount: 2, duration: 2 },
                    { id: 'vulnerable', name: '易伤', amount: 2, duration: 2 }
                ]
            },
            { type: 'defend', value: 12, effects: [] },
            { type: 'attack', value: 8, effects: [] },
            { type: 'special', value: 20, effects: [] } // 强力魔法攻击
        ],
        currentIntentIndex: 0,
        buffs: [],
        debuffs: []
    }
];

/**
 * Boss敌人数据
 */
export const BOSS_ENEMIES: EnemyData[] = [
    // 巨型史莱姆
    {
        id: 'boss_slime',
        name: '巨型史莱姆',
        maxHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.BOSS_HP_MULTIPLIER),
        currentHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.BOSS_HP_MULTIPLIER),
        block: 0,
        intents: [
            { type: 'attack', value: 16, effects: [] },
            { type: 'defend', value: 20, effects: [] },
            { type: 'debuff', value: 2, effects: [{ id: 'weak', name: '虚弱', amount: 2, duration: 3 }] },
            { type: 'special', value: 25, effects: [] }, // 分裂（当HP低于50%）
            { type: 'attack', value: 22, effects: [] }
        ],
        currentIntentIndex: 0,
        buffs: [{ id: 'split', name: '分裂', amount: 1, duration: -1 }], // 特殊能力
        debuffs: []
    },

    // 守卫首领
    {
        id: 'boss_guardian',
        name: '守卫首领',
        maxHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.BOSS_HP_MULTIPLIER) + 30,
        currentHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.BOSS_HP_MULTIPLIER) + 30,
        block: 0,
        intents: [
            { type: 'defend', value: 30, effects: [] },
            { type: 'buff', value: 4, effects: [{ id: 'metallicize', name: '金属化', amount: 4, duration: -1 }] },
            { type: 'attack', value: 10, effects: [] }, // 多重攻击，连续3次
            { type: 'attack', value: 10, effects: [] },
            { type: 'attack', value: 10, effects: [] },
            { type: 'special', value: 40, effects: [] } // 守护模式切换
        ],
        currentIntentIndex: 0,
        buffs: [],
        debuffs: []
    },

    // 黑暗法师
    {
        id: 'boss_dark_mage',
        name: '黑暗法师',
        maxHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.BOSS_HP_MULTIPLIER) - 20,
        currentHp: Math.floor(gameConfig.ENEMY.DEFAULT_HP * gameConfig.ENEMY.BOSS_HP_MULTIPLIER) - 20,
        block: 0,
        intents: [
            { type: 'buff', value: 5, effects: [{ id: 'strength', name: '力量', amount: 5, duration: -1 }] },
            {
                type: 'debuff', value: 3, effects: [
                    { id: 'weak', name: '虚弱', amount: 3, duration: 3 },
                    { id: 'vulnerable', name: '易伤', amount: 3, duration: 3 }
                ]
            },
            { type: 'attack', value: 15, effects: [] },
            { type: 'special', value: 30, effects: [] }, // 黑暗仪式
            { type: 'attack', value: 35, effects: [] } // 终极魔法
        ],
        currentIntentIndex: 0,
        buffs: [{ id: 'ritual', name: '仪式', amount: 2, duration: -1 }], // 每回合增加2点力量
        debuffs: []
    }
];

/**
 * 所有敌人的集合
 */
export const ALL_ENEMIES: EnemyData[] = [
    ...NORMAL_ENEMIES,
    ...ELITE_ENEMIES,
    ...BOSS_ENEMIES
];

/**
 * 通过ID查找敌人
 * @param id 敌人ID
 * @returns 找到的敌人数据或undefined
 */
export function findEnemyById(id: string): EnemyData | undefined {
    return ALL_ENEMIES.find(enemy => enemy.id === id);
}

/**
 * 创建敌人的副本（用于战斗实例化）
 * @param id 敌人ID
 * @returns 敌人数据的新实例
 */
export function createEnemyInstance(id: string): EnemyData | undefined {
    const template = findEnemyById(id);
    if (!template) {
        return undefined;
    }

    // 创建深拷贝
    return JSON.parse(JSON.stringify(template));
}

/**
 * 随机获取普通敌人
 * @returns 随机的普通敌人
 */
export function getRandomNormalEnemy(): EnemyData {
    const index = Math.floor(Math.random() * NORMAL_ENEMIES.length);
    return createEnemyInstance(NORMAL_ENEMIES[index].id) as EnemyData;
}

/**
 * 随机获取精英敌人
 * @returns 随机的精英敌人
 */
export function getRandomEliteEnemy(): EnemyData {
    const index = Math.floor(Math.random() * ELITE_ENEMIES.length);
    return createEnemyInstance(ELITE_ENEMIES[index].id) as EnemyData;
}

/**
 * 随机获取Boss敌人
 * @returns 随机的Boss敌人
 */
export function getRandomBossEnemy(): EnemyData {
    const index = Math.floor(Math.random() * BOSS_ENEMIES.length);
    return createEnemyInstance(BOSS_ENEMIES[index].id) as EnemyData;
}

/**
 * 获取敌人的下一个意图
 * @param enemy 敌人实例
 * @returns 下一个意图
 */
export function getNextIntent(enemy: EnemyData): EnemyIntent {
    return enemy.intents[enemy.currentIntentIndex];
}

/**
 * 更新敌人的意图索引
 * @param enemy 敌人实例
 */
export function updateIntentIndex(enemy: EnemyData): void {
    enemy.currentIntentIndex = (enemy.currentIntentIndex + 1) % enemy.intents.length;
} 