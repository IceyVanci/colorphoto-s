# 函数动作分析总结

---

## 📊 快速总览

| 状态 | 数量 | 说明 |
|------|------|------|
| ✅ 设计 | 22 | 按设计预期运行，无需修改 |
| 🔧 已修复 | 0 | 暂无已知问题 |

---

## 📋 机制汇总表

### main.ts (前端主入口)

| 函数名 | 状态 | 触发时机 | 核心机制 | 影响范围 |
|--------|------|----------|----------|----------|
| `handleImport` | ✅ | 点击导入按钮 | 调用 Rust `open_file_dialog` → 加载图片 | 全局 |
| `handleExport` | ✅ | 点击导出按钮 | 导出 Canvas → 调用 Rust `save_file_with_exif` 保存 | 全局 |
| `onDisplayModeChange` | ✅ | 切换显示模式 | 保存当前排序 → 恢复目标模式排序 | 图片、侧边栏 |
| `onEdgePositionChange` | ✅ | 切换边缘位置 | 更新位置状态 → 重绘 | 图片 |
| `onColorCountChange` | ✅ | 切换色块数量 | 取当前排序的中间3个(3个时) | 图片、侧边栏 |
| `onBlockSizeChange` | ✅ | 调整色块大小 | 保持中心点 → 重新计算 | 图片 |
| `onColorSortChange` | ✅ | 切换排序方式 | 调用 sortColors → 重新排序 | 全部显示 |
| `onShowLabelChange` | ✅ | 切换HEX显示 | 更新状态 → 重绘 | 图片 |
| `onShowColorNameChange` | ✅ | 开启颜色名称 | 首次自动设为英文 → 重绘 | 图片 |
| `onColorNameLangChange` | ✅ | 切换语言 | 更新语言状态 → 重绘 | 图片 |
| `setOnColorsChange` | ✅ | 侧边栏拖动 | 直接赋值 colors → 保持位置 | 图片、侧边栏 |
| `handleDropZoneFileSelect` | ✅ | 拖拽文件 | FileReader 读取 → 调用 loadImage | 全局 |
| `loadImage` | ✅ | 加载图片 | 加载到 Canvas → 提取颜色 | 全局 |
| `renderImage` | ✅ | 渲染触发 | 调用 imageProcessor.render() | Canvas |

### ImagePreview.ts

| 函数名 | 状态 | 触发时机 | 核心机制 | 影响范围 |
|--------|------|----------|----------|----------|
| `loadImage` | ✅ | 导入图片 | 加载到 Canvas | Canvas |
| `setColors` | ✅ | 颜色更新 | 更新颜色数组 → 渲染预览 | 侧边栏 |
| `renderColorBlocks` | ✅ | 渲染时 | 创建拖动元素 → 绑定事件 | 侧边栏 |
| `swapColors` | ✅ | 拖动结束 | 交换数组元素 → 回调 | 全部 |
| `setOnColorsChange` | ✅ | 初始化时 | 注册回调 | 全局 |
| `show/hide` | ✅ | 显示/隐藏 | 切换容器 display | UI |

### ImageProcessor.ts

| 函数名 | 状态 | 触发时机 | 核心机制 | 影响范围 |
|--------|------|----------|----------|----------|
| `setColors` | ✅ | 颜色更新 | 位置保护逻辑 | 图片 |
| `setDisplayMode` | ✅ | 模式切换 | 保存/加载位置 | 图片 |
| `setEdgePosition` | ✅ | 位置切换 | 更新边缘位置 | 图片 |
| `setBlockSize` | ✅ | 大小调整 | 保持中心点 | 图片 |
| `setupDragEvents` | ✅ | 初始化 | 绑定拖动事件 | 图片 |
| `renderBlocks` | ✅ | 渲染时 | 绘制色块和标签 | Canvas |
| `exportToDataUrl` | ✅ | 导出时 | Canvas 转 DataURL | 文件 |

### ControlPanel.ts

| 函数名 | 状态 | 触发时机 | 核心机制 | 影响范围 |
|--------|------|----------|----------|----------|
| `setColors` | ✅ | 颜色更新 | 更新底部预览 | 控制面板 |
| `setCallback` | ✅ | 初始化时 | 注册回调 | 全局 |
| `setExportEnabled` | ✅ | 导出状态 | 启用/禁用按钮 | 控制面板 |
| `init` | ✅ | 初始化时 | 绑定事件 | 控制面板 |

