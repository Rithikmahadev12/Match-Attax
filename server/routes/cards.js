const express = require('express');
const Fuse = require('fuse.js');
const cards = require('../data/cards.json');

const router = express.Router();

const fuse = new Fuse(cards, {
  keys: ['name', 'club'],
  threshold: 0.35,
  includeScore: true,
});

// GET /api/cards - all cards
router.get('/', (req, res) => {
  res.json(cards);
});

// GET /api/cards/search?q=haaland
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json(cards.slice(0, 20));

  const results = fuse.search(q).map(r => r.item);
  res.json(results);
});

// GET /api/cards/:id
router.get('/:id', (req, res) => {
  const card = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
});

module.exports = router;
