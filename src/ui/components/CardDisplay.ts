import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { CardType } from '../../core/types';
import { CardData } from '../../systems/card/CardData';

/**
 * 卡牌显示配置接口
 */
export interface CardDisplayConfig {
    x: number;
    y: number;
    scale?: number;
    interactive?: boolean;
    draggable?: boolean;
    hoverScale?: number;
    onClick?: (card: CardDisplay) => void;
    onDragStart?: (card: CardDisplay) => void;
    onDragEnd?: (card: CardDisplay) => void;
}

/**
 * 卡牌显示组件
 * 用于显示卡牌的UI组件
 */
export class CardDisplay extends Phaser.GameObjects.Container {
    private cardData: CardData;
    private background: Phaser.GameObjects.Sprite;
    private nameText: Phaser.GameObjects.Text;
    private costText: Phaser.GameObjects.Text;
    private descriptionText: Phaser.GameObjects.Text;
    private config: CardDisplayConfig;
    private defaultScale: number;
    private isHovering: boolean = false;
    private isDragging: boolean = false;
    private startPosition: { x: number, y: number } = { x: 0, y: 0 };

    /**
     * 构造函数
     * @param scene 场景引用
     * @param cardData 卡牌数据
     * @param config 显示配置
     */
    constructor(scene: Phaser.Scene, cardData: CardData, config: CardDisplayConfig) {
        super(scene, config.x, config.y);
        this.cardData = cardData;
        this.config = this.getDefaultConfig(config);
        this.defaultScale = this.config.scale || 1;

        // 创建卡牌背景
        this.background = this.createBackground();
        this.add(this.background);

        // 创建卡牌文本
        this.nameText = this.createNameText();
        this.costText = this.createCostText();
        this.descriptionText = this.createDescriptionText();
        this.add([this.nameText, this.costText, this.descriptionText]);

        // 设置交互
        if (this.config.interactive) {
            this.setupInteraction();
        }

        // 设置缩放
        this.setScale(this.defaultScale);

        // 添加到场景
        scene.add.existing(this);
    }

    /**
     * 获取默认配置
     * @param config 用户配置
     * @returns 合并后的配置
     */
    private getDefaultConfig(config: CardDisplayConfig): CardDisplayConfig {
        return {
            ...config,
            scale: config.scale !== undefined ? config.scale : gameConfig.CARD.SCALE.DEFAULT,
            interactive: config.interactive !== undefined ? config.interactive : true,
            draggable: config.draggable !== undefined ? config.draggable : false,
            hoverScale: config.hoverScale !== undefined ? config.hoverScale : gameConfig.CARD.SCALE.HOVER
        };
    }

    /**
     * 创建卡牌背景
     * @returns 背景精灵
     */
    private createBackground(): Phaser.GameObjects.Sprite {
        // 确定卡牌纹理
        let textureKey = 'card';
        
        // 根据卡牌类型选择纹理
        if (this.scene.textures.exists(`card_${this.cardData.type}`)) {
            textureKey = `card_${this.cardData.type}`;
        }
        
        // 如果有特定卡牌纹理，使用特定纹理
        if (this.scene.textures.exists(`card_${this.cardData.id}`)) {
            textureKey = `card_${this.cardData.id}`;
        }

        return this.scene.add.sprite(0, 0, textureKey);
    }

