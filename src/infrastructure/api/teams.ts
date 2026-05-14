import { apiFetch } from './client';
import { Team, TeamMember, CreateTeamData, UpdateTeamData } from '../../domain/team/types';

export async function createTeam(data: CreateTeamData): Promise<Team> {
  return apiFetch<Team>('/teams', { method: 'POST', body: JSON.stringify(data) });
}

export async function getMyTeams(): Promise<Team[]> {
  return apiFetch<Team[]>('/teams');
}

export async function getTeam(teamId: string): Promise<Team> {
  return apiFetch<Team>(`/teams/${teamId}`);
}

export async function updateTeam(teamId: string, data: UpdateTeamData): Promise<Team> {
  return apiFetch<Team>(`/teams/${teamId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  return apiFetch<TeamMember[]>(`/teams/${teamId}/members`);
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  await apiFetch(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
}
