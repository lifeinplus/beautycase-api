import { Test, TestingModule } from '@nestjs/testing';

import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockCookieOptions = { httpOnly: true, secure: true };

  beforeEach(async () => {
    mockAuthService = {
      loginUser: jest.fn(),
      logoutUser: jest.fn(),
      refreshToken: jest.fn(),
      registerUser: jest.fn(),
    } as any;

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'auth.cookieOptions') return mockCookieOptions;
        return undefined;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },

        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginUser', () => {
    it('should login user and set cookie', async () => {
      const dto: LoginDto = { username: 'john', password: 'pass' };
      const req: any = { cookies: {} };
      const res: any = {
        clearCookie: jest.fn(),
        cookie: jest.fn(),
      };

      mockAuthService.loginUser.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        user: { role: 'client', userId: 'u1', username: 'john' },
      });

      const result = await controller.loginUser(dto, req, res);

      expect(mockAuthService.loginUser).toHaveBeenCalledWith(dto, undefined);
      expect(res.cookie).toHaveBeenCalledWith('jwt', 'rt', mockCookieOptions);
      expect(result).toEqual({
        accessToken: 'at',
        role: 'client',
        userId: 'u1',
        username: 'john',
      });
    });

    it('should clear old cookie if refreshToken exists', async () => {
      const dto: LoginDto = { username: 'john', password: 'pass' };
      const req: any = { cookies: { jwt: 'oldrt' } };
      const res: any = { clearCookie: jest.fn(), cookie: jest.fn() };

      mockAuthService.loginUser.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        user: { role: 'client', userId: 'u1', username: 'john' },
      });

      await controller.loginUser(dto, req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('jwt');
    });
  });

  describe('logoutUser', () => {
    it('should throw if no refresh token', async () => {
      await expect(controller.logoutUser(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if session not found', async () => {
      mockAuthService.logoutUser.mockResolvedValue(false);

      await expect(controller.logoutUser('rt')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call logout service', async () => {
      mockAuthService.logoutUser.mockResolvedValue(true);

      const result = await controller.logoutUser('rt');
      expect(mockAuthService.logoutUser).toHaveBeenCalledWith('rt');
      expect(result).toBeUndefined(); // since controller returns nothing
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and set cookie', async () => {
      const req: any = { cookies: { jwt: 'rt' } };
      const res: any = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'newat',
        refreshToken: 'newrt',
        user: { role: 'client', userId: 'u1', username: 'john' },
      });

      await controller.refreshToken(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('jwt');
      expect(res.cookie).toHaveBeenCalledWith(
        'jwt',
        'newrt',
        mockCookieOptions,
      );
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: 'newat',
        role: 'client',
        userId: 'u1',
        username: 'john',
      });
    });
  });

  describe('registerUser', () => {
    it('should call register service and return success message', async () => {
      const dto: RegisterDto = {
        username: 'john',
        password: 'pass1234',
        confirmPassword: 'pass1234',
      };

      mockAuthService.registerUser.mockResolvedValue(undefined);

      const result = await controller.registerUser(dto);

      expect(mockAuthService.registerUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        message: 'Account created successfully',
      });
    });
  });
});
