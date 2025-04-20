import Phaser from 'phaser';
import { gameConfig } from '../../config/gameConfig';
import RunStateManager from '../../managers/RunStateManager';

/**
 * 休息场景
 * 玩家可以在这里恢复生命值或升级卡牌
 */
export class RestScene extends Phaser.Scene {
    // 场景元素
    private background!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private restButton!: Phaser.GameObjects.Container;
    private upgradeButton!: Phaser.GameObjects.Container;
    private continueButton!: Phaser.GameObjects.Container;

    // 状态管理
    private runStateManager!: RunStateManager;
    private hasRested: boolean = false;
    private hasUpgraded: boolean = false;

    constructor() {
        super('RestScene');
    }

    /**
     * 创建场景
     */
    create(data?: any): void {
        console.log('RestScene: 创建休息场景');

        // 初始化状态管理器
        this.runStateManager = RunStateManager.getInstance();

        // 创建背景
        this.createBackground();

        // 创建标题
        this.titleText = this.add.text(
            gameConfig.WIDTH / 2,
            50,
            '休息点',
            { fontSize: '32px', color: '#ffffff' }
        ).setOrigin(0.5);

        // 创建休息按钮
        this.createRestButton();

        // 创建升级按钮
        this.createUpgradeButton();

        // 创建继续按钮
        this.createContinueButton();
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
        this.add.circle(100, 100, 30, 0xf1c40f, 0.5); // 火堆光源
        this.add.circle(100, 100, 20, 0xe74c3c, 0.8); // 火堆中心
    }

    /**
     * 创建休息按钮
     */
    private createRestButton(): void {
        const buttonBg = this.add.rectangle(0, 0, 200, 60, 0x3498db);
        const buttonText = this.add.text(0, 0, '休息 (恢复30%生命)', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.restButton = this.add.container(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 - 50,
            [buttonBg, buttonText]
        );
        this.restButton.setSize(200, 60);
        this.restButton.setInteractive();

        this.restButton.on('pointerdown', () => {
            this.rest();
        });
    }

    /**
     * 创建升级按钮
     */
    private createUpgradeButton(): void {
        const buttonBg = this.add.rectangle(0, 0, 200, 60, 0x9b59b6);
        const buttonText = this.add.text(0, 0, '升级卡牌', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.upgradeButton = this.add.container(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 + 50,
            [buttonBg, buttonText]
        );
        this.upgradeButton.setSize(200, 60);
        this.upgradeButton.setInteractive();

        this.upgradeButton.on('pointerdown', () => {
            this.upgrade();
        });
    }

    /**
     * 创建继续按钮
     */
    private createContinueButton(): void {
        const buttonBg = this.add.rectangle(0, 0, 200, 60, 0x2ecc71);
        const buttonText = this.add.text(0, 0, '继续旅程', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.continueButton = this.add.container(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 + 150,
            [buttonBg, buttonText]
        );
        this.continueButton.setSize(200, 60);
        this.continueButton.setInteractive();

        this.continueButton.on('pointerdown', () => {
            this.continue();
        });
    }

    /**
     * 休息恢复生命值
     */
    private rest(): void {
        if (this.hasRested) {
            this.showMessage('你已经休息过了');
            return;
        }

        const runState = this.runStateManager.getCurrentRun();
        if (!runState) return;

        // 恢复30%的最大生命值
        const healAmount = Math.floor(runState.maxHp * 0.3);
        this.runStateManager.updateHp(healAmount);

        // 标记已休息
        this.hasRested = true;
        this.showMessage(`恢复了 ${healAmount} 点生命值`);

        // 禁用休息按钮
        (this.restButton.getAt(0) as Phaser.GameObjects.Rectangle).setFillStyle(0x7f8c8d);
        this.restButton.disableInteractive();
    }

    /**
     * 升级卡牌
     */
    private upgrade(): void {
        if (this.hasUpgraded) {
            this.showMessage('你已经升级过卡牌了');
            return;
        }

        // 跳转到卡牌升级场景
        this.scene.start('UpgradeScene', { fromScene: 'RestScene' });
    }

    /**
     * 继续旅程
     */
    private continue(): void {
        // 返回地图场景
        this.scene.start('MapScene');
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