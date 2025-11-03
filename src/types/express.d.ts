import { Types } from 'mongoose';

import { Role } from 'src/common/enums/role.enum';

declare global {
  namespace Express {
    interface User {
      id: Types.ObjectId;
      role: Role;
    }

    interface Request {
      user: User;
    }
  }
}

export {};
