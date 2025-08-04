import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoreDocument = Store & Document;

@Schema({ versionKey: false })
export class Store {
  @Prop({ required: true, unique: true })
  name: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
