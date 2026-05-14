export interface Team {
  teamId: string;
  name: string;
  managerId: string;
  memberCount: number;
  createdAt: Date;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface CreateTeamData {
  name: string;
}

export interface UpdateTeamData {
  name: string;
}
