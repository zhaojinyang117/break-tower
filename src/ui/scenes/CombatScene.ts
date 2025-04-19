import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { Game } from '../../core/game';
import { GameStateType } from '../../core/types';
import { StateManager } from '../../state/StateManager';
import { CombatManager } from '../../systems/combat/CombatManager';
import { BattleResult } from '../../systems/combat/TurnManager';
import Player from '../../entities/Player';
import Enemy from '../../entities/Enemy';
import { Button } from '../components/Button';
import { HealthBar } from '../components/HealthBar';

/**
 * 战斗场景
 * 处理游戏中的战斗逻辑
 */
export class CombatScene extends Phaser.Scene {
    // 战斗管理器
    private combatManager!: CombatManager;
    private stateManager!: StateManager;

    // 场景数据
    private nodeId: string = '';
    private isElite: boolean = false;
    private isBoss: boolean = false;

    // UI元素
    private playerHealthBar!: HealthBar;
    private playerEnergyText!: Phaser.GameObjects.Text;
    private enemyHealthBars: Map<string, HealthBar> = new Map();
    private endTurnButton!: Button;
    private deckCountText!: Phaser.GameObjects.Text;
    private discardCountText!: Phaser.GameObjects.Text;
    private drawCountText!: Phaser.GameObjects.Text;

    constructor() {
        super('CombatScene');
    }

    /**
     * 初始化场景
     * @param data 场景数据
     */
    init(data: any): void {
        console.log('CombatScene: 初始化场景', data);
        this.nodeId = data.nodeId || '';
        this.isElite = data.isElite || false;
        this.isBoss = data.isBoss || false;
    }

