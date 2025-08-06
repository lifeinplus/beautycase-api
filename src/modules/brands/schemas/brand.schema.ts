import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ versionKey: false })
export class Brand {
  @Prop({ required: true, unique: true })
  name: string;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
