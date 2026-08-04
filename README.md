# Chess AI Companion

Live Demo: https://shivamshuroy448.github.io/AI-Chess_companion/

A chess assistant and analysis dashboard powered by Stockfish 16 NNUE. Designed for move analysis and mid-game position reconstruction.

## Features

- Stockfish 16 Engine: Calculates move recommendations with sub-50ms tactical evaluation.
- Quiescence Search: Defender verification to prevent hanging piece blunders.
- PGN & Move Importer: Paste move notation (e.g. `1. e4 e6 2. Nc3 Qh4`) or FEN strings to analyze mid-game positions.
- Mirror Mode: Interactive board for opponent move input and move recommendation arrows.
- Extension Support: Manifest V3 extension located inside `ai_companion_extension/`.

## Live Application

The application is deployed live on GitHub Pages:
https://shivamshuroy448.github.io/AI-Chess_companion/

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Shivamshuroy448/AI-Chess_companion.git
   cd AI-Chess_companion
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173/` in your browser.

## Project Structure

```text
AI-Chess_companion/
├── ai_companion_extension/   # Chrome Extension & Userscript
│   ├── manifest.json
│   ├── background.js
│   └── content.js
├── src/                      # Source Code
│   ├── app.js                # Main Orchestrator
│   ├── stockfishEngine.js    # Stockfish 16 Engine
│   ├── boardRenderer.js      # Board UI & SVG Renderer
│   └── style.css             # Stylesheet
├── index.html                # Entrypoint
├── vite.config.js            # Vite Configuration
└── README.md                 # Documentation
```

## License

MIT License.
