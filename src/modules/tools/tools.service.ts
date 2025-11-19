import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageService } from '../shared/image.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { Tool, ToolDocument } from './schemas/tool.schema';

@Injectable()
export class ToolsService {
  constructor(
    @InjectModel(Tool.name) private toolModel: Model<ToolDocument>,
    private readonly imageService: ImageService,
  ) {}

  async create(dto: CreateToolDto): Promise<ToolDocument> {
    const tool = new this.toolModel(dto);
    const { imageIds } = dto;

    tool.imageIds = await Promise.all(
      imageIds.map(
        async (imageId) =>
          await this.imageService.uploadImage(
            imageId,
            `${UploadFolder.TOOLS}/${tool.id}`,
          ),
      ),
    );

    return tool.save();
  }

  async findAll(): Promise<ToolDocument[]> {
    const tools = await this.toolModel.find().select('imageIds');

    if (!tools.length) {
      throw new NotFoundException({ code: ErrorCode.TOOLS_NOT_FOUND });
    }

    return tools;
  }

  async findAllByAuthor(authorId: string): Promise<ToolDocument[]> {
    const tools = await this.toolModel.find({ authorId }).select('imageIds');

    if (!tools.length) {
      throw new NotFoundException({ code: ErrorCode.TOOLS_NOT_FOUND });
    }

    return tools;
  }

  async findOne(id: string): Promise<ToolDocument> {
    const tool = await this.toolModel.findById(id).populate('brandId');

    if (!tool) {
      throw new NotFoundException({ code: ErrorCode.TOOL_NOT_FOUND });
    }

    return tool;
  }

  async update(id: string, dto: UpdateToolDto): Promise<ToolDocument> {
    const { imageIds } = dto;

    const tool = await this.toolModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!tool) {
      throw new NotFoundException({ code: ErrorCode.TOOL_NOT_FOUND });
    }

    if (imageIds?.length) {
      tool.imageIds = await Promise.all(
        imageIds.map(
          async (imageId) =>
            await this.imageService.uploadImage(
              imageId,
              `${UploadFolder.TOOLS}/${tool.id}`,
            ),
        ),
      );

      await tool.save();
    }

    return tool;
  }

  async updateStoreLinks(
    id: string,
    dto: UpdateStoreLinksDto,
  ): Promise<ToolDocument> {
    const tool = await this.toolModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!tool) {
      throw new NotFoundException({ code: ErrorCode.TOOL_NOT_FOUND });
    }

    return tool;
  }

  async remove(id: string): Promise<ToolDocument> {
    const tool = await this.toolModel.findByIdAndDelete(id);

    if (!tool) {
      throw new NotFoundException({ code: ErrorCode.TOOL_NOT_FOUND });
    }

    const folder = `${UploadFolder.TOOLS}/${tool.id}`;

    for (const imageId of tool.imageIds) {
      await this.imageService.deleteImage(imageId);
    }

    await this.imageService.deleteFolder(folder);

    return tool;
  }
}
