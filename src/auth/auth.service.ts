import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './token.service';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    role: string;
    userId: string;
    username: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  async loginUser(
    credentials: LoginDto,
    existingRefreshToken?: string,
  ): Promise<LoginResult> {
    const foundUser = await this.usersService.getByUsername(
      credentials.username,
    );

    if (!foundUser) {
      throw new UnauthorizedException('Username or password is incorrect');
    }

    const isMatch = await bcrypt.compare(
      credentials.password,
      foundUser.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Username or password is incorrect');
    }

    const accessToken = this.tokenService.signAccessToken({
      role: foundUser.role,
      userId: foundUser.id,
      username: foundUser.username,
    });

    const refreshToken = this.tokenService.signRefreshToken(foundUser.username);

    let refreshTokenArray = this.tokenService.filterRefreshTokens(
      foundUser.refreshTokens,
      existingRefreshToken,
    );

    if (existingRefreshToken) {
      // Scenario:
      // 1. User logins, never uses RT, doesn't logout
      // 2. RT is stolen
      // 3. Clear all RTs when user logins
      const foundToken =
        await this.usersService.getByRefreshToken(existingRefreshToken);

      if (!foundToken) {
        this.logger.warn('Attempted refresh token reuse at /auth/login');
        refreshTokenArray = [];
      }
    }

    await this.usersService.updateRefreshTokens(foundUser.id, [
      ...refreshTokenArray,
      refreshToken,
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        role: foundUser.role,
        userId: foundUser.id,
        username: foundUser.username,
      },
    };
  }
}
