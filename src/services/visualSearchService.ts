// Client-side Visual Search and Image Processing Engine for APP GANADERA
// Allows farmers to take/upload a photo of an animal in the chute/field and match it against the herd database.

export interface ImageFeatureVector {
  avgRed: number;
  avgGreen: number;
  avgBlue: number;
  brightness: number; // 0 - 255
  dominantHue: number; // 0 - 360
  histogram: number[]; // 24-bin normalized color distribution
  aspectRatio: number;
}

export interface VisualMatchResult {
  animalId: string;
  similarityScore: number; // 0 to 100%
  matchConfidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

export class VisualSearchService {
  /**
   * Resizes and compresses an uploaded image file into a lightweight data URL
   * suitable for storage in IndexedDB (max 800x800, JPEG 80%).
   */
  public static async compressImage(file: File, maxDim = 800, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extracts color histogram and perceptual features from an image URL / Data URL.
   */
  public static async extractFeatures(imageUrl: string): Promise<ImageFeatureVector> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const sampleSize = 64; // Fast downsampled grid for feature extraction
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(this.getDefaultFeatures());
          return;
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imgData.data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let totalBrightness = 0;

        // 8 bins for R, 8 bins for G, 8 bins for B = 24 bin color histogram
        const histogram = new Array(24).fill(0);
        const pixelCount = sampleSize * sampleSize;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          totalR += r;
          totalG += g;
          totalB += b;

          // Perceived brightness
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          totalBrightness += brightness;

          // Histogram binning
          const rBin = Math.min(7, Math.floor(r / 32));
          const gBin = Math.min(7, Math.floor(g / 32));
          const bBin = Math.min(7, Math.floor(b / 32));

          histogram[rBin]++;
          histogram[8 + gBin]++;
          histogram[16 + bBin]++;
        }

        // Normalize histogram
        const normalizedHist = histogram.map(val => val / (pixelCount * 3));

        const avgR = totalR / pixelCount;
        const avgG = totalG / pixelCount;
        const avgB = totalB / pixelCount;
        const avgBrightness = totalBrightness / pixelCount;

        // Dominant Hue calculation
        const max = Math.max(avgR, avgG, avgB);
        const min = Math.min(avgR, avgG, avgB);
        let hue = 0;

        if (max !== min) {
          const d = max - min;
          if (max === avgR) {
            hue = (avgG - avgB) / d + (avgG < avgB ? 6 : 0);
          } else if (max === avgG) {
            hue = (avgB - avgR) / d + 2;
          } else {
            hue = (avgR - avgG) / d + 4;
          }
          hue *= 60;
        }

        resolve({
          avgRed: avgR,
          avgGreen: avgG,
          avgBlue: avgB,
          brightness: avgBrightness,
          dominantHue: Math.round(hue),
          histogram: normalizedHist,
          aspectRatio: img.width / img.height
        });
      };

      img.onerror = () => {
        resolve(this.getDefaultFeatures());
      };

      img.src = imageUrl;
    });
  }

  /**
   * Calculates similarity distance between two visual feature vectors.
   * Returns a score between 0 and 100.
   */
  public static compareFeatures(a: ImageFeatureVector, b: ImageFeatureVector): number {
    // 1. Histogram intersection / cosine distance (weight: 60%)
    let histSim = 0;
    for (let i = 0; i < a.histogram.length; i++) {
      histSim += Math.min(a.histogram[i], b.histogram[i]);
    }
    const histScore = Math.min(100, histSim * 100);

    // 2. Brightness similarity (weight: 25%)
    const brightnessDiff = Math.abs(a.brightness - b.brightness);
    const brightnessScore = Math.max(0, 100 - (brightnessDiff / 255) * 100);

    // 3. Hue proximity (weight: 15%)
    const hueDiff = Math.min(Math.abs(a.dominantHue - b.dominantHue), 360 - Math.abs(a.dominantHue - b.dominantHue));
    const hueScore = Math.max(0, 100 - (hueDiff / 180) * 100);

    const totalSimilarity = (histScore * 0.60) + (brightnessScore * 0.25) + (hueScore * 0.15);
    return Math.round(Math.max(10, Math.min(99, totalSimilarity)));
  }

  /**
   * Search an animal among a list of animals using a query photo
   */
  public static async searchByPhoto(
    queryImageUrl: string,
    candidateAnimals: Array<{ id: string; earTagCode: string; name?: string; photoUrl?: string; breedComposition: any[] }>
  ): Promise<VisualMatchResult[]> {
    const queryFeatures = await this.extractFeatures(queryImageUrl);

    const results: VisualMatchResult[] = [];

    for (const animal of candidateAnimals) {
      if (!animal.photoUrl) continue;

      const targetFeatures = await this.extractFeatures(animal.photoUrl);
      const similarity = this.compareFeatures(queryFeatures, targetFeatures);

      const reasons: string[] = [];
      if (Math.abs(queryFeatures.brightness - targetFeatures.brightness) < 25) {
        reasons.push('Patrón de pelaje y luminosidad altamente coincidente');
      }
      if (Math.abs(queryFeatures.dominantHue - targetFeatures.dominantHue) < 30) {
        reasons.push('Tonalidad de capa concordante');
      }
      if (reasons.length === 0) {
        reasons.push('Similitud visual cromática');
      }

      const matchConfidence = similarity >= 75 ? 'high' : similarity >= 55 ? 'medium' : 'low';

      results.push({
        animalId: animal.id,
        similarityScore: similarity,
        matchConfidence,
        reasons
      });
    }

    // Sort descending by similarity score
    results.sort((a, b) => b.similarityScore - a.similarityScore);
    return results;
  }

  private static getDefaultFeatures(): ImageFeatureVector {
    return {
      avgRed: 128,
      avgGreen: 128,
      avgBlue: 128,
      brightness: 128,
      dominantHue: 0,
      histogram: new Array(24).fill(1 / 24),
      aspectRatio: 1.33
    };
  }
}
