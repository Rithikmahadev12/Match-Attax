import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Collection ──
      collection: [],          // cards the player owns
      addCard: (card) => {
        const { collection } = get();
        if (!collection.find(c => c.id === card.id)) {
          set({ collection: [...collection, card] });
        }
      },
      removeCard: (id) =>
        set({ collection: get().collection.filter(c => c.id !== id) }),
      clearCollection: () => set({ collection: [] }),

      // ── Active game session ──
      sessionId: null,
      gameState: null,
      lastResult: null,

      setSession: (sessionId, gameState) =>
        set({ sessionId, gameState, lastResult: null }),

      updateGame: (gameState, lastResult) =>
        set({ gameState, lastResult }),

      clearGame: () =>
        set({ sessionId: null, gameState: null, lastResult: null }),
    }),
    {
      name: 'match-attax-storage',
      partialState: ['collection'],   // only persist the collection
    }
  )
);
