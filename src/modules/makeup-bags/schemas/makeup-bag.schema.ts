import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { HydratedDocument, Types } from 'mongoose';

export type MakeupBagDocument = HydratedDocument<MakeupBag>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      delete ret.categoryId;
      delete ret.clientId;
      delete ret.stageIds;
      delete ret.toolIds;
      return ret;
    },
    virtuals: true,
  },
  versionKey: false,
})
export class MakeupBag {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Stage' }], required: true })
  stageIds: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tool' }], required: true })
  toolIds: Types.ObjectId[];

  @Transform(({ obj }) => obj.categoryId)
  category: Types.ObjectId;

  @Transform(({ obj }) => obj.clientId)
  client: Types.ObjectId;

  @Transform(({ obj }) => obj.stageIds)
  stages: Types.ObjectId[];

  @Transform(({ obj }) => obj.toolIds)
  tools: Types.ObjectId[];
}

export const MakeupBagSchema = SchemaFactory.createForClass(MakeupBag);

MakeupBagSchema.virtual('category').get(function () {
  return this.categoryId;
});

MakeupBagSchema.virtual('client').get(function () {
  return this.clientId;
});

MakeupBagSchema.virtual('stages').get(function () {
  return this.stageIds;
});

MakeupBagSchema.virtual('tools').get(function () {
  return this.toolIds;
});
