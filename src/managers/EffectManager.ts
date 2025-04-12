import { CardEffect, EffectType } from '../config/cardData';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';

export default class EffectManager {
    // 处理卡牌效果执行
    executeCardEffects(effects: CardEffect[], source: Player, target: Enemy | Player | Enemy[]): void {
        // 遍历所有效果并执行
        effects.forEach(effect => {
            this.executeEffect(effect, source, target);
        });
    }

    // 执行单个效果
    private executeEffect(effect: CardEffect, source: Player, target: Enemy | Player | Enemy[]): void {
        switch (effect.type) {
            case EffectType.DAMAGE:
                this.executeDamageEffect(effect.value, target);
                break;
            case EffectType.BLOCK:
                this.executeBlockEffect(effect.value, source);
                break;
            case EffectType.DRAW:
                this.executeDrawEffect(effect.value);
                break;
            case EffectType.ENERGY:
                this.executeEnergyEffect(effect.value, source);
                break;
            case EffectType.HEAL:
                this.executeHealEffect(effect.value, source);
                break;
            default:
                console.warn(`未实现的效果类型: ${effect.type}`);
        }
    }

    // 处理伤害效果
    private executeDamageEffect(value: number, target: Enemy | Player | Enemy[]): void {
        if (Array.isArray(target)) {
            // 对所有目标造成伤害
            target.forEach(enemy => {
                enemy.takeDamage(value);
                console.log(`对敌人造成${value}点伤害`);
            });
        } else {
            // 对单一目标造成伤害
            target.takeDamage(value);
            console.log(`对目标造成${value}点伤害`);
        }
    }

    // 处理格挡效果
    private executeBlockEffect(value: number, source: Player): void {
        source.gainBlock(value);
        console.log(`获得${value}点格挡`);
    }

    // 处理抽牌效果
    private executeDrawEffect(value: number): void {
        // 需要与DeckManager集成
        console.log(`抽${value}张牌`);
        // 实际抽牌逻辑在调用方实现
    }

    // 处理能量效果
    private executeEnergyEffect(value: number, source: Player): void {
        source.gainEnergy(value);
        console.log(`获得${value}点能量`);
    }

    // 处理治疗效果
    private executeHealEffect(value: number, source: Player): void {
        source.heal(value);
        console.log(`回复${value}点生命值`);
    }
} 