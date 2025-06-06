import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { CardType } from '../../core/types';
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
    private targetEnemy: Enemy | null = null;

    // UI元素
    private turnText!: Phaser.GameObjects.Text;

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
    }

    /**
     * 卡牌打出回调
     * @param cardData 卡牌数据
     */
    private onCardPlayed(cardData: CardData): void {
        try {
            if (!cardData) {
                console.error('TurnManager: 卡牌数据为空');
                return;
            }

            console.log(`TurnManager: 打出卡牌 ${cardData.name}`);

            // 检查当前回合状态
            if (this.currentTurn !== TurnState.PLAYER_TURN) {
                console.log(`TurnManager: 当前不是玩家回合，无法打出卡牌`);
                return;
            }

            // 检查战斗是否已结束
            if (this.battleResult !== BattleResult.IN_PROGRESS) {
                console.log(`TurnManager: 战斗已结束，无法打出卡牌`);
                return;
            }

            // 处理地牌
            if (cardData.type === CardType.LAND) {
                // 如果是地牌，检查是否可以使用
                if (!this.player.canPlayLand()) {
                    console.log('TurnManager: 本回合已经使用过地牌，不能再使用');
                    return;
                }

                // 标记地牌已使用
                this.player.playLand();

                // 增加能量上限
                this.player.increaseMaxEnergy(1); // 每张地牌增加能量上限1点
                console.log('TurnManager: 成功使用地牌，能量上限+1');

                // 找到手牌中的地牌卡牌精灵，并横置它们
                const deckManager = this.deckManager;
                const handCards = deckManager.getHand();

                for (const cardSprite of handCards) {
                    const spriteCardData = (cardSprite as any).getCardData();
                    if (spriteCardData && spriteCardData.type === CardType.LAND) {
                        // 横置地牌
                        deckManager.tapCard(cardSprite);
                    }
                }
            } else {
                // 非地牌需要消耗能量
                this.player.useEnergy(cardData.cost);
                console.log(`TurnManager: 扣除 ${cardData.cost} 点能量，剩余 ${this.player.getEnergy()} 点`);
            }

            // 执行卡牌效果
            const context: EffectContext = {
                player: this.player,
                enemies: this.enemies,
                targetEnemy: this.getTargetEnemy()
            };

            try {
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
            } catch (error) {
                console.error('TurnManager: 执行卡牌效果时出错', error);
                // 即使出错，也触发卡牌打出事件，确保卡牌被正确处理
                this.triggerEvent('cardPlayed', { cardData, results: [] });
            }
        } catch (error) {
            console.error('TurnManager: onCardPlayed 方法出错', error);
        }
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
        if (this.turnNumber === 1) {
            // 第一回合，抽满初始手牌
            const initialHandSize = this.deckManager.getHandSize();
            const targetHandSize = gameConfig.PLAYER.HAND_SIZE;
            const cardsToDraw = Math.max(0, targetHandSize - initialHandSize);

            if (cardsToDraw > 0) {
                this.deckManager.drawCard(cardsToDraw);
                console.log(`TurnManager: 第一回合抽取${cardsToDraw}张牌，填满初始手牌`);
            }
        } else {
            // 后续回合，每回合固定抽1张牌（除非有特殊效果）
            this.deckManager.drawCard(1);
            console.log('TurnManager: 回合开始抽取1张牌');
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

                // 设置下一次意图
                enemy.setNextIntent();
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

    /**
     * 设置目标敌人
     * @param enemy 目标敌人
     */
    setTargetEnemy(enemy: Enemy | null): void {
        this.targetEnemy = enemy;
    }

    /**
     * 获取目标敌人
     * @returns 目标敌人
     */
    getTargetEnemy(): Enemy | undefined {
        // 如果有选中的敌人，使用选中的敌人
        if (this.targetEnemy && !this.targetEnemy.isDead()) {
            return this.targetEnemy;
        }

        // 如果没有选中的敌人，选择第一个活着的敌人
        for (const enemy of this.enemies) {
            if (!enemy.isDead()) {
                return enemy;
            }
        }

        // 如果没有活着的敌人，返回undefined
        return undefined;
    }
}