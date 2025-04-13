import Phaser from 'phaser';
import { NodeType, NodeStatus, MapNode, MapPath, GameMap } from '../config/mapData';
import MapGenerator from '../generators/MapGenerator';
import RunStateManager from '../managers/RunStateManager';
import { generateNodeSvg, generatePathSvg, generateBackgroundSvg, svgToImage } from '../utils/SvgGenerator';
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

    // UI元素
    private floorText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private hpText!: Phaser.GameObjects.Text;
    private deckButton!: Phaser.GameObjects.Container;

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

        // 金币文本
        this.goldText = this.add.text(gameConfig.WIDTH - 100, 30, '金币: 0', {
            fontSize: '20px',
            color: '#ffff00'
        }).setOrigin(0.5);

        // 生命值文本
        this.hpText = this.add.text(100, 30, '生命: 0/0', {
            fontSize: '20px',
            color: '#ff5555'
        }).setOrigin(0.5);

        // 卡组按钮
        const deckBg = this.add.rectangle(0, 0, 120, 40, 0x333366);
        const deckText = this.add.text(0, 0, '查看卡组', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.deckButton = this.add.container(gameConfig.WIDTH - 80, gameConfig.HEIGHT - 30, [deckBg, deckText]);
        this.deckButton.setSize(120, 40);
        this.deckButton.setInteractive();

        // 添加点击事件
        this.deckButton.on('pointerdown', () => {
            console.log('查看卡组');
            // TODO: 跳转到卡组查看场景
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