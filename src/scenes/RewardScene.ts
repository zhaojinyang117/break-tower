import Phaser from 'phaser';
import { CardData, BASE_CARDS } from '../config/cardData';
import RunStateManager from '../managers/RunStateManager';
import { generateCardSvg, svgToImage } from '../utils/SvgGenerator';
import { Card } from '../managers/DeckManager';
import { gameConfig } from '../config/gameConfig';

/**
 * 奖励数据接口
 */
interface RewardData {
    gold: number;
    cards: CardData[];
    nodeId: string;
    isElite?: boolean;
    isBoss?: boolean;
}

/**
 * 奖励场景
 * 用于战斗胜利后显示奖励选择
 */
export class RewardScene extends Phaser.Scene {
    // 场景数据
    private rewardData!: RewardData;
    private runStateManager!: RunStateManager;

    // UI元素
    private titleText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private cardChoices: Card[] = [];
    private continueButton!: Phaser.GameObjects.Container;

    // 奖励选择状态
    private cardSelected: boolean = false;

    constructor() {
        super('RewardScene');
    }

    /**
     * 初始化场景
     * @param data 场景数据
     */
    init(data: RewardData): void {
        this.rewardData = data;
    }

    /**
     * 预加载资源
     */
    preload(): void {
        // 预加载卡牌图像
        if (this.rewardData && this.rewardData.cards) {
            this.rewardData.cards.forEach(card => {
                const cardSvgUrl = generateCardSvg(
                    gameConfig.CARD.WIDTH,
                    gameConfig.CARD.HEIGHT,
                    card.type,
                    card.name,
                    card.cost,
                    card.description
                );
                this.textures.addBase64(`card_${card.id}`, cardSvgUrl);
            });
        }
    }

    /**
     * 创建场景
     */
    create(): void {
        // 初始化状态管理器
        this.runStateManager = RunStateManager.getInstance();

        // 创建背景
        this.createBackground();

        // 创建UI元素
        this.createUI();

        // 显示奖励
        this.showRewards();

        console.log('奖励场景已创建');
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 半透明黑色背景
        const background = this.add.rectangle(
            0, 0, gameConfig.WIDTH, gameConfig.HEIGHT, 0x000000, 0.7
        );
        background.setOrigin(0);

        // 奖励面板背景
        const panelBg = this.add.rectangle(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2,
            gameConfig.WIDTH * 0.8,
            gameConfig.HEIGHT * 0.8,
            0x333366,
            0.9
        );
        panelBg.setStrokeStyle(2, 0x6666aa);
    }

