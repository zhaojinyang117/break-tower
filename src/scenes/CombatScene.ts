import Phaser from 'phaser';
import gameConfig from '../config/gameConfig';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import DeckManager from '../managers/DeckManager';
import TurnManager from '../managers/TurnManager';

export default class CombatScene extends Phaser.Scene {
    private player!: Player;
    private enemy!: Enemy;
    private deckManager!: DeckManager;
    private turnManager!: TurnManager;
    private background!: Phaser.GameObjects.Image;

    // 战斗相关UI
    private drawPileText!: Phaser.GameObjects.Text;
    private discardPileText!: Phaser.GameObjects.Text;

    constructor() {
        super('CombatScene');
    }

    preload(): void {
        // 加载临时资源
        this.load.image('background', 'assets/images/background_placeholder.png');
        this.load.image('player', 'assets/images/player_placeholder.png');
        this.load.image('enemy', 'assets/images/enemy_placeholder.png');
        this.load.image('card', 'assets/images/card_placeholder.png');

        // 创建临时资源目录和占位图像
        this.createPlaceholderAssets();
    }

    create(): void {
        // 添加背景
        this.background = this.add.image(gameConfig.WIDTH / 2, gameConfig.HEIGHT / 2, 'background');
        this.background.setDisplaySize(gameConfig.WIDTH, gameConfig.HEIGHT);

        // 创建玩家和敌人
        this.player = new Player(this, 300, gameConfig.HEIGHT / 2);
        this.enemy = new Enemy(this, gameConfig.WIDTH - 300, gameConfig.HEIGHT / 2);

        // 创建卡牌管理器
        this.deckManager = new DeckManager(this);

        // 创建回合管理器
        this.turnManager = new TurnManager(this, this.player, this.enemy, this.deckManager);

        // 添加场景标题文本
        this.add.text(gameConfig.WIDTH / 2, 50, '战斗场景', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 创建卡牌堆显示
        this.createCardPileDisplay();

        console.log('战斗场景已创建');
    }

    update(): void {
        // 更新卡牌堆显示
        this.updateCardPileDisplay();
    }

    // 创建卡牌堆显示
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

    // 更新卡牌堆显示
    private updateCardPileDisplay(): void {
        this.drawPileText.setText(`抽牌堆: ${this.deckManager.getDrawPileSize()}`);
        this.discardPileText.setText(`弃牌堆: ${this.deckManager.getDiscardPileSize()}`);
    }

    // 创建临时资源
    private createPlaceholderAssets(): void {
        // 这个方法用于创建临时的占位图像文件
        // 在实际开发中应该使用真实的资源文件
    }
} 