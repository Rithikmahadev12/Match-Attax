import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/gameStore';

const links = [
  { to: '/', label: '🏠 Home' },
  { to: '/scanner', label: '📷 Scan' },
  { to: '/collection', label: '📦 Collection' },
  { to: '/game', label: '⚔️ Play' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { collection } = useStore();

  return (
    <nav className="bg-[#0d1117] border-b border-[#30363d] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-display text-xl text-yellow-400 tracking-wider">
          MATCH ATTAX
        </Link>
        <div className="flex gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === to
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
              {to === '/collection' && collection.length > 0 && (
                <span className="ml-1 bg-yellow-500 text-black text-xs rounded-full px-1.5 py-0.5">
                  {collection.length}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
