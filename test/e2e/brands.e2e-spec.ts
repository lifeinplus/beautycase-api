import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BrandsModule } from 'src/modules/brands/brands.module';
import { CreateBrandDto } from 'src/modules/brands/dto/create-brand.dto';
import { UpdateBrandDto } from 'src/modules/brands/dto/update-brand.dto';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UsersModule } from 'src/modules/users/users.module';
import { UsersService } from 'src/modules/users/users.service';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';

describe('Brands (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;

  let usersService: UsersService;

  let adminToken: string;
  let muaToken: string;
  let clientToken: string;

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
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
    usersService = moduleFixture.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await DatabaseHelper.closeConnection();
    await app.close();
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
    await DatabaseHelper.clearDatabase(mongoConnection);
  });

  describe('/brands (POST)', () => {
    it('should create a brand successfully with valid admin token', async () => {
      const dto: CreateBrandDto = {
        name: 'Test Brand',
      };

      const response = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'message',
        'Brand created successfully',
      );
    });

    it('should reject invalid JWT token', async () => {
      const dto: CreateBrandDto = {
        name: 'Test Brand',
      };

      await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', 'Bearer invalid-token')
        .send(dto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject request without authorization header', async () => {
      const dto: CreateBrandDto = {
        name: 'Test Brand',
      };

      await request(app.getHttpServer())
        .post('/brands')
        .send(dto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject non-admin users', async () => {
      const dto: CreateBrandDto = {
        name: 'Test Brand',
      };

      await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${muaToken}`)
        .send(dto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('/brands (GET)', () => {
    beforeEach(async () => {
      const brandModel = app.get('BrandModel');
      await brandModel.create([
        { name: 'Brand A' },
        { name: 'Brand B' },
        { name: 'Brand C' },
      ]);
    });

    it('should allow admin to get all brands', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(3);
    });

    it('should allow mua to get all brands', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', `Bearer ${muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(3);
    });

    it('should reject regular clients', async () => {
      await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('/brands/:id (PUT)', () => {
    let brandId: string;

    beforeEach(async () => {
      const brandModel = app.get('BrandModel');
      const brand = await brandModel.create({
        name: 'Original Brand',
      });
      brandId = brand.id;
    });

    it('should update a brand successfully with admin role', async () => {
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      const response = await request(app.getHttpServer())
        .put(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'message',
        'Brand updated successfully',
      );
    });

    it('should fail to update a non-existent brand', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      await request(app.getHttpServer())
        .put(`/brands/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail to update with invalid ObjectId', async () => {
      const invalidId = 'invalid-id';

      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      await request(app.getHttpServer())
        .put(`/brands/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail to update without admin role', async () => {
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      await request(app.getHttpServer())
        .put(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${muaToken}`)
        .send(dto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('/brands/:id (DELETE)', () => {
    let brandId: string;

    beforeEach(async () => {
      const brandModel = app.get('BrandModel');
      const brand = await brandModel.create({
        name: 'Brand to Delete',
      });
      brandId = brand._id.toString();
    });

    it('should delete a brand successfully with admin role', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'message',
        'Brand deleted successfully',
      );

      const brandModel = app.get('BrandModel');
      const deletedBrand = await brandModel.findById(brandId);
      expect(deletedBrand).toBeNull();
    });

    it('should fail to delete a non-existent brand', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .delete(`/brands/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail to delete with invalid ObjectId', async () => {
      const invalidId = 'invalid-id';

      await request(app.getHttpServer())
        .delete(`/brands/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail to delete without admin role', async () => {
      await request(app.getHttpServer())
        .delete(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${muaToken}`)
        .expect(HttpStatus.FORBIDDEN);
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
