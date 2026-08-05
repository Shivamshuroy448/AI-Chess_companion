# ♟️ Chess AI Companion — Stockfish 16 Engine

> **Live Demo**: [https://shivamshuroy448.github.io/AI-Chess_companion/](https://shivamshuroy448.github.io/AI-Chess_companion/)

**Chess AI Companion** is an enterprise-grade, real-time chess assistant and tactical evaluation dashboard powered by **Stockfish 16 NNUE**. Designed for live game analysis, mid-game position reconstruction, daily tactical training, and global leaderboard progression.

---

## 🔥 Key Features

### 1. 🤖 Stockfish 16 NNUE Engine & Master Opening Book
- Real-time position analysis with tactical evaluation score and dynamic move recommendation arrows.
- Master Opening Book (3500+ ELO) fallback for sub-50ms instant opening recommendations.

### 2. 📊 Real-Time Win Probability % Odds Bar
- Calculates win, draw, and loss probabilities on every turn (`⚪ White Win % | 🤝 Draw % | 🖤 Black Win %`).
- Evaluates winning chances using sigmoid evaluation scaling.

### 3. 🧩 Daily Tactical Puzzles & ELO Bonus Mode
- Curated grandmaster tactical positions (*Morphy's Opera Game Mate, Philidor's Smothered Mate, Greek Gift Sac, Back-Rank Execution*).
- Solve positions directly on the board to earn **+15 ELO bonus points** on your profile!

### 4. 🔑 Google 1-Click Sign-In & Verified Profile
- Secure Google OAuth authentication.
- Track verified victories, custom nationality flags, and live ELO ratings.

### 5. 🏆 Worldwide Live Leaderboard
- Real-time global player rankings and total win ticker.
- Guest Mode Blur Shield encouraging player registration for ELO tracking.

### 6. 📜 Multi-Platform Game Importer & Instant Clipboard (`Ctrl + V`)
- Direct Lichess game URL auto-fetch (`https://lichess.org/game/...`).
- Multi-proxy fallback pipeline for Chess.com game fetching.
- **Global `Ctrl + V` Move Paste**: Copy move notation (e.g. `1. e4 e5 2. Nc3`) or PGN anywhere on the web, press `Ctrl + V` on the app, and load mid-game positions instantly!

### 7. 🎨 Cyberpunk Aesthetic & Sound Engine
- Multiple visual themes (*Cyberpunk Neon, Midnight Glass, Emerald Grandmaster*).
- Sound effects for move, capture, check, and checkmate.

---

## 🛠️ Technology Stack

- **Core Engine**: Stockfish 16 WebWorker (NNUE) + Chess.js
- **Frontend**: Vanilla HTML5, CSS3 (Modern Glassmorphism & Custom Properties), ES6 Modules
- **Build Tool**: Vite 5
- **Authentication**: Google Identity Services (GIS SDK)
- **Deployment**: GitHub Pages

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16.0.0 or higher)
- npm

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Shivamshuroy448/AI-Chess_companion.git
   cd AI-Chess_companion
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run local dev server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173/`

### Production Build

```bash
npm run build
```

The output production bundle will be generated in the `dist/` directory.

---

## 📂 Project Architecture

```text
AI-Chess_companion/
├── ai_companion_extension/   # Chrome Extension & Userscript Helper
│   ├── manifest.json
│   ├── background.js
│   └── content.js
├── src/                      # Application Source Code
│   ├── app.js                # Main Orchestrator & App Controller
│   ├── stockfishEngine.js    # Stockfish 16 Engine & NNUE Evaluator
│   ├── boardRenderer.js      # Custom Canvas & SVG Overlay Renderer
│   ├── soundEffects.js       # Web Audio API Sound Engine
│   ├── puzzles.js            # Curated Grandmaster Tactical Puzzles
│   └── style.css             # Cyberpunk Design Tokens & Stylesheet
├── index.html                # Single-Page Application Entrypoint
├── vite.config.js            # Vite Build & Asset Pipeline Config
└── README.md                 # Project Documentation
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
