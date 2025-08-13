import { Test, TestingModule } from '@nestjs/testing';

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockTokenService: jest.Mocked<TokenService>;

  const mockUser = {
    id: 'user-id',
    username: 'testuser',
    password: 'hashedpass',
    role: 'client',
    refreshTokens: ['rt1'],
    save: jest.fn(),
  } as any;

  beforeEach(async () => {
    mockUsersService = {
      findByUsername: jest.fn(),
      findByRefreshToken: jest.fn(),
      updateRefreshTokens: jest.fn(),
      create: jest.fn(),
    } as any;

    mockTokenService = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      filterRefreshTokens: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginUser', () => {
    const dto: LoginDto = { username: 'testuser', password: 'pass' };

    it('should throw if user not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(service.loginUser(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if password mismatch', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.loginUser(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should login and return tokens', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockTokenService.signAccessToken.mockReturnValue('at');
      mockTokenService.signRefreshToken.mockReturnValue('rt');
      mockTokenService.filterRefreshTokens.mockReturnValue(['rt1']);
      mockUsersService.findByRefreshToken.mockResolvedValue(mockUser);

      const result = await service.loginUser(dto, 'oldrt');

      expect(mockTokenService.signAccessToken).toHaveBeenCalledWith({
        role: 'client',
        userId: 'user-id',
        username: 'testuser',
      });
      expect(result).toEqual({
        accessToken: 'at',
        refreshToken: 'rt',
        user: { role: 'client', userId: 'user-id', username: 'testuser' },
      });
    });

    it('should clear tokens if refresh token reuse detected', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockTokenService.signAccessToken.mockReturnValue('at');
      mockTokenService.signRefreshToken.mockReturnValue('rt');
      mockTokenService.filterRefreshTokens.mockReturnValue(['rt1']);
      mockUsersService.findByRefreshToken.mockResolvedValue(null);

      await service.loginUser(dto, 'stolenrt');

      expect(mockTokenService.filterRefreshTokens).toHaveBeenCalledWith(
        ['rt1'],
        'stolenrt',
      );
    });
  });

  describe('logoutUser', () => {
    it('should return false if no user found', async () => {
      mockUsersService.findByRefreshToken.mockResolvedValue(null);

      const result = await service.logoutUser('rt');
      expect(result).toBe(false);
    });

    it('should remove refresh token and return true', async () => {
      mockUsersService.findByRefreshToken.mockResolvedValue(mockUser);
      mockTokenService.filterRefreshTokens.mockReturnValue([]);

      const result = await service.logoutUser('rt');
      expect(result).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should throw if no token provided', async () => {
      await expect(service.refreshToken('')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw and clear tokens if reuse detected', async () => {
      mockUsersService.findByRefreshToken.mockResolvedValue(null);
      mockTokenService.verifyRefreshToken.mockReturnValue({
        username: 'testuser',
      } as any);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.refreshToken('rt')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUser.refreshTokens).toEqual([]);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should remove expired token and throw', async () => {
      mockUsersService.findByRefreshToken.mockResolvedValue(mockUser);
      mockTokenService.verifyRefreshToken.mockImplementation(() => {
        throw new TokenExpiredError('expired', new Date());
      });
      mockTokenService.filterRefreshTokens.mockReturnValue([]);

      await expect(service.refreshToken('rt')).rejects.toThrow(
        TokenExpiredError,
      );
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw if username mismatch', async () => {
      mockUsersService.findByRefreshToken.mockResolvedValue(mockUser);
      mockTokenService.verifyRefreshToken.mockReturnValue({
        username: 'other',
      } as any);

      await expect(service.refreshToken('rt')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should refresh tokens and return result', async () => {
      mockUsersService.findByRefreshToken.mockResolvedValue(mockUser);
      mockTokenService.verifyRefreshToken.mockReturnValue({
        username: 'testuser',
      } as any);
      mockTokenService.signAccessToken.mockReturnValue('newat');
      mockTokenService.signRefreshToken.mockReturnValue('newrt');
      mockTokenService.filterRefreshTokens.mockReturnValue(['rt1']);

      const result = await service.refreshToken('rt');
      expect(result).toEqual({
        accessToken: 'newat',
        refreshToken: 'newrt',
        user: { role: 'client', userId: 'user-id', username: 'testuser' },
      });
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('registerUser', () => {
    const dto: RegisterDto = {
      username: 'testuser',
      password: 'pass',
      confirmPassword: 'pass',
    };

    it('should throw if username exists', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.registerUser(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create user with hashed password', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      await service.registerUser(dto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'hashed',
        role: 'client',
      });
    });
  });
});
