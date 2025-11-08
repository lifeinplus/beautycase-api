import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Role } from 'src/common/enums/role.enum';

export class CreateUserDto {
  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
