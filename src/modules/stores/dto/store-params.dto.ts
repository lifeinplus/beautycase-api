import { IsMongoId } from 'class-validator';

export class StoreParamsDto {
  @IsMongoId()
  id: string;
}
