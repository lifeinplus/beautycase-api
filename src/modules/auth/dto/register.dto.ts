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
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsPasswordMatch('password')
  confirmPassword: string;
}
