/**
 * Main Application Orchestrator
 * Integrates Stockfish 16 Engine, Google OAuth, Anti-Cheat ELO System & Guest Blur Security Overlay.
 */

import { Chess } from 'chess.js';
import { BoardRenderer } from './boardRenderer.js';
import { engine } from './stockfishEngine.js';
import { sounds } from './soundEffects.js';

class ChessApp {
  constructor() {
    this.game = new Chess();
    this.selectedSquare = null;
    this.playerColor = 'w';
    this.gameMode = 'mirror';

    // Anti-Cheat Session State
    this.hasClaimedCurrentGame = false;

    // User session & win tracker state
    this.currentUser = null;
    this.googleClientId = '658722838654-ie4ffiu8452lfk56gv28ogl8jpvt7a0i.apps.googleusercontent.com';

    // Global Leaderboard Mock Master Database (Sorted by ELO Rating)
    this.globalLeaderboard = [
      { name: 'Magnus C.', flag: '🇳🇴', elo: 2850, wins: 482, rate: '92%' },
      { name: 'Hikaru N.', flag: '🇺🇸', elo: 2800, wins: 415, rate: '89%' },
      { name: 'Vidit G.', flag: '🇮🇳', elo: 2780, wins: 378, rate: '86%' },
      { name: 'Alireza F.', flag: '🇫🇷', elo: 2750, wins: 340, rate: '84%' },
      { name: 'Pragg D.', flag: '🇮🇳', elo: 2720, wins: 295, rate: '85%' },
      { name: 'Gukesh D.', flag: '🇮🇳', elo: 2710, wins: 280, rate: '84%' },
      { name: 'Fabiano C.', flag: '🇺🇸', elo: 2690, wins: 260, rate: '81%' },
      { name: 'Nakamura K.', flag: '🇯🇵', elo: 2650, wins: 245, rate: '80%' }
    ];

    this.globalTotalWins = 14892;
    this.globalActivePlayers = 1420;

    this.renderer = new BoardRenderer('chess-board-grid', (square) => this.handleSquareClick(square));

    this.initUserSession();
    this.initGoogleAuth();
    this.initUI();
    this.initLeaderboardUI();
    this.initDashboardTabs();
    this.initPgnImporter();
    this.updateBoard(true);
    this.startGlobalTicker();
  }

  /* --- Security & XSS Sanitization Helpers --- */

  escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getFlagFromLocale(localeStr) {
    if (!localeStr || typeof localeStr !== 'string') return '🇮🇳';
    const parts = localeStr.split('-');
    const code = parts.length > 1 ? parts[1].toUpperCase() : parts[0].toUpperCase();

    const flagMap = {
      'IN': '🇮🇳', 'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'BR': '🇧🇷', 'ES': '🇪🇸',
      'IT': '🇮🇹', 'RU': '🇷🇺', 'CN': '🇨🇳', 'KR': '🇰🇷', 'NL': '🇳🇱',
      'SE': '🇸🇪', 'NO': '🇳🇴', 'MX': '🇲🇽', 'AR': '🇦🇷', 'ZA': '🇿🇦'
    };
    return flagMap[code] || '🇮🇳';
  }

  /* --- 3-Tab Switchable Side Panel Navigation --- */

  initDashboardTabs() {
    const tabLead = document.getElementById('btn-dash-tab-lead');
    const tabPgn = document.getElementById('btn-dash-tab-pgn');
    const tabControls = document.getElementById('btn-dash-tab-controls');

    const paneLead = document.getElementById('pane-dash-lead');
    const panePgn = document.getElementById('pane-dash-pgn');
    const paneControls = document.getElementById('pane-dash-controls');

    const activateTab = (activeBtn, activePane) => {
      [tabLead, tabPgn, tabControls].forEach(btn => btn?.classList.remove('active'));
      [paneLead, panePgn, paneControls].forEach(pane => pane?.classList.add('hidden'));

      activeBtn?.classList.add('active');
      activePane?.classList.remove('hidden');
    };

    tabLead?.addEventListener('click', () => activateTab(tabLead, paneLead));
    tabPgn?.addEventListener('click', () => activateTab(tabPgn, panePgn));
    tabControls?.addEventListener('click', () => activateTab(tabControls, paneControls));
  }

