import React, { useEffect, useState } from 'react';
import { TeamEvent, EventResults as EventResultsType } from '../../domain/event/types';
import { getActiveEvents, joinEvent, leaveEvent, getEventResults } from '../../infrastructure/api/events';
import { EventDetector } from './EventDetector';
import { EventResults } from '../shared/EventResults';

export function EventsTab() {
  const [activeEvents, setActiveEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedEventId, setJoinedEventId] = useState<string | null>(null);
  const [results, setResults] = useState<EventResultsType | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 30000);
    return () => clearInterval(interval);
  }, []);

  // If the event we're in disappears from active list, auto-leave
  useEffect(() => {
    if (joinedEventId && !activeEvents.find(e => e.eventId === joinedEventId)) {
      setJoinedEventId(null);
    }
  }, [activeEvents, joinedEventId]);

  async function fetchActive() {
    try {
      setActiveEvents(await getActiveEvents());
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
      setActiveEvents(prev =>
        prev.map(e => e.eventId === eventId ? { ...e, hasJoined: true, participantCount: e.participantCount + 1 } : e)
      );
      setJoinedEventId(eventId);
      setResults(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    }
  }

  async function handleLeave(eventId: string) {
    try {
      await leaveEvent(eventId);
      setActiveEvents(prev =>
        prev.map(e => e.eventId === eventId ? { ...e, hasJoined: false, participantCount: Math.max(0, e.participantCount - 1) } : e)
      );
      setJoinedEventId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to leave event');
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

  return (
    <div className="events-tab">
      {error && <div className="error-message">{error}</div>}

      <section className="active-events-section">
        <div className="section-header">
          <h3>Active Events for Your Team</h3>
          <button className="btn btn-filter btn-sm" onClick={fetchActive}>Refresh</button>
        </div>

        {loading && <p className="info-text">Loading events...</p>}

        {!loading && activeEvents.length === 0 && (
          <div className="empty-state">
            <p>No active events right now.</p>
            <p className="info-text">When your manager starts an event, it will appear here.</p>
          </div>
        )}

        <div className="events-list">
          {activeEvents.map(event => (
            <div key={event.eventId} className={`event-card ${event.hasJoined ? 'joined' : ''}`}>
              <div className="event-card-header">
                <div className="event-title-row">
                  <h4 className="event-title">{event.title}</h4>
                  <span className="badge badge-active">Live</span>
                  {event.hasJoined && <span className="badge badge-joined">Joined</span>}
                </div>
                <span className="info-text">{event.participantCount} participants</span>
              </div>
              <div className="event-card-actions">
                {event.hasJoined ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleLeave(event.eventId)}>
                    Leave Event
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => handleJoin(event.eventId)}>
                    Join & Track Emotions
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {joinedEventId && (
        <section className="event-detection-section">
          <h3>Emotion Tracking — Event Active</h3>
          <p className="info-text">Your emotions are being recorded for this event. Leave the event when it ends.</p>
          <EventDetector eventId={joinedEventId} />
        </section>
      )}

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
