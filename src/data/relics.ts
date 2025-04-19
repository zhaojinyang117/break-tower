import { RelicData } from '../core/state/GameState';

/**
 * 初始遗物数据
 */
export const STARTER_RELICS: RelicData[] = [
    {
        id: 'warriors_pendant',
        name: '战士挂坠',
        description: '每场战斗开始时获得2点力量',
        rarity: 'starter',
        effects: [
            { id: 'battle_start_strength', name: '战斗开始力量', amount: 2 }
        ],
        isActive: true
    }
];

/**
 * 普通遗物数据
 */
export const COMMON_RELICS: RelicData[] = [
    {
        id: 'iron_shield',
        name: '铁盾',
        description: '每回合开始时获得3点格挡',
        rarity: 'common',
        effects: [
            { id: 'turn_start_block', name: '回合开始格挡', amount: 3 }
        ],
        isActive: true
    },
    {
        id: 'energy_crystal',
        name: '能量水晶',
        description: '每场战斗开始时获得1点额外能量',
        rarity: 'common',
        effects: [
            { id: 'battle_start_energy', name: '战斗开始能量', amount: 1 }
        ],
        isActive: true
    },
    {
        id: 'healing_potion',
        name: '治疗药水',
        description: '每场战斗结束后回复5点生命值',
        rarity: 'common',
        effects: [
            { id: 'battle_end_heal', name: '战斗结束治疗', amount: 5 }
        ],
        isActive: true
    },
    {
        id: 'training_manual',
        name: '训练手册',
        description: '在你的回合开始时，有25%的几率抽一张牌',
        rarity: 'common',
        effects: [
            { id: 'turn_start_draw_chance', name: '回合开始抽牌几率', amount: 25 }
        ],
        isActive: true
    }
];

/**
 * 罕见遗物数据
 */
export const UNCOMMON_RELICS: RelicData[] = [
    {
        id: 'strength_bracer',
        name: '力量护腕',
        description: '每场战斗开始时获得3点力量',
        rarity: 'uncommon',
        effects: [
            { id: 'battle_start_strength', name: '战斗开始力量', amount: 3 }
        ],
        isActive: true
    },
    {
        id: 'dexterity_ring',
        name: '敏捷戒指',
        description: '每场战斗开始时获得3点敏捷',
        rarity: 'uncommon',
        effects: [
            { id: 'battle_start_dexterity', name: '战斗开始敏捷', amount: 3 }
        ],
        isActive: true
    },
    {
        id: 'mana_stone',
        name: '法力石',
        description: '每场战斗开始时获得2点额外能量',
        rarity: 'uncommon',
        effects: [
            { id: 'battle_start_energy', name: '战斗开始能量', amount: 2 }
        ],
        isActive: true
    },
    {
        id: 'blood_vial',
        name: '血瓶',
        description: '每回合开始时回复2点生命值',
        rarity: 'uncommon',
        effects: [
            { id: 'turn_start_heal', name: '回合开始治疗', amount: 2 }
        ],
        isActive: true
    },
    {
        id: 'card_duplicator',
        name: '卡牌复制器',
        description: '每打出10张牌，复制一张手牌',
        rarity: 'uncommon',
        effects: [
            { id: 'card_played_counter', name: '打出卡牌计数器', amount: 0, counterMax: 10 },
            { id: 'duplicate_hand_card', name: '复制手牌', amount: 1 }
        ],
        isActive: true
    }
];

/**
 * 稀有遗物数据
 */
export const RARE_RELICS: RelicData[] = [
    {
        id: 'philosophers_stone',
        name: '贤者之石',
        description: '获得1点额外能量，但所有敌人获得1点力量',
        rarity: 'rare',
        effects: [
            { id: 'permanent_energy', name: '永久能量', amount: 1 },
            { id: 'enemy_strength', name: '敌人力量', amount: 1 }
        ],
        isActive: true
    },
    {
        id: 'eternal_feather',
        name: '永恒之羽',
        description: '你的牌组每有10张牌，在休息处额外回复5点生命值',
        rarity: 'rare',
        effects: [
            { id: 'rest_heal_per_cards', name: '每10张牌休息治疗', amount: 5, counterBase: 10 }
        ],
        isActive: true
    },
    {
        id: 'ice_cream',
        name: '冰淇淋',
        description: '能量不再在回合结束时消失',
        rarity: 'rare',
        effects: [
            { id: 'retain_energy', name: '保留能量', amount: 1 }
        ],
        isActive: true
    },
    {
        id: 'dead_branch',
        name: '枯死树枝',
        description: '每当你消耗一张牌，随机将一张牌加入你的手牌',
        rarity: 'rare',
        effects: [
            { id: 'exhaust_to_random_card', name: '消耗转随机牌', amount: 1 }
        ],
        isActive: true
    },
    {
        id: 'gambling_chip',
        name: '赌博筹码',
        description: '每场战斗开始时，可以丢弃任意张手牌并抽相同数量的牌',
        rarity: 'rare',
        effects: [
            { id: 'battle_start_discard_draw', name: '战斗开始丢弃抽牌', amount: 1 }
        ],
        isActive: true
    }
];

