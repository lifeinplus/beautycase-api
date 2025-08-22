import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { CreateCategoryDto } from 'src/modules/categories/dto/create-category.dto';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UsersModule } from 'src/modules/users/users.module';
import { UsersService } from 'src/modules/users/users.service';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let usersService: UsersService;

  let adminToken: string;
  let muaToken: string;
  let clientToken: string;

  const mockCategory1: CreateCategoryDto = {
    name: 'basic',
    type: 'makeup_bag',
  };

  const mockCategory2: CreateCategoryDto = {
    name: 'luxury',
    type: 'makeup_bag',
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
        CategoriesModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    usersService = moduleFixture.get<UsersService>(UsersService);

    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  beforeEach(async () => {
    const adminDto: CreateUserDto = {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
    };

    const muaDto: CreateUserDto = {
      username: 'mua',
      password: 'mua123',
      role: 'mua',
    };

    const clientDto: CreateUserDto = {
      username: 'client',
      password: 'client123',
      role: 'client',
    };

    await usersService.create({
      ...adminDto,
      password: await bcrypt.hash(adminDto.password, 10),
    });

    await usersService.create({
      ...muaDto,
      password: await bcrypt.hash(muaDto.password, 10),
    });

    await usersService.create({
      ...clientDto,
      password: await bcrypt.hash(clientDto.password, 10),
    });

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(adminDto)
      .expect(HttpStatus.OK);

    const muaResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(muaDto)
      .expect(HttpStatus.OK);

    const clientResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(clientDto)
      .expect(HttpStatus.OK);

    adminToken = adminResponse.body.accessToken;
    muaToken = muaResponse.body.accessToken;
    clientToken = clientResponse.body.accessToken;
  });

  afterEach(async () => {
    await DatabaseHelper.clearDatabase(connection);
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /categories', () => {
    describe('Authentication & Authorization', () => {
      it('should reject requests without authentication token', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .send(mockCategory1)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Unauthorized');
      });

      it('should reject requests with invalid token', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', 'Bearer invalid-token')
          .send(mockCategory1)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('message');
      });

      it('should reject requests from users without required roles', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${clientToken}`)
          .send(mockCategory1)
          .expect(HttpStatus.FORBIDDEN);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Forbidden');
      });

      it('should allow admin users to create categories', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(mockCategory1)
          .expect(HttpStatus.CREATED);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty(
          'message',
          'Category created successfully',
        );
      });

      it('should allow mua users to create categories', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${muaToken}`)
          .send(mockCategory1)
          .expect(HttpStatus.CREATED);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty(
          'message',
          'Category created successfully',
        );
      });
    });

    describe('Validation', () => {
      it('should reject empty string values', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: '', type: '' })
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should reject non-string values', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 123, type: true })
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should accept valid category data', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(mockCategory1)
          .expect(HttpStatus.CREATED);

        expect(response.body).toHaveProperty('id');
        expect(typeof response.body.id).toBe('string');
        expect(response.body).toHaveProperty(
          'message',
          'Category created successfully',
        );
      });
    });

    describe('Business Logic', () => {
      it('should create category with all provided fields', async () => {
        const categoryData = {
          name: 'Luxury Collection',
          type: 'premium_bag',
        };

        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(categoryData)
          .expect(HttpStatus.CREATED);

        expect(response.body).toHaveProperty('id');
        expect(response.body.message).toBe('Category created successfully');

        const getResponse = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(HttpStatus.OK);

        expect(getResponse.body).toHaveLength(1);
        expect(getResponse.body[0]).toHaveProperty('name', categoryData.name);
        expect(getResponse.body[0]).toHaveProperty('type', categoryData.type);
      });
    });
  });

  describe('GET /categories', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockCategory1);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockCategory2);
    });

    describe('Authentication & Authorization', () => {
      it('should reject requests without authentication token', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Unauthorized');
      });

      it('should reject requests with invalid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', 'Bearer invalid-token')
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('message');
      });

      it('should reject requests from users without required roles', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', `Bearer ${clientToken}`);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Forbidden');
      });

      it('should allow admin users to get categories', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(HttpStatus.OK);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should allow mua users to get categories', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', `Bearer ${muaToken}`)
          .expect(HttpStatus.OK);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });

    describe('Data Retrieval', () => {
      it('should return all categories with correct structure', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(HttpStatus.OK);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);

        response.body.forEach((category: any) => {
          expect(category).toHaveProperty('_id');
          expect(category).toHaveProperty('name');
          expect(category).toHaveProperty('type');
          expect(typeof category.name).toBe('string');
          expect(typeof category.type).toBe('string');
        });
      });

      it('should return categories in insertion order', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(HttpStatus.OK);

        expect(response.body[0].name).toBe('basic');
        expect(response.body[1].name).toBe('luxury');
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);

      const createResponse = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockCategory1)
        .expect(HttpStatus.CREATED);

      expect(createResponse.body).toHaveProperty('id');

      const getResponse = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0]).toHaveProperty('name', 'basic');
      expect(getResponse.body[0]).toHaveProperty('type', 'makeup_bag');
    });

    it('should handle multiple categories creation and retrieval', async () => {
      const categories = [
        { name: 'Category 1', type: 'type_1' },
        { name: 'Category 2', type: 'type_2' },
        { name: 'Category 3', type: 'type_3' },
      ];

      for (const category of categories) {
        await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(category)
          .expect(HttpStatus.CREATED);
      }

      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(3);
      expect(response.body.map((c: CreateCategoryDto) => c.name)).toEqual([
        'Category 1',
        'Category 2',
        'Category 3',
      ]);
    });

    it('should maintain data consistency across different user roles', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockCategory1)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${muaToken}`)
        .send(mockCategory2)
        .expect(HttpStatus.CREATED);

      const adminResponse = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      const muaResponse = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${muaToken}`)
        .expect(HttpStatus.OK);

      expect(adminResponse.body).toHaveLength(2);
      expect(muaResponse.body).toHaveLength(2);
      expect(adminResponse.body).toEqual(muaResponse.body);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "test", "type":}') // Invalid JSON
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('message');
    });
  });
});
