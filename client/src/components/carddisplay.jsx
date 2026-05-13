const SPECIAL_META = {
  '100Club': {
    label: '100 CLUB',
    gradient: 'linear-gradient(90deg,#7a5200,#ffd700,#ffc200,#7a5200)',
    textColor: '#3a2000',
    glowColor: 'rgba(255,215,0,0.4)',
  },
  MOTM: {
    label: 'MAN OF THE MATCH',
    gradient: 'linear-gradient(90deg,#003080,#00a8ff,#0090e0,#003080)',
    textColor: '#001840',
    glowColor: 'rgba(0,168,255,0.4)',
  },
  HatTrick: {
    label: 'HAT-TRICK HERO',
    gradient: 'linear-gradient(90deg,#5c0090,#c800ff,#a000e0,#5c0090)',
    textColor: '#2a003a',
    glowColor: 'rgba(200,0,255,0.4)',
  },
};

const POS_COLORS = {
  GK: '#e67e00',
  CB: '#1a6ef5', RB: '#1a6ef5', LB: '#1a6ef5',
  CDM: '#15a050', CM: '#15a050',
  CAM: '#e05010', SS: '#e05010',
  RW: '#cc2020', LW: '#cc2020', ST: '#aa1010',
};

const STAT_CONFIG = [
  { key: 'attack',  label: 'ATK', color: '#ff5c5c', bg: 'rgba(255,92,92,0.15)' },
  { key: 'defense', label: 'DEF', color: '#4aabff', bg: 'rgba(74,171,255,0.15)' },
  { key: 'star',    label: 'STR', color: '#ffd700', bg: 'rgba(255,215,0,0.15)' },
];

function cardClass(special) {
  if (special === '100Club') return 'card-shell card-gold card-shimmer';
  if (special === 'MOTM')    return 'card-shell card-motm card-shimmer';
  if (special === 'HatTrick') return 'card-shell card-hattrick card-shimmer';
  return 'card-shell card-standard';
}

export default function CardDisplay({ card, size = 'md', selected, onClick, highlight }) {
  if (!card) return null;
  const special = SPECIAL_META[card.special];
  const sm = size === 'sm';
  const posColor = POS_COLORS[card.position] || '#555';

  let extraClass = '';
  if (selected) extraClass = 'selected';
  else if (highlight === 'win') extraClass = 'highlight-win';
  else if (highlight === 'lose') extraClass = 'highlight-lose';

  return (
    <div
      onClick={onClick}
      className={`${cardClass(card.special)} ${extraClass}`}
      style={{
        width: sm ? '128px' : '188px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Special banner */}
      {special && (
        <div style={{
          background: special.gradient,
          color: special.textColor,
          fontSize: '8px',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          letterSpacing: '0.15em',
          textAlign: 'center',
          padding: '4px 0',
          position: 'relative',
          zIndex: 2,
        }}>
          {special.label}
        </div>
      )}

      <div style={{ padding: sm ? '10px' : '14px', position: 'relative', zIndex: 2 }}>

        {/* Top row: club + nation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: sm ? 6 : 8 }}>
          <span style={{
            fontSize: sm ? '8px' : '9px',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            maxWidth: '60%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {card.club}
          </span>
          <span style={{
            fontSize: sm ? '8px' : '9px',
            color: 'rgba(255,255,255,0.25)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {card.nation}
          </span>
        </div>

        {/* Player name */}
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: sm ? '18px' : '26px',
          lineHeight: 1,
          color: '#ffffff',
          marginBottom: sm ? 6 : 10,
          letterSpacing: '-0.01em',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          {card.name}
        </div>

        {/* Position pill */}
        <div style={{ marginBottom: sm ? 8 : 12 }}>
          <span style={{
            background: posColor,
            color: '#fff',
            fontSize: '9px',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            letterSpacing: '0.1em',
            padding: '2px 7px',
            borderRadius: '6px',
            boxShadow: `0 2px 8px ${posColor}44`,
          }}>
            {card.position}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sm ? '5px' : '7px' }}>
          {STAT_CONFIG.map(({ key, label, color, bg }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '8px',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: color,
                width: sm ? '18px' : '20px',
                flexShrink: 0,
                opacity: 0.8,
              }}>
                {label}
              </span>
              <div className="stat-bar-track" style={{ flex: 1 }}>
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${card[key]}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                  }}
                />
              </div>
              <span style={{
                fontSize: sm ? '10px' : '12px',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                color: card.special === '100Club' && card[key] >= 100 ? '#ffd700' : '#fff',
                width: sm ? '22px' : '26px',
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {card[key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Watermark rating */}
      {!sm && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          right: 12,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: '52px',
          opacity: 0.06,
          color: '#ffffff',
          lineHeight: 1,
          pointerEvents: 'none',
          zIndex: 1,
          letterSpacing: '-0.02em',
        }}>
          {card.star}
        </div>
      )}
    </div>
  );
}
