import { useState, useEffect } from 'react';
import { useStore, applyPowerUps } from '../store/gameStore';

const POS_COLOR = {
  GK:'#e67e00', CB:'#1a6ef5', LB:'#1a6ef5', RB:'#1a6ef5',
  CDM:'#15a050', CM:'#15a050', CAM:'#e05010', SS:'#e05010',
  LW:'#cc2020', RW:'#cc2020', ST:'#aa1010',
};

// ── Card components ────────────────────────────────────────────────────────────
function CardFaceDown({ small }) {
  const w = small ? 58 : 72;
  const h = small ? 80 : 100;
  return (
    <div style={{
      width: w, height: h, borderRadius: 8, flexShrink: 0,
      background: 'repeating-linear-gradient(45deg,#0a1a0a,#0a1a0a 5px,#091209 5px,#091209 10px)',
      border: '1.5px solid rgba(74,171,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: small ? 16 : 20, opacity: 0.7,
    }}>
      🂠
    </div>
  );
}

function CardFaceUp({ card, glow, small, selected, onClick }) {
  const w = small ? 58 : 72;
  const posColor = POS_COLOR[card?.position] || '#555';
  return (
    <div onClick={onClick} style={{
      width: w, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
      background: 'var(--surface2)',
      border: selected ? '2px solid var(--lime)' : glow === 'win' ? '2px solid #4aff80' : glow === 'lose' ? '2px solid #ff5757' : '1.5px solid rgba(255,255,255,0.1)',
      boxShadow: glow === 'win' ? '0 0 12px rgba(74,255,128,0.4)' : glow === 'lose' ? '0 0 8px rgba(255,87,87,0.3)' : 'none',
      transform: selected ? 'translateY(-6px) scale(1.05)' : 'none',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
    }}>
      {card?.photo
        ? <img src={card.photo} alt={card.name} style={{ width: '100%', height: small ? 44 : 54, objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
        : <div style={{ width: '100%', height: small ? 44 : 54, background: '#0d140d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#1a2a1a' }}>👤</div>
      }
      <div style={{ padding: '3px 4px 5px' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 7.5, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{card?.name}</div>
        <div style={{ display: 'flex', gap: 3, marginBottom: 1 }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 7, color: '#ff5757', fontWeight: 700 }}>ATK {card?.attack}</span>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 7, color: '#4aabff', fontWeight: 700 }}>DEF {card?.defense}</span>
        </div>
        <div style={{ marginTop: 2 }}>
          <span style={{ background: posColor, color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 6, padding: '1px 3px', borderRadius: 3 }}>{card?.position}</span>
        </div>
      </div>
    </div>
  );
}

// ── Score sidebar ─────────────────────────────────────────────────────────────
function ScoreSide({ playerGoals, cpuGoals }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '8px 6px',
      background: 'rgba(0,0,0,0.3)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)',
      minWidth: 44,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: '#ff5757', lineHeight: 1 }}>{cpuGoals}</div>
        <div style={{ fontSize: 12 }}>⚽</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 8, color: 'var(--muted)', fontWeight: 700 }}>CPU</div>
      </div>
      <div style={{ width: '80%', height: 1, background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: '#4aff80', lineHeight: 1 }}>{playerGoals}</div>
        <div style={{ fontSize: 12 }}>⚽</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 8, color: 'var(--muted)', fontWeight: 700 }}>YOU</div>
      </div>
    </div>
  );
}

