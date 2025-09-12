import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { StoreLinkDto } from 'src/common/dto/store-link.dto';

export class CreateProductDto {
  @IsMongoId()
  @IsNotEmpty()
  brandId: string;

  @IsMongoId()
  @IsOptional() // TODO: make it required in the future
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsOptional()
  shade?: string;

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
