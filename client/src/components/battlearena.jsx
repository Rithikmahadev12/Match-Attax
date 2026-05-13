import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardDisplay from './carddisplay';
import { useGame } from '../hooks/useGame';

const STATS = [
  { key: 'attack', label: '⚔️ Attack', color: 'bg-red-600 hover:bg-red-500' },
  { key: 'defense', label: '🛡️ Defense', color: 'bg-blue-600 hover:bg-blue-500' },
  { key: 'star', label: '⭐ Star', color: 'bg-yellow-500 hover:bg-yellow-400 text-black' },
];

export default function BattleArena() {
  const { gameState, lastResult, playTurn } = useGame();
  const [busy, setBusy] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  if (!gameState) return null;

  const playerCard = gameState.playerDeck[0];
  const cpuCard = gameState.cpuDeck[0];
  const isPlayerTurn = gameState.turn === 'player';

  const handleStat = async (stat) => {
    if (busy || !isPlayerTurn) return;
    setBusy(true);
    try {
      await playTurn(stat);
      setAnimKey(k => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const outcomeBanner = () => {
    if (!lastResult) return null;
    if (lastResult.outcome === 'player') return { text: '🏆 YOU WIN!', color: 'text-green-400' };
    if (lastResult.outcome === 'cpu') return { text: '💀 CPU WINS', color: 'text-red-400' };
    return { text: '🤝 DRAW', color: 'text-yellow-400' };
  };

  const banner = outcomeBanner();

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Score bar */}
      <div className="flex gap-8 text-sm font-bold">
        <span className="text-green-400">YOU: {gameState.playerWon.length} cards</span>
        <span className="text-gray-500">Round {gameState.round}</span>
        <span className="text-red-400">CPU: {gameState.cpuWon.length} cards</span>
      </div>

      {/* Cards side by side */}
      <div className="flex gap-8 items-center flex-wrap justify-center">
        {/* Player card */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">YOUR CARD</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={`player-${animKey}`}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <CardDisplay
                card={playerCard}
                highlight={lastResult?.outcome === 'player' ? 'win' : lastResult?.outcome === 'cpu' ? 'lose' : undefined}
              />
            </motion.div>
          </AnimatePresence>
          <span className="text-xs text-gray-500">{gameState.playerDeck.length} cards left</span>
        </div>

        {/* VS / outcome */}
        <div className="flex flex-col items-center gap-2">
          {banner ? (
            <motion.div
              key={animKey}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-2xl font-display font-bold ${banner.color}`}
            >
              {banner.text}
            </motion.div>
          ) : (
            <div className="text-2xl font-display text-gray-500">VS</div>
          )}
          {lastResult && (
            <div className="text-xs text-gray-400 text-center">
              <span className="uppercase text-gray-500">{lastResult.stat}</span>
              <br />
              {lastResult.playerVal} vs {lastResult.cpuVal}
            </div>
          )}
        </div>

        {/* CPU card */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">CPU CARD</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={`cpu-${animKey}`}
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <CardDisplay
                card={cpuCard}
                highlight={lastResult?.outcome === 'cpu' ? 'win' : lastResult?.outcome === 'player' ? 'lose' : undefined}
              />
            </motion.div>
          </AnimatePresence>
          <span className="text-xs text-gray-500">{gameState.cpuDeck.length} cards left</span>
        </div>
      </div>

      {/* Stat buttons */}
      {gameState.status === 'playing' && (
        <div className="flex flex-col items-center gap-3">
          {isPlayerTurn ? (
            <>
              <p className="text-sm text-gray-400">Choose your stat to battle with:</p>
              <div className="flex gap-3">
                {STATS.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => handleStat(key)}
                    disabled={busy}
                    className={`px-5 py-2.5 rounded-lg font-bold text-sm transition ${color} disabled:opacity-40`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-gray-400">CPU is choosing...</p>
              <button
                onClick={() => handleStat('attack')} // ignored - CPU picks its own stat
                disabled={busy}
                className="px-6 py-2.5 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition disabled:opacity-40"
              >
                {busy ? 'Playing...' : 'Let CPU Play →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
