import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BrandsModule } from 'src/modules/brands/brands.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { CreateStageDto } from 'src/modules/stages/dto/create-stage.dto';
import { UpdateStageDto } from 'src/modules/stages/dto/update-stage.dto';
import { StagesModule } from 'src/modules/stages/stages.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TestDataFactory, TestStage } from 'test/factories/test-data.factory';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';
import {
  BrandResources,
  ProductResources,
  ResourceHelper,
  StageResources,
} from 'test/helpers/resource.helper';

describe('Stages (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let tokens: AuthTokens;
  let brand: BrandResources;
  let product: ProductResources;
  let stageId: string;

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
        ProductsModule,
        StagesModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    tokens = await AuthHelper.setupAuthTokens(app);
    brand = await ResourceHelper.createBrand(app, tokens.adminToken);
    product = await ResourceHelper.createProduct(
      app,
      tokens.adminToken,
      brand.id,
    );
  });

  beforeEach(async () => {
    await DatabaseHelper.clearCollection(connection, 'stages');
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /stages', () => {
    const createStageDto = () => TestDataFactory.createStage([product.id]);

    it('should create a stage as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/stages')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(createStageDto())
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        message: 'Stage created successfully',
      });
    });

    it('should create a stage as mua', async () => {
      await request(app.getHttpServer())
        .post('/stages')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(createStageDto())
        .expect(HttpStatus.CREATED);
    });

    it('should create stage with optional fields', async () => {
      const stageDto = {
        ...createStageDto(),
        comment: 'This is a test comment',
        steps: ['Step 1', 'Step 2', 'Step 3'],
      };

      const response = await request(app.getHttpServer())
        .post('/stages')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(stageDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        id: expect.any(String),
        message: 'Stage created successfully',
      });
    });

    it('should reject stage creation as client', async () => {
      await request(app.getHttpServer())
        .post('/stages')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(createStageDto())
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject stage creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/stages')
        .send(createStageDto())
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate required fields', async () => {
      const invalidDto: CreateStageDto = {
        title: 'A', // Too short (min 3)
        subtitle: 'Short', // Too short (min 10)
        imageUrl: 'invalid-url',
        productIds: ['invalid-mongo-id'],
      };

      const response = await request(app.getHttpServer())
        .post('/stages')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('title'),
          expect.stringContaining('subtitle'),
          expect.stringContaining('imageUrl'),
          expect.stringContaining('productIds'),
        ]),
      );
    });

    it('should validate optional fields when provided', async () => {
      const invalidStageDto = {
        title: 'Valid Title',
        subtitle: 'This is a valid subtitle with enough characters',
        imageUrl: 'https://example.com/image.jpg',
        comment: 'x'.repeat(501), // Too long (max 500)
        productIds: [brand.id],
      };

      const response = await request(app.getHttpServer())
        .post('/stages')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidStageDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain(
        'comment must be shorter than or equal to 500 characters',
      );
    });

    it('should validate imageUrl format', async () => {
      const invalidStage = {
        ...createStageDto(),
        imageUrl: 'not-a-valid-url',
      };

      const response = await request(app.getHttpServer())
        .post('/stages')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidStage)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('imageUrl')]),
      );
    });

    it('should validate comment length', async () => {
      const invalidStage = {
        ...createStageDto(),
        comment: 'a'.repeat(501),
      };

      const response = await request(app.getHttpServer())
        .post('/stages')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidStage)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('comment')]),
      );
    });
  });

  describe('POST /stages/duplicate/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createStage(app, tokens.adminToken, [
        product.id,
      ]);

      stageId = id;
    });

    it('should duplicate an existing stage', async () => {
      const response = await request(app.getHttpServer())
        .post(`/stages/duplicate/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        id: expect.any(String),
        message: 'Stage duplicated successfully',
      });

      expect(response.body.id).not.toBe(stageId);
    });

    it('should allow mua to duplicate stage', async () => {
      const response = await request(app.getHttpServer())
        .post(`/stages/duplicate/${stageId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        id: expect.any(String),
        message: 'Stage duplicated successfully',
      });
    });

    it('should reject duplication with client role', async () => {
      await request(app.getHttpServer())
        .post(`/stages/duplicate/${stageId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent stage', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .post(`/stages/duplicate/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid stage ID', async () => {
      const invalidId = 'invalid-id';

      await request(app.getHttpServer())
        .post(`/stages/duplicate/${invalidId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /stages', () => {
    let stages: StageResources[];

    beforeEach(async () => {
      stages = await ResourceHelper.createMultipleStages(
        app,
        tokens.adminToken,
        2,
        [product.id],
      );
    });

    it('should get all stages as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/stages')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: stages[0].id,
            title: stages[0].data.title,
            subtitle: stages[0].data.subtitle,
            imageUrl: stages[0].data.imageUrl,
          }),
          expect.objectContaining({
            _id: stages[1].id,
            title: stages[1].data.title,
            subtitle: stages[1].data.subtitle,
            imageUrl: stages[1].data.imageUrl,
          }),
        ]),
      );
    });

    it('should get all stages as MUA', async () => {
      await request(app.getHttpServer())
        .get('/stages')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);
    });

    it('should reject access when authenticated as client', async () => {
      await request(app.getHttpServer())
        .get('/stages')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject access when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/stages')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 when no stages exist', async () => {
      await DatabaseHelper.clearCollection(connection, 'stages');

      await request(app.getHttpServer())
        .get('/stages')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return only selected fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/stages')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      const stage = response.body[0];
      expect(stage).toHaveProperty('_id');
      expect(stage).toHaveProperty('title');
      expect(stage).toHaveProperty('subtitle');
      expect(stage).toHaveProperty('imageUrl');
      expect(stage).toHaveProperty('createdAt');
      expect(stage).not.toHaveProperty('comment');
      expect(stage).not.toHaveProperty('steps');
      expect(stage).not.toHaveProperty('productIds');
    });
  });

  describe('GET /stages/:id', () => {
    let stageData: TestStage;

    beforeEach(async () => {
      const { id, data } = await ResourceHelper.createStage(
        app,
        tokens.adminToken,
        [product.id],
      );

      stageId = id;
      stageData = data;
    });

    it('should get stage by id for any authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        _id: stageId,
        title: stageData.title,
        subtitle: stageData.subtitle,
        imageUrl: stageData.imageUrl,
        products: [{ _id: stageData.productIds[0] }],
      });
    });

    it('should populate productIds with imageUrl field', async () => {
      const response = await request(app.getHttpServer())
        .get(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0]).toMatchObject({
        _id: product.id,
        imageUrl: product.data.imageUrl,
      });
    });

    it('should return 404 for non-existent stage', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .get(`/stages/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid stage ID', async () => {
      const invalidId = 'invalid-id';

      await request(app.getHttpServer())
        .get(`/stages/${invalidId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get(`/stages/${stageId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /stages/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createStage(app, tokens.adminToken, [
        product.id,
      ]);

      stageId = id;
    });

    it('should update stage as admin', async () => {
      const updateDto: UpdateStageDto = {
        title: 'Updated Title',
        subtitle: 'Updated subtitle with enough characters',
      };

      const putResponse = await request(app.getHttpServer())
        .put(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(putResponse.body).toMatchObject({
        id: stageId,
        message: 'Stage updated successfully',
      });

      const getResponse = await request(app.getHttpServer())
        .get(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(getResponse.body.title).toBe(updateDto.title);
      expect(getResponse.body.subtitle).toBe(updateDto.subtitle);
    });

    it('should update stage as mua', async () => {
      const updateDto = { title: 'MUA Updated Title' };

      const response = await request(app.getHttpServer())
        .put(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe('Stage updated successfully');
    });

    it('should reject update by client role', async () => {
      const updateDto = { title: 'Client Updated Title' };

      await request(app.getHttpServer())
        .put(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should update stage with new image', async () => {
      const updateDto: UpdateStageDto = {
        imageUrl: 'https://example.com/new-image.jpg',
      };

      await request(app.getHttpServer())
        .put(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);
    });

    it('should validate update data', async () => {
      const invalidUpdate: UpdateStageDto = {
        title: 'A', // Too short
        imageUrl: 'invalid-url',
      };

      const response = await request(app.getHttpServer())
        .put(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidUpdate)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('title'),
          expect.stringContaining('imageUrl'),
        ]),
      );
    });

    it('should return 404 for non-existent stage', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      const updateDto = { title: 'Updated Title' };

      await request(app.getHttpServer())
        .put(`/stages/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should allow partial updates', async () => {
      const partialUpdate: UpdateStageDto = {
        comment: 'New comment added',
        steps: ['New step 1', 'New step 2'],
      };

      const response = await request(app.getHttpServer())
        .put(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(partialUpdate)
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe('Stage updated successfully');
    });
  });

  describe('PATCH /stages/:id/products', () => {
    let productIds: string[];

    beforeEach(async () => {
      const { id } = await ResourceHelper.createStage(app, tokens.adminToken, [
        product.id,
      ]);

      stageId = id;

      const products = await ResourceHelper.createMultipleProducts(
        app,
        tokens.adminToken,
        2,
        brand.id,
      );

      productIds = products.map((p) => p.id);
    });

    it('should update stage products as admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/stages/${stageId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ productIds })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', stageId);
      expect(response.body.message).toBe('Stage products updated successfully');
    });

    it('should update stage products as mua', async () => {
      await request(app.getHttpServer())
        .patch(`/stages/${stageId}/products`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send({ productIds })
        .expect(HttpStatus.OK);
    });

    it('should reject update by client role', async () => {
      await request(app.getHttpServer())
        .patch(`/stages/${stageId}/products`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send({ productIds })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should validate productIds format', async () => {
      const invalidDto = {
        productIds: ['invalid-id', 'another-invalid-id'],
      };

      await request(app.getHttpServer())
        .patch(`/stages/${stageId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should require productIds array', async () => {
      await request(app.getHttpServer())
        .patch(`/stages/${stageId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle empty productIds array', async () => {
      const updateDto = { productIds: [] };

      await request(app.getHttpServer())
        .patch(`/stages/${stageId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);
    });

    it('should return 404 for non-existent stage', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      const updateDto = { productIds };

      await request(app.getHttpServer())
        .patch(`/stages/${fakeId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /stages/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createStage(app, tokens.adminToken, [
        product.id,
      ]);

      stageId = id;
    });

    it('should delete stage as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: stageId,
        message: 'Stage deleted successfully',
      });

      await request(app.getHttpServer())
        .get(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete stage as mua', async () => {
      await request(app.getHttpServer())
        .delete(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);
    });

    it('should reject deletion by client role', async () => {
      await request(app.getHttpServer())
        .delete(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);

      await request(app.getHttpServer())
        .get(`/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/stages/${stageId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent stage', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .delete(`/stages/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      const invalidId = 'invalid-id';

      await request(app.getHttpServer())
        .delete(`/stages/${invalidId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
