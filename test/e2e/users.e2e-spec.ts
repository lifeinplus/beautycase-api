import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';
import { makeObjectId } from 'test/helpers/make-object-id.helper';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let tokens: AuthTokens;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          envFilePath: '.env.test.local',
        }),
        TestDatabaseModule,
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    tokens = await AuthHelper.setupAuthTokens(app);
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('GET /users', () => {
    it('should allow admin to get all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);

      response.body.forEach((user: CreateUserDto) => {
        expect(user).toHaveProperty('username');
      });
    });

    it('should reject regular clients', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by id for any authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${tokens.clientId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.user).toMatchObject({
        _id: tokens.clientId,
      });
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = makeObjectId();

      await request(app.getHttpServer())
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get(`/users/${tokens.clientId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
