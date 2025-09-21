import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateStageDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(300)
  subtitle: string;

  @IsUrl()
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  productIds: Types.ObjectId[];
}
