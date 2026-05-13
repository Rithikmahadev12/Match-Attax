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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--gold)' }}>COLLECTION</h1>
          <p className="text-gray-600 text-sm mt-1">{collection.length} / 50 cards</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search player or club..."
            className="px-4 py-2 rounded-xl text-sm text-white outline-none w-52"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          />
          {['mine', 'all'].map(t => (
            <button key={t} onClick={() => { setTab(t); setSearch(''); }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition"
              style={tab === t
                ? { background: 'var(--gold)', color: '#000' }
                : { background: 'var(--surface2)', color: '#6b7280', border: '1px solid var(--border)' }}>
              {t === 'mine' ? 'My Cards' : 'All Cards'}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-gray-600 text-sm">Loading...</p>}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-gray-700 text-sm">
            {tab === 'mine' ? 'No cards yet. Press 🔑 to unlock all cards, or scan some!' : 'No results.'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-5">
        {filtered.map(card => (
          <div key={card.id} className="flex flex-col items-center gap-2">
            <CardDisplay card={card} />
            {tab === 'all' ? (
              owned.has(card.id)
                ? <button onClick={() => removeCard(card.id)} className="text-xs text-red-500 hover:text-red-400 transition">Remove</button>
                : <button onClick={() => addCard(card)}
                    className="px-4 py-1 rounded-lg text-xs font-bold text-black transition hover:scale-105"
                    style={{ background: 'var(--gold)' }}>+ Add</button>
            ) : (
              <button onClick={() => removeCard(card.id)} className="text-xs text-red-500 hover:text-red-400 transition">Remove</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
