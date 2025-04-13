# break-tower

一个类似杀戮尖塔的web页游

[![wakatime](https://wakatime.com/badge/user/7dcace4a-8c3d-4c31-8e2c-ca241719b01b/project/75362c37-4cea-4158-ad6b-9da033d38760.svg)](https://wakatime.com/badge/user/7dcace4a-8c3d-4c31-8e2c-ca241719b01b/project/75362c37-4cea-4158-ad6b-9da033d38760)

## 项目描述

Break Tower是一款融合了深度策略卡牌构筑与随机探索元素的网页版肉鸽游戏，以二次元美术风格呈现。玩家将在游戏中扮演具有独特能力的角色，通过构筑卡组挑战不断变化的尖塔。

## 技术栈

- 前端：TypeScript + Phaser 3
- 后端：计划使用 Python + Django + PostgreSQL

## 已完成的工作

- ✅ 完成核心战斗原型
  - 基础回合制战斗系统
  - 玩家和敌人基本属性（HP、能量、格挡）
  - 卡牌系统（抽牌、出牌、弃牌）
  - 效果系统（伤害、格挡）
  - 敌人AI与意图系统
  - 回合管理（玩家/敌人回合切换）

## 下一步计划

- [ ] 实现地图生成与导航系统
- [ ] 添加节点类型（战斗/休息/事件）
- [ ] 卡牌/遗物获取与展示
- [ ] 本地存档/读档功能

## 如何运行

1. 安装依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm start
```

3. 在浏览器中访问 <http://localhost:8081>

## 开发进度

项目当前处于阶段一（里程碑1完成）。详细开发计划请参阅游戏设计文档。
