/**
 * 资源生成脚本
 * 使用SVG生成器创建游戏所需的基本资源
 */

import * as fs from 'fs';
import * as path from 'path';
import * as SvgGenerator from '../src/utils/SvgGenerator';

// 确保输出目录存在
const outputDir = path.join(__dirname, '../public/assets/generated');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 生成角色资源
function generateCharacterAssets() {
    console.log('生成角色资源...');
    
    // 玩家角色
    const playerSvg = SvgGenerator.generateCharacterSvg(200, 300, 'player');
    fs.writeFileSync(path.join(outputDir, 'player.svg'), playerSvg);
    
    // 普通敌人
    const enemySvg = SvgGenerator.generateCharacterSvg(200, 300, 'enemy');
    fs.writeFileSync(path.join(outputDir, 'enemy_normal.svg'), enemySvg);
    
    // 精英敌人
    const eliteEnemySvg = SvgGenerator.generateCharacterSvg(200, 300, 'enemy', '#ff9900');
    fs.writeFileSync(path.join(outputDir, 'enemy_elite.svg'), eliteEnemySvg);
    
    // Boss敌人
    const bossEnemySvg = SvgGenerator.generateCharacterSvg(240, 360, 'enemy', '#ff0000');
    fs.writeFileSync(path.join(outputDir, 'enemy_boss.svg'), bossEnemySvg);
    
    console.log('角色资源生成完成');
}

// 生成卡牌资源
function generateCardAssets() {
    console.log('生成卡牌资源...');
    
    // 基础卡牌
    const cardSvg = SvgGenerator.generateCardSvg(180, 250, 'default', 'Card', 0, 'Basic card');
    fs.writeFileSync(path.join(outputDir, 'card.svg'), cardSvg);
    
    // 攻击卡牌
    const attackCardSvg = SvgGenerator.generateCardSvg(180, 250, 'attack', 'Attack', 1, 'Deal damage');
    fs.writeFileSync(path.join(outputDir, 'card_attack.svg'), attackCardSvg);
    
    // 防御卡牌
    const defendCardSvg = SvgGenerator.generateCardSvg(180, 250, 'defend', 'Defend', 1, 'Gain block');
    fs.writeFileSync(path.join(outputDir, 'card_defend.svg'), defendCardSvg);
    
    // 技能卡牌
    const skillCardSvg = SvgGenerator.generateCardSvg(180, 250, 'skill', 'Skill', 1, 'Special ability');
    fs.writeFileSync(path.join(outputDir, 'card_skill.svg'), skillCardSvg);
    
    // 能力卡牌
    const powerCardSvg = SvgGenerator.generateCardSvg(180, 250, 'power', 'Power', 2, 'Ongoing effect');
    fs.writeFileSync(path.join(outputDir, 'card_power.svg'), powerCardSvg);
    
    console.log('卡牌资源生成完成');
}

// 生成背景资源
function generateBackgroundAssets() {
    console.log('生成背景资源...');
    
    // 战斗背景
    const combatBgSvg = SvgGenerator.generateBackgroundSvg(1280, 720, 'combat');
    fs.writeFileSync(path.join(outputDir, 'combat_background.svg'), combatBgSvg);
    
    // 地图背景
    const mapBgSvg = SvgGenerator.generateBackgroundSvg(1280, 720, 'map');
    fs.writeFileSync(path.join(outputDir, 'map_background.svg'), mapBgSvg);
    
    // 休息处背景
    const restBgSvg = SvgGenerator.generateBackgroundSvg(1280, 720, 'rest');
    fs.writeFileSync(path.join(outputDir, 'rest_background.svg'), restBgSvg);
    
    // 事件背景
    const eventBgSvg = SvgGenerator.generateBackgroundSvg(1280, 720, 'event');
    fs.writeFileSync(path.join(outputDir, 'event_background.svg'), eventBgSvg);
    
    // 商店背景
    const shopBgSvg = SvgGenerator.generateBackgroundSvg(1280, 720, 'shop');
    fs.writeFileSync(path.join(outputDir, 'shop_background.svg'), shopBgSvg);
    
    console.log('背景资源生成完成');
}

// 生成地图节点资源
function generateMapNodeAssets() {
    console.log('生成地图节点资源...');
    
    const nodeTypes = ['battle', 'elite', 'rest', 'event', 'shop', 'boss'];
    const nodeStates = ['available', 'unavailable', 'completed'];
    
    for (const type of nodeTypes) {
        for (const state of nodeStates) {
            const nodeSvg = SvgGenerator.generateNodeSvg(80, 80, type, state as any);
            fs.writeFileSync(path.join(outputDir, `node_${type}_${state}.svg`), nodeSvg);
        }
    }
    
    console.log('地图节点资源生成完成');
}

// 生成特效资源
function generateEffectAssets() {
    console.log('生成特效资源...');
    
    // 攻击特效
    const attackEffectSvg = SvgGenerator.generateEffectSvg(150, 150, '#ff3333');
    fs.writeFileSync(path.join(outputDir, 'effect_attack.svg'), attackEffectSvg);
    
    // 防御特效
    const defenseEffectSvg = SvgGenerator.generateEffectSvg(150, 150, '#3333ff');
    fs.writeFileSync(path.join(outputDir, 'effect_defense.svg'), defenseEffectSvg);
    
    // 增益特效
    const buffEffectSvg = SvgGenerator.generateEffectSvg(150, 150, '#33ff33');
    fs.writeFileSync(path.join(outputDir, 'effect_buff.svg'), buffEffectSvg);
    
    // 减益特效
    const debuffEffectSvg = SvgGenerator.generateEffectSvg(150, 150, '#aa33aa');
    fs.writeFileSync(path.join(outputDir, 'effect_debuff.svg'), debuffEffectSvg);
    
    console.log('特效资源生成完成');
}

// 主函数
function main() {
    console.log('开始生成游戏资源...');
    
    try {
        generateCharacterAssets();
        generateCardAssets();
        generateBackgroundAssets();
        generateMapNodeAssets();
        generateEffectAssets();
        
        console.log('所有资源生成完成！');
    } catch (error) {
        console.error('生成资源时出错:', error);
    }
}

// 执行主函数
main();
