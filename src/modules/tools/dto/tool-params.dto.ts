import { IsMongoId } from 'class-validator';

export class ToolParamsDto {
  @IsMongoId()
  id: string;
}
