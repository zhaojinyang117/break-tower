import Phaser from 'phaser';
import { NodeType, NodeStatus } from '../../core/types';
import { MapNode, MapPath, GameMap } from '../../systems/map/MapData';
import { MapGenerator } from '../../systems/map/MapGenerator';
import { StateManager } from '../../state/StateManager';
import { Button } from '../components/Button';
import { HealthBar } from '../components/HealthBar';
import { Game } from '../../core/game';
import { GameStateType } from '../../core/types';
import { gameConfig } from '../../core/config';

/**
 * 地图场景
 * 显示地图节点和路径，处理用户交互
 */
export class MapScene extends Phaser.Scene {
    // 地图相关
    private map!: GameMap;
    private mapGenerator!: MapGenerator;
    private stateManager!: StateManager;

    // 场景元素
    private nodeSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private pathGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
    private background!: Phaser.GameObjects.Image;

    // 地图容器
    private mapContainer!: Phaser.GameObjects.Container;

    // 相机控制
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private minCameraX: number = 0;
    private maxCameraX: number = 0;
    private minCameraY: number = 0;
    private maxCameraY: number = 0;

    // UI元素
    private floorText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private healthBar!: HealthBar;
    private deckButton!: Button;
    private uiContainer!: Phaser.GameObjects.Container;

    // 调试信息
    private debugText!: Phaser.GameObjects.Text;
    private debugMode: boolean = false;

    constructor() {
        super('MapScene');
    }

    /**
     * 创建场景
     */
    create(data?: any): void {
        console.log('MapScene: 开始创建场景');
        this.log('开始创建场景');

        try {
            // 初始化管理器
            this.mapGenerator = new MapGenerator();
            this.stateManager = StateManager.getInstance();
            this.log('初始化管理器完成');

            // 添加调试文本
            if (this.debugMode) {
                this.createDebugText();
                this.log('创建调试文本完成');
            }

            // 创建UI容器
            this.uiContainer = this.add.container(0, 0);
            this.uiContainer.setDepth(100); // 确保UI在最上层

            // 创建地图容器
            this.mapContainer = this.add.container(0, 0);

            // 初始化场景元素
            this.createBackground();
            this.log('创建背景完成');

            this.createUI();
            this.log('创建UI完成');

            // 从运行状态获取地图，或创建新地图
            const runState = this.stateManager.getCurrentRun();
            this.log(`当前运行状态: ${runState ? '存在' : '不存在'}`);

            if (runState) {
                if (runState.map) {
                    this.log('从运行状态获取地图');
                    this.map = runState.map;
                    this.log(`地图节点数量: ${this.map.nodes.length}, 路径数量: ${this.map.paths.length}`);
                } else {
                    this.log('创建新地图');
                    try {
                        this.map = this.mapGenerator.generateMap();
                        this.log(`新地图生成完成，节点数量: ${this.map.nodes.length}, 路径数量: ${this.map.paths.length}`);
                        this.stateManager.setMap(this.map);
                        this.log('地图保存到运行状态');
                    } catch (err) {
                        console.error('MapScene: 生成地图失败:', err);
                        this.log(`生成地图失败: ${(err as Error).message}`);
                        this.showError(`生成地图失败: ${(err as Error).message}`);
                        return;
                    }
                }

                // 创建地图元素
                try {
                    this.createMapElements();
                    this.log('创建地图元素完成');

                    // 设置相机边界
                    this.setupCameraBounds();
                    this.log('设置相机边界完成');

                    // 设置相机拖动控制
                    this.setupCameraControls();
                    this.log('设置相机控制完成');
                } catch (err) {
                    console.error('MapScene: 创建地图元素失败:', err);
                    this.log(`创建地图元素失败: ${(err as Error).message}`);
                    this.showError(`创建地图元素失败: ${(err as Error).message}`);
                    return;
                }

                // 更新UI
                this.updateUI();
                this.log('更新UI完成');

                // 更新游戏状态
                Game.getInstance().setCurrentState(GameStateType.MAP);

                console.log('MapScene: 地图场景已创建完成');
                this.log('地图场景创建完成');
            } else {
                this.log('无运行状态，显示错误');
                this.handleNoRunState();
            }
        } catch (error) {
            console.error('MapScene: 创建场景失败:', error);
            this.log(`创建场景失败: ${(error as Error).message}`);
            this.showError(`创建场景失败: ${(error as Error).message}\n${(error as Error).stack}`);
        }
    }

