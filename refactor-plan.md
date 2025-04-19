# Break Tower 重构计划

## 目录结构重组

### 当前结构

```text
src/
├── config/         # 配置文件 (已移动到 core/)
├── core/           # 核心逻辑
│   ├── config.ts    # 游戏配置
│   ├── game.ts      # 游戏主类
│   └── types.ts     # 核心类型定义
├── data/           # 游戏数据
│   ├── cards.ts    # 卡牌数据
│   ├── enemies.ts  # 敌人数据
│   └── relics.ts   # 遗物数据
├── entities/       # 游戏实体
├── generators/     # 生成器 (已移动到 systems/map/)
├── managers/       # 管理器 (已移动到各个系统目录)
├── scenes/         # 游戏场景 (已移动到 ui/scenes/)
├── state/          # 状态管理
│   ├── GameState.ts # 游戏状态基类
│   ├── RunState.ts  # 运行状态
│   └── StateManager.ts # 状态管理器
├── systems/        # 游戏系统
│   ├── card/       # 卡牌系统
│   ├── combat/     # 战斗系统
│   ├── event/      # 事件系统
│   └── map/        # 地图系统
├── ui/             # 用户界面
│   ├── components/  # UI组件
│   └── scenes/     # 游戏场景
├── utils/          # 工具函数
│   └── SvgGenerator.ts # SVG生成工具
├── gameConfig.ts   # 游戏配置 (已移动到 core/config.ts)
├── index.html      # HTML入口
└── index.ts        # TS入口
```

### 新结构

```text
src/
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
│   │   ├── CardData.ts    # 卡牌数据定义
│   │   ├── CardManager.ts # 卡牌管理器
│   │   └── CardEffects.ts # 卡牌效果
│   ├── combat/     # 战斗系统
│   │   ├── CombatManager.ts # 战斗管理器
│   │   ├── TurnManager.ts   # 回合管理器
│   │   └── EffectManager.ts # 效果管理器
│   ├── map/        # 地图系统
│   │   ├── MapData.ts     # 地图数据
│   │   └── MapGenerator.ts # 地图生成器
│   └── event/      # 事件系统
│       ├── EventData.ts   # 事件数据
│       └── EventManager.ts # 事件管理器
├── entities/       # 游戏实体
│   ├── Player.ts   # 玩家
│   ├── Enemy.ts    # 敌人
│   └── Card.ts     # 卡牌
├── ui/             # 用户界面
│   ├── components/ # UI组件
│   │   ├── Button.ts      # 按钮组件
│   │   ├── HealthBar.ts   # 生命条组件
│   │   └── CardDisplay.ts # 卡牌显示组件
│   └── scenes/     # 游戏场景
│       ├── BootScene.ts     # 启动场景
│       ├── MainMenuScene.ts # 主菜单场景
│       ├── MapScene.ts      # 地图场景
│       ├── CombatScene.ts   # 战斗场景
│       └── EventScene.ts    # 事件场景
├── utils/          # 工具函数
│   ├── SvgGenerator.ts # SVG生成工具
│   └── ObjectPool.ts   # 对象池
├── data/           # 游戏数据
│   ├── cards.json  # 卡牌数据
│   ├── enemies.json # 敌人数据
│   └── relics.json # 遗物数据
├── assets/         # 资源管理
│   ├── AssetLoader.ts # 资源加载器
│   └── AssetManager.ts # 资源管理器
└── index.ts        # 入口文件
```

## 重构步骤

1. ✅ 创建新的目录结构
2. ✅ 移动和重组现有文件
3. ✅ 更新导入路径
4. ✅ 测试确保功能正常

## 详细计划

### 步骤1：创建新的目录结构

创建以下目录：

- ✅ src/core
- ✅ src/state
- ✅ src/systems/card
- ✅ src/systems/combat
- ✅ src/systems/map
- ✅ src/systems/event
- ✅ src/ui/components
- ✅ src/ui/scenes
- ✅ src/assets

### 步骤2：移动和重组现有文件

1. ✅ 将 src/config/gameConfig.ts 移动到 src/core/config.ts
2. ✅ 将 src/managers/RunStateManager.ts 移动到 src/state/StateManager.ts
3. ✅ 将 src/managers/CardManager.ts 移动到 src/systems/card/CardManager.ts
4. ✅ 将 src/managers/DeckManager.ts 移动到 src/systems/card/DeckManager.ts
5. ✅ 将 src/managers/EffectManager.ts 移动到 src/systems/combat/EffectManager.ts
6. ✅ 将 src/managers/TurnManager.ts 移动到 src/systems/combat/TurnManager.ts
7. ✅ 将 src/generators/MapGenerator.ts 移动到 src/systems/map/MapGenerator.ts
8. ✅ 将 src/scenes/* 移动到 src/ui/scenes/
9. ✅ 将 src/utils/SvgGenerator.ts 保留在 src/utils/SvgGenerator.ts

### 步骤3：更新导入路径

✅ 在所有文件中更新导入路径，以反映新的目录结构。

### 步骤4：测试确保功能正常

✅ 在每个步骤后进行测试，确保功能正常。

## 额外完成的工作（计划外）

- ✅ 创建了新的场景：DeckViewScene 和 RewardScene
- ✅ 添加了ESLint和Prettier配置
- ✅ 创建了README.md和LICENSE文件
- ✅ 优化了游戏的自适应显示，解决了黑边问题

## 下一步可能的工作

1. 清理旧的目录结构：
   - 删除不再使用的旧目录（如 src/config, src/managers, src/generators, src/scenes）
   - 确保没有遗留的重复文件

2. 代码质量优化：
   - 修复ESLint警告
   - 优化性能
   - 添加更多的注释和文档

3. 功能扩展：
   - 添加更多的卡牌和敌人
   - 实现更多的游戏机制
   - 添加音效和更多的视觉效果

4. 测试：
   - 编写单元测试
   - 进行更全面的功能测试
   - 进行性能测试
