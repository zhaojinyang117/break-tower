import Phaser from 'phaser';
import Enemy from './Enemy';
import { gameConfig } from '../config/gameConfig';

export default class EnemyFactory {
    /**
     * 创建敌人实例
     * @param scene 场景
     * @param x X坐标
     * @param y Y坐标
     * @param enemyType 敌人类型
     * @param isBoss 是否为Boss
     * @param isElite 是否为精英
     * @returns 敌人实例
     */
    static createEnemy(scene: Phaser.Scene, x: number, y: number, enemyType: string, isBoss: boolean = false, isElite: boolean = false): Enemy {
        const enemy = new Enemy(scene, x, y);

        // 设置敌人的纹理
        let textureKey = 'enemy_normal'; // 默认纹理

        // 根据敌人类型选择纹理
        if (isBoss) {
            textureKey = 'enemy_boss';
        } else if (isElite) {
            textureKey = 'enemy_elite';
        } else {
            textureKey = enemyType || 'enemy_normal';
        }

        // 检查纹理是否存在，不存在则使用默认纹理
        if (!scene.textures.exists(textureKey)) {
            console.warn(`EnemyFactory: 纹理 ${textureKey} 不存在，使用默认敌人纹理`);
            // 尝试创建占位资源
            if (scene.textures.exists('enemy_normal')) {
                textureKey = 'enemy_normal';
            } else if (typeof window !== 'undefined' && window.SvgGenerator) {
                try {
                    const enemySvg = window.SvgGenerator.generateCharacterSvg(200, 300, 'enemy');
                    scene.textures.addBase64('enemy_normal', enemySvg);
                    textureKey = 'enemy_normal';
                    console.log('EnemyFactory: 已创建默认敌人纹理');
                } catch (error) {
                    console.error('EnemyFactory: 创建敌人纹理失败', error);
                    textureKey = 'enemy_placeholder';
                }
            } else {
                textureKey = 'enemy_placeholder';
            }
        }

        // 设置敌人的纹理
        if (enemy.sprite) {
            enemy.sprite.setTexture(textureKey);
        }

        // 根据敌人类型和等级设置不同的属性
        let maxHp = gameConfig.ENEMY.DEFAULT_HP;

        if (isBoss) {
            // Boss敌人有更多的生命值
            maxHp *= 3;
        } else if (isElite) {
            // 精英敌人有更多的生命值
            maxHp *= 1.5;
        }

        // 设置敌人生命值
        enemy.updateMaxHp(maxHp - gameConfig.ENEMY.DEFAULT_HP);

        // 这里可以设置敌人的其他属性，如攻击模式、特殊能力等

        return enemy;
    }
} 