import Phaser from 'phaser';
import { Button } from '../components/Button';
import { StateManager } from '../../state/StateManager';
import { Game } from '../../core/game';
import { GameStateType, CardType, TargetType, Rarity, EffectType } from '../../core/types';
import { BASE_CARDS } from '../../systems/card/CardData';
import { MapGenerator } from '../../systems/map/MapGenerator';

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

    async create(): Promise<void> {
        console.log('MainMenuScene: 创建主菜单');

        // 创建背景
        this.createBackground();

        // 创建标题
        this.createTitle();

        // 创建菜单按钮
        this.createMenuButtons();

        // 检查是否有保存的游戏
        await this.checkSavedGame();

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
    private async checkSavedGame(): Promise<void> {
        // 检查是否有保存的游戏
        this.hasSavedGame = await this.stateManager.hasSavedRun();
        console.log(`MainMenuScene: 已保存的游戏: ${this.hasSavedGame ? '是' : '否'}`);

        // 更新继续游戏按钮的状态
        if (this.continueButton) {
            if (!this.hasSavedGame) {
                this.continueButton.setDisabled(true);
            } else {
                this.continueButton.setDisabled(false);
            }
        }
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
            onComplete: async () => {
                // 删除之前的存档（如果有）
                await this.stateManager.deleteSavedRun();

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

                // 找到基础地牌
                const basicLand = BASE_CARDS.find(card => card.id === 'basic_land');
                if (basicLand) {
                    // 计算需要添加的地牌数量（总牌数的25%）
                    const currentDeckSize = fullDeck.length;
                    const targetLandCount = Math.ceil(currentDeckSize * 0.25);

                    console.log(`MainMenuScene: 添加${targetLandCount}张地牌到牌组中（总牌数${currentDeckSize}的25%）`);

                    // 添加地牌到牌组中，并确保均匀分布
                    for (let i = 0; i < targetLandCount; i++) {
                        // 将地牌插入到牌组的随机位置
                        const insertPosition = Math.floor(Math.random() * (fullDeck.length + 1));
                        fullDeck.splice(insertPosition, 0, { ...basicLand });
                    }

                    console.log(`MainMenuScene: 牌组初始化完成，总牌数: ${fullDeck.length}`);
                } else {
                    console.error('MainMenuScene: 无法找到基础地牌数据');
                }

                // 创建新的运行状态
                this.stateManager.createNewRun('玩家', 80, fullDeck);

                // 创建地图生成器
                const mapGenerator = new MapGenerator();
                console.log('MainMenuScene: 创建地图生成器');

                // 生成新地图
                try {
                    const newMap = mapGenerator.generateMap();
                    console.log('MainMenuScene: 生成新地图成功');

                    // 设置地图到运行状态
                    this.stateManager.setMap(newMap);
                    console.log('MainMenuScene: 设置地图到运行状态');
                } catch (error) {
                    console.error('MainMenuScene: 生成地图失败:', error);
                }

                // 保存新的运行状态
                await this.stateManager.saveCurrentRun();
                console.log('MainMenuScene: 新的运行状态已保存');

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
            onComplete: async () => {
                // 加载保存的游戏
                await this.stateManager.loadSavedRun();

                // 切换到地图场景
                this.scene.start('MapScene', { continueSavedGame: true });
            }
        });
    }
}