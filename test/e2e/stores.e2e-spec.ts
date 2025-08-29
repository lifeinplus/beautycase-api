import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CreateStoreDto } from 'src/modules/stores/dto/create-store.dto';
import { UpdateStoreDto } from 'src/modules/stores/dto/update-store.dto';
import { StoresModule } from 'src/modules/stores/stores.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';
import { ResourceHelper } from 'test/helpers/resource.helper';

describe('Stores (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let tokens: AuthTokens;
  let storeId: string;
  const mockStore = TestDataFactory.createStore();

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
        StoresModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    tokens = await AuthHelper.setupAuthTokens(app);
  });

  beforeEach(async () => {
    await DatabaseHelper.clearCollection(connection, 'stores');
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /stores', () => {
    it('should create a store as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(mockStore)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Store created successfully');
    });

    it('should reject creation by mua role', async () => {
      await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(mockStore)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation by client role', async () => {
      await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(mockStore)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/stores')
        .send(mockStore)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject invalid JWT token', async () => {
      await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', 'Bearer invalid-token')
        .send(mockStore)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /stores', () => {
    beforeEach(async () => {
      await ResourceHelper.createMultipleStores(app, tokens.adminToken, 3);
    });

    it('should allow admin to get all stores', async () => {
      const response = await request(app.getHttpServer())
        .get('/stores')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);

      response.body.forEach((store: CreateStoreDto) => {
        expect(store).toHaveProperty('name');
      });
    });

    it('should allow mua to get all stores', async () => {
      await request(app.getHttpServer())
        .get('/stores')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);
    });

    it('should reject regular clients', async () => {
      await request(app.getHttpServer())
        .get('/stores')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('PUT /stores/:id', () => {
    let updateDto: UpdateStoreDto;

    beforeEach(async () => {
      const { id } = await ResourceHelper.createStore(app, tokens.adminToken);

      storeId = id;

      updateDto = { name: 'Updated Store' };
    });

    it('should update a store as admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Store updated successfully');
    });

    it('should reject update by mua role', async () => {
      await request(app.getHttpServer())
        .put(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject update by client role', async () => {
      await request(app.getHttpServer())
        .put(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent store', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .put(`/stores/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/stores/${storeId}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail to update with invalid ObjectId', async () => {
      const invalidId = 'invalid-id';

      await request(app.getHttpServer())
        .put(`/stores/${invalidId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /stores/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createStore(app, tokens.adminToken);

      storeId = id;
    });

    it('should delete a store as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Store deleted successfully');

      await request(app.getHttpServer())
        .get(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should reject deletion by mua role', async () => {
      await request(app.getHttpServer())
        .delete(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject deletion by client role', async () => {
      await request(app.getHttpServer())
        .delete(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent store', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .delete(`/stores/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail to delete with invalid ObjectId', async () => {
      await request(app.getHttpServer())
        .delete(`/stores/invalid-id`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('JWT Token Edge Cases', () => {
    it('should reject malformed tokens', async () => {
      await request(app.getHttpServer())
        .get('/stores')
        .set('Authorization', 'Bearer not.a.jwt.token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/stores')
        .set('Authorization', 'InvalidHeaderFormat')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
