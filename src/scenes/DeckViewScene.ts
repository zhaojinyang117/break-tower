import Phaser from 'phaser';
import { CardData } from '../config/cardData';
import RunStateManager from '../managers/RunStateManager';
import { Card } from '../managers/DeckManager';
import { generateCardSvg, generateBackgroundSvg } from '../utils/SvgGenerator';
import { gameConfig } from '../config/gameConfig';

/**
 * 卡组查看场景
 * 用于显示玩家当前卡组
 */
export default class DeckViewScene extends Phaser.Scene {
    // 状态管理器
    private runStateManager!: RunStateManager;

    // 场景元素
    private background!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private backButton!: Phaser.GameObjects.Container;

    // 卡牌相关
    private cardDisplayContainer!: Phaser.GameObjects.Container;
    private cardList: Card[] = [];
    private cardPage: number = 0;
    private cardsPerPage: number = 10;
    private pageText!: Phaser.GameObjects.Text;
    private prevButton!: Phaser.GameObjects.Container;
    private nextButton!: Phaser.GameObjects.Container;

    constructor() {
        super('DeckViewScene');
    }

    /**
     * 预加载资源
     */
    preload(): void {
        // 生成并预加载背景SVG
        const backgroundSvgUrl = generateBackgroundSvg(gameConfig.WIDTH, gameConfig.HEIGHT, 'rest');
        this.textures.addBase64('deck_background', backgroundSvgUrl);
    }

    /**
     * 创建场景
     */
    create(): void {
        // 初始化状态管理器
        this.runStateManager = RunStateManager.getInstance();

        // 获取卡组数据
        const deck = this.runStateManager.getDeck();

        // 创建场景元素
        this.createBackground();
        this.createUI();

        // 创建卡牌显示容器
        this.cardDisplayContainer = this.add.container(0, 0);

        // 创建分页控制
        this.createPagination(deck.length);

        // 显示卡组
        this.displayCards(deck);

        // 更新分页状态
        this.updatePaginationState(deck.length);

        console.log('卡组查看场景已创建');
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 背景图像
        this.background = this.add.image(gameConfig.WIDTH / 2, gameConfig.HEIGHT / 2, 'deck_background');
        this.background.setDisplaySize(gameConfig.WIDTH, gameConfig.HEIGHT);

        // 半透明覆盖层
        const overlay = this.add.rectangle(0, 0, gameConfig.WIDTH, gameConfig.HEIGHT, 0x000000, 0.5);
        overlay.setOrigin(0);
    }

