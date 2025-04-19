import { EventResultType } from '../../core/types';
import { StateManager } from '../../state/StateManager';
import { EventData, EventOption, EventOptionResult, BASE_EVENTS } from './EventData';

/**
 * 事件管理器
 * 负责管理和处理游戏中的事件
 */
export class EventManager {
    private events: EventData[] = [];
    private stateManager: StateManager;

    /**
     * 构造函数
     */
    constructor() {
        this.stateManager = StateManager.getInstance();
        this.loadEvents();
    }

    /**
     * 加载事件数据
     */
    private loadEvents(): void {
        // 加载基础事件
        this.events = [...BASE_EVENTS];
        console.log(`EventManager: 加载了 ${this.events.length} 个事件`);
    }

    /**
     * 获取随机事件
     * @param floor 当前层数
     * @returns 随机事件
     */
    getRandomEvent(floor: number): EventData {
        // 过滤符合当前层数的事件
        const availableEvents = this.events.filter(event => {
            // 检查层数限制
            if (event.minFloor && floor < event.minFloor) return false;
            if (event.maxFloor && floor > event.maxFloor) return false;

            // 检查遗物要求
            if (event.requiredRelics && event.requiredRelics.length > 0) {
                const runState = this.stateManager.getCurrentRun();
                if (!runState) return false;

                // 检查是否拥有所需遗物
                const hasRequiredRelics = event.requiredRelics.every(relicId => {
                    return runState.relics.some(relic => relic.id === relicId);
                });

                if (!hasRequiredRelics) return false;
            }

            // 检查卡牌要求
            if (event.requiredCards && event.requiredCards.length > 0) {
                const runState = this.stateManager.getCurrentRun();
                if (!runState) return false;

                // 检查是否拥有所需卡牌
                const hasRequiredCards = event.requiredCards.every(cardId => {
                    return runState.deck.some(card => card.id === cardId);
                });

                if (!hasRequiredCards) return false;
            }

            return true;
        });

        // 如果没有符合条件的事件，返回一个基础事件
        if (availableEvents.length === 0) {
            console.log('EventManager: 没有符合条件的事件，返回基础事件');
            return BASE_EVENTS[0];
        }

        // 根据权重随机选择事件
        const totalWeight = availableEvents.reduce((sum, event) => sum + (event.weight || 1), 0);
        let randomWeight = Math.random() * totalWeight;
        
        for (const event of availableEvents) {
            const weight = event.weight || 1;
            randomWeight -= weight;
            
            if (randomWeight <= 0) {
                console.log(`EventManager: 随机选择事件 ${event.id}`);
                return event;
            }
        }

        // 如果没有选中任何事件（理论上不会发生），返回第一个可用事件
        console.log(`EventManager: 返回第一个可用事件 ${availableEvents[0].id}`);
        return availableEvents[0];
    }

    /**
     * 获取事件
     * @param eventId 事件ID
     * @returns 事件数据
     */
    getEvent(eventId: string): EventData | null {
        const event = this.events.find(e => e.id === eventId);
        if (!event) {
            console.error(`EventManager: 找不到事件 ${eventId}`);
            return null;
        }
        return event;
    }

    /**
     * 处理事件选项结果
     * @param event 事件数据
     * @param optionId 选项ID
     * @returns 处理结果
     */
    handleEventOption(event: EventData, optionId: string): { success: boolean, results: EventOptionResult[] } {
        // 查找选项
        const option = event.options.find(opt => opt.id === optionId);
        if (!option) {
            console.error(`EventManager: 事件 ${event.id} 中找不到选项 ${optionId}`);
            return { success: false, results: [] };
        }

        // 检查选项条件
        if (option.condition) {
            // TODO: 实现条件检查逻辑
            console.log(`EventManager: 选项 ${optionId} 有条件限制，但尚未实现条件检查逻辑`);
        }

        // 处理选项结果
        for (const result of option.results) {
            this.applyEventResult(result);
        }

        return { success: true, results: option.results };
    }

    /**
     * 应用事件结果
     * @param result 事件结果
     */
    private applyEventResult(result: EventOptionResult): void {
        const runState = this.stateManager.getCurrentRun();
        if (!runState) {
            console.error('EventManager: 无法获取当前运行状态');
            return;
        }

        switch (result.type) {
            case EventResultType.GAIN_GOLD:
                this.stateManager.updateGold(result.value);
                console.log(`EventManager: 获得 ${result.value} 金币`);
                break;

            case EventResultType.LOSE_GOLD:
                this.stateManager.updateGold(-result.value);
                console.log(`EventManager: 失去 ${result.value} 金币`);
                break;

            case EventResultType.GAIN_HP:
                this.stateManager.updateHp(result.value);
                console.log(`EventManager: 回复 ${result.value} 生命值`);
                break;

            case EventResultType.LOSE_HP:
                this.stateManager.updateHp(-result.value);
                console.log(`EventManager: 失去 ${result.value} 生命值`);
                break;

            case EventResultType.GAIN_MAX_HP:
                this.stateManager.updateMaxHp(result.value);
                console.log(`EventManager: 增加 ${result.value} 最大生命值`);
                break;

            case EventResultType.LOSE_MAX_HP:
                this.stateManager.updateMaxHp(-result.value);
                console.log(`EventManager: 减少 ${result.value} 最大生命值`);
                break;

            case EventResultType.GAIN_CARD:
                // TODO: 实现获得卡牌逻辑
                console.log(`EventManager: 获得卡牌，但尚未实现获得卡牌逻辑`);
                break;

            case EventResultType.REMOVE_CARD:
                // TODO: 实现移除卡牌逻辑
                console.log(`EventManager: 移除卡牌，但尚未实现移除卡牌逻辑`);
                break;

            case EventResultType.UPGRADE_CARD:
                // TODO: 实现升级卡牌逻辑
                console.log(`EventManager: 升级卡牌，但尚未实现升级卡牌逻辑`);
                break;

            case EventResultType.GAIN_RELIC:
                // TODO: 实现获得遗物逻辑
                console.log(`EventManager: 获得遗物，但尚未实现获得遗物逻辑`);
                break;

            case EventResultType.START_COMBAT:
                // TODO: 实现开始战斗逻辑
                console.log(`EventManager: 开始战斗，但尚未实现开始战斗逻辑`);
                break;

            case EventResultType.GAIN_POTION:
                // TODO: 实现获得药水逻辑
                console.log(`EventManager: 获得药水，但尚未实现获得药水逻辑`);
                break;

            case EventResultType.SPECIAL:
                // 特殊效果，不做任何处理
                console.log(`EventManager: 特殊效果 - ${result.description}`);
                break;

            default:
                console.error(`EventManager: 未知的事件结果类型 ${result.type}`);
                break;
        }
    }
}