import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { CardData } from './CardData';
import { CardManager } from './CardManager';

/**
 * 卡组管理器
 * 负责管理抽牌堆、手牌和弃牌堆
 */
export class DeckManager {
    private scene: Phaser.Scene;
    private cardManager: CardManager;

    // 卡牌堆
    private drawPile: CardData[] = [];
    private hand: Phaser.GameObjects.Sprite[] = [];
    private discardPile: CardData[] = [];

    // 最大手牌上限
    private maxHandSize: number;

    // 事件回调
    private onCardPlayed: ((card: CardData) => void) | null = null;

    /**
     * 构造函数
     * @param scene 场景引用
     * @param cardManager 卡牌管理器
     */
    constructor(scene: Phaser.Scene, cardManager: CardManager) {
        this.scene = scene;
        this.cardManager = cardManager;
        this.maxHandSize = gameConfig.PLAYER.MAX_HAND_SIZE;
    }

    /**
     * 初始化卡组
     * @param deck 初始卡组
     */
    initializeDeck(deck: CardData[]): void {
        // 清空所有卡牌堆
        this.clearAll();

        // 添加卡牌到抽牌堆
        this.drawPile = [...deck];

        // 洗牌
        this.shuffleDrawPile();

        console.log(`DeckManager: 初始化卡组，共 ${this.drawPile.length} 张卡牌`);
    }

    /**
     * 洗牌（抽牌堆）
     */
    shuffleDrawPile(): void {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
        console.log('DeckManager: 洗牌完成');
    }

    /**
     * 抽牌
     * @param count 抽牌数量
     * @returns 实际抽到的卡牌数量
     */
    drawCard(count: number = 1): number {
        let drawnCount = 0;

        for (let i = 0; i < count; i++) {
            // 检查手牌是否已达上限
            if (this.hand.length >= this.maxHandSize) {
                console.log('DeckManager: 手牌已满，无法抽取更多卡牌');
                break;
            }

            // 如果抽牌堆为空，将弃牌堆洗回抽牌堆
            if (this.drawPile.length === 0) {
                if (this.discardPile.length === 0) {
                    console.log('DeckManager: 牌库已空，无法抽取更多卡牌');
                    break;
                }
                this.reshuffleDiscardPile();
            }

            // 从抽牌堆中抽取一张卡牌
            const cardData = this.drawPile.pop()!;

            // 创建卡牌精灵并添加到手牌
            const cardX = gameConfig.WIDTH / 2;
            const cardY = gameConfig.HEIGHT - 150;
            const cardSprite = this.cardManager.createCardSprite(cardData, cardX, cardY);
            
            // 设置卡牌交互性
            this.setupCardInteraction(cardSprite);
            
            this.hand.push(cardSprite);
            drawnCount++;

            // 添加抽牌动画
            this.scene.tweens.add({
                targets: cardSprite,
                y: cardY,
                alpha: 1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    // 重新排列手牌
                    this.arrangeHand();
                }
            });
        }

