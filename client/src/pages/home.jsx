import { Link } from 'react-router-dom';
import { useStore } from '../store/gameStore';

export default function Home() {
  const { collection } = useStore();
  const canPlay = collection.length >= 5;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-10 text-center">
      <div>
        <div className="text-6xl mb-4">⚽</div>
        <h1 className="font-display text-5xl text-yellow-400 tracking-widest mb-3">MATCH ATTAX</h1>
        <p className="text-gray-400 text-lg">Scan cards. Build your deck. Beat the CPU.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {[
          { to: '/scanner', icon: '📷', label: 'Scan Cards', desc: 'Point camera at your Match Attax cards', active: true },
          { to: '/collection', icon: '📦', label: 'Collection', desc: collection.length > 0 ? `${collection.length} card${collection.length !== 1 ? 's' : ''} collected` : 'No cards yet', active: true },
          { to: '/game', icon: '⚔️', label: 'Play vs CPU', desc: canPlay ? 'Ready to battle!' : `Need ${5 - collection.length} more card${5 - collection.length !== 1 ? 's' : ''}`, active: canPlay },
        ].map(({ to, icon, label, desc, active }) => (
          <Link
            key={to}
            to={to}
            className={`rounded-2xl p-6 border transition-all group ${
              active
                ? 'bg-gray-900 border-gray-700 hover:border-yellow-500 hover:bg-gray-800'
                : 'bg-gray-900/50 border-gray-800 opacity-50 pointer-events-none'
            }`}
          >
            <div className="text-4xl mb-3">{icon}</div>
            <h2 className="font-bold text-white text-lg mb-1 group-hover:text-yellow-400 transition">{label}</h2>
            <p className="text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>

      {collection.length < 5 && (
        <p className="text-gray-600 text-sm">
          You can also browse cards in{' '}
          <Link to="/collection" className="text-yellow-400 underline">Collection</Link> and add them manually.
        </p>
      )}
    </div>
  );
}
