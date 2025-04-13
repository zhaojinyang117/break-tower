import Phaser from 'phaser';
import { gameConfig } from '../config/gameConfig';
import * as SvgGenerator from '../utils/SvgGenerator';
import RunStateManager from '../managers/RunStateManager';
import { BASE_CARDS } from '../config/cardData';

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

    preload() {
        // 创建加载进度条
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(
            gameConfig.WIDTH / 2 - 160,
            gameConfig.HEIGHT / 2 - 25,
            320,
            50
        );

        // 加载进度文本
        const loadingText = this.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2 - 50,
            '加载中...',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        const percentText = this.add.text(
            gameConfig.WIDTH / 2,
            gameConfig.HEIGHT / 2,
            '0%',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // 监听加载进度
        this.load.on('progress', (value: number) => {
            percentText.setText(parseInt((value * 100).toString()) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(
                gameConfig.WIDTH / 2 - 150,
                gameConfig.HEIGHT / 2 - 15,
                300 * value,
                30
            );
        });

        // 加载完成时清除进度条
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // 生成并加载SVG占位图形
        this.generatePlaceholderAssets();

        // 加载其他游戏资源
        // TODO: 加载实际游戏资源
    }

    create() {
        console.log('BootScene: 资源加载完成');

        // 获取运行状态管理器
        const runStateManager = RunStateManager.getInstance();
        console.log('BootScene: 获取到 RunStateManager 实例');

        // 检查是否有保存的游戏
        const hasSavedGame = runStateManager.hasSavedRun();
        console.log('BootScene: 有保存的游戏状态:', hasSavedGame);

        // 加载或创建初始运行状态
        if (hasSavedGame) {
            // 加载已保存的游戏状态
            const loadSuccess = runStateManager.loadSavedRun();
            console.log('BootScene: 加载游戏状态:', loadSuccess ? '成功' : '失败');

            if (!loadSuccess) {
                // 如果加载失败，创建新的游戏状态
                console.log('BootScene: 加载失败，创建新游戏状态');
                this.createInitialRunState(runStateManager);
            }
        } else {
            // 创建新的游戏状态
            console.log('BootScene: 没有保存的游戏状态，创建新游戏状态');
            this.createInitialRunState(runStateManager);
        }

        // 检查运行状态的完整性
        const currentRun = runStateManager.getCurrentRun();
        console.log('BootScene: 当前运行状态:', currentRun ? '已创建' : '创建失败',
            currentRun ? `玩家生命: ${currentRun.currentHp}/${currentRun.maxHp}` : '');

        // 启动地图场景
        console.log('BootScene: 启动地图场景');
        this.scene.start('MapScene');
    }

    /**
     * 创建初始运行状态
     * @param runStateManager 运行状态管理器
     */
    private createInitialRunState(runStateManager: RunStateManager): void {
        // 创建一个新的运行状态，使用默认玩家名称、生命值和基础卡组
        const newState = runStateManager.createNewRun(
            '玩家',
            gameConfig.PLAYER.STARTING_HP,
            [...BASE_CARDS.slice(0, 5)] // 从基础卡组中选择前5张卡作为初始卡组
        );
        console.log('创建新的游戏状态:', newState ? '成功' : '失败');

        // 保存创建的状态
        runStateManager.saveCurrentRun();
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
            const cardColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#a178df'];

            cardTypes.forEach((type, index) => {
                try {
                    const cardDescription = `这是一张${type}卡牌示例，可以展示${type}效果。`;
                    const cardDataUrl = SvgGenerator.generateCardSvg(
                        180,
                        250,
                        `${type}卡`,
                        `${type}卡牌`,
                        index + 1,
                        cardDescription
                    );
                    this.textures.addBase64(`card_${type}`, cardDataUrl);
                    console.log(`BootScene: 添加卡牌 ${type} 纹理成功`);
                } catch (error) {
                    console.error(`BootScene: 生成卡牌 ${type} 纹理失败:`, error);
                }
            });
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
                        const cardName = `${type.charAt(0).toUpperCase() + type.slice(1)} ${cost}`;
                        const cardDescription = `Cost ${cost}: This is a ${type} card with ${cost} energy cost.`;
                        let cardColor = '#555555';

                        switch (type) {
                            case 'attack': cardColor = '#aa3333'; break;
                            case 'defend': cardColor = '#3333aa'; break;
                            case 'skill': cardColor = '#33aa33'; break;
                            case 'power': cardColor = '#aa33aa'; break;
                        }

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