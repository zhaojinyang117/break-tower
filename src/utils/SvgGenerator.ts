/**
 * SVG图形生成器
 * 生成各种游戏中需要的SVG占位图形
 */

// SVG命名空间
const SVG_NS = 'http://www.w3.org/2000/svg';

// 定义MockSVGElement类型
class MockSVGElement {
    private attributes: Map<string, string> = new Map();
    private children: MockSVGElement[] = [];
    _textContent: string = '';
    _tagName: string;

    constructor(tagName: string) {
        this._tagName = tagName;
    }

    setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
    }

    getAttribute(name: string): string | null {
        return this.attributes.get(name) || null;
    }

    appendChild(child: MockSVGElement) {
        this.children.push(child);
    }

    set textContent(value: string) {
        this._textContent = value;
    }

    get textContent(): string {
        return this._textContent;
    }

    toString(): string {
        let attrsString = '';
        this.attributes.forEach((value, name) => {
            attrsString += ` ${name}="${value}"`;
        });

        if (this._tagName === 'svg') {
            attrsString += ` xmlns="${SVG_NS}"`;
        }

        let childrenString = '';
        if (this.children.length > 0) {
            childrenString = this.children.map(child => child.toString()).join('');
        }

        const textContent = this._textContent ? this._textContent : '';

        return `<${this._tagName}${attrsString}>${childrenString}${textContent}</${this._tagName}>`;
    }
}

// 检查环境并提供模拟DOM的功能
function createDOMEnvironment() {
    if (typeof document !== 'undefined') {
        // 浏览器环境，直接返回document
        return {
            createElementNS: (ns: string, tag: string) => document.createElementNS(ns, tag),
            XMLSerializer: XMLSerializer,
            btoa: (str: string) => {
                // 修复btoa无法处理Unicode字符的问题
                return window.btoa(unescape(encodeURIComponent(str)));
            }
        };
    } else {
        // Node.js环境，创建简单的模拟对象
        console.log('检测到Node.js环境，使用模拟DOM');

        // 简单的XMLSerializer模拟
        class MockXMLSerializer {
            serializeToString(svg: MockSVGElement): string {
                return svg.toString();
            }
        }

        // 简单的btoa模拟
        function mockBtoa(str: string): string {
            // 在Node.js中使用Buffer进行Base64编码
            // 添加对Unicode字符的支持
            str = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
                return String.fromCharCode(parseInt(p1, 16));
            });
            return Buffer.from(str).toString('base64');
        }

        return {
            createElementNS: (_ns: string, tag: string) => new MockSVGElement(tag),
            XMLSerializer: MockXMLSerializer,
            btoa: mockBtoa
        };
    }
}

// 获取DOM环境
const domEnvironment = createDOMEnvironment();

// 类型声明，用于解决类型不匹配问题
interface MockSVGElement {
    setAttribute(name: string, value: string): void;
    getAttribute(name: string): string | null;
    appendChild(child: MockSVGElement): void;
    textContent: string;
    toString(): string;
}

type SVGElementType = Element | MockSVGElement;

/**
 * 生成SVG元素并转换为base64数据URL
 * @param width SVG宽度
 * @param height SVG高度
 * @param content SVG内容生成函数
 * @returns SVG的base64数据URL
 */
export function generateSvgDataUrl(width: number, height: number, content: (svg: SVGElementType) => void): string {
    try {
        // 创建SVG元素
        const svg = domEnvironment.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // 生成内容
        content(svg);

        // 转换为SVG字符串
        let svgString = '';
        if (typeof document !== 'undefined') {
            // 浏览器环境
            const serializer = new XMLSerializer();
            svgString = serializer.serializeToString(svg as Node);
        } else {
            // Node.js环境，使用模拟实现
            const serializer = new domEnvironment.XMLSerializer();
            svgString = serializer.serializeToString(svg as any);
        }

        // 转换为base64
        let base64 = '';
        try {
            base64 = domEnvironment.btoa(svgString);
        } catch (error) {
            console.error('转换SVG为base64时出错:', error);
            // 移除Emoji和其他可能导致编码问题的字符
            const cleanedSvgString = svgString.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '?');
            base64 = domEnvironment.btoa(cleanedSvgString);
        }

        // 返回数据URL
        return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
        console.error('生成SVG数据URL时出错:', error);

        // 提供一个简单的备用SVG，避免完全失败
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzY2NiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4/PC90ZXh0Pjwvc3ZnPg==';
    }
}

