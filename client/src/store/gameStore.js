import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const BUDGET_MAX = 100; // £100M

export const POWERUPS = [
  { id: 'pu_atk10',  name: 'Speed Boost',  emoji: '⚡', desc: '+10 ATK all squad', atk: 10, def: 0,  cost: 150 },
  { id: 'pu_def10',  name: 'Iron Wall',     emoji: '🛡️', desc: '+10 DEF all squad', atk: 0,  def: 10, cost: 150 },
  { id: 'pu_atk15',  name: 'Golden Boot',   emoji: '⭐', desc: '+15 ATK all squad', atk: 15, def: 0,  cost: 250 },
  { id: 'pu_def15',  name: 'Titan Shield',  emoji: '🔰', desc: '+15 DEF all squad', atk: 0,  def: 15, cost: 250 },
  { id: 'pu_both10', name: 'Super Squad',   emoji: '🚀', desc: '+10 ATK & DEF all', atk: 10, def: 10, cost: 350 },
  { id: 'pu_both15', name: 'Elite Force',   emoji: '🏆', desc: '+15 ATK & DEF all', atk: 15, def: 15, cost: 500 },
];

export function applyPowerUps(card, powerUpIds = []) {
  const bonus = powerUpIds.reduce((acc, pid) => {
    const p = POWERUPS.find(x => x.id === pid);
    if (p) { acc.atk += p.atk; acc.def += p.def; }
    return acc;
  }, { atk: 0, def: 0 });
  return {
    ...card,
    attack:  Math.min(99, (card.attack  || 50) + bonus.atk),
    defense: Math.min(99, (card.defense || 50) + bonus.def),
  };
}

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Player library (all scanned cards, no premade) ──
      library: [], // { _id, name, position, attack, defense, price, photo, club, nation }

      addToLibrary: (card) => {
        const c = { ...card, _id: card._id || uid() };
        set(s => ({ library: [...s.library, c] }));
        return c;
      },
      updateLibraryCard: (id, updates) => {
        set(s => ({ library: s.library.map(c => c._id === id ? { ...c, ...updates } : c) }));
      },
      removeFromLibrary: (id) => {
        // Also remove from any teams
        const teams = get().teams.map(t => ({
          ...t,
          players: t.players.filter(p => p._id !== id),
        }));
        set(s => ({ library: s.library.filter(c => c._id !== id), teams }));
      },

      // ── Teams ──
      teams: [], // { id, name, players: [card] }
      activeTeamId: null,

      createTeam: (name) => {
        const team = { id: uid(), name, players: [] };
        set(s => ({ teams: [...s.teams, team], activeTeamId: team.id }));
        return team;
      },
      renameTeam: (id, name) => {
        set(s => ({ teams: s.teams.map(t => t.id === id ? { ...t, name } : t) }));
      },
      deleteTeam: (id) => {
        set(s => ({
          teams: s.teams.filter(t => t.id !== id),
          activeTeamId: s.activeTeamId === id ? (s.teams[0]?.id || null) : s.activeTeamId,
        }));
      },
      setActiveTeam: (id) => set({ activeTeamId: id }),

      addToTeam: (teamId, card) => {
        const team = get().teams.find(t => t.id === teamId);
        if (!team) return false;
        // Check budget
        const currentBudget = team.players.reduce((s, c) => s + (c.price || 0), 0);
        if (currentBudget + (card.price || 0) > BUDGET_MAX) return false;
        // No duplicates
        if (team.players.some(p => p._id === card._id)) return false;
        set(s => ({
          teams: s.teams.map(t => t.id === teamId
            ? { ...t, players: [...t.players, card] }
            : t
          ),
        }));
        return true;
      },
      removeFromTeam: (teamId, cardId) => {
        set(s => ({
          teams: s.teams.map(t => t.id === teamId
            ? { ...t, players: t.players.filter(p => p._id !== cardId) }
            : t
          ),
        }));
      },

      getTeamBudget: (teamId) => {
        const team = get().teams.find(t => t.id === teamId);
        if (!team) return 0;
        return team.players.reduce((s, c) => s + (c.price || 0), 0);
      },

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

      // ── Game session (ephemeral) ──
      sessionId: null,
      gameState: null,
      lastResult: null,
      setSession: (sid, game) => set({ sessionId: sid, gameState: game, lastResult: null }),
      updateGame: (game, result) => set({ gameState: game, lastResult: result }),
      clearGame: () => set({ sessionId: null, gameState: null, lastResult: null }),
    }),
    {
      name: 'match-attax-v6',
      partialize: (s) => ({
        library:       s.library       || [],
        teams:         s.teams         || [],
        activeTeamId:  s.activeTeamId  || null,
        coins:         s.coins         ?? 500,
        ownedPowerUps: s.ownedPowerUps || [],
        activePowerUps:s.activePowerUps|| [],
      }),
      merge: (persisted, current) => ({
        ...current,
        library:       persisted?.library       || [],
        teams:         persisted?.teams         || [],
        activeTeamId:  persisted?.activeTeamId  || null,
        coins:         persisted?.coins         ?? 500,
        ownedPowerUps: persisted?.ownedPowerUps || [],
        activePowerUps:persisted?.activePowerUps|| [],
      }),
    }
  )
);
