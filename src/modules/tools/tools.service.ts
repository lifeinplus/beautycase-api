import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
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
    const { imageUrl } = dto;

    // await this.imageService.handleImageUpload(tool, {
    //   folder: UploadFolder.TOOLS,
    //   publicId: imageUrl,
    // });

    return tool.save();
  }

  async findAll(): Promise<ToolDocument[]> {
    const tools = await this.toolModel.find().select('imageUrl');

    if (!tools.length) {
      throw new NotFoundException({ code: ErrorCode.TOOLS_NOT_FOUND });
    }

    return tools;
  }

  async findAllByAuthor(authorId: string): Promise<ToolDocument[]> {
    const tools = await this.toolModel.find({ authorId }).select('imageUrl');

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
    const { imageUrl } = dto;

    const tool = await this.toolModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!tool) {
      throw new NotFoundException({ code: ErrorCode.TOOL_NOT_FOUND });
    }

    if (imageUrl) {
      // await this.imageService.handleImageUpdate(tool, {
      //   folder: UploadFolder.TOOLS,
      //   publicId: imageUrl,
      // });

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

    if (tool.imageId) {
      await this.imageService.deleteImage(tool.imageId);
    }

    return tool;
  }
}
