import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { CategoriesService } from './categories.service';
import { Category } from './schemas/category.schema';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategory = TestDataFactory.createCategory();
  const mockCategories = TestDataFactory.createMultipleCategories(2);

  const mockCategoryModel = {
    create: jest.fn(),
    find: jest.fn(),
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
      mockCategoryModel.find.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(mockCategoryModel.find).toHaveBeenCalledWith();
      expect(result).toEqual(mockCategories);
    });

    it('should throw NotFoundException when no categories exist', async () => {
      mockCategoryModel.find.mockResolvedValue([]);

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
      await expect(service.findAll()).rejects.toThrow('Categories not found');
      expect(mockCategoryModel.find).toHaveBeenCalledWith();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockCategoryModel.find.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
      expect(mockCategoryModel.find).toHaveBeenCalledWith();
    });
  });
});
