import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { CardDisplay } from '../components/CardDisplay';
import { Button } from '../components/Button';
import { CardData } from '../../systems/card/CardData';
import { DeckManager } from '../../systems/card/DeckManager';

/**
 * 弃牌场景
 * 当手牌超过上限时，玩家需要选择要弃掉的牌
 */
export class DiscardScene extends Phaser.Scene {
    private cards: CardData[] = [];
    private cardDisplays: CardDisplay[] = [];
    private selectedCard: CardDisplay | null = null;
    private confirmButton!: Button;
    private titleText!: Phaser.GameObjects.Text;
    private instructionText!: Phaser.GameObjects.Text;
    private deckManager: DeckManager | null = null;
    private returnScene: string = '';
    private cardsToDiscard: number = 0;

    constructor() {
        super('DiscardScene');
    }

    /**
     * 初始化场景
     * @param data 初始化数据
     */
    init(data: { cards: CardData[], deckManager: DeckManager, returnScene: string, cardsToDiscard: number }): void {
        this.cards = data.cards;
        this.deckManager = data.deckManager;
        this.returnScene = data.returnScene;
        this.cardsToDiscard = data.cardsToDiscard;
        this.selectedCard = null;
    }

    /**
     * 创建场景
     */
    create(): void {
        console.log('DiscardScene: 创建弃牌场景');

        // 创建半透明背景
        this.add.rectangle(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2,
            gameConfig.WIDTH,
            gameConfig.HEIGHT,
            0x000000,
            0.7
        );

        // 创建标题
        this.titleText = this.add.text(
            gameConfig.WIDTH / 2,
            50,
            '手牌超过上限',
            {
                fontSize: '32px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // 创建说明文本
        this.instructionText = this.add.text(
            gameConfig.WIDTH / 2,
            100,
            `请选择 ${this.cardsToDiscard} 张要弃掉的牌`,
            {
                fontSize: '24px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // 创建确认按钮
        this.confirmButton = new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: gameConfig.HEIGHT - 100,
            width: 200,
            height: 50,
            text: '确认弃牌',
            backgroundColor: 0x28a745,
            hoverColor: 0x218838,
            borderRadius: 10,
            onClick: () => {
                this.confirmDiscard();
            }
        });

        // 禁用确认按钮，直到选择了卡牌
        this.confirmButton.setInteractive(false);
        this.confirmButton.setAlpha(0.5);

        // 显示卡牌
        this.displayCards();
    }

    /**
     * 显示卡牌
     */
    private displayCards(): void {
        // 清除现有卡牌显示
        this.clearCardDisplays();

        // 计算卡牌布局
        const cardWidth = gameConfig.CARD.WIDTH * gameConfig.CARD.SCALE.DEFAULT;
        const cardHeight = gameConfig.CARD.HEIGHT * gameConfig.CARD.SCALE.DEFAULT;
        const cardsPerRow = 5;
        const horizontalSpacing = (gameConfig.WIDTH - cardsPerRow * cardWidth) / (cardsPerRow + 1);
        const verticalSpacing = 30;
        const startY = 200;

        // 显示卡牌
        this.cards.forEach((card, index) => {
            const row = Math.floor(index / cardsPerRow);
            const col = index % cardsPerRow;
            const x = horizontalSpacing + col * (cardWidth + horizontalSpacing) + cardWidth / 2;
            const y = startY + row * (cardHeight + verticalSpacing) + cardHeight / 2;

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
     * 清除卡牌显示
     */
    private clearCardDisplays(): void {
        this.cardDisplays.forEach(display => {
            display.destroy();
        });
        this.cardDisplays = [];
    }

    /**
     * 卡牌点击事件处理
     * @param cardDisplay 卡牌显示
     */
    private onCardClick(cardDisplay: CardDisplay): void {
        // 如果已经选择了这张卡牌，取消选择
        if (this.selectedCard === cardDisplay) {
            this.selectedCard.setSelected(false);
            this.selectedCard = null;
            
            // 禁用确认按钮
            this.confirmButton.setInteractive(false);
            this.confirmButton.setAlpha(0.5);
            return;
        }

        // 如果已经选择了其他卡牌，取消之前的选择
        if (this.selectedCard) {
            this.selectedCard.setSelected(false);
        }

        // 选择当前卡牌
        this.selectedCard = cardDisplay;
        cardDisplay.setSelected(true);

        // 启用确认按钮
        this.confirmButton.setInteractive(true);
        this.confirmButton.setAlpha(1);
    }

    /**
     * 确认弃牌
     */
    private confirmDiscard(): void {
        if (!this.selectedCard || !this.deckManager) return;

        // 获取选中的卡牌数据
        const cardData = this.selectedCard.getCardData();
        console.log(`DiscardScene: 弃掉卡牌 ${cardData.name}`);

        // 弃掉选中的卡牌
        this.deckManager.discardCard(cardData);

        // 减少需要弃掉的卡牌数量
        this.cardsToDiscard--;

        // 如果还需要弃掉更多卡牌，更新UI并继续
        if (this.cardsToDiscard > 0) {
            // 更新说明文本
            this.instructionText.setText(`请选择 ${this.cardsToDiscard} 张要弃掉的牌`);
            
            // 更新卡牌列表（移除已弃掉的卡牌）
            this.cards = this.cards.filter(card => card.id !== cardData.id);
            
            // 重置选择状态
            this.selectedCard = null;
            
            // 禁用确认按钮
            this.confirmButton.setInteractive(false);
            this.confirmButton.setAlpha(0.5);
            
            // 重新显示卡牌
            this.displayCards();
        } else {
            // 所有卡牌都已弃掉，返回战斗场景
            this.scene.resume(this.returnScene);
            this.scene.stop();
        }
    }
}