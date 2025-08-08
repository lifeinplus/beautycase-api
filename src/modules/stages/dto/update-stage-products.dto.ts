import { IsArray, IsMongoId } from 'class-validator';

export class UpdateStageProductsDto {
  @IsArray()
  @IsMongoId({ each: true })
  productIds: string[];
}
