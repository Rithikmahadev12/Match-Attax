const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createGame, playTurn, getGame } = require('../game/engine');

const router = express.Router();

// In-memory game sessions (could swap for Redis/DB)
const sessions = new Map();

// POST /api/game/new
router.post('/new', (req, res) => {
  const { playerDeck } = req.body;
  if (!playerDeck || playerDeck.length < 5) {
    return res.status(400).json({ error: 'Need at least 5 cards in deck' });
  }

  const sessionId = uuidv4();
  const game = createGame(playerDeck);
  sessions.set(sessionId, game);

  res.json({ sessionId, game });
});

// GET /api/game/:sessionId
router.get('/:sessionId', (req, res) => {
  const game = sessions.get(req.params.sessionId);
  if (!game) return res.status(404).json({ error: 'Session not found' });
  res.json(game);
});

// POST /api/game/:sessionId/turn
router.post('/:sessionId/turn', (req, res) => {
  const game = sessions.get(req.params.sessionId);
  if (!game) return res.status(404).json({ error: 'Session not found' });

  const { stat } = req.body; // 'attack' | 'defense' | 'star'
  if (!['attack', 'defense', 'star'].includes(stat)) {
    return res.status(400).json({ error: 'stat must be attack, defense or star' });
  }

  const result = playTurn(game, stat);
  sessions.set(req.params.sessionId, result.game);

  res.json(result);
});

// DELETE /api/game/:sessionId
router.delete('/:sessionId', (req, res) => {
  sessions.delete(req.params.sessionId);
  res.json({ ok: true });
});

module.exports = router;
