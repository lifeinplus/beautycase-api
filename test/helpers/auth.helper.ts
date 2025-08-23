import { HttpStatus, INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

import { UsersService } from 'src/modules/users/users.service';
import { TestDataFactory } from 'test/factories/test-data.factory';

export interface AuthTokens {
  adminToken: string;
  muaToken: string;
  clientToken: string;
  clientId: string;
}

export class AuthHelper {
  static async setupAuthTokens(app: INestApplication): Promise<AuthTokens> {
    const tokens: Partial<AuthTokens> = {};

    const usersService = app.get<UsersService>(UsersService);

    const adminUser = TestDataFactory.createAdminUser();
    await usersService.create({
      ...adminUser,
      password: await bcrypt.hash(adminUser.password, 10),
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send(adminUser)
      .expect(HttpStatus.OK);
    tokens.adminToken = adminLogin.body.accessToken;

    const muaUser = TestDataFactory.createMuaUser();
    await usersService.create({
      ...muaUser,
      password: await bcrypt.hash(muaUser.password, 10),
    });

    const muaLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send(muaUser)
      .expect(HttpStatus.OK);
    tokens.muaToken = muaLogin.body.accessToken;

    const clientUser = TestDataFactory.createClientUser();
    await usersService.create({
      ...clientUser,
      password: await bcrypt.hash(clientUser.password, 10),
    });

    const clientLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send(clientUser)
      .expect(HttpStatus.OK);
    tokens.clientToken = clientLogin.body.accessToken;
    tokens.clientId = clientLogin.body.userId;

    return tokens as AuthTokens;
  }
}
