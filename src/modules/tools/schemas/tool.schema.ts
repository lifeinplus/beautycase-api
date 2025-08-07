import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import {
  StoreLink,
  StoreLinkSchema,
} from 'src/modules/products/schemas/store-link.schema';

export type ToolDocument = Tool & Document;

@Schema({
  toJSON: {
    transform: (_, ret: any) => {
      delete ret.brandId;
      return ret;
    },
    virtuals: true,
  },
  versionKey: false,
})
export class Tool {
  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  imageId?: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  number?: string;

  @Prop({ required: true })
  comment: string;

  @Prop({ type: [StoreLinkSchema], required: true })
  storeLinks: StoreLink[];
}

export const ToolSchema = SchemaFactory.createForClass(Tool);

ToolSchema.virtual('brand').get(function () {
  return this.brandId;
});
