/**
 * Curated Grandmaster Tactical Puzzles Database
 */

export const PUZZLES = [
  {
    id: 'opera-game',
    title: 'Morphy\'s Opera Game Mate',
    fen: 'rn2kb1r/pp3ppp/2p1pbn1/8/4B3/4BN2/PPP2PPP/3R2K1 w kq - 0 1',
    description: 'White to move and force checkmate! Find Morphy\'s brilliant tactical sequence.',
    solutionMoves: ['e4d5', 'c6d5', 'd1d8'],
    initialTurn: 'w',
    eloBonus: 15
  },
  {
    id: 'smothered-mate',
    title: 'Philidor\'s Smothered Mate',
    fen: '6rk/5Npp/8/8/8/8/8/6K1 w - - 0 1',
    description: 'White to move and deliver a classic smothered checkmate!',
    solutionMoves: ['f7h6'],
    initialTurn: 'w',
    eloBonus: 15
  },
  {
    id: 'greek-gift',
    title: 'The Greek Gift Sac',
    fen: 'r1bq1rk1/ppp2ppp/2n1p3/3pP3/3P3n/2PB1N2/PP1N1PPP/R2QK2R w KQ - 0 1',
    description: 'White to move. Sac the bishop on h7 to shatter Black\'s kingside!',
    solutionMoves: ['d3h7'],
    initialTurn: 'w',
    eloBonus: 15
  },
  {
    id: 'back-rank',
    title: 'Back-Rank Execution',
    fen: '3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    description: 'White to move and punish Black\'s weak back rank!',
    solutionMoves: ['d1d8'],
    initialTurn: 'w',
    eloBonus: 15
  }
];
