import { CardData, CardEffect } from '../core/state/GameState';

/**
 * 攻击卡牌数据
 */
export const ATTACK_CARDS: CardData[] = [
    // 基础攻击卡
    {
        id: 'strike',
        name: '打击',
        type: 'attack',
        rarity: 'basic',
        energy: 1,
        description: '造成6点伤害',
        effects: [
            { id: 'damage', name: '伤害', amount: 6 }
        ],
        upgrades: [
            { effect: 'damage', amount: 3 }
        ]
    },
    // 普通攻击卡
    {
        id: 'cleave',
        name: '横扫',
        type: 'attack',
        rarity: 'common',
        energy: 1,
        description: '对所有敌人造成8点伤害',
        effects: [
            { id: 'damage_all', name: '群体伤害', amount: 8 }
        ],
        upgrades: [
            { effect: 'damage_all', amount: 2 }
        ]
    },
    {
        id: 'quick_slash',
        name: '快速斩击',
        type: 'attack',
        rarity: 'common',
        energy: 1,
        description: '造成8点伤害，抽1张牌',
        effects: [
            { id: 'damage', name: '伤害', amount: 8 },
            { id: 'draw', name: '抽牌', amount: 1 }
        ],
        upgrades: [
            { effect: 'damage', amount: 3 }
        ]
    },
    {
        id: 'wild_strike',
        name: '狂暴打击',
        type: 'attack',
        rarity: 'common',
        energy: 1,
        description: '造成12点伤害，将一张伤口加入你的弃牌堆',
        effects: [
            { id: 'damage', name: '伤害', amount: 12 },
            { id: 'add_wound_discard', name: '添加伤口到弃牌堆', amount: 1 }
        ],
        upgrades: [
            { effect: 'damage', amount: 5 }
        ]
    },
    // 罕见攻击卡
    {
        id: 'pommel_strike',
        name: '剑柄打击',
        type: 'attack',
        rarity: 'uncommon',
        energy: 1,
        description: '造成9点伤害，抽1张牌',
        effects: [
            { id: 'damage', name: '伤害', amount: 9 },
            { id: 'draw', name: '抽牌', amount: 1 }
        ],
        upgrades: [
            { effect: 'damage', amount: 1 },
            { effect: 'draw', amount: 1 }
        ]
    },
    {
        id: 'sword_boomerang',
        name: '回旋剑',
        type: 'attack',
        rarity: 'uncommon',
        energy: 1,
        description: '随机造成3次3点伤害',
        effects: [
            { id: 'random_damage', name: '随机伤害', amount: 3, times: 3 }
        ],
        upgrades: [
            { effect: 'times', amount: 1 }
        ]
    },
    {
        id: 'blood_for_blood',
        name: '以血还血',
        type: 'attack',
        rarity: 'uncommon',
        energy: 4,
        description: '你每失去1点生命，这张牌的耗能就降低1。\n造成18点伤害',
        effects: [
            { id: 'damage', name: '伤害', amount: 18 },
            { id: 'cost_reduce_per_hp_lost', name: '每失去生命降低消耗', amount: 1 }
        ],
        upgrades: [
            { effect: 'damage', amount: 4 },
            { effect: 'energy', amount: -1 }
        ]
    },
    // 稀有攻击卡
    {
        id: 'bludgeon',
        name: '重锤打击',
        type: 'attack',
        rarity: 'rare',
        energy: 3,
        description: '造成32点伤害',
        effects: [
            { id: 'damage', name: '伤害', amount: 32 }
        ],
        upgrades: [
            { effect: 'damage', amount: 10 }
        ]
    },
    {
        id: 'immolate',
        name: '献祭',
        type: 'attack',
        rarity: 'rare',
        energy: 2,
        description: '对所有敌人造成21点伤害，将一张灼伤加入你的弃牌堆',
        effects: [
            { id: 'damage_all', name: '群体伤害', amount: 21 },
            { id: 'add_burn_discard', name: '添加灼伤到弃牌堆', amount: 1 }
        ],
        upgrades: [
            { effect: 'damage_all', amount: 7 }
        ]
    },
    {
        id: 'fiend_fire',
        name: '恶魔形态',
        type: 'attack',
        rarity: 'rare',
        energy: 2,
        description: '消耗所有手牌，每张牌对目标造成7点伤害',
        effects: [
            { id: 'exhaust_all_hand', name: '消耗所有手牌', amount: 1 },
            { id: 'damage_per_exhausted', name: '每消耗一张牌造成伤害', amount: 7 }
        ],
        upgrades: [
            { effect: 'damage_per_exhausted', amount: 3 }
        ]
    }
];