    /**
     * 创建卡牌名称文本
     * @returns 名称文本
     */
    private createNameText(): Phaser.GameObjects.Text {
        return this.scene.add.text(
            0,
            -gameConfig.CARD.HEIGHT * 0.35,
            this.cardData.name,
            {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5);
    }

    /**
     * 创建卡牌费用文本
     * @returns 费用文本
     */
    private createCostText(): Phaser.GameObjects.Text {
        return this.scene.add.text(
            -gameConfig.CARD.WIDTH * 0.4,
            -gameConfig.CARD.HEIGHT * 0.4,
            this.cardData.cost.toString(),
            {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
    }

    /**
     * 创建卡牌描述文本
     * @returns 描述文本
     */
    private createDescriptionText(): Phaser.GameObjects.Text {
        return this.scene.add.text(
            0,
            gameConfig.CARD.HEIGHT * 0.25,
            this.cardData.description,
            {
                fontSize: '14px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: gameConfig.CARD.WIDTH * 0.8 }
            }
        ).setOrigin(0.5);
    }

    /**
     * 设置交互
     */
    private setupInteraction(): void {
        this.setSize(gameConfig.CARD.WIDTH, gameConfig.CARD.HEIGHT);
        this.setInteractive({ useHandCursor: true });

        // 添加悬停效果
        this.on('pointerover', this.onPointerOver, this);
        this.on('pointerout', this.onPointerOut, this);

        // 添加点击事件
        this.on('pointerdown', this.onPointerDown, this);
        this.on('pointerup', this.onPointerUp, this);

        // 添加拖拽事件
        if (this.config.draggable) {
            this.scene.input.setDraggable(this);
            this.on('dragstart', this.onDragStart, this);
            this.on('drag', this.onDrag, this);
            this.on('dragend', this.onDragEnd, this);
        }
    }

    /**
     * 鼠标悬停事件处理
     */
    private onPointerOver(): void {
        if (this.isDragging) return;

        this.isHovering = true;
        this.scene.tweens.add({
            targets: this,
            scaleX: this.config.hoverScale,
            scaleY: this.config.hoverScale,
            y: this.y - 20,
            duration: 200,
            ease: 'Power2'
        });

        // 将卡牌置于顶层
        this.setDepth(100);
    }

    /**
     * 鼠标离开事件处理
     */
    private onPointerOut(): void {
        if (this.isDragging) return;

        this.isHovering = false;
        this.scene.tweens.add({
            targets: this,
            scaleX: this.defaultScale,
            scaleY: this.defaultScale,
            y: this.y + 20,
            duration: 200,
            ease: 'Power2'
        });

        // 恢复卡牌深度
        this.setDepth(0);
    }

    /**
     * 鼠标按下事件处理
     */
    private onPointerDown(): void {
        // 保存起始位置
        this.startPosition = { x: this.x, y: this.y };
    }

    /**
     * 鼠标释放事件处理
     */
    private onPointerUp(): void {
        if (!this.isDragging && this.isHovering && this.config.onClick) {
            this.config.onClick(this);
        }
    }

    /**
     * 拖拽开始事件处理
     */
    private onDragStart(): void {
        this.isDragging = true;
        this.setDepth(100);

        if (this.config.onDragStart) {
            this.config.onDragStart(this);
        }
    }

    /**
     * 拖拽中事件处理
     * @param pointer 指针
     * @param dragX X坐标
     * @param dragY Y坐标
     */
    private onDrag(pointer: Phaser.Input.Pointer, dragX: number, dragY: number): void {
        this.x = dragX;
        this.y = dragY;
    }

    /**
     * 拖拽结束事件处理
     */
    private onDragEnd(): void {
        this.isDragging = false;
        this.setDepth(0);

        if (this.config.onDragEnd) {
            this.config.onDragEnd(this);
        } else {
            // 如果没有提供拖拽结束回调，返回起始位置
            this.scene.tweens.add({
                targets: this,
                x: this.startPosition.x,
                y: this.startPosition.y,
                duration: 200,
                ease: 'Power2'
            });
        }
    }

    /**
     * 获取卡牌数据
     * @returns 卡牌数据
     */
    getCardData(): CardData {
        return this.cardData;
    }

    /**
     * 设置卡牌数据
     * @param cardData 新的卡牌数据
     */
    setCardData(cardData: CardData): this {
        this.cardData = cardData;

        // 更新卡牌文本
        this.nameText.setText(cardData.name);
        this.costText.setText(cardData.cost.toString());
        this.descriptionText.setText(cardData.description);

        // 更新卡牌背景
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

        this.background.setTexture(textureKey);

        return this;
    }

    /**
     * 设置交互性
     * @param interactive 是否可交互
     */
    setInteractive(interactive: boolean | object = true): this {
        this.config.interactive = typeof interactive === 'boolean' ? interactive : true;

        if (this.config.interactive) {
            super.setInteractive({ useHandCursor: true });
        } else {
            this.disableInteractive();
            this.setAlpha(0.7);
        }

        return this;
    }

    /**
     * 设置是否可拖拽
     * @param draggable 是否可拖拽
     */
    setDraggable(draggable: boolean): this {
        this.config.draggable = draggable;

        if (draggable) {
            this.scene.input.setDraggable(this);
        } else {
            this.scene.input.setDraggable(this, false);
        }

        return this;
    }

    /**
     * 设置点击回调
     * @param callback 回调函数
     */
    setOnClick(callback: (card: CardDisplay) => void): this {
        this.config.onClick = callback;
        return this;
    }

    /**
     * 设置拖拽开始回调
     * @param callback 回调函数
     */
    setOnDragStart(callback: (card: CardDisplay) => void): this {
        this.config.onDragStart = callback;
        return this;
    }

    /**
     * 设置拖拽结束回调
     * @param callback 回调函数
     */
    setOnDragEnd(callback: (card: CardDisplay) => void): this {
        this.config.onDragEnd = callback;
        return this;
    }
}