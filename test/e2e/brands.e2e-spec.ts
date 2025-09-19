import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Types } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BrandsModule } from 'src/modules/brands/brands.module';
import { CreateBrandDto } from 'src/modules/brands/dto/create-brand.dto';
import { UpdateBrandDto } from 'src/modules/brands/dto/update-brand.dto';
import { UsersModule } from 'src/modules/users/users.module';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';
import { ResourceHelper } from 'test/helpers/resource.helper';

describe('Brands (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  let tokens: AuthTokens;
  let brandId: Types.ObjectId;
  const mockBrand = TestDataFactory.createBrand();

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
    await DatabaseHelper.clearCollection(connection, 'brands');
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /brands', () => {
    it('should create a brand as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(mockBrand)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Brand created successfully');
    });

    it('should reject creation by mua role', async () => {
      await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(mockBrand)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation by client role', async () => {
      await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(mockBrand)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/brands')
        .send(mockBrand)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject invalid JWT token', async () => {
      await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', 'Bearer invalid-token')
        .send(mockBrand)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /brands', () => {
    beforeEach(async () => {
      await ResourceHelper.createMultipleBrands(app, tokens.adminToken, 3);
    });

    it('should allow admin to get all brands', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);

      response.body.forEach((brand: CreateBrandDto) => {
        expect(brand).toHaveProperty('name');
      });
    });

    it('should allow mua to get all brands', async () => {
      await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);
    });

    it('should reject regular clients', async () => {
      await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('PUT /brands/:id', () => {
    let updateDto: UpdateBrandDto;

    beforeEach(async () => {
      const { id } = await ResourceHelper.createBrand(app, tokens.adminToken);

      brandId = id;

      updateDto = { name: 'Updated Brand' };
    });

    it('should update a brand as admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Brand updated successfully');
    });

    it('should reject update by mua role', async () => {
      await request(app.getHttpServer())
        .put(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject update by client role', async () => {
      await request(app.getHttpServer())
        .put(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent brand', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .put(`/brands/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/brands/${brandId}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail to update with invalid ObjectId', async () => {
      const invalidId = 'invalid-id';

      await request(app.getHttpServer())
        .put(`/brands/${invalidId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /brands/:id', () => {
    beforeEach(async () => {
      const { id } = await ResourceHelper.createBrand(app, tokens.adminToken);

      brandId = id;
    });

    it('should delete a brand as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Brand deleted successfully');

      await request(app.getHttpServer())
        .get(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should reject deletion by mua role', async () => {
      await request(app.getHttpServer())
        .delete(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject deletion by client role', async () => {
      await request(app.getHttpServer())
        .delete(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent brand', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .delete(`/brands/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail to delete with invalid ObjectId', async () => {
      await request(app.getHttpServer())
        .delete(`/brands/invalid-id`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('JWT Token Edge Cases', () => {
    it('should reject malformed tokens', async () => {
      await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', 'Bearer not.a.jwt.token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', 'InvalidHeaderFormat')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
