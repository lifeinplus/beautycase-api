import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
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

  const mockTool = TestDataFactory.createTool('brand-id');

  const mockToolResponse = {
    ...mockTool,
    _id: 'tool-id',
    imageId: 'img-id',
    save: jest.fn(),
  };

  mockToolModel = jest.fn(() => ({
    ...mockToolResponse,
    save: jest.fn().mockResolvedValue(mockToolResponse),
  }));

  mockToolModel.find = jest.fn();
  mockToolModel.findById = jest.fn();
  mockToolModel.findByIdAndUpdate = jest.fn();
  mockToolModel.findByIdAndDelete = jest.fn();

  const mockImageService = {
    handleImageUpload: jest.fn(),
    handleImageUpdate: jest.fn(),
    handleImageDeletion: jest.fn(),
  } as any;

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

      expect(mockImageService.handleImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'tool-id' }),
        { folder: UploadFolder.TOOLS, secureUrl: mockTool.imageUrl },
      );
      expect(result._id).toBe(mockToolResponse._id);
      expect(result.name).toBe(mockToolResponse.name);
      expect(result.imageUrl).toBe(mockToolResponse.imageUrl);
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

      const result = await service.findOne('tool-id');
      expect(result).toEqual(mockToolResponse);
    });

    it('should throw NotFoundException if tool not found', async () => {
      (mockToolModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update tool and handle image if provided', async () => {
      (mockToolModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockToolResponse,
      );

      const dto: UpdateToolDto = { imageUrl: 'http://example.com/new.jpg' };
      const result = await service.update('tool-id', dto);

      expect(mockImageService.handleImageUpdate).toHaveBeenCalledWith(
        mockToolResponse,
        {
          folder: UploadFolder.TOOLS,
          secureUrl: dto.imageUrl,
        },
      );
      expect(result).toEqual(mockToolResponse);
    });

    it('should throw NotFoundException if tool not found', async () => {
      (mockToolModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(service.update('bad-id', {} as any)).rejects.toThrow(
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
      const result = await service.updateStoreLinks('tool-id', dto);

      expect(result).toEqual(mockToolResponse);
    });

    it('should throw NotFoundException if tool not found', async () => {
      (mockToolModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStoreLinks('bad-id', { storeLinks: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete tool and remove image if exists', async () => {
      (mockToolModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockToolResponse,
      );

      const result = await service.remove('tool-id');

      expect(mockImageService.handleImageDeletion).toHaveBeenCalledWith(
        mockToolResponse.imageId,
      );
      expect(result).toEqual(mockToolResponse);
    });

    it('should throw NotFoundException if tool not found', async () => {
      (mockToolModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
