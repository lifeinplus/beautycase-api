import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Budget } from 'src/common/enums/budget.enum';
import { MakeupTime } from 'src/common/enums/makeup-time.enum';
import { Referral } from 'src/common/enums/referral.enum';

export type QuestionnaireDocument = HydratedDocument<Questionnaire>;

@Schema({ _id: false, versionKey: false })
export class DesiredSkills {
  @Prop() bright?: boolean;
  @Prop() delicate?: boolean;
  @Prop() evening?: boolean;
  @Prop() office?: boolean;
  @Prop() filming?: boolean;
}

@Schema({ _id: false, versionKey: false })
export class Problems {
  @Prop() eyeshadowCrease?: boolean;
  @Prop() eyeshadowMatch?: boolean;
  @Prop() foundationPores?: boolean;
  @Prop() foundationStay?: boolean;
  @Prop() mascaraSmudge?: boolean;
  @Prop() sculpting?: boolean;
}

@Schema({ _id: false, versionKey: false })
export class Procedures {
  @Prop() browCorrection?: boolean;
  @Prop() lashExtensions?: boolean;
  @Prop() lashLamination?: boolean;
  @Prop() none?: boolean;
}

@Schema({ timestamps: true, versionKey: false })
export class Questionnaire {
  @Prop() age?: number;

  @Prop() allergies?: string;

  @Prop({ enum: Budget }) budget?: string;

  @Prop() brushes?: string;

  @Prop() city?: string;

  @Prop() currentSkills?: string;

  @Prop({ type: DesiredSkills }) desiredSkills?: DesiredSkills;

  @Prop() instagram?: string;

  @Prop({ required: true }) makeupBag: string;

  @Prop() makeupBagPhotoId?: string;

  @Prop() makeupBagPhotoUrl?: string;

  @Prop({ enum: MakeupTime }) makeupTime?: string;

  @Prop({ required: true }) name: string;

  @Prop() oilyShine?: string;

  @Prop() peeling?: string;

  @Prop() pores?: string;

  @Prop({ type: Problems }) problems?: Problems;

  @Prop({ type: Procedures }) procedures?: Procedures;

  @Prop({ enum: Referral }) referral?: string;

  @Prop() skinType?: string;
}

export const QuestionnaireSchema = SchemaFactory.createForClass(Questionnaire);
