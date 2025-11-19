import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
    const { imageId } = dto;

    stage.imageId = await this.imageService.uploadImage(
      imageId,
      `${UploadFolder.STAGES}/${stage.id}`,
    );

    return stage.save();
  }

  async duplicate(id: string): Promise<StageDocument> {
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

    await duplicated.save();

    if (stage.imageId) {
      const folder = `${UploadFolder.STAGES}/${duplicated.id}`;

      duplicated.imageId = await this.imageService.cloneImage(
        stage.imageId,
        folder,
      );

      await duplicated.save();
    }

    return duplicated;
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

  async findAllByAuthor(authorId: string): Promise<StageDocument[]> {
    const stages = await this.stageModel
      .find({ authorId })
      .select('createdAt imageId subtitle title');

    if (!stages.length) {
      throw new NotFoundException({ code: ErrorCode.STAGES_NOT_FOUND });
    }

    return stages;
  }

  async findOne(id: string): Promise<StageDocument> {
    const stage = await this.stageModel
      .findById(id)
      .populate('productIds', 'imageIds');

    if (!stage) {
      throw new NotFoundException({ code: ErrorCode.STAGE_NOT_FOUND });
    }

    return stage;
  }

  async findByProductId(productId: string): Promise<StageDocument[]> {
    return this.stageModel.find({ productIds: productId }).select('title');
  }

  async update(id: string, dto: UpdateStageDto): Promise<StageDocument> {
    const { imageId } = dto;

    const stage = await this.stageModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!stage) {
      throw new NotFoundException({ code: ErrorCode.STAGE_NOT_FOUND });
    }

    if (imageId) {
      stage.imageId = await this.imageService.uploadImage(
        imageId,
        `${UploadFolder.STAGES}/${stage.id}`,
      );

      await stage.save();
    }

    return stage;
  }

  async updateProducts(
    id: string,
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

  async remove(id: string): Promise<StageDocument> {
    const stage = await this.stageModel.findByIdAndDelete(id);

    if (!stage) {
      throw new NotFoundException({ code: ErrorCode.STAGE_NOT_FOUND });
    }

    const folder = `${UploadFolder.STAGES}/${stage.id}`;

    await this.imageService.deleteImage(stage.imageId);
    await this.imageService.deleteFolder(folder);

    return stage;
  }
}
