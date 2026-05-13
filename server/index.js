const express = require('express');
const cors = require('cors');
const path = require('path');

const cardsRouter = require('./routes/cards');
const gameRouter = require('./routes/game');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/cards', cardsRouter);
app.use('/api/game', gameRouter);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Match Attax server running on port ${PORT}`);
});
