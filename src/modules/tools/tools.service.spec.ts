import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { makeObjectId } from 'test/helpers/make-object-id.helper';
import { ImageService } from '../shared/image.service';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { Tool, ToolDocument } from './schemas/tool.schema';
import { ToolsService } from './tools.service';

type MockModel<T = any> = Partial<Record<keyof Model<T>, jest.Mock>> & {
  new (doc?: any): { save: jest.Mock };
};

describe('ToolsService', () => {
  let service: ToolsService;
  let mockToolModel: MockModel<ToolDocument>;

  const mockAuthorId = makeObjectId();
  const mockBrandId = makeObjectId();
  const mockToolId = makeObjectId();
  const mockBadToolId = makeObjectId();

  const mockTool = TestDataFactory.createTool(mockAuthorId, mockBrandId);

  const mockToolResponse = {
    ...mockTool,
    _id: mockToolId,
    id: mockToolId,
    imageIds: ['tools/image1', 'tools/image2'],
    save: jest.fn(),
  };

  mockToolModel = jest.fn(() => ({
    ...mockToolResponse,
    id: mockToolId,
    save: jest.fn().mockResolvedValue(mockToolResponse),
  }));

  mockToolModel.find = jest.fn();
  mockToolModel.findById = jest.fn();
  mockToolModel.findByIdAndUpdate = jest.fn();
  mockToolModel.findByIdAndDelete = jest.fn();

  const mockImageService = {
    cloneImage: jest.fn().mockResolvedValue('mocked-image-id'),
    uploadImage: jest.fn().mockResolvedValue('mocked-image-id'),
    deleteImage: jest.fn().mockResolvedValue(undefined),
    deleteFolder: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsService,
        {
          provide: getModelToken(Tool.name),
          useValue: mockToolModel,
        },
        {
          provide: ImageService,
          useValue: mockImageService,
        },
      ],
    }).compile();

    service = module.get<ToolsService>(ToolsService);
  });

  describe('create', () => {
    it('should create a tool and upload image', async () => {
      const result = await service.create(mockTool);

      expect(mockImageService.uploadImage).toHaveBeenCalledWith(
        mockTool.imageIds?.[0],
        `${UploadFolder.TOOLS}/${mockToolId}`,
      );

      expect(result._id).toBe(mockToolResponse._id);
      expect(result.name).toBe(mockToolResponse.name);
      expect(result.imageIds).toBe(mockToolResponse.imageIds);
    });
  });

  describe('findAll', () => {
    it('should return all tools', async () => {
      (mockToolModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([mockToolResponse]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockToolResponse]);
    });

    it('should throw NotFoundException if no tools found', async () => {
      (mockToolModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return tool by id', async () => {
      (mockToolModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockToolResponse),
      });

      const result = await service.findOne(mockToolId);
      expect(result).toEqual(mockToolResponse);
    });

    it('should throw NotFoundException if tool not found', async () => {
      (mockToolModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(mockBadToolId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update tool and handle image if provided', async () => {
      (mockToolModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockToolResponse,
      );

      const dto: UpdateToolDto = { imageIds: ['tools/image'] };
      const result = await service.update(mockToolId, dto);

      expect(mockImageService.uploadImage).toHaveBeenCalledWith(
        dto.imageIds?.[0],
        `${UploadFolder.TOOLS}/${mockToolId}`,
      );

      expect(result).toEqual(mockToolResponse);
    });

    it('should throw NotFoundException if tool not found', async () => {
      (mockToolModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(service.update(mockBadToolId, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStoreLinks', () => {
    it('should update store links', async () => {
      (mockToolModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockToolResponse,
      );

      const dto: UpdateStoreLinksDto = { storeLinks: [] };
      const result = await service.updateStoreLinks(mockToolId, dto);

      expect(result).toEqual(mockToolResponse);
    });

    it('should throw NotFoundException if tool not found', async () => {
      (mockToolModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStoreLinks(mockBadToolId, { storeLinks: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete tool and remove image if exists', async () => {
      (mockToolModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockToolResponse,
      );

      const result = await service.remove(mockToolId);

      expect(mockImageService.deleteImage).toHaveBeenCalledWith(
        mockToolResponse.imageIds?.[0],
      );

      expect(result).toEqual(mockToolResponse);
    });

    it('should throw NotFoundException if tool not found', async () => {
      (mockToolModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(mockBadToolId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