    /**
     * 创建UI元素
     */
    private createUI(): void {
        // 标题
        let title = '战斗胜利！';
        if (this.rewardData.isElite) {
            title = '精英战斗胜利！';
        } else if (this.rewardData.isBoss) {
            title = 'Boss战斗胜利！';
        }

        this.titleText = this.add.text(gameConfig.WIDTH / 2, 100, title, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 金币奖励文本
        this.goldText = this.add.text(
            gameConfig.WIDTH / 2,
            150,
            `获得 ${this.rewardData.gold} 金币`,
            {
                fontSize: '24px',
                color: '#ffff00'
            }
        ).setOrigin(0.5);

        // 卡牌选择提示
        if (this.rewardData.cards && this.rewardData.cards.length > 0) {
            this.add.text(
                gameConfig.WIDTH / 2,
                200,
                '选择一张卡牌加入你的牌组：',
                {
                    fontSize: '20px',
                    color: '#ffffff'
                }
            ).setOrigin(0.5);
        }

        // 继续按钮
        const buttonBg = this.add.rectangle(0, 0, 150, 50, 0x336633);
        const buttonText = this.add.text(0, 0, '继续', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.continueButton = this.add.container(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT - 100,
            [buttonBg, buttonText]
        );
        this.continueButton.setSize(150, 50);
        this.continueButton.setInteractive();

        // 继续按钮点击事件
        this.continueButton.on('pointerdown', () => {
            this.handleContinue();
        });

        // 继续按钮鼠标悬停效果
        this.continueButton.on('pointerover', () => {
            buttonBg.setFillStyle(0x66aa66);
        });

        this.continueButton.on('pointerout', () => {
            buttonBg.setFillStyle(0x336633);
        });
    }

    /**
     * 显示奖励
     */
    private showRewards(): void {
        // 更新金币
        if (this.rewardData.gold > 0) {
            this.runStateManager.updateGold(this.rewardData.gold);
        }

        // 显示卡牌选择
        this.showCardChoices();
    }

    /**
     * 显示卡牌选择
     */
    private showCardChoices(): void {
        // 如果没有卡牌奖励，返回
        if (!this.rewardData.cards || this.rewardData.cards.length === 0) {
            return;
        }

        // 清除现有卡牌
        this.cardChoices.forEach(card => card.destroy());
        this.cardChoices = [];

        // 计算卡牌位置
        const cardCount = this.rewardData.cards.length;
        const cardGap = 30;
        const totalWidth = cardCount * gameConfig.CARD.WIDTH + (cardCount - 1) * cardGap;
        const startX = (gameConfig.WIDTH - totalWidth) / 2 + gameConfig.CARD.WIDTH / 2;

        // 创建卡牌
        this.rewardData.cards.forEach((cardData, index) => {
            const x = startX + index * (gameConfig.CARD.WIDTH + cardGap);
            const y = gameConfig.HEIGHT / 2;

            // 创建卡牌
            const card = new Card(this, x, y, cardData);
            card.setInteractive();

            // 添加点击事件
            card.on('pointerdown', () => {
                this.selectCard(card, cardData);
            });

            // 添加鼠标悬停效果
            card.on('pointerover', () => {
                if (!this.cardSelected) {
                    card.setScale(1.1);
                }
            });

            card.on('pointerout', () => {
                if (!this.cardSelected) {
                    card.setScale(1);
                }
            });

            this.cardChoices.push(card);
        });
    }

    /**
     * 选择卡牌
     * @param card 选择的卡牌对象
     * @param cardData 卡牌数据
     */
    private selectCard(card: Card, cardData: CardData): void {
        // 如果已经选择了卡牌，忽略
        if (this.cardSelected) {
            return;
        }

        // 设置已选择状态
        this.cardSelected = true;

        // 添加卡牌到牌组
        this.runStateManager.addCard(cardData);

        // 视觉效果：选中的卡牌放大并移动到中心
        const timeline = this.tweens.chain({
            tweens: [
                {
                    targets: this.cardChoices.filter(c => c !== card),
                    alpha: 0,
                    scale: 0.8,
                    duration: 300
                },
                {
                    targets: card,
                    x: gameConfig.WIDTH / 2,
                    y: gameConfig.HEIGHT / 2,
                    scale: 1.2,
                    duration: 500
                }
            ]
        });

        // 播放动画
        timeline.play();

        // 显示选择文本
        this.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 + 200,
            `你选择了: ${cardData.name}`,
            {
                fontSize: '20px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // 启用继续按钮
        this.continueButton.setAlpha(1);
    }

    /**
     * 处理继续按钮点击
     */
    private handleContinue(): void {
        // 如果有卡牌奖励但尚未选择卡牌，提示玩家选择
        if (this.rewardData.cards && this.rewardData.cards.length > 0 && !this.cardSelected) {
            const warningText = this.add.text(
                gameConfig.WIDTH / 2,
                gameConfig.HEIGHT - 150,
                '请先选择一张卡牌',
                {
                    fontSize: '20px',
                    color: '#ff5555'
                }
            ).setOrigin(0.5);

            // 2秒后淡出提示
            this.tweens.add({
                targets: warningText,
                alpha: 0,
                duration: 1000,
                delay: 1000,
                onComplete: () => {
                    warningText.destroy();
                }
            });

            return;
        }

        // 返回地图场景
        this.scene.start('MapScene');
    }
} 