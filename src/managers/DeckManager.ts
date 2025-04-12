import Phaser from 'phaser';
import { CardData, BASE_CARDS } from '../config/cardData';
import gameConfig from '../config/gameConfig';

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

        // 创建卡牌背景
        this.background = scene.add.image(0, 0, 'card');
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
    playCard(card: Card, target?: any): boolean {
        // 检查能量是否足够
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
} 