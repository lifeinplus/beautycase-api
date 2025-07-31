import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(300)
  shortDescription: string;

  @IsUrl()
  videoUrl: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  fullDescription: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  clientIds?: string[];
}
