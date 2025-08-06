import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StoreLink, StoreLinkSchema } from './store-link.schema';

export type ProductDocument = Product & Document;

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
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  imageId?: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  shade?: string;

  @Prop({ required: true })
  comment: string;

  @Prop({ type: [StoreLinkSchema], required: true })
  storeLinks: StoreLink[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.virtual('brand').get(function () {
  return this.brandId;
});
