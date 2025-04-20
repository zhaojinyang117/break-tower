import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import * as SvgGenerator from '../../utils/SvgGenerator';
import { StateManager } from '../../state/StateManager';
import { BASE_CARDS } from '../../systems/card/CardData';

// SVG命名空间常量
const SVG_NS = 'http://www.w3.org/2000/svg';
// 获取DOM环境变量，用于自定义敌人SVG
const domEnvironment = {
    createElementNS: typeof document !== 'undefined'
        ? (ns: string, tag: string) => document.createElementNS(ns, tag)
        : (_ns: string, tag: string) => ({
            setAttribute: () => { },
            appendChild: () => { }
        })
};

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload(): void {
        // 创建加载进度条
        this.createLoadingBar();

        // 加载游戏设置和配置
        this.loadGameConfig();

        // 加载字体
        this.loadFonts();

        // 加载基础UI资源
        this.loadUIAssets();

        // 预加载音效
        this.loadSoundEffects();

        // 生成并加载SVG占位图形
        this.generatePlaceholderAssets();

        // 加载其他游戏资源
        // TODO: 加载实际游戏资源
    }

    async create(): Promise<void> {
        console.log('BootScene: 加载完成，准备启动游戏');

        // 创建占位资源，在没有美术资源的情况下使用
        this.createPlaceholderAssets();

        // 创建过渡动画
        this.createStartAnimation();

        // 获取状态管理器
        const stateManager = StateManager.getInstance();
        console.log('BootScene: 获取到 StateManager 实例');

        // 检查是否有保存的游戏
        await this.initializeGameState(stateManager);

        // 检查运行状态的完整性
        const currentRun = stateManager.getCurrentRun();
        console.log('BootScene: 当前运行状态:', currentRun ? '已创建' : '创建失败',
            currentRun ? `玩家生命: ${currentRun.currentHp}/${currentRun.maxHp}` : '');

        // 启动主菜单场景
        console.log('BootScene: 启动主菜单场景');
        this.scene.start('MainMenuScene');
    }

    /**
     * 创建加载进度条
     */
    private createLoadingBar(): void {
        // 创建进度条背景
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();

        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        // 创建加载文本
        const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
            font: '20px monospace',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5);

        const percentText = this.add.text(width / 2, height / 2, '0%', {
            font: '18px monospace',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5);

        const assetText = this.add.text(width / 2, height / 2 + 50, '', {
            font: '18px monospace',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // 监听加载进度
        this.load.on('progress', (value: number) => {
            percentText.setText(parseInt(String(value * 100)) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('fileprogress', (file: any) => {
            assetText.setText('加载资源: ' + file.key);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });
    }

    /**
     * 加载游戏配置
     */
    private loadGameConfig(): void {
        // 这里将来可以加载更多的游戏配置JSON文件
        // this.load.json('gameConfig', 'assets/data/gameConfig.json');
        console.log('BootScene: 游戏配置加载完成');
    }

    /**
     * 加载字体
     */
    private loadFonts(): void {
        // WebFont加载可以在这里添加
        console.log('BootScene: 字体加载完成');
    }

    /**
     * 加载UI资源
     */
    private loadUIAssets(): void {
        // 这里将来会加载UI图像
        // this.load.image('button', 'assets/ui/button.png');
        console.log('BootScene: UI资源加载完成');
    }

    /**
     * 加载音效
     */
    private loadSoundEffects(): void {
        // 这里将来会加载音效
        // this.load.audio('click', 'assets/sounds/click.mp3');
        console.log('BootScene: 音效加载完成');
    }

    /**
     * 创建占位资源
     */
    private createPlaceholderAssets(): void {
        // 创建简单的占位图形作为游戏资源
        // 这些将在有真实美术资源时被替换

        // 创建卡牌占位图
        this.createCardPlaceholders();

        // 创建角色和敌人占位图
        this.createCharacterPlaceholders();

        // 创建UI元素占位图
        this.createUIPlaceholders();

        console.log('BootScene: 创建占位资源完成');
    }

    /**
     * 创建卡牌占位图
     */
    private createCardPlaceholders(): void {
        const cardTypes = ['attack', 'defend', 'skill', 'power', 'land'];
        const graphics = this.add.graphics();

        // 为每种卡牌类型创建一个不同颜色的矩形
        cardTypes.forEach((type, index) => {
            // 清除之前的绘制
            graphics.clear();

            // 根据类型选择颜色
            let color;
            switch (type) {
                case 'attack':
                    color = 0xaa0000; // 红色攻击卡
                    break;
                case 'defend':
                    color = 0x0000aa; // 蓝色防御卡
                    break;
                case 'skill':
                    color = 0x00aa00; // 绿色技能卡
                    break;
                case 'power':
                    color = 0xaa00aa; // 紫色能力卡
                    break;
                case 'land':
                    color = 0x8B4513; // 棕色地牌
                    break;
                default:
                    color = 0xaaaaaa; // 灰色默认
            }

            // 绘制卡牌背景
            graphics.fillStyle(color, 1);
            graphics.fillRoundedRect(0, 0, 200, 280, 16);

            // 绘制卡牌边框
            graphics.lineStyle(4, 0xffffff, 1);
            graphics.strokeRoundedRect(0, 0, 200, 280, 16);

            // 绘制内部区域（用于文本）
            graphics.fillStyle(0x000000, 0.5);
            graphics.fillRoundedRect(20, 60, 160, 160, 8);

            // 添加文本区域
            graphics.fillStyle(0xffffff, 0.8);
            graphics.fillRoundedRect(20, 20, 40, 30, 8); // 费用区域
            graphics.fillRoundedRect(20, 230, 160, 30, 8); // 名称区域

            // 如果是地牌，添加特殊图案
            if (type === 'land') {
                // 绘制地牌特殊图案（简单的山形和树）
                graphics.fillStyle(0x228B22, 1); // 森林绿

                // 绘制山形
                graphics.beginPath();
                graphics.moveTo(40, 100);
                graphics.lineTo(80, 70);
                graphics.lineTo(120, 110);
                graphics.lineTo(160, 80);
                graphics.lineTo(160, 140);
                graphics.lineTo(40, 140);
                graphics.closePath();
                graphics.fillPath();

                // 绘制树
                graphics.fillStyle(0x8B4513, 1); // 棕色树干
                graphics.fillRect(70, 140, 10, 20);
                graphics.fillRect(130, 140, 10, 20);

                // 绘制树冠
                graphics.fillStyle(0x32CD32, 1); // 浅绿色树冠
                graphics.fillCircle(75, 130, 15);
                graphics.fillCircle(135, 130, 15);

                // 绘制能量符号
                graphics.fillStyle(0xFFD700, 1); // 金色能量符号
                graphics.fillCircle(100, 100, 20);

                // 添加能量文本
                const energyText = this.add.text(100, 100, '能量', {
                    fontSize: '16px',
                    color: '#000000',
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                // 将文本转换为纹理
                energyText.setVisible(false); // 隐藏文本，只用于生成纹理
            }

            // 生成贴图
            graphics.generateTexture(`card_${type}`, 200, 280);
        });

        // 销毁临时图形对象
        graphics.destroy();
    }

    /**
     * 创建角色和敌人占位图
     */
    private createCharacterPlaceholders(): void {
        const graphics = this.add.graphics();

        // 创建玩家占位图 (蓝色圆圈)
        graphics.clear();
        graphics.fillStyle(0x0088ff, 1);
        graphics.fillCircle(40, 40, 40);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeCircle(40, 40, 40);
        graphics.generateTexture('player', 80, 80);

        // 创建普通敌人占位图 (红色三角形)
        graphics.clear();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillTriangle(40, 10, 10, 70, 70, 70);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeTriangle(40, 10, 10, 70, 70, 70);
        graphics.generateTexture('enemy', 80, 80);

        // 创建精英敌人占位图 (橙色菱形)
        graphics.clear();
        graphics.fillStyle(0xff8800, 1);
        graphics.fillTriangle(40, 10, 10, 40, 40, 70);
        graphics.fillTriangle(40, 10, 40, 70, 70, 40);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeTriangle(40, 10, 10, 40, 40, 70);
        graphics.strokeTriangle(40, 10, 40, 70, 70, 40);
        graphics.generateTexture('elite_enemy', 80, 80);

        // 创建Boss占位图 (紫色五角星)
        graphics.clear();
        graphics.fillStyle(0x8800ff, 1);
        const points = [];
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? 40 : 20;
            const angle = Math.PI * 2 * (i / 10) - Math.PI / 2;
            points.push({
                x: 40 + radius * Math.cos(angle),
                y: 40 + radius * Math.sin(angle)
            });
        }
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.closePath();
        graphics.strokePath();
        graphics.generateTexture('boss_enemy', 80, 80);

        // 销毁临时图形对象
        graphics.destroy();
    }

    /**
     * 创建UI占位图
     */
    private createUIPlaceholders(): void {
        const graphics = this.add.graphics();

        // 创建按钮
        graphics.clear();
        graphics.fillStyle(0x4a6fb5, 1);
        graphics.fillRoundedRect(0, 0, 200, 50, 10);
        graphics.lineStyle(4, 0xffffff, 1);
        graphics.strokeRoundedRect(0, 0, 200, 50, 10);
        graphics.generateTexture('button', 200, 50);

        // 注意：节点占位图现在在generatePlaceholderAssets方法中生成
        // 这里不再生成节点纹理，以避免重复

        // 销毁临时图形对象
        graphics.destroy();
    }

    /**
     * 创建开始动画
     */
    private createStartAnimation(): void {
        // 创建简单的淡入淡出动画
        const startText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'BREAK TOWER',
            {
                fontFamily: 'monospace',
                fontSize: '64px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5, 0.5).setAlpha(0);

        // 淡入动画
        this.tweens.add({
            targets: startText,
            alpha: 1,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                // 淡出动画
                this.tweens.add({
                    targets: startText,
                    alpha: 0,
                    duration: 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        // 切换到主菜单场景
                        this.scene.start('MainMenuScene');
                    }
                });
            }
        });
    }

    /**
     * 初始化游戏状态
     * @param stateManager 状态管理器
     */
    private async initializeGameState(stateManager: StateManager): Promise<void> {
        try {
            // 检查是否有保存的游戏
            const hasSavedGame = await stateManager.hasSavedRun();
            console.log('BootScene: 有保存的游戏状态:', hasSavedGame);

            // 加载或创建初始运行状态
            if (hasSavedGame) {
                // 加载已保存的游戏状态
                const loadSuccess = await stateManager.loadSavedRun();
                console.log('BootScene: 加载游戏状态:', loadSuccess ? '成功' : '失败');

                if (!loadSuccess) {
                    // 如果加载失败，创建新的游戏状态
                    console.log('BootScene: 加载失败，创建新游戏状态');
                    await this.createInitialRunState(stateManager);
                }
            } else {
                // 创建新的游戏状态
                console.log('BootScene: 没有保存的游戏状态，创建新游戏状态');
                await this.createInitialRunState(stateManager);
            }
        } catch (error) {
            console.error('BootScene: 初始化游戏状态失败:', error);
            // 如果出错，创建新的游戏状态
            await this.createInitialRunState(stateManager);
        }
    }

    /**
     * 创建初始运行状态
     * @param stateManager 状态管理器
     */
    private async createInitialRunState(stateManager: StateManager): Promise<void> {
        // 创建一个新的运行状态，使用默认玩家名称、生命值和基础卡组
        const newState = stateManager.createNewRun(
            '玩家',
            gameConfig.PLAYER.STARTING_HP,
            [...BASE_CARDS.slice(0, 5)] // 从基础卡组中选择前5张卡作为初始卡组
        );
        console.log('创建新的游戏状态:', newState ? '成功' : '失败');

        // 保存创建的状态
        await stateManager.saveCurrentRun();
    }

    /**
     * 生成并加载SVG占位图形
     */
    private generatePlaceholderAssets() {
        console.log('BootScene: 开始生成占位资源');

        // 生成地图节点SVG - 使用与NodeType枚举匹配的值
        const nodeTypeIcons = {
            battle: '⚔️',
            elite: '🔱',
            boss: '👑',
            shop: '💰',
            rest: '🔥',
            event: '❓',
        };

        Object.entries(nodeTypeIcons).forEach(([type, icon]) => {
            try {
                const nodeSize = 60;
                console.log(`BootScene: 生成节点 ${type} 纹理`);
                const nodeDataUrl = SvgGenerator.generateNodeSvg(nodeSize, nodeSize, type, 'available');
                this.textures.addBase64(`node_${type}`, nodeDataUrl);
                console.log(`BootScene: 添加节点 ${type} 纹理成功`);
            } catch (error) {
                console.error(`BootScene: 生成节点 ${type} 纹理失败:`, error);
            }
        });

        // 为每种节点类型生成三种状态的纹理
        const nodeStatuses = ['available', 'unavailable', 'completed'];

        Object.entries(nodeTypeIcons).forEach(([type, _]) => {
            nodeStatuses.forEach(status => {
                if (status === 'available') return; // 已经在上面生成过了

                try {
                    const nodeSize = 60;
                    console.log(`BootScene: 生成节点 ${type}_${status} 纹理`);
                    const nodeDataUrl = SvgGenerator.generateNodeSvg(nodeSize, nodeSize, type, status as any);
                    this.textures.addBase64(`node_${type}_${status}`, nodeDataUrl);
                    console.log(`BootScene: 添加节点 ${type}_${status} 纹理成功`);
                } catch (error) {
                    console.error(`BootScene: 生成节点 ${type}_${status} 纹理失败:`, error);
                }
            });
        });

        // 生成地图路径SVG
        try {
            const pathDataUrl = SvgGenerator.generatePathSvg(100, 50, [{ x: 0, y: 25 }, { x: 100, y: 25 }]);
            this.textures.addBase64('path_simple', pathDataUrl);
            console.log('BootScene: 添加路径纹理成功');
        } catch (error) {
            console.error('BootScene: 生成路径纹理失败:', error);
        }

        // 生成角色占位SVG
        try {
            const playerDataUrl = SvgGenerator.generateCharacterSvg(200, 300, 'player');
            this.textures.addBase64('player_placeholder', playerDataUrl);

            const enemyDataUrl = SvgGenerator.generateCharacterSvg(200, 300, 'enemy');
            this.textures.addBase64('enemy_placeholder', enemyDataUrl);
            console.log('BootScene: 添加角色纹理成功');
        } catch (error) {
            console.error('BootScene: 生成角色纹理失败:', error);
        }

        // 生成卡牌占位SVG
        try {
            const cardTypes = ['攻击', '防御', '技能', '能力'];

            cardTypes.forEach((type, index) => {
                try {
                    const cardDescription = `这是一张${type}卡牌示例，可以展示${type}效果。`;
                    const cost = index + 1;

                    const cardDataUrl = SvgGenerator.generateCardSvg(
                        180,
                        250,
                        `${type}卡`,
                        `${type}卡牌`,
                        cost,
                        cardDescription
                    );
                    this.textures.addBase64(`card_${type}`, cardDataUrl);
                    console.log(`BootScene: 添加卡牌 ${type} 纹理成功`);
                } catch (error) {
                    console.error(`BootScene: 生成卡牌 ${type} 纹理失败:`, error);
                }
            });

            // 单独生成地牌纹理
            const landCardDescription = `这是一张地牌，可以提供能量。每回合只能使用一张地牌。`;
            const landCardDataUrl = SvgGenerator.generateCardSvg(
                180,
                250,
                '地牌卡',
                '地牌',
                0,
                landCardDescription
            );
            this.textures.addBase64('card_地牌', landCardDataUrl);
            console.log('BootScene: 添加地牌纹理成功');
        } catch (error) {
            console.error('BootScene: 生成卡牌纹理失败:', error);
        }

        // 生成特效占位SVG
        try {
            const effectDataUrl = SvgGenerator.generateEffectSvg(200, 200, '#ffdd59');
            this.textures.addBase64('effect_placeholder', effectDataUrl);
            console.log('BootScene: 添加特效纹理成功');
        } catch (error) {
            console.error('BootScene: 生成特效纹理失败:', error);
        }

        // === 新增：战斗场景相关资源 ===

        // 生成战斗背景SVG
        try {
            const combatBackgroundUrl = SvgGenerator.generateBackgroundSvg(gameConfig.WIDTH, gameConfig.HEIGHT, 'combat');
            this.textures.addBase64('background_combat', combatBackgroundUrl);
            console.log('BootScene: 添加战斗背景纹理成功');
        } catch (error) {
            console.error('BootScene: 生成战斗背景纹理失败:', error);
        }

        // 生成不同类型的敌人SVG
        try {
            // 普通敌人
            const normalEnemyDataUrl = SvgGenerator.generateCharacterSvg(200, 300, 'enemy');
            this.textures.addBase64('enemy_normal_1', normalEnemyDataUrl);

            // 精英敌人（红色调）
            const eliteEnemyUrl = this.generateCustomEnemySvg(200, 300, '#aa3333', '#dd5555');
            this.textures.addBase64('enemy_elite_1', eliteEnemyUrl);

            // Boss敌人（紫色调）
            const bossEnemyUrl = this.generateCustomEnemySvg(240, 360, '#662266', '#993399');
            this.textures.addBase64('enemy_boss_1', bossEnemyUrl);

            console.log('BootScene: 添加不同类型敌人纹理成功');
        } catch (error) {
            console.error('BootScene: 生成敌人纹理失败:', error);
        }

        // 生成攻击效果SVG
        try {
            // 攻击效果（红色）
            const attackEffectUrl = SvgGenerator.generateEffectSvg(150, 150, '#ff3333');
            this.textures.addBase64('effect_attack', attackEffectUrl);

            // 防御效果（蓝色）
            const defenseEffectUrl = SvgGenerator.generateEffectSvg(150, 150, '#3333ff');
            this.textures.addBase64('effect_defense', defenseEffectUrl);

            // 增益效果（绿色）
            const buffEffectUrl = SvgGenerator.generateEffectSvg(150, 150, '#33ff33');
            this.textures.addBase64('effect_buff', buffEffectUrl);

            // 减益效果（紫色）
            const debuffEffectUrl = SvgGenerator.generateEffectSvg(150, 150, '#aa33aa');
            this.textures.addBase64('effect_debuff', debuffEffectUrl);

            console.log('BootScene: 添加战斗效果纹理成功');
        } catch (error) {
            console.error('BootScene: 生成战斗效果纹理失败:', error);
        }

        // 生成更多卡牌SVG（不同能量消耗）
        try {
            const cardTypes = ['attack', 'defend', 'skill', 'power'];
            const costValues = [0, 1, 2, 3];

            cardTypes.forEach(type => {
                costValues.forEach(cost => {
                    try {
                        let cardName = `${type.charAt(0).toUpperCase() + type.slice(1)} ${cost}`;
                        let cardDescription = `Cost ${cost}: This is a ${type} card with ${cost} energy cost.`;

                        const cardDataUrl = SvgGenerator.generateCardSvg(
                            180,
                            250,
                            type,
                            cardName,
                            cost,
                            cardDescription
                        );

                        this.textures.addBase64(`card_${type}_${cost}`, cardDataUrl);
                        console.log(`BootScene: 添加卡牌 ${type}_${cost} 纹理成功`);
                    } catch (error) {
                        console.error(`BootScene: 生成卡牌 ${type}_${cost} 纹理失败:`, error);
                    }
                });
            });

            // 单独生成地牌纹理
            const landCardDataUrl = SvgGenerator.generateCardSvg(
                180,
                250,
                'land',
                'Land',
                0,
                'This is a land card that provides energy. You can only use one land card per turn.'
            );
            this.textures.addBase64('card_land_0', landCardDataUrl);
            console.log('BootScene: 添加地牌纹理成功');
        } catch (error) {
            console.error('BootScene: 生成扩展卡牌纹理失败:', error);
        }

        console.log('BootScene: 占位资源生成完成');
    }

    /**
     * 生成自定义敌人SVG（用于创建不同类型的敌人）
     * @param width 宽度
     * @param height 高度
     * @param bodyColor 身体颜色
     * @param headColor 头部颜色
     * @returns SVG数据URL
     */
    private generateCustomEnemySvg(width: number, height: number, bodyColor: string, headColor: string): string {
        return SvgGenerator.generateSvgDataUrl(width, height, (svg: any) => {
            // 敌人身体
            const body = domEnvironment.createElementNS(SVG_NS, 'rect');
            body.setAttribute('x', (width * 0.2).toString());
            body.setAttribute('y', (height * 0.2).toString());
            body.setAttribute('width', (width * 0.6).toString());
            body.setAttribute('height', (height * 0.6).toString());
            body.setAttribute('rx', '10');
            body.setAttribute('ry', '10');
            body.setAttribute('fill', bodyColor);
            svg.appendChild(body as any);

            // 敌人头部
            const head = domEnvironment.createElementNS(SVG_NS, 'circle');
            head.setAttribute('cx', (width / 2).toString());
            head.setAttribute('cy', (height * 0.25).toString());
            head.setAttribute('r', (height * 0.15).toString());
            head.setAttribute('fill', headColor);
            svg.appendChild(head as any);

            // 添加眼睛
            const leftEye = domEnvironment.createElementNS(SVG_NS, 'circle');
            leftEye.setAttribute('cx', (width * 0.4).toString());
            leftEye.setAttribute('cy', (height * 0.22).toString());
            leftEye.setAttribute('r', (height * 0.03).toString());
            leftEye.setAttribute('fill', '#000000');
            svg.appendChild(leftEye as any);

            const rightEye = domEnvironment.createElementNS(SVG_NS, 'circle');
            rightEye.setAttribute('cx', (width * 0.6).toString());
            rightEye.setAttribute('cy', (height * 0.22).toString());
            rightEye.setAttribute('r', (height * 0.03).toString());
            rightEye.setAttribute('fill', '#000000');
            svg.appendChild(rightEye as any);

            // 添加嘴巴
            const mouth = domEnvironment.createElementNS(SVG_NS, 'path');
            mouth.setAttribute('d', `M ${width * 0.4} ${height * 0.3} Q ${width / 2} ${height * 0.35}, ${width * 0.6} ${height * 0.3}`);
            mouth.setAttribute('stroke', '#000000');
            mouth.setAttribute('stroke-width', '3');
            mouth.setAttribute('fill', 'none');
            svg.appendChild(mouth as any);
        });
    }
}