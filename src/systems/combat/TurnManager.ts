import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import Player from '../../entities/Player';
import Enemy from '../../entities/Enemy';
import { DeckManager } from '../card/DeckManager';
import { CardData } from '../card/CardData';
import { CardEffectExecutor, EffectContext } from '../card/CardEffects';

/**
 * 回合状态枚举
 */
export enum TurnState {
    PLAYER_TURN = 'player_turn',
    ENEMY_TURN = 'enemy_turn',
    BATTLE_ENDED = 'battle_ended'
}

/**
 * 战斗结果枚举
 */
export enum BattleResult {
    VICTORY = 'victory',
    DEFEAT = 'defeat',
    IN_PROGRESS = 'in_progress'
}

/**
 * 回合管理器
 * 负责管理战斗中的回合流程
 */
export class TurnManager {
    private scene: Phaser.Scene;
    private player: Player;
    private enemies: Enemy[];
    private deckManager: DeckManager;
    private effectExecutor: CardEffectExecutor;

    private currentTurn: TurnState;
    private turnNumber: number;
    private battleResult: BattleResult;

    // UI元素
    private turnText!: Phaser.GameObjects.Text;
    private endTurnButton!: Phaser.GameObjects.Container;

    // 事件回调
    private eventListeners: { [eventName: string]: Function[] } = {};

    /**
     * 构造函数
     * @param scene 场景引用
     * @param player 玩家
     * @param enemies 敌人数组
     * @param deckManager 卡组管理器
     */
    constructor(scene: Phaser.Scene, player: Player, enemies: Enemy[], deckManager: DeckManager) {
        this.scene = scene;
        this.player = player;
        this.enemies = enemies;
        this.deckManager = deckManager;
        this.effectExecutor = new CardEffectExecutor();

        this.currentTurn = TurnState.PLAYER_TURN;
        this.turnNumber = 1;
        this.battleResult = BattleResult.IN_PROGRESS;

        // 创建UI元素
        this.createUI();

        // 设置卡牌打出回调
        this.deckManager.setOnCardPlayed(this.onCardPlayed.bind(this));

        // 开始第一个回合
        this.startPlayerTurn();
    }

