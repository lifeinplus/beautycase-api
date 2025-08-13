import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageService } from '../shared/image.service';
import { CreateToolDto } from './dto/create-tool.dto';
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

  const mockTool = {
    _id: 'tool-id',
    brandId: 'brand-id',
    name: 'Brush',
    imageId: 'img-id',
    imageUrl: 'http://example.com/image.jpg',
    number: '123',
    comment: 'Great tool',
    storeLinks: [],
    save: jest.fn(),
  } as any;

  mockToolModel = jest.fn(() => ({
    ...mockTool,
    save: jest.fn().mockResolvedValue(mockTool),
  })) as any;

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tool and upload image', async () => {
      const dto: CreateToolDto = {
        brandId: 'brand-id',
        name: 'Brush',
        imageUrl: 'http://example.com/image.jpg',
        number: '123',
        comment: 'Great tool',
        storeLinks: [],
      };

      const result = await service.create(dto);

      expect(mockImageService.handleImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'tool-id' }),
        { folder: UploadFolder.TOOLS, secureUrl: dto.imageUrl },
      );
      expect(result._id).toBe(mockTool._id);
      expect(result.name).toBe(mockTool.name);
      expect(result.imageUrl).toBe(mockTool.imageUrl);
    });
  });

  describe('findAll', () => {
    it('should return all tools', async () => {
      (mockToolModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([mockTool]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockTool]);
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
        populate: jest.fn().mockResolvedValue(mockTool),
      });

      const result = await service.findOne('tool-id');
      expect(result).toEqual(mockTool);
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
        mockTool,
      );

      const dto: UpdateToolDto = { imageUrl: 'http://example.com/new.jpg' };
      const result = await service.update('tool-id', dto);

      expect(mockImageService.handleImageUpdate).toHaveBeenCalledWith(
        mockTool,
        {
          folder: UploadFolder.TOOLS,
          secureUrl: dto.imageUrl,
        },
      );
      expect(result).toEqual(mockTool);
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
        mockTool,
      );

      const dto: UpdateStoreLinksDto = { storeLinks: [] };
      const result = await service.updateStoreLinks('tool-id', dto);

      expect(result).toEqual(mockTool);
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
        mockTool,
      );

      const result = await service.remove('tool-id');

      expect(mockImageService.handleImageDeletion).toHaveBeenCalledWith(
        mockTool.imageId,
      );
      expect(result).toEqual(mockTool);
    });

    it('should throw NotFoundException if tool not found', async () => {
      (mockToolModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
