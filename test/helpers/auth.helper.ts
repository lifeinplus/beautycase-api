import { HttpStatus, INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

import { UsersService } from 'src/modules/users/users.service';
import { TestDataFactory, TestUser } from 'test/factories/test-data.factory';

export interface AuthTokens {
  adminToken: string;
  adminId: string;
  muaToken: string;
  muaId: string;
  clientToken: string;
  clientId: string;
}

export interface UserResources {
  id: string;
  data: TestUser;
}

export class AuthHelper {
  static async setupAuthTokens(app: INestApplication): Promise<AuthTokens> {
    const tokens: Partial<AuthTokens> = {};

    const adminUser = await this.createAdminUser(app);
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send(adminUser.data)
      .expect(HttpStatus.OK);
    tokens.adminToken = adminLogin.body.accessToken;
    tokens.adminId = adminLogin.body.userId;

    const muaUser = await this.createMuaUser(app);
    const muaLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send(muaUser.data)
      .expect(HttpStatus.OK);
    tokens.muaToken = muaLogin.body.accessToken;
    tokens.muaId = muaLogin.body.userId;

    const clientUser = await this.createClientUser(app);
    const clientLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send(clientUser.data)
      .expect(HttpStatus.OK);
    tokens.clientToken = clientLogin.body.accessToken;
    tokens.clientId = clientLogin.body.userId;

    return tokens as AuthTokens;
  }

  static async createAdminUser(app: INestApplication): Promise<UserResources> {
    const usersService = app.get<UsersService>(UsersService);
    const adminUser = TestDataFactory.createAdminUser();

    const { id } = await usersService.create({
      ...adminUser,
      password: await bcrypt.hash(adminUser.password, 10),
    });

    return { id, data: adminUser };
  }

  static async createClientUser(app: INestApplication): Promise<UserResources> {
    const usersService = app.get<UsersService>(UsersService);
    const clientUser = TestDataFactory.createClientUser();

    const { id } = await usersService.create({
      ...clientUser,
      password: await bcrypt.hash(clientUser.password, 10),
    });

    return { id, data: clientUser };
  }

  static async createMultipleClientUsers(
    app: INestApplication,
    count: number,
  ): Promise<UserResources[]> {
    const usersService = app.get<UsersService>(UsersService);

    const clientUsers: UserResources[] = [];
    const clientUsersData = TestDataFactory.createMultipleClientUsers(count);

    for (const data of clientUsersData) {
      const { id } = await usersService.create({
        ...data,
        password: await bcrypt.hash(data.password, 10),
      });

      clientUsers.push({ id, data });
    }

    return clientUsers;
  }

  static async createMuaUser(app: INestApplication): Promise<UserResources> {
    const usersService = app.get<UsersService>(UsersService);
    const muaUser = TestDataFactory.createMuaUser();

    const { id } = await usersService.create({
      ...muaUser,
      password: await bcrypt.hash(muaUser.password, 10),
    });

    return { id, data: muaUser };
  }
}
