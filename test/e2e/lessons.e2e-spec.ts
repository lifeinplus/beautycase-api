import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BrandsModule } from 'src/modules/brands/brands.module';
import { CreateLessonDto } from 'src/modules/lessons/dto/create-lesson.dto';
import { UpdateLessonDto } from 'src/modules/lessons/dto/update-lesson.dto';
import { LessonsModule } from 'src/modules/lessons/lessons.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';
import {
  ResourceHelper,
  TestLessonResources,
} from 'test/helpers/resource.helper';

describe('Lessons (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let tokens: AuthTokens;
  let resources: TestLessonResources;
  let lessonId: string;

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
        LessonsModule,
        ProductsModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    tokens = await AuthHelper.setupAuthTokens(app);

    resources = await ResourceHelper.setupLessonResources(
      app,
      tokens.adminToken,
    );
  });

  beforeEach(async () => {
    await DatabaseHelper.clearCollection(connection, 'lessons');
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /lessons', () => {
    const createLessonDto = () =>
      TestDataFactory.createLesson([resources.productId], [tokens.clientId]);

    it('should create a lesson as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(createLessonDto())
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
    });

    it('should create a lesson as mua', async () => {
      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(createLessonDto())
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
    });

    it('should reject creation by client role', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(createLessonDto())
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .send(createLessonDto())
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: 'Ab',
        shortDescription: 'Short',
        videoUrl: 'not-a-url',
        fullDescription: 'Too short',
      };

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate title length constraints', async () => {
      const longTitle = 'a'.repeat(101);

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({
          ...createLessonDto(),
          title: longTitle,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate URL format', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({
          ...createLessonDto(),
          videoUrl: 'invalid-url',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should accept valid productIds and clientIds', async () => {
      const dataWithIds = {
        ...createLessonDto(),
        productIds: ['507f1f77bcf86cd799439011'],
        clientIds: ['507f1f77bcf86cd799439012'],
      };

      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(dataWithIds)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
    });

    it('should reject invalid MongoDB ObjectIds', async () => {
      const dataWithInvalidIds = {
        ...createLessonDto(),
        productIds: ['invalid-id'],
        clientIds: ['also-invalid'],
      };

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(dataWithInvalidIds)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /lessons', () => {
    beforeEach(async () => {
      await ResourceHelper.createMultipleLessons(
        app,
        tokens.adminToken,
        2,
        [resources.productId],
        [tokens.clientId],
      );
    });

    it('should return all lessons when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/lessons')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);

      response.body.forEach((lesson: CreateLessonDto) => {
        expect(lesson).not.toHaveProperty('fullDescription');
        expect(lesson).not.toHaveProperty('productIds');
        expect(lesson).toHaveProperty('title');
        expect(lesson).toHaveProperty('shortDescription');
        expect(lesson).toHaveProperty('videoUrl');
      });
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/lessons')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /lessons/:id', () => {
    let clientAccessibleLessonId: string;

    beforeEach(async () => {
      const { id } = await ResourceHelper.createLesson(app, tokens.adminToken, [
        resources.productId,
      ]);

      lessonId = id;

      const clientLesson = await ResourceHelper.createLesson(
        app,
        tokens.adminToken,
        [resources.productId],
        [tokens.clientId],
      );

      clientAccessibleLessonId = clientLesson.id;
    });

    it('should return lesson details for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('_id', lessonId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('shortDescription');
      expect(response.body).toHaveProperty('videoUrl');
      expect(response.body).toHaveProperty('fullDescription');
    });

    it('should return lesson details for mua', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('_id', lessonId);
    });

    it('should allow client access to assigned lessons', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lessons/${clientAccessibleLessonId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', clientAccessibleLessonId);
    });

    it('should deny client access to non-assigned lessons', async () => {
      await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent lesson', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .get(`/lessons/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .get('/lessons/invalid-id')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /lessons/:id', () => {
    let updateDto: UpdateLessonDto;

    beforeEach(async () => {
      const { id } = await ResourceHelper.createLesson(
        app,
        tokens.adminToken,
        [resources.productId],
        [tokens.clientId],
      );

      lessonId = id;

      updateDto = {
        title: 'Updated Lesson Title',
        shortDescription: 'Updated description for the lesson',
      };
    });

    it('should update lesson as admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', lessonId);

      const getResponse = await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.title).toBe(updateDto.title);
      expect(getResponse.body.shortDescription).toBe(
        updateDto.shortDescription,
      );
    });

    it('should update lesson as mua', async () => {
      const response = await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', lessonId);
    });

    it('should reject update by client role', async () => {
      await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent lesson', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .put(`/lessons/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should allow partial updates', async () => {
      const partialUpdate = {
        title: 'Only Title Updated',
      };

      const response = await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(partialUpdate)
        .expect(HttpStatus.OK);
    });

    it('should validate update data', async () => {
      const invalidData = {
        title: 'A',
        videoUrl: 'not-a-url',
      };

      await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /lessons/:id/products', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createLesson(
        app,
        tokens.adminToken,
        [resources.productId],
        [tokens.clientId],
      );

      lessonId = id;
    });

    it('should update lesson products as admin', async () => {
      const productIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013',
      ];

      const response = await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ productIds })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', lessonId);
    });

    it('should update lesson products as mua', async () => {
      const productIds = ['507f1f77bcf86cd799439011'];

      await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send({ productIds })
        .expect(HttpStatus.OK);
    });

    it('should reject update by client role', async () => {
      const productIds = ['507f1f77bcf86cd799439011'];

      await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send({ productIds })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should validate productIds format', async () => {
      const invalidProductIds = ['invalid-id'];

      await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ productIds: invalidProductIds })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should require productIds array', async () => {
      await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle empty productIds array', async () => {
      await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ productIds: [] })
        .expect(HttpStatus.OK);
    });

    it('should return 404 for non-existent lesson', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .patch(`/lessons/${fakeId}/products`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ productIds: [] })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /lessons/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createLesson(
        app,
        tokens.adminToken,
        [resources.productId],
        [tokens.clientId],
      );

      lessonId = id;
    });

    it('should delete lesson as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', lessonId);

      await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete lesson as mua', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', lessonId);
    });

    it('should reject deletion by client role', async () => {
      await request(app.getHttpServer())
        .delete(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent lesson', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .delete(`/lessons/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .delete('/lessons/invalid-id')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/lessons/${lessonId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Access Control Edge Cases', () => {
    it('should handle LessonAccessGuard when makeup bag does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .get(`/lessons/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle LessonAccessGuard when user ID is missing', async () => {
      const { id } = await ResourceHelper.createLesson(
        app,
        tokens.adminToken,
        [resources.productId],
        [tokens.clientId],
      );

      await request(app.getHttpServer())
        .get(`/lessons/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request bodies gracefully', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send('invalid json')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle invalid route parameters', async () => {
      await request(app.getHttpServer())
        .get('/lessons/not-an-object-id')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
