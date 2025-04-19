import Phaser from 'phaser';

/**
 * 生命条配置接口
 */
export interface HealthBarConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    maxValue: number;
    currentValue: number;
    backgroundColor?: number;
    barColor?: number;
    borderColor?: number;
    borderWidth?: number;
    borderRadius?: number;
    showText?: boolean;
    textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
    animationDuration?: number;
}

/**
 * 生命条组件
 * 显示生命值或其他资源的UI组件
 */
export class HealthBar extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private bar: Phaser.GameObjects.Rectangle;
    private border: Phaser.GameObjects.Rectangle | null = null;
    private text: Phaser.GameObjects.Text | null = null;
    private config: HealthBarConfig;
    private targetWidth: number;

    /**
     * 构造函数
     * @param scene 场景引用
     * @param config 生命条配置
     */
    constructor(scene: Phaser.Scene, config: HealthBarConfig) {
        super(scene, config.x, config.y);
        this.config = this.getDefaultConfig(config);

        // 计算初始宽度
        this.targetWidth = this.calculateBarWidth(this.config.currentValue);

        // 创建背景
        this.background = this.createBackground();
        this.add(this.background);

        // 创建生命条
        this.bar = this.createBar();
        this.add(this.bar);

        // 创建边框
        if (this.config.borderWidth && this.config.borderWidth > 0) {
            this.border = this.createBorder();
            this.add(this.border);
        }

        // 创建文本
        if (this.config.showText) {
            this.text = this.createText();
            this.add(this.text);
        }

        // 添加到场景
        scene.add.existing(this);
    }

    /**
     * 获取默认配置
     * @param config 用户配置
     * @returns 合并后的配置
     */
    private getDefaultConfig(config: HealthBarConfig): HealthBarConfig {
        return {
            ...config,
            backgroundColor: config.backgroundColor !== undefined ? config.backgroundColor : 0x000000,
            barColor: config.barColor !== undefined ? config.barColor : 0xff0000,
            borderColor: config.borderColor !== undefined ? config.borderColor : 0xffffff,
            borderWidth: config.borderWidth !== undefined ? config.borderWidth : 2,
            borderRadius: config.borderRadius !== undefined ? config.borderRadius : 0,
            showText: config.showText !== undefined ? config.showText : true,
            textStyle: config.textStyle || {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Arial'
            },
            animationDuration: config.animationDuration !== undefined ? config.animationDuration : 200
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
            this.config.backgroundColor
        );

        // Phaser 3.60+ 不再支持 setRoundedRectangle 方法
        // 如果需要圆角矩形，可以使用 Graphics 对象绘制

        return background;
    }

    /**
     * 创建生命条
     * @returns 生命条矩形
     */
    private createBar(): Phaser.GameObjects.Rectangle {
        const bar = this.scene.add.rectangle(
            -this.config.width / 2 + this.targetWidth / 2,
            0,
            this.targetWidth,
            this.config.height,
            this.config.barColor
        );

        // Phaser 3.60+ 不再支持 setRoundedRectangle 方法
        // 如果需要圆角矩形，可以使用 Graphics 对象绘制

        return bar;
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

        border.setStrokeStyle(this.config.borderWidth || 2, this.config.borderColor || 0xffffff);
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
            `${this.config.currentValue}/${this.config.maxValue}`,
            this.config.textStyle
        ).setOrigin(0.5);
    }

    /**
     * 计算生命条宽度
     * @param value 当前值
     * @returns 生命条宽度
     */
    private calculateBarWidth(value: number): number {
        const ratio = Math.max(0, Math.min(1, value / this.config.maxValue));
        return this.config.width * ratio;
    }

    /**
     * 更新生命值
     * @param value 新的生命值
     * @param animate 是否使用动画
     */
    setValue(value: number, animate: boolean = true): this {
        // 更新配置
        this.config.currentValue = Math.max(0, Math.min(this.config.maxValue, value));

        // 计算新宽度
        const newWidth = this.calculateBarWidth(this.config.currentValue);

        // 更新文本
        if (this.text) {
            this.text.setText(`${this.config.currentValue}/${this.config.maxValue}`);
        }

        // 更新生命条
        if (animate && (this.config.animationDuration || 0) > 0) {
            // 使用动画
            this.scene.tweens.add({
                targets: this.bar,
                width: newWidth,
                x: -this.config.width / 2 + newWidth / 2,
                duration: this.config.animationDuration,
                ease: 'Power2'
            });
        } else {
            // 直接设置
            this.bar.width = newWidth;
            this.bar.x = -this.config.width / 2 + newWidth / 2;
        }

        return this;
    }

    /**
     * 设置最大生命值
     * @param maxValue 新的最大生命值
     */
    setMaxValue(maxValue: number): this {
        this.config.maxValue = maxValue;

        // 确保当前值不超过最大值
        if (this.config.currentValue > maxValue) {
            this.config.currentValue = maxValue;
        }

        // 更新生命条
        this.setValue(this.config.currentValue, false);

        return this;
    }

    /**
     * 设置生命条颜色
     * @param color 颜色
     */
    setBarColor(color: number): this {
        this.config.barColor = color;
        this.bar.setFillStyle(color);
        return this;
    }

    /**
     * 设置背景颜色
     * @param color 颜色
     */
    setBackgroundColor(color: number): this {
        this.config.backgroundColor = color;
        this.background.setFillStyle(color);
        return this;
    }

    /**
     * 设置边框颜色
     * @param color 颜色
     */
    setBorderColor(color: number): this {
        this.config.borderColor = color;
        if (this.border) {
            this.border.setStrokeStyle(this.config.borderWidth || 2, color);
        }
        return this;
    }

    /**
     * 设置文本样式
     * @param style 文本样式
     */
    setTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): this {
        this.config.textStyle = style;
        if (this.text) {
            this.text.setStyle(style);
        }
        return this;
    }

    /**
     * 显示或隐藏文本
     * @param show 是否显示
     */
    showText(show: boolean): this {
        this.config.showText = show;
        if (this.text) {
            this.text.setVisible(show);
        } else if (show) {
            this.text = this.createText();
            this.add(this.text);
        }
        return this;
    }
}