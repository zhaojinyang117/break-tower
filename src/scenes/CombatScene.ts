import Phaser from 'phaser';
import { gameConfig } from '../config/gameConfig';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import DeckManager from '../managers/DeckManager';
import TurnManager, { TurnState } from '../managers/TurnManager';
import RunStateManager from '../managers/RunStateManager';
import { CardData, BASE_CARDS } from '../config/cardData';
import { NodeType } from '../config/mapData';
import { CardManager } from '../managers/CardManager';
import EnemyFactory from '../entities/EnemyFactory';

// 注释掉重复的全局类型声明，因为它已经在index.ts中定义
// declare global {
//     interface Window {
//         SvgGenerator: any;
//     }
// }

// 创建一个简单的EffectManager类，避免导入错误
class EffectManager {
    private scene: Phaser.Scene;
    private deckManager: DeckManager | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 设置卡组管理器
     * @param deckManager 卡组管理器实例
     */
    setDeckManager(deckManager: DeckManager): void {
        this.deckManager = deckManager;
    }

    /**
     * 执行卡牌效果
     * @param effects 效果数组
     * @param source 效果来源（玩家）
     * @param target 效果目标（敌人或玩家）
     */
    executeCardEffects(effects: any[], source: Player, target: Enemy | Player): void {
        if (!effects || effects.length === 0) {
            console.log('EffectManager: 没有效果可执行');
            return;
        }

        // 处理每个效果
        for (const effect of effects) {
            this.executeEffect(effect, source, target);
        }
    }

    /**
     * 执行单个效果
     * @param effect 效果对象
     * @param source 效果来源（玩家）
     * @param target 效果目标（敌人或玩家）
     */
    private executeEffect(effect: any, source: Player, target: Enemy | Player): void {
        if (!effect || !effect.type) {
            console.warn('EffectManager: 无效的效果对象', effect);
            return;
        }

        const type = effect.type;
        const value = effect.value || 0;

        try {
            switch (type) {
                case 'damage':
                    // 造成伤害
                    if (target instanceof Enemy) {
                        target.takeDamage(value);
                        console.log(`效果: 对敌人造成${value}点伤害`);
                    } else {
                        console.warn('EffectManager: 伤害效果目标不是敌人');
                    }
                    break;
                case 'block':
                    // 获得格挡
                    source.gainBlock(value);
                    console.log(`效果: 获得${value}点格挡`);
                    break;
                case 'heal':
                    // 回复生命值
                    source.heal(value);
                    console.log(`效果: 回复${value}点生命值`);
                    break;
                case 'draw':
                    // 抽牌
                    if (this.deckManager) {
                        this.deckManager.drawCard(value);
                        console.log(`效果: 抽${value}张牌`);
                    } else {
                        console.warn('EffectManager: 未设置DeckManager，无法执行抽牌效果');
                    }
                    break;
                case 'energy':
                    // 获得能量
                    source.gainEnergy(value);
                    console.log(`效果: 获得${value}点能量`);
                    break;
                default:
                    console.warn(`EffectManager: 未知效果类型: ${type}`);
            }
        } catch (error) {
            console.error(`EffectManager: 执行效果${type}时发生错误`, error);
        }
    }
}

export class CombatScene extends Phaser.Scene {
    private player!: Player;
    private enemy!: Enemy;
    private deckManager!: DeckManager;
    private turnManager!: TurnManager;
    private runStateManager!: RunStateManager;
    private background!: Phaser.GameObjects.Image;
    private cardManager!: CardManager;
    private effectManager!: EffectManager;
    private runState!: any;
    private handleBattleEndBound: ((isVictory: boolean) => void);

    // 战斗相关参数
    private nodeId: string = '';
    private isElite: boolean = false;
    private isBoss: boolean = false;

    // 战斗相关UI
    private drawPileText!: Phaser.GameObjects.Text;
    private discardPileText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;

    constructor() {
        super('CombatScene');
        // 绑定回调函数以便于移除事件监听
        this.handleBattleEndBound = this.handleBattleEnd.bind(this);
    }

