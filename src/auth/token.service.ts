import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { AuthUser, UserJwtPayload } from './types/auth.types';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  filterRefreshTokens(
    existingTokens: string[],
    tokenToRemove?: string,
  ): string[] {
    return existingTokens.filter((token) => token !== tokenToRemove);
  }

  signAccessToken(user: AuthUser): string {
    const { role, userId, username } = user;
    const payload = { role, userId, username };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN'),
    });
  }

  signRefreshToken(username: string): string {
    const payload = { username };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
    });
  }

  verifyRefreshToken(token: string): UserJwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
    });
  }
}
