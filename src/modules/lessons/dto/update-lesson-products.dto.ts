import { Type } from 'class-transformer';
import { IsArray, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateLessonProductsDto {
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  productIds: Types.ObjectId[];
}
