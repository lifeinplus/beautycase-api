import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand, BrandDocument } from './schemas/brand.schema';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<BrandDocument> {
    return await this.brandModel.create(createBrandDto);
  }

  async getAll(): Promise<BrandDocument[]> {
    const brands = await this.brandModel.find().sort('name').exec();

    if (!brands.length) {
      throw new NotFoundException('Brands not found');
    }

    return brands;
  }

  async updateById(
    id: string,
    updateBrandDto: UpdateBrandDto,
  ): Promise<BrandDocument> {
    const brand = await this.brandModel
      .findByIdAndUpdate(id, updateBrandDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async deleteById(id: string): Promise<BrandDocument> {
    const brand = await this.brandModel.findByIdAndDelete(id).exec();

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }
}
