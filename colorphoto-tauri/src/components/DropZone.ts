/**
 * DropZone Component - 拖拽区域组件
 */

export class DropZone {
  private element: HTMLElement | null;
  private onFileSelect: (file: File) => void;
  private fileInput: HTMLInputElement | null;

  constructor(elementId: string, options: { onFileSelect: (file: File) => void } = { onFileSelect: () => {} }) {
    this.element = document.getElementById(elementId);
    this.onFileSelect = options.onFileSelect || (() => {});
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    
    if (!this.element) {
      console.error('DropZone: element not found');
      return;
    }
    
    this.init();
  }
  
  private init(): void {
    if (!this.element) return;
    
    this.element.addEventListener('click', () => {
      if (this.fileInput) {
        this.fileInput.click();
      }
    });
    
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && this.isValidImage(file)) {
          this.onFileSelect(file);
        }
      });
    }
    
    this.element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element!.classList.add('drag-over');
    });
    
    this.element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element!.classList.remove('drag-over');
    });
    
    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element!.classList.remove('drag-over');
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (this.isValidImage(file)) {
          this.onFileSelect(file);
        }
      }
    });
    
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }
  
  private isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg'];
    return validTypes.includes(file.type);
  }
  
  show(): void {
    if (this.element) {
      this.element.style.display = 'flex';
    }
  }
  
  hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }
}