    /**
     * 创建UI元素
     */
    private createUI(): void {
        // 标题
        this.titleText = this.add.text(gameConfig.WIDTH / 2, 50, '卡组查看', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 返回按钮
        const backBg = this.add.rectangle(0, 0, 120, 40, 0x333366);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.backButton = this.add.container(100, 50, [backBg, backText]);
        this.backButton.setSize(120, 40);
        this.backButton.setInteractive();

        // 添加点击事件
        this.backButton.on('pointerdown', () => {
            this.handleBack();
        });

        // 添加鼠标悬停效果
        this.backButton.on('pointerover', () => {
            backBg.setFillStyle(0x4444aa);
        });

        this.backButton.on('pointerout', () => {
            backBg.setFillStyle(0x333366);
        });
    }

    /**
     * 创建分页控制
     * @param totalCards 总卡牌数
     */
    private createPagination(totalCards: number): void {
        // 页码文本
        this.pageText = this.add.text(gameConfig.WIDTH / 2, gameConfig.HEIGHT - 50, `第 1 页 / 共 ${Math.ceil(totalCards / this.cardsPerPage)} 页`, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 上一页按钮
        const prevBg = this.add.rectangle(0, 0, 100, 40, 0x333366);
        const prevText = this.add.text(0, 0, '上一页', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.prevButton = this.add.container(gameConfig.WIDTH / 2 - 120, gameConfig.HEIGHT - 50, [prevBg, prevText]);
        this.prevButton.setSize(100, 40);
        this.prevButton.setInteractive();

        // 添加点击事件
        this.prevButton.on('pointerdown', () => {
            this.prevPage();
        });

        // 添加鼠标悬停效果
        this.prevButton.on('pointerover', () => {
            prevBg.setFillStyle(0x4444aa);
        });

        this.prevButton.on('pointerout', () => {
            prevBg.setFillStyle(0x333366);
        });

        // 下一页按钮
        const nextBg = this.add.rectangle(0, 0, 100, 40, 0x333366);
        const nextText = this.add.text(0, 0, '下一页', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.nextButton = this.add.container(gameConfig.WIDTH / 2 + 120, gameConfig.HEIGHT - 50, [nextBg, nextText]);
        this.nextButton.setSize(100, 40);
        this.nextButton.setInteractive();

        // 添加点击事件
        this.nextButton.on('pointerdown', () => {
            this.nextPage();
        });

        // 添加鼠标悬停效果
        this.nextButton.on('pointerover', () => {
            nextBg.setFillStyle(0x4444aa);
        });

        this.nextButton.on('pointerout', () => {
            nextBg.setFillStyle(0x333366);
        });
    }

    /**
     * 显示卡牌
     * @param deck 卡组数据
     */
    private displayCards(deck: CardData[]): void {
        // 清除现有卡牌
        this.clearCards();

        // 计算当前页的卡牌
        const startIndex = this.cardPage * this.cardsPerPage;
        const endIndex = Math.min(startIndex + this.cardsPerPage, deck.length);
        const currentPageCards = deck.slice(startIndex, endIndex);

        // 计算布局参数
        const cardWidth = gameConfig.CARD.WIDTH * 0.8;
        const cardHeight = gameConfig.CARD.HEIGHT * 0.8;
        const cardsPerRow = 5;
        const horizontalGap = 20;
        const verticalGap = 30;
        const startX = (gameConfig.WIDTH - (cardsPerRow * cardWidth + (cardsPerRow - 1) * horizontalGap)) / 2 + cardWidth / 2;
        const startY = 150;

        // 创建卡牌
        currentPageCards.forEach((cardData, index) => {
            const row = Math.floor(index / cardsPerRow);
            const col = index % cardsPerRow;

            const x = startX + col * (cardWidth + horizontalGap);
            const y = startY + row * (cardHeight + verticalGap);

            // 预加载卡牌SVG纹理
            const cardKey = `card_${cardData.id}`;
            if (!this.textures.exists(cardKey)) {
                const cardSvgUrl = generateCardSvg(
                    cardWidth,
                    cardHeight,
                    cardData.type,
                    cardData.name,
                    cardData.cost,
                    cardData.description
                );
                this.textures.addBase64(cardKey, cardSvgUrl);
            }

            // 使用Card类创建卡牌
            const card = new Card(this, x, y, cardData);
            card.setScale(0.8);

            // 添加交互
            card.setInteractive();

            // 鼠标悬停效果
            card.on('pointerover', () => {
                card.setScale(0.9);
            });

            card.on('pointerout', () => {
                card.setScale(0.8);
            });

            // 将卡牌添加到列表和容器
            this.cardList.push(card);
            this.cardDisplayContainer.add(card);
        });

        // 如果没有卡牌，显示提示信息
        if (currentPageCards.length === 0) {
            const emptyText = this.add.text(gameConfig.WIDTH / 2, gameConfig.HEIGHT / 2, '卡组为空', {
                fontSize: '24px',
                color: '#aaaaaa'
            }).setOrigin(0.5);

            this.cardDisplayContainer.add(emptyText);
        }
    }

    /**
     * 清除所有卡牌
     */
    private clearCards(): void {
        // 清除卡牌列表
        this.cardList.forEach(card => {
            card.destroy();
        });
        this.cardList = [];

        // 清除容器中的所有元素
        this.cardDisplayContainer.removeAll(true);
    }

    /**
     * 上一页
     */
    private prevPage(): void {
        // 如果已经是第一页，忽略
        if (this.cardPage <= 0) {
            return;
        }

        // 切换到上一页
        this.cardPage--;

        // 重新显示卡牌
        const deck = this.runStateManager.getDeck();
        this.displayCards(deck);

        // 更新分页状态
        this.updatePaginationState(deck.length);
    }

    /**
     * 下一页
     */
    private nextPage(): void {
        const deck = this.runStateManager.getDeck();
        const maxPage = Math.ceil(deck.length / this.cardsPerPage) - 1;

        // 如果已经是最后一页，忽略
        if (this.cardPage >= maxPage) {
            return;
        }

        // 切换到下一页
        this.cardPage++;

        // 重新显示卡牌
        this.displayCards(deck);

        // 更新分页状态
        this.updatePaginationState(deck.length);
    }

    /**
     * 更新分页状态
     * @param totalCards 总卡牌数
     */
    private updatePaginationState(totalCards: number): void {
        const maxPage = Math.ceil(totalCards / this.cardsPerPage);

        // 更新页码文本
        this.pageText.setText(`第 ${this.cardPage + 1} 页 / 共 ${maxPage} 页`);

        // 更新按钮状态
        this.prevButton.setAlpha(this.cardPage > 0 ? 1 : 0.5);
        this.nextButton.setAlpha(this.cardPage < maxPage - 1 ? 1 : 0.5);
    }

    /**
     * 处理返回按钮点击
     */
    private handleBack(): void {
        this.scene.start('MapScene');
    }
} 