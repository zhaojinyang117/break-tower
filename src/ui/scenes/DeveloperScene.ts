import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { Button } from '../components/Button';
import { Game } from '../../core/game';
import { GameStateType, CardType, TargetType, Rarity, EffectType } from '../../core/types';
import { StateManager } from '../../state/StateManager';
import { CardData } from '../../systems/card/CardData';

/**
 * 开发者场景
 * 用于测试游戏的各个组件
 */
export class DeveloperScene extends Phaser.Scene {
    private title!: Phaser.GameObjects.Text;
    private backButton!: Button;
    private stateManager!: StateManager;
    private debugText!: Phaser.GameObjects.Text;

    constructor() {
        super('DeveloperScene');
    }

    create(): void {
        console.log('DeveloperScene: 创建开发者场景');

        // 初始化状态管理器
        this.stateManager = StateManager.getInstance();

        // 创建背景
        this.createBackground();

        // 创建标题
        this.createTitle();

        // 创建返回按钮
        this.createBackButton();

        // 创建测试按钮
        this.createTestButtons();

        // 创建调试文本
        this.createDebugText();

        // 更新游戏状态
        Game.getInstance().setCurrentState(GameStateType.MAIN_MENU);
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 创建一个简单的颜色渐变背景
        const background = this.add.graphics();

        // 添加底色
        background.fillGradientStyle(
            0x220000, 0x220000,
            0x440000, 0x440000,
            1
        );
        background.fillRect(0, 0, gameConfig.WIDTH, gameConfig.HEIGHT);

        // 添加一些装饰元素
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, gameConfig.WIDTH);
            const y = Phaser.Math.Between(0, gameConfig.HEIGHT);
            const radius = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            background.fillStyle(0xff5555, alpha);
            background.fillCircle(x, y, radius);
        }
    }

    /**
     * 创建标题
     */
    private createTitle(): void {
        this.title = this.add.text(
            gameConfig.WIDTH / 2,
            50,
            '开发者选项',
            {
                fontFamily: 'monospace',
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
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
    }

    /**
     * 创建返回按钮
     */
    private createBackButton(): void {
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
                console.log('点击了返回按钮');
                this.scene.start('SettingsScene');
            }
        });
    }

    /**
     * 创建测试按钮
     */
    private createTestButtons(): void {
        const startY = 150;
        const spacing = 60;
        const buttonWidth = 250;
        const buttonHeight = 40;

        // 测试战斗场景按钮
        new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: startY,
            width: buttonWidth,
            height: buttonHeight,
            text: '测试战斗场景',
            backgroundColor: 0x007bff,
            hoverColor: 0x0069d9,
            borderRadius: 10,
            onClick: () => {
                console.log('测试战斗场景');
                this.testCombatScene();
            }
        });

        // 测试精英战斗按钮
        new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: startY + spacing,
            width: buttonWidth,
            height: buttonHeight,
            text: '测试精英战斗',
            backgroundColor: 0x007bff,
            hoverColor: 0x0069d9,
            borderRadius: 10,
            onClick: () => {
                console.log('测试精英战斗');
                this.testEliteCombat();
            }
        });

        // 测试Boss战斗按钮
        new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: startY + spacing * 2,
            width: buttonWidth,
            height: buttonHeight,
            text: '测试Boss战斗',
            backgroundColor: 0x007bff,
            hoverColor: 0x0069d9,
            borderRadius: 10,
            onClick: () => {
                console.log('测试Boss战斗');
                this.testBossCombat();
            }
        });

        // 测试地图场景按钮
        new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: startY + spacing * 3,
            width: buttonWidth,
            height: buttonHeight,
            text: '测试地图场景',
            backgroundColor: 0x28a745,
            hoverColor: 0x218838,
            borderRadius: 10,
            onClick: () => {
                console.log('测试地图场景');
                this.testMapScene();
            }
        });

        // 测试卡组查看按钮
        new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: startY + spacing * 4,
            width: buttonWidth,
            height: buttonHeight,
            text: '测试卡组查看',
            backgroundColor: 0x28a745,
            hoverColor: 0x218838,
            borderRadius: 10,
            onClick: () => {
                console.log('测试卡组查看');
                this.testDeckView();
            }
        });

        // 测试奖励场景按钮
        new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: startY + spacing * 5,
            width: buttonWidth,
            height: buttonHeight,
            text: '测试奖励场景',
            backgroundColor: 0x28a745,
            hoverColor: 0x218838,
            borderRadius: 10,
            onClick: () => {
                console.log('测试奖励场景');
                this.testRewardScene();
            }
        });

        // 重置游戏数据按钮
        new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: startY + spacing * 6,
            width: buttonWidth,
            height: buttonHeight,
            text: '重置游戏数据',
            backgroundColor: 0xdc3545,
            hoverColor: 0xc82333,
            borderRadius: 10,
            onClick: () => {
                console.log('重置游戏数据');
                this.resetGameData();
            }
        });
    }

    /**
     * 创建调试文本
     */
    private createDebugText(): void {
        this.debugText = this.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT - 100,
            '',
            {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);
    }

    /**
     * 测试战斗场景
     */
    private testCombatScene(): void {
        // 确保有游戏状态
        if (!this.ensureGameState()) return;

        // 进入战斗场景
        this.scene.start('CombatScene', { nodeId: 'test_battle', isElite: false, isBoss: false });
    }

    /**
     * 测试精英战斗
     */
    private testEliteCombat(): void {
        // 确保有游戏状态
        if (!this.ensureGameState()) return;

        // 进入精英战斗场景
        this.scene.start('CombatScene', { nodeId: 'test_elite', isElite: true, isBoss: false });
    }

    /**
     * 测试Boss战斗
     */
    private testBossCombat(): void {
        // 确保有游戏状态
        if (!this.ensureGameState()) return;

        // 进入Boss战斗场景
        this.scene.start('CombatScene', { nodeId: 'test_boss', isElite: false, isBoss: true });
    }

    /**
     * 测试地图场景
     */
    private testMapScene(): void {
        // 确保有游戏状态
        if (!this.ensureGameState()) return;

        // 进入地图场景
        this.scene.start('MapScene');
    }

    /**
     * 测试卡组查看
     */
    private testDeckView(): void {
        // 确保有游戏状态
        if (!this.ensureGameState()) return;

        // 进入卡组查看场景
        this.scene.start('DeckViewScene');
    }

    /**
     * 测试奖励场景
     */
    private testRewardScene(): void {
        // 确保有游戏状态
        if (!this.ensureGameState()) return;

        // 进入奖励场景
        this.scene.start('RewardScene', { nodeId: 'test_reward', isElite: false, isBoss: false });
    }

    /**
     * 重置游戏数据
     */
    private resetGameData(): void {
        // 删除保存的游戏状态
        this.stateManager.deleteSavedRun();

        // 显示调试信息
        this.debugText.setText('游戏数据已重置');

        // 2秒后清除调试信息
        this.time.delayedCall(2000, () => {
            this.debugText.setText('');
        });
    }

    /**
     * 确保有游戏状态
     * @returns 是否有游戏状态
     */
    private ensureGameState(): boolean {
        // 检查是否有当前运行状态
        if (!this.stateManager.hasCurrentRun()) {
            // 创建测试用的运行状态
            this.createTestRunState();
            return true;
        }

        return true;
    }

    /**
     * 创建测试用的运行状态
     */
    private createTestRunState(): void {
        // 创建测试卡组
        const startingDeck: CardData[] = [
            {
                id: 'strike',
                name: '打击',
                description: '造成6点伤害',
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
                description: '获得5点格挡',
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
                description: '造成8点伤害并给予2层易伤',
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
        for (let i = 0; i < 2; i++) {
            startingDeck.push({ ...startingDeck[0] });
            startingDeck.push({ ...startingDeck[1] });
        }

        // 创建新的运行状态
        this.stateManager.createNewRun('测试玩家', gameConfig.PLAYER.STARTING_HP, startingDeck);

        // 显示调试信息
        this.debugText.setText('已创建测试游戏状态');

        // 2秒后清除调试信息
        this.time.delayedCall(2000, () => {
            this.debugText.setText('');
        });
    }
}