/**
 * ColorExtractor - 颜色提取类
 * 使用K-means聚类算法从图片中提取主要颜色
 */
export class ColorExtractor {
  colorCount: number;

  constructor(colorCount: number = 5) {
    this.colorCount = colorCount;
  }

  /**
   * 从图片数据中提取主要颜色
   */
  extract(imageData: ImageData): ColorInfo[] {
    const pixels = this.getPixelArray(imageData);
    const clusters = this.kMeansClustering(pixels, this.colorCount);
    const colors = this.formatColors(clusters);
    return colors;
  }

  getPixelArray(imageData: ImageData): number[][] {
    const pixels: number[][] = [];
    const data = imageData.data;
    const step = 10;
    
    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a < 128) continue;
      pixels.push([r, g, b]);
    }
    
    return pixels;
  }

  kMeansClustering(pixels: number[][], k: number, maxIterations: number = 20): number[][] {
    if (pixels.length === 0) {
      return Array(k).fill(null).map(() => [128, 128, 128]);
    }

    let centroids = this.initializeCentroids(pixels, k);
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const clusters: number[][][] = Array(k).fill(null).map(() => []);
      
      for (const pixel of pixels) {
        let minDist = Infinity;
        let closestIdx = 0;
        
        for (let i = 0; i < centroids.length; i++) {
          const dist = this.colorDistance(pixel, centroids[i]);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = i;
          }
        }
        
        clusters[closestIdx].push(pixel);
      }
      
      const newCentroids = clusters.map((cluster, idx) => {
        if (cluster.length === 0) {
          return centroids[idx];
        }
        return this.calculateCentroid(cluster);
      });
      
      let converged = true;
      for (let i = 0; i < k; i++) {
        if (this.colorDistance(centroids[i], newCentroids[i]) > 1) {
          converged = false;
          break;
        }
      }
      
      centroids = newCentroids;
      
      if (converged) break;
    }
    
    return centroids;
  }

  initializeCentroids(pixels: number[][], k: number): number[][] {
    const centroids: number[][] = [];
    centroids.push([...pixels[Math.floor(Math.random() * pixels.length)]]);
    
    while (centroids.length < k) {
      const distances = pixels.map(pixel => {
        let minDist = Infinity;
        for (const centroid of centroids) {
          const dist = this.colorDistance(pixel, centroid);
          if (dist < minDist) minDist = dist;
        }
        return minDist * minDist;
      });
      
      const totalDist = distances.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalDist;
      
      for (let i = 0; i < pixels.length; i++) {
        random -= distances[i];
        if (random <= 0) {
          centroids.push([...pixels[i]]);
          break;
        }
      }
    }
    
    return centroids;
  }

  colorDistance(c1: number[], c2: number[]): number {
    const dr = c1[0] - c2[0];
    const dg = c1[1] - c2[1];
    const db = c1[2] - c2[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  calculateCentroid(pixels: number[][]): number[] {
    let r = 0, g = 0, b = 0;
    for (const pixel of pixels) {
      r += pixel[0];
      g += pixel[1];
      b += pixel[2];
    }
    const len = pixels.length;
    return [
      Math.round(r / len),
      Math.round(g / len),
      Math.round(b / len)
    ];
  }

  formatColors(centroids: number[][]): ColorInfo[] {
    return centroids.map((centroid, index) => ({
      hex: this.rgbToHex(centroid[0], centroid[1], centroid[2]),
      rgb: [centroid[0], centroid[1], centroid[2]] as [number, number, number],
      position: index,
      label: this.rgbToHex(centroid[0], centroid[1], centroid[2]),
      brightness: this.getBrightness(centroid),
      hue: this.getHue(centroid),
      saturation: this.getSaturation(centroid)
    }));
  }

  rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number): string => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  getBrightness(rgb: number[]): number {
    return (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114);
  }

  getHue(rgb: number[]): number {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    if (max === min) return 0;
    
    let h: number;
    if (max === r) {
      h = (g - b) / (max - min);
    } else if (max === g) {
      h = 2 + (b - r) / (max - min);
    } else {
      h = 4 + (r - g) / (max - min);
    }
    
    h *= 60;
    if (h < 0) h += 360;
    
    return h;
  }

  getSaturation(rgb: number[]): number {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    if (max === 0) return 0;
    
    return (max - min) / max;
  }

  sortColors(colors: ColorInfo[], sortType: string): ColorInfo[] {
    const sortedColors = [...colors];
    
    switch (sortType) {
      case 'brightness':
        sortedColors.sort((a, b) => b.brightness - a.brightness);
        break;
      case 'hue':
        sortedColors.sort((a, b) => a.hue - b.hue);
        break;
      case 'saturation':
        sortedColors.sort((a, b) => b.saturation - a.saturation);
        break;
    }
    
    sortedColors.forEach((color, index) => {
      color.position = index;
    });
    
    return sortedColors;
  }
}

export interface ColorInfo {
  hex: string;
  rgb: [number, number, number];
  position: number;
  label: string;
  brightness: number;
  hue: number;
  saturation: number;
}
