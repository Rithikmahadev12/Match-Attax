import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CardDisplay from '../components/carddisplay';
import BattleArena from '../components/battlearena';
import { useStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';

export default function Game() {
  const { collection } = useStore();
  const { gameState, lastResult, startGame, endGame } = useGame();
  const [selectedIds, setSelectedIds] = useState([]);
  const [phase, setPhase] = useState('select'); // 'select' | 'battle' | 'result'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleCard = (card) => {
    setSelectedIds(prev =>
      prev.includes(card.id)
        ? prev.filter(id => id !== card.id)
        : prev.length < 10
          ? [...prev, card.id]
          : prev
    );
  };

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const deck = collection.filter(c => selectedIds.includes(c.id));
      await startGame(deck);
      setPhase('battle');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRematch = async () => {
    await endGame();
    setPhase('select');
    setSelectedIds([]);
  };

  // Redirect to collection if not enough cards
  if (collection.length < 5 && phase === 'select') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">📦</div>
        <h2 className="text-xl font-bold text-white mb-2">Not enough cards</h2>
        <p className="text-gray-400 mb-4">You need at least 5 cards to play. Go collect some!</p>
        <button
          onClick={() => navigate('/collection')}
          className="px-6 py-2.5 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition"
        >
          Browse Cards
        </button>
      </div>
    );
  }

  // Game over
  if (phase === 'battle' && gameState?.status === 'finished') {
    const won = gameState.winner === 'player';
    const drew = gameState.winner === 'draw';
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-6">
        <div className="text-6xl">{won ? '🏆' : drew ? '🤝' : '💀'}</div>
        <h2 className={`font-display text-4xl ${won ? 'text-yellow-400' : drew ? 'text-blue-400' : 'text-red-400'}`}>
          {won ? 'YOU WIN!' : drew ? 'DRAW!' : 'CPU WINS!'}
        </h2>
        <div className="flex gap-8 text-sm">
          <span className="text-green-400">Your cards: {gameState.playerWon.length}</span>
          <span className="text-red-400">CPU cards: {gameState.cpuWon.length}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRematch}
            className="px-6 py-2.5 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition"
          >
            Rematch
          </button>
          <button
            onClick={() => { endGame(); navigate('/'); }}
            className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  // Battle phase
  if (phase === 'battle' && gameState) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-xl text-yellow-400">Battle!</h1>
          <button
            onClick={handleRematch}
            className="text-xs text-gray-500 hover:text-red-400 transition"
          >
            Quit game
          </button>
        </div>
        <BattleArena />
      </div>
    );
  }

  // Deck selection
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-yellow-400">Build Your Deck</h1>
          <p className="text-gray-400 text-sm">Pick 5–10 cards to battle with.</p>
        </div>
        <div className="text-sm text-gray-400">
          Selected: <span className={selectedIds.length >= 5 ? 'text-green-400' : 'text-yellow-400'}>{selectedIds.length}</span> / 10
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex flex-wrap gap-4 mb-8">
        {collection.map(card => (
          <div
            key={card.id}
            onClick={() => toggleCard(card)}
            className="cursor-pointer"
          >
            <CardDisplay
              card={card}
              selected={selectedIds.includes(card.id)}
            />
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-center">
        <button
          onClick={handleStart}
          disabled={selectedIds.length < 5 || loading}
          className="px-8 py-3 bg-yellow-500 text-black font-display font-bold text-lg rounded-xl hover:bg-yellow-400 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? 'Starting...' : `⚔️ Battle! (${selectedIds.length} cards)`}
        </button>
      </div>
    </div>
  );
}
