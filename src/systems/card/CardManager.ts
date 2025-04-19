import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { CardData } from './CardData';

/**
 * 卡牌管理器
 * 负责创建和管理卡牌精灵
 */
export class CardManager {
    private scene: Phaser.Scene;
    private cards: Phaser.GameObjects.Sprite[] = [];

    /**
     * 构造函数
     * @param scene 场景引用
     */
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 创建卡牌精灵
     * @param cardData 卡牌数据
     * @param x X坐标
     * @param y Y坐标
     * @returns 卡牌精灵对象
     */
    createCardSprite(cardData: CardData, x: number, y: number): Phaser.GameObjects.Sprite {
        // 确定卡牌纹理
        let textureKey = 'card';
        
        // 根据卡牌类型选择纹理
        if (this.scene.textures.exists(`card_${cardData.type}`)) {
            textureKey = `card_${cardData.type}`;
        }
        
        // 如果有特定卡牌纹理，使用特定纹理
        if (this.scene.textures.exists(`card_${cardData.id}`)) {
            textureKey = `card_${cardData.id}`;
        }

        // 创建卡牌精灵
        const sprite = this.scene.add.sprite(x, y, textureKey);
        
        // 设置卡牌缩放
        sprite.setScale(gameConfig.CARD.SCALE.DEFAULT);

        // 附加卡牌数据到精灵上
        (sprite as any).cardData = cardData;

        // 添加获取卡牌数据的方法
        (sprite as any).getCardData = function (): CardData {
            return (this as any).cardData;
        };

        // 添加卡牌文本
        this.addCardText(sprite, cardData);

        // 将卡牌添加到管理列表
        this.cards.push(sprite);

        return sprite;
    }

    /**
     * 添加卡牌文本
     * @param cardSprite 卡牌精灵
     * @param cardData 卡牌数据
     */
    private addCardText(cardSprite: Phaser.GameObjects.Sprite, cardData: CardData): void {
        const width = gameConfig.CARD.WIDTH;
        const height = gameConfig.CARD.HEIGHT;

        // 创建卡牌文本容器
        const container = this.scene.add.container(cardSprite.x, cardSprite.y);
        container.setSize(width, height);
        
        // 设置容器的缩放与卡牌精灵相同
        container.setScale(cardSprite.scaleX, cardSprite.scaleY);

        // 添加卡牌名称
        const nameText = this.scene.add.text(0, -height * 0.35, cardData.name, {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        container.add(nameText);

        // 添加卡牌费用
        const costText = this.scene.add.text(-width * 0.4, -height * 0.4, cardData.cost.toString(), {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(costText);

        // 添加卡牌描述
        const descText = this.scene.add.text(0, height * 0.25, cardData.description, {
            fontSize: '14px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);
        container.add(descText);

        // 将容器附加到卡牌精灵
        (cardSprite as any).textContainer = container;
    }

    /**
     * 设置卡牌交互性
     * @param cardSprite 卡牌精灵
     * @param draggable 是否可拖拽
     */
    setCardInteractive(cardSprite: Phaser.GameObjects.Sprite, draggable: boolean = true): void {
        cardSprite.setInteractive();

        if (draggable) {
            this.scene.input.setDraggable(cardSprite);
        }

        // 添加悬停效果
        cardSprite.on('pointerover', () => {
            this.scene.tweens.add({
                targets: cardSprite,
                scaleX: gameConfig.CARD.SCALE.HOVER,
                scaleY: gameConfig.CARD.SCALE.HOVER,
                y: cardSprite.y - 20,
                duration: 200,
                ease: 'Power2'
            });

            // 同时缩放文本容器
            if ((cardSprite as any).textContainer) {
                this.scene.tweens.add({
                    targets: (cardSprite as any).textContainer,
                    scaleX: gameConfig.CARD.SCALE.HOVER,
                    scaleY: gameConfig.CARD.SCALE.HOVER,
                    y: cardSprite.y - 20,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });

        cardSprite.on('pointerout', () => {
            this.scene.tweens.add({
                targets: cardSprite,
                scaleX: gameConfig.CARD.SCALE.DEFAULT,
                scaleY: gameConfig.CARD.SCALE.DEFAULT,
                y: cardSprite.y + 20,
                duration: 200,
                ease: 'Power2'
            });

            // 同时缩放文本容器
            if ((cardSprite as any).textContainer) {
                this.scene.tweens.add({
                    targets: (cardSprite as any).textContainer,
                    scaleX: gameConfig.CARD.SCALE.DEFAULT,
                    scaleY: gameConfig.CARD.SCALE.DEFAULT,
                    y: cardSprite.y + 20,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });
    }

    /**
     * 禁用卡牌交互性
     * @param cardSprite 卡牌精灵
     */
    disableCardInteractive(cardSprite: Phaser.GameObjects.Sprite): void {
        cardSprite.disableInteractive();
    }

    /**
     * 销毁卡牌精灵
     * @param cardSprite 卡牌精灵
     */
    destroyCardSprite(cardSprite: Phaser.GameObjects.Sprite): void {
        // 销毁文本容器
        if ((cardSprite as any).textContainer) {
            (cardSprite as any).textContainer.destroy();
        }

        // 从管理列表中移除
        const index = this.cards.indexOf(cardSprite);
        if (index !== -1) {
            this.cards.splice(index, 1);
        }

        // 销毁精灵
        cardSprite.destroy();
    }

    /**
     * 清理所有卡牌
     */
    clearAllCards(): void {
        for (const card of this.cards) {
            this.destroyCardSprite(card);
        }
        this.cards = [];
    }
}