    /**
     * 设置相机边界
     */
    private setupCameraBounds(): void {
        if (!this.map || !this.map.nodes || this.map.nodes.length === 0) {
            return;
        }

        // 计算地图边界
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        this.map.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });

        // 添加边距
        const margin = 100;
        minX -= margin;
        maxX += margin;
        minY -= margin;
        maxY += margin;

        // 设置相机的最小/最大移动范围
        this.minCameraX = minX;
        this.maxCameraX = Math.max(maxX - gameConfig.WIDTH, minX);
        this.minCameraY = minY;
        this.maxCameraY = Math.max(maxY - gameConfig.HEIGHT, minY);

        // 初始位置：居中显示第一层
        const firstLevelNodes = this.map.nodes.filter(node => node.level === 0);
        if (firstLevelNodes.length > 0) {
            // 计算第一层节点的平均X位置
            const avgX = firstLevelNodes.reduce((sum, node) => sum + node.x, 0) / firstLevelNodes.length;
            // 设置相机位置，使第一层节点居中
            this.cameras.main.scrollX = avgX - gameConfig.WIDTH / 2;
        }
    }

    /**
     * 设置相机拖动控制
     */
    private setupCameraControls(): void {
        // 监听鼠标/触摸按下事件
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // 只有在非UI区域才启用拖动
            if (!this.isPointerOverUI(pointer)) {
                this.isDragging = true;
                this.dragStartX = pointer.x + this.cameras.main.scrollX;
                this.dragStartY = pointer.y + this.cameras.main.scrollY;
            }
        });

        // 监听鼠标/触摸移动事件
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging) {
                // 计算新的相机位置
                const newScrollX = this.dragStartX - pointer.x;
                const newScrollY = this.dragStartY - pointer.y;

                // 应用相机边界限制
                this.cameras.main.scrollX = Phaser.Math.Clamp(newScrollX, this.minCameraX, this.maxCameraX);
                this.cameras.main.scrollY = Phaser.Math.Clamp(newScrollY, this.minCameraY, this.maxCameraY);
            }
        });

        // 监听鼠标/触摸释放事件
        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // 监听鼠标/触摸离开画布事件
        this.input.on('pointerout', () => {
            this.isDragging = false;
        });
    }

    /**
     * 检查指针是否在UI元素上
     */
    private isPointerOverUI(pointer: Phaser.Input.Pointer): boolean {
        // 检查点击位置是否在UI容器内的元素上
        const uiElements = [this.floorText, this.goldText, this.healthBar, this.deckButton];
        for (const element of uiElements) {
            if (element && element.getBounds().contains(pointer.x, pointer.y)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 处理无运行状态的情况
     */
    private handleNoRunState(): void {
        console.error('MapScene: 无运行状态');

        // 显示错误信息
        this.showError('找不到游戏状态，请重启游戏');

        // 添加重新开始按钮
        const restartButton = new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: gameConfig.HEIGHT / 2 + 100,
            width: 200,
            height: 60,
            text: '重新开始',
            backgroundColor: 0x4a6fb5,
            hoverColor: 0x3a5fa5,
            borderRadius: 10,
            onClick: () => {
                // 重新启动 BootScene
                this.scene.start('BootScene');
            }
        });
    }

    /**
     * 显示错误消息
     */
    private showError(message: string): void {
        this.add.rectangle(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 - 50,
            gameConfig.WIDTH * 0.8,
            100,
            0xaa0000,
            0.8
        );

        this.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 - 50,
            message,
            { fontSize: '24px', color: '#ffffff', align: 'center' }
        ).setOrigin(0.5);
    }

    /**
     * 创建调试文本
     */
    private createDebugText(): void {
        this.debugText = this.add.text(10, gameConfig.HEIGHT - 60, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setDepth(1000);
    }

    /**
     * 输出调试日志
     */
    private log(message: string): void {
        console.log(`MapScene: ${message}`);
        if (this.debugMode && this.debugText) {
            // 附加而不是替换文本
            this.debugText.setText(this.debugText.text + '\n' + message);
        }
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        this.log('创建背景');
        
        // 创建一个简单的颜色渐变背景
        const background = this.add.graphics();

        // 添加底色
        background.fillGradientStyle(
            0x000022, 0x000022,
            0x000044, 0x000044,
            1
        );
        background.fillRect(0, 0, gameConfig.WIDTH, gameConfig.HEIGHT);

        // 添加一些装饰元素（星星）
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, gameConfig.WIDTH);
            const y = Phaser.Math.Between(0, gameConfig.HEIGHT);
            const radius = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            background.fillStyle(0xffffff, alpha);
            background.fillCircle(x, y, radius);
        }

        // 背景固定，不随相机移动
        background.setScrollFactor(0);
    }

    /**
     * 创建UI元素
     */
    private createUI(): void {
        this.log('创建UI元素');

        // 楼层文本
        this.floorText = this.add.text(gameConfig.WIDTH / 2, 30, '第 1 层', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.floorText.setScrollFactor(0); // UI固定，不随相机移动
        this.uiContainer.add(this.floorText);

        // 金币文本
        this.goldText = this.add.text(gameConfig.WIDTH - 100, 30, '金币: 0', {
            fontSize: '20px',
            color: '#ffff00'
        }).setOrigin(0.5);
        this.goldText.setScrollFactor(0); // UI固定，不随相机移动
        this.uiContainer.add(this.goldText);

        // 生命值条
        this.healthBar = new HealthBar(this, {
            x: 150,
            y: 30,
            width: 200,
            height: 20,
            maxValue: 100,
            currentValue: 80,
            backgroundColor: 0x333333,
            barColor: 0xff5555,
            borderColor: 0xffffff,
            borderWidth: 2,
            borderRadius: 5,
            showText: true
        });
        this.healthBar.setScrollFactor(0); // UI固定，不随相机移动
        this.uiContainer.add(this.healthBar);

        // 卡组按钮
        this.deckButton = new Button(this, {
            x: gameConfig.WIDTH - 80,
            y: gameConfig.HEIGHT - 30,
            width: 120,
            height: 40,
            text: '查看卡组',
            backgroundColor: 0x333366,
            hoverColor: 0x444477,
            borderRadius: 5,
            onClick: () => {
                console.log('查看卡组');
                this.scene.start('DeckViewScene');
            }
        });
        this.deckButton.setScrollFactor(0); // UI固定，不随相机移动
        this.uiContainer.add(this.deckButton);
    }

    /**
     * 创建地图元素
     */
    private createMapElements(): void {
        this.log('创建地图元素');

        if (!this.map) {
            console.error('MapScene: 地图对象不存在');
            return;
        }

        // 首先创建路径
        if (this.map.paths && this.map.paths.length > 0) {
            this.log(`创建 ${this.map.paths.length} 条路径`);
            for (const path of this.map.paths) {
                this.createPathGraphic(path);
            }
        } else {
            console.warn('MapScene: 地图没有路径');
        }

        // 然后创建节点
        if (this.map.nodes && this.map.nodes.length > 0) {
            this.log(`创建 ${this.map.nodes.length} 个节点`);
            for (const node of this.map.nodes) {
                this.createNodeSprite(node);
            }
        } else {
            console.warn('MapScene: 地图没有节点');
        }
    }

    /**
     * 创建节点精灵
     * @param node 节点数据
     */
    private createNodeSprite(node: MapNode): void {
        // 创建节点精灵
        const sprite = this.add.sprite(node.x, node.y, `node_${node.type}`);
        
        // 根据节点状态设置透明度
        if (node.status === NodeStatus.UNAVAILABLE) {
            sprite.setAlpha(0.5);
        } else if (node.status === NodeStatus.COMPLETED) {
            sprite.setTint(0x888888);
        }
        
        sprite.setInteractive();

        // 将节点添加到地图容器
        this.mapContainer.add(sprite);

        // 添加点击事件
        sprite.on('pointerdown', () => {
            this.onNodeClick(node);
        });

        // 添加鼠标悬停效果
        sprite.on('pointerover', () => {
            if (node.status === NodeStatus.AVAILABLE) {
                sprite.setScale(1.1);
            }
        });

        sprite.on('pointerout', () => {
            sprite.setScale(1);
        });

        // 保存精灵引用
        this.nodeSprites.set(node.id, sprite);

        // 添加节点类型标签
        const labelText = this.getNodeTypeLabel(node.type);
        const label = this.add.text(node.x, node.y + 40, labelText, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 将标签添加到地图容器
        this.mapContainer.add(label);
    }

    /**
     * 创建路径图形
     * @param path 路径数据
     */
    private createPathGraphic(path: MapPath): void {
        // 获取路径的源节点和目标节点
        const sourceNode = this.map.nodes.find(node => node.id === path.sourceId);
        const targetNode = this.map.nodes.find(node => node.id === path.targetId);

        if (!sourceNode || !targetNode) return;

        // 创建图形对象
        const graphic = this.add.graphics();

        // 将路径添加到地图容器
        this.mapContainer.add(graphic);

        // 设置线条样式
        let lineColor: number;
        switch (path.status) {
            case NodeStatus.AVAILABLE:
                lineColor = 0xFFFFFF;
                break;
            case NodeStatus.COMPLETED:
                lineColor = 0xAAAAAA;
                break;
            default:
                lineColor = 0x555555;
        }

        graphic.lineStyle(3, lineColor, 1);

        // 绘制路径线条
        graphic.beginPath();
        graphic.moveTo(sourceNode.x, sourceNode.y);

        // 替换quadraticCurveTo为直线
        graphic.lineTo(targetNode.x, targetNode.y);

        graphic.strokePath();

        // 保存图形引用
        this.pathGraphics.set(path.id, graphic);
    }

    /**
     * 节点点击事件处理
     * @param node 被点击的节点
     */
    private onNodeClick(node: MapNode): void {
        // 如果节点不可用，忽略点击
        if (node.status !== NodeStatus.AVAILABLE) {
            return;
        }

        // 移动玩家到新节点
        const success = this.mapGenerator.movePlayer(this.map, node.id);

        if (success) {
            // 更新地图状态
            this.updateMapElements();

            // 保存状态
            this.stateManager.setMap(this.map);
            this.stateManager.saveCurrentRun();

            // 根据节点类型处理场景转换
            this.handleNodeAction(node);
        }
    }

    /**
     * 更新地图元素
     */
    private updateMapElements(): void {
        // 清除现有元素
        this.clearMapElements();

        // 重新创建地图元素
        this.createMapElements();
    }

    /**
     * 清除地图元素
     */
    private clearMapElements(): void {
        // 清除节点精灵
        this.nodeSprites.forEach(sprite => {
            sprite.destroy();
        });
        this.nodeSprites.clear();

        // 清除路径图形
        this.pathGraphics.forEach(graphic => {
            graphic.destroy();
        });
        this.pathGraphics.clear();
    }

    /**
     * 根据节点类型处理场景转换
     * @param node 节点
     */
    private handleNodeAction(node: MapNode): void {
        switch (node.type) {
            case NodeType.BATTLE:
                console.log('进入战斗场景');
                this.scene.start('CombatScene', { nodeId: node.id });
                break;
            case NodeType.ELITE:
                console.log('进入精英战斗场景');
                this.scene.start('CombatScene', { nodeId: node.id, isElite: true });
                break;
            case NodeType.REST:
                console.log('进入休息场景');
                // TODO: 实现休息场景
                break;
            case NodeType.EVENT:
                console.log('进入事件场景');
                // TODO: 实现事件场景
                break;
            case NodeType.SHOP:
                console.log('进入商店场景');
                // TODO: 实现商店场景
                break;
            case NodeType.BOSS:
                console.log('进入Boss战斗场景');
                this.scene.start('CombatScene', { nodeId: node.id, isBoss: true });
                break;
        }
    }

    /**
     * 更新UI显示
     */
    private updateUI(): void {
        const runState = this.stateManager.getCurrentRun();
        if (!runState) return;

        this.floorText.setText(`第 ${runState.currentFloor} 层`);
        this.goldText.setText(`金币: ${runState.gold}`);
        this.healthBar.setMaxValue(runState.maxHp);
        this.healthBar.setValue(runState.currentHp);
    }

    /**
     * 获取节点类型标签
     * @param type 节点类型
     * @returns 标签文本
     */
    private getNodeTypeLabel(type: NodeType): string {
        switch (type) {
            case NodeType.BATTLE: return '战斗';
            case NodeType.ELITE: return '精英';
            case NodeType.REST: return '休息';
            case NodeType.EVENT: return '事件';
            case NodeType.SHOP: return '商店';
            case NodeType.BOSS: return 'Boss';
            default: return '未知';
        }
    }
}