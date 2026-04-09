/**
 * ControlPanel Component - 参数调节面板组件
 */
import type { ColorInfo } from '../utils/colorExtractor';

export class ControlPanel {
  private displayModeRadios: NodeListOf<HTMLInputElement>;
  private edgePositionSection: HTMLElement | null;
  private edgeButtons: NodeListOf<HTMLButtonElement>;
  private blockSizeSlider: HTMLInputElement | null;
  private blockSizeValue: HTMLElement | null;
  private colorSortSelect: HTMLSelectElement | null;
  private showLabelToggle: HTMLInputElement | null;
  private showColorNameToggle: HTMLInputElement | null;
  private colorNameLangSelect: HTMLInputElement | null;
  private colorNameSection: HTMLElement | null;
  private colorNameLangSection: HTMLElement | null;
  private colorCountSection: HTMLElement | null;
  private colorList: HTMLElement | null;
  private importBtn: HTMLButtonElement | null;
  private exportBtn: HTMLButtonElement | null;
  private colorCountRadios: NodeListOf<HTMLInputElement>;
  
  private state: {
    displayMode: string;
    edgePosition: string;
    blockSize: number;
    colorSort: string;
    showLabel: boolean;
    colors: ColorInfo[];
  };
  
  private callbacks: {
    onDisplayModeChange: (mode: string) => void;
    onEdgePositionChange: (position: string) => void;
    onBlockSizeChange: (size: number) => void;
    onColorCountChange: (count: number) => void;
    onColorSortChange: (sort: string) => void;
    onShowLabelChange: (show: boolean) => void;
    onShowColorNameChange: (show: boolean) => void;
    onColorNameLangChange: (lang: string) => void;
    onImport: () => void;
    onExport: () => void;
  };

  constructor() {
    this.displayModeRadios = document.querySelectorAll('input[name="displayMode"]');
    this.edgePositionSection = document.getElementById('edgePositionSection');
    this.edgeButtons = document.querySelectorAll('.edge-btn');
    this.blockSizeSlider = document.getElementById('blockSizeSlider') as HTMLInputElement;
    this.blockSizeValue = document.getElementById('blockSizeValue');
    this.colorSortSelect = document.getElementById('colorSortSelect') as HTMLSelectElement;
    this.showLabelToggle = document.getElementById('showLabelToggle') as HTMLInputElement;
    this.showColorNameToggle = document.getElementById('showColorNameToggle') as HTMLInputElement;
    this.colorNameLangSelect = document.getElementById('colorNameLangSelect') as HTMLInputElement;
    this.colorNameSection = document.getElementById('colorNameSection');
    this.colorNameLangSection = document.getElementById('colorNameLangSection');
    this.colorCountSection = document.getElementById('colorCountSection');
    this.colorList = document.getElementById('colorList');
    this.importBtn = document.getElementById('importBtn') as HTMLButtonElement;
    this.exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    this.colorCountRadios = document.querySelectorAll('input[name="colorCount"]');
    
    this.state = {
      displayMode: 'vertical',
      edgePosition: 'right',
      blockSize: 150,
      colorSort: 'brightness',
      showLabel: true,
      colors: []
    };
    
    this.callbacks = {
      onDisplayModeChange: () => {},
      onEdgePositionChange: () => {},
      onBlockSizeChange: () => {},
      onColorCountChange: () => {},
      onColorSortChange: () => {},
      onShowLabelChange: () => {},
      onShowColorNameChange: () => {},
      onColorNameLangChange: () => {},
      onImport: () => {},
      onExport: () => {}
    };
    
    this.init();
  }
  
  private init(): void {
    this.displayModeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.state.displayMode = (e.target as HTMLInputElement).value;
        this.updateEdgePositionVisibility();
        this.callbacks.onDisplayModeChange(this.state.displayMode);
      });
    });
    
    this.edgeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.edgeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.edgePosition = btn.dataset.position || 'right';
        this.callbacks.onEdgePositionChange(this.state.edgePosition);
      });
    });
    
    if (this.blockSizeSlider) {
      this.blockSizeSlider.addEventListener('input', (e) => {
        this.state.blockSize = parseInt((e.target as HTMLInputElement).value);
        if (this.blockSizeValue) {
          this.blockSizeValue.textContent = this.state.blockSize + 'px';
        }
        this.callbacks.onBlockSizeChange(this.state.blockSize);
      });
    }
    
    if (this.colorSortSelect) {
      this.colorSortSelect.addEventListener('change', (e) => {
        this.state.colorSort = (e.target as HTMLSelectElement).value;
        this.callbacks.onColorSortChange(this.state.colorSort);
      });
    }
    
    if (this.showLabelToggle) {
      this.showLabelToggle.addEventListener('change', (e) => {
        this.state.showLabel = (e.target as HTMLInputElement).checked;
        this.callbacks.onShowLabelChange(this.state.showLabel);
      });
    }
    
    this.colorCountRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const count = parseInt((e.target as HTMLInputElement).value);
        this.callbacks.onColorCountChange(count);
      });
    });
    
    if (this.showColorNameToggle) {
      this.showColorNameToggle.addEventListener('change', (e) => {
        this.callbacks.onShowColorNameChange((e.target as HTMLInputElement).checked);
      });
    }
    
    if (this.colorNameLangSelect) {
      this.colorNameLangSelect.addEventListener('change', (e) => {
        const lang = (e.target as HTMLInputElement).checked ? 'en' : 'cn';
        this.callbacks.onColorNameLangChange(lang);
      });
    }
    
    if (this.importBtn) {
      this.importBtn.addEventListener('click', () => {
        this.callbacks.onImport();
      });
    }
    
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => {
        this.callbacks.onExport();
      });
    }
  }
  
  private updateEdgePositionVisibility(): void {
    if (this.edgePositionSection) {
      this.edgePositionSection.style.display = 
        this.state.displayMode === 'edge' ? 'block' : 'none';
    }
    if (this.colorNameSection) {
      this.colorNameSection.style.display = 
        (this.state.displayMode === 'vertical' || this.state.displayMode === 'grid') ? 'block' : 'none';
    }
    if (this.colorNameLangSection) {
      this.colorNameLangSection.style.display = 
        (this.state.displayMode === 'vertical' || this.state.displayMode === 'grid') ? 'block' : 'none';
    }
    if (this.colorCountSection) {
      this.colorCountSection.style.display = 
        this.state.displayMode === 'vertical' ? 'block' : 'none';
    }
  }
  
  setColors(colors: ColorInfo[]): void {
    this.state.colors = colors;
    this.renderColorList();
  }
  
  private renderColorList(): void {
    if (!this.colorList) return;
    
    this.colorList.innerHTML = '';
    
    this.state.colors.forEach((color) => {
      const item = document.createElement('div');
      item.className = 'color-item';
      
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color.hex;
      
      const hex = document.createElement('span');
      hex.className = 'color-hex';
      hex.textContent = color.hex;
      
      item.appendChild(swatch);
      item.appendChild(hex);
      
      this.colorList!.appendChild(item);
    });
  }
  
  setExportEnabled(enabled: boolean): void {
    if (this.exportBtn) {
      this.exportBtn.disabled = !enabled;
    }
  }
  
  setCallback(name: keyof typeof this.callbacks, callback: (arg: any) => void): void {
    if (name in this.callbacks) {
      (this.callbacks as any)[name] = callback;
    }
  }
}
