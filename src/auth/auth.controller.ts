import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const refreshToken = req.cookies?.jwt;

    const loginResult = await this.authService.loginUser(
      loginDto,
      refreshToken,
    );

    if (refreshToken) {
      res.clearCookie('jwt');
    }

    const cookieOptions = this.configService.get<CookieOptions>(
      'auth.cookieOptions',
      {},
    );

    res.cookie('jwt', loginResult.refreshToken, cookieOptions);

    return {
      accessToken: loginResult.accessToken,
      role: loginResult.user.role,
      userId: loginResult.user.userId,
      username: loginResult.user.username,
    };
  }
}
