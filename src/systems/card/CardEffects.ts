import { EffectType, TargetType } from '../../core/types';
import { CardEffect } from './CardData';
import Player from '../../entities/Player';
import Enemy from '../../entities/Enemy';

/**
 * 效果执行上下文
 */
export interface EffectContext {
    player: Player;
    enemies: Enemy[];
    targetEnemy?: Enemy;
}

/**
 * 效果执行结果
 */
export interface EffectResult {
    success: boolean;
    message?: string;
    damage?: number;
    block?: number;
    healing?: number;
    cardsDrawn?: number;
    energyGained?: number;
}

/**
 * 卡牌效果执行器
 * 负责执行卡牌效果
 */
export class CardEffectExecutor {
    /**
     * 执行卡牌效果
     * @param effects 效果数组
     * @param context 执行上下文
     * @returns 执行结果
     */
    executeEffects(effects: CardEffect[], context: EffectContext): EffectResult[] {
        const results: EffectResult[] = [];

        for (const effect of effects) {
            const result = this.executeEffect(effect, context);
            results.push(result);
        }

        return results;
    }

    /**
     * 执行单个效果
     * @param effect 效果
     * @param context 执行上下文
     * @returns 执行结果
     */
    private executeEffect(effect: CardEffect, context: EffectContext): EffectResult {
        const { player, enemies, targetEnemy } = context;

        switch (effect.type) {
            case EffectType.DAMAGE:
                return this.executeDamageEffect(effect, context);
            
            case EffectType.BLOCK:
                return this.executeBlockEffect(effect, context);
            
            case EffectType.DRAW:
                return this.executeDrawEffect(effect, context);
            
            case EffectType.ENERGY:
                return this.executeEnergyEffect(effect, context);
            
            case EffectType.HEAL:
                return this.executeHealEffect(effect, context);
            
            case EffectType.BUFF:
                return this.executeBuffEffect(effect, context);
            
            case EffectType.DEBUFF:
                return this.executeDebuffEffect(effect, context);
            
            default:
                return {
                    success: false,
                    message: `未知效果类型: ${effect.type}`
                };
        }
    }

    /**
     * 执行伤害效果
     * @param effect 效果
     * @param context 执行上下文
     * @returns 执行结果
     */
    private executeDamageEffect(effect: CardEffect, context: EffectContext): EffectResult {
        const { player, enemies, targetEnemy } = context;
        const target = effect.target || TargetType.ENEMY_SINGLE;
        let damage = effect.value;

        // 应用力量加成
        damage += player.getStrength();

        // 根据目标类型执行伤害
        if (target === TargetType.ENEMY_SINGLE) {
            if (!targetEnemy) {
                return {
                    success: false,
                    message: '需要选择一个敌人目标'
                };
            }

            const actualDamage = targetEnemy.takeDamage(damage);
            return {
                success: true,
                damage: actualDamage,
                message: `对敌人造成 ${actualDamage} 点伤害`
            };
        } else if (target === TargetType.ALL_ENEMIES) {
            let totalDamage = 0;
            for (const enemy of enemies) {
                const actualDamage = enemy.takeDamage(damage);
                totalDamage += actualDamage;
            }
            return {
                success: true,
                damage: totalDamage,
                message: `对所有敌人造成共 ${totalDamage} 点伤害`
            };
        }

        return {
            success: false,
            message: `无效的伤害目标: ${target}`
        };
    }

    /**
     * 执行格挡效果
     * @param effect 效果
     * @param context 执行上下文
     * @returns 执行结果
     */
    private executeBlockEffect(effect: CardEffect, context: EffectContext): EffectResult {
        const { player } = context;
        let block = effect.value;

        // 应用敏捷加成
        block += player.getDexterity();

        player.gainBlock(block);
        return {
            success: true,
            block,
            message: `获得 ${block} 点格挡`
        };
    }

    /**
     * 执行抽牌效果
     * @param effect 效果
     * @param context 执行上下文
     * @returns 执行结果
     */
    private executeDrawEffect(effect: CardEffect, context: EffectContext): EffectResult {
        // 抽牌效果需要在调用此方法的地方处理
        return {
            success: true,
            cardsDrawn: effect.value,
            message: `抽 ${effect.value} 张牌`
        };
    }

    /**
     * 执行能量效果
     * @param effect 效果
     * @param context 执行上下文
     * @returns 执行结果
     */
    private executeEnergyEffect(effect: CardEffect, context: EffectContext): EffectResult {
        const { player } = context;
        player.gainEnergy(effect.value);
        return {
            success: true,
            energyGained: effect.value,
            message: `获得 ${effect.value} 点能量`
        };
    }

    /**
     * 执行治疗效果
     * @param effect 效果
     * @param context 执行上下文
     * @returns 执行结果
     */
    private executeHealEffect(effect: CardEffect, context: EffectContext): EffectResult {
        const { player } = context;
        player.heal(effect.value);
        return {
            success: true,
            healing: effect.value,
            message: `回复 ${effect.value} 点生命`
        };
    }

    /**
     * 执行增益效果
     * @param effect 效果
     * @param context 执行上下文
     * @returns 执行结果
     */
    private executeBuffEffect(effect: CardEffect, context: EffectContext): EffectResult {
        // 增益效果需要更多的参数，这里只是一个简单的实现
        return {
            success: true,
            message: `应用增益效果`
        };
    }

    /**
     * 执行减益效果
     * @param effect 效果
     * @param context 执行上下文
     * @returns 执行结果
     */
    private executeDebuffEffect(effect: CardEffect, context: EffectContext): EffectResult {
        // 减益效果需要更多的参数，这里只是一个简单的实现
        return {
            success: true,
            message: `应用减益效果`
        };
    }
}