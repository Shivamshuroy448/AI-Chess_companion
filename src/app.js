/**
 * Main Application Orchestrator
 * Integrates Stockfish 16 Engine, Google OAuth / Email Auth & Win Tracker.
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

    // User session & win tracker state
    this.currentUser = null;

    this.renderer = new BoardRenderer('chess-board-grid', (square) => this.handleSquareClick(square));

    this.initUserSession();
    this.initGoogleAuth();
    this.initUI();
    this.initPgnImporter();
    this.updateBoard(true);
  }

  /* --- User Session & Google / Email Auth --- */

  initUserSession() {
    const saved = localStorage.getItem('chess_user_session');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
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
          this.loginWithGoogleUser(payload.name, payload.email, payload.picture);
        } catch (e) {
          console.error('Google token parse error', e);
        }
      }
    };

    // Render Native Google Sign-In Button
    const setupNativeButton = () => {
      const target = document.getElementById('google-signin-btn-target');
      if (window.google && window.google.accounts && target) {
        window.google.accounts.id.initialize({
          client_id: '7124968392-sampleclientid.apps.googleusercontent.com',
          callback: window.handleGoogleCredentialResponse
        });

        window.google.accounts.id.renderButton(target, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 320
        });
      }
    };

    if (document.readyState === 'complete') {
      setTimeout(setupNativeButton, 500);
    } else {
      window.addEventListener('load', () => setTimeout(setupNativeButton, 500));
    }
  }

  loginWithGoogleUser(name, email, pictureUrl) {
    const cleanEmail = email ? email.toLowerCase() : '';
    const usersDb = JSON.parse(localStorage.getItem('chess_users_db_v2') || '{}');
    const existing = usersDb[cleanEmail];

    if (existing) {
      existing.picture = pictureUrl || existing.picture;
      existing.username = name || existing.username;
      this.currentUser = existing;
    } else {
      this.currentUser = {
        username: name || 'Google User',
        email: cleanEmail,
        picture: pictureUrl,
        provider: 'google',
        gamesWon: 0,
        gamesPlayed: 0,
        createdAt: new Date().toISOString()
      };
    }

    this.saveUserSession();
    const modalLogin = document.getElementById('modal-login');
    if (modalLogin) modalLogin.classList.add('hidden');
    this.showToast(`✨ Signed in with Google as ${this.currentUser.username}!`);
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
    const nameEl = document.getElementById('user-display-name');
    const wonEl = document.getElementById('stat-games-won');
    const winRateEl = document.getElementById('stat-win-rate');

    if (this.currentUser) {
      loggedOutView?.classList.add('hidden');
      loggedInView?.classList.remove('hidden');

      if (avatarContainer) {
        if (this.currentUser.picture) {
          avatarContainer.innerHTML = `<img src="${this.currentUser.picture}" alt="Avatar" class="user-avatar-img" />`;
        } else {
          avatarContainer.textContent = '👤';
        }
      }

      if (nameEl) nameEl.textContent = this.currentUser.username || this.currentUser.email;
      if (wonEl) wonEl.textContent = this.currentUser.gamesWon || 0;

      const played = this.currentUser.gamesPlayed || 0;
      const won = this.currentUser.gamesWon || 0;
      const rate = played > 0 ? Math.round((won / played) * 100) : 0;
      if (winRateEl) winRateEl.textContent = rate;
    } else {
      loggedInView?.classList.add('hidden');
      loggedOutView?.classList.remove('hidden');
    }
  }

  registerUser(username, email, password, confirmPassword) {
    const cleanName = username ? username.trim() : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPass = password ? password.trim() : '';

    if (!cleanName) return { success: false, msg: 'Please enter a player username.' };
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, msg: 'Please enter a valid email address.' };
    if (!cleanPass || cleanPass.length < 6) return { success: false, msg: 'Password must be at least 6 characters long.' };
    if (cleanPass !== confirmPassword) return { success: false, msg: 'Passwords do not match!' };

    const usersDb = JSON.parse(localStorage.getItem('chess_users_db_v2') || '{}');
    if (usersDb[cleanEmail]) {
      return { success: false, msg: 'An account with this email already exists! Please log in.' };
    }

    const newUser = {
      username: cleanName,
      email: cleanEmail,
      password: cleanPass,
      gamesWon: 0,
      gamesPlayed: 0,
      createdAt: new Date().toISOString()
    };

    usersDb[cleanEmail] = newUser;
    localStorage.setItem('chess_users_db_v2', JSON.stringify(usersDb));

    this.currentUser = newUser;
    this.saveUserSession();
    this.showToast(`✨ Account created! Welcome, ${cleanName}.`);
    return { success: true };
  }

  loginUser(email, password) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPass = password ? password.trim() : '';

    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, msg: 'Please enter a valid email address.' };
    if (!cleanPass) return { success: false, msg: 'Please enter your password.' };

    const usersDb = JSON.parse(localStorage.getItem('chess_users_db_v2') || '{}');
    const user = usersDb[cleanEmail];

    if (!user) {
      return { success: false, msg: 'No account found with this email. Please sign up!' };
    }

    if (user.password !== cleanPass) {
      return { success: false, msg: 'Incorrect password! Please try again.' };
    }

    this.currentUser = user;
    this.saveUserSession();
    this.showToast(`👋 Welcome back, ${user.username}! Win tracker active.`);
    return { success: true };
  }

  logoutUser() {
    const oldName = this.currentUser ? (this.currentUser.username || this.currentUser.email) : '';
    this.currentUser = null;
    this.saveUserSession();
    this.showToast(`🚪 Logged out ${oldName}. Guest mode active.`);
  }

  recordVictory() {
    if (!this.currentUser) {
      this.currentUser = {
        username: 'Guest Player',
        email: 'guest@local',
        gamesWon: 1,
        gamesPlayed: 1,
        createdAt: new Date().toISOString()
      };
    } else {
      this.currentUser.gamesWon = (this.currentUser.gamesWon || 0) + 1;
      this.currentUser.gamesPlayed = (this.currentUser.gamesPlayed || 0) + 1;
    }

    this.saveUserSession();
    sounds.playCheckmate();
    this.showToast(`🏆 VICTORY RECORDED! Total Wins: ${this.currentUser.gamesWon}`);
  }

  /* --- UI Event Listeners --- */

  initUI() {
    // Auth Modal Elements
    const modalLogin = document.getElementById('modal-login');
    const btnOpenLogin = document.getElementById('btn-open-login');
    const btnCloseModal = document.getElementById('btn-close-modal');

    const tabBtnLogin = document.getElementById('tab-btn-login');
    const tabBtnRegister = document.getElementById('tab-btn-register');
    const formLogin = document.getElementById('auth-form-login');
    const formRegister = document.getElementById('auth-form-register');

    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginErr = document.getElementById('login-error-msg');
    const btnSubmitLogin = document.getElementById('btn-submit-login');

    const regUsername = document.getElementById('reg-username');
    const regEmail = document.getElementById('reg-email');
    const regPassword = document.getElementById('reg-password');
    const regConfirmPass = document.getElementById('reg-confirm-password');
    const regErr = document.getElementById('reg-error-msg');
    const btnSubmitRegister = document.getElementById('btn-submit-register');

    const btnLogout = document.getElementById('btn-user-logout');
    const btnClaimVictory = document.getElementById('btn-claim-victory');

    // Tab Switcher Handlers
    tabBtnLogin?.addEventListener('click', () => {
      tabBtnLogin.classList.add('active');
      tabBtnRegister?.classList.remove('active');
      formLogin?.classList.remove('hidden');
      formRegister?.classList.add('hidden');
    });

    tabBtnRegister?.addEventListener('click', () => {
      tabBtnRegister.classList.add('active');
      tabBtnLogin?.classList.remove('active');
      formRegister?.classList.remove('hidden');
      formLogin?.classList.add('hidden');
    });

    btnOpenLogin?.addEventListener('click', () => {
      modalLogin?.classList.remove('hidden');
      if (loginErr) loginErr.classList.add('hidden');
      if (regErr) regErr.classList.add('hidden');

      // Re-render Google button when modal opens
      const target = document.getElementById('google-signin-btn-target');
      if (window.google && window.google.accounts && target) {
        window.google.accounts.id.renderButton(target, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 320
        });
      }
      loginEmail?.focus();
    });

    btnCloseModal?.addEventListener('click', () => {
      modalLogin?.classList.add('hidden');
    });

    modalLogin?.addEventListener('click', (e) => {
      if (e.target === modalLogin) modalLogin.classList.add('hidden');
    });

    // Login Submission Handler
    const handleLoginSubmit = () => {
      if (loginErr) loginErr.classList.add('hidden');
      const email = loginEmail?.value;
      const pass = loginPassword?.value;

      const res = this.loginUser(email, pass);
      if (res.success) {
        modalLogin?.classList.add('hidden');
        if (loginEmail) loginEmail.value = '';
        if (loginPassword) loginPassword.value = '';
      } else {
        if (loginErr) {
          loginErr.textContent = `⚠️ ${res.msg}`;
          loginErr.classList.remove('hidden');
        }
      }
    };

    btnSubmitLogin?.addEventListener('click', handleLoginSubmit);
    loginPassword?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLoginSubmit();
    });

    // Register Submission Handler
    const handleRegisterSubmit = () => {
      if (regErr) regErr.classList.add('hidden');
      const uname = regUsername?.value;
      const email = regEmail?.value;
      const pass = regPassword?.value;
      const confirmPass = regConfirmPass?.value;

      const res = this.registerUser(uname, email, pass, confirmPass);
      if (res.success) {
        modalLogin?.classList.add('hidden');
        if (regUsername) regUsername.value = '';
        if (regEmail) regEmail.value = '';
        if (regPassword) regPassword.value = '';
        if (regConfirmPass) regConfirmPass.value = '';
      } else {
        if (regErr) {
          regErr.textContent = `⚠️ ${res.msg}`;
          regErr.classList.remove('hidden');
        }
      }
    };

    btnSubmitRegister?.addEventListener('click', handleRegisterSubmit);
    regConfirmPass?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleRegisterSubmit();
    });

    btnLogout?.addEventListener('click', () => this.logoutUser());
    btnClaimVictory?.addEventListener('click', () => this.recordVictory());

    // Color & Board Control Listeners
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
      const currentFen = this.game.fen();
      const fenInput = document.getElementById('input-fen');
      if (fenInput) fenInput.value = currentFen;

      this.clearRecommendations();
      this.updateBoard(true);
      this.showToast(`✨ Loaded ${this.game.history().length} moves! Current position ready.`);
    } catch (err) {
      this.showToast('⚠️ Could not parse move text. Ensure notation format is e.g. 1. e4 e5 2. Nf3');
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
        const loserTurn = this.game.turn();
        const playerWon = (loserTurn !== this.playerColor);
        if (playerWon) {
          this.recordVictory();
        }
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
      const moveStr = evalResult.san ? `${evalResult.from} ➔ ${evalResult.to} (${evalResult.san})` : `${evalResult.from} ➔ ${evalResult.to}`;
      const engineSrc = evalResult.source || 'Stockfish 16 Engine';
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
      const whiteMove = history[i] || '';
      const blackMove = history[i + 1] || '';

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
