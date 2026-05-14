import React, { useEffect, useState, FormEvent } from 'react';
import { Team } from '../../domain/team/types';
import { TeamEvent, EventResults as EventResultsType } from '../../domain/event/types';
import { getMyTeams } from '../../infrastructure/api/teams';
import { createEvent, getMyEvents, startEvent, endEvent, getEventResults } from '../../infrastructure/api/events';
import { EventResults } from '../shared/EventResults';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  active: 'Active',
  ended: 'Ended',
};

export function EventManagement() {
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !teamId) return;
    try {
      setCreating(true);
      const event = await createEvent({
        title: title.trim(),
        teamId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      });
      setEvents(prev => [event, ...prev]);
      setTitle('');
      setScheduledAt('');
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

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner" /><p>Loading events...</p></div>;
  }

  return (
    <div className="event-management">
      {error && <div className="error-message">{error}</div>}

      <section className="create-event-section">
        <h3>Create New Event</h3>
        {teams.length === 0 ? (
          <p className="info-text">Create a team first before scheduling events.</p>
        ) : (
          <form onSubmit={handleCreate} className="create-event-form">
            <div className="form-row">
              <div className="form-group">
                <label>Event Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Weekly standup"
                  disabled={creating}
                  required
                />
              </div>
              <div className="form-group">
                <label>Team</label>
                <select value={teamId} onChange={e => setTeamId(e.target.value)} disabled={creating}>
                  {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Scheduled Time (optional)</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  disabled={creating}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating || !title.trim()}>
              {creating ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        )}
      </section>

      <section className="events-list-section">
        <h3>Your Events</h3>
        {events.length === 0 ? (
          <p className="info-text">No events yet. Create one above.</p>
        ) : (
          <div className="events-list">
            {events.map(event => (
              <div key={event.eventId} className="event-card">
                <div className="event-card-header">
                  <div className="event-title-row">
                    <h4 className="event-title">{event.title}</h4>
                    <span className={`badge badge-${event.status}`}>{STATUS_LABELS[event.status]}</span>
                  </div>
                  <div className="event-meta-row">
                    <span>{event.participantCount} participants</span>
                    {event.scheduledAt && (
                      <span>Scheduled: {new Date(event.scheduledAt).toLocaleString()}</span>
                    )}
                    {event.startedAt && (
                      <span>Started: {new Date(event.startedAt).toLocaleTimeString()}</span>
                    )}
                    {event.endedAt && (
                      <span>Ended: {new Date(event.endedAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
                <div className="event-card-actions">
                  {event.status === 'scheduled' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleStart(event.eventId)}>
                      Start Event
                    </button>
                  )}
                  {event.status === 'active' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEnd(event.eventId)}>
                      End Event
                    </button>
                  )}
                  {event.status === 'ended' && (
                    <button className="btn btn-filter btn-sm" onClick={() => handleViewResults(event.eventId)}>
                      View Results
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {resultsLoading && (
        <div className="loading-container"><div className="loading-spinner" /><p>Loading results...</p></div>
      )}
      {results && !resultsLoading && (
        <section className="results-section">
          <div className="results-header">
            <h3>Event Results</h3>
            <button className="btn btn-filter btn-sm" onClick={() => setResults(null)}>Close</button>
          </div>
          <EventResults results={results} />
        </section>
      )}
    </div>
  );
}
