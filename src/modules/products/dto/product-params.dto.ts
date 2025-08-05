import { IsMongoId } from 'class-validator';

export class ProductParamsDto {
  @IsMongoId()
  id: string;
}