/**
 * 技能卡牌数据
 */
export const SKILL_CARDS: CardData[] = [
    // 基础技能卡
    {
        id: 'defend',
        name: '防御',
        type: 'skill',
        rarity: 'basic',
        energy: 1,
        description: '获得5点格挡',
        effects: [
            { id: 'block', name: '格挡', amount: 5 }
        ],
        upgrades: [
            { effect: 'block', amount: 3 }
        ]
    },
    // 普通技能卡
    {
        id: 'armaments',
        name: '武装',
        type: 'skill',
        rarity: 'common',
        energy: 1,
        description: '获得5点格挡，升级手牌中的一张牌',
        effects: [
            { id: 'block', name: '格挡', amount: 5 },
            { id: 'upgrade_card_in_hand', name: '升级手牌', amount: 1 }
        ],
        upgrades: [
            { effect: 'description', value: '获得5点格挡，升级手牌中的所有牌' },
            { effect: 'upgrade_all_cards_in_hand', amount: 1 }
        ]
    },
    {
        id: 'shrug_it_off',
        name: '置之不理',
        type: 'skill',
        rarity: 'common',
        energy: 1,
        description: '获得8点格挡，抽1张牌',
        effects: [
            { id: 'block', name: '格挡', amount: 8 },
            { id: 'draw', name: '抽牌', amount: 1 }
        ],
        upgrades: [
            { effect: 'block', amount: 3 }
        ]
    },
    {
        id: 'true_grit',
        name: '坚韧不拔',
        type: 'skill',
        rarity: 'common',
        energy: 1,
        description: '获得7点格挡，随机消耗一张手牌',
        effects: [
            { id: 'block', name: '格挡', amount: 7 },
            { id: 'exhaust_random_card', name: '随机消耗手牌', amount: 1 }
        ],
        upgrades: [
            { effect: 'block', amount: 2 },
            { effect: 'description', value: '获得9点格挡，消耗一张手牌' },
            { effect: 'exhaust_choose_card', amount: 1 },
            { effect: 'exhaust_random_card', amount: 0 }
        ]
    },
    // 罕见技能卡
    {
        id: 'battle_trance',
        name: '战斗专注',
        type: 'skill',
        rarity: 'uncommon',
        energy: 0,
        description: '抽3张牌，这个回合不能再抽任何牌',
        effects: [
            { id: 'draw', name: '抽牌', amount: 3 },
            { id: 'no_more_draw', name: '不能再抽牌', amount: 1 }
        ],
        upgrades: [
            { effect: 'draw', amount: 1 }
        ]
    },
    {
        id: 'bloodletting',
        name: '放血',
        type: 'skill',
        rarity: 'uncommon',
        energy: 0,
        description: '失去3点生命，获得2点能量',
        effects: [
            { id: 'lose_hp', name: '失去生命', amount: 3 },
            { id: 'gain_energy', name: '获得能量', amount: 2 }
        ],
        upgrades: [
            { effect: 'gain_energy', amount: 1 }
        ]
    },
    {
        id: 'dual_wield',
        name: '双持',
        type: 'skill',
        rarity: 'uncommon',
        energy: 1,
        description: '选择一张攻击牌或能力牌，将其复制一份加入手牌',
        effects: [
            { id: 'duplicate_card', name: '复制卡牌', amount: 1 }
        ],
        upgrades: [
            { effect: 'description', value: '选择一张攻击牌或能力牌，将其复制两份加入手牌' },
            { effect: 'duplicate_card', amount: 2 }
        ]
    },
    // 稀有技能卡
    {
        id: 'offering',
        name: '祭品',
        type: 'skill',
        rarity: 'rare',
        energy: 0,
        description: '失去6点生命，获得2点能量，抽3张牌',
        effects: [
            { id: 'lose_hp', name: '失去生命', amount: 6 },
            { id: 'gain_energy', name: '获得能量', amount: 2 },
            { id: 'draw', name: '抽牌', amount: 3 }
        ],
        upgrades: [
            { effect: 'lose_hp', amount: -1 },
            { effect: 'draw', amount: 1 }
        ]
    },
    {
        id: 'corruption',
        name: '腐化',
        type: 'skill',
        rarity: 'rare',
        energy: 3,
        description: '技能牌耗能变为0，打出技能牌会将其消耗',
        effects: [
            { id: 'skills_cost_zero', name: '技能牌耗能变为0', amount: 1 },
            { id: 'exhaust_skills_played', name: '打出技能牌消耗', amount: 1 }
        ],
        upgrades: [
            { effect: 'energy', amount: -1 }
        ]
    },
    {
        id: 'exhume',
        name: '掘墓',
        type: 'skill',
        rarity: 'rare',
        energy: 1,
        description: '将一张已消耗的牌加入你的手牌，消耗',
        effects: [
            { id: 'retrieve_exhausted', name: '取回已消耗牌', amount: 1 },
            { id: 'self_exhaust', name: '自身消耗', amount: 1 }
        ],
        upgrades: [
            { effect: 'energy', amount: -1 }
        ]
    }
];

