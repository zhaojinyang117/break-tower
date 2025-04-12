const fs = require('fs');
const path = require('path');

// 定义图像尺寸
const BACKGROUND_SIZE = { width: 1280, height: 720 };
const PLAYER_SIZE = { width: 200, height: 300 };
const ENEMY_SIZE = { width: 200, height: 300 };
const CARD_SIZE = { width: 200, height: 280 };

// 确保目录存在
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`创建目录: ${directory}`);
        fs.mkdirSync(directory, { recursive: true });
    }
}

// 创建占位资源文件夹
ensureDirectoryExists('assets');
ensureDirectoryExists('assets/images');
ensureDirectoryExists('assets/audio');

// 创建基本的占位图像文件
const placeholders = [
    {
        name: 'background_placeholder.png',
        content: `占位图像: 背景 (${BACKGROUND_SIZE.width}x${BACKGROUND_SIZE.height})\n颜色: #222222`
    },
    {
        name: 'player_placeholder.png',
        content: `占位图像: 玩家 (${PLAYER_SIZE.width}x${PLAYER_SIZE.height})\n颜色: #0000ff`
    },
    {
        name: 'enemy_placeholder.png',
        content: `占位图像: 敌人 (${ENEMY_SIZE.width}x${ENEMY_SIZE.height})\n颜色: #ff0000`
    },
    {
        name: 'card_placeholder.png',
        content: `占位图像: 卡牌 (${CARD_SIZE.width}x${CARD_SIZE.height})\n颜色: #333333`
    }
];

// 创建占位图像文件
placeholders.forEach(placeholder => {
    const filePath = path.join('assets/images', placeholder.name);

    if (!fs.existsSync(filePath)) {
        console.log(`创建占位图像: ${placeholder.name}`);
        fs.writeFileSync(filePath, placeholder.content);
    } else {
        console.log(`占位图像已存在: ${placeholder.name}`);
    }
});

console.log('占位资源创建完成!');