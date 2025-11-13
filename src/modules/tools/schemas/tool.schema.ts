import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import {
  StoreLink,
  StoreLinkSchema,
} from 'src/modules/products/schemas/store-link.schema';

export type ToolDocument = HydratedDocument<Tool>;

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
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  authorId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], default: [], required: true })
  imageIds: string[];

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
