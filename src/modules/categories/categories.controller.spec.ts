import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'Test Category',
      type: 'test-type',
    };

    const mockCreatedCategory = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Category',
      type: 'test-type',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a category successfully', async () => {
      mockCategoriesService.create.mockResolvedValue(mockCreatedCategory);

      const result = await controller.create(createCategoryDto);

      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: mockCreatedCategory.id,
        message: 'Category created successfully',
      });
    });

    it('should handle service errors when creating a category', async () => {
      const error = new Error('Database connection failed');
      mockCategoriesService.create.mockRejectedValue(error);

      await expect(controller.create(createCategoryDto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should handle service returning null/undefined', async () => {
      mockCategoriesService.create.mockResolvedValue(null);

      await expect(controller.create(createCategoryDto)).rejects.toThrow();
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
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
    const mockCategories = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Category 1',
        type: 'type-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Category 2',
        type: 'type-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

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

  describe('Guards', () => {
    it('should have JwtAuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', CategoriesController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should have RolesGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', CategoriesController);
      expect(guards).toContain(RolesGuard);
    });

    it('should require admin or mua roles', () => {
      const roles = Reflect.getMetadata('roles', CategoriesController);
      expect(roles).toContain('admin');
      expect(roles).toContain('mua');
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors for create method', async () => {
      const serviceError = new Error('Service unavailable');
      mockCategoriesService.create.mockRejectedValue(serviceError);

      const createDto: CreateCategoryDto = {
        name: 'Test',
        type: 'test',
      };

      await expect(controller.create(createDto)).rejects.toThrow(
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
