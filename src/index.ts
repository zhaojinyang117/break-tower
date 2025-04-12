import Phaser from 'phaser';
import gameConfig from './config/gameConfig';
import CombatScene from './scenes/CombatScene';

// 游戏配置
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: gameConfig.WIDTH,
    height: gameConfig.HEIGHT,
    parent: 'game-container',
    scene: [CombatScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    backgroundColor: '#333333',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// 创建游戏实例
const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.refresh();
}); 