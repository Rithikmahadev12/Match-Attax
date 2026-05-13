import { Link } from 'react-router-dom';
import { useStore } from '../store/gameStore';

export default function Home() {
  const { collection } = useStore();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-8 text-center">
      <div>
        <h1 className="font-display text-5xl text-yellow-400 tracking-widest mb-2">MATCH ATTAX</h1>
        <p className="text-gray-400">Scan your cards. Build your deck. Beat the CPU.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <Link
          to="/scanner"
          className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-yellow-500/50 transition group"
        >
          <div className="text-4xl mb-3">📷</div>
          <h2 className="font-bold text-white group-hover:text-yellow-400 transition">Scan Cards</h2>
          <p className="text-sm text-gray-500 mt-1">Point camera at your real Match Attax cards</p>
        </Link>

        <Link
          to="/collection"
          className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-yellow-500/50 transition group"
        >
          <div className="text-4xl mb-3">📦</div>
          <h2 className="font-bold text-white group-hover:text-yellow-400 transition">My Collection</h2>
          <p className="text-sm text-gray-500 mt-1">
            {collection.length > 0
              ? `${collection.length} card${collection.length !== 1 ? 's' : ''} collected`
              : 'No cards yet — start scanning!'}
          </p>
        </Link>

        <Link
          to="/game"
          className={`bg-[#161b22] border rounded-xl p-6 transition group ${
            collection.length >= 5
              ? 'border-[#30363d] hover:border-yellow-500/50'
              : 'border-[#30363d] opacity-50 pointer-events-none'
          }`}
        >
          <div className="text-4xl mb-3">⚔️</div>
          <h2 className="font-bold text-white group-hover:text-yellow-400 transition">Play vs CPU</h2>
          <p className="text-sm text-gray-500 mt-1">
            {collection.length >= 5
              ? 'Ready to battle!'
              : `Need ${5 - collection.length} more card${5 - collection.length !== 1 ? 's' : ''} to play`}
          </p>
        </Link>
      </div>

      {collection.length < 5 && (
        <div className="text-sm text-gray-500">
          Tip: You can also browse all available cards in your{' '}
          <Link to="/collection" className="text-yellow-400 underline">collection</Link> and add them manually.
        </div>
      )}
    </div>
  );
}
