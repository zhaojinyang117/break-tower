import { EventResultType } from '../../core/types';

/**
 * 事件选项结果接口
 */
export interface EventOptionResult {
    type: EventResultType;
    value: number;
    description: string;
    data?: any;
}

/**
 * 事件选项接口
 */
export interface EventOption {
    id: string;
    text: string;
    results: EventOptionResult[];
    condition?: string;
}

/**
 * 事件数据接口
 */
export interface EventData {
    id: string;
    title: string;
    description: string;
    image?: string;
    options: EventOption[];
    minFloor?: number;
    maxFloor?: number;
    requiredRelics?: string[];
    requiredCards?: string[];
    weight?: number;
}

/**
 * 基础事件数据
 */
export const BASE_EVENTS: EventData[] = [
    {
        id: 'ancient_shrine',
        title: '古老的神龛',
        description: '你发现了一座古老的神龛，上面刻着奇怪的符文。当你靠近时，感到一股神秘的能量。',
        options: [
            {
                id: 'pray',
                text: '祈祷',
                results: [
                    {
                        type: EventResultType.GAIN_MAX_HP,
                        value: 5,
                        description: '你感到一股温暖的能量流遍全身，最大生命值增加了！'
                    }
                ]
            },
            {
                id: 'desecrate',
                text: '亵渎',
                results: [
                    {
                        type: EventResultType.GAIN_GOLD,
                        value: 50,
                        description: '你打碎了神龛，发现里面藏着一些金币。'
                    },
                    {
                        type: EventResultType.LOSE_HP,
                        value: 5,
                        description: '但同时，一股黑暗的能量伤害了你。'
                    }
                ]
            },
            {
                id: 'ignore',
                text: '离开',
                results: [
                    {
                        type: EventResultType.SPECIAL,
                        value: 0,
                        description: '你决定不去冒险，离开了神龛。'
                    }
                ]
            }
        ],
        weight: 1.0
    },
    {
        id: 'campfire',
        title: '篝火',
        description: '你发现了一个看起来安全的地方，可以休息一下。',
        options: [
            {
                id: 'rest',
                text: '休息',
                results: [
                    {
                        type: EventResultType.GAIN_HP,
                        value: 20,
                        description: '你在篝火旁休息，恢复了一些生命值。'
                    }
                ]
            },
            {
                id: 'upgrade',
                text: '锻造',
                results: [
                    {
                        type: EventResultType.UPGRADE_CARD,
                        value: 1,
                        description: '你利用篝火的热量锻造了一张卡牌。'
                    }
                ]
            }
        ],
        weight: 1.0
    },
    {
        id: 'mysterious_stranger',
        title: '神秘的陌生人',
        description: '一个披着斗篷的陌生人向你走来，他的面容隐藏在阴影中。',
        options: [
            {
                id: 'trade',
                text: '交易',
                results: [
                    {
                        type: EventResultType.LOSE_GOLD,
                        value: 30,
                        description: '你给了陌生人一些金币。'
                    },
                    {
                        type: EventResultType.GAIN_CARD,
                        value: 1,
                        description: '作为回报，他给了你一张稀有卡牌。',
                        data: { rarity: 'rare' }
                    }
                ]
            },
            {
                id: 'attack',
                text: '攻击',
                results: [
                    {
                        type: EventResultType.START_COMBAT,
                        value: 0,
                        description: '你决定攻击陌生人，但他似乎早有准备...',
                        data: { enemyId: 'mysterious_stranger' }
                    }
                ]
            },
            {
                id: 'ignore',
                text: '离开',
                results: [
                    {
                        type: EventResultType.SPECIAL,
                        value: 0,
                        description: '你决定不理会陌生人，继续前进。'
                    }
                ]
            }
        ],
        weight: 0.8
    },
    {
        id: 'abandoned_shop',
        title: '废弃的商店',
        description: '你发现了一个看起来已经被遗弃的商店，里面的货架上还有一些物品。',
        options: [
            {
                id: 'search',
                text: '搜索',
                results: [
                    {
                        type: EventResultType.GAIN_GOLD,
                        value: 25,
                        description: '你在柜台下找到了一些金币。'
                    },
                    {
                        type: EventResultType.GAIN_POTION,
                        value: 1,
                        description: '你还在架子上找到了一瓶药水。'
                    }
                ]
            },
            {
                id: 'steal',
                text: '偷窃',
                results: [
                    {
                        type: EventResultType.GAIN_RELIC,
                        value: 1,
                        description: '你偷走了一件看起来很值钱的遗物。'
                    },
                    {
                        type: EventResultType.START_COMBAT,
                        value: 0,
                        description: '但是，商店的主人突然出现了！',
                        data: { enemyId: 'shop_keeper' }
                    }
                ]
            },
            {
                id: 'leave',
                text: '离开',
                results: [
                    {
                        type: EventResultType.SPECIAL,
                        value: 0,
                        description: '你决定不去冒险，离开了商店。'
                    }
                ]
            }
        ],
        weight: 0.7
    },
    {
        id: 'golden_idol',
        title: '金色偶像',
        description: '在一个小祭坛上，你看到了一个闪闪发光的金色偶像。它看起来非常值钱。',
        options: [
            {
                id: 'take',
                text: '拿走偶像',
                results: [
                    {
                        type: EventResultType.GAIN_GOLD,
                        value: 100,
                        description: '你拿走了金色偶像，它确实很值钱！'
                    },
                    {
                        type: EventResultType.LOSE_HP,
                        value: 10,
                        description: '但当你拿走偶像时，地面开始震动，一块巨石从天花板掉下来砸中了你。'
                    }
                ]
            },
            {
                id: 'leave',
                text: '离开',
                results: [
                    {
                        type: EventResultType.SPECIAL,
                        value: 0,
                        description: '你决定不去冒险，离开了祭坛。'
                    }
                ]
            }
        ],
        weight: 0.6
    }
];