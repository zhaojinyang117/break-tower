import Phaser from 'phaser';
import { gameConfig } from '../../core/config';
import { Button } from '../components/Button';
import { Game } from '../../core/game';
import { GameStateType } from '../../core/types';

/**
 * 设置场景
 * 用于调整游戏设置和访问开发者选项
 */
export class SettingsScene extends Phaser.Scene {
    private title!: Phaser.GameObjects.Text;
    private backButton!: Button;
    private musicVolumeText!: Phaser.GameObjects.Text;
    private musicVolumeSlider!: Phaser.GameObjects.Graphics;
    private sfxVolumeText!: Phaser.GameObjects.Text;
    private sfxVolumeSlider!: Phaser.GameObjects.Graphics;
    private musicToggle!: Button;
    private sfxToggle!: Button;
    private developerButton!: Button;
    private mainMenuButton!: Button;

    // 存储之前的场景名称，用于返回
    private previousScene: string = 'MainMenuScene';

    constructor() {
        super('SettingsScene');
    }

    /**
     * 初始化场景
     * @param data 场景数据
     */
    init(data: any): void {
        console.log('SettingsScene: 初始化场景', data);
        // 如果有传入previousScene参数，则使用它
        if (data && data.previousScene) {
            this.previousScene = data.previousScene;
        }
    }

    create(): void {
        console.log('SettingsScene: 创建设置场景');

        // 创建背景
        this.createBackground();

        // 创建标题
        this.createTitle();

        // 创建设置选项
        this.createSettings();

        // 创建返回按钮
        this.createBackButton();

        // 创建返回主界面按钮
        this.createMainMenuButton();

        // 创建开发者按钮
        this.createDeveloperButton();

        // 更新游戏状态
        Game.getInstance().setCurrentState(GameStateType.MAIN_MENU);
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
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
    }

    /**
     * 创建标题
     */
    private createTitle(): void {
        this.title = this.add.text(
            gameConfig.WIDTH / 2,
            50,
            '设置',
            {
                fontFamily: 'monospace',
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 5,
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5);
    }

    /**
     * 创建设置选项
     */
    private createSettings(): void {
        const startY = 150;
        const spacing = 60;

        // 音乐音量
        this.musicVolumeText = this.add.text(
            gameConfig.WIDTH / 2,
            startY,
            `音乐音量: ${Math.round(gameConfig.AUDIO.MUSIC_VOLUME * 100)}%`,
            {
                fontSize: '24px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // 音乐音量滑块
        this.createVolumeSlider(
            gameConfig.WIDTH / 2,
            startY + 30,
            gameConfig.AUDIO.MUSIC_VOLUME,
            (value) => {
                // 更新音乐音量
                gameConfig.AUDIO.MUSIC_VOLUME = value;
                this.musicVolumeText.setText(`音乐音量: ${Math.round(value * 100)}%`);
                // TODO: 应用音量设置
            }
        );

        // 音效音量
        this.sfxVolumeText = this.add.text(
            gameConfig.WIDTH / 2,
            startY + spacing,
            `音效音量: ${Math.round(gameConfig.AUDIO.SFX_VOLUME * 100)}%`,
            {
                fontSize: '24px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // 音效音量滑块
        this.createVolumeSlider(
            gameConfig.WIDTH / 2,
            startY + spacing + 30,
            gameConfig.AUDIO.SFX_VOLUME,
            (value) => {
                // 更新音效音量
                gameConfig.AUDIO.SFX_VOLUME = value;
                this.sfxVolumeText.setText(`音效音量: ${Math.round(value * 100)}%`);
                // TODO: 应用音量设置
            }
        );

        // 音乐开关
        this.musicToggle = new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: startY + spacing * 2,
            width: 200,
            height: 40,
            text: `音乐: ${gameConfig.AUDIO.ENABLE_MUSIC ? '开启' : '关闭'}`,
            backgroundColor: gameConfig.AUDIO.ENABLE_MUSIC ? 0x28a745 : 0x6c757d,
            hoverColor: gameConfig.AUDIO.ENABLE_MUSIC ? 0x218838 : 0x5a6268,
            borderRadius: 10,
            onClick: () => {
                // 切换音乐开关
                gameConfig.AUDIO.ENABLE_MUSIC = !gameConfig.AUDIO.ENABLE_MUSIC;
                this.musicToggle.setText(`音乐: ${gameConfig.AUDIO.ENABLE_MUSIC ? '开启' : '关闭'}`);
                this.musicToggle.setBackgroundColor(gameConfig.AUDIO.ENABLE_MUSIC ? 0x28a745 : 0x6c757d);
                this.musicToggle.setHoverColor(gameConfig.AUDIO.ENABLE_MUSIC ? 0x218838 : 0x5a6268);
                // TODO: 应用音乐设置
            }
        });

        // 音效开关
        this.sfxToggle = new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: startY + spacing * 3,
            width: 200,
            height: 40,
            text: `音效: ${gameConfig.AUDIO.ENABLE_SFX ? '开启' : '关闭'}`,
            backgroundColor: gameConfig.AUDIO.ENABLE_SFX ? 0x28a745 : 0x6c757d,
            hoverColor: gameConfig.AUDIO.ENABLE_SFX ? 0x218838 : 0x5a6268,
            borderRadius: 10,
            onClick: () => {
                // 切换音效开关
                gameConfig.AUDIO.ENABLE_SFX = !gameConfig.AUDIO.ENABLE_SFX;
                this.sfxToggle.setText(`音效: ${gameConfig.AUDIO.ENABLE_SFX ? '开启' : '关闭'}`);
                this.sfxToggle.setBackgroundColor(gameConfig.AUDIO.ENABLE_SFX ? 0x28a745 : 0x6c757d);
                this.sfxToggle.setHoverColor(gameConfig.AUDIO.ENABLE_SFX ? 0x218838 : 0x5a6268);
                // TODO: 应用音效设置
            }
        });
    }

    /**
     * 创建音量滑块
     * @param x X坐标
     * @param y Y坐标
     * @param initialValue 初始值
     * @param onChange 值变化回调
     */
    private createVolumeSlider(x: number, y: number, initialValue: number, onChange: (value: number) => void): void {
        const width = 300;
        const height = 10;
        const sliderWidth = 20;
        const sliderHeight = 20;

        // 创建滑块背景
        const background = this.add.graphics();
        background.fillStyle(0x333333, 1);
        background.fillRect(x - width / 2, y - height / 2, width, height);
        background.lineStyle(2, 0xffffff, 1);
        background.strokeRect(x - width / 2, y - height / 2, width, height);

        // 创建滑块填充
        const fill = this.add.graphics();
        fill.fillStyle(0x28a745, 1);
        fill.fillRect(x - width / 2, y - height / 2, width * initialValue, height);

        // 创建滑块手柄
        const handle = this.add.graphics();
        handle.fillStyle(0xffffff, 1);
        handle.fillRect(
            x - width / 2 + width * initialValue - sliderWidth / 2,
            y - sliderHeight / 2,
            sliderWidth,
            sliderHeight
        );

        // 使滑块可交互
        const hitArea = new Phaser.Geom.Rectangle(x - width / 2, y - sliderHeight / 2, width, sliderHeight);
        const hitAreaCallback = Phaser.Geom.Rectangle.Contains;

        background.setInteractive(hitArea, hitAreaCallback);

        // 添加拖动事件
        background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const value = Phaser.Math.Clamp((pointer.x - (x - width / 2)) / width, 0, 1);

            // 更新滑块填充
            fill.clear();
            fill.fillStyle(0x28a745, 1);
            fill.fillRect(x - width / 2, y - height / 2, width * value, height);

            // 更新滑块手柄
            handle.clear();
            handle.fillStyle(0xffffff, 1);
            handle.fillRect(
                x - width / 2 + width * value - sliderWidth / 2,
                y - sliderHeight / 2,
                sliderWidth,
                sliderHeight
            );

            // 调用回调
            onChange(value);
        });

