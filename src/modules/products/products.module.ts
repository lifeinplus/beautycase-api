import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ImageService } from 'src/common/services/image.service';
import { TempUploadsService } from 'src/common/services/temp-uploads.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ImageService, TempUploadsService],
  exports: [ProductsService],
})
export class ProductsModule {}
