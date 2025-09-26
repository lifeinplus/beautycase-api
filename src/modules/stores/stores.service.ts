import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store, StoreDocument } from './schemas/store.schema';

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
  ) {}

  create(dto: CreateStoreDto): Promise<StoreDocument> {
    return this.storeModel.create(dto);
  }

  async findAll(): Promise<StoreDocument[]> {
    const stores = await this.storeModel.find().sort('name');

    if (!stores.length) {
      throw new NotFoundException({ code: ErrorCode.STORES_NOT_FOUND });
    }

    return stores;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateStoreDto,
  ): Promise<StoreDocument> {
    const store = await this.storeModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!store) {
      throw new NotFoundException({ code: ErrorCode.STORE_NOT_FOUND });
    }

    return store;
  }

  async remove(id: Types.ObjectId): Promise<StoreDocument> {
    const store = await this.storeModel.findByIdAndDelete(id);

    if (!store) {
      throw new NotFoundException({ code: ErrorCode.STORE_NOT_FOUND });
    }

    return store;
  }
}
