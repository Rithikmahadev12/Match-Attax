import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, applyPowerUps, BUDGET_MAX } from '../store/gameStore';

// ── CPU AI ────────────────────────────────────────────────────────────────────
function cpuPickAttacker(deck) {
  // Pick the card with highest attack; add 30% randomness
  if (!deck.length) return null;
  if (Math.random() < 0.3) return deck[Math.floor(Math.random() * deck.length)];
  return [...deck].sort((a, b) => b.attack - a.attack)[0];
}
function cpuPickDefender(deck) {
  if (!deck.length) return null;
  if (Math.random() < 0.3) return deck[Math.floor(Math.random() * deck.length)];
  return [...deck].sort((a, b) => b.defense - a.defense)[0];
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MiniCard({ card, faceDown = false, glow = null, onClick, selected }) {
  const posColor = { GK: '#e67e00', DEF: '#1a6ef5', MID: '#15a050', ATK: '#cc2020' }[card?.position] || '#555';
  const base = {
    width: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0, cursor: onClick ? 'pointer' : 'default',
    border: selected ? '2px solid #b8ff3c' : '1.5px solid rgba(255,255,255,0.1)',
    background: faceDown
      ? 'repeating-linear-gradient(45deg,#0a180a,#0a180a 5px,#091409 5px,#091409 10px)'
      : '#0d180d',
    boxShadow: glow === 'win' ? '0 0 0 2px #4aff80, 0 4px 16px rgba(74,255,128,0.4)' :
               glow === 'lose' ? '0 0 0 2px #ff5757' : 'none',
    transition: 'all 0.2s ease',
    transform: selected ? 'translateY(-6px) scale(1.05)' : 'none',
  };
  if (faceDown) return <div style={base} onClick={onClick}><div style={{ height: 90 }} /></div>;
  return (
    <div style={base} onClick={onClick}>
      {card?.photo
        ? <img src={card.photo} alt={card.name} style={{ width: '100%', height: 56, objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
        : <div style={{ width: '100%', height: 56, background: '#0a140a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#1a2a1a' }}>👤</div>
      }
      <div style={{ padding: '4px 5px 6px', background: 'rgba(0,0,0,0.65)' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 9, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{card?.name}</div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 8, color: '#ff5757', width: 18 }}>ATK</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 10, color: '#ff5757' }}>{card?.attack}</span>
        </div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', marginTop: 1 }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 8, color: '#4aabff', width: 18 }}>DEF</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 10, color: '#4aabff' }}>{card?.defense}</span>
        </div>
        <div style={{ marginTop: 2 }}>
          <span style={{ background: posColor, color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 7, padding: '1px 4px', borderRadius: 3 }}>{card?.position}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreStrip({ playerGoals, cpuGoals, round, playerLeft, cpuLeft }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#0d140d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', margin: '0 16px 12px' }}>
      {[
        { goals: playerGoals, label: 'YOU', color: '#4aff80' },
        null,
        { goals: cpuGoals,    label: 'CPU', color: '#ff5757' },
      ].map((item, i) => item === null ? (
        <div key={i} style={{ padding: '10px 0', textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#4a6050', letterSpacing: '0.1em' }}>RND</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: '#b8ff3c' }}>{round}</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, color: '#4a6050' }}>{playerLeft} v {cpuLeft}</div>
        </div>
      ) : (
        <div key={i} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', borderLeft: i === 2 ? '1px solid rgba(255,255,255,0.07)' : 'none', borderRight: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: item.color, lineHeight: 1 }}>{item.goals}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 1, margin: '2px 0' }}>
            {Array.from({ length: Math.min(item.goals, 5) }).map((_, gi) => (
              <span key={gi} style={{ fontSize: 10 }}>⚽</span>
            ))}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', color: '#4a6050' }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN BATTLE ARENA ─────────────────────────────────────────────────────────
export default function BattleArena({ playerDeck: initialPlayerDeck, cpuDeck: initialCpuDeck, activePowerUps = [], onGameEnd }) {
  const [phase, setPhase]   = useState('coinflip'); // coinflip | attack | defend | result | over
  const [playerDeck, setPlayerDeck] = useState(() => initialPlayerDeck.map(c => applyPowerUps(c, activePowerUps)));
  const [cpuDeck,    setCpuDeck]    = useState(initialCpuDeck);
  const [playerBoard, setPlayerBoard] = useState([]);
  const [cpuBoard,    setCpuBoard]    = useState([]);
  const [playerGoals, setPlayerGoals] = useState(0);
  const [cpuGoals,    setCpuGoals]    = useState(0);
  const [round,       setRound]       = useState(0);
  const [currentAttacker, setCurrentAttacker] = useState(null); // 'player' | 'cpu'
  const [selected,    setSelected]    = useState(null);
  const [lastResult,  setLastResult]  = useState(null);
  const [coinResult,  setCoinResult]  = useState(null);
  const [flipping,    setFlipping]    = useState(false);

  // Coin flip on mount
  useEffect(() => {
    setFlipping(true);
    const t = setTimeout(() => {
      const heads = Math.random() < 0.5;
      const firstAttacker = heads ? 'player' : 'cpu';
      setCoinResult({ heads, firstAttacker });
      setCurrentAttacker(firstAttacker);
      setFlipping(false);
      setTimeout(() => setPhase(firstAttacker === 'player' ? 'attack' : 'defend'), 2200);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const isPlayerTurn  = currentAttacker === 'player';
  const playerRole    = isPlayerTurn ? 'attack' : 'defend';

  // ── Resolve a round ───────────────────────────────────────────────────────
  const resolveRound = (attackerCard, attackerSide, defenderCard, defenderSide) => {
    const atk  = attackerCard.attack;
    const def  = defenderCard.defense;
    const goal = atk > def;
    const result = { atk, def, goal, attackerCard, defenderCard, attackerSide };

    // Move cards to boards
    if (attackerSide === 'player') {
      setPlayerDeck(d => d.filter(c => c._id !== attackerCard._id));
      setPlayerBoard(b => [...b, attackerCard]);
    } else {
      setCpuDeck(d => d.filter(c => c._id !== attackerCard._id));
      setCpuBoard(b => [...b, attackerCard]);
    }
    if (defenderSide === 'player') {
      setPlayerDeck(d => d.filter(c => c._id !== defenderCard._id));
      setPlayerBoard(b => [...b, defenderCard]);
    } else {
      setCpuDeck(d => d.filter(c => c._id !== defenderCard._id));
      setCpuBoard(b => [...b, defenderCard]);
    }

    if (goal) {
      if (attackerSide === 'player') setPlayerGoals(g => g + 1);
      else                            setCpuGoals(g => g + 1);
    }

    setLastResult(result);
    setSelected(null);
    setRound(r => r + 1);
    setPhase('result');

    // Check remaining decks (need state updater pattern; use callbacks)
    setTimeout(() => {
      setPlayerDeck(pd => {
        setCpuDeck(cd => {
          const nextPd = pd.filter(c => c._id !== attackerCard._id && c._id !== defenderCard._id);
          const nextCd = cd.filter(c => c._id !== attackerCard._id && c._id !== defenderCard._id);
          const over = nextPd.length === 0 || nextCd.length === 0;
          if (over) {
            setPhase('over');
          } else {
            // Alternate attacker
            const nextAttacker = attackerSide === 'player' ? 'cpu' : 'player';
            setCurrentAttacker(nextAttacker);
            setPhase(nextAttacker === 'player' ? 'attack' : 'defend');
          }
          return pd; // don't double-update; already updated above
        });
        return pd;
      });
    }, 2000);
  };

  // ── Player actions ────────────────────────────────────────────────────────
  const handlePlayerAttack = () => {
    if (!selected) return;
    const defender = cpuPickDefender(cpuDeck);
    if (!defender) return;
    resolveRound(selected, 'player', defender, 'cpu');
  };

  const handlePlayerDefend = () => {
    if (!selected) return;
    const attacker = cpuPickAttacker(cpuDeck);
    if (!attacker) return;
    resolveRound(attacker, 'cpu', selected, 'player');
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const phaseBanner = () => {
    if (phase === 'attack') return { text: '⚔️ YOUR TURN — pick your attacker', cls: 'atk' };
    if (phase === 'defend') return { text: '🛡️ CPU IS ATTACKING — pick your defender', cls: 'def' };
    if (phase === 'result' && lastResult) {
      const { goal, attackerSide, atk, def } = lastResult;
      if (goal && attackerSide === 'player') return { text: `⚽ GOAL! ATK ${atk} beat DEF ${def}!`, cls: 'goal' };
      if (goal && attackerSide === 'cpu')    return { text: `💀 CPU SCORED! ATK ${atk} vs DEF ${def}`, cls: 'bad' };
      return { text: `🛡️ DEFENDED! DEF ${def} held off ATK ${atk}`, cls: 'def' };
    }
    return null;
  };

  const banner = phaseBanner();

  // ── Coin flip screen ──────────────────────────────────────────────────────
  if (phase === 'coinflip' || flipping || (coinResult && phase === 'coinflip')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 20, padding: 24 }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, border: '3px solid #ffd700', background: '#1a1200', animation: 'coinSpin 1.5s ease forwards' }}>
          {coinResult?.heads ? '🟡' : '⚪'}
        </div>
        {coinResult && (
          <>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: '#fff' }}>
              {coinResult.heads ? 'HEADS!' : 'TAILS!'}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: coinResult.firstAttacker === 'player' ? '#ff5757' : '#4aabff' }}>
              {coinResult.firstAttacker === 'player' ? '🔴 YOU ATTACK FIRST!' : '🔵 CPU ATTACKS FIRST!'}
            </div>
          </>
        )}
        <style>{`@keyframes coinSpin{0%{transform:rotateY(0)}50%{transform:rotateY(720deg) scale(1.2)}100%{transform:rotateY(1440deg)}}`}</style>
      </div>
    );
  }

  // ── Game over screen ──────────────────────────────────────────────────────
  if (phase === 'over') {
    const won  = playerGoals > cpuGoals;
    const drew = playerGoals === cpuGoals;
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>{won ? '🏆' : drew ? '🤝' : '💀'}</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 48, color: won ? '#b8ff3c' : drew ? '#4aabff' : '#ff5757', marginBottom: 20 }}>
          {won ? 'YOU WIN!' : drew ? 'DRAW!' : 'CPU WINS!'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, background: '#0d140d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 32px', maxWidth: 260, margin: '0 auto 28px' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: '#4aff80' }}>{playerGoals}</div>
            <div style={{ fontSize: 16 }}>{Array.from({ length: Math.min(playerGoals, 6) }).map((_, i) => <span key={i}>⚽</span>)}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: '#4a6050' }}>YOU</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: '#ff5757' }}>{cpuGoals}</div>
            <div style={{ fontSize: 16 }}>{Array.from({ length: Math.min(cpuGoals, 6) }).map((_, i) => <span key={i}>⚽</span>)}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: '#4a6050' }}>CPU</div>
          </div>
        </div>
        {won && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#ffd700', marginBottom: 16 }}>+100 coins earned!</div>}
        <button onClick={() => onGameEnd?.({ playerGoals, cpuGoals, won, drew })} style={{ width: '100%', padding: '14px 0', fontSize: 18, borderRadius: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, cursor: 'pointer', background: '#b8ff3c', border: 'none', color: '#050c05' }}>
          Play Again
        </button>
      </div>
    );
  }

  // ── Main board ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ScoreStrip playerGoals={playerGoals} cpuGoals={cpuGoals} round={round} playerLeft={playerDeck.length} cpuLeft={cpuDeck.length} />

      {/* Phase banner */}
      {banner && (
        <div style={{
          margin: '0 16px 10px', padding: '10px 14px', borderRadius: 10,
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: '0.06em',
          background: banner.cls === 'atk' ? 'rgba(255,87,87,0.12)' : banner.cls === 'goal' ? 'rgba(184,255,60,0.1)' : banner.cls === 'bad' ? 'rgba(255,87,87,0.12)' : 'rgba(74,171,255,0.12)',
          border: `1px solid ${banner.cls === 'atk' ? 'rgba(255,87,87,0.3)' : banner.cls === 'goal' ? 'rgba(184,255,60,0.25)' : banner.cls === 'bad' ? 'rgba(255,87,87,0.3)' : 'rgba(74,171,255,0.3)'}`,
          color: banner.cls === 'atk' ? '#ff8080' : banner.cls === 'goal' ? '#b8ff3c' : banner.cls === 'bad' ? '#ff8080' : '#7dc8ff',
        }}>
          {banner.text}
        </div>
      )}

      {/* Pitch board */}
      <div style={{ margin: '0 16px', background: 'linear-gradient(180deg,#071407,#0a1c0a,#071407)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
        {/* CPU board — face up (you can see what they played) */}
        <div style={{ padding: '10px 10px 8px', minHeight: 110, display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'flex-start', background: 'rgba(74,171,255,0.03)' }}>
          <div style={{ width: '100%', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', color: 'rgba(74,171,255,0.4)', marginBottom: 3 }}>CPU PLAYED</div>
          {cpuBoard.length === 0
            ? <div style={{ width: '100%', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.1)', textAlign: 'center', padding: '12px 0' }}>No cards yet</div>
            : cpuBoard.map(c => <MiniCard key={c._id} card={c} glow={lastResult?.attackerCard?._id === c._id && lastResult?.goal && lastResult?.attackerSide === 'cpu' ? 'win' : undefined} />)
          }
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ background: '#0a1c0a', padding: '2px 10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)' }}>PITCH</span>
        </div>

        {/* Player board — face up */}
        <div style={{ padding: '8px 10px 10px', minHeight: 110, display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'flex-start', background: 'rgba(184,255,60,0.02)' }}>
          <div style={{ width: '100%', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', color: 'rgba(184,255,60,0.35)', marginBottom: 3 }}>YOUR PLAYED</div>
          {playerBoard.length === 0
            ? <div style={{ width: '100%', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.1)', textAlign: 'center', padding: '12px 0' }}>Your cards appear here</div>
            : playerBoard.map(c => <MiniCard key={c._id} card={c} glow={lastResult?.attackerCard?._id === c._id && lastResult?.goal && lastResult?.attackerSide === 'player' ? 'win' : undefined} />)
          }
        </div>
      </div>

      {/* Action zone */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', color: '#4a6050', textTransform: 'uppercase', marginBottom: 8 }}>
          {phase === 'attack' ? 'Your squad — tap to select attacker:' : phase === 'defend' ? 'Your squad — tap to select defender:' : 'Waiting...'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
          {playerDeck.map(card => (
            <MiniCard
              key={card._id}
              card={card}
              selected={selected?._id === card._id}
              onClick={() => (phase === 'attack' || phase === 'defend') ? setSelected(s => s?._id === card._id ? null : card) : null}
            />
          ))}
          {playerDeck.length === 0 && (
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#4a6050', padding: '20px 0', width: '100%', textAlign: 'center' }}>No cards remaining</div>
          )}
        </div>

        {(phase === 'attack' || phase === 'defend') && (
          <button
            onClick={phase === 'attack' ? handlePlayerAttack : handlePlayerDefend}
            disabled={!selected}
            style={{
              width: '100%', padding: '14px 0', fontSize: 18, borderRadius: 10,
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, cursor: selected ? 'pointer' : 'not-allowed',
              background: selected ? '#b8ff3c' : '#1a2a1a', border: 'none',
              color: selected ? '#050c05' : '#4a6050', transition: 'all 0.15s',
            }}
          >
            {phase === 'attack' ? '⚔️ ATTACK!' : '🛡️ DEFEND!'}
          </button>
        )}
      </div>
    </div>
  );
}
