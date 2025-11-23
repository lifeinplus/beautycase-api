import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type StageDocument = HydratedDocument<Stage>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      delete ret.productIds;
      return ret;
    },
    virtuals: true,
  },
  versionKey: false,
})
export class Stage {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  subtitle: string;

  @Prop({ type: String, required: true })
  imageId: string;

  @Prop()
  comment?: string;

  @Prop([String])
  steps?: string[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }],
    required: true,
  })
  productIds: Types.ObjectId[];
}

export const StageSchema = SchemaFactory.createForClass(Stage);

StageSchema.virtual('products').get(function () {
  return this.productIds;
});
