import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTrainingQuestionnaireDto {
  @IsNotEmpty()
  @IsMongoId()
  muaId: string;

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
