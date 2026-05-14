import { POS_COLOR } from '../store/gameStore';

const rarity = (atk, def) => {
  const avg = (atk + def) / 2;
  if (avg >= 85) return 'motm';
  if (avg >= 75) return 'gold';
  return 'standard';
};

export default function DigitalCard({ card, size = 'md', selected = false, faceDown = false, onClick, winLose }) {
  const sz = {
    sm: { w: 80,  h: 110, name: 10, stat: 11, pos: 8  },
    md: { w: 110, h: 152, name: 13, stat: 14, pos: 10 },
    lg: { w: 140, h: 194, name: 16, stat: 17, pos: 12 },
  }[size] || { w: 110, h: 152, name: 13, stat: 14, pos: 10 };

  const tier = rarity(card?.attack ?? 0, card?.defense ?? 0);
  const shellCls = `card-shell card-${tier}${selected ? ' selected' : ''}${winLose === 'win' ? ' glow-win' : winLose === 'lose' ? ' glow-lose' : ''}`;

  if (faceDown) {
    return (
      <div
        className="card-shell face-down"
        style={{ width: sz.w, height: sz.h, cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      />
    );
  }

  const posColor = POS_COLOR[card?.position] || '#888';
  const atkPct   = Math.round(((card?.attack  ?? 0) / 99) * 100);
  const defPct   = Math.round(((card?.defense ?? 0) / 99) * 100);

  return (
    <div
      className={shellCls}
      style={{ width: sz.w, height: sz.h, cursor: onClick ? 'pointer' : 'default', display: 'flex', flexDirection: 'column' }}
      onClick={onClick}
    >
      {/* Photo area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.4)' }}>
        {card?.photo ? (
          <img
            src={card.photo}
            alt={card.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: sz.w * 0.32, opacity: 0.35,
          }}>
            👤
          </div>
        )}
        {/* Position badge */}
        <div style={{
          position: 'absolute', top: 4, left: 4,
          background: posColor,
          color: '#fff',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: sz.pos,
          padding: '1px 5px',
          borderRadius: 4,
          letterSpacing: '0.05em',
        }}>
          {card?.position}
        </div>
        {/* Price badge */}
        {card?.price != null && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            background: 'rgba(0,0,0,0.7)',
            color: '#ffd700',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: sz.pos - 1,
            padding: '1px 5px',
            borderRadius: 4,
          }}>
            £{card.price}M
          </div>
        )}
      </div>

      {/* Info area */}
      <div style={{ padding: '5px 6px 6px', background: 'rgba(0,0,0,0.55)' }}>
        {/* Name */}
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: sz.name,
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 4,
          letterSpacing: '0.01em',
        }}>
          {card?.name || 'Unknown'}
        </div>

        {/* ATK */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800, fontSize: sz.pos,
            color: '#ff5c5c', width: 22, flexShrink: 0,
          }}>
            ATK
          </span>
          <div className="stat-track">
            <div className="stat-fill" style={{ width: `${atkPct}%`, background: 'linear-gradient(90deg,#ff5c5c,#ff8c8c)' }} />
          </div>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800, fontSize: sz.stat,
            color: '#ff5c5c', width: 20, textAlign: 'right', flexShrink: 0,
          }}>
            {card?.attack ?? 0}
          </span>
        </div>

        {/* DEF */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800, fontSize: sz.pos,
            color: '#4aabff', width: 22, flexShrink: 0,
          }}>
            DEF
          </span>
          <div className="stat-track">
            <div className="stat-fill" style={{ width: `${defPct}%`, background: 'linear-gradient(90deg,#4aabff,#80c8ff)' }} />
          </div>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800, fontSize: sz.stat,
            color: '#4aabff', width: 20, textAlign: 'right', flexShrink: 0,
          }}>
            {card?.defense ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
