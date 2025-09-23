import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { CategoriesService } from '../categories/categories.service';
import { ImageService } from '../shared/image.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
    private readonly imageService: ImageService,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const product = new this.productModel(dto);
    const { imageUrl } = dto;

    await this.imageService.handleImageUpload(product, {
      folder: UploadFolder.PRODUCTS,
      secureUrl: imageUrl,
    });

    await product.save();
    return product;
  }

  async findAll(): Promise<ProductDocument[]> {
    const products = await this.productModel.find().select('imageUrl');

    if (!products.length) {
      throw new NotFoundException({ code: 'PRODUCTS_NOT_FOUND' });
    }

    return products;
  }

  async findOne(id: Types.ObjectId): Promise<ProductDocument> {
    const product = await this.productModel
      .findById(id)
      .populate(['brandId', 'categoryId']);

    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND' });
    }

    return product;
  }

  async findByCategory(name: string): Promise<ProductDocument[]> {
    const category = await this.categoriesService.findByName(name);

    const products = await this.productModel
      .find({ categoryId: category._id })
      .select('imageUrl');

    if (!products.length) {
      throw new NotFoundException({
        code: 'PRODUCTS_NOT_FOUND',
        message: `No products found for category ${name}`,
      });
    }

    return products;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateProductDto,
  ): Promise<ProductDocument> {
    const { imageUrl } = dto;

    const product = await this.productModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND' });
    }

    if (imageUrl) {
      await this.imageService.handleImageUpdate(product, {
        folder: UploadFolder.PRODUCTS,
        secureUrl: imageUrl,
      });

      await product.save();
    }

    return product;
  }

  async updateStoreLinks(
    id: Types.ObjectId,
    dto: UpdateStoreLinksDto,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(id, dto, {
      runValidators: true,
    });

    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND' });
    }

    return product;
  }

  async remove(id: Types.ObjectId): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND' });
    }

    if (product.imageId) {
      await this.imageService.handleImageDeletion(product.imageId);
    }

    return product;
  }
}
