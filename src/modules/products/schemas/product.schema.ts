import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import { StoreLink, StoreLinkSchema } from './store-link.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  toJSON: {
    transform: (_, ret: any) => {
      delete ret.brandId;
      delete ret.categoryId;
      return ret;
    },
    virtuals: true,
  },
  versionKey: false,
})
export class Product {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  authorId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId: Types.ObjectId;

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

ProductSchema.virtual('category').get(function () {
  return this.categoryId;
});
