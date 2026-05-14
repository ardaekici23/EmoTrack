import React, { useEffect, useState, FormEvent } from 'react';
import { Team, TeamMember } from '../../domain/team/types';
import { createTeam, getMyTeams, updateTeam, getTeamMembers, removeMember } from '../../infrastructure/api/teams';

export function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      setLoading(true);
      setTeams(await getMyTeams());
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
      setSelectedTeamId(team.teamId);
      setMembers([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(teamId: string) {
    if (!editName.trim()) return;
    try {
      const updated = await updateTeam(teamId, { name: editName.trim() });
      setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, name: updated.name } : t));
      setEditingTeamId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to rename team');
    }
  }

  async function handleSelectTeam(teamId: string) {
    setSelectedTeamId(teamId);
    try {
      setMembersLoading(true);
      setMembers(await getTeamMembers(teamId));
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
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

  async function handleCopyCode(teamId: string) {
    await navigator.clipboard.writeText(teamId);
    setCopiedId(teamId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const selectedTeam = teams.find(t => t.teamId === selectedTeamId);

  return (
    <div className="team-management">
      {error && <div className="error-message">{error}</div>}

      <section className="create-team-section">
        <h3>Create New Team</h3>
        <form onSubmit={handleCreate} className="inline-form">
          <input
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="Team name"
            disabled={creating}
            className="inline-input"
          />
          <button type="submit" className="btn btn-primary" disabled={creating || !newTeamName.trim()}>
            {creating ? 'Creating...' : 'Create Team'}
          </button>
        </form>
      </section>

      <section className="teams-list-section">
        <h3>Your Teams {loading && <span className="loading-inline">Loading...</span>}</h3>
        {!loading && teams.length === 0 && (
          <p className="info-text">No teams yet. Create one above to get started.</p>
        )}
        <div className="teams-list">
          {teams.map(team => (
            <div key={team.teamId} className={`team-card ${selectedTeamId === team.teamId ? 'selected' : ''}`}>
              {editingTeamId === team.teamId ? (
                <div className="team-edit-row">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="inline-input"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(team.teamId); if (e.key === 'Escape') setEditingTeamId(null); }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleRename(team.teamId)}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingTeamId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="team-info-row">
                  <div className="team-info">
                    <span className="team-name">{team.name}</span>
                    <span className="team-member-count">{team.memberCount} members</span>
                  </div>
                  <div className="team-actions">
                    <button className="btn btn-filter btn-sm" onClick={() => handleSelectTeam(team.teamId)}>
                      Members
                    </button>
                    <button className="btn btn-filter btn-sm" onClick={() => { setEditingTeamId(team.teamId); setEditName(team.name); }}>
                      Rename
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {selectedTeamId && selectedTeam && (
        <section className="team-members-section">
          <h3>Members of "{selectedTeam.name}"</h3>
          <div className="team-code-display">
            <div>
              <span className="team-code-label">Team Code (share with employees):</span>
              <code className="team-code">{selectedTeamId}</code>
            </div>
            <button className="btn btn-filter btn-sm" onClick={() => handleCopyCode(selectedTeamId)}>
              {copiedId === selectedTeamId ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {membersLoading ? (
            <p className="info-text">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="info-text">No members yet. Share the team code above with your employees so they can sign up.</p>
          ) : (
            <div className="members-list">
              {members.map(member => (
                <div key={member.userId} className="member-row">
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-email">{member.email}</span>
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: '#ffebee', color: '#c62828', border: 'none' }}
                    onClick={() => handleRemoveMember(selectedTeamId, member.userId)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