### DropZone.ts (Tauri 特有)

| 函数名 | 状态 | 触发时机 | 核心机制 | 影响范围 |
|--------|------|----------|----------|----------|
| 点击事件 | ✅ | 点击导入区域 | 调用 Rust `open_file_dialog` | 文件选择 |
| 拖拽事件 | ✅ | 拖拽文件 | FileReader 读取文件 | 文件读取 |

### main.rs (Rust 后端)

| 函数名 | 状态 | 触发时机 | 核心机制 | 影响范围 |
|--------|------|----------|----------|----------|
| `open_file_dialog` | ✅ | 前端调用 | 打开系统文件选择器 → 返回文件数据 | 文件系统 |
| `save_file` | ✅ | 前端调用 | 保存文件对话框 → 写入文件 | 文件系统 |
| `save_file_with_exif` | ✅ | 前端调用 | 提取原始 EXIF → 嵌入到导出图片 | 文件系统 |
| `get_exif` | ✅ | 前端调用 | 读取文件 EXIF 信息 | 文件系统 |
| `extract_exif_from_jpeg` | ✅ | 内部函数 | 从 JPEG 二进制提取 APP1 段 | 内存 |
| `insert_exif_into_jpeg` | ✅ | 内部函数 | 将 EXIF 插入 JPEG | 内存 |

---

## 📂 main.ts 详细分析

### 1. `handleImport` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第267-277行 |
| **类型** | 异步函数 |
| **触发时机** | 用户点击控制面板的"导入"按钮 |
| **依赖** | Rust `open_file_dialog` 命令 |

**代码：**
```typescript
async function handleImport(): Promise<void> {
  try {
    const result = await invoke<FileResult>('open_file_dialog');
    if (result) {
      await loadImage(result);
    }
  } catch (error) {
    console.error('Error importing image:', error);
    alert('导入图片失败: ' + (error as Error).message);
  }
}
```

**执行流程：**
1. 调用 Rust 命令 `open_file_dialog` 打开系统文件选择器
2. 如果用户选择文件，调用 `loadImage(result)` 加载图片
3. 如果出错，显示错误提示

**副作用：**
- 设置 `appState.originalFilePath`
- 设置 `appState.exifData`
- 调用 `imagePreview.loadImage()`
- 调用 `colorExtractor.extract()`
- 更新 `appState.extractedColors` 和 `appState.allExtractedColors`
- 隐藏 dropZone，显示 imagePreview

---

### 2. `handleExport` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第347-374行 |
| **类型** | 异步函数 |
| **触发时机** | 用户点击控制面板的"导出"按钮 |
| **依赖** | Rust `save_file_with_exif` 命令 |

**代码：**
```typescript
async function handleExport(): Promise<void> {
  try {
    const exportData = imageProcessor.exportToDataUrl();
    if (!exportData) return;
    
    const originalName = appState.originalFilePath 
      ? appState.originalFilePath.split(/[/\\]/).pop() || 'image.jpg'
      : 'image.jpg';
    const baseName = originalName.replace(/\.[^.]+$/, '');
    const defaultName = baseName + '_colored.jpg';
    
    // 使用带有 EXIF 保留功能的保存命令
    const result = await invoke<SaveResult>('save_file_with_exif', { 
      data: exportData, 
      originalFilePath: appState.originalFilePath || '',
      defaultPath: defaultName 
    });
    
    if (result.success) {
      alert('图片导出成功！\n保存位置: ' + result.path);
    } else if (!result.canceled) {
      alert('导出失败: ' + (result.error || '未知错误'));
    }
  } catch (error) {
    console.error('Error exporting image:', error);
    alert('导出图片失败: ' + (error as Error).message);
  }
}
```

**执行流程：**
1. 调用 `imageProcessor.exportToDataUrl()` 获取 Canvas 的图片数据
2. 生成默认文件名（原始名称 + `_colored.jpg`）
3. 调用 `save_file_with_exif()` 保存文件（自动保留 EXIF）
4. 显示成功/失败提示

---

### 3. `onDisplayModeChange` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第167-199行 |
| **类型** | 回调函数 |
| **触发时机** | 用户切换显示模式（纵向/方格/边缘） |
| **状态依赖** | `appState.modeColors` |

