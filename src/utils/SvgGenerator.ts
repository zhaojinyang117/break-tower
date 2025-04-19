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
        // 节点外发光效果（仅适用于可用节点）
        if (status === 'available') {
            const glow = domEnvironment.createElementNS(SVG_NS, 'filter');
            glow.setAttribute('id', 'glow');
            const feGaussianBlur = domEnvironment.createElementNS(SVG_NS, 'feGaussianBlur');
            feGaussianBlur.setAttribute('stdDeviation', '3');
            feGaussianBlur.setAttribute('result', 'blur');
            glow.appendChild(feGaussianBlur as any);

            const feColorMatrix = domEnvironment.createElementNS(SVG_NS, 'feColorMatrix');
            feColorMatrix.setAttribute('in', 'blur');
            feColorMatrix.setAttribute('mode', 'matrix');
            feColorMatrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7');
            feColorMatrix.setAttribute('result', 'glow');
            glow.appendChild(feColorMatrix as any);

            const feMerge = domEnvironment.createElementNS(SVG_NS, 'feMerge');
            const feMergeNode1 = domEnvironment.createElementNS(SVG_NS, 'feMergeNode');
            feMergeNode1.setAttribute('in', 'glow');
            const feMergeNode2 = domEnvironment.createElementNS(SVG_NS, 'feMergeNode');
            feMergeNode2.setAttribute('in', 'SourceGraphic');
            feMerge.appendChild(feMergeNode1 as any);
            feMerge.appendChild(feMergeNode2 as any);
            glow.appendChild(feMerge as any);

            svg.appendChild(glow as any);
        }

        // 添加渐变定义
        const defs = domEnvironment.createElementNS(SVG_NS, 'defs');

        // 创建基于节点类型的渐变
        const gradient = domEnvironment.createElementNS(SVG_NS, 'linearGradient');
        gradient.setAttribute('id', `gradient-${nodeType}`);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');

        // 根据节点类型和状态设置不同的颜色
        let baseColor = '#666666';
        let lightColor = '#999999';
        let darkColor = '#333333';
        let borderColor = '#ffffff';

        switch (nodeType) {
            case 'battle':
                baseColor = status === 'available' ? '#FF5555' : (status === 'completed' ? '#AA3333' : '#552222');
                lightColor = status === 'available' ? '#FF7777' : (status === 'completed' ? '#CC5555' : '#773333');
                darkColor = status === 'available' ? '#CC3333' : (status === 'completed' ? '#882222' : '#331111');
                borderColor = '#FF9999';
                break;
            case 'elite':
                baseColor = status === 'available' ? '#FF3333' : (status === 'completed' ? '#CC0000' : '#660000');
                lightColor = status === 'available' ? '#FF6666' : (status === 'completed' ? '#FF3333' : '#990000');
                darkColor = status === 'available' ? '#CC0000' : (status === 'completed' ? '#990000' : '#330000');
                borderColor = '#FFAAAA';
                break;
            case 'rest':
                baseColor = status === 'available' ? '#55FF55' : (status === 'completed' ? '#33AA33' : '#225522');
                lightColor = status === 'available' ? '#88FF88' : (status === 'completed' ? '#66CC66' : '#447744');
                darkColor = status === 'available' ? '#22CC22' : (status === 'completed' ? '#118811' : '#113311');
                borderColor = '#AAFFAA';
                break;
            case 'event':
                baseColor = status === 'available' ? '#5555FF' : (status === 'completed' ? '#3333AA' : '#222255');
                lightColor = status === 'available' ? '#8888FF' : (status === 'completed' ? '#6666CC' : '#444477');
                darkColor = status === 'available' ? '#2222CC' : (status === 'completed' ? '#111188' : '#111133');
                borderColor = '#AAAAFF';
                break;
            case 'shop':
                baseColor = status === 'available' ? '#FFFF55' : (status === 'completed' ? '#AAAA33' : '#555522');
                lightColor = status === 'available' ? '#FFFF88' : (status === 'completed' ? '#CCCC66' : '#777744');
                darkColor = status === 'available' ? '#CCCC22' : (status === 'completed' ? '#888811' : '#333311');
                borderColor = '#FFFFAA';
                break;
            case 'boss':
                baseColor = status === 'available' ? '#FF55FF' : (status === 'completed' ? '#AA33AA' : '#552255');
                lightColor = status === 'available' ? '#FF88FF' : (status === 'completed' ? '#CC66CC' : '#774477');
                darkColor = status === 'available' ? '#CC22CC' : (status === 'completed' ? '#881188' : '#331133');
                borderColor = '#FFAAFF';
                break;
            default:
                console.warn(`未知节点类型: ${nodeType}，使用默认颜色`);
                break;
        }

        // 添加渐变色停止点
        const stop1 = domEnvironment.createElementNS(SVG_NS, 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', lightColor);

        const stop2 = domEnvironment.createElementNS(SVG_NS, 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', darkColor);

        gradient.appendChild(stop1 as any);
        gradient.appendChild(stop2 as any);
        defs.appendChild(gradient as any);
        svg.appendChild(defs as any);

        // 节点背景 - 圆角矩形
        const background = domEnvironment.createElementNS(SVG_NS, 'rect');
        background.setAttribute('width', width.toString());
        background.setAttribute('height', height.toString());
        background.setAttribute('rx', '15');
        background.setAttribute('ry', '15');
        background.setAttribute('fill', `url(#gradient-${nodeType})`);

        // 如果节点可用，添加发光效果
        if (status === 'available') {
            background.setAttribute('filter', 'url(#glow)');
        }

        svg.appendChild(background as any);

        // 添加节点边框
        const border = domEnvironment.createElementNS(SVG_NS, 'rect');
        border.setAttribute('width', (width - 4).toString());
        border.setAttribute('height', (height - 4).toString());
        border.setAttribute('x', '2');
        border.setAttribute('y', '2');
        border.setAttribute('rx', '13');
        border.setAttribute('ry', '13');
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', borderColor);
        border.setAttribute('stroke-width', status === 'available' ? '2' : '1');
        border.setAttribute('stroke-opacity', status === 'available' ? '0.8' : '0.4');
        svg.appendChild(border as any);

        // 添加节点图标
        const iconContainer = domEnvironment.createElementNS(SVG_NS, 'circle');
        iconContainer.setAttribute('cx', (width / 2).toString());
        iconContainer.setAttribute('cy', (height / 2 - 5).toString());
        iconContainer.setAttribute('r', '20');
        iconContainer.setAttribute('fill', baseColor);
        iconContainer.setAttribute('stroke', '#ffffff');
        iconContainer.setAttribute('stroke-width', '2');
        iconContainer.setAttribute('stroke-opacity', status === 'available' ? '0.9' : '0.5');
        svg.appendChild(iconContainer as any);

        // 添加图标内容
        const icon = domEnvironment.createElementNS(SVG_NS, 'text');
        icon.setAttribute('x', (width / 2).toString());
        icon.setAttribute('y', (height / 2).toString());
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('font-family', 'Arial');
        icon.setAttribute('font-size', '24');
        icon.setAttribute('fill', 'white');
        icon.setAttribute('dy', '5');

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
 * @param width 背景宽度
 * @param height 背景高度
 * @param type 背景类型
 * @returns SVG数据URL
 */
export function generateBackgroundSvg(width: number, height: number, type: 'combat' | 'map' | 'rest' | 'event' | 'shop'): string {
    return generateSvgDataUrl(width, height, (svg: SVGElementType) => {
        // 添加渐变定义
        const defs = domEnvironment.createElementNS(SVG_NS, 'defs');

        // 主背景渐变
        const bgGradient = domEnvironment.createElementNS(SVG_NS, 'linearGradient');
        bgGradient.setAttribute('id', 'bgGradient');
        bgGradient.setAttribute('x1', '0%');
        bgGradient.setAttribute('y1', '0%');
        bgGradient.setAttribute('x2', '0%');
        bgGradient.setAttribute('y2', '100%');

        // 根据场景类型设置不同的背景颜色
        let gradientColor1 = '#000000';
        let gradientColor2 = '#222222';
        let patternColor = '#333333';

        switch (type) {
            case 'combat':
                gradientColor1 = '#220000';
                gradientColor2 = '#440000';
                patternColor = '#550000';
                break;
            case 'map':
                gradientColor1 = '#001122';
                gradientColor2 = '#002244';
                patternColor = '#003366';
                break;
            case 'rest':
                gradientColor1 = '#002200';
                gradientColor2 = '#004400';
                patternColor = '#005500';
                break;
            case 'event':
                gradientColor1 = '#110022';
                gradientColor2 = '#220044';
                patternColor = '#330066';
                break;
            case 'shop':
                gradientColor1 = '#222200';
                gradientColor2 = '#444400';
                patternColor = '#666600';
                break;
        }

        // 添加渐变色停止点
        const stop1 = domEnvironment.createElementNS(SVG_NS, 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', gradientColor1);

        const stop2 = domEnvironment.createElementNS(SVG_NS, 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', gradientColor2);

        bgGradient.appendChild(stop1 as any);
        bgGradient.appendChild(stop2 as any);
        defs.appendChild(bgGradient as any);

        // 创建网格图案
        const pattern = domEnvironment.createElementNS(SVG_NS, 'pattern');
        pattern.setAttribute('id', 'grid');
        pattern.setAttribute('width', '40');
        pattern.setAttribute('height', '40');
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');

        // 网格线
        const gridLine1 = domEnvironment.createElementNS(SVG_NS, 'path');
        gridLine1.setAttribute('d', 'M 40 0 L 0 0 0 40');
        gridLine1.setAttribute('fill', 'none');
        gridLine1.setAttribute('stroke', patternColor);
        gridLine1.setAttribute('stroke-width', '1');

        pattern.appendChild(gridLine1 as any);
        defs.appendChild(pattern as any);

        svg.appendChild(defs as any);

        // 主背景矩形
        const background = domEnvironment.createElementNS(SVG_NS, 'rect');
        background.setAttribute('width', width.toString());
        background.setAttribute('height', height.toString());
        background.setAttribute('fill', 'url(#bgGradient)');
        svg.appendChild(background as any);

        // 网格覆盖层
        const gridOverlay = domEnvironment.createElementNS(SVG_NS, 'rect');
        gridOverlay.setAttribute('width', width.toString());
        gridOverlay.setAttribute('height', height.toString());
        gridOverlay.setAttribute('fill', 'url(#grid)');
        gridOverlay.setAttribute('fill-opacity', '0.3');
        svg.appendChild(gridOverlay as any);

        // 如果是地图场景，添加一些装饰元素
        if (type === 'map') {
            // 添加一些随机小圆点（表示星星或远处的光点）
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const radius = Math.random() * 2 + 1;
                const opacity = Math.random() * 0.5 + 0.2;

                const star = domEnvironment.createElementNS(SVG_NS, 'circle');
                star.setAttribute('cx', x.toString());
                star.setAttribute('cy', y.toString());
                star.setAttribute('r', radius.toString());
                star.setAttribute('fill', '#ffffff');
                star.setAttribute('fill-opacity', opacity.toString());
                svg.appendChild(star as any);
            }
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