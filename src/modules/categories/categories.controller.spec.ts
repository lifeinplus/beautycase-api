import { Test, TestingModule } from '@nestjs/testing';

import { Types } from 'mongoose';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategory = TestDataFactory.createCategory();
  const mockCategories = TestDataFactory.createMultipleCategories(2);
  const mockCategoryId = new Types.ObjectId();
  const mockInvalidCategoryId = new Types.ObjectId();

  const mockCategoryResponse = {
    ...mockCategory,
    id: mockCategoryId,
  };

  const mockCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findMakeupBags: jest.fn(),
    findProducts: jest.fn(),
    findProductsWithCounts: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockCreatedCategory = {
      ...mockCategory,
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    it('should create a category successfully', async () => {
      mockCategoriesService.create.mockResolvedValue(mockCreatedCategory);

      const result = await controller.create(mockCategory);

      expect(service.create).toHaveBeenCalledWith(mockCategory);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: mockCreatedCategory.id,
        message: 'Category created successfully',
      });
    });

    it('should handle service errors when creating a category', async () => {
      const error = new Error('Database error');
      mockCategoriesService.create.mockRejectedValue(error);

      await expect(controller.create(mockCategory)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(mockCategory);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should handle service returning null/undefined', async () => {
      mockCategoriesService.create.mockResolvedValue(null);

      await expect(controller.create(mockCategory)).rejects.toThrow();
      expect(service.create).toHaveBeenCalledWith(mockCategory);
    });

    it('should pass through validation errors from DTO', async () => {
      const invalidDto = { name: '', type: '' } as CreateCategoryDto;
      const validationError = new Error('Validation failed');
      mockCategoriesService.create.mockRejectedValue(validationError);

      await expect(controller.create(invalidDto)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockCategoriesService.findAll.mockResolvedValue(mockCategories);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith();
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCategories);
    });

    it('should return empty array when no categories exist', async () => {
      mockCategoriesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    it('should handle service errors when finding all categories', async () => {
      const error = new Error('Database query failed');
      mockCategoriesService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(
        'Database query failed',
      );

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findMakeupBags', () => {
    it('should return all makeupBag categories', async () => {
      const mockMakeupBagCategories = [
        { id: 'p1', name: 'Makeup', type: 'makeupBag' },
        { id: 'p2', name: 'Skincare', type: 'makeupBag' },
      ];
      mockCategoriesService.findMakeupBags.mockResolvedValue(
        mockMakeupBagCategories,
      );

      const result = await controller.findMakeupBags();

      expect(service.findMakeupBags).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMakeupBagCategories);
    });

    it('should return empty array if no makeupBag categories exist', async () => {
      mockCategoriesService.findMakeupBags.mockResolvedValue([]);

      const result = await controller.findMakeupBags();

      expect(service.findMakeupBags).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should handle service errors when finding makeupBag categories', async () => {
      const error = new Error('Database query failed');
      mockCategoriesService.findMakeupBags.mockRejectedValue(error);

      await expect(controller.findMakeupBags()).rejects.toThrow(
        'Database query failed',
      );
      expect(service.findMakeupBags).toHaveBeenCalledTimes(1);
    });
  });

  describe('findProducts', () => {
    it('should return all product categories', async () => {
      const mockProductCategories = [
        { id: 'p1', name: 'Makeup', type: 'product' },
        { id: 'p2', name: 'Skincare', type: 'product' },
      ];
      mockCategoriesService.findProducts.mockResolvedValue(
        mockProductCategories,
      );

      const result = await controller.findProducts();

      expect(service.findProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProductCategories);
    });

    it('should return empty array if no product categories exist', async () => {
      mockCategoriesService.findProducts.mockResolvedValue([]);

      const result = await controller.findProducts();

      expect(service.findProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should handle service errors when finding product categories', async () => {
      const error = new Error('Database query failed');
      mockCategoriesService.findProducts.mockRejectedValue(error);

      await expect(controller.findProducts()).rejects.toThrow(
        'Database query failed',
      );
      expect(service.findProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('findProductsWithCounts', () => {
    it('should return product categories with counts', async () => {
      const mockCategoriesWithCounts = [
        { id: '1', name: 'Makeup', type: 'product', productCount: 3 },
        { id: '2', name: 'Skincare', type: 'product', productCount: 0 },
      ];
      mockCategoriesService.findProductsWithCounts = jest
        .fn()
        .mockResolvedValue(mockCategoriesWithCounts);

      const result = await controller.findProductsWithCounts();

      expect(service.findProductsWithCounts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCategoriesWithCounts);
    });

    it('should return empty array when no categories with counts exist', async () => {
      mockCategoriesService.findProductsWithCounts = jest
        .fn()
        .mockResolvedValue([]);

      const result = await controller.findProductsWithCounts();

      expect(service.findProductsWithCounts).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should handle service errors when fetching categories with counts', async () => {
      const error = new Error('Database aggregation failed');
      mockCategoriesService.findProductsWithCounts = jest
        .fn()
        .mockRejectedValue(error);

      await expect(controller.findProductsWithCounts()).rejects.toThrow(
        'Database aggregation failed',
      );
      expect(service.findProductsWithCounts).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a brand successfully', async () => {
      const params: ObjectIdParamDto = { id: mockCategoryResponse.id };
      const dto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      const updatedCategory = { ...mockCategoryResponse, ...dto };
      mockCategoriesService.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(params, dto);

      expect(service.update).toHaveBeenCalledWith(params.id, dto);
      expect(result).toEqual({
        id: updatedCategory.id,
        message: 'Category updated successfully',
      });
    });

    it('should handle service errors during update', async () => {
      const params: ObjectIdParamDto = { id: mockCategoryResponse.id };
      const dto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      const error = new Error('Category not found');
      mockCategoriesService.update.mockRejectedValue(error);

      await expect(controller.update(params, dto)).rejects.toThrow(error);
      expect(service.update).toHaveBeenCalledWith(params.id, dto);
    });

    it('should handle partial updates', async () => {
      const params: ObjectIdParamDto = { id: mockCategoryResponse.id };
      const dto: UpdateCategoryDto = {
        name: 'Updated Category Only',
      };

      const updatedCategory = { ...mockCategoryResponse, name: dto.name };
      mockCategoriesService.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(params, dto);

      expect(service.update).toHaveBeenCalledWith(params.id, dto);
      expect(result).toEqual({
        id: updatedCategory.id,
        message: 'Category updated successfully',
      });
    });
  });

  describe('remove', () => {
    it('should delete a brand successfully', async () => {
      const params: ObjectIdParamDto = { id: mockCategoryResponse.id };
      mockCategoriesService.remove.mockResolvedValue(mockCategoryResponse);

      const result = await controller.remove(params);

      expect(service.remove).toHaveBeenCalledWith(params.id);
      expect(result).toEqual({
        id: mockCategoryResponse.id,
        message: 'Category deleted successfully',
      });
    });

    it('should handle service errors during deletion', async () => {
      const params: ObjectIdParamDto = { id: mockCategoryResponse.id };
      const error = new Error('Category not found');
      mockCategoriesService.remove.mockRejectedValue(error);

      await expect(controller.remove(params)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(params.id);
    });

    it('should handle invalid MongoDB ObjectId', async () => {
      const params: ObjectIdParamDto = { id: mockInvalidCategoryId };
      const error = new Error('Invalid ObjectId');
      mockCategoriesService.remove.mockRejectedValue(error);

      await expect(controller.remove(params)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(params.id);
    });
  });

  describe('Guards', () => {
    it('should have JwtAuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', CategoriesController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should have RolesGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', CategoriesController);
      expect(guards).toContain(RolesGuard);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors for create method', async () => {
      const serviceError = new Error('Service unavailable');
      mockCategoriesService.create.mockRejectedValue(serviceError);

      await expect(controller.create(mockCategory)).rejects.toThrow(
        'Service unavailable',
      );
    });

    it('should propagate service errors for findAll method', async () => {
      const serviceError = new Error('Database timeout');
      mockCategoriesService.findAll.mockRejectedValue(serviceError);

      await expect(controller.findAll()).rejects.toThrow('Database timeout');
    });
  });
});
