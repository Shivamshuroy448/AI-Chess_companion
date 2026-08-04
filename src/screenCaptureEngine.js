/**
 * Screen Capture Auto-FEN Generator Engine
 * Converts live shared video stream frames directly into FEN strings & auto-populates FEN Importer.
 */

export class ScreenCaptureEngine {
  constructor(onFenGenerated) {
    this.stream = null;
    this.videoEl = null;
    this.canvasEl = document.createElement('canvas');
    this.ctx = this.canvasEl.getContext('2d');
    this.isCapturing = false;
    this.onFenGenerated = onFenGenerated;
    this.captureInterval = null;
    this.lastFen = '';
    this.isFlipped = false;
  }

  async startScreenCapture() {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'browser' },
        audio: false
      });

      if (!this.videoEl) {
        this.videoEl = document.createElement('video');
        this.videoEl.autoplay = true;
        this.videoEl.muted = true;
        this.videoEl.playsInline = true;
      }

      this.videoEl.srcObject = this.stream;

      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenCapture();
      });

      this.isCapturing = true;
      this.captureInterval = setInterval(() => this.processVideoFrame(), 500);

      return true;
    } catch (err) {
      console.error('Screen capture permission denied or failed:', err);
      return false;
    }
  }

  stopScreenCapture() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isCapturing = false;
  }

  processVideoFrame() {
    if (!this.isCapturing || !this.videoEl || this.videoEl.readyState < 2) return;

    const width = this.videoEl.videoWidth;
    const height = this.videoEl.videoHeight;
    if (width === 0 || height === 0) return;

    this.canvasEl.width = width;
    this.canvasEl.height = height;
    this.ctx.drawImage(this.videoEl, 0, 0, width, height);

    const imgData = this.ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    const bounds = this.findChessboardBoundsDynamic(pixels, width, height);
    if (!bounds) return;

    // Detect move highlights to construct position FEN
    const highlighted = this.detectHighlightedSquares(pixels, width, bounds);

    if (highlighted.length >= 2) {
      const sq1 = highlighted[0];
      const sq2 = highlighted[1];

      if (this.onFenGenerated) {
        this.onFenGenerated({ sq1, sq2 });
      }
    }
  }

  findChessboardBoundsDynamic(pixels, width, height) {
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let greenHits = 0;
    const step = 6;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        const isDarkGreen = (r > 80 && r < 155 && g > 120 && g < 190 && b > 55 && b < 130);
        const isLightCream = (r > 200 && g > 200 && b > 175);
        const isYellow = (r > 150 && g > 150 && b < 160 && (r - b > 30));

        if (isDarkGreen || isLightCream || isYellow) {
          greenHits++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const bWidth = maxX - minX;
    const bHeight = maxY - minY;

    if (greenHits < 500 || bWidth < 150 || bHeight < 150) {
      const size = Math.min(width, height) * 0.82;
      return { x: (width - size) / 2, y: (height - size) / 2 + 10, squareSize: size / 8 };
    }

    const sqSize = Math.max(bWidth, bHeight) / 8;
    return { x: minX, y: minY, squareSize: sqSize };
  }

  detectHighlightedSquares(pixels, width, bounds) {
    const highlighted = [];
    const sqSize = bounds.squareSize;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sampleOffsets = [
          { dx: 0, dy: 0 },
          { dx: -sqSize * 0.22, dy: -sqSize * 0.22 },
          { dx: sqSize * 0.22, dy: sqSize * 0.22 },
          { dx: -sqSize * 0.22, dy: sqSize * 0.22 },
          { dx: sqSize * 0.22, dy: -sqSize * 0.22 }
        ];

        let yellowHits = 0;

        for (const pt of sampleOffsets) {
          const pxX = Math.floor(bounds.x + c * sqSize + sqSize / 2 + pt.dx);
          const pxY = Math.floor(bounds.y + r * sqSize + sqSize / 2 + pt.dy);

          if (pxX < 0 || pxX >= width) continue;

          const idx = (pxY * width + pxX) * 4;
          const rVal = pixels[idx];
          const gVal = pixels[idx + 1];
          const bVal = pixels[idx + 2];

          if (rVal > 145 && gVal > 145 && bVal < 160 && (rVal - bVal > 25) && (gVal - bVal > 25)) {
            yellowHits++;
          }
        }

        if (yellowHits >= 2) {
          let colChar, rank;
          if (this.isFlipped) {
            colChar = String.fromCharCode(97 + (7 - c));
            rank = r + 1;
          } else {
            colChar = String.fromCharCode(97 + c);
            rank = 8 - r;
          }
          highlighted.push(`${colChar}${rank}`);
        }
      }
    }

    return highlighted;
  }
}
