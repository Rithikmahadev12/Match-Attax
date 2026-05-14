import { useState } from 'react';
import { useStore, BUDGET_MAX } from '../store/gameStore';

const POS_COLOR = {
  GK:'#e67e00', CB:'#1a6ef5', LB:'#1a6ef5', RB:'#1a6ef5',
  CDM:'#15a050', CM:'#15a050', CAM:'#e05010', SS:'#e05010',
  LW:'#cc2020', RW:'#cc2020', ST:'#aa1010',
};

function MiniCard({ card, onRemove, onClick, selected, compact }) {
  const pos = card?.position || '?';
  const posColor = POS_COLOR[pos] || '#555';
  const w = compact ? 72 : 90;
  return (
    <div
      onClick={onClick}
      style={{
        width: w, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: onClick ? 'pointer' : 'default',
        background: selected ? 'rgba(184,255,60,0.1)' : 'var(--surface2)',
        border: selected ? '2px solid var(--lime)' : '1.5px solid var(--border-dim)',
        transform: selected ? 'translateY(-4px)' : 'none',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      {card?.photo
        ? <img src={card.photo} alt={card.name} style={{ width: '100%', height: compact ? 52 : 64, objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
        : <div style={{ width: '100%', height: compact ? 52 : 64, background: '#0d140d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#1a2a1a' }}>👤</div>
      }
      <div style={{ padding: '4px 5px 6px' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: compact ? 8 : 9, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{card?.name || '?'}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ background: posColor, color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 6, padding: '1px 3px', borderRadius: 3 }}>{pos}</span>
          {card?.price != null && <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 7, color: '#ffd700' }}>£{card.price}M</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 7, color: '#ff5757' }}>ATK {card?.attack ?? '?'}</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 7, color: '#4aabff' }}>DEF {card?.defense ?? '?'}</span>
        </div>
      </div>
      {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(255,60,60,0.8)', border: 'none', borderRadius: '50%', width: 14, height: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', lineHeight: 1 }}>✕</button>
      )}
    </div>
  );
}