    /**
     * 初始化场景
     * @param data 场景数据
     */
    init(data: any): void {
        if (data) {
            this.nodeId = data.nodeId || '';
            this.isElite = data.isElite || false;
            this.isBoss = data.isBoss || false;
        }
    }

    preload(): void {
        // 检查必要的资源是否已经存在
        if (!this.textures.exists('combat_background')) {
            console.log('CombatScene: 正在加载占位资源');
            this.createPlaceholderAssets();
        } else {
            console.log('CombatScene: 使用BootScene生成的SVG资源');
        }
    }

    create(): void {
        console.log('CombatScene创建');

        try {
            // 设置背景
            this.setupBackground();

            // 创建实体（玩家和敌人）- 必须先于回合系统创建
            this.createEntities();

            // 确保实体创建成功
            if (!this.player || !this.enemy) {
                console.error('CombatScene: 实体创建失败，无法继续');
                return;
            }

            // 创建回合系统
            this.createTurnSystem();

            // 创建界面元素
            this.createUI();

            // 战斗开始逻辑
            this.turnManager.startPlayerTurn();

            console.log('CombatScene: 场景创建完成，战斗开始');
        } catch (error) {
            console.error('CombatScene: 创建场景时发生错误', error);
        }
    }

    /**
     * 创建回合系统及相关管理器
     */
    createTurnSystem() {
        // 初始化卡牌和效果管理器
        this.cardManager = new CardManager(this);
        this.effectManager = new EffectManager(this);

        // 创建牌组管理器 (只传递场景参数)
        this.deckManager = new DeckManager(this);

        // 将DeckManager设置到EffectManager中
        this.effectManager.setDeckManager(this.deckManager);

        // 初始化牌组
        if (this.runState && this.runState.deck) {
            this.deckManager.setDeck(this.runState.deck);
        }
        // 注意：DeckManager构造函数已经包含初始化逻辑，不需要再调用initializeDeck

        // 创建回合管理器，确保传递所有必要参数
        this.turnManager = new TurnManager(
            this,
            this.player,
            this.enemy,
            this.deckManager
        );

        // 注册战斗结束事件回调
        this.turnManager.onBattleEnd(this.handleBattleEndBound);
    }

    // 处理战斗结束
    handleBattleEnd(isVictory: boolean) {
        console.log(`战斗结束，${isVictory ? '胜利' : '失败'}`);

        if (isVictory) {
            // 战斗胜利
            this.handleVictory();
        } else {
            // 战斗失败
            this.handleDefeat();
        }
    }

    // 处理战斗胜利
    handleVictory() {
        console.log('处理战斗胜利');
        // 更新玩家数据
        this.updatePlayerStats();
        // 显示奖励
        this.showRewards();
    }

    // 处理战斗失败
    handleDefeat() {
        console.log('处理战斗失败');
        // 游戏结束，显示结束屏幕
        this.time.delayedCall(2000, () => {
            this.scene.start('GameOverScene', {
                floorReached: this.runState.currentFloor,
                goldCollected: this.runState.gold
            });
        });
    }

    update(): void {
        // 更新卡牌堆显示
        this.updateCardPileDisplay();
    }

    /**
     * 创建实体（玩家和敌人）
     */
    private createEntities(): void {
        // 获取当前运行状态
        this.runState = RunStateManager.getInstance().getCurrentRun();

        // 创建玩家 (Player构造函数需要3个参数)
        this.player = new Player(
            this,
            gameConfig.WIDTH * 0.25,
            gameConfig.HEIGHT * 0.65
        );

        // 根据玩家存档设置生命值
        if (this.runState) {
            this.player.updateMaxHp(this.runState.maxHp - gameConfig.PLAYER.STARTING_HP);
            this.player.heal(this.runState.currentHp); // 设置当前生命值
        }

        // 根据当前节点类型确定敌人类型
        const enemyType = this.getEnemyTypeByNodeType();

        // 使用EnemyFactory创建敌人，确保参数顺序和数量正确
        this.enemy = EnemyFactory.createEnemy(
            this,
            gameConfig.WIDTH * 0.75,
            gameConfig.HEIGHT * 0.65,
            enemyType,
            this.isBoss,
            this.isElite
        );
    }

