import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CardDisplay from '../components/carddisplay';
import BattleArena from '../components/battlearena';
import { useStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';

export default function Game() {
  const { collection } = useStore();
  const { gameState, startGame, endGame } = useGame();
  const [selectedIds, setSelectedIds] = useState([]);
  const [playerDeck, setPlayerDeck] = useState([]);
  const [phase, setPhase] = useState('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleCard = (card) => {
    setSelectedIds(prev =>
      prev.includes(card.id)
        ? prev.filter(id => id !== card.id)
        : prev.length < 10 ? [...prev, card.id] : prev
    );
  };

  const handleStart = async () => {
    setLoading(true); setError('');
    try {
      const deck = collection.filter(c => selectedIds.includes(c.id));
      setPlayerDeck(deck);
      await startGame(deck);
      setPhase('battle');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleRematch = async () => {
    await endGame();
    setPhase('select');
    setSelectedIds([]);
    setPlayerDeck([]);
  };

  if (collection.length < 5 && phase === 'select') {
    return (
      <div className="page-content" style={{ maxWidth: 480, margin: '0 auto', padding: '80px 20px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 32, color: '#fff', marginBottom: 8 }}>
          NOT ENOUGH CARDS
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 28 }}>You need at least 5 cards to battle.</p>
        <button onClick={() => navigate('/collection')} className="btn-lime" style={{ padding: '14px 32px', fontSize: 18 }}>
          Browse Cards
        </button>
      </div>
    );
  }

  if (phase === 'battle' && gameState) {
    return (
      <div className="page-content" style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, color: 'var(--lime)' }}>
            BATTLE!
          </div>
          <button
            onClick={handleRematch}
            style={{
              background: 'none', border: '1px solid rgba(255,60,60,0.3)',
              color: '#ff6060', cursor: 'pointer', borderRadius: 8,
              padding: '6px 14px', fontSize: 11,
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.06em',
            }}
          >
            QUIT
          </button>
        </div>
        <BattleArena
          playerDeck={playerDeck}
          cpuDeck={gameState.cpuDeck || []}
          onGameEnd={handleRematch}
        />
      </div>
    );
  }

  // Deck selection
  return (
    <div className="page-content" style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900, fontSize: 36,
            color: '#fff', letterSpacing: '-0.01em', lineHeight: 1,
          }}>
            BUILD YOUR <span style={{ color: 'var(--lime)' }}>DECK</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>Pick 5–10 cards to battle with</p>
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: 28,
          color: selectedIds.length >= 5 ? 'var(--lime)' : 'rgba(255,255,255,0.3)',
        }}>
          {selectedIds.length}<span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 700 }}>/10</span>
        </div>
      </div>

      {error && <p style={{ color: '#ff6060', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 100, justifyContent: 'center' }}>
        {collection.map(card => (
          <div key={card.id} onClick={() => toggleCard(card)} style={{ cursor: 'pointer' }}>
            <CardDisplay card={card} selected={selectedIds.includes(card.id)} />
          </div>
        ))}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-h) + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 400,
        zIndex: 50,
      }}>
        <button
          onClick={handleStart}
          disabled={selectedIds.length < 5 || loading}
          className="btn-lime"
          style={{
            width: '100%',
            padding: '16px 0',
            fontSize: 22,
            borderRadius: 16,
            boxShadow: selectedIds.length >= 5 ? '0 8px 32px var(--lime-glow-strong)' : 'none',
          }}
        >
          {loading ? 'STARTING...' : `⚔️ BATTLE! (${selectedIds.length} cards)`}
        </button>
      </div>
    </div>
  );
}
