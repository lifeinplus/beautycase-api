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
import { StoreLinkDto } from './store-link.dto';

export class CreateProductDto {
  @IsMongoId()
  @IsNotEmpty()
  brandId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsUrl()
  imageUrl: string;

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
