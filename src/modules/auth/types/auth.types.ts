import type { Role } from 'src/modules/users/schemas/user.schema';

export interface AuthUser {
  role: string;
  userId: string;
  username: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    role: string;
    userId: string;
    username: string;
  };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  user: {
    role: string;
    userId: string;
    username: string;
  };
}

export interface UserJwtPayload {
  role: Role;
  userId: string;
  username: string;
}
