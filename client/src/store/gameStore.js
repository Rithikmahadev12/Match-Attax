import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const BUDGET_MAX = 100;

// Formation: 11 slots in 4-3-3
// 0=GK, 1=LB, 2=CB, 3=CB, 4=RB, 5=LM, 6=CM, 7=RM, 8=LW, 9=ST, 10=RW
export const POSITION_LABELS = ['GK','LB','CB','CB','RB','LM','CM','RM','LW','ST','RW'];

export const POS_COLOR = {
  GK:'#e67e00', CB:'#1a6ef5', LB:'#1a6ef5', RB:'#1a6ef5',
  CDM:'#15a050', CM:'#15a050', LM:'#15a050', RM:'#15a050', CAM:'#e05010', SS:'#e05010',
  LW:'#cc2020', RW:'#cc2020', ST:'#aa1010',
};

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

const emptyFormation = () => Array(11).fill(null);

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Library ──
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
        // Also clear from any team formation
        const teams = safeArray(get().teams).map(t => ({
          ...t,
          players: safeArray(t.players).filter(p => p._id !== id),
          formationSlots: (Array.isArray(t.formationSlots) ? t.formationSlots : emptyFormation())
            .map(c => (c && c._id === id) ? null : c),
        }));
        set(s => ({ library: safeArray(s.library).filter(c => c._id !== id), teams }));
      },

      // ── Teams ──
      teams: [],
      activeTeamId: null,

      createTeam: (name) => {
        const team = { id: uid(), name, players: [], formationSlots: emptyFormation() };
        set(s => ({ teams: [...safeArray(s.teams), team], activeTeamId: team.id }));
        return team;
      },
      renameTeam: (id, name) => {
        set(s => ({ teams: safeArray(s.teams).map(t => t.id === id ? { ...t, name } : t) }));
      },
      deleteTeam: (id) => {
        set(s => ({
          teams: safeArray(s.teams).filter(t => t.id !== id),
          activeTeamId: s.activeTeamId === id ? (safeArray(s.teams).find(t => t.id !== id)?.id || null) : s.activeTeamId,
        }));
      },
      setActiveTeam: (id) => set({ activeTeamId: id }),

      // Formation slot: slot 0-10 holds a card object or null
      setFormationSlot: (teamId, slotIdx, card) => {
        set(s => ({
          teams: safeArray(s.teams).map(t => {
            if (t.id !== teamId) return t;
            const slots = Array.isArray(t.formationSlots) ? [...t.formationSlots] : emptyFormation();
            // Remove card from any existing slot first
            const cleaned = slots.map((c, i) => (c && card && c._id === card._id && i !== slotIdx) ? null : c);
            cleaned[slotIdx] = card || null;
            // Sync players array from formation (non-null slots)
            const players = cleaned.filter(Boolean);
            return { ...t, formationSlots: cleaned, players };
          }),
        }));
      },
      clearFormationSlot: (teamId, slotIdx) => {
        set(s => ({
          teams: safeArray(s.teams).map(t => {
            if (t.id !== teamId) return t;
            const slots = Array.isArray(t.formationSlots) ? [...t.formationSlots] : emptyFormation();
            slots[slotIdx] = null;
            const players = slots.filter(Boolean);
            return { ...t, formationSlots: slots, players };
          }),
        }));
      },
      getFormationLineup: (teamId) => {
        const team = safeArray(get().teams).find(t => t.id === teamId);
        if (!team) return emptyFormation();
        const slots = Array.isArray(team.formationSlots) ? team.formationSlots : emptyFormation();
        return [...slots, ...Array(11)].slice(0, 11);
      },

      // Legacy team player methods (kept for compatibility)
      addToTeam: (teamId, card) => {
        const team = safeArray(get().teams).find(t => t.id === teamId);
        if (!team) return false;
        const slots = Array.isArray(team.formationSlots) ? [...team.formationSlots] : emptyFormation();
        if (slots.some(c => c && c._id === card._id)) return false;
        // Find first empty slot
        const emptySlot = slots.findIndex(c => c === null);
        if (emptySlot === -1) return false;
        get().setFormationSlot(teamId, emptySlot, card);
        return true;
      },
      removeFromTeam: (teamId, cardId) => {
        set(s => ({
          teams: safeArray(s.teams).map(t => {
            if (t.id !== teamId) return t;
            const slots = (Array.isArray(t.formationSlots) ? t.formationSlots : emptyFormation())
              .map(c => (c && c._id === cardId) ? null : c);
            return { ...t, formationSlots: slots, players: slots.filter(Boolean) };
          }),
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
          return { activePowerUps: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
        });
      },

      // ── Game session ──
      sessionId: null,
      gameState: null,
      lastResult: null,
      setSession: (sid, game) => set({ sessionId: sid, gameState: game, lastResult: null }),
      updateGame: (game, result) => set({ gameState: game, lastResult: result }),
      clearGame: () => set({ sessionId: null, gameState: null, lastResult: null }),
    }),
    {
      name: 'match-attax-v9',
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
        teams:          safeArray(persisted?.teams).map(t => ({
          ...t,
          formationSlots: Array.isArray(t.formationSlots) ? t.formationSlots : emptyFormation(),
        })),
        activeTeamId:   persisted?.activeTeamId  || null,
        coins:          persisted?.coins         ?? 500,
        ownedPowerUps:  safeArray(persisted?.ownedPowerUps),
        activePowerUps: safeArray(persisted?.activePowerUps),
      }),
    }
  )
);
