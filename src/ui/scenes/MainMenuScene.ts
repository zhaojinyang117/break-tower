import Phaser from 'phaser';
import { Button } from '../components/Button';
import { StateManager } from '../../state/StateManager';
import { Game } from '../../core/game';
import { GameStateType, CardType, TargetType, Rarity, EffectType } from '../../core/types';

export class MainMenuScene extends Phaser.Scene {
    private title!: Phaser.GameObjects.Text;
    private startButton!: Button;
    private continueButton!: Button;
    private settingsButton!: Button;
    private stateManager: StateManager;
    private hasSavedGame: boolean = false;

    constructor() {
        super('MainMenuScene');
        this.stateManager = StateManager.getInstance();
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

        // 更新游戏状态
        Game.getInstance().setCurrentState(GameStateType.MAIN_MENU);
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
        // 检查是否有保存的游戏
        this.hasSavedGame = this.stateManager.hasSavedRun();
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
        this.startButton = new Button(this, {
            x: width / 2,
            y: startY,
            width: buttonWidth,
            height: buttonHeight,
            text: '新游戏',
            backgroundColor: 0x007bff,
            hoverColor: 0x0069d9,
            borderRadius: 10,
            onClick: () => {
                console.log('点击了新游戏按钮');
                this.startNewGame();
            }
        });

        // 创建"继续游戏"按钮（只有在有保存的游戏时才启用）
        this.continueButton = new Button(this, {
            x: width / 2,
            y: startY + buttonHeight + buttonSpacing,
            width: buttonWidth,
            height: buttonHeight,
            text: '继续游戏',
            backgroundColor: 0x28a745,
            hoverColor: 0x218838,
            borderRadius: 10,
            onClick: () => {
                console.log('点击了继续游戏按钮');
                this.continueGame();
            }
        });

        // 如果没有保存的游戏，禁用"继续游戏"按钮
        if (!this.hasSavedGame) {
            this.continueButton.setDisabled(true);
        }

        // 创建"设置"按钮
        this.settingsButton = new Button(this, {
            x: width / 2,
            y: startY + (buttonHeight + buttonSpacing) * 2,
            width: buttonWidth,
            height: buttonHeight,
            text: '设置',
            backgroundColor: 0x6c757d,
            hoverColor: 0x5a6268,
            borderRadius: 10,
            onClick: () => {
                console.log('点击了设置按钮');
                this.scene.start('SettingsScene');
            }
        });
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
                this.stateManager.deleteSavedRun();

                // 创建新的游戏状态
                // 创建基本的卡组
                const startingDeck = [
                    {
                        id: 'strike',
                        name: '打击',
                        description: '造成 6 点伤害',
                        type: CardType.ATTACK,
                        rarity: Rarity.STARTER,
                        cost: 1,
                        target: TargetType.ENEMY_SINGLE,
                        effects: [
                            { type: EffectType.DAMAGE, value: 6 }
                        ]
                    },
                    {
                        id: 'defend',
                        name: '防御',
                        description: '获得 5 点格挡',
                        type: CardType.SKILL,
                        rarity: Rarity.STARTER,
                        cost: 1,
                        target: TargetType.SELF,
                        effects: [
                            { type: EffectType.BLOCK, value: 5 }
                        ]
                    },
                    {
                        id: 'bash',
                        name: '重击',
                        description: '造成 8 点伤害并给予 2 层易伤',
                        type: CardType.ATTACK,
                        rarity: Rarity.STARTER,
                        cost: 2,
                        target: TargetType.ENEMY_SINGLE,
                        effects: [
                            { type: EffectType.DAMAGE, value: 8 },
                            { type: EffectType.DEBUFF, value: 2 }
                        ]
                    }
                ];

                // 复制卡牌以创建更多的初始卡牌
                const fullDeck = [...startingDeck];
                for (let i = 0; i < 2; i++) {
                    fullDeck.push({ ...startingDeck[0] });
                    fullDeck.push({ ...startingDeck[1] });
                }

                // 创建新的运行状态
                this.stateManager.createNewRun('玩家', 80, fullDeck);

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
                // 加载保存的游戏
                this.stateManager.loadSavedRun();

                // 切换到地图场景
                this.scene.start('MapScene', { continueSavedGame: true });
            }
        });
    }
}