import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TrainingQuestionnaireDocument =
  HydratedDocument<TrainingQuestionnaire>;

@Schema({
  collection: 'questionnaires_training',
  timestamps: true,
  versionKey: false,
})
export class TrainingQuestionnaire {
  @Prop({ required: true }) name: string;

  @Prop({ required: true }) contact: string;

  @Prop() experience?: string;

  @Prop() difficulties?: string;

  @Prop({ required: true }) expectations: string;
}

export const TrainingQuestionnaireSchema = SchemaFactory.createForClass(
  TrainingQuestionnaire,
);
