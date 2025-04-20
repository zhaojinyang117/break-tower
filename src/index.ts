import Phaser from 'phaser';
import { gameConfig } from './core/config';
import * as SvgGenerator from './utils/SvgGenerator';
import { Game } from './core/game';

// 添加SvgGenerator到window对象，供全局使用
declare global {
    interface Window {
        SvgGenerator: typeof SvgGenerator;
    }
}

window.SvgGenerator = SvgGenerator;

// 导入所有场景
import {
    BootScene,
    MainMenuScene,
    MapScene,
    CombatScene,
    DeckViewScene,
    RewardScene,
    RestScene,
    EventScene,
    ShopScene,
    SettingsScene,
    DeveloperScene,
    DiscardScene
} from './ui/scenes';

// 获取游戏实例
const gameInstance = Game.getInstance();

// 初始化游戏
gameInstance.init([
    new BootScene(),
    new MainMenuScene(),
    new MapScene(),
    new CombatScene(),
    new DeckViewScene(),
    new RewardScene(),
    new RestScene(),
    new EventScene(),
    new ShopScene(),
    new SettingsScene(),
    new DeveloperScene(),
    new DiscardScene()
]);

// 输出调试信息
console.log(`Break Tower running in ${gameConfig.DEBUG ? 'DEBUG' : 'PRODUCTION'} mode`);

// 导出游戏实例以供全局访问
export default gameInstance;