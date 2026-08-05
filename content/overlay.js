/**
 * Chess.com Assistant Overlay Renderer
 * Manages HUD control panel and SVG move arrow overlays on board.
 */

window.ChessOverlay = {
  hudElement: null,
  svgOverlay: null,
  enabled: true,

  /**
   * Initializes overlay elements in DOM
   */
  init() {
    this.createHud();
    this.ensureSvgOverlay();
  },

  /**
   * Creates or returns SVG overlay injected inside board container
   */
  ensureSvgOverlay() {
    const board = window.ChessParser.findBoardElement();
    if (!board) return null;

    const root = window.ChessParser.getRoot(board);

    if (getComputedStyle(board).position === 'static') {
      board.style.position = 'relative';
    }

    let svg = root.querySelector('#chess-assistant-svg-overlay');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'chess-assistant-svg-overlay');
      svg.setAttribute('style', 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:999;');
      svg.innerHTML = `
        <defs>
          <marker id="arrow-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="chess-arrow-head" fill="#00e5ff" />
          </marker>
        </defs>
        <g id="arrow-layer"></g>
      `;
      (root === document ? board : root).appendChild(svg);
    }
    this.svgOverlay = svg;
    return svg;
  },

  /**
   * Converts algebraic square (e.g. 'e4') to pixel center coordinates (x, y)
   */
  squareToCoords(squareStr) {
    if (!squareStr || squareStr.length < 2) return null;
    const board = window.ChessParser.findBoardElement();
    if (!board) return null;

    const rect = board.getBoundingClientRect();
    const squareSize = rect.width / 8;

    let col = squareStr.charCodeAt(0) - 97; // 'a' -> 0
    let rank = parseInt(squareStr[1], 10);  // 1..8
    let row = 8 - rank;                    // rank 8 -> row 0

    const isFlipped = window.ChessParser.isFlipped();
    if (isFlipped) {
      col = 7 - col;
      row = 7 - row;
    }

    const x = col * squareSize + squareSize / 2;
    const y = row * squareSize + squareSize / 2;

    return { x, y, squareSize };
  },

  /**
   * Draws best move arrow onto board SVG overlay
   */
  drawMoveArrow(fromSquare, toSquare) {
    const svg = this.ensureSvgOverlay();
    if (!svg) return;

    const gLayer = svg.querySelector('#arrow-layer');
    if (!gLayer) return;
    gLayer.innerHTML = ''; // Clear previous arrows

    if (!fromSquare || !toSquare || !this.enabled) return;

    const start = this.squareToCoords(fromSquare);
    const end = this.squareToCoords(toSquare);

    if (!start || !end) return;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const offset = start.squareSize * 0.25;

    const targetX = end.x - offset * Math.cos(angle);
    const targetY = end.y - offset * Math.sin(angle);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${start.x} ${start.y} L ${targetX} ${targetY}`);
    path.setAttribute('class', 'chess-arrow-path');
    path.setAttribute('style', 'stroke:#00e5ff; stroke-width:10; stroke-linecap:round; fill:none; opacity:0.9; filter:drop-shadow(0px 0px 6px #00e5ff);');
    path.setAttribute('marker-end', 'url(#arrow-head)');

    gLayer.appendChild(path);
  },

  /**
   * Creates HUD control panel element
   */
  createHud() {
    if (document.getElementById('chess-assistant-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'chess-assistant-hud';
    hud.innerHTML = `
      <div class="hud-header">
        <div class="hud-title">
          <div class="hud-status-dot" id="hud-status"></div>
          Chess AI Assistant
        </div>
        <div style="font-size:11px; cursor:pointer;" id="hud-minimize-btn">▼</div>
      </div>
      <div class="hud-eval-box">
        <div>
          <div style="font-size:10px; color:#a0aec0;">EVALUATION</div>
          <div class="hud-eval-score" id="hud-eval-score">+0.00</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px; color:#a0aec0;">SUGGESTION</div>
          <div class="hud-best-move" id="hud-best-move">--</div>
        </div>
      </div>
      <div class="hud-controls">
        <div class="hud-toggle-row">
          <span>Show Visual Overlay</span>
          <label class="switch">
            <input type="checkbox" id="hud-toggle-overlay" checked>
            <span class="slider"></span>
          </label>
        </div>
        <div class="hud-toggle-row">
          <span>Auto-Move Engine</span>
          <label class="switch">
            <input type="checkbox" id="hud-toggle-automove">
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="warning-banner" id="hud-diag-banner" style="cursor:pointer;" title="Click to log diagnostic info to F12 console">
        🔍 Mode: Practice & Spectator. (Click here to test DOM)
      </div>
    `;

    document.body.appendChild(hud);
    this.hudElement = hud;

    document.getElementById('hud-toggle-overlay').addEventListener('change', (e) => {
      this.enabled = e.target.checked;
      if (!this.enabled) this.drawMoveArrow(null, null);
    });

    document.getElementById('hud-minimize-btn').addEventListener('click', () => {
      hud.classList.toggle('minimized');
    });

    document.getElementById('hud-diag-banner').addEventListener('click', () => {
      if (window.ChessParser && window.ChessParser.getDiagnostics) {
        const diag = window.ChessParser.getDiagnostics();
        console.log('%c[ChessAssistant Diagnostics]', 'color:#00e5ff; font-weight:bold;', diag);
        alert(`[Chess.com Assistant Diagnostics]\nBoard Element: ${diag.boardTag}\nPieces Found: ${diag.pieceCountFound}\nFEN: ${diag.parsedFen || 'FAILED TO PARSE'}`);
      }
    });
  },

  /**
   * Updates HUD UI with engine evaluation
   */
  updateHud(evalResult) {
    if (!evalResult) return;

    const scoreEl = document.getElementById('hud-eval-score');
    const moveEl = document.getElementById('hud-best-move');
    const statusDot = document.getElementById('hud-status');

    if (scoreEl) scoreEl.textContent = evalResult.score || '0.00';
    if (moveEl) moveEl.textContent = evalResult.bestMove || '--';

    if (statusDot) {
      statusDot.classList.remove('analyzing');
    }

    if (evalResult.fromSquare && evalResult.toSquare) {
      this.drawMoveArrow(evalResult.fromSquare, evalResult.toSquare);
    }
  }
};
