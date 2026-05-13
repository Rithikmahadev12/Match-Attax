import { useStore } from '../store/gameStore';

export function useGame() {
  const { sessionId, gameState, lastResult, setSession, updateGame, clearGame } = useStore();

  const startGame = async (deck) => {
    const res = await fetch('/api/game/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerDeck: deck }),
    });
    if (!res.ok) throw new Error('Failed to start game');
    const { sessionId: sid, game } = await res.json();
    setSession(sid, game);
  };

  const playTurn = async (stat) => {
    const res = await fetch(`/api/game/${sessionId}/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stat }),
    });
    if (!res.ok) throw new Error('Failed to play turn');
    const result = await res.json();
    updateGame(result.game, result);
  };

  const endGame = async () => {
    if (sessionId) {
      await fetch(`/api/game/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }
    clearGame();
  };

  return { gameState, lastResult, startGame, playTurn, endGame };
}