        return drawnCount;
    }

    /**
     * 设置卡牌交互
     * @param cardSprite 卡牌精灵
     */
    private setupCardInteraction(cardSprite: Phaser.GameObjects.Sprite): void {
        this.cardManager.setCardInteractive(cardSprite, true);

        // 添加拖动事件
        cardSprite.on('dragstart', (pointer: Phaser.Input.Pointer) => {
            cardSprite.setDepth(100); // 确保拖动的卡牌在最上层
            if ((cardSprite as any).textContainer) {
                (cardSprite as any).textContainer.setDepth(100);
            }
        });

        cardSprite.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            cardSprite.x = dragX;
            cardSprite.y = dragY;
            if ((cardSprite as any).textContainer) {
                (cardSprite as any).textContainer.x = dragX;
                (cardSprite as any).textContainer.y = dragY;
            }
        });

        cardSprite.on('dragend', (pointer: Phaser.Input.Pointer) => {
            // 检查是否在有效区域释放卡牌
            if (this.isValidPlayArea(pointer.y)) {
                this.playCard(cardSprite);
            } else {
                // 返回原位置
                this.arrangeHand();
            }
        });
    }

    /**
     * 检查是否在有效的出牌区域
     * @param y Y坐标
     * @returns 是否在有效区域
     */
    private isValidPlayArea(y: number): boolean {
        // 例如，如果Y坐标小于屏幕高度的2/3，则认为是有效的出牌区域
        return y < gameConfig.HEIGHT * 2 / 3;
    }

    /**
     * 将弃牌堆洗回抽牌堆
     */
    private reshuffleDiscardPile(): void {
        console.log('DeckManager: 将弃牌堆洗回抽牌堆');
        this.drawPile = [...this.discardPile];
        this.discardPile = [];
        this.shuffleDrawPile();
    }

    /**
     * 重新排列手牌
     */
    arrangeHand(): void {
        const handCenter = gameConfig.WIDTH / 2;
        const handY = gameConfig.HEIGHT - 150;
        const cardWidth = gameConfig.CARD.WIDTH * gameConfig.CARD.SCALE.DEFAULT;
        const spacing = Math.min(40, (gameConfig.WIDTH - cardWidth) / Math.max(1, this.hand.length));

        const totalWidth = this.hand.length * cardWidth + (this.hand.length - 1) * spacing;
        let startX = handCenter - totalWidth / 2 + cardWidth / 2;

        this.hand.forEach((cardSprite, index) => {
            const targetX = startX + index * (cardWidth + spacing);
            
            // 添加移动动画
            this.scene.tweens.add({
                targets: cardSprite,
                x: targetX,
                y: handY,
                depth: index,
                duration: 200,
                ease: 'Power2'
            });

            // 同时移动文本容器
            if ((cardSprite as any).textContainer) {
                this.scene.tweens.add({
                    targets: (cardSprite as any).textContainer,
                    x: targetX,
                    y: handY,
                    depth: index,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });
    }

    /**
     * 打出卡牌
     * @param cardSprite 卡牌精灵
     * @returns 是否成功打出
     */
    playCard(cardSprite: Phaser.GameObjects.Sprite): boolean {
        // 获取卡牌数据
        const cardData = (cardSprite as any).getCardData();
        if (!cardData) return false;

        // 从手牌中移除卡牌
        const cardIndex = this.hand.indexOf(cardSprite);
        if (cardIndex === -1) return false;

        this.hand.splice(cardIndex, 1);
        this.discardPile.push(cardData);

        // 添加打出卡牌的动画
        this.scene.tweens.add({
            targets: cardSprite,
            x: gameConfig.WIDTH / 2,
            y: gameConfig.HEIGHT / 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // 销毁卡牌精灵
                this.cardManager.destroyCardSprite(cardSprite);
                
                // 重新排列手牌
                this.arrangeHand();
                
                // 触发卡牌打出事件
                if (this.onCardPlayed) {
                    this.onCardPlayed(cardData);
                }
            }
        });

        // 同时移动文本容器
        if ((cardSprite as any).textContainer) {
            this.scene.tweens.add({
                targets: (cardSprite as any).textContainer,
                x: gameConfig.WIDTH / 2,
                y: gameConfig.HEIGHT / 2,
                alpha: 0,
                duration: 300,
                ease: 'Power2'
            });
        }

        return true;
    }

    /**
     * 弃置手牌
     */
    discardHand(): void {
        // 将所有手牌移到弃牌堆
        for (const cardSprite of this.hand) {
            const cardData = (cardSprite as any).getCardData();
            if (cardData) {
                this.discardPile.push(cardData);
            }
            this.cardManager.destroyCardSprite(cardSprite);
        }

        this.hand = [];
        console.log('DeckManager: 弃置所有手牌');
    }

    /**
     * 清空所有卡牌
     */
    clearAll(): void {
        // 清空手牌
        for (const cardSprite of this.hand) {
            this.cardManager.destroyCardSprite(cardSprite);
        }

        // 清空所有卡牌堆
        this.drawPile = [];
        this.hand = [];
        this.discardPile = [];

        console.log('DeckManager: 清空所有卡牌');
    }

    /**
     * 设置卡牌打出回调
     * @param callback 回调函数
     */
    setOnCardPlayed(callback: (card: CardData) => void): void {
        this.onCardPlayed = callback;
    }

    /**
     * 禁用所有手牌的交互
     */
    disableCardInteraction(): void {
        for (const cardSprite of this.hand) {
            this.cardManager.disableCardInteractive(cardSprite);
        }
    }

    /**
     * 启用所有手牌的交互
     */
    enableCardInteraction(): void {
        for (const cardSprite of this.hand) {
            this.cardManager.setCardInteractive(cardSprite, true);
        }
    }

    // Getter方法
    getHandSize(): number {
        return this.hand.length;
    }

    getDrawPileSize(): number {
        return this.drawPile.length;
    }

    getDiscardPileSize(): number {
        return this.discardPile.length;
    }

    getHand(): Phaser.GameObjects.Sprite[] {
        return this.hand;
    }

    getAllCards(): CardData[] {
        const allCards: CardData[] = [];

        // 添加抽牌堆中的卡牌
        allCards.push(...this.drawPile);

        // 添加弃牌堆中的卡牌
        allCards.push(...this.discardPile);

        // 添加手牌中的卡牌
        for (const cardSprite of this.hand) {
            const cardData = (cardSprite as any).getCardData();
            if (cardData) {
                allCards.push(cardData);
            }
        }

        return allCards;
    }
}