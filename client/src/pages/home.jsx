import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/gameStore';
import { useState } from 'react';

export default function Home() {
  const { library, addToLibrary } = useStore();   // ← was `collection` / `addCard`; store exposes `library` / `addToLibrary`
  const collection = Array.isArray(library) ? library : [];
  const canPlay = collection.length >= 5;
  const [showUnlock, setShowUnlock] = useState(false);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  const handleUnlock = async () => {
    if (pw !== 'password') { setMsg('Wrong password'); return; }
    try {
      const res = await fetch('/api/cards');
      const cards = await res.json();
      cards.forEach(c => addToLibrary(c));
      setMsg(`✓ ${cards.length} cards unlocked!`);
      setTimeout(() => { setShowUnlock(false); setMsg(''); setPw(''); }, 1500);
    } catch {
      setMsg('Failed to load cards');
    }
  };

  return (
    <div className="page-content relative" style={{ minHeight: '100dvh' }}>



      <div style={{ position: 'relative', zIndex: 1, padding: '0 20px', maxWidth: 480, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ paddingTop: 60, paddingBottom: 32, textAlign: 'center' }}>
          <div style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 280,
            height: 280,
            background: 'radial-gradient(circle, rgba(184,255,60,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(52px, 14vw, 72px)',
            lineHeight: 0.9,
            color: '#fff',
            letterSpacing: '-0.02em',
            marginBottom: 4,
            textShadow: '0 4px 24px rgba(0,0,0,0.5)',
            animation: 'fadeUp 0.5s ease forwards',
          }}>
            MATCH
          </div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(52px, 14vw, 72px)',
            lineHeight: 0.9,
            color: 'var(--lime)',
            letterSpacing: '-0.02em',
            marginBottom: 20,
            textShadow: '0 0 40px var(--lime-glow-strong)',
            animation: 'fadeUp 0.5s 0.08s ease both',
          }}>
            ATTAX
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 14,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            animation: 'fadeUp 0.5s 0.16s ease both',
          }}>
            Scan · Collect · Dominate
          </p>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 32,
          animation: 'fadeUp 0.5s 0.24s ease both',
        }}>
          {[
            { val: collection.length, label: 'Cards', accent: 'var(--lime)' },
            { val: canPlay ? 'READY' : `${Math.max(0, 5 - collection.length)} MORE`, label: canPlay ? 'Battle' : 'Needed', accent: canPlay ? '#4aff80' : '#ff6060' },
            { val: 50, label: 'Total', accent: 'rgba(255,255,255,0.3)' },
          ].map(({ val, label, accent }, i) => (
            <div key={i} style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--border-dim)',
              borderRadius: 14,
              padding: '14px 10px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 26,
                color: accent,
                lineHeight: 1,
                marginBottom: 4,
              }}>{val}</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
              }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.5s 0.32s ease both' }}>

          {/* Scan */}
          <Link to="/scanner" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a2e1a, #0f1a0f)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: '22px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(184,255,60,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{
                position: 'absolute', right: -20, top: -20,
                width: 120, height: 120,
                background: 'radial-gradient(circle, rgba(184,255,60,0.06) 0%, transparent 70%)',
              }} />
              <div style={{
                width: 52, height: 52,
                background: 'var(--lime)',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, flexShrink: 0,
                boxShadow: '0 4px 16px var(--lime-glow-strong)',
              }}>📷</div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.01em' }}>Scan a Card</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Point at your Match Attax card</div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--lime)', fontSize: 20 }}>›</div>
            </div>
          </Link>

          {/* Row: Collection + Play */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Link to="/collection" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-dim)',
                borderRadius: 18,
                padding: '18px 16px',
                height: '100%',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>🃏</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff' }}>Collection</div>
                <div style={{ fontSize: 12, color: 'var(--lime)', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginTop: 4 }}>
                  {collection.length} / 50
                </div>
              </div>
            </Link>

            <Link to="/game" style={{ textDecoration: 'none', opacity: canPlay ? 1 : 0.4, pointerEvents: canPlay ? 'auto' : 'none' }}>
              <div style={{
                background: canPlay ? 'linear-gradient(135deg, #1a1000, #281800)' : 'var(--surface)',
                border: `1px solid ${canPlay ? 'rgba(255,215,0,0.3)' : 'var(--border-dim)'}`,
                borderRadius: 18,
                padding: '18px 16px',
                height: '100%',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚔️</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff' }}>Play</div>
                <div style={{ fontSize: 12, color: canPlay ? '#ffd700' : 'var(--muted)', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginTop: 4 }}>
                  {canPlay ? 'Ready!' : `Need ${5 - collection.length} more`}
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Dev unlock */}
        <div style={{ marginTop: 32, textAlign: 'center', animation: 'fadeUp 0.5s 0.4s ease both' }}>
          <button
            onClick={() => setShowUnlock(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.06em' }}
          >
            🔑 Dev Unlock
          </button>
        </div>
      </div>

      {/* Unlock modal */}
      {showUnlock && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={e => e.target === e.currentTarget && setShowUnlock(false)}
        >
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 28,
            width: '100%',
            maxWidth: 360,
          }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, color: 'var(--lime)', marginBottom: 6 }}>DEV UNLOCK</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>Add all 50 cards to your collection.</p>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              placeholder="Password"
              autoFocus
              style={{
                width: '100%',
                background: 'var(--surface3)',
                border: '1px solid var(--border-dim)',
                borderRadius: 12,
                padding: '12px 14px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                marginBottom: 12,
                fontFamily: "'Barlow', sans-serif",
              }}
            />
            {msg && <p style={{ fontSize: 13, color: msg.startsWith('✓') ? '#4aff80' : '#ff6060', marginBottom: 12 }}>{msg}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleUnlock} className="btn-lime" style={{ flex: 1, padding: '12px 0', fontSize: 16 }}>Unlock</button>
              <button onClick={() => { setShowUnlock(false); setPw(''); setMsg(''); }} className="btn-ghost" style={{ flex: 1, padding: '12px 0', fontSize: 16 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
