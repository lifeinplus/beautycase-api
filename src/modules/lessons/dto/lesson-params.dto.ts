import { IsMongoId } from 'class-validator';

export class LessonParamsDto {
  @IsMongoId()
  id: string;
}
