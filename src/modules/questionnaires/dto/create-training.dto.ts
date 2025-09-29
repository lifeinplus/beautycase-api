import { IsOptional, IsString } from 'class-validator';

export class CreateTrainingDto {
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
