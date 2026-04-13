/**
 * ColorPhoto - Tauri Frontend Main Entry
 * 图片颜色提取工具 - Tauri 版本
 */
import { invoke } from '@tauri-apps/api/core';
import { ColorExtractor, type ColorInfo } from './utils/colorExtractor';
import { ImageProcessor } from './utils/imageProcessor';
import { ImagePreview } from './components/ImagePreview';
import { ControlPanel } from './components/ControlPanel';
import { DropZone } from './components/DropZone';

// 类型定义
interface FileResult {
  path: string | null;
  data: string | null;
}

interface SaveResult {
  success: boolean;
  path?: string;
  canceled?: boolean;
  error?: string;
}

// piexifjs EXIF 数据结构
interface ExifData {
  '0th': Record<number, unknown>;
  'Exif': Record<number, unknown>;
  'GPS': Record<number, unknown>;
  '1st': Record<number, unknown>;
  'thumbnail': string | null;
}

// 声明 piexifjs 全局变量
declare const piexif: {
  load: (dataUrl: string) => ExifData;
  dump: (exifObj: ExifData) => string;
  insert: (exifBytes: string, dataUrl: string) => string;
};

// 应用状态
const appState: {
  originalImage: HTMLImageElement | null;
  processedImage: string | null;
  extractedColors: ColorInfo[];
  allExtractedColors: ColorInfo[];
  displayMode: 'vertical' | 'edge' | 'grid';
  edgePosition: 'top' | 'bottom' | 'left' | 'right';
  colorCount: 3 | 5;
  colorSort: string;
  showLabel: boolean;
  showColorName: boolean;
  colorNameLanguage: 'cn' | 'en';
  firstTimeShowColorName: boolean;
  blockSize: number;
  exifData: ExifData | null;
  originalFilePath: string | null;
  originalDataUrl: string | null;
  modeColors: {
    vertical: ColorInfo[];
    grid: ColorInfo[];
    edge: ColorInfo[];
  };
} = {
  originalImage: null,
  processedImage: null,
  extractedColors: [],
  allExtractedColors: [],
  displayMode: 'vertical',
  edgePosition: 'right',
  colorCount: 5,
  colorSort: 'brightness',
  showLabel: true,
  showColorName: false,
  colorNameLanguage: 'cn',
  firstTimeShowColorName: true,
  blockSize: 150,
  exifData: null,
  originalFilePath: null,
  originalDataUrl: null,
  modeColors: {
    vertical: [],
    grid: [],
    edge: []
  }
};

// 组件实例
let colorExtractor: ColorExtractor;
let imageProcessor: ImageProcessor;
let imagePreview: ImagePreview;
let controlPanel: ControlPanel;

// 从数据URL加载EXIF数据
function loadExifFromDataUrl(dataUrl: string): ExifData | null {
  try {
    if (typeof piexif === 'undefined') {
      console.warn('piexifjs not loaded');
      return null;
    }
    const exifObj = piexif.load(dataUrl);
    return exifObj;
  } catch (error) {
    console.error('Error loading EXIF:', error);
    return null;
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  console.log('ColorPhoto Tauri initializing...');
  initComponents();
  setupCallbacks();
  console.log('ColorPhoto Tauri initialized');
});

function initComponents(): void {
  colorExtractor = new ColorExtractor(appState.colorCount);
  imageProcessor = new ImageProcessor();
  imageProcessor.initCanvas(document.getElementById('previewCanvas') as HTMLCanvasElement);
  imagePreview = new ImagePreview('previewCanvas', 'colorBlocks');
  controlPanel = new ControlPanel();
  
  new DropZone('dropZone', {
    onFileSelect: handleDropZoneFileSelect,
    onDataResult: loadImage
  });
}

async function handleDropZoneFileSelect(file: File): Promise<void> {
  try {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result as string;
      await loadImage({
        path: file.name,
        data: data
      });
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error reading file:', error);
    alert('读取文件失败: ' + (error as Error).message);
  }
}

