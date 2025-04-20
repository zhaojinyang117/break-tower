import Phaser from 'phaser';
import { gameConfig } from '../../config/gameConfig';
import RunStateManager from '../../managers/RunStateManager';
import { CardData, BASE_CARDS } from '../../systems/card/CardData';

/**
 * 事件场景
 * 玩家在这里遇到随机事件并做出选择
 */
export class EventScene extends Phaser.Scene {
    // 场景元素
    private background!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private descriptionText!: Phaser.GameObjects.Text;
    private optionButtons: Phaser.GameObjects.Container[] = [];

    // 状态管理
    private runStateManager!: RunStateManager;
    private eventData: any;

    constructor() {
        super('EventScene');
    }

    /**
     * 创建场景
     */
    create(data?: any): void {
        console.log('EventScene: 创建事件场景');

        // 初始化状态管理器
        this.runStateManager = RunStateManager.getInstance();

        // 创建背景
        this.createBackground();

        // 生成随机事件
        this.eventData = this.generateRandomEvent();

        // 创建标题
        this.titleText = this.add.text(
            gameConfig.WIDTH / 2,
            50,
            this.eventData.title,
            { fontSize: '32px', color: '#ffffff' }
        ).setOrigin(0.5);

        // 创建描述
        this.descriptionText = this.add.text(
            gameConfig.WIDTH / 2,
            150,
            this.eventData.description,
            {
                fontSize: '20px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: gameConfig.WIDTH * 0.8 }
            }
        ).setOrigin(0.5, 0);

        // 创建选项按钮
        this.createOptionButtons();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 创建渐变背景
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x34495e, 0x34495e, 1);
        graphics.fillRect(0, 0, gameConfig.WIDTH, gameConfig.HEIGHT);

        // 添加一些装饰元素
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, gameConfig.WIDTH);
            const y = Phaser.Math.Between(0, gameConfig.HEIGHT);
            const size = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 0.8);

            this.add.circle(x, y, size, 0xffffff, alpha); // 星星
        }
    }

    /**
     * 创建选项按钮
     */
    private createOptionButtons(): void {
        const startY = 300;
        const spacing = 80;

        this.eventData.options.forEach((option: any, index: number) => {
            const buttonBg = this.add.rectangle(0, 0, 400, 60, 0x3498db);
            const buttonText = this.add.text(0, 0, option.text, {
                fontSize: '18px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: 380 }
            }).setOrigin(0.5);

            const button = this.add.container(
                gameConfig.WIDTH / 2,
                startY + index * spacing,
                [buttonBg, buttonText]
            );
            button.setSize(400, 60);
            button.setInteractive();

            button.on('pointerdown', () => {
                this.handleOption(option);
            });

            this.optionButtons.push(button);
        });
    }

    /**
     * 处理选项点击
     */
    private handleOption(option: any): void {
        console.log(`选择了选项: ${option.text}`);

        // 禁用所有按钮，防止重复点击
        this.optionButtons.forEach(button => {
            button.disableInteractive();
            (button.getAt(0) as Phaser.GameObjects.Rectangle).setFillStyle(0x7f8c8d);
        });

        // 显示结果
        this.showResult(option.result);

        // 应用效果
        this.applyEffects(option.effects);

        // 3秒后返回地图
        this.time.delayedCall(3000, () => {
            this.scene.start('MapScene');
        });
    }

    /**
     * 显示结果
     */
    private showResult(result: string): void {
        const resultText = this.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT - 150,
            result,
            {
                fontSize: '20px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 10, y: 5 },
                align: 'center',
                wordWrap: { width: gameConfig.WIDTH * 0.8 }
            }
        ).setOrigin(0.5);
    }

    /**
     * 应用效果
     */
    private applyEffects(effects: any): void {
        if (!effects) return;

        const runState = this.runStateManager.getCurrentRun();
        if (!runState) return;

        // 处理生命值变化
        if (effects.hp) {
            this.runStateManager.updateHp(effects.hp);
        }

        // 处理金币变化
        if (effects.gold) {
            this.runStateManager.updateGold(effects.gold);
        }

        // 处理获得卡牌
        if (effects.addCard) {
            const card = this.getCardById(effects.addCard);
            if (card) {
                this.runStateManager.addCard(card);
            }
        }

        // 处理移除卡牌
        if (effects.removeCard) {
            // 这里简化处理，实际应该让玩家选择要移除的卡牌
            const deck = this.runStateManager.getDeck();
            if (deck.length > 0) {
                this.runStateManager.removeCard(deck[0].id);
            }
        }

        // 保存状态
        void this.runStateManager.saveCurrentRun();
    }

    /**
     * 根据ID获取卡牌
     */
    private getCardById(cardId: string): CardData | null {
        return BASE_CARDS.find(card => card.id === cardId) || null;
    }

    /**
     * 生成随机事件
     */
    private generateRandomEvent(): any {
        // 事件库
        const events = [
            {
                title: '神秘商人',
                description: '你遇到了一个神秘的商人，他提供了一些特殊的交易。',
                options: [
                    {
                        text: '用10金币购买一张随机卡牌',
                        result: '你获得了一张新卡牌！',
                        effects: { gold: -10, addCard: 'attack_1' }
                    },
                    {
                        text: '用20%的生命值换取30金币',
                        result: '你感到一阵虚弱，但口袋里多了一些金币。',
                        effects: { hp: -20, gold: 30 }
                    },
                    {
                        text: '离开',
                        result: '你谨慎地离开了，没有做任何交易。',
                        effects: {}
                    }
                ]
            },
            {
                title: '古老神龛',
                description: '你发现了一个古老的神龛，上面刻着奇怪的符文。',
                options: [
                    {
                        text: '祈祷（恢复15%生命值）',
                        result: '一股温暖的能量流过你的身体，你感到精神焕发。',
                        effects: { hp: 15 }
                    },
                    {
                        text: '献祭（失去10%生命值，获得一张稀有卡牌）',
                        result: '你的血液滴在神龛上，一张闪烁着光芒的卡牌出现在你面前。',
                        effects: { hp: -10, addCard: 'skill_2' }
                    },
                    {
                        text: '亵渎（打碎神龛，获得25金币）',
                        result: '你打碎了神龛，从中找到了一些金币，但你感到一丝不安。',
                        effects: { gold: 25 }
                    }
                ]
            },
            {
                title: '迷路的旅行者',
                description: '你遇到了一个迷路的旅行者，他看起来又饿又累。',
                options: [
                    {
                        text: '分享食物（失去5%生命值）',
                        result: '旅行者感激地接受了你的帮助，作为回报，他给了你一些有用的信息。',
                        effects: { hp: -5 }
                    },
                    {
                        text: '给予金币（失去15金币）',
                        result: '旅行者感谢你的慷慨，并送给你一张他收集的卡牌。',
                        effects: { gold: -15, addCard: 'defend_1' }
                    },
                    {
                        text: '无视他',
                        result: '你继续前行，留下旅行者独自一人。',
                        effects: {}
                    }
                ]
            }
        ];

        // 随机选择一个事件
        return events[Math.floor(Math.random() * events.length)];
    }
}