import { CardType, EffectType, Rarity, TargetType } from '../../core/types';

/**
 * 卡牌效果接口
 */
export interface CardEffect {
    type: EffectType;
    value: number;
    target?: TargetType;
}

/**
 * 卡牌数据接口
 */
export interface CardData {
    id: string;
    name: string;
    type: CardType;
    cost: number;
    rarity: Rarity;
    target: TargetType;
    description: string;
    effects: CardEffect[];
    imageSrc?: string;
    upgraded?: boolean;
    upgradedId?: string;
}

/**
 * 基础卡牌数据
 */
export const BASE_CARDS: CardData[] = [
    {
        id: 'strike',
        name: '打击',
        type: CardType.ATTACK,
        cost: 1,
        rarity: Rarity.STARTER,
        target: TargetType.ENEMY_SINGLE,
        description: '造成6点伤害。',
        effects: [
            {
                type: EffectType.DAMAGE,
                value: 6
            }
        ]
    },
    {
        id: 'defend',
        name: '防御',
        type: CardType.SKILL,
        cost: 1,
        rarity: Rarity.STARTER,
        target: TargetType.SELF,
        description: '获得5点格挡。',
        effects: [
            {
                type: EffectType.BLOCK,
                value: 5
            }
        ]
    },
    {
        id: 'bash',
        name: '重击',
        type: CardType.ATTACK,
        cost: 2,
        rarity: Rarity.STARTER,
        target: TargetType.ENEMY_SINGLE,
        description: '造成8点伤害并获得3点格挡。',
        effects: [
            {
                type: EffectType.DAMAGE,
                value: 8
            },
            {
                type: EffectType.BLOCK,
                value: 3
            }
        ]
    },
    {
        id: 'cleave',
        name: '横扫',
        type: CardType.ATTACK,
        cost: 1,
        rarity: Rarity.COMMON,
        target: TargetType.ALL_ENEMIES,
        description: '对所有敌人造成4点伤害。',
        effects: [
            {
                type: EffectType.DAMAGE,
                value: 4
            }
        ]
    },
    {
        id: 'quick_draw',
        name: '快速抽牌',
        type: CardType.SKILL,
        cost: 1,
        rarity: Rarity.COMMON,
        target: TargetType.NONE,
        description: '抽2张牌。',
        effects: [
            {
                type: EffectType.DRAW,
                value: 2
            }
        ]
    },
    // 地牌
    {
        id: 'basic_land',
        name: '基础地牌',
        type: CardType.LAND,
        cost: 0,  // 地牌不需要消耗能量
        rarity: Rarity.STARTER,
        target: TargetType.NONE,
        description: '使用后获得1点能量。每回合只能使用一张地牌。',
        effects: [
            {
                type: EffectType.ENERGY,
                value: 1
            }
        ]
    },
    {
        id: 'advanced_land',
        name: '高级地牌',
        type: CardType.LAND,
        cost: 0,
        rarity: Rarity.UNCOMMON,
        target: TargetType.NONE,
        description: '使用后获得1点能量并抽1张牌。每回合只能使用一张地牌。',
        effects: [
            {
                type: EffectType.ENERGY,
                value: 1
            },
            {
                type: EffectType.DRAW,
                value: 1
            }
        ]
    },
    {
        id: 'rare_land',
        name: '稀有地牌',
        type: CardType.LAND,
        cost: 0,
        rarity: Rarity.RARE,
        target: TargetType.NONE,
        description: '使用后获得2点能量。每回合只能使用一张地牌。',
        effects: [
            {
                type: EffectType.ENERGY,
                value: 2
            }
        ]
    }
];