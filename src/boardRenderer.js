/**
 * 100% Crisp SVG Piece Graphics & Element-Anchored Move Overlay
 * Anchors move arrows and square target badges directly to the HTML DOM square offsets (offsetLeft/offsetTop).
 */

// Official High-Definition Crisp SVG Piece Definitions
const PIECE_SVGS = {
  wP: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  wN: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,8.5 C 14.5,9.5 16.5,9.506 17.5,8.5 C 18.5,9.5 22.5,9.5 21.5,8.5 C 22.5,9.5 22.5,10 22.5,10" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/><circle cx="15" cy="13.5" r="1.5" fill="#000000"/></svg>`,

  wB: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,36 C 12.39,35.53 18.11,35.04 22.5,35.04 C 26.89,35.04 32.61,35.53 36,36 C 36,36 38.5,37.5 38.5,38.5 C 38.5,39.5 36,40 36,40 L 9,40 C 9,40 6.5,39.5 6.5,38.5 C 6.5,37.5 9,36 9,36 z" fill="#ffffff"/><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 L 15,30 C 15,30 14.5,30.5 15,32 z" fill="#ffffff"/><path d="M 25,8 A 2.5,2.5 0 1,1 20,8 A 2.5,2.5 0 1,1 25,8 z" fill="#ffffff"/><path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18"/><path d="M 9,26 C 17.5,24.5 30,28 22.5,10 C 15,28 26,24.5 36,26 C 27.5,27.5 17.5,27.5 9,26 z" fill="#ffffff"/></g></svg>`,

  wR: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#ffffff" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36h21l-1.5-4h-18l-1.5 4zM11 14h23l-2 18H13l-2-18zM9 10h5v4H9v-4zM16 10h5v4h-5v-4zM24 10h5v4h-5v-4zM31 10h5v4h-5v-4z"/></g></svg>`,

  wQ: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#ffffff" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 8,39 L 37,39 L 37,36 L 8,36 L 8,39 z M 11.5,36 L 33.5,36 L 32,32 L 13,32 L 11.5,36 z M 12,32 L 33,32 L 32,24 L 13,24 L 12,32 z M 9,26 L 12.5,13.5 L 18,21 L 22.5,10 L 27,21 L 32.5,13.5 L 36,26 L 9,26 z"/><circle cx="9" cy="12" r="2.5"/><circle cx="14" cy="9" r="2.5"/><circle cx="22.5" cy="6" r="2.5"/><circle cx="31" cy="9" r="2.5"/><circle cx="36" cy="12" r="2.5"/></g></svg>`,

  wK: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8"/><path d="M 22.5,25 C 18.5,25 15.5,22.5 15.5,18 C 15.5,13.5 18.5,11 22.5,11 C 26.5,11 29.5,13.5 29.5,18 C 29.5,22.5 26.5,25 22.5,25 z" fill="#ffffff"/><path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 L 31,28.5 L 14,28.5 L 11.5,37 z" fill="#ffffff"/><path d="M 11.5,30 C 17,27 28,27 33.5,30 L 33.5,33.5 C 28,30.5 17,30.5 11.5,33.5 L 11.5,30 z" fill="#ffffff"/></g></svg>`,

  bP: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#2d3748" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  bN: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#2d3748" stroke="#000000" stroke-width="1.5"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,8.5 C 14.5,9.5 16.5,9.506 17.5,8.5 C 18.5,9.5 22.5,9.5 21.5,8.5 C 22.5,9.5 22.5,10 22.5,10" fill="#2d3748" stroke="#000000" stroke-width="1.5"/><circle cx="15" cy="13.5" r="1.5" fill="#ffffff"/></svg>`,

  bB: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,36 C 12.39,35.53 18.11,35.04 22.5,35.04 C 26.89,35.04 32.61,35.53 36,36 C 36,36 38.5,37.5 38.5,38.5 C 38.5,39.5 36,40 36,40 L 9,40 C 9,40 6.5,39.5 6.5,38.5 C 6.5,37.5 9,36 9,36 z" fill="#2d3748"/><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 L 15,30 C 15,30 14.5,30.5 15,32 z" fill="#2d3748"/><path d="M 25,8 A 2.5,2.5 0 1,1 20,8 A 2.5,2.5 0 1,1 25,8 z" fill="#2d3748"/><path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke="#ffffff"/><path d="M 9,26 C 17.5,24.5 30,28 22.5,10 C 15,28 26,24.5 36,26 C 27.5,27.5 17.5,27.5 9,26 z" fill="#2d3748"/></g></svg>`,

  bR: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#2d3748" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36h21l-1.5-4h-18l-1.5 4zM11 14h23l-2 18H13l-2-18zM9 10h5v4H9v-4zM16 10h5v4h-5v-4zM24 10h5v4h-5v-4zM31 10h5v4h-5v-4z"/></g></svg>`,

  bQ: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#2d3748" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 8,39 L 37,39 L 37,36 L 8,36 L 8,39 z M 11.5,36 L 33.5,36 L 32,32 L 13,32 L 11.5,36 z M 12,32 L 33,32 L 32,24 L 13,24 L 12,32 z M 9,26 L 12.5,13.5 L 18,21 L 22.5,10 L 27,21 L 32.5,13.5 L 36,26 L 9,26 z"/><circle cx="9" cy="12" r="2.5"/><circle cx="14" cy="9" r="2.5"/><circle cx="22.5" cy="6" r="2.5"/><circle cx="31" cy="9" r="2.5"/><circle cx="36" cy="12" r="2.5"/></g></svg>`,

  bK: `<svg viewBox="0 0 45 45" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" stroke="#ffffff"/><path d="M 22.5,25 C 18.5,25 15.5,22.5 15.5,18 C 15.5,13.5 18.5,11 22.5,11 C 26.5,11 29.5,13.5 29.5,18 C 29.5,22.5 26.5,25 22.5,25 z" fill="#2d3748"/><path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 L 31,28.5 L 14,28.5 L 11.5,37 z" fill="#2d3748"/><path d="M 11.5,30 C 17,27 28,27 33.5,30 L 33.5,33.5 C 28,30.5 17,30.5 11.5,33.5 L 11.5,30 z" fill="#2d3748"/></g></svg>`
};