**代码：**
```typescript
controlPanel.setCallback('onDisplayModeChange', (mode: any) => {
  // 保存当前模式的颜色排序
  const currentSortedColors = colorExtractor.sortColors(appState.allExtractedColors, appState.colorSort);
  appState.modeColors[appState.displayMode] = [...currentSortedColors];
  
  appState.displayMode = mode;
  imageProcessor.setDisplayMode(mode);
  
  // 如果该模式已有保存的颜色排序，使用它；否则使用默认排序
  const savedColors = appState.modeColors[mode as keyof typeof appState.modeColors];
  const defaultSortedColors = colorExtractor.sortColors(appState.allExtractedColors, appState.colorSort);
  const displayColors = savedColors.length > 0 ? savedColors : defaultSortedColors;
  
  // 方格模式始终使用前4个颜色
  if (mode === 'grid') {
    const gridColors = displayColors.slice(0, 4);
    imageProcessor.setColors(gridColors);
    imagePreview.setColors(displayColors.slice(0, 5));
    controlPanel.setColors(displayColors.slice(0, 5));
    appState.extractedColors = gridColors;
  } else {
    const limitedColors = displayColors.slice(0, appState.colorCount);
    appState.extractedColors = limitedColors;
    imageProcessor.setColors(limitedColors);
    imagePreview.setColors(displayColors.slice(0, 5));
    controlPanel.setColors(limitedColors);
  }
  
  renderImage();
});
```

**设计要点：**
- 使用 `modeColors` 状态保存每个模式的颜色排序
- 切换模式时恢复该模式之前保存的颜色顺序
- 方格模式显示4个颜色，其他模式显示用户选择的数量

---

### 4. `onEdgePositionChange` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第201-205行 |
| **类型** | 回调函数 |
| **触发时机** | 用户切换边缘位置（上/下/左/右） |

**代码：**
```typescript
controlPanel.setCallback('onEdgePositionChange', (position: any) => {
  appState.edgePosition = position;
  imageProcessor.setEdgePosition(position);
  renderImage();
});
```

**执行流程：**
1. 更新 `appState.edgePosition`
2. 调用 `imageProcessor.setEdgePosition(position)`
3. 调用 `renderImage()` 重绘

---

### 5. `onColorCountChange` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第207-223行 |
| **类型** | 回调函数 |
| **触发时机** | 用户切换色块数量（3/5） |

**代码：**
```typescript
controlPanel.setCallback('onColorCountChange', (count: any) => {
  appState.colorCount = count;
  colorExtractor.colorCount = count;
  if (appState.extractedColors.length > 0) {
    let limitedColors: ColorInfo[];
    if (count === 3) {
      // 取当前颜色的中间3个
      limitedColors = [appState.extractedColors[1], appState.extractedColors[2], appState.extractedColors[3]];
    } else {
      limitedColors = appState.extractedColors.slice(0, count);
    }
    appState.extractedColors = limitedColors;
    imageProcessor.setColors(limitedColors);
    controlPanel.setColors(limitedColors);
    renderImage();
  }
});
```

**设计要点：** 切换为3个颜色时，取当前用户排序的中间3个，而非原始排序的中间3个。

---

### 6. `onBlockSizeChange` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第225-229行 |
| **类型** | 回调函数 |
| **触发时机** | 用户调整色块大小滑块 |

**代码：**
```typescript
controlPanel.setCallback('onBlockSizeChange', (size: any) => {
  appState.blockSize = size;
  imageProcessor.setBlockSize(size);
  renderImage();
});
```

**设计要点：** 调整大小时保持色块中心位置不变，由 `imageProcessor.setBlockSize()` 内部处理。

---

### 7. `onColorSortChange` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第231-241行 |
| **类型** | 回调函数 |
| **触发时机** | 用户切换排序方式 |

**代码：**
```typescript
controlPanel.setCallback('onColorSortChange', (sortType: any) => {
  appState.colorSort = sortType;
  if (appState.extractedColors.length > 0) {
    const sortedColors = colorExtractor.sortColors(appState.extractedColors, sortType);
    appState.extractedColors = sortedColors;
    imageProcessor.setColors(sortedColors);
    imagePreview.setColors(sortedColors);
    controlPanel.setColors(sortedColors);
    renderImage();
  }
});
```