        background.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) {
                const value = Phaser.Math.Clamp((pointer.x - (x - width / 2)) / width, 0, 1);

                // 更新滑块填充
                fill.clear();
                fill.fillStyle(0x28a745, 1);
                fill.fillRect(x - width / 2, y - height / 2, width * value, height);

                // 更新滑块手柄
                handle.clear();
                handle.fillStyle(0xffffff, 1);
                handle.fillRect(
                    x - width / 2 + width * value - sliderWidth / 2,
                    y - sliderHeight / 2,
                    sliderWidth,
                    sliderHeight
                );

                // 调用回调
                onChange(value);
            }
        });
    }

    /**
     * 创建返回按钮
     */
    private createBackButton(): void {
        this.backButton = new Button(this, {
            x: 100,
            y: 50,
            width: 120,
            height: 40,
            text: '返回',
            backgroundColor: 0x6c757d,
            hoverColor: 0x5a6268,
            borderRadius: 10,
            onClick: () => {
                console.log(`点击了返回按钮，返回到 ${this.previousScene}`);

                // 如果之前的场景是CombatScene，则恢复该场景
                if (this.previousScene === 'CombatScene') {
                    // 关闭设置场景
                    this.scene.stop();
                    // 恢复战斗场景
                    this.scene.resume('CombatScene');
                } else {
                    // 否则，直接切换到之前的场景
                    this.scene.start(this.previousScene);
                }
            }
        });
    }

    /**
     * 创建开发者按钮
     */
    private createDeveloperButton(): void {
        this.developerButton = new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: gameConfig.HEIGHT - 100,
            width: 200,
            height: 40,
            text: '开发者选项',
            backgroundColor: 0xdc3545,
            hoverColor: 0xc82333,
            borderRadius: 10,
            onClick: () => {
                console.log('点击了开发者按钮');
                this.scene.start('DeveloperScene');
            }
        });
    }

    /**
     * 创建返回主界面按钮
     */
    private createMainMenuButton(): void {
        this.mainMenuButton = new Button(this, {
            x: gameConfig.WIDTH / 2,
            y: gameConfig.HEIGHT - 160, // 位于开发者按钮上方
            width: 200,
            height: 40,
            text: '返回主界面',
            backgroundColor: 0xffc107, // 黄色
            hoverColor: 0xe0a800,
            borderRadius: 10,
            onClick: () => {
                console.log('点击了返回主界面按钮');

                // 停止所有可能的游戏场景
                if (this.previousScene === 'CombatScene') {
                    this.scene.stop('CombatScene');
                } else if (this.previousScene === 'MapScene') {
                    this.scene.stop('MapScene');
                }

                // 停止其他可能的场景
                this.scene.stop('DeckViewScene');

                // 关闭设置场景
                this.scene.stop();

                // 切换到主菜单场景
                this.scene.start('MainMenuScene');
            }
        });
    }
}