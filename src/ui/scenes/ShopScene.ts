import Phaser from 'phaser';
import { gameConfig } from '../../config/gameConfig';
import RunStateManager from '../../managers/RunStateManager';
import { CardData, BASE_CARDS } from '../../systems/card/CardData';
import { CardDisplay } from '../components/CardDisplay';

/**
 * 商店场景
 * 玩家可以在这里购买卡牌、药水和遗物
 */
export class ShopScene extends Phaser.Scene {
    // 场景元素
    private background!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private exitButton!: Phaser.GameObjects.Container;

    // 商品
    private cardItems: { card: CardData, display: CardDisplay, price: number, buyButton: Phaser.GameObjects.Container }[] = [];
    private potionItems: { potion: any, display: Phaser.GameObjects.Container, price: number, buyButton: Phaser.GameObjects.Container }[] = [];
    private relicItems: { relic: any, display: Phaser.GameObjects.Container, price: number, buyButton: Phaser.GameObjects.Container }[] = [];

    // 状态管理
    private runStateManager!: RunStateManager;

    constructor() {
        super('ShopScene');
    }

    /**
     * 创建场景
     */
    create(data?: any): void {
        console.log('ShopScene: 创建商店场景');

        // 初始化状态管理器
        this.runStateManager = RunStateManager.getInstance();

        // 创建背景
        this.createBackground();

        // 创建标题
        this.titleText = this.add.text(
            gameConfig.WIDTH / 2,
            30,
            '商店',
            { fontSize: '32px', color: '#ffffff' }
        ).setOrigin(0.5);

        // 创建金币显示
        this.createGoldDisplay();

        // 生成商品
        this.generateItems();

        // 创建退出按钮
        this.createExitButton();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 创建渐变背景
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        graphics.fillRect(0, 0, gameConfig.WIDTH, gameConfig.HEIGHT);

        // 添加一些装饰元素
        this.add.rectangle(gameConfig.WIDTH / 2, 80, gameConfig.WIDTH * 0.9, 2, 0xf1c40f); // 分隔线
    }

    /**
     * 创建金币显示
     */
    private createGoldDisplay(): void {
        const runState = this.runStateManager.getCurrentRun();
        if (!runState) return;

        this.goldText = this.add.text(
            gameConfig.WIDTH - 100,
            30,
            `金币: ${runState.gold}`,
            { fontSize: '24px', color: '#f1c40f' }
        ).setOrigin(1, 0.5);
    }

