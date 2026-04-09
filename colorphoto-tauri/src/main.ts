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
  blockSize: number;
  exifData: any | null;
  originalFilePath: string | null;
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
  showColorName: true,
  colorNameLanguage: 'cn',
  blockSize: 150,
  exifData: null,
  originalFilePath: null
};

// 组件实例
let colorExtractor: ColorExtractor;
let imageProcessor: ImageProcessor;
let imagePreview: ImagePreview;
let controlPanel: ControlPanel;

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
    onFileSelect: handleDropZoneFileSelect
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
    appState.displayMode = mode;
    imageProcessor.setDisplayMode(mode);
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
    if (appState.allExtractedColors.length >= 5) {
      const sortedColors = colorExtractor.sortColors(appState.allExtractedColors, appState.colorSort);
      let limitedColors: ColorInfo[];
      if (count === 3) {
        limitedColors = [sortedColors[1], sortedColors[2], sortedColors[3]];
      } else {
        limitedColors = sortedColors.slice(0, count);
      }
      appState.extractedColors = limitedColors;
      imageProcessor.setColors(limitedColors);
      imagePreview.setColors(limitedColors);
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
    renderImage();
  });
  
  controlPanel.setCallback('onColorNameLangChange', (lang: any) => {
    appState.colorNameLanguage = lang;
    imageProcessor.setColorNameLanguage(lang);
    renderImage();
  });
  
  imagePreview.setOnColorsChange((colors: ColorInfo[]) => {
    appState.extractedColors = colors;
    imageProcessor.setColors(colors);
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
    
    if (path) {
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
    
    const result = await invoke<SaveResult>('save_file', { 
      data: exportData, 
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
