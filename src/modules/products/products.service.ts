import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ImageService } from 'src/modules/shared/image.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly imageService: ImageService,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const product = new this.productModel(dto);
    const { imageUrl } = dto;

    await this.imageService.handleImageUpload(product, {
      folder: 'products',
      secureUrl: imageUrl,
    });

    await product.save();
    return product;
  }

  async getAll(): Promise<ProductDocument[]> {
    const products = await this.productModel.find().select('imageUrl');

    if (!products.length) {
      throw new NotFoundException('Products not found');
    }

    return products;
  }

  async getById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).populate('brandId');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateById(
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductDocument> {
    const { imageUrl } = dto;

    const product = await this.productModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (imageUrl) {
      await this.imageService.handleImageUpdate(product, {
        folder: 'products',
        secureUrl: imageUrl,
      });

      await product.save();
    }

    return product;
  }

  async updateStoreLinks(
    id: string,
    dto: UpdateStoreLinksDto,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async deleteById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.imageId) {
      await this.imageService.handleImageDeletion(product.imageId);
    }

    return product;
  }
}
