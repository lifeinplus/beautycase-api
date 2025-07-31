import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonDocument = Lesson & Document;

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
export class Lesson {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  videoUrl: string;

  @Prop({ type: String, required: true })
  fullDescription: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
  productIds?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  clientIds?: Types.ObjectId[];
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

LessonSchema.virtual('products').get(function () {
  return this.productIds;
});