export class BoardRenderer {
  constructor(containerId, onSquareClick) {
    this.container = document.getElementById(containerId);
    this.onSquareClick = onSquareClick;
    this.selectedSquare = null;
    this.highlightedSquares = [];
    this.recommendedFrom = null;
    this.recommendedTo = null;
    this.isFlipped = false;
    this.showOverlay = true;
  }

  /**
   * Converts (row, col) matrix indices to algebraic square string (e.g. 'e4')
   */
  indicesToSquare(row, col) {
    const colChar = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${colChar}${rank}`;
  }

  /**
   * Renders full 8x8 chessboard grid
   */
  render(game) {
    if (!this.container) return;
    this.container.innerHTML = '';

    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const row = this.isFlipped ? 7 - r : r;
        const col = this.isFlipped ? 7 - c : c;

        const squareStr = this.indicesToSquare(row, col);
        const isLight = (row + col) % 2 === 0;

        const sqDiv = document.createElement('div');
        sqDiv.className = `square ${isLight ? 'light' : 'dark'}`;
        sqDiv.dataset.square = squareStr;

        if (this.selectedSquare === squareStr) {
          sqDiv.classList.add('selected');
        } else if (this.highlightedSquares.includes(squareStr)) {
          sqDiv.classList.add('highlighted');
        }

        // Highlight recommended start & target squares
        if (this.recommendedFrom === squareStr) {
          sqDiv.classList.add('square-recommend-from');
        } else if (this.recommendedTo === squareStr) {
          sqDiv.classList.add('square-recommend-to');
        }

        const piece = board[row][col];
        if (piece) {
          const key = `${piece.color}${piece.type.toUpperCase()}`;
          const svgCode = PIECE_SVGS[key];
          if (svgCode) {
            const pieceWrapper = document.createElement('div');
            pieceWrapper.className = 'piece-img';
            pieceWrapper.innerHTML = svgCode;
            sqDiv.appendChild(pieceWrapper);
          }
        }

        sqDiv.addEventListener('click', () => {
          if (this.onSquareClick) this.onSquareClick(squareStr);
        });

        this.container.appendChild(sqDiv);
      }
    }
  }

  /**
   * Highlights selected square and legal destination squares
   */
  setHighlights(selected, legalDestinations = []) {
    this.selectedSquare = selected;
    this.highlightedSquares = legalDestinations;
  }

  /**
   * Returns exact pixel center (x, y) relative to #chess-board-grid container
   * Uses offsetLeft & offsetTop of target HTML square element for 100.00% precision
   */
  getSquareElementCenter(squareStr) {
    if (!squareStr) return null;
    const sqEl = this.container.querySelector(`[data-square="${squareStr}"]`);
    if (!sqEl) return null;

    const size = sqEl.offsetWidth;
    const x = sqEl.offsetLeft + size / 2;
    const y = sqEl.offsetTop + size / 2;

    return { x, y, squareSize: size };
  }

  /**
   * Draws 100% mathematically exact 2D Polygon Arrow directly anchored to square elements
   */
  drawMoveArrow(fromSquare, toSquare) {
    this.recommendedFrom = fromSquare;
    this.recommendedTo = toSquare;

    const svg = document.getElementById('svg-arrow-overlay');
    if (!svg) return;

    if (!fromSquare || !toSquare || !this.showOverlay) {
      svg.innerHTML = '';
      return;
    }

    const gridWidth = this.container.offsetWidth;
    const gridHeight = this.container.offsetHeight;
    if (gridWidth === 0 || gridHeight === 0) return;

    // Set SVG viewBox to match grid container pixel dimensions
    svg.setAttribute('viewBox', `0 0 ${gridWidth} ${gridHeight}`);
    svg.innerHTML = '';

    const start = this.getSquareElementCenter(fromSquare);
    const end = this.getSquareElementCenter(toSquare);

    if (!start || !end) return;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;

    const sqSize = start.squareSize;
    const headLen = sqSize * 0.38;
    const headWidth = sqSize * 0.28;
    const shaftWidth = sqSize * 0.10;
    const startOffset = sqSize * 0.15;
    const endOffset = sqSize * 0.12;

    // Key Arrow Polygon Vertices
    const tipX = end.x - ux * endOffset;
    const tipY = end.y - uy * endOffset;

    const baseHeadX = end.x - ux * (endOffset + headLen);
    const baseHeadY = end.y - uy * (endOffset + headLen);

    const startX = start.x + ux * startOffset;
    const startY = start.y + uy * startOffset;

    // 7 Polygon Vertices
    const p1x = tipX, p1y = tipY;
    const p2x = baseHeadX + px * headWidth, p2y = baseHeadY + py * headWidth;
    const p3x = baseHeadX + px * shaftWidth, p3y = baseHeadY + py * shaftWidth;
    const p4x = startX + px * shaftWidth, p4y = startY + py * shaftWidth;
    const p5x = startX - px * shaftWidth, p5y = startY - py * shaftWidth;
    const p6x = baseHeadX - px * shaftWidth, p6y = baseHeadY - py * shaftWidth;
    const p7x = baseHeadX - px * headWidth, p7y = baseHeadY - py * headWidth;

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y} ${p5x},${p5y} ${p6x},${p6y} ${p7x},${p7y}`);
    polygon.setAttribute('style', 'fill:#00e5ff; stroke:#0f172a; stroke-width:2; opacity:0.95; filter:drop-shadow(0px 0px 12px rgba(0,229,255,0.9));');

    svg.appendChild(polygon);
  }
}
