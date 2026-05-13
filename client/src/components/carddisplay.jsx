const SPECIAL_LABELS = {
  '100Club': { text: '100 CLUB', color: 'text-yellow-300' },
  MOTM: { text: 'MAN OF THE MATCH', color: 'text-blue-300' },
  HatTrick: { text: 'HAT-TRICK HERO', color: 'text-purple-300' },
};

const POSITION_COLORS = {
  GK: 'bg-yellow-700',
  CB: 'bg-blue-800',
  RB: 'bg-blue-800',
  LB: 'bg-blue-800',
  CDM: 'bg-green-800',
  CM: 'bg-green-800',
  CAM: 'bg-orange-800',
  SS: 'bg-orange-800',
  RW: 'bg-red-800',
  LW: 'bg-red-800',
  ST: 'bg-red-900',
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
  const isSmall = size === 'sm';

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer select-none
        transition-all duration-200
        ${cardClass(card.special)}
        ${isSmall ? 'w-32' : 'w-52'}
        ${selected ? 'ring-2 ring-yellow-400 scale-105' : 'hover:scale-102'}
        ${highlight === 'win' ? 'ring-2 ring-green-400' : ''}
        ${highlight === 'lose' ? 'ring-2 ring-red-500 opacity-70' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      {/* Special badge */}
      {special && (
        <div className={`text-center text-[10px] font-bold py-0.5 ${special.color} border-b border-white/10`}>
          {special.text}
        </div>
      )}

      {/* Club + Nation */}
      <div className="px-3 pt-2 pb-1 flex justify-between items-center">
        <span className="text-[11px] text-gray-300 font-medium truncate">{card.club}</span>
        <span className="text-[10px] text-gray-400">{card.nation}</span>
      </div>

      {/* Player name */}
      <div className={`px-3 font-display ${isSmall ? 'text-sm' : 'text-lg'} text-white leading-tight`}>
        {card.name}
      </div>

      {/* Position badge */}
      <div className="px-3 mt-1">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${POSITION_COLORS[card.position] || 'bg-gray-700'}`}>
          {card.position}
        </span>
      </div>

      {/* Stats */}
      <div className={`px-3 ${isSmall ? 'py-2 space-y-1' : 'py-3 space-y-2'}`}>
        {[
          { key: 'attack', label: 'ATK', color: 'bg-red-500' },
          { key: 'defense', label: 'DEF', color: 'bg-blue-500' },
          { key: 'star', label: '★', color: 'bg-yellow-500' },
        ].map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[10px] w-6 text-gray-400">{label}</span>
            <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${color} rounded-full stat-bar`}
                style={{ width: `${card[key]}%` }}
              />
            </div>
            <span className={`text-xs font-bold w-6 text-right ${card.special === '100Club' && card[key] >= 100 ? 'text-yellow-400' : 'text-white'}`}>
              {card[key]}
            </span>
          </div>
        ))}
      </div>

      {/* Star rating big number */}
      {!isSmall && (
        <div className="absolute top-2 right-2 text-2xl font-display text-yellow-400 opacity-20">
          {card.star}
        </div>
      )}
    </div>
  );
}
