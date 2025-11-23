import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { StoreLinkDto } from 'src/common/dto/store-link.dto';

export class CreateToolDto {
  @IsOptional()
  @IsMongoId()
  authorId: string;

  @IsNotEmpty()
  @IsMongoId()
  brandId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsArray()
  @IsString({ each: true })
  imageIds: string[];

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  comment: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StoreLinkDto)
  storeLinks: StoreLinkDto[];
}
