import { IsMongoId } from 'class-validator';

export class MakeupBagParamsDto {
  @IsMongoId()
  id: string;
}