**排序类型：** `brightness`（亮度）、`hue`（色相）、`saturation`（饱和度）、`original`（原始）

---

### 8. `onShowLabelChange` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第243-247行 |
| **类型** | 回调函数 |
| **触发时机** | 用户切换HEX标签显示开关 |

**代码：**
```typescript
controlPanel.setCallback('onShowLabelChange', (show: any) => {
  appState.showLabel = show;
  imageProcessor.setShowLabel(show);
  renderImage();
});
```

---

### 9. `onShowColorNameChange` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第249-262行 |
| **类型** | 回调函数 |
| **触发时机** | 用户开启颜色名称显示 |

**代码：**
```typescript
controlPanel.setCallback('onShowColorNameChange', (show: any) => {
  appState.showColorName = show;
  imageProcessor.setShowColorName(show);
  // 首次开启颜色名称时，自动设置为英文
  if (show && appState.firstTimeShowColorName) {
    appState.firstTimeShowColorName = false;
    appState.colorNameLanguage = 'en';
    imageProcessor.setColorNameLanguage('en');
    const langToggle = document.getElementById('colorNameLangSelect') as HTMLInputElement;
    if (langToggle) langToggle.checked = true;
  }
  renderImage();
});
```

**设计要点：** 首次开启颜色名称时，自动设置为英文并勾选英文开关。

---

### 10. `onColorNameLangChange` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第264-268行 |
| **类型** | 回调函数 |
| **触发时机** | 用户切换颜色名称语言（中/英） |

**代码：**
```typescript
controlPanel.setCallback('onColorNameLangChange', (lang: any) => {
  appState.colorNameLanguage = lang;
  imageProcessor.setColorNameLanguage(lang);
  renderImage();
});
```

---

### 11. `setOnColorsChange` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第270-280行 |
| **类型** | 回调函数 |
| **触发时机** | 用户拖动侧边栏色块改变顺序 |
| **来源** | ImagePreview 组件 |

**代码：**
```typescript
imagePreview.setOnColorsChange((colors: ColorInfo[]) => {
  appState.extractedColors = colors;
  // 直接使用用户拖动后的顺序保存到 modeColors
  appState.modeColors[appState.displayMode] = [...colors];
  // 直接更新 colors，不调用 setColors 以避免重置位置
  imageProcessor.colors = colors.slice(0, appState.colorCount);
  // 侧边栏显示全部5个颜色（保持用户拖动后的顺序）
  imagePreview.setColors(colors.slice(0, 5));
  controlPanel.setColors(colors);
  renderImage();
});
```

**设计要点：** 使用直接赋值而非 `setColors()`，避免触发位置重置。

---

### 12. `loadImage` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第279-335行 |
| **类型** | 异步函数 |
| **触发时机** | 文件选择完成 |

**代码：**
```typescript
async function loadImage(result: FileResult): Promise<void> {
  const { path, data } = result;
  
  try {
    appState.originalFilePath = path;
    appState.originalDataUrl = data;
    
    // 优先使用 piexifjs 从 data URL 提取 EXIF（更完整）
    if (data) {
      const piexifExif = loadExifFromDataUrl(data);
      if (piexifExif) {
        appState.exifData = piexifExif;
      } else if (path) {
        // 如果 piexif 提取失败，尝试 Rust 端读取
        try {
          appState.exifData = await invoke('get_exif', { filePath: path });
        } catch {
          appState.exifData = null;
        }
      }
    } else if (path) {
      try {
        appState.exifData = await invoke('get_exif', { filePath: path });
      } catch {
        appState.exifData = null;
      }
    }
    
    await imagePreview.loadImage(data!);
    
    const canvas = imagePreview.getCanvas();
    if (!canvas) return;
    
    const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    const colors = colorExtractor.extract(imageData);
    appState.allExtractedColors = colors;
    
    const sortedColors = colorExtractor.sortColors(colors, appState.colorSort);
    const displayColors = sortedColors.slice(0, appState.colorCount);
    
    appState.extractedColors = displayColors;
    imageProcessor.setImage(imagePreview.getImage()!);
    imageProcessor.setColors(displayColors);
    imagePreview.setColors(displayColors);
    controlPanel.setColors(displayColors);
    controlPanel.setExportEnabled(true);
    renderImage();
    
    const dropZone = document.getElementById('dropZone');
    if (dropZone) dropZone.style.display = 'none';
    imagePreview.show();
    
  } catch (error) {
    console.error('Error loading image:', error);
    alert('加载图片失败: ' + (error as Error).message);
  }
}
```

