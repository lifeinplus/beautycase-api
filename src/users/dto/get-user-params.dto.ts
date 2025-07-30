import { IsMongoId } from 'class-validator';

export class GetUserParamsDto {
  @IsMongoId({ message: 'Invalid user ID format' })
  id: string;
}
