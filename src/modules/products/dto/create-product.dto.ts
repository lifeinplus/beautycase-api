import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

import { IsObjectId } from 'src/common/decorators/objectid.decorator';
import { StoreLinkDto } from 'src/common/dto/store-link.dto';

export class CreateProductDto {
  @IsOptional()
  authorId: Types.ObjectId;

  @IsObjectId()
  @IsNotEmpty()
  brandId: Types.ObjectId;

  @IsObjectId()
  @IsNotEmpty()
  categoryId: Types.ObjectId;

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
