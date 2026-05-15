import { useState, useEffect } from 'react';
import { POSITION_LABELS, POS_COLOR } from '../store/gameStore';

// ─── Formation grid positions ────────────────────────────────────────────────
// Each slot: { slot, pos, pRow, pCol, cRow, cCol }
// Grid: 5 cols × 4 rows (CSS grid, 1-indexed)
// Player half: GK at bottom (row 4), attackers at top (row 1)
// CPU half:    GK at top (row 1), attackers at bottom (row 4)
const FORMATION = [
  { slot: 0,  pos: 'GK', pRow: 4, pCol: 3, cRow: 1, cCol: 3 },
  { slot: 1,  pos: 'LB', pRow: 3, pCol: 1, cRow: 2, cCol: 1 },
  { slot: 2,  pos: 'CB', pRow: 3, pCol: 2, cRow: 2, cCol: 2 },
  { slot: 3,  pos: 'CB', pRow: 3, pCol: 4, cRow: 2, cCol: 4 },
  { slot: 4,  pos: 'RB', pRow: 3, pCol: 5, cRow: 2, cCol: 5 },
  { slot: 5,  pos: 'LM', pRow: 2, pCol: 1, cRow: 3, cCol: 1 },
  { slot: 6,  pos: 'CM', pRow: 2, pCol: 3, cRow: 3, cCol: 3 },
  { slot: 7,  pos: 'RM', pRow: 2, pCol: 5, cRow: 3, cCol: 5 },
  { slot: 8,  pos: 'LW', pRow: 1, pCol: 2, cRow: 4, cCol: 2 },
  { slot: 9,  pos: 'ST', pRow: 1, pCol: 3, cRow: 4, cCol: 3 },
  { slot: 10, pos: 'RW', pRow: 1, pCol: 4, cRow: 4, cCol: 4 },
];

