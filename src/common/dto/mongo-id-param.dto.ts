import { IsMongoId } from 'class-validator';

export class MongoIdParamDto {
  @IsMongoId()
  id: string;
}