/**
 * 能力卡牌数据
 */
export const POWER_CARDS: CardData[] = [
    // 普通能力卡
    {
        id: 'inflame',
        name: '燃烧',
        type: 'power',
        rarity: 'common',
        energy: 1,
        description: '获得2点力量',
        effects: [
            { id: 'strength', name: '力量', amount: 2 }
        ],
        upgrades: [
            { effect: 'strength', amount: 1 }
        ]
    },
    {
        id: 'flex',
        name: '屈伸',
        type: 'power',
        rarity: 'common',
        energy: 0,
        description: '获得4点力量，回合结束时失去4点力量',
        effects: [
            { id: 'temporary_strength', name: '临时力量', amount: 4 }
        ],
        upgrades: [
            { effect: 'temporary_strength', amount: 2 }
        ]
    },
    // 罕见能力卡
    {
        id: 'metallicize',
        name: '金属化',
        type: 'power',
        rarity: 'uncommon',
        energy: 1,
        description: '回合结束时获得3点格挡',
        effects: [
            { id: 'end_turn_block', name: '回合结束格挡', amount: 3 }
        ],
        upgrades: [
            { effect: 'end_turn_block', amount: 1 }
        ]
    },
    {
        id: 'feel_no_pain',
        name: '无痛',
        type: 'power',
        rarity: 'uncommon',
        energy: 1,
        description: '每当一张牌被消耗时，获得3点格挡',
        effects: [
            { id: 'block_per_exhaust', name: '每消耗获得格挡', amount: 3 }
        ],
        upgrades: [
            { effect: 'block_per_exhaust', amount: 1 }
        ]
    },
    {
        id: 'evolve',
        name: '进化',
        type: 'power',
        rarity: 'uncommon',
        energy: 1,
        description: '每当你抽到一张状态牌，抽1张牌',
        effects: [
            { id: 'draw_per_status', name: '每抽状态牌抽牌', amount: 1 }
        ],
        upgrades: [
            { effect: 'draw_per_status', amount: 1 }
        ]
    },
    // 稀有能力卡
    {
        id: 'demon_form',
        name: '恶魔形态',
        type: 'power',
        rarity: 'rare',
        energy: 3,
        description: '每回合开始时获得2点力量',
        effects: [
            { id: 'strength_per_turn', name: '每回合力量', amount: 2 }
        ],
        upgrades: [
            { effect: 'strength_per_turn', amount: 1 }
        ]
    },
    {
        id: 'barricade',
        name: '壁垒',
        type: 'power',
        rarity: 'rare',
        energy: 3,
        description: '格挡不再在回合结束时消失',
        effects: [
            { id: 'retain_block', name: '保留格挡', amount: 1 }
        ],
        upgrades: [
            { effect: 'energy', amount: -1 }
        ]
    },
    {
        id: 'juggernaut',
        name: '势不可挡',
        type: 'power',
        rarity: 'rare',
        energy: 2,
        description: '每当你获得格挡时，对随机敌人造成5点伤害',
        effects: [
            { id: 'damage_per_block', name: '每次格挡造成伤害', amount: 5 }
        ],
        upgrades: [
            { effect: 'damage_per_block', amount: 2 }
        ]
    }
];

