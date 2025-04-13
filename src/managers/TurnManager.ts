import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import DeckManager, { Card } from './DeckManager';
import EffectManager from './EffectManager';
import { gameConfig } from '../config/gameConfig';

// 回合状态枚举
export enum TurnState {
    PLAYER_TURN,
    ENEMY_TURN,
    BATTLE_ENDED
}

export default class TurnManager {
    private scene: Phaser.Scene;
    private player: Player;
    private enemy: Enemy;
    private deckManager: DeckManager;
    private effectManager: EffectManager;

    private currentTurn: TurnState;
    private turnNumber: number;

    // UI元素
    private turnText!: Phaser.GameObjects.Text;
    private endTurnButton!: Phaser.GameObjects.Container;

    // 战斗结束回调
    private battleEndCallbacks: Array<(isVictory: boolean) => void> = [];

    constructor(scene: Phaser.Scene, player: Player, enemy: Enemy, deckManager: DeckManager) {
        this.scene = scene;
        this.player = player;
        this.enemy = enemy;
        this.deckManager = deckManager;
        this.effectManager = new EffectManager();

        this.currentTurn = TurnState.PLAYER_TURN;
        this.turnNumber = 1;

        // 创建UI元素
        this.createUI();

        // 开始第一个回合
        this.startPlayerTurn();

        // 设置卡牌交互监听
        this.setupCardInteractions();
    }

    // 创建UI元素
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

    // 设置卡牌交互监听
    private setupCardInteractions(): void {
        // 拖拽开始
        this.scene.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: any) => {
            this.scene.children.bringToTop(gameObject);
            gameObject.setScale(1.1);
        });

        // 拖拽中
        this.scene.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: any, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        // 拖拽结束
        this.scene.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: any) => {
            gameObject.setScale(1);

            // 检查是否拖到了敌人身上
            const bounds = this.enemy.getBounds ? this.enemy.getBounds() : null;

            // 如果有碰撞检测，检查是否拖到了敌人身上
            if (bounds && Phaser.Geom.Rectangle.Contains(bounds, gameObject.x, gameObject.y)) {
                // 尝试打出卡牌
                this.playCard(gameObject, this.enemy);
            } else {
                // 没有拖到敌人上，返回手牌位置
                this.deckManager.arrangeHand();
            }
        });

        // 点击卡牌
        this.scene.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer, gameObject: any) => {
            if (gameObject.getCardData) {
                const cardData = gameObject.getCardData();
                console.log('点击卡牌:', cardData.name);
            }
        });
    }

    // 开始玩家回合
    startPlayerTurn(): void {
        if (this.currentTurn !== TurnState.BATTLE_ENDED) {
            this.currentTurn = TurnState.PLAYER_TURN;
            this.turnText.setText(`玩家回合 (${this.turnNumber})`);

            // 重置玩家状态
            this.player.onTurnStart();

            // 抽卡
            this.deckManager.drawCard(gameConfig.PLAYER.HAND_SIZE);

            console.log('玩家回合开始');
        }
    }

    // 结束玩家回合
    endPlayerTurn(): void {
        if (this.currentTurn === TurnState.PLAYER_TURN) {
            // 清除所有手牌
            this.deckManager.discardHand();

            // 结束玩家回合处理
            this.player.onTurnEnd();

            // 开始敌人回合
            this.startEnemyTurn();
        }
    }

    // 开始敌人回合
    startEnemyTurn(): void {
        if (this.currentTurn !== TurnState.BATTLE_ENDED) {
            this.currentTurn = TurnState.ENEMY_TURN;
            this.turnText.setText('敌人回合');

            console.log('敌人回合开始');

            // 执行敌人行为
            this.scene.time.delayedCall(1000, () => {
                this.enemy.executeIntent(this.player);

                // 检查战斗是否结束
                if (this.checkBattleEnd()) {
                    return;
                }

                // 结束敌人回合
                this.scene.time.delayedCall(1000, () => {
                    this.endEnemyTurn();
                });
            });
        }
    }

    // 结束敌人回合
    endEnemyTurn(): void {
        if (this.currentTurn === TurnState.ENEMY_TURN) {
            // 结束敌人回合处理
            this.enemy.onTurnEnd();

            // 增加回合计数
            this.turnNumber++;

            // 开始新的玩家回合
            this.startPlayerTurn();
        }
    }

    // 检查战斗是否结束
    checkBattleEnd(): boolean {
        if (this.player.isDead() || this.enemy.isDead()) {
            this.currentTurn = TurnState.BATTLE_ENDED;
            this.endTurnButton.setVisible(false);

            if (this.player.isDead()) {
                this.turnText.setText('战斗失败');
                console.log('玩家死亡，战斗失败');
            } else {
                this.turnText.setText('战斗胜利');
                console.log('敌人死亡，战斗胜利');
            }

            return true;
        }

        return false;
    }

    // 打出卡牌
    playCard(cardObject: any, target: Enemy | Player): void {
        const cardData = cardObject.getCardData();

        // 检查能量是否足够
        if (this.player.getEnergy() < cardData.cost) {
            console.log(`能量不足，需要 ${cardData.cost} 点能量`);
            this.deckManager.arrangeHand();
            return;
        }

        // 扣除能量
        this.player.useEnergy(cardData.cost);

        // 执行卡牌效果
        this.effectManager.executeCardEffects(cardData.effects, this.player, target);

        // 将卡牌移到弃牌堆
        this.deckManager.playCard(cardObject);

        // 检查战斗是否结束
        this.checkBattleEnd();
    }

    // 处理战斗结束
    private handleBattleEnd(isVictory: boolean): void {
        console.log(`战斗结束，${isVictory ? '胜利' : '失败'}`);

        // 禁用交互
        this.endTurnButton.disableInteractive();
        this.endTurnButton.setAlpha(0.5);
        this.deckManager.disableCardInteraction();

        // 通知所有订阅者战斗结束
        this.notifyBattleEnd(isVictory);
    }

    // 注册战斗结束回调
    public onBattleEnd(callback: (isVictory: boolean) => void): void {
        this.battleEndCallbacks.push(callback);
    }

    // 移除战斗结束回调
    public offBattleEnd(callback: (isVictory: boolean) => void): void {
        const index = this.battleEndCallbacks.indexOf(callback);
        if (index !== -1) {
            this.battleEndCallbacks.splice(index, 1);
        }
    }

    // 通知所有战斗结束回调
    private notifyBattleEnd(isVictory: boolean): void {
        for (const callback of this.battleEndCallbacks) {
            callback(isVictory);
        }
    }
} 