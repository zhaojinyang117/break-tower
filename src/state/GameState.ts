import { GameStateType } from '../core/types';

/**
 * 游戏状态基类
 * 所有具体状态类的基类
 */
export abstract class GameState {
    protected type: GameStateType;
    protected nextState: GameStateType | null = null;

    /**
     * 构造函数
     * @param type 状态类型
     */
    constructor(type: GameStateType) {
        this.type = type;
    }

    /**
     * 获取状态类型
     */
    public getType(): GameStateType {
        return this.type;
    }

    /**
     * 获取下一个状态
     */
    public getNextState(): GameStateType | null {
        return this.nextState;
    }

    /**
     * 设置下一个状态
     * @param state 下一个状态
     */
    public setNextState(state: GameStateType | null): void {
        this.nextState = state;
    }

    /**
     * 进入状态
     */
    public abstract enter(): void;

    /**
     * 更新状态
     * @param delta 时间增量
     */
    public abstract update(delta: number): void;

    /**
     * 退出状态
     */
    public abstract exit(): void;
}