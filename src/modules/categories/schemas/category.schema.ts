import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ versionKey: false })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
