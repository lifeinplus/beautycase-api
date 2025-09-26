import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './schemas/category.schema';

export interface CategoryWithProductCount extends CategoryDocument {
  productCount: number;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    return this.categoryModel.create(dto);
  }

  async findAll(): Promise<CategoryDocument[]> {
    const categories = await this.categoryModel.find().sort('type name');

    if (!categories.length) {
      throw new NotFoundException({ code: ErrorCode.CATEGORIES_NOT_FOUND });
    }

    return categories;
  }

  async findByName(name: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOne({ name });

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORY_NOT_FOUND,
        message: `Category "${name}" not found`,
      });
    }

    return category;
  }

  async findMakeupBags(): Promise<CategoryDocument[]> {
    const categories = await this.categoryModel
      .find({ type: 'makeup_bag' })
      .sort('name');

    if (!categories.length) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORIES_NOT_FOUND,
        message: 'MakeupBag categories not found',
      });
    }

    return categories;
  }

  async findProducts(): Promise<CategoryDocument[]> {
    const categories = await this.categoryModel
      .find({ type: 'product' })
      .sort('name');

    if (!categories.length) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORIES_NOT_FOUND,
        message: 'Product categories not found',
      });
    }

    return categories;
  }

  async findProductsWithCounts(): Promise<CategoryWithProductCount[]> {
    const pipeline = [
      { $match: { type: 'product' } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
        },
      },
      {
        $addFields: {
          productCount: { $size: '$products' },
        },
      },
      {
        $project: {
          products: 0,
        },
      },
      { $sort: { name: 1 as const } },
    ];

    const categories = await this.categoryModel.aggregate(pipeline);

    if (!categories.length) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORIES_NOT_FOUND,
        message: 'Product categories not found',
      });
    }

    return categories;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const category = await this.categoryModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      throw new NotFoundException({ code: ErrorCode.CATEGORY_NOT_FOUND });
    }

    return category;
  }

  async remove(id: Types.ObjectId): Promise<CategoryDocument> {
    const category = await this.categoryModel.findByIdAndDelete(id);

    if (!category) {
      throw new NotFoundException({ code: ErrorCode.CATEGORY_NOT_FOUND });
    }

    return category;
  }
}
