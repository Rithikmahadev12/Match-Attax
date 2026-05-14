import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/gameStore';

const tabs = [
  { to: '/',           icon: '⚽', label: 'Home' },
  { to: '/scanner',    icon: '📷', label: 'Scan' },
  { to: '/collection', icon: '🃏', label: 'Cards' },
  { to: '/game',       icon: '⚔️', label: 'Play' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { library } = useStore();                             // ← was `collection`
  const count = Array.isArray(library) ? library.length : 0; // ← safe guard

  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, icon, label }) => {
        const active = pathname === to;
        const showBadge = to === '/collection' && count > 0;
        return (
          <Link key={to} to={to} className={`nav-item ${active ? 'active' : ''}`}>
            <div className="nav-icon relative">
              {icon}
              {showBadge && (
                <span className="badge absolute -top-1 -right-2">{count}</span>
              )}
            </div>
            <span className="nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
