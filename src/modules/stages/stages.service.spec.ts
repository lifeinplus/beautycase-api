import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { NotFoundException } from '@nestjs/common';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { ImageService } from '../shared/image.service';
import { UpdateStageProductsDto } from './dto/update-stage-products.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { Stage, StageDocument } from './schemas/stage.schema';
import { StagesService } from './stages.service';

type MockModel<T = any> = Partial<Record<keyof Model<T>, jest.Mock>> & {
  new (doc?: any): { save: jest.Mock };
};

describe('StagesService', () => {
  let service: StagesService;
  let mockStageModel: MockModel<StageDocument>;
  let mockImageService: jest.Mocked<ImageService>;

  const mockStage = TestDataFactory.createStage();

  const mockStageResponse = {
    ...mockStage,
    _id: 'stage-id',
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockStageModel = jest.fn(() => ({
      ...mockStageResponse,
      save: jest.fn().mockResolvedValue(mockStageResponse),
    })) as any;

    mockStageModel.find = jest.fn();
    mockStageModel.findById = jest.fn();
    mockStageModel.findByIdAndUpdate = jest.fn();
    mockStageModel.findByIdAndDelete = jest.fn();

    mockImageService = {
      handleImageUpload: jest.fn(),
      handleImageUpdate: jest.fn(),
      handleImageDeletion: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StagesService,
        {
          provide: getModelToken(Stage.name),
          useValue: mockStageModel,
        },
        {
          provide: ImageService,
          useValue: mockImageService,
        },
      ],
    }).compile();

    service = module.get<StagesService>(StagesService);
  });

  describe('create', () => {
    it('should create a stage and upload image', async () => {
      const result = await service.create(mockStage);

      expect(mockImageService.handleImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({ _id: mockStageResponse._id }),
        { folder: UploadFolder.STAGES, secureUrl: mockStage.imageUrl },
      );

      expect(result).toEqual(mockStageResponse);
    });
  });

  describe('duplicate', () => {
    it('should duplicate a stage', async () => {
      (mockStageModel.findById as jest.Mock).mockResolvedValue({
        toObject: () => mockStageResponse,
        title: mockStageResponse.title,
      });

      const saveMock = jest.fn().mockResolvedValue(mockStageResponse);
      (mockStageModel as any).mockImplementation(() => ({ save: saveMock }));

      const result = await service.duplicate('stage-id');

      expect(mockStageModel.findById).toHaveBeenCalledWith('stage-id');
      expect(result).toEqual(mockStageResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockStageModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.duplicate('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all stages', async () => {
      (mockStageModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([mockStageResponse]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockStageResponse]);
    });

    it('should throw NotFoundException if none found', async () => {
      (mockStageModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return stage by id', async () => {
      (mockStageModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStageResponse),
      });

      const result = await service.findOne('stage-id');
      expect(result).toEqual(mockStageResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockStageModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a stage and update image if provided', async () => {
      (mockStageModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockStageResponse,
      );

      const dto: UpdateStageDto = { imageUrl: 'http://example.com/new.jpg' };
      const result = await service.update('stage-id', dto);

      expect(mockImageService.handleImageUpdate).toHaveBeenCalledWith(
        mockStageResponse,
        {
          folder: UploadFolder.STAGES,
          secureUrl: dto.imageUrl,
          destroyOnReplace: false,
        },
      );
      expect(result).toEqual(mockStageResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockStageModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(service.update('bad-id', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProducts', () => {
    it('should update stage products', async () => {
      (mockStageModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockStageResponse,
      );

      const dto: UpdateStageProductsDto = { productIds: ['p1', 'p2'] };
      const result = await service.updateProducts('stage-id', dto);

      expect(result).toEqual(mockStageResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockStageModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateProducts('bad-id', { productIds: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a stage', async () => {
      (mockStageModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockStageResponse,
      );

      const result = await service.remove('stage-id');
      expect(result).toEqual(mockStageResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockStageModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
