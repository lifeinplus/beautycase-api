import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { NotFoundException } from '@nestjs/common';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageService } from '../shared/image.service';
import { CreateStageDto } from './dto/create-stage.dto';
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

  const mockStage = {
    _id: 'stage-id',
    title: 'Morning routine',
    subtitle: 'Soft and natural',
    imageId: 'img-id',
    imageUrl: 'http://example.com/image.jpg',
    comment: 'Stage comment',
    steps: ['Step 1', 'Step 2'],
    productIds: ['product-id'],
    save: jest.fn(),
  } as any;

  beforeEach(async () => {
    mockStageModel = jest.fn(() => ({
      ...mockStage,
      save: jest.fn().mockResolvedValue(mockStage),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a stage and upload image', async () => {
      const dto: CreateStageDto = {
        title: 'Morning routine',
        subtitle: 'Soft and natural',
        imageUrl: 'http://example.com/image.jpg',
        comment: 'Stage comment',
        steps: ['Step 1'],
        productIds: ['product-id'],
      };

      const result = await service.create(dto);

      expect(mockImageService.handleImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'stage-id' }),
        { folder: UploadFolder.STAGES, secureUrl: dto.imageUrl },
      );
      expect(result).toEqual(mockStage);
    });
  });

  describe('duplicate', () => {
    it('should duplicate a stage', async () => {
      (mockStageModel.findById as jest.Mock).mockResolvedValue({
        toObject: () => mockStage,
        title: mockStage.title,
      });

      const saveMock = jest.fn().mockResolvedValue(mockStage);
      (mockStageModel as any).mockImplementation(() => ({ save: saveMock }));

      const result = await service.duplicate('stage-id');

      expect(mockStageModel.findById).toHaveBeenCalledWith('stage-id');
      expect(result).toEqual(mockStage);
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
        select: jest.fn().mockResolvedValue([mockStage]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockStage]);
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
        populate: jest.fn().mockResolvedValue(mockStage),
      });

      const result = await service.findOne('stage-id');
      expect(result).toEqual(mockStage);
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
        mockStage,
      );

      const dto: UpdateStageDto = { imageUrl: 'http://example.com/new.jpg' };
      const result = await service.update('stage-id', dto);

      expect(mockImageService.handleImageUpdate).toHaveBeenCalledWith(
        mockStage,
        {
          folder: UploadFolder.STAGES,
          secureUrl: dto.imageUrl,
          destroyOnReplace: false,
        },
      );
      expect(result).toEqual(mockStage);
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
        mockStage,
      );

      const dto: UpdateStageProductsDto = { productIds: ['p1', 'p2'] };
      const result = await service.updateProducts('stage-id', dto);

      expect(result).toEqual(mockStage);
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
        mockStage,
      );

      const result = await service.remove('stage-id');
      expect(result).toEqual(mockStage);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockStageModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
