import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { BrandsService } from './brands.service';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand } from './schemas/brand.schema';

describe('BrandsService', () => {
  let service: BrandsService;

  const mockBrand = TestDataFactory.createBrand();
  const mockBrands = TestDataFactory.createMultipleBrands(2);
  const mockBrandId = new Types.ObjectId();

  const mockBrandResponse = {
    ...mockBrand,
    _id: mockBrandId,
  };

  const mockBrandModel = {
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getModelToken(Brand.name),
          useValue: mockBrandModel,
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a brand', async () => {
      mockBrandModel.create.mockResolvedValue(mockBrandResponse);

      const result = await service.create(mockBrand);

      expect(mockBrandModel.create).toHaveBeenCalledWith(mockBrand);
      expect(result).toEqual(mockBrandResponse);
    });

    it('should handle creation errors', async () => {
      const error = new Error('Database error');
      mockBrandModel.create.mockRejectedValue(error);

      await expect(service.create(mockBrand)).rejects.toThrow(error);
      expect(mockBrandModel.create).toHaveBeenCalledWith(mockBrand);
    });
  });

  describe('findAll', () => {
    it('should return all brands sorted by name', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockBrands),
      };

      mockBrandModel.find.mockReturnValue(mockQuery);
      const result = await service.findAll();

      expect(mockBrandModel.find).toHaveBeenCalledWith();
      expect(mockQuery.sort).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockBrands);
    });

    it('should throw NotFoundException when no brands found', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue([]),
      };

      mockBrandModel.find.mockReturnValue(mockQuery);

      await expect(service.findAll()).rejects.toThrow(
        new NotFoundException({ code: ErrorCode.BRANDS_NOT_FOUND }),
      );

      expect(mockBrandModel.find).toHaveBeenCalledWith();
      expect(mockQuery.sort).toHaveBeenCalledWith('name');
    });
  });

  describe('update', () => {
    it('should successfully update a brand', async () => {
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      const updatedBrand = { ...mockBrandResponse, ...dto };
      mockBrandModel.findByIdAndUpdate.mockResolvedValue(updatedBrand);

      const result = await service.update(mockBrandId, dto);

      expect(mockBrandModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBrandId,
        dto,
        {
          new: true,
          runValidators: true,
        },
      );
      expect(result).toEqual(updatedBrand);
    });

    it('should throw NotFoundException when brand to update is not found', async () => {
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      mockBrandModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update(mockBrandId, dto)).rejects.toThrow(
        new NotFoundException({ code: ErrorCode.BRAND_NOT_FOUND }),
      );

      expect(mockBrandModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBrandId,
        dto,
        {
          new: true,
          runValidators: true,
        },
      );
    });

    it('should handle update errors', async () => {
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      const error = new Error('Database error');
      mockBrandModel.findByIdAndUpdate.mockRejectedValue(error);

      await expect(service.update(mockBrandId, dto)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should successfully remove a brand', async () => {
      mockBrandModel.findByIdAndDelete.mockResolvedValue(mockBrandResponse);

      const result = await service.remove(mockBrandId);

      expect(mockBrandModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockBrandId,
      );
      expect(result).toEqual(mockBrandResponse);
    });

    it('should throw NotFoundException when brand to remove is not found', async () => {
      mockBrandModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove(mockBrandId)).rejects.toThrow(
        new NotFoundException({ code: ErrorCode.BRAND_NOT_FOUND }),
      );

      expect(mockBrandModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockBrandId,
      );
    });

    it('should handle removal errors', async () => {
      const error = new Error('Database error');
      mockBrandModel.findByIdAndDelete.mockRejectedValue(error);

      await expect(service.remove(mockBrandId)).rejects.toThrow(error);
    });
  });
});
