import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const POS_COLOR = {
  GK: '#e67e00', DEF: '#1a6ef5', MID: '#15a050', ATK: '#cc2020',
};

export const POWERUPS = [
  { id: 'pu_atk10',  name: 'Speed Boost',   emoji: '⚡', desc: '+10 ATK all squad', atk: 10, def: 0,  cost: 150 },
  { id: 'pu_def10',  name: 'Iron Wall',      emoji: '🛡️', desc: '+10 DEF all squad', atk: 0,  def: 10, cost: 150 },
  { id: 'pu_atk15',  name: 'Golden Boot',    emoji: '⭐', desc: '+15 ATK all squad', atk: 15, def: 0,  cost: 250 },
  { id: 'pu_def15',  name: 'Titan Shield',   emoji: '🔰', desc: '+15 DEF all squad', atk: 0,  def: 15, cost: 250 },
  { id: 'pu_both10', name: 'Super Squad',    emoji: '🚀', desc: '+10 ATK & DEF all', atk: 10, def: 10, cost: 350 },
  { id: 'pu_both15', name: 'Elite Force',    emoji: '🏆', desc: '+15 ATK & DEF all', atk: 15, def: 15, cost: 500 },
];

export const BUDGET_MAX = 100; // £100M

export function applyPowerUps(card, powerUpIds = []) {
  const bonus = powerUpIds.reduce((acc, pid) => {
    const p = POWERUPS.find(x => x.id === pid);
    if (p) { acc.atk += p.atk; acc.def += p.def; }
    return acc;
  }, { atk: 0, def: 0 });
  return {
    ...card,
    attack:  Math.min(99, card.attack  + bonus.atk),
    defense: Math.min(99, card.defense + bonus.def),
  };
}

/** Keep cards and collection in sync (same array, two keys). */
const sync = (cards) => ({ cards, collection: cards });

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Cards / Collection ──
      // Both `cards` and `collection` always mirror each other.
      cards: [],
      collection: [],

      addCard: (card) => {
        const existing = get().cards;
        // Deduplicate by original DB id (not _id, which is local)
        if (card.id && existing.some(c => c.id === card.id)) return card;
        const c = { ...card, _id: card._id || uid() };
        const next = [...existing, c];
        set(sync(next));
        save();
        return c;
      },

      updateCard: (id, updates) => {
        const next = get().cards.map(c => c._id === id ? { ...c, ...updates } : c);
        set(sync(next));
      },

      deleteCard: (id) => {
        const next = get().cards.filter(c => c._id !== id);
        set(sync(next));
      },
      // Alias used by components
      removeCard: (id) => get().deleteCard(id),

      // ── Economy ──
      coins: 500,
      addCoins: (n) => set(s => ({ coins: s.coins + n })),
      spendCoins: (n) => {
        if (get().coins < n) return false;
        set(s => ({ coins: s.coins - n }));
        return true;
      },

      // ── Power-ups ──
      ownedPowerUps: [],
      activePowerUps: [],
      buyPowerUp: (id) => {
        const pu = POWERUPS.find(p => p.id === id);
        if (!pu || get().ownedPowerUps.includes(id)) return false;
        if (!get().spendCoins(pu.cost)) return false;
        set(s => ({ ownedPowerUps: [...s.ownedPowerUps, id] }));
        return true;
      },
      toggleActivePU: (id) => {
        set(s => ({
          activePowerUps: s.activePowerUps.includes(id)
            ? s.activePowerUps.filter(x => x !== id)
            : [...s.activePowerUps, id],
        }));
      },

      // ── Active game session (ephemeral — NOT persisted) ──
      sessionId: null,
      gameState: null,
      lastResult: null,
      setSession: (sid, game) => set({ sessionId: sid, gameState: game, lastResult: null }),
      updateGame: (game, result) => set({ gameState: game, lastResult: result }),
      clearGame: () => set({ sessionId: null, gameState: null, lastResult: null }),
    }),
    {
      name: 'match-attax-v4',
      partialize: (state) => ({
        cards:         state.cards         || [],
        coins:         state.coins         ?? 500,
        ownedPowerUps: state.ownedPowerUps || [],
        activePowerUps:state.activePowerUps|| [],
      }),
      merge: (persisted, current) => {
        const cards = persisted?.cards || [];
        return {
          ...current,
          cards,
          collection: cards,
          coins:          persisted?.coins          ?? 500,
          ownedPowerUps:  persisted?.ownedPowerUps  || [],
          activePowerUps: persisted?.activePowerUps || [],
        };
      },
    }
  )
);