function EmptySlot({ onClick, label }) {
  return (
    <div onClick={onClick} style={{
      width: 72, height: 100, borderRadius: 10, border: '1.5px dashed rgba(255,255,255,0.12)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      cursor: onClick ? 'pointer' : 'default', gap: 4,
      background: onClick ? 'rgba(184,255,60,0.03)' : 'transparent',
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = 'rgba(184,255,60,0.3)')}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
    >
      <div style={{ fontSize: 18, opacity: 0.2 }}>+</div>
      {label && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 7, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em', textAlign: 'center' }}>{label}</div>}
    </div>
  );
}

export default function Collection() {
  const {
    library,          // ← was `collection`
    removeFromLibrary, // ← was `removeFromCollection`
    teams,
    activeTeamId,
    createTeam,
    renameTeam,
    deleteTeam,
    setActiveTeam,
    addToTeam,
    removeFromTeam,
    getTeamBudget,
  } = useStore();

  // Safe local aliases — guard against undefined during hydration
  const safeLibrary = Array.isArray(library) ? library : [];
  const safeTeams   = Array.isArray(teams)   ? teams   : [];

  const [tab, setTab] = useState('library');
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const activeTeam  = safeTeams.find(t => t.id === activeTeamId);
  const budget      = activeTeamId ? getTeamBudget(activeTeamId) : 0;
  const budgetLeft  = BUDGET_MAX - budget;

  const filteredLib = safeLibrary.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.club?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToTeam = (card) => {
    if (!activeTeamId) { alert('Create or select a team first!'); return; }
    const ok = addToTeam(activeTeamId, card);
    if (!ok) alert(`Can't add — over £${BUDGET_MAX}M budget or already in team!`);
    setSelectedCard(null);
  };

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    createTeam(newTeamName.trim());
    setNewTeamName('');
    setShowNewTeam(false);
    setTab('teams');
  };

  return (
    <div className="page" style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: '#fff', lineHeight: 1 }}>
          MY <span style={{ color: 'var(--lime)' }}>SQUAD</span>
        </div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--lime)' }}>
          {safeLibrary.length} <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>cards</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 12, overflow: 'hidden', marginBottom: 16, border: '1px solid var(--border-dim)' }}>
        {[['library','📚 Library'],['teams','⚽ Teams']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '11px 0', background: tab === t ? 'var(--lime)' : 'none', color: tab === t ? '#0a0e0a' : 'var(--muted)', border: 'none', cursor: 'pointer', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', transition: 'all 0.15s ease' }}>
            {label}
          </button>
        ))}
      </div>

      {/* LIBRARY TAB */}
      {tab === 'library' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border-dim)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or club..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, padding: '10px 0', fontFamily: "'Barlow',sans-serif" }}
              />
            </div>
          </div>

          {activeTeam && (
            <div style={{ background: 'rgba(184,255,60,0.06)', border: '1px solid rgba(184,255,60,0.15)', borderRadius: 10, padding: '8px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚽</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: 'var(--lime)', fontWeight: 700 }}>Adding to: {activeTeam.name}</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>£{budgetLeft.toFixed(1)}M left</span>
            </div>
          )}

          {safeLibrary.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📷</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 22, color: 'rgba(255,255,255,0.25)' }}>No cards yet</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Scan your first Match Attax card</div>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {filteredLib.map(card => (
              <div key={card._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <MiniCard
                  card={card}
                  selected={selectedCard?._id === card._id}
                  onClick={() => setSelectedCard(s => s?._id === card._id ? null : card)}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  {activeTeam && (
                    <button
                      onClick={() => handleAddToTeam(card)}
                      style={{ background: 'none', border: '1px solid rgba(184,255,60,0.3)', color: 'var(--lime)', cursor: 'pointer', borderRadius: 6, padding: '3px 8px', fontSize: 9, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}
                    >
                      + TEAM
                    </button>
                  )}
                  <button
                    onClick={() => removeFromLibrary(card._id)}
                    style={{ background: 'none', border: '1px solid rgba(255,60,60,0.3)', color: '#ff6060', cursor: 'pointer', borderRadius: 6, padding: '3px 8px', fontSize: 9, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TEAMS TAB */}
      {tab === 'teams' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <select
              value={activeTeamId || ''}
              onChange={e => setActiveTeam(e.target.value || null)}
              style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, outline: 'none' }}
            >
              <option value="">— Select team —</option>
              {safeTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={() => setShowNewTeam(true)} className="btn-lime" style={{ padding: '10px 16px', fontSize: 13, borderRadius: 10 }}>+ New</button>
          </div>

          {showNewTeam && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--lime)', marginBottom: 10 }}>NEW TEAM</div>
              <input
                autoFocus
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
                placeholder="Team name..."
                style={{ width: '100%', background: 'var(--surface3)', border: '1px solid var(--border-dim)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", outline: 'none', marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCreateTeam} className="btn-lime" style={{ flex: 1, padding: '10px 0', fontSize: 14, borderRadius: 10 }}>Create</button>
                <button onClick={() => setShowNewTeam(false)} className="btn-ghost" style={{ flex: 1, padding: '10px 0', fontSize: 14, borderRadius: 10 }}>Cancel</button>
              </div>
            </div>
          )}

          {!activeTeam && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14 }}>
              Create or select a team above
            </div>
          )}

          {activeTeam && (
            <>
              <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, border: '1px solid var(--border-dim)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em' }}>BUDGET</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13, color: budget > BUDGET_MAX * 0.8 ? '#ff6060' : 'var(--lime)' }}>
                    £{budget.toFixed(1)}M / £{BUDGET_MAX}M
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (budget / BUDGET_MAX) * 100)}%`, background: budget > BUDGET_MAX * 0.8 ? '#ff6060' : 'var(--lime)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {editingTeamId === activeTeam.id ? (
                  <>
                    <input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { renameTeam(activeTeam.id, editingName); setEditingTeamId(null); } }}
                      style={{ flex: 1, background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 13, fontFamily: "'Barlow Condensed',sans-serif", outline: 'none' }}
                      autoFocus
                    />
                    <button onClick={() => { renameTeam(activeTeam.id, editingName); setEditingTeamId(null); }} className="btn-lime" style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8 }}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingTeamId(activeTeam.id); setEditingName(activeTeam.name); }} className="btn-ghost" style={{ flex: 1, padding: '8px 0', fontSize: 12, borderRadius: 8 }}>✏️ Rename</button>
                    <button onClick={() => { if (confirm('Delete this team?')) deleteTeam(activeTeam.id); }} style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8, background: 'none', border: '1px solid rgba(255,60,60,0.3)', color: '#ff6060', cursor: 'pointer', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>🗑️</button>
                  </>
                )}
              </div>

              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>
                PLAYERS ({Array.isArray(activeTeam.players) ? activeTeam.players.length : 0})
              </div>
              {(!activeTeam.players || activeTeam.players.length === 0) && (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--muted)', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }}>
                  Go to Library tab and tap "+ TEAM" to add players
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {Array.isArray(activeTeam.players) && activeTeam.players.map(card => (
                  <MiniCard
                    key={card._id}
                    card={card}
                    onRemove={() => removeFromTeam(activeTeam.id, card._id)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
