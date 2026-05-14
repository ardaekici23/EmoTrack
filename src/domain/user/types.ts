import { UserRole } from '../../shared/constants';

export type { UserRole };

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string | null;
  createdAt: Date;
}

export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  teamId?: string;
}

export interface SignInData {
  email: string;
  password: string;
}
