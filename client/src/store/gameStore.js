import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const POSITIONS = ['GK', 'DEF', 'MID', 'ATK'];

export const POWERUPS = [
  { id: 'pu_atk10',  name: 'Speed Boost',    emoji: '⚡', desc: '+10 ATK all squad', atk: 10, def: 0,  cost: 8  },
  { id: 'pu_def10',  name: 'Iron Wall',       emoji: '🛡️', desc: '+10 DEF all squad', atk: 0,  def: 10, cost: 8  },
  { id: 'pu_atk15',  name: 'Golden Boot',     emoji: '⭐', desc: '+15 ATK all squad', atk: 15, def: 0,  cost: 12 },
  { id: 'pu_def15',  name: 'Titanium Shield', emoji: '🔰', desc: '+15 DEF all squad', atk: 0,  def: 15, cost: 12 },
  { id: 'pu_both10', name: 'Super Squad',     emoji: '🚀', desc: '+10 ATK & DEF all', atk: 10, def: 10, cost: 18 },
];

export const BUDGET_MAX = 100;

export const FORMATION_SLOTS = [
  { id: 'gk',   label: 'GK',  row: 4, col: 1 },
  { id: 'def1', label: 'DEF', row: 3, col: 0 },
  { id: 'def2', label: 'DEF', row: 3, col: 1 },
  { id: 'def3', label: 'DEF', row: 3, col: 2 },
  { id: 'def4', label: 'DEF', row: 3, col: 3 },
  { id: 'mid1', label: 'MID', row: 2, col: 0 },
  { id: 'mid2', label: 'MID', row: 2, col: 1 },
  { id: 'mid3', label: 'MID', row: 2, col: 2 },
  { id: 'atk1', label: 'ATK', row: 1, col: 0 },
  { id: 'atk2', label: 'ATK', row: 1, col: 1 },
  { id: 'atk3', label: 'ATK', row: 1, col: 2 },
];

export const POS_COLOR = {
  GK: '#e67e00', DEF: '#1a6ef5', MID: '#15a050', ATK: '#cc2020',
};

export function applyBonus(card, atkBonus, defBonus) {
  return {
    ...card,
    attack:  Math.min(99, card.attack  + atkBonus),
    defense: Math.min(99, card.defense + defBonus),
  };
}

export function resolveTeamCards(team, allCards) {
  const bonus = (team.powerUps || []).reduce(
    (acc, puId) => {
      const pu = POWERUPS.find(p => p.id === puId);
      if (pu) { acc.atk += pu.atk; acc.def += pu.def; }
      return acc;
    },
    { atk: 0, def: 0 }
  );
  return Object.values(team.slots || {})
    .map(cid => allCards.find(c => c.id === cid))
    .filter(Boolean)
    .map(c => applyBonus(c, bonus.atk, bonus.def));
}

/** Keep cards and collection in sync (same array, two keys). */
const sync = (cards) => ({ cards, collection: cards });

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Cards / Collection ──
      cards: [],
      collection: [],   // alias — always mirrors `cards`

      addCard: (card) => {
        const existing = get().cards;
        // Deduplicate by original DB id
        if (card.id && existing.some(c => c.id === card.id)) return card;
        const c = { ...card, id: card.id || uid() };
        set(sync([...existing, c]));
        return c;
      },

      updateCard: (id, updates) =>
        set(sync(get().cards.map(c => c.id === id ? { ...c, ...updates } : c))),

      deleteCard: (id) =>
        set(sync(get().cards.filter(c => c.id !== id))),

      // Alias used by components
      removeCard: (id) => get().deleteCard(id),

      // ── Teams ──
      teams: [],
      saveTeam: (team) => {
        const id = team.id || uid();
        const t = { ...team, id };
        set(s => {
          const teams = s.teams || [];
          return {
            teams: teams.find(x => x.id === id)
              ? teams.map(x => x.id === id ? t : x)
              : [...teams, t],
          };
        });
        return t;
      },
      deleteTeam: (id) =>
        set(s => ({ teams: s.teams.filter(t => t.id !== id) })),

      // ── Active game session (ephemeral — not persisted) ──
      sessionId: null,
      gameState: null,
      lastResult: null,
      setSession: (sid, game) => set({ sessionId: sid, gameState: game, lastResult: null }),
      updateGame: (game, result) => set({ gameState: game, lastResult: result }),
      clearGame: () => set({ sessionId: null, gameState: null, lastResult: null }),

      gameSetup: null,
      setGameSetup: (setup) => set({ gameSetup: setup }),
      clearGameSetup: () => set({ gameSetup: null }),
    }),
    {
      name: 'card-attax-v2',
      partialize: (state) => ({
        cards: state.cards || [],
        teams: state.teams || [],
      }),
      merge: (persisted, current) => {
        const cards = persisted?.cards || [];
        return {
          ...current,
          cards,
          collection: cards,   // ensure alias is populated on rehydrate
          teams: persisted?.teams || [],
        };
      },
    }
  )
);
