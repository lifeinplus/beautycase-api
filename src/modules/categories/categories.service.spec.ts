import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './schemas/category.schema';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategory = {
    _id: '507f1f77bcf86cd799439011',
    name: 'basic',
    type: 'makeup_bag',
  };

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'basic',
        type: 'makeup_bag',
      };

      const createdCategory = { ...mockCategory, ...createCategoryDto };
      mockCategoryModel.create.mockResolvedValue(createdCategory);

      const result = await service.create(createCategoryDto);

      expect(mockCategoryModel.create).toHaveBeenCalledWith(createCategoryDto);
      expect(result).toEqual(createdCategory);
    });

    it('should handle creation errors', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'basic',
        type: 'makeup_bag',
      };

      const error = new Error('Database error');
      mockCategoryModel.create.mockRejectedValue(error);

      await expect(service.create(createCategoryDto)).rejects.toThrow(error);
      expect(mockCategoryModel.create).toHaveBeenCalledWith(createCategoryDto);
    });
  });

  describe('findAll', () => {
    it('should return all categories when categories exist', async () => {
      const categories = [
        mockCategory,
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'luxury',
          type: 'makeup_bag',
        },
      ];

      mockCategoryModel.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(mockCategoryModel.find).toHaveBeenCalledWith();
      expect(result).toEqual(categories);
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
