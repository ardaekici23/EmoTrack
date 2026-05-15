import React, { useEffect, useState, FormEvent } from 'react';
import { Team } from '../../domain/team/types';
import { TeamEvent, EventResults as EventResultsType } from '../../domain/event/types';
import { getMyTeams } from '../../infrastructure/api/teams';
import { createEvent, getMyEvents, startEvent, endEvent, getEventResults } from '../../infrastructure/api/events';
import { EventResults } from '../shared/EventResults';

export function EventManagement() {
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [teamId, setTeamId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState<EventResultsType | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [evts, tms] = await Promise.all([getMyEvents(), getMyTeams()]);
        setEvents(evts);
        setTeams(tms);
        if (tms.length > 0 && !teamId) setTeamId(tms[0].teamId);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !teamId) return;
    try {
      setCreating(true);
      const event = await createEvent({ title: title.trim(), teamId, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined });
      setEvents(prev => [event, ...prev]);
      setTitle('');
      setScheduledAt('');
      setShowCreate(false);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setCreating(false);
    }
  }

  async function handleStart(eventId: string) {
    try {
      const updated = await startEvent(eventId);
      setEvents(prev => prev.map(e => e.eventId === eventId ? { ...e, ...updated } : e));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start event');
    }
  }

  async function handleEnd(eventId: string) {
    try {
      const updated = await endEvent(eventId);
      setEvents(prev => prev.map(e => e.eventId === eventId ? { ...e, ...updated } : e));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to end event');
    }
  }

  async function handleViewResults(eventId: string) {
    try {
      setResultsLoading(true);
      setResults(await getEventResults(eventId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setResultsLoading(false);
    }
  }

  const live = events.filter(e => e.status === 'active');
  const upcoming = events.filter(e => e.status === 'scheduled');
  const past = events.filter(e => e.status === 'ended');

  function EventRow({ e }: { e: TeamEvent }) {
    const date = new Date(e.scheduledAt || e.startedAt || Date.now());
    const team = teams.find(t => t.teamId === e.teamId);
    return (
      <div className="event">
        <div className="event-date">
          <div className="d">{date.getDate()}</div>
          <div className="m">{date.toLocaleString('en-GB', { month: 'short' })}</div>
        </div>
        <div className="event-body">
          <div className="event-title">{e.title}</div>
          <div className="event-meta-row">
            {team?.name} · {e.participantCount} participants · {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            {e.status === 'ended' && e.endedAt && ` — ${new Date(e.endedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className={`status-pill ${e.status}`}>{e.status}</span>
          {e.status === 'scheduled' && <button className="btn btn-primary btn-sm" onClick={() => handleStart(e.eventId)}>Start</button>}
          {e.status === 'active' && <button className="btn btn-ghost btn-sm" onClick={() => handleEnd(e.eventId)}>End</button>}
          {e.status === 'ended' && <button className="btn btn-ghost btn-sm" onClick={() => handleViewResults(e.eventId)}>View results →</button>}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-state"><div className="spinner" />Loading events…</div>;
  }

  return (
    <div className="stack stack-6">
      {error && <div className="error-banner">{error}</div>}

      <div className="row-between">
        <div>
          <div className="section-title">Sessions</div>
          <div className="section-sub">Schedule emotion-tracked sessions for meetings, retrospectives, or workshops</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create event</button>
      </div>

      {live.length > 0 && (
        <div>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ fontSize: 14 }}>Live now</div>
            <span className="tab-count">{live.length}</span>
          </div>
          <div className="evlist">{live.map(e => <EventRow key={e.eventId} e={e} />)}</div>
        </div>
      )}

      <div>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <div className="section-title" style={{ fontSize: 14 }}>Upcoming</div>
          <span className="tab-count">{upcoming.length}</span>
        </div>
        {upcoming.length === 0 ? (
          <div className="card-inset muted">Nothing scheduled.</div>
        ) : (
          <div className="evlist">{upcoming.map(e => <EventRow key={e.eventId} e={e} />)}</div>
        )}
      </div>

      <div>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <div className="section-title" style={{ fontSize: 14 }}>Past</div>
          <span className="tab-count">{past.length}</span>
        </div>
        {past.length === 0 ? (
          <div className="card-inset muted">No past events.</div>
        ) : (
          <div className="evlist">{past.map(e => <EventRow key={e.eventId} e={e} />)}</div>
        )}
      </div>

      {showCreate && (
        <div className="modal-veil" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-title">Schedule a new event</div>
                <div className="modal-sub">Emotion data is recorded only while the event is active.</div>
              </div>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="field">
                  <label>Event title</label>
                  <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly standup" autoFocus required />
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <div className="field grow">
                    <label>Team</label>
                    <select className="select" value={teamId} onChange={e => setTeamId(e.target.value)}>
                      {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="field grow">
                    <label>Scheduled time <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span></label>
                    <input className="input" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={creating || !title.trim()}>
                  {creating ? 'Creating…' : 'Create event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resultsLoading && <div className="loading-state"><div className="spinner" />Loading results…</div>}

      {results && !resultsLoading && (
        <div className="modal-veil" onClick={() => setResults(null)}>
          <div className="modal" style={{ maxWidth: 920, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-title">{results.title} · results</div>
                <div className="modal-sub">{results.participants.length} participants</div>
              </div>
              <button className="modal-close" onClick={() => setResults(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ overflow: 'auto', maxHeight: 'calc(90vh - 130px)' }}>
              <EventResults results={results} />
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => setResults(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
