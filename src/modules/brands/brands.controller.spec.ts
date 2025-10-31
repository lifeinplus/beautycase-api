import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { UpdateBrandDto } from './dto/update-brand.dto';

describe('BrandsController', () => {
  let controller: BrandsController;
  let service: BrandsService;

  const mockBrand = TestDataFactory.createBrand();
  const mockBrandId = new Types.ObjectId();
  const mockInvalidBrandId = new Types.ObjectId();

  const mockBrandResponse = {
    ...mockBrand,
    id: mockBrandId,
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

  describe('create', () => {
    it('should create a brand successfully', async () => {
      mockBrandsService.create.mockResolvedValue(mockBrandResponse);

      const result = await controller.create(mockBrand);

      expect(service.create).toHaveBeenCalledWith(mockBrand);
      expect(result).toEqual({ id: mockBrandResponse.id });
    });

    it('should handle service errors during creation', async () => {
      const error = new Error('Database error');
      mockBrandsService.create.mockRejectedValue(error);

      await expect(controller.create(mockBrand)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(mockBrand);
    });
  });

  describe('findAll', () => {
    it('should return all brands', async () => {
      const mockBrands = [
        mockBrandResponse,
        { ...mockBrandResponse, id: '507f1f77bcf86cd799439012' },
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
      const params: ObjectIdParamDto = { id: mockBrandResponse.id };
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      const updatedBrand = { ...mockBrandResponse, ...dto };
      mockBrandsService.update.mockResolvedValue(updatedBrand);

      const result = await controller.update(params, dto);

      expect(service.update).toHaveBeenCalledWith(params.id, dto);
      expect(result).toEqual({ id: updatedBrand.id });
    });

    it('should handle service errors during update', async () => {
      const params: ObjectIdParamDto = { id: mockBrandResponse.id };
      const dto: UpdateBrandDto = {
        name: 'Updated Brand',
      };

      const error = new Error('Brand not found');
      mockBrandsService.update.mockRejectedValue(error);

      await expect(controller.update(params, dto)).rejects.toThrow(error);
      expect(service.update).toHaveBeenCalledWith(params.id, dto);
    });

    it('should handle partial updates', async () => {
      const params: ObjectIdParamDto = { id: mockBrandResponse.id };
      const dto: UpdateBrandDto = {
        name: 'Updated Brand Only',
      };

      const updatedBrand = { ...mockBrandResponse, name: dto.name };
      mockBrandsService.update.mockResolvedValue(updatedBrand);

      const result = await controller.update(params, dto);

      expect(service.update).toHaveBeenCalledWith(params.id, dto);
      expect(result).toEqual({ id: updatedBrand.id });
    });
  });

  describe('remove', () => {
    it('should delete a brand successfully', async () => {
      const params: ObjectIdParamDto = { id: mockBrandResponse.id };
      mockBrandsService.remove.mockResolvedValue(mockBrandResponse);

      const result = await controller.remove(params);

      expect(service.remove).toHaveBeenCalledWith(params.id);
      expect(result).toEqual({ id: mockBrandResponse.id });
    });

    it('should handle service errors during deletion', async () => {
      const params: ObjectIdParamDto = { id: mockBrandResponse.id };
      const error = new Error('Brand not found');
      mockBrandsService.remove.mockRejectedValue(error);

      await expect(controller.remove(params)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(params.id);
    });

    it('should handle invalid MongoDB ObjectId', async () => {
      const params: ObjectIdParamDto = { id: mockInvalidBrandId };
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
      expect(createRoles).toEqual([Role.ADMIN]);

      const findAllMethod = controller.findAll;
      const findAllRoles = Reflect.getMetadata('roles', findAllMethod);
      expect(findAllRoles).toEqual([Role.ADMIN, Role.MUA]);

      const updateMethod = controller.update;
      const updateRoles = Reflect.getMetadata('roles', updateMethod);
      expect(updateRoles).toEqual([Role.ADMIN]);

      const removeMethod = controller.remove;
      const removeRoles = Reflect.getMetadata('roles', removeMethod);
      expect(removeRoles).toEqual([Role.ADMIN]);
    });
  });
});
