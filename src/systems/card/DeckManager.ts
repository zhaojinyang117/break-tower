import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { CardType } from '../../core/types';
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

                    // 检查手牌数量是否超过上限
                    this.checkHandSize();
                }
            });
        }

        return drawnCount;
    }

    /**
     * 检查手牌数量
     * 如果手牌数量超过上限，切换到弃牌场景
     */
    private checkHandSize(): void {
        if (this.hand.length > this.maxHandSize) {
            console.log(`DeckManager: 手牌数量(${this.hand.length})超过上限(${this.maxHandSize})，需要弃牌`);

            // 获取手牌数据
            const handCards: CardData[] = this.hand.map(cardSprite => (cardSprite as any).getCardData());

            // 计算需要弃掉的牌数量
            const cardsToDiscard = this.hand.length - this.maxHandSize;

            // 暂停当前场景
            const currentScene = this.scene.scene.key;
            this.scene.scene.pause();

            // 启动弃牌场景
            this.scene.scene.launch('DiscardScene', {
                cards: handCards,
                deckManager: this,
                returnScene: currentScene,
                cardsToDiscard: cardsToDiscard
            });
        }
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
        try {
            // 获取卡牌数据
            const cardData = (cardSprite as any).getCardData();
            if (!cardData) {
                console.log('DeckManager: 卡牌数据不存在');
                return false;
            }

            // 从手牌中移除卡牌
            const cardIndex = this.hand.indexOf(cardSprite);
            if (cardIndex === -1) {
                console.log('DeckManager: 卡牌不在手牌中');
                return false;
            }

            console.log(`DeckManager: 尝试打出卡牌 ${cardData.name}`);

            // 获取玩家对象
            const player = (cardSprite as any).scene.combatManager?.getPlayer();
            if (!player) {
                console.log('DeckManager: 无法获取玩家对象');
                this.arrangeHand();
                return false;
            }

            // 地牌特殊处理
            if (cardData.type === CardType.LAND) {
                // 如果是地牌，检查是否可以使用
                if (!player.canPlayLand()) {
                    console.log('DeckManager: 本回合已经使用过地牌，不能再使用');
                    // 返回原位置
                    this.arrangeHand();
                    return false;
                }
            } else {
                // 非地牌需要检查能量是否足够
                if (cardData.cost > player.getEnergy()) {
                    console.log(`DeckManager: 能量不足，需要 ${cardData.cost} 点能量，当前只有 ${player.getEnergy()} 点`);
                    // 返回原位置
                    this.arrangeHand();
                    return false;
                }
            }

            // 能量足够，先从手牌中移除卡牌
            console.log(`DeckManager: 卡牌 ${cardData.name} 能量足够，开始处理`);

            // 从手牌中移除卡牌
            this.hand.splice(cardIndex, 1);
            // 添加到弃牌堆
            this.discardPile.push(cardData);

            console.log(`DeckManager: 卡牌 ${cardData.name} 被打出并加入弃牌堆，当前弃牌堆大小: ${this.discardPile.length}`);

            // 添加打出卡牌的动画
            this.scene.tweens.add({
                targets: cardSprite,
                x: gameConfig.WIDTH / 2,
                y: gameConfig.HEIGHT / 2,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    try {
                        // 销毁卡牌精灵
                        this.cardManager.destroyCardSprite(cardSprite);

                        // 重新排列手牌
                        this.arrangeHand();

                        console.log(`DeckManager: 卡牌 ${cardData.name} 动画完成，当前手牌数量: ${this.hand.length}`);
                    } catch (error) {
                        console.error('DeckManager: 卡牌动画完成回调错误', error);
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

            // 在卡牌已经从手牌中移除并加入弃牌堆后，触发回调
            if (this.onCardPlayed) {
                try {
                    this.onCardPlayed(cardData);
                } catch (error) {
                    console.error('DeckManager: 卡牌打出回调错误', error);
                    // 即使回调出错，卡牌也已经被移除了
                }
            } else {
                console.log('DeckManager: 没有设置卡牌打出回调');
            }

            return true;
        } catch (error) {
            console.error('DeckManager: playCard 方法错误', error);
            // 出错时返回原位置
            this.arrangeHand();
            return false;
        }
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
     * 弃置指定卡牌
     * @param cardData 要弃置的卡牌数据
     */
    discardCard(cardData: CardData): void {
        // 找到要弃置的卡牌精灵
        const cardIndex = this.hand.findIndex(cardSprite => {
            const spriteCardData = (cardSprite as any).getCardData();
            return spriteCardData && spriteCardData.id === cardData.id;
        });

        if (cardIndex === -1) {
            console.log(`DeckManager: 找不到要弃置的卡牌 ${cardData.name}`);
            return;
        }

        // 从手牌中移除卡牌
        const cardSprite = this.hand.splice(cardIndex, 1)[0];

        // 添加到弃牌堆
        this.discardPile.push(cardData);

        // 销毁卡牌精灵
        this.cardManager.destroyCardSprite(cardSprite);

        console.log(`DeckManager: 弃置卡牌 ${cardData.name}`);

        // 重新排列手牌
        this.arrangeHand();
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

    /**
     * 横置卡牌（用于地牌）
     * @param cardSprite 卡牌精灵
     * @param tapped 是否横置
     */
    tapCard(cardSprite: Phaser.GameObjects.Sprite, tapped: boolean = true): void {
        // 检查卡牌是否有setTapped方法
        if ((cardSprite as any).setTapped) {
            (cardSprite as any).setTapped(tapped);
        } else {
            console.log('DeckManager: 卡牌精灵没有setTapped方法');
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