/**
 * 诅咒卡牌数据
 */
export const CURSE_CARDS: CardData[] = [
    {
        id: 'wound',
        name: '伤口',
        type: 'status',
        rarity: 'common',
        energy: 0, // 不可打出
        description: '不可打出',
        effects: [
            { id: 'unplayable', name: '不可打出', amount: 1 }
        ],
        upgrades: []
    },
    {
        id: 'burn',
        name: '灼伤',
        type: 'status',
        rarity: 'common',
        energy: 0, // 不可打出
        description: '在你的回合结束时，受到2点伤害',
        effects: [
            { id: 'self_damage_end_turn', name: '回合结束自伤', amount: 2 }
        ],
        upgrades: []
    },
    {
        id: 'curse_of_pain',
        name: '痛苦诅咒',
        type: 'curse',
        rarity: 'curse',
        energy: 0, // 不可打出
        description: '不可打出。每回合开始时失去3点生命',
        effects: [
            { id: 'unplayable', name: '不可打出', amount: 1 },
            { id: 'lose_hp_start_turn', name: '回合开始失去生命', amount: 3 }
        ],
        upgrades: []
    },
    {
        id: 'normality',
        name: '规范化',
        type: 'curse',
        rarity: 'curse',
        energy: 0, // 不可打出
        description: '不可打出。在你的手牌中时，你每回合最多只能打出3张牌',
        effects: [
            { id: 'unplayable', name: '不可打出', amount: 1 },
            { id: 'limit_plays', name: '限制出牌数', amount: 3 }
        ],
        upgrades: []
    }
];

/**
 * 所有卡牌的集合
 */
export const ALL_CARDS: CardData[] = [
    ...ATTACK_CARDS,
    ...SKILL_CARDS,
    ...POWER_CARDS,
    ...CURSE_CARDS
];

/**
 * 通过ID查找卡牌
 * @param id 卡牌ID
 * @returns 找到的卡牌数据或undefined
 */
export function findCardById(id: string): CardData | undefined {
    return ALL_CARDS.find((card: CardData) => card.id === id);
}

/**
 * 获取指定类型的所有卡牌
 * @param type 卡牌类型
 * @returns 指定类型的卡牌列表
 */
export function getCardsByType(type: string): CardData[] {
    return ALL_CARDS.filter((card: CardData) => card.type === type);
}

/**
 * 获取指定稀有度的所有卡牌
 * @param rarity 卡牌稀有度
 * @returns 指定稀有度的卡牌列表
 */
export function getCardsByRarity(rarity: string): CardData[] {
    return ALL_CARDS.filter((card: CardData) => card.rarity === rarity);
}

/**
 * 随机获取指定类型和稀有度的卡牌
 * @param type 卡牌类型 (可选)
 * @param rarity 卡牌稀有度 (可选)
 * @param excludeIds 排除的卡牌ID数组 (可选)
 * @returns 随机的卡牌
 */