    /**
     * 创建退出按钮
     */
    private createExitButton(): void {
        const buttonBg = this.add.rectangle(0, 0, 150, 50, 0xe74c3c);
        const buttonText = this.add.text(0, 0, '离开商店', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.exitButton = this.add.container(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT - 50,
            [buttonBg, buttonText]
        );
        this.exitButton.setSize(150, 50);
        this.exitButton.setInteractive();

        this.exitButton.on('pointerdown', () => {
            this.scene.start('MapScene');
        });
    }

    /**
     * 生成商品
     */
    private generateItems(): void {
        // 生成卡牌商品
        this.generateCardItems();

        // 生成药水商品（简化版，实际游戏中应该有更多种类）
        this.generatePotionItems();

        // 生成遗物商品（简化版，实际游戏中应该有更多种类）
        this.generateRelicItems();
    }

    /**
     * 生成卡牌商品
     */
    private generateCardItems(): void {
        // 从BASE_CARDS中随机选择3张卡牌
        const availableCards = [...BASE_CARDS];
        const selectedCards: CardData[] = [];

        for (let i = 0; i < 3; i++) {
            if (availableCards.length === 0) break;

            const index = Math.floor(Math.random() * availableCards.length);
            selectedCards.push(availableCards.splice(index, 1)[0]);
        }

        // 创建卡牌显示
        const startX = 150;
        const spacing = 250;

        selectedCards.forEach((card, index) => {
            // 设置卡牌价格（根据稀有度）
            let price = 50;
            switch (card.rarity.toLowerCase()) {
                case 'common': price = 50; break;
                case 'uncommon': price = 75; break;
                case 'rare': price = 100; break;
                case 'starter': price = 30; break;
            }

            // 创建卡牌显示
            const cardDisplay = new CardDisplay(this, card, {
                x: startX + index * spacing,
                y: 200,
                interactive: false
            });
            this.add.existing(cardDisplay);

            // 创建价格标签
            const priceText = this.add.text(
                startX + index * spacing,
                280,
                `${price} 金币`,
                { fontSize: '16px', color: '#f1c40f' }
            ).setOrigin(0.5);

            // 创建购买按钮
            const buyButtonBg = this.add.rectangle(0, 0, 100, 30, 0x2ecc71);
            const buyButtonText = this.add.text(0, 0, '购买', {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);

            const buyButton = this.add.container(
                startX + index * spacing,
                320,
                [buyButtonBg, buyButtonText]
            );
            buyButton.setSize(100, 30);
            buyButton.setInteractive();

            buyButton.on('pointerdown', () => {
                this.buyCard(card, price, buyButton);
            });

            // 保存商品信息
            this.cardItems.push({
                card,
                display: cardDisplay,
                price,
                buyButton
            });
        });
    }

    /**
     * 生成药水商品
     */
    private generatePotionItems(): void {
        // 简化版药水
        const potions = [
            { id: 'health_potion', name: '生命药水', description: '恢复20%最大生命值', effect: { type: 'heal', value: 0.2 } },
            { id: 'strength_potion', name: '力量药水', description: '获得2点力量', effect: { type: 'strength', value: 2 } },
            { id: 'draw_potion', name: '抽牌药水', description: '抽3张牌', effect: { type: 'draw', value: 3 } }
        ];

        // 随机选择2种药水
        const selectedPotions = [];
        const availablePotions = [...potions];

        for (let i = 0; i < 2; i++) {
            if (availablePotions.length === 0) break;

            const index = Math.floor(Math.random() * availablePotions.length);
            selectedPotions.push(availablePotions.splice(index, 1)[0]);
        }

        // 创建药水显示
        const startX = 250;
        const spacing = 300;

        selectedPotions.forEach((potion, index) => {
            // 设置药水价格
            const price = 40;

            // 创建药水显示
            const potionCircle = this.add.circle(0, 0, 25, 0x3498db);
            const potionName = this.add.text(0, 40, potion.name, {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);

            const potionDisplay = this.add.container(
                startX + index * spacing,
                450,
                [potionCircle, potionName]
            );

            // 创建价格标签
            const priceText = this.add.text(
                startX + index * spacing,
                500,
                `${price} 金币`,
                { fontSize: '16px', color: '#f1c40f' }
            ).setOrigin(0.5);

            // 创建购买按钮
            const buyButtonBg = this.add.rectangle(0, 0, 100, 30, 0x2ecc71);
            const buyButtonText = this.add.text(0, 0, '购买', {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);

            const buyButton = this.add.container(
                startX + index * spacing,
                540,
                [buyButtonBg, buyButtonText]
            );
            buyButton.setSize(100, 30);
            buyButton.setInteractive();

            buyButton.on('pointerdown', () => {
                this.buyPotion(potion, price, buyButton);
            });

            // 保存商品信息
            this.potionItems.push({
                potion,
                display: potionDisplay,
                price,
                buyButton
            });
        });
    }

    /**
     * 生成遗物商品
     */
    private generateRelicItems(): void {
        // 简化版遗物
        const relics = [
            { id: 'burning_blood', name: '燃烧之血', description: '每场战斗结束后恢复6点生命值', effect: { type: 'heal_after_combat', value: 6 } },
            { id: 'snake_ring', name: '蛇戒', description: '每回合开始时额外抽1张牌', effect: { type: 'draw_per_turn', value: 1 } },
            { id: 'happy_flower', name: '开心花', description: '每3回合获得1点能量', effect: { type: 'energy_every_3_turns', value: 1 } }
        ];

        // 随机选择1种遗物
        const selectedRelic = relics[Math.floor(Math.random() * relics.length)];

        // 设置遗物价格
        const price = 150;

        // 创建遗物显示
        const relicSquare = this.add.rectangle(0, 0, 50, 50, 0x9b59b6);
        const relicName = this.add.text(0, 40, selectedRelic.name, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        const relicDesc = this.add.text(0, 70, selectedRelic.description, {
            fontSize: '12px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: 200 }
        }).setOrigin(0.5);

        const relicDisplay = this.add.container(
            gameConfig.WIDTH / 2,
            450,
            [relicSquare, relicName, relicDesc]
        );

        // 创建价格标签
        const priceText = this.add.text(
            gameConfig.WIDTH / 2,
            520,
            `${price} 金币`,
            { fontSize: '16px', color: '#f1c40f' }
        ).setOrigin(0.5);

        // 创建购买按钮
        const buyButtonBg = this.add.rectangle(0, 0, 100, 30, 0x2ecc71);
        const buyButtonText = this.add.text(0, 0, '购买', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const buyButton = this.add.container(
            gameConfig.WIDTH / 2,
            560,
            [buyButtonBg, buyButtonText]
        );
        buyButton.setSize(100, 30);
        buyButton.setInteractive();

        buyButton.on('pointerdown', () => {
            this.buyRelic(selectedRelic, price, buyButton);
        });

        // 保存商品信息
        this.relicItems.push({
            relic: selectedRelic,
            display: relicDisplay,
            price,
            buyButton
        });
    }

    /**
     * 购买卡牌
     */
    private buyCard(card: CardData, price: number, buyButton: Phaser.GameObjects.Container): void {
        const runState = this.runStateManager.getCurrentRun();
        if (!runState) return;

        // 检查金币是否足够
        if (runState.gold < price) {
            this.showMessage('金币不足');
            return;
        }

        // 扣除金币
        this.runStateManager.updateGold(-price);

        // 添加卡牌到卡组
        this.runStateManager.addCard(card);

        // 更新金币显示
        this.goldText.setText(`金币: ${runState.gold}`);

        // 禁用购买按钮
        buyButton.disableInteractive();
        (buyButton.getAt(0) as Phaser.GameObjects.Rectangle).setFillStyle(0x7f8c8d);
        (buyButton.getAt(1) as Phaser.GameObjects.Text).setText('已购买');

        // 显示成功消息
        this.showMessage(`成功购买 ${card.name}`);
    }

    /**
     * 购买药水
     */
    private buyPotion(potion: any, price: number, buyButton: Phaser.GameObjects.Container): void {
        const runState = this.runStateManager.getCurrentRun();
        if (!runState) return;

        // 检查金币是否足够
        if (runState.gold < price) {
            this.showMessage('金币不足');
            return;
        }

        // 扣除金币
        this.runStateManager.updateGold(-price);

        // 添加药水到背包（简化版，实际应该有药水系统）
        // TODO: 实现药水系统
        console.log(`购买药水: ${potion.name}`);

        // 更新金币显示
        this.goldText.setText(`金币: ${runState.gold}`);

        // 禁用购买按钮
        buyButton.disableInteractive();
        (buyButton.getAt(0) as Phaser.GameObjects.Rectangle).setFillStyle(0x7f8c8d);
        (buyButton.getAt(1) as Phaser.GameObjects.Text).setText('已购买');

        // 显示成功消息
        this.showMessage(`成功购买 ${potion.name}`);
    }

    /**
     * 购买遗物
     */
    private buyRelic(relic: any, price: number, buyButton: Phaser.GameObjects.Container): void {
        const runState = this.runStateManager.getCurrentRun();
        if (!runState) return;

        // 检查金币是否足够
        if (runState.gold < price) {
            this.showMessage('金币不足');
            return;
        }

        // 扣除金币
        this.runStateManager.updateGold(-price);

        // 添加遗物到收藏（简化版，实际应该有遗物系统）
        // TODO: 实现遗物系统
        console.log(`购买遗物: ${relic.name}`);

        // 更新金币显示
        this.goldText.setText(`金币: ${runState.gold}`);

        // 禁用购买按钮
        buyButton.disableInteractive();
        (buyButton.getAt(0) as Phaser.GameObjects.Rectangle).setFillStyle(0x7f8c8d);
        (buyButton.getAt(1) as Phaser.GameObjects.Text).setText('已购买');

        // 显示成功消息
        this.showMessage(`成功购买 ${relic.name}`);
    }

    /**
     * 显示消息
     */
    private showMessage(message: string): void {
        const messageText = this.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT - 100,
            message,
            { fontSize: '20px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        ).setOrigin(0.5);

        // 3秒后消失
        this.time.delayedCall(3000, () => {
            messageText.destroy();
        });
    }
}