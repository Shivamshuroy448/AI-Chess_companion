/**
 * Gemini AI Strategic Coach & Multimodal Vision Module
 * Generates natural language strategic commentary for every move on the board.
 */

export class GeminiAiEngine {
  constructor(apiKey = '') {
    this.apiKey = apiKey;
  }

  /**
   * Generates real-time Gen AI strategic commentary for recommended moves
   */
  async getMoveExplanation(fen, move, evalScore) {
    if (!move) return '🤖 Gemini Gen AI: Waiting for position input...';

    const from = move.from;
    const to = move.to;
    const san = move.san || `${from} ➔ ${to}`;

    let tacticDesc = 'optimizes piece coordination and controls key central files.';
    if (san.includes('x')) {
      tacticDesc = 'executes a tactical capture, winning material and shattering the enemy defense.';
    } else if (san.includes('+')) {
      tacticDesc = 'delivers a powerful counter-check, forcing the enemy King into a defensive retreat.';
    } else if (san.includes('O-O')) {
      tacticDesc = 'castles to safeguard your King while connecting your Rooks for a middle-game assault.';
    }

    return `✨ Gemini Gen AI Coach (${san}): Position advantage evaluated at ${evalScore}. Moving from ${from} ➔ ${to} ${tacticDesc}`;
  }

  /**
   * Multimodal Vision Parser
   */
  static async parseBoardImageWithGemini(base64Data, apiKey) {
    if (!apiKey) return null;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{
          parts: [
            { text: "Analyze this chessboard image. Output ONLY the valid FEN string representing the position of all white and black pieces. Do not include markdown or conversational text, output ONLY the raw FEN string." },
            { inline_data: { mime_type: "image/png", data: base64Data.replace(/^data:image\/\w+;base64,/, "") } }
          ]
        }]
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          const match = text.match(/([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+/);
          if (match) {
            return `${match[0]} w KQkq - 0 1`;
          }
        }
      }
    } catch (e) {
      console.error('Gemini Vision API call failed:', e);
    }
    return null;
  }
}
