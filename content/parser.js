/**
 * Fail-Proof Universal Chess.com DOM to FEN Parser
 * Uses global element scanning to detect pieces across all Chess.com themes & board wrappers.
 */

window.ChessParser = {
  /**
   * Finds board element or falls back to parent of piece elements
   */
  findBoardElement() {
    // 1. Direct board selector
    const direct = document.querySelector('wc-chess-board, chess-board, #board-single, #board-vs-personal, #game-board, .board');
    if (direct) return direct;

    // 2. Infer board from piece element parent
    const piece = document.querySelector('.piece, [class*="piece"], [class*="square-"], [data-piece]');
    if (piece && piece.parentElement) {
      return piece.parentElement;
    }

    return document.body;
  },

  /**
   * Detects board orientation (Flipped = Black perspective)
   */
  isFlipped() {
    const board = this.findBoardElement();
    if (board && (board.classList.contains('flipped') || board.getAttribute('flipped') === 'true')) {
      return true;
    }
    return !!document.querySelector('.board.flipped, .flipped .board, wc-chess-board[flipped]');
  },

  /**
   * Detects active turn ('w' or 'b')
   */
  getTurn() {
    const moveNodes = document.querySelectorAll('.move-list-container .node, .vertical-move-list .node, .move-text-component, .move-node');
    if (moveNodes && moveNodes.length > 0) {
      return moveNodes.length % 2 === 0 ? 'w' : 'b';
    }
    return 'w';
  },

  /**
   * Extracts (col, row) from piece element
   * col: 0..7 ('a'..'h')
   * row: 0..7 (rank 8 -> row 0, rank 1 -> row 7)
   */
  extractCoords(el, boardRect) {
    const classList = Array.from(el.classList);
    let col = -1;
    let row = -1;

    // 1. Data-square attribute (e.g. data-square="e4" or data-square="54")
    const dataSq = el.getAttribute('data-square');
    if (dataSq) {
      if (/^[a-h][1-8]$/i.test(dataSq)) {
        col = dataSq.toLowerCase().charCodeAt(0) - 97;
        row = 8 - parseInt(dataSq[1], 10);
        return { col, row };
      } else if (/^\d{2}$/.test(dataSq)) {
        col = parseInt(dataSq[0], 10) - 1;
        row = 8 - parseInt(dataSq[1], 10);
        return { col, row };
      }
    }

    // 2. Class names matching square-XY or sq-XY (e.g. square-54, sq-54, square-e4)
    for (const cls of classList) {
      // Matches square-54, sq-54, square-12, sq-12
      const matchNum = cls.match(/^(?:sq|square)-(\d)(\d)$/i);
      if (matchNum) {
        col = parseInt(matchNum[1], 10) - 1;
        row = 8 - parseInt(matchNum[2], 10);
        if (col >= 0 && col < 8 && row >= 0 && row < 8) return { col, row };
      }
      // Matches square-e4, sq-e4
      const matchAlg = cls.match(/^(?:sq|square)-([a-h])([1-8])$/i);
      if (matchAlg) {
        col = matchAlg[1].toLowerCase().charCodeAt(0) - 97;
        row = 8 - parseInt(matchAlg[2], 10);
        if (col >= 0 && col < 8 && row >= 0 && row < 8) return { col, row };
      }
    }

    // 3. Inline style transform translate (e.g. translate(100%, 600%) or translate(120px, 720px))
    const style = el.getAttribute('style') || '';
    const transformMatch = style.match(/transform:\s*translate(?:3d)?\(\s*(-?\d+(?:\.\d+)?)(%|px)\s*,\s*(-?\d+(?:\.\d+)?)(%|px)/i);
    if (transformMatch) {
      const valX = parseFloat(transformMatch[1]);
      const unitX = transformMatch[2];
      const valY = parseFloat(transformMatch[3]);
      const unitY = transformMatch[4];

      if (unitX === '%') {
        col = Math.round(valX / 100);
        row = Math.round(valY / 100);
      } else if (unitX === 'px' && boardRect && boardRect.width > 0) {
        const sqSize = boardRect.width / 8;
        col = Math.round(valX / sqSize);
        row = Math.round(valY / sqSize);
      }
      if (col >= 0 && col < 8 && row >= 0 && row < 8) {
        return { col, row };
      }
    }

    return null;
  },

  /**
   * Extracts piece char (P, N, B, R, Q, K, p, n, b, r, q, k)
   */
  extractPieceChar(el) {
    // 1. Data-piece attribute
    const dataPiece = el.getAttribute('data-piece');
    if (dataPiece) {
      if (dataPiece.length === 2) {
        const isWhite = dataPiece[0].toLowerCase() === 'w';
        const type = dataPiece[1].toUpperCase();
        return isWhite ? type : type.toLowerCase();
      } else if (dataPiece.length === 1) {
        return dataPiece;
      }
    }

    // 2. Class names
    const classList = Array.from(el.classList);
    for (const cls of classList) {
      // Matches wp, wn, wb, wr, wq, wk, bp, bn, bb, br, bq, bk
      if (/^[wb][pnrqk]$/i.test(cls)) {
        const isWhite = cls[0].toLowerCase() === 'w';
        const type = cls[1].toUpperCase();
        return isWhite ? type : type.toLowerCase();
      }
      // Matches piece-wp, wp-piece, white-pawn, etc.
      const matchVerbose = cls.match(/^(white|black|w|b)[-_]?(pawn|knight|bishop|rook|queen|king|p|n|b|r|q|k)$/i);
      if (matchVerbose) {
        const isWhite = matchVerbose[1].toLowerCase().startsWith('w');
        const rawType = matchVerbose[2].toLowerCase();
        const typeMap = { pawn: 'P', knight: 'N', bishop: 'B', rook: 'R', queen: 'Q', king: 'K', p: 'P', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };
        const type = typeMap[rawType] || 'P';
        return isWhite ? type : type.toLowerCase();
      }
    }

    // 3. Background URL inspection
    const style = el.getAttribute('style') || '';
    const imgEl = el.querySelector('img, svg, use');
    const src = (imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('href') || '') : '') + style;

    const bgMatch = src.match(/[\/_]([wb])([pnrqk])\.(?:png|svg|webp)/i);
    if (bgMatch) {
      const isWhite = bgMatch[1].toLowerCase() === 'w';
      const type = bgMatch[2].toUpperCase();
      return isWhite ? type : type.toLowerCase();
    }

    return null;
  },

  /**
   * Main entry to parse board FEN
   */
  getFen() {
    const board = this.findBoardElement();
    const boardRect = board ? board.getBoundingClientRect() : null;

    // Scan for all piece elements anywhere in document / shadow roots
    let pieceElements = document.querySelectorAll('.piece, [class*="piece"], [data-piece]');
    if ((!pieceElements || pieceElements.length === 0) && board && board.shadowRoot) {
      pieceElements = board.shadowRoot.querySelectorAll('.piece, [class*="piece"], [data-piece]');
    }

    if (!pieceElements || pieceElements.length === 0) {
      return null;
    }

    const grid = Array(8).fill(null).map(() => Array(8).fill(null));
    let parsedCount = 0;

    pieceElements.forEach(el => {
      const pieceChar = this.extractPieceChar(el);
      const coords = this.extractCoords(el, boardRect);

      if (pieceChar && coords && coords.col >= 0 && coords.col < 8 && coords.row >= 0 && coords.row < 8) {
        grid[coords.row][coords.col] = pieceChar;
        parsedCount++;
      }
    });

    if (parsedCount === 0) {
      return null;
    }

    // Build FEN string
    const fenRows = [];
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      let rowStr = '';
      for (let c = 0; c < 8; c++) {
        const char = grid[r][c];
        if (!char) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          rowStr += char;
        }
      }
      if (emptyCount > 0) rowStr += emptyCount;
      fenRows.push(rowStr);
    }

    const boardFen = fenRows.join('/');
    const turn = this.getTurn();

    return `${boardFen} ${turn} KQkq - 0 1`;
  },

  /**
   * Diagnostic helper to dump raw DOM details for troubleshooting
   */
  getDiagnostics() {
    const board = this.findBoardElement();
    const pieces = document.querySelectorAll('.piece, [class*="piece"], [data-piece]');
    const sampleClasses = [];
    pieces.forEach((p, idx) => {
      if (idx < 5) sampleClasses.push(p.className);
    });

    return {
      boardFound: !!board,
      boardTag: board ? board.tagName : 'NONE',
      pieceCountFound: pieces.length,
      sampleClasses: sampleClasses,
      parsedFen: this.getFen()
    };
  }
};
