import { Test, TestingModule } from '@nestjs/testing';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

describe('StoresController', () => {
  let controller: StoresController;
  let service: StoresService;

  const mockStore = TestDataFactory.createStore();
  const mockStores = TestDataFactory.createMultipleStores(2);

  const mockStoreResponse = {
    ...mockStore,
    id: '507f1f77bcf86cd799439011',
  };

  const mockStoresService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [
        {
          provide: StoresService,
          useValue: mockStoresService,
        },
      ],
    }).compile();

    controller = module.get<StoresController>(StoresController);
    service = module.get<StoresService>(StoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a store successfully', async () => {
      mockStoresService.create.mockResolvedValue(mockStoreResponse);

      const result = await controller.create(mockStore);

      expect(service.create).toHaveBeenCalledWith(mockStore);
      expect(result).toEqual({
        id: mockStoreResponse.id,
        message: 'Store created successfully',
      });
    });

    it('should handle service errors during creation', async () => {
      const error = new Error('Database error');
      mockStoresService.create.mockRejectedValue(error);

      await expect(controller.create(mockStore)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(mockStore);
    });
  });

  describe('findAll', () => {
    it('should return all stores', async () => {
      mockStoresService.findAll.mockResolvedValue(mockStores);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockStores);
    });

    it('should handle service errors during findAll', async () => {
      const error = new Error('Database error');
      mockStoresService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no stores exist', async () => {
      mockStoresService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a store successfully', async () => {
      const params: MongoIdParamDto = { id: mockStoreResponse.id };
      const dto: UpdateStoreDto = {
        name: 'Updated Store',
      };

      const updatedStore = { ...mockStoreResponse, ...dto };
      mockStoresService.update.mockResolvedValue(updatedStore);

      const result = await controller.update(params, dto);

      expect(service.update).toHaveBeenCalledWith(params.id, dto);
      expect(result).toEqual({
        id: updatedStore.id,
        message: 'Store updated successfully',
      });
    });

    it('should handle service errors during update', async () => {
      const params: MongoIdParamDto = { id: mockStoreResponse.id };
      const dto: UpdateStoreDto = {
        name: 'Updated Store',
      };

      const error = new Error('Store not found');
      mockStoresService.update.mockRejectedValue(error);

      await expect(controller.update(params, dto)).rejects.toThrow(error);
      expect(service.update).toHaveBeenCalledWith(params.id, dto);
    });

    it('should handle partial updates', async () => {
      const params: MongoIdParamDto = { id: mockStoreResponse.id };
      const dto: UpdateStoreDto = {
        name: 'Updated Store Only',
      };

      const updatedStore = { ...mockStoreResponse, name: dto.name };
      mockStoresService.update.mockResolvedValue(updatedStore);

      const result = await controller.update(params, dto);

      expect(service.update).toHaveBeenCalledWith(params.id, dto);
      expect(result).toEqual({
        id: updatedStore.id,
        message: 'Store updated successfully',
      });
    });
  });

  describe('remove', () => {
    it('should delete a store successfully', async () => {
      const params: MongoIdParamDto = { id: mockStoreResponse.id };
      mockStoresService.remove.mockResolvedValue(mockStoreResponse);

      const result = await controller.remove(params);

      expect(service.remove).toHaveBeenCalledWith(params.id);
      expect(result).toEqual({
        id: mockStoreResponse.id,
        message: 'Store deleted successfully',
      });
    });

    it('should handle service errors during deletion', async () => {
      const params: MongoIdParamDto = { id: mockStoreResponse.id };
      const error = new Error('Store not found');
      mockStoresService.remove.mockRejectedValue(error);

      await expect(controller.remove(params)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(params.id);
    });

    it('should handle invalid MongoDB ObjectId', async () => {
      const params: MongoIdParamDto = { id: 'invalid-id' };
      const error = new Error('Invalid ObjectId');
      mockStoresService.remove.mockRejectedValue(error);

      await expect(controller.remove(params)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(params.id);
    });
  });

  describe('Controller Metadata', () => {
    it('should have correct route prefix', () => {
      const metadata = Reflect.getMetadata('path', StoresController);
      expect(metadata).toBe('stores');
    });

    it('should have JwtAuthGuard and RolesGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', StoresController);
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