**执行流程：**
1. 保存原始文件路径和数据
2. 提取 EXIF 信息（优先使用 piexifjs，失败则使用 Rust 端）
3. 加载图片到 Canvas
4. 提取颜色
5. 排序并显示颜色
6. 隐藏导入区域，显示预览

---

## 📂 Rust main.rs 详细分析

### 1. `open_file_dialog` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第28-56行 |
| **类型** | Tauri 命令 |
| **触发时机** | 前端调用 |
| **依赖** | `tauri_plugin_dialog` |

**执行流程：**
1. 调用 `app.dialog().file()` 打开系统文件选择器
2. 读取选中文件内容
3. 转换为 Base64 编码的 data URL
4. 返回文件路径和数据

---

### 2. `save_file_with_exif` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第270-341行 |
| **类型** | Tauri 命令 |
| **触发时机** | 前端调用 |

**代码：**
```rust
async fn save_file_with_exif(
    app: AppHandle, 
    data: String, 
    original_file_path: String,
    default_path: String
) -> Result<SaveResult, String> {
    // ... 文件对话框 ...
    
    // 尝试从原始文件提取 EXIF
    if let Ok(original_data) = fs::read(&original_file_path) {
        if let Some(exif_data) = extract_exif_from_jpeg(&original_data) {
            image_data = insert_exif_into_jpeg(&image_data, &exif_data);
            log::info!("EXIF embedded successfully");
        }
    }
    
    // 保存文件
    fs::write(&path_str, &image_data)
}
```

**设计要点：** 保存时自动从原始文件提取 EXIF 并嵌入到导出的图片中。

---

### 3. `extract_exif_from_jpeg` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第150-205行 |
| **类型** | 内部函数 |
| **功能** | 从 JPEG 二进制数据提取 EXIF APP1 段 |

**实现逻辑：**
1. 检查 JPEG SOI 标记 (0xFF 0xD8)
2. 遍历所有段
3. 查找 APP1 标记 (0xFF 0xE1)
4. 检查 "Exif\0\0" 头
5. 返回 EXIF 二进制数据

---

### 4. `insert_exif_into_jpeg` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第207-268行 |
| **类型** | 内部函数 |
| **功能** | 将 EXIF 二进制数据插入 JPEG |

**实现逻辑：**
1. 复制原始 JPEG 的 SOI 和非 APP1 段
2. 删除原始 APP1 段
3. 在 SOI 后插入新的 APP1 段
4. 复制剩余数据

---

## 📂 ImagePreview.ts 详细分析

### 1. `loadImage(src)` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第30-44行 |
| **返回** | Promise |
| **异步** | 是 |

**代码：**
```typescript
async loadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    this.image = new Image();
    this.image.onload = () => {
      if (this.canvas && this.ctx && this.image) {
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        this.ctx.drawImage(this.image, 0, 0);
      }
      resolve();
    };
    this.image.onerror = reject;
    this.image.src = src;
  });
}
```

---

### 2. `renderColorBlocks()` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第51-104行 |
| **创建元素** | 色块容器 + 每个颜色的色块 |

**拖拽实现：**
- `mousedown`: 记录被拖拽元素
- `mouseenter`: 检测进入其他色块区域，自动交换
- `mouseup`: 结束拖拽

---

### 3. `swapColors(fromIndex, toIndex)` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第106-117行 |
| **触发** | 拖拽结束 |
| **回调** | `this.onColorsChange` |

**代码：**
```typescript
private swapColors(fromIndex: number, toIndex: number): void {
  const temp = this.colors[fromIndex];
  this.colors[fromIndex] = this.colors[toIndex];
  this.colors[toIndex] = temp;
  
  this.colors.forEach((c, i) => c.position = i);
  
  if (this.onColorsChange) {
    this.onColorsChange(this.colors);
  }
  this.renderColorBlocks();
}
```

---

## 📂 imageProcessor.ts 详细分析

### 1. `setColors(colors)` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第52-108行 |
| **参数** | `colors: ColorInfo[]` |

