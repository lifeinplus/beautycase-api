import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageService } from '../shared/image.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageProductsDto } from './dto/update-stage-products.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { Stage, StageDocument } from './schemas/stage.schema';

@Injectable()
export class StagesService {
  constructor(
    @InjectModel(Stage.name) private stageModel: Model<StageDocument>,
    private readonly imageService: ImageService,
  ) {}

  async create(dto: CreateStageDto): Promise<StageDocument> {
    const stage = new this.stageModel(dto);
    const { imageUrl } = dto;

    await this.imageService.handleImageUpload(stage, {
      folder: UploadFolder.STAGES,
      secureUrl: imageUrl,
    });

    return stage.save();
  }

  async duplicate(id: Types.ObjectId): Promise<StageDocument> {
    const stage = await this.stageModel.findById(id);

    if (!stage) {
      throw new NotFoundException({ code: ErrorCode.STAGE_NOT_FOUND });
    }

    const duplicated = new this.stageModel({
      ...stage.toObject(),
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      title: `${stage.title} (Копия)`,
    });

    return duplicated.save();
  }

  async findAll(): Promise<StageDocument[]> {
    const stages = await this.stageModel
      .find()
      .select('createdAt imageUrl subtitle title');

    if (!stages.length) {
      throw new NotFoundException({ code: ErrorCode.STAGES_NOT_FOUND });
    }

    return stages;
  }

  async findAllByMua(muaId: Types.ObjectId): Promise<StageDocument[]> {
    const stages = await this.stageModel
      .find({ authorId: muaId })
      .select('createdAt imageUrl subtitle title');

    if (!stages.length) {
      throw new NotFoundException({ code: ErrorCode.STAGES_NOT_FOUND });
    }

    return stages;
  }

  async findOne(id: Types.ObjectId): Promise<StageDocument> {
    const stage = await this.stageModel
      .findById(id)
      .populate('productIds', 'imageUrl');

    if (!stage) {
      throw new NotFoundException({ code: ErrorCode.STAGE_NOT_FOUND });
    }

    return stage;
  }

  async findByProductId(productId: Types.ObjectId): Promise<StageDocument[]> {
    return this.stageModel.find({ productIds: productId }).select('title');
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateStageDto,
  ): Promise<StageDocument> {
    const { imageUrl } = dto;

    const stage = await this.stageModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!stage) {
      throw new NotFoundException({ code: ErrorCode.STAGE_NOT_FOUND });
    }

    if (imageUrl) {
      await this.imageService.handleImageUpdate(stage, {
        folder: UploadFolder.STAGES,
        secureUrl: imageUrl,
        destroyOnReplace: false,
      });

      await stage.save();
    }

    return stage;
  }

  async updateProducts(
    id: Types.ObjectId,
    dto: UpdateStageProductsDto,
  ): Promise<StageDocument> {
    const stage = await this.stageModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!stage) {
      throw new NotFoundException({ code: ErrorCode.STAGE_NOT_FOUND });
    }

    return stage;
  }

  async remove(id: Types.ObjectId): Promise<StageDocument> {
    const stage = await this.stageModel.findByIdAndDelete(id);

    if (!stage) {
      throw new NotFoundException({ code: ErrorCode.STAGE_NOT_FOUND });
    }

    return stage;
  }
}
