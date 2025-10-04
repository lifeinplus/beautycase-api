import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BrandsModule } from 'src/modules/brands/brands.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { UpdateMakeupBagDto } from 'src/modules/makeup-bags/dto/update-makeup-bag.dto';
import { MakeupBagsModule } from 'src/modules/makeup-bags/makeup-bags.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { StagesModule } from 'src/modules/stages/stages.module';
import { ToolsModule } from 'src/modules/tools/tools.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';
import {
  ResourceHelper,
  TestMakeupBagResources,
} from 'test/helpers/resource.helper';

describe('MakeupBags (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let tokens: AuthTokens;
  let resources: TestMakeupBagResources;
  let makeupBagId: string;

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
        BrandsModule,
        CategoriesModule,
        MakeupBagsModule,
        ProductsModule,
        StagesModule,
        ToolsModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    tokens = await AuthHelper.setupAuthTokens(app);

    resources = await ResourceHelper.setupMakeupBagResources(
      app,
      tokens.adminToken,
    );
  });

  beforeEach(async () => {
    await DatabaseHelper.clearCollection(connection, 'makeupbags');
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /makeup-bags', () => {
    const createMakeupBagDto = () =>
      TestDataFactory.createMakeupBag(
        resources.categoryId,
        tokens.clientId,
        [resources.stageId],
        [resources.toolId],
      );

    it('should create a makeup-bag as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(createMakeupBagDto())
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
    });

    it('should create a makeup-bag as mua', async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(createMakeupBagDto())
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
    });

    it('should reject creation by client role', async () => {
      await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(createMakeupBagDto())
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/makeup-bags')
        .send(createMakeupBagDto())
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate MongoDB ObjectId format', async () => {
      const invalidDto = { ...createMakeupBagDto(), categoryId: 'invalid-id' };

      await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate array fields', async () => {
      const invalidDto = { ...createMakeupBagDto(), stageIds: 'not-an-array' };

      await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /makeup-bags', () => {
    beforeEach(async () => {
      await ResourceHelper.createMakeupBag(
        app,
        tokens.adminToken,
        resources.categoryId,
        tokens.clientId,
        [resources.stageId],
        [resources.toolId],
      );
    });

    it('should get all makeup bags as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0]).toHaveProperty('client');
      expect(response.body[0]).toHaveProperty('stages');
    });

    it('should get all makeup bags as MUA', async () => {
      const response = await request(app.getHttpServer())
        .get('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should not allow client to get all makeup bags', async () => {
      await request(app.getHttpServer())
        .get('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/makeup-bags')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /makeup-bags/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createMakeupBag(
        app,
        tokens.adminToken,
        resources.categoryId,
        tokens.clientId,
        [resources.stageId],
        [resources.toolId],
      );

      makeupBagId = id;
    });

    it('should return makeup-bag details for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('_id', makeupBagId);
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('client');
      expect(response.body).toHaveProperty('stages');
      expect(response.body).toHaveProperty('tools');
    });

    it('should return makeup-bag details for mua', async () => {
      const response = await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('_id', makeupBagId);
    });

    it('should allow client access to assigned makeup-bag', async () => {
      const response = await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('_id', makeupBagId);
    });

    it('should return 404 for non-existent makeup-bag', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .get(`/makeup-bags/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .get('/makeup-bags/invalid-id')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /makeup-bags/:id', () => {
    let updateDto: UpdateMakeupBagDto;

    beforeEach(async () => {
      const { id } = await ResourceHelper.createMakeupBag(
        app,
        tokens.adminToken,
        resources.categoryId,
        tokens.clientId,
        [resources.stageId],
        [resources.toolId],
      );

      makeupBagId = id;

      updateDto = {
        stageIds: [resources.stageId],
        toolIds: [],
      };
    });

    it('should update makeup-bag as admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', makeupBagId);
    });

    it('should update makeup-bag as mua', async () => {
      const response = await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', makeupBagId);
    });

    it('should reject update by client role', async () => {
      await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent makeup-bag', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .put(`/makeup-bags/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ title: 'Updated Title' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should allow partial updates', async () => {
      const response = await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ toolIds: [] })
        .expect(HttpStatus.OK);
    });

    it('should validate MongoDB ObjectId format in URL', async () => {
      await request(app.getHttpServer())
        .put('/makeup-bags/invalid-id')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate update data', async () => {
      await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({
          categoryId: 'invalid-id',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /makeup-bags/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createMakeupBag(
        app,
        tokens.adminToken,
        resources.categoryId,
        tokens.clientId,
        [resources.stageId],
        [resources.toolId],
      );

      makeupBagId = id;
    });

    it('should delete makeup-bag as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', makeupBagId);

      await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete makeup-bag as mua', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', makeupBagId);
    });

    it('should reject deletion by client role', async () => {
      await request(app.getHttpServer())
        .delete(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent makeup-bag', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .delete(`/makeup-bags/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .delete('/makeup-bags/invalid-id')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/makeup-bags/${makeupBagId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Access Control Edge Cases', () => {
    it('should handle MakeupBagAccessGuard when makeup bag does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .get(`/makeup-bags/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle MakeupBagAccessGuard when user ID is missing', async () => {
      const { id } = await ResourceHelper.createMakeupBag(
        app,
        tokens.adminToken,
        resources.categoryId,
        tokens.clientId,
        [resources.stageId],
        [resources.toolId],
      );

      await request(app.getHttpServer())
        .get(`/makeup-bags/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      const { id } = await ResourceHelper.createMakeupBag(
        app,
        tokens.adminToken,
        resources.categoryId,
        tokens.clientId,
        [resources.stageId],
        [resources.toolId],
      );

      const makeupBag = await request(app.getHttpServer())
        .get(`/makeup-bags/${id}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(makeupBag.body.category).toBeDefined();
      expect(makeupBag.body.client).toBeDefined();
      expect(makeupBag.body.stages).toHaveLength(1);
      expect(makeupBag.body.tools).toHaveLength(1);
    });

    it('should handle empty arrays in creation', async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({
          categoryId: resources.categoryId,
          clientId: tokens.clientId,
          stageIds: [],
          toolIds: [],
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
    });

    it('should handle population of related documents', async () => {
      const { id } = await ResourceHelper.createMakeupBag(
        app,
        tokens.adminToken,
        resources.categoryId,
        tokens.clientId,
        [resources.stageId],
        [resources.toolId],
      );

      const makeupBag = await request(app.getHttpServer())
        .get(`/makeup-bags/${id}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(makeupBag.body.category).toHaveProperty('name');
      expect(makeupBag.body.client).toHaveProperty('username');
      expect(makeupBag.body.stages[0]).toHaveProperty('_id');
      expect(makeupBag.body.tools[0]).toHaveProperty('name');
    });
  });
});
