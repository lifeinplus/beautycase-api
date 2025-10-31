import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

import { IsObjectId } from 'src/common/decorators/objectid.decorator';

export class CreateTrainingQuestionnaireDto {
  @IsNotEmpty()
  @IsObjectId()
  muaId: Types.ObjectId;

  @IsString()
  name: string;

  @IsString()
  contact: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  difficulties?: string;

  @IsString()
  expectations: string;
}
