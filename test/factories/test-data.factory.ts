import { Role } from 'src/modules/users/schemas/user.schema';

export interface TestUser {
  username: string;
  password: string;
  role: Role;
}

export class TestDataFactory {
  static createAdminUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      ...overrides,
    };
  }

  static createMuaUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      username: 'mua',
      password: 'mua123',
      role: 'mua',
      ...overrides,
    };
  }

  static createClientUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      username: 'client',
      password: 'client123',
      role: 'client',
      ...overrides,
    };
  }
}
