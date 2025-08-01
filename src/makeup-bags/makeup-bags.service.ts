import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateMakeupBagDto } from './dto/create-makeup-bag.dto';
import { UpdateMakeupBagDto } from './dto/update-makeup-bag.dto';
import { MakeupBag, MakeupBagDocument } from './schemas/makeup-bag.schema';

@Injectable()
export class MakeupBagsService {
  constructor(
    @InjectModel(MakeupBag.name)
    private makeupBagModel: Model<MakeupBagDocument>,
  ) {}

  async create(
    createMakeupBagDto: CreateMakeupBagDto,
  ): Promise<MakeupBagDocument> {
    return await this.makeupBagModel.create(createMakeupBagDto);
  }

  async getAll(): Promise<MakeupBagDocument[]> {
    const makeupBags = await this.makeupBagModel
      .find()
      .select('categoryId clientId createdAt stageIds')
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'clientId', select: 'username' },
        { path: 'stageIds', select: '_id' },
      ])
      .exec();

    if (!makeupBags.length) {
      throw new NotFoundException('MakeupBags not found');
    }

    return makeupBags;
  }

  async getById(id: string): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel
      .findById(id)
      .populate([
        { path: 'categoryId' },
        { path: 'clientId', select: 'username' },
        {
          path: 'stageIds',
          populate: {
            path: 'productIds',
            populate: { path: 'brandId' },
            select: 'name imageUrl',
          },
        },
        {
          path: 'toolIds',
          select: 'brandId imageUrl name',
          populate: { path: 'brandId' },
        },
      ])
      .exec();

    if (!makeupBag) {
      throw new NotFoundException('MakeupBag not found');
    }

    return makeupBag;
  }

  async getByClientId(clientId: string): Promise<MakeupBagDocument[]> {
    return await this.makeupBagModel
      .find({ clientId })
      .select('categoryId')
      .populate('categoryId', 'name')
      .exec();
  }

  async updateById(
    id: string,
    updateMakeupBagDto: UpdateMakeupBagDto,
  ): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel
      .findByIdAndUpdate(id, updateMakeupBagDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!makeupBag) {
      throw new NotFoundException('MakeupBag not found');
    }

    return makeupBag;
  }

  async deleteById(id: string): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel.findByIdAndDelete(id).exec();

    if (!makeupBag) {
      throw new NotFoundException('MakeupBag not found');
    }

    return makeupBag;
  }
}