/**
 * Boss遗物数据
 */
export const BOSS_RELICS: RelicData[] = [
    {
        id: 'black_star',
        name: '黑星',
        description: '精英敌人有50%几率掉落两件遗物',
        rarity: 'boss',
        effects: [
            { id: 'elite_double_relic_chance', name: '精英双倍遗物几率', amount: 50 }
        ],
        isActive: true
    },
    {
        id: 'cursed_key',
        name: '诅咒钥匙',
        description: '获得1点额外能量，但每开一个非Boss宝箱就会获得一张诅咒牌',
        rarity: 'boss',
        effects: [
            { id: 'permanent_energy', name: '永久能量', amount: 1 },
            { id: 'chest_curse', name: '宝箱诅咒', amount: 1 }
        ],
        isActive: true
    },
    {
        id: 'runic_dome',
        name: '符文圆顶',
        description: '获得1点额外能量，但无法看到敌人的意图',
        rarity: 'boss',
        effects: [
            { id: 'permanent_energy', name: '永久能量', amount: 1 },
            { id: 'hide_enemy_intent', name: '隐藏敌人意图', amount: 1 }
        ],
        isActive: true
    },
    {
        id: 'snecko_eye',
        name: '异蛇之眼',
        description: '每回合多抽2张牌，但所有牌的能量消耗随机（0-3）',
        rarity: 'boss',
        effects: [
            { id: 'additional_draw', name: '额外抽牌', amount: 2 },
            { id: 'randomize_costs', name: '随机费用', amount: 1 }
        ],
        isActive: true
    }
];

/**
 * 事件遗物数据
 */
export const EVENT_RELICS: RelicData[] = [
    {
        id: 'golden_idol',
        name: '黄金神像',
        description: '战斗结束时获得25%额外金币',
        rarity: 'event',
        effects: [
            { id: 'gold_bonus_percent', name: '金币奖励加成', amount: 25 }
        ],
        isActive: true
    },
    {
        id: 'prayer_wheel',
        name: '祈祷轮',
        description: '非精英战斗额外奖励一张牌',
        rarity: 'event',
        effects: [
            { id: 'additional_card_reward', name: '额外卡牌奖励', amount: 1 }
        ],
        isActive: true
    },
    {
        id: 'peace_pipe',
        name: '和平烟斗',
        description: '在休息处可以移除牌组中的牌',
        rarity: 'event',
        effects: [
            { id: 'rest_remove_card', name: '休息处移除牌', amount: 1 }
        ],
        isActive: true
    }
];

/**
 * 所有遗物的集合
 */
export const ALL_RELICS: RelicData[] = [
    ...STARTER_RELICS,
    ...COMMON_RELICS,
    ...UNCOMMON_RELICS,
    ...RARE_RELICS,
    ...BOSS_RELICS,
    ...EVENT_RELICS
];

/**
 * 获取指定稀有度的所有遗物
 * @param rarity 遗物稀有度
 * @returns 指定稀有度的遗物列表
 */
export function getRelicsByRarity(rarity: string): RelicData[] {
    return ALL_RELICS.filter((relic: RelicData) => relic.rarity === rarity);
}

/**
 * 通过ID查找遗物
 * @param id 遗物ID
 * @returns 找到的遗物数据或undefined
 */
export function findRelicById(id: string): RelicData | undefined {
    return ALL_RELICS.find((relic: RelicData) => relic.id === id);
}

/**
 * 随机获取指定稀有度的遗物
 * @param rarity 遗物稀有度
 * @returns 随机的指定稀有度遗物
 */
export function getRandomRelicByRarity(rarity: string): RelicData | undefined {
    const relics = getRelicsByRarity(rarity);
    if (relics.length === 0) {
        return undefined;
    }

    const index = Math.floor(Math.random() * relics.length);
    return JSON.parse(JSON.stringify(relics[index])); // 返回深拷贝
}

/**
 * 随机获取任意稀有度的遗物
 * @param excludeRarities 排除的稀有度数组
 * @returns 随机的遗物
 */
export function getRandomRelic(excludeRarities: string[] = []): RelicData {
    // 过滤出未排除的遗物
    const availableRelics = ALL_RELICS.filter(
        (relic: RelicData) => !excludeRarities.includes(relic.rarity)
    );

    // 如果没有可用遗物，返回一个基础遗物
    if (availableRelics.length === 0) {
        return JSON.parse(JSON.stringify(STARTER_RELICS[0]));
    }

    const index = Math.floor(Math.random() * availableRelics.length);
    return JSON.parse(JSON.stringify(availableRelics[index])); // 返回深拷贝
} 