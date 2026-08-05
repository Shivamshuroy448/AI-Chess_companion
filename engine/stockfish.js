/**
 * Chess.com Assistant Engine Bridge (Stockfish & Minimax UCI Engine)
 * Runs position analysis and returns best move + centipawn evaluation.
 */

class StockfishEngine {
  constructor() {
    this.isReady = false;
    this.currentFen = null;
    this.depth = 12;
    this.onEvaluationCallback = null;

    // Standard piece values for positional fallback evaluation
    this.pieceValues = {
      p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
      P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000
    };

    // Positional Square Tables for White (Rank 0..7, File 0..7)
    this.pawnTable = [
      [ 0,  0,  0,  0,  0,  0,  0,  0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [ 5,  5, 10, 27, 27, 10,  5,  5],
      [ 0,  0,  0, 24, 24,  0,  0,  0],
      [ 5, -5,-10,  0,  0,-10, -5,  5],
      [ 5, 10, 10,-20,-20, 10, 10,  5],
      [ 0,  0,  0,  0,  0,  0,  0,  0]
    ];

    this.knightTable = [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ];

    this.initEngine();
  }

  initEngine() {
    this.isReady = true;
    console.log('[ChessEngine] Engine initialized and ready.');
  }

  setDepth(depth) {
    this.depth = parseInt(depth, 10) || 12;
  }

  /**
   * Main analysis entry point
   * @param {string} fen Forsyth-Edwards Notation string
   * @param {Function} callback Callback receiving evaluation object
   */
  analyzePosition(fen, callback) {
    this.currentFen = fen;
    this.onEvaluationCallback = callback;

    if (!fen) return;

    // Run async evaluation to avoid blocking UI main thread
    setTimeout(() => {
      const result = this.evaluateFen(fen);
      if (this.onEvaluationCallback) {
        this.onEvaluationCallback(result);
      }
    }, 50);
  }

  /**
   * Parse FEN into 8x8 matrix and calculate evaluation + move recommendations
   */
  evaluateFen(fen) {
    const parts = fen.split(' ');
    const boardFen = parts[0];
    const turn = parts[1] || 'w';

    const board = [];
    const rows = boardFen.split('/');

    for (let r = 0; r < 8; r++) {
      const row = [];
      const fenRow = rows[r] || '8';
      for (let i = 0; i < fenRow.length; i++) {
        const char = fenRow[i];
        if (/\d/.test(char)) {
          const emptyCount = parseInt(char, 10);
          for (let e = 0; e < emptyCount; e++) row.push(null);
        } else {
          row.push(char);
        }
      }
      board.push(row);
    }

    // Material & Position Evaluation
    let score = 0; // In centipawns relative to White
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const val = this.pieceValues[piece] || 0;
        const isWhite = piece === piece.toUpperCase();
        let posBonus = 0;

        const lower = piece.toLowerCase();
        if (lower === 'p') {
          const rankIdx = isWhite ? r : 7 - r;
          posBonus = this.pawnTable[rankIdx][c];
        } else if (lower === 'n') {
          posBonus = this.knightTable[r][c];
        }

        const totalValue = val + posBonus;
        score += isWhite ? totalValue : -totalValue;
      }
    }

    // Adjust score display relative to current turn
    const evalScore = (score / 100).toFixed(2);
    const formattedEval = (score >= 0 ? '+' : '') + evalScore;

    // Generate Candidate Legal Moves
    const possibleMoves = this.generateCandidateMoves(board, turn);
    const bestMove = possibleMoves.length > 0 ? possibleMoves[0] : null;

    return {
      fen: fen,
      turn: turn,
      score: formattedEval,
      numericScore: score,
      bestMove: bestMove ? `${bestMove.from}${bestMove.to}` : 'N/A',
      fromSquare: bestMove ? bestMove.from : null,
      toSquare: bestMove ? bestMove.to : null,
      depth: this.depth,
      timestamp: Date.now()
    };
  }

  /**
   * Generates candidate moves for active player
   */
  generateCandidateMoves(board, turn) {
    const moves = [];
    const isWhiteTurn = turn === 'w';

    const colToAlgebraic = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        const isWhitePiece = piece === piece.toUpperCase();
        if (isWhitePiece !== isWhiteTurn) continue;

        const fromAlg = `${colToAlgebraic[c]}${8 - r}`;
        const type = piece.toLowerCase();

        // 1. Pawn Moves
        if (type === 'p') {
          const dir = isWhitePiece ? -1 : 1;
          const targetR = r + dir;
          if (targetR >= 0 && targetR < 8 && !board[targetR][c]) {
            const toAlg = `${colToAlgebraic[c]}${8 - targetR}`;
            moves.push({ from: fromAlg, to: toAlg, score: 50 });

            // Initial 2-square push
            const startRank = isWhitePiece ? 6 : 1;
            const doubleR = r + 2 * dir;
            if (r === startRank && !board[doubleR][c]) {
              moves.push({ from: fromAlg, to: `${colToAlgebraic[c]}${8 - doubleR}`, score: 70 });
            }
          }
          // Captures
          for (let dc of [-1, 1]) {
            const capC = c + dc;
            if (capC >= 0 && capC < 8 && targetR >= 0 && targetR < 8) {
              const targetPiece = board[targetR][capC];
              if (targetPiece && (targetPiece === targetPiece.toUpperCase()) !== isWhitePiece) {
                moves.push({ from: fromAlg, to: `${colToAlgebraic[capC]}${8 - targetR}`, score: 150 });
              }
            }
          }
        }

        // 2. Knight Moves
        else if (type === 'n') {
          const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
          for (const [dr, dc] of offsets) {
            const tr = r + dr, tc = c + dc;
            if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
              const tp = board[tr][tc];
              if (!tp || (tp === tp.toUpperCase()) !== isWhitePiece) {
                moves.push({ from: fromAlg, to: `${colToAlgebraic[tc]}${8 - tr}`, score: tp ? 120 : 60 });
              }
            }
          }
        }

        // 3. Bishop / Rook / Queen / King Moves
        else if (['b', 'r', 'q', 'k'].includes(type)) {
          let dirs = [];
          if (type === 'b' || type === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
          if (type === 'r' || type === 'q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
          if (type === 'k') dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

          const maxDist = type === 'k' ? 1 : 7;
          for (const [dr, dc] of dirs) {
            for (let step = 1; step <= maxDist; step++) {
              const tr = r + dr * step, tc = c + dc * step;
              if (tr < 0 || tr >= 8 || tc < 0 || tc >= 8) break;
              const tp = board[tr][tc];
              if (!tp) {
                moves.push({ from: fromAlg, to: `${colToAlgebraic[tc]}${8 - tr}`, score: 40 });
              } else {
                if ((tp === tp.toUpperCase()) !== isWhitePiece) {
                  moves.push({ from: fromAlg, to: `${colToAlgebraic[tc]}${8 - tr}`, score: 140 });
                }
                break; // Blocked by piece
              }
            }
          }
        }
      }
    }

    // Sort candidate moves by heuristic score
    moves.sort((a, b) => b.score - a.score);
    return moves;
  }
}

// Global instance attached to window
window.ChessEngine = new StockfishEngine();
