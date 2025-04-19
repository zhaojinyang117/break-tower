# Break Tower

一个基于Phaser 3和TypeScript的卡牌Roguelike游戏。

## 项目说明

Break Tower是一个卡牌Roguelike游戏，玩家需要通过构建卡组，战胜敌人，攀登高塔。游戏融合了卡牌构筑和Roguelike元素，每次游戏都会有不同的体验。

## 技术栈

- Phaser 3：游戏引擎
- TypeScript：编程语言
- Webpack：构建工具
- ESLint & Prettier：代码质量工具

## 项目结构

```
src/
├── assets/         # 游戏资源
├── core/           # 核心游戏逻辑
│   ├── game.ts     # 游戏主类
│   ├── config.ts   # 游戏配置
│   └── types.ts    # 核心类型定义
├── state/          # 状态管理
│   ├── GameState.ts       # 游戏状态基类
│   ├── RunState.ts        # 运行状态
│   └── StateManager.ts    # 状态管理器
├── systems/        # 游戏系统
│   ├── card/       # 卡牌系统
│   ├── combat/     # 战斗系统
│   ├── map/        # 地图系统
│   └── event/      # 事件系统
├── entities/       # 游戏实体
│   ├── Player.ts   # 玩家
│   ├── Enemy.ts    # 敌人
│   └── Card.ts     # 卡牌
├── ui/             # 用户界面
│   ├── components/ # UI组件
│   └── scenes/     # 游戏场景
├── utils/          # 工具函数
└── index.ts        # 入口文件
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm start
```

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

## 游戏特性

- 卡牌系统：构建你的卡组，使用各种卡牌战胜敌人
- 地图系统：随机生成的地图，每次游戏都有不同的路径
- 战斗系统：回合制战斗，策略性地使用你的卡牌
- 奖励系统：战胜敌人后获得奖励，增强你的角色

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。