import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type TrainingQuestionnaireDocument =
  HydratedDocument<TrainingQuestionnaire>;

@Schema({
  collection: 'questionnaires_trainings',
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      delete ret.muaId;
      return ret;
    },
    virtuals: true,
  },
  versionKey: false,
})
export class TrainingQuestionnaire {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  muaId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  contact: string;

  @Prop()
  experience?: string;

  @Prop()
  difficulties?: string;

  @Prop({ required: true })
  expectations: string;
}

export const TrainingQuestionnaireSchema = SchemaFactory.createForClass(
  TrainingQuestionnaire,
);

TrainingQuestionnaireSchema.virtual('mua').get(function () {
  return this.muaId;
});
