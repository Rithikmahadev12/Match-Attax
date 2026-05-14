import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const POSITIONS = ['GK', 'DEF', 'MID', 'ATK'];

export const POWERUPS = [
  { id: 'pu_atk10',  name: 'Speed Boost',     emoji: '⚡', desc: '+10 ATK all squad', atk: 10, def: 0,  cost: 8  },
  { id: 'pu_def10',  name: 'Iron Wall',        emoji: '🛡️', desc: '+10 DEF all squad', atk: 0,  def: 10, cost: 8  },
  { id: 'pu_atk15',  name: 'Golden Boot',      emoji: '⭐', desc: '+15 ATK all squad', atk: 15, def: 0,  cost: 12 },
  { id: 'pu_def15',  name: 'Titanium Shield',  emoji: '🔰', desc: '+15 DEF all squad', atk: 0,  def: 15, cost: 12 },
  { id: 'pu_both10', name: 'Super Squad',       emoji: '🚀', desc: '+10 ATK & DEF all', atk: 10, def: 10, cost: 18 },
];

export const BUDGET_MAX = 100; // £100M

// 11 formation slots (4-3-3 shape)
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

/** Apply power-up bonuses to a card */
export function applyBonus(card, atkBonus, defBonus) {
  return {
    ...card,
    attack:  Math.min(99, card.attack  + atkBonus),
    defense: Math.min(99, card.defense + defBonus),
  };
}

/** Get team cards with bonuses applied */
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

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Cards ──
      cards: [],
      addCard: (card) => {
        const c = { id: uid(), ...card };
        set(s => ({ cards: [...s.cards, c] }));
        return c;
      },
      updateCard: (id, updates) =>
        set(s => ({ cards: s.cards.map(c => c.id === id ? { ...c, ...updates } : c) })),
      deleteCard: (id) =>
        set(s => ({ cards: s.cards.filter(c => c.id !== id) })),

      // ── Teams ──
      teams: [],
      saveTeam: (team) => {
        const id = team.id || uid();
        const t = { ...team, id };
        set(s => ({
          teams: s.teams.find(x => x.id === id)
            ? s.teams.map(x => x.id === id ? t : x)
            : [...s.teams, t],
        }));
        return t;
      },
      deleteTeam: (id) =>
        set(s => ({ teams: s.teams.filter(t => t.id !== id) })),

      // ── Active game (not persisted) ──
      gameSetup: null,
      setGameSetup: (setup) => set({ gameSetup: setup }),
      clearGameSetup: () => set({ gameSetup: null }),
    }),
    {
      name: 'card-attax-v2',
      partialState: ['cards', 'teams'],
    }
  )
);
