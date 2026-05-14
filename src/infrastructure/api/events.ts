import { apiFetch } from './client';
import { TeamEvent, CreateEventData, EventResults } from '../../domain/event/types';

export async function createEvent(data: CreateEventData): Promise<TeamEvent> {
  return apiFetch<TeamEvent>('/events', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      teamId: data.teamId,
      scheduledAt: data.scheduledAt?.toISOString(),
    }),
  });
}

export async function getMyEvents(): Promise<TeamEvent[]> {
  return apiFetch<TeamEvent[]>('/events');
}

export async function getActiveEvents(): Promise<TeamEvent[]> {
  return apiFetch<TeamEvent[]>('/events/active');
}

export async function startEvent(eventId: string): Promise<TeamEvent> {
  return apiFetch<TeamEvent>(`/events/${eventId}/start`, { method: 'PATCH' });
}

export async function endEvent(eventId: string): Promise<TeamEvent> {
  return apiFetch<TeamEvent>(`/events/${eventId}/end`, { method: 'PATCH' });
}

export async function joinEvent(eventId: string): Promise<void> {
  await apiFetch(`/events/${eventId}/join`, { method: 'POST' });
}

export async function leaveEvent(eventId: string): Promise<void> {
  await apiFetch(`/events/${eventId}/leave`, { method: 'DELETE' });
}

export async function getEventResults(eventId: string): Promise<EventResults> {
  return apiFetch<EventResults>(`/events/${eventId}/results`);
}
