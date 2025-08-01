import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class CreateMakeupBagDto {
  @IsNotEmpty()
  @IsMongoId()
  categoryId: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  clientId: Types.ObjectId;

  @IsArray()
  @IsMongoId({ each: true })
  stageIds: Types.ObjectId[];

  @IsArray()
  @IsMongoId({ each: true })
  toolIds: Types.ObjectId[];
}
