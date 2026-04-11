# ColorPhoto - 图片颜色提取工具

这是一个图片颜色提取工具，灵感来自在十年前曾经流行过的某种图片贴纸。从导入的图片中分析出图片的主要颜色，然后以色块在图片上显示。拖动色块调整大小，不管是边框，注释，还是NSFW（？），创建属于你的专属设计！

基于 [IceyVanci/colorphoto](https://github.com/IceyVanci/colorphoto) 移植的 Tauri 版本。

## 功能特性

- **颜色提取**：使用 K-means 聚类算法从图片中智能提取主要颜色
- **多种显示模式**：
  - 纵向色块：色块在图片右侧纵向排列
  - 边缘色块：色块环绕图片四边
  - 方格色块：2x2 网格布局
- **颜色名称显示**：支持中英文颜色名称（X11 标准色库）
- **色块拖拽**：支持拖动色块到任意位置，调整参数后保持位置
- **EXIF 信息**：支持读取图片的 EXIF 元数据
- **导出功能**：将处理后的图片导出为 JPEG 格式（保留 EXIF）
- **拖拽支持**：支持直接拖拽图片文件到窗口

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | TypeScript + Vite |
| UI 组件 | 原生 HTML/CSS/JavaScript |
| 后端运行时 | Tauri 2.x (Rust) |
| EXIF 处理 | kamadak-exif |
| 字体 | MiSans (小米字体) - Medium 字重 |
| 构建工具 | Cargo + npm |

## 性能对比

| 指标 | Electron 版本 | Tauri 版本 | 改善 |
|------|--------------|------------|------|
| 安装包大小 | ~150MB | ~10MB | 90%+ 减小 |
| 启动时间 | 2-5s | <1s | 显著提升 |
| 内存占用 | ~200MB | ~50MB | 75%+ 减小 |

## 项目结构

```
colorphoto-s/
├── colorphoto-tauri/
│   ├── src/                          # 前端源码
│   │   ├── main.ts                   # 前端入口
│   │   ├── index.css                 # 样式文件
│   │   ├── components/               # UI 组件
│   │   │   ├── DropZone.ts          # 拖拽区域
│   │   │   ├── ImagePreview.ts      # 图片预览
│   │   │   └── ControlPanel.ts      # 控制面板
│   │   ├── utils/                   # 工具函数
│   │   │   ├── colorExtractor.ts    # 颜色提取（K-means）
│   │   │   ├── imageProcessor.ts    # 图片处理
│   │   │   └── x11Colors.ts        # X11 颜色库
│   │   └── assets/
│   │       └── MiSans-Medium.ttf    # 小米字体 (Mi Sans)
│   ├── src-tauri/                    # Rust 后端
│   │   ├── src/
│   │   │   └── main.rs              # 入口 + 命令定义
│   │   ├── Cargo.toml               # Rust 依赖
│   │   ├── tauri.conf.json          # Tauri 配置
│   │   ├── capabilities/            # ACL 权限配置
│   │   │   └── default.json
│   │   └── build.rs                 # 构建脚本
│   ├── package.json                  # 前端依赖
│   ├── tsconfig.json                 # TypeScript 配置
│   └── vite.config.ts               # Vite 配置
├── README.md
└── implementation_plan.md           # 实现计划文档
```

## 安装与运行

### 开发模式

```bash
cd colorphoto-tauri
npm install
npm run tauri dev
```

### 构建发布

```bash
npm run tauri build
```

构建产物位于：
- 可执行文件: `colorphoto-tauri/src-tauri/target/release/colorphoto-tauri.exe`

## 使用说明

1. **导入图片**：点击"导入图片"按钮或直接拖拽图片文件到窗口
2. **选择显示模式**：纵向、边缘或方格色块
3. **调整设置**：
   - 色块大小：50-2000px 可调
   - 色块数量：3个或5个
   - 颜色排序：按亮度、色相、饱和度等
   - 色号显示：显示/隐藏十六进制颜色值
   - 颜色名称：显示/隐藏颜色名称（中英文）
4. **导出图片**：点击"导出图片"保存处理结果

## 关于

- **GitHub**：https://github.com/IceyVanci/colorphoto-s
- **原始项目**：https://github.com/IceyVanci/colorphoto
- **开发者**：
  - [IceyVanci](https://github.com/IceyVanci)
  - [koswopond](https://www.instagram.com/koswopond/)
- **AI 辅助**：本项目使用 Minimax M2.7 生成

## 许可证

MIT License
