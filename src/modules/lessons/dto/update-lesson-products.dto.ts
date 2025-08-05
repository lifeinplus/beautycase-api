import { Type } from 'class-transformer';
import { IsArray, IsMongoId } from 'class-validator';

export class UpdateLessonProductsDto {
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  productIds: string[];
}
