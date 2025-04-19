import Phaser from 'phaser';
import { gameConfig } from './config';
import { GameStateType } from './types';

/**
 * 游戏主类
 * 负责初始化游戏和管理全局状态
 */
export class Game {
    private static instance: Game;
    private game!: Phaser.Game;
    private currentState: GameStateType = GameStateType.BOOT;

    /**
     * 获取单例实例
     */
    public static getInstance(): Game {
        if (!Game.instance) {
            Game.instance = new Game();
        }
        return Game.instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() {
        console.log('Game: 初始化游戏');
    }

    /**
     * 初始化游戏
     * @param scenes 游戏场景列表
     */
    public init(scenes: Phaser.Scene[]): void {
        // 创建Phaser游戏实例
        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            width: gameConfig.WIDTH,
            height: gameConfig.HEIGHT,
            backgroundColor: '#000000',
            parent: 'game-container',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: gameConfig.WIDTH,
                height: gameConfig.HEIGHT,
                expandParent: true,
                autoRound: true
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: gameConfig.DEBUG
                }
            },
            render: {
                pixelArt: true,
                antialias: false,
                antialiasGL: false
            },
            scene: scenes
        });

        // 添加窗口大小变化的监听器
        window.addEventListener('resize', () => {
            this.game?.scale?.refresh();
        });

        console.log(`Game: 游戏初始化完成，运行在 ${gameConfig.DEBUG ? 'DEBUG' : 'PRODUCTION'} 模式`);
    }

    /**
     * 获取当前游戏状态
     */
    public getCurrentState(): GameStateType {
        return this.currentState;
    }

    /**
     * 设置当前游戏状态
     * @param state 游戏状态
     */
    public setCurrentState(state: GameStateType): void {
        this.currentState = state;
        console.log(`Game: 状态变更为 ${state}`);
    }

    /**
     * 获取Phaser游戏实例
     */
    public getGame(): Phaser.Game {
        return this.game;
    }
}