import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CategoriesModule } from '../categories/categories.module';
import { LessonsModule } from '../lessons/lessons.module';
import { SharedModule } from '../shared/shared.module';
import { StagesModule } from '../stages/stages.module';
import { ProductDeletionInterceptor } from './interceptors/product-deletion.interceptor';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CategoriesModule,
    LessonsModule,
    SharedModule,
    StagesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductDeletionInterceptor],
  exports: [ProductsService],
})
export class ProductsModule {}
