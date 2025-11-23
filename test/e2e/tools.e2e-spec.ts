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
import { ProductsModule } from 'src/modules/products/products.module';
import { UpdateStoreLinksDto } from 'src/modules/tools/dto/update-store-links.dto';
import { UpdateToolDto } from 'src/modules/tools/dto/update-tool.dto';
import { ToolsModule } from 'src/modules/tools/tools.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TestDataFactory, TestTool } from 'test/factories/test-data.factory';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';
import { makeObjectId } from 'test/helpers/make-object-id.helper';
import {
  ResourceHelper,
  TestToolResources,
} from 'test/helpers/resource.helper';

describe('Tools (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let tokens: AuthTokens;
  let resources: TestToolResources;
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
        ProductsModule,
        ToolsModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    tokens = await AuthHelper.setupAuthTokens(app);
    resources = await ResourceHelper.setupToolResources(app, tokens);
  });

  beforeEach(async () => {
    await DatabaseHelper.clearCollection(connection, 'tools');
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /tools', () => {
    const createToolDto = () =>
      TestDataFactory.createTool(tokens.muaId, resources.brandId);

    it('should create a tool', async () => {
      const response = await request(app.getHttpServer())
        .post('/tools')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(createToolDto())
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({ id: expect.any(String) });
    });

    it('should create a tool as mua', async () => {
      const response = await request(app.getHttpServer())
        .post('/tools')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(createToolDto())
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({ id: expect.any(String) });
    });

    it('should reject creation by client role', async () => {
      await request(app.getHttpServer())
        .post('/tools')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(createToolDto())
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/tools')
        .send(createToolDto())
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate required fields', async () => {
      const invalidTool = {
        name: 'Test Tool',
      };

      const response = await request(app.getHttpServer())
        .post('/tools')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidTool)
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
      const invalidTool = {
        ...createToolDto(),
        brandId: 'invalid-mongo-id',
      };

      const response = await request(app.getHttpServer())
        .post('/tools')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidTool)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('brandId')]),
      );
    });

    it('should validate imageIds format', async () => {
      const invalidTool = {
        ...createToolDto(),
        imageIds: 'not-a-valid-url',
      };

      const response = await request(app.getHttpServer())
        .post('/tools')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidTool)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('imageIds')]),
      );
    });

    it('should validate name length', async () => {
      const invalidTool = {
        ...createToolDto(),
        name: 'a'.repeat(101),
      };

      const response = await request(app.getHttpServer())
        .post('/tools')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidTool)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('name')]),
      );
    });

    it('should validate comment length', async () => {
      const invalidTool = {
        ...createToolDto(),
        comment: 'a'.repeat(501),
      };

      const response = await request(app.getHttpServer())
        .post('/tools')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidTool)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('comment')]),
      );
    });

    it('should create tool without optional fields', async () => {
      const minimalTool = {
        brandId: '507f1f77bcf86cd799439011',
        name: 'Minimal Tool',
        imageIds: ['tools/minimal-image'],
        comment: 'Basic tool',
      };

      const response = await request(app.getHttpServer())
        .post('/tools')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(minimalTool)
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();
    });
  });

  describe('GET /tools', () => {
    beforeEach(async () => {
      await ResourceHelper.createTool(
        app,
        tokens.muaToken,
        tokens.muaId,
        resources.brandId,
      );
    });

    it('should get all tools as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/tools')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('imageIds');
    });

    it('should reject access when authenticated as client', async () => {
      await request(app.getHttpServer())
        .get('/tools')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject access when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/tools')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 when no tools exist', async () => {
      await DatabaseHelper.clearCollection(connection, 'tools');

      await request(app.getHttpServer())
        .get('/tools')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /tools/:id', () => {
    let toolData: TestTool;

    beforeEach(async () => {
      const { id, data } = await ResourceHelper.createTool(
        app,
        tokens.muaToken,
        tokens.muaId,
        resources.brandId,
      );

      toolId = id;
      toolData = data;
    });

    it('should get tool by id for any authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        _id: toolId,
        name: toolData.name,
        imageIds: toolData.imageIds,
        comment: toolData.comment,
        storeLinks: toolData.storeLinks,
      });
    });

    it('should populate brand information', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('brand');
    });

    it('should return 404 for non-existent tool', async () => {
      const fakeId = makeObjectId();

      await request(app.getHttpServer())
        .get(`/tools/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .get('/tools/invalid-id')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get(`/tools/${toolId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /tools/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createTool(
        app,
        tokens.muaToken,
        tokens.muaId,
        resources.brandId,
      );

      toolId = id;
    });

    it('should update tool as admin', async () => {
      const updateDto: UpdateToolDto = {
        name: 'Updated Lipstick Name',
        comment: 'Updated comment',
      };

      const putResponse = await request(app.getHttpServer())
        .put(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(putResponse.body).toMatchObject({ id: toolId });

      const getResponse = await request(app.getHttpServer())
        .get(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`);

      expect(getResponse.body.name).toBe(updateDto.name);
      expect(getResponse.body.comment).toBe(updateDto.comment);
    });

    it('should update tool as mua', async () => {
      const updateDto = { name: 'MUA Updated Name' };

      await request(app.getHttpServer())
        .put(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);
    });

    it('should reject update by client role', async () => {
      const updateDto = { name: 'Client Update' };

      await request(app.getHttpServer())
        .put(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should update tool with new image', async () => {
      const updateDto: UpdateToolDto = {
        imageIds: ['tools/new-image'],
      };

      await request(app.getHttpServer())
        .put(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);
    });

    it('should return 404 for non-existent tool', async () => {
      const fakeId = makeObjectId();

      await request(app.getHttpServer())
        .put(`/tools/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send({ name: 'Updated Name' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should allow partial updates', async () => {
      const partialUpdate: UpdateToolDto = {
        number: 'New Shade',
      };

      await request(app.getHttpServer())
        .put(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(partialUpdate)
        .expect(HttpStatus.OK);
    });
  });

  describe('PATCH /tools/:id/store-links', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createTool(
        app,
        tokens.muaToken,
        tokens.muaId,
        resources.brandId,
      );

      toolId = id;
    });

    it('should update store links when authenticated as admin', async () => {
      const newStoreLinks: UpdateStoreLinksDto = {
        storeLinks: [
          {
            name: 'Ulta',
            link: 'https://ulta.com/tool/test-lipstick',
          },
          {
            name: 'Target',
            link: 'https://target.com/tool/test-lipstick',
          },
        ],
      };

      const patchResponse = await request(app.getHttpServer())
        .patch(`/tools/${toolId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(newStoreLinks)
        .expect(HttpStatus.OK);

      expect(patchResponse.body).toMatchObject({ id: toolId });

      const getResponse = await request(app.getHttpServer())
        .get(`/tools/${toolId}`)
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
        .patch(`/tools/${toolId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(newStoreLinks)
        .expect(HttpStatus.OK);
    });

    it('should reject update when authenticated as client', async () => {
      const newStoreLinks: UpdateStoreLinksDto = {
        storeLinks: [],
      };

      await request(app.getHttpServer())
        .patch(`/tools/${toolId}/store-links`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(newStoreLinks)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should clear store links with empty array', async () => {
      const emptyStoreLinks: UpdateStoreLinksDto = {
        storeLinks: [],
      };

      await request(app.getHttpServer())
        .patch(`/tools/${toolId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(emptyStoreLinks)
        .expect(HttpStatus.OK);

      const getResponse = await request(app.getHttpServer())
        .get(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`);

      expect(getResponse.body.storeLinks).toHaveLength(0);
    });

    it('should validate store link structure', async () => {
      const invalidStoreLinks = {
        storeLinks: [{ name: 'Store Name' }],
      };

      const response = await request(app.getHttpServer())
        .patch(`/tools/${toolId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(invalidStoreLinks)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('storeLinks')]),
      );
    });

    it('should return 404 for non-existent tool', async () => {
      const nonExistentId = makeObjectId();

      await request(app.getHttpServer())
        .patch(`/tools/${nonExistentId}/store-links`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send({ storeLinks: [] })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /tools/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createTool(
        app,
        tokens.muaToken,
        tokens.muaId,
        resources.brandId,
      );

      toolId = id;
    });

    it('should delete tool as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({ id: toolId });

      await request(app.getHttpServer())
        .get(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete tool as mua', async () => {
      await request(app.getHttpServer())
        .delete(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);
    });

    it('should reject deletion by client role', async () => {
      await request(app.getHttpServer())
        .delete(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);

      await request(app.getHttpServer())
        .get(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/tools/${toolId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent tool', async () => {
      const fakeId = makeObjectId();

      await request(app.getHttpServer())
        .delete(`/tools/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .delete('/tools/invalid-id')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 if tool is used in makeup bags', async () => {
      await ResourceHelper.createMakeupBag(
        app,
        tokens,
        resources.categoryId,
        [resources.stageId],
        [toolId],
      );

      const response = await request(app.getHttpServer())
        .delete(`/tools/${toolId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.code).toContain('TOOL_IN_USE');
    });
  });

  describe('Multiple Tools Operations', () => {
    const createToolDto = () =>
      TestDataFactory.createTool(tokens.muaId, resources.brandId);

    it('should handle multiple tools correctly', async () => {
      const tools = [
        { ...createToolDto(), name: 'Tool 1' },
        { ...createToolDto(), name: 'Tool 2' },
        { ...createToolDto(), name: 'Tool 3' },
      ];

      const createdIds: string[] = [];

      for (const tool of tools) {
        const postResponse = await request(app.getHttpServer())
          .post('/tools')
          .set('Authorization', `Bearer ${tokens.muaToken}`)
          .send(tool);

        createdIds.push(postResponse.body.id);
      }

      const getAllResponse = await request(app.getHttpServer())
        .get('/tools')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(getAllResponse.body).toHaveLength(3);

      await request(app.getHttpServer())
        .delete(`/tools/${createdIds[0]}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      const getAfterDeleteResponse = await request(app.getHttpServer())
        .get('/tools')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(getAfterDeleteResponse.body).toHaveLength(2);
    });
  });
});
