import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand, BrandDocument } from './schemas/brand.schema';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
  ) {}

  create(dto: CreateBrandDto): Promise<BrandDocument> {
    return this.brandModel.create(dto);
  }

  async findAll(): Promise<BrandDocument[]> {
    const brands = await this.brandModel.find().sort('name');

    if (!brands.length) {
      throw new NotFoundException({ code: 'BRANDS_NOT_FOUND' });
    }

    return brands;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateBrandDto,
  ): Promise<BrandDocument> {
    const brand = await this.brandModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!brand) {
      throw new NotFoundException({ code: 'BRAND_NOT_FOUND' });
    }

    return brand;
  }

  async remove(id: Types.ObjectId): Promise<BrandDocument> {
    const brand = await this.brandModel.findByIdAndDelete(id);

    if (!brand) {
      throw new NotFoundException({ code: 'BRAND_NOT_FOUND' });
    }

    return brand;
  }
}
