import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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

  async duplicate(id: string): Promise<StageDocument> {
    const stage = await this.stageModel.findById(id);

    if (!stage) {
      throw new NotFoundException('Stage not found');
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
      throw new NotFoundException('Stages not found');
    }

    return stages;
  }

  async findOne(id: string): Promise<StageDocument> {
    const stage = await this.stageModel
      .findById(id)
      .populate('productIds', 'imageUrl');

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return stage;
  }

  async update(id: string, dto: UpdateStageDto): Promise<StageDocument> {
    const { imageUrl } = dto;

    const stage = await this.stageModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
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
    id: string,
    dto: UpdateStageProductsDto,
  ): Promise<StageDocument> {
    const stage = await this.stageModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return stage;
  }

  async remove(id: string): Promise<StageDocument> {
    const stage = await this.stageModel.findByIdAndDelete(id);

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return stage;
  }
}
