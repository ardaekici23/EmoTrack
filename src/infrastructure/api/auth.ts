import { apiFetch } from './client';
import { User, SignUpData, SignInData } from '../../domain/user/types';

interface AuthResponse {
  token: string;
  user: User;
}

export async function signUp(data: SignUpData): Promise<User> {
  const { token, user } = await apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  localStorage.setItem('emotrack_token', token);
  return user;
}

export async function signIn(data: SignInData): Promise<User> {
  const { token, user } = await apiFetch<AuthResponse>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  localStorage.setItem('emotrack_token', token);
  return user;
}

export async function signOut(): Promise<void> {
  localStorage.removeItem('emotrack_token');
}

export async function getCurrentUser(): Promise<User | null> {
  if (!localStorage.getItem('emotrack_token')) return null;
  try {
    return await apiFetch<User>('/auth/me');
  } catch {
    localStorage.removeItem('emotrack_token');
    return null;
  }
}

export async function joinTeam(teamId: string): Promise<User> {
  return apiFetch<User>('/auth/team', {
    method: 'PATCH',
    body: JSON.stringify({ teamId }),
  });
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('emotrack_token');
}
