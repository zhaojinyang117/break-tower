import Phaser from 'phaser';
import { gameConfig } from '../core/config';

/**
 * 玩家状态效果接口
 */
export interface PlayerEffect {
    id: string;
    name: string;
    amount: number;
    duration: number; // -1表示永久效果
    icon?: string;
}

/**
 * 玩家类
 * 管理玩家的生命值、能量、格挡和状态效果
 */
export default class Player {
    private scene: Phaser.Scene;
    public sprite: Phaser.GameObjects.Sprite;

    // 基础属性
    private maxHp: number;
    private currentHp: number;
    private maxEnergy: number;
    private currentEnergy: number;
    private block: number;

    // 状态效果
    private buffs: PlayerEffect[] = [];
    private debuffs: PlayerEffect[] = [];

    // 战斗属性
    private strength: number = 0; // 力量，增加攻击伤害
    private dexterity: number = 0; // 敏捷，增加格挡值
    private landPlayedThisTurn: boolean = false; // 本回合是否已使用地牌

    // UI元素
    private hpText!: Phaser.GameObjects.Text;
    private energyText!: Phaser.GameObjects.Text;
    private blockText!: Phaser.GameObjects.Text;
    private buffContainer!: Phaser.GameObjects.Container;

    /**
     * 创建玩家实例
     * @param scene 场景引用
     * @param x X坐标
     * @param y Y坐标
     */
    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;

        // 使用player_placeholder纹理（由BootScene中的SVG生成）
        const textureKey = scene.textures.exists('player_placeholder')
            ? 'player_placeholder'
            : 'player';

        this.sprite = scene.add.sprite(x, y, textureKey);

        // 初始化属性
        this.maxHp = gameConfig.PLAYER.STARTING_HP;
        this.currentHp = this.maxHp;
        this.maxEnergy = gameConfig.PLAYER.STARTING_ENERGY;
        this.currentEnergy = this.maxEnergy;
        this.block = 0;

