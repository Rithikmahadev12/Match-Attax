import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/gameStore';

const links = [
  { to: '/', label: 'Home' },
  { to: '/scanner', label: 'Scan' },
  { to: '/collection', label: 'Collection' },
  { to: '/game', label: 'Play' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { collection, addCard } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  const handleUnlock = async () => {
    if (pw !== 'password') { setMsg('Wrong password'); return; }
    try {
      const res = await fetch('/api/cards');
      const cards = await res.json();
      cards.forEach(c => addCard(c));
      setMsg(`✓ Unlocked ${cards.length} cards!`);
      setTimeout(() => { setShowModal(false); setMsg(''); setPw(''); }, 1500);
    } catch {
      setMsg('Failed to load cards');
    }
  };

  return (
    <>
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl tracking-wider" style={{ color: 'var(--gold)' }}>
            MATCH ATTAX
          </Link>

          <div className="flex items-center gap-1">
            {links.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === to
                    ? 'text-yellow-400 bg-yellow-400/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                {label}
                {to === '/collection' && collection.length > 0 && (
                  <span className="ml-1.5 bg-yellow-500 text-black text-xs rounded-full px-1.5 py-0.5 font-bold">
                    {collection.length}
                  </span>
                )}
              </Link>
            ))}
            <button onClick={() => setShowModal(true)}
              className="ml-2 px-3 py-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all text-sm"
              title="Dev unlock">
              🔑
            </button>
          </div>
        </div>
      </nav>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            className="rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
            <h2 className="font-display text-2xl text-yellow-400 mb-1">Dev Unlock</h2>
            <p className="text-gray-500 text-sm mb-6">Enter the password to add all cards to your collection.</p>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none mb-4"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            />
            {msg && <p className={`text-sm mb-4 ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
            <div className="flex gap-3">
              <button onClick={handleUnlock}
                className="flex-1 py-2.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition text-sm">
                Unlock
              </button>
              <button onClick={() => { setShowModal(false); setPw(''); setMsg(''); }}
                className="flex-1 py-2.5 rounded-xl text-gray-400 hover:text-white transition text-sm"
                style={{ background: 'var(--surface2)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
