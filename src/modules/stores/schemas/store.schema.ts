import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StoreDocument = HydratedDocument<Store>;

@Schema({ versionKey: false })
export class Store {
  @Prop({ required: true, unique: true })
  name: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
