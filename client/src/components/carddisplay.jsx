const SPECIAL_LABELS = {
  '100Club': { text: '100 CLUB', gradient: 'linear-gradient(90deg,#b8860b,#FFD700,#b8860b)' },
  MOTM: { text: 'MAN OF THE MATCH', gradient: 'linear-gradient(90deg,#0050cc,#3b9eff,#0050cc)' },
  HatTrick: { text: 'HAT-TRICK HERO', gradient: 'linear-gradient(90deg,#6600bb,#c800ff,#6600bb)' },
};

const POS_COLOR = {
  GK:'#b45309', CB:'#1d4ed8', RB:'#1d4ed8', LB:'#1d4ed8',
  CDM:'#15803d', CM:'#15803d', CAM:'#c2410c',
  SS:'#c2410c', RW:'#b91c1c', LW:'#b91c1c', ST:'#991b1b',
};

function cardClass(special) {
  if (special === '100Club') return 'card-gold';
  if (special === 'MOTM') return 'card-motm';
  if (special === 'HatTrick') return 'card-hattrick';
  return 'card-standard';
}

export default function CardDisplay({ card, size = 'md', selected, onClick, highlight }) {
  if (!card) return null;
  const special = SPECIAL_LABELS[card.special];
  const sm = size === 'sm';

  return (
    <div onClick={onClick}
      className={`relative rounded-2xl overflow-hidden select-none transition-all duration-200 ${cardClass(card.special)}
        ${sm ? 'w-32' : 'w-48'}
        ${onClick ? 'cursor-pointer' : ''}
        ${selected ? 'ring-2 ring-yellow-400 scale-105 shadow-yellow-400/30 shadow-xl' : onClick ? 'hover:scale-105 hover:shadow-xl' : ''}
        ${highlight === 'win' ? 'ring-2 ring-green-400 shadow-green-400/20 shadow-xl' : ''}
        ${highlight === 'lose' ? 'ring-2 ring-red-500 opacity-60' : ''}
      `}>

      {/* Special banner */}
      {special && (
        <div className="text-center text-[9px] font-bold py-1 text-black tracking-widest"
          style={{ background: special.gradient }}>
          {special.text}
        </div>
      )}

      <div className={sm ? 'p-2.5' : 'p-3'}>
        {/* Club / Nation row */}
        <div className="flex justify-between items-center mb-1">
          <span className={`${sm ? 'text-[9px]' : 'text-[10px]'} text-gray-400 font-medium truncate`}>{card.club}</span>
          <span className={`${sm ? 'text-[9px]' : 'text-[10px]'} text-gray-500`}>{card.nation}</span>
        </div>

        {/* Name */}
        <div className={`font-display leading-none mb-2 ${sm ? 'text-base' : 'text-xl'} text-white`}>
          {card.name}
        </div>

        {/* Position pill */}
        <div className="mb-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md text-white`}
            style={{ background: POS_COLOR[card.position] || '#374151' }}>
            {card.position}
          </span>
        </div>

        {/* Stats */}
        <div className={`space-y-${sm ? '1' : '1.5'}`}>
          {[
            { key: 'attack', label: 'ATK', color: '#ef4444' },
            { key: 'defense', label: 'DEF', color: '#3b82f6' },
            { key: 'star', label: 'STR', color: '#eab308' },
          ].map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 w-5 shrink-0">{label}</span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(0,0,0,0.4)' }}>
                <div className="h-full rounded-full stat-bar" style={{ width: `${card[key]}%`, background: color }} />
              </div>
              <span className={`text-[11px] font-bold w-6 text-right ${card.special === '100Club' && card[key] >= 100 ? 'text-yellow-400' : 'text-white'}`}>
                {card[key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Big rating watermark */}
      {!sm && (
        <div className="absolute bottom-2 right-3 font-display text-4xl opacity-10 text-white select-none">
          {card.star}
        </div>
      )}
    </div>
  );
}
