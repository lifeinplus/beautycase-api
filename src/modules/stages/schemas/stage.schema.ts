import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

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
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  subtitle: string;

  @Prop()
  imageId?: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  comment?: string;

  @Prop([String])
  steps?: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], required: true })
  productIds: Types.ObjectId[];
}

export const StageSchema = SchemaFactory.createForClass(Stage);

StageSchema.virtual('products').get(function () {
  return this.productIds;
});
