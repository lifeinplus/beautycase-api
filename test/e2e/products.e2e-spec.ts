import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BrandsModule } from 'src/modules/brands/brands.module';
import { UpdateProductDto } from 'src/modules/products/dto/update-product.dto';
import { UpdateStoreLinksDto } from 'src/modules/products/dto/update-store-links.dto';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TestDataFactory, TestProduct } from 'test/factories/test-data.factory';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';
import { makeObjectId } from 'test/helpers/make-object-id.helper';
import {
  BrandResources,
  CategoryResources,
  ResourceHelper,
} from 'test/helpers/resource.helper';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let tokens: AuthTokens;
  let brandResources: BrandResources;
  let categoryResources: CategoryResources;
  let productId: string;

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
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    tokens = await AuthHelper.setupAuthTokens(app);
    brandResources = await ResourceHelper.createBrand(app, tokens.adminToken);
    categoryResources = await ResourceHelper.createCategory(
      app,
      tokens.adminToken,
    );
  });

  beforeEach(async () => {
    await DatabaseHelper.clearCollection(connection, 'products');
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /products', () => {
    const createProductDto = () =>
      TestDataFactory.createProduct(
        tokens.muaId,
        brandResources.id,
        categoryResources.id,
      );

    it('should create a product as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(createProductDto())
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({ id: expect.any(String) });
    });

    it('should create a product as mua', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(createProductDto())
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({ id: expect.any(String) });
    });

    it('should reject creation by client role', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(createProductDto())
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send(createProductDto())
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        name: 'Test Product',
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidProduct)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('brandId'),
          expect.stringContaining('imageIds'),
          expect.stringContaining('comment'),
        ]),
      );
    });

    it('should validate brandId format', async () => {
      const invalidProduct = {
        ...createProductDto(),
        brandId: 'invalid-mongo-id',
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidProduct)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('brandId')]),
      );
    });

    it('should validate name length', async () => {
      const invalidProduct = {
        ...createProductDto(),
        name: 'a'.repeat(101),
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidProduct)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('name')]),
      );
    });

    it('should validate comment length', async () => {
      const invalidProduct = {
        ...createProductDto(),
        comment: 'a'.repeat(501),
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidProduct)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('comment')]),
      );
    });

    it('should create product without optional fields', async () => {
      const minimalProduct = {
        brandId: '507f1f77bcf86cd799439011',
        categoryId: '507f1f77bcf86cd799439012',
        name: 'Minimal Product',
        imageIds: ['products/image'],
        comment: 'Basic product',
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(minimalProduct)
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();
    });
  });

  describe('GET /products', () => {
    beforeEach(async () => {
      await ResourceHelper.createProduct(
        app,
        tokens.muaToken,
        tokens.muaId,
        brandResources.id,
        categoryResources.id,
      );
    });

    it('should get all products as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('imageIds');
    });

    it('should reject access when authenticated as client', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject access when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 when no products exist', async () => {
      await DatabaseHelper.clearCollection(connection, 'products');

      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /products/:id', () => {
    let productData: TestProduct;

    beforeEach(async () => {
      const { id, data } = await ResourceHelper.createProduct(
        app,
        tokens.muaToken,
        tokens.muaId,
        brandResources.id,
        categoryResources.id,
      );

      productId = id;
      productData = data;
    });

    it('should get product by id for any authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        _id: productId,
        name: productData.name,
        imageIds: productData.imageIds,
        comment: productData.comment,
        shade: productData.shade,
        storeLinks: productData.storeLinks,
      });
    });

    it('should populate brand information', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('brand');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = makeObjectId();

      await request(app.getHttpServer())
        .get(`/products/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .get('/products/invalid-id')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /products/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createProduct(
        app,
        tokens.muaToken,
        tokens.muaId,
        brandResources.id,
        categoryResources.id,
      );

      productId = id;
    });

    it('should update product as admin', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Lipstick Name',
        comment: 'Updated comment',
      };

      const putResponse = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(putResponse.body).toMatchObject({ id: productId });

      const getResponse = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`);

      expect(getResponse.body.name).toBe(updateDto.name);
      expect(getResponse.body.comment).toBe(updateDto.comment);
    });

    it('should update product as mua', async () => {
      const updateDto = { name: 'MUA Updated Name' };

      await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);
    });

    it('should reject update by client role', async () => {
      const updateDto = { name: 'Client Update' };

      await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should update product with new image', async () => {
      const updateDto: UpdateProductDto = {
        imageIds: ['products/image'],
      };

      await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = makeObjectId();

      await request(app.getHttpServer())
        .put(`/products/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send({ name: 'Updated Name' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should allow partial updates', async () => {
      const partialUpdate: UpdateProductDto = {
        shade: 'New Shade',
      };

      await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(partialUpdate)
        .expect(HttpStatus.OK);
    });
  });

  describe('PATCH /products/:id/store-links', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createProduct(
        app,
        tokens.muaToken,
        tokens.muaId,
        brandResources.id,
        categoryResources.id,
      );

      productId = id;
    });

    it('should update store links when authenticated as admin', async () => {
      const newStoreLinks: UpdateStoreLinksDto = {
        storeLinks: [
          {
            name: 'Ulta',
            link: 'https://ulta.com/product/test-lipstick',
          },
          {
            name: 'Target',
            link: 'https://target.com/product/test-lipstick',
          },
        ],
      };

      const patchResponse = await request(app.getHttpServer())
        .patch(`/products/${productId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(newStoreLinks)
        .expect(HttpStatus.OK);

      expect(patchResponse.body).toMatchObject({ id: productId });

      const getResponse = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`);

      expect(getResponse.body.storeLinks).toHaveLength(2);
      expect(getResponse.body.storeLinks[0].name).toBe('Ulta');
      expect(getResponse.body.storeLinks[1].name).toBe('Target');
    });

    it('should update store links when authenticated as mua', async () => {
      const newStoreLinks: UpdateStoreLinksDto = {
        storeLinks: [
          {
            name: 'Updated Store',
            link: 'https://example.com/updated',
          },
        ],
      };

      await request(app.getHttpServer())
        .patch(`/products/${productId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(newStoreLinks)
        .expect(HttpStatus.OK);
    });

    it('should reject update when authenticated as client', async () => {
      const newStoreLinks: UpdateStoreLinksDto = {
        storeLinks: [],
      };

      await request(app.getHttpServer())
        .patch(`/products/${productId}/store-links`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(newStoreLinks)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should clear store links with empty array', async () => {
      const emptyStoreLinks: UpdateStoreLinksDto = {
        storeLinks: [],
      };

      await request(app.getHttpServer())
        .patch(`/products/${productId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(emptyStoreLinks)
        .expect(HttpStatus.OK);

      const getResponse = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`);

      expect(getResponse.body.storeLinks).toHaveLength(0);
    });

    it('should validate store link structure', async () => {
      const invalidStoreLinks = {
        storeLinks: [{ name: 'Store Name' }],
      };

      const response = await request(app.getHttpServer())
        .patch(`/products/${productId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidStoreLinks)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('storeLinks')]),
      );
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = makeObjectId();

      await request(app.getHttpServer())
        .patch(`/products/${nonExistentId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send({ storeLinks: [] })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /products/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createProduct(
        app,
        tokens.muaToken,
        tokens.muaId,
        brandResources.id,
        categoryResources.id,
      );

      productId = id;
    });

    it('should delete product as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: productId,
      });

      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete product as mua', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);
    });

    it('should reject deletion by client role', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);

      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = makeObjectId();

      await request(app.getHttpServer())
        .delete(`/products/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .delete('/products/invalid-id')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 if product is used in lessons', async () => {
      await ResourceHelper.createLesson(app, tokens.muaToken, tokens.muaId, [
        productId,
      ]);

      const response = await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.code).toBe('PRODUCT_IN_USE');
    });

    it('should return 400 if product is used in stages', async () => {
      await ResourceHelper.createStage(app, tokens, [productId]);

      const response = await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.code).toBe('PRODUCT_IN_USE');
    });
  });

  describe('Multiple Products Operations', () => {
    const createProductDto = () =>
      TestDataFactory.createProduct(
        tokens.muaId,
        brandResources.id,
        categoryResources.id,
      );

    it('should handle multiple products correctly', async () => {
      const products = [
        { ...createProductDto(), name: 'Product 1' },
        { ...createProductDto(), name: 'Product 2' },
        { ...createProductDto(), name: 'Product 3' },
      ];

      const createdIds: string[] = [];

      for (const product of products) {
        const postResponse = await request(app.getHttpServer())
          .post('/products')
          .set('Authorization', `Bearer ${tokens.muaToken}`)
          .send(product);

        createdIds.push(postResponse.body.id);
      }

      const getAllResponse = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(getAllResponse.body).toHaveLength(3);

      await request(app.getHttpServer())
        .delete(`/products/${createdIds[0]}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      const getAfterDeleteResponse = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(getAfterDeleteResponse.body).toHaveLength(2);
    });
  });
});
