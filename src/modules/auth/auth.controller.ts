import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RefreshToken } from './decorators/refresh-token.decorator';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { RegisterDto } from './dto/register.dto';
import { ClearCookieInterceptor } from './interceptors/clear-cookie.interceptor';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const refreshToken = req.cookies?.jwt;

    const loginResult = await this.authService.loginUser(dto, refreshToken);

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

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(ClearCookieInterceptor)
  async logoutUser(@RefreshToken() refreshToken?: string) {
    if (!refreshToken) {
      throw new BadRequestException('No refresh token provided');
    }

    const result = await this.authService.logoutUser(refreshToken);

    if (!result) {
      throw new NotFoundException('Session not found');
    }
  }

  @Get('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.jwt;

    if (refreshToken) {
      res.clearCookie('jwt');
    }

    const refreshResult = await this.authService.refreshToken(refreshToken);

    const cookieOptions = this.configService.get<CookieOptions>(
      'auth.cookieOptions',
      {},
    );

    res
      .status(HttpStatus.OK)
      .cookie('jwt', refreshResult.refreshToken, cookieOptions)
      .json({
        accessToken: refreshResult.accessToken,
        role: refreshResult.user.role,
        userId: refreshResult.user.userId,
        username: refreshResult.user.username,
      });
  }

  @Post('register')
  async registerUser(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    await this.authService.registerUser(dto);

    return {
      message: 'Account created successfully',
    };
  }
}
