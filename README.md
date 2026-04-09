# ColorPhoto - 图片颜色提取工具

基于 [IceyVanci/colorphoto](https://github.com/IceyVanci/colorphoto) 移植的 Tauri 版本，一个轻量级图片颜色提取工具。
可能存在功能缺陷。
使用Minimax M2.7开发


## 功能特性

- 🎨 **K-means 颜色提取** - 使用聚类算法从图片中提取主要颜色
- 🖼️ **多种显示模式** - 纵向、边缘、网格三种展示方式
- 🌈 **X11 标准色库** - 支持 357 种颜色的中英文名称匹配
- 📋 **EXIF 信息读取** - 显示图片的 EXIF 元数据
- 💾 **图片导出** - 导出处理后的图片（保留 EXIF）
- 📁 **多种图片格式** - 支持 JPG、JPEG、PNG 等常见格式
- 🔤 **双语支持** - 中英文界面切换
- ⬜ **色块圆角** - 色块边缘采用圆角设计，提升视觉美观度
- ✋ **色块拖拽** - 支持拖动色块到任意位置，调整参数后保持位置

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | TypeScript + Vite |
| UI 组件 | 原生 HTML/CSS/JavaScript |
| 后端运行时 | Tauri 2.x (Rust) |
| EXIF 处理 | kamadak-exif |
| 构建工具 | Cargo + npm |

## 项目结构

```
colorphoto-tauri/
├── src/                          # 前端源码
│   ├── main.ts                   # 前端入口
│   ├── index.css                 # 样式文件
│   ├── components/               # UI 组件
│   │   ├── DropZone.ts          # 拖拽区域
│   │   ├── ImagePreview.ts      # 图片预览
│   │   └── ControlPanel.ts      # 控制面板
│   ├── utils/                   # 工具函数
│   │   ├── colorExtractor.ts    # 颜色提取（K-means）
│   │   ├── imageProcessor.ts    # 图片处理
│   │   └── x11Colors.ts        # X11 颜色库
│   └── assets/
│       └── MiSans-Medium.ttf    # 小米字体 (Mi Sans)
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   └── main.rs              # 入口 + 命令定义
│   ├── Cargo.toml               # Rust 依赖
│   ├── tauri.conf.json          # Tauri 配置
│   └── build.rs                 # 构建脚本
├── package.json                  # 前端依赖
├── tsconfig.json                 # TypeScript 配置
└── vite.config.ts               # Vite 配置
```

## 构建与运行

### 开发模式

```bash
cd colorphoto-tauri
npm install
npm run tauri dev
```

### 构建发布版

```bash
npm run tauri build
```

构建产物位于：
- 可执行文件: `src-tauri/target/release/colorphoto-tauri.exe`
- 便携版: 项目根目录的 `ColorPhoto.exe`

## Rust 命令

| 命令 | 说明 |
|------|------|
| `open_file_dialog` | 打开文件对话框（简化版本） |
| `save_file` | 保存 Base64 图片数据为文件 |
| `get_exif` | 读取 JPEG 文件的 EXIF 信息 |

## 性能对比

| 指标 | Electron 版本 | Tauri 版本 | 改善 |
|------|--------------|------------|------|
| 安装包大小 | ~150MB | ~10MB | 90%+ 减小 |
| 启动时间 | 2-5s | <1s | 显著提升 |
| 内存占用 | ~200MB | ~50MB | 75%+ 减小 |

## 系统要求

- Windows 10/11 (64位)
- WebView2 运行时（Windows 10/11 已内置）

## 版本历史

### v2.0.0 (2026-04)
- 从 Electron 移植到 Tauri
- 大幅减小应用体积
- 提升启动速度和运行效率

## 许可证

MIT License
