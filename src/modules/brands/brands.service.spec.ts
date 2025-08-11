import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand } from './schemas/brand.schema';

describe('BrandsService', () => {
  let service: BrandsService;

  const mockBrand = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Brand',
    createdAt: new Date(),
    updatedAt: new Date(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a brand', async () => {
      const dto: CreateBrandDto = {
        name: 'New Brand',
      };

      mockBrandModel.create.mockResolvedValue(mockBrand);

      const result = await service.create(dto);

      expect(mockBrandModel.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockBrand);
    });

    it('should handle creation errors', async () => {
      const dto: CreateBrandDto = {
        name: 'New Brand',
      };

      const error = new Error('Database error');
      mockBrandModel.create.mockRejectedValue(error);

      await expect(service.create(dto)).rejects.toThrow(error);
      expect(mockBrandModel.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all brands sorted by name', async () => {
      const mockBrands = [
        { ...mockBrand, name: 'Brand A' },
        { ...mockBrand, name: 'Brand B' },
      ];

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
        new NotFoundException('Brands not found'),
      );

      expect(mockBrandModel.find).toHaveBeenCalledWith();
      expect(mockQuery.sort).toHaveBeenCalledWith('name');
    });
  });

  describe('update', () => {
    it('should successfully update a brand', async () => {
      const brandId = '507f1f77bcf86cd799439011';
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      const updatedBrand = { ...mockBrand, ...dto };
      mockBrandModel.findByIdAndUpdate.mockResolvedValue(updatedBrand);

      const result = await service.update(brandId, dto);

      expect(mockBrandModel.findByIdAndUpdate).toHaveBeenCalledWith(
        brandId,
        dto,
        {
          new: true,
          runValidators: true,
        },
      );
      expect(result).toEqual(updatedBrand);
    });

    it('should throw NotFoundException when brand to update is not found', async () => {
      const brandId = '507f1f77bcf86cd799439011';
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      mockBrandModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update(brandId, dto)).rejects.toThrow(
        new NotFoundException('Brand not found'),
      );

      expect(mockBrandModel.findByIdAndUpdate).toHaveBeenCalledWith(
        brandId,
        dto,
        {
          new: true,
          runValidators: true,
        },
      );
    });

    it('should handle update errors', async () => {
      const brandId = '507f1f77bcf86cd799439011';
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      const error = new Error('Database error');
      mockBrandModel.findByIdAndUpdate.mockRejectedValue(error);

      await expect(service.update(brandId, dto)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should successfully remove a brand', async () => {
      const brandId = '507f1f77bcf86cd799439011';

      mockBrandModel.findByIdAndDelete.mockResolvedValue(mockBrand);

      const result = await service.remove(brandId);

      expect(mockBrandModel.findByIdAndDelete).toHaveBeenCalledWith(brandId);
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException when brand to remove is not found', async () => {
      const brandId = '507f1f77bcf86cd799439011';

      mockBrandModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove(brandId)).rejects.toThrow(
        new NotFoundException('Brand not found'),
      );

      expect(mockBrandModel.findByIdAndDelete).toHaveBeenCalledWith(brandId);
    });

    it('should handle removal errors', async () => {
      const brandId = '507f1f77bcf86cd799439011';

      const error = new Error('Database error');
      mockBrandModel.findByIdAndDelete.mockRejectedValue(error);

      await expect(service.remove(brandId)).rejects.toThrow(error);
    });
  });
});
