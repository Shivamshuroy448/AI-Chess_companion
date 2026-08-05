/**
 * Main Content Script Orchestrator
 * Connects DOM Observer, FEN Parser, Stockfish Engine, and Visual Overlay HUD.
 */

(function () {
  let lastFen = null;
  let observer = null;
  let pollInterval = null;
  let isAutoMoveEnabled = false;

  console.log('%c[ChessAssistant] Extension script active on Chess.com', 'color:#00e5ff; font-weight:bold;');

  function initAssistant() {
    // 1. Initialize UI Overlay & HUD
    if (window.ChessOverlay) {
      window.ChessOverlay.init();
    }

    // 2. Setup Auto-Move toggle listener from HUD
    const autoMoveCheckbox = document.getElementById('hud-toggle-automove');
    if (autoMoveCheckbox) {
      autoMoveCheckbox.addEventListener('change', (e) => {
        isAutoMoveEnabled = e.target.checked;
        console.log('[ChessAssistant] Auto-Move mode toggle:', isAutoMoveEnabled);
      });
    }

    // 3. Start observing board mutations
    startBoardObserver();

    // 4. Start polling fallback loop (300ms)
    if (!pollInterval) {
      pollInterval = setInterval(triggerEvaluation, 300);
    }

    // 5. Run immediate evaluation
    triggerEvaluation();
  }

  /**
   * Sets up MutationObserver on chess board container
   */
  function startBoardObserver() {
    const board = window.ChessParser ? window.ChessParser.findBoardElement() : null;
    if (!board) {
      setTimeout(startBoardObserver, 1000);
      return;
    }

    if (observer) observer.disconnect();

    const root = window.ChessParser.getRoot(board);
    observer = new MutationObserver(() => {
      triggerEvaluation();
    });

    observer.observe(root === document ? board : root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-square', 'data-piece']
    });
  }

  /**
   * Triggers FEN parsing & Engine Analysis
   */
  function triggerEvaluation() {
    if (!window.ChessParser) return;

    const currentFen = window.ChessParser.getFen();
    const scoreEl = document.getElementById('hud-eval-score');
    const moveEl = document.getElementById('hud-best-move');

    if (!currentFen) {
      if (scoreEl && scoreEl.textContent === '+0.00') {
        scoreEl.textContent = 'Syncing...';
      }
      return;
    }

    if (currentFen === lastFen) return;
    lastFen = currentFen;

    const statusDot = document.getElementById('hud-status');
    if (statusDot) statusDot.classList.add('analyzing');

    // Run Engine Analysis
    if (window.ChessEngine) {
      window.ChessEngine.analyzePosition(currentFen, (result) => {
        // Update HUD & Arrow Overlay
        if (window.ChessOverlay) {
          window.ChessOverlay.updateHud(result);
        }

        // Execute Auto-Move if enabled
        if (isAutoMoveEnabled && result.fromSquare && result.toSquare) {
          attemptAutoMove(result.fromSquare, result.toSquare);
        }
      });
    }
  }

  /**
   * Simulates pointer/mouse interaction to make automated move on Chess.com
   */
  function attemptAutoMove(fromSquare, toSquare) {
    const board = window.ChessParser.findBoardElement();
    if (!board) return;

    const randomDelay = Math.floor(Math.random() * 500) + 400;

    setTimeout(() => {
      const root = window.ChessParser.getRoot(board);
      const pieces = root.querySelectorAll('[class*="piece"], [data-piece], .piece');
      let sourcePiece = null;

      pieces.forEach(p => {
        const cls = p.className || '';
        const dataSq = p.getAttribute('data-square') || '';
        if (cls.includes(`sq-${fromSquare}`) || cls.includes(`square-${fromSquare}`) || dataSq === fromSquare) {
          sourcePiece = p;
        }
      });

      const startCoords = window.ChessOverlay.squareToCoords(fromSquare);
      const endCoords = window.ChessOverlay.squareToCoords(toSquare);

      if (!startCoords || !endCoords) return;

      const boardRect = board.getBoundingClientRect();
      const clientX1 = boardRect.left + startCoords.x;
      const clientY1 = boardRect.top + startCoords.y;
      const clientX2 = boardRect.left + endCoords.x;
      const clientY2 = boardRect.top + endCoords.y;

      const downEvent = new PointerEvent('pointerdown', {
        bubbles: true, cancelable: true, clientX: clientX1, clientY: clientY1, pointerId: 1
      });
      const upEvent = new PointerEvent('pointerup', {
        bubbles: true, cancelable: true, clientX: clientX2, clientY: clientY2, pointerId: 1
      });

      if (sourcePiece) {
        sourcePiece.dispatchEvent(downEvent);
      } else {
        board.dispatchEvent(downEvent);
      }

      setTimeout(() => {
        board.dispatchEvent(upEvent);
      }, 120);
    }, randomDelay);
  }

  // Initialize loop
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAssistant, 1000);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(initAssistant, 1000));
  }
})();
