import React, { useEffect, useState } from 'react';
import { TeamEvent, EventResults as EventResultsType } from '../../domain/event/types';
import { getActiveEvents, getScheduledEvents, joinEvent, leaveEvent } from '../../infrastructure/api/events';
import { EventDetector } from './EventDetector';
import { EventResults } from '../shared/EventResults';

export function EventsTab() {
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedEventId, setJoinedEventId] = useState<string | null>(null);
  const [results, setResults] = useState<EventResultsType | null>(null);

  useEffect(() => {
    fetchActive();
    const id = setInterval(fetchActive, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (joinedEventId && !events.find(e => e.eventId === joinedEventId)) {
      setJoinedEventId(null);
    }
  }, [events, joinedEventId]);

  async function fetchActive() {
    try {
      const [active, scheduled] = await Promise.allSettled([
        getActiveEvents(),
        getScheduledEvents(),
      ]);
      const activeList = active.status === 'fulfilled' ? active.value : [];
      const scheduledList = scheduled.status === 'fulfilled' ? scheduled.value : [];
      setEvents([...activeList, ...scheduledList]);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(eventId: string) {
    try {
      await joinEvent(eventId);
      setEvents(prev => prev.map(e => e.eventId === eventId ? { ...e, hasJoined: true, participantCount: e.participantCount + 1 } : e));
      setJoinedEventId(eventId);
      setResults(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    }
  }

  async function handleLeave(eventId: string) {
    try {
      await leaveEvent(eventId);
      setEvents(prev => prev.map(e => e.eventId === eventId ? { ...e, hasJoined: false, participantCount: Math.max(0, e.participantCount - 1) } : e));
      setJoinedEventId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to leave event');
    }
  }

  const live = events.filter(e => e.status === 'active');
  const upcoming = events.filter(e => e.status === 'scheduled');
  const past = events.filter(e => e.status === 'ended');

  function EventCard({ e }: { e: TeamEvent }) {
    const date = new Date(e.scheduledAt || e.startedAt || Date.now());
    return (
      <div className="event">
        <div className="event-date">
          <div className="d">{date.getDate()}</div>
          <div className="m">{date.toLocaleString('en-GB', { month: 'short' })}</div>
        </div>
        <div className="event-body">
          <div className="event-title">{e.title}</div>
          <div className="event-meta-row">
            {e.participantCount} participants · {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            {e.hasJoined && <span style={{ color: 'var(--positive)', fontWeight: 500, marginLeft: 8 }}>· Joined</span>}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className={`status-pill ${e.status}`}>{e.status}</span>
          {e.status === 'active' && !e.hasJoined && (
            <button className="btn btn-primary btn-sm" onClick={() => handleJoin(e.eventId)}>Join session</button>
          )}
          {e.status === 'active' && e.hasJoined && (
            <button className="btn btn-ghost btn-sm" onClick={() => handleLeave(e.eventId)}>Leave</button>
          )}
          {e.status === 'scheduled' && (
            <button className="btn btn-ghost btn-sm">Add to calendar</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="stack stack-6">
      <div className="row-between">
        <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>
          {loading ? 'Refreshing…' : `${events.length} event${events.length !== 1 ? 's' : ''} for your team`}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchActive} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {live.length > 0 && (
        <div>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="section-title">Live now</div>
            <span className="tab-count">{live.length}</span>
          </div>
          <div className="evlist">{live.map(e => <EventCard key={e.eventId} e={e} />)}</div>
        </div>
      )}

      {joinedEventId && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="section-title">Emotion tracking — event active</div>
              <div className="section-sub">Your emotions are being recorded. Leave the event when it ends.</div>
            </div>
          </div>
          <div className="card-body">
            <EventDetector eventId={joinedEventId} />
          </div>
        </div>
      )}

      <div>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <div className="section-title">Upcoming events</div>
          <span className="tab-count">{upcoming.length}</span>
        </div>
        {loading ? (
          <div className="loading-state"><div className="spinner" />Loading events…</div>
        ) : upcoming.length === 0 ? (
          <div className="card-inset muted">No upcoming events scheduled for your team.</div>
        ) : (
          <div className="evlist">{upcoming.map(e => <EventCard key={e.eventId} e={e} />)}</div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="section-title">Past events</div>
            <span className="tab-count">{past.length}</span>
          </div>
          <div className="evlist">{past.map(e => <EventCard key={e.eventId} e={e} />)}</div>
        </div>
      )}

      {results && (
        <div className="modal-veil" onClick={() => setResults(null)}>
          <div className="modal" style={{ maxWidth: 920, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><div className="modal-title">Event Results</div></div>
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
