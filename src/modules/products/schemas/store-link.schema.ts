import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class StoreLink {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  link: string;
}

export const StoreLinkSchema = SchemaFactory.createForClass(StoreLink);
