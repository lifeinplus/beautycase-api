import { Role } from 'src/common/enums/role.enum';

declare global {
  namespace Express {
    interface User {
      id: string;
      role: Role;
    }

    interface Request {
      user: User;
    }
  }
}

export {};