/**
 * 生成地图节点SVG
 * @param width 节点宽度
 * @param height 节点高度
 * @param type 节点类型
 * @param status 节点状态
 * @returns SVG数据URL
 */
export function generateNodeSvg(width: number, height: number, type: string, status: 'available' | 'unavailable' | 'completed' = 'available'): string {
    // 输出调试信息
    console.log(`生成节点SVG: 类型=${type}, 状态=${status}, 尺寸=${width}x${height}`);

    // 转换为小写以匹配不同大小写的类型
    const nodeType = type.toLowerCase();

    return generateSvgDataUrl(width, height, (svg: SVGElementType) => {
        // 节点背景
        const background = domEnvironment.createElementNS(SVG_NS, 'rect');
        background.setAttribute('width', width.toString());
        background.setAttribute('height', height.toString());
        background.setAttribute('rx', '10');
        background.setAttribute('ry', '10');

        // 根据节点类型和状态设置不同的颜色
        let fillColor = '#666666';
        switch (nodeType) {
            case 'battle':
                fillColor = status === 'available' ? '#FF5555' : (status === 'completed' ? '#AA3333' : '#552222');
                break;
            case 'elite':
                fillColor = status === 'available' ? '#FF3333' : (status === 'completed' ? '#CC0000' : '#660000');
                break;
            case 'rest':
                fillColor = status === 'available' ? '#55FF55' : (status === 'completed' ? '#33AA33' : '#225522');
                break;
            case 'event':
                fillColor = status === 'available' ? '#5555FF' : (status === 'completed' ? '#3333AA' : '#222255');
                break;
            case 'shop':
                fillColor = status === 'available' ? '#FFFF55' : (status === 'completed' ? '#AAAA33' : '#555522');
                break;
            case 'boss':
                fillColor = status === 'available' ? '#FF55FF' : (status === 'completed' ? '#AA33AA' : '#552255');
                break;
            default:
                console.warn(`未知节点类型: ${nodeType}，使用默认颜色`);
                break;
        }

        console.log(`节点 ${nodeType} 使用颜色: ${fillColor}`);
        background.setAttribute('fill', fillColor);
        svg.appendChild(background as any);

        // 添加节点图标
        const icon = domEnvironment.createElementNS(SVG_NS, 'text');
        icon.setAttribute('x', (width / 2).toString());
        icon.setAttribute('y', (height / 2 + 10).toString());
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('font-family', 'Arial');
        icon.setAttribute('font-size', '24');
        icon.setAttribute('fill', 'white');

        // 根据节点类型设置不同的图标
        let iconText = '?';
        switch (nodeType) {
            case 'battle': iconText = '⚔️'; break;
            case 'elite': iconText = '🔱'; break;
            case 'rest': iconText = '🔥'; break;
            case 'event': iconText = '❓'; break;
            case 'shop': iconText = '💰'; break;
            case 'boss': iconText = '👑'; break;
            default:
                console.warn(`未知节点类型: ${nodeType}，使用默认图标`);
                break;
        }

        console.log(`节点 ${nodeType} 使用图标: ${iconText}`);
        icon.textContent = iconText;
        svg.appendChild(icon as any);
    });
}

// 添加别名以保持兼容性
export const generateMapNodeSvg = generateNodeSvg;

/**
 * 生成地图路径SVG
 * @param width 路径宽度
 * @param height 路径高度
 * @param points 路径点
 * @param status 路径状态
 * @returns SVG数据URL
 */
