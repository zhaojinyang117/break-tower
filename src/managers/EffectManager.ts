import Phaser from 'phaser';
import { CardEffect, EffectType } from '../config/cardData';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';

export default class EffectManager {
    constructor() {
        // 初始化
    }

    // 执行卡牌效果
    executeCardEffects(effects: any[], source: Player, target: Enemy | Player): void {
        if (!effects || effects.length === 0) return;

        // 处理每个效果
        for (const effect of effects) {
            this.executeEffect(effect, source, target);
        }
    }

    // 执行单个效果
    private executeEffect(effect: any, source: Player, target: Enemy | Player): void {
        const type = effect.type;
        const value = effect.value || 0;

        switch (type) {
            case 'damage':
                // 造成伤害
                if (target instanceof Enemy) {
                    target.takeDamage(value);
                }
                break;
            case 'block':
                // 获得格挡
                source.gainBlock(value);
                break;
            case 'heal':
                // 回复生命值
                source.heal(value);
                break;
            case 'draw':
                // 抽牌
                // 这里需要和DeckManager配合
                break;
            default:
                console.log(`未知效果类型: ${type}`);
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