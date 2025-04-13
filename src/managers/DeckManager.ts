import Phaser from 'phaser';
import { CardData, BASE_CARDS } from '../config/cardData';
import { gameConfig } from '../config/gameConfig';

// 卡牌类（游戏中的可交互卡牌对象）
export class Card extends Phaser.GameObjects.Container {
    private cardData: CardData;
    private background: Phaser.GameObjects.Image;
    private nameText: Phaser.GameObjects.Text;
    private costText: Phaser.GameObjects.Text;
    private descriptionText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, cardData: CardData) {
        super(scene, x, y);
        this.cardData = cardData;

        // 选择纹理 - 根据卡牌类型和消耗选择
        let textureKey = 'card'; // 默认纹理

        // 尝试使用特定类型和消耗的纹理
        if (cardData.type && cardData.cost !== undefined) {
            const specificKey = `card_${cardData.type.toLowerCase()}_${cardData.cost}`;
            if (scene.textures.exists(specificKey)) {
                textureKey = specificKey;
            } else {
                // 尝试使用类型纹理
                const typeKey = `card_${cardData.type.toLowerCase()}`;
                if (scene.textures.exists(typeKey)) {
                    textureKey = typeKey;
                } else {
                    // 尝试使用本地化的纹理
                    const localizedTypes: { [key: string]: string } = {
                        'attack': '攻击',
                        'defend': '防御',
                        'skill': '技能',
                        'power': '能力'
                    };

                    const localized = localizedTypes[cardData.type.toLowerCase()];
                    if (localized && scene.textures.exists(`card_${localized}`)) {
                        textureKey = `card_${localized}`;
                    }
                }
            }
        }

        console.log(`Card: 创建卡牌 ${cardData.name}，使用纹理 ${textureKey}`);

        // 创建卡牌背景
        this.background = scene.add.image(0, 0, textureKey);
        this.background.setDisplaySize(gameConfig.CARD.WIDTH, gameConfig.CARD.HEIGHT);
        this.add(this.background);

        // 创建文本显示
        this.costText = scene.add.text(-gameConfig.CARD.WIDTH / 2 + 20, -gameConfig.CARD.HEIGHT / 2 + 20, `${cardData.cost}`, {
            fontSize: '28px',
            color: '#ffffff'
        });
        this.nameText = scene.add.text(0, -gameConfig.CARD.HEIGHT / 2 + 30, cardData.name, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5, 0);
        this.descriptionText = scene.add.text(0, 20, cardData.description, {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: gameConfig.CARD.WIDTH - 40 }
        }).setOrigin(0.5, 0);

        this.add([this.costText, this.nameText, this.descriptionText]);

        // 添加交互性
        this.setSize(gameConfig.CARD.WIDTH, gameConfig.CARD.HEIGHT);
        this.setInteractive();
        scene.input.setDraggable(this);

        // 添加到场景中
        scene.add.existing(this);
    }

    getCardData(): CardData {
        return this.cardData;
    }
}

/**
 * 卡牌数据接口（与 CardData 区分开）
 */
export interface CardInterface {
    id: string;
    type: string;
    name: string;
    cost: number;
    description: string;
    effects: any[];
}

// 卡牌管理器
export default class DeckManager {
    private scene: Phaser.Scene;

    // 卡牌堆
    private drawPile: CardData[];
    private hand: Card[];
    private discardPile: CardData[];

    // 最大手牌上限
    private maxHandSize: number;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.drawPile = [];
        this.hand = [];
        this.discardPile = [];
        this.maxHandSize = gameConfig.PLAYER.HAND_SIZE;

