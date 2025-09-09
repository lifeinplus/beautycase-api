import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { CategoriesService } from './categories.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './schemas/category.schema';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategory = TestDataFactory.createCategory();
  const mockCategories = TestDataFactory.createMultipleCategories(2);

  const mockCategoryResponse = {
    ...mockCategory,
    _id: '507f1f77bcf86cd799439011',
  };

  const mockCategoryModel = {
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      mockCategoryModel.create.mockResolvedValue(mockCategory);

      const result = await service.create(mockCategory);

      expect(mockCategoryModel.create).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });

    it('should handle creation errors', async () => {
      const error = new Error('Database error');
      mockCategoryModel.create.mockRejectedValue(error);

      await expect(service.create(mockCategory)).rejects.toThrow(error);
      expect(mockCategoryModel.create).toHaveBeenCalledWith(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should return all categories when categories exist', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockCategories),
      };

      mockCategoryModel.find.mockReturnValue(mockQuery);
      const result = await service.findAll();

      expect(mockCategoryModel.find).toHaveBeenCalledWith();
      expect(result).toEqual(mockCategories);
    });

    it('should throw NotFoundException when no categories exist', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue([]),
      };

      mockCategoryModel.find.mockReturnValue(mockQuery);

      await expect(service.findAll()).rejects.toThrow(
        new NotFoundException('Categories not found'),
      );

      expect(mockCategoryModel.find).toHaveBeenCalledWith();
      expect(mockQuery.sort).toHaveBeenCalledWith('type name');
    });
  });

  describe('update', () => {
    it('should successfully update a category', async () => {
      const categoryId = '507f1f77bcf86cd799439011';
      const dto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      const updatedCategory = { ...mockCategoryResponse, ...dto };
      mockCategoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

      const result = await service.update(categoryId, dto);

      expect(mockCategoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        categoryId,
        dto,
        {
          new: true,
          runValidators: true,
        },
      );
      expect(result).toEqual(updatedCategory);
    });

    it('should throw NotFoundException when category to update is not found', async () => {
      const categoryId = '507f1f77bcf86cd799439011';
      const dto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      mockCategoryModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update(categoryId, dto)).rejects.toThrow(
        new NotFoundException('Category not found'),
      );

      expect(mockCategoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        categoryId,
        dto,
        {
          new: true,
          runValidators: true,
        },
      );
    });

    it('should handle update errors', async () => {
      const categoryId = '507f1f77bcf86cd799439011';
      const dto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      const error = new Error('Database error');
      mockCategoryModel.findByIdAndUpdate.mockRejectedValue(error);

      await expect(service.update(categoryId, dto)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should successfully remove a category', async () => {
      const categoryId = '507f1f77bcf86cd799439011';

      mockCategoryModel.findByIdAndDelete.mockResolvedValue(
        mockCategoryResponse,
      );

      const result = await service.remove(categoryId);

      expect(mockCategoryModel.findByIdAndDelete).toHaveBeenCalledWith(
        categoryId,
      );
      expect(result).toEqual(mockCategoryResponse);
    });

    it('should throw NotFoundException when category to remove is not found', async () => {
      const categoryId = '507f1f77bcf86cd799439011';

      mockCategoryModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove(categoryId)).rejects.toThrow(
        new NotFoundException('Category not found'),
      );

      expect(mockCategoryModel.findByIdAndDelete).toHaveBeenCalledWith(
        categoryId,
      );
    });

    it('should handle removal errors', async () => {
      const categoryId = '507f1f77bcf86cd799439011';

      const error = new Error('Database error');
      mockCategoryModel.findByIdAndDelete.mockRejectedValue(error);

      await expect(service.remove(categoryId)).rejects.toThrow(error);
    });
  });
});