**位置保护逻辑：**
- 如果 `userHasCustom` 为 true 且颜色数量不变，使用保存的位置
- 否则重新计算（纵向模式保持中心点，方格/边缘模式重新初始化）

---

### 2. `setDisplayMode(mode)` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第110-124行 |
| **参数** | `mode: 'vertical' | 'edge' | 'grid'` |

**代码：**
```typescript
setDisplayMode(mode: 'vertical' | 'edge' | 'grid'): void {
  // 切换模式前保存当前位置到对应模式
  this.modePositions[this.displayMode].positions = [...this.blockPositions];
  
  this.displayMode = mode;
  
  // 如果新模式已有保存的位置，加载它
  const modeData = this.modePositions[mode];
  if (modeData.positions.length > 0 && modeData.userHasCustom) {
    this.blockPositions = [...modeData.positions];
    this.render();
  } else {
    this.initBlockPositions();
  }
}
```

---

### 3. `setupDragEvents()` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第320-400行 |
| **拖动模式** | 五个色块整体拖动 |

**关键逻辑：**
- `mousedown`: 检测点击是否在色块范围内，记录初始位置
- `mousemove`: 整体移动所有色块
- `mouseup` / `mouseleave`: 保存拖拽后的位置

---

## 📂 DropZone.ts 详细分析 (Tauri 特有)

### 1. 点击事件 - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第38-48行 |
| **触发时机** | 用户点击导入区域 |
| **实现** | 调用 Rust `open_file_dialog` |

**代码：**
```typescript
this.element.addEventListener('click', async () => {
  try {
    const result = await invoke<FileResult>('open_file_dialog');
    if (result && result.data && this.onDataResult) {
      this.onDataResult(result);
    }
  } catch (error) {
    console.error('Error opening file dialog:', error);
  }
});
```

**设计要点：** 与控制面板的导入按钮使用相同的 Rust 命令，确保文件选择器记住上次路径。

---

## 📂 ControlPanel.ts 详细分析

### 1. `setColors(colors)` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第181-184行 |
| **功能** | 更新底部颜色预览 |

---

### 2. `setCallback(event, callback)` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第216-220行 |
| **功能** | 注册事件回调 |

---

## 📂 colorExtractor.ts 详细分析

### 1. `extract(imageData)` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第15-20行 |
| **功能** | 从图片提取主要颜色 |

**使用 K-means 聚类算法**

---

### 2. `sortColors(colors, sortType)` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第201-221行 |
| **功能** | 按指定方式排序颜色 |

**排序类型：** `brightness`（亮度）、`hue`（色相）、`saturation`（饱和度）

---

## 📂 x11Colors.ts 详细分析

### 1. `getColorName(hex, language)` - ✅ 设计

| 属性 | 内容 |
|------|------|
| **位置** | 第399-403行 |
| **功能** | 根据 RGB 值找到最接近的 X11 颜色名称 |

**颜色数据库：** 约 350 种 X11 标准颜色 + 扩展颜色

---

## 📈 统计

| 分类 | 数量 |
|------|------|
| 设计（无需修复） | 22 |
| 已修复问题 | 0 |
| **总计分析** | **22** |

---

## 🔄 与 Electron 版本主要差异

| 项目 | Electron 版本 | Tauri 版本 |
|------|---------------|------------|
| 文件选择 | `window.electronAPI.openFileDialog()` | `invoke('open_file_dialog')` |
| EXIF 处理 | 前端 piexifjs + 后端 fs | 前端 piexifjs + Rust 二进制处理 |
| 文件保存 | `window.electronAPI.saveFile()` | `invoke('save_file_with_exif')` |
| 导入组件 | 浏览器 input[type=file] | DropZone + Tauri dialog |
| 拖拽实现 | HTML5 drag API | 原生 mouse 事件 |
| 模块系统 | 全局变量 + 内联脚本 | TypeScript ES 模块 |

---

## 📝 设计亮点

1. **EXIF 元数据保留**：Rust 端直接从 JPEG 二进制提取和嵌入 EXIF，兼容性更好
2. **模式颜色排序记忆**：每个显示模式独立保存颜色排序
3. **色块位置保护**：拖拽后位置不会被自动重置
4. **Tauri 原生对话框**：文件选择器由系统管理，记住上次路径
5. **K-means 聚类**：使用智能算法提取图片主色
6. **X11 颜色数据库**：350+ 颜色名称支持中英文
