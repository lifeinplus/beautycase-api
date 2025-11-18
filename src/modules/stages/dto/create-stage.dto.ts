import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStageDto {
  @IsOptional()
  @IsMongoId()
  authorId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(300)
  subtitle: string;

  @IsString()
  imageId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  productIds: string[];
}