    /**
     * 创建场景
     */
    create(): void {
        console.log('CombatScene: 创建战斗场景');

        // 初始化管理器
        this.stateManager = StateManager.getInstance();
        this.combatManager = new CombatManager(this);

        // 创建背景
        this.createBackground();

        // 创建UI元素
        this.createUI();

        // 初始化战斗
        this.initializeCombat();

        // 添加事件监听器
        this.setupEventListeners();

        // 更新游戏状态
        Game.getInstance().setCurrentState(GameStateType.COMBAT);
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
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, gameConfig.WIDTH);
            const y = Phaser.Math.Between(0, gameConfig.HEIGHT);
            const radius = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            background.fillStyle(0xff5555, alpha);
            background.fillCircle(x, y, radius);
        }
    }

    /**
     * 创建UI元素
     */
    private createUI(): void {
        // 创建玩家生命值条
        this.playerHealthBar = new HealthBar(this, {
            x: 150,
            y: gameConfig.HEIGHT - 50,
            width: 200,
            height: 20,
            maxValue: 100,
            currentValue: 100,
            backgroundColor: 0x333333,
            barColor: 0x00aa00,
            borderColor: 0xffffff,
            borderWidth: 2,
            borderRadius: 5,
            showText: true
        });

        // 创建玩家能量文本
        this.playerEnergyText = this.add.text(50, gameConfig.HEIGHT - 50, '能量: 3/3', {
            fontSize: '24px',
            color: '#ffff00'
        }).setOrigin(0.5);

        // 创建结束回合按钮
        this.endTurnButton = new Button(this, {
            x: gameConfig.WIDTH - 100,
            y: gameConfig.HEIGHT - 50,
            width: 150,
            height: 40,
            text: '结束回合',
            backgroundColor: 0x007bff,
            hoverColor: 0x0069d9,
            borderRadius: 10,
            onClick: () => {
                this.endPlayerTurn();
            }
        });

        // 创建卡组计数文本
        this.deckCountText = this.add.text(gameConfig.WIDTH - 200, 50, '抽牌堆: 0', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.discardCountText = this.add.text(gameConfig.WIDTH - 100, 50, '弃牌堆: 0', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.drawCountText = this.add.text(gameConfig.WIDTH - 300, 50, '手牌: 0', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    /**
     * 初始化战斗
     */
    private initializeCombat(): void {
        // 创建敌人
        const enemies = this.createEnemies();

        // 初始化战斗管理器
        this.combatManager.initCombat(
            gameConfig.WIDTH / 4,
            gameConfig.HEIGHT / 2,
            enemies
        );

        // 获取玩家引用
        const player = this.combatManager.getPlayer();

        // 更新玩家UI
        this.updatePlayerUI(player);

        // 创建敌人生命值条
        this.createEnemyHealthBars(enemies);
    }

    /**
     * 创建敌人
     * @returns 敌人数组
     */
    private createEnemies(): Enemy[] {
        const enemies: Enemy[] = [];
        let enemyCount = 1;
        let enemyType = 'normal';

        // 根据节点类型决定敌人数量和类型
        if (this.isElite) {
            enemyCount = 1;
            enemyType = 'elite';
        } else if (this.isBoss) {
            enemyCount = 1;
            enemyType = 'boss';
        } else {
            // 普通战斗，随机1-3个敌人
            enemyCount = Phaser.Math.Between(1, 3);
        }

        // 创建敌人
        for (let i = 0; i < enemyCount; i++) {
            const x = gameConfig.WIDTH * 3 / 4;
            const y = gameConfig.HEIGHT / (enemyCount + 1) * (i + 1);
            
            const enemy = new Enemy(this, x, y, `enemy_${enemyType}_1`);
            
            // 设置敌人属性
            if (enemyType === 'elite') {
                enemy.setMaxHp(80);
                enemy.setHp(80);
            } else if (enemyType === 'boss') {
                enemy.setMaxHp(150);
                enemy.setHp(150);
            } else {
                enemy.setMaxHp(40);
                enemy.setHp(40);
            }
            
            enemies.push(enemy);
        }

        return enemies;
    }

    /**
     * 创建敌人生命值条
     * @param enemies 敌人数组
     */
    private createEnemyHealthBars(enemies: Enemy[]): void {
        enemies.forEach(enemy => {
            const healthBar = new HealthBar(this, {
                x: enemy.sprite.x,
                y: enemy.sprite.y - 50,
                width: 100,
                height: 10,
                maxValue: enemy.getMaxHp(),
                currentValue: enemy.getHp(),
                backgroundColor: 0x333333,
                barColor: 0xff0000,
                borderColor: 0xffffff,
                borderWidth: 1,
                borderRadius: 3,
                showText: true
            });

            this.enemyHealthBars.set(enemy.getId(), healthBar);
        });
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 监听战斗结束事件
        this.combatManager.addEventListener('combatEnded', this.onCombatEnded.bind(this));

        // 监听玩家回合开始事件
        this.combatManager.getTurnManager().addEventListener('playerTurnStarted', this.onPlayerTurnStarted.bind(this));

        // 监听敌人回合开始事件
        this.combatManager.getTurnManager().addEventListener('enemyTurnStarted', this.onEnemyTurnStarted.bind(this));

        // 监听卡牌打出事件
        this.combatManager.getTurnManager().addEventListener('cardPlayed', this.onCardPlayed.bind(this));
    }

    /**
     * 更新玩家UI
     * @param player 玩家
     */
    private updatePlayerUI(player: Player): void {
        // 更新生命值条
        this.playerHealthBar.setMaxValue(player.getMaxHp());
        this.playerHealthBar.setValue(player.getHp());

        // 更新能量文本
        this.playerEnergyText.setText(`能量: ${player.getEnergy()}/${player.getMaxEnergy()}`);

        // 更新卡组计数
        const deckManager = this.combatManager.getDeckManager();
        this.deckCountText.setText(`抽牌堆: ${deckManager.getDrawPileSize()}`);
        this.discardCountText.setText(`弃牌堆: ${deckManager.getDiscardPileSize()}`);
        this.drawCountText.setText(`手牌: ${deckManager.getHandSize()}`);
    }

    /**
     * 更新敌人UI
     */
    private updateEnemyUI(): void {
        const enemies = this.combatManager.getEnemies();
        
        enemies.forEach(enemy => {
            const healthBar = this.enemyHealthBars.get(enemy.getId());
            if (healthBar) {
                healthBar.setValue(enemy.getHp());
                
                // 如果敌人死亡，隐藏生命值条
                if (enemy.isDead()) {
                    healthBar.setVisible(false);
                }
            }
        });
    }

    /**
     * 玩家回合开始事件处理
     */
    private onPlayerTurnStarted(data: any): void {
        console.log('CombatScene: 玩家回合开始', data);
        
        // 更新UI
        this.updatePlayerUI(this.combatManager.getPlayer());
        this.updateEnemyUI();
        
        // 启用结束回合按钮
        this.endTurnButton.setDisabled(false);
    }

    /**
     * 敌人回合开始事件处理
     */
    private onEnemyTurnStarted(data: any): void {
        console.log('CombatScene: 敌人回合开始', data);
        
        // 禁用结束回合按钮
        this.endTurnButton.setDisabled(true);
    }

    /**
     * 卡牌打出事件处理
     */
    private onCardPlayed(data: any): void {
        console.log('CombatScene: 卡牌打出', data);
        
        // 更新UI
        this.updatePlayerUI(this.combatManager.getPlayer());
        this.updateEnemyUI();
    }

    /**
     * 结束玩家回合
     */
    private endPlayerTurn(): void {
        const turnManager = this.combatManager.getTurnManager();
        turnManager.endPlayerTurn();
    }

    /**
     * 战斗结束事件处理
     * @param data 战斗结束数据
     */
    private onCombatEnded(data: any): void {
        console.log('CombatScene: 战斗结束', data);
        
        // 禁用结束回合按钮
        this.endTurnButton.setDisabled(true);
        
        // 根据战斗结果处理
        if (data.result === BattleResult.VICTORY) {
            // 胜利，显示奖励场景
            this.time.delayedCall(2000, () => {
                this.scene.start('RewardScene', { 
                    nodeId: this.nodeId,
                    isElite: this.isElite,
                    isBoss: this.isBoss
                });
            });
        } else {
            // 失败，返回主菜单
            this.time.delayedCall(2000, () => {
                this.scene.start('MainMenuScene');
            });
        }
    }

    /**
     * 场景更新
     * @param time 当前时间
     * @param delta 时间增量
     */
    update(time: number, delta: number): void {
        // 更新UI
        this.updatePlayerUI(this.combatManager.getPlayer());
        this.updateEnemyUI();
    }

    /**
     * 场景关闭
     */
    shutdown(): void {
        // 清理战斗资源
        this.combatManager.cleanup();
        
        // 移除事件监听器
        this.combatManager.removeEventListener('combatEnded', this.onCombatEnded.bind(this));
        this.combatManager.getTurnManager().removeEventListener('playerTurnStarted', this.onPlayerTurnStarted.bind(this));
        this.combatManager.getTurnManager().removeEventListener('enemyTurnStarted', this.onEnemyTurnStarted.bind(this));
        this.combatManager.getTurnManager().removeEventListener('cardPlayed', this.onCardPlayed.bind(this));
    }
}