// ── Main BattleArena ──────────────────────────────────────────────────────────
export default function BattleArena({ playerDeck: initialPlayerDeck = [], cpuDeck: initialCpuDeck = [], activePowerUps = [], onGameEnd }) {
  const [phase, setPhase] = useState('coinflip'); // coinflip | attack | defend | result | over
  const [flipping, setFlipping] = useState(true);
  const [coinResult, setCoinResult] = useState(null);

  const [playerDeck, setPlayerDeck] = useState(() =>
    (initialPlayerDeck || []).map(c => applyPowerUps(c, activePowerUps))
  );
  const [cpuDeck, setCpuDeck] = useState(() =>
    (initialCpuDeck || []).map(c => applyPowerUps(c, activePowerUps))
  );

  // Cards played on board (shown face-up)
  const [playerBoard, setPlayerBoard] = useState([]); // { card, role: 'atk'|'def', scored }
  const [cpuBoard, setCpuBoard] = useState([]);

  const [playerGoals, setPlayerGoals] = useState(0);
  const [cpuGoals, setCpuGoals] = useState(0);
  const [round, setRound] = useState(1);
  const [currentAttacker, setCurrentAttacker] = useState('player');
  const [selected, setSelected] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [resultMsg, setResultMsg] = useState(null);

  // Coin flip on mount
  useEffect(() => {
    const t = setTimeout(() => {
      const heads = Math.random() < 0.5;
      const firstAttacker = heads ? 'player' : 'cpu';
      setCoinResult({ heads, firstAttacker });
      setCurrentAttacker(firstAttacker);
      setFlipping(false);
      setTimeout(() => setPhase(firstAttacker === 'player' ? 'attack' : 'defend'), 2000);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  const cpuPickCard = (deck, role) => {
    if (!deck.length) return null;
    if (Math.random() < 0.25) return deck[Math.floor(Math.random() * deck.length)];
    return [...deck].sort((a, b) =>
      role === 'atk' ? b.attack - a.attack : b.defense - a.defense
    )[0];
  };

  const resolveRound = (playerCard, playerRole, cpuCard) => {
    const cpuRole = playerRole === 'attack' ? 'defend' : 'attack';
    const atk = playerRole === 'attack' ? playerCard.attack : cpuCard.attack;
    const def = playerRole === 'attack' ? cpuCard.defense : playerCard.defense;
    const attackerIsPlayer = playerRole === 'attack';
    const goal = atk > def;

    // Remove from decks
    setPlayerDeck(d => d.filter(c => c._id !== playerCard._id));
    setCpuDeck(d => d.filter(c => c._id !== cpuCard._id));

    // Add to boards (face-up now)
    setPlayerBoard(b => [...b, { card: playerCard, role: playerRole, scored: goal && attackerIsPlayer }]);
    setCpuBoard(b => [...b, { card: cpuCard, role: cpuRole, scored: goal && !attackerIsPlayer }]);

    if (goal) {
      if (attackerIsPlayer) setPlayerGoals(g => g + 1);
      else setCpuGoals(g => g + 1);
    }

    const msg = goal
      ? attackerIsPlayer
        ? { text: `⚽ GOAL! Your ATK ${atk} beat CPU DEF ${def}!`, color: '#4aff80' }
        : { text: `💀 CPU SCORED! ATK ${atk} vs your DEF ${def}`, color: '#ff5757' }
      : { text: `🛡️ SAVED! DEF ${def} stopped ATK ${atk}`, color: '#4aabff' };

    setResultMsg(msg);
    setLastResult({ atk, def, goal, attackerIsPlayer });
    setSelected(null);
    setRound(r => r + 1);
    setPhase('result');

    setTimeout(() => {
      setPlayerDeck(pd => {
        setCpuDeck(cd => {
          const pLeft = pd.filter(c => c._id !== playerCard._id).length;
          const cLeft = cd.filter(c => c._id !== cpuCard._id).length;
          if (pLeft === 0 || cLeft === 0) {
            setPhase('over');
          } else {
            const nextAttacker = attackerIsPlayer ? 'cpu' : 'player';
            setCurrentAttacker(nextAttacker);
            setPhase(nextAttacker === 'player' ? 'attack' : 'defend');
          }
          return cd;
        });
        return pd;
      });
    }, 2200);
  };

  const handlePlayerPlay = () => {
    if (!selected) return;
    const isAttacking = phase === 'attack';
    const cpuRole = isAttacking ? 'defend' : 'attack';
    const cpuCard = cpuPickCard(cpuDeck, cpuRole === 'attack' ? 'atk' : 'def');
    if (!cpuCard) return;
    resolveRound(selected, isAttacking ? 'attack' : 'defend', cpuCard);
  };

  // ── COIN FLIP SCREEN ─────────────────────────────────────────────────────
  if (phase === 'coinflip') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, gap: 24, padding: 24 }}>
        <div style={{
          width: 110, height: 110, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 58, border: '3px solid #ffd700', background: '#1a1200',
          animation: flipping ? 'coinFlip 1.5s ease-in-out' : 'none',
          boxShadow: '0 0 30px rgba(255,215,0,0.2)',
        }}>
          {flipping ? '🪙' : coinResult?.heads ? '🟡' : '⚪'}
        </div>
        {!flipping && coinResult && (
          <>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: '#fff' }}>
              {coinResult.heads ? 'HEADS!' : 'TAILS!'}
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18,
              color: coinResult.firstAttacker === 'player' ? '#ff5757' : '#4aabff',
              textAlign: 'center', lineHeight: 1.4,
            }}>
              {coinResult.firstAttacker === 'player'
                ? '🔴 YOU ATTACK FIRST!'
                : '🔵 CPU ATTACKS FIRST!'}
            </div>
          </>
        )}
        {flipping && (
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--muted)', letterSpacing: '0.1em' }}>
            FLIPPING...
          </div>
        )}
        <style>{`
          @keyframes coinFlip {
            0%   { transform: rotateY(0deg) scale(1); }
            25%  { transform: rotateY(180deg) scale(1.15); }
            50%  { transform: rotateY(360deg) scale(1); }
            75%  { transform: rotateY(540deg) scale(1.15); }
            100% { transform: rotateY(720deg) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ── GAME OVER SCREEN ─────────────────────────────────────────────────────
  if (phase === 'over') {
    const won = playerGoals > cpuGoals;
    const drew = playerGoals === cpuGoals;
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>{won ? '🏆' : drew ? '🤝' : '💀'}</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 52, color: won ? '#b8ff3c' : drew ? '#4aabff' : '#ff5757', marginBottom: 24 }}>
          {won ? 'YOU WIN!' : drew ? 'DRAW!' : 'CPU WINS!'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, background: 'var(--surface)', border: '1px solid var(--border-dim)', borderRadius: 16, padding: '20px 40px', maxWidth: 280, margin: '0 auto 28px' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 40, color: '#4aff80' }}>{playerGoals}</div>
            <div style={{ fontSize: 18 }}>{Array.from({ length: Math.min(playerGoals, 6) }).map((_, i) => <span key={i}>⚽</span>)}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: 'var(--muted)' }}>YOU</div>
          </div>
          <div style={{ alignSelf: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 24, color: 'var(--muted)' }}>vs</div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 40, color: '#ff5757' }}>{cpuGoals}</div>
            <div style={{ fontSize: 18 }}>{Array.from({ length: Math.min(cpuGoals, 6) }).map((_, i) => <span key={i}>⚽</span>)}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: 'var(--muted)' }}>CPU</div>
          </div>
        </div>
        <button onClick={() => onGameEnd?.({ playerGoals, cpuGoals, won, drew })} className="btn-lime" style={{ width: '100%', padding: '16px 0', fontSize: 20, borderRadius: 14 }}>
          Play Again
        </button>
      </div>
    );
  }

  // ── MAIN GAME BOARD ──────────────────────────────────────────────────────
  const isPlayerTurn = currentAttacker === 'player';
  const canPlay = (phase === 'attack' || phase === 'defend') && selected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, userSelect: 'none' }}>

      {/* Phase banner */}
      {phase !== 'result' && (
        <div style={{
          margin: '0 12px 10px', padding: '9px 14px', borderRadius: 10,
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: '0.06em',
          background: phase === 'attack' ? 'rgba(255,87,87,0.1)' : 'rgba(74,171,255,0.1)',
          border: `1px solid ${phase === 'attack' ? 'rgba(255,87,87,0.25)' : 'rgba(74,171,255,0.25)'}`,
          color: phase === 'attack' ? '#ff8080' : '#7dc8ff',
        }}>
          {phase === 'attack' ? '⚔️ YOUR TURN — pick your attacker' : '🛡️ CPU IS ATTACKING — pick your defender'}
        </div>
      )}

      {resultMsg && phase === 'result' && (
        <div style={{
          margin: '0 12px 10px', padding: '9px 14px', borderRadius: 10,
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13,
          background: 'rgba(0,0,0,0.4)', border: `1px solid ${resultMsg.color}44`,
          color: resultMsg.color, textAlign: 'center',
        }}>
          {resultMsg.text}
        </div>
      )}

      {/* Main pitch + score */}
      <div style={{ display: 'flex', gap: 8, padding: '0 12px', marginBottom: 10 }}>

        {/* Pitch */}
        <div style={{ flex: 1, background: 'linear-gradient(180deg,#071407,#0a1c0a,#071407)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>

          {/* CPU half — cards face down until played, then face up */}
          <div style={{ padding: '8px 8px 6px', minHeight: 100 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, color: 'rgba(74,171,255,0.4)', letterSpacing: '0.1em', marginBottom: 5 }}>
              CPU TEAM — {cpuDeck.length} remaining
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {/* Face-down remaining CPU cards */}
              {cpuDeck.map(c => <CardFaceDown key={c._id} small />)}
              {/* Face-up played CPU cards */}
              {cpuBoard.map((entry, i) => (
                <CardFaceUp
                  key={i}
                  card={entry.card}
                  small
                  glow={entry.scored ? 'win' : undefined}
                />
              ))}
            </div>
            {cpuDeck.length === 0 && cpuBoard.length === 0 && (
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.1)', textAlign: 'center', padding: '8px 0' }}>No cards</div>
            )}
          </div>

          {/* Centre line */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ background: '#0a1c0a', padding: '1px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>PITCH • RND {round}</span>
          </div>

          {/* Player half — face-up played cards */}
          <div style={{ padding: '6px 8px 8px', minHeight: 100 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, color: 'rgba(184,255,60,0.35)', letterSpacing: '0.1em', marginBottom: 5 }}>
              YOUR PLAYED
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {playerBoard.map((entry, i) => (
                <CardFaceUp
                  key={i}
                  card={entry.card}
                  small
                  glow={entry.scored ? 'win' : undefined}
                />
              ))}
              {playerBoard.length === 0 && (
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.1)', padding: '8px 0' }}>Your cards appear here when played</div>
              )}
            </div>
          </div>
        </div>

        {/* Score sidebar */}
        <ScoreSide playerGoals={playerGoals} cpuGoals={cpuGoals} />
      </div>

      {/* Player hand */}
      <div style={{ padding: '0 12px' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: '#4a6050', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          {phase === 'attack' ? 'YOUR SQUAD — tap to pick attacker:' : phase === 'defend' ? 'YOUR SQUAD — tap to pick defender:' : 'Waiting...'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 12 }}>
          {playerDeck.map(card => (
            <CardFaceUp
              key={card._id}
              card={card}
              selected={selected?._id === card._id}
              onClick={() => (phase === 'attack' || phase === 'defend') ? setSelected(s => s?._id === card._id ? null : card) : null}
            />
          ))}
          {playerDeck.length === 0 && (
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#4a6050', padding: '16px 0', width: '100%', textAlign: 'center' }}>No cards remaining</div>
          )}
        </div>

        {(phase === 'attack' || phase === 'defend') && (
          <button
            onClick={handlePlayerPlay}
            disabled={!selected}
            style={{
              width: '100%', padding: '14px 0', fontSize: 19, borderRadius: 12,
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800,
              cursor: selected ? 'pointer' : 'not-allowed',
              background: selected ? '#b8ff3c' : '#1a2a1a',
              border: 'none', color: selected ? '#050c05' : '#4a6050',
              transition: 'all 0.15s',
            }}
          >
            {phase === 'attack' ? '⚔️ ATTACK!' : '🛡️ DEFEND!'}
          </button>
        )}
      </div>
    </div>
  );
}
