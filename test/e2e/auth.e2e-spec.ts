import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { CookieHelper } from '../helpers/cookie.helper';
import { DatabaseHelper, TestDatabaseModule } from '../helpers/database.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let configService: ConfigService;
  let mongoConnection: Connection;

  const testUser = {
    username: 'testuser',
    password: 'testpass123',
    role: 'client' as const,
  };

  const adminUser = {
    username: 'admin',
    password: 'adminpass123',
    role: 'admin' as const,
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
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use(cookieParser());

    await app.init();

    usersService = moduleFixture.get<UsersService>(UsersService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await DatabaseHelper.closeConnection();
    await app.close();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase(mongoConnection);
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const dto: RegisterDto = {
        username: 'newuser',
        password: 'newpass123',
        confirmPassword: 'newpass123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        message: 'Account created successfully',
      });

      const createdUser = await usersService.findByUsername('newuser');
      expect(createdUser).toBeTruthy();
      expect(createdUser?.username).toBe('newuser');
      expect(createdUser?.role).toBe('client');

      const isPasswordHashed = await bcrypt.compare(
        'newpass123',
        createdUser?.password!,
      );
      expect(isPasswordHashed).toBe(true);
    });

    it('should reject registration with duplicate username', async () => {
      await usersService.create({
        username: testUser.username,
        password: await bcrypt.hash(testUser.password, 10),
        role: testUser.role,
      });

      const dto: RegisterDto = {
        username: testUser.username,
        password: 'anotherpass123',
        confirmPassword: 'anotherpass123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto)
        .expect(HttpStatus.CONFLICT);

      expect(response.body.message).toBe('Username already in use');
    });

    it('should reject registration with invalid data', async () => {
      const invalidDto = {
        username: '', // Empty username
        password: '123', // Too short password
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject registration with missing fields', async () => {
      const incompleteDto = {
        username: 'testuser',
        // Missing password
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await usersService.create({
        username: testUser.username,
        password: await bcrypt.hash(testUser.password, 10),
        role: testUser.role,
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        username: testUser.username,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        role: testUser.role,
        userId: expect.any(String),
        username: testUser.username,
      });

      const jwtCookie = CookieHelper.extractJwtCookie(response);
      expect(jwtCookie).toBeTruthy();
      expect(jwtCookie).toContain('HttpOnly');
    });

    it('should reject login with invalid username', async () => {
      const dto: LoginDto = {
        username: 'nonexistent',
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(dto)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe('Username or password is incorrect');
    });

    it('should reject login with invalid password', async () => {
      const dto: LoginDto = {
        username: testUser.username,
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(dto)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe('Username or password is incorrect');
    });

    it('should clear existing refresh token on login', async () => {
      const firstLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(HttpStatus.OK);

      const firstJwtCookie = CookieHelper.extractJwtCookie(firstLogin);

      const secondLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Cookie', firstJwtCookie || '')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
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
      await usersService.create({
        username: testUser.username,
        password: await bcrypt.hash(testUser.password, 10),
        role: testUser.role,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      jwtCookie = CookieHelper.extractJwtCookie(loginResponse) || '';
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', jwtCookie)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        role: testUser.role,
        userId: expect.any(String),
        username: testUser.username,
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
      await usersService.create({
        username: testUser.username,
        password: await bcrypt.hash(testUser.password, 10),
        role: testUser.role,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });

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
        username: 'flowtest',
        password: 'flowtest123',
        confirmPassword: 'flowtest123',
      };

      const loginDto: LoginDto = {
        username: 'flowtest',
        password: 'flowtest123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
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
      await usersService.create({
        username: testUser.username,
        password: await bcrypt.hash(testUser.password, 10),
        role: testUser.role,
      });

      const login1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(HttpStatus.OK);

      const login2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(HttpStatus.OK);

      expect(login1.body.accessToken).not.toBe(login2.body.accessToken);

      const cookie1 = CookieHelper.extractJwtCookie(login1);
      const cookie2 = CookieHelper.extractJwtCookie(login2);

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
    it('should not expose sensitive user data in responses', async () => {
      await usersService.create({
        username: testUser.username,
        password: await bcrypt.hash(testUser.password, 10),
        role: testUser.role,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.body).not.toHaveProperty('refreshTokens');
    });

    it('should use secure cookie settings', async () => {
      await usersService.create({
        username: testUser.username,
        password: await bcrypt.hash(testUser.password, 10),
        role: testUser.role,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      const jwtCookie = CookieHelper.extractJwtCookie(response);

      expect(jwtCookie).toContain('HttpOnly');
      expect(jwtCookie).toContain('SameSite=Lax');
    });
  });
});
