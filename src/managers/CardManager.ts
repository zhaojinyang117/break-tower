import Phaser from 'phaser';
import { CardData } from '../config/cardData';

export class CardManager {
    private scene: Phaser.Scene;

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
        // 创建卡牌精灵
        const sprite = this.scene.add.sprite(x, y, 'card');

        // 附加卡牌数据到精灵上
        (sprite as any).cardData = cardData;

        // 添加获取卡牌数据的方法
        (sprite as any).getCardData = function () {
            return (this as any).cardData;
        };

        return sprite;
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
    }

    /**
     * 禁用卡牌交互性
     * @param cardSprite 卡牌精灵
     */
    disableCardInteractive(cardSprite: Phaser.GameObjects.Sprite): void {
        cardSprite.disableInteractive();
    }
} 