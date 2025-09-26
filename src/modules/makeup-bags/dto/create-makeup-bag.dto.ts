import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

import { IsObjectId } from 'src/common/decorators/objectid.decorator';

export class CreateMakeupBagDto {
  @IsNotEmpty()
  @IsObjectId()
  categoryId: Types.ObjectId;

  @IsNotEmpty()
  @IsObjectId()
  clientId: Types.ObjectId;

  @IsArray()
  @IsMongoId({ each: true })
  stageIds: Types.ObjectId[];

  @IsArray()
  @IsMongoId({ each: true })
  toolIds: Types.ObjectId[];
}
