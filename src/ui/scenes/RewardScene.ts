import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { StateManager } from '../../state/StateManager';
import { CardData, BASE_CARDS } from '../../systems/card/CardData';
import { CardDisplay } from '../components/CardDisplay';
import { Button } from '../components/Button';
import { Rarity } from '../../core/types';

/**
 * 奖励场景
 * 战斗胜利后显示奖励选择
 */
export class RewardScene extends Phaser.Scene {
    private stateManager: StateManager;
    private nodeId: string = '';
    private isElite: boolean = false;
    private isBoss: boolean = false;
    private cardRewards: CardData[] = [];
    private goldReward: number = 0;
    private cardDisplays: CardDisplay[] = [];
    private continueButton!: Button;

    constructor() {
        super('RewardScene');
        this.stateManager = StateManager.getInstance();
    }

    /**
     * 初始化场景
     * @param data 场景数据
     */
    init(data: any): void {
        console.log('RewardScene: 初始化场景', data);
        this.nodeId = data.nodeId || '';
        this.isElite = data.isElite || false;
        this.isBoss = data.isBoss || false;
    }

    /**
     * 创建场景
     */
    create(): void {
        console.log('RewardScene: 创建奖励场景');

        // 创建背景
        this.createBackground();

        // 生成奖励
        this.generateRewards();

        // 创建UI元素
        this.createUI();

        // 显示奖励
        this.displayRewards();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 创建一个简单的颜色渐变背景
        const background = this.add.graphics();

        // 添加底色
        background.fillGradientStyle(
            0x002200, 0x002200,
            0x004400, 0x004400,
            1
        );
        background.fillRect(0, 0, gameConfig.WIDTH, gameConfig.HEIGHT);

        // 添加一些装饰元素
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, gameConfig.WIDTH);
            const y = Phaser.Math.Between(0, gameConfig.HEIGHT);
            const radius = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            background.fillStyle(0x55ff55, alpha);
            background.fillCircle(x, y, radius);
        }
    }

    /**
     * 生成奖励
     */
    private generateRewards(): void {
        // 生成金币奖励
        if (this.isElite) {
            this.goldReward = Phaser.Math.Between(
                gameConfig.REWARDS.GOLD_PER_ELITE.min,
                gameConfig.REWARDS.GOLD_PER_ELITE.max
            );
        } else if (this.isBoss) {
            this.goldReward = Phaser.Math.Between(
                gameConfig.REWARDS.GOLD_PER_BOSS.min,
                gameConfig.REWARDS.GOLD_PER_BOSS.max
            );
        } else {
            this.goldReward = Phaser.Math.Between(
                gameConfig.REWARDS.GOLD_PER_BATTLE.min,
                gameConfig.REWARDS.GOLD_PER_BATTLE.max
            );
        }

        // 生成卡牌奖励
        this.generateCardRewards();

        // 应用金币奖励
        const runState = this.stateManager.getCurrentRun();
        if (runState) {
            this.stateManager.updateGold(this.goldReward);
        }
    }

    /**
     * 生成卡牌奖励
     */
    private generateCardRewards(): void {
        // 确定卡牌数量
        const cardCount = gameConfig.REWARDS.CARDS_PER_BATTLE;

        // 确定卡牌稀有度分布
        let rarityDistribution: Rarity[] = [];

        if (this.isElite) {
            // 精英战斗有更高概率获得稀有卡牌
            rarityDistribution = [
                Rarity.COMMON, Rarity.COMMON,
                Rarity.UNCOMMON, Rarity.UNCOMMON,
                Rarity.RARE
            ];
        } else if (this.isBoss) {
            // Boss战斗有很高概率获得稀有卡牌
            rarityDistribution = [
                Rarity.UNCOMMON, Rarity.UNCOMMON,
                Rarity.RARE, Rarity.RARE, Rarity.RARE
            ];
        } else {
            // 普通战斗主要是普通卡牌
            rarityDistribution = [
                Rarity.COMMON, Rarity.COMMON, Rarity.COMMON,
                Rarity.UNCOMMON, Rarity.UNCOMMON,
                Rarity.RARE
            ];
        }

        // 生成卡牌
        for (let i = 0; i < cardCount; i++) {
            // 随机选择稀有度
            const rarity = rarityDistribution[Math.floor(Math.random() * rarityDistribution.length)];

            // 从基础卡牌中筛选符合稀有度的卡牌
            const availableCards = BASE_CARDS.filter(card => card.rarity === rarity);

            if (availableCards.length > 0) {
                // 随机选择一张卡牌
                const randomIndex = Math.floor(Math.random() * availableCards.length);
                const selectedCard = { ...availableCards[randomIndex] };

                // 生成唯一ID
                selectedCard.id = `${selectedCard.id}_${Date.now()}_${i}`;

                this.cardRewards.push(selectedCard);
            }
        }
    }

    /**
     * 创建UI元素
     */
    private createUI(): void {
        // 创建标题
        this.add.text(gameConfig.WIDTH / 2, 50, '战斗胜利！', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 创建奖励标题
        this.add.text(gameConfig.WIDTH / 2, 120, '选择一张卡牌加入你的卡组', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 创建金币奖励文本
        this.add.text(gameConfig.WIDTH / 2, 160, `获得 ${this.goldReward} 金币`, {
            fontSize: '24px',
            color: '#ffff00'
        }).setOrigin(0.5);

        // 创建跳过按钮
        const skipButton = new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: gameConfig.HEIGHT - 100,
            width: 150,
            height: 40,
            text: '跳过卡牌',
            backgroundColor: 0x6c757d,
            hoverColor: 0x5a6268,
            borderRadius: 10,
            onClick: () => {
                this.continueToMap();
            }
        });

        // 创建继续按钮（初始隐藏）
        this.continueButton = new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: gameConfig.HEIGHT - 100,
            width: 150,
            height: 40,
            text: '继续',
            backgroundColor: 0x28a745,
            hoverColor: 0x218838,
            borderRadius: 10,
            onClick: () => {
                this.continueToMap();
            }
        });
        this.continueButton.setVisible(false);
    }

    /**
     * 显示奖励
     */
    private displayRewards(): void {
        // 显示卡牌奖励
        const cardWidth = gameConfig.CARD.WIDTH * gameConfig.CARD.SCALE.DEFAULT;
        const cardSpacing = 50;
        const totalWidth = this.cardRewards.length * cardWidth + (this.cardRewards.length - 1) * cardSpacing;
        const startX = (gameConfig.WIDTH - totalWidth) / 2 + cardWidth / 2;

        this.cardRewards.forEach((card, index) => {
            const x = startX + index * (cardWidth + cardSpacing);
            const y = gameConfig.HEIGHT / 2;

            const cardDisplay = new CardDisplay(this, card, {
                x,
                y,
                scale: gameConfig.CARD.SCALE.DEFAULT,
                interactive: true,
                draggable: false,
                onClick: (display) => {
                    this.onCardClick(display);
                }
            });

            this.cardDisplays.push(cardDisplay);
        });
    }

    /**
     * 卡牌点击事件处理
     * @param cardDisplay 卡牌显示
     */
    private onCardClick(cardDisplay: CardDisplay): void {
        const card = cardDisplay.getCardData();
        console.log(`RewardScene: 选择卡牌 ${card.name}`);

        // 添加卡牌到卡组
        this.stateManager.addCard(card);

        // 禁用所有卡牌交互
        this.cardDisplays.forEach(display => {
            display.setInteractive(false);
        });

        // 高亮选中的卡牌
        cardDisplay.setScale(gameConfig.CARD.SCALE.HOVER);

        // 显示继续按钮，隐藏跳过按钮
        this.continueButton.setVisible(true);
        this.children.getAll().forEach(child => {
            if (child instanceof Button && child.text.text === '跳过卡牌') {
                child.setVisible(false);
            }
        });

        // 显示选择提示
        this.add.text(gameConfig.WIDTH / 2, gameConfig.HEIGHT - 150, `已选择: ${card.name}`, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    /**
     * 继续到地图场景
     */
    private continueToMap(): void {
        // 保存游戏状态
        this.stateManager.saveCurrentRun();

        // 返回地图场景
        this.scene.start('MapScene');
    }
}