function setupCallbacks(): void {
  controlPanel.setCallback('onImport', handleImport);
  controlPanel.setCallback('onExport', handleExport);
  
  controlPanel.setCallback('onDisplayModeChange', (mode: any) => {
    // 保存当前模式的颜色排序（使用 allExtractedColors 的完整排序）
    const currentSortedColors = colorExtractor.sortColors(appState.allExtractedColors, appState.colorSort);
    appState.modeColors[appState.displayMode] = [...currentSortedColors];
    
    appState.displayMode = mode;
    imageProcessor.setDisplayMode(mode);
    
    // 如果该模式已有保存的颜色排序，使用它；否则使用默认排序
    const savedColors = appState.modeColors[mode as keyof typeof appState.modeColors];
    const defaultSortedColors = colorExtractor.sortColors(appState.allExtractedColors, appState.colorSort);
    const displayColors = savedColors.length > 0 ? savedColors : defaultSortedColors;
    
    // 侧边栏预览使用全部5个颜色（用户调整后的顺序）
    const previewColors = displayColors.slice(0, 5);
    
    if (mode === 'grid') {
      const gridColors = displayColors.slice(0, 4);
      imageProcessor.setColors(gridColors);
      // 侧边栏和控制面板都显示全部5个颜色
      imagePreview.setColors(previewColors);
      controlPanel.setColors(previewColors);
      appState.extractedColors = gridColors;
    } else {
      const limitedColors = displayColors.slice(0, appState.colorCount);
      imageProcessor.setColors(limitedColors);
      imagePreview.setColors(previewColors);
      controlPanel.setColors(limitedColors);
      appState.extractedColors = limitedColors;
    }
    
    renderImage();
  });
  
  controlPanel.setCallback('onEdgePositionChange', (position: any) => {
    appState.edgePosition = position;
    imageProcessor.setEdgePosition(position);
    renderImage();
  });
  
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
  
  controlPanel.setCallback('onBlockSizeChange', (size: any) => {
    appState.blockSize = size;
    imageProcessor.setBlockSize(size);
    renderImage();
  });
  
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
  
  controlPanel.setCallback('onShowLabelChange', (show: any) => {
    appState.showLabel = show;
    imageProcessor.setShowLabel(show);
    renderImage();
  });
  
  controlPanel.setCallback('onShowColorNameChange', (show: any) => {
    appState.showColorName = show;
    imageProcessor.setShowColorName(show);
    // 首次开启颜色名称时，自动设置为英文
    if (show && appState.firstTimeShowColorName) {
      appState.firstTimeShowColorName = false;
      appState.colorNameLanguage = 'en';
      imageProcessor.setColorNameLanguage('en');
      // 更新 UI：勾选英文开关
      const langToggle = document.getElementById('colorNameLangSelect') as HTMLInputElement;
      if (langToggle) langToggle.checked = true;
    }
    renderImage();
  });
  
  controlPanel.setCallback('onColorNameLangChange', (lang: any) => {
    appState.colorNameLanguage = lang;
    imageProcessor.setColorNameLanguage(lang);
    renderImage();
  });
  
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
}

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
    // 导入新图片时重置所有模式的颜色排序状态
    appState.modeColors = {
      vertical: [],
      grid: [],
      edge: []
    };
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

function renderImage(): void {
  imageProcessor.setDisplayMode(appState.displayMode);
  imageProcessor.setEdgePosition(appState.edgePosition);
  imageProcessor.setBlockSize(appState.blockSize);
  imageProcessor.setShowLabel(appState.showLabel);
  imageProcessor.setShowColorName(appState.showColorName);
  imageProcessor.setColorNameLanguage(appState.colorNameLanguage);
  imageProcessor.render();
}

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

// 阻止默认拖拽
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

// 关于弹窗事件处理
const aboutBtn = document.getElementById('aboutBtn');
const modal = document.getElementById('aboutModal');
const closeBtn = document.getElementById('closeModal');
const modalContent = modal?.querySelector('.modal-content');

if (aboutBtn && modal && closeBtn) {
  aboutBtn.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // 处理弹窗内容中的链接点击，在默认浏览器打开
  if (modalContent) {
    modalContent.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.preventDefault();
        const href = (target as HTMLAnchorElement).getAttribute('href');
        if (href) {
          try {
            const { openUrl } = await import('@tauri-apps/plugin-opener');
            await openUrl(href);
          } catch (err) {
            console.error('Failed to open link:', err);
          }
        }
      }
    });
  }
}
