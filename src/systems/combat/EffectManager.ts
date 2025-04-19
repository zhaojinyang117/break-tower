import Phaser from 'phaser';
import { EffectType, StatusEffect } from '../../core/types';
import Player from '../../entities/Player';
import Enemy from '../../entities/Enemy';

/**
 * 效果管理器
 * 负责管理和应用战斗中的各种效果
 */
export class EffectManager {
    private scene: Phaser.Scene;

    /**
     * 构造函数
     * @param scene 场景引用
     */
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 创建伤害效果
     * @param target 目标
     * @param amount 伤害数值
     */
    createDamageEffect(target: Player | Enemy, amount: number): void {
        if (amount <= 0) return;

        // 创建伤害文本
        const damageText = this.scene.add.text(target.sprite.x, target.sprite.y - 30, `-${amount}`, {
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
            targets: target.sprite,
            alpha: 0.5,
            yoyo: true,
            duration: 100,
            repeat: 3
        });
    }

    /**
     * 创建格挡效果
     * @param target 目标
     * @param amount 格挡数值
     */
    createBlockEffect(target: Player | Enemy, amount: number): void {
        if (amount <= 0) return;

        // 创建格挡文本
        const blockText = this.scene.add.text(target.sprite.x, target.sprite.y - 30, `+${amount} 格挡`, {
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
     * @param target 目标
     * @param amount 治疗数值
     */
    createHealEffect(target: Player | Enemy, amount: number): void {
        if (amount <= 0) return;

        // 创建治疗文本
        const healText = this.scene.add.text(target.sprite.x, target.sprite.y - 30, `+${amount}`, {
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
     * 创建能量效果
     * @param target 目标
     * @param amount 能量数值
     */
    createEnergyEffect(target: Player, amount: number): void {
        if (amount <= 0) return;

        // 创建能量文本
        const energyText = this.scene.add.text(target.sprite.x, target.sprite.y - 30, `+${amount} 能量`, {
            fontSize: '24px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 添加动画
        this.scene.tweens.add({
            targets: energyText,
            y: energyText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                energyText.destroy();
            }
        });
    }

    /**
     * 创建抽牌效果
     * @param target 目标
     * @param amount 抽牌数值
     */
    createDrawEffect(target: Player, amount: number): void {
        if (amount <= 0) return;

        // 创建抽牌文本
        const drawText = this.scene.add.text(target.sprite.x, target.sprite.y - 30, `抽 ${amount} 张牌`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 添加动画
        this.scene.tweens.add({
            targets: drawText,
            y: drawText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                drawText.destroy();
            }
        });
    }

    /**
     * 创建状态效果
     * @param target 目标
     * @param effect 状态效果
     */
    createStatusEffect(target: Player | Enemy, effect: StatusEffect): void {
        // 创建状态效果文本
        const color = effect.amount > 0 ? '#00ff00' : '#ff0000';
        const effectText = this.scene.add.text(
            target.sprite.x,
            target.sprite.y - 30,
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
     * 创建粒子效果
     * @param x X坐标
     * @param y Y坐标
     * @param type 效果类型
     */
    createParticleEffect(x: number, y: number, type: EffectType): void {
        let count: number;
        let lifespan: number;

        // 根据效果类型设置粒子参数
        switch (type) {
            case EffectType.DAMAGE:
                count = 20;
                lifespan = 800;
                break;
            case EffectType.BLOCK:
                count = 15;
                lifespan = 600;
                break;
            case EffectType.HEAL:
                count = 25;
                lifespan = 1000;
                break;
            case EffectType.ENERGY:
                count = 15;
                lifespan = 700;
                break;
            default:
                count = 10;
                lifespan = 500;
        }

        // Phaser 3.60+ 的粒子系统发生了变化
        // 这里简化处理，直接使用图像代替粒子效果
        for (let i = 0; i < count; i++) {
            const particle = this.scene.add.image(x, y, 'particle');
            particle.setScale(0.5);
            particle.setAlpha(0.8);

            // 随机位置偏移
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 50;
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;

            // 添加动画
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: 0.1,
                duration: lifespan,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
}