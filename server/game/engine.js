const cards = require('../data/cards.json');
const { cpuChooseStat } = require('./cpu');

/**
 * Build a shuffled CPU deck from the card pool
 */
function buildCpuDeck(playerDeck) {
  const playerIds = new Set(playerDeck.map(c => c.id));
  const pool = cards.filter(c => !playerIds.has(c.id));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, playerDeck.length);
}

/**
 * Initialise a new game state
 */
function createGame(playerDeck) {
  const cpuDeck = buildCpuDeck(playerDeck);

  return {
    status: 'playing',       // 'playing' | 'finished'
    turn: 'player',          // 'player' | 'cpu'
    round: 1,
    playerDeck: shuffle([...playerDeck]),
    cpuDeck: shuffle([...cpuDeck]),
    playerWon: [],
    cpuWon: [],
    lastResult: null,
  };
}

/**
 * Play a single turn.
 * If it's the player's turn they pick the stat;
 * if it's the CPU's turn the stat is ignored (CPU picks automatically).
 */
function playTurn(game, chosenStat) {
  if (game.status === 'finished') {
    return { game, outcome: 'already_finished' };
  }

  const playerCard = game.playerDeck[0];
  const cpuCard = game.cpuDeck[0];

  // Determine which stat is used
  const stat = game.turn === 'player' ? chosenStat : cpuChooseStat(cpuCard, playerCard);

  const playerVal = playerCard[stat];
  const cpuVal = cpuCard[stat];

  let outcome;
  if (playerVal > cpuVal) {
    outcome = 'player';
    game.playerWon.push(playerCard, cpuCard);
    game.turn = 'player';
  } else if (cpuVal > playerVal) {
    outcome = 'cpu';
    game.cpuWon.push(playerCard, cpuCard);
    game.turn = 'cpu';
  } else {
    // Draw - both cards go to a pot; winner of next round gets them
    outcome = 'draw';
    // Simple: return both to bottom of respective decks
    game.playerDeck.push(game.playerDeck.shift());
    game.cpuDeck.push(game.cpuDeck.shift());
    game.lastResult = { stat, playerVal, cpuVal, playerCard, cpuCard, outcome };
    game.round++;
    return { game, outcome, stat, playerVal, cpuVal, playerCard, cpuCard };
  }

  // Remove top cards
  game.playerDeck.shift();
  game.cpuDeck.shift();
  game.round++;

  game.lastResult = { stat, playerVal, cpuVal, playerCard, cpuCard, outcome };

  // Check win condition
  if (game.playerDeck.length === 0 || game.cpuDeck.length === 0) {
    game.status = 'finished';
    if (game.playerWon.length > game.cpuWon.length) {
      game.winner = 'player';
    } else if (game.cpuWon.length > game.playerWon.length) {
      game.winner = 'cpu';
    } else {
      game.winner = 'draw';
    }
  }

  return { game, outcome, stat, playerVal, cpuVal, playerCard, cpuCard };
}

function getGame(game) {
  return game;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = { createGame, playTurn, getGame };
