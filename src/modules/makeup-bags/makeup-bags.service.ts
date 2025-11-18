import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { CreateMakeupBagDto } from './dto/create-makeup-bag.dto';
import { UpdateMakeupBagDto } from './dto/update-makeup-bag.dto';
import { MakeupBag, MakeupBagDocument } from './schemas/makeup-bag.schema';

@Injectable()
export class MakeupBagsService {
  constructor(
    @InjectModel(MakeupBag.name)
    private makeupBagModel: Model<MakeupBagDocument>,
  ) {}

  create(dto: CreateMakeupBagDto): Promise<MakeupBagDocument> {
    return this.makeupBagModel.create(dto);
  }

  async findAll(): Promise<MakeupBagDocument[]> {
    const makeupBags = await this.makeupBagModel
      .find()
      .select('categoryId clientId createdAt stageIds')
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'clientId', select: 'username' },
        { path: 'stageIds', select: '_id' },
      ]);

    if (!makeupBags.length) {
      throw new NotFoundException({ code: ErrorCode.MAKEUP_BAGS_NOT_FOUND });
    }

    return makeupBags;
  }

  async findAllByAuthor(authorId: string): Promise<MakeupBagDocument[]> {
    const makeupBags = await this.makeupBagModel
      .find({ authorId: authorId })
      .select('categoryId clientId createdAt stageIds')
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'clientId', select: 'firstName lastName' },
        { path: 'stageIds', select: '_id' },
      ])
      .sort({ createdAt: 'desc' });

    if (!makeupBags.length) {
      throw new NotFoundException({ code: ErrorCode.MAKEUP_BAGS_NOT_FOUND });
    }

    return makeupBags;
  }

  async findOne(id: string): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel.findById(id).populate([
      { path: 'categoryId' },
      { path: 'clientId', select: 'username' },
      {
        path: 'stageIds',
        populate: {
          path: 'productIds',
          populate: { path: 'brandId' },
          select: 'name imageIds',
        },
      },
      {
        path: 'toolIds',
        select: 'brandId imageIds name',
        populate: { path: 'brandId' },
      },
    ]);

    if (!makeupBag) {
      throw new NotFoundException({ code: ErrorCode.MAKEUP_BAG_NOT_FOUND });
    }

    return makeupBag;
  }

  async findOneWithClientId(id: string): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel.findById(id).select('clientId');

    if (!makeupBag) {
      throw new NotFoundException({ code: ErrorCode.MAKEUP_BAG_NOT_FOUND });
    }

    return makeupBag;
  }

  findByClientId(clientId: string): Promise<MakeupBagDocument[]> {
    return this.makeupBagModel
      .find({ clientId })
      .select('categoryId')
      .populate('categoryId', 'name');
  }

  async findByToolId(toolId: string): Promise<MakeupBagDocument[]> {
    return this.makeupBagModel
      .find({ toolIds: toolId })
      .select('categoryId')
      .populate('categoryId', 'name');
  }

  async update(
    id: string,
    dto: UpdateMakeupBagDto,
  ): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!makeupBag) {
      throw new NotFoundException({ code: ErrorCode.MAKEUP_BAG_NOT_FOUND });
    }

    return makeupBag;
  }

  async remove(id: string): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel.findByIdAndDelete(id);

    if (!makeupBag) {
      throw new NotFoundException({ code: ErrorCode.MAKEUP_BAG_NOT_FOUND });
    }

    return makeupBag;
  }
}
