import { Test, TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { AuthUser } from './types/auth.types';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const configMap: Record<string, string> = {
          ACCESS_TOKEN_SECRET: 'access-secret',
          ACCESS_TOKEN_EXPIRES_IN: '15m',
          REFRESH_TOKEN_SECRET: 'refresh-secret',
          REFRESH_TOKEN_EXPIRES_IN: '7d',
        };
        return configMap[key];
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('filterRefreshTokens', () => {
    it('should remove specific token from list', () => {
      const tokens = ['t1', 't2', 't3'];
      const result = service.filterRefreshTokens(tokens, 't2');
      expect(result).toEqual(['t1', 't3']);
    });

    it('should return same array if tokenToRemove not provided', () => {
      const tokens = ['t1', 't2'];
      const result = service.filterRefreshTokens(tokens);
      expect(result).toEqual(['t1', 't2']);
    });
  });

  describe('signAccessToken', () => {
    it('should sign access token with correct payload and config', () => {
      const user: AuthUser = {
        role: 'client',
        userId: 'uid1',
        username: 'john',
      };

      jwtService.sign.mockReturnValue('signed-access-token');

      const token = service.signAccessToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          role: 'client',
          userId: 'uid1',
          username: 'john',
        },
        {
          secret: 'access-secret',
          expiresIn: '15m',
        },
      );
      expect(token).toBe('signed-access-token');
    });
  });

  describe('signRefreshToken', () => {
    it('should sign refresh token with username and config', () => {
      jwtService.sign.mockReturnValue('signed-refresh-token');

      const token = service.signRefreshToken('john');

      expect(jwtService.sign).toHaveBeenCalledWith(
        { username: 'john' },
        {
          secret: 'refresh-secret',
          expiresIn: '7d',
        },
      );
      expect(token).toBe('signed-refresh-token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token using config secret', () => {
      const payload = {
        role: 'client',
        userId: 'uid1',
        username: 'john',
      };
      jwtService.verify.mockReturnValue(payload);

      const result = service.verifyRefreshToken('refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('refresh-token', {
        secret: 'refresh-secret',
      });
      expect(result).toBe(payload);
    });
  });
});
