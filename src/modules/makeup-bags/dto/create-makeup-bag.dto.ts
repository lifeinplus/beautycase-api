import { IsArray, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMakeupBagDto {
  @IsOptional()
  @IsMongoId()
  authorId: string;

  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @IsNotEmpty()
  @IsMongoId()
  clientId: string;

  @IsArray()
  @IsMongoId({ each: true })
  stageIds: string[];

  @IsArray()
  @IsMongoId({ each: true })
  toolIds: string[];
}