    /**
     * 创建场景标题
     */
    private createSceneTitle(): void {
        let title = '战斗';
        if (this.isElite) {
            title = '精英战斗';
        } else if (this.isBoss) {
            title = 'Boss战斗';
        }

        this.add.text(gameConfig.WIDTH / 2, 50, title, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    /**
     * 创建卡牌堆显示
     */
    private createCardPileDisplay(): void {
        // 抽牌堆文本
        this.drawPileText = this.add.text(100, gameConfig.HEIGHT - 50, `抽牌堆: ${this.deckManager.getDrawPileSize()}`, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 弃牌堆文本
        this.discardPileText = this.add.text(gameConfig.WIDTH - 100, gameConfig.HEIGHT - 50, `弃牌堆: ${this.deckManager.getDiscardPileSize()}`, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    /**
     * 创建金币显示
     */
    private createGoldDisplay(): void {
        const runState = this.runStateManager.getCurrentRun();
        const goldAmount = runState ? runState.gold : 0;

        this.goldText = this.add.text(gameConfig.WIDTH - 100, 50, `金币: ${goldAmount}`, {
            fontSize: '20px',
            color: '#ffff00'
        }).setOrigin(0.5);
    }

    /**
     * 更新卡牌堆显示
     */
    private updateCardPileDisplay(): void {
        this.drawPileText.setText(`抽牌堆: ${this.deckManager.getDrawPileSize()}`);
        this.discardPileText.setText(`弃牌堆: ${this.deckManager.getDiscardPileSize()}`);
    }

    /**
     * 显示奖励
     */
    private showRewards(): void {
        // 计算金币奖励
        const goldReward = this.calculateGoldReward();

        // 跳转到奖励场景
        this.scene.start('RewardScene', {
            gold: goldReward,
            fromCombat: true,
            nodeId: this.nodeId,
            isElite: this.isElite,
            isBoss: this.isBoss
        });
    }

    /**
     * 计算金币奖励
     * @returns 金币数量
     */
    private calculateGoldReward(): number {
        if (this.isBoss) {
            return Math.floor(Math.random() * 50) + 100; // 100-150 金币
        } else if (this.isElite) {
            return Math.floor(Math.random() * 30) + 40;  // 40-70 金币
        } else {
            return Math.floor(Math.random() * 20) + 10;  // 10-30 金币
        }
    }

    /**
     * 生成卡牌奖励
     * @returns 卡牌奖励数组
     */
    private generateCardRewards(): CardData[] {
        // 可用于奖励的卡牌池
        const cardPool = [...BASE_CARDS];

        // 奖励卡牌数量
        const numRewards = 3;

        // 随机选择卡牌
        const rewards: CardData[] = [];

        for (let i = 0; i < numRewards; i++) {
            if (cardPool.length === 0) break;

            // 随机选择一张卡牌
            const randomIndex = Math.floor(Math.random() * cardPool.length);
            const selectedCard = cardPool[randomIndex];

            // 从池中移除该卡牌（避免重复）
            cardPool.splice(randomIndex, 1);

            // 添加到奖励中
            rewards.push({ ...selectedCard });
        }

        return rewards;
    }

    /**
     * 创建临时资源
     */
    private createPlaceholderAssets(): void {
        // 确保SvgGenerator已导入
        if (typeof window === 'undefined' || !window.SvgGenerator) {
            console.warn('CombatScene: SvgGenerator不可用，无法创建占位资源。将使用默认纹理。');

            // 尝试加载基本纹理
            try {
                // 如果没有SVG生成器，可以尝试使用简单的矩形作为替代
                const graphics = this.add.graphics();

                // 为背景创建简单纹理
                graphics.fillStyle(0x333333);
                graphics.fillRect(0, 0, 100, 100);
                graphics.generateTexture('combat_background', 100, 100);

                // 为敌人创建简单纹理
                graphics.fillStyle(0xff0000);
                graphics.fillRect(0, 0, 50, 80);
                graphics.generateTexture('enemy_normal', 50, 80);
                graphics.generateTexture('enemy_elite', 50, 80);
                graphics.generateTexture('enemy_boss', 50, 80);

                // 为玩家创建简单纹理
                graphics.fillStyle(0x0000ff);
                graphics.fillRect(0, 0, 50, 80);
                graphics.generateTexture('player', 50, 80);

                // 为卡牌创建简单纹理
                graphics.fillStyle(0xaaaaaa);
                graphics.fillRect(0, 0, 180, 250);
                graphics.generateTexture('card', 180, 250);
                graphics.generateTexture('card_attack', 180, 250);
                graphics.generateTexture('card_defend', 180, 250);
                graphics.generateTexture('card_skill', 180, 250);

                graphics.destroy();

                console.log('CombatScene: 已创建基本替代纹理');
            } catch (error) {
                console.error('CombatScene: 创建替代纹理失败', error);
            }

            return;
        }

        try {
            // 创建战斗背景
            this.ensureTextureExists('combat_background', () => {
                return window.SvgGenerator.generateBackgroundSvg(gameConfig.WIDTH, gameConfig.HEIGHT, 'combat');
            });

            // 创建怪物图像
            this.ensureTextureExists('enemy_normal', () => {
                return window.SvgGenerator.generateCharacterSvg(200, 300, 'enemy');
            });

            this.ensureTextureExists('enemy_elite', () => {
                return window.SvgGenerator.generateCharacterSvg(200, 300, 'enemy', '#ff9900');
            });

            this.ensureTextureExists('enemy_boss', () => {
                return window.SvgGenerator.generateCharacterSvg(240, 360, 'enemy', '#ff0000');
            });

            // 创建玩家图像
            this.ensureTextureExists('player', () => {
                return window.SvgGenerator.generateCharacterSvg(200, 300, 'player');
            });

            // 创建效果图标
            this.createEffectTextures();

            // 创建卡牌纹理
            this.createCardTextures();

            console.log('CombatScene: 所有占位资源已创建');
        } catch (error) {
            console.error('CombatScene: 创建SVG资源时发生错误', error);
            // 发生错误时尝试创建基本替代纹理
            this.createBasicFallbackTextures();
        }
    }

    /**
     * 创建效果纹理
     */
    private createEffectTextures(): void {
        const effectTypes = [
            { name: 'effect_attack', color: '#ff3333' },
            { name: 'effect_defense', color: '#3333ff' },
            { name: 'effect_buff', color: '#33ff33' },
            { name: 'effect_debuff', color: '#aa33aa' }
        ];

        for (const effect of effectTypes) {
            this.ensureTextureExists(effect.name, () => {
                return window.SvgGenerator.generateEffectSvg(150, 150, effect.color);
            });
        }
    }

    /**
     * 创建卡牌纹理
     */
    private createCardTextures(): void {
        const cardTypes = [
            { name: 'card', type: 'default', title: 'Card', cost: 0, desc: 'Basic card' },
            { name: 'card_attack', type: 'attack', title: 'Attack', cost: 1, desc: 'Deal damage' },
            { name: 'card_defend', type: 'defend', title: 'Defend', cost: 1, desc: 'Gain block' },
            { name: 'card_skill', type: 'skill', title: 'Skill', cost: 1, desc: 'Special ability' }
        ];

        for (const card of cardTypes) {
            this.ensureTextureExists(card.name, () => {
                return window.SvgGenerator.generateCardSvg(180, 250, card.type, card.title, card.cost, card.desc);
            });
        }
    }

    /**
     * 确保纹理存在，如果不存在则创建
     * @param textureName 纹理名称
     * @param createFunc 创建纹理的函数
     */
    private ensureTextureExists(textureName: string, createFunc: () => string): void {
        if (!this.textures.exists(textureName)) {
            try {
                const svg = createFunc();
                this.textures.addBase64(textureName, svg);
                console.log(`CombatScene: 已创建纹理 ${textureName}`);
            } catch (error) {
                console.error(`CombatScene: 创建纹理 ${textureName} 失败`, error);
            }
        }
    }

    /**
     * 创建基本替代纹理
     */
    private createBasicFallbackTextures(): void {
        try {
            // 使用简单的图形创建基本纹理
            const graphics = this.add.graphics();

            // 为背景创建简单纹理
            graphics.fillStyle(0x333333);
            graphics.fillRect(0, 0, 100, 100);
            graphics.generateTexture('combat_background', 100, 100);

            // 为敌人创建简单纹理
            graphics.fillStyle(0xff0000);
            graphics.fillRect(0, 0, 50, 80);
            graphics.generateTexture('enemy_normal', 50, 80);
            graphics.generateTexture('enemy_elite', 50, 80);
            graphics.generateTexture('enemy_boss', 50, 80);

            // 为玩家创建简单纹理
            graphics.fillStyle(0x0000ff);
            graphics.fillRect(0, 0, 50, 80);
            graphics.generateTexture('player', 50, 80);

            // 为卡牌创建简单纹理
            graphics.fillStyle(0xaaaaaa);
            graphics.fillRect(0, 0, 180, 250);
            graphics.generateTexture('card', 180, 250);
            graphics.generateTexture('card_attack', 180, 250);
            graphics.generateTexture('card_defend', 180, 250);
            graphics.generateTexture('card_skill', 180, 250);

            graphics.destroy();

            console.log('CombatScene: 已创建基本替代纹理');
        } catch (error) {
            console.error('CombatScene: 创建替代纹理失败', error);
        }
    }

    /**
     * 场景销毁
     */
    shutdown(): void {
        console.log('CombatScene: 关闭场景，清理资源');

        try {
            // 清理事件监听
            if (this.turnManager) {
                // 移除战斗结束事件监听器
                this.turnManager.offBattleEnd(this.handleBattleEndBound);
                console.log('CombatScene: 已移除战斗结束事件监听器');
            }

            // 清理手牌
            if (this.deckManager) {
                this.deckManager.discardHand();
                console.log('CombatScene: 已清理手牌');
            }

            // 清理其他引用
            this.player = null as any;
            this.enemy = null as any;
            this.deckManager = null as any;
            this.turnManager = null as any;
            this.cardManager = null as any;
            this.effectManager = null as any;

            console.log('CombatScene: 场景资源清理完成');
        } catch (error) {
            console.error('CombatScene: 清理资源时发生错误', error);
        }
    }

    setupBackground() {
        // 初始化状态管理器
        this.runStateManager = RunStateManager.getInstance();

        // 添加背景 - 使用SVG生成的背景
        const backgroundKey = 'combat_background';
        if (this.textures.exists(backgroundKey)) {
            this.background = this.add.image(gameConfig.WIDTH / 2, gameConfig.HEIGHT / 2, backgroundKey);
        } else {
            // 如果SVG背景不存在，退回到旧的占位图
            this.background = this.add.image(gameConfig.WIDTH / 2, gameConfig.HEIGHT / 2, 'background');
            console.warn('CombatScene: 找不到SVG背景，使用替代背景');
        }
        this.background.setDisplaySize(gameConfig.WIDTH, gameConfig.HEIGHT);
    }

    createUI() {
        // 添加场景标题文本
        this.createSceneTitle();

        // 创建卡牌堆显示
        this.createCardPileDisplay();

        // 创建金币显示
        this.createGoldDisplay();

        console.log('战斗场景UI已创建');
    }

    /**
     * 根据当前节点类型确定敌人类型
     * @returns 敌人类型ID
     */
    private getEnemyTypeByNodeType(): string {
        // 根据节点类型和精英/Boss标志确定敌人类型
        if (this.isBoss) {
            return 'enemy_boss'; // 默认Boss类型
        } else if (this.isElite) {
            return 'enemy_elite'; // 默认精英类型
        } else {
            return 'enemy_normal'; // 默认普通敌人类型
        }
    }

    /**
     * 更新玩家状态
     */
    private updatePlayerStats(): void {
        if (!this.runState) return;

        // 更新生命值
        this.runState.currentHp = this.player.getHp();
        this.runState.maxHp = this.player.getMaxHp();

        // 保存更新后的状态
        RunStateManager.getInstance().saveCurrentRun();
    }
}