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
  const ids = Array.isArray(powerUpIds) ? powerUpIds : [];
  const bonus = ids.reduce((acc, pid) => {
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

const safeArray = (v) => (Array.isArray(v) ? v : []);

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Player library ──
      library: [],

      addToLibrary: (card) => {
        const c = { ...card, _id: card._id || uid() };
        set(s => ({ library: [...safeArray(s.library), c] }));
        return c;
      },
      updateLibraryCard: (id, updates) => {
        set(s => ({ library: safeArray(s.library).map(c => c._id === id ? { ...c, ...updates } : c) }));
      },
      removeFromLibrary: (id) => {
        const teams = safeArray(get().teams).map(t => ({
          ...t,
          players: safeArray(t.players).filter(p => p._id !== id),
        }));
        set(s => ({ library: safeArray(s.library).filter(c => c._id !== id), teams }));
      },

      // ── Teams ──
      teams: [],
      activeTeamId: null,

      createTeam: (name) => {
        const team = { id: uid(), name, players: [] };
        set(s => ({ teams: [...safeArray(s.teams), team], activeTeamId: team.id }));
        return team;
      },
      renameTeam: (id, name) => {
        set(s => ({ teams: safeArray(s.teams).map(t => t.id === id ? { ...t, name } : t) }));
      },
      deleteTeam: (id) => {
        set(s => ({
          teams: safeArray(s.teams).filter(t => t.id !== id),
          activeTeamId: s.activeTeamId === id ? (safeArray(s.teams)[0]?.id || null) : s.activeTeamId,
        }));
      },
      setActiveTeam: (id) => set({ activeTeamId: id }),

      addToTeam: (teamId, card) => {
        const team = safeArray(get().teams).find(t => t.id === teamId);
        if (!team) return false;
        const players = safeArray(team.players);
        const currentBudget = players.reduce((s, c) => s + (c.price || 0), 0);
        if (currentBudget + (card.price || 0) > BUDGET_MAX) return false;
        if (players.some(p => p._id === card._id)) return false;
        set(s => ({
          teams: safeArray(s.teams).map(t => t.id === teamId
            ? { ...t, players: [...safeArray(t.players), card] }
            : t
          ),
        }));
        return true;
      },
      removeFromTeam: (teamId, cardId) => {
        set(s => ({
          teams: safeArray(s.teams).map(t => t.id === teamId
            ? { ...t, players: safeArray(t.players).filter(p => p._id !== cardId) }
            : t
          ),
        }));
      },

      getTeamBudget: (teamId) => {
        const team = safeArray(get().teams).find(t => t.id === teamId);
        if (!team) return 0;
        return safeArray(team.players).reduce((s, c) => s + (c.price || 0), 0);
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
        if (!pu || safeArray(get().ownedPowerUps).includes(id)) return false;
        if (!get().spendCoins(pu.cost)) return false;
        set(s => ({ ownedPowerUps: [...safeArray(s.ownedPowerUps), id] }));
        return true;
      },
      toggleActivePU: (id) => {
        set(s => {
          const cur = safeArray(s.activePowerUps);
          return {
            activePowerUps: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id],
          };
        });
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
      name: 'match-attax-v7',  // bumped version to clear any corrupt persisted state
      partialize: (s) => ({
        library:        safeArray(s.library),
        teams:          safeArray(s.teams),
        activeTeamId:   s.activeTeamId  || null,
        coins:          s.coins         ?? 500,
        ownedPowerUps:  safeArray(s.ownedPowerUps),
        activePowerUps: safeArray(s.activePowerUps),
      }),
      merge: (persisted, current) => ({
        ...current,
        library:        safeArray(persisted?.library),
        teams:          safeArray(persisted?.teams),
        activeTeamId:   persisted?.activeTeamId  || null,
        coins:          persisted?.coins         ?? 500,
        ownedPowerUps:  safeArray(persisted?.ownedPowerUps),
        activePowerUps: safeArray(persisted?.activePowerUps),
      }),
    }
  )
);
