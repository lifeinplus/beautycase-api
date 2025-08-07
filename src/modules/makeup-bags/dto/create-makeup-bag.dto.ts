import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateMakeupBagDto {
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
