import { IsMongoId } from 'class-validator';

export class BrandParamsDto {
  @IsMongoId()
  id: string;
}