  /* --- Global Leaderboard & Real-Time Ticker with Guest Blur --- */

  initLeaderboardUI() {
    const btnTop = document.getElementById('btn-lead-top');
    const btnMe = document.getElementById('btn-lead-me');

    btnTop?.addEventListener('click', () => {
      btnTop.classList.add('active');
      btnMe?.classList.remove('active');
      this.renderLeaderboard('top');
    });

    btnMe?.addEventListener('click', () => {
      btnMe.classList.add('active');
      btnTop?.classList.remove('active');
      this.renderLeaderboard('me');
    });

    const btnOverlayLogin = document.getElementById('btn-overlay-login');
    btnOverlayLogin?.addEventListener('click', () => {
      const modalLogin = document.getElementById('modal-login');
      modalLogin?.classList.remove('hidden');

      const target = document.getElementById('google-signin-btn-target');
      if (window.google && window.google.accounts && target) {
        window.google.accounts.id.renderButton(target, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 300
        });
      }
    });

    this.renderLeaderboard('top');
  }

  renderLeaderboard(viewMode = 'top') {
    const container = document.getElementById('leaderboard-table-list');
    const overlay = document.getElementById('guest-leaderboard-overlay');
    if (!container) return;

    // Guest Mode Blur Control
    if (!this.currentUser) {
      container.classList.add('blur-guest');
      overlay?.classList.remove('hidden');
    } else {
      container.classList.remove('blur-guest');
      overlay?.classList.add('hidden');
    }

    let list = [...this.globalLeaderboard];

    const userElo = this.currentUser ? (this.currentUser.elo || 1200) : 1200;
    const userWon = this.currentUser ? (this.currentUser.gamesWon || 0) : 0;
    const userPlayed = this.currentUser ? (this.currentUser.gamesPlayed || 0) : 0;
    const userRate = userPlayed > 0 ? Math.round((userWon / userPlayed) * 100) + '%' : '0%';
    const userName = this.currentUser ? (this.currentUser.username || 'You') : 'You (Guest)';
    const userFlag = (this.currentUser && this.currentUser.flag) ? this.currentUser.flag : '🇮🇳';

    const userEntry = {
      name: `${userName} (You)`,
      flag: userFlag,
      elo: userElo,
      wins: userWon,
      rate: userRate,
      isUser: true
    };

    list.push(userEntry);
    list.sort((a, b) => b.elo - a.elo);

    if (viewMode === 'me') {
      const userIndex = list.findIndex(item => item.isUser);
      const start = Math.max(0, userIndex - 2);
      list = list.slice(start, start + 6);
    }

    let html = '';
    list.forEach((item, idx) => {
      const globalRank = this.globalLeaderboard.findIndex(g => g.elo <= item.elo) + 1 || (idx + 1);
      const isGold = globalRank === 1;
      const isSilver = globalRank === 2;
      const isBronze = globalRank === 3;

      let rankClass = '';
      let rankText = `#${globalRank}`;
      if (isGold) { rankClass = 'lead-rank-gold'; rankText = '🥇 #1'; }
      else if (isSilver) { rankClass = 'lead-rank-silver'; rankText = '🥈 #2'; }
      else if (isBronze) { rankClass = 'lead-rank-bronze'; rankText = '🥉 #3'; }

      const rowClass = item.isUser ? 'lead-row my-rank-row' : 'lead-row';

      html += `
        <div class="${rowClass}">
          <span class="lead-rank ${rankClass}">${rankText}</span>
          <div class="lead-player">
            <span class="lead-flag">${item.flag}</span>
            <span>${this.escapeHtml(item.name)}</span>
          </div>
          <span class="lead-wins">${item.elo} ELO</span>
          <span class="lead-rate">🏆 ${item.wins}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  startGlobalTicker() {
    setInterval(() => {
      this.globalTotalWins += 1;
      const winCounterEl = document.getElementById('global-total-wins');
      if (winCounterEl) {
        winCounterEl.textContent = this.globalTotalWins.toLocaleString();
      }
    }, 18000);
  }

  /* --- User Session & Google Auth --- */

  initUserSession() {
    const saved = localStorage.getItem('chess_user_session');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
        if (!this.currentUser.elo) this.currentUser.elo = 1200;
      } catch (e) {
        this.currentUser = null;
      }
    }
    this.renderUserWidget();
  }

  initGoogleAuth() {
    window.handleGoogleCredentialResponse = (response) => {
      if (response && response.credential) {
        try {
          const base64Url = response.credential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const payload = JSON.parse(jsonPayload);
          const autoFlag = this.getFlagFromLocale(payload.locale);

          this.loginWithGoogleUser(payload.name, payload.email, payload.picture, autoFlag);
        } catch (e) {
          console.error('Google token parse error', e);
        }
      }
    };

    const setupNativeButton = () => {
      const target = document.getElementById('google-signin-btn-target');
      if (window.google && window.google.accounts && target) {
        window.google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: window.handleGoogleCredentialResponse
        });

        window.google.accounts.id.renderButton(target, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 300
        });
      }
    };

    if (document.readyState === 'complete') {
      setTimeout(setupNativeButton, 300);
    } else {
      window.addEventListener('load', () => setTimeout(setupNativeButton, 300));
    }
  }

  loginWithGoogleUser(name, email, pictureUrl, detectedFlag) {
    const cleanEmail = email ? email.toLowerCase() : '';
    const usersDb = JSON.parse(localStorage.getItem('chess_users_db_v2') || '{}');
    const existing = usersDb[cleanEmail];

    const safeName = this.escapeHtml(name);
    const safeEmail = this.escapeHtml(cleanEmail);

    if (existing) {
      existing.picture = pictureUrl || existing.picture;
      existing.username = safeName || existing.username;
      existing.flag = existing.flag || detectedFlag || '🇮🇳';
      existing.elo = existing.elo || 1200;
      this.currentUser = existing;
    } else {
      this.currentUser = {
        username: safeName || 'Google User',
        email: safeEmail,
        picture: pictureUrl,
        flag: detectedFlag || '🇮🇳',
        elo: 1200,
        provider: 'google',
        gamesWon: 0,
        gamesPlayed: 0,
        createdAt: new Date().toISOString()
      };
    }

    this.saveUserSession();
    this.renderLeaderboard('top');
    const modalLogin = document.getElementById('modal-login');
    if (modalLogin) modalLogin.classList.add('hidden');
    this.showToast(`✨ Signed in with Google as ${this.currentUser.username} (${this.currentUser.elo} ELO)! Unlocked Leaderboard.`);
  }

  saveUserSession() {
    if (this.currentUser) {
      localStorage.setItem('chess_user_session', JSON.stringify(this.currentUser));
      const usersDb = JSON.parse(localStorage.getItem('chess_users_db_v2') || '{}');
      if (this.currentUser.email) {
        usersDb[this.currentUser.email.toLowerCase()] = this.currentUser;
        localStorage.setItem('chess_users_db_v2', JSON.stringify(usersDb));
      }
    } else {
      localStorage.removeItem('chess_user_session');
    }
    this.renderUserWidget();
  }

  renderUserWidget() {
    const loggedOutView = document.getElementById('user-logged-out-view');
    const loggedInView = document.getElementById('user-logged-in-view');
    const avatarContainer = document.getElementById('user-avatar-container');
    const flagSelect = document.getElementById('user-flag-select');
    const nameEl = document.getElementById('user-display-name');
    const eloEl = document.getElementById('stat-elo-rating');
    const wonEl = document.getElementById('stat-games-won');

    if (this.currentUser) {
      loggedOutView?.classList.add('hidden');
      loggedInView?.classList.remove('hidden');

      if (avatarContainer) {
        if (this.currentUser.picture) {
          avatarContainer.innerHTML = `<img src="${this.currentUser.picture}" alt="Avatar" class="user-avatar-img" referrerpolicy="no-referrer" onerror="this.onerror=null; this.parentElement.innerHTML='👤';" />`;
        } else {
          avatarContainer.textContent = '👤';
        }
      }

      if (flagSelect) {
        flagSelect.value = this.currentUser.flag || '🇮🇳';
      }

      if (nameEl) nameEl.textContent = this.currentUser.username || this.currentUser.email;
      if (eloEl) eloEl.textContent = this.currentUser.elo || 1200;
      if (wonEl) wonEl.textContent = this.currentUser.gamesWon || 0;
    } else {
      loggedInView?.classList.add('hidden');
      loggedOutView?.classList.remove('hidden');
    }

    this.renderLeaderboard('top');
  }

  logoutUser() {
    const oldName = this.currentUser ? (this.currentUser.username || this.currentUser.email) : '';
    this.currentUser = null;
    this.saveUserSession();
    this.renderLeaderboard('top');
    this.showToast(`🚪 Logged out ${oldName}. Guest mode active.`);
  }

  /* --- Anti-Cheat Checkmate Victory Verification --- */

  verifyAndClaimCheckmateVictory() {
    if (this.hasClaimedCurrentGame) return;

    const history = this.game.history();
    if (history.length < 6) {
      this.showToast('⚠️ Game too short! At least 6 moves required to record a win.');
      return;
    }

    const loserTurn = this.game.turn();
    const playerWon = (loserTurn !== this.playerColor);

    if (!playerWon) return;

    this.hasClaimedCurrentGame = true;

    if (!this.currentUser) {
      this.currentUser = {
        username: 'Guest Player',
        email: 'guest@local',
        flag: '🇮🇳',
        elo: 1225,
        gamesWon: 1,
        gamesPlayed: 1,
        createdAt: new Date().toISOString()
      };
    } else {
      this.currentUser.elo = (this.currentUser.elo || 1200) + 25;
      this.currentUser.gamesWon = (this.currentUser.gamesWon || 0) + 1;
      this.currentUser.gamesPlayed = (this.currentUser.gamesPlayed || 0) + 1;
    }

    this.saveUserSession();
    this.renderLeaderboard('top');
    sounds.playCheckmate();
    this.showToast(`🏆 CHECKMATE VERIFIED! +25 ELO Earned! Rating: ${this.currentUser.elo} ELO`);
  }

  /* --- UI Event Listeners --- */

  initUI() {
    const modalLogin = document.getElementById('modal-login');
    const btnOpenLogin = document.getElementById('btn-open-login');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnLogout = document.getElementById('btn-user-logout');
    const flagSelect = document.getElementById('user-flag-select');

    flagSelect?.addEventListener('change', (e) => {
      if (this.currentUser) {
        this.currentUser.flag = e.target.value;
        this.saveUserSession();
        this.renderLeaderboard('top');
        this.showToast(`🚩 Flag updated to ${this.currentUser.flag}!`);
      }
    });

    btnOpenLogin?.addEventListener('click', () => {
      modalLogin?.classList.remove('hidden');

      const target = document.getElementById('google-signin-btn-target');
      if (window.google && window.google.accounts && target) {
        window.google.accounts.id.renderButton(target, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 300
        });
      }
    });

    btnCloseModal?.addEventListener('click', () => {
      modalLogin?.classList.add('hidden');
    });

    modalLogin?.addEventListener('click', (e) => {
      if (e.target === modalLogin) modalLogin.classList.add('hidden');
    });

    btnLogout?.addEventListener('click', () => this.logoutUser());

    const btnWhite = document.getElementById('btn-color-white');
    const btnBlack = document.getElementById('btn-color-black');

    btnWhite?.addEventListener('click', () => {
      this.playerColor = 'w';
      btnWhite.classList.add('active');
      btnBlack?.classList.remove('active');
      this.renderer.isFlipped = false;
      this.clearRecommendations();
      this.updateMatchupBar();
      this.updateBoard(true);
    });

    btnBlack?.addEventListener('click', () => {
      this.playerColor = 'b';
      btnBlack.classList.add('active');
      btnWhite?.classList.remove('active');
      this.renderer.isFlipped = true;
      this.clearRecommendations();
      this.updateMatchupBar();
      this.updateBoard(true);
    });

    document.getElementById('btn-new-game')?.addEventListener('click', () => this.resetGame());

    document.getElementById('btn-undo')?.addEventListener('click', () => {
      this.game.undo();
      this.clearRecommendations();
      this.updateBoard(true);
    });

    document.getElementById('btn-flip')?.addEventListener('click', () => {
      this.renderer.isFlipped = !this.renderer.isFlipped;
      this.updateBoard(true);
    });

    const overlaySwitch = document.getElementById('switch-overlay');
    overlaySwitch?.addEventListener('change', (e) => {
      this.renderer.showOverlay = e.target.checked;
      this.updateBoard(false);
    });

    const soundSwitch = document.getElementById('switch-sound');
    soundSwitch?.addEventListener('change', (e) => {
      sounds.enabled = e.target.checked;
    });

    const themeSelect = document.getElementById('select-theme');
    themeSelect?.addEventListener('change', (e) => {
      document.body.className = e.target.value;
    });

    document.getElementById('btn-load-fen')?.addEventListener('click', () => {
      const fenInput = document.getElementById('input-fen')?.value;
      if (fenInput) {
        try {
          this.game.load(fenInput.trim());
          this.clearRecommendations();
          this.updateBoard(true);
        } catch (err) {
          alert('Invalid FEN position string!');
        }
      }
    });
  }

  initPgnImporter() {
    const btnLoadPgn = document.getElementById('btn-load-pgn');
    const pgnArea = document.getElementById('input-pgn-text');

    btnLoadPgn?.addEventListener('click', () => {
      const text = pgnArea?.value;
      if (text) this.loadMoveNotation(text);
    });

    window.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text');
      if (text && (text.includes('.') || text.includes('e4') || text.includes('d4') || text.includes('Nf3'))) {
        if (pgnArea) pgnArea.value = text;
        this.showToast('📋 Move Notation Pasted! Loading mid-game position...');
        this.loadMoveNotation(text);
      }
    });
  }

  loadMoveNotation(moveText) {
    if (!moveText || typeof moveText !== 'string') return;

    try {
      const tempGame = new Chess();
      const cleanText = moveText.replace(/\{[^}]*\}/g, '').replace(/\([^)]*\)/g, '');

      try {
        tempGame.loadPgn(cleanText);
      } catch (e1) {
        const tokens = cleanText.split(/\s+/);
        tokens.forEach(tok => {
          if (!tok || tok.includes('.') || tok === '1-0' || tok === '0-1' || tok === '1/2-1/2') return;
          try { tempGame.move(tok); } catch(e2){}
        });
      }

      this.game = tempGame;
      this.hasClaimedCurrentGame = false;
      const currentFen = this.game.fen();
      const fenInput = document.getElementById('input-fen');
      if (fenInput) fenInput.value = currentFen;

      this.clearRecommendations();
      this.updateBoard(true);
      this.showToast(`✨ Loaded ${this.game.history().length} moves! Current position ready.`);
    } catch (err) {
      this.showToast('⚠️ Could not parse move text. Ensure notation format is e.g. 1. e4 e5 2. Nc3');
    }
  }

  showToast(msg) {
    let toast = document.getElementById('chess-toast-msg');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'chess-toast-msg';
      toast.setAttribute('style', 'position:fixed; top:80px; left:50%; transform:translateX(-50%); background:rgba(0,229,255,0.95); color:#0f172a; padding:12px 24px; border-radius:12px; font-weight:800; font-size:14px; z-index:9999; box-shadow:0 8px 24px rgba(0,0,0,0.5); pointer-events:none; transition:opacity 0.3s ease;');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  }

  clearRecommendations() {
    this.selectedSquare = null;
    this.renderer.setHighlights(null, []);
    this.renderer.recommendedFrom = null;
    this.renderer.recommendedTo = null;
    this.renderer.drawMoveArrow(null, null);

    const mainText = document.getElementById('status-main-text');
    const bestMoveText = document.getElementById('eval-best-move');
    const scoreDisplay = document.getElementById('eval-score-display');

    if (mainText) mainText.innerHTML = '⚡ Calculating winning move for current position...';
    if (bestMoveText) bestMoveText.textContent = 'Analyzing position...';
    if (scoreDisplay) scoreDisplay.textContent = '...';
  }

  resetGame() {
    this.game.reset();
    this.hasClaimedCurrentGame = false;
    this.clearRecommendations();
    this.updateBoard(true);
  }

  updateMatchupBar() {
    const badgeYou = document.getElementById('badge-you');
    const badgeOpp = document.getElementById('badge-opp');
    const labelFor = document.getElementById('label-recommended-for');

    if (this.playerColor === 'w') {
      if (badgeYou) badgeYou.textContent = 'YOU: WHITE (♔)';
      if (badgeOpp) badgeOpp.textContent = 'OPPONENT: BLACK (♚)';
      if (labelFor) labelFor.textContent = 'WINNING MOVE FOR YOU (WHITE)';
    } else {
      if (badgeYou) badgeYou.textContent = 'YOU: BLACK (♚)';
      if (badgeOpp) badgeOpp.textContent = 'OPPONENT: WHITE (♔)';
      if (labelFor) labelFor.textContent = 'WINNING MOVE FOR YOU (BLACK)';
    }
  }

  handleSquareClick(squareStr) {
    if (this.game.isGameOver()) return;

    if (this.selectedSquare) {
      if (this.selectedSquare === squareStr) {
        this.selectedSquare = null;
        this.renderer.setHighlights(null, []);
        this.renderer.render(this.game);
        return;
      }

      const move = this.makeMove({ from: this.selectedSquare, to: squareStr, promotion: 'q' });
      if (move) {
        this.selectedSquare = null;
        this.renderer.setHighlights(null, []);
        return;
      } else {
        const piece = this.game.get(this.selectedSquare);
        if (piece) {
          const name = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' }[piece.type];
          this.showToast(`Illegal move for ${name}! Cannot move from ${this.selectedSquare} to ${squareStr}.`);
        }
      }
    }

    const piece = this.game.get(squareStr);
    if (piece && piece.color === this.game.turn()) {
      this.selectedSquare = squareStr;
      const moves = this.game.moves({ square: squareStr, verbose: true });
      const destinations = moves.map(m => m.to);
      this.renderer.setHighlights(squareStr, destinations);
      this.renderer.render(this.game);
    } else {
      this.selectedSquare = null;
      this.renderer.setHighlights(null, []);
      this.renderer.render(this.game);
    }
  }

  makeMove(moveObj) {
    try {
      const move = this.game.move(moveObj);
      if (!move) return null;

      if (this.game.isCheckmate()) {
        sounds.playCheckmate();
        this.verifyAndClaimCheckmateVictory();
      } else if (this.game.inCheck()) {
        sounds.playCheck();
      } else if (move.captured) {
        sounds.playCapture();
      } else {
        sounds.playMove();
      }

      this.selectedSquare = null;
      this.renderer.setHighlights(null, []);
      this.clearRecommendations();
      this.updateBoard(true);

      return move;
    } catch (e) {
      return null;
    }
  }

  updateBoard(runEngine = true) {
    this.renderer.render(this.game);
    this.updateMoveLog();

    if (runEngine) {
      const fenAtStart = this.game.fen();
      engine.getBestMoveAsync(this.game, (evalResult) => {
        if (this.game.fen() !== fenAtStart) return;

        if (evalResult) {
          const isYourTurn = (this.game.turn() === this.playerColor);

          if (isYourTurn) {
            this.renderer.drawMoveArrow(evalResult.from, evalResult.to);
          } else {
            this.renderer.recommendedFrom = null;
            this.renderer.recommendedTo = null;
            this.renderer.drawMoveArrow(null, null);
            this.renderer.render(this.game);
          }

          this.updateEvalDisplay(evalResult, isYourTurn);
          this.updateStatusBanner(evalResult, isYourTurn);
        }
      });
    }
  }

  updateStatusBanner(evalResult, isYourTurn) {
    const banner = document.getElementById('live-status-banner');
    const mainText = document.getElementById('status-main-text');
    const subText = document.getElementById('status-sub-text');

    if (!banner || !mainText || !subText) return;

    const yourColorName = this.playerColor === 'w' ? 'WHITE' : 'BLACK';
    const oppColorName = this.playerColor === 'w' ? 'BLACK' : 'WHITE';

    if (this.game.isCheckmate()) {
      banner.className = 'status-banner-your-turn';
      mainText.innerHTML = '🏆 CHECKMATE! Game Over.';
      subText.textContent = 'Great game!';
      return;
    }

    if (isYourTurn) {
      banner.className = 'status-banner-your-turn';
      const moveStr = evalResult.san ? `${this.escapeHtml(evalResult.from)} ➔ ${this.escapeHtml(evalResult.to)} (${this.escapeHtml(evalResult.san)})` : `${this.escapeHtml(evalResult.from)} ➔ ${this.escapeHtml(evalResult.to)}`;
      const engineSrc = this.escapeHtml(evalResult.source || 'Stockfish 16 Engine');
      mainText.innerHTML = `🔥 YOUR TURN (${yourColorName})! AI Recommends: <span id="status-recommended-move">${moveStr}</span>`;
      subText.textContent = `Powered by ${engineSrc}. Play this move online to win!`;
    } else {
      banner.className = 'status-banner-opponent-turn';
      mainText.innerHTML = `⏳ OPPONENT'S TURN (${oppColorName})`;
      subText.textContent = `Enter your opponent's move on the board below.`;
    }
  }

  updateEvalDisplay(evalResult, isYourTurn) {
    const scoreText = document.getElementById('eval-score-val');
    const scoreDisplay = document.getElementById('eval-score-display');
    const bestMoveText = document.getElementById('eval-best-move');
    const barFill = document.getElementById('eval-bar-fill');

    if (scoreText) scoreText.textContent = evalResult.score;
    if (scoreDisplay) scoreDisplay.textContent = evalResult.score;

    if (bestMoveText) {
      if (isYourTurn && evalResult.san) {
        bestMoveText.textContent = `${evalResult.from} ➔ ${evalResult.to} (${evalResult.san})`;
      } else if (isYourTurn && evalResult.from) {
        bestMoveText.textContent = `${evalResult.from} ➔ ${evalResult.to}`;
      } else {
        bestMoveText.textContent = 'Waiting for Opponent...';
      }
    }

    if (barFill) {
      const numeric = evalResult.numericScore || 0;
      const clamped = Math.max(-1000, Math.min(1000, numeric));
      const percentage = 50 + (clamped / 20);
      barFill.style.height = `${percentage}%`;
    }
  }

  updateMoveLog() {
    const logBox = document.getElementById('move-history-log');
    if (!logBox) return;

    const history = this.game.history();
    let html = '';

    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = this.escapeHtml(history[i] || '');
      const blackMove = this.escapeHtml(history[i + 1] || '');

      html += `
        <div class="move-row">
          <span class="move-num">${moveNum}.</span>
          <span style="color:#ffffff; font-weight:600;">${whiteMove}</span>
          <span style="color:#94a3b8; font-weight:600;">${blackMove}</span>
        </div>
      `;
    }

    logBox.innerHTML = html;
    logBox.scrollTop = logBox.scrollHeight;
  }
}

// Instantiate App when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new ChessApp();
});
