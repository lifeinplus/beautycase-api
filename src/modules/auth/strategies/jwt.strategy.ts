import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('ACCESS_TOKEN_SECRET');

    if (!secret) {
      throw new Error(
        'ACCESS_TOKEN_SECRET environment variable is not defined',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.getByUsername(payload.username);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