export function getRandomCard(type?: string, rarity?: string, excludeIds: string[] = []): CardData | undefined {
    // 过滤满足条件的卡牌
    let availableCards = ALL_CARDS;

    if (type) {
        availableCards = availableCards.filter((card: CardData) => card.type === type);
    }

    if (rarity) {
        availableCards = availableCards.filter((card: CardData) => card.rarity === rarity);
    }

    // 排除指定ID的卡牌
    if (excludeIds.length > 0) {
        availableCards = availableCards.filter((card: CardData) => !excludeIds.includes(card.id));
    }

    // 如果没有可用卡牌，返回undefined
    if (availableCards.length === 0) {
        return undefined;
    }

    // 随机选择一张卡牌并返回深拷贝
    const index = Math.floor(Math.random() * availableCards.length);
    return JSON.parse(JSON.stringify(availableCards[index]));
}

/**
 * 升级卡牌
 * @param card 要升级的卡牌
 * @returns 升级后的卡牌
 */
export function upgradeCard(card: CardData): CardData {
    // 创建卡牌的深拷贝
    const upgradedCard = JSON.parse(JSON.stringify(card));

    // 如果没有升级路径，直接返回原卡牌
    if (!upgradedCard.upgrades || upgradedCard.upgrades.length === 0) {
        return upgradedCard;
    }

    // 应用所有升级效果
    for (const upgrade of upgradedCard.upgrades) {
        if (upgrade.effect === 'damage') {
            // 找到伤害效果并增加数值
            const damageEffect = upgradedCard.effects.find((e: CardEffect) => e.id === 'damage');
            if (damageEffect) {
                damageEffect.amount += upgrade.amount;
            }
        } else if (upgrade.effect === 'damage_all') {
            // 找到群体伤害效果并增加数值
            const damageAllEffect = upgradedCard.effects.find((e: CardEffect) => e.id === 'damage_all');
            if (damageAllEffect) {
                damageAllEffect.amount += upgrade.amount;
            }
        } else if (upgrade.effect === 'block') {
            // 找到格挡效果并增加数值
            const blockEffect = upgradedCard.effects.find((e: CardEffect) => e.id === 'block');
            if (blockEffect) {
                blockEffect.amount += upgrade.amount;
            }
        } else if (upgrade.effect === 'energy') {
            // 调整卡牌的能量消耗
            upgradedCard.energy += upgrade.amount;
        } else if (upgrade.effect === 'draw') {
            // 找到抽牌效果并增加数值
            const drawEffect = upgradedCard.effects.find((e: CardEffect) => e.id === 'draw');
            if (drawEffect) {
                drawEffect.amount += upgrade.amount;
            }
        } else if (upgrade.effect === 'description') {
            // 更新卡牌描述
            upgradedCard.description = upgrade.value;
        } else if (upgrade.effect === 'times') {
            // 找到次数效果并增加数值
            const effectWithTimes = upgradedCard.effects.find((e: CardEffect) => e.times !== undefined);
            if (effectWithTimes && effectWithTimes.times !== undefined) {
                effectWithTimes.times += upgrade.amount;
            }
        } else {
            // 处理其他各种特定效果的升级
            const effectToUpgrade = upgradedCard.effects.find((e: CardEffect) => e.id === upgrade.effect);
            if (effectToUpgrade) {
                effectToUpgrade.amount += upgrade.amount;
            } else if (upgrade.amount > 0) {
                // 如果是添加新效果
                upgradedCard.effects.push({
                    id: upgrade.effect,
                    name: upgrade.effect.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                    amount: upgrade.amount
                });
            }
        }
    }

    // 标记卡牌为已升级
    upgradedCard.upgraded = true;
    // 更新卡牌名称
    upgradedCard.name = `${upgradedCard.name}+`;

    return upgradedCard;
} 