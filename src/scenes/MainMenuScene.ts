import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
    private title!: Phaser.GameObjects.Text;
    private startButton!: Phaser.GameObjects.Container;
    private continueButton!: Phaser.GameObjects.Container;
    private optionsButton!: Phaser.GameObjects.Container;
    private hasSavedGame: boolean = false;

    constructor() {
        super('MainMenuScene');
    }

    create(): void {
        console.log('MainMenuScene: 创建主菜单');

        // 创建背景
        this.createBackground();

        // 创建标题
        this.createTitle();

        // 检查是否有保存的游戏
        this.checkSavedGame();

        // 创建菜单按钮
        this.createMenuButtons();

        // 添加过渡动画
        this.addTransitionAnimations();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 创建一个简单的颜色渐变背景
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const background = this.add.graphics();

        // 添加底色
        background.fillGradientStyle(
            0x000022, 0x000022,
            0x000044, 0x000044,
            1
        );
        background.fillRect(0, 0, width, height);

        // 添加一些装饰元素（星星）
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const radius = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            background.fillStyle(0xffffff, alpha);
            background.fillCircle(x, y, radius);
        }
    }

    /**
     * 创建标题
     */
    private createTitle(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.title = this.add.text(
            width / 2,
            height / 4,
            'BREAK TOWER',
            {
                fontFamily: 'monospace',
                fontSize: '72px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 5,
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // 添加一个简单的动画效果
        this.tweens.add({
            targets: this.title,
            y: height / 4 - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 检查是否有保存的游戏
     */
    private checkSavedGame(): void {
        // 检查localStorage中是否有保存的游戏
        // 这里只是一个占位符，实际实现需要更复杂的逻辑
        this.hasSavedGame = localStorage.getItem('breakTower_savedGame') !== null;
        console.log(`MainMenuScene: 已保存的游戏: ${this.hasSavedGame ? '是' : '否'}`);
    }

    /**
     * 创建菜单按钮
     */
    private createMenuButtons(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonSpacing = 20;
        const startY = height / 2;

        // 创建"新游戏"按钮
        this.startButton = this.createButton(
            width / 2,
            startY,
            '新游戏',
            () => {
                console.log('点击了新游戏按钮');
                this.startNewGame();
            }
        );

        // 创建"继续游戏"按钮（只有在有保存的游戏时才启用）
        this.continueButton = this.createButton(
            width / 2,
            startY + buttonHeight + buttonSpacing,
            '继续游戏',
            () => {
                console.log('点击了继续游戏按钮');
                this.continueGame();
            }
        );

        // 如果没有保存的游戏，禁用"继续游戏"按钮
        if (!this.hasSavedGame) {
            this.continueButton.setAlpha(0.5);
            (this.continueButton as any).disableInteractive();
        }

        // 创建"选项"按钮
        this.optionsButton = this.createButton(
            width / 2,
            startY + (buttonHeight + buttonSpacing) * 2,
            '选项',
            () => {
                console.log('点击了选项按钮');
                // TODO: 实现选项菜单
            }
        );
    }

    /**
     * 创建一个按钮
     */
    private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const buttonWidth = 200;
        const buttonHeight = 50;

        // 创建按钮容器
        const button = this.add.container(x, y);

        // 创建按钮背景
        const background = this.add.image(0, 0, 'button');

        // 创建按钮文本
        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // 将背景和文本添加到容器
        button.add([background, buttonText]);

        // 设置交互
        button.setSize(buttonWidth, buttonHeight);
        button.setInteractive();

        // 添加事件监听器
        button.on('pointerover', () => {
            background.setTint(0x7ba9e0);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            background.clearTint();
            buttonText.setScale(1);
        });

        button.on('pointerdown', () => {
            background.setTint(0x5d8abb);
        });

        button.on('pointerup', () => {
            background.setTint(0x7ba9e0);
            callback();
        });

        return button;
    }

    /**
     * 添加场景过渡动画
     */
    private addTransitionAnimations(): void {
        // 创建一个覆盖整个屏幕的黑色矩形，用于淡入淡出效果
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000)
            .setOrigin(0)
            .setAlpha(1);

        // 淡出效果（显示场景）
        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 1000,
            ease: 'Power2'
        });
    }

    /**
     * 开始新游戏
     */
    private startNewGame(): void {
        // 创建黑色覆盖层用于过渡
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000)
            .setOrigin(0)
            .setAlpha(0);

        // 淡入效果（隐藏当前场景）
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                // 删除之前的存档（如果有）
                localStorage.removeItem('breakTower_savedGame');

                // 切换到地图场景
                this.scene.start('MapScene');
            }
        });
    }

    /**
     * 继续游戏
     */
    private continueGame(): void {
        if (!this.hasSavedGame) {
            return;
        }

        // 创建黑色覆盖层用于过渡
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000)
            .setOrigin(0)
            .setAlpha(0);

        // 淡入效果（隐藏当前场景）
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                // 切换到地图场景，传递继续游戏的标志
                this.scene.start('MapScene', { continueSavedGame: true });
            }
        });
    }
} 