        // 初始化卡组（使用基础卡牌）
        this.initializeDeck();
    }

    // 初始化卡组
    private initializeDeck(): void {
        // 清空所有卡牌堆
        this.drawPile = [];
        this.hand = [];
        this.discardPile = [];

        // 添加基础卡牌到抽牌堆
        // 初始卡组：5张打击，5张防御
        for (let i = 0; i < 5; i++) {
            this.drawPile.push({ ...BASE_CARDS.find(card => card.id === 'strike')! });
            this.drawPile.push({ ...BASE_CARDS.find(card => card.id === 'defend')! });
        }

        // 添加一张重击
        this.drawPile.push({ ...BASE_CARDS.find(card => card.id === 'bash')! });

        // 洗牌
        this.shuffleDrawPile();
    }

    // 洗牌（抽牌堆）
    shuffleDrawPile(): void {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }

    // 抽牌
    drawCard(count: number = 1): void {
        for (let i = 0; i < count; i++) {
            // 检查手牌是否已达上限
            if (this.hand.length >= this.maxHandSize) {
                console.log('手牌已满，无法抽取更多卡牌');
                return;
            }

            // 如果抽牌堆为空，将弃牌堆洗回抽牌堆
            if (this.drawPile.length === 0) {
                if (this.discardPile.length === 0) {
                    console.log('牌库已空，无法抽取更多卡牌');
                    return;
                }
                this.reshuffleDiscardPile();
            }

            // 从抽牌堆中抽取一张卡牌
            const cardData = this.drawPile.pop()!;

            // 创建卡牌对象并添加到手牌
            const cardX = gameConfig.WIDTH / 2;
            const cardY = gameConfig.HEIGHT - 150;
            const card = new Card(this.scene, cardX, cardY, cardData);
            this.hand.push(card);

            // 重新排列手牌
            this.arrangeHand();
        }
    }

    // 将弃牌堆洗回抽牌堆
    private reshuffleDiscardPile(): void {
        console.log('将弃牌堆洗回抽牌堆');
        this.drawPile = [...this.discardPile];
        this.discardPile = [];
        this.shuffleDrawPile();
    }

    // 重新排列手牌
    arrangeHand(): void {
        const handCenter = gameConfig.WIDTH / 2;
        const handY = gameConfig.HEIGHT - 150;
        const cardWidth = gameConfig.CARD.WIDTH;
        const spacing = 20;

        const totalWidth = this.hand.length * cardWidth + (this.hand.length - 1) * spacing;
        let startX = handCenter - totalWidth / 2 + cardWidth / 2;

        this.hand.forEach((card, index) => {
            const targetX = startX + index * (cardWidth + spacing);
            card.setPosition(targetX, handY);
        });
    }

    // 打出卡牌
    playCard(card: Card): boolean {
        // 获取卡牌数据
        const cardData = card.getCardData();

        // 从手牌中移除卡牌
        const cardIndex = this.hand.indexOf(card);
        if (cardIndex !== -1) {
            this.hand.splice(cardIndex, 1);
            this.discardPile.push(cardData);

            // 销毁卡牌对象
            card.destroy();

            // 重新排列手牌
            this.arrangeHand();

            return true;
        }

        return false;
    }

    // 弃置手牌
    discardHand(): void {
        // 将所有手牌移到弃牌堆
        this.hand.forEach(card => {
            this.discardPile.push(card.getCardData());
            card.destroy();
        });

        this.hand = [];
    }

    // 获取手牌数量
    getHandSize(): number {
        return this.hand.length;
    }

    // 获取抽牌堆数量
    getDrawPileSize(): number {
        return this.drawPile.length;
    }

    // 获取弃牌堆数量
    getDiscardPileSize(): number {
        return this.discardPile.length;
    }

    // 获取手牌数组
    getHand(): Card[] {
        return this.hand;
    }

    /**
     * 设置牌组
     * @param cards 卡牌数组
     */
    setDeck(cards: CardData[]): void {
        this.drawPile = [...cards];
        this.shuffleDrawPile();
    }

    /**
     * 获取所有卡牌（包括抽牌堆、弃牌堆和手牌）
     * @returns 所有卡牌数组
     */
    getAllCards(): CardData[] {
        const allCards: CardData[] = [];

        // 添加抽牌堆中的卡牌
        allCards.push(...this.drawPile);

        // 添加弃牌堆中的卡牌
        allCards.push(...this.discardPile);

        // 添加手牌中的卡牌
        for (const cardSprite of this.hand) {
            const cardData = cardSprite.getCardData();
            if (cardData) {
                allCards.push(cardData);
            }
        }

        return allCards;
    }

    /**
     * 禁用所有手牌的交互
     */
    disableCardInteraction(): void {
        for (const cardSprite of this.hand) {
            cardSprite.disableInteractive();
            cardSprite.setAlpha(0.7); // 视觉上的禁用提示
        }
    }

    /**
     * 创建卡牌精灵
     * @param cardData 卡牌数据
     * @returns 卡牌精灵
     */
    private createCardSprite(cardData: CardData): Phaser.GameObjects.Sprite {
        const x = gameConfig.WIDTH / 2;
        const y = gameConfig.HEIGHT + 100; // 开始在屏幕外

        // 选择基于卡牌类型和能量消耗的纹理
        let textureKey = 'card'; // 默认纹理

        // 尝试使用针对特定类型和能量消耗的纹理
        if (cardData.type && cardData.cost !== undefined) {
            const specificTextureKey = `card_${cardData.type.toLowerCase()}_${cardData.cost}`;
            if (this.scene.textures.exists(specificTextureKey)) {
                textureKey = specificTextureKey;
            } else {
                // 尝试使用针对特定类型的纹理
                const typeTextureKey = `card_${cardData.type.toLowerCase()}`;
                if (this.scene.textures.exists(typeTextureKey)) {
                    textureKey = typeTextureKey;
                } else {
                    // 尝试使用4种基本类型的通用纹理
                    const genericTypeMap: { [key: string]: string } = {
                        'attack': '攻击',
                        'defend': '防御',
                        'skill': '技能',
                        'power': '能力'
                    };

                    const localized = genericTypeMap[cardData.type.toLowerCase()];
                    if (localized && this.scene.textures.exists(`card_${localized}`)) {
                        textureKey = `card_${localized}`;
                    }
                }
            }
        }

        console.log(`DeckManager: 创建卡牌 ${cardData.name}，使用纹理 ${textureKey}`);

        // 创建精灵
        const sprite = this.scene.add.sprite(x, y, textureKey);

        // 设置精灵尺寸
        sprite.setDisplaySize(gameConfig.CARD.WIDTH, gameConfig.CARD.HEIGHT);

        // 添加卡牌名称和描述文本
        this.addCardText(sprite, cardData);

        // 设置为可交互
        sprite.setInteractive();

        // 添加拖动行为
        this.scene.input.setDraggable(sprite);

        return sprite;
    }

    /**
     * 添加卡牌文本
     * @param sprite 卡牌精灵
     * @param cardData 卡牌数据
     */
    private addCardText(sprite: Phaser.GameObjects.Sprite, cardData: CardData): void {
        // 卡牌名称
        const nameText = this.scene.add.text(0, -gameConfig.CARD.HEIGHT / 2 + 20, cardData.name, {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 能量消耗
        const costText = this.scene.add.text(-gameConfig.CARD.WIDTH / 2 + 15, -gameConfig.CARD.HEIGHT / 2 + 15, cardData.cost.toString(), {
            fontSize: '20px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 卡牌描述
        const descriptionText = this.scene.add.text(0, 10, cardData.description, {
            fontSize: '12px',
            color: '#ffffff',
            wordWrap: { width: gameConfig.CARD.WIDTH - 20 },
            align: 'center'
        }).setOrigin(0.5);

        // 创建容器
        const container = this.scene.add.container(sprite.x, sprite.y, [nameText, costText, descriptionText]);

        // 将容器与精灵关联
        sprite.setData('textContainer', container);

        // 修改精灵的拖动逻辑，同时移动文本容器
        sprite.on('dragstart', () => {
            // 保存初始位置
            sprite.setData('startPosition', { x: sprite.x, y: sprite.y });
        });

        sprite.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            sprite.x = dragX;
            sprite.y = dragY;
            container.x = dragX;
            container.y = dragY;
        });
    }
} 