import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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

  async findOne(id: Types.ObjectId): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel.findById(id).populate([
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
    ]);

    if (!makeupBag) {
      throw new NotFoundException({ code: ErrorCode.MAKEUP_BAG_NOT_FOUND });
    }

    return makeupBag;
  }

  async findOneWithClientId(id: Types.ObjectId): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel.findById(id).select('clientId');

    if (!makeupBag) {
      throw new NotFoundException({ code: ErrorCode.MAKEUP_BAG_NOT_FOUND });
    }

    return makeupBag;
  }

  findByClientId(clientId: Types.ObjectId): Promise<MakeupBagDocument[]> {
    // TODO: is it safe to delete new Types.ObjectId?
    return this.makeupBagModel
      .find({ clientId: new Types.ObjectId(clientId) })
      .select('categoryId')
      .populate('categoryId', 'name');
  }

  async findByToolId(toolId: Types.ObjectId): Promise<MakeupBagDocument[]> {
    return this.makeupBagModel
      .find({ toolIds: toolId })
      .select('categoryId')
      .populate('categoryId', 'name');
  }

  async update(
    id: Types.ObjectId,
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

  async remove(id: Types.ObjectId): Promise<MakeupBagDocument> {
    const makeupBag = await this.makeupBagModel.findByIdAndDelete(id);

    if (!makeupBag) {
      throw new NotFoundException({ code: ErrorCode.MAKEUP_BAG_NOT_FOUND });
    }

    return makeupBag;
  }
}