// ─── Tiny formation card ─────────────────────────────────────────────────────
function FormCard({ card, faceDown, active, glow }) {
  const W = 46, H = 64;
  const border = active
    ? '2px solid #b8ff3c'
    : glow === 'win'  ? '2px solid #4aff80'
    : glow === 'lose' ? '1.5px solid #ff5757'
    : '1px solid rgba(255,255,255,0.1)';
  const shadow = glow === 'win'  ? '0 0 10px rgba(74,255,128,0.5)'
               : glow === 'lose' ? '0 0 6px rgba(255,87,87,0.3)'
               : active ? '0 0 8px rgba(184,255,60,0.4)' : 'none';

  if (faceDown || !card) {
    return (
      <div style={{
        width: W, height: H, borderRadius: 6, border,
        background: card
          ? 'repeating-linear-gradient(45deg,#0d1e0d 0,#0d1e0d 4px,#091509 4px,#091509 8px)'
          : 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: card ? 18 : 12, opacity: card ? 0.75 : 0.25, transition: 'all 0.3s',
      }}>
        {card ? '🂠' : '–'}
      </div>
    );
  }

  const posColor = POS_COLOR[card.position] || '#555';
  return (
    <div style={{
      width: W, height: H, borderRadius: 6, overflow: 'hidden', border, boxShadow: shadow,
      background: 'var(--surface2)', transition: 'all 0.35s ease',
    }}>
      {card.photo
        ? <img src={card.photo} alt={card.name} style={{ width: '100%', height: 36, objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
        : <div style={{ width: '100%', height: 36, background: '#0d140d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
      }
      <div style={{ padding: '2px 3px 3px' }}>
        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 7, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {card.name?.split(' ').slice(-1)[0] || card.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
          <span style={{ fontSize: 6, color: '#ff5c5c', fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>⚔{card.attack}</span>
          <span style={{ fontSize: 6, color: '#4aabff', fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>🛡{card.defense}</span>
        </div>
        <div style={{ marginTop: 2 }}>
          <span style={{ background: posColor, color: '#fff', fontSize: 5.5, fontFamily: "'Barlow Condensed'", fontWeight: 800, padding: '0 3px', borderRadius: 2 }}>
            {card.position}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── One half of the pitch ───────────────────────────────────────────────────
function PitchHalf({ cards, isCpu, revealedSlots, activeSlot, results }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gridTemplateRows: 'repeat(4, 1fr)',
      gap: 3,
      padding: '6px 4px',
      flex: 1,
      minHeight: 200,
    }}>
      {FORMATION.map(({ slot, pos, pRow, pCol, cRow, cCol }) => {
        const row = isCpu ? cRow : pRow;
        const col = isCpu ? cCol : pCol;
        const card = cards[slot] || null;
        const revealed = revealedSlots.includes(slot);
        const active = slot === activeSlot;
        const result = results[slot];
        const glow = result
          ? (isCpu
            ? (result.cpuScored ? 'win' : 'lose')
            : (result.playerScored ? 'win' : 'lose'))
          : undefined;

        return (
          <div key={slot} style={{ gridRow: row, gridColumn: col, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 5.5, color: 'rgba(255,255,255,0.22)', lineHeight: 1 }}>
              {pos}
            </span>
            <FormCard card={card} faceDown={!revealed} active={active} glow={glow} />
            {result && (
              <span style={{ fontSize: 8, lineHeight: 1, marginTop: 1 }}>
                {isCpu ? (result.cpuScored ? '⚽' : result.playerScored ? '🛡️' : '') : (result.playerScored ? '⚽' : result.cpuScored ? '🛡️' : '')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Score sidebar ────────────────────────────────────────────────────────────
function ScoreSide({ playerGoals, cpuGoals, round }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '8px 5px',
      background: 'rgba(0,0,0,0.35)', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.05)',
      minWidth: 42,
    }}>
      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>RND</div>
      <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 20, color: 'var(--lime)', lineHeight: 1 }}>{round}</div>
      <div style={{ width: '70%', height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 26, color: '#ff5757', lineHeight: 1 }}>{cpuGoals}</div>
        <div style={{ fontSize: 10 }}>⚽</div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 6.5, color: 'var(--muted)', fontWeight: 700 }}>CPU</div>
      </div>
      <div style={{ width: '70%', height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 26, color: '#4aff80', lineHeight: 1 }}>{playerGoals}</div>
        <div style={{ fontSize: 10 }}>⚽</div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 6.5, color: 'var(--muted)', fontWeight: 700 }}>YOU</div>
      </div>
    </div>
  );
}

// ─── Main BattleArena ─────────────────────────────────────────────────────────
export default function BattleArena({ playerCards = [], cpuCards = [], onGameEnd }) {
  // Pad both sides to 11 slots
  const pCards = [...Array(11)].map((_, i) => playerCards[i] || null);
  const cCards = [...Array(11)].map((_, i) => cpuCards[i] || null);

  const [phase, setPhase]             = useState('coinflip'); // coinflip|ready|revealing|result|over
  const [flipping, setFlipping]       = useState(true);
  const [coinResult, setCoinResult]   = useState(null);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [revealedSlots, setRevealed]  = useState([]);
  const [results, setResults]         = useState({});
  const [playerGoals, setPlayerGoals] = useState(0);
  const [cpuGoals, setCpuGoals]       = useState(0);
  const [resultMsg, setResultMsg]     = useState(null);

  // Coin flip on mount
  useEffect(() => {
    const t = setTimeout(() => {
      const heads = Math.random() < 0.5;
      setCoinResult(heads);
      setFlipping(false);
      setTimeout(() => setPhase('ready'), 1800);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  const playNextRound = () => {
    if (phase !== 'ready') return;
    const slot = currentSlot;
    const pCard = pCards[slot];
    const cCard = cCards[slot];

    setRevealed(prev => [...prev, slot]);
    setPhase('revealing');

    setTimeout(() => {
      let playerScored = false;
      let cpuScored    = false;
      let msgParts     = [];
      const pos        = POSITION_LABELS[slot];

      if (!pCard && !cCard) {
        msgParts.push(`${pos}: Both empty — skipped`);
      } else if (!pCard) {
        cpuScored = true;
        msgParts.push(`${pos}: 💀 CPU scores — no player in your ${pos} slot!`);
      } else if (!cCard) {
        playerScored = true;
        msgParts.push(`${pos}: ⚽ You score — no CPU ${pos}!`);
      } else {
        playerScored = pCard.attack  > cCard.defense;
        cpuScored    = cCard.attack  > pCard.defense;

        if (playerScored && cpuScored) {
          msgParts.push(`${pos}: ⚔️ BOTH SCORE! Your ATK ${pCard.attack} > CPU DEF ${cCard.defense} | CPU ATK ${cCard.attack} > Your DEF ${pCard.defense}`);
        } else if (playerScored) {
          msgParts.push(`${pos}: ⚽ YOUR GOAL! ATK ${pCard.attack} beats DEF ${cCard.defense}`);
        } else if (cpuScored) {
          msgParts.push(`${pos}: 💀 CPU GOAL! ATK ${cCard.attack} beats DEF ${pCard.defense}`);
        } else {
          msgParts.push(`${pos}: 🛡️ Clean sheet — ATK ${pCard.attack} vs DEF ${cCard.defense}`);
        }
      }

      const newPG = playerGoals + (playerScored ? 1 : 0);
      const newCG = cpuGoals    + (cpuScored    ? 1 : 0);
      setPlayerGoals(newPG);
      setCpuGoals(newCG);
      setResults(prev => ({ ...prev, [slot]: { playerScored, cpuScored, pCard, cCard } }));
      setResultMsg({ text: msgParts[0], playerScored, cpuScored });
      setPhase('result');

      setTimeout(() => {
        if (slot >= 10) {
          setPhase('over');
        } else {
          setCurrentSlot(slot + 1);
          setPhase('ready');
        }
      }, 2400);
    }, 700);
  };

  // ── COIN FLIP ──────────────────────────────────────────────────────────────
  if (phase === 'coinflip') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:320, gap:20, padding:24 }}>
        <div style={{ fontSize:64, animation: flipping ? 'coinFlip 1.2s ease-in-out infinite' : 'none' }}>
          {flipping ? '🪙' : coinResult ? '🟡' : '⚪'}
        </div>
        {!flipping && (
          <>
            <div style={{ fontFamily:"'Barlow Condensed'", fontWeight:900, fontSize:36, color:'#fff' }}>
              {coinResult ? 'HEADS!' : 'TAILS!'}
            </div>
            <div style={{ fontFamily:"'Barlow Condensed'", fontWeight:700, fontSize:18, color:'var(--lime)' }}>
              KICK OFF! ⚽
            </div>
          </>
        )}
        {flipping && <div style={{ fontFamily:"'Barlow Condensed'", fontWeight:700, fontSize:14, color:'var(--muted)', letterSpacing:'0.1em' }}>TOSSING...</div>}
        <style>{`@keyframes coinFlip{0%{transform:rotateY(0) scale(1)}50%{transform:rotateY(180deg) scale(1.15)}100%{transform:rotateY(360deg) scale(1)}}`}</style>
      </div>
    );
  }

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  if (phase === 'over') {
    const won  = playerGoals > cpuGoals;
    const drew = playerGoals === cpuGoals;
    return (
      <div style={{ textAlign:'center', padding:'32px 20px' }}>
        <div style={{ fontSize:68, marginBottom:10 }}>{won?'🏆':drew?'🤝':'💀'}</div>
        <div style={{ fontFamily:"'Barlow Condensed'", fontWeight:900, fontSize:48, marginBottom:20,
          color: won ? '#b8ff3c' : drew ? '#4aabff' : '#ff5757' }}>
          {won ? 'YOU WIN!' : drew ? 'DRAW!' : 'CPU WINS!'}
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:40, background:'var(--surface)', border:'1px solid var(--border-dim)', borderRadius:18, padding:'20px 48px', maxWidth:280, margin:'0 auto 28px' }}>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed'", fontWeight:900, fontSize:44, color:'#4aff80', lineHeight:1 }}>{playerGoals}</div>
            <div style={{ fontSize:20 }}>{Array.from({length: Math.min(playerGoals, 5)}).map((_,i)=><span key={i}>⚽</span>)}</div>
            <div style={{ fontFamily:"'Barlow Condensed'", fontSize:10, color:'var(--muted)', fontWeight:700 }}>YOU</div>
          </div>
          <div style={{ alignSelf:'center', fontFamily:"'Barlow Condensed'", fontWeight:900, fontSize:28, color:'var(--muted)' }}>–</div>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed'", fontWeight:900, fontSize:44, color:'#ff5757', lineHeight:1 }}>{cpuGoals}</div>
            <div style={{ fontSize:20 }}>{Array.from({length: Math.min(cpuGoals, 5)}).map((_,i)=><span key={i}>⚽</span>)}</div>
            <div style={{ fontFamily:"'Barlow Condensed'", fontSize:10, color:'var(--muted)', fontWeight:700 }}>CPU</div>
          </div>
        </div>
        <button onClick={() => onGameEnd?.({ playerGoals, cpuGoals, won, drew })} className="btn-lime" style={{ width:'100%', padding:'16px 0', fontSize:20, borderRadius:14 }}>
          Play Again
        </button>
      </div>
    );
  }

  // ── PITCH ──────────────────────────────────────────────────────────────────
  const posLabel = POSITION_LABELS[currentSlot];
  const revealedCount = revealedSlots.length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, userSelect:'none' }}>

      {/* Result / phase banner */}
      <div style={{
        margin:'6px 10px',
        padding:'8px 12px',
        borderRadius:9,
        minHeight:36,
        background:'rgba(0,0,0,0.4)',
        border:`1px solid ${
          resultMsg?.playerScored && resultMsg?.cpuScored ? 'rgba(255,215,0,0.3)'
          : resultMsg?.playerScored ? 'rgba(74,255,128,0.25)'
          : resultMsg?.cpuScored   ? 'rgba(255,87,87,0.25)'
          : 'rgba(255,255,255,0.06)'}`,
        fontFamily:"'Barlow Condensed'",
        fontWeight:700,
        fontSize:12,
        color: resultMsg?.playerScored && resultMsg?.cpuScored ? '#ffd700'
             : resultMsg?.playerScored ? '#4aff80'
             : resultMsg?.cpuScored   ? '#ff8080'
             : '#aaa',
        textAlign:'center', lineHeight:1.4,
        transition:'all 0.3s',
      }}>
        {phase === 'ready' && !resultMsg && `Round ${currentSlot + 1}/11 — Play your ${posLabel}`}
        {phase === 'ready' && resultMsg && resultMsg.text}
        {(phase === 'revealing') && `⏳ Revealing ${posLabel}...`}
        {phase === 'result' && resultMsg && resultMsg.text}
      </div>

      {/* Main pitch + score sidebar */}
      <div style={{ display:'flex', gap:6, padding:'0 8px' }}>

        {/* Pitch */}
        <div style={{
          flex:1, borderRadius:14, overflow:'hidden',
          border:'1px solid rgba(255,255,255,0.04)',
          background:'linear-gradient(180deg,#071507 0%,#091e09 50%,#071507 100%)',
        }}>
          {/* CPU label */}
          <div style={{ padding:'3px 8px', background:'rgba(74,171,255,0.04)', borderBottom:'none' }}>
            <span style={{ fontFamily:"'Barlow Condensed'", fontWeight:700, fontSize:8, color:'rgba(74,171,255,0.35)', letterSpacing:'0.1em' }}>
              CPU — {cCards.filter(Boolean).length} PLAYERS
            </span>
          </div>

          {/* CPU formation */}
          <PitchHalf
            cards={cCards}
            isCpu={true}
            revealedSlots={revealedSlots}
            activeSlot={phase !== 'ready' ? currentSlot : -1}
            results={results}
          />

          {/* Centre line */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:18, borderTop:'1px dashed rgba(255,255,255,0.07)', borderBottom:'1px dashed rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.01)', position:'relative' }}>
            <span style={{ background:'#091e09', padding:'0 10px', fontFamily:"'Barlow Condensed'", fontWeight:700, fontSize:7.5, color:'rgba(255,255,255,0.15)', letterSpacing:'0.1em' }}>
              ⚽ HALFWAY LINE
            </span>
          </div>

          {/* Player formation */}
          <PitchHalf
            cards={pCards}
            isCpu={false}
            revealedSlots={revealedSlots}
            activeSlot={phase !== 'ready' ? currentSlot : -1}
            results={results}
          />

          {/* Player label */}
          <div style={{ padding:'3px 8px', background:'rgba(184,255,60,0.03)', borderTop:'none' }}>
            <span style={{ fontFamily:"'Barlow Condensed'", fontWeight:700, fontSize:8, color:'rgba(184,255,60,0.3)', letterSpacing:'0.1em' }}>
              YOU — {pCards.filter(Boolean).length} PLAYERS
            </span>
          </div>
        </div>

        {/* Score sidebar */}
        <ScoreSide
          playerGoals={playerGoals}
          cpuGoals={cpuGoals}
          round={revealedCount}
        />
      </div>

      {/* Play button */}
      <div style={{ padding:'10px 10px 0' }}>
        <button
          onClick={playNextRound}
          disabled={phase !== 'ready'}
          style={{
            width:'100%', padding:'15px 0', fontSize:18, borderRadius:13,
            fontFamily:"'Barlow Condensed'", fontWeight:800, letterSpacing:'0.03em',
            border:'none', cursor: phase === 'ready' ? 'pointer' : 'not-allowed',
            background: phase === 'ready' ? '#b8ff3c' : '#1a2a1a',
            color: phase === 'ready' ? '#050c05' : '#4a6050',
            transition:'all 0.15s',
            boxShadow: phase === 'ready' ? '0 4px 20px rgba(184,255,60,0.25)' : 'none',
          }}
        >
          {phase === 'ready'
            ? `⚽ Play Round ${currentSlot + 1} — ${posLabel}`
            : phase === 'revealing' ? '⏳ Revealing cards...'
            : phase === 'result'    ? '⌛ Next round coming...'
            : '🏁 Game over'}
        </button>
      </div>

    </div>
  );
}
