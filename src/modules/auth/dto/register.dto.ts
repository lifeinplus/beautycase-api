import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { IsPasswordMatch } from '../validators/password-match.validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsPasswordMatch('password')
  confirmPassword: string;
}
