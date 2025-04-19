import Phaser from 'phaser';
import { gameConfig } from '../core/config';

// 敌人意图类型
export enum IntentType {
    ATTACK,
    DEFEND,
    BUFF,
    DEBUFF,
    UNKNOWN
}

// 意图数据结构
interface Intent {
    type: IntentType;
    value: number;
}

export default class Enemy {
    private scene: Phaser.Scene;
    public sprite: Phaser.GameObjects.Sprite;

    private maxHp: number;
    private currentHp: number;
    private block: number;
    private currentIntent: Intent;
    private isSelected: boolean = false;

    // UI元素
    private hpText!: Phaser.GameObjects.Text;
    private blockText!: Phaser.GameObjects.Text;
    private intentText!: Phaser.GameObjects.Text;
    private selectionIndicator!: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string = 'enemy') {
        this.scene = scene;
        this.sprite = scene.add.sprite(x, y, textureKey);

        // 初始化属性
        this.maxHp = gameConfig.ENEMY.DEFAULT_HP;
        this.currentHp = this.maxHp;
        this.block = 0;

        // 设置初始意图（默认为攻击意图）
        this.currentIntent = {
            type: IntentType.ATTACK,
            value: 10
        };

        // 创建UI显示
        this.createUI();

        // 创建选择指示器
        this.createSelectionIndicator();

        // 设置交互性
        this.setupInteraction();

        // 设置下一次意图
        this.setNextIntent();
    }

    update(): void {
        // 更新UI显示
        this.updateUI();
    }

    // 受到伤害
    takeDamage(amount: number): number {
        // 如果已经死亡，不再受到伤害
        if (this.isDead()) {
            return 0;
        }

        // 如果有格挡，先减少格挡值
        if (this.block > 0) {
            if (this.block >= amount) {
                this.block -= amount;
                amount = 0;
            } else {
                amount -= this.block;
                this.block = 0;
            }
        }

        // 减少生命值
        if (amount > 0) {
            this.currentHp = Math.max(0, this.currentHp - amount);
        }

        // 更新UI
        this.updateUI();

        // 如果敌人死亡，添加死亡效果
        if (this.isDead()) {
            this.onDeath();
        }

        // 返回实际造成的伤害
        return amount;
    }

    // 获得格挡
    gainBlock(amount: number): void {
        this.block += amount;
        this.updateUI();
    }

    // 回复生命值
    heal(amount: number): void {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
        this.updateUI();
    }

    // 更新最大生命值
    updateMaxHp(amount: number): void {
        this.maxHp = Math.max(1, this.maxHp + amount);

        // 如果当前生命值超过新的最大值，将其调整为最大值
        if (this.currentHp > this.maxHp) {
            this.currentHp = this.maxHp;
        }

        // 更新UI
        this.updateUI();
    }

    // 设置下一次意图（随机）
    setNextIntent(): void {
        // 简单AI：随机选择攻击或防御
        const intentTypes = [IntentType.ATTACK, IntentType.DEFEND];
        const randomType = intentTypes[Math.floor(Math.random() * intentTypes.length)];

        switch (randomType) {
            case IntentType.ATTACK:
                // 设置攻击意图，伤害值在8-12之间
                this.currentIntent = {
                    type: IntentType.ATTACK,
                    value: Math.floor(Math.random() * 5) + 8
                };
                break;
            case IntentType.DEFEND:
                // 设置防御意图，格挡值在5-10之间
                this.currentIntent = {
                    type: IntentType.DEFEND,
                    value: Math.floor(Math.random() * 6) + 5
                };
                break;
        }

        // 更新UI显示
        this.updateUI();
    }

    // 执行当前意图
    executeIntent(player: any): void {
        if (this.isDead()) return;
        switch (this.currentIntent.type) {
            case IntentType.ATTACK:
                // 攻击玩家
                player.takeDamage(this.currentIntent.value);
                console.log(`敌人攻击玩家，造成${this.currentIntent.value}点伤害`);
                break;
            case IntentType.DEFEND:
                // 获得格挡
                this.gainBlock(this.currentIntent.value);
                console.log(`敌人获得${this.currentIntent.value}点格挡`);
                break;
        }

        // 设置下一次意图
        this.setNextIntent();
    }

    // 回合结束时清除格挡
    onTurnEnd(): void {
        this.block = 0;
        this.updateUI();
    }

    // 创建UI元素
    private createUI(): void {
        const x = this.sprite.x;
        const y = this.sprite.y + 100;

        // 创建生命值显示
        this.hpText = this.scene.add.text(x, y, `生命: ${this.currentHp}/${this.maxHp}`, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 创建格挡显示
        this.blockText = this.scene.add.text(x, y + 30, `格挡: ${this.block}`, {
            fontSize: '24px',
            color: '#aaaaff'
        }).setOrigin(0.5);

        // 创建意图显示
        this.intentText = this.scene.add.text(x, y - 120, this.getIntentText(), {
            fontSize: '20px',
            color: '#ff0000'
        }).setOrigin(0.5);
    }

    // 创建选择指示器
    private createSelectionIndicator(): void {
        // 创建选择指示器
        this.selectionIndicator = this.scene.add.graphics();

        // 设置初始状态为隐藏
        this.updateSelectionIndicator();
    }

    // 设置敌人交互
    private setupInteraction(): void {
        // 使敌人可交互
        this.sprite.setInteractive();

        // 添加点击事件
        this.sprite.on('pointerdown', () => {
            // 如果敌人已经死亡，不处理点击
            if (this.isDead()) return;

            // 触发选择事件
            if (this.scene.events) {
                this.scene.events.emit('enemySelected', this);
            }
        });

        // 添加悬停效果
        this.sprite.on('pointerover', () => {
            // 如果敌人已经死亡，不处理悬停
            if (this.isDead()) return;

            // 添加悬停效果
            this.sprite.setTint(0xaaaaaa);
        });

        this.sprite.on('pointerout', () => {
            // 移除悬停效果
            this.sprite.clearTint();
        });
    }

    // 更新UI元素
    private updateUI(): void {
        this.hpText.setText(`生命: ${this.currentHp}/${this.maxHp}`);
        this.blockText.setText(`格挡: ${this.block}`);
        this.intentText.setText(this.getIntentText());
    }

    // 获取意图文本描述
    private getIntentText(): string {
        switch (this.currentIntent.type) {
            case IntentType.ATTACK:
                return `意图: 攻击 ${this.currentIntent.value}`;
            case IntentType.DEFEND:
                return `意图: 格挡 ${this.currentIntent.value}`;
            case IntentType.BUFF:
                return `意图: 增益`;
            case IntentType.DEBUFF:
                return `意图: 减益`;
            default:
                return `意图: 未知`;
        }
    }

    // 设置敌人选中状态
    setSelected(selected: boolean): void {
        if (this.isSelected === selected) return;

        this.isSelected = selected;
        this.updateSelectionIndicator();
    }

    // 更新选择指示器
    private updateSelectionIndicator(): void {
        this.selectionIndicator.clear();

        if (this.isSelected && !this.isDead()) {
            // 绘制选中指示器（一个圆形轮廓）
            const x = this.sprite.x;
            const y = this.sprite.y;
            const radius = Math.max(this.sprite.width, this.sprite.height) / 2 + 10;

            this.selectionIndicator.lineStyle(3, 0xffff00, 1);
            this.selectionIndicator.strokeCircle(x, y, radius);

            // 添加闪烁动画
            this.scene.tweens.add({
                targets: this.selectionIndicator,
                alpha: 0.5,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        } else {
            // 停止所有选中指示器的动画
            this.scene.tweens.killTweensOf(this.selectionIndicator);
            this.selectionIndicator.setAlpha(1);
        }
    }

    // 获取敌人的边界矩形（用于碰撞检测）
    getBounds(): Phaser.Geom.Rectangle {
        return new Phaser.Geom.Rectangle(
            this.sprite.x - this.sprite.width / 2,
            this.sprite.y - this.sprite.height / 2,
            this.sprite.width,
            this.sprite.height
        );
    }

    // Getter和Setter方法
    getHp(): number {
        return this.currentHp;
    }

    setHp(hp: number): void {
        this.currentHp = Math.max(0, Math.min(this.maxHp, hp));
        this.updateUI();
    }

    getMaxHp(): number {
        return this.maxHp;
    }

    setMaxHp(maxHp: number): void {
        this.maxHp = Math.max(1, maxHp);
        if (this.currentHp > this.maxHp) {
            this.currentHp = this.maxHp;
        }
        this.updateUI();
    }

    getBlock(): number {
        return this.block;
    }

    getIntent(): Intent {
        return this.currentIntent;
    }

    // 判断是否死亡
    isDead(): boolean {
        return this.currentHp <= 0;
    }

    // 敌人死亡时的处理
    onDeath(): void {
        console.log(`敌人 ${this.getId()} 死亡`);

        // 添加死亡动画
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.3,
            y: this.sprite.y + 20,
            angle: 90,
            duration: 500,
            ease: 'Power2'
        });

        // 禁用交互
        this.sprite.disableInteractive();

        // 隐藏UI元素
        if (this.intentText) {
            this.intentText.setVisible(false);
        }
    }

    // 获取唯一ID
    getId(): string {
        return this.sprite.name || this.sprite.texture.key + '_' + this.sprite.x + '_' + this.sprite.y;
    }
}