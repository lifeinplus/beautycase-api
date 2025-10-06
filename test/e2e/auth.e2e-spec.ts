import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { LoginDto } from 'src/modules/auth/dto/login.dto';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { UsersModule } from 'src/modules/users/users.module';
import { UsersService } from 'src/modules/users/users.service';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { AuthHelper } from 'test/helpers/auth.helper';
import { CookieHelper } from '../helpers/cookie.helper';
import { DatabaseHelper, TestDatabaseModule } from '../helpers/database.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let usersService: UsersService;

  const mockUser = TestDataFactory.createClientUser();

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
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use(cookieParser());

    connection = moduleFixture.get<Connection>(getConnectionToken());
    usersService = moduleFixture.get<UsersService>(UsersService);

    await app.init();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase(connection);
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const dto: RegisterDto = {
        ...mockUser,
        confirmPassword: mockUser.password,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto)
        .expect(HttpStatus.CREATED);

      const createdUser = await usersService.findByUsername('client');
      expect(createdUser).toBeTruthy();
      expect(createdUser?.username).toBe('client');
      expect(createdUser?.role).toBe('client');

      const isPasswordHashed = await bcrypt.compare(
        'client123',
        createdUser?.password!,
      );
      expect(isPasswordHashed).toBe(true);
    });

    it('should reject registration with duplicate username', async () => {
      await AuthHelper.createClientUser(app);

      const duplicatedDto: RegisterDto = {
        ...mockUser,
        confirmPassword: mockUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(duplicatedDto)
        .expect(HttpStatus.CONFLICT);

      expect(response.body.code).toBe('REGISTER_ERROR');
    });

    it('should reject registration with invalid data', async () => {
      const invalidDto: RegisterDto = {
        username: '',
        password: '123',
        confirmPassword: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject registration with missing fields', async () => {
      const incompleteDto: Partial<RegisterDto> = {
        username: 'testuser',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await AuthHelper.createClientUser(app);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUser)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        role: mockUser.role,
        userId: expect.any(String),
        username: mockUser.username,
      });

      const jwtCookie = CookieHelper.extractJwtCookie(response);
      expect(jwtCookie).toBeTruthy();
      expect(jwtCookie).toContain('HttpOnly');
    });

    it('should reject login with invalid username', async () => {
      const loginDto: LoginDto = {
        ...mockUser,
        username: 'nonexistent',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.code).toBe('LOGIN_ERROR');
    });

    it('should reject login with invalid password', async () => {
      const loginDto: LoginDto = {
        ...mockUser,
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.code).toBe('LOGIN_ERROR');
    });

    it('should clear existing refresh token on login', async () => {
      const firstLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUser)
        .expect(HttpStatus.OK);

      const firstJwtCookie = CookieHelper.extractJwtCookie(firstLogin);

      const secondLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Cookie', firstJwtCookie || '')
        .send(mockUser)
        .expect(HttpStatus.OK);

      expect(secondLogin.body.accessToken).not.toBe(
        firstLogin.body.accessToken,
      );

      const setCookie = secondLogin.headers['set-cookie'];
      const setCookieHeaders = Array.isArray(setCookie)
        ? setCookie
        : [setCookie];

      const clearCookieHeader = setCookieHeaders.find((header: string) =>
        header.includes('jwt=;'),
      );

      expect(clearCookieHeader).toBeTruthy();
    });
  });

  describe('GET /auth/refresh', () => {
    let jwtCookie: string;

    beforeEach(async () => {
      await AuthHelper.createClientUser(app);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUser);

      jwtCookie = CookieHelper.extractJwtCookie(loginResponse) || '';
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', jwtCookie)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        role: mockUser.role,
        userId: expect.any(String),
        username: mockUser.username,
      });

      const newJwtCookie = CookieHelper.extractJwtCookie(response) || '';
      expect(newJwtCookie).toBeTruthy();
      expect(newJwtCookie).not.toBe(jwtCookie);
    });

    it('should reject refresh without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/refresh')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should detect refresh token reuse', async () => {
      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', jwtCookie)
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', jwtCookie)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /auth/logout', () => {
    let jwtCookie: string;

    beforeEach(async () => {
      await AuthHelper.createClientUser(app);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUser);

      jwtCookie = CookieHelper.extractJwtCookie(loginResponse) || '';
    });

    it('should logout successfully with valid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', jwtCookie)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should reject logout without refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBe('No refresh token provided');
    });

    it('should reject logout with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', 'jwt=invalid-token')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow using refresh token after logout', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', jwtCookie)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', jwtCookie)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full auth cycle: register -> login -> refresh -> logout', async () => {
      const registerDto: RegisterDto = {
        ...mockUser,
        confirmPassword: mockUser.password,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUser)
        .expect(HttpStatus.OK);

      const jwtCookie = CookieHelper.extractJwtCookie(loginResponse);

      const refreshResponse = await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', jwtCookie || '')
        .expect(HttpStatus.OK);

      const newJwtCookie = CookieHelper.extractJwtCookie(refreshResponse);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', newJwtCookie || '')
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', newJwtCookie || '')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle multiple concurrent logins', async () => {
      await AuthHelper.createClientUser(app);

      const loginResponse1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUser)
        .expect(HttpStatus.OK);

      const loginResponse2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUser)
        .expect(HttpStatus.OK);

      expect(loginResponse1.body.accessToken).not.toBe(
        loginResponse2.body.accessToken,
      );

      const cookie1 = CookieHelper.extractJwtCookie(loginResponse1);
      const cookie2 = CookieHelper.extractJwtCookie(loginResponse2);

      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', cookie1 || '')
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', cookie2 || '')
        .expect(HttpStatus.OK);
    });
  });

  describe('Security Tests', () => {
    beforeEach(async () => {
      await AuthHelper.createClientUser(app);
    });

    it('should not expose sensitive user data in responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUser)
        .expect(HttpStatus.OK);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.body).not.toHaveProperty('refreshTokens');
    });

    it('should use secure cookie settings', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUser)
        .expect(HttpStatus.OK);

      const jwtCookie = CookieHelper.extractJwtCookie(response);

      expect(jwtCookie).toContain('HttpOnly');
      expect(jwtCookie).toContain('SameSite=Lax');
    });
  });
});