        // 创建UI显示
        this.createUI();
    }

    /**
     * 更新玩家状态
     */
    update(): void {
        // 更新UI显示
        this.updateUI();
    }

    /**
     * 受到伤害
     * @param amount 伤害数值
     * @returns 实际受到的伤害
     */
    takeDamage(amount: number): number {
        // 记录原始伤害值用于返回
        const originalAmount = amount;

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

            // 创建伤害文本效果
            this.createDamageEffect(amount);
        }

        // 更新UI
        this.updateUI();

        // 返回实际受到的伤害（原始伤害减去被格挡的部分）
        return originalAmount - this.block;
    }

    /**
     * 获得格挡
     * @param amount 格挡数值
     */
    gainBlock(amount: number): void {
        // 应用敏捷加成
        if (this.dexterity > 0) {
            amount += this.dexterity;
        }

        this.block += amount;

        // 创建格挡获得效果
        this.createBlockEffect(amount);

        this.updateUI();
    }

    /**
     * 回复生命值
     * @param amount 回复数值
     */
    heal(amount: number): void {
        const oldHp = this.currentHp;
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);

        // 创建治疗效果
        const actualHeal = this.currentHp - oldHp;
        if (actualHeal > 0) {
            this.createHealEffect(actualHeal);
        }

        this.updateUI();
    }

    /**
     * 获得能量
     * @param amount 能量数值
     */
    gainEnergy(amount: number): void {
        this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + amount);
        this.updateUI();
    }

    /**
     * 使用能量
     * @param amount 能量消耗
     * @returns 是否成功使用能量
     */
    useEnergy(amount: number): boolean {
        if (this.currentEnergy >= amount) {
            this.currentEnergy -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    /**
     * 使用地牌
     * @returns 是否成功使用地牌
     */
    playLand(): boolean {
        // 如果本回合已经使用过地牌，则不能再使用
        if (this.landPlayedThisTurn) {
            console.log('Player: 本回合已经使用过地牌，不能再使用');
            return false;
        }

        // 标记地牌已使用
        this.landPlayedThisTurn = true;
        console.log('Player: 成功使用地牌');
        return true;
    }

    /**
     * 检查是否可以使用地牌
     * @returns 是否可以使用地牌
     */
    canPlayLand(): boolean {
        return !this.landPlayedThisTurn;
    }

    /**
     * 回合开始时调用
     */
    onTurnStart(): void {
        // 重置能量
        this.currentEnergy = this.maxEnergy;

        // 重置地牌使用状态
        this.landPlayedThisTurn = false;

        // 处理回合开始时的效果
        this.processBuffsOnTurnStart();

        this.updateUI();
    }

    /**
     * 回合结束时调用
     */
    onTurnEnd(): void {
        // 回合结束时清除格挡（除非有特殊效果保留格挡）
        if (!this.hasEffect('retain_block')) {
            this.block = 0;
        }

        // 处理回合结束时的效果
        this.processBuffsOnTurnEnd();

        // 减少状态效果持续时间
        this.decreaseEffectDurations();

        this.updateUI();
    }

    /**
     * 添加状态效果
     * @param effect 效果对象
     * @param isBuff 是否为增益效果
     */
    addEffect(effect: PlayerEffect, isBuff: boolean = true): void {
        // 检查是否已有相同效果
        const effectList = isBuff ? this.buffs : this.debuffs;
        const existingEffect = effectList.find(e => e.id === effect.id);

        if (existingEffect) {
            // 如果已存在，更新数值和持续时间
            existingEffect.amount += effect.amount;
            if (effect.duration > existingEffect.duration || effect.duration === -1) {
                existingEffect.duration = effect.duration;
            }
        } else {
            // 否则添加新效果
            effectList.push({ ...effect });
        }

        // 特殊效果处理
        if (effect.id === 'strength') {
            this.strength += effect.amount;
        } else if (effect.id === 'dexterity') {
            this.dexterity += effect.amount;
        }

        // 创建效果添加的视觉反馈
        this.createEffectAddedVisual(effect, isBuff);

        this.updateUI();
    }

    /**
     * 移除状态效果
     * @param effectId 效果ID
     * @param isBuff 是否为增益效果
     */
    removeEffect(effectId: string, isBuff: boolean = true): void {
        const effectList = isBuff ? this.buffs : this.debuffs;
        const index = effectList.findIndex(e => e.id === effectId);

        if (index !== -1) {
            const effect = effectList[index];

            // 特殊效果处理
            if (effect.id === 'strength') {
                this.strength -= effect.amount;
            } else if (effect.id === 'dexterity') {
                this.dexterity -= effect.amount;
            }

            // 移除效果
            effectList.splice(index, 1);

            this.updateUI();
        }
    }

    /**
     * 检查是否有特定效果
     * @param effectId 效果ID
     * @returns 是否存在该效果
     */
    hasEffect(effectId: string): boolean {
        return this.buffs.some(e => e.id === effectId) ||
            this.debuffs.some(e => e.id === effectId);
    }

    /**
     * 获取效果数值
     * @param effectId 效果ID
     * @returns 效果数值，如果不存在则返回0
     */
    getEffectAmount(effectId: string): number {
        const buff = this.buffs.find(e => e.id === effectId);
        if (buff) return buff.amount;

        const debuff = this.debuffs.find(e => e.id === effectId);
        if (debuff) return debuff.amount;

        return 0;
    }

    /**
     * 创建UI元素
     */
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

        // 创建状态效果容器
        this.buffContainer = this.scene.add.container(x, y - 50);
    }

    /**
     * 更新UI元素
     */
    private updateUI(): void {
        this.hpText.setText(`生命: ${this.currentHp}/${this.maxHp}`);
        this.energyText.setText(`能量: ${this.currentEnergy}/${this.maxEnergy}`);
        this.blockText.setText(`格挡: ${this.block}`);

        // 更新状态效果显示
        this.updateEffectsDisplay();
    }

    /**
     * 更新状态效果显示
     */
    private updateEffectsDisplay(): void {
        // 清除现有显示
        this.buffContainer.removeAll(true);

        // 显示增益效果
        let xOffset = -20 * this.buffs.length / 2;
        this.buffs.forEach(buff => {
            const buffIcon = this.scene.add.circle(xOffset, 0, 10, 0x00ff00);
            this.buffContainer.add(buffIcon);

            const buffText = this.scene.add.text(xOffset, 0, buff.amount.toString(), {
                fontSize: '12px',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.buffContainer.add(buffText);

            xOffset += 20;
        });

        // 显示减益效果
        xOffset = -20 * this.debuffs.length / 2;
        this.debuffs.forEach(debuff => {
            const debuffIcon = this.scene.add.circle(xOffset, 20, 10, 0xff0000);
            this.buffContainer.add(debuffIcon);

            const debuffText = this.scene.add.text(xOffset, 20, debuff.amount.toString(), {
                fontSize: '12px',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.buffContainer.add(debuffText);

            xOffset += 20;
        });
    }

    /**
     * 创建伤害效果
     * @param amount 伤害数值
     */
    private createDamageEffect(amount: number): void {
        // 创建伤害文本
        const damageText = this.scene.add.text(this.sprite.x, this.sprite.y - 30, `-${amount}`, {
            fontSize: '24px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 添加动画
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                damageText.destroy();
            }
        });

        // 添加精灵闪烁效果
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            yoyo: true,
            duration: 100,
            repeat: 3
        });
    }

    /**
     * 创建格挡效果
     * @param amount 格挡数值
     */
    private createBlockEffect(amount: number): void {
        // 创建格挡文本
        const blockText = this.scene.add.text(this.sprite.x, this.sprite.y - 30, `+${amount} 格挡`, {
            fontSize: '24px',
            color: '#aaaaff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 添加动画
        this.scene.tweens.add({
            targets: blockText,
            y: blockText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                blockText.destroy();
            }
        });
    }

    /**
     * 创建治疗效果
     * @param amount 治疗数值
     */
    private createHealEffect(amount: number): void {
        // 创建治疗文本
        const healText = this.scene.add.text(this.sprite.x, this.sprite.y - 30, `+${amount}`, {
            fontSize: '24px',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 添加动画
        this.scene.tweens.add({
            targets: healText,
            y: healText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                healText.destroy();
            }
        });
    }

    /**
     * 创建效果添加的视觉反馈
     * @param effect 效果对象
     * @param isBuff 是否为增益效果
     */
    private createEffectAddedVisual(effect: PlayerEffect, isBuff: boolean): void {
        // 创建效果文本
        const color = isBuff ? '#00ff00' : '#ff0000';
        const effectText = this.scene.add.text(
            this.sprite.x,
            this.sprite.y - 30,
            `${effect.name} ${effect.amount > 0 ? '+' + effect.amount : effect.amount}`,
            {
                fontSize: '20px',
                color: color,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // 添加动画
        this.scene.tweens.add({
            targets: effectText,
            y: effectText.y - 40,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                effectText.destroy();
            }
        });
    }

    /**
     * 处理回合开始时的效果
     */
    private processBuffsOnTurnStart(): void {
        // 处理回合开始时触发的效果
        for (const buff of this.buffs) {
            if (buff.id === 'energy_regen') {
                this.gainEnergy(buff.amount);
            }
            // 添加其他回合开始效果...
        }

        for (const debuff of this.debuffs) {
            if (debuff.id === 'energy_loss') {
                this.currentEnergy = Math.max(0, this.currentEnergy - debuff.amount);
            }
            // 添加其他回合开始减益效果...
        }
    }

    /**
     * 处理回合结束时的效果
     */
    private processBuffsOnTurnEnd(): void {
        // 处理回合结束时触发的效果
        for (const buff of this.buffs) {
            if (buff.id === 'regeneration') {
                this.heal(buff.amount);
            }
            // 添加其他回合结束效果...
        }

        for (const debuff of this.debuffs) {
            if (debuff.id === 'poison') {
                this.takeDamage(debuff.amount);
            }
            // 添加其他回合结束减益效果...
        }
    }

    /**
     * 减少状态效果持续时间
     */
    private decreaseEffectDurations(): void {
        // 处理增益效果
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            const buff = this.buffs[i];
            if (buff.duration > 0) {
                buff.duration--;
                if (buff.duration === 0) {
                    // 特殊效果处理
                    if (buff.id === 'strength') {
                        this.strength -= buff.amount;
                    } else if (buff.id === 'dexterity') {
                        this.dexterity -= buff.amount;
                    }

                    // 移除效果
                    this.buffs.splice(i, 1);
                }
            }
        }

        // 处理减益效果
        for (let i = this.debuffs.length - 1; i >= 0; i--) {
            const debuff = this.debuffs[i];
            if (debuff.duration > 0) {
                debuff.duration--;
                if (debuff.duration === 0) {
                    // 移除效果
                    this.debuffs.splice(i, 1);
                }
            }
        }
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

    /**
     * 更新最大生命值
     * @param amount 变化数值
     */
    updateMaxHp(amount: number): void {
        this.maxHp = Math.max(1, this.maxHp + amount);

        // 如果当前生命值超过新的最大值，将其调整为最大值
        if (this.currentHp > this.maxHp) {
            this.currentHp = this.maxHp;
        }

        // 更新UI
        this.updateUI();
    }

    getEnergy(): number {
        return this.currentEnergy;
    }

    getMaxEnergy(): number {
        return this.maxEnergy;
    }

    /**
     * 增加能量上限
     * @param amount 增加数值
     */
    increaseMaxEnergy(amount: number): void {
        this.maxEnergy += amount;
        // 同时增加当前能量
        this.currentEnergy += amount;
        console.log(`Player: 能量上限增加 ${amount} 点，现在为 ${this.maxEnergy} 点`);
        this.updateUI();
    }

    getBlock(): number {
        return this.block;
    }

    getStrength(): number {
        return this.strength;
    }

    getDexterity(): number {
        return this.dexterity;
    }

    getBuffs(): PlayerEffect[] {
        return [...this.buffs];
    }

    getDebuffs(): PlayerEffect[] {
        return [...this.debuffs];
    }

    /**
     * 判断是否死亡
     * @returns 是否死亡
     */
    isDead(): boolean {
        return this.currentHp <= 0;
    }
}