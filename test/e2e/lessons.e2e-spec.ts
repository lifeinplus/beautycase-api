import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CreateLessonDto } from 'src/modules/lessons/dto/create-lesson.dto';
import { LessonsModule } from 'src/modules/lessons/lessons.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';

describe('Lessons (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let auth: AuthTokens;

  const mockLesson1: CreateLessonDto = {
    title: 'Advanced Makeup Techniques',
    shortDescription: 'Learn advanced makeup application methods',
    videoUrl: 'https://example.com/video1.mp4',
    fullDescription:
      'This comprehensive lesson covers advanced makeup techniques including contouring, highlighting, and professional finishing touches that will elevate your makeup skills to the next level.',
    productIds: [],
    clientIds: [],
  };

  const mockLesson2: CreateLessonDto = {
    title: 'Basic Makeup Fundamentals',
    shortDescription: 'Learn advanced makeup application methods',
    videoUrl: 'https://example.com/video2.mp4',
    fullDescription:
      'This comprehensive lesson covers advanced makeup techniques including contouring, highlighting, and professional finishing touches that will elevate your makeup skills to the next level.',
    productIds: [],
    clientIds: [],
  };

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
        LessonsModule,
        ProductsModule,
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
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /lessons', () => {
    it('should create a lesson as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(mockLesson1)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Lesson created successfully');
    });

    it('should create a lesson as mua', async () => {
      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .send(mockLesson1)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Lesson created successfully');
    });

    it('should reject creation by client role', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .send(mockLesson1)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .send(mockLesson1)
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
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate title length constraints', async () => {
      const longTitle = 'a'.repeat(101);

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          ...mockLesson1,
          title: longTitle,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate URL format', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          ...mockLesson1,
          videoUrl: 'invalid-url',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should accept valid productIds and clientIds', async () => {
      const dataWithIds = {
        ...mockLesson1,
        productIds: ['507f1f77bcf86cd799439011'],
        clientIds: ['507f1f77bcf86cd799439012'],
      };

      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(dataWithIds)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Lesson created successfully');
    });

    it('should reject invalid MongoDB ObjectIds', async () => {
      const dataWithInvalidIds = {
        ...mockLesson1,
        productIds: ['invalid-id'],
        clientIds: ['also-invalid'],
      };

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(dataWithInvalidIds)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /lessons', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(mockLesson1);

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(mockLesson2);
    });

    it('should return all lessons when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/lessons')
        .set('Authorization', `Bearer ${auth.clientToken}`)
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
    let lessonId: string;
    let clientAccessibleLessonId: string;

    beforeEach(async () => {
      const lessonResponse = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(mockLesson1);

      lessonId = lessonResponse.body.id;

      const clientLessonResponse = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({
          ...mockLesson2,
          title: 'Client Accessible Lesson',
          clientIds: [auth.clientId],
        });

      clientAccessibleLessonId = clientLessonResponse.body.id;
    });

    it('should return lesson details for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('title', mockLesson1.title);
      expect(response.body).toHaveProperty('shortDescription');
      expect(response.body).toHaveProperty('videoUrl');
      expect(response.body).toHaveProperty('fullDescription');
    });

    it('should return lesson details for mua', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('title', mockLesson1.title);
    });

    it('should allow client access to assigned lessons', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lessons/${clientAccessibleLessonId}`)
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('title', 'Client Accessible Lesson');
    });

    it('should deny client access to non-assigned lessons', async () => {
      await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent lesson', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .get(`/lessons/${fakeId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .get('/lessons/invalid-id')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /lessons/:id', () => {
    let lessonId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(mockLesson1);

      lessonId = response.body.id;
    });

    it('should update lesson as admin', async () => {
      const updateData = {
        title: 'Updated Lesson Title',
        shortDescription: 'Updated description for the lesson',
      };

      const response = await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', lessonId);
      expect(response.body.message).toBe('Lesson updated successfully');

      const getResponse = await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.title).toBe(updateData.title);
      expect(getResponse.body.shortDescription).toBe(
        updateData.shortDescription,
      );
    });

    it('should update lesson as mua', async () => {
      const updateData = {
        title: 'MUA Updated Title',
      };

      const response = await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe('Lesson updated successfully');
    });

    it('should reject update by client role', async () => {
      const updateData = {
        title: 'Client Attempt',
      };

      await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .send(updateData)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should validate update data', async () => {
      const invalidData = {
        title: 'A',
        videoUrl: 'not-a-url',
      };

      await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 for non-existent lesson', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .put(`/lessons/${fakeId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({ title: 'Updated Title' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should allow partial updates', async () => {
      const partialUpdate = {
        title: 'Only Title Updated',
      };

      const response = await request(app.getHttpServer())
        .put(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(partialUpdate)
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe('Lesson updated successfully');
    });
  });

  describe('PATCH /lessons/:id/products', () => {
    let lessonId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(mockLesson1);

      lessonId = response.body.id;
    });

    it('should update lesson products as admin', async () => {
      const productIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013',
      ];

      const response = await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({ productIds })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', lessonId);
      expect(response.body.message).toBe(
        'Lesson products updated successfully',
      );
    });

    it('should update lesson products as mua', async () => {
      const productIds = ['507f1f77bcf86cd799439011'];

      const response = await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .send({ productIds })
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe(
        'Lesson products updated successfully',
      );
    });

    it('should reject update by client role', async () => {
      const productIds = ['507f1f77bcf86cd799439011'];

      await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .send({ productIds })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should validate productIds format', async () => {
      const invalidProductIds = ['invalid-id'];

      await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({ productIds: invalidProductIds })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should require productIds array', async () => {
      await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle empty productIds array', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/lessons/${lessonId}/products`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({ productIds: [] })
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe(
        'Lesson products updated successfully',
      );
    });

    it('should return 404 for non-existent lesson', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .patch(`/lessons/${fakeId}/products`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({ productIds: [] })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /lessons/:id', () => {
    let lessonId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send(mockLesson1);

      lessonId = response.body.id;
    });

    it('should delete lesson as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', lessonId);
      expect(response.body.message).toBe('Lesson deleted successfully');

      await request(app.getHttpServer())
        .get(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete lesson as mua', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe('Lesson deleted successfully');
    });

    it('should reject deletion by client role', async () => {
      await request(app.getHttpServer())
        .delete(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${auth.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent lesson', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .delete(`/lessons/${fakeId}`)
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .delete('/lessons/invalid-id')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/lessons/${lessonId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Access Control', () => {
    it('should enforce JWT authentication on all endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/lessons' },
        { method: 'get', path: '/lessons' },
        { method: 'get', path: '/lessons/507f1f77bcf86cd799439011' },
        { method: 'put', path: '/lessons/507f1f77bcf86cd799439011' },
        { method: 'patch', path: '/lessons/507f1f77bcf86cd799439011/products' },
        { method: 'delete', path: '/lessons/507f1f77bcf86cd799439011' },
      ];

      for (const endpoint of endpoints) {
        await request(app.getHttpServer())
          [endpoint.method](endpoint.path)
          .expect(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should enforce role-based access control', async () => {
      const restrictedEndpoints = [
        { method: 'post', path: '/lessons', data: mockLesson1 },
        {
          method: 'put',
          path: '/lessons/507f1f77bcf86cd799439011',
          data: { title: 'Updated' },
        },
        {
          method: 'patch',
          path: '/lessons/507f1f77bcf86cd799439011/products',
          data: { productIds: [] },
        },
        { method: 'delete', path: '/lessons/507f1f77bcf86cd799439011' },
      ];

      for (const endpoint of restrictedEndpoints) {
        const request_builder = request(app.getHttpServer())
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${auth.clientToken}`);

        if (endpoint.data) {
          request_builder.send(endpoint.data);
        }

        await request_builder.expect(HttpStatus.FORBIDDEN);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request bodies gracefully', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send('invalid json')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle invalid route parameters', async () => {
      await request(app.getHttpServer())
        .get('/lessons/not-an-object-id')
        .set('Authorization', `Bearer ${auth.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
