import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardDisplay from './carddisplay';
import { useGame } from '../hooks/useGame';

const STATS = [
  { key: 'attack',  label: 'ATTACK',  icon: '⚔️', color: '#ff5c5c', border: 'rgba(255,92,92,0.3)' },
  { key: 'defense', label: 'DEFENSE', icon: '🛡️', color: '#4aabff', border: 'rgba(74,171,255,0.3)' },
  { key: 'star',    label: 'STAR',    icon: '⭐', color: '#ffd700', border: 'rgba(255,215,0,0.3)' },
];

export default function BattleArena() {
  const { gameState, lastResult, playTurn } = useGame();
  const [busy, setBusy] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  if (!gameState) return null;

  const playerCard = gameState.playerDeck[0];
  const cpuCard = gameState.cpuDeck[0];
  const isPlayerTurn = gameState.turn === 'player';

  const handleStat = async (stat) => {
    if (busy || !isPlayerTurn) return;
    setBusy(true);
    try {
      await playTurn(stat);
      setAnimKey(k => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const getOutcome = () => {
    if (!lastResult) return null;
    if (lastResult.outcome === 'player') return { text: 'YOU WIN THIS ROUND', color: '#4aff80', icon: '🏆' };
    if (lastResult.outcome === 'cpu')    return { text: 'CPU TAKES IT', color: '#ff5c5c', icon: '💀' };
    return { text: 'DRAW', color: '#ffd700', icon: '🤝' };
  };

  const outcome = getOutcome();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>

      {/* Score bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        background: 'var(--surface)',
        border: '1px solid var(--border-dim)',
        borderRadius: 14,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 400,
      }}>
        <div style={{ flex: 1, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 24, color: '#4aff80' }}>
            {gameState.playerWon.length}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>YOU</div>
        </div>
        <div style={{ width: '1px', background: 'var(--border-dim)', alignSelf: 'stretch' }} />
        <div style={{ flex: 1, padding: '12px 0', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em' }}>ROUND</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, color: 'var(--lime)' }}>{gameState.round}</div>
        </div>
        <div style={{ width: '1px', background: 'var(--border-dim)', alignSelf: 'stretch' }} />
        <div style={{ flex: 1, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 24, color: '#ff5c5c' }}>
            {gameState.cpuWon.length}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>CPU</div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Player */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 10, color: '#4aff80', letterSpacing: '0.12em' }}>YOUR CARD</span>
          <AnimatePresence mode="wait">
            <motion.div key={`p-${animKey}`} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              <CardDisplay card={playerCard} highlight={lastResult?.outcome === 'player' ? 'win' : lastResult?.outcome === 'cpu' ? 'lose' : undefined} />
            </motion.div>
          </AnimatePresence>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: 'var(--muted)' }}>{gameState.playerDeck.length} left</span>
        </div>

        {/* Middle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 60 }}>
          {outcome ? (
            <motion.div key={animKey} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{outcome.icon}</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 13,
                color: outcome.color,
                letterSpacing: '0.06em',
                textAlign: 'center',
                lineHeight: 1.2,
              }}>{outcome.text}</div>
              {lastResult && (
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{lastResult.stat}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, color: '#fff', marginTop: 2 }}>
                    <span style={{ color: '#4aff80' }}>{lastResult.playerVal}</span>
                    <span style={{ color: 'var(--muted)' }}> vs </span>
                    <span style={{ color: '#ff5c5c' }}>{lastResult.cpuVal}</span>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, color: 'var(--muted)' }}>VS</div>
          )}
        </div>

        {/* CPU */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 10, color: '#ff5c5c', letterSpacing: '0.12em' }}>CPU CARD</span>
          <AnimatePresence mode="wait">
            <motion.div key={`c-${animKey}`} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              <CardDisplay card={cpuCard} highlight={lastResult?.outcome === 'cpu' ? 'win' : lastResult?.outcome === 'player' ? 'lose' : undefined} />
            </motion.div>
          </AnimatePresence>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: 'var(--muted)' }}>{gameState.cpuDeck.length} left</span>
        </div>
      </div>

      {/* Stat pick */}
      {gameState.status === 'playing' && (
        <div style={{ width: '100%', maxWidth: 400 }}>
          {isPlayerTurn ? (
            <div>
              <p style={{
                textAlign: 'center',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: 'var(--muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>Choose your stat</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {STATS.map(({ key, label, icon, color, border }) => (
                  <button
                    key={key}
                    onClick={() => handleStat(key)}
                    disabled={busy}
                    style={{
                      flex: 1,
                      padding: '14px 8px',
                      background: 'var(--surface)',
                      border: `1px solid ${border}`,
                      borderRadius: 14,
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.4 : 1,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onMouseEnter={e => { if (!busy) e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 13, color, letterSpacing: '0.08em' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                CPU IS THINKING...
              </p>
              <button
                onClick={() => handleStat('attack')}
                disabled={busy}
                className="btn-lime"
                style={{ padding: '14px 32px', fontSize: 18, width: '100%' }}
              >
                {busy ? 'PLAYING...' : 'LET CPU PLAY →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
