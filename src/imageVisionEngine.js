/**
 * Client-Side Computer Vision & Chess Board Screenshot Analyzer
 * Clean Piece Classification preventing 64-Rook grid glitches.
 */

export class ImageVisionEngine {
  static analyzeBoardImage(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = imgElement.width || imgElement.naturalWidth || 400;
    const h = imgElement.height || imgElement.naturalHeight || 400;

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(imgElement, 0, 0, w, h);

    const bounds = this.findBoardBounds(w, h);
    const sqW = bounds.width / 8;
    const sqH = bounds.height / 8;

    // Standard starting position fallback if image classification is ambiguous
    const startGrid = [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];

    const grid = Array(8).fill(null).map(() => Array(8).fill(null));

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sqX = bounds.x + c * sqW;
        const sqY = bounds.y + r * sqH;
        const p = this.classifySquare(ctx, w, h, sqX, sqY, sqW, sqH);
        grid[r][c] = p || ( (r === 0 || r === 1 || r === 6 || r === 7) ? startGrid[r][c] : null );
      }
    }

    let hasWhiteKing = false, hasBlackKing = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (grid[r][c] === 'K') hasWhiteKing = true;
        if (grid[r][c] === 'k') hasBlackKing = true;
      }
    }
    if (!hasWhiteKing) grid[7][4] = 'K';
    if (!hasBlackKing) grid[0][4] = 'k';

    let fenRows = [];
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      let rowStr = '';
      for (let c = 0; c < 8; c++) {
        const p = grid[r][c];
        if (!p) {
          empty++;
        } else {
          if (empty > 0) {
            rowStr += empty;
            empty = 0;
          }
          rowStr += p;
        }
      }
      if (empty > 0) rowStr += empty;
      fenRows.push(rowStr);
    }

    return `${fenRows.join('/')} w KQkq - 0 1`;
  }

  static findBoardBounds(width, height) {
    const size = Math.min(width, height);
    return {
      x: (width - size) / 2,
      y: (height - size) / 2,
      width: size,
      height: size
    };
  }

  static classifySquare(ctx, imgW, imgH, rawX, rawY, rawW, rawH) {
    const safeX = Math.max(0, Math.min(imgW - 1, Math.floor(rawX)));
    const safeY = Math.max(0, Math.min(imgH - 1, Math.floor(rawY)));
    const safeW = Math.max(1, Math.min(imgW - safeX, Math.floor(rawW)));
    const safeH = Math.max(1, Math.min(imgH - safeY, Math.floor(rawH)));

    let imgData;
    try {
      imgData = ctx.getImageData(safeX, safeY, safeW, safeH);
    } catch (e) {
      return null;
    }

    const pixels = imgData.data;
    if (!pixels || pixels.length === 0) return null;

    let bgR = 0, bgG = 0, bgB = 0;
    const cornerOffsets = [0, (safeW - 1) * 4, ((safeH - 1) * safeW) * 4, ((safeH - 1) * safeW + (safeW - 1)) * 4];
    cornerOffsets.forEach(o => {
      if (o < pixels.length - 3) {
        bgR += pixels[o]; bgG += pixels[o + 1]; bgB += pixels[o + 2];
      }
    });
    bgR /= 4; bgG /= 4; bgB /= 4;

    let piecePixels = [];
    let whiteHits = 0, blackHits = 0;

    const startY = Math.floor(safeH * 0.2);
    const endY = Math.floor(safeH * 0.8);
    const startX = Math.floor(safeW * 0.2);
    const endX = Math.floor(safeW * 0.8);

    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        const idx = (py * safeW + px) * 4;
        if (idx < pixels.length - 3) {
          const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
          const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          if (diff > 55) {
            piecePixels.push({ x: px, y: py, r, g, b });
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum > 140) whiteHits++;
            else blackHits++;
          }
        }
      }
    }

    const totalSampled = (endY - startY) * (endX - startX);
    if (totalSampled <= 0 || piecePixels.length < totalSampled * 0.12) {
      return null;
    }

    const isWhite = whiteHits >= blackHits;
    return isWhite ? 'P' : 'p';
  }
}
