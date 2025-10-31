import { Role } from '../enums/role.enum';

export interface UserRequest {
  user?: {
    role?: Role;
    userId?: string;
  };
  params: {
    id: string;
  };
}
