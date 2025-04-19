import Phaser from 'phaser';

/**
 * 按钮配置接口
 */
export interface ButtonConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
    backgroundColor?: number;
    backgroundAlpha?: number;
    hoverColor?: number;
    disabledColor?: number;
    borderColor?: number;
    borderWidth?: number;
    borderRadius?: number;
    padding?: {
        x?: number;
        y?: number;
    };
    onClick?: () => void;
}

/**
 * 按钮组件
 * 一个可交互的按钮UI组件
 */
export class Button extends Phaser.GameObjects.Container {
    /**
     * 获取按钮文本
     * @returns 按钮文本
     */
    getText(): string {
        return this.text.text;
    }
    private background: Phaser.GameObjects.Rectangle;
    private border: Phaser.GameObjects.Rectangle | null = null;
    public text: Phaser.GameObjects.Text;
    private config: ButtonConfig;
    private isHovering: boolean = false;
    private isDisabled: boolean = false;

    /**
     * 构造函数
     * @param scene 场景引用
     * @param config 按钮配置
     */
    constructor(scene: Phaser.Scene, config: ButtonConfig) {
        super(scene, config.x, config.y);
        this.config = this.getDefaultConfig(config);

        // 创建背景
        this.background = this.createBackground();
        this.add(this.background);

        // 创建边框
        if (this.config.borderWidth && this.config.borderWidth > 0) {
            this.border = this.createBorder();
            this.add(this.border);
        }

        // 创建文本
        this.text = this.createText();
        this.add(this.text);

        // 设置交互区域
        this.setSize(this.config.width, this.config.height);
        this.setInteractive({ useHandCursor: true });

        // 添加事件监听器
        this.setupEventListeners();

        // 添加到场景
        scene.add.existing(this);
    }

    /**
     * 获取默认配置
     * @param config 用户配置
     * @returns 合并后的配置
     */
    private getDefaultConfig(config: ButtonConfig): ButtonConfig {
        return {
            ...config,
            textStyle: config.textStyle || {
                fontSize: '24px',
                color: '#ffffff',
                fontFamily: 'Arial'
            },
            backgroundColor: config.backgroundColor !== undefined ? config.backgroundColor : 0x007bff,
            backgroundAlpha: config.backgroundAlpha !== undefined ? config.backgroundAlpha : 1,
            hoverColor: config.hoverColor !== undefined ? config.hoverColor : 0x0069d9,
            disabledColor: config.disabledColor !== undefined ? config.disabledColor : 0x6c757d,
            borderColor: config.borderColor !== undefined ? config.borderColor : 0xffffff,
            borderWidth: config.borderWidth !== undefined ? config.borderWidth : 0,
            borderRadius: config.borderRadius !== undefined ? config.borderRadius : 0,
            padding: {
                x: config.padding?.x !== undefined ? config.padding.x : 10,
                y: config.padding?.y !== undefined ? config.padding.y : 5
            }
        };
    }

    /**
     * 创建背景
     * @returns 背景矩形
     */
    private createBackground(): Phaser.GameObjects.Rectangle {
        const background = this.scene.add.rectangle(
            0,
            0,
            this.config.width,
            this.config.height,
            this.config.backgroundColor,
            this.config.backgroundAlpha
        );

        // Phaser 3.60+ 不再支持 setRoundedRectangle 方法
        // 如果需要圆角矩形，可以使用 Graphics 对象绘制

        return background;
    }

    /**
     * 创建边框
     * @returns 边框矩形
     */
    private createBorder(): Phaser.GameObjects.Rectangle {
        const border = this.scene.add.rectangle(
            0,
            0,
            this.config.width,
            this.config.height,
            this.config.borderColor
        );

        // Phaser 3.60+ 不再支持 setRoundedRectangle 方法
        // 如果需要圆角矩形，可以使用 Graphics 对象绘制

        border.setStrokeStyle(this.config.borderWidth || 1, this.config.borderColor || 0xffffff);
        border.setFillStyle();

        return border;
    }

    /**
     * 创建文本
     * @returns 文本对象
     */
    private createText(): Phaser.GameObjects.Text {
        return this.scene.add.text(
            0,
            0,
            this.config.text,
            this.config.textStyle
        ).setOrigin(0.5);
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        this.on('pointerover', this.onPointerOver, this);
        this.on('pointerout', this.onPointerOut, this);
        this.on('pointerdown', this.onPointerDown, this);
        this.on('pointerup', this.onPointerUp, this);
    }

    /**
     * 鼠标悬停事件处理
     */
    private onPointerOver(): void {
        if (this.isDisabled) return;

        this.isHovering = true;
        this.background.setFillStyle(this.config.hoverColor || 0x0069d9);
    }

    /**
     * 鼠标离开事件处理
     */
    private onPointerOut(): void {
        if (this.isDisabled) return;

        this.isHovering = false;
        this.background.setFillStyle(this.config.backgroundColor || 0x007bff);
    }

    /**
     * 鼠标按下事件处理
     */
    private onPointerDown(): void {
        if (this.isDisabled) return;

        this.scale = 0.95;
    }

    /**
     * 鼠标释放事件处理
     */
    private onPointerUp(): void {
        if (this.isDisabled) return;

        this.scale = 1;

        if (this.isHovering && this.config.onClick) {
            this.config.onClick();
        }
    }

    /**
     * 设置按钮文本
     * @param text 新文本
     */
    setText(text: string): this {
        this.text.setText(text);
        return this;
    }

    /**
     * 设置按钮文本样式
     * @param style 文本样式
     */
    setTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): this {
        this.text.setStyle(style);
        return this;
    }

    /**
     * 设置按钮背景颜色
     * @param color 颜色
     * @param alpha 透明度
     */
    setBackgroundColor(color: number, alpha?: number): this {
        this.config.backgroundColor = color;
        if (alpha !== undefined) {
            this.config.backgroundAlpha = alpha;
        }

        if (!this.isHovering && !this.isDisabled) {
            this.background.setFillStyle(color, this.config.backgroundAlpha);
        }

        return this;
    }

    /**
     * 设置按钮悬停颜色
     * @param color 颜色
     */
    setHoverColor(color: number): this {
        this.config.hoverColor = color;

        if (this.isHovering && !this.isDisabled) {
            this.background.setFillStyle(color);
        }

        return this;
    }

    /**
     * 设置按钮禁用状态
     * @param disabled 是否禁用
     */
    setDisabled(disabled: boolean): this {
        this.isDisabled = disabled;

        if (disabled) {
            this.background.setFillStyle(this.config.disabledColor || 0x6c757d);
            this.disableInteractive();
        } else {
            this.background.setFillStyle(this.config.backgroundColor || 0x007bff);
            this.setInteractive({ useHandCursor: true });
        }

        return this;
    }

    /**
     * 设置点击回调
     * @param callback 回调函数
     */
    setOnClick(callback: () => void): this {
        this.config.onClick = callback;
        return this;
    }
}