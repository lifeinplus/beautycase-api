import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Role } from 'src/common/enums/role.enum';
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

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
