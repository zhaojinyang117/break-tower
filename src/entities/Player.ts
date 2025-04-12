import Phaser from 'phaser';
import gameConfig from '../config/gameConfig';

export default class Player {
    private scene: Phaser.Scene;
    private sprite: Phaser.GameObjects.Sprite;

    private maxHp: number;
    private currentHp: number;
    private maxEnergy: number;
    private currentEnergy: number;
    private block: number;

    // UI元素
    private hpText!: Phaser.GameObjects.Text;
    private energyText!: Phaser.GameObjects.Text;
    private blockText!: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;
        this.sprite = scene.add.sprite(x, y, 'player');

        // 初始化属性
        this.maxHp = gameConfig.PLAYER.STARTING_HP;
        this.currentHp = this.maxHp;
        this.maxEnergy = gameConfig.PLAYER.STARTING_ENERGY;
        this.currentEnergy = this.maxEnergy;
        this.block = 0;

        // 创建UI显示
        this.createUI();
    }

    update(): void {
        // 更新UI显示
        this.updateUI();
    }

    // 受到伤害
    takeDamage(amount: number): void {
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

    // 获得/使用能量
    gainEnergy(amount: number): void {
        this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + amount);
        this.updateUI();
    }

    useEnergy(amount: number): boolean {
        if (this.currentEnergy >= amount) {
            this.currentEnergy -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    // 回合开始时重置
    onTurnStart(): void {
        this.currentEnergy = this.maxEnergy;
        this.updateUI();
    }

    // 回合结束时重置
    onTurnEnd(): void {
        // 回合结束时清除格挡
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

        // 创建能量显示
        this.energyText = this.scene.add.text(x, y + 30, `能量: ${this.currentEnergy}/${this.maxEnergy}`, {
            fontSize: '24px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // 创建格挡显示
        this.blockText = this.scene.add.text(x, y + 60, `格挡: ${this.block}`, {
            fontSize: '24px',
            color: '#aaaaff'
        }).setOrigin(0.5);
    }

    // 更新UI元素
    private updateUI(): void {
        this.hpText.setText(`生命: ${this.currentHp}/${this.maxHp}`);
        this.energyText.setText(`能量: ${this.currentEnergy}/${this.maxEnergy}`);
        this.blockText.setText(`格挡: ${this.block}`);
    }

    // Getter方法
    getHp(): number {
        return this.currentHp;
    }

    getMaxHp(): number {
        return this.maxHp;
    }

    getEnergy(): number {
        return this.currentEnergy;
    }

    getBlock(): number {
        return this.block;
    }

    // 判断是否死亡
    isDead(): boolean {
        return this.currentHp <= 0;
    }
} 