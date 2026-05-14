import { apiFetch } from './client';
import { EmotionLog, EmotionScores } from '../../domain/emotion/types';

export async function logEmotion(
  _userId: string,
  dominantEmotion: string,
  confidenceScore: number,
  allScores: EmotionScores,
  eventId?: string
): Promise<string> {
  const { logId } = await apiFetch<{ logId: string }>('/emotions', {
    method: 'POST',
    body: JSON.stringify({ dominantEmotion, confidenceScore, allScores, ...(eventId ? { eventId } : {}) }),
  });
  return logId;
}

export async function getUserEmotionHistory(
  _userId: string,
  startDate?: Date,
  endDate?: Date,
  limit = 100
): Promise<EmotionLog[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (startDate) params.set('startDate', startDate.toISOString());
  if (endDate)   params.set('endDate', endDate.toISOString());
  return apiFetch<EmotionLog[]>(`/emotions/history?${params}`);
}

export async function getTeamEmotionLogs(
  _teamId: string,
  startDate?: Date,
  endDate?: Date,
  teamId?: string
): Promise<EmotionLog[]> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate.toISOString());
  if (endDate)   params.set('endDate', endDate.toISOString());
  if (teamId)    params.set('teamId', teamId);
  return apiFetch<EmotionLog[]>(`/emotions/team?${params}`);
}

export interface TeamAlertStatus {
  teamId: string;
  teamName: string;
  negativePct: number;
  sampleCount: number;
  alerting: boolean;
}

export interface AlertResponse {
  alerts: TeamAlertStatus[];
  anyAlerting: boolean;
  threshold: number;
  hours: number;
}

export async function getTeamAlerts(hours = 2, threshold = 50, teamId?: string): Promise<AlertResponse> {
  const params = new URLSearchParams({ hours: String(hours), threshold: String(threshold) });
  if (teamId) params.set('teamId', teamId);
  return apiFetch<AlertResponse>(`/emotions/team/alert?${params}`);
}

export function getEmotionStatistics(logs: EmotionLog[]): Record<string, number> {
  return logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.dominantEmotion] = (acc[log.dominantEmotion] || 0) + 1;
    return acc;
  }, {});
}

export function getMostCommonEmotion(logs: EmotionLog[]): string | null {
  if (logs.length === 0) return null;
  const entries = Object.entries(getEmotionStatistics(logs));
  return entries.length ? entries.reduce((max, e) => e[1] > max[1] ? e : max)[0] : null;
}
