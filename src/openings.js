/**
 * Real-Time ECO Chess Openings Database
 * Maps move notation sequences to official opening names.
 */

export const OPENINGS_DB = [
  { moves: 'e4', name: 'King\'s Pawn Game', eco: 'B00' },
  { moves: 'e4 e5', name: 'Open Game', eco: 'C20' },
  { moves: 'e4 e5 Nf3', name: 'King\'s Knight Opening', eco: 'C40' },
  { moves: 'e4 e5 Nf3 Nc6', name: 'King\'s Knight: Normal Variation', eco: 'C44' },
  { moves: 'e4 e5 Nf3 Nc6 Bb5', name: 'Ruy Lopez (Spanish Opening)', eco: 'C60' },
  { moves: 'e4 e5 Nf3 Nc6 Bb5 a6', name: 'Ruy Lopez: Morphy Defense', eco: 'C70' },
  { moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6', name: 'Ruy Lopez: Closed Defense', eco: 'C84' },
  { moves: 'e4 e5 Nf3 Nc6 Bc4', name: 'Italian Game', eco: 'C50' },
  { moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5', name: 'Giuoco Piano (Italian Game)', eco: 'C53' },
  { moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6', name: 'Two Knights Defense', eco: 'C55' },
  { moves: 'e4 e5 Nf3 Nc6 d4', name: 'Scotch Game', eco: 'C44' },
  { moves: 'e4 c5', name: 'Sicilian Defense', eco: 'B20' },
  { moves: 'e4 c5 Nf3', name: 'Sicilian Defense: Open Opening', eco: 'B27' },
  { moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6', name: 'Sicilian Defense: Najdorf Variation', eco: 'B90' },
  { moves: 'e4 c5 Nf3 Nc6', name: 'Sicilian Defense: Old Sicilian', eco: 'B30' },
  { moves: 'e4 e6', name: 'French Defense', eco: 'C00' },
  { moves: 'e4 e6 d4 d5', name: 'French Defense: Normal Variation', eco: 'C01' },
  { moves: 'e4 e6 d4 d5 Nc3', name: 'French Defense: Paulsen Variation', eco: 'C10' },
  { moves: 'e4 c6', name: 'Caro-Kann Defense', eco: 'B10' },
  { moves: 'e4 c6 d4 d5', name: 'Caro-Kann Defense: Main Line', eco: 'C12' },
  { moves: 'e4 d5', name: 'Scandinavian Defense', eco: 'B01' },
  { moves: 'e4 d6', name: 'Pirc Defense', eco: 'B07' },
  { moves: 'e4 g6', name: 'Modern Defense', eco: 'B06' },
  { moves: 'e4 Nf6', name: 'Alekhine\'s Defense', eco: 'B02' },
  { moves: 'd4', name: 'Queen\'s Pawn Game', eco: 'A40' },
  { moves: 'd4 d5', name: 'Double Queen\'s Pawn Game', eco: 'D00' },
  { moves: 'd4 d5 c4', name: 'Queen\'s Gambit', eco: 'D06' },
  { moves: 'd4 d5 c4 dxc4', name: 'Queen\'s Gambit Accepted', eco: 'D20' },
  { moves: 'd4 d5 c4 e6', name: 'Queen\'s Gambit Declined', eco: 'D30' },
  { moves: 'd4 d5 c4 c6', name: 'Slav Defense', eco: 'D10' },
  { moves: 'd4 Nf6', name: 'Indian Defense', eco: 'A45' },
  { moves: 'd4 Nf6 c4 e6 Nf3 b6', name: 'Queen\'s Indian Defense', eco: 'E12' },
  { moves: 'd4 Nf6 c4 g6', name: 'King\'s Indian Defense', eco: 'E60' },
  { moves: 'd4 Nf6 c4 c5', name: 'Benoni Defense', eco: 'A56' },
  { moves: 'd4 f5', name: 'Dutch Defense', eco: 'A80' },
  { moves: 'c4', name: 'English Opening', eco: 'A10' },
  { moves: 'Nf3', name: 'Réti Opening', eco: 'A04' },
  { moves: 'b3', name: 'Nimzo-Larsen Attack', eco: 'A01' },
  { moves: 'f4', name: 'Bird\'s Opening', eco: 'A02' }
];

export function identifyOpening(historyMoves) {
  if (!historyMoves || historyMoves.length === 0) {
    return { name: 'Starting Position', eco: 'A00' };
  }

  const movesString = historyMoves.join(' ');
  let bestMatch = { name: 'Custom Mid-Game Position', eco: 'A00' };

  for (const item of OPENINGS_DB) {
    if (movesString.startsWith(item.moves)) {
      bestMatch = item;
    }
  }

  return bestMatch;
}
