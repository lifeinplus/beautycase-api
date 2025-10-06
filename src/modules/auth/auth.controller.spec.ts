import { Test, TestingModule } from '@nestjs/testing';

import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TestDataFactory } from 'test/factories/test-data.factory';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockCookieOptions = { httpOnly: true, secure: true };
  const mockUser = TestDataFactory.createClientUser();

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

  describe('loginUser', () => {
    it('should login user and set cookie', async () => {
      const req: any = { cookies: {} };
      const res: any = { clearCookie: jest.fn(), cookie: jest.fn() };

      mockAuthService.loginUser.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        user: {
          userId: 'u1',
          username: mockUser.username,
          role: mockUser.role!,
        },
      });

      const result = await controller.loginUser(mockUser, req, res);

      expect(mockAuthService.loginUser).toHaveBeenCalledWith(
        mockUser,
        undefined,
      );
      expect(res.cookie).toHaveBeenCalledWith('jwt', 'rt', mockCookieOptions);
      expect(result).toEqual({
        accessToken: 'at',
        userId: 'u1',
        username: mockUser.username,
        role: mockUser.role,
      });
    });

    it('should clear old cookie if refreshToken exists', async () => {
      const req: any = { cookies: { jwt: 'oldrt' } };
      const res: any = { clearCookie: jest.fn(), cookie: jest.fn() };

      mockAuthService.loginUser.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        user: {
          userId: 'u1',
          username: mockUser.username,
          role: mockUser.role || '',
        },
      });

      await controller.loginUser(mockUser, req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('jwt');
    });
  });

  describe('logoutUser', () => {
    it('should call logout service', async () => {
      mockAuthService.logoutUser.mockResolvedValue(true);

      const result = await controller.logoutUser('rt');
      expect(mockAuthService.logoutUser).toHaveBeenCalledWith('rt');
      expect(result).toBeUndefined();
    });

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
        user: {
          userId: 'u1',
          username: mockUser.username,
          role: mockUser.role!,
        },
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
        userId: 'u1',
        username: mockUser.username,
        role: mockUser.role!,
      });
    });
  });

  describe('registerUser', () => {
    it('should call register service and return success message', async () => {
      const dto: RegisterDto = {
        ...mockUser,
        confirmPassword: mockUser.password,
      };

      mockAuthService.registerUser.mockResolvedValue(undefined);
      const result = await controller.registerUser(dto);

      expect(mockAuthService.registerUser).toHaveBeenCalledWith(dto);
    });
  });
});
