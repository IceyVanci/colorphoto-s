/**
 * ImageProcessor - 图片处理模块
 * 负责渲染色块和处理图片导出
 */
import { getColorName } from './x11Colors';
import type { ColorInfo } from './colorExtractor';

export class ImageProcessor {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private originalImage: HTMLImageElement | null = null;
  private colors: ColorInfo[] = [];
  private displayMode: 'vertical' | 'edge' | 'grid' = 'vertical';
  private edgePosition: 'top' | 'bottom' | 'left' | 'right' = 'right';
  private blockSize: number = 150;
  private showLabel: boolean = true;
  private showColorName: boolean = true;
  private colorNameLanguage: 'cn' | 'en' = 'cn';
  
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private initialPositions: { x: number; y: number }[] = [];
  private blockPositions: { x: number; y: number; width: number; height: number }[] = [];
  
  // 色块位置数组（按模式独立存储）
  private modePositions: {
    vertical: { positions: { x: number; y: number; width: number; height: number }[]; userHasCustom: boolean };
    grid: { positions: { x: number; y: number; width: number; height: number }[]; userHasCustom: boolean };
    edge: { positions: { x: number; y: number; width: number; height: number }[]; userHasCustom: boolean };
  } = {
    vertical: { positions: [], userHasCustom: false },
    grid: { positions: [], userHasCustom: false },
    edge: { positions: [], userHasCustom: false }
  };

  initCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.setupDragEvents();
  }

  setImage(img: HTMLImageElement): void {
    this.originalImage = img;
    if (this.canvas) {
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.initBlockPositions();
    }
  }

  setColors(colors: ColorInfo[]): void {
    this.colors = colors;
    const modeData = this.modePositions[this.displayMode];
    
    if (!modeData.userHasCustom || colors.length !== modeData.positions.length) {
      if (this.displayMode === 'vertical' && modeData.positions.length > 0) {
        const centerX = modeData.positions.reduce((sum, p) => sum + p.x + p.width / 2, 0) / modeData.positions.length;
        const centerY = modeData.positions.reduce((sum, p) => sum + p.y + p.height / 2, 0) / modeData.positions.length;
        const totalHeight = colors.length * this.blockSize;
        const newStartY = centerY - totalHeight / 2;
        
        this.blockPositions = [];
        colors.forEach((_, index) => {
          this.blockPositions.push({
            x: centerX - this.blockSize / 2,
            y: newStartY + index * this.blockSize,
            width: this.blockSize,
            height: this.blockSize
          });
        });
        modeData.positions = [...this.blockPositions];
      } else {
        this.initBlockPositions();
      }
    } else {
      this.blockPositions = [...modeData.positions];
    }
  }

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

  setEdgePosition(position: 'top' | 'bottom' | 'left' | 'right'): void {
    this.edgePosition = position;
  }

  setBlockSize(newSize: number): void {
    const oldPositions = [...this.blockPositions];
    
    let centerX = 0, centerY = 0;
    if (this.blockPositions.length > 0) {
      centerX = this.blockPositions.reduce((sum, p) => sum + p.x + p.width / 2, 0) / this.blockPositions.length;
      centerY = this.blockPositions.reduce((sum, p) => sum + p.y + p.height / 2, 0) / this.blockPositions.length;
    }
    
    this.blockSize = newSize;
    
    if (this.displayMode === 'vertical') {
      const blockCount = this.blockPositions.length;
      const totalHeight = blockCount * this.blockSize;
      const newStartY = centerY - totalHeight / 2;
      
      this.blockPositions.forEach((pos, index) => {
        pos.width = this.blockSize;
        pos.height = this.blockSize;
        pos.x = oldPositions[index].x;
        pos.y = newStartY + index * this.blockSize;
      });
    } else if (this.displayMode === 'grid') {
      const totalWidth = 2 * this.blockSize;
      const totalHeight = 2 * this.blockSize;
      let newStartX = centerX - totalWidth / 2;
      let newStartY = centerY - totalHeight / 2;
      
      // 边界检查：确保方格在画布内
      if (this.canvas) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        newStartX = Math.max(0, Math.min(newStartX, canvasWidth - totalWidth));
        newStartY = Math.max(0, Math.min(newStartY, canvasHeight - totalHeight));
      }
      
      this.blockPositions.forEach((pos, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        pos.width = this.blockSize;
        pos.height = this.blockSize;
        pos.x = newStartX + col * this.blockSize;
        pos.y = newStartY + row * this.blockSize;
      });
    }
    
    this.render();
  }

  setShowLabel(show: boolean): void {
    this.showLabel = show;
  }

  setShowColorName(show: boolean): void {
    this.showColorName = show;
  }

  setColorNameLanguage(lang: 'cn' | 'en'): void {
    this.colorNameLanguage = lang;
  }

  private fillRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number, height: number,
    radius: number,
    options: { topLeft?: boolean; topRight?: boolean; bottomRight?: boolean; bottomLeft?: boolean } = {}
  ): void {
    const { topLeft = true, topRight = true, bottomRight = true, bottomLeft = true } = options;
    
    ctx.beginPath();
    
    if (topLeft) {
      ctx.moveTo(x + radius, y);
    } else {
      ctx.moveTo(x, y);
    }
    
    if (topRight) {
      ctx.lineTo(x + width - radius, y);
      ctx.arcTo(x + width, y, x + width, y + radius, radius);
    } else {
      ctx.lineTo(x + width, y);
    }
    
    if (bottomRight) {
      ctx.lineTo(x + width, y + height - radius);
      ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    } else {
      ctx.lineTo(x + width, y + height);
    }
    
    if (bottomLeft) {
      ctx.lineTo(x + radius, y + height);
      ctx.arcTo(x, y + height, x, y + height - radius, radius);
    } else {
      ctx.lineTo(x, y + height);
    }
    
    if (topLeft) {
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
    } else {
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
  }

  private initBlockPositions(): void {
    if (!this.canvas || !this.colors.length) return;
    
    const imgHeight = this.canvas.height;
    
    this.blockPositions = [];
    
    if (this.displayMode === 'vertical') {
      const startX = 10;
      const blockCount = this.colors.length;
      const totalHeight = blockCount * this.blockSize;
      const startY = Math.max(0, (imgHeight - totalHeight) / 2);
      
      this.colors.forEach((_, index) => {
        this.blockPositions.push({
          x: startX,
          y: startY + index * this.blockSize,
          width: this.blockSize,
          height: this.blockSize
        });
      });
    } else if (this.displayMode === 'grid') {
      const gridColors = this.colors.slice(0, 4);
      const startX = 10;
      const startY = 10;
      
      gridColors.forEach((_, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        this.blockPositions.push({
          x: startX + col * this.blockSize,
          y: startY + row * this.blockSize,
          width: this.blockSize,
          height: this.blockSize
        });
      });
    } else {
      this.updateEdgePositions();
    }
  }

  private updateEdgePositions(): void {
    if (!this.canvas) return;
    
    const imgWidth = this.canvas.width;
    const imgHeight = this.canvas.height;
    const isHorizontal = this.edgePosition === 'top' || this.edgePosition === 'bottom';
    
    let blockLen: number, startX: number, startY: number;
    
    if (isHorizontal) {
      blockLen = imgWidth / this.colors.length;
      startX = 0;
      startY = this.edgePosition === 'top' ? 0 : imgHeight - this.blockSize;
    } else {
      blockLen = imgHeight / this.colors.length;
      startX = this.edgePosition === 'left' ? 0 : imgWidth - this.blockSize;
      startY = 0;
    }
    
    this.blockPositions = [];
    this.colors.forEach((_, index) => {
      if (isHorizontal) {
        this.blockPositions.push({
          x: index * blockLen,
          y: startY,
          width: blockLen,
          height: this.blockSize
        });
      } else {
        this.blockPositions.push({
          x: startX,
          y: index * blockLen,
          width: this.blockSize,
          height: blockLen
        });
      }
    });
  }

  private setupDragEvents(): void {
    if (!this.canvas) return;
    
    const getCanvasCoords = (e: MouseEvent) => {
      const rect = this.canvas!.getBoundingClientRect();
      const scaleX = this.canvas!.width / rect.width;
      const scaleY = this.canvas!.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };
    
    const findBlockAt = (x: number, y: number): number => {
      for (let i = 0; i < this.blockPositions.length; i++) {
        const pos = this.blockPositions[i];
        if (x >= pos.x && x <= pos.x + pos.width &&
            y >= pos.y && y <= pos.y + pos.height) {
          return i;
        }
      }
      return -1;
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.displayMode === 'edge') return;
      
      const coords = getCanvasCoords(e);
      const index = findBlockAt(coords.x, coords.y);
      if (index >= 0) {
        this.isDragging = true;
        this.dragOffsetX = coords.x - this.blockPositions[0].x;
        this.dragOffsetY = coords.y - this.blockPositions[0].y;
        this.initialPositions = this.blockPositions.map(p => ({ x: p.x, y: p.y }));
        this.canvas!.style.cursor = 'grabbing';
      }
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const coords = getCanvasCoords(e);
        const deltaX = coords.x - this.dragOffsetX - this.initialPositions[0].x;
        const deltaY = coords.y - this.dragOffsetY - this.initialPositions[0].y;
        
        this.blockPositions.forEach((pos, i) => {
          pos.x = this.initialPositions[i].x + deltaX;
          pos.y = this.initialPositions[i].y + deltaY;
        });
        
        this.render();
      } else {
        if (this.displayMode !== 'vertical') {
          this.canvas!.style.cursor = 'default';
          return;
        }
        const coords = getCanvasCoords(e);
        const index = findBlockAt(coords.x, coords.y);
        this.canvas!.style.cursor = index >= 0 ? 'grab' : 'default';
      }
    });
    
    this.canvas.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        // 保存拖拽后的位置到当前模式
        this.modePositions[this.displayMode].positions = [...this.blockPositions];
        this.modePositions[this.displayMode].userHasCustom = true;
        this.canvas!.style.cursor = 'default';
      }
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        // 保存拖拽后的位置到当前模式
        this.modePositions[this.displayMode].positions = [...this.blockPositions];
        this.modePositions[this.displayMode].userHasCustom = true;
        this.canvas!.style.cursor = 'default';
      }
    });
  }

  render(): void {
    if (!this.canvas || !this.ctx || !this.originalImage) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);

    this.renderBlocks();
  }

  private renderBlocks(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const renderColors = this.displayMode === 'grid' ? this.colors.slice(0, 4) : this.colors;
    
    const cornerRadius = this.blockSize * 0.12;
    
    renderColors.forEach((color, index) => {
      const pos = this.blockPositions[index] || { x: 0, y: 0, width: this.blockSize, height: this.blockSize };
      const isFirst = index === 0;
      const isLast = index === renderColors.length - 1;
      
      let roundedCorners = { topLeft: false, topRight: false, bottomRight: false, bottomLeft: false };
      
      if (this.displayMode === 'vertical') {
        if (isFirst) {
          roundedCorners = { topLeft: true, topRight: true, bottomRight: false, bottomLeft: false };
        } else if (isLast) {
          roundedCorners = { topLeft: false, topRight: false, bottomRight: true, bottomLeft: true };
        }
      } else if (this.displayMode === 'grid') {
        if (index === 0) roundedCorners = { topLeft: true, topRight: false, bottomRight: false, bottomLeft: false };
        else if (index === 1) roundedCorners = { topLeft: false, topRight: true, bottomRight: false, bottomLeft: false };
        else if (index === 2) roundedCorners = { topLeft: false, topRight: false, bottomRight: false, bottomLeft: true };
        else if (index === 3) roundedCorners = { topLeft: false, topRight: false, bottomRight: true, bottomLeft: false };
      }
      
      ctx.fillStyle = color.hex;
      this.fillRoundedRect(ctx, pos.x, pos.y, pos.width, pos.height, cornerRadius, roundedCorners);
      
      if (this.displayMode !== 'grid') {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (this.showLabel) {
        const text = color.hex;
        
        if (this.displayMode === 'vertical') {
          const labelX = pos.x + pos.width + 5;
          const labelY = pos.y;
          const labelHeight = pos.height;
          
          const fontSize = Math.max(24, labelHeight / 3);
          ctx.font = `bold ${fontSize}px 'MiSans', monospace`;
          
          const strokeWidth = Math.max(1, fontSize * 0.06);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = strokeWidth;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.strokeText(text, labelX, labelY + labelHeight / 2);
          ctx.fillStyle = color.hex;
          ctx.fillText(text, labelX, labelY + labelHeight / 2);
          
          if (this.showColorName) {
            let colorName = getColorName(color.hex, this.colorNameLanguage);
            if (this.colorNameLanguage === 'cn' && colorName.endsWith('色')) {
              colorName = colorName.slice(0, -1);
            }
            const nameY = labelY + labelHeight / 2 + fontSize + 5;
            ctx.strokeText(colorName, labelX, nameY);
            ctx.fillStyle = color.hex;
            ctx.fillText(colorName, labelX, nameY);
          }
          
        } else if (this.displayMode === 'grid') {
          const nameOffset = pos.width * 0.05;
          const nameFontSize = pos.width / 5;
          
          if (this.showColorName) {
            let colorName = getColorName(color.hex, this.colorNameLanguage);
            if (this.colorNameLanguage === 'cn' && colorName.endsWith('色')) {
              colorName = colorName.slice(0, -1);
            }
            
            ctx.font = `bold ${nameFontSize}px 'MiSans', monospace`;
            const nameStrokeWidth = Math.max(1, nameFontSize * 0.08);
            const nameX = pos.x + nameOffset;
            const maxWidth = pos.width - nameOffset * 2;
            
            if (this.colorNameLanguage === 'en' && ctx.measureText(colorName).width > maxWidth) {
              const lines: string[] = [];
              let uppercaseBreaks: number[] = [];
              
              for (let i = 1; i < colorName.length; i++) {
                if (colorName[i] >= 'A' && colorName[i] <= 'Z') {
                  uppercaseBreaks.push(i);
                }
              }
              
              if (uppercaseBreaks.length >= 2) {
                const break1 = uppercaseBreaks[Math.floor(uppercaseBreaks.length / 3)];
                const break2 = uppercaseBreaks[Math.floor(uppercaseBreaks.length * 2 / 3)];
                const line1 = colorName.substring(0, break1);
                const line2 = colorName.substring(break1, break2);
                const line3 = colorName.substring(break2);
                if (line1) lines.push(line1);
                if (line2) lines.push(line2);
                if (line3) lines.push(line3);
              } else if (uppercaseBreaks.length === 1) {
                const break1 = uppercaseBreaks[0];
                const line1 = colorName.substring(0, break1);
                const line2 = colorName.substring(break1);
                if (ctx.measureText(line1).width < maxWidth) {
                  if (line1) lines.push(line1);
                  if (line2) lines.push(line2);
                } else {
                  lines.push(colorName);
                }
              } else {
                lines.push(colorName);
              }
              
              ctx.strokeStyle = '#000';
              ctx.lineWidth = nameStrokeWidth;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              lines.forEach((line, idx) => {
                if (line) {
                  const y = pos.y + nameOffset + idx * nameFontSize;
                  ctx.strokeText(line, nameX, y);
                  ctx.fillStyle = color.hex;
                  ctx.fillText(line, nameX, y);
                }
              });
            } else {
              ctx.strokeStyle = '#000';
              ctx.lineWidth = nameStrokeWidth;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              ctx.strokeText(colorName, nameX, pos.y + nameOffset);
              ctx.fillStyle = color.hex;
              ctx.fillText(colorName, nameX, pos.y + nameOffset);
            }
          }
          
          const hexTargetWidth = pos.width * 0.8;
          ctx.font = `bold 24px 'MiSans', monospace`;
          const baseWidth = ctx.measureText(text).width;
          const hexFontSize = Math.floor(24 * hexTargetWidth / baseWidth);
          const hexActualFontSize = Math.max(12, hexFontSize);
          
          ctx.font = `bold ${hexActualFontSize}px 'MiSans', monospace`;
          const outerStrokeWidth = Math.max(1, hexActualFontSize * 0.08);
          const innerStrokeWidth = outerStrokeWidth / 2;
          
          const hexX = pos.x + pos.width / 2;
          const hexY = pos.y + pos.height - nameOffset;
          
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          const outerStrokeColor = color.hex.toUpperCase() === '#D3D3D3' ? '#fff' : '#D3D3D3';
          ctx.strokeStyle = outerStrokeColor;
          ctx.lineWidth = outerStrokeWidth;
          ctx.strokeText(text, hexX, hexY);
          
          ctx.strokeStyle = '#000';
          ctx.lineWidth = innerStrokeWidth;
          ctx.strokeText(text, hexX, hexY);
          
          ctx.fillStyle = color.hex;
          ctx.fillText(text, hexX, hexY);
          
        } else {
          const centerX = pos.x + pos.width / 2;
          const centerY = pos.y + pos.height / 2;
          
          const shortSide = Math.min(pos.width, pos.height);
          const fontSize = shortSide / 3;
          const strokeWidth = Math.max(1, fontSize * 0.06);
          
          ctx.font = `bold ${fontSize}px 'MiSans', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const isVerticalLabel = this.edgePosition === 'left' || this.edgePosition === 'right';
          
          if (isVerticalLabel) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(-Math.PI / 2);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(text, 0, 0);
            ctx.fillStyle = '#fff';
            ctx.fillText(text, 0, 0);
            ctx.restore();
          } else {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(text, centerX, centerY);
            ctx.fillStyle = '#fff';
            ctx.fillText(text, centerX, centerY);
          }
        }
      }
    });
  }

  exportToDataUrl(): string | null {
    if (!this.canvas) return null;
    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  getImageSize(): { width: number; height: number } {
    if (!this.originalImage) return { width: 0, height: 0 };
    return {
      width: this.originalImage.width,
      height: this.originalImage.height
    };
  }
}
