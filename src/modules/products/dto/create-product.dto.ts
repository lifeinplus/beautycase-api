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

export class CreateProductDto {
  @IsOptional()
  @IsMongoId()
  authorId: string;

  @IsNotEmpty()
  @IsMongoId()
  brandId: string;

  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsArray()
  @IsString({ each: true })
  imageIds: string[];

  @IsOptional()
  @IsString()
  shade?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  comment: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreLinkDto)
  storeLinks: StoreLinkDto[];
}
