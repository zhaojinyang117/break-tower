import Phaser from 'phaser';
import { gameConfig } from '../../config/gameConfig';
import RunStateManager from '../../managers/RunStateManager';
import { CardData, BASE_CARDS } from '../../systems/card/CardData';
import { CardDisplay } from '../components/CardDisplay';

/**
 * 奖励场景
 * 战斗胜利后显示奖励选择界面
 */
export class RewardScene extends Phaser.Scene {
    // 场景元素
    private background!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private continueButton!: Phaser.GameObjects.Container;

    // 卡牌奖励
    private cardRewards: { card: CardData, display: CardDisplay }[] = [];
    private selectedCard: CardData | null = null;

    // 状态管理
    private runStateManager!: RunStateManager;
    private goldReward: number = 0;
    private fromCombat: boolean = true;
    private isElite: boolean = false;
    private isBoss: boolean = false;

    constructor() {
        super('RewardScene');
    }

    /**
     * 初始化场景数据
     */
    init(data: any): void {
        this.goldReward = data.gold || 0;
        this.fromCombat = data.fromCombat !== undefined ? data.fromCombat : true;
        this.isElite = data.isElite || false;
        this.isBoss = data.isBoss || false;
    }

    /**
     * 创建场景
     */
    create(data?: any): void {
        console.log('RewardScene: 创建奖励场景');

        // 初始化状态管理器
        this.runStateManager = RunStateManager.getInstance();

        // 创建背景
        this.createBackground();

        // 创建标题
        this.titleText = this.add.text(
            gameConfig.WIDTH / 2,
            50,
            '战斗胜利！',
            { fontSize: '32px', color: '#ffffff' }
        ).setOrigin(0.5);

        // 创建金币奖励显示
        this.createGoldReward();

        // 创建卡牌奖励
        this.createCardRewards();

        // 创建继续按钮
        this.createContinueButton();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 创建渐变背景
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
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
     * 创建金币奖励显示
     */
    private createGoldReward(): void {
        // 如果有金币奖励，显示并添加到玩家状态
        if (this.goldReward > 0) {
            // 显示金币奖励
            this.goldText = this.add.text(
                gameConfig.WIDTH / 2,
                120,
                `获得 ${this.goldReward} 金币`,
                { fontSize: '24px', color: '#f1c40f' }
            ).setOrigin(0.5);

            // 添加金币到玩家状态
            this.runStateManager.updateGold(this.goldReward);
            console.log(`RewardScene: 添加 ${this.goldReward} 金币到玩家状态`);
        }
    }

    /**
     * 创建卡牌奖励
     */
    private createCardRewards(): void {
        // 根据战斗类型决定卡牌数量和稀有度
        let cardCount = 3;
        let rareChance = 0.1;
        let uncommonChance = 0.4;

        if (this.isElite) {
            rareChance = 0.2;
            uncommonChance = 0.5;
        } else if (this.isBoss) {
            cardCount = 4;
            rareChance = 0.4;
            uncommonChance = 0.6;
        }

        // 生成卡牌奖励
        const cards: CardData[] = [];
        for (let i = 0; i < cardCount; i++) {
            // 决定卡牌稀有度
            let rarity = 'common';
            const roll = Math.random();
            if (roll < rareChance) {
                rarity = 'rare';
            } else if (roll < rareChance + uncommonChance) {
                rarity = 'uncommon';
            }

            // 从BASE_CARDS中筛选符合稀有度的卡牌
            const availableCards = BASE_CARDS.filter(card =>
                card.rarity.toLowerCase() === rarity &&
                card.type.toLowerCase() !== 'land' // 排除地牌
            );

            if (availableCards.length > 0) {
                // 随机选择一张卡牌
                const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
                cards.push({ ...randomCard });
            }
        }

        // 如果没有生成足够的卡牌，补充普通卡牌
        while (cards.length < cardCount) {
            const commonCards = BASE_CARDS.filter(card =>
                card.rarity.toLowerCase() === 'common' &&
                card.type.toLowerCase() !== 'land'
            );
            if (commonCards.length > 0) {
                const randomCard = commonCards[Math.floor(Math.random() * commonCards.length)];
                cards.push({ ...randomCard });
            } else {
                break; // 如果没有普通卡牌可用，跳出循环
            }
        }

        // 显示卡牌奖励
        const startX = gameConfig.WIDTH / (cards.length + 1);
        const spacing = gameConfig.WIDTH / (cards.length + 1);

        cards.forEach((card, index) => {
            // 创建卡牌显示
            const cardDisplay = new CardDisplay(this, card, {
                x: startX + index * spacing,
                y: 300,
                interactive: true
            });
            this.add.existing(cardDisplay);

            // 添加点击事件
            cardDisplay.on('pointerdown', () => {
                this.selectCard(card, cardDisplay);
            });

            // 保存卡牌奖励信息
            this.cardRewards.push({
                card,
                display: cardDisplay
            });
        });

        // 添加说明文本
        this.add.text(
            gameConfig.WIDTH / 2,
            180,
            '选择一张卡牌添加到你的牌组',
            { fontSize: '20px', color: '#ffffff' }
        ).setOrigin(0.5);
    }

    /**
     * 创建继续按钮
     */
    private createContinueButton(): void {
        const buttonBg = this.add.rectangle(0, 0, 200, 60, 0x2ecc71);
        const buttonText = this.add.text(0, 0, '跳过', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.continueButton = this.add.container(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT - 100,
            [buttonBg, buttonText]
        );
        this.continueButton.setSize(200, 60);
        this.continueButton.setInteractive();

        this.continueButton.on('pointerdown', () => {
            this.continue();
        });
    }

    /**
     * 选择卡牌
     */
    private selectCard(card: CardData, cardDisplay: CardDisplay): void {
        // 如果已经选择了卡牌，取消之前的选择
        if (this.selectedCard) {
            // 找到之前选择的卡牌显示
            const previousDisplay = this.cardRewards.find(reward => reward.card === this.selectedCard)?.display;
            if (previousDisplay) {
                previousDisplay.setSelected(false);
            }
        }

        // 设置新选择的卡牌
        this.selectedCard = card;
        cardDisplay.setSelected(true);

        // 更新继续按钮文本
        const buttonText = this.continueButton.getAt(1) as Phaser.GameObjects.Text;
        buttonText.setText('继续');

        // 显示选择提示
        this.showMessage(`选择了 ${card.name}`);
    }

    /**
     * 继续游戏
     */
    private continue(): void {
        // 如果选择了卡牌，添加到牌组
        if (this.selectedCard) {
            this.runStateManager.addCard(this.selectedCard);
            console.log(`RewardScene: 添加卡牌 ${this.selectedCard.name} 到牌组`);
        } else {
            console.log('RewardScene: 跳过卡牌奖励');
        }

        // 保存游戏状态
        void this.runStateManager.saveCurrentRun();

        // 返回地图场景
        this.scene.start('MapScene');
    }

    /**
     * 显示消息
     */
    private showMessage(message: string): void {
        const messageText = this.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT - 170,
            message,
            { fontSize: '20px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        ).setOrigin(0.5);

        // 3秒后消失
        this.time.delayedCall(3000, () => {
            messageText.destroy();
        });
    }
}