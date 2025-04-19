import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { StateManager } from '../../state/StateManager';
import { CardData, BASE_CARDS } from '../../systems/card/CardData';
import { CardDisplay } from '../components/CardDisplay';
import { Button } from '../components/Button';

/**
 * 卡组查看场景
 * 用于查看和管理玩家的卡组
 */
export class DeckViewScene extends Phaser.Scene {
    private stateManager: StateManager;
    private cards: CardData[] = [];
    private cardDisplays: CardDisplay[] = [];
    private backButton!: Button;
    private sortButton!: Button;
    private filterButtons: Button[] = [];
    private currentPage: number = 0;
    private cardsPerPage: number = 10;
    private currentFilter: string = 'all';
    private currentSort: string = 'cost';

    // 地牌管理按钮和文本
    private landCountText: Phaser.GameObjects.Text | null = null;
    private addLandButton: Button | null = null;
    private removeLandButton: Button | null = null;

    constructor() {
        super('DeckViewScene');
        this.stateManager = StateManager.getInstance();
    }

    /**
     * 创建场景
     */
    create(): void {
        console.log('DeckViewScene: 创建卡组查看场景');

        // 创建背景
        this.createBackground();

        // 创建UI元素
        this.createUI();

        // 加载卡组
        this.loadDeck();

        // 显示卡牌
        this.displayCards();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 创建一个简单的颜色渐变背景
        const background = this.add.graphics();

        // 添加底色
        background.fillGradientStyle(
            0x001122, 0x001122,
            0x002244, 0x002244,
            1
        );
        background.fillRect(0, 0, gameConfig.WIDTH, gameConfig.HEIGHT);

        // 添加一些装饰元素
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, gameConfig.WIDTH);
            const y = Phaser.Math.Between(0, gameConfig.HEIGHT);
            const radius = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            background.fillStyle(0x5599ff, alpha);
            background.fillCircle(x, y, radius);
        }
    }

    /**
     * 创建UI元素
     */
    private createUI(): void {
        // 创建标题
        this.add.text(gameConfig.WIDTH / 2, 50, '卡组查看', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 创建返回按钮
        this.backButton = new Button(this, {
            x: 100,
            y: 50,
            width: 120,
            height: 40,
            text: '返回',
            backgroundColor: 0x6c757d,
            hoverColor: 0x5a6268,
            borderRadius: 10,
            onClick: () => {
                this.scene.start('MapScene');
            }
        });

        // 创建排序按钮
        this.sortButton = new Button(this, {
            x: gameConfig.WIDTH - 100,
            y: 50,
            width: 120,
            height: 40,
            text: '排序: 费用',
            backgroundColor: 0x17a2b8,
            hoverColor: 0x138496,
            borderRadius: 10,
            onClick: () => {
                this.toggleSort();
            }
        });

        // 创建过滤按钮
        const filterTypes = [
            { id: 'all', text: '全部' },
            { id: 'attack', text: '攻击' },
            { id: 'skill', text: '技能' },
            { id: 'power', text: '能力' },
            { id: 'land', text: '地牌' }
        ];

        const buttonWidth = 100;
        const spacing = 20;
        const totalWidth = filterTypes.length * buttonWidth + (filterTypes.length - 1) * spacing;
        const startX = (gameConfig.WIDTH - totalWidth) / 2;

        filterTypes.forEach((type, index) => {
            const button = new Button(this, {
                x: startX + index * (buttonWidth + spacing) + buttonWidth / 2,
                y: 100,
                width: buttonWidth,
                height: 30,
                text: type.text,
                backgroundColor: type.id === this.currentFilter ? 0x28a745 : 0x6c757d,
                hoverColor: type.id === this.currentFilter ? 0x218838 : 0x5a6268,
                borderRadius: 5,
                onClick: () => {
                    this.setFilter(type.id);
                }
            });

            this.filterButtons.push(button);
        });

        // 创建分页按钮
        this.createPaginationButtons();
    }

    /**
     * 创建分页按钮
     */
    private createPaginationButtons(): void {
        // 上一页按钮
        const prevButton = new Button(this, {
            x: gameConfig.WIDTH / 2 - 100,
            y: gameConfig.HEIGHT - 50,
            width: 80,
            height: 30,
            text: '上一页',
            backgroundColor: 0x6c757d,
            hoverColor: 0x5a6268,
            borderRadius: 5,
            onClick: () => {
                this.prevPage();
            }
        });

        // 下一页按钮
        const nextButton = new Button(this, {
            x: gameConfig.WIDTH / 2 + 100,
            y: gameConfig.HEIGHT - 50,
            width: 80,
            height: 30,
            text: '下一页',
            backgroundColor: 0x6c757d,
            hoverColor: 0x5a6268,
            borderRadius: 5,
            onClick: () => {
                this.nextPage();
            }
        });

        // 页码文本
        this.add.text(gameConfig.WIDTH / 2, gameConfig.HEIGHT - 50, '第 1 页', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    /**
     * 加载卡组
     */
    private loadDeck(): void {
        const runState = this.stateManager.getCurrentRun();
        if (runState) {
            this.cards = [...runState.deck];
            console.log(`DeckViewScene: 加载了 ${this.cards.length} 张卡牌`);
        } else {
            console.error('DeckViewScene: 无法获取当前运行状态');
        }
    }

    /**
     * 显示卡牌
     */
    private displayCards(): void {
        // 清除现有卡牌显示
        this.clearCardDisplays();

        // 过滤卡牌
        const filteredCards = this.filterCards();

        // 排序卡牌
        const sortedCards = this.sortCards(filteredCards);

        // 计算分页
        const totalPages = Math.ceil(sortedCards.length / this.cardsPerPage);
        this.currentPage = Math.min(this.currentPage, totalPages - 1);
        this.currentPage = Math.max(0, this.currentPage);

        // 获取当前页的卡牌
        const startIndex = this.currentPage * this.cardsPerPage;
        const endIndex = Math.min(startIndex + this.cardsPerPage, sortedCards.length);
        const pageCards = sortedCards.slice(startIndex, endIndex);

        // 更新页码文本
        this.children.getByName('pageText')?.destroy();
        this.add.text(gameConfig.WIDTH / 2, gameConfig.HEIGHT - 50, `第 ${this.currentPage + 1}/${totalPages || 1} 页`, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5).setName('pageText');

        // 显示卡牌
        const cardWidth = gameConfig.CARD.WIDTH * gameConfig.CARD.SCALE.DEFAULT;
        const cardHeight = gameConfig.CARD.HEIGHT * gameConfig.CARD.SCALE.DEFAULT;
        const cardsPerRow = 5;
        const horizontalSpacing = (gameConfig.WIDTH - cardsPerRow * cardWidth) / (cardsPerRow + 1);
        const verticalSpacing = 30;
        const startY = 150;

        pageCards.forEach((card, index) => {
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
     * 过滤卡牌
     * @returns 过滤后的卡牌
     */
    private filterCards(): CardData[] {
        if (this.currentFilter === 'all') {
            return this.cards;
        }

        return this.cards.filter(card => card.type.toLowerCase() === this.currentFilter);
    }

    /**
     * 排序卡牌
     * @param cards 要排序的卡牌
     * @returns 排序后的卡牌
     */
    private sortCards(cards: CardData[]): CardData[] {
        const sortedCards = [...cards];

        switch (this.currentSort) {
            case 'cost':
                sortedCards.sort((a, b) => a.cost - b.cost);
                break;
            case 'name':
                sortedCards.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'type':
                sortedCards.sort((a, b) => a.type.localeCompare(b.type));
                break;
            case 'rarity':
                sortedCards.sort((a, b) => a.rarity.localeCompare(b.rarity));
                break;
        }

        return sortedCards;
    }

    /**
     * 切换排序方式
     */
    private toggleSort(): void {
        const sortOptions = ['cost', 'name', 'type', 'rarity'];
        const sortTexts = ['费用', '名称', '类型', '稀有度'];

        const currentIndex = sortOptions.indexOf(this.currentSort);
        const nextIndex = (currentIndex + 1) % sortOptions.length;

        this.currentSort = sortOptions[nextIndex];
        this.sortButton.setText(`排序: ${sortTexts[nextIndex]}`);

        this.displayCards();
    }

    /**
     * 设置过滤器
     * @param filter 过滤器
     */
    private setFilter(filter: string): void {
        this.currentFilter = filter;
        this.currentPage = 0;

        // 更新按钮颜色
        this.filterButtons.forEach(button => {
            const buttonText = button.text.text;
            let filterId = 'all';

            if (buttonText === '攻击') filterId = 'attack';
            else if (buttonText === '技能') filterId = 'skill';
            else if (buttonText === '能力') filterId = 'power';
            else if (buttonText === '地牌') filterId = 'land';

            if (filterId === this.currentFilter) {
                button.setBackgroundColor(0x28a745);
                button.setHoverColor(0x218838);
            } else {
                button.setBackgroundColor(0x6c757d);
                button.setHoverColor(0x5a6268);
            }
        });

        // 清除地牌管理按钮和文本
        this.clearLandManagementUI();

        // 如果选中了地牌过滤器，显示地牌管理按钮
        if (filter === 'land') {
            this.showLandManagementUI();
        }

        this.displayCards();
    }

    /**
     * 上一页
     */
    private prevPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.displayCards();
        }
    }

    /**
     * 下一页
     */
    private nextPage(): void {
        const filteredCards = this.filterCards();
        const totalPages = Math.ceil(filteredCards.length / this.cardsPerPage);

        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.displayCards();
        }
    }

    /**
     * 显示地牌管理UI
     */
    private showLandManagementUI(): void {
        // 计算当前地牌数量
        const landCards = this.cards.filter(c => c.type.toLowerCase() === 'land');
        const landCount = landCards.length;

        // 显示地牌数量
        this.landCountText = this.add.text(
            gameConfig.WIDTH / 2,
            120,
            `当前地牌数量: ${landCount}`,
            {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // 添加增加地牌按钮
        this.addLandButton = new Button(this, {
            x: gameConfig.WIDTH / 2 - 100,
            y: 120 + 40,
            width: 150,
            height: 40,
            text: '增加地牌',
            backgroundColor: 0x28a745,
            hoverColor: 0x218838,
            borderRadius: 10,
            onClick: () => {
                this.addLandCard();
            }
        });

        // 添加减少地牌按钮
        this.removeLandButton = new Button(this, {
            x: gameConfig.WIDTH / 2 + 100,
            y: 120 + 40,
            width: 150,
            height: 40,
            text: '减少地牌',
            backgroundColor: 0xdc3545,
            hoverColor: 0xc82333,
            borderRadius: 10,
            onClick: () => {
                this.removeLandCard();
            }
        });
    }

    /**
     * 清除地牌管理UI
     */
    private clearLandManagementUI(): void {
        if (this.landCountText) {
            this.landCountText.destroy();
            this.landCountText = null;
        }

        if (this.addLandButton) {
            this.addLandButton.destroy();
            this.addLandButton = null;
        }

        if (this.removeLandButton) {
            this.removeLandButton.destroy();
            this.removeLandButton = null;
        }
    }

    /**
     * 添加地牌
     */
    private addLandCard(): void {
        // 始终从 BASE_CARDS 中获取基础地牌作为模板
        const landTemplate = BASE_CARDS.find(c => c.id === 'basic_land');
        if (!landTemplate) {
            console.error('DeckViewScene: 无法找到基础地牌数据');
            return;
        }

        // 添加基础地牌到牌组
        this.stateManager.addCard({ ...landTemplate });
        console.log(`DeckViewScene: 添加基础地牌 ${landTemplate.name}`);

        // 重新加载牌组
        this.loadDeck();

        // 更新地牌数量显示
        const newLandCount = this.cards.filter(c => c.type.toLowerCase() === 'land').length;
        if (this.landCountText) {
            this.landCountText.setText(`当前地牌数量: ${newLandCount}`);
        }

        // 重新显示卡牌
        this.displayCards();

        console.log(`DeckViewScene: 增加地牌，当前地牌数量: ${newLandCount}`);
    }

    /**
     * 查找基础地牌
     * @param landCards 地牌数组
     * @returns 基础地牌数组
     */
    private findBasicLandCards(landCards: CardData[]): CardData[] {
        // 只返回基础地牌（id为'basic_land'）
        return landCards.filter(card => card.id === 'basic_land');
    }

    /**
     * 移除地牌
     */
    private removeLandCard(): void {
        // 获取所有地牌
        const landCards = this.cards.filter(c => c.type.toLowerCase() === 'land');

        // 如果没有任何地牌，显示没有地牌可移除的提示
        if (landCards.length === 0) {
            console.log('DeckViewScene: 没有地牌可以移除');

            // 显示提示信息
            const infoText = this.add.text(
                gameConfig.WIDTH / 2,
                gameConfig.HEIGHT / 2 - 100,
                '没有地牌可以移除',
                {
                    fontSize: '24px',
                    color: '#ff0000',
                    backgroundColor: '#000000',
                    padding: { x: 10, y: 5 }
                }
            ).setOrigin(0.5);

            // 3秒后自动消失
            this.time.delayedCall(3000, () => {
                infoText.destroy();
            });
            return;
        }

        // 只查找基础地牌（id为'basic_land'）
        const basicLandCards = this.findBasicLandCards(landCards);

        if (basicLandCards.length > 0) {
            // 移除一张基础地牌
            const cardToRemove = basicLandCards[0];
            this.stateManager.removeCard(cardToRemove.id);

            console.log(`DeckViewScene: 移除基础地牌 ${cardToRemove.name}`);

            // 重新加载牌组
            this.loadDeck();

            // 更新地牌数量显示
            const newLandCount = this.cards.filter(c => c.type.toLowerCase() === 'land').length;
            if (this.landCountText) {
                this.landCountText.setText(`当前地牌数量: ${newLandCount}`);
            }

            // 重新显示卡牌
            this.displayCards();

            console.log(`DeckViewScene: 减少地牌，当前地牌数量: ${newLandCount}`);
        } else {
            console.log('DeckViewScene: 有地牌但没有基础地牌可以移除，只能移除基础地牌');

            // 显示提示信息
            const infoText = this.add.text(
                gameConfig.WIDTH / 2,
                gameConfig.HEIGHT / 2 - 100,
                '只能移除基础地牌，高级和稀有地牌不能移除',
                {
                    fontSize: '24px',
                    color: '#ff0000',
                    backgroundColor: '#000000',
                    padding: { x: 10, y: 5 }
                }
            ).setOrigin(0.5);

            // 3秒后自动消失
            this.time.delayedCall(3000, () => {
                infoText.destroy();
            });
        }
    }

    /**
     * 卡牌点击事件处理
     * @param cardDisplay 卡牌显示
     */
    private onCardClick(cardDisplay: CardDisplay): void {
        const card = cardDisplay.getCardData();
        console.log(`DeckViewScene: 点击卡牌 ${card.name}`);

        // 显示卡牌详情
        this.showCardDetails(card);
    }

    /**
     * 显示卡牌详情
     * @param card 卡牌数据
     */
    private showCardDetails(card: CardData): void {
        // 创建半透明背景
        const overlay = this.add.rectangle(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2,
            gameConfig.WIDTH,
            gameConfig.HEIGHT,
            0x000000,
            0.7
        ).setInteractive();

        // 创建卡牌显示
        const cardDisplay = new CardDisplay(this, card, {
            x: gameConfig.WIDTH / 2,
            y: gameConfig.HEIGHT / 2,
            scale: 1.5,
            interactive: false
        });

        // 创建关闭按钮
        const closeButton = new Button(this, {
            x: gameConfig.WIDTH / 2 + 150,
            y: gameConfig.HEIGHT / 2 - 200,
            width: 40,
            height: 40,
            text: 'X',
            backgroundColor: 0xdc3545,
            hoverColor: 0xc82333,
            borderRadius: 20,
            onClick: () => {
                overlay.destroy();
                cardDisplay.destroy();
                closeButton.destroy();
                if (addButton) addButton.destroy();
                if (removeButton) removeButton.destroy();
                if (countText) countText.destroy();
            }
        });

        // 如果是地牌，添加增加和减少按钮
        let addButton: Button | null = null;
        let removeButton: Button | null = null;
        let countText: Phaser.GameObjects.Text | null = null;

        if (card.type.toLowerCase() === 'land') {
            // 计算当前地牌数量
            const landCards = this.cards.filter(c => c.type.toLowerCase() === 'land');
            const landCount = landCards.length;

            // 显示地牌数量
            countText = this.add.text(
                gameConfig.WIDTH / 2,
                gameConfig.HEIGHT / 2 + 200,
                `当前地牌数量: ${landCount}`,
                {
                    fontSize: '24px',
                    color: '#ffffff'
                }
            ).setOrigin(0.5);

            // 添加增加地牌按钮
            addButton = new Button(this, {
                x: gameConfig.WIDTH / 2 - 100,
                y: gameConfig.HEIGHT / 2 + 250,
                width: 150,
                height: 40,
                text: '增加地牌',
                backgroundColor: 0x28a745,
                hoverColor: 0x218838,
                borderRadius: 10,
                onClick: () => {
                    // 始终从 BASE_CARDS 中获取基础地牌作为模板
                    const landTemplate = BASE_CARDS.find(c => c.id === 'basic_land');
                    if (!landTemplate) {
                        console.error('DeckViewScene: 无法找到基础地牌数据');
                        return;
                    }

                    // 添加基础地牌到牌组
                    this.stateManager.addCard({ ...landTemplate });
                    console.log(`DeckViewScene: 添加基础地牌 ${landTemplate.name}`);

                    // 重新加载牌组
                    this.loadDeck();

                    // 更新地牌数量显示
                    const newLandCount = this.cards.filter(c => c.type.toLowerCase() === 'land').length;
                    if (countText) {
                        countText.setText(`当前地牌数量: ${newLandCount}`);
                    }

                    console.log(`DeckViewScene: 增加地牌，当前地牌数量: ${newLandCount}`);
                }
            });

            // 添加减少地牌按钮
            removeButton = new Button(this, {
                x: gameConfig.WIDTH / 2 + 100,
                y: gameConfig.HEIGHT / 2 + 250,
                width: 150,
                height: 40,
                text: '减少地牌',
                backgroundColor: 0xdc3545,
                hoverColor: 0xc82333,
                borderRadius: 10,
                onClick: () => {
                    // 获取所有地牌
                    const landCards = this.cards.filter(c => c.type.toLowerCase() === 'land');

                    // 如果没有任何地牌，显示没有地牌可移除的提示
                    if (landCards.length === 0) {
                        console.log('DeckViewScene: 没有地牌可以移除');

                        // 显示提示信息
                        const warningText = this.add.text(
                            gameConfig.WIDTH / 2,
                            gameConfig.HEIGHT / 2 + 150,
                            '没有地牌可以移除',
                            {
                                fontSize: '20px',
                                color: '#ff0000',
                                backgroundColor: '#000000',
                                padding: { x: 10, y: 5 }
                            }
                        ).setOrigin(0.5);

                        // 2秒后自动消失
                        this.time.delayedCall(2000, () => {
                            warningText.destroy();
                        });
                        return;
                    }

                    // 只查找基础地牌（id为'basic_land'）
                    const basicLandCards = this.findBasicLandCards(landCards);

                    if (basicLandCards.length > 0) {
                        // 移除一张基础地牌
                        const cardToRemove = basicLandCards[0];
                        this.stateManager.removeCard(cardToRemove.id);

                        console.log(`DeckViewScene: 移除基础地牌 ${cardToRemove.name}`);

                        // 重新加载牌组
                        this.loadDeck();

                        // 更新地牌数量显示
                        const newLandCount = this.cards.filter(c => c.type.toLowerCase() === 'land').length;
                        if (countText) {
                            countText.setText(`当前地牌数量: ${newLandCount}`);
                        }

                        console.log(`DeckViewScene: 减少地牌，当前地牌数量: ${newLandCount}`);
                    } else {
                        console.log('DeckViewScene: 有地牌但没有基础地牌可以移除，只能移除基础地牌');

                        // 显示提示信息
                        const warningText = this.add.text(
                            gameConfig.WIDTH / 2,
                            gameConfig.HEIGHT / 2 + 150,
                            '只能移除基础地牌',
                            {
                                fontSize: '20px',
                                color: '#ff0000',
                                backgroundColor: '#000000',
                                padding: { x: 10, y: 5 }
                            }
                        ).setOrigin(0.5);

                        // 2秒后自动消失
                        this.time.delayedCall(2000, () => {
                            warningText.destroy();
                        });
                    }
                }
            });
        }

        // 点击背景关闭详情
        overlay.on('pointerdown', () => {
            overlay.destroy();
            cardDisplay.destroy();
            closeButton.destroy();
            if (addButton) addButton.destroy();
            if (removeButton) removeButton.destroy();
            if (countText) countText.destroy();
        });
    }


}