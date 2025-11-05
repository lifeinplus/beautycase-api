import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
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

  async duplicate(id: Types.ObjectId): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException({ code: ErrorCode.PRODUCT_NOT_FOUND });
    }

    const duplicated = new this.productModel({
      ...product.toObject(),
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      name: `${product.name} (Копия)`,
    });

    return duplicated.save();
  }

  async findAll(): Promise<ProductDocument[]> {
    const products = await this.productModel.find().select('imageUrl');

    if (!products.length) {
      throw new NotFoundException({ code: ErrorCode.PRODUCTS_NOT_FOUND });
    }

    return products;
  }

  async findAllByAuthor(authorId: Types.ObjectId): Promise<ProductDocument[]> {
    const products = await this.productModel
      .find({ authorId })
      .select('imageUrl');

    if (!products.length) {
      throw new NotFoundException({ code: ErrorCode.PRODUCTS_NOT_FOUND });
    }

    return products;
  }

  async findAllByAuthorAndCategory(
    authorId: Types.ObjectId,
    categoryName: string,
  ): Promise<ProductDocument[]> {
    const category = await this.categoriesService.findByName(categoryName);

    const products = await this.productModel
      .find({ authorId, categoryId: category._id })
      .select('imageUrl');

    if (!products.length) {
      throw new NotFoundException({
        code: ErrorCode.PRODUCTS_NOT_FOUND,
        message: `No products found for category ${categoryName}`,
      });
    }

    return products;
  }

  async findOne(id: Types.ObjectId): Promise<ProductDocument> {
    const product = await this.productModel
      .findById(id)
      .populate(['brandId', 'categoryId']);

    if (!product) {
      throw new NotFoundException({ code: ErrorCode.PRODUCT_NOT_FOUND });
    }

    return product;
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
      throw new NotFoundException({ code: ErrorCode.PRODUCT_NOT_FOUND });
    }

    if (imageUrl) {
      await this.imageService.handleImageUpdate(product, {
        folder: UploadFolder.PRODUCTS,
        secureUrl: imageUrl,
        destroyOnReplace: false,
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
      throw new NotFoundException({ code: ErrorCode.PRODUCT_NOT_FOUND });
    }

    return product;
  }

  async remove(id: Types.ObjectId): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException({ code: ErrorCode.PRODUCT_NOT_FOUND });
    }

    return product;
  }
}
