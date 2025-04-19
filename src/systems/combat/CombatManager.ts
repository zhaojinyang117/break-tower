import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import Player from '../../entities/Player';
import Enemy from '../../entities/Enemy';
import { CardManager } from '../card/CardManager';
import { DeckManager } from '../card/DeckManager';
import { TurnManager, BattleResult } from './TurnManager';
import { EffectManager } from './EffectManager';
import { StateManager } from '../../state/StateManager';

/**
 * 战斗管理器
 * 负责管理整个战斗流程
 */
export class CombatManager {
    private scene: Phaser.Scene;
    private player!: Player;
    private enemies: Enemy[] = [];
    private cardManager: CardManager;
    private deckManager!: DeckManager;
    private turnManager!: TurnManager;
    private effectManager: EffectManager;
    private stateManager: StateManager;

    // 事件回调
    private eventListeners: { [eventName: string]: Function[] } = {};

    /**
     * 构造函数
     * @param scene 场景引用
     */
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.stateManager = StateManager.getInstance();
        this.cardManager = new CardManager(scene);
        this.effectManager = new EffectManager(scene);
    }

    /**
     * 初始化战斗
     * @param playerX 玩家X坐标
     * @param playerY 玩家Y坐标
     * @param enemies 敌人数组
     */
    initCombat(playerX: number, playerY: number, enemies: Enemy[]): void {
        console.log('CombatManager: 初始化战斗');

        // 创建玩家
        this.createPlayer(playerX, playerY);

        // 设置敌人
        this.enemies = enemies;

        // 初始化卡组管理器
        this.deckManager = new DeckManager(this.scene, this.cardManager);

        // 从当前运行状态获取卡组
        const runState = this.stateManager.getCurrentRun();
        if (runState) {
            this.deckManager.initializeDeck(runState.deck);
        } else {
            console.error('CombatManager: 无法获取当前运行状态');
        }

        // 初始化回合管理器
        this.turnManager = new TurnManager(this.scene, this.player, this.enemies, this.deckManager);

        // 监听战斗结束事件
        this.turnManager.addEventListener('battleEnded', this.onBattleEnded.bind(this));
    }

    /**
     * 创建玩家
     * @param x X坐标
     * @param y Y坐标
     */
    private createPlayer(x: number, y: number): void {
        // 获取当前运行状态
        const runState = this.stateManager.getCurrentRun();

        if (runState) {
            // 创建玩家实例
            this.player = new Player(this.scene, x, y);

            // 设置玩家生命值
            if (runState.currentHp > 0) {
                // 使用保存的生命值
                this.player.setHp(runState.currentHp);
                this.player.setMaxHp(runState.maxHp);
            } else {
                // 使用默认生命值
                this.player.setHp(gameConfig.PLAYER.STARTING_HP);
                this.player.setMaxHp(gameConfig.PLAYER.STARTING_HP);
            }
        } else {
            // 如果没有运行状态，使用默认值创建玩家
            this.player = new Player(this.scene, x, y);
            this.player.setHp(gameConfig.PLAYER.STARTING_HP);
            this.player.setMaxHp(gameConfig.PLAYER.STARTING_HP);
        }
    }

    /**
     * 战斗结束回调
     * @param data 战斗结束数据
     */
    private onBattleEnded(data: { result: BattleResult, turnNumber: number }): void {
        console.log(`CombatManager: 战斗结束，结果: ${data.result}`);

        // 更新运行状态
        const runState = this.stateManager.getCurrentRun();
        if (runState) {
            // 更新生命值
            this.stateManager.updateHp(this.player.getHp() - runState.currentHp);
        }

        // 触发战斗结束事件
        this.triggerEvent('combatEnded', {
            result: data.result,
            turnNumber: data.turnNumber,
            player: {
                hp: this.player.getHp(),
                maxHp: this.player.getMaxHp()
            },
            enemies: this.enemies.map(enemy => ({
                id: enemy.getId(),
                hp: enemy.getHp(),
                maxHp: enemy.getMaxHp(),
                isDead: enemy.isDead()
            }))
        });

        // 延迟一段时间后显示战斗结果界面
        this.scene.time.delayedCall(2000, () => {
            if (data.result === BattleResult.VICTORY) {
                this.showVictoryScreen();
            } else {
                this.showDefeatScreen();
            }
        });
    }

    /**
     * 显示胜利界面
     */
    private showVictoryScreen(): void {
        // 创建胜利文本
        const victoryText = this.scene.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2,
            '战斗胜利！',
            {
                fontSize: '48px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);

        // 添加动画
        this.scene.tweens.add({
            targets: victoryText,
            scale: 1.2,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // 创建继续按钮
        const continueButton = this.scene.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 + 100,
            '继续',
            {
                fontSize: '32px',
                color: '#ffffff',
                backgroundColor: '#007bff',
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            }
        ).setOrigin(0.5).setInteractive();

        // 添加按钮点击事件
        continueButton.on('pointerdown', () => {
            // 触发继续事件
            this.triggerEvent('continueAfterCombat', { result: BattleResult.VICTORY });
        });

        // 添加按钮悬停效果
        continueButton.on('pointerover', () => {
            continueButton.setBackgroundColor('#0069d9');
        });

        continueButton.on('pointerout', () => {
            continueButton.setBackgroundColor('#007bff');
        });
    }

    /**
     * 显示失败界面
     */
    private showDefeatScreen(): void {
        // 创建失败文本
        const defeatText = this.scene.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2,
            '战斗失败！',
            {
                fontSize: '48px',
                color: '#ff0000',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);

        // 添加动画
        this.scene.tweens.add({
            targets: defeatText,
            alpha: 0.5,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // 创建返回主菜单按钮
        const menuButton = this.scene.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 + 100,
            '返回主菜单',
            {
                fontSize: '32px',
                color: '#ffffff',
                backgroundColor: '#dc3545',
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            }
        ).setOrigin(0.5).setInteractive();

        // 添加按钮点击事件
        menuButton.on('pointerdown', () => {
            // 触发返回主菜单事件
            this.triggerEvent('returnToMainMenu', { result: BattleResult.DEFEAT });
        });

        // 添加按钮悬停效果
        menuButton.on('pointerover', () => {
            menuButton.setBackgroundColor('#c82333');
        });

        menuButton.on('pointerout', () => {
            menuButton.setBackgroundColor('#dc3545');
        });
    }

    /**
     * 添加事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    addEventListener(eventName: string, callback: Function): void {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    /**
     * 移除事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    removeEventListener(eventName: string, callback: Function): void {
        if (!this.eventListeners[eventName]) return;

        const index = this.eventListeners[eventName].indexOf(callback);
        if (index !== -1) {
            this.eventListeners[eventName].splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param data 事件数据
     */
    private triggerEvent(eventName: string, data: any): void {
        if (!this.eventListeners[eventName]) return;

        for (const callback of this.eventListeners[eventName]) {
            try {
                callback(data);
            } catch (error) {
                console.error(`CombatManager: 事件回调执行错误 (${eventName}):`, error);
            }
        }
    }

    /**
     * 清理战斗资源
     */
    cleanup(): void {
        // 清理卡组管理器
        if (this.deckManager) {
            this.deckManager.clearAll();
        }

        // 移除事件监听器
        if (this.turnManager) {
            this.turnManager.removeEventListener('battleEnded', this.onBattleEnded.bind(this));
        }

        console.log('CombatManager: 清理战斗资源');
    }

    // Getter方法
    getPlayer(): Player {
        return this.player;
    }

    getEnemies(): Enemy[] {
        return this.enemies;
    }

    getTurnManager(): TurnManager {
        return this.turnManager;
    }

    getDeckManager(): DeckManager {
        return this.deckManager;
    }

    getEffectManager(): EffectManager {
        return this.effectManager;
    }
}