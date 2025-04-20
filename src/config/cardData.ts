// 卡牌类型
export enum CardType {
    ATTACK = 'attack',
    SKILL = 'skill',
    POWER = 'power',
    STATUS = 'status',
    CURSE = 'curse',
    LAND = 'land'
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

// 卡牌效果类型
export enum EffectType {
    DAMAGE = 'damage',
    BLOCK = 'block',
    DRAW = 'draw',
    ENERGY = 'energy',
    HEAL = 'heal',
    BUFF = 'buff',
    DEBUFF = 'debuff'
}

// 卡牌效果
export interface CardEffect {
    type: EffectType;
    value: number;
    target?: TargetType;
}

// 卡牌数据接口
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

// 基础卡牌数据
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
    }
];