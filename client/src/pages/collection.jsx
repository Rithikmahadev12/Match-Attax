import { useEffect, useState } from 'react';
import CardDisplay from '../components/carddisplay';
import { useStore } from '../store/gameStore';

export default function Collection() {
  const { collection, addCard, removeCard } = useStore();
  const [allCards, setAllCards] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('mine');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'all' && allCards.length === 0) {
      setLoading(true);
      fetch('/api/cards').then(r => r.json()).then(data => { setAllCards(data); setLoading(false); });
    }
  }, [tab]);

  const owned = new Set(collection.map(c => c.id));
  const filtered = (tab === 'mine' ? collection : allCards).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.club.toLowerCase().includes(search.toLowerCase())
  );

  const progress = Math.round((collection.length / 50) * 100);

  return (
    <div className="page-content" style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 40,
              color: '#fff',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}>
              MY <span style={{ color: 'var(--lime)' }}>CARDS</span>
            </div>
          </div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: 32,
            color: 'var(--lime)',
            lineHeight: 1,
          }}>
            {collection.length}<span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 700 }}>/50</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--lime-dim), var(--lime))',
            borderRadius: 4,
            transition: 'width 0.6s ease',
            boxShadow: '0 0 8px var(--lime-glow)',
          }} />
        </div>

        {/* Search + tabs */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            flex: 1,
            background: 'var(--surface2)',
            border: '1px solid var(--border-dim)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
          }}>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search player or club..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 13,
                padding: '10px 0',
                fontFamily: "'Barlow', sans-serif",
              }}
            />
          </div>

          <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border-dim)', borderRadius: 12, overflow: 'hidden' }}>
            {['mine', 'all'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(''); }}
                style={{
                  padding: '10px 14px',
                  background: tab === t ? 'var(--lime)' : 'none',
                  color: tab === t ? '#0a0e0a' : 'var(--muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease',
                }}
              >
                {t === 'mine' ? 'Mine' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: '0.08em' }}>
          LOADING...
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, color: 'rgba(255,255,255,0.3)' }}>
            {tab === 'mine' ? 'No cards yet' : 'No results'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
            {tab === 'mine' ? 'Scan some cards or use Dev Unlock on the home screen' : ''}
          </div>
        </div>
      )}

      {/* Card grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
        {filtered.map((card, i) => (
          <div key={card.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: `fadeUp 0.3s ${i * 0.03}s ease both` }}>
            <CardDisplay card={card} />
            {tab === 'all' ? (
              owned.has(card.id) ? (
                <button onClick={() => removeCard(card.id)} style={{
                  background: 'none', border: '1px solid rgba(255,60,60,0.3)',
                  color: '#ff6060', cursor: 'pointer', borderRadius: 8,
                  padding: '4px 12px', fontSize: 11,
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.06em',
                  transition: 'all 0.15s ease',
                }}>REMOVE</button>
              ) : (
                <button onClick={() => addCard(card)} className="btn-lime" style={{ padding: '5px 16px', fontSize: 12 }}>+ ADD</button>
              )
            ) : (
              <button onClick={() => removeCard(card.id)} style={{
                background: 'none', border: '1px solid rgba(255,60,60,0.3)',
                color: '#ff6060', cursor: 'pointer', borderRadius: 8,
                padding: '4px 12px', fontSize: 11,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.06em',
              }}>REMOVE</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
