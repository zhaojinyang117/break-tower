import Phaser from 'phaser';
import { CombatScene } from './scenes/CombatScene';
import { MapScene } from './scenes/MapScene';
import { BootScene } from './scenes/BootScene';
import { RewardScene } from './scenes/RewardScene';
import { gameConfig } from './config/gameConfig';
import * as SvgGenerator from './utils/SvgGenerator';

// 添加SvgGenerator到window对象，使其在全局可用
declare global {
    interface Window {
        SvgGenerator: typeof SvgGenerator;
    }
}

window.SvgGenerator = SvgGenerator;

// 游戏配置
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: gameConfig.WIDTH,
    height: gameConfig.HEIGHT,
    backgroundColor: '#000000',
    scene: [BootScene, MapScene, CombatScene, RewardScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    }
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 添加窗口大小调整事件监听
window.addEventListener('resize', () => {
    game.scale.refresh();
}); 