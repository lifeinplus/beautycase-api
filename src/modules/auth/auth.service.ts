import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './token.service';
import type {
  LoginResult,
  RefreshResult,
  UserJwtPayload,
} from './types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  async loginUser(
    dto: LoginDto,
    existingRefreshToken?: string,
  ): Promise<LoginResult> {
    const foundUser = await this.usersService.getByUsername(dto.username);

    if (!foundUser) {
      throw new UnauthorizedException('Username or password is incorrect');
    }

    const isMatch = await bcrypt.compare(dto.password, foundUser.password);

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
        this.logger.warn('Attempted refresh token reuse at /api/auth/login');
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

  async logoutUser(existingRefreshToken: string): Promise<boolean> {
    const foundUser =
      await this.usersService.getByRefreshToken(existingRefreshToken);

    if (!foundUser) {
      return false;
    }

    const filteredTokens = this.tokenService.filterRefreshTokens(
      foundUser.refreshTokens,
      existingRefreshToken,
    );

    foundUser.refreshTokens = filteredTokens;
    await foundUser.save();

    return true;
  }

  async refreshToken(existingRefreshToken: string): Promise<RefreshResult> {
    if (!existingRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const foundUser =
      await this.usersService.getByRefreshToken(existingRefreshToken);

    if (!foundUser) {
      const decoded =
        this.tokenService.verifyRefreshToken(existingRefreshToken);

      this.logger.warn('Attempted refresh token reuse at /api/auth/refresh');

      const hackedUser = await this.usersService.getByUsername(
        decoded.username,
      );

      if (hackedUser) {
        hackedUser.refreshTokens = [];
        await hackedUser.save();
      }

      throw new UnauthorizedException('Refresh token reuse detected');
    }

    let decoded: UserJwtPayload;
    let refreshTokenArray: string[] = [];

    try {
      decoded = this.tokenService.verifyRefreshToken(existingRefreshToken);
    } catch (error) {
      if (foundUser && error instanceof TokenExpiredError) {
        refreshTokenArray = this.tokenService.filterRefreshTokens(
          foundUser.refreshTokens,
          existingRefreshToken,
        );

        foundUser.refreshTokens = refreshTokenArray;
        await foundUser.save();
      }

      throw error;
    }

    if (foundUser.username !== decoded.username) {
      throw new UnauthorizedException('Username incorrect');
    }

    const accessToken = this.tokenService.signAccessToken({
      role: foundUser.role,
      userId: foundUser.id,
      username: foundUser.username,
    });

    const refreshToken = this.tokenService.signRefreshToken(foundUser.username);

    refreshTokenArray = this.tokenService.filterRefreshTokens(
      foundUser.refreshTokens,
      existingRefreshToken,
    );

    foundUser.refreshTokens = [...refreshTokenArray, refreshToken];
    await foundUser.save();

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
