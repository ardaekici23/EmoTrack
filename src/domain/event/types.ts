import { EmotionScores } from '../emotion/types';

export type EventStatus = 'scheduled' | 'active' | 'ended';

export interface TeamEvent {
  eventId: string;
  title: string;
  managerId: string;
  teamId: string;
  status: EventStatus;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  participantCount: number;
  hasJoined?: boolean;
}

export interface CreateEventData {
  title: string;
  teamId: string;
  scheduledAt?: Date;
}

export interface TimelineEntry {
  timestamp: string;
  emotion: string;
  confidence: number;
}

export interface EventParticipantResult {
  userId: string;
  name: string;
  logCount: number;
  dominantEmotion: string;
  avgConfidence: number;
  avgScores: EmotionScores;
  timeline: TimelineEntry[];
}

export interface EventResults {
  eventId: string;
  title: string;
  startedAt: Date | null;
  endedAt: Date | null;
  participants: EventParticipantResult[];
  overallAvgScores: EmotionScores;
  overallDominantEmotion: string;
}
