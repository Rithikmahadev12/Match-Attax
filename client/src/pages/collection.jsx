import { useEffect, useState } from 'react';
import CardDisplay from '../components/CardDisplay';
import { useStore } from '../store/gameStore';

export default function Collection() {
  const { collection, addCard, removeCard } = useStore();
  const [allCards, setAllCards] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('mine'); // 'mine' | 'all'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'all' && allCards.length === 0) {
      setLoading(true);
      fetch('/api/cards')
        .then(r => r.json())
        .then(data => { setAllCards(data); setLoading(false); });
    }
  }, [tab]);

  const owned = new Set(collection.map(c => c.id));

  const filtered = (tab === 'mine' ? collection : allCards).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.club.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl text-yellow-400">My Collection</h1>
          <p className="text-gray-500 text-sm">{collection.length} / 50 cards</p>
        </div>
        <div className="flex gap-2">
          <input
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
            placeholder="Search player or club..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            onClick={() => { setTab('mine'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === 'mine' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}
          >
            My Cards
          </button>
          <button
            onClick={() => { setTab('all'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === 'all' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}
          >
            All Cards
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading cards...</p>}

      {filtered.length === 0 && !loading && (
        <p className="text-gray-600 text-sm">
          {tab === 'mine'
            ? 'No cards yet. Scan some cards or browse All Cards to add them.'
            : 'No results.'}
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        {filtered.map(card => (
          <div key={card.id} className="flex flex-col items-center gap-2">
            <CardDisplay card={card} />
            {tab === 'all' ? (
              owned.has(card.id) ? (
                <button
                  onClick={() => removeCard(card.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => addCard(card)}
                  className="px-4 py-1 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition"
                >
                  + Add
                </button>
              )
            ) : (
              <button
                onClick={() => removeCard(card.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
