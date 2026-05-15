import React, { useEffect, useState, FormEvent } from 'react';
import { Team, TeamMember } from '../../domain/team/types';
import { createTeam, getMyTeams, updateTeam, getTeamMembers, removeMember } from '../../infrastructure/api/teams';
import { Avatar, getInitials } from '../shared/SharedComponents';

export function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTeams(); }, []);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      handleSelectTeam(teams[0].teamId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);

  async function loadTeams() {
    try {
      setLoading(true);
      const t = await getMyTeams();
      setTeams(t);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      setCreating(true);
      const team = await createTeam({ name: newTeamName.trim() });
      setTeams(prev => [team, ...prev]);
      setNewTeamName('');
      setShowCreate(false);
      handleSelectTeam(team.teamId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setCreating(false);
    }
  }

  async function handleSelectTeam(teamId: string) {
    setSelectedTeamId(teamId);
    const team = teams.find(t => t.teamId === teamId);
    if (team) setEditName(team.name);
    try {
      setMembersLoading(true);
      setMembers(await getTeamMembers(teamId));
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleSaveName() {
    if (!selectedTeamId || !editName.trim()) return;
    try {
      setSaving(true);
      const updated = await updateTeam(selectedTeamId, { name: editName.trim() });
      setTeams(prev => prev.map(t => t.teamId === selectedTeamId ? { ...t, name: updated.name } : t));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(teamId: string, userId: string) {
    try {
      await removeMember(teamId, userId);
      setMembers(prev => prev.filter(m => m.userId !== userId));
      setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, memberCount: t.memberCount - 1 } : t));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }

  async function handleCopyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const selectedTeam = teams.find(t => t.teamId === selectedTeamId);

  if (loading) {
    return <div className="loading-state"><div className="spinner" />Loading teams…</div>;
  }

  return (
    <div className="stack stack-4">
      {error && <div className="error-banner">{error}</div>}

      <div className="row-between">
        <div className="row" style={{ gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-mute)' }}>Teams</span>
          {teams.map(t => (
            <button
              key={t.teamId}
              className={`chip${selectedTeamId === t.teamId ? ' on' : ''}`}
              onClick={() => handleSelectTeam(t.teamId)}
            >
              {t.name}
            </button>
          ))}
          {teams.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-mute)' }}>No teams yet</span>}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ New team</button>
      </div>

      {selectedTeam && (
        <div className="twocol-3-2">
          {/* Members card */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="section-title">{selectedTeam.name}</div>
                <div className="section-sub">
                  {members.length} members · created {new Date(selectedTeam.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="card-body">
              {membersLoading ? (
                <div className="loading-state"><div className="spinner" />Loading members…</div>
              ) : members.length === 0 ? (
                <div style={{ color: 'var(--text-mute)', fontSize: 13 }}>No members yet. Share the team code to onboard employees.</div>
              ) : (
                <div className="team-roster">
                  {members.map(m => (
                    <div key={m.userId} className="member">
                      <Avatar initials={getInitials(m.name)} size={32} />
                      <div>
                        <div className="member-name">{m.name}</div>
                        <div className="member-meta">{m.email}</div>
                      </div>
                      <div />
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(selectedTeam.teamId, m.userId)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="stack stack-4">
            {/* Invite code */}
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="section-title">Invite code</div>
                  <div className="section-sub">Share with employees to onboard them</div>
                </div>
              </div>
              <div className="card-body">
                <div className="code-display">
                  <span>{selectedTeam.teamId}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleCopyCode(selectedTeam.teamId)}>
                    {copiedId === selectedTeam.teamId ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-mute)', marginTop: 12, lineHeight: 1.55 }}>
                  Employees enter this code when signing up or from their dashboard.
                </p>
              </div>
            </div>

            {/* Settings */}
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="section-title">Team settings</div>
                  <div className="section-sub">Update name or remove team</div>
                </div>
              </div>
              <div className="card-body">
                <div className="field">
                  <label>Team name</label>
                  <input className="input" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="row" style={{ marginTop: 16, gap: 8 }}>
                  <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSaveName}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button className="btn btn-danger btn-sm">Delete team</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedTeam && !loading && (
        <div className="card-inset muted" style={{ textAlign: 'center', padding: 32 }}>
          Create a team above to get started.
        </div>
      )}

      {showCreate && (
        <div className="modal-veil" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-title">Create a new team</div>
                <div className="modal-sub">Teams group employees so analytics stay scoped and private.</div>
              </div>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="field">
                  <label>Team name</label>
                  <input className="input" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Mobile Engineering" autoFocus required />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={creating || !newTeamName.trim()}>
                  {creating ? 'Creating…' : 'Create team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
