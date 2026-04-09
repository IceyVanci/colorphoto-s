/**
 * ImagePreview Component - 图片预览组件
 */
import type { ColorInfo } from '../utils/colorExtractor';

export class ImagePreview {
  private canvas: HTMLCanvasElement | null;
  private colorBlocksContainer: HTMLElement | null;
  private container: HTMLElement | null;
  private ctx: CanvasRenderingContext2D | null = null;
  private image: HTMLImageElement | null = null;
  private colors: ColorInfo[] = [];
  private draggedIndex: number | null = null;
  private onColorsChange: ((colors: ColorInfo[]) => void) | null = null;

  constructor(canvasId: string, colorBlocksId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.colorBlocksContainer = document.getElementById(colorBlocksId);
    this.container = this.canvas?.parentElement || null;
    
    if (!this.canvas || !this.colorBlocksContainer) {
      console.error('ImagePreview: canvas or colorBlocks not found');
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
  }
  
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
  
  setColors(colors: ColorInfo[]): void {
    this.colors = colors;
    this.renderColorBlocks();
  }
  
  private renderColorBlocks(): void {
    if (!this.colorBlocksContainer) return;
    
    this.colorBlocksContainer.innerHTML = '';
    this.colorBlocksContainer.className = 'color-blocks vertical';
    
    this.colors.forEach((color, index) => {
      const block = document.createElement('div');
      block.className = 'color-block';
      block.draggable = true;
      block.dataset.index = String(index);
      
      const inner = document.createElement('div');
      inner.className = 'color-block-inner';
      inner.style.backgroundColor = color.hex;
      
      const label = document.createElement('div');
      label.className = 'color-label';
      label.textContent = color.hex;
      
      block.appendChild(inner);
      block.appendChild(label);
      
      block.addEventListener('dragstart', (e) => {
        this.draggedIndex = index;
        e.dataTransfer!.effectAllowed = 'move';
      });
      
      block.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
      });
      
      block.addEventListener('drop', (e) => {
        e.preventDefault();
        if (this.draggedIndex !== null && this.draggedIndex !== index) {
          this.swapColors(this.draggedIndex, index);
        }
        this.draggedIndex = null;
      });
      
      this.colorBlocksContainer!.appendChild(block);
    });
  }
  
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
  
  setOnColorsChange(callback: (colors: ColorInfo[]) => void): void {
    this.onColorsChange = callback;
  }
  
  show(): void {
    if (this.container) {
      this.container.style.display = 'flex';
    }
  }
  
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
  
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
  
  getImage(): HTMLImageElement | null {
    return this.image;
  }
}
