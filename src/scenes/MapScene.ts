import Phaser from 'phaser';
import { NodeType, NodeStatus, MapNode, MapPath, GameMap } from '../config/mapData';
import MapGenerator from '../generators/MapGenerator';
import RunStateManager from '../managers/RunStateManager';
import { generateNodeSvg, generatePathSvg, generateBackgroundSvg, svgToImage, generateSvgDataUrl } from '../utils/SvgGenerator';
import { gameConfig } from '../config/gameConfig';

/**
 * 地图场景
 * 显示地图节点和路径，处理用户交互
 */
export class MapScene extends Phaser.Scene {
    // 地图相关
    private map!: GameMap;
    private mapGenerator!: MapGenerator;
    private runStateManager!: RunStateManager;

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
    private hpText!: Phaser.GameObjects.Text;
    private deckButton!: Phaser.GameObjects.Container;
    private uiContainer!: Phaser.GameObjects.Container;

    // 临时SVG存储
    private svgCache: Map<string, string> = new Map();

    // 调试信息
    private debugText!: Phaser.GameObjects.Text;
    private debugMode: boolean = true;

    constructor() {
        super('MapScene');
    }

    /**
     * 预加载资源
     */
    preload(): void {
        console.log('MapScene: 开始预加载资源');

        // 生成并预加载背景SVG
        try {
            const backgroundSvgUrl = generateBackgroundSvg(gameConfig.WIDTH, gameConfig.HEIGHT, 'map');
            this.textures.addBase64('map_background', backgroundSvgUrl);
            console.log('MapScene: 添加背景纹理成功');
        } catch (err) {
            console.error('MapScene: 添加背景纹理失败', err);
        }

        // 生成节点SVG
        console.log('MapScene: 开始生成节点SVG');
        try {
            // 枚举所有节点类型和状态
            const nodeTypes = Object.values(NodeType).map(type => type.toLowerCase());
            const nodeStatuses = Object.values(NodeStatus).map(status => status.toLowerCase());

            console.log(`MapScene: 节点类型列表: ${nodeTypes.join(', ')}`);
            console.log(`MapScene: 节点状态列表: ${nodeStatuses.join(', ')}`);

            // 为每种类型和状态组合生成纹理
            for (const type of nodeTypes) {
                for (const status of nodeStatuses) {
                    try {
                        const nodeKey = `node_${type}_${status}`;
                        console.log(`MapScene: 生成节点纹理 ${nodeKey}`);

                        const nodeSvgUrl = generateNodeSvg(80, 80, type, status as any);
                        if (!nodeSvgUrl) {
                            console.error(`MapScene: ${nodeKey} 生成失败，返回空值`);
                            continue;
                        }

                        this.svgCache.set(nodeKey, nodeSvgUrl);
                        this.textures.addBase64(nodeKey, nodeSvgUrl);
                        console.log(`MapScene: 添加节点纹理成功 ${nodeKey}`);
                    } catch (error) {
                        console.error(`MapScene: 无法生成节点 ${type}_${status}:`, error);
                    }
                }
            }
            console.log('MapScene: 节点SVG生成完成');
        } catch (error) {
            console.error('MapScene: 生成节点SVG失败:', error);
        }

        console.log('MapScene: 资源预加载完成');
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
            this.runStateManager = RunStateManager.getInstance();
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
            const runState = this.runStateManager.getCurrentRun();
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
                        this.runStateManager.setMap(this.map);
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
        const uiElements = [this.floorText, this.goldText, this.hpText, this.deckButton];
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
        const restartButton = this.add.rectangle(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 + 100,
            200, 60, 0x4a6fb5
        );

        const restartText = this.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 + 100,
            '重新开始',
            { fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5);

        restartButton.setInteractive();
        restartButton.on('pointerdown', () => {
            // 重新启动 BootScene
            this.scene.start('BootScene');
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
        this.background = this.add.image(gameConfig.WIDTH / 2, gameConfig.HEIGHT / 2, 'map_background');
        this.background.setDisplaySize(gameConfig.WIDTH, gameConfig.HEIGHT);
        this.background.setScrollFactor(0); // 背景固定，不随相机移动
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

        // 生命值文本
        this.hpText = this.add.text(100, 30, '生命: 0/0', {
            fontSize: '20px',
            color: '#ff5555'
        }).setOrigin(0.5);
        this.hpText.setScrollFactor(0); // UI固定，不随相机移动
        this.uiContainer.add(this.hpText);

        // 卡组按钮
        const deckBg = this.add.rectangle(0, 0, 120, 40, 0x333366);
        const deckText = this.add.text(0, 0, '查看卡组', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.deckButton = this.add.container(gameConfig.WIDTH - 80, gameConfig.HEIGHT - 30, [deckBg, deckText]);
        this.deckButton.setSize(120, 40);
        this.deckButton.setInteractive();
        this.deckButton.setScrollFactor(0); // UI固定，不随相机移动
        this.uiContainer.add(this.deckButton);

        // 添加点击事件
        this.deckButton.on('pointerdown', () => {
            console.log('查看卡组');
            this.scene.start('DeckViewScene');
        });
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
        // 使用缓存的SVG纹理
        const textureKey = `node_${node.type}_${node.status}`;

        // 创建节点精灵
        const sprite = this.add.sprite(node.x, node.y, textureKey);
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
        const label = this.add.text(node.x, node.y + 50, labelText, {
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
            this.runStateManager.setMap(this.map);
            this.runStateManager.saveCurrentRun();

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
                this.scene.start('RestScene', { nodeId: node.id });
                break;
            case NodeType.EVENT:
                console.log('进入事件场景');
                this.scene.start('EventScene', { nodeId: node.id });
                break;
            case NodeType.SHOP:
                console.log('进入商店场景');
                this.scene.start('ShopScene', { nodeId: node.id });
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
        const runState = this.runStateManager.getCurrentRun();
        if (!runState) return;

        this.floorText.setText(`第 ${runState.currentFloor} 层`);
        this.goldText.setText(`金币: ${runState.gold}`);
        this.hpText.setText(`生命: ${runState.currentHp}/${runState.maxHp}`);
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