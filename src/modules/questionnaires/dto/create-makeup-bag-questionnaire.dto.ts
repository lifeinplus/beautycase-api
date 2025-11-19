import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Budget } from 'src/common/enums/budget.enum';
import { MakeupTime } from 'src/common/enums/makeup-time.enum';
import { Referral } from 'src/common/enums/referral.enum';

class DesiredSkillsDto {
  @IsBoolean() bright: boolean;
  @IsBoolean() delicate: boolean;
  @IsBoolean() evening: boolean;
  @IsBoolean() office: boolean;
  @IsBoolean() filming: boolean;
}

class ProblemsDto {
  @IsBoolean() eyeshadowCrease?: boolean;
  @IsBoolean() eyeshadowMatch?: boolean;
  @IsBoolean() foundationPores?: boolean;
  @IsBoolean() foundationStay?: boolean;
  @IsBoolean() mascaraSmudge?: boolean;
  @IsBoolean() sculpting?: boolean;
}

class ProceduresDto {
  @IsBoolean() browCorrection?: boolean;
  @IsBoolean() lashExtensions?: boolean;
  @IsBoolean() lashLamination?: boolean;
  @IsBoolean() none?: boolean;
}

export class CreateMakeupBagQuestionnaireDto {
  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsEnum(Budget)
  budget?: Budget;

  @IsOptional()
  @IsString()
  @IsIn(['yes', 'no'])
  brushes?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  currentSkills?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DesiredSkillsDto)
  desiredSkills?: DesiredSkillsDto;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsNotEmpty()
  @IsString()
  makeupBag: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  makeupBagPhotoIds?: string[];

  @IsOptional()
  @IsEnum(MakeupTime)
  makeupTime?: MakeupTime;

  @IsNotEmpty()
  @IsMongoId()
  muaId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  oilyShine?: string;

  @IsOptional()
  @IsString()
  peeling?: string;

  @IsOptional()
  @IsString()
  pores?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProblemsDto)
  problems?: ProblemsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProceduresDto)
  procedures?: ProceduresDto;

  @IsOptional()
  @IsEnum(Referral)
  referral?: Referral;

  @IsOptional()
  @IsString()
  skinType?: string;
}
