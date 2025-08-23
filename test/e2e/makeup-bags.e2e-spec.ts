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
import { CreateCategoryDto } from 'src/modules/categories/dto/create-category.dto';
import { CreateMakeupBagDto } from 'src/modules/makeup-bags/dto/create-makeup-bag.dto';
import { UpdateMakeupBagDto } from 'src/modules/makeup-bags/dto/update-makeup-bag.dto';
import { MakeupBagsModule } from 'src/modules/makeup-bags/makeup-bags.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { CreateStageDto } from 'src/modules/stages/dto/create-stage.dto';
import { StagesModule } from 'src/modules/stages/stages.module';
import { CreateToolDto } from 'src/modules/tools/dto/create-tool.dto';
import { ToolsModule } from 'src/modules/tools/tools.module';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';

describe('MakeupBags (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let auth: AuthTokens;

  let categoryId: string;
  let makeupBagId: string;
  let stageId: string;
  let toolId: string;

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
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase(connection);
    auth = await AuthHelper.setupAuthTokens(app);
    await setupTestData();
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  const setupTestData = async () => {
    const mockCategory: CreateCategoryDto = {
      name: 'basic',
      type: 'makeup_bag',
    };

    const category = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${auth.adminToken}`)
      .send(mockCategory)
      .expect(HttpStatus.CREATED);

    categoryId = category.body.id;

    const mockStage: CreateStageDto = {
      title: 'Morning routine',
      subtitle: 'Soft and natural',
      imageUrl: 'http://example.com/image.jpg',
      productIds: [],
    };

    const stage = await request(app.getHttpServer())
      .post('/stages')
      .set('Authorization', `Bearer ${auth.adminToken}`)
      .send(mockStage)
      .expect(HttpStatus.CREATED);

    stageId = stage.body.id;

    const mockTool: CreateToolDto = {
      brandId: '507f1f77bcf86cd799439011',
      name: 'Brush',
      imageUrl: 'http://example.com/image.jpg',
      comment: 'Great tool',
      storeLinks: [],
    };

    const tool = await request(app.getHttpServer())
      .post('/tools')
      .set('Authorization', `Bearer ${auth.adminToken}`)
      .send(mockTool)
      .expect(HttpStatus.CREATED);

    toolId = tool.body.id;
  };

  describe('POST /makeup-bags', () => {
    const mockMakeupBag: CreateMakeupBagDto = {
      categoryId: '',
      clientId: '',
      stageIds: [],
      toolIds: [],
    };

    beforeEach(() => {
      mockMakeupBag.categoryId = categoryId;
      mockMakeupBag.clientId = auth.clientId;
      mockMakeupBag.stageIds = [stageId];
      mockMakeupBag.toolIds = [toolId];
    });

    it('should create a makeup-bag as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(mockMakeupBag)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('MakeupBag created successfully');
    });

    it('should create a makeup-bag as mua', async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .send(mockMakeupBag)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('MakeupBag created successfully');
    });

    it('should reject creation by client role', async () => {
      await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .send(mockMakeupBag)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/makeup-bags')
        .send(mockMakeupBag)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({})
        .expect(400);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          ...mockMakeupBag,
          categoryId: 'invalid-id',
        })
        .expect(400);
    });

    it('should validate array fields', async () => {
      await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          ...mockMakeupBag,
          stageIds: 'not-an-array',
        })
        .expect(400);
    });
  });

  describe('GET /makeup-bags', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          categoryId,
          clientId: auth.clientId,
          stageIds: [stageId],
          toolIds: [toolId],
        });
    });

    it('should get all makeup bags as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0]).toHaveProperty('client');
      expect(response.body[0]).toHaveProperty('stages');
    });

    it('should get all makeup bags as MUA', async () => {
      const response = await request(app.getHttpServer())
        .get('/makeup-bags')
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should not allow client to get all makeup bags', async () => {
      await request(app.getHttpServer())
        .get('/makeup-bags')
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/makeup-bags').expect(401);
    });
  });

  describe('GET /makeup-bags/:id', () => {
    let makeupBagId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          categoryId,
          clientId: auth.clientId,
          stageIds: [stageId],
          toolIds: [toolId],
        });

      makeupBagId = response.body.id;
    });

    it('should return makeup-bag details for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
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
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('_id', makeupBagId);
    });

    it('should allow client access to assigned makeup-bag', async () => {
      const response = await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('_id', makeupBagId);
    });

    it('should return 404 for non-existent makeup-bag', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .get(`/makeup-bags/${fakeId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .get('/makeup-bags/invalid-id')
        .set('Authorization', `Bearer ${auth.adminToken}`)
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
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          categoryId,
          clientId: auth.clientId,
          stageIds: [stageId],
          toolIds: [toolId],
        });

      makeupBagId = response.body.id;

      updateDto = {
        stageIds: [stageId],
        toolIds: [],
      };
    });

    it('should update makeup-bag as admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', makeupBagId);
      expect(response.body.message).toBe('MakeupBag updated successfully');
    });

    it('should update makeup-bag as mua', async () => {
      const response = await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', makeupBagId);
      expect(response.body).toHaveProperty(
        'message',
        'MakeupBag updated successfully',
      );
    });

    it('should reject update by client role', async () => {
      await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent makeup-bag', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .put(`/makeup-bags/${fakeId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({ title: 'Updated Title' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .send(updateDto)
        .expect(401);
    });

    it('should allow partial updates', async () => {
      const response = await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({ toolIds: [] })
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe('MakeupBag updated successfully');
    });

    it('should validate MongoDB ObjectId format in URL', async () => {
      await request(app.getHttpServer())
        .put('/makeup-bags/invalid-id')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(updateDto)
        .expect(400);
    });

    it('should validate update data', async () => {
      await request(app.getHttpServer())
        .put(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          categoryId: 'invalid-id',
        })
        .expect(400);
    });
  });

  describe('DELETE /makeup-bags/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          categoryId,
          clientId: auth.clientId,
          stageIds: [stageId],
          toolIds: [toolId],
        });

      makeupBagId = response.body.id;
    });

    it('should delete makeup-bag as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', makeupBagId);
      expect(response.body.message).toBe('MakeupBag deleted successfully');

      await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete makeup-bag as mua', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', makeupBagId);
      expect(response.body).toHaveProperty(
        'message',
        'MakeupBag deleted successfully',
      );
    });

    it('should reject deletion by client role', async () => {
      await request(app.getHttpServer())
        .delete(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent makeup-bag', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .delete(`/makeup-bags/${fakeId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .delete('/makeup-bags/invalid-id')
        .set('Authorization', `Bearer ${auth.adminToken}`)
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
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .expect(404);
    });

    it('should handle MakeupBagAccessGuard when user ID is missing', async () => {
      // This would be handled by the auth middleware, but testing edge case
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          categoryId,
          clientId: auth.clientId,
          stageIds: [stageId],
          toolIds: [toolId],
        });

      const makeupBagId = response.body.id;

      // Test with a malformed token or edge case would be handled by JWT guard
      await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .expect(401);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          categoryId,
          clientId: auth.clientId,
          stageIds: [stageId],
          toolIds: [toolId],
        });

      const makeupBagId = response.body.id;

      const makeupBag = await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(200);

      expect(makeupBag.body.category).toBeDefined();
      expect(makeupBag.body.client).toBeDefined();
      expect(makeupBag.body.stages).toHaveLength(1);
      expect(makeupBag.body.tools).toHaveLength(1);
    });

    it('should handle empty arrays in creation', async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          categoryId,
          clientId: auth.clientId,
          stageIds: [],
          toolIds: [],
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'message',
        'MakeupBag created successfully',
      );
    });

    it('should handle population of related documents', async () => {
      const response = await request(app.getHttpServer())
        .post('/makeup-bags')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          categoryId,
          clientId: auth.clientId,
          stageIds: [stageId],
          toolIds: [toolId],
        });

      const makeupBagId = response.body.id;

      const makeupBag = await request(app.getHttpServer())
        .get(`/makeup-bags/${makeupBagId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(200);

      // Check that populated fields have the expected structure
      expect(makeupBag.body.category).toHaveProperty('name');
      expect(makeupBag.body.client).toHaveProperty('username');
      expect(makeupBag.body.stages[0]).toHaveProperty('_id');
      expect(makeupBag.body.tools[0]).toHaveProperty('name');
    });
  });
});
