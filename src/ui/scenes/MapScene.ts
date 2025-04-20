import Phaser from 'phaser';
import { NodeType, NodeStatus, GameStateType } from '../../core/types';
import { MapNode, MapPath, GameMap, MapLevel } from '../../systems/map/MapData';
import { MapGenerator } from '../../systems/map/MapGenerator';
import { StateManager } from '../../state/StateManager';
import { Button } from '../components/Button';
import { HealthBar } from '../components/HealthBar';
import { Game } from '../../core/game';
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
    private background!: Phaser.GameObjects.Graphics;

    // 地图容器
    private mapContainer!: Phaser.GameObjects.Container;

    // 相机控制
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private lastCameraX: number = 0;
    private lastCameraY: number = 0;
    private minCameraX: number = 0;
    private maxCameraX: number = 0;
    private minCameraY: number = 0;
    private maxCameraY: number = 0;

    // UI元素
    private floorText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private healthBar!: HealthBar;
    private deckButton!: Button;
    private settingsButton!: Button;
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
        console.log('MapScene: 传入的数据:', data);
        this.log('开始创建场景');

        // 检查纹理缓存中是否存在节点纹理
        console.log('MapScene: 检查纹理缓存');
        const nodeTypes = ['battle', 'elite', 'rest', 'event', 'shop', 'boss'];
        nodeTypes.forEach(type => {
            const textureName = `node_${type}`;
            const exists = this.textures.exists(textureName);
            console.log(`MapScene: 纹理 ${textureName} ${exists ? '存在' : '不存在'}`);
        });

        // 列出所有可用的纹理
        console.log('MapScene: 所有可用的纹理:');
        const textureKeys = this.textures.getTextureKeys();
        console.log(textureKeys);

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

            // 初始化容器，按照从下到上的顺序创建

            // 1. 首先创建背景，设置最低层
            this.createBackground();
            this.log('创建背景完成');

            // 2. 创建地图容器，设置中间层
            this.mapContainer = this.add.container(0, 0);
            this.mapContainer.setDepth(10); // 确保地图元素在背景之上，UI之下
            console.log('MapScene: 创建地图容器，深度设置为10');

            // 3. 创建UI容器，设置最上层
            this.uiContainer = this.add.container(0, 0);
            this.uiContainer.setDepth(100); // 确保UI在最上层

            this.createUI();
            this.log('创建UI完成');

            // 从运行状态获取地图，或创建新地图
            const runState = this.stateManager.getCurrentRun();
            this.log(`当前运行状态: ${runState ? '存在' : '不存在'}`);
            console.log('MapScene: 当前运行状态:', runState);

            // 检查运行状态的详细信息
            if (runState) {
                console.log('MapScene: 运行状态详情:');
                console.log(`- ID: ${runState.id}`);
                console.log(`- 玩家名称: ${runState.playerName}`);
                console.log(`- 生命值: ${runState.currentHp}/${runState.maxHp}`);
                console.log(`- 金币: ${runState.gold}`);
                console.log(`- 卡组数量: ${runState.deck.length}`);
                console.log(`- 地图: ${runState.map ? '存在' : '不存在'}`);

                if (runState.map) {
                    console.log(`- 地图 ID: ${runState.map.id}`);
                    console.log(`- 地图节点数量: ${runState.map.nodes ? runState.map.nodes.length : 0}`);
                    console.log(`- 地图路径数量: ${runState.map.paths ? runState.map.paths.length : 0}`);
                    console.log(`- 玩家位置: ${runState.map.playerPosition}`);
                }
            }

            if (runState) {
                if (runState.map) {
                    this.log('从运行状态获取地图');
                    console.log('MapScene: 从运行状态获取地图:', runState.map);
                    this.map = runState.map;

                    // 检查地图数据的完整性
                    if (!this.map.nodes || this.map.nodes.length === 0 || !this.map.paths) {
                        console.error('MapScene: 地图数据不完整:', this.map);
                        this.log('地图数据不完整，尝试创建新地图');

                        // 尝试创建新地图
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
                    } else {
                        this.log(`地图节点数量: ${this.map.nodes.length}, 路径数量: ${this.map.paths.length}`);
                    }
                } else {
                    this.log('创建新地图');
                    console.log('MapScene: 创建新地图');
                    try {
                        this.map = this.mapGenerator.generateMap();
                        this.log(`新地图生成完成，节点数量: ${this.map.nodes.length}, 路径数量: ${this.map.paths.length}`);
                        console.log('MapScene: 新地图生成完成:', this.map);
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
            console.warn('MapScene: 地图或节点不存在，无法设置相机边界');
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

        console.log(`MapScene: 地图边界 - minX: ${minX}, maxX: ${maxX}, minY: ${minY}, maxY: ${maxY}`);

        // 添加边距，增加边距以确保节点不会贴近屏幕边缘
        const margin = 300; // 增加边距，使地图元素不会贴近屏幕边缘
        minX -= margin;
        maxX += margin;
        minY -= margin;
        maxY += margin;

        // 计算地图的宽度和高度
        const worldWidth = maxX - minX;
        const worldHeight = maxY - minY;

        // 计算缩放比例，使地图适应屏幕
        // 我们希望地图能够以适当的缩放比例显示，使玩家可以看到一部分地图，但仍需要拖动才能看到全部
        const minScale = 0.5; // 最小缩放比例，不要太小，否则地图元素会太小
        const maxScale = 0.8; // 最大缩放比例，确保地图不会完全适应屏幕
        const scaleX = gameConfig.WIDTH / worldWidth;
        const scaleY = gameConfig.HEIGHT / worldHeight;
        let scale = Math.min(scaleX, scaleY);

        // 强制缩放比例在指定范围内
        scale = Math.max(scale, minScale); // 确保缩放比例不会太小
        scale = Math.min(scale, maxScale); // 确保缩放比例不会太大，这样玩家需要拖动地图

        console.log(`MapScene: 计算的缩放比例 - ${scale}`);

        // 设置相机的最小/最大移动范围
        // 确保相机能够在地图范围内移动
        this.minCameraX = minX;
        this.maxCameraX = maxX - (gameConfig.WIDTH / scale / 2); // 减去半个屏幕宽度，确保相机不会移出地图
        this.minCameraY = minY;
        this.maxCameraY = maxY - (gameConfig.HEIGHT / scale / 2); // 减去半个屏幕高度，确保相机不会移出地图

        // 确保最大值始终大于最小值
        if (this.maxCameraX <= this.minCameraX) {
            this.maxCameraX = this.minCameraX + 1; // 至少有一个像素的差距
        }
        if (this.maxCameraY <= this.minCameraY) {
            this.maxCameraY = this.minCameraY + 1; // 至少有一个像素的差距
        }

        console.log(`MapScene: 相机边界 - minX: ${this.minCameraX}, maxX: ${this.maxCameraX}, minY: ${this.minCameraY}, maxY: ${this.maxCameraY}`);

        // 设置相机的边界矩形，确保相机可以看到所有地图元素
        this.cameras.main.setBounds(minX, minY, worldWidth, worldHeight);
        console.log(`MapScene: 设置相机边界矩形 - x: ${minX}, y: ${minY}, width: ${worldWidth}, height: ${worldHeight}`);

        // 设置相机缩放比例
        this.cameras.main.setZoom(scale);
        console.log(`MapScene: 设置相机缩放比例 - ${scale}`);

        // 初始位置：显示第一层，稍微偏移，这样玩家需要拖动地图
        const firstLevelNodes = this.map.nodes.filter(node => node.level === 0);
        if (firstLevelNodes.length > 0) {
            // 计算第一层节点的平均X和Y位置
            const avgX = firstLevelNodes.reduce((sum, node) => sum + node.x, 0) / firstLevelNodes.length;
            const avgY = firstLevelNodes.reduce((sum, node) => sum + node.y, 0) / firstLevelNodes.length;

            // 设置相机位置，使第一层节点可见，但稍微偏移
            // 小幅度偏移相机位置，使玩家需要拖动地图才能看到所有节点
            const offsetX = worldWidth * 0.05; // 水平偏移5%
            const offsetY = worldHeight * 0.05; // 垂直偏移5%
            this.cameras.main.centerOn(avgX + offsetX, avgY + offsetY);
            console.log(`MapScene: 设置相机初始位置 - centerOn(${avgX + offsetX}, ${avgY + offsetY})`);
        } else {
            console.warn('MapScene: 没有第一层节点，无法设置相机初始位置');
        }
    }

    /**
     * 设置相机拖动控制
     */
    private setupCameraControls(): void {
        console.log('MapScene: 设置相机拖动控制');

        // 监听鼠标/触摸按下事件
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // 只有在非UI区域才启用拖动
            if (!this.isPointerOverUI(pointer)) {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
                this.lastCameraX = this.cameras.main.scrollX;
                this.lastCameraY = this.cameras.main.scrollY;

                // 改变鼠标样式为拖动样式
                this.input.setDefaultCursor('grabbing');

                console.log(`MapScene: 开始拖动 - 起始点: (${this.dragStartX}, ${this.dragStartY}), 相机位置: (${this.lastCameraX}, ${this.lastCameraY})`);
            }
        });

        // 监听鼠标/触摸移动事件
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging) {
                // 计算鼠标移动距离
                const deltaX = this.dragStartX - pointer.x;
                const deltaY = this.dragStartY - pointer.y;

                // 计算新的相机位置，考虑缩放比例
                const zoom = this.cameras.main.zoom;
                const newScrollX = this.lastCameraX + (deltaX / zoom);
                const newScrollY = this.lastCameraY + (deltaY / zoom);

                // 应用相机边界限制
                // 使用scrollTo而不是直接设置scrollX和scrollY，这样可以避免一些渲染问题
                const clampedX = Phaser.Math.Clamp(newScrollX, this.minCameraX, this.maxCameraX);
                const clampedY = Phaser.Math.Clamp(newScrollY, this.minCameraY, this.maxCameraY);
                this.cameras.main.setScroll(clampedX, clampedY);

                // 如果移动距离超过一定阈值，更新调试信息
                if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
                    console.log(`MapScene: 拖动中 - 移动距离: (${deltaX}, ${deltaY}), 新相机位置: (${this.cameras.main.scrollX}, ${this.cameras.main.scrollY})`);
                    // 重置起始点，使移动更平滑
                    this.dragStartX = pointer.x;
                    this.dragStartY = pointer.y;
                    this.lastCameraX = this.cameras.main.scrollX;
                    this.lastCameraY = this.cameras.main.scrollY;
                }
            } else if (!this.isPointerOverUI(pointer)) {
                // 当鼠标悬停在地图上但没有拖动时，显示拖动样式
                this.input.setDefaultCursor('grab');
            } else {
                // 当鼠标悬停在UI上时，显示默认样式
                this.input.setDefaultCursor('default');
            }
        });

        // 监听鼠标/触摸释放事件
        this.input.on('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                // 恢复默认鼠标样式
                this.input.setDefaultCursor('default');
                console.log(`MapScene: 结束拖动 - 相机最终位置: (${this.cameras.main.scrollX}, ${this.cameras.main.scrollY})`);
            }
        });

        // 监听鼠标/触摸离开画布事件
        this.input.on('pointerout', () => {
            if (this.isDragging) {
                this.isDragging = false;
                // 恢复默认鼠标样式
                this.input.setDefaultCursor('default');
                console.log(`MapScene: 鼠标离开画布，结束拖动 - 相机最终位置: (${this.cameras.main.scrollX}, ${this.cameras.main.scrollY})`);
            }
        });

        // 添加鼠标滚轮缩放功能
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
            // 只有在非UI区域才启用缩放
            if (!this.isPointerOverUI(pointer)) {
                // 计算新的缩放比例
                const minZoom = 0.5; // 最小缩放比例
                const maxZoom = 1.5; // 最大缩放比例
                const zoomChange = deltaY > 0 ? -0.1 : 0.1; // 缩放步长
                let newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomChange, minZoom, maxZoom);

                // 获取鼠标位置对应的世界坐标
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

                // 设置新的缩放比例，并保持鼠标位置不变
                this.cameras.main.zoom = newZoom;

                // 调整相机位置，使鼠标位置对应的世界坐标保持不变
                const newWorldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.cameras.main.scrollX += worldPoint.x - newWorldPoint.x;
                this.cameras.main.scrollY += worldPoint.y - newWorldPoint.y;

                // 应用相机边界限制
                // 使用setScroll而不是直接设置scrollX和scrollY
                const clampedX = Phaser.Math.Clamp(this.cameras.main.scrollX, this.minCameraX, this.maxCameraX);
                const clampedY = Phaser.Math.Clamp(this.cameras.main.scrollY, this.minCameraY, this.maxCameraY);
                this.cameras.main.setScroll(clampedX, clampedY);

                console.log(`MapScene: 缩放比例变更为 ${newZoom.toFixed(2)}`);
            }
        });
    }

    /**
     * 检查指针是否在UI元素上
     */
    private isPointerOverUI(pointer: Phaser.Input.Pointer): boolean {
        // 检查点击位置是否在UI容器内的元素上
        const uiElements = [this.floorText, this.goldText, this.healthBar, this.deckButton, this.settingsButton];
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
        this.log('无运行状态，可能是初始化失败或者数据丢失');

        // 尝试获取更多信息
        try {
            const hasSavedRun = this.stateManager.hasCurrentRun();
            console.log('MapScene: 当前是否有运行状态:', hasSavedRun);
            this.log(`当前是否有运行状态: ${hasSavedRun ? '是' : '否'}`);
        } catch (error) {
            console.error('MapScene: 检查运行状态失败:', error);
            this.log(`检查运行状态失败: ${(error as Error).message}`);
        }

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
                console.log('MapScene: 点击了重新开始按钮');
                this.log('点击了重新开始按钮，返回主菜单');
                // 返回主菜单而不是重新启动BootScene
                this.scene.start('MainMenuScene');
            }
        });

        // 将按钮添加到UI容器中
        this.uiContainer.add(restartButton);
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

        // 创建背景容器，并设置深度为最低层
        const backgroundContainer = this.add.container(0, 0);
        backgroundContainer.setDepth(-10);

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

        // 将背景添加到背景容器
        backgroundContainer.add(background);

        // 背景容器固定，不随相机移动
        backgroundContainer.setScrollFactor(0);

        // 保存背景引用
        this.background = background;

        console.log('MapScene: 背景创建完成，深度设置为-10');
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

        // 设置按钮
        this.settingsButton = new Button(this, {
            x: 50,
            y: gameConfig.HEIGHT - 30,
            width: 40,
            height: 40,
            text: '⚙️', // 齿轮图标
            backgroundColor: 0x6c757d,
            hoverColor: 0x5a6268,
            borderRadius: 20, // 圆形按钮
            onClick: () => {
                console.log('点击了设置按钮');
                // 暂停当前场景并启动设置场景
                this.scene.launch('SettingsScene', { previousScene: 'MapScene' });
                this.scene.pause();
            }
        });
        this.settingsButton.setScrollFactor(0); // UI固定，不随相机移动
        this.uiContainer.add(this.settingsButton);
    }

    /**
     * 创建地图元素
     */
    private createMapElements(): void {
        this.log('创建地图元素');
        console.log('MapScene: 开始创建地图元素');

        if (!this.map) {
            console.error('MapScene: 地图对象不存在');
            this.showError('地图对象不存在，无法创建地图元素');
            return;
        }

        console.log('MapScene: 地图对象信息:');
        console.log(`- ID: ${this.map.id}`);
        console.log(`- 节点数量: ${this.map.nodes ? this.map.nodes.length : 0}`);
        console.log(`- 路径数量: ${this.map.paths ? this.map.paths.length : 0}`);
        console.log(`- 玩家位置: ${this.map.playerPosition}`);
        console.log(`- 当前层级: ${this.map.currentLevel}`);

        // 首先创建路径
        if (this.map.paths && this.map.paths.length > 0) {
            this.log(`创建 ${this.map.paths.length} 条路径`);
            console.log(`MapScene: 开始创建 ${this.map.paths.length} 条路径`);

            try {
                for (const path of this.map.paths) {
                    this.createPathGraphic(path);
                }
                console.log('MapScene: 路径创建完成');
            } catch (error) {
                console.error('MapScene: 创建路径时出错:', error);
                this.log(`创建路径时出错: ${(error as Error).message}`);
            }
        } else {
            console.warn('MapScene: 地图没有路径');
            this.log('地图没有路径');
        }

        // 然后创建节点
        if (this.map.nodes && this.map.nodes.length > 0) {
            this.log(`创建 ${this.map.nodes.length} 个节点`);
            console.log(`MapScene: 开始创建 ${this.map.nodes.length} 个节点`);

            try {
                for (const node of this.map.nodes) {
                    this.createNodeSprite(node);
                }
                console.log('MapScene: 节点创建完成');
            } catch (error) {
                console.error('MapScene: 创建节点时出错:', error);
                this.log(`创建节点时出错: ${(error as Error).message}`);
            }
        } else {
            console.warn('MapScene: 地图没有节点');
            this.log('地图没有节点');
        }

        console.log('MapScene: 地图元素创建完成');
    }

    /**
     * 创建节点精灵
     * @param node 节点数据
     */
    private createNodeSprite(node: MapNode): void {
        // 输出节点信息
        console.log(`MapScene: 创建节点精灵 - ID: ${node.id}, 类型: ${node.type}, 状态: ${node.status}, 坐标: (${node.x}, ${node.y})`);

        // 根据节点状态生成纹理名称
        let textureName = `node_${node.type.toLowerCase()}`;

        // 检查纹理是否存在
        if (!this.textures.exists(textureName)) {
            console.warn(`MapScene: 纹理 ${textureName} 不存在，尝试使用备用纹理`);
            // 尝试使用备用纹理
            textureName = 'node_battle';

            // 如果备用纹理也不存在，尝试创建一个简单的矩形代替
            if (!this.textures.exists(textureName)) {
                console.error(`MapScene: 备用纹理 ${textureName} 也不存在，创建简单矩形代替`);

                // 创建一个简单的矩形作为节点
                const nodeGraphics = this.add.graphics();
                nodeGraphics.fillStyle(0xff0000, 1); // 红色矩形，以便于识别
                nodeGraphics.fillRect(node.x - 30, node.y - 30, 60, 60);
                nodeGraphics.lineStyle(2, 0xffffff, 1);
                nodeGraphics.strokeRect(node.x - 30, node.y - 30, 60, 60);

                // 将图形添加到地图容器
                this.mapContainer.add(nodeGraphics);

                // 添加节点类型标签
                const labelText = this.getNodeTypeLabel(node.type);
                const label = this.add.text(node.x, node.y, labelText, {
                    fontSize: '16px',
                    color: '#ffffff'
                }).setOrigin(0.5);

                // 将标签添加到地图容器
                this.mapContainer.add(label);

                // 添加调试信息
                const debugInfo = this.add.text(node.x, node.y + 20, `ID: ${node.id}`, {
                    fontSize: '12px',
                    color: '#ffff00'
                }).setOrigin(0.5);

                // 将调试信息添加到地图容器
                this.mapContainer.add(debugInfo);

                return;
            }
        }

        // 创建节点精灵
        console.log(`MapScene: 使用纹理 ${textureName} 创建节点精灵`);
        const sprite = this.add.sprite(node.x, node.y, textureName);

        // 添加调试边框，以便于识别节点精灵的边界
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(2, 0xff0000, 1);
        borderGraphics.strokeRect(node.x - 30, node.y - 30, 60, 60);
        this.mapContainer.add(borderGraphics);

        // 根据节点状态设置透明度
        if (node.status === NodeStatus.UNAVAILABLE) {
            sprite.setAlpha(0.5);
            console.log(`MapScene: 节点 ${node.id} 设置为不可用状态，透明度为0.5`);
        } else if (node.status === NodeStatus.COMPLETED) {
            sprite.setTint(0x888888);
            console.log(`MapScene: 节点 ${node.id} 设置为已完成状态，色调为灰色`);
        } else {
            console.log(`MapScene: 节点 ${node.id} 设置为可用状态`);
        }

        sprite.setInteractive();

        // 将节点添加到地图容器
        this.mapContainer.add(sprite);
        console.log(`MapScene: 节点精灵已添加到地图容器，容器子元素数量: ${this.mapContainer.length}`);

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
        console.log(`MapScene: 点击节点 ${node.id}, 类型: ${node.type}, 状态: ${node.status}, 层级: ${node.level}`);

        // 如果节点不可用，忽略点击
        if (node.status !== NodeStatus.AVAILABLE) {
            console.log(`MapScene: 节点 ${node.id} 不可用，忽略点击`);
            return;
        }

        // 特殊处理：如果是起始层节点且玩家位置为空
        if (node.level === 0 && !this.map.playerPosition) { // 0对应MapLevel.START
            console.log(`MapScene: 选择起始节点 ${node.id}`);

            // 直接设置玩家位置为该节点
            this.map.playerPosition = node.id;
            node.status = NodeStatus.COMPLETED;

            // 重置所有起始节点状态
            const startNodes = this.map.nodes.filter(n => n.level === 0 && n.id !== node.id); // 0对应MapLevel.START
            for (const startNode of startNodes) {
                startNode.status = NodeStatus.UNAVAILABLE;
            }

            // 更新节点状态
            // 直接调用更新节点状态的逻辑，而不是使用mapGenerator的方法
            // 获取所有起始层节点的连接节点
            const playerNode = this.map.nodes.find(n => n.id === this.map.playerPosition);
            if (playerNode) {
                // 找到当前节点连接的所有节点
                for (const connectionId of playerNode.connections) {
                    const connectedNode = this.map.nodes.find(n => n.id === connectionId);
                    if (connectedNode) {
                        // 设置节点为可用
                        connectedNode.status = NodeStatus.AVAILABLE;

                        // 设置路径为可用
                        const path = this.map.paths.find(p => p.sourceId === playerNode.id && p.targetId === connectionId);
                        if (path) {
                            path.status = NodeStatus.AVAILABLE;
                        }
                    }
                }
            }

            // 更新地图状态
            this.updateMapElements();

            // 保存状态
            this.stateManager.setMap(this.map);
            this.stateManager.saveCurrentRun();

            console.log(`MapScene: 起始节点 ${node.id} 选择完成，更新地图状态`);
            return;
        }

        // 移动玩家到新节点
        console.log(`MapScene: 尝试移动玩家到节点 ${node.id}`);
        const success = this.mapGenerator.movePlayer(this.map, node.id);

        if (success) {
            console.log(`MapScene: 移动玩家到节点 ${node.id} 成功`);

            // 更新地图状态
            this.updateMapElements();

            // 保存状态
            this.stateManager.setMap(this.map);
            this.stateManager.saveCurrentRun();

            // 根据节点类型处理场景转换
            this.handleNodeAction(node);
        } else {
            console.log(`MapScene: 移动玩家到节点 ${node.id} 失败`);
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