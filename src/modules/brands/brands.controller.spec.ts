import { Test, TestingModule } from '@nestjs/testing';

import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

describe('BrandsController', () => {
  let controller: BrandsController;
  let service: BrandsService;

  const mockBrand = {
    id: '507f1f77bcf86cd799439011',
    name: 'Test Brand',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBrandsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [
        {
          provide: BrandsService,
          useValue: mockBrandsService,
        },
      ],
    }).compile();

    controller = module.get<BrandsController>(BrandsController);
    service = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a brand successfully', async () => {
      const dto: CreateBrandDto = {
        name: 'New Brand',
      };

      mockBrandsService.create.mockResolvedValue(mockBrand);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: mockBrand.id,
        message: 'Brand created successfully',
      });
    });

    it('should handle service errors during creation', async () => {
      const dto: CreateBrandDto = {
        name: 'New Brand',
      };

      const error = new Error('Database error');
      mockBrandsService.create.mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all brands', async () => {
      const mockBrands = [
        mockBrand,
        { ...mockBrand, id: '507f1f77bcf86cd799439012' },
      ];
      mockBrandsService.findAll.mockResolvedValue(mockBrands);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockBrands);
    });

    it('should handle service errors during findAll', async () => {
      const error = new Error('Database error');
      mockBrandsService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no brands exist', async () => {
      mockBrandsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a brand successfully', async () => {
      const params: MongoIdParamDto = { id: mockBrand.id };
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      const updatedBrand = { ...mockBrand, ...dto };
      mockBrandsService.update.mockResolvedValue(updatedBrand);

      const result = await controller.update(params, dto);

      expect(service.update).toHaveBeenCalledWith(params.id, dto);
      expect(result).toEqual({
        id: updatedBrand.id,
        message: 'Brand updated successfully',
      });
    });

    it('should handle service errors during update', async () => {
      const params: MongoIdParamDto = { id: mockBrand.id };
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      const error = new Error('Brand not found');
      mockBrandsService.update.mockRejectedValue(error);

      await expect(controller.update(params, dto)).rejects.toThrow(error);
      expect(service.update).toHaveBeenCalledWith(params.id, dto);
    });

    it('should handle partial updates', async () => {
      const params: MongoIdParamDto = { id: mockBrand.id };
      const dto: UpdateBrandDto = {
        name: 'Updated Brand Only',
      };

      const updatedBrand = { ...mockBrand, name: dto.name };
      mockBrandsService.update.mockResolvedValue(updatedBrand);

      const result = await controller.update(params, dto);

      expect(service.update).toHaveBeenCalledWith(params.id, dto);
      expect(result).toEqual({
        id: updatedBrand.id,
        message: 'Brand updated successfully',
      });
    });
  });

  describe('remove', () => {
    it('should delete a brand successfully', async () => {
      const params: MongoIdParamDto = { id: mockBrand.id };
      mockBrandsService.remove.mockResolvedValue(mockBrand);

      const result = await controller.remove(params);

      expect(service.remove).toHaveBeenCalledWith(params.id);
      expect(result).toEqual({
        id: mockBrand.id,
        message: 'Brand deleted successfully',
      });
    });

    it('should handle service errors during deletion', async () => {
      const params: MongoIdParamDto = { id: mockBrand.id };
      const error = new Error('Brand not found');
      mockBrandsService.remove.mockRejectedValue(error);

      await expect(controller.remove(params)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(params.id);
    });

    it('should handle invalid MongoDB ObjectId', async () => {
      const params: MongoIdParamDto = { id: 'invalid-id' };
      const error = new Error('Invalid ObjectId');
      mockBrandsService.remove.mockRejectedValue(error);

      await expect(controller.remove(params)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(params.id);
    });
  });

  describe('Controller Metadata', () => {
    it('should have correct route prefix', () => {
      const metadata = Reflect.getMetadata('path', BrandsController);
      expect(metadata).toBe('brands');
    });

    it('should have JwtAuthGuard and RolesGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', BrandsController);
      expect(guards).toBeDefined();
      expect(guards.length).toBe(2);
    });
  });

  describe('Method Decorators', () => {
    it('should have correct HTTP methods and roles for each endpoint', () => {
      const createMethod = controller.create;
      const createRoles = Reflect.getMetadata('roles', createMethod);
      expect(createRoles).toEqual(['admin']);

      const findAllMethod = controller.findAll;
      const findAllRoles = Reflect.getMetadata('roles', findAllMethod);
      expect(findAllRoles).toEqual(['admin', 'mua']);

      const updateMethod = controller.update;
      const updateRoles = Reflect.getMetadata('roles', updateMethod);
      expect(updateRoles).toEqual(['admin']);

      const removeMethod = controller.remove;
      const removeRoles = Reflect.getMetadata('roles', removeMethod);
      expect(removeRoles).toEqual(['admin']);
    });
  });
});