    /**
     * 创建UI元素
     */
    private createUI(): void {
        // 回合显示文本
        this.turnText = this.scene.add.text(gameConfig.WIDTH / 2, 20, '玩家回合', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 结束回合按钮
        const buttonWidth = 150;
        const buttonHeight = 50;
        const buttonX = gameConfig.WIDTH - buttonWidth / 2 - 20;
        const buttonY = gameConfig.HEIGHT / 2;

        const buttonBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x007bff);
        const buttonText = this.scene.add.text(0, 0, '结束回合', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.endTurnButton = this.scene.add.container(buttonX, buttonY, [buttonBg, buttonText]);
        this.endTurnButton.setSize(buttonWidth, buttonHeight);
        this.endTurnButton.setInteractive();

        // 添加点击事件
        this.endTurnButton.on('pointerdown', () => {
            if (this.currentTurn === TurnState.PLAYER_TURN) {
                this.endPlayerTurn();
            }
        });

        // 添加按钮悬停效果
        this.endTurnButton.on('pointerover', () => {
            buttonBg.setFillStyle(0x0069d9);
        });

        this.endTurnButton.on('pointerout', () => {
            buttonBg.setFillStyle(0x007bff);
        });
    }

    /**
     * 卡牌打出回调
     * @param cardData 卡牌数据
     */
    private onCardPlayed(cardData: CardData): void {
        console.log(`TurnManager: 打出卡牌 ${cardData.name}`);

        // 检查能量是否足够
        if (this.player.getEnergy() < cardData.cost) {
            console.log(`TurnManager: 能量不足，需要 ${cardData.cost} 点能量`);
            return;
        }

        // 扣除能量
        this.player.useEnergy(cardData.cost);

        // 执行卡牌效果
        const context: EffectContext = {
            player: this.player,
            enemies: this.enemies,
            targetEnemy: this.enemies.length > 0 ? this.enemies[0] : undefined
        };

        const results = this.effectExecutor.executeEffects(cardData.effects, context);
        
        // 处理效果结果
        for (const result of results) {
            if (result.success) {
                console.log(`TurnManager: 效果执行成功 - ${result.message}`);
                
                // 处理抽牌效果
                if (result.cardsDrawn) {
                    this.deckManager.drawCard(result.cardsDrawn);
                }
            } else {
                console.log(`TurnManager: 效果执行失败 - ${result.message}`);
            }
        }

        // 触发卡牌打出事件
        this.triggerEvent('cardPlayed', { cardData, results });

        // 检查战斗是否结束
        this.checkBattleEnd();
    }

    /**
     * 开始玩家回合
     */
    startPlayerTurn(): void {
        if (this.battleResult !== BattleResult.IN_PROGRESS) return;

        this.currentTurn = TurnState.PLAYER_TURN;
        this.turnText.setText(`玩家回合 (${this.turnNumber})`);

        // 重置玩家状态
        this.player.onTurnStart();

        // 抽卡
        const initialHandSize = this.deckManager.getHandSize();
        const targetHandSize = gameConfig.PLAYER.HAND_SIZE;
        const cardsToDraw = Math.max(0, targetHandSize - initialHandSize);
        
        if (cardsToDraw > 0) {
            this.deckManager.drawCard(cardsToDraw);
        }

        // 启用卡牌交互
        this.deckManager.enableCardInteraction();

        // 触发玩家回合开始事件
        this.triggerEvent('playerTurnStarted', { turnNumber: this.turnNumber });

        console.log(`TurnManager: 玩家回合 ${this.turnNumber} 开始`);
    }

    /**
     * 结束玩家回合
     */
    endPlayerTurn(): void {
        if (this.currentTurn !== TurnState.PLAYER_TURN || this.battleResult !== BattleResult.IN_PROGRESS) return;

        // 禁用卡牌交互
        this.deckManager.disableCardInteraction();

        // 结束玩家回合处理
        this.player.onTurnEnd();

        // 触发玩家回合结束事件
        this.triggerEvent('playerTurnEnded', { turnNumber: this.turnNumber });

        console.log(`TurnManager: 玩家回合 ${this.turnNumber} 结束`);

        // 开始敌人回合
        this.startEnemyTurn();
    }

    /**
     * 开始敌人回合
     */
    startEnemyTurn(): void {
        if (this.battleResult !== BattleResult.IN_PROGRESS) return;

        this.currentTurn = TurnState.ENEMY_TURN;
        this.turnText.setText('敌人回合');

        // 触发敌人回合开始事件
        this.triggerEvent('enemyTurnStarted', { turnNumber: this.turnNumber });

        console.log('TurnManager: 敌人回合开始');

        // 执行敌人行为
        this.scene.time.delayedCall(1000, () => {
            this.executeEnemyActions();
        });
    }

    /**
     * 执行敌人行动
     */
    private executeEnemyActions(): void {
        if (this.battleResult !== BattleResult.IN_PROGRESS) return;

        // 依次执行每个敌人的行动
        const executeNextEnemy = (index: number) => {
            if (index >= this.enemies.length) {
                // 所有敌人行动完毕，结束敌人回合
                this.endEnemyTurn();
                return;
            }

            const enemy = this.enemies[index];
            if (!enemy.isDead()) {
                enemy.executeIntent(this.player);

                // 检查战斗是否结束
                if (this.checkBattleEnd()) {
                    return;
                }

                // 延迟执行下一个敌人的行动
                this.scene.time.delayedCall(gameConfig.BATTLE.ENEMY_TURN_DELAY, () => {
                    executeNextEnemy(index + 1);
                });
            } else {
                // 敌人已死亡，跳过并执行下一个
                executeNextEnemy(index + 1);
            }
        };

        // 开始执行第一个敌人的行动
        executeNextEnemy(0);
    }

    /**
     * 结束敌人回合
     */
    endEnemyTurn(): void {
        if (this.currentTurn !== TurnState.ENEMY_TURN || this.battleResult !== BattleResult.IN_PROGRESS) return;

        // 结束敌人回合处理
        for (const enemy of this.enemies) {
            if (!enemy.isDead()) {
                enemy.onTurnEnd();
            }
        }

        // 触发敌人回合结束事件
        this.triggerEvent('enemyTurnEnded', { turnNumber: this.turnNumber });

        console.log('TurnManager: 敌人回合结束');

        // 增加回合计数
        this.turnNumber++;

        // 开始新的玩家回合
        this.startPlayerTurn();
    }

    /**
     * 检查战斗是否结束
     * @returns 战斗是否结束
     */
    checkBattleEnd(): boolean {
        if (this.battleResult !== BattleResult.IN_PROGRESS) return true;

        // 检查玩家是否死亡
        if (this.player.isDead()) {
            this.battleResult = BattleResult.DEFEAT;
            this.handleBattleEnd(false);
            return true;
        }

        // 检查所有敌人是否死亡
        const allEnemiesDead = this.enemies.every(enemy => enemy.isDead());
        if (allEnemiesDead) {
            this.battleResult = BattleResult.VICTORY;
            this.handleBattleEnd(true);
            return true;
        }

        return false;
    }

    /**
     * 处理战斗结束
     * @param isVictory 是否胜利
     */
    private handleBattleEnd(isVictory: boolean): void {
        this.currentTurn = TurnState.BATTLE_ENDED;
        
        // 更新UI
        this.turnText.setText(isVictory ? '战斗胜利' : '战斗失败');
        this.endTurnButton.setVisible(false);
        
        // 禁用卡牌交互
        this.deckManager.disableCardInteraction();

        // 触发战斗结束事件
        this.triggerEvent('battleEnded', { 
            result: isVictory ? BattleResult.VICTORY : BattleResult.DEFEAT,
            turnNumber: this.turnNumber
        });

        console.log(`TurnManager: 战斗结束，${isVictory ? '胜利' : '失败'}`);
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
                console.error(`TurnManager: 事件回调执行错误 (${eventName}):`, error);
            }
        }
    }

    /**
     * 获取当前回合状态
     */
    getCurrentTurn(): TurnState {
        return this.currentTurn;
    }

    /**
     * 获取当前回合数
     */
    getTurnNumber(): number {
        return this.turnNumber;
    }

    /**
     * 获取战斗结果
     */
    getBattleResult(): BattleResult {
        return this.battleResult;
    }
}