export function generatePathSvg(width: number, height: number, points: { x: number, y: number }[], status: 'available' | 'unavailable' | 'completed' = 'available'): string {
    return generateSvgDataUrl(width, height, (svg: SVGElementType) => {
        if (points.length < 2) return;

        // 生成路径
        const path = domEnvironment.createElementNS(SVG_NS, 'path');
        let pathData = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i].x} ${points[i].y}`;
        }

        path.setAttribute('d', pathData);
        path.setAttribute('stroke', status === 'available' ? '#FFFFFF' : (status === 'completed' ? '#AAAAAA' : '#555555'));
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');

        svg.appendChild(path as any);
    });
}

/**
 * 生成卡牌SVG
 * @param width 卡牌宽度
 * @param height 卡牌高度
 * @param type 卡牌类型
 * @param name 卡牌名称
 * @param cost 卡牌消耗
 * @param description 卡牌描述
 * @returns SVG数据URL
 */
export function generateCardSvg(width: number, height: number, type: string, name: string, cost: number, description: string): string {
    return generateSvgDataUrl(width, height, (svg: SVGElementType) => {
        // 卡牌背景
        const background = domEnvironment.createElementNS(SVG_NS, 'rect');
        background.setAttribute('width', width.toString());
        background.setAttribute('height', height.toString());
        background.setAttribute('rx', '10');
        background.setAttribute('ry', '10');

        // 根据卡牌类型设置不同的颜色
        let fillColor = '#555555';
        switch (type) {
            case 'attack': fillColor = '#AA3333'; break;
            case 'skill': fillColor = '#3333AA'; break;
            case 'power': fillColor = '#AA33AA'; break;
            case 'status': fillColor = '#666666'; break;
            case 'curse': fillColor = '#333333'; break;
        }

        background.setAttribute('fill', fillColor);
        svg.appendChild(background as any);

        // 卡牌边框
        const border = domEnvironment.createElementNS(SVG_NS, 'rect');
        border.setAttribute('x', '5');
        border.setAttribute('y', '5');
        border.setAttribute('width', (width - 10).toString());
        border.setAttribute('height', (height - 10).toString());
        border.setAttribute('rx', '7');
        border.setAttribute('ry', '7');
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', '#AAAAAA');
        border.setAttribute('stroke-width', '2');
        svg.appendChild(border as any);

        // 卡牌名称
        const nameText = domEnvironment.createElementNS(SVG_NS, 'text');
        nameText.setAttribute('x', (width / 2).toString());
        nameText.setAttribute('y', '30');
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('font-family', 'Arial');
        nameText.setAttribute('font-size', '16');
        nameText.setAttribute('fill', 'white');
        nameText.textContent = name;
        svg.appendChild(nameText as any);

        // 卡牌消耗
        const costCircle = domEnvironment.createElementNS(SVG_NS, 'circle');
        costCircle.setAttribute('cx', '20');
        costCircle.setAttribute('cy', '20');
        costCircle.setAttribute('r', '15');
        costCircle.setAttribute('fill', '#333399');
        svg.appendChild(costCircle as any);

        const costText = domEnvironment.createElementNS(SVG_NS, 'text');
        costText.setAttribute('x', '20');
        costText.setAttribute('y', '25');
        costText.setAttribute('text-anchor', 'middle');
        costText.setAttribute('font-family', 'Arial');
        costText.setAttribute('font-size', '16');
        costText.setAttribute('fill', 'white');
        costText.textContent = cost.toString();
        svg.appendChild(costText as any);

        // 卡牌描述
        const descText = domEnvironment.createElementNS(SVG_NS, 'text');
        descText.setAttribute('x', (width / 2).toString());
        descText.setAttribute('y', (height / 2 + 20).toString());
        descText.setAttribute('text-anchor', 'middle');
        descText.setAttribute('font-family', 'Arial');
        descText.setAttribute('font-size', '12');
        descText.setAttribute('fill', 'white');

        // 描述文本可能很长，需要拆分为多行
        const words = description.split(' ');
        let line = '';
        let lineHeight = 15;
        let y = height / 2 + 20;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            if (testLine.length * 6 > width - 20) {
                const lineText = domEnvironment.createElementNS(SVG_NS, 'text');
                lineText.setAttribute('x', (width / 2).toString());
                lineText.setAttribute('y', y.toString());
                lineText.setAttribute('text-anchor', 'middle');
                lineText.setAttribute('font-family', 'Arial');
                lineText.setAttribute('font-size', '12');
                lineText.setAttribute('fill', 'white');
                lineText.textContent = line;
                svg.appendChild(lineText as any);

                line = words[i] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }

        const lineText = domEnvironment.createElementNS(SVG_NS, 'text');
        lineText.setAttribute('x', (width / 2).toString());
        lineText.setAttribute('y', y.toString());
        lineText.setAttribute('text-anchor', 'middle');
        lineText.setAttribute('font-family', 'Arial');
        lineText.setAttribute('font-size', '12');
        lineText.setAttribute('fill', 'white');
        lineText.textContent = line;
        svg.appendChild(lineText as any);
    });
}

/**
 * 生成角色SVG
 * @param width 宽度
 * @param height 高度
 * @param type 角色类型
 * @param color 可选的自定义颜色
 * @returns SVG数据URL
 */
export function generateCharacterSvg(width: number, height: number, type: 'player' | 'enemy', color?: string): string {
    return generateSvgDataUrl(width, height, (svg: SVGElementType) => {
        // 角色轮廓
        const body = domEnvironment.createElementNS(SVG_NS, 'rect');
        body.setAttribute('x', (width * 0.2).toString());
        body.setAttribute('y', (height * 0.2).toString());
        body.setAttribute('width', (width * 0.6).toString());
        body.setAttribute('height', (height * 0.6).toString());
        body.setAttribute('rx', '10');
        body.setAttribute('ry', '10');

        // 如果提供了自定义颜色，则使用它，否则使用默认颜色
        const bodyColor = color || (type === 'player' ? '#3355AA' : '#AA3333');
        body.setAttribute('fill', bodyColor);
        svg.appendChild(body as any);

        // 头部
        const head = domEnvironment.createElementNS(SVG_NS, 'circle');
        head.setAttribute('cx', (width / 2).toString());
        head.setAttribute('cy', (height * 0.25).toString());
        head.setAttribute('r', (height * 0.15).toString());

        // 头部颜色比身体颜色稍亮
        let headColor = color;
        if (!headColor) {
            headColor = type === 'player' ? '#5577CC' : '#CC5555';
        } else {
            // 尝试使颜色变亮
            try {
                // 简单的颜色调整
                if (headColor.startsWith('#')) {
                    headColor = '#' + headColor.substring(1).split('').map(c => {
                        const val = parseInt(c, 16);
                        return Math.min(15, val + 2).toString(16);
                    }).join('');
                }
            } catch (e) {
                console.warn('颜色调整失败，使用原始颜色');
                headColor = color || (type === 'player' ? '#5577CC' : '#CC5555'); // 确保有默认值
            }
        }

        // 确保headColor不是undefined
        const finalHeadColor = headColor || (type === 'player' ? '#5577CC' : '#CC5555');
        head.setAttribute('fill', finalHeadColor);
        svg.appendChild(head as any);

        // 武器（仅玩家）
        if (type === 'player') {
            const weapon = domEnvironment.createElementNS(SVG_NS, 'rect');
            weapon.setAttribute('x', (width * 0.8).toString());
            weapon.setAttribute('y', (height * 0.3).toString());
            weapon.setAttribute('width', (width * 0.1).toString());
            weapon.setAttribute('height', (height * 0.4).toString());
            weapon.setAttribute('fill', '#AAAAAA');
            svg.appendChild(weapon as any);
        }

        // 目标标记（仅敌人）
        if (type === 'enemy') {
            const target = domEnvironment.createElementNS(SVG_NS, 'circle');
            target.setAttribute('cx', (width * 0.8).toString());
            target.setAttribute('cy', (height * 0.2).toString());
            target.setAttribute('r', (height * 0.1).toString());
            target.setAttribute('fill', 'none');
            target.setAttribute('stroke', '#FFFF00');
            target.setAttribute('stroke-width', '3');
            svg.appendChild(target as any);

            const targetInner = domEnvironment.createElementNS(SVG_NS, 'circle');
            targetInner.setAttribute('cx', (width * 0.8).toString());
            targetInner.setAttribute('cy', (height * 0.2).toString());
            targetInner.setAttribute('r', (height * 0.03).toString());
            targetInner.setAttribute('fill', '#FFFF00');
            svg.appendChild(targetInner as any);
        }
    });
}

/**
 * 生成背景SVG
 * @param width 宽度
 * @param height 高度
 * @param type 背景类型
 * @returns SVG数据URL
 */
export function generateBackgroundSvg(width: number, height: number, type: 'combat' | 'map' | 'rest' | 'event' | 'shop'): string {
    return generateSvgDataUrl(width, height, (svg: SVGElementType) => {
        // 背景矩形
        const background = domEnvironment.createElementNS(SVG_NS, 'rect');
        background.setAttribute('width', width.toString());
        background.setAttribute('height', height.toString());

        // 根据类型设置背景颜色
        let fillColor = '#222222';
        switch (type) {
            case 'combat': fillColor = '#331111'; break;
            case 'map': fillColor = '#111133'; break;
            case 'rest': fillColor = '#113311'; break;
            case 'event': fillColor = '#332211'; break;
            case 'shop': fillColor = '#113322'; break;
        }

        background.setAttribute('fill', fillColor);
        svg.appendChild(background as any);

        // 添加一些随机图形作为背景装饰
        const count = 10;
        for (let i = 0; i < count; i++) {
            const shape = domEnvironment.createElementNS(SVG_NS, 'circle');
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 20 + 5;

            shape.setAttribute('cx', x.toString());
            shape.setAttribute('cy', y.toString());
            shape.setAttribute('r', size.toString());
            shape.setAttribute('fill', `rgba(255, 255, 255, ${Math.random() * 0.1})`);

            svg.appendChild(shape as any);
        }
    });
}

/**
 * 生成特效SVG
 * @param width 特效宽度
 * @param height 特效高度
 * @param color 特效颜色
 * @returns SVG数据URL
 */
export function generateEffectSvg(width: number, height: number, color: string): string {
    return generateSvgDataUrl(width, height, (svg: SVGElementType) => {
        // 创建放射性渐变
        const defs = domEnvironment.createElementNS(SVG_NS, 'defs');
        svg.appendChild(defs as any);

        const radialGradient = domEnvironment.createElementNS(SVG_NS, 'radialGradient');
        radialGradient.setAttribute('id', 'effectGradient');
        radialGradient.setAttribute('cx', '50%');
        radialGradient.setAttribute('cy', '50%');
        radialGradient.setAttribute('r', '50%');
        defs.appendChild(radialGradient as any);

        const stop1 = domEnvironment.createElementNS(SVG_NS, 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', color);
        radialGradient.appendChild(stop1 as any);

        const stop2 = domEnvironment.createElementNS(SVG_NS, 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'transparent');
        radialGradient.appendChild(stop2 as any);

        // 创建特效圆形
        const circle = domEnvironment.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', (width / 2).toString());
        circle.setAttribute('cy', (height / 2).toString());
        circle.setAttribute('r', (Math.min(width, height) / 2).toString());
        circle.setAttribute('fill', 'url(#effectGradient)');
        svg.appendChild(circle as any);

        // 添加一些粒子效果
        for (let i = 0; i < 15; i++) {
            const particle = domEnvironment.createElementNS(SVG_NS, 'circle');
            const size = Math.random() * 10 + 5;
            const distance = Math.random() * (Math.min(width, height) / 2 - size);
            const angle = Math.random() * Math.PI * 2;
            const x = width / 2 + Math.cos(angle) * distance;
            const y = height / 2 + Math.sin(angle) * distance;

            particle.setAttribute('cx', x.toString());
            particle.setAttribute('cy', y.toString());
            particle.setAttribute('r', size.toString());
            particle.setAttribute('fill', color);
            particle.setAttribute('opacity', (Math.random() * 0.5 + 0.5).toString());
            svg.appendChild(particle as any);
        }
    });
}

/**
 * 使用SVG生成图像对象
 * @param svgUrl SVG数据URL
 * @returns Promise<HTMLImageElement>
 */
export function svgToImage(svgUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = svgUrl;
        } catch (error) {
            console.error('SVG转图像时出错:', error);
            reject(error);
        }